/* Inside a flying tourbillon: the scene.
 * The kinematics live in model.js (pure, tested in Node); this file loads the
 * parts, gathers the cage into one turning group, drives everything from the
 * model, and wires the stages, controls, labels and readout.  Lighting and
 * materials come from the shared studio look; the page adds forged carbon and
 * its own callouts and framing (stage-kit.js). */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudio, turntable, flyTo as studioFly } from '/assets/lab-kit/studio-look.js';
import { mountLab, bindControls, onThemeChange } from '/assets/lab-kit/lab-kit.js';
import { loadingVeil, loadGLB, forgedCarbon, dimOf, ghost, Callouts, anchorOf, fitView } from './stage-kit.js';
import * as M from './model.js';

const ja = document.documentElement.lang === 'ja';
const T = (en, jp) => (ja ? jp : en);
const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');
const labelLayer = document.getElementById('labels');
const stageBar = document.getElementById('stages');
const stageText = document.getElementById('stage-text');
const partList = document.getElementById('parts');
const ASSETS = new URL('./assets/', import.meta.url).href;
const FLOOR_Y = -9.0;                                  // the shadow catcher sits a few mm under the caseback, so the watch floats over its own shadow
const EXPLODE_SCALE = 3;                                // the slider's 100% is three times the model's own explode offsets
const veil = loadingVeil(canvas.parentElement, ja);
const meta = await (await fetch(ASSETS + 'tourbillon-meta.json')).json();
const L = meta.layout;
const TAU = Math.PI * 2;
let spin = null, binder = null, labRef = null, callouts = null, controlsRef = null, subject = null;
const params = { speed: 1, explode: 0, dial: true, hands: true, caseOn: true, bridges: true, labels: true, orientation: 0, stage: 0 };

// ------------------------------------------------------------------ names
const NAMES = {
  cage_top: ['Cage: three-armed top, seconds pointer', 'ケージ：三本腕の上部と秒指針'], cage_pillars: ['Cage pillars and upper ring', 'ケージの柱と上部リング'], cage_mid: ['Cage: escapement bridge', 'ケージ：脱進機受け'],
  cage_lower: ['Cage: lower plate and pinion', 'ケージ：下部プレートとカナ'], fixed_wheel: ['Fixed wheel, 84 teeth, held still', '固定車、84 歯、動かない'], ball_bearing: ['Ball bearing under the cage', 'ケージ下のボールベアリング'],
  escape_wheel: ['Escape wheel, 20 teeth, pinion on the fixed wheel', 'ガンギ車、20 歯、カナは固定車に噛む'], pallet_fork: ['Pallet fork', 'アンクル'], balance: ['Balance wheel with timing screws', '調整ネジつきテンプ'], hairspring: ['Hairspring', 'ヒゲゼンマイ'], stud: ['Hairspring stud', 'ヒゲ持ち'],
  third_wheel: ['Third wheel, drives the cage pinion', '三番車、ケージのカナを回す'], centre_wheel: ['Centre wheel, 1 turn per hour', '二番車、1 時間に 1 回転'], barrel: ['Barrel (mainspring inside)', '香箱（中にゼンマイ）'], barrel_arbor: ['Barrel arbor', '香箱真'],
  cannon_pinion: ['Cannon pinion (minute hand)', 'ツツカナ（分針）'], minute_wheel: ['Minute wheel', '日の裏車'], hour_wheel: ['Hour wheel', '筒車'],
  main_plate: ['Main plate', '地板'], barrel_bridge: ['Barrel bridge', '香箱受け'], train_bridge: ['Train bridge', '輪列受け'], tourbillon_bridge: ['Tourbillon bridge (lower bearing)', 'トゥールビヨン受け（下部軸受）'],
  dial: ['Skeleton dial', 'スケルトン文字盤'], indices: ['Applied indices', '植字インデックス'], flange: ['Flange with the minute track', '分目盛りのフランジ'], hour_hand: ['Hour hand', '時針'], minute_hand: ['Minute hand', '分針'], chrono_hand: ['Chronograph seconds hand', 'クロノグラフ秒針'],
  minute_counter_hand: ['30-minute counter hand', '30 分積算針'], hour_counter_hand: ['12-hour counter hand', '12 時間積算針'],
  case: ['Case, 45 mm, forged carbon and titanium', 'ケース、45 mm、フォージドカーボンとチタン'], bezel: ['Tachymeter bezel', 'タキメーターベゼル'], crown: ['Crown and pushers', 'リューズとプッシャー'], crystal: ['Sapphire crystal', 'サファイア風防'], caseback: ['Caseback', '裏蓋'], caseback_glass: ['Caseback window', '裏蓋の窓'],
};
const CAGE_PARTS = ['cage_top', 'cage_pillars', 'cage_mid', 'cage_lower', 'escape_wheel', 'pallet_fork', 'balance', 'stud'];
const LAYER = {
  case: ['case', 'bezel', 'crown', 'crystal', 'caseback', 'caseback_glass'],
  dial: ['dial', 'indices', 'flange'],
  hands: ['hour_hand', 'minute_hand', 'chrono_hand', 'minute_counter_hand', 'hour_counter_hand'],
  bridges: ['barrel_bridge', 'train_bridge', 'tourbillon_bridge'],
};

