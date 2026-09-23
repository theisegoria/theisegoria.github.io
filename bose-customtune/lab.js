/* How my headphones measure my ears: scene, plots and controls.
 * Physics and control live in model.js (pure, tested in Node). This file draws
 * a cut-away of an earcup or an earbud on a head, the air inside it, the chime,
 * and three plots that report what the microphone heard, what the noise
 * cancelling loop became, and what reaches the eardrum. */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { texture, uniform, select, frontFacing, vec2, vec3, float, mix, smoothstep, cross, positionWorld, normalWorld, cameraPosition, normalView, positionViewDirection, mx_noise_float } from 'three/tsl';
import { mountLab, bindControls, readColors, onThemeChange } from '/assets/lab-kit/lab-kit.js';
import * as M from './model.js';

const JA = document.documentElement.lang === 'ja';
const T = JA ? {
  fb: 'フィードバックマイク', ff: 'フィードフォワードマイク', driver: 'ドライバー', canal: '外耳道', drum: '鼓膜',
  cushion: 'イヤーパッド', bone: '側頭骨', leak: '漏れ', tip: 'イヤーチップ',
  p1: 'マイクが聞いたもの', p1s: '基準の耳との差、dB', p2: 'ノイズキャンセリングのループゲイン', p2s: '|G_sd·K_fb|、dB',
  p3: '鼓膜に届くもの', p3s: '基準の耳との差、dB',
  target: '設計目標', before: '固定フィルター', after: 'CustomTune後', eqOff: 'EQなし', eqOn: '個人EQあり', meas: 'チャイムの測定点',
  qw: '外耳道の1/4波長共鳴', leakA: '漏れ面積', xo: 'クロスオーバー', pm: '位相余裕', anc: 'フィードバックによる低域の静かさ（50〜500 Hz）',
  est: '鼓膜での誤差（100 Hz〜8 kHzのRMS）', unstable: '不安定（ハウリング）', stale: '前回の装着で測ったフィルター', howl: 'この耳では固定フィルターが発振する',
  noLoss: '', mm: 'mm', mm2: 'mm²',
} : {
  fb: 'feedback microphone', ff: 'feedforward microphones', driver: 'driver', canal: 'ear canal', drum: 'eardrum',
  cushion: 'cushion', bone: 'temporal bone', leak: 'leak', tip: 'ear tip',
  p1: 'What the microphone hears', p1s: 'difference from the reference ear, dB', p2: 'The noise-cancelling loop', p2s: '|G_sd·K_fb|, dB',
  p3: 'What reaches the eardrum', p3s: 'difference from the reference ear, dB',
  target: 'design target', before: 'fixed filter', after: 'after CustomTune', eqOff: 'no EQ', eqOn: 'with the personal EQ', meas: 'chime measurements',
  qw: 'canal quarter-wave', leakA: 'leak area', xo: 'crossover', pm: 'phase margin', anc: 'feedback quieting, 50 to 500 Hz',
  est: 'eardrum error, RMS 100 Hz to 8 kHz', unstable: 'unstable (it would howl)', stale: 'filter measured on the previous fit', howl: 'the fixed filter oscillates on this ear',
  mm: 'mm', mm2: 'mm²',
};

const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');
const labelsEl = document.getElementById('labels');
const plotsEl = document.getElementById('plots');

const params = { form: 'overear', canal: 25, leak: 0.1, probe: 3.4, auto: true, sound: true, labels: true, cutaway: true };

// ---------- state of the measurement ----------
const state = {
  seed: 0,
  tuned: null,          // result of customTune for the fit it was measured on
  tunedFor: null,       // { form, L, x }
  morph: 1,             // 0..1, filter gains shown as a fraction of tuned
  reveal: 1,            // 0..1, how many measurement dots are shown
  chimeT: -1,           // seconds since the chime started, -1 when idle
};
const formObj = () => M.FORMS[params.form];
const Lm = () => params.canal / 1000;

function measure() {
  state.seed++;
  state.tuned = M.customTune(formObj(), Lm(), params.leak, { seed: state.seed });
  state.tunedFor = { form: params.form, L: Lm(), x: params.leak };
}
const staleness = () => !state.tunedFor || state.tunedFor.form !== params.form || Math.abs(state.tunedFor.L - Lm()) > 1e-6 || Math.abs(state.tunedFor.x - params.leak) > 1e-6;

// ---------- audio: the chime, synthesised from the patent's tone set ----------
let actx = null;
function playChime() {
  if (!params.sound) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const per = M.chimePeriod();
    const sr = actx.sampleRate;
    const dur = 0.42;
    const n = Math.round(sr * dur);
    const buf = actx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    // resample the 48 kHz period to the context rate; the tones stay the same
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const pos = (t * M.FS) % M.NFFT;
      const i0 = Math.floor(pos), fr = pos - i0;
      const v = per[i0] * (1 - fr) + per[(i0 + 1) % M.NFFT] * fr;
      const env = Math.min(1, t / 0.012) * Math.exp(-t / 0.16);
      d[i] = v * env * 0.22;
    }
    const src = actx.createBufferSource();
    src.buffer = buf; src.connect(actx.destination); src.start();
  } catch (e) { /* no audio is fine */ }
}

