/* Automatic Watch Lab: figures and simulation. Drawing primitives come from watch-art.js.
   Educational illustration: proportions and tooth counts are typical, not those of one calibre. */
(() => {
'use strict';
const A = window.WatchArt; if (!A) return;
const JA = document.documentElement.lang.startsWith('ja');
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (v, d = 0) => v.toLocaleString(JA ? 'ja-JP' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const rot = (el, a, x, y) => el && el.setAttribute('transform', `rotate(${a.toFixed(3)} ${x} ${y})`);
const L = (en, ja) => JA ? ja : en;

/* one set of gradients for every figure on the page */
document.body.insertAdjacentHTML('afterbegin', A.defsSvg());

/* ======================================================================= strings */
const PARTS = {
  rotor: [L('Rotor', 'ローター（回転錘）'),
    L('A half-disc of metal with a heavy rim, pivoted at the centre. It never stops being pulled downward, so every movement of the wrist makes it swing relative to the case. That relative swing is the only input the watch gets.',
      '中心で支えられた半円形の錘で、外周が重く作られています。常に下へ引かれているので、手首が動くたびにケースに対して揺れます。この相対的な揺れが、時計が受け取る唯一の入力です。'),
    [[L('Mass', '質量'), L('heavy rim, often tungsten', '外周に重金属、多くはタングステン')], [L('Winds', '巻上げ'), L('both directions here', 'この図では両方向')]]],
  reverser: [L('Reversing wheel', '切替車'),
    L('The rotor swings both ways, but the mainspring can only be wound one way. Reversing wheels contain one-way clutches, so either direction of swing ends up turning the ratchet wheel forward.',
      'ローターは両方向に揺れますが、主ゼンマイは一方向にしか巻けません。切替車の中には一方向クラッチがあり、どちら向きの揺れでも角穴車を前へ回すようになっています。'),
    [[L('Job', '役割'), L('rectify the swing', '揺れを一方向へ整流')], [L('Ratio', '減速'), L('large reduction to the arbor', '香箱真へ大きく減速')]]],
  barrel: [L('Mainspring barrel', '香箱と主ゼンマイ'),
    L('A coiled strip of alloy spring inside a toothed drum. Winding turns the arbor and wraps the spring tightly round it; letting down turns the drum, which drives the train. I have cut the cover away so you can watch the coils move between the arbor and the wall.',
      '歯の付いた円筒の中に、合金の帯ばねが巻かれています。巻上げは香箱真を回してゼンマイを真に巻き付け、ほどける力は香箱そのものを回して輪列を動かします。ふたを切り取ってあるので、コイルが真と壁の間を移る様子が見えます。'),
    [[L('Reserve', 'パワーリザーブ'), L('about 40 hours', '約40時間')], [L('Overwind', '過巻き'), L('slipping bridle', 'スリップする外端')]]],
  center: [L('Centre wheel', '二番車'),
    L('The first wheel driven by the barrel. Its arbor runs through the middle of the movement and, in a conventional layout, turns once an hour and carries the minute hand on the dial side.',
      '香箱が最初に回す歯車です。軸はムーブメントの中心を通り、一般的な配置では1時間に1回転して文字盤側で分針を回します。'),
    [[L('Rate', '回転'), L('1 turn per hour', '1時間に1回転')], [L('Teeth', '歯数'), L('80 here', 'この図では80')]]],
  third: [L('Third wheel', '三番車'),
    L('A transmission stage. It raises the speed again and carries power across the movement toward the escapement.',
      '伝達段です。さらに速度を上げ、ムーブメントを横切って脱進機の方へ動力を運びます。'),
    [[L('Rate', '回転'), L('about 7.5 turns per hour', '1時間に約7.5回転')], [L('Teeth', '歯数'), L('75 here', 'この図では75')]]],
  fourth: [L('Fourth wheel', '四番車'),
    L('Usually turns once a minute, which is why it so often carries the small seconds hand.',
      '通常は1分に1回転するので、スモールセコンドの秒針を担うことが多い歯車です。'),
    [[L('Rate', '回転'), L('1 turn per minute', '1分に1回転')], [L('Teeth', '歯数'), L('80 here', 'この図では80')]]],
  escape: [L('Escape wheel', 'ガンギ車'),
    L('The last wheel of the train, made of steel with club-shaped teeth. It is pushed forward all the time but may only advance when the pallet fork lets one tooth go. Watch it: it moves in steps, never smoothly.',
      '輪列の最後の歯車で、こん棒形の歯を持つ鋼製です。常に前へ押されていますが、アンクルが歯を1枚放したときにしか進めません。よく見ると、滑らかではなく段階的に進みます。'),
    [[L('Teeth', '歯数'), L('20, club tooth', '20、クラブ歯')], [L('Steps', '進み'), L('half a tooth per beat', '1振動ごとに半歯')]]],
  pallet: [L('Pallet fork', 'アンクル'),
    L('A steel lever with two synthetic-ruby pallet stones. It rocks between two banking positions, locking the escape wheel, then unlocking it and passing a small push to the balance through its forked end.',
      '人工ルビーのツメ石を2つ持つ鋼のレバーです。2つのドテ位置の間を揺れ、ガンギ車をロックし、解放し、先端のハコを通じてテンプに小さな力を渡します。'),
    [[L('Stones', 'ツメ石'), L('entry and exit, ruby', '入りと出、ルビー')], [L('Travel', '振れ'), L('about 10 degrees', '約10度')]]],
  balance: [L('Balance and hairspring', 'テンプとひげゼンマイ'),
    L('The timekeeper. A weighted ring on a staff and a spiral spring of a few tenths of a millimetre. Together they swing back and forth four times a second here; everything else in the movement only keeps that swing going and counts it.',
      '時を決める部品です。天真に付いた重い輪と、厚さ数十分の1ミリの渦巻きばねでできています。この図では1秒に4往復します。ムーブメントのほかの部分は、この振動を保ち、数えているだけです。'),
    [[L('Frequency', '振動数'), L('4 Hz, 28 800 vph', '4 Hz、28 800 vph')], [L('Amplitude', '振り角'), L('rises with spring torque', 'ゼンマイのトルクで変わる')]]],
  jewel: [L('Jewels', '石（軸受）'),
    L('Synthetic ruby bearings. The pivots of every fast-moving arbor run in a polished jewel hole, because ruby is hard, smooth, holds oil well and does not wear.',
      '人工ルビーの軸受です。高速で回る軸のほぞは磨かれた石の穴で回ります。ルビーは硬く滑らかで、油を保持し、摩耗しないからです。'),
    [[L('Material', '材質'), L('synthetic corundum', '合成コランダム')], [L('Count', '数'), L('about 25 in an automatic', '自動巻きで約25石')]]]
};
const S = {
  wrist: L('Move the wrist', '手首を動かす'), ghost: L('Lift the rotor', 'ローターを外す'), path: L('Show energy path', 'エネルギー経路を表示'),
  scales: [L('slow motion ×1/8', 'スロー ×1/8'), L('real time', '実時間'), L('×60 · a minute a second', '×60・1秒で1分'), L('×3600 · an hour a second', '×3600・1秒で1時間')],
  hours: h => JA ? `約${fmt(h, 0)}時間` : `≈ ${fmt(h, 0)} h`,
  stopped: L('stopped', '停止'), bridle: L('fully wound · bridle slipping', '巻き上げ完了・外端が滑る'),
  winding: L('winding', '巻上げ中'), running: L('running down', 'ほどけている'),
  blur: L('balance drawn slowed; at this speed it is a blur', 'この速さではテンプは残像になるため、遅くして描いています'),
  pause: L('Pause motion', '動きを止める'), run: L('Run motion', '動かす'),
  phases: [L('Locked', 'ロック'), L('Unlocking', '解除'), L('Impulse', '衝撃'), L('Drop and lock', '落下とロック')],
  phaseCopy: [
    L('The balance swings freely. The fork rests against its banking pin and a pallet stone holds the escape wheel still.', 'テンプは自由に振れています。アンクルはドテに寄り、ツメ石がガンギ車を止めています。'),
    L('The impulse jewel enters the fork slot and turns the fork a little, sliding the pallet stone off the tooth it was holding.', '振り石がハコに入りアンクルを少し回し、ツメ石を歯から外します。'),
    L('Released, the tooth slides across the slanted face of the stone and pushes the fork, which pushes the impulse jewel: energy flows into the balance.', '解放された歯がツメ石の斜面を滑ってアンクルを押し、アンクルが振り石を押します。エネルギーがテンプへ流れます。'),
    L('The tooth drops off the stone, the wheel jumps forward and the other stone catches the next tooth. The fork comes to rest on the opposite banking pin.', '歯がツメ石から落ち、ガンギ車が前へ跳び、もう一方のツメ石が次の歯を受け止めます。アンクルは反対側のドテに止まります。')],
  labels: { rotor: L('ROTOR', 'ローター'), reverser: L('REVERSING WHEEL', '切替車'), barrel: L('BARREL + MAINSPRING', '香箱・主ゼンマイ'), center: L('CENTRE WHEEL', '二番車'),
    third: L('THIRD WHEEL', '三番車'), fourth: L('FOURTH WHEEL', '四番車'), escape: L('ESCAPE WHEEL', 'ガンギ車'), pallet: L('PALLET FORK', 'アンクル'),
    balance: L('BALANCE + HAIRSPRING', 'テンプ・ひげゼンマイ'), jewel: L('JEWEL BEARING', '石（軸受）'), cock: L('balance cock', 'テンプ受け') },
  subs: { rotor: L('swings with the wrist', '手首と一緒に揺れる'), reverser: L('rectifies both directions', '両方向を一方向に'), barrel: L('stores the energy', 'エネルギーを蓄える'),
    center: L('1 turn / hour', '1時間に1回転'), third: L('transmission', '伝達'), fourth: L('1 turn / minute', '1分に1回転'), escape: L('half a tooth per beat', '1振動ごとに半歯'),
    pallet: L('locks and releases', 'ロックと解放'), balance: L('4 Hz oscillator', '4 Hz の振動子'), jewel: L('synthetic ruby', '合成ルビー') }
};

/* ======================================================================= geometry */
/* positions follow from mesh distances: centre distance = wheel pitch radius + pinion pitch radius */
const at = (p, d, deg) => [p[0] + d * Math.cos(deg * D2R), p[1] + d * Math.sin(deg * D2R)];
const C = [370, 300];
const G = {
  barrel: { R: 80, z: 84 }, center: { R: 54, z: 80, pr: 11, pz: 12 }, third: { R: 40, z: 75, pr: 7, pz: 10 },
  fourth: { R: 38, z: 80, pr: 6, pz: 10 }, escape: { R: 28, z: 20, pr: 5, pz: 7 }, balance: { r: 50 }
};
G.center.p = C;
G.barrel.p = at(C, G.barrel.R + G.center.pr, 207);
G.third.p = at(C, G.center.R + G.third.pr, -18);
G.fourth.p = at(G.third.p, G.third.R + G.fourth.pr, 38);
G.escape.p = at(G.fourth.p, G.fourth.R + G.escape.pr, 72);
const PAL = { p: at(G.escape.p, 1.0824 * G.escape.R, 75), dir: 45 };
const forkLen = 78 * G.escape.R / 60;
G.balance.p = at(PAL.p, forkLen + 4.5, PAL.dir);
/* winding: rotor pinion at C, a reversing wheel, and a ratchet wheel on the barrel arbor */
const W = { rp: 9, rv: 30, rat: 26 };
(function () { // circle intersection for the reversing wheel position
  const a = W.rp + W.rv, b = W.rv + W.rat, B = G.barrel.p, dx = B[0] - C[0], dy = B[1] - C[1], d = Math.hypot(dx, dy);
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(a * a - x * x, 0));
  const ux = dx / d, uy = dy / d;
  W.p = [C[0] + ux * x + uy * h, C[1] + uy * x - ux * h];
  if (W.p[1] < C[1] - 20) W.p = [C[0] + ux * x - uy * h, C[1] + uy * x + ux * h];
})();

/* ======================================================================= 01 MOVEMENT */
const SIM = { wind: .62, wrist: !reduced, scale: 0, ghost: false, path: true, running: !reduced, t: 0, rotorA: 0, rotorPrev: 0,
  ratchet: 0, barrelA: 0, beats: 0, balPhase: 0, selected: 'balance' };
const SCALES = [1 / 8, 1, 60, 3600];
const F_BAL = 4; // Hz

function buildMovement() {
  const svg = $('#movement-svg'); if (!svg) return null;
  const g = svg.querySelector('#movement-art');
  const [bx, by] = G.barrel.p;
  let s = '';
  s += `<rect x="-90" y="0" width="950" height="600" rx="10" fill="url(#wa-velvet)"/>`;
  s += A.caseRing(C[0], C[1], 254, 18);
  s += A.plate(C[0], C[1], 252);
  // sinks for the plate jewels, decorative screws round the edge
  for (const a of [-60, 30, 120, 250]) { const p = at(C, 232, a); s += A.screw(p[0], p[1], 6.5, a * 2, 'blued'); }
  // going train, lower layers first so each wheel sits under the one that drives it
  const gearMarkup = (k, extra = {}) => { const q = G[k];
    return A.wheel(Object.assign({ x: q.p[0], y: q.p[1], z: q.z, r: q.R, id: 'mv-' + k, part: k, cls: 'part',
      pinion: q.pz ? { z: q.pz, r: q.pr } : null, armsN: q.R > 45 ? 5 : 4, curved: q.R > 45 }, extra)); };
  s += A.escapeWheel({ x: G.escape.p[0], y: G.escape.p[1], r: G.escape.R, z: 20, id: 'mv-escape', part: 'escape', cls: 'part', pinion: { z: 7, r: 5 } });
  s += gearMarkup('fourth'); s += gearMarkup('third'); s += gearMarkup('center');
  s += A.barrel({ x: bx, y: by, r: G.barrel.R, z: G.barrel.z, id: 'mv-barrel', part: 'barrel', cls: 'part', wind: SIM.wind, turns: 10 });
  // pinions on top of the wheel they mesh with
  for (const k of ['center', 'third', 'fourth']) { const q = G[k];
    s += `<g class="pin-top" data-part="${k}">${A.pinion(q.p[0], q.p[1], q.pz, q.pr, { id: 'mv-' + k + '-pin' })}${A.jewel(q.p[0], q.p[1], Math.min(4, q.pr * .45), { sink: false })}</g>`; }
  // winding: ratchet on the barrel arbor, reversing wheel
  s += `<g class="part" data-part="reverser">` + A.wheel({ x: W.p[0], y: W.p[1], z: 36, r: W.rv, id: 'mv-reverser', mat: 'steel', arms: 0, tooth: { ha: 1.1, hf: 1.3, s: 1.5 } }) + `</g>`;
  s += `<g class="part ratchet" data-part="barrel" opacity=".62"><g id="mv-ratchet">${ratchetPath(bx, by, W.rat)}</g>${A.screw(bx, by, 8, 15, 'steel')}</g>`;
  // pallet fork, balance under its cock
  s += `<g class="part" data-part="pallet">${A.palletFork({ x: PAL.p[0], y: PAL.p[1], R: G.escape.R, dir: PAL.dir, id: 'mv-pallet' })}</g>`;
  const [qx, qy] = G.balance.p;
  s += `<g class="part" data-part="balance">` + A.balanceWheel({ x: qx, y: qy, r: G.balance.r, id: 'mv-balance', screwsN: 14, pinAngle: PAL.dir + 180 }) +
    A.hairspring({ x: qx, y: qy, r0: 6, r1: 31, turns: 10, id: 'mv-spring', w: .8 }) + `</g>`;
  // balance cock
  const cock = cockPath(qx, qy, 15, 55, 62);
  s += A.bridge(cock, { cls: 'part cock', part: 'balance' });
  s += A.jewel(qx, qy, 5.5, {});
  s += `<g class="part" data-part="jewel">${A.jewel(PAL.p[0], PAL.p[1], 3.6, {})}</g>`;
  s += screwOnCock(qx, qy);
  // energy path
  const pts = [C, W.p, G.barrel.p, G.center.p, G.third.p, G.fourth.p, G.escape.p, PAL.p, G.balance.p];
  const seg = (a, b, cls) => `<path class="energy-seg ${cls}" d="M${A.P(a[0], a[1])}L${A.P(b[0], b[1])}" marker-end="url(#wa-arrow-gold)"/>`;
  let ep = '';
  ep += seg(C, W.p, 'wind') + seg(W.p, G.barrel.p, 'wind');
  for (let i = 2; i < pts.length - 1; i++) ep += seg(pts[i], pts[i + 1], 'go');
  s += `<g id="energy-path" class="energy-path">${ep}</g>`;
  // rotor on top
  s += `<g id="mv-rotor-wrap" class="part" data-part="rotor">` + A.rotor({ x: C[0], y: C[1], r: 240, from: 85, to: 205, id: 'mv-rotor' }) + `</g>`;
  s += `<g class="pin-top">${A.pinion(C[0], C[1], 10, W.rp, { id: 'mv-rotor-pin', mat: 'steel' })}${A.screw(C[0], C[1], 6, 0, 'blued')}</g>`;
  // labels
  const lab = [
    ['rotor', at(C, 175, 150), [70, 500], 'end'],
    ['reverser', W.p, [70, 384], 'end'],
    ['barrel', at(G.barrel.p, 46, 230), [70, 150], 'end'],
    ['center', at(C, 40, -100), [250, 26], 'end'],
    ['third', at(G.third.p, 26, -75), [500, 26], 'start'],
    ['fourth', at(G.fourth.p, 30, -40), [668, 150], 'start'],
    ['escape', at(G.escape.p, 18, 10), [668, 280], 'start'],
    ['pallet', at(PAL.p, 14, 30), [668, 370], 'start'],
    ['balance', at(G.balance.p, 46, 20), [668, 460], 'start'],
    ['jewel', G.fourth.p, [668, 560], 'start']
  ];
  let ls = '', n = 0;
  for (const [k, a, l, side] of lab) { n++;
    ls += `<g class="lbl-grp" data-part="${k}">` + A.leader(a[0], a[1], l[0], l[1], [S.labels[k], S.subs[k]], { side }) +
      `<g class="badge" transform="translate(${A.f(a[0])} ${A.f(a[1])})"><circle r="9"/><text y="3.6">${n}</text></g></g>`; }
  s += `<g class="labels">${ls}</g>`;
  g.innerHTML = s;
  // legend for small screens
  const lg = $('#movement-legend');
  if (lg) lg.innerHTML = lab.map(([k], i) => `<li data-part="${k}"><b>${i + 1}</b> ${PARTS[k][0]}</li>`).join('');
  return svg;
}
function ratchetPath(x, y, r) {
  const n = 30, pts = [];
  for (let i = 0; i < n; i++) { const a = i * TAU / n;
    pts.push(A.polar(x, y, r * .86, a)); pts.push(A.polar(x, y, r, a + TAU / n * .82)); pts.push(A.polar(x, y, r * .86, a + TAU / n * .86)); }
  return `<path d="${A.pathFrom(pts)}${A.circ(x, y, r * .45)}" fill="url(#wa-steel)" fill-rule="evenodd" stroke="#4a5058" stroke-width=".7"/>` +
    A.sheen(x, y, r * .86, { inner: r * .45, opacity: .9 });
}
function cockPath(x, y, rEnd, len, ang) {
  const a = ang * D2R, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, P = A.P;
  const e = [x + ux * len, y + uy * len], wB = 24;
  const t1 = [x + nx * rEnd, y + ny * rEnd], t2 = [x - nx * rEnd, y - ny * rEnd];
  const b1 = [e[0] + nx * wB, e[1] + ny * wB], b2 = [e[0] - nx * wB, e[1] - ny * wB];
  const m1 = [x + ux * len * .5 + nx * rEnd * .8, y + uy * len * .5 + ny * rEnd * .8], m2 = [x + ux * len * .5 - nx * rEnd * .8, y + uy * len * .5 - ny * rEnd * .8];
  return `M${P(t1[0], t1[1])}Q${P(m1[0], m1[1])} ${P(b1[0], b1[1])}A${wB} ${wB} 0 0 0 ${P(b2[0], b2[1])}Q${P(m2[0], m2[1])} ${P(t2[0], t2[1])}A${rEnd} ${rEnd} 0 1 0 ${P(t1[0], t1[1])}Z`;
}
function screwOnCock(x, y) { const e = at([x, y], 55, 62); return A.screw(e[0], e[1], 7.5, 40, 'blued'); }

function movement() {
  const svg = buildMovement(); if (!svg) return;
  const el = id => svg.querySelector('#' + id);
  const mq = matchMedia('(max-width: 600px)'), fit = () => svg.setAttribute('viewBox', mq.matches ? '94 24 552 552' : '-90 0 950 600');
  fit(); mq.addEventListener('change', fit);
  const R = { rotor: el('mv-rotor'), rotorPin: el('mv-rotor-pin'), rev: el('mv-reverser'), ratchet: el('mv-ratchet'), barrel: el('mv-barrel'),
    spring: el('mv-barrel-spring'), springHi: el('mv-barrel-spring-hi'), center: el('mv-center'), centerPin: el('mv-center-pin'),
    third: el('mv-third'), thirdPin: el('mv-third-pin'), fourth: el('mv-fourth'), fourthPin: el('mv-fourth-pin'), escape: el('mv-escape'),
    pallet: el('mv-pallet'), balance: el('mv-balance'), hs: el('mv-spring'), hsHi: el('mv-spring-hi') };
  const [bx, by] = G.barrel.p, wall = A.teethPoints(bx, by, G.barrel.z, G.barrel.R, { ha: 1.2, hf: 1.4 }).rf - G.barrel.R * .07;
  const select = id => {
    SIM.selected = id;
    svg.classList.add('has-sel');
    $$('#movement-svg [data-part]').forEach(n => n.classList.toggle('selected', n.dataset.part === id));
    $$('#movement-legend li').forEach(n => n.classList.toggle('selected', n.dataset.part === id));
    $('#part-name').textContent = PARTS[id][0]; $('#part-copy').textContent = PARTS[id][1];
    $('#part-spec').innerHTML = PARTS[id][2].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  };
  $$('#movement-svg .part, #movement-svg .lbl-grp, #movement-legend li').forEach(n => {
    n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button');
    n.setAttribute('aria-label', PARTS[n.dataset.part][0]);
    n.addEventListener('click', e => { e.stopPropagation(); select(n.dataset.part); });
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.dataset.part); } });
  });
  select('balance');
  const btn = (id, on, a, b, fn) => { const x = $(id); if (!x) return; const set = () => { x.textContent = on() ? a : b; x.setAttribute('aria-pressed', on()); }; x.addEventListener('click', () => { fn(); set(); }); set(); };
  btn('#wrist-toggle', () => SIM.wrist, S.wrist, S.wrist, () => SIM.wrist = !SIM.wrist);
  btn('#ghost-toggle', () => SIM.ghost, S.ghost, S.ghost, () => SIM.ghost = !SIM.ghost);
  btn('#path-toggle', () => SIM.path, S.path, S.path, () => SIM.path = !SIM.path);
  btn('#motion-toggle', () => SIM.running, S.pause, S.run, () => SIM.running = !SIM.running);
  const sc = $('#time-scale');
  if (sc) { const upd = () => { SIM.scale = +sc.value; $('#time-scale-v').textContent = S.scales[SIM.scale]; }; sc.addEventListener('input', upd); upd(); }
  const out = { reserve: $('#mv-reserve'), amp: $('#mv-amp'), state: $('#mv-state'), note: $('#mv-note'), bar: $('#mv-bar') };
  let last = performance.now(), wristT = 0, springFrame = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const k = SCALES[SIM.scale];
    if (SIM.running) {
      // wrist: irregular swings of the rotor in wall-clock time
      if (SIM.wrist) wristT += dt;
      const target = SIM.wrist ? 34 * Math.sin(wristT * 1.25) + 18 * Math.sin(wristT * 2.71 + 1.1) + 8 * Math.sin(wristT * 5.3) : 0;
      SIM.rotorA += (target - SIM.rotorA) * Math.min(1, dt * 6);
      const dRot = Math.abs(SIM.rotorA - SIM.rotorPrev); SIM.rotorPrev = SIM.rotorA;
      // winding: both directions turn the ratchet forward (reversers), ratio about 1:120 to the arbor
      const full = SIM.wind >= 1;
      if (!full) { SIM.ratchet += dRot * .35; SIM.wind = Math.min(1, SIM.wind + dRot / 360 / 120 * 8); }
      // the going train: time advances by k; balance and escape run while there is energy
      const amp = SIM.wind > 0 ? 150 + 140 * Math.sqrt(SIM.wind) : 0;
      if (amp > 0) {
        const dts = dt * k;
        SIM.t += dts; SIM.beats += 2 * F_BAL * dts;
        const escDeg = 9 * dts * 2 * F_BAL;                         // half a tooth (9 deg) per beat
        SIM.barrelA += escDeg * (7 / 80) * (10 / 75) * (10 / 80) * (12 / 84);
        SIM.wind = Math.max(0, SIM.wind - escDeg * (7 / 80) * (10 / 75) * (10 / 80) * (12 / 84) / (360 * 6.2));
      }
      SIM.amp = amp;
    }
    const amp = SIM.amp || 0;
    // balance display: true angle in slow motion, capped visual frequency when fast
    const fTrue = F_BAL * k, fVis = Math.min(fTrue, 2.2);
    SIM.balPhase += (SIM.running && amp > 0 ? dt * fVis * TAU : 0);
    const theta = amp * Math.sin(SIM.balPhase);
    const [qx, qy] = G.balance.p;
    rot(R.balance, theta, qx, qy);
    R.hs.setAttribute('d', A.spiral(qx, qy, 6, 31, 10, theta * D2R * 0, theta * D2R)); R.hsHi.setAttribute('d', R.hs.getAttribute('d'));
    // pallet flips when the impulse jewel passes the line of centres; the escape wheel steps then
    const beatsInt = Math.floor(SIM.beats), frac = SIM.beats - beatsInt;
    const flip = fTrue > 6 ? 0 : Math.min(1, Math.max(0, (frac - .02) / .12));
    const side = beatsInt % 2 ? 1 : -1;
    rot(R.pallet, side * 5 * (1 - 2 * flip) * (fTrue > 6 ? Math.sin(SIM.balPhase) : 1), PAL.p[0], PAL.p[1]);
    const escA = fTrue > 6 ? SIM.beats * 9 : (beatsInt + Math.min(1, frac / .14)) * 9;
    rot(R.escape, escA, G.escape.p[0], G.escape.p[1]);
    const a4 = -escA * 7 / 80, a3 = -a4 * 10 / 75, a2 = -a3 * 10 / 80;
    rot(R.fourth, a4, ...G.fourth.p); rot(R.fourthPin, a4, ...G.fourth.p);
    rot(R.third, a3, ...G.third.p); rot(R.thirdPin, a3, ...G.third.p);
    rot(R.center, a2, ...G.center.p); rot(R.centerPin, a2, ...G.center.p);
    rot(R.barrel, -SIM.barrelA, bx, by);
    rot(R.rotor, SIM.rotorA, ...C); rot(R.rotorPin, SIM.rotorA, ...C);
    rot(R.rev, -SIM.rotorA * W.rp / W.rv, ...W.p);
    rot(R.ratchet, SIM.ratchet, bx, by);
    if ((springFrame++ & 1) === 0) { const d = A.mainspringPath(bx, by, G.barrel.R * .2, wall, 10, SIM.wind, (SIM.ratchet - SIM.barrelA) * D2R * .02);
      R.spring.setAttribute('d', d); R.springHi.setAttribute('d', d); }
    svg.classList.toggle('ghost-rotor', SIM.ghost);
    svg.classList.toggle('peek-rotor', !SIM.ghost && (SIM.selected === 'barrel' || SIM.selected === 'reverser'));
    svg.classList.toggle('show-path', SIM.path && SIM.running && amp > 0);
    // readouts
    if (out.reserve) out.reserve.textContent = S.hours(SIM.wind * 41);
    if (out.bar) out.bar.style.width = (SIM.wind * 100).toFixed(1) + '%';
    if (out.amp) out.amp.textContent = amp > 0 ? fmt(amp, 0) + '°' : S.stopped;
    if (out.state) out.state.textContent = SIM.wind >= 1 ? S.bridle : amp === 0 ? S.stopped : (SIM.wrist && SIM.running ? S.winding : S.running);
    if (out.note) out.note.textContent = fTrue > 6 ? S.blur : '';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ======================================================================= 02 GOING TRAIN */