// ------------------------------------------------------------------ guided stages
// view = [azimuth, elevation] in degrees (elevation > 0 looks at the dial); the camera is fitted to `frame` (default: hi) from there.
const STAGES = [
  { id: 'watch', title: ['The watch', '時計'], view: [10, 58], frame: ['bezel'], margin: 1.12, show: {}, hi: [],
    text: ['A 45 mm chronograph with a skeleton dial and, at six, the cage of a one-minute flying tourbillon: no bridge over it, the whole escapement carried on a bearing underneath and turning once a minute, so the cage is also the seconds hand. Drag to orbit, scroll to zoom, and take the stages in order.',
           '45 mm のクロノグラフ。スケルトン文字盤の 6 時位置に、1 分で 1 回転するフライング・トゥールビヨンのケージがある。上に受けはなく、脱進機全体が下のベアリングに載って 1 分に 1 回転するので、ケージがそのまま秒針になる。ドラッグで回転、スクロールで拡大、段階は順に進めてほしい。'] },
  { id: 'cage', title: ['1. The cage turns once a minute', '1. ケージは 1 分に 1 回転'], view: [15, 55], show: { dial: false, hands: false, caseOn: false }, hi: CAGE_PARTS, labels: ['cage_top', 'cage_pillars', 'balance', 'escape_wheel', 'pallet_fork', 'cage_lower'], ghost: ['fixed_wheel'], margin: 1.25,
    text: ['Everything that keeps time, the balance, its hairspring, the pallet fork and the escape wheel, is mounted in a titanium cage, and the cage itself rotates: once a minute, driven by the third wheel through the pinion under its lower plate. Watch the red tip of the top arm: it is the seconds hand. The rest of the movement is dimmed.',
           '時を刻むものすべて、テンプ、ヒゲゼンマイ、アンクル、ガンギ車がチタンのケージに載り、ケージ自体が回る。三番車が下部プレートの下のカナを回し、1 分に 1 回転。上部の腕の赤い先端を見てほしい。それが秒針だ。ほかのムーブメントは薄くしてある。'] },
  { id: 'fixed', title: ['2. The fixed wheel: why the escape wheel turns', '2. 固定車：ガンギ車が回るわけ'], view: [200, -55], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['fixed_wheel', 'escape_wheel', 'cage_lower'], ghost: ['cage_pillars', 'cage_mid', 'cage_top', 'balance'], margin: 1.2,
    text: ['Seen from the back. The gilt wheel with 84 teeth is screwed to the movement and never moves. The escape wheel’s 7-leaf pinion rides round it as the cage turns, like a planet round a sun: for every turn of the cage the pinion is forced through 84/7 = 12 turns relative to the cage. That is how energy from the train reaches the escapement inside a rotating frame: the cage is the driven part, and the escape wheel is turned by rolling on a wheel that stands still. The rest of the cage is drawn as glass.',
           '裏側から。84 歯の金色の車はムーブメントにねじ止めされ、決して動かない。ケージが回ると、ガンギ車の 7 枚カナが太陽をめぐる惑星のようにその周りを転がる。ケージ 1 回転につき、カナはケージに対して 84/7 = 12 回転を強いられる。輪列のエネルギーが回転する枠の中の脱進機に届く仕組みがこれだ。駆動されるのはケージであり、ガンギ車は止まった車の上を転がることで回される。ケージの残りはガラスのように描いてある。'] },
  { id: 'escapement', title: ['3. The escapement, in slow motion', '3. 脱進機、スローモーションで'], view: [-20, 62], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['escape_wheel', 'pallet_fork', 'balance'], ghost: ['cage_top', 'cage_pillars', 'cage_mid', 'cage_lower'], slow: true, margin: 1.15,
    text: ['Inside the cage it is an ordinary Swiss lever escapement, and it is doing an ordinary job: the pallet fork lets the escape wheel go one tooth every two swings of the balance, eight vibrations a second, and gives the balance a push each time. The only difference from a fixed escapement is that the whole scene is slowly wheeling round underneath you.',
           'ケージの中にあるのは普通のスイス・レバー脱進機で、仕事も普通だ。テンプが 2 回振れるごとにアンクルがガンギ車を一歯逃がし、毎秒 8 振動、そのたびにテンプを押す。固定された脱進機との唯一の違いは、この光景全体が足元でゆっくり回っていることだ。'] },
  { id: 'balance', title: ['4. The balance and its hairspring', '4. テンプとヒゲゼンマイ'], view: [30, 68], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['balance', 'hairspring', 'stud', 'cage_top'], ghost: ['escape_wheel', 'pallet_fork', 'cage_pillars', 'cage_mid'], margin: 1.15,
    text: ['The balance sits on the cage’s own axis, its upper pivot in the jewel at the hub of the three-armed top, and eight timing screws round its rim set its inertia. The hairspring’s outer end is pinned to a stud on that top, so spring and balance turn together with the cage. In the reference the spring is a carbon composite grown in a plasma reactor, amagnetic and light; here it is drawn as a plain dark spiral.',
           'テンプはケージ自身の軸に載り、上部の軸は三本腕の中央の石で受けられる。リムの 8 本の調整ネジが慣性を決める。ヒゲゼンマイの外端はその上部のヒゲ持ちに留めてあるので、バネもテンプもケージと一緒に回る。参照した時計ではヒゲはプラズマ反応炉で成長させたカーボン複合材で、非磁性かつ軽い。ここでは単純な黒い渦巻きとして描いている。'] },
  { id: 'train', title: ['5. The train that drives it', '5. これを駆動する輪列'], view: [190, -55], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['barrel', 'centre_wheel', 'third_wheel', 'cage_lower'], ghost: ['balance', 'cage_top', 'fixed_wheel'], margin: 1.1,
    text: ['From the back, with the bridges away: barrel, centre wheel, third wheel, cage. 96 teeth into 8, 80 into 10, 75 into 10: the barrel turns once in twelve hours, the centre wheel once an hour, the third wheel once in seven and a half minutes, and the cage once a minute. In an ordinary movement this last mesh would drive the fourth wheel; the cage simply takes its place.',
           '裏側から、受けを外して。香箱、二番車、三番車、ケージ。96 歯が 8 枚へ、80 が 10 へ、75 が 10 へ。香箱は 12 時間に 1 回転、二番車は 1 時間に 1 回転、三番車は 7 分半に 1 回転、ケージは 1 分に 1 回転。普通のムーブメントでは最後の噛み合いが四番車を回す。ケージはただその席に座っているのだ。'] },
  { id: 'gravity', title: ['6. What it is for: averaging gravity', '6. 何のためか：重力を平均する'], view: [60, 30], show: { dial: false, hands: false, caseOn: false }, hi: ['balance', 'hairspring', 'cage_top', 'cage_lower'], labels: ['balance', 'cage_top'], ghost: [], margin: 1.3,
    text: ['A balance is never perfectly poised, and its hairspring never breathes perfectly evenly, so the rate depends slightly on which way is down. Left in one position a watch runs a little fast or slow all night. If the escapement is carried round through every orientation once a minute, that error is averaged: whatever it gains at one angle it loses at the opposite one. Choose an orientation in the controls and watch the running mean in the readout fall toward zero. It only helps when the cage axis is horizontal; dial-up, the tourbillon changes nothing, which is why it was invented for pocket watches that hung vertically.',
           'テンプは完全には釣り合わず、ヒゲゼンマイも完全に均等には呼吸しないので、歩度はどちらが下かにわずかに依存する。一つの姿勢で置いたままの時計は、一晩じゅう少し進むか遅れる。脱進機を 1 分ごとにあらゆる向きへ運べば、その誤差は平均される。ある角度で進んだ分は反対の角度で失われる。操作部で姿勢を選び、読み出しの移動平均がゼロへ落ちていくのを見てほしい。役に立つのはケージの軸が水平のときだけで、文字盤を上にすればトゥールビヨンは何も変えない。だから縦に吊るされた懐中時計のために発明されたのだ。'] },
  { id: 'exploded', title: ['7. Exploded', '7. 分解図'], view: [25, 14], show: {}, hi: [], explode: 1, frame: 'all', margin: 0.62,
    text: ['Case, crystal and bezel lifted away, dial and hands above, the cage stack pulled apart along its axis: top, balance, escapement bridge, escape wheel and fork, lower plate, the fixed wheel and the bearing below. Use the explode slider to close it up again.',
           'ケース、風防、ベゼルを持ち上げ、文字盤と針を上に、ケージの積層を軸に沿って引き離したところ。上部、テンプ、脱進機受け、ガンギ車とアンクル、下部プレート、固定車、その下のベアリング。分解のスライダーで元に戻せる。'] },
];

