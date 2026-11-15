// Sections below the 3D story, in pitch order: problem, demo, how the AI works, path to customers,
// competition, privacy. Copy comes from the team's research notes and real conversations.
// Anything not decided yet is labeled, never invented.
import { DEMO_VIDEO } from '../cinematic/story.js';
import { teamSection, valleyFooter } from './additions.js';

const tag = (text, kind = '') => `<span class="info-tag ${kind}">${text}</span>`;

// Photo of The Villages of San Luis Obispo. Put the file at /assets/visit/the-villages-slo.jpg and set this path.
const VISIT_PHOTO = '/assets/visit/the-villages-slo.jpg';
const visitPhoto = () => VISIT_PHOTO
  ? `<figure class="visit-photo"><img src="${VISIT_PHOTO}" alt="The Villages of San Luis Obispo" loading="lazy"></figure>`
  : `<div class="visit-photo"><div><span>PHOTO</span>The Villages of San Luis Obispo<br>Photo from our visit goes here.</div></div>`;

function video() {
  if (!DEMO_VIDEO) {
    // Placeholder until the YouTube link is pasted into DEMO_VIDEO in cinematic/story.js.
    return `<div class="video-frame video-empty signal-target"><div><span class="play-mark" aria-hidden="true">▶</span><p>Demo video</p><span>Recorded on our three-board prototype during the hackathon. Video goes here.</span></div></div>`;
  }
  const yt = DEMO_VIDEO.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (yt) return `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Haven demo video" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  return `<div class="video-frame"><video src="${DEMO_VIDEO}" controls playsinline preload="metadata"></video></div>`;
}

const competitors = [
  ['Cameras + AI', 'Various', 'Accurate in good light.', 'Nobody wants video in their bedroom or bathroom, and cameras struggle in the dark.'],
  ['Pendants and watches', 'Call buttons, smartwatches', 'Cheap and simple.', 'They get forgotten or taken off, and you still have to press the button.'],
  ['Radar (mmWave)', 'Vayyar, Sensatec, Hikvision', 'Camera-free and already sold to care homes.', 'Around $199–250 per device plus $20–49 a month (third-party reviews of Vayyar Care).'],
  ['Thermal sensors', 'Butlr', 'Camera-free, heat-based sensing.', 'A separate sensor per room; Haven reads the Wi-Fi signal instead.'],
  ['Wi-Fi sensing', 'Cognitive Systems, Origin Wireless', 'Uses existing Wi-Fi to sense motion.', 'Haven focuses on fall alerts for care facilities: room, time, and minutes without movement.'],
  ['Bed and chair mats', 'Various', 'Simple to install.', 'They detect leaving the bed, not a fall.']
];

const aiSteps = [
  ['01 / SENSE', 'Wi-Fi readings', 'ESP32 sensors measure how the Wi-Fi signal reaching them changes (CSI); our demo room used three boards. Every half second, Haven sums up the last 1.5 seconds: the shape of the signal across subcarriers, how much it spreads, and how fast it changes.'],
  ['02 / TEACH', 'The camera labels', 'During training only, a webcam runs Google’s MediaPipe Pose in the browser. It finds the body’s joints and reads torso angle, hip movement and knee angle to name what the person is doing: empty, standing, walking, sitting, lying, or a fall. Only that one word leaves the browser.'],
  ['03 / LEARN', 'Wi-Fi learns from it', 'Each Wi-Fi window is paired with the camera’s label. A machine-learning model (k-nearest neighbours on standardized signal features) learns which Wi-Fi patterns go with which activity, then is tested on recordings it never trained on.'],
  ['04 / DETECT', 'Camera removed', 'The webcam is unplugged. Haven now runs on Wi-Fi alone. A sudden change followed by lying still means a possible fall; if the person stays down, staff get the room, the time and how long there has been no movement.']
];

// Scroll-scrubbed exploded view of the real sensor enclosure (Blender renders, see hardware/esp32-case).
// Mounted by app.js with components/assembly.js.
export const ASSEMBLY_FRAMES = { src: '/assets/assembly/frame_%03d.webp', count: 240 };
export function productSection() {
  return `<section id="sensor" class="product-intro page-width" aria-labelledby="sensor-title">
    <span class="eyebrow">THE HAVEN SENSOR</span>
    <h2 id="sensor-title">Everything it needs.<br><em>Nothing it doesn’t.</em></h2>
    <p>One per room, plugged into a wall outlet. It listens to the Wi-Fi router the building already has. Our own enclosure, designed and modeled at the hackathon around the ESP32 boards in our demo.</p>
    <span class="scroll-cue" aria-hidden="true">SCROLL TO ASSEMBLE ↓</span>
  </section>
  <section class="assembly" aria-label="Animated assembly of the Haven sensor enclosure">
    <div class="assembly-stage">
      <canvas role="img" aria-label="Exploded view of the sensor assembling: case, ESP32 board, USB cable, charger and lid with internal antenna"></canvas>
      <p class="assembly-caption" data-from="1" data-to="23"><span class="eyebrow">01 / THE PARTS</span><strong>Five parts. One small device.</strong></p>
      <p class="assembly-caption" data-from="24" data-to="68"><span class="eyebrow">02 / THE BRAIN</span><strong>An ESP32 board reads the Wi-Fi signal.</strong></p>
      <p class="assembly-caption" data-from="69" data-to="103"><span class="eyebrow">03 / POWER</span><strong>A short USB lead, tucked away.</strong></p>
      <p class="assembly-caption" data-from="104" data-to="158"><span class="eyebrow">04 / MOUNTING</span><strong>Slides onto a standard USB charger.</strong></p>
      <p class="assembly-caption" data-from="159" data-to="209"><span class="eyebrow">05 / SIGNAL</span><strong>The 2.4 GHz antenna lives in the lid.</strong></p>
      <p class="assembly-caption" data-from="210" data-to="240"><span class="eyebrow">06 / DONE</span><strong>Plug it into the wall. That’s it.</strong></p>
    </div>
  </section>
  <section class="real-build page-width" aria-label="Photos of our real sensor"><div class="process-strip"><figure><img src="/assets/process/sensor-installed.jpg" alt="Our black sensor enclosure plugged into a wall outlet above the baseboard" loading="lazy"><figcaption>The real one, plugged into a wall outlet.</figcaption></figure><figure><img src="/assets/process/sensor-open.jpg" alt="Lid off: the ESP32 board with its antenna lead inside the enclosure" loading="lazy"><figcaption>Lid off: the ESP32 board and its antenna.</figcaption></figure><p class="process-note"><span class="eyebrow">FROM OUR BUILD</span>Built and tested at the hackathon. One per room, powered from a normal outlet.</p></div></section>`;
}

export function storySections() {
  return `<div class="story-after">
  <nav class="info-nav page-width" aria-label="More about Haven"><a href="#problem">Problem</a><a href="#demo">Demo</a><a href="#ai">How the AI works</a><a href="#business">Customers</a><a href="#competition">Competition</a><a href="#privacy">Privacy</a></nav>

  <section id="problem" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">01 / THE PROBLEM</span><h2>Too many hallways.<br><em>Not enough hands.</em></h2><p>Care facilities are short-staffed. One caregiver can’t watch every hallway and every room, and most falls happen behind a closed door. If a resident can’t reach the call button, nobody knows until the next check.</p></div>
    <div class="stat-row"><div class="stat signal-target"><b>~3 in 4</b><span>nursing home falls happen in residents’ own rooms or bathrooms</span></div><div class="stat signal-target"><b>Nearly all</b><span>assisted living communities reported staffing shortages (96% in an industry survey)</span></div><div class="stat signal-target"><b>$6,306</b><span>average cost of one fall in skilled nursing</span></div></div>
    <div class="card-grid four">
      <article class="info-card signal-target"><span class="card-kicker">Who we build for</span><h3>The short-staffed caregiver</h3><p>Covering more rooms than one person can watch. Haven tells them what’s going on, and where, so they go to the right room first.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">What they get</span><h3>Room, time, minutes still</h3><p>An alert with the room number, when it happened, and how long there has been no movement. Nobody has to press a button.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Who it protects</span><h3>Residents</h3><p>Nothing to wear, charge, or remember to press, which matters for residents living with dementia.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Who it reassures</span><h3>Families</h3><p>Peace of mind without a camera in a parent’s bedroom or bathroom.</p></article>
    </div>
    <div class="visit">
      <div class="visit-photos">${visitPhoto()}<figure class="visit-photo"><img src="/assets/visit/fire-station.jpg" alt="Our team in the cab of a fire department paramedic engine" loading="lazy"></figure></div>
      <div class="quote-slot signal-target"><span class="eyebrow">WHAT WE’RE HEARING</span><p>We showed Haven to staff at The Villages of San Luis Obispo, an assisted living community next door to us. They told us it could be a useful addition to how they look after residents.</p>${tag('Real conversation · more in progress')}</div>
    </div>
    <p class="fine-print">Sources: one-year study of 528 Bavarian nursing homes (<a href="https://pubmed.ncbi.nlm.nih.gov/21816682/" target="_blank" rel="noopener">PubMed 21816682</a>); AHCA/NCAL provider survey, 2021 (<a href="https://www.providermagazine.com/Articles/Pages/Most-Nursing-Homes-and-Assisted-Living-Communities-Face-a-Workforce-Crisis.aspx" target="_blank" rel="noopener">Provider Magazine</a>); ECRI, “Managing Falls in Aging Services.”</p>
    <div class="why-now demand"><span class="eyebrow">PROOF OF DEMAND · THE MARKET IS ALREADY BUYING</span>
      <div class="demand-grid">
        <div><b>800+</b><span>senior living communities use SafelyYou’s AI fall detection, which raised a $43M Series C in 2025. It uses cameras; Haven doesn’t.</span></div>
        <div><b>$100M</b><span>Series B for Inspiren (2025), whose AI fall and safety platform reports 500+ communities.</span></div>
        <div><b>Nurse-call</b><span>Austco added Vayyar’s camera-free radar fall detection to its nurse-call platform, the same channel we plan to use.</span></div>
        <div><b>32%</b><span>of not-for-profit providers without a fall-detection partner plan to add automatic fall detection within 12 months.</span></div>
      </div>
    </div>
    <p class="fine-print">Company-reported figures. Sources: <a href="https://www.safely-you.com/news/powered-by-43m-in-series-c-funding-safelyyou-tackles-senior-livings-critical-need-for-predictive-care-with-ai-solution/" target="_blank" rel="noopener">SafelyYou</a>, <a href="https://www.insightpartners.com/ideas/inspiren-raises-100m-series-b-to-lead-senior-livings-ai-driven-future/" target="_blank" rel="noopener">Insight Partners</a>, <a href="https://prnewswire.com/apac/news-releases/austco-augments-industry-leading-nurse-call-and-healthcare-communications-solutions-with-4d-imaging-radar-fall-detection-by-vayyar-301770239.html" target="_blank" rel="noopener">Austco / Vayyar</a>, <a href="https://www.ziegler.com/media/kz4bqjld/ziegler-linkage-leadingage-cast-cto-hotline_fnl.pdf" target="_blank" rel="noopener">Ziegler · LeadingAge CAST CTO Hotline</a>.</p>
  </section>

  <section id="demo" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">02 / DEMO</span><h2>See it in a <em>real room</em>.</h2><p>Three small Wi-Fi sensors in a normal room. A person walks in, falls, and doesn’t get up. No camera, nothing worn, no button pressed. Haven sees a sudden change in the signal, then stillness, and the caregiver gets the alert.</p></div>
    ${video()}
    <div class="stat-row"><div class="stat signal-target"><b>95%</b><span>of activities identified on a test the model never saw: empty room, standing, walking, and lying on the floor</span></div><div class="stat signal-target"><b>0</b><span>false alarms in 12 tests of everyday activity</span></div><div class="stat signal-target"><b>3 sec</b><span>on the floor before the alert fires. No camera, no light needed.</span></div></div>
    <p class="fine-print">Our own recordings on our ESP32 boards, Nov 14, 2026: one room, one person. The model trained on three guided rounds and was scored on a fourth it never saw. In those tests 18 of 20 lie-downs raised an alert. 95% is our best sensor placement; three other placements scored 77–87%, which is why each room gets its own short training session. Falls were acted out by lying down on a mat; real falls have not been tested.</p>
  </section>

  <section id="ai" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">03 / HOW THE AI WORKS</span><h2>The camera teaches.<br><em>Then it leaves.</em></h2><p>To a person, Wi-Fi signal data looks like noise. A camera understands posture easily but has no place in a bedroom. Haven uses one to teach the other: the camera labels what’s happening while Wi-Fi learns to recognize it, then the camera goes away for good.</p></div>
    <div class="card-grid four">
      ${aiSteps.map(([k, h, p]) => `<article class="info-card signal-target"><span class="card-kicker">${k}</span><h3>${h}</h3><p>${p}</p></article>`).join('')}
    </div>
    <div class="process-strip"><figure><img src="/assets/process/training-fall.jpg" alt="Training page: the pose model outlines a team member falling sideways onto a mat and labels it fall" loading="lazy"><figcaption>Training a fall: the pose model labels it from the webcam.</figcaption></figure><figure><img src="/assets/process/training-sitting.jpg" alt="Training page: camera label says sitting while the Wi-Fi-only model still says standing" loading="lazy"><figcaption>Mid-training: the camera says sitting, Wi-Fi is still learning.</figcaption></figure><p class="process-note"><span class="eyebrow">FROM OUR BUILD</span>Our webcam teacher page during guided recording: the camera’s label and the Wi-Fi model’s guess side by side.</p></div>
    <div class="why-now"><span class="eyebrow">WHY IT’S A NEW USE OF AI</span><div class="why-grid"><div><b>No hand-labeling</b><span>A pose model labels every half second of Wi-Fi data automatically. Teaching a room takes a few minutes of guided movement instead of hours of tagging.</span></div><div><b>One AI teaches another</b><span>A vision model trains a Wi-Fi model. Haven gets what a camera can tell, with no camera in the room.</span></div><div><b>It breaks without AI</b><span>No human or simple rule can read CSI as “sitting” or “fell.” Without the model, there is no product.</span></div></div></div>
    <div class="why-now built"><span class="eyebrow">HOW WE BUILT IT WITH AI</span>
      <div class="demand-grid">
        <div class="lead"><b>OpenAI Codex</b><span>Our main AI teammate. Codex researched Wi-Fi sensing and the market with us and worked as a coding agent in our shared repository, taking build tasks alongside the team.</span></div>
        <div><b>Claude Code</b><span>Helped build the ESP32 firmware, compare detection models on our recordings, and build this website and its 3D scene.</span></div>
        <div><b>Google MediaPipe</b><span>Google’s open-source pose model (Apache-2.0) does the image recognition while we train: it reads posture from the webcam so Haven can label the Wi-Fi data.</span></div>
        <div><b>Open-source firmware</b><span>Our ESP32 firmware is built on Espressif’s open-source ESP-IDF and speaks the same CSI packet format as the open-source RuView project.</span></div>
      </div>
    </div>
    <p class="fine-print">The video never leaves the browser and is never stored. Only Wi-Fi features and activity labels are saved. Pose model: Google MediaPipe Pose Landmarker (Apache-2.0). Approach adapted from wifi-sensing-kit (MIT).</p>
  </section>

  <section id="business" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">04 / PATH TO CUSTOMERS</span><h2>Nursing homes<br><em>subscribe per room</em>.</h2><p>Haven is a subscription. The facility pays one monthly price per room, sensors included, so there’s no hardware to buy up front. It pays for itself if it helps avoid about four falls a year.</p></div>
    <div class="card-grid four">
      <article class="info-card signal-target"><span class="card-kicker">Who pays</span><h3>The facility</h3><p>Nursing homes and assisted living operators. The decision sits with the executive director or director of nursing, who answer for fall rates and the lawsuits that follow.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Price</span><h3>$20 / room / month</h3><p>Sensors included. No hardware for the facility to buy up front.</p>${tag('Working assumption', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Pays for itself</span><h3>~4 falls a year</h3><p>100 rooms is about $24,000 a year: roughly four falls at $6,306 each, or a tenth of one average fall lawsuit (~$245K).</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Scales per room</span><h3>One sensor, one room</h3><p>Each room gets one plug-in sensor on the Wi-Fi the building already has. Adding a room means adding one sensor: no rewiring, no new network.</p></article>
    </div>
    <div class="why-now"><span class="eyebrow">WHERE THE FIRST CUSTOMERS COME FROM</span><div class="why-grid"><div><b>1. Next door</b><span>Start with The Villages of San Luis Obispo, the community we’ve already talked to, as a first pilot candidate.</span></div><div><b>2. Local operators</b><span>Then other nursing homes and assisted living communities nearby, reached in person by our team.</span></div><div><b>3. Nurse-call partners</b><span>Later, companies that already sell call systems to facilities (such as Austco or TekTone) could offer Haven as an add-on.</span></div></div></div>
    <div class="why-now"><span class="eyebrow">WHY THEY’D SWITCH</span><div class="why-grid"><div><b>Nothing to wear</b><span>Pendants get taken off and still need a button press. Haven works on its own.</span></div><div><b>No cameras</b><span>Families and residents say no to video in bedrooms. Haven captures no images or audio.</span></div><div><b>Nothing to install</b><span>One plug-in sensor per room on the existing Wi-Fi, versus ~$199–250 per radar device plus a monthly fee.</span></div></div></div>
    <div class="why-now"><span class="eyebrow">PILOT PLAN, THEN SCALE · LIKELY REVENUE</span>
      <div class="plan-grid">
        <div><span class="plan-when">Months 0–3</span><b>Pilot</b><p>About 20 rooms at The Villages of San Luis Obispo, free for 60 days. We measure time from fall to help, missed falls and false alerts, logged with staff.</p><strong>$0</strong></div>
        <div><span class="plan-when">Year 1</span><b>Central Coast</b><p>Convert the pilot, then 5 local communities, about 400 rooms, sold in person to directors of nursing.</p><strong>~$96K / yr</strong></div>
        <div><span class="plan-when">Years 2–3</span><b>California</b><p>About 100 communities, 8,000 rooms, through nurse-call partners who already sell to facilities.</p><strong>~$1.9M / yr</strong></div>
        <div><span class="plan-when">Year 5</span><b>National</b><p>About 1,000 communities, 80,000 rooms: roughly 2% of U.S. communities (SafelyYou reports 800+).</p><strong>~$19M / yr</strong></div>
      </div>
    </div>
    <p class="fine-print">Revenue projection at the $20 per room per month working price ($240 per room per year). Revenue only; not a profit forecast. Market: about 15,000 U.S. nursing homes and 30,000 assisted living communities, 2.2M residents, or roughly $530M a year at $240 per resident (our estimate). Lawsuit figure: CNA Aging Services Claim Report via Skilled Nursing News (2022).</p>
  </section>

  <section id="competition" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">05 / COMPETITION</span><h2>How Haven<br><em>compares</em>.</h2><p>Every alternative breaks somewhere. Haven adds one small plug-in sensor per room on the building’s own Wi-Fi, with nothing to wear and nothing to remember.</p></div>
    <div class="compare-table" role="table" aria-label="Competitor comparison">
      <div class="compare-row compare-header" role="row"><span role="columnheader">Approach</span><span role="columnheader">Examples</span><span role="columnheader">Strength</span><span role="columnheader">Where Haven fits</span></div>
      ${competitors.map(([a, e, s, h]) => `<div class="compare-row signal-target" role="row"><b role="cell">${a}</b><span role="cell">${e}</span><span role="cell">${s}</span><span role="cell">${h}</span></div>`).join('')}
    </div>
    <div class="honest-note"><b>Our honest weakness:</b> Wi-Fi sensing has far fewer real-world deployments than radar, and each room needs its own short training session. Next: alerts to staff phones and nurse-call systems, and a pilot in a real facility with logged true and false alerts.</div>
  </section>

  <section id="privacy" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">06 / PRIVACY</span><h2>Private<br><em>by design</em>.</h2><p>Haven senses changes in the Wi-Fi signal. It never sees a face and never hears a voice.</p></div>
    <div class="card-grid three">
      <article class="info-card signal-target"><span class="card-kicker">No cameras</span><h3>No images, no audio</h3><p>No cameras, no microphones, and nothing for residents to wear.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">No identity</span><h3>Rooms, not people</h3><p>Alerts show a room number, the time, and minutes without movement. No names, photos or health records.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Training only</span><h3>Camera as teacher</h3><p>A webcam labels what’s happening only while we train the model. Then it’s removed, and Haven runs on Wi-Fi alone.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">On site</span><h3>Local processing</h3><p>Signal analysis runs on the facility’s own equipment, so raw Wi-Fi data stays in the building.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Security</span><h3>Treated as health data</h3><p>Alert data encrypted in transit and at rest.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Honest claims</span><h3>An alerting aid</h3><p>Haven detects possible falls and alerts staff faster. It does not prevent falls or diagnose anything.</p></article>
    </div>
    <div class="info-cta"><span>Prototype. Not a medical device.</span></div>
  </section>
  ${teamSection()}
  ${valleyFooter()}
</div>`;
}
