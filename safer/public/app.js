import { home } from './pages/home.js';
import { technology } from './pages/technology.js';
import { login } from './pages/login.js';
import { mountTimeline } from './cinematic/timeline.js';
import { mountCursor } from './cinematic/cursor.js';
import { mountFx } from './cinematic/fx.js';
import { mountDevice } from './cinematic/device.js';
import { mountRoom, mountFireflies } from './cinematic/room.js';
import { mountMeadows } from './cinematic/meadow.js';
import { mountPresent } from './cinematic/present.js';

const path = location.pathname.replace(/\/$/, '') || '/';
document.body.dataset.page = path === '/' ? 'home' : path.slice(1);
document.querySelector('#app').innerHTML = path === '/technology' ? technology() : path === '/login' ? login() : home();
document.title = path === '/technology' ? 'The Technology — Haven' : path === '/login' ? 'Enterprise Portal — Haven' : 'Haven — A quieter kind of care.';

if (path === '/') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const timeline = mountTimeline();
  timeline.ready();
  document.querySelector('.asset-status').classList.add('loaded');
  const safe = (name, fn) => { try { fn(); } catch (error) { console.error(name, error); } };
  safe('fx', () => mountFx());
  safe('device', () => mountDevice(document.querySelector('#device')));
  safe('room', () => mountRoom(document.querySelector('#how')));
  safe('fireflies', () => mountFireflies(document.querySelector('.fireflies-bg')));
  safe('meadows', () => mountMeadows());
  safe('present', () => mountPresent());
}
mountCursor({ onPing: (x, y) => dispatchEvent(new CustomEvent('haven:ping', { detail: { x, y } })) });

document.querySelector('#request-demo')?.addEventListener('click', event => {
  const note = document.querySelector('#contact-placeholder');
  note.hidden = !note.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!note.hidden));
});
