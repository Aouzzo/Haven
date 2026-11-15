// Additions on top of the main site (branch feature/site-additions-v2). Kept in their own file so
// they merge cleanly with work on pages/sections.js. Placed at the end of storySections().
export const TEAM = [
  { name: 'Jack Jensen', initials: 'JJ' },
  { name: 'Anthony Ouzounian', initials: 'AO' },
  { name: 'Luis Scheibe', initials: 'LS' }
];

export function teamSection() {
  return `<section id="team" class="info-section page-width team" aria-labelledby="team-title">
    <div class="info-head"><span class="eyebrow">07 / THE TEAM</span><h2 id="team-title">Built in a weekend<br><em>at Cal Poly</em>.</h2><p>Three students, three ESP32 boards, and AI coding agents working alongside us.</p></div>
    <div class="team-grid">
      ${TEAM.map(p => `<div class="person"><span class="avatar" aria-hidden="true">${p.initials}</span><b>${p.name}</b><span>Cal Poly</span></div>`).join('')}
    </div>
  </section>`;
}

// Footer scene: the intro's granite valley and lodge at dusk (cinematic/valley.js).
export function valleyFooter() {
  return `<div class="valley-footer" aria-hidden="true"><canvas></canvas><p class="valley-line">Make it a <em>Haven</em>.</p></div>`;
}
