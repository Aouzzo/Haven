// One place for the scroll story. `at` is where the chapter button jumps (0..1 scroll progress).
// `until` is where the chapter ends. Scene timings live in scene3d.js and timeline.js and follow these beats.
export const CHAPTERS = [
  { at: 0, until: .24, name: 'Community', kicker: '01 / A PLACE TO CALL HOME', title: 'A quieter kind of care.', detail: 'Most falls happen behind closed doors. Staff can’t watch every room.' },
  { at: .31, until: .44, name: 'Sensing', kicker: '02 / THE WI-FI ALREADY THERE', title: 'One small sensor per room.\nThe Wi-Fi is already there.', detail: 'A plug-in ESP32 reads how the building’s own Wi-Fi bends around a body (CSI).' },
  { at: .54, until: .62, name: 'Daily life', kicker: '03 / ROOM 104', title: 'Life, as usual.', detail: 'Movement ripples the signal. No images, no audio, no names.' },
  { at: .72, until: .79, name: 'Possible fall', kicker: '04 / A POSSIBLE FALL', title: 'Someone falls\nand doesn’t get up.', detail: 'The AI spots the sudden change, then the stillness.' },
  { at: .86, until: .92, name: 'Care team', kicker: '05 / THE CARE TEAM', title: 'Staff know right away.', detail: 'The caregiver’s phone shows the room, the time, and how long there has been no movement, so help goes straight there.' },
  { at: 1, until: 1.01, name: 'Haven', kicker: '06 / HAVEN', title: 'Make it a <em>Haven</em>.', detail: '' }
];

export const ROOMS = [
  { n: 101, x: -4.4, z: -3.1, status: 'Occupied · quiet' },
  { n: 102, x: 0, z: -3.1, status: 'Empty' },
  { n: 103, x: 4.4, z: -3.1, status: 'Occupied · moving' },
  { n: 104, x: -4.4, z: 3.1, status: 'Possible fall' },
  { n: 105, x: 0, z: 3.1, status: 'Occupied · quiet' },
  { n: 106, x: 4.4, z: 3.1, status: 'Occupied · moving' }
];

export const ALERT_TIME = '7:42 PM';

// Demo video for the section below the story. Leave '' to show the "coming soon" frame.
// Use a local file (put it in /assets/video/, e.g. '/assets/video/haven-demo.mp4') or a YouTube link.
export const DEMO_VIDEO = 'https://youtu.be/x4Kj37J_b4A';
