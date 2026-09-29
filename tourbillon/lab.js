/* Inside a flying tourbillon: the scene.
 * The kinematics live in model.js (pure, tested in Node); this file loads the
 * parts, gathers the cage into one turning group, drives everything from the
 * model, and wires the stages, controls, labels and readout. */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mountLab, bindControls, onThemeChange } from '/assets/lab-kit/lab-kit.js';
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
const meta = await (await fetch(ASSETS + 'tourbillon-meta.json')).json();
const L = meta.layout;
const TAU = Math.PI * 2, DEG = Math.PI / 180;

let binder = null, labRef = null;
const params = { speed: 1, explode: 0, dial: true, hands: true, caseOn: true, bridges: true, labels: true, orientation: 0, stage: 0 };

// ------------------------------------------------------------------ names
const NAMES = {
  cage_top: ['Cage: three-armed top, seconds pointer', 'ケージ：三本腕の上部と秒指針'], cage_pillars: ['Cage pillars', 'ケージの柱'], cage_mid: ['Cage: escapement bridge', 'ケージ：脱進機受け'],
  cage_lower: ['Cage: lower plate and pinion', 'ケージ：下部プレートとカナ'], fixed_wheel: ['Fixed wheel, 84 teeth, held still', '固定車、84 歯、動かない'], ball_bearing: ['Ball bearing under the cage', 'ケージ下のボールベアリング'],
  escape_wheel: ['Escape wheel, 20 teeth, pinion on the fixed wheel', 'ガンギ車、20 歯、カナは固定車に噛む'], pallet_fork: ['Pallet fork', 'アンクル'], balance: ['Balance wheel', 'テンプ'], hairspring: ['Hairspring', 'ヒゲゼンマイ'], stud: ['Hairspring stud', 'ヒゲ持ち'],
  third_wheel: ['Third wheel, drives the cage pinion', '三番車、ケージのカナを回す'], centre_wheel: ['Centre wheel, 1 turn per hour', '二番車、1 時間に 1 回転'], barrel: ['Barrel (mainspring inside)', '香箱（中にゼンマイ）'], barrel_arbor: ['Barrel arbor', '香箱真'],
  cannon_pinion: ['Cannon pinion (minute hand)', 'ツツカナ（分針）'], minute_wheel: ['Minute wheel', '日の裏車'], hour_wheel: ['Hour wheel', '筒車'],
  main_plate: ['Main plate', '地板'], barrel_bridge: ['Barrel bridge', '香箱受け'], train_bridge: ['Train bridge', '輪列受け'], tourbillon_bridge: ['Tourbillon bridge (lower bearing)', 'トゥールビヨン受け（下部軸受）'],
  dial: ['Skeleton dial', 'スケルトン文字盤'], indices: ['Applied indices', '植字インデックス'], flange: ['Flange with the minute track', '分目盛りのフランジ'], hour_hand: ['Hour hand', '時針'], minute_hand: ['Minute hand', '分針'], chrono_hand: ['Chronograph seconds hand', 'クロノグラフ秒針'],
  minute_counter_hand: ['30-minute counter hand', '30 分積算針'], hour_counter_hand: ['12-hour counter hand', '12 時間積算針'],
  case: ['Case, 45 mm', 'ケース、45 mm'], bezel: ['Tachymeter bezel', 'タキメーターベゼル'], crown: ['Crown and pushers', 'リューズとプッシャー'], crystal: ['Sapphire crystal', 'サファイア風防'], caseback: ['Caseback', '裏蓋'], caseback_glass: ['Caseback window', '裏蓋の窓'],
};
const CAGE_PARTS = ['cage_top', 'cage_pillars', 'cage_mid', 'cage_lower', 'escape_wheel', 'pallet_fork', 'balance', 'stud'];
const LAYER = {
  case: ['case', 'bezel', 'crown', 'crystal', 'caseback', 'caseback_glass'],
  dial: ['dial', 'indices', 'flange'],
  hands: ['hour_hand', 'minute_hand', 'chrono_hand', 'minute_counter_hand', 'hour_counter_hand'],
  bridges: ['barrel_bridge', 'train_bridge', 'tourbillon_bridge'],
};

