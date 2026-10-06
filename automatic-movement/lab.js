/* Inside an automatic chronograph: the scene.
 * The mathematics of the movement is in model.js (pure, tested in Node);
 * this file loads the parts, drives them from that model, and wires the
 * controls, the guided stages and the labels. */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createStudio, turntable } from '/assets/lab-kit/studio-look.js';
import { mountLab, bindControls, readColors, onThemeChange, isDark } from '/assets/lab-kit/lab-kit.js';
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

const meta = await (await fetch(ASSETS + 'movement-meta.json')).json();
const L = meta.layout;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ parameters
let binder = null;
let labRef = null;
const params = { speed: 1, activity: 0.5, crown: 0, explode: 0, dial: false, hands: true, autoLayer: true, chronoLayer: true, bridges: true, labels: true, stage: 0 };

// ------------------------------------------------------------------ part names, for labels and the part list
const NAMES = {
  rotor: ['Rotor (oscillating weight)', 'ローター（回転錘）'], reverser_a: ['Reverser wheel', '切替車'], reverser_b: ['Reverser wheel', '切替車'], reduction: ['Reduction wheel', '減速車'],
  ratchet_drive: ['Ratchet driving wheel', '角穴車駆動車'], ratchet_wheel: ['Ratchet wheel (on the barrel arbor)', '角穴車（香箱真の上）'], click: ['Click', 'コハゼ'], auto_bridge: ['Automatic bridge', '自動巻き受け'], rotor_post: ['Ball-bearing post', 'ボールベアリング'],
  crown_wheel: ['Crown wheel', '丸穴車'], crown_inter: ['Intermediate winding wheel', '巻き上げ中間車'], winding_stem: ['Winding stem and crown', '巻き真とリューズ'], winding_pinion: ['Winding pinion', '巻き上げカナ'], sliding_pinion: ['Sliding pinion (castle wheel)', 'ツヅミ車'],
  setting_lever: ['Setting lever', 'オシドリ'], yoke: ['Yoke (setting-lever spring)', 'カンヌキ'], setting_a: ['Setting wheel', '小鉄車'], setting_b: ['Setting wheel', '小鉄車'],
  barrel: ['Barrel (mainspring inside)', '香箱（中にゼンマイ）'], barrel_arbor: ['Barrel arbor', '香箱真'], mainspring: ['Mainspring', 'ゼンマイ'], barrel_bridge: ['Barrel bridge', '香箱受け'],
  centre_wheel: ['Centre (second) wheel, 1 turn per hour', '二番車：1 時間に 1 回転'], third_wheel: ['Third wheel', '三番車'], fourth_wheel: ['Fourth wheel, 1 turn per minute', '四番車：1 分に 1 回転'], escape_wheel: ['Escape wheel', 'ガンギ車'],
  pallet_fork: ['Pallet fork (lever)', 'アンクル'], balance: ['Balance wheel', 'テンプ'], hairspring: ['Hairspring', 'ヒゲゼンマイ'], regulator: ['Regulator and stud', '緩急針とヒゲ持ち'], balance_cock: ['Balance cock', 'テンプ受け'], train_bridge: ['Train bridge', '輪列受け'], main_plate: ['Main plate', '地板'],
  cannon_pinion: ['Cannon pinion (minute hand)', 'ツツカナ（分針）'], motion_idler: ['Motion-works idler', '日の裏中間車'], minute_wheel: ['Minute wheel', '日の裏車'], hour_wheel: ['Hour wheel (hour hand)', '筒車（時針）'], date_drive: ['Date driving wheel, 1 turn per day', '日送り車：1 日に 1 回転'], date_ring: ['Date ring', '日車'], date_jumper: ['Date jumper', '日ジャンパー'],
  clutch_drive: ['Clutch driving wheel, 1 turn per minute', 'クラッチ駆動車：1 分に 1 回転'], clutch_disc: ['Vertical clutch disc', '垂直クラッチ板'], chrono_seconds: ['Chronograph seconds wheel and heart', 'クロノ秒車とハート'], chrono_inter: ['Chronograph intermediate wheel', 'クロノ中間車'],
  column_wheel: ['Column wheel', 'コラムホイール'], operating_lever: ['Operating lever (start/stop pusher)', '作動レバー（スタート・ストップ）'], clutch_fork: ['Clutch fork', 'クラッチフォーク'], brake_lever: ['Brake lever', 'ブレーキレバー'], hammer: ['Reset hammer (seconds and minutes)', '帰零ハンマー（秒・分）'], hour_hammer: ['Hour-counter hammer', '時積算ハンマー'],
  minute_counter: ['Minute counter and heart', '分積算車とハート'], mc_idler: ['Minute-counter idler', '分積算中間車'], minute_jumper: ['Minute-counter jumper', '分積算ジャンパー'], hc_inter: ['Hour-counter intermediate', '時積算中間車'], hour_counter: ['Hour counter and heart', '時積算車とハート'], chrono_bridge: ['Chronograph bridge', 'クロノグラフ受け'], pushers: ['Pushers', 'プッシャー'],
  dial: ['Dial', '文字盤'], plate_jewels: ['Jewels', '受け石'], central_pipe: ['Central arbor', '中心軸'], shock_setting: ['Shock-protected jewel setting', '耐震装置付きの受け石'],
};
const LAYER = {
  auto: ['rotor', 'reverser_a', 'reverser_b', 'reduction', 'ratchet_drive', 'ratchet_wheel', 'click', 'auto_bridge', 'rotor_post', 'crown_inter'],
  chrono: ['clutch_drive', 'clutch_disc', 'chrono_seconds', 'chrono_inter', 'column_wheel', 'column_jumper', 'operating_lever', 'clutch_fork', 'brake_lever', 'hammer', 'hour_hammer', 'minute_counter', 'mc_idler', 'minute_jumper', 'hc_inter', 'hour_counter', 'chrono_bridge', 'pushers', 'central_pipe'],
  bridges: ['train_bridge', 'barrel_bridge', 'balance_cock', 'shock_setting', 'chrono_bridge', 'auto_bridge', 'regulator'],
  hands: ['hour_hand', 'minute_hand', 'chrono_hand', 'small_seconds_hand', 'minute_counter_hand', 'hour_counter_hand'],
  dial: ['dial'],
};
// explode offsets (mm, along the axis) per group so the layers separate
const EXPLODE = {
  dialside: ['dial', 'hour_hand', 'minute_hand', 'chrono_hand', 'small_seconds_hand', 'minute_counter_hand', 'hour_counter_hand'],
  motion: ['date_ring', 'date_jumper', 'date_drive', 'hour_wheel', 'minute_wheel', 'cannon_pinion', 'motion_idler', 'setting_a', 'setting_b', 'setting_lever', 'yoke'],
  auto: LAYER.auto, autoBridge: ['auto_bridge', 'rotor_post'], rotor: ['rotor'],
  chrono: LAYER.chrono.filter((n) => n !== 'chrono_bridge'), chronoBridge: ['chrono_bridge'],
  bridges: ['train_bridge', 'barrel_bridge', 'balance_cock', 'shock_setting', 'regulator'],
};
const EXPLODE_Z = { dialside: 6, motion: 2.5, rotor: -14, auto: -11, autoBridge: -9, chrono: -6, chronoBridge: -8, bridges: -3 };

