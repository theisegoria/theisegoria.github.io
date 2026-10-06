/* KEF Coda W, inside Uni-Q: the scene.
 * Product mode shows my own model of the speaker (assets/coda.glb, blender/build_coda.py).  Driver
 * mode loads a three-quarter section of a 12th-generation Uni-Q built in
 * Blender (assets/uniq.glb, speaker-models/build_uniq.py) from KEF's published
 * descriptions: the tweeter on its own motor inside the mid/bass voice coil,
 * a radial-channel waveguide over the dome, Z-flex surround and trim ring,
 * cone-neck decoupler, gap damper, conical duct and undercut pole.  Paths mode
 * computes the summed response of a two-way pair with a fourth-order
 * Linkwitz-Riley crossover, coincident or separated, across angle and frequency.
 * Light, materials, contact shadow and ambient occlusion come from the shared
 * studio (/assets/lab-kit/studio-look.js); labels from ./callouts.js. */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { mountLab } from '/assets/lab-kit/lab-kit.js';
import { createStudio, turntable, surface, scan, metricUVs } from '/assets/lab-kit/studio-look.js';
import { createCallouts } from './callouts.js';
import * as A from './acoustics.js';

const ja = document.documentElement.lang === 'ja';
const L = (en, jp) => (ja ? jp : en);
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const ASSETS = new URL('./assets/', import.meta.url).href;
const DRACO = new URL('/vendor/three/r186/examples-jsm/libs/draco/', location.href).href;
const state = { mode: 'product', camera: 'hero', part: 'all', explode: 0, layout: 'coincident', angle: 30, frequency: 2000 };
const FC = 2500, SEP = 0.13, R_LISTEN = 2.0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const host = $('#scene');
const canvas = document.createElement('canvas'); canvas.id = 'stage'; canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
const analysis = $('#analysis');
let lab = null, controls = null, transition = null, look = null, spin = null, userOrbit = false;
const product = new THREE.Group(), driver = new THREE.Group(), paths = new THREE.Group();
let uniq = null, uniqMeta = null; const parts = new Map();
let fieldMesh = null, fieldTex = null;
const _box = new THREE.Box3(), _c = new THREE.Vector3();
function screenBounds(camera, W, H) {
  const g = state.mode === 'driver' ? uniq : null; if (!g) return null;
  _box.setFromObject(g, false); if (_box.isEmpty()) return null;
  let minX = W, maxX = 0;
  for (let i = 0; i < 8; i++) { _c.set(i & 1 ? _box.max.x : _box.min.x, i & 2 ? _box.max.y : _box.min.y, i & 4 ? _box.max.z : _box.min.z).project(camera); const x = (_c.x * 0.5 + 0.5) * W; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  // the box of a round part overstates its silhouette; pull it in a little
  const k = 0.12 * (maxX - minX); return { minX: minX + k, maxX: maxX - k };
}
const callouts = createCallouts(host, { top: 10, bottom: 62, compactMax: 5, bounds: screenBounds });

const copy = {
  product: ['01 / PRODUCT', 'A stereo system.<br>A shared centre.', 'Coda W places a 25 mm aluminium tweeter inside a 130 mm bass/midrange cone. Each speaker uses a 12th-generation Uni-Q array.', 'My model of Coda W · Midnight Blue finish',
    '01 / 製品', 'ステレオシステム。<br>中心を共有する。', 'Coda W は 130 mm の低中音コーンの中に 25 mm のアルミニウム製ツイーターを置く。各スピーカーは第 12 世代の Uni-Q アレイを使う。', '私が作った Coda W のモデル · Midnight Blue 仕上げ'],
  driver: ['02 / DRIVER ANATOMY', 'Two drivers.<br>One axis.', 'A 12th-generation Uni-Q, cut away. The 25 mm dome sits on its own small motor inside the bore of the bass/midrange pole, so it radiates from the apex of the cone; the cone, the Z-flex surround and the trim ring then carry on as its waveguide. Behind the dome, the rear wave leaves through a duct in the centre poles. Separate the parts to see how they nest.', 'Uni-Q section · my reconstruction from KEF\'s published architecture',
    '02 / ドライバーの構造', '2 つのドライバー、<br>1 本の軸。', '第 12 世代 Uni-Q の断面である。25 mm のドームは低中音側のポールの穴の中に据えた専用の小さな磁気回路に載り、コーンの頂点から放射する。その先はコーン、Z-flex エッジ、トリムリングがそのまま導波路になる。ドームの背面の音は中心のポールを貫くダクトから抜ける。部品を分離して、入れ子の構造を見てみよう。', 'Uni-Q 断面 · KEF の公表構成から私が再構成したもの'],
  paths: ['03 / THE GEOMETRY', 'Why the axis matters.', 'A computed two-way response: woofer and tweeter through a fourth-order Linkwitz-Riley crossover at 2.5 kHz, summed at a listener 2 m away. Coincident sources add the same way at every angle. Separated sources add with a path difference that changes with angle, so the crossover region develops a dip that moves as you move.', 'Ideal sources · LR4 crossover · c = 343 m/s',
    '03 / 幾何', '軸が重要な理由。', '計算した 2 ウェイ応答である。ウーファーとツイーターを 2.5 kHz の 4 次リンクウィッツ・ライリー型クロスオーバーに通し、2 m 先の受聴点で足し合わせる。同軸の音源はどの角度でも同じように足し合わさる。離れた音源は角度で変わる経路差をもって足し合わさるので、クロスオーバー帯域に動く谷が生じる。', '理想音源 · LR4 クロスオーバー · c = 343 m/s'],
};
const partNotes = {
  all: ['The tweeter sits inside the bass/midrange voice coil, at the apex of the cone. Select a part to read its role, or click it in the model.', 'ツイーターは低中音のボイスコイルの内側、コーンの頂点に座る。部品を選ぶか、モデル上でクリックすると役割が読める。'],
  cone: ['A 130 mm magnesium/aluminium cone on a large voice coil. A flexible link decouples the cone neck from the former; the Z-flex surround folds below the line of the cone so that cone, surround and trim ring read to the tweeter as one smooth waveguide. The motor has an undercut pole and aluminium rings above and below the gap to steady the coil\'s inductance. Its hollow pole is what makes room for the tweeter.', '130 mm のマグネシウム・アルミニウム合金コーンを大径のボイスコイルが駆動する。コーンのネックとボビンの間には柔らかい結合材が入る。Z-flex エッジはコーンの線より下で折り返すので、コーン、エッジ、トリムリングがツイーターから見て一続きの滑らかな導波路になる。磁気回路はアンダーカットしたポールと、ギャップの上下のアルミリングでコイルのインダクタンス変動を抑える。ポールが中空であることがツイーターの居場所をつくる。'],
  tweeter: ['A 25 mm vented aluminium dome on its own neodymium motor, with a copper sleeve on the pole, mounted inside the bore of the bass/midrange pole. Its surround support is the first stretch of the waveguide; the narrow annular gap between that support and the cone neck is where the two drivers meet.', '25 mm の通気型アルミニウムドームで、ポールに銅スリーブを被せた専用のネオジム磁気回路に載り、低中音側ポールの穴の中に据えられる。エッジの支持部が導波路の最初の区間であり、支持部とコーンのネックの間の細い環状の隙間で 2 つのドライバーが接する。'],
  guide: ['A radial-channel phase plug over the dome, the idea behind KEF\'s Tangerine waveguide: fins that narrow the channels towards the rim load the dome slightly and even out the path lengths from its surface. KEF does not publish the fin count or profile, so the part drawn here is a generic finned flare, not KEF\'s design.', 'ドームを覆う放射状チャンネル型のフェーズプラグで、KEF の Tangerine 導波路の考え方である。外周に向かって溝を狭めるフィンがドームをわずかに負荷し、ドーム表面からの経路長をそろえる。KEF はフィンの数と形状を公表していないので、ここに描いたのは KEF の設計ではなく、一般的なフィン付きのフレアである。'],
  damping: ['What happens behind the dome. The rear wave leaves through a slightly tapered duct in the centre poles, with porous fill, into an absorbing chamber; the gap damper, two rings of wadding between the two magnets, soaks up the resonance of the annular gap between tweeter and cone. The chamber is representative: Coda W is not listed with MAT.', 'ドームの背後の処理である。背面の音は中心のポールを貫く、わずかにテーパーの付いたダクトを通り、多孔質材を経て吸音室へ抜ける。2 つの磁石の間に置いた 2 本のリング状の吸音材（ギャップダンパー）が、ツイーターとコーンの間の環状の隙間の共鳴を吸収する。吸音室は代表的な形であり、Coda W は MAT 搭載とされていない。'],
};
const PART_GROUPS = { cone: (p) => p.component === 'mid', tweeter: (p) => p.component === 'tweeter' && p.name !== 'waveguide', guide: (p) => p.name === 'waveguide', damping: (p) => p.component === 'damping' };

// Callout text per part, and which parts each selection labels (first = most important; phones show the first five).
const PART_LABEL = {
  tweeter_dome: ['25 mm aluminium dome', '25 mm アルミニウムドーム'],
  waveguide: ['radial-channel waveguide', '放射状チャンネル導波路'],
  mid_cone: ['magnesium/aluminium cone', 'マグネシウム・アルミニウム合金コーン'],
  mid_surround: ['Z-flex surround', 'Z-flex エッジ'],
  trim_ring: ['trim ring', 'トリムリング'],
  mid_coil: ['bass/mid voice coil', '低中音のボイスコイル'],
  tweeter_coil: ['tweeter voice coil', 'ツイーターのボイスコイル'],
  tweeter_magnet: ['tweeter neodymium magnet', 'ツイーターのネオジム磁石'],
  tweeter_motor: ['tweeter pole and plates', 'ツイーターのポールとプレート'],
  mid_magnet: ['bass/mid ring magnet', '低中音のリング磁石'],
  mid_backplate: ['back plate, undercut pole', 'バックプレートとアンダーカットポール'],
  mid_spider: ['spider', 'スパイダー'],
  mid_basket: ['cast chassis', '鋳造シャーシ'],
  gap_damper: ['gap damper', 'ギャップダンパー'],
  duct: ['conical duct', '円錐ダクト'],
  rear_absorber: ['rear absorber', '背面の吸音材'],
  rear_chamber: ['rear chamber (representative)', '背面チャンバー（代表形）'],
};
const LABEL_SETS = {
  all: ['tweeter_dome', 'mid_cone', 'waveguide', 'mid_surround', 'mid_coil', 'tweeter_magnet', 'duct', 'mid_magnet'],
  cone: ['mid_cone', 'mid_surround', 'mid_coil', 'mid_magnet', 'trim_ring', 'mid_spider', 'mid_basket', 'mid_backplate'],
  tweeter: ['tweeter_dome', 'tweeter_coil', 'tweeter_magnet', 'tweeter_motor'],
  guide: ['waveguide', 'tweeter_dome'],
  damping: ['duct', 'gap_damper', 'rear_absorber', 'rear_chamber'],
};

// ------------------------------------------------------------------ materials for the section
// Real finishes, each named in the Blender build.  Section faces (the cut) are
// matte and tinted by driver so the nesting reads at a glance.
const SECTION_TINT = { mid: 0x5d7a91, tweeter: 0xd08a3c, damping: 0x7d9b72 };
const DRIVER_LOOKS = {
  cone_alloy:       { color: 0xbfc2c4, metalness: 1, roughness: 0.42, envMapIntensity: 1.0, surf: 'grain', uvRep: [2, 0.3], ns: 0.18 },
  dome_alu:         { color: 0xe2e4e6, metalness: 1, roughness: 0.2, envMapIntensity: 1.2, clearcoat: 0.3, clearcoatRoughness: 0.15 },
  surround_rubber:  { color: 0x141416, metalness: 0, roughness: 0.62, specularIntensity: 0.45, clearcoat: 0.15, clearcoatRoughness: 0.5 },
  trim_satin:       { color: 0x1d1f23, metalness: 0, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, surf: 'grain', uvRep: [2, 0.3], ns: 0.06 },
  decoupler_rubber: { color: 0x1a1a1c, metalness: 0, roughness: 0.8, specularIntensity: 0.3 },
  former_kapton:    { color: 0xb36a1c, metalness: 0, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.1, specularIntensity: 0.8 },
  coil_copper:      { color: 0xd9895a, metalness: 1, roughness: 0.3, envMapIntensity: 1.15, surf: 'winding', uvRep: [1, 0.16], ns: 0.9 },
  spider_cloth:     { color: 0xc8a96a, metalness: 0, roughness: 0.88, sheen: 0.8, sheenRoughness: 0.5, sheenColor: 0xf2deb0, surf: 'weave', uvRep: [0.5, 0.035], ns: 0.45 },
  chassis_cast:     { color: 0x2b2d31, metalness: 0.55, roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.4, envMapIntensity: 0.9, surf: 'grain', uvRep: [2, 0.3], ns: 0.22 },
  plate_steel:      { color: 0xa9adb1, metalness: 1, roughness: 0.3, envMapIntensity: 1.1, surf: 'turned', uvRep: [1, 0.08], ns: 0.35 },
  magnet_ring:      { color: 0x3a3b3e, metalness: 0.15, roughness: 0.72, surf: 'grain', uvRep: [2, 0.4], ns: 0.35 },
  ring_alu:         { color: 0xd8dbde, metalness: 1, roughness: 0.24, envMapIntensity: 1.15, surf: 'turned', uvRep: [1, 0.08], ns: 0.25 },
  neo_magnet:       { color: 0xd3d6d9, metalness: 1, roughness: 0.14, envMapIntensity: 1.25 },
  sleeve_copper:    { color: 0xe39a6a, metalness: 1, roughness: 0.2, envMapIntensity: 1.2 },
  guide_satin:      { color: 0x24262a, metalness: 0.1, roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.25 },
  wadding:          { color: 0xe4ddce, metalness: 0, roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: 0xffffff, surf: 'grain', uvRep: [3, 0.5], ns: 0.6 },
  duct_satin:       { color: 0x50596a, metalness: 0, roughness: 0.5, clearcoat: 0.2 },
  screw_black:      { color: 0x1a1b1d, metalness: 1, roughness: 0.32, envMapIntensity: 1.0 },
  tinsel_copper:    { color: 0xe0a77a, metalness: 1, roughness: 0.38 },
  terminal_brass:   { color: 0xd8b56a, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 },
  housing_plastic:  { color: 0x1c1d20, metalness: 0, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.4, surf: 'grain', uvRep: [3, 0.5], ns: 0.05 },
  glue_bead:        { color: 0x9a8f7a, metalness: 0, roughness: 0.25, clearcoat: 0.6 },
  section_mid:      { color: 0x8aa0b2, metalness: 0, roughness: 0.68, specularIntensity: 0.3 },
  section_tweeter:  { color: 0xe0a466, metalness: 0, roughness: 0.68, specularIntensity: 0.3 },
  section_damping:  { color: 0xa4b897, metalness: 0, roughness: 0.75, specularIntensity: 0.3 },
};
// micro-surface maps the shared studio does not have: coil windings and turned (lathe) rings
function normalFromHeight(size, heightFn, strength) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = heightFn(x / size, y / size);
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d'); const img = ctx.createImageData(size, size);
  const H = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = 4 * (y * size + x);
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t;
}
const rnd = (s) => { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); };
const OWN_SURF = {
  // round wire, ~0.2 mm pitch at the page scale: v runs along the axis (mm)
  winding: () => { return normalFromHeight(64, (u, v) => Math.sqrt(Math.max(0, 1 - (2 * ((v * 8) % 1) - 1) ** 2)), 3); },
  // concentric lathe marks: v runs across the rings
  turned: () => { return normalFromHeight(256, (u, v) => rnd(Math.floor(v * 256)) * 0.7 + rnd(Math.floor(v * 1024)) * 0.3, 0.8); },
};
/** Cylindrical UVs about the driver axis (glTF +Y): u around, v = radius + height in mm, so rings and windings follow the circles. */
function axisUV(g) {
  if (g.attributes.uv) return;
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let a = Math.atan2(-z, x); if (a < Math.PI / 4) a += Math.PI * 2;
    uv[2 * i] = a / (Math.PI * 2) * 12; uv[2 * i + 1] = Math.hypot(x, z) + y;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function physical(src, look) {
  const out = new THREE.MeshPhysicalMaterial({ name: src.name, side: THREE.DoubleSide });
  for (const [k, v] of Object.entries(look)) {
    if (k === 'surf' || k === 'rep' || k === 'ns') continue;
    if (k === 'color' || k === 'sheenColor' || k === 'emissive') { out[k] = new THREE.Color(v); continue; }
    out[k] = v;
  }
  if (look.surf) {
    const base = OWN_SURF[look.surf] ? OWN_SURF[look.surf]() : surface(look.surf)?.clone();
    if (base) {
      const [ru, rv] = look.uvRep || [1, 1]; base.repeat.set(ru, rv); base.needsUpdate = true;
      out.normalMap = base; out.normalScale = new THREE.Vector2(look.ns ?? 0.3, look.ns ?? 0.3);
    }
  }
  return out;
}

// ------------------------------------------------------------------ models
const draco = new DRACOLoader().setDecoderPath(DRACO);
const loader = new GLTFLoader().setDRACOLoader(draco);
function loadGLB(url) { return loader.loadAsync(url); }
async function loadProduct() {
  try {
    // My own model of the speaker (blender/build_coda.py), built from the published size and
    // product photographs: no logo, a plain woven wrap, generic connectors.
    const g = await loadGLB(ASSETS + 'coda.glb?v=2');
    const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group(); wrapper.add(g.scene); g.scene.position.sub(center); wrapper.scale.setScalar(2.85 / size.y); product.add(wrapper);
    // finishes by material name; the wrap is a real CC0 fabric scan (ambientCG) tiled at its true size
    const weave = scan('fabric_weave', 1), grain = surface('grain');
    const S = THREE.DoubleSide;
    const FIN = {
      cabinet_fabric: { color: 0x182031, roughness: 0.9, sheen: 0.8, sheenColor: 0x4c5874, sheenRoughness: 0.5, specularIntensity: 0.3, normalMap: weave.normal, normalScale: 0.8, roughnessMap: weave.rough, uvTile: 0.008 },
      baffle_trim: { color: 0x0b0c0e, roughness: 0.6 },
      trim_ring: { color: 0x0c0d0f, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3, normalMap: grain, normalScale: 0.06, uvTile: 0.01 },
      surround_rubber: { color: 0x0b0b0c, roughness: 0.72, specularIntensity: 0.4 },
      cone_metal: { color: 0x34373c, metalness: 0.92, roughness: 0.36, envMapIntensity: 1.1 },
      dome_metal: { color: 0x75787d, metalness: 1, roughness: 0.34, envMapIntensity: 1.0 },
      plug_plastic: { color: 0x121316, roughness: 0.42, clearcoat: 0.2 },
      port_plastic: { color: 0x0a0a0b, roughness: 0.55, clearcoat: 0.15 },
      panel_plastic: { color: 0x15161a, roughness: 0.55, normalMap: grain, normalScale: 0.08, uvTile: 0.006 },
      connector_metal: { color: 0xd2cfc8, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 },
      connector_dark: { color: 0x050506, roughness: 0.65 },
      rca_red: { color: 0x8c1414, roughness: 0.38, clearcoat: 0.4 },
      rca_white: { color: 0xd9d9d5, roughness: 0.38, clearcoat: 0.4 },
      touch_gloss: { color: 0x07080a, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1 },
      led: { color: 0xe8eef8, roughness: 0.3, emissive: 0xdfe8ff, emissiveIntensity: 0.25 },
      foot_rubber: { color: 0x0b0b0b, roughness: 0.9 },
    };
    const cache = new Map();
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const s = o.material, f = FIN[s.name] || {};
      if (!cache.has(s)) {
        const m = new THREE.MeshPhysicalMaterial({ name: s.name, side: S });
        for (const [k, v] of Object.entries(f)) {
          if (k === 'uvTile') continue;
          if (k === 'normalScale') m.normalScale.setScalar(v);
          else if (k === 'color' || k === 'emissive' || k === 'sheenColor') m[k] = new THREE.Color(v);
          else m[k] = v;
        }
        cache.set(s, m);
      }
      o.material = cache.get(s); o.castShadow = true; o.receiveShadow = true;
      // finishes in real units: one tile of the weave or grain per uvTile metres of the model
      if (f.uvTile) metricUVs(o, { mode: 'box', tile: f.uvTile, center: 'bbox' });
    });
    // contact shadow: a soft dark footprint right under the cabinet (285 x 168 x 268 mm -> 0.01 unit per mm)
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.filter = 'blur(18px)'; x.fillStyle = '#000'; x.beginPath(); x.roundRect(48, 40, 160, 176, 10); x.fill();
    const tex = new THREE.CanvasTexture(c);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = -1.42; blob.scale.set(1.68 * 1.6, 2.68 * 1.45, 1); blob.renderOrder = -1; product.add(blob);
    $('#load').hidden = true; window.modelEvidence = { size: size.toArray(), meshes: 0 }; g.scene.traverse((o) => { if (o.isMesh) window.modelEvidence.meshes++; });
  } catch (e) { console.warn(e); $('#load').textContent = L('The product model could not load. Try “Inside Uni-Q” to explore the driver.', '製品モデルを読み込めなかった。「Inside Uni-Q」でドライバーを見てほしい。'); }
  lab.invalidate();
}
async function loadDriver() {
  const [g, m] = await Promise.all([loadGLB(ASSETS + 'uniq.glb?v=3'), fetch(ASSETS + 'uniq-meta.json?v=3').then((r) => r.json())]);
  uniqMeta = m; uniq = g.scene;
  const byName = new Map(m.parts.map((p) => [p.name, p]));
  const shared = new Map();
  uniq.traverse((o) => {
    if (!o.isMesh) return;
    // a multi-material node exports as a group of primitives: the part is the parent node
    const node = byName.get(o.name) ? o : o.parent;
    const p = byName.get(node.name); if (!p) return;
    axisUV(o.geometry);
    const mats = (Array.isArray(o.material) ? o.material : [o.material]).map((s) => {
      const name = s.name.replace(/\.\d+$/, '');
      if (!shared.has(name)) shared.set(name, physical(s, DRIVER_LOOKS[name] || { color: s.color.getHex(), metalness: s.metalness, roughness: s.roughness }));
      const own = shared.get(name).clone(); own.userData.baseColor = own.color.clone(); own.userData.baseOpacity = 1; return own;
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
    o.castShadow = true; o.receiveShadow = true;
    o.userData.part = p;
    if (!node.userData.base) { node.userData.part = p; node.userData.base = node.position.clone(); node.userData.explode = new THREE.Vector3(p.explode[0], p.explode[2], -p.explode[1]); parts.set(p.name, node); }
  });
  uniq.scale.setScalar(0.016);             // 1 scene unit = 62.5 mm
  uniq.rotation.x = Math.PI / 2;           // driver axis +Y in the file -> +Z, facing the camera
  uniq.position.set(0, 0, 0.75);
  driver.add(uniq);
  layoutDriver(); setDriverLabels();
}
function eachMat(node, fn) { node.traverse((o) => { if (o.isMesh) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) fn(m, o); }); }
function layoutDriver() {
  if (!uniq) return;
  const s = state.explode / 100;
  const sel = state.part === 'all' ? null : PART_GROUPS[state.part];
  for (const [, node] of parts) {
    const p = node.userData.part;
    node.position.copy(node.userData.base).addScaledVector(node.userData.explode, s * 1.2);
    const dim = sel && !sel(p);
    eachMat(node, (m, o) => {
      // parts not under discussion become faint glass so the selected ones read clearly
      m.transparent = !!dim; m.opacity = dim ? 0.09 : 1; m.depthWrite = !dim; m.side = dim ? THREE.FrontSide : THREE.DoubleSide;
      m.color.copy(m.userData.baseColor); if (dim) m.color.lerp(new THREE.Color(0xb7c2ca), 0.7);
      o.castShadow = !dim;
    });
  }
  driver.updateMatrixWorld(true);
  occlusionDirty = true;
}

// ------------------------------------------------------------------ driver labels
const _v = new THREE.Vector3();
function anchorOf(name) {
  const node = parts.get(name); const a = node?.userData.part.anchor; if (!a) return null;
  const local = new THREE.Vector3(a[0], a[2], -a[1]);
  return () => node.localToWorld(_v.copy(local)).clone();
}
function setDriverLabels() {
  if (!uniq) return;
  const names = LABEL_SETS[state.part] || LABEL_SETS.all;
  callouts.set(names.filter((n) => parts.has(n) && PART_LABEL[n]).map((n) => ({ id: n, text: L(...PART_LABEL[n]), world: anchorOf(n) })));
  occlusionDirty = true;
}
// labels whose point is hidden behind other parts are dropped, tested when the view settles
let occlusionDirty = true, occlusionTimer = 0; const occluded = new Set();
const ray = new THREE.Raycaster();
function testOcclusion() {
  occluded.clear();
  if (state.mode !== 'driver' || !uniq) return;
  const cam = lab.camera.position;
  for (const it of callouts.items) {
    const p = it.world?.(); if (!p) continue;
    const d = p.clone().sub(cam); const dist = d.length(); ray.set(cam, d.normalize()); ray.far = dist - 0.02;
    const hit = ray.intersectObject(uniq, true).find((h) => !h.object.material.transparent && !(Array.isArray(h.object.material) && h.object.material[h.face?.materialIndex ?? 0]?.transparent));
    if (hit) occluded.add(it.id);
  }
  lab.invalidate();
}
callouts.setHidden((id) => occluded.has(id));

// ------------------------------------------------------------------ paths scene (metres)
const satin = (color, rough = 0.38) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: rough, clearcoat: 0.5, clearcoatRoughness: 0.2 });
const sourceLF = new THREE.Mesh(new THREE.SphereGeometry(0.045, 32, 20), satin('#3f6f95'));
const sourceHF = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 20), satin('#d08a3c'));
const listener = new THREE.Group();
{ // a simple listener: a head-sized form with two ears, facing the speaker
  const clay = new THREE.MeshPhysicalMaterial({ color: 0xc9cfd3, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.4 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 40, 28), clay); head.scale.set(0.82, 1.05, 0.95);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 20, 14), clay); ear.scale.set(0.5, 1.2, 0.8); ear.position.set(s * 0.074, 0, 0); head.add(ear); }
  listener.add(head);
}
// a baffle the two sources sit on, so the pair reads as a loudspeaker
const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.42, 0.04, 1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x1f2a36, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4 }));
baffle.position.set(0, 0, -0.025);
const pathLines = new THREE.Group();
paths.add(sourceLF, sourceHF, listener, pathLines, baffle);
// perceptual dark-to-bright ramp (the same in the scene and in the map)
const RAMP = [[0.06, 0.05, 0.12], [0.20, 0.13, 0.42], [0.55, 0.22, 0.42], [0.92, 0.45, 0.20], [0.99, 0.85, 0.35]];
function ramp(t, out, i) { t = Math.max(0, Math.min(1, t)) * (RAMP.length - 1); const k = Math.min(RAMP.length - 2, Math.floor(t)); const u = t - k; for (let c = 0; c < 3; c++) out[i + c] = Math.round(255 * (RAMP[k][c] * (1 - u) + RAMP[k + 1][c] * u)); }
const rampCSS = () => `linear-gradient(90deg, ${RAMP.map((c, i) => `rgb(${c.map((x) => Math.round(x * 255)).join(',')}) ${Math.round(100 * i / (RAMP.length - 1))}%`).join(', ')})`;
function pairSources() {
  const sep = state.layout === 'separated' ? SEP : 0;
  const [lr, li, hr, hi] = A.crossover(state.frequency, FC);
  return [
    { p: [0, -sep / 2, 0], amp: Math.hypot(lr, li), phase: Math.atan2(li, lr), delay: 0 },
    { p: [0, sep / 2, 0], amp: Math.hypot(hr, hi), phase: Math.atan2(hi, hr), delay: 0 },
  ];
}
const FIELD_RANGE = 30;   // dB from bright to dark on the plane
function updatePaths() {
  const sep = state.layout === 'separated' ? SEP : 0, a = state.angle * Math.PI / 180;
  sourceLF.position.set(0, -sep / 2, 0.02); sourceHF.position.set(0, sep / 2, 0.03);
  baffle.scale.y = state.layout === 'separated' ? 1 : 0.62;
  const lp = [0, R_LISTEN * Math.sin(a), R_LISTEN * Math.cos(a)];
  listener.position.set(...lp); listener.lookAt(0, 0, 0);
  while (pathLines.children.length) { const o = pathLines.children[0]; pathLines.remove(o); o.geometry.dispose(); o.material.dispose(); }
  for (const [src, color] of [[sourceLF, 0x3f6f95], [sourceHF, 0xd08a3c]]) {
    const g = new THREE.BufferGeometry().setFromPoints([src.position.clone(), listener.position.clone()]);
    pathLines.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })));
  }
  // the field on the vertical plane through the sources and the listener
  const n = 160;
  if (!fieldMesh) {
    fieldTex = new THREE.DataTexture(new Uint8Array(n * n * 4), n, n, THREE.RGBAFormat); fieldTex.colorSpace = THREE.SRGBColorSpace; fieldTex.magFilter = fieldTex.minFilter = THREE.LinearFilter;
    fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fieldTex, transparent: true, opacity: 0.96, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    fieldMesh.rotation.y = -Math.PI / 2; fieldMesh.renderOrder = -2; paths.add(fieldMesh);
  }
  const hu = 1.5, hv = 1.3, o = [-0.03, 0, 1.45];
  const f = A.fieldOnPlane(pairSources(), state.frequency, o, [0, 0, 1], [0, 1, 0], hu, hv, n);
  const sorted = Float32Array.from(f.db).sort(); const ref = sorted[Math.floor(sorted.length * 0.995)];
  const d = fieldTex.image.data;
  for (let i = 0; i < f.db.length; i++) {
    ramp(1 + (f.db[i] - ref) / FIELD_RANGE, d, i * 4);
    // fade the plane out at its edges so it reads as a slice of air, not a board
    const x = (i % n) / (n - 1), y = Math.floor(i / n) / (n - 1); const e = Math.min(x, 1 - x, y, 1 - y);
    d[i * 4 + 3] = Math.round(255 * Math.min(1, e / 0.08));
  }
  fieldTex.needsUpdate = true; fieldMesh.position.set(...o); fieldMesh.scale.set(2 * hu, 2 * hv, 1);
  // readouts
  const pd = A.pathDifference(sep, a, R_LISTEN, state.frequency);
  $('#path-value').textContent = (Math.abs(pd.d) * 1000).toFixed(1) + ' mm';
  $('#phase-value').textContent = Math.round(Math.abs(pd.phaseDeg)) + '°';
  const db = A.twoWayResponse(state.frequency, FC, [0, -sep / 2, 0], [0, sep / 2, 0], lp);
  $('#level-value').textContent = (db > 0 ? '+' : '') + db.toFixed(1) + ' dB';
  if (state.mode === 'paths') callouts.set([
    { id: 'hf', text: L('tweeter', 'ツイーター'), world: () => sourceHF.getWorldPosition(new THREE.Vector3()), side: 'right' },
    { id: 'lf', text: L('bass / midrange', '低中音'), world: () => sourceLF.getWorldPosition(new THREE.Vector3()), side: 'right' },
    { id: 'ls', text: L(`listener, ${state.angle}° off axis, 2 m`, `受聴点、軸から ${state.angle}°、2 m`), world: () => listener.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.09, 0)), side: 'left' },
  ]);
  drawMap();
}

