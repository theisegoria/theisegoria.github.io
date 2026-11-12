// Lithium-ion: the open-circuit curve runs monotonically from 3.0 V to 4.2 V; resistance follows Arrhenius; delivered
// charge never exceeds capacity, falls with current, cold and age, and the energy is bounded by charge times voltage;
// charging conserves charge, never exceeds the voltage limit, switches to constant voltage where OCV + I R = V_max and
// tapers; the spiral length formula matches a direct integration of the Archimedean spiral.
module.exports = (M, { ok, near }) => {
  near(M.ocv(0), 3.0, 1e-3); near(M.ocv(1), 4.2, 1e-9); near(M.ocv(0.5), 3.742, 1e-3); for (let i = 1; i <= 100; i++) ok(M.ocv(i / 100) > M.ocv((i - 1) / 100), 'voltage rises with charge');
  near(M.rInt(25, 0), 0.035, 1e-12); near(M.rInt(0, 0) / 0.035, Math.exp((20000 / 8.314) * (1 / 273.15 - 1 / 298.15)), 1e-9); ok(M.rInt(0) > 2 * M.rInt(25) && M.rInt(45) < M.rInt(25), 'cold raises resistance, warmth lowers it'); near(M.rInt(25, 800), 0.0525, 1e-12);
  near(M.capAged(0), 3, 1e-12); near(M.capAged(800), 2.4, 1e-12); near(M.polar(1), 1, 1e-4); ok(M.polar(0) > M.polar(0.5) && M.polar(0.5) > M.polar(1), 'losses grow as the cell empties');
  let prev = Infinity; for (const I of [0.3, 1.5, 3, 6, 9, 12, 15]) { const d = M.discharge(I); ok(d.q <= d.Q + 1e-9 && d.q <= prev + 1e-9, 'delivered charge falls with current'); ok(d.wh < d.q * 4.2 && d.wh > d.q * 2.8, 'energy bounded by charge times voltage'); if (d.q < d.Q - 1e-6) near(d.v(d.q), M.VCUT, 1e-6); prev = d.q; }
  near(M.discharge(3).q, 2.965, 0.002); near(M.discharge(15).q, 2.183, 0.002); near(M.discharge(15).wh, 7.07, 0.01); near(M.discharge(6, 0).q, 2.398, 0.002);
  ok(M.discharge(3, 0).q < M.discharge(3, 25).q && M.discharge(3, -10).q < M.discharge(3, 0).q, 'cold costs capacity'); ok(M.discharge(3, 25, 500).q < M.discharge(3, 25, 0).q, 'age costs capacity');
  near(M.discharge(0.3).v(0), 4.2 - 0.3 * 0.035, 1e-3);
  for (const C of [0.5, 1, 2, 3]) {
    const c = M.charge(C); let q = 0, vm = 0, mono = true; for (let i = 1; i < c.pts.length; i++) { q += 0.5 * (c.pts[i][1] + c.pts[i - 1][1]) * (c.pts[i][0] - c.pts[i - 1][0]); vm = Math.max(vm, c.pts[i][2]); if (c.pts[i][1] > c.pts[i - 1][1] + 1e-9) mono = false; }
    near(q / c.Q, c.s, 2e-3); ok(vm <= 4.2 + 1e-9, 'never above the voltage limit'); ok(mono, 'current never rises'); ok(c.t > 1 / C * 0.9 && c.tcc <= c.t, 'takes longer than charge over current');
    const sw = c.pts.find((p) => p[0] >= c.tcc); near(M.ocv(sw[3]) + C * c.Q * c.R, 4.2, 0.01); near(c.pts[c.pts.length - 1][1], 0.05 * c.Q, 0.01);
  }
  ok(M.charge(2).t < M.charge(1).t && M.charge(2).t > M.charge(1).t / 2, 'doubling the current less than halves the time'); ok(M.charge(2).tcc / M.charge(2).t < M.charge(1).tcc / M.charge(1).t, 'faster charging spends a larger share tapering');
  near(M.charge(1).t * 60, 67, 1); near(M.charge(1).t80 * 60, 48, 0.6); near(M.charge(1, 4.1).s, 0.936, 0.003); ok(M.charge(1, 4.1).s < M.charge(1, 4.2).s, 'a lower limit stores less');
  for (const tc of [40, 70, 100]) { const q = M.roll(tc); let len = 0; const N = 200000, th1 = q.turns * 2 * Math.PI; for (let i = 0; i < N; i++) { const th = ((i + 0.5) / N) * th1, r = M.CELL.ri + (q.pitch * th) / (2 * Math.PI); len += Math.hypot(r, q.pitch / (2 * Math.PI)) * (th1 / N); } near(len / q.len, 1, 1e-3); near(q.cap, (2 * q.len * M.CELL.w / 100) * tc * 1e-4 * M.CELL.volCap / 1000, 1e-9); }
  near(M.roll(70).pitch, 0.351, 1e-9); near(M.roll(70).len, 626, 0.5); near(M.roll(70).cap, 2.98, 0.01); near(M.roll(70).R, 0.035, 2e-4); near(M.roll(70).whkg, 210, 1.5);
  ok(M.roll(100).cap > M.roll(70).cap && M.roll(100).R > M.roll(70).R && M.roll(40).R < M.roll(70).R && M.roll(40).turns > M.roll(70).turns, 'thicker coating: more capacity, more resistance, fewer turns');
};
