'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * The puck is a porous bed and water moves through it by Darcy's law, Q = k A dp / (mu L).
   * Permeability scales with the square of grain size, k = K0 (d / 300 um)^2, with K0 fitted so that a normal
   * shot (18 g, 9 bar, 93 C) runs at 1.5 mL/s. Depth L = dose / (rho_bulk A) in a 58 mm basket.
   * Viscosity of water from the Vogel equation. Extraction is first order with a time constant that goes as d^2.
   * Vibratory pump: p = PMAX (1 - Q / QMAX). The over-pressure valve returns surplus flow above its setting.
   */
  const AREA = PI * 0.029 ** 2, RHO_B = 620, K0 = 2.1e-15, PMAX = 15, QMAX = 10.8, POR = 0.2, EYMAX = 0.30;
  const visc = (Tc) => 2.414e-5 * 10 ** (247.8 / (Tc + 133.15));                                  // Pa s
  const perm = (d) => K0 * (d / 300) ** 2;                                                         // m^2, d in micrometres
  const depth = (dose) => dose / 1000 / (RHO_B * AREA);                                            // m, dose in g
  const flow = (d, dose, bar, Tc = 93) => (perm(d) * AREA * bar * 1e5) / (visc(Tc) * depth(dose)) * 1e6;   // mL/s
  const resistance = (d, dose, Tc = 93) => 1 / flow(d, dose, 1, Tc);                               // bar per (mL/s)
  const shotTime = (d, dose, bar, ratio = 2, Tc = 93) => (ratio * dose) / flow(d, dose, bar, Tc);  // s
  const tau = (d) => 22 * (d / 300) ** 2;
  const ey = (d, t) => EYMAX * (1 - Math.exp(-t / tau(d)));
  const tds = (d, dose, bar, ratio = 2, Tc = 93) => ey(d, shotTime(d, dose, bar, ratio, Tc)) / ratio;
  const poreSpeed = (q) => (q * 1e-6) / (AREA * POR);                                              // m/s
  const pumpQ = (p) => QMAX * Math.max(0, 1 - p / PMAX);
  function operate(R, opv) { const pFree = (PMAX * R * QMAX) / (PMAX + R * QMAX), p = Math.min(pFree, opv), q = p / R; return { pFree, p, q, pump: pumpQ(p), bypass: Math.max(0, pumpQ(p) - q), open: pFree > opv }; }
  const heatPower = (q, Tc, T0 = 20) => (q / 1000) * 4186 * (Tc - T0);                             // W
  const M = { AREA, K0, PMAX, QMAX, POR, visc, perm, depth, flow, resistance, shotTime, tau, ey, tds, poreSpeed, pumpQ, operate, heatPower };
  (window.LabModels = window.LabModels || {})['espresso-machines'] = M;

  /* ================= 1. flow through the puck ================= */
  D['puck-flow'] = {
    render(ctx, v) {
      const q = flow(v.d, v.dose, v.bar), t = shotTime(v.d, v.dose, v.bar), e = ey(v.d, t), s = tds(v.d, v.dose, v.bar);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Seconds to deliver a shot weighing twice the dose, against how coarsely the coffee is ground, at \(${fmt(v.bar, 1)}\) bar. Halving the grain size cuts the flow to a quarter, so the time is very sensitive to the grinder. The band marks the 25 to 30 seconds most recipes aim for. Drag the gold point.`, tx`粉の量の 2 倍の重さの抽出液を得るまでの秒数を、挽き目の粗さに対して、\(${fmt(v.bar, 1)}\) bar の場合について描いています。粒の大きさを半分にすると流量は 4 分の 1 になるので、時間はグラインダーの設定にとても敏感です。帯は、多くのレシピが目安とする 25 秒から 30 秒を示します。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [200, 450], y: [0, 80], aspect: 0.7, maxH: 350, xlabel: T('grain size (micrometres)', '粒の大きさ（マイクロメートル）'), ylabel: T('shot time (s)', '抽出時間（秒）') });
      a.rect(200, 25, 250, 5, { c: 'c3', fill: 'c3', fo: 0.14, nostroke: true, layer: 'under' });
      [6, 12].filter((b) => Math.abs(b - v.bar) > 0.4).forEach((b) => a.line(L.sample(200, 450, 60, (d) => Math.min(80, shotTime(d, v.dose, b))), { c: 'muted', w: 1.3 }));
      a.line(L.sample(200, 450, 80, (d) => Math.min(80, shotTime(d, v.dose, v.bar))), { c: 'c1', w: 2.8 });
      a.handle(v.d, Math.min(80, t), { c: 'hl', axis: 'x', bounds: [200, 450, 0, 80], label: T('grain size', '粒の大きさ'), onDrag: (x) => ctx.set('d', clamp(Math.round(x / 10) * 10, 200, 450)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How much of the dry coffee has dissolved into the cup against time, for this grind (blue) and for one a third coarser and a third finer. Fine grains give up their solubles sooner because the water has less far to reach inside each one. The band marks 18 to 22 per cent, between sour and bitter.`, tx`乾いた粉のうち、カップに溶け出した割合を、時間に対して描いています。青はこの挽き目、灰色は 3 分の 1 粗い場合と細かい場合です。細かい粒は、水が粒の内部に届くまでの距離が短いので、早く成分を出します。帯は、酸っぱさと苦さの間にあたる 18 % から 22 % を示します。`));
      const b = L.fig(c2, { x: [0, 60], y: [0, 30], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('extracted (% of the dose)', '抽出された割合（粉の %）') });
      b.rect(0, 18, 60, 4, { c: 'c3', fill: 'c3', fo: 0.14, nostroke: true, layer: 'under' });
      [v.d * 4 / 3, v.d * 2 / 3].forEach((d) => b.line(L.sample(0, 60, 80, (x) => 100 * ey(d, x)), { c: 'muted', w: 1.3 }));
      b.line(L.sample(0, 60, 80, (x) => 100 * ey(v.d, x)), { c: 'c1', w: 2.8 }); if (t <= 60) { b.vline(t, { c: 'c2', dash: '4 3' }); b.dot(t, 100 * e, { c: 'hl', r: 6 }); }
      L.legend(ctx.host, [{ c: 'c1', label: T('this grind and pressure', 'この挽き目と圧力') }, { c: 'muted', label: T('6 and 12 bar; coarser and finer grinds', '6 bar と 12 bar、粗い挽き目と細かい挽き目') }, { c: 'c2', dash: true, label: T('when the shot stops', '抽出を止める時刻') }]);
      ctx.readout([
        { k: T('depth of the puck', '粉の層の厚さ'), v: tx`\(${fmt(depth(v.dose) * 1000, 1)}\ \mathrm{mm}\)` },
        { k: T('flow', '流量'), v: tx`\(${fmt(q, 2)}\ \mathrm{mL/s}\)`, tone: 'key' },
        { k: T('time for ' + fmt(2 * v.dose, 0) + ' g in the cup', 'カップに ' + fmt(2 * v.dose, 0) + ' g 入るまでの時間'), v: tx`\(${fmt(t, 0)}\ \mathrm{s}\)`, tone: t < 20 || t > 35 ? 'warn' : 'good' },
        { k: T('extracted from the coffee', '粉から抽出された割合'), v: tx`\(${fmt(100 * e, 1)}\ \%\)`, tone: e < 0.18 || e > 0.22 ? 'warn' : 'good' },
        { k: T('strength of the drink', '飲み物の濃さ'), v: tx`\(${fmt(100 * s, 1)}\ \%\ \text{${T('dissolved solids', '溶けた固形分')}}\)` },
      ], T(e < 0.18 ? 'Under-extracted: the acids come out first, so a fast shot tastes sour and thin. Grind finer.' : e > 0.22 ? 'Over-extracted: the last compounds to dissolve are bitter and drying. Grind coarser.' : 'In the usual range. Filter coffee is about 1.3 per cent dissolved solids; espresso is seven times as strong.', e < 0.18 ? '抽出不足です。酸が先に出るので、速すぎる抽出は酸っぱく薄い味になります。もっと細かく挽きます。' : e > 0.22 ? '抽出過多です。最後に溶け出す成分は苦く、渋みがあります。もっと粗く挽きます。' : '普通の範囲です。ドリップコーヒーの溶けた固形分は約 1.3 % で、エスプレッソはその 7 倍の濃さです。'));
    },
  };

  /* ================= 2. the machine (3D) ================= */
  function buildMachine(S) {
    const TH = S.THREE, g = new TH.Group(), T0 = PI / 2, CUT = PI * 1.5;                           // 1 unit = 100 mm, z up
    const steel = S.mat('#d0d4d9', { metal: 1, rough: 0.22 }), dark = S.mat('#24262a', { metal: 0.6, rough: 0.5 }), brass = S.mat('#c79a46', { metal: 1, rough: 0.3 }), copper = S.mat('#c0733f', { metal: 1, rough: 0.32 }), black = S.mat('#17181a', { rough: 0.6 }), glass = S.mat('#bfd6e2', { rough: 0.05, coat: 1, opacity: 0.22 }), water = S.mat('#6fb2d9', { rough: 0.1, coat: 1, opacity: 0.5 }), coffee = S.mat('#3b2212', { rough: 0.95, coat: 0 }), crema = S.mat('#b9834a', { rough: 0.6 }), china = S.mat('#f2efe8', { rough: 0.3, coat: 0.6 });
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const lathe = (pts, mat, x, y, t0 = T0, len = CUT) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0], q[1])), 56, t0, len).rotateX(PI / 2), mat); m.position.set(x, y, 0); m.castShadow = true; g.add(m); return m; };
    const cyl = (r, h, x, y, z, mat, axis) => { const geo = new TH.CylinderGeometry(r, r, h, 28); if (axis === 'z') geo.rotateX(PI / 2); if (axis === 'x') geo.rotateZ(PI / 2); const m = new TH.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    // case: base, back and left panels, and the open frame of the rest
    box(2.4, 3.2, 0.12, 0, 0.1, 0.06, dark); box(2.4, 0.06, 3.3, 0, 1.67, 1.77, steel); box(0.06, 1.9, 3.3, -1.17, 0.72, 1.77, steel);
    box(2.4, 1.3, 0.22, 0, -0.85, 0.23, steel); for (let k = -5; k <= 5; k++) box(0.06, 1.2, 0.02, k * 0.2, -0.85, 0.35, dark);
    S.lines([[[1.2, -0.2, 0.12], [1.2, -0.2, 3.42]], [[1.2, -0.2, 3.42], [1.2, 1.7, 3.42]], [[1.2, -0.2, 3.42], [-1.2, -0.2, 3.42]], [[1.2, 1.7, 0.12], [1.2, 1.7, 3.42]], [[1.2, -0.2, 0.12], [1.2, 1.7, 0.12]]], { c: 'muted', opacity: 0.7, w: 1.4 });
    // tank with water
    box(0.8, 0.6, 2.4, 0.6, 1.25, 1.4, glass).castShadow = false; box(0.74, 0.54, 1.5, 0.6, 1.25, 0.98, water).castShadow = false;
    // vibratory pump: solenoid coil round a brass body
    cyl(0.14, 0.9, 0.55, 0.3, 0.6, brass, 'y'); cyl(0.26, 0.42, 0.55, 0.3, 0.6, copper, 'y'); box(0.6, 0.5, 0.1, 0.55, 0.3, 0.3, dark);
    // boiler: brass shell cut open, water inside, heating element
    lathe([[0.001, 1.0], [0.42, 1.0], [0.46, 1.04], [0.46, 2.26], [0.42, 2.3], [0.001, 2.3], [0.001, 2.26], [0.4, 2.26], [0.42, 2.24], [0.42, 1.06], [0.4, 1.04], [0.001, 1.04]], brass, -0.5, 0.55);
    lathe([[0.001, 1.045], [0.415, 1.045], [0.415, 2.15], [0.001, 2.15]], water, -0.5, 0.55).castShadow = false;
    { const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * TAU * 3.5; pts.push([-0.5 + 0.22 * Math.cos(a), 0.55 + 0.22 * Math.sin(a), 1.15 + 0.7 * u]); } g.add(S.tube(pts, { r: 0.035, add: false, radial: 8, segments: 200 })); g.children[g.children.length - 1].material = S.mat('#3a3d42', { metal: 0.8, rough: 0.45, glow: 0.9, glowColour: '#ff5a2a' }); }
    // pipework
    const pipe = (pts) => { const t = S.tube(pts, { r: 0.04, add: false, radial: 10, segments: 80 }); t.material = copper; g.add(t); };
    pipe([[0.6, 1.25, 0.25], [0.6, 1.0, 0.25], [0.55, 0.85, 0.6], [0.55, 0.75, 0.6]]); pipe([[0.55, -0.15, 0.6], [0.55, -0.1, 0.6], [0.0, -0.05, 0.75], [-0.5, 0.3, 0.8], [-0.5, 0.55, 1.0]]);
    pipe([[-0.5, 0.55, 2.3], [-0.5, 0.55, 2.7], [-0.3, 0.1, 2.85], [0, -0.6, 2.75], [0, -0.85, 2.45], [0, -0.85, 2.3]]);
    // group head, cut open: brass block, water space, shower screen
    lathe([[0.03, 2.3], [0.4, 2.3], [0.4, 1.92], [0.36, 1.92], [0.36, 2.0], [0.3, 2.02], [0.3, 2.12], [0.03, 2.12]], brass, 0, -0.85); box(0.5, 0.7, 0.3, 0, -0.42, 2.15, steel);
    lathe([[0.001, 2.0], [0.295, 2.0], [0.295, 2.012], [0.001, 2.012]], steel, 0, -0.85);
    // portafilter: basket, puck, spouts, handle
    lathe([[0.001, 1.72], [0.26, 1.72], [0.3, 1.76], [0.3, 1.99], [0.345, 1.99], [0.345, 1.7], [0.3, 1.62], [0.06, 1.58], [0.001, 1.58]], steel, 0, -0.85);
    lathe([[0.001, 1.74], [0.265, 1.74], [0.29, 1.77], [0.29, 1.865], [0.001, 1.865]], coffee, 0, -0.85);
    cyl(0.05, 0.14, 0, -0.85, 1.52, steel, 'z');
    { const h = cyl(0.085, 1.3, -0.62, -1.47, 1.72, black, 'y'); h.rotation.z = -PI / 4; }
    // cup, cut open, and the coffee in it
    lathe([[0.001, 0.37], [0.2, 0.37], [0.3, 0.5], [0.34, 0.92], [0.31, 0.92], [0.275, 0.52], [0.19, 0.4], [0.001, 0.4]], china, 0, -0.85);
    const liquid = new TH.Mesh(new TH.CylinderGeometry(0.27, 0.2, 1, 40, 1, false, T0, CUT).rotateX(PI / 2), coffee); liquid.position.set(0, -0.85, 0.4); g.add(liquid);
    const top = new TH.Mesh(new TH.CircleGeometry(0.27, 40, T0, CUT), crema); top.position.set(0, -0.85, 0.4); g.add(top);
    const stream = cyl(0.016, 1, 0, -0.85, 1, coffee, 'z'); stream.castShadow = false;
    const dots = S.lines([], { c: 'c1', opacity: 0.95, w: 3 });
    S.add(g);
    const path = [[0.6, 1.25, 0.25], [0.6, 1.0, 0.25], [0.55, 0.85, 0.6], [0.55, -0.15, 0.6], [0.0, -0.05, 0.75], [-0.5, 0.3, 0.8], [-0.5, 0.55, 1.0], [-0.5, 0.55, 2.3], [-0.5, 0.55, 2.7], [-0.3, 0.1, 2.85], [0, -0.6, 2.75], [0, -0.85, 2.45], [0, -0.85, 2.02]];
    const seg = []; let tot = 0; for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); seg.push(d); tot += d; }
    const at = (s) => { s = ((s % tot) + tot) % tot; for (let i = 0; i < seg.length; i++) { if (s <= seg[i]) { const u = s / seg[i]; return path[i].map((c, k) => c + (path[i + 1][k] - c) * u); } s -= seg[i]; } return path[path.length - 1]; };
    return { liquid, top, stream, dots, at, tot };
  }
  D['espresso-machine'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const dose = 18, Lmm = depth(dose) * 1000, q = flow(300, dose, v.bar, v.temp), ps = poreSpeed(q), t = (2 * dose) / q; st.q = { q, t };
      L.setText(st.cap1, T(tx`A single-boiler espresso machine with its side panel off. Water leaves the tank, the pump raises it to \(${fmt(v.bar, 1)}\) bar, the boiler heats it to \(${fmt(v.temp, 0)}\) °C, and it arrives at the group head above a compacted puck of ground coffee held in the portafilter. The blue dashes follow the water.`, tx`側面のパネルを外した、シングルボイラーのエスプレッソマシンです。水はタンクを出て、ポンプで \(${fmt(v.bar, 1)}\) bar まで加圧され、ボイラーで \(${fmt(v.temp, 0)}\) °C に熱せられ、ポルタフィルターに押し固めたコーヒーの粉の層の上、グループヘッドに届きます。青い破線が水の流れを示します。`));
      L.setText(st.cap2, T(tx`Pressure of the water against depth in the puck. Everything upstream is at pump pressure and the cup is open to the air, so the whole drop happens across \(${fmt(Lmm, 1)}\) mm of coffee. That gradient is what drives the flow. Drag the gold point.`, tx`粉の層の中での水の圧力を、深さに対して描いています。上流はすべてポンプの圧力にあり、カップは大気に開いているので、圧力の降下はすべて、厚さ \(${fmt(Lmm, 1)}\) mm のコーヒーの中で起こります。この勾配が流れを生みます。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [-4, 16], y: [0, 13], aspect: 0.8, maxH: 400, xlabel: T('depth below the top of the puck (mm)', '粉の層の上面からの深さ（mm）'), ylabel: T('pressure above the air (bar)', '大気より高い圧力（bar）') });
      g.rect(0, 0, Lmm, 13, { c: 'c2', fill: 'c2', fo: 0.12, nostroke: true, layer: 'under' }); g.text(Lmm * 0.3, 0.7, T('coffee', 'コーヒー'), { small: true, anchor: 'middle' }); g.text(-2, 1.2, T('water', '水'), { small: true, anchor: 'middle' }); g.text(Lmm + 2.4, 1.2, T('cup', 'カップ'), { small: true, anchor: 'middle' });
      g.line([[-4, v.bar], [0, v.bar], [Lmm, 0], [16, 0]], { c: 'c1', w: 2.8 });
      g.handle(-2, v.bar, { c: 'hl', axis: 'y', bounds: [-4, 16, 3, 12], label: T('pump pressure', 'ポンプの圧力'), onDrag: (x, y) => ctx.set('bar', clamp(Math.round(y * 2) / 2, 3, 12)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('pressure of the water', '水の圧力') }, { c: 'c2', label: T('the puck', '粉の層') }]);
      ctx.readout([
        { k: T('pressure gradient in the puck', '粉の層の中の圧力勾配'), v: tx`\(${fmt(v.bar / Lmm, 2)}\ \mathrm{bar/mm}\)` },
        { k: T('flow into the cup', 'カップへの流量'), v: tx`\(${fmt(q, 2)}\ \mathrm{mL/s}\)`, tone: 'key' },
        { k: T('speed of the water between the grains', '粒の間を流れる水の速さ'), v: tx`\(${fmt(ps * 1000, 1)}\ \mathrm{mm/s}\)` },
        { k: T('time each drop spends in the coffee', '水滴がコーヒーの中にいる時間'), v: tx`\(${fmt(depth(dose) / ps, 1)}\ \mathrm{s}\)` },
        { k: T('heater power to keep up with the flow', '流量に見合うヒーターの電力'), v: tx`\(${fmt(heatPower(q, v.temp), 0)}\ \mathrm{W}\)`, tone: 'good' },
        { k: T('force on the puck', '粉の層にかかる力'), v: tx`\(${fmt((v.bar * 1e5 * AREA) / 9.81, 0)}\ \mathrm{kg}\)` },
      ], T('Hotter water is thinner: at 93 °C its viscosity is a third of what it is from the tap, so the same puck passes three times the flow it would cold.', '熱い水ほどさらさらしています。93 °C での粘度は水道水の 3 分の 1 なので、同じ粉の層でも、冷たい水の 3 倍の流量が通ります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1 : 0.9, maxH: 580, camera: [6.4, -6.6, 4.2], target: [0, 0.1, 1.6], fov: 30,
        label: T('3D espresso machine with its side panel off. Drag to rotate.', '側面のパネルを外したエスプレッソマシンの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.mc = buildMachine(S); st.t = 0;
          S.label(T('tank', 'タンク'), [0.6, 1.25, 2.85], { small: true }); S.label(T('pump', 'ポンプ'), [1.35, 0.3, 0.75], { small: true }); S.label(T('boiler', 'ボイラー'), [-0.5, 0.55, 2.55], { small: true }); S.label(T('group head', 'グループヘッド'), [0, -1.55, 2.6], { small: true }); S.label(T('puck', '粉の層'), [0.8, -1.5, 1.72], { small: true });
          const draw = (dt) => { const m = st.mc, qq = st.q; st.t += dt * (0.5 + qq.q / 1.5);
            const sg = []; for (let k = 0; k < 16; k++) { const s = (st.t * 0.9 + (k / 16) * m.tot); sg.push([m.at(s), m.at(s + 0.16)]); } m.dots.update(sg);
            const fill = clamp((st.t % 8) / 6, 0, 1), h = 0.04 + 0.34 * fill; m.liquid.scale.z = h; m.liquid.position.z = 0.4 + h / 2; m.top.position.z = 0.401 + h;
            const z0 = 0.4 + h, z1 = 1.46; m.stream.scale.z = z1 - z0; m.stream.position.z = (z0 + z1) / 2; m.stream.visible = fill < 1; };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-4, 34], y: [-2, 36], equal: true, maxH: 320, axes: false, grid: false }); f2.rect(0, 1, 30, 33, { c: 'ink', fill: 'grid', fo: 0.3, w: 1.6 }); f2.rect(20, 6, 7, 24, { c: 'c1', fill: 'c1', fo: 0.25 }); f2.rect(8, 10, 9, 13, { c: 'c2', fill: 'c2', fo: 0.3 }); f2.rect(-3, 17, 7, 3, { c: 'ink', fill: 'ink', fo: 0.6 }); f2.line([[23, 6], [23, 3], [12, 3], [12, 10]], { c: 'c1', w: 2 }); f2.line([[12, 23], [12, 28], [0, 28], [0, 20]], { c: 'c1', w: 2 }); },
      });
    },
  };

  /* ================= 3. pump, puck and valve ================= */
  D['pump-and-valve'] = {
    render(ctx, v) {
      const R = resistance(v.d, 18), op = operate(R, v.opv), t = 36 / op.q, e = ey(v.d, t);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Pressure against flow. The pump (blue) delivers less the harder it has to push; the puck (red) passes more the harder it is pushed. Left alone they would settle where the lines cross, at \(${fmt(op.pFree, 1)}\) bar. The over-pressure valve opens at its setting (dashed) and sends the surplus back to the tank, so the puck sees no more than that. Drag the gold point.`, tx`圧力を流量に対して描いています。ポンプ（青）は、強く押さなければならないほど流量が減ります。粉の層（赤）は、強く押されるほど多く流します。何もしなければ、二つの線が交わる \(${fmt(op.pFree, 1)}\) bar に落ち着きます。過圧弁は設定値（破線）で開いて余分な水をタンクへ戻すので、粉の層にはそれ以上の圧力がかかりません。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 11], y: [0, 16], aspect: 0.7, maxH: 350, xlabel: T('flow (mL/s)', '流量（mL/s）'), ylabel: T('pressure (bar)', '圧力（bar）') });
      a.line([[0, PMAX], [QMAX, 0]], { c: 'c1', w: 2.6 }); a.line([[0, 0], [Math.min(11, 16 / R), Math.min(16, 11 * R)]], { c: 'c2', w: 2.6 }); a.hline(v.opv, { c: 'muted', dash: '5 4' });
      if (op.open) { a.seg([op.q, op.p], [op.pump, op.p], { c: 'c3', w: 4 }); a.dot(op.pump, op.p, { c: 'c1', r: 4.5 }); }
      a.handle(op.q, op.p, { c: 'hl', axis: 'y', bounds: [0, 11, 6, 15], label: T('valve setting', '弁の設定値'), onDrag: (x, y) => ctx.set('opv', clamp(Math.round(y * 2) / 2, 6, 15)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Pressure at the puck against grain size, with the valve (blue) and without it (grey). A fine grind chokes the flow and an unregulated pump climbs toward its limit of \(${PMAX}\) bar; a coarse grind lets the water through so easily that the pump cannot reach the setting at all.`, tx`粉の層にかかる圧力を、粒の大きさに対して、弁がある場合（青）とない場合（灰色）について描いています。細かく挽くと流れが詰まり、調圧のないポンプは上限の \(${PMAX}\) bar に向かって上がります。粗く挽くと水が簡単に通り抜け、ポンプは設定値に届きません。`));
      const b = L.fig(c2, { x: [200, 600], y: [0, 16], aspect: 0.7, maxH: 350, xlabel: T('grain size (micrometres)', '粒の大きさ（マイクロメートル）'), ylabel: T('pressure at the puck (bar)', '粉の層にかかる圧力（bar）') });
      b.line(L.sample(200, 600, 80, (d) => operate(resistance(d, 18), 99).p), { c: 'muted', w: 1.6 }); b.line(L.sample(200, 600, 80, (d) => operate(resistance(d, 18), v.opv).p), { c: 'c1', w: 2.8 }); b.dot(v.d, op.p, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('pump; pressure with the valve', 'ポンプ、弁がある場合の圧力') }, { c: 'c2', label: T('puck', '粉の層') }, { c: 'c3', label: T('returned to the tank', 'タンクへ戻る分') }, { c: 'muted', label: T('valve setting; no valve', '弁の設定値、弁がない場合') }]);
      ctx.readout([
        { k: T('resistance of the puck', '粉の層の抵抗'), v: tx`\(${fmt(R, 1)}\ \mathrm{bar\ per\ mL/s}\)` },
        { k: T('pressure at the puck', '粉の層にかかる圧力'), v: tx`\(${fmt(op.p, 1)}\ \mathrm{bar}\)`, tone: 'key' },
        { k: T('through the puck, back to the tank', '粉の層を通る分、タンクへ戻る分'), v: tx`\(${fmt(op.q, 2)},\ ${fmt(op.bypass, 2)}\ \mathrm{mL/s}\)` },
        { k: T('time for 36 g, extracted', '36 g までの時間、抽出された割合'), v: tx`\(${fmt(t, 0)}\ \mathrm{s},\ ${fmt(100 * e, 1)}\ \%\)`, tone: e < 0.18 || e > 0.22 ? 'warn' : 'good' },
      ], T(op.open ? 'The valve is open and holding the pressure. Most of what the pump moves never reaches the coffee.' : 'The valve is shut: the puck is too open for the pump to reach the setting, and the shot runs at whatever pressure the two agree on.', op.open ? '弁は開いて圧力を保っています。ポンプが送る水の大半は、コーヒーに届きません。' : '弁は閉じています。粉の層が粗すぎてポンプが設定値に届かず、抽出は両者がつり合う圧力で進みます。'));
    },
  };
})();
