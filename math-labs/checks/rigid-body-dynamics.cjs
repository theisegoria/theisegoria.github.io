// Rigid-body dynamics: conservation laws, linear stability of the principal axes, the heavy top, and the inertia theorems.
module.exports = (R, { ok, near }) => {
  const I = R.boxInertia(3, 2, 0.6), TAU = 2 * Math.PI;
  near(I[0], (4 + 0.36) / 12, 1e-12); near(I[2], I[0] + I[1] - 0.6 * 0.6 / 6, 1e-12);
  // 1. torque-free motion keeps E, |L| in the body, and the whole vector L in space
  const runs = [0, 1, 2].map((j) => { const w0 = [0.01, 0.01, 0.01]; w0[j] = 1; return R.integrateFree(I, w0, 60); });
  runs.forEach((run) => {
    const E = run.map((s) => R.energy(I, s.w)), L0 = R.Lspace(I, run[0]);
    near(Math.max(...E) - Math.min(...E), 0, 1e-10);
    near(Math.max(...run.map((s) => { const l = R.Lspace(I, s); return Math.hypot(l[0] - L0[0], l[1] - L0[1], l[2] - L0[2]); })), 0, 1e-9);
  });
  // 2. the long and short axes are stable, the middle one flips
  ok(runs[0].every((s) => s.w[0] > 0.9) && runs[2].every((s) => s.w[2] > 0.9), 'extreme axes stay put');
  ok(runs[1].some((s) => s.w[1] < -0.9), 'middle axis flips');
  // 3. linear theory: wobble frequency about the long axis, growth rate about the middle axis
  { const eps = 1e-4, run = R.integrateFree(I, [1, eps, 0], 30, 0.002, 1), zs = [];
    for (let i = 1; i < run.length; i++) if (run[i - 1].w[1] > 0 && run[i].w[1] <= 0) zs.push(run[i].t);
    near((zs.at(-1) - zs[0]) / (zs.length - 1), TAU / R.wobble(I, 0, 1).rate, 1e-3); }
  { const eps = 1e-7, run = R.integrateFree(I, [0, 1, eps], 12, 0.002, 1), lam = R.wobble(I, 1, 1).rate;
    const a = run.find((s) => s.t >= 6), b = run.find((s) => s.t >= 10), meas = Math.log(Math.hypot(b.w[0], b.w[2]) / Math.hypot(a.w[0], a.w[2])) / (b.t - a.t);
    near(meas, lam, 1e-3); }
  // 4. the separatrix planes L3 = +-k L1 lie on the energy level of the middle axis
  { const k = R.sepSlope(I), Lb = [0.3, 0.8, 0.3 * k], n = Math.hypot(...Lb), u = Lb.map((x) => x / n);
    near(u[0] * u[0] / I[0] + u[1] * u[1] / I[1] + u[2] * u[2] / I[2], 1 / I[1], 1e-12); }
  // 5. heavy top: steady precession keeps the tilt; energy is conserved; fast-top precession and nutation rates
  const P = { I1: 1, I3: 0.8, mgl: 4, w3: 30, th0: Math.PI / 3, mode: 1 };
  near(Math.max(...R.topRun(P, 8).samples.map((s) => Math.abs(s.th - P.th0))), 0, 1e-9);
  near(R.steadyRate({ ...P, th0: Math.PI / 2 }, Math.PI / 2), P.mgl / (P.I3 * P.w3), 1e-12);
  { const Q = { ...P, mode: 0 }, S = R.topRun(Q, 20).samples, E = S.map((s) => R.topEnergy(Q, s));
    near(Math.max(...E) - Math.min(...E), 0, 1e-6);
    near(S.at(-1).ph / S.at(-1).t / (Q.mgl / (Q.I3 * Q.w3)), 1, 0.02);
    const mins = []; for (let i = 1; i < S.length - 1; i++) if (S[i].th < S[i - 1].th && S[i].th <= S[i + 1].th) mins.push(S[i].t);
    near((mins.at(-1) - mins[0]) / (mins.length - 1) / (TAU / (Q.I3 * Q.w3 / Q.I1)), 1, 0.02);
    ok(S.every((s) => s.th >= Q.th0 - 1e-9), 'released from rest, the axle never rises above its start'); }
  // 6. planar inertia: tensor quadratic form = sum m r_perp^2, principal values, perpendicular and parallel axis theorems
  const ms = [[-1.25, 0.45, 1], [0.95, 0.95, 1], [1.15, -0.65, 1], [-0.45, -1.05, 2.5]], cm = R.centreOfMass(ms);
  const Ic = R.inertia2(ms, [cm[0], cm[1]]), pr = R.principal(Ic);
  for (const a of [0, 0.4, 1.3, 2.9]) near(R.momentFromTensor(Ic, a), R.momentAbout(ms, [cm[0], cm[1]], a), 1e-12);
  near(R.momentAbout(ms, [cm[0], cm[1]], pr.aMax), pr.Imax, 1e-12); near(R.momentAbout(ms, [cm[0], cm[1]], pr.aMin), pr.Imin, 1e-12);
  near(pr.Imin + pr.Imax, Ic.zz, 1e-12);
  ok(Array.from({ length: 360 }, (_, i) => R.momentAbout(ms, [cm[0], cm[1]], i * Math.PI / 360)).every((x) => x <= pr.Imax + 1e-12 && x >= pr.Imin - 1e-12), 'principal values bound every moment');
  for (const a of [0.2, 1.1]) { const d = cm[0] * Math.sin(a) - cm[1] * Math.cos(a); near(R.momentAbout(ms, [0, 0], a), R.momentAbout(ms, [cm[0], cm[1]], a) + cm[2] * d * d, 1e-12); }
  { const J = R.inertia2([[1, 0, 1], [-1, 0, 1], [0, 2, 1], [0, -2, 1]], [0, 0]); near(J.xx, 8, 1e-12); near(J.yy, 2, 1e-12); near(J.xy, 0, 1e-12); }
};
