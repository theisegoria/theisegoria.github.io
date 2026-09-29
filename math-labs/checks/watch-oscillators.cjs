// Watch oscillators: frequencies and stiffness, the regulator's half-rate law, Airy's theorem against direct integration of a kicked damped oscillator, and the J1(A)/A poise law against direct integration with gravity.
module.exports = (M, { ok, near }) => {
  near(M.freqOf(28800), 4, 1e-12); near(M.freqOf(18000), 2.5, 1e-12); near(M.periodOf(M.I_BAL, M.kappaFor(4)), 0.25, 1e-12);
  near(M.kappaFor(4), 7.5799e-7, 1e-10); near(M.energyStored(M.kappaFor(4), 270 * Math.PI / 180) * 1e6, 8.416, 1e-3); near(M.powerNeeded(M.kappaFor(4), 270 * Math.PI / 180, 4, 250) * 1e6, 0.846, 1e-3);
  // regulator: 0.2 permille shorter gains 8.6 s/day; small changes follow 43200 dL
  near(M.regulatorRate(-0.0002), 8.64, 0.01); near(M.regulatorRate(1e-6) / 1e-6, -43200, 1); ok(M.regulatorRate(0) === 0, 'no change, no rate');
  // timegrapher: beat 0 is tic, beat 1 toc; after one day at +10 s/day the deviation is 10 s
  near(M.tickDeviation(2 * 4 * 86400, 4, 10, 0), 10, 1e-9); near(M.tickDeviation(0, 4, 0, 0.001) - M.tickDeviation(1, 4, 0, 0.001), 0.001, 1e-12);
  // Airy: zero shift at the centre, sign rules, the closed form, and agreement with integration
  near(M.airyPhaseShift(0.1, 0), 0, 1e-15); ok(M.airyPhaseShift(0.1, -0.2) > 0 && M.airyPhaseShift(0.1, 0.2) < 0, 'before the centre advances, after retards');
  near(M.airyRate(-2 * Math.PI / 180, 270 * Math.PI / 180, 250), 1.28, 0.01); near(M.airyRate(-2 * Math.PI / 180, 180 * Math.PI / 180, 250), 1.92, 0.01); near(M.airyRate(0, 3, 250), 0, 1e-12);
  { // integrate at Q = 60 with kicks 10 degrees before the centre (unit frequency); the measured amplitude sets sin(Phi) in the formula
    const Q = 60, thi = -10 * Math.PI / 180, A = 1.5, eps = M.airyEps(thi, A, Q); const r = M.simulateEscapement(thi, eps, Q, 1, 300, A);
    ok(r.amp > 1 && r.amp < 1.6, 'a steady amplitude is reached'); near(r.rate / M.airyRate(thi, r.amp, Q), 1, 0.08);
    // kicks at the centre: only the damped-oscillator correction 1/(8Q^2) remains
    const r0 = M.simulateEscapement(0.0, M.airyEps(0, A, Q), Q, 1, 300, A); near(r0.rate, -86400 / (8 * Q * Q), 1); }
  // Bessel J1: known values and the first zero at 219.54 degrees
  near(M.J1(1), 0.4400505857, 1e-9); near(M.J1(M.J1_ZERO), 0, 1e-12); near(M.J1_ZERO * 180 / Math.PI, 219.54, 0.01); near(M.J1(1e-6) / 1e-6, 0.5, 1e-9);
  // poise error: 20 ug mm, spot down, 150 degrees gains about 4.0 s/day; opposite position reverses; above 219.5 degrees the sign flips
  const mr = 20e-12, A150 = 150 * Math.PI / 180, A270 = 270 * Math.PI / 180;
  near(M.poiseRate(mr, 0, A150), 3.98, 0.03); near(M.poiseRate(mr, Math.PI, A150), -3.98, 0.03); near(M.poiseRate(mr, Math.PI / 2, A150), 0, 1e-12); near(M.poiseRate(mr, 0, A270), -1.34, 0.02);
  // direct integration agrees with the averaged formula (larger unbalance so the effect dominates the integration error)
  for (const [alpha, A] of [[0, A150], [0, A270], [Math.PI / 3, 200 * Math.PI / 180]]) { const big = 500e-12, sim = M.simulatePoise(big, alpha, A), th = M.poiseRate(big, alpha, A); near(sim, th, Math.max(1.5, 0.06 * Math.abs(th))); }
  ok(M.POS_OFFSET.length === 5 && M.POS_OFFSET[0] === null, 'five positions, dial up has no offset');
};