// ------------------------------------------------------------------ the response map (2D)
let mapCache = { key: '', data: null };
function drawMap() {
  if (!analysis || analysis.hidden) return;
  const ctx = analysis.getContext('2d');
  const r = analysis.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1);
  if (!r.width) return;
  if (analysis.width !== Math.round(r.width * dpr) || analysis.height !== Math.round(r.height * dpr)) { analysis.width = Math.round(r.width * dpr); analysis.height = Math.round(r.height * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = r.width, h = r.height;
  ctx.clearRect(0, 0, w, h);
  const nF = 96, nA = 141, fLo = 300, fHi = 8000, aLo = -70, aHi = 70;
  const sep = state.layout === 'separated' ? SEP : 0;
  if (mapCache.key !== state.layout) mapCache = { key: state.layout, data: A.responseMap(fLo, fHi, nF, aLo, aHi, nA, FC, sep, R_LISTEN) };
  const x0 = 44, x1 = w - 12, y0 = 10, y1 = h - 44;
  const img = ctx.createImageData(nA, nF); const px = img.data;
  for (let j = 0; j < nF; j++) for (let i = 0; i < nA; i++) { const v = mapCache.data[j * nA + i]; const k = ((nF - 1 - j) * nA + i) * 4; ramp(1 + v / 18, px, k); px[k + 3] = 255; }   // 0 dB at the top of the ramp, −18 dB at the bottom
  const off = new OffscreenCanvas(nA, nF); off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, x0, y0, x1 - x0, y1 - y0);
  const ink = '#4f5c66';
  ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (const f of [300, 500, 1000, 2000, 5000]) { const y = y1 - Math.log(f / fLo) / Math.log(fHi / fLo) * (y1 - y0); ctx.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), x0 - 6, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const a of [-60, -30, 0, 30, 60]) { const x = x0 + (a - aLo) / (aHi - aLo) * (x1 - x0); ctx.fillText(a + '°', x, y1 + 14); }
  ctx.fillText(L('listening angle', '受聴角度'), (x0 + x1) / 2, y1 + 30);
  ctx.save(); ctx.translate(11, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(L('frequency, Hz', '周波数 (Hz)'), 0, 0); ctx.restore();
  // crossover line and the current setting
  const yc = y1 - Math.log(FC / fLo) / Math.log(fHi / fLo) * (y1 - y0);
  ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ffffff99'; ctx.beginPath(); ctx.moveTo(x0, yc); ctx.lineTo(x1, yc); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffffffd0'; ctx.textAlign = 'left'; ctx.fillText(L('crossover 2.5 kHz', 'クロスオーバー 2.5 kHz'), x0 + 6, yc - 5);
  const cx = x0 + (state.angle - aLo) / (aHi - aLo) * (x1 - x0), cy = y1 - Math.log(state.frequency / fLo) / Math.log(fHi / fLo) * (y1 - y0);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#ffffffaa'; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(cx - 7, cy); ctx.moveTo(cx + 7, cy); ctx.lineTo(x1, cy); ctx.moveTo(cx, y0); ctx.lineTo(cx, cy - 7); ctx.moveTo(cx, cy + 7); ctx.lineTo(cx, y1); ctx.stroke();
}

