export interface QlooEntity {
  entity_id?: string;
  id?: string;
  name?: string;
  type?: string;
  subtype?: string;
  types?: string[];
  aliases?: string[];
  akas?: Array<{ value: string; language?: string; languages?: string[] }>;
  description?: string;
  properties?: {
    image?: { url: string };
    description?: string;
    geocode?: {
      city?: string;
      metro?: string;
      country?: string;
      country_code?: string;
      lat?: number;
      lon?: number;
      name?: string;
      admin1_region?: string;
    };
    genres?: string[];
    tags?: string[];
    keywords?: string[];
    url?: string;
    address?: string;
    business_rating?: number;
    price_range?: { currency?: string };
    duration?: number;
    is_closed?: boolean;
    external?: Record<string, unknown>;
  };
  popularity?: number;
  tags?: Array<{ id?: string; name?: string; subtype?: string }>;
  external?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  query?: Record<string, unknown>;
  disambiguation?: Record<string, unknown>;
  scores?: Record<string, number>;
}

export interface QlooInsightsResponse {
  success?: boolean;
  results?: {
    entities?: QlooEntity[];
    query?: {
      explainability?: {
        entities?: Array<{
          entity: string;
          name?: string;
          scores?: Record<string, number>;
          average?: number;
        }>;
        warning?: string;
      };
    };
  };
  [key: string]: unknown;
}

export interface QlooSearchResponse {
  results?: QlooEntity[];
  [key: string]: unknown;
}

export interface QlooTagsResponse {
  results?: Array<{
    id: string;
    name?: string;
    type?: string;
    subtype?: string;
  }>;
  [key: string]: unknown;
}

export interface AnalysisBrief {
  category: string;
  audience: string;
  location: string;
  objective: string;
  interests: string;
  filterType: string;
}

export interface AnalysisResult {
  brief: AnalysisBrief;
  entities: QlooEntity[];
  explainability?: {
    explainability?: {
      entities?: Array<{
        entity: string;
        name?: string;
        scores?: Record<string, number>;
        average?: number;
      }>;
      warning?: string;
    };
  };
  rawResponse: unknown;
  generatedAt: string;
  interpretation?: InterpretationResult;
  searchResults?: QlooEntity[];
  tagsUsed?: Array<{ id: string; name?: string }>;
  warnings: string[];
}

export interface InterpretationResult {
  summary: string;
  keyAffinities: AffinityInsight[];
  recommendations: string[];
  creativeDirections: string[];
  limitations: string[];
  isAIGenerated: boolean;
}

export interface AffinityInsight {
  entity: string;
  type: string;
  score?: number;
  insight: string;
}

export interface ConceptComparison {
  conceptA: {
    name: string;
    description: string;
    filterType: string;
    interests: string;
  };
  conceptB: {
    name: string;
    description: string;
    filterType: string;
    interests: string;
  };
  resultsA: QlooEntity[];
  resultsB: QlooEntity[];
  differences: string[];
  creativeDirections: string[];
  limitations: string[];
  generatedAt: string;
  isAIGenerated: boolean;
}

export interface CampaignSuggestions {
  themes: string[];
  creativeDirection: string[];
  contentConcepts: string[];
  engagementIdeas: string[];
  positioning: string[];
  limitations: string[];
  isAIGenerated: boolean;
}

export interface SavedReport {
  id: string;
  title: string;
  type: 'analysis' | 'comparison' | 'campaign';
  data: AnalysisResult | ConceptComparison | CampaignSuggestions;
  createdAt: string;
}

export type QlooStatus = 'connected' | 'disconnected' | 'checking' | 'not-configured' | 'error';
