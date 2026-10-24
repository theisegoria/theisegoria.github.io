// Riemann surfaces: continuation of roots and log round loops (sign flip, cube root of unity, +2 pi i k, nothing when 0
// is outside); hyperelliptic monodromy is the parity of enclosed branch points and the genus formula matches
// Riemann-Hurwitz; stereographic projection inverts, rotations conjugate flows without changing tr^2 or the type,
// flows fix their fixed points and the time-1 map composes.
module.exports = (M, { ok, near }) => {
  { const p = M.continueLoop(0, [0.4, 0], 0.9, 1), a = p[0].w, b = p[p.length - 1].w; near(b[0], -a[0], 1e-9); near(b[1], -a[1], 1e-9); }
  { const p = M.continueLoop(1, [0.4, 0], 0.9, 1), a = p[0].w, b = p[p.length - 1].w, rot = M.cmul(a, [Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3)]); near(b[0], rot[0], 1e-9); near(b[1], rot[1], 1e-9); }
  { const p = M.continueLoop(2, [0.4, 0], 0.9, 2); near(p[p.length - 1].w[1] - p[0].w[1], 4 * Math.PI, 1e-9); }
  { const p = M.continueLoop(0, [1.5, 0.2], 0.9, 3); near(p[p.length - 1].w[0], p[0].w[0], 1e-9); ok(M.winding([1.5, 0.2], 0.9, 3) === 0 && M.winding([0.4, 0], 0.9, 2) === 2, 'winding numbers'); }
  // hyperelliptic monodromy = parity of enclosed branch points
  const pts = [[-1.2, 0.1], [-0.3, -0.4], [0.5, 0.3], [1.3, -0.2]];
  for (const [c, R] of [[[0.5, 0.3], 0.3], [[0.1, -0.05], 0.75], [[0, 0], 1.9], [[-1.2, 0.1], 0.2], [[2, 2], 0.5]]) {
    const path = Array.from({ length: 721 }, (_, i) => [c[0] + R * Math.cos(2 * Math.PI * i / 720), c[1] + R * Math.sin(2 * Math.PI * i / 720)]);
    const ws = M.continueSqrt(pts, path), k = M.enclosed(pts, c, R), a = ws[0], b = ws[ws.length - 1];
    near(b[0], (k % 2 ? -1 : 1) * a[0], 1e-6); near(b[1], (k % 2 ? -1 : 1) * a[1], 1e-6);
  }
  for (let n = 1; n <= 8; n++) { const B = M.branchCount(n); ok(B % 2 === 0, 'branch count is even'); near(M.genusHyper(n), (B - 2) / 2, 1e-12); near(M.genusHyper(n), M.genusSuper(2, n % 2 ? n : n - 1), 1e-12); }
  near(M.genusSuper(3, 4), 3, 1e-12);                                  // smooth plane quartic-type superelliptic curve
  // stereographic projection
  for (const z of [[0.6, 0.35], [-2, 1], [0.01, -0.02], [5, -3]]) { const P = M.unstereo(z); near(Math.hypot(...P), 1, 1e-12); const q = M.stereo(P); near(q[0], z[0], 1e-9); near(q[1], z[1], 1e-9); }
  { const P = M.unstereo([1, 0]); near(P[2], 0, 1e-15); }               // the unit circle is the equator
  // types and traces
  const types = [0, 1, 2, 3].map((k) => M.classify(M.traceSq(M.mobiusMatrix(k, 0.5)))); ok(types.join() === '0,1,2,3', 'each family has its own type');
  { const tr = M.traceSq(M.mobiusMatrix(1, 0.5)); near(tr[0], Math.E + 2 + 1 / Math.E, 1e-12); const e = M.traceSq(M.mobiusMatrix(0, 0.5)); near(e[0], 2, 1e-12); }
  for (const k of [0, 1, 3]) { const m = M.mobiusMatrix(k, 0.7), det = M.csub(M.cmul(m.a, m.d), M.cmul(m.b, m.c)); near(det[0], 1, 1e-12); near(det[1], 0, 1e-12); }
  // fixed points are fixed, and flows compose: f_s o f_t = f_(s+t)
  for (const k of [0, 1, 2, 3]) for (const tilt of [0, 0.5, 1.2]) {
    for (const F of M.fixedPoints(k, tilt)) { const G = M.flowSphere(k, 0.6, tilt, F, 1); near(Math.hypot(G[0] - F[0], G[1] - F[1], G[2] - F[2]), 0, 1e-9); }
    const P = M.unstereo([0.4, -0.7]), a = M.flowSphere(k, 0.6, tilt, M.flowSphere(k, 0.6, tilt, P, 0.3), 0.45), b = M.flowSphere(k, 0.6, tilt, P, 0.75);
    near(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), 0, 1e-9);
  }
  { const [, top] = M.fixedPoints(1, Math.PI / 6), [bot] = M.fixedPoints(1, Math.PI / 6); const zt = M.stereo(top), zb = M.stereo(bot); near(zb[1], 0.26795, 1e-4); near(zt[1], -3.73205, 1e-4); near(M.cmul(zb, [zt[0], -zt[1]])[0], -1, 1e-9); }
};
