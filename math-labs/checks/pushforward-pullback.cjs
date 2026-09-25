// Push-forward and pullback: the bilinear map and its inverse, the area formula with multiplicity, Stokes for the signed integral,
// push-forward of measures (mass, preimages, fold heights, closed-form densities), and the coarea formula against known laws.
module.exports = (M, { ok, near }) => {
  const TAU = 2 * Math.PI;
  // 1. bilinear map: the determinant is affine and matches finite differences; preimages invert the map
  const convex = [[0, 0], [1.6, 0.2], [1.9, 1.5], [0.2, 1.25]], folded = [[0, 0], [1.6, 0.2], [0.55, 0.35], [0.2, 1.25]];
  for (const P of [convex, folded]) {
    const B = M.bilinear(P), h = 1e-6;
    for (const [u, v] of [[0.2, 0.7], [0.9, 0.1], [0.5, 0.5]]) {
      const a = B.map(u + h, v), b = B.map(u - h, v), c = B.map(u, v + h), d = B.map(u, v - h);
      const J = ((a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])) / (4 * h * h);
      near(B.jac(u, v), J, 1e-6);
      const pre = B.preimages(B.map(u, v));
      ok(pre.some(([s, t]) => Math.abs(s - u) < 1e-8 && Math.abs(t - v) < 1e-8), 'preimages contain the original point');
    }
    // affine: the determinant at the centre is the mean of the four corners
    near(B.jac(0.5, 0.5), (B.jac(0, 0) + B.jac(1, 0) + B.jac(0, 1) + B.jac(1, 1)) / 4, 1e-12);
  }
  // a linear map (parallelogram): det = 2 everywhere, area 2, and the integral of x is 3
  { const P = [[0, 0], [2, 0], [3, 1], [1, 1]], B = M.bilinear(P);
    near(B.jac(0.3, 0.8), 2, 1e-12);
    near(M.pullIntegrals(B, () => 1, 80).abs, 2, 1e-12);
    near(M.pullIntegrals(B, (x) => x, 200).abs, 3, 1e-9); }
  // 2. area formula: with |det| the pulled-back integral equals the integral of f times the number of preimages, folded or not
  for (const P of [convex, folded]) {
    const B = M.bilinear(P);
    for (const f of M.INTEGRANDS) {
      const up = M.pullIntegrals(B, f, 240).abs, down = M.pushIntegrals(B, P, f, 360).mult;
      near(down / up, 1, 4e-3);
    }
    // Stokes: the signed integral of det D phi is the shoelace area of the corners, even when the map folds
    near(M.pullIntegrals(B, () => 1, 200).signed, M.shoelace(P), 1e-9);
  }
  // the folded map really covers a region twice, and the image alone undercounts
  { const B = M.bilinear(folded), I = M.pushIntegrals(B, folded, () => 1, 360);
    ok(I.twiceArea > 0.02, 'the folded map covers some area twice');
    ok(I.image < I.mult - 0.02, 'the image alone undercounts a folded map');
    near(I.mult - I.image, I.twiceArea, 1e-9);
    ok(Math.min(B.jac(0, 0), B.jac(1, 0), B.jac(0, 1), B.jac(1, 1)) < 0, 'folded map has a negative determinant somewhere'); }
  // 3. push-forward of measures on [0, 1]
  for (const kind of [0, 1]) {
    const S = M.source(kind);
    near(S.cdf(1) - S.cdf(0), 1, 1e-12);
    near(S.cdf(S.quantile(0.37)), 0.37, 1e-9);
    for (const a of [0.5, 1.6, 2.4]) {
      const T = M.T(a), Tp = M.Tp(a);
      // total mass is preserved, and bin masses add up
      let s = 0; for (let i = 0; i < 20; i++) s += M.massOf(S.cdf, M.preimageIntervals(T, i / 20, (i + 1) / 20));
      near(s, 1, 1e-9);
      // the density integrates each bin to the preimage mass (away from the folds, where it is smooth)
      const y0 = 0.05, y1 = 0.12, n = 400; let q = 0; for (let i = 0; i < n; i++) q += M.pushDensity(T, Tp, S.rho, y0 + (i + 0.5) * (y1 - y0) / n) * (y1 - y0) / n;
      near(q, M.massOf(S.cdf, M.preimageIntervals(T, y0, y1)), 2e-4);
    }
  }
  // closed form: uniform source, a < 1, density 1/(1 + a cos 2 pi x) at y = T(x); at y = 1/2 it is 1/(1 - a)
  { const a = 0.6, S = M.source(0), T = M.T(a), Tp = M.Tp(a);
    near(M.pushDensity(T, Tp, S.rho, 0.5), 1 / (1 - a), 1e-9);
    const x = 0.13, y = T(x); near(M.pushDensity(T, Tp, S.rho, y), 1 / (1 + a * Math.cos(TAU * x)), 1e-8);
    ok(M.roots(T, 0.3).length === 1, 'monotone map has one preimage'); }
  // fold heights: T' = 0 there, and a window just inside a fold pulls back to a region with two roots
  { const a = 1.6, T = M.T(a), Tp = M.Tp(a), [x1, x2] = M.caustics(a);
    near(Tp(x1), 0, 1e-12); near(Tp(x2), 0, 1e-12);
    const ys = T(x1); ok(M.roots(T, ys - 0.01).length === 3, 'just below the upper fold height there are three preimages');
    ok(M.caustics(0.9).length === 0, 'no folds for a <= 1');
    // uniform mean is preserved: the integral of T over [0, 1] is 1/2 because sin integrates to zero
    let m = 0; const n = 2000; for (let i = 0; i < n; i++) m += T((i + 0.5) / n) / n; near(m, 0.5, 1e-9); }
  // 4. coarea formula against closed forms
  const G = M.density2(0, 0), U = M.density2(1, 0);
  [0.3, 1, 2.2].forEach((c) => near(M.coarea(2, G, c, 0), c * Math.exp(-c * c / 2), 1e-9));           // Rayleigh
  [-1.3, 0, 0.8].forEach((c) => near(M.coarea(0, G, c, 0), M.normalPdf(c, 1), 1e-9));                // marginal
  { const r = 0.5, Gr = M.density2(0, r); [-2, 0.4, 1.7].forEach((c) => near(M.coarea(1, Gr, c, 0), M.normalPdf(c, 2 + 2 * r), 1e-8)); } // X + Y ~ N(0, 2 + 2r)
  [0.2, 0.9, 1.8].forEach((c) => near(M.coarea(3, G, c, 0), M.K0(c) / Math.PI, 1e-6));               // product of Gaussians: K0/pi
  [-1.5, 0.3, 1.2].forEach((c) => near(M.coarea(1, U, c, 1), (2 - Math.abs(c)) / 4, 2e-3));          // triangle
  [0.2, 0.7].forEach((c) => near(M.coarea(2, U, c, 1), Math.PI * c / 2, 2e-3));                      // uniform radius, c < 1
  [0.1, 0.5].forEach((c) => near(M.coarea(3, U, c, 1), -Math.log(c) / 2, 2e-3));                     // product of uniforms
  // the plane count agrees with the formula, and mass is conserved
  { const H = M.histogram(2, G, 0, 0, 4, 40, 800); near(H.total, 1, 1e-5);
    const bw = 0.1, cdf = (c) => 1 - Math.exp(-c * c / 2); [5, 12, 20].forEach((b) => near(H.dens[b], (cdf((b + 1) * bw) - cdf(b * bw)) / bw, 3e-3)); }
  ok(Math.abs(M.erf(0.5) - 0.5204998778) < 2e-7, 'erf(1/2)');
};
