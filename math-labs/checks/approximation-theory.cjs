// Approximation theory: the Remez algorithm reproduces known best approximations (|x| by degree 2 is x^2 + 1/8 with
// error 1/8; x^(n+1) has error 2^-n; e^x by a line has slope sinh 1) and its error equioscillates at n + 2 points; the
// Chebyshev interpolant is within a small factor of the best; Bernstein weights sum to 1, B_n(t^2) = x^2 + x(1 - x)/n and
// Voronovskaya's limit holds; the node potentials have their closed-form values (uniform: -1 at 0, log 2 - 1 at the ends
// and at 0.5255i; Chebyshev: -log 2 on the interval); and measured interpolation errors follow the predicted rates.
module.exports = (M, { ok, near }) => {
  const R2 = M.remez(Math.abs, 2); near(R2.E, 1 / 8, 1e-6); near(R2.c[0], 5 / 8, 1e-5); near(R2.c[2], 1 / 2, 1e-5); near(R2.c[1], 0, 1e-6);
  for (const n of [2, 4, 7]) near(M.remez((x) => x ** (n + 1), n).E, 2 ** -n, 1e-7);
  const m = Math.sinh(1), c = Math.log(m), E1 = (Math.exp(-1) + m * (c + 1) - m) / 2, R1 = M.remez(Math.exp, 1);
  near(R1.E, E1, 1e-7); near(R1.c[1], m, 1e-6);
  for (const [i, n] of [[1, 5], [2, 6], [3, 7], [0, 9]]) {
    const f = M.FN[i].f, R = M.remez(f, n); ok(R.ref.length === n + 2, 'n + 2 reference points');
    const e = R.ref.map((x) => f(x) - M.evalCheb(R.c, x));
    ok(e.every((q, j) => Math.abs(Math.abs(q) - R.E) < 1e-6 * R.E + 1e-12 && (j === 0 || q * e[j - 1] < 0)), `equioscillation for f${i}, n = ${n}`);
    near(R.sup, R.E, 1e-6 * R.E + 1e-12);
    const ci = M.chebInterp(f, n), sc = M.supOn((x) => f(x) - M.evalCheb(ci, x)); ok(sc >= R.E * (1 - 1e-9) && sc < 4 * R.E, 'Chebyshev interpolant within a small factor of the best');
    // a competitor: perturbing the best polynomial never lowers the error
    for (const d of [-0.3, 0.2]) ok(M.supOn((x) => f(x) - M.evalCheb(R.c, x) - d * R.E * M.chebT(n, x)) > R.E * (1 - 1e-9), 'perturbation does not help');
  }
  for (const [n, x] of [[7, 0.3], [40, 0.81], [200, 0.5]]) {
    const w = M.binomPmf(n, x); near(w.reduce((a, b) => a + b, 0), 1, 1e-12);
    near(M.bernstein((t) => t * t, n, x), x * x + (x * (1 - x)) / n, 1e-12); near(M.bernstein((t) => 3 * t - 1, n, x), 3 * x - 1, 1e-12);
  }
  { const n = 200, x = 0.3, f = (t) => Math.sin(2 * Math.PI * t); near(n * (M.bernstein(f, n, x) - f(x)), 0.5 * x * (1 - x) * -4 * Math.PI ** 2 * f(x), 0.05); }
  near(M.bernstein((t) => Math.abs(t - 0.5), 100, 0.5), 0.0795892373871788 / 2, 1e-12);
  near(M.potUniform(0, 0), -1, 1e-12); near(M.potUniform(1, 0), Math.LN2 - 1, 1e-12); near(M.potUniform(-1, 0), Math.LN2 - 1, 1e-12);
  near(M.potUniform(0, 0.5255249145), Math.LN2 - 1, 1e-9); near(M.potUniform(0, 40), Math.log(40), 1e-3);
  for (const x of [-0.9, 0, 0.37, 1]) near(M.potCheb(x, 0), -Math.LN2, 1e-12);
  near(M.rhoOf(0, 0.2), 0.2 + Math.sqrt(1.04), 1e-12); near(M.rhoOf(1.25, 0), 2, 1e-12);
  { // numerical potential of 400 equispaced nodes agrees with the closed form
    let s = 0; const N = 400; for (let j = 0; j < N; j++) { const t = -1 + (2 * (j + 0.5)) / N; s += Math.log(Math.hypot(0.3 - t, 0.4)); } near(s / N, M.potUniform(0.3, 0.4), 1e-4);
  }
  const f = M.poleFn(0, 0.2);
  ok(M.interpError(0, 20, f) > 10 * M.interpError(0, 10, f) && M.interpError(0, 40, f) > 1e3, 'equispaced interpolation of the Runge function diverges');
  near(Math.log(M.interpError(1, 60, f) / M.interpError(1, 20, f)) / 40, -Math.log(M.rhoOf(0, 0.2)), 0.01);
  near(Math.log(M.interpError(0, 40, f) / M.interpError(0, 20, f)) / 20, M.potMax(0) - M.potUniform(0, 0.2), 0.05);
  ok(M.interpError(0, 30, M.poleFn(0, 1)) < 1e-3 * M.interpError(0, 6, M.poleFn(0, 1)), 'a pole outside the lens: equispaced interpolation converges');
  { const nd = M.nodes(0, 9), g = (x) => 2 * x ** 7 - x ** 3 + 0.5, fv = nd.x.map(g); for (const t of [-0.77, 0.123, 0.95]) near(M.bary(nd, fv, t), g(t), 1e-10); }
};
