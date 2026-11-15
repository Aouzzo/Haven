# NOTES (handoff)

Read `ReadME.md` (project context and honesty rules) and `safer/README.md` (site structure) first.

## Branch feature/site-additions (2026-11-15, Luis + Claude Code)
Built on Anthony's main (896e36b) while he keeps working on main; merge when both are done.
New files only where possible, to keep the merge easy: `safer/public/pages/additions.js`,
`styles/additions.css`, `cinematic/fx.js`, `cinematic/room.js`, `cinematic/valley.js`, `assets/fonts/`.
- Big two-row brand banner of taglines under the sensor assembly (edit `ROW_1`/`ROW_2` in additions.js).
- Scroll life: headlines rise word by word, cards/stats slide in, stat numbers count up, nav highlights.
- "How we made it" section (#made): 4 steps + 3 media slots. Put files in `assets/made/` and set `MADE_MEDIA` in additions.js (mp4, image or YouTube link). Empty = labeled placeholder.
- Interactive Wi-Fi room inside "How the AI works" (cursor bends the links; no click-to-fall).
- Team section + credits led by OpenAI Codex (Codex competition), also Claude Code, MediaPipe, Three.js, Blender, fonts.
- Footer: 2D dusk valley matching the 3D intro (granite walls, pines, lodge, cursor-bending grass).
- Self-hosted Fraunces/Inter fonts (same on every laptop, no Google request).
- Demo stats now from `esp32/data/experiments.md` (Hackathon repo): 95% held-out test (best placement, others 77-87%), 0/12 false alarms, 18/20 lie-downs alerted, alert after 3 s. Fine print says falls were acted out by lying on a mat.
- Removed "HIPAA-level care" (not backed up). FAQ/spec text updated to match.
- Stability: 3D frames wrapped in try/catch and skipped after the hero; third quality tier (bloom off, pixel ratio 1) for slow laptops; each extra mounts inside its own try.
- To do: fill `MADE_MEDIA`; the YouTube demo (`DEMO_VIDEO`) showed "video unavailable" in testing, check it is public/embeddable.

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
