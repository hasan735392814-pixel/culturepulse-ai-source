import { useState, useCallback } from 'react';
import {
  Sparkles,
  Search,
  Database,
  Brain,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  Target,
  Compass,
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  CAMPAIGN_OBJECTIVES,
  ENTITY_TYPES,
  SAMPLE_BRIEFS,
} from '@/lib/constants';
import type { AnalysisBrief, AnalysisResult, QlooEntity, QlooStatus } from '@/lib/types';
import {
  searchEntities,
  getInsights,
  normalizeInsightsEntities,
  normalizeSearchEntities,
  filterByTypeRelevance,
  getExplainabilityScores,
  sortEntitiesByQlooScore,
} from '@/lib/qloo-client';
import {
  buildInterpretation,
  resolveFilterType,
} from '@/lib/interpretation';
import { EntityCard } from '@/components/EntityCard';
import { LoadingSpinner, ErrorState, EmptyState, SectionLabel, InsightList, EvidenceBadge, AIBadge } from '@/components/ui';

interface AnalysisPageProps {
  qlooStatus: QlooStatus;
  onSaveReport: (title: string, type: 'analysis', data: AnalysisResult) => void;
}

export function AnalysisPage({ qlooStatus, onSaveReport }: AnalysisPageProps) {
  const [brief, setBrief] = useState<AnalysisBrief>({
    category: '',
    audience: '',
    location: '',
    objective: '',
    interests: '',
    filterType: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [saved, setSaved] = useState(false);

  const isConnected = qlooStatus === 'connected';

  const handleSampleBrief = (sample: typeof SAMPLE_BRIEFS[number]) => {
    setBrief({
      category: sample.category,
      audience: sample.audience,
      location: sample.location,
      objective: sample.objective,
      interests: sample.interests,
      filterType: '',
    });
    setResult(null);
    setError(null);
    setSaved(false);
  };

  const validate = (): string | null => {
    if (!brief.category.trim()) return 'Please select a business or product category';
    if (!brief.audience.trim()) return 'Please describe your target audience';
    if (!brief.objective.trim()) return 'Please select a campaign or business objective';
    return null;
  };

  const runAnalysis = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    const warnings: string[] = [];
    const filterType = resolveFilterType(brief);
    const interestTerms = brief.interests
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    // Audience keywords as fallback search terms when no interests provided
    const audienceTerms = brief.audience
      .split(/[,;]+|\band\b|aged|\d+-\d+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3 && s.length < 40);

    try {
      // Step 1: Search for entity IDs to use as signals
      // Qloo /v2/insights requires at least one signal — we must always find entities
      let searchResults: QlooEntity[] = [];
      let entityIds: string[] = [];

      // Build search terms: try interests first, then audience keywords, then category
      const searchTerms: string[] = [];
      if (interestTerms.length > 0) {
        searchTerms.push(...interestTerms.slice(0, 2));
      }
      if (audienceTerms.length > 0) {
        searchTerms.push(...audienceTerms.slice(0, 2));
      }
      // Always include the category as a fallback search term
      const categoryWords = brief.category.split(/[\s&]+/).map((s) => s.trim()).filter((s) => s.length > 2);
      if (categoryWords.length > 0) {
        searchTerms.push(categoryWords[0]);
      }

      if (searchTerms.length > 0) {
        setLoadingStep('Searching Qloo for cultural entities matching your brief...');
        const searchTypes = [filterType];
        // Try the first search term, scoped to the brief's entity type for relevance
        const searchRes = await searchEntities(searchTerms[0], searchTypes, 5);
        if (searchRes.ok && searchRes.data) {
          searchResults = normalizeSearchEntities(searchRes.data);
          entityIds = searchResults
            .slice(0, 3)
            .map((e) => e.entity_id || e.id || '')
            .filter(Boolean);
        }

        // If first term found nothing, try the next term (untyped fallback for broader results)
        if (entityIds.length === 0 && searchTerms.length > 1) {
          const fallbackRes = await searchEntities(searchTerms[1], undefined, 5);
          if (fallbackRes.ok && fallbackRes.data) {
            const fallbackResults = normalizeSearchEntities(fallbackRes.data);
            searchResults = fallbackResults;
            entityIds = fallbackResults
              .slice(0, 3)
              .map((e) => e.entity_id || e.id || '')
              .filter(Boolean);
          }
        }

        if (entityIds.length === 0) {
          warnings.push(`Could not find Qloo entities for your search terms (${searchTerms.slice(0, 2).join(', ')}). The analysis may return fewer results.`);
        }
      }

      // Step 2: Query insights API
      // Qloo /v2/insights requires at least one signal — if we have no entity IDs,
      // we cannot proceed and must show an error rather than sending a signalless request
      if (entityIds.length === 0) {
        setError(
          'Unable to find any Qloo entities to use as cultural signals. The Qloo Insights API requires at least one signal entity. Try providing more specific cultural interests (e.g., "indie music, streetwear") or a different business category.'
        );
        setLoading(false);
        return;
      }

      setLoadingStep('Querying Qloo Insights API for cultural affinities...');
      const insightsRes = await getInsights({
        filterType,
        signalInterestsEntities: entityIds,
        take: 20,
      });

      if (!insightsRes.ok) {
        setError(insightsRes.error || 'Failed to retrieve insights from Qloo');
        setLoading(false);
        return;
      }

      const insightsData = insightsRes.data;
      if (!insightsData) {
        setError('Qloo returned an empty response');
        setLoading(false);
        return;
      }

      let entities = normalizeInsightsEntities(insightsData);
      entities = filterByTypeRelevance(entities, filterType);
      const scoreMap = getExplainabilityScores(insightsData);
      if (scoreMap.size > 0) {
        entities = sortEntitiesByQlooScore(entities, scoreMap);
      }
      const explainability = (insightsData as { results?: { query?: unknown } }).results?.query as AnalysisResult['explainability'];

      // Step 3: Build interpretation
      setLoadingStep('Interpreting results and generating recommendations...');
      const interpretation = buildInterpretation(brief, entities, explainability, searchResults, undefined);

      const analysisResult: AnalysisResult = {
        brief,
        entities,
        explainability,
        rawResponse: insightsData,
        generatedAt: new Date().toISOString(),
        interpretation,
        searchResults,
        warnings,
      };

      setResult(analysisResult);
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during analysis';
      setError(msg);
      setLoading(false);
    }
  }, [brief]);

  const handleSave = () => {
    if (!result) return;
    const title = `${brief.category} — ${brief.audience.slice(0, 30)}`;
    onSaveReport(title, 'analysis', result);
    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-midnight-50 mb-2">New Cultural Analysis</h1>
        <p className="text-midnight-400">Enter your business brief to discover real Qloo-backed cultural affinities.</p>
      </div>

      {!isConnected && (
        <div className="card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              Qloo API is not connected. You can fill out the form, but analysis requires a valid server-side QLOO_API_KEY. Visit Settings to check status.
            </p>
          </div>
        </div>
      )}

      {/* Sample briefs */}
      <div className="card p-4">
        <p className="text-sm text-midnight-400 mb-3">Quick start with a sample brief:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_BRIEFS.map((sample) => (
            <button
              key={sample.label}
              onClick={() => handleSampleBrief(sample)}
              className="btn-ghost border border-midnight-700 hover:border-violet-accent-500/30"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field" htmlFor="category">Business or Product Category *</label>
            <select
              id="category"
              className="input-field"
              value={brief.category}
              onChange={(e) => setBrief({ ...brief, category: e.target.value })}
            >
              <option value="">Select a category...</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field" htmlFor="objective">Campaign or Business Objective *</label>
            <select
              id="objective"
              className="input-field"
              value={brief.objective}
              onChange={(e) => setBrief({ ...brief, objective: e.target.value })}
            >
              <option value="">Select an objective...</option>
              {CAMPAIGN_OBJECTIVES.map((obj) => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="audience">Target Audience *</label>
          <input
            id="audience"
            type="text"
            className="input-field"
            placeholder="e.g., Gen Z urban professionals aged 18-25"
            value={brief.audience}
            onChange={(e) => setBrief({ ...brief, audience: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field" htmlFor="location">Target Location or Market (optional)</label>
            <input
              id="location"
              type="text"
              className="input-field"
              placeholder="e.g., New York City, London, Tokyo"
              value={brief.location}
              onChange={(e) => setBrief({ ...brief, location: e.target.value })}
            />
          </div>

          <div>
            <label className="label-field" htmlFor="filterType">Entity Type Override (optional)</label>
            <select
              id="filterType"
              className="input-field"
              value={brief.filterType}
              onChange={(e) => setBrief({ ...brief, filterType: e.target.value })}
            >
              <option value="">Auto (based on category)</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="interests">Cultural Interests or Reference Entities (optional)</label>
          <input
            id="interests"
            type="text"
            className="input-field"
            placeholder="e.g., indie music, streetwear, sustainability"
            value={brief.interests}
            onChange={(e) => setBrief({ ...brief, interests: e.target.value })}
          />
          <p className="text-xs text-midnight-500 mt-1.5">Comma-separated. These will be searched on Qloo to find matching entity IDs.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={runAnalysis} disabled={loading || !isConnected} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Generate Cultural Insights
          </button>
          {isConnected ? (
            <span className="badge badge-teal"><span className="w-1.5 h-1.5 rounded-full bg-teal-accent-400" />Ready</span>
          ) : (
            <span className="badge badge-warn"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />API Not Connected</span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-6">
          <LoadingSpinner label={loadingStep} />
        </div>
      )}

      {/* Error */}
      {error && !loading && <ErrorState message={error} onRetry={runAnalysis} />}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="card p-4 border-amber-500/20 bg-amber-500/5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-300">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Interpretation */}
          {result.interpretation && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-accent-400" />
                  <h2 className="section-title text-lg">AI Interpretation</h2>
                  <AIBadge />
                </div>
                <button onClick={handleSave} className={saved ? 'btn-secondary' : 'btn-primary'} disabled={saved}>
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved' : 'Save Report'}
                </button>
              </div>

              <p className="text-sm text-midnight-200 leading-relaxed mb-6">{result.interpretation.summary}</p>

              {result.interpretation.keyAffinities.length > 0 && (
                <div className="mb-6">
                  <SectionLabel icon={<Compass className="w-4 h-4" />}>Key Cultural Affinities</SectionLabel>
                  <div className="space-y-2">
                    {result.interpretation.keyAffinities.slice(0, 8).map((affinity, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl border border-violet-accent-500/20 bg-violet-accent-500/5">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-accent-600/20 text-violet-accent-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-midnight-100 text-sm">{affinity.entity}</span>
                            <span className="badge badge-neutral text-[10px]">{affinity.type}</span>
                            {affinity.score !== undefined && (
                              <span className="badge badge-teal text-[10px]">Score: {affinity.score.toFixed(2)}</span>
                            )}
                          </div>
                          <p className="text-xs text-midnight-400">{affinity.insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.interpretation.recommendations.length > 0 && (
                <div className="mb-6">
                  <SectionLabel icon={<Target className="w-4 h-4" />}>Recommendations</SectionLabel>
                  <InsightList items={result.interpretation.recommendations} />
                </div>
              )}

              {result.interpretation.creativeDirections.length > 0 && (
                <div className="mb-6">
                  <SectionLabel icon={<Lightbulb className="w-4 h-4" />}>Creative Directions</SectionLabel>
                  <InsightList items={result.interpretation.creativeDirections} variant="creative" />
                </div>
              )}

              <div>
                <SectionLabel icon={<AlertTriangle className="w-4 h-4" />}>Limitations</SectionLabel>
                <InsightList items={result.interpretation.limitations} variant="warning" />
              </div>
            </div>
          )}

          {/* Qloo Evidence */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-teal-accent-400" />
              <h2 className="section-title text-lg">Qloo Evidence</h2>
              <EvidenceBadge label={`Real API Data — ${result.entities.length} entities`} />
            </div>

            {result.searchResults && result.searchResults.length > 0 && (
              <div className="mb-6">
                <SectionLabel icon={<Search className="w-4 h-4" />}>Search Results (entities matched to your interests)</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.searchResults.map((entity, idx) => (
                    <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
                  ))}
                </div>
              </div>
            )}

            {result.entities.length > 0 ? (
              <div>
                <SectionLabel icon={<Database className="w-4 h-4" />}>Insights Results (cultural affinity entities)</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.entities.map((entity, idx) => (
                    <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No entities returned"
                description="Qloo returned an empty result set. Try broadening your interests or changing the entity type."
              />
            )}
          </div>

          {/* Raw response toggle */}
          <div className="card p-4">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center justify-between w-full text-sm text-midnight-300 hover:text-midnight-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Raw Qloo API Response
              </span>
              {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRaw && (
              <pre className="mt-4 p-4 rounded-xl bg-midnight-950 border border-midnight-700 text-xs text-midnight-300 overflow-auto max-h-96 scrollbar-thin font-mono">
                {JSON.stringify(result.rawResponse, null, 2)}
              </pre>
            )}
          </div>

          {/* Generation metadata */}
          <div className="text-xs text-midnight-500 text-center">
            Generated on {new Date(result.generatedAt).toLocaleString()} | Entity type: {resolveFilterType(brief)}
          </div>
        </div>
      )}
    </div>
  );
}
