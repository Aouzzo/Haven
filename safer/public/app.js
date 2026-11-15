import { home } from './pages/home.js';
import { technology } from './pages/technology.js';
import { login } from './pages/login.js';
import { mountTimeline } from './cinematic/timeline.js';
import { mountCursor } from './cinematic/cursor.js';
import { mountAssembly } from './components/assembly.js';
import { ASSEMBLY_FRAMES } from './pages/sections.js';
import { mountFx, mountMarquee } from './cinematic/fx.js';
import { mountRoom } from './cinematic/room.js';
import { mountValley } from './cinematic/valley.js';
// One failing extra must never take the page down.
const safe = (name, fn) => { try { fn(); } catch (e) { console.warn(`[haven] ${name} failed`, e); } };

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
  const assembly = document.querySelector('.assembly');
  if (assembly) mountAssembly(assembly, ASSEMBLY_FRAMES);
  safe('fx', () => mountFx());
  safe('marquee', () => mountMarquee());
  safe('room', () => mountRoom(document.querySelector('#ai')));
  safe('valley', () => mountValley(document.querySelector('.valley-footer')));
}
mountCursor({ onPing: (x, y) => dispatchEvent(new CustomEvent('haven:ping', { detail: { x, y } })) });
