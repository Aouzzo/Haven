// Scroll-scrubbed exploded view of the Haven sensor (frames rendered in Blender by the team,
// hardware/esp32-case on the exploded-view branch of the Hackathon repo). 48 WebP frames.
export function mountDevice(section, { count = 48, src = i => `/assets/device/d${String(i + 1).padStart(2, '0')}.webp` } = {}) {
  if (!section) return;
  const canvas = section.querySelector('.device-canvas'), ctx = canvas.getContext('2d');
  const steps = [...section.querySelectorAll('.device-steps li')];
  const frames = new Array(count);
  let current = -1, started = false;
  const load = i => {
    if (frames[i]) return frames[i];
    const img = new Image(); img.decoding = 'async'; img.src = src(i);
    img.onload = () => draw(true);
    return (frames[i] = img);
  };
  const progress = () => {
    const r = section.getBoundingClientRect(), travel = r.height - innerHeight;
    return travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
  };
  // Reverse the render: start assembled? No — start exploded, assemble as you scroll.
  const nearest = i => { for (let d = 0; d < count; d++) for (const j of [i - d, i + d]) { const f = frames[j]; if (f && f.complete && f.naturalWidth) return f; } return null; };
  function draw(force) {
    const p = progress();
    const i = Math.round(p * (count - 1));
    steps.forEach(li => li.classList.toggle('on', p >= +li.dataset.from && p < +li.dataset.to));
    section.style.setProperty('--dp', p.toFixed(3));
    if (i === current && !force) return;
    const img = load(i).complete ? frames[i] : nearest(i);
    for (let k = 1; k <= 3; k++) { if (i + k < count) load(i + k); if (i - k >= 0) load(i - k); }
    if (!img) return;
    current = i;
    const cw = canvas.width, ch = canvas.height, s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * 1.08;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    draw(true);
  }
  // Preload lazily once the section is near.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started) { started = true; for (let i = 0; i < count; i += 4) load(i); for (let i = 0; i < count; i++) load(i); }
  }, { rootMargin: '600px' }).observe(section);
  addEventListener('scroll', () => requestAnimationFrame(() => draw(false)), { passive: true });
  addEventListener('resize', resize);
  resize();
}
