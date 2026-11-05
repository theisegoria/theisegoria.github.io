// Convex geometry: the l_p balls and their polars (volume formula against a numerical integral, support points against
// brute force, the Mahler product against its known extremes); Minkowski sums of planar bodies (support functions add,
// Steiner's formula, Brunn-Minkowski with its equality cases, Cauchy's formulas for perimeter and area); convex hulls in space
// (Euler's formula, volumes, convexity) and the distance between two polytopes against the best separating direction.
module.exports = (M, { ok, near }) => {
  const PI = Math.PI, TAU = 2 * PI;
  let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  // ---- Gamma and the volume formula
  near(M.gammaFn(5), 24, 1e-9); near(M.gammaFn(0.5), Math.sqrt(PI), 1e-12); near(M.gammaFn(1.5), Math.sqrt(PI) / 2, 1e-12); near(M.gammaFn(1 / 3) * M.gammaFn(2 / 3), PI / Math.sin(PI / 3), 1e-10);
  near(M.volLp(0), 8, 1e-12); near(M.volLp(1), 4 / 3, 1e-12); near(M.volLp(0.5), (4 * PI) / 3, 1e-12);
  const volNum = (e) => {                                            // vol = (1/3) \int r^3 dsigma on the sphere, midpoint rule
    const nu = 360, nv = 180; let t = 0;
    for (let i = 0; i < nv; i++) { const w = ((i + 0.5) * PI) / nv; for (let j = 0; j < nu; j++) { const u = ((j + 0.5) * TAU) / nu, r = M.radialLp(M.dirOf(u, w), e); t += (r ** 3 / 3) * Math.sin(w) * (PI / nv) * (TAU / nu); } }
    return t;
  };
  for (const s of [0.2, 1 / 3, 0.5, 0.65, 0.8]) near(volNum(1 / s) / M.volLp(s), 1, 1.5e-3);
  ok(volNum(Infinity) > 7.99 && volNum(Infinity) < 8.01, 'cube volume by quadrature');
  for (let i = 0; i < 100; i++) ok(M.volLp((i + 1) / 100) < M.volLp(i / 100), 'volume of the l_p ball falls as s rises');
  // ---- polarity: the support function of K_s is the norm of the polar
  for (const s of [0, 0.15, 1 / 3, 0.5, 0.75, 1]) {
    const p = M.expP(s);
    for (let k = 0; k < 6; k++) {
      const y = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1], x = M.supportPoint(y, s), h = M.hK(y, s);
      near(M.normP(x, p), 1, 1e-9);                                    // the contact point is on the boundary of K
      near(x[0] * y[0] + x[1] * y[1] + x[2] * y[2], h, 1e-9);          // and attains the support function
      let best = -Infinity;
      for (let m = 0; m < 600; m++) { const d = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], r = M.radialLp(d, p); best = Math.max(best, r * (d[0] * y[0] + d[1] * y[1] + d[2] * y[2])); }
      ok(best <= h + 1e-9 && best > h * 0.8, 'no boundary point of K beats the support point');
    }
  }
  // points of the polar lie on the plane <x, y> = 1 touching K, and the polar of the polar is K again
  for (const s of [0.1, 0.3, 0.5, 0.8]) for (const [az, pol] of [[0.4, 0.9], [2.2, 1.3], [4.1, 2.4]]) {
    const E = M.polarState(s, az, pol);
    near(E.h, 1, 1e-9); near(E.pair, 1, 1e-9); near(E.nx, 1, 1e-9);
    near(M.hK(E.x, 1 - s), 1, 1e-9);                                   // x* is on the boundary of K, so its own norm in K° is 1
    near(E.dist * E.ny, 1, 1e-12);
  }
  { // p = 3: y proportional to (a^2, b^2, c^2) is carried to x* proportional to (a, b, c)
    const s = 1 / 3, y = [1, 4, 9], n = M.normP(y, 1.5), x = M.supportPoint(y, s), t = Math.cbrt(1 + 8 + 27);
    near(n, Math.pow(1 + 8 + 27, 2 / 3), 1e-9); near(x[0], 1 / t, 1e-9); near(x[1], 2 / t, 1e-9); near(x[2], 3 / t, 1e-9);
  }
  { // the cube's polar is the octahedron: vertices (±1,±1,±1) give the faces, and the support function is the l1 norm
    const y = [0.3, -0.5, 0.2]; near(M.hK(y, 0), 1.0, 1e-12); const x = M.supportPoint(y, 0); ok(x[0] === 1 && x[1] === -1 && x[2] === 1, 'the cube’s support point is a corner');
    const x1 = M.supportPoint(y, 1); ok(x1[0] === 0 && x1[1] === -1 && x1[2] === 0, 'the octahedron’s support point is its vertex on the largest coordinate'); near(M.hK(y, 1), 0.5, 1e-12);
  }
  // ---- the Mahler volume product
  near(M.mahler(0), 32 / 3, 1e-12); near(M.mahler(1), 32 / 3, 1e-12); near(M.mahler(0.5), Math.pow((4 * PI) / 3, 2), 1e-12); near(M.mahler(1 / 3), 16.7637108, 1e-6);
  for (let i = 0; i <= 100; i++) { const s = i / 100; near(M.mahler(s), M.mahler(1 - s), 1e-11); ok(M.mahler(s) >= M.MAHLER_MIN - 1e-9 && M.mahler(s) <= M.MAHLER_MAX + 1e-9, 'Mahler product between 32/3 and (4 pi/3)^2'); if (i && i <= 50) ok(M.mahler(s) > M.mahler((i - 1) / 100), 'the product rises towards the ball'); }
  // ---- planar bodies
  const sq = M.shapeA(0, 1), tri = M.shapeA(1, 1), hex = M.shapeA(2, 1);
  near(M.polyArea(sq), 4, 1e-12); near(M.polyPerim(sq), 8, 1e-12); near(M.polyArea(tri), (3 * Math.sqrt(3)) / 4, 1e-12); near(M.polyArea(hex), (3 * Math.sqrt(3)) / 2, 1e-12);
  near(M.polyArea(M.hull2([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [0.5, 0.7], [1.5, 0.3]])), 4, 1e-12);
  near(M.polyArea(M.minkowski(M.shapeA(0, 1), M.shapeB(3, 0.5, 0))), 9, 1e-12);                 // squares of side 2 and 1 add to side 3
  const angles = Array.from({ length: 360 }, (_, i) => (i * PI) / 180 + 0.0123);
  for (const ka of [0, 1, 2, 3]) for (const kb of [0, 1, 2, 3]) {
    const A = M.shapeA(ka, 1.3), B = M.shapeB(kb, 0.8, 0.37), S = M.minkowski(A, B);
    ok(angles.every((t) => Math.abs(M.hSupport(S, t) - M.hSupport(A, t) - M.hSupport(B, t)) < 1e-12), 'support functions add');
    near(M.polyPerim(S), M.polyPerim(A) + M.polyPerim(B), 2e-9);                             // perimeter is additive
    const aA = M.polyArea(A), aB = M.polyArea(B), aS = M.polyArea(S), V = M.mixedArea(A, B);
    if (aB > 1e-9) { ok(Math.sqrt(aS) >= Math.sqrt(aA) + Math.sqrt(aB) - 1e-12, 'Brunn-Minkowski'); ok(V * V >= aA * aB - 1e-12, 'Minkowski’s inequality'); }
    near(M.mixedArea(B, A), V, 1e-9);
  }
  near(M.mixedArea(sq, sq), 4, 1e-12); near(M.mixedArea(M.shapeA(0, 1.3), M.shapeB(3, 0.8, 0)), 4 * 1.3 * 0.8, 1e-12);
  // equality in Brunn-Minkowski exactly for homothetic bodies; strict otherwise
  near(Math.sqrt(M.polyArea(M.minkowski(M.shapeA(0, 1.2), M.shapeB(3, 0.7, 0)))) / (Math.sqrt(M.polyArea(M.shapeA(0, 1.2))) + Math.sqrt(M.polyArea(M.shapeB(3, 0.7, 0)))), 1, 1e-12);
  near(Math.sqrt(M.polyArea(M.minkowski(M.shapeA(1, 1.1), M.shapeB(2, 0.9, 0)))) / (Math.sqrt(M.polyArea(M.shapeA(1, 1.1))) + Math.sqrt(M.polyArea(M.shapeB(2, 0.9, 0)))), 1, 1e-12);
  ok(M.minkState({ ka: 1, a: 1.1, kb: 2, t: 0.9, rot: 60, th: 0 }).bm > 1.01, 'a triangle and its reflection are not homothetic');
  ok(M.minkState({ ka: 0, a: 1, kb: 2, t: 1, rot: 0, th: 0 }).bm > 1.01, 'a square and a triangle are not homothetic');
  // Steiner's formula, with the disc replaced by a 180-gon
  for (const ka of [0, 1, 2, 3]) for (const t of [0.2, 0.6, 1.1]) near(M.polyArea(M.minkowski(M.shapeA(ka, 1.2), M.shapeB(0, t, 0))) / M.steiner(M.shapeA(ka, 1.2), t), 1, 6e-4);
  near(M.steiner(M.shapeA(0, 1), 1), 4 + 8 + PI, 1e-12);
  // Cauchy's formulas: perimeter = \int h, area = 1/2 \int (h^2 - h'^2)
  for (const P of [M.shapeA(0, 1), M.shapeA(1, 1.2), M.minkowski(M.shapeA(3, 1), M.shapeB(2, 0.6, 0.4))]) {
    const N = 40000; let per = 0, ar = 0;
    for (let i = 0; i < N; i++) { const t = ((i + 0.5) * TAU) / N, h = M.hSupport(P, t), q = M.supportPt2(P, t), hp = -q[0] * Math.sin(t) + q[1] * Math.cos(t); per += (h * TAU) / N; ar += (0.5 * (h * h - hp * hp) * TAU) / N; }
    near(per / M.polyPerim(P), 1, 1e-4); near(ar / M.polyArea(P), 1, 1e-4);
  }
  // ---- hulls in space
  const sol = M.SOLIDS.map((s, k) => M.hull3(M.solidPoints(k)));
  [[8, 12, 6], [6, 12, 8], [4, 6, 4], [6, 9, 5], [9, 21, 14]].forEach(([v, e, f], k) => { ok(sol[k].nV === v && sol[k].nE === e && sol[k].nF === f, 'vertex, edge and face counts'); ok(sol[k].nV - sol[k].nE + sol[k].nF === 2, 'Euler’s formula'); });
  near(M.hullVolume(sol[0]), 8, 1e-12); near(M.hullVolume(sol[1]), (4 / 3) * 1.4 ** 3, 1e-12); near(M.hullVolume(sol[2]), 1.8 ** 3 / 3, 1e-12); near(M.hullVolume(sol[3]), ((3 * Math.sqrt(3)) / 4) * 1.2 * 1.2 * 1.8, 1e-12);
  { // the cloud: its volume against a grid count, the three interior points are inside, every point lies behind every face
    const H = sol[4], h = 0.05; let cnt = 0;
    for (let x = -1.5; x < 1.5; x += h) for (let y = -1.5; y < 1.5; y += h) for (let z = -1.5; z < 1.5; z += h) if (M.insideHull(H, [x + h / 2, y + h / 2, z + h / 2], 0)) cnt++;
    near((cnt * h ** 3) / M.hullVolume(H), 1, 0.015);
    sol.forEach((S) => ok(S.faces.every((f) => S.P.every((p) => f.n[0] * p[0] + f.n[1] * p[1] + f.n[2] * p[2] - f.d < 1e-9) && f.n[0] * S.centre[0] + f.n[1] * S.centre[1] + f.n[2] * S.centre[2] < f.d), 'every face has the whole body behind it'));
    ok(H.P.filter((_, m) => !H.V.includes(m)).length === 3, 'three points of the cloud are swallowed');
    ok(H.V.every((m) => !M.insideHull(H, H.P[m], 1e-9)), 'hull vertices are not interior');
  }
  // ---- distance between polytopes
  const at = (ka, kb, off, rz = 0) => M.sepState({ ka, kb, bx: off[0], by: off[1], bz: off[2], rz, psi: 0 });
  const box = (b) => Math.hypot(...b.map((t) => Math.max(0, Math.abs(t) - 2)));
  for (const b of [[3.5, 0, 0], [3, 3, 0], [3.4, -2.6, 0.5], [3, 3, 3], [-2.5, 4.1, 2.9], [0, 0, -5]]) { const E = at(0, 0, b); ok(!E.r.overlap, 'cubes are apart'); near(E.r.d, box(b), 1e-9); }
  ok(at(0, 0, [1, 0, 0]).r.overlap && at(0, 0, [1.5, 0.5, 0.2]).r.overlap && at(0, 1, [0, 0, 0]).r.overlap && !at(0, 0, [2.5, 0, 0]).r.overlap, 'overlap detection');
  { const small = M.hull3([[0.1, 0.1, 0.1], [0.2, 0.1, 0.1], [0.1, 0.2, 0.1], [0.1, 0.1, 0.2]]); ok(M.hullsOverlap(sol[0], small) && M.hullsOverlap(small, sol[0]), 'a body inside another overlaps it'); }
  near(at(0, 1, [4, 0, 0]).r.d, 4 - 1.4 - 1, 1e-9);                                           // octahedron tip against a cube face
  { const [p, q] = M.closestSegSeg([0, 0, 0], [1, 0, 0], [0.5, -1, 1], [0.5, 1, 1]); near(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), 1, 1e-12); near(p[0], 0.5, 1e-12); near(q[2], 1, 1e-12); }
  { const c = M.closestOnTri([0.2, 0.2, 3], [0, 0, 0], [1, 0, 0], [0, 1, 0]); near(c[0], 0.2, 1e-12); near(c[2], 0, 1e-12); const e = M.closestOnTri([2, 2, 1], [0, 0, 0], [1, 0, 0], [0, 1, 0]); near(e[0], 0.5, 1e-12); near(e[1], 0.5, 1e-12); }
  // strong duality: the best gap over all directions is the distance, attained along the shortest segment
  const fib = Array.from({ length: 12000 }, (_, i) => { const z = 1 - (2 * (i + 0.5)) / 12000, r = Math.sqrt(1 - z * z), a = i * PI * (3 - Math.sqrt(5)); return [r * Math.cos(a), r * Math.sin(a), z]; });
  for (const [ka, kb, off, rz] of [[0, 0, [3, 3, 0], 0], [0, 1, [3.6, 0.8, 0.5], 0], [2, 3, [2.8, -1.9, 1.2], 40], [4, 4, [-3.1, 2.2, -1.0], 25], [1, 2, [1.9, 2.4, 2.2], 70], [3, 0, [0.4, 3.9, -0.7], 10]]) {
    const E = at(ka, kb, off, rz); ok(!E.r.overlap, 'configuration is disjoint');
    let best = -Infinity; for (const n of fib) best = Math.max(best, M.gapAlong(E.A, E.B, n));
    ok(best <= E.r.d + 1e-9, 'no direction beats the distance'); ok(best > E.r.d - 0.02, 'some direction nearly reaches the distance'); near(M.gapAlong(E.A, E.B, E.n0), E.r.d, 1e-9);
    for (const psi of [-60, -20, 15, 50]) ok(M.sepState({ ka, kb, bx: off[0], by: off[1], bz: off[2], rz, psi }).gap < E.r.d - 1e-6, 'tilting away from the shortest segment loses gap');
  }
  { const E = at(0, 0, [3.3, 0, 0]); near(M.gapAlong(E.A, E.B, [1, 0, 0]), 1.3, 1e-12); near(M.gapAlong(E.B, E.A, [-1, 0, 0]), 1.3, 1e-12); near(E.r.pa[0], 1, 1e-9); near(E.r.pb[0], 2.3, 1e-9); }
};
