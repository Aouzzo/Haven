// Meadow strips that carry the 3D intro's dusk landscape through the page: rolling hills, low-poly
// trees, flowers and grass blades that sway in the wind and bend away from the cursor.
// The footer variant adds a dusk sky, mountains, the little care home with glowing windows and fireflies.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export function mountMeadows(root = document) {
  root.querySelectorAll('.meadow').forEach((el, idx) => meadow(el, idx));
}

function meadow(el, idx) {
  const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
  const footer = el.classList.contains('footer-scene');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, visible = false, raf = 0, blades = [], trees = [], flowers = [], flies = [];
  const mouse = { x: -999, y: -999 };
  const hill = (x, base, amp, f, ph) => base - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.3 + ph * 1.7) * amp * .35;

  function build() {
    seed = 7 + idx * 31;
    const groundY = footer ? H * .74 : H * .55;
    blades = []; trees = []; flowers = []; flies = [];
    const n = Math.floor(W / (footer ? 2.2 : 2.8));
    for (let i = 0; i < n; i++) {
      const x = (i + rnd()) * (W / n);
      blades.push({ x, base: hill(x / W, groundY, H * .06, 5, idx) + rnd() * H * .25, h: (footer ? 18 : 14) + rnd() * (footer ? 26 : 22), lean: (rnd() - .5) * .5, ph: rnd() * 6, c: `hsl(${86 + rnd() * 18},${34 + rnd() * 18}%,${30 + rnd() * 16}%)` });
    }
    blades.sort((a, b) => a.base - b.base);
    const nt = footer ? 9 : Math.max(2, Math.floor(W / 420));
    for (let i = 0; i < nt; i++) {
      const x = rnd() * W;
      if (footer && Math.abs(x - W * .62) < W * .12) continue;
      trees.push({ x, s: (footer ? .9 : .65) + rnd() * .6, pine: rnd() < .4, c: ['#6f8f4e', '#7fa05a', '#5d7f45', '#d49a4a'][Math.floor(rnd() * (rnd() < .8 ? 3 : 4))], ph: rnd() * 6 });
    }
    for (let i = 0; i < W / 18; i++) flowers.push({ x: rnd() * W, y: groundY + rnd() * (H - groundY) * .8, c: ['#f2b8c0', '#f6d98c', '#faf3e6', '#c9b6e4'][Math.floor(rnd() * 4)] });
    if (footer) for (let i = 0; i < 40; i++) flies.push({ x: rnd(), y: .35 + rnd() * .5, p: rnd() * 6, s: .4 + rnd() * .6 });
  }
  function resize() {
    const r = el.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build(); draw(0);
  }
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  el.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

  function tree(t, gy) {
    const x = t.x, s = t.s * (footer ? 44 : 40), y = gy;
    ctx.fillStyle = '#6b4f39'; ctx.fillRect(x - s * .07, y - s * .9, s * .14, s * .9);
    ctx.fillStyle = t.c;
    if (t.pine) { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - s * (.55 - k * .12), y - s * (.6 + k * .45)); ctx.lineTo(x + s * (.55 - k * .12), y - s * (.6 + k * .45)); ctx.lineTo(x, y - s * (1.4 + k * .45)); ctx.fill(); } }
    else { [[0, -1.5, .62], [-.35, -1.15, .45], [.38, -1.2, .48]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); }); }
  }

  function draw(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    const gy = footer ? H * .74 : H * .55;
    if (footer) {
      const g = ctx.createLinearGradient(0, 0, 0, gy);
      g.addColorStop(0, '#2c3c66'); g.addColorStop(.55, '#9b8aa6'); g.addColorStop(1, '#f2bd8f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 30);
      ctx.fillStyle = 'rgba(255,214,160,.55)'; ctx.beginPath(); ctx.arc(W * .18, gy - 10, 46, 0, 7); ctx.fill();
      // mountains
      [['#8a86a6', .5, .3], ['#77809a', .62, .22]].forEach(([c, b, a], k) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, gy);
        for (let x = 0; x <= W; x += W / 14) ctx.lineTo(x, H * b - Math.abs(Math.sin(x * .011 + k * 2)) * H * a);
        ctx.lineTo(W, gy); ctx.fill();
      });
    }
    // hills
    [['#a9bd84', H * .08, .9, 1], ['#87a160', H * .06, 1.6, 3]].forEach(([c, amp, f, ph], k) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, hill(x / W, gy - (1 - k) * H * .12, amp, f * 3, ph + idx));
      ctx.lineTo(W, H); ctx.fill();
    });
    trees.forEach(tr => tree(tr, hill(tr.x / W, gy - H * .02, H * .06, 5, idx) + 4));
    if (footer) {   // the care home, with warm windows
      const hx = W * .62, hy = gy + 6, hw = Math.min(260, W * .26), hh = hw * .34;
      ctx.fillStyle = '#f1e7d3'; ctx.fillRect(hx - hw / 2, hy - hh, hw, hh);
      ctx.fillStyle = '#6c5446'; ctx.beginPath(); ctx.moveTo(hx - hw / 2 - 12, hy - hh); ctx.lineTo(hx + hw / 2 + 12, hy - hh); ctx.lineTo(hx + hw * .3, hy - hh * 1.8); ctx.lineTo(hx - hw * .3, hy - hh * 1.8); ctx.fill();
      ctx.fillStyle = '#9a8c78'; ctx.fillRect(hx + hw * .18, hy - hh * 2.05, hw * .06, hh * .5);
      for (let k = 0; k < 4; k++) { const wx = hx - hw * .4 + k * hw * .24; const glow = .8 + .2 * Math.sin(t * 1.3 + k); ctx.fillStyle = `rgba(255,${190 + glow * 30},${110 + glow * 30},1)`; ctx.fillRect(wx, hy - hh * .72, hw * .13, hh * .42); }
      for (let k = 0; k < 5; k++) { const f = ((t * .12 + k / 5) % 1); ctx.fillStyle = `rgba(230,224,218,${(1 - f) * .45})`; ctx.beginPath(); ctx.arc(hx + hw * .21 + f * 24, hy - hh * 2.1 - f * 60, 5 + f * 12, 0, 7); ctx.fill(); }
    }
    flowers.forEach(f => { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, 2.2, 0, 7); ctx.fill(); });
    // grass blades: wind + bend away from the cursor
    ctx.lineCap = 'round';
    blades.forEach(b => {
      const wind = reduced ? 0 : Math.sin(t * 1.6 + b.x * .015 + b.ph) * 4;
      const dx = b.x - mouse.x, dy = b.base - b.h - mouse.y, d = Math.hypot(dx, dy);
      const push = d < 110 ? (1 - d / 110) * 26 * Math.sign(dx || 1) : 0;
      const tipX = b.x + b.lean * b.h + wind + push, tipY = b.base - b.h + Math.abs(push) * .3;
      ctx.strokeStyle = b.c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.base); ctx.quadraticCurveTo(b.x + (tipX - b.x) * .3, b.base - b.h * .55, tipX, tipY); ctx.stroke();
    });
    if (!footer) { const fade = ctx.createLinearGradient(0, H * .72, 0, H); fade.addColorStop(0, 'rgba(246,243,235,0)'); fade.addColorStop(1, 'rgba(246,243,235,1)'); ctx.fillStyle = fade; ctx.fillRect(0, H * .72, W, H * .28); }
    if (footer) flies.forEach(f => {
      const x = (f.x + Math.sin(t * .2 * f.s + f.p) * .02) * W, y = (f.y + Math.cos(t * .25 * f.s + f.p) * .03) * H;
      const a = .3 + .6 * Math.max(0, Math.sin(t * 1.4 * f.s + f.p));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8); g.addColorStop(0, `rgba(255,226,150,${a})`); g.addColorStop(1, 'rgba(255,226,150,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 8, y - 8, 16, 16);
    });
  }
  function frame(now) { raf = visible ? requestAnimationFrame(frame) : 0; draw(now); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(el);
  addEventListener('resize', resize);
  resize();
}
