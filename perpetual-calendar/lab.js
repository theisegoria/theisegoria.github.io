/* Inside a perpetual calendar: the scene.
 * The calendar's logic is in model.js (pure, tested in Node over four years of
 * nights); this file loads the parts, drives them from a simulated clock, and
 * wires the stages, controls, labels and readout. */
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
const dateInput = document.getElementById('date');
const ASSETS = new URL('./assets/', import.meta.url).href;
const meta = await (await fetch(ASSETS + 'perpetual-meta.json')).json();
const L = meta.layout;
const TAU = Math.PI * 2, DEG = Math.PI / 180;

let binder = null, labRef = null;
const params = { speed: 1, explode: 0, dial: true, hands: true, caseOn: true, plate: true, labels: true, stage: 0 };

const NAMES = {
  hour_wheel: ['Hour wheel, 1 turn in 12 h', '筒車、12 時間に 1 回転'], w24: ['24-hour wheel with the lift finger and moon finger', '24 時間車と持ち上げ爪・月爪'], grand_lever: ['Grand lever', '大レバー'], lever_spring: ['Lever return spring', 'レバー戻しバネ'], lever_post: ['Lever pivot', 'レバー軸'],
  date_star: ['Date star, 31 teeth, with its snail and month finger', '日付星車、31 歯、カタツムリと月送り爪つき'], date_jumper: ['Date jumper', '日付ジャンパー'], day_star: ['Day star, 7 teeth', '曜日星車、7 歯'], day_jumper: ['Day jumper', '曜日ジャンパー'],
  transfer_star: ['Transfer star, 8 teeth: one step a month', '中継星車、8 歯、月に 1 段'], transfer_jumper: ['Transfer jumper', '中継ジャンパー'], month_star: ['Month star, 12 teeth', '月星車、12 歯'], month_jumper: ['Month jumper', '月ジャンパー'],
  month_cam: ['48-notch cam: one turn in four years', '48 切り欠きカム、4 年に 1 回転'], month_inter: ['Intermediate wheel, 4:1 to the cam', '中間車、カムへ 4:1'], month_post: ['Fixed post for the cam', 'カムの固定軸'], moon_disc: ['Moon disc, 59 teeth, two moons', 'ムーンディスク、59 歯、月二つ'], moon_jumper: ['Moon jumper', '月ジャンパー'],
  calendar_plate: ['Calendar plate', 'カレンダー地板'], main_plate: ['Main plate (movement below)', '地板（下にムーブメント）'], cannon_pinion: ['Cannon pinion', 'ツツカナ'],
  dial: ['Dial', '文字盤'], indices: ['Applied indices', '植字インデックス'], hour_hand: ['Hour hand', '時針'], minute_hand: ['Minute hand', '分針'], week_hand: ['Week hand', '週針'], date_hand: ['Date hand', '日付針'], day_hand: ['Day hand', '曜日針'], month_hand: ['Month hand', '月針'], leap_hand: ['Leap-year hand', '閏年針'],
  case: ['Case, 41 mm', 'ケース、41 mm'], bezel: ['Octagonal bezel', '八角形ベゼル'], crown: ['Crown', 'リューズ'], crystal: ['Sapphire crystal', 'サファイア風防'], caseback: ['Caseback', '裏蓋'], caseback_glass: ['Caseback window', '裏蓋の窓'],
};
const LAYER = {
  case: ['case', 'bezel', 'crown', 'crystal', 'caseback', 'caseback_glass'],
  dial: ['dial', 'indices'],
  hands: ['hour_hand', 'minute_hand', 'week_hand', 'date_hand', 'day_hand', 'month_hand', 'leap_hand'],
  plate: ['calendar_plate'],
};
const MECH = ['w24', 'grand_lever', 'lever_spring', 'date_star', 'date_jumper', 'day_star', 'day_jumper', 'transfer_star', 'transfer_jumper', 'month_star', 'month_jumper', 'month_cam', 'month_inter', 'moon_disc', 'moon_jumper'];

