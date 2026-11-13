// Heat transfer: series resistances add and the temperature drops in proportion to them; the cooling curve solves
// Newton's law and its time constant scales with size; net radiation is a difference of fourth powers and the Planck
// curve peaks where Wien's law says.
module.exports = (M, { ok, near }) => {
  let w = M.wall(215, 0, 20, 0); near(w.R, 0.215 / 0.7 + 1 / 8 + 1 / 25, 1e-12); near(w.flux, 42.360, 1e-2); near(w.temps[1], 14.705, 1e-2); near(w.temps[4], 0, 1e-9);
  w = M.wall(215, 100, 20, 0); near(w.R, 3.32929, 1e-4); near(w.U, 0.30036, 1e-4); near(w.flux, 6.0073, 1e-3); near(w.temps[1], 19.249, 1e-2); near(w.temps[2], 2.0854, 1e-2);
  for (const [b, i, ti, to] of [[215, 50, 20, -10], [340, 150, 22, 5], [100, 0, 18, -20]]) { const q = M.wall(b, i, ti, to); near(q.temps[4], to, 1e-9); for (let k = 0; k < 4; k++) if (q.parts[k].R > 0) near((q.temps[k] - q.temps[k + 1]) / q.parts[k].R, q.flux, 1e-9); near(q.flux * q.R, ti - to, 1e-9); ok(q.flux < M.wall(b, 0, ti, to).flux + 1e-12, 'insulation never raises the loss'); }
  near(M.wall(215, 200, 20, 0).flux / M.wall(215, 100, 20, 0).flux, 3.32929 / (3.32929 + 0.1 / 0.035), 1e-6);
  near(M.cupDiameter(250), 0.068278, 1e-5); near(Math.PI / 4 * M.cupDiameter(250) ** 3, 250e-6, 1e-12); near(M.cupArea(250), 0.021969, 1e-5); near(M.timeConstant(250, 15), 3175.7, 0.5); near(15 * M.cupArea(250) * 70, 23.067, 1e-2);
  const tau = M.timeConstant(250, 15); near(M.coolTemp(0, 90, 20, tau), 90, 1e-12); near(M.coolTemp(tau, 90, 20, tau), 20 + 70 / Math.E, 1e-9); near(M.coolTemp(600, 90, 20, tau), 77.949, 1e-2); near(M.timeTo(60, 90, 20, tau) / 60, 29.620, 1e-2); near(M.coolTemp(M.timeTo(45, 90, 20, tau), 90, 20, tau), 45, 1e-9);
  { const h = 1e-2, t = 900, d = (M.coolTemp(t + h, 90, 20, tau) - M.coolTemp(t - h, 90, 20, tau)) / (2 * h); near(d, -(M.coolTemp(t, 90, 20, tau) - 20) / tau, 1e-9); }
  near(M.timeConstant(2000, 15) / M.timeConstant(250, 15), 2, 1e-9); near(M.timeConstant(250, 30) / M.timeConstant(250, 15), 0.5, 1e-12);
  near(M.radiated(100, 20, 0.8, 0.1), 54.449, 1e-2); near(M.convected(100, 20, 10, 0.1), 80, 1e-12); near(M.radiated(600, 20, 0.8, 0.1), 2603.2, 0.5); near(M.convected(600, 20, 10, 0.1), 580, 1e-9); near(M.radiated(20, 20, 0.8, 0.1), 0, 1e-12);
  near(M.radiated(600, 20, 0.4, 0.1) / M.radiated(600, 20, 0.8, 0.1), 0.5, 1e-12); near((M.radiated(2 * 293.15 - 273.15, -273.15, 1, 1)) / M.radiated(20, -273.15, 1, 1), 16, 1e-9); near(M.radiated(26.85, -273.15, 1, 1), 5.670374e-8 * 300 ** 4, 1e-6);
  { let lo = 150, hi = 250; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (M.radiated(m, 20, 0.8, 0.1) > M.convected(m, 20, 10, 0.1)) hi = m; else lo = m; } ok(lo > 180 && lo < 200, 'radiation overtakes still air near 190 C'); }
  near(M.wienPeak(600), 3.3188, 1e-3); near(M.wienPeak(20), 9.8849, 1e-3); for (const t of [20, 600, 1200, 5500]) { const pk = M.wienPeak(t); ok(M.planck(pk, t) > M.planck(pk * 0.97, t) && M.planck(pk, t) > M.planck(pk * 1.03, t), 'the Planck curve peaks at the Wien wavelength'); }
  { const tot = (t) => { let s = 0; for (let i = 0; i < 200000; i++) { const lam = 0.05 + (i + 0.5) * 0.002; s += M.planck(lam, t) * 0.002; } return s; }; near(tot(900 - 273.15) / tot(450 - 273.15), 16, 0.4); }
  near(M.radCoeff(20, 20, 0.9), 5.1426, 1e-3); near(M.radCoeff(21, 20, 0.9), M.radCoeff(20, 20, 0.9), 0.05);
};
