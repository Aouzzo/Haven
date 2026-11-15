// Haven 3D world: an assisted living community in a granite valley, built entirely in code
// (no downloaded models or images). The architecture borrows from rustic national-park lodges
// (granite bases, dark timber-brown walls, stepped towers); the valley from Yosemite.
// Everything is driven by scroll progress p (0..1) passed to render(p, seconds).
// Look: rounded geometry, procedural canvas textures, soft shadows + ambient occlusion,
// tilt-shift miniature depth of field, bloom on lights, AgX colour (techniques from well-liked
// stylized three.js scenes such as "Zippy Town" and "Mistwood Cottage").
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/addons/geometries/RoundedBoxGeometry.js';
import { SimplexNoise } from '../vendor/addons/math/SimplexNoise.js';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { GTAOPass } from '../vendor/addons/postprocessing/GTAOPass.js';
import { BokehPass } from '../vendor/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/addons/postprocessing/ShaderPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';
import { ROOMS } from './story.js';

const clamp = n => Math.min(1, Math.max(0, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const between = (p, a, b) => smooth((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Building layout (metres). Rooms 101-103 north of the corridor, 104-106 south.
const FLOOR = .3, WALL_H = 2.5, T = .16;
const X0 = -6.6, X1 = 6.6, ZN = -5.2, ZS = 5.2, CN = -1, CS = 1;
const ROOM_104 = ROOMS.find(r => r.n === 104);

// Camera flight path: [progress, camera position, look-at target]. Edit these to change the flight.
const KEYS = [
  [0, [33, 5.2, 44], [-6, 7, -12]],                 // hero: care wing, lodge and the valley walls
  [.12, [12, 9.5, 20], [-2.5, 1.5, .5]],
  [.24, [2, 19, 15], [-3.2, 0, 1.6]],
  [.34, [-1.5, 22, 8.5], [-3.6, 0, 1.6]],
  [.46, [-1.6, 6.8, 10.6], [-4.3, .6, 3.2]],
  [.6, [-2.7, 4.5, 8.6], [-4.3, .6, 3.2]],          // follow the resident
  [.705, [-2.6, 3.4, 7.2], [-4, .35, 3.4]],          // close on the fall
  [.75, [-3.5, 1.35, 2.75], [-3.8, .6, 1.09]],     // pan off the resident onto the Haven sensor on the wall
  [.775, [-3.68, 1.15, 2.45], [-3.86, .6, 1.09]],    // hold on the sensor as it sends the alert
  [.82, [-.2, 6.6, 7.4], [-3.1, .3, .9]],            // the caregiver heads down the corridor
  [.88, [-1.6, 4.2, 7.4], [-3.9, .45, 2.9]],         // and kneels beside the resident
  [1, [30, 16, 40], [-6, 9, -22]]                    // wide: the whole community at dusk
];

// One small plug-in sensor per room (low on the corridor-side wall), all listening to the
// building's existing Wi-Fi router, mounted on the corridor wall.
const NODE_Y = FLOOR + .34;
const ROUTER = V3(-1.25, FLOOR + 1.02, -.9);
const NODES = ROOMS.map(r => V3(r.x + .66, NODE_Y, (r.z > 0 ? 1 : -1) * 1.09));
const NODE_FACING = ROOMS.map(r => r.z > 0 ? 0 : Math.PI);
const I104 = ROOMS.findIndex(r => r.n === 104);

const TEAL = new THREE.Color(0xf3d6a4), CORAL = new THREE.Color(0xf08a6c), AMBER = new THREE.Color(0xf2c27a);
const SUN_DIR = V3(-16, 11, 14).normalize();
const SKY_TOP = new THREE.Color(0x24467f), SKY_MID = new THREE.Color(0x8fb0d6), HORIZON = new THREE.Color(0xf6d1a2);
const HAZE = new THREE.Color(0xb9c3cc);

// ---------- small helpers ----------
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = arr => arr[Math.floor(rnd() * arr.length)];

function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };

// World-aligned UVs on a BoxGeometry, so textures line up across separate pieces.
function boxUV(geo, w, h, d, x0, y0, z0, tile) {
  const uv = geo.attributes.uv;
  const faces = [[d, h, z0, y0], [d, h, z0, y0], [w, d, x0, z0], [w, d, x0, z0], [w, h, x0, y0], [w, h, x0, y0]];
  for (let f = 0; f < 6; f++) {
    const [fu, fv, ou, ov] = faces[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (ou + uv.getX(i) * fu) / tile, (ov + uv.getY(i) * fv) / tile);
    }
  }
  uv.needsUpdate = true;
}

export function createWorld(canvas, labelEls = []) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const DPR = Math.min(devicePixelRatio || 1, 1.25);
  renderer.setPixelRatio(DPR);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;   // re-rendered only when the story moves (see render)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HAZE, 80, 720);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 1400);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const noAO = o => { o.userData.noAO = true; return o; };

  // ---------- Lighting: warm low sun, sky/ground bounce, soft shadows ----------
  scene.add(new THREE.HemisphereLight(0xffe2c8, 0x5d6b4c, .6));
  const sun = new THREE.DirectionalLight(0xffb27a, 3.1);
  sun.position.copy(SUN_DIR).multiplyScalar(60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 130 });
  sun.shadow.bias = -.0003;
  sun.shadow.normalBias = .025;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fb6e6, .45);
  fill.position.set(14, 10, -12);
  scene.add(fill);

  // ---------- Procedural textures ----------
  const TX = {
    siding: canvasTex(256, 256, (g, w, h) => {          // dark timber-brown vertical boards (lodge style)
      let x = 0;
      while (x < w) {
        const bw = 18 + Math.floor(rnd() * 12), col = pick(['#6f4631', '#7a4f37', '#684230', '#81563b', '#734a33']);
        const grad = g.createLinearGradient(x, 0, x + bw, 0);
        grad.addColorStop(0, shade(col, .03)); grad.addColorStop(1, shade(col, -.03));
        g.fillStyle = grad; g.fillRect(x, 0, bw, h);
        for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(40,22,12,${.12 + rnd() * .12})`; g.lineWidth = 1; g.beginPath(); const xx = x + 3 + rnd() * (bw - 6); g.moveTo(xx, 0); g.bezierCurveTo(xx + 2, h * .3, xx - 2, h * .6, xx + 1, h); g.stroke(); }
        g.fillStyle = 'rgba(30,16,8,.75)'; g.fillRect(x, 0, 2, h);
        x += bw;
      }
    }),
    planks: canvasTex(512, 512, (g, w, h) => {
      const tones = ['#c38d58', '#b98250', '#cc9862', '#b27a49', '#c79059'];
      for (let r = 0; r < 8; r++) {
        let x = -rnd() * 200;
        while (x < w) {
          const len = 140 + rnd() * 220, col = pick(tones);
          g.fillStyle = col; g.fillRect(x, r * 64, len, 64);
          for (let k = 0; k < 7; k++) { g.strokeStyle = shade(col, -.06 + rnd() * .04); g.lineWidth = 1; g.beginPath(); const yy = r * 64 + 6 + rnd() * 52; g.moveTo(x, yy); g.bezierCurveTo(x + len * .3, yy + 3, x + len * .6, yy - 3, x + len, yy); g.stroke(); }
          g.fillStyle = 'rgba(70,40,20,.55)'; g.fillRect(x, r * 64, 2, 64);
          x += len;
        }
        g.fillStyle = 'rgba(70,40,20,.6)'; g.fillRect(0, r * 64, w, 2);
      }
    }),
    shingles: canvasTex(256, 256, (g, w, h) => {
      const tones = ['#4f4a42', '#5a5246', '#47433c', '#615849', '#3f3b35'];
      for (let r = 0; r < 8; r++) {
        const off = r % 2 ? 16 : 0;
        for (let c = -1; c < 9; c++) {
          const x = c * 32 + off, y = r * 32, col = pick(tones);
          const grad = g.createLinearGradient(0, y, 0, y + 32);
          grad.addColorStop(0, shade(col, -.06)); grad.addColorStop(1, shade(col, .05));
          g.fillStyle = grad; g.fillRect(x + 1, y, 30, 31);
        }
        g.fillStyle = 'rgba(25,18,14,.7)'; g.fillRect(0, r * 32 + 30, w, 2);
      }
    }),
    stone: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#5e5a53'; g.fillRect(0, 0, w, h);         // rough granite boulders
      for (let r = 0; r < 6; r++) {
        let x = -rnd() * 40;
        while (x < w) {
          const sw = 30 + rnd() * 46, col = pick(['#b7b1a6', '#a59f94', '#c4beb2', '#9a948a', '#aea698', '#bdb3a2']);
          g.fillStyle = col;
          g.beginPath(); g.roundRect(x + 2, r * 43 + 2 + (rnd() - .5) * 4, sw - 4, 38 + rnd() * 3, 12); g.fill();
          for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '40,38,34' : '255,250,240'},${rnd() * .18})`; g.fillRect(x + 4 + rnd() * (sw - 10), r * 43 + 5 + rnd() * 32, 2, 2); }
          g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 7, r * 43 + 5, sw - 16, 4);
          x += sw;
        }
      }
    }),
    tile: canvasTex(128, 128, (g, w, h) => {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#e9e0cf' : '#e1d6c2'; g.fillRect(i * 64, j * 64, 64, 64); }
      g.strokeStyle = '#c9bca5'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); g.strokeRect(64, 64, 64, 64);
    }),
    slats: canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = '#7f8f77'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 12) { g.fillStyle = '#6a7a62'; g.fillRect(4, y + 8, w - 8, 3); }
      g.strokeStyle = '#5f6f58'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    }, false)
  };
  const rugTex = colors => canvasTex(256, 256, (g, w, h) => {
    colors.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, 128 - i * 22, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([6, 6]); g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.stroke();
  }, false);
  const glowTex = canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }, false);

  // ---------- Materials ----------
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, ...o });
  const M = {
    siding: std(0xffffff, { map: TX.siding }), plaster: std(0xf3ece0), cap: std(0x3a3632, { roughness: .9 }),
    trim: std(0x4b3326, { roughness: .7 }), shutter: std(0xffffff, { map: TX.slats }), stone: std(0xffffff, { map: TX.stone }),
    roof: std(0xffffff, { map: TX.shingles, roughness: .9 }), wood: std(0xffffff, { map: TX.planks, roughness: .7 }),
    tile: std(0xffffff, { map: TX.tile, roughness: .55 }), deck: std(0xffffff, { map: TX.planks, color: 0xd9c0a0 }),
    beam: std(0x5a3b2a), door: std(0x8a3f2c, { roughness: .55 }), brass: std(0xd4ad62, { metalness: .8, roughness: .3 }),
    metal: std(0x3b3f3c, { metalness: .5, roughness: .45 }), soil: std(0x5a4130, { roughness: 1 }),
    glass: std(0xffdcaa, { emissive: 0xffb469, emissiveIntensity: 1.9, roughness: .25 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc77d, emissiveIntensity: 3.2 }),
    bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 1.3) }),
    frame: std(0x8a6a4c, { roughness: .6 }), linen: std(0xfbf7ef, { roughness: .95 }), node: std(0x2f3430, { roughness: .4 }),
    figure: std(0xd8c8ae, { roughness: .7 }), skin: std(0xeee3d2, { roughness: .7 }),
    leaf: std(0x6f8f4e, { flatShading: true }), trunk: std(0x6b4f39, { roughness: .95 }), pine: std(0x4f6f4f, { flatShading: true }),
    rock: std(0x9a958c, { flatShading: true }), fence: std(0x7a5a3e, { roughness: .9 }), cloud: std(0xfff3ea, { emissive: 0xffd2b0, emissiveIntensity: .25, flatShading: true })
  };
  const blankets = [0x9fb59a, 0xd9b98f, 0x9db0c8, 0xd39d8f, 0xb4bf93, 0xcbb7d6].map(c => std(c, { roughness: .95 }));
  const fabrics = [0x7e9a86, 0xc98f6b, 0x8a9bc0, 0xb98aa0, 0x9aa66e, 0xd2a857].map(c => std(c, { roughness: .95 }));
  const curtains = [0xe8d7c0, 0xd6e0d2, 0xe6d0d6, 0xd9dbe8, 0xece2c6, 0xe2d6e8].map(c => std(c, { roughness: 1, side: THREE.DoubleSide }));
  const rugs = [['#c98f6b', '#efe2c9', '#9fb59a', '#efe2c9'], ['#8a9bc0', '#f3ead8', '#c9a46a'], ['#b98aa0', '#f3ead8', '#8aa58e'],
    ['#9aa66e', '#f7efdf', '#c98f6b'], ['#c9a46a', '#f3ead8', '#7e9a86'], ['#7e9a86', '#efe2c9', '#d39d8f']].map(c => std(0xffffff, { map: rugTex(c), roughness: 1 }));

  const pickables = []; // meshes the cursor ripple can land on
  const styl = new THREE.Group();
  scene.add(styl);
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent = styl, cast = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const rbox = (w, h, d, mat, x, y, z, parent, r = .04) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat, x, y, z, parent);
  // textured box with world-aligned UVs (x0,y0,z0 = world min corner)
  function tbox(w, h, d, mat, x, y, z, parent, tile, ox = 0, oy = 0, oz = 0) {
    const geo = new THREE.BoxGeometry(w, h, d);
    boxUV(geo, w, h, d, x - w / 2 + ox, y - h / 2 + oy, z - d / 2 + oz, tile);
    return mesh(geo, mat, x, y, z, parent);
  }

  // ---------- Sky dome with sun glow ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, mid: { value: SKY_MID }, horizon: { value: HORIZON }, sunDir: { value: SUN_DIR }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, horizon, sunDir; uniform float uTime; varying vec3 vDir;
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hsh(i), hsh(i+vec2(1.,0.)), f.x), mix(hsh(i+vec2(0.,1.)), hsh(i+vec2(1.,1.)), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + 17.; a *= .5; } return s; }
      void main(){ float h = vDir.y; vec3 c = mix(horizon, mid, smoothstep(0.0, .22, h)); c = mix(c, top, smoothstep(.22, .75, h));
        c = mix(c, horizon * .92, smoothstep(0.0, -.15, h));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.); c += vec3(1., .7, .45) * (pow(s, 12.) * .35 + pow(s, 400.) * 2.5);
        if (h > .02) { vec2 q = vDir.xz / (h + .14) * 1.3 + vec2(uTime * .003, 0.); float cl = smoothstep(.5, .82, fbm(q)) * smoothstep(.02, .22, h);
          vec3 cc = mix(vec3(1., .84, .7), vec3(1.), smoothstep(0., .5, h)) * (.82 + .18 * fbm(q * 3.)); c = mix(c, cc, cl * .8); }
        gl_FragColor = vec4(c, 1.); }`
  }));
  noAO(sky);
  scene.add(sky);
  { // Light every surface from the sky itself (image-based lighting), baked once at load.
    const envScene = new THREE.Scene(); envScene.add(sky.clone());
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0, 1, 2000).texture;
    scene.environmentIntensity = .42;
    pmrem.dispose();
  }

  const dummy = new THREE.Object3D();
  // ---------- Terrain: a flat meadow valley ringed by sheer granite walls ----------
  const noise = new SimplexNoise({ random: rnd });
  const pathPt = t => [X1 + 1.6 + t * 12, Math.sin(t * Math.PI * .9) * 3.2 + t * 6];
  // Landmarks on the valley rim (world x, z). The sheer face of each points toward the valley centre.
  const DOME = { x: -84, z: -300, H: 112, a: 56, b: 44 };        // a half-dome
  const CAP = { x: -255, z: -150, H: 82, a: 30, b: 64 };         // a big granite monolith
  const FALLS_ANGLE = Math.atan2(-.8, -.6);                       // a waterfall on the north wall
  function feature(x, z, f, cliffy) {
    const dx = x - f.x, dz = z - f.z, L = Math.hypot(f.x, f.z);
    const ux = -f.x / L, uz = -f.z / L;                           // unit vector toward the valley
    const u = dx * ux + dz * uz, v = -dx * uz + dz * ux;           // u: toward valley, v: along the rim
    if (cliffy) {                                                  // monolith: rounded top, sheer front
      const rr = Math.max(Math.abs(u + 10) / f.a, Math.abs(v) / f.b);
      const top = f.H * (1 - .18 * (v / f.b) ** 2) * (1 - smooth((rr - .55) / .5));
      return top * (1 - smooth((u - 2) / 3));
    }
    const rr = Math.hypot(u / f.a, v / f.b);                      // dome sliced clean on the valley side
    const dome = f.H * Math.pow(Math.max(0, 1 - rr * rr), .62);
    return dome * (1 - smooth((u + 2) / 2.5));
  }
  // Roads: an entry road up the valley, a drop-off court by the care wing, a car park beside the lodge.
  const ROAD_W = 6.4;
  const roadPts = new THREE.CatmullRomCurve3([[-135, 98], [-75, 62], [-34, 36], [-4, 25], [14, 19], [24, 12.5], [28.5, 7], [33, -4], [37, -15], [40, -20]].map(([x, z]) => V3(x, 0, z))).getSpacedPoints(230);
  const COURT = { x: 28.5, z: 7, r: 6.5 }, LOT = { x: 42, z: -27, w: 24, d: 20 };
  function roadDist(x, z) {
    if (x > 60 || x < -145 || z < -40 || z > 110) return 99;
    let best = 1e9;
    for (let i = 0; i < roadPts.length; i++) { const dx = x - roadPts[i].x, dz = z - roadPts[i].z, d = dx * dx + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  }
  const paved = (x, z, m = 0) => Math.hypot(x - COURT.x, z - COURT.z) < COURT.r + m || (Math.abs(x - LOT.x) < LOT.w / 2 + m && Math.abs(z - LOT.z) < LOT.d / 2 + m) || roadDist(x, z) < ROAD_W / 2 + m;
  const padW = (d) => 1 - smooth((d - 1) / 6);
  function heightAt(x, z) {
    const r = Math.hypot(x, z), ang = Math.atan2(z, x);
    const flat = smooth((r - 15) / 14);                          // flat lot around the buildings
    let h = (noise.noise(x * .03, z * .03) * 1.1 + noise.noise(x * .09, z * .09) * .3) * flat;
    h *= 1 - Math.max(padW(Math.hypot(x - COURT.x, z - COURT.z) - COURT.r), padW(Math.max(Math.abs(x - LOT.x) - LOT.w / 2, Math.abs(z - LOT.z) - LOT.d / 2)), padW(Math.max(Math.abs(x + 4) - 30, Math.abs(z + 26) - 13)));   // level ground for paving and the lodge
    const edge = 150 + noise.noise(Math.cos(ang) * 1.6, Math.sin(ang) * 1.6) * 18 + noise.noise(Math.cos(ang) * 9, Math.sin(ang) * 9) * 5;
    h += smooth((r - edge + 16) / 18) * 5;                       // talus apron at the foot of the walls
    const wall = smooth((r - edge) / 11);                        // steep granite face
    const crest = 46 + noise.noise(x * .009, z * .009) * 12 + Math.max(0, noise.noise(x * .018, z * .018)) * 9;   // rounded granite domes on the rim
    h += wall * (crest + noise.noise(x * .05, z * .05) * 3) + wall * (1 - wall) * noise.noise(ang * 40, h * .05) * 10;
    h = Math.max(h, feature(x, z, DOME, false), feature(x, z, CAP, true));
    return Math.max(h, -.4);
  }
  const TERR = 820, TSEG = 420;
  const terrGeo = new THREE.PlaneGeometry(TERR, TERR, TSEG, TSEG);
  terrGeo.rotateX(-Math.PI / 2);
  const tp = terrGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i); tp.setY(i, heightAt(x, z) - (paved(x, z, .9) ? .22 : 0)); }
  // Baked lighting: march from each point toward the sun across the height grid, so the valley walls
  // cast long soft shadows over the meadow and forest (far beyond what the real-time shadow map covers).
  const CELL = TERR / TSEG, HN = TSEG + 1;
  const Hs = (x, z) => {
    const fx = (x + TERR / 2) / CELL, fz = (z + TERR / 2) / CELL;
    if (fx < 0 || fz < 0 || fx >= TSEG || fz >= TSEG) return -1e3;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * HN + i;
    return lerp(lerp(tp.getY(k), tp.getY(k + 1), u), lerp(tp.getY(k + HN), tp.getY(k + HN + 1), u), v);
  };
  function sunVis(x, y, z) {
    let m = 1;
    for (let d = 4; d < 460; d *= 1.16) {
      const hgt = Hs(x + SUN_DIR.x * d, z + SUN_DIR.z * d);
      if (hgt < -900) break;
      m = Math.min(m, (y + SUN_DIR.y * d - hgt) / d);
    }
    return smooth((m + .015) / .07);
  }
  terrGeo.computeVertexNormals();
  const tn = terrGeo.attributes.normal, tcol = [];
  const g1 = new THREE.Color(0x6f8a48), g2 = new THREE.Color(0x587438), g3 = new THREE.Color(0xa39a5a), talus = new THREE.Color(0x9d968a);
  const granite = new THREE.Color(0xe9e3d6), graniteDark = new THREE.Color(0xb3aca0), streak = new THREE.Color(0x857f76), rimForest = new THREE.Color(0x3d553b);
  const tc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), h = tp.getY(i), steep = 1 - tn.getY(i);
    tc.copy(g1).lerp(g2, clamp(noise.noise(x * .08, z * .08) * .5 + .5)).lerp(g3, clamp(noise.noise(x * .02, z * .02) * .6));
    tc.lerp(talus, smooth((h - 1.5) / 4) * smooth((steep - .05) / .2));
    const rock = smooth((steep - .18) / .2) * smooth((h - 3) / 4);
    if (rock > 0) {
      const sv = noise.noise(x * .06 + z * .06, h * .015);                 // vertical water streaks
      const sv2 = noise.noise((x - z) * .09, h * .006);
      const gc = granite.clone().lerp(graniteDark, clamp(noise.noise(x * .02, h * .03) * .5 + .25)).lerp(streak, Math.max(smooth((sv - .25) / .3), smooth((sv2 - .2) / .25)) * .8);
      tc.lerp(gc, rock);
    }
    tc.lerp(rimForest, smooth((h - 32) / 8) * smooth((.22 - steep) / .12));  // forest on the rim
    const vis = sunVis(x, h + .6, z);
    tcol.push(tc.r * lerp(.36, 1, vis), tc.g * lerp(.42, 1, vis), tc.b * lerp(.56, 1, vis));
  }
  terrGeo.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3));
  const groundTex = canvasTex(512, 512, (g, w, h) => {      // fine grain: grass on the flats, streaks on the cliffs
    g.fillStyle = '#e9e9e4'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 26000; k++) { const v = rnd(); g.fillStyle = v < .5 ? `rgba(40,52,30,${.05 + rnd() * .16})` : `rgba(255,255,240,${.05 + rnd() * .14})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 5); }
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(60,60,50,${.03 + rnd() * .05})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 50, 14 + rnd() * 30, rnd() * 3, 0, 7); g.fill(); }
  });
  groundTex.repeat.set(170, 170);
  const terrain = mesh(terrGeo, std(0xffffff, { vertexColors: true, roughness: 1, map: groundTex }), 0, 0, 0, styl, false);
  terrain.receiveShadow = true;
  pickables.push(terrain);

  // Waterfall: a ribbon laid down the north wall, with falling streaks and mist at the foot.
  const fdx = Math.cos(FALLS_ANGLE), fdz = Math.sin(FALLS_ANGLE);
  const fallPts = [];
  for (let r = 125; r < 230; r += .8) { const h = heightAt(fdx * r, fdz * r); if (h < 3) continue; fallPts.push([r, h]); if (h > 40) break; }
  const fallGeo = new THREE.BufferGeometry(), fpos = [], fuv = [], fidx = [];
  const fpx = -fdz, fpz = fdx, FW = 4.4;
  fallPts.forEach(([r, h], i) => {
    const t = i / (fallPts.length - 1), w = FW * (.55 + .45 * t);       // narrower at the top
    for (const s2 of [-1, 1]) { fpos.push(fdx * (r - 1.6) + fpx * w * s2, h + .4, fdz * (r - 1.6) + fpz * w * s2); fuv.push(s2 > 0 ? 1 : 0, t); }
    if (i) { const k = i * 2; fidx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  fallGeo.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3));
  fallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
  fallGeo.setIndex(fidx);
  const fallUniform = { uTime: { value: 0 } };
  const waterfall = noAO(new THREE.Mesh(fallGeo, new THREE.ShaderMaterial({
    uniforms: fallUniform, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec2 vUv; varying float vD; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying float vD;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){ float x = vUv.x * 18.; float col = floor(x); float sp = .35 + h(col) * .35;
        float s = fract(vUv.y * 5. + uTime * sp + h(col * 3.1));
        float streak = smoothstep(.0, .5, s) * (1. - smoothstep(.5, 1., s));
        float edge = smoothstep(0., .25, vUv.x) * smoothstep(1., .75, vUv.x);
        float a = (.35 + .55 * streak) * edge * (.55 + .45 * vUv.y);
        vec3 c = mix(vec3(.86,.9,.93), vec3(1.), streak);
        float fogK = smoothstep(80., 720., vD);
        gl_FragColor = vec4(mix(c, vec3(.79,.77,.74), fogK * .7), a); }`
  })));
  scene.add(waterfall);
  const mistMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xf2f0ec, transparent: true, opacity: .35, depthWrite: false });
  const mist = [0, 1, 2, 3].map(i => {
    const [r, h] = fallPts[0], m = noAO(new THREE.Sprite(mistMat.clone()));
    m.position.set(fdx * (r - 4) + (rnd() - .5) * 5, h + 3 + i * 1.5, fdz * (r - 4) + (rnd() - .5) * 5);
    m.scale.setScalar(10 + i * 3); scene.add(m); return m;
  });

  // One conifer shape (layered boughs) shared by the forest and the trees near the buildings.
  const coniferGeo = (() => {
    const pts = [new THREE.Vector2(0, 2.2)], n = 7;
    for (let k = 0; k < n; k++) { const r = 2.1 * Math.pow(1 - k / n, .85), y = 2.4 + k * 1.3; pts.push(new THREE.Vector2(r, y), new THREE.Vector2(r * .42, y + 1.25)); }
    pts.push(new THREE.Vector2(0, 12.2));
    return new THREE.LatheGeometry(pts, 9);
  })();
  // Valley forest: tall conifers (instanced) on the meadow edges and the talus, smaller ones on the rim.
  {
    const trunkGeo = new THREE.CylinderGeometry(.18, .32, 3, 6); trunkGeo.translate(0, 1.5, 0);
    const crownGeo = coniferGeo;
    const crown2 = new THREE.ConeGeometry(.35, 1.6, 6); crown2.translate(0, 12.4, 0);
    const N = 1500;
    const trunks = new THREE.InstancedMesh(trunkGeo, std(0x6a3f2a, { roughness: .95 }), N);
    const crowns = new THREE.InstancedMesh(crownGeo, std(0xffffff, { roughness: .95 }), N);
    const tops = new THREE.InstancedMesh(crown2, std(0xffffff, { roughness: .95 }), N);
    const cc = new THREE.Color();
    let n = 0, tries = 0;
    while (n < N && tries++ < 40000) {
      const a = rnd() * Math.PI * 2, rim = n > N * .72;
      const r = rim ? 170 + rnd() * 160 : 36 + Math.pow(rnd(), .7) * 116;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) > TERR / 2 - 4 || Math.abs(z) > TERR / 2 - 4) continue;
      const deg = (a * 180 / Math.PI + 360) % 360;
      if (!rim && deg > 25 && deg < 90 && r < 85) continue;          // keep the hero view open
      if (!rim && x > -38 && x < 30 && z > -44 && z < -12) continue;   // lodge grounds
      const y = heightAt(x, z), slope = Math.abs(heightAt(x + 1.5, z) - y) + Math.abs(heightAt(x, z + 1.5) - y);
      if (slope > (rim ? .7 : 1.4) || (rim && y < 36)) continue;
      if (!rim && noise.noise(x * .025, z * .025) < -.15) continue;     // leave meadow clearings
      if (!rim && paved(x, z, 5)) continue;
      const sc = rim ? .45 + rnd() * .35 : .8 + rnd() * .9;
      dummy.position.set(x, y - .2, z); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.set(sc * (.8 + rnd() * .4), sc, sc * (.8 + rnd() * .4)); dummy.updateMatrix();
      trunks.setMatrixAt(n, dummy.matrix); crowns.setMatrixAt(n, dummy.matrix); tops.setMatrixAt(n, dummy.matrix);
      cc.setHSL(.3 + rnd() * .05, .38 + rnd() * .12, .065 + rnd() * .04);
      { const vis = sunVis(x, y + 7 * sc, z); cc.r *= lerp(.4, 1, vis); cc.g *= lerp(.46, 1, vis); cc.b *= lerp(.6, 1, vis); }
      crowns.setColorAt(n, cc); tops.setColorAt(n, cc.offsetHSL(0, 0, .03));
      n++;
    }
    for (const m of [trunks, crowns, tops]) { m.count = n; m.castShadow = true; m.receiveShadow = true; styl.add(m); }
  }

  // Asphalt: road ribbon laid over the terrain, drop-off court, car park with painted stalls.
  const speckle = (g, w, h, n) => { for (let k = 0; k < n; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,255,255' : '0,0,0'},${.03 + rnd() * .07})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } };
  const roadTex = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#47484a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9000);
    g.fillStyle = 'rgba(30,30,32,.25)'; g.fillRect(w * .22, 0, w * .16, h); g.fillRect(w * .62, 0, w * .16, h);   // tyre wear
    g.fillStyle = '#d8b24a'; g.fillRect(w / 2 - 5, 0, 3, h); g.fillRect(w / 2 + 2, 0, 3, h);
    g.fillStyle = '#dcdcd6'; g.fillRect(10, 0, 4, h); g.fillRect(w - 14, 0, 4, h);
  });
  const asphaltTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#47484a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000); });
  const paveMat = (map) => std(0xffffff, { map, roughness: .92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  {
    const pos = [], uv = [], idx = []; let dist = 0;
    roadPts.forEach((pt, i) => {
      const a = roadPts[Math.max(0, i - 1)], b = roadPts[Math.min(roadPts.length - 1, i + 1)];
      const tx = b.x - a.x, tz = b.z - a.z, L = Math.hypot(tx, tz) || 1, nx = -tz / L, nz = tx / L;
      if (i) dist += Math.hypot(pt.x - roadPts[i - 1].x, pt.z - roadPts[i - 1].z);
      const y = heightAt(pt.x, pt.z) + .07;
      for (const sd of [-1, 1]) { pos.push(pt.x + nx * sd * ROAD_W / 2, y, pt.z + nz * sd * ROAD_W / 2); uv.push(sd > 0 ? 1 : 0, dist / 9); }
      if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    pickables.push(mesh(geo, paveMat(roadTex), 0, 0, 0, styl, false));
    const court = mesh(new THREE.CircleGeometry(COURT.r, 48), paveMat(asphaltTex), COURT.x, .09, COURT.z, styl, false); court.rotation.x = -Math.PI / 2;
    asphaltTex.repeat.set(3, 3);
    const lotTex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#47484a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 16000);
      g.fillStyle = '#dcdcd6';
      for (let i = 0; i <= 9; i++) { const x = 6 + i * (w - 12) / 9; g.fillRect(x - 2, 0, 4, h * .27); g.fillRect(x - 2, h * .73, 4, h * .27); }
    }, false);
    const lot = mesh(new THREE.PlaneGeometry(LOT.w, LOT.d), paveMat(lotTex), LOT.x, .09, LOT.z, styl, false); lot.rotation.x = -Math.PI / 2;
    // kerb around the car park
    for (const [w, d, x, z] of [[LOT.w + .4, .2, LOT.x, LOT.z - LOT.d / 2 - .1], [.2, LOT.d, LOT.x + LOT.w / 2 + .1, LOT.z], [.2, LOT.d, LOT.x - LOT.w / 2 - .1, LOT.z]]) box(w, .16, d, std(0xb9b5ab, { roughness: .9 }), x, .1, z, styl);
  }
  const carGlass = std(0x1d2a33, { roughness: .12, metalness: .6 });
  const tyre = std(0x161616, { roughness: .9 });
  function car(x, z, ry, color, van = false) {
    const g = new THREE.Group(); g.position.set(x, heightAt(x, z) + .1, z); g.rotation.y = ry; styl.add(g);
    const paint = std(color, { roughness: .32, metalness: .55 });
    const len = van ? 5.2 : 4.4, hgt = van ? 1.25 : .62;
    rbox(1.82, hgt, len, paint, 0, .34 + hgt / 2, 0, g, .16);
    if (van) { rbox(1.7, .6, len * .78, carGlass, 0, 1.45, -.2, g, .1); rbox(1.84, .16, len * .9, std(0x7d9a86, { roughness: .5 }), 0, .95, 0, g, .02); }
    else { rbox(1.62, .52, len * .52, carGlass, 0, 1.16, -.15, g, .2); rbox(1.5, .06, len * .4, paint, 0, 1.43, -.15, g, .03); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(.33, .33, .24, 16), tyre, sx * .86, .33, sz * len * .32, g); w.rotation.z = Math.PI / 2; }
    for (const sx of [-1, 1]) { mesh(new THREE.SphereGeometry(.09, 8, 6), M.bulb, sx * .62, .72, len / 2 - .02, g, false); }
  }
  { const paints = [0xe8e8e6, 0xb4b8bc, 0x34383c, 0x23354d, 0x6e1f24, 0x8a8f8c, 0xd9d4c8];
    for (const [i, row] of [[0, 1], [1, 1], [3, 1], [4, 1], [6, 1], [7, 1], [1, -1], [2, -1], [5, -1], [8, -1]]) {
      car(LOT.x - LOT.w / 2 + (i + .5) * LOT.w / 9, LOT.z + row * (LOT.d / 2 - 2.7), row > 0 ? Math.PI : 0, pick(paints));
    }
    car(COURT.x - 3.6, COURT.z + 1.4, .5, 0xf1f0ec, true);          // community shuttle at the drop-off
  }

  // Stepping-stone path from the east entrance out toward the viewer, with lamp posts.
  for (let i = 0; i < 18; i++) {
    const t = i / 17, [x, z] = pathPt(t);
    const s = rbox(1.25 + rnd() * .2, .1, .9 + rnd() * .15, M.stone, x, heightAt(x, z) + .03, z, styl, .05);
    s.material = std(0xd9cdb6, { roughness: .9 });
    s.rotation.y = -.35 - t * .4 + (rnd() - .5) * .2;
  }
  const lampLights = [];
  [.18, .45, .72, .98].forEach((t, i) => {
    const [px, pz] = pathPt(t), side = i % 2 ? 1 : -1;
    const x = px + side * .9, z = pz - side * .7, y = heightAt(x, z);
    mesh(new THREE.CylinderGeometry(.05, .07, 2.1, 10), M.metal, x, y + 1.05, z);
    rbox(.24, .32, .24, M.metal, x, y + 2.2, z, styl, .03);
    mesh(new THREE.SphereGeometry(.09, 12, 10), M.bulb, x, y + 2.18, z, styl, false);
    mesh(new THREE.ConeGeometry(.2, .14, 4), M.metal, x, y + 2.43, z).rotation.y = Math.PI / 4;
    if (i < 2) { const l = new THREE.PointLight(0xffc27a, 6, 7, 2); l.position.set(x, y + 2.1, z); scene.add(l); lampLights.push(l); }
  });

  // ---------- Foliage ----------
  const sway = []; // things that move gently in the breeze
  const leafColors = [0x6f8f4e, 0x7fa05a, 0x5d7f45, 0x88a35c, 0xd49a4a, 0xc97b3d, 0xe2b45c];
  const blobGeos = [0, 1, 2].map(() => {                    // lumpy, smooth-shaded foliage masses
    const g = new THREE.IcosahedronGeometry(1, 3), q = g.attributes.position, nrm = g.attributes.normal, o = rnd() * 50, v = V3(0, 0, 0);
    for (let i = 0; i < q.count; i++) {
      v.set(q.getX(i), q.getY(i), q.getZ(i)).normalize();
      nrm.setXYZ(i, v.x, v.y, v.z);
      v.multiplyScalar(1 + noise.noise3d(v.x * 1.8 + o, v.y * 1.8, v.z * 1.8) * .2 + noise.noise3d(v.x * 5 + o, v.y * 5, v.z * 5) * .06);
      q.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  });
  function tree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    g.scale.setScalar(s);
    styl.add(g);
    if (rnd() < .78) {                                   // conifer
      mesh(new THREE.CylinderGeometry(.09, .15, 1.2, 8), M.trunk, 0, .6, 0, g);
      const c = mesh(coniferGeo, std(new THREE.Color().setHSL(.3 + rnd() * .05, .4, .075 + rnd() * .035), { roughness: .95 }), 0, -.35, 0, g);
      c.scale.set(.42, .44, .42); c.rotation.y = rnd() * 6;
    } else {                                            // broadleaf
      mesh(new THREE.CylinderGeometry(.1, .18, 1.9, 8), M.trunk, 0, .95, 0, g);
      const col = new THREE.Color(rnd() < .85 ? pick([0x3f5a2e, 0x4a6634, 0x38522b, 0x556b38]) : 0x9a6a2e);
      for (let k = 0; k < 6; k++) {
        const r = .7 + rnd() * .5, a = k * 1.25;
        const m = mesh(pick(blobGeos), std(col.clone().offsetHSL(0, 0, (rnd() - .5) * .06), { roughness: .95 }), Math.cos(a) * .6 * (k ? 1 : 0), 2.3 + rnd() * .8 + (k ? 0 : .6), Math.sin(a) * .6 * (k ? 1 : 0), g);
        m.scale.set(r, r * .85, r); m.rotation.y = rnd() * 6;
      }
    }
    sway.push({ g, phase: rnd() * 6, amp: .008 + rnd() * .008 });
  }
  for (let i = 0; i < 95; i++) {
    const a = rnd() * Math.PI * 2, r = 13 + rnd() * 50;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const deg = (a * 180 / Math.PI + 360) % 360;
    if (deg > 25 && deg < 85 && r < 34) continue;      // keep the hero view and path clear
    if (x > -38 && x < 30 && z > -44 && z < -9) continue; // lodge grounds
    if (paved(x, z, 3.5) || (x > 6 && z > 14)) continue;   // keep the road and the opening view clear
    tree(x, z, .8 + rnd() * .75);
  }
  for (const [x, z, s] of [[-9.5, 9, 1.1], [-12.5, -6.5, 1.2], [10.5, -6.8, 1.05], [-10.5, .5, .95]]) tree(x, z, s);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, r = 16 + rnd() * 30, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const rk = mesh(new THREE.DodecahedronGeometry(.3 + rnd() * .5, 0), M.rock, x, heightAt(x, z) + .1, z);
    rk.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
  }

  // Grass tufts and flowers (instanced), swaying in the breeze via a tiny shader patch.
  const windUniform = { value: 0 };
  const windPatch = m => {
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = windUniform;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.,0.,0.,1.);\n transformed.x += sin(uTime * 1.7 + wp.x * .7 + wp.z * .4) * .06 * position.y * 4.;');
    };
    return m;
  };
  const okGround = (x, z) => !paved(x, z, 1.2) && !(Math.abs(x) < 7.6 && Math.abs(z) < 6.4) && !(x > -34 && x < 26 && z > -38.5 && z < -12.5) && !(x > .6 && x < 3.8 && z < -4 && z > -20) && !(x > 6 && x < 21 && Math.abs(z - (Math.sin(((x - X1 - 1.6) / 12) * Math.PI * .9) * 3.2 + ((x - X1 - 1.6) / 12) * 6)) < 1.3);
  const tuftGeo = new THREE.ConeGeometry(.05, .26, 3); tuftGeo.translate(0, .13, 0);
  const tufts = new THREE.InstancedMesh(tuftGeo, windPatch(std(0xffffff, { roughness: 1 })), 11000);
  const tcolor = new THREE.Color();
  let ti = 0;
  while (ti < tufts.count) {
    const a = rnd() * Math.PI * 2, r = 6.5 + Math.pow(rnd(), 1.6) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!okGround(x, z)) continue;
    dummy.position.set(x, heightAt(x, z), z);
    dummy.rotation.set((rnd() - .5) * .4, rnd() * 3, (rnd() - .5) * .4);
    dummy.scale.set(.6 + rnd() * .7, .6 + rnd() * 1.1, .6 + rnd() * .7);
    dummy.updateMatrix();
    tufts.setMatrixAt(ti, dummy.matrix);
    tufts.setColorAt(ti, tcolor.setHSL(.21 + rnd() * .07, .4 + rnd() * .15, .24 + rnd() * .1));
    ti++;
  }
  tufts.receiveShadow = true;
  styl.add(tufts);
  const flowerGeo = new THREE.IcosahedronGeometry(.05, 0); flowerGeo.translate(0, .2, 0);
  const flowers = new THREE.InstancedMesh(flowerGeo, windPatch(std(0xffffff, { roughness: .8, flatShading: true })), 1400);
  const petals = [0xf2b8c0, 0xf6d98c, 0xfaf3e6, 0xc9b6e4, 0xf0a07c, 0xe7d0f0];
  const placeFlower = (i, x, z, y) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, rnd() * 3, 0); dummy.scale.setScalar(.7 + rnd() * .7); dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, tcolor.set(pick(petals)));
  };
  let fi = 0;
  for (let b = 0; b < 3; b++) for (let k = 0; k < 60; k++, fi++) { const x = -4.4 + b * 4.4 - 1.25 + rnd() * 2.5, z = ZS + .7 + rnd() * .55; placeFlower(fi, x, z, .25); }
  while (fi < flowers.count) {
    const cx = (rnd() - .5) * 50, cz = (rnd() - .5) * 50, col = pick(petals);
    for (let k = 0; k < 30 && fi < flowers.count; k++) {
      const x = cx + (rnd() - .5) * 1.8, z = cz + (rnd() - .5) * 1.8;
      if (!okGround(x, z) || Math.hypot(x, z) > 40) continue;
      placeFlower(fi++, x, z, heightAt(x, z)); flowers.setColorAt(fi - 1, tcolor.set(rnd() < .8 ? col : pick(petals)));
    }
  }
  styl.add(flowers);

  // Picket fence around the front lawn.
  const fenceGroup = new THREE.Group(); styl.add(fenceGroup);
  const fenceLine = [[-10, 9.5], [6, 9.5]];
  for (let x = fenceLine[0][0]; x <= fenceLine[1][0]; x += .32) {
    rbox(.07, .6, .045, M.fence, x, heightAt(x, 9.5) + .3, 9.5, fenceGroup, .02);
  }
  for (const y of [.2, .47]) rbox(16.2, .05, .035, M.fence, -2, y, 9.47, fenceGroup, .015);
  for (let z = 9.5; z >= -6; z -= .32) rbox(.045, .6, .07, M.fence, -10, heightAt(-10, z) + .3, z, fenceGroup, .02);
  for (const y of [.2, .47]) rbox(.035, .05, 15.7, M.fence, -10.03, y, 1.67, fenceGroup, .015);

  // Clouds drifting by.
  const clouds = [];
  for (let i = 0; i < 0; i++) {   // blob clouds replaced by soft clouds in the sky shader
    const g = new THREE.Group(), a = rnd() * Math.PI * 2, r = 160 + rnd() * 200;
    g.position.set(Math.cos(a) * r, 120 + rnd() * 60, Math.sin(a) * r);
    g.scale.setScalar(2.6);
    for (let k = 0; k < 5; k++) mesh(new THREE.IcosahedronGeometry(2.4 + rnd() * 2.2, 1), M.cloud, (k - 2) * 2.6 + rnd(), rnd() * 1.2, (rnd() - .5) * 2.5, g, false).scale.y = .6;
    noAO(g);
    scene.add(g);
    clouds.push({ g, a, r, speed: .004 + rnd() * .004 });
  }

  // Fireflies at dusk.
  const FF = 140, ffPos = new Float32Array(FF * 3), ffSeed = [];
  for (let i = 0; i < FF; i++) {
    let x, z;
    do { const a = rnd() * Math.PI * 2, r = 7 + rnd() * 22; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (!okGround(x, z));
    ffSeed.push([x, z, .4 + rnd() * 1.6, rnd() * 6, .3 + rnd() * .5]);
  }
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ map: glowTex, color: new THREE.Color(3, 2.5, 1.2), size: .32, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  styl.add(fireflies);

  // ---------- Building ----------
  const bldg = new THREE.Group();
  styl.add(bldg);
  pickables.push(tbox(14, FLOOR, 10.9, M.stone, 0, FLOOR / 2, 0, bldg, 1.2));
  ROOMS.forEach(r => pickables.push(tbox(4.4 - T, .04, 4.2 - T, M.wood, r.x, FLOOR + .02, r.z, bldg, 2.2)));
  pickables.push(tbox(13.2, .04, 2, M.tile, 0, FLOOR + .02, 0, bldg, 1.2));
  rbox(11.5, .012, .9, std(0x8aa58e, { roughness: 1 }), 0, FLOOR + .05, 0, bldg, .005);   // corridor runner

  const walls = new THREE.Group(); // scaled down when the roof lifts (dollhouse cutaway)
  walls.position.y = FLOOR;
  bldg.add(walls);
  const wallMats = side => {   // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const m = [M.plaster, M.plaster, M.cap, M.plaster, M.plaster, M.plaster];
    const idx = { '+x': 0, '-x': 1, '+z': 4, '-z': 5 }[side];
    if (idx !== undefined) m[idx] = M.siding;
    return m;
  };
  function wall(axis, fixed, from, to, holes = [], outside = null) {
    const mats = wallMats(outside);
    const out = outside ? (outside[0] === '+' ? 1 : -1) : 0;
    const seg = (a, b, y0, y1) => {
      const len = b - a, h = y1 - y0, c = (a + b) / 2, y = (y0 + y1) / 2;
      const geo = axis === 'x' ? new THREE.BoxGeometry(len, h, T) : new THREE.BoxGeometry(T, h, len);
      if (axis === 'x') boxUV(geo, len, h, T, a, FLOOR + y0, fixed - T / 2, 1.6); else boxUV(geo, T, h, len, fixed - T / 2, FLOOR + y0, a, 1.6);
      const m = mesh(geo, mats, axis === 'x' ? c : fixed, y, axis === 'x' ? fixed : c, walls);
      pickables.push(m);
      return m;
    };
    const at = (u, y, n, w, h, d, mat, parent = walls, r = .02) => {  // place along the wall: u along, n = normal offset
      return axis === 'x' ? rbox(w, h, d, mat, u, y, fixed + n, parent, r) : rbox(d, h, w, mat, fixed + n, y, u, parent, r);
    };
    let cur = from;
    for (const h of holes.sort((a, b) => a.c - b.c)) {
      const a = h.c - h.w / 2, b = h.c + h.w / 2;
      if (a > cur) seg(cur, a, 0, WALL_H);
      if (h.y0 > 0) {
        seg(a, b, 0, h.y0);
        const gl = axis === 'x' ? box(h.w, h.y1 - h.y0, .04, M.glass, h.c, (h.y0 + h.y1) / 2, fixed, walls) : box(.04, h.y1 - h.y0, h.w, M.glass, fixed, (h.y0 + h.y1) / 2, h.c, walls);
        gl.castShadow = false;
        const ym = (h.y0 + h.y1) / 2, hh = h.y1 - h.y0;
        for (const s of [-1, 1]) {
          at(h.c + s * (h.w / 2 + .03), ym, out * .03, .07, hh + .1, T + .06, M.trim);          // jambs
          if (out) {
            at(h.c + s * (h.w / 2 - .25), ym, -out * (T / 2 + .06), .45, hh + .25, .04, curtains[Math.floor(rnd() * 6)], walls, .015); // curtains
          }
        }
        at(h.c, h.y1 + .04, out * .03, h.w + .16, .08, T + .06, M.trim);                    // head
        at(h.c, ym, out * .02, .05, hh, .06, M.trim);                                       // mullion
        at(h.c, ym + hh * .1, out * .02, h.w, .04, .06, M.trim);                            // transom bar
        at(h.c, h.y0 - .04, out * .07, h.w + .3, .07, T + .16, M.stone);                    // sill
        if (out && axis === 'x' && out > 0) {                                                // window box with flowers
          at(h.c, h.y0 - .2, out * (T / 2 + .14), h.w * .9, .2, .22, M.beam, walls, .03);
          for (let k = 0; k < 7; k++) mesh(new THREE.IcosahedronGeometry(.07, 0), std(pick(petals), { flatShading: true }), h.c - h.w * .4 + k * h.w * .13, h.y0 - .06, fixed + out * (T / 2 + .14), walls, false);
        }
      } else {
        for (const s of [-1, 1]) at(h.c + s * (h.w / 2 + .03), h.y1 / 2, 0, .07, h.y1, T + .05, M.trim);
        at(h.c, h.y1 + .04, 0, h.w + .16, .08, T + .05, M.trim);
      }
      seg(a, b, h.y1, WALL_H);
      cur = b;
    }
    if (to > cur) seg(cur, to, 0, WALL_H);
  }
  const win = (c, w = 1.7) => ({ c, w, y0: .8, y1: 2 });
  const door = (c, w = .95) => ({ c, w, y0: 0, y1: 2.1 });
  wall('x', ZS, X0 - T / 2, X1 + T / 2, ROOMS.filter(r => r.z > 0).map(r => win(r.x)), '+z');
  wall('x', ZN, X0 - T / 2, X1 + T / 2, ROOMS.filter(r => r.z < 0).map(r => win(r.x)), '-z');
  wall('z', X0, ZN, ZS, [win(3.1, 1.4), win(-3.1, 1.4)], '-x');
  wall('z', X1, ZN, ZS, [win(3.1, 1.4), win(-3.1, 1.4), door(0, 1.4)], '+x');
  wall('x', CN, X0, X1, ROOMS.filter(r => r.z < 0).map(r => door(r.x)));
  wall('x', CS, X0, X1, ROOMS.filter(r => r.z > 0).map(r => door(r.x)));
  for (const x of [-2.2, 2.2]) { wall('z', x, ZN, CN); wall('z', x, CS, ZS); }
  for (const [x, z] of [[X0, ZN], [X0, ZS], [X1, ZN], [X1, ZS]]) tbox(.62, WALL_H + .1, .62, M.stone, x, (WALL_H + .1) / 2, z, walls, 1.2);
  // stone skirt
  for (const [w, d, x, z] of [[13.5, .3, 0, ZS + .05], [13.5, .3, 0, ZN - .05], [.3, 10.6, X0 - .05, 0], [.3, 10.6, X1 + .05, 0]]) tbox(w, .8, d, M.stone, x, .4, z, walls, 1.2);

  // Porch with door, lanterns and planters.
  tbox(2.3, .14, 3.1, M.deck, X1 + 1.15, FLOOR - .07, 0, bldg, 2);
  rbox(1.95, .12, 2.9, M.roof, X1 + .98, FLOOR + 2.34, 0, bldg, .03);
  rbox(.2, .2, 2.75, M.beam, X1 + 1.75, FLOOR + 2.2, 0, bldg, .03);
  for (const z of [-1.25, 1.25]) {
    rbox(.17, 2.3, .17, M.trim, X1 + 1.75, FLOOR + 1.1, z, bldg, .03);
    rbox(.36, .32, .36, M.beam, X1 + 1.75, FLOOR + .15, z * .82 + (z > 0 ? -.55 : .55), bldg, .06);
    mesh(new THREE.IcosahedronGeometry(.24, 1), std(0x6f8f4e, { flatShading: true }), X1 + 1.75, FLOOR + .45, z * .82 + (z > 0 ? -.55 : .55), bldg);
  }
  rbox(.06, 2.05, 1.18, M.door, X1 + .05, FLOOR + 1.03, 0, bldg, .02);
  rbox(.08, .42, .86, M.glass, X1 + .07, FLOOR + 1.55, 0, bldg, .02).castShadow = false;
  mesh(new THREE.SphereGeometry(.04, 10, 8), M.brass, X1 + .1, FLOOR + 1, .42, bldg);
  rbox(.7, .02, 1.1, std(0x8a6a4c, { roughness: 1 }), X1 + .55, FLOOR + .01, 0, bldg, .01);
  const lanternLights = [];
  for (const z of [-.95, .95]) {
    rbox(.16, .26, .16, M.metal, X1 + .14, FLOOR + 1.65, z, bldg, .02);
    mesh(new THREE.SphereGeometry(.06, 10, 8), M.bulb, X1 + .2, FLOOR + 1.63, z, bldg, false);
  }
  { const l = new THREE.PointLight(0xffc27a, 5, 5, 2); l.position.set(X1 + .6, FLOOR + 1.8, 0); scene.add(l); lanternLights.push(l); }
  // bench and mailbox
  rbox(1.3, .06, .4, M.beam, X1 + 2.6, .48, 3.2, styl, .02);
  rbox(1.3, .35, .05, M.beam, X1 + 2.6, .72, 3.38, styl, .02);
  for (const dx of [-.55, .55]) rbox(.06, .45, .38, M.metal, X1 + 2.6 + dx, .23, 3.2, styl, .01);
  { const [mx, mz] = pathPt(1); const y = heightAt(mx + 1.2, mz - .4);
    mesh(new THREE.CylinderGeometry(.05, .05, 1, 8), M.beam, mx + 1.2, y + .5, mz - .4);
    rbox(.24, .26, .46, std(0x6f8a74, { roughness: .5 }), mx + 1.2, y + 1.1, mz - .4, styl, .09); }

  // Roof: shingles, ridge cap, fascia, gutters, downspouts, chimney with smoke.
  const roofMat = std(0xffffff, { map: TX.shingles, roughness: .9, transparent: true });
  const capMat = std(0xffffff, { map: TX.siding.clone(), transparent: true });
  capMat.map.repeat.set(1 / 1.6, 1 / 1.6);
  const roofTrim = std(0x4b3326, { roughness: .7, transparent: true });
  const roofStone = std(0xffffff, { map: TX.stone, transparent: true });
  const roofMetal = std(0x3d3a35, { metalness: .4, roughness: .5, transparent: true });
  const roofMats = [roofMat, capMat, roofTrim, roofStone, roofMetal];
  const roof = new THREE.Group();
  roof.position.y = FLOOR + WALL_H;
  bldg.add(roof);
  const shape = new THREE.Shape([new THREE.Vector2(-5.5, 0), new THREE.Vector2(5.5, 0), new THREE.Vector2(0, 2.2)]);
  const prismGeo = new THREE.ExtrudeGeometry(shape, { depth: 13.4, bevelEnabled: false });
  prismGeo.translate(0, 0, -6.7);
  prismGeo.rotateY(Math.PI / 2);
  pickables.push(mesh(prismGeo, [capMat, roofTrim], 0, 0, 0, roof));
  const slope = Math.atan2(2.2, 5.5);
  for (const s of [1, -1]) {
    const geo = new THREE.BoxGeometry(14.2, .16, 6.55);
    boxUV(geo, 14.2, .16, 6.55, -7.1, 0, -3.275, 1.4);
    const panel = mesh(geo, [roofTrim, roofTrim, roofMat, roofTrim, roofTrim, roofTrim], 0, 1.2, s * 3, roof);
    panel.rotation.x = s * slope;
    pickables.push(panel);
    rbox(14.3, .22, .06, roofTrim, 0, -.08, s * 6.08, roof, .02);
    const gutter = mesh(new THREE.CylinderGeometry(.07, .07, 14.3, 12), roofMetal, 0, -.16, s * 6.16, roof);
    gutter.rotation.z = Math.PI / 2;
    for (const x of [-7.05, 7.05]) mesh(new THREE.CylinderGeometry(.045, .045, WALL_H + .1, 8), roofMetal, x, -WALL_H / 2 - .1, s * 6.1, roof);
  }
  const ridge = mesh(new THREE.CylinderGeometry(.13, .13, 14.4, 12), roofMat, 0, 2.27, 0, roof);
  ridge.rotation.z = Math.PI / 2;
  for (const x of [-6.75, 6.75]) {           // round gable vents
    const v = mesh(new THREE.CylinderGeometry(.28, .28, .06, 20), roofTrim, x, 1.05, 0, roof);
    v.rotation.z = Math.PI / 2;
    const v2 = mesh(new THREE.CylinderGeometry(.2, .2, .07, 20), std(0x4a3d34, { transparent: true }), x, 1.05, 0, roof);
    v2.rotation.z = Math.PI / 2;
    roofMats.push(v2.material);
  }
  tbox(1.1, 2.4, 1.1, roofStone, 3, 1.75, -1.5, roof, 1.2);
  rbox(1.3, .16, 1.3, roofTrim, 3, 2.98, -1.5, roof, .03);
  const smokeMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xd9d2cc, transparent: true, opacity: .5, depthWrite: false, fog: true });
  const smoke = Array.from({ length: 7 }, (_, i) => { const s = noAO(new THREE.Sprite(smokeMat.clone())); s.userData.phase = i / 7; roof.add(s); return s; });

  // ---------- The main lodge: granite base, timber-brown walls, a stepped central tower ----------
  const facadeTex = (emissive) => canvasTex(512, 512, (g, w, h) => {   // 6 m x 6 m: 2 floors x 2 window bays
    if (!emissive) {
      let x = 0;
      while (x < w) {
        const bw = 26 + Math.floor(rnd() * 14), col = pick(['#6f4631', '#7a4f37', '#684230', '#81563b']);
        g.fillStyle = col; g.fillRect(x, 0, bw, h); g.fillStyle = 'rgba(30,16,8,.7)'; g.fillRect(x, 0, 2, h); x += bw;
      }
    } else { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
    const lit = [1, .2, .75, 0];
    for (let fy = 0; fy < 2; fy++) for (let fx = 0; fx < 2; fx++) {
      const x0 = fx * 256 + 75, y0 = fy * 256 + 50, ww = 106, hh = 140, k = lit[fy * 2 + fx];
      if (!emissive) {
        g.fillStyle = '#2d2019'; g.fillRect(x0 - 10, y0 - 10, ww + 20, hh + 20);            // deep timber frame
        g.fillStyle = '#5d4a3a'; g.fillRect(x0, y0, ww, hh);
        g.fillStyle = '#2d2019'; g.fillRect(x0 + ww / 2 - 3, y0, 6, hh); for (const t of [1 / 3, 2 / 3]) g.fillRect(x0, y0 + hh * t - 2, ww, 4);
        // painted band above each window, in the lodge's red, ochre and black geometric motif
        for (let i = 0; i < 9; i++) { g.fillStyle = ['#9c3b28', '#d39a3e', '#1f1915'][i % 3]; g.beginPath(); const bx = x0 - 8 + i * 14; g.moveTo(bx, y0 - 14); g.lineTo(bx + 7, y0 - 26); g.lineTo(bx + 14, y0 - 14); g.fill(); }
        g.fillStyle = '#3a2a20'; g.fillRect(x0 - 16, y0 + hh + 8, ww + 32, 10);           // sill
      } else {
        const c = Math.round(255 * k);
        g.fillStyle = `rgb(${c},${Math.round(c * .78)},${Math.round(c * .45)})`; g.fillRect(x0, y0, ww, hh);
        g.fillStyle = '#000'; g.fillRect(x0 + ww / 2 - 3, y0, 6, hh); for (const t of [1 / 3, 2 / 3]) g.fillRect(x0, y0 + hh * t - 2, ww, 4);
      }
    }
  });
  const facadeMap = facadeTex(false), facadeGlow = facadeTex(true);
  const facade = std(0xffffff, { map: facadeMap, emissive: 0xffc27a, emissiveMap: facadeGlow, emissiveIntensity: .85, roughness: .85 });
  const roofTop = std(0x4a463f, { roughness: 1 });
  const lodge = new THREE.Group();
  styl.add(lodge);
  const LZ = -26;
  tbox(58, .6, 24, M.stone, -4, .3, LZ, lodge, 2.4);                                   // granite podium
  function block(x, z, w, d, y, h, beamEnds = true) {
    const base = y < 1 ? 1.8 : 0;
    if (base) pickables.push(tbox(w + .5, base, d + .5, M.stone, x, y + base / 2, z, lodge, 1.4));
    const m = tbox(w, h, d, facade, x, y + base + h / 2, z, lodge, 6, 0, -(y + base), 0);
    pickables.push(m);
    const top = y + base + h;
    rbox(w + .7, .55, d + .7, M.trim, x, top + .27, z, lodge, .05);                    // heavy timber parapet
    box(w + .2, .1, d + .2, roofTop, x, top + .6, z, lodge);
    if (beamEnds) for (let u = -w / 2 + .9; u <= w / 2 - .5; u += 1.6) {                // protruding beam ends
      rbox(.24, .24, .7, M.beam, x + u, top - .25, z + d / 2 + .2, lodge, .03);
    }
    return top;
  }
  // Pitched shingle roofs with deep eaves, like a mountain-lodge senior living community.
  const lodgeRoof = std(0xffffff, { map: TX.shingles, roughness: .92 });
  const gableTex = TX.siding.clone(); gableTex.repeat.set(.4, .4); gableTex.needsUpdate = true;
  const gableWall = std(0xffffff, { map: gableTex });
  function gable(x, z, len, span, y, rise, rotY = 0, over = .8, parent = lodge) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
    const tri = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
    const geo = new THREE.ExtrudeGeometry(tri, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); geo.rotateY(Math.PI / 2);
    mesh(geo, gableWall, 0, 0, 0, g);
    const half = span / 2 + over, k = rise / (span / 2), L = half * Math.hypot(1, k), slope = Math.atan(k);
    for (const sd of [1, -1]) {
      const pg = new THREE.BoxGeometry(len + over * 2, .2, L); boxUV(pg, len + over * 2, .2, L, 0, 0, 0, 1.4);
      const panel = mesh(pg, [M.trim, M.trim, lodgeRoof, M.trim, M.trim, M.trim], 0, rise - half * k / 2 + .13, sd * half / 2, g);
      panel.rotation.x = sd * slope;
      pickables.push(panel);
    }
    const ridge = mesh(new THREE.CylinderGeometry(.13, .13, len + over * 2, 8), M.trim, 0, rise + .22, 0, g); ridge.rotation.z = Math.PI / 2;
    return g;
  }
  const glow = std(0xffdcaa, { emissive: 0xffb469, emissiveIntensity: 1.1, roughness: .25 });
  for (const wx of [-20.5, 12.5]) {                    // residential wings
    const top = block(wx, LZ, 19, 10, .6, 6);
    gable(wx, LZ, 19, 10, top + .5, 3);
    for (const dx of [-6, 0, 6]) {                     // dormers on the front slope
      rbox(1.9, 1.5, 1.9, gableWall, wx + dx, top + 2.15, LZ + 3.3, lodge, .03);
      rbox(1.1, .9, .08, glow, wx + dx, top + 2.2, LZ + 4.27, lodge, .02).castShadow = false;
      gable(wx + dx, LZ + 3.2, 2.5, 2.3, top + 2.9, .9, Math.PI / 2, .3);
    }
  }
  const t1 = block(-4, LZ, 14, 13, .6, 8);             // central hall with a great-room gable facing the drive
  gable(-4, LZ, 13, 14, t1 + .5, 4.2, Math.PI / 2, 1);
  rbox(4.6, 2, .1, glow, -4, t1 + 1.75, LZ + 6.56, lodge, .02).castShadow = false;
  for (const dx of [-1.15, 0, 1.15]) rbox(.12, 2.1, .16, M.trim, -4 + dx, t1 + 1.75, LZ + 6.6, lodge, .02);
  rbox(4.9, .14, .18, M.trim, -4, t1 + 1.75, LZ + 6.6, lodge, .02);
  for (const [x, z, h] of [[-30.6, LZ + 1, 12.6], [22.6, LZ - 1, 12.6], [1.2, LZ - 3, t1 + 5.4], [-9.6, LZ + 2, t1 + 4.2]]) {  // granite chimneys
    tbox(1.8, h, 1.8, M.stone, x, h / 2 + .6, z, lodge, 1.4);
    rbox(2.1, .2, 2.1, M.trim, x, h + .7, z, lodge, .03);
  }
  // Porte-cochère (covered entrance) on granite piers.
  for (const [dx, dz] of [[-3, 0], [3, 0], [-3, 3.6], [3, 3.6]]) tbox(1, 3.8, 1, M.stone, -5.5 + dx, 2.5, LZ + 8.6 + dz, lodge, 1.2);
  rbox(8, .5, 5.4, M.trim, -5.5, 4.65, LZ + 10.4, lodge, .05);
  gable(-5.5, LZ + 10.4, 5.4, 8, 4.9, 1.5, Math.PI / 2, .5);
  rbox(2.2, 2.6, .12, M.door, -5.5, 1.9, LZ + 7.05, lodge, .03);
  for (const dx of [-1.4, 1.4]) mesh(new THREE.SphereGeometry(.16, 12, 10), M.bulb, -5.5 + dx, 4.2, LZ + 9.5, lodge, false);   // lanterns (emissive only)
  // Breezeway from the care wing to the lodge: granite footings, timber posts, a low roof.
  for (let z = ZN - .6; z > LZ + 5.5; z -= 2.2) for (const dx of [-1.2, 1.2]) {
    tbox(.42, .5, .42, M.stone, 2.2 + dx, .25, z, styl, 1.2);
    rbox(.2, 2.3, .2, M.beam, 2.2 + dx, 1.6, z, styl, .03);
  }
  { const len = (ZN - .6) - (LZ + 5.5) + .6, zc = ((ZN - .6) + (LZ + 5.5)) / 2;
    rbox(3.1, .22, len, M.trim, 2.2, 2.85, zc, styl, .04); box(2.9, .08, len, roofTop, 2.2, 3, zc, styl);
    tbox(2.2, .06, len, M.stone, 2.2, .04, zc, styl, 1.2); }
  // Garden terrace between the buildings: umbrella tables, raised beds, a wheelchair, benches.
  const umbrella = std(0xd9c9a3, { roughness: .9, side: THREE.DoubleSide });
  for (const [x, z] of [[-6.5, -10.5], [-11, -12.5], [8, -11.5]]) {
    mesh(new THREE.CylinderGeometry(.55, .55, .05, 20), M.beam, x, .75, z);
    mesh(new THREE.CylinderGeometry(.05, .05, .75, 8), M.metal, x, .38, z);
    mesh(new THREE.CylinderGeometry(.03, .03, 2.2, 6), M.metal, x, 1.4, z);
    mesh(new THREE.ConeGeometry(1.4, .5, 10, 1, true), umbrella, x, 2.45, z);
    for (let k = 0; k < 3; k++) { const a = k * 2.1; rbox(.42, .45, .42, M.beam, x + Math.cos(a) * .95, .23, z + Math.sin(a) * .95, styl, .05); }
  }
  for (const [x, z] of [[-14, -8.5], [-17.5, -8.5], [12.5, -9], [16, -9]]) {
    tbox(2.6, .6, 1.2, M.stone, x, .3, z, styl, 1.2);
    for (let k = 0; k < 6; k++) mesh(new THREE.IcosahedronGeometry(.2 + rnd() * .12, 1), std(pick([0x6f8f4e, 0x7fa05a, 0x88a35c]), { flatShading: true }), x - 1 + k * .4, .72, z + (rnd() - .5) * .5);
    for (let k = 0; k < 10; k++) mesh(new THREE.IcosahedronGeometry(.07, 0), std(pick(petals), { flatShading: true }), x - 1.1 + rnd() * 2.2, .9, z + (rnd() - .5) * .8, styl, false);
  }
  function wheelchair(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, heightAt(x, z), z); g.rotation.y = ry; styl.add(g);
    for (const s2 of [-1, 1]) { const w = mesh(new THREE.TorusGeometry(.3, .03, 8, 24), M.metal, s2 * .3, .3, 0, g); w.rotation.y = Math.PI / 2; }
    rbox(.5, .06, .45, fabrics[2], 0, .5, 0, g, .02); rbox(.5, .45, .05, fabrics[2], 0, .75, -.22, g, .02);
    for (const s2 of [-1, 1]) mesh(new THREE.CylinderGeometry(.015, .015, .5, 6), M.metal, s2 * .26, .75, -.25, g);
  }
  wheelchair(-9.2, -11, .6);
  // Sign at the path.
  { const sg = new THREE.Group(); sg.position.set(13.2, heightAt(13.2, 1.6), 1.6); sg.rotation.y = Math.PI / 4; styl.add(sg);
    const signTex = canvasTex(512, 160, (g, w, h) => {
      g.fillStyle = '#4b3326'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d39a3e'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24);
      g.fillStyle = '#f3e9d6'; g.textAlign = 'center'; g.font = '600 46px Georgia, serif'; g.fillText('The Lodge', w / 2, 74);
      g.font = '500 24px Georgia, serif'; g.fillText('ASSISTED LIVING  ·  MEMORY CARE', w / 2, 118);
    }, false);
    for (const dx of [-1.05, 1.05]) tbox(.22, 1.5, .22, M.stone, dx, .75, 0, sg, 1.2);
    mesh(new THREE.BoxGeometry(2.3, .72, .1), [M.trim, M.trim, M.trim, M.trim, std(0xffffff, { map: signTex }), M.trim], 0, 1.15, 0, sg); }

  // ---------- Furniture ----------
  function furnish(r, i) {
    const g = new THREE.Group();
    const s = r.z > 0 ? 1 : -1; // +1: window faces south (+z)
    g.position.set(r.x, FLOOR + .04, r.z);
    bldg.add(g);
    rbox(1.3, .32, 2.05, M.frame, -1.2, .16, .05 * s, g, .05);
    rbox(1.18, .18, 1.9, M.linen, -1.2, .4, .08 * s, g, .07);
    rbox(1.24, .1, 1.3, blankets[i], -1.2, .5, .36 * s, g, .05);
    rbox(1.24, .11, .22, std(new THREE.Color(blankets[i].color).offsetHSL(0, 0, .08)), -1.2, .5, -.38 * s, g, .05);  // folded edge
    for (const dx of [-.27, .27]) rbox(.48, .14, .34, M.linen, -1.2 + dx, .54, -.72 * s, g, .07);
    rbox(1.32, .95, .08, M.frame, -1.2, .48, -1.04 * s, g, .04);
    rbox(.46, .5, .42, M.frame, -.27, .25, -1.1 * s, g, .04);
    box(.36, .015, .01, M.brass, -.27, .32, -.88 * s, g);
    mesh(new THREE.CylinderGeometry(.045, .07, .26, 12), M.brass, -.27, .63, -1.1 * s, g);
    mesh(new THREE.CylinderGeometry(.11, .17, .2, 20, 1, true), M.lampGlow, -.27, .83, -1.1 * s, g, false);
    const rug = mesh(new THREE.CylinderGeometry(.9, .9, .015, 40), rugs[i], .55, .01, .3 * s, g, false);
    rug.scale.z = .75;
    // armchair
    const chair = new THREE.Group(); chair.position.set(1.25, 0, 1.25 * s); chair.rotation.y = s > 0 ? Math.PI + .5 : .5; g.add(chair);
    rbox(.74, .3, .7, fabrics[i], 0, .24, 0, chair, .08);
    rbox(.74, .55, .18, fabrics[i], 0, .56, -.27, chair, .08);
    for (const dx of [-.33, .33]) rbox(.14, .38, .66, fabrics[i], dx, .4, 0, chair, .06);
    // plant
    mesh(new THREE.CylinderGeometry(.17, .13, .32, 14), std(0xc27b5a), 1.6, .16, -1.4 * s, g);
    for (let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(.17 + rnd() * .08, 1), std(0x6f8f4e, { flatShading: true }), 1.6 + (rnd() - .5) * .2, .45 + k * .09, -1.4 * s + (rnd() - .5) * .2, g);
    // wardrobe and wall art
    rbox(.9, 1.7, .5, std(0xd8c3a3, { roughness: .7 }), 1.45, .85, -1.75 * s + (s > 0 ? 0 : 0), g, .04).position.z = -1.72 * s;
    rbox(.5, .38, .03, std(pick([0x9db0c8, 0xd39d8f, 0xb4bf93, 0xd9b98f])), -1.2, 1.45, -1.06 * s, g, .01);
    if (r.n !== 104) { const l = new THREE.PointLight(0xffc98a, 3, 4.5, 2); l.position.set(r.x, FLOOR + 1.9, r.z); scene.add(l); }
  }
  ROOMS.forEach(furnish);

  // Warm lamp light in room 104.
  const lamp = new THREE.PointLight(0xffc98a, 7, 7, 2);
  lamp.position.set(ROOM_104.x - .25, FLOOR + 1.1, ROOM_104.z - 1.1);
  scene.add(lamp);

  // Highlight outline around room 104.
  const outlineMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false });
  const outline = noAO(new THREE.Group());
  outline.position.set(ROOM_104.x, FLOOR + .07, ROOM_104.z);
  scene.add(outline);
  for (const [w, d, x, z] of [[4, .07, 0, -1.9], [4, .07, 0, 1.9], [.07, 3.8, -2, 0], [.07, 3.8, 2, 0]]) {
    noAO(mesh(new THREE.BoxGeometry(w, .03, d), outlineMat, x, 0, z, outline, false)).receiveShadow = false;
  }

  // ---------- Sensors, the building's router, Wi-Fi waves and signal particles ----------
  const ledMat = new THREE.MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(2.2) });
  const haloMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: .32, depthWrite: false });
  const caseMat = std(0xefe6d6, { roughness: .55 });           // same warm ivory as the walls
  const nodes = NODES.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(p);
    g.rotation.y = NODE_FACING[i];
    scene.add(g);
    rbox(.13, .1, .05, caseMat, 0, 0, 0, g, .016);                       // plug-in sensor, about the size of a phone charger
    rbox(.06, .03, .01, std(0xd9cdb8, { roughness: .6 }), 0, -.06, -.012, g, .004); // outlet plate edge
    mesh(new THREE.SphereGeometry(.009, 8, 6), ledMat, .03, .022, .024, g, false);
    const halo = noAO(mesh(new THREE.SphereGeometry(.09, 14, 10), haloMat, 0, 0, .03, g, false));
    g.userData = { halo, flash: -10 };
    g.scale.setScalar(0);
    return g;
  });
  // The existing building router: a slim wall-mounted unit with two antennas.
  const router = new THREE.Group();
  router.position.copy(ROUTER);
  scene.add(router);
  rbox(.34, .2, .05, std(0xf4efe6, { roughness: .45 }), 0, 0, 0, router, .02);
  for (const dx of [-.12, .12]) { const ant = mesh(new THREE.CapsuleGeometry(.012, .16, 3, 6), std(0xe9e2d4, { roughness: .5 }), dx, .17, 0, router); ant.rotation.z = dx > 0 ? -.15 : .15; }
  for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(.008, 6, 5), ledMat, -.06 + k * .03, -.06, .028, router, false);
  const routerHalo = noAO(mesh(new THREE.SphereGeometry(.18, 16, 12), haloMat, 0, 0, .04, router, false));

  const ringGeo = new THREE.RingGeometry(.96, 1, 72);
  const waves = [];
  const addWave = (p, phase, big) => {
    const w = noAO(mesh(ringGeo, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), p.x, FLOOR + .07, p.z, scene, false));
    w.rotation.x = -Math.PI / 2;
    w.receiveShadow = false;
    w.userData = { phase, big };
    waves.push(w);
  };
  for (let k = 0; k < 4; k++) addWave(ROUTER, k / 4, true);          // the router broadcasting through the wing
  for (let k = 0; k < 2; k++) addWave(NODES[I104], k / 2 + .2, false);

  const LINKS = NODES.map((_, i) => i), PER = 22;
  const particleMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false });
  const particles = noAO(new THREE.InstancedMesh(new THREE.SphereGeometry(.026, 8, 6), particleMat, LINKS.length * PER));
  particles.frustumCulled = false;
  scene.add(particles);

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
  const haloRing = noAO(mesh(new THREE.RingGeometry(.55, .68, 48), new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), 0, FLOOR + .06, 0, scene, false));
  haloRing.rotation.x = -Math.PI / 2;
  const walkPath = new THREE.CatmullRomCurve3([V3(-4.75, 0, 2.45), V3(-4.5, 0, 2.85), V3(-4.6, 0, 3.2), V3(-4.6, 0, 3.55)]);

  // ---------- Caregiver (faceless figure in scrubs) at the nurse station ----------
  const scrubs = std(0x4f8597, { roughness: .8 });
  const carer = new THREE.Group(), cBody = new THREE.Group();
  carer.add(cBody); scene.add(carer);
  mesh(new THREE.CapsuleGeometry(.17, .34, 6, 14), scrubs, 0, 1.08, 0, cBody);
  mesh(new THREE.SphereGeometry(.115, 18, 14), M.skin, 0, 1.53, 0, cBody);
  const cLimb = (r, len, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); cBody.add(pv); mesh(new THREE.CapsuleGeometry(r, len, 4, 10), scrubs, 0, -(len / 2 + r), 0, pv); return pv; };
  const cLegL = cLimb(.068, .6, -.09, .78), cLegR = cLimb(.068, .6, .09, .78);
  const cArmL = cLimb(.05, .42, -.24, 1.32), cArmR = cLimb(.05, .42, .24, 1.32);
  const phone = mesh(new THREE.BoxGeometry(.07, .12, .015), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.1, .8) }), 0, -.5, .06, cArmR, false);
  const phoneGlow = noAO(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: CORAL, transparent: true, opacity: 0, depthWrite: false })));
  phoneGlow.scale.setScalar(.6); phone.add(phoneGlow);
  const carerPath = new THREE.CatmullRomCurve3([V3(5, 0, .25), V3(2.6, 0, .1), V3(-1, 0, 0), V3(-3.7, 0, .05), V3(-4.35, 0, .55), V3(-4.35, 0, 1.35), V3(-4.1, 0, 2.15), V3(-3.65, 0, 2.8)]);
  // Nurse station at the east end of the corridor.
  rbox(1.3, .95, .5, std(0x8a6a4c, { roughness: .6 }), 5.2, FLOOR + .5, -.6, bldg, .04);
  rbox(1.4, .05, .6, M.trim, 5.2, FLOOR + .99, -.6, bldg, .02);
  rbox(.34, .24, .03, std(0x2b2f2c, { emissive: 0x6fb7c9, emissiveIntensity: .6 }), 5.0, FLOOR + 1.16, -.68, bldg, .01);
  rbox(.5, .8, .4, std(0xb9c3c6, { metalness: .2, roughness: .5 }), 6.1, FLOOR + .42, .55, bldg, .04);   // medicine cart

  // ---------- Cursor ripples in the world ----------
  const pings = Array.from({ length: 14 }, () => {
    const m = noAO(mesh(new THREE.RingGeometry(.86, 1, 48), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), 0, -10, 0, scene, false));
    m.receiveShadow = false;
    m.userData.born = -10;
    return m;
  });
  let pingIndex = 0, clock = 0;
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const visible = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

  // ---------- Post-processing: AO, tilt-shift, bloom, vignette, AgX ----------
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(DPR);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: .6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
  gtao.blendIntensity = .9;
  const baseOverride = gtao.overrideVisibility.bind(gtao);
  gtao.overrideVisibility = () => { baseOverride(); scene.traverse(o => { if (o.userData.noAO) o.visible = false; }); };
  composer.addPass(gtao);
  const bokeh = new BokehPass(scene, camera, { focus: 25, aperture: .00012, maxblur: .0065 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .3, .5, .92);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.2126,.7152,.0722)); c.rgb = max(mix(vec3(l), c.rgb, 1.07), 0.); c.rgb = pow(c.rgb, vec3(1.06)) * 1.04; vec2 d = vUv - .5; float v = smoothstep(.85, .25, length(d * vec2(1.1, 1.)));
        c.rgb *= mix(.86, 1., v); c.rgb += (hash(vUv * 900. + uTime) - .5) * .018; gl_FragColor = c; }`
  }));
  const grainPass = composer.passes[composer.passes.length - 1];
  composer.addPass(new OutputPass());
  let frameTimes = [], quality = 2;
  window.__haven = { scene, camera, renderer, composer, gtao, bokeh };   // handy for debugging in the console   // drop AO, then depth of field, if the machine struggles

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
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? 50 : 36;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const projected = V3(0, 0, 0);
  const labelRooms = labelEls.map(el => el.dataset.sensor ? { sensor: true, x: NODES[I104].x, z: NODES[I104].z + .05 } : el.dataset.router ? { router: true, x: ROUTER.x, z: ROUTER.z } : ROOMS.find(r => String(r.n) === el.dataset.room));
  let lastT = 0, shadowP = -1;

  function render(p, t) {
    const dt = lastT ? t - lastT : .016;
    lastT = t;
    clock = t;
    const motion = reduced.matches ? 0 : 1;
    const lift = between(p, .1, .22);
    const fade = 1 - between(p, .12, .21);
    roof.position.y = FLOOR + WALL_H + lift * lift * 6;
    roofMats.forEach(m => { m.opacity = fade; m.depthWrite = fade > .95; });
    roof.visible = fade > .01;
    walls.scale.y = 1 - .5 * lift;

    // Ambient life: breeze, clouds, fireflies, chimney smoke.
    windUniform.value = t * motion;
    fallUniform.uTime.value = t * motion;
    sky.material.uniforms.uTime.value = t * motion;
    mist.forEach((m, i) => { m.material.opacity = .22 + Math.sin(t * .6 + i) * .08 * motion; });
    sway.forEach(s => { s.g.rotation.z = Math.sin(t * .9 + s.phase) * s.amp * motion; s.g.rotation.x = Math.cos(t * .7 + s.phase) * s.amp * .6 * motion; });
    clouds.forEach(c => { c.a += c.speed * dt * motion; c.g.position.x = Math.cos(c.a) * c.r; c.g.position.z = Math.sin(c.a) * c.r; });
    ffSeed.forEach(([x, z, y, ph, sp], i) => {
      ffPos[i * 3] = x + Math.sin(t * sp + ph) * .8 * motion;
      ffPos[i * 3 + 1] = heightAt(x, z) + y + Math.sin(t * sp * 1.7 + ph * 2) * .25 * motion;
      ffPos[i * 3 + 2] = z + Math.cos(t * sp * .8 + ph) * .8 * motion;
    });
    ffGeo.attributes.position.needsUpdate = true;
    fireflies.material.opacity = .55 + Math.sin(t * 2.3) * .15 * motion;
    smoke.forEach(s => {
      const k = motion ? (t * .12 + s.userData.phase) % 1 : s.userData.phase;
      s.position.set(3 + Math.sin(k * 5) * .25 + k * .9, 3.2 + k * 3.2, -1.5 - k * .5);
      s.scale.setScalar(.45 + k * 1.6);
      s.material.opacity = (1 - k) * .45 * fade;
    });

    // Story state
    const walk = clamp((p - .47) / .13);
    const fall = between(p, .6, .655);
    const still = p > .655;
    const alert = between(p, .66, .7) * (1 - between(p, .93, .97));
    const sensing = between(p, .3, .36) * (1 - between(p, .93, .98));

    const sensorShot = between(p, .725, .755) * (1 - between(p, .785, .81));   // camera close on the Room 104 sensor
    nodes.forEach((g, i) => {
      const s = between(p, .25 + i * .012, .29 + i * .012);
      g.scale.setScalar(s * (1 + Math.sin(s * Math.PI) * .35));
      const flash = Math.max(0, 1 - (t - g.userData.flash) / .6);
      const hero = i === I104 ? sensorShot : 0;
      g.userData.halo.scale.setScalar((1 + flash * 1.6 + Math.sin(t * 3 + i) * .1 * motion + hero * (.25 + Math.sin(t * 5) * .15 * motion)) * (i === I104 ? 1.6 : 1.15));
    });
    routerHalo.scale.setScalar(sensing * (1 + Math.sin(t * 2.2) * .12 * motion));
    haloMat.color.copy(TEAL).lerp(CORAL, alert);
    ledMat.color.copy(TEAL).lerp(CORAL, alert).multiplyScalar(2.2);

    waves.forEach(w => {
      const cycle = motion ? (t * (w.userData.big ? .3 : .5) + w.userData.phase) % 1 : w.userData.phase;
      w.scale.setScalar(w.userData.big ? .3 + cycle * 7.5 : .15 + cycle * 1.3);
      w.material.opacity = (1 - cycle) * (w.userData.big ? .42 : .5) * sensing;
      w.material.color.copy(TEAL).lerp(CORAL, w.userData.big ? alert * .5 : alert);
    });

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
    const lieX = Math.cos(resident.rotation.y) * .8 * fall, lieZ = -Math.sin(resident.rotation.y) * .8 * fall;
    haloRing.position.set(at.x + lieX, FLOOR + .06, at.z + lieZ);
    haloRing.material.opacity = alert * (.45 + Math.sin(t * 4) * .25 * motion);
    haloRing.scale.setScalar(1.3 + (motion ? (t * .8) % 1 : 0) * .5);

    // Caregiver: alert on the phone, walks to Room 104, kneels beside the resident.
    const notice = between(p, .69, .715), go = clamp((p - .715) / (.84 - .715)), kneel = between(p, .84, .875);
    const cAt = carerPath.getPoint(smooth(go));
    carer.position.set(cAt.x, FLOOR + .04, cAt.z);
    if (go > 0) {
      const u = Math.min(smooth(go), .985), a = carerPath.getPoint(u), b = carerPath.getPoint(u + .015);
      const head = Math.atan2(b.x - a.x, b.z - a.z);
      carer.rotation.y = go < 1 ? head : lerp(head, 0, kneel);
    } else carer.rotation.y = lerp(Math.PI, -Math.PI / 2, notice);
    const cStride = go > 0 && go < 1 ? Math.sin(go * Math.PI * 26) * .6 * motion : 0;
    cLegL.rotation.x = cStride * (1 - kneel) - kneel * 1.25;
    cLegR.rotation.x = -cStride * (1 - kneel) + kneel * .35;
    cArmL.rotation.x = -cStride * .6 * (1 - kneel) - kneel * .9;
    cArmR.rotation.x = lerp(-cStride * .6, -1.25, notice * (1 - between(p, .73, .76))) - kneel * .7;
    cBody.position.y = -kneel * .38 + (go > 0 && go < 1 ? Math.abs(Math.sin(go * Math.PI * 26)) * .02 : 0);
    cBody.rotation.x = kneel * .3;
    phoneGlow.material.opacity = notice * (1 - between(p, .73, .76)) * (.7 + Math.sin(t * 8) * .3 * motion);
    phone.visible = notice > .01 && p < .77;

    const moving = walk > 0 && walk < 1 ? 1 : fall > 0 && fall < 1 ? 1.8 : 0;
    const bodyPos = V3(at.x + lieX, NODE_Y, at.z + lieZ);
    particleMat.opacity = sensing * .9;
    particleMat.color.copy(TEAL).lerp(CORAL, alert);
    let n = 0;
    LINKS.forEach((li) => {
      for (let k = 0; k < PER; k++) {
        const f = motion ? (t * .25 + k / PER + li * .13) % 1 : k / PER;
        dummy.position.lerpVectors(ROUTER, NODES[li], f);
        dummy.rotation.set(0, 0, 0);
        const mv = li === I104 ? moving : 0;
        const wob = Math.sin(f * Math.PI) * (.025 + mv * .08) * Math.sin(t * (3 + mv * 5) + k * 1.7) * (motion || .3);
        dummy.position.y += wob;
        const d = Math.hypot(dummy.position.x - bodyPos.x, dummy.position.z - bodyPos.z);
        if (d < 1) {
          const push = (1 - d) * (still ? .25 : .45 + moving * .35);
          dummy.position.y += push * (still ? -.5 : 1) * (motion ? (.6 + .4 * Math.sin(t * 6 + k)) : 1);
        }
        dummy.scale.setScalar(sensing * (.7 + .3 * Math.sin(f * Math.PI)) * (li === I104 ? 1.15 : .75));
        dummy.updateMatrix();
        particles.setMatrixAt(n++, dummy.matrix);
      }
    });
    particles.instanceMatrix.needsUpdate = true;

    const focus = between(p, .36, .44) * (1 - between(p, .93, .97));
    outlineMat.opacity = focus * (alert ? .6 + Math.sin(t * 4) * .3 * motion : .7);
    outlineMat.color.copy(AMBER).lerp(CORAL, alert);
    lamp.intensity = 7 * (.4 + .6 * lift);

    pings.forEach(m => {
      const age = (t - m.userData.born) / 1.15;
      if (age > 1) { m.visible = false; return; }
      m.visible = true;
      m.scale.setScalar(.15 + smooth(age) * 1.9);
      m.material.opacity = (1 - age) * .85;
    });

    if (Math.abs(p - shadowP) > .0004) { renderer.shadowMap.needsUpdate = true; shadowP = p; }
    cameraAt(p, t);
    const dash = between(p, .8, .855) * (1 - between(p, .93, .97));
    if (dash > .001 && width > 900) camera.setViewOffset(width, height, width * .13 * dash, 0, width, height);
    else camera.clearViewOffset();

    // Tilt-shift: keep the look-at target sharp, blur what's nearer and farther.
    bokeh.uniforms.focus.value = camera.position.distanceTo(camLook);
    bokeh.uniforms.aperture.value = lerp(0, .00012, Math.min(between(p, .04, .2), 1 - between(p, .9, 1)));
    grainPass.uniforms.uTime.value = t % 10;
    composer.render();

    // Adaptive quality: if frames are slow, switch off AO, then depth of field.
    if (document.visibilityState === 'visible' && dt < .2) frameTimes.push(dt);
    if (frameTimes.length > 90) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes = [];
      if (avg > .034 && quality > -1) { quality--; if (quality === 1) gtao.enabled = false; else if (quality === 0) bokeh.enabled = false; else { bloom.enabled = false; renderer.setPixelRatio(1); composer.setPixelRatio(1); resize(); } }   // third tier for slow laptops
    }

    const plan = Math.max(between(p, .22, .3) * (1 - between(p, .4, .46)), between(p, .8, .85) * (1 - between(p, .93, .96)));
    labelEls.forEach((el, i) => {
      const r = labelRooms[i];
      projected.set(r.x, r.sensor ? NODE_Y + .17 : r.router ? ROUTER.y + .55 : FLOOR + WALL_H * walls.scale.y + .45, r.z).project(camera);
      const is104 = r.n === 104;
      let o = r.sensor ? sensorShot : r.router ? sensing * Math.max(plan, between(p, .3, .34) * (1 - between(p, .44, .48))) : is104 ? Math.max(plan, focus) : plan;
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
    const hit = raycaster.intersectObjects(pickables, false).find(h => visible(h.object) && !(h.object.material.opacity < .3));
    if (!hit) return;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    const m = pings[pingIndex++ % pings.length];
    m.position.copy(hit.point).addScaledVector(normal, .03);
    m.lookAt(hit.point.clone().add(normal));
    m.userData.born = clock;
    nodes.forEach(g => { if (g.scale.x > .2 && g.position.distanceTo(hit.point) < 2.2) g.userData.flash = clock; });
  }

  return { render, ping, resize };
}
