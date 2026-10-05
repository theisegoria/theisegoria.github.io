/* studio-look.js: product-photography rendering for the site's 3D explainers.
 *
 * One import gives a lab the things that make a model read as an object rather
 * than a diagram:
 *   - image-based light from a real studio HDRI (CC0, Poly Haven), mixed with
 *     soft-box strips so polished metal carries long, clean highlights;
 *   - physical materials picked by glTF material name (brushed steel with
 *     anisotropy, polished steel under clearcoat, sapphire, rubies, anodised
 *     aluminium, soft-touch plastic, fabric with sheen, skin, PCB...), plus
 *     procedural micro-surface maps (brushing, Geneva stripes, perlage,
 *     knurling, speaker-grille mesh, fabric weave) generated on a canvas;
 *   - a soft contact shadow on an invisible floor;
 *   - a post pipeline with ground-truth ambient occlusion and anti-aliasing,
 *     which is what puts depth into a dense mechanism;
 *   - an idle turntable that stops the moment the reader touches the stage.
 *
 * Works on both WebGPU and the WebGL 2 fallback (node materials compile to
 * either). Usage, inside mountLab's setup:
 *
 *   const look = await createStudio(lab, { scale: 40, floorY: -9 });
 *   look.upgrade(root);            // materials + shadows + uvs
 *   return { update() {...}, render: look.render, dispose: look.dispose };
 *
 * lab-kit calls hooks.render() in place of renderer.render() when present.
 */
import * as THREE from 'three/webgpu';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { pass, mrt, output, normalView, screenUV, builtinAOContext, packNormalToRGB, unpackRGBToNormal, sample, uv, float, smoothstep } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { smaa } from 'three/addons/tsl/display/SMAANode.js';

const HDRI_BASE = '/assets/hdri/';
export const HDRIS = {
  studio: 'photo_studio_01_1k.hdr',        // curved strip lights: the best for polished metal
  softbox: 'studio_small_09_1k.hdr',       // two big soft boxes: plastics, fabric, painted cabinets
  bright: 'studio_small_08_1k.hdr',        // brighter, more frontal
  loft: 'photo_studio_loft_hall_1k.hdr',   // a daylight room with windows: appliances, interiors
};
const hdrCache = new Map();
function loadHDR(name) {
  const file = HDRIS[name] || name;
  if (!hdrCache.has(file)) hdrCache.set(file, new HDRLoader().loadAsync(HDRI_BASE + file).then((t) => { t.mapping = THREE.EquirectangularReflectionMapping; return t; }));
  return hdrCache.get(file);
}

/* ------------------------------------------------------------------ environment */
const STRIPS = {
  // [w, h, colour, intensity, position (unit sphere * r), look-at origin]
  watch: [
    [2.2, 0.32, 0xfff1dc, 9, [-0.45, 0.8, 0.4]],
    [0.22, 2.0, 0xdfe9ff, 6, [0.9, 0.12, -0.3]],
    [1.6, 0.14, 0xffffff, 4, [0.3, -0.2, 0.92]],
    [0.14, 1.5, 0xffffff, 5, [-0.9, 0.05, -0.45]],
  ],
  product: [
    [1.8, 0.9, 0xfff6ea, 3.2, [-0.55, 0.7, 0.45]],
    [0.3, 1.8, 0xe6eeff, 3.0, [0.88, 0.2, -0.4]],
    [1.6, 0.7, 0xffffff, 0.8, [0.2, 0.15, 0.97]],
  ],
  // a movement seen through a caseback: a big soft panel overhead so flat bridges read
  // bright with their finish, hard strips low on the sides for edge glints on the anglage
  movement: [
    [5.6, 5.0, 0xffffff, 1.7, [0.1, 1, 0.3], true],
    [2.4, 0.3, 0xfff1dc, 7, [-0.55, 0.62, 0.55]],
    [0.22, 2.0, 0xdfe9ff, 5, [0.92, 0.2, -0.3]],
    [1.8, 0.12, 0xffffff, 4, [0.25, 0.12, 0.96]],
    [0.14, 1.6, 0xffffff, 4, [-0.95, 0.1, -0.4]],
  ],
  none: [],
};

let _softbox = null;
/** A soft box's face: bright in the middle, falling off to the rim (a gradient in every reflection). */
function softboxTexture() {
  if (_softbox) return _softbox;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.45, '#b8b8b8'); grd.addColorStop(0.8, '#3a3a3a'); grd.addColorStop(1, '#101010');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  _softbox = new THREE.CanvasTexture(c); _softbox.colorSpace = THREE.SRGBColorSpace;
  return _softbox;
}