// ------------------------------------------------------------------ guided stages
const STAGES = [
  { id: 'whole', title: ['The whole movement', 'ムーブメント全体'], view: [[0, 0, -3], 62, 35, 45], show: {}, hi: [], pad: 0.72,
    text: ['Seen from the back, as through a display caseback. The rotor is on top; under it the winding train, then the chronograph, then the going train against the main plate, and on the far side the dial. Drag to orbit, scroll to zoom, and use the stages below to take it apart.',
           '裏蓋側から見たところ。いちばん上にローター、その下に自動巻きの輪列、次にクロノグラフ、地板に接して時計の輪列、反対側に文字盤がある。ドラッグで回転、スクロールで拡大。下の段階を順に選ぶと分解していく。'] },
  { id: 'rotor', title: ['1. The rotor winds the spring', '1. ローターがゼンマイを巻く'], view: [[0, 0, -6], 40, 20, 60], pad: 0.78, show: { chronoLayer: false }, hi: ['rotor', 'reverser_a', 'reverser_b', 'reduction', 'ratchet_drive', 'ratchet_wheel', 'click'], ghost: ['rotor'],
    text: ['Every movement of the wrist swings the half-disc rotor on its ball bearing. Its pinion turns the two reverser wheels; their pawls take up whichever direction the rotor happens to be turning and hand it on as one direction to the reduction wheel, which turns the ratchet wheel on the barrel arbor. The click stops the arbor unwinding. Turn up the wrist activity and watch the ratchet wheel creep round, 45 rotor turns to one turn of the arbor.',
           '手首が動くたびに、半円のローターがボールベアリングの上で振れる。そのカナが二つの切替車を回し、切替車の爪がローターの向きにかかわらず一方向の回転だけを減速車へ渡す。減速車は香箱真の上の角穴車を回し、コハゼが逆戻りを止める。手首の活動量を上げると、角穴車がじりじりと進むのが見える。ローター 45 回転で香箱真 1 回転だ。'] },
  { id: 'barrel', title: ['2. The barrel stores it', '2. 香箱がそれを蓄える'], view: [[-5.4, 6.9, -2], 26, -25, 58], show: { autoLayer: false, chronoLayer: false, bridges: false }, hi: ['barrel', 'barrel_arbor', 'mainspring', 'centre_wheel'], ghost: ['barrel'],
    text: ['The mainspring is a coiled strip hooked to the arbor at its inner end and to the drum at its outer end. Winding tightens the coils round the arbor; as it runs down, the coils migrate out to the wall. The drum has teeth, and its slow rotation, once in twelve hours, is the only power the rest of the watch ever gets. Eighty hours of running is six and two-thirds turns of the barrel.',
           'ゼンマイは帯状の板を巻いたもので、内端は香箱真に、外端は香箱の胴に引っかけてある。巻くと渦が真の周りに締まり、ほどけるにつれて外壁側へ移っていく。胴には歯が切ってあり、12 時間に 1 回転というその遅い回転が、時計の残り全部が受け取る唯一の動力だ。80 時間の駆動は香箱 6 と 3 分の 2 回転にあたる。'] },
  { id: 'train', title: ['3. The going train gears it up', '3. 輪列が回転を速める'], view: [[-2, -1, -2], 34, -20, 60], show: { autoLayer: false, chronoLayer: false, bridges: false, dial: false }, hi: ['barrel', 'centre_wheel', 'third_wheel', 'fourth_wheel', 'escape_wheel'],
    text: ['Barrel, centre wheel, third wheel, fourth wheel, escape wheel. Each big wheel drives the next small pinion, so every mesh multiplies speed and divides torque: 96 teeth into 8, 80 into 10, 75 into 10, 84 into 7. The centre wheel turns once an hour and, through the motion works, carries the minute hand; the fourth wheel turns once a minute and carries the small seconds hand; the escape wheel turns once every five seconds. The ratios are exact, and in this model they are the ones you see.',
           '香箱、二番車、三番車、四番車、ガンギ車。大きな歯車が次の小さなカナを回すので、噛み合いのたびに速さが増え、トルクが減る。96 枚が 8 枚へ、80 が 10 へ、75 が 10 へ、84 が 7 へ。二番車は 1 時間に 1 回転して日の裏を通じて分針を、四番車は 1 分に 1 回転して秒針を運び、ガンギ車は 5 秒に 1 回転する。比はどれも厳密で、この模型では見たままの歯数で回っている。'] },
  { id: 'escapement', title: ['4. The escapement lets it go one tooth at a time', '4. 脱進機が一歯ずつ逃がす'], view: [[0.5, -4, -2.3], 16, 10, 55], show: { autoLayer: false, chronoLayer: false, bridges: false }, hi: ['escape_wheel', 'pallet_fork', 'balance', 'hairspring'], slow: true,
    text: ['Set the speed to slow motion. The pallet fork rocks between its two bankings. Each time the balance swings through its rest point, the impulse pin in its roller knocks the fork across: the pallet stone that was locking the escape wheel lifts, the wheel turns half a tooth pitch (9 degrees), and as it does the sloping club tooth slides along the pallet face and gives the fork, and through it the balance, a push. Then the other stone drops in and locks the wheel until the balance comes back. Eight vibrations a second, 28,800 an hour; the whole train above only moves during those brief unlocks.',
           '速度をスローモーションにしてほしい。アンクルは二つのバンキングの間を往復する。テンプが静止点を通るたびに、振り座の振り石がアンクルをはじく。ガンギ車を止めていた爪石が外れ、歯車は半歯ピッチ（9 度）進み、その間に斜めのクラブ歯が爪石の面を滑って、アンクルに、そしてテンプに、ひと押しを与える。それからもう一方の爪石が落ちて、テンプが戻るまで歯車を止める。1 秒に 8 振動、1 時間に 28,800 振動。上の輪列全体は、この短い解放の間だけ動く。'] },
  { id: 'balance', title: ['5. The balance keeps time', '5. テンプが時を刻む'], view: [[-3.4, -6.5, -3.4], 20, -10, 60], show: { autoLayer: false, chronoLayer: false, bridges: true }, hi: ['balance', 'hairspring', 'regulator', 'balance_cock', 'shock_setting'], ghost: ['balance_cock'],
    text: ['A rimmed wheel on a hairspring is a torsion pendulum: its period depends on the wheel’s inertia and the spring’s stiffness, not on how far it swings, which is why the watch keeps time as the mainspring runs down and the amplitude drops. The hairspring breathes: its inner end turns with the balance while its outer end is pinned to the stud, so the coils open on one half-swing and close on the other. The regulator shortens or lengthens the active spring by a hair to bring the rate in.',
           'リムのついた輪をヒゲゼンマイに載せたものはねじれ振り子で、周期は輪の慣性とバネの硬さで決まり、振れ幅には依らない。ゼンマイがほどけて振り角が落ちても時計が狂わないのはそのためだ。ヒゲゼンマイは呼吸する。内端はテンプとともに回り、外端はヒゲ持ちに固定されているので、半振動ごとに渦が開き、閉じる。緩急針は有効なバネの長さをほんの少し変えて、歩度を合わせる。'] },
  { id: 'motion', title: ['6. Motion works and hands', '6. 日の裏と針'], view: [[0, 0, 0.6], 30, 20, -55], show: { autoLayer: false, chronoLayer: false, dial: false }, hi: ['cannon_pinion', 'motion_idler', 'minute_wheel', 'hour_wheel', 'date_drive', 'date_ring'], side: 'dial',
    text: ['On the dial side the centre wheel’s arbor drives the cannon pinion through an idler, one turn per hour, and the cannon pinion carries the minute hand. Its leaves drive the minute wheel, whose pinion drives the hour wheel: 10 into 30, then 8 into 32, a twelfth of a turn per hour, and the hour wheel carries the hour hand. The hour wheel also drives the date wheel at half its speed, one turn a day, whose finger pushes the 31-tooth date ring one step at midnight while the jumper spring holds it steady the rest of the time.',
           '文字盤側では、二番車の軸が中間車を介してツツカナを 1 時間に 1 回転させ、ツツカナが分針を運ぶ。ツツカナのカナは日の裏車を回し、日の裏車のカナが筒車を回す。10 枚が 30 枚へ、8 枚が 32 枚へ、1 時間に 12 分の 1 回転。筒車が時針を運ぶ。筒車はさらに日送り車を半分の速さ、1 日 1 回転で回し、その爪が真夜中に 31 歯の日車を一歯だけ送る。残りの時間はジャンパーが日車を押さえている。'] },
  { id: 'face', title: ['7. The face', '7. 文字盤'], view: [[0, 0, 2], 62, 15, -62], pad: 0.7, show: { autoLayer: false, chronoLayer: true, dial: true, hands: true }, hi: [],
    text: ['What all of it is for. The minute and hour hands ride on the cannon pinion and hour wheel at the centre; the small seconds at six is the fourth wheel\u2019s own arbor, poking through the dial; the long central hand and the two counters belong to the chronograph, on arbors that reach up through the whole movement. Start the chronograph and set the speed high to see the counters step.',
           'これらすべての目的がここにある。分針と時針は中心のツツカナと筒車に載り、6 時の秒針は四番車の軸そのものが文字盤を貫いたものだ。長い中央針と二つの積算計はクロノグラフのもので、ムーブメント全体を貫いて伸びる軸に載っている。クロノグラフをスタートして速度を上げると、積算計が段階的に進むのが見える。'] },
  { id: 'keyless', title: ['8. The crown: winding and setting', '8. リューズ：巻き上げと時刻合わせ'], view: [[9.5, 0, 0], 22, 8, -58], pad: 0.85, show: { autoLayer: false, chronoLayer: false, dial: false }, hi: ['winding_stem', 'winding_pinion', 'sliding_pinion', 'setting_lever', 'yoke', 'setting_a', 'setting_b', 'crown_wheel', 'crown_inter'],
    text: ['Pull the crown and watch the keyless works. The stem’s groove carries the setting lever, which swings the yoke, which slides the castle-shaped sliding pinion along the stem. Pushed in, its crown teeth mesh the winding pinion and turning the crown winds the spring through the crown wheel. Pulled out, the same pinion slides across to the setting wheels and turning the crown now drags the minute wheel round, the cannon pinion slipping on its arbor, while a hacking lever stops the balance so the seconds can be set exactly.',
           'リューズを引いて、巻き真まわりを見てほしい。巻き真の溝がオシドリを動かし、オシドリがカンヌキを振り、カンヌキが城形のツヅミ車を巻き真に沿って滑らせる。押し込んだ状態では、ツヅミ車の冠歯が巻き上げカナと噛み、リューズを回すと丸穴車を通じてゼンマイが巻かれる。引き出すと同じツヅミ車が小鉄車側へ移り、リューズを回すと日の裏車が引きずられ、ツツカナが軸の上で滑る。同時にハック機構がテンプを止め、秒まで正確に合わせられる。'] },
  { id: 'chrono-drive', title: ['9. The chronograph: a second train riding on the first', '9. クロノグラフ：一番目の輪列に乗る二番目の輪列'], view: [[2, -4, -4], 30, 30, 55], show: { autoLayer: false, dial: false }, hi: ['fourth_wheel', 'chrono_inter', 'clutch_drive', 'clutch_disc', 'chrono_seconds', 'column_wheel'],
    text: ['The fourth wheel’s arbor is extended up through the train bridge and carries a driving wheel; through an intermediate it turns the clutch driving wheel at the centre, once a minute, always. Above that wheel sits the chronograph seconds wheel, which carries the long central hand. Between them is the vertical clutch: a disc pressed down by a spring so that, when the fork releases it, friction alone couples the two wheels. No teeth engage when you press start, so the hand does not jump and the balance amplitude barely changes.',
           '四番車の軸を輪列受けの上まで延ばし、駆動車を載せてある。中間車を通じて中心のクラッチ駆動車が 1 分に 1 回転、常に回っている。その上にクロノグラフ秒車があり、長い中央針を運ぶ。二つの間にあるのが垂直クラッチだ。バネで押し下げられた板で、フォークが放すと摩擦だけで二つの車を結ぶ。スタートを押しても歯が噛み合うわけではないから、針は飛ばず、テンプの振り角もほとんど変わらない。'] },
  { id: 'column', title: ['10. The column wheel commands the levers', '10. コラムホイールがレバーを指揮する'], view: [[8, 0, -4.2], 24, 40, 58], frame: ['column_wheel', 'operating_lever', 'clutch_fork', 'brake_lever', 'hammer', 'column_jumper'], show: { autoLayer: false, dial: false }, hi: ['column_wheel', 'operating_lever', 'clutch_fork', 'brake_lever', 'hammer', 'column_jumper'],
    text: ['Press start. The operating lever’s pawl turns the column wheel one ratchet tooth, and its eight columns rotate under the tails of three levers. The clutch fork’s tail drops into a gap, so its prongs lower the clutch disc and the chronograph runs. The brake lever’s tail is lifted onto a column, freeing the seconds wheel. The hammer’s tail is raised onto a column, so it cannot fall. Press again: the wheel turns another tooth, and every lever does the opposite. That is why a column-wheel chronograph feels crisp: one part, the column wheel, sequences everything.',
           'スタートを押す。作動レバーの爪がコラムホイールをラチェット一歯分回し、八本の柱が三つのレバーの尾の下で回る。クラッチフォークの尾は溝に落ち、その二本の腕がクラッチ板を下ろしてクロノグラフが走り出す。ブレーキレバーの尾は柱に乗り上げ、秒車を解放する。ハンマーの尾も柱に乗り上げ、落ちられなくなる。もう一度押すと、車はさらに一歯回り、すべてのレバーが逆の動きをする。コラムホイール式の押し心地が明快なのはこのためだ。コラムホイールという一つの部品が、すべてを順序づけている。'] },
  { id: 'counters', title: ['11. Counters and the flyback to zero', '11. 積算計と帰零'], view: [[0, 0, -4.2], 34, 10, 65], show: { autoLayer: false, dial: false }, hi: ['chrono_seconds', 'mc_idler', 'minute_counter', 'minute_jumper', 'hc_inter', 'hour_counter', 'hammer', 'hour_hammer'],
    text: ['Once a turn, a finger on the seconds wheel flicks an idler star and the 30-tooth minute counter jumps one step against its jumper spring. The hour counter is driven continuously from the centre arbor at a turn per twelve hours through a slipping friction, and simply held by its hammer when the chronograph is off. Each counter carries a heart-shaped cam. Press reset with the chronograph stopped: the hammers fall, each heart is pushed round to its notch by the shortest way, and all three hands fly to zero together.',
           '一回転ごとに秒車の爪が中間の星車をはじき、30 歯の分積算車がジャンパーに逆らって一段跳ぶ。時積算車は二番車の軸から 12 時間に 1 回転で滑り摩擦を介して常時駆動され、クロノグラフが止まっている間はハンマーに押さえられているだけだ。各積算車にはハート形のカムがある。クロノグラフを止めてリセットを押すと、ハンマーが落ち、それぞれのハートが最短の向きに切欠きまで押し回され、三本の針が一斉に零へ飛ぶ。'] },
  { id: 'exploded', title: ['12. Exploded', '12. 分解図'], view: [[0, 0, -3], 80, 35, 30], pad: 0.72, show: { dial: true }, hi: [], explode: 1,
    text: ['The layers pulled apart along the axis: dial and hands, motion works and date, the main plate with the going train and its bridges, the chronograph, then the automatic module with the rotor on top. Move the explode slider to close it back up.',
           '軸に沿って層を引き離したところ。文字盤と針、日の裏と日付、輪列と受けを載せた地板、クロノグラフ、そしていちばん上にローターを載せた自動巻きモジュール。分解のスライダーを戻すと元どおりに閉じる。'] },
];

