/* Inside a perpetual calendar: the scene.
 * The calendar's logic is in model.js (pure, tested in Node over four years of
 * nights); this file loads the parts, drives them from a simulated clock, and
 * wires the stages, controls, labels and readout.  Lighting and materials come
 * from the shared studio look; the page adds the dial grid, aventurine and its
 * own callouts and framing (stage-kit.js). */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStudio, turntable, flyTo as studioFly } from '/assets/lab-kit/studio-look.js';
import { mountLab, bindControls, onThemeChange } from '/assets/lab-kit/lab-kit.js';
import { loadingVeil, loadGLB, fineGridNormal, aventurine, dimOf, ghost, Callouts, anchorOf, fitView } from './stage-kit.js';
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
const FLOOR_Y = -8.5;                                  // the shadow catcher sits a few mm under the caseback, so the watch floats over its own shadow
const EXPLODE_SCALE = 3;                                // the slider's 100% is three times the model's own explode offsets
const veil = loadingVeil(canvas.parentElement, ja);
const meta = await (await fetch(ASSETS + 'perpetual-meta.json')).json();
const L = meta.layout;
const TAU = Math.PI * 2, DEG = Math.PI / 180;

let spin = null, binder = null, labRef = null, callouts = null, controlsRef = null, subject = null, rootRef = null;
const params = { speed: 1, explode: 0, dial: true, hands: true, caseOn: true, plate: true, labels: true, stage: 0 };

