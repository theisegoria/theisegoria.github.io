// Disc brakes: the hydraulic chain multiplies as its ratios and conserves work; heat per stop goes as speed squared
// and repeated stops approach the geometric-series limit; the tyre curve peaks where its formula says; anti-lock
// stops are shorter than locked ones and no shorter than the ideal.
module.exports = (M, { ok, near }) => {
  const p = M.linePressure(100, 4, 22); near(p / 1e5, 42.0906, 1e-3); near(M.clampForce(p, 54), 9639.67, 0.01); near(M.clampForce(p, 54) / 100, 16 * (54 / 22) ** 2, 1e-9); near(M.linePressure(200, 4, 22) / p, 2, 1e-12); near(M.linePressure(100, 4, 44) / p, 0.25, 1e-12);
  near(M.wheelTorque(p, 54, 0.4), 925.41, 0.01); near(M.brakeForce(p, 54, 0.4), 2 * 925.408 / 0.31 / 0.7, 0.01); near(M.decel(p, 54, 0.4) / 9.80665, 0.66902, 1e-4); near((100 / 3.6) ** 2 / (2 * M.decel(p, 54, 0.4)), 58.80, 0.01);
  near(M.decel(M.linePressure(400, 4, 22), 54, 0.4), 9.80665, 1e-9); near(M.decel(M.linePressure(400, 4, 22), 54, 0.4, 0.3), 0.3 * 9.80665, 1e-9);
  { const stroke = 0.001 * (54 / 22) ** 2; near(1600 * stroke, M.clampForce(p, 54) * 0.001, 1e-9); }
  near(M.stopEnergy(100) / 1000, 501.54, 0.01); near(M.stopEnergy(200) / M.stopEnergy(100), 4, 1e-12); near(M.discRise(100), 63.601, 1e-3); near(M.discRise(200), 254.41, 0.01); near(M.discRise(100, 1300, 12) / M.discRise(100), 0.5, 1e-12); near(2 * M.discRise(100) * 6 * 460, 0.7 * M.stopEnergy(100), 1e-6);
  const rs = M.repeatStops(100, 30); near(rs.peaks[0], 83.60, 0.01); near(rs.peaks[9], 284.0, 0.5); near(rs.steady, 307.53, 0.01); for (let i = 1; i < 10; i++) ok(rs.peaks[i] > rs.peaks[i - 1] && rs.peaks[i] < rs.steady, 'peaks rise toward the limit'); near(M.repeatStops(100, 30, 200).peaks[199], rs.steady, 1e-6); ok(M.repeatStops(100, 60).steady < rs.steady, 'longer gaps run cooler');
  near(M.padMu(20), 0.4, 1e-12); near(M.padMu(400), 0.4, 1e-12); near(M.padMu(550), 0.3, 1e-12); near(M.padMu(900), 0.2, 1e-12);
  for (const r of [0, 1, 2]) { const ps = M.peakSlip(r), pk = M.tyreMu(ps, r); near(pk, M.ROADS[r].D, 1e-9); ok(M.tyreMu(ps - 0.02, r) < pk && M.tyreMu(ps + 0.02, r) < pk, 'grip peaks at the peak slip'); ok(M.tyreMu(1, r) < pk, 'locked grip is below the peak'); near(M.tyreMu(0, r), 0, 1e-12);
    const on = M.stop(100, r, true), off = M.stop(100, r, false), id = M.idealStop(100, r); ok(on.x < off.x, 'anti-lock stops shorter'); ok(on.x > id && on.x < 1.15 * id, 'anti-lock is close to, and never beats, the ideal'); near(off.x, (100 / 3.6) ** 2 / (2 * M.tyreMu(1, r) * 9.80665), 0.03 * off.x); ok(off.meanSlip > 0.95 && on.meanSlip < 0.3, 'locked wheels slide; controlled wheels roll'); }
  near(M.peakSlip(0), 0.12472, 1e-4); near(M.tyreMu(1, 0), 0.68990, 1e-4); near(M.idealStop(100, 0), 39.341, 0.01); near(M.stop(100, 0, true).x, 42.5, 0.4); near(M.stop(100, 0, false).x, 57.1, 0.4); near(M.stop(100, 1, true).x, 60.0, 0.6); near(M.stop(100, 2, false).x, 346, 3);
  near(M.stop(50, 0, false).x / M.stop(100, 0, false).x, 0.25, 0.03);
};
