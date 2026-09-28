// Fractal geometry: Moran roots against closed forms, box counting against exact scaling laws, escape and Julia membership for z^2 + c, and period detection in the bulbs of M.
module.exports = (M, { ok, near }) => {
  const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  // 1. the Moran equation: Sierpinski log 3 / log 2, Koch log 4 / log 3, three equal ratios r = 1/2
  near(M.moranRoot([0.5, 0.5, 0.5]), Math.log(3) / Math.log(2), 1e-9);
  near(M.moranRoot([1 / 3, 1 / 3, 1 / 3, 1 / 3]), Math.log(4) / Math.log(3), 1e-9);
  near(M.moranRoot(M.system(3, 0.5).ratios), 1.585, 5e-4);
  near(M.moranRoot(M.system(3, 0.4).ratios), M.equalRatioDim(3, 0.4), 1e-9);
  // unequal ratios: two maps of ratio 1/2 and one of 1/4 give 2 (1/2)^d + (1/4)^d = 1, i.e. x^2 + 2x - 1 = 0 with x = (1/2)^d
  near(M.moranRoot([0.5, 0.5, 0.25]), Math.log(1 / (Math.SQRT2 - 1)) / Math.log(2), 1e-9);
  ok(Math.abs(M.moran([0.5, 0.5, 0.5], M.moranRoot([0.5, 0.5, 0.5])) - 1) < 1e-9, 'the root satisfies the equation');
  // 2. the IFS fixes its attractor: chaos-game points of the Sierpinski system lie in the triangle and each map sends them onto points that are again in the set
  { const S = M.system(0), P = M.iterate(S.maps, S.probs, 5000, 5);
    let inside = true; for (let k = 50; k < 5000; k++) { const x = P.xs[k], y = P.ys[k]; if (y < -1e-6 || y > Math.sqrt(3) * Math.min(x, 1 - x) + 1e-6) inside = false; }
    ok(inside, 'chaos-game points lie in the Sierpinski triangle');
    const q = M.apply(S.maps[2], 0.5, Math.sqrt(3) / 2); near(q[0], 0.5, 1e-12); near(q[1], Math.sqrt(3) / 2, 1e-12); }
  // the Koch maps send the base segment to the four sides of the generator
  { const ends = M.KOCH.map((m) => [M.apply(m, 0, 0), M.apply(m, 1, 0)]);
    near(ends[0][1][0], 1 / 3, 1e-12); near(ends[1][1][0], 0.5, 1e-12); near(ends[1][1][1], Math.sqrt(3) / 6, 1e-12); near(ends[2][1][0], 2 / 3, 1e-12); near(ends[2][1][1], 0, 1e-12); near(ends[3][0][0], 2 / 3, 1e-12); }
  // 3. box counting: a full grid scales as eps^-2, a straight segment as eps^-1, the Koch curve as eps^-1.2619
  { const grid = []; for (let i = 0; i < 256; i++) for (let j = 0; j < 256; j++) grid.push([(i + 0.5) / 256, (j + 0.5) / 256]);
    near(M.boxSeries(grid, 7, 1, 7).slope, 2, 0.05);
    ok(M.boxCount(grid, 0.25) === 16 && M.boxCount(grid, 1 / 128) === 16384, 'N(1/4) = 16 and N(1/128) = 128^2 for the full square');
    const seg = seq(4000, (i) => [0.05 + 0.9 * i / 3999, 0.1 + 0.7 * i / 3999]);
    near(M.boxSeries(seg, 7, 1, 7).slope, 1, 0.05);
    const koch = M.densify(M.normalise(M.koch(6)), Math.pow(2, -7) / 3);
    near(M.boxSeries(koch, 7, 1, 7).slope, Math.log(4) / Math.log(3), 0.08);
    near(M.boxSeries(koch, 7, 4, 7).slope, Math.log(4) / Math.log(3), 0.03);
    // the least-squares fit recovers an exact line
    const fit = M.fitSlope([[1, 3.5], [2, 5.5], [3, 7.5], [4, 9.5]]); near(fit.slope, 2, 1e-12); near(fit.intercept, 1.5, 1e-12);
    // the Koch polyline has 4^6 + 1 vertices and length (4/3)^6
    const K = M.koch(6); ok(K.length === 4097, '4^6 + 1 vertices');
    let len = 0; for (let k = 1; k < K.length; k++) len += Math.hypot(K[k][0] - K[k - 1][0], K[k][1] - K[k - 1][1]); near(len, Math.pow(4 / 3, 6), 1e-9); }
  // 4. escape: 0 never escapes, 1 escapes after three steps (0, 1, 2, 5)
  ok(!M.escape(0, 0).escaped, 'c = 0 is in M');
  { const e = M.escape(1, 0); ok(e.escaped && e.n === 3, 'c = 1 escapes after 3 steps'); }
  ok(!M.escape(-2, 0).escaped && M.escape(-2.01, 0).escaped, 'the tip of M is c = -2');
  ok(M.escape(0.4, 0.4).escaped, 'the Cantor dust preset is outside M');
  // 5. period detection: 2 at c = -1, 3 at the rabbit, 1 at c = 0, and a repelling period 2 at the dendrite c = i
  { const p2 = M.period(-1, 0); ok(p2 && p2.p === 2 && p2.lambda < 1e-9, 'period 2 at c = -1, superattracting');
    const p3 = M.period(-0.123, 0.745); ok(p3 && p3.p === 3 && p3.lambda < 0.1, 'period 3 at the Douady rabbit');
    const p1 = M.period(0, 0); ok(p1 && p1.p === 1, 'period 1 at c = 0');
    const pi = M.period(0, 1); ok(pi && pi.p === 2, 'the orbit of 0 at c = i lands on a period-2 cycle'); near(pi.lambda, 4 * Math.SQRT2, 1e-9);
    ok(M.period(0.4, 0.4) === null, 'no cycle when the orbit escapes');
    // in the period-2 bulb the cycle is the roots of z^2 + z + c + 1 = 0 and the multiplier is 4(c + 1)
    const c = -0.9, q = M.period(c, 0); ok(q && q.p === 2, 'period 2 at c = -0.9'); near(q.lambda, Math.abs(4 * (c + 1)), 1e-6); }
  // 6. Julia membership for c = 0 is the unit disc
  ok(M.juliaInside(0.5, 0.5, 0, 0) && M.juliaInside(0.99, 0, 0, 0) && M.juliaInside(0, -0.995, 0, 0), 'points with |z| < 1 lie in K_0');
  ok(!M.juliaInside(1.01, 0, 0, 0) && !M.juliaInside(0.8, 0.7, 0, 0) && !M.juliaInside(0, -1.02, 0, 0), 'points with |z| > 1 escape');
  // the smooth escape time is continuous across the iteration count: it changes by about 1 when z is squared (z -> z^2 for c = 0)
  { const a = M.smoothEscape(1.3, 0, 0, 0, 100), b = M.smoothEscape(1.69, 0, 0, 0, 100); near(a - b, 1, 1e-9); }
};
// 7. L-systems: Koch has 4^n steps spanning 3^n, the dragon 2^n steps spanning sqrt(2)^n, the arrowhead 3^n steps spanning 2^n; brackets balance in the plant
module.exports = ((prev) => (M, api) => { prev(M, api); const { ok, near } = api;
  for (const n of [1, 2, 4]) { const S = M.LSYS[0], t = M.turtle(M.expand(S.axiom, S.rules, n), S.angle, S.draw, S.heading); ok(t.segs === 4 ** n, `Koch level ${n} has 4^n steps`); near(t.end[0], 3 ** n, 1e-9); near(t.end[1], 0, 1e-9); }
  for (const n of [2, 5, 8]) { const S = M.LSYS[1], t = M.turtle(M.expand(S.axiom, S.rules, n), S.angle, S.draw, S.heading); ok(t.segs === 2 ** n, `dragon level ${n} has 2^n steps`); near(Math.hypot(t.end[0], t.end[1]), Math.SQRT2 ** n, 1e-9); }
  for (const n of [1, 3, 4]) { const S = M.LSYS[2], t = M.turtle(M.expand(S.axiom, S.rules, n), S.angle, S.draw, S.heading); ok(t.segs === 3 ** n, `arrowhead level ${n} has 3^n steps`); near(Math.hypot(t.end[0], t.end[1]), 2 ** n, 1e-9); }
  near(M.lsystemDim(4, 3), Math.log(4) / Math.log(3), 1e-12); near(M.lsystemDim(2, Math.SQRT2), 2, 1e-12); near(M.lsystemDim(3, 2), Math.log(3) / Math.log(2), 1e-12);
  { const S = M.LSYS[3], s = M.expand(S.axiom, S.rules, 4); ok((s.match(/\[/g) || []).length === (s.match(/\]/g) || []).length && (s.match(/F/g) || []).length === 360, 'plant level 4: balanced brackets, 360 segments'); const t = M.turtle(s, S.angle, S.draw, S.heading); ok(t.segs === 360 && t.box[2] >= -1e-9, 'the plant grows upward from its root'); }
  // 8. Newton: quadratic convergence to 1 from 1.5, the exact cycle 0 <-> 1 for z^3 - 2z + 2, symmetric basins for z^3 - 1
  { const z1 = M.newtonStep(1.5, 0, M.ROOTS_UNITY); near(z1[0], 1.5 - 2.375 / 6.75, 1e-12); near(z1[1], 0, 1e-12);
    const r = M.newtonRun(1.5, 0, M.ROOTS_UNITY, 40, 1e-6, true); ok(r.root === 0 && r.n <= 6, 'converges to 1 in a few steps'); const e = r.orbit.map(([x]) => Math.abs(x - 1)); ok(e[3] < e[2] * e[2] * 2 && e[2] < e[1] * e[1] * 2, 'error roughly squares each step');
    const c0 = M.newtonStep(0, 0, M.ROOTS_CYCLE), c1 = M.newtonStep(c0[0], c0[1], M.ROOTS_CYCLE); near(c0[0], 1, 1e-9); near(c0[1], 0, 1e-9); near(c1[0], 0, 1e-9); near(c1[1], 0, 1e-9);
    ok(M.newtonRun(0.1, 0.05, M.ROOTS_CYCLE, 200, 1e-6).root === -1, 'points near the cycle never reach a root');
    const w = M.newtonRun(-0.2, 0, M.ROOTS_UNITY, 40, 1e-6, true); near(w.orbit[1][0], 8.2, 1e-9); ok(w.root === 0, 'the real axis belongs to the basin of 1');
    const fr = M.basinFractions(M.ROOTS_UNITY, [-2, 2, -2, 2], 60, 40); near(fr[1], fr[2], 1e-9); near(fr[3], 0, 1e-9); ok(Math.abs(fr[0] - 1 / 3) < 0.06, 'basins of z^3 - 1 have nearly equal area');
    const cyc = M.basinFractions(M.ROOTS_CYCLE, [-2.1, 2.1, -1.6, 1.6], 60, 60); ok(cyc[3] > 0.004 && cyc[3] < 0.03, 'a small black basin for z^3 - 2z + 2 (about 0.75% of this view)'); }
})(module.exports);
