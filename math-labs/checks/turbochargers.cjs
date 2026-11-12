// Turbochargers: compressor outlet temperature follows the adiabatic law with efficiency; density ratio is pressure
// ratio times T1/T; shaft speed and pressure ratio invert each other; steady boost balances turbine and compressor
// power under the wastegate cap; spool-up conserves energy and is slower for bigger rotors.
module.exports = (M, { ok, near }) => {
  near(M.compT(1), 298, 1e-12); near(M.compT(2, 1), 298 * 2 ** (0.4 / 1.4), 1e-9); near(M.compT(2, 1) - 273, 90.27, 0.01); near(M.compT(2) - 273, 115.65, 0.01); near((M.compT(2) - 298) * 0.72, M.compT(2, 1) - 298, 1e-9);
  near(M.coolT(2, 0), M.compT(2), 1e-12); near(M.coolT(2, 1), 298, 1e-12); near(M.coolT(2, 0.7) - 273, 52.19, 0.01); near(M.densityRatio(2, 0), 1.5335, 1e-4); near(M.densityRatio(2, 0.7), 1.8328, 1e-4); near(M.densityRatio(2, 1), 2, 1e-12); near(M.densityRatio(1, 0.5), 1, 1e-12);
  for (let pr = 1.1; pr <= 3.5; pr += 0.2) { ok(M.densityRatio(pr, 0) < pr && M.densityRatio(pr, 0.7) > M.densityRatio(pr, 0), 'hot air is thinner; cooling recovers density'); ok(M.densityRatio(pr, 0, 0.85) > M.densityRatio(pr, 0, 0.6), 'a better compressor delivers denser air'); }
  near(M.work(2), 91100.6, 0.5); near(M.tipSpeed(2), 327.38, 0.01); near(0.85 * M.tipSpeed(2) ** 2, M.work(2), 1e-6); near(M.shaftRpm(2), 125050, 5); near(M.shaftRpm(2, 2), M.shaftRpm(2) / 2, 1e-6);
  for (const pr of [1.2, 1.6, 2, 2.8]) for (const s of [0.7, 1, 1.4]) near(M.prFromOmega(M.shaftRpm(pr, s) * 2 * Math.PI / 60, s), pr, 1e-9);
  near(M.airflow(3000, 1) * 1000, 53.28, 0.01); near(M.airflow(3000, 2) * 1000, 97.65, 0.01); near(M.airflow(6000, 1) / M.airflow(3000, 1), 2, 1e-12); near(M.enginePower(M.airflow(3000, 2)) / 1000, 97.12, 0.01); near(M.enginePower(M.airflow(3000, 1)) / 1000, 52.99, 0.01);
  { const m = M.airflow(3000, 2); near(M.expansion(m, 1), 2.5054, 1e-3); near(M.turbineP(m, 1), 17879, 2); near(M.compP(m, 2), 8895.9, 0.5); ok(M.turbineP(m, 0.7) > M.turbineP(m, 1) && M.turbineP(m, 1.3) < M.turbineP(m, 1), 'a tighter turbine extracts more from the same flow'); near(M.compP(m, 1), 0, 1e-9); }
  near(M.steadyPR(3000, 1, 2), 2, 1e-12); near(M.steadyPR(1500, 1, 2), 1.3631, 1e-3); near(M.steadyPR(1500, 0.7, 2), 2, 1e-12); near(M.steadyPR(2000, 1.3, 2), 1.4003, 1e-3);
  { const pr = M.steadyPR(1500, 1, 2), m = M.airflow(1500, pr); near(M.turbineP(m, 1), M.compP(m, pr), 0.01); } let prev = 1; for (let r = 1000; r <= 6000; r += 250) { const p = M.steadyPR(r, 1, 2); ok(p >= prev - 1e-9 && p <= 2, 'boost rises with engine speed up to the wastegate'); prev = p; }
  near(M.inertia(1), 3e-5, 1e-18); near(M.inertia(2) / M.inertia(1), 32, 1e-9); near(0.5 * M.inertia(1) * (M.shaftRpm(2) * 2 * Math.PI / 60) ** 2, 2572.3, 0.5);
  const s = M.spool(3000, 1, 2); near(s.t90, 0.40, 0.01); near(s.goal, 2, 1e-12); near(s.tr[s.tr.length - 1][1], 1, 1e-6); for (let i = 1; i < s.tr.length; i++) ok(s.tr[i][1] >= s.tr[i - 1][1] - 1e-9, 'boost never falls during spool-up');
  near(M.spool(2000, 1, 2).t90, 1.99, 0.03); near(M.spool(2000, 0.7, 2).t90, 0.228, 0.01); ok(M.spool(3000, 0.7, 2).t90 < s.t90 && M.spool(3000, 1.3, 2).t90 > s.t90, 'smaller spools sooner'); ok(M.spool(4000, 1, 2).t90 < s.t90, 'more exhaust spools sooner');
  near(M.spool(1500, 1, 2).goal, 1.3631, 1e-3); near(M.spool(1500, 1, 2).tr.slice(-1)[0][1], 0.3631, 0.01);
};
