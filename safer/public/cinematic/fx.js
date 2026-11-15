// Scroll life for the sections below the 3D story (feature/site-additions):
// headlines rise in word by word, cards and stats slide in one after another,
// and every statistic counts up from zero when it scrolls into view.
// Respects prefers-reduced-motion. No dependencies.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  // keep punctuation glued to the word before it ("<em>here</em>." must not wrap the dot)
  [...el.querySelectorAll('em')].forEach(em => {
    const n = em.nextSibling;
    if (n && n.nodeType === 3 && /^[.,!?;:]/.test(n.textContent)) {
      const m = n.textContent.match(/^[.,!?;:]+/)[0];
      em.append(m);
      n.textContent = n.textContent.slice(m.length);
    }
  });
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'fx-w';
        inner.textContent = part;
        inner.style.setProperty('--wi', i++);
        w.append(inner);
        frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el);
}

// Counts the first number in a stat up from zero, keeping whatever text sits around it
// ("~3 in 4", "$6,306", "95%", "0 / 12"). Text with no number is left alone.
function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const text = el.textContent, m = text.match(/\d[\d,]*(\.\d+)?/);
  if (!m || reduced()) return;
  const to = parseFloat(m[0].replace(/,/g, '')), dec = (m[1] || '').length - (m[1] ? 1 : 0);
  if (!to) return;
  const pre = text.slice(0, m.index), suf = text.slice(m.index + m[0].length), comma = m[0].includes(',');
  const fmt = v => pre + (comma ? Math.round(v).toLocaleString('en-US') : v.toFixed(Math.max(0, dec))) + suf;
  el.style.minWidth = `${el.offsetWidth}px`;   // no layout jump while digits change
  const t0 = performance.now(), dur = 1300 + Math.min(900, to / 6);
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(to * e);
    if (k < 1) requestAnimationFrame(step); else { el.textContent = text; el.style.minWidth = ''; }
  };
  el.textContent = fmt(0);
  requestAnimationFrame(step);
}

export function mountFx(root = document) {
  if (!('IntersectionObserver' in window)) return;
  const after = root.querySelector('.story-after');
  if (!after) return;
  document.documentElement.classList.add('fx-on');

  after.querySelectorAll('.info-head h2, .team h2').forEach(splitWords);
  const sensorTitle = root.querySelector('#sensor-title');
  if (sensorTitle) splitWords(sensorTitle);

  // Items that slide in, staggered among their siblings.
  const ITEMS = '.info-head, .stat, .info-card, .compare-row, .why-now, .why-grid > div, .visit, .video-frame, .honest-note, .room-demo, .person, .credits, .fine-print, .info-cta';
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('fx-in');
    if (el.matches('.stat')) el.querySelectorAll('b').forEach(countUp);
    io.unobserve(el);
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });

  const all = [...after.querySelectorAll(ITEMS)];
  if (sensorTitle) all.push(sensorTitle.closest('.product-intro'));
  all.forEach(el => {
    if (!el) return;
    el.classList.add('fx-item');
    const sibs = [...el.parentElement.children].filter(c => c.matches(ITEMS));
    el.style.setProperty('--i', Math.max(0, sibs.indexOf(el)) % 8);
    io.observe(el);
  });

  // Section nav: highlight where you are.
  const navLinks = [...after.querySelectorAll('.info-nav a')];
  const navIo = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = root.querySelector(a.getAttribute('href')); if (s) navIo.observe(s); });
}

// Big brand banner: drifts on its own and speeds up with scrolling. Paused when off screen.
export function mountMarquee(root = document) {
  root.querySelectorAll('.brand-marquee').forEach(el => {
    const track = el.querySelector('.brand-marquee-track');
    if (!track || reduced()) return;
    let x = 0, last = performance.now(), lastY = scrollY, boost = 0, visible = false, raf = 0;
    const dir = el.dataset.dir === 'right' ? 1 : -1;
    const frame = now => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const dy = Math.abs(scrollY - lastY); lastY = scrollY;
      boost = boost * .9 + Math.min(40, dy) * .1;
      x += dir * (60 + boost * 18) * dt;
      const half = track.scrollWidth / 2;
      if (half) x = ((x % half) - half) % half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(el);
  });
}
