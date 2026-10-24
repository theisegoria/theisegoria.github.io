// Robot kinematics: IK inverts FK for both elbows; the two solutions share q1 and mirror q3; unreachable targets flagged;
// the Jacobian matches finite differences of FK, det J = -L2 L3 r sin q3, the product of singular values is |det J|,
// a straight elbow is singular; trajectories start and end at A and B, the straight plan stays on the segment, and
// passing near the base axis costs far more joint speed than the joint-space plan; planar helpers.
module.exports = (M, { ok, near }) => {
  const r = (d) => d * Math.PI / 180;
  for (const [x, y, z] of [[0.6, 0.3, 0.7], [-0.4, 0.5, 0.2], [0.2, -0.7, 1.1], [0.9, 0.1, 0.5]]) {
    for (const up of [true, false]) { const s = M.ik(x, y, z, up); ok(s.reach, `reachable ${x},${y},${z}`); const p = M.fk(s.q1, s.q2, s.q3).tool; near(p[0], x, 1e-9); near(p[1], y, 1e-9); near(p[2], z, 1e-9); }
    const a = M.ik(x, y, z, true), b = M.ik(x, y, z, false); near(a.q1, b.q1, 1e-12); near(a.q3, -b.q3, 1e-12);
  }
  ok(!M.ik(1.2, 0, 0.5).reach && !M.ik(0, 0.05, 0.52).reach, 'outside the outer shell and inside the inner one are unreachable');
  { const s = M.ik(0.6, 0.3, 0.7); near(s.Dc, -0.2, 1e-12); near(s.q2 * 180 / Math.PI, 61.0169, 1e-3); }
  // Jacobian against finite differences
  for (const q of [[0.5, 0.9, -1.4], [-2, 0.3, 0.8], [1.1, -0.2, -2.6]]) {
    const J = M.jacobian(...q), h = 1e-6;
    for (let j = 0; j < 3; j++) { const qp = q.slice(), qm = q.slice(); qp[j] += h; qm[j] -= h; const a = M.fk(...qp).tool, b = M.fk(...qm).tool; for (let i = 0; i < 3; i++) near(J[i][j], (a[i] - b[i]) / (2 * h), 1e-7); }
    const rr = M.fk(...q).r; near(M.det3(J), -M.L2 * M.L3 * rr * Math.sin(q[2]), 1e-12);
    const m = M.manip(...q); near(m.w, Math.abs(m.det), 1e-9);
  }
  { const m = M.manip(r(30), r(50), r(-80)); near(m.det, 0.24187, 1e-4); near(m.sv[1], M.fk(r(30), r(50), r(-80)).r, 1e-9); ok(m.sv[0] >= m.sv[1] && m.sv[1] >= m.sv[2], 'singular values sorted'); }
  near(M.manip(0.3, 0.6, 0).det, 0, 1e-12);
  { const e = M.eigSym([[2, 1, 0], [1, 2, 0], [0, 0, 5]]); near(e.values[0], 5, 1e-12); near(e.values[1], 3, 1e-12); near(e.values[2], 1, 1e-12); }
  // trajectories
  for (let k = 0; k < 3; k++) for (const mode of [0, 1]) { const tr = M.trajectory(k, mode, 120), { a, b } = M.PATHS[k]; for (let i = 0; i < 3; i++) { near(tr[0].p[i], a[i], 1e-9); near(tr[120].p[i], b[i], 1e-9); } near(tr[0].speed, 0, 0.2); }
  { const tr = M.trajectory(0, 1, 100), { a, b } = M.PATHS[0]; const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; for (const o of tr) { const w = [o.p[0] - a[0], o.p[1] - a[1], o.p[2] - a[2]]; const cx = w[1] * d[2] - w[2] * d[1], cy = w[2] * d[0] - w[0] * d[2], cz = w[0] * d[1] - w[1] * d[0]; near(Math.hypot(cx, cy, cz), 0, 1e-9); } }
  { const J = M.trajectory(1, 0), C = M.trajectory(1, 1); ok(Math.max(...C.map((o) => o.speed)) > 3 * Math.max(...J.map((o) => o.speed)), 'near the base axis the straight plan needs a burst of joint speed'); ok(M.pathLength(J) > M.pathLength(C), 'the straight line is shorter'); }
  near(M.cubic(0.5), 0.5, 1e-15); near(M.cubic(1), 1, 1e-15);
  { const [x, y] = M.planarFK(1, 1, Math.PI / 2, -Math.PI / 2); near(x, 1, 1e-12); near(y, 1, 1e-12); near(M.planarDet(1, 0.5, Math.PI / 2), 0.5, 1e-15); }
};