/**
 * A PMREM environment: the HDRI on a sphere (exposure-scaled), dimmed toward
 * black so the studio reads as a studio, plus soft-box strips that draw as
 * highlights along edges. Returns the texture.
 */
async function buildEnvironment(renderer, { hdri = 'studio', hdriGain = 1, strips = 'product', sphereR = 30, rotateY = 0 } = {}) {
  const env = new THREE.Scene();
  const hdr = hdri ? await loadHDR(hdri) : null;
  if (hdr) {
    const m = new THREE.MeshBasicMaterial({ map: hdr, side: THREE.BackSide, depthWrite: false });
    m.color.setScalar(hdriGain);
    const s = new THREE.Mesh(new THREE.SphereGeometry(sphereR, 64, 32), m); s.rotation.y = rotateY; env.add(s);
  } else {
    env.background = new THREE.Color(0x202020);
  }
  for (const [w, h, col, k, p, soft] of (Array.isArray(strips) ? strips : STRIPS[strips]) || []) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * sphereR * 0.5, h * sphereR * 0.5), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, map: soft ? softboxTexture() : null }));
    mesh.material.color.multiplyScalar(k);
    const v = new THREE.Vector3(...p).normalize().multiplyScalar(sphereR * 0.85);
    mesh.position.copy(v); mesh.lookAt(0, 0, 0); env.add(mesh);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.0, 0.1, sphereR * 4);
  env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  pmrem.dispose();
  return rt.texture;
}

/* ------------------------------------------------------------------ procedural micro-surface maps */
const texCache = new Map();
/** Height field drawn in a canvas, converted to a tangent-space normal map. */
function normalFromHeight(size, heightFn, strength = 2) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = heightFn(x / size, y / size);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); const img = ctx.createImageData(size, size);
  const H = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1); const i = 4 * (y * size + x);
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}
const rnd = (s) => { let x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };
const SURFACES = {
  brushed: () => normalFromHeight(256, (u, v) => rnd(Math.floor(v * 256) * 7.1 + Math.floor(u * 4)) * 0.6 + rnd(Math.floor(v * 512)) * 0.4, 0.9),
  geneva: () => normalFromHeight(256, (u, v) => { const k = (v * 4) % 1; return Math.sqrt(Math.max(0, 1 - (2 * k - 1) ** 2)) + 0.08 * rnd(Math.floor(u * 256) + Math.floor(v * 900) * 3); }, 3.5),
  perlage: () => {
    const N = 10; const R = 0.62;
    return normalFromHeight(256, (u, v) => {
      let best = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const cx = Math.floor(u * N) + i + 0.5 + ((Math.floor(v * N) + j) % 2) * 0.5, cy = Math.floor(v * N) + j + 0.5;
        const dx = u * N - cx, dy = v * N - cy, r = Math.hypot(dx, dy) / R;
        if (r < 1) best = Math.max(best, 0.6 + 0.4 * Math.sin(r * 34) * (1 - r));
      }
      return best;
    }, 2.0);
  },
  knurl: () => normalFromHeight(128, (u, v) => Math.abs(((u * 12 + v * 12) % 1) - 0.5) + Math.abs(((u * 12 - v * 12 + 100) % 1) - 0.5), 4),
  grille: () => normalFromHeight(256, (u, v) => { const a = (u * 32) % 1, b = (v * 32 + ((Math.floor(u * 32) % 2) * 0.5)) % 1; return Math.hypot(a - 0.5, b - 0.5) < 0.3 ? -1 : 0; }, 2.5),
  weave: () => normalFromHeight(256, (u, v) => { const a = Math.sin(u * 2 * Math.PI * 48), b = Math.sin(v * 2 * Math.PI * 48); return (Math.floor(u * 48) + Math.floor(v * 48)) % 2 ? a * 0.5 + 0.5 : b * 0.5 + 0.5; }, 1.2),
  grain: () => normalFromHeight(256, (u, v) => rnd(Math.floor(u * 256) + Math.floor(v * 256) * 257) * 0.5 + rnd(Math.floor(u * 64) + Math.floor(v * 64) * 65) * 0.5, 0.6),
  // Metric finishes for watch parts. Each tile is one period of the finish, so a
  // material's `tile` (model units) is the real pitch; see metricUVs() below.
  // Côtes de Genève: one band per tile, a shallow concave profile across the band
  // with the fine arcs the cutting wheel leaves.
  cotes: () => normalFromHeight(256, (u, v) => {
    const arc = v + 0.9 * (u - 0.5) ** 2;
    return 1.6 * (v - 0.5) ** 2 + 0.035 * (rnd(Math.floor(arc * 90)) * 0.6 + rnd(Math.floor(arc * 230) + 7) * 0.4);
  }, 14),
  // the same, as concentric bands (use with uv: 'radial'): height depends on v only
  cotes_rings: () => normalFromHeight(256, (u, v) => 1.6 * (v - 0.5) ** 2 + 0.03 * (rnd(Math.floor(v * 160)) * 0.6 + rnd(Math.floor(v * 400) + 3) * 0.4), 14),
  // circular graining / azurage: fine concentric scratches (uv: 'radial'); v only
  rings: () => normalFromHeight(256, (u, v) => rnd(Math.floor(v * 256)) * 0.6 + rnd(Math.floor(v * 97) + 11) * 0.4, 1.0),
  // sunburst: fine radial scratches (uv: 'polar'); u only
  rays: () => normalFromHeight(512, (u, v) => rnd(Math.floor(u * 512)) * 0.6 + rnd(Math.floor(u * 1499) + 5) * 0.4, 1.0),
  // perlage: 6 x 6 overlapping spots per tile, laid row by row so each spot covers the
  // last; inside a spot a shallow cone and fine swirl rings. Seamless when tiled.
  perlage_fine: () => {
    const N = 6, R = 0.74;
    return normalFromHeight(384, (u, v) => {
      const X = u * N, Y = v * N; let best = -1, key = -1e9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const col = Math.floor(X) + i, row = Math.floor(Y) + j;
        const r = Math.hypot(X - col - 0.5, Y - row - 0.5) / R;
        if (r < 1 && row * 1000 + col > key) { key = row * 1000 + col; best = r; }
      }
      if (best < 0) return 0;
      return 0.16 * (1 - best) + 0.035 * Math.sin(best * 44) * (1 - best * 0.6);
    }, 6);
  },
  sunray: () => normalFromHeight(512, (u, v) => { const a = Math.atan2(v - 0.5, u - 0.5); return rnd(Math.floor((a + Math.PI) * 600)) * 0.7 + rnd(Math.floor((a + Math.PI) * 2400)) * 0.3; }, 1.0),
};
export function surface(name) {
  if (!SURFACES[name]) return null;
  if (!texCache.has(name)) texCache.set(name, SURFACES[name]());
  return texCache.get(name);
}

