/* KEF Coda W, inside Uni-Q: the scene.
 * Product mode shows KEF's own Coda W model (credited in credits.txt).  Driver
 * mode loads a three-quarter section of a 12th-generation Uni-Q built in
 * Blender (assets/uniq.glb, blender/build_uniq.py) from KEF's published
 * descriptions: the tweeter on its own motor inside the mid/bass voice coil,
 * a radial-channel waveguide over the dome, Z-flex surround and trim ring,
 * cone-neck decoupler, gap damper, conical duct and undercut pole.  Paths mode computes
 * the summed response of a two-way pair with a fourth-order Linkwitz-Riley
 * crossover, coincident or separated, across angle and frequency. */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mountLab } from '/assets/lab-kit/lab-kit.js';
import * as A from './acoustics.js';

const ja = document.documentElement.lang === 'ja';
const L = (en, jp) => (ja ? jp : en);
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const ASSETS = new URL('./assets/', import.meta.url).href;
const state = { mode: 'product', camera: 'hero', part: 'all', explode: 0, layout: 'coincident', angle: 30, frequency: 2000 };
const FC = 2500, SEP = 0.13, R_LISTEN = 2.0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const host = $('#scene');
const canvas = document.createElement('canvas'); canvas.id = 'stage'; canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
const labelLayer = document.createElement('div'); labelLayer.id = 'scene-labels'; labelLayer.setAttribute('aria-hidden', 'true'); host.appendChild(labelLayer);
const analysis = $('#analysis');
let lab = null, controls = null, transition = null;
const product = new THREE.Group(), driver = new THREE.Group(), paths = new THREE.Group();
let uniq = null, uniqMeta = null; const parts = new Map(); const groups = new Map();
let fieldMesh = null, fieldTex = null; let labels = [];

