import type {
  QlooEntity,
  QlooInsightsResponse,
  QlooSearchResponse,
  QlooTagsResponse,
} from '@/lib/types';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

async function callEdgeFunction(fnName: string, params: Record<string, string | string[]>): Promise<ApiResponse<unknown>> {
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, v);
    } else if (value) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  try {
    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let msg = `Request failed (${res.status})`;
      try {
        const j = JSON.parse(text);
        msg = j.error || j.message || msg;
      } catch {
        if (text) msg = text.slice(0, 200);
      }
      return { ok: false, error: msg, status: res.status };
    }
    const data = await res.json();
    return { ok: true, data, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: msg, status: 0 };
  }
}

export async function checkQlooHealth(): Promise<ApiResponse<{ status: string; message: string }>> {
  return callEdgeFunction('qloo-health', {}) as Promise<ApiResponse<{ status: string; message: string }>>;
}

export async function searchEntities(
  query: string,
  types?: string[],
  take?: number
): Promise<ApiResponse<QlooSearchResponse>> {
  const params: Record<string, string | string[]> = { query };
  if (types && types.length > 0) params['types'] = types;
  if (take) params['take'] = String(take);
  return callEdgeFunction('qloo-proxy', { ...params, endpoint: 'search' }) as Promise<ApiResponse<QlooSearchResponse>>;
}

export async function searchTags(query: string): Promise<ApiResponse<QlooTagsResponse>> {
  return callEdgeFunction('qloo-proxy', { endpoint: 'tags', query }) as Promise<ApiResponse<QlooTagsResponse>>;
}

export interface InsightsParams {
  filterType: string;
  signalInterestsEntities?: string[];
  signalInterestsTags?: string[];
  signalDemographicsAge?: string;
  signalDemographicsAudiences?: string[];
  filterTags?: string[];
  filterLocation?: string;
  filterLocationMetro?: string;
  take?: number;
  biasTrends?: string;
  biasContentBased?: number;
}

export async function getInsights(params: InsightsParams): Promise<ApiResponse<QlooInsightsResponse>> {
  const query: Record<string, string | string[]> = { endpoint: 'insights' };

  query['filter.type'] = params.filterType;
  if (params.signalInterestsEntities?.length) query['signal.interests.entities'] = params.signalInterestsEntities;
  if (params.signalInterestsTags?.length) query['signal.interests.tags'] = params.signalInterestsTags;
  if (params.signalDemographicsAge) query['signal.demographics.age'] = params.signalDemographicsAge;
  if (params.signalDemographicsAudiences?.length) query['signal.demographics.audiences'] = params.signalDemographicsAudiences;
  if (params.filterTags?.length) query['filter.tags'] = params.filterTags;
  if (params.filterLocation) query['filter.location'] = params.filterLocation;
  if (params.filterLocationMetro) query['filter.location.metro'] = params.filterLocationMetro;
  if (params.take) query['take'] = String(params.take);
  if (params.biasTrends) query['bias.trends'] = params.biasTrends;
  if (params.biasContentBased !== undefined) query['bias.content_based'] = String(params.biasContentBased);

  return callEdgeFunction('qloo-proxy', query) as Promise<ApiResponse<QlooInsightsResponse>>;
}

export function normalizeInsightsEntities(data: QlooInsightsResponse): QlooEntity[] {
  const raw = data.results?.entities;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && typeof e === 'object' && (e.entity_id || e.name));
}

const TYPE_ENTITY_MAP: Record<string, string[]> = {
  'urn:entity:movie': ['urn:entity:movie', 'urn:entity:tv_show', 'urn:entity:person', 'urn:entity:brand', 'urn:entity:podcast'],
  'urn:entity:tv_show': ['urn:entity:tv_show', 'urn:entity:movie', 'urn:entity:person', 'urn:entity:brand', 'urn:entity:podcast'],
  'urn:entity:artist': ['urn:entity:artist', 'urn:entity:person', 'urn:entity:brand', 'urn:entity:podcast'],
  'urn:entity:book': ['urn:entity:book', 'urn:entity:person', 'urn:entity:brand', 'urn:entity:podcast'],
  'urn:entity:video_game': ['urn:entity:video_game', 'urn:entity:brand', 'urn:entity:person', 'urn:entity:podcast'],
  'urn:entity:podcast': ['urn:entity:podcast', 'urn:entity:artist', 'urn:entity:person', 'urn:entity:brand'],
  'urn:entity:brand': ['urn:entity:brand', 'urn:entity:place', 'urn:entity:destination', 'urn:entity:person'],
  'urn:entity:place': ['urn:entity:place', 'urn:entity:brand', 'urn:entity:destination'],
  'urn:entity:destination': ['urn:entity:destination', 'urn:entity:place', 'urn:entity:brand'],
  'urn:entity:person': ['urn:entity:person', 'urn:entity:movie', 'urn:entity:tv_show', 'urn:entity:artist', 'urn:entity:book'],
};

