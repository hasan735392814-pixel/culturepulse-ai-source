import type {
  AnalysisBrief,
  AnalysisResult,
  AffinityInsight,
  InterpretationResult,
  QlooEntity,
  ConceptComparison,
  CampaignSuggestions,
} from '@/lib/types';
import {
  getEntityName,
  getEntityTypeLabel,
  getEntityDescription,
  getEntityLocation,
  getEntityImage,
  getEntityGenres,
  getEntityTags,
  filterByTypeRelevance,
  getExplainabilityScores,
  sortEntitiesByQlooScore,
  type ExplainabilityScore,
} from '@/lib/qloo-client';

function classifyAudience(audience: string): { ageRange?: string; keywords: string[] } {
  const lower = audience.toLowerCase();
  let ageRange: string | undefined;
  if (lower.includes('gen z') || lower.includes('18-25') || lower.includes('18-24') || lower.includes('teen') || lower.includes('young')) {
    ageRange = '35_and_younger';
  } else if (lower.includes('millennial') || lower.includes('25-40') || lower.includes('28-38') || lower.includes('26-35')) {
    ageRange = '36_to_55';
  } else if (lower.includes('boomer') || lower.includes('55+') || lower.includes('senior') || lower.includes('older')) {
    ageRange = '55_and_older';
  }
  const keywords = audience
    .split(/[,;]+|\band\b/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 50);
  return { ageRange, keywords };
}

function extractInterestTerms(interests: string): string[] {
  return interests
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

function mapCategoryToEntityType(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('food') || lower.includes('beverage') || lower.includes('coffee') || lower.includes('restaurant')) {
    return 'urn:entity:place';
  }
  if (lower.includes('fashion') || lower.includes('apparel') || lower.includes('beauty') || lower.includes('cosmetic')) {
    return 'urn:entity:brand';
  }
  if (lower.includes('travel') || lower.includes('hospitality')) {
    return 'urn:entity:destination';
  }
  if (lower.includes('music') || lower.includes('audio')) {
    return 'urn:entity:artist';
  }
  if (lower.includes('gaming') || lower.includes('esports')) {
    return 'urn:entity:video_game';
  }
  if (lower.includes('entertainment') || lower.includes('media') || lower.includes('film')) {
    return 'urn:entity:movie';
  }
  if (lower.includes('book') || lower.includes('education') || lower.includes('learning')) {
    return 'urn:entity:book';
  }
  if (lower.includes('tech') || lower.includes('gadget') || lower.includes('retail') || lower.includes('e-commerce')) {
    return 'urn:entity:brand';
  }
  return 'urn:entity:brand';
}

export function resolveFilterType(brief: AnalysisBrief): string {
  if (brief.filterType && brief.filterType.startsWith('urn:entity:')) return brief.filterType;
  return mapCategoryToEntityType(brief.category);
}

function typeLabelFromType(typeStr: string): string {
  if (!typeStr || typeStr === 'urn:entity') return 'Entity';
  const match = typeStr.match(/urn:entity:(\w+)/);
  if (!match) return typeStr;
  const map: Record<string, string> = {
    movie: 'Movie', tv_show: 'TV Show', artist: 'Artist', book: 'Book',
    video_game: 'Game', podcast: 'Podcast', brand: 'Brand', place: 'Place',
    destination: 'Destination', person: 'Person',
  };
  return map[match[1]] || match[1];
}

