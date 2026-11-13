'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, G = 9.81, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180, lg = Math.log10;

  /* ---------------- models (no DOM) ----------------
   * Poiseuille: steady laminar flow in a round pipe of radius r and length L under a pressure difference dP has the
   *   profile u(s) = dP (r^2 - s^2) / (4 eta L), a mean speed half the centre speed, and Q = pi dP r^4 / (8 eta L).
   *   Reynolds number Re = rho u_mean d / eta; the result holds below about 2300.
   * Darcy: through a bed of grains the flow per unit area is q = k dP / (eta L); Kozeny-Carman gives the permeability
   *   k = d^2 e^3 / (180 (1 - e)^2) for grains of diameter d packed with porosity e.
   * Capillarity: a liquid of surface tension gamma meeting a wall at contact angle theta rises h = 2 gamma cos(theta) / (rho g r)
   *   in a tube of radius r. Drawn sideways into a dry tube it advances as l^2 = gamma r cos(theta) t / (2 eta) (Washburn).
   */
  const FLUIDS = [{ en: 'water', ja: '水', eta: 1.0e-3, rho: 998, gam: 0.0728 }, { en: 'olive oil', ja: 'オリーブ油', eta: 0.081, rho: 910, gam: 0.032 }, { en: 'glycerol', ja: 'グリセリン', eta: 1.41, rho: 1260, gam: 0.063 }, { en: 'ethanol', ja: 'エタノール', eta: 1.2e-3, rho: 789, gam: 0.0223 }];
  const pipeFlow = (dMm, dP, len, eta) => (PI * dP * (dMm / 2000) ** 4) / (8 * eta * len);
  const meanSpeed = (dMm, dP, len, eta) => pipeFlow(dMm, dP, len, eta) / (PI * (dMm / 2000) ** 2);
  const profile = (s, dMm, dP, len, eta) => (dP * ((dMm / 2000) ** 2 - s * s)) / (4 * eta * len);
  const reynolds = (dMm, dP, len, eta, rho) => (rho * meanSpeed(dMm, dP, len, eta) * (dMm / 1000)) / eta;
  const permeability = (dUm, e) => ((dUm * 1e-6) ** 2 * e ** 3) / (180 * (1 - e) ** 2);
  const darcy = (k, dP, len, eta) => (k * dP) / (eta * len);
  const poreSpeed = (q, e) => q / e;
  const capRise = (rMm, gam, thetaDeg, rho) => (2 * gam * Math.cos(rad(thetaDeg))) / (rho * G * (rMm / 1000));
  const capPressure = (rMm, gam, thetaDeg) => (2 * gam * Math.cos(rad(thetaDeg))) / (rMm / 1000);
  const washburn = (t, rMm, gam, thetaDeg, eta) => Math.sqrt(Math.max(0, (gam * (rMm / 1000) * Math.cos(rad(thetaDeg)) * t) / (2 * eta)));
  const M = { FLUIDS, pipeFlow, meanSpeed, profile, reynolds, permeability, darcy, poreSpeed, capRise, capPressure, washburn };
  (window.LabModels = window.LabModels || {})['viscous-flow'] = M;
  const flowText = (Q) => { const ml = Q * 6e7; return ml < 1 ? fmt(ml * 60, ml * 60 < 10 ? 2 : 0) + String.raw`\ \mathrm{ml/h}` : ml < 1000 ? fmt(ml, ml < 10 ? 2 : 0) + String.raw`\ \mathrm{ml/min}` : fmt(ml / 1000, 1) + String.raw`\ \mathrm{L/min}`; };

  /* ================= 1. flow in a pipe ================= */
  D['pipe-flow'] = {
    render(ctx, v) {
      const fl = FLUIDS[v.fluid], dP = v.dp * 1000, Q = pipeFlow(v.d, dP, v.len, fl.eta), um = meanSpeed(v.d, dP, v.len, fl.eta), Re = reynolds(v.d, dP, v.len, fl.eta, fl.rho), R = v.d / 2, lam = Re < 2300;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Speed of ${fl.en} across a pipe \(${fmt(v.d, 1)}\) mm wide, seen from the side. The liquid touching the wall does not move at all. Each layer drags on its neighbour, so the speed rises from zero at the wall to its greatest on the axis along a parabola. The dashed line is the mean speed, half the greatest.`, tx`幅 \(${fmt(v.d, 1)}\) mm の管を流れる${fl.ja}の速さを、横から見た図です。壁に触れている液体は、まったく動きません。各層は隣の層を引きずるので、速さは、壁でのゼロから軸での最大まで、放物線に沿って大きくなります。破線は平均の速さで、最大の半分です。`));
      const u0 = profile(0, v.d, dP, v.len, fl.eta), a = L.fig(c1, { x: [0, u0 * 1.15 * 100], y: [-R * 1.25, R * 1.25], aspect: 0.7, maxH: 350, xlabel: T('speed (cm/s)', '速さ（cm/s）'), ylabel: T('across the pipe (mm)', '管を横切る位置（mm）') });
      a.rect(0, R, u0 * 1.15 * 100, R * 0.25, { c: 'muted', fill: 'muted', opacity: 0.35, w: 0 }); a.rect(0, -R * 1.25, u0 * 1.15 * 100, R * 0.25, { c: 'muted', fill: 'muted', opacity: 0.35, w: 0 });
      const pts = []; for (let i = 0; i <= 80; i++) { const s = -R + (2 * R * i) / 80; pts.push([profile(s / 1000, v.d, dP, v.len, fl.eta) * 100, s]); } a.poly([[0, -R], ...pts, [0, R]], { c: 'c1', fill: 'c1', opacity: 0.14, w: 0 }); a.line(pts, { c: 'c1', w: 2.8 });
      for (let i = 1; i < 8; i++) { const s = -R + (2 * R * i) / 8; a.arrow([0, s], [profile(s / 1000, v.d, dP, v.len, fl.eta) * 100, s], { c: 'c1', w: 1.3 }); } a.vline(um * 100, { c: 'c2', dash: '5 4' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Flow against the width of the pipe, on logarithmic scales, with everything else fixed. The line rises four decades for each decade of width: flow goes as the fourth power of the diameter. Halving the bore of a pipe, a needle or an artery cuts the flow to a sixteenth. Drag the gold point.`, tx`ほかをすべて固定したときの流量を、管の幅に対して、両対数の目盛りで描いています。線は、幅が 10 倍になるごとに 4 桁上がります。流量は、直径の 4 乗に比例します。管、針、動脈の内径を半分にすると、流量は 16 分の 1 になります。金色の点をドラッグしてください。`));
      const qy = (d) => lg(pipeFlow(d, dP, v.len, fl.eta) * 6e7), y0 = Math.floor(qy(0.2)), y1 = Math.ceil(qy(10)), ty = []; for (let i = y0; i <= y1; i += Math.max(1, Math.round((y1 - y0) / 6))) ty.push([i, i < -4 ? '1e' + i : i < 0 ? (10 ** i).toFixed(-i) : i < 3 ? String(10 ** i) : i < 6 ? 10 ** (i - 3) + ' k' : '1e' + i]);
      const b = L.fig(c2, { x: [lg(0.2), 1], y: [y0, y1], aspect: 0.7, maxH: 350, xlabel: T('inside width of the pipe (mm)', '管の内径（mm）'), ylabel: T('flow (ml/min)', '流量（ml/分）'), ticksX: [[lg(0.2), '0.2'], [lg(0.5), '0.5'], [0, '1'], [lg(2), '2'], [lg(5), '5'], [1, '10']], ticksY: ty });
      b.line(L.sample(lg(0.2), 1, 40, (q) => qy(10 ** q)), { c: 'c2', w: 2.8 });
      b.handle(lg(v.d), qy(v.d), { c: 'hl', axis: 'x', bounds: [lg(0.2), 1, y0, y1], label: T('width', '内径'), onDrag: (x) => ctx.set('d', clamp(Math.round(10 ** x * 10) / 10, 0.2, 10)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('speed across the pipe', '管を横切る速さの分布') }, { c: 'c2', dash: true, label: T('mean speed', '平均の速さ') }, { c: 'c2', label: T('flow', '流量') }]);
      ctx.readout([
        { k: T('flow', '流量'), v: tx`\(${flowText(Q)}\)`, tone: 'key' },
        { k: T('mean speed', '平均の速さ'), v: tx`\(${fmt(um * 100, um < 0.01 ? 3 : 1)}\ \mathrm{cm/s}\)` },
        { k: T('speed on the axis', '軸での速さ'), v: tx`\(${fmt(u0 * 100, u0 < 0.01 ? 3 : 1)}\ \mathrm{cm/s}\)` },
        { k: T('Reynolds number', 'レイノルズ数'), v: tx`\(${fmt(Re, Re < 10 ? 2 : 0)}\)`, tone: lam ? 'good' : 'warn' },
      ], T(lam ? 'The flow is laminar: smooth layers sliding over one another, which is the condition for this law.' : 'The Reynolds number is above about 2300, so a real flow here would be turbulent. Eddies mix fast and slow liquid, the profile flattens, and the flow is much less than the law predicts.', lam ? '流れは層流です。滑らかな層が互いの上を滑っていて、これが、この法則が成り立つ条件です。' : 'レイノルズ数が約 2300 を超えているので、実際の流れは乱流になります。渦が速い液体と遅い液体を混ぜ、速さの分布は平らになり、流量は、この法則の予測よりずっと少なくなります。'));
    },
  };

  /* ================= 2. flow through a bed of grains ================= */
  D['porous-bed'] = {
    render(ctx, v) {
      const k = permeability(v.grain, v.por), dP = 998 * G * v.head, q = darcy(k, dP, v.depth / 1000, 1e-3), up = poreSpeed(q, v.por);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Water passing down through a bed of sand \(${fmt(v.depth, 0)}\) mm deep under \(${fmt(v.head, 2)}\) m of head, against the size of the grains, on logarithmic scales. A bed of grains is a great many crooked little pipes side by side, each about as wide as the gaps between grains. Finer grains mean more pipes but far narrower ones, and the narrowness wins: flow goes as the square of the grain size. Drag the gold point.`, tx`深さ \(${fmt(v.depth, 0)}\) mm の砂の層を、\(${fmt(v.head, 2)}\) m の水頭で下向きに通る水の量を、粒の大きさに対して、両対数の目盛りで描いています。粒の層は、粒の間のすき間ほどの幅を持つ、曲がりくねった小さな管が、非常に多く並んだものです。粒が細かいほど、管は多くなりますが、はるかに狭くなり、狭さのほうが勝ちます。流量は、粒の大きさの 2 乗に比例します。金色の点をドラッグしてください。`));
      const qy = (d) => lg(darcy(permeability(d, v.por), dP, v.depth / 1000, 1e-3) * 3600), y0 = Math.floor(qy(50)), y1 = Math.ceil(qy(2000)), ty = []; for (let i = y0; i <= y1; i++) ty.push([i, i < 0 ? (10 ** i).toFixed(-i) : String(10 ** i)]);
      const a = L.fig(c1, { x: [lg(50), lg(2000)], y: [y0, y1], aspect: 0.7, maxH: 350, xlabel: T('grain size (micrometres)', '粒の大きさ（マイクロメートル）'), ylabel: T('flow (m³ per m² per hour)', '流量（m³/m²/時）'), ticksX: [[lg(50), '50'], [2, '100'], [lg(200), '200'], [lg(500), '500'], [3, '1000'], [lg(2000), '2000']], ticksY: ty });
      a.line(L.sample(lg(50), lg(2000), 40, (x) => qy(10 ** x)), { c: 'c1', w: 2.8 });
      a.handle(lg(v.grain), qy(v.grain), { c: 'hl', axis: 'x', bounds: [lg(50), lg(2000), y0, y1], label: T('grain size', '粒の大きさ'), onDrag: (x) => ctx.set('grain', clamp(Math.round(10 ** x / 10) * 10, 50, 2000)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How the bed’s permeability changes with how tightly it is packed, for grains of \(${fmt(v.grain, 0)}\) micrometres. Porosity is the share of the bed that is gap. Loose sand has about 45 per cent; shaken down, about 35. That small change cuts the flow to a third, because closing the gaps both narrows the channels and leaves fewer of them.`, tx`\(${fmt(v.grain, 0)}\) マイクロメートルの粒について、層の浸透率が、詰まり具合によってどう変わるかを描いています。空隙率は、層のうち、すき間が占める割合です。緩い砂では約 45 %、揺すって詰めると約 35 % です。この小さな変化で、流量は 3 分の 1 になります。すき間が狭まると、流路が細くなり、同時に、流路の数も減るからです。`));
      const b = L.fig(c2, { x: [0.25, 0.5], y: [0, permeability(v.grain, 0.5) * 1e12 * 1.05], aspect: 0.7, maxH: 350, xlabel: T('porosity', '空隙率'), ylabel: T('permeability (µm²)', '浸透率（µm²）') });
      b.line(L.sample(0.25, 0.5, 80, (e) => permeability(v.grain, e) * 1e12), { c: 'c2', w: 2.8 }); b.dot(v.por, k * 1e12, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('flow through the bed', '層を通る流量') }, { c: 'c2', label: T('permeability', '浸透率') }]);
      ctx.readout([
        { k: T('permeability', '浸透率'), v: tx`\(${fmt(k * 1e12, k * 1e12 < 10 ? 2 : 0)}\ \mathrm{\mu m^2}\)` },
        { k: T('pressure across the bed', '層にかかる圧力'), v: tx`\(${fmt(dP / 1000, 2)}\ \mathrm{kPa}\)` },
        { k: T('flow per square metre', '1 平方メートルあたりの流量'), v: tx`\(${fmt(q * 3600, q * 3600 < 10 ? 2 : 1)}\ \mathrm{m^3/h}\)`, tone: 'key' },
        { k: T('speed of the water between grains', '粒の間を流れる水の速さ'), v: tx`\(${fmt(up * 1000, 2)}\ \mathrm{mm/s}\)` },
        { k: T('time to pass through', '通り抜けるまでの時間'), v: tx`\(${fmt(v.depth / 1000 / up, v.depth / 1000 / up < 100 ? 1 : 0)}\ \mathrm{s}\)` },
      ], T('Flow is proportional to pressure and inversely to depth, exactly as current through a resistor. That linearity is Darcy’s law, and it is why groundwater, oil reservoirs and filter beds can all be handled with the mathematics of electricity and heat.', '流量は、圧力に比例し、深さに反比例します。抵抗器を流れる電流とまったく同じです。この線形性がダルシーの法則で、地下水、油層、ろ過層を、どれも電気や熱と同じ数学で扱えるのは、このためです。'));
    },
  };

  /* ================= 3. capillarity ================= */
  D['capillary-rise'] = {
    render(ctx, v) {
      const fl = FLUIDS[[0, 3, 1][v.fluid]], r = v.r, h = capRise(r, fl.gam, v.th, fl.rho), pc = capPressure(r, fl.gam, v.th), wet = v.th < 90, span = 10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How high ${fl.en} climbs in a narrow tube against the tube’s radius, on logarithmic scales. Where the liquid surface meets the wall it is pulled along the wall by surface tension, all the way round the rim. That pull grows with the rim, in proportion to the radius; the weight it must lift grows with the area, as the square. So the height goes as one over the radius, and thin tubes win. Drag the gold point.`, tx`細い管の中を${fl.ja}がどこまで上がるかを、管の半径に対して、両対数の目盛りで描いています。液面が壁と接するところでは、縁の全周にわたって、表面張力が液体を壁に沿って引きます。この引く力は、縁の長さ、つまり半径に比例して大きくなります。持ち上げる重さは、面積、つまり半径の 2 乗に比例して大きくなります。そのため、高さは半径に反比例し、細い管ほど高く上がります。金色の点をドラッグしてください。`));
      const hy = (q) => lg(Math.max(1e-9, Math.abs(capRise(q, fl.gam, v.th, fl.rho)) * 1000)), a = L.fig(c1, { x: [-3, 0.5], y: [-1, 5], aspect: 0.7, maxH: 350, xlabel: T('radius of the tube (mm)', '管の半径（mm）'), ylabel: T(wet ? 'height of rise (mm)' : 'depth pushed down (mm)', wet ? '上がる高さ（mm）' : '押し下げられる深さ（mm）'), ticksX: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [0, '1']], ticksY: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1 m'], [4, '10 m'], [5, '100 m']] });
      a.line(L.sample(-3, 0.5, 40, (x) => clamp(hy(10 ** x), -1, 5)), { c: 'c1', w: 2.8 });
      a.handle(lg(r), clamp(hy(r), -1, 5), { c: 'hl', axis: 'x', bounds: [-3, 0.5, -1, 5], label: T('radius', '半径'), onDrag: (x) => { const q = 10 ** clamp(x, -3, 0.5); ctx.set('r', q < 0.01 ? Math.round(q * 1000) / 1000 : q < 0.1 ? Math.round(q * 200) / 200 : Math.round(q * 20) / 20); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the liquid has soaked sideways into a dry tube of this radius, against time. The pull at the front stays the same while the wetted length behind it, which resists by viscosity, keeps growing. So the front slows down: distance goes as the square root of time. The grey curve is a tube a tenth as wide, which pulls harder but resists far more, and so is slower.`, tx`この半径の乾いた管に、液体が横向きにどこまで染み込んだかを、時間に対して描いています。先端で引く力は変わりませんが、その後ろにある、粘性で抵抗する濡れた部分は、長くなり続けます。そのため、先端は遅くなります。距離は、時間の平方根に比例します。灰色の曲線は、幅が 10 分の 1 の管です。より強く引きますが、抵抗がはるかに大きいので、遅くなります。`));
      const lmax = Math.max(1, washburn(span, r, fl.gam, Math.min(v.th, 89), fl.eta) * 1000 * 1.1), b = L.fig(c2, { x: [0, span], y: [0, lmax], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（s）'), ylabel: T('distance soaked (mm)', '染み込んだ距離（mm）') });
      b.line(L.sample(0, span, 200, (t) => washburn(t, r / 10, fl.gam, v.th, fl.eta) * 1000), { c: 'muted', w: 1.4 }); b.line(L.sample(0, span, 200, (t) => washburn(t, r, fl.gam, v.th, fl.eta) * 1000), { c: 'c2', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('height in an upright tube', '立てた管の中の高さ') }, { c: 'c2', label: T('distance soaked sideways', '横に染み込んだ距離') }, { c: 'muted', label: T('a tube a tenth as wide', '幅が 10 分の 1 の管') }]);
      const ht = Math.abs(h) < 1 ? fmt(Math.abs(h) * 1000, Math.abs(h) < 0.01 ? 2 : 0) + String.raw`\ \mathrm{mm}` : fmt(Math.abs(h), 1) + String.raw`\ \mathrm{m}`;
      ctx.readout([
        { k: T(wet ? 'rises' : 'is pushed down', wet ? '上がる高さ' : '押し下げられる深さ'), v: tx`\(${ht}\)`, tone: 'key' },
        { k: T('suction at the curved surface', '曲がった液面での吸い込む圧力'), v: tx`\(${fmt(pc / 1000, Math.abs(pc) < 1e4 ? 2 : 0)}\ \mathrm{kPa}\)` },
        { k: T('soaks sideways in 1 s', '1 秒間に横に染み込む距離'), v: tx`\(${fmt(washburn(1, r, fl.gam, v.th, fl.eta) * 1000, 1)}\ \mathrm{mm}\)` },
        { k: T('and in 100 s', '100 秒間では'), v: tx`\(${fmt(washburn(100, r, fl.gam, v.th, fl.eta) * 1000, 0)}\ \mathrm{mm}\)` },
      ], T(wet ? 'The liquid wets the wall, so its surface curves upward at the edge and pulls the column up. Paper, cloth, soil and the tip of a pen all drink this way.' : 'The contact angle is above 90 degrees: the liquid does not wet the wall, its surface bulges, and it is pushed out of narrow gaps. This is how waterproof cloth and a duck’s feathers stay dry.', wet ? '液体は壁を濡らすので、液面は縁で上向きに曲がり、液柱を引き上げます。紙、布、土、ペンの先は、どれもこの仕組みで液体を吸います。' : '接触角が 90° を超えています。液体は壁を濡らさず、液面は膨らみ、狭いすき間から押し出されます。防水の布やアヒルの羽が濡れないのは、この仕組みによります。'));
    },
  };
})();
