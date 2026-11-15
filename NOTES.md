# NOTES (handoff)

Read `ReadME.md` (project context and honesty rules) and `safer/README.md` (site structure) first.

## Current state (2026-11-14)
- Live pitch site = `safer/public/` (static, no build). Deployed by Vercel from `main` to https://haven-public-ten.vercel.app. Run locally: `python safer/serve.py`, then open http://127.0.0.1:4173.
- Branch `feature/3d-hero` (not merged): replaced the AI-image hero with an interactive Three.js 3D scene and a scroll flight path into Room 104 that shows a simulated fall alert and caregiver dashboard. Added a Wi-Fi cursor effect on all pages.
- Key files: `safer/public/cinematic/{story,scene3d,timeline,cursor}.js`, `safer/public/styles/world.css`, `safer/public/vendor/three.module.min.js`.

## Decisions
- 3D built from simple shapes in code (no downloaded models or generated images), so everything shown was built at the hackathon. Three.js is vendored locally so the demo works offline.
- Resident is a faceless figure (privacy framing). The whole sequence, the CSI trace and the dashboard are labeled SIMULATED.
- `exterior.png` and the resident sprite sheets were removed. `hallway-empty.png` is still used on `/technology` and `/login`.

## Next steps
- Merge `feature/3d-hero` into `main` only after the team approves (merging deploys).
- Possibly replace the hallway image on `/technology` and `/login` with 3D renders or real photos of the hardware.
- Once the detector works, swap the simulated CSI trace for real recorded data, labeled REPLAY or LIVE.

## Gotchas
- Pushing to `main` redeploys the public site.
- Story timings live in three places: `KEYS` in `scene3d.js`, `between(...)` ranges in `scene3d.js` / `timeline.js`, and chapter `at`/`until` values in `story.js`. Keep them in step.
