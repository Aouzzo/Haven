// Sections below the 3D story. Copy comes from the team's research notes, pitch deck and GitHub
// results. Anything not decided yet is labeled, never invented. Present-mode-only slides live in
// pages/present.js and are mixed in here (class "present-only").
import { arrow, shield } from '../components/brand.js';
import { DEMO_VIDEO } from '../cinematic/story.js';
import { presentSlides } from './present.js';

const tag = (text, kind = '') => `<span class="info-tag ${kind}">${text}</span>`;
const meadow = (variant = '') => `<div class="meadow ${variant}" aria-hidden="true"><canvas></canvas></div>`;
const head = (n, label, title, text) => `<div class="info-head"><span class="eyebrow"><i>${n}</i>${label}</span><h2 class="split">${title}</h2>${text ? `<p>${text}</p>` : ''}</div>`;

function video() {
  if (!DEMO_VIDEO) {
    return `<div class="video-frame video-empty signal-target"><div><span class="play-mark" aria-hidden="true">▶</span><p>Demo video coming soon</p><span>Recorded from our three-board prototype during the hackathon.</span></div></div>`;
  }
  const yt = DEMO_VIDEO.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if (yt) return `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Haven demo video" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  return `<div class="video-frame"><video src="${DEMO_VIDEO}" controls playsinline preload="metadata"></video></div>`;
}

// Competition matrix: [name, examples, no camera, nothing to wear, works in the dark, low cost per room, note]
const competitors = [
  ['Haven', 'Wi-Fi sensing + AI', 1, 1, 1, 1, '~$18–39 of hardware per room at scale'],
  ['Cameras + AI', 'Various', 0, 1, 0, .5, 'Nobody wants video in a bedroom or bathroom'],
  ['Pendants and watches', 'Call buttons, smartwatches', 1, 0, 1, 1, 'Forgotten or taken off, and you still have to press'],
  ['Radar (mmWave)', 'Vayyar, Sensatec, Hikvision', 1, 1, 1, 0, '~$199–250 per device + $20–49/month*'],
  ['Thermal sensors', 'Butlr', 1, 1, 1, .5, 'A separate heat sensor in every room'],
  ['Bed and chair mats', 'Various', 1, 1, 1, 1, 'Detect leaving the bed, not a fall'],
  ['Other Wi-Fi sensing', 'Cognitive Systems, Origin Wireless', 1, 1, 1, .5, 'Motion sensing for homes; Haven targets care-facility fall alerts']
];
const mark = v => v === 1 ? '<span class="yes" aria-label="yes">●</span>' : v === 0 ? '<span class="no" aria-label="no">○</span>' : '<span class="part" aria-label="partly">◐</span>';

export function storySections() {
  const P = presentSlides();
  return `<div class="story-after">
  <div class="marquee" aria-hidden="true"><div>${'<span>No cameras</span><span>No wearables</span><span>No buttons to press</span><span>Works in the dark</span><span>Rooms, not people</span><span>Built to alert in seconds</span>'.repeat(4)}</div></div>
  <nav class="info-nav" aria-label="More about Haven"><a href="#device">Device</a><a href="#how">How it works</a><a href="#ai">The AI</a>${DEMO_VIDEO ? '<a href="#demo">Demo</a>' : ''}<a href="#customers">Customers</a><a href="#business">Business</a><a href="#competition">Competition</a><a href="#privacy">Privacy</a><a href="#team">Team</a></nav>

  ${P.problem}

  <section id="device" class="device" data-slide="The device">
    <div class="device-stage">
      <canvas class="device-canvas" aria-label="Exploded view of the Haven sensor: an ESP32 Wi-Fi board, USB cable and wall plug assemble into a small plug-in case."></canvas>
      <div class="device-copy">
        <span class="eyebrow"><i>01</i>THE DEVICE</span>
        <h2 class="split">Small enough to <em>forget</em>.</h2>
        <ol class="device-steps">
          <li data-from="0" data-to=".3"><b>An ESP32 Wi-Fi board</b><span>A $5–10 chip that reads Channel State Information: how the Wi-Fi signal bends around a room.</span></li>
          <li data-from=".3" data-to=".65"><b>Power built in</b><span>Plugs into any outlet. No batteries to charge, nothing for staff to remember.</span></li>
          <li data-from=".65" data-to="1.01"><b>Three per room</b><span>They send Wi-Fi to each other: three invisible lines across the room, read about 30 times a second.</span></li>
        </ol>
        <span class="fine-print">Case designed and rendered by our team in Blender. Prototype.</span>
      </div>
    </div>
  </section>

  <section id="how" class="dark-band how" data-slide="How it works">
    <canvas class="fireflies-bg" aria-hidden="true"></canvas>
    <div class="page-width">
      ${head('02', 'HOW IT WORKS', 'Move through the room.<br><em>Watch the signal.</em>', 'An interactive illustration of the idea (not live sensor data). Move your cursor through the room: your body bends the Wi-Fi lines. Click to fall.')}
      <div class="how-grid">
        <div class="room-demo signal-target"><canvas class="room-canvas" aria-label="Interactive simulation: three sensors in a room; moving the cursor disturbs the Wi-Fi links, clicking simulates a fall."></canvas>
          <div class="room-hud"><span class="room-badge">SIMULATION</span><span class="room-state">Move your cursor into the room</span></div>
          <div class="room-alert" hidden><b>Possible fall</b><span>Room 104 · no movement <em class="room-timer">0:00</em></span></div>
        </div>
        <ol class="how-steps">
          <li class="reveal-item"><i>1</i><div><b>Sense</b><span>Three small sensors send Wi-Fi to each other, about 30 readings a second on each line.</span></div></li>
          <li class="reveal-item"><i>2</i><div><b>Disturb</b><span>Wi-Fi bounces off walls, furniture and people. Walking, sitting and falling each change it differently.</span></div></li>
          <li class="reveal-item"><i>3</i><div><b>Learn</b><span>A webcam labels what’s happening only while we train. Then it’s removed: the model runs on Wi-Fi alone.</span></div></li>
          <li class="reveal-item"><i>4</i><div><b>Remember</b><span>A memory layer knows someone came in and never left, so stillness after a fall never reads as an empty room.</span></div></li>
        </ol>
      </div>
      <div class="link-meters" aria-hidden="true"><div><span>Link 1→2</span><b><i></i></b></div><div><span>Link 2→3</span><b><i></i></b></div><div><span>Link 3→1</span><b><i></i></b></div></div>
    </div>
  </section>

  <section id="ai" class="dark-band ai" data-slide="The AI">
    <div class="page-width">
      ${head('03', 'THE AI', 'The product <em>is</em> the model.', 'The signal looks like noise to people. Our model, trained on our own recordings, turns it into one question: is someone moving, still, or down?')}
      <div class="pipeline reveal-item" aria-label="Pipeline: three ESP32 sensors, CSI stream, motion model, memory layer, caregiver alert">
        <div><b>3 × ESP32</b><span>router-free links</span></div><svg viewBox="0 0 60 10"><path d="M0 5 H60"/></svg>
        <div><b>CSI stream</b><span>~30 readings/s/link</span></div><svg viewBox="0 0 60 10"><path d="M0 5 H60"/></svg>
        <div><b>Motion model</b><span>moving vs still</span></div><svg viewBox="0 0 60 10"><path d="M0 5 H60"/></svg>
        <div><b>Memory layer</b><span>in the room? left?</span></div><svg viewBox="0 0 60 10"><path d="M0 5 H60"/></svg>
        <div class="hot"><b>Alert</b><span>room · time · stillness</span></div>
      </div>
      <div class="big-stats">
        <div class="reveal-item"><b data-count="96" data-suffix="%">0%</b><span>moving vs still on held-out trials (1 room, 1 person)</span></div>
        <div class="reveal-item"><b data-count="60" data-prefix="~" data-suffix="%">0%</b><span>empty room vs still person. Why the memory layer exists</span></div>
        <div class="reveal-item"><b class="word-stat">In test</b><span>fall detection: not yet validated, so the alert is off by default</span></div>
        <div class="reveal-item"><b data-count="0">0</b><span>cameras in the room once the model is trained</span></div>
      </div>
      <p class="fine-print">96%: our own recording on our boards, Nov 14, 2026. One room, one person, leave-one-trial-out (logistic regression and random forest, 96–98%). Telling an empty room from a still person is harder (~60%), which is why the memory layer exists. Fall detection accuracy is still being measured, and the fall alert stays off by default until it is.</p>
    </div>
  </section>
  ${meadow('to-light')}

  ${DEMO_VIDEO ? `  <section id="demo" class="info-section page-width" data-slide="Demo">
    ${head('04', 'DEMO', 'See it in a <em>real room</em>.', 'Three small Wi-Fi sensors in a normal room. A person walks in, falls, and doesn’t get up. Haven is built to see the sudden change in the signal, then the stillness, and send the caregiver’s phone an alert.')}
    ${video()}
  </section>` : ''}
  ${P.live}

  <section id="customers" class="info-section page-width" data-slide="Customers">
    ${head('05', 'CUSTOMERS', 'Built for the <em>night shift</em>.', 'Most nursing home falls happen where nobody is watching. Today’s alerts depend on the person pressing a button.')}
    <div class="stat-row">
      <div class="stat reveal-item"><b data-count="3" data-prefix="~" data-suffix=" in 4">0</b><span>falls happen in residents’ own rooms or bathrooms</span></div>
      <div class="stat reveal-item"><b data-count="6306" data-prefix="$">0</b><span>average cost of one fall in skilled nursing</span></div>
      <div class="stat reveal-item"><b data-count="36" data-suffix="%">0</b><span>of nursing home liability claims are falls, averaging ~$245K each</span></div>
    </div>
    <div class="card-grid four">
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Who buys</span><h3>Director of nursing</h3><p>Responsible for fall rates, and for the lawsuits that come with them.</p>${tag('Our hypothesis', 'pending')}</article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Who uses it</span><h3>Caregivers</h3><p>Designed to alert their phone: which room, what time, and how long there has been no movement.</p></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Who it protects</span><h3>Residents</h3><p>Nothing to wear, charge, or remember to press, which matters for residents living with dementia.</p></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Who it reassures</span><h3>Families</h3><p>Peace of mind without a camera in a parent’s bedroom or bathroom.</p></article>
    </div>
    <p class="fine-print">Sources: one-year study of 528 Bavarian nursing homes (<a href="https://pubmed.ncbi.nlm.nih.gov/21816682/" target="_blank" rel="noopener">PubMed 21816682</a>); ECRI, “Managing Falls in Aging Services”; CNA Aging Services Claim Report via Skilled Nursing News (2022).</p>
    <div class="quote-slot signal-target"><span class="eyebrow">WHAT WE’RE HEARING</span><p>We are reaching out to Central Coast care facilities. Only real conversations will ever be quoted here.</p>${tag('Coming soon', 'pending')}</div>
  </section>

  <section id="business" class="info-section page-width" data-slide="Business">
    ${head('06', 'BUSINESS', 'One price <em>per room</em>.', 'Our plan: a monthly price per room, sensors included. Slide to see how many average fall costs it must offset to pay for itself.')}
    <div class="roi signal-target">
      <div class="roi-controls">
        <label>Rooms in the facility <output class="roi-rooms">100</output></label>
        <input type="range" class="roi-range" min="10" max="300" step="10" value="100" aria-label="Rooms in the facility">
        <label>Price per room per month <output class="roi-price">$20</output></label>
        <input type="range" class="roi-price-range" min="10" max="40" step="1" value="20" aria-label="Price per room per month">
        ${tag('Price is a working assumption', 'pending')}
      </div>
      <div class="roi-out">
        <div><span>Haven per year</span><b class="roi-cost">$24,000</b></div>
        <div><span>Average fall costs it must offset</span><b class="roi-falls">3.8</b></div>
        <div><span>Share of one average fall lawsuit</span><b class="roi-suit">10%</b></div>
        <div class="roi-bar" aria-hidden="true"><i></i></div>
        <small>Faster help after a fall, not fewer falls. A typical 100-bed home reports 100–200 falls a year (ISHN). $6,306 per fall (ECRI); ~$245K per fall claim (CNA).</small>
      </div>
    </div>
    <div class="card-grid three">
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Our cost</span><h3>$18–39 per room</h3><p>Hardware for a three-sensor kit at about 1,000 kits.</p><small>Bulk catalog prices, not quotes.</small></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Market</span><h3>~$530M a year</h3><p>About 15,000 U.S. nursing homes and 30,000 assisted living communities, 2.2M residents.</p><small>Our estimate: 2.2M residents × $240 a year.</small></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">First customers</span><h3>The Central Coast</h3><p>Start with local memory care and assisted living, then reach more through nurse-call system partners.</p></article>
    </div>
    <div class="why-now reveal-item"><span class="eyebrow">WHY NOW</span><div class="why-grid"><div><b>Cheap chips</b><span>$5–10 boards can now read detailed Wi-Fi signal data (CSI), which used to need lab equipment.</span></div><div><b>AI</b><span>The signal looks like noise to people. A model trained with a camera as teacher learns what it means.</span></div><div><b>A standard</b><span>IEEE 802.11bf, published in 2025, is a Wi-Fi standard built for sensing.</span></div></div></div>
  </section>
  ${meadow()}

  <section id="competition" class="info-section page-width" data-slide="Competition">
    ${head('07', 'COMPETITION', 'Every alternative <em>breaks somewhere</em>.', '')}
    <div class="matrix reveal-item" role="table" aria-label="Competitor comparison">
      <div class="m-row m-head" role="row"><span role="columnheader">Approach</span><span role="columnheader">No camera</span><span role="columnheader">Nothing to wear</span><span role="columnheader">Works in the dark</span><span role="columnheader">Low cost per room</span><span role="columnheader">Note</span></div>
      ${competitors.map(([n, e, a, b, c, d, note], i) => `<div class="m-row ${i ? '' : 'm-haven'} signal-target" role="row"><span role="cell"><b>${n}</b><small>${e}</small></span><span role="cell">${mark(a)}</span><span role="cell">${mark(b)}</span><span role="cell">${mark(c)}</span><span role="cell">${mark(d)}</span><span role="cell" class="m-note">${note}</span></div>`).join('')}
    </div>
    <p class="fine-print">* Radar pricing from third-party reviews of Vayyar Care; no official facility pricing.</p>
    <div class="honest-note reveal-item"><b>Our honest weakness:</b> Wi-Fi sensing has far fewer real-world deployments than radar, and each room needs calibration. Next: alerts to staff phones and nurse-call systems, and a pilot in a real facility with logged true and false alerts.</div>
  </section>

  <section id="privacy" class="info-section page-width" data-slide="Privacy">
    ${head('08', 'PRIVACY', 'Private <em>by design</em>.', 'Haven senses changes in the Wi-Fi signal. It never sees a face and never hears a voice.')}
    <div class="card-grid three">
      <article class="info-card reveal-item signal-target"><span class="card-kicker">No cameras</span><h3>No images, no audio</h3><p>No cameras, no microphones, and nothing for residents to wear.</p></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">No identity</span><h3>Rooms, not people</h3><p>Alerts show a room number, the time, and minutes without movement. No names, photos or health records.</p></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Training only</span><h3>Camera as teacher</h3><p>A webcam labels what’s happening only while we train the model. Then it’s removed.</p></article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">On site</span><h3>Local processing</h3><p>Signal analysis runs on the facility’s own equipment, so raw Wi-Fi data stays in the building.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Security</span><h3>Treated as health data</h3><p>Planned: encryption in transit and at rest, treated as health data.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card reveal-item signal-target"><span class="card-kicker">Honest claims</span><h3>An alerting aid</h3><p>Haven detects possible falls and alerts staff faster. It does not prevent falls or diagnose anything.</p></article>
    </div>
  </section>

  <section id="team" class="info-section page-width team" data-slide="Team">
    ${head('09', 'TEAM', 'Built in a weekend at <em>Cal Poly</em>.', 'CPVC AI Hackathon, November 2026.')}
    <div class="team-grid">
      ${[['Jack Jensen', 'JJ'], ['Anthony Ouzounian', 'AO'], ['Luis Scheibe', 'LS']].map(([n, i]) => `<div class="person reveal-item signal-target"><span class="avatar">${i}</span><b>${n}</b></div>`).join('')}
    </div>
    <div class="credits reveal-item"><b>How we built it, honestly</b><span>AI coding assistants: Claude Code (Anthropic) and OpenAI Codex helped write the firmware, model code and this website. The fall model is our own, trained on our own recordings. 3D: Three.js (MIT); device case modeled in Blender. Fonts: Fraunces and Inter (SIL OFL). Statistics are cited where they appear.</span></div>
    <div class="info-cta"><a class="button primary magnetic" href="/technology">Explore the Technology ${arrow}</a><span>Prototype. Not a medical device.</span></div>
  </section>
  ${P.next}
  ${P.thanks}
  <div class="meadow footer-scene" aria-hidden="true"><canvas></canvas><div class="footer-mark">${shield()}<span>Haven.</span></div></div>
</div>`;
}
