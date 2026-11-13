// Phase transitions: the saturation line passes through the triple and critical points and the normal boiling point;
// the three lines meet at the triple point; the heating curve is continuous with flat stretches of the stated lengths;
// Clausius-Clapeyron recovers the latent heat within a few per cent.
module.exports = (M, { ok, near }) => {
  near(M.psat(0.01), 611.657, 1e-3); near(M.psat(100), 101418, 5); near(M.psat(20), 2339.2, 0.5); near(M.psat(120) / 1000, 198.67, 0.05); near(M.psat(M.TC - 273.15) / M.PC, 1, 1e-9); near(M.psub(0.01), M.PT, 1e-6); near(M.tmelt(M.PT), 0.01, 1e-9);
  near(M.boilingPoint(101325), 99.974, 2e-3); near(M.boilingPoint(M.airPressure(3000)), 89.97, 0.02); near(M.airPressure(3000) / 1000, 70.109, 0.01); near(M.boilingPoint(M.airPressure(8849)), 70.18, 0.02); near(M.airPressure(8849) / 1000, 31.44, 0.01); near(M.boilingPoint(2 * 101325), 120.63, 0.02); near(M.psat(M.boilingPoint(5e5)), 5e5, 1);
  for (let t = 5; t < 370; t += 5) ok(M.psat(t + 5) > M.psat(t), 'vapour pressure rises with temperature'); for (let t = -60; t < 0; t += 5) ok(M.psub(t + 5) > M.psub(t) && M.psub(t) < M.PT, 'so does the pressure over ice');
  ok(M.tmelt(1e8) < M.tmelt(101325) && M.tmelt(1e8) > -8 && M.tmelt(1e8) < -7, 'pressure lowers the melting point of ice, about 7.4 degrees per 100 MPa'); near((1 - 0.99 / 1) * 300, 3, 1e-9);
  ok(M.phase(20, 101325) === 1 && M.phase(-10, 101325) === 0 && M.phase(120, 101325) === 2 && M.phase(20, 1000) === 2 && M.phase(-10, 100) === 2 && M.phase(-30, 100) === 0 && M.phase(400, 3e7) === 3 && M.phase(0, 300) === 2 && M.phase(150, 1e6) === 1 && M.phase(150, 1e5) === 2, 'phases in the right regions');
  near(M.totalEnergy(-20), 3151.4, 1e-9); near(M.heatTemp(0, -20), -20, 1e-12); near(M.heatTemp(41.8, -20), 0, 1e-9); near(M.heatTemp(200, -20), 0, 1e-12); near(M.heatTemp(41.8 + 334, -20), 0, 1e-9); near(M.heatTemp(41.8 + 334 + 209.3, -20), 50, 1e-9); near(M.heatTemp(41.8 + 334 + 418.6 + 1000, -20), 100, 1e-12); near(M.heatTemp(3100, -20), 124.3, 1e-9);
  for (const t0 of [-40, -20, -5, 0]) { let prev = M.heatTemp(0, t0); const tot = M.totalEnergy(t0); for (let i = 1; i <= 400; i++) { const t = M.heatTemp((tot * i) / 400, t0); ok(t >= prev - 1e-9 && t - prev < 6, 'the heating curve never falls and never jumps'); prev = t; } near(prev, 150, 1e-9); }
  near((334 + 2257) / (41.8 + 334 + 418.6 + 2257), 0.849, 1e-3); near(2257 / 418.6, 5.39, 0.01); near(334 / 4.186, 79.8, 0.1); near(4.186 * 63, 264, 1);
  near(M.latentFrom(90, 100, M.FL[0].p, 18.015), 2302.5, 1); near(M.latentFrom(90, 100, M.FL[0].p, 18.015) / 2257, 1, 0.025); near(M.latentFrom(20, 30, M.FL[0].p, 18.015), 2446, 2); near(M.latentFrom(70, 78, M.FL[1].p, 46.07), 888.6, 1); near(M.FL[1].p(78.37) / 101325, 1, 0.005);
  near(M.trouton(2257, 18.015, 100), 108.96, 0.01); near(M.trouton(846, 46.07, 78.37), 110.88, 0.01); ok(M.latentFrom(20, 30, M.FL[0].p, 18.015) > M.latentFrom(150, 160, M.FL[0].p, 18.015), 'latent heat falls as the liquid warms');
};
