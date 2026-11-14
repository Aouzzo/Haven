# Browser verification

Verified in the Codex embedded browser with desktop viewport overrides of 1440 × 900 and 1280 × 720, and mobile at 390 × 844. Temporary viewport overrides were reset afterward.

- Initial scene loads successfully and remains at timeline progress 0 until scrolling.
- Native forward scrolling advances the timeline; native reverse scrolling decreases it.
- All five chapter controls work, including backward navigation.
- Sensors enter the hallway, settle, and display scroll-driven radio waves.
- The transparent resident sheet composites over the same hallway throughout the walking and seated states.
- Detection is explicitly labeled as a conceptual alert. No impact is depicted.
- Final reveal fits the smaller desktop viewport, with both navigation buttons visible.
- Both reveal buttons navigate correctly to Technology and Login.
- Replay returns the timeline to progress 0.
- Technology FAQ expands, and Request a Demo reveals an explicit placeholder message without sending anything.
- Login shows the enterprise portal coming-soon page; home navigation works.
- Mobile pages have no horizontal overflow. Resident placement was adjusted to avoid the caption.
- No browser console errors or warnings were observed during these checks.
- All 18 checked local routes/resources returned HTTP 200.
- No remote URLs occur in website HTML, CSS or JavaScript. Assets and fonts require no external requests.
- JavaScript syntax checks and Python server compilation passed.

Reduced-motion handling is implemented and source-reviewed; an OS-level reduced-motion setting was not changed during verification. Browser testing was performed in the embedded browser, not a separate Chrome or Safari session.

## Issues fixed during review

- Removed backdrop blur that produced a visible rectangular compositing artifact in the embedded browser.
- Changed the pinned scene to `overflow: clip` so focusing a chapter cannot scroll the scene's internal contents out of alignment.
- Adjusted resident contact shadows and mobile scale.
- Kept secondary-page navigation fixed and available while scrolling.

## Saved previews

- `preview/exterior.jpg`
- `preview/detection.jpg`
- `preview/reveal.jpg`

## Presentation limits

This remains a conceptual frontend demo. The resident uses four illustrated walking poses rather than a fully rigged animation. Fall detection and notifications are simulated; the prototype makes no validated performance claims. The site is local-only and has not been deployed.
