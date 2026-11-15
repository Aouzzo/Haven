// Presentation mode: the website becomes the slide deck.
// Toggle with the "Present" button, the P key, or ?present in the URL.
// Next: → ↓ Space PageDown (clickers send PageDown). Back: ← ↑ PageUp. Home/End. F = fullscreen. Esc = exit.
// Stops = the 3D story chapters + every visible element with data-slide (see pages/sections.js, pages/present.js).
import { CHAPTERS } from './story.js';

export function mountPresent() {
  const btn = document.querySelector('.present-toggle');
  const scroller = document.querySelector('.cinema-scroll');
  if (!btn || !scroller) return;
  const hud = document.createElement('div');
  hud.className = 'present-hud';
  hud.innerHTML = `<button type="button" class="ph-prev" aria-label="Previous slide">‹</button><span class="ph-count">1 / 1</span><button type="button" class="ph-next" aria-label="Next slide">›</button><span class="ph-name"></span><span class="ph-time" title="Time since presentation mode started">0:00</span><button type="button" class="ph-exit" aria-label="Exit presentation mode">Exit</button>`;
  const bar = document.createElement('div');
  bar.className = 'present-bar';
  bar.innerHTML = '<i></i>';
  document.body.append(hud, bar);
  let on = false, startedAt = 0, timer = 0, stops = [];

  const range = () => Math.max(1, scroller.offsetHeight - innerHeight);
  function buildStops() {
    const s = CHAPTERS.map(c => ({ y: Math.round(Math.min(1, c.at) * range()), name: c.name }));
    const top = el => el.getBoundingClientRect().top + scrollY;
    [...document.querySelectorAll('[data-slide]')].filter(el => el.offsetParent !== null).forEach(el => {
      s.push({ y: Math.round(top(el) - (el.classList.contains('device') ? 0 : 70)), name: el.dataset.slide });
      if (el.classList.contains('device')) s.push({ y: Math.round(top(el) + el.offsetHeight - innerHeight - 2), name: el.dataset.slide + ' · assembled' });
    });
    stops = s.sort((a, b) => a.y - b.y).filter((x, i, arr) => !i || x.y - arr[i - 1].y > 40);
  }
  const currentIndex = () => {
    const y = target >= 0 ? target : scrollY;   // while animating, count from where we're heading
    let best = 0;
    stops.forEach((s, i) => { if (s.y <= y + 60) best = i; });
    return best;
  };
  // Own eased scroll (consistent speed for long jumps through the 3D story).
  let anim = 0, target = -1;
  function scrollToY(y) {
    cancelAnimationFrame(anim);
    const from = scrollY, dist = y - from, dur = Math.min(1400, 500 + Math.abs(dist) * .25), t0 = performance.now();
    target = y;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + dist * e);
      if (k < 1) anim = requestAnimationFrame(step); else target = -1;
    };
    anim = requestAnimationFrame(step);
  }
  function go(i) {
    i = Math.max(0, Math.min(stops.length - 1, i));
    scrollToY(stops[i].y);
    paint(i);
  }
  function paint(i = currentIndex()) {
    hud.querySelector('.ph-count').textContent = `${i + 1} / ${stops.length}`;
    hud.querySelector('.ph-name').textContent = stops[i]?.name || '';
    bar.firstChild.style.transform = `scaleX(${stops.length > 1 ? i / (stops.length - 1) : 0})`;
  }
  function tick() {
    const s = Math.floor((performance.now() - startedAt) / 1000);
    const el = hud.querySelector('.ph-time');
    el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    el.classList.toggle('over', s >= 240);
  }
  function set(next, { fullscreen = true } = {}) {
    on = next;
    document.body.classList.toggle('present', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Exit present' : 'Present';
    if (on) {
      startedAt = performance.now();
      timer = setInterval(tick, 500);
      if (fullscreen && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      requestAnimationFrame(() => { buildStops(); paint(); });
      // reveal everything immediately so nothing is half-faded on a slide
      document.querySelectorAll('.info-head, .reveal-item, .stat-row, .slide, .device-copy, .roi, .matrix, .team-grid').forEach(el => el.classList.add('in'));
      document.querySelectorAll('[data-count]').forEach(el => { if (el.dataset.done) return; el.dataset.done = '1'; el.textContent = (el.dataset.prefix || '') + (+el.dataset.count).toLocaleString('en-US') + (el.dataset.suffix || ''); });
    } else {
      clearInterval(timer);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }
  btn.addEventListener('click', () => set(!on));
  hud.querySelector('.ph-prev').addEventListener('click', () => go(currentIndex() - 1));
  hud.querySelector('.ph-next').addEventListener('click', () => go(currentIndex() + 1));
  hud.querySelector('.ph-exit').addEventListener('click', () => set(false));
  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select')) return;
    if (e.key === 'p' || e.key === 'P') { set(!on); e.preventDefault(); return; }
    if (!on) return;
    const i = currentIndex();
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { go(i + 1); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { go(i - 1); e.preventDefault(); }
    else if (e.key === 'Home') { go(0); e.preventDefault(); }
    else if (e.key === 'End') { go(stops.length - 1); e.preventDefault(); }
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
    else if (e.key === 'Escape' && !document.fullscreenElement) set(false);
  });
  addEventListener('scroll', () => { if (on) paint(); }, { passive: true });
  addEventListener('resize', () => { if (on) { buildStops(); paint(); } });
  if (new URLSearchParams(location.search).has('present')) set(true, { fullscreen: false });
}