const copy = {
  product: ['01 / PRODUCT', 'A stereo system.<br>A shared centre.', 'Coda W places a 25 mm aluminium tweeter inside a 130 mm bass/midrange cone. Each speaker uses a 12th-generation Uni-Q array.', 'KEF product model · Midnight Blue',
    '01 / 製品', 'ステレオシステム。<br>中心を共有する。', 'Coda W は 130 mm の低中音コーンの中に 25 mm のアルミニウム製ツイーターを置く。各スピーカーは第 12 世代の Uni-Q アレイを使う。', 'KEF 製品モデル · Midnight Blue'],
  driver: ['02 / DRIVER ANATOMY', 'Two drivers.<br>One axis.', 'A 12th-generation Uni-Q, cut away. The 25 mm dome sits on its own small motor inside the bore of the bass/midrange pole, so it radiates from the apex of the cone; the cone, the Z-flex surround and the trim ring then carry on as its waveguide. Behind the dome, the rear wave leaves through a duct in the centre poles. Separate the parts to see how they nest.', '12th-gen Uni-Q · section from KEF\'s published architecture',
    '02 / ドライバーの構造', '2 つのドライバー、<br>1 本の軸。', '第 12 世代 Uni-Q の断面である。25 mm のドームは低中音側のポールの穴の中に据えた専用の小さな磁気回路に載り、コーンの頂点から放射する。その先はコーン、Z-flex エッジ、トリムリングがそのまま導波路になる。ドームの背面の音は中心のポールを貫くダクトから抜ける。部品を分離して、入れ子の構造を見てみよう。', '第 12 世代 Uni-Q · KEF の公表構成に基づく断面'],
  paths: ['03 / THE GEOMETRY', 'Why the axis matters.', 'A computed two-way response: woofer and tweeter through a fourth-order Linkwitz-Riley crossover at 2.5 kHz, summed at a listener 2 m away. Coincident sources add the same way at every angle. Separated sources add with a path difference that changes with angle, so the crossover region develops a dip that moves as you move.', 'Ideal sources · LR4 crossover · c = 343 m/s',
    '03 / 幾何', '軸が重要な理由。', '計算した 2 ウェイ応答である。ウーファーとツイーターを 2.5 kHz の 4 次リンクウィッツ・ライリー型クロスオーバーに通し、2 m 先の受聴点で足し合わせる。同軸の音源はどの角度でも同じように足し合わさる。離れた音源は角度で変わる経路差をもって足し合わさるので、クロスオーバー帯域に動く谷が生じる。', '理想音源 · LR4 クロスオーバー · c = 343 m/s'],
};
const partNotes = {
  all: ['The tweeter sits inside the bass/midrange voice coil, at the apex of the cone. Select a part to read its role, or click it in the model.', 'ツイーターは低中音のボイスコイルの内側、コーンの頂点に座る。部品を選ぶか、モデル上でクリックすると役割が読める。'],
  cone: ['A 130 mm magnesium/aluminium cone on a large voice coil. A flexible link decouples the cone neck from the former; the Z-flex surround folds below the line of the cone so that cone, surround and trim ring read to the tweeter as one smooth waveguide. The motor has an undercut pole and aluminium rings above and below the gap to steady the coil\'s inductance. Its hollow pole is what makes room for the tweeter.', '130 mm のマグネシウム・アルミニウム合金コーンを大径のボイスコイルが駆動する。コーンのネックとボビンの間には柔らかい結合材が入る。Z-flex エッジはコーンの線より下で折り返すので、コーン、エッジ、トリムリングがツイーターから見て一続きの滑らかな導波路になる。磁気回路はアンダーカットしたポールと、ギャップの上下のアルミリングでコイルのインダクタンス変動を抑える。ポールが中空であることがツイーターの居場所をつくる。'],
  tweeter: ['A 25 mm vented aluminium dome on its own neodymium motor, with a copper sleeve on the pole, mounted inside the bore of the bass/midrange pole. Its surround support is the first stretch of the waveguide; the narrow annular gap between that support and the cone neck is where the two drivers meet.', '25 mm の通気型アルミニウムドームで、ポールに銅スリーブを被せた専用のネオジム磁気回路に載り、低中音側ポールの穴の中に据えられる。エッジの支持部が導波路の最初の区間であり、支持部とコーンのネックの間の細い環状の隙間で 2 つのドライバーが接する。'],
  guide: ['A radial-channel phase plug over the dome, the idea behind KEF\'s Tangerine waveguide: fins that narrow the channels towards the rim load the dome slightly and even out the path lengths from its surface. KEF does not publish the fin count or profile, so both are representative here.', 'ドームを覆う放射状チャンネル型のフェーズプラグで、KEF の Tangerine 導波路の考え方である。外周に向かって溝を狭めるフィンがドームをわずかに負荷し、ドーム表面からの経路長をそろえる。KEF はフィンの数と形状を公表していないので、ここでは代表値である。'],
  damping: ['What happens behind the dome. The rear wave leaves through a slightly tapered duct in the centre poles, with porous fill, into an absorbing chamber; the gap damper, two rings of wadding between the two magnets, soaks up the resonance of the annular gap between tweeter and cone. The chamber is representative: Coda W is not listed with MAT.', 'ドームの背後の処理である。背面の音は中心のポールを貫く、わずかにテーパーの付いたダクトを通り、多孔質材を経て吸音室へ抜ける。2 つの磁石の間に置いた 2 本のリング状の吸音材（ギャップダンパー）が、ツイーターとコーンの間の環状の隙間の共鳴を吸収する。吸音室は代表的な形であり、Coda W は MAT 搭載とされていない。'],
};
const PART_GROUPS = { cone: (p) => p.component === 'mid', tweeter: (p) => p.component === 'tweeter' && p.name !== 'waveguide', guide: (p) => p.name === 'waveguide', damping: (p) => p.component === 'damping' };