export function buildInterpretation(
  brief: AnalysisBrief,
  entities: QlooEntity[],
  explainability: AnalysisResult['explainability'],
  searchResults?: QlooEntity[],
  tagsUsed?: Array<{ id: string; name?: string }>
): InterpretationResult {
  const filterType = resolveFilterType(brief);
  const entityTypeLabel = typeLabelFromType(filterType);

  if (entities.length === 0) {
    return {
      summary: `No ${entityTypeLabel.toLowerCase()} entities were returned by Qloo for this query. This may indicate the combination of interests, audience, and location parameters is too narrow, or Qloo does not have sufficient data for these specific signals. Try broadening your interests, changing the entity type, or removing the location filter.`,
      keyAffinities: [],
      recommendations: [
        'Broaden the cultural interests field to more general terms',
        'Try a different entity type that better matches your business category',
        'Remove the location filter if one is set, or try a broader metro area',
        'Use the entity search to find specific Qloo entity IDs related to your interests',
      ],
      creativeDirections: [],
      limitations: [
        'No Qloo evidence was returned — recommendations above are general guidance only, not data-backed',
        'Unable to generate specific creative directions without cultural affinity data',
      ],
      isAIGenerated: false,
    };
  }

  const scores = explainability?.explainability?.entities
    ? new Map<string, ExplainabilityScore>(
        explainability.explainability.entities
          .filter((e) => e.entity || e.name)
          .map((e) => [e.entity || e.name || '', e])
      )
    : new Map<string, ExplainabilityScore>();

  const topEntities = entities.slice(0, 10);
  const keyAffinities: AffinityInsight[] = topEntities.map((entity) => {
    const name = getEntityName(entity);
    const type = getEntityTypeLabel(entity);
    const desc = getEntityDescription(entity);
    const loc = getEntityLocation(entity);
    const tags = getEntityTags(entity);
    const genres = getEntityGenres(entity);
    const hasImage = !!getEntityImage(entity);

    const scoreEntry = scores.get(entity.entity_id || '') || scores.get(name);
    const hasQlooScore = scoreEntry?.average !== undefined && scoreEntry.average !== null;

    const evidenceParts: string[] = [];
    if (desc) evidenceParts.push(`Qloo description: ${desc.slice(0, 120)}`);
    if (genres.length > 0) evidenceParts.push(`Genres: ${genres.slice(0, 3).join(', ')}`);
    if (tags.length > 0) evidenceParts.push(`Tags: ${tags.slice(0, 4).join(', ')}`);
    if (loc) evidenceParts.push(`Location: ${loc}`);
    if (!hasImage) evidenceParts.push('No image available from Qloo');

    let insight: string;
    if (hasQlooScore) {
      insight = `[Qloo affinity score: ${scoreEntry!.average!.toFixed(2)}] `;
      if (evidenceParts.length > 0) {
        insight += evidenceParts.join('. ');
      } else {
        insight += `Returned by Qloo as a culturally related ${type.toLowerCase()} for your signals.`;
      }
    } else {
      insight = `[App hypothesis — no Qloo score available] `;
      if (evidenceParts.length > 0) {
        insight += evidenceParts.join('. ');
        insight += '. This entity was returned by Qloo but without an explicit affinity score, so its ranking reflects API result order, not a measured affinity.';
      } else {
        insight += `Returned by Qloo as a ${type.toLowerCase()} but with no description, tags, or affinity score. Its relevance to your audience is unverified.`;
      }
    }

    return {
      entity: name,
      type,
      score: hasQlooScore ? scoreEntry!.average : undefined,
      insight,
    };
  });

  const entityNames = topEntities.map((e) => getEntityName(e)).filter(Boolean);
  const entityTypes = [...new Set(topEntities.map((e) => getEntityTypeLabel(e)))];
  const scoredCount = keyAffinities.filter((a) => a.score !== undefined).length;

  const summary = `Qloo returned ${entities.length} ${entityTypeLabel.toLowerCase()} ${entities.length === 1 ? 'entity' : 'entities'} for your brief targeting "${brief.audience}" in the ${brief.category} space${brief.location ? ` (${brief.location})` : ''}.${brief.interests ? ` Signal entities were derived from your stated interests: ${brief.interests}.` : ''} ${scoredCount > 0 ? `${scoredCount} of ${topEntities.length} top entities have explicit Qloo affinity scores; the remaining entities are presented as API-returned results without fabricated metrics.` : 'No explicit affinity scores were provided by Qloo for these results — rankings reflect API result order, not measured affinities.'} The top entities span ${entityTypes.join(', ')} categories.`;

  const recommendations: string[] = [];
  if (entityNames.length > 0) {
    recommendations.push(`[App suggestion] Consider referencing ${entityNames.slice(0, 3).join(', ')} in your campaign — these were returned by Qloo as culturally related to your signals`);
  }
  if (entityTypes.length > 1) {
    recommendations.push(`[App suggestion] The cross-category spread (${entityTypes.join(', ')}) may indicate diverse cultural interests — design touchpoints across multiple media types`);
  } else {
    recommendations.push(`[App suggestion] All returned entities fall within the ${entityTypes[0]} category — consider broadening your interests to discover cross-domain affinities`);
  }
  if (brief.location) {
    const localized = topEntities.filter((e) => getEntityLocation(e));
    if (localized.length > 0) {
      recommendations.push(`[Qloo evidence] ${localized.length} of the top results have location data tied to ${brief.location} — leverage local cultural relevance in your messaging`);
    } else {
      recommendations.push(`[App observation] None of the top results were specifically tied to ${brief.location} — consider whether a location-based approach is the right strategy`);
    }
  }
  if (brief.interests) {
    const interestTerms = extractInterestTerms(brief.interests);
    recommendations.push(`[Qloo evidence] Your stated interests (${interestTerms.join(', ')}) produced ${entities.length} culturally related results from Qloo`);
  }
  recommendations.push(`[App suggestion] Use the top-ranked entities as cultural anchors: feature them in playlists, reading lists, watch lists, or collaboration concepts relevant to your product`);

  const creativeDirections: string[] = [];
  if (entityNames.length >= 2) {
    creativeDirections.push(`[App suggestion] Create a "cultural curation" campaign featuring ${entityNames[0]} and ${entityNames[1]} as reference points for your audience's taste profile`);
  }
  creativeDirections.push(`[App suggestion] Develop content that bridges your product category with the ${entityTypes[0] || 'cultural'} domain — show authentic understanding of the audience's cultural world`);
  if (entityTypes.includes('Movie') || entityTypes.includes('TV Show')) {
    creativeDirections.push('[App suggestion] Leverage film/TV references in visual storytelling — recreate iconic scenes or use cinematic aesthetics in your creative assets');
  }
  if (entityTypes.includes('Artist') || entityTypes.includes('Music')) {
    creativeDirections.push('[App suggestion] Consider music-driven content — playlists, sound partnerships, or artist-inspired visual themes that resonate with the audience');
  }
  if (entityTypes.includes('Book')) {
    creativeDirections.push('[App suggestion] Tap into literary culture — book club content, reading list partnerships, or narrative-driven storytelling in your campaign');
  }
  if (entityTypes.includes('Brand')) {
    creativeDirections.push('[App suggestion] Explore co-branding or cross-promotional opportunities with the identified brands that share your audience');
  }
  creativeDirections.push(`[App suggestion] Use ${brief.objective} as your campaign frame: position cultural insights as evidence that your brand truly understands this audience`);

  const limitations: string[] = [
    'Interpretations and recommendations are generated by this app using rule-based analysis of Qloo entity data — they are not Qloo product outputs or predictive AI',
    'Entity rankings reflect Qloo cultural co-occurrence patterns, not market research, sales projections, or audience demographics',
    'The analysis does not account for brand safety, sentiment, or current controversies around any entity',
    'Always validate cultural references with your own brand guidelines and audience research before deployment',
    'Affinity scores shown are provided directly by the Qloo API — the app does not compute or fabricate any scores',
  ];
  if (scoredCount === 0) {
    limitations.push('Qloo did not return explicit affinity scores for these results — entity order reflects API result ranking, not a measured cultural affinity');
  }
  if (!brief.interests) {
    limitations.push('No specific cultural interests were provided — results are based on audience and category signals only');
  }
  if (searchResults && searchResults.length === 0 && brief.interests) {
    limitations.push('Interest terms could not be matched to specific Qloo entity IDs — the analysis used category-level signals instead');
  }

  return {
    summary,
    keyAffinities,
    recommendations,
    creativeDirections,
    limitations,
    isAIGenerated: false,
  };
}