// ------------------------------------------------------------------ state
const state = { simT: 0, clock: 10 * 3600 + 8 * 60 + 42, beats: 0, errSum: 0, errN: 0, e0: 4.0, theta0: 0.9 };
const parts = {}; const baseY = {}; const explodeY = {}; const anchors = {};
const mats = { normal: new Map(), dim: new Map() };
let cageGroup = null, hairspring = null, rootRef = null;

function ribbonGeometry(n) {
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 4 * 3); const idx = [];
  for (let i = 0; i < n - 1; i++) { const a = 4 * i, b = 4 * (i + 1); for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; idx.push(a + k, b + k, a + k2, b + k, b + k2, a + k2); } }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
function updateRibbon(mesh, samples, height, yMid, thick = 0.05) {
  const pos = mesh.geometry.attributes.position.array;
  for (let i = 0; i < samples.length; i++) {
    const [r, th] = samples[i]; const c = Math.cos(th), sn = Math.sin(th); const ro = r + thick / 2, ri = r - thick / 2; const o = i * 12;
    pos[o] = ro * c; pos[o + 1] = yMid + height / 2; pos[o + 2] = -ro * sn; pos[o + 3] = ro * c; pos[o + 4] = yMid - height / 2; pos[o + 5] = -ro * sn;
    pos[o + 6] = ri * c; pos[o + 7] = yMid - height / 2; pos[o + 8] = -ri * sn; pos[o + 9] = ri * c; pos[o + 10] = yMid + height / 2; pos[o + 11] = -ri * sn;
  }
  mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
}
const setRot = (name, a) => { const o = parts[name]; if (o) o.rotation.y = a; };
const visible = (name, v) => { const o = parts[name]; if (o) o.visible = v; };

