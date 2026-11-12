// Microwave ovens: mode frequencies obey the box formula and its symmetries; the heating pattern has its nodes and
// antinodes and a ring average between its extremes; the Debye model has its limits and its loss peak at 1/(2 pi tau);
// penetration depth reduces to the low-loss formula; the simulated electron turns back exactly above the Hull cut-off
// and its turning radius agrees with conservation of energy and canonical angular momentum.
module.exports = (M, { ok, near }) => {
  const c = 299792458; near(M.modeFreq(3, 3, 2), (c / 2) * Math.hypot(3 / 0.33, 3 / 0.33, 2 / 0.21), 1); near(M.modeFreq(3, 3, 2) / 1e9, 2.398, 1e-3); near(M.modeFreq(2, 5, 0), M.modeFreq(5, 2, 0), 1e-6); near(M.modeFreq(2, 5, 0) / 1e9, 2.446, 1e-3);
  ok(M.modesNear().length === 8 && M.modesNear().every((q) => Math.abs(q.f - 2.45e9) <= 0.06e9), 'eight patterns near 2.45 GHz'); ok(M.MODES.every((q) => Math.abs(M.modeFreq(...q) - 2.45e9) < 0.06e9), 'chosen patterns lie in the band');
  near(M.heat(0.165, 0.165, 3, 3), 1, 1e-12); near(M.heat(0.11, 0.165, 3, 3), 0, 1e-12); near(M.heat(0.055, 0.055, 3, 3), 1, 1e-12); near(M.ringAverage(0, 3, 3), 1, 1e-12);
  for (const r of [0.03, 0.07, 0.12]) { let lo = 1, hi = 0; for (let i = 0; i < 360; i++) { const t = (i / 360) * 2 * Math.PI, v = M.heat(0.165 + r * Math.cos(t), 0.165 + r * Math.sin(t), 2, 5); lo = Math.min(lo, v); hi = Math.max(hi, v); } const a = M.ringAverage(r, 2, 5); ok(a >= lo - 1e-9 && a <= hi + 1e-9, 'average lies between the extremes'); }
  near(M.uniformity(3, 3, false).lo, 0, 1e-4); ok(M.uniformity(3, 3, true).ratio < 0.02 && M.uniformity(1, 5, true).ratio > M.uniformity(1, 5, false).ratio, 'turning helps but leaves rings');
  const w = M.water(25); near(w.es, 78.29, 0.02); near(w.tau, 8.3e-12, 1e-15); near(M.eps(1, 25).re, w.es, 1e-6); near(M.eps(1e15, 25).re, w.einf, 1e-3); ok(M.eps(1, 25).im < 1e-8, 'no loss at rest');
  { const fp = 1 / (2 * Math.PI * w.tau); near(M.eps(fp, 25).im, (w.es - w.einf) / 2, 1e-9); ok(M.eps(fp, 25).im > M.eps(fp * 1.2, 25).im && M.eps(fp, 25).im > M.eps(fp / 1.2, 25).im, 'loss peaks at 1/(2 pi tau)'); near(fp / 1e9, 19.18, 0.05); }
  const e = M.eps(2.45e9, 25); near(e.re, 77.1, 0.1); near(e.im, 9.19, 0.02); near(M.depth(e.re, e.im, 2.45e9), 0.0186, 2e-4); near(M.depth(60.8, 2.64, 2.45e9), 0.0577, 5e-4);
  near(M.depth(3.2, 0.003, 2.45e9), (c / 2.45e9) * Math.sqrt(3.2) / (2 * Math.PI * 0.003), 0.01); ok(M.depth(M.eps(2.45e9, 80).re, M.eps(2.45e9, 80).im, 2.45e9) > M.depth(e.re, e.im, 2.45e9), 'warm water lets the waves in deeper');
  near(M.heatTime(250, 60, 800), 87.2, 0.1);
  near(M.hullB(4000), 0.11812, 1e-5); near(M.hullB(8000) / M.hullB(2000), 2, 1e-12);
  for (const V of [2000, 4000]) { const Bc = M.hullB(V); ok(M.orbit(V, Bc * 0.95).hit, 'reaches the anode below cut-off'); ok(!M.orbit(V, Bc * 1.05).hit, 'turns back above cut-off'); near(M.orbit(V, Bc * 1.05).rmax, 0.0045, 2.5e-4); }
  { // turning radius from conservation laws: at r_max the speed is purely azimuthal, v = (eB/2m) (r^2 - ra^2)/r, and (1/2) m v^2 = e V ln(r/ra)/ln(rb/ra)
    const V = 4000, B = 0.16, t = M.TUBE, g = (r) => 0.5 * M.ME * ((M.QE * B) / (2 * M.ME) * (r * r - t.ra * t.ra) / r) ** 2 - M.QE * V * Math.log(r / t.ra) / Math.log(t.rb / t.ra); let a = t.ra * 1.001, b = t.rb; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (g(m) < 0) a = m; else b = m; } near(M.orbit(V, B).rmax, a, 3e-5); }
};
