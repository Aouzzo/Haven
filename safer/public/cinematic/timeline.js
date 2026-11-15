// Scroll drives everything: native scroll position -> smoothed progress p (0..1) -> 3D scene + HTML overlays.
import { createWorld } from './scene3d.js';
import { CHAPTERS } from './story.js';

const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const between = (p, a, b) => smooth((p - a) / (b - a));
const opacity = (el, n) => { if (el) el.style.opacity = n.toFixed(4); };

// Simulated CSI trace for the side panel. It is a drawing, not sensor data, and is labeled that way.
function makeTrace(canvas) {
  const ctx = canvas.getContext('2d');
  const N = 150, buf = new Float32Array(N);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr || 600;
  canvas.height = canvas.clientHeight * dpr || 140;
  let last = 0;
  return function draw(energy, t, alert) {
    if (t - last > .03) {
      last = t;
      buf.copyWithin(0, 1);
      const noise = Math.random() - .5;
      buf[N - 1] = energy * (Math.sin(t * 7.3) * .5 + Math.sin(t * 12.7 + 1) * .3 + noise * .45) + noise * .05;
    }
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.strokeStyle = alert ? '#f39b7d' : '#8fe3c8';
    ctx.lineWidth = 2 * dpr;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1) * w, y = h / 2 - Math.max(-1.2, Math.min(1.2, buf[i])) * h * .36;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  };
}

export function mountTimeline() {
  const q = s => document.querySelector(s);
  const cinema = q('.cinema'), scroll = q('.cinema-scroll');
  const caption = q('.scene-caption'), csiPanel = q('.csi-panel'), csiState = q('.csi-state');
  const alertCard = q('.fall-alert'), alertTimer = q('.still-timer'), dashTimer = q('.dash-timer');
  const dashboard = q('.care-dashboard'), reveal = q('.brand-reveal'), revealContent = q('.reveal-content');
  const bottom = q('.cinema-bottom'), header = q('.site-header'), badge = q('.sim-badge'), dragHint = q('.drag-hint');
  const chapters = [...document.querySelectorAll('.chapter-nav button')];
  const labels = [...document.querySelectorAll('.room-label')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const drawTrace = makeTrace(q('.csi-canvas'));
  let world = null, target = 0, current = 0, previous = 0, chapter = -1, enabled = false;
  const range = () => Math.max(1, scroll.offsetHeight - innerHeight);

  function overlays(p, t) {
    const end = between(p, .93, .99);
    const narrow = innerWidth < 760;
    const alertIn = between(p, .675, .7) * (1 - between(p, .8, .84));
    let csi = between(p, .43, .47) * (1 - between(p, .78, .81));
    if (narrow) csi *= 1 - alertIn;
    opacity(csiPanel, csi);
    if (csi > .01) {
      const energy = p < .47 ? .12 : p < .6 ? 1 : p < .665 ? 2.3 : .04;
      drawTrace(energy, t, p > .66);
      csiState.textContent = p < .47 ? 'Quiet' : p < .6 ? 'Movement' : p < .665 ? 'Sudden change' : 'No movement';
      csiPanel.classList.toggle('still', p > .66);
    }
    const seconds = p < .655 ? 0 : Math.floor(clamp((p - .655) / (.86 - .655)) * 74);
    const stamp = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    alertTimer.textContent = stamp;
    dashTimer.textContent = stamp;
    opacity(alertCard, alertIn);
    alertCard.style.transform = `translateY(${reducedMotion.matches ? 0 : 14 * (1 - alertIn)}px)`;
    const dash = between(p, .8, .855) * (1 - between(p, .93, .97));
    opacity(dashboard, dash);
    dashboard.style.transform = narrow ? `translateY(${(1 - dash) * 20}px)` : `translateY(calc(-50% + ${(1 - dash) * 20}px))`;
    dashboard.inert = dash < .6;
    dashboard.setAttribute('aria-hidden', String(dash < .6));
    opacity(reveal, end);
    opacity(revealContent, between(p, .95, 1));
    revealContent.style.transform = `translateY(${reducedMotion.matches ? 0 : 24 * (1 - end)}px)`;
    reveal.style.pointerEvents = end > .85 ? 'auto' : 'none';
    reveal.inert = end < .85;
    reveal.setAttribute('aria-hidden', String(end < .85));
    opacity(caption, (1 - end) * (narrow ? 1 - dash : 1));
    opacity(bottom, 1 - end);
    opacity(badge, 1 - end);
    opacity(dragHint, 1 - between(p, .01, .05));
    bottom.inert = end > .85;
    header.classList.toggle('revealed', end > .55);
    q('.timeline-track i').style.transform = `scaleX(${p})`;
    const next = CHAPTERS.findIndex(c => p < c.until);
    if (next !== chapter && next >= 0) {
      chapter = next;
      cinema.dataset.chapter = chapter;
      const c = CHAPTERS[chapter];
      q('.caption-kicker').textContent = c.kicker;
      q('.caption-title').innerHTML = c.title.replace(/\n/g, '<br>');
      q('.caption-detail').textContent = c.detail;
      q('.scene-announcement').textContent = `Scene ${chapter + 1} of ${CHAPTERS.length}: ${c.title.replace(/<[^>]+>/g, '').replace('\n', ' ')} ${c.detail} Simulation.`;
      chapters.forEach((b, i) => i === chapter ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'));
    }
  }

  function frame(time) {
    const dt = previous ? Math.min(50, time - previous) : 16;
    previous = time;
    current = reducedMotion.matches ? target : current + (target - current) * (1 - Math.exp(-dt / 110));
    if (Math.abs(target - current) < .00005) current = target;
    const t = time / 1000;
    if (world) world.render(current, t);
    overlays(current, t);
    requestAnimationFrame(frame);
  }

  function update() {
    if (enabled) target = clamp(scrollY / range());
    header.classList.toggle('solid', scrollY > scroll.offsetHeight - 110);
  }
  // Fade the info sections in as they scroll into view.
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  document.querySelectorAll('.reveal-on-scroll').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  function jump(progress) { window.scrollTo({ top: progress * range(), behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
  chapters.forEach((b, i) => b.addEventListener('click', () => jump(CHAPTERS[i].at)));
  q('.replay-button').addEventListener('click', () => { jump(0); chapters[0].focus({ preventScroll: true }); resetAck(); });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });

  // Dashboard "Acknowledge" button (simulated).
  const ack = q('.dash-ack'), tile = q('.room-tile[data-room="104"]');
  function resetAck() { tile.classList.remove('ack'); tile.querySelector('.tile-status').textContent = 'Possible fall'; ack.disabled = false; ack.textContent = 'Acknowledge'; }
  ack.addEventListener('click', () => {
    tile.classList.add('ack');
    tile.querySelector('.tile-status').textContent = 'Staff on the way';
    ack.disabled = true;
    ack.textContent = 'Acknowledged';
  });

  return {
    ready() {
      try {
        world = createWorld(q('.world'), labels);
        addEventListener('haven:ping', e => world.ping(e.detail.x, e.detail.y));
      } catch (error) {
        console.warn('3D scene unavailable, showing overlays only.', error);
        cinema.classList.add('no-webgl');
      }
      enabled = true;
      update();
      current = target;
      requestAnimationFrame(frame);
    }
  };
}