// ------------------------------------------------------------------ state
const state = {
  simT: 0,                    // seconds of running time
  clock: 10 * 3600 + 8 * 60 + 42,   // time of day shown at simT = 0, seconds
  handsOffset: 0,             // extra cannon-pinion angle from setting the time (radians, negative = clockwise)
  wind: 0.72, running: true, amplitude: M.BALANCE_AMPLITUDE,
  rotor: { angle: 0.4, omega: 0, travelled: 0 },
  reduction: 0, ratchet: 0, ratchetDrive: 0, crownAngle: 0, crownInter: 0,
  chrono: M.chronoInit(), pressStart: false, pressReset: false, pushStart: 0, pushReset: 0, columnShown: 0,
  pull: 0, dateSteps: 0,
  beats: 0,
};

// ------------------------------------------------------------------ helpers
const parts = {};                        // name -> Object3D
const baseY = {};                        // name -> original y (mm) for the explode
const baseX = {};
const mats = { normal: new Map(), dim: new Map(), ghost: new Map() };
let hairspring, mainspring;              // procedural meshes
let envTex;

function ribbonGeometry(n) {
  // a thin box strip: 4 vertices per sample (outer-top, outer-bottom, inner-bottom, inner-top), 8 triangles per segment
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 4 * 3);
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    const a = 4 * i, b = 4 * (i + 1);
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; idx.push(a + k, b + k, a + k2, b + k, b + k2, a + k2); }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
function updateRibbon(mesh, samples, height, yMid, thick = 0.05) {
  const pos = mesh.geometry.attributes.position.array;
  for (let i = 0; i < samples.length; i++) {
    const [r, th] = samples[i];
    const c = Math.cos(th), sn = Math.sin(th);
    const ro = r + thick / 2, ri = r - thick / 2;
    const o = i * 12;
    pos[o] = ro * c; pos[o + 1] = yMid + height / 2; pos[o + 2] = -ro * sn;
    pos[o + 3] = ro * c; pos[o + 4] = yMid - height / 2; pos[o + 5] = -ro * sn;
    pos[o + 6] = ri * c; pos[o + 7] = yMid - height / 2; pos[o + 8] = -ri * sn;
    pos[o + 9] = ri * c; pos[o + 10] = yMid + height / 2; pos[o + 11] = -ri * sn;
  }
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeBoundingSphere();
}

