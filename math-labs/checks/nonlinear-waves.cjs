// Nonlinear waves: the two-soliton formula satisfies KdV to discretisation accuracy, reduces to one soliton when the
// other is far away, keeps the faster soliton's height, and its peaks follow the predicted tracks with the predicted
// phase shifts; the integral of u is conserved (2 k1 + 2 k2 for two solitons); the inviscid breaking time matches
// 1/max(-u0'); the Cole-Hopf solution starts at u0, conserves the integral of u, is near the inviscid solution before
// breaking and steepens into a shock after; the FPUT chain conserves energy, keeps it in mode 1 when linear and shows
// the near-recurrence when nonlinear.
module.exports = (M, { ok, near }) => {
  for (const [k1, k2] of [[1.4, 0.8], [2, 0.6], [1.1, 0.9]]) {
    const U = (x, t) => M.kdv(x, t, k1, k2), h = 1e-3;
    for (const [x, t] of [[0.3, 0.1], [-1, -0.5], [2, 0.8], [6, 3]]) {
      const ut = (U(x, t + h) - U(x, t - h)) / (2 * h), ux = (U(x + h, t) - U(x - h, t)) / (2 * h), uxxx = (U(x + 2 * h, t) - 2 * U(x + h, t) + 2 * U(x - h, t) - U(x - 2 * h, t)) / (2 * h ** 3);
      near(ut + 6 * U(x, t) * ux + uxxx, 0, 1e-4);
    }
    let I = 0; for (let x = -60; x <= 60; x += 0.01) I += U(x, 1.3) * 0.01; near(I, 2 * k1 + 2 * k2, 1e-3);
    const tf = Math.max(8, 14 / (k1 * k1 - k2 * k2)); for (const t of [-tf, tf]) {
      const c = M.tracks(t, k1, k2);
      let best = -1, bx = 0; for (let x = c[0] - 2; x < c[0] + 2; x += 1e-3) { const u = U(x, t); if (u > best) { best = u; bx = x; } }
      near(bx, c[0], 0.02); near(best, k1 * k1 / 2, 0.01);
      near(U(c[1], t), M.soliton(0, 0, k2) + M.soliton(c[1] - c[0], 0, k1), 0.02);
    }
  }
  near(M.phaseShift(1.4, 0.8)[0], 1.856118, 1e-5); near(M.phaseShift(1.4, 0.8)[1], 3.248207, 1e-5);
  // Burgers
  for (const a of [0.5, 1, 2]) {
    let mx = 0; for (let x = 0; x < 3; x += 1e-4) mx = Math.max(mx, 2 * a * x * Math.exp(-x * x));
    near(M.breakTime(a), 1 / mx, 1e-6);
  }
  near(M.erf(1), 0.8427007929, 2e-7);
  const g = M.burgersGrid(1);
  near(M.burgers(0.3 + 0.03 * M.u0B(0.3, 1), 0.03, 1, 0.01, g), M.u0B(0.3, 1), 3e-3);
  for (const t of [0.5, 2.5]) { let I = 0; for (let x = -6; x <= 10; x += 0.01) I += M.burgers(x, t, 1, 0.03, g) * 0.01; near(I, Math.sqrt(Math.PI), 2e-3); }
  // before breaking, close to the characteristic solution
  const s = 0.4, t1 = 0.6, x1 = s + M.u0B(s, 1) * t1; near(M.burgers(x1, t1, 1, 0.005, g), M.u0B(s, 1), 0.01);
  // after breaking the profile is much steeper than the initial maximum slope
  let mxs = 0, xp = -3, up = M.burgers(-3, 3, 1, 0.01, g); for (let x = -3 + 0.01; x < 6; x += 0.01) { const u = M.burgers(x, 3, 1, 0.01, g); mxs = Math.max(mxs, (up - u) / 0.01); up = u; xp = x; }
  ok(mxs > 5 / M.breakTime(1), 'shock forms');
  // FPUT
  const R = M.fput(16, 0.25, 1, 400, 0.05, 50), st = R.state(), X0 = new Float64Array(18); for (let j = 1; j <= 16; j++) X0[j] = Math.sin((Math.PI * j) / 17);
  near(R.energy(st.x, st.v), R.energy(X0, new Float64Array(18)), 1e-4);
  const L0 = M.fput(16, 0, 1, 400, 0.05, 50); for (const E of L0.E) { const tot = E.reduce((a, b) => a + b, 0); near(E[1] / tot, 1, 1e-9); }
  const F = M.fput(32, 0.25, 1, 11000, 0.1, 40), tot = F.E[0].reduce((a, b) => a + b, 0), e1 = F.E.map((E) => E[1] / tot);
  ok(Math.min(...e1) < 0.2, 'energy leaves mode 1');
  ok(Math.max(...e1.slice(Math.floor(e1.length * 0.8))) > 0.95, 'and returns');
};