// ------------------------------------------------------------------ stages
const STAGES = [
  { id: 'watch', title: ['The watch', '時計'], view: [[0, 0, 0], 95, 10, 62], show: {}, hi: [],
    text: ['A 41 mm perpetual calendar: day at nine, date at three, month at twelve with a small leap-year hand on the same axis, the moon in a window at six, and a long central hand for the week of the year. It knows the length of every month, February included, until the year 2100. Drag to orbit, scroll to zoom, and take the stages in order.',
           '41 mm の永久カレンダー。9 時に曜日、3 時に日付、12 時に月と同軸の小さな閏年針、6 時の窓に月、そして年の週を示す長い中央針。2100 年まで、2 月を含むすべての月の長さを知っている。ドラッグで回転、スクロールで拡大、段階は順に進めてほしい。'] },
  { id: 'module', title: ['1. The module under the dial', '1. 文字盤の下のモジュール'], view: [[0, 0, 0.8], 40, 15, 65], show: { dial: false, hands: false, caseOn: false }, hi: MECH, ghost: [],
    text: ['Lift the dial and the calendar is a flat plate of levers and stars sitting over the ordinary motion works. Nothing here turns continuously except the 24-hour wheel at lower left; everything else waits, held by a jumper spring, and moves once a night. Set the speed to a day a second and watch.',
           '文字盤を外すと、カレンダーは普通の日の裏の上に載った、レバーと星車の平らな一枚だ。左下の 24 時間車以外、ここで連続して回るものはない。ほかはすべてジャンパーのバネに押さえられて待ち、一晩に一度だけ動く。速度を 1 秒 1 日にして見てほしい。'] },
  { id: 'lift', title: ['2. Midnight: the finger lifts the lever', '2. 真夜中：爪がレバーを持ち上げる'], view: [[-1, -2, 0.8], 26, -20, 60], show: { dial: false, hands: false, caseOn: false }, hi: ['w24', 'grand_lever', 'lever_spring'], ghost: ['date_star', 'day_star'], midnight: true,
    text: ['The hour wheel drives a 24-hour wheel at half its speed. Once a turn, over the last hour of the day, its finger rides against the grand lever’s lift arm and pushes the whole lever round its pivot against a return spring. At midnight the finger slips past the arm and the lever drops back. Every calendar indication is driven from that one daily swing.',
           '筒車は 24 時間車を半分の速さで回す。一回転に一度、一日の最後の 1 時間に、その爪が大レバーの持ち上げ腕に当たり、戻しバネに逆らってレバー全体を軸のまわりに押す。真夜中に爪が腕を外れ、レバーは戻る。カレンダーのすべての表示は、この一日一回の振れから駆動される。'] },
  { id: 'stars', title: ['3. One tooth for the date, one for the day', '3. 日付に一歯、曜日に一歯'], view: [[0, 0, 0.8], 30, 0, 70], show: { dial: false, hands: false, caseOn: false }, hi: ['grand_lever', 'date_star', 'date_jumper', 'day_star', 'day_jumper'], ghost: ['w24'], midnight: true,
    text: ['On the way up, the lever’s beak catches a tooth of the 31-tooth date star and its day arm catches the 7-tooth day star. Each star turns one tooth and snaps into the next hollow of its jumper, which is what makes the hands jump rather than creep. The date hand reads the date star, the day hand the day star.',
           '持ち上がる途中で、レバーの嘴が 31 歯の日付星車の歯を、曜日腕が 7 歯の曜日星車の歯を捕らえる。それぞれの星車は一歯ぶん回り、ジャンパーの次のくぼみに収まる。針がにじり寄らず跳ぶのはこのためだ。日付針は日付星車を、曜日針は曜日星車を読む。'] },
  { id: 'cam', title: ['4. The cam that knows the months', '4. 月を知るカム'], view: [[0, 6.5, 0.9], 16, 10, 70], show: { dial: false, hands: false, caseOn: false }, hi: ['month_cam', 'grand_lever', 'month_inter', 'month_star'], ghost: ['transfer_star'],
    text: ['At twelve, on the month hand’s own axis, sits a cam with 48 notches round its edge: four years of months. The lever’s feeler rests in the notch for the current month. Thirty-one-day months are shallow, thirty-day months deeper, February deeper still, and one February in four, the leap year’s, a little shallower than the others. The deeper the notch, the lower the lever rests, and the further it swings every night of that month.',
           '12 時の、月針と同じ軸に、縁に 48 の切り欠きをもつカムがある。4 年ぶんの月だ。レバーの触針は今月の切り欠きに載る。31 日の月は浅く、30 日の月は深く、2 月はさらに深く、4 年に一度の閏年の 2 月だけ他より少し浅い。切り欠きが深いほどレバーは低く休み、その月の夜ごとの振れは大きくなる。'] },
  { id: 'jump', title: ['5. The end of a short month', '5. 短い月の終わり'], view: [[4, 1, 0.8], 22, 20, 65], show: { dial: false, hands: false, caseOn: false }, hi: ['grand_lever', 'date_star', 'transfer_star', 'month_star', 'month_cam'], ghost: ['w24'], monthEnd: true,
    text: ['The date star carries a snail under its teeth, a spiral step that rises toward the 31st. On ordinary nights the lever’s snail arm swings short of it. On the last night of a short month the lever, resting deeper, swings far enough to catch the snail and drags the star round to the 1st: two teeth at the end of a 30-day month, three or four at the end of February. As the star passes the 31st, its finger steps the transfer star, whose finger steps the month star, and the month star turns the cam one notch through the intermediate wheel. Use the button to jump to the last night of the month and watch it happen.',
           '日付星車は歯の下にカタツムリ、31 日へ向かって上がる渦巻きの段をもつ。普通の夜は、レバーのカタツムリ腕はそれに届かない。短い月の最後の夜には、低く休んでいるレバーがカタツムリを捕らえるまで振れ、星車を 1 日まで引きずる。30 日の月の終わりに二歯、2 月の終わりに三歯か四歯。星車が 31 を過ぎるとき、その爪が中継星車を送り、中継星車の爪が月星車を送り、月星車は中間車を介してカムを一目盛り回す。ボタンで月末の夜へ飛んで、それが起きるのを見てほしい。'] },
  { id: 'moon', title: ['6. The moon', '6. 月'], view: [[0, -8, 1.0], 16, 0, 72], show: { dial: false, hands: false, caseOn: false }, hi: ['moon_disc', 'moon_jumper', 'w24'], ghost: [], midnight: true,
    text: ['A second finger on the 24-hour wheel steps the moon disc one tooth each night. The disc has 59 teeth and carries two moons, so each moon takes 59 nights to come round, 29.5 nights per lunation, against a true synodic month of 29.53 days: the display drifts one day in about two years and eight months. The window at six shows whichever moon is passing, and the dial’s edge hides the rest.',
           '24 時間車のもう一つの爪が、毎晩ムーンディスクを一歯送る。ディスクは 59 歯で月を二つ載せているので、各月が一巡するのに 59 夜、一朔望あたり 29.5 夜。真の朔望月 29.53 日に対して、表示は約 2 年 8 か月で 1 日ずれる。6 時の窓は通りかかる月を見せ、文字盤の縁が残りを隠す。'] },
  { id: 'year', title: ['7. Four years in a minute', '7. 4 年を 1 分で'], view: [[0, 0, 0.8], 34, 10, 66], show: { dial: false, hands: false, caseOn: false }, hi: [], ghost: [], fast: true,
    text: ['At a month a second, the whole mechanism runs through its four-year cycle. Watch the cam creep round, the lever change its reach as the notches change, and February jump three teeth or four depending on the year. The cam does not know that 2100 is not a leap year: that is the one correction a 48-month cam cannot make, and the watch will need a hand that year.',
           '1 秒に 1 か月の速さで、機構全体が 4 年周期を走る。カムがじりじり回り、切り欠きが変わるたびにレバーの届く範囲が変わり、2 月が年によって三歯または四歯跳ぶのを見てほしい。カムは 2100 年が閏年でないことを知らない。48 か月カムにできない唯一の補正で、その年には人の手が要る。'] },
  { id: 'exploded', title: ['8. Exploded', '8. 分解図'], view: [[0, 0, 0], 90, 25, 40], show: {}, hi: [], explode: 1,
    text: ['Case, crystal and bezel lifted away, then the hands, the dial, the calendar module part by part above its plate, and the movement’s own plate below. Use the explode slider to close it up again.',
           'ケース、風防、ベゼルを持ち上げ、次に針、文字盤、地板の上のカレンダーモジュールを部品ごとに、その下にムーブメントの地板。分解のスライダーで元に戻せる。'] },
];

