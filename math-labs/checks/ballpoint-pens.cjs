// Ballpoint pens: ink use is density x width x film, writing length goes as 1/d^2, the ball turns 1/(pi d) per unit
// length; Poiseuille supply goes as r^4 / mu and reverses when the pen is turned over; power-law ink thins as
// rate^(n-1) and reduces to a Newtonian liquid at n = 1.
module.exports = (M, { ok, near }) => {
  near(M.lineWidth(1), 0.45, 1e-12); near(M.film(1), 0.4, 1e-12); near(M.inkPerMetre(1), 189, 1e-6); near(M.writeLength(0.4, 1), 2116.4, 0.05); near(M.writeLength(0.4, 0.7), 4319.2, 0.05);
  near(M.writeLength(0.4, 0.5) / M.writeLength(0.4, 1), 4, 1e-9); near(M.writeLength(0.8, 1) / M.writeLength(0.4, 1), 2, 1e-12); near(M.inkPerMetre(1) * 1e-6 * M.writeLength(0.4, 1), 0.4, 1e-9);
  near(M.turnsPerMetre(1), 318.31, 0.005); near(M.turnsPerMetre(1) * Math.PI * 1e-3, 1, 1e-12); near(M.ballRpm(0.1, 1), 1909.86, 0.01); near(M.turnsPerMetre(1) * M.writeLength(0.4, 1), 673672, 1);
  near(M.demand(0.1, 1), 0.018, 1e-9); near(M.demand(0.2, 1) / M.demand(0.1, 1), 2, 1e-12); near(M.demand(0.1, 1) * 1e-9 * M.RHO * 1e9 / 0.1, M.inkPerMetre(1), 1e-6);
  near(M.supply(0.8, 10), 0.16563, 1e-4); near(M.supply(0.8, 10) / M.demand(0.1, 1), 9.2015, 1e-3); near(M.supply(1.6, 10) / M.supply(0.8, 10), 16, 1e-9); near(M.supply(0.8, 1) / M.supply(0.8, 10), 10, 1e-9); near(M.supply(0.8, 0.001), 1656.3, 0.05);
  near(M.supply(0.8, 10, 180), -M.supply(0.8, 10), 1e-12); near(M.supply(0.8, 10, 90), 0, 1e-12); near(M.supply(0.8, 10, 60), 0.5 * M.supply(0.8, 10), 1e-9); near(M.creep(0.8, 10), 0.082376, 1e-5); near(M.creep(0.8, 10), 1050 * 9.80665 * 0.0008 ** 2 / 80 * 1000, 1e-9);
  ok(M.supply(0.8, 10, 180, 2.4) > 100 * M.supply(0.8, 10), 'gas pressure overwhelms gravity'); near(M.supply(0.8, 10, 0, 2.4) - M.supply(0.8, 10, 180, 2.4), 2 * M.supply(0.8, 10), 1e-9);
  near(M.visc(1e5, 10, 0.6), 0.1, 1e-9); near(M.visc(0.1, 10, 0.6), 25.119, 1e-3); near(M.visc(1, 10, 0.6), 10, 1e-12); near(M.visc(1e5, 10, 1), 10, 1e-12); near(M.stress(1e5, 10, 0.6), M.visc(1e5, 10, 0.6) * 1e5, 1e-6);
  near(M.drag(0.1, 1, 10, 0.6), 0.015708, 1e-6); near(M.drag(0.1, 1, 10, 1), 1.5708, 1e-4); near(M.drag(0.2, 1, 10, 0.6) / M.drag(0.1, 1, 10, 0.6), 2 ** 0.6, 1e-9); near(M.drag(0.1, 2, 10, 1) / M.drag(0.1, 1, 10, 1), 0.5, 1e-12);
  for (let k = 1; k <= 6; k++) ok(M.visc(10 ** k, 10, 0.6) < M.visc(10 ** (k - 1), 10, 0.6), 'viscosity falls with shear rate');
};