// ------------------------------------------------------------------ per-frame step
function step(dt) {
  const s = state;
  if (params.speed > 0) s.simT += dt * params.speed;
  const a = M.angles(s.simT, L);
  s.beats = a.beat;
  if (cageGroup) cageGroup.rotation.y = a.cage;
  setRot('escape_wheel', a.escape);                   // angles inside the cage are already relative to it
  setRot('pallet_fork', a.fork); setRot('balance', a.balance);
  setRot('third_wheel', a.third); setRot('centre_wheel', a.centre); setRot('barrel', a.barrel);
  setRot('cannon_pinion', a.minute); setRot('minute_wheel', M.driven(a.centre, M.TEETH.cannon, M.TEETH.minute_wheel, Math.atan2(L.minute[1], L.minute[0]))); setRot('hour_wheel', a.hour);
  const clock = s.clock + s.simT;
  const handAngle = (period) => -TAU * ((clock % period) / period);
  setRot('minute_hand', handAngle(3600)); setRot('hour_hand', handAngle(43200));
  if (hairspring) updateRibbon(hairspring, M.hairspringSpiral(a.balance, meta.hairspring.stud_angle, meta.hairspring.turns, meta.hairspring.r_in, meta.hairspring.r_out), 0.12, 0, 0.04);
  if (params.speed > 0) {
    const horiz = params.orientation > 0;                                  // 0: dial up (cage axis vertical), 1..: cage axis horizontal
    const theta = horiz ? a.cage : 0;
    const err = s.e0 * Math.cos(theta - s.theta0);
    s.errSum += err * dt * params.speed; s.errN += dt * params.speed;
  }
}

