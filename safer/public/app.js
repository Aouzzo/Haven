import { home } from './pages/home.js';
import { mountTimeline } from './cinematic/timeline.js';
import { mountCursor } from './cinematic/cursor.js';
import { mountAssembly } from './components/assembly.js';
import { ASSEMBLY_FRAMES } from './pages/sections.js';

if (['/login', '/technology'].includes(location.pathname.replace(/\/$/, ''))) history.replaceState(null, '', '/');   // removed pages land on home
const path = location.pathname.replace(/\/$/, '') || '/';
document.body.dataset.page = path === '/' ? 'home' : path.slice(1);
document.querySelector('#app').innerHTML = home();
document.title = 'Haven — A quieter kind of care.';

if (path === '/') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const timeline = mountTimeline();
  timeline.ready();
  document.querySelector('.asset-status').classList.add('loaded');
  const assembly = document.querySelector('.assembly');
  if (assembly) mountAssembly(assembly, ASSEMBLY_FRAMES);
}
mountCursor({ onPing: (x, y) => dispatchEvent(new CustomEvent('haven:ping', { detail: { x, y } })) });
