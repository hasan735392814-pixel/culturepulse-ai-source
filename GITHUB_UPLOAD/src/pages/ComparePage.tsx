import { useState, useCallback } from 'react';
import {
  GitCompare,
  Sparkles,
  Save,
  AlertTriangle,
  Database,
  Brain,
  Lightbulb,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';
import { ENTITY_TYPES } from '@/lib/constants';
import type { QlooEntity, QlooStatus, ConceptComparison } from '@/lib/types';
import {
  searchEntities,
  getInsights,
  normalizeInsightsEntities,
  normalizeSearchEntities,
  filterByTypeRelevance,
  getExplainabilityScores,
  sortEntitiesByQlooScore,
  getEntityName,
} from '@/lib/qloo-client';
import { buildComparison } from '@/lib/interpretation';
import { EntityCard } from '@/components/EntityCard';
import { LoadingSpinner, ErrorState, EmptyState, SectionLabel, InsightList, EvidenceBadge, AIBadge } from '@/components/ui';

interface ConceptConfig {
  name: string;
  description: string;
  filterType: string;
  interests: string;
}

interface ComparePageProps {
  qlooStatus: QlooStatus;
  onSaveReport: (title: string, type: 'comparison', data: ConceptComparison) => void;
}

const DEFAULT_CONCEPT_A: ConceptConfig = {
  name: '',
  description: '',
  filterType: 'urn:entity:movie',
  interests: '',
};

const DEFAULT_CONCEPT_B: ConceptConfig = {
  name: '',
  description: '',
  filterType: 'urn:entity:brand',
  interests: '',
};

async function fetchConceptEntities(concept: ConceptConfig): Promise<{ entities: QlooEntity[]; searchResults: QlooEntity[]; warnings: string[] }> {
  const warnings: string[] = [];
  const interestTerms = concept.interests.split(/[,;]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  // Use concept name as fallback search term if no interests provided
  const nameWords = concept.name.split(/[\s&]+/).map((s) => s.trim()).filter((s) => s.length > 2);
  const searchTerms = interestTerms.length > 0 ? interestTerms : nameWords;

  let entityIds: string[] = [];
  let searchResults: QlooEntity[] = [];

  if (searchTerms.length > 0) {
    const searchTypes = [concept.filterType];
    const searchRes = await searchEntities(searchTerms[0], searchTypes, 5);
    if (searchRes.ok && searchRes.data) {
      searchResults = normalizeSearchEntities(searchRes.data);
      entityIds = searchResults.slice(0, 3).map((e) => e.entity_id || e.id || '').filter(Boolean);
      if (entityIds.length === 0 && searchTerms.length > 1) {
        const fallbackRes = await searchEntities(searchTerms[1], undefined, 5);
        if (fallbackRes.ok && fallbackRes.data) {
          searchResults = normalizeSearchEntities(fallbackRes.data);
          entityIds = searchResults.slice(0, 3).map((e) => e.entity_id || e.id || '').filter(Boolean);
        }
      }
      if (entityIds.length === 0) {
        warnings.push(`No Qloo entities found for "${searchTerms[0]}"`);
      }
    } else if (!searchRes.ok) {
      warnings.push(`Search failed: ${searchRes.error}`);
    }
  }

  // Qloo /v2/insights requires at least one signal — throw if we have none
  if (entityIds.length === 0) {
    throw new Error(
      `Could not find any Qloo entities to use as signals for "${concept.name}". Please provide cultural interests for this concept (e.g., "indie music, streetwear"). The Qloo Insights API requires at least one signal entity.`
    );
  }

  const insightsRes = await getInsights({
    filterType: concept.filterType,
    signalInterestsEntities: entityIds,
    take: 10,
  });

  if (!insightsRes.ok) {
    throw new Error(`Qloo API error for "${concept.name}": ${insightsRes.error}`);
  }

  if (!insightsRes.data) {
    throw new Error(`Qloo API returned an empty response for "${concept.name}"`);
  }

  let entities = normalizeInsightsEntities(insightsRes.data);
  entities = filterByTypeRelevance(entities, concept.filterType);
  const scoreMap = getExplainabilityScores(insightsRes.data);
  if (scoreMap.size > 0) {
    entities = sortEntitiesByQlooScore(entities, scoreMap);
  }
  return { entities, searchResults, warnings };
}

export function ComparePage({ qlooStatus, onSaveReport }: ComparePageProps) {
  const [conceptA, setConceptA] = useState<ConceptConfig>(DEFAULT_CONCEPT_A);
  const [conceptB, setConceptB] = useState<ConceptConfig>(DEFAULT_CONCEPT_B);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ConceptComparison | null>(null);
  const [saved, setSaved] = useState(false);

  const isConnected = qlooStatus === 'connected';

  const runComparison = useCallback(async () => {
    if (!conceptA.name.trim() || !conceptB.name.trim()) {
      setError('Please provide a name for both concepts');
      return;
    }
    if (!conceptA.filterType || !conceptB.filterType) {
      setError('Please select an entity type for both concepts');
      return;
    }

    setLoading(true);
    setError(null);
    setComparison(null);
    setSaved(false);

    try {
      setLoadingStep('Fetching Qloo evidence for Concept A...');
      const resultA = await fetchConceptEntities(conceptA);

      setLoadingStep('Fetching Qloo evidence for Concept B...');
      const resultB = await fetchConceptEntities(conceptB);

      setLoadingStep('Comparing cultural affinities...');
      const comp = buildComparison(conceptA, conceptB, resultA.entities, resultB.entities);
      setComparison({
        ...comp,
        generatedAt: new Date().toISOString(),
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare concepts');
      setLoading(false);
    }
  }, [conceptA, conceptB]);

  const handleSave = () => {
    if (!comparison) return;
    onSaveReport(`${conceptA.name} vs ${conceptB.name}`, 'comparison', comparison);
    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-midnight-50 mb-2">Compare Concepts</h1>
        <p className="text-midnight-400">Compare two campaign, product, or experience concepts using real Qloo cultural evidence.</p>
      </div>

      {!isConnected && (
        <div className="card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">Qloo API is not connected. Comparison requires a valid server-side QLOO_API_KEY.</p>
          </div>
        </div>
      )}

      {/* Concept inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Concept A', config: conceptA, setConfig: setConceptA, color: 'violet' },
          { label: 'Concept B', config: conceptB, setConfig: setConceptB, color: 'teal' },
        ].map(({ label, config, setConfig, color }) => (
          <div key={label} className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'violet' ? 'bg-violet-accent-600/20' : 'bg-teal-accent-600/20'}`}>
                <span className={`text-sm font-bold ${color === 'violet' ? 'text-violet-accent-300' : 'text-teal-accent-300'}`}>{label.slice(-1)}</span>
              </div>
              <h3 className="font-display font-semibold text-midnight-100">{label}</h3>
            </div>

            <div>
              <label className="label-field">Concept Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Luxury Coffee Experience"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div>
              <label className="label-field">Description</label>
              <textarea
                className="input-field min-h-[60px] resize-none"
                placeholder="Brief description of this concept..."
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
              />
            </div>

            <div>
              <label className="label-field">Entity Type *</label>
              <select
                className="input-field"
                value={config.filterType}
                onChange={(e) => setConfig({ ...config, filterType: e.target.value })}
              >
                {ENTITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Cultural Interests</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., indie music, sustainability"
                value={config.interests}
                onChange={(e) => setConfig({ ...config, interests: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={runComparison} disabled={loading || !isConnected} className="btn-primary">
          <GitCompare className="w-4 h-4" />
          Compare Concepts
        </button>
        {isConnected ? (
          <span className="badge badge-teal"><span className="w-1.5 h-1.5 rounded-full bg-teal-accent-400" />Ready</span>
        ) : (
          <span className="badge badge-warn"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />API Not Connected</span>
        )}
      </div>

      {loading && (
        <div className="card p-6">
          <LoadingSpinner label={loadingStep} />
        </div>
      )}

      {error && !loading && <ErrorState message={error} onRetry={runComparison} />}

      {comparison && !loading && (
        <div className="space-y-6">
          {/* Save button */}
          <div className="flex justify-end">
            <button onClick={handleSave} className={saved ? 'btn-secondary' : 'btn-primary'} disabled={saved}>
              <Save className="w-4 h-4" />
              {saved ? 'Saved' : 'Save Comparison'}
            </button>
          </div>

          {/* Side-by-side results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-violet-accent-400" />
                <h3 className="font-display font-semibold text-midnight-100">{comparison.conceptA.name}</h3>
                <EvidenceBadge label={`${comparison.resultsA.length} entities`} />
              </div>
              {comparison.resultsA.length > 0 ? (
                <div className="space-y-3">
                  {comparison.resultsA.slice(0, 5).map((entity, idx) => (
                    <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No entities" description="Qloo returned no entities for this concept." />
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-teal-accent-400" />
                <h3 className="font-display font-semibold text-midnight-100">{comparison.conceptB.name}</h3>
                <EvidenceBadge label={`${comparison.resultsB.length} entities`} />
              </div>
              {comparison.resultsB.length > 0 ? (
                <div className="space-y-3">
                  {comparison.resultsB.slice(0, 5).map((entity, idx) => (
                    <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No entities" description="Qloo returned no entities for this concept." />
              )}
            </div>
          </div>

          {/* Overlap visualization */}
          {comparison.resultsA.length > 0 && comparison.resultsB.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowLeftRight className="w-5 h-5 text-violet-accent-400" />
                <h3 className="section-title text-lg">Entity Overlap</h3>
              </div>
              {(() => {
                const namesA = comparison.resultsA.map(getEntityName);
                const namesB = comparison.resultsB.map(getEntityName);
                const overlap = namesA.filter((n) => namesB.includes(n));
                const onlyA = namesA.filter((n) => !namesB.includes(n));
                const onlyB = namesB.filter((n) => !namesA.includes(n));

                return (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-midnight-500 mb-2">Only Concept A</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {onlyA.slice(0, 6).map((n, i) => (
                          <span key={i} className="badge badge-violet text-[10px]">{n}</span>
                        ))}
                        {onlyA.length === 0 && <span className="text-xs text-midnight-600">None</span>}
                      </div>
                    </div>
                    <div className="text-center border-x border-midnight-700">
                      <p className="text-xs text-midnight-500 mb-2">Shared</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {overlap.slice(0, 6).map((n, i) => (
                          <span key={i} className="badge badge-teal text-[10px]">{n}</span>
                        ))}
                        {overlap.length === 0 && <span className="text-xs text-midnight-600">No overlap</span>}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-midnight-500 mb-2">Only Concept B</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {onlyB.slice(0, 6).map((n, i) => (
                          <span key={i} className="badge badge-violet text-[10px]">{n}</span>
                        ))}
                        {onlyB.length === 0 && <span className="text-xs text-midnight-600">None</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* AI Interpretation */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-violet-accent-400" />
              <h2 className="section-title text-lg">AI Interpretation</h2>
              <AIBadge />
            </div>

            <div className="mb-6">
              <SectionLabel icon={<ArrowLeftRight className="w-4 h-4" />}>Key Differences</SectionLabel>
              <InsightList items={comparison.differences} />
            </div>

            <div className="mb-6">
              <SectionLabel icon={<Lightbulb className="w-4 h-4" />}>Creative Directions</SectionLabel>
              <InsightList items={comparison.creativeDirections} variant="creative" />
            </div>

            <div>
              <SectionLabel icon={<AlertTriangle className="w-4 h-4" />}>Limitations</SectionLabel>
              <InsightList items={comparison.limitations} variant="warning" />
            </div>
          </div>

          <div className="text-xs text-midnight-500 text-center">
            Generated on {new Date(comparison.generatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
