'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Quarter car: body mass ms on a spring ks and damper c above a wheel mass mu on a tyre of stiffness kt.
   *   ms zs'' = -ks (zs - zu) - c (zs' - zu'),   mu zu'' = ks (zs - zu) + c (zs' - zu') - kt (zu - zr)
   * Damping ratio zeta = c / (2 sqrt(ks ms)). Frequency response from the same equations with s = i omega.
   * Bump: half a sine wave of length LB and height h crossed at speed v.
   * Damper: oil forced through an orifice, dp = (rho / 2) (Ap v / (Cd a))^2, F = dp Ap, until a spring-loaded valve
   * blows off at Fb, beyond which the force rises gently and linearly.
   */
  const MU = 40, KT = 200000, LB = 0.5;
  const cOf = (ks, ms, z) => 2 * z * Math.sqrt(ks * ms);
  const rideHz = (ks, ms) => Math.sqrt(ks / ms) / TAU;
  const hopHz = (ks) => Math.sqrt((ks + KT) / MU) / TAU;
  function response(f, ks, ms, z) { const w = TAU * f, c = cOf(ks, ms, z), mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
    const A = [ks - ms * w * w, c * w], B = [ks + KT - MU * w * w, c * w], Cc = [ks, c * w], den = [mul(A, B)[0] - mul(Cc, Cc)[0], mul(A, B)[1] - mul(Cc, Cc)[1]], zs = div([KT * Cc[0], KT * Cc[1]], den), zu = div([KT * A[0], KT * A[1]], den);
    return { body: Math.hypot(zs[0], zs[1]), wheel: Math.hypot(zu[0], zu[1]), tyre: Math.hypot(zu[0] - 1, zu[1]) }; }
  function bumpSim(ks, ms, z, h, v, tEnd = 2.5, dt = 0.0005, t0 = 0.3) { const c = cOf(ks, ms, z), tr = []; let zs = 0, vs = 0, zu = 0, vu = 0, amax = 0, peak = 0, lift = 0, k = 0; const dur = LB / v;
    for (let t = 0; t <= tEnd; t += dt) { const zr = t > t0 && t < t0 + dur ? h * Math.sin((PI * (t - t0)) / dur) : 0, fs = -ks * (zs - zu) - c * (vs - vu), ft = -KT * (zu - zr), as = fs / ms, au = (-fs + ft) / MU; vs += as * dt; vu += au * dt; zs += vs * dt; zu += vu * dt; amax = Math.max(amax, Math.abs(as)); peak = Math.max(peak, zs); lift = Math.min(lift, zu - zr); if (k++ % 8 === 0) tr.push({ t, zr, zu, zs }); }
    let settle = 0; for (const q of tr) if (Math.abs(q.zs) > 0.05 * peak) settle = q.t; return { tr, amax, peak, settle: Math.max(0, settle - t0), lift, c, t0, dur }; }
  const RHO_OIL = 850;
  function damperForce(vel, pistonMm, orificeMm, Fb, slope = 600, rebound = 2) { const Ap = PI * (pistonMm / 2000) ** 2, a = PI * (orificeMm / 2000) ** 2, s = vel >= 0 ? 1 : rebound, av = Math.abs(vel), Fo = (RHO_OIL / 2) * ((Ap * av) / (0.7 * a)) ** 2 * Ap, lim = Fb, vb = Math.sqrt(lim / ((RHO_OIL / 2) * (Ap / (0.7 * a)) ** 2 * Ap)); const F = Fo <= lim ? Fo : lim + slope * (av - vb); return { F: s * F * Math.sign(vel || 1), vb, open: Fo > lim }; }
  const heatRise = (energy, oilKg = 0.3, steelKg = 1.5) => energy / (oilKg * 1900 + steelKg * 470);
  const M = { MU, KT, LB, cOf, rideHz, hopHz, response, bumpSim, damperForce, heatRise };
  (window.LabModels = window.LabModels || {})['car-suspension'] = M;

  /* ================= 1. comfort against grip ================= */
  D['ride-frequency'] = {
    render(ctx, v) {
      const ks = v.ks * 1000, f1 = rideHz(ks, v.ms), f2 = hopHz(ks), lx = (f) => Math.log10(f), at = response(f1, ks, v.ms, v.z), at2 = response(f2, ks, v.ms, v.z);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How much of the road's rise and fall reaches the body, against how fast the road is rising and falling. Below \(${fmt(f1, 1)}\) Hz the body simply follows the road. Near it the body bounces on its springs and moves more than the road does. Well above it the body sits still while the wheel does the moving, until the wheel's own bounce near \(${fmt(f2, 0)}\) Hz. The grey curves are a very soft and a very firm damper. Drag the gold point.`, tx`路面の上下動のうち、どれだけが車体に伝わるかを、路面の上下の速さに対して描いています。\(${fmt(f1, 1)}\) Hz より下では、車体は路面にそのまま従います。その付近では、車体がばねの上で弾み、路面より大きく動きます。それよりずっと上では、車輪だけが動いて車体は静止し、\(${fmt(f2, 0)}\) Hz 付近で車輪自身が弾みます。灰色の曲線は、非常に柔らかいダンパーと、非常に硬いダンパーの場合です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [lx(0.3), lx(30)], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('frequency (Hz)', '振動数（Hz）'), ylabel: T('body motion ÷ road motion', '車体の動き ÷ 路面の動き'), ticksX: [0.3, 1, 3, 10, 30].map((q) => [lx(q), String(q)]) });
      a.hline(1, { c: 'muted', dash: '4 4' }); [0.1, 0.8].forEach((z) => a.line(L.sample(lx(0.3), lx(30), 200, (q) => Math.min(4, response(10 ** q, ks, v.ms, z).body)), { c: 'muted', w: 1.3 })); a.line(L.sample(lx(0.3), lx(30), 240, (q) => Math.min(4, response(10 ** q, ks, v.ms, v.z).body)), { c: 'c1', w: 2.8 });
      a.handle(lx(f1), Math.min(4, at.body), { c: 'hl', axis: 'y', bounds: [lx(0.3), lx(30), 1, 4], label: T('damping', '減衰'), onDrag: (x, y) => { let b = v.z, bd = 1e9; for (let z = 0.1; z <= 1.001; z += 0.05) { const d = Math.abs(response(f1, ks, v.ms, z).body - y); if (d < bd) { bd = d; b = z; } } ctx.set('z', Math.round(b * 20) / 20); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How much the tyre is squashed and released, for the same road. This is what grip depends on: a tyre whose load keeps changing holds the road less well. A firm damper calms the wheel near \(${fmt(f2, 0)}\) Hz but loads the tyre more everywhere between the two peaks, and a soft one does the opposite. No setting is best at every frequency.`, tx`同じ路面で、タイヤがどれだけ押しつぶされ、戻されるかを描いています。グリップは、これで決まります。荷重が変わり続けるタイヤは、路面をうまくつかめません。硬いダンパーは、\(${fmt(f2, 0)}\) Hz 付近で車輪を落ち着かせますが、二つの山の間では、どこでもタイヤの荷重変動を増やします。柔らかいダンパーは、その逆です。すべての振動数で最良となる設定はありません。`));
      const b = L.fig(c2, { x: [lx(0.3), lx(30)], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('frequency (Hz)', '振動数（Hz）'), ylabel: T('tyre squash ÷ road motion', 'タイヤのつぶれ ÷ 路面の動き'), ticksX: [0.3, 1, 3, 10, 30].map((q) => [lx(q), String(q)]) });
      [0.1, 0.8].forEach((z) => b.line(L.sample(lx(0.3), lx(30), 200, (q) => Math.min(4, response(10 ** q, ks, v.ms, z).tyre)), { c: 'muted', w: 1.3 })); b.line(L.sample(lx(0.3), lx(30), 240, (q) => Math.min(4, response(10 ** q, ks, v.ms, v.z).tyre)), { c: 'c2', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('body, this damper', '車体、このダンパー') }, { c: 'c2', label: T('tyre, this damper', 'タイヤ、このダンパー') }, { c: 'muted', label: T('damping ratio 0.1 and 0.8', '減衰比 0.1 と 0.8') }]);
      ctx.readout([
        { k: T('body bounces at', '車体が弾む振動数'), v: tx`\(${fmt(f1, 2)}\ \mathrm{Hz}\)`, tone: 'key' },
        { k: T('wheel hops at', '車輪が弾む振動数'), v: tx`\(${fmt(f2, 1)}\ \mathrm{Hz}\)` },
        { k: T('damper', 'ダンパー'), v: tx`\(${fmt(cOf(ks, v.ms, v.z), 0)}\ \mathrm{N\,s/m}\)` },
        { k: T('body moves at its bounce', '弾む振動数での車体の動き'), v: tx`\(\times${fmt(at.body, 2)}\)`, tone: at.body > 2.5 ? 'warn' : 'good' },
        { k: T('tyre squash at wheel hop', '車輪が弾む振動数でのタイヤのつぶれ'), v: tx`\(\times${fmt(at2.tyre, 2)}\)`, tone: at2.tyre > 2.5 ? 'warn' : 'good' },
        { k: T('the body sags on its spring by', '車体の重さによるばねの縮み'), v: tx`\(${fmt((v.ms * 9.81) / ks * 1000, 0)}\ \mathrm{mm}\)` },
      ], T('People are most comfortable when the body bounces at 1 to 1.5 Hz, the rhythm of walking. Road cars are sprung for that and damped at a ratio of about 0.3.', '人が最も快適に感じるのは、車体が 1 Hz から 1.5 Hz、つまり歩く調子で弾むときです。乗用車は、それに合わせてばねを選び、減衰比は約 0.3 にします。'));
    },
  };

  /* ================= 2. over a bump (3D) ================= */
  function buildCorner(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // 1 unit = 100 mm; car travels toward -y, inboard is +x
    const rubber = S.mat('#1a1b1e', { rough: 0.9, coat: 0 }), alloy = S.mat('#cfd3d8', { metal: 1, rough: 0.3 }), iron = S.mat('#6b6f76', { metal: 1, rough: 0.5 }), black = S.mat('#25272b', { metal: 0.6, rough: 0.5 }), springM = S.mat('#b8432a', { metal: 0.7, rough: 0.4 }), chrome = S.mat('#e3e6ea', { metal: 1, rough: 0.12 }), body = S.mat('#3f6fb5', { metal: 0.5, rough: 0.45 }), road = S.mat('#55565a', { rough: 0.95, coat: 0 });
    const wheel = new TH.Group(); g.add(wheel);
    { const tyre = new TH.Mesh(new TH.TorusGeometry(2.3, 0.82, 18, 56).rotateY(PI / 2), rubber); tyre.scale.x = 1.25; tyre.castShadow = true; const rim = new TH.Mesh(new TH.CylinderGeometry(1.75, 1.75, 1.5, 40, 1, true).rotateZ(PI / 2), alloy); rim.material.side = 2; const spin = new TH.Group(); spin.add(tyre, rim); for (let k = 0; k < 5; k++) { const sp = new TH.Mesh(new TH.BoxGeometry(0.16, 0.5, 1.7), alloy); sp.position.set(-0.45, 0, 0.9); const pv = new TH.Group(); pv.rotation.x = (k / 5) * TAU; pv.add(sp); spin.add(pv); } wheel.add(spin); wheel.userData.spin = spin;
      const disc = new TH.Mesh(new TH.CylinderGeometry(1.45, 1.45, 0.2, 40).rotateZ(PI / 2), iron); disc.position.x = 0.5; spin.add(disc); const up = new TH.Mesh(new TH.BoxGeometry(0.5, 0.9, 2.6), iron); up.position.set(1.0, 0, 0); up.castShadow = true; wheel.add(up); const cal = new TH.Mesh(new TH.BoxGeometry(0.7, 1.0, 0.8), springM); cal.position.set(0.55, 1.25, 0.4); wheel.add(cal); }
    const chassis = new TH.Group(); g.add(chassis);
    { const rail = new TH.Mesh(new TH.BoxGeometry(2.2, 6, 1.1), body); rail.position.set(5.6, 0, 2.5); rail.castShadow = true; const wall = new TH.Mesh(new TH.BoxGeometry(0.5, 0.5, 6.4), body); wall.position.set(6.3, 2.6, 6.2); const tower = new TH.Mesh(new TH.BoxGeometry(5.6, 5.8, 0.3), body); tower.position.set(3.9, 0, 9.3); tower.castShadow = true; chassis.add(rail, wall, tower); }
    const rod = (r, mat) => { const m = new TH.Mesh(new TH.CylinderGeometry(r, r, 1, 18).rotateX(PI / 2), mat); m.castShadow = true; g.add(m); return m; };
    const armA = rod(0.14, black), armB = rod(0.14, black), dbody = rod(0.34, black), drod = rod(0.11, chrome);
    const spring = new TH.Group(); { const pts = []; for (let i = 0; i <= 140; i++) { const u = i / 140, a = u * TAU * 6; pts.push([0.62 * Math.cos(a), 0.62 * Math.sin(a), u]); } const t = S.tube(pts, { r: 0.09, add: false, radial: 8, segments: 220 }); t.material = springM; spring.add(t); g.add(spring); }
    const seat = new TH.Mesh(new TH.CylinderGeometry(0.8, 0.8, 0.08, 24).rotateX(PI / 2), black); g.add(seat);
    const zAxis = new TH.Vector3(0, 0, 1), place = (m, a, b, lenScale = true) => { const A = new TH.Vector3(...a), B = new TH.Vector3(...b), d = B.clone().sub(A), len = d.length(); m.position.copy(A.clone().add(B).multiplyScalar(lenScale === 'base' ? 0 : 0.5)); if (lenScale === 'base') m.position.copy(A); m.quaternion.setFromUnitVectors(zAxis, d.normalize()); m.scale.z = len; };
    const ground = new TH.Mesh(new TH.BoxGeometry(9, 34, 0.4), road); ground.position.set(1.5, 0, -0.2); ground.receiveShadow = true; g.add(ground);
    const sh = new TH.Shape(); sh.moveTo(-2.5, 0); for (let i = 0; i <= 24; i++) sh.lineTo(-2.5 + (5 * i) / 24, Math.sin((PI * i) / 24)); sh.lineTo(-2.5, 0);
    const bump = new TH.Mesh(new TH.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false }).rotateY(PI / 2).rotateZ(PI / 2), S.mat('#d7b63a', { rough: 0.8, coat: 0 })); bump.position.set(-3, 0, 0); g.add(bump);
    S.add(g);
    return { wheel, chassis, armA, armB, dbody, drod, spring, seat, bump, place };
  }
  D['bump-response'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const sim = bumpSim(25000, 350, v.z, v.h / 1000, v.v / 3.6); st.sim = sim; st.p = v; st.t = 0;
      L.setText(st.cap1, T(tx`One corner of a car seen from inboard, crossing a speed bump \(${fmt(v.h, 0)}\) mm high at \(${fmt(v.v, 0)}\) km/h, in slow motion. The wheel is held by a lower arm and by a strut: a damper (black, with its chrome rod) inside a coil spring (red). The spring carries the weight and lets the wheel rise without lifting the body; the damper resists motion in either direction and turns the bounce into heat.`, tx`車の一つのコーナーを内側から見た図で、高さ \(${fmt(v.h, 0)}\) mm の段差を時速 \(${fmt(v.v, 0)}\) km で越える様子を、スローモーションで示しています。車輪は、ロアアームとストラットで支えられています。ストラットは、コイルばね（赤）の中にダンパー（黒、クロムのロッド付き）が入ったものです。ばねは重さを支え、車体を持ち上げずに車輪が上がれるようにします。ダンパーはどちら向きの動きにも抵抗し、弾みを熱に変えます。`));
      L.setText(st.cap2, T(tx`Height of the road under the tyre (grey), of the wheel (red) and of the body (blue) against time. The wheel follows the bump almost exactly. The body rises later, by less, and then swings back: how many times depends on the damper. Drag the gold point to change the damping.`, tx`タイヤの下の路面（灰色）、車輪（赤）、車体（青）の高さを、時間に対して描いています。車輪は、段差にほぼそのまま従います。車体は、遅れて、より小さく上がり、その後揺れ戻します。何回揺れるかは、ダンパーで決まります。金色の点をドラッグして、減衰を変えてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 2.5], y: [-60, Math.max(120, v.h * 1.2)], aspect: 0.8, maxH: 400, xlabel: T('time (s)', '時間（秒）'), ylabel: T('height (mm)', '高さ（mm）') });
      g.line(sim.tr.map((q) => [q.t, q.zr * 1000]), { c: 'muted', w: 1.6 }); g.line(sim.tr.map((q) => [q.t, q.zu * 1000]), { c: 'c2', w: 1.8 }); g.line(sim.tr.map((q) => [q.t, q.zs * 1000]), { c: 'c1', w: 2.8 });
      { const second = sim.tr.filter((q) => q.t > sim.t0 + 0.2).reduce((m, q) => (q.zs < m.zs ? q : m), { zs: 0, t: 1 }); g.handle(second.t, second.zs * 1000, { c: 'hl', axis: 'y', bounds: [0, 2.5, -60, 0], label: T('damping', '減衰'), onDrag: (x, y) => { let b = v.z, bd = 1e9; for (let z = 0.05; z <= 1.001; z += 0.05) { const s2 = bumpSim(25000, 350, z, v.h / 1000, v.v / 3.6, 2.5, 0.002); const mn = Math.min(...s2.tr.filter((q) => q.t > 0.5).map((q) => q.zs)) * 1000, d = Math.abs(mn - y); if (d < bd) { bd = d; b = z; } } ctx.set('z', Math.round(b * 20) / 20); } }); }
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'muted', label: T('road', '路面') }, { c: 'c2', label: T('wheel', '車輪') }, { c: 'c1', label: T('body', '車体') }]);
      ctx.readout([
        { k: T('time on the bump', '段差の上にいる時間'), v: tx`\(${fmt(sim.dur * 1000, 0)}\ \mathrm{ms}\)` },
        { k: T('body rises by', '車体が上がる高さ'), v: tx`\(${fmt(sim.peak * 1000, 0)}\ \mathrm{mm}\ (${fmt((100 * sim.peak * 1000) / v.h, 0)}\ \%)\)`, tone: 'key' },
        { k: T('hardest jolt felt in the body', '車体が受ける最大の衝撃'), v: tx`\(${fmt(sim.amax / 9.81, 2)}\,g\)`, tone: sim.amax / 9.81 > 2.5 ? 'warn' : 'good' },
        { k: T('body settles after', '車体が落ち着くまで'), v: tx`\(${fmt(sim.settle, 2)}\ \mathrm{s}\)`, tone: sim.settle > 1.6 ? 'warn' : 'good' },
        { k: T('tyre unloads by (it leaves the road past 19 mm)', 'タイヤの荷重が抜ける量（19 mm を超えると路面から離れる）'), v: tx`\(${fmt(-sim.lift * 1000, 0)}\ \mathrm{mm}\)`, tone: -sim.lift > 0.019 ? 'warn' : undefined },
      ], T(v.z < 0.15 ? 'Barely damped: the body keeps nodding long after the bump, as worn dampers let it.' : v.z > 0.7 ? 'Heavily damped: the body settles at once, but the damper passes much of the first kick straight through.' : 'About right for a road car: one overshoot and it is over.', v.z < 0.15 ? '減衰がほとんどありません。へたったダンパーのように、段差の後も車体が長く揺れ続けます。' : v.z > 0.7 ? '減衰が強すぎます。車体はすぐに落ち着きますが、最初の突き上げの多くが、ダンパーを通ってそのまま伝わります。' : '乗用車としてちょうど良い程度です。一度行き過ぎて、それで収まります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.05 : 0.95, maxH: 600, camera: [21, -20, 10], target: [2.6, 0, 4.4], fov: 30,
        label: T('3D suspension corner crossing a bump. Drag to rotate.', '段差を越えるサスペンションの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.cr = buildCorner(S);
          S.label(T('spring', 'ばね'), [3.6, -1.6, 7.6], { small: true }); S.label(T('damper', 'ダンパー'), [3.3, -1.6, 5.2], { small: true }); S.label(T('lower arm', 'ロアアーム'), [3.6, -2.2, 1.5], { small: true }); S.label(T('body', '車体'), [6.6, -3.2, 9.9], { small: true });
          const draw = (dt) => { const m = st.cr, sm = st.sim, p = st.p, total = 2.5; st.t = (st.t + dt * 0.25) % total; const i = clamp(Math.round((st.t / total) * (sm.tr.length - 1)), 0, sm.tr.length - 1), q = sm.tr[i], zu = q.zu * 10, zs = q.zs * 10, vy = (p.v / 3.6) * 10;
            m.wheel.position.set(0, 0, 3.1 + zu); m.wheel.userData.spin.rotation.x = -(st.t * vy) / 3.1; m.chassis.position.z = zs; m.bump.scale.z = Math.max(0.01, p.h / 100); m.bump.position.y = (sm.t0 + sm.dur / 2 - st.t) * vy;
            const lo = [1.1, 0, 2.0 + zu], hi = [1.1, 0, 4.3 + zu], top = [2.6, 0, 9.15 + zs]; m.place(m.armA, lo, [4.6, 1.6, 2.6 + zs]); m.place(m.armB, lo, [4.6, -1.6, 2.6 + zs]);
            const dir = [top[0] - hi[0], 0, top[2] - hi[2]], len = Math.hypot(dir[0], dir[2]), un = [dir[0] / len, 0, dir[2] / len], pt = (s) => [hi[0] + un[0] * s, 0, hi[2] + un[2] * s];
            m.place(m.dbody, hi, pt(3.0)); m.place(m.drod, pt(3.0), top); m.seat.position.set(...pt(1.9)); m.seat.quaternion.copy(m.dbody.quaternion); m.place(m.spring, pt(1.9), top, 'base'); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-4, 8], y: [-0.5, 10.5], equal: true, maxH: 340, axes: false, grid: false }); f2.circle(0, 3.1, 3.1, { c: 'ink', fill: 'ink', fo: 0.7, w: 1.5 }); f2.seg(1.1, 2, 4.6, 2.6, { c: 'ink', w: 3 }); f2.seg(1.1, 4.3, 2.6, 9.15, { c: 'c2', w: 6 }); f2.rect(4.5, 1.9, 2.2, 7.5, { c: 'c1', fill: 'c1', fo: 0.4 }); f2.seg(-4, 0, 8, 0, { c: 'ink', w: 2 }); },
      });
    },
  };

  /* ================= 3. inside the damper ================= */
  D['damper-valve'] = {
    render(ctx, v) {
      const cur = damperForce(v.vel, v.piston, v.orifice, v.Fb), reb = damperForce(-v.vel, v.piston, v.orifice, v.Fb), Pw = Math.abs(cur.F * v.vel), amp = 0.02, freq = v.vel / (TAU * amp);
      let E = 0; { const n = 400; for (let i = 0; i < n; i++) { const ph = ((i + 0.5) / n) * TAU, vv = v.vel * Math.cos(ph); E += Math.abs(damperForce(vv, v.piston, v.orifice, v.Fb).F * vv) * (1 / freq / n); } }
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Force of a damper against the speed of its piston. To the right the wheel is rising and the damper is being squeezed; to the left it is being pulled out again. Oil forced through a fixed hole of \(${fmt(v.orifice, 1)}\) mm resists with a force that grows as the square of the speed (grey). A real damper adds a disc held shut by a spring: at \(${fmt(v.Fb, 0)}\) N it lifts and the curve bends over. Drag the gold point.`, tx`ダンパーの力を、ピストンの速さに対して描いています。右側は車輪が上がってダンパーが縮むとき、左側は再び伸びるときです。直径 \(${fmt(v.orifice, 1)}\) mm の決まった穴に油を押し通すと、速さの 2 乗で増える力で抵抗します（灰色）。実際のダンパーには、ばねで閉じられた円板があります。\(${fmt(v.Fb, 0)}\) N で円板が開き、曲線は折れ曲がります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [-1.5, 1.5], y: [-6, 3.5], aspect: 0.7, maxH: 350, xlabel: T('piston speed (m/s)', 'ピストンの速さ（m/s）'), ylabel: T('damper force (kN)', 'ダンパーの力（kN）') });
      a.hline(0, { c: 'muted' }); a.vline(0, { c: 'muted' }); a.line(L.sample(-1.5, 1.5, 200, (q) => clamp(damperForce(q, v.piston, v.orifice, 1e9).F / 1000, -6, 3.5)), { c: 'muted', w: 1.3 }); a.line(L.sample(-1.5, 1.5, 300, (q) => clamp(damperForce(q, v.piston, v.orifice, v.Fb).F / 1000, -6, 3.5)), { c: 'c1', w: 2.8 });
      a.handle(v.vel, clamp(cur.F / 1000, -6, 3.5), { c: 'hl', axis: 'x', bounds: [0.05, 1.5, -6, 3.5], label: T('piston speed', 'ピストンの速さ'), onDrag: (x) => ctx.set('vel', clamp(Math.round(x * 20) / 20, 0.05, 1.5)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Power the damper turns into heat against piston speed, with the valve (blue) and with the fixed hole alone (grey). All the energy a suspension takes out of a bounce ends up warming a third of a litre of oil, which is why dampers on rough roads run hot and why hot, thin oil damps less.`, tx`ダンパーが熱に変える仕事率を、ピストンの速さに対して描いています。青は弁がある場合、灰色は決まった穴だけの場合です。サスペンションが弾みから取り去るエネルギーはすべて、3 分の 1 リットルの油を温めることになります。荒れた道でダンパーが熱くなるのも、熱くなって薄まった油で減衰が弱まるのも、このためです。`));
      const b = L.fig(c2, { x: [0, 1.5], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('piston speed (m/s)', 'ピストンの速さ（m/s）'), ylabel: T('power turned to heat (kW)', '熱に変わる仕事率（kW）') });
      b.line(L.sample(0, 1.5, 150, (q) => Math.min(4, (damperForce(q, v.piston, v.orifice, 1e9).F * q) / 1000)), { c: 'muted', w: 1.3 }); b.line(L.sample(0, 1.5, 150, (q) => Math.min(4, (damperForce(q, v.piston, v.orifice, v.Fb).F * q) / 1000)), { c: 'c1', w: 2.8 }); b.dot(v.vel, Math.min(4, Pw / 1000), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('with the blow-off valve', '逃がし弁がある場合') }, { c: 'muted', label: T('fixed hole alone', '決まった穴だけの場合') }]);
      ctx.readout([
        { k: T('force squeezing in', '縮むときの力'), v: tx`\(${fmt(cur.F, 0)}\ \mathrm{N}\)`, tone: 'key' },
        { k: T('force pulling out at the same speed', '同じ速さで伸びるときの力'), v: tx`\(${fmt(-reb.F, 0)}\ \mathrm{N}\)` },
        { k: T('valve lifts above', '弁が開く速さ'), v: tx`\(${fmt(cur.vb, 2)}\ \mathrm{m/s}\)`, tone: cur.open ? 'good' : undefined },
        { k: T('heat made at this speed', 'この速さで生じる熱'), v: tx`\(${fmt(Pw, 0)}\ \mathrm{W}\)` },
        { k: T('energy per bounce of ±20 mm', '±20 mm の 1 回の弾みあたりのエネルギー'), v: tx`\(${fmt(E, 0)}\ \mathrm{J}\)` },
        { k: T('100 such bounces warm the damper by', 'その弾み 100 回でダンパーが温まる量'), v: tx`\(${fmt(heatRise(100 * E), 1)}\ \mathrm{K}\)` },
      ], T('The pull-out force is set about twice the push-in force: a wheel should be free to rise over a bump but be held back from dropping into the hole after it.', '伸びるときの力は、縮むときの約 2 倍に設定されています。車輪は、段差を越えるときには自由に上がり、その後の穴に落ち込むときには引き止められるべきだからです。'));
    },
  };
})();
