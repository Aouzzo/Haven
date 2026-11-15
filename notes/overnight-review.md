# Overnight review: Haven pitch site (`safer/public/`, branch `overnight/website-polish`)

Reviewed from code only (no rendered visuals). Paths are relative to `safer/public/`.

## 1. Top 10 improvements, ranked by rubric impact

1. **Show real demand (25 pts, currently zero evidence).** `pages/sections.js:117` `.quote-slot` says "Coming soon". Replace with real conversations only: role, facility type, date, one paraphrased line each. If there are none, say so plainly: "Contacted N facilities since Friday; M replied." Do not present the slot empty.
2. **Remove visible placeholders from the deck.** `pages/present.js:26` shows "Space for a screenshot... Edit pages/present.js." to judges. `cinematic/story.js:25` `DEMO_VIDEO = ''` makes present stop 8 an empty "coming soon" frame under "See it in a real room". Add a local mp4 (not YouTube, venue Wi-Fi) or hide `#demo` when empty.
3. **Fix "0 images captured, ever"** (`pages/sections.js:90`). A webcam labels training data, so this is false as written. Use: "0 cameras in the room once trained".
4. **Fix the ROI logic.** `pages/sections.js:132` "Falls avoided to break even" contradicts `:165` "does not prevent falls". Rename to "Average fall costs it must offset" and add: "Faster help after a fall, not fewer falls."
5. **Put the honest scoreboard at full size (AI 15 + Execution 25).** `pages/sections.js:86-91` `.big-stats`: replace the "3" and "~30" tiles with "~60% empty vs still (why the memory layer exists)" and "Falls: not yet validated, alert off by default". `.fine-print` is 11.5px (`styles/sections.css:24`), unreadable on a projector.
6. **Cut the deck to about 9 stops** (see section 4). 20 stops in 240 s is 12 s each, before the live demo.
7. **Add an AI tools and credits block** (`#team`, `pages/sections.js:169`). None exists on the site, and disclosure is a rule. List the AI coding tools used, the AI-generated `hallway-empty.png`, Three.js (MIT), Blender.
8. **Add Wi-Fi sensing rivals to the matrix** (`pages/sections.js:22-29`): Cognitive Systems and Origin Wireless, which `ReadME.md` says to name first. Add a column "Works if the person can't press anything"; today bed mats score identical to Haven.
9. **Retire or update the stale pages.** `/login` is "Enterprise Portal, Coming Soon" and is a primary CTA on the brand reveal (`pages/home.js:26`). `/technology` says alert delivery is "Planned · not implemented" and "does not detect real falls or send caregiver alerts" (`content.js`), contradicting the home page, and its sensor still carries the old "s." mark (`components/brand.js` `sensor()`). Point both CTAs at `#ai` and `#demo`.
10. **Name the payer as a hypothesis.** `pages/sections.js:121` "Nursing homes pay per room" reads as fact. Use "One price per room, per month" and tag "Who buys" (`:111`) as "Our hypothesis" unless a buyer said it.

## 2. Bugs and live-demo risks

- **Clicker dies after touching the ROI slider.** `cinematic/present.js:88` ignores keys while an `input` has focus, so PageDown moves the slider instead of the deck. Blur the range on `change`.
- **Space/Enter may exit the deck.** After clicking "Present" the button keeps focus (`cinematic/present.js:83`); Enter re-toggles it and Space may too. Call `btn.blur()` in `set()`. Test with the real clicker.
- **3D renders while off screen.** `cinematic/timeline.js:112` calls `world.render` every frame, even far below the story, so the full post-processing chain competes with the room, meadow and device canvases on every later slide. Skip when `scrollY > scroll.offsetHeight`.
- **One render exception freezes the page.** `cinematic/timeline.js:112-114`: `requestAnimationFrame(frame)` comes after `world.render`. Wrap in try/catch. No `webglcontextlost` handler either.
- **Quality floor is too high.** `cinematic/scene3d.js:864-870` only drops AO, then DOF. 4x MSAA half-float target (`:663`) and bloom stay on, with no pixel-ratio step. Fullscreen on a projector is more pixels than the 1440x900 test. Add a third tier (pixel ratio 1). Rehearse on the actual display.
- **Slides overflow one screen.** `styles/sections.css:215-216` gives each section one stop and a 56-110px headline; Customers, Business and Privacy (6 cards) likely run past 100vh and the next key skips the rest.
- **Device frames lazy-load** (`cinematic/device.js:42-44`); jumping there in present mode can show a blank canvas (`:29`). Preload all 48 on entering present mode.
- **Fall alert is an `aria-live` region rewritten every frame** (`pages/home.js:20`, `cinematic/timeline.js:71`). Move the timer out of the live region.
- **Stale meta description** calls Haven "conceptual" (`index.html:7`).