// ------------------------------------------------------------------ stages, layers, highlight, labels
function buildStageBar() {
  stageBar.innerHTML = '';
  STAGES.forEach((st, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? st.title[1] : st.title[0]; b.dataset.stage = i; b.addEventListener('click', () => applyStage(i)); stageBar.appendChild(b); });
}
function buildPartList() {
  partList.innerHTML = '';
  for (const n of Object.keys(NAMES)) {
    if (!parts[n]) continue;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? NAMES[n][1] : NAMES[n][0]; b.dataset.part = n;
    b.addEventListener('click', () => focusPart(n));
    partList.appendChild(b);
  }
}
/** Show one part on its own: turn its layer on, light it, label it and fly to it. */
function focusPart(n) {
  for (const [k, list] of Object.entries(LAYER)) if (list.includes(n)) { const key = k === 'case' ? 'caseOn' : k; params[key] = true; binder?.set(key, true); }
  applyLayers(); highlight([n]); showLabels([n]);
  const az = THREE.MathUtils.radToDeg(Math.atan2(labRef.camera.position.x - controlsRef.target.x, labRef.camera.position.z - controlsRef.target.z));
  const el = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp((labRef.camera.position.y - controlsRef.target.y) / labRef.camera.position.distanceTo(controlsRef.target), -1, 1)));
  const v = fitView([parts[n]], labRef.camera, az, el, 1.6); if (v) { subject = v[2]; fly(v[0], v[1]); }
  labRef?.invalidate();
}
function ownerOf(mesh) { let o = mesh; while (o && !parts[o.name]) o = o.parent; return o ? o.name : mesh.name; }
function highlight(names, ghosts = []) {
  const set = new Set(names), g = new Set(ghosts);
  for (const [mesh, normal] of mats.normal) {
    const owner = ownerOf(mesh); const on = set.size === 0 || set.has(owner);
    mesh.material = g.has(owner) ? ghost() : on ? normal : mats.dim.get(mesh);
    mesh.castShadow = on && !g.has(owner) && !normal.transmission;
  }
}
function showLabels(names) {
  callouts?.set(names.filter((n) => NAMES[n] && parts[n]).map((n) => ({
    key: n, text: ja ? NAMES[n][1] : NAMES[n][0],
    anchor: (v) => { const o = parts[n]; for (let p = o; p; p = p.parent) if (!p.visible) return false; v.copy(anchors[n]).applyMatrix4(o.matrixWorld); return true; },
  })));
}
function applyLayers() {
  for (const n of LAYER.case) visible(n, params.caseOn);
  for (const n of LAYER.dial) visible(n, params.dial);
  for (const n of LAYER.hands) visible(n, params.hands);
  for (const n of LAYER.bridges) visible(n, params.bridges);
  const e = params.explode;
  for (const n of Object.keys(parts)) { const o = parts[n]; if (o && explodeY[n] !== undefined) o.position.y = baseY[n] + explodeY[n] * e * EXPLODE_SCALE; }
}
function applyStage(i, instant = false) {
  const st = STAGES[i]; params.stage = i; spin?.set(st.id === 'watch' || st.id === 'exploded');
  for (const b of stageBar.children) { const on = +b.dataset.stage === i; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); }
  stageText.textContent = ja ? st.text[1] : st.text[0];
  const show = { dial: true, hands: true, caseOn: true, bridges: true, ...st.show };
  for (const k of Object.keys(show)) params[k] = show[k];
  params.explode = st.explode ?? 0;
  for (const k of ['explode', 'dial', 'hands', 'caseOn', 'bridges']) binder?.set(k, params[k]);
  if (st.slow) binder?.set('speed', 0.125); else if (params.speed === 0.125) binder?.set('speed', 1);
  if (st.id === 'gravity') { binder?.set('orientation', 1); state.errSum = 0; state.errN = 0; }
  applyLayers(); highlight(st.hi, st.ghost || []); showLabels(st.labels || st.hi);
  const frame = st.frame === 'all' ? [rootRef] : (st.frame || st.hi).map((n) => parts[n]);
  const v = fitView(frame, labRef.camera, st.view[0], st.view[1], st.margin ?? 1.15);
  if (v) { subject = st.hi.length ? v[2] : null; fly(v[0], v[1], instant); }
}
function fly(pos, target, instant) {
  const camera = labRef.camera, controls = controlsRef;
  if (instant) { camera.position.set(...pos); controls.target.set(...target); controls.update(); labRef.invalidate(); return; }
  studioFly(camera, controls, pos, target, 950, () => labRef.invalidate());
}

