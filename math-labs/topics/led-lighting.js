'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * One mid-power blue LED chip under a phosphor.
   * Recombination in the chip follows the ABC model: carriers are lost through defects (A n), make light (B n^2) or are lost
   * to the Auger process (C n^3). With x = n / n_peak and q = sqrt(AC)/B the internal quantum efficiency is
   * 1 / (1 + q (x + 1/x)), highest at x = 1, and the current is I = I_pk x (q + x + q x^2) / (1 + 2q).
   * Forward voltage: V = 2.55 + 0.052 ln(1 + I / 0.1 mA) + 0.5 ohm I - 2 mV per kelvin above 25 C.
   * White light: a blue line at 452 nm plus phosphor bands; each phosphor photon costs one blue photon (quantum yield 0.9),
   * so conversion loses the energy difference. Colour from CIE 1931 matching functions (Wyman-Sloan-Shirley fit) and
   * McCamy's formula. Luminous efficacy of radiation = 683 * integral(S ybar) / integral(S).
   * Driver: full-wave rectifier, storage capacitor, and either a series resistor or a constant-power converter.
   * Heat: T_j = T_a + P_heat (R_sink + R_inner); life halves for every 12 K (LED) or 10 K (capacitor).
   */
  const Q = 1 / 18, IPK = 0.02, VPH = 1239.84 / 452;                               // q, peak-efficiency current (A), photon energy of 452 nm in eV
  const iOfX = (x) => (IPK * x * (Q + x + Q * x * x)) / (1 + 2 * Q);
  function xOfI(I) { let a = 0, b = 50; for (let k = 0; k < 70; k++) { const m = (a + b) / 2; if (iOfX(m) < I) a = m; else b = m; } return (a + b) / 2; }
  const iqe = (I) => { const x = xOfI(I); return x <= 0 ? 0 : 1 / (1 + Q * (x + 1 / x)); };
  const vf = (I, Tj = 25) => 2.55 + 0.052 * Math.log(1 + I / 1e-4) + 0.5 * I - 0.002 * (Tj - 25);
  const wpe = (I, Tj = 25) => (iqe(I) * 0.88 * VPH * (1 - 0.0015 * (Tj - 25))) / vf(I, Tj);       // blue light out per electrical watt in
  const G = (l, mu, s1, s2 = s1) => Math.exp(-0.5 * ((l - mu) / (l < mu ? s1 : s2)) ** 2);
  const xbar = (l) => 1.056 * G(l, 599.8, 37.9, 31.0) + 0.362 * G(l, 442.0, 16.0, 26.7) - 0.065 * G(l, 501.1, 20.4, 26.2);
  const ybar = (l) => 0.821 * G(l, 568.8, 46.9, 40.5) + 0.286 * G(l, 530.9, 16.3, 31.1);
  const zbar = (l) => 1.217 * G(l, 437.0, 11.8, 36.0) + 0.681 * G(l, 459.0, 26.0, 13.8);
  const blueLeak = (w) => 1.6 * (1 - w) + 0.35;
  const phos = (l, w) => (1 - w) * G(l, 555, 50) + w * G(l, 615, 48);
  const spec = (l, w) => blueLeak(w) * G(l, 452, 10) + phos(l, w);
  function white(w) {
    let X = 0, Y = 0, Z = 0, S = 0, cost = 0; for (let l = 380; l <= 780; l += 1) { const s = spec(l, w), p = phos(l, w); X += s * xbar(l); Y += s * ybar(l); Z += s * zbar(l); S += s; cost += blueLeak(w) * G(l, 452, 10) + (p * (l / 452)) / 0.9; }
    const x = X / (X + Y + Z), y = Y / (X + Y + Z), n = (x - 0.332) / (0.1858 - y);
    return { x, y, cct: 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33, ler: (683 * Y) / S, conv: S / cost };
  }
  const efficacy = (I, Tj, w) => { const q = white(w); return wpe(I, Tj) * q.conv * q.ler; };
  // driver simulation over the mains cycle; returns one settled half-cycle
  const MAINS = [{ v: 230, f: 50 }, { v: 120, f: 60 }];
  function driver(m, C, P, type) {
    const { v, f } = MAINS[m], vpk = v * Math.SQRT2, w = TAU * f, N = 2000, dt = 1 / (2 * f) / N, Vs = 0.62 * vpk, R = ((0.93 * vpk - Vs) * Vs) / P; let vc = vpk; const out = [];
    for (let h = 0; h < 4; h++) for (let k = 0; k < N; k++) {
      const t = k * dt, vin = vpk * Math.abs(Math.sin(w * t)), dvin = vpk * w * Math.cos(w * t) * Math.sign(Math.sin(w * t) || 1);
      let il, light; if (type === 0) { il = Math.max(0, (vc - Vs) / R); light = (il * Vs) / P; } else { const on = vc > 0.35 * vpk; il = on ? P / 0.9 / vc : 0; light = on ? 1 : 0; }
      let isrc = 0; if (vin >= vc) { vc = vin; isrc = Math.max(0, C * dvin + il); } else vc = Math.max(0, vc - (il / C) * dt);
      if (h === 3) out.push([t, vin, vc, light, isrc]);
    }
    let lmax = 0, lmin = Infinity, lsum = 0, vmin = Infinity, pin = 0, i2 = 0; for (const o of out) { lmax = Math.max(lmax, o[3]); lmin = Math.min(lmin, o[3]); lsum += o[3]; vmin = Math.min(vmin, o[2]); pin += o[1] * o[4]; i2 += o[4] * o[4]; }
    pin /= N; const irms = Math.sqrt(i2 / N);
    return { out, vpk, flicker: lmax + lmin > 0 ? (100 * (lmax - lmin)) / (lmax + lmin) : 0, mean: lsum / N, ripple: vpk - vmin, pin, irms, pf: irms > 0 ? pin / (v * irms) : 0, f2: 2 * f };
  }
  // heat and life
  const RIN = 1.8, HEATFRAC = 0.65;
  function thermal(P, Rsa, Ta) { const heat = P * HEATFRAC, ts = Ta + heat * Rsa, tb = ts + heat * 1.0, tj = tb + heat * 0.8; return { heat, ts, tb, tj, tcap: ts - 5, lifeLed: 50000 * 2 ** ((85 - tj) / 12), lifeCap: 5000 * 2 ** ((105 - (ts - 5)) / 10), out: 1 - 0.002 * (tj - 25) }; }
  const M = { Q, IPK, VPH, iOfX, xOfI, iqe, vf, wpe, xbar, ybar, zbar, spec, phos, blueLeak, white, efficacy, MAINS, driver, thermal, RIN, HEATFRAC };
  (window.LabModels = window.LabModels || {})['led-lighting'] = M;

  /* ================= 1. from current to white light ================= */
  D['led-efficacy'] = {
    render(ctx, v) {
      const I = 10 ** v.li / 1000, Tj = v.tj, w = v.w / 100, q = white(w), eff = efficacy(I, Tj, w), V = vf(I, Tj), li = Math.log10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How much of the electricity one LED chip turns into light, against the current through it. Too little current and most electrons are lost at defects; too much and they are lost by knocking into each other (droop), so the chip is at its best at a small current and is usually run well above it, because more current still gives more light. Drag the gold point.`, tx`LED チップ 1 個が電気のうちどれだけを光に変えるかを、流す電流に対して描いています。電流が少なすぎると電子の多くが欠陥で失われ、多すぎると電子どうしの衝突で失われます（ドループ）。そのためチップは小さな電流で最も効率が良くなりますが、電流を増やせば光は増えるので、普通はそれよりずっと大きな電流で使います。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 3], y: [0, 230], aspect: 0.68, maxH: 350, xlabel: T('current (mA)', '電流（mA）'), ylabel: T('white light (lm/W)', '白色光（lm/W）'), ticksX: [[0, '1'], [li(3), '3'], [1, '10'], [li(30), '30'], [2, '100'], [li(300), '300'], [3, '1000']] });
      a.line(L.sample(0, 3, 160, (x) => efficacy(10 ** x / 1000, 25, w)), { c: 'muted', w: 1.6, dash: '5 4' });
      a.line(L.sample(0, 3, 160, (x) => efficacy(10 ** x / 1000, Tj, w)), { c: 'c1', w: 2.8 });
      a.line(L.sample(0, 3, 160, (x) => 230 * iqe(10 ** x / 1000)), { c: 'c3', w: 1.8 });
      a.vline(li(IPK * 1000), { c: 'c3', dash: '3 4' });
      a.handle(v.li, eff, { c: 'hl', axis: 'x', bounds: [0, 3, 0, 230], label: T('current', '電流'), onDrag: (x) => ctx.set('li', clamp(Math.round(x * 50) / 50, 0, 3)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The light itself. The chip emits only blue; a phosphor coating absorbs part of it and re-emits it as a broad band of longer wavelengths, and the mixture looks white. More red phosphor gives a warmer white but turns more blue photons into lower-energy ones, and puts light where the eye (dashed) is less sensitive.`, tx`光そのものです。チップが出すのは青だけです。蛍光体の層がその一部を吸収して、より長い波長の広い帯として出し直し、混ざった光が白く見えます。赤い蛍光体を増やすと暖かい白になりますが、より多くの青い光子をエネルギーの低い光子に変えることになり、目（破線）の感度が低いところに光が回ります。`));
      const b = L.fig(c2, { x: [400, 720], y: [0, 2.1], aspect: 0.68, maxH: 350, xlabel: T('wavelength (nm)', '波長（nm）'), ylabel: T('power', 'パワー') });
      b.area(L.sample(400, 720, 200, (l) => blueLeak(w) * G(l, 452, 10)), { c: 'c1', fo: 0.45, base: 0 }); b.area(L.sample(400, 720, 200, (l) => phos(l, w)), { c: 'hl', fo: 0.4, base: 0 });
      b.line(L.sample(400, 720, 240, (l) => spec(l, w)), { c: 'ink', w: 2.2 }); b.line(L.sample(400, 720, 200, (l) => ybar(l)), { c: 'c3', w: 1.6, dash: '5 4' });
      L.legend(ctx.host, [{ c: 'c1', label: T('this chip; blue left over', 'このチップ、残った青') }, { c: 'muted', dash: true, label: T('at 25 °C', '25 °C のとき') }, { c: 'c3', label: T('share of electrons making light; eye sensitivity (dashed)', '光になる電子の割合、目の感度（破線）') }, { c: 'hl', kind: 'fill', label: T('phosphor light', '蛍光体の光') }]);
      ctx.readout([
        { k: T('voltage, power in', '電圧、入力電力'), v: tx`\(${fmt(V, 2)}\ \mathrm{V},\ ${fmt(V * I * 1000, 0)}\ \mathrm{mW}\)` },
        { k: T('electrons that make a photon', '光子を生む電子の割合'), v: tx`\(${fmt(100 * iqe(I), 0)}\,\%\)` },
        { k: T('blue light per electrical watt', '電力 1 W あたりの青い光'), v: tx`\(${fmt(100 * wpe(I, Tj), 0)}\,\%\)` },
        { k: T('kept through the phosphor; lumens per watt of light', '蛍光体を通って残る割合、光 1 W あたりのルーメン'), v: tx`\(${fmt(100 * q.conv, 0)}\,\%,\ ${fmt(q.ler, 0)}\ \mathrm{lm/W}\)` },
        { k: T('white light, colour temperature', '白色光、色温度'), v: tx`\(${fmt(eff, 0)}\ \mathrm{lm/W},\ ${fmt(eff * V * I, 1)}\ \mathrm{lm},\ ${fmt(Math.round(q.cct / 50) * 50, 0)}\ \mathrm{K}\)`, tone: 'key' },
      ], T('An incandescent lamp gives about 15 lumens per watt and a compact fluorescent about 60. The best possible white light, with no losses at all, would give roughly 300 to 350.', '白熱電球は 1 W あたり約 15 ルーメン、電球形蛍光灯は約 60 ルーメンです。損失がまったくない理想的な白色光なら、およそ 300 から 350 ルーメンになります。'));
    },
  };

  /* ================= 2. the driver: from mains to steady light ================= */
  D['led-driver'] = {
    render(ctx, v) {
      const C = v.c * 1e-6, d = driver(v.mains, C, v.p, v.drv), m = MAINS[v.mains], ms = (t) => t * 1000;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`One half-cycle of the mains, \(${fmt(1000 / d.f2, 1)}\) ms. A bridge of four diodes flips the negative half so the voltage (grey) is always positive, and a capacitor (blue) is topped up at each peak and drained by the lamp in between. Current is drawn from the wall (red) only in the short burst while the capacitor is being refilled.`, tx`電源の半周期、\(${fmt(1000 / d.f2, 1)}\) ms です。4 個のダイオードのブリッジが負の半分を反転させるので、電圧（灰色）は常に正です。コンデンサー（青）は、山ごとに充電され、その間はランプに放電します。壁のコンセントから電流（赤）が流れるのは、コンデンサーが充電される短い間だけです。`));
      const a = L.fig(c1, { x: [0, 1000 / d.f2], y: [0, d.vpk * 1.12], aspect: 0.66, maxH: 330, xlabel: T('time (ms)', '時間（ms）'), ylabel: T('volts', '電圧（V）') });
      const imax = Math.max(...d.out.map((o) => o[4]), 1e-9);
      a.area(d.out.map((o) => [ms(o[0]), (o[4] / imax) * d.vpk * 0.45]), { c: 'c2', fo: 0.3, base: 0 });
      a.line(d.out.map((o) => [ms(o[0]), o[1]]), { c: 'muted', w: 1.8 }); a.line(d.out.map((o) => [ms(o[0]), o[2]]), { c: 'c1', w: 2.8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Light output over the same half-cycle. With only a resistor to set the current, the LEDs follow every dip of the capacitor voltage, exaggerated, because an LED’s current rises steeply with voltage. A switching converter that holds the current constant removes the flicker for as long as the capacitor stays above its minimum.`, tx`同じ半周期での光の出力です。抵抗だけで電流を決める場合、LED はコンデンサーの電圧のへこみを、拡大して写し取ります。LED の電流は電圧に対して急に増えるからです。電流を一定に保つスイッチング式の変換器を使うと、コンデンサーの電圧が最低値を下回らない限り、ちらつきは消えます。`));
      const b = L.fig(c2, { x: [0, 1000 / d.f2], y: [0, 1.6], aspect: 0.66, maxH: 330, xlabel: T('time (ms)', '時間（ms）'), ylabel: T('light (1 = rated)', '光（1 = 定格）') });
      b.hline(1, { c: 'muted', dash: '4 4' }); const lt = d.out.map((o) => [ms(o[0]), Math.min(1.6, o[3])]); b.area(lt, { c: 'hl', fo: 0.3, base: 0 }); b.line(lt, { c: 'hl', w: 2.8 });
      L.legend(ctx.host, [{ c: 'muted', label: T('rectified mains', '整流した電源電圧') }, { c: 'c1', label: T('capacitor voltage', 'コンデンサーの電圧') }, { c: 'c2', kind: 'fill', label: T('current from the wall', 'コンセントからの電流') }, { c: 'hl', label: T('light', '光') }]);
      ctx.readout([
        { k: T('flicker, at', 'ちらつき、その周波数'), v: tx`\(${fmt(d.flicker, 0)}\,\%,\ ${d.f2}\ \mathrm{Hz}\)`, tone: d.flicker < 8 ? 'good' : d.flicker < 30 ? 'warn' : 'bad' },
        { k: T('capacitor ripple', 'コンデンサーのリップル'), v: tx`\(${fmt(d.ripple, 0)}\ \mathrm{V}\ \text{of}\ ${fmt(d.vpk, 0)}\ \mathrm{V}\)` },
        { k: T('mean light', '平均の光'), v: tx`\(${fmt(100 * d.mean, 0)}\,\%\)` },
        { k: T('power factor', '力率'), v: tx`\(${fmt(d.pf, 2)}\)`, tone: d.pf < 0.5 ? 'warn' : undefined },
        { k: T('current from the wall (rms) for the power used', '使う電力に対するコンセントからの電流（実効値）'), v: tx`\(${fmt(d.irms * 1000, 0)}\ \mathrm{mA},\ ${fmt(d.pin, 1)}\ \mathrm{W}\)` },
      ], T(tx`A bigger capacitor smooths the light but shortens the charging burst, which lowers the power factor: the lamp draws its energy in sharper spikes. Lamps above a few watts are required to correct this, usually with a converter that draws current in step with the mains voltage and stores the energy after the LEDs’ own regulator.`, tx`コンデンサーを大きくすると光は滑らかになりますが、充電の時間が短くなり、力率が下がります。ランプがより鋭いパルスでエネルギーを取り込むようになるからです。数ワットを超えるランプにはこれを補正することが求められ、普通は、電源電圧に合わせて電流を引き込む変換器を使います。`));
    },
  };

  /* ================= 3. inside the bulb: heat and life (3D) ================= */
  function buildBulb(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.1, T0 = PI / 2, CUT = PI * 1.5;         // 1 unit = 10 mm; axis along z, base at the bottom
    const lathe = (pts, mat, t0 = T0, len = CUT) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0] * K, q[1] * K)), 72, t0, len).rotateX(PI / 2), mat); m.castShadow = true; g.add(m); return m; };
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w * K, d * K, h * K), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; g.add(m); return m; };
    const nickel = S.mat('#c9cbd0', { metal: 1, rough: 0.3 }), sinkMat = S.mat('#e9eaec', { rough: 0.45, coat: 0.3 }), alu = S.mat('#bfc3c9', { metal: 0.9, rough: 0.4 }), dark = S.mat('#1c1d20', { rough: 0.6 });
    const pcb = S.mat('#1f6a40', { rough: 0.5, coat: 0.6 }), white = S.mat('#f4f4f2', { rough: 0.5 }), copper = S.mat('#b87333', { metal: 0.9, rough: 0.35 });
    // E27 screw base: rolled thread, insulator and centre contact
    const th = [[0.01, 0], [5, 0], [5.4, 1.2], [9.5, 3.2], [12.6, 4.2]]; for (let k = 0; k < 6; k++) th.push([13.6, 5.2 + k * 3.6], [12.4, 7 + k * 3.6]); th.push([13.6, 26.8], [13.6, 28], [12.8, 28]); for (let k = 5; k >= 0; k--) th.push([11.6, 7 + k * 3.6], [12.8, 5.2 + k * 3.6]); th.push([11.8, 4.6], [9.3, 3.6], [0.01, 0.6]);
    lathe(th, nickel); lathe([[0.01, -0.6], [4.6, -0.6], [4.6, 0.3], [0.01, 0.3]], nickel, 0, TAU); lathe([[4.8, 0.2], [9.6, 3.0], [9.2, 3.4], [4.8, 0.9]], dark, 0, TAU);
    // body: aluminium heat sink inside a plastic shell, widening to the LED board
    const sink = lathe([[12.5, 28.6], [14.2, 30], [18, 40], [24, 54], [27.5, 62], [27.5, 64.5], [25.8, 64.5], [25.8, 62.6], [22.4, 54.6], [16.6, 41], [13, 31.2], [12.5, 30.6]], alu);
    lathe([[13.4, 28], [15, 29.4], [19, 39.6], [25, 53.6], [28.8, 62], [28.8, 66], [27.6, 66], [27.6, 62.2], [24.1, 54], [18.1, 40], [14.3, 30], [13.4, 29]], sinkMat);
    // LED board: aluminium-core disc with twelve chips under yellow phosphor
    lathe([[0.01, 64.6], [25.6, 64.6], [25.6, 66], [0.01, 66]], white, 0, TAU);
    const leds = []; const ledMat = S.mat('#f2d24a', { rough: 0.4, glow: 0.6, glowColour: '#fff3b0' });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, m = box(3.5, 2.8, 0.7, 17 * Math.cos(a), 17 * Math.sin(a), 66.4, ledMat); m.rotation.z = a; leds.push(m); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + 0.26; const m = box(3.5, 2.8, 0.7, 8 * Math.cos(a), 8 * Math.sin(a), 66.4, ledMat); m.rotation.z = a; }
    // diffuser: a frosted dome
    const domeMat = S.mat('#fffdf4', { rough: 0.6, coat: 0.1, opacity: 0.42, glow: 0.3, glowColour: '#fff2c8' });
    const dome = []; for (let k = 0; k <= 30; k++) { const a = -0.42 + (k / 30) * (PI / 2 + 0.42); dome.push([30 * Math.cos(a), 78.5 + 30 * Math.sin(a)]); } dome[dome.length - 1][0] = 0.01; const inner = dome.slice().reverse().map(([r, z]) => [Math.max(0.01, r * 0.965), 78.5 + (z - 78.5) * 0.965]);
    const domeMesh = lathe([[28.7, 66], ...dome, ...inner, [27.7, 66.2]], domeMat); domeMesh.castShadow = false;
    // driver board standing inside the body: bridge, capacitor, inductor, controller
    box(0.8, 17, 30, 0, 0, 44, pcb);
    const cap = new TH.Mesh(new TH.CylinderGeometry(4 * K, 4 * K, 11 * K, 28), S.mat('#20232b', { rough: 0.35, coat: 0.8 })); cap.rotation.x = PI / 2; cap.position.set(-4.6 * K, -2.5 * K, 46 * K); cap.castShadow = true; g.add(cap);
    const capTop = new TH.Mesh(new TH.CylinderGeometry(3.9 * K, 3.9 * K, 0.3 * K, 28), nickel); capTop.rotation.x = PI / 2; capTop.position.set(-4.6 * K, -2.5 * K, 51.6 * K); g.add(capTop);
    const ind = new TH.Mesh(new TH.TorusGeometry(2.6 * K, 1.2 * K, 12, 28), copper); ind.rotation.y = PI / 2; ind.position.set(-2.2 * K, 4.4 * K, 38 * K); ind.castShadow = true; g.add(ind);
    box(1.6, 4, 4, -1.4, -4.5, 34.5, dark); box(1.2, 3, 5, -1.2, 3.5, 50, dark); box(1.4, 2.2, 2.2, 1.1, -3, 48, dark); box(1.4, 2.2, 3.4, 1.1, 3, 40, S.mat('#a8322c', { rough: 0.5 }));
    for (const dy of [-1.2, 1.2]) { const wr = S.tube([[0, dy * K, 59 * K], [0.6 * K, dy * K, 62 * K], [3 * K, dy * K, 64.4 * K]], { r: 0.014, add: false }); wr.material = dy < 0 ? S.mat('#b3261e', { rough: 0.5 }) : S.mat('#222', { rough: 0.5 }); g.add(wr); }
    S.add(g);
    const setState = (tSink, power) => {
      const hot = clamp((tSink - 30) / 90, 0, 1); alu.color.set('#bfc3c9').lerp(new TH.Color('#e0603a'), hot * 0.85); alu.emissive = new TH.Color('#ff5a1f'); alu.emissiveIntensity = hot * 0.35;
      domeMat.emissiveIntensity = 0.12 + 0.05 * power; ledMat.emissiveIntensity = 0.3 + 0.08 * power; S.invalidate();
    };
    return { g, setState, sink, K };
  }
  D['led-bulb-thermal'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const P = v.p, Rsa = v.r, Ta = v.ta, th = thermal(P, Rsa, Ta), life = Math.min(th.lifeLed, th.lifeCap), lg = Math.log10;
      L.setText(st.cap1, T(tx`A household LED bulb, cut open. Eighteen chips sit on an aluminium-cored board under a frosted dome. The board is clamped to an aluminium cone that carries their heat out to the shell, and inside the cone stands the driver: bridge rectifier, storage capacitor, inductor and controller. The cone is tinted by its temperature.`, tx`家庭用の LED 電球の断面です。18 個のチップが、つや消しのドームの下でアルミニウム基板に載っています。基板はアルミニウムの円錐に固定され、円錐がチップの熱を外側の殻へ運びます。円錐の内側には、ブリッジ整流器、平滑コンデンサー、インダクター、制御 IC からなる駆動回路が立っています。円錐は温度に応じて色を付けています。`));
      L.setText(st.cap2, T(tx`Temperature along the path the heat takes, from the room air to the light-emitting junction. About \(${fmt(100 * HEATFRAC, 0)}\) per cent of the power becomes heat, and nearly all of the temperature rise is in the last step, from the outside of the bulb to the air.`, tx`室内の空気から発光する接合部まで、熱が通る道に沿った温度です。電力の約 \(${fmt(100 * HEATFRAC, 0)}\) % が熱になり、温度上昇のほとんどは、電球の外側から空気へという最後の段階で生じます。`));
      st.g2.replaceChildren();
      const a = L.fig(st.g2, { x: [-0.25, 3.35], y: [0, 160], aspect: 0.5, maxH: 230, xlabel: '', ylabel: T('°C', '°C'), ticksX: [[0, T('air', '空気')], [1, T('heat sink', 'ヒートシンク')], [2, T('board', '基板')], [3, T('junction', '接合部')]] });
      a.hline(85, { c: 'c3', dash: '4 4' }); a.text(-0.2, 85, T('rated 85 °C', '定格 85 °C'), { small: true, anchor: 'start', dy: -5 });
      const pts = [[0, Ta], [1, th.ts], [2, th.tb], [3, th.tj]]; a.area(pts.map((q) => [q[0], Math.min(160, q[1])]), { c: 'c2', fo: 0.18, base: 0 }); a.line(pts.map((q) => [q[0], Math.min(160, q[1])]), { c: 'c2', w: 2.8 }); pts.forEach((q) => { a.dot(q[0], Math.min(160, q[1]), { c: 'c2', r: 4.5 }); a.text(q[0], Math.min(150, q[1]), fmt(q[1], 0), { small: true, dy: -12, anchor: 'middle' }); });
      L.setText(st.cap3, T(tx`Expected life against the temperature of the air round the bulb: the LEDs fading to 70 per cent of their light, and the storage capacitor drying out. Whichever comes first ends the bulb. Drag the gold point.`, tx`電球の周りの空気の温度に対する期待寿命です。LED の光が 70 % まで落ちる時間と、平滑コンデンサーが干上がる時間を示します。先に来たほうが電球の寿命です。金色の点をドラッグしてください。`));
      st.g3.replaceChildren();
      const b = L.fig(st.g3, { x: [10, 70], y: [2, 5.6], aspect: 0.5, maxH: 230, xlabel: T('air temperature round the bulb (°C)', '電球の周りの気温（°C）'), ylabel: T('hours', '時間'), ticksY: [[2, '100'], [3, '1k'], [4, '10k'], [5, '100k']] });
      b.line(L.sample(10, 70, 60, (t) => clamp(lg(thermal(P, Rsa, t).lifeLed), 2, 5.6)), { c: 'hl', w: 2.4 }); b.line(L.sample(10, 70, 60, (t) => clamp(lg(thermal(P, Rsa, t).lifeCap), 2, 5.6)), { c: 'c1', w: 2.4 });
      b.handle(Ta, clamp(lg(life), 2, 5.6), { c: 'hl', axis: 'x', bounds: [10, 70, 2, 5.6], label: T('air temperature', '気温'), onDrag: (x) => ctx.set('ta', clamp(Math.round(x), 10, 70)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('temperature', '温度') }, { c: 'hl', label: T('LEDs to 70 % light', 'LED の光が 70 % になるまで') }, { c: 'c1', label: T('capacitor', 'コンデンサー') }]);
      ctx.readout([
        { k: T('heat to get rid of', '逃がすべき熱'), v: tx`\(${fmt(th.heat, 1)}\ \mathrm{W}\ \text{of}\ ${fmt(P, 1)}\ \mathrm{W}\)` },
        { k: T('heat sink, junction', 'ヒートシンク、接合部'), v: tx`\(${fmt(th.ts, 0)},\ ${fmt(th.tj, 0)}\ ^\circ\mathrm{C}\)`, tone: th.tj > 110 ? 'bad' : th.tj > 85 ? 'warn' : 'good' },
        { k: T('light, compared with a cold start', '点灯直後と比べた光'), v: tx`\(${fmt(100 * th.out, 0)}\,\%\)` },
        { k: T('life: LEDs, capacitor', '寿命：LED、コンデンサー'), v: tx`\(${fmt(Math.round(th.lifeLed / 100) * 100, 0)},\ ${fmt(Math.round(th.lifeCap / 100) * 100, 0)}\ \mathrm{h}\)`, tone: 'key' },
        { k: T('at three hours a day', '1 日 3 時間使うと'), v: tx`\(${fmt(life / 1095, 1)}\ \text{years}\)`, tone: life / 1095 < 5 ? 'warn' : 'good' },
      ], T('A closed fitting traps the air round the bulb, which can easily reach 50 or 60 °C. That is why bulbs fail early in enclosed ceiling lights and why packaging says whether a bulb is rated for them.', '密閉型の器具は電球の周りの空気を閉じ込め、気温は簡単に 50 から 60 °C に達します。密閉型の天井灯で電球が早く切れるのも、電球の箱に密閉器具に対応しているかどうかが書かれているのも、そのためです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.15 : 1.0, maxH: 620, camera: [9.5, -19, 14], target: [0, 0, 5.4], fov: 30,
        label: T('3D cutaway of an LED light bulb. Drag to rotate.', 'LED 電球の 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.bulb = buildBulb(S);
          S.label(T('diffuser', '拡散ドーム'), [-2.6, 0, 10.4], { small: true }); S.label(T('LED chips under phosphor', '蛍光体の下の LED チップ'), [0.4, -2.6, 7.6], { small: true }); S.label(T('heat sink', 'ヒートシンク'), [-3.3, 0, 4.6], { small: true });
          S.label(T('storage capacitor', '平滑コンデンサー'), [3.3, -2.4, 4.9], { small: true }); S.label(T('inductor', 'インダクター'), [3.0, -2.4, 3.6], { small: true }); S.label(T('screw base', '口金'), [-2.9, 0, 0.9], { small: true });
        },
        update() { st.bulb.setState(th.ts, P); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-40, 40], y: [-5, 115], equal: true, maxH: 420, axes: false, grid: false });
          f2.poly([[-13.6, 0], [13.6, 0], [13.6, 28], [28.8, 62], [28.8, 66], [-28.8, 66], [-28.8, 62], [-13.6, 28]], { c: 'ink', fill: 'grid', fo: 0.5, w: 1.6 });
          f2.line(L.sample(-0.42, PI + 0.42, 60, (q) => [30 * Math.cos(q), 78.5 + 30 * Math.sin(q)]), { c: 'hl', w: 2 });
        },
      });
    },
  };
})();
