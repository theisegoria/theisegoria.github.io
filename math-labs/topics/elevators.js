'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180;

  /* ---------------- models (no DOM) ----------------
   * Car of mass MC with rated load Q; counterweight MC + k Q. Out-of-balance force (L - k Q) g.
   * Motor power going up at speed v: F v / eta when the motor drives, F v eta when the load drives the motor.
   * Traction (Euler-Eytelwein): ropes do not slip while T1 / T2 <= exp(f alpha), with f = mu / sin(gamma / 2)
   * for a V groove of angle gamma and alpha the angle of wrap.
   * Safety gear: ropes part with the car descending at rated speed; it falls freely until the governor trips at
   * trip x rated speed, then wedges grip the rails and slow it at a fixed deceleration.
   */
  const MC = 1200, Q = 1000, ETA = 0.85;
  const cwMass = (k) => MC + k * Q;
  const unbalance = (load, k) => (load - k * Q) * G;                                                 // N, positive = car side heavier
  const motorPower = (load, k, v, up = true) => { const F = (up ? 1 : -1) * unbalance(load, k); return F >= 0 ? (F * v) / ETA : F * v * ETA; };
  const drumPower = (load, v) => ((MC + load) * G * v) / ETA;
  const tripEnergy = (load, k, h) => { const F = unbalance(load, k); return F >= 0 ? (F * h) / ETA : F * h * ETA; };   // J for one trip up
  const grooveF = (mu, gammaDeg) => mu / Math.sin(rad(gammaDeg) / 2);
  const tractionLimit = (mu, gammaDeg, wrapDeg) => Math.exp(grooveF(mu, gammaDeg) * rad(wrapDeg));
  function tensionRatio(load, k, acc = 0) { const car = MC + load, cw = cwMass(k); return car >= cw ? (car * (G + acc)) / (cw * (G - acc)) : (cw * (G + acc)) / (car * (G - acc)); }
  function fall(vr, trip, decelG, m = MC + Q, mu = 0.3) { const vt = trip * vr, t1 = (vt - vr) / G, d1 = (vt * vt - vr * vr) / (2 * G), a = decelG * G, t2 = vt / a, d2 = (vt * vt) / (2 * a), N = (m * (G + a)) / (4 * mu); const tr = []; for (let i = 0; i <= 40; i++) { const t = (t1 * i) / 40; tr.push([t, vr + G * t]); } for (let i = 1; i <= 40; i++) { const t = (t2 * i) / 40; tr.push([t1 + t, vt - a * t]); } return { vt, t1, d1, t2, d2, total: d1 + d2, N, tr }; }
  const wedgeLocks = (wedgeDeg, mu) => Math.tan(rad(wedgeDeg)) < mu;
  const freeFallSpeed = (h) => Math.sqrt(2 * G * h);
  const M = { MC, Q, ETA, cwMass, unbalance, motorPower, drumPower, tripEnergy, grooveF, tractionLimit, tensionRatio, fall, wedgeLocks, freeFallSpeed, G };
  (window.LabModels = window.LabModels || {}).elevators = M;

  /* ================= 1. car and counterweight (3D) ================= */
  const FLOORS = [0, 3.2, 6.4, 9.6];
  function buildShaft(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // 1 unit = 1 m
    const steel = S.mat('#c9cdd3', { metal: 1, rough: 0.3 }), dark = S.mat('#3a3d42', { metal: 0.8, rough: 0.5 }), wallM = S.mat('#dfe6ee', { rough: 0.2, coat: 0.8, opacity: 0.25, side: 2 }), conc = S.mat('#a8a49b', { rough: 0.95, coat: 0 }), red = S.mat('#b8432a', { metal: 0.5, rough: 0.45 }), green = S.mat('#3a8a5c', { metal: 0.6, rough: 0.45 }), cloth = [S.mat('#3f6fb5', { rough: 0.9, coat: 0 }), S.mat('#b8432a', { rough: 0.9, coat: 0 }), S.mat('#7a6a55', { rough: 0.9, coat: 0 })];
    const box = (w, d, h, x, y, z, mat, parent = g) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    box(3.4, 2.6, 0.2, 0.2, 0, -1.3, conc); box(3.4, 0.15, 15.2, 0.2, 1.3, 6.3, conc).castShadow = false; box(0.15, 2.6, 15.2, 1.9, 0, 6.3, conc).castShadow = false; box(3.4, 2.6, 0.2, 0.2, 0, 12.6, S.mat('#a8a49b', { rough: 0.95, coat: 0, opacity: 0.5 }));
    FLOORS.forEach((z) => box(2.4, 2.6, 0.18, -2.6, 0, z - 0.09, conc));
    for (const y of [-0.82, 0.82]) box(0.07, 0.1, 13.8, -0.35 + 0, y, 5.7, steel).position.x = -0.35; for (const y of [-0.55, 0.55]) box(0.06, 0.06, 13.8, 0.95, y, 5.7, steel);
    // machine: sheave, motor, brake, on a bedplate
    box(2.6, 1.4, 0.12, 0.3, 0, 12.76, dark); const sheave = new TH.Mesh(new TH.CylinderGeometry(0.65, 0.65, 0.22, 48), steel); sheave.position.set(0.3, 0, 13.55); sheave.castShadow = true; g.add(sheave); for (let k = 0; k < 6; k++) { const sp = box(0.06, 0.24, 1.2, 0, 0, 0, dark, sheave); sp.rotation.y = (k / 6) * PI; }
    { const mo = new TH.Mesh(new TH.CylinderGeometry(0.38, 0.38, 0.8, 32), green); mo.position.set(0.3, 0.62, 13.55); g.add(mo); const br = new TH.Mesh(new TH.CylinderGeometry(0.3, 0.3, 0.16, 32), red); br.position.set(0.3, -0.25, 13.55); g.add(br); for (const sx of [-0.45, 1.05]) box(0.12, 1.2, 0.75, sx, 0.1, 13.2, dark); }
    // car: floor, roof, see-through walls, sling, safety blocks, passengers
    const car = new TH.Group(); g.add(car);
    box(1.6, 1.5, 0.1, -0.35, 0, 0.05, steel, car); box(1.6, 1.5, 0.08, -0.35, 0, 2.3, steel, car); box(0.03, 1.5, 2.2, 0.45, 0, 1.2, wallM, car).castShadow = false; box(1.6, 0.03, 2.2, -0.35, 0.75, 1.2, wallM, car).castShadow = false; box(1.6, 0.03, 2.2, -0.35, -0.75, 1.2, wallM, car).castShadow = false;
    for (const y of [-0.8, 0.8]) { box(0.08, 0.06, 2.9, -0.35, y, 1.25, dark, car); box(0.16, 0.14, 0.22, -0.35, y, -0.12, red, car); } box(0.1, 1.7, 0.1, -0.35, 0, 2.72, dark, car);
    const people = []; for (let i = 0; i < 13; i++) { const p = new TH.Group(), b = new TH.Mesh(new TH.CapsuleGeometry(0.14, 0.75, 4, 10).rotateX(PI / 2), cloth[i % 3]), h = new TH.Mesh(new TH.SphereGeometry(0.11, 12, 10), S.mat('#d9b48f', { rough: 0.8 })); b.position.z = 0.62; h.position.z = 1.3; p.add(b, h); p.position.set(-0.95 + 0.38 * (i % 4), -0.5 + 0.34 * Math.floor(i / 4), 0.1); car.add(p); people.push(p); }
    // counterweight: frame filled with slabs
    const cw = new TH.Group(); g.add(cw); box(0.3, 1.0, 0.08, 0.95, 0, 0, dark, cw); box(0.3, 1.0, 0.08, 0.95, 0, 2.4, dark, cw); const slabs = []; for (let i = 0; i < 16; i++) slabs.push(box(0.26, 0.92, 0.125, 0.95, 0, 0.11 + 0.135 * i, S.mat('#5a5d63', { metal: 0.7, rough: 0.6 }), cw));
    const ropes = S.lines([], { c: 'ink', opacity: 0.9, w: 2 }), gov = S.lines([], { c: 'c2', opacity: 0.9, w: 1.4 });
    { const gs = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.06, 24), red); gs.position.set(-1.3, -0.95, 12.3); g.add(gs); const tw = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.06, 24), dark); tw.position.set(-1.3, -0.95, -0.9); g.add(tw); }
    S.add(g);
    return { car, cw, sheave, ropes, gov, people, slabs };
  }
  D['elevator-shaft'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const load = v.n * 75, k = v.k / 100, F = unbalance(load, k), Pu = motorPower(load, k, v.v, true), Pd = motorPower(load, k, v.v, false); st.p = { n: v.n, k };
      L.setText(st.cap1, T(tx`A traction lift with one wall of its shaft removed. The car (left) and a counterweight of iron slabs (right) hang from opposite ends of the same steel ropes, which pass over a grooved wheel driven by the motor at the top. Nothing winds up: the wheel only shifts rope from one side to the other, and the motor lifts only the difference between the two weights. The thin red loop is the governor rope, which trips the safety gear under the car if it ever moves too fast.`, tx`昇降路の壁を一面取り除いた、トラクション式のエレベーターです。かご（左）と、鉄の板を重ねたつり合いおもり（右）が、同じ鋼のロープの両端につり下げられています。ロープは、最上部でモーターが回す溝付きの車にかかっています。何も巻き取りません。車は、ロープを一方からもう一方へ送るだけで、モーターが持ち上げるのは、二つの重さの差だけです。細い赤い輪は調速機のロープで、かごが速く動きすぎると、かごの下の非常止め装置を作動させます。`));
      L.setText(st.cap2, T(tx`Power the motor needs to raise the car at \(${fmt(v.v, 1)}\) m/s against the load in it. With a counterweight equal to the car plus \(${fmt(v.k, 0)}\) per cent of its rated load (blue), the motor works hardest with the car full, does nothing at the balance point, and below it is driven by the falling counterweight and gives power back. The grey line is the same car wound up on a drum with no counterweight. Drag the gold point.`, tx`かごを \(${fmt(v.v, 1)}\) m/s で上げるのにモーターが必要とする仕事率を、かごの中の荷重に対して描いています。つり合いおもりが、かごの重さに定格荷重の \(${fmt(v.k, 0)}\) % を加えたものであるとき（青）、モーターは満員のときに最も働き、つり合う点では何もせず、それより下では、下がるつり合いおもりに回されて電力を戻します。灰色の線は、つり合いおもりなしでドラムに巻き上げる場合です。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 1000], y: [-12, 45], aspect: 0.8, maxH: 400, xlabel: T('load in the car (kg)', 'かごの中の荷重（kg）'), ylabel: T('motor power going up (kW)', '上昇時のモーターの仕事率（kW）') });
      g.hline(0, { c: 'muted' }); g.line(L.sample(0, 1000, 40, (q) => drumPower(q, v.v) / 1000), { c: 'muted', w: 1.4 }); g.line(L.sample(0, 1000, 100, (q) => motorPower(q, k, v.v) / 1000), { c: 'c1', w: 2.8 }); g.vline(k * Q, { c: 'c3', dash: '4 3' });
      g.handle(load, Pu / 1000, { c: 'hl', axis: 'x', bounds: [0, 975, -12, 45], label: T('passengers', '乗客'), onDrag: (x) => ctx.set('n', clamp(Math.round(x / 75), 0, 13)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('with the counterweight', 'つり合いおもりがある場合') }, { c: 'muted', label: T('wound on a drum', 'ドラムに巻き上げる場合') }, { c: 'c3', dash: true, label: T('balance point', 'つり合う点') }]);
      ctx.readout([
        { k: T('car and passengers', 'かごと乗客'), v: tx`\(${fmt(MC + load, 0)}\ \mathrm{kg}\)` },
        { k: T('counterweight', 'つり合いおもり'), v: tx`\(${fmt(cwMass(k), 0)}\ \mathrm{kg}\)` },
        { k: T('out of balance', 'つり合いの差'), v: tx`\(${fmt(Math.abs(F) / G, 0)}\ \mathrm{kg}\ \text{${T(F >= 0 ? 'on the car side' : 'on the counterweight side', F >= 0 ? 'かご側が重い' : 'おもり側が重い')}}\)`, tone: 'key' },
        { k: T('motor power: going up, going down', 'モーターの仕事率：上昇、下降'), v: tx`\(${fmt(Pu / 1000, 1)},\ ${fmt(Pd / 1000, 1)}\ \mathrm{kW}\)` },
        { k: T('the same on a drum', 'ドラム式での同じ値'), v: tx`\(${fmt(drumPower(load, v.v) / 1000, 1)}\ \mathrm{kW}\)` },
        { k: T('energy to climb 9.6 m', '9.6 m 上がるエネルギー'), v: tx`\(${fmt(tripEnergy(load, k, 9.6) / 3600, 1)}\ \mathrm{Wh}\)`, tone: 'good' },
      ], T('Lifts spend most of their lives nearly empty or half full, so the counterweight is set to balance a car a little under half loaded. The fullest and the emptiest trips then ask the same of the motor.', 'エレベーターは、ほとんどの時間を、空に近いか半分程度の荷重で動いています。そのため、つり合いおもりは、定格の半分より少し少ない荷重のかごとつり合うように決められます。こうすると、満員のときと空のときで、モーターにかかる負担が同じになります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.5 : 1.35, maxH: 760, camera: [-14.5, -31, 13.5], target: [-0.3, 0, 6.7], fov: 30,
        label: T('3D lift shaft with car, counterweight and machine. Drag to rotate.', 'かご、つり合いおもり、巻上機が見えるエレベーターの昇降路の 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.sh = buildShaft(S); st.t = 0; st.from = 0; st.to = 3; st.z = 0;
          S.label(T('motor and sheave', 'モーターと綱車'), [0.3, -1.4, 14.5], { small: true }); S.label(T('counterweight', 'つり合いおもり'), [3.4, -1.4, 6], { small: true }); S.label(T('car', 'かご'), [-2.2, -1.5, 2.9], { small: true }); S.label(T('governor rope', '調速機ロープ'), [-3.0, -1.4, 11.2], { small: true });
          const draw = (dt) => { const m = st.sh, q = st.p; st.t += dt; const dur = 1.6 + 1.3 * Math.abs(FLOORS[st.to] - FLOORS[st.from]) / 3.2, u = clamp(st.t / dur, 0, 1), e = u * u * (3 - 2 * u); st.z = FLOORS[st.from] + (FLOORS[st.to] - FLOORS[st.from]) * e; if (st.t > dur + 1.4) { st.from = st.to; st.to = [3, 1, 2, 0, 2, 0, 3][Math.floor(Math.random() * 7)]; if (st.to === st.from) st.to = (st.from + 2) % 4; st.t = 0; }
            m.car.position.z = st.z; const zc = 9.6 - st.z + 0.2; m.cw.position.z = zc; m.sheave.rotation.y = -st.z / 0.65; m.people.forEach((p, i) => { p.visible = i < q.n; }); const ns = Math.round(8 + 16 * q.k); m.slabs.forEach((s, i) => { s.visible = i < ns; });
            const rs = []; for (const dy of [-0.06, 0, 0.06]) { rs.push([[-0.35, dy, st.z + 2.77], [-0.35, dy, 13.55]]); rs.push([[0.95, dy, 13.55], [0.95, dy, zc + 2.44]]); for (let a = 0; a < 12; a++) { const a0 = PI - (a / 12) * PI, a1 = PI - ((a + 1) / 12) * PI; rs.push([[0.3 + 0.65 * Math.cos(a0), dy, 13.55 + 0.65 * Math.sin(a0)], [0.3 + 0.65 * Math.cos(a1), dy, 13.55 + 0.65 * Math.sin(a1)]]); } } m.ropes.update(rs);
            m.gov.update([[[-1.5, -0.95, -0.9], [-1.5, -0.95, 12.3]], [[-1.1, -0.95, -0.9], [-1.1, -0.95, 12.3]], [[-1.1, -0.95, st.z - 0.1], [-0.4, -0.82, st.z - 0.1]]]); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-3, 3], y: [-1.5, 14.5], equal: true, maxH: 460, axes: false, grid: false }); f2.rect(-1.5, -1.2, 3.4, 14.4, { c: 'ink', fill: 'none', w: 1.4 }); f2.rect(-1.15, 3.2, 1.6, 2.3, { c: 'c1', fill: 'c1', fo: 0.3 }); f2.rect(1.2, 6.6, 0.3, 2.4, { c: 'ink', fill: 'ink', fo: 0.7 }); f2.circle(0.3, 13.55, 0.65, { c: 'ink', fill: 'grid', fo: 0.6, w: 1.6 }); f2.line([[-0.35, 5.5], [-0.35, 13.55]], { c: 'ink', w: 1.6 }); f2.line([[0.95, 13.55], [1.35, 9]], { c: 'ink', w: 1.6 }); },
      });
    },
  };

  /* ================= 2. why the ropes do not slip ================= */
  D['rope-traction'] = {
    render(ctx, v) {
      const load = v.load, k = 0.45, lim = tractionLimit(v.mu, v.gamma, v.wrap), act = tensionRatio(load, k, v.acc), full = tensionRatio(1.25 * Q, k, v.acc), empty = tensionRatio(0, k, v.acc), worst = Math.max(full, empty);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The largest ratio between the pull on the two sides of the wheel that friction can hold, against the angle of rope in contact with it. Friction on a wrapped rope multiplies round the wheel, so the limit grows exponentially with the angle. The blue curve is for a V groove of \(${fmt(v.gamma, 0)}\)°, which wedges the rope and raises the effective friction to \(${fmt(grooveF(v.mu, v.gamma), 2)}\); the grey curve is a plain round groove. Drag the gold point.`, tx`車の両側の引く力の比のうち、摩擦で支えられる最大の比を、ロープが車に接している角度に対して描いています。巻き付いたロープの摩擦は、車に沿って掛け算で増えるので、限界は角度とともに指数関数的に大きくなります。青い曲線は \(${fmt(v.gamma, 0)}\)° の V 溝の場合で、溝がロープを挟み込んで、実効的な摩擦係数を \(${fmt(grooveF(v.mu, v.gamma), 2)}\) に上げます。灰色の曲線は、単純な丸溝の場合です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [90, 270], y: [1, 4], aspect: 0.7, maxH: 350, xlabel: T('angle of wrap (degrees)', '巻き付き角（度）'), ylabel: T('ratio of pulls that holds', '支えられる引く力の比') });
      a.hline(worst, { c: 'c2', dash: '5 4' }); a.line(L.sample(90, 270, 60, (q) => Math.min(4, Math.exp(v.mu * rad(q)))), { c: 'muted', w: 1.4 }); a.line(L.sample(90, 270, 60, (q) => Math.min(4, tractionLimit(v.mu, v.gamma, q))), { c: 'c1', w: 2.8 });
      a.handle(v.wrap, Math.min(4, lim), { c: 'hl', axis: 'x', bounds: [90, 270, 1, 4], label: T('angle of wrap', '巻き付き角'), onDrag: (x) => ctx.set('wrap', clamp(Math.round(x / 5) * 5, 90, 270)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The ratio the ropes actually have to hold against the load in the car, while it accelerates at \(${fmt(v.acc, 1)}\) m/s². It is worst at the two ends: an empty car, where the counterweight is much the heavier, and an overloaded one. The ropes grip as long as the red curve stays under the dashed limit.`, tx`かごが \(${fmt(v.acc, 1)}\) m/s² で加速しているときに、ロープが実際に支えなければならない比を、かごの中の荷重に対して描いています。最も厳しいのは両端です。つり合いおもりのほうがずっと重くなる空のかごと、荷重を超えたかごです。赤い曲線が破線の限界より下にある限り、ロープは滑りません。`));
      const b = L.fig(c2, { x: [0, 1250], y: [1, 4], aspect: 0.7, maxH: 350, xlabel: T('load in the car (kg)', 'かごの中の荷重（kg）'), ylabel: T('ratio of pulls needed', '必要な引く力の比') });
      b.hline(Math.min(4, lim), { c: 'c1', dash: '5 4' }); b.line(L.sample(0, 1250, 126, (q) => Math.min(4, tensionRatio(q, k, v.acc))), { c: 'c2', w: 2.8 }); b.dot(load, Math.min(4, act), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('limit of grip, V groove', 'グリップの限界、V 溝') }, { c: 'muted', label: T('round groove', '丸溝') }, { c: 'c2', label: T('ratio needed; worst case', '必要な比、最も厳しい場合') }]);
      ctx.readout([
        { k: T('friction as the rope feels it', 'ロープが感じる摩擦係数'), v: tx`\(${fmt(grooveF(v.mu, v.gamma), 2)}\)` },
        { k: T('largest ratio the wheel can hold', '車が支えられる最大の比'), v: tx`\(${fmt(lim, 2)}\)`, tone: 'key' },
        { k: T('needed at this load', 'この荷重で必要な比'), v: tx`\(${fmt(act, 2)}\)` },
        { k: T('needed empty, and at 125 % load', '空のとき、125 % 荷重のときに必要な比'), v: tx`\(${fmt(empty, 2)},\ ${fmt(full, 2)}\)` },
        { k: T('margin in the worst case', '最も厳しい場合の余裕'), v: tx`\(\times${fmt(lim / worst, 2)}\)`, tone: lim > worst ? 'good' : 'warn' },
      ], T(lim > worst ? 'The ropes hold in every case. The same limit is also a safety feature: if the counterweight lands on its buffer the ropes go slack on that side and the wheel can no longer lift the car into the roof.' : 'The ropes would slip. More wrap, a sharper groove or a lighter car against its counterweight is needed.', lim > worst ? 'どの場合でも、ロープは滑りません。この限界は、安全のための仕組みでもあります。つり合いおもりが緩衝器に着くと、その側のロープがたるみ、車はもう、かごを天井まで持ち上げることができません。' : 'ロープが滑ります。巻き付き角を増やすか、溝を鋭くするか、つり合いおもりに対してかごを軽くする必要があります。'));
    },
  };

  /* ================= 3. the safety gear ================= */
  D['safety-gear'] = {
    render(ctx, v) {
      const f = fall(v.vr, v.trip, v.dg), locks = wedgeLocks(v.wedge, v.mu), tmax = (f.t1 + f.t2) * 1.15;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Speed of a full car after every rope has parted while it was descending at \(${fmt(v.vr, 1)}\) m/s. It falls freely (red) until a governor, a small wheel turned by its own rope, senses \(${fmt(v.trip * 100, 0)}\) per cent of rated speed and locks. The car, still moving, pulls on the stopped rope, which lifts wedges under the car into the gap beside each guide rail. They jam, and friction on the rails brings the car to rest (blue). Drag the gold point.`, tx`毎秒 \(${fmt(v.vr, 1)}\) m で下降中に、すべてのロープが切れた後の、満員のかごの速さです。かごは自由落下し（赤）、専用のロープで回される小さな車である調速機が、定格速度の \(${fmt(v.trip * 100, 0)}\) % を検出して固定されるまで続きます。まだ動いているかごが、止まったロープを引き、それがかごの下のくさびを、ガイドレールの脇のすき間に引き上げます。くさびは食い込み、レールとの摩擦がかごを止めます（青）。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, tmax], y: [0, f.vt * 1.25], aspect: 0.7, maxH: 350, xlabel: T('time since the ropes parted (s)', 'ロープが切れてからの時間（秒）'), ylabel: T('downward speed (m/s)', '下向きの速さ（m/s）') });
      a.hline(v.vr, { c: 'muted', dash: '4 4' }); a.line(f.tr.slice(0, 41), { c: 'c2', w: 2.8 }); a.line(f.tr.slice(40), { c: 'c1', w: 2.8 }); a.line([[f.t1, f.vt], [tmax, f.vt + G * (tmax - f.t1)]].map((q) => [q[0], Math.min(f.vt * 1.25, q[1])]), { c: 'muted', w: 1.2 });
      a.handle(f.t1 + f.t2 / 2, f.vt / 2, { c: 'hl', axis: 'x', bounds: [f.t1, tmax, 0, f.vt * 1.25], label: T('how hard the wedges grip', 'くさびの効きの強さ'), onDrag: (x) => { const t2 = Math.max(0.02, 2 * (x - f.t1)); ctx.set('dg', clamp(Math.round((f.vt / t2 / G) * 20) / 20, 0.2, 2.5)); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Whether a wedge pulls itself in. Once it touches the rail, friction with the rail drags it further up its sloping seat, squeezing it harder. That happens only if the slope is gentler than the friction: a wedge angle below the curve grips harder the more the car pulls, and one above it is squeezed out. Each wedge then presses on the rail with the force shown.`, tx`くさびが自分で食い込むかどうかを示します。くさびがレールに触れると、レールとの摩擦が、くさびを傾いた座に沿ってさらに引き上げ、より強く締め付けます。これは、傾きが摩擦より緩やかなときだけ起こります。曲線より下のくさびの角度では、かごが引くほど強く食い込み、上では押し出されます。そのとき、それぞれのくさびは、図に示した力でレールを押します。`));
      const b = L.fig(c2, { x: [0.1, 0.6], y: [0, 35], aspect: 0.7, maxH: 350, xlabel: T('friction between wedge and rail', 'くさびとレールの間の摩擦係数'), ylabel: T('wedge angle (degrees)', 'くさびの角度（度）') });
      b.area(L.sample(0.1, 0.6, 50, (q) => (Math.atan(q) * 180) / PI), { c: 'c3', fo: 0.14, base: 0 }); b.line(L.sample(0.1, 0.6, 50, (q) => (Math.atan(q) * 180) / PI), { c: 'c3', w: 2.6 }); b.text(0.5, 6, T('self-locking', '自分で食い込む'), { small: true, anchor: 'middle' }); b.text(0.22, 30, T('slips out', '押し出される'), { small: true, anchor: 'middle' }); b.dot(v.mu, v.wedge, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c2', label: T('free fall', '自由落下') }, { c: 'c1', label: T('gripping the rails', 'レールをつかんでいる') }, { c: 'muted', label: T('rated speed; with no safety gear', '定格速度、非常止め装置がない場合') }, { c: 'c3', label: T('steepest wedge that locks', '食い込む最も急なくさび') }]);
      ctx.readout([
        { k: T('governor trips at', '調速機が作動する速さ'), v: tx`\(${fmt(f.vt, 2)}\ \mathrm{m/s}\)` },
        { k: T('fall before it trips', '作動するまでの落下'), v: tx`\(${fmt(f.d1 * 100, 0)}\ \mathrm{cm},\ ${fmt(f.t1 * 1000, 0)}\ \mathrm{ms}\)`, tone: 'key' },
        { k: T('slide on the rails', 'レール上を滑る距離'), v: tx`\(${fmt(f.d2 * 100, 0)}\ \mathrm{cm}\ \text{${T('at', '、減速')}}\ ${fmt(v.dg, 2)}\,g\)`, tone: v.dg > 1 ? 'warn' : 'good' },
        { k: T('total, from break to rest', '切れてから止まるまでの合計'), v: tx`\(${fmt(f.total * 100, 0)}\ \mathrm{cm}\)` },
        { k: T('each of 4 wedge faces presses with', '4 つのくさびの面それぞれが押す力'), v: tx`\(${fmt(fall(v.vr, v.trip, v.dg, MC + Q, v.mu).N / 1000, 1)}\ \mathrm{kN}\)` },
        { k: T('this wedge', 'このくさび'), v: T(locks ? 'locks itself' : 'is pushed back out', locks ? '自分で食い込む' : '押し出される'), tone: locks ? 'good' : 'warn' },
      ], T('The safety gear needs no power and no signal: gravity trips it and the car’s own motion applies it. Passengers standing in the car feel their weight rise by the deceleration shown, which standards keep under about one \(g\).', '非常止め装置には、電力も信号も要りません。重力が作動させ、かご自身の動きが効かせます。かごの中に立っている乗客は、図に示した減速の分だけ体重が増えたように感じます。規格は、これを約 1 \(g\) 以下に抑えています。'));
    },
  };
})();
