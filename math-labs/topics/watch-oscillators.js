'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, DEG = Math.PI / 180, DAY = 86400;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/watch-oscillators.cjs) ---------- */
  const VPH = [18000, 21600, 25200, 28800, 36000];
  const freqOf = (vph) => vph / 7200;                     // oscillations per second: two beats per oscillation
  const I_BAL = 1.2e-9;                                   // kg m^2 = 12 mg cm^2
  const kappaFor = (f, I = I_BAL) => I * (TAU * f) ** 2;  // torsional stiffness for frequency f
  const periodOf = (I, kappa) => TAU * Math.sqrt(I / kappa);
  // regulator: kappa proportional to 1/L, so the frequency scales as sqrt(L0/L); dL = fractional change of active length
  const regulatorRate = (dL) => DAY * (Math.sqrt(1 / (1 + dL)) - 1);
  const energyStored = (kappa, A) => 0.5 * kappa * A * A;
  const powerNeeded = (kappa, A, f, Q) => TAU * f * energyStored(kappa, A) / Q;
  // timegrapher: time deviation (s) of beat n against a perfect clock, rate in s/day, beat error in s
  const tickDeviation = (n, f, rate, beatErr) => (n / (2 * f)) * rate / DAY + (n % 2 ? -beatErr / 2 : beatErr / 2);

  // Airy: kick of relative size eps (delta v / (A omega)) at phase Phi_i where sin Phi_i = theta_i / A
  const airyPhaseShift = (eps, phi) => -eps * Math.sin(phi);
  const airyAmpChange = (eps, phi) => eps * Math.cos(phi);
  // steady state: the kick replaces the loss pi/(2Q) per half cycle, so eps cos Phi = pi/(2Q), and the rate is -43200 tan(Phi)/Q
  const airyRate = (thetaI, A, Q) => { const s = thetaI / A; if (Math.abs(s) >= 1) return NaN; const phi = Math.asin(s); return -DAY / (2 * Q) * Math.tan(phi); };
  const airyEps = (thetaI, A, Q) => Math.PI / (2 * Q * Math.cos(Math.asin(thetaI / A)));
  // numerical check: theta'' + (w/Q) theta' + w^2 theta with a velocity kick eps*A_now*w in the direction of motion whenever theta crosses +thetaI (moving +) or -thetaI (moving -)
  function simulateEscapement(thetaI, eps, Q, f = 1, cycles = 400, A0 = 1) {
    const w = TAU * f, dt = 1 / (f * 4000);
    let th = 0, v = A0 * w, t = 0, lastUp = null, periods = [], amps = [], maxTh = 0;
    const acc = (x, y) => -w * w * x - (w / Q) * y;
    for (let k = 0; k < cycles * 4000; k++) {
      // RK4
      const k1x = v, k1v = acc(th, v), k2x = v + dt / 2 * k1v, k2v = acc(th + dt / 2 * k1x, v + dt / 2 * k1v);
      const k3x = v + dt / 2 * k2v, k3v = acc(th + dt / 2 * k2x, v + dt / 2 * k2v), k4x = v + dt * k3v, k4v = acc(th + dt * k3x, v + dt * k3v);
      const nth = th + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), nv = v + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
      // kicks: crossing +thetaI upward while moving +, crossing -thetaI downward while moving -
      const A = Math.hypot(nth, nv / w);
      let kv = nv;
      if (nv > 0 && th < thetaI && nth >= thetaI) kv += eps * A * w;
      if (nv < 0 && th > -thetaI && nth <= -thetaI) kv -= eps * A * w;
      // zero-crossing upward for the period
      if (th < 0 && nth >= 0) { const tc = t + dt * (-th) / (nth - th); if (lastUp !== null) { periods.push(tc - lastUp); amps.push(maxTh); maxTh = 0; } lastUp = tc; }
      maxTh = Math.max(maxTh, nth);
      th = nth; v = kv; t += dt;
    }
    const tail = periods.slice(-100), P = tail.reduce((a, b) => a + b, 0) / tail.length, Am = amps.slice(-100).reduce((a, b) => a + b, 0) / 100;
    return { period: P, rate: DAY * (1 / f - P) / (1 / f), amp: Am };
  }

  // Bessel J1 by its power series (fine for |x| < 12)
  function J1(x) { let s = 0, t = x / 2; for (let k = 0; k < 60; k++) { s += t; t *= -(x * x / 4) / ((k + 1) * (k + 2)); } return s; }
  const J1_ZERO = 3.831705970207512;
  // positional error: relative frequency change for unbalance m r (kg m), heavy-spot angle alpha from gravity, amplitude A (rad)
  const poiseFactor = (mr, I = I_BAL, f = 4) => mr * 9.81 / (I * (TAU * f) ** 2);
  const poiseRate = (mr, alpha, A, I = I_BAL, f = 4) => DAY * poiseFactor(mr, I, f) * Math.cos(alpha) * J1(A) / A;
  // numerical check of the same: I theta'' + kappa theta = -m g r sin(theta + alpha), period measured by zero crossings of theta + const
  function simulatePoise(mr, alpha, A, I = I_BAL, f = 4) {
    const kappa = kappaFor(f, I), g = mr * 9.81, w0 = TAU * f, dt = 1 / (f * 6000);
    const acc = (x) => (-kappa * x - g * Math.sin(x + alpha) + g * Math.sin(alpha)) / I; // subtract the static torque so theta = 0 stays the rest point to first order
    let th = A, v = 0, t = 0, turns = [], prev = th;
    for (let k = 0; k < 40 * 6000; k++) {
      const k1x = v, k1v = acc(th), k2x = v + dt / 2 * k1v, k2v = acc(th + dt / 2 * k1x), k3x = v + dt / 2 * k2v, k3v = acc(th + dt / 2 * k2x), k4x = v + dt * k3v, k4v = acc(th + dt * k3x);
      const nth = th + dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), nv = v + dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (v > 0 && nv <= 0) turns.push(t + dt * v / (v - nv)); // maxima
      th = nth; v = nv; t += dt; void prev;
    }
    const P = (turns[turns.length - 1] - turns[0]) / (turns.length - 1);
    return DAY * (TAU / w0 - P) / (TAU / w0);
  }
  const POS_OFFSET = [null, 0, 90, 180, 270]; // degrees of rotation of gravity in the watch frame; dial up has none

  (window.LabModels = window.LabModels || {})['watch-oscillators'] = { VPH, freqOf, I_BAL, kappaFor, periodOf, regulatorRate, energyStored, powerNeeded, tickDeviation, airyPhaseShift, airyAmpChange, airyRate, airyEps, simulateEscapement, J1, J1_ZERO, poiseFactor, poiseRate, simulatePoise, POS_OFFSET };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const sgn = (x, d = 2) => (x >= 0 ? '+' : '−') + fmt(Math.abs(x), d);

  // a balance wheel: rim, three arms, timing screws, drawn rotated by theta about (cx, cy)
  function drawBalance(f, cx, cy, R, theta, o = {}) {
    const g = f.group(o.layer || 'main');
    const add = (el) => { g.appendChild(el); return el; };
    add(f.circle(cx, cy, R, { c: o.c || 'c1', w: o.w || 3.2 }));
    add(f.circle(cx, cy, R * 0.9, { c: o.c || 'c1', w: 1, op: 0.5 }));
    for (let k = 0; k < 3; k++) { const a = theta + Math.PI / 2 + k * TAU / 3; add(f.seg([cx, cy], [cx + R * 0.9 * Math.cos(a), cy + R * 0.9 * Math.sin(a)], { c: o.c || 'c1', w: 2.2 })); }
    for (let k = 0; k < 8; k++) { const a = theta + k * TAU / 8 + Math.PI / 8; add(f.dot(cx + R * 1.07 * Math.cos(a), cy + R * 1.07 * Math.sin(a), { c: o.c || 'c1', r: 2.4, layer: o.layer || 'main' })); }
    add(f.dot(cx, cy, { c: 'ink', r: 3, layer: o.layer || 'main' }));
    return g;
  }

  /* ---------- 1. balance, hairspring and timegrapher ---------- */
  const REG_ARC = [200, 250]; // degrees on the outer turn where the regulator index can sit
  D['balance-hairspring'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const vph = VPH[v.vph], fr = freqOf(vph), kappa = kappaFor(fr), dL = v.reg / 1000, rate = regulatorRate(dL), be = v.beat / 1000, A = v.amp * DEG, Q = 250;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The balance and its hairspring, in slow motion (one eighth of real speed). Drag the gold regulator index along its scale.', 'てんぷとひげぜんまいです（実際の 8 分の 1 の速さ）。金色の緩急針を目盛りに沿ってドラッグしてください。'));
      const f = L.fig(c1, { x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, axes: false, maxH: 400 });
      // regulator scale: an arc outside the spiral, from 'slow' to 'fast'
      const rS = 1.22, a0 = REG_ARC[0] * DEG, a1 = REG_ARC[1] * DEG, tOf = (d) => a0 + (d + 0.5) / 1 * (a1 - a0), dOf = (a) => clamp((a - a0) / (a1 - a0) - 0.5, -0.5, 0.5);
      f.line(L.sample(a0, a1, 40, (a) => [rS * Math.cos(a), rS * Math.sin(a)]), { c: 'muted', w: 1.2, layer: 'under' });
      for (let k = 0; k <= 10; k++) { const a = a0 + k / 10 * (a1 - a0); f.seg([rS * Math.cos(a), rS * Math.sin(a)], [(rS + (k % 5 ? 0.04 : 0.08)) * Math.cos(a), (rS + (k % 5 ? 0.04 : 0.08)) * Math.sin(a)], { c: 'muted', w: 1, layer: 'under' }); }
      f.text((rS + 0.14) * Math.cos(a0), (rS + 0.14) * Math.sin(a0), T('S', 'S'), { small: true, c: 'muted' }); f.text((rS + 0.14) * Math.cos(a1), (rS + 0.14) * Math.sin(a1), T('F', 'F'), { small: true, c: 'muted' });
      // v.reg in permille: map to the arc (negative dL = shorter = fast)
      const aReg = tOf(-v.reg);
      f.handle(rS * Math.cos(aReg), rS * Math.sin(aReg), { c: 'hl', r: 7, label: T('Regulator index', '緩急針'), onDrag: (x, y) => { let a = Math.atan2(y, x); if (a < 0) a += TAU; ctx.set('reg', Math.round(-dOf(a) * 100) / 100); } });
      const spiral = f.group('main'), bal = f.group('over');
      const drawFrame = (th) => {
        while (spiral.firstChild) spiral.removeChild(spiral.firstChild); while (bal.firstChild) bal.removeChild(bal.firstChild);
        // Archimedean spiral from the collet (r 0.12) to the stud (r 0.62), 12 turns; the inner end turns with the balance, the outer end is fixed
        const N = 12, pts = L.seq(900, (i) => { const u = i / 899, r = 0.12 + 0.5 * u, a = u * N * TAU + th * (1 - u) - Math.PI / 2; return [r * Math.cos(a), r * Math.sin(a)]; });
        spiral.appendChild(f.line(pts, { c: 'c3', w: 1.1, layer: 'main' }));
        bal.appendChild(drawBalance(f, 0, 0, 1, th, { layer: 'over' }));
        // regulator pins at the outer turn, radial line from the index to the spring
        bal.appendChild(f.seg([0.62 * Math.cos(aReg), 0.62 * Math.sin(aReg)], [(rS - 0.05) * Math.cos(aReg), (rS - 0.05) * Math.sin(aReg)], { c: 'hl', w: 2, layer: 'over' }));
      };
      drawFrame(0);
      // right: the timegrapher
      L.h('p', 'lab-cap', c2, T('Timegrapher: the time of every tick against a perfect clock over one minute. The slope of the lines is the rate.', 'タイムグラファー：1 分間の各刻みの時刻を完全な時計と比べたものです。線の傾きが歩度です。'));
      const span = 60, yMax = Math.max(3, Math.abs(rate) / DAY * span * 1000 * 1.2 + be * 1000);
      const g = L.fig(c2, { x: [0, span], y: [-yMax, yMax], aspect: 0.72, xlabel: T('time (s)', '時間（s）'), ylabel: T('deviation (ms)', 'ずれ（ms）'), maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, dash: '3 3', layer: 'under' });
      const nBeats = Math.floor(span * 2 * fr);
      for (let n = 0; n <= nBeats; n += 2 * Math.max(1, Math.round(fr / 2))) for (const m of [n, n + 1]) g.dot(m / (2 * fr), tickDeviation(m, fr, rate, be) * 1000, { c: m % 2 ? 'c2' : 'c1', r: 1.8, layer: 'main' });
      g.text(span * 0.97, (rate / DAY * span * 0.97 * 1000) + be * 500 + yMax * 0.08, T('tic', 'チク'), { small: true, c: 'c1', anchor: 'end' });
      g.text(span * 0.97, (rate / DAY * span * 0.97 * 1000) - be * 500 - yMax * 0.08, T('toc', 'タク'), { small: true, c: 'c2', anchor: 'end', dy: 8 });
      const cursor = L.el('line', { y1: g.Y(yMax), y2: g.Y(-yMax), style: 'stroke:var(--lab-hl);stroke-width:1.5' }, g.layers.over);
      L.legend(ctx.host, [{ c: 'c3', label: T('hairspring', 'ひげぜんまい') }, { c: 'hl', kind: 'dot', label: T('regulator index', '緩急針') }, { c: 'c1', kind: 'dot', label: T('tic', 'チク') }, { c: 'c2', kind: 'dot', label: T('toc', 'タク') }]);
      ctx.readout([
        { k: T('beat rate', '振動数'), v: `${vph.toLocaleString()} vph = ${fmt(fr, 1)} Hz`, tone: 'key' },
        { k: 'κ = Iω²', v: `${fmt(kappa * 1e7, 2)} × 10⁻⁷ N·m/rad` },
        { k: 'ΔL / L', v: `${sgn(v.reg, 2)} ‰` },
        { k: T('rate', '歩度'), v: `${sgn(rate, 1)} s/day`, tone: Math.abs(rate) > 10 ? 'warn' : 'good' },
        { k: T('beat error', '片振り'), v: `${fmt(v.beat, 1)} ms`, tone: v.beat > 1 ? 'warn' : undefined },
        { k: T('energy, power (Q = 250)', 'エネルギー、仕事率（Q = 250）'), v: `${fmt(energyStored(kappa, A) * 1e6, 1)} µJ, ${fmt(powerNeeded(kappa, A, fr, Q) * 1e6, 2)} µW` },
      ], Math.abs(v.reg) < 0.005
        ? T('With the index in the middle the balance runs at its nominal frequency and the tic and toc lines are flat; only the beat error separates them.', '緩急針が中央にあると、てんぷは公称の振動数で振動し、チクとタクの線は水平です。二本を分けるのは片振りだけです。')
        : T(`Moving the index ${v.reg < 0 ? 'towards F shortens' : 'towards S lengthens'} the active hairspring by ${fmt(Math.abs(v.reg), 2)}‰, the stiffness ${v.reg < 0 ? 'rises' : 'falls'} in proportion, and the frequency by half as much: ${sgn(rate, 1)} s a day, which the timegrapher draws as a slope of ${sgn(rate / DAY * 1000, 3)} ms per second.`, `緩急針を ${v.reg < 0 ? 'F 側へ動かすと' : 'S 側へ動かすと'}ひげぜんまいの有効長さが ${fmt(Math.abs(v.reg), 2)}‰ ${v.reg < 0 ? '短く' : '長く'}なり、剛性はそれに比例して${v.reg < 0 ? '増え' : '減り'}、振動数はその半分だけ変わります。一日に ${sgn(rate, 1)} 秒で、タイムグラファーはこれを毎秒 ${sgn(rate / DAY * 1000, 3)} ms の傾きとして描きます。`));
      const slow = 8;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const tt = t / slow;
        drawFrame(A * Math.sin(TAU * fr * (1 + rate / DAY) * tt));
        const x = tt % span; cursor.setAttribute('x1', g.X(x)); cursor.setAttribute('x2', g.X(x));
        lab.textContent = T(`t = ${fmt(tt, 2)} s (×1/${slow})`, `t = ${fmt(tt, 2)} 秒（×1/${slow}）`);
      }, { autoplay: false, initialT: 0, playLabel: T('Set the balance swinging', 'てんぷを振らせる') });
    },
  };

  /* ---------- 2. Airy's theorem ---------- */
    D['escapement-airy'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const A = v.amp * DEG, thi = v.thi * DEG, Q = v.Q, s = thi / A, phi = Math.asin(s), eps = airyEps(thi, A, Q), dPhi = airyPhaseShift(eps, phi), rate = airyRate(thi, A, Q);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The phase plane (θ/A, θ̇/Aω). Kicks happen on the gold lines, at θ = ±θᵢ in the direction of motion. The loss and the kick are drawn schematically large.`, `位相平面 (θ/A, θ̇/Aω) です。一撃は金色の線、すなわち運動方向に θ = ±θᵢ の位置で起こります。損失と一撃は模式的に大きく描いています。`));
      const f = L.fig(c1, { x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, xlabel: 'θ / A', ylabel: 'θ̇ / Aω', maxH: 400 });
      f.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 3', layer: 'under' });
      f.vline(s, { c: 'hl', w: 1.2, dash: '4 3', op: 0.8, layer: 'under' }); f.vline(-s, { c: 'hl', w: 1.2, dash: '4 3', op: 0.8, layer: 'under' });
      // the limit cycle: decays over each half cycle, kicked back at theta = +-thetaI; exaggerated
      const e = 0.2, decay = 0.2 / (1 + 0.2);
      const rMax = 1, rMin = rMax * (1 - decay);
      const pts = []; const N = 360;
      // parametrise by the true phase: from just after the upper kick (phase phi) round to the lower kick (phi + pi), radius decaying from rMax to rMin
      for (let k = 0; k <= N; k++) { const u = k / N, ph = phi + u * Math.PI, r = rMax - (rMax - rMin) * u; pts.push([r * Math.sin(ph), r * Math.cos(ph)]); }
      for (let k = 0; k <= N; k++) { const u = k / N, ph = phi + Math.PI + u * Math.PI, r = rMax - (rMax - rMin) * u; pts.push([r * Math.sin(ph), r * Math.cos(ph)]); }
      f.line(pts, { c: 'c1', w: 2.2, layer: 'main' });
      // the kick itself, drawn as a vertical jump, and the rays before and after
      const pre = [rMin * Math.sin(phi), rMin * Math.cos(phi)], post = [pre[0], pre[1] + e];
      f.arrow(pre, post, { c: 'c2', w: 2.4, layer: 'over' });
      f.seg([0, 0], pre, { c: 'muted', w: 1, layer: 'under' }); f.seg([0, 0], post, { c: 'c2', w: 1, layer: 'under' });
      f.text(post[0], post[1], T('kick', '一撃'), { small: true, c: 'c2', dx: 8, dy: -6, anchor: 'start', layer: 'over' });
      f.text(0.03, -1.33, T('centre line θ = 0', '中心線 θ = 0'), { small: true, c: 'muted', anchor: 'start' }); f.vline(0, { c: 'muted', w: 0.8, op: 0.6, layer: 'under' });
      const dot = L.el('circle', { r: 6, style: 'fill:var(--lab-hl)' }, f.layers.over);
      // right: rate against amplitude
      L.h('p', 'lab-cap', c2, T('Rate error against amplitude for a kick at θᵢ from the centre, at this Q. Drag the gold point.', 'この Q で、中心から θᵢ の位置で与える一撃による、振り角に対する歩度の誤差です。金色の点をドラッグしてください。'));
      const ymax = Math.max(2, ...[100, 330].map((a) => Math.abs(airyRate(thi, a * DEG, Q)))) * 1.15;
      const g = L.fig(c2, { x: [100, 330], y: [-ymax, ymax], aspect: 0.72, xlabel: T('amplitude (degrees)', '振り角（度）'), ylabel: 's/day', maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      g.line(L.sample(100, 330, 200, (a) => airyRate(thi, a * DEG, Q)), { c: 'c1', w: 2.4, layer: 'main' });
      g.line(L.sample(100, 330, 200, (a) => airyRate(-thi, a * DEG, Q)), { c: 'c4', w: 1.4, dash: '5 3', layer: 'main' });
      g.handle(v.amp, rate, { c: 'hl', r: 7, axis: 'x', snap: 5, label: T('Amplitude', '振り角'), bounds: [100, 330, -ymax, ymax], onDrag: (x) => ctx.set('amp', Math.round(x / 5) * 5) });
      L.legend(ctx.host, [{ c: 'c1', label: T('the state of the balance, and the rate for kicks at θᵢ', 'てんぷの状態と、θᵢ での一撃による歩度') }, { c: 'c4', dash: true, label: T('the mirror case, kicks at −θᵢ', '鏡像の場合、−θᵢ での一撃') }, { c: 'c2', label: T('the kick', '一撃') }]);
      ctx.readout([
        { k: 'θᵢ, A', v: `${sgn(v.thi, 1)}°, ${v.amp}°`, tone: 'key' },
        { k: 'Φᵢ = arcsin(θᵢ/A)', v: `${sgn(phi / DEG, 2)}°` },
        { k: T('kick ε = δv / Aω', '一撃 ε = δv / Aω'), v: fmt(eps, 5) },
        { k: T('phase shift per kick', '一撃ごとの位相のずれ'), v: `${sgn(dPhi * 1e3, 3)} mrad` },
        { k: T('rate', '歩度'), v: `${sgn(rate, 2)} s/day`, tone: Math.abs(rate) < 0.05 ? 'good' : 'warn' },
      ], Math.abs(v.thi) < 0.01
        ? T('The kick lands exactly on the centre line: it lengthens the phase-plane radius without turning it, so the amplitude is restored and the timing untouched, at every amplitude. This is the ideal every escapement design aims for.', '一撃はちょうど中心線上に当たります。位相平面の半径を回転させずに伸ばすので、振り角は回復し時刻には触れません。どの振り角でもそうです。これが、あらゆる脱進機の設計が目指す理想です。')
        : v.thi < 0 ? T('The kick comes before the centre, while the balance is still accelerating towards it: the phase is pushed ahead and every cycle ends a little early, so the watch gains. At smaller amplitude the same angle is a larger fraction of the swing and the gain grows.', '一撃は中心より前、てんぷがまだ中心へ向かって加速している間に来ます。位相が前へ押され、各周期が少し早く終わるので時計は進みます。振り角が小さいと同じ角度が振動の大きな割合を占め、進みは大きくなります。')
          : T('The kick comes after the centre, while the balance is already slowing: the phase is held back and the watch loses, more so as the amplitude falls.', '一撃は中心より後、てんぷがすでに減速し始めてから来ます。位相が引き戻されて時計は遅れ、振り角が落ちるほど遅れは大きくなります。'));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const ph = (t * 1.2) % TAU, half = ph < Math.PI ? 0 : 1, u = ((ph - (half ? Math.PI : 0)) / Math.PI), r = rMax - (rMax - rMin) * u, a = phi + ph;
        dot.setAttribute('cx', f.X(r * Math.sin(a))); dot.setAttribute('cy', f.Y(r * Math.cos(a)));
        lab.textContent = T('the balance going round its limit cycle', 'リミットサイクルを回るてんぷ');
      }, { autoplay: true, initialT: 0 });
    },
  };

  /* ---------- 3. positional error ---------- */
  const POS_NAME = [['dial up', '文字盤上'], ['crown down', 'りゅうず下'], ['crown left', 'りゅうず左'], ['crown up', 'りゅうず上'], ['crown right', 'りゅうず右']];
  D['positional-error'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const mr = v.mr * 1e-12, alpha = v.alpha * DEG, A = v.amp * DEG, pos = v.pos;
      const rateIn = (p, a) => (p === 0 ? 0 : poiseRate(mr, alpha - POS_OFFSET[p] * DEG, a));
      const cur = rateIn(pos, A), vert = [1, 2, 3, 4].map((p) => rateIn(p, A)), spread = Math.max(...vert) - Math.min(...vert);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The balance seen from the dial side, with its heavy spot (gold, draggable) and the direction of gravity for the chosen position.', '文字盤側から見たてんぷと、その重い点（金色、ドラッグ可）、そして選んだ姿勢での重力の向きです。'));
      const f = L.fig(c1, { x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, maxH: 400 });
      const gAng = pos === 0 ? null : (-90 + POS_OFFSET[pos]) * DEG;
      if (gAng !== null) { f.arrow([1.3 * Math.cos(gAng + Math.PI) * 0.2, 1.3 * Math.sin(gAng + Math.PI) * 0.2], [1.35 * Math.cos(gAng), 1.35 * Math.sin(gAng)], { c: 'c4', w: 2, layer: 'under' }); f.text(1.2 * Math.cos(gAng), 1.2 * Math.sin(gAng), 'g', { math: true, c: 'c4', dx: 10, anchor: 'start' }); }
      else f.text(0, -1.42, T('dial up: gravity along the axis', '文字盤上：重力は軸に沿う'), { small: true, c: 'c4' });
      const wheel = f.group('main');
      const spotAng = (-90 + v.alpha) * DEG;
      const draw = (th) => { while (wheel.firstChild) wheel.removeChild(wheel.firstChild); wheel.appendChild(drawBalance(f, 0, 0, 1, th)); const a = spotAng + th; wheel.appendChild(f.dot(1.07 * Math.cos(a), 1.07 * Math.sin(a), { c: 'c2', r: 5.5, layer: 'main' })); };
      draw(0);
      f.handle(1.07 * Math.cos(spotAng), 1.07 * Math.sin(spotAng), { c: 'hl', r: 7, label: T('Heavy spot', '重い点'), onDrag: (x, y) => { let a = Math.atan2(y, x) / DEG + 90; a = ((Math.round(a / 5) * 5) % 360 + 360) % 360; ctx.set('alpha', a); } });
      L.h('p', 'lab-cap', c2, T('Rate error against amplitude in the four vertical positions. They all cross zero at 219.5°. Drag the gold point.', '四つの縦姿勢での、振り角に対する歩度の誤差です。すべて 219.5° で 0 を横切ります。金色の点をドラッグしてください。'));
      const ymax = Math.max(1, ...[1, 2, 3, 4].map((p) => Math.max(...L.seq(24, (i) => Math.abs(rateIn(p, (120 + i * 9) * DEG)))))) * 1.12;
      const g = L.fig(c2, { x: [120, 330], y: [-ymax, ymax], aspect: 0.72, xlabel: T('amplitude (degrees)', '振り角（度）'), ylabel: 's/day', maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' }); g.vline(J1_ZERO / DEG, { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' }); g.text(J1_ZERO / DEG, ymax * 0.92, '219.5°', { small: true, c: 'hl', anchor: 'start', dx: 5 });
      const cols = ['c1', 'c2', 'c3', 'c4'];
      [1, 2, 3, 4].forEach((p, i) => g.line(L.sample(120, 330, 160, (a) => rateIn(p, a * DEG)), { c: cols[i], w: p === pos ? 3 : 1.4, op: p === pos ? 1 : 0.7, layer: 'main' }));
      g.handle(v.amp, cur, { c: 'hl', r: 7, axis: 'x', snap: 5, label: T('Amplitude', '振り角'), bounds: [120, 330, -ymax, ymax], onDrag: (x) => ctx.set('amp', Math.round(x / 5) * 5) });
      L.legend(ctx.host, [1, 2, 3, 4].map((p, i) => ({ c: cols[i], label: T(...POS_NAME[p]) })).concat([{ c: 'hl', dash: true, label: T('J₁(A) = 0', 'J₁(A) = 0') }]));
      ctx.readout([
        { k: T('position', '姿勢'), v: T(...POS_NAME[pos]), tone: 'key' },
        { k: 'm·r, α', v: `${v.mr} µg·mm, ${v.alpha}°` },
        { k: 'J₁(A) / A', v: fmt(J1(A) / A, 4) },
        { k: T('rate in this position', 'この姿勢での歩度'), v: `${sgn(cur, 2)} s/day`, tone: Math.abs(cur) > 3 ? 'warn' : 'good' },
        { k: T('spread over vertical positions', '縦姿勢での開き'), v: `${fmt(spread, 2)} s/day` },
      ], pos === 0
        ? T('Flat on the table the unbalance pulls along the balance staff, not around it, so it adds no torque and no rate error. Turn the watch to a vertical position to see the error appear.', '台の上に平らに置くと、重心のずれは天真に沿って引き、それを回す向きには引かないので、トルクも歩度の誤差も生じません。縦姿勢にすると誤差が現れます。')
        : Math.abs(v.amp - J1_ZERO / DEG) < 6 ? T('Near 219.5° the gravity torque, averaged over one swing, is exactly out of phase with nothing: its in-phase component vanishes, and the unbalance leaves the rate unchanged in every position.', '219.5° の近くでは、一振動にわたって平均した重力のトルクの同位相成分が消え、重心のずれはどの姿勢でも歩度を変えません。')
          : T(`At ${v.amp}° the averaged gravity torque acts like ${cur > 0 ? 'an extra' : 'a negative'} spring, and the watch ${cur > 0 ? 'gains' : 'loses'} in this position. Above 219.5° the sign of every curve reverses: a heavy spot at the bottom makes the watch lose.`, `${v.amp}° では平均した重力のトルクが${cur > 0 ? '追加の' : '負の'}ばねのように働き、この姿勢で時計は${cur > 0 ? '進み' : '遅れ'}ます。219.5° を超えるとすべての曲線の符号が逆になり、重い点が下にあると時計は遅れます。`));
      const slow = 10, fr = 4;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { draw(A * Math.cos(TAU * fr * t / slow)); lab.textContent = T(`slow motion ×1/${slow}`, `スローモーション ×1/${slow}`); }, { autoplay: false, initialT: 0, playLabel: T('Swing the balance', 'てんぷを振らせる') });
    },
  };
})();
