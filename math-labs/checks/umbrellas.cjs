// Umbrellas: the rib angle satisfies the cosine rule and closes at d = a + s; runnerFor inverts it; leverage is
// L |dphi/dd|; wind force goes as speed squared; rib bending and deflection follow cantilever formulas and scale
// inversely with the number of ribs.
module.exports = (M, { ok, near }) => {
  const a = 0.25, s = 0.27, L = 0.55; near(M.closedD(a, s), 0.52, 1e-12); near(M.ribAngle(0.52, a, s), 0, 1e-6); near(Math.cos(M.ribAngle(0.4, a, s)), (0.0625 + 0.16 - 0.0729) / 0.2, 1e-12); near(M.ribAngle(0.4, a, s) * 180 / Math.PI, 41.583, 1e-3);
  for (const d of [0.2, 0.3, 0.4, 0.5]) { const ph = M.ribAngle(d, a, s), J = [a * Math.sin(ph), -a * Math.cos(ph)]; near(Math.hypot(J[0], J[1] + d), s, 1e-9); }
  for (const ph of [0.3, 0.8, 1.2, 78 * Math.PI / 180]) near(M.ribAngle(M.runnerFor(ph, a, s), a, s), ph, 1e-8); near(M.runnerFor(78 * Math.PI / 180, a, s), 0.16644, 1e-5); near(2 * L * Math.sin(78 * Math.PI / 180), 1.0760, 1e-4);
  for (let d = 0.2; d < 0.5; d += 0.02) ok(M.ribAngle(d, a, s) > M.ribAngle(d + 0.02, a, s), 'raising the runner opens the ribs');
  near(M.leverage(0.4, a, s, L), 1.7651, 1e-3); near(M.leverage(0.5, a, s, L), 4.0142, 1e-2); near(M.leverage(0.16644, a, s, L), 1.5468, 1e-3); near(M.leverage(0.4, a, s, 1.1) / M.leverage(0.4, a, s, L), 2, 1e-6); ok(M.leverage(0.5, a, s, L) > M.leverage(0.4, a, s, L) && M.leverage(0.4, a, s, L) > M.leverage(0.2, a, s, L), 'leverage falls as the umbrella opens');
  near(M.maxAngle(0.25, 0.2) * 180 / Math.PI, 53.130, 1e-3); near(M.maxAngle(0.25, 0.27), Math.PI, 1e-12); near(M.ribAngle(Math.sqrt(0.25 ** 2 - 0.2 ** 2), 0.25, 0.2), M.maxAngle(0.25, 0.2), 1e-6);
  near(M.canopyArea(0.55, 1.4), 0.92288, 1e-4); near(M.windForce(15, 0.55), 174.42, 0.01); near(M.windForce(30, 0.55) / M.windForce(15, 0.55), 4, 1e-12); near(M.windForce(9, 0.55), 62.79, 0.01); near(M.windForce(15, 1.1) / M.windForce(15, 0.55), 4, 1e-9);
  const r = M.ribLoad(15, 0.55, 8, 0); near(r.w, 39.642, 1e-3); near(r.w * 0.55 * 8, r.F, 1e-9); near(r.Mb, 1.78388, 1e-4); near(r.stress / 1e6, 445.97, 0.01); near(r.frac, 0.37164, 1e-4); near(r.defl * 1000, 50.17, 0.01);
  near(M.ribLoad(15, 0.55, 16, 0).stress / r.stress, 0.5, 1e-12); near(M.ribLoad(15, 0.55, 16, 0).defl / r.defl, 0.5, 1e-12); near(M.ribLoad(15, 0.55, 8, 1).defl * 1000, 136.15, 0.02); near(M.ribLoad(15, 0.55, 8, 2).stress / 1e6, 837.50, 0.02);
  for (const m of [0, 1, 2]) { const vf = M.critical(0.55, 8, m, 'flip'), vb = M.critical(0.55, 8, m, 'break'); near(M.ribLoad(vf, 0.55, 8, m).defl, 0.35 * 0.3, 1e-6); near(M.ribLoad(vb, 0.55, 8, m).frac, 1, 1e-6); ok(vf < vb, 'these ribs flip before they break'); ok(M.critical(0.55, 16, m, 'break') > vb, 'more ribs survive more wind'); }
  near(M.critical(0.55, 8, 0, 'flip'), 21.70, 0.01); near(M.critical(0.55, 8, 0, 'break'), 24.61, 0.01); near(M.critical(0.55, 8, 1, 'flip'), 13.17, 0.01); near(M.critical(0.55, 8, 1, 'break'), 21.86, 0.01);
};
