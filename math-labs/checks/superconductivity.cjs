// Superconductivity: the modified spherical Bessel function and its derivative are continuous across the series
// switch and match finite differences; the London sphere's induced moment equals the closed form
// 1 - 3 coth(a)/a + 3/a^2 for every size, the field is continuous across the surface and uniform far away, the
// inside obeys the London equation, a large sphere expels the field (B_r = 0 on the surface, 1.5 B0 at the
// equator, ~0 at the centre) and a small one does not; traced field lines keep the flux function constant;
// K0 and K1 match tabulated values; a vortex lattice carries exactly one flux quantum per unit cell; the GL
// minimum is |psi|^2 = 1 - t with energy -(1 - t)^2 / 2.
module.exports = (M, { ok, near }) => {
  for (const x of [1e-4, 0.05, 0.2999, 0.3001, 1, 4, 20]) {
    const h = 1e-5 * Math.max(1, x);
    near(M.i1p(x), (M.i1(x + h) - M.i1(x - h)) / (2 * h), 1e-6 * Math.max(1, M.i1(x)));
  }
  near(M.i1(0.2999), M.i1(0.3001), 1e-4); near(M.i1p(0.2999), M.i1p(0.3001), 1e-4);
  for (const a of [0.01, 0.3, 1, 2, 5, 12, 40, 150]) {
    const S = M.londonSphere(a);
    near(S.f, M.momentClosed(a), 1e-7);
    // continuity of both field components at r = 1
    for (const th of [0.3, 1.1, 2.4]) { const i = S.B(1 - 1e-9, th), o = S.B(1 + 1e-9, th); near(i[0], o[0], 1e-6); near(i[1], o[1], 1e-6); }
    // far field is uniform B0 along z
    const far = S.Bcyl(0.3, 60); near(far[1], 1, 2e-4); near(far[0], 0, 2e-4);
    // London equation inside: g'' + 2 g'/r - 2 g / r^2 = a^2 g
    if (a < 60) for (const r of [0.4, 0.8]) {
      const e = 1e-4, g = S.g, d2 = (g(r + e) - 2 * g(r) + g(r - e)) / (e * e), d1 = (g(r + e) - g(r - e)) / (2 * e);
      near((d2 + 2 * d1 / r - 2 * g(r) / (r * r)) / Math.max(1e-12, Math.abs(a * a * g(r))), 1, 2e-3);
    }
    // traced lines keep Psi constant
    const ln = M.fieldLine(S, 0.5);
    ok(ln.length > 20, 'field line traced');
    ln.slice(0, 40).forEach(([rho, z]) => { const r = Math.hypot(rho, z), s = rho / r; near(S.h(r) * s * s, 0.5, 1e-6); });
  }
  { const S = M.londonSphere(300); near(S.f, 1 - 3 / 300 + 3 / 90000, 1e-6); near(S.B(1.0000001, 0.8)[0], 0, 0.02); near(S.Beq, 1.5 - 1.5 / 300, 2e-3); ok(S.Bcentre < 1e-10, 'field expelled from centre'); }
  { const S = M.londonSphere(0.001); ok(S.f < 1e-6 && Math.abs(S.Bcentre - 1) < 1e-6, 'small sphere is transparent'); }
  near(M.lambdaT(0), 1, 1e-12); near(M.lambdaT(0.9), 1 / Math.sqrt(1 - 0.6561), 1e-12); ok(M.lambdaT(1) === Infinity, 'lambda diverges at Tc');
  // Bessel K0, K1 against tables (Abramowitz and Stegun)
  near(M.K0(0.1), 2.4270690247, 2e-7); near(M.K0(1), 0.4210244382, 2e-7); near(M.K0(2), 0.1138938727, 2e-7); near(M.K0(3), 0.0347395044, 2e-7); near(M.K0(6), 0.0012439943, 2e-8);
  near(M.K1(0.5), 1.656441120, 3e-7); near(M.K1(1), 0.6019072302, 3e-7); near(M.K1(4), 0.0124834983, 3e-8);
  // flux quantisation: the mean field over a cell is 2 pi / A, i.e. one flux quantum per cell
  for (const a of [0.6, 1.3, 2.5]) {
    const A = M.cellArea(a), n = 48, hgt = a * Math.sqrt(3) / 2; let s = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, v = (j + 0.5) / n; s += M.latticeB(a, u * a + v * a / 2, v * hgt); }
    near(s / (n * n) / (2 * Math.PI / A), 1, 0.012);
  }
  for (const bb of [0.01, 0.5, 30]) near(M.cellArea(M.spacingFromB(bb)), 2 * Math.PI / bb, 1e-9);
  // lattice field is periodic and largest at the vortices
  { const a = 1.2, t = M.latticeTable(a); near(t.at(0.31, 0.2), t.at(0.31 + a, 0.2), 1e-9); near(t.at(0.31, 0.2), t.at(0.31 + a / 2, 0.2 + a * Math.sqrt(3) / 2), 1e-9); ok(M.latticeB(a, 0.05, 0) > M.latticeB(a, a / 2, a / (2 * Math.sqrt(3))), 'peak at vortex'); }
  // Ginzburg-Landau
  for (const t of [0, 0.4, 0.9, 1, 1.3]) {
    let best = Infinity, arg = 0; for (let i = 0; i <= 4000; i++) { const m = 1.5 * i / 4000, f = M.glF(t, m); if (f < best) { best = f; arg = m; } }
    near(best, M.glFmin(t), 1e-6); near(arg * arg, M.glPsi2(t), 2e-3);
  }
};
