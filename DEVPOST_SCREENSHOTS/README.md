# CULTUREPULSE AI — Devpost Screenshot Gallery

## Status: Screenshots NOT captured

This folder was prepared as part of the CULTUREPULSE AI Devpost submission, but the actual screenshot images were **not captured** in this environment. The build environment has no browser or screenshot capability, so no image files exist here yet.

This document describes the exact screens that exist in the live application and should be captured for the Devpost submission.

---

## Required Screenshots (to be captured from the live app)

| # | Filename | Screen | What to show | Status |
|---|----------|--------|--------------|--------|
| 1 | `01-homepage.png` | Dashboard | CULTUREPULSE branding, left sidebar nav, Qloo API status badge, hero ("Cultural Intelligence for the Real World"), Signature Features cards (Cultural Intelligence Agent, Culture Concept Comparator, Campaign Studio), stat cards (API Status, Saved Reports, Entity Types), How It Works steps, Supported Cultural Domains badges | Not captured |
| 2 | `02-cultural-discovery.png` | New Analysis page | The analysis input form: business category dropdown (15 categories), audience description, location, campaign objective, cultural interests, sample brief buttons, "Run Analysis" button. Qloo status indicator visible. | Not captured |
| 3 | `03-recommendations.png` | Analysis results | Real Qloo-powered recommendation results after running an analysis: cultural affinities, entity cards (movies, music, brands, etc.), evidence section. **Only capture this if the Qloo API is connected and returns real data.** If the API is not connected, capture the actual "not connected" state and note the limitation. | Not captured |
| 4 | `04-category-experience.png` | Compare Concepts page | Side-by-side concept comparison interface: two input panels for comparing campaign/product concepts, each with its own category, audience, and interests fields. Real comparison results if Qloo is connected. | Not captured |
| 5 | `05-user-experience.png` | Campaign Studio OR Saved Reports | Campaign Studio: campaign suggestions output (themes, creative direction, engagement ideas) based on analysis results. OR Saved Reports page showing session-stored analysis/comparison/campaign reports with delete option. Choose whichever has meaningful content to display. | Not captured |
| 6 | `06-mobile-responsive.png` | Mobile viewport (any page) | The app at a narrow viewport (375–768px width). The layout has a mobile top bar with hamburger menu and a slide-out sidebar. Capture the Dashboard or Analysis page at mobile width. Tested in browser DevTools responsive mode — not on a physical device. | Not captured |

---

## Image Requirements (for the person capturing)

- **Aspect ratio:** 3:2
- **Preferred dimensions:** 1500 × 1000 pixels (or equivalent 3:2)
- **Format:** PNG or JPG
- **Max size:** 5 MB per image
- **Browser:** Hide developer tools and browser chrome. Use clean full-viewport captures.
- **Content:** Real screens only. No fabricated results, fake ratings, or invented data.
- **Qloo integration:** Verify the Qloo API status indicator shows "Connected" in the sidebar before capturing recommendation screenshots. If it shows "Not Connected" or "Error", capture that honestly and report it as a limitation.

---

## How to capture these screenshots

1. Open the live CULTUREPULSE AI application in a browser.
2. Set the browser window to a 3:2 aspect ratio (e.g., 1500 × 1000).
3. For screenshots 1–5: capture each screen at full desktop width.
4. For screenshot 6: open browser DevTools, toggle device toolbar, set width to 375px, and capture.
5. Save each image to this `DEVPOST_SCREENSHOTS/` folder with the exact filenames listed above.

---

## Application screens that genuinely exist

Based on the source code, CULTUREPULSE AI has these navigable pages:

- **Dashboard** — homepage with branding, feature cards, stats, and cultural domain badges
- **New Analysis** — cultural intelligence input form (category, audience, location, objective, interests)
- **Compare Concepts** — side-by-side concept comparison tool
- **Campaign Studio** — campaign suggestion generator from analysis results
- **Saved Reports** — session-stored reports (analysis, comparison, campaign types)
- **Settings** — Qloo API connection status and refresh control

## Supported cultural domains (from source code)

Movies & Film, TV Shows, Music Artists, Books & Literature, Video Games, Podcasts, Brands & Products, Places & Venues, Travel Destinations, People & Influencers

## Important note on Qloo API

Recommendation screenshots (03-recommendations.png) should only show real Qloo API results. The Qloo API key is configured server-side as a Supabase Edge Function secret. Before capturing recommendation screenshots, confirm the sidebar status indicator reads "Qloo Connected" (green dot). If the API is not connected, do not fabricate recommendation results — capture the actual interface state instead.
