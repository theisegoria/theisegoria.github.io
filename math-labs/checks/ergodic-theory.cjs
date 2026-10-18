// Ergodic theory: three-gap theorem and discrepancy of irrational rotations; area preservation, inverse maps, Lyapunov exponent and
// Pisano periods of the cat map; mixing versus mere ergodicity; Birkhoff averages against the invariant measures and Benford's law.
module.exports = (M, { ok, near }) => {
  // 1. three-gap theorem: at most three gap lengths, and with three the longest is the sum of the other two
  for (const a of M.ALPHAS.slice(0, 4)) for (const n of [2, 5, 17, 60, 233, 400]) {
    const d = M.distinctGaps(M.gapsOf(M.rotOrbit(a, n)).gaps, 1e-9);
    ok(d.length <= 3, `three gaps for alpha ${a}, n ${n}`); if (d.length === 3) near(d[2], d[0] + d[1], 1e-9);
  }
  { const g = M.gapsOf(M.rotOrbit(M.ALPHAS[0], 5)); near(g.gaps.reduce((s, x) => s + x, 0), 1, 1e-12); }
  // equidistribution: discrepancy of the golden rotation is O(log N / N); a rational rotation is stuck at 1/(2q) or more
  ok(M.starDisc(M.rotOrbit(M.ALPHAS[0], 1000)) < 3 * Math.log(1000) / 1000, 'golden rotation discrepancy');
  ok(M.starDisc(M.rotOrbit(3 / 8, 1000)) >= 1 / 16 - 1e-12, 'rational rotation does not equidistribute');
  near(M.arcVisits(M.rotOrbit(M.ALPHAS[1], 20000), 0.3, 0.2), 0.2, 2e-3);
  // 2. torus maps preserve area (unit determinant) and their inverses undo them
  const r = M.rng(3);
  for (const key of ['cat', 'baker', 'rotation']) for (let i = 0; i < 50; i++) {
    const x = r(), y = r(), [u, v] = M.MAPS[key].f(x, y), [x2, y2] = M.MAPS[key].inv(u, v);
    near(Math.abs(x2 - x) % 1, 0, 1e-12); near(Math.abs(y2 - y) % 1, 0, 1e-12);
  }
  near(M.catLyapunov(2000), Math.log((3 + Math.sqrt(5)) / 2), 1e-4);
  // cat map period on an N x N grid = half the Pisano period of the Fibonacci numbers mod N
  for (let N = 3; N <= 60; N++) near(M.catPeriod(N), M.pisano(N) / 2, 0.5);
  near(M.pisano(10), 60, 0.5); near(M.catPeriod(5), 10, 0.5);
  // mixing: the cat map spreads a disc evenly over S; the rotation does not
  { const c = M.mixCurve('cat', [0.3, 0.55], 0.17, [0.62, 0.12, 0.3], 20); for (let k = 8; k <= 20; k++) ok(Math.abs(c[k] - 0.09) < 0.025, `cat map mixed at step ${k}`); near(c[0], 0, 1e-12);
    const b = M.mixCurve('baker', [0.3, 0.55], 0.17, [0.62, 0.12, 0.3], 20); ok(Math.abs(b[18] - 0.09) < 0.025, 'baker mixed');
    const q = M.mixCurve('rotation', [0.3, 0.55], 0.17, [0.62, 0.12, 0.3], 60); ok(Math.max(...q.map((x) => Math.abs(x - 0.09))) > 0.08, 'rotation never mixes'); }
  // 3. Birkhoff averages against the invariant measures
  { const N = 200000;
    const d = M.birkhoff(M.doublingOrbit(0.2718, N).map((x) => x * x)); near(d[N - 1], 1 / 3, 0.01);
    const l = M.birkhoff(M.logisticOrbit(0.2718, N).map((x) => x * x)); near(l[N - 1], 3 / 8, 0.01);
    const o = M.logisticOrbit(0.31, N); near(o.reduce((s, x) => s + (x < 0.1 ? 1 : 0), 0) / N, M.logisticCdf(0.1), 0.01);
    near(M.logisticCdf(1), 1, 1e-12); near(M.logisticCdf(0.5), 0.5, 1e-12); }
  // the density integrates to the cdf (midpoint rule away from the endpoints)
  { let s = 0; const a = 0.1, b = 0.6, n = 4000; for (let i = 0; i < n; i++) s += M.logisticDensity(a + ((i + 0.5) * (b - a)) / n) * ((b - a) / n); near(s, M.logisticCdf(b) - M.logisticCdf(a), 1e-6); }
  // Benford: leading digits of 2^n, and the law sums to 1
  { const dg = M.powerDigits(2, 10000), cnt = new Array(10).fill(0); dg.forEach((x) => cnt[x]++);
    near(cnt[1], 3010, 0.5); near(cnt[9], 458, 0.5); near(M.powerDigits(2, 10)[9], 1, 0.5);
    near([1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((s, x) => s + M.benford(x), 0), 1, 1e-12); }
};
