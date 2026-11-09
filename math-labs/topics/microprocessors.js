'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Transistor: the EKV model, valid from weak to strong inversion,
   *   I_D = I_S [F((V_P - V_S)/phi_t) - F((V_P - V_D)/phi_t)], F(v) = ln^2(1 + e^{v/2}), V_P = (V_G - V_T)/n,
   * with drain-induced barrier lowering V_T = V_T0 - eta V_DS and V_T falling about 1 mV per kelvin. In weak inversion
   * I_D grows by a decade every n (kT/q) ln 10 of gate voltage (about 60 mV at room temperature for n = 1).
   * CMOS inverter: the output voltage at which the nMOS and pMOS currents balance. Dynamic power alpha C V^2 f.
   * Lithography: Abbe imaging of a line/space grating (duty 1/2) through a projection lens of numerical aperture NA:
   * diffraction order m of pitch p leaves at sin(theta) = m lambda/p + s, and passes if |m lambda/p + s| <= NA, for each
   * source point s; intensities from the source points add. Rayleigh: half-pitch = k1 lambda/NA.
   */
  const KB = 8.617333262e-5;                        // eV/K
  const phiT = (Tk) => KB * Tk;                     // thermal voltage in V
  const Fekv = (v) => { const e = v / 2; const l = e > 30 ? e : Math.log1p(Math.exp(e)); return l * l; };
  const DEV = { vt0: 0.32, n: 1.25, eta: 0.06, Is: 2.1e-6, tc: -1e-3 };   // per fin; Is in A
  function idrain(vg, vd, Tk = 300, o = DEV, vs = 0) {
    const vt = o.vt0 + o.tc * (Tk - 300) - o.eta * (vd - vs), pt = phiT(Tk), vp = (vg - vt) / o.n;
    return o.Is * (Tk / 300) ** -1.5 * (Tk / 300) ** 2 * (Fekv((vp - vs) / pt) - Fekv((vp - vd) / pt));
  }
  const swing = (Tk = 300, n = DEV.n) => n * phiT(Tk) * Math.LN10 * 1000;    // mV per decade
  // inversion charge (relative) at the source end, for colouring the channel
  const inversion = (vg, Tk = 300, o = DEV) => Fekv((vg - o.vt0 - o.tc * (Tk - 300)) / o.n / phiT(Tk)) ** 0.5;
  // CMOS inverter: nMOS to ground, pMOS to V_DD, the pMOS described by the same law in mirror, width ratio beta
  function inverterOut(vin, vdd, beta = 1.6, Tk = 300) {
    const In = (vo) => idrain(vin, vo, Tk), Ip = (vo) => beta * 0.5 * idrain(vdd - vin, vdd - vo, Tk);   // holes about half as mobile
    let lo = 0, hi = vdd; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (In(m) > Ip(m)) hi = m; else lo = m; }
    const vo = 0.5 * (lo + hi); return { vo, i: In(vo) };
  }
  const dynPower = (alpha, C, V, f) => alpha * C * V * V * f;
  const alphaPowerDelay = (V, vt = 0.32, a = 1.3) => V / Math.pow(Math.max(1e-6, V - vt), a);   // relative gate delay
  // lithography
  const coeff = (m) => (m === 0 ? 0.5 : Math.sin((PI * m) / 2) / (PI * m));          // line/space, duty 1/2
  function sourcePoints(mode, sigma = 0.5) {
    if (mode === 0) return [0];                                                         // coherent, on axis
    if (mode === 1) return Array.from({ length: 9 }, (_, i) => sigma * (-1 + (2 * i) / 8));                 // conventional partial coherence (1D cut)
    return [-0.9, 0.9];                                                                 // dipole, off axis at sigma = 0.9
  }
  function aerial(x, pitch, lambda, NA, mode) {
    const S = sourcePoints(mode); let I = 0, orders = 0;
    for (const s0 of S) {
      const s = s0 * NA; let re = 0, im = 0, k = 0;
      for (let m = -40; m <= 40; m++) { if (Math.abs((m * lambda) / pitch + s) > NA + 1e-12) continue; const c = coeff(m), ph = (TAU * m * x) / pitch; re += c * Math.cos(ph); im += c * Math.sin(ph); k++; }
      I += re * re + im * im; orders += k;
    }
    return { I: I / S.length, orders: orders / S.length };
  }
  const SIGMA = [0, 0.5, 0.9], minPitch = (lambda, NA, mode) => lambda / ((1 + SIGMA[mode]) * NA);   // two orders fit through the pupil
  const k1 = (halfPitch, lambda, NA) => (halfPitch * NA) / lambda;
  const SOURCES = [{ name: ['ArF immersion, 193 nm, NA 1.35', 'ArF 液浸、193 nm、NA 1.35'], lambda: 193, NA: 1.35 }, { name: ['EUV, 13.5 nm, NA 0.33', 'EUV、13.5 nm、NA 0.33'], lambda: 13.5, NA: 0.33 }, { name: ['High-NA EUV, 13.5 nm, NA 0.55', '高 NA EUV、13.5 nm、NA 0.55'], lambda: 13.5, NA: 0.55 }];
  const M = { SIGMA, phiT, Fekv, DEV, idrain, swing, inversion, inverterOut, dynPower, alphaPowerDelay, coeff, sourcePoints, aerial, minPitch, k1, SOURCES };
  (window.LabModels = window.LabModels || {})['microprocessors'] = M;

  /* ================= 1. the FinFET (3D) ================= */
  // display units: 1 = 10 nm. Current flows along +x from source to drain; fins run along x, spaced along y.
  const FW = 0.7, FH = 4.6, FP = 3.0, NF = 3, LG = 2.0, SP = 0.6, GH = 3.2, XS = 5.4;
  D['finfet'] = {
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
        st.leg = L.h('div', '', st.frame);
      }
      const Tk = v.temp + 273.15, I = idrain(v.vg, v.vd, Tk), Ioff = idrain(0, v.vd, Tk), Ion = idrain(v.vdd, v.vdd, Tk);
      L.setText(st.cap1, T(tx`A three-fin FinFET, the transistor of every processor since about 2012, drawn to scale (fins 7 nm wide and 46 nm tall, gate 20 nm long). The metal gate wraps three sides of each fin; over the front fin it is cut away to show the channel. Raising the gate voltage \(V_G\) pulls electrons into a thin inversion layer on the fin surfaces (glowing), and they stream from source to drain.`, tx`3 本のフィンをもつ FinFET です。2012 年ごろからのすべてのプロセッサのトランジスタで、縮尺どおりに描いています（フィンは幅 7 nm、高さ 46 nm、ゲート長は 20 nm）。金属のゲートは各フィンの三つの面を包んでいて、手前のフィンの上では切り取ってチャネルを見せています。ゲート電圧 \(V_G\) を上げるとフィンの表面の薄い反転層に電子が引き寄せられ（光っている部分）、ソースからドレインへ流れます。`));
      L.setText(st.cap2, T(tx`Drain current per fin against gate voltage, on a log scale. Below threshold the current is a diffusion of electrons over a barrier and rises by a decade every \(n\,(kT/q)\ln10\), about 75 mV here; that slope, set by temperature alone, is why transistors cannot be switched off arbitrarily well at low voltage. Drag the gold point.`, tx`フィン 1 本あたりのドレイン電流をゲート電圧に対して対数目盛で描いています。しきい値より下では、電流は障壁を越える電子の拡散で、\(n\,(kT/q)\ln10\)（ここでは約 75 mV）ごとに 10 倍に増えます。温度だけで決まるこの傾きのため、低電圧ではトランジスタをいくらでもよく切ることはできません。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 1], y: [-12, -3], aspect: 0.82, maxH: 360, xlabel: T(tx`gate voltage \(V_G\) (V)`, tx`ゲート電圧 \(V_G\)（V）`), ylabel: tx`\(\log_{10}I_D\) (A)` });
      for (const vd of [0.05, v.vd]) f.line(L.sample(0, 1, 200, (g) => [g, Math.log10(Math.max(1e-13, idrain(g, vd, Tk)))]), { c: vd === v.vd ? 'c1' : 'muted', w: vd === v.vd ? 2.6 : 1.6, dash: vd === v.vd ? null : '5 4' });
      f.vline(DEV.vt0 + DEV.tc * (Tk - 300) - DEV.eta * v.vd, { c: 'c3', dash: '4 4' }); f.text(DEV.vt0 - DEV.eta * v.vd + 0.01, -11.4, tx`\(V_T\)`, { small: true, anchor: 'start', c: 'c3' });
      f.handle(v.vg, Math.log10(Math.max(1e-13, I)), { c: 'hl', axis: 'x', bounds: [0, 1, -12, -3], label: T('gate voltage', 'ゲート電圧'), onDrag: (g) => ctx.set('vg', clamp(Math.round(g * 100) / 100, 0, 1)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T(tx`\(I_D(V_G)\) at this \(V_D\)`, tx`この \(V_D\) での \(I_D(V_G)\)`) }, { c: 'muted', dash: true, label: tx`\(V_D=50\ \mathrm{mV}\)` }, { c: 'c3', dash: true, label: T(tx`threshold \(V_T\) (lowered by \(V_D\))`, tx`しきい値 \(V_T\)（\(V_D\) で下がる）`) }, { kind: 'dot', c: 'hl', label: T('electrons in the channel', 'チャネルの電子') }]);
      ctx.readout([
        { k: T('drain current per fin', 'フィン 1 本あたりのドレイン電流'), v: tx`\(${fmt(I * 1e6, 3)}\ \mu\mathrm{A}\)`, tone: 'key' },
        { k: T(tx`subthreshold swing \(n(kT/q)\ln10\)`, tx`サブスレッショルド・スイング \(n(kT/q)\ln10\)`), v: tx`\(${fmt(swing(Tk), 3)}\ \mathrm{mV/decade}\)` },
        { k: T(tx`on/off ratio \(I_D(V_{DD})/I_D(0)\) at \(V_{DD}\)`, tx`オン/オフ比 \(I_D(V_{DD})/I_D(0)\)（\(V_{DD}\) で）`), v: tx`\(${fmt(Ion / Math.max(1e-30, idrain(0, v.vdd, Tk)), 3)}\)` },
        { k: T('leakage with the gate off', 'ゲートを切ったときの漏れ電流'), v: tx`\(${fmt(Ioff * 1e9, 3)}\ \mathrm{nA}\)` },
      ], T('A processor holds billions of these. Each leaks a few nanoamperes when off, which is why chips draw power even when idle, and why the gate is wrapped round the fin: three-sided control keeps the swing near its thermal limit.', 'プロセッサにはこれが数十億個あります。どれも切れているときに数ナノアンペア漏れるので、チップは何もしていなくても電力を使います。ゲートがフィンを包んでいるのはそのためで、三方から制御するとスイングを熱的な限界の近くに保てます。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.82, maxH: 540, camera: [-12.5, -18, 13], target: [0, 0.3, 1.6], fov: 32,
        label: T('3D FinFET with three fins, a wrap-around gate cut away over the front fin, and electrons flowing. Drag to rotate.', '3 本のフィン、手前のフィンの上を切り取った回り込みゲート、流れる電子をもつ 3D の FinFET。ドラッグで回転できます。'),
        init(S) {
          st.flat = false;
          const TH = S.THREE;
          const si = S.mat('#56606d', { metal: 0.35, rough: 0.3, coat: 0.6 }), oxide = S.mat('#c9d6df', { rough: 0.35, coat: 0.4 }), nitride = S.mat('#e4dfcf', { rough: 0.45, coat: 0.3 });
          const gateM = S.mat('#8f969e', { metal: 0.9, rough: 0.28 }), tin = S.mat('#c9a44c', { metal: 0.9, rough: 0.3 }), hik = S.mat('#3f8f8a', { rough: 0.3, coat: 0.6 }), epi = S.mat('#7f8c9d', { metal: 0.3, rough: 0.35, coat: 0.5 }), cobalt = S.mat('#a8aeb7', { metal: 1, rough: 0.2 }), copper = S.mat('#b87333', { metal: 1, rough: 0.25 });
          const box = (w, d, h, m, x, y, z) => { const b = new TH.Mesh(new TH.BoxGeometry(w, d, h), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; S.add(b); return b; };
          const yOf = (k) => (k - (NF - 1) / 2) * FP, W = (NF - 1) * FP + 3.2;
          // substrate and shallow trench isolation
          box(2 * XS + 1, W + 0.8, 2.4, si, 0, 0, -3.6);
          box(2 * XS + 1, W + 0.8, 2.4, oxide, 0, 0, -1.2);
          // fins: rounded-top silicon ridges running along x
          const finShape = () => { const s = new TH.Shape(); const r = FW / 2; s.moveTo(-r, -2.4); s.lineTo(r, -2.4); s.lineTo(r, FH - r); s.absarc(0, FH - r, r, 0, PI, false); s.lineTo(-r, -2.4); return s; };
          for (let k = 0; k < NF; k++) { const g = new TH.ExtrudeGeometry(finShape(), { depth: 2 * XS, bevelEnabled: false, curveSegments: 12 }); g.rotateY(PI / 2); g.rotateX(PI / 2); g.translate(-XS, yOf(k), 0); const m = new TH.Mesh(g, si); m.castShadow = m.receiveShadow = true; S.add(m); }
          // gate stack: high-k liner, TiN work-function metal and tungsten fill, wrapping fins 2 and 3; spacers on both sides
          const gy0 = (yOf(0) + yOf(1)) / 2, gW = yOf(NF - 1) + 1.6 - gy0, gyc = gy0 + gW / 2;
          const stack = (w, h, m, dx = 0) => box(w, gW, h, m, dx, gyc, h / 2);
          stack(LG, FH + GH, gateM); stack(LG + 0.08, FH + GH - 0.6, tin);
          box(LG, 0.16, FH + GH, hik, 0, gy0 + 0.08, (FH + GH) / 2);
          for (const sx of [-1, 1]) { box(SP, gW, FH + GH, nitride, sx * (LG / 2 + SP / 2), gyc, (FH + GH) / 2); }
          // the exposed channel of the front fin: high-k shell and the glowing inversion layer
          const shell = (r, m) => { const s = new TH.Shape(); const R = r; s.moveTo(-R, 0); s.lineTo(R, 0); s.lineTo(R, FH - FW / 2); s.absarc(0, FH - FW / 2, R, 0, PI, false); s.lineTo(-R, 0); const g = new TH.ExtrudeGeometry(s, { depth: LG, bevelEnabled: false, curveSegments: 12 }); g.rotateY(PI / 2); g.rotateX(PI / 2); g.translate(-LG / 2, yOf(0), 0); const mm = new TH.Mesh(g, m); S.add(mm); return mm; };
          shell(FW / 2 + 0.12, S.mat('#3f8f8a', { opacity: 0.35, rough: 0.2 }));
          st.inv = shell(FW / 2 + 0.03, S.mat('#ffd34d', { glow: 0.9, opacity: 0.85, rough: 0.4 }));
          // raised source and drain: faceted SiGe epitaxy merged over the fins, with cobalt contacts and copper vias
          for (const sx of [-1, 1]) {
            const x0 = sx * (LG / 2 + SP), x1 = sx * XS, cx = (x0 + x1) / 2, len = Math.abs(x1 - x0);
            for (let k = 0; k < NF; k++) { const dia = new TH.Mesh(new TH.CylinderGeometry(1.15, 1.15, len, 4).rotateZ(PI / 2), epi); dia.scale.set(1, 0.95, 1.25); dia.position.set(cx, yOf(k), FH - 0.6); dia.castShadow = true; S.add(dia); }
            box(len * 0.7, W - 1.4, 0.7, cobalt, cx, 0, FH + 0.85);
            const via = new TH.Mesh(new TH.CylinderGeometry(0.55, 0.55, 2.2, 32).rotateX(PI / 2), copper); via.position.set(cx, 0, FH + 2.3); S.add(via);
          }
          const gvia = new TH.Mesh(new TH.CylinderGeometry(0.5, 0.5, 1.6, 32).rotateX(PI / 2), copper); gvia.position.set(0, gyc + 0.6, FH + GH + 0.8); S.add(gvia);
          // electrons: drift along the channel surfaces of all fins (visible on the front fin)
          st.eN = 240; st.el = L.seq(st.eN, (i) => ({ x: -XS + (2 * XS * ((i * 0.618) % 1)), k: i % NF, a: (i * 0.381) % 1 }));
          st.dots = S.points(st.el.map(() => [0, 0, 0]), { c: '#4fb3ff', r: 0.13, max: st.eN, glow: 0.6, rough: 0.3 });
          const lab = (s, p) => S.label(s, p, { small: true });
          lab(T('gate (W fill over TiN)', 'ゲート（TiN の上に W）'), [0, gyc + 1.5, FH + GH + 0.35]);
          S.label(T('fin channel, gate cut away', 'フィンのチャネル（ゲートを切り取り）'), [-0.4, yOf(0) - 0.6, FH + 1.1], { small: true, align: 'end' });
          lab(T('source', 'ソース'), [-XS + 0.6, yOf(0) - 1.9, FH + 0.2]); lab(T('drain', 'ドレイン'), [XS - 1.6, yOf(0) - 1.9, FH + 0.2]);
          S.label(T('trench oxide', 'トレンチ酸化膜'), [XS - 0.4, -(W + 0.8) / 2, -0.9], { small: true, align: 'end' });
          lab(T('spacer', 'スペーサー'), [-(LG / 2 + SP / 2) - 0.3, gyc + 2.8, FH + GH + 0.1]);
          S.label('10 nm', [XS - 1, -(W + 0.8) / 2 - 0.2, -5.1], { small: true, align: 'middle', dy: 18 }); S.lines([[[XS - 1.5, -(W + 0.8) / 2 - 0.2, -5.1], [XS - 0.5, -(W + 0.8) / 2 - 0.2, -5.1]]], { c: 'ink', opacity: 0.9, w: 2 });
          st.flow = 0;
          S.animate((dt) => { if (S.reduced()) return false; st.step?.(Math.min(dt, 0.05)); return true; });
        },
        update(S) {
          const Tk2 = v.temp + 273.15, inv = clamp(Math.log10(1 + 50 * inversion(v.vg, Tk2)) / 2.4, 0, 1), Icur = idrain(v.vg, v.vd, Tk2);
          st.inv.material.opacity = 0.08 + 0.85 * inv; st.inv.material.emissiveIntensity = 0.2 + 1.2 * inv; st.inv.visible = inv > 0.02;
          const speed = clamp(0.25 * (Math.log10(Math.max(1e-13, Icur)) + 12), 0, 2.6), show = Math.round(st.eN * clamp(inv * 1.1, 0.04, 1));
          const place = () => {
            const pts = [];
            for (let i = 0; i < show; i++) {
              const e = st.el[i], yk = (e.k - (NF - 1) / 2) * FP, r = FW / 2 + 0.08, t = e.a, zTop = FH - FW / 2;
              let yy, zz;   // around the fin's cross-section: up the left wall, over the rounded top, down the right wall
              if (t < 0.4) { yy = yk - r; zz = 0.4 + (zTop - 0.4) * (t / 0.4); }
              else if (t < 0.6) { const th = PI * (1 - (t - 0.4) / 0.2); yy = yk + r * Math.cos(th); zz = zTop + r * Math.sin(th); }
              else { yy = yk + r; zz = 0.4 + (zTop - 0.4) * ((1 - t) / 0.4); }
              pts.push([e.x, yy, zz]);
            }
            st.dots.update(pts);
          };
          st.step = (d) => { for (const e of st.el) { e.x += d * speed * 2.2; if (e.x > XS) e.x = -XS; } place(); };
          place(); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const g = L.fig(st.v3, { x: [-XS, XS], y: [-2, 9], equal: true, maxH: 340, axes: false, grid: false });
          g.rect(-XS, -2, 2 * XS, 2, { fill: 'muted', fo: 0.5, nostroke: true }); g.rect(-FW / 2 - 4, 0, 8, FH, { fill: 'c1', fo: 0.3, nostroke: true });
          g.rect(-LG / 2, 0, LG, FH + GH, { fill: 'ink', fo: 0.6, nostroke: true }); g.text(0, FH + GH + 0.5, T('gate', 'ゲート'), { small: true });
        },
      });
    },
  };

  /* ================= 2. CMOS logic ================= */
  D['cmos-inverter'] = {
    render(ctx, v) {
      const vdd = v.vdd, vin = Math.min(v.vin, vdd), beta = v.beta, cur = inverterOut(vin, vdd, beta);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`A CMOS inverter: an n-type transistor to ground and a p-type to the supply \(V_{DD}\), driven by the same input. Exactly one of them conducts at each end, so the output snaps between 0 and \(V_{DD}\) and almost no current flows except while switching. Drag the gold input along the transfer curve.`, tx`CMOS インバータです。グラウンドへの n 型トランジスタと電源 \(V_{DD}\) への p 型トランジスタを同じ入力で駆動します。両端ではちょうど一方だけが導通するので、出力は 0 と \(V_{DD}\) の間で切り替わり、切り替わりの最中以外はほとんど電流が流れません。金色の入力を伝達特性に沿ってドラッグしてください。`));
      const f = L.fig(c1, { x: [0, vdd], y: [0, vdd * 1.14], equal: true, maxH: 340, xlabel: T(tx`input \(V_{\rm in}\) (V)`, tx`入力 \(V_{\rm in}\)（V）`), ylabel: tx`\(V_{\rm out}\) (V)` });
      const vtc = L.sample(0, vdd, 160, (x) => [x, inverterOut(x, vdd, beta).vo]);
      f.line([[0, 0], [vdd, vdd]], { c: 'muted', dash: '3 3', w: 1 });
      f.line(vtc, { c: 'c1', w: 2.8 });
      // switching threshold: Vin = Vout
      let lo = 0, hi = vdd; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (inverterOut(m, vdd, beta).vo > m) lo = m; else hi = m; } const vm = 0.5 * (lo + hi);
      f.dot(vm, vm, { c: 'c3', r: 4.5 }); f.text(vm, vm, tx`\(V_M\)`, { small: true, dx: 8, anchor: 'start', c: 'c3' });
      f.handle(vin, cur.vo, { c: 'hl', axis: 'x', bounds: [0, vdd, 0, vdd], label: T('input', '入力'), onDrag: (x) => ctx.set('vin', clamp(Math.round(x * 100) / 100, 0, 1.2)) });
      L.h('p', 'lab-cap', c2, T(tx`Why chips lower their voltage: each switching event costs energy \(CV_{DD}^2\), so power falls with the square of the voltage, but the transistors deliver less current and every gate gets slower. Energy per operation (orange) against relative gate delay (blue).`, tx`チップが電圧を下げる理由です。切り替えのたびにエネルギー \(CV_{DD}^2\) を使うので、電力は電圧の 2 乗で下がりますが、トランジスタの電流は減り、どのゲートも遅くなります。1 回の演算あたりのエネルギー（橙）と、相対的なゲート遅延（青）を描いています。`));
      const g = L.fig(c2, { x: [0.35, 1.2], y: [0, 4.6], aspect: 0.8, maxH: 340, xlabel: T(tx`supply \(V_{DD}\) (V)`, tx`電源電圧 \(V_{DD}\)（V）`), ylabel: T('relative to 0.75 V', '0.75 V に対する比') });
      const e0 = 0.75 * 0.75, d0 = alphaPowerDelay(0.75);
      g.line(L.sample(0.35, 1.2, 120, (V) => [V, (V * V) / e0]), { c: 'c2', w: 2.4 });
      g.line(L.sample(0.4, 1.2, 120, (V) => [V, Math.min(4, alphaPowerDelay(V) / d0)]), { c: 'c1', w: 2.4 });
      g.vline(vdd, { c: 'hl', w: 1.6, dash: '3 3' });
      g.handle(vdd, (vdd * vdd) / e0, { c: 'hl', axis: 'x', bounds: [0.35, 1.2, 0, 4], label: T('supply voltage', '電源電圧'), onDrag: (x) => ctx.set('vdd', clamp(Math.round(x * 100) / 100, 0.35, 1.2)) });
      L.legend(ctx.host, [{ c: 'c1', label: T(tx`transfer curve \(V_{\rm out}(V_{\rm in})\); gate delay`, tx`伝達特性 \(V_{\rm out}(V_{\rm in})\)、ゲート遅延`) }, { c: 'c2', label: T(tx`energy per switch \(\propto CV_{DD}^2\)`, tx`切り替えあたりのエネルギー \(\propto CV_{DD}^2\)`) }, { kind: 'dot', c: 'c3', label: T(tx`switching threshold \(V_M\)`, tx`スイッチングしきい値 \(V_M\)`) }]);
      const P = dynPower(0.1, 1e-9, vdd, 4e9);
      ctx.readout([
        { k: T('output', '出力'), v: tx`\(V_{\rm out}=${fmt(cur.vo, 3)}\ \mathrm{V}\)`, tone: 'key' },
        { k: T('current through both transistors', '両方のトランジスタを流れる電流'), v: tx`\(${fmt(cur.i * 1e6, 3)}\ \mu\mathrm{A}\)` },
        { k: T(tx`switching threshold \(V_M\)`, tx`スイッチングしきい値 \(V_M\)`), v: tx`\(${fmt(vm, 3)}\ \mathrm{V}\)` },
        { k: T(tx`chip power \(\alpha CV^2f\), \(\alpha=0.1\), \(C=1\) nF, \(f=4\) GHz`, tx`チップの電力 \(\alpha CV^2f\)、\(\alpha=0.1\)、\(C=1\) nF、\(f=4\) GHz`), v: tx`\(${fmt(P, 3)}\ \mathrm{W}\)` },
      ], T('The current through the inverter peaks only in the middle of the transition, when both transistors are partly on; at either logic level one of them is off and only leakage flows.', 'インバータを流れる電流が最大になるのは、両方のトランジスタが一部導通している遷移の中ほどだけです。どちらの論理レベルでも一方は切れていて、流れるのは漏れ電流だけです。'));
    },
  };

  /* ================= 3. lithography (3D resist) ================= */
  D['lithography'] = {
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
        st.leg = L.h('div', '', st.frame);
      }
      const src = SOURCES[v.src], p = v.pitch, mode = v.illum, thr = v.dose;
      const img = (x) => aerial(x, p, src.lambda, src.NA, mode).I, orders = aerial(0, p, src.lambda, src.NA, mode).orders;
      let Imax = 0, Imin = 9; for (let i = 0; i <= 200; i++) { const q = img((i / 200) * p); Imax = Math.max(Imax, q); Imin = Math.min(Imin, q); }
      const contrast = (Imax - Imin) / (Imax + Imin + 1e-12), prints = Imax > thr && Imin < thr;
      L.setText(st.cap1, T(tx`What the scanner prints: lines of photoresist on a silicon wafer, from a mask of equal lines and spaces at pitch \(p\). Where the light exceeds the dose threshold the resist dissolves. Below the resolution limit the image washes out and nothing prints. The resist is 30 nm thick, drawn to scale with the pitch.`, tx`露光装置が焼き付けるもの：ピッチ \(p\) の等しい線と間隔のマスクから、シリコンウエハーの上にできるフォトレジストの線です。光が露光量のしきい値を超えたところでレジストが溶けます。解像限界より下では像がぼやけ、何も焼き付きません。レジストの厚さは 30 nm で、ピッチと同じ縮尺で描いています。`));
      L.setText(st.cap2, T(tx`The aerial image: light intensity at the wafer over two periods, built only from the diffraction orders that fit through the lens, \(|m\lambda/p+s|\le\mathrm{NA}\). Tilting the illumination off axis lets the first order through at half the pitch. Drag the gold line to set the dose threshold.`, tx`空間像：レンズを通り抜けられる回折次数 \(|m\lambda/p+s|\le\mathrm{NA}\) だけから作られる、ウエハー上の 2 周期分の光の強度です。照明を軸から傾けると、半分のピッチでも 1 次光が通れます。金色の線をドラッグして露光量のしきい値を決めてください。`));
      st.g2.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 2 * p], y: [0, Math.max(1.1, Imax * 1.1)], aspect: 0.75, maxH: 330, xlabel: T(tx`position on the wafer \(x\) (nm)`, tx`ウエハー上の位置 \(x\)（nm）`), ylabel: T('intensity', '強度') });
      for (let k = 0; k < 2; k++) f.rect(k * p + p / 4, 0, p / 2, 0.06, { fill: 'ink', fo: 0.75, nostroke: true });
      f.area(L.sample(0, 2 * p, 300, (x) => [x, img(x)]), { c: 'c2', fo: 0.18 }); f.line(L.sample(0, 2 * p, 300, (x) => [x, img(x)]), { c: 'c2', w: 2.6 });
      f.line([[0, thr], [2 * p, thr]], { c: 'hl', w: 1.6 });
      f.handle(0.06 * p, thr, { c: 'hl', axis: 'y', bounds: [0.06 * p, 0.06 * p, 0.05, 1], label: T('dose threshold', '露光量のしきい値'), onDrag: (x, y) => ctx.set('dose', clamp(Math.round(y * 100) / 100, 0.05, 1)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('aerial image intensity', '空間像の強度') }, { kind: 'fill', c: 'ink', label: T('mask openings', 'マスクの開口') }, { c: 'hl', label: T('dose threshold', '露光量のしきい値') }]);
      ctx.readout([
        { k: T(tx`half-pitch \(k_1=\tfrac{p}{2}\,\mathrm{NA}/\lambda\)`, tx`ハーフピッチの \(k_1=\tfrac{p}{2}\,\mathrm{NA}/\lambda\)`), v: fmt(k1(p / 2, src.lambda, src.NA), 3), tone: k1(p / 2, src.lambda, src.NA) < 0.25 ? 'warn' : undefined },
        { k: T('diffraction orders through the lens (average)', 'レンズを通る回折次数（平均）'), v: fmt(orders, 3) },
        { k: T(tx`smallest pitch with this illumination, \(\lambda/((1+\sigma)\mathrm{NA})\)`, tx`この照明での最小ピッチ \(\lambda/((1+\sigma)\mathrm{NA})\)`), v: tx`\(${fmt(minPitch(src.lambda, src.NA, mode), 3)}\ \mathrm{nm}\)` },
        { k: T('image contrast; prints?', '像のコントラスト、焼き付くか'), v: `${fmt(contrast, 3)}; ${prints ? T('yes', 'はい') : T('no', 'いいえ')}`, tone: prints ? 'good' : 'warn' },
      ], T('With a single order the image is uniform: a lens needs at least two orders to form fringes. That is the whole reason for shorter wavelengths, larger lenses, immersion in water and off-axis light, and why patterns finer than about 40 nm pitch need EUV or several exposures.', '次数が一つだけだと像は一様になります。縞を作るには少なくとも二つの次数がレンズを通らなければなりません。これが、より短い波長、より大きなレンズ、水への液浸、軸外し照明が必要な理由のすべてで、ピッチがおよそ 40 nm より細かいパターンに EUV か複数回の露光が必要な理由です。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.78, maxH: 520, camera: [-7.4, -11.6, 8.2], target: [0.3, 0.4, -0.2], fov: 32,
        label: T('3D wafer section with printed photoresist lines. Drag to rotate.', '焼き付いたフォトレジストの線をもつ 3D のウエハー断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false;
          const TH = S.THREE;
          const wafer = new TH.Mesh(new TH.BoxGeometry(8.4, 6.4, 1.2), S.mat('#4f5a66', { metal: 0.55, rough: 0.18, coat: 0.9, iridescence: 0.3 })); wafer.position.z = -0.6; S.add(wafer);
          const hm = new TH.Mesh(new TH.BoxGeometry(8.4, 6.4, 0.12), S.mat('#2c2f34', { metal: 0.2, rough: 0.3, coat: 0.6 })); hm.position.z = 0.06; S.add(hm);
          st.resist = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 360, nv: 2, c: '#c8552f', rough: 0.25, coat: 0.9, side: TH.DoubleSide });
          st.resistSide = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 360, nv: 1, c: '#a8432a', rough: 0.3, coat: 0.6 });
          st.lab = S.label('', [0, 3.3, 2.2], { small: true, align: 'middle' });
          S.label(T('silicon wafer with hard mask', 'ハードマスク付きのシリコンウエハー'), [4.2, -3.3, -1.25], { small: true, align: 'end', dy: 20 });
        },
        update(S) {
          // the patch shows about 8 periods (or 260 nm, whichever is less); height = resist where the dose stays below threshold
          const span = Math.min(8 * p, 260), sc = 8 / span, H = 30 * sc;
          const blurred = (x) => { let s = 0; for (const d of [-2, -1, 0, 1, 2]) s += img(x + d * 0.012 * p) * [1, 4, 6, 4, 1][d + 2]; return s / 16; };
          const hgt = (x) => { const q = blurred(x); return q < thr ? H * Math.min(1, (thr - q) / (0.08 * thr + 1e-9)) : 0; };
          st.resist.update((u, w) => { const x = -span / 2 + span * u; const h = hgt(x); return [x * sc, -3.2 + 6.4 * w, h > 0 ? 0.12 + h : 0.09]; });
          st.resistSide.update((u, w) => { const x = -span / 2 + span * u; return [x * sc, -3.2, 0.12 + w * hgt(x)]; });
          st.lab.set(null, tx`\(p=${fmt(p, 3)}\ \mathrm{nm}\), ${T(src.name[0], src.name[1])}`);
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const g = L.fig(st.v3, { x: [0, 4 * p], y: [0, 1], aspect: 0.3, maxH: 200, axes: false, grid: false });
          g.raster((x) => (img(x) < thr ? 1 : 0), { cmap: 'warm', res: 2 });
        },
      });
    },
  };
})();
