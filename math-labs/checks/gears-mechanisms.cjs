// Gears: the involute is perpendicular to its generating tangent, contact ratio against the worked example, contacts lie on both flanks, the ratio is exact even with extra centre distance; the going train's periods; Willis's equation in every mode.
module.exports = (M, { ok, near }) => {
  const a20 = 20 * Math.PI / 180;
  // the involute point at roll angle t is at distance rb*t from its tangency point and at radius rb*sqrt(1+t^2)
  { const p = M.involutePoint(5, 0.7); near(Math.hypot(p[0], p[1]), 5 * Math.sqrt(1 + 0.49), 1e-12); const tp = [5 * Math.cos(0.7), 5 * Math.sin(0.7)]; near(Math.hypot(p[0] - tp[0], p[1] - tp[1]), 3.5, 1e-12); }
  near(M.inv(a20), 0.014904, 1e-6); near(M.halfThick(M.gear(18, 1, a20), 9), Math.PI / 36, 1e-12);
  // worked example: z 18/30, contact ratio 1.59; pulled apart 0.3: alpha' 21.87 deg, eps 1.31
  { const m = M.mesh(18, 30, a20, 0); near(m.eps, 1.592, 2e-3); near(m.a, 24, 1e-12); near(m.ap, a20, 1e-12);
    const m2 = M.mesh(18, 30, a20, 0.3); near(m2.ap * 180 / Math.PI, 21.87, 0.01); near(m2.eps, 1.307, 2e-3); }
  // each contact point lies on a flank of gear 1 (radius and polar angle match the involute) and on a flank of gear 2
  for (const da of [0, 0.4]) for (const phi of [0.05, 0.3, 1.1]) {
    const m = M.mesh(18, 30, a20, da), C = M.contacts(m, phi); ok(C.s.length >= 1 && C.s.length <= 2, 'one or two pairs in contact');
    for (const s of C.s) { const q = C.point(s), R1 = Math.hypot(q[0], q[1]), ang1 = Math.atan2(q[1], q[0]);
      // gear 1 flank: angle = c - halfThick(R) for some tooth centre c = -phi + 2 pi k / z
      const k1 = (ang1 + phi + M.halfThick(m.g1, R1)) / (2 * Math.PI / 18); near(k1, Math.round(k1), 1e-6);
      const R2 = Math.hypot(q[0] - m.a, q[1]), ang2 = Math.atan2(q[1], q[0] - m.a), k2 = (ang2 - C.rot2 + M.halfThick(m.g2, R2)) / (2 * Math.PI / 30); near(k2, Math.round(k2), 1e-6); } }
  // the ratio is exact: gear 2 turns by z1/z2 of gear 1, with or without extra centre distance
  for (const da of [0, 0.5]) { const m = M.mesh(18, 30, a20, da), A = M.contacts(m, 0.2).rot2, B = M.contacts(m, 0.2 + 0.1).rot2; near((B - A) / 0.1, 18 / 30, 1e-12); }
  // outline closes and has the right number of teeth-length points
  { const o = M.outline(M.gear(12, 1, a20), 0); near(o[0][0], o[o.length - 1][0], 1e-12); ok(o.length > 12 * 20, 'outline resolution'); }
  // the going train
  { const R = M.train(4, 20, 8, 96); near(R.T4, 60, 1e-9); near(R.Tc, 3600, 1e-6); near(R.Tb / 3600, 7, 1e-9); near(60 * R.esc, 12, 1e-12);
    const R2 = M.train(3, 15, 8, 96); near(R2.T4, 60, 1e-9); const R3 = M.train(4, 15, 8, 96); near(R3.T4, 45, 1e-9); }
  // Willis in every mode, with the worked example's numbers
  for (const fixed of [0, 1, 2, 3]) near(M.willisResidual(M.epicyclic(24, 18, fixed, 1), 24), 0, 1e-12);
  near(M.epicyclic(24, 18, 0).wc, 2 / 7, 1e-12); near(M.epicyclic(24, 18, 1).wr, -0.4, 1e-12); near(M.epicyclic(24, 18, 2).wc, 60 / 84, 1e-12);
  near(M.epicyclic(80, 8, 3).wp, 11, 1e-12); ok(M.epicyclic(24, 18, 0).zr === 60, 'ring = sun + 2 planet');
  // a planet rolling on a fixed ring has its instantaneous centre on the ring pitch circle: the speed at the ring contact is zero
  for (const fixed of [0, 1, 2]) { const E = M.epicyclic(24, 18, fixed, 1), rs = 12, rp = 9; near(E.wc * (rs + rp) + E.wp * rp, E.wr * (rs + 2 * rp), 1e-12); near(E.wc * (rs + rp) - E.wp * rp, E.ws * rs, 1e-12); }
  ok(M.equalSpacing(24, 60, 3) && M.equalSpacing(24, 60, 4) && !M.equalSpacing(25, 61, 4), 'equal spacing rule');
};
