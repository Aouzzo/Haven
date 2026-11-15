// Presentation-mode-only slides (shown when "Present" is on). This is a MOCK-UP for the team to edit:
// change the text here, add a slide by adding a key and placing ${P.yourKey} in pages/sections.js.
// Every element with data-slide becomes a stop for the arrow keys / clicker.

export const TEAM = ['Jack Jensen', 'Anthony Ouzounian', 'Luis Scheibe'];

export function presentSlides() {
  return {
    problem: `<section class="present-only slide slide-problem" data-slide="The problem">
      <div class="page-width">
        <span class="eyebrow">THE PROBLEM</span>
        <h2>Most nursing home falls happen <em>where nobody is watching</em>.</h2>
        <div class="slide-stats">
          <div><b data-count="3" data-prefix="~" data-suffix=" in 4">0</b><span>falls happen in residents’ own rooms or bathrooms</span></div>
          <div><b data-count="6306" data-prefix="$">0</b><span>average cost of one fall in skilled nursing</span></div>
          <div><b data-count="36" data-suffix="%">0</b><span>of liability claims are falls, ~$245K each</span></div>
        </div>
        <p class="slide-kicker">Today’s alerts depend on the person pressing a button.</p>
      </div>
    </section>`,
    live: `<section class="present-only slide slide-live" data-slide="Live demo">
      <div class="page-width">
        <span class="eyebrow">LIVE DEMO</span>
        <h2>Now, <em>for real</em>.</h2>
        <p class="slide-kicker">Three ESP32 boards in this room · switch to the live dashboard and phone alert.</p>
        <div class="slide-placeholder">Space for a screenshot or embed of the live dashboard. Edit pages/present.js.</div>
      </div>
    </section>`,
    next: `<section class="present-only slide slide-next" data-slide="What's next">
      <div class="page-width">
        <span class="eyebrow">WHAT’S NEXT</span>
        <h2>From prototype to <em>pilot</em>.</h2>
        <ol class="slide-list">
          <li><b>Validate falls</b><span>Labeled fall and everyday-activity trials, measuring missed alerts and false alarms.</span></li>
          <li><b>Reach staff where they are</b><span>Alerts to staff phones and nurse-call systems.</span></li>
          <li><b>Pilot on the Central Coast</b><span>One memory care facility, logged true and false alerts.</span></li>
        </ol>
      </div>
    </section>`,
    thanks: `<section class="present-only slide slide-thanks" data-slide="Thank you">
      <div class="page-width">
        <h2>Falls will happen.<br><em>Nobody should lie there alone.</em></h2>
        <p class="slide-team">${TEAM.join(' · ')}</p>
        <p class="slide-kicker">Thank you. Questions?</p>
      </div>
    </section>`
  };
}