// ------------------------------------------------------------------ camera
function views(m, which) {
  const ex = state.explode / 100;
  if (m === 'paths') {
    // fit the 3.0 x 2.6 field plane (plus the listener) to the stage, whatever its shape
    const asp = lab ? lab.camera.aspect : 1, t = Math.tan(THREE.MathUtils.degToRad(lab ? lab.camera.fov : 30) / 2);
    const d = 1.12 * Math.max(1.45 / t, 1.62 / (t * asp));
    const dir = which === 'front' ? [1, 0.03, 0] : which === 'rear' ? [-1, 0.03, 0] : [0.9, 0.2, 0.36];
    const n = Math.hypot(...dir);
    return { target: [0, 0.05, 1.4], to: [dir[0] / n * d, 0.05 + dir[1] / n * d, 1.4 + dir[2] / n * d], min: 1.5, max: Math.max(9, d * 1.3) };
  }
  if (m === 'driver') {
    const f = which === 'hero' && focusSphere();
    if (f) {   // frame the selected group: same direction as the hero view, distance to fit
      const t = Math.tan(THREE.MathUtils.degToRad(lab.camera.fov) / 2), asp = Math.min(1, lab.camera.aspect);
      const d = Math.max(1.6, f.radius / (t * asp) * 1.25), dir = new THREE.Vector3(4.3, 2.0, 3.2).normalize();
      return { target: f.center.toArray(), to: f.center.clone().addScaledVector(dir, d).toArray(), min: 1.2, max: 11 };
    }
    return { target: [0, -0.05, 0.55 + ex * 0.9], to: which === 'front' ? [0.01, 0.15, 5.4 + ex * 1.2] : which === 'rear' ? [0.01, 0.4, -5.2] : [4.3, 2.0, 3.5 + ex * 1.6], min: 2.2, max: 11 };
  }
  return { target: [0, -0.08, 0], to: which === 'front' ? [0.01, 0.35, 7.0] : which === 'rear' ? [0.01, 0.6, -7.0] : [4.3, 1.9, 5.6], min: 3.7, max: 11 };
}
function focusSphere() {
  if (!uniq || state.part === 'all') return null;
  const sel = PART_GROUPS[state.part]; const box = new THREE.Box3();
  for (const [, node] of parts) if (sel(node.userData.part)) box.expandByObject(node);
  if (box.isEmpty()) return null;
  const s = box.getBoundingSphere(new THREE.Sphere()); return s;
}
function cameraView(which, instant = false) {
  state.camera = which; userOrbit = false; $$('[data-camera]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.camera === which)));
  if (!lab) return;
  const v = views(state.mode, which); const to = new THREE.Vector3(...v.to), target = new THREE.Vector3(...v.target);
  controls.minDistance = v.min; controls.maxDistance = v.max;
  if (instant || reduced.matches) { lab.camera.position.copy(to); controls.target.copy(target); controls.update(); transition = null; }
  else transition = { start: performance.now(), from: lab.camera.position.clone(), to, oldTarget: controls.target.clone(), target };
  // the driver section is a close-up: a shallow macro lens focused on the orbit target (WebGPU only)
  look?.stage({ macro: state.mode === 'driver', radius: to.distanceTo(target) * 0.3, ms: instant ? 0 : 750 });
  occlusionDirty = true; lab.invalidate();
}
function zoom(f) { if (!lab) return; transition = null; const d = lab.camera.position.clone().sub(controls.target); d.setLength(THREE.MathUtils.clamp(d.length() * f, controls.minDistance, controls.maxDistance)); lab.camera.position.copy(controls.target).add(d); controls.update(); occlusionDirty = true; lab.invalidate(); }

// ------------------------------------------------------------------ modes
function setMode(mode) {
  state.mode = mode; product.visible = mode === 'product'; driver.visible = mode === 'driver'; paths.visible = mode === 'paths';
  $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  const c = copy[mode]; const k = ja ? 4 : 0;
  $('#panel-number').textContent = c[k]; $('#panel-title').innerHTML = c[k + 1]; $('#panel-copy').textContent = c[k + 2]; $('#scene-caption').textContent = c[k + 3];
  $('#product-panel').hidden = mode !== 'product'; $('#driver-panel').hidden = mode !== 'driver'; $('#paths-panel').hidden = mode !== 'paths';
  host.closest('.viewport')?.setAttribute('data-mode', mode);
  const legend = $('#field-legend'); if (legend) legend.hidden = mode !== 'paths';
  if (analysis) analysis.hidden = mode !== 'paths';
  if (look?.floor) look.floor.visible = mode !== 'paths';
  callouts.set([]);
  if (mode === 'driver') { if (!uniq) loadDriver().then(() => { cameraView(state.camera, false); lab.invalidate(); }); else setDriverLabels(); }
  if (mode === 'paths') updatePaths();
  if (spin) { spin.set(mode === 'product'); lab?.setOnDemand(mode !== 'product' || reduced.matches); }
  cameraView('hero'); lab?.invalidate();
}
function setPart(part) {
  state.part = part; $$('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === part)));
  $('#part-note').textContent = L(...partNotes[part]); layoutDriver(); setDriverLabels();
  if (state.mode === 'driver' && state.camera === 'hero') cameraView('hero');
  lab?.invalidate();
}

// ------------------------------------------------------------------ mount
lab = await mountLab(canvas, {
  maxDpr: 1.75, onDemand: true, forceWebGL: new URLSearchParams(location.search).has('webgl'),
  camera: new THREE.PerspectiveCamera(30, 1, 0.05, 60),
  async setup({ renderer, scene, camera, lab: L_ }) {
    scene.add(product, driver, paths); driver.visible = false; paths.visible = false;
    look = await createStudio(L_, { hdriRes: '2k', dof: { bokeh: 0.9 }, scale: 3.2, center: [0, 0, 0.3], floorY: -1.43, hdri: 'softbox', strips: 'product', exposure: 1.0, envIntensity: 1.05, keyIntensity: 1.0, keyDir: [-0.25, 1, 0.3], shadowOpacity: 0.26, aoRadius: 0.16, aoThickness: 0.06, aoStrength: 1.0, toneMapping: 'neutral' });
    look.key.shadow.radius = 26; look.key.shadow.blurSamples = 24;   // a soft-box shadow, not a sun
    camera.position.set(4.3, 1.9, 5.6);
    controls = new OrbitControls(camera, canvas); controls.enableDamping = false; controls.enablePan = false; controls.enableZoom = false; controls.minDistance = 2; controls.maxDistance = 12; controls.maxPolarAngle = Math.PI * 0.85;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE; look.attach(controls);
    canvas.addEventListener('touchstart', (e) => { controls.enableZoom = e.touches.length > 1; }, { passive: true });
    controls.addEventListener('change', () => { occlusionDirty = true; L_.invalidate(); }); controls.addEventListener('start', () => { transition = null; userOrbit = true; });
    spin = turntable(controls, canvas, { speed: 0.45, resumeAfter: 9000 });
    return {
      update() {
        if (transition) { const t = Math.min(1, (performance.now() - transition.start) / 750), s = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; camera.position.lerpVectors(transition.from, transition.to, s); controls.target.lerpVectors(transition.oldTarget, transition.target, s); controls.update(); if (t >= 1) transition = null; else L_.invalidate(); }
        else if (controls.autoRotate && state.mode === 'product') { controls.update(); spin.tick(); }
        else if (state.mode === 'product') spin.tick();
        callouts.update(camera);
        if (occlusionDirty && !transition) { clearTimeout(occlusionTimer); occlusionDirty = false; occlusionTimer = setTimeout(testOcclusion, 160); }
      },
      render: look.render,
      dispose() { spin.dispose(); look.dispose(); controls.dispose(); },
    };
  },
});
if (lab) {
  loadProduct();
  // click a part in driver mode
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || state.mode !== 'driver' || !uniq) return;
    const rect = canvas.getBoundingClientRect(); const r = new THREE.Raycaster();
    r.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), lab.camera);
    const hit = r.intersectObject(uniq, true).find((h) => h.object.userData.part && !(Array.isArray(h.object.material) ? h.object.material[0] : h.object.material).transparent);
    if (hit) { const p = hit.object.userData.part; setPart(p.name === 'waveguide' ? 'guide' : p.component === 'damping' ? 'damping' : p.component === 'tweeter' ? 'tweeter' : 'cone'); }
  });
  new ResizeObserver(() => drawMap()).observe(analysis);
  const fl = $('#field-legend i'); if (fl) fl.style.background = rampCSS();
  const ml = $('#map-legend i'); if (ml) ml.style.background = rampCSS();
} else { $('#load').textContent = L('3D rendering is unavailable in this browser. The explanation and source links below remain available.', 'このブラウザでは 3D 描画を利用できない。下の説明と出典はそのまま読める。'); }

