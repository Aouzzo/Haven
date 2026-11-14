import { home, sceneAssets } from './pages/home.js';
import { technology } from './pages/technology.js';
import { login } from './pages/login.js';
import { mountTimeline } from './cinematic/timeline.js';

const path = location.pathname.replace(/\/$/, '') || '/';
document.body.dataset.page = path === '/' ? 'home' : path.slice(1);
document.querySelector('#app').innerHTML = path === '/technology' ? technology() : path === '/login' ? login() : home();
document.title = path === '/technology' ? 'The Technology — Safer' : path === '/login' ? 'Enterprise Portal — Safer' : 'Safer — A quieter kind of care.';

if (path === '/') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const timeline = mountTimeline();
  const loading = document.querySelector('.asset-status');
  Promise.all(sceneAssets.map(src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => image.decode().then(resolve, resolve);
    image.onerror = () => reject(new Error(`Scene could not load: ${src}`));
    image.src = src;
  }))).then(() => {
    loading.classList.add('loaded');
    timeline.ready();
  }).catch(error => {
    console.error(error);
    loading.innerHTML = 'A scene could not load.<span>Check the local assets, then reload.</span><button type="button">Try again</button>';
    loading.querySelector('button').addEventListener('click', () => location.reload());
  });
}
document.querySelector('#request-demo')?.addEventListener('click', event => {
  const note = document.querySelector('#contact-placeholder');
  note.hidden = !note.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!note.hidden));
});
