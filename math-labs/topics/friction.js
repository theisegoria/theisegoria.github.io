'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, G = 9.81, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180, deg = (r) => (r * 180) / PI;

  /* ---------------- models (no DOM) ----------------
   * Coulomb friction on a slope: the block needs m g sin(theta) along the slope and the surface can supply up to
   * mu_s m g cos(theta), so it holds while tan(theta) <= mu_s. Once sliding the force is mu_k m g cos(theta) and
   * the block accelerates at g (sin - mu_k cos).
   * Capstan: a rope wrapped through an angle phi round a post holds T_load = T_hold exp(mu phi).
   * Stick-slip: a block of mass m on a belt moving at v, held back by a spring k. It rides the belt until the
   * spring force reaches mu_s m g at x1, then slides as a harmonic oscillator centred on xk = mu_k m g / k until
   * its speed matches the belt again, at x2 = 2 xk - x1. Stick time 2 (x1 - xk) / v; slip time (pi + 2 alpha) / omega
   * with tan(alpha) = v / (omega (x1 - xk)).
   */
  const critAngle = (mus) => deg(Math.atan(mus));
  const holds = (thetaDeg, mus) => Math.tan(rad(thetaDeg)) <= mus;
  const demand = (m, thetaDeg) => m * G * Math.sin(rad(thetaDeg));
  const available = (m, thetaDeg, mus) => mus * m * G * Math.cos(rad(thetaDeg));
  const frictionForce = (m, thetaDeg, mus, muk) => (holds(thetaDeg, mus) ? demand(m, thetaDeg) : muk * m * G * Math.cos(rad(thetaDeg)));
  const slideAccel = (thetaDeg, mus, muk) => (holds(thetaDeg, mus) ? 0 : G * (Math.sin(rad(thetaDeg)) - muk * Math.cos(rad(thetaDeg))));
  const capstanRatio = (mu, turns) => Math.exp(mu * 2 * PI * turns);
  const turnsFor = (mu, ratio) => Math.log(ratio) / (2 * PI * mu);
  function stickSlip(m, k, v, mus, muk) {
    const N = m * G, x1 = (mus * N) / k, xk = (muk * N) / k, om = Math.sqrt(k / m), d = x1 - xk, alpha = Math.atan2(v / om, d), A = Math.hypot(d, v / om);
    const tStick = (2 * d) / v, tSlip = (PI + 2 * alpha) / om;
    return { x1, xk, x2: 2 * xk - x1, om, alpha, A, tStick, tSlip, period: tStick + tSlip, freq: 1 / (tStick + tSlip), natural: om / (2 * PI) };
  }
  function blockAt(t, s, v) { const q = ((t % s.period) + s.period) % s.period; if (q <= s.tStick) return { x: s.x2 + v * q, u: v, stuck: true }; const tau = q - s.tStick; return { x: s.xk + s.A * Math.cos(s.om * tau - s.alpha), u: -s.A * s.om * Math.sin(s.om * tau - s.alpha), stuck: false }; }
  const M = { G, critAngle, holds, demand, available, frictionForce, slideAccel, capstanRatio, turnsFor, stickSlip, blockAt };
  (window.LabModels = window.LabModels || {}).friction = M;

  /* ================= 1. a block on a slope ================= */
  D['friction-incline'] = {
    render(ctx, v) {
      const muk = Math.min(v.muk, v.mus), th = rad(v.th), ok = holds(v.th, v.mus), ca = critAngle(v.mus), W = v.m * G, Ff = frictionForce(v.m, v.th, v.mus, muk), acc = slideAccel(v.th, v.mus, muk);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A block of \(${fmt(v.m, 0)}\) kg on a slope. Its weight (grey) splits into a part pressing it into the surface, answered by the surface’s push (blue), and a part along the slope, answered by friction (red). Friction is not a fixed force: it supplies exactly what is asked of it, up to a ceiling set by the push between the surfaces.`, tx`斜面の上にある \(${fmt(v.m, 0)}\) kg の物体です。重さ（灰色）は、物体を面に押し付ける成分と、斜面に沿う成分に分かれます。前者には面が押し返す力（青）が、後者には摩擦（赤）が応えます。摩擦は決まった大きさの力ではありません。面どうしを押し付ける力で決まる上限までは、求められた分だけを、ちょうど与えます。`));
      const a = L.fig(c1, { x: [-0.6, 5.2], y: [-0.4, 4.6], equal: true, maxH: 350, axes: false, grid: false });
      const cs = Math.cos(th), sn = Math.sin(th), P = (s, n) => [s * cs - n * sn, s * sn + n * cs], Ls = 5.0;
      a.poly([[0, 0], [Ls * cs, 0], [Ls * cs, Ls * sn]], { c: 'muted', fill: 'muted', opacity: 0.18 }); a.seg([0, 0], [Ls * cs, Ls * sn], { c: 'ink', w: 2.4 }); a.seg([0, 0], [Ls * cs, 0], { c: 'muted', w: 1.2 });
      const s0 = 2.6, bw = 1.0, bh = 0.7; a.poly([P(s0 - bw / 2, 0), P(s0 + bw / 2, 0), P(s0 + bw / 2, bh), P(s0 - bw / 2, bh)], { c: 'ink', fill: ok ? 'c3' : 'c2', opacity: 0.55, w: 1.6 });
      const cg = P(s0, bh / 2), sc = 1.5 / W; a.arrow(cg, [cg[0], cg[1] - W * sc], { c: 'muted', w: 2.2 }); a.arrow(P(s0, bh), P(s0, bh + W * cs * sc), { c: 'c1', w: 2.2 }); a.arrow(P(s0 - bw / 2, 0.06), P(s0 - bw / 2 + Ff * sc, 0.06), { c: 'c2', w: 2.6 });
      a.text(0.75, 0.12 + 0.2 * sn, tx`${fmt(v.th, 0)}°`, { small: true });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Forces along the slope against its angle. The dashed line is what the block needs to stay put; the grey curve is the most that static friction can give. They cross at \(${fmt(ca, 1)}\)°, the angle of friction, whose tangent is the coefficient. Past it the block slides and friction drops to its lower, sliding value (red). Drag the gold point.`, tx`斜面に沿う力を、斜面の角度に対して描いています。破線は、物体がその場にとどまるのに必要な力です。灰色の曲線は、静止摩擦が与えられる最大の力です。二つは、摩擦角である \(${fmt(ca, 1)}\)° で交わります。その正接が摩擦係数です。これを超えると物体は滑り、摩擦は、より小さい動摩擦の値（赤）に下がります。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0, 60], y: [0, W * 1.05], aspect: 0.7, maxH: 350, xlabel: T('angle of the slope (degrees)', '斜面の角度（度）'), ylabel: T('force along the slope (N)', '斜面に沿う力（N）') });
      b.vline(ca, { c: 'muted', dash: '4 3' }); b.line(L.sample(0, 60, 80, (q) => demand(v.m, q)), { c: 'ink', w: 1.4, dash: '5 4' }); b.line(L.sample(0, 60, 80, (q) => available(v.m, q, v.mus)), { c: 'muted', w: 1.6 });
      b.line(L.sample(0, ca, 50, (q) => demand(v.m, q)), { c: 'c2', w: 2.8 }); b.line(L.sample(ca, 60, 50, (q) => muk * v.m * G * Math.cos(rad(q))), { c: 'c2', w: 2.8 });
      b.handle(v.th, Ff, { c: 'hl', axis: 'x', bounds: [0, 60, 0, W * 1.05], label: T('angle', '角度'), onDrag: (x) => ctx.set('th', clamp(Math.round(x), 0, 60)) });
      L.legend(ctx.host, [{ c: 'c2', label: T('friction acting', '働いている摩擦') }, { c: 'muted', label: T('most that static friction can give', '静止摩擦が与えられる最大') }, { c: 'ink', dash: true, label: T('needed to stay put', 'とどまるのに必要な力') }, { c: 'c1', label: T('push of the surface', '面が押し返す力') }]);
      ctx.readout([
        { k: T('angle of friction', '摩擦角'), v: tx`\(${fmt(ca, 1)}^\circ\)` },
        { k: T('push of the surface', '面が押し返す力'), v: tx`\(${fmt(W * cs, 1)}\ \mathrm{N}\)` },
        { k: T('pull along the slope', '斜面に沿って引く力'), v: tx`\(${fmt(W * sn, 1)}\ \mathrm{N}\)` },
        { k: T('friction acting', '働いている摩擦'), v: tx`\(${fmt(Ff, 1)}\ \mathrm{N}\)`, tone: 'key' },
        { k: T('acceleration down the slope', '斜面を下る加速度'), v: tx`\(${fmt(acc, 2)}\ \mathrm{m/s^2}\)`, tone: ok ? 'good' : 'warn' },
      ], T(ok ? 'The block holds. Friction is giving only what is needed, less than its ceiling, and would give more if the slope steepened.' : 'The slope is steeper than the angle of friction, so the block slides. Sliding friction is weaker than the grip it broke, which is why things that start to slip keep slipping.', ok ? '物体はとどまっています。摩擦は、上限より小さい、必要な分だけを与えていて、斜面が急になれば、さらに与えます。' : '斜面が摩擦角より急なので、物体は滑ります。動摩擦は、破られたグリップより弱く、滑り始めたものが滑り続けるのはこのためです。'));
    },
  };

  /* ================= 2. a rope round a post (3D) ================= */
  const RB = 1.0, RR = 0.17;
  function buildBollard(S) {
    const TH = S.THREE, g = new TH.Group(), iron = S.mat('#23272c', { metal: 0.85, rough: 0.5 }), stone = S.mat('#9a968c', { rough: 0.95, coat: 0 });
    const prof = [[0, 0], [1.75, 0], [1.75, 0.16], [1.3, 0.3], [1.05, 0.55], [RB, 0.9], [RB, 3.0], [1.1, 3.2], [1.55, 3.45], [1.62, 3.7], [1.4, 3.95], [0.8, 4.12], [0, 4.16]].map((q) => new TH.Vector2(q[0], q[1]));
    const post = new TH.Mesh(new TH.LatheGeometry(prof, 64).rotateX(PI / 2), iron); post.castShadow = true; post.receiveShadow = true; g.add(post);
    for (let i = 0; i < 4; i++) { const a = PI / 4 + (i * PI) / 2, b = new TH.Mesh(new TH.CylinderGeometry(0.13, 0.13, 0.1, 6).rotateX(PI / 2), S.mat('#3a3f45', { metal: 1, rough: 0.4 })); b.position.set(1.45 * Math.cos(a), 1.45 * Math.sin(a), 0.2); g.add(b); }
    const quay = new TH.Mesh(new TH.BoxGeometry(11, 9, 0.6), stone); quay.position.set(-0.5, -0.5, -0.3); quay.receiveShadow = true; g.add(quay);
    const edge = new TH.Mesh(new TH.BoxGeometry(11, 0.35, 0.22), S.mat('#c9a437', { rough: 0.8, coat: 0 })); edge.position.set(-0.5, -4.82, 0.11); g.add(edge);
    const rope = new TH.Group(); g.add(rope); S.add(g);
    const cool = new TH.Color('#d9c9a3'), hot = new TH.Color('#c2452d');
    const R = RB + RR, Z0 = 1.05, PITCH = 2 * RR * 1.04;
    function set(turns, mu) {
      for (const m of [...rope.children]) { m.geometry.dispose(); m.material.dispose(); rope.remove(m); }
      const phiE = 2 * PI * turns, ze = Z0 + PITCH * turns, total = mu * phiE, pts = [], lt = [];                         // lt = log of tension above the hand's
      for (let i = 0; i <= 8; i++) { const s = i / 8; pts.push(new TH.Vector3(R, -5.2 + 5.2 * s, Z0 + 0.5 * (1 - s))); lt.push(total); }                                   // taut lead from the ship
      const n = Math.max(12, Math.round(turns * 40)); for (let i = 1; i <= n; i++) { const p = (phiE * i) / n; pts.push(new TH.Vector3(R * Math.cos(p), R * Math.sin(p), Z0 + (PITCH * p) / (2 * PI))); lt.push(mu * (phiE - p)); }
      const tx_ = -Math.sin(phiE), ty = Math.cos(phiE), ex = R * Math.cos(phiE), ey = R * Math.sin(phiE);
      for (let i = 1; i <= 8; i++) { const s = (i / 8) * 3.6; pts.push(new TH.Vector3(ex + tx_ * s, ey + ty * s, ze - 0.05 * s * s + 0.1 * s)); lt.push(0); }                // slack tail to the hand
      const span = Math.max(mu * 2 * PI * 3, total), CH = 6;
      for (let i = 0; i + 1 < pts.length; i += CH) { const seg = pts.slice(Math.max(0, i - 1), Math.min(pts.length, i + CH + 2)), k = Math.min(lt.length - 1, i + CH / 2), col = cool.clone().lerp(hot, clamp(lt[k] / span, 0, 1));
        const cur = new TH.CatmullRomCurve3(seg), t0 = i === 0 ? 0 : 1 / (seg.length - 1), t1 = i + CH + 2 > pts.length ? 1 : 1 - 1 / (seg.length - 1), sub = []; for (let j = 0; j <= 14; j++) sub.push(cur.getPoint(t0 + ((t1 - t0) * j) / 14));
        const m = new TH.Mesh(new TH.TubeGeometry(new TH.CatmullRomCurve3(sub), 28, RR, 10), new TH.MeshStandardMaterial({ color: col, roughness: 0.9, metalness: 0 })); m.castShadow = true; rope.add(m); }
      return { hand: [ex + tx_ * 3.9, ey + ty * 3.9, ze + 0.5] };
    }
    return { set };
  }
  D.capstan = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const ratio = capstanRatio(v.mu, v.turns), load = v.hold * ratio, lg = Math.log10; st.q = { turns: v.turns, mu: v.mu };
      L.setText(st.cap1, T(tx`A mooring rope taken \(${fmt(v.turns, 2)}\) times round a cast-iron bollard on a quay. The ship pulls on the straight end; a hand holds the loose tail. Each short length of rope is pressed against the iron by the tension in it, and the friction that results takes a little of that tension away, so the pull falls step by step round the post. The colour shows it fading from the ship’s pull (red) to the hand’s (pale).`, tx`岸壁にある鋳鉄の係船柱に、係留ロープを \(${fmt(v.turns, 2)}\) 回巻いたところです。まっすぐな端を船が引き、緩んだ端を手が持っています。ロープの短い各部分は、そこでの張力によって鉄に押し付けられ、その結果生じる摩擦が、張力を少しずつ奪います。そのため、引く力は、柱を回るにつれて段階的に下がります。色は、船が引く力（赤）から手が持つ力（淡い色）へと弱まっていく様子を表しています。`));
      L.setText(st.cap2, T(tx`The load a hand pulling with \(${fmt(v.hold, 0)}\) N can hold, against the number of turns, on a logarithmic scale. Every turn multiplies the load by the same factor, here \(${fmt(capstanRatio(v.mu, 1), 1)}\), so the line is straight. The size of the post does not appear at all. Drag the gold point.`, tx`\(${fmt(v.hold, 0)}\) N で引く手が支えられる荷重を、巻き数に対して、対数目盛りで描いています。1 回巻くごとに、荷重は同じ倍率、ここでは \(${fmt(capstanRatio(v.mu, 1), 1)}\) 倍になるので、線はまっすぐです。柱の太さは、まったく現れません。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 5], y: [1, 7], aspect: 0.8, maxH: 400, xlabel: T('turns round the post', '柱に巻いた回数'), ylabel: T('load held (N)', '支えられる荷重（N）'), ticksY: [[1, '10'], [2, '100'], [3, '1 k'], [4, '10 k'], [5, '100 k'], [6, '1 M'], [7, '10 M']] });
      g.line(L.sample(0, 5, 40, (q) => Math.min(7, lg(v.hold * capstanRatio(v.mu, q)))), { c: 'c2', w: 2.8 }); g.hline(lg(v.hold), { c: 'c1', dash: '5 4' });
      g.handle(v.turns, Math.min(7, lg(load)), { c: 'hl', axis: 'x', bounds: [0.25, 5, 1, 7], label: T('turns', '巻き数'), onDrag: (x) => ctx.set('turns', clamp(Math.round(x * 4) / 4, 0.25, 5)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('load held', '支えられる荷重') }, { c: 'c1', dash: true, label: T('pull of the hand', '手が引く力') }]);
      ctx.readout([
        { k: T('angle of wrap', '巻き付き角'), v: tx`\(${fmt(v.turns * 360, 0)}^\circ\)` },
        { k: T('one turn multiplies the pull by', '1 回巻くごとの倍率'), v: tx`\(${fmt(capstanRatio(v.mu, 1), 2)}\)` },
        { k: T('load over hold', '荷重と手の力の比'), v: tx`\(${fmt(ratio, ratio < 100 ? 1 : 0)}\)`, tone: 'key' },
        { k: T('load held', '支えられる荷重'), v: tx`\(${load < 1e4 ? fmt(load, 0) + String.raw`\ \mathrm{N}` : fmt(load / 1000, load < 1e5 ? 1 : 0) + String.raw`\ \mathrm{kN}`}\)`, tone: 'key' },
        { k: T('as a hanging mass', 'つるした質量に直すと'), v: tx`\(${load / G < 1000 ? fmt(load / G, 0) + String.raw`\ \mathrm{kg}` : fmt(load / G / 1000, 1) + String.raw`\ \mathrm{t}`}\)` },
      ], T('Friction on a wrapped rope compounds like interest. That is why a sailor can check a ship with one hand, and why a knot holds at all.', '巻き付いたロープの摩擦は、利息のように複利で増えます。船乗りが片手で船を止められるのも、そもそも結び目がほどけないのも、このためです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.85, maxH: 540, camera: [10.5, -13.5, 8.2], target: [0.2, -0.8, 1.6], fov: 30,
        label: T('3D mooring bollard with a rope wound round it. Drag to rotate.', 'ロープを巻いた係船柱の 3D 表示。ドラッグで回転できます。'),
        init(S) { st.flat = false; st.bol = buildBollard(S); st.bol.set(st.q.turns, st.q.mu); st.done = st.q.turns + '/' + st.q.mu; S.label(T('to the ship', '船へ'), [RB + RR, -4.6, 2.2], { small: true }); },
        update(S) { const key = st.q.turns + '/' + st.q.mu; if (key !== st.done) { st.bol.set(st.q.turns, st.q.mu); st.done = key; } S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-3, 3], y: [-3, 3], equal: true, maxH: 320, axes: false, grid: false }); f2.circle(0, 0, 1, { c: 'ink', fill: 'muted', opacity: 0.4 }); { const arc = []; for (let i = 0; i <= 60; i++) { const q = (2 * PI * Math.min(1, v.turns) * i) / 60; arc.push([1.12 * Math.cos(q), 1.12 * Math.sin(q)]); } f2.line(arc, { c: 'c2', w: 3 }); } f2.seg([1.12, -3], [1.12, 0], { c: 'c2', w: 3 }); },
      });
    },
  };

  /* ================= 3. stick-slip ================= */
  D['stick-slip'] = {
    render(ctx, v) {
      const m = 1, muk = 0.3, mus = muk + v.dmu, vb = v.vb / 1000, s = stickSlip(m, v.k, vb, mus, muk), span = Math.max(3 * s.period, 0.2);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A block of 1 kg rests on a belt moving at \(${fmt(v.vb, 0)}\) mm/s and is held back by a spring. The curve is how far the spring is stretched. The block rides the belt, stretching the spring steadily, until the spring overcomes static friction. Then it slides back against the weaker sliding friction, overshoots, and is caught again. Nothing in the drive is periodic, yet the motion is.`, tx`1 kg の物体が、毎秒 \(${fmt(v.vb, 0)}\) mm で動くベルトの上にあり、ばねで引き止められています。曲線は、ばねの伸びです。物体はベルトに乗って進み、ばねを一定の速さで伸ばしていきます。ばねが静止摩擦に打ち勝つと、物体は、より弱い動摩擦に逆らって滑り戻り、行き過ぎて、再びつかまれます。駆動側には周期的なものは何もないのに、運動は周期的になります。`));
      const a = L.fig(c1, { x: [0, span], y: [Math.min(0, s.x2 * 1000 * 1.15), s.x1 * 1000 * 1.15], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（s）'), ylabel: T('stretch of the spring (mm)', 'ばねの伸び（mm）') });
      a.hline(s.x1 * 1000, { c: 'muted', dash: '5 4' }); a.hline(s.xk * 1000, { c: 'c3', dash: '2 4' }); a.line(L.sample(0, span, 600, (t) => blockAt(t, s, vb).x * 1000), { c: 'c1', w: 2.6 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The same motion as speed against stretch. Along the flat top the block is stuck, moving with the belt. The arc is the slip: half an oscillation, and a little more, of a mass on a spring about the point where sliding friction balances the spring (dotted). A stiffer spring or a slower belt shrinks the loop; a larger gap between sticking and sliding friction makes it bigger.`, tx`同じ運動を、伸びに対する速さとして描いています。平らな上辺では、物体は張り付いていて、ベルトと一緒に動いています。弧が滑りです。動摩擦とばねがつり合う点（点線）を中心とした、ばねに付いたおもりの振動の、半周期と少しに当たります。ばねを硬くするか、ベルトを遅くすると、輪は小さくなります。静止摩擦と動摩擦の差を大きくすると、輪は大きくなります。`));
      const umin = -s.A * s.om * 1000, b = L.fig(c2, { x: [Math.min(0, s.x2 * 1000 * 1.1), s.x1 * 1000 * 1.15], y: [umin * 1.15, Math.max(v.vb * 3, -umin * 0.25)], aspect: 0.7, maxH: 350, xlabel: T('stretch of the spring (mm)', 'ばねの伸び（mm）'), ylabel: T('speed of the block (mm/s)', '物体の速さ（mm/s）') });
      b.hline(0, { c: 'muted', w: 1 }); b.vline(s.xk * 1000, { c: 'c3', dash: '2 4' }); { const loop = []; for (let i = 0; i <= 400; i++) { const q = blockAt((s.period * i) / 400, s, vb); loop.push([q.x * 1000, q.u * 1000]); } b.line(loop, { c: 'c2', w: 2.6 }); }
      L.legend(ctx.host, [{ c: 'c1', label: T('stretch of the spring', 'ばねの伸び') }, { c: 'muted', dash: true, label: T('where static friction gives way', '静止摩擦が負ける位置') }, { c: 'c3', dash: true, label: T('balance while sliding', '滑っている間のつり合いの位置') }, { c: 'c2', label: T('one cycle', '1 周期') }]);
      ctx.readout([
        { k: T('sticks for', '張り付いている時間'), v: tx`\(${fmt(s.tStick, s.tStick < 0.1 ? 3 : 2)}\ \mathrm{s}\)` },
        { k: T('slips for', '滑っている時間'), v: tx`\(${fmt(s.tSlip, 3)}\ \mathrm{s}\)` },
        { k: T('cycles per second', '1 秒あたりの回数'), v: tx`\(${fmt(s.freq, 2)}\ \mathrm{Hz}\)`, tone: 'key' },
        { k: T('mass on the spring alone would give', 'ばねとおもりだけの場合'), v: tx`\(${fmt(s.natural, 2)}\ \mathrm{Hz}\)` },
        { k: T('fastest slip', '最も速い滑り'), v: tx`\(${fmt(s.A * s.om * 1000 + v.vb, 0)}\ \mathrm{mm/s}\)` },
      ], T(s.tStick > 3 * s.tSlip ? 'Long, slow sticking and a quick snap back: a creak, a squeal, a jerk. The rate is set mostly by how long the belt takes to reload the spring.' : 'The sticking part is now short, and the rate is close to the natural frequency of the mass on its spring. This is the regime of a bowed string, where the string, not the bow, sets the pitch.', s.tStick > 3 * s.tSlip ? '長くゆっくりした張り付きと、すばやい跳ね戻りです。きしみ、鳴き、がたつきがこれに当たります。回数は主に、ベルトがばねを再び伸ばすのにかかる時間で決まります。' : '張り付きの部分が短くなり、回数は、ばねとおもりの固有振動数に近くなっています。これは、弓で弾いた弦の領域で、音の高さを決めるのは、弓ではなく弦です。'));
    },
  };
})();
