# Project memory

## Product intent & audience

- Full-stack web app powered by Qloo API
- Helps businesses analyze audience cultural tastes
- Transforms evidence-based insights into product concepts and marketing campaigns
- Target audience: businesses seeking context-aware cultural recommendation intelligence
- Live deployment: `https://culturepulse-ai-agen-3522.bolt.host`
- Qloo integration reports as connected; real analysis runs return actual Qloo results

## Brand personality & voice

- Name: CulturePulse AI
- Tagline: "Real People. Real Tastes. Smarter Recommendations."
- Professional, evidence-based, technology-forward positioning
- Suitable for hackathon submission and production demo contexts
- Voice-over tone: professional English narration

## Visual design & UX direction

- Color palette: deep navy background with teal and violet accents
- Title cards use navy background + teal accent for brand consistency
- Framework: vite-react with Tailwind CSS
- Icons: lucide-react
- Imports use `@/` path alias mapping to `src/`
- Typography and layout match the live app's existing interface
- Demo video rendered at 1920x1080, 30fps, H.264/AAC, 2:00 duration

## Decisions, constraints & rationale

- Demo MP4 was actually rendered and verified (not storyboarded): `CULTUREPULSE_AI_DEMO.mp4`, 6.8 MB
- Recording used Playwright-driven Chromium screencast frames assembled via FFmpeg (installed outside project in `/tmp`)
- Narration: synthetic Google TTS voice (not professional VO); subtitles burned in
- Music: generated tone pad (not licensed track)
- Real footage includes: homepage, live analysis run with sample coffee brief, Compare, Campaign Studio, Saved Reports, Settings pages
- Known data issue: New York sample brief returned Cleveland places (not hidden in video)
- Not recorded (to limit Qloo calls/cost): Compare Concepts generation, Campaign Studio generation, mobile view
- Saved Reports was empty at recording time
- No API keys/credentials exposed; no unnecessary Qloo calls made
- `@/` path alias and lucide-react are established conventions (see `.bolt/prompt`)

## Open questions & assumptions

- Whether Compare Concepts and Campaign Studio generation function end-to-end with live Qloo (untested to avoid cost)
- Whether Saved Reports persists data across sessions or was empty due to fresh state
- Whether Cleveland-places-for-NY-brief is an app bug or Qloo data quirk
- Whether a licensed music track or professional VO should replace generated assets for final production
- Mobile/responsive behavior unverified
- "Future versions" value-section line was agent suggestion, not an existing app feature