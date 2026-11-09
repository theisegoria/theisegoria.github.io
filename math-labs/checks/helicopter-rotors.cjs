// Helicopter rotors: the swashplate plane produces exactly the commanded pitch through links at the lead angle; the
// flapping solution in hover matches gamma (theta0/8 - lambda/6) with no first harmonics, and in forward flight the
// advancing blade flaps up (beta1s > 0 in the beta0 - beta1c cos - beta1s sin convention used); momentum theory gives
// v_h, joins the vortex-ring fit continuously in hover, has the windmill branch, and ideal autorotation satisfies
// V_c + v_i = 0 near -1.78 v_h.
module.exports = (M, { ok, near }) => {
  const DEG = Math.PI / 180, rh = 0.27, R = Math.hypot(0.42, rh), d = Math.atan2(rh, 0.42);
  for (const [t0, c, s] of [[6, 0, -4], [8, 3, -2], [2, -5, 5]]) {
    const P = M.plate(t0 * DEG, c * DEG, s * DEG, rh, R, d);
    for (const psi of [0, 0.7, 2, 4.4]) near(M.plateZ(P, R, psi + d) / rh, M.pitch(psi, t0 * DEG, c * DEG, s * DEG), 1e-12);
  }
  for (const [g, th, lam] of [[8, 8, 0.05], [5, 10, 0.03], [11, 6, 0.07]]) {
    const F = M.flapping({ mu: 0, th0: th * DEG, lam, gamma: g });
    near(F.b0, M.hoverConing(g, th * DEG, lam), 3e-4); near(F.b1c, 0, 1e-6); near(F.b1s, 0, 1e-6);
  }
  const G = M.flapping({ mu: 0.3, th0: 8 * DEG, lam: 0.05, gamma: 8 });
  ok(G.b1s > 0, 'advancing side flaps up, with the maximum near psi = 180');
  ok(G.b1c > 0, 'with no cyclic the disc tilts back');
  near(M.vh(2000 * 9.81, 1.225, 5), 10.0977, 1e-3);
  near(M.inducedRatio(0), 1, 1e-12); near(M.inducedRatio(1e-9), 1, 1e-6); near(M.inducedRatio(-1e-9), 1, 1e-6);
  near(M.inducedRatio(3), -1.5 + Math.sqrt(3.25), 1e-12); near(M.inducedRatio(-3), 1.5 - Math.sqrt(1.25), 1e-12);
  const xa = M.autorotation(); near(xa + M.inducedRatio(xa), 0, 1e-9); near(xa, -1.7766, 1e-3);
  // momentum identity in climb: T = 2 rho A v_i (V_c + v_i), i.e. x_i (x + x_i) = 1 in hover units
  for (const x of [0.5, 1, 2.5]) { const xi = M.inducedRatio(x); near(xi * (x + xi), 1, 1e-12); }
};
