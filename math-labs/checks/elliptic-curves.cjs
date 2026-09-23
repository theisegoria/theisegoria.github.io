// Elliptic curves: the real group law, point counts over F_p, and the Weierstrass parametrisation of the torus.
module.exports = (E, { ok, near }) => {
  // 1. real group law: sums stay on the curve, O is the identity, inverses, associativity
  const a = -2, b = 1, on = (P) => Math.abs(P[1] * P[1] - E.cub(P[0], a, b)) < 1e-8 * (1 + Math.abs(P[1] * P[1]));
  const P = E.onCurve(-1.2, 1, a, b), Q = E.onCurve(2.1, -1, a, b), R = E.onCurve(0.3, 1, a, b);
  ok(on(E.addR(P, Q, a)) && on(E.addR(P, P, a)), 'P + Q and 2P lie on the curve');
  ok(E.addR(P, null, a) === P && E.addR(P, E.negR(P), a) === null, 'O is the identity and (x, -y) the inverse');
  const l = E.addR(E.addR(P, Q, a), R, a), r = E.addR(P, E.addR(Q, R, a), a);
  near(l[0], r[0], 1e-9); near(l[1], r[1], 1e-9);
  // doubling is the limit of chords
  const P2 = E.addR(P, P, a), Pn = E.addR(P, E.onCurve(-1.2 + 1e-6, 1, a, b), a);
  near(Pn[0], P2[0], 1e-4);
  // 2-torsion: a point with y = 0 doubles to O
  ok(E.addR([1, 0], [1, 0], a) === null, '(1, 0) has order 2 on y^2 = x^3 - 2x + 1');
  // three real roots exactly when 4a^3 + 27b^2 < 0
  ok(E.cubicRoots(-2, 1).length === 3 && E.cubicRoots(1, 1).length === 1, 'root count follows the discriminant');
  E.cubicRoots(-2, 1).forEach((x) => near(E.cub(x, -2, 1), 0, 1e-12));

  // 2. curves over F_p
  for (const p of [7, 13, 47, 97]) {
    const chi = E.chiTable(p); let worst = 0;
    for (let A = 0; A < p; A++) for (let B = 0; B < p; B++) { if (E.singularP(A, B, p)) continue; worst = Math.max(worst, Math.abs(p + 1 - E.countPoints(A, B, p, chi))); }
    ok(worst <= 2 * Math.sqrt(p), `Hasse bound holds for every curve mod ${p}`);
  }
  ok(E.countPoints(2, 3, 97) === E.pointsModP(2, 3, 97).length + 1, 'character sum agrees with enumeration');
  // supersingular families: y^2 = x^3 + x for p = 3 mod 4, y^2 = x^3 + 1 for p = 2 mod 3, both have p + 1 points
  ok([7, 23, 31, 47, 83].every((p) => E.countPoints(1, 0, p) === p + 1), 'y^2 = x^3 + x has p + 1 points when p = 3 mod 4');
  ok([23, 47, 83].every((p) => E.countPoints(0, 1, p) === p + 1), 'y^2 = x^3 + 1 has p + 1 points when p = 2 mod 3');
  // Lagrange: N P = O for every point, and each order divides N
  const p = 61, A = 5, B = 7, pts = E.pointsModP(A, B, p), N = pts.length + 1;
  ok(pts.every((X) => E.mulP(N, X, A, p) === null), 'N P = O for every point');
  ok(pts.every((X) => N % E.orderOf(X, A, p) === 0), 'every order divides #E');
  const [X, Y, Z] = [pts[3], pts[17], pts[29]];
  ok(JSON.stringify(E.addP(E.addP(X, Y, A, p), Z, A, p)) === JSON.stringify(E.addP(X, E.addP(Y, Z, A, p), A, p)), 'associative mod p');
  const { h, n } = E.traceHistogram(13); let tot = 0; for (const c of h.values()) tot += c;
  ok(tot === n && n === 13 * 13 - [...Array(13 * 13).keys()].filter((k) => E.singularP(Math.floor(k / 13), k % 13, 13)).length, 'histogram covers every non-singular curve');

  // 3. the torus: theta-function formula against a direct lattice sum, the differential equation, and the addition theorem
  const t = 1.25, [g2, g3] = E.g2g3(t);
  for (const z of [[0.2, 0.1], [0.31, 0.4], [-0.17, 0.625]]) {
    const w = E.wp(z, t), d = E.wpDirect(z, t, 150);
    near(w[0][0], d[0], 1e-4 * (1 + Math.abs(d[0]))); near(w[0][1], d[1], 1e-4 * (1 + Math.abs(d[1])));
    const lhs = E.cmul(w[1], w[1]), c3 = E.cmul(w[0], E.cmul(w[0], w[0])), rhs = [4 * c3[0] - g2 * w[0][0] - g3, 4 * c3[1] - g2 * w[0][1]];
    near(lhs[0], rhs[0], 1e-8 * Math.abs(rhs[0])); near(lhs[1], rhs[1], 1e-8 * (1 + Math.abs(rhs[1])));
  }
  near(E.g2g3(1)[1], 0, 1e-9);
  near(E.g2g3(1)[0], 189.0727201292, 1e-7);
  const e = E.eRoots(t); near(e[0] + e[1] + e[2], 0, 1e-9);
  e.forEach((x) => near(4 * x * x * x - g2 * x - g3, 0, 1e-7));
  ok(e[0] > e[1] && e[1] > e[2], 'e1 > e2 > e3 for a rectangular lattice');
  // addition theorem at complex points: p(u+v) = (1/4)((p'(u) - p'(v))/(p(u) - p(v)))^2 - p(u) - p(v)
  for (const [u, v] of [[[0.21, 0.13], [0.07, 0.42]], [[-0.33, 0.5], [0.12, -0.2]]]) {
    const U = E.wp(u, t), V = E.wp(v, t), S = E.wp([u[0] + v[0], u[1] + v[1]], t);
    const k = E.cdiv(E.csub(U[1], V[1]), E.csub(U[0], V[0])), rhs = E.csub(E.csub(E.cmul([0.25, 0], E.cmul(k, k)), U[0]), V[0]);
    near(S[0][0], rhs[0], 1e-8 * (1 + Math.abs(rhs[0]))); near(S[0][1], rhs[1], 1e-8 * (1 + Math.abs(rhs[1])));
  }
  // real points: the chord law on the curve reproduces p and p' of u + v
  const Pp = E.wp([0.21, 0], t), Qp = E.wp([0.12, t / 2], t), Sp = E.wp([0.33, t / 2], t);
  const S2 = E.addW([Pp[0][0], Pp[1][0]], [Qp[0][0], Qp[1][0]], g2);
  near(S2[0], Sp[0][0], 1e-8 * (1 + Math.abs(Sp[0][0]))); near(S2[1], Sp[1][0], 1e-7 * (1 + Math.abs(Sp[1][0])));
  near(Pp[0][1], 0, 1e-9); near(Qp[0][1], 0, 1e-9);
};
