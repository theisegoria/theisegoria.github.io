// Knot theory: crossing signs and writhe from a space curve, the Reidemeister moves, tricolouring counts and determinants of the five knots, and the torus-knot formulas against published values (Knot Atlas).
module.exports = (K, { ok, near, values }) => {
  // 1. the standard trefoil space curve: three crossings, writhe ±3, determinant 3, nine tricolourings
  const tre = K.diagram(K.torusTrefoil3D());
  ok(tre.n === 3 && Math.abs(tre.writhe) === 3, 'trefoil: 3 crossings, writhe ±3');
  ok(tre.det === 3 && tre.tri === 9, 'trefoil: determinant 3, 9 tricolourings');
  ok(tre.X.every((c) => c.sign === tre.X[0].sign), 'all three crossings share a sign');
  // 2. Reidemeister moves on the closed braid σ1σ2σ1σ2: R1 changes the writhe by one, R2 and R3 do not; the determinant never moves
  const base = K.diagram(K.braidCurve(0, 0));
  ok(base.n === 4 && base.writhe === 4 && base.det === 3 && base.tri === 9, 'closed braid: 4 positive crossings, det 3');
  const r1 = K.diagram(K.braidCurve(0, 1)), r2 = K.diagram(K.braidCurve(1, 1)), r3 = K.diagram(K.braidCurve(2, 1));
  ok(r1.n === base.n + 1 && Math.abs(r1.writhe - base.writhe) === 1 && r1.det === 3, 'R1: one more crossing, writhe ±1, same determinant');
  ok(r2.n === base.n + 2 && r2.writhe === base.writhe && r2.det === 3, 'R2: two more crossings, same writhe and determinant');
  ok(r3.n === base.n && r3.writhe === base.writhe && r3.det === 3, 'R3: same crossings, writhe and determinant');
  for (const lam of [0.2, 0.45, 0.8]) ok(K.diagram(K.braidCurve(1, lam)).det === 3 && K.diagram(K.braidCurve(2, lam)).det === 3, 'determinant constant along the move');
  // 3. the five knots: crossings, tricolourings 3/9/3/3/9 and determinants 1/3/5/5/9 (Knot Atlas)
  const want = [[2, 3, 1], [3, 9, 3], [4, 3, 5], [5, 3, 5], [6, 9, 9]];
  want.forEach(([n, tri, det], k) => { const { dg } = K.knotDiagram(k); values([dg.n, dg.tri, dg.det], [n, tri, det]); ok(dg.X.every((c) => !c.bad), 'alternating assignment consistent'); });
  // n-colourability: nontrivial exactly when gcd(n, det) > 1; the figure-eight has 25 five-colourings and only 3 three-colourings
  const fe = K.knotDiagram(2).dg;
  ok(K.countColourings(fe.M, fe.arcs.length, 5) === 25 && K.countColourings(fe.M, fe.arcs.length, 3) === 3, 'figure-eight: 5-colourable, not 3-colourable');
  ok(K.countColourings(fe.M, fe.arcs.length, 7) === 7, 'figure-eight: no nontrivial 7-colouring');
  // 4. torus knots: Alexander polynomials, genus, crossing number, components
  values(K.alexander(2, 3), [1, -1, 1]);
  values(K.alexander(2, 5), [1, -1, 1, -1, 1]);
  values(K.alexander(3, 4), [1, -1, 0, 1, 0, -1, 1]);
  values(K.alexander(2, 2), [-1, 1]); // Hopf link: t − 1
  for (const [p, q] of [[2, 7], [3, 5], [4, 5]]) { const a = K.alexander(p, q); ok(a.length - 1 === (p - 1) * (q - 1) && a.reduce((s, x) => s + x, 0) === 1, 'degree 2g and Δ(1) = 1'); ok(a.every((x, i) => x === a[a.length - 1 - i]), 'palindromic'); }
  near(K.genus(3, 4), 3); near(K.genus(2, 5), 2); near(K.genus(2, 2), 0); near(K.unknotting(3, 4), 3);
  ok(K.crossingNumber(2, 3) === 3 && K.crossingNumber(3, 4) === 8 && K.crossingNumber(2, 5) === 5, 'crossing numbers');
  ok(K.components(2, 3) === 1 && K.components(4, 6) === 2 && K.components(3, 3) === 3, 'component counts');
  ok(K.torusPoints(4, 6).length === 2 && K.torusPoints(2, 3).length === 1, 'one polyline per component');
  // the drawn (2, 3) torus curve, given heights from the torus, is again a trefoil diagram
  const tp = K.torusPoints(2, 3, 2, 0.85, 120)[0].map((p) => [p[0], p[1], p[2]]), tdg = K.diagram(tp);
  ok(tdg.n === 3 && tdg.det === 3 && Math.abs(tdg.writhe) === 3, 'T(2,3) on the torus projects to a trefoil diagram');
  ok(K.polyString(K.alexander(3, 4)) === 't⁶ − t⁵ + t³ − t + 1', 'printed polynomial');
};
