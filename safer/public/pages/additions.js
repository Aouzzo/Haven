// Additions on top of the main site (branch feature/site-additions). Kept in their own file so
// they merge cleanly with work on pages/sections.js. Placed by pages/sections.js and pages/home.js;
// brought to life by cinematic/fx.js, cinematic/room.js and cinematic/valley.js.
import { shield } from '../components/brand.js';

export const TEAM = [
  { name: 'Jack Jensen', initials: 'JJ' },
  { name: 'Anthony Ouzounian', initials: 'AO' },
  { name: 'Luis Scheibe', initials: 'LS' }
];

const ROW_1 = ['No cameras.', 'No wearables.', 'No buttons to press.', 'Works in the dark.', 'Make it a <em>Haven</em>.'];
const ROW_2 = ['Camera-free fall alerts', 'Built on the Wi-Fi already there', 'Room, time, minutes still', 'Three small sensors per room'];

// Big, simple brand banner: two rows drifting in opposite directions, faster while you scroll.
export function brandMarquee() {
  const row = (items, cls, dir) => {
    const set = items.map(t => `<span class="bm-item">${t}</span><span class="bm-sep">${shield()}</span>`).join('');
    return `<div class="brand-marquee ${cls}" data-dir="${dir}"><div class="brand-marquee-track">${set}${set}${set}${set}</div></div>`;
  };
  return `<div class="brand-band" role="region" aria-label="What Haven is">
    <p class="sr-only">${ROW_1.join(' ').replace(/<[^>]+>/g, '')}</p>
    <div aria-hidden="true">${row(ROW_1, 'bm-big', 'left')}${row(ROW_2, 'bm-small', 'right')}</div>
  </div>`;
}

// "How we made it" media. Drop files in /assets/made/ and set the paths here (or a YouTube link
// for video). An empty entry shows a labeled placeholder. Keep local videos small (< 10 MB, mp4).
export const MADE_MEDIA = {
  trainingVideo: '',     // e.g. '/assets/made/training.mp4' or 'https://youtu.be/...'
  trainingResults: '',   // e.g. '/assets/made/training-results.png' (screenshot of train.html results)
  demoDashboard: ''      // e.g. '/assets/made/demo-dashboard.png' (screenshot of demo.html)
};

function media(src, label, alt) {
  if (!src) return `<div class="made-media made-empty"><span>${label}</span><small>Screenshot or video goes here</small></div>`;
  const yt = src.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (yt) return `<div class="made-media"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="${alt}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm|mov)$/i.test(src)) return `<div class="made-media"><video src="${src}" muted loop playsinline autoplay preload="metadata" aria-label="${alt}"></video></div>`;
  return `<div class="made-media"><img src="${src}" alt="${alt}" loading="lazy"></div>`;
}

const MADE_STEPS = [
  ['01', 'Buy the boards', 'Three off-the-shelf ESP32-WROOM-32U boards, a few dollars each, with laptop Wi-Fi antennas clipped onto their antenna connectors.'],
  ['02', 'Design the case', 'Our own enclosure, modeled and 3D printed at the hackathon. Each sensor runs from a USB wall plug or a power bank.'],
  ['03', 'Teach with a camera', 'A webcam and Google’s MediaPipe Pose name what the person is doing while the boards record Wi-Fi. Each label is paired with the signal.'],
  ['04', 'Run on Wi-Fi alone', 'The camera is unplugged. The trained model reads the Wi-Fi, and the dashboard shows the room’s status and raises the alert.']
];

export function madeSection() {
  return `<section id="made" class="info-section page-width made" aria-labelledby="made-title">
    <div class="info-head"><span class="eyebrow">03 / HOW WE MADE IT</span><h2 id="made-title">Off-the-shelf parts.<br><em>Built in a weekend.</em></h2><p>Everything in our demo is hardware anyone can buy, a case we printed ourselves, and software we wrote at the hackathon.</p></div>
    <ol class="made-steps">
      ${MADE_STEPS.map(([n, h, p]) => `<li class="info-card"><span class="made-n">${n}</span><h3>${h}</h3><p>${p}</p></li>`).join('')}
    </ol>
    <div class="made-gallery">
      <figure>${media(MADE_MEDIA.trainingVideo, 'Training with the camera', 'Training Haven: the webcam labels activities while the boards record Wi-Fi')}<figcaption><b>Training.</b> The camera labels, the Wi-Fi learns.</figcaption></figure>
      <figure>${media(MADE_MEDIA.trainingResults, 'Training results', 'Training dashboard showing model results')}<figcaption><b>Results.</b> Scored on a round the model never saw.</figcaption></figure>
      <figure>${media(MADE_MEDIA.demoDashboard, 'Demo dashboard', 'Haven demo dashboard showing room status and a fall alert')}<figcaption><b>Demo dashboard.</b> Room status, then the alert.</figcaption></figure>
    </div>
  </section>`;
}

// Interactive room for "How the AI works" (cursor bends the Wi-Fi links). Illustration only.
export function roomDemo() {
  return `<div class="room-demo">
    <div class="room-frame">
      <canvas class="room-canvas" aria-label="Interactive illustration: three sensors in a room. Moving the cursor through the room disturbs the Wi-Fi links between them."></canvas>
      <div class="room-hud"><span class="room-badge">ILLUSTRATION</span><span class="room-state">Quiet room</span></div>
    </div>
    <div class="room-copy">
      <span class="eyebrow">TRY IT</span>
      <h3>Move through the room.<br><em>Watch the signal bend.</em></h3>
      <p>Three sensors talk to each other over Wi-Fi. A body in the room changes those signals, and each path changes differently depending on where you are. That pattern is what the AI learns to read.</p>
      <div class="link-meters" aria-hidden="true">
        <div><span>Path 1→2</span><b><i></i></b></div>
        <div><span>Path 2→3</span><b><i></i></b></div>
        <div><span>Path 3→1</span><b><i></i></b></div>
      </div>
      <small>Not live sensor data. The real system measures these paths about 30 times a second.</small>
    </div>
  </div>`;
}

// Team + how it was built. This is a Codex competition, so Codex leads the credits.
export function teamSection() {
  return `<section id="team" class="info-section page-width team" aria-labelledby="team-title">
    <div class="info-head"><span class="eyebrow">08 / THE TEAM</span><h2 id="team-title">Built in a weekend<br><em>with OpenAI Codex</em>.</h2><p>Three Cal Poly students, three ESP32 boards, and AI coding agents working alongside us on the firmware, the AI pipeline, the dashboard and this website.</p></div>
    <div class="team-grid">
      ${TEAM.map(p => `<div class="person"><span class="avatar" aria-hidden="true">${p.initials}</span><b>${p.name}</b><span>Cal Poly</span></div>`).join('')}
    </div>
    <div class="credits">
      <div class="credit-main"><span class="eyebrow">BUILT WITH</span><b>OpenAI Codex</b></div>
      <div class="credit-list">
        <span><b>Claude Code</b> also helped write and review code.</span>
        <span><b>Google MediaPipe Pose</b> (Apache-2.0) labels activities during training.</span>
        <span><b>Three.js</b> (MIT) renders the 3D valley. <b>Blender</b> rendered the sensor.</span>
        <span>Fonts: Fraunces and Inter (SIL Open Font License).</span>
      </div>
    </div>
  </section>`;
}

// Footer scene: the intro's granite valley and lodge at dusk (cinematic/valley.js).
export function valleyFooter() {
  return `<div class="valley-footer" aria-hidden="true"><canvas></canvas><p class="valley-line">Make it a <em>Haven</em>.</p></div>`;
}
