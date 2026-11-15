// Interactive illustration for "How the AI works": a top-down room with three Haven sensors.
// The cursor is a person; their body bends the Wi-Fi links between the sensors, and the link
// meters show how disturbed each path is. It is an illustration (labeled on screen), not live data.
const CALM = [125, 136, 120], ACTIVE = [161, 123, 68];   // the site's sage and amber
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function mountRoom(section) {
  if (!section) return;
  const canvas = section.querySelector('.room-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stateEl = section.querySelector('.room-state');
  const meters = [...section.querySelectorAll('.link-meters i')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, visible = false, raf = 0, lastState = '';
  const nodes = [[.06, .1], [.94, .1], [.5, .66]];
  const links = [[0, 1], [1, 2], [2, 0]];
  const names = ['1→2', '2→3', '3→1'];
  const person = { x: .55, y: .38, tx: .55, ty: .38, lastInput: -10, speed: 0 };
  const energy = [0, 0, 0];

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const sx = x => 18 + x * (W - 36), sy = y => 18 + (y / .72) * (H - 36);
  const round = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    person.tx = Math.min(.95, Math.max(.05, (e.clientX - r.left - 18) / (W - 36)));
    person.ty = Math.min(.68, Math.max(.04, (e.clientY - r.top - 18) / (H - 36) * .72));
    person.lastInput = performance.now() / 1000;
  });

  function drawRoom() {
    ctx.fillStyle = '#d8b88f'; ctx.fillRect(sx(0), sy(0), sx(1) - sx(0), sy(.72) - sy(0));
    ctx.strokeStyle = 'rgba(110,75,40,.16)'; ctx.lineWidth = 1;
    for (let y = .045; y < .72; y += .045) { ctx.beginPath(); ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(1), sy(y)); ctx.stroke(); }
    ctx.fillStyle = '#efe6d4'; ctx.beginPath(); ctx.ellipse(sx(.6), sy(.42), (W - 36) * .17, (H - 36) * .16, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a6a4c'; round(sx(.08), sy(.16), sx(.3) - sx(.08), sy(.58) - sy(.16), 8); ctx.fill();
    ctx.fillStyle = '#fbf7ef'; round(sx(.09), sy(.17), sx(.29) - sx(.09), sy(.56) - sy(.17), 7); ctx.fill();
    ctx.fillStyle = '#b9c2b0'; round(sx(.09), sy(.3), sx(.29) - sx(.09), sy(.56) - sy(.3), 7); ctx.fill();
    ctx.fillStyle = '#fbf7ef'; round(sx(.11), sy(.19), sx(.27) - sx(.11), sy(.25) - sy(.19), 6); ctx.fill();
    ctx.fillStyle = '#8a6a4c'; round(sx(.33), sy(.14), sx(.41) - sx(.33), sy(.22) - sy(.14), 4); ctx.fill();
    ctx.fillStyle = 'rgba(246,209,162,.95)'; ctx.beginPath(); ctx.arc(sx(.37), sy(.18), 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#7d8878'; round(sx(.8), sy(.48), sx(.92) - sx(.8), sy(.64) - sy(.48), 10); ctx.fill();
    ctx.fillStyle = '#4f6f4f'; ctx.beginPath(); ctx.arc(sx(.9), sy(.16), 13, 0, 7); ctx.fill();
    ctx.strokeStyle = '#30352f'; ctx.lineWidth = 6; ctx.strokeRect(sx(0), sy(0), sx(1) - sx(0), sy(.72) - sy(0));
    ctx.strokeStyle = '#f6f3eb'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx(.42), sy(.72)); ctx.lineTo(sx(.62), sy(.72)); ctx.stroke();
  }

  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    if (!W) return;
    const t = now / 1000;
    if (t - person.lastInput > 2.5) { person.tx = .55 + Math.cos(t * .45) * .28; person.ty = .38 + Math.sin(t * .9) * .18; }
    const px = person.x, py = person.y;
    person.x += (person.tx - person.x) * .12; person.y += (person.ty - person.y) * .12;
    person.speed = person.speed * .85 + Math.hypot(person.x - px, person.y - py) * 60 * .15;
    const motion = reduced ? .4 : Math.min(1.6, person.speed * 3 + .15);

    ctx.clearRect(0, 0, W, H);
    drawRoom();
    let top = 0;
    links.forEach(([a, b], li) => {
      const [ax, ay] = nodes[a], [bx, by] = nodes[b];
      const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny);
      let e = 0;
      ctx.beginPath();
      for (let s = 0; s <= 60; s++) {
        const f = s / 60, x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
        const d = Math.hypot(x - person.x, (y - person.y) * 1.3);
        const infl = Math.exp(-(d * d) / .012);
        const amp = infl * .03 * motion * Math.sin(t * (6 + motion * 6) + s * .9 + li);
        e += infl * motion;
        const X = sx(x + nx / nl * amp), Y = sy(y + ny / nl * amp);
        s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      energy[li] = energy[li] * .9 + Math.min(1, e / 8) * .1;
      if (energy[li] > energy[top]) top = li;
      const col = mix(CALM, ACTIVE, Math.min(1, energy[li] * 2.5));
      ctx.strokeStyle = rgba(col, .22); ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = rgba(col, .95); ctx.lineWidth = 2.2; ctx.stroke();
      for (let q = 0; q < 3; q++) {
        const f = (t * .35 + q / 3 + li * .2) % 1;
        ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(sx(ax + (bx - ax) * f), sy(ay + (by - ay) * f), 2.6, 0, 7); ctx.fill();
      }
      if (meters[li]) meters[li].style.width = `${Math.round(6 + energy[li] * 94)}%`;
    });
    nodes.forEach(([x, y], i) => {
      const glow = .5 + .5 * Math.sin(t * 3 + i);
      ctx.fillStyle = rgba(ACTIVE, .14 + glow * .14); ctx.beginPath(); ctx.arc(sx(x), sy(y), 16, 0, 7); ctx.fill();
      ctx.fillStyle = '#30352f'; round(sx(x) - 10, sy(y) - 7, 20, 14, 4); ctx.fill();
      ctx.fillStyle = '#f6d1a2'; ctx.beginPath(); ctx.arc(sx(x) - 4, sy(y), 2.4, 0, 7); ctx.fill();
    });
    // the person, top-down and faceless
    const X = sx(person.x), Y = sy(person.y);
    ctx.fillStyle = 'rgba(48,53,47,.16)'; ctx.beginPath(); ctx.ellipse(X + 3, Y + 4, 16, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5e5a53'; ctx.beginPath(); ctx.ellipse(X, Y, 13, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e9e3d6'; ctx.beginPath(); ctx.arc(X, Y, 6.5, 0, 7); ctx.fill();

    const state = motion > .45 ? `Movement · path ${names[top]} changes most` : 'Quiet room';
    if (stateEl && state !== lastState) { stateEl.textContent = state; lastState = state; }
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { resize(); if (!raf) raf = requestAnimationFrame(frame); }
  }).observe(canvas);
  addEventListener('resize', () => { if (visible) resize(); });
}