const dir = (a, b) => Math.atan2(L[b][1] - L[a][1], L[b][0] - L[a][0]);
const setRot = (name, a) => { const o = parts[name]; if (o) o.rotation.y = a; };
const visible = (name, v) => { const o = parts[name]; if (o) o.visible = v; };

// ------------------------------------------------------------------ the per-frame step
function step(dt) {
  const s = state;
  // crown pull animation toward the selected position
  s.pull += (params.crown - s.pull) * Math.min(1, dt * 10);
  const kw = M.keyless(params.crown, s.pull);
  const hacking = kw.engaged === 'setting';

  // running time: the balance meters out the train unless hacked or unwound
  const speed = params.speed;
  if (s.running && !hacking && s.wind > 0.002 && speed > 0) {
    const adv = dt * speed;
    s.simT += adv;
    s.wind = Math.max(0, s.wind - adv / (M.RESERVE_HOURS * 3600));
  }
  s.amplitude = M.BALANCE_AMPLITUDE * (0.72 + 0.28 * Math.min(1, s.wind / 0.3));

  // rotor and winding
  const before = s.rotor.angle;
  const rotorDt = Math.min(dt * Math.max(speed, 0.001), 0.05);
  if (speed > 0) s.rotor = M.rotorStep(s.rotor, rotorDt, params.activity, s.simT);
  const dRot = Math.abs(s.rotor.angle - before);
  const dRed = dRot * (M.TEETH.rotor_pinion / M.TEETH.reduction);   // rectified by the reversers
  s.reduction += dRed;
  const dRatchetDrive = dRed * (M.TEETH.reduction_pinion / M.TEETH.ratchet_drive);
  s.ratchetDrive -= dRatchetDrive;                                   // external mesh reverses
  s.ratchet += dRatchetDrive;                                        // and again into the ratchet wheel
  s.wind = Math.min(1, s.wind + dRatchetDrive / (TAU * M.BARREL_TURNS));

  // train
  const a = M.trainAngles(s.simT, L);
  s.beats = a.beat;
  setRot('escape_wheel', a.escape); setRot('fourth_wheel', a.fourth); setRot('third_wheel', a.third); setRot('centre_wheel', a.centre); setRot('barrel', a.barrel);
  setRot('pallet_fork', a.fork); setRot('balance', hacking ? 0 : a.balance * (s.amplitude / M.BALANCE_AMPLITUDE));
  setRot('motion_idler', a.motion_idler + s.handsOffset * (-M.TEETH.cannon / M.TEETH.motion_idler)); setRot('cannon_pinion', a.cannon + s.handsOffset);
  const mw = a.minute_wheel + s.handsOffset * (-M.TEETH.cannon_leaves / M.TEETH.minute_wheel);
  setRot('minute_wheel', mw);
  const hw = a.hour_wheel + s.handsOffset * (M.TEETH.cannon_leaves / M.TEETH.minute_wheel) * (M.TEETH.minute_pinion / M.TEETH.hour_wheel);
  setRot('hour_wheel', hw);
  const dd = a.date_drive + (hw - a.hour_wheel) * (-M.TEETH.hour_wheel / M.TEETH.date_drive);
  setRot('date_drive', dd);
  setRot('chrono_inter', a.chrono_inter); setRot('clutch_drive', a.clutch_drive); setRot('hc_inter', a.hc_inter);
  setRot('barrel_arbor', s.ratchet); setRot('ratchet_wheel', s.ratchet);
  setRot('rotor', s.rotor.angle);
  setRot('reverser_a', M.driven(s.rotor.angle, M.TEETH.rotor_pinion, M.TEETH.reverser, dir('origin', 'reverser_a')));
  setRot('reverser_b', M.driven(parts.reverser_a?.rotation.y ?? 0, M.TEETH.reverser, M.TEETH.reverser, dir('reverser_a', 'reverser_b')));
  setRot('reduction', s.reduction); setRot('ratchet_drive', s.ratchetDrive);
  setRot('crown_inter', s.crownInter);
  setRot('click', 0.02 * Math.sin(s.ratchet * M.TEETH.ratchet));            // the click rides over the ratchet teeth

  // hands: the wheel angle relative to its start, plus the displayed time
  const clock = s.clock + s.simT;
  const handAngle = (period) => -TAU * ((clock % period) / period);
  setRot('minute_hand', handAngle(3600) + s.handsOffset);
  setRot('hour_hand', handAngle(43200) + s.handsOffset / 12);
  setRot('small_seconds_hand', handAngle(60));
  // date ring: advances one tooth while the finger crosses the ring at midnight; the finger direction is the date wheel's rotation
  const dayFrac = ((clock % 86400) / 86400 + (s.handsOffset / TAU) / 24 + 10) % 1;       // 0 at the moment the finger engages
  const days = Math.floor((clock + (s.handsOffset / TAU) * 3600) / 86400);
  const pitch = TAU / M.TEETH.date_ring;
  const jump = M.smooth(0.985, 1.0, dayFrac) + M.smooth(-0.015, 0.0, dayFrac - 1);
  setRot('date_ring', pitch * ((days % 31) + jump));
  setRot('date_jumper', 0.06 * Math.sin(Math.PI * jump));
  s.dateShown = 1 + ((days + (jump > 0.5 ? 1 : 0) + 27) % 31);

  // keyless works
  const stemX = kw.stemX;
  for (const n of ['winding_stem', 'winding_pinion', 'sliding_pinion']) { const o = parts[n]; if (o) o.position.x = baseX[n] + (n === 'sliding_pinion' ? kw.slidingX : stemX); }
  setRot('setting_lever', kw.settingLever); setRot('yoke', kw.yoke);
  setRot('crown_wheel', s.crownAngle);
  // crown turning (buttons) is applied in turnCrown(); the winding stem shows the same rotation about x
  const st = parts.winding_stem; if (st) st.rotation.x = -s.crownSpin || 0;
  const wp = parts.winding_pinion; if (wp) wp.rotation.x = -s.crownSpin || 0;
  const sp = parts.sliding_pinion; if (sp) sp.rotation.x = -s.crownSpin || 0;
  setRot('setting_b', s.settingB || 0); setRot('setting_a', s.settingA || 0);

  // chronograph
  const c0 = s.chrono;
  s.chrono = M.chronoStep(c0, dt, (s.running && !hacking && s.wind > 0.002) ? dt * speed : 0, a.clutch_drive, a.hour_counter_drive, s.pressStart, s.pressReset);
  s.pressStart = false; s.pressReset = false;
  const c = s.chrono;
  s.columnShown += (c.column - s.columnShown) * Math.min(1, dt * 14);
  setRot('column_wheel', s.columnShown);
  const running = c.running;
  const clutchOn = M.onColumn(s.columnShown, 0);            // the fork's tail: on a column => disc lifted (stopped)
  const forkLift = clutchOn ? 1 : 0;
  const disc = parts.clutch_disc; if (disc) disc.position.y = baseY.clutch_disc + 0.22 * forkLift;
  setRot('clutch_fork', 0.035 * forkLift);
  setRot('brake_lever', running ? 0.05 : 0.0);
  const hammerDown = (!running && (c.resetting > 0 || (c.seconds === 0 && c.minutes === 0 && c.hours === 0)));
  setRot('hammer', hammerDown ? 0 : -0.06);
  setRot('hour_hammer', hammerDown ? 0 : 0.06);
  setRot('operating_lever', -0.06 * s.pushStart);
  const pu = parts.pushers; if (pu) pu.position.x = baseX.pushers;   // pushers drawn static; the levers show the press
  s.pushStart = Math.max(0, s.pushStart - dt / 0.18); s.pushReset = Math.max(0, s.pushReset - dt / 0.18);
  setRot('chrono_seconds', c.seconds); setRot('chrono_hand', c.seconds);
  setRot('minute_counter', c.minutes); setRot('minute_counter_hand', c.minutes);
  setRot('mc_idler', M.driven(c.minutes, M.TEETH.minute_counter, M.TEETH.mc_idler, dir('minute_counter', 'mc_idler')));
  setRot('minute_jumper', 0.05 * (c.minuteJump > 0 && Math.abs(M.wrap(c.minutes - (-TAU * (c.minuteSteps % 30) / 30))) > 0.01 ? 1 : 0));
  setRot('hour_counter', c.hours); setRot('hour_counter_hand', c.hours);

  // springs
  updateRibbon(hairspring, M.hairspringSpiral(parts.balance?.rotation.y ?? 0, -0.25, 13, 0.62, 3.05, 780), 0.1, 0, 0.04);
  if (Math.abs(s.wind - (s.windDrawn ?? -1)) > 0.004) { updateRibbon(mainspring, M.mainspringSpiral(s.wind), 1.2, 0, 0.1); s.windDrawn = s.wind; }
  hairspring.rotation.y = 0;
}

