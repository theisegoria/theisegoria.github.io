// Wind turbines: the actuator-disc formulas (Betz maximum 16/27 at a = 1/3, C_T, momentum identity), the stream tube
// conserves mass flow and widens to the wake area; Glauert's ideal rotor computed two independent ways agrees and rises
// towards 16/27; the designed blade has the Betz-optimum chord and twist, its BEM C_P stays below Glauert's ideal and
// peaks near the design tip-speed ratio, the induction factors are near 1/3 at design, and pitching to feather sheds power.
module.exports = (M, { ok, near }) => {
  let best = [0, 0]; for (let a = 0; a <= 0.5; a += 1e-4) if (M.cp(a) > best[1]) best = [a, M.cp(a)];
  near(best[0], 1 / 3, 2e-4); near(best[1], 16 / 27, 1e-7);
  for (const a of [0.1, 0.25, 1 / 3]) { near(M.ct(a) * (1 - a), M.cp(a), 1e-12); }
  for (const a of [0.1, 0.25, 1 / 3]) {
    near(M.axialSpeed(0, a), 1 - a, 1e-12); near(M.axialSpeed(1e6, a), 1 - 2 * a, 1e-6); near(M.axialSpeed(-1e6, a), 1, 1e-6);
    for (const x of [-2, 0, 1.5, 50]) near(M.tubeRadius(x, a) ** 2 * M.axialSpeed(x, a), 1 - a, 1e-9);
    near(M.tubeRadius(1e6, a) ** 2, (1 - a) / (1 - 2 * a), 1e-5);
  }
  // Glauert from its definition: C_P = (8/lam^2) int a'(1 - a) lr^3 dlr
  const aOf = (lr) => { let lo = 0.25, hi = 1 / 3 - 1e-14; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (((1 - m) * (4 * m - 1) ** 2) / (1 - 3 * m) < lr * lr) lo = m; else hi = m; } return (lo + hi) / 2; };
  for (const lam of [1, 3, 7]) {
    const N = 3000; let s = 0; for (let i = 0; i < N; i++) { const lr = ((i + 0.5) / N) * lam, a = aOf(lr), ap = (1 - 3 * a) / (4 * a - 1); s += ap * (1 - a) * lr ** 3 * (lam / N); }
    near(M.glauertCp(lam), (8 / (lam * lam)) * s, 2e-4);
  }
  ok(M.glauertCp(2) < M.glauertCp(6) && M.glauertCp(6) < M.glauertCp(30) && M.glauertCp(30) < 16 / 27, 'Glauert rises to Betz');
  near(M.glauertCp(1e3), 16 / 27, 1e-4);
  for (const r of [0.3, 0.6, 0.9]) { near(M.designPhi(r), (2 / 3) * Math.atan(1 / (M.LD * r)), 1e-12); const c = (8 * Math.PI * r * (1 - Math.cos(M.designPhi(r)))) / (M.B * 1.0); near(M.chord(r), Math.min(0.085, c), 1e-12); }
  const curve = []; for (let l = 2; l <= 13; l += 0.25) curve.push([l, M.bem(l, 0).cp]);
  for (const [l, c] of curve) ok(c < M.glauertCp(l) + 1e-9, `BEM below Glauert at ${l}`);
  const pk = curve.reduce((m, p) => (p[1] > m[1] ? p : m));
  ok(pk[0] > 6 && pk[0] < 9 && pk[1] > 0.4, 'BEM peak near design');
  const d = M.bem(7, 0); const mid = d.ann.filter((q) => q.r > 0.4 && q.r < 0.85); ok(mid.every((q) => q.a > 0.2 && q.a < 0.4), 'induction near 1/3 at design');
  ok(M.bem(7, 10 * Math.PI / 180).cp < 0.5 * d.cp, 'pitching to feather sheds power');
};