// ------------------------------------------------------------------ models
function loadGLB(url) { return new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej)); }
async function loadProduct() {
  try {
    const g = await loadGLB('/kef-coda-w/coda-w.glb');
    const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group(); wrapper.add(g.scene); g.scene.position.sub(center); wrapper.scale.setScalar(2.85 / size.y); product.add(wrapper);
    $('#load').hidden = true; window.modelEvidence = { size: size.toArray(), meshes: 0 }; g.scene.traverse((o) => { if (o.isMesh) window.modelEvidence.meshes++; });
  } catch (e) { $('#load').textContent = L('The product model could not load. Try “Inside Uni-Q” to explore the driver.', '製品モデルを読み込めなかった。「Inside Uni-Q」でドライバーを見てほしい。'); }
  lab.invalidate();
}
async function loadDriver() {
  const [g, m] = await Promise.all([loadGLB(ASSETS + 'uniq.glb'), fetch(ASSETS + 'uniq-meta.json').then((r) => r.json())]);
  uniqMeta = m; uniq = g.scene;
  const byName = new Map(m.parts.map((p) => [p.name, p]));
  uniq.traverse((o) => {
    if (!o.isMesh) return; const p = byName.get(o.name); if (!p) return;
    o.material = o.material.clone(); o.material.envMapIntensity = 1.0;
    o.userData.part = p; o.userData.base = o.position.clone(); o.userData.explode = new THREE.Vector3(p.explode[0], p.explode[2], -p.explode[1]);
    o.userData.baseOpacity = o.material.transparent ? o.material.opacity : 1; o.userData.baseColor = o.material.color.clone();
    parts.set(o.name, o);
  });
  uniq.scale.setScalar(0.016);             // 1 scene unit = 62.5 mm
  uniq.rotation.x = Math.PI / 2;           // driver axis +Y in the file -> +Z, facing the camera
  uniq.position.set(0, 0, 0.75);
  driver.add(uniq);
  layoutDriver();
}
function layoutDriver() {
  if (!uniq) return;
  const s = state.explode / 100;
  const sel = state.part === 'all' ? null : PART_GROUPS[state.part];
  for (const [name, o] of parts) {
    const p = o.userData.part;
    o.position.copy(o.userData.base).addScaledVector(o.userData.explode, s * 1.2);
    const dim = sel && !sel(p);
    o.material.transparent = dim || o.userData.baseOpacity < 1;
    o.material.opacity = dim ? 0.3 : o.userData.baseOpacity;
    o.material.color.copy(o.userData.baseColor).multiplyScalar(dim ? 0.35 : 1);
    o.material.depthWrite = !dim;
  }
}

// ------------------------------------------------------------------ paths scene (metres)
const mat = (color, metalness = 0.3, roughness = 0.4) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const sourceLF = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), mat('#355f80'));
const sourceHF = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), mat('#b77730'));
const listener = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), mat('#172632'));
const pathLines = new THREE.Group();
paths.add(sourceLF, sourceHF, listener, pathLines);
const RAMP = [[0.06, 0.05, 0.12], [0.20, 0.13, 0.42], [0.55, 0.22, 0.42], [0.92, 0.45, 0.20], [0.99, 0.85, 0.35]];
function ramp(t, out, i) { t = Math.max(0, Math.min(1, t)) * (RAMP.length - 1); const k = Math.min(RAMP.length - 2, Math.floor(t)); const u = t - k; for (let c = 0; c < 3; c++) out[i + c] = Math.round(255 * (RAMP[k][c] * (1 - u) + RAMP[k + 1][c] * u)); }
function pairSources() {
  const sep = state.layout === 'separated' ? SEP : 0;
  const [lr, li, hr, hi] = A.crossover(state.frequency, FC);
  return [
    { p: [0, -sep / 2, 0], amp: Math.hypot(lr, li), phase: Math.atan2(li, lr), delay: 0 },
    { p: [0, sep / 2, 0], amp: Math.hypot(hr, hi), phase: Math.atan2(hi, hr), delay: 0 },
  ];
}
function updatePaths() {
  const sep = state.layout === 'separated' ? SEP : 0, a = state.angle * Math.PI / 180;
  sourceLF.position.set(0, -sep / 2, 0); sourceHF.position.set(0, sep / 2, 0.003);
  const lp = [0, R_LISTEN * Math.sin(a), R_LISTEN * Math.cos(a)];
  listener.position.set(...lp);
  while (pathLines.children.length) { const o = pathLines.children[0]; pathLines.remove(o); o.geometry.dispose(); o.material.dispose(); }
  for (const [src, color] of [[sourceLF, 0x355f80], [sourceHF, 0xb77730]]) {
    const g = new THREE.BufferGeometry().setFromPoints([src.position.clone(), listener.position.clone()]);
    pathLines.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })));
  }
  // the field on the vertical plane through the sources and the listener
  const n = 128;
  if (!fieldMesh) {
    fieldTex = new THREE.DataTexture(new Uint8Array(n * n * 4), n, n, THREE.RGBAFormat); fieldTex.colorSpace = THREE.SRGBColorSpace; fieldTex.magFilter = fieldTex.minFilter = THREE.LinearFilter;
    fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fieldTex, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    fieldMesh.rotation.y = -Math.PI / 2; paths.add(fieldMesh);
  }
  const hu = 1.6, hv = 1.6, o = [-0.01, 0, 1.4];
  const f = A.fieldOnPlane(pairSources(), state.frequency, o, [0, 0, 1], [0, 1, 0], hu, hv, n);
  const sorted = Float32Array.from(f.db).sort(); const ref = sorted[Math.floor(sorted.length * 0.995)];
  const d = fieldTex.image.data;
  for (let i = 0; i < f.db.length; i++) { ramp(1 + (f.db[i] - ref) / 40, d, i * 4); d[i * 4 + 3] = 255; }
  fieldTex.needsUpdate = true; fieldMesh.position.set(...o); fieldMesh.scale.set(2 * hu, 2 * hv, 1);
  // readouts
  const pd = A.pathDifference(sep, a, R_LISTEN, state.frequency);
  $('#path-value').textContent = (Math.abs(pd.d) * 1000).toFixed(1) + ' mm';
  $('#phase-value').textContent = Math.round(Math.abs(pd.phaseDeg)) + '°';
  const db = A.twoWayResponse(state.frequency, FC, [0, -sep / 2, 0], [0, sep / 2, 0], lp);
  $('#level-value').textContent = (db > 0 ? '+' : '') + db.toFixed(1) + ' dB';
  setLabels([
    { text: L('bass / midrange', '低中音'), point: new THREE.Vector3(0, -sep / 2 - 0.12, 0) },
    { text: L('tweeter', 'ツイーター'), point: new THREE.Vector3(0, sep / 2 + 0.12, 0) },
    { text: L('listener', '受聴点'), point: new THREE.Vector3(lp[0], lp[1] + 0.2, lp[2]) },
  ]);
  drawMap();
}

