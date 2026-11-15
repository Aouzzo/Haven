// Wi-Fi cursor: arcs of signal spread out from the mouse as it moves.
// When a ring passes over a button, link or `.signal-target`, that element briefly lights up.
// Off for touch screens and for visitors who ask for reduced motion.
export function mountCursor({ onPing } = {}) {
  if (matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'signal-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const rings = [];
  const mouse = { x: -100, y: -100, dir: 0, seen: false };
  let last = null, travel = 0, lastSpawn = 0, raf = 0, targets = [], targetsAt = 0;

  function spawn(x, y, speed) {
    const now = performance.now();
    rings.push({ x, y, dir: mouse.dir, born: now, life: 1150, reach: 70 + Math.min(speed, 60) * 1.3, hit: new Set() });
    if (rings.length > 24) rings.shift();
    lastSpawn = now;
    onPing?.(x, y);
  }

  addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const x = e.clientX, y = e.clientY;
    mouse.seen = true;
    if (last) {
      const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
      if (dist > .5) {
        const target = Math.atan2(dy, dx);
        let delta = target - mouse.dir;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        mouse.dir += delta * .35;
      }
      travel += dist;
      if (travel > 46 || (dist > 2 && performance.now() - lastSpawn > 220)) { spawn(x, y, dist); travel = 0; }
    }
    last = { x, y };
    mouse.x = x; mouse.y = y;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') { spawn(e.clientX, e.clientY, 60); spawn(e.clientX, e.clientY, 20); }
  });
  document.addEventListener('mouseleave', () => { mouse.seen = false; });

  function flash(el) {
    el.classList.remove('signal-hit');
    void el.offsetWidth;
    el.classList.add('signal-hit');
    clearTimeout(el._signalTimer);
    el._signalTimer = setTimeout(() => el.classList.remove('signal-hit'), 750);
  }

  function frame(now) {
    raf = 0;
    if (now - targetsAt > 400) {
      targets = [...document.querySelectorAll('a, button, .signal-target')].filter(el => el.offsetParent !== null || el.getClientRects().length);
      targetsAt = now;
    }
    const rects = targets.map(el => [el, el.getBoundingClientRect()]);
    ctx.clearRect(0, 0, w, h);
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      const age = (now - r.born) / r.life;
      if (age >= 1) { rings.splice(i, 1); continue; }
      const ease = 1 - Math.pow(1 - age, 3);
      const radius = 6 + ease * r.reach;
      const alpha = Math.pow(1 - age, 1.6);
      // Three Wi-Fi arcs facing the direction of travel, plus a faint full ring.
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const rk = radius * (.42 + k * .29);
        ctx.strokeStyle = `rgba(240, 196, 122, ${(alpha * (.95 - k * .2)).toFixed(3)})`;
        ctx.lineWidth = 2.2 - k * .35;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rk, r.dir - .75, r.dir + .75);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(240, 196, 122, ${(alpha * .22).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (const [el, b] of rects) {
        if (r.hit.has(el) || el.closest('[inert]')) continue;
        const dx = Math.max(b.left - r.x, 0, r.x - b.right), dy = Math.max(b.top - r.y, 0, r.y - b.bottom);
        if (Math.hypot(dx, dy) <= radius) { r.hit.add(el); flash(el); }
      }
    }
    if (mouse.seen) {
      const pulse = 1 + Math.sin(now / 260) * .15;
      ctx.fillStyle = 'rgba(240, 196, 122, .95)';
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(240, 196, 122, .55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9 * pulse, 0, Math.PI * 2); ctx.stroke();
    }
    if (rings.length || mouse.seen) raf = requestAnimationFrame(frame);
  }
}
