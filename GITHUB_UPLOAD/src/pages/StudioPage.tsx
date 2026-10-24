import { useState, useCallback } from 'react';
import {
  Palette,
  Sparkles,
  Save,
  AlertTriangle,
  Lightbulb,
  Target,
  MessageSquare,
  Megaphone,
  Compass,
  Database,
  Brain,
} from 'lucide-react';
import {
  BUSINESS_CATEGORIES,
  CAMPAIGN_OBJECTIVES,
  ENTITY_TYPES,
} from '@/lib/constants';
import type { AnalysisBrief, AnalysisResult, CampaignSuggestions, QlooStatus } from '@/lib/types';
import {
  searchEntities,
  getInsights,
  normalizeInsightsEntities,
  normalizeSearchEntities,
  filterByTypeRelevance,
  getExplainabilityScores,
  sortEntitiesByQlooScore,
} from '@/lib/qloo-client';
import { buildInterpretation, resolveFilterType, buildCampaignSuggestions } from '@/lib/interpretation';
import { LoadingSpinner, ErrorState, EmptyState, SectionLabel, InsightList, EvidenceBadge, AIBadge } from '@/components/ui';
import { EntityCard } from '@/components/EntityCard';

interface StudioPageProps {
  qlooStatus: QlooStatus;
  onSaveReport: (title: string, type: 'campaign', data: CampaignSuggestions) => void;
  lastAnalysis: AnalysisResult | null;
}