// ------------------------------------------------------------------ state: a simulated clock in UTC milliseconds, shown as if local
const now = new Date();
const state = { ms: Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()), cal: null };
const parts = {}; const baseY = {}; const explodeY = {};
const mats = { normal: new Map(), dim: new Map(), ghost: new Map() };
const setRot = (name, a) => { const o = parts[name]; if (o) o.rotation.y = a; };
const visible = (name, v) => { const o = parts[name]; if (o) o.visible = v; };

// mesh phasing between the month star's pinion, the intermediate and the cam wheel (cosmetic; the rates are exact)
const dirTo = (a, b) => Math.atan2(L[b][1] - L[a][1], L[b][0] - L[a][0]);
function step(dt) {
  const s = state;
  if (params.speed > 0) s.ms += dt * 1000 * params.speed;
  const c = M.calendar(s.ms, L); s.cal = c;
  setRot('hour_wheel', c.hourWheel); setRot('hour_hand', c.hourWheel); setRot('minute_hand', c.minute); setRot('cannon_pinion', c.minute);
  setRot('w24', c.w24);
  setRot('grand_lever', c.lever);
  const springFlex = 0.06 * (c.lever - c.rest) / (M.STROKE - c.rest);
  setRot('lever_spring', -springFlex);
  setRot('date_star', c.dateStar); setRot('date_hand', c.dateStar);
  setRot('day_star', c.dayStar); setRot('day_hand', c.dayStar);
  setRot('transfer_star', c.transfer);
  setRot('month_star', c.monthStar); setRot('month_hand', c.monthStar);
  setRot('month_cam', c.cam);
  setRot('leap_hand', c.cam + Math.PI / 2 + TAU * 6 / 48);      // the hand points up in the middle of the leap year
  setRot('month_inter', -0.5 * c.monthStar + Math.PI / M.TEETH.inter);
  setRot('moon_disc', c.moon);
  setRot('week_hand', c.weekHand);
  // jumpers flex as the stars pass
  setRot('date_jumper', -0.05 * Math.sin(Math.PI * c.snap)); setRot('day_jumper', -0.05 * Math.sin(Math.PI * c.snap));
  setRot('moon_jumper', -0.04 * Math.sin(Math.PI * c.snap)); setRot('month_jumper', c.monthEnd ? -0.05 * Math.sin(Math.PI * c.snap) : 0); setRot('transfer_jumper', c.monthEnd ? -0.05 * Math.sin(Math.PI * c.snap) : 0);
}

