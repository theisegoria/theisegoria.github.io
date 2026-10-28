'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, RHO = 1.18, C_AIR = 343;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // small complex helpers on [re, im]
  const cx = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, abs: (a) => Math.hypot(a[0], a[1]), arg: (a) => Math.atan2(a[1], a[0]) };

  /* ---------- model (pure, checked by checks/loudspeakers.cjs); SI units ---------- */
  // T = { Re, Le, Bl, Mms, Cms, Rms, Sd }
  const mechZ = (T, w) => [T.Rms, w * T.Mms - 1 / (w * T.Cms)];
  const elecZ = (T, f) => { const w = TAU * f, zm = mechZ(T, w); return cx.add([T.Re, w * T.Le], cx.div([T.Bl * T.Bl, 0], zm)); };
  // cone velocity and displacement for a drive voltage V
  const coneVel = (T, f, V = 2.83) => { const w = TAU * f, zm = mechZ(T, w); return cx.div([T.Bl * V, 0], cx.add(cx.mul([T.Re, w * T.Le], zm), [T.Bl * T.Bl, 0])); };
  const coneDisp = (T, f, V = 2.83) => cx.div(coneVel(T, f, V), [0, TAU * f]);
  function ts(T) {
    const fs = 1 / (TAU * Math.sqrt(T.Mms * T.Cms)), Qms = TAU * fs * T.Mms / T.Rms, Qes = TAU * fs * T.Mms * T.Re / (T.Bl * T.Bl);
    return { fs, Qms, Qes, Qts: Qms * Qes / (Qms + Qes), Vas: RHO * C_AIR ** 2 * T.Sd ** 2 * T.Cms, eta0: RHO * T.Bl ** 2 * T.Sd ** 2 / (TAU * C_AIR * T.Re * T.Mms ** 2), Zmax: T.Re + T.Bl ** 2 / T.Rms };
  }
  const DEFAULT = { Re: 6, Le: 0.5e-3, Bl: 7.5, Mms: 0.015, Cms: 1.0e-3, Rms: 1.0, Sd: 0.0133 };

  // box responses: returns complex G (pressure, normalised to passband) and X (excursion relative to free-air static displacement)
  function sealedBox(fs, Qts, Vas, Vb, f) {
    const al = Vas / Vb, fc = fs * Math.sqrt(1 + al), Q = Qts * Math.sqrt(1 + al), s = [0, f / fc], s2 = cx.mul(s, s), den = [s2[0] + 1, s2[1] + s[1] / Q];
    return { G: cx.div(s2, den), X: cx.div([1 / (1 + al), 0], den), fc, Q, al };
  }
  function ventedBox(fs, Qts, Vas, Vb, fb, f, Ql = 7) {
    const al = Vas / Vb, h = fb / fs, Qt = Qts, T0 = 1 / (TAU * Math.sqrt(fs * fb)), Tb = 1 / (TAU * fb);
    const a1 = (Ql + h * Qt) / (Math.sqrt(h) * Ql * Qt), a2 = (h + (al + 1 + h * h) * Ql * Qt) / (h * Ql * Qt), a3 = (h * Ql + Qt) / (Math.sqrt(h) * Ql * Qt);
    const w = TAU * f, s1 = [0, w * T0], s2 = cx.mul(s1, s1), s3 = cx.mul(s2, s1), s4 = cx.mul(s3, s1);
    const Dn = [s4[0] + a1 * s3[0] + a2 * s2[0] + a3 * s1[0] + 1, s4[1] + a1 * s3[1] + a2 * s2[1] + a3 * s1[1]];
    const sb = [0, w * Tb], num = [1 - (w * Tb) ** 2, sb[1] / Ql];
    return { G: cx.div(s4, Dn), X: cx.div(num, Dn), al, h, coeffs: [a1, a2, a3] };
  }
  const dB = (z) => 20 * Math.log10(Math.max(1e-12, cx.abs(z)));
  function f3(fn) { let lo = 5, hi = 1000; for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (fn(m) < -3) lo = m; else hi = m; } return lo; }

  // piston directivity
  function J1(x) { if (Math.abs(x) > 25) { const t = x - 3 * Math.PI / 4; return Math.sqrt(2 / (Math.PI * x)) * Math.cos(t); } let s = 0, t = x / 2; for (let k = 0; k < 90; k++) { s += t; t *= -(x * x / 4) / ((k + 1) * (k + 2)); } return s; }
  const piston = (ka, th) => { const x = ka * Math.sin(th); return Math.abs(x) < 1e-9 ? 1 : 2 * J1(x) / x; };
  const directivityIndex = (ka) => 10 * Math.log10((ka * ka) / (1 - J1(2 * ka) / ka));
  // -6 dB half-angle (degrees), or 90 if the level never falls 6 dB in the front half-space
  function halfAngle6dB(ka) { if (ka * 1 < 2.215) return 90; const x = 2.215 / ka; return Math.asin(Math.min(1, x)) * 180 / Math.PI; }

  (window.LabModels = window.LabModels || {})['loudspeakers'] = { cx, elecZ, coneVel, coneDisp, ts, DEFAULT, sealedBox, ventedBox, dB, f3, J1, piston, directivityIndex, halfAngle6dB, RHO, C_AIR };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const LOGT = [[1, '10'], [1.301, '20'], [1.699, '50'], [2, '100'], [2.301, '200'], [2.699, '500'], [3, '1k'], [3.301, '2k'], [3.699, '5k'], [4, '10k'], [4.301, '20k']];
  const hz = (f) => (f >= 1000 ? fmt(f / 1000, f >= 10000 ? 1 : 2) + ' kHz' : fmt(f, f < 100 ? 1 : 0) + ' Hz');

  // a driver cross-section, facing right, cone displaced by dx (in stage units)
  function drawDriver(s, dx, o = {}) {
    const G = s.group('main'), add = (e) => { G.appendChild(e); return e; };
    const y0 = 35, cx0 = 22;
    add(s.rect(4, y0 - 18, 12, 36, { c: 'muted', fill: 'muted', fo: 0.35, w: 1 })); // magnet
    add(s.rect(4, y0 - 20, 20, 3, { c: 'muted', fill: 'muted', fo: 0.55, w: 1 })); add(s.rect(4, y0 + 17, 20, 3, { c: 'muted', fill: 'muted', fo: 0.55, w: 1 })); // plates
    add(s.rect(16, y0 - 4, 10, 8, { c: 'muted', fill: 'muted', fo: 0.55, w: 1 })); // pole
    // voice coil former and coil
    add(s.rect(cx0 + dx, y0 - 6, 10, 12, { c: 'c2', w: 1.4 })); add(s.rect(cx0 + dx + 1, y0 - 6.8, 5, 13.6, { c: 'c2', fill: 'c2', fo: 0.5, w: 0.8 }));
    // cone: from the former to the surround
    const tip = [cx0 + 10 + dx, y0], outerT = [70 + dx * 0.95, y0 + 27], outerB = [70 + dx * 0.95, y0 - 27];
    add(s.line([[tip[0], y0 + 6], outerT], { c: 'c1', w: 2.4 })); add(s.line([[tip[0], y0 - 6], outerB], { c: 'c1', w: 2.4 }));
    add(s.line(L.sample(0, Math.PI, 16, (a) => [tip[0] + 5 * Math.sin(a), y0 + 6 * Math.cos(a)]), { c: 'c1', w: 1.6 })); // dust cap
    // surround (half-roll) to the fixed frame, and the spider
    add(s.line(L.sample(0, Math.PI, 12, (a) => [outerT[0] + 2.5 - 2.5 * Math.cos(a) + (1 - (1 - Math.cos(a)) / 2) * 0, outerT[1] + 2.5 * Math.sin(a)]), { c: 'c3', w: 1.6 }));
    add(s.line(L.sample(0, Math.PI, 12, (a) => [outerB[0] + 2.5 - 2.5 * Math.cos(a), outerB[1] - 2.5 * Math.sin(a)]), { c: 'c3', w: 1.6 }));
    add(s.line([[cx0 + 6 + dx, y0 + 7], [cx0 + 10 + dx * 0.5, y0 + 10], [cx0 + 14 + dx * 0.2, y0 + 13], [cx0 + 18, y0 + 16]], { c: 'c3', w: 1.2, dash: '2 2' }));
    add(s.line([[cx0 + 6 + dx, y0 - 7], [cx0 + 10 + dx * 0.5, y0 - 10], [cx0 + 14 + dx * 0.2, y0 - 13], [cx0 + 18, y0 - 16]], { c: 'c3', w: 1.2, dash: '2 2' }));
    add(s.line([[26, y0 + 17], [75, y0 + 30]], { c: 'muted', w: 1, op: 0.6 })); add(s.line([[26, y0 - 17], [75, y0 - 30]], { c: 'muted', w: 1, op: 0.6 })); // basket
    if (o.labels) { add(s.text(10, y0, T('magnet', '磁石'), { small: true, c: 'muted' })); add(s.text(cx0 + 5, y0 - 12, T('coil', 'コイル'), { small: true, c: 'c2' })); add(s.text(52, y0 + 22, T('cone', 'コーン'), { small: true, c: 'c1' })); add(s.text(78, y0 + 30, T('surround', 'エッジ'), { small: true, c: 'c3', anchor: 'start' })); }
    return G;
  }

  /* ---------- 1. driver impedance ---------- */
  D['driver-impedance'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const P = { Re: 6, Le: v.Le * 1e-3, Bl: v.Bl, Mms: v.Mms * 1e-3, Cms: v.Cms * 1e-3, Rms: v.Rms, Sd: 0.0133 }, S = ts(P), fsel = Math.pow(10, v.fsel);
      const Zs = elecZ(P, fsel), Xs = coneDisp(P, fsel);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`A section through the driver, playing ${hz(fsel)} at 2.83 V. Cone motion is exaggerated, in proportion to the true excursion.`, `${hz(fsel)} を 2.83 V で鳴らすドライバーの断面です。コーンの動きは実際の振幅に比例させて誇張しています。`));
      const s = L.stage(c1, { w: 100, h: 70, maxH: 260 });
      const xs = L.seq(200, (i) => { const f = Math.pow(10, 1 + i * 3.3 / 199); return cx.abs(coneDisp(P, f)); }), Xmax = Math.max(...xs);
      const amp = 8 * cx.abs(Xs) / Xmax;
      let G = drawDriver(s, 0, { labels: true });
      L.h('p', 'lab-cap', c1, T('Cone excursion at 2.83 V (peak, mm).', '2.83 V でのコーンの振幅（ピーク、mm）です。'));
      const ge = L.fig(c1, { x: [1, 4.3], y: [0, Xmax * 1e3 * 1.15], aspect: 0.45, xlabel: 'f (Hz)', ylabel: 'mm', maxH: 200, ticksX: LOGT.filter((t, i) => i % 2 === 0 || t[0] === 3) });
      ge.line(xs.map((x, i) => [1 + i * 3.3 / 199, x * 1e3]), { c: 'c1', w: 2, layer: 'main' });
      ge.dot(v.fsel, cx.abs(Xs) * 1e3, { c: 'hl', r: 5, layer: 'over' });
      L.h('p', 'lab-cap', c2, T('Impedance magnitude and phase. The peak marks fₛ; drag the gold point to choose the frequency.', 'インピーダンスの大きさと位相です。ピークが fₛ を示します。金色の点をドラッグして周波数を選んでください。'));
      const zs = L.seq(400, (i) => { const lf = 1 + i * 3.3 / 399; return [lf, elecZ(P, Math.pow(10, lf))]; }), zmax = Math.max(...zs.map(([, z]) => cx.abs(z)));
      const g = L.fig(c2, { x: [1, 4.3], y: [0, zmax * 1.12], aspect: 0.62, xlabel: 'f (Hz)', ylabel: '|Z| (Ω)', maxH: 300, ticksX: LOGT });
      g.hline(P.Re, { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); g.text(4.25, P.Re, 'Rₑ', { small: true, c: 'muted', anchor: 'end', dy: -5 });
      g.vline(Math.log10(S.fs), { c: 'c2', w: 1.2, dash: '4 3', layer: 'under' }); g.text(Math.log10(S.fs), zmax * 1.05, `fₛ = ${fmt(S.fs, 1)} Hz`, { small: true, c: 'c2', anchor: 'start', dx: 5 });
      g.line(zs.map(([x, z]) => [x, cx.abs(z)]), { c: 'c1', w: 2.4, layer: 'main' });
      g.handle(v.fsel, cx.abs(Zs), { c: 'hl', r: 7, axis: 'x', label: T('Frequency', '周波数'), bounds: [1, 4.3, 0, zmax * 1.12], onDrag: (x) => ctx.set('fsel', Math.round(x * 100) / 100) });
      const h = L.fig(c2, { x: [1, 4.3], y: [-90, 90], aspect: 0.3, xlabel: 'f (Hz)', ylabel: T('phase (°)', '位相（°）'), maxH: 150, ticksX: LOGT, ticksY: [[-90, '−90'], [0, '0'], [90, '90']] });
      h.hline(0, { c: 'muted', w: 1, layer: 'under' }); h.line(zs.map(([x, z]) => [x, cx.arg(z) * 180 / Math.PI]), { c: 'c4', w: 1.8, layer: 'main' });
      L.legend(ctx.host, [{ c: 'c1', label: T('|Z| and cone excursion', '|Z| とコーンの振幅') }, { c: 'c4', label: T('phase of Z', 'Z の位相') }, { c: 'c2', dash: true, label: T('free-air resonance fₛ', '自由空間での共振 fₛ') }]);
      ctx.readout([
        { k: 'fₛ', v: `${fmt(S.fs, 1)} Hz`, tone: 'key' },
        { k: 'Qₘₛ, Qₑₛ, Qₜₛ', v: `${fmt(S.Qms, 2)}, ${fmt(S.Qes, 3)}, ${fmt(S.Qts, 3)}` },
        { k: 'V_as', v: `${fmt(S.Vas * 1000, 1)} L` },
        { k: T('|Z| peak', '|Z| のピーク'), v: `${fmt(S.Zmax, 1)} Ω` },
        { k: T('efficiency, sensitivity', '効率、感度'), v: `${fmt(S.eta0 * 100, 2)} %, ${fmt(112.1 + 10 * Math.log10(S.eta0), 1)} dB/1 W/1 m` },
        { k: T(`at ${hz(fsel)}`, `${hz(fsel)} で`), v: `|Z| = ${fmt(cx.abs(Zs), 1)} Ω, x = ${fmt(cx.abs(Xs) * 1e3, 3)} mm` },
      ], S.Qts > 0.7
        ? T(`With Qₜₛ = ${fmt(S.Qts, 2)} the electrical damping is weak: a weak motor (low Bl) or a heavy cone lets the resonance ring. Such drivers suit large sealed boxes or open baffles.`, `Qₜₛ = ${fmt(S.Qts, 2)} では電気的な制動が弱く、弱い磁気回路（小さい Bl）や重いコーンが共振を響かせます。このようなドライバーは大きな密閉箱や平面バッフルに向きます。`)
        : T(`Below fₛ the suspension controls the cone and the excursion is flat; above it the mass does, and the excursion falls as 1/f², which keeps the radiated pressure (proportional to cone acceleration) roughly flat. Qₑₛ = ${fmt(S.Qes, 2)} is set by (Bl)²: a stronger motor damps the resonance through the amplifier.`, `fₛ より下ではサスペンションがコーンを支配して振幅は平らです。上では質量が支配し、振幅は 1/f² で下がります。そのため放射される音圧（コーンの加速度に比例）はほぼ平らに保たれます。Qₑₛ = ${fmt(S.Qes, 2)} は (Bl)² で決まり、強い磁気回路はアンプを通して共振を制動します。`));
      const fv = 1.4;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { G.remove(); G = drawDriver(s, amp * Math.sin(TAU * fv * t), { labels: true }); lab.textContent = T(`slowed to ${fv} Hz`, `${fv} Hz に遅くして表示`); }, { autoplay: true, initialT: 0 });
    },
  };

  /* ---------- 2. box alignment ---------- */
  const DRV = ts(DEFAULT);
  D['box-alignment'] = {
    render(ctx, v) {
      const vented = v.type === 1, Vb = v.Vb / 1000, fb = v.fb;
      const resp = (f, typ) => (typ ? ventedBox(DRV.fs, DRV.Qts, DRV.Vas, Vb, fb, f) : sealedBox(DRV.fs, DRV.Qts, DRV.Vas, Vb, f));
      const F3 = f3((f) => dB(resp(f, vented).G)), F3o = f3((f) => dB(resp(f, !vented).G));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The box to scale (${fmt(v.Vb, 1)} L, a cube), with the woofer${vented ? ' and the port' : ''}. Drag the gold corner to resize it.`, `実寸比の箱（${fmt(v.Vb, 1)} L の立方体）と、ウーファー${vented ? 'およびポート' : ''}です。金色の角をドラッグして大きさを変えてください。`));
      const side = Math.cbrt(v.Vb) * 10; // cm
      const s = L.fig(c1, { x: [-5, 50], y: [-5, 50], equal: true, axes: false, maxH: 260 });
      s.rect(0, 0, side, side, { c: 'ink', fill: 'c4', fo: 0.08, w: 2, layer: 'under' });
      s.rect(side * 0.18, side * 0.18, side * 0.18, side * 0.18, { c: 'ink', fill: 'c4', fo: 0.04, w: 0.8, dash: '3 3', layer: 'under' });
      s.circle(side / 2, side * 0.62, 8.2, { c: 'c1', w: 2, fill: 'c1', fo: 0.15, layer: 'main' }); s.circle(side / 2, side * 0.62, 3, { c: 'c1', w: 1.2, layer: 'main' });
      if (vented) { s.circle(side / 2, side * 0.2, 2.6, { c: 'c3', w: 2, fill: 'c3', fo: 0.3, layer: 'main' }); s.text(side / 2 + 4, side * 0.2, T(`port, f_b = ${fmt(fb, 1)} Hz`, `ポート、f_b = ${fmt(fb, 1)} Hz`), { small: true, c: 'c3', anchor: 'start' }); }
      s.text(side / 2, -2.5, `${fmt(side, 1)} cm`, { small: true, c: 'muted' });
      s.handle(side, side, { c: 'hl', r: 7, label: T('Box size', '箱の大きさ'), bounds: [15.9, 43.1, 15.9, 43.1], onDrag: (x, y) => { const sd = Math.max(x, y); ctx.set('Vb', clamp(Math.round((sd / 10) ** 3 * 2) / 2, 4, 80)); } });
      L.h('p', 'lab-cap', c1, T('Cone excursion relative to the free-air static displacement. The vented cone nearly stops at f_b.', '自由空間での静的変位に対するコーンの振幅です。バスレフのコーンは f_b でほとんど止まります。'));
      const gx = L.fig(c1, { x: [1, 3], y: [0, 1.4], aspect: 0.5, xlabel: 'f (Hz)', ylabel: T('excursion', '振幅'), maxH: 220, ticksX: LOGT.filter((t) => t[0] <= 3) });
      const curve = (typ, key) => L.sample(1, 3, 240, (lf) => { const r = resp(Math.pow(10, lf), typ); return key === 'G' ? dB(r.G) : cx.abs(r.X); });
      gx.line(curve(!vented, 'X'), { c: 'muted', w: 1.4, dash: '5 3', layer: 'main' }); gx.line(curve(vented, 'X'), { c: vented ? 'c3' : 'c1', w: 2.4, layer: 'main' });
      if (vented) gx.vline(Math.log10(fb), { c: 'c3', w: 1, dash: '3 3', layer: 'under' });
      L.h('p', 'lab-cap', c2, T('Response at the listening position, normalised to the passband (dB). Solid: this box; dashed: the other type.', '聴取位置での応答を通過域で規格化したもの（dB）です。実線はこの箱、破線はもう一方の型です。'));
      const g = L.fig(c2, { x: [1, 3], y: [-30, 6], aspect: 0.75, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 420, ticksX: LOGT.filter((t) => t[0] <= 3) });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' }); g.hline(-3, { c: 'muted', w: 1, dash: '3 3', layer: 'under' });
      g.line(curve(!vented, 'G'), { c: 'muted', w: 1.6, dash: '5 3', layer: 'main' }); g.line(curve(vented, 'G'), { c: vented ? 'c3' : 'c1', w: 2.8, layer: 'main' });
      g.vline(Math.log10(F3), { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' }); g.text(Math.log10(F3), -28, `f₃ = ${fmt(F3, 1)} Hz`, { small: true, c: 'hl', anchor: 'start', dx: 5 });
      if (vented) g.handle(Math.log10(fb), dB(resp(fb, true).G), { c: 'c3', r: 7, axis: 'x', label: T('Port tuning', 'ポートの同調'), bounds: [Math.log10(20), Math.log10(80), -30, 6], onDrag: (x) => ctx.set('fb', Math.round(Math.pow(10, x) * 2) / 2) });
      L.legend(ctx.host, [{ c: 'c1', label: T('sealed', '密閉型') }, { c: 'c3', label: T('vented', 'バスレフ型') }, { c: 'muted', dash: true, label: T('the other type, same volume', 'もう一方の型、同じ容積') }, { c: 'hl', dash: true, label: '−3 dB' }]);
      const sb = sealedBox(DRV.fs, DRV.Qts, DRV.Vas, Vb, 100), vb = ventedBox(DRV.fs, DRV.Qts, DRV.Vas, Vb, fb, 100);
      ctx.readout([
        { k: T('driver', 'ドライバー'), v: `fₛ ${fmt(DRV.fs, 1)} Hz, Qₜₛ ${fmt(DRV.Qts, 2)}, V_as ${fmt(DRV.Vas * 1000, 1)} L` },
        { k: 'α = V_as/V_b', v: fmt(DRV.Vas / Vb, 2), tone: 'key' },
        vented ? { k: 'h = f_b/fₛ', v: fmt(vb.h, 2) } : { k: 'f_c, Q_tc', v: `${fmt(sb.fc, 1)} Hz, ${fmt(sb.Q, 3)}`, tone: Math.abs(sb.Q - 0.707) < 0.03 ? 'good' : undefined },
        { k: 'f₃', v: `${fmt(F3, 1)} Hz`, tone: 'good' },
        { k: T('the other type', 'もう一方の型'), v: `f₃ = ${fmt(F3o, 1)} Hz` },
        { k: T('peak in the passband', '通過域のピーク'), v: (() => { const pk = Math.max(...curve(vented, 'G').map((p) => p[1])); return pk < 0.05 ? T('none (monotonic)', 'なし（単調）') : `+${fmt(pk, 2)} dB`; })() },
      ], vented
        ? (fb < DRV.fs * 0.8 ? T('Tuned well below fₛ, the port resonance sits where the driver has little to give: the response sags into a long, shallow slope before the final 24 dB/octave fall.', 'fₛ よりかなり下に同調すると、ポートの共振はドライバーがほとんど出力できない場所に来ます。応答は最後のオクターブあたり 24 dB の低下の前に、長く浅い傾斜へたるみます。') : fb > DRV.fs * 1.3 ? T('Tuned high, the port adds a hump above fₛ and the response then falls off a cliff below it: more output at the tuning, less extension, and a boomy character.', '高く同調すると、ポートは fₛ より上にこぶを加え、その下で応答は崖のように落ちます。同調点での出力は増えますが伸びは減り、こもった性格になります。') : T('Near fₛ the port takes over just as the sealed response would start to fall, extending the bass. Watch the excursion: the cone rests at f_b and the port does the work.', 'fₛ の近くでは、密閉型の応答が下がり始めるちょうどその所でポートが引き継ぎ、低音を伸ばします。振幅を見てください。コーンは f_b で休み、ポートが仕事をします。'))
        : T(`The box air adds stiffness: α = ${fmt(DRV.Vas / Vb, 2)} raises the resonance to ${fmt(sb.fc, 0)} Hz and the Q to ${fmt(sb.Q, 2)}. Q_tc = 0.707 is maximally flat; smaller boxes ring (higher Q), larger ones droop earlier and roll off more gently.`, `箱の空気が剛性を加えます。α = ${fmt(DRV.Vas / Vb, 2)} は共振を ${fmt(sb.fc, 0)} Hz に、Q を ${fmt(sb.Q, 2)} に上げます。Q_tc = 0.707 が最大平坦で、小さな箱は響き（Q が高い）、大きな箱は早めに下がり始めてなだらかに減衰します。`));
    },
  };

  /* ---------- 3. piston directivity ---------- */
  const rOfP = (db) => Math.max(0, 1 + db / 36);   // radius scale: rings every 6 dB, −36 dB at the centre
  const lvlP = (ka, th) => 20 * Math.log10(Math.abs(piston(ka, th)) + 1e-9);
  const AV = 4;                                      // piston drawn at 4 scene units per metre of radius
  D['piston-directivity'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, '');
        st.v3 = L.h('div', '', st.c1);
        st.leg = L.h('div', '', st.frame);
      }
      st.v = v;
      const a = v.a / 100, f = Math.pow(10, v.lf), k = TAU * f / C_AIR, ka = k * a;
      const ha = halfAngle6dB(ka);
      // right: off-axis level against frequency
      st.c2.replaceChildren();
      L.h('p', 'lab-cap', st.c2, T('Level off axis relative to on axis, against frequency, for this radius. Drag the gold point.', 'この半径での、軸上に対する軸外のレベルを周波数に対して示します。金色の点をドラッグしてください。'));
      const g = L.fig(st.c2, { x: [2, 4.3], y: [-30, 3], aspect: 0.8, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 400, ticksX: LOGT.filter((t) => t[0] >= 2) });
      g.hline(0, { c: 'c1', w: 2, layer: 'main' });
      [['c3', 30], ['c2', 60], ['c4', 90]].forEach(([c, dg]) => g.line(L.sample(2, 4.3, 300, (lf) => Math.max(-40, lvlP(TAU * Math.pow(10, lf) / C_AIR * a, dg * Math.PI / 180))), { c, w: 1.8, layer: 'main' }));
      g.vline(Math.log10(C_AIR / (TAU * a)), { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); g.text(Math.log10(C_AIR / (TAU * a)), 2, 'ka = 1', { small: true, c: 'muted', anchor: 'start', dx: 4 });
      g.handle(v.lf, 0, { c: 'hl', r: 7, axis: 'x', label: T('Frequency', '周波数'), bounds: [2, 4.3, -30, 3], onDrag: (x) => ctx.set('lf', Math.round(x * 100) / 100) });
      const legend = () => { st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('on axis (reference), and the pattern at this frequency', '軸上（基準）、およびこの周波数でのパターン') }, { c: 'c3', label: T('30°; and one octave lower', '30°、および一オクターブ下') }, { c: 'c2', label: '60°' }, { c: 'c4', label: T('90°; and one octave higher', '90°、および一オクターブ上') }].concat(st.flat ? [] : [{ c: 'hl', label: T('the −6 dB contour on the balloon', '風船上の −6 dB の等高線') }])); };
      legend();
      ctx.readout([
        { k: 'f, a', v: `${hz(f)}, ${fmt(v.a, 1)} cm`, tone: 'key' },
        { k: 'ka', v: fmt(ka, 2) },
        { k: T('wavelength', '波長'), v: `${fmt(C_AIR / f * 100, 1)} cm` },
        { k: T('−6 dB half-angle', '−6 dB 半角'), v: ha >= 90 ? T('wider than 90°', '90° より広い') : `${fmt(ha, 1)}°` },
        { k: T('directivity index', '指向性指数'), v: `${fmt(directivityIndex(ka), 1)} dB` },
        { k: T('level at 60°', '60° でのレベル'), v: `${fmt(lvlP(ka, Math.PI / 3), 1)} dB` },
      ], ka < 1
        ? T('The piston is small compared with the wavelength: every point of it is nearly in phase at any listening angle, and the sound spreads evenly over the front half-space.', 'ピストンは波長に比べて小さく、どの聴取角度でもその各点はほぼ同位相で、音は前方の半空間に一様に広がります。')
        : ka < 3.83 ? T('The circumference is now comparable to the wavelength: off-axis listeners hear the edges partly cancel, and the treble narrows into a beam. This is the range where a two-way speaker should cross over.', '円周が波長と同程度になりました。軸外の聴き手には縁の寄与が部分的に打ち消し合って聞こえ、高音はビームに細まります。2 ウェイスピーカーがクロスオーバーすべきなのはこの範囲です。')
          : T(`ka = ${fmt(ka, 2)} exceeds 3.83, the first zero of J₁: a null has entered the front half-space at ${fmt(Math.asin(3.8317 / ka) * 180 / Math.PI, 1)}°, with side lobes beyond it. Only a smaller driver can cover this range evenly.`, `ka = ${fmt(ka, 2)} は J₁ の最初の零点 3.83 を超えました。前方の半空間の ${fmt(Math.asin(3.8317 / ka) * 180 / Math.PI, 1)}° に零点が現れ、その先に副ローブがあります。この帯域を一様に覆えるのは、より小さなドライバーだけです。`));
      const flatPolar = () => {
        st.v3.replaceChildren();
        st.cap1.textContent = T(`Polar pattern in front of the piston at ${hz(f)} (solid), and an octave below and above (faint). Rings every 6 dB.`, `${hz(f)} でのピストン前方の極座標パターン（実線）と、一オクターブ下と上（薄い線）です。同心円は 6 dB ごとです。`);
        const pf = L.fig(st.v3, { x: [-0.15, 1.12], y: [-1.1, 1.1], equal: true, axes: false, maxH: 400 });
        for (let d = 0; d >= -30; d -= 6) pf.line(L.sample(-Math.PI / 2, Math.PI / 2, 60, (t) => [rOfP(d) * Math.cos(t), rOfP(d) * Math.sin(t)]), { c: 'muted', w: d === 0 ? 1.2 : 0.7, op: 0.6, layer: 'under' });
        [0, 30, 60, 90].forEach((dg) => { const t = dg * Math.PI / 180; [1, -1].forEach((sg) => pf.seg([0, 0], [Math.cos(t), sg * Math.sin(t)], { c: 'muted', w: 0.6, op: 0.5, layer: 'under' })); pf.text(1.06 * Math.cos(t), 1.06 * Math.sin(t), `${dg}°`, { small: true, c: 'muted' }); });
        pf.text(rOfP(-18), -0.04, '−18 dB', { small: true, c: 'muted', dy: 12 });
        const pat = (kaa) => L.sample(-Math.PI / 2, Math.PI / 2, 360, (t) => { const r = rOfP(lvlP(kaa, t)); return [r * Math.cos(t), r * Math.sin(t)]; });
        pf.line(pat(ka / 2), { c: 'c3', w: 1.2, op: 0.7, layer: 'main' }); pf.line(pat(ka * 2), { c: 'c4', w: 1.2, op: 0.7, layer: 'main' }); pf.line(pat(ka), { c: 'c1', w: 2.6, layer: 'main' });
        pf.rect(-0.12, -a * 4, 0.1, a * 8, { c: 'ink', fill: 'ink', fo: 0.5, w: 1, layer: 'over' });
      };
      const narrow = (ctx.host.clientWidth || 900) < 560;
      L.view3d(ctx, v, {
        host: st.v3, aspect: narrow ? 1 : 0.86, maxH: 470, camera: [2.2, -3.2, 1.45], target: [0.5, 0.14, -0.04], fov: 34,
        label: T('3D radiation balloon of a piston in a wall. Drag to rotate; drag the gold point on the piston rim to resize it.', '壁にはめたピストンの 3D 放射パターン。ドラッグで回転し、ピストンの縁の金色の点をドラッグすると大きさを変えられます。'),
        init(S) {
          st.flat = false;
          const cA = S.colour('c1'), cB = S.colour('c3'), cC = S.colour('c4');
          st.lvlCol = (d) => { const t = clamp(-d / 30, 0, 1); return t < 0.4 ? cA.clone().lerp(cB, t / 0.4) : cB.clone().lerp(cC, (t - 0.4) / 0.6); };
          st.cap1.textContent = T(`The radiation balloon at ${hz(f)}: distance from the piston is the level in that direction (6 dB per ring), cut open along a vertical plane through the axis. Drag the gold point on the piston's rim to change its size.`, `${hz(f)} での放射の風船です。ピストンからの距離がその方向のレベルを表し（輪は 6 dB ごと）、軸を含む鉛直面で切り開いています。ピストンの縁の金色の点をドラッグすると大きさが変わります。`);
          // polar grid in the cut plane y = 0
          const G = [];
          for (let d = 0; d >= -30; d -= 6) { const r = rOfP(d); for (let i = 0; i < 48; i++) { const t0 = -Math.PI / 2 + Math.PI * i / 48, t1 = -Math.PI / 2 + Math.PI * (i + 1) / 48; G.push([[r * Math.cos(t0), 0, r * Math.sin(t0)], [r * Math.cos(t1), 0, r * Math.sin(t1)]]); } }
          [-90, -60, -30, 0, 30, 60, 90].forEach((dg) => { const t = dg * Math.PI / 180; G.push([[0, 0, 0], [1.04 * Math.cos(t), 0, 1.04 * Math.sin(t)]]); });
          S.lines(G, { c: 'muted', opacity: 0.55 });
          [0, 30, 60, 90].forEach((dg) => { const t = dg * Math.PI / 180; S.label(`${dg}°`, [1.12 * Math.cos(t), 0, 1.12 * Math.sin(t)], { small: true, c: 'muted', align: 'middle' }); });
          // baffle and piston
          S.box([0.02, 1.6, 2.1], [-0.012, 0.35, 0], { c: 'muted', opacity: 0.14, rough: 0.8, coat: 0 }).userData.noOcclude = true;
          st.disc = S.disc([0.004, 0, 0], [1, 0, 0], 1, { c: 'ink', opacity: 0.85, rough: 0.5 });
          st.rim = S.tube(L.sample(0, TAU, 64, (t) => [0.006, Math.cos(t), Math.sin(t)]), { c: 'ink', r: 0.008, closed: true });
          // the balloon: theta from the axis, phi round it, the half behind the cut (y >= 0)
          st.ball = S.surface(() => [0, 0, 0], { u: [0, Math.PI / 2], v: [0, Math.PI], nu: 150, nv: 64, colour: () => S.colour('c1'), rough: 0.45, coat: 0.3, wire: true, wireEvery: 15, wireEveryV: 8 });
          st.cut = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.011 });
          st.lo = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c3', r: 0.005 });
          st.hi = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c4', r: 0.005 });
          st.ring = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.012 });
          st.ringL = S.label('−6 dB', [0, 0, 0], { small: true, occlude: true });
          st.nullL = S.label('', [0, 0, 0], { small: true, c: 'muted' });
          st.hand = S.handle([0.02, -0.26, 0], { r: 0.055, label: 'a', plane: [[1, 0, 0], [0.02, 0, 0]], onDrag: (q) => {
            const y = clamp(-q.y, 0.01 * AV, 0.15 * AV), cm = Math.round(y / AV * 1000) / 10;
            ctx.set('a', clamp(cm, 1, 15));
            return [0.02, -cm / 100 * AV, 0];
          } });
        },
        update(S, vv) {
          const aa = vv.a / 100, ff = Math.pow(10, vv.lf), kk = TAU * ff / C_AIR * aa, av = aa * AV;
          st.cap1.textContent = T(`The radiation balloon at ${hz(ff)}: distance from the piston is the level in that direction (6 dB per ring), cut open along a vertical plane through the axis. Drag the gold point on the piston's rim to change its size.`, `${hz(ff)} での放射の風船です。ピストンからの距離がその方向のレベルを表し（輪は 6 dB ごと）、軸を含む鉛直面で切り開いています。ピストンの縁の金色の点をドラッグすると大きさが変わります。`);
          const R = (t) => rOfP(lvlP(kk, t)), lvlCol = st.lvlCol;
          st.ball.update((t, ph) => { const r = R(t); return [r * Math.cos(t), r * Math.sin(t) * Math.sin(ph), r * Math.sin(t) * Math.cos(ph)]; }, (t) => lvlCol(lvlP(kk, t)));
          const cutOf = (kq) => L.sample(-Math.PI / 2, Math.PI / 2, 361, (t) => { const r = rOfP(lvlP(kq, t)); return [r * Math.cos(t), -0.003, r * Math.sin(t)]; });
          st.cut.update(cutOf(kk)); st.lo.update(cutOf(kk / 2)); st.hi.update(cutOf(kk * 2));
          const h6 = halfAngle6dB(kk);
          if (h6 < 90) {
            const t6 = h6 * Math.PI / 180, r6 = rOfP(-6.0206) + 0.004;
            st.ring.visible = true; st.ring.update(L.sample(0, Math.PI, 72, (ph) => [r6 * Math.cos(t6), r6 * Math.sin(t6) * Math.sin(ph), r6 * Math.sin(t6) * Math.cos(ph)]));
            st.ringL.set([r6 * Math.cos(t6), 0, r6 * Math.sin(t6)]).show(true);
          } else { st.ring.visible = false; st.ringL.show(false); }
          if (kk > 3.8317) { const t1 = Math.asin(3.8317 / kk); st.nullL.set([0.5 * Math.cos(t1), 0, -0.5 * Math.sin(t1)], T(`null ${fmt(t1 * 180 / Math.PI, 0)}°`, `零点 ${fmt(t1 * 180 / Math.PI, 0)}°`)).show(true); } else st.nullL.show(false);
          st.disc.scale.setScalar(av); st.rim.update(L.sample(0, TAU, 64, (t) => [0.006, av * Math.cos(t), av * Math.sin(t)]));
          st.hand.at([0.02, -av, 0]);
          S.invalidate();
        },
        fallback() { st.flat = true; flatPolar(); legend(); },
      });
    },
  };
})();