// ------------------------------------------------------------------ the lab
const EXTRA = {
  titanium: { color: 0x8e9095, metalness: 1, roughness: 0.26, anisotropy: 0.4, envMapIntensity: 1.05, surf: 'brushed', rep: 3, ns: 0.15 },
  gilt: { color: 0xd8b46a, metalness: 1, roughness: 0.2, envMapIntensity: 1.2 },
  brass: { color: 0xcfa75e, metalness: 1, roughness: 0.26, envMapIntensity: 1.1 },
  case_black: { color: 0xffffff, map: forgedCarbon(1.6), metalness: 0.05, roughness: 0.38, clearcoat: 0.85, clearcoatRoughness: 0.12, envMapIntensity: 1.0, specularIntensity: 0.7 },
  black_ti: { color: 0x2b2c30, metalness: 1, roughness: 0.3, anisotropy: 0.6, envMapIntensity: 1.1, surf: 'brushed', rep: 4, ns: 0.2 },
  strap: { color: 0x2a2b2f, metalness: 0, roughness: 0.5, sheen: 0.4, sheenRoughness: 0.5, sheenColor: 0x9a9a9a, specularIntensity: 0.45, surf: 'grain', rep: 5, ns: 0.3 },
  skeleton: { color: 0x74777c, metalness: 0.95, roughness: 0.34, anisotropy: 0.5, envMapIntensity: 1.0, surf: 'brushed', rep: 3, ns: 0.2 },
  dial: { color: 0x1b1c1f, metalness: 0.4, roughness: 0.42, envMapIntensity: 0.9 },
  print: { color: 0xe6e2d6, metalness: 0, roughness: 0.55 },
  black_plate: { color: 0x2c2d31, metalness: 0.95, roughness: 0.3, envMapIntensity: 1.0, surf: 'perlage', rep: 7, ns: 0.3 },
  lime: { metalness: 0.4, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.1 },
  lume: { color: 0x8f9488, metalness: 0, roughness: 0.7, emissive: 0x9fc48a, emissiveIntensity: 0.05, envMapIntensity: 0.55 },
  polished_steel: { color: 0xdcdde0, metalness: 1, roughness: 0.07, clearcoat: 0.4, clearcoatRoughness: 0.03, envMapIntensity: 1.3 },
};

