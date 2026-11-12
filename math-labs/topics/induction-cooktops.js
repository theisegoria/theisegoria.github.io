'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, MU0 = 4e-7 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * A flat coil under the glass carries current at 20 to 100 kHz. Its changing field drives a mirror-image sheet of
   * current in the pan base, confined to a skin depth delta = sqrt(rho / (pi f mu0 mu_r)). The base then looks like a
   * resistor of surface resistance R_s = rho / min(delta, thickness) ohms per square, and the heat per unit area is
   * (1/2) R_s K^2 for a sheet current of amplitude K.
   * Seen from the coil the pan is a resistance in series with the coil's inductance; with a capacitor this is a series
   * resonant circuit, P = V^2 R / (R^2 + (wL - 1/wC)^2), driven by a half-bridge whose fundamental is (sqrt2/pi) V_dc.
   * Heat pattern: the induced current flows in the ring under the winding, so heating is zero at the centre.
   */
  const PANS = [
    { en: 'cast iron', ja: '鋳鉄', rho: 1.0e-7, mu: 200, t: 4e-3, k: 50, R: 4.0 },
    { en: 'magnetic stainless steel', ja: '磁性ステンレス', rho: 6.0e-7, mu: 100, t: 0.8e-3, k: 25, R: 5.0 },
    { en: 'non-magnetic stainless steel', ja: '非磁性ステンレス', rho: 7.2e-7, mu: 1, t: 0.8e-3, k: 16, R: 1.1 },
    { en: 'aluminium', ja: 'アルミニウム', rho: 2.8e-8, mu: 1, t: 3e-3, k: 230, R: 0.16 },
    { en: 'copper', ja: '銅', rho: 1.7e-8, mu: 1, t: 2e-3, k: 400, R: 0.12 },
  ];
  const skin = (rho, mu, f) => Math.sqrt(rho / (PI * f * MU0 * mu));
  const rs = (p, f) => p.rho / Math.min(skin(p.rho, p.mu, f), p.t);
  const sheetCurrent = (p, f, watts, area = 0.0226) => Math.sqrt((2 * watts) / (rs(p, f) * area));     // A/m for a ring 3 to 9 cm
  const CKT = { L: 80e-6, C: 0.33e-6, vdc: 325, rcoil: 0.08 };
  const f0 = (c = CKT) => 1 / (TAU * Math.sqrt(c.L * c.C));
  const v1 = (c = CKT) => (Math.SQRT2 / PI) * c.vdc;
  function drive(f, Rpan, c = CKT) { const w = TAU * f, X = w * c.L - 1 / (w * c.C), R = Rpan + c.rcoil, I = v1(c) / Math.hypot(R, X); return { I, P: I * I * Rpan, loss: I * I * c.rcoil, Q: (TAU * f0(c) * c.L) / R, X, eff: Rpan / R }; }
  const R1 = 0.03, R2 = 0.09;
  const ringHeat = (r) => { const s = 0.006, e = (x) => 0.5 * (1 + Math.tanh(x / s)); return e(r - R1) * e(R2 - r); };      // 0..1
  function spread(r, len) { if (len < 1e-4) return ringHeat(r); let s = 0, w = 0; for (let i = -40; i <= 40; i++) { const x = r + (i / 40) * 3 * len, g = Math.exp(-0.5 * ((x - r) / len) ** 2); s += g * ringHeat(Math.abs(x)); w += g; } return s / w; }
  const spreadLen = (p) => 0.004 + 0.03 * Math.sqrt(p.k * p.t / (230 * 3e-3));
  const M = { PANS, MU0, skin, rs, sheetCurrent, CKT, f0, v1, drive, ringHeat, spread, spreadLen, R1, R2 };
  (window.LabModels = window.LabModels || {})['induction-cooktops'] = M;
  const PN = (i) => T(PANS[i].en, PANS[i].ja);

  /* ================= 1. the hob and the pan (3D) ================= */
  function buildHob(S) {
    const TH = S.THREE, g = new TH.Group(), K = 10, T0 = PI / 2, CUT = PI * 1.5;                 // 1 unit = 100 mm
    const lathe = (pts, mat, t0 = T0, len = CUT) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0] * K, q[1] * K)), 72, t0, len).rotateX(PI / 2), mat); m.castShadow = true; g.add(m); return m; };
    const copper = S.mat('#b87333', { metal: 0.9, rough: 0.35 }), ferr = S.mat('#2a2b2e', { rough: 0.7 }), glass = S.mat('#3a3d44', { rough: 0.08, coat: 1, opacity: 0.2 }), panM = S.mat('#3a3b3f', { metal: 0.8, rough: 0.45 }), alu = S.mat('#c9ccd1', { metal: 0.9, rough: 0.4 });
    // coil: a flat spiral of 22 turns of litz wire from 30 to 90 mm radius, on a carrier with eight ferrite bars
    const sp = []; for (let i = 0; i <= 22 * 48; i++) { const a = (i / 48) * TAU, r = (R1 + ((R2 - R1) * i) / (22 * 48)) * K; sp.push([r * Math.cos(a), r * Math.sin(a), 0.22]); }
    const coil = S.tube(sp, { r: 0.012, add: false, radial: 6, segments: 22 * 48 }); coil.material = copper; g.add(coil);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, m = new TH.Mesh(new TH.BoxGeometry(0.62, 0.13, 0.05), ferr); m.position.set(0.6 * Math.cos(a), 0.6 * Math.sin(a), 0.165); m.rotation.z = a; m.castShadow = true; g.add(m); }
    lathe([[0.001, 0.012], [0.1, 0.012], [0.1, 0.014], [0.001, 0.014]], S.mat('#d8d3c4', { rough: 0.6 }), 0, TAU);
    const board = new TH.Mesh(new TH.BoxGeometry(2.6, 1.0, 0.03), S.mat('#1f6a40', { rough: 0.5, coat: 0.6 })); board.position.set(0.4, -1.55, 0.06); g.add(board);
    for (const [x, w, h] of [[-0.4, 0.5, 0.42], [0.45, 0.32, 0.3], [1.1, 0.4, 0.22]]) { const m = new TH.Mesh(new TH.BoxGeometry(w, 0.5, h), x < 0 ? alu : ferr); m.position.set(x, -1.55, 0.07 + h / 2); m.castShadow = true; g.add(m); }
    const top = new TH.Mesh(new TH.BoxGeometry(3.4, 3.0, 0.04), glass); top.position.set(0.3, -0.35, 0.3); g.add(top);
    // pan: base 4 mm, walls, cut open; the hot ring in its base glows
    const pan = lathe([[0.001, 0.0325], [0.105, 0.0325], [0.115, 0.036], [0.12, 0.095], [0.1225, 0.095], [0.118, 0.034], [0.107, 0.0285], [0.001, 0.0285]], panM);
    const hotM = new TH.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, side: TH.DoubleSide }), hg = new TH.RingGeometry(0.001, 1.04, 96, 40), col = new Float32Array(hg.attributes.position.count * 3); hg.setAttribute('color', new TH.BufferAttribute(col, 3));
    const hot = new TH.Mesh(hg, hotM); hot.position.z = 0.327; g.add(hot);
    const handle = new TH.Mesh(new TH.BoxGeometry(1.3, 0.16, 0.09), S.mat('#17181b', { rough: 0.6 })); handle.position.set(-1.85, 0, 0.9); g.add(handle);
    const loops = S.lines([], { c: 'c1', opacity: 0.75, w: 1.6 });
    const setPan = (p, level) => { const len = spreadLen(p), pos = hg.attributes.position, c = new TH.Color(), base = new TH.Color('#2e2f33');
      for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)) / K, v = spread(r, len) * level * (p.R > 0.5 ? 1 : 0.06); c.copy(base).lerp(new TH.Color().setHSL(0.02 + 0.1 * v, 1, 0.5), clamp(v * 1.1, 0, 1)); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
      hg.attributes.color.needsUpdate = true; panM.color.set(p.mu > 1 ? (p.rho > 3e-7 ? '#8d9197' : '#3a3b3f') : p.rho < 2e-8 ? '#b87333' : p.rho < 5e-8 ? '#c9ccd1' : '#a9adb3');
      const seg = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + 0.2; for (const rc of [0.42, 0.6, 0.78]) { const pts = []; for (let i = 0; i <= 28; i++) { const u = (i / 28) * TAU, rr = rc + 0.2 * Math.cos(u) * (1 + 0.3 * rc), zz = 0.22 + (p.mu > 1 ? 0.09 : 0.2) * (1 + Math.sin(u)) - 0.12 * (1 - Math.sin(u)) * 0.5; pts.push([rr * Math.cos(a), rr * Math.sin(a), zz]); } for (let i = 0; i < 28; i++) seg.push([pts[i], pts[i + 1]]); } }
      loops.update(seg); S.invalidate(); };
    S.add(g);
    return { g, setPan };
  }
  D['induction-hob'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const p = PANS[v.pan], f = 24000, d = drive(f * 1.25, p.R), works = p.R > 0.5, len = spreadLen(p);
      L.setText(st.cap1, T(tx`An induction hob with a ${p.en} pan, both cut open. Under the glass is a flat spiral of copper wire on ferrite bars that steer its magnetic field (blue loops) upwards. The field alternates 24 000 times a second and drives a ring of current in the base of the pan, which heats as any resistor does. Nothing else gets hot: the glass is warmed only by the pan.`, tx`${p.ja}の鍋を載せた IH クッキングヒーターを、どちらも切り開いて示しています。ガラスの下には、銅線の平たい渦巻きがあり、フェライトの棒がその磁場（青い輪）を上へ導きます。磁場は毎秒 24 000 回向きを変え、鍋の底に輪状の電流を流します。鍋の底は、ほかの抵抗と同じように発熱します。ほかの部分は熱くなりません。ガラスは鍋から伝わる熱で温まるだけです。`));
      L.setText(st.cap2, T(tx`Where the heat appears across the base of the pan (dashed), and how it has spread by the time it reaches the food (solid). Current is induced only under the winding, between 3 and 9 cm from the centre, so the heat arrives as a ring. A thick base that conducts well spreads it; a thin steel base leaves the ring in the food.`, tx`鍋の底のどこで熱が発生するか（破線）と、それが食品に届くまでにどう広がるか（実線）を示します。電流が誘導されるのは、中心から 3 から 9 cm の巻線の真上だけなので、熱は輪の形で現れます。熱をよく伝える厚い底は熱を広げますが、薄い鋼の底では、輪がそのまま食品に現れます。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 11], y: [0, 1.1], aspect: 0.8, maxH: 400, xlabel: T('distance from the centre of the pan (cm)', '鍋の中心からの距離（cm）'), ylabel: T('heating (1 = under the winding)', '加熱（1 = 巻線の真上）') });
      g.rect(3, 0, 6, 1.1, { c: 'c2', fill: 'c2', fo: 0.07, nostroke: true, layer: 'under' }); g.text(6, 1.04, T('winding', '巻線'), { small: true });
      g.line(L.sample(0, 11, 200, (r) => ringHeat(r / 100)), { c: 'muted', w: 1.8, dash: '5 4' }); const sm = L.sample(0, 11, 120, (r) => spread(r / 100, len)); g.area(sm, { c: 'c2', fo: 0.18, base: 0 }); g.line(sm, { c: 'c2', w: 2.8 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'muted', dash: true, label: T('heat generated in the base', '底で発生する熱') }, { c: 'c2', label: T('after spreading through the base', '底の中で広がった後') }, { c: 'c1', label: T('magnetic field', '磁場') }]);
      ctx.readout([
        { k: T('pan', '鍋'), v: PN(v.pan) + ' · ' + (works ? T('heats', '加熱できる') : T('rejected: too little resistance', '加熱できない：抵抗が小さすぎる')), tone: works ? 'good' : 'bad' },
        { k: T('depth the current reaches at 24 kHz', '24 kHz で電流が届く深さ'), v: tx`\(${fmt(skin(p.rho, p.mu, f) * 1000, 2)}\ \mathrm{mm}\)` },
        { k: T('resistance the coil sees', 'コイルから見た抵抗'), v: tx`\(${fmt(p.R, 2)}\ \Omega\)`, tone: 'key' },
        { k: T('share of the power that reaches the pan', '鍋に届く電力の割合'), v: tx`\(${fmt(100 * d.eff, 0)}\,\%\)` },
        { k: T('centre of the base against the hottest ring, at the food', '食品側での、底の中心 ÷ 最も熱い輪'), v: tx`\(${fmt(100 * spread(0, len) / Math.max(...sm.map((q) => q[1])), 0)}\,\%\)` },
      ], T('The coil and the pan are the two windings of a transformer whose secondary is a single shorted turn. Because the heat is made in the pan itself, about 85 per cent of the electricity reaches the food, against roughly 40 per cent for a gas flame.', 'コイルと鍋は、二次側が短絡した 1 巻きである変圧器の二つの巻線に当たります。熱が鍋そのものの中で作られるので、電気の約 85 % が食品に届きます。ガスの炎では約 40 % です。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.8, maxH: 540, camera: [2.6, -6.2, 3.6], target: [0.1, -0.3, 0.4], fov: 30,
        label: T('3D cutaway of an induction hob and pan. Drag to rotate.', 'IH クッキングヒーターと鍋の 3D 断面。ドラッグで回転できます。'),
        init(S) { st.flat = false; st.hob = buildHob(S); S.label(T('coil', 'コイル'), [0.75, -1.0, 0.12], { small: true }); S.label(T('ferrite', 'フェライト'), [-0.2, -1.15, -0.05], { small: true }); S.label(T('glass top', 'ガラス天板'), [1.9, -1.2, 0.5], { small: true }); S.label(T('pan base', '鍋の底'), [1.5, 0, 1.2], { small: true }); S.label(T('inverter', 'インバーター'), [0.4, -2.3, 0.2], { small: true }); },
        update() { st.hob.setPan(p, v.lev / 9); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-13, 13], y: [-2, 11], equal: true, maxH: 300, axes: false, grid: false }); f2.rect(-12, 3.2, 24, 0.5, { c: 'ink', fill: 'ink', fo: 0.5 }); f2.poly([[-12, 3.7], [-12.3, 9.5], [-12, 9.5], [-11.7, 4.1], [11.7, 4.1], [12, 9.5], [12.3, 9.5], [12, 3.7]], { c: 'ink', fill: 'grid', fo: 0.6 }); for (let k = 0; k < 22; k++) for (const sgn of [-1, 1]) f2.circle(sgn * (3 + (6 * k) / 21), 2.2, 0.12, { c: 'c2', fill: 'c2', fo: 1 }); },
      });
    },
  };

  /* ================= 2. why only some pans work ================= */
  D['pan-materials'] = {
    render(ctx, v) {
      const p = PANS[v.pan], f = v.f * 1000, lg = Math.log10, d = skin(p.rho, p.mu, f), R = rs(p, f), Kc = sheetCurrent(p, f, 2000);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How deep the induced current reaches into each metal, against frequency. A changing field cannot get far into a conductor: the current it starts screens the metal behind it. The screening is far stronger in a magnetic metal, so in iron the current is squeezed into a layer thinner than a hair. Drag the gold point.`, tx`誘導電流がそれぞれの金属の中へ届く深さを、周波数に対して描いています。変化する磁場は、導体の奥までは入れません。磁場が流す電流が、その奥の金属を遮蔽するからです。磁性のある金属では遮蔽がはるかに強く、鉄では電流が髪の毛より薄い層に押し込められます。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [1, 2.2], y: [-2, 1], aspect: 0.7, maxH: 340, xlabel: T('frequency (kHz)', '周波数（kHz）'), ylabel: T('skin depth (mm)', '表皮深さ（mm）'), ticksX: [[1, '10'], [lg(20), '20'], [lg(50), '50'], [2, '100']], ticksY: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10']] });
      PANS.forEach((q, i) => a.line(L.sample(1, 2.2, 40, (x) => lg(skin(q.rho, q.mu, 10 ** x * 1000) * 1000)), { c: i === v.pan ? 'c1' : 'muted', w: i === v.pan ? 2.8 : 1.3 }));
      a.handle(lg(v.f), lg(d * 1000), { c: 'hl', axis: 'x', bounds: [1, 2.2, -2, 1], label: T('frequency', '周波数'), onDrag: (x) => ctx.set('f', clamp(Math.round(10 ** x), 10, 150)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Resistance of one square of each pan base as the induced current sees it, at \(${v.f}\) kHz. A thin current layer in a poor conductor is a large resistance, and for the same coil current the heat is in proportion to it. Aluminium and copper conduct too well and too deeply: the same current makes a few per cent of the heat.`, tx`\(${v.f}\) kHz で、誘導電流から見た鍋の底の正方形一つ分の抵抗です。伝導の悪い金属の薄い電流層は大きな抵抗になり、同じコイル電流なら、発熱はこれに比例します。アルミニウムと銅は電気をよく通しすぎ、電流も深く入りすぎるので、同じ電流でも熱は数パーセントしか生じません。`));
      const top = Math.max(...PANS.map((q) => rs(q, f))) * 1e3 * 1.2, b = L.fig(c2, { x: [0.4, 5.6], y: [0, top], aspect: 0.7, maxH: 340, ylabel: T('surface resistance (mΩ per square)', '表面抵抗（mΩ/□）'), ticksX: PANS.map((q, i) => [i + 1, T(['cast iron', 'steel', 'stainless', 'aluminium', 'copper'][i], ['鋳鉄', '鋼', 'ステンレス', 'アルミ', '銅'][i])]) });
      PANS.forEach((q, i) => { const y = rs(q, f) * 1e3; b.rect(i + 0.68, 0, 0.64, y, { c: i === v.pan ? 'c1' : 'muted', fill: i === v.pan ? 'c1' : 'muted', fo: 0.6 }); b.text(i + 1, y, fmt(y, y < 0.1 ? 3 : 2), { small: true, dy: -8 }); });
      L.legend(ctx.host, [{ c: 'c1', label: T('the chosen pan', '選んだ鍋') }, { c: 'muted', label: T('the others', 'ほかの鍋') }]);
      ctx.readout([
        { k: T('skin depth', '表皮深さ'), v: tx`\(${fmt(d * 1000, 3)}\ \mathrm{mm}\)` + (d > p.t ? ' · ' + T('deeper than the base is thick', '底の厚さより深い') : '') },
        { k: T('surface resistance', '表面抵抗'), v: tx`\(${fmt(R * 1e3, 3)}\ \mathrm{m\Omega}\)`, tone: 'key' },
        { k: T('heat for the same current, compared with cast iron', '同じ電流での発熱、鋳鉄との比'), v: tx`\(${fmt((100 * R) / rs(PANS[0], f), 0)}\,\%\)` },
        { k: T('current in the base for 2 kW', '2 kW に必要な底の電流'), v: tx`\(${fmt(Kc / 1000, 1)}\ \mathrm{kA/m}\)`, tone: Kc > 30000 ? 'bad' : 'good' },
      ], T('A magnet that sticks to the base is the usual shop test, and it is a test of exactly the right property. Pans of aluminium or copper sold for induction have a disc of magnetic steel bonded underneath.', '底に磁石が付くかどうかが、店での普通の見分け方です。これは、まさに必要な性質を調べています。IH 用として売られるアルミニウムや銅の鍋は、底に磁性のある鋼の円板を貼り合わせています。'));
    },
  };

  /* ================= 3. the resonant drive ================= */
  D['resonant-drive'] = {
    render(ctx, v) {
      const p = PANS[v.pan], R = v.on === 1 ? p.R : 0.02, f = v.f * 1000, d = drive(f, R), fr = f0(), cap = f < fr;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Power delivered to the pan against the frequency at which two transistors switch the coil. The coil and a capacitor in series ring at \(${fmt(fr / 1000, 1)}\) kHz; the hob sets its power by how far above that note it drives them, the further the weaker. Drag the gold point.`, tx`二つのトランジスターがコイルを切り替える周波数に対する、鍋に届く電力です。コイルと直列のコンデンサーは \(${fmt(fr / 1000, 1)}\) kHz で共振します。調理器は、それよりどれだけ高い周波数で駆動するかで電力を決めます。離れるほど弱くなります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [20, 80], y: [0, 4], aspect: 0.7, maxH: 340, xlabel: T('switching frequency (kHz)', 'スイッチング周波数（kHz）'), ylabel: T('power into the pan (kW)', '鍋への電力（kW）') });
      a.rect(20, 0, fr / 1000 - 20, 4, { c: 'c2', fill: 'c2', fo: 0.08, nostroke: true, layer: 'under' }); a.text(21, 3.7, T('not used', '使わない領域'), { small: true, anchor: 'start' });
      PANS.forEach((q, i) => { if (i !== v.pan) a.line(L.sample(20, 80, 240, (x) => Math.min(4, drive(x * 1000, q.R).P / 1000)), { c: 'muted', w: 1.1 }); });
      a.line(L.sample(20, 80, 400, (x) => Math.min(4, drive(x * 1000, R).P / 1000)), { c: 'c1', w: 2.8 });
      a.handle(v.f, Math.min(4, d.P / 1000), { c: 'hl', axis: 'x', bounds: [20, 80, 0, 4], label: T('switching frequency', 'スイッチング周波数'), onDrag: (x) => ctx.set('f', clamp(Math.round(x * 2) / 2, 20, 80)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Current in the coil over the same range, on a log scale. With a pan on, its resistance limits the current. Lift the pan and the only resistance left is the coil’s own: near resonance the current would be hundreds of amperes, so the hob tests with a short burst first and refuses to start if the circuit rings too freely.`, tx`同じ範囲でのコイルの電流を、対数目盛りで示します。鍋が載っていれば、その抵抗が電流を制限します。鍋を外すと、残る抵抗はコイル自身のものだけです。共振の近くでは電流が数百アンペアになるので、調理器はまず短いパルスで試し、回路の減衰が小さすぎれば動作を始めません。`));
      const lg = Math.log10, b = L.fig(c2, { x: [20, 80], y: [0, 3.5], aspect: 0.7, maxH: 340, xlabel: T('switching frequency (kHz)', 'スイッチング周波数（kHz）'), ylabel: T('coil current (A rms)', 'コイル電流（A 実効値）'), ticksY: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
      b.line(L.sample(20, 80, 400, (x) => clamp(lg(drive(x * 1000, 0.02).I), 0, 3.5)), { c: 'c2', w: 2 }); b.line(L.sample(20, 80, 400, (x) => clamp(lg(drive(x * 1000, p.R).I), 0, 3.5)), { c: 'c1', w: 2.6 }); b.vline(v.f, { c: 'hl', dash: '4 3' });
      L.legend(ctx.host, [{ c: 'c1', label: T('with this pan', 'この鍋があるとき') }, { c: 'c2', label: T('no pan', '鍋がないとき') }, { c: 'muted', label: T('other pans', 'ほかの鍋') }]);
      ctx.readout([
        { k: T('power into the pan', '鍋への電力'), v: tx`\(${fmt(d.P, 0)}\ \mathrm{W}\)`, tone: cap ? 'warn' : 'key' },
        { k: T('coil current, heat lost in the coil', 'コイル電流、コイルで失う熱'), v: tx`\(${fmt(d.I, 1)}\ \mathrm{A},\ ${fmt(d.loss, 0)}\ \mathrm{W}\)`, tone: d.I > 60 ? 'bad' : undefined },
        { k: T('efficiency of the transfer', '電力の伝達効率'), v: tx`\(${fmt(100 * d.eff, 0)}\,\%\)` },
        { k: T('quality factor of the circuit', '回路の品質係数'), v: tx`\(${fmt(d.Q, 1)}\)`, tone: d.Q > 20 ? 'warn' : 'good' },
      ], T('Driving above resonance keeps the load inductive, so current lags voltage and each transistor switches on while its partner’s current is still flowing the helpful way, with almost no loss. This is why a hob that handles two kilowatts needs only a small fan.', '共振より高い周波数で駆動すると、負荷は誘導性のままで、電流は電圧より遅れます。各トランジスターは、相手側の電流がまだ都合のよい向きに流れている間にオンになるので、損失がほとんどありません。2 キロワットを扱う調理器が小さなファンで足りるのはそのためです。'));
    },
  };
})();
