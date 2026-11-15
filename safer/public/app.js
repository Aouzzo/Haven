import { home } from './pages/home.js';
import { technology } from './pages/technology.js';
import { login } from './pages/login.js';
import { mountTimeline } from './cinematic/timeline.js';
import { mountCursor } from './cinematic/cursor.js';

const path = location.pathname.replace(/\/$/, '') || '/';
document.body.dataset.page = path === '/' ? 'home' : path.slice(1);
document.querySelector('#app').innerHTML = path === '/technology' ? technology() : path === '/login' ? login() : home();
document.title = path === '/technology' ? 'The Technology — Haven' : path === '/login' ? 'Enterprise Portal — Haven' : 'Haven — A quieter kind of care.';

if (path === '/') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const look = new URLSearchParams(location.search).get('look') === 'photo' ? 'photo' : 'stylized';
  document.body.dataset.look = look;
  document.querySelectorAll('.look-toggle a').forEach(a => a.toggleAttribute('aria-current', a.dataset.look === look));
  if (look === 'photo') document.querySelector('.photo-poster').src = '/assets/photo/hero_poster.jpg';
  const timeline = mountTimeline({ look });
  timeline.ready().then(() => document.querySelector('.asset-status').classList.add('loaded'));
}
mountCursor({ onPing: (x, y) => dispatchEvent(new CustomEvent('haven:ping', { detail: { x, y } })) });

document.querySelector('#request-demo')?.addEventListener('click', event => {
  const note = document.querySelector('#contact-placeholder');
  note.hidden = !note.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!note.hidden));
});