// ------------------------------------------------------------------ the response map (2D)
let mapCache = { key: '', data: null };
function drawMap() {
  if (!analysis || analysis.hidden) return;
  const ctx = analysis.getContext('2d');
  const r = analysis.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1);
  if (analysis.width !== Math.round(r.width * dpr)) { analysis.width = Math.round(r.width * dpr); analysis.height = Math.round(r.height * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = r.width, h = r.height;
  ctx.clearRect(0, 0, w, h);
  const nF = 96, nA = 141, fLo = 300, fHi = 8000, aLo = -70, aHi = 70;
  const sep = state.layout === 'separated' ? SEP : 0;
  if (mapCache.key !== state.layout) mapCache = { key: state.layout, data: A.responseMap(fLo, fHi, nF, aLo, aHi, nA, FC, sep, R_LISTEN) };
  const x0 = 38, x1 = w - 10, y0 = 18, y1 = h - 26;
  const img = ctx.createImageData(nA, nF); const px = img.data;
  for (let j = 0; j < nF; j++) for (let i = 0; i < nA; i++) { const v = mapCache.data[j * nA + i]; const k = ((nF - 1 - j) * nA + i) * 4; ramp(1 + v / 18, px, k); px[k + 3] = 255; }   // 0 dB at the top of the ramp, −18 dB at the bottom
  const off = new OffscreenCanvas(nA, nF); off.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, x0, y0, x1 - x0, y1 - y0);
  ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = '#59656e'; ctx.strokeStyle = '#59656e'; ctx.lineWidth = 1;
  for (const f of [300, 500, 1000, 2000, 5000]) { const y = y1 - Math.log(f / fLo) / Math.log(fHi / fLo) * (y1 - y0); ctx.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), 4, y + 4); }
  for (const a of [-60, -30, 0, 30, 60]) { const x = x0 + (a - aLo) / (aHi - aLo) * (x1 - x0); ctx.fillText(a + '°', x - 9, h - 8); }
  const cx = x0 + (state.angle - aLo) / (aHi - aLo) * (x1 - x0), cy = y1 - Math.log(state.frequency / fLo) / Math.log(fHi / fLo) * (y1 - y0);
  ctx.strokeStyle = '#ffffffcc'; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.stroke();
  ctx.fillStyle = '#59656e'; ctx.fillText(L('summed level at 2 m, angle × frequency: 0 dB bright, −18 dB dark', '2 m での合成レベル、角度 × 周波数：明が 0 dB、暗が −18 dB'), x0, 12);
}

