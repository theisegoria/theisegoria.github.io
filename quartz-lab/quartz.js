/* Quartz Watch Lab - interactive figures
   Educational schematic. Values are typical, not calibre-specific. */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const D2R = Math.PI / 180;
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const poly = pts => pts.map((p,i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('');
const grp = n => n.toLocaleString('en-US').replace(/,/g, ' ');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- user-facing strings; a page may override via window.QLAB_I18N ---- */
const T = Object.assign({
  forkPause:'Pause vibration', forkRun:'Run vibration',
  forkModeIn:'Show in-phase mode', forkModeAnti:'Show antiphase mode (real)',
  tineA:'tine A: ', tineB:'tine B: ',
  netOk:'net momentum at the base \u2248 0',
  netBad:'net momentum at the base \u2260 0 \u00b7 energy leaks into the mount and Q collapses',
  oscSustain:'oscillation sustains', oscFail:'will not start',
  envOk:(tau,full)=>'amplitude envelope \u00b7 \u03c4 = '+tau+' s \u00b7 full amplitude after \u2248 '+full+' s',
  envFail:'loop gain below unity: the crystal damps back to silence',
  divPause:'Pause counter', divRun:'Run counter',
  scales:['real time','\u00d71/8','\u00d71/64','\u00d71/512','\u00d71/4096'],
  motorPause:'Pause motor', motorRun:'Run motor',
  verdictOk:'STEP COMPLETED \u00b7 rotor captured at 180\u00b0',
  verdictDouble:d=>'DOUBLE STEP \u00b7 rotor overran to '+d+'\u00b0 \u00b7 the seconds hand jumps two',
  verdictFail:'STEP FAILED \u00b7 cogging pulled the rotor back to its start',
  statePulse:'PULSE ON \u00b7 stator field driving the rotor',
  stateCoast:'COASTING \u00b7 cogging torque captures the rotor',
  stateRest:'RESTING \u00b7 held by detent torque',
  motorCount:(n,a,pol,ms)=>`step ${n} \u00b7 rotor angle ${a}\u00b0 \u00b7 pulse polarity ${pol} \u00b7 t = ${ms} ms`,
  trainPause:'Pause train', trainRun:'Run train',
  tcOn:'Thermocompensation on', tcOff:'Thermocompensation off',
  wearOn:'Single fixed temperature', wearOff:'Use worn-on-wrist duty cycle',
  srcTurnover:'at the turnover point', srcFrom:d=>d+' \u00b0C from turnover',
  srcDuty:'14 h at 33 \u00b0C on the wrist, 10 h at 21 \u00b0C off it',
  capPlain:'\u0394f/f = \u2212\u03b2(T \u2212 25 \u00b0C)\u00b2 \u00b7 \u03b2 \u2248 0.035 ppm/\u00b0C\u00b2',
  capComp:'thermocompensated \u00b7 the parabola is measured, then cancelled by indexing the inhibition count to temperature',
  yearsUnit:'years',
  chain:null
}, window.QLAB_I18N || {});

if (window.WatchArt) document.body.insertAdjacentHTML('afterbegin', window.WatchArt.defsSvg());

(function heroCan(){ const h = $('#hero-can'); if (!h || !window.WatchArt) return;
  h.innerHTML = window.WatchArt.crystalCan({ x: 150, y: 30, w: 96, h: 300 }); })();

/* ============================================================ 01 SIGNAL PATH */
const CHAIN = {
  battery: ['Silver-oxide cell',
    'A 1.55 V silver-oxide cell holds about 25 mAh. The whole watch draws roughly 1.3 microamps, so the chemistry, not the mechanism, sets the service interval. Voltage stays nearly flat until it collapses, which is why a quartz watch keeps perfect time right up to the moment it stops.',
    [['Chemistry','Ag₂O / Zn, 1.55 V'],['Capacity','≈25 mAh'],['Life','2–3 years'],['End of life','abrupt, not gradual']]],
  crystal: ['Quartz oscillator',
    'A CMOS inverter biased into its linear region drives an etched tuning-fork crystal and feeds the result back to its own input. The fork is so sharply resonant that the loop can sustain oscillation at essentially one frequency and nowhere else.',
    [['Frequency','32 768 Hz = 2¹⁵'],['Q factor','≈5×10⁴'],['Drive','< 1 µW'],['Start-up','≈0.5 s']]],
  divider: ['Binary divider',
    'Fifteen toggle flip-flops in series. Each one changes state on every second input edge, so each halves the frequency of the one before it. Division by two is exact in a way no analogue process is: there is no error term to accumulate.',
    [['Stages','15'],['In','32 768 Hz'],['Out','1.000 Hz'],['Error','exactly zero']]],
  driver: ['Motor driver',
    'The driver gates a fast divider stage with the 1 Hz stage to cut a short pulse, then flips the pulse polarity every second. Modern drivers chop the pulse into a high-frequency burst so the average current is a fraction of what the coil would otherwise draw.',
    [['Pulse width','4–8 ms'],['Polarity','alternates each second'],['Chopping','≈15 % duty'],['Feedback','back-EMF rotor sensing']]],
  motor: ['Lavet stepper motor',
    'A bipolar magnet the size of a grain of rice sits in a notched soft-iron bore. One current pulse turns it exactly 180 degrees. Notches in the bore hold it between pulses and, crucially, guarantee which way it starts.',
    [['Step','180° per pulse'],['Mean speed','30 rpm'],['Coil','≈12 000 turns, 2 kΩ'],['Energy','≈1 µJ per step']]],
  train: ['Reduction train',
    'A conventional watch gear train, but working in the opposite direction: it gears down from a fast rotor to slow hands, rather than up from a slow barrel to a fast escapement. Nothing in it affects the rate.',
    [['Ratio','21 600 : 1'],['Seconds wheel','1 rpm'],['Cannon pinion','1 rph'],['Escapement','none']]],
  hands: ['The display',
    'Six degrees of dial per second. The visible step is the direct signature of the divider chain reaching 1 Hz and spending its pulse. A sweeping quartz seconds hand simply means the divider was tapped higher and the motor is stepped more often.',
    [['Step','6°'],['Rate','1 per second'],['Sweep variants','4, 8 or 32 steps/s'],['Reserve','none, stops when the cell dies']]]
};
(function chain(){
  const C = T.chain || CHAIN;
  const nameEl = $('#chain-name'), copyEl = $('#chain-copy'), specEl = $('#chain-spec');
  if (!nameEl) return;
  const pick = id => {
    window.__qsel = id; if (window.__qmapSelect) window.__qmapSelect(id);
    $$('#chain-svg .node').forEach(n => n.classList.toggle('selected', n.dataset.part === id));
    const d = C[id]; nameEl.textContent = d[0]; copyEl.textContent = d[1];
    specEl.innerHTML = d[2].map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  };
  $$('#chain-svg .node').forEach(n => {
    n.addEventListener('click', () => pick(n.dataset.part));
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n.dataset.part); } });
  });
  window.__qpick = pick;
  pick('crystal');
})();

