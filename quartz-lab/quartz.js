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
    $$('#chain-svg .node').forEach(n => n.classList.toggle('selected', n.dataset.part === id));
    const d = C[id]; nameEl.textContent = d[0]; copyEl.textContent = d[1];
    specEl.innerHTML = d[2].map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  };
  $$('#chain-svg .node').forEach(n => {
    n.addEventListener('click', () => pick(n.dataset.part));
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n.dataset.part); } });
  });
  pick('crystal');
})();

/* ============================================================ 02 TUNING FORK */
(function fork(){
  const svg = $('#fork-svg'); if (!svg) return;
  const tL = $('#tine-l'), tR = $('#tine-r'), eL = $('#el-l'), eR = $('#el-r'),
        mL = $('#mom-l'), mR = $('#mom-r'), netEl = $('#fork-net'),
        phL = $('#fork-phase-l'), phR = $('#fork-phase-r');
  const BETA = 1.875104, SIG = 0.734096, NORM = 2.0;
  const phi = s => ((Math.cosh(BETA*s) - Math.cos(BETA*s)) - SIG*(Math.sinh(BETA*s) - Math.sin(BETA*s))) / NORM;
  const Y0 = 390, Y1 = 80, L = Y0 - Y1, W = 15, N = 26;
  const shape = (cx, amp) => {
    const l = [], r = [];
    for (let i = 0; i <= N; i++) { const s = i/N, y = Y0 - s*L, u = amp*phi(s);
      l.push([cx+u-W, y]); r.push([cx+u+W, y]); }
    return { d: poly(l) + `A${W} ${W} 0 0 1 ${r[N][0].toFixed(2)} ${r[N][1].toFixed(2)}` +
                poly(r.slice().reverse()).replace('M','L') + 'Z',
             edge: poly(r), tip: l[N][0] + W, amp: amp };
  };
  let run = !reduced, inPhase = false, t = 0, last = performance.now();
  const ampS = $('#fork-amp'), slowS = $('#fork-slow');
  const SLOW = [1, 4, 16, 64], SLOWL = ['×1/32 768','×1/131 072','×1/524 288','×1/2 097 152'];
  ampS.addEventListener('input', () => $('#fork-amp-v').textContent = '×' + (+ampS.value).toFixed(1));
  slowS.addEventListener('input', () => $('#fork-slow-v').textContent = SLOWL[+slowS.value]);
  $('#fork-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.forkPause : T.forkRun;
    e.currentTarget.setAttribute('aria-pressed', run); });
  $('#fork-mode').addEventListener('click', e => { inPhase = !inPhase;
    e.currentTarget.textContent = inPhase ? T.forkModeAnti : T.forkModeIn;
    e.currentTarget.setAttribute('aria-pressed', !inPhase); });
  function frame(now){
    const dt = Math.min((now - last)/1000, 0.05); last = now;
    if (run) t += dt / SLOW[+slowS.value];
    const ph = t * 2*Math.PI * 1.1, s = Math.sin(ph), c = Math.cos(ph);
    const A = 26 * (+ampS.value) * s, sign = inPhase ? 1 : -1;
    const a = shape(250, A), b = shape(390, sign*A);
    tL.setAttribute('d', a.d); tR.setAttribute('d', b.d);
    eL.setAttribute('d', a.edge); eR.setAttribute('d', b.edge);
    eL.setAttribute('stroke', s >= 0 ? '#c2685a' : '#5aa9c8');
    eR.setAttribute('stroke', (sign*s) >= 0 ? '#c2685a' : '#5aa9c8');
    eL.setAttribute('stroke-width', 5); eR.setAttribute('stroke-width', 5);
    eL.setAttribute('fill','none'); eR.setAttribute('fill','none');
    const v = 30 * c * (+ampS.value);
    mL.setAttribute('d', `M${250 + A} 108h${v.toFixed(1)}`);
    mR.setAttribute('d', `M${390 + sign*A} 108h${(sign*v).toFixed(1)}`);
    phL.textContent = T.tineA + (s >= 0 ? '+' : '−');
    phR.textContent = T.tineB + ((sign*s) >= 0 ? '+' : '−');
    netEl.textContent = inPhase ? T.netBad : T.netOk;
    netEl.setAttribute('style', inPhase ? 'fill:#c2685a' : '');
    if (inPhase) svg.querySelectorAll('.fork-base').forEach(el =>
      el.setAttribute('transform', `translate(${(A*0.22).toFixed(2)} 0)`));
    else svg.querySelectorAll('.fork-base').forEach(el => el.removeAttribute('transform'));
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
    $('#s-ppm').textContent = '+' + ((fl-FS)/FS*1e6).toFixed(0) + ' ppm above fₛ';
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
    $('#s-tau').textContent = margin > 1 ? tau.toFixed(2) + ' s' : '—';
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

/* ============================================================ 06 LAVET MOTOR */
(function motor(){
  const svg = $('#motor-svg'); if (!svg) return;
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
    rotor.setAttribute('transform', `rotate(${(135 + base + th).toFixed(2)} 300 250)`);
    const pulsing = inPlay && tNow < params.tp;
    flux.classList.toggle('on', pulsing);
    flux.classList.toggle('rev', pol < 0);
    svg.querySelectorAll('.coil-turn').forEach(c => c.classList.toggle('live', pulsing));
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
  const gears = [];
  $$('#train-svg .gr').forEach(g => {
    const x = +g.dataset.x, y = +g.dataset.y, r = +g.dataset.r;
    mk('circle', {class:'gr-disc', cx:x, cy:y, r:r*0.72}, g);
    mk('circle', {class:'gr-teeth', cx:x, cy:y, r:r*0.9}, g);
    mk('path', {class:'gr-teeth', d:`M${x-r*0.5} ${y}h${r}M${x} ${y-r*0.5}v${r}`,
      'stroke-width':3, 'stroke-dasharray':'none', opacity:.5}, g);
    mk('circle', {class:'gr-hub', cx:x, cy:y, r:Math.max(5, r*0.16)}, g);
    gears.push({ g, x, y, rate:+g.dataset.rate });
  });
  const COMP = [1, 60, 600, 3600], COMPL = ['×1','×60','×600','×3600'];
  $('#train-speed').addEventListener('input', () =>
    $('#train-speed-v').textContent = COMPL[+$('#train-speed').value - 1]);
  let run = !reduced, t = 0, last = performance.now();
  $('#train-toggle').addEventListener('click', e => { run = !run;
    e.currentTarget.textContent = run ? T.trainPause : T.trainRun;
    e.currentTarget.setAttribute('aria-pressed', run); });

  for (const [id, cx, cy] of [['#dial-q-ticks',150,160], ['#dial-m-ticks',410,160]]) {
    const host = $(id); if (!host) continue;
    for (let i = 0; i < 60; i++) { const a = i*6*D2R, r1 = i%5 ? 96 : 88;
      mk('line', {class:'dial-tick', 'stroke-width': i%5?1:2.5,
        x1:cx+Math.sin(a)*r1, y1:cy-Math.cos(a)*r1,
        x2:cx+Math.sin(a)*103, y2:cy-Math.cos(a)*103}, host); }
  }
  const hq = $('#hand-sq'), hm = $('#hand-sm');
  function frame(now){
    const dt = Math.min((now-last)/1000, 0.05); last = now;
    const comp = COMP[+$('#train-speed').value - 1];
    if (run) t += dt*comp;
    gears.forEach(g => g.g.setAttribute('transform', `rotate(${(g.rate*t)%360} ${g.x} ${g.y})`));
    if (hq) hq.setAttribute('transform', `rotate(${Math.floor(t)*6} 150 160)`);
    if (hm) hm.setAttribute('transform', `rotate(${Math.floor(t*8)/8*6} 410 160)`);
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
