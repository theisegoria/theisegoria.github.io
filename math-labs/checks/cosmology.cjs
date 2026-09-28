// Cosmology: ages against closed forms, the deceleration parameter, the acceleration onset, Hogg's distances, the D_A turnover, horizons and the fate classifier.
module.exports = (M, { ok, near }) => {
  const H0 = M.H0_DEFAULT, G = M.GYR_PER_HUBBLE(H0), cH = M.MPC_PER_HUBBLE(H0) / 1000; // Gyr per 1/H0, Gpc per c/H0
  near(G, 14.44, 0.01);
  // 1. ages: Einstein-de Sitter (2/3)/H0, the empty universe 1/H0, LCDM 13.8 Gyr
  near(M.age(1, 0) * G, (2 / 3) * G, 0.005 * (2 / 3) * G);
  near(M.age(0, 0), 1, 1e-6);
  near(M.age(0.31, 0.69) * G, 13.8, 0.1);
  // flat LCDM has a closed form: t0 = (2 / 3 sqrt(OL)) asinh(sqrt(OL / Om))
  near(M.age(0.31, 0.69), (2 / (3 * Math.sqrt(0.69))) * Math.asinh(Math.sqrt(0.69 / 0.31)), 1e-6);
  // 2. deceleration parameter
  near(M.q0(0.31, 0.69), 0.31 / 2 - 0.69, 1e-15);
  near(M.q0(1, 0), 0.5, 1e-15);
  // 3. acceleration onset: the integrator's minimum of adot sits at a^3 = Om / (2 OL)
  const tr = M.trajectory(0.31, 0.69, 40 / G, -40 / G), on = M.accelOnset(tr);
  near(on.a, M.aAccel(0.31, 0.69), 1e-3);
  near(on.a ** 3, 0.31 / (2 * 0.69), 2e-3);
  ok(tr.bang !== null && Math.abs(tr.bang - M.age(0.31, 0.69)) < 1e-3, 'integrator reaches the big bang at t = -t0');
  // 4. distances (Hogg 2000): D_C(z = 1) about 3.4 Gpc for LCDM, D_L = (1 + z) D_C when flat, D_A = D_C / (1 + z)
  near(M.comoving(1, 0.31, 0.69) * cH, 3.4, 0.02 * 3.4);
  near(M.DL(1, 0.31, 0.69), 2 * M.comoving(1, 0.31, 0.69), 1e-12);
  near(M.DA(1, 0.31, 0.69), M.comoving(1, 0.31, 0.69) / 2, 1e-12);
  // the empty universe has D_M = sinh(D_C) with D_C = ln(1 + z): D_L = z (1 + z / 2)
  near(M.DL(1, 0, 0), 1.5, 1e-6);
  near(M.DL(3, 0, 0), 3 * 2.5, 1e-6);
  // the distance table agrees with the direct quadrature
  const tab = M.distanceTable(0.31, 0.69); near(tab.DC[100], M.comoving(1, 0.31, 0.69), 1e-6); near(tab.TL[1000], M.lookback(10, 0.31, 0.69), 1e-6);
  // 5. D_A turns over near z = 1.6 for LCDM, and Etherington D_L / D_A = (1 + z)^2 in a closed model too
  near(M.zDAmax(0.31, 0.69), 1.6, 0.05);
  near(M.DL(2, 1.2, 0.3) / M.DA(2, 1.2, 0.3), 9, 1e-12);
  // 6. horizons (Davis and Lineweaver 2004): particle horizon 46 Gly, event horizon 16 Gly, Hubble radius 1/H0
  const ct = M.conformalTable(0.31, 0.69, M.OR_PLANCK);
  near(ct.eta0 * G, 46, 1);
  ok(ct.finite, 'LCDM has a finite conformal future');
  near((ct.etaInf - ct.eta0) * G, 16, 1);
  near(M.hubbleSphere(1, 0.31, 0.69), 1, 1e-15);
  near(ct.t0 * G, 13.8, 0.1);
  // Einstein-de Sitter: eta = 2 sqrt(a) / H0 exactly, eta_inf = infinity, no event horizon
  const eds = M.conformalTable(1, 0);
  near(eds.eta0, 2, 1e-4);
  near(eds.etaOfA(0.25), 1, 1e-4);
  ok(!eds.finite && eds.etaInf === Infinity, 'Einstein-de Sitter has no event horizon');
  ok(Number.isFinite(M.eventHorizon(ct, ct.eta0)) && !Number.isFinite(M.eventHorizon(eds, eds.eta0)), 'event horizon finite only with Lambda');
  // 7. fate classifier and the two boundaries against Carroll, Press and Turner
  ok(M.classify(3, 0) === 'recollapse', 'closed matter universe recollapses');
  ok(M.trajectory(3, 0, 2000 / G, 0).crunch !== null, 'the integrator reaches the crunch');
  ok(M.classify(1, 3) === 'bounce', 'Om = 1, OL = 3 has no big bang');
  ok(M.classify(0.31, 0.69) === 'forever' && M.classify(0.31, -0.2) === 'recollapse', 'LCDM expands forever, negative Lambda recollapses');
  for (const Om of [0.2, 0.31, 1, 2.5]) near(M.bounceBoundary(Om), M.bounceClosed(Om), 1e-9);
  for (const Om of [1.5, 3]) near(M.recollapseBoundary(Om), M.recollapseClosed(Om), 1e-9);
};
