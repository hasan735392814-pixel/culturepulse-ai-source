export const QLOO_BASE_URL = 'https://hackathon.api.qloo.com';

export const ENTITY_TYPES = [
  { value: 'urn:entity:movie', label: 'Movies & Film', icon: 'Film' },
  { value: 'urn:entity:tv_show', label: 'TV Shows', icon: 'Tv' },
  { value: 'urn:entity:artist', label: 'Music Artists', icon: 'Music' },
  { value: 'urn:entity:book', label: 'Books & Literature', icon: 'BookOpen' },
  { value: 'urn:entity:video_game', label: 'Video Games', icon: 'Gamepad2' },
  { value: 'urn:entity:podcast', label: 'Podcasts', icon: 'Mic' },
  { value: 'urn:entity:brand', label: 'Brands & Products', icon: 'ShoppingBag' },
  { value: 'urn:entity:place', label: 'Places & Venues', icon: 'MapPin' },
  { value: 'urn:entity:destination', label: 'Travel Destinations', icon: 'Plane' },
  { value: 'urn:entity:person', label: 'People & Influencers', icon: 'Users' },
] as const;

export const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Fashion & Apparel',
  'Technology & Gadgets',
  'Entertainment & Media',
  'Health & Wellness',
  'Travel & Hospitality',
  'Beauty & Cosmetics',
  'Home & Lifestyle',
  'Sports & Fitness',
  'Education & Learning',
  'Finance & Fintech',
  'Gaming & Esports',
  'Music & Audio',
  'Retail & E-commerce',
  'Sustainability & Eco',
];

export const CAMPAIGN_OBJECTIVES = [
  'Brand Awareness',
  'Product Launch',
  'Audience Expansion',
  'Customer Engagement',
  'Content Marketing',
  'Community Building',
  'Repositioning',
  'Seasonal Campaign',
  'Influencer Partnership',
  'Experiential Marketing',
];

export const SAMPLE_BRIEFS = [
  {
    label: 'Coffee brand targeting Gen Z',
    category: 'Food & Beverage',
    audience: 'Gen Z urban professionals aged 18-25',
    location: 'New York City',
    objective: 'Brand Awareness',
    interests: 'indie music, streetwear, sustainability',
  },
  {
    label: 'Tech gadget for film enthusiasts',
    category: 'Technology & Gadgets',
    audience: 'Movie lovers aged 25-40',
    location: '',
    objective: 'Product Launch',
    interests: 'sci-fi movies, Christopher Nolan, streaming',
  },
  {
    label: 'Sustainable fashion for millennials',
    category: 'Fashion & Apparel',
    audience: 'Eco-conscious millennials aged 28-38',
    location: 'London',
    objective: 'Audience Expansion',
    interests: 'indie fashion, vinyl records, plant-based food',
  },
  {
    label: 'Wellness app for music lovers',
    category: 'Health & Wellness',
    audience: 'Health-conscious adults aged 22-35',
    location: '',
    objective: 'Customer Engagement',
    interests: 'ambient music, yoga, meditation podcasts',
  },
] as const;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'analysis', label: 'New Analysis', icon: 'Sparkles' },
  { id: 'compare', label: 'Compare Concepts', icon: 'GitCompare' },
  { id: 'studio', label: 'Campaign Studio', icon: 'Palette' },
  { id: 'reports', label: 'Saved Reports', icon: 'FileText' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
] as const;

export type PageId = (typeof NAV_ITEMS)[number]['id'];
