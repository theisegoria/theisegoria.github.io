// LED lighting: the ABC efficiency peaks at the stated current with value 1/(1+2q) and the current mapping inverts;
// forward voltage and efficacy have their worked values; the colour-matching fit peaks where the standard observer
// does and an equal-energy spectrum lands near the white point; warmer phosphor lowers colour temperature, conversion
// and luminous efficacy of radiation; the driver conserves energy, its ripple follows P/(2 f C V), and a constant
// current converter removes flicker; thermal ladder and life laws reduce to their closed forms.
module.exports = (M, { ok, near }) => {
  near(M.iqe(M.IPK), 1 / (1 + 2 * M.Q), 1e-9); near(M.iqe(M.IPK), 0.9, 1e-9); for (const I of [0.001, 0.02, 0.15, 1]) near(M.iOfX(M.xOfI(I)), I, 1e-9);
  ok(M.iqe(0.005) < M.iqe(0.02) && M.iqe(0.15) < M.iqe(0.02) && M.iqe(1) < M.iqe(0.15), 'efficiency peaks then droops');
  { const x = 3, a = 1 / (1 + M.Q * (x + 1 / x)), A = M.Q, B = 1, C = M.Q; near(a, (B * x * x) / (A * x + B * x * x + C * x ** 3), 1e-12); }
  near(M.vf(0.1, 85), 2.839, 1e-3); near(M.vf(0.1, 25) - M.vf(0.1, 85), 0.12, 1e-9); near(M.wpe(0.1, 85), 0.674, 1e-3); near(M.VPH, 2.743, 1e-3);
  let ym = 0, yl = 0; for (let l = 400; l <= 700; l++) if (M.ybar(l) > ym) { ym = M.ybar(l); yl = l; } ok(Math.abs(yl - 556) <= 6 && Math.abs(ym - 1) < 0.03, 'eye sensitivity peaks near 555 nm');
  { let X = 0, Y = 0, Z = 0; for (let l = 380; l <= 780; l++) { X += M.xbar(l); Y += M.ybar(l); Z += M.zbar(l); } near(X / (X + Y + Z), 1 / 3, 0.01); near(Y / (X + Y + Z), 1 / 3, 0.01); }
  const cool = M.white(0.2), warm = M.white(0.6), red = M.white(1); ok(cool.cct > warm.cct && warm.cct > red.cct, 'more red phosphor, warmer light'); ok(cool.conv > warm.conv && cool.ler > warm.ler, 'and fewer lumens'); near(warm.cct, 3599, 5); near(warm.ler, 310.8, 0.5); near(warm.conv, 0.727, 1e-3); ok(warm.ler < 683 && warm.conv < 1, 'bounded');
  near(M.efficacy(0.1, 85, 0.6), 152.4, 0.3); near(M.efficacy(0.02, 85, 0.6), 164.5, 0.3); near(M.efficacy(1, 85, 0.6), 106.8, 0.3); ok(M.efficacy(0.1, 25, 0.6) > M.efficacy(0.1, 85, 0.6), 'cooler is better');
  for (const [m, C, P, t] of [[0, 4.5e-6, 9, 0], [0, 22e-6, 9, 0], [1, 10e-6, 6, 1], [0, 4.5e-6, 9, 1]]) {
    const d = M.driver(m, C, P, t), { v, f } = M.MAINS[m]; near(d.vpk, v * Math.SQRT2, 1e-9); ok(d.pf > 0 && d.pf <= 1, 'power factor between 0 and 1'); ok(d.out.every((o) => o[2] >= o[1] - 1 && o[2] <= d.vpk + 1e-9), 'capacitor never below the rectified mains nor above its peak');
    if (t === 1) { near(d.pin, P / 0.9, 0.05 * P); near(d.flicker, 0, 1e-9); near(d.ripple, P / 0.9 / (2 * f * C * (d.vpk - d.ripple / 2)) * (1 - Math.acos(1 - d.ripple / d.vpk) / Math.PI), 0.12 * d.ripple); }
  }
  ok(M.driver(0, 22e-6, 9, 0).flicker < M.driver(0, 4.5e-6, 9, 0).flicker && M.driver(0, 22e-6, 9, 0).pf < M.driver(0, 4.5e-6, 9, 0).pf, 'a bigger capacitor: less flicker, worse power factor'); ok(M.driver(1, 4.5e-6, 9, 0).flicker > M.driver(0, 4.5e-6, 9, 0).flicker, 'lower mains voltage flickers more');
  near(M.driver(0, 4.5e-6, 9, 0).flicker, 36.4, 0.5); near(M.driver(0, 4.5e-6, 9, 0).ripple, 66, 1); near(M.driver(0, 4.5e-6, 9, 0).pf, 0.55, 0.01);
  const t = M.thermal(9, 12, 25); near(t.heat, 5.85, 1e-9); near(t.ts, 25 + 5.85 * 12, 1e-9); near(t.tj, 25 + 5.85 * 13.8, 1e-9); near(t.lifeLed, 50000 * 2 ** ((85 - t.tj) / 12), 1e-6); near(t.lifeCap, 5000 * 2 ** ((105 - t.ts + 5) / 10), 1e-6);
  near(M.thermal(9, 12, 35).lifeCap / t.lifeCap, 0.5, 1e-9); ok(M.thermal(9, 12, 50).tj > t.tj && M.thermal(6, 12, 25).tj < t.tj && M.thermal(9, 8, 25).tj < t.tj, 'hotter air, more power or a smaller sink raise the junction'); near(M.thermal(9, 12, 50).tj, 130.7, 0.1);
};
