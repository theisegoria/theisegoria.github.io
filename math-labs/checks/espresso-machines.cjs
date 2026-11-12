// Espresso machines: Darcy flow is linear in pressure and area, inverse in depth and viscosity, and goes as grain
// size squared; extraction rises to its ceiling; pump and puck meet where both lines agree, and the relief valve
// conserves flow.
module.exports = (M, { ok, near }) => {
  near(M.AREA, Math.PI * 0.029 ** 2, 1e-15); near(M.depth(18) * 1000, 10.988, 0.002); near(M.depth(36) / M.depth(18), 2, 1e-12);
  near(M.visc(20) * 1000, 1.002, 0.01); near(M.visc(93) * 1000, 0.3009, 0.001); near(M.visc(20) / M.visc(93), 3.329, 0.002);
  near(M.flow(300, 18, 9), 1.5101, 0.0005); near(M.flow(300, 18, 9) * 1e-6, M.perm(300) * M.AREA * 9e5 / (M.visc(93) * M.depth(18)), 1e-15);
  near(M.flow(300, 18, 6) / M.flow(300, 18, 9), 2 / 3, 1e-12); near(M.flow(150, 18, 9) / M.flow(300, 18, 9), 0.25, 1e-12); near(M.flow(300, 9, 9) / M.flow(300, 18, 9), 2, 1e-12); near(M.flow(300, 18, 9, 20) / M.flow(300, 18, 9, 93), M.visc(93) / M.visc(20), 1e-12);
  near(M.shotTime(300, 18, 9), 23.84, 0.01); near(M.shotTime(250, 18, 9), 34.33, 0.01); near(M.shotTime(350, 18, 9), 17.51, 0.01); near(M.shotTime(300, 18, 9) * M.flow(300, 18, 9), 36, 1e-9);
  near(M.ey(300, M.shotTime(300, 18, 9)), 0.1985, 0.0002); near(M.ey(250, M.shotTime(250, 18, 9)), 0.2683, 0.0002); near(M.ey(350, M.shotTime(350, 18, 9)), 0.1329, 0.0002); near(M.tds(300, 18, 9), 0.09924, 0.0001);
  near(M.ey(300, 0), 0, 1e-12); near(M.ey(300, 1e4), 0.3, 1e-9); near(M.tau(600) / M.tau(300), 4, 1e-12); for (let t = 1; t < 60; t++) ok(M.ey(300, t) > M.ey(300, t - 1) && M.ey(250, t) > M.ey(300, t), 'extraction rises, and faster for finer grains');
  const R = M.resistance(300, 18); near(R, 5.960, 0.001); near(R * M.flow(300, 18, 7), 7, 1e-9);
  const o = M.operate(R, 9); near(o.pFree, 12.165, 0.001); near(o.pFree / R, M.pumpQ(o.pFree), 1e-9); near(o.p, 9, 1e-12); near(o.q, 1.5101, 0.0005); near(o.pump, 4.32, 1e-9); near(o.q + o.bypass, o.pump, 1e-12); ok(o.open, 'valve open for a normal puck');
  const c = M.operate(M.resistance(600, 18), 9); near(c.p, 7.763, 0.001); near(c.bypass, 0, 1e-12); near(c.q, c.pump, 1e-9); ok(!c.open, 'valve shut for a coarse grind');
  for (const d of [200, 300, 400, 600]) { const u = M.operate(M.resistance(d, 18), 99); ok(u.p < M.PMAX && u.p > 0, 'unregulated pressure stays under the pump limit'); near(u.q, M.pumpQ(u.p), 1e-9); }
  ok(M.operate(M.resistance(200, 18), 99).p > M.operate(M.resistance(300, 18), 99).p, 'finer grind, higher pressure'); near(M.pumpQ(0), M.QMAX, 1e-12); near(M.pumpQ(M.PMAX), 0, 1e-12);
  near(M.poreSpeed(1.5101) * 1000, 2.858, 0.002); near(M.depth(18) / M.poreSpeed(1.5101), 3.845, 0.003); near(M.heatPower(1.5101, 93), 461.45, 0.05); near(9e5 * M.AREA, 2377.9, 0.1);
};