const NAMES = {
  hour_wheel: ['Hour wheel, 1 turn in 12 h', '筒車、12 時間に 1 回転'], w24: ['24-hour wheel with the lift finger and moon finger', '24 時間車と持ち上げ爪・月爪'], grand_lever: ['Grand lever', '大レバー'], lever_spring: ['Lever return spring', 'レバー戻しバネ'], lever_post: ['Lever pivot', 'レバー軸'],
  date_star: ['Date star, 31 teeth, with its snail and month finger', '日付星車、31 歯、カタツムリと月送り爪つき'], date_jumper: ['Date jumper', '日付ジャンパー'], day_star: ['Day star, 7 teeth', '曜日星車、7 歯'], day_jumper: ['Day jumper', '曜日ジャンパー'],
  transfer_star: ['Transfer star, 8 teeth: one step a month', '中継星車、8 歯、月に 1 段'], transfer_jumper: ['Transfer jumper', '中継ジャンパー'], month_star: ['Month star, 12 teeth', '月星車、12 歯'], month_jumper: ['Month jumper', '月ジャンパー'],
  month_cam: ['48-notch cam: one turn in four years', '48 切り欠きカム、4 年に 1 回転'], month_inter: ['Intermediate wheel, 4:1 to the cam', '中間車、カムへ 4:1'], month_post: ['Fixed post for the cam', 'カムの固定軸'], moon_disc: ['Moon disc, 59 teeth, two moons', 'ムーンディスク、59 歯、月二つ'], moon_jumper: ['Moon jumper', '月ジャンパー'],
  calendar_plate: ['Calendar plate', 'カレンダー地板'], main_plate: ['Main plate (movement below)', '地板（下にムーブメント）'], cannon_pinion: ['Cannon pinion', 'ツツカナ'],
  dial: ['Dial with the week flange', '文字盤と週目盛りのフランジ'], indices: ['Applied indices', '植字インデックス'], hour_hand: ['Hour hand', '時針'], minute_hand: ['Minute hand', '分針'], week_hand: ['Week hand', '週針'], date_hand: ['Date hand', '日付針'], day_hand: ['Day hand', '曜日針'], month_hand: ['Month hand', '月針'], leap_hand: ['Leap-year hand', '閏年針'],
  case: ['Case, 41 mm, and integrated bracelet', 'ケース、41 mm、一体型ブレスレット'], bezel: ['Octagonal bezel, eight screws', '八角形ベゼル、八本のネジ'], crown: ['Crown', 'リューズ'], crystal: ['Sapphire crystal', 'サファイア風防'], caseback: ['Caseback', '裏蓋'], caseback_glass: ['Caseback window', '裏蓋の窓'],
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
  { id: 'watch', title: ['The watch', '時計'], view: [10, 48], frame: ['bezel'], margin: 1.1, show: {}, hi: [],
    text: ['A 41 mm perpetual calendar: day at nine, date at three, month at twelve with a small leap-year hand on the same axis, the moon in a window at six, and a long central hand for the week of the year. It knows the length of every month, February included, until the year 2100. Drag to orbit, scroll to zoom, and take the stages in order.',
           '41 mm の永久カレンダー。9 時に曜日、3 時に日付、12 時に月と同軸の小さな閏年針、6 時の窓に月、そして年の週を示す長い中央針。2100 年まで、2 月を含むすべての月の長さを知っている。ドラッグで回転、スクロールで拡大、段階は順に進めてほしい。'] },
  { id: 'module', title: ['1. The module under the dial', '1. 文字盤の下のモジュール'], view: [15, 62], labels: ['w24', 'grand_lever', 'date_star', 'day_star', 'transfer_star', 'month_star', 'month_cam', 'moon_disc'], margin: 1.12, show: { dial: false, hands: false, caseOn: false }, hi: MECH, ghost: [],
    text: ['Lift the dial and the calendar is a flat plate of levers and stars sitting over the ordinary motion works. Nothing here turns continuously except the 24-hour wheel at lower left; everything else waits, held by a jumper spring, and moves once a night. Set the speed to a day a second and watch.',
           '文字盤を外すと、カレンダーは普通の日の裏の上に載った、レバーと星車の平らな一枚だ。左下の 24 時間車以外、ここで連続して回るものはない。ほかはすべてジャンパーのバネに押さえられて待ち、一晩に一度だけ動く。速度を 1 秒 1 日にして見てほしい。'] },
  { id: 'lift', title: ['2. Midnight: the finger lifts the lever', '2. 真夜中：爪がレバーを持ち上げる'], view: [-20, 58], margin: 1.2, show: { dial: false, hands: false, caseOn: false }, hi: ['w24', 'grand_lever', 'lever_spring'], ghost: ['date_star', 'day_star'], midnight: true,
    text: ['The hour wheel drives a 24-hour wheel at half its speed. Once a turn, over the last hour of the day, its finger rides against the grand lever’s lift arm and pushes the whole lever round its pivot against a return spring. At midnight the finger slips past the arm and the lever drops back. Every calendar indication is driven from that one daily swing.',
           '筒車は 24 時間車を半分の速さで回す。一回転に一度、一日の最後の 1 時間に、その爪が大レバーの持ち上げ腕に当たり、戻しバネに逆らってレバー全体を軸のまわりに押す。真夜中に爪が腕を外れ、レバーは戻る。カレンダーのすべての表示は、この一日一回の振れから駆動される。'] },
  { id: 'stars', title: ['3. One tooth for the date, one for the day', '3. 日付に一歯、曜日に一歯'], view: [0, 66], margin: 1.15, show: { dial: false, hands: false, caseOn: false }, hi: ['grand_lever', 'date_star', 'date_jumper', 'day_star', 'day_jumper'], ghost: ['w24'], midnight: true,
    text: ['On the way up, the lever’s beak catches a tooth of the 31-tooth date star and its day arm catches the 7-tooth day star. Each star turns one tooth and snaps into the next hollow of its jumper, which is what makes the hands jump rather than creep. The date hand reads the date star, the day hand the day star.',
           '持ち上がる途中で、レバーの嘴が 31 歯の日付星車の歯を、曜日腕が 7 歯の曜日星車の歯を捕らえる。それぞれの星車は一歯ぶん回り、ジャンパーの次のくぼみに収まる。針がにじり寄らず跳ぶのはこのためだ。日付針は日付星車を、曜日針は曜日星車を読む。'] },
  { id: 'cam', title: ['4. The cam that knows the months', '4. 月を知るカム'], view: [10, 66], frame: ['month_cam', 'month_inter', 'month_star'], margin: 1.7, show: { dial: false, hands: false, caseOn: false }, hi: ['month_cam', 'grand_lever', 'month_inter', 'month_star'], ghost: ['transfer_star'],
    text: ['At twelve, on the month hand’s own axis, sits a cam with 48 notches round its edge: four years of months. The lever’s feeler rests in the notch for the current month. Thirty-one-day months are shallow, thirty-day months deeper, February deeper still, and one February in four, the leap year’s, a little shallower than the others. The deeper the notch, the lower the lever rests, and the further it swings every night of that month.',
           '12 時の、月針と同じ軸に、縁に 48 の切り欠きをもつカムがある。4 年ぶんの月だ。レバーの触針は今月の切り欠きに載る。31 日の月は浅く、30 日の月は深く、2 月はさらに深く、4 年に一度の閏年の 2 月だけ他より少し浅い。切り欠きが深いほどレバーは低く休み、その月の夜ごとの振れは大きくなる。'] },
  { id: 'jump', title: ['5. The end of a short month', '5. 短い月の終わり'], view: [20, 62], margin: 1.12, show: { dial: false, hands: false, caseOn: false }, hi: ['grand_lever', 'date_star', 'transfer_star', 'month_star', 'month_cam'], ghost: ['w24'], monthEnd: true,
    text: ['The date star carries a snail under its teeth, a spiral step that rises toward the 31st. On ordinary nights the lever’s snail arm swings short of it. On the last night of a short month the lever, resting deeper, swings far enough to catch the snail and drags the star round to the 1st: two teeth at the end of a 30-day month, three or four at the end of February. As the star passes the 31st, its finger steps the transfer star, whose finger steps the month star, and the month star turns the cam one notch through the intermediate wheel. Use the button to jump to the last night of the month and watch it happen.',
           '日付星車は歯の下にカタツムリ、31 日へ向かって上がる渦巻きの段をもつ。普通の夜は、レバーのカタツムリ腕はそれに届かない。短い月の最後の夜には、低く休んでいるレバーがカタツムリを捕らえるまで振れ、星車を 1 日まで引きずる。30 日の月の終わりに二歯、2 月の終わりに三歯か四歯。星車が 31 を過ぎるとき、その爪が中継星車を送り、中継星車の爪が月星車を送り、月星車は中間車を介してカムを一目盛り回す。ボタンで月末の夜へ飛んで、それが起きるのを見てほしい。'] },
  { id: 'moon', title: ['6. The moon', '6. 月'], view: [0, 68], frame: ['moon_disc', 'moon_jumper'], margin: 1.5, show: { dial: false, hands: false, caseOn: false }, hi: ['moon_disc', 'moon_jumper', 'w24'], ghost: [], midnight: true,
    text: ['A second finger on the 24-hour wheel steps the moon disc one tooth each night. The disc has 59 teeth and carries two moons, so each moon takes 59 nights to come round, 29.5 nights per lunation, against a true synodic month of 29.53 days: the display drifts one day in about two years and eight months. The aperture at six shows whichever moon is passing, and the dial hides the rest.',
           '24 時間車のもう一つの爪が、毎晩ムーンディスクを一歯送る。ディスクは 59 歯で月を二つ載せているので、各月が一巡するのに 59 夜、一朔望あたり 29.5 夜。真の朔望月 29.53 日に対して、表示は約 2 年 8 か月で 1 日ずれる。6 時の開口部は通りかかる月を見せ、文字盤が残りを隠す。'] },
  { id: 'year', title: ['7. Four years in a minute', '7. 4 年を 1 分で'], view: [10, 62], frame: MECH, margin: 1.05, show: { dial: false, hands: false, caseOn: false }, hi: [], ghost: [], fast: true,
    text: ['At a month a second, the whole mechanism runs through its four-year cycle. Watch the cam creep round, the lever change its reach as the notches change, and February jump three teeth or four depending on the year. The cam does not know that 2100 is not a leap year: that is the one correction a 48-month cam cannot make, and the watch will need a hand that year.',
           '1 秒に 1 か月の速さで、機構全体が 4 年周期を走る。カムがじりじり回り、切り欠きが変わるたびにレバーの届く範囲が変わり、2 月が年によって三歯または四歯跳ぶのを見てほしい。カムは 2100 年が閏年でないことを知らない。48 か月カムにできない唯一の補正で、その年には人の手が要る。'] },
  { id: 'exploded', title: ['8. Exploded', '8. 分解図'], view: [25, 14], frame: 'all', margin: 0.62, show: {}, hi: [], explode: 1,
    text: ['Case, crystal and bezel lifted away, then the hands, the dial, the calendar module part by part above its plate, and the movement’s own plate below. Use the explode slider to close it up again.',
           'ケース、風防、ベゼルを持ち上げ、次に針、文字盤、地板の上のカレンダーモジュールを部品ごとに、その下にムーブメントの地板。分解のスライダーで元に戻せる。'] },
];

