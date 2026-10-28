// Stellar astrophysics: Lane-Emden against its three closed-form solutions (n = 0, 1) and the tabulated n = 3/2 and 3 constants,
// the polytrope identities (virial binding energy, mass profile), the Sun as an n = 3 star, the main-sequence relations at the
// Sun and at their joints, Stefan-Boltzmann and Wien, the black-body colour, and the Chandrasekhar white dwarf: the relativistic
// limit M_Ch, the non-relativistic R ~ M^(-1/3) law, and agreement of the two closed forms with the numerical structure.
module.exports = (M, { ok, near }) => {
  // 1. Lane-Emden
  { const a = M.lane(0); near(a.xi1, Math.sqrt(6), 1e-6); near(a.D, 2 * Math.sqrt(6), 1e-5); near(M.rhoRatio(0), 1, 1e-6); near(M.pcCoef(0), 3 / (8 * Math.PI), 1e-6); }
  { const a = M.lane(1); near(a.xi1, Math.PI, 1e-5); near(a.D, Math.PI, 1e-5); near(M.rhoRatio(1), Math.PI ** 2 / 3, 1e-5);
    for (const xi of [0.5, 1.7, 2.9]) near(M.leAt(a, xi)[0], Math.sin(xi) / xi, 2e-6); }
  { const a = M.lane(1.5); near(a.xi1, 3.65375, 2e-5); near(a.D, 2.71406, 2e-5); near(M.rhoRatio(1.5), 5.99071, 1e-4); }
  { const a = M.lane(3); near(a.xi1, 6.89685, 2e-5); near(a.D, 2.01824, 2e-5); near(M.rhoRatio(3), 54.1825, 1e-3); }
  ok(M.lane(4.5).xi1 > M.lane(4).xi1 && M.lane(4).xi1 > M.lane(3).xi1 && M.lane(3).xi1 > M.lane(2).xi1, 'xi_1 grows with n');
  ok(M.rhoRatio(4) > M.rhoRatio(3) && M.rhoRatio(3) > M.rhoRatio(1.5), 'centre condenses as n grows');
  // 2. identities
  for (const n of [0.5, 1.5, 2.5, 3.5]) { near(M.profile(n, 1).m, 1, 1e-9); near(M.profile(n, 0.0001).m, 0, 1e-8); near(M.profile(n, 1e-4).rho, 1, 1e-5);
    const h = M.massRadius(n, 0.5); near(M.profile(n, h).m, 0.5, 1e-9); ok(h < 1 && M.massRadius(n, 0.9) > h, 'half mass inside 90%'); }
  { // virial: for an ideal-gas polytrope, 3 integral P dV = -Omega / ... : check E_th = |Omega|/2 with P = rho k T / mu m_u via the profile integral
    for (const n of [1.5, 3]) { const le = M.lane(n); let sP = 0, N = 4000; for (let i = 0; i < N; i++) { const s = (i + 0.5) / N; sP += M.profile(n, s).P * 4 * Math.PI * s * s / N; }   // integral of P dV in units of Pc R^3
      const Wn = M.pcCoef(n); const lhs = 3 * sP * Wn;                                                                                                                              // 3 int P dV / (G M^2 / R)
      near(lhs, M.bindCoef(n), 2e-3); void le; } }
  { // the Sun as an n = 3 star (Eddington standard model): central temperature about 12 MK, central density about 76 g/cm^3
    const p = M.physical(3, 1, 1, 0.6); near(p.Tc / 1e6, 11.76, 0.05); near(p.rhoc / 1000, 76.4, 0.2); near(p.rbar / 1000, 1.41, 0.01); }
  // 3. main sequence
  near(M.msL(1), 1, 1e-12); near(M.msR(1), 1, 1e-12); near(M.teffOf(M.msL(1), M.msR(1)), 5772, 1e-9);
  for (const j of [0.43, 2, 55]) near(M.msL(j * (1 + 1e-9)) / M.msL(j * (1 - 1e-9)), 1, 5e-2);
  ok(M.msL(10) / M.msL(5) > 8 && M.msL(10) / M.msL(5) < 12, 'L ~ M^3.5 at intermediate masses');
  { const m = 7.3, L = M.msL(m), R = M.msR(m), T = M.teffOf(L, R); near(M.lumOf(R, T), L, 1e-9 * L); near(M.radiusOf(L, T), R, 1e-9 * R); }
  near(M.lifetimeYr(1, 1) / 1e9, 10.4, 0.1); ok(M.lifetimeYr(10, M.msL(10)) < M.lifetimeYr(1, 1) / 100, 'massive stars die young');
  near(M.wienNm(5772), 502, 0.5); near(M.wienNm(2897.771955), 1000, 1e-6);
  { const T = 5772, sb = M.SIG * T ** 4; let s = 0, N = 40000; for (let i = 1; i <= N; i++) { const lam = i * 5e-9 * 20; s += M.planck(lam * 1e9, T) * 20 * 5e-9; } near(Math.PI * s / sb, 1, 3e-3); }   // pi * integral B_lambda = sigma T^4
  { const [r, g, b] = M.bbRGB(2500), [r2, g2, b2] = M.bbRGB(30000); ok(r > g && g > b && b2 > r2, 'cool stars are red, hot stars blue'); near(Math.max(...M.bbRGB(6500)), 1, 1e-12); }
  // 4. white dwarfs
  near(M.chandraMass(2), 1.4563, 2e-3); near(M.chandraMass(1) / M.chandraMass(2), 4, 1e-9); near(M.chandraMass(56 / 26), 1.4563 * 4 / (56 / 26) ** 2, 2e-3);
  { const w = M.whiteDwarf(1e9, 2); near(w.Msun, 0.40, 0.02); near(w.Rearth, 1.72, 0.05); near(w.xc, M.xOfRho(1e9, 2), 1e-12); }   // 1e6 g/cm^3 white dwarf
  { const big = M.whiteDwarf(1e14, 2); ok(big.Msun < M.chandraMass(2) && big.Msun > 0.99 * M.chandraMass(2), 'mass tends to M_Ch from below'); }
  { const a = M.whiteDwarf(1e7, 2), b = M.whiteDwarf(1e8, 2); near(a.R / M.nrRadius(a.Msun, 2), 1, 0.03); near(Math.log(b.R / a.R) / Math.log(b.M / a.M), -1 / 3, 0.03); }
  { const rows = M.wdTable(2); for (let i = 1; i < rows.length; i++) { ok(rows[i].Msun > rows[i - 1].Msun && rows[i].Rearth < rows[i - 1].Rearth, 'M rises and R falls with density'); } }
  near(M.rhoOfX(M.xOfRho(3.3e8, 2), 2), 3.3e8, 1e-3);
  { const A = Math.PI * M.ME ** 4 * M.CL ** 5 / (3 * M.HP ** 3); const x = 0.01; near(M.pDeg(x) / (A * 8 / 5 * x ** 5), 1, 1e-3); const y = 200; near(M.pDeg(y) / (A * 2 * y ** 4), 1, 2e-4); }   // x^5 and x^4 limits of the degenerate pressure
};
