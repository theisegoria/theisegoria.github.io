// Quartz: beam frequency and its scaling, the cantilever mode (boundary conditions, eigenvalue), BVD resonances from the full impedance, the load-pulling formula against the exact root, and the temperature/inhibition arithmetic.
module.exports = (M, { ok, near }) => {
  // beam frequency: 880 t / L^2 in SI; the 32768 Hz length for 0.2 mm; t/L^2 scaling
  near(M.forkFreq(1, 1) , 880.49, 0.05); near(M.lengthFor(32768, 0.2e-3) * 1e3, 2.318, 1e-3); near(M.forkFreq(M.lengthFor(32768, 0.2e-3), 0.2e-3), 32768, 1e-6);
  near(M.forkFreq(2e-3, 0.4e-3) / M.forkFreq(2e-3, 0.2e-3), 2, 1e-12); near(M.forkFreq(1e-3, 0.2e-3) / M.forkFreq(2e-3, 0.2e-3), 4, 1e-12);
  // clamped-free mode: w(0) = w'(0) = 0, w''(1) = w'''(1) = 0 (numerically), cos(b) cosh(b) = -1 for the eigenvalue
  near(Math.cos(M.BETA1) * Math.cosh(M.BETA1), -1, 1e-9); near(M.modeShape(0), 0, 1e-12); near(M.modeShape(1), 1, 1e-12);
  { const h = 1e-4, w = M.modeShape; near((w(h) - w(0)) / h, 0, 1e-3); const d2 = (x) => (w(x + h) - 2 * w(x) + w(x - h)) / (h * h); near(d2(1 - h) / d2(0.5), 0, 5e-3); }
  near(M.divide(32768), 1, 1e-15); near(M.ppmToSecPerDay(1), 0.0864, 1e-12);
  // BVD: L1, Q, and the resonances found in the full impedance
  const C1 = 2e-15, C0 = 1.3e-12, R1 = 35e3, fs = 32768, L1 = M.motionalL(fs, C1);
  near(L1, 11795.3, 0.1); near(M.qFactor(fs, L1, R1), 69386, 1); near(M.parallelOffset(C1, C0) * 1e6, 768.9, 0.1);
  { // |Z| is minimal near fs and maximal near fp
    let best = [Infinity, 0], worst = [0, 0];
    for (let p = -50; p <= 1000; p += 0.25) { const z = M.bvdZ(fs * (1 + p * 1e-6), R1, L1, C1, C0); if (z.mag < best[0]) best = [z.mag, p]; if (z.mag > worst[0]) worst = [z.mag, p]; }
    near(best[1], 0, 1); near(worst[1], M.parallelOffset(C1, C0) * 1e6, 1.5); near(best[0], R1, R1 * 0.01); }
  // load pulling: the first-order formula against the exact zero-reactance frequency with a series C_L
  for (const CL of [6e-12, 12.5e-12, 20e-12]) { const fe = M.loadFreqExact(fs, R1, L1, C1, C0, CL); near((fe / fs - 1) * 1e6, M.loadOffset(C1, C0, CL) * 1e6, 0.5); }
  near(M.loadOffset(C1, C0, 12.5e-12) * 1e6, 72.46, 0.01);
  // temperature and inhibition
  near(M.tempOffset(35), -3.4, 1e-12); near(M.tempOffset(15), -3.4, 1e-12); near(M.tempOffset(25), 0, 1e-15); near(M.INHIBIT_STEP, 0.5086, 1e-4);
  near(M.dailyAverage(31, 20, 16, 20) - (M.CUT_FAST - 20 * M.INHIBIT_STEP), -1.0993, 1e-4);
  // variance rule: alternating 31 and 19 for 12 h each averages 25 C but loses beta * 36
  near(M.dailyAverage(31, 19, 12, 0) - M.CUT_FAST, -0.034 * 36, 1e-12);
  ok(Math.abs(M.dailyAverage(31, 20, 16, 20, true) - (M.CUT_FAST - 20 * M.INHIBIT_STEP)) < 0.06, 'compensation removes most of the parabola');
};