// ------------------------------------------------------------------ state: a simulated clock in UTC milliseconds, shown as if local
const now = new Date();
const state = { ms: Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()), cal: null };
const parts = {}; const baseY = {}; const explodeY = {}; const anchors = {};
const mats = { normal: new Map(), dim: new Map() };
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
  for (const n of LAYER.plate) visible(n, params.plate);
  const e = params.explode;
  for (const n of Object.keys(parts)) { const o = parts[n]; if (o && explodeY[n] !== undefined) o.position.y = baseY[n] + explodeY[n] * e * EXPLODE_SCALE; }
}
function applyStage(i, instant = false) {
  const st = STAGES[i]; params.stage = i; spin?.set(st.id === 'watch' || st.id === 'exploded');
  for (const b of stageBar.children) { const on = +b.dataset.stage === i; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); }
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
  steel: { color: 0xd2d4d7, metalness: 1, roughness: 0.28, anisotropy: 0.5, envMapIntensity: 1.45, surf: 'brushed', rep: 4, ns: 0.15 },
  dark_steel: { color: 0x8a8d92, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 },
  spring_steel: { color: 0xbfc2c6, metalness: 1, roughness: 0.25, envMapIntensity: 1.4 },
  gilt: { color: 0xd8b46a, metalness: 1, roughness: 0.2, envMapIntensity: 1.2 },
  brass: { color: 0xcfa75e, metalness: 1, roughness: 0.26, envMapIntensity: 1.1 },
  rhodium_plate: { color: 0xc9cbce, metalness: 1, roughness: 0.24, envMapIntensity: 1.0, surf: 'geneva', rep: 4, ns: 0.12 },
  steel_brushed: { color: 0xa2a5aa, metalness: 1, roughness: 0.22, anisotropy: 0.6, envMapIntensity: 1.05, surf: 'brushed', rep: 5, ns: 0.22 },
  bezel_satin: { color: 0xa6a9ad, metalness: 1, roughness: 0.24, anisotropy: 0, envMapIntensity: 1.05, surf: 'brushed', rep: 4, ns: 0.25 },
  polished_steel: { color: 0xe4e5e7, metalness: 1, roughness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.03, envMapIntensity: 1.7 },
  blue_dial: { color: 0x2a4a8c, metalness: 0.45, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.15, normalMap: fineGridNormal(32, 1.49), normalScale: new THREE.Vector2(0.7, 0.7) },
  blue_sub: { color: 0x1d3a78, metalness: 0.5, roughness: 0.26, clearcoat: 0.55, clearcoatRoughness: 0.08, envMapIntensity: 1.2, surf: 'brushed', rep: 1.6, ns: 0.45 },
  flange: { color: 0x10224e, metalness: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.0 },
  print: { color: 0xf1eee6, metalness: 0, roughness: 0.5 },
  black: { color: 0x0c0c0d, metalness: 0, roughness: 0.55 },
  lume: { color: 0xdfe3d6, metalness: 0, roughness: 0.65, emissive: 0x9fc48a, emissiveIntensity: 0.04, envMapIntensity: 0.6 },
  moon: { map: aventurine(3), metalness: 0.25, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.05, envMapIntensity: 1.0 },
  moonlit: { metalness: 1, roughness: 0.22, envMapIntensity: 1.3 },
  stars: { metalness: 1, roughness: 0.2, envMapIntensity: 1.4 },
};
const FORCE_COLOR = { moon: 0xffffff, moonlit: 0xe7c47a, stars: 0xf2dfa8, lume: 0xd9ddd2 };