// ------------------------------------------------------------------ jumps in time
function gotoTonight() { const d = new Date(state.ms); state.ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 57, 0); if (params.speed > 60) binder?.set('speed', 60); labRef?.invalidate(); }
function gotoMonthEnd() { const d = new Date(state.ms); const len = M.monthLength(d.getUTCFullYear(), d.getUTCMonth() + 1); state.ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), len, 23, 57, 0); if (params.speed > 60) binder?.set('speed', 60); labRef?.invalidate(); }
function gotoFebruary() { const d = new Date(state.ms); let y = d.getUTCFullYear(); if (d.getUTCMonth() + 1 >= 2 && !(d.getUTCMonth() + 1 === 2 && d.getUTCDate() < 28)) y += 1; const len = M.monthLength(y, 2); state.ms = Date.UTC(y, 1, len, 23, 57, 0); if (params.speed > 60) binder?.set('speed', 60); labRef?.invalidate(); }
function setDate(value) { const d = new Date(state.ms); const [y, m, dd] = value.split('-').map(Number); if (!y) return; state.ms = Date.UTC(y, m - 1, dd, d.getUTCHours(), d.getUTCMinutes(), 0); labRef?.invalidate(); }
for (const btn of document.querySelectorAll('[data-action]')) btn.addEventListener('click', () => { const a = btn.dataset.action; if (a === 'tonight') gotoTonight(); if (a === 'monthend') gotoMonthEnd(); if (a === 'february') gotoFebruary(); });
dateInput?.addEventListener('change', (e) => setDate(e.target.value));

