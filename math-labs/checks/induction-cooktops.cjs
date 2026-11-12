// Induction cooktops: skin depth and surface resistance follow their formulas and scalings; the series resonant circuit
// peaks at f0 with P = V1^2 R/(R + r)^2, is symmetric in reactance, and conserves power; the heating ring integrates to
// its area and spreading conserves heat while filling in the centre.
module.exports = (M, { ok, near }) => {
  const P = M.PANS; near(M.skin(1e-7, 200, 24000), Math.sqrt(1e-7 / (Math.PI * 24000 * 4e-7 * Math.PI * 200)), 1e-12); near(M.skin(1e-7, 200, 24000) * 1000, 0.0726, 1e-3); near(M.skin(2.8e-8, 1, 24000) * 1000, 0.544, 1e-3);
  near(M.skin(1e-7, 1, 96000) / M.skin(1e-7, 1, 24000), 0.5, 1e-12); near(M.skin(1e-7, 400, 24000) / M.skin(1e-7, 100, 24000), 0.5, 1e-12);
  near(M.rs(P[0], 24000) * 1e3, 1.377, 2e-3); near(M.rs(P[3], 24000) * 1e3, 0.0515, 5e-4); near(M.rs(P[2], 24000), P[2].rho / P[2].t, 1e-12); ok(M.rs(P[0], 24000) > 20 * M.rs(P[3], 24000) && M.rs(P[1], 24000) > M.rs(P[4], 24000), 'magnetic metals resist far more');
  near(0.5 * M.rs(P[0], 24000) * M.sheetCurrent(P[0], 24000, 2000) ** 2 * 0.0226, 2000, 1e-6); near(M.sheetCurrent(P[0], 24000, 2000) / 1000, 11.3, 0.1); near(M.sheetCurrent(P[3], 24000, 2000) / 1000, 58.6, 0.2);
  near(M.f0(), 30975.5, 0.5); near(M.v1(), 146.30, 0.01); { const d = M.drive(M.f0(), 4); near(d.X, 0, 1e-6); near(d.P, 146.3014 ** 2 * 4 / 4.08 ** 2, 0.5); near(d.P + d.loss, M.v1() * d.I, 1e-6); }
  for (const R of [0.16, 1.1, 4]) { let best = 0, bf = 0; for (let f = 20000; f <= 60000; f += 5) { const p = M.drive(f, R).P; if (p > best) { best = p; bf = f; } } near(bf, M.f0(), 6); ok(M.drive(40000, R).P < best && M.drive(60000, R).P < M.drive(40000, R).P, 'power falls above resonance'); near(M.drive(38000, R).eff, R / (R + 0.08), 1e-12); }
  near(M.drive(38000, 4).P, 1483, 2); near(M.drive(38000, 4).I, 19.26, 0.02); near(M.drive(38000, 0.16).P, 83.3, 0.5); near(M.drive(33000, 0.02).Q, 155.7, 0.2); ok(M.drive(33000, 0.02).I > 2 * M.drive(33000, 4).I, 'no pan: far more current');
  near(M.ringHeat(0.06), 1, 1e-4); near(M.ringHeat(0), 0, 1e-4); near(M.ringHeat(0.03), 0.5, 1e-6); near(M.ringHeat(0.09), 0.5, 1e-6); near(M.ringHeat(0.12), 0, 1e-4);
  for (const p of P) { const len = M.spreadLen(p); ok(M.spread(0, len) >= M.ringHeat(0) && M.spread(0.06, len) <= 1 + 1e-9, 'spreading fills the centre and lowers the peak'); }
  ok(M.spread(0, M.spreadLen(P[3])) > M.spread(0, M.spreadLen(P[0])) && M.spread(0, M.spreadLen(P[0])) > M.spread(0, M.spreadLen(P[2])), 'thick, conductive bases spread heat best'); near(M.spread(0.05, 0), M.ringHeat(0.05), 1e-12);
  { let a = 0, b = 0; const len = 0.02; for (let x = -0.3; x <= 0.3; x += 0.0005) { a += M.ringHeat(Math.abs(x)); b += M.spread(Math.abs(x), len); } near(b / a, 1, 0.01); }
};
