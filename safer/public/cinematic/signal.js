// "Signal" theme: the Wi-Fi (CSI) trace is the page's identity. A live teal waveform runs down the
// left edge, reacts to scroll speed and the cursor, spikes at section breaks, and goes flat while the
// fall part of the story is on screen (stillness = the alarm).
export function mountSignal() {
  const canvas = document.createElement('canvas');
  canvas.className = 'signal-rail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, lastY = scrollY, speed = 0, mouseY = -999, mouseNear = 0;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = 120; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener('resize', resize); resize();
  addEventListener('pointermove', e => { mouseY = e.clientY; mouseNear = Math.max(0, 1 - e.clientX / 260); }, { passive: true });
  const flatNow = () => {
    const c = document.querySelector('.cinema');
    if (!c) return false;
    const p = +c.dataset.progress || 0, inStory = scrollY < document.querySelector('.cinema-scroll').offsetHeight;
    return inStory && p > .655 && p < .9;
  };
  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000;
    speed = speed * .9 + Math.abs(scrollY - lastY) * .1; lastY = scrollY;
    const flat = flatNow();
    ctx.clearRect(0, 0, W, H);
    const x0 = 46;
    // section-break spikes: headings currently on screen
    const breaks = [...document.querySelectorAll('.info-head, .slide h2, .device-copy h2')].map(el => el.getBoundingClientRect().top).filter(y => y > -40 && y < H + 40);
    ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const col = flat ? '240,138,108' : '58,163,135';
    ctx.strokeStyle = `rgba(${col},.18)`; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke();
    ctx.strokeStyle = `rgba(${col},.95)`; ctx.beginPath();
    for (let y = 0; y <= H; y += 3) {
      const yy = y + scrollY * .6;
      let a = flat ? .4 : (10 + Math.min(26, speed * .6)) * (reduced ? .4 : 1);
      a *= .55 + .45 * Math.sin(yy * .011 + t * .7);
      let v = Math.sin(yy * .08 + t * 5) * .6 + Math.sin(yy * .21 + t * 8.3) * .3 + Math.sin(yy * .5 + t * 13) * .1;
      const dm = Math.abs(y - mouseY);
      if (dm < 90 && !flat) v += Math.sin(yy * .3 + t * 20) * (1 - dm / 90) * mouseNear * 2.4;
      breaks.forEach(by => { const d = Math.abs(y - by); if (d < 30 && !flat) v += (1 - d / 30) * Math.sin(d * .9) * 3.2; });
      const x = x0 + v * a;
      y ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(${col},1)`; ctx.font = '600 9px Inter, sans-serif';
    ctx.save(); ctx.translate(18, H - 24); ctx.rotate(-Math.PI / 2); ctx.fillText(flat ? 'NO MOVEMENT' : 'CSI · LINK 1→2', 0, 0); ctx.restore();
  }
  requestAnimationFrame(frame);
}
