// Acoustics: the plucked and struck strings' d'Alembert solutions match their Fourier series, harmonics with a node at the pluck point vanish, energy is conserved, ideal Helmholtz motion has stick fraction 1 - beta and its Fourier series; the Chladni approximation is an eigenfunction of the Laplacian with free-edge slopes and the right symmetry; the Doppler ratio is the derivative of arrival time and the boom is the first arrival.
module.exports = (M, { ok, near }) => {
  const PI = Math.PI;
  // 1. pluck: d'Alembert vs series, initial shape, missing harmonics
  for (const b of [0.2, 0.37]) {
    const y = M.pluckY(b);
    near(y(b, 0), 1, 1e-12); near(y(0.5 * b, 0), 0.5, 1e-12);
    for (const [x, t] of [[0.3, 0.41], [0.77, 1.3], [0.12, 1.9]]) { let s = 0; for (let n = 1; n <= 4000; n++) s += M.pluckCoef(b, n) * Math.sin(n * PI * x) * Math.cos(n * PI * t); near(y(x, t), s, 2e-4); }
    near(y(0.3, 2), y(0.3, 0), 1e-12); near(y(0.3, 1), -y(0.7, 0), 1e-12); // period 2, half-period mirror inversion
  }
  near(M.pluckCoef(0.2, 5), 0, 1e-15); near(M.pluckCoef(0.25, 8), 0, 1e-15); ok(Math.abs(M.pluckCoef(0.2, 4)) > 0.01, 'harmonic 4 present at beta = 0.2');
  // energy: sum of n^2 b_n^2 pi^2/4 equals the potential energy (1/2)∫ y'^2 = 1/(2 b (1 - b))
  { const b = 0.2; let E = 0; for (let n = 1; n <= 20000; n++) E += ((n * PI) ** 2 * M.pluckCoef(b, n) ** 2) / 4; near(E, 1 / (2 * b * (1 - b)), 1e-3); }
  // strike: d'Alembert vs series, starts flat with unit velocity in the hammer
  { const b = 0.13, w = M.HW, y = M.strikeY(b, w); near(y(0.4, 0), 0, 1e-15); near((y(b, 1e-4) - y(b, 0)) / 1e-4, 1, 1e-9);
    for (const [x, t] of [[0.3, 0.4], [0.6, 1.1]]) { let s = 0; for (let n = 1; n <= 6000; n++) s += M.strikeCoef(b, n, w) * Math.sin(n * PI * x) * Math.sin(n * PI * t); near(y(x, t), s, 3e-4); } }
  // 2. Helmholtz motion: series, stick fraction and velocities at the bow
  { const K = 3.2, y = M.helmholtzY(K); near(y(0.5, 0.5), K / 4, 1e-12);
    let s = 0; for (let n = 1; n <= 4000; n++) s += M.helmholtzCoef(K, n) * Math.sin(n * PI * 0.31) * Math.sin(n * PI * 0.72); near(y(0.31, 0.72), s, 2e-4);
    const b = 0.15, hv = M.helmholtzVel(K, b), N = 4000; let stick = 0, slip = 0;
    for (let i = 0; i < N; i++) { const t = (2 * (i + 0.5)) / N, v = (y(b, t + 1e-6) - y(b, t - 1e-6)) / 2e-6; if (Math.abs(v - hv.stick) < 1e-6) stick++; else if (Math.abs(v - hv.slip) < 1e-6) slip++; }
    ok(stick + slip >= N - 4, 'velocity at the bow takes only the stick and slip values'); near(stick / N, 1 - b, 2e-3); near(hv.slip * b + hv.stick * (1 - b), 0, 1e-12); } // no net motion over a period
  // 3. Chladni: eigenfunction of the Laplacian, zero normal slope at the edges, swap symmetry
  for (const [m, n, sg] of [[3, 1, 1], [3, 1, -1], [4, 2, 1], [2, 2, 1]]) {
    const w = M.chladniW(m, n, sg), h = 1e-4, x = 0.37, y = 0.61;
    const lap = (w(x + h, y) + w(x - h, y) + w(x, y + h) + w(x, y - h) - 4 * w(x, y)) / (h * h);
    near(lap, -PI * PI * M.chladniRel(m, n) * w(x, y), 1e-3 * PI * PI * M.chladniRel(m, n));
    near((w(h, y) - w(-h, y)) / (2 * h), 0, 1e-6); near((w(x, 1 + h) - w(x, 1 - h)) / (2 * h), 0, 1e-6);
    near(w(y, x), sg * w(x, y), 1e-12);
  }
  near(M.chladniW(3, 1, -1)(0.3, 0.3), 0, 1e-12); // the antisymmetric pattern has the diagonal as a nodal line
  { const snaps = M.sand(2, 1, 1, 400, 120), [xs, ys] = snaps[snaps.length - 1], w = M.chladniW(2, 1, 1), [x0, y0] = snaps[0]; let a = 0, a0 = 0; for (let i = 0; i < 400; i++) { a += Math.abs(w(xs[i], ys[i])); a0 += Math.abs(w(x0[i], y0[i])); } ok(a < 0.35 * a0, 'sand collects on nodal lines'); }
  // 4. Doppler: ratio = 1 / (d arrival / d emission), classic limits, boom = earliest arrival for M > 1
  for (const [Mm, X, Y, te] of [[0.6, 2, 1.5, -3], [0.6, 2, 1.5, 4], [1.8, 1, 2, -2]]) {
    const d = (M.arrival(te + 1e-6, Mm, X, Y) - M.arrival(te - 1e-6, Mm, X, Y)) / 2e-6; near(M.heardRatio(te, Mm, X, Y), 1 / d, 1e-6);
  }
  near(M.heardRatio(-1e6, 0.6, 0, 1), 1 / 0.4, 1e-6); near(M.heardRatio(1e6, 0.6, 0, 1), 1 / 1.6, 1e-6);
  { const Mm = 1.8, X = 1, Y = 2; let best = Infinity; for (let i = 0; i <= 200000; i++) best = Math.min(best, M.arrival(-20 + i * 1e-4, Mm, X, Y)); near(best, M.boomTime(Mm, X, Y), 1e-6);
    near(M.arrival(M.boomEmission(Mm, X, Y), Mm, X, Y), M.boomTime(Mm, X, Y), 1e-12);
    near(M.machAngle(2), PI / 6, 1e-12);
    ok(M.emissionsAt(M.boomTime(Mm, X, Y) - 0.1, Mm, X, Y).length === 0, 'silence before the boom'); ok(M.emissionsAt(M.boomTime(Mm, X, Y) + 0.5, Mm, X, Y).length === 2, 'two sounds after the boom');
    const es = M.emissionsAt(3, 0.5, 1, 1); ok(es.length === 1, 'one sound for a subsonic source'); near(M.arrival(es[0], 0.5, 1, 1), 3, 1e-9); }
};
