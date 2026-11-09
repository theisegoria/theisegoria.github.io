// Random matrices: the eigenvalue solver reproduces known spectra and preserves the trace; Wigner matrices have
// second moment near 1 + 1/n and fourth near the Catalan number 2; the semicircle and Marchenko-Pastur densities
// integrate to 1 with the right means; beta-Hermite spectra fill [-2, 2]; unfolded spacings have mean 1 and the
// GOE spacings are far less often small than Poisson ones; Wigner surmises are normalised with mean 1; the BBP
// outlier formula meets the edge at theta = sqrt(gamma), and a sampled spiked covariance lands near it.
module.exports = (M, { ok, near }) => {
  const R = M.rng(11);
  const e3 = M.eigSym(Float64Array.from([2, 1, 0, 1, 2, 1, 0, 1, 2]), 3);
  near(e3[0], 2 - Math.SQRT2, 1e-9); near(e3[1], 2, 1e-9); near(e3[2], 2 + Math.SQRT2, 1e-9);
  const B = Float64Array.from([4, 1, 2, 3, 1, 3, 0, 1, 2, 0, 5, 2, 3, 1, 2, 6]), e4 = M.eigSym(B, 4);
  near(e4.reduce((a, b) => a + b, 0), 18, 1e-8);
  let s2 = 0; for (let i = 0; i < 16; i++) s2 += B[i] * B[i]; near(e4.reduce((a, b) => a + b * b, 0), s2, 1e-7);
  let m2 = 0, m4 = 0, N = 0;
  for (let k = 0; k < 12; k++) { const ev = M.eigSym(M.wigner(100, R, 0), 100); for (const x of ev) { m2 += x * x; m4 += x ** 4; N++; } }
  near(m2 / N, 1.01, 0.03); near(m4 / N, 2, 0.12);
  { let c2 = 0, n2 = 0; for (let k = 0; k < 6; k++) { const ev = M.eigSym(M.wigner(100, R, 1), 100); for (const x of ev) { c2 += x * x; n2++; } } near(c2 / n2, 1.01, 0.03); }
  near(M.quad(M.semicircle, -2, 2, 4000), 1, 2e-3);
  near(M.quad((x) => x * x * M.semicircle(x), -2, 2, 4000), 1, 2e-3);
  near(M.semiCDF(1) - M.semiCDF(-1), 1 / 3 + Math.sqrt(3) / (2 * Math.PI), 1e-12);
  near(M.catalan(4), 14, 0.5); near(M.catalan(5), 42, 0.5);
  for (const g of [0.1, 0.25, 0.5]) { const [a, b] = M.mpEdges(g); near(M.quad((x) => M.mpDensity(x, g), a, b, 20000), 1, 5e-3); near(M.quad((x) => x * M.mpDensity(x, g), a, b, 20000), 1, 5e-3); }
  const eb = M.betaHermite(300, 2, R); ok(eb[0] > -2.2 && eb[299] < 2.2 && eb[299] > 1.8, 'beta-Hermite edge near 2');
  for (const beta of [1, 2, 0]) {
    const sp = []; for (let k = 0; k < 8; k++) sp.push(...M.spacings(beta === 0 ? M.poissonLevels(200, R) : M.betaHermite(200, beta, R)));
    near(sp.reduce((a, b) => a + b, 0) / sp.length, 1, 0.06);
    const small = sp.filter((s) => s < 0.2).length / sp.length;
    if (beta === 0) ok(small > 0.12, 'Poisson levels cluster'); else ok(small < 0.06, 'eigenvalue levels repel');
  }
  for (const beta of [1, 2, 0]) { near(M.quad((s) => M.surmise(s, beta), 0, 12, 4000), 1, 1e-4); near(M.quad((s) => s * M.surmise(s, beta), 0, 12, 4000), 1, 1e-4); }
  near(M.surmiseCDF(0.1, 1), 1 - Math.exp(-Math.PI * 0.01 / 4), 1e-12);
  for (const g of [0.1, 0.25, 0.81]) near(M.bbpOutlier(Math.sqrt(g) + 1e-9, g), M.mpEdges(g)[1], 1e-6);
  near(M.bbpOutlier(1.5, 0.25), 2.5 * (1 + 0.25 / 1.5), 1e-12); near(M.bbpOverlap(1.5, 0.25), 0.7619047619, 1e-9);
  let tp = 0, ovl = 0; for (let k = 0; k < 8; k++) { const c = M.covSample(80, 320, 2, R); tp += c.top / 8; ovl += c.overlap / 8; } near(tp, M.bbpOutlier(2, 0.25), 0.25); near(ovl, M.bbpOverlap(2, 0.25), 0.12);
  const c0 = M.covSample(80, 320, 0, R); near(c0.top, M.mpEdges(0.25)[1], 0.35);
};
