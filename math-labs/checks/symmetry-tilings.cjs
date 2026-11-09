// Symmetry and tilings: each of the 17 groups is closed under composition modulo its lattice, acts by orthogonal
// matrices on its own lattice, and has the textbook point-group order, highest rotation and presence of reflections;
// the symmetry elements found from the operations match (p1 none, pg glides only, p6m mirrors and sixfold centres);
// the crystallographic restriction allows exactly n = 1, 2, 3, 4, 6, the cube's [001], [111], [110] axes are 4-, 3- and
// 2-fold and no lattice survives n = 5; Penrose deflation follows (a, b) -> (a + b, a + 2b) with ratio -> phi and the
// diffraction is centrosymmetric with tenfold-symmetric peaks.
module.exports = (M, { ok, near }) => {
  const want = { p1: [1, 1, 0], p2: [2, 2, 0], pm: [2, 1, 1], pg: [2, 1, 1], cm: [2, 1, 1], pmm: [4, 2, 1], pmg: [4, 2, 1], pgg: [4, 2, 1], cmm: [4, 2, 1], p4: [4, 4, 0], p4m: [8, 4, 1], p4g: [8, 4, 1], p3: [3, 3, 0], p3m1: [6, 3, 1], p31m: [6, 3, 1], p6: [6, 6, 0], p6m: [12, 6, 1] };
  ok(M.GROUPS.length === 17, 'seventeen groups');
  for (const g of M.GROUPS) {
    ok(M.closes(g), `${g.id} closes`);
    for (const o of M.cart(g).ops) { const A = o.A; near(A[0][0] ** 2 + A[1][0] ** 2, 1, 1e-9); near(A[0][0] * A[0][1] + A[1][0] * A[1][1], 0, 1e-9); }
    const w = want[g.id]; near(M.pointOrder(g), w[0], 0.5); near(M.maxRot(g), w[1], 0.5); ok(M.hasReflection(g) === !!w[2], `${g.id} reflections`);
  }
  const win = [-0.05, 3.25, -0.05, 2.45], E = (id) => M.elements(M.GROUPS.find((g) => g.id === id), win);
  ok(E('p1').rot.length === 0 && E('p1').lines.length === 0, 'p1 has no elements');
  ok(E('pg').lines.every((l) => !l.mirror) && E('pg').lines.length > 0, 'pg only glides');
  ok(E('pm').lines.every((l) => l.mirror), 'pm only mirrors');
  ok(E('p6m').rot.some((r) => r.n === 6) && E('p6m').lines.some((l) => l.mirror), 'p6m sixfold centres and mirrors');
  ok(E('pgg').lines.every((l) => !l.mirror), 'pgg has no mirrors');
  for (let n = 1; n <= 12; n++) ok(M.allowed(n) === [1, 2, 3, 4, 6].includes(n), `restriction n = ${n}`);
  ok(M.restriction('cubic', '001', 4).sym && !M.restriction('cubic', '001', 3).sym, 'cube [001] fourfold');
  ok(M.restriction('cubic', '111', 3).sym && !M.restriction('cubic', '111', 4).sym, 'cube [111] threefold');
  ok(M.restriction('cubic', '110', 2).sym && !M.restriction('cubic', '110', 3).sym, 'cube [110] twofold');
  ok(M.restriction('hex', '001', 6).sym, 'hexagonal sixfold');
  for (const lat of ['cubic', 'hex']) for (const ax of ['001', '111', '110']) for (const n of [5, 7, 8]) ok(!M.restriction(lat, ax, n).sym, `no ${n}-fold`);
  for (let s = 0; s <= 6; s++) { const t = M.penrose(s), c = M.counts(s); ok(t.filter((x) => x[0] === 0).length === c[0] && t.filter((x) => x[0] === 1).length === c[1], `penrose counts ${s}`); }
  near(M.counts(8)[1] / M.counts(8)[0], M.PHI, 1e-4);
  // the area is preserved by deflation
  const area = (t) => t.reduce((s, [, A, B, C]) => s + Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2, 0);
  near(area(M.penrose(4)), area(M.penrose(0)), 1e-9);
  const vt = M.vertices(M.penrose(4)).filter((p) => Math.hypot(...p) < 0.8), n = 41, I = M.diffraction(vt, 30, n);
  near(I[(n * n - 1) / 2], 1, 1e-9);
  for (let i = 0; i < n * n; i += 37) near(I[i], I[n * n - 1 - i], 1e-12);
};