const TR = [ // unrolled train, each arbor meshes the previous wheel; units: px in viewBox 1000 x 460
  { k: 'barrel', R: 118, z: 84 }, { k: 'center', R: 86, z: 80, pr: 14, pz: 12 }, { k: 'third', R: 66, z: 75, pr: 10, pz: 10 },
  { k: 'fourth', R: 62, z: 80, pr: 9, pz: 10 }, { k: 'escape', R: 48, z: 20, pr: 8, pz: 7 }];
const TR_RPM = { barrel: 60 / (6.7 * 60) / 60 * 60, center: 1 / 60, third: 7.5 / 60, fourth: 1, escape: 12 };
function train() {
  const svg = $('#train-svg'); if (!svg) return;
  const host = svg.querySelector('#train-art');
  let p = [150, 236]; TR[0].p = p;
  const angs = [-8, 14, -12, 14];
  for (let i = 1; i < TR.length; i++) { p = at(p, TR[i - 1].R + TR[i].pr, angs[i - 1]); TR[i].p = p; }
  const pal = { p: at(TR[4].p, 1.0824 * TR[4].R, 0), dir: 0 };
  const balP = at(pal.p, 78 * TR[4].R / 60 + 8, 0), balR = 74;
  let s = `<rect x="0" y="0" width="1000" height="500" fill="url(#wa-velvet)" rx="0"/>`;
  // draw from the escape end back to the barrel: each wheel sits on top of the one it drives
  s += `<g class="train-bal">${A.balanceWheel({ x: balP[0], y: balP[1], r: balR, id: 'tr-balance', screwsN: 16, pinAngle: 180 })}${A.hairspring({ x: balP[0], y: balP[1], r0: 7, r1: 40, turns: 11, id: 'tr-hs', w: .9 })}${A.jewel(balP[0], balP[1], 5)}</g>`;
  s += A.escapeWheel({ x: TR[4].p[0], y: TR[4].p[1], r: TR[4].R, id: 'tr-escape', pinion: null });
  s += A.palletFork({ x: pal.p[0], y: pal.p[1], R: TR[4].R, dir: 0, id: 'tr-pallet' });
  for (let i = 3; i >= 1; i--) { const q = TR[i];
    s += A.wheel({ x: q.p[0], y: q.p[1], z: q.z, r: q.R, id: 'tr-' + q.k, armsN: 5, curved: true }); }
  s += A.barrel({ x: TR[0].p[0], y: TR[0].p[1], r: TR[0].R, z: TR[0].z, id: 'tr-barrel', wind: .7, turns: 10 });
  for (let i = 1; i < TR.length; i++) { const q = TR[i];
    s += `<g>${A.pinion(q.p[0], q.p[1], q.pz, q.pr, { id: 'tr-' + q.k + '-pin' })}${A.jewel(q.p[0], q.p[1], Math.min(4, q.pr * .42), { sink: false })}</g>`; }
  // direction arrows: alternate at each mesh
  const arcs = TR.map((q, i) => { const r = (q.k === 'escape' ? q.R : q.R) + 12, cw = i % 2 === 1;
    const a0 = -150 * D2R, a1 = -100 * D2R, p0 = A.polar(q.p[0], q.p[1], r, cw ? a0 : a1), p1 = A.polar(q.p[0], q.p[1], r, cw ? a1 : a0);
    return `<path class="dir-arc ${cw ? 'cw' : 'ccw'}" d="M${A.P(p0[0], p0[1])}A${r} ${r} 0 0 ${cw ? 1 : 0} ${A.P(p1[0], p1[1])}" marker-end="url(#${cw ? 'wa-arrow-gold' : 'wa-arrow-sig'})"/>`; }).join('');
  s += `<g class="dir-arcs">${arcs}</g>`;
  const names = JA ? ['香箱', '二番車', '三番車', '四番車', 'ガンギ車'] : ['BARREL', 'CENTRE', 'THIRD', 'FOURTH', 'ESCAPE'];
  const rates = JA ? ['約6.7時間に1回転', '1時間に1回転', '1時間に7.5回転', '1分に1回転', '1分に12回転'] : ['1 turn / 6.7 h', '1 turn / hour', '7.5 turns / hour', '1 turn / minute', '12 turns / minute'];
  const teeth = JA ? ['84歯', '80歯・かな12', '75歯・かな10', '80歯・かな10', '20歯・かな7'] : ['84 teeth', '80 teeth · pinion 12', '75 teeth · pinion 10', '80 teeth · pinion 10', '20 teeth · pinion 7'];
  let lb = '';
  const lab1 = (x, y, ax, ay, a, b, c) => `<path class="tl-lead" d="M${A.f(ax)} ${A.f(ay)}V${y - 14}"/><text class="tl" x="${A.f(x)}" y="${y}">${a}</text><text class="ts" x="${A.f(x)}" y="${y + 16}">${b}</text>` + (c ? `<text class="ts dim" x="${A.f(x)}" y="${y + 30}">${c}</text>` : '');
  TR.forEach((q, i) => { const y = i % 2 ? 452 : 400; lb += lab1(q.p[0], y, q.p[0], q.p[1] + q.R + 6, names[i], rates[i], teeth[i]); });
  lb += lab1(balP[0], 400, balP[0], balP[1] + balR + 8, L('BALANCE', 'テンプ'), L('4 Hz, sets the pace', '4 Hz、速さを決める'), L('with hairspring', 'ひげゼンマイ付き'));
  lb += lab1(pal.p[0], 452, pal.p[0], pal.p[1] + 34, L('PALLET FORK', 'アンクル'), L('the gate', 'ゲート'), '');
  s += `<g class="train-labels">${lb}</g>`;
  s += `<g class="train-legend" transform="translate(24 30)"><path class="dir-arc cw" d="M0 0h26" marker-end="url(#wa-arrow-gold)"/><text x="34" y="4">${L('clockwise', '時計回り')}</text><path class="dir-arc ccw" d="M120 0h26" marker-end="url(#wa-arrow-sig)"/><text x="154" y="4">${L('anticlockwise: every mesh reverses', '反時計回り：噛み合うたびに逆転')}</text></g>`;
  host.innerHTML = s;
  const E = id => svg.querySelector('#' + id);
  const parts = TR.map(q => ({ q, w: E('tr-' + q.k), pin: E('tr-' + q.k + '-pin') }));
  const pallet = E('tr-pallet'), bal = E('tr-balance'), hs = E('tr-hs'), hsHi = E('tr-hs-hi');
  const COMP = [1, 10, 60, 600, 3600], COMPL = ['×1', '×10', '×60', '×600', '×3600'];
  const sp = $('#speed'); let running = !reduced, beats = 0, phase = 0, last = performance.now();
  const upd = () => { $('#speed-value').textContent = COMPL[+sp.value]; }; sp.addEventListener('input', upd); upd();
  $('#train-toggle').addEventListener('click', e => { running = !running; e.currentTarget.textContent = running ? S.pause : S.run; e.currentTarget.setAttribute('aria-pressed', running); });
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const k = COMP[+sp.value];
    if (running) { beats += dt * k * 8; phase += dt * Math.min(4 * k, 2.2) * TAU; }
    const bi = Math.floor(beats), fr = beats - bi, fast = k > 1;
    const escA = fast ? beats * 9 : (bi + Math.min(1, fr / .14)) * 9;
    const a = [0, 0, 0, 0, escA];
    a[3] = -a[4] * 7 / 80; a[2] = -a[3] * 10 / 75; a[1] = -a[2] * 10 / 80; a[0] = -a[1] * 12 / 84;
    parts.forEach((p, i) => { rot(p.w, a[i], ...p.q.p); if (p.pin) rot(p.pin, a[i], ...p.q.p); });
    const th = 250 * Math.sin(phase);
    rot(bal, th, ...balP); hs.setAttribute('d', A.spiral(balP[0], balP[1], 7, 40, 11, 0, th * D2R)); hsHi.setAttribute('d', hs.getAttribute('d'));
    const side = bi % 2 ? 1 : -1, flip = fast ? 0 : Math.min(1, Math.max(0, (fr - .02) / .12));
    rot(pallet, fast ? 5 * Math.sin(phase) : side * 5 * (1 - 2 * flip), ...pal.p);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ======================================================================= 03 ESCAPEMENT */
function escapement() {
  const svg = $('#osc-svg'); if (!svg) return;
  const host = svg.querySelector('#osc-art');
  const E = [190, 250], R = 118, P = [E[0] + 1.0824 * R, 250], s60 = R / 60;
  const forkEnd = 78 * s60, rollerR = 26, B = [P[0] + forkEnd + rollerR * .9 - 4, 250], BR = 150;
  let s = `<rect width="760" height="500" fill="url(#wa-velvet)"/>`;
  s += `<g id="osc-bal-wrap">${A.balanceWheel({ x: B[0], y: B[1], r: BR, id: 'osc-balance', screwsN: 18, pinAngle: 180, roller: false })}</g>`;
  s += A.hairspring({ x: B[0], y: B[1], r0: 14, r1: 92, turns: 12, id: 'osc-hs', w: 1.3 });
  // roller with the impulse jewel, drawn above the spring
  s += `<g id="osc-roller"><circle cx="${B[0]}" cy="${B[1]}" r="${rollerR}" fill="url(#wa-steel)" stroke="#4a5058"/><circle cx="${B[0]}" cy="${B[1]}" r="${rollerR * .45}" fill="url(#wa-steel)" stroke="#4a5058" stroke-width=".6"/>` +
    `<rect x="${B[0] - rollerR * .9 - 4}" y="${B[1] - 4.5}" width="9" height="9" rx="2" fill="url(#wa-ruby-lin)" stroke="#4f0413" stroke-width=".6"/></g>`;
  s += A.jewel(B[0], B[1], 7, { sink: false });
  s += A.escapeWheel({ x: E[0], y: E[1], r: R, id: 'osc-escape', pinion: { z: 7, r: 14 } });
  s += A.palletFork({ x: P[0], y: P[1], R, dir: 0, id: 'osc-pallet' });
  // banking pins
  for (const sg of [-1, 1]) s += `<circle cx="${P[0] + 50 * s60}" cy="${P[1] + sg * 13 * s60}" r="${3.2 * s60 / 2 + 2}" fill="url(#wa-screwsteel)" stroke="#3f454c" stroke-width=".6"/>`;
  // labels
  s += `<g class="labels">` +
    A.leader(E[0] - 30, E[1] - 80, 60, 40, [L('ESCAPE WHEEL', 'ガンギ車'), L('pushed by the mainspring', '主ゼンマイに押される')], { side: 'start' }) +
    A.leader(P[0] - 18, P[1] - 60, 300, 470, [L('PALLET STONES', 'ツメ石'), L('ruby, lock and receive impulse', 'ルビー、ロックと衝撃')], { side: 'start' }) +
    A.leader(P[0] + 50 * s60, P[1] - 13 * s60 - 4, 470, 40, [L('BANKING PIN', 'ドテピン'), L('limits the fork', 'アンクルの振れを制限')], { side: 'start' }) +
    A.leader(B[0] - rollerR * .9, B[1] + 6, 560, 470, [L('IMPULSE JEWEL', '振り石'), L('on the roller, enters the fork', '振り座の上、ハコに入る')], { side: 'start' }) +
    A.leader(B[0] + BR * .7, B[1] - BR * .7, 690, 40, [L('BALANCE', 'テンプ'), L('with hairspring', 'ひげゼンマイ付き')], { side: 'end' }) + `</g>`;
  s += `<g class="phase-tag" transform="translate(24 470)"><rect x="0" y="-18" width="210" height="28" rx="14"/><text id="osc-phase" x="14" y="1">${S.phases[0]}</text></g>`;
  host.innerHTML = s;
  const Q = id => svg.querySelector('#' + id);
  const bal = Q('osc-balance'), roller = Q('osc-roller'), hs = Q('osc-hs'), hsHi = Q('osc-hs-hi'), esc = Q('osc-escape'), pal = Q('osc-pallet'), tag = Q('osc-phase');
  const steps = $$('.beat-steps li'), detail = $('#osc-detail');
  let ph = -Math.PI / 2, last = performance.now(), run = !reduced, lastPhase = -1;
  const per = 3.6;                     // seconds of wall clock per full oscillation (slow motion)
  const AMP = 270, WIN = 26;           // deg; the fork is in contact only inside this window
  const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    let th = AMP * Math.sin(ph);
    if (run) ph += dt * TAU / per * (Math.abs(th) < WIN ? .12 : 1);   // the exchange is slowed further
    th = AMP * Math.sin(ph);
    rot(bal, th, ...B); rot(roller, th, ...B);
    const d = A.spiral(B[0], B[1], 14, 92, 12, 0, th * D2R); hs.setAttribute('d', d); hsHi.setAttribute('d', d);
    const k = Math.floor((ph + Math.PI / 2) / Math.PI), dir = Math.cos(ph) >= 0 ? 1 : -1;
    const x = th * dir;                                   // position along this half-swing
    const prog = x < -WIN ? -1 : x > WIN ? 2 : (x / WIN + 1) / 2;
    const fork = prog < 0 ? -dir : prog > 1 ? dir : -dir + 2 * dir * sm(prog);
    rot(pal, -fork * 6.5, ...P);
    const e = prog < 0 ? 0 : prog > 1 ? 1 : sm((prog - .3) / .55);
    rot(esc, -9 * (k + e), ...E);
    const p = prog < 0 || prog > 1 ? 0 : prog < .3 ? 1 : prog < .85 ? 2 : 3;
    if (p !== lastPhase) { lastPhase = p; tag.textContent = S.phases[p]; steps.forEach((li, i) => li.classList.toggle('on', i === p)); if (detail) detail.textContent = S.phaseCopy[p]; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const tg = $('#osc-toggle'); if (tg) tg.addEventListener('click', e => { run = !run; e.currentTarget.textContent = run ? S.pause : S.run; e.currentTarget.setAttribute('aria-pressed', run); });
}

/* ======================================================================= 04 LAB */
function lab() {
  const svg = $('#lab-svg'); if (!svg) return;
  const CX = 400, CY = 255, RB = 150, R1 = 104, TURNS = 12, PH = -14 * D2R, STUD = A.polar(CX, CY, R1 + 8, PH);
  svg.querySelector('#lab-art').innerHTML = A.balanceWheel({ x: CX, y: CY, r: RB, id: 'lab-wheel', screwsN: 18, pinAngle: 90 });
  svg.querySelector('#lab-top').innerHTML = A.jewel(CX, CY, 9, { sink: false }) +
    `<rect x="${A.f(STUD[0] - 7)}" y="${A.f(STUD[1] - 9)}" width="14" height="18" rx="2" fill="url(#wa-steel-lin)" stroke="#3f454c" transform="rotate(${-14} ${A.f(STUD[0])} ${A.f(STUD[1])})"/>` +
    A.leader(STUD[0] + 6, STUD[1] - 6, 640, 120, [L('FIXED STUD', 'ひげ持ち'), L('outer end of the hairspring', 'ひげゼンマイの外端を固定')], { side: 'start' }) +
    A.leader(CX + 60, CY + 30, 640, 400, [L('HAIRSPRING', 'ひげゼンマイ'), L('a few tenths of a millimetre thick', '厚さ数十分の1ミリ')], { side: 'start' }) +
    A.leader(CX - RB * .7, CY - RB * .74, 150, 150, [L('BALANCE WHEEL', 'テンプ'), L('timing screws set the inertia', '緩急ネジで慣性を調整')], { side: 'end' });
  const inertia = $('#inertia'), stiffness = $('#stiffness'), amplitude = $('#amplitude'), wheel = $('#lab-wheel'), spring = $('#lab-spring'), springHi = $('#lab-spring-hi'),
    torque = $('#torque'), motion = $('#motion'), flash = $('#impulse-flash');
  let labRunning = !reduced, impulses = true, labPhase = 0, labLast = performance.now(), lastBeat = -1, display = '';
  const params = () => { const I = +inertia.value, k = +stiffness.value, amp = +amplitude.value, frequency = 4 * Math.sqrt(k / I); return { I, k, amp, frequency, period: 1 / frequency, vph: frequency * 7200 }; };
  const labels = () => { const p = params(); $('#inertia-value').textContent = p.I.toFixed(2) + '×'; $('#stiffness-value').textContent = p.k.toFixed(2) + '×'; $('#amplitude-value').textContent = p.amp + '°';
    $('#rate').textContent = fmt(Math.round(p.vph / 100) * 100) + ' vph'; $('#period').textContent = p.period.toFixed(3) + (JA ? ' 秒' : ' s');
    wheel.style.setProperty('--rim', (0.75 + 0.5 * (p.I - .6)).toFixed(2)); };
  [inertia, stiffness, amplitude].forEach(el => el.addEventListener('input', labels)); labels();
  $('#lab-toggle').addEventListener('click', e => { labRunning = !labRunning; e.currentTarget.textContent = labRunning ? L('Pause', '一時停止') : L('Run', '再生'); e.currentTarget.setAttribute('aria-pressed', labRunning); });
  $('#impulse-toggle').addEventListener('click', e => { impulses = !impulses; e.currentTarget.textContent = impulses ? L('Escapement impulse on', '脱進機の衝撃：オン') : L('Escapement impulse off', '脱進機の衝撃：オフ'); e.currentTarget.setAttribute('aria-pressed', impulses); });
  const spiralTo = theta => A.spiral(CX, CY, 14, R1, TURNS, PH, theta) + `L${A.P(STUD[0], STUD[1])}`;
  const SL = JA ? {
    c: ['中心通過', '運動エネルギー最大', '<strong>中心通過：</strong>ひげゼンマイはほぼ自由で、慣性がテンプを運びます。'],
    e: ['折り返し点', 'ばねのエネルギー最大', '<strong>折り返し点：</strong>テンプが一瞬止まり、ひげゼンマイの復元トルクが最大になります。'],
    o: ['ばねを巻く', '運動 → ばね', '<strong>外へ向かう：</strong>運動がひげゼンマイの弾性エネルギーとして蓄えられます。'],
    i: ['ばねが戻す', 'ばね → 運動', '<strong>内へ戻る：</strong>ひげゼンマイがテンプを中心へ加速します。'] } : {
    c: ['Centre crossing', 'maximum kinetic energy', '<strong>Centre crossing:</strong> the hairspring is nearly relaxed; inertia carries the wheel through.'],
    e: ['Turning point', 'maximum spring energy', '<strong>Turning point:</strong> the wheel briefly stops; the hairspring provides maximum restoring torque.'],
    o: ['Winding spring', 'motion → spring', '<strong>Moving outward:</strong> motion is being stored as elastic energy in the hairspring.'],
    i: ['Spring returning', 'spring → motion', '<strong>Returning inward:</strong> the hairspring accelerates the balance toward centre.'] };
  function frame(now) {
    const dt = Math.min((now - labLast) / 1000, .05); labLast = now; const p = params();
    if (labRunning) labPhase += dt * p.frequency * Math.PI * 2 / 8;
    const s = Math.sin(labPhase), c = Math.cos(labPhase), angle = s * p.amp;
    rot(wheel, angle, CX, CY); const d = spiralTo(angle * D2R); spring.setAttribute('d', d); springHi.setAttribute('d', d);
    torque.style.opacity = .25 + .75 * Math.abs(s); torque.setAttribute('transform', -s >= 0 ? '' : 'translate(800 0) scale(-1 1)');
    motion.style.opacity = .25 + .75 * Math.abs(c); motion.setAttribute('transform', c >= 0 ? '' : 'translate(800 0) scale(-1 1)');
    const nearCentre = Math.abs(s) < .18, nearEnd = Math.abs(c) < .18;
    const st = nearCentre ? SL.c : nearEnd ? SL.e : s * c > 0 ? SL.o : SL.i;
    if (st[0] !== display) { display = st[0]; $('#state').textContent = st[0]; $('#energy').textContent = st[1]; $('#lab-detail').innerHTML = st[2]; }
    const beat = Math.floor(labPhase / Math.PI);
    if (impulses && beat !== lastBeat && nearCentre) { lastBeat = beat; flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 120); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ======================================================================= HERO */
function hero() {
  const svg = $('#hero-art'); if (!svg) return;
  const X = 300, Y = 300;
  svg.innerHTML = A.balanceWheel({ x: X, y: Y, r: 230, id: 'hero-bal', screwsN: 20, pinAngle: 90, shadow: false }) +
    A.hairspring({ x: X, y: Y, r0: 22, r1: 150, turns: 13, id: 'hero-hs', w: 1.6 }) + A.jewel(X, Y, 12, { sink: false });
  const b = svg.querySelector('#hero-bal'), hs = svg.querySelector('#hero-hs'), hi = svg.querySelector('#hero-hs-hi');
  if (reduced) return;
  let t = 0, last = performance.now();
  (function f(now) { const dt = Math.min((now - last) / 1000, .05); last = now; t += dt;
    const th = 200 * Math.sin(t * TAU / 4.5); rot(b, th, X, Y); const d = A.spiral(X, Y, 22, 150, 13, 0, th * D2R); hs.setAttribute('d', d); hi.setAttribute('d', d);
    requestAnimationFrame(f); })(last);
}

hero(); movement(); train(); escapement(); lab();
})();