// ------------------------------------------------------------------ controls and buttons
function turnCrown(turns) {
  const s = state; const d = -TAU * turns;
  s.crownSpin = (s.crownSpin || 0) + d;
  if (params.crown < 0.5) {
    // winding: crown -> crown wheel -> intermediate -> ratchet driving wheel -> ratchet wheel
    s.crownAngle -= d; s.crownInter += d * (M.TEETH.crown_wheel / M.TEETH.crown_inter);
    const dRd = -d * (M.TEETH.crown_wheel / M.TEETH.crown_inter) * (M.TEETH.crown_inter / M.TEETH.ratchet_drive);
    s.ratchetDrive += dRd; s.ratchet -= dRd; s.reduction -= dRd * (M.TEETH.ratchet_drive / M.TEETH.reduction_pinion) * 0;   // the reversers freewheel
    s.wind = Math.min(1, s.wind + Math.abs(dRd) / (TAU * M.BARREL_TURNS));
  } else if (params.crown > 1.5) {
    // setting: sliding pinion -> setting wheels -> minute wheel -> cannon pinion (slips on its arbor)
    const sb = d * (M.TEETH.sliding / M.TEETH.setting); s.settingB = (s.settingB || 0) + sb;
    const sa = -sb; s.settingA = (s.settingA || 0) + sa;
    const cannon = -sa * (M.TEETH.setting / M.TEETH.minute_wheel) * (M.TEETH.minute_wheel / M.TEETH.cannon_leaves) * -1;
    s.handsOffset += cannon;
  } else {
    // date position: a quick corrector steps the date ring (the corrector wheel is not modelled)
    s.clock += 86400 * Math.sign(turns) * Math.abs(turns);
  }
  labRef?.invalidate();
}