// ------------------------------------------------------------------ stages, layers, highlight, labels (same shape as the tourbillon page)
function buildStageBar(controls, camera) {
  stageBar.innerHTML = '';
  STAGES.forEach((st, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? st.title[1] : st.title[0]; b.dataset.stage = i; b.addEventListener('click', () => applyStage(i, controls, camera)); stageBar.appendChild(b); });
}
function buildPartList() {
  partList.innerHTML = '';
  for (const n of Object.keys(NAMES)) { if (!parts[n]) continue; const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? NAMES[n][1] : NAMES[n][0]; b.dataset.part = n; b.addEventListener('click', () => { highlight([n]); showLabels([n]); labRef?.invalidate(); }); partList.appendChild(b); }
}
function ownerOf(mesh) { let o = mesh; while (o && !parts[o.name]) o = o.parent; return o ? o.name : mesh.name; }
function highlight(names, ghosts = []) {
  const set = new Set(names), g = new Set(ghosts);
  for (const [mesh, normal] of mats.normal) { const owner = ownerOf(mesh); const on = set.size === 0 || set.has(owner); mesh.material = g.has(owner) ? mats.ghost.get(mesh) : on ? normal : mats.dim.get(mesh); }
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
    const o = parts[el.dataset.part]; if (!o) continue; o.getWorldPosition(v3); v3.project(camera);
    const x = (v3.x * 0.5 + 0.5) * r.width, y = (-v3.y * 0.5 + 0.5) * r.height; const on = v3.z < 1 && x > -40 && x < r.width + 40 && y > -20 && y < r.height + 20;
    el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`; el.style.opacity = on ? 1 : 0;
  }
}
function applyLayers() {
  for (const n of LAYER.case) visible(n, params.caseOn);
  for (const n of LAYER.dial) visible(n, params.dial);
  for (const n of LAYER.hands) visible(n, params.hands);
  for (const n of LAYER.plate) visible(n, params.plate);
  const e = params.explode;
  for (const n of Object.keys(parts)) { const o = parts[n]; if (o && explodeY[n] !== undefined) o.position.y = baseY[n] + explodeY[n] * e; }
}
function applyStage(i, controls, camera, instant = false) {
  const st = STAGES[i]; params.stage = i;
  for (const b of stageBar.children) b.classList.toggle('is-active', +b.dataset.stage === i);
  stageText.textContent = ja ? st.text[1] : st.text[0];
  const show = { dial: true, hands: true, caseOn: true, plate: true, ...st.show };
  for (const k of Object.keys(show)) params[k] = show[k];
  params.explode = st.explode ?? 0;
  for (const k of ['explode', 'dial', 'hands', 'caseOn', 'plate']) binder?.set(k, params[k]);
  if (st.midnight) { gotoTonight(); binder?.set('speed', 60); }
  if (st.monthEnd) { gotoMonthEnd(); binder?.set('speed', 60); }
  if (st.fast) binder?.set('speed', 2592000);
  if (st.id === 'module') binder?.set('speed', 86400);
  if (!st.midnight && !st.monthEnd && !st.fast && st.id !== 'module' && params.speed > 60) binder?.set('speed', 1);
  applyLayers(); highlight(st.hi, st.ghost || []); showLabels(st.hi);
  const [pos, target] = viewToCamera(st.view); flyTo(controls, camera, pos, target, instant);
}
function viewToCamera([t, dist, az, el]) { const target = [t[0], t[2], -t[1]]; const a = az * DEG, e = el * DEG; return [[target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e)], target]; }
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
    const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(18, 40, 24); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-20, -30, -10); scene.add(rim);
    const gltf = await new GLTFLoader().loadAsync(ASSETS + 'perpetual.glb');
    const root = gltf.scene; const byName = new Map(meta.parts.map((p) => [p.name, p]));
    root.traverse((o) => {
      if (o.isMesh) {
        o.material.envMapIntensity = 1.0; o.frustumCulled = false; if (o.material.transparent) o.material.depthWrite = false;
        const dim = o.material.clone(); dim.transparent = true; dim.opacity = 0.09; dim.depthWrite = false; dim.envMapIntensity = 0; dim.color.multiplyScalar(0.55); dim.metalness = 0.2;
        const ghost = o.material.clone(); ghost.transparent = true; ghost.opacity = 0.28; ghost.depthWrite = false;
        mats.normal.set(o, o.material); mats.dim.set(o, dim); mats.ghost.set(o, ghost);
      }
      const p = byName.get(o.name);
      if (p && (o.parent === root || o.parent?.name === 'perpetual')) { parts[o.name] = o; baseY[o.name] = o.position.y; explodeY[o.name] = p.explode[2]; }
    });
    scene.add(root);
    const stopTheme = onThemeChange(() => lab.invalidate());
    buildStageBar(controls, camera); buildPartList(); applyStage(0, controls, camera, true);
    let last = 0;
    return {
      update(dt, t) {
        controls.update();
        try { step(Math.min(dt, 0.1)); placeLabels(camera); if (t - last > 0.2) { last = t; writeReadout(); } }
        catch (err) { if (!window.__labErr) { window.__labErr = String(err.stack || err); console.error('perpetual-calendar update failed', err); } }
        window.__labFrames = (window.__labFrames || 0) + 1;
      },
      dispose() { controls.dispose(); stopTheme(); pmrem.dispose(); },
    };
  },
});
labRef = lab; window.__lab = { lab, state, params, parts, STAGES, M };
if (lab) {
  binder = bindControls(panel, params, (p, name) => {
    if (['dial', 'hands', 'caseOn', 'plate', 'explode'].includes(name)) applyLayers();
    if (name === 'labels') placeLabels(lab.camera);
    lab.setOnDemand(p.speed === 0); lab.invalidate();
  });
  applyLayers();
}

// ------------------------------------------------------------------ readout
const MONTHS = ja ? ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月'] : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ja ? ['日', '月', '火', '水', '木', '金', '土'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function writeReadout() {
  const c = state.cal; if (!c) return;
  const hh = Math.floor(c.h), mm = Math.floor((c.h * 60) % 60);
  const t = M.tonight(state.ms);
  const cycle = ['L', '1', '2', '3'][c.camIndex >= 0 ? Math.floor(c.camIndex / 12) : 0];
  readout.innerHTML = [
    [T('shown', '表示'), `${DAYS[c.dow]} ${c.day} ${MONTHS[c.m - 1]} ${c.y} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`],
    [T('leap-year hand', '閏年針'), cycle === 'L' ? T('L: leap year', 'L：閏年') : `${cycle} ${T('of the cycle', '（周期中）')}`],
    [T('cam notch', 'カムの切り欠き'), `${c.camIndex + 1}/48 · ${c.depth.toFixed(2)} mm · ${T('lever rests', 'レバー休止')} ${(c.rest / DEG).toFixed(1)}°`],
    [T('tonight', '今夜'), `${t.from} → ${t.to}, ${t.teeth} ${T(t.teeth === 1 ? 'tooth' : 'teeth', '歯')}${t.monthChanges ? T(', month changes', '、月が変わる') : ''}`],
    [T('lever', 'レバー'), `${(c.lever / DEG).toFixed(1)}° · ${c.phase === 'running' ? T('at rest', '休止') : c.phase === 'lifting' ? T('lifting', '持ち上げ中') : T('jumping', 'ジャンプ')}`],
    [T('moon', '月'), `${c.moonAge.toFixed(1)} ${T('days old', '日齢')} · ${T('tooth', '歯')} ${((c.moonTooth % 59) + 59) % 59}/59`],
    [T('week', '週'), String(c.week)],
  ].map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('');
}
