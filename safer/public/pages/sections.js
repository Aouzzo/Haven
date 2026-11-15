// Sections below the 3D story: demo video, business, customers, competition, privacy.
// Copy comes from the team's research notes. Anything not decided yet is labeled, never invented.
import { arrow } from '../components/brand.js';
import { DEMO_VIDEO } from '../cinematic/story.js';

const tag = (text, kind = '') => `<span class="info-tag ${kind}">${text}</span>`;

function video() {
  if (!DEMO_VIDEO) {
    return `<div class="video-frame video-empty signal-target"><div><span class="play-mark" aria-hidden="true">▶</span><p>Demo video coming soon</p><span>Recorded from our three-board prototype during the hackathon.</span></div></div>`;
  }
  const yt = DEMO_VIDEO.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
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

export function storySections() {
  return `<div class="story-after">
  <nav class="info-nav page-width" aria-label="More about Haven"><a href="#demo">Demo</a><a href="#business">Business</a><a href="#customers">Customers</a><a href="#competition">Competition</a><a href="#privacy">Privacy</a></nav>

  <section id="demo" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">01 / DEMO</span><h2>See it in a <em>real room</em>.</h2><p>Three small Wi-Fi sensors in a normal room. A person walks in, falls, and doesn’t get up. No camera, nothing worn, no button pressed. Haven sees a sudden change in the signal, then stillness, and the caregiver’s phone gets the alert.</p></div>
    ${video()}
    <div class="stat-row"><div class="stat signal-target"><b>96%</b><span>accurate at telling moving from still, on test trials the model never saw</span></div><div class="stat signal-target"><b>~30</b><span>Wi-Fi readings per second from each sensor</span></div><div class="stat signal-target"><b>0</b><span>images captured, ever. Wi-Fi needs no light, so Haven works in the dark.</span></div></div>
    <p class="fine-print">96%: our own recording on our boards, Nov 14, 2026. One room, one person, leave-one-trial-out. Fall detection results are still being measured.</p>
  </section>

  <section id="business" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">02 / BUSINESS</span><h2>Nursing homes<br><em>pay per room</em>.</h2><p>One simple monthly price per room, sensors included. It pays for itself if it helps avoid about four falls a year.</p></div>
    <div class="card-grid four">
      <article class="info-card signal-target"><span class="card-kicker">Price</span><h3>$20 / room / month</h3><p>Sensors included. No hardware for the facility to buy up front.</p>${tag('Working assumption', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Pays for itself</span><h3>~4 falls a year</h3><p>100 rooms is about $24,000 a year: roughly four falls at $6,306 each, or a tenth of one average fall lawsuit.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Our cost</span><h3>$18–39 per room</h3><p>Estimated hardware for a three-sensor kit at about 1,000 kits.</p><small>Bulk catalog prices, not quotes. Excludes shipping and certification.</small></article>
      <article class="info-card signal-target"><span class="card-kicker">Market</span><h3>~$530M a year</h3><p>About 15,000 U.S. nursing homes and 30,000 assisted living communities, 2.2M residents. Starting on the Central Coast.</p><small>Our estimate: 2.2M residents × $240 a year.</small></article>
    </div>
    <div class="why-now"><span class="eyebrow">WHY NOW</span><div class="why-grid"><div><b>Cheap chips</b><span>$5–10 boards can now read detailed Wi-Fi signal data (CSI), which used to need lab equipment.</span></div><div><b>AI</b><span>The signal looks like noise to people. A model trained with a camera as teacher learns what it means.</span></div><div><b>A standard</b><span>IEEE 802.11bf, published in 2025, is a Wi-Fi standard built for sensing.</span></div></div></div>
  </section>

  <section id="customers" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">03 / CUSTOMERS</span><h2>Built for the<br><em>night shift</em>.</h2><p>Most nursing home falls happen where nobody is watching. Today’s alerts depend on the person pressing a button.</p></div>
    <div class="stat-row"><div class="stat signal-target"><b>~3 in 4</b><span>falls happen in residents’ own rooms or bathrooms</span></div><div class="stat signal-target"><b>$6,306</b><span>average cost of one fall in skilled nursing</span></div><div class="stat signal-target"><b>36%</b><span>of nursing home liability claims are falls, averaging ~$245K each</span></div></div>
    <div class="card-grid four">
      <article class="info-card signal-target"><span class="card-kicker">Who buys</span><h3>Director of nursing</h3><p>Responsible for fall rates, and for the lawsuits that come with them.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Who uses it</span><h3>Caregivers</h3><p>The caregiver’s phone gets the alert: which room, what time, and how long there has been no movement. Nobody has to call for help.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Who it protects</span><h3>Residents</h3><p>Nothing to wear, charge, or remember to press, which matters for residents living with dementia.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Who it reassures</span><h3>Families</h3><p>Peace of mind without a camera in a parent’s bedroom or bathroom.</p></article>
    </div>
    <p class="fine-print">Sources: one-year study of 528 Bavarian nursing homes (<a href="https://pubmed.ncbi.nlm.nih.gov/21816682/" target="_blank" rel="noopener">PubMed 21816682</a>); ECRI, “Managing Falls in Aging Services”; CNA Aging Services Claim Report via Skilled Nursing News (2022).</p>
    <div class="quote-slot signal-target"><span class="eyebrow">WHAT WE’RE HEARING</span><p>Customer conversations are in progress. We will only quote real conversations here.</p>${tag('Coming soon', 'pending')}</div>
  </section>

  <section id="competition" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">04 / COMPETITION</span><h2>How Haven<br><em>compares</em>.</h2><p>Every alternative breaks somewhere. Haven costs about $18–39 of hardware per room at scale, with nothing to wear and nothing to remember.</p></div>
    <div class="compare-table" role="table" aria-label="Competitor comparison">
      <div class="compare-row compare-header" role="row"><span role="columnheader">Approach</span><span role="columnheader">Examples</span><span role="columnheader">Strength</span><span role="columnheader">Where Haven fits</span></div>
      ${competitors.map(([a, e, s, h]) => `<div class="compare-row signal-target" role="row"><b role="cell">${a}</b><span role="cell">${e}</span><span role="cell">${s}</span><span role="cell">${h}</span></div>`).join('')}
    </div>
    <div class="honest-note"><b>Our honest weakness:</b> Wi-Fi sensing has far fewer real-world deployments than radar, and each room needs calibration. Next: alerts to staff phones and nurse-call systems, and a pilot in a real facility with logged true and false alerts.</div>
  </section>

  <section id="privacy" class="info-section page-width reveal-on-scroll">
    <div class="info-head"><span class="eyebrow">05 / PRIVACY</span><h2>Private<br><em>by design</em>.</h2><p>Haven senses changes in the Wi-Fi signal. It never sees a face and never hears a voice.</p></div>
    <div class="card-grid three">
      <article class="info-card signal-target"><span class="card-kicker">No cameras</span><h3>No images, no audio</h3><p>No cameras, no microphones, and nothing for residents to wear.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">No identity</span><h3>Rooms, not people</h3><p>Alerts show a room number, the time, and minutes without movement. No names, photos or health records.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">Training only</span><h3>Camera as teacher</h3><p>A webcam labels what’s happening only while we train the model. Then it’s removed, and Haven runs on Wi-Fi alone.</p></article>
      <article class="info-card signal-target"><span class="card-kicker">On site</span><h3>Local processing</h3><p>Signal analysis runs on the facility’s own equipment, so raw Wi-Fi data stays in the building.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Security</span><h3>Treated as health data</h3><p>Encrypted and handled with HIPAA-level care.</p>${tag('Planned', 'pending')}</article>
      <article class="info-card signal-target"><span class="card-kicker">Honest claims</span><h3>An alerting aid</h3><p>Haven detects possible falls and alerts staff faster. It does not prevent falls or diagnose anything.</p></article>
    </div>
    <div class="info-cta"><a class="button primary" href="/technology">Explore the Technology ${arrow}</a><span>Prototype. Not a medical device.</span></div>
  </section>
</div>`;
}