// ------------------------------------------------------------------ labels
function setLabels(items) { labels = items.map((it) => { const el = document.createElement('div'); el.className = 'scene-label'; el.textContent = it.text; return { ...it, el }; }); labelLayer.replaceChildren(...labels.map((x) => x.el)); }
function projectLabels() {
  if (!lab || state.mode !== 'paths') { for (const l of labels) l.el.hidden = true; return; }
  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const l of labels) { const p = l.point.clone().project(lab.camera); l.el.style.left = ((p.x * 0.5 + 0.5) * w) + 'px'; l.el.style.top = ((-p.y * 0.5 + 0.5) * h) + 'px'; l.el.hidden = p.z > 1; }
}

// ------------------------------------------------------------------ camera
function cameraView(which, instant = false) {
  state.camera = which; $$('[data-camera]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.camera === which)));
  if (!lab) return;
  const m = state.mode; let to; const target = new THREE.Vector3(0, 0, 0);
  if (m === 'paths') { target.set(0, 0, 1.0); to = which === 'front' ? new THREE.Vector3(4.6, 0, 1.0) : which === 'rear' ? new THREE.Vector3(-4.6, 0, 1.0) : new THREE.Vector3(4.4, 2.0, 4.4); controls.minDistance = 1.5; controls.maxDistance = 9; }
  else if (m === 'driver') { target.set(0, 0, 0.4); to = which === 'front' ? new THREE.Vector3(0.01, 0.2, 5.6) : which === 'rear' ? new THREE.Vector3(0.01, 0.4, -5.6) : new THREE.Vector3(4.9, 2.3, 3.1); controls.minDistance = 2.2; controls.maxDistance = 10; }
  else { to = which === 'front' ? new THREE.Vector3(0.01, 0.3, 6.4) : which === 'rear' ? new THREE.Vector3(0.01, 0.6, -6.4) : new THREE.Vector3(4.1, 2.1, 5.5); controls.minDistance = 3.7; controls.maxDistance = 10; }
  if (instant || reduced.matches) { lab.camera.position.copy(to); controls.target.copy(target); controls.update(); transition = null; }
  else transition = { start: performance.now(), from: lab.camera.position.clone(), to, oldTarget: controls.target.clone(), target };
  lab.invalidate();
}
function zoom(f) { if (!lab) return; transition = null; const d = lab.camera.position.clone().sub(controls.target); d.setLength(THREE.MathUtils.clamp(d.length() * f, controls.minDistance, controls.maxDistance)); lab.camera.position.copy(controls.target).add(d); controls.update(); lab.invalidate(); }

// ------------------------------------------------------------------ modes
function setMode(mode) {
  state.mode = mode; product.visible = mode === 'product'; driver.visible = mode === 'driver'; paths.visible = mode === 'paths';
  $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  const c = copy[mode]; const k = ja ? 4 : 0;
  $('#panel-number').textContent = c[k]; $('#panel-title').innerHTML = c[k + 1]; $('#panel-copy').textContent = c[k + 2]; $('#scene-caption').textContent = c[k + 3];
  $('#product-panel').hidden = mode !== 'product'; $('#driver-panel').hidden = mode !== 'driver'; $('#paths-panel').hidden = mode !== 'paths';
  if (analysis) analysis.hidden = mode !== 'paths';
  if (mode === 'driver' && !uniq) loadDriver().then(() => lab.invalidate());
  if (mode === 'paths') updatePaths();
  cameraView('hero'); lab?.invalidate();
}
function setPart(part) {
  state.part = part; $$('[data-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === part)));
  $('#part-note').textContent = L(...partNotes[part]); layoutDriver(); lab?.invalidate();
}

// ------------------------------------------------------------------ mount
lab = await mountLab(canvas, {
  maxDpr: 1.7, onDemand: true,
  camera: new THREE.PerspectiveCamera(35, 1, 0.01, 60),
  async setup({ renderer, scene, camera }) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    scene.background = new THREE.Color('#e9edef');
    const pmrem = new THREE.PMREMGenerator(renderer); const env = new RoomEnvironment(); scene.environment = pmrem.fromScene(env, 0.04).texture; env.dispose?.();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6e8090, 1.0)); const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 5); scene.add(key); const fill = new THREE.DirectionalLight(0xd1e4fa, 1.2); fill.position.set(-5, 1, -3); scene.add(fill);
    scene.add(product, driver, paths); driver.visible = false; paths.visible = false;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.1, 72), new THREE.MeshBasicMaterial({ color: 0xdbe1e5, transparent: true, opacity: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.45; product.add(floor);
    const dfloor = floor.clone(); dfloor.position.y = -1.6; driver.add(dfloor);
    camera.position.set(4.1, 2.1, 5.5);
    controls = new OrbitControls(camera, canvas); controls.enableDamping = false; controls.enablePan = false; controls.enableZoom = false; controls.minDistance = 2; controls.maxDistance = 12; controls.maxPolarAngle = Math.PI * 0.85;
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    canvas.addEventListener('touchstart', (e) => { controls.enableZoom = e.touches.length > 1; }, { passive: true });
    controls.addEventListener('change', () => lab.invalidate()); controls.addEventListener('start', () => { transition = null; });
    return {
      update() {
        if (transition) { const t = Math.min(1, (performance.now() - transition.start) / 650), s = 1 - Math.pow(1 - t, 3); camera.position.lerpVectors(transition.from, transition.to, s); controls.target.lerpVectors(transition.oldTarget, transition.target, s); controls.update(); if (t >= 1) transition = null; else lab.invalidate(); }
        projectLabels();
      },
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
    const rect = canvas.getBoundingClientRect(); const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), lab.camera);
    const hit = ray.intersectObject(uniq, true).find((h) => h.object.userData.part && h.object.material.opacity > 0.5);
    if (hit) { const p = hit.object.userData.part; setPart(p.name === 'waveguide' ? 'guide' : p.component === 'damping' ? 'damping' : p.component === 'tweeter' ? 'tweeter' : 'cone'); }
  });
  new ResizeObserver(() => drawMap()).observe(analysis);
} else { $('#load').textContent = L('3D rendering is unavailable in this browser. The explanation and source links below remain available.', 'このブラウザでは 3D 描画を利用できない。下の説明と出典はそのまま読める。'); }

