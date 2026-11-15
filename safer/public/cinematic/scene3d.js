// Haven 3D world: a cosy, toy-like care wing built entirely in code (no downloaded models or images).
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
const SUN_DIR = V3(-16, 11, 14).normalize();
const SKY_TOP = new THREE.Color(0x2c4a86), SKY_MID = new THREE.Color(0x9fa3cf), HORIZON = new THREE.Color(0xf7c48f);

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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HORIZON, 70, 280);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 600);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const noAO = o => { o.userData.noAO = true; return o; };

  // ---------- Lighting: warm low sun, sky/ground bounce, soft shadows ----------
  scene.add(new THREE.HemisphereLight(0xffe2c8, 0x5d6b4c, 1.25));
  const sun = new THREE.DirectionalLight(0xffb27a, 3.1);
  sun.position.copy(SUN_DIR).multiplyScalar(40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 100 });
  sun.shadow.bias = -.0003;
  sun.shadow.normalBias = .025;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fb6e6, .45);
  fill.position.set(14, 10, -12);
  scene.add(fill);

  // ---------- Procedural textures ----------
  const TX = {
    siding: canvasTex(256, 256, (g, w, h) => {
      for (let i = 0; i < 8; i++) {
        const y = i * h / 8, grad = g.createLinearGradient(0, y, 0, y + h / 8);
        grad.addColorStop(0, '#f7efdf'); grad.addColorStop(.85, '#efe4cf'); grad.addColorStop(1, '#d8c9ad');
        g.fillStyle = grad; g.fillRect(0, y, w, h / 8);
      }
      for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(120,100,70,${rnd() * .05})`; g.fillRect(rnd() * w, rnd() * h, 2, 1); }
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
      const tones = ['#6c5446', '#5f4b40', '#735a4a', '#56453b', '#7a604f'];
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
      g.fillStyle = '#8f8676'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 6; r++) {
        let x = -rnd() * 40;
        while (x < w) {
          const sw = 34 + rnd() * 40, col = pick(['#c9bda6', '#b9ab93', '#d4c8b2', '#ad9f88', '#c2b49b']);
          g.fillStyle = col;
          g.beginPath(); g.roundRect(x + 2, r * 43 + 2, sw - 4, 39, 9); g.fill();
          g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 6, r * 43 + 5, sw - 14, 5);
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
    trim: std(0xf6f1e6, { roughness: .6 }), shutter: std(0xffffff, { map: TX.slats }), stone: std(0xffffff, { map: TX.stone }),
    roof: std(0xffffff, { map: TX.shingles, roughness: .9 }), wood: std(0xffffff, { map: TX.planks, roughness: .7 }),
    tile: std(0xffffff, { map: TX.tile, roughness: .55 }), deck: std(0xffffff, { map: TX.planks, color: 0xd9c0a0 }),
    beam: std(0x8a6748), door: std(0x6f8a74, { roughness: .55 }), brass: std(0xd4ad62, { metalness: .8, roughness: .3 }),
    metal: std(0x3b3f3c, { metalness: .5, roughness: .45 }), soil: std(0x5a4130, { roughness: 1 }),
    glass: std(0xffdcaa, { emissive: 0xffb469, emissiveIntensity: 1.9, roughness: .25 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc77d, emissiveIntensity: 3.2 }),
    bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 1.3) }),
    frame: std(0x8a6a4c, { roughness: .6 }), linen: std(0xfbf7ef, { roughness: .95 }), node: std(0x2f3430, { roughness: .4 }),
    figure: std(0xd8c8ae, { roughness: .7 }), skin: std(0xeee3d2, { roughness: .7 }),
    leaf: std(0x6f8f4e, { flatShading: true }), trunk: std(0x6b4f39, { roughness: .95 }), pine: std(0x4f6f4f, { flatShading: true }),
    rock: std(0x9a958c, { flatShading: true }), fence: std(0xf4efe4, { roughness: .7 }), cloud: std(0xfff3ea, { emissive: 0xffd2b0, emissiveIntensity: .25, flatShading: true })
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
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, mid: { value: SKY_MID }, horizon: { value: HORIZON }, sunDir: { value: SUN_DIR } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, horizon, sunDir; varying vec3 vDir;
      void main(){ float h = vDir.y; vec3 c = mix(horizon, mid, smoothstep(0.0, .22, h)); c = mix(c, top, smoothstep(.22, .75, h));
        c = mix(c, horizon * .92, smoothstep(0.0, -.15, h));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.); c += vec3(1., .7, .45) * (pow(s, 12.) * .35 + pow(s, 400.) * 2.5);
        gl_FragColor = vec4(c, 1.); }`
  }));
  noAO(sky);
  scene.add(sky);

  // ---------- Terrain: gentle hills, low-poly mountain ring, coloured by height ----------
  const noise = new SimplexNoise({ random: rnd });
  const pathPt = t => [X1 + 1.6 + t * 12, Math.sin(t * Math.PI * .9) * 3.2 + t * 6];
  function heightAt(x, z) {
    const r = Math.hypot(x, z);
    const flat = smooth((r - 15) / 14);              // flat lot around the building
    let h = (noise.noise(x * .035, z * .035) * 1.6 + noise.noise(x * .09, z * .09) * .4) * flat;
    const ring = smooth((r - 75) / 60);
    h += ring * (12 + noise.noise(x * .02, z * .02) * 14 + noise.noise(x * .06, z * .06) * 4);
    return Math.max(h, -.4);
  }
  const terrGeo = new THREE.PlaneGeometry(320, 320, 200, 200);
  terrGeo.rotateX(-Math.PI / 2);
  const tp = terrGeo.attributes.position, tcol = [];
  const g1 = new THREE.Color(0x87a160), g2 = new THREE.Color(0x6f8c4f), g3 = new THREE.Color(0xa9b56f), rockC = new THREE.Color(0x8c8aa2), snow = new THREE.Color(0xe9e2ea);
  const tc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), h = heightAt(x, z);
    tp.setY(i, h);
    tc.copy(g1).lerp(g2, clamp(noise.noise(x * .08, z * .08) * .5 + .5)).lerp(g3, clamp((h - .6) * .5));
    tc.lerp(rockC, smooth((h - 6) / 8)).lerp(snow, smooth((h - 17) / 5));
    tcol.push(tc.r, tc.g, tc.b);
  }
  terrGeo.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3));
  terrGeo.computeVertexNormals();
  const terrain = mesh(terrGeo, std(0xffffff, { vertexColors: true, roughness: 1 }), 0, 0, 0, styl, false);
  pickables.push(terrain);

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
  function tree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, heightAt(x, z), z);
    g.scale.setScalar(s);
    styl.add(g);
    const kind = rnd();
    if (kind < .38) {                                   // pine
      mesh(new THREE.CylinderGeometry(.1, .16, 1.1, 7), M.trunk, 0, .55, 0, g);
      for (let k = 0; k < 4; k++) mesh(new THREE.ConeGeometry(1.25 - k * .26, 1.3, 8), std(new THREE.Color(0x4f6f4f).offsetHSL(0, 0, (rnd() - .5) * .06), { flatShading: true }), 0, 1.35 + k * .7, 0, g).rotation.y = rnd() * 3;
    } else {                                            // round deciduous
      mesh(new THREE.CylinderGeometry(.11, .19, 1.6, 7), M.trunk, 0, .8, 0, g);
      const col = leafColors[Math.floor(rnd() * (rnd() < .78 ? 4 : 7))];
      for (let k = 0; k < 5; k++) {
        const r = .55 + rnd() * .45, a = k * 1.3;
        mesh(new THREE.IcosahedronGeometry(r, 1), std(new THREE.Color(col).offsetHSL(0, 0, (rnd() - .5) * .08), { flatShading: true }),
          Math.cos(a) * .45 * (k ? 1 : 0), 2.0 + rnd() * .7 + (k ? 0 : .5), Math.sin(a) * .45 * (k ? 1 : 0), g);
      }
    }
    sway.push({ g, phase: rnd() * 6, amp: .012 + rnd() * .012 });
  }
  for (let i = 0; i < 95; i++) {
    const a = rnd() * Math.PI * 2, r = 13 + rnd() * 50;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const deg = (a * 180 / Math.PI + 360) % 360;
    if (deg > 25 && deg < 85 && r < 34) continue;      // keep the hero view and path clear
    tree(x, z, .8 + rnd() * .75);
  }
  for (const [x, z, s] of [[-9.5, 9, 1.1], [-11, -8.5, 1.2], [9.5, -8.5, 1.05], [-10.5, .5, .95]]) tree(x, z, s);
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
  const okGround = (x, z) => !(Math.abs(x) < 7.6 && Math.abs(z) < 6.4) && !(x > 6 && x < 21 && Math.abs(z - (Math.sin(((x - X1 - 1.6) / 12) * Math.PI * .9) * 3.2 + ((x - X1 - 1.6) / 12) * 6)) < 1.3);
  const dummy = new THREE.Object3D();
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
    tufts.setColorAt(ti, tcolor.setHSL(.2 + rnd() * .07, .42 + rnd() * .15, .4 + rnd() * .14));
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
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), a = rnd() * Math.PI * 2, r = 70 + rnd() * 80;
    g.position.set(Math.cos(a) * r, 26 + rnd() * 18, Math.sin(a) * r);
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
            at(h.c + s * (h.w / 2 + .32), ym, out * (T / 2 + .03), .5, hh + .05, .05, M.shutter, walls, .015); // shutters
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
  for (const [x, z] of [[X0, ZN], [X0, ZS], [X1, ZN], [X1, ZS]]) rbox(.26, WALL_H, .26, M.trim, x, WALL_H / 2, z, walls, .03);
  // stone skirt
  for (const [w, d, x, z] of [[13.5, .24, 0, ZS + .02], [13.5, .24, 0, ZN - .02], [.24, 10.6, X0 - .02, 0], [.24, 10.6, X1 + .02, 0]]) tbox(w, .5, d, M.stone, x, .25, z, walls, 1.2);

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
  const roofTrim = std(0xf6f1e6, { roughness: .6, transparent: true });
  const roofStone = std(0xffffff, { map: TX.stone, transparent: true });
  const roofMetal = std(0xc9c3b8, { metalness: .4, roughness: .45, transparent: true });
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
  rbox(.7, 1.6, .7, roofStone, 3, 2.05, -1.5, roof, .03);
  rbox(.86, .12, .86, roofTrim, 3, 2.88, -1.5, roof, .03);
  const smokeMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xd9d2cc, transparent: true, opacity: .5, depthWrite: false, fog: true });
  const smoke = Array.from({ length: 7 }, (_, i) => { const s = noAO(new THREE.Sprite(smokeMat.clone())); s.userData.phase = i / 7; roof.add(s); return s; });

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

  // ---------- ESP32 sensors, waves and signal particles ----------
  const ledMat = new THREE.MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(2.5) });
  const haloMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: .3, depthWrite: false });
  const nodes = NODES.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(p);
    g.rotation.y = NODE_FACING[i];
    scene.add(g);
    mesh(new RoundedBoxGeometry(.28, .17, .07, 3, .025), M.node, 0, 0, 0, g);
    mesh(new THREE.CylinderGeometry(.012, .012, .2, 6), M.node, .1, .18, 0, g);
    mesh(new THREE.SphereGeometry(.03, 10, 8), ledMat, -.07, .02, .04, g, false);
    const halo = noAO(mesh(new THREE.SphereGeometry(.16, 16, 12), haloMat, 0, 0, .05, g, false));
    g.userData = { halo, flash: -10 };
    g.scale.setScalar(0);
    return g;
  });

  const ringGeo = new THREE.RingGeometry(.94, 1, 64);
  const waves = [];
  NODES.forEach((p, i) => {
    for (let k = 0; k < 3; k++) {
      const w = noAO(mesh(ringGeo, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), p.x, p.y - .02, p.z, scene, false));
      w.rotation.x = -Math.PI / 2;
      w.receiveShadow = false;
      w.userData.phase = k / 3 + i * .13;
      waves.push(w);
    }
  });

  const LINKS = [[0, 1], [1, 2], [2, 0]], PER = 26;
  const particleMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, depthWrite: false });
  const particles = noAO(new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 8, 6), particleMat, LINKS.length * PER));
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
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .55, .55, .9);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.2126,.7152,.0722)); c.rgb = max(mix(vec3(l), c.rgb, 1.22), 0.); c.rgb = pow(c.rgb, vec3(1.06)) * 1.04; vec2 d = vUv - .5; float v = smoothstep(.85, .25, length(d * vec2(1.1, 1.)));
        c.rgb *= mix(.72, 1., v); c.rgb += (hash(vUv * 900. + uTime) - .5) * .018; gl_FragColor = c; }`
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
  const labelRooms = labelEls.map(el => ROOMS.find(r => String(r.n) === el.dataset.room));
  let lastT = 0;

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
      s.position.set(3 + Math.sin(k * 5) * .25 + k * .9, 3 + k * 3.2, -1.5 - k * .5);
      s.scale.setScalar(.45 + k * 1.6);
      s.material.opacity = (1 - k) * .45 * fade;
    });

    // Story state
    const walk = clamp((p - .47) / .13);
    const fall = between(p, .6, .655);
    const still = p > .655;
    const alert = between(p, .66, .7) * (1 - between(p, .93, .97));
    const sensing = between(p, .3, .36) * (1 - between(p, .93, .98));

    nodes.forEach((g, i) => {
      const s = between(p, .25 + i * .025, .3 + i * .025);
      g.scale.setScalar(s * (1 + Math.sin(s * Math.PI) * .25) * 1.8);
      const flash = Math.max(0, 1 - (t - g.userData.flash) / .6);
      g.userData.halo.scale.setScalar(1 + flash * 1.6 + Math.sin(t * 3 + i) * .08 * motion);
    });
    haloMat.color.copy(TEAL).lerp(CORAL, alert);
    ledMat.color.copy(TEAL).lerp(CORAL, alert).multiplyScalar(2.5);

    waves.forEach(w => {
      const cycle = motion ? (t * .45 + w.userData.phase) % 1 : w.userData.phase;
      w.scale.setScalar(.2 + cycle * 2.4);
      w.material.opacity = (1 - cycle) * .45 * sensing;
      w.material.color.copy(TEAL).lerp(CORAL, alert);
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

    const moving = walk > 0 && walk < 1 ? 1 : fall > 0 && fall < 1 ? 1.8 : 0;
    const bodyPos = V3(at.x + lieX, NODE_Y, at.z + lieZ);
    particleMat.opacity = sensing * .9;
    particleMat.color.copy(TEAL).lerp(CORAL, alert);
    let n = 0;
    LINKS.forEach(([a, b], li) => {
      for (let k = 0; k < PER; k++) {
        const f = motion ? (t * .3 + k / PER + li * .17) % 1 : k / PER;
        dummy.position.lerpVectors(NODES[a], NODES[b], f);
        dummy.rotation.set(0, 0, 0);
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

    cameraAt(p, t);
    const dash = between(p, .8, .855) * (1 - between(p, .93, .97));
    if (dash > .001 && width > 900) camera.setViewOffset(width, height, width * .13 * dash, 0, width, height);
    else camera.clearViewOffset();

    // Tilt-shift: keep the look-at target sharp, blur what's nearer and farther.
    bokeh.uniforms.focus.value = camera.position.distanceTo(camLook);
    grainPass.uniforms.uTime.value = t % 10;
    composer.render();

    // Adaptive quality: if frames are slow, switch off AO, then depth of field.
    if (document.visibilityState === 'visible' && dt < .2) frameTimes.push(dt);
    if (frameTimes.length > 90) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes = [];
      if (avg > .034 && quality > -1) { quality--; if (quality === 1) gtao.enabled = false; else if (quality === 0) bokeh.enabled = false; else { bloom.enabled = false; renderer.setPixelRatio(1); composer.setPixelRatio(1); resize(); } }
    }

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
    const hit = raycaster.intersectObjects(pickables, false).find(h => visible(h.object) && !(h.object.material.opacity < .3));
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
