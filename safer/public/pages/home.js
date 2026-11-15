import { header, shield, arrow } from '../components/brand.js';
import { CHAPTERS, ROOMS, ALERT_TIME } from '../cinematic/story.js';

export function home() {
  const labels = ROOMS.map(r => `<span class="room-label signal-target" data-room="${r.n}">Room ${r.n}</span>`).join('');
  const tiles = ROOMS.map(r => r.n === 104
    ? `<div class="room-tile alert signal-target" data-room="104"><b>104</b><span class="tile-status">Possible fall</span><small>No movement <span class="dash-timer">0:00</span></small></div>`
    : `<div class="room-tile signal-target" data-room="${r.n}"><b>${r.n}</b><span class="tile-status">${r.status}</span></div>`).join('');
  const nav = CHAPTERS.map((c, i) => `<button data-index="${i}" aria-label="Scene ${i + 1}: ${c.name}"${i ? '' : ' aria-current="step"'}><i></i><span>${c.name}</span></button>`).join('');
  return `${header(true)}<main id="main" class="cinema-scroll" aria-label="Haven 3D concept demonstration"><section class="cinema" data-chapter="0" aria-label="Scroll to explore the Haven concept">
    <canvas class="world" role="img" aria-label="3D model of a single-story assisted living wing at dusk. Scrolling flies the camera into Room 104, where a simulated fall alert plays out."></canvas>
    <div class="room-labels" aria-hidden="true">${labels}</div>
    <div class="scene-shade"></div>
    <div class="sim-badge" title="This sequence is an animation, not live sensor data"><span></span>SIMULATED</div>
    <div class="drag-hint" aria-hidden="true">Drag to look around</div>
    <div class="scene-caption" aria-hidden="true"><span class="eyebrow caption-kicker">${CHAPTERS[0].kicker}</span><p class="caption-title">${CHAPTERS[0].title}</p><span class="caption-detail">${CHAPTERS[0].detail}</span></div>
    <aside class="csi-panel" aria-hidden="true"><div class="csi-head"><span>Wi-Fi signal (CSI) · Room 104</span><b class="csi-state">Quiet</b></div><canvas class="csi-canvas"></canvas><span class="csi-foot">Simulated trace · not live sensor data</span></aside>
    <div class="fall-alert" role="status" aria-live="polite"><div class="alert-symbol">!</div><div><span class="eyebrow">ROOM 104 · POSSIBLE FALL</span><h2>No movement <span class="still-timer">0:00</span></h2><p>Care team alerted · ${ALERT_TIME}</p></div></div>
    <section class="care-dashboard" aria-label="Simulated caregiver dashboard" aria-hidden="true" inert>
      <div class="dash-head"><div><span class="eyebrow">CARE DASHBOARD · NORTH WING</span><h2>6 rooms · 1 needs a check</h2></div><span class="dash-badge">SIMULATED</span></div>
      <div class="room-grid">${tiles}</div>
      <div class="dash-foot"><span>${ALERT_TIME} · Alert sent to on-shift staff</span><button type="button" class="dash-ack">Acknowledge</button></div>
    </section>
    <section class="brand-reveal" aria-label="Haven brand reveal" aria-hidden="true" inert><div class="reveal-orbit orbit-one"></div><div class="reveal-orbit orbit-two"></div><div class="reveal-content"><div class="metal-mark">${shield()}</div><span class="eyebrow reveal-eyebrow">PEACE OF MIND, BY DESIGN</span><h1>Haven<span>.</span></h1><h2>A smarter way to make<br>assisted living safer.<br>Make it a <em>Haven</em>.</h2><p>A proposed Wi-Fi sensing system that notices changes in movement.<br class="desktop-break"> No cameras. No wearables. More room to live.</p><div class="reveal-actions"><a class="button primary" href="/technology">Explore the Technology ${arrow}</a><a class="button secondary" href="/login">Log In ${arrow}</a></div><span class="reveal-footnote">A concept in development. Built around people. 3D scene built with Three.js (MIT).</span></div><button class="replay-button" type="button">↶ &nbsp; Experience again</button><span class="prototype-note">Prototype. Not a medical device.</span></section>
    <div class="cinema-bottom"><div class="scroll-instruction"><span class="scroll-line"></span><span>SCROLL TO EXPLORE</span></div><nav class="chapter-nav" aria-label="Story chapters">${nav}</nav><span class="simulation-label"><span></span> SIMULATED · NOT LIVE SENSOR DATA</span></div>
    <div class="timeline-track" aria-hidden="true"><i></i></div><p class="sr-only scene-announcement" aria-live="polite">Scene 1 of ${CHAPTERS.length}: A quieter kind of care. Scroll or use the chapter buttons to explore.</p>
    <div class="asset-status" role="status">Preparing your experience<span>Building the 3D scene</span></div>
  </section></main>`;
}