const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    camera.near = 0.5; camera.far = 600; camera.fov = 28; camera.updateProjectionMatrix();
    camera.position.set(10, 80, 50);
    const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxDistance = 260; controls.minDistance = 4;
    controls.addEventListener('change', () => lab.invalidate()); controlsRef = controls; labRef = lab;
    let gltf;
    try { gltf = await loadGLB(ASSETS + 'tourbillon.glb', (f) => veil.progress(f * 0.85)); }
    catch (err) { veil.fail('The model could not be loaded.', 'モデルを読み込めなかった。'); throw err; }
    veil.step('Setting up the studio light', 'スタジオの光を準備中');
    const look = await createStudio(lab, { scale: 50, center: [0, -1, 0], floorY: FLOOR_Y, hdri: 'studio', hdriGain: 0.8, strips: 'watch', rotateY: 0.6,
      exposure: 1.12, envIntensity: 1.0, toneMapping: 'neutral', shadowOpacity: 0.42, keyIntensity: 1.4, aoRadius: 1.6, aoThickness: 0.6, aoStrength: 1.1 });
    veil.progress(0.95); window.__look = look;
    const root = gltf.scene; rootRef = root;
    look.upgrade(root, { extra: EXTRA });
    const byName = new Map(meta.parts.map((p) => [p.name, p]));
    root.traverse((o) => {
      if (o.isMesh) { o.frustumCulled = false; mats.normal.set(o, o.material); mats.dim.set(o, dimOf(o.material)); }
      const p = byName.get(o.name);
      if (p && (o.parent === root || o.parent?.name === 'tourbillon')) { parts[o.name] = o; baseY[o.name] = o.position.y; explodeY[o.name] = p.explode[2]; anchors[o.name] = anchorOf(p, o); }
    });
    // hands: a satin-polished white metal, so they read against the dial from any angle rather than mirroring the dark studio
    for (const n of LAYER.hands) parts[n]?.traverse((o) => { if (o.isMesh && o.material.name === 'polished_steel') { const m = o.material.clone(); m.roughness = 0.2; m.color.set(0xeceef0); m.envMapIntensity = 1.4; o.material = m; mats.normal.set(o, m); mats.dim.set(o, dimOf(m)); } });
    scene.add(root);
    spin = turntable(controls, canvas, { speed: 0.4 });
    // gather the cage into one group at the cage axis, keeping each part's own origin for its own rotation
    cageGroup = new THREE.Group(); cageGroup.position.set(L.cage[0], 0, -L.cage[1]); root.add(cageGroup);
    for (const n of CAGE_PARTS) if (parts[n]) cageGroup.attach(parts[n]);
    // procedural hairspring in the cage: a dark carbon-composite ribbon
    const springMat = new THREE.MeshPhysicalMaterial({ name: 'carbon_spring', color: 0x2e3036, metalness: 0.55, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
    hairspring = new THREE.Mesh(ribbonGeometry(721), springMat); hairspring.position.set(0, meta.hairspring.z, 0); hairspring.frustumCulled = false; hairspring.castShadow = true;
    cageGroup.add(hairspring); parts.hairspring = hairspring; baseY.hairspring = meta.hairspring.z; explodeY.hairspring = 1.2; anchors.hairspring = new THREE.Vector3(meta.hairspring.r_out * 0.7, 0, 0);
    mats.normal.set(hairspring, springMat); mats.dim.set(hairspring, dimOf(springMat));
    callouts = new Callouts(labelLayer, canvas);
    const stopTheme = onThemeChange(() => lab.invalidate());
    buildStageBar(); buildPartList();
    step(0); applyStage(0, true);
    let last = 0, first = true;
    const ro = new ResizeObserver(() => { callouts.set(callouts.items.map(({ key, text, anchor }) => ({ key, text, anchor }))); }); ro.observe(canvas);
    return {
      update(dt, t) {
        spin.tick(); controls.update(); if (look.floor) look.floor.visible = camera.position.y > FLOOR_Y + 0.5 && params.explode < 0.05;
        try { step(Math.min(dt, 0.1)); root.updateMatrixWorld(); callouts.place(camera, params.labels, subject); if (t - last > 0.25) { last = t; writeReadout(); } }
        catch (err) { if (!window.__labErr) { window.__labErr = String(err.stack || err); console.error('tourbillon update failed', err); } }
        if (first) { first = false; requestAnimationFrame(() => veil.done()); }
        window.__labFrames = (window.__labFrames || 0) + 1;
      },
      render: look.render,
      dispose() { controls.dispose(); stopTheme(); spin.dispose(); ro.disconnect(); look.dispose(); },
    };
  },
});
labRef = lab; window.__lab = { lab, state, params, parts, STAGES, applyStage };
if (lab) {
  binder = bindControls(panel, params, (p, name) => {
    if (['dial', 'hands', 'caseOn', 'bridges', 'explode'].includes(name)) applyLayers();
    if (name === 'orientation') { state.errSum = 0; state.errN = 0; }
    lab.setOnDemand(p.speed === 0); lab.invalidate();
  });
  applyLayers();
} else veil.fail('This browser has neither WebGPU nor WebGL 2; the still plan is shown instead.', 'このブラウザには WebGPU も WebGL 2 もないので、静止した平面図を表示している。');