export function buildComparison(
  conceptA: { name: string; description: string; filterType: string; interests: string },
  conceptB: { name: string; description: string; filterType: string; interests: string },
  resultsA: QlooEntity[],
  resultsB: QlooEntity[]
): Omit<ConceptComparison, 'generatedAt'> {
  const namesA = resultsA.map((e) => getEntityName(e));
  const namesB = resultsB.map((e) => getEntityName(e));
  const overlap = namesA.filter((n) => namesB.includes(n));

  const typesA = [...new Set(resultsA.map((e) => getEntityTypeLabel(e)))];
  const typesB = [...new Set(resultsB.map((e) => getEntityTypeLabel(e)))];

  const differences: string[] = [];
  if (overlap.length > 0) {
    differences.push(`[Qloo evidence] Both concepts share ${overlap.length} cultural entities in common: ${overlap.slice(0, 5).join(', ')}${overlap.length > 5 ? '...' : ''}`);
  } else {
    differences.push('[Qloo evidence] The two concepts have no overlapping entities, suggesting they appeal to distinct cultural taste profiles');
  }

  if (typesA.join(',') !== typesB.join(',')) {
    differences.push(`[Qloo evidence] Concept A draws from ${typesA.join(', ')} categories, while Concept B draws from ${typesB.join(', ')}`);
  }

  if (resultsA.length !== resultsB.length) {
    differences.push(`[Qloo evidence] Concept A returned ${resultsA.length} entities vs Concept B's ${resultsB.length}`);
  }

  if (namesA.length > 0 && namesB.length > 0) {
    differences.push(`[App observation] Concept A's top entities (${namesA.slice(0, 3).join(', ')}) differ from Concept B's (${namesB.slice(0, 3).join(', ')})`);
  }

  const creativeDirections: string[] = [];
  if (overlap.length > 0) {
    creativeDirections.push(`[App suggestion] The shared entities (${overlap.slice(0, 3).join(', ')}) could serve as a bridge between both concepts in an integrated campaign`);
  }
  creativeDirections.push(`[App suggestion] For Concept A, lean into its unique cultural strengths: ${namesA.filter((n) => !overlap.includes(n)).slice(0, 3).join(', ') || 'its distinct entity set'}`);
  creativeDirections.push(`[App suggestion] For Concept B, emphasize its unique cultural positioning: ${namesB.filter((n) => !overlap.includes(n)).slice(0, 3).join(', ') || 'its distinct entity set'}`);
  creativeDirections.push('[App suggestion] Consider A/B testing creative treatments informed by each concept to measure real-world audience response');

  const limitations = [
    'This comparison is based on Qloo cultural affinity data, not predictive market modeling',
    'Entity overlap does not guarantee audience overlap — the same entity can serve different cultural roles in each concept',
    'No sales, market share, or audience behavior predictions can be made from this data',
    'The number of returned entities depends on query specificity and available Qloo data, not necessarily concept quality',
    'Recommendations and creative directions are app-generated suggestions, not Qloo product outputs',
  ];

  return {
    conceptA,
    conceptB,
    resultsA,
    resultsB,
    differences,
    creativeDirections,
    limitations,
    isAIGenerated: false,
  };
}

