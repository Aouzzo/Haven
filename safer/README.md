# Haven — cinematic hackathon prototype

A local, offline-capable presentation website. No dependency installation, build step, account, API key or internet connection is needed to run it. Python 3 is the only runtime requirement.

## Start

From the Hackathon folder:

```sh
python3 safer/serve.py
```

Then open **http://127.0.0.1:4173**. Stop with `Ctrl+C` in the terminal.

If that port is occupied: `python3 safer/serve.py --port 4174`.

`serve.py` serves static files and maps the three page URLs to the frontend. It contains no application API or data storage and binds only to your own computer.

## Present

- `/` — interactive 3D hero (dusk care wing, drag to look around) → roof lifts to a floor plan with rooms 101–106 → three ESP32 sensors pop in with Wi-Fi rings and signal particles → camera flies into Room 104 → resident walks, then a possible fall → "No movement" timer and alert card → pull back to a simulated caregiver dashboard (Acknowledge button) → Haven reveal.
- `/technology` — polished product concept, proposed sensing pathway, installation, planned benefits, placeholder specifications, FAQ, and explicitly non-submitting demo contact control.
- `/login` — enterprise portal coming soon; no authentication or dashboard.

Every page has a Wi-Fi cursor: signal arcs spread from the mouse, buttons/links glow when a ring passes them, and on the home page the ring also lands in the 3D world (and pings a nearby sensor). It is off on touch screens and with reduced motion.

Use a desktop browser at 1280 × 720 or larger for the presentation. Scroll gradually: the camera flight is tied to scroll position, so scrolling up rewinds it. The six chapter buttons at the bottom jump between beats. The ending has an **Experience again** button.

## Easy edits

| File | Purpose |
| --- | --- |
| `public/cinematic/story.js` | Chapter names, captions, scroll positions, room list, alert time |
| `public/cinematic/scene3d.js` | The 3D world (Three.js): building, furniture, sensors, resident, camera flight path (`KEYS`) |
| `public/cinematic/timeline.js` | Scroll → progress, HTML overlays (CSI trace, alert, dashboard, reveal) |
| `public/cinematic/cursor.js` | Wi-Fi cursor effect |
| `public/pages/home.js` | Home page markup |
| `public/styles/world.css` | Styles for the 3D hero, overlays and cursor (loaded after site.css) |
| `public/vendor/three.module.min.js` | Three.js r160, MIT license (`vendor/THREE-LICENSE.txt`), kept local so the demo works offline |
| `public/pages/technology.js` | Technology page layout |
| `public/pages/login.js` | Coming-soon portal |
| `public/content.js` | Planned features, specifications and FAQ copy |
| `public/styles/brand.css` / `site.css` | Brand tokens and the original layout rules |
| `public/assets/scenes/hallway-empty.png` | Generated hallway image, still used on `/technology` and `/login` |

The 3D scene is built from simple shapes in code: no downloaded models and no generated images. To retime the story, change the progress numbers in `KEYS` (camera) and the `between(p, a, b)` ranges in `scene3d.js` / `timeline.js`, and keep `story.js` chapter `at`/`until` values in step.

## Scope and honesty

This is a simulated product story, not working fall detection. There is no sensor connection, trained classifier, account access, alert transmission, form submission, analytics or personal data collection. Accuracy, coverage and technical requirements remain unvalidated. The 3D sequence, CSI trace and dashboard are labeled SIMULATED.

## Credits

- Implementation and visual direction: OpenAI Codex assistance.
- 3D hero, scroll flight and Wi-Fi cursor: Claude Code (Anthropic) assistance.
- 3D rendering: [Three.js](https://threejs.org) r160, MIT license (plus its GLTF, RGBE and Draco loaders).
- Photoreal look: textures, models and sky from [Poly Haven](https://polyhaven.com) (CC0); built and baked in Blender (`blender/`).
- Original scene and character imagery: built-in OpenAI image generation, guided by the user-supplied reference PNG. Generated using the account's included plan allowance; no paid API was invoked.
- Brand icon, sensor graphics, layouts and scroll animation: original SVG/CSS/JavaScript in this project.
- Runtime: Python standard library, browser HTML/CSS/JavaScript. No third-party frontend libraries, remote fonts, stock assets or paid services.

## Verification

Browser checks cover initial load, chapter navigation, native forward/reverse scroll, installation and detection states, final reveal, both linked pages, FAQ expansion, the contact placeholder, and responsive desktop/mobile layout. Console logs were checked for errors. The website is intentionally local-only and has not been deployed.