/* ============================================================ 01b THE PARTS IN PLACE */
(function partsMap(){
  const svg = $('#qmap'); const A = window.WatchArt; if (!svg || !A) return;
  const MT = T.map || {};
  const at = (p, d, deg) => [p[0] + d * Math.cos(deg * D2R), p[1] + d * Math.sin(deg * D2R)];
  // train geometry first: the rest of the movement is placed around it
  const OFF = [30, 30], rot = [402, 266], rp = 7;
  const fifth = { R: 36, pr: 8, z: 30 }, fourth = { R: 48, pr: 7, z: 48 }, third = { R: 52, pr: 7, z: 60 }, centre = { R: 66, z: 64 };
  fifth.p = at(rot, rp + fifth.R, 62); fourth.p = at(fifth.p, fifth.pr + fourth.R, -8);
  third.p = at(fourth.p, fourth.pr + third.R, 62); centre.p = at(third.p, third.pr + centre.R, 172);
  const C = [480, 336], PR = 290;
  let s = `<rect class="qmap-bg" width="1000" height="660" rx="8"/>`;
  s += `<circle cx="${C[0] + 6}" cy="${C[1] + 10}" r="${PR + 4}" fill="#000" opacity=".25" filter="url(#wa-soft)"/>`;
  s += `<circle cx="${C[0]}" cy="${C[1]}" r="${PR}" class="frame"/><circle cx="${C[0]}" cy="${C[1]}" r="${PR - 10}" class="frame-in"/>`;
  s += `<circle cx="${C[0]}" cy="${C[1]}" r="${PR}" fill="url(#wa-sheen)" opacity=".18"/>`;
  // battery pocket and cell
  const B = [612, 478], BR = 84;
  s += `<g class="mp" data-node="battery"><circle cx="${B[0]}" cy="${B[1]}" r="${BR + 6}" class="pocket"/>` +
    `<circle cx="${B[0] + 3}" cy="${B[1] + 5}" r="${BR}" fill="#000" opacity=".35" filter="url(#wa-soft)"/><circle cx="${B[0]}" cy="${B[1]}" r="${BR}" fill="url(#wa-cell)" stroke="#6b7279"/>` +
    `<circle cx="${B[0]}" cy="${B[1]}" r="${BR * .86}" fill="none" stroke="#fff" stroke-opacity=".5"/><text x="${B[0] - 30}" y="${B[1] + 10}" class="cell-plus">+</text>` +
    `<path d="M${B[0] - 30} ${B[1] - BR - 10}h60l-8 ${BR * .55}h-44z" fill="url(#wa-steel-lin)" stroke="#5c646b" stroke-width=".8"/>${A.screw(B[0], B[1] - BR - 2, 6, 20, 'steel')}</g>`;
  // circuit block: PCB, IC under epoxy, crystal can, traces
  const pcb = 'M584 170H704Q726 170 726 192V318Q726 338 706 338H580Q562 338 562 320V250L556 240V194Q556 170 584 170Z';
  s += `<g class="mp" data-node="driver"><path d="${pcb}" fill="#000" opacity=".3" transform="translate(4 7)" filter="url(#wa-soft)"/><path d="${pcb}" fill="url(#wa-pcb)" stroke="#0f2219"/>` +
    `<path class="trace" d="M600 196H556M612 250H578V214H556"/><path class="trace" d="M690 270V300M616 270V300"/><circle cx="566" cy="196" r="5" class="pad"/><circle cx="566" cy="214" r="5" class="pad"/><path class="wire-lead" d="M520 184C540 184 548 196 566 196M520 192C540 196 548 214 566 214"/>` +
    `<path id="mp-pulse" class="pulse-trace" d="M612 250H578V214H566C548 214 540 192 490 186"/></g>`;
  s += `<g class="mp" data-node="divider"><ellipse cx="660" cy="228" rx="46" ry="38" fill="url(#wa-chip)"/><ellipse cx="650" cy="216" rx="26" ry="13" fill="#fff" opacity=".08"/>` +
    `</g>`;
  s += `<g class="mp" data-node="crystal"><g transform="translate(588 318) rotate(-90)">${A.crystalCan({ x: 0, y: 0, w: 26, h: 112 })}</g><circle id="mp-shimmer" cx="646" cy="305" r="15" class="shimmer"/></g>`;
  // coil, stator and rotor
  const cy = 150;
  s += `<g class="mp" data-node="motor"><g transform="translate(${OFF[0]} ${OFF[1]})">`;
  const r0 = [rot[0] - OFF[0], rot[1] - OFF[1]];
  const st = `M236 ${cy - 16}h34V200H${r0[0] - 6}l6 6l6 -6H474V${cy - 16}h34V266H${r0[0] + 6}l-6 -5l-6 5H236Z` + A.circ(r0[0], r0[1], 27);
  s += `<path d="${st}" fill="#000" opacity=".3" transform="translate(4 7)" fill-rule="evenodd" filter="url(#wa-soft)"/><path d="${st}" fill="url(#wa-iron)" stroke="#4d555c" fill-rule="evenodd"/><path d="${st}" fill="url(#wa-brushed)" fill-rule="evenodd"/>`;
  s += `<rect x="228" y="${cy - 7}" width="288" height="14" rx="3" fill="url(#wa-iron)" stroke="#4d555c" stroke-width=".7"/>`;
  s += A.coil({ x0: 284, x1: 460, y: cy, rr: 22, flange: 8 });
  s += `<rect id="mp-coil-live" x="284" y="${cy - 22}" width="176" height="44" rx="5" class="coil-live"/>`;
  s += A.screw(253, cy, 6, 30, 'steel') + A.screw(491, cy, 6, 100, 'steel') + `</g>`;
  s += `<g id="mp-rotor"><circle cx="${rot[0]}" cy="${rot[1]}" r="22" fill="url(#wa-magnet)" stroke="#16181b"/><path d="M${rot[0] - 22} ${rot[1]}a22 22 0 0 1 44 0z" class="rot-n"/><path d="M${rot[0] + 22} ${rot[1]}a22 22 0 0 1-44 0z" class="rot-s"/>${A.pinion(rot[0], rot[1], 6, rp, { mat: 'white' })}</g></g>`;
  // train in white polymer and brass
  s += `<g class="mp" data-node="train">`;
  s += A.wheel({ x: centre.p[0], y: centre.p[1], z: centre.z, r: centre.R, id: 'mp-centre', mat: 'brass', armsN: 4, curved: true });
  s += A.wheel({ x: third.p[0], y: third.p[1], z: third.z, r: third.R, id: 'mp-third', mat: 'white', armsN: 0, jewel: false });
  s += A.wheel({ x: fourth.p[0], y: fourth.p[1], z: fourth.z, r: fourth.R, id: 'mp-fourth', mat: 'white', armsN: 0, jewel: false });
  s += A.wheel({ x: fifth.p[0], y: fifth.p[1], z: fifth.z, r: fifth.R, id: 'mp-fifth', mat: 'white', armsN: 0, jewel: false });
  for (const q of [fifth, fourth, third]) s += A.pinion(q.p[0], q.p[1], 8, q.pr, { mat: 'white' });
  s += `</g><g class="mp" data-node="hands"><circle cx="${centre.p[0]}" cy="${centre.p[1]}" r="11" fill="url(#wa-steel)" stroke="#4a5058"/><circle cx="${centre.p[0]}" cy="${centre.p[1]}" r="4" fill="#2b2f33"/></g>`;
  // labels
  const lb = (k, ax, ay, lx, ly, a, b, side) => `<g class="mp-lbl" data-node="${k}">${A.leader(ax, ay, lx, ly, [a, b], { side })}</g>`;
  s += lb('battery', B[0] + 50, B[1] + 50, 800, 560, MT.battery || 'SILVER-OXIDE CELL', MT.batteryS || '1.55 V · ≈ 25 mAh', 'start');
  s += lb('crystal', 690, 318, 800, 420, MT.crystal || 'QUARTZ CRYSTAL', MT.crystalS || 'fork in its vacuum can', 'start');
  s += lb('divider', 690, 214, 800, 200, MT.ic || 'INTEGRATED CIRCUIT', MT.icS || 'oscillator, divider, driver', 'start');
  s += lb('driver', 600, 180, 800, 110, MT.pcb || 'CIRCUIT BOARD', MT.pcbS || 'pulses go out to the coil', 'start');
  s += lb('motor', 360, cy + 10, 170, 80, MT.coil || 'COIL', MT.coilS || 'Lavet stepper motor', 'end');
  s += lb('motor', rot[0] - 24, rot[1] + 4, 170, 260, MT.rotor || 'ROTOR AND STATOR', MT.rotorS || 'a half turn per pulse', 'end');
  s += lb('train', third.p[0] + 30, third.p[1] + 30, 800, 320, MT.train || 'REDUCTION TRAIN', MT.trainS || 'polymer and brass wheels', 'start');
  s += lb('hands', centre.p[0] - 6, centre.p[1] + 8, 170, 420, MT.hands || 'CENTRE ARBOR', MT.handsS || 'carries the hands on the dial side', 'end');
  s += `<text class="tick" x="500" y="648">${MT.note || 'Top view of a generic three-hand quartz movement, battery side. Proportions are typical rather than those of one calibre.'}</text>`;
  svg.insertAdjacentHTML('beforeend', s);
  const E = id => svg.querySelector('#' + id);
  const rotEl = E('mp-rotor'), wheels = [['mp-fifth', fifth.p, -1 / 5], ['mp-fourth', fourth.p, 1 / 30], ['mp-third', third.p, -1 / 225], ['mp-centre', centre.p, 1 / 1800]].map(([i, p, r]) => [E(i), p, r]);
  // selection shared with the signal-path figure
  const nodes = [...svg.querySelectorAll('.mp, .mp-lbl')];
  nodes.forEach(n => { n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button');
    const go = () => window.__qpick && window.__qpick(n.dataset.node);
    n.addEventListener('click', go); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  window.__qmapSelect = id => { svg.classList.add('has-sel'); nodes.forEach(n => n.classList.toggle('selected', n.dataset.node === id)); };
  if (window.__qsel) window.__qmapSelect(window.__qsel);
  let t = 0, last = performance.now(), run = !reduced;
  (function frame(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now; if (run) t += dt;
    const whole = Math.floor(t), fr = t - whole, aR = 180 * (whole + Math.min(1, fr / .07));
    rotEl.setAttribute('transform', `rotate(${(aR % 360).toFixed(2)} ${rot[0]} ${rot[1]})`);
    wheels.forEach(([el, p, r]) => el && el.setAttribute('transform', `rotate(${(aR * r % 360).toFixed(3)} ${p[0].toFixed(2)} ${p[1].toFixed(2)})`));
    svg.classList.toggle('pulsing', fr < .09);
    requestAnimationFrame(frame);
  })(last);
})();

/* ============================================================ 02 TUNING FORK */
(function fork(){
  const svg = $('#fork-svg'); if (!svg) return;
  const A = window.WatchArt; if (!A) return;
  svg.setAttribute('viewBox', '0 0 760 600');
  const BETA = 1.875104, SIG = 0.734096, NORM = 2.0;
  const phi = s => ((Math.cosh(BETA*s) - Math.cos(BETA*s)) - SIG*(Math.sinh(BETA*s) - Math.sin(BETA*s))) / NORM;
  const Y0 = 420, Y1 = 110, LEN = Y0 - Y1, W = 21, CXA = 432, CXB = 562, MID = (CXA + CXB) / 2;
  // a band along a bent tine, between lateral offsets o1..o2 and fractions s0..s1 of the length
  const band = (cx, amp, o1, o2, s0 = 0, s1 = 1, N = 24) => { const l = [], r = [];
    for (let i = 0; i <= N; i++) { const s = s0 + (s1 - s0) * i / N, y = Y0 - s * LEN, d = amp * phi(s); l.push([cx + d + o1, y]); r.push([cx + d + o2, y]); }
    return poly(l) + poly(r.reverse()).replace('M', 'L') + 'Z'; };
  const at = (cx, amp, s, o) => [cx + amp * phi(s) + o, Y0 - s * LEN];
  // static parts
  const can = A.crystalCan({ x: 128, y: 150, w: 66, h: 226 });
  const zoom = `<path class="zoom" d="M161 214L360 96M161 330L360 528"/><rect class="zoom-box" x="360" y="80" width="384" height="460" rx="8"/>`;
  const base = `<g class="fork-base-g"><path class="fork-shadow" d="M${MID - 118} 428h236v64h-66v40h-104v-40h-66z" transform="translate(6 9)"/>` +
    `<path class="fork-body" d="M${MID - 118} 418h236v66h-66v42h-104v-42h-66z"/>` +
    `<rect x="${MID - 44}" y="494" width="30" height="22" rx="2" fill="url(#wa-goldfilm)"/><rect x="${MID + 14}" y="494" width="30" height="22" rx="2" fill="url(#wa-goldfilm)"/>` +
    `<path d="M${MID - 29} 516v26M${MID + 29} 516v26" stroke="url(#wa-lead)" stroke-width="7" stroke-linecap="round"/>` +
    `<rect x="${MID - 104}" y="430" width="74" height="10" rx="2" class="trace-a"/><rect x="${MID + 30}" y="430" width="74" height="10" rx="2" class="trace-b"/>` +
    `<path d="M${MID - 30} 440v54M${MID + 30} 440v54" stroke-width="5" class="trace-ab"/></g>`;
  const T2 = T.fork || {};
  const lab = (x, y, a, b, side) => `<text class="lbl" x="${x}" y="${y}" style="text-anchor:${side||'start'}">${a}</text>` + (b ? `<text class="sub" x="${x}" y="${y + 15}" style="text-anchor:${side||'start'}">${b}</text>` : '');
  svg.insertAdjacentHTML('beforeend',
    `<rect class="fork-bg" x="0" y="0" width="760" height="600" rx="8"/>` + zoom + can +
    lab(128, 60, T2.canT || 'AS BUILT', T2.canS || 'vacuum can, cut open', 'middle') +
    `<text class="tick" x="128" y="470">${T2.canDim || '≈ Ø 2 mm × 6 mm'}</text>` +
    `<path class="ghost-path" d="M${CXA - W} ${Y0}V${Y1}h${2 * W}V${Y0}M${CXB - W} ${Y0}V${Y1}h${2 * W}V${Y0}"/>` +
    base + `<g id="tines"></g><g id="momentum"><path class="arrow-m" id="mom-l" d="M0 0h0"/><path class="arrow-m" id="mom-r" d="M0 0h0"/></g>` +
    `<g class="fork-notes">` +
    `<path class="lead" d="M${CXB + 24} 128H${CXB + 60}"/>` +
    `<text class="lbl" x="${CXB + 64}" y="125" style="text-anchor:start">${T2.trim || 'TRIM MASS'}</text><text class="sub" x="${CXB + 64}" y="140" style="text-anchor:start">${T2.trimS || 'gold, laser-trimmed'}</text>` +
    `<text class="lbl" x="560" y="560" style="text-anchor:middle">${T2.mount || 'MOUNT AND LEADS'}</text><text class="sub" x="560" y="575" style="text-anchor:middle">${T2.mountS || 'bonded to the posts through the seal'}</text>` +
    `</g>` +
    `<g class="dimline"><path d="M733 ${Y1}v${LEN}M727 ${Y1}h12M727 ${Y0}h12"/></g><text class="tick" x="748" y="${(Y0 + Y1) / 2}" transform="rotate(90 748 ${(Y0 + Y1) / 2})">L ≈ 2.4 mm</text>` +
    `<text class="lbl" x="${MID}" y="72" style="text-anchor:middle">${T2.title || 'FLEXURAL MODE · TINES IN ANTIPHASE'}</text>` +
    `<g class="pol-key" transform="translate(378 470)"><rect width="12" height="12" rx="2" class="k-pos"/><text x="18" y="10">+</text><rect y="18" width="12" height="12" rx="2" class="k-neg"/><text x="18" y="28">−</text></g>` +
    `<text class="tick" x="374" y="458" style="text-anchor:start">${T2.key || 'electrode charge'}</text>` +
    `<text class="tick" x="374" y="104" style="text-anchor:start">${T2.exag || 'tip travel ×2000 exaggerated'}</text>` +
    `<text class="tick" x="640" y="300" style="text-anchor:start" id="fork-phase-l">tine A: +</text><text class="tick" x="640" y="316" style="text-anchor:start" id="fork-phase-r">tine B: −</text>` +
    `<text class="sub" x="${MID}" y="594" id="fork-net" style="text-anchor:middle"></text>`);
  const tines = $('#tines'), mL = $('#mom-l'), mR = $('#mom-r'), netEl = $('#fork-net'), phL = $('#fork-phase-l'), phR = $('#fork-phase-r');
  const baseG = svg.querySelector('.fork-base-g');
  const POS = '#d9654f', NEG = '#3f97c4';
  const tine = (cx, amp, sgn, k) => {
    const pos = sgn >= 0, faceC = pos ? POS : NEG, sideC = pos ? NEG : POS, op = (.35 + .6 * k).toFixed(2);
    let g = `<path d="${band(cx, amp, -W, W, 0, 1)}" class="tine-q"/>`;
    g += `<path d="${band(cx, amp, -W, -W + 4, 0, .985)}" fill="url(#wa-goldfilm)"/><path d="${band(cx, amp, W - 4, W, 0, .985)}" fill="url(#wa-goldfilm)"/>`;
    g += `<path d="${band(cx, amp, -W * .42, W * .42, .03, .8)}" fill="url(#wa-goldfilm)"/>`;
    g += `<path d="${band(cx, amp, -W * .42, W * .42, .03, .8)}" fill="${faceC}" opacity="${(.25 + .6 * k).toFixed(2)}"/>`;
    g += `<path d="${band(cx, amp, -W, -W + 4, 0, .985)}" fill="${sideC}" opacity="${op}"/><path d="${band(cx, amp, W - 4, W, 0, .985)}" fill="${sideC}" opacity="${op}"/>`;
    g += `<path d="${band(cx, amp, -W + 5, W - 5, .86, .985)}" fill="url(#wa-goldfilm)" stroke="#8a6416" stroke-width=".6"/>`;
    for (const [s, o] of [[.9, -8], [.94, 3], [.915, 9], [.955, -3]]) { const p = at(cx, amp, s, o); g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.3" fill="#5b4413" opacity=".75"/>`; }
    g += `<path d="${band(cx, amp, -W + 6, -W + 8, .02, .84)}" fill="#fff" opacity=".55"/>`;
    return g; };
  let run = !reduced, inPhase = false, t = 0, last = performance.now();
  const ampS = $('#fork-amp'), slowS = $('#fork-slow');
  const SLOW = [1, 4, 16, 64], SLOWL = ['×1/32 768','×1/131 072','×1/524 288','×1/2 097 152'];
  ampS.addEventListener('input', () => $('#fork-amp-v').textContent = '×' + (+ampS.value).toFixed(1));
  slowS.addEventListener('input', () => $('#fork-slow-v').textContent = SLOWL[+slowS.value]);
  $('#fork-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.forkPause : T.forkRun; e.currentTarget.setAttribute('aria-pressed', run); });
  $('#fork-mode').addEventListener('click', e => { inPhase = !inPhase;
    e.currentTarget.textContent = inPhase ? T.forkModeAnti : T.forkModeIn; e.currentTarget.setAttribute('aria-pressed', !inPhase); });
  function frame(now){
    const dt = Math.min((now - last)/1000, 0.05); last = now;
    if (run) t += dt / SLOW[+slowS.value];
    const ph = t * 2*Math.PI * 1.1, s = Math.sin(ph), c = Math.cos(ph);
    const Am = 30 * (+ampS.value) * s, sign = inPhase ? 1 : -1, k = Math.abs(s);
    const shift = inPhase ? Am * 0.22 : 0;
    tines.innerHTML = tine(CXA + shift, Am, s, k) + tine(CXB + shift, sign * Am, sign * s, k);
    if (inPhase) baseG.setAttribute('transform', `translate(${shift.toFixed(2)} 0)`); else baseG.removeAttribute('transform');
    const v = 34 * c * (+ampS.value);
    mL.setAttribute('d', `M${(CXA + Am + shift).toFixed(1)} 92h${v.toFixed(1)}`);
    mR.setAttribute('d', `M${(CXB + sign * Am + shift).toFixed(1)} 92h${(sign * v).toFixed(1)}`);
    phL.textContent = T.tineA + (s >= 0 ? '+' : '−'); phR.textContent = T.tineB + ((sign * s) >= 0 ? '+' : '−');
    netEl.textContent = inPhase ? T.netBad : T.netOk; netEl.setAttribute('style', 'text-anchor:middle;' + (inPhase ? 'fill:#c2685a' : ''));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============================================================ 03 IMPEDANCE */
(function impedance(){
  const svg = $('#imp-svg'); if (!svg) return;
  const FS = 32768, C0 = 1.4e-12;
  const X0 = 78, X1 = 528, Y0 = 60, Y1 = 360, LZ0 = 3.4, LZ1 = 7.6;
  const gridG = $('#imp-grid');
  for (let e = 4; e <= 7; e++) { const y = Y1 - (e-LZ0)/(LZ1-LZ0)*(Y1-Y0);
    mk('line', {class:'grid-l', x1:X0, x2:X1, y1:y, y2:y}, gridG);
    mk('text', {class:'tick', x:X0-8, y:y+4, style:'text-anchor:end'}, gridG).textContent = '10' + '⁴⁵⁶⁷'[e-4]; }
  const el = { curve:$('#imp-curve'), fs:$('#imp-fs'), fp:$('#imp-fp'), fl:$('#imp-fl'),
    dot:$('#imp-dot'), band:$('#imp-band'), lfs:$('#imp-lbl-fs'), lfp:$('#imp-lbl-fp'), lfl:$('#imp-lbl-fl') };
  function draw(){
    const C1 = (+$('#c1').value) * 1e-15, R1 = (+$('#r1').value) * 1e3, CL = (+$('#cl').value) * 1e-12;
    const ws = 2*Math.PI*FS, L1 = 1/(ws*ws*C1);
    const fp = FS*Math.sqrt(1 + C1/C0), fl = FS*(1 + C1/(2*(C0+CL)));
    const Q = ws*L1/R1, ring = Q/(Math.PI*FS);
    const lo = FS - 14, hi = fp + 14, sx = f => X0 + (f-lo)/(hi-lo)*(X1-X0);
    const sy = z => clamp(Y1 - (Math.log10(z)-LZ0)/(LZ1-LZ0)*(Y1-Y0), Y0, Y1);
    const pts = [];
    for (let i = 0; i <= 600; i++) { const f = lo + (hi-lo)*i/600, w = 2*Math.PI*f;
      const zr = R1, zi = w*L1 - 1/(w*C1), zc = -1/(w*C0);
      // parallel of (zr + j zi) and (j zc)
      const ar = zr, ai = zi, br = 0, bi = zc;
      const nr = ar*br - ai*bi, ni = ar*bi + ai*br, dr = ar+br, di = ai+bi;
      const dd = dr*dr + di*di, pr = (nr*dr + ni*di)/dd, pi = (ni*dr - nr*di)/dd;
      pts.push([sx(f), sy(Math.hypot(pr, pi))]);
    }
    el.curve.setAttribute('d', poly(pts));
    el.fs.setAttribute('x1', sx(FS)); el.fs.setAttribute('x2', sx(FS));
    el.fp.setAttribute('x1', sx(fp)); el.fp.setAttribute('x2', sx(fp));
    el.fl.setAttribute('x1', sx(fl)); el.fl.setAttribute('x2', sx(fl));
    el.band.setAttribute('x', sx(FS)); el.band.setAttribute('width', Math.max(0, sx(fp)-sx(FS)));
    el.lfs.setAttribute('x', sx(FS)); el.lfp.setAttribute('x', sx(fp)); el.lfl.setAttribute('x', sx(fl));
    const w = 2*Math.PI*fl, zi = w*L1 - 1/(w*C1), zc = -1/(w*C0);
    const nr = -zi*zc, ni = R1*zc, dr = R1, di = zi+zc, dd = dr*dr+di*di;
    el.dot.setAttribute('cx', sx(fl));
    el.dot.setAttribute('cy', sy(Math.hypot((nr*dr+ni*di)/dd, (ni*dr-nr*di)/dd)));
    $('#cl-v').textContent = (+$('#cl').value).toFixed(1) + ' pF';
    $('#c1-v').textContent = (+$('#c1').value).toFixed(1) + ' fF';
    $('#r1-v').textContent = (+$('#r1').value) + ' kΩ';
    $('#s-fs').textContent = grp(FS) + '.0 Hz';
    $('#s-fp').textContent = grp(Math.round(fp)) + '.' + (fp % 1 * 10).toFixed(0) + ' Hz';
    $('#s-fl').textContent = fl.toFixed(1).replace(/^(\d\d)(\d\d\d)/, '$1 $2') + ' Hz';
    $('#s-pull-ppm').textContent = '+' + ((fl-FS)/FS*1e6).toFixed(0) + (document.documentElement.lang==='ja'?' ppm（fₛからの偏差）':' ppm above fₛ');
    $('#s-q').textContent = grp(Math.round(Q/1000)*1000);
    $('#s-ring').textContent = 'rings for ' + ring.toFixed(2) + ' s';
    window.__L1 = L1; window.__R1 = R1; window.__Q = Q;
    if (window.__pierceUpdate) window.__pierceUpdate();
  }
  ['#cl','#c1','#r1'].forEach(s => $(s).addEventListener('input', draw));
  draw();
})();

/* ============================================================ 04 PIERCE */
(function pierce(){
  const svg = $('#pierce-svg'); if (!svg) return;
  const runner = $('#pi-runner'), wg = $('#wv-g'), wd = $('#wv-d'),
        play = $('#wv-play'), env = $('#wv-env'), env2 = $('#wv-env2'), envPlay = $('#wv-envplay');
  const LOOP = [[186,230],[420,230],[420,120],[200,120],[200,230],[186,230],[186,340],[600,340],[600,230],[562,230]];
  const segLen = [], total = (() => { let s = 0;
    for (let i = 1; i < LOOP.length; i++) { const d = Math.hypot(LOOP[i][0]-LOOP[i-1][0], LOOP[i][1]-LOOP[i-1][1]);
      segLen.push(d); s += d; } return s; })();
  const along = u => { let d = u*total;
    for (let i = 0; i < segLen.length; i++) { if (d <= segLen[i]) { const f = d/segLen[i];
        return [LOOP[i][0] + (LOOP[i+1][0]-LOOP[i][0])*f, LOOP[i][1] + (LOOP[i+1][1]-LOOP[i][1])*f]; }
      d -= segLen[i]; } return LOOP[LOOP.length-1]; };

  const WX0 = 60, WX1 = 530, WY = 135, WA = 58;
  const wave = phase => { const p = [];
    for (let i = 0; i <= 240; i++) { const x = WX0 + (WX1-WX0)*i/240;
      p.push([x, WY - WA*Math.sin(2*Math.PI*2*i/240 + phase)]); } return poly(p); };
  wg.setAttribute('d', wave(0)); wd.setAttribute('d', wave(Math.PI));

  const EX0 = 60, EX1 = 530, EY0 = 375, EH = 50;
  let tStart = 0, t = 0, last = performance.now();
  function stats(){
    const gm = (+$('#gm').value)*1e-6, C = (+$('#cc').value)*1e-12;
    const w = 2*Math.PI*32768, L1 = window.__L1 || 7863, R1 = window.__R1 || 30000;
    const rneg = gm/(w*w*C*C);
    const margin = rneg/R1, tau = 2*L1/Math.max(rneg-R1, 1);
    $('#gm-v').textContent = (gm*1e6).toFixed(2) + ' µS';
    $('#cc-v').textContent = (C*1e12).toFixed(0) + ' pF';
    $('#s-rneg').textContent = '−' + (rneg/1000).toFixed(0) + ' kΩ';
    $('#s-margin').textContent = margin.toFixed(1) + '×';
    $('#s-start').textContent = margin > 1 ? T.oscSustain : T.oscFail;
    $('#s-start').style.color = margin > 1 ? '' : '#c2685a';
    $('#s-tau').textContent = margin > 1 ? tau.toFixed(2) + ' s' : '–';
    $('#s-power').textContent = (0.25 + gm*1e6*0.05 + (C*1e12)*0.012).toFixed(2) + ' µA';
    $('#wv-startup').textContent = margin > 1 ? T.envOk(tau.toFixed(2), (tau*5).toFixed(1)) : T.envFail;
    return { tau, margin };
  }
  function envelope(tau, margin){
    const p = [];
    for (let i = 0; i <= 200; i++) { const tt = i/200;
      const a = Math.min(1, margin > 1 ? 1 - Math.exp(-tt/tau) : Math.exp(-tt/0.25)*0.35);
      p.push([EX0 + (EX1-EX0)*tt, EY0 - a*EH]); }
    env.setAttribute('d', poly(p));
    env2.setAttribute('d', poly(p.map(q => [q[0], 2*EY0 - q[1]])));
  }
  const upd = () => { const s = stats(); envelope(s.tau, s.margin); };
  window.__pierceUpdate = upd;
  ['#gm','#cc'].forEach(id => $(id).addEventListener('input', upd));
  $('#pi-restart').addEventListener('click', () => { tStart = t; });
  upd();
  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now; t += dt;
    const u = (t*0.35) % 1, pt = along(u);
    runner.setAttribute('cx', pt[0]); runner.setAttribute('cy', pt[1]);
    const ph = t*3.2;
    wg.setAttribute('d', wave(ph)); wd.setAttribute('d', wave(ph+Math.PI));
    const px = WX0 + ((t*0.25)%1)*(WX1-WX0);
    play.setAttribute('x1', px); play.setAttribute('x2', px);
    const et = Math.min((t - tStart)/1.6, 1), ex = EX0 + et*(EX1-EX0);
    envPlay.setAttribute('x1', ex); envPlay.setAttribute('x2', ex);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============================================================ 05 DIVIDER */
(function divider(){
  const svg = $('#div-svg'); if (!svg) return;
  const row = $('#ff-row'), boxes = [];
  const FREQ = i => 32768 / Math.pow(2, i+1);
  for (let i = 0; i < 15; i++) {
    const x = 22 + i*74;
    const g = mk('g', {class:'ff'}, row);
    mk('rect', {x, y:110, width:62, height:64, rx:3}, g);
    const t1 = mk('text', {x:x+31, y:136}, g); t1.textContent = '÷2';
    const t2 = mk('text', {x:x+31, y:158, style:'font-size:13px'}, g); t2.textContent = '0';
    const lab = mk('text', {class:'tick', x:x+31, y:192,
      transform:`rotate(60 ${x+31} 192)`, style:'text-anchor:start'}, row);
    lab.textContent = grp(FREQ(i)) + ' Hz';
    if (i < 14) mk('path', {class:'wire', d:`M${x+62} 142h12`}, row);
    boxes.push({ g, t2 });
  }
  const SCALE = [1, 8, 64, 512, 4096], SCALEL = T.scales;
  let run = !reduced, tSim = 0, last = performance.now();
  $('#div-speed').addEventListener('input', () =>
    $('#div-speed-v').textContent = SCALEL[+$('#div-speed').value]);
  $('#div-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.divPause : T.divRun;
    e.currentTarget.setAttribute('aria-pressed', run); });

  const rows = $('#ladder-rows'), LX0 = 100, LX1 = 530, LW = (LX1-LX0)/32;
  for (let k = 1; k <= 5; k++) {
    const y = 46 + (k-1)*62, per = Math.pow(2, k), pts = [];
    for (let n = 0; n <= 32; n++) { const st = Math.floor(n/(per/2)) % 2;
      const yy = st ? y : y+38;
      pts.push([LX0 + n*LW, yy]); if (n < 32) pts.push([LX0 + (n+1)*LW, yy]); }
    mk('path', {class:'plotline', d: poly(pts), 'stroke-width':2.5}, rows);
    const t = mk('text', {class:'tick', x:LX0-10, y:y+24, style:'text-anchor:end'}, rows);
    t.textContent = grp(FREQ(k-1)) + ' Hz';
  }
  const play = $('#ladder-play');
  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    if (run) tSim += dt / SCALE[+$('#div-speed').value];
    const n = Math.floor(tSim * 32768);
    let bits = '';
    for (let i = 14; i >= 0; i--) {
      const st = (Math.floor(n / Math.pow(2, i))) % 2;
      bits += st;
      const b = boxes[i], hi = !!st;
      if (b.g.classList.contains('hi') !== hi) b.g.classList.toggle('hi', hi);
      b.t2.textContent = st;
      const visFreq = FREQ(i) / SCALE[+$('#div-speed').value];
      b.g.classList.toggle('blurred', visFreq > 10);
    }
    $('#div-count').textContent = bits;
    $('#div-elapsed').textContent = tSim.toFixed(3) + ' s';
    const px = LX0 + ((n % 32) + (tSim*32768 % 1)) * LW;
    play.setAttribute('x1', px); play.setAttribute('x2', px);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* Lavet stepper drawn as built: coil on a soft-iron core, a one-piece stator whose two halves
   meet only at two thin saturable bridges round the rotor bore, a magnet rotor and its pinion
   driving the fifth wheel. Returns markup; ids used by the simulation: rotor, flux, coil. */
function lavetMarkup(o){
  const A = window.WatchArt, M = T.motorArt || {};
  const RC = o.rc, R = 56, RM = 44;
  const [cx, cy] = RC;
  const top = cy - 62, bot = cy + 62, xl = 90, xr = 510, legW = 46, coilY = 96;
  const notch = a => { const p = A.polar(cx, cy, R, a * D2R); return [p[0], p[1]]; };
  // stator outline: bar with legs, bore cut out, outer V-slots that leave thin bridges above and below the bore
  const st = `M${xl} ${coilY - 26}h${legW}V${top}H${cx - 10}l10 ${R - 62 + 6 + 2}l10 ${-(R - 62 + 6 + 2)}H${xr - legW}V${coilY - 26}h${legW}V${bot}H${cx + 10}l-10 ${-(8)}l-10 8H${xl}Z` + A.circ(cx, cy, R);
  const notches = [notch(-45), notch(135)].map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" class="st-notch"/>`).join('');
  let s = '';
  s += `<rect class="motor-bg" x="-120" width="760" height="560" rx="8"/>`;
  s += `<path d="${st}" fill="#000" opacity=".22" transform="translate(5 8)" fill-rule="evenodd" filter="url(#wa-soft)"/>`;
  s += `<path class="stator-art" d="${st}" fill-rule="evenodd"/><path d="${st}" fill="url(#wa-brushed)" fill-rule="evenodd"/>`;
  s += `<path d="${st}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" transform="translate(-.6 -.8)"/>`;
  s += notches;
  // fifth wheel driven by the rotor pinion (above the stator, drawn translucent where it overlaps)
  const pr = 11, fw = { x: cx + 6, y: cy + pr + 64, R: 64 };
  s += `<g class="fifth" opacity=".88">${A.wheel({ x: fw.x, y: fw.y, z: 32, r: fw.R, id: 'motor-fifth', armsN: 4, curved: true, pinion: { z: 8, r: 10 } })}</g>`;
  // core and coil
  s += `<rect x="${xl - 6}" y="${coilY - 9}" width="${xr - xl + 12}" height="18" rx="3" fill="url(#wa-iron)" stroke="#4d555c" stroke-width=".8"/>`;
  s += A.coil({ x0: 162, x1: 438, y: coilY, rr: 34, flange: 11, id: 'coil' });
  s += `<rect id="coil-live" x="162" y="${coilY - 34}" width="276" height="68" rx="6" class="coil-live"/>`;
  s += A.screw(xl + legW / 2, coilY, 8, 30, 'steel') + A.screw(xr - legW / 2, coilY, 8, 120, 'steel');
  // flux path
  s += `<path id="flux" class="flux" d="M170 ${coilY}H${xr - legW / 2}V${cy}H${cx + R + 2}M${cx - R - 2} ${cy}H${xl + legW / 2}V${coilY}H170"/>`;
  s += `<path id="flux-gap" class="flux gap" d="M${cx + R} ${cy}H${cx - R}"/>`;
  // rotor: magnet with N/S halves, on top its pinion
  s += `<g id="rotor"><circle cx="${cx}" cy="${cy}" r="${RM}" fill="url(#wa-magnet)" stroke="#16181b" stroke-width="1.2"/>` +
    `<path d="M${cx - RM} ${cy}a${RM} ${RM} 0 0 1 ${2 * RM} 0z" class="rot-n"/><path d="M${cx + RM} ${cy}a${RM} ${RM} 0 0 1 ${-2 * RM} 0z" class="rot-s"/>` +
    `<path d="M${cx - RM} ${cy}h${2 * RM}" stroke="#0e0f11" stroke-width="1.4"/>` +
    `<text x="${cx}" y="${cy - 18}" class="rot-lbl">N</text><text x="${cx}" y="${cy + 28}" class="rot-lbl">S</text>` +
    A.pinion(cx, cy, 6, pr, { mat: 'white' }) + `</g>`;
  s += A.jewel(cx, cy, 4.2, { sink: false });
  // axes
  s += `<line class="axis-field" x1="${cx - R - 34}" y1="${cy}" x2="${cx + R + 140}" y2="${cy}"/>`;
  const d1 = A.polar(cx, cy, R + 92, 45 * D2R), d0 = A.polar(cx, cy, R + 20, -135 * D2R);
  s += `<line class="axis-detent" x1="${d0[0].toFixed(1)}" y1="${d0[1].toFixed(1)}" x2="${d1[0].toFixed(1)}" y2="${d1[1].toFixed(1)}"/>`;
  // labels
  const L1 = (ax, ay, lx, ly, a, b, side) => A.leader(ax, ay, lx, ly, [a, b], { side });
  s += `<g class="labels">` +
    L1(300, coilY - 30, 300, 30, M.coil || 'COIL', M.coilS || '≈ 12 000 turns of 20 µm copper', 'start') +
    L1(xl + legW / 2 - 10, coilY + 6, 40, 160, M.core || 'SOFT-IRON CORE', M.coreS || 'screwed to the stator legs', 'end') +
    L1(xr - 10, cy + 40, 520, 352, M.stator || 'STATOR', M.statorS || 'one piece of soft iron', 'start') +
    L1(cx, top + 4, 470, 180, M.bridge || 'SATURABLE BRIDGE', M.bridgeS || 'the halves meet only here', 'start') +
    L1(notch(-45)[0] + 4, notch(-45)[1] - 4, 470, 232, M.notch || 'DETENT NOTCH', M.notchS || 'sets the rest angle', 'start') +
    L1(cx - 30, cy + 24, 40, 300, M.rotor || 'ROTOR MAGNET', M.rotorS || 'SmCo, ≈ 1.4 mm across', 'end') +
    L1(cx - 8, cy + 8, 40, 352, M.pinion || 'ROTOR PINION', M.pinionS || '6 leaves', 'end') +
    L1(fw.x - 40, fw.y + 30, 40, 430, M.fifth || 'FIFTH WHEEL', M.fifthS || 'first stage of the train', 'end') +
    `</g>`;
  s += `<text class="tick" x="${cx + R + 142}" y="${cy + 4}" style="text-anchor:start;fill:#3f97c4">${M.field || 'field axis'}</text>`;
  s += `<text class="tick" x="${(d1[0] + 4).toFixed(1)}" y="${(d1[1] + 12).toFixed(1)}" style="text-anchor:start;fill:#c2685a">${M.detent || 'detent axis, 45° off'}</text>`;
  s += `<text class="lbl" x="${xl}" y="${coilY + 66}" id="coil-cur" style="text-anchor:start">i = 0</text>`;
  s += `<text class="lbl" x="260" y="498" id="motor-state">RESTING</text><text class="sub" x="260" y="516" id="motor-count"></text>`;
  s += `<text class="sub" x="260" y="546">${M.foot || 'Polarity alternates every second, so the rotor sees a reversing field but always turns the same way.'}</text>`;
  return s;
}

/* ============================================================ 06 LAVET MOTOR */
(function motor(){
  const svg = $('#motor-svg'); if (!svg) return;
  const RC = [300, 265];
  if (window.WatchArt) { svg.setAttribute('viewBox', '-120 0 760 560'); svg.insertAdjacentHTML('beforeend', lavetMarkup({ rc: RC })); }
  const fifth = $('#motor-fifth');
  const J = 2e-12;                 // rotor inertia, kg m^2
  const OFFSET = 3*Math.PI/4;      // stator field axis, measured from the rest position
  const TFULL = 23e-6;             // coil torque at 100 % chopper duty, N m
  const VCELL = 1.55, RCOIL = 2000, ILOGIC = 0.8e-6, CELL = 25e-3; // A h
  const rotor = $('#rotor'), flux = $('#flux'), state = $('#motor-state'),
        cnt = $('#motor-count'), cur = $('#coil-cur');
  const tqD = $('#tq-detent'), tqC = $('#tq-coil'), tqT = $('#tq-total'), tqDot = $('#tq-dot'),
        stepCurve = $('#step-curve'), band = $('#pulse-band'), verdict = $('#step-verdict');
  const TX0 = 64, TX1 = 530, TY = 144, TYS = 92;     // torque plot
  const SX0 = 64, SX1 = 530, SY0 = 498, SYH = 112;   // step plot: 0 deg at SY0, 180 deg at SY0-SYH*(180/290)

  let params = {}, traj = [], run = !reduced;
  function readParams(){
    const tp = (+$('#tp').value)/1000, duty = (+$('#duty').value)/100,
          Tc = (+$('#tc').value)*1e-6, b = (+$('#bd').value)*1e-9;
    return { tp, duty, Tc, b, Tm: TFULL*duty };
  }
  function simulate(p){
    const dt = 1e-6, steps = 45000, out = [];
    let th = 0, w = 0;
    for (let i = 0; i < steps; i++) {
      const t = i*dt, on = t < p.tp;
      const T = -p.Tc*Math.sin(2*th) + (on ? p.Tm*Math.sin(OFFSET - th) : 0) - p.b*w;
      w += T/J*dt; th += w*dt;
      if (i % 100 === 0) out.push([t, th]);
    }
    return { traj: out, final: th };
  }
  function recompute(){
    params = readParams();
    const r = simulate(params); traj = r.traj;
    const deg = r.final/D2R, nearest = Math.round(deg/180)*180;
    let ok = 'fail';
    if (Math.abs(deg - 180) < 40) ok = 'ok';
    else if (deg > 300) ok = 'double';
    verdict.textContent = ok === 'ok' ? T.verdictOk : ok === 'double' ? T.verdictDouble(nearest) : T.verdictFail;
    verdict.setAttribute('style', 'fill:' + (ok === 'ok' ? '#25483d' : '#c2685a'));

    // torque curves
    const dpts = [], cpts = [], tpts = [];
    for (let i = 0; i <= 360; i += 2) {
      const th = i*D2R, x = TX0 + i/360*(TX1-TX0);
      const td = -params.Tc*Math.sin(2*th), tc = params.Tm*Math.sin(OFFSET - th);
      const sc = 1e6 * TYS / 8;
      dpts.push([x, TY - td*sc]); cpts.push([x, clamp(TY - tc*sc, 46, 240)]);
      tpts.push([x, clamp(TY - (td+tc)*sc, 46, 240)]);
    }
    tqD.setAttribute('d', poly(dpts)); tqC.setAttribute('d', poly(cpts)); tqT.setAttribute('d', poly(tpts));

    // step trajectory
    const sp = traj.map(([t, th]) => [SX0 + t/0.045*(SX1-SX0),
      clamp(SY0 - (th/D2R)/360*150, 344, 504)]);
    stepCurve.setAttribute('d', poly(sp));
    band.setAttribute('width', params.tp/0.045*(SX1-SX0));

    // electrical
    const iPulse = VCELL/RCOIL*params.duty;
    const iAvg = iPulse*params.tp + ILOGIC;
    const e = VCELL*iPulse*params.tp;
    const life = CELL/iAvg/8766;
    $('#tp-v').textContent = (+$('#tp').value).toFixed(1) + ' ms';
    $('#duty-v').textContent = (+$('#duty').value) + ' %';
    $('#tc-v').textContent = (+$('#tc').value).toFixed(2) + ' µN·m';
    $('#bd-v').textContent = (+$('#bd').value).toFixed(1) + '×10⁻⁹';
    $('#s-ipk').textContent = (iPulse*1e6).toFixed(0) + ' µA';
    $('#s-epulse').textContent = (e*1e6).toFixed(2) + ' µJ';
    $('#s-iavg').textContent = (iAvg*1e6).toFixed(2) + ' µA';
    $('#s-life').textContent = life.toFixed(1) + ' ' + T.yearsUnit;
  }
  ['#tp','#duty','#tc','#bd'].forEach(id => $(id).addEventListener('input', recompute));
  $('#motor-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.motorPause : T.motorRun;
    e.currentTarget.setAttribute('aria-pressed', run); });
  recompute();

  const PLAY = 0.55, HOLD = 0.65;         // seconds of wall clock
  let base = 0, stepNo = 0, phase = 0, last = performance.now();
  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    if (run) phase += dt;
    const cycle = PLAY + HOLD;
    if (phase > cycle) { phase -= cycle;
      const fin = traj.length ? traj[traj.length-1][1]/D2R : 0;
      base += fin; stepNo++; }
    const inPlay = phase < PLAY;
    const u = clamp(phase/PLAY, 0, 1);
    const idx = Math.min(traj.length-1, Math.floor(u*(traj.length-1)));
    const th = traj.length ? traj[idx][1]/D2R : 0, tNow = traj.length ? traj[idx][0] : 0;
    const pol = stepNo % 2 === 0 ? 1 : -1;
    rotor.setAttribute('transform', `rotate(${(135 + base + th).toFixed(2)} ${RC[0]} ${RC[1]})`);
    if (fifth) fifth.setAttribute('transform', `rotate(${(-(135 + base + th) * 6 / 32).toFixed(2)} ${RC[0] + 6} ${RC[1] + 75})`);
    const pulsing = inPlay && tNow < params.tp;
    flux.classList.toggle('on', pulsing);
    flux.classList.toggle('rev', pol < 0); svg.classList.toggle('rev', pol < 0);
    svg.querySelectorAll('.coil-turn').forEach(c => c.classList.toggle('live', pulsing));
    svg.classList.toggle('pulsing', pulsing);
    cur.textContent = pulsing ? `i = ${pol > 0 ? '+' : '−'}${(VCELL/RCOIL*params.duty*1e6).toFixed(0)} µA` : 'i = 0';
    cur.setAttribute('style', pulsing ? 'fill:#c2685a' : '');
    state.textContent = pulsing ? T.statePulse : inPlay ? T.stateCoast : T.stateRest;
    cnt.textContent = T.motorCount(stepNo, Math.round(((base+th)%360+360)%360)%360, pol>0?'+':'−', (tNow*1000).toFixed(1));
    const dx = TX0 + (((th%360)+360)%360)/360*(TX1-TX0);
    const thr = th*D2R;
    const tot = -params.Tc*Math.sin(2*thr) + (pulsing ? params.Tm*Math.sin(OFFSET-thr) : 0);
    tqDot.setAttribute('cx', dx);
    tqDot.setAttribute('cy', clamp(TY - tot*1e6*TYS/8, 46, 240));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============================================================ 07 TRAIN + DIALS */
(function train(){
  const svg = $('#train-svg'); if (!svg) return;
  const A = window.WatchArt; if (!A) return;
  const TT = T.train || {};
  svg.setAttribute('viewBox', '0 0 1010 500');
  const at = (p, d, deg) => [p[0] + d * Math.cos(deg * D2R), p[1] + d * Math.sin(deg * D2R)];
  // pitch radii follow the tooth counts; the ratios multiply to 21 600 : 1 from rotor to hour wheel
  const W = {
    rotor:  { pz: 6,  pr: 15.6, ratio: 1 },
    fifth:  { z: 30, R: 79,  pz: 8,  pr: 16.8, ratio: -1 / 5 },
    fourth: { z: 48, R: 101, pz: 8,  pr: 14.4, ratio: 1 / 30 },
    third:  { z: 60, R: 108, pz: 8,  pr: 14.4, ratio: -1 / 225 },
    centre: { z: 64, R: 115, ratio: 1 / 1800 } };
  W.rotor.p = [76, 236];
  W.fifth.p = at(W.rotor.p, W.rotor.pr + W.fifth.R, 26);
  W.fourth.p = at(W.fifth.p, W.fifth.pr + W.fourth.R, -26);
  W.third.p = at(W.fourth.p, W.fourth.pr + W.third.R, 20);
  W.centre.p = at(W.third.p, W.third.pr + W.centre.R, -18);
  // motion works on the dial side, drawn as an inset at a larger scale
  const MW = { c: [826, 236], cr: 18, mR: 54, mr: 14.4, hR: 57.6 };
  MW.m = at(MW.c, MW.cr + MW.mR, -90);
  let s = `<rect class="train-bg" width="1010" height="500" rx="8"/>`;
  s += `<rect class="inset" x="690" y="40" width="300" height="370" rx="8"/>`;
  // order: deepest first so each wheel sits under the pinion that drives it
  s += A.wheel({ x: W.centre.p[0], y: W.centre.p[1], z: W.centre.z, r: W.centre.R, id: 'qt-centre', armsN: 5, curved: true });
  s += A.wheel({ x: W.third.p[0], y: W.third.p[1], z: W.third.z, r: W.third.R, id: 'qt-third', armsN: 5, curved: true });
  s += A.wheel({ x: W.fourth.p[0], y: W.fourth.p[1], z: W.fourth.z, r: W.fourth.R, id: 'qt-fourth', armsN: 4, curved: true });
  s += A.wheel({ x: W.fifth.p[0], y: W.fifth.p[1], z: W.fifth.z, r: W.fifth.R, id: 'qt-fifth', armsN: 4 });
  for (const k of ['fifth', 'fourth', 'third']) { const q = W[k];
    s += `<g>${A.pinion(q.p[0], q.p[1], q.pz, q.pr, { id: 'qt-' + k + '-pin' })}${A.jewel(q.p[0], q.p[1], 4, { sink: false })}</g>`; }
  const [rx, ry] = W.rotor.p;
  s += `<g id="qt-rotor"><circle cx="${rx}" cy="${ry}" r="30" fill="url(#wa-magnet)" stroke="#16181b"/><path d="M${rx - 30} ${ry}a30 30 0 0 1 60 0z" class="rot-n"/><path d="M${rx + 30} ${ry}a30 30 0 0 1-60 0z" class="rot-s"/>` +
    A.pinion(rx, ry, 6, W.rotor.pr, { mat: 'white' }) + `</g>` + A.jewel(rx, ry, 3.6, { sink: false });
  // motion works inset
  const [mx, my] = MW.c;
  s += A.wheel({ x: MW.m[0], y: MW.m[1], z: 36, r: MW.mR, id: 'qt-minute', armsN: 0, mat: 'brass', pinion: { z: 10, r: MW.mr } });
  s += A.wheel({ x: mx, y: my, z: 40, r: MW.hR, id: 'qt-hour', armsN: 4, mat: 'brass', hub: 20 });
  s += `<g>${A.pinion(mx, my, 12, MW.cr, { id: 'qt-cannon' })}${A.jewel(mx, my, 5, { sink: false })}</g>`;
  s += `<path class="arbor-link" d="M${W.centre.p[0]} ${W.centre.p[1]}C${W.centre.p[0] + 120} ${W.centre.p[1] + 150} ${mx - 120} ${my + 170} ${mx} ${my}"/>`;
  // labels
  const lab = (x, y, a, b, c, anchor = 'middle') => `<text class="lbl" x="${x.toFixed(1)}" y="${y}" style="text-anchor:${anchor}">${a}</text><text class="sub" x="${x.toFixed(1)}" y="${y + 15}" style="text-anchor:${anchor}">${b}</text>` + (c ? `<text class="tick" x="${x.toFixed(1)}" y="${y + 29}" style="text-anchor:${anchor}">${c}</text>` : '');
  s += lab(rx, 136, TT.rotor || 'ROTOR', TT.rotorS || '180° steps · 30 rpm mean', TT.rotorT || 'pinion 6');
  s += lab(W.fifth.p[0], 392, TT.fifth || 'FIFTH WHEEL', TT.fifthS || '6 rpm', '30 · pinion 8');
  s += lab(W.fourth.p[0], 84, TT.fourth || 'FOURTH WHEEL', TT.fourthS || '1 rpm · seconds hand', '');
  s += lab(W.third.p[0], 410, TT.third || 'THIRD WHEEL', TT.thirdS || '8 turns / hour', '60 · pinion 8');
  s += lab(W.centre.p[0], 62, TT.centre || 'CENTRE WHEEL', TT.centreS || '1 rph · minute hand', '');
  s += `<text class="lbl" x="840" y="66" style="text-anchor:middle">${TT.inset || 'DIAL SIDE · MOTION WORKS'}</text>`;
  s += lab(mx, 330, TT.cannon || 'CANNON PINION + HOUR WHEEL', TT.cannonS || 'on the centre arbor', TT.cannonT || '12 → 36, 10 → 40 · ÷12');
  s += lab(MW.m[0] + 76, MW.m[1] - 2, TT.minute || 'MINUTE WHEEL', '÷3', '', 'start');
  s += `<text class="sub" x="505" y="470">${TT.foot || '5 × 6 × 7.5 × 8 × 12 = 21 600 : 1 from rotor to hour hand · no escapement anywhere in this chain'}</text>`;
  s += `<text class="tick" x="505" y="488">${TT.note || 'Tooth counts are typical; real calibres split the reduction differently and often add a second motor for the date.'}</text>`;
  svg.insertAdjacentHTML('beforeend', s);
  const E = id => svg.querySelector('#' + id);
  const parts = [['qt-rotor', W.rotor.p, 1], ['qt-fifth', W.fifth.p, -1 / 5], ['qt-fifth-pin', W.fifth.p, -1 / 5], ['qt-fourth', W.fourth.p, 1 / 30], ['qt-fourth-pin', W.fourth.p, 1 / 30],
    ['qt-third', W.third.p, -1 / 225], ['qt-third-pin', W.third.p, -1 / 225], ['qt-centre', W.centre.p, 1 / 1800], ['qt-cannon', MW.c, 1 / 1800],
    ['qt-minute', MW.m, -1 / 5400], ['qt-hour', MW.c, 1 / 21600]].map(([id, p, r]) => ({ el: E(id), p, r }));
  const COMP = [1, 60, 600, 3600], COMPL = ['×1', '×60', '×600', '×3600'];
  $('#train-speed').addEventListener('input', () => $('#train-speed-v').textContent = COMPL[+$('#train-speed').value - 1]);
  let run = !reduced, t = 0, last = performance.now();
  $('#train-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.trainPause : T.trainRun; e.currentTarget.setAttribute('aria-pressed', run); });
  // dials
  const dial = $('#dial-svg');
  const hands = {};
  if (dial) {
    dial.setAttribute('viewBox', '0 0 560 330');
    const face = (cx, cy, id) => {
      let f = `<circle cx="${cx + 4}" cy="${cy + 7}" r="124" fill="#000" opacity=".22" filter="url(#wa-soft)"/>` +
        `<circle cx="${cx}" cy="${cy}" r="122" fill="url(#wa-case)" stroke="#5c646b"/><circle cx="${cx}" cy="${cy}" r="110" fill="url(#wa-dial)" stroke="#8d8a80" stroke-width="1"/>`;
      for (let i = 0; i < 60; i++) { const a = i * 6 * D2R, big = i % 5 === 0, r0 = big ? 84 : 98, r1 = 104;
        f += big ? `<rect x="${cx - 3}" y="${cy - r1}" width="6" height="${r1 - r0}" rx="1.4" fill="url(#wa-steel-lin)" stroke="#59616a" stroke-width=".6" transform="rotate(${i * 6} ${cx} ${cy})"/>`
          : `<line x1="${(cx + Math.sin(a) * r0).toFixed(1)}" y1="${(cy - Math.cos(a) * r0).toFixed(1)}" x2="${(cx + Math.sin(a) * r1).toFixed(1)}" y2="${(cy - Math.cos(a) * r1).toFixed(1)}" stroke="#4b4f55" stroke-width="1"/>`; }
      const hand = (len, w, cls) => `<path class="${cls}" d="M${cx - w} ${cy + 14}L${cx - w * .7} ${cy - len * .9}L${cx} ${cy - len}L${cx + w * .7} ${cy - len * .9}L${cx + w} ${cy + 14}Z"/>`;
      f += `<g id="${id}-h">${hand(56, 5.5, 'hand-hr')}<path d="M${cx - 1.6} ${cy - 18}V${cy - 50}h3.2V${cy - 18}z" fill="#f4f1e2"/></g>`;
      f += `<g id="${id}-m">${hand(86, 4.2, 'hand-min')}<path d="M${cx - 1.2} ${cy - 22}V${cy - 80}h2.4V${cy - 22}z" fill="#f4f1e2"/></g>`;
      f += `<g id="${id}-s"><path d="M${cx - .9} ${cy + 28}V${cy - 100}h1.8V${cy + 28}z" fill="#c2342a"/><circle cx="${cx}" cy="${cy + 22}" r="5" fill="#c2342a"/></g>`;
      f += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#wa-steel)" stroke="#59616a"/>`;
      f += `<circle cx="${cx}" cy="${cy}" r="110" fill="url(#wa-sheen)" opacity=".25" pointer-events="none"/>`;
      return f; };
    dial.insertAdjacentHTML('beforeend', face(140, 150, 'dq') + face(420, 150, 'dm') +
      `<text class="lbl" x="140" y="306" style="text-anchor:middle">${TT.dialQ || 'QUARTZ · 1 step / s'}</text><text class="lbl" x="420" y="306" style="text-anchor:middle">${TT.dialM || 'MECHANICAL · 8 beats / s'}</text>`);
    for (const k of ['dq', 'dm']) for (const h of ['h', 'm', 's']) hands[k + h] = dial.querySelector(`#${k}-${h}`);
  }
  const t0 = (10 * 3600 + 9 * 60 + 30);
  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    const comp = COMP[+$('#train-speed').value - 1];
    if (run) t += dt*comp;
    // the rotor steps 180 deg once a second; at x1 the step takes about 60 ms
    const whole = Math.floor(t), fr = t - whole, stepped = comp > 1 ? t : whole + Math.min(1, fr / .06);
    const aR = 180 * stepped;
    parts.forEach(p => { if (p.el) p.el.setAttribute('transform', `rotate(${(aR * p.r % 360).toFixed(3)} ${p.p[0].toFixed(2)} ${p.p[1].toFixed(2)})`); });
    if (dial) {
      const T0 = t0 + t, sq = comp > 1 ? T0 : Math.floor(T0), smv = Math.floor(T0 * 8) / 8;
      const set = (k, sec) => { hands[k + 's'].setAttribute('transform', `rotate(${(sec % 60) * 6} ${k === 'dq' ? 140 : 420} 150)`);
        hands[k + 'm'].setAttribute('transform', `rotate(${(sec / 10) % 360} ${k === 'dq' ? 140 : 420} 150)`);
        hands[k + 'h'].setAttribute('transform', `rotate(${(sec / 120) % 360} ${k === 'dq' ? 140 : 420} 150)`); };
      set('dq', sq); set('dm', smv);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============================================================ 08 TEMPERATURE */
(function accuracy(){
  const svg = $('#temp-svg'); if (!svg) return;
  const BETA = 0.035, T0 = 25, RESID = 0.18;
  const X0 = 90, X1 = 1070, Y0 = 40, Y1 = 360, PMIN = -24, PMAX = 2;
  const sx = T => X0 + T/50*(X1-X0);
  const sy = p => clamp(Y1 - (p-PMIN)/(PMAX-PMIN)*(Y1-Y0), Y0, Y1);
  const g = $('#temp-grid');
  for (let p = 0; p >= -20; p -= 5) { const y = sy(p);
    mk('line', {class:'grid-l', x1:X0, x2:X1, y1:y, y2:y}, g);
    mk('text', {class:'tick', x:X0-10, y:y+4, style:'text-anchor:end'}, g).textContent = p; }
  for (let T = 0; T <= 50; T += 10) { const x = sx(T);
    mk('line', {class:'grid-l', x1:x, x2:x, y1:Y0, y2:Y1}, g);
    mk('text', {class:'tick', x, y:Y1+20}, g).textContent = T + '°'; }
  const curve = $('#temp-curve'), comp = $('#temp-comp'), trim = $('#temp-trim'),
        dot = $('#temp-dot'), wear = $('#temp-wear'), wa = $('#wear-a'), wb = $('#wear-b'), wl = $('#wear-line');
  let tcOn = false, wearOn = false;
  const raw = x => -BETA*(x-T0)*(x-T0);
  function draw(){
    const Tsel = +$('#temp').value, inh = +$('#inh').value;
    const trimPpm = inh * 1e6/(32768*60);
    const base = tcOn ? -RESID*Math.cos((Tsel-T0)/14) : raw(Tsel);
    const ppm = base + trimPpm;
    const p1 = [], p2 = [];
    for (let i = 0; i <= 200; i++) { const t = i/200*50;
      p1.push([sx(t), sy(raw(t) + trimPpm)]);
      p2.push([sx(t), sy(-RESID*Math.cos((t-T0)/14) + trimPpm)]); }
    curve.setAttribute('d', poly(p1)); comp.setAttribute('d', poly(p2));
    comp.setAttribute('opacity', tcOn ? 1 : 0);
    curve.setAttribute('opacity', tcOn ? 0.25 : 1);
    trim.setAttribute('y1', sy(trimPpm)); trim.setAttribute('y2', sy(trimPpm));
    trim.setAttribute('opacity', inh ? .8 : 0);
    dot.setAttribute('cx', sx(Tsel)); dot.setAttribute('cy', sy(ppm));

    let eff = ppm, src = Tsel === T0 ? T.srcTurnover : T.srcFrom((Tsel > T0 ? Tsel-T0 : T0-Tsel).toFixed(1));
    if (wearOn) {
      const a = (tcOn ? -RESID*Math.cos((33-T0)/14) : raw(33)) + trimPpm;
      const b = (tcOn ? -RESID*Math.cos((21-T0)/14) : raw(21)) + trimPpm;
      eff = (a*14 + b*10)/24;
      src = T.srcDuty;
      wear.setAttribute('opacity', 1);
      wa.setAttribute('cx', sx(33)); wa.setAttribute('cy', sy(a));
      wb.setAttribute('cx', sx(21)); wb.setAttribute('cy', sy(b));
      wl.setAttribute('x1', sx(21)); wl.setAttribute('y1', sy(b));
      wl.setAttribute('x2', sx(33)); wl.setAttribute('y2', sy(a));
    } else wear.setAttribute('opacity', 0);

    $('#temp-v').textContent = Tsel.toFixed(1) + ' \u00b0C';
    $('#inh-v').textContent = inh + (inh ? ` (+${trimPpm.toFixed(2)} ppm)` : '');
    $('#s-ppm').textContent = (eff >= 0 ? '+' : '') + eff.toFixed(2) + ' ppm';
    $('#s-src').textContent = src;
    const perDay = eff*0.0864, perMon = eff*2.6298, perYr = eff*31.557;
    $('#s-day').textContent = (perDay >= 0 ? '+' : '') + perDay.toFixed(2) + ' s';
    $('#s-mon').textContent = (perMon >= 0 ? '+' : '') + perMon.toFixed(1) + ' s';
    $('#s-yr').textContent  = (perYr  >= 0 ? '+' : '') + perYr.toFixed(0) + ' s';
    $('#temp-caption').textContent = tcOn ? T.capComp : T.capPlain;
  }
  $('#tc-toggle').addEventListener('click', e => { tcOn = !tcOn;
    e.currentTarget.textContent = tcOn ? T.tcOn : T.tcOff;
    e.currentTarget.setAttribute('aria-pressed', tcOn); draw(); });
  $('#wear-toggle').addEventListener('click', e => { wearOn = !wearOn;
    e.currentTarget.textContent = wearOn ? T.wearOn : T.wearOff;
    e.currentTarget.setAttribute('aria-pressed', wearOn); draw(); });
  ['#temp','#inh'].forEach(id => $(id).addEventListener('input', draw));
  draw();
})();

/* ============================================================ 09 RING-DOWN */
(function ringdown(){
  const svg = $('#q-svg'); if (!svg) return;
  const X0 = 70, X1 = 530, Y0 = 50, Y1 = 300;
  const g = $('#q-grid');
  for (let d = 0; d <= 5; d++) { const x = X0 + d/5*(X1-X0);
    mk('line', {class:'grid-l', x1:x, x2:x, y1:Y0, y2:Y1}, g); }
  for (const a of [0, .25, .5, .75, 1]) { const y = Y1 - a*(Y1-Y0);
    mk('line', {class:'grid-l', x1:X0, x2:X1, y1:y, y2:y}, g);
    mk('text', {class:'tick', x:X0-8, y:y+4, style:'text-anchor:end'}, g).textContent = a.toFixed(2); }
  const curve = (Q, el) => { const p = [];
    for (let i = 0; i <= 300; i++) { const d = i/300*5, n = Math.pow(10, d);
      const a = Math.exp(-Math.PI*n/Q);
      p.push([X0 + d/5*(X1-X0), Y1 - a*(Y1-Y0)]); }
    $(el).setAttribute('d', poly(p)); };
  curve(250, '#q-bal'); curve(54000, '#q-xtal');
})();

})();
