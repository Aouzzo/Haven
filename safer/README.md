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

- `/` — stationary exterior → hallway → sensor installation and waves → resident walking → a gentle transition to a seated pose and simulated fall alert → Haven reveal.
- `/technology` — polished product concept, proposed sensing pathway, installation, planned benefits, placeholder specifications, FAQ, and explicitly non-submitting demo contact control.
- `/login` — enterprise portal coming soon; no authentication or dashboard.

Use a desktop browser at 1280 × 720 or larger for the presentation. Scroll gradually: the film advances only when the page moves. Scroll upward to reverse it. The five small chapter buttons at the bottom can navigate the story directly. The ending has an **Experience again** button.

The home page uses about 4.7 viewport heights of scroll travel, mapped to a 12-second conceptual film. Mobile uses a shorter distance and adjusted composition. Reduced-motion preferences disable the zoom, installation travel and walking pose cycle; the story still advances by gentle opacity changes on scroll.

## Easy edits

| File | Purpose |
| --- | --- |
| `public/cinematic/timeline.js` | Normalized scene timings and reversible animation |
| `public/pages/home.js` | Scene layers, captions, final reveal |
| `public/pages/technology.js` | Technology page layout |
| `public/pages/login.js` | Coming-soon portal |
| `public/content.js` | Planned features, specifications and FAQ copy |
| `public/styles/brand.css` | Brand colors, local system fonts, shared controls |
| `public/styles/site.css` | Layout, sensor design, compositing and responsive rules |
| `public/components/brand.js` | Original shield/signal SVG mark and CSS sensor markup |
| `public/assets/scenes/` | Generated local artwork |

### Replace artwork

- `exterior.png`: standalone 16:9 exterior, currently 1672 × 941.
- `hallway-empty.png`: matching 16:9 empty hallway, currently 1672 × 941. The hallway and overlays share a 16:9 coordinate system.
- `resident-sprites-clean.png`: transparent **1536 × 1024** PNG, three columns × two rows of 512-pixel square cells. Top row: walking poses 1–3. Bottom row: walking pose 4, seated pose, seated alternate. Preserve the layout and character scale when replacing it.
- `resident-sprites.png`: retained first generation for provenance; not loaded by the site.

The resident is a stylized four-pose sprite animation driven by scrolling, not a video or a physics-based fall animation. Contact shadows are composited in CSS. The seated state is revealed with a brief light dissolve, with no impact depicted.

The critical exterior, hallway and final sprite sheet are preloaded and decoded before revealing the experience. Assets and typography have no remote URLs. See `ASSETS.md` for the generation prompts and provenance.

## Scope and honesty

This is a simulated product story, not working fall detection. There is no sensor connection, trained classifier, account access, alert transmission, form submission, analytics or personal data collection. Accuracy, coverage and technical requirements remain unvalidated. The site labels the cinematic sequence as a concept simulation.

## Credits

- Implementation and visual direction: OpenAI Codex assistance.
- Original scene and character imagery: built-in OpenAI image generation, guided by the user-supplied reference PNG. Generated using the account's included plan allowance; no paid API was invoked.
- Brand icon, sensor graphics, layouts and scroll animation: original SVG/CSS/JavaScript in this project.
- Runtime: Python standard library, browser HTML/CSS/JavaScript. No third-party frontend libraries, remote fonts, stock assets or paid services.

## Verification

Browser checks cover initial load, chapter navigation, native forward/reverse scroll, installation and detection states, final reveal, both linked pages, FAQ expansion, the contact placeholder, and responsive desktop/mobile layout. Console logs were checked for errors. The website is intentionally local-only and has not been deployed.