function getEntityTypeUrn(entity: QlooEntity): string {
  const t = entity.subtype || entity.type || '';
  if (t && t !== 'urn:entity') return t;
  if (entity.types && entity.types.length > 0) {
    return entity.types.find((x) => x !== 'urn:entity') || entity.types[0];
  }
  return '';
}

export function filterByTypeRelevance(entities: QlooEntity[], filterType: string): QlooEntity[] {
  const allowed = TYPE_ENTITY_MAP[filterType];
  if (!allowed) return entities;
  const filtered = entities.filter((e) => {
    const et = getEntityTypeUrn(e);
    if (!et) return true;
    return allowed.includes(et);
  });
  return filtered.length > 0 ? filtered : entities;
}

export interface ExplainabilityScore {
  entity: string;
  name?: string;
  average?: number;
  scores?: Record<string, number>;
}

export function getExplainabilityScores(data: QlooInsightsResponse): Map<string, ExplainabilityScore> {
  const scores = new Map<string, ExplainabilityScore>();
  const raw = data.results?.query?.explainability?.entities;
  if (!Array.isArray(raw)) return scores;
  for (const s of raw) {
    if (s && s.entity) scores.set(s.entity, s);
    if (s && s.name) scores.set(s.name, s);
  }
  return scores;
}

export function sortEntitiesByQlooScore(entities: QlooEntity[], scores: Map<string, ExplainabilityScore>): QlooEntity[] {
  return [...entities].sort((a, b) => {
    const sa = scores.get(a.entity_id || '') || scores.get(a.name || '');
    const sb = scores.get(b.entity_id || '') || scores.get(b.name || '');
    const va = sa?.average ?? -1;
    const vb = sb?.average ?? -1;
    return vb - va;
  });
}

export function normalizeSearchEntities(data: QlooSearchResponse): QlooEntity[] {
  const raw = data.results;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => e && typeof e === 'object' && (e.entity_id || e.name));
}

export function normalizeEntities(data: QlooInsightsResponse | QlooSearchResponse): QlooEntity[] {
  if ('results' in data && data.results) {
    if (Array.isArray(data.results)) return normalizeSearchEntities(data as QlooSearchResponse);
    if ('entities' in data.results && Array.isArray(data.results.entities)) {
      return normalizeInsightsEntities(data as QlooInsightsResponse);
    }
  }
  return [];
}

export function getEntityId(entity: QlooEntity): string {
  return entity.entity_id || entity.id || '';
}

export function getEntityName(entity: QlooEntity): string {
  if (entity.name) return entity.name;
  if (entity.akas?.[0]?.value) return entity.akas[0].value;
  if (entity.aliases?.[0]) return entity.aliases[0];
  return getEntityId(entity) || 'Unknown';
}

export function getEntityTypeLabel(entity: QlooEntity): string {
  const typeStr = entity.subtype || entity.type || '';
  if (typeStr && typeStr !== 'urn:entity') {
    const match = typeStr.match(/urn:entity:(\w+)/);
    if (match) return mapEntityType(match[1]);
  }
  if (entity.types && entity.types.length > 0) {
    for (const t of entity.types) {
      const match = t.match(/urn:entity:(\w+)/);
      if (match) return mapEntityType(match[1]);
    }
  }
  return 'Entity';
}

function mapEntityType(key: string): string {
  const map: Record<string, string> = {
    movie: 'Movie',
    tv_show: 'TV Show',
    artist: 'Artist',
    book: 'Book',
    video_game: 'Game',
    podcast: 'Podcast',
    brand: 'Brand',
    place: 'Place',
    destination: 'Destination',
    person: 'Person',
  };
  return map[key] || key;
}

export function getEntityImage(entity: QlooEntity): string | undefined {
  const img = entity.properties?.image;
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img) return img.url;
  return undefined;
}

export function getEntityDescription(entity: QlooEntity): string {
  return entity.description || entity.properties?.description || '';
}

export function getEntityLocation(entity: QlooEntity): string | undefined {
  const geo = entity.properties?.geocode;
  if (!geo) return undefined;
  return [geo.city, geo.admin1_region, geo.country].filter(Boolean).join(', ');
}

export function getEntityGenres(entity: QlooEntity): string[] {
  return entity.properties?.genres || [];
}

export function getEntityTags(entity: QlooEntity): string[] {
  if (entity.properties?.tags && Array.isArray(entity.properties.tags)) {
    return entity.properties.tags as string[];
  }
  if (entity.tags && Array.isArray(entity.tags)) {
    return entity.tags.map((t) => t.name).filter(Boolean) as string[];
  }
  return [];
}
