// Interactive "how it works" room: a top-down floor plan with three sensors. The cursor is a person;
// their body bends the Wi-Fi links. Click to fall: a sudden change, then stillness, then an alert.
// It is a simulation (labeled on screen), drawn to match the 3D scene's palette.
const TEAL = [127, 227, 198], CORAL = [240, 138, 108];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function mountRoom(section) {
  if (!section) return;
  const canvas = section.querySelector('.room-canvas'), ctx = canvas.getContext('2d');
  const stateEl = section.querySelector('.room-state'), alertEl = section.querySelector('.room-alert'), timerEl = section.querySelector('.room-timer');
  const meters = [...section.querySelectorAll('.link-meters i')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, visible = false, raf = 0;
  // room coordinates are 0..1 (x) and 0...72 (y), scaled to the canvas
  const nodes = [[.06, .1], [.94, .1], [.5, .66]];
  const links = [[0, 1], [1, 2], [2, 0]];
  const person = { x: .55, y: .38, tx: .55, ty: .38, vx: 0, vy: 0, fallen: 0, fallAt: 0, lastInput: -10, speed: 0 };
  let energy = [0, 0, 0], alertK = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const sx = x => 20 + x * (W - 40), sy = y => 20 + (y / .72) * (H - 40);

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    person.tx = Math.min(.95, Math.max(.05, (e.clientX - r.left - 20) / (W - 40)));
    person.ty = Math.min(.68, Math.max(.04, (e.clientY - r.top - 20) / (H - 40) * .72));
    person.lastInput = performance.now() / 1000;
  });
  canvas.addEventListener('click', () => {
    if (person.fallen > .5) { person.fallen = 0; person.fallAt = 0; alertEl.hidden = true; }
    else { person.fallAt = performance.now() / 1000; }
  });

  function drawRoom(t) {
    // floor
    ctx.fillStyle = '#c99a66'; ctx.fillRect(sx(0), sy(0), sx(1) - sx(0), sy(.72) - sy(0));
    ctx.strokeStyle = 'rgba(90,55,25,.25)'; ctx.lineWidth = 1;
    for (let y = 0; y < .72; y += .045) { ctx.beginPath(); ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(1), sy(y)); ctx.stroke(); }
    // rug, bed, nightstand, chair, plant
    ctx.fillStyle = '#e9dcc3'; ctx.beginPath(); ctx.ellipse(sx(.6), sy(.42), (W - 40) * .17, (H - 40) * .16, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(160,110,80,.5)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#8a6a4c'; round(sx(.08), sy(.16), sx(.3) - sx(.08), sy(.58) - sy(.16), 8); ctx.fill();
    ctx.fillStyle = '#fbf7ef'; round(sx(.09), sy(.17), sx(.29) - sx(.09), sy(.56) - sy(.17), 7); ctx.fill();
    ctx.fillStyle = '#d39d8f'; round(sx(.09), sy(.3), sx(.29) - sx(.09), sy(.56) - sy(.3), 7); ctx.fill();
    ctx.fillStyle = '#fbf7ef'; round(sx(.11), sy(.19), sx(.27) - sx(.11), sy(.25) - sy(.19), 6); ctx.fill();
    ctx.fillStyle = '#8a6a4c'; round(sx(.33), sy(.14), sx(.41) - sx(.33), sy(.22) - sy(.14), 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,150,.9)'; ctx.beginPath(); ctx.arc(sx(.37), sy(.18), 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#7e9a86'; round(sx(.8), sy(.48), sx(.92) - sx(.8), sy(.64) - sy(.48), 10); ctx.fill();
    ctx.fillStyle = '#6f8f4e'; ctx.beginPath(); ctx.arc(sx(.9), sy(.16), 13, 0, 7); ctx.fill();
    // walls
    ctx.strokeStyle = '#2b2925'; ctx.lineWidth = 6; ctx.strokeRect(sx(0), sy(0), sx(1) - sx(0), sy(.72) - sy(0));
    ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx(.42), sy(.72)); ctx.lineTo(sx(.62), sy(.72)); ctx.stroke(); // window
  }
  function round(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const t = now / 1000;
    // autopilot when nobody is steering
    if (t - person.lastInput > 2.5 && !person.fallAt) { person.tx = .55 + Math.cos(t * .45) * .28; person.ty = .38 + Math.sin(t * .9) * .18; }
    const falling = person.fallAt ? Math.min(1, (t - person.fallAt) / .5) : 0;
    person.fallen = falling;
    const k = person.fallAt ? .02 : .12;
    const px = person.x, py = person.y;
    person.x += (person.tx - person.x) * k; person.y += (person.ty - person.y) * k;
    person.speed = person.speed * .85 + Math.hypot(person.x - px, person.y - py) * 60 * .15;
    const still = person.fallAt && t - person.fallAt > .7;
    const sudden = person.fallAt && t - person.fallAt <= .7;
    const motion = reduced ? .4 : (sudden ? 2.6 : still ? .03 : Math.min(1.6, person.speed * 3 + .15));

    ctx.clearRect(0, 0, W, H);
    drawRoom(t);
    alertK += ((still && t - person.fallAt > 3 ? 1 : 0) - alertK) * .08;
    const col = mix(TEAL, CORAL, still ? Math.min(1, (t - person.fallAt - .7) / 1.2) : 0);

    // links
    links.forEach(([a, b], li) => {
      const [ax, ay] = nodes[a], [bx, by] = nodes[b];
      const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny);
      let e = 0;
      ctx.beginPath();
      for (let s = 0; s <= 60; s++) {
        const f = s / 60, x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
        const d = Math.hypot(x - person.x, (y - person.y) * 1.3);
        const infl = Math.exp(-(d * d) / .012);
        const amp = infl * .03 * motion * Math.sin(t * (6 + motion * 6) + s * .9 + li) + (still ? infl * .012 : 0);
        e += infl * motion;
        const X = sx(x + nx / nl * amp), Y = sy(y + ny / nl * amp);
        s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      energy[li] = energy[li] * .9 + Math.min(1, e / 8) * .1;
      ctx.strokeStyle = rgba(col, .25); ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = rgba(col, .95); ctx.lineWidth = 2; ctx.stroke();
      // travelling pulses
      for (let q = 0; q < 3; q++) {
        const f = ((t * .35 + q / 3 + li * .2) % 1);
        ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(sx(ax + (bx - ax) * f), sy(ay + (by - ay) * f), 2.6, 0, 7); ctx.fill();
      }
      if (meters[li]) meters[li].style.width = `${Math.round(8 + energy[li] * 92)}%`;
    });
    // sensors
    nodes.forEach(([x, y], i) => {
      const glow = .5 + .5 * Math.sin(t * 3 + i);
      ctx.fillStyle = rgba(col, .18 + glow * .15); ctx.beginPath(); ctx.arc(sx(x), sy(y), 16, 0, 7); ctx.fill();
      ctx.fillStyle = '#2f3430'; round(sx(x) - 10, sy(y) - 7, 20, 14, 4); ctx.fill();
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(sx(x) - 4, sy(y), 2.4, 0, 7); ctx.fill();
    });
    // person (top-down, faceless)
    const X = sx(person.x), Y = sy(person.y);
    ctx.save(); ctx.translate(X, Y);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(3, 4, 16 + falling * 16, 12, 0, 0, 7); ctx.fill();
    ctx.rotate(falling * 1.4);
    ctx.fillStyle = '#d8c8ae'; ctx.beginPath(); ctx.ellipse(0, 0, 13 + falling * 14, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#eee3d2'; ctx.beginPath(); ctx.arc(falling * 22, 0, 7, 0, 7); ctx.fill();
    ctx.restore();
    if (alertK > .02) {
      ctx.strokeStyle = rgba(CORAL, alertK * (.5 + .4 * Math.sin(t * 5))); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(X + 10, Y, 34 + (t * 30) % 16, 0, 7); ctx.stroke();
    }

    // status
    const secs = person.fallAt ? Math.max(0, Math.floor(t - person.fallAt - .7)) : 0;
    stateEl.textContent = sudden ? 'Sudden change detected' : still ? `No movement · ${secs}s` : person.speed > .02 ? 'Movement detected · tracking' : 'Someone is here, quiet';
    if (still && t - person.fallAt > 3) { alertEl.hidden = false; timerEl.textContent = `0:${String(secs).padStart(2, '0')}`; }
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: .05 }).observe(canvas);
  addEventListener('resize', resize);
  resize();
}

// Drifting fireflies behind dark sections (continues the dusk theme of the 3D intro).
export function mountFireflies(canvas, n = 70) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, visible = false, raf = 0;
  const flies = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), p: Math.random() * 6, s: .3 + Math.random() * .7 }));
  const resize = () => { const r = canvas.getBoundingClientRect(); W = canvas.width = r.width; H = canvas.height = r.height; };
  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    flies.forEach(f => {
      const x = (f.x + Math.sin(t * .1 * f.s + f.p) * .03) * W, y = (f.y + Math.cos(t * .13 * f.s + f.p) * .04) * H;
      const a = .25 + .55 * Math.max(0, Math.sin(t * f.s * 1.3 + f.p));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, `rgba(255,224,150,${a})`); g.addColorStop(1, 'rgba(255,224,150,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
    });
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(canvas);
  addEventListener('resize', resize); resize();
}