export function buildCampaignSuggestions(
  brief: AnalysisBrief,
  result: AnalysisResult
): CampaignSuggestions {
  const entities = result.entities;
  const names = entities.slice(0, 8).map((e) => getEntityName(e)).filter(Boolean);
  const types = [...new Set(entities.map((e) => getEntityTypeLabel(e)))];

  const themes: string[] = [];
  if (names.length >= 2) {
    themes.push(`[App suggestion] "${names[0]} meets ${names[1]}" — a crossover concept bridging two cultural touchpoints your audience's Qloo profile includes`);
  }
  themes.push(`[App suggestion] "Curated by taste" — position your ${brief.category.toLowerCase()} brand as a cultural curator that understands the audience's ${types.join(' and ').toLowerCase()} affinities`);
  themes.push(`[App suggestion] "The ${brief.objective} collection" — a campaign frame that ties your business objective to the audience's cultural world`);

  const creativeDirection: string[] = [];
  creativeDirection.push(`[App suggestion] Use the visual language and aesthetics associated with top Qloo entities (${names.slice(0, 3).join(', ')}) as creative inspiration for imagery, color palettes, and tone`);
  if (types.includes('Movie') || types.includes('TV Show')) {
    creativeDirection.push('[App suggestion] Adopt cinematic storytelling techniques — short-form video content with film-inspired composition and pacing');
  }
  if (types.includes('Artist')) {
    creativeDirection.push('[App suggestion] Build a sonic identity using music styles associated with the top artists — consider playlist partnerships or sound design inspired by their genre');
  }
  if (types.includes('Brand')) {
    creativeDirection.push('[App suggestion] Explore visual co-creation or aesthetic alignment with the brands that share your audience');
  }
  creativeDirection.push(`[App suggestion] For ${brief.objective}, the creative should feel like cultural discovery, not advertising — let the Qloo evidence authenticate your brand's cultural fluency`);

  const contentConcepts: string[] = [];
  contentConcepts.push(`[App suggestion] A "cultural map" content series showing how your product connects to each top entity (${names.slice(0, 5).join(', ')})`);
  contentConcepts.push('[App suggestion] A quiz or interactive experience where users discover their own cultural affinity profile, powered by the same Qloo insights');
  contentConcepts.push('[App suggestion] Curated lists/playlists/readings featuring the top entities, branded as your company\'s cultural recommendations');
  if (brief.location) {
    contentConcepts.push(`[App suggestion] A location-specific content module for ${brief.location} featuring geographically relevant entities from the results`);
  }
  contentConcepts.push('[App suggestion] Behind-the-scenes content showing how your team used cultural intelligence (Qloo) to design the campaign — meta-content that builds trust');

  const engagementIdeas: string[] = [];
  engagementIdeas.push('[App suggestion] Create a social media challenge encouraging your audience to share their own connections to the top cultural entities');
  engagementIdeas.push('[App suggestion] Host a virtual or physical event themed around the top affinities — e.g., a screening, listening party, or book club');
  engagementIdeas.push('[App suggestion] Develop a UGC campaign asking customers to show how they incorporate the identified cultural touchpoints into their lifestyle alongside your product');
  engagementIdeas.push('[App suggestion] Launch a community discussion forum or AMA series around the cultural themes identified in the analysis');

  const positioning: string[] = [];
  positioning.push(`[App suggestion] Position your ${brief.category.toLowerCase()} offering as "culturally intelligent" — backed by Qloo affinity data rather than guesswork`);
  positioning.push('[App suggestion] Frame the product as a cultural connector: the bridge between the audience\'s existing tastes and your brand\'s value proposition');
  positioning.push(`[App suggestion] Use the ${brief.objective} objective to determine positioning tone: awareness = discovery-focused, engagement = participation-focused, launch = excitement-focused`);

  const limitations = [
    'Campaign suggestions are generated by this app using rule-based analysis of Qloo entity data — they are not Qloo product outputs',
    'Always verify that referenced entities align with your brand values and have no conflicting associations',
    'Partnership or co-branding suggestions require separate business development and legal review',
    'Engagement ideas should be tested with real audience segments before full-scale deployment',
    'No sales projections, ROI estimates, audience demographics, or causal claims can be made from cultural affinity data alone',
  ];

  return {
    themes,
    creativeDirection,
    contentConcepts,
    engagementIdeas,
    positioning,
    limitations,
    isAIGenerated: false,
  };
}

export { classifyAudience, filterByTypeRelevance, getExplainabilityScores, sortEntitiesByQlooScore };