const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    camera.near = 0.5; camera.far = 600; camera.fov = 28; camera.updateProjectionMatrix();
    camera.position.set(10, 80, 50);
    const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxDistance = 260; controls.minDistance = 4;
    controls.addEventListener('change', () => lab.invalidate()); controlsRef = controls; labRef = lab;
    let gltf;
    try { gltf = await loadGLB(ASSETS + 'perpetual.glb', (f) => veil.progress(f * 0.85)); }
    catch (err) { veil.fail('The model could not be loaded.', 'モデルを読み込めなかった。'); throw err; }
    veil.step('Setting up the studio light', 'スタジオの光を準備中');
    const look = await createStudio(lab, { scale: 50, center: [0, -1, 0], floorY: FLOOR_Y, hdri: 'studio', hdriGain: 0.42, strips: 'watch', rotateY: 0.6,
      exposure: 1.0, envIntensity: 1.0, toneMapping: 'neutral', shadowOpacity: 0.42, keyIntensity: 0.25, aoRadius: 1.4, aoThickness: 0.5, aoStrength: 1.1 });
    veil.progress(0.95); window.__look = look;
    const root = gltf.scene; rootRef = root;
    look.upgrade(root, { extra: EXTRA });
    const byName = new Map(meta.parts.map((p) => [p.name, p]));
    root.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (FORCE_COLOR[m.name] !== undefined) m.color.set(FORCE_COLOR[m.name]);
        mats.normal.set(o, o.material); mats.dim.set(o, dimOf(o.material));
      }
      const p = byName.get(o.name);
      if (p && (o.parent === root || o.parent?.name === 'perpetual')) { parts[o.name] = o; baseY[o.name] = o.position.y; explodeY[o.name] = p.explode[2]; anchors[o.name] = anchorOf(p, o); }
    });
    // hands: a satin-polished white metal, so they read against the dial from any angle rather than mirroring the dark studio
    for (const n of LAYER.hands) parts[n]?.traverse((o) => { if (o.isMesh && o.material.name === 'polished_steel') { const m = o.material.clone(); m.roughness = 0.2; m.color.set(0xeceef0); m.envMapIntensity = 1.4; o.material = m; mats.normal.set(o, m); mats.dim.set(o, dimOf(m)); } });
    scene.add(root);
    spin = turntable(controls, canvas, { speed: 0.4 });
    callouts = new Callouts(labelLayer, canvas);
    const stopTheme = onThemeChange(() => lab.invalidate());
    buildStageBar(); buildPartList();
    step(0); applyStage(0, true);
    let last = 0, first = true;
    const ro = new ResizeObserver(() => { callouts.set(callouts.items.map(({ key, text, anchor }) => ({ key, text, anchor }))); }); ro.observe(canvas);
    return {
      update(dt, t) {
        spin.tick(); controls.update(); if (look.floor) look.floor.visible = camera.position.y > FLOOR_Y + 0.5 && params.explode < 0.05;
        try { step(Math.min(dt, 0.1)); root.updateMatrixWorld(); callouts.place(camera, params.labels, subject); if (t - last > 0.2) { last = t; writeReadout(); } }
        catch (err) { if (!window.__labErr) { window.__labErr = String(err.stack || err); console.error('perpetual-calendar update failed', err); } }
        if (first) { first = false; requestAnimationFrame(() => veil.done()); }
        window.__labFrames = (window.__labFrames || 0) + 1;
      },
      render: look.render,
      dispose() { controls.dispose(); stopTheme(); spin.dispose(); ro.disconnect(); look.dispose(); },
    };
  },
});
labRef = lab; window.__lab = { lab, state, params, parts, STAGES, M, applyStage };
if (lab) {
  binder = bindControls(panel, params, (p, name) => {
    if (['dial', 'hands', 'caseOn', 'plate', 'explode'].includes(name)) applyLayers();
    lab.setOnDemand(p.speed === 0); lab.invalidate();
  });
  applyLayers();
} else veil.fail('This browser has neither WebGPU nor WebGL 2; the still plan is shown instead.', 'このブラウザには WebGPU も WebGL 2 もないので、静止した平面図を表示している。');

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
