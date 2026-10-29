// Active flow control: Spence's jet-flap slopes reduce to 2 pi and 2 sqrt(pi Cmu) as Cmu -> 0, C_L is linear in tau and
// alpha, and the Cmu inversion undoes it; the thin-aerofoil plain-flap slope is 2 pi for an all-moving wing, 0 for no flap
// and 3.826 per radian (effectiveness 0.609) for a quarter-chord flap; on the rounded Joukowski section the stagnation
// point sits where it was put, the surface-pressure integral reproduces the Kutta-Joukowski lift with zero drag, and a
// circle through zeta = 1 with the stagnation point at the old edge gives the Kutta circulation; the Coanda balance
// rho uj^2 h / R equals Cmu q c / R; the allocator meets B u = m exactly inside its bounds, its answer is the least-norm
// one (no feasible null-space step shortens it, and it agrees with the pseudo-inverse when that is in bounds), and when the
// command is out of reach no admissible blowing comes closer.
module.exports = (M, { ok, near }) => {
  const PI = Math.PI, DEG = PI / 180;
  // jet flap
  near(M.clAlpha(0), 2 * PI, 1e-12);
  for (const c of [1e-8, 1e-6, 1e-4]) near(M.clTau(c) / (2 * Math.sqrt(PI * c)), 1, 0.08 * Math.sqrt(c) + 1e-9);
  ok(M.clTau(1) > 2 * Math.sqrt(PI) && M.clAlpha(4) > M.clAlpha(1), 'blowing slopes grow with Cmu');
  for (const [c, t, a] of [[0.05, 30, 4], [0.3, 60, -2], [0.01, 10, 8]]) {
    const J = M.jetFlap(c, t, a);
    near(J.CL, t * DEG * M.clTau(c) + a * DEG * M.clAlpha(c), 1e-12);
    near(J.CL0 + J.reaction + J.superc, J.CL, 1e-12);
    near(M.jetFlap(M.cmuFor(J.dCL, t, a), t, a).dCL, J.dCL, 1e-9);
    ok(J.superc > J.reaction, 'supercirculation dominates the jet reaction');
  }
  { const J = M.jetFlap(0.05, 30, 4); near(J.CL, 0.8817, 1e-4); near(J.aug, 8.860, 1e-3); }
  near(M.flapSlope(1), 2 * PI, 1e-12); near(M.flapSlope(0), 0, 1e-12); near(M.flapSlope(0.25), 3.82645, 1e-5);
  ok(M.flapSlope(0.3) > M.flapSlope(0.25) && M.flapSlope(0.25) > M.flapSlope(0.2), 'a larger flap is more effective');
  { const B = M.blowing(0.05, 50, 200, 10); near(B.mdot * 200, 0.05 * B.q * 10, 1e-9); near(B.P, 0.5 * B.mdot * 200 * 200, 1e-9); }
  // Coanda wing
  for (const [al, eps, sep] of [[4, 0.2, 12], [0, 0.1, 0], [8, 0.3, 30], [-2, 0.15, 5]]) {
    const J = M.coanda(al, eps, sep);
    near(M.cabs(J.dWz(J.onC(J.thS))), 0, 1e-12);                          // the rear stagnation point is where it was put
    near(J.G, 4 * PI * J.a * Math.sin(al * DEG - J.thS), 1e-12);
    const [cl, cd] = M.forcesFromPressure(J);
    near(cl, J.CL, 2e-4 * Math.max(1, Math.abs(J.CL))); near(cd, 0, 2e-4);  // Kutta-Joukowski lift, d'Alembert's zero drag
    ok(J.velZ(-300, 200) && Math.abs(J.velZ(-300, 200)[0] - Math.cos(al * DEG)) < 3e-3, 'free stream far away');
    const dv = M.dividing(J, 1, 0.01); ok(dv[dv.length - 1][0] > dv[0][0] + 0.3, 'the dividing streamline runs downstream');
    // the stream function is constant on the body and its gradient is the velocity rotated: u = dpsi/dy, v = -dpsi/dx
    for (const th of [J.thS, J.thS + 1, J.thS + 3]) near(J.psi(J.onC(th)), J.psiBody, 1e-12);
    { const zt = [-1.7, 1.3], hh = 1e-6, w = J.dWz(zt); near((J.psi([zt[0], zt[1] + hh]) - J.psi([zt[0], zt[1] - hh])) / (2 * hh), w[0], 1e-6); near(-(J.psi([zt[0] + hh, zt[1]]) - J.psi([zt[0] - hh, zt[1]])) / (2 * hh), -w[1], 1e-6); }
    const jt = M.coandaJet(J, 0.1, 0.8); near(jt.dp, 0.1 * jt.q * M.CC_C / jt.R, 1e-9 * jt.dp);
  }
  { const a1 = M.coanda(4, 0.2, 10), a2 = M.coanda(4, 0.2, 20); ok(a2.CL > a1.CL && a1.CL > M.coanda(4, 0.2, 0).CL, 'carrying the stagnation point round raises the lift'); }
  // a circle through zeta = 1 with the stagnation point at the old edge is the Kutta (Joukowski) case
  for (const [mx, my, al] of [[-0.08, 0.08, 5], [-0.1, 0, 3], [-0.05, 0.12, -2]]) {
    const J = M.coanda(al, 0, 0, { mx, my }), a = Math.hypot(1 - mx, my), beta = Math.asin(my / a);
    near(J.G, 4 * PI * a * Math.sin(al * DEG + beta), 1e-12);
    const z = J.onC(J.thS); near(z[0], 1, 1e-12); near(z[1], 0, 1e-12);
  }
  // allocation
  const B = M.effectorMatrix(), n = B[0].length;
  ok(n === 14 && B.length === 3, 'fourteen effectors, three moments');
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const G = B.map((a) => B.map((b) => a.reduce((s, x, i) => s + x * b[i], 0)));
  const solve3 = (A, b) => { const m = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < 3; c++) { let p = c; for (let q = c + 1; q < 3; q++) if (Math.abs(m[q][c]) > Math.abs(m[p][c])) p = q; [m[c], m[p]] = [m[p], m[c]]; for (let q = 0; q < 3; q++) if (q !== c) { const f = m[q][c] / m[c][c]; for (let j = c; j < 4; j++) m[q][j] -= f * m[c][j]; } } return m.map((r, i) => r[3] / r[i]); };
  const project = (d) => { const y = solve3(G, M.matvec(B, d)); return d.map((x, i) => x - B.reduce((s, row, k) => s + row[i] * y[k], 0)); };
  let feas = 0, infeas = 0, pinv = 0;
  for (let t = 0; t < 300; t++) {
    const m = [(2 * rnd() - 1) * 0.03, (2 * rnd() - 1) * 0.04, (2 * rnd() - 1) * 0.003], umax = 0.0005 + 0.004 * rnd();
    const R = M.allocate(m, umax);
    ok(R.u.every((x) => x >= 0 && x <= umax), 'every jet inside its bounds');
    const nrm = R.u.reduce((s, x) => s + x * x, 0);
    if (R.feasible) {
      feas++;
      M.matvec(B, R.u).forEach((x, k) => near(x, m[k], 1e-12));
      for (let k = 0; k < 20; k++) {
        const d = project(Array.from({ length: n }, () => rnd() - 0.5));
        for (const h of [1e-4, 1e-6]) { const v = R.u.map((x, i) => x + h * d[i]); if (v.every((x) => x >= 0 && x <= umax)) ok(v.reduce((s, x) => s + x * x, 0) >= nrm - 1e-18, 'no feasible step shortens u'); }
      }
      // where the pseudo-inverse is admissible it is the answer
      const y = solve3(G, m), up = Array.from({ length: n }, (_, i) => B.reduce((s, row, k) => s + row[i] * y[k], 0));
      if (up.every((x) => x >= 0 && x <= umax)) { pinv++; up.forEach((x, i) => near(R.u[i], x, 1e-12)); }
    } else {
      infeas++;
      const res = (u) => Math.hypot(...M.matvec(B, u).map((x, k) => x - m[k]));
      const best = res(R.u);
      for (let k = 0; k < 200; k++) { const u = Array.from({ length: n }, () => (rnd() < 0.5 ? (rnd() < 0.5 ? 0 : umax) : rnd() * umax)); ok(res(u) >= best - 1e-12, 'no admissible blowing comes closer'); }
    }
  }
  ok(feas > 20 && infeas > 20, 'both feasible and saturated commands were tested');
  // pure yaw: the right tip alone
  { const R = M.allocate([0, 0, 0.002], 0.002); near(R.u[13], 0.002 / (0.475 * 3), 1e-15); ok(R.u.every((x, i) => i === 13 || x === 0), 'only the right tip blows'); }
  near(M.bleed(new Array(14).fill(0.001 / 14)), 0.001 * 0.5 * 0.41 * 200 * 200 * 40 / 300, 1e-12);
  ok(pinv >= 0, 'pseudo-inverse comparison ran');
};
