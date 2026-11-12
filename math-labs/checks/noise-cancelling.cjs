// Noise cancelling: the residual formula agrees with direct summation of two sinusoids; perfect copy cancels, zero copy
// leaves everything, a half-cycle delay doubles; the 20 dB frequency limit inverts the formula; the feedback loop's
// -180 degree frequency, gain limit and sensitivity are consistent, and a simulated time-domain loop is stable just
// below the limit and unstable just above; A-weighting has its standard values; the ear model is monotone in leak.
module.exports = (M, { ok, near }) => {
  for (const [g, phi] of [[1.06, 0.05], [0.8, 0.7], [1, Math.PI / 3], [1.2, 2]]) { let mx = 0; for (let i = 0; i < 4000; i++) { const t = (i / 4000) * 2 * Math.PI; mx = Math.max(mx, Math.abs(Math.sin(t) - g * Math.sin(t - phi))); } near(mx, M.residual(g, phi), 1e-5); }
  near(M.residual(1, 0), 0, 1e-12); near(M.residual(0, 1), 1, 1e-12); near(M.residual(1, Math.PI), 2, 1e-12); near(M.residual(1, Math.PI / 3), 1, 1e-12);
  near(M.attDb(10 ** (1 / 20), 0), 18.27, 0.01); near(M.attDb(1, 2 * Math.PI * 1000 * 40e-6), 12.02, 0.01); near(M.attDb(10 ** (0.5 / 20), 2 * Math.PI * 200 * 40e-6), 22.09, 0.01);
  for (const tau of [20e-6, 40e-6, 100e-6]) { const f = M.fLimit(tau, 20); near(M.attDb(1, 2 * Math.PI * f * tau), 20, 1e-6); } near(M.fLimit(40e-6, 20), 398.05, 0.05); near(M.fLimit(40e-6, 20) / M.fLimit(80e-6, 20), 2, 1e-9);
  for (const tau of [30e-6, 60e-6, 200e-6]) { const f = M.f180(tau), l = M.loop(f, 5, tau); near(l.ph, -Math.PI, 1e-6); near(l.im, 0, 1e-5); near(M.loop(f, M.kMax(tau), tau).re, -1, 1e-6); ok(f < 1 / (2 * tau) && f > 1 / (4 * tau) * 0.9, 'between a quarter and a half cycle of delay'); }
  near(M.f180(60e-6), 4229.4, 0.5); near(M.kMax(60e-6), 42.31, 0.01); near(M.gainMarginDb(10, 60e-6), 12.53, 0.01); ok(M.kMax(30e-6) > M.kMax(60e-6) && M.kMax(60e-6) > M.kMax(200e-6), 'less delay allows more gain');
  near(M.sens(1e-3, 10, 60e-6), 1 / 11, 1e-6); near(-20 * Math.log10(M.sens(1e-3, 10, 60e-6)), 20.83, 0.01); ok(M.sensPeak(10, 60e-6).db > 0 && M.sensPeak(31.6, 60e-6).db > M.sensPeak(10, 60e-6).db, 'a hump above the quiet band that grows with gain');
  // time-domain simulation of y' = 2 pi f1 (-y - K y(t - tau)): decays below the gain limit, grows above it
  const grows = (K, tau) => { const dt = tau / 200, w1 = 2 * Math.PI * M.F1, n = 200, buf = new Float64Array(n).fill(1); let y = 1, e0 = 0, e1 = 0; const N = 400000; for (let i = 0; i < N; i++) { const yd = buf[i % n]; buf[i % n] = y; y += dt * w1 * (-y - K * yd); if (i > N * 0.4 && i < N * 0.5) e0 = Math.max(e0, Math.abs(y)); if (i > N * 0.9) e1 = Math.max(e1, Math.abs(y)); } return e1 > e0; };
  ok(!grows(M.kMax(60e-6) * 0.93, 60e-6), 'stable just below the limit'); ok(grows(M.kMax(60e-6) * 1.07, 60e-6), 'unstable just above the limit');
  near(M.aWeight(1000), 0, 0.02); near(M.aWeight(100), -19.1, 0.1); near(M.aWeight(10000), -2.5, 0.1); near(M.aWeight(20), -50.4, 0.2);
  for (const f of [50, 200, 1000, 5000]) { ok(M.passiveDb(f, 0) >= M.passiveDb(f, 0.5) && M.passiveDb(f, 0.5) >= M.passiveDb(f, 1), 'a leak never helps the tip'); ok(M.passiveDb(f, 0) >= 0 && M.passiveDb(f, 0) <= 38, 'passive range'); }
  ok(M.passiveDb(5000, 0) > M.passiveDb(1000, 0) && M.passiveDb(1000, 0) > M.passiveDb(100, 0), 'the tip works better on high sounds'); ok(M.activeDb(100, 0) > 20 && M.activeDb(100, 0) > M.activeDb(1000, 0) && M.activeDb(5000, 0) < 1, 'electronics work only on low sounds');
  for (const s of [0, 1, 2]) { const o = M.levelA(s, 0, false, false), t = M.levelA(s, 0, false), a = M.levelA(s, 0, true); ok(o > t && t > a, 'each layer lowers the level'); ok(M.levelA(s, 0.5, true) > a && M.levelA(s, 1, true) > M.levelA(s, 0.5, true), 'a loose fit raises it'); }
  near(M.levelA(0, 0, false, false), 84.5, 0.1); near(M.levelA(0, 0, true), 63.2, 0.1); ok(M.levelA(0, 0, false) - M.levelA(0, 0, true) > M.levelA(2, 0, false) - M.levelA(2, 0, true), 'electronics help more with aircraft noise than with voices');
};
