// Elevators: the motor carries only the out-of-balance weight, with zero power at the balance point and equal
// effort at both ends for the chosen counterweight; the capstan limit is exp(f alpha) with f = mu / sin(gamma/2);
// the fall before the governor trips and the slide on the rails follow constant-acceleration kinematics.
module.exports = (M, { ok, near }) => {
  near(M.cwMass(0.45), 1650, 1e-12); near(M.unbalance(450, 0.45), 0, 1e-9); near(M.motorPower(450, 0.45, 1.6), 0, 1e-9); near(M.unbalance(975, 0.45) / M.G, 525, 1e-9);
  near(M.motorPower(975, 0.45, 1.6), 525 * M.G * 1.6 / 0.85, 1e-9); near(M.motorPower(975, 0.45, 1.6) / 1000, 9.691, 1e-3); near(M.motorPower(0, 0.45, 1.6) / 1000, -6.002, 1e-3); near(M.motorPower(0, 0.45, 1.6, false), 450 * M.G * 1.6 / 0.85, 1e-9); near(M.motorPower(975, 0.45, 1.6, false), -525 * M.G * 1.6 * 0.85, 1e-9);
  near(M.motorPower(900, 0.45, 1.6), M.motorPower(0, 0.45, 1.6, false), 1e-9); near(M.motorPower(975, 0.45, 3.2) / M.motorPower(975, 0.45, 1.6), 2, 1e-12);
  near(M.drumPower(975, 1.6) / 1000, 40.15, 0.01); near(M.drumPower(0, 1.6) / 1000, 22.15, 0.01); ok(M.drumPower(975, 1.6) > 4 * M.motorPower(975, 0.45, 1.6), 'the counterweight cuts the motor to under a quarter');
  near(M.tripEnergy(975, 0.45, 9.6) / 3600, 16.152, 1e-3); near(M.tripEnergy(975, 0.45, 9.6), M.motorPower(975, 0.45, 1.6) * 9.6 / 1.6, 1e-6);
  near(M.grooveF(0.1, 180), 0.1, 1e-12); near(M.grooveF(0.1, 40), 0.29238, 1e-5); near(M.tractionLimit(0.1, 40, 180), 2.5056, 1e-4); near(M.tractionLimit(0.1, 180, 180), Math.exp(0.1 * Math.PI), 1e-12); near(M.tractionLimit(0.1, 40, 360), M.tractionLimit(0.1, 40, 180) ** 2, 1e-9);
  near(M.tensionRatio(0, 0.45, 0), 1650 / 1200, 1e-12); near(M.tensionRatio(1000, 0.45, 0), 2200 / 1650, 1e-12); near(M.tensionRatio(450, 0.45, 0), 1, 1e-12); near(M.tensionRatio(0, 0.45, 0.5), 1.5227, 1e-4); near(M.tensionRatio(1250, 0.45, 0.5), 1.6444, 1e-4);
  ok(M.tractionLimit(0.1, 40, 180) > M.tensionRatio(1250, 0.45, 0.5) && Math.exp(0.1 * Math.PI) < M.tensionRatio(0, 0.45, 0.5), 'a V groove holds where a round groove would slip');
  const f = M.fall(1.6, 1.15, 0.6); near(f.vt, 1.84, 1e-12); near(f.t1, (1.84 - 1.6) / M.G, 1e-12); near(f.d1, 0.042094, 1e-5); near(f.d1, 1.6 * f.t1 + 0.5 * M.G * f.t1 ** 2, 1e-12); near(f.d2, 0.28770, 1e-4); near(f.d2, 0.5 * f.vt * f.t2, 1e-12); near(f.total, 0.32979, 1e-4);
  near(f.N, 2200 * (M.G + 0.6 * M.G) / 1.2, 1e-6); near(f.N / 1000, 28.766, 1e-3); near(f.tr[0][1], 1.6, 1e-12); near(f.tr[40][1], 1.84, 1e-9); near(f.tr[80][1], 0, 1e-9); near(M.fall(1.6, 1.15, 1.2).d2, f.d2 / 2, 1e-12); near(M.fall(3.2, 1.15, 0.6).d2, 4 * f.d2, 1e-9);
  ok(M.wedgeLocks(10, 0.3) && !M.wedgeLocks(20, 0.3) && M.wedgeLocks(16.6, 0.3) && !M.wedgeLocks(16.8, 0.3), 'a wedge locks below the friction angle'); near(M.freeFallSpeed(9.6), 13.722, 1e-3);
};
