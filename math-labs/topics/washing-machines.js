'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Tumbling: a garment on the wall of a drum of radius r turning at omega stays on while omega^2 r > g sin(alpha),
   * alpha being its angle above the horizontal on the rising side. It leaves at sin(alpha) = omega^2 r / g and flies
   * as a projectile until it meets the wall again. At omega^2 r >= g it never leaves.
   * Spin: g-factor = omega^2 r / g. Moisture left after spinning is an empirical fit to energy-label spin classes,
   * RMC = 0.38 + 0.55 exp(-G / 300) (kg of water per kg of dry cotton).
   * Balance: tub of mass M on springs k with damping ratio zeta, unbalanced mass m at radius e.
   * X = (m e / M) r^2 / sqrt((1 - r^2)^2 + (2 zeta r)^2), r = omega / omega_n.
   */
  const KS = 14800;
  const omega = (rpm) => (rpm * TAU) / 60;
  const critRpm = (r) => (60 / TAU) * Math.sqrt(G / r);
  const gFactor = (rpm, r) => (omega(rpm) ** 2 * r) / G;
  function tumble(rpm, r) { const w = omega(rpm), s = (w * w * r) / G; if (s >= 1) return { pinned: true, s }; const al = Math.asin(s), x0 = r * Math.cos(al), z0 = r * Math.sin(al), vx = -w * r * Math.sin(al), vz = w * r * Math.cos(al);
    const pos = (t) => [x0 + vx * t, z0 + vz * t - 0.5 * G * t * t]; let t = 1e-4, dt = 1e-4; while (t < 3) { const p = pos(t + dt); if (p[0] * p[0] + p[1] * p[1] >= r * r) break; t += dt; } const tl = t + dt, pl = pos(tl), vl = [vx, vz - G * tl], top = z0 + (vz * vz) / (2 * G);
    return { pinned: false, s, al, x0, z0, tl, land: pl, drop: top - pl[1], vImp: Math.hypot(vl[0], vl[1]), top, pos }; }
  const rmc = (g) => 0.38 + 0.55 * Math.exp(-g / 300);
  const fn = (M) => Math.sqrt(KS / M) / TAU;                                                         // Hz
  function shake(rpm, m, M, zeta, e = 0.24) { const wn = Math.sqrt(KS / M), w = omega(rpm), r = w / wn, den = Math.sqrt((1 - r * r) ** 2 + (2 * zeta * r) ** 2), X = ((m * e) / M) * (r * r) / den, phase = Math.atan2(2 * zeta * r, 1 - r * r), F0 = m * e * w * w, FT = X * KS * Math.sqrt(1 + (2 * zeta * r) ** 2); return { r, X, phase, F0, FT, lim: (m * e) / M }; }
  const M = { KS, omega, critRpm, gFactor, tumble, rmc, fn, shake, G };
  (window.LabModels = window.LabModels || {})['washing-machines'] = M;

  /* ================= 1. tumbling ================= */
  D['drum-tumble'] = {
    render(ctx, v) {
      const r = v.dia / 200, tb = tumble(v.rpm, r), rc = critRpm(r);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A drum \(${fmt(v.dia, 0)}\) cm across seen from the front, turning anticlockwise at \(${fmt(v.rpm, 0)}\) rpm. A garment rides up the wall (blue) until the wall can no longer hold it in a circle, then flies free (red) and lands in the water. The washing is done by that fall, over and over.`, tx`直径 \(${fmt(v.dia, 0)}\) cm のドラムを正面から見た図で、毎分 \(${fmt(v.rpm, 0)}\) 回転で反時計回りに回っています。洗濯物は、壁に沿って上がり（青）、壁が円運動を保てなくなったところで離れて飛び（赤）、水の中に落ちます。洗浄は、この落下の繰り返しで行われます。`));
      const R = r * 100, a = L.fig(c1, { x: [-R * 1.25, R * 1.25], y: [-R * 1.25, R * 1.25], equal: true, aspect: 0.9, maxH: 380, axes: false, grid: false });
      a.circle(0, 0, R, { c: 'ink', fill: 'grid', fo: 0.25, w: 2.2 }); a.poly(L.sample(-0.62, 0.62, 30, (u) => 0).map((_, i) => { const u = -0.62 + (1.24 * i) / 29; return [R * 0.985 * Math.sin(u), -R * 0.985 * Math.cos(u)]; }).concat([[R * 0.985 * Math.sin(0.62), -R * 0.985 * Math.cos(0.62)]]), { c: 'c1', fill: 'c1', fo: 0.18, w: 0 });
      for (let k = 0; k < 3; k++) { const an = (k / 3) * TAU + 0.5; a.seg(R * Math.cos(an), R * Math.sin(an), 0.84 * R * Math.cos(an), 0.84 * R * Math.sin(an), { c: 'ink', w: 4 }); }
      if (tb.pinned) { a.circle(0, 0, R * 0.93, { c: 'c1', fill: 'none', w: 5 }); }
      else { a.line(L.sample(-PI / 2, tb.al, 60, (u) => 0).map((_, i) => { const u = -PI / 2 + ((tb.al + PI / 2) * i) / 59; return [R * 0.95 * Math.cos(u), R * 0.95 * Math.sin(u)]; }), { c: 'c1', w: 3 }); a.line(L.sample(0, tb.tl, 60, (t) => 0).map((_, i) => { const p = tb.pos((tb.tl * i) / 59); return [p[0] * 95, p[1] * 95]; }), { c: 'c2', w: 3 }); a.dot(tb.x0 * 95, tb.z0 * 95, { c: 'hl', r: 6 }); a.dot(tb.land[0] * 95, tb.land[1] * 95, { c: 'c2', r: 5 }); }
      a.arrow(R * 1.12 * Math.cos(-0.5), R * 1.12 * Math.sin(-0.5), R * 1.12 * Math.cos(-0.1), R * 1.12 * Math.sin(-0.1), { c: 'muted', w: 1.6 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Height of the fall against speed. Too slow and the washing only rolls about at the bottom; faster and it is carried higher before it lets go. At \(${fmt(rc, 0)}\) rpm the wall pushes inward all the way round, nothing falls, and the washing stops. The fall is longest at about three quarters of that speed, which is where machines wash. Drag the gold point.`, tx`落下の高さを、回転の速さに対して描いています。遅すぎると、洗濯物は底で転がるだけです。速くすると、離れる前に高く運ばれます。毎分 \(${fmt(rc, 0)}\) 回転では、壁が一周ずっと内向きに押し続け、何も落ちなくなり、洗浄は止まります。落下が最も長くなるのは、この速さの約 4 分の 3 のときで、洗濯機はそこで洗います。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [20, 80], y: [0, v.dia], aspect: 0.75, maxH: 380, xlabel: T('drum speed (rpm)', 'ドラムの回転数（rpm）'), ylabel: T('height of the fall (cm)', '落下の高さ（cm）') });
      b.line(L.sample(20, Math.min(80, rc - 0.01), 90, (q) => tumble(q, r).drop * 100), { c: 'c1', w: 2.8 }); if (rc < 80) { b.vline(rc, { c: 'c2', dash: '5 4' }); b.seg(rc, 0, 80, 0, { c: 'c1', w: 2.8 }); }
      b.handle(v.rpm, tb.pinned ? 0 : tb.drop * 100, { c: 'hl', axis: 'x', bounds: [20, 80, 0, v.dia], label: T('drum speed', 'ドラムの回転数'), onDrag: (x) => ctx.set('rpm', clamp(Math.round(x), 20, 80)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('carried by the wall; fall height', '壁に運ばれる、落下の高さ') }, { c: 'c2', label: T('in flight; speed at which nothing falls', '飛んでいる間、何も落ちなくなる速さ') }]);
      ctx.readout([
        { k: T('speed at which the washing is pinned', '洗濯物が張り付く回転数'), v: tx`\(${fmt(rc, 1)}\ \mathrm{rpm}\)` },
        { k: T('pull at the wall, in units of gravity', '壁での力（重力の何倍か）'), v: tx`\(${fmt(gFactor(v.rpm, r), 2)}\,g\)`, tone: 'key' },
        { k: T('leaves the wall at', '壁を離れる位置'), v: tb.pinned ? T('never', '離れない') : tx`\(${fmt((tb.al * 180) / PI, 0)}^\circ\ \text{${T('above the horizontal', '水平より上')}}\)` },
        { k: T('falls through', '落下の高さ'), v: tb.pinned ? tx`\(0\ \mathrm{cm}\)` : tx`\(${fmt(tb.drop * 100, 0)}\ \mathrm{cm}\)`, tone: tb.pinned ? 'warn' : 'good' },
        { k: T('lands at', '着水の速さ'), v: tb.pinned ? T('does not land', '落ちない') : tx`\(${fmt(tb.vImp, 2)}\ \mathrm{m/s}\)` },
      ], T(tb.pinned ? 'Pinned to the wall. This is how the machine begins its spin: it speeds up through this point so that the load spreads itself round the drum.' : 'The lifters on the wall stop the washing sliding back before this point; without them wet cloth would slip and never climb.', tb.pinned ? '壁に張り付いています。洗濯機は、脱水をこうして始めます。この速さを通過して加速し、洗濯物をドラムの周りに広げます。' : '壁のリフターは、この位置より前に洗濯物が滑り落ちるのを防ぎます。リフターがないと、ぬれた布は滑って上がれません。'));
    },
  };

  /* ================= 2. spinning the water out ================= */
  D['spin-extraction'] = {
    render(ctx, v) {
      const r = v.dia / 200, g = gFactor(v.rpm, r), m = rmc(g), water = m * v.load, kwh = (water * 2.6e6) / 3.6e6;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The pull on the washing at the drum wall, in multiples of gravity, against spin speed, for this drum (blue) and for ones 10 cm smaller and larger. It rises with the square of the speed, so going from 1000 to 1400 rpm nearly doubles it. Drag the gold point.`, tx`ドラムの壁で洗濯物にかかる力を、重力の何倍かで表し、脱水の回転数に対して描いています。青はこのドラム、灰色は 10 cm 小さい場合と大きい場合です。力は回転数の 2 乗で増えるので、毎分 1000 回転から 1400 回転にすると、ほぼ 2 倍になります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [400, 1800], y: [0, 1000], aspect: 0.7, maxH: 350, xlabel: T('spin speed (rpm)', '脱水の回転数（rpm）'), ylabel: T('pull at the wall (× gravity)', '壁での力（重力の倍数）') });
      [v.dia - 10, v.dia + 10].forEach((d) => a.line(L.sample(400, 1800, 60, (q) => Math.min(1000, gFactor(q, d / 200))), { c: 'muted', w: 1.3 })); a.line(L.sample(400, 1800, 60, (q) => Math.min(1000, gFactor(q, r))), { c: 'c1', w: 2.8 });
      a.handle(v.rpm, Math.min(1000, g), { c: 'hl', axis: 'x', bounds: [400, 1800, 0, 1000], label: T('spin speed', '脱水の回転数'), onDrag: (x) => ctx.set('rpm', clamp(Math.round(x / 50) * 50, 400, 1800)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Water left in cotton after spinning, as a percentage of its dry weight, against the pull. The first few hundred \(g\) remove most of what will come out. What remains is held in the fine spaces inside the yarn by surface tension, and no practical speed shifts it; that water has to be evaporated.`, tx`脱水後に綿に残る水を、乾いた重さに対する割合で、力に対して描いています。最初の数百 \(g\) で、出る水のほとんどが出ます。残りは、糸の中の細かいすき間に表面張力で保持されていて、現実的な回転数では動きません。その水は、蒸発させるしかありません。`));
      const b = L.fig(c2, { x: [0, 1000], y: [0, 100], aspect: 0.7, maxH: 350, xlabel: T('pull at the wall (× gravity)', '壁での力（重力の倍数）'), ylabel: T('water left (% of dry weight)', '残る水（乾いた重さの %）') });
      b.hline(38, { c: 'muted', dash: '5 4' }); b.line(L.sample(0, 1000, 100, (q) => 100 * rmc(q)), { c: 'c2', w: 2.8 }); b.dot(Math.min(1000, g), 100 * m, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('this drum', 'このドラム') }, { c: 'muted', label: T('other drums; water that never spins out', 'ほかのドラム、脱水では出ない水') }, { c: 'c2', label: T('water left', '残る水') }]);
      ctx.readout([
        { k: T('speed of the drum wall', 'ドラムの壁の速さ'), v: tx`\(${fmt(omega(v.rpm) * r * 3.6, 0)}\ \mathrm{km/h}\)` },
        { k: T('pull at the wall', '壁での力'), v: tx`\(${fmt(g, 0)}\,g\)`, tone: 'key' },
        { k: T('a 1 kg wet towel presses on the wall like', '1 kg のぬれたタオルが壁を押す力'), v: tx`\(${fmt(g, 0)}\ \mathrm{kg}\)` },
        { k: T('water left in ' + fmt(v.load, 1) + ' kg of cotton', fmt(v.load, 1) + ' kg の綿に残る水'), v: tx`\(${fmt(100 * m, 0)}\ \%,\ ${fmt(water, 1)}\ \mathrm{kg}\)`, tone: 'good' },
        { k: T('heat to evaporate it', 'それを蒸発させる熱'), v: tx`\(${fmt(kwh, 1)}\ \mathrm{kWh}\)` },
      ], T('Spinning costs about a tenth of a kilowatt-hour. Every kilogram of water it removes saves about 0.7 kWh of heat in a dryer, which is why a fast spin is the cheapest part of drying.', '脱水に使うのは、約 0.1 kWh です。脱水で取り除いた水 1 kg ごとに、乾燥機の熱を約 0.7 kWh 節約できます。高速の脱水が、乾燥の中で最も安上がりなのはこのためです。'));
    },
  };

  /* ================= 3. balance (3D) ================= */
  function buildWasher(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // 1 unit = 100 mm; drum axis along y, door at -y
    const white = S.mat('#eceded', { rough: 0.35, coat: 0.6 }), steel = S.mat('#cfd3d8', { metal: 1, rough: 0.28 }), plastic = S.mat('#8d939b', { rough: 0.5, opacity: 0.42 }), concrete = S.mat('#8f8c86', { rough: 0.95, coat: 0 }), dark = S.mat('#202226', { rough: 0.55 }), cloth = S.mat('#3f6fb5', { rough: 0.95, coat: 0 }), glass = S.mat('#bcd4e0', { rough: 0.05, coat: 1, opacity: 0.25 });
    const box = (w, d, h, x, y, z, mat, parent = g) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    // cabinet: base, back, left side, top; right side and front shown as a frame
    box(6, 6, 0.1, 0, 0, 0.05, white); box(6, 0.06, 8.4, 0, 2.97, 4.3, white); box(0.06, 6, 8.4, -2.97, 0, 4.3, white); box(6, 6, 0.08, 0, 0, 8.54, white).visible = false;
    S.lines([[[3, -3, 0.1], [3, -3, 8.5]], [[3, 3, 0.1], [3, 3, 8.5]], [[3, -3, 8.5], [3, 3, 8.5]], [[3, -3, 8.5], [-3, -3, 8.5]], [[-3, -3, 8.5], [-3, 3, 8.5]], [[-3, 3, 8.5], [3, 3, 8.5]], [[3, -3, 0.1], [3, 3, 0.1]], [[-3, -3, 0.1], [-3, -3, 8.5]]], { c: 'muted', opacity: 0.75, w: 1.4 });
    // the hung assembly: tub, drum, counterweights, motor
    const tub = new TH.Group(); g.add(tub);
    const tubM = new TH.Mesh(new TH.CylinderGeometry(2.6, 2.6, 3.6, 56, 1, true), plastic); tubM.material.side = 2; tub.add(tubM);
    const back = new TH.Mesh(new TH.CircleGeometry(2.6, 56).rotateX(-PI / 2), plastic); back.position.y = 1.8; tub.add(back);
    const ring = new TH.Mesh(new TH.RingGeometry(1.5, 2.6, 56).rotateX(PI / 2), plastic); ring.position.y = -1.8; tub.add(ring);
    box(3.6, 1.4, 0.7, 0, -0.6, 2.85, concrete, tub); box(2.6, 0.5, 0.7, 0, -1.55, -2.75, concrete, tub);
    const motor = new TH.Mesh(new TH.CylinderGeometry(0.55, 0.55, 1.3, 24), dark); motor.position.set(0.9, 0.6, -3.0); tub.add(motor);
    const pulley = new TH.Mesh(new TH.CylinderGeometry(1.5, 1.5, 0.12, 40), steel); pulley.position.y = 2.0; tub.add(pulley);
    const drum = new TH.Group(); tub.add(drum);
    const dm = new TH.Mesh(new TH.CylinderGeometry(2.35, 2.35, 3.1, 56, 6, true), S.mat('#d9dde2', { metal: 1, rough: 0.3, opacity: 0.55, side: 2 })); drum.add(dm);
    { const seg = []; for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU; for (let j = -2; j <= 2; j++) seg.push([[2.36 * Math.cos(a), j * 0.55 - 0.08, 2.36 * Math.sin(a)], [2.36 * Math.cos(a), j * 0.55 + 0.08, 2.36 * Math.sin(a)]]); } const ln = S.lines(seg, { c: 'ink', opacity: 0.55, w: 1.6 }); if (ln.object) drum.add(ln.object); else if (ln.isObject3D) drum.add(ln); }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 1.0, m = box(0.3, 2.8, 0.4, 2.15 * Math.cos(a), 0, 2.15 * Math.sin(a), steel, drum); m.rotation.y = -a + PI / 2; }
    const lump = new TH.Mesh(new TH.SphereGeometry(0.75, 24, 16), cloth); lump.scale.set(1.2, 1.4, 0.6); lump.position.set(1.95, 0, 0); lump.castShadow = true; drum.add(lump);
    const mark = new TH.Mesh(new TH.SphereGeometry(0.12, 12, 8), S.mat('#e2a400', { glow: 0.8, glowColour: '#e2a400' })); mark.position.y = -1.86; tub.add(mark);
    const springs = S.lines([], { c: 'ink', opacity: 0.95, w: 2.2 }), dampers = S.lines([], { c: 'c2', opacity: 0.95, w: 4 }), ghost = S.lines([], { c: 'c3', opacity: 0.8, w: 1.4 });
    S.add(g);
    return { tub, drum, springs, dampers, ghost, mark };
  }
  D['spin-balance'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const sh = shake(v.rpm, v.m, v.M, v.z), f0 = fn(v.M) * 60; st.sh = sh;
      L.setText(st.cap1, T(tx`A washing machine with its front and side removed. The tub hangs from springs and sits on dampers, with concrete blocks bolted to it; the drum turns inside. A lump of washing of \(${fmt(v.m, 1)}\) kg has stuck to one side of the drum (blue). The motion is slowed down and the shaking is drawn ten times too large; the gold bead marks the centre of the tub and the green circle the path it follows.`, tx`前面と側面を外した洗濯機です。外槽はばねでつり下げられ、ダンパーの上に載り、コンクリートのおもりがボルトで固定されています。その中でドラムが回ります。\(${fmt(v.m, 1)}\) kg の洗濯物のかたまりが、ドラムの片側に張り付いています（青）。動きは遅くしてあり、揺れは 10 倍に拡大して描いています。金色の玉は外槽の中心、緑の円はその軌跡です。`));
      L.setText(st.cap2, T(tx`How far the tub swings against drum speed. Near \(${fmt(f0, 0)}\) rpm the drum turns in step with the natural bounce of the tub on its springs and the swing peaks. Far above that the tub cannot keep up: the swing settles to a small fixed size and the lump ends up on the inside of the orbit. Drag the gold point.`, tx`外槽の揺れ幅を、ドラムの回転数に対して描いています。毎分 \(${fmt(f0, 0)}\) 回転の付近では、ドラムの回転が、ばねの上で外槽が自然に揺れる周期と一致し、揺れが最大になります。それよりずっと速くなると、外槽は追いつけなくなり、揺れは小さな一定の大きさに落ち着き、かたまりは軌道の内側に来ます。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const ymax = Math.max(6, Math.ceil((sh.lim * 1000) / (2 * v.z) * 1.15)), g = L.fig(st.g2, { x: [0, 1600], y: [0, ymax], aspect: 0.8, maxH: 400, xlabel: T('drum speed (rpm)', 'ドラムの回転数（rpm）'), ylabel: T('swing of the tub (mm)', '外槽の揺れ幅（mm）') });
      g.hline(sh.lim * 1000, { c: 'muted', dash: '5 4' }); g.line(L.sample(0, 1600, 320, (q) => Math.min(ymax, shake(q, v.m, v.M, 0.05).X * 1000)), { c: 'muted', w: 1.2 }); g.line(L.sample(0, 1600, 320, (q) => shake(q, v.m, v.M, v.z).X * 1000), { c: 'c1', w: 2.8 });
      g.handle(v.rpm, sh.X * 1000, { c: 'hl', axis: 'x', bounds: [0, 1600, 0, ymax], label: T('drum speed', 'ドラムの回転数'), onDrag: (x) => ctx.set('rpm', clamp(Math.round(x / 10) * 10, 0, 1600)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('with these dampers', 'このダンパーの場合') }, { c: 'muted', label: T('with weak dampers; high-speed limit', '弱いダンパーの場合、高速での極限') }]);
      ctx.readout([
        { k: T('tub bounces on its springs at', '外槽がばねの上で揺れる速さ'), v: tx`\(${fmt(fn(v.M), 2)}\ \mathrm{Hz}\ (${fmt(f0, 0)}\ \mathrm{rpm})\)` },
        { k: T('swing of the tub', '外槽の揺れ幅'), v: tx`\(\pm${fmt(sh.X * 1000, 1)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('lump leads the swing by', 'かたまりが揺れより先行する角度'), v: tx`\(${fmt((sh.phase * 180) / PI, 0)}^\circ\)` },
        { k: T('force of the lump on the drum', 'かたまりがドラムに及ぼす力'), v: tx`\(${fmt(sh.F0, 0)}\ \mathrm{N}\)`, tone: sh.F0 > 1000 ? 'warn' : undefined },
        { k: T('force passed to the cabinet and floor', 'キャビネットと床に伝わる力'), v: tx`\(${fmt(sh.FT, 0)}\ \mathrm{N}\)`, tone: 'good' },
      ], T('A heavier tub swings less for the same lump, because the swing at speed is the lump’s mass times its radius divided by the mass of the tub. That is all the concrete is for.', '同じかたまりでも、外槽が重いほど揺れは小さくなります。高速での揺れ幅は、かたまりの質量に半径を掛け、外槽の質量で割ったものだからです。コンクリートの役目は、それだけです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.1 : 1.0, maxH: 620, camera: [11, -15, 9], target: [0, 0, 4.2], fov: 30,
        label: T('3D washing machine with its tub hung on springs. Drag to rotate.', 'ばねでつられた外槽が見える洗濯機の 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.wm = buildWasher(S); st.t = 0;
          S.label(T('springs', 'ばね'), [2.6, -1.2, 8.1], { small: true }); S.label(T('dampers', 'ダンパー'), [2.9, -1.4, 1.0], { small: true }); S.label(T('concrete', 'コンクリート'), [0, -0.6, 7.75], { small: true }); S.label(T('tub', '外槽'), [-2.3, -2.2, 6.4], { small: true });
          const draw = (dt) => { const m = st.wm, q = st.sh; st.t += dt; const th = st.t * 2.2, A = q.X * 100, dx = A * Math.cos(th - q.phase), dz = A * Math.sin(th - q.phase);
            m.tub.position.set(dx, 0, 4.3 + dz); m.drum.rotation.y = -th;
            const sp = []; for (const sx of [-1, 1]) { const top = [sx * 2.4, -0.3, 8.45], bot = [sx * 1.6 + dx, -0.3, 4.3 + 2.05 + dz], n = 14; let prev = top; for (let i = 1; i <= n; i++) { const u = i / n, p = [top[0] + (bot[0] - top[0]) * u + (i < n ? 0.14 * (i % 2 ? 1 : -1) : 0), top[1], top[2] + (bot[2] - top[2]) * u]; sp.push([prev, p]); prev = p; } } m.springs.update(sp);
            m.dampers.update([-1, 1].map((sx) => [[sx * 2.5, -0.3, 0.2], [sx * 1.5 + dx, -0.3, 4.3 - 2.1 + dz]]));
            const gs = [], rr = Math.max(0.02, A); for (let k = 0; k < 40; k++) { const a0 = (k / 40) * TAU, a1 = ((k + 1) / 40) * TAU; gs.push([[rr * Math.cos(a0), -1.87, 4.3 + rr * Math.sin(a0)], [rr * Math.cos(a1), -1.87, 4.3 + rr * Math.sin(a1)]]); } m.ghost.update(gs); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-4, 4], y: [-0.5, 9], equal: true, maxH: 340, axes: false, grid: false }); f2.rect(-3, 0, 6, 8.5, { c: 'ink', fill: 'none', w: 1.6 }); f2.circle(0, 4.3, 2.6, { c: 'ink', fill: 'grid', fo: 0.4, w: 1.6 }); f2.circle(0, 4.3, 2.3, { c: 'muted', fill: 'none', w: 1.2 }); f2.circle(1.8, 4.3, 0.5, { c: 'c1', fill: 'c1', fo: 0.6 }); f2.seg(-2.4, 8.4, -1.6, 6.3, { c: 'ink', w: 2 }); f2.seg(2.4, 8.4, 1.6, 6.3, { c: 'ink', w: 2 }); f2.seg(-2.5, 0.2, -1.5, 2.2, { c: 'c2', w: 3 }); f2.seg(2.5, 0.2, 1.5, 2.2, { c: 'c2', w: 3 }); },
      });
    },
  };
})();