/* ------------------------------------------------------------------ materials */
/**
 * Looks by material name. Each may name a micro-surface map (`surf`) with a
 * repeat and a normal strength. Names are matched exactly first, then by the
 * keyword list below, so a GLB from any of the site's Blender builders gets a
 * sensible material without per-page tables.
 */
export const LOOK = {
  // metals
  polished_steel: { color: 0xd9dadb, metalness: 1, roughness: 0.07, clearcoat: 0.6, clearcoatRoughness: 0.04, envMapIntensity: 1.25 },
  steel:          { color: 0xc9cacc, metalness: 1, roughness: 0.24, anisotropy: 0.75, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.15, surf: 'brushed', rep: 3, ns: 0.25 },
  steel_brushed:  { color: 0xc9cacc, metalness: 1, roughness: 0.26, anisotropy: 0.9, envMapIntensity: 1.15, surf: 'brushed', rep: 3, ns: 0.3 },
  titanium:       { color: 0xb3b0aa, metalness: 1, roughness: 0.36, anisotropy: 0.6, envMapIntensity: 1.0, surf: 'brushed', rep: 2, ns: 0.2 },
  aluminium:      { color: 0xd6d8da, metalness: 1, roughness: 0.32, anisotropy: 0.5, envMapIntensity: 1.0, surf: 'grain', rep: 6, ns: 0.15 },
  anodised:       { color: 0x8a8d92, metalness: 0.9, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 0.9, surf: 'grain', rep: 6, ns: 0.12 },
  chrome:         { color: 0xf2f2f2, metalness: 1, roughness: 0.03, envMapIntensity: 1.3 },
  brass:          { color: 0xd9b46a, metalness: 1, roughness: 0.3, envMapIntensity: 1.1, surf: 'perlage', rep: 4, ns: 0.35 },
  gilt:           { color: 0xe3c178, metalness: 1, roughness: 0.2, envMapIntensity: 1.25, surf: 'perlage', rep: 4, ns: 0.3 },
  gold:           { color: 0xf0c66b, metalness: 1, roughness: 0.12, envMapIntensity: 1.3 },
  copper:         { color: 0xd28a5c, metalness: 1, roughness: 0.28, envMapIntensity: 1.1 },
  rhodium_plate:  { color: 0xd0d2d4, metalness: 1, roughness: 0.22, envMapIntensity: 1.1, surf: 'geneva', rep: 2, ns: 0.45 },
  bridge:         { color: 0xd0d2d4, metalness: 1, roughness: 0.22, envMapIntensity: 1.1, surf: 'geneva', rep: 2, ns: 0.45 },
  main_plate:     { color: 0xcfd1d3, metalness: 1, roughness: 0.3, envMapIntensity: 1.0, surf: 'perlage', rep: 5, ns: 0.4 },
  // metric watch finishes (tile in model units; the site's watch GLBs are in mm)
  plate_perlage:  { color: 0xd3d5d7, metalness: 1, roughness: 0.27, envMapIntensity: 1.0, surf: 'perlage_fine', uv: 'planar', tile: 6, ns: 0.14 },
  bridge_cotes:   { color: 0xdcdee0, metalness: 1, roughness: 0.19, envMapIntensity: 1.1, surf: 'cotes', uv: 'planar', tile: 1.8, uvRotate: 0.35, ns: 0.55 },
  rotor_cotes:    { color: 0xdcdee0, metalness: 1, roughness: 0.19, envMapIntensity: 1.1, surf: 'cotes_rings', uv: 'radial', tile: 1.6, ns: 0.75 },
  rhodium_satin:  { color: 0xc9cbcd, metalness: 1, roughness: 0.34, envMapIntensity: 0.95 },
  anglage:        { color: 0xeeeff0, metalness: 1, roughness: 0.035, envMapIntensity: 1.35 },
  gilt_circular:  { metalness: 1, roughness: 0.2, envMapIntensity: 1.15, surf: 'rings', uv: 'radial', tile: 3, ns: 0.35 },
  gilt_satin:     { metalness: 1, roughness: 0.32, envMapIntensity: 1.0 },
  gilt_polished:  { metalness: 1, roughness: 0.07, envMapIntensity: 1.3 },
  steel_soleil:   { color: 0xd7d9db, metalness: 1, roughness: 0.17, envMapIntensity: 1.15, surf: 'rays', uv: 'polar', tile: 2, uvK: 3, ns: 0.45 },
  steel_grained:  { color: 0xd2d4d6, metalness: 1, roughness: 0.22, envMapIntensity: 1.1, surf: 'brushed', uv: 'planar', tile: 2.5, ns: 0.25 },
  steel_satin:    { color: 0xc6c8ca, metalness: 1, roughness: 0.32, envMapIntensity: 1.0 },
  tungsten:       { color: 0xb9b7b3, metalness: 1, roughness: 0.17, envMapIntensity: 1.15, surf: 'rings', uv: 'radial', tile: 2, ns: 0.45 },
  subdial:        { color: 0xdedcd5, metalness: 0.35, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.95, surf: 'rings', uv: 'radial', uvAxis: 'y', uvCenter: 'bbox', tile: 0.9, ns: 0.3 },
  dark_steel:     { color: 0x5b5d61, metalness: 1, roughness: 0.32, envMapIntensity: 0.95 },
  spring_steel:   { color: 0xa9abb0, metalness: 1, roughness: 0.25, envMapIntensity: 1.0 },
  blued_steel:    { color: 0x23407a, metalness: 0.9, roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.05, iridescence: 0.5, iridescenceIOR: 1.6, envMapIntensity: 1.35 },
  black_plate:    { color: 0x2a2b2e, metalness: 0.8, roughness: 0.4, envMapIntensity: 0.85 },
  case_black:     { color: 0x26272a, metalness: 0.85, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 1.0, surf: 'brushed', rep: 2, ns: 0.15 },
  skeleton:       { metalness: 0.9, roughness: 0.35, envMapIntensity: 0.95 },
  knurled:        { color: 0xc9cacc, metalness: 1, roughness: 0.28, envMapIntensity: 1.1, surf: 'knurl', rep: 6, ns: 0.8 },
  // dials and printing
  blue_dial:      { color: 0x1f3e7a, metalness: 0.55, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.2, surf: 'sunray', rep: 1, ns: 0.35 },
  blue_sub:       { color: 0x1a3465, metalness: 0.4, roughness: 0.36, clearcoat: 0.4, envMapIntensity: 1.1 },
  dial:           { metalness: 0.15, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.8, surf: 'sunray', rep: 1, ns: 0.2 },
  print:          { metalness: 0, roughness: 0.6 },
  lume:           { color: 0xe9f1dc, metalness: 0, roughness: 0.6, emissive: 0xbfd9a8, emissiveIntensity: 0.1 },
  // gems and glass
  ruby:           { color: 0xc0132b, metalness: 0, roughness: 0.04, transmission: 0.25, thickness: 0.4, ior: 1.77, clearcoat: 1, attenuationColor: 0x8a0414, attenuationDistance: 0.25, envMapIntensity: 1.4, emissive: 0x7a0818, emissiveIntensity: 0.45 },
  // plastics, rubber, finishes
  plastic:        { metalness: 0, roughness: 0.42, clearcoat: 0.1, clearcoatRoughness: 0.4, specularIntensity: 0.6, surf: 'grain', rep: 8, ns: 0.08 },
  plastic_gloss:  { metalness: 0, roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.05, envMapIntensity: 1.0 },
  soft_touch:     { metalness: 0, roughness: 0.78, sheen: 0.3, sheenRoughness: 0.8, specularIntensity: 0.4, surf: 'grain', rep: 10, ns: 0.1 },
  rubber:         { metalness: 0, roughness: 0.85, specularIntensity: 0.35 },
  paint:          { metalness: 0.1, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 1.0 },
  ceramic:        { metalness: 0, roughness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.06, envMapIntensity: 1.0 },
  fabric:         { metalness: 0, roughness: 0.9, sheen: 1, sheenRoughness: 0.55, specularIntensity: 0.2, surf: 'weave', rep: 14, ns: 0.6 },
  grille:         { metalness: 0.6, roughness: 0.45, surf: 'grille', rep: 10, ns: 0.8 },
  pcb:            { color: 0x1d5a3a, metalness: 0.1, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 },
  cone_paper:     { color: 0x2a2a2a, metalness: 0, roughness: 0.85, surf: 'grain', rep: 6, ns: 0.25 },
  skin:           { metalness: 0, roughness: 0.55, sheen: 0.25, sheenRoughness: 0.6, specularIntensity: 0.45 },
  wood:           { metalness: 0, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.2 },
  // a few names the existing builders already use
  black:          { metalness: 0.2, roughness: 0.55 },
  lime:           { metalness: 0.3, roughness: 0.35, clearcoat: 0.4 },
  red:            { metalness: 0.2, roughness: 0.32, clearcoat: 0.6 },
  moon:           { color: 0xe7d39a, metalness: 0.9, roughness: 0.22, envMapIntensity: 1.3 },
  moonlit:        { metalness: 0.5, roughness: 0.35, envMapIntensity: 1.2 },
};
const KEYWORDS = [
  [/sapphire|crystal|glass|lens|window/i, 'glass'],
  [/ruby|jewel/i, 'ruby'], [/subdial|counter_dial/i, 'subdial'],
  [/polish|mirror/i, 'polished_steel'], [/chrome/i, 'chrome'], [/blued|blue_steel|screw_blue/i, 'blued_steel'],
  [/titan/i, 'titanium'], [/anodi[sz]/i, 'anodised'], [/alumin/i, 'aluminium'], [/knurl|crown_grip/i, 'knurled'],
  [/gilt|gold/i, 'gilt'], [/brass/i, 'brass'], [/copper|coil|winding/i, 'copper'],
  [/bridge|cock/i, 'bridge'], [/plate/i, 'main_plate'], [/hairspring|mainspring|spring/i, 'spring_steel'], [/steel|metal/i, 'steel'],
  [/fabric|mesh_cloth|knit|cloth/i, 'fabric'], [/grille|grill|perforat/i, 'grille'], [/rubber|silicone|gasket|surround|cushion|foam/i, 'rubber'],
  [/soft.?touch|matte/i, 'soft_touch'], [/gloss/i, 'plastic_gloss'], [/plastic|abs|pc_|polycarb|housing|shell/i, 'plastic'],
  [/paint|lacquer|enamel/i, 'paint'], [/ceramic|porcelain|enamel/i, 'ceramic'], [/pcb|board/i, 'pcb'], [/cone|paper/i, 'cone_paper'],
  [/skin|head|face/i, 'skin'], [/wood|veneer/i, 'wood'], [/dial/i, 'dial'], [/lume/i, 'lume'],
];
function lookFor(name) {
  if (!name) return null;
  if (LOOK[name] || name === 'glass') return name;
  for (const [re, key] of KEYWORDS) if (re.test(name)) return key;
  return null;
}