## 3. Honesty and compliance

- `pages/sections.js:59`: "This is a live simulation of what our three sensors see." `ReadME.md` reserves LIVE for real sensor data. Use "An interactive illustration of the idea."
- `cinematic/room.js:130`: "Movement detected · tracking". Banned surveillance wording. Use "Movement detected".
- `pages/sections.js:35` marquee "Alerts in seconds", `cinematic/story.js:7` "Staff know right away.", and `pages/sections.js:98,112` "the caregiver's phone gets the alert": present-tense fall alerting while fall detection is unvalidated and off by default. Add "designed to", or show the SIMULATED badge beside them.
- `pages/present.js:14-18` problem slide has three statistics and no sources. Copy the source line from `pages/sections.js:116`. `NOTES.md` says the numbers still need to be opened and confirmed; do that. The 3-in-4 figure is from German homes; say so if asked.
- `pages/sections.js:164` "HIPAA-level care" (tagged Planned): cut to "Planned: encryption in transit and at rest."
- `pages/sections.js:87` "96%": real and well caveated. Add "1 room, 1 person" to the label itself.
- `pages/sections.js:170` "Everything you see was built from Friday 5 PM": confirm the Blender case and the AI hallway image qualify.

## 4. Presentation-mode flow

Current order: six 3D chapters, Problem, Demo (empty), Live demo, How, AI, Device (2 stops), Customers, Business, Competition, Privacy, Team, Next, Thanks. The problem arrives at stop 7, after about a minute of animation, and the 45 points for user and customers arrive last, where the clock cuts them.

Suggested order (`styles/sections.css:220` `order` values, plus dropping chapter stops in `cinematic/present.js:22`):
1. Title (chapter 0), 10 s
2. Problem, with one named real person or role, 25 s
3. 3D "Possible fall" then "Care team" as the one user's path, 25 s
4. Live demo, 75 s, with a real link to the local dashboard on the slide
5. The AI: honest numbers, 30 s
6. Customers: real conversations, 30 s
7. Business: payer, price, first channel, 25 s
8. What's next plus the honest weakness, 15 s
9. Thanks

Move How, Device, Competition, Privacy and Team after Thanks as a Q&A appendix. Missing: a named first user, the reason to switch (versus pendants already owned), the first three specific facilities or nurse-call partners, AI tools disclosure. Cut: the Team slide (names are on the title) and the Community, Sensing, Daily life and Haven chapter stops.

## 5. Three alternate themes (separate branches)

**Night shift.** Whole site in dark ink with one amber accent, styled as a nursing-station console at 2 AM: monospace room numbers, a persistent six-room status strip in the header, alerts in coral. It makes the dashboard the hero and reads as a shipped product, not a film.

**Clinical paper.** White, dense, Swiss grid: one sans family, hairline rules, numbered figures, every statistic with an inline footnote, and the 3D scene reduced to a single framed figure. It trades wow for credibility and puts the honest results in the foreground.

**Signal.** The CSI trace is the identity: a continuous teal waveform runs down the page margin and reacts to scroll and cursor, section breaks are spikes, and the fall is the line going flat. Cream background, no meadow or fireflies. It ties the visuals to the AI story.
