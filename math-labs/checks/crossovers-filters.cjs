// Filters and crossovers: RC corner (-3 dB, -45 deg, -20 dB a decade up), RLC peak gain Q at f0 and band-pass unity, the worked example numbers, crossover sums (BW1 flat, BW2 notch, inverted BW2 +3 dB, LR2-inverted and LR4 all-pass), Butterworth power complementarity, LR4 -6 dB halves, and the two-source offset model (worked example level, first null, lobe tilt, coincident flatness, delay sign) against a brute-force search.
module.exports = (M, { ok, near }) => {
  const abs = M.cx.abs, arg = (z) => M.cx.arg(z) * 180 / Math.PI;
  // RC: R = 10, C = 10 uF
  const R = 10, C = 10e-6, Lh = 1e-3, fc = M.rcCorner(R, C);
  near(fc, 1591.55, 0.01);
  near(abs(M.rlc(0, R, Lh, C, fc)), Math.SQRT1_2, 1e-12); near(arg(M.rlc(0, R, Lh, C, fc)), -45, 1e-9); near(arg(M.rlc(1, R, Lh, C, fc)), 45, 1e-9);
  near(M.dB(M.rlc(0, R, Lh, C, 10 * fc)), -20.043, 1e-3);
  // RLC: f0, Q = 1, gain at f0 = Q with -90 deg; band-pass unity and in phase at f0; 40 dB a decade
  const f0 = M.f0Of(Lh, C), Q = M.qOf(R, Lh, C);
  near(f0, 1591.55, 0.01); near(Q, 1, 1e-12);
  { const Q5 = M.qOf(2, Lh, C); near(abs(M.rlc(2, 2, Lh, C, f0)), Q5, 1e-9); near(arg(M.rlc(2, 2, Lh, C, f0)), -90, 1e-9); }
  near(abs(M.rlc(3, R, Lh, C, f0)), 1, 1e-12); near(arg(M.rlc(3, R, Lh, C, f0)), 0, 1e-9);
  near(M.dB(M.rlc(2, R, Lh, C, 100 * f0)) - M.dB(M.rlc(2, R, Lh, C, 10 * f0)), -40, 0.05);
  // band-pass -3 dB bandwidth f0/Q
  { const R2 = 5, q = M.qOf(R2, Lh, C), bw = f0 / q, fl = (-bw + Math.sqrt(bw * bw + 4 * f0 * f0)) / 2; near(abs(M.rlc(3, R2, Lh, C, fl)), Math.SQRT1_2, 1e-9); near(abs(M.rlc(3, R2, Lh, C, fl + bw)), Math.SQRT1_2, 1e-9); }
  // crossovers
  const F = 2500, fs = [50, 300, 900, 1800, 2500, 3100, 5000, 12000, 20000];
  fs.forEach((f) => { near(abs(M.xover(0, f, F).sum), 1, 1e-12); near(abs(M.xover(3, f, F).sum), 1, 1e-12); near(abs(M.xover(4, f, F).sum), 1, 1e-12); });
  fs.forEach((f) => { const X = M.xover(1, f, F); near(abs(X.lp) ** 2 + abs(X.hp) ** 2, 1, 1e-12); });
  ok(abs(M.xover(1, F, F).sum) < 1e-12, 'BW2 cancels at fc'); near(M.dB(M.xover(2, F, F).sum), 3.0103, 1e-4);
  { const X = M.xover(4, F, F); near(M.dB(X.lp), -6.0206, 1e-4); near(M.dB(X.hp), -6.0206, 1e-4); near(X.sum[0], -1, 1e-12); near(X.sum[1], 0, 1e-12); }
  { const X = M.xover(0, F, F); near(arg(X.lp), -45, 1e-9); near(arg(X.hp), 45, 1e-9); }
  // offset: worked example
  { const d = M.pathDelay(0.15, 0, 20); near(d * 1e3, -0.1496, 1e-4); near(M.dB(M.offsetResp(0.15, 0, F, F, 20)), 20 * Math.log10(Math.abs(Math.cos(Math.PI * F * d))), 1e-9); near(M.dB(M.offsetResp(0.15, 0, F, F, 20)), -8.27, 0.01); }
  near(M.firstNulls(0.15, 0, F).above, 27.22, 0.01); near(M.firstNulls(0.15, 0, F).below, -27.22, 0.01);
  near(M.lobeTilt(0.15, 0.02), 7.595, 1e-3); near(M.pathDelay(0.15, 0.02, M.lobeTilt(0.15, 0.02)), 0, 1e-15);
  // brute force: the null found by search agrees with the closed form, and the level there is very low
  { let best = [0, 1e9]; for (let t = 0; t <= 60; t += 0.001) { const g = abs(M.offsetResp(0.15, 0.02, F, F, t)); if (g < best[1]) best = [t, g]; } near(best[0], M.firstNulls(0.15, 0.02, F).above, 0.002); ok(best[1] < 1e-3, 'deep null'); }
  // coincident drivers: flat at every angle and frequency
  [-60, -20, 0, 35, 60].forEach((t) => [200, 2500, 9000].forEach((f) => near(abs(M.offsetResp(0, 0, F, f, t)), 1, 1e-12)));
  // tweeter above: closer to a listener above (negative delay)
  ok(M.pathDelay(0.15, 0, 30) < 0 && M.pathDelay(0.15, 0, -30) > 0, 'delay sign');
  // no nulls at fc when spacing is below half a wavelength
  ok(M.nullsAt(0.05, 0, F).length === 0, 'no nulls for small spacing');
};
