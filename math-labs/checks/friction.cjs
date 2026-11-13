// Friction: the critical angle is atan(mu_s) whatever the mass; friction equals demand below it and mu_k N above;
// the capstan ratio is exp(mu phi) and compounds turn by turn; the stick-slip cycle is continuous in position and
// velocity, its slip is a harmonic arc about the sliding balance point, and it conserves the stated timings.
module.exports = (M, { ok, near }) => {
  near(M.critAngle(0.5), 26.565, 1e-3); near(M.critAngle(1), 45, 1e-9); for (const m of [1, 5, 20]) { ok(M.holds(26, 0.5) && !M.holds(27, 0.5), 'the block lets go at the angle of friction'); near(M.frictionForce(m, 20, 0.5, 0.4), m * 9.81 * Math.sin(20 * Math.PI / 180), 1e-9); near(M.frictionForce(m, 35, 0.5, 0.4) / m, 0.4 * 9.81 * Math.cos(35 * Math.PI / 180), 1e-9); }
  near(M.demand(5, 20), 16.776, 1e-3); near(M.available(5, 20, 0.5), 23.046, 1e-3); near(M.slideAccel(35, 0.5, 0.4), 2.4124, 1e-3); near(M.slideAccel(20, 0.5, 0.4), 0, 1e-12); near(M.demand(5, M.critAngle(0.5)), M.available(5, M.critAngle(0.5), 0.5), 1e-9);
  near(M.capstanRatio(0.3, 1), 6.5861, 1e-3); near(M.capstanRatio(0.3, 3), 285.678, 1e-2); near(M.capstanRatio(0.3, 3), M.capstanRatio(0.3, 1) ** 3, 1e-9); near(M.capstanRatio(0.3, 0), 1, 1e-12); near(M.capstanRatio(0.6, 1), M.capstanRatio(0.3, 2), 1e-9); near(M.turnsFor(0.3, 1000), 3.6647, 1e-3); near(M.capstanRatio(0.3, M.turnsFor(0.3, 1000)), 1000, 1e-8);
  { let T = 1; const n = 20000, phi = 6 * Math.PI; for (let i = 0; i < n; i++) T += 0.3 * T * phi / n; near(T / M.capstanRatio(0.3, 3), 1, 2e-3); }
  const s = M.stickSlip(1, 200, 0.02, 0.5, 0.3); near(s.x1, 0.024525, 1e-9); near(s.xk, 0.014715, 1e-9); near(s.x2, 0.004905, 1e-9); near(s.tStick, 0.981, 1e-9); near(s.tSlip, 0.24239, 1e-4); near(s.freq, 0.8174, 1e-3); near(s.natural, 2.2508, 1e-3);
  for (const [k, v, ms, mk] of [[200, 0.02, 0.5, 0.3], [2000, 0.2, 0.4, 0.3], [500, 0.05, 0.8, 0.3]]) { const q = M.stickSlip(1, k, v, ms, mk), e = 1e-7;
    near(M.blockAt(0, q, v).x, q.x2, 1e-12); near(M.blockAt(q.tStick, q, v).x, q.x1, 1e-9); near(M.blockAt(q.tStick + e, q, v).x, q.x1, 1e-6); near(M.blockAt(q.tStick + e, q, v).u, v, 1e-4); near(M.blockAt(q.period - e, q, v).x, q.x2, 1e-6); near(M.blockAt(q.period - e, q, v).u, v, 1e-4);
    for (const f of [0.2, 0.5, 0.8]) { const t = q.tStick + f * q.tSlip, h = 1e-6, a = (M.blockAt(t + h, q, v).u - M.blockAt(t - h, q, v).u) / (2 * h), x = M.blockAt(t, q, v).x; near(a, -k * (x - q.xk), 1e-3 * (1 + Math.abs(a))); ok(M.blockAt(t, q, v).u < v + 1e-9, 'while slipping the block is slower than the belt'); }
    near(q.tStick, 2 * (ms - mk) * 9.81 / (k * v), 1e-9); ok(q.tSlip > Math.PI / q.om && q.tSlip < 2 * Math.PI / q.om, 'the slip lasts between a half and a whole natural period'); }
  { const q = M.stickSlip(1, 2000, 0.2, 0.4, 0.3); near(q.tStick, 0.004905, 1e-9); near(q.freq, 7.1166, 1e-3); near(q.freq / q.natural, 1, 1e-3); }
  ok(M.stickSlip(1, 200, 0.04, 0.5, 0.3).tStick < M.stickSlip(1, 200, 0.02, 0.5, 0.3).tStick && M.stickSlip(1, 400, 0.02, 0.5, 0.3).period < M.stickSlip(1, 200, 0.02, 0.5, 0.3).period, 'a faster belt or a stiffer spring shortens the cycle');
};
