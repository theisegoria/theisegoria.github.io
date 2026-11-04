// Murray's law: the closed-form optimal radius minimises the vessel cost (scan); at it the wall shear stress is sqrt(b mu)
// for any flow and pumping is half the upkeep; Q_opt(r_opt) recovers Q; the cost ratio formula matches the model; the
// weighted Fermat point balances the three pulls and is the minimum of the junction cost; with cube-law radii its
// branching angles equal Murray's formula (symmetric case 37.47 degrees) and the daughters' cubes add up to the
// parent's; in a tree the cube law is the cheapest exponent and keeps the shear stress constant; the worked numbers hold.
module.exports = (M, { ok, near }) => {
  const PI = Math.PI, R = M.REF;
  for (const [Q, mu, b] of [[1e-6, 3.5e-3, 1930], [5e-6, 1.2e-3, 500], [5e-8, 6e-3, 5000]]) {
    const r = M.rOpt(Q, mu, b), P = (x) => M.seg(x, Q, mu, b).total, Ps = P(r);
    let best = Infinity; for (let i = 1; i < 4000; i++) best = Math.min(best, P((r * i) / 1000));
    ok(Ps <= best * (1 + 1e-12), 'closed-form r* is the scanned minimum');
    ok(P(r * 0.99) > Ps && P(r * 1.01) > Ps, 'r* is a strict minimum');
    near(M.tau(r, Q, mu), M.tauOpt(mu, b), 1e-9 * M.tauOpt(mu, b));
    const s = M.seg(r, Q, mu, b); near(s.pump / s.vol, 0.5, 1e-12);
    near(s.total, 1.5 * b * PI * r * r, 1e-12 * s.total);
    near(M.qOpt(r, mu, b), Q, 1e-12 * Q);
    for (const rho of [0.5, 0.8, 1.3, 2]) near(P(rho * r) / Ps, M.costRatio(rho), 1e-12);
  }
  // the worked example
  const r1 = M.rOpt(R.Q, R.mu, R.b); near(r1 * 1e3, 1.197, 0.0005); near(M.tauOpt(R.mu, R.b), 2.599, 0.001);
  near(M.seg(0.8e-3, R.Q, R.mu, R.b).total / M.seg(r1, R.Q, R.mu, R.b).total, 1.968, 0.001);
  near(M.costRatio(0.5), 5.5, 1e-12);
  // junctions
  for (const s of [0.5, 0.62, 0.75, 0.9]) {
    const B = M.bifurcation(s, 3), F = M.fermat(B), pl = M.pull(F.J, B);
    ok(F.vertex === -1, 'interior junction');
    near(Math.hypot(...pl.f) / B.w[0], 0, 1e-9);
    near(B.r[1] ** 3 + B.r[2] ** 3, B.r[0] ** 3, 1e-12 * B.r[0] ** 3);
    const a = M.anglesAt(F.J, B), m = M.murrayAngles(...B.r);
    near(a[0], m.th1, 1e-6); near(a[1], m.th2, 1e-6);
    near(B.w[1] / B.w[0], (B.r[1] / B.r[0]) ** 2, 1e-9);                    // pulls go as r^2 under the cube law
    const C = M.cost(F.J, B);
    for (const d of [[0.05, 0], [0, 0.05], [-0.04, 0.03], [0.02, -0.06]]) ok(M.cost([F.J[0] + d[0], F.J[1] + d[1]], B) > C, 'Fermat point is the minimum');
  }
  near(M.murrayAngles(1, 2 ** (-1 / 3), 2 ** (-1 / 3)).th1, (Math.acos(2 ** (-1 / 3)) * 180) / PI, 1e-9);
  near(M.murrayAngles(1, 2 ** (-1 / 3), 2 ** (-1 / 3)).th1, 37.467, 0.001);
  near(M.fermat(M.bifurcation(0.5, 3)).J[1], -1.175, 0.001);
  // a tiny side branch leaves at nearly a right angle
  { const r2 = 0.05, r1 = Math.cbrt(1 - r2 ** 3); const m = M.murrayAngles(1, r1, r2); ok(m.th2 > 87 && m.th2 < 90, 'small branch near 90 degrees'); near(Math.cos((m.th2 * PI) / 180), (2 / 3) * r2, 0.002); }
  // trees: the cube law is the cheapest exponent, and others cost more on both sides
  for (const [G, s] of [[5, 0.5], [7, 0.5], [6, 0.7], [8, 0.8]]) {
    near(M.treeCostRatio(G, s, 3), 1, 1e-12);
    for (const k of [2, 2.5, 2.9, 3.1, 3.5, 4]) ok(M.treeCostRatio(G, s, k) > 1, 'k != 3 costs more');
    const segs = M.treeSegs(G, s); near(segs.length, 2 ** (G + 1) - 1, 0.5);
  }
  near(M.treeCostRatio(7, 0.5, 2), 1.2967, 0.0005);
  for (const g of [1, 4, 9]) { near(M.tauRatio(g, 0.5, 3), 1, 1e-12); near(M.speedRatio(g, 0.5, 2), 1, 1e-12); near(M.speedRatio(g, 0.5, 3), 2 ** (-g / 3), 1e-12); }
  ok(M.tauRatio(5, 0.5, 2) > 1 && M.tauRatio(5, 0.5, 4) < 1, 'shear drifts up for k < 3 and down for k > 3');
};
