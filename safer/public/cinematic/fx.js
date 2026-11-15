// Small, purposeful interactions for the sections below the 3D story:
// staggered reveals, word-by-word headline reveals, count-up numbers, cursor spotlight on cards,
// magnetic buttons, active section in the pill nav, and the ROI calculator.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  // keep punctuation glued to the word before it (e.g. "<em>night shift</em>." must not wrap the dot)
  [...el.querySelectorAll('em')].forEach(em => {
    const n = em.nextSibling;
    if (n && n.nodeType === 3 && /^[.,!?;:]/.test(n.textContent)) {
      const m = n.textContent.match(/^[.,!?;:]+/)[0];
      em.append(m);
      n.textContent = n.textContent.slice(m.length);
    }
  });
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--wi', i++);
          w.append(inner);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
}

function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  const fmt = v => pre + Math.round(v).toLocaleString('en-US') + suf;
  if (reduced() || to === 0) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 1400 + Math.min(900, to / 8);
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(to * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function mountFx(root = document) {
  // Headlines: word-by-word rise.
  root.querySelectorAll('.split, .slide h2').forEach(splitWords);

  // Reveal on scroll, staggering children.
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(el);
  }), { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  root.querySelectorAll('.info-head, .reveal-item, .stat-row, .slide, .device-copy, .roi, .matrix, .team-grid').forEach((el, idx) => {
    const parent = el.parentElement;
    const sib = parent ? [...parent.children].filter(c => c.classList.contains('reveal-item')) : [];
    el.style.setProperty('--i', Math.max(0, sib.indexOf(el)));
    io.observe(el);
  });

  // Cursor spotlight + slight tilt on cards.
  root.querySelectorAll('.info-card, .roi, .person, .video-frame, .room-demo, .why-now').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      if (!reduced() && card.classList.contains('info-card')) card.style.transform = `perspective(900px) rotateX(${(.5 - y) * 4}deg) rotateY(${(x - .5) * 5}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Magnetic buttons.
  root.querySelectorAll('.button, .info-nav a, .present-toggle').forEach(b => {
    b.addEventListener('pointermove', e => {
      if (reduced()) return;
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .25}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  // Pill nav: highlight the section in view.
  const navLinks = [...root.querySelectorAll('.info-nav a')];
  const navIo = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = root.querySelector(a.getAttribute('href')); if (s) navIo.observe(s); });

  mountRoi(root);
}

function mountRoi(root) {
  const range = root.querySelector('.roi-range'), priceRange = root.querySelector('.roi-price-range');
  if (!range) return;
  const $ = s => root.querySelector(s);
  const FALL = 6306, SUIT = 245000;
  const update = () => {
    const rooms = +range.value, price = +priceRange.value, cost = rooms * price * 12, falls = cost / FALL;
    $('.roi-rooms').textContent = rooms;
    $('.roi-price').textContent = `$${price}`;
    $('.roi-cost').textContent = `$${cost.toLocaleString('en-US')}`;
    $('.roi-falls').textContent = falls.toFixed(1);
    $('.roi-suit').textContent = `${Math.round(cost / SUIT * 100)}%`;
    // bar: falls to break even vs. typical falls a year (1–2 per bed)
    $('.roi-bar i').style.width = `${Math.min(100, falls / (rooms * 1.5) * 100 * 4)}%`;
    [range, priceRange].forEach(r => r.style.setProperty('--fill', `${(r.value - r.min) / (r.max - r.min) * 100}%`));
  };
  range.addEventListener('input', update);
  priceRange.addEventListener('input', update);
  update();
}
