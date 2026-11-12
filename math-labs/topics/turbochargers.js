'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Compressor: T2 = T1 (1 + (PR^((g-1)/g) - 1) / eta_c). Intercooler: T3 = T2 - eps (T2 - T1).
   * Density ratio = PR T1 / T3. Work per kg dh = cp (T2 - T1) = 0.85 U^2 with U the tip speed of the wheel.
   * Engine: 2.0 litre four-stroke, volumetric efficiency 0.9, air-fuel ratio 14.7, 34 per cent of the fuel's
   * 43 MJ/kg reaching the crankshaft.
   * Turbine: expansion ratio ER = 1 + (m_exhaust / (0.085 size))^2, power = m cp_e T_e eta_t (1 - ER^-((ge-1)/ge)).
   * Rotor inertia 3e-5 size^5 kg m^2, compressor wheel 50 size mm. A wastegate holds boost at its setting.
   */
  const T1 = 298, CP = 1005, GA = 1.4, CPE = 1150, GE = 1.33, TEX = 1100, ETAT = 0.665, ETAC = 0.72, RHO1 = 1.184, VD = 0.002;
  const compT = (pr, eta = ETAC, t1 = T1) => t1 * (1 + (pr ** ((GA - 1) / GA) - 1) / eta);
  const coolT = (pr, eps, eta = ETAC) => { const t2 = compT(pr, eta); return t2 - eps * (t2 - T1); };
  const densityRatio = (pr, eps = 0, eta = ETAC) => (pr * T1) / coolT(pr, eps, eta);
  const work = (pr, eta = ETAC) => CP * (compT(pr, eta) - T1);                                        // J/kg
  const tipSpeed = (pr) => Math.sqrt(work(pr) / 0.85);
  const shaftRpm = (pr, size = 1) => (tipSpeed(pr) / (PI * 0.05 * size)) * 60;
  const prFromOmega = (om, size = 1) => { const U = (om * 0.05 * size) / 2; return (1 + (ETAC * 0.85 * U * U) / (CP * T1)) ** (GA / (GA - 1)); };
  const airflow = (rpm, pr, eps = 0.7) => 0.9 * VD * (rpm / 120) * RHO1 * densityRatio(pr, eps);        // kg/s
  const enginePower = (m) => (m / 14.7) * 43e6 * 0.34;                                                 // W
  const expansion = (m, size) => 1 + ((m * (1 + 1 / 14.7)) / (0.085 * size)) ** 2;
  const turbineP = (m, size) => m * (1 + 1 / 14.7) * CPE * TEX * ETAT * (1 - expansion(m, size) ** (-(GE - 1) / GE));
  const compP = (m, pr) => m * work(pr);
  function steadyPR(rpm, size, target) { const f = (pr) => { const m = airflow(rpm, pr); return turbineP(m, size) - compP(m, pr); }; if (f(target) >= 0) return target; let a = 1, b = target; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (f(c) > 0) a = c; else b = c; } return (a + b) / 2; }
  const inertia = (size) => 3e-5 * size ** 5;
  function spool(rpm, size, target, tEnd = 6, dt = 0.002) { let om = (20000 * TAU) / 60 / size, t = 0, t90 = Infinity; const I = inertia(size), tr = [], goal = steadyPR(rpm, size, target);
    while (t <= tEnd) { const pr = Math.min(target, prFromOmega(om, size)), m = airflow(rpm, pr), net = pr >= target ? Math.min(0, turbineP(m, size) - compP(m, pr)) : turbineP(m, size) - compP(m, pr); om = Math.max(1, om + (net / (I * om)) * dt); t += dt; if (t90 === Infinity && pr - 1 >= 0.9 * (goal - 1)) t90 = t; if (Math.round(t / dt) % 10 === 0) tr.push([t, pr - 1]); }
    return { tr, t90, goal }; }
  const M = { T1, compT, coolT, densityRatio, work, tipSpeed, shaftRpm, prFromOmega, airflow, enginePower, expansion, turbineP, compP, steadyPR, inertia, spool };
  (window.LabModels = window.LabModels || {}).turbochargers = M;

  /* ================= 1. the turbocharger (3D) ================= */
  function buildTurbo(S) {
    const TH = S.THREE, g = new TH.Group(), T0 = PI / 2, CUT = PI * 1.5;                              // shaft along x; compressor at -x, turbine at +x
    const alu = S.mat('#c9ced4', { metal: 1, rough: 0.35, side: 2 }), iron = S.mat('#6a5d55', { metal: 0.9, rough: 0.6, side: 2 }), steel = S.mat('#dfe3e7', { metal: 1, rough: 0.2 }), inco = S.mat('#8f7f6c', { metal: 1, rough: 0.35 }), bronze = S.mat('#b58a4a', { metal: 1, rough: 0.35 }), black = S.mat('#202226', { rough: 0.6 });
    const lathe = (pts, mat, t0 = T0, len = CUT, parent = g) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0], q[1])), 56, t0, len).rotateZ(-PI / 2), mat); m.castShadow = true; parent.add(m); return m; };
    const volute = (x, R, r, mat) => { const m = new TH.Mesh(new TH.TorusGeometry(R, r, 20, 56, CUT).rotateY(PI / 2).rotateX(-PI / 2), mat); m.position.x = x; m.castShadow = true; g.add(m); };
    // compressor cover: scroll, inlet duct and shroud; outlet stub
    volute(-1.05, 1.25, 0.42, alu); lathe([[0.62, -2.3], [0.7, -2.3], [0.7, -1.5], [1.0, -1.15], [0.9, -1.1], [0.62, -1.45]], alu); lathe([[0.2, -0.72], [1.3, -0.72], [1.3, -0.62], [0.2, -0.62]], alu);
    { const o = new TH.Mesh(new TH.CylinderGeometry(0.42, 0.42, 1.7, 28, 1, true).rotateX(PI / 2), alu); o.position.set(-1.05, 1.25, 0.85); g.add(o); }
    // turbine housing: scroll, outlet duct; inlet stub with flange
    volute(1.05, 1.15, 0.4, iron); lathe([[0.58, 2.2], [0.68, 2.2], [0.68, 1.45], [0.95, 1.12], [0.85, 1.08], [0.58, 1.4]], iron); lathe([[0.2, 0.62], [1.2, 0.62], [1.2, 0.72], [0.2, 0.72]], iron);
    { const o = new TH.Mesh(new TH.CylinderGeometry(0.4, 0.4, 1.6, 28, 1, true).rotateX(PI / 2), iron); o.position.set(1.05, 1.15, 0.8); g.add(o); const fl = new TH.Mesh(new TH.BoxGeometry(1.2, 1.2, 0.12), iron); fl.position.set(1.05, 1.15, 1.6); g.add(fl); }
    // centre housing with bearings
    lathe([[0.18, -0.62], [0.7, -0.62], [0.7, -0.4], [0.5, -0.3], [0.5, 0.3], [0.7, 0.4], [0.7, 0.62], [0.18, 0.62]], S.mat('#55595f', { metal: 0.9, rough: 0.55, side: 2 }));
    for (const x of [-0.35, 0.35]) { const b = new TH.Mesh(new TH.CylinderGeometry(0.17, 0.17, 0.26, 20).rotateZ(PI / 2), bronze); b.position.x = x; g.add(b); }
    // rotor: shaft and two wheels
    const rotor = new TH.Group(); g.add(rotor);
    { const sh = new TH.Mesh(new TH.CylinderGeometry(0.09, 0.09, 2.9, 16).rotateZ(PI / 2), steel); rotor.add(sh); }
    const wheel = (sgn, mat, n, rTip, len) => { const w = new TH.Group(), hub = []; for (let i = 0; i <= 12; i++) { const u = i / 12; hub.push([0.13 + (rTip * 0.55 - 0.13) * u ** 2.2, sgn * (0.78 + len * (1 - u))]); } hub.push([rTip, sgn * 0.78], [rTip, sgn * 0.72], [0.1, sgn * 0.72]); const h = new TH.Mesh(new TH.LatheGeometry(hub.map((q) => new TH.Vector2(q[0], q[1])), 40).rotateZ(-PI / 2), mat); h.castShadow = true; w.add(h);
      for (let k = 0; k < n; k++) { const bl = new TH.Mesh(new TH.BoxGeometry(len * 0.92, 0.022, rTip * 0.72), mat), pv = new TH.Group(); bl.position.set(sgn * (0.78 + len * 0.46), 0, rTip * 0.6); bl.rotation.z = sgn * 0.0; bl.rotation.x = 0.22 * sgn; pv.rotation.x = (k / n) * TAU; pv.add(bl); w.add(pv); } rotor.add(w); };
    wheel(-1, steel, 12, 0.88, 0.7); wheel(1, inco, 11, 0.8, 0.62);
    // wastegate actuator and rod
    { const can = new TH.Mesh(new TH.CylinderGeometry(0.42, 0.42, 0.5, 24).rotateZ(PI / 2), S.mat('#b9a13a', { metal: 0.8, rough: 0.4 })); can.position.set(-0.9, -1.45, -1.55); g.add(can); const rod = new TH.Mesh(new TH.CylinderGeometry(0.035, 0.035, 2.0, 8).rotateZ(PI / 2), steel); rod.position.set(0.35, -1.45, -1.55); g.add(rod); const arm = new TH.Mesh(new TH.BoxGeometry(0.1, 0.5, 0.1), black); arm.position.set(1.35, -1.25, -1.55); g.add(arm); }
    const cold = S.lines([], { c: 'c1', opacity: 0.95, w: 2.6 }), hot = S.lines([], { c: 'c2', opacity: 0.95, w: 2.6 });
    S.add(g);
    return { rotor, cold, hot };
  }
  D['turbo-cutaway'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const target = 1 + v.boost, pr = steadyPR(v.rpm, v.size, target), rpmT = shaftRpm(pr, v.size), m = airflow(v.rpm, pr), m0 = airflow(v.rpm, 1); st.spin = rpmT;
      L.setText(st.cap1, T(tx`A turbocharger with a quarter of each housing cut away. Exhaust from the engine (red) enters the iron scroll on the right, is squeezed inward through the turbine wheel and leaves along the axis, having given up part of its energy. The turbine drives, through a shaft the thickness of a pencil, the aluminium compressor wheel on the left, which draws fresh air in along the axis (blue) and flings it outward into its own scroll at higher pressure. The can on top opens a bypass round the turbine when the pressure is high enough.`, tx`それぞれのハウジングの 4 分の 1 を切り取った、ターボチャージャーです。エンジンからの排気（赤）は、右側の鋳鉄の渦巻き室に入り、タービンホイールを通って内側へ絞られ、エネルギーの一部を渡して、軸に沿って出ていきます。タービンは、鉛筆ほどの太さの軸を介して、左側のアルミニウムのコンプレッサーホイールを回します。コンプレッサーは、新しい空気を軸に沿って吸い込み（青）、外側へ飛ばして、自分の渦巻き室に高い圧力で送ります。上の缶は、圧力が十分に高くなると、タービンを迂回する通路を開きます。`));
      L.setText(st.cap2, T(tx`Boost against engine speed at full throttle, for this turbocharger (blue) and for ones 30 per cent smaller and larger (grey). At low speed the engine makes too little exhaust to drive the turbine hard. Boost then climbs steeply, and at \(${fmt(v.boost, 1)}\) bar the wastegate opens and holds it there. Drag the gold point.`, tx`全開時の過給圧を、エンジンの回転数に対して描いています。青はこのターボ、灰色は 30 % 小さいものと大きいものです。低回転では、エンジンの排気が少なく、タービンを強く回せません。その後、過給圧は急に上がり、\(${fmt(v.boost, 1)}\) bar でウェイストゲートが開いて、そこに保ちます。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [1000, 6500], y: [0, 2.2], aspect: 0.8, maxH: 400, xlabel: T('engine speed (rpm)', 'エンジンの回転数（rpm）'), ylabel: T('boost above the air outside (bar)', '大気より高い過給圧（bar）') });
      [v.size * 0.7, v.size * 1.3].forEach((s) => g.line(L.sample(1000, 6500, 56, (q) => steadyPR(q, s, target) - 1), { c: 'muted', w: 1.3 })); g.line(L.sample(1000, 6500, 111, (q) => steadyPR(q, v.size, target) - 1), { c: 'c1', w: 2.8 });
      g.handle(v.rpm, pr - 1, { c: 'hl', axis: 'x', bounds: [1000, 6500, 0, 2.2], label: T('engine speed', 'エンジンの回転数'), onDrag: (x) => ctx.set('rpm', clamp(Math.round(x / 100) * 100, 1000, 6500)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('this turbocharger', 'このターボ') }, { c: 'muted', label: T('smaller and larger', '小さいものと大きいもの') }]);
      ctx.readout([
        { k: T('boost', '過給圧'), v: tx`\(${fmt(pr - 1, 2)}\ \mathrm{bar}\)`, tone: 'key' },
        { k: T('wastegate', 'ウェイストゲート'), v: T(pr >= target - 1e-6 ? 'open' : 'shut', pr >= target - 1e-6 ? '開いている' : '閉じている') },
        { k: T('shaft speed', '軸の回転数'), v: tx`\(${fmt(rpmT / 1000, 0)}\,000\ \mathrm{rpm}\)` },
        { k: T('speed of the compressor blade tips', 'コンプレッサーの羽根の先端の速さ'), v: tx`\(${fmt(tipSpeed(pr), 0)}\ \mathrm{m/s}\)` },
        { k: T('air into the engine', 'エンジンに入る空気'), v: tx`\(${fmt(m * 1000, 0)}\ \mathrm{g/s}\ (\times${fmt(m / m0, 2)})\)` },
        { k: T('engine power: with boost, without', 'エンジンの出力：過給あり、過給なし'), v: tx`\(${fmt(enginePower(m) / 1000, 0)},\ ${fmt(enginePower(m0) / 1000, 0)}\ \mathrm{kW}\)`, tone: 'good' },
      ], T('The wheels spin about thirty times faster than the engine, on a film of the engine’s own oil, with one end in air cooler than the room and the other in gas at a red heat.', 'ホイールは、エンジンの約 30 倍の速さで、エンジン自身の油の膜の上で回ります。一方の端は室温より冷たい空気の中に、もう一方の端は赤熱したガスの中にあります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.8, maxH: 540, camera: [1.2, -8.6, 5.6], target: [0, 0.2, 0.2], fov: 30,
        label: T('3D turbocharger with its housings cut away. Drag to rotate.', 'ハウジングを切り取ったターボチャージャーの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.tb = buildTurbo(S); st.t = 0; st.ang = 0;
          S.label(T('compressor', 'コンプレッサー'), [-2.6, -1.2, -1.2], { small: true }); S.label(T('turbine', 'タービン'), [2.6, -1.2, -1.2], { small: true }); S.label(T('air in', '吸気'), [-3.4, 0, 0.5], { small: true }); S.label(T('exhaust in', '排気'), [1.05, 1.15, 2.7], { small: true }); S.label(T('wastegate', 'ウェイストゲート'), [-0.9, -1.45, -2.25], { small: true });
          const draw = (dt) => { const m = st.tb; st.t += dt; st.ang += dt * (4 + st.spin / 9000); m.rotor.rotation.x = st.ang; const ph = (st.t * 1.3) % 1, cs = [], hs = [];
            for (let k = 0; k < 5; k++) { const u = (ph + k / 5) % 1; for (const [dy, dz] of [[0.25, 0.2], [-0.2, 0.25], [0.05, -0.3]]) { cs.push([[-3.6 + 1.9 * u, dy, dz], [-3.6 + 1.9 * u + 0.28, dy, dz]]); hs.push([[1.5 + 2.1 * u, dy, dz], [1.5 + 2.1 * u + 0.3, dy, dz]]); } cs.push([[-1.05, 1.25, 0.6 + 1.8 * u], [-1.05, 1.25, 0.6 + 1.8 * u + 0.28]]); hs.push([[1.05, 1.15, 3.0 - 1.8 * u], [1.05, 1.15, 3.0 - 1.8 * u - 0.28]]); } m.cold.update(cs); m.hot.update(hs); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-3, 3], y: [-2, 2], equal: true, maxH: 300, axes: false, grid: false }); f2.circle(-1.05, 0, 1.6, { c: 'c1', fill: 'c1', fo: 0.2, w: 1.6 }); f2.circle(1.05, 0, 1.5, { c: 'c2', fill: 'c2', fo: 0.2, w: 1.6 }); f2.seg([-1.5, 0], [1.5, 0], { c: 'ink', w: 4 }); },
      });
    },
  };

  /* ================= 2. pressure is not density ================= */
  D['boost-density'] = {
    render(ctx, v) {
      const t2 = compT(v.pr, v.eta), t3 = coolT(v.pr, v.eps, v.eta), d0 = densityRatio(v.pr, 0, v.eta), d1 = densityRatio(v.pr, v.eps, v.eta);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Temperature of the air leaving the compressor against how much it has been compressed. Squeezing a gas heats it, and an imperfect compressor heats it more: the grey curve is a perfect one, the red one is \(${fmt(v.eta * 100, 0)}\) per cent efficient. The blue curve is the same air after an intercooler has taken out \(${fmt(v.eps * 100, 0)}\) per cent of the heat it gained. Drag the gold point.`, tx`コンプレッサーを出る空気の温度を、圧縮の度合いに対して描いています。気体は、圧縮すると熱くなり、不完全なコンプレッサーではさらに熱くなります。灰色の曲線は完全な場合、赤は効率 \(${fmt(v.eta * 100, 0)}\) % の場合です。青い曲線は、インタークーラーが、得た熱の \(${fmt(v.eps * 100, 0)}\) % を取り除いた後の同じ空気です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [1, 3.5], y: [0, 260], aspect: 0.7, maxH: 350, xlabel: T('pressure ratio', '圧力比'), ylabel: T('air temperature (°C)', '空気の温度（°C）') });
      a.line(L.sample(1, 3.5, 60, (q) => compT(q, 1) - 273), { c: 'muted', w: 1.4 }); a.line(L.sample(1, 3.5, 60, (q) => Math.min(260, compT(q, v.eta) - 273)), { c: 'c2', w: 2.6 }); a.line(L.sample(1, 3.5, 60, (q) => coolT(q, v.eps, v.eta) - 273), { c: 'c1', w: 2.6 });
      a.handle(v.pr, Math.min(260, t2 - 273), { c: 'hl', axis: 'x', bounds: [1, 3.5, 0, 260], label: T('pressure ratio', '圧力比'), onDrag: (x) => ctx.set('pr', clamp(Math.round(x * 20) / 20, 1, 3.5)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How much more air the engine swallows on each stroke, against pressure ratio. An engine burns fuel in proportion to the mass of air in its cylinders, and that depends on density, not pressure. If the air stayed cool, density would follow the dashed line. Hot from the compressor (red) it falls well short; the intercooler (blue) recovers most of the gap.`, tx`エンジンが 1 行程で吸い込む空気がどれだけ増えるかを、圧力比に対して描いています。エンジンが燃やせる燃料は、シリンダーの中の空気の質量に比例し、それは圧力ではなく密度で決まります。空気が冷たいままなら、密度は破線に従います。コンプレッサーから出た熱い空気（赤）は、それを大きく下回ります。インタークーラー（青）が、その差のほとんどを取り戻します。`));
      const b = L.fig(c2, { x: [1, 3.5], y: [1, 3.5], aspect: 0.7, maxH: 350, xlabel: T('pressure ratio', '圧力比'), ylabel: T('density ratio', '密度比') });
      b.line([[1, 1], [3.5, 3.5]], { c: 'muted', dash: '5 4' }); b.line(L.sample(1, 3.5, 60, (q) => densityRatio(q, 0, v.eta)), { c: 'c2', w: 2.6 }); b.line(L.sample(1, 3.5, 60, (q) => densityRatio(q, v.eps, v.eta)), { c: 'c1', w: 2.6 }); b.dot(v.pr, d1, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c2', label: T('straight from the compressor', 'コンプレッサーから直接') }, { c: 'c1', label: T('after the intercooler', 'インタークーラーの後') }, { c: 'muted', label: T('perfect compressor; no heating at all', '完全なコンプレッサー、まったく温まらない場合') }]);
      ctx.readout([
        { k: T('leaves the compressor at', 'コンプレッサーの出口温度'), v: tx`\(${fmt(t2 - 273, 0)}\ ^\circ\mathrm{C}\)`, tone: t2 - 273 > 180 ? 'warn' : undefined },
        { k: T('leaves the intercooler at', 'インタークーラーの出口温度'), v: tx`\(${fmt(t3 - 273, 0)}\ ^\circ\mathrm{C}\)` },
        { k: T('density: without, with intercooler', '密度：インタークーラーなし、あり'), v: tx`\(\times${fmt(d0, 2)},\ \times${fmt(d1, 2)}\)`, tone: 'key' },
        { k: T('the intercooler adds', 'インタークーラーによる増加'), v: tx`\(${fmt(100 * (d1 / d0 - 1), 0)}\ \%\)`, tone: 'good' },
        { k: T('work to compress each kilogram', '1 kg を圧縮する仕事'), v: tx`\(${fmt(work(v.pr, v.eta) / 1000, 0)}\ \mathrm{kJ}\)` },
      ], T('Cooler charge is also safer charge: petrol and air that start hotter are more likely to ignite by themselves before the spark, which is the limit on how much boost an engine can use.', '冷たい混合気は、安全な混合気でもあります。最初から熱いガソリンと空気は、点火の前にひとりでに燃えやすくなります。これが、エンジンが使える過給圧の限界を決めます。'));
    },
  };

  /* ================= 3. turbo lag ================= */
  D['turbo-lag'] = {
    render(ctx, v) {
      const target = 1 + v.boost, sp = spool(v.rpm, v.size, target), sm = spool(v.rpm, v.size * 0.7, target), lg = spool(v.rpm, v.size * 1.3, target);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Boost against time after the throttle is opened wide at \(${fmt(v.rpm, 0)}\) rpm. Nothing connects the turbine to the crankshaft: the wheels must be spun up by the exhaust, and the exhaust is weak until there is boost. So the rise starts slowly and feeds on itself. The grey curves are turbochargers 30 per cent smaller and larger.`, tx`毎分 \(${fmt(v.rpm, 0)}\) 回転でスロットルを全開にした後の過給圧を、時間に対して描いています。タービンは、クランク軸とはつながっていません。ホイールは排気で回さなければならず、過給がかかるまで排気は弱いままです。そのため、立ち上がりは遅く始まり、自らを強めていきます。灰色の曲線は、30 % 小さいターボと大きいターボです。`));
      const a = L.fig(c1, { x: [0, 4], y: [0, v.boost * 1.15], aspect: 0.7, maxH: 350, xlabel: T('time since the throttle opened (s)', 'スロットルを開けてからの時間（秒）'), ylabel: T('boost (bar)', '過給圧（bar）') });
      a.hline(v.boost, { c: 'muted', dash: '5 4' }); [sm, lg].forEach((s) => a.line(s.tr.filter((q) => q[0] <= 4), { c: 'muted', w: 1.3 })); a.line(sp.tr.filter((q) => q[0] <= 4), { c: 'c1', w: 2.8 }); if (sp.t90 < 4) a.vline(sp.t90, { c: 'c2', dash: '4 3' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Time to reach nine tenths of the final boost against the size of the turbocharger, at this engine speed (blue) and at 1000 rpm more and less. The inertia of the wheels goes as the fifth power of their size, so a turbocharger big enough to feed the engine at full speed is slow to wake at low speed. Drag the gold point.`, tx`最終的な過給圧の 10 分の 9 に達するまでの時間を、ターボの大きさに対して描いています。青はこのエンジン回転数、灰色は毎分 1000 回転高い場合と低い場合です。ホイールの慣性は大きさの 5 乗に比例するので、高回転でエンジンに十分な空気を送れる大きなターボは、低回転では立ち上がりが遅くなります。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0.6, 1.6], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('size of the turbocharger (1 = this engine’s usual)', 'ターボの大きさ（1 = このエンジンの標準）'), ylabel: T('time to 90 % of boost (s)', '過給圧の 90 % に達する時間（秒）') });
      [v.rpm - 1000, v.rpm + 1000].filter((q) => q >= 1000).forEach((r) => b.line(L.sample(0.6, 1.6, 21, (q) => Math.min(4, spool(r, q, target, 4.2, 0.004).t90)), { c: 'muted', w: 1.3 })); b.line(L.sample(0.6, 1.6, 26, (q) => Math.min(4, spool(v.rpm, q, target, 4.2, 0.004).t90)), { c: 'c1', w: 2.8 });
      b.handle(v.size, Math.min(4, sp.t90), { c: 'hl', axis: 'x', bounds: [0.6, 1.6, 0, 4], label: T('size', '大きさ'), onDrag: (x) => ctx.set('size', clamp(Math.round(x * 20) / 20, 0.6, 1.6)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('this turbocharger and engine speed', 'このターボとエンジン回転数') }, { c: 'muted', label: T('others; boost asked for', 'ほかの場合、求める過給圧') }, { c: 'c2', dash: true, label: T('90 % reached', '90 % に達した時刻') }]);
      ctx.readout([
        { k: T('boost reached in the end', '最終的に達する過給圧'), v: tx`\(${fmt(sp.goal - 1, 2)}\ \mathrm{bar}\)`, tone: sp.goal < target - 1e-6 ? 'warn' : 'good' },
        { k: T('time to 90 % of it', 'その 90 % に達する時間'), v: sp.t90 < 6 ? tx`\(${fmt(sp.t90, 2)}\ \mathrm{s}\)` : T('over 6 s', '6 秒以上'), tone: 'key' },
        { k: T('inertia of the rotor', '回転体の慣性'), v: tx`\(${fmt(inertia(v.size) * 1e5, 1)}\times10^{-5}\ \mathrm{kg\,m^2}\)` },
        { k: T('energy stored in it at full boost', '最大過給時に蓄えられるエネルギー'), v: tx`\(${fmt((0.5 * inertia(v.size) * ((shaftRpm(sp.goal, v.size) * TAU) / 60) ** 2) / 1000, 1)}\ \mathrm{kJ}\)` },
        { k: T('same change with a smaller, larger unit', '小さいもの、大きいものでの同じ変化'), v: tx`\(${sm.t90 < 6 ? fmt(sm.t90, 2) : '>6'},\ ${lg.t90 < 6 ? fmt(lg.t90, 2) : '>6'}\ \mathrm{s}\)` },
      ], T(sp.goal < target - 1e-6 ? 'At this speed the engine cannot supply enough exhaust to reach the boost asked for, however long it waits. This is below the turbocharger’s threshold.' : 'Engineers fight the delay with lighter wheels, two scrolls, variable vanes, two turbochargers of different sizes, or an electric motor on the shaft.', sp.goal < target - 1e-6 ? 'この回転数では、どれだけ待っても、求める過給圧に達するだけの排気をエンジンが供給できません。ターボが働き始める回転数より下です。' : '技術者は、軽いホイール、二つに分けた渦巻き室、可変の羽根、大きさの違う二つのターボ、軸に付けた電動モーターなどで、この遅れを減らします。'));
    },
  };
})();
