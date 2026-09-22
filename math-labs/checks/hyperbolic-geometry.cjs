// Hyperbolic geometry: disc distance, isometries, the angle of parallelism, Gauss-Bonnet for triangles and tiles.
module.exports = (H, { ok, near }) => {
  const PI = Math.PI;
  const pts = [[-0.5, -0.2], [0.55, -0.3], [0.05, 0.5], [0.8, 0.1], [-0.3, 0.85], [0, 0]];
  // 1. two formulas for the distance agree
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) near(H.dist(pts[i], pts[j]), H.distFormula(pts[i], pts[j]), 1e-9);
  // 2. the Moebius maps of the disc are isometries
  const a = [0.4, -0.35];
  near(H.dist(H.toOrigin(a, pts[0]), H.toOrigin(a, pts[3])), H.dist(pts[0], pts[3]), 1e-12);
  near(H.dist(H.fromOrigin(a, pts[2]), H.fromOrigin(a, pts[4])), H.dist(pts[2], pts[4]), 1e-12);
  // 3. points on the geodesic segment realise the distance: d(P, X) + d(X, Q) = d(P, Q)
  const P = pts[0], Q = pts[1], d = H.dist(P, Q);
  for (const s of [0.3, 1.1, 2.0]) { const X = H.along(P, Q, s); near(H.dist(P, X), s, 1e-12); near(H.dist(P, X) + H.dist(X, Q), d, 1e-12); }
  // 4. angle of parallelism: measured angle = 2 arctan e^{-d}, and d really is the shortest distance to the line
  for (const R of [[0.05, 0.5], [0.3, 0.8], [-0.7, 0.3]]) {
    const pr = H.parallels(P, Q, R);
    near(pr.phi, H.lobachevsky(pr.d), 1e-12);
    let mn = Infinity; for (let s = -12; s <= 12; s += 0.001) mn = Math.min(mn, H.dist(R, H.along(P, Q, s)));
    near(mn, pr.d, 1e-5);
  }
  ok(Math.abs(H.lobachevsky(0) - PI / 2) < 1e-15 && H.lobachevsky(5) < 0.014, 'Pi(0) = 90 degrees and Pi(d) -> 0');
  // 5. Gauss-Bonnet: pi minus the angle sum equals the area found by integrating the metric
  for (const [A, B, C] of [[[-0.6, -0.35], [0.65, -0.3], [0.05, 0.7]], [[0.1, 0.1], [0.3, 0.05], [0.2, 0.3]], [[-0.9, 0.1], [0.5, -0.8], [0.6, 0.75]]]) {
    const defect = PI - H.angleAt(A, B, C) - H.angleAt(B, C, A) - H.angleAt(C, A, B);
    near(H.areaByIntegration(A, B, C), defect, 1e-4);
    near(H.areaByIntegration(B, C, A), defect, 1e-4);
  }
  const r = 0.999, ideal = [0, 2, 4].map((k) => [r * Math.cos(k * PI / 3), r * Math.sin(k * PI / 3)]);
  const idealArea = H.areaByIntegration(ideal[0], ideal[1], ideal[2]);
  near(idealArea, PI - 3 * H.angleAt(ideal[0], ideal[1], ideal[2]), 1e-5);
  ok(PI - idealArea < 0.01, 'near-ideal triangle has area close to pi');
  // 6. tilings {p, q}: vertex on the edge circle, corner half-angle pi/q, and tile area (p-2)pi - 2pi p/q
  for (const [p, q] of [[7, 3], [4, 5], [5, 4], [8, 8]]) {
    const G = H.tiling(p, q), v = G.vertex;
    near(Math.hypot(v[0] - G.c, v[1]), G.rho, 1e-12);
    const t = [-v[1], v[0] - G.c], w = [-v[0], -v[1]];
    near(Math.acos(Math.abs(t[0] * w[0] + t[1] * w[1]) / Math.hypot(...t) / Math.hypot(...w)), PI / q, 1e-9);
    near(H.tileAreaByIntegration(G), G.area, 1e-6);
  }
  ok(H.tiling(4, 4).hyper === false && H.tiling(4, 4).flat === true && H.tiling(3, 5).hyper === false, '{4,4} flat, {3,5} spherical');
  // 7. folding: a point and its mirror image in a tile edge fold to the same place with opposite parity
  const G = H.tiling(7, 3), z = [0.1, 0.03], dz = [z[0] - G.c, z[1]], k = G.rho * G.rho / (dz[0] * dz[0] + dz[1] * dz[1]);
  const img = [G.c + dz[0] * k, dz[1] * k], F0 = H.fold(z, G), F1 = H.fold(img, G);
  near(F0.x, F1.x, 1e-12); near(F0.y, F1.y, 1e-12); ok(F0.par !== F1.par && F0.k === 0, 'mirror images differ in parity');
};