function makeGlass(src) {
  return new THREE.MeshPhysicalMaterial({
    name: src?.name || 'glass', color: 0xffffff, metalness: 0, roughness: 0.015, transmission: 1, thickness: 0.8, ior: 1.77,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.01, envMapIntensity: 1.3,
    attenuationColor: new THREE.Color(0xf2f6ff), attenuationDistance: 60, transparent: true, opacity: 1, depthWrite: false,
  });
}

/**
 * Turn one glTF material into a MeshPhysicalMaterial with the look its name
 * implies. Keeps the source colour unless the look sets one and the source is
 * plain white/grey (builders often leave the default). `keepColor: true`
 * always keeps the source colour.
 */
export function upgradeMaterial(src, { cache = new Map(), keepColor = false, extra = {} } = {}) {
  if (!src || src.isMeshPhysicalMaterial && src.userData.studio) return src;
  if (cache.has(src)) return cache.get(src);
  const key = extra[src.name] ? null : lookFor(src.name);
  let out;
  if (key === 'glass') out = makeGlass(src);
  else {
    const look = { ...(key ? LOOK[key] : {}), ...(extra[src.name] || {}) };
    out = new THREE.MeshPhysicalMaterial({ name: src.name });
    // copy what the builder set
    for (const k of ['color', 'emissive']) if (src[k]) out[k].copy(src[k]);
    for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap']) if (src[k]) out[k] = src[k];
    out.metalness = src.metalness ?? 0; out.roughness = src.roughness ?? 0.5; out.emissiveIntensity = src.emissiveIntensity ?? 1;
    out.transparent = src.transparent; out.opacity = src.opacity; out.side = src.side; out.vertexColors = src.vertexColors;
    out.alphaTest = src.alphaTest; out.depthWrite = src.depthWrite;
    const grey = Math.abs(out.color.r - out.color.g) < 0.02 && Math.abs(out.color.g - out.color.b) < 0.02;
    for (const [k, v] of Object.entries(look)) {
      if (k === 'surf' || k === 'rep' || k === 'ns' || k === 'tile' || k.startsWith('uv')) continue;
      if (k === 'color') { if (!keepColor && grey && !src.map) out.color.set(v); continue; }
      if (k === 'emissive' || k === 'attenuationColor') { out[k] = new THREE.Color(v); continue; }
      out[k] = v;
    }
    if (look.surf && !out.normalMap) {
      const t = surface(look.surf);
      if (t) { out.normalMap = t.clone(); out.normalMap.repeat.setScalar(look.uv ? 1 : (look.rep || 1)); out.normalMap.needsUpdate = true; out.normalScale = new THREE.Vector2(look.ns ?? 0.3, look.ns ?? 0.3); }
    }
    if (look.uv) out.userData.uv = { mode: look.uv, tile: look.tile ?? 1, rotate: look.uvRotate ?? 0, axis: look.uvAxis ?? 'y', center: look.uvCenter ?? 'origin', k: look.uvK ?? 3 };
  }
  out.userData.studio = key || 'auto';
  cache.set(src, out);
  return out;
}