// ------------------------------------------------------------------ readout
const fmtClock = (secs) => { const s = Math.floor(secs % 86400); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
function writeReadout() {
  const s = state; const clock = s.clock + s.simT;
  const mean = s.errN > 0 ? s.errSum / s.errN : 0;
  const fixedErr = s.e0 * Math.cos(-s.theta0);
  readout.innerHTML = [
    [T('time shown', '表示時刻'), fmtClock(clock)],
    [T('cage', 'ケージ'), `${(((clock % 60) + 60) % 60).toFixed(0)} s · ${(s.simT / 60).toFixed(1)} ${T('turns', '回転')}`],
    [T('escape wheel', 'ガンギ車'), `${(s.simT * 12 / 60).toFixed(1)} ${T('turns in the cage', '回転（ケージ内）')}`],
    [T('vibrations', '振動数'), s.beats.toLocaleString()],
    [T('positional error', '姿勢差'), params.orientation > 0 ? `${T('mean', '平均')} ${mean >= 0 ? '+' : ''}${mean.toFixed(2)} s/d ${T('over', '／')} ${(s.errN / 60).toFixed(1)} min · ${T('without the cage', 'ケージなしなら')} ${fixedErr >= 0 ? '+' : ''}${fixedErr.toFixed(1)} s/d` : T('dial up: the cage cannot help', '文字盤上向き：ケージは役に立たない')],
  ].map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('');
}
