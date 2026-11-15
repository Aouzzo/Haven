// Footer scene: the 3D intro's valley at dusk, drawn in 2D so it costs almost nothing.
// Granite walls and domes, a pine forest, the timber lodge with a stepped tower and warm windows,
// a meadow whose grass sways and bends away from the cursor, and fireflies.
// Palette taken from scene3d.js (sky, granite, pine, timber).
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export function mountValley(el) {
  if (!el) return;
  const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, visible = false, raf = 0, blades = [], pines = [], flies = [], stars = [], bg = null;
  const mouse = { x: -999, y: -999 };

  function build() {
    seed = 11;
    const gy = H * .72;
    blades = []; pines = []; flies = []; stars = [];
    const n = Math.min(1400, Math.floor(W / 1.8));
    for (let i = 0; i < n; i++) {
      const x = (i + rnd()) * (W / n);
      blades.push({ x, base: gy + 8 + rnd() * (H * .9 - gy - 8), h: 14 + rnd() * 24, lean: (rnd() - .5) * .5, ph: rnd() * 6, c: `hsl(${88 + rnd() * 20},${26 + rnd() * 16}%,${26 + rnd() * 16}%)` });
    }
    blades.sort((a, b) => a.base - b.base);
    for (let i = 0; i < W / 9; i++) {
      const x = rnd() * W;
      if (Math.abs(x - W * .6) < Math.min(260, W * .22)) continue;   // clearing for the lodge
      pines.push({ x, s: 26 + rnd() * 34, far: rnd() < .45 });
    }
    pines.sort((a, b) => (b.far - a.far) || a.s - b.s);
    for (let i = 0; i < 46; i++) flies.push({ x: rnd(), y: .5 + rnd() * .45, p: rnd() * 6, s: .4 + rnd() * .6 });
    for (let i = 0; i < 70; i++) stars.push({ x: rnd() * W, y: rnd() * H * .3, a: .2 + rnd() * .5, p: rnd() * 6 });
    paintBackground();
  }

  // Static layers (sky, granite, forest, lodge) are painted once into an offscreen canvas.
  function paintBackground() {
    const dpr = canvas.width / W;
    bg = document.createElement('canvas'); bg.width = canvas.width; bg.height = canvas.height;
    const g = bg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gy = H * .72;
    // sky: ivory at the very top so the page flows into it, then the intro's dusk colours
    const sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#f6f3eb'); sky.addColorStop(.12, '#f6f3eb'); sky.addColorStop(.4, '#a9c0dc'); sky.addColorStop(.62, '#c9b8c4'); sky.addColorStop(1, '#f6d1a2');
    g.fillStyle = sky; g.fillRect(0, 0, W, gy + 40);
    // granite valley walls: high at the edges, low in the middle, with rounded domes
    const ridgeAt = (u, k) => {
      const valley = Math.pow(Math.min(1, Math.abs(u - .58) * 2.1), 1.7);
      const dome = Math.exp(-((u - .1) ** 2) / .006) * .22 + Math.exp(-((u - .93) ** 2) / .008) * .16;
      return .18 + valley * .72 + dome + Math.sin(u * 13 + k) * .025 + Math.sin(u * 37 + k * 2) * .01;
    };
    const wall = (base, amp, col, shade, k) => {
      g.beginPath(); g.moveTo(0, gy);
      for (let x = 0; x <= W; x += 4) g.lineTo(x, base - ridgeAt(x / W, k) * amp);
      g.lineTo(W, gy); g.closePath();
      const f = g.createLinearGradient(0, base - amp, 0, gy);
      f.addColorStop(0, col); f.addColorStop(1, shade); g.fillStyle = f; g.fill();
    };
    wall(gy, H * .56, '#ece6da', '#b3aca0', 0);
    // faint vertical streaks on the far granite, clipped to the rock
    g.save(); g.beginPath(); g.moveTo(0, gy);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, gy - ridgeAt(x / W, 0) * H * .56);
    g.lineTo(W, gy); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(133,127,118,.12)'; g.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const x = rnd() * W, top = gy - ridgeAt(x / W, 0) * H * .56; g.beginPath(); g.moveTo(x, top + 6); g.lineTo(x + (rnd() - .5) * 8, top + 30 + rnd() * H * .18); g.stroke(); }
    g.restore();
    wall(gy + H * .01, H * .24, '#cdc5b5', '#9a9284', 2);
    // far pines (flat, misty)
    pines.filter(p => p.far).forEach(p => pine(g, p.x, gy + 2, p.s * .7, '#5d735f'));
    // the lodge
    lodge(g, W * .6, gy + 6, Math.min(420, W * .36));
    // near pines
    pines.filter(p => !p.far).forEach(p => pine(g, p.x, gy + 10, p.s, '#3d553b'));
    // meadow
    const m = g.createLinearGradient(0, gy, 0, H);
    m.addColorStop(0, '#7d8f5c'); m.addColorStop(1, '#5d7046');
    g.fillStyle = m; g.fillRect(0, gy + 4, W, H - gy);
    const fade = g.createLinearGradient(0, H * .9, 0, H); fade.addColorStop(0, 'rgba(246,243,235,0)'); fade.addColorStop(1, 'rgba(246,243,235,1)');
    g.fillStyle = fade; g.fillRect(0, H * .9, W, H * .1);
  }

  function pine(g, x, y, s, col) {
    g.fillStyle = '#4b3326'; g.fillRect(x - s * .05, y - s * .3, s * .1, s * .3);
    g.fillStyle = col;
    for (let k = 0; k < 4; k++) {
      const w = s * (.42 - k * .08), top = y - s * (.25 + k * .3);
      g.beginPath(); g.moveTo(x - w, top + s * .32); g.lineTo(x + w, top + s * .32); g.lineTo(x, top - s * .22); g.fill();
    }
  }

  function lodge(g, cx, by, w) {
    const h = w * .2;
    // granite base
    g.fillStyle = '#5e5a53'; g.fillRect(cx - w / 2, by - h * .35, w, h * .35);
    // timber wings
    g.fillStyle = '#5a3f2e'; g.fillRect(cx - w / 2, by - h * 1.25, w, h * .92);
    // tower
    const tw = w * .2;
    g.fillStyle = '#5e5a53'; g.fillRect(cx - tw / 2, by - h * 1.5, tw, h * 1.5);
    g.fillStyle = '#5a3f2e'; g.fillRect(cx - tw / 2, by - h * 2.4, tw, h * 1);
    g.fillStyle = '#4a463f';
    g.beginPath(); g.moveTo(cx - tw / 2 - 8, by - h * 2.4); g.lineTo(cx + tw / 2 + 8, by - h * 2.4); g.lineTo(cx, by - h * 3.1); g.fill();
    // wing roofs
    g.beginPath(); g.moveTo(cx - w / 2 - 10, by - h * 1.22); g.lineTo(cx + w / 2 + 10, by - h * 1.22); g.lineTo(cx + w * .4, by - h * 1.7); g.lineTo(cx - w * .4, by - h * 1.7); g.fill();
    // chimney
    g.fillStyle = '#6d675d'; g.fillRect(cx + w * .3, by - h * 1.95, w * .035, h * .5);
    // painted band
    g.fillStyle = '#8c3b2a'; g.fillRect(cx - w / 2, by - h * 1.27, w, 3);
  }

  function windows(t, cx, by, w) {
    const h = w * .2, tw = w * .2;
    const glow = k => `rgba(255,${196 + Math.sin(t * 1.2 + k) * 14},${120 + Math.sin(t * 1.2 + k) * 14},1)`;
    for (let row = 0; row < 2; row++) for (let k = 0; k < 10; k++) {
      const x = cx - w * .46 + k * w * .095;
      if (Math.abs(x + w * .02 - cx) < tw * .6) continue;
      ctx.fillStyle = (k * 7 + row * 3) % 5 === 0 ? 'rgba(70,52,40,1)' : glow(k + row);
      ctx.fillRect(x, by - h * (1.12 - row * .4), w * .04, h * .24);
    }
    for (let k = 0; k < 2; k++) { ctx.fillStyle = glow(k + 4); ctx.fillRect(cx - tw * .3 + k * tw * .38, by - h * 2.1, tw * .22, h * .4); }
    ctx.fillStyle = glow(9); ctx.fillRect(cx - tw * .18, by - h * .62, tw * .36, h * .62);   // door
    // chimney smoke
    for (let k = 0; k < 5; k++) {
      const f = (t * .1 + k / 5) % 1;
      ctx.fillStyle = `rgba(236,232,226,${(1 - f) * .4})`;
      ctx.beginPath(); ctx.arc(cx + w * .318 + f * 26, by - h * 2 - f * 60, 4 + f * 12, 0, 7); ctx.fill();
    }
  }

  function resize() {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build(); draw(performance.now());
  }
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  el.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

  function draw(now) {
    const t = now / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.width / W, 0, 0);
    stars.forEach(s => { ctx.fillStyle = `rgba(255,255,255,${s.a * (.6 + .4 * Math.sin(t * 1.5 + s.p)) * .5})`; ctx.fillRect(s.x, s.y + H * .05, 1.4, 1.4); });
    windows(t, W * .6, H * .72 + 6, Math.min(420, W * .36));
    ctx.lineCap = 'round'; ctx.lineWidth = 2;
    blades.forEach(b => {
      const wind = reduced ? 0 : Math.sin(t * 1.6 + b.x * .015 + b.ph) * 4;
      const dx = b.x - mouse.x, dy = b.base - b.h - mouse.y, d = Math.hypot(dx, dy);
      const push = d < 120 ? (1 - d / 120) * 28 * Math.sign(dx || 1) : 0;
      const tipX = b.x + b.lean * b.h + wind + push, tipY = b.base - b.h + Math.abs(push) * .3;
      ctx.strokeStyle = b.c;
      ctx.beginPath(); ctx.moveTo(b.x, b.base); ctx.quadraticCurveTo(b.x + (tipX - b.x) * .3, b.base - b.h * .55, tipX, tipY); ctx.stroke();
    });
    flies.forEach(f => {
      const x = (f.x + Math.sin(t * .2 * f.s + f.p) * .02) * W, y = (f.y + Math.cos(t * .25 * f.s + f.p) * .03) * H;
      const a = .25 + .6 * Math.max(0, Math.sin(t * 1.4 * f.s + f.p));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8); g.addColorStop(0, `rgba(255,226,150,${a})`); g.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 8, y - 8, 16, 16);
    });
  }
  function frame(now) { raf = visible ? requestAnimationFrame(frame) : 0; draw(now); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(el);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();
}
