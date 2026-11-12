// Car transmissions: differential speeds average to the cage and follow the turn geometry; tractive force and road
// speed follow the overall ratio and conserve power up to efficiency; the belt length is conserved across CVT
// ratios; uninterrupted shifts are never slower than interrupted ones.
module.exports = (M, { ok, near }) => {
  const wc = 30 / 3.6 / 0.31, w = M.wheelSpeeds(wc, 8); near(wc, 26.882, 1e-3); near(w.inner + w.outer, 2 * wc, 1e-12); near(w.inner * 60 / (2 * Math.PI), 232.64, 0.01); near(w.outer * 60 / (2 * Math.PI), 280.77, 0.01); near((w.outer - w.inner) / wc, 1.5 / 8, 1e-12);
  near(w.outer / w.inner, (8 + 0.75) / (8 - 0.75), 1e-12); near(M.wheelSpeeds(wc, 1e9).inner, wc, 1e-6); near(M.spiderSpin(w.outer, w.inner) * 60 / (2 * Math.PI), 38.505, 0.01); near(M.spiderSpin(5, 5), 0, 1e-12);
  { const o = M.openTorque(400, 30, 2000); near(o.each, 30, 1e-12); near(o.total, 60, 1e-12); near(M.openTorque(400, 2000, 2000).total, 400, 1e-12); }
  near(M.torque(4000), 200, 1e-12); near(M.torque(6500), 158.333, 1e-3); near(M.torque(1000), 140, 1e-12); near(M.torque(500), 140, 1e-12); near(M.peakPowerRpm, 6100, 20); near(M.power(6100) / 1000, 108.98, 0.01);
  near(M.speedAt(6500, 3.45, 3.9) * 3.6, 56.46, 0.01); near(M.speedAt(6500, 0.8, 3.9) * 3.6, 243.5, 0.05); near(M.rpmAt(M.speedAt(3000, 1.29, 3.9), 1.29, 3.9), 3000, 1e-9); near(M.rpmAt(100 / 3.6, 0.8, 3.9), 2669.7, 0.05);
  near(M.force(4000, 3.45, 3.9), 8246.6, 0.05); near(M.force(4000, 0.8, 3.9), 1912.26, 0.01); near(M.force(4000, 3.45, 3.9) / M.force(4000, 0.8, 3.9), 3.45 / 0.8, 1e-12);
  for (const g of M.GEARS) near(M.force(5000, g, 3.9) * M.speedAt(5000, g, 3.9), 0.95 * M.power(5000), 1e-6);
  near(M.resist(0), 0.012 * 1300 * 9.80665, 1e-9); near(M.resist(100 / 3.6), 453.91, 0.01); near(M.FLIM, 6884.27, 0.01);
  const man = M.accel('manual', 3.9, 0.5), dct = M.accel('dct', 3.9, 0.5), cvt = M.accel('cvt'); near(man.t, 7.52, 0.03); near(dct.t, 6.99, 0.03); near(cvt.t, 6.97, 0.03); ok(dct.t < man.t && M.accel('manual', 3.9, 1).t > man.t && M.accel('manual', 3.9, 0.1).t < man.t, 'time lost in shifts costs time'); near(M.accel('dct', 3.9, 0.1).t, dct.t, 1e-9);
  ok(man.t > 100 / 3.6 * 1300 / M.FLIM, 'never quicker than the grip limit allows'); near(M.topSpeed(3.9) * 3.6, 223.2, 0.3); { const v = M.topSpeed(3.9); ok(M.resist(v) * v < 0.95 * M.power(M.peakPowerRpm) * 1.001, 'top speed within the power available'); }
  near(M.BELT, 2 * 0.16 + Math.PI * 0.104, 1e-12); near(M.BELT * 1000, 646.73, 0.01); for (const i of [0.4, 0.7, 1, 1.6, 2.5]) { const p = M.pulleys(i); near(p.r2 / p.r1, i, 1e-9); near(M.beltLen(p.r1, p.r2), M.BELT, 1e-9); }
  near(M.pulleys(2.5).r1 * 1000, 28.66, 0.01); near(M.pulleys(2.5).r2 * 1000, 71.66, 0.01); near(M.pulleys(0.4).r1, M.pulleys(2.5).r2, 1e-9); near(M.pulleys(1).r1, 0.052, 1e-9);
};
