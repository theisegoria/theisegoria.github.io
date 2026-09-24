// Quaternions: Hamilton's rules, the sandwich against Rodrigues, the half-angle mechanism, matrix round trips, slerp and nlerp speeds, and Euler-angle singularity.
module.exports = (Q, { ok, near }) => {
  const i = [0, 1, 0, 0], j = [0, 0, 1, 0], k = [0, 0, 0, 1], one = [1, 0, 0, 0];
  const eq = (a, b, t = 1e-12) => a.every((x, n) => Math.abs(x - b[n]) < t);
  // 1. Hamilton's rules i^2 = j^2 = k^2 = ijk = -1, and ij = k = -ji
  ok([Q.qmul(i, i), Q.qmul(j, j), Q.qmul(k, k), Q.qmul(Q.qmul(i, j), k)].every((x) => eq(x, [-1, 0, 0, 0])), 'i^2 = j^2 = k^2 = ijk = -1');
  ok(eq(Q.qmul(i, j), k) && eq(Q.qmul(j, i), [0, 0, 0, -1]), 'ij = k and ji = -k');
  // 2. the norm is multiplicative, the product associative, and q q^-1 = 1
  const a = [0.3, -1.2, 0.7, 2], b = [-0.5, 0.4, 1.1, -0.2], c = [1.5, 0.2, -0.9, 0.6];
  near(Q.qnorm(Q.qmul(a, b)), Q.qnorm(a) * Q.qnorm(b), 1e-12);
  ok(eq(Q.qmul(Q.qmul(a, b), c), Q.qmul(a, Q.qmul(b, c)), 1e-12), 'associative');
  ok(eq(Q.qmul(a, Q.qinv(a)), one, 1e-12), 'q q^-1 = 1');
  ok(eq(Q.qconj(Q.qmul(a, b)), Q.qmul(Q.qconj(b), Q.qconj(a)), 1e-12), '(ab)* = b* a*');
  // pure product: uv = -u.v + u x v
  const u = [0.2, -0.7, 0.4], w = [1.1, 0.3, -0.5], uw = Q.qmul(Q.pure(u), Q.pure(w)), cr = Q.cross(u, w);
  ok(Math.abs(uw[0] + Q.dot(u, w)) < 1e-12 && eq(Q.vec(uw), cr), 'uv = -u.v + u x v for pure u, v');
  // 3. the sandwich agrees with Rodrigues' formula and with the matrix, and q, -q give the same rotation
  for (const [n, th] of [[[0.36, 0.48, 0.8], 1.1], [[-1, 2, 0.5], 2.9], [[0, 0, 1], Math.PI]]) {
    const q = Q.fromAxisAngle(n, th), v = [0.3, -0.8, 0.6];
    const r1 = Q.rotate(q, v), r2 = Q.rodrigues(n, th, v), r3 = Q.mv(Q.toMatrix(q), v), r4 = Q.rotate(q.map((x) => -x), v);
    ok(eq(r1, r2, 1e-12) && eq(r1, r3, 1e-12) && eq(r1, r4, 1e-12), 'q v q* = Rodrigues = matrix, for q and -q');
  }
  ok(eq(Q.fromAxisAngle([0, 1, 0], 2 * Math.PI), [-1, 0, 0, 0], 1e-12), 'a full turn is q = -1');
  // 4. the half-angle mechanism: Re(q v) = -sin(th/2) n.v; for v perpendicular to n, q v is pure and turned by th/2
  { const n = [0, 0, 1], th = 1.3, q = Q.fromAxisAngle(n, th), v = [0.6, 0.2, 0.7], h = Q.leftHalf(q, v);
    near(h[0], -Math.sin(th / 2) * Q.dot(n, v), 1e-12);
    const vp = [1, 0, 0], hp = Q.leftHalf(q, vp);
    near(hp[0], 0, 1e-15); near(Math.atan2(hp[2], hp[1]), th / 2, 1e-12);
    near(Q.qmul(h, Q.qconj(q))[0], 0, 1e-12); }
  // 5. matrix round trip (Shepperd), including angles near pi where the trace method fails
  for (const [n, th] of [[[1, 2, 3], 0.4], [[1, -1, 0.2], Math.PI - 1e-7], [[0.2, 0.1, -1], 3.0]]) {
    const q = Q.fromAxisAngle(n, th), back = Q.fromMatrix(Q.toMatrix(q)), s = Math.sign(q[0]) || 1;
    ok(eq(back, q.map((x) => s * x), 1e-9), 'fromMatrix(toMatrix(q)) = +-q');
    near(Q.det3(Q.toMatrix(q)), 1, 1e-12);
  }
  // exp and log invert one another; exp(th n / 2) is the rotation quaternion
  { const n = Q.cross([1, 0, 0], [0.3, 0.9, 0.1]), nn = Math.hypot(...n), un = n.map((x) => x / nn), th = 2.2;
    ok(eq(Q.qexp(un.map((x) => x * th / 2)), Q.fromAxisAngle(un, th), 1e-12), 'exp(th n / 2) = q');
    ok(eq(Q.qlog(Q.fromAxisAngle(un, th)), un.map((x) => x * th / 2), 1e-12), 'log q = th n / 2'); }
  // 6. slerp has constant angular speed equal to the total angle; nlerp matches the closed form 2 tan(phi/2) / phi at t = 1/2
  { const qA = [1, 0, 0, 0], Om = 2.4, qB = Q.fromAxisAngle([0.3, 0.2, 1], Om), S = (t) => Q.slerp(qA, qB, t), N = (t) => Q.nlerp(qA, qB, t);
    [0.05, 0.3, 0.5, 0.9].forEach((t) => near(Q.speed(S, t), Om, 1e-6));
    near(Q.turned(S), Om, 1e-9); near(Q.turned(N), Om, 1e-9);
    near(Q.speed(N, 0.5) / Om, Q.nlerpMidRatio(Om / 2), 1e-6);
    ok(Q.speed(N, 0.02) < Om && Q.speed(N, 0.5) > Om, 'nlerp is slow at the ends and fast in the middle');
    const mid = Q.slerp(qA, qB, 0.5), half = Q.qunit(qA.map((x, n) => x + qB[n]));
    ok(eq(mid, half, 1e-12), 'slerp at 1/2 is the normalised sum');
    // the long way round: interpolating to -qB turns through 2 pi - Om
    near(Q.turned((t) => Q.slerp(qA, qB.map((x) => -x), t)), 2 * Math.PI - Om, 1e-9);
    // interpolating Euler angles never beats the geodesic
    const eB = Q.toEuler(qB); ok(Q.turned(Q.eulerPath([0, 0, 0], eB)) >= Om - 1e-9, 'Euler-angle path is at least as long as the geodesic'); }
  // 7. Euler angles: round trip away from the singularity; at pitch 90 degrees only yaw - roll matters
  { const e = [0.7, -0.4, 2.1], back = Q.toEuler(Q.fromEuler(...e)); e.forEach((x, n) => near(back[n], x, 1e-12));
    const p = Math.PI / 2, A = Q.toMatrix(Q.fromEuler(0.9, p, 0.3)), B = Q.toMatrix(Q.fromEuler(1.4, p, 0.8)), C = Q.toMatrix(Q.fromEuler(0.9, -p, 0.3)), Dm = Q.toMatrix(Q.fromEuler(0.4, -p, 0.8));
    ok(A.every((r, m) => eq(r, B[m], 1e-12)), 'at pitch +90 the rotation depends only on yaw - roll');
    ok(C.every((r, m) => eq(r, Dm[m], 1e-12)), 'at pitch -90 the rotation depends only on yaw + roll');
    // the Euler-rate Jacobian (columns: yaw, pitch, roll axes): det = -cos(pitch), and its smallest singular value matches sqrt(1 - |sin pitch|)
    for (const pt of [0, 0.6, 1.2, Math.PI / 2]) {
      const J = Q.eulerRateJacobian(0.8, pt); near(Q.det3(J), -Math.cos(pt), 1e-12);
      const G = [0, 1, 2].map((r) => [0, 1, 2].map((s) => J[0][r] * J[0][s] + J[1][r] * J[1][s] + J[2][r] * J[2][s]));
      // smallest eigenvalue of the 3x3 Gram matrix, by the known structure checked entry by entry
      near(G[0][1], 0, 1e-12); near(G[1][2], 0, 1e-12); near(G[0][2], -Math.sin(pt), 1e-12);
      near(Q.sigmaMin(pt) ** 2, 1 - Math.abs(Math.sin(pt)), 1e-12);
    }
    // angular velocity from Euler rates: J applied to the rates equals 2 q' q* by finite differences
    const e0 = [0.5, 0.3, -0.8], rates = [0.7, -0.2, 1.1], h = 1e-6;
    const qp = Q.fromEuler(...e0.map((x, n) => x + h * rates[n])), qm = Q.fromEuler(...e0.map((x, n) => x - h * rates[n])), q0 = Q.fromEuler(...e0);
    const dq = qp.map((x, n) => (x - qm[n]) / (2 * h)), om = Q.vec(Q.qmul(dq, Q.qconj(q0))).map((x) => 2 * x), J = Q.eulerRateJacobian(e0[0], e0[1]);
    [0, 1, 2].forEach((r) => near(om[r], J[r][0] * rates[0] + J[r][1] * rates[1] + J[r][2] * rates[2], 1e-8)); }
};
