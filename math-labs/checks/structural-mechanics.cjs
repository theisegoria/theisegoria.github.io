// Structural mechanics: every truss is determinate (members + 3 = 2 joints) and every joint balances; chord forces equal the
// section moment over the height (method of sections, independent of the joint solve); the Warren diagonal at a loaded joint
// is P / (2 sin theta); the finite-element beam reproduces the textbook deflections and end moments for four supports, shear
// is the slope of moment, and the curvature is M / EI; buckling roots are pi, 2 pi, pi / 2, 4.4934 (tan k = k) and 8.9868
// (tan(k/2) = k/2), a brace at mid-height gives 4x for a pinned column, and the mode shapes satisfy their boundary conditions.
module.exports = (M, { ok, near }) => {
  // --- trusses ---
  for (const type of [0, 1, 2]) for (const n of [4, 6, 8]) {
    const g = M.trussGeom(type, n, 4.5);
    ok(g.mem.length + 3 === 2 * g.nodes.length, 'determinate');
    for (const [P, x] of [[100, 8], [60, 13.3], [40, 0.7], [80, 23.9]]) {
      const s = M.trussSolve(g, P, x);
      near(s.Ray + s.Rby, P, 1e-9);
      near(s.Rby, P * x / M.TL, 1e-9);
      near(s.Rax, 0, 1e-9);
      for (let j = 0; j < g.nodes.length; j++) {
        const f = M.jointForces(g, s, j);
        near(f.reduce((a, q) => a + q.vec[0], 0), 0, 1e-8);
        near(f.reduce((a, q) => a + q.vec[1], 0), 0, 1e-8);
      }
    }
  }
  {
    // Pratt, left half: bottom chord L(i)L(i+1) = M(x_i)/h (moments about the top joint U(i)), top chord U(i)U(i+1) = -M(x_i+1)/h
    const n = 6, h = 4.5, g = M.trussGeom(0, n, h), s = M.trussSolve(g, 90, 15.5);
    for (let i = 0; i < n / 2; i++) {
      const cb = g.mem.findIndex(([a, b]) => a === i && b === i + 1), ct = g.mem.findIndex(([a, b]) => a === n + 1 + i && b === n + 2 + i);
      near(s.F[cb], M.trussMoment(g, s, g.nodes[i][0]) / h, 1e-9);
      near(s.F[ct], -M.trussMoment(g, s, g.nodes[i + 1][0]) / h, 1e-9);
    }
    // all chords of a Pratt truss are tension below, compression above, and every vertical is in compression for a deck load
    ok(s.F.every((f, c) => (g.mem[c][1] === g.mem[c][0] + 1 && g.mem[c][1] <= n ? f >= -1e-9 : true)), 'bottom chords never in compression');
  }
  {
    // Warren, load at the middle joint: the two diagonals meeting there each carry P / (2 sin theta) in tension
    const n = 6, h = 4, g = M.trussGeom(2, n, h), s = M.trussSolve(g, 120, 12);
    const th = Math.atan2(h, g.s / 2), want = 120 / (2 * Math.sin(th));
    const d = g.mem.map((m, c) => [m, c]).filter(([m]) => m.includes(3) && m.some((k) => k > n));
    ok(d.length === 2, 'two diagonals meet at the loaded joint');
    d.forEach(([, c]) => near(s.F[c], want, 1e-9));
  }
  {
    // Howe reverses the signs of Pratt's diagonals
    const gp = M.trussGeom(0, 6, 4), gh = M.trussGeom(1, 6, 4), sp = M.trussSolve(gp, 100, 12), sh = M.trussSolve(gh, 100, 12);
    ok(Math.min(...sp.F) < -149 && Math.max(...sh.F) > 149, 'Pratt peaks in compression, Howe in tension, at 1.5 P L / (4 h)');
  }
  // --- beams ---
  const EI = 200e6 * 0.15 * 0.3 ** 3 / 12, L = M.BL;
  {
    const b = M.beamSolve(1, 30, 3, 0, EI);
    near(b.y(3), 30 * L ** 3 / (48 * EI), 1e-9); near(b.R0, 15, 1e-7); near(b.RL, 15, 1e-7); near(b.M(3), 30 * L / 4, 1e-6); near(b.M(L), 0, 1e-6);
  }
  {
    const b = M.beamSolve(1, 0, 3, 10, EI);
    near(b.y(3), 5 * 10 * L ** 4 / (384 * EI), 1e-9); near(b.M(3), 10 * L * L / 8, 1e-6);
  }
  {
    const b = M.beamSolve(0, 12, L, 0, EI);
    near(b.y(L), 12 * L ** 3 / (3 * EI), 1e-8); near(b.M0, -12 * L, 1e-6); near(b.R0, 12, 1e-7); near(b.M(L), 0, 1e-6);
    const u = M.beamSolve(0, 0, 3, 5, EI); near(u.y(L), 5 * L ** 4 / (8 * EI), 1e-8); near(u.M0, -5 * L * L / 2, 1e-6);
  }
  {
    const b = M.beamSolve(2, 40, 3, 0, EI);
    near(b.y(3), 40 * L ** 3 / (192 * EI), 1e-8); near(b.M0, -40 * L / 8, 1e-6); near(b.M(3), 40 * L / 8, 1e-6); near(b.ML, -40 * L / 8, 1e-6);
    const u = M.beamSolve(2, 0, 3, 6, EI); near(u.M0, -6 * L * L / 12, 1e-6); near(u.y(3), 6 * L ** 4 / (384 * EI), 1e-8);
  }
  {
    const b = M.beamSolve(3, 0, 3, 6, EI);       // fixed at x = 0, pinned at x = L: R_pin = 3wL/8, M_fixed = -wL^2/8
    near(b.RL, 3 * 6 * L / 8, 1e-6); near(b.M0, -6 * L * L / 8, 1e-6); near(b.M(L), 0, 1e-6);
  }
  {
    // an off-centre point load on a simple beam: reaction P (L - a) / L, deflection under the load P a^2 b^2 / (3 E I L)
    const a = 1.7, b = M.beamSolve(1, 25, a, 0, EI);
    near(b.R0, 25 * (L - a) / L, 1e-7); near(b.y(a), 25 * a * a * (L - a) ** 2 / (3 * EI * L), 1e-9);
    near(b.V(a, -1) - b.V(a, 1), 25, 1e-9);
    // equilibrium of the diagrams: V is the slope of M, and -EI y'' recovers M away from the load
    const h = 1e-4; for (const x of [0.6, 2.9, 4.4]) { near((b.M(x + h) - b.M(x - h)) / (2 * h), b.V(x, 1), 1e-6); near(-EI * (b.y(x + 0.05) - 2 * b.y(x) + b.y(x - 0.05)) / 0.0025, b.M(x), 0.02 * Math.abs(b.M(x)) + 1e-3); }
    // doubling the depth divides the deflection by 8
    const b2 = M.beamSolve(1, 25, a, 0, EI * 8); near(b.y(a) / b2.y(a), 8, 1e-9);
  }
  // --- columns ---
  const K = (bc, br, n = 3) => M.colKappas(bc, br, n);
  {
    const p = K(0, null); near(p[0], Math.PI, 1e-9); near(p[1], 2 * Math.PI, 1e-9); near(p[2], 3 * Math.PI, 1e-9);
    const c = K(1, null); near(c[0], Math.PI / 2, 1e-9); near(c[1], 3 * Math.PI / 2, 1e-9);
    const f = K(2, null); near(f[0], 2 * Math.PI, 1e-9); near(Math.tan(f[1] / 2), f[1] / 2, 1e-8); near(f[1], 8.986818916, 1e-8);
    const pf = K(3, null); near(Math.tan(pf[0]), pf[0], 1e-8); near(pf[0], 4.493409458, 1e-8); near(Math.PI / pf[0], 0.69915, 1e-4);
    near((f[0] / Math.PI) ** 2, 4, 1e-9); near((c[0] / Math.PI) ** 2, 0.25, 1e-9); near((pf[0] / Math.PI) ** 2, 2.0457, 1e-3);
  }
  {
    const m = K(0, 0.5); near(m[0], 2 * Math.PI, 1e-9); near(m[1], 2 * 4.493409458, 1e-7);        // a brace at mid-height: 4 P_E
    ok(K(0, 0.3)[0] > Math.PI * 1.5 && K(0, 0.3)[0] < 2 * Math.PI, 'a brace at 0.3 L is worth between 2.3 and 4 times the load');
    near(K(0, 0.01)[0], 4.4934, 0.06);                                                           // a brace next to the pin acts as a clamp
    near(K(0, 0.3)[0], K(0, 0.7)[0], 1e-9);                                                      // symmetry
  }
  {
    const s = M.colMode(0, null, Math.PI); near(s(0.3), Math.sin(0.3 * Math.PI), 1e-8); near(s(0.5), 1, 1e-6);
    const c = M.colMode(1, null, Math.PI / 2); near(c(1), 1, 1e-6); near(c(0.5), (1 - Math.cos(Math.PI / 4)) / (1 - 0), 1e-8); near(c(0), 0, 1e-9);
    const bm = M.colMode(0, 0.4, K(0, 0.4)[0]); near(bm(0.4), 0, 1e-8); near(bm(0), 0, 1e-8); near(bm(1), 0, 1e-8);
    const fx = M.colMode(2, null, K(2, null)[0]); near(fx(0), 0, 1e-8); near(fx(1), 0, 1e-8); near((fx(1e-5) - fx(0)) / 1e-5, 0, 1e-3); near(fx(0.5), 1, 1e-6);
  }
  { const T = M.TUBE; near(T.EI, 55.46e3, 0.01 * 55.46e3); near(M.eulerLoad(T.EI, 3, 1) / 1000, 60.8, 0.1); near(M.eulerLoad(T.EI, 3, 2), M.eulerLoad(T.EI, 3, 1) / 4, 1e-6); }
};
