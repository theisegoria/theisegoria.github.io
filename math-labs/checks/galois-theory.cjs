// Galois theory: group orders against the known degrees, discriminants against closed forms, the subgroup lattice of D4 and S3, fixed fields with the right degrees and normality, and Gauss-Wantzel for n <= 64.
module.exports = (M, { ok, near }) => {
  // 1. the survivors of the relation test have the orders theory predicts, and form groups
  const expect = [6, 8, 4, 4, 3, 120];
  expect.forEach((o, k) => { const G = M.galoisGroup(k).map((x) => x.p); ok(G.length === o, `|Gal| = ${o} for ${M.POLYS[k].name}`); ok(M.closure(G, G[0].length).length === o, 'closed under composition'); });
  ok(M.PERMS[4].length === 24 && M.PERMS[5].length === 120 && M.factorial(5) === 120, 'permutation counts');
  ok(M.breaks(1, [1, 0, 2, 3]) !== null && M.breaks(1, [1, 2, 3, 0]) === null, '(12) breaks r1 + r3 = 0, the 4-cycle does not');
  // discriminants: -108, -2048, 256, 125, 81, 2869; squares exactly for x^4 + 1, Phi_5 and x^3 - 3x + 1
  M.POLYS.forEach((P, k) => { near(M.discriminant(P.roots), P.disc, 1e-6); ok(M.isSquare(M.discriminant(P.roots)) === [false, false, true, false, true, false][k], `square test for ${P.name}`); });
  // even permutations: the group of x^3 - 3x + 1 lies in A3, the group of x^4 - 2 does not lie in A4
  ok(M.galoisGroup(4).every((x) => M.isEven(x.p)) && !M.galoisGroup(1).every((x) => M.isEven(x.p)), 'A_n membership matches the square test');
  ok(M.cycleNotation([1, 2, 0, 3]) === '(1 2 3)' && M.permOrder([1, 0, 3, 2]) === 2 && M.permOrder([1, 2, 3, 0]) === 4, 'cycle notation and orders');
  // 2. the correspondence: D4 has 10 subgroups, S3 has 6; fixed-field degree = index; normal subgroups are exactly the Galois ones
  { const c = M.correspondence(0); ok(c.subs.length === 10, 'D4 has 10 subgroups'); ok(c.subs.every((s) => s.field && s.field.deg === s.index), 'degree of the fixed field = index');
    ok(c.subs.filter((s) => s.normal).length === 6, 'D4 has 6 normal subgroups'); const nonNormal = c.subs.filter((s) => !s.normal); ok(nonNormal.every((s) => s.order === 2), 'the non-normal ones have order 2');
    const names = new Set(c.subs.map((s) => s.field.name)); ok(names.size === 10, 'ten distinct fixed fields'); ok(names.has('ℚ(i)') && names.has('ℚ(∜2)') && names.has('ℚ(√2, i)'), 'expected fields present');
    const Qi = c.subs.find((s) => s.field.name === 'ℚ(i)'); ok(Qi.order === 4 && Qi.normal, 'Q(i) is fixed by the cyclic group of order 4, which is normal');
    const Q4 = c.subs.find((s) => s.field.name === 'ℚ(∜2)'); ok(Q4.order === 2 && !Q4.normal, 'Q(fourth root of 2) is fixed by a non-normal reflection');
    // inclusion reversal: H in H' implies K^{H'} in K^H, checked through degrees of the pairs
    c.subs.forEach((A) => c.subs.forEach((B) => { if (M.contains(B.H, A.H)) ok(B.field.deg <= A.field.deg, 'larger subgroup, smaller field'); })); }
  { const c = M.correspondence(1); ok(c.subs.length === 6, 'S3 has 6 subgroups'); ok(c.subs.every((s) => s.field.deg === s.index), 'S3 degrees'); ok(c.subs.filter((s) => s.normal).length === 3, 'S3: trivial, A3, S3 normal'); }
  // 3. constructions: phi, Gauss-Wantzel list, degrees of cosines
  ok(M.phi(17) === 16 && M.phi(9) === 6 && M.phi(60) === 16 && M.phi(1) === 1, 'phi values');
  const known = [3, 4, 5, 6, 8, 10, 12, 15, 16, 17, 20, 24, 30, 32, 34, 40, 48, 51, 60, 64];
  ok(Array.from({ length: 62 }, (_, i) => i + 3).filter(M.constructibleNgon).join() === known.join(), 'constructible polygons up to 64');
  ok(M.cosDegree(60) === 1 && M.cosDegree(20) === 3 && M.cosDegree(90) === 1 && M.cosDegree(30) === 2 && M.cosDegree(15) === 4 && M.cosDegree(1) === 48, 'degrees of cos of whole-degree angles');
  ok(M.cosDegree(20) / M.cosDegree(60) === 3 && M.cosDegree(30) / M.cosDegree(90) === 2 && M.cosDegree(15) / M.cosDegree(45) === 2 && M.cosDegree(40) / M.cosDegree(120) === 3, 'relative degrees 3, 2, 2, 3');
  near(M.trisectionCubic(0.5)(Math.cos(Math.PI / 9)), 0, 1e-12); near(M.trisectionCubic(0)(Math.sqrt(3) / 2), 0, 1e-12);
  ok(M.factor(60).join() === '2,2,3,5' && M.isPow2(64) && !M.isPow2(6), 'factor and pow2');
};