for (const btn of document.querySelectorAll('[data-action]')) {
  btn.addEventListener('click', () => {
    const act = btn.dataset.action;
    if (act === 'start') { state.pressStart = true; state.pushStart = 1; }
    if (act === 'reset') { state.pressReset = true; state.pushReset = 1; }
    if (act === 'wind') turnCrown(1);
    if (act === 'unwind') turnCrown(-1);
    labRef?.invalidate();
  });
}

function buildStageBar(controls, camera) {
  if (!stageBar) return;
  stageBar.innerHTML = '';
  STAGES.forEach((st, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? st.title[1] : st.title[0]; b.dataset.stage = i;
    b.addEventListener('click', () => applyStage(i, controls, camera));
    stageBar.appendChild(b);
  });
}
function buildPartList() {
  if (!partList) return;
  partList.innerHTML = '';
  const order = ['rotor', 'reverser_a', 'reduction', 'ratchet_drive', 'ratchet_wheel', 'click', 'crown_wheel', 'crown_inter', 'winding_stem', 'sliding_pinion', 'setting_lever', 'yoke', 'setting_a', 'barrel', 'mainspring', 'barrel_arbor', 'centre_wheel', 'third_wheel', 'fourth_wheel', 'escape_wheel', 'pallet_fork', 'balance', 'hairspring', 'regulator', 'cannon_pinion', 'motion_idler', 'minute_wheel', 'hour_wheel', 'date_drive', 'date_ring', 'date_jumper', 'clutch_drive', 'clutch_disc', 'chrono_seconds', 'chrono_inter', 'column_wheel', 'operating_lever', 'clutch_fork', 'brake_lever', 'hammer', 'hour_hammer', 'mc_idler', 'minute_counter', 'minute_jumper', 'hc_inter', 'hour_counter', 'main_plate', 'train_bridge', 'barrel_bridge', 'balance_cock', 'chrono_bridge', 'auto_bridge'];
  for (const n of order) {
    if (!NAMES[n]) continue;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = ja ? NAMES[n][1] : NAMES[n][0]; b.dataset.part = n;
    b.addEventListener('click', () => { highlight([n]); showLabels([n]); labRef?.invalidate(); });
    partList.appendChild(b);
  }
}

let currentHi = [];
function highlight(names, ghosts = []) {
  currentHi = names;
  const set = new Set(names), g = new Set(ghosts);
  for (const [mesh, normal] of mats.normal) {
    let o = mesh; while (o && !parts[o.name]) o = o.parent;
    const owner = o ? o.name : mesh.name;
    const on = set.size === 0 || set.has(owner);
    mesh.material = g.has(owner) ? mats.ghost.get(mesh) : on ? normal : mats.dim.get(mesh);
  }
}
let labelNames = [];
const anchors = {};                      // name -> point in the part's own frame that its label points at
const SVGNS = 'http://www.w3.org/2000/svg';
let leaderSvg = null;
function showLabels(names) {
  labelNames = names.filter((n) => NAMES[n] && parts[n]);
  if (!labelLayer) return;
  labelLayer.innerHTML = '';
  leaderSvg = document.createElementNS(SVGNS, 'svg'); leaderSvg.setAttribute('class', 'lab-leaders'); labelLayer.appendChild(leaderSvg);
  for (const n of labelNames) {
    const el = document.createElement('span'); el.className = 'lab-label'; el.dataset.part = n; el.textContent = ja ? NAMES[n][1] : NAMES[n][0];
    labelLayer.appendChild(el);
    const line = document.createElementNS(SVGNS, 'line'); const dot = document.createElementNS(SVGNS, 'circle'); dot.setAttribute('r', '2.6');
    leaderSvg.append(line, dot); el._line = line; el._dot = dot;
  }
  for (const el of labelLayer.querySelectorAll('.lab-label')) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
}
const v3 = new THREE.Vector3();
const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
/** Labels sit outside their anchor, away from the middle of the frame, joined to it by a
 *  leader line; overlapping labels are pushed apart vertically, then kept inside the stage. */
function placeLabels(camera) {
  if (!labelLayer || !params.labels) { if (labelLayer) labelLayer.hidden = true; return; }
  labelLayer.hidden = false;
  const W = canvas.clientWidth, H = canvas.clientHeight, small = W < 560;
  const items = [];
  for (const el of labelLayer.querySelectorAll('.lab-label')) {
    const n = el.dataset.part, o = parts[n];
    if (!o || !shown(o)) { el.style.opacity = 0; el._line.style.opacity = 0; el._dot.style.opacity = 0; continue; }
    if (ANCHOR_OFF[n]) { const [ax, ay, az] = ANCHOR_OFF[n]; v3.set(ax, az, -ay).add(o.position); o.parent.localToWorld(v3); }
    else { v3.copy(anchors[n] || v3.set(0, 0, 0)); o.localToWorld(v3); }
    v3.project(camera);
    const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
    if (!el._w) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
    let dx = x - W / 2, dy = y - H / 2; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const off = small ? 22 : 34, w = el._w, h = el._h;
    const lx = x + dx * off + (dx < 0 ? -w : 0) - (Math.abs(dx) < 0.35 ? w / 2 * (1 - Math.abs(dx) / 0.35) * Math.sign(dx || 1) * -1 : 0);
    items.push({ el, x, y, lx: Math.abs(dx) < 0.35 ? x + dx * off - w / 2 : lx, ly: y + dy * off - h / 2, w, h, on: v3.z < 1 });
  }
  const pad = 3;
  for (let it = 0; it < 40; it++) {
    let moved = false;
    items.sort((a, b) => a.ly - b.ly);
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.lx < b.lx + b.w + pad && b.lx < a.lx + a.w + pad && a.ly < b.ly + b.h + pad && b.ly < a.ly + a.h + pad) {
        const push = (a.ly + a.h + pad - b.ly) / 2 + 0.5; a.ly -= push; b.ly += push; moved = true;
      }
    }
    for (const a of items) { a.lx = Math.min(Math.max(4, a.lx), W - a.w - 4); a.ly = Math.min(Math.max(4, a.ly), H - a.h - 4); }
    if (!moved) break;
  }
  for (const a of items) {
    a.el.style.transform = `translate(${a.lx.toFixed(1)}px, ${a.ly.toFixed(1)}px)`; a.el.style.opacity = a.on ? 1 : 0;
    const ex = Math.min(Math.max(a.x, a.lx), a.lx + a.w), ey = Math.min(Math.max(a.y, a.ly), a.ly + a.h);
    a.el._line.setAttribute('x1', a.x.toFixed(1)); a.el._line.setAttribute('y1', a.y.toFixed(1)); a.el._line.setAttribute('x2', ex.toFixed(1)); a.el._line.setAttribute('y2', ey.toFixed(1));
    a.el._dot.setAttribute('cx', a.x.toFixed(1)); a.el._dot.setAttribute('cy', a.y.toFixed(1));
    a.el._line.style.opacity = a.el._dot.style.opacity = a.on ? 1 : 0;
  }
}
/** Where each label points: the middle of the part's bounding box, in the part's own
 *  frame (so it turns with it), with a few hand-placed exceptions. */
