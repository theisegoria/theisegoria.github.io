// Zippers: the chain path is straight below the throat, has unit speed and ends at the half-angle; the wedge forces
// follow tan(alpha +/- phi) and vanish below the friction angle; the tip opening is P L / R.
module.exports = (M, { ok, near }) => {
  const psi = 27 * Math.PI / 180;
  { const p = M.chainPath(-2, psi); near(p.x, 0, 1e-12); near(p.z, -2, 1e-12); near(p.a, 0, 1e-12); } near(M.chainPath(5, psi).a, psi, 1e-12); near(M.chainPath(0.7, psi).a, psi / 2, 1e-12);
  for (const u of [0.5, 1.4, 3, 6]) { const a = M.chainPath(u, psi), b = M.chainPath(u + 1e-3, psi); near(Math.hypot(b.x - a.x, b.z - a.z), 1e-3, 2e-5); ok(a.x > 0 && a.z > 0 && a.z < u, 'the path leans away and rises'); }
  { const a = M.chainPath(3, psi), b = M.chainPath(5, psi); near((b.x - a.x) / (b.z - a.z), Math.tan(psi), 1e-9); near(a.x * 5, 5.23, 0.02); near(a.z * 5, 13.85, 0.02); }
  near(M.smooth(0), 0, 1e-12); near(M.smooth(1), 1, 1e-12); near(M.smooth(0.5), 0.5, 1e-12);
  near(M.phiF(0.2) * 180 / Math.PI, 11.310, 1e-3); near(M.pullForce(20, 25, 0.2), 29.394, 1e-3); near(M.backForce(20, 25, 0.2), 9.744, 1e-3); near(M.pullForce(20, 10, 0.2), 15.603, 1e-3); near(M.backForce(20, 10, 0.2), 0, 1e-12);
  near(M.pullForce(20, 25, 0), 2 * 20 * Math.tan(25 * Math.PI / 180), 1e-12); near(M.backForce(20, 25, 0), M.pullForce(20, 25, 0), 1e-12); near(M.pullForce(40, 25, 0.2) / M.pullForce(20, 25, 0.2), 2, 1e-12);
  for (let a = 6; a <= 50; a++) { ok(M.pullForce(20, a, 0.2) > M.pullForce(20, a - 1, 0.2), 'wider Y, harder pull'); ok(M.pullForce(20, a, 0.2) > M.backForce(20, a, 0.2), 'friction always costs'); } ok(M.backForce(20, 11, 0.2) === 0 && M.backForce(20, 12, 0.2) > 0, 'self-locking ends at the friction angle');
  near(M.sliderLen(3, 25), 6.4335, 1e-3); near(M.sliderLen(3, 10), 17.014, 1e-3); near(M.sliderLen(3, 45), 3, 1e-9);
  near(M.tipOpening(2.6, 3, 30), 0.26, 1e-12); near(M.critRadius(2.6, 3, 0.35), 22.286, 1e-3); near(M.tipOpening(2.6, 3, M.critRadius(2.6, 3, 0.35)), 0.35, 1e-12); near(M.tipOpening(2.6, 3, 15) / M.tipOpening(2.6, 3, 30), 2, 1e-12);
  near(M.teethPer(2.6, 100), 76.923, 1e-3); near(200 / M.teethPer(2.6, 100), 2.6, 1e-9);
};
