// Escalators: riser and tread are the sine and cosine parts of the step pitch; the chain path reaches the stated
// rise, is level at both ends and has unit speed; the trailing track is the chain track shifted bodily, so the
// perpendicular gap is c cos(theta) - b sin(theta); capacity and power follow their formulas.
module.exports = (M, { ok, near }) => {
  near(M.riser(30), 0.2, 1e-12); near(M.going(30), 0.34641, 1e-5); near(M.riser(35), 0.22943, 1e-5); near(M.riser(30) ** 2 + M.going(30) ** 2, 0.16, 1e-12); near(M.riser(0), 0, 1e-12);
  for (const th of [20, 27, 30, 35]) { const p = M.chainPath(th); near(p.top.z, 3, 1e-4); near(p.top.a, 0, 1e-9); near(p.pts[0].a, 0, 1e-12); ok(Math.max(...p.pts.map((q) => q.a)) <= th * Math.PI / 180 + 1e-9, 'the chain is never steeper than the slope'); near(Math.max(...p.pts.map((q) => q.a)), th * Math.PI / 180, 1e-9);
    for (let i = 1; i < p.pts.length; i += 37) { const a = p.pts[i - 1], b = p.pts[i]; near(Math.hypot(b.x - a.x, b.z - a.z), b.s - a.s, 1e-6); } near(p.total, 2 * p.Lup + 2 * Math.PI * 0.375, 1e-9);
    const a0 = p.at(0), a1 = p.at(p.total); near(a0.x, a1.x, 1e-6); near(a0.z, a1.z, 1e-6); const mid = p.at(p.Lup + Math.PI * 0.375 / 2); near(mid.x, p.top.x + 0.375, 1e-9); near(mid.z, p.top.z - 0.375, 1e-9); const ret = p.at(p.Lup + Math.PI * 0.375 + 1); ok(ret.zone === 2 && Math.abs(ret.z - (p.top.z - 0.75)) < 1e-6, 'the return run is 0.75 m below'); }
  { const p = M.chainPath(30); near(p.Ls, 5.1962, 1e-3); near(p.Lup, 11.367, 1e-3); near(p.total, 25.090, 1e-3); near(Math.round(p.total / 0.4), 63, 1e-9); near(Math.round(p.Lup / 0.4), 28, 1e-9); near(M.chainPath(30, 6).top.z, 6, 1e-4); }
  near(M.trackGap(0.2, 0.2, 0), 0.2, 1e-12); near(M.trackGap(0.2, 0.2, 30), 0.073205, 1e-6); near(M.trackGap(0.2, 0.2, 45), 0, 1e-12); near(M.trackGap(0.25, 0.14, Math.atan(0.14 / 0.25) * 180 / Math.PI), 0, 1e-12); ok(M.trackGap(0.25, 0.14, 30) < 0, 'those tracks have crossed by 30 degrees');
  { const th = 30 * Math.PI / 180, n = [-Math.sin(th), Math.cos(th)]; near(-(-0.2 * n[0] + -0.2 * n[1]), M.trackGap(0.2, 0.2, 30), 1e-12); }
  near(M.capacity(0.5, 2), 9000, 1e-9); near(M.capacity(0.5, 1), 4500, 1e-9); near(M.capacity(0.75, 2), 13500, 1e-9); near(M.capacity(0.5, 2, 0.5), 4500, 1e-9);
  near(M.liftPower(4500, 6), 1.25 * 75 * 9.80665 * 6 / 0.8, 1e-9); near(M.liftPower(4500, 6) / 1000, 6.895, 1e-3); near(M.liftPower(9000, 6) / M.liftPower(4500, 6), 2, 1e-12); near(M.idlePower(6), 2400, 1e-12); near(M.rideTime(6, 0.5, 30), 24, 1e-9); near((M.idlePower(6) + M.liftPower(4500, 6)) / 4500, 2.0656, 1e-3);
};
