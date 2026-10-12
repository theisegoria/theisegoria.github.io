// Game theory: every equilibrium found is a best reply on both sides and the counts match the classic games; the mixed equilibrium makes each player indifferent; the replicator flow keeps the simplex, obeys d log(x1x2x3)/dt = (w-1)(1-3 sum xixj), and its centre has the stated eigenvalues; the zero-sum solver gives max-min = min-max against brute force.
module.exports = (M, { ok, near }) => {
  // 1. Nash equilibria of the five 2×2 games
  const counts = [1, 3, 3, 3, 1], grid = Array.from({ length: 101 }, (_, i) => i / 100);
  M.GAMES.forEach((g, k) => {
    const ne = M.nash(g); near(ne.length, counts[k], 0.5);
    for (const e of ne) {
      const best = Math.max(...grid.map((p) => M.rowPay(g, p, e.q))), bestc = Math.max(...grid.map((q) => M.colPay(g, e.p, q)));
      ok(M.rowPay(g, e.p, e.q) >= best - 1e-12 && M.colPay(g, e.p, e.q) >= bestc - 1e-12, `equilibrium of game ${k} is a mutual best reply`);
      if (!e.pure) { near(M.rowAdv(g, e.q), 0, 1e-12); near(M.colAdv(g, e.p), 0, 1e-12); }
    }
  });
  near(M.nash(M.GAMES[1]).find((e) => !e.pure).p, 0.75, 1e-12); near(M.nash(M.GAMES[2]).find((e) => !e.pure).p, 0.6, 1e-12); near(M.nash(M.GAMES[3]).find((e) => !e.pure).q, 0.9, 1e-12);
  // 2. replicator dynamics
  for (const w of [0.5, 1, 1.8]) {
    const A = M.rpsMatrix(w), x = [0.5, 0.3, 0.2], d = M.replicator(A, x);
    near(d[0] + d[1] + d[2], 0, 1e-15);
    const h = 1e-5, xp = M.repStep(A, x, h), xm = M.repStep(A, x, -h), lv = (y) => Math.log(y[0] * y[1] * y[2]);
    near((lv(xp) - lv(xm)) / (2 * h), M.logVRate(w, x), 1e-6);
    const orb = M.repOrbit(A, x, 40, 0.01), V = (y) => y[0] * y[1] * y[2], V0 = V(x), V1 = V(orb[orb.length - 1].x);
    if (w > 1) ok(V1 > V0, 'w > 1: product grows'); else if (w < 1) ok(V1 < V0, 'w < 1: product shrinks'); else near(V1 / V0, 1, 1e-6);
    ok(orb.every((o) => o.x.every((c) => c > 0) && Math.abs(o.x[0] + o.x[1] + o.x[2] - 1) < 1e-12), 'orbit stays in the simplex');
    // linearisation at the centre: numerical Jacobian in the (x1, x2) chart
    const c = [1 / 3, 1 / 3, 1 / 3], e = 1e-6, F = (a, b) => { const r = M.replicator(A, [a, b, 1 - a - b]); return [r[0], r[1]]; };
    const J = [[(F(c[0] + e, c[1])[0] - F(c[0] - e, c[1])[0]) / (2 * e), (F(c[0], c[1] + e)[0] - F(c[0], c[1] - e)[0]) / (2 * e)], [(F(c[0] + e, c[1])[1] - F(c[0] - e, c[1])[1]) / (2 * e), (F(c[0], c[1] + e)[1] - F(c[0], c[1] - e)[1]) / (2 * e)]];
    const tr = J[0][0] + J[1][1], det = J[0][0] * J[1][1] - J[0][1] * J[1][0], ev = M.centreEig(w);
    near(tr / 2, ev.re, 1e-6); near(Math.sqrt(det - (tr * tr) / 4), ev.im, 1e-6);
  }
  // 3. zero-sum: maximin over p equals minimax over the column's simplex (brute force), and the column mix caps Row at v
  for (const G of M.ZS) {
    const s = M.solveZS(G.M), m = G.M[0].length; let maximin = -Infinity;
    for (let i = 0; i <= 20000; i++) maximin = Math.max(maximin, M.envelope(G.M, i / 20000));
    near(s.v, maximin, 1e-4); ok(s.v >= maximin - 1e-12, "solver is at least the grid maximum");
    near(s.y.reduce((a, b) => a + b, 0), 1, 1e-12); ok(s.y.every((y) => y >= -1e-12), 'column mix is a probability vector');
    near(Math.max(M.colMixPay(G.M, s.y, 0), M.colMixPay(G.M, s.y, 1)), s.v, 1e-9);
    // minimax by brute force over the column simplex (m <= 4)
    let minimax = Infinity; const N = m === 4 ? 30 : 120;
    const rec = (j, left, y) => { if (j === m - 1) { y[j] = left / N; minimax = Math.min(minimax, Math.max(M.colMixPay(G.M, y, 0), M.colMixPay(G.M, y, 1))); return; } for (let k = 0; k <= left; k++) { y[j] = k / N; rec(j + 1, left - k, y); } };
    rec(0, N, new Array(m).fill(0)); ok(minimax >= s.v - 1e-9 && minimax - s.v < 0.02 * (Math.abs(s.v) + 1), `minimax matches maximin (${G.key})`);
  }
  near(M.solveZS(M.ZS[2].M).v, 2, 1e-12); near(M.solveZS(M.ZS[2].M).p, 1, 1e-12);
};