$$('[data-mode]').forEach((b) => b.onclick = () => setMode(b.dataset.mode));
$$('[data-camera]').forEach((b) => b.onclick = () => cameraView(b.dataset.camera));
$$('[data-part]').forEach((b) => b.onclick = () => setPart(b.dataset.part));
$$('[data-layout]').forEach((b) => b.onclick = () => { state.layout = b.dataset.layout; $$('[data-layout]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); updatePaths(); lab?.invalidate(); });
$('#explode').oninput = (e) => { state.explode = +e.target.value; $('#explode-value').textContent = state.explode + '%'; layoutDriver(); lab?.invalidate(); };
$('#angle').oninput = (e) => { state.angle = +e.target.value; $('#angle-value').textContent = state.angle + '°'; updatePaths(); lab?.invalidate(); };
$('#frequency').oninput = (e) => { state.frequency = +e.target.value; $('#frequency-value').textContent = state.frequency.toLocaleString(ja ? 'ja-JP' : 'en-GB') + ' Hz'; updatePaths(); lab?.invalidate(); };
$('#reset').onclick = () => { state.explode = 0; $('#explode').value = 0; $('#explode-value').textContent = '0%'; state.angle = 30; $('#angle').value = 30; $('#angle-value').textContent = '30°'; state.frequency = 2000; $('#frequency').value = 2000; $('#frequency-value').textContent = '2,000 Hz'; state.layout = 'coincident'; $$('[data-layout]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.layout === 'coincident'))); layoutDriver(); if (state.mode === 'paths') updatePaths(); cameraView('hero'); };
$('#zoom-in').onclick = () => zoom(0.85); $('#zoom-out').onclick = () => zoom(1 / 0.85);
$('#inspect')?.addEventListener('click', () => setMode('driver'));
window.experience = { state, setMode, cameraView, setPart, lab };
setMode(state.mode); cameraView('hero', true);