const ANCHOR_MM = { date_ring: [0, -13.2, 1.1], plate_jewels: [L.escape[0], L.escape[1], -0.9], pushers: [15.6 * Math.cos(Math.PI / 6), 15.6 * Math.sin(Math.PI / 6), -4.25], winding_stem: [13, 0, -0.45], hairspring: null, rotor: [0, -8.5, -6.6] };

/** Parts that share an axis get labels pointing at different spots on their own wheel;
 *  these offsets (mm, from the axis, Blender frame) do not turn with the part. */
const ANCHOR_OFF = {
  clutch_drive: [-3.3, -1.4, -3.7], clutch_disc: [-1.9, 2.1, -4.0], chrono_seconds: [2.9, 2.2, -4.1], central_pipe: [0, 0, -5.3],
  cannon_pinion: [0.45, 0.55, 0.9], hour_wheel: [-1.5, -1.3, 0.9],
  barrel: [3.6, 3.2, -2.75], barrel_arbor: [0, 0, -3.0], mainspring: [-2.6, -2.2, 0],
  balance: [-3.0, 3.0, -3.3], hairspring: [1.9, -1.6, 0],
};
function computeAnchors(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(), c = new THREE.Vector3();
  for (const [n, o] of Object.entries(parts)) {
    if (n in ANCHOR_MM && ANCHOR_MM[n]) { const [x, y, z] = ANCHOR_MM[n]; anchors[n] = o.worldToLocal(root.localToWorld(new THREE.Vector3(x, z, -y))); continue; }
    box.setFromObject(o); if (box.isEmpty()) continue;
    anchors[n] = o.worldToLocal(box.getCenter(c).clone());
  }
  anchors.hairspring = new THREE.Vector3(2.3, 0, -1.2);
  anchors.mainspring = new THREE.Vector3(-3.0, 0, 2.0);
}

function applyLayers() {
  for (const n of LAYER.auto) visible(n, params.autoLayer);
  for (const n of LAYER.chrono) visible(n, params.chronoLayer);
  for (const n of LAYER.bridges) visible(n, params.bridges && (LAYER.chrono.includes(n) ? params.chronoLayer : LAYER.auto.includes(n) ? params.autoLayer : true));
  for (const n of LAYER.hands) visible(n, params.hands);
  visible('dial', params.dial);
  const e = params.explode;
  for (const [group, names] of Object.entries(EXPLODE)) for (const n of names) { const o = parts[n]; if (o) o.position.y = baseY[n] + EXPLODE_Z[group] * e; }
  
}

let controlsRef = null, lookRef = null;
function applyStage(i, controls, camera, instant = false) {
  const st = STAGES[i]; params.stage = i;
  if (stageBar) for (const b of stageBar.children) b.classList.toggle('is-active', +b.dataset.stage === i);
  if (stageText) stageText.textContent = ja ? st.text[1] : st.text[0];
  const show = { autoLayer: true, chronoLayer: true, bridges: true, dial: false, hands: true, ...st.show };
  for (const k of Object.keys(show)) params[k] = show[k];
  params.explode = st.explode ?? 0;
  binder?.set('explode', params.explode); binder?.set('dial', params.dial); binder?.set('autoLayer', params.autoLayer); binder?.set('chronoLayer', params.chronoLayer); binder?.set('bridges', params.bridges);
  if (st.slow) binder?.set('speed', 0.125); else if (params.speed === 0.125) binder?.set('speed', 1);
  applyLayers(); highlight(st.hi, st.ghost || []); showLabels(st.hi);
  window.__spin?.set(i === 0);
  const [pos, target] = fitView(st, camera);
  flyTo(controls, camera, pos, target, instant);
  // the studio turns part of the way with the camera; stages closer than 25 mm get the macro lens
  const d = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);
  lookRef?.stage({ azimuth: (st.view[2] - STAGES[0].view[2]) * DEG, radius: d * 0.2, macro: st.view[1] <= 24, follow: 0.6, ms: instant ? 0 : 900 });
}
/** Frame the parts a stage talks about: the camera looks from the stage's azimuth and
 *  elevation and backs off until their bounding sphere fits the narrower field of view. */
function fitView(st, camera) {
  const [, , az, el] = st.view;
  const names = (st.frame || st.hi).filter((n) => parts[n] && shown(parts[n]));
  const box = new THREE.Box3();
  if (names.length) for (const n of names) box.expandByObject(parts[n]);
  else for (const o of Object.values(parts)) if (shown(o)) box.expandByObject(o);
  if (box.isEmpty()) return viewToCamera(st.view);
  const sph = box.getBoundingSphere(new THREE.Sphere());
  const vf = camera.fov * DEG, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  // tight pads suit the wide desktop stage; a square phone stage needs the whole sphere
  const pad = camera.aspect < 1.25 ? Math.max(st.pad ?? 0.92, 0.9) : (st.pad ?? 0.92);
  const dist = Math.max(8, sph.radius / Math.sin(Math.min(vf, hf) / 2) * pad);
  const a = az * DEG, e = el * DEG, t = sph.center;
  return [[t.x + dist * Math.sin(a) * Math.cos(e), t.y + dist * Math.sin(e), t.z + dist * Math.cos(a) * Math.cos(e)], [t.x, t.y, t.z]];
}
/** A view is [target in Blender mm (x, y, z), distance, azimuth deg, elevation deg]; elevation > 0 looks at the caseback.
 *  World = (x_b, -z_b, y_b) because the model is flipped so the caseback faces +Y. */
