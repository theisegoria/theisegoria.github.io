'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, DAY = 86400;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/quartz-resonators.cjs) ---------- */
  const E_Q = 78.7e9, RHO_Q = 2649, BETA1 = 1.8751040687, SIGMA1 = 0.7340955137;
  // first flexural frequency of a clamped-free beam of width t (bending direction) and length L, in metres
  const forkFreq = (L, t, E = E_Q, rho = RHO_Q) => BETA1 ** 2 / (TAU * L * L) * t * Math.sqrt(E / (12 * rho));
  const lengthFor = (f, t, E = E_Q, rho = RHO_Q) => Math.sqrt(BETA1 ** 2 / TAU * t * Math.sqrt(E / (12 * rho)) / f);
  // the first mode shape, normalised to 1 at the tip
  const modeRaw = (xi) => { const b = BETA1 * xi; return Math.cosh(b) - Math.cos(b) - SIGMA1 * (Math.sinh(b) - Math.sin(b)); };
  const modeShape = (xi) => modeRaw(xi) / modeRaw(1);
  const divide = (f, stages = 15) => f / 2 ** stages;
  const ppmToSecPerDay = (ppm) => ppm * 1e-6 * DAY;

  // Butterworth-Van Dyke: impedance magnitude and phase at frequency f (Hz)
  function bvdZ(f, R1, L1, C1, C0) {
    const w = TAU * f, zr = R1, zi = w * L1 - 1 / (w * C1), d = zr * zr + zi * zi;
    const yr = zr / d, yi = -zi / d + w * C0, e = yr * yr + yi * yi;           // Y = 1/Zm + j w C0
    return { re: yr / e, im: -yi / e, mag: 1 / Math.sqrt(e), phase: Math.atan2(-yi, yr) };
  }
  const motionalL = (fs, C1) => 1 / ((TAU * fs) ** 2 * C1);
  const qFactor = (fs, L1, R1) => TAU * fs * L1 / R1;
  const parallelOffset = (C1, C0) => Math.sqrt(1 + C1 / C0) - 1;          // (fp - fs) / fs
  const loadOffset = (C1, C0, CL) => C1 / (2 * (C0 + CL));                // (fL - fs) / fs, first order
  // exact operating point with a series load capacitor: the frequency where Im(Z + 1/(j w CL)) = 0 near fs, by bisection
  function loadFreqExact(fs, R1, L1, C1, C0, CL) {
    const g = (f) => { const z = bvdZ(f, R1, L1, C1, C0); return z.im - 1 / (TAU * f * CL); };
    let lo = fs * (1 + 1e-7), hi = fs * (1 + parallelOffset(C1, C0) * 0.999);
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  // temperature: parabolic offset (ppm), inhibition steps, daily average and accumulated error
  const BETA_T = 0.034, T0 = 25, CUT_FAST = 10, INHIBIT_STEP = 1e6 / (32768 * 60);
  const tempOffset = (T, beta = BETA_T, T0_ = T0) => -beta * (T - T0_) ** 2;
  const netOffset = (T, n, comp = false) => CUT_FAST - n * INHIBIT_STEP + (comp ? 0.05 : 1) * tempOffset(T);
  const dailyAverage = (Tw, Toff, hours, n, comp = false) => (hours * netOffset(Tw, n, comp) + (24 - hours) * netOffset(Toff, n, comp)) / 24;

  (window.LabModels = window.LabModels || {})['quartz-resonators'] = { E_Q, RHO_Q, BETA1, SIGMA1, forkFreq, lengthFor, modeShape, divide, ppmToSecPerDay, bvdZ, motionalL, qFactor, parallelOffset, loadOffset, loadFreqExact, BETA_T, T0, CUT_FAST, INHIBIT_STEP, tempOffset, netOffset, dailyAverage };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const sgn = (x, d = 2) => (x >= 0 ? '+' : '−') + fmt(Math.abs(x), d);
  const F0 = 32768;

  /* ---------- 1. the tuning fork ---------- */
  D['tuning-fork'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const Lm = v.L * 1e-3, tm = v.t * 1e-3, f = forkFreq(Lm, tm), ppm = (f / F0 - 1) * 1e6;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The fork seen from above, in the plane it vibrates in (to scale, in mm). The deflection is exaggerated thousands of times. Drag the gold tip to change the length.', '振動面の上から見た音叉です（mm 単位の実寸比）。たわみは数千倍に誇張しています。金色の先端をドラッグして長さを変えてください。'));
      const fg = L.fig(c1, { x: [-1.3, 1.3], y: [-0.9, 3.2], equal: true, xlabel: 'mm', maxH: 420, grid: false });
      const gap = 0.16, xc = gap / 2 + v.t / 2, base = 0;
      fg.rect(-(xc + v.t / 2 + 0.25), -0.7, 2 * (xc + v.t / 2 + 0.25), 0.7, { c: 'c3', fill: 'c3', fo: 0.3, w: 1.2, layer: 'under' });
      fg.text(0, -0.35, T('base, mounted', '根元（固定）'), { small: true, c: 'c3' });
      const G = fg.group('main');
      const draw = (amp) => {
        while (G.firstChild) G.removeChild(G.firstChild);
        [-1, 1].forEach((side) => {
          const cx = side * xc, pts = [];
          for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([cx - v.t / 2 + side * amp * modeShape(u), base + u * v.L]); }
          for (let i = 40; i >= 0; i--) { const u = i / 40; pts.push([cx + v.t / 2 + side * amp * modeShape(u), base + u * v.L]); }
          G.appendChild(fg.poly(pts, { c: 'c1', w: 1.4, fill: 'c1', fo: 0.22, layer: 'main' }));
          G.appendChild(fg.rect(cx - v.t / 2 + side * amp, v.L - 0.25, v.t, 0.25, { c: 'hl', fill: 'hl', fo: 0.55, w: 0.8, layer: 'main' }));
        });
      };
      draw(0);
      fg.handle(xc, v.L, { c: 'hl', r: 7, axis: 'y', label: T('Tine length', '歯の長さ'), bounds: [0, 1, 1.8, 3.0], onDrag: (x, y) => ctx.set('L', Math.round(y * 10000) / 10000) });
      fg.text(xc + v.t / 2 + 0.08, v.L / 2, `L = ${fmt(v.L, 3)} mm`, { small: true, c: 'c1', anchor: 'start' });
      fg.text(xc, v.L + 0.15, T('gold tip weights', '金のおもり'), { small: true, c: 'hl', dy: -4 });
      L.h('p', 'lab-cap', c2, T('The first bending frequency against tine length for this width. The dashed line is 32,768 Hz = 2¹⁵ Hz.', 'この幅での、歯の長さに対する一次の曲げ振動数です。破線が 32,768 Hz = 2¹⁵ Hz です。'));
      const g = L.fig(c2, { x: [1.8, 3.0], y: [10, 90], aspect: 0.75, xlabel: 'L (mm)', ylabel: 'f (kHz)', maxH: 420 });
      g.hline(32.768, { c: 'hl', w: 1.4, dash: '5 4', layer: 'under' });
      [0.1, 0.2, 0.3].forEach((tt) => g.line(L.sample(1.8, 3.0, 120, (x) => forkFreq(x * 1e-3, tt * 1e-3) / 1000), { c: 'muted', w: 1, op: 0.6, layer: 'under' }));
      g.line(L.sample(1.8, 3.0, 160, (x) => forkFreq(x * 1e-3, tm) / 1000), { c: 'c1', w: 2.4, layer: 'main' });
      const Lstar = lengthFor(F0, tm) * 1e3; if (Lstar >= 1.8 && Lstar <= 3) g.dot(Lstar, 32.768, { c: 'hl', r: 4, hollow: true, layer: 'over' });
      g.handle(v.L, f / 1000, { c: 'hl', r: 7, axis: 'x', label: T('Tine length', '歯の長さ'), bounds: [1.8, 3.0, 10, 90], onDrag: (x) => ctx.set('L', Math.round(x * 10000) / 10000) });
      L.legend(ctx.host, [{ c: 'c1', label: T(`t = ${fmt(v.t, 3)} mm`, `t = ${fmt(v.t, 3)} mm`) }, { c: 'muted', label: T('t = 0.10, 0.20, 0.30 mm', 't = 0.10、0.20、0.30 mm') }, { c: 'hl', dash: true, label: '2¹⁵ Hz' }]);
      const one = divide(f);
      ctx.readout([
        { k: 'f₁', v: `${fmt(f, 1)} Hz`, tone: 'key' },
        { k: T('length for 32,768 Hz', '32,768 Hz となる長さ'), v: `${fmt(Lstar, 4)} mm` },
        { k: T('after 15 halvings', '15 回の半分割りのあと'), v: `${fmt(one, 5)} Hz` },
        { k: T('offset from 2¹⁵', '2¹⁵ からのずれ'), v: `${sgn(ppm, 0)} ppm` },
        { k: T('watch rate', '時計の歩度'), v: Math.abs(ppm) < 1 ? T('on time', '正確') : `${sgn(ppmToSecPerDay(ppm), Math.abs(ppm) > 100 ? 0 : 2)} s/day`, tone: Math.abs(ppm) < 20 ? 'good' : 'warn' },
      ], Math.abs(ppm) < 20
        ? T('Tuned to 2¹⁵ Hz: fifteen divide-by-two stages turn it into exactly one pulse a second for the stepping motor. The final few ppm are removed by laser trimming and by the digital correction of the third experiment.', '2¹⁵ Hz に調律されています。十五段の二分周がそれをステップモーター用のちょうど毎秒一パルスにします。最後の数 ppm はレーザー調整と、三つ目の実験のデジタル補正で取り除かれます。')
        : T(`A frequency ${ppm > 0 ? 'above' : 'below'} 2¹⁵ Hz divides down to ${fmt(one, 4)} Hz, and the watch would ${ppm > 0 ? 'gain' : 'lose'} ${fmt(Math.abs(ppmToSecPerDay(ppm)), 0)} s a day. Because f ∝ 1/L², a fractional change in length costs twice as much in frequency.`, `2¹⁵ Hz より${ppm > 0 ? '高い' : '低い'}周波数は ${fmt(one, 4)} Hz に分周され、時計は一日に ${fmt(Math.abs(ppmToSecPerDay(ppm)), 0)} 秒${ppm > 0 ? '進み' : '遅れ'}ます。f ∝ 1/L² なので、長さの相対変化は周波数では二倍の損失になります。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { draw(0.09 * Math.sin(TAU * 1.2 * t)); lab.textContent = T(`slowed ${fmt(f / 1.2, 0)} times`, `${fmt(f / 1.2, 0)} 倍遅く表示`); }, { autoplay: true, initialT: 0 });
    },
  };

  /* ---------- 2. the BVD circuit ---------- */
  const C1 = 2.0e-15, CL_DESIGN = 12.5e-12;
  D['bvd-circuit'] = {
    render(ctx, v) {
      const R1 = v.R1 * 1e3, C0 = v.C0 * 1e-12, CL = v.CL * 1e-12;
      // the crystal is cut so that it runs at exactly 32768 Hz with the design load: fs sits below by the load offset
      const fs = F0 / (1 + loadOffset(C1, C0, CL_DESIGN)), L1 = motionalL(fs, C1), Q = qFactor(fs, L1, R1);
      const pP = parallelOffset(C1, C0) * 1e6, pL = loadOffset(C1, C0, CL) * 1e6, pLd = loadOffset(C1, C0, CL_DESIGN) * 1e6, rate = ppmToSecPerDay(pL - pLd);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The Butterworth–Van Dyke equivalent circuit, with the oscillator’s load capacitance C_L in series.', 'バターワース・ヴァン・ダイクの等価回路と、直列に入る発振器の負荷容量 C_L です。'));
      const s = L.stage(c1, { w: 100, h: 56, maxH: 260 });
      const wire = (a, b, c = 'ink') => s.seg(a, b, { c, w: 1.6 });
      const cap = (x, y, vert, c = 'ink', label) => { if (vert) { s.seg([x - 4, y + 1], [x + 4, y + 1], { c, w: 2.4 }); s.seg([x - 4, y - 1], [x + 4, y - 1], { c, w: 2.4 }); } else { s.seg([x - 1, y - 4], [x - 1, y + 4], { c, w: 2.4 }); s.seg([x + 1, y - 4], [x + 1, y + 4], { c, w: 2.4 }); } if (label) s.text(x, y + (vert ? 0 : -6), label, { small: true, c, anchor: vert ? 'start' : 'middle', dx: vert ? 14 : 0 }); };
      const res = (x0, x1, y, c, label) => { const n = 6, pts = [[x0, y]]; for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * (i + 0.5) / n, y + (i % 2 ? -2.2 : 2.2)]); pts.push([x1, y]); s.line(pts, { c, w: 1.6 }); s.text((x0 + x1) / 2, y - 6, label, { small: true, c }); };
      const coil = (x0, x1, y, c, label) => { const n = 4, r = (x1 - x0) / (2 * n); for (let i = 0; i < n; i++) s.line(L.sample(0, Math.PI, 16, (a) => [x0 + r + 2 * r * i - r * Math.cos(a), y + r * Math.sin(a)]), { c, w: 1.6 }); s.text((x0 + x1) / 2, y - 6, label, { small: true, c }); };
      // motional arm on top, C0 below, CL on the left lead
      wire([6, 28], [14, 28]); cap(16, 28, false, 'c4', 'C_L'); wire([18, 28], [26, 28]);
      wire([26, 12], [26, 44]); wire([90, 12], [90, 44]); wire([90, 28], [96, 28]);
      wire([26, 44], [34, 44]); res(34, 48, 44, 'c2', 'R₁'); wire([48, 44], [52, 44]); coil(52, 68, 44, 'c1', 'L₁'); wire([68, 44], [74, 44]); cap(76, 44, false, 'c3', 'C₁'); wire([78, 44], [90, 44]);
      wire([26, 12], [57, 12]); cap(58, 12, false, 'muted', 'C₀'); wire([60, 12], [90, 12]);
      s.rect(30, 36, 52, 16, { c: 'hl', w: 1, dash: '3 3', layer: 'under' }); s.text(56, 54, T('motional arm: the vibrating fork', '動的アーム：振動する音叉'), { small: true, c: 'hl' });
      s.text(58, 4, T('electrode capacitance', '電極の静電容量'), { small: true, c: 'muted' });
      L.h('p', 'lab-cap', c1, T('Rate change against load capacitance, for a crystal cut to run exactly at 12.5 pF.', '12.5 pF でちょうど正しく動くように切った水晶の、負荷容量に対する歩度の変化です。'));
      const rr = (x) => ppmToSecPerDay((loadOffset(C1, C0, x * 1e-12) - loadOffset(C1, C0, CL_DESIGN)) * 1e6);
      const gr = L.fig(c1, { x: [6, 20], y: [-3, 7], aspect: 0.55, xlabel: 'C_L (pF)', ylabel: 's/day', maxH: 240 });
      gr.hline(0, { c: 'muted', w: 1, layer: 'under' }); gr.vline(12.5, { c: 'muted', w: 1, dash: '3 3', layer: 'under' });
      gr.line(L.sample(6, 20, 120, rr), { c: 'c4', w: 2.2, layer: 'main' });
      gr.handle(v.CL, rate, { c: 'hl', r: 7, axis: 'x', snap: 0.1, label: T('Load capacitance', '負荷容量'), bounds: [6, 20, -3, 7], onDrag: (x) => ctx.set('CL', Math.round(x * 10) / 10) });
      // right: impedance magnitude and phase against ppm offset from fs
      L.h('p', 'lab-cap', c2, T('|Z| (log scale) and phase against frequency, in ppm above the series resonance fₛ.', '周波数に対する |Z|（対数目盛）と位相で、横軸は直列共振 fₛ からの ppm です。'));
      const X0 = -150, X1 = Math.max(1000, pP * 1.25), N = 2400, fAt = (p) => fs * (1 + p * 1e-6);
      const samples = L.seq(N + 1, (i) => { const p = X0 + (X1 - X0) * i / N; return [p, bvdZ(fAt(p), R1, L1, C1, C0)]; });
      const mags = samples.map(([, z]) => Math.log10(z.mag)), ymin = Math.floor(Math.min(...mags) - 0.3), ymax = Math.ceil(Math.max(...mags) + 0.3);
      const g = L.fig(c2, { x: [X0, X1], y: [ymin, ymax], aspect: 0.6, xlabel: T('ppm above fₛ', 'fₛ からの ppm'), ylabel: 'log₁₀ |Z| (Ω)', maxH: 300 });
      g.line(samples.map(([p], i) => [p, mags[i]]), { c: 'c1', w: 2, layer: 'main' });
      const mark = (p, c, label, dy) => { g.vline(p, { c, w: 1.2, dash: '4 3', layer: 'under' }); g.text(p, ymax, label, { small: true, c, dx: 4, dy: dy, anchor: 'start' }); };
      mark(0, 'c2', 'fₛ', 14); mark(pP, 'c3', 'fₚ', 14); mark(pL, 'hl', 'f_L', 30);
      const h = L.fig(c2, { x: [X0, X1], y: [-100, 100], aspect: 0.4, xlabel: T('ppm above fₛ', 'fₛ からの ppm'), ylabel: T('phase (°)', '位相（°）'), maxH: 200, ticksY: [[-90, '−90'], [0, '0'], [90, '90']] });
      h.line(samples.map(([p, z]) => [p, z.phase * 180 / Math.PI]), { c: 'c4', w: 2, layer: 'main' });
      h.vline(0, { c: 'c2', w: 1, dash: '4 3', layer: 'under' }); h.vline(pP, { c: 'c3', w: 1, dash: '4 3', layer: 'under' }); h.vline(pL, { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' });
      g.handle(pL, (ymin + ymax) / 2, { c: 'hl', r: 7, axis: 'x', label: T('Operating point', '動作点'), bounds: [loadOffset(C1, C0, 20e-12) * 1e6, loadOffset(C1, C0, 6e-12) * 1e6, ymin, ymax], onDrag: (x) => ctx.set('CL', Math.round((C1 / (2 * x * 1e-6) - C0) * 1e13) / 10) });
      L.legend(ctx.host, [{ c: 'c1', label: '|Z|' }, { c: 'c4', label: T('phase, and rate against C_L', '位相、および C_L に対する歩度') }, { c: 'c2', dash: true, label: T('series resonance', '直列共振') }, { c: 'c3', dash: true, label: T('parallel resonance', '並列共振') }, { c: 'hl', kind: 'dot', label: T('operating point with C_L', 'C_L での動作点') }]);
      ctx.readout([
        { k: 'L₁', v: `${fmt(L1 / 1000, 2)} kH`, tone: 'key' },
        { k: 'Q', v: fmt(Q, 0) },
        { k: T('bandwidth fₛ/Q', '帯域幅 fₛ/Q'), v: `${fmt(fs / Q, 3)} Hz = ${fmt(1e6 / Q, 1)} ppm` },
        { k: 'fₚ − fₛ', v: `${fmt(pP, 0)} ppm` },
        { k: 'f_L − fₛ', v: `${fmt(pL, 1)} ppm` },
        { k: T('rate vs. 12.5 pF', '12.5 pF に対する歩度'), v: `${sgn(rate, 2)} s/day`, tone: Math.abs(rate) < 0.1 ? 'good' : 'warn' },
      ], Math.abs(v.CL - 12.5) < 0.05
        ? T(`At the design load the oscillator runs ${fmt(pL, 1)} ppm above fₛ, exactly 32,768 Hz. Between fₛ and fₚ the crystal is inductive, and the load capacitor resonates with that inductance.`, `設計の負荷では発振器は fₛ より ${fmt(pL, 1)} ppm 高い、ちょうど 32,768 Hz で動きます。fₛ と fₚ の間で水晶は誘導性で、負荷容量はそのインダクタンスと共振します。`)
        : T(`${v.CL > 12.5 ? 'More' : 'Less'} load capacitance pulls the frequency ${v.CL > 12.5 ? 'down towards fₛ' : 'up towards fₚ'}: ${sgn(pL - pLd, 2)} ppm, ${sgn(rate, 2)} s a day. The pull is steepest at small C_L, which is why trimmers were small capacitors.`, `負荷容量を${v.CL > 12.5 ? '増やす' : '減らす'}と周波数は${v.CL > 12.5 ? '下がって fₛ に近づき' : '上がって fₚ に近づき'}ます。${sgn(pL - pLd, 2)} ppm、一日に ${sgn(rate, 2)} 秒です。引き込みは C_L が小さいほど急なので、トリマーは小さなコンデンサーでした。`));
    },
  };

  /* ---------- 3. temperature ---------- */
  D['quartz-temperature'] = {
    render(ctx, v) {
      const comp = v.tc === 1, avg = dailyAverage(v.Twrist, v.Toff, v.hours, v.n, comp), avgOther = dailyAverage(v.Twrist, v.Toff, v.hours, v.n, !comp);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Frequency offset against temperature, including the fast cut and the inhibition trim. Dots: on the wrist (gold) and off it (violet). Drag them.', '速めの切断とインヒビションの調整を含めた、温度に対する周波数のずれです。点は腕の上（金）と外している間（紫）で、ドラッグできます。'));
      const f = L.fig(c1, { x: [0, 40], y: [-20, 6], aspect: 0.75, xlabel: T('temperature (°C)', '温度（°C）'), ylabel: 'ppm', maxH: 400 });
      f.hline(0, { c: 'muted', w: 1, layer: 'under' }); f.vline(T0, { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); f.text(T0, 5.5, T('turnover 25 °C', '頂点 25 °C'), { small: true, c: 'muted', anchor: 'start', dx: 4 });
      f.line(L.sample(0, 40, 160, (x) => netOffset(x, v.n, !comp)), { c: comp ? 'muted' : 'c3', w: 1.4, dash: '5 3', op: 0.8, layer: 'main' });
      f.line(L.sample(0, 40, 160, (x) => netOffset(x, v.n, comp)), { c: 'c1', w: 2.6, layer: 'main' });
      f.hline(avg, { c: 'c2', w: 1.4, dash: '6 3', layer: 'under' }); f.text(1, avg, T(`daily average ${sgn(avg, 2)} ppm`, `一日の平均 ${sgn(avg, 2)} ppm`), { small: true, c: 'c2', anchor: 'start', dy: -6 });
      f.handle(v.Twrist, netOffset(v.Twrist, v.n, comp), { c: 'hl', r: 7, axis: 'x', snap: 0.5, label: T('Wrist temperature', '腕の温度'), bounds: [20, 37, -20, 6], onDrag: (x) => ctx.set('Twrist', Math.round(x * 2) / 2) });
      f.handle(v.Toff, netOffset(v.Toff, v.n, comp), { c: 'c4', r: 7, axis: 'x', snap: 0.5, label: T('Off-wrist temperature', '外している間の温度'), bounds: [0, 35, -20, 6], onDrag: (x) => ctx.set('Toff', Math.round(x * 2) / 2) });
      L.h('p', 'lab-cap', c2, T('Accumulated error over 30 days for this routine: this movement, and the other type for comparison.', 'この生活パターンでの 30 日間の累積誤差です。このムーブメントと、比較のためのもう一方の種類を示します。'));
      const days = 30, hrs = v.hours, run = (comp_) => { const pts = [[0, 0]]; let e = 0; for (let d = 0; d < days; d++) { e += ppmToSecPerDay(netOffset(v.Twrist, v.n, comp_)) * hrs / 24; pts.push([d + hrs / 24, e]); e += ppmToSecPerDay(netOffset(v.Toff, v.n, comp_)) * (24 - hrs) / 24; pts.push([d + 1, e]); } return pts; };
      const A = run(comp), B = run(!comp), lim = Math.max(2, ...A.concat(B).map((p) => Math.abs(p[1]))) * 1.15;
      const g = L.fig(c2, { x: [0, 30], y: [-lim, lim], aspect: 0.75, xlabel: T('days', '日'), ylabel: T('error (s)', '誤差（秒）'), maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      g.line(B, { c: comp ? 'c3' : 'muted', w: 1.4, dash: '5 3', layer: 'main' }); g.line(A, { c: 'c1', w: 2.6, layer: 'main' });
      g.dot(30, A[A.length - 1][1], { c: 'c1', r: 5, layer: 'over' }); g.text(30, A[A.length - 1][1], `${sgn(A[A.length - 1][1], 1)} s`, { c: 'c1', dx: -8, dy: -10, anchor: 'end', layer: 'over' });
      L.legend(ctx.host, [{ c: 'c1', label: T(comp ? 'thermocompensated (this movement)' : 'ordinary quartz (this movement)', comp ? '温度補償型（このムーブメント）' : '普通のクォーツ（このムーブメント）') }, { c: comp ? 'muted' : 'c3', dash: true, label: T(comp ? 'ordinary quartz' : 'thermocompensated', comp ? '普通のクォーツ' : '温度補償型') }, { c: 'c2', dash: true, label: T('daily average offset', '一日の平均のずれ') }]);
      const at25 = CUT_FAST - v.n * INHIBIT_STEP;
      ctx.readout([
        { k: T('offset at 25 °C after trim', '調整後の 25 °C でのずれ'), v: `${sgn(at25, 2)} ppm`, tone: 'key' },
        { k: T('on the wrist, off it', '腕の上、外している間'), v: `${sgn(netOffset(v.Twrist, v.n, comp), 2)}, ${sgn(netOffset(v.Toff, v.n, comp), 2)} ppm` },
        { k: T('daily average', '一日の平均'), v: `${sgn(avg, 2)} ppm = ${sgn(ppmToSecPerDay(avg), 3)} s/day`, tone: 'good' },
        { k: T('per month, per year', '月あたり、年あたり'), v: `${sgn(ppmToSecPerDay(avg) * 30, 1)} s, ${sgn(ppmToSecPerDay(avg) * 365, 0)} s` },
        { k: T('the other type', 'もう一方の種類'), v: `${sgn(ppmToSecPerDay(avgOther) * 30, 1)} s/month` },
      ], comp
        ? T('The thermocompensated movement measures its temperature and removes most of the parabola, so what remains is mainly the inhibition trim, set in steps of 0.509 ppm: seconds per year rather than per month.', '温度補償型のムーブメントは自分の温度を測って放物線の大部分を取り除くので、残るのは主に 0.509 ppm 刻みのインヒビションの調整です。月ではなく年に数秒の単位です。')
        : T(`The parabola always subtracts, so the temperature swing between ${v.Twrist} °C and ${v.Toff} °C costs a steady loss; the trim can offset the average but not the daily wobble. Choosing one pulse fewer per minute moves the whole curve up by 0.509 ppm.`, `放物線は常に引き算なので、${v.Twrist} °C と ${v.Toff} °C の間の温度の揺れは一定の遅れになります。調整は平均を打ち消せますが、毎日の揺れは打ち消せません。毎分のパルスを一つ減らすと曲線全体が 0.509 ppm 上がります。`));
    },
  };
})();