// ---------- plots (SVG, redrawn from the model) ----------
const PW = 320, PH = 190, PAD = { l: 34, r: 8, t: 10, b: 24 };
function makePlot(title, sub) {
  const fig = document.createElement('figure');
  fig.className = 'ct-plot';
  fig.innerHTML = `<figcaption><b>${title}</b><span>${sub}</span></figcaption>
  <svg viewBox="0 0 ${PW} ${PH}" role="img" aria-label="${title}"><g class="ax"></g><g class="series"></g><g class="marks"></g></svg>
  <div class="ct-legend"></div>`;
  plotsEl.appendChild(fig);
  return fig;
}
const plots = plotsEl ? [makePlot(T.p1, T.p1s), makePlot(T.p2, T.p2s), makePlot(T.p3, T.p3s)] : [];

function axes(fig, f0, f1, y0, y1, yStep) {
  const ax = fig.querySelector('.ax');
  const X = (f) => PAD.l + (PW - PAD.l - PAD.r) * Math.log(f / f0) / Math.log(f1 / f0);
  const Y = (v) => PAD.t + (PH - PAD.t - PAD.b) * (1 - (v - y0) / (y1 - y0));
  let s = '';
  for (const f of [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]) {
    if (f < f0 || f > f1) continue;
    const major = [100, 1000, 10000].includes(f);
    s += `<line class="${major ? 'g1' : 'g0'}" x1="${X(f)}" x2="${X(f)}" y1="${PAD.t}" y2="${PH - PAD.b}"/>`;
    if ([20, 100, 1000, 10000].includes(f) || f === f0) s += `<text x="${X(f)}" y="${PH - 8}" text-anchor="middle">${f >= 1000 ? f / 1000 + 'k' : f}</text>`;
  }
  for (let v = y0; v <= y1 + 1e-9; v += yStep) {
    s += `<line class="${v === 0 ? 'g2' : 'g0'}" x1="${PAD.l}" x2="${PW - PAD.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    s += `<text x="${PAD.l - 5}" y="${Y(v) + 3}" text-anchor="end">${v > 0 ? '+' + v : v}</text>`;
  }
  ax.innerHTML = s;
  return { X, Y };
}
const pathOf = (pts, X, Y, lo, hi) => pts.map(([f, v], i) => `${i ? 'L' : 'M'}${X(f).toFixed(1)} ${Y(Math.max(lo, Math.min(hi, v))).toFixed(1)}`).join('');

function drawPlots() {
  if (!plots.length) return;
  const F = formObj(), L = Lm(), x = params.leak;
  const tuned = state.tuned;
  const stale = staleness();
  const theta = tuned ? tuned.theta.map((t) => t * state.morph) : null;
  const probeF = Math.pow(10, params.probe);

  // 1. microphone deviation
  {
    const fig = plots[0]; const { X, Y } = axes(fig, 20, 16000, -24, 12, 6);
    const pts = M.grid(20, 16000, 220).map((f) => [f, M.db(M.G(F, f, L, x).gsd) - M.db(M.G(F, f, M.NOMINAL.L, M.NOMINAL.leak).gsd)]);
    let ser = `<path class="s-now" d="${pathOf(pts, X, Y, -24, 12)}"/>`;
    let mk = '';
    for (const f of M.CHIME) mk += `<line class="tone" x1="${X(f)}" x2="${X(f)}" y1="${PH - PAD.b}" y2="${PH - PAD.b - 5}"/>`;
    if (tuned && !stale) {
      const all = M.CHIME.filter((f) => f >= 40 && f <= 10000);
      const nShow = Math.round(all.length * state.reveal);
      const band = new Set(tuned.tones);
      all.slice(0, nShow).forEach((f, i) => {
        const v = M.db(M.G(F, f, L, x).gsd) - M.db(M.G(F, f, M.NOMINAL.L, M.NOMINAL.leak).gsd) + 0.4 * M.noise(state.seed, i);
        mk += `<circle class="${band.has(f) ? 'dot in' : 'dot'}" cx="${X(f)}" cy="${Y(Math.max(-24, Math.min(12, v)))}" r="${band.has(f) ? 2.6 : 2}"/>`;
      });
    }
    mk += `<line class="probe" x1="${X(probeF)}" x2="${X(probeF)}" y1="${PAD.t}" y2="${PH - PAD.b}"/>`;
    fig.querySelector('.series').innerHTML = ser;
    fig.querySelector('.marks').innerHTML = mk;
    fig.querySelector('.ct-legend').innerHTML = `<span class="k now"></span>${JA ? 'この耳' : 'this ear'} <span class="k dot"></span>${T.meas}`;
  }
  // 2. loop gain
  {
    const fig = plots[1]; const { X, Y } = axes(fig, 100, 10000, -20, 40, 10);
    const fs = M.grid(100, 10000, 200);
    const tgt = fs.map((f) => [f, M.db(M.loopTarget(F, f))]);
    const bef = fs.map((f) => [f, M.db(M.loop(F, f, L, x, null))]);
    let ser = `<path class="s-target" d="${pathOf(tgt, X, Y, -20, 40)}"/><path class="s-before" d="${pathOf(bef, X, Y, -20, 40)}"/>`;
    let mk = '';
    const mb = M.margins(F, L, x, null);
    if (theta && !stale) {
      const aft = fs.map((f) => [f, M.db(M.loop(F, f, L, x, theta))]);
      ser += `<path class="s-after" d="${pathOf(aft, X, Y, -20, 40)}"/>`;
      const ma = M.margins(F, L, x, theta);
      if (isFinite(ma.fc)) mk += `<circle class="xo" cx="${X(ma.fc)}" cy="${Y(0)}" r="3.2"/>`;
    }
    if (isFinite(mb.fc)) mk += `<circle class="xo b" cx="${X(mb.fc)}" cy="${Y(0)}" r="3.2"/>`;
    if (mb.pm < 0) mk += `<text class="warn" x="${PW - PAD.r - 4}" y="${PAD.t + 12}" text-anchor="end">${T.howl}</text>`;
    fig.querySelector('.series').innerHTML = ser;
    fig.querySelector('.marks').innerHTML = mk;
    fig.querySelector('.ct-legend').innerHTML = `<span class="k target"></span>${T.target} <span class="k before"></span>${T.before} <span class="k after"></span>${stale && tuned ? T.after + ' (' + (JA ? '未測定' : 'not yet measured') + ')' : T.after}`;
  }
  // 3. eardrum
  {
    const fig = plots[2]; const { X, Y } = axes(fig, 20, 16000, -18, 18, 6);
    const fs = M.grid(20, 16000, 220);
    const off = fs.map((f) => [f, M.eardrumDev(F, f, L, x, false)]);
    let ser = `<path class="s-before" d="${pathOf(off, X, Y, -18, 18)}"/>`;
    if (tuned && !stale) {
      const on = off.map(([f, v]) => [f, v + M.eqFor(F, f, L, x, tuned.seed) * state.morph]);
      ser += `<path class="s-after" d="${pathOf(on, X, Y, -18, 18)}"/>`;
    }
    const mk = `<line class="probe" x1="${X(probeF)}" x2="${X(probeF)}" y1="${PAD.t}" y2="${PH - PAD.b}"/>`;
    fig.querySelector('.series').innerHTML = ser;
    fig.querySelector('.marks').innerHTML = mk;
    fig.querySelector('.ct-legend').innerHTML = `<span class="k before"></span>${T.eqOff} <span class="k after"></span>${T.eqOn}`;
  }
}

function drawReadout() {
  if (!readout) return;
  const F = formObj(), L = Lm(), x = params.leak;
  const mb = M.margins(F, L, x, null);
  const fmtPm = (m) => (isFinite(m.pm) ? (m.pm < 0 ? `<b class="bad">${T.unstable}</b>` : `<b>${m.pm.toFixed(0)}°</b>`) : '<b>n/a</b>');
  let s = `<span>${T.qw} <b>${(M.quarterWave(F, L) / 1000).toFixed(2)} kHz</b></span>`;
  s += `<span>${T.leakA} <b>${(M.leakArea(F, x) * 1e6).toFixed(1)} ${T.mm2}</b></span>`;
  s += `<span>${T.xo} <b>${isFinite(mb.fc) ? (mb.fc / 1000).toFixed(2) + ' kHz' : 'n/a'}</b>`;
  const tuned = state.tuned && !staleness();
  if (tuned) {
    const ma = M.margins(F, L, x, state.tuned.theta);
    s += ` → <b>${isFinite(ma.fc) ? (ma.fc / 1000).toFixed(2) + ' kHz' : 'n/a'}</b></span>`;
    s += `<span>${T.pm} ${fmtPm(mb)} → ${fmtPm(ma)}</span>`;
    s += `<span>${T.anc} <b>${M.ancBand(F, L, x, null).toFixed(1)} dB</b> → <b>${M.ancBand(F, L, x, state.tuned.theta).toFixed(1)} dB</b></span>`;
    s += `<span>${T.est} <b>${M.eardrumError(F, L, x, false).toFixed(1)} dB</b> → <b>${M.eardrumError(F, L, x, true, state.tuned.seed).toFixed(1)} dB</b></span>`;
  } else {
    s += `</span><span>${T.pm} ${fmtPm(mb)}</span><span>${T.anc} <b>${M.ancBand(F, L, x, null).toFixed(1)} dB</b></span>`;
  }
  readout.innerHTML = s;
}

// ---------- the scene ----------
/* Anchors from the Blender build (cm, glTF axes: x out of the right ear, y up,
 * z out of the face). E is the canal entrance on the floor of the concha. */
const A = {
  E: [4.6217, 4.872, 1.176], cupNormal: [0.9843, -0.1689, 0.0504],
  fbCup: [7.4018, 3.9919, 0.6015], ffCup: [9.9707, 7.0225, -1.7701], driverCup: [8.0096, 4.5514, 0.132],
  fbBud: [4.1217, 4.872, 1.046], ffBud: [6.3717, 5.322, 0.626], driverBud: [5.3717, 4.872, 1.076],
  cushionTop: [7.1352, 9.3148, 0.4377], cushionBottom: [5.7854, 1.4298, 0.3685],
};
const CUT_X = 3.0;            // the headphone cut removes x > CUT_X and z > ZC: the front half of the right side
const ZC = A.E[2];            // a coronal plane through the ear canal
const R_CANAL = M.CANAL_R * 100; // cm
const ASSETS = new URL('./assets/', import.meta.url).href;
const DRACO = new URL('/vendor/three/r186/examples-jsm/libs/draco/', location.href).href;

// Section colours: what a cut through each material looks like. These are
// physical colours, not theme colours, because they belong to the objects.
const CAP = {
  skin: 0x5a2a26,   // the inside of the head, seen through the window shell: 0x2a2826, leather: 0xcdbf9f, pad: 0xcdbf9f, fabric: 0x2b2b2d, baffle: 0x3a3a3c,
  cone: 0x4a4a4a, surround: 0x333333, magnet: 0x77777b, mic: 0xb87333, metal: 0x9a968f,
  tip: 0x2f2f33, lens: 0xdfe8ea, plate: 0x222222,
};

const lab = await mountLab(canvas, {
  forceWebGL: new URLSearchParams(location.search).has('webgl'),
  async setup({ renderer, scene, camera, lab }) {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    const LITE = new URLSearchParams(location.search).has('lite');
    renderer.shadowMap.enabled = !LITE;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    camera.fov = 28; camera.near = 0.5; camera.far = 400; camera.updateProjectionMatrix();
    const VIEWS = {
      overear: { pos: new THREE.Vector3(17.0, 9.8, 24.5), tgt: new THREE.Vector3(4.6, 5.0, 0.9) },
      earbud: { pos: new THREE.Vector3(12.8, 7.9, 16.4), tgt: new THREE.Vector3(3.9, 4.9, 1.0) },
    };
    camera.position.copy(VIEWS[params.form].pos);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.copy(VIEWS[params.form].tgt);
    controls.minDistance = 6; controls.maxDistance = 90;
    controls.addEventListener('change', () => lab.invalidate());

    // light: an image-based room for reflections, a warm key that casts soft shadows, a cool rim
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const key = new THREE.DirectionalLight(0xfff1e2, 2.4);
    key.position.set(22, 30, 26);
    key.target.position.set(2, 6, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 5, far: 90 });
    key.shadow.radius = 5; key.shadow.blurSamples = 12; key.shadow.bias = -0.0004;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0xdce8ff, 1.1);
    rim.position.set(-18, 12, -24);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xfff7ee, 0x40362f, 0.35));

    // One cut and one window. The headphone loses the front half of its right side. The head
    // is not cut: the skin round the ear fades to glass, and the canal, drawn to scale inside
    // the head, shows through it.
    const planes = (list) => list.map(([nx, ny, nz, c]) => new THREE.Plane(new THREE.Vector3(nx, ny, nz), c));
    const kitCut = new THREE.ClippingGroup();
    kitCut.clippingPlanes = planes([[-1, 0, 0, CUT_X], [0, 0, -1, ZC]]);
    kitCut.clipIntersection = true;
    scene.add(kitCut);

    const draco = new DRACOLoader().setDecoderPath(DRACO);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const [headG, overG, budG] = await Promise.all(['head.glb', 'overear.glb', 'earbud.glb'].map((f) => loader.loadAsync(ASSETS + f)));
    draco.dispose();

    // A cut through a closed mesh shows its inside faces; colour those as the section.
    const capUniforms = [];
    function sectioned(src, capHex, extra = {}) {
      const m = new THREE.MeshPhysicalNodeMaterial();
      m.side = THREE.DoubleSide;
      m.color.copy(src.color ?? new THREE.Color(0xffffff));
      m.roughness = src.roughness ?? 0.6;
      m.metalness = src.metalness ?? 0;
      m.clearcoat = src.clearcoat ?? 0;
      m.clearcoatRoughness = src.clearcoatRoughness ?? 0.2;
      m.normalMap = src.normalMap ?? null;
      if (src.normalMap) m.normalScale.set(0.9, 0.9);
      m.transparent = !!src.transparent; m.opacity = src.opacity ?? 1;
      const { mottle, ...rest } = extra; Object.assign(m, rest); extra = { mottle };
      const base = src.map ? texture(src.map).rgb.mul(uniform(m.color)) : uniform(m.color);
      const cap = uniform(new THREE.Color(capHex));
      capUniforms.push(cap);
      m.colorNode = select(frontFacing, base, vec3(0));
      const grain = extra.mottle ? mx_noise_float(positionWorld.mul(0.9)).mul(0.5).add(mx_noise_float(positionWorld.mul(4.0)).mul(0.25)).mul(0.38).add(0.84) : float(0.85);
      m.emissiveNode = select(frontFacing, vec3(0), cap.mul(grain));
      m.roughnessNode = select(frontFacing, float(m.roughness), float(1));
      m.metalnessNode = select(frontFacing, float(m.metalness), float(0));
      m.userData.cap = cap;
      return m;
    }
    const parts = {};
    const glowU = uniform(0);
    function adopt(root, group) {
      const list = [];
      root.traverse((o) => { if (o.isMesh) list.push(o); });
      for (const o of list) {
        const src = o.material;
        const key_ = (src.name || '').replace(/\.\d+$/, '');
        const extra = key_ === 'skin' ? { mottle: true, roughness: 0.52, specularIntensity: 0.45, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffd9cc) }
          : key_ === 'lens' ? { transparent: true, opacity: 0.18, roughness: 0.03, clearcoat: 1, depthWrite: false }
          : key_ === 'leather' ? { sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x777066) } : {};
        o.material = sectioned(src, CAP[key_] ?? 0x333333, extra);
        if (o.name === 'fbmicR' || o.name === 'budFb') o.material.emissiveNode = select(frontFacing, vec3(1.0, 0.45, 0.12).mul(glowU).mul(4), o.material.userData.cap);
        o.castShadow = key_ !== 'lens'; o.receiveShadow = true;
        parts[o.name] = o;
        group.add(o);
      }
    }
    const headGroup = new THREE.Group(), overGroup = new THREE.Group(), budGroup = new THREE.Group(), cupR = new THREE.Group();
    scene.add(headGroup); kitCut.add(overGroup, budGroup);
    adopt(headG.scene, headGroup);
    adopt(overG.scene, overGroup);
    adopt(budG.scene, budGroup);
    for (const [n, o] of Object.entries(parts)) if (/R$/.test(n) && o.parent === overGroup) cupR.add(o);
    // the right cup hinges about the bottom of its cushion, so a broken seal opens at the top
    const cupPivot = new THREE.Group(); cupPivot.position.set(...A.cushionBottom);
    cupR.position.set(-A.cushionBottom[0], -A.cushionBottom[1], -A.cushionBottom[2]);
    cupPivot.add(cupR); overGroup.add(cupPivot);
    const cupN = new THREE.Vector3(...A.cupNormal);

    // the ear tip shrinks away from the canal wall to show a leak
    const E = new THREE.Vector3(...A.E);
    const tip = parts.budTip;
    const tipPivot = new THREE.Group(); tipPivot.position.copy(E); budGroup.add(tipPivot);
    if (tip) { tip.geometry.translate(-E.x, -E.y, -E.z); tipPivot.add(tip); }

    // ---- the window: a lens that follows the view. Wherever the line of sight passes close to the
    // middle of the canal, the skin (and the pinna) turns to glass, keeping a rim where the surface
    // turns away so the head keeps its shape. Orbit anywhere and the canal stays in view.
    const grainN0 = (k) => mx_noise_float(positionWorld.mul(k));
    const winOn = uniform(1);
    const winK = uniform(new THREE.Vector3(E.x - 1.25, E.y, E.z));
    const rimN = float(1).sub(normalView.dot(positionViewDirection).abs()).pow(2.4);
    const sight = positionWorld.sub(cameraPosition).normalize();
    const offAxis = cross(winK.sub(cameraPosition), sight).length();
    const inWin = smoothstep(3.0, 2.0, offAxis).mul(winOn);
    // behind the glass, the inside of the head: the same surface drawn from within, opaque and dark,
    // so the canal is seen against tissue rather than through to the page
    const inner = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
    inner.colorNode = vec3(0.24, 0.105, 0.095).mul(grainN0(1.3).mul(0.25).add(grainN0(4.0).mul(0.12)).add(0.9));
    const shells = [];
    headGroup.traverse((o) => {
      if (!o.isMesh) return;
      o.material.transparent = true;
      o.material.opacityNode = mix(float(1), rimN.mul(0.55).add(0.06), inWin);
      o.renderOrder = 3;
      const sh = new THREE.Mesh(o.geometry, inner);
      sh.position.copy(o.position); sh.quaternion.copy(o.quaternion); sh.scale.copy(o.scale);
      sh.castShadow = false; sh.receiveShadow = false;
      shells.push(sh);
    });
    for (const sh of shells) headGroup.add(sh);

    // ---- the canal, to scale: a half-section of cartilage (outer third) and bone (inner two
    // thirds), the air inside it coloured by pressure, and the eardrum at the end
    const grainN = (k) => mx_noise_float(positionWorld.mul(k));
    // the section keeps the half of each tube away from the viewer, opened by PHI towards the camera's height
    const PHI = 0.2;
    const secN = new THREE.Vector3(0, Math.cos(Math.PI / 2 + PHI), -Math.sin(Math.PI / 2 + PHI));   // normal of the cut faces
    const onCut = smoothstep(0.85, 0.97, normalWorld.dot(vec3(secN.x, secN.y, secN.z)).abs());
    const axisU = uniform(new THREE.Vector2(E.y, E.z));
    const rAxis = vec2(positionWorld.y, positionWorld.z).sub(axisU).length();
    const R_BONE = R_CANAL + 0.62, R_CART = R_CANAL + 0.22;
    // bone: a thin cortical shell, and on the cut faces spongy trabecular bone inside it
    const ivory = vec3(0.94, 0.91, 0.84).mul(grainN(7.0).mul(0.035).add(0.98));
    const spongy = mix(vec3(0.74, 0.52, 0.44), vec3(0.93, 0.88, 0.78), smoothstep(-0.3, 0.4, grainN(26.0).add(grainN(55.0).mul(0.5))));
    const shell = smoothstep(R_BONE - 0.14, R_BONE - 0.09, rAxis).max(smoothstep(R_CANAL * 1.02 + 0.11, R_CANAL * 1.02 + 0.06, rAxis));
    const boneMat = new THREE.MeshStandardNodeMaterial({ roughness: 0.7 });
    boneMat.colorNode = mix(ivory, mix(spongy, ivory, shell), onCut);
    boneMat.roughnessNode = mix(float(0.55), float(0.95), onCut.mul(float(1).sub(shell)));
    // cartilage: glossy pink on its surfaces, paler and matte where it is cut
    const cartMat = new THREE.MeshStandardNodeMaterial({ roughness: 0.45 });
    cartMat.colorNode = mix(vec3(0.86, 0.64, 0.60), vec3(0.93, 0.80, 0.76), onCut).mul(grainN(9.0).mul(0.04).add(0.98));
    cartMat.roughnessNode = mix(float(0.4), float(0.8), onCut);
    function halfTube(r, R) {
      const a0 = Math.PI / 2 + PHI, a1 = a0 + Math.PI;
      const sh = new THREE.Shape();
      sh.absarc(0, 0, R, a0, a1, false);
      sh.absarc(0, 0, r, a1, a0, true);
      // extrude along +z, then turn so the tube runs from x = 0 to x = -1
      return new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 28 }).rotateY(-Math.PI / 2);
    }
    const cartTube = new THREE.Mesh(halfTube(R_CANAL * 1.02, R_CART), cartMat);
    const boneTube = new THREE.Mesh(halfTube(R_CANAL * 1.02, R_BONE), boneMat);
    const SEG = 120, RAD = 28;
    const airMat = new THREE.MeshBasicNodeMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false });
    const airGeo = new THREE.CylinderGeometry(R_CANAL * 0.9, R_CANAL * 0.9, 1, RAD, SEG, true).translate(0, 0.5, 0).rotateZ(Math.PI / 2);
    airGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(airGeo.attributes.position.count * 3), 3));
    const air = new THREE.Mesh(airGeo, airMat);
    air.renderOrder = 2;
    // the eardrum sits obliquely across the end of the canal; the handle of the malleus runs up it to the umbo
    const drum = new THREE.Group();
    const drumMat = new THREE.MeshPhysicalNodeMaterial({ color: 0xd8d2c8, roughness: 0.32, transparent: true, opacity: 0.9, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color(0xffffff) });
    const drumDisc = new THREE.Mesh(new THREE.CircleGeometry(R_CANAL * 1.08, 48).scale(1, 1.3, 1).rotateY(Math.PI / 2), drumMat);
    const malleus = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, R_CANAL * 1.05, 4, 10).translate(0, R_CANAL * 0.52, 0), new THREE.MeshStandardNodeMaterial({ color: 0xf1e8d6, roughness: 0.5 }));
    malleus.position.x = -0.05; malleus.rotation.x = 0.35;
    drum.add(drumDisc, malleus);
    // the membrane faces outwards, forwards and down, at roughly 45 to 55 degrees to the canal floor
    drum.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0.66, -0.52, 0.54).normalize());
    const canal = new THREE.Group();
    canal.add(cartTube, boneTube, air, drum);
    scene.add(canal);

    // ---- chime wavefronts in the section plane, and leak puffs
    const rings = Array.from({ length: 7 }, () => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 72, 1, Math.PI / 2, Math.PI), new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      m.visible = false; scene.add(m); return m;
    });
    const NP = 90;
    const puffMat = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.55, depthWrite: false });
    const puffs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), puffMat, NP);
    puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    puffs.frustumCulled = false;
    scene.add(puffs);
    const puffSeed = Array.from({ length: NP }, () => [Math.random(), Math.random(), Math.random()]);

    // ---- labels
    const V = (a) => new THREE.Vector3(...a);
    const canalMid = () => new THREE.Vector3(E.x - Lm() * 50, E.y - R_CANAL, ZC);
    const labelDefs = [
      { key: 1, text: T.fb, pos: () => V(params.form === 'overear' ? A.fbCup : A.fbBud), side: 'left', off: () => (params.form === 'overear' ? [-0.4, -2.3] : [-2.2, 0.7]) },
      { text: T.ff, pos: () => V(params.form === 'overear' ? A.ffCup : A.ffBud), side: 'right', off: [2.2, 0] },
      { text: T.driver, pos: () => V(params.form === 'overear' ? A.driverCup : A.driverBud), side: 'right', off: [2.4, 0] },
      { key: 1, text: T.canal, pos: canalMid, side: 'left', off: [-2.4, -0.1] },
      { text: T.drum, pos: () => new THREE.Vector3(E.x - Lm() * 100, E.y + R_CANAL * 1.2, ZC), side: 'left', off: [-1.8, 0.9] },
      { text: T.bone, pos: () => new THREE.Vector3(E.x - Lm() * 70, E.y - R_CANAL - 0.3, ZC - 0.1), side: 'left', off: [-2.0, -1.3] },
      { text: T.cushion, pos: () => V(A.cushionBottom), side: 'right', off: [2.4, 0], only: 'overear' },
      { text: T.tip, pos: () => new THREE.Vector3(E.x - 0.3, E.y - R_CANAL, ZC), side: 'right', off: [2.0, 0], only: 'earbud' },
    ];
    const labelEls = labelDefs.map((d) => { const el = document.createElement('span'); el.className = 'lab-label'; el.textContent = d.text; el.dataset.side = d.side; labelsEl?.appendChild(el); return el; });
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
    function placeLabels() {
      if (!labelsEl) return;
      labelsEl.classList.toggle('is-hidden', !params.labels);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      right.setFromMatrixColumn(camera.matrixWorld, 0); upv.setFromMatrixColumn(camera.matrixWorld, 1);
      const scale = camera.position.distanceTo(controls.target) / 38;
      labelDefs.forEach((d, i) => {
        const el = labelEls[i];
        const narrow = w < 560 && !d.key;
        const show = !narrow && (!d.only || d.only === params.form) && (!d.need || d.need()) && params.cutaway;
        el.style.opacity = show ? '1' : '0';
        if (!show) return;
        pa.copy(d.pos());
        const off = typeof d.off === 'function' ? d.off() : d.off;
        pb.copy(pa).addScaledVector(right, off[0] * scale).addScaledVector(upv, off[1] * scale);
        pa.project(camera); pb.project(camera);
        const ax = (pa.x * 0.5 + 0.5) * w, ay = (-pa.y * 0.5 + 0.5) * h;
        const bx = (pb.x * 0.5 + 0.5) * w, by = (-pb.y * 0.5 + 0.5) * h;
        el.style.setProperty('--leader', `${Math.min(160, Math.max(10, Math.abs(bx - ax) - 4)).toFixed(0)}px`);
        el.style.setProperty('--rise', `${(ay - by).toFixed(0)}px`);
        const tx = d.side === 'left' ? `calc(${bx}px - 100% - 4px)` : `${bx + 4}px`;
        el.style.transform = `translate(${tx}, ${by - 8}px)`;
      });
    }

    // ---- colours for the air field, from the page theme
    const cA = new THREE.Color(), cB = new THREE.Color(), cBg = new THREE.Color(), tmp = new THREE.Color();
    function applyTheme() {
      const col = readColors(['--accent', '--cool', '--ink-soft', '--paper']);
      cA.copy(col.accent).lerp(new THREE.Color(0xff7a2e), 0.35); cB.copy(col.cool); cBg.set(0x7d5550);
      for (const r of rings) r.material.color.copy(cA);
      puffMat.color.copy(col.cool);
      lab.invalidate();
    }
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    // ---- state-dependent geometry
    function rebuild() {
      const over = params.form === 'overear';
      overGroup.visible = over; budGroup.visible = !over;
      // a broken seal: the cup stands off the skin, most at the top
      cupPivot.rotation.z = over ? -0.085 * Math.max(0, params.leak - 0.1) : 0;
      if (tip) { const gap = 0.012 + 0.09 * Math.sqrt(params.leak); const s = (R_CANAL - gap) / R_CANAL; tipPivot.scale.set(1, s, s); }
      const Lcm = Lm() * 100, ins = formObj().insert * 100;
      // cartilage for the outer third of the canal, bone from there to just past the eardrum
      cartTube.position.set(E.x, E.y, E.z); cartTube.scale.x = Lcm / 3;
      boneTube.position.set(E.x - Lcm / 3, E.y, E.z); boneTube.scale.x = Lcm * 2 / 3 + 0.35;
      air.position.set(E.x - ins, E.y, E.z); air.scale.x = Math.max(0.05, Lcm - ins);
      drum.position.set(E.x - Lcm, E.y, E.z);
      winK.value.set(E.x - Lcm / 2, E.y, E.z);
      kitCut.enabled = params.cutaway;
      winOn.value = params.cutaway ? 1 : 0;
      canal.visible = params.cutaway;
      lab.invalidate();
    }
    rebuild();

    const fieldAmp = new Float32Array(SEG + 1), fieldPh = new Float32Array(SEG + 1);
    function computeField() {
      const f = Math.pow(10, params.probe);
      const lres = Math.max(0.004, Lm() - formObj().insert);
      const k = 2 * Math.PI * f / M.C, a = 0.035 * k;
      const ccos = (re, im) => [Math.cos(re) * Math.cosh(im), -Math.sin(re) * Math.sinh(im)];
      const den = ccos(k * lres, -a * lres);
      let mx = 1e-9;
      for (let i = 0; i <= SEG; i++) {
        const s = lres * i / SEG;
        const v = M.div(ccos(k * (lres - s), -a * (lres - s)), den);
        fieldAmp[i] = M.abs(v); fieldPh[i] = M.arg(v); mx = Math.max(mx, fieldAmp[i]);
      }
      for (let i = 0; i <= SEG; i++) fieldAmp[i] /= mx;
    }
    computeField();
    function paint(v, out, o) {
      const m = Math.min(1, Math.abs(v));
      tmp.copy(cBg).lerp(v >= 0 ? cA : cB, Math.pow(m, 0.6));
      out[o] = tmp.r; out[o + 1] = tmp.g; out[o + 2] = tmp.b;
    }

    let fly = null;
    function flyTo(form) {
      const v = VIEWS[form];
      if (lab.reducedMotion) { camera.position.copy(v.pos); controls.target.copy(v.tgt); lab.invalidate(); return; }
      fly = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), v };
      lab.setOnDemand(false);
    }

    let phase = 0;
    const mtx = new THREE.Matrix4();
    const coneParts = ['coneR', 'dustcapR', 'surroundR'].map((n) => parts[n]).filter(Boolean);
    return {
      rebuild, computeField, placeLabels, flyTo,
      update(dt) {
        if (fly) {
          fly.t = Math.min(1, fly.t + dt / 1.0);
          const e = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
          camera.position.lerpVectors(fly.p0, fly.v.pos, e);
          controls.target.lerpVectors(fly.t0, fly.v.tgt, e);
          if (fly.t >= 1) fly = null;
        }
        controls.update();
        const reduced = lab.reducedMotion;
        phase += dt * 2 * Math.PI * 0.55;
        const over = params.form === 'overear';
        const Lcm = Lm() * 100;

        let pulse = -1, micGlow = 0;
        if (state.chimeT >= 0) {
          state.chimeT = (performance.now() - state.chimeStart) / 1000;
          const t = state.chimeT;
          const src = V(over ? A.driverCup : A.driverBud);
          rings.forEach((r, i) => {
            const age = t - i * 0.17;
            const alive = t < 1.5 && age > 0 && age < 1 && params.cutaway;
            r.visible = alive;
            if (!alive) return;
            r.scale.setScalar(0.15 + (over ? 3.2 : 1.3) * age);
            r.position.set(src.x, src.y, ZC + 0.03);
            r.material.opacity = 0.85 * (1 - age);
          });
          const tp = (t - 0.3) / 0.9;
          if (tp > 0 && tp < 1) pulse = tp < 0.5 ? tp * 2 : 2 - tp * 2;
          if (tp > 0.85 && tp < 1.2) micGlow = 1 - Math.abs(tp - 1.0) / 0.2;
          state.reveal = Math.max(0, Math.min(1, (t - 1.0) / 0.8));
          state.morph = Math.max(0, Math.min(1, (t - 1.7) / 0.9));
          if (t > 2.7) { state.chimeT = -1; state.reveal = 1; state.morph = 1; rings.forEach((r) => (r.visible = false)); lab.setOnDemand(reduced); }
          drawPlots(); drawReadout();
        }
        glowU.value = Math.max(0, micGlow);

        // canal air colours
        const arr = air.geometry.attributes.color.array;
        const ph = reduced ? 0 : phase;
        // rows run from the eardrum end (row 0) to the entrance (row SEG)
        for (let r = 0; r <= SEG; r++) {
          const i = SEG - r;
          let v = fieldAmp[i] * Math.cos(fieldPh[i] + ph);
          if (pulse >= 0) { const s = i / SEG; v = 0.25 * v + Math.exp(-((s - pulse) ** 2) / 0.004); }
          for (let k = 0; k <= RAD; k++) paint(v, arr, (r * (RAD + 1) + k) * 3);
        }
        air.geometry.attributes.color.needsUpdate = true;

        drum.position.x = E.x - Lcm + (reduced ? 0 : -0.03 * fieldAmp[SEG] * Math.cos(fieldPh[SEG] + ph)) - (pulse > 0.9 ? 0.05 : 0);
        const cone = reduced ? 0 : 0.012 * Math.cos(ph * 3);
        for (const c of coneParts) c.position.copy(cupN).multiplyScalar(cone);

        // leak puffs
        const nOn = Math.round(NP * Math.min(1, params.leak * 1.2) * (params.leak > 0.15 || !over ? 1 : 0));
        for (let i = 0; i < NP; i++) {
          const [a, b, c] = puffSeed[i];
          if (i >= nOn) { mtx.makeScale(0, 0, 0); puffs.setMatrixAt(i, mtx); continue; }
          const life = ((reduced ? 0.5 : phase / (2 * Math.PI) * 0.6) + a) % 1;
          let px, py, pz;
          if (over) {
            px = A.cushionTop[0] - 1.6 + 2.6 * life * (0.6 + b);
            py = A.cushionTop[1] - 0.1 + 1.8 * life * (c - 0.2);
            pz = A.cushionTop[2] + (b - 0.5) * 3.0;
          } else {
            px = E.x + 0.1 + 2.2 * life;
            py = E.y + (b > 0.5 ? 1 : -1) * (R_CANAL + life * 0.7 * c);
            pz = E.z - 0.3 * c;
          }
          const sc = (over ? 1 : 0.6) * (0.5 + 1.1 * (1 - life));
          mtx.makeScale(sc, sc, sc).setPosition(px, py, pz);
          puffs.setMatrixAt(i, mtx);
        }
        puffs.instanceMatrix.needsUpdate = true;
        placeLabels();
      },
      dispose() { controls.dispose(); stopTheme(); pmrem.dispose(); },
    };
  },
});

// ---------- controls ----------
function refreshProbeOutput() {
  const o = panel.querySelector('output[for="probe"]');
  if (o) { const f = Math.pow(10, params.probe); o.value = f >= 1000 ? (f / 1000).toFixed(2) + ' kHz' : f.toFixed(0) + ' Hz'; }
  const lo = panel.querySelector('output[for="leak"]');
  if (lo) lo.value = (M.leakArea(formObj(), params.leak) * 1e6).toFixed(1) + ' mm²';
}
function chime() {
  measure();
  playChime();
  if (lab && !lab.reducedMotion) {
    state.chimeT = 0; state.chimeStart = performance.now(); state.reveal = 0; state.morph = 0;
    lab.setOnDemand(false);
  }
  drawPlots(); drawReadout();
}

measure();
bindControls(panel, params, (p, name) => {
  if (name === 'form') lab?.hooks.flyTo(p.form);
  if (name === 'cutaway') lab?.hooks.rebuild();
  if (name === 'form' || name === 'canal' || name === 'leak') {
    lab?.hooks.rebuild();
    if (p.auto && name !== 'form') { /* measured on release, see 'change' below */ } else if (p.auto) measure();
  }
  if (name === 'form' || name === 'canal' || name === 'probe') lab?.hooks.computeField();
  refreshProbeOutput();
  drawPlots(); drawReadout();
  lab?.invalidate();
});
panel.addEventListener('change', (ev) => {
  if (params.auto && (ev.target.name === 'canal' || ev.target.name === 'leak')) { measure(); drawPlots(); drawReadout(); }
});
document.getElementById('play-chime')?.addEventListener('click', chime);
document.getElementById('reseat')?.addEventListener('click', () => { measure(); drawPlots(); drawReadout(); });
for (const b of document.querySelectorAll('[data-preset]')) {
  b.addEventListener('click', () => {
    const [form, canal, leak] = b.dataset.preset.split(',');
    if (form !== params.form) lab?.hooks.flyTo(form);
    const radio = panel.querySelector(`input[name="form"][value="${form}"]`);
    if (radio) radio.checked = true;
    params.form = form; params.canal = +canal; params.leak = +leak;
    panel.querySelector('#canal').value = canal; panel.querySelector('#leak').value = leak;
    panel.querySelector('output[for="canal"]').value = (+canal).toFixed(1);
    lab?.hooks.rebuild(); lab?.hooks.computeField();
    chime();
    refreshProbeOutput();
  });
}
refreshProbeOutput();
drawPlots(); drawReadout();