function viewToCamera([t, dist, az, el]) {
  const target = [t[0], -t[2], t[1]];
  const a = az * DEG, e = el * DEG;
  const pos = [target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e)];
  return [pos, target];
}
let fly = null;
function flyTo(controls, camera, pos, target, instant) {
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const t1 = new THREE.Vector3(...target);
  const p1 = new THREE.Vector3(...pos);
  if (instant) { camera.position.copy(p1); controls.target.copy(t1); controls.update(); return; }
  const start = performance.now();
  const tick = () => {
    const k = M.smooth(0, 1, (performance.now() - start) / 900);
    camera.position.lerpVectors(p0, p1, k); controls.target.lerpVectors(t0, t1, k); controls.update(); labRef?.invalidate();
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ the lab
const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    camera.near = 0.5; camera.far = 400; camera.fov = 32; camera.updateProjectionMatrix();
    const [p0, t0] = viewToCamera(STAGES[0].view); camera.position.set(...p0);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.target.set(...t0); controls.maxDistance = 140; controls.minDistance = 4;
    controls.addEventListener('change', () => lab.invalidate());

    // darker studio and bright strips: polished steel and gilt read by the contrast of their reflections
    // photoreal: model in mm, a 512 px reflection cube for anglage and polished screws, and a macro lens
    // (depth of field, focused on the orbit target) that the close-up stages turn on
    const look = lookRef = await createStudio(lab, { unit: 0.001, envSize: 512, hdriRes: '2k', controls, dof: { bokeh: 1.0 }, scale: 40, floorY: -10, hdri: 'studio', hdriGain: 0.7, strips: 'movement', exposure: 1.14, envIntensity: 1.15, keyIntensity: 1.1, aoRadius: 0.8, aoThickness: 0.35, shadowOpacity: 0.2 });

    const draco = new DRACOLoader().setDecoderPath('/vendor/three/r186/examples-jsm/libs/draco/');
    const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(ASSETS + 'movement.glb');
    draco.dispose();
    const root = gltf.scene;
    look.upgrade(root);
    root.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        // dimmed: a pale, matte, see-through version, so the parts being discussed carry all the metal
        const dim = o.material.clone(); dim.transparent = true; dim.opacity = 0.11; dim.depthWrite = false; dim.envMapIntensity = 0.25; dim.color.lerp(new THREE.Color(0x9a9894), 0.7); dim.metalness = 0; dim.roughness = 0.9; dim.transmission = 0; dim.clearcoat = 0; dim.normalMap = null; dim.emissiveIntensity = 0; dim.iridescence = 0;
        // ghosted: a highlighted part you need to see through (the rotor, the barrel drum, the cock)
        const ghost = o.material.clone(); ghost.transparent = true; ghost.opacity = 0.3; ghost.depthWrite = false; ghost.transmission = 0;
        mats.normal.set(o, o.material); mats.dim.set(o, dim); mats.ghost.set(o, ghost);
      }
      if (o.parent === root || o.parent?.name === 'movement') { parts[o.name] = o; baseY[o.name] = o.position.y; baseX[o.name] = o.position.x; }
    });
    root.rotation.x = Math.PI;              // caseback up: three y = -(Blender z), 12 o'clock = +z
    scene.add(root);
    root.updateMatrixWorld(true);
    { const bb = new THREE.Box3().setFromObject(root); look.setFloor(bb.min.y - 0.6); }
    computeAnchors(root);
    const spin = turntable(controls, canvas, { speed: 0.3 });
    window.__spin = spin;

    // procedural springs
    const springMat = new THREE.MeshPhysicalMaterial({ color: 0xe2d6c2, metalness: 1, roughness: 0.14, side: THREE.DoubleSide });
    const mainMat = new THREE.MeshPhysicalMaterial({ color: 0x8f969f, metalness: 1, roughness: 0.28, side: THREE.DoubleSide });
    hairspring = new THREE.Mesh(ribbonGeometry(781), springMat); hairspring.name = 'hairspring';   // named, so highlight() finds its owner
    hairspring.position.set(L.balance[0], -3.52, -L.balance[1]);
    hairspring.frustumCulled = false; root.add(hairspring); parts.hairspring = hairspring;
    const dimS = springMat.clone(); dimS.transparent = true; dimS.opacity = 0.12; dimS.depthWrite = false; dimS.envMapIntensity = 0.25; dimS.color.set(0x9a9894); dimS.metalness = 0;
    mats.normal.set(hairspring, springMat); mats.dim.set(hairspring, dimS); mats.ghost.set(hairspring, springMat);
    mainspring = new THREE.Mesh(ribbonGeometry(901), mainMat); mainspring.name = 'mainspring';
    mainspring.position.set(L.barrel[0], -1.9, -L.barrel[1]);
    mainspring.frustumCulled = false; root.add(mainspring); parts.mainspring = mainspring;
    mats.normal.set(mainspring, mainMat); mats.dim.set(mainspring, dimS); mats.ghost.set(mainspring, mainMat);
    updateRibbon(mainspring, M.mainspringSpiral(state.wind), 1.2, 0, 0.1);
    // the barrel lid is a separate look: hide the lid face when the barrel is highlighted? keep simple: the drum is open on the dial side in the model.

    const applyTheme = () => { const c = readColors(['--paper']); scene.background = null; lab.invalidate(); };
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    buildStageBar(controls, camera);
    buildPartList();
    applyStage(0, controls, camera, true);

    let last = 0;
    return {
      update(dt, t) {
        spin.tick(); controls.update();
        try { step(Math.min(dt, 0.1)); placeLabels(camera); if (t - last > 0.25) { last = t; writeReadout(); } }
        catch (err) { if (!window.__labErr) { window.__labErr = String(err.stack || err); console.error('automatic-movement update failed', err); } }
        window.__labFrames = (window.__labFrames || 0) + 1;
      },
      render: look.render,
      dispose() { controls.dispose(); stopTheme(); spin.dispose(); look.dispose(); },
    };
  },
});

labRef = lab;
window.__lab = { lab, state, params, parts };
if (lab) {
  binder = bindControls(panel, params, (p, name) => {
    if (['dial', 'hands', 'autoLayer', 'chronoLayer', 'bridges', 'explode'].includes(name)) applyLayers();
    if (name === 'labels') placeLabels(lab.camera);
    lab.setOnDemand(p.speed === 0 && p.activity === 0);
    lab.invalidate();
  });
  applyLayers();
}

// ------------------------------------------------------------------ readout
const fmtClock = (secs) => { const s = Math.floor(secs % 86400); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
function writeReadout() {
  if (!readout) return;
  const s = state, c = s.chrono;
  const el = c.running || c.seconds !== 0 ? c.elapsed : 0;
  const chrono = `${String(Math.floor(el / 3600)).padStart(1, '0')}:${String(Math.floor(el / 60) % 60).padStart(2, '0')}:${(el % 60).toFixed(1).padStart(4, '0')}`;
  const shown = fmtClock(s.clock + s.simT + (s.handsOffset / TAU) * -3600);
  readout.innerHTML = [
    [T('time shown', '表示時刻'), shown],
    [T('date', '日付'), String(s.dateShown ?? 1)],
    [T('mainspring', 'ゼンマイ'), `${Math.round(s.wind * 100)}% · ${(s.wind * M.RESERVE_HOURS).toFixed(0)} h`],
    [T('balance', 'テンプ'), s.wind > 0.002 ? `${(s.amplitude / DEG).toFixed(0)}° · 28,800 /h` : T('stopped', '停止')],
    [T('vibrations', '振動数'), s.beats.toLocaleString()],
    [T('rotor travel', 'ローター回転'), `${(s.rotor.travelled / TAU).toFixed(1)} ${T('turns', '回転')}`],
    [T('chronograph', 'クロノグラフ'), `${chrono} ${c.running ? T('running', '作動中') : T('stopped', '停止')}`],
    [T('crown', 'リューズ'), [T('wind', '巻き上げ'), T('date', '日付'), T('set time, hacked', '時刻合わせ・ハック')][params.crown] ?? ''],
  ].map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('');
}
