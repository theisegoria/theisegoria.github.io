// Projective geometry: parallel lines meet at Z = 0 in their common direction, the meet of two lines lies on both and
// matches the affine solution; a traveller on a line stays on it through infinity; the cross-ratio is the same on the
// line, on any screen and from the sines at the centre, harmonic position stays -1, a perspectivity has its pole and
// asymptote where the geometry says and permutations give the six classical values; the plane section of the cone
// satisfies the cone and plane equations and the closed-form conic (eccentricity sqrt2 sin tau, semi-axes 1/cos 2tau,
// 1/sqrt(cos 2tau), parabola at 45 degrees, infinity counts 0/1/2); Pascal's line exists for every order on the circle
// and on every section, fails when a point leaves the conic, is the line at infinity for a regular hexagon and is
// carried to the section by the central projection.
module.exports = (M, { ok, near }) => {
  const r = (d) => d * Math.PI / 180;
  // 1. lines in the chart
  { const g = M.twoLines([0, 0], [1, 1], [0, 2], 0); ok(g.ideal, 'parallel lines meet at infinity'); near(Math.abs(g.P[0]), Math.SQRT1_2, 1e-9); near(g.P[0], g.P[1], 1e-9); near(g.P[2], 0, 1e-12); }
  { const g = M.twoLines([0, 0], [1, 1], [0, 2], Math.atan(2) - Math.PI / 4); ok(!g.ideal, 'finite'); near(g.chartP[0], -2, 1e-9); near(g.chartP[1], -2, 1e-9); }
  for (const [A, B, C, rel] of [[[-1.7, -0.9], [1.5, 0.2], [-0.6, 1.8], r(35)], [[0.2, 1], [-2, 0.4], [1, -1], r(-62)], [[1, 1], [2, 3], [-1, 0.5], r(80)]]) {
    const g = M.twoLines(A, B, C, rel);
    near(M.dot3(g.l1, g.P), 0, 1e-9); near(M.dot3(g.l2, g.P), 0, 1e-9);
    // solve the 2x2 system directly
    const n1 = [g.l1[0], g.l1[1]], n2 = [g.l2[0], g.l2[1]], d = n1[0] * n2[1] - n1[1] * n2[0];
    near(g.chartP[0], (-g.l1[2] * n2[1] + g.l2[2] * n1[1]) / d, 1e-8); near(g.chartP[1], (-g.l2[2] * n1[0] + g.l1[2] * n2[0]) / d, 1e-8);
  }
  // 2. the traveller stays on the line through infinity and reaches Z = 0 at psi = pi/2
  { const g = M.twoLines([-1.7, -0.9], [1.5, 0.2], [-0.6, 1.8], r(35)); for (const psi of [0.1, 0.8, Math.PI / 2, 2.2, 3.0]) near(M.dot3(g.l1, M.traveller(g, psi).h), 0, 1e-9); near(M.traveller(g, Math.PI / 2).h[2], 0, 1e-12);
    const a = M.traveller(g, 0.3).h, b = M.traveller(g, 0.3 + Math.PI).h; near(a[0], -b[0], 1e-12); near(a[2], -b[2], 1e-12); }
  // 3. cross-ratio from positions, from the second line, from the rays
  for (const [O, E, phi, xs] of [[[0.7, 5.3], [0.4, 2.7], r(14), [-3.3, -1.5, 0.4, 2.8]], [[-1.2, 4], [1, 1.5], r(-40), [-2, -0.5, 1, 3.5]], [[2, 3.5], [0, 2], r(55), [-3, -1, 0.7, 2.2]]]) {
    const c1 = M.cr(...xs), img = xs.map((x) => M.perspect(O, E, phi, x)), c2 = M.cr(...img.map((q) => q.t)), c3 = M.crPencil(O, ...xs.map((x) => [x, 0]));
    near(c2, c1, 1e-9); near(c3, c1, 1e-9);
    near(M.crPencil(O, ...img.map((q) => q.X)), c1, 1e-9);                                 // the rays meet the screen, so the same pencil
  }
  { const xs = [0, 1, 3, 6]; near(M.cr(...xs), 1.25, 1e-12); }
  // 4. harmonic position
  { const d = M.harmonicD(0, 1, 3); near(d, 0.6, 1e-12); near(M.cr(0, 1, 3, d), -1, 1e-12); const O = [0.3, 4], E = [1, 2], phi = r(25); near(M.cr(...[0, 1, 3, d].map((x) => M.perspect(O, E, phi, x).t)), -1, 1e-9); ok(M.harmonicD(0, 2, 1) === Infinity, 'midpoint has its harmonic conjugate at infinity'); }
  // 5. the perspectivity is a Moebius map: pole where the ray is parallel to the screen, asymptote at the image of infinity
  { const O = [0.7, 5.3], E = [0.4, 2.7], phi = r(14), v = M.vanishing(O, phi);
    ok(Math.abs(M.perspect(O, E, phi, v + 1e-9).t) > 1e6, 'pole at the vanishing point');
    const n = [-Math.sin(phi), Math.cos(phi)]; near(n[0] * (v - O[0]) + n[1] * (-O[1]), 0, 1e-12);
    near(M.perspect(O, E, phi, 1e9).t, M.imageOfInfinity(O, E, phi).t, 1e-6); near(M.perspect(O, E, phi, -1e9).t, M.imageOfInfinity(O, E, phi).t, 1e-6); }
  // 6. the six values
  { const a = 0, b = 1, c = 3, d = 7, l = M.cr(a, b, c, d);
    near(M.cr(b, a, c, d), 1 / l, 1e-12); near(M.cr(a, c, b, d), 1 - l, 1e-12); near(M.cr(a, b, d, c), 1 / l, 1e-12); near(M.cr(c, d, a, b), l, 1e-12); }
  // 7. the section of the cone
  for (const tau of [0, 12, 30, 44, 45, 58, 70]) for (const th of [0.3, 1.1, 2.0, 2.9, 4.4, 5.6]) {
    const q = M.sectionPoint(tau, th); if (!q) continue;
    const t = r(tau), X = q.X;
    near(Math.hypot(X[0], X[1]) - Math.abs(X[2]), 0, 1e-9);                                  // on the cone
    near(Math.sin(t) * X[0] + Math.cos(t) * X[2], 1, 1e-9);                                  // on the plane
    near(M.sectionResidual(tau, q.uv), 0, 1e-8);                                             // on the closed-form conic
    const back = M.angleOfPlanePoint(tau, q.uv); near(Math.cos(back), Math.cos(th), 1e-8); near(Math.sin(back), Math.sin(th), 1e-8);
  }
  { // ellipse at 30 degrees: semi-axes 2 and sqrt2, e = sqrt2 sin 30
    let u0 = 1e9, u1 = -1e9, v1 = 0;
    for (let i = 0; i < 20000; i++) { const q = M.sectionPoint(30, 2 * Math.PI * i / 20000); u0 = Math.min(u0, q.uv[0]); u1 = Math.max(u1, q.uv[0]); v1 = Math.max(v1, Math.abs(q.uv[1])); }
    const a = (u1 - u0) / 2; near(a, 2, 1e-3); near(v1, Math.SQRT2, 1e-3); near((u1 + u0) / 2, -Math.tan(r(60)), 1e-3);
    near(Math.sqrt(1 - v1 * v1 / (a * a)), M.ecc(30), 1e-3); near(M.ecc(30), Math.SQRT1_2, 1e-12); }
  { // parabola at 45: v^2 + 2u = 0, one point at infinity; circle at 0
    const q = M.sectionPoint(45, 1.3); near(q.uv[1] * q.uv[1] + 2 * q.uv[0], 0, 1e-9); near(M.ecc(45), 1, 1e-12); near(M.ecc(0), 0, 1e-12);
    ok(M.kindOf(0) === 0 && M.kindOf(20) === 1 && M.kindOf(45) === 2 && M.kindOf(60) === 3, 'kinds');
    ok(M.sectionPoint(45, Math.PI) === null, 'the tangent generator never meets the plane'); }
  ok(M.atInfinity(0) === 0 && M.atInfinity(30) === 0 && M.atInfinity(45) === 1 && M.atInfinity(60) === 2, 'points at infinity');
  { for (const tau of [10, 40, 50, 65]) { let roots = 0; const N = 100000; let prev = Math.sin(r(tau)) * 1 + Math.cos(r(tau)); for (let i = 1; i <= N; i++) { const cur = Math.sin(r(tau)) * Math.cos(2 * Math.PI * i / N) + Math.cos(r(tau)); if (cur * prev < 0) roots++; prev = cur; } near(roots, M.atInfinity(tau), 0.5); } }
  // 8. Pascal
  const angles = [24, 78, 140, 205, 262, 318].map(r);
  for (const ord of M.ORDERS) {
    const circle = angles.map((a) => [Math.cos(a), Math.sin(a)]);
    near(M.pascal(circle, ord).defect, 0, 1e-12);
    for (const tau of [0, 28, 44, 57, 66]) { const uv = angles.map((a) => M.sectionPoint(tau, a).uv); near(M.pascal(uv, ord).defect, 0, 1e-9); }
  }
  { const circle = angles.map((a) => [Math.cos(a), Math.sin(a)]); circle[3] = [circle[3][0] * 1.08, circle[3][1] * 1.08]; ok(M.pascal(circle).defect > 1e-3, 'a point off the conic breaks Pascal'); }
  { const reg = [0, 60, 120, 180, 240, 300].map((d) => [Math.cos(r(d)), Math.sin(r(d))]); const P = M.pascal(reg); for (const q of P.Q) ok(M.isIdeal(q), 'a regular hexagon has parallel opposite sides'); near(Math.abs(P.line[2]), 1, 1e-9); near(P.line[0], 0, 1e-9); near(P.line[1], 0, 1e-9); }
  { // the central projection carries the Pascal line of the circle onto that of the section
    const tau = 28, t = r(tau), s = Math.sin(t), c = Math.cos(t), circle = angles.map((a) => [Math.cos(a), Math.sin(a)]);
    const Pc = M.pascal(circle), Ps = M.pascal(angles.map((a) => M.sectionPoint(tau, a).uv));
    Pc.Q.forEach((Qc, k) => { const q = M.chart(Qc), kk = 1 / (s * q[0] + c), X = [kk * q[0], kk * q[1], kk], uv = [(X[0] - s) * c - (X[2] - c) * s, X[1]], w = M.chart(Ps.Q[k]); near(uv[0], w[0], 1e-8); near(uv[1], w[1], 1e-8); }); }
  { const f = M.lineBox([0, 1, -1], -2, 2, -2, 2); near(f[0][1], 1, 1e-12); near(f[1][1], 1, 1e-12); }
};