// ------------------------------------------------------------------ guided stages: view = [target in Blender mm, distance, azimuth, elevation]; elevation > 0 looks at the dial
const STAGES = [
  { id: 'watch', title: ['The watch', '時計'], view: [[0, -2, 0], 95, 10, 62], show: {}, hi: [],
    text: ['A 45 mm chronograph with a skeleton dial and, at six, the cage of a one-minute flying tourbillon: no bridge over it, the whole escapement carried on a bearing underneath and turning once a minute, so the cage is also the seconds hand. Drag to orbit, scroll to zoom, and take the stages in order.',
           '45 mm のクロノグラフ。スケルトン文字盤の 6 時位置に、1 分で 1 回転するフライング・トゥールビヨンのケージがある。上に受けはなく、脱進機全体が下のベアリングに載って 1 分に 1 回転するので、ケージがそのまま秒針になる。ドラッグで回転、スクロールで拡大、段階は順に進めてほしい。'] },
  { id: 'cage', title: ['1. The cage turns once a minute', '1. ケージは 1 分に 1 回転'], view: [[0, -9, -1.5], 22, 15, 60], show: { dial: false, hands: false, caseOn: false }, hi: CAGE_PARTS, ghost: ['fixed_wheel'],
    text: ['Everything that keeps time, the balance, its hairspring, the pallet fork and the escape wheel, is mounted in a titanium cage, and the cage itself rotates: once a minute, driven by the third wheel through the pinion under its lower plate. Watch the red tip of the top arm: it is the seconds hand.',
           '時を刻むものすべて、テンプ、ヒゲゼンマイ、アンクル、ガンギ車がチタンのケージに載り、ケージ自体が回る。三番車が下部プレートの下のカナを回し、1 分に 1 回転。上部の腕の赤い先端を見てほしい。それが秒針だ。'] },
  { id: 'fixed', title: ['2. The fixed wheel: why the escape wheel turns', '2. 固定車：ガンギ車が回るわけ'], view: [[0, -9, -3.2], 20, 200, -55], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['fixed_wheel', 'escape_wheel', 'cage_lower'], ghost: ['cage_pillars', 'cage_mid', 'cage_top', 'balance'],
    text: ['Seen from the back. The gilt wheel with 84 teeth is screwed to the movement and never moves. The escape wheel’s 7-leaf pinion rides round it as the cage turns, like a planet round a sun: for every turn of the cage the pinion is forced through 84/7 = 12 turns relative to the cage. That is how energy from the train reaches the escapement inside a rotating frame: the cage is the driven part, and the escape wheel is turned by rolling on a wheel that stands still.',
           '裏側から。84 歯の金色の車はムーブメントにねじ止めされ、決して動かない。ケージが回ると、ガンギ車の 7 枚カナが太陽をめぐる惑星のようにその周りを転がる。ケージ 1 回転につき、カナはケージに対して 84/7 = 12 回転を強いられる。輪列のエネルギーが回転する枠の中の脱進機に届く仕組みがこれだ。駆動されるのはケージであり、ガンギ車は止まった車の上を転がることで回される。'] },
  { id: 'escapement', title: ['3. The escapement, in slow motion', '3. 脱進機、スローモーションで'], view: [[-1.2, -8.6, -2.4], 13, -20, 62], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['escape_wheel', 'pallet_fork', 'balance'], ghost: ['cage_top', 'cage_pillars', 'cage_mid', 'cage_lower'], slow: true,
    text: ['Inside the cage it is an ordinary Swiss lever escapement, and it is doing an ordinary job: the pallet fork lets the escape wheel go one tooth every two swings of the balance, eight vibrations a second, and gives the balance a push each time. The only difference from a fixed escapement is that the whole scene is slowly wheeling round underneath you.',
           'ケージの中にあるのは普通のスイス・レバー脱進機で、仕事も普通だ。テンプが 2 回振れるごとにアンクルがガンギ車を一歯逃がし、毎秒 8 振動、そのたびにテンプを押す。固定された脱進機との唯一の違いは、この光景全体が足元でゆっくり回っていることだ。'] },
  { id: 'balance', title: ['4. The balance and its hairspring', '4. テンプとヒゲゼンマイ'], view: [[0, -9, -1], 12, 30, 70], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['balance', 'hairspring', 'stud', 'cage_top'], ghost: ['escape_wheel', 'pallet_fork', 'cage_pillars', 'cage_mid'],
    text: ['The balance sits on the cage’s own axis, its upper pivot in the jewel at the hub of the three-armed top. The hairspring’s outer end is pinned to a stud on that top, so spring and balance turn together with the cage. In the reference the spring is a carbon composite grown in a plasma reactor, amagnetic and light; here it is drawn as a plain spiral.',
           'テンプはケージ自身の軸に載り、上部の軸は三本腕の中央の石で受けられる。ヒゲゼンマイの外端はその上部のヒゲ持ちに留めてあるので、バネもテンプもケージと一緒に回る。参照した時計ではヒゲはプラズマ反応炉で成長させたカーボン複合材で、非磁性かつ軽い。ここでは単純な渦巻きとして描いている。'] },
  { id: 'train', title: ['5. The train that drives it', '5. これを駆動する輪列'], view: [[-1, -2, -3], 40, 190, -55], show: { dial: false, hands: false, caseOn: false, bridges: false }, hi: ['barrel', 'centre_wheel', 'third_wheel', 'cage_lower'], ghost: ['balance', 'cage_top', 'fixed_wheel'],
    text: ['From the back, with the bridges away: barrel, centre wheel, third wheel, cage. 96 teeth into 8, 80 into 10, 75 into 10: the barrel turns once in twelve hours, the centre wheel once an hour, the third wheel once in seven and a half minutes, and the cage once a minute. In an ordinary movement this last mesh would drive the fourth wheel; the cage simply takes its place.',
           '裏側から、受けを外して。香箱、二番車、三番車、ケージ。96 歯が 8 枚へ、80 が 10 へ、75 が 10 へ。香箱は 12 時間に 1 回転、二番車は 1 時間に 1 回転、三番車は 7 分半に 1 回転、ケージは 1 分に 1 回転。普通のムーブメントでは最後の噛み合いが四番車を回す。ケージはただその席に座っているのだ。'] },
  { id: 'gravity', title: ['6. What it is for: averaging gravity', '6. 何のためか：重力を平均する'], view: [[0, -9, -1.5], 24, 60, 30], show: { dial: false, hands: false, caseOn: false }, hi: ['balance', 'hairspring', 'cage_top', 'cage_lower'], ghost: [],
    text: ['A balance is never perfectly poised, and its hairspring never breathes perfectly evenly, so the rate depends slightly on which way is down. Left in one position a watch runs a little fast or slow all night. If the escapement is carried round through every orientation once a minute, that error is averaged: whatever it gains at one angle it loses at the opposite one. Choose an orientation in the controls and watch the running mean in the readout fall toward zero. It only helps when the cage axis is horizontal; dial-up, the tourbillon changes nothing, which is why it was invented for pocket watches that hung vertically.',
           'テンプは完全には釣り合わず、ヒゲゼンマイも完全に均等には呼吸しないので、歩度はどちらが下かにわずかに依存する。一つの姿勢で置いたままの時計は、一晩じゅう少し進むか遅れる。脱進機を 1 分ごとにあらゆる向きへ運べば、その誤差は平均される。ある角度で進んだ分は反対の角度で失われる。操作部で姿勢を選び、読み出しの移動平均がゼロへ落ちていくのを見てほしい。役に立つのはケージの軸が水平のときだけで、文字盤を上にすればトゥールビヨンは何も変えない。だから縦に吊るされた懐中時計のために発明されたのだ。'] },
  { id: 'exploded', title: ['7. Exploded', '7. 分解図'], view: [[0, -4, 0], 90, 25, 40], show: {}, hi: [], explode: 1,
    text: ['Case, crystal and bezel lifted away, dial and hands above, the cage stack pulled apart along its axis: top, balance, escapement bridge, escape wheel and fork, lower plate, the fixed wheel and the bearing below. Use the explode slider to close it up again.',
           'ケース、風防、ベゼルを持ち上げ、文字盤と針を上に、ケージの積層を軸に沿って引き離したところ。上部、テンプ、脱進機受け、ガンギ車とアンクル、下部プレート、固定車、その下のベアリング。分解のスライダーで元に戻せる。'] },
];

