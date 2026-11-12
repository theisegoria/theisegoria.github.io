'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), deg = (r) => (r * 180) / PI;

  /* ---------------- models (no DOM) ----------------
   * Each rib pivots at the top of the shaft. A stretcher of length s joins a point a along the rib to a runner that
   * slides on the shaft a distance d below the top. Rib, stretcher and shaft form a triangle, so by the cosine rule
   *   cos(phi) = (a^2 + d^2 - s^2) / (2 a d),  phi being the angle between rib and shaft.
   * Closed: d = a + s (phi = 0). The tip of a rib of length Lr moves Lr dphi for each dd of runner travel.
   * Wind: F = 1/2 rho v^2 Cd A on a canopy of projected area pi (Lr sin(phi))^2, shared by n ribs and spread evenly
   * along each. Beyond the stretcher joint a rib is a cantilever: M = w (Lr - a)^2 / 2, tip deflection
   * w (Lr - a)^4 / (8 E I).
   */
  const ribAngle = (d, a, s) => Math.acos(clamp((a * a + d * d - s * s) / (2 * a * d), -1, 1));
  const closedD = (a, s) => a + s;
  function runnerFor(phi, a, s) { let lo = Math.abs(a - s) + 1e-6, hi = a + s; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (ribAngle(m, a, s) > phi) lo = m; else hi = m; } return (lo + hi) / 2; }
  const leverage = (d, a, s, Lr) => { const h = 1e-5; return (Lr * Math.abs(ribAngle(d + h, a, s) - ribAngle(d - h, a, s))) / (2 * h); };   // tip travel per unit runner travel
  const maxAngle = (a, s) => (s < a ? Math.asin(s / a) : PI);
  const MATS = [{ E: 200e9, I: 4.0e-12, Z: 4.0e-9, S: 1200e6 }, { E: 40e9, I: 7.37e-12, Z: 4.21e-9, S: 900e6 }, { E: 120e9, I: 3.2e-12, Z: 2.13e-9, S: 1500e6 }];
  const RHO = 1.2, CD = 1.4;
  const canopyArea = (Lr, phi) => PI * (Lr * Math.sin(phi)) ** 2;
  const windForce = (v, Lr, phi = 1.4) => 0.5 * RHO * v * v * CD * canopyArea(Lr, phi);
  function ribLoad(v, Lr, n, mat, a = 0.25, phi = 1.4) { const F = windForce(v, Lr, phi), w = F / n / Lr, c = Lr - a, Mb = (w * c * c) / 2, m = MATS[mat], stress = Mb / m.Z, defl = (w * c ** 4) / (8 * m.E * m.I); return { F, w, Mb, stress, frac: stress / m.S, defl, flips: defl > 0.35 * c, breaks: stress > m.S }; }
  function critical(Lr, n, mat, what) { let lo = 0, hi = 80; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2, r = ribLoad(m, Lr, n, mat); if (what === 'flip' ? r.flips : r.breaks) hi = m; else lo = m; } return (lo + hi) / 2; }
  const M = { ribAngle, closedD, runnerFor, leverage, maxAngle, MATS, canopyArea, windForce, ribLoad, critical };
  (window.LabModels = window.LabModels || {}).umbrellas = M;

  const A0 = 0.25, S0 = 0.27, LR = 0.55, PHI_OPEN = (78 * PI) / 180;

  /* ================= 1. the umbrella (3D) ================= */
  function buildUmbrella(S) {
    const TH = S.THREE, g = new TH.Group(), N = 8, ZT = 9;                                             // 1 unit = 100 mm
    const steel = S.mat('#cfd3d8', { metal: 1, rough: 0.25 }), black = S.mat('#1d1e21', { rough: 0.6 }), wood = S.mat('#7a5230', { rough: 0.6, coat: 0.6 }), cloth = S.mat('#27447e', { rough: 0.9, coat: 0, side: 2, opacity: 0.86 });
    { const sh = new TH.Mesh(new TH.CylinderGeometry(0.06, 0.06, ZT + 0.6, 16).rotateX(PI / 2), steel); sh.position.z = (ZT + 0.6) / 2 - 0.3; sh.castShadow = true; g.add(sh); const fer = new TH.Mesh(new TH.ConeGeometry(0.07, 0.6, 14).rotateX(PI / 2), black); fer.position.z = ZT + 0.55; g.add(fer); const notch = new TH.Mesh(new TH.CylinderGeometry(0.16, 0.16, 0.14, 20).rotateX(PI / 2), black); notch.position.z = ZT; g.add(notch);
      const pts = []; for (let i = 0; i <= 30; i++) { const u = (i / 30) * PI; pts.push([0.6 - 0.6 * Math.cos(u), 0, -0.3 - 0.6 * Math.sin(u)]); } pts.unshift([0, 0, 0.9]); const h = S.tube(pts, { r: 0.13, add: false, radial: 10, segments: 60 }); h.material = wood; g.add(h); }
    const runner = new TH.Mesh(new TH.CylinderGeometry(0.17, 0.17, 0.3, 20).rotateX(PI / 2), black); g.add(runner);
    const ribs = [], stretch = []; for (let i = 0; i < N; i++) { const t = S.tube([[0, 0, 0], [0, 0, 1], [0, 0, 2]], { r: 0.035, add: false, radial: 6, segments: 24 }); t.material = steel; g.add(t); ribs.push(t); const m = new TH.Mesh(new TH.CylinderGeometry(0.03, 0.03, 1, 8).rotateX(PI / 2), steel); g.add(m); stretch.push(m); }
    const NR = 12, NA = 5, pos = new Float32Array(N * (NR + 1) * (NA + 1) * 3), idx = []; for (let i = 0; i < N; i++) for (let j = 0; j < NR; j++) for (let k = 0; k < NA; k++) { const b = i * (NR + 1) * (NA + 1), p = b + j * (NA + 1) + k; idx.push(p, p + NA + 1, p + 1, p + 1, p + NA + 1, p + NA + 2); }
    const geo = new TH.BufferGeometry(); geo.setAttribute('position', new TH.BufferAttribute(pos, 3)); geo.setIndex(idx); const canopy = new TH.Mesh(geo, cloth); canopy.castShadow = true; g.add(canopy);
    const zAxis = new TH.Vector3(0, 0, 1);
    const ribPoint = (phi, r, th) => { let x = 0, z = 0; const n = 12; for (let q = 0; q < n; q++) { const rm = ((q + 0.5) / n) * r, a = phi * (1 - 0.16 * (rm / 5.5)); x += Math.sin(a) * (r / n); z -= Math.cos(a) * (r / n); } return [x * Math.cos(th), x * Math.sin(th), ZT + z]; };
    const set = (phi, d) => { runner.position.z = ZT - d * 10;
      for (let i = 0; i < N; i++) { const th = (i / N) * TAU, pts = []; for (let j = 0; j <= 12; j++) pts.push(ribPoint(phi, (5.5 * j) / 12, th)); ribs[i].update(pts); const J = ribPoint(phi, 2.5, th), R0 = [0.16 * Math.cos(th), 0.16 * Math.sin(th), ZT - d * 10], A = new TH.Vector3(...R0), B = new TH.Vector3(...J), dv = B.clone().sub(A); stretch[i].position.copy(A.clone().add(B).multiplyScalar(0.5)); stretch[i].quaternion.setFromUnitVectors(zAxis, dv.clone().normalize()); stretch[i].scale.z = dv.length();
        const th2 = ((i + 1) / N) * TAU; for (let j = 0; j <= NR; j++) { const r = (5.5 * j) / NR, p0 = ribPoint(phi, r, th), p1 = ribPoint(phi, r, th2); for (let k = 0; k <= NA; k++) { const u = k / NA, sag = 1 - 0.035 * Math.sin(PI * u) * (r / 5.5), o = (i * (NR + 1) * (NA + 1) + j * (NA + 1) + k) * 3; pos[o] = (p0[0] + (p1[0] - p0[0]) * u) * sag; pos[o + 1] = (p0[1] + (p1[1] - p0[1]) * u) * sag; pos[o + 2] = p0[2] + (p1[2] - p0[2]) * u + 0.02; } } }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); };
    S.add(g);
    return { set };
  }
  D['umbrella-frame'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const dC = closedD(A0, S0), dO = runnerFor(PHI_OPEN, A0, S0), d = dC + (dO - dC) * v.open, phi = ribAngle(d, A0, S0); st.q = { phi, d };
      L.setText(st.cap1, T(tx`An umbrella seen from below. Eight ribs are hinged in a notched ring at the top of the shaft. Each is propped by a short stretcher, hinged at one end to the rib and at the other to a runner that slides on the shaft. Push the runner up and every stretcher swings its rib outward at once, drawing the cloth tight between the tips.`, tx`傘を下から見た図です。8 本の親骨が、中棒の上端にある切り込みの付いた輪（上ろくろ）にちょうつがいで留められています。それぞれの親骨は、短い受け骨で支えられています。受け骨は、一方の端が親骨に、もう一方の端が、中棒の上を滑る下ろくろに、ちょうつがいで留められています。下ろくろを押し上げると、すべての受け骨が同時に親骨を外側に振り、先端の間の布をぴんと張ります。`));
      L.setText(st.cap2, T(tx`Angle of the ribs to the shaft against the distance of the runner below the top. Rib, stretcher and shaft make a triangle with two fixed sides, \(${fmt(A0 * 1000, 0)}\) mm and \(${fmt(S0 * 1000, 0)}\) mm, and one that changes, so the angle follows from the cosine rule. The ribs swing out quickly at first and more and more slowly toward the end, which gives the hand its greatest leverage just where the cloth pulls hardest. Drag the gold point.`, tx`親骨と中棒のなす角を、上端から下ろくろまでの距離に対して描いています。親骨、受け骨、中棒は三角形を作り、二つの辺は \(${fmt(A0 * 1000, 0)}\) mm と \(${fmt(S0 * 1000, 0)}\) mm で一定、一つの辺が変化するので、角度は余弦定理から決まります。親骨は、最初は速く開き、終わりに近づくほどゆっくり動きます。そのため、布が最も強く引くところで、手は最も大きなてこの効果を得ます。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [100, 540], y: [0, 100], aspect: 0.8, maxH: 400, xlabel: T('runner below the top (mm)', '上端から下ろくろまでの距離（mm）'), ylabel: T('rib angle to the shaft (degrees)', '親骨と中棒のなす角（度）') });
      g.line(L.sample(dO * 1000, dC * 1000, 120, (q) => deg(ribAngle(q / 1000, A0, S0))), { c: 'c1', w: 2.8 }); g.vline(dO * 1000, { c: 'muted', dash: '4 3' });
      g.handle(d * 1000, deg(phi), { c: 'hl', axis: 'x', bounds: [dO * 1000, dC * 1000, 0, 100], label: T('runner', '下ろくろ'), onDrag: (x) => ctx.set('open', clamp(Math.round(((x / 1000 - dC) / (dO - dC)) * 50) / 50, 0, 1)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('rib angle', '親骨の角度') }, { c: 'muted', dash: true, label: T('fully open, held by the catch', '全開、はじきで留まる位置') }]);
      ctx.readout([
        { k: T('runner below the top', '上端から下ろくろまで'), v: tx`\(${fmt(d * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('rib angle to the shaft', '親骨と中棒のなす角'), v: tx`\(${fmt(deg(phi), 0)}^\circ\)`, tone: 'key' },
        { k: T('width across the tips', '先端の間の幅'), v: tx`\(${fmt(2 * LR * Math.sin(phi) * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('tips move, per mm of runner', '下ろくろ 1 mm あたりの先端の動き'), v: tx`\(${fmt(leverage(d, A0, S0, LR), 1)}\ \mathrm{mm}\)` },
        { k: T('runner travel, closed to open', '閉じた状態から全開までの下ろくろの移動'), v: tx`\(${fmt((dC - dO) * 1000, 0)}\ \mathrm{mm}\)` },
      ], T('One sliding part drives all eight ribs through the same angle, because every rib and stretcher is the same triangle turned round the shaft.', '滑る部品一つが、8 本の親骨すべてを同じ角度だけ動かします。どの親骨と受け骨も、中棒の周りに回した同じ三角形だからです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.9, maxH: 580, camera: [15, -20, 1.5], target: [0, 0, 4.6], fov: 30,
        label: T('3D umbrella frame and canopy that opens. Drag to rotate.', '開閉する傘の骨と布の 3D 表示。ドラッグで回転できます。'),
        init(S) { st.flat = false; st.um = buildUmbrella(S); st.um.set(st.q.phi, st.q.d); },
        update(S) { st.um.set(st.q.phi, st.q.d); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-6, 6], y: [-1, 10], equal: true, maxH: 320, axes: false, grid: false }); f2.seg([0, 0], [0, 9], { c: 'ink', w: 3 }); for (const s of [-1, 1]) { f2.seg([0, 9], [s * 5.5 * Math.sin(phi), 9 - 5.5 * Math.cos(phi)], { c: 'c1', w: 2.4 }); f2.seg([0, 9 - d * 10], [s * 2.5 * Math.sin(phi), 9 - 2.5 * Math.cos(phi)], { c: 'c2', w: 2 }); } },
      });
    },
  };

  /* ================= 2. one triangle, many umbrellas ================= */
  D['rib-linkage'] = {
    render(ctx, v) {
      const a = v.a / 1000, s = v.s / 1000, dC = closedD(a, s), pm = maxAngle(a, s), want = Math.min(PHI_OPEN, pm - 0.01), dO = runnerFor(want, a, s), d = dC + (dO - dC) * v.open, phi = ribAngle(d, a, s), lev = leverage(d, a, s, LR);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`One rib, its stretcher and the shaft, drawn to scale. The stretcher meets the rib \(${fmt(v.a, 0)}\) mm from the top and is \(${fmt(v.s, 0)}\) mm long. Closed, the three lie in a line. As the runner rises, the triangle opens. Drag the gold point up and down the shaft.`, tx`1 本の親骨、その受け骨、中棒を、縮尺どおりに描いています。受け骨は、上端から \(${fmt(v.a, 0)}\) mm の位置で親骨につながり、長さは \(${fmt(v.s, 0)}\) mm です。閉じた状態では、三つは一直線に並びます。下ろくろが上がると、三角形が開きます。金色の点を、中棒に沿って上下にドラッグしてください。`));
      const f = L.fig(c1, { x: [-80, 620], y: [-620, 60], equal: true, aspect: 0.9, maxH: 380, axes: false, grid: false });
      f.seg([0, 30], [0, -620], { c: 'ink', w: 3 }); const tip = [LR * 1000 * Math.sin(phi), -LR * 1000 * Math.cos(phi)], J = [v.a * Math.sin(phi), -v.a * Math.cos(phi)];
      f.line(L.sample(0, phi, 30, (q) => 0).map((_, i) => { const q = (phi * i) / 29; return [90 * Math.sin(q), -90 * Math.cos(q)]; }), { c: 'muted', w: 1.2 }); f.seg([0, 0], [tip[0], tip[1]], { c: 'c1', w: 3 }); f.seg([0, -d * 1000], [J[0], J[1]], { c: 'c2', w: 3 }); f.dot(0, 0, { c: 'ink', r: 4 }); f.dot(J[0], J[1], { c: 'ink', r: 4 }); f.text(60, -110, fmt(deg(phi), 0) + '°', { small: true, anchor: 'start' });
      f.handle(0, -d * 1000, { c: 'hl', axis: 'y', bounds: [-80, 620, -dC * 1000, -dO * 1000], label: T('runner', '下ろくろ'), onDrag: (x, y) => ctx.set('open', clamp(Math.round(((-y / 1000 - dC) / (dO - dC)) * 50) / 50, 0, 1)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the tip of the rib moves for each millimetre the runner is pushed, against the runner's position. Where this is large a small push moves the tips a long way, but it takes a large force on the runner to hold a given pull at the tips: the two trade exactly. The grey curves have the stretcher joined 60 mm nearer the top and 60 mm further out.`, tx`下ろくろを 1 mm 押すごとに、親骨の先端がどれだけ動くかを、下ろくろの位置に対して描いています。この値が大きいところでは、小さな押しで先端が大きく動きますが、先端の決まった引く力を支えるには、下ろくろに大きな力が必要です。二つは、ちょうど入れ替わる関係にあります。灰色の曲線は、受け骨のつなぎ目を 60 mm 上端寄りにした場合と、60 mm 外側にした場合です。`));
      const b = L.fig(c2, { x: [0, 600], y: [0, 6], aspect: 0.9, maxH: 380, xlabel: T('runner below the top (mm)', '上端から下ろくろまでの距離（mm）'), ylabel: T('tip travel per mm of runner (mm)', '下ろくろ 1 mm あたりの先端の動き（mm）') });
      [a - 0.06, a + 0.06].filter((q) => q > 0.08).forEach((aa) => { const c0 = closedD(aa, s), o0 = runnerFor(Math.min(PHI_OPEN, maxAngle(aa, s) - 0.01), aa, s); b.line(L.sample(o0 * 1000, c0 * 1000 - 2, 80, (q) => Math.min(6, leverage(q / 1000, aa, s, LR))), { c: 'muted', w: 1.3 }); });
      b.line(L.sample(dO * 1000, dC * 1000 - 2, 100, (q) => Math.min(6, leverage(q / 1000, a, s, LR))), { c: 'c3', w: 2.8 }); b.dot(d * 1000, Math.min(6, lev), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('rib', '親骨') }, { c: 'c2', label: T('stretcher', '受け骨') }, { c: 'c3', label: T('tip travel per mm of runner', '下ろくろ 1 mm あたりの先端の動き') }, { c: 'muted', label: T('stretcher joined elsewhere', '受け骨のつなぎ目を変えた場合') }]);
      ctx.readout([
        { k: T('rib angle', '親骨の角度'), v: tx`\(${fmt(deg(phi), 0)}^\circ\)`, tone: 'key' },
        { k: T('widest this frame can open', 'この骨組みが開ける最大の角度'), v: tx`\(${fmt(Math.min(180, deg(pm)), 0)}^\circ\)`, tone: pm < PHI_OPEN ? 'warn' : undefined },
        { k: T('runner travel, closed to open', '閉じた状態から全開までの下ろくろの移動'), v: tx`\(${fmt((dC - dO) * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('tip travel per mm of runner', '下ろくろ 1 mm あたりの先端の動き'), v: tx`\(${fmt(lev, 2)}\ \mathrm{mm}\)` },
        { k: T('push on the runner to hold 1 N at each of 8 tips', '8 本の先端それぞれの 1 N を支える下ろくろの力'), v: tx`\(${fmt(8 * lev, 1)}\ \mathrm{N}\)` },
        { k: T('folded length of the frame', '骨組みをたたんだ長さ'), v: tx`\(${fmt(Math.max(LR, dC) * 1000, 0)}\ \mathrm{mm}\)` },
      ], T(pm < PHI_OPEN ? 'The stretcher is shorter than the distance to its joint, so the rib cannot swing past the point where the stretcher stands square to the shaft.' : 'A folding umbrella uses the same triangle twice: each rib is jointed part-way along, and a second small linkage unfolds the outer half as the first opens the inner.', pm < PHI_OPEN ? '受け骨が、つなぎ目までの距離より短いので、親骨は、受け骨が中棒に直角になる位置より先へは振れません。' : '折りたたみ傘は、同じ三角形を二回使います。それぞれの親骨は途中に関節があり、一つ目の仕組みが内側の半分を開く間に、二つ目の小さな仕組みが外側の半分を広げます。'));
    },
  };

  /* ================= 3. wind ================= */
  D['umbrella-wind'] = {
    render(ctx, v) {
      const Lr = v.Lr / 1000, r = ribLoad(v.wind, Lr, v.n, v.mat), vf = critical(Lr, v.n, v.mat, 'flip'), vb = critical(Lr, v.n, v.mat, 'break');
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Force of the wind on an open canopy \(${fmt(2 * Lr * Math.sin(1.4) * 1000, 0)}\) mm across, held square to it. It rises with the square of the wind speed. The marks are a fresh breeze (9 m/s), a near gale (15 m/s) and a storm (25 m/s). Drag the gold point.`, tx`風に正面を向けた、幅 \(${fmt(2 * Lr * Math.sin(1.4) * 1000, 0)}\) mm の開いた傘に、風が及ぼす力です。力は、風速の 2 乗で増えます。印は、疾風（9 m/s）、強風（15 m/s）、暴風（25 m/s）です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 30], y: [0, 600], aspect: 0.7, maxH: 350, xlabel: T('wind speed (m/s)', '風速（m/s）'), ylabel: T('force on the canopy (N)', '傘にかかる力（N）') });
      [9, 15, 25].forEach((q) => a.vline(q, { c: 'muted', dash: '3 4' })); a.line(L.sample(0, 30, 60, (q) => Math.min(600, windForce(q, Lr))), { c: 'c1', w: 2.8 });
      a.handle(v.wind, Math.min(600, r.F), { c: 'hl', axis: 'x', bounds: [0, 30, 0, 600], label: T('wind speed', '風速'), onDrag: (x) => ctx.set('wind', clamp(Math.round(x), 0, 30)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the tip of a rib is bent back by that wind, for ribs of spring steel, glass fibre and carbon fibre. Beyond its stretcher a rib is a springy rod fixed at one end. When the tips have bent back past the dashed line the canopy turns inside out; the cross on each curve is where the rib itself breaks or kinks.`, tx`その風で、親骨の先端がどれだけ後ろに曲げられるかを、ばね鋼、ガラス繊維、炭素繊維の親骨について描いています。受け骨より先の親骨は、一端を固定した、ばねのような棒です。先端が破線を超えて曲がると、傘は裏返ります。それぞれの曲線の × 印は、親骨そのものが折れるか、座屈する点です。`));
      const cth = 0.35 * (Lr - 0.25) * 1000, b = L.fig(c2, { x: [0, 30], y: [0, 300], aspect: 0.7, maxH: 350, xlabel: T('wind speed (m/s)', '風速（m/s）'), ylabel: T('tip bent back by (mm)', '先端が曲げられる量（mm）') });
      b.hline(cth, { c: 'muted', dash: '5 4' }); [0, 1, 2].forEach((m) => { const vbk = critical(Lr, v.n, m, 'break'); b.line(L.sample(0, Math.min(30, vbk), 60, (q) => Math.min(300, ribLoad(q, Lr, v.n, m).defl * 1000)), { c: m === v.mat ? ['c1', 'c2', 'c3'][m] : 'muted', w: m === v.mat ? 2.8 : 1.4 }); if (vbk <= 30) b.text(vbk, Math.min(290, ribLoad(vbk, Lr, v.n, m).defl * 1000), '×', { anchor: 'middle' }); });
      b.dot(v.wind, Math.min(300, r.defl * 1000), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('force; steel ribs', '力、鋼の親骨') }, { c: 'c2', label: T('glass fibre', 'ガラス繊維') }, { c: 'c3', label: T('carbon fibre', '炭素繊維') }, { c: 'muted', dash: true, label: T('canopy turns inside out', '傘が裏返る') }]);
      ctx.readout([
        { k: T('force on the canopy', '傘にかかる力'), v: tx`\(${fmt(r.F, 0)}\ \mathrm{N}\ (${fmt(r.F / 9.81, 1)}\ \mathrm{kg})\)`, tone: 'key' },
        { k: T('load along each rib', '親骨 1 本に沿った荷重'), v: tx`\(${fmt(r.w, 1)}\ \mathrm{N/m}\)` },
        { k: T('bending at the stretcher joint', '受け骨のつなぎ目での曲げ'), v: tx`\(${fmt(r.Mb, 2)}\ \mathrm{N\,m}\)` },
        { k: T('stress in the rib, of its strength', '親骨の応力（強度に対する割合）'), v: tx`\(${fmt(r.stress / 1e6, 0)}\ \mathrm{MPa},\ ${fmt(100 * r.frac, 0)}\ \%\)`, tone: r.breaks ? 'warn' : 'good' },
        { k: T('tip bent back by', '先端が曲げられる量'), v: tx`\(${fmt(r.defl * 1000, 0)}\ \mathrm{mm}\)`, tone: r.flips ? 'warn' : undefined },
        { k: T('turns inside out at, breaks at', '裏返る風速、折れる風速'), v: tx`\(${fmt(vf, 0)},\ ${fmt(vb, 0)}\ \mathrm{m/s}\)` },
      ], T(vf < vb ? 'These ribs bend far enough to let the canopy flip well before they break, so the umbrella can be turned back the right way. That is the idea behind flexible storm umbrellas.' : 'These ribs are stiff enough to hold their shape until the metal gives. The umbrella resists longer, and then fails for good.', vf < vb ? 'この親骨は、折れるよりずっと前に、傘が裏返るほど大きく曲がります。そのため、傘は元に戻せます。これが、しなやかな耐風傘の考え方です。' : 'この親骨は、金属が耐えられなくなるまで形を保つほど硬いものです。傘は長く持ちこたえますが、その後は、元に戻らない形で壊れます。'));
    },
  };
})();
