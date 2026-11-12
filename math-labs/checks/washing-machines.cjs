// Washing machines: the critical speed is sqrt(g/r) and the release angle follows omega^2 r / g; the flight starts
// and ends on the drum wall and conserves energy; the g-factor goes as rpm squared times radius; the unbalance
// response peaks near resonance at (m e / M) / (2 zeta) and tends to m e / M at speed.
module.exports = (M, { ok, near }) => {
  near(M.critRpm(0.24), 61.042, 0.002); near(M.gFactor(M.critRpm(0.24), 0.24), 1, 1e-12); near(M.critRpm(0.96) / M.critRpm(0.24), 0.5, 1e-12); near(M.gFactor(48, 0.24), 0.6183, 1e-4);
  const t = M.tumble(48, 0.24); ok(!t.pinned, 'washing falls at 48 rpm'); near(Math.sin(t.al), M.gFactor(48, 0.24), 1e-12); near(t.al * 180 / Math.PI, 38.195, 0.002); near(Math.hypot(t.x0, t.z0), 0.24, 1e-12);
  near(Math.hypot(t.land[0], t.land[1]), 0.24, 6e-4); near(t.drop, 0.4127, 5e-4); near(t.vImp, 2.9413, 2e-3); near(0.5 * t.vImp ** 2 + M.G * t.land[1], 0.5 * (M.omega(48) * 0.24) ** 2 + M.G * t.z0, 2e-3);
  { const p = t.pos(t.tl / 2); ok(Math.hypot(p[0], p[1]) < 0.24, 'the flight stays inside the drum'); }
  ok(M.tumble(62, 0.24).pinned && M.tumble(61, 0.24).pinned === false, 'pinned just above the critical speed'); near(M.tumble(60, 0.24).drop, 0.0695, 1e-3); ok(M.tumble(48, 0.24).drop > M.tumble(30, 0.24).drop && M.tumble(48, 0.24).drop > M.tumble(58, 0.24).drop, 'the fall peaks between slow and critical');
  near(M.omega(1400), 146.608, 1e-3); near(M.gFactor(1400, 0.24), 526.02, 0.01); near(M.gFactor(1000, 0.24), 268.38, 0.01); near(M.gFactor(1400, 0.24) / M.gFactor(700, 0.24), 4, 1e-12); near(M.gFactor(1400, 0.29) / M.gFactor(1400, 0.24), 0.29 / 0.24, 1e-12); near(M.omega(1400) * 0.24 * 3.6, 126.67, 0.01);
  near(M.rmc(0), 0.93, 1e-12); near(M.rmc(M.gFactor(1400, 0.24)), 0.4753, 1e-4); near(M.rmc(M.gFactor(1000, 0.24)), 0.6048, 1e-4); near(M.rmc(1e6), 0.38, 1e-9); for (let g = 50; g <= 1000; g += 50) ok(M.rmc(g) < M.rmc(g - 50), 'water left falls with the pull');
  near(M.fn(60), 2.4996, 1e-4); near(M.fn(15) / M.fn(60), 2, 1e-12);
  const s = M.shake(1400, 0.5, 60, 0.2); near(s.lim, 0.002, 1e-15); near(s.r, 9.3347, 1e-3); near(s.X * 1000, 2.0213, 1e-3); near(s.F0, 2579.26, 0.05); near(s.FT, 115.64, 0.05); ok(s.phase > 3 && s.phase < Math.PI, 'far above resonance the lump is opposite the swing');
  const res = M.shake(M.fn(60) * 60, 0.5, 60, 0.2); near(res.X, 0.002 / 0.4, 1e-9); near(res.phase, Math.PI / 2, 1e-9);
  near(M.shake(20, 0.5, 60, 0.2).phase, 0, 0.06); near(M.shake(1e5, 0.5, 60, 0.2).X, 0.002, 1e-6); near(M.shake(1400, 1, 60, 0.2).X / s.X, 2, 1e-12); near(M.shake(1400, 0.5, 30, 0.2).X * 1000, 4.086, 0.002);
  { let best = 0, at = 0; for (let q = 10; q <= 1600; q += 1) { const x = M.shake(q, 0.5, 60, 0.2).X; if (x > best) { best = x; at = q; } } ok(at > 150 && at < 170, 'the peak sits just above the natural speed'); ok(best > 0.005 && best < 0.0052, 'peak a little over (me/M)/(2 zeta)'); }
  ok(s.FT < 0.05 * s.F0, 'isolation passes under a twentieth of the force'); ok(M.shake(1400, 0.5, 60, 0.05).FT < s.FT, 'at speed, less damping passes less force');
};