// ------------------------------------------------------------------ state
const state = { simT: 0, clock: 10 * 3600 + 8 * 60 + 42, beats: 0, errSum: 0, errN: 0, e0: 4.0, theta0: 0.9 };
const parts = {}; const baseY = {}; const explodeY = {};
const mats = { normal: new Map(), dim: new Map(), ghost: new Map() };
let cageGroup = null, hairspring = null;

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
  // the positional error, accumulated as a running mean: theta is the balance's orientation in the field of gravity
  if (params.speed > 0) {
    const horiz = params.orientation > 0;                                  // 0: dial up (cage axis vertical), 1..: cage axis horizontal
    const theta = horiz ? a.cage : 0;
    const err = s.e0 * Math.cos(theta - s.theta0);
    s.errSum += err * dt * params.speed; s.errN += dt * params.speed;
  }
}

// ------------------------------------------------------------------ stages, layers, highlight, labels
function buildStageBar(controls, camera) {
  stageBar.innerHTML = '';
  STAGES.forEach((st, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? st.title[1] : st.title[0]; b.dataset.stage = i; b.addEventListener('click', () => applyStage(i, controls, camera)); stageBar.appendChild(b); });
}
function buildPartList() {
  partList.innerHTML = '';
  for (const n of Object.keys(NAMES)) {
    if (!parts[n]) continue;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? NAMES[n][1] : NAMES[n][0]; b.dataset.part = n;
    b.addEventListener('click', () => { highlight([n]); showLabels([n]); labRef?.invalidate(); });
    partList.appendChild(b);
  }
}
function ownerOf(mesh) { let o = mesh; while (o && !parts[o.name]) o = o.parent; return o ? o.name : mesh.name; }
function highlight(names, ghosts = []) {
  const set = new Set(names), g = new Set(ghosts);
  for (const [mesh, normal] of mats.normal) {
    const owner = ownerOf(mesh); const on = set.size === 0 || set.has(owner);
    mesh.material = g.has(owner) ? mats.ghost.get(mesh) : on ? normal : mats.dim.get(mesh);
  }
}
function showLabels(names) {
  labelLayer.innerHTML = '';
  for (const n of names.filter((n) => NAMES[n] && parts[n])) { const el = document.createElement('span'); el.className = 'lab-label'; el.dataset.part = n; el.textContent = ja ? NAMES[n][1] : NAMES[n][0]; labelLayer.appendChild(el); }
}
const v3 = new THREE.Vector3();
function placeLabels(camera) {
  if (!params.labels) { labelLayer.hidden = true; return; }
  labelLayer.hidden = false; const r = canvas.getBoundingClientRect();
  for (const el of labelLayer.children) {
    const o = parts[el.dataset.part]; if (!o) continue;
    o.getWorldPosition(v3); v3.project(camera);
    const x = (v3.x * 0.5 + 0.5) * r.width, y = (-v3.y * 0.5 + 0.5) * r.height;
    const on = v3.z < 1 && x > -40 && x < r.width + 40 && y > -20 && y < r.height + 20;
    el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`; el.style.opacity = on ? 1 : 0;
  }
}
function applyLayers() {
  for (const n of LAYER.case) visible(n, params.caseOn);
  for (const n of LAYER.dial) visible(n, params.dial);
  for (const n of LAYER.hands) visible(n, params.hands);
  for (const n of LAYER.bridges) visible(n, params.bridges);
  const e = params.explode;
  for (const n of Object.keys(parts)) { const o = parts[n]; if (o && explodeY[n] !== undefined) o.position.y = baseY[n] + explodeY[n] * e; }
}
function applyStage(i, controls, camera, instant = false) {
  const st = STAGES[i]; params.stage = i;
  for (const b of stageBar.children) b.classList.toggle('is-active', +b.dataset.stage === i);
  stageText.textContent = ja ? st.text[1] : st.text[0];
  const show = { dial: true, hands: true, caseOn: true, bridges: true, ...st.show };
  for (const k of Object.keys(show)) params[k] = show[k];
  params.explode = st.explode ?? 0;
  for (const k of ['explode', 'dial', 'hands', 'caseOn', 'bridges']) binder?.set(k, params[k]);
  if (st.slow) binder?.set('speed', 0.125); else if (params.speed === 0.125) binder?.set('speed', 1);
  if (st.id === 'gravity') { binder?.set('orientation', 1); state.errSum = 0; state.errN = 0; }
  applyLayers(); highlight(st.hi, st.ghost || []); showLabels(st.hi);
  const [pos, target] = viewToCamera(st.view); flyTo(controls, camera, pos, target, instant);
}
/** A view is [target in Blender mm (x, y, z), distance, azimuth deg, elevation deg]; elevation > 0 looks at the dial.  World = (x_b, z_b, -y_b). */
function viewToCamera([t, dist, az, el]) {
  const target = [t[0], t[2], -t[1]]; const a = az * DEG, e = el * DEG;
  return [[target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e)], target];
}
function flyTo(controls, camera, pos, target, instant) {
  const p0 = camera.position.clone(), t0 = controls.target.clone(); const t1 = new THREE.Vector3(...target), p1 = new THREE.Vector3(...pos);
  if (instant) { camera.position.copy(p1); controls.target.copy(t1); controls.update(); return; }
  const start = performance.now();
  const tick = () => { const k = M.smooth(0, 1, (performance.now() - start) / 900); camera.position.lerpVectors(p0, p1, k); controls.target.lerpVectors(t0, t1, k); controls.update(); labRef?.invalidate(); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ the lab
const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    camera.near = 0.5; camera.far = 500; camera.fov = 30; camera.updateProjectionMatrix();
    const [p0, t0] = viewToCamera(STAGES[0].view); camera.position.set(...p0);
    const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.target.set(...t0); controls.maxDistance = 220; controls.minDistance = 4;
    controls.addEventListener('change', () => lab.invalidate());
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
    const pmrem = new THREE.PMREMGenerator(renderer); const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex; scene.environmentIntensity = 0.5;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(18, 40, 24); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-20, -30, -10); scene.add(rim);

    const gltf = await new GLTFLoader().loadAsync(ASSETS + 'tourbillon.glb');
    const root = gltf.scene;
    const byName = new Map(meta.parts.map((p) => [p.name, p]));
    root.traverse((o) => {
      if (o.isMesh) {
        o.material.envMapIntensity = 1.0; o.frustumCulled = false;
        if (o.material.transparent) o.material.depthWrite = false;
        const dim = o.material.clone(); dim.transparent = true; dim.opacity = 0.06; dim.depthWrite = false; dim.envMapIntensity = 0; dim.color.multiplyScalar(0.55); dim.metalness = 0.2;
        const ghost = o.material.clone(); ghost.transparent = true; ghost.opacity = 0.28; ghost.depthWrite = false;
        mats.normal.set(o, o.material); mats.dim.set(o, dim); mats.ghost.set(o, ghost);
      }
      const p = byName.get(o.name);
      if (p && (o.parent === root || o.parent?.name === 'tourbillon')) { parts[o.name] = o; baseY[o.name] = o.position.y; explodeY[o.name] = p.explode[2]; }
    });
    scene.add(root);
    // gather the cage into one group at the cage axis, keeping each part's own origin for its own rotation
    cageGroup = new THREE.Group(); cageGroup.position.set(L.cage[0], 0, -L.cage[1]); root.add(cageGroup);
    for (const n of CAGE_PARTS) if (parts[n]) cageGroup.attach(parts[n]);
    // procedural hairspring in the cage
    const springMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
    hairspring = new THREE.Mesh(ribbonGeometry(721), springMat); hairspring.position.set(0, meta.hairspring.z, 0); hairspring.frustumCulled = false;
    cageGroup.add(hairspring); parts.hairspring = hairspring; baseY.hairspring = meta.hairspring.z; explodeY.hairspring = 1.2;
    const dimS = springMat.clone(); dimS.transparent = true; dimS.opacity = 0.09; dimS.depthWrite = false; mats.normal.set(hairspring, springMat); mats.dim.set(hairspring, dimS); mats.ghost.set(hairspring, dimS);

    const stopTheme = onThemeChange(() => lab.invalidate());
    buildStageBar(controls, camera); buildPartList(); applyStage(0, controls, camera, true);
    let last = 0;
    return {
      update(dt, t) {
        controls.update();
        try { step(Math.min(dt, 0.1)); placeLabels(camera); if (t - last > 0.25) { last = t; writeReadout(); } }
        catch (err) { if (!window.__labErr) { window.__labErr = String(err.stack || err); console.error('tourbillon update failed', err); } }
        window.__labFrames = (window.__labFrames || 0) + 1;
      },
      dispose() { controls.dispose(); stopTheme(); pmrem.dispose(); },
    };
  },
});
labRef = lab; window.__lab = { lab, state, params, parts, STAGES };
if (lab) {
  binder = bindControls(panel, params, (p, name) => {
    if (['dial', 'hands', 'caseOn', 'bridges', 'explode'].includes(name)) applyLayers();
    if (name === 'orientation') { state.errSum = 0; state.errN = 0; }
    if (name === 'labels') placeLabels(lab.camera);
    lab.setOnDemand(p.speed === 0); lab.invalidate();
  });
  applyLayers();
}

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