export function StudioPage({ qlooStatus, onSaveReport, lastAnalysis }: StudioPageProps) {
  const [brief, setBrief] = useState<AnalysisBrief>(
    lastAnalysis?.brief || {
      category: '',
      audience: '',
      location: '',
      objective: '',
      interests: '',
      filterType: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(lastAnalysis);
  const [suggestions, setSuggestions] = useState<CampaignSuggestions | null>(null);
  const [saved, setSaved] = useState(false);

  const isConnected = qlooStatus === 'connected';

  const runStudio = useCallback(async () => {
    if (!brief.category.trim() || !brief.audience.trim() || !brief.objective.trim()) {
      setError('Please fill in category, audience, and objective');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);
    setSaved(false);

    const filterType = resolveFilterType(brief);
    const interestTerms = brief.interests.split(/[,;]+/).map((s) => s.trim()).filter((s) => s.length > 1);
    const audienceTerms = brief.audience.split(/[,;]+|\band\b|aged|\d+-\d+/).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 40);
    const categoryWords = brief.category.split(/[\s&]+/).map((s) => s.trim()).filter((s) => s.length > 2);
    const searchTerms = [
      ...interestTerms.slice(0, 2),
      ...audienceTerms.slice(0, 2),
      ...(categoryWords.length > 0 ? [categoryWords[0]] : []),
    ];

    try {
      let entityIds: string[] = [];
      let searchResults: import('@/lib/types').QlooEntity[] = [];

      if (searchTerms.length > 0) {
        setLoadingStep('Searching Qloo for cultural entities...');
        const searchTypes = [filterType];
        const searchRes = await searchEntities(searchTerms[0], searchTypes, 5);
        if (searchRes.ok && searchRes.data) {
          searchResults = normalizeSearchEntities(searchRes.data);
          entityIds = searchResults.slice(0, 3).map((e) => e.entity_id || e.id || '').filter(Boolean);
        }
        if (entityIds.length === 0 && searchTerms.length > 1) {
          const fallbackRes = await searchEntities(searchTerms[1], undefined, 5);
          if (fallbackRes.ok && fallbackRes.data) {
            searchResults = normalizeSearchEntities(fallbackRes.data);
            entityIds = searchResults.slice(0, 3).map((e) => e.entity_id || e.id || '').filter(Boolean);
          }
        }
      }

      if (entityIds.length === 0) {
        setError(
          'Unable to find any Qloo entities to use as cultural signals. Try providing more specific cultural interests (e.g., "indie music, streetwear") or a different business category.'
        );
        setLoading(false);
        return;
      }

      setLoadingStep('Querying Qloo Insights API...');
      const insightsRes = await getInsights({
        filterType,
        signalInterestsEntities: entityIds,
        take: 15,
      });

      if (!insightsRes.ok) {
        setError(insightsRes.error || 'Failed to get insights from Qloo');
        setLoading(false);
        return;
      }

      if (!insightsRes.data) {
        setError('Qloo API returned an empty response');
        setLoading(false);
        return;
      }

      let entities = normalizeInsightsEntities(insightsRes.data);
      entities = filterByTypeRelevance(entities, filterType);
      const scoreMap = getExplainabilityScores(insightsRes.data);
      if (scoreMap.size > 0) {
        entities = sortEntitiesByQlooScore(entities, scoreMap);
      }
      const explainability = (insightsRes.data as { results?: { query?: unknown } }).results?.query as AnalysisResult['explainability'];
      const interpretation = buildInterpretation(brief, entities, explainability, searchResults, undefined);

      const analysisResult: AnalysisResult = {
        brief,
        entities,
        explainability,
        rawResponse: insightsRes.data,
        generatedAt: new Date().toISOString(),
        interpretation,
        searchResults,
        warnings: [],
      };

      setAnalysis(analysisResult);

      setLoadingStep('Generating campaign suggestions...');
      const campaign = buildCampaignSuggestions(brief, analysisResult);
      setSuggestions(campaign);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setLoading(false);
    }
  }, [brief]);

  const handleSave = () => {
    if (!suggestions) return;
    onSaveReport(`Campaign: ${brief.category} — ${brief.objective}`, 'campaign', suggestions);
    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-midnight-50 mb-2">Campaign Studio</h1>
        <p className="text-midnight-400">Transform evidence-backed insights into practical campaign suggestions.</p>
      </div>

      {!isConnected && (
        <div className="card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">Qloo API is not connected. Campaign Studio requires a valid server-side QLOO_API_KEY.</p>
          </div>
        </div>
      )}

      {lastAnalysis && !analysis && (
        <div className="card p-4 border-teal-accent-500/20 bg-teal-accent-500/5">
          <button
            onClick={() => { setAnalysis(lastAnalysis); setBrief(lastAnalysis.brief); }}
            className="flex items-center gap-2 text-sm text-teal-accent-300 hover:text-teal-accent-200"
          >
            <Database className="w-4 h-4" />
            Use your last analysis results — click here to load them
          </button>
        </div>
      )}

      {/* Brief form */}
      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Business Category *</label>
            <select className="input-field" value={brief.category} onChange={(e) => setBrief({ ...brief, category: e.target.value })}>
              <option value="">Select...</option>
              {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Objective *</label>
            <select className="input-field" value={brief.objective} onChange={(e) => setBrief({ ...brief, objective: e.target.value })}>
              <option value="">Select...</option>
              {CAMPAIGN_OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-field">Target Audience *</label>
          <input className="input-field" placeholder="e.g., Gen Z urban professionals" value={brief.audience} onChange={(e) => setBrief({ ...brief, audience: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Location (optional)</label>
            <input className="input-field" placeholder="e.g., New York City" value={brief.location} onChange={(e) => setBrief({ ...brief, location: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Cultural Interests (optional)</label>
            <input className="input-field" placeholder="e.g., indie music, streetwear" value={brief.interests} onChange={(e) => setBrief({ ...brief, interests: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={runStudio} disabled={loading || !isConnected} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Generate Campaign Suggestions
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-6">
          <LoadingSpinner label={loadingStep} />
        </div>
      )}

      {error && !loading && <ErrorState message={error} onRetry={runStudio} />}

      {/* Evidence summary */}
      {analysis && analysis.entities.length > 0 && !loading && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-teal-accent-400" />
            <h2 className="section-title text-lg">Qloo Evidence Used</h2>
            <EvidenceBadge label={`${analysis.entities.length} entities`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.entities.slice(0, 6).map((entity, idx) => (
              <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Campaign suggestions */}
      {suggestions && !loading && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-accent-400" />
                <h2 className="section-title text-lg">Campaign Suggestions</h2>
                <AIBadge />
              </div>
              <button onClick={handleSave} className={saved ? 'btn-secondary' : 'btn-primary'} disabled={saved}>
                <Save className="w-4 h-4" />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <SectionLabel icon={<Compass className="w-4 h-4" />}>Campaign Themes</SectionLabel>
                <InsightList items={suggestions.themes} />
              </div>

              <div>
                <SectionLabel icon={<Palette className="w-4 h-4" />}>Creative Direction</SectionLabel>
                <InsightList items={suggestions.creativeDirection} variant="creative" />
              </div>

              <div>
                <SectionLabel icon={<Lightbulb className="w-4 h-4" />}>Content Concepts</SectionLabel>
                <InsightList items={suggestions.contentConcepts} variant="creative" />
              </div>

              <div>
                <SectionLabel icon={<MessageSquare className="w-4 h-4" />}>Audience Engagement Ideas</SectionLabel>
                <InsightList items={suggestions.engagementIdeas} />
              </div>

              <div>
                <SectionLabel icon={<Target className="w-4 h-4" />}>Product & Experience Positioning</SectionLabel>
                <InsightList items={suggestions.positioning} />
              </div>

              <div>
                <SectionLabel icon={<AlertTriangle className="w-4 h-4" />}>Limitations</SectionLabel>
                <InsightList items={suggestions.limitations} variant="warning" />
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis && analysis.entities.length === 0 && !loading && !suggestions && (
        <EmptyState
          title="No Qloo evidence available"
          description="The Qloo API returned no entities for this brief. Try different interests or a different entity type."
        />
      )}
    </div>
  );
}
