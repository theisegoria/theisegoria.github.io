'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = 180 / PI;

  /* ---------- model (pure, checked by checks/hyperbolic-geometry.cjs) ---------- */
  // complex numbers as [re, im]
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const conj = (a) => [a[0], -a[1]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const abs = (a) => Math.hypot(a[0], a[1]);
  const scale = (a, s) => [a[0] * s, a[1] * s];
  const unit = (a) => { const n = abs(a) || 1; return [a[0] / n, a[1] / n]; };
  const ONE = [1, 0];
  // the disc isometry that sends a to 0, and its inverse (sends 0 to a)
  const toOrigin = (a, z) => div(sub(z, a), sub(ONE, mul(conj(a), z)));
  const fromOrigin = (a, z) => div(add(z, a), add(ONE, mul(conj(a), z)));
  const dist = (z, w) => 2 * Math.atanh(Math.min(abs(toOrigin(z, w)), 1 - 1e-16));
  const distFormula = (z, w) => { const d = sub(z, w); return Math.acosh(1 + 2 * (d[0] * d[0] + d[1] * d[1]) / ((1 - z[0] * z[0] - z[1] * z[1]) * (1 - w[0] * w[0] - w[1] * w[1]))); };
  // the point at signed hyperbolic distance s from P, on the geodesic towards Q
  const along = (P, Q, s) => fromOrigin(P, scale(unit(toOrigin(P, Q)), Math.tanh(s / 2)));
  // Euclidean polyline of the geodesic leaving P in direction u (unit), parameter t in the P-centred picture
  const chord = (P, u, t0, t1, n = 120) => L.seq(n + 1, (i) => fromOrigin(P, scale(u, t0 + (t1 - t0) * i / n)));
  const segment = (P, Q, n = 90) => { const w = toOrigin(P, Q); return chord(P, unit(w), 0, abs(w), n); };
  const idealEnds = (P, Q) => { const u = unit(toOrigin(P, Q)); return [fromOrigin(P, u), fromOrigin(P, scale(u, -1))]; };
  // the model is conformal and the isometry to the origin has a positive real derivative, so directions at A are read at 0
  const dirAt = (A, B) => unit(toOrigin(A, B));
  const angleAt = (A, B, C) => { const u = dirAt(A, B), v = dirAt(A, C); return Math.acos(L.clamp(u[0] * v[0] + u[1] * v[1], -1, 1)); };
  // perpendicular from R to the line PQ, and the two limiting parallels through R
  function parallels(P, Q, R) {
    const [e1, e2] = idealEnds(P, Q);
    const f1 = unit(toOrigin(R, e1)), f2 = unit(toOrigin(R, e2)), s = add(f1, f2);
    if (abs(s) < 1e-9) return { e1, e2, f1, f2, m: [-f1[1], f1[0]], phi: PI / 2, d: 0, foot: R };
    const m = unit(s), phi = Math.acos(L.clamp(f1[0] * m[0] + f1[1] * m[1], -1, 1));
    const r0 = (1 - Math.sin(phi)) / Math.cos(phi);
    return { e1, e2, f1, f2, m, phi, d: 2 * Math.atanh(r0), foot: fromOrigin(R, scale(m, r0)) };
  }
  const lobachevsky = (d) => 2 * Math.atan(Math.exp(-d));
  // circle orthogonal to the unit circle through P and Q (null when P, Q and 0 are collinear)
  function geoCircle(P, Q) {
    const det = P[0] * Q[1] - Q[0] * P[1];
    if (Math.abs(det) < 1e-12) return null;
    const r1 = (1 + P[0] * P[0] + P[1] * P[1]) / 2, r2 = (1 + Q[0] * Q[0] + Q[1] * Q[1]) / 2;
    const c = [(r1 * Q[1] - r2 * P[1]) / det, (P[0] * r2 - Q[0] * r1) / det];
    return { c, rho: Math.sqrt(c[0] * c[0] + c[1] * c[1] - 1) };
  }
  // area of triangle ABC from the area element 4 dx dy / (1 - r^2)^2, after moving A to 0 (an isometry)
  function areaByIntegration(A, B, C, n = 8000) {
    const b = toOrigin(A, B), c = toOrigin(A, C), g = geoCircle(b, c);
    if (!g) return 0;
    const t0 = Math.atan2(b[1], b[0]); let dt = Math.atan2(c[1], c[0]) - t0;
    while (dt > PI) dt -= 2 * PI; while (dt < -PI) dt += 2 * PI;
    // theta = t0 + dt (u - sin(2 pi u) / 2 pi) clusters samples at the two ends, where the integrand is steep
    let s = 0;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, th = t0 + dt * (u - Math.sin(2 * PI * u) / (2 * PI)), ce = g.c[0] * Math.cos(th) + g.c[1] * Math.sin(th);
      const R = ce - Math.sqrt(Math.max(0, ce * ce - 1));
      s += 2 * R * R / (1 - R * R) * (1 - Math.cos(2 * PI * u));
    }
    return s * Math.abs(dt) / n;
  }
  // regular tiling {p, q}: fundamental triangle with angles pi/p at 0, pi/2 at the edge midpoint, pi/q at a vertex
  function tiling(p, q) {
    if ((p - 2) * (q - 2) <= 4) return { hyper: false, p, q, flat: (p - 2) * (q - 2) === 4 };
    const xm = Math.tanh(Math.acosh(Math.cos(PI / q) / Math.sin(PI / p)) / 2);
    const rv = Math.tanh(Math.acosh(1 / (Math.tan(PI / p) * Math.tan(PI / q))) / 2);
    return { hyper: true, p, q, xm, rv, c: (xm + 1 / xm) / 2, rho: (1 / xm - xm) / 2, vertex: [rv * Math.cos(PI / p), rv * Math.sin(PI / p)], area: (p - 2) * PI - 2 * PI * p / q };
  }
  // reflect z into the fundamental triangle; par = parity of the number of reflections
  function fold(z, G, maxIter = 90) {
    let x = z[0], y = z[1], par = 0, k = 0;
    const c2 = Math.cos(2 * PI / G.p), s2 = Math.sin(2 * PI / G.p), cp = Math.cos(PI / G.p), sp = Math.sin(PI / G.p), rr = G.rho * G.rho;
    for (; k < maxIter; k++) {
      let moved = false;
      if (y < 0) { y = -y; par ^= 1; moved = true; }
      if (sp * x - cp * y < 0) { const nx = c2 * x + s2 * y, ny = s2 * x - c2 * y; x = nx; y = ny; par ^= 1; moved = true; }
      const dx = x - G.c, d2 = dx * dx + y * y;
      if (d2 < rr) { const f = rr / d2; x = G.c + dx * f; y *= f; par ^= 1; moved = true; }
      if (!moved) break;
    }
    return { x, y, par, k };
  }
  // polygon area by integration from the centre: p wedges bounded by the edge circles
  function tileAreaByIntegration(G, n = 4000) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, th = -PI / G.p + 2 * PI / G.p * (u - Math.sin(2 * PI * u) / (2 * PI)), ce = G.c * Math.cos(th);
      const R = ce - Math.sqrt(Math.max(0, ce * ce - 1));
      s += 2 * R * R / (1 - R * R) * (1 - Math.cos(2 * PI * u));
    }
    return G.p * s * (2 * PI / G.p) / n;
  }
  (window.LabModels = window.LabModels || {})['hyperbolic-geometry'] = { add, sub, mul, div, abs, toOrigin, fromOrigin, dist, distFormula, along, segment, idealEnds, dirAt, angleAt, parallels, lobachevsky, geoCircle, areaByIntegration, tiling, fold, tileAreaByIntegration };

  /* ---------- drawing helpers ---------- */
  const inDisc = (x, y, r = 0.92) => { const n = Math.hypot(x, y); return n > r ? [x * r / n, y * r / n] : [x, y]; };
  function disc(f) {
    f.circle(0, 0, 1, { c: 'c1', fill: true, fo: 0.05, w: 0, layer: 'under' });
    f.circle(0, 0, 1, { c: 'ink', w: 1.6, op: 0.8, layer: 'under' });
  }
  const fullLine = (P, u, n = 160) => chord(P, u, -1, 1, n);
  function angleArc(f, A, u, v, r, o) {
    let a0 = Math.atan2(u[1], u[0]), da = Math.atan2(v[1], v[0]) - a0;
    while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI;
    f.line(L.seq(25, (i) => { const a = a0 + da * i / 24; return [A[0] + r * Math.cos(a), A[1] + r * Math.sin(a)]; }), o);
    const am = a0 + da / 2; return [A[0] + (r + 0.07) * Math.cos(am), A[1] + (r + 0.07) * Math.sin(am)];
  }
  function dragPoint(ctx, f, P, kx, ky, c, label) {
    f.handle(P[0], P[1], { c, label, bounds: [-0.95, 0.95, -0.95, 0.95], onDrag: (x, y) => { const [nx, ny] = inDisc(x, y); ctx.set(kx, nx, true); ctx.set(ky, ny, true); ctx.redraw(); } });
  }

  /* ---------- 1. distance, lines and the many parallels ---------- */
  D['poincare-distance'] = {
    render(ctx, v) {
      const P = inDisc(v.px, v.py), Q = inDisc(v.qx, v.qy), R = inDisc(v.rx, v.ry);
      const same = abs(sub(P, Q)) < 1e-6;
      const Qs = same ? add(P, [0.05, 0]) : Q;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The Poincaré disc. Drag P and Q to set a line, and R to stand off it. Dots mark steps of 0.5 in hyperbolic length.', 'ポアンカレ円板。P と Q をドラッグして直線を決め、R をその外に置いてください。点は双曲的な長さ 0.5 ごとの目盛りです。'));
      const f = L.fig(c1, { x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, axes: false, grid: false, maxH: 470 });
      disc(f);
      const par = parallels(P, Qs, R), u = dirAt(P, Qs);
      // lines through R that never meet PQ: directions strictly between the limiting ones, on the far side
      const a1 = Math.atan2(par.f1[1], par.f1[0]), a2 = Math.atan2(par.f2[1], par.f2[0]);
      let gap = a2 - a1; while (gap > PI) gap -= 2 * PI; while (gap < -PI) gap += 2 * PI;
      const start = a1 + gap, span = (PI - Math.abs(gap)) * Math.sign(gap || 1);
      for (let k = 1; k <= 5; k++) { const a = start + span * k / 6; f.line(fullLine(R, [Math.cos(a), Math.sin(a)]), { c: 'c4', w: 1.7, op: 1 }); }
      f.line(fullLine(R, par.f1), { c: 'c2', w: 2.4 });
      f.line(fullLine(R, par.f2), { c: 'c2', w: 2.4 });
      if (par.d > 1e-6) f.line(segment(R, par.foot), { c: 'ink', w: 1.3, dash: '4 3' });
      f.line(fullLine(P, u), { c: 'c1', w: 2.2, op: 0.55 });
      f.line(segment(P, Qs), { c: 'c1', w: 4 });
      for (let k = -24; k <= 24; k++) { if (!k) continue; const X = along(P, Qs, 0.5 * k); if (abs(X) < 0.995) f.dot(X[0], X[1], { c: 'c1', r: Math.max(1.2, 3.2 * (1 - abs(X) * abs(X)) + 0.8), op: 0.85 }); }
      par.e1 && [par.e1, par.e2].forEach((e) => f.dot(e[0], e[1], { c: 'c1', r: 4, hollow: true }));
      if (par.d > 0.02) { const lab = angleArc(f, R, par.m, par.f1, 0.13, { c: 'c2', w: 1.6, layer: 'over' }); const lm = sub(lab, R), ll = abs(lm) || 1; f.text(R[0] + lm[0] / ll * 0.24, R[1] + lm[1] / ll * 0.24, 'Π', { math: true, small: true, c: 'c2', dy: 4 }); }
      dragPoint(ctx, f, P, 'px', 'py', 'c1', T('Point P', '点 P'));
      dragPoint(ctx, f, Q, 'qx', 'qy', 'c1', T('Point Q', '点 Q'));
      dragPoint(ctx, f, R, 'rx', 'ry', 'hl', T('Point R off the line', '直線外の点 R'));
      f.text(P[0], P[1], 'P', { math: true, dx: -14, dy: -12 });
      f.text(Q[0], Q[1], 'Q', { math: true, dx: 14, dy: -12 });
      // put the R label on the side away from the line, clear of the dot, the arc and the Π label
      const away = par.d > 1e-6 ? sub(R, par.foot) : [0, 1], al = abs(away) || 1;
      f.text(R[0] + away[0] / al * 0.09, R[1] + away[1] / al * 0.09, 'R', { math: true, dy: 5 });
      // right: angle of parallelism against distance
      L.h('p', 'lab-cap', c2, T('Angle of parallelism Π against the distance d from R to the line', '平行角 Π と、R から直線までの距離 d'));
      const g = L.fig(c2, { x: [0, 4], y: [0, 100], aspect: 0.8, maxH: 360, xlabel: T('distance d', '距離 d'), ticksY: [[0, '0°'], [30, '30°'], [60, '60°'], [90, '90°']], ticksX: [0, 1, 2, 3, 4].map((k) => [k, String(k)]) });
      g.hline(90, { c: 'muted', dash: '4 4' });
      g.text(3.95, 90, T('Euclid: always 90°', 'ユークリッド：常に 90°'), { anchor: 'end', small: true, c: 'muted', dy: -8 });
      g.line(L.sample(0, 4, 200, (d) => lobachevsky(d) * DEG), { c: 'c2', w: 2.6 });
      const dd = Math.min(par.d, 4);
      g.vline(dd, { c: 'hl', w: 1.2, dash: '3 3' });
      g.dot(dd, par.phi * DEG, { c: 'hl', r: 6.5 });
      g.text(2.1, lobachevsky(2.1) * DEG + 16, 'Π(d) = 2 arctan e⁻ᵈ', { anchor: 'start', small: true, c: 'c2' });
      g.hover((x) => (x < 0 || x > 4 ? null : { x, y: lobachevsky(x) * DEG, text: `d = ${fmt(x, 2)}  Π = ${fmt(lobachevsky(x) * DEG, 1)}°` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('the line PQ, with its ideal end points', '直線 PQ と、その理想端点') }, { c: 'c2', label: T('the two limiting parallels through R', 'R を通る二本の極限平行線') }, { c: 'c4', label: T('more lines through R that never meet PQ', 'R を通り PQ と交わらない他の直線') }, { c: 'ink', dash: true, label: T('the perpendicular from R', 'R からの垂線') }]);
      const dh = dist(P, Qs), de = abs(sub(P, Qs));
      ctx.readout([{ k: T('hyperbolic d(P, Q)', '双曲距離 d(P, Q)'), v: fmt(dh, 3), tone: 'key' }, { k: T('Euclidean |P − Q|', 'ユークリッド距離 |P − Q|'), v: fmt(de, 3) }, { k: T('ratio', '比'), v: fmt(dh / de, 2) }, { k: T('d(R, line)', 'd(R, 直線)'), v: fmt(par.d, 3) }, { k: T('Π measured', 'Π の実測'), v: `${fmt(par.phi * DEG, 2)}°` }, { k: '2 arctan e⁻ᵈ', v: `${fmt(lobachevsky(par.d) * DEG, 2)}°`, tone: 'good' }],
        par.d < 0.02 ? T('R is on the line, so there is nothing to be parallel to.', 'R が直線上にあるので、平行線を考える対象がありません。') : T('Every line through R that leaves between the two orange lines, on the side away from PQ, misses PQ entirely. Move R away from the line: Π shrinks and the fan of non-meeting lines opens.', '橙の二本の間を PQ と反対側へ出ていく R を通る直線は、どれも PQ と交わりません。R を直線から遠ざけると Π が小さくなり、交わらない直線の扇が開きます。'));
    },
  };

  /* ---------- 2. triangles: angle sum = pi - area ---------- */
  // the hyperboloid model: the disc point z lifts to (2z, 1 + |z|^2)/(1 - |z|^2); geodesic triangles are flat in the Klein model k = 2z/(1 + |z|^2)
  const lift = (z) => { const q = 1 - z[0] * z[0] - z[1] * z[1]; return [2 * z[0] / q, 2 * z[1] / q, (2 - q) / q]; };
  const toKlein = (z) => { const q = 1 + z[0] * z[0] + z[1] * z[1]; return [2 * z[0] / q, 2 * z[1] / q]; };
  const fromKlein = (k) => { const s2 = Math.sqrt(Math.max(0, 1 - k[0] * k[0] - k[1] * k[1])); return [k[0] / (1 + s2), k[1] / (1 + s2)]; };
  const kleinLift = (k) => { const s2 = Math.sqrt(Math.max(1e-12, 1 - k[0] * k[0] - k[1] * k[1])); return [k[0] / s2, k[1] / s2, 1 / s2]; };
  D['hyperbolic-triangle'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop(); st.anim = null;
      const V = [inDisc(v.ax, v.ay), inDisc(v.bx, v.by), inDisc(v.cx, v.cy)];
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.discHost = L.h('div', '', st.c1);
        st.cap3 = L.h('p', 'lab-cap', st.c2, T('The same triangle on the hyperboloid t² − x² − y² = 1. Projecting from (0, 0, −1) onto the plane t = 0 gives the disc; each side is where the sheet meets a plane through the origin. Drag to turn.', '同じ三角形を双曲面 t² − x² − y² = 1 の上に描いたものです。(0, 0, −1) から平面 t = 0 へ射影すると円板になり、各辺は原点を通る平面と双曲面の交わりです。ドラッグで回転できます。'));
        st.v3 = L.h('div', '', st.c2);
        st.barHost = L.h('div', '', st.frame);
        st.animHost = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
      }
      // without WebGL the angle bars take the 3D view's place beside the disc
      const goFlat = () => { st.flat = true; st.draw3d = null; st.c2.replaceChildren(st.barHost); };
      if (!st.flat && (/[?&]flat\b/.test(location.search) || st.__v3fallback)) goFlat();
      st.discHost.replaceChildren(); st.barHost.replaceChildren(); st.animHost.replaceChildren(); st.leg.replaceChildren();
      L.h('p', 'lab-cap', st.discHost, T('Drag the three vertices. The sides are geodesics; the dashed triangle joins the same points with straight chords.', '三つの頂点をドラッグしてください。辺は測地線です。点線の三角形は同じ点を直線の弦で結んだものです。'));
      const f = L.fig(st.discHost, { x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, axes: false, grid: false, maxH: 470 });
      disc(f);
      [['ax', 'ay'], ['bx', 'by'], ['cx', 'cy']].forEach(([kx, ky], i) => dragPoint(ctx, f, V[i], kx, ky, 'ink', T(`Vertex ${'ABC'[i]}`, `頂点 ${'ABC'[i]}`)));
      L.h('p', 'lab-cap', st.barHost, T('The three angles laid end to end against a straight angle π', '三つの角を並べて、平角 π と比べたもの'));
      const g = L.fig(st.barHost, { x: [0, PI], y: [0, 2.35], aspect: st.flat ? 0.6 : 0.32, maxH: st.flat ? 270 : 210, grid: false, ticksY: [], ticksX: [[0, '0'], [PI / 4, 'π/4'], [PI / 2, 'π/2'], [3 * PI / 4, '3π/4'], [PI, 'π']] });
      const cols = ['c1', 'c3', 'c4'];
      // the scene scale: the sheet is drawn up to a height that holds the triangle, and everything is shrunk to fit the frame
      const tMax = Math.max(3.2, 1.12 * Math.max(...V.map((z) => lift(z)[2])));
      st.k3 = 3.2 / tMax; st.tMax = tMax;
      const draw = (k) => {
        f.clear('main'); f.clear('over'); g.clear('main'); g.clear('over');
        const W = V.map((z) => { const r = abs(z); return r < 1e-9 ? z : scale(z, Math.tanh(k * Math.atanh(r)) / r); });
        const sides = [segment(W[0], W[1]), segment(W[1], W[2]), segment(W[2], W[0])];
        f.poly([...sides[0], ...sides[1], ...sides[2]], { c: 'hl', fo: 0.28, w: 0 });
        sides.forEach((sd) => f.line(sd, { c: 'ink', w: 2.6 }));
        f.poly(W, { c: 'muted', fill: false, fo: 0, w: 1.2, dash: '4 3', op: 0.8 });
        const ang = W.map((z, i) => angleAt(z, W[(i + 1) % 3], W[(i + 2) % 3]));
        W.forEach((z, i) => {
          const r = 0.1 + 0.12 * (1 - abs(z) * abs(z)), u1 = dirAt(z, W[(i + 1) % 3]), u2 = dirAt(z, W[(i + 2) % 3]);
          let a0 = Math.atan2(u1[1], u1[0]), da = Math.atan2(u2[1], u2[0]) - a0; while (da > PI) da -= 2 * PI; while (da < -PI) da += 2 * PI;
          f.poly([z, ...L.seq(25, (m) => { const a = a0 + da * m / 24; return [z[0] + r * Math.cos(a), z[1] + r * Math.sin(a)]; })], { c: cols[i], fo: 0.55, w: 1.2, layer: 'over' });
          const out = scale(unit(z.map((x, j) => x - (W[0][j] + W[1][j] + W[2][j]) / 3)), 0.09);
          f.text(z[0] + out[0], z[1] + out[1], 'ABC'[i], { math: true, dy: 5 });
        });
        const sum = ang[0] + ang[1] + ang[2], defect = PI - sum;
        let x = 0; ang.forEach((a, i) => { g.rect(x, 0.25, a, 0.6, { c: cols[i], fo: 0.8, w: 0.8 }); if (a > 0.22) g.text(x + a / 2, 0.55, 'αβγ'[i], { math: true, c: 'plate', dy: 5 }).style.stroke = 'none'; x += a; });
        g.rect(x, 0.25, Math.max(0, defect), 0.6, { c: 'hl', fo: 0.45, w: 1.2, dash: '3 2' });
        if (defect > 0.5) g.text(x + defect / 2, 0.55, T('area', '面積'), { small: true, dy: 4 }).style.stroke = 'none';
        g.rect(0, 1.35, PI, 0.6, { c: 'muted', fo: 0.3, w: 0.8 });
        g.text(0, 2.1, T('any flat triangle: α + β + γ = π', '平面の三角形：α + β + γ = π'), { small: true, anchor: 'start', dy: 4 });
        g.text(0, 1.1, T('this hyperbolic triangle', 'この双曲三角形'), { small: true, anchor: 'start', dy: 4 });
        st.draw3d?.(W);
        const areaInt = areaByIntegration(W[0], W[1], W[2]);
        const H = W.map(lift), mink = (a, b) => a[2] * b[2] - a[0] * b[0] - a[1] * b[1];
        ctx.readout([{ k: 'α + β + γ', v: `${fmt(sum * DEG, 2)}°`, tone: 'key' }, { k: T('defect π − (α + β + γ)', '欠損 π − (α + β + γ)'), v: fmt(defect, 4) }, { k: T('area by integration', '積分で求めた面積'), v: fmt(areaInt, 4), tone: Math.abs(areaInt - defect) < 1e-3 ? 'good' : 'warn' }, { k: T('sides a, b, c from cosh d = t₁t₂ − x₁x₂ − y₁y₂', '辺 a, b, c（cosh d = t₁t₂ − x₁x₂ − y₁y₂ から）'), v: [[1, 2], [2, 0], [0, 1]].map(([i, j]) => fmt(Math.acosh(Math.max(1, mink(H[i], H[j]))), 3)).join(', ') }, { k: T('largest possible area', '面積の上限'), v: 'π' }],
          k < 0.999 ? T('Growing from a tiny triangle: while it is small it is almost Euclidean and the angles fill the whole bar.', '小さな三角形から成長させています。小さいうちはほぼユークリッド的で、角が帯全体を埋めます。') : sum < 0.3 ? T('With the vertices near the rim the angles all but vanish and the area approaches π, the area of an ideal triangle.', '頂点が縁に近いと角はほとんど消え、面積は理想三角形の面積 π に近づきます。') : T('The shortfall of the angle sum is exactly the area: two independent computations, one from angles and one from integrating the metric, agree.', '角の和の不足分はちょうど面積に等しくなります。角から求めた値と、計量を積分して求めた値という独立な二つの計算が一致します。'));
      };
      st.draw = draw;
      const legend = () => { st.leg.replaceChildren(); L.legend(st.leg, [{ kind: 'fill', c: 'hl', label: T('geodesic triangle', '測地三角形') }, { c: 'muted', dash: true, label: T('straight chords (not geodesics)', '直線の弦（測地線ではない）') }, { c: 'c1', label: 'α' }, { c: 'c3', label: 'β' }, { c: 'c4', label: 'γ' }].concat(st.flat ? [] : [{ c: 'muted', label: T('projection lines through (0, 0, −1)', '(0, 0, −1) を通る射影線') }])); };
      legend();
      L.view3d(ctx, v, {
        host: st.v3, aspect: 1.0, maxH: 470, camera: [7.7, -10.0, 4.3], target: [0, 0, 1.2], fov: 30,
        init(S) {
          st.flat = false;
          st.sheet = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 2 * PI], nu: 40, nv: 96, c: 'c1', opacity: 0.26, rough: 0.5, coat: 0.5, wire: true, wireEvery: 5, wireEveryV: 8, wireOpacity: S.dark ? 0.28 : 0.2 });
          st.discM = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 2 * PI], nu: 2, nv: 96, c: 'c1', opacity: 0.16, rough: 0.8 });
          st.rim = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'ink', r: 0.012, closed: true, opacity: 0.7 });
          st.patch = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 28, nv: 28, c: 'hl', rough: 0.75, coat: 0.05, glow: S.dark ? 0.12 : 0 });
          st.patchD = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 24, nv: 24, c: 'hl', rough: 0.8, coat: 0 });
          st.sides = L.seq(3, () => S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'ink', r: 0.022 }));
          st.sidesD = L.seq(3, () => S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'ink', r: 0.012 }));
          st.rays = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'muted', opacity: S.dark ? 0.75 : 0.65 });
          st.south = S.sphere([0, 0, 0], 0.05, { c: 'ink' });
          st.vtx = L.seq(3, () => S.sphere([0, 0, 0], 0.07, { c: 'ink' }));
          st.vtxD = L.seq(3, () => S.sphere([0, 0, 0], 0.035, { c: 'ink' }));
          st.lab = L.seq(3, (i) => S.label('ABC'[i], [0, 0, 0], { math: true }));
          st.lSouth = S.label('(0, 0, −1)', [0, 0, 0], { small: true, c: 'muted' });
          st.lSheet = S.label('t² − x² − y² = 1', [0, 0, 0], { small: true, c: 'muted', align: 'end' });
          st.lDisc = S.label(T('Poincaré disc, t = 0', 'ポアンカレ円板、t = 0'), [0, 0, 0], { small: true, c: 'muted', align: 'end' });
          st.sheetT = null;
          st.draw3d = (W) => {
            const k3 = st.k3, sc = (p) => [p[0] * k3, p[1] * k3, p[2] * k3];
            if (st.sheetT !== st.tMax) {
              st.sheetT = st.tMax;
              const rho = Math.sqrt((st.tMax - 1) / (st.tMax + 1));
              st.sheet.update((u, w) => sc(lift([rho * u * Math.cos(w), rho * u * Math.sin(w)])));
              st.discM.update((u, w) => [k3 * u * Math.cos(w), k3 * u * Math.sin(w), 0]);
              st.rim.update(L.seq(96, (i) => [k3 * Math.cos(2 * PI * i / 96), k3 * Math.sin(2 * PI * i / 96), 0]));
              st.south.at([0, 0, -k3]); st.lSouth.set([0.05, 0, -k3]);
              const top = lift([rho * Math.cos(-0.15), rho * Math.sin(-0.15)]);
              st.lSheet.set(sc(top)); st.lDisc.set([-k3 * 1.02, -k3 * 0.2, 0]);
            }
            const Kv = W.map(toKlein), bary = (u, w) => { const a = 1 - u, b = u * (1 - w), c = u * w; return [a * Kv[0][0] + b * Kv[1][0] + c * Kv[2][0], a * Kv[0][1] + b * Kv[1][1] + c * Kv[2][1]]; };
            st.patch.update((u, w) => sc(kleinLift(bary(u, w))));
            st.patchD.update((u, w) => { const z = fromKlein(bary(u, w)); return [k3 * z[0], k3 * z[1], 0.004]; });
            [[0, 1], [1, 2], [2, 0]].forEach(([i, j], m) => {
              const seg = L.seq(41, (n2) => { const t = n2 / 40; return [Kv[i][0] + (Kv[j][0] - Kv[i][0]) * t, Kv[i][1] + (Kv[j][1] - Kv[i][1]) * t]; });
              st.sides[m].update(seg.map((kk) => sc(kleinLift(kk))));
              st.sidesD[m].update(seg.map((kk) => { const z = fromKlein(kk); return [k3 * z[0], k3 * z[1], 0.006]; }));
            });
            const Hs = W.map((z) => sc(lift(z)));
            st.rays.update(W.map((z, i) => [[0, 0, -k3], Hs[i]]));
            W.forEach((z, i) => { st.vtx[i].at(Hs[i]); st.vtxD[i].at([k3 * z[0], k3 * z[1], 0]); st.lab[i].set([Hs[i][0], Hs[i][1], Hs[i][2] + 0.12]); });
            S.invalidate();
          };
        },
        update() { st.draw(st.anim ? Math.min(1, 0.04 + (st.anim.t ?? 3) / 3) : 1); },
        fallback() { if (!st.flat) { goFlat(); setTimeout(() => ctx.redraw(), 0); } },
      });
      st.anim = L.animator(st.animHost, (dt, t) => { const k = Math.min(1, 0.04 + t / 3); draw(k); if (k >= 1) return false; }, { autoplay: false, once: true, initialT: 3, playLabel: T('Grow the triangle from a point', '点から三角形を成長させる') });
    },
  };

  /* ---------- 3. regular tilings {p, q} and moving them by an isometry ---------- */
  D['hyperbolic-tiling'] = {
    render(ctx, v) {
      const p = Math.round(v.p), q = Math.round(v.q), a = inDisc(v.ax, v.ay, 0.9);
      const G = tiling(p, q);
      L.h('p', 'lab-cap', ctx.host, T('Every tile is the same regular polygon, and q of them meet at every corner. Drag the gold centre: the whole tiling moves by an isometry of the disc and every tile stays congruent.', 'どのタイルも同じ正多角形で、各頂点に q 枚が集まります。金色の中心をドラッグすると、タイリング全体が円板の等長変換で動き、どのタイルも合同なままです。'));
      const f = L.fig(ctx.host, { x: [-1.04, 1.04], y: [-1.04, 1.04], equal: true, axes: false, grid: false, maxH: 540 });
      const col = L.colours(), mix = (x, y, t) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t);
      if (!G.hyper) {
        disc(f);
        f.text(0, 0.08, G.flat ? T(`{${p}, ${q}} tiles the flat plane`, `{${p}, ${q}} は平面を敷き詰めます`) : T(`{${p}, ${q}} tiles the sphere`, `{${p}, ${q}} は球面を敷き詰めます`), { c: 'ink' });
        f.text(0, -0.08, T('the disc needs 1/p + 1/q < 1/2', '円板には 1/p + 1/q < 1/2 が必要です'), { small: true, c: 'muted' });
        ctx.readout([{ k: '1/p + 1/q', v: fmt(1 / p + 1 / q, 3), tone: 'warn' }, { k: T('needed', '必要な条件'), v: '< 0.5' }], T('Raise p or q. At exactly 1/2 the polygons fit the Euclidean plane; above it they close up into a polyhedron.', 'p か q を大きくしてください。ちょうど 1/2 ならユークリッド平面に収まり、それより大きいと多面体として閉じます。'));
        return;
      }
      const res = 2, px = 2.08 / Math.abs(f.X(1.04) - f.X(-1.04)) * res;
      const tA = mix(col.plate, col.c1, 0.12), tB = mix(col.plate, col.c1, 0.4), edge = mix(col.plate, col.ink, 0.88), mid = mix(tA, tB, 0.5), mirror = mix(col.plate, col.c1, 0.62);
      const cp = Math.cos(PI / p), sp = Math.sin(PI / p);
      f.raster((x, y) => {
        const r2 = x * x + y * y;
        if (r2 >= 1) return col.plate;
        const z = toOrigin(a, [x, y]), F = fold(z, G), fr = 1 - F.x * F.x - F.y * F.y;
        const ph = px * 2 / (1 - r2), sc = 2 / fr;
        const eh = (Math.hypot(F.x - G.c, F.y) - G.rho) * sc, mh = Math.min(F.y, Math.abs(sp * F.x - cp * F.y)) * sc;
        let c = F.par ? tA : tB;
        const lw = Math.max(0.012, 0.45 * ph);
        c = mix(c, mirror, 0.35 * L.clamp(1 - mh / Math.max(ph, 1e-3), 0, 1));
        c = mix(c, edge, L.clamp(1 - (eh - lw) / Math.max(ph, 1e-3), 0, 1));
        return mix(c, mid, L.clamp((ph - 0.15) / 0.6, 0, 1));
      }, { res });
      f.circle(0, 0, 1, { c: 'ink', w: 1.6, op: 0.8 });
      // outline of the tile that started at the centre, carried by the isometry z -> (z + a)/(1 + conj(a) z)
      const verts = L.seq(p, (k) => fromOrigin(a, [G.rv * Math.cos((2 * k + 1) * PI / p), G.rv * Math.sin((2 * k + 1) * PI / p)]));
      f.poly(verts.flatMap((z, k) => segment(z, verts[(k + 1) % p], 40)), { c: 'hl', fill: false, fo: 0, w: 3 });
      f.handle(a[0], a[1], { c: 'hl', label: T('Centre of the highlighted tile', '強調したタイルの中心'), bounds: [-0.9, 0.9, -0.9, 0.9], onDrag: (x, y) => { const [nx, ny] = inDisc(x, y, 0.9); ctx.set('ax', nx, true); ctx.set('ay', ny, true); ctx.redraw(); } });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('the two tones: mirror images of one triangle', '二つの濃淡：一つの三角形の鏡像') }, { c: 'hl', label: T('the tile that started at the centre', '中心にあったタイル') }]);
      const eu = (p - 2) * 180 / p;
      ctx.readout([{ k: T('corner angle 2π/q', '頂点の角 2π/q'), v: `${fmt(360 / q, 1)}°`, tone: 'key' }, { k: T('flat regular polygon', '平面の正多角形'), v: `${fmt(eu, 1)}°` }, { k: T('tile area (p − 2)π − 2πp/q', 'タイルの面積 (p − 2)π − 2πp/q'), v: fmt(G.area, 4) }, { k: T('centre to corner', '中心から頂点まで'), v: fmt(2 * Math.atanh(G.rv), 3) }, { k: T('shift d(0, a)', '移動量 d(0, a)'), v: fmt(dist([0, 0], a), 3) }],
        T(`A flat regular ${p}-gon has ${fmt(eu, 1)}° corners, too wide for ${q} to fit round a point. In the hyperbolic plane a larger polygon has smaller angles, so it can be grown until its corners are exactly 360°/${q}. Tiles near the rim look tiny only because the picture shrinks distances there.`, `平面の正 ${p} 角形の角は ${fmt(eu, 1)}° で、${q} 枚を一点のまわりに収めるには広すぎます。双曲平面では多角形を大きくするほど角が小さくなるので、角がちょうど 360°/${q} になるまで大きくできます。縁の近くのタイルが小さく見えるのは、この図がそこで距離を縮めて描いているからにすぎません。`));
    },
  };
})();