/** Planar UVs for geometry that has none (procedural maps and anisotropy need tangents). Picks the dominant plane. */
export function ensureUVs(geometry, scale = 1) {
  if (geometry.attributes.uv) return;
  geometry.computeBoundingBox();
  const b = geometry.boundingBox, s = new THREE.Vector3(); b.getSize(s);
  const p = geometry.attributes.position; const uv = new Float32Array(p.count * 2);
  // project onto the two largest extents
  const ax = [['x', s.x], ['y', s.y], ['z', s.z]].sort((a, c) => c[1] - a[1]);
  const A = ax[0][0], B = ax[1][0]; const k = 1 / Math.max(1e-6, ax[0][1]) * scale;
  const get = { x: (i) => p.getX(i), y: (i) => p.getY(i), z: (i) => p.getZ(i) };
  for (let i = 0; i < p.count; i++) { uv[2 * i] = (get[A](i) - b.min[A]) * k; uv[2 * i + 1] = (get[B](i) - b.min[B]) * k; }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/**
 * UVs in model units, for finishes that have a real scale (a Geneva stripe is
 * about 1.8 mm wide, a perlage spot 1 mm). One texture tile = `tile` model units.
 *   planar  project along `axis` (default 'y'), rotated by `rotate` radians
 *   radial  v = distance from the axis, u = a planar coordinate (rings, azurage)
 *   polar   u = angle (tile repeats `k` times round), v = radius (sunburst rays);
 *           the geometry is made non-indexed so the angular seam does not smear
 *   box     per vertex, project along the dominant normal axis (any shape)
 * `center` 'origin' (the mesh's own origin, which is the axis of a turning part)
 * or 'bbox' (the centre of the geometry's bounding box).
 */
export function metricUVs(mesh, { mode = 'planar', tile = 1, rotate = 0, axis = 'y', center = 'origin', k = 3 } = {}) {
  let g = mesh.geometry;
  if (mode === 'polar' && g.index) { g = g.toNonIndexed(); mesh.geometry = g; }
  const p = g.attributes.position, nrm = g.attributes.normal, n = p.count;
  const uvs = new Float32Array(n * 2);
  let c = [0, 0, 0];
  if (center === 'bbox') { g.computeBoundingBox(); const v = new THREE.Vector3(); g.boundingBox.getCenter(v); c = [v.x, v.y, v.z]; }
  const A = { x: [1, 2], y: [0, 2], z: [0, 1] }[axis] || [0, 2];
  const cr = Math.cos(rotate), sr = Math.sin(rotate), s = 1 / tile;
  for (let i = 0; i < n; i++) {
    const q = [p.getX(i) - c[0], p.getY(i) - c[1], p.getZ(i) - c[2]];
    let a = q[A[0]], b = q[A[1]];
    if (mode === 'box' && nrm) {
      const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
      if (ax >= ay && ax >= az) { a = q[2]; b = q[1]; } else if (az >= ay) { a = q[0]; b = q[1]; } else { a = q[0]; b = q[2]; }
    }
    let u, v;
    if (mode === 'radial') { u = a * s; v = Math.hypot(a, b) * s; }
    else if (mode === 'polar') { u = (Math.atan2(b, a) / (2 * Math.PI) + 0.5) * k; v = Math.hypot(a, b) * s; }
    else { u = (a * cr - b * sr) * s; v = (a * sr + b * cr) * s; }
    uvs[2 * i] = u; uvs[2 * i + 1] = v;
  }
  if (mode === 'polar') {      // unwrap each triangle across the seam
    for (let t = 0; t < n; t += 3) {
      const us = [uvs[2 * t], uvs[2 * t + 2], uvs[2 * t + 4]], mx = Math.max(...us);
      if (mx - Math.min(...us) > k / 2) for (let j = 0; j < 3; j++) if (mx - us[j] > k / 2) uvs[2 * (t + j)] += k;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/* ------------------------------------------------------------------ the studio */
/**
 * createStudio(lab, opts)
 *   scale     rough size of the subject in scene units (sets light distances, shadow frustum)
 *   center    [x, y, z] subject centre
 *   floorY    y of the shadow catcher (null for none)
 *   hdri      'studio' | 'softbox' | 'bright' | 'loft' | file name | null
 *   strips    'watch' | 'movement' | 'product' | 'none', or an array of [w, h, colour, intensity, [x, y, z]]
 *   exposure, envIntensity, toneMapping ('neutral' | 'agx' | 'aces')
 *   ao        true/false (default: true unless ?lowfx in the URL)
 *   aoRadius  GTAO radius in scene units (default scale * 0.04)
 *   shadowOpacity
 * Returns { render, upgrade(root, opts), setFloor(y), setShadowCenter(x, z), floor, key, setEnvIntensity, setAO, dispose, pipeline }
 *
 * Materials whose look sets `uv` ('planar' | 'radial' | 'polar' | 'box') get UVs in
 * model units from metricUVs(), so `tile` is the finish's real pitch.
 */
export async function createStudio(lab, opts = {}) {
  const { renderer, scene, camera } = lab;
  const {
    scale = 10, center = [0, 0, 0], floorY = null, hdri = 'studio', hdriGain = 1, strips = 'product', rotateY = 0,
    exposure = 1, envIntensity = 1, toneMapping = 'neutral', shadowOpacity = 0.22, keyIntensity = 1.2, keyColor = 0xfff4e6,
    keyDir = [-0.6, 1, 0.55], shadows = true,
  } = opts;
  const low = /[?&]lowfx\b/.test(location.search) || (matchMedia('(max-width: 600px)').matches && lab.backend !== 'webgpu');
  const useAO = (opts.ao ?? true) && !low;

  renderer.toneMapping = { neutral: THREE.NeutralToneMapping, agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping }[toneMapping] ?? THREE.NeutralToneMapping;
  renderer.toneMappingExposure = exposure;
  const envTex = await buildEnvironment(renderer, { hdri, hdriGain, strips, rotateY });
  scene.environment = envTex; scene.environmentIntensity = envIntensity;

  // key light with a soft shadow; the env does the rest of the lighting
  const [cx, cy, cz] = center;
  const key = new THREE.DirectionalLight(keyColor, keyIntensity);
  const kd = new THREE.Vector3(...keyDir).normalize().multiplyScalar(scale * 2.5);
  key.position.set(cx + kd.x, cy + kd.y, cz + kd.z); key.target.position.set(cx, cy, cz);
  scene.add(key, key.target);
  let floor = null;
  if (shadows) {
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 10; key.shadow.blurSamples = 16; key.shadow.bias = -0.0003;
    const c = key.shadow.camera; const r = scale * 0.9; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = scale * 0.2; c.far = scale * 6;
    if (floorY !== null) {
      // The catcher stays inside the shadow camera's frustum and fades out toward its
      // rim; a catcher larger than the frustum shows the frustum's edge as a line.
      const fm = new THREE.ShadowNodeMaterial({ transparent: true, depthWrite: false });
      fm.opacityNode = float(shadowOpacity).mul(float(1).sub(smoothstep(0.45, 1.0, uv().sub(0.5).length().mul(2))));
      floor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 96), fm);
      floor.rotation.x = -Math.PI / 2; floor.position.set(cx, floorY, cz); floor.receiveShadow = true; floor.name = 'shadow_catcher'; floor.renderOrder = -1;
      scene.add(floor);
    }
  }

  // post: GTAO on the indirect light, then SMAA
  let pipeline = null, aoPass = null;
  if (useAO) {
    try {
      pipeline = new THREE.RenderPipeline(renderer);
      const prePass = pass(scene, camera, { samples: 0 });   // GTAO samples depth with textureGather, which a multisampled depth cannot do
      prePass.transparent = false;
      prePass.setMRT(mrt({ output: packNormalToRGB(normalView) }));
      const preNormal = sample((st) => unpackRGBToNormal(prePass.getTextureNode().sample(st)));
      const preDepth = prePass.getTextureNode('depth');
      aoPass = ao(preDepth, preNormal, camera);
      aoPass.resolutionScale = 0.5;
      aoPass.radius.value = opts.aoRadius ?? scale * 0.04;
      aoPass.thickness.value = opts.aoThickness ?? scale * 0.01;
      aoPass.distanceFallOff.value = 1;
      aoPass.scale.value = opts.aoStrength ?? 1;
      const aoTex = aoPass.getTextureNode();
      const scenePass = pass(scene, camera, { samples: 4 });
      scenePass.contextNode = builtinAOContext(aoTex.sample(screenUV).r);
      pipeline.outputNode = opts.smaa ? smaa(scenePass) : scenePass;
    } catch (err) { console.warn('studio-look: post pipeline unavailable, rendering direct', err); pipeline = null; }
  }

  const cache = new Map();
  const look = {
    pipeline, key, floor, ao: aoPass,
    get usingPost() { return !!pipeline; },
    render() { if (pipeline) pipeline.render(); else renderer.render(scene, camera); },
    /** Upgrade every mesh under root: materials by name, shadow casting, missing UVs. */
    upgrade(root, { keepColor = false, extra = {}, cast = true, receive = false, skip } = {}) {
      root.traverse((o) => {
        if (!o.isMesh || (skip && skip(o))) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const up = mats.map((m) => upgradeMaterial(m, { cache, keepColor, extra }));
        o.material = Array.isArray(o.material) ? up : up[0];
        const glass = up.some((m) => m.transmission > 0.5);
        o.castShadow = cast && !glass; o.receiveShadow = receive;
        const metric = up.find((m) => m.userData.uv);
        if (metric) metricUVs(o, metric.userData.uv);
        else if (up.some((m) => m.normalMap || m.anisotropy)) ensureUVs(o.geometry, 1);
      });
    },
    setFloor(y) { if (floor) floor.position.y = y; },
    /** Optional: re-centre the shadow camera and floor on a point (x, z) in world space. */
    setShadowCenter(x, z) { key.target.position.x = x; key.target.position.z = z; key.position.x = x + kd.x; key.position.z = z + kd.z; if (floor) { floor.position.x = x; floor.position.z = z; } },
    setEnvIntensity(v) { scene.environmentIntensity = v; },
    setAO(on) { if (aoPass) aoPass.scale.value = on ? (opts.aoStrength ?? 1) : 0; },
    dispose() { envTex.dispose(); pipeline?.dispose?.(); for (const t of texCache.values()) t.dispose(); texCache.clear(); },
  };
  return look;
}

/** Idle turntable on OrbitControls: turns slowly until the reader touches the stage, resumes after a pause. */
export function turntable(controls, canvas, { speed = 0.35, resumeAfter = 7000 } = {}) {
  let armed = true, lastTouch = 0;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = speed;
  const touch = () => { lastTouch = performance.now(); controls.autoRotate = false; };
  canvas.addEventListener('pointerdown', touch); canvas.addEventListener('wheel', touch, { passive: true }); canvas.addEventListener('keydown', touch);
  return {
    tick() { if (armed && !controls.autoRotate && performance.now() - lastTouch > resumeAfter && !matchMedia('(prefers-reduced-motion: reduce)').matches) controls.autoRotate = true; },
    set(on) { armed = on; controls.autoRotate = on && !matchMedia('(prefers-reduced-motion: reduce)').matches; },
    dispose() { canvas.removeEventListener('pointerdown', touch); canvas.removeEventListener('wheel', touch); canvas.removeEventListener('keydown', touch); },
  };
}

/** Smoothly move an OrbitControls camera to a new position/target over `ms`. */
export function flyTo(camera, controls, pos, target, ms = 900, onFrame) {
  const p0 = camera.position.clone(), t0 = controls.target.clone(); const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...target);
  const start = performance.now(); const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  return new Promise((res) => {
    const step = () => { const k = Math.min(1, (performance.now() - start) / ms), e = ease(k);
      camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e); controls.update(); onFrame?.();
      if (k < 1) requestAnimationFrame(step); else res(); };
    step();
  });
}