$$('[data-mode]').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
$$('[data-camera]').forEach((b) => b.onclick = () => { spin?.set(false); lab?.setOnDemand(true); cameraView(b.dataset.camera); });
$$('[data-part]').forEach((b) => b.onclick = () => setPart(b.dataset.part));
$$('[data-layout]').forEach((b) => b.onclick = () => { state.layout = b.dataset.layout; $$('[data-layout]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); updatePaths(); lab?.invalidate(); });
$('#explode').oninput = (e) => { state.explode = +e.target.value; $('#explode-value').textContent = state.explode + '%'; layoutDriver(); if (state.camera === 'hero' && !userOrbit) cameraView('hero', true); lab?.invalidate(); };
$('#angle').oninput = (e) => { state.angle = +e.target.value; $('#angle-value').textContent = state.angle + '°'; updatePaths(); lab?.invalidate(); };
$('#frequency').oninput = (e) => { state.frequency = +e.target.value; $('#frequency-value').textContent = state.frequency.toLocaleString(ja ? 'ja-JP' : 'en-GB') + ' Hz'; updatePaths(); lab?.invalidate(); };
$('#reset').onclick = () => { state.explode = 0; $('#explode').value = 0; $('#explode-value').textContent = '0%'; state.angle = 30; $('#angle').value = 30; $('#angle-value').textContent = '30°'; state.frequency = 2000; $('#frequency').value = 2000; $('#frequency-value').textContent = '2,000 Hz'; state.layout = 'coincident'; $$('[data-layout]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.layout === 'coincident'))); layoutDriver(); if (state.mode === 'paths') updatePaths(); cameraView('hero'); };
$('#zoom-in').onclick = () => zoom(0.85); $('#zoom-out').onclick = () => zoom(1 / 0.85);
$('#inspect')?.addEventListener('click', () => setMode('driver'));
window.experience = { state, setMode, cameraView, setPart, lab, callouts };
setMode(state.mode); cameraView('hero', true);
