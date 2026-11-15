# NOTES (handoff)

Read `ReadME.md` (project context and honesty rules) and `safer/README.md` (site structure) first.

## Current state (2026-11-14)
- Live pitch site = `safer/public/` (static, no build). Deployed by Vercel from `main` to https://haven-public-ten.vercel.app. Run locally: `python safer/serve.py`, then open http://127.0.0.1:4173.
- 3D hero merged into `main` on 2026-11-14 (from branch `feature/3d-hero`) and live: replaced the AI-image hero with an interactive Three.js 3D scene and a scroll flight path into Room 104 that shows a simulated fall alert and caregiver dashboard. Added a Wi-Fi cursor effect on all pages.
- Info sections merged into `main` on 2026-11-14 (from `feature/info-sections`) and live: Demo video, Business, Customers, Competition and Privacy sections below the 3D story, in `safer/public/pages/sections.js` + `styles/sections.css`. Numbers come from the team pitch deck (Google Drive "Haven Pitch.pptx"). Set the demo video in `DEMO_VIDEO` in `safer/public/cinematic/story.js`.
- Polished stylized look merged into `main` on 2026-11-14 (from `feature/stylized-polish-clean`) and live. (Use this one; `feature/stylized-polish` has the same code plus ~200 MB of Blender assets committed by mistake, so do not merge it.) Rounded geometry, procedural canvas textures (siding, planks, shingles, stone), window frames/shutters/curtains, porch and door, rolling terrain with mountain ring, 11k instanced grass tufts and flowers, ~95 trees with sway, picket fence, lamp posts, clouds, fireflies, chimney smoke. Post-processing: GTAO ambient occlusion, BokehPass tilt-shift, bloom, vignette/grade, AgX. Adaptive quality drops AO then DOF on slow machines. ~45 fps at 1440x900 on the dev laptop. Photoreal experiment (`feature/photoreal`) was rejected by the team.
- Key files: `safer/public/cinematic/{story,scene3d,timeline,cursor}.js`, `safer/public/styles/world.css`, `safer/public/vendor/three.module.min.js`.

## Decisions
- 3D built from simple shapes in code (no downloaded models or generated images), so everything shown was built at the hackathon. Three.js is vendored locally so the demo works offline.
- Resident is a faceless figure (privacy framing). The whole sequence, the CSI trace and the dashboard are labeled SIMULATED.
- `exterior.png` and the resident sprite sheets were removed. `hallway-empty.png` is still used on `/technology` and `/login`.

## Next steps
- Do new website work on a feature branch; merge into `main` only after the team approves (merging deploys).
- Possibly replace the hallway image on `/technology` and `/login` with 3D renders or real photos of the hardware.
- Once the detector works, swap the simulated CSI trace for real recorded data, labeled REPLAY or LIVE.

## Still to fill in on the site
- Demo video (`DEMO_VIDEO`), real customer quotes (Customers section), fall-detection result (deck has it blank), confirm $20/room price (labeled working assumption). Deck says to open each source and confirm numbers before presenting.

## Gotchas
- Pushing to `main` redeploys the public site.
- Story timings live in three places: `KEYS` in `scene3d.js`, `between(...)` ranges in `scene3d.js` / `timeline.js`, and chapter `at`/`until` values in `story.js`. Keep them in step.

## Overnight work (2026-11-15, branch `overnight/website-polish`, NOT merged)
Team asked for this to stay on a branch; merge it yourselves before noon if you like it.
- New sections below the 3D story: Device (scroll-scrubbed exploded view of the real sensor case, frames copied from the Hackathon repo `exploded-view` branch into `safer/public/assets/device/`), How it works (interactive room simulation, `cinematic/room.js`), The AI (real LOTO results + honest limits), Demo, Customers, Business (ROI calculator), Competition (matrix), Privacy, Team, meadow dividers and dusk footer (`cinematic/meadow.js`).
- Motion layer: `cinematic/fx.js` (word reveals, staggered reveals, count-ups, card spotlight/tilt, magnetic buttons, active pill nav, ROI calculator). Fonts self-hosted: Fraunces + Inter (`assets/fonts/`, SIL OFL).
- **Presentation mode**: "Present" button in the header, the P key, or `/?present`. Next = → ↓ Space PageDown (clickers); back = ← ↑ PageUp; Home/End; F fullscreen; Esc exit. HUD shows slide n/N, slide name and a timer that turns coral after 4:00. Stops = the six 3D story chapters + every `[data-slide]` element. Present-only slides (mock-ups to edit) are in `safer/public/pages/present.js`; their order is set by `body.present ... { order: n }` rules at the end of `styles/sections.css`.
- Review notes from a separate reviewer agent: `notes/overnight-review.md` (if present).
- Presentation order is now an explicit list `ORDER` in `safer/public/cinematic/present.js` (10-stop pitch, then a Q&A appendix). Edit that list to change the deck.
- Review fixes applied from `notes/overnight-review.md` (honesty wording, clicker focus, AI tools disclosure, Wi-Fi rivals in the matrix). Still needs real input from the team: real customer conversations (Customers section quote slot), a local demo video (`DEMO_VIDEO` in `cinematic/story.js`, prefer an mp4 in `assets/video/`), and confirming the three problem statistics against their sources.
- Alternate looks to compare (each is the overnight branch plus a theme; merge only one):
  - `theme/night-shift`: night 3D scene (stars, moonlight, brighter windows) and dark sections.
  - `theme/signal`: cream sections with a live CSI waveform rail down the left edge that goes flat during the fall; no meadow.
  - `theme/clinical`: white Swiss "clinical paper" layout, one typeface (Inter), hairline rules, no meadow; most credibility-first.
  To compare locally: `git checkout <branch>` then `python safer/serve.py` and open http://127.0.0.1:4173.

