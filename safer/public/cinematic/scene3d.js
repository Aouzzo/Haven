// Haven 3D world: a single-story care wing built from simple shapes (no downloaded models or images).
// Everything is driven by scroll progress p (0..1) passed to render(p, seconds).
import * as THREE from '../vendor/three.module.min.js';
import { ROOMS } from './story.js';

const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const between = (p, a, b) => smooth((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Building layout (metres-ish). Rooms 101-103 north of the corridor, 104-106 south.
const FLOOR = .3, WALL_H = 2.5, T = .16;
const X0 = -6.6, X1 = 6.6, ZN = -5.2, ZS = 5.2, CN = -1, CS = 1;
const ROOM_104 = ROOMS.find(r => r.n === 104);

// Camera flight path: [progress, camera position, look-at target]. Edit these to change the flight.
const KEYS = [
  [0, [15.5, 5, 23.5], [-2.6, 1.5, .5]],
  [.12, [10, 9.5, 18.5], [-2.5, 1, .5]],
  [.24, [2, 19, 15], [-3.2, 0, 1.6]],
  [.34, [-1.5, 22, 8.5], [-3.6, 0, 1.6]],
  [.46, [-1.6, 6.8, 10.6], [-4.3, .6, 3.2]],
  [.62, [-2.2, 6, 9.8], [-4.2, .5, 3.35]],
  [.76, [-1.9, 5.4, 9.2], [-3.95, .4, 3.45]],
  [.86, [11, 16.5, 19.5], [-1.5, 0, 0]],
  [1, [12, 18, 22], [0, 0, 0]]
];

// Three ESP32 sensors in room 104 (world coordinates).
const NODE_Y = FLOOR + 1.05;
const NODES = [V3(-6.42, NODE_Y, 1.35), V3(-2.38, NODE_Y, 1.35), V3(-4.4, NODE_Y, 5.04)];
const NODE_FACING = [Math.PI / 2, -Math.PI / 2, Math.PI];

const TEAL = new THREE.Color(0x7fe3c6), CORAL = new THREE.Color(0xf08a6c), AMBER = new THREE.Color(0xf2c27a);

export function createWorld(canvas, labelEls = []) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd9a98e, 60, 175);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 400);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Dusk lighting: warm low sun, cool fill, sky/ground bounce.
  scene.add(new THREE.HemisphereLight(0xffe0c2, 0x4a5643, 1.15));
  const sun = new THREE.DirectionalLight(0xffb27a, 2.6);
  sun.position.set(-16, 13, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9db3dd, .5);
  fill.position.set(14, 10, -12);
  scene.add(fill);

  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, metalness: 0, ...o });
  const M = {
    grass: std(0x9fae7c), bed: std(0x7d8f5f), path: std(0xd9cdb6), stone: std(0xb4a791), plaster: std(0xf1e7d3),
    trim: std(0x7a5a3d), corridor: std(0xe7ddcc), leaf: std(0x60794c, { flatShading: true }), leaf2: std(0x748b51, { flatShading: true }),
    pine: std(0x4d6a4b, { flatShading: true }), trunk: std(0x6b4f39), mountain: std(0x7d86a0, { flatShading: true }),
    frame: std(0x8a6a4c), pillow: std(0xfbf7ef), rug: std(0xdac9ab), chair: std(0x98a78d), pot: std(0xb0785a),
    node: std(0x2f3430, { roughness: .45 }), figure: std(0xd8c8ae), skin: std(0xeee3d2),
    glass: new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb766, emissiveIntensity: .95, roughness: .3 }),
    lampShade: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc77d, emissiveIntensity: 1.2 })
  };
  const blankets = [0xb7c4ae, 0xd9c2a0, 0xa9b8c9, 0xcfa79a, 0xb5bfa0, 0xd8cdb8].map(c => std(c));
  const woods = [0xc49a6c, 0xbf9466, 0xc9a173, 0xc29868, 0xc79d70, 0xbd9263].map(c => std(c));

  const pick = []; // meshes the cursor ripple can land on
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);

  // ---------- Landscape ----------
  const ground = mesh(new THREE.CircleGeometry(170, 64), M.grass, 0, 0, 0, scene, false);
  ground.rotation.x = -Math.PI / 2;
  pick.push(ground);

  // Stepping-stone path from the east entrance out toward the viewer.
  for (let i = 0; i < 16; i++) {
    const t = i / 15, x = X1 + 1.6 + t * 12, z = Math.sin(t * Math.PI * .9) * 3.2 + t * 6;
    const s = box(1.5, .06, 1.05, M.path, x, .03, z);
    s.rotation.y = -.35 - t * .4;
    s.castShadow = false;
  }
  // Flower beds along the south facade.
  const flowerMats = [0xe8b4b8, 0xf2d48f, 0xc9b6e4, 0xf7efe2].map(c => std(c));
  for (let i = 0; i < 3; i++) {
    const x = -4.4 + i * 4.4;
    box(2.8, .28, .7, M.bed, x, .14, ZS + .95);
    for (let k = 0; k < 9; k++) mesh(new THREE.IcosahedronGeometry(.11, 0), flowerMats[(k + i) % 4], x - 1.2 + k * .3, .34, ZS + .95 + Math.sin(k * 2.1) * .18);
  }

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function tree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(.12, .18, 1.2, 6), M.trunk, 0, .6, 0, g);
    if (rnd() < .55) {
      for (let k = 0; k < 3; k++) mesh(new THREE.ConeGeometry(1.25 - k * .3, 1.6, 7), M.pine, 0, 1.5 + k * .85, 0, g);
    } else {
      mesh(new THREE.IcosahedronGeometry(1.15, 0), rnd() < .5 ? M.leaf : M.leaf2, 0, 2.1, 0, g);
      mesh(new THREE.IcosahedronGeometry(.8, 0), M.leaf2, .55, 2.7, .2, g);
    }
  }
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2, r = 12 + rnd() * 34;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const deg = (a * 180 / Math.PI + 360) % 360;
    if (deg > 25 && deg < 85 && r < 32) continue; // keep the hero view and path clear
    tree(x, z, .8 + rnd() * .7);
  }
  for (let i = 0; i < 14; i++) {
    const a = (115 + i * 16 + rnd() * 10) * Math.PI / 180, r = 120 + rnd() * 30, ht = 9 + rnd() * 12;
    const m = mesh(new THREE.ConeGeometry(18 + rnd() * 16, ht, 7), M.mountain, Math.cos(a) * r, ht / 2 - 1, Math.sin(a) * r, scene, false);
    m.rotation.y = rnd() * 3;
  }

  // ---------- Building ----------
  const bldg = new THREE.Group();
  scene.add(bldg);
  pick.push(box(14, FLOOR, 10.9, M.stone, 0, FLOOR / 2, 0, bldg));
  ROOMS.forEach((r, i) => pick.push(box(4.4 - T, .04, 4.2 - T, woods[i], r.x, FLOOR + .02, r.z, bldg)));
  pick.push(box(13.2, .04, 2, M.corridor, 0, FLOOR + .02, 0, bldg));

  const walls = new THREE.Group(); // scaled down when the roof lifts (dollhouse cutaway)
  walls.position.y = FLOOR;
  bldg.add(walls);
  function wall(axis, fixed, from, to, holes = [], mat = M.plaster) {
    const seg = (a, b, y0, y1, m = mat, th = T) => {
      const len = b - a, h = y1 - y0, c = (a + b) / 2, y = (y0 + y1) / 2;
      const piece = axis === 'x' ? box(len, h, th, m, c, y, fixed, walls) : box(th, h, len, m, fixed, y, c, walls);
      if (m === mat) pick.push(piece);
      return piece;
    };
    let cur = from;
    for (const h of holes.sort((a, b) => a.c - b.c)) {
      const a = h.c - h.w / 2, b = h.c + h.w / 2;
      if (a > cur) seg(cur, a, 0, WALL_H);
      if (h.y0 > 0) {
        seg(a, b, 0, h.y0);
        seg(a, b, h.y0, h.y1, M.glass, .05).castShadow = false;
        seg(a - .06, b + .06, h.y0 - .06, h.y0, M.trim, T + .08);
      }
      seg(a, b, h.y1, WALL_H);
      cur = b;
    }
    if (to > cur) seg(cur, to, 0, WALL_H);
  }
  const win = c => ({ c, w: 1.7, y0: .8, y1: 2 });
  const door = (c, w = .95) => ({ c, w, y0: 0, y1: 2.1 });
  wall('x', ZS, X0 - T / 2, X1 + T / 2, ROOMS.filter(r => r.z > 0).map(r => win(r.x)));
  wall('x', ZN, X0 - T / 2, X1 + T / 2, ROOMS.filter(r => r.z < 0).map(r => win(r.x)));
  wall('z', X0, ZN, ZS, [{ ...win(3.1), w: 1.4 }, { ...win(-3.1), w: 1.4 }]);
  wall('z', X1, ZN, ZS, [{ ...win(3.1), w: 1.4 }, { ...win(-3.1), w: 1.4 }, door(0, 1.4)]);
  wall('x', CN, X0, X1, ROOMS.filter(r => r.z < 0).map(r => door(r.x)));
  wall('x', CS, X0, X1, ROOMS.filter(r => r.z > 0).map(r => door(r.x)));
  for (const x of [-2.2, 2.2]) { wall('z', x, ZN, CN); wall('z', x, CS, ZS); }
  for (const [x, z] of [[X0, ZN], [X0, ZS], [X1, ZN], [X1, ZS]]) box(.3, WALL_H, .3, M.trim, x, WALL_H / 2, z, walls);
  // Stone base band.
  box(13.5, .42, .24, M.stone, 0, .21, ZS + .02, walls);
  box(13.5, .42, .24, M.stone, 0, .21, ZN - .02, walls);

  // Porch at the east entrance.
  box(1.8, .12, 2.6, M.trim, X1 + .9, FLOOR + 2.3, 0, bldg);
  for (const z of [-1.1, 1.1]) box(.16, 2.3, .16, M.trim, X1 + 1.65, FLOOR + 1.15, z, bldg);
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffd28a });
  for (const z of [-.95, .95]) mesh(new THREE.BoxGeometry(.14, .22, .14), lanternMat, X1 + .12, FLOOR + 1.6, z, bldg, false);

  // Roof (fades and lifts away to reveal the floor plan).
  const roofMat = std(0x5b4c43, { transparent: true }), capMat = std(0xefe4cf, { transparent: true });
  const roofTrim = std(0x6e5139, { transparent: true }), roofStone = std(0xa99c86, { transparent: true });
  const roofMats = [roofMat, capMat, roofTrim, roofStone];
  const roof = new THREE.Group();
  roof.position.y = FLOOR + WALL_H;
  bldg.add(roof);
  const shape = new THREE.Shape([new THREE.Vector2(-5.5, 0), new THREE.Vector2(5.5, 0), new THREE.Vector2(0, 2.2)]);
  const prismGeo = new THREE.ExtrudeGeometry(shape, { depth: 13.4, bevelEnabled: false });
  prismGeo.translate(0, 0, -6.7);
  prismGeo.rotateY(Math.PI / 2);
  pick.push(mesh(prismGeo, [capMat, roofMat], 0, 0, 0, roof));
  const slope = Math.atan2(2.2, 5.5);
  for (const s of [1, -1]) {
    const panel = box(14.2, .16, 6.55, roofMat, 0, 1.2, s * 3, roof);
    panel.rotation.x = s * slope;
    pick.push(panel);
  }
  box(14.4, .16, .22, roofTrim, 0, 2.3, 0, roof);
  box(.65, 1.5, .65, roofStone, 3, 2, -1.5, roof);

  // ---------- Furniture ----------
  function furnish(r, i) {
    const g = new THREE.Group();
    const s = r.z > 0 ? 1 : -1; // +1: window faces south (+z)
    g.position.set(r.x, FLOOR + .04, r.z);
    bldg.add(g);
    box(1.25, .32, 2, M.frame, -1.2, .16, .05 * s, g);
    box(1.18, .14, 1.45, blankets[i], -1.2, .39, .32 * s, g);
    box(.95, .12, .38, M.pillow, -1.2, .4, -.72 * s, g);
    box(1.3, .85, .08, M.frame, -1.2, .43, -1.03 * s, g);
    box(.45, .48, .4, M.frame, -.25, .24, -1.1 * s, g);
    mesh(new THREE.CylinderGeometry(.04, .05, .25, 8), M.trim, -.25, .6, -1.1 * s, g);
    mesh(new THREE.ConeGeometry(.16, .2, 12, 1, true), M.lampShade, -.25, .8, -1.1 * s, g, false);
    const rug = mesh(new THREE.CylinderGeometry(.9, .9, .02, 32), M.rug, .55, .01, .3 * s, g, false);
    rug.scale.z = .75;
    box(.72, .4, .72, M.chair, 1.25, .2, 1.25 * s, g);
    box(.72, .62, .16, M.chair, 1.25, .55, (1.25 + .3) * s, g);
    mesh(new THREE.CylinderGeometry(.16, .12, .32, 8), M.pot, 1.6, .16, -1.4 * s, g);
    mesh(new THREE.IcosahedronGeometry(.3, 0), M.leaf, 1.6, .55, -1.4 * s, g);
  }
  ROOMS.forEach(furnish);

  // Warm lamp light in room 104.
  const lamp = new THREE.PointLight(0xffc98a, 7, 7, 2);
  lamp.position.set(ROOM_104.x - .25, FLOOR + 1.1, ROOM_104.z - 1.1);
  scene.add(lamp);

  // Highlight outline around room 104.
  const outlineMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false });
  const outline = new THREE.Group();
  outline.position.set(ROOM_104.x, FLOOR + .07, ROOM_104.z);
  scene.add(outline);
  for (const [w, d, x, z] of [[4, .07, 0, -1.9], [4, .07, 0, 1.9], [.07, 3.8, -2, 0], [.07, 3.8, 2, 0]]) {
    mesh(new THREE.BoxGeometry(w, .03, d), outlineMat, x, 0, z, outline, false).receiveShadow = false;
  }

  // ---------- ESP32 sensors, waves and signal particles ----------
  const ledMat = new THREE.MeshBasicMaterial({ color: TEAL });
  const haloMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: .35, depthWrite: false });
  const nodes = NODES.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(p);
    g.rotation.y = NODE_FACING[i];
    scene.add(g);
    mesh(new THREE.BoxGeometry(.28, .17, .07), M.node, 0, 0, 0, g);
    mesh(new THREE.CylinderGeometry(.012, .012, .2, 6), M.node, .1, .18, 0, g);
    mesh(new THREE.SphereGeometry(.03, 10, 8), ledMat, -.07, .02, .04, g, false);
    const halo = mesh(new THREE.SphereGeometry(.16, 16, 12), haloMat, 0, 0, .05, g, false);
    g.userData = { halo, flash: -10 };
    g.scale.setScalar(0);
    return g;
  });

  const waveMat = () => new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const ringGeo = new THREE.RingGeometry(.94, 1, 64);
  const waves = [];
  NODES.forEach((p, i) => {
    for (let k = 0; k < 3; k++) {
      const w = mesh(ringGeo, waveMat(), p.x, p.y - .02, p.z, scene, false);
      w.rotation.x = -Math.PI / 2;
      w.receiveShadow = false;
      w.userData = { phase: k / 3 + i * .13 };
      waves.push(w);
    }
  });

  const LINKS = [[0, 1], [1, 2], [2, 0]], PER = 26;
  const particleMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false });
  const particles = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 8, 6), particleMat, LINKS.length * PER);
  particles.frustumCulled = false;
  scene.add(particles);
  const dummy = new THREE.Object3D();

  // ---------- Resident (faceless figure, no identifying detail) ----------
  const resident = new THREE.Group();
  const body = new THREE.Group();
  resident.add(body);
  scene.add(resident);
  mesh(new THREE.CapsuleGeometry(.18, .32, 6, 14), M.figure, 0, 1.08, 0, body);
  mesh(new THREE.SphereGeometry(.12, 18, 14), M.skin, 0, 1.52, 0, body);
  const limb = (r, len, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    body.add(pivot);
    mesh(new THREE.CapsuleGeometry(r, len, 4, 10), M.figure, 0, -(len / 2 + r), 0, pivot);
    return pivot;
  };
  const legL = limb(.07, .6, -.09, .78), legR = limb(.07, .6, .09, .78);
  const armL = limb(.052, .42, -.25, 1.32), armR = limb(.052, .42, .25, 1.32);
  const haloRing = mesh(new THREE.RingGeometry(.55, .68, 48), new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), 0, FLOOR + .06, 0, scene, false);
  haloRing.rotation.x = -Math.PI / 2;
  const walkPath = new THREE.CatmullRomCurve3([V3(-4.75, 0, 2.45), V3(-4.5, 0, 2.85), V3(-4.6, 0, 3.2), V3(-4.6, 0, 3.55)]);

  // ---------- Cursor ripples in the world ----------
  const pingMat = () => new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const pings = Array.from({ length: 14 }, () => {
    const m = mesh(new THREE.RingGeometry(.86, 1, 48), pingMat(), 0, -10, 0, scene, false);
    m.receiveShadow = false;
    m.userData.born = -10;
    return m;
  });
  let pingIndex = 0, clock = 0;
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const visible = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

  // ---------- Camera ----------
  const posCurve = new THREE.CatmullRomCurve3(KEYS.map(k => V3(...k[1])));
  const lookCurve = new THREE.CatmullRomCurve3(KEYS.map(k => V3(...k[2])));
  const camPos = V3(0, 0, 0), camLook = V3(0, 0, 0), up = V3(0, 1, 0);
  let dragYaw = 0, width = 1, height = 1;
  function cameraAt(p, t) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const f = clamp((p - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]));
    const u = (i + lerp(f, smooth(f), .65)) / (KEYS.length - 1);
    posCurve.getPoint(u, camPos);
    lookCurve.getPoint(u, camLook);
    const hero = 1 - between(p, 0, .12);
    const yaw = hero * (dragYaw + (reduced.matches ? 0 : Math.sin(t * .13) * .2));
    camPos.sub(camLook).applyAxisAngle(up, yaw);
    if (width / height < 1) camPos.multiplyScalar(1.55); // portrait phones: pull back
    camPos.add(camLook);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  // Drag to look around (mouse only, so touch scrolling still works).
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, yaw: dragYaw };
    canvas.classList.add('dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (drag) dragYaw = Math.max(-1.1, Math.min(1.1, drag.yaw - (e.clientX - drag.x) * .005));
  });
  const endDrag = () => { drag = null; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  function resize() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? 50 : 36;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const projected = V3(0, 0, 0);
  const labelRooms = labelEls.map(el => ROOMS.find(r => String(r.n) === el.dataset.room));

  function render(p, t) {
    clock = t;
    const motion = reduced.matches ? 0 : 1;
    const lift = between(p, .1, .22);
    const fade = 1 - between(p, .12, .21);
    roof.position.y = FLOOR + WALL_H + lift * lift * 6;
    roofMats.forEach(m => { m.opacity = fade; m.depthWrite = fade > .95; });
    roof.visible = fade > .01;
    walls.scale.y = 1 - .5 * lift;

    // Story state
    const walk = clamp((p - .47) / .13);
    const fall = between(p, .6, .655);
    const still = p > .655;
    const alert = between(p, .66, .7) * (1 - between(p, .93, .97));
    const sensing = between(p, .3, .36) * (1 - between(p, .93, .98));

    // Sensors pop in during the floor-plan beat.
    nodes.forEach((g, i) => {
      const s = between(p, .25 + i * .025, .3 + i * .025);
      g.scale.setScalar(s * (1 + Math.sin(s * Math.PI) * .25) * 1.8);
      const flash = Math.max(0, 1 - (t - g.userData.flash) / .6);
      g.userData.halo.scale.setScalar(1 + flash * 1.6 + Math.sin(t * 3 + i) * .08 * motion);
    });
    haloMat.color.copy(TEAL).lerp(CORAL, alert);
    ledMat.color.copy(TEAL).lerp(CORAL, alert);

    // Expanding Wi-Fi rings from each sensor.
    waves.forEach(w => {
      const cycle = motion ? (t * .45 + w.userData.phase) % 1 : w.userData.phase;
      w.scale.setScalar(.2 + cycle * 2.4);
      w.material.opacity = (1 - cycle) * .45 * sensing;
      w.material.color.copy(TEAL).lerp(CORAL, alert);
    });

    // Resident walks, then has a possible fall.
    const at = walkPath.getPoint(smooth(walk));
    resident.position.set(at.x, FLOOR + .04, at.z);
    if (walk > 0) {
      const u = Math.min(smooth(walk), .98), from = walkPath.getPoint(u), to = walkPath.getPoint(u + .02);
      resident.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    } else resident.rotation.y = .9;
    const stride = walk > 0 && walk < 1 ? Math.sin(walk * Math.PI * 11) * .55 * motion : 0;
    legL.rotation.x = stride * (1 - fall) + fall * -.5;
    legR.rotation.x = -stride * (1 - fall) + fall * .25;
    armL.rotation.x = -stride * .7 * (1 - fall) - fall * 1.1;
    armR.rotation.x = stride * .7 * (1 - fall) - fall * .5;
    armL.rotation.z = fall * .2;
    armR.rotation.z = fall * .5;
    body.rotation.z = -fall * 1.48;
    body.position.y = fall * .17;
    body.position.y += (1 - fall) * Math.sin(t * 1.6) * .006 * motion;
    // Where the body ends up: lying along the figure's local +x axis.
    const lieX = Math.cos(resident.rotation.y) * .8 * fall, lieZ = -Math.sin(resident.rotation.y) * .8 * fall;
    haloRing.position.set(at.x + lieX, FLOOR + .06, at.z + lieZ);
    haloRing.material.opacity = alert * (.45 + Math.sin(t * 4) * .25 * motion);
    haloRing.scale.setScalar(1.3 + (motion ? (t * .8) % 1 : 0) * .5);

    // Signal particles flow between sensors; the body bends them while moving.
    const moving = walk > 0 && walk < 1 ? 1 : fall > 0 && fall < 1 ? 1.8 : 0;
    const bodyPos = V3(at.x + lieX, NODE_Y, at.z + lieZ);
    particleMat.opacity = sensing * .9;
    particleMat.color.copy(TEAL).lerp(CORAL, alert);
    let n = 0;
    LINKS.forEach(([a, b], li) => {
      for (let k = 0; k < PER; k++) {
        const f = motion ? (t * .3 + k / PER + li * .17) % 1 : k / PER;
        dummy.position.lerpVectors(NODES[a], NODES[b], f);
        const wob = Math.sin(f * Math.PI) * (.04 + moving * .09) * Math.sin(t * (3 + moving * 5) + k * 1.7) * (motion || .3);
        dummy.position.y += wob;
        const d = Math.hypot(dummy.position.x - bodyPos.x, dummy.position.z - bodyPos.z);
        if (d < 1) {
          const push = (1 - d) * (still ? .25 : .45 + moving * .35);
          dummy.position.y += push * (still ? -.5 : 1) * (motion ? (.6 + .4 * Math.sin(t * 6 + k)) : 1);
        }
        dummy.scale.setScalar(sensing * (.7 + .3 * Math.sin(f * Math.PI)));
        dummy.updateMatrix();
        particles.setMatrixAt(n++, dummy.matrix);
      }
    });
    particles.instanceMatrix.needsUpdate = true;

    // Room 104 outline.
    const focus = between(p, .36, .44) * (1 - between(p, .93, .97));
    outlineMat.opacity = focus * (alert ? .6 + Math.sin(t * 4) * .3 * motion : .7);
    outlineMat.color.copy(AMBER).lerp(CORAL, alert);
    lamp.intensity = 7 * (.4 + .6 * lift);

    // Cursor ripples.
    pings.forEach(m => {
      const age = (t - m.userData.born) / 1.15;
      if (age > 1) { m.visible = false; return; }
      m.visible = true;
      m.scale.setScalar(.15 + smooth(age) * 1.9);
      m.material.opacity = (1 - age) * .85;
    });

    cameraAt(p, t);
    const dash = between(p, .8, .855) * (1 - between(p, .93, .97));
    if (dash > .001 && width > 900) camera.setViewOffset(width, height, width * .13 * dash, 0, width, height);
    else camera.clearViewOffset();
    renderer.render(scene, camera);

    // Room labels follow their rooms on screen.
    const plan = Math.max(between(p, .22, .3) * (1 - between(p, .4, .46)), between(p, .8, .85) * (1 - between(p, .93, .96)));
    labelEls.forEach((el, i) => {
      const r = labelRooms[i];
      projected.set(r.x, FLOOR + WALL_H * walls.scale.y + .45, r.z).project(camera);
      const is104 = r.n === 104;
      let o = is104 ? Math.max(plan, focus) : plan;
      if (projected.z > 1) o = 0;
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate(${((projected.x + 1) / 2 * width).toFixed(1)}px, ${((1 - projected.y) / 2 * height).toFixed(1)}px) translate(-50%, -50%)`;
      if (is104) { el.classList.toggle('focus', focus > .5); el.classList.toggle('alerting', alert > .5); }
    });
  }

  function ping(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pick, false).find(h => visible(h.object) && !(h.object.material.opacity < .3));
    if (!hit) return;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    const m = pings[pingIndex++ % pings.length];
    m.position.copy(hit.point).addScaledVector(normal, .03);
    m.lookAt(hit.point.clone().add(normal));
    m.userData.born = clock;
    nodes.forEach(g => { if (g.scale.x > .2 && g.position.distanceTo(hit.point) < 2.6) g.userData.flash = clock; });
  }

  return { render, ping, resize };
}
