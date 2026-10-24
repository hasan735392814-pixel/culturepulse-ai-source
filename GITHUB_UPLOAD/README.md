# CULTUREPULSE AI

> **Cultural Intelligence for the Real World**

CULTUREPULSE AI is a cultural intelligence platform that transforms real Qloo API affinity data into actionable insights for marketers, brand strategists, and content creators. It searches Qloo's cultural knowledge graph, retrieves affinity-based entity recommendations, and generates structured interpretations that help teams design campaigns grounded in authentic cultural evidence rather than guesswork.

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Target Users](#target-users)
- [Key Features](#key-features)
- [How Qloo Powers the Workflow](#how-qloo-powers-the-workflow)
- [Architecture & Data Flow](#architecture--data-flow)
- [Technology Stack](#technology-stack)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Problem

Marketers and brand teams increasingly need to demonstrate cultural fluency, but they lack tools that connect real cultural affinity data to campaign planning. Existing approaches rely on intuition, generic demographics, or expensive custom research. There is no accessible way to go from "I'm launching a product for sci-fi film enthusiasts" to "here are the specific movies, directors, brands, and cultural touchpoints that audience cares about, backed by data."

## Solution

CULTUREPULSE AI bridges that gap by using the **Qloo Cultural AI API** as its data engine. Users enter a business brief (category, audience, location, cultural interests), and the application:

1. Searches Qloo for entities matching the user's interests, scoped to the relevant entity type
2. Uses those entities as signals in Qloo's Insights API to discover culturally related entities
3. Filters and ranks results by type relevance and Qloo-provided affinity scores
4. Generates a structured interpretation that clearly separates raw Qloo evidence from app-generated recommendations

The result is a transparent, evidence-backed cultural analysis that teams can use for campaign planning, creative direction, and audience understanding.

## Target Users

- **Brand marketers** planning campaigns who need cultural evidence to inform creative direction
- **Content strategists** looking for authentic cultural touchpoints to reference
- **Agency planners** preparing audience insight decks for client pitches
- **Product teams** exploring cultural adjacencies for positioning or partnership opportunities

## Key Features

- **Cultural Analysis** — Enter a business brief and receive Qloo-backed entity recommendations with affinity scores (when available), organized by entity type and relevance
- **Concept Comparison** — Compare two creative concepts side-by-side using real Qloo data, with entity overlap visualization
- **Campaign Studio** — Transform analysis results into structured campaign themes, creative directions, content concepts, and engagement ideas
- **Saved Reports** — Persist analyses, comparisons, and campaign suggestions locally for later reference
- **Settings & Health Check** — Monitor Qloo API connectivity status in real time
- **Evidence Transparency** — Every insight is labeled with its source: `[Qloo evidence]` for API-provided facts, `[App suggestion]` for generated recommendations, `[App hypothesis]` for entities without explicit scores
- **Type-Relevant Search** — Entity searches are scoped to the brief's domain (e.g., movies for film audiences) so signals sent to the Insights API are contextually relevant

---

## How Qloo Powers the Workflow

CULTUREPULSE AI uses three Qloo API endpoints, all proxied through a server-side Supabase Edge Function that keeps the `QLOO_API_KEY` secret on the server:

| Qloo Endpoint | Used For | When |
|---|---|---|
| `GET /search` | Finding entity IDs from user-provided interest terms (e.g., "sci-fi movies", "Christopher Nolan") | Step 1 — signal discovery |
| `GET /v2/tags` | Looking up cultural tags for interest terms | Optional — tag-based signals |
| `GET /v2/insights` | Retrieving culturally related entities based on signal entity IDs and a filter type | Step 2 — affinity discovery |

**Data flow example:** A user enters interests "sci-fi movies, Christopher Nolan, streaming" with category "Entertainment & Media." The app:

1. Searches Qloo for "sci-fi movies" scoped to `urn:entity:movie` — returns movie entity IDs
2. Passes those entity IDs as `signal.interests.entities` to `/v2/insights` with `filter.type=urn:entity:movie`
3. Qloo returns entities it calculates as culturally related to those signals
4. The app filters results by type relevance (movies, TV shows, people — not charities or unrelated brands)
5. If Qloo provides explainability scores, entities are sorted by those scores; otherwise API result order is preserved
6. The interpretation layer generates recommendations clearly labeled as app-generated, not Qloo facts

**What Qloo provides vs. what the app generates:**

| Qloo Provides (Raw Data) | App Generates (Labeled Interpretation) |
|---|---|
| Entity names, types, descriptions, images | Campaign recommendations |
| Affinity/explainability scores (when available) | Creative direction suggestions |
| Genre and tag metadata | Content concept ideas |
| Search and insights results | Summary narratives |
| | Entity relevance hypotheses (when no score) |

The app **never fabricates** affinity scores, confidence levels, audience demographics, or causal claims. If Qloo does not provide a metric, the app says so explicitly.

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│                                                                  │
│  React SPA (Vite + TypeScript + Tailwind CSS)                   │
│                                                                  │
│  Pages: Dashboard · Analysis · Compare · Studio · Reports ·     │
│         Settings                                                 │
│                                                                  │
│  src/lib/qloo-client.ts  ──►  fetch() to Edge Functions         │
│  src/lib/interpretation.ts  ►  Rule-based interpretation layer  │
│  src/lib/useSavedReports.ts ►  localStorage persistence         │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (Supabase anon key in Authorization header)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                        │
│                                                                  │
│  qloo-proxy  ──►  Proxies /search, /v2/tags, /v2/insights       │
│                   Validates params, adds X-Api-Key header        │
│                   QLOO_API_KEY read via Deno.env.get()           │
│                                                                  │
│  qloo-health ──►  Minimal /search?query=culture&take=1 ping     │
│                   Returns connection status to client            │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (X-Api-Key header)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Qloo Cultural AI API                           │
│                    https://hackathon.api.qloo.com                 │
│                                                                  │
│  /search        ──►  Entity search by query + type filter        │
│  /v2/tags       ──►  Tag search                                  │
│  /v2/insights   ──►  Affinity-based entity recommendations       │
│                       with optional explainability scores        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Server-side API key** — `QLOO_API_KEY` is stored as a Supabase Edge Function secret and never appears in client code, env files, or network requests visible to the browser
- **Proxy pattern** — The `qloo-proxy` edge function sanitizes parameters, validates required fields, and forwards requests to Qloo, keeping the API key server-side
- **Client-side interpretation** — The interpretation layer (`interpretation.ts`) runs in the browser and operates on Qloo data that has already been fetched. It uses rule-based logic, not an AI model, and labels all output as app-generated
- **localStorage reports** — Saved reports persist in the browser via localStorage; no server-side database is required for the current feature set

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 7 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Backend | Supabase Edge Functions (Deno runtime) |
| API | Qloo Cultural AI API (`hackathon.api.qloo.com`) |
| Hosting | Bolt.new (live demo) / Supabase (edge functions) |
| Persistence | Browser localStorage (saved reports) |

---

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (for hosting edge functions)
- A Qloo API key (from the Qloo hackathon program)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/culturepulse-ai.git
cd culturepulse-ai

# 2. Install dependencies
npm install

# 3. Create your .env file from the example
cp .env.example .env

# 4. Edit .env and add your Supabase project URL and anon key
#    (These are public values safe for the client bundle)
#    VITE_SUPABASE_URL=https://your-project.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-public-key

# 5. Set the Qloo API key as a Supabase Edge Function secret
#    Do NOT put QLOO_API_KEY in .env — it must be server-side only
supabase functions secrets set QLOO_API_KEY=your-qloo-api-key

# 6. Deploy edge functions to your Supabase project
#    (Use the Supabase MCP tools or Supabase CLI)
supabase functions deploy qloo-proxy
supabase functions deploy qloo-health

# 7. Start the dev server
npm run dev
```

### Environment Variables

| Variable | Where | Purpose | Sensitive? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | Supabase project URL for client-side API calls | No (public) |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase anon key for client-side auth | No (public, anon role only) |
| `QLOO_API_KEY` | Supabase Edge Function secret | Qloo API authentication | **YES — server-side only** |

`QLOO_API_KEY` is **never** placed in `.env`, `.env.example`, or any client-visible file. It is set via `supabase functions secrets set` and read at runtime with `Deno.env.get("QLOO_API_KEY")`.

---

## Deployment

### Bolt.new (current hosting)

The live demo is hosted on Bolt.new at:

**https://culturepulse-ai-agen-3522.bolt.host**

Bolt.new handles the frontend build and serves the production bundle automatically.

### Self-hosting

1. **Frontend**: Run `npm run build` and serve the `dist/` directory from any static host (Vercel, Netlify, Cloudflare Pages, etc.)
2. **Edge Functions**: Deploy `supabase/functions/qloo-proxy` and `supabase/functions/qloo-health` to your Supabase project
3. **Secrets**: Set `QLOO_API_KEY` as an edge function secret in the Supabase Dashboard (Edge Functions > Secrets)
4. **Environment**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting provider's environment variables

The `supabase/config.toml` file configures both edge functions with `verify_jwt = false` since they are public API proxies that use the Supabase anon key for access control.

---

## Testing

### Type checking

```bash
npm run typecheck
```

### Production build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Manual API workflow test

With edge functions deployed and `QLOO_API_KEY` set:

1. **Health check**: `GET https://your-project.supabase.co/functions/v1/qloo-health` with `Authorization: Bearer <anon-key>` — should return `{"status":"connected",...}`
2. **Type-filtered search**: `GET /functions/v1/qloo-proxy?endpoint=search&query=sci-fi+movies&types=urn:entity:movie&take=5` — should return movie-typed entities
3. **Full insights workflow**: Search for an entity, extract its ID, then call `GET /functions/v1/qloo-proxy?endpoint=insights&filter.type=urn:entity:movie&signal.interests.entities=<entity-id>&take=10` — should return culturally related movie entities
4. **Signalless guard**: `GET /functions/v1/qloo-proxy?endpoint=insights&filter.type=urn:entity:movie` — should return `{"error":"...","code":"MISSING_SIGNAL"}`

### UI testing

Open the app in a browser and:
1. Load a sample brief on the Analysis page and run an analysis
2. Verify entities appear with type labels and source-labeled insights
3. Save a report and confirm it appears on the Reports page
4. Run a concept comparison on the Compare page
5. Generate campaign suggestions on the Campaign Studio page
6. Check the Settings page for Qloo API connection status

---

## Known Limitations

- **Explainability scores**: Qloo's explainability API does not always return affinity scores. When scores are absent, entities are labeled `[App hypothesis — no Qloo score available]` and sorted by API result order, not by a measured affinity. The app never fabricates scores.
- **Entity type metadata**: Qloo search results do not always populate the `subtype` field, which can affect type-relevance filtering precision. The app falls back to the full result set if all entities would be filtered out.
- **Interpretation is rule-based, not AI**: The interpretation layer uses deterministic rules, not a machine learning model. All recommendations and creative directions are labeled as app-generated suggestions, not Qloo product outputs.
- **No server-side persistence**: Saved reports are stored in browser localStorage. Clearing browser data removes them. There is no server-side database for reports.
- **No authentication**: The app does not implement user accounts. The Supabase anon key provides access control to the edge functions.
- **Rate limiting**: The Qloo hackathon API has rate limits. The app surfaces rate-limit errors but does not implement client-side throttling.

---

## License

[MIT License](LICENSE) — Copyright (c) 2026
