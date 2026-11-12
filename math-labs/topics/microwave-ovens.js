'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, C0 = 299792458, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Cavity: a closed metal box a x b x d supports standing waves with whole numbers of half-wavelengths along each side,
   * f = (c/2) sqrt((m/a)^2 + (n/b)^2 + (p/d)^2). On a horizontal plane the heating of a thin load follows
   * sin^2(m pi x/a) sin^2(n pi y/b). A turntable replaces the pattern by its average round each circle.
   * Water: Debye relaxation eps = eps_inf + (eps_s - eps_inf)/(1 + i w tau); absorbed power density 2 pi f eps0 eps'' E^2;
   * penetration depth (power falls to 1/e) = lambda0 / (2 pi sqrt(2 eps' (sqrt(1 + tan^2) - 1))).
   * Magnetron: electrons leave a hot cathode of radius ra towards an anode of radius rb across a voltage V, in a magnetic
   * field B along the axis. Above the Hull cut-off B_c = sqrt(8 m V / e) / (rb (1 - ra^2/rb^2)) they curve back and miss.
   */
  const BOX = { a: 0.33, b: 0.33, d: 0.21 }, F0 = 2.45e9;
  const modeFreq = (m, n, p, B = BOX) => (C0 / 2) * Math.hypot(m / B.a, n / B.b, p / B.d);
  function modesNear(f0 = F0, span = 0.06e9) { const out = []; for (let m = 0; m <= 8; m++) for (let n = 0; n <= 8; n++) for (let p = 0; p <= 6; p++) { if ((m === 0) + (n === 0) + (p === 0) > 1) continue; const f = modeFreq(m, n, p); if (Math.abs(f - f0) <= span) out.push({ m, n, p, f }); } return out.sort((x, y) => Math.abs(x.f - f0) - Math.abs(y.f - f0)); }
  const MODES = [[3, 3, 2], [2, 5, 0], [1, 5, 1], [2, 4, 2], [5, 2, 0]];
  const heat = (x, y, m, n) => Math.sin((m * PI * x) / BOX.a) ** 2 * Math.sin((n * PI * y) / BOX.b) ** 2;       // 0..1
  function ringAverage(r, m, n) { let s = 0; const N = 180; for (let i = 0; i < N; i++) { const t = (i / N) * TAU; s += heat(BOX.a / 2 + r * Math.cos(t), BOX.b / 2 + r * Math.sin(t), m, n); } return s / N; }
  function uniformity(m, n, turn, R = 0.13) { let lo = Infinity, hi = 0; if (turn) { for (let r = 0; r <= R; r += R / 40) { const v = ringAverage(r, m, n); lo = Math.min(lo, v); hi = Math.max(hi, v); } } else for (let i = 0; i <= 60; i++) for (let j = 0; j <= 60; j++) { const x = BOX.a / 2 - R + (2 * R * i) / 60, y = BOX.b / 2 - R + (2 * R * j) / 60; if (Math.hypot(x - BOX.a / 2, y - BOX.b / 2) > R) continue; const v = heat(x, y, m, n); lo = Math.min(lo, v); hi = Math.max(hi, v); } return { lo, hi, ratio: lo / hi }; }
  const water = (Tc) => ({ es: 87.74 - 0.4008 * Tc + 9.398e-4 * Tc * Tc - 1.41e-6 * Tc ** 3, einf: 5.2, tau: 8.3e-12 * Math.exp(1900 * (1 / (Tc + 273.15) - 1 / 298.15)) });   // 8.3 ps at 25 C, about 3 ps at 80 C
  function eps(f, Tc = 25) { const w = water(Tc), x = TAU * f * w.tau, de = w.es - w.einf; return { re: w.einf + de / (1 + x * x), im: (de * x) / (1 + x * x) }; }
  const depth = (er, ei, f) => { const t = ei / er; return (C0 / f) / (TAU * Math.sqrt(2 * er * (Math.sqrt(1 + t * t) - 1))); };
  const ICE = { re: 3.2, im: 0.003 };
  const heatTime = (grams, dT, watts, eff = 0.9) => (grams * 4.186 * dT) / (watts * eff);
  const ME = 9.109e-31, QE = 1.602e-19, TUBE = { ra: 0.002, rb: 0.0045 };
  const hullB = (V, t = TUBE) => Math.sqrt((8 * ME * V) / QE) / (t.rb * (1 - (t.ra / t.rb) ** 2));
  function orbit(V, B, t = TUBE, steps = 6000) {       // planar motion in the radial field of a cylindrical diode and uniform axial B
    const k = V / Math.log(t.rb / t.ra), wc = (QE * B) / ME, dt = (TAU / Math.max(wc, 1e9)) / 400, pts = []; let x = t.ra, y = 0, vx = 0, vy = 0, rmax = t.ra, hit = false;
    for (let i = 0; i < steps; i++) { const r = Math.hypot(x, y), Er = -k / r, ax = (-QE / ME) * (Er * x / r) - wc * vy * -1 * -1, ay = (-QE / ME) * (Er * y / r) + wc * vx * -1 * -1;
      vx += (ax) * dt; vy += (ay) * dt; x += vx * dt; y += vy * dt; const rr = Math.hypot(x, y); rmax = Math.max(rmax, rr); if (i % 6 === 0) pts.push([x, y]); if (rr >= t.rb) { hit = true; break; } if (rr < t.ra) break; }
    return { pts, rmax, hit };
  }
  const M = { BOX, F0, modeFreq, modesNear, MODES, heat, ringAverage, uniformity, water, eps, depth, ICE, heatTime, hullB, orbit, TUBE, ME, QE };
  (window.LabModels = window.LabModels || {})['microwave-ovens'] = M;

  /* ================= 1. the cavity: hot and cold spots (3D) ================= */
  const ramp = (TH, v) => new TH.Color().setHSL(0.62 - 0.62 * clamp(v, 0, 1), 0.85, 0.32 + 0.3 * clamp(v, 0, 1));
  function buildOven(S) {
    const TH = S.THREE, g = new TH.Group(), K = 10;                        // 1 unit = 100 mm; cavity floor at z = 0.35
    const steelM = S.mat('#c9ccd1', { metal: 0.9, rough: 0.4 }), dark = S.mat('#202226', { rough: 0.6 }), glass = S.mat('#cfe8f2', { glass: true, rough: 0.04, opacity: 0.3 }), white = S.mat('#ecebe6', { rough: 0.5, opacity: 0.22 });
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = mat !== white && mat !== glass; g.add(m); return m; };
    const a = BOX.a * K, b = BOX.b * K, d = BOX.d * K, z0 = 0.35;
    box(a + 1.5, b + 0.1, 0.35, 0.7, 0, 0.175, dark);                                             // base
    box(a + 0.1, 0.05, d, 0, b / 2 + 0.025, z0 + d / 2, steelM); box(0.05, b, d, -a / 2 - 0.025, 0, z0 + d / 2, steelM); box(0.05, b, d, a / 2 + 0.025, 0, z0 + d / 2, steelM); box(a + 0.1, b + 0.05, 0.05, 0, 0, z0 + d + 0.025, white);
    box(1.3, b + 0.1, d + 0.05, a / 2 + 0.72, 0, z0 + d / 2, white);                                 // control bay shell
    // magnetron with its cooling fins and magnets, the waveguide into the cavity, transformer and capacitor
    const mag = new TH.Group(); mag.position.set(a / 2 + 0.75, 0.6, z0 + 1.35); g.add(mag);
    for (let i = 0; i < 7; i++) { const f = new TH.Mesh(new TH.BoxGeometry(0.75, 0.75, 0.025), steelM); f.position.z = -0.24 + i * 0.08; f.castShadow = true; mag.add(f); }
    for (const z of [-0.36, 0.36]) { const r = new TH.Mesh(new TH.CylinderGeometry(0.3, 0.3, 0.1, 32).rotateX(PI / 2), dark); r.position.z = z; mag.add(r); }
    const core = new TH.Mesh(new TH.CylinderGeometry(0.17, 0.17, 0.95, 24).rotateX(PI / 2), S.mat('#b87333', { metal: 0.9, rough: 0.35 })); mag.add(core);
    box(0.9, 0.5, 0.28, a / 2 + 0.42, 0.6, z0 + 1.97, steelM);
    box(0.7, 0.75, 0.65, a / 2 + 0.78, -0.95, z0 + 0.33, S.mat('#3b3d42', { metal: 0.6, rough: 0.5 })); const cap = new TH.Mesh(new TH.CylinderGeometry(0.16, 0.16, 0.6, 20), steelM); cap.position.set(a / 2 + 0.75, -0.2, z0 + 0.3); g.add(cap);
    // turntable: roller ring, glass plate, and the food layer whose colour is the heating pattern
    const table = new TH.Group(); table.position.z = z0 + 0.08; g.add(table);
    const plate = new TH.Mesh(new TH.CylinderGeometry(1.42, 1.3, 0.06, 64).rotateX(PI / 2), glass); table.add(plate);
    const geo = new TH.RingGeometry(0.001, 1.3, 96, 40), col = new Float32Array(geo.attributes.position.count * 3); geo.setAttribute('color', new TH.BufferAttribute(col, 3));
    const food = new TH.Mesh(geo, new TH.MeshBasicMaterial({ vertexColors: true, side: TH.DoubleSide, transparent: true })); food.position.z = 0.05; table.add(food);
    const paint = (m, n, turn, ang) => { const pos = geo.attributes.position, c = new TH.Color(), ca = Math.cos(ang), sa = Math.sin(ang);
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), r = Math.hypot(x, y); let v;
        if (turn) v = ringAverage(r / K, m, n); else v = heat(BOX.a / 2 + (x * ca - y * sa) / K, BOX.b / 2 + (x * sa + y * ca) / K, m, n);
        c.copy(ramp(TH, v)); pos.setZ(i, 0.02 + 0.22 * v); col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
      geo.attributes.color.needsUpdate = true; pos.needsUpdate = true; S.invalidate(); };
    // standing-wave sheet across the cavity at mid height
    const wgeo = new TH.PlaneGeometry(a, b, 60, 60); const wave = new TH.Mesh(wgeo, S.mat('#d99a3a', { rough: 0.5, opacity: 0.35, side: TH.DoubleSide })); wave.position.z = z0 + d * 0.62; g.add(wave);
    const setWave = (m, n, ph) => { const p = wgeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.28 * Math.cos(ph) * Math.sin((m * PI * (p.getX(i) + a / 2)) / a) * Math.sin((n * PI * (p.getY(i) + b / 2)) / b)); p.needsUpdate = true; wgeo.computeVertexNormals(); };
    g.position.x = -0.5; S.add(g);
    return { g, table, paint, setWave, food };
  }
  D['cavity-modes'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const [m, n, p] = MODES[v.mode], f = modeFreq(m, n, p), turn = v.turn === 1, u = uniformity(m, n, turn), u0 = uniformity(m, n, false), R = 0.13; st.q = { m, n, turn };
      L.setText(st.cap1, T(tx`A microwave oven with its top and door off. The magnetron (right, with cooling fins) feeds waves through a short metal duct into a steel box, where they reflect and settle into a standing pattern, drawn as the rippling sheet. The plate is coloured by how fast a thin layer of food would heat: red fast, blue hardly at all. ${turn ? 'The turntable carries each piece of food through hot and cold in turn.' : 'With the turntable stopped the cold spots stay cold.'}`, tx`上面と扉を外した電子レンジです。マグネトロン（右、冷却フィン付き）が、短い金属の管を通して鋼の箱へ波を送り込みます。波は箱の中で反射し、定在波の模様に落ち着きます。波打つ面がその模様です。皿の色は、薄い食品の層が温まる速さを表します。赤は速く、青はほとんど温まりません。${turn ? 'ターンテーブルが、食品の各部分を熱い場所と冷たい場所に順に運びます。' : 'ターンテーブルを止めると、冷たい場所は冷たいままです。'}`));
      L.setText(st.cap2, T(tx`Heating along a line from the centre of the plate to its rim: at one instant with the plate stopped (dashed), and averaged over a full turn (solid). Turning evens out everything except the centre, which never moves, and any rings the pattern happens to have.`, tx`皿の中心から縁までの線に沿った温まり方です。皿を止めたある瞬間（破線）と、1 回転で平均したもの（実線）を示します。回転は、動かない中心と、模様がたまたまもつ輪を除いて、すべてを均します。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 13], y: [0, 1.05], aspect: 0.8, maxH: 400, xlabel: T('distance from the centre of the plate (cm)', '皿の中心からの距離（cm）'), ylabel: T('heating (1 = hottest spot)', '温まり方（1 = 最も熱い点）') });
      g.line(L.sample(0, 13, 160, (r) => heat(BOX.a / 2 + r / 100, BOX.b / 2, m, n)), { c: 'muted', w: 1.8, dash: '5 4' });
      const av = L.sample(0, 13, 160, (r) => ringAverage(r / 100, m, n)); g.area(av, { c: 'c2', fo: 0.16, base: 0 }); g.line(av, { c: 'c2', w: 2.8 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('averaged over a turn', '1 回転の平均') }, { c: 'muted', dash: true, label: T('plate stopped', '皿を止めたとき') }]);
      ctx.readout([
        { k: T('standing wave: half-waves across, deep, high', '定在波：横、奥行き、高さ方向の半波長の数'), v: tx`\(${m},\ ${n},\ ${p}\)` },
        { k: T('its frequency', 'その周波数'), v: tx`\(${fmt(f / 1e9, 3)}\ \mathrm{GHz}\)`, tone: 'key' },
        { k: T('distance between hot spots', '熱い点の間隔'), v: tx`\(${fmt((100 * BOX.a) / m, 1)}\ \mathrm{cm}\)` },
        { k: T('coldest spot as a share of the hottest: stopped, turning', '最も冷たい点 ÷ 最も熱い点：停止、回転'), v: tx`\(${fmt(100 * u0.ratio, 0)}\,\%,\ ${fmt(100 * uniformity(m, n, true).ratio, 0)}\,\%\)`, tone: u.ratio > 0.3 ? 'good' : 'warn' },
        { k: T('patterns within 60 MHz of 2.45 GHz in this box', 'この箱で 2.45 GHz から 60 MHz 以内にある模様の数'), v: String(modesNear().length) },
      ], T('The free-space wavelength at 2.45 GHz is 12.2 cm, so hot spots sit about 6 cm apart. Ovens without a turntable stir the pattern instead, with a slowly turning metal fan in the duct.', '2.45 GHz の自由空間での波長は 12.2 cm なので、熱い点は約 6 cm 間隔で並びます。ターンテーブルのないレンジは、管の中でゆっくり回る金属の羽根で、模様のほうをかき混ぜます。'));
      void R;
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.8, maxH: 540, camera: [-3.6, -10, 7.6], target: [0.5, 0, 1.2], fov: 30,
        label: T('3D view of a microwave oven cavity with its standing wave and heating pattern. Drag to rotate.', '定在波と加熱の模様を示す電子レンジの庫内の 3D 図。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.ov = buildOven(S); st.t = 0; st.ang = 0;
          S.label(T('magnetron', 'マグネトロン'), [2.4, 0.6, 3.0], { small: true }); S.label(T('waveguide', '導波管'), [1.5, 0.6, 2.75], { small: true }); S.label(T('turntable', 'ターンテーブル'), [-1.2, -1.9, 0.75], { small: true }); S.label(T('transformer', '変圧器'), [2.5, -1.7, 1.35], { small: true });
          const draw = (dt) => { const q = st.q; st.t += dt; if (q.turn) st.ang += dt * 0.5; st.ov.table.rotation.z = st.ang; st.ov.setWave(q.m, q.n, st.t * 2.2); st.ov.paint(q.m, q.n, false, st.ang); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); if (S.reduced()) st.ov.paint(st.q.m, st.q.n, st.q.turn, 0); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [0, 33], y: [0, 33], equal: true, maxH: 380, grid: false }); for (let i = 0; i < 22; i++) for (let j = 0; j < 22; j++) f2.rect(i * 1.5, j * 1.5, 1.5, 1.5, { c: 'c2', fill: 'c2', fo: heat((i + 0.5) * 0.015, (j + 0.5) * 0.015, m, n) * 0.9, w: 0 }); },
      });
    },
  };

  /* ================= 2. why water heats ================= */
  D['dielectric-heating'] = {
    render(ctx, v) {
      const f = 10 ** v.lf * 1e9, Tc = v.T, e = eps(f, Tc), dp = depth(e.re, e.im, f), e245 = eps(F0, Tc), d245 = depth(e245.re, e245.im, F0), lg = Math.log10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How water at \(${Tc}\) °C responds to an alternating electric field. Its molecules are lopsided in charge and try to turn with the field. At low frequency they keep up and store energy (blue); near 20 GHz they lag by the most and turn the most energy into heat (red); far above, they cannot follow at all. Drag the gold point.`, tx`\(${Tc}\) °C の水が交流の電場にどう応答するかを示します。水の分子は電荷が偏っていて、電場に合わせて向きを変えようとします。低い周波数では電場についていき、エネルギーを蓄えます（青）。20 GHz 付近では最も大きく遅れ、最も多くのエネルギーを熱に変えます（赤）。それよりずっと高い周波数では、まったくついていけません。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [-1, 2.3], y: [0, 90], aspect: 0.68, maxH: 340, xlabel: T('frequency (GHz)', '周波数（GHz）'), ylabel: T('relative permittivity', '比誘電率'), ticksX: [[-1, '0.1'], [0, '1'], [lg(2.45), '2.45'], [1, '10'], [2, '100']] });
      a.vline(lg(2.45), { c: 'c3', dash: '4 3' }); a.line(L.sample(-1, 2.3, 200, (x) => eps(10 ** x * 1e9, Tc).re), { c: 'c1', w: 2.6 }); a.line(L.sample(-1, 2.3, 200, (x) => eps(10 ** x * 1e9, Tc).im), { c: 'c2', w: 2.6 });
      a.handle(v.lf, e.im, { c: 'hl', axis: 'x', bounds: [-1, 2.3, 0, 90], label: T('frequency', '周波数'), onDrag: (x) => ctx.set('lf', clamp(Math.round(x * 50) / 50, -1, 2.3)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How deep the waves get before most of their power is absorbed. An oven does not use the frequency that heats water fastest: that would cook only the outer millimetres. At 2.45 GHz (dashed) the waves reach a centimetre or two in, and deeper as the food warms. Ice (grey) barely absorbs at all.`, tx`パワーの大部分が吸収されるまでに、波がどこまで深く届くかを示します。レンジは、水を最も速く温める周波数を使いません。それでは表面の数ミリメートルしか加熱できないからです。2.45 GHz（破線）では、波は 1 から 2 センチメートルの深さまで届き、食品が温まるとさらに深く届きます。氷（灰色）はほとんど吸収しません。`));
      const b = L.fig(c2, { x: [-1, 2.3], y: [-1.5, 3.3], aspect: 0.68, maxH: 340, xlabel: T('frequency (GHz)', '周波数（GHz）'), ylabel: T('depth to 37 % power (cm)', 'パワーが 37 % になる深さ（cm）'), ticksX: [[-1, '0.1'], [0, '1'], [lg(2.45), '2.45'], [1, '10'], [2, '100']], ticksY: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
      b.vline(lg(2.45), { c: 'c3', dash: '4 3' }); b.line(L.sample(-1, 2.3, 200, (x) => lg(100 * depth(ICE.re, ICE.im, 10 ** x * 1e9))), { c: 'muted', w: 1.8 });
      b.line(L.sample(-1, 2.3, 200, (x) => { const q = eps(10 ** x * 1e9, 80); return lg(100 * depth(q.re, q.im, 10 ** x * 1e9)); }), { c: 'c2', w: 1.6, dash: '5 4' });
      b.line(L.sample(-1, 2.3, 200, (x) => { const q = eps(10 ** x * 1e9, Tc); return lg(100 * depth(q.re, q.im, 10 ** x * 1e9)); }), { c: 'c1', w: 2.8 }); b.dot(v.lf, lg(100 * dp), { c: 'hl', r: 5.5 });
      L.legend(ctx.host, [{ c: 'c1', label: T('energy stored; depth in water', '蓄えるエネルギー、水での深さ') }, { c: 'c2', label: T('energy turned to heat; water at 80 °C (dashed)', '熱になるエネルギー、80 °C の水（破線）') }, { c: 'muted', label: T('ice', '氷') }, { c: 'c3', dash: true, label: '2.45 GHz' }]);
      ctx.readout([
        { k: T('stored and lost parts at this frequency', 'この周波数での蓄える成分と失う成分'), v: tx`\(\varepsilon'=${fmt(e.re, 1)},\ \varepsilon''=${fmt(e.im, 1)}\)` },
        { k: T('depth in water here, at 2.45 GHz', 'ここでの水の中の深さ、2.45 GHz での深さ'), v: tx`\(${fmt(dp * 100, 2)},\ ${fmt(d245 * 100, 2)}\ \mathrm{cm}\)`, tone: 'key' },
        { k: T('depth in ice at 2.45 GHz', '2.45 GHz での氷の中の深さ'), v: tx`\(${fmt(depth(ICE.re, ICE.im, F0), 1)}\ \mathrm{m}\)` },
        { k: T('wavelength inside water at 2.45 GHz', '2.45 GHz での水の中の波長'), v: tx`\(${fmt((100 * C0) / F0 / Math.sqrt(e245.re), 2)}\ \mathrm{cm}\)` },
        { k: T('a 250 g cup from 20 °C to 80 °C at 800 W', '250 g のカップを 800 W で 20 °C から 80 °C に'), v: tx`\(${fmt(heatTime(250, 60, 800), 0)}\ \mathrm{s}\)` },
      ], T('Defrosting is slow because ice hardly absorbs, and treacherous because the first patch to melt absorbs thousands of times more than the ice around it and runs away. The defrost setting switches the power off for most of each cycle to let heat spread by conduction.', '解凍に時間がかかるのは、氷がほとんど吸収しないからです。また、最初に溶けた部分が周りの氷の数千倍も吸収して一気に熱くなるので、むらができます。解凍モードは、各周期の大部分で電力を切り、熱が伝導で広がるのを待ちます。'));
    },
  };

  /* ================= 3. the magnetron ================= */
  D['magnetron-orbits'] = {
    render(ctx, v) {
      const V = v.kv * 1000, B = v.b / 1000, Bc = hullB(V), o = orbit(V, B), mm = 1000;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The heart of the magnetron seen end on: a hot cathode in the middle, a ring of copper anode with ten cavities round it, and a magnetic field pointing out of the page. The gold curve is one electron. With a weak field it flies straight across; with a strong one it is bent back and skims round the cathode, and as it passes the cavity mouths it hands its energy to the waves ringing inside them.`, tx`マグネトロンの中心部を端から見た図です。中央に熱い陰極があり、その周りを 10 個の空洞をもつ銅の陽極の輪が囲み、磁場は紙面から手前を向いています。金色の曲線は 1 個の電子です。磁場が弱いとまっすぐ陽極へ飛びます。強いと曲げ戻されて陰極の周りをかすめて回り、空洞の口を通るたびに、中で振動している波にエネルギーを渡します。`));
      const f = L.fig(c1, { x: [-8.2, 8.2], y: [-8.2, 8.2], equal: true, aspect: 1, maxH: 420, axes: false, grid: false });
      f.circle(0, 0, 8, { c: 'c2', fill: 'c2', fo: 0.35, w: 1.5 }); f.circle(0, 0, 4.5, { c: 'ink', fill: 'plate', fo: 1, w: 1.2 });
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + 0.31; f.circle(6.1 * Math.cos(a), 6.1 * Math.sin(a), 0.95, { c: 'ink', fill: 'plate', fo: 1, w: 1 }); f.line([[4.4 * Math.cos(a - 0.05), 4.4 * Math.sin(a - 0.05)], [5.25 * Math.cos(a - 0.04), 5.25 * Math.sin(a - 0.04)]], { c: 'plate', w: 5 }); }
      f.circle(0, 0, 2, { c: 'c2', fill: 'hl', fo: 0.8, w: 1.5 }); f.line(o.pts.map((q) => [q[0] * mm, q[1] * mm]), { c: 'hl', w: 2.6 });
      f.text(0, 0, T('cathode', '陰極'), { small: true }); f.text(0, 7.3, T('anode', '陽極'), { small: true });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The field needed to stop electrons reaching the anode, against the voltage (curve). A magnetron works just above this line, in the shaded region, where electrons circle instead of crossing. Drag the gold point to set voltage and field.`, tx`電子が陽極に届かなくなるのに必要な磁場を、電圧に対して描いています（曲線）。マグネトロンは、この線のすぐ上の色を付けた領域で働きます。そこでは電子は横切らずに回ります。金色の点をドラッグして、電圧と磁場を決めてください。`));
      const g = L.fig(c2, { x: [0.5, 6], y: [0, 300], aspect: 0.8, maxH: 380, xlabel: T('anode voltage (kV)', '陽極電圧（kV）'), ylabel: T('magnetic field (mT)', '磁場（mT）') });
      const cv = L.sample(0.5, 6, 80, (x) => hullB(x * 1000) * 1000); g.poly([...cv, [6, 300], [0.5, 300]], { c: 'c1', fill: 'c1', fo: 0.12, w: 0 }); g.line(cv, { c: 'c1', w: 2.6 });
      g.handle(v.kv, v.b, { c: 'hl', bounds: [0.5, 6, 20, 300], label: T('voltage and field', '電圧と磁場'), onDrag: (x, y) => { ctx.set('kv', clamp(Math.round(x * 10) / 10, 0.5, 6), true); ctx.set('b', clamp(Math.round(y / 2) * 2, 20, 300)); } });
      L.legend(ctx.host, [{ c: 'hl', label: T('one electron', '電子 1 個') }, { c: 'c1', label: T('cut-off field; electrons circle above it', '遮断磁場、その上では電子が回る') }]);
      ctx.readout([
        { k: T('cut-off field at this voltage', 'この電圧での遮断磁場'), v: tx`\(${fmt(Bc * 1000, 0)}\ \mathrm{mT}\)`, tone: 'key' },
        { k: T('electron', '電子'), v: o.hit ? T('reaches the anode: no oscillation', '陽極に届く：発振しない') : T('turns back and circles', '曲がって戻り、回る'), tone: o.hit ? 'warn' : 'good' },
        { k: T('furthest it gets from the axis', '軸から最も離れる距離'), v: tx`\(${fmt(o.rmax * 1000, 2)}\ \mathrm{mm}\ \text{of}\ 4.5\)` },
        { k: T('speed it would gain crossing the full voltage', '全電圧を横切ったときに得る速さ'), v: tx`\(${fmt(Math.sqrt((2 * QE * V) / ME) / C0 * 100, 0)}\,\%\ \text{of light}\)` },
      ], T('A domestic magnetron runs at about 4 kV and 300 mA and turns roughly 70 per cent of that into microwaves, which is unusually good for a vacuum tube and is why a design from the 1940s is still in every kitchen.', '家庭用のマグネトロンは約 4 kV、300 mA で動作し、その約 70 % をマイクロ波に変えます。真空管としては異例に高い効率で、1940 年代の設計が今もすべての台所にあるのはそのためです。'));
    },
  };
})();
