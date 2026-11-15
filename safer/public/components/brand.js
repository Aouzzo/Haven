export function shield(className = '') {
  return `<svg class="shield ${className}" viewBox="0 0 72 82" fill="none" aria-hidden="true"><path d="M36 4 65 15v24c0 18-29 37-29 37S7 57 7 39V15L36 4Z" stroke="currentColor" stroke-width="2.2"/><path d="M19 31q17-15 34 0M25 39q11-10 22 0M31 47q5-5 10 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="55" r="2" fill="currentColor"/></svg>`;
}
export const arrow = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export function header(home = false) {
  return `<header class="site-header ${home ? 'over-scene' : ''}"><a class="wordmark" href="/" aria-label="Haven home">${shield()}<span>Haven<span class="brand-dot">.</span></span></a><div class="header-right">${home ? '<span class="header-note">Thoughtfully connected.</span>' : '<a class="back-home" href="/">Back to home</a>'}</div></header>`;
}
export function footer() {
  return `<footer class="site-footer"><a class="wordmark" href="/">${shield()}<span>Haven.</span></a><p>Prototype. Not a medical device.</p><span>Designed for peace of mind.</span></footer>`;
}
export function sensor(className = '') {
  return `<div class="sensor ${className}"><div class="sensor-side"></div><div class="sensor-face"><span class="sensor-mark">s.</span><i></i><b></b></div></div>`;
}
