// A 12-second virtual film. Native scrolling is the only playback clock.
// Edit these normalized ranges to retime scenes; all transforms derive from progress.
export const TIMELINE = Object.freeze({
  enterHall: [0.14, 0.25], install: [0.27, 0.39], waves: [0.39, 0.46],
  resident: [0.48, 0.54], walk: [0.52, 0.67], seated: [0.67, 0.73],
  alert: [0.735, 0.77], reveal: [0.83, 0.95]
});
const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const between = (p, [a, b]) => smooth((p - a) / (b - a));
const opacity = (el, n) => { el.style.opacity = n.toFixed(4); };

export function mountTimeline() {
  const q = s => document.querySelector(s);
  const cinema = q('.cinema');
  const scroll = q('.cinema-scroll');
  const exterior = q('.exterior');
  const interior = q('.interior');
  const veil = q('.transition-veil');
  const mounts = [...document.querySelectorAll('.sensor-mount')];
  const waves = [...document.querySelectorAll('.radio-waves')];
  const resident = q('.resident-wrap');
  const walking = q('.walking');
  const seated = q('.seated');
  const alert = q('.fall-alert');
  const reveal = q('.brand-reveal');
  const revealContent = q('.reveal-content');
  const caption = q('.scene-caption');
  const sensorNote = q('.sensor-note');
  const bottom = q('.cinema-bottom');
  const header = q('.site-header');
  const chapters = [...document.querySelectorAll('.chapter-nav button')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = [
    ['01 / A PLACE TO CALL HOME', 'A quieter kind of care.', 'Thoughtfully designed. Reassuringly discreet.'],
    ['02 / THOUGHTFULLY CONNECTED', 'A small presence.\nA thoughtful connection.', 'Compact sensing. Designed to feel at home.'],
    ['03 / ROOM TO LIVE', 'Life, as it should be.', 'No cameras. No wearables. Just room to be yourself.'],
    ['04 / A MOMENT NOTICED', 'When a moment matters.', 'A conceptual signal that someone may need help.'],
    ['05 / SAFER', 'A smarter way to make assisted living safer.', '']
  ];
  let enabled = false, target = 0, current = 0, raf = 0, previousTime = 0, chapter = -1;
  const range = () => Math.max(1, scroll.offsetHeight - innerHeight);
  function render(p) {
    const reduced = reducedMotion.matches;
    const hall = between(p, TIMELINE.enterHall);
    const end = between(p, TIMELINE.reveal);
    opacity(interior, hall);
    opacity(exterior, 1 - hall);
    exterior.style.transform = `scale(${reduced ? 1 : 1 + .075 * smooth(p / .24)})`;
    exterior.style.filter = reduced ? 'none' : `blur(${Math.sin(hall * Math.PI) * 4}px)`;
    interior.style.transform = `scale(${reduced ? 1 : 1 + .016 * clamp((p - .23) / .54)})`;
    // A quiet light dissolve separates the resident states; no fall impact is shown.
    const fallCut = Math.sin(between(p, [.665, .735]) * Math.PI);
    opacity(veil, reduced ? 0 : fallCut * .65);
    for (let i = 0; i < mounts.length; i++) {
      const install = between(p, [TIMELINE.install[0] + i * .018, TIMELINE.install[1] + i * .018]);
      opacity(mounts[i], between(p, [.27 + i * .018, .30 + i * .018]));
      mounts[i].style.transform = `translate(${reduced ? 0 : (i === 0 ? -55 : 55) * (1-install)}px, ${reduced ? 0 : -380 * (1-install)}px) rotate(${reduced ? 0 : (i ? 12 : -12) * (1-install)}deg)`;
      const waveIn = between(p, TIMELINE.waves);
      opacity(waves[i], waveIn * .7 * (1-end));
      [...waves[i].children].forEach((circle,j) => {
        const cycle = reduced ? j / 3 : ((p * 7 + j / 3 + i * .1) % 1);
        circle.style.transform = `scale(${1 + cycle * 3})`;
        circle.style.opacity = ((1-cycle) * .6).toFixed(3);
      });
    }
    opacity(sensorNote, between(p,[.37,.41]) * (1-between(p,[.46,.51])));
    const walk = clamp((p-TIMELINE.walk[0])/(TIMELINE.walk[1]-TIMELINE.walk[0]));
    const sit = between(p, TIMELINE.seated);
    opacity(resident, between(p, TIMELINE.resident));
    resident.style.transform = reduced ? 'none' : `translate(${-17 * walk}px, ${11 * walk}px) scale(${.86 + .14 * walk})`;
    const frame = reduced ? 1 : Math.floor(walk * 12) % 4;
    walking.style.backgroundPosition = ['0% 0%', '50% 0%', '100% 0%', '0% 100%'][frame];
    opacity(walking, 1-sit);
    opacity(seated, sit);
    q('.resident-shadow').style.transform = `skewX(-28deg) scaleX(${1+sit*.7})`;
    q('.resident-shadow').style.top = `${97 - sit * 4.5}%`;
    const alertIn = between(p, TIMELINE.alert);
    opacity(alert, alertIn * (1-end));
    alert.style.transform = `translateY(${reduced ? 0 : 15*(1-alertIn)}px)`;
    alert.setAttribute('aria-hidden', String(p < .735 || end > .9));
    opacity(reveal, end);
    opacity(revealContent, between(p, [.86,.96]));
    revealContent.style.transform = `translateY(${reduced ? 0 : 24*(1-end)}px)`;
    reveal.style.pointerEvents = end > .85 ? 'auto' : 'none';
    reveal.inert = end < .85;
    reveal.setAttribute('aria-hidden', String(end < .85));
    opacity(caption, 1-end);
    opacity(bottom, 1-end);
    bottom.inert = end > .85;
    header.classList.toggle('revealed', end > .55);
    q('.timeline-track i').style.transform = `scaleX(${p})`;
    const nextChapter = p < .26 ? 0 : p < .49 ? 1 : p < .70 ? 2 : p < .86 ? 3 : 4;
    if (chapter !== nextChapter) {
      chapter = nextChapter;
      cinema.dataset.chapter = chapter;
      const [kicker,title,detail] = descriptions[chapter];
      q('.caption-kicker').textContent = kicker;
      q('.caption-title').innerText = title;
      q('.caption-detail').textContent = detail;
      q('.scene-announcement').textContent = `Scene ${chapter+1} of 5: ${title.replace('\n', ' ')} ${detail} Conceptual simulation.`;
      chapters.forEach((button,i) => i === chapter ? button.setAttribute('aria-current','step') : button.removeAttribute('aria-current'));
    }
    cinema.dataset.progress = p.toFixed(4);
  }
  function tick(time) {
    const dt = previousTime ? Math.min(40, time-previousTime) : 16;
    previousTime = time;
    current = reducedMotion.matches ? target : current + (target-current)*(1-Math.exp(-dt/70));
    if (Math.abs(target-current)<.00005) current=target;
    render(current);
    if (current !== target) raf=requestAnimationFrame(tick);
    else {raf=0;previousTime=0;}
  }
  function update() {
    if (!enabled) return;
    target = clamp(scrollY/range());
    if (!raf) raf=requestAnimationFrame(tick);
  }
  function jump(progress) {
    window.scrollTo({top:progress*range(),behavior:reducedMotion.matches?'instant':'smooth'});
  }
  chapters.forEach(button => button.addEventListener('click',()=>jump(Number(button.dataset.progress))));
  q('.replay-button').addEventListener('click',()=>{jump(0);chapters[0].focus({preventScroll:true});});
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',update,{passive:true});
  reducedMotion.addEventListener('change',update);
  render(0);
  return {ready(){enabled=true;update();}};
}
