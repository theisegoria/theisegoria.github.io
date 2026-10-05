// Representation theory: D_n matrices are a homomorphism and the permutation representation counts fixed points; every character table is orthonormal (rows and columns), sum of squared dimensions = |G|, decompositions are non-negative integers; the ring's normal modes match 2 sin(pi q / n) with symmetry-forced pairs, and a heavy bead leaves exactly the odd partners unchanged.
module.exports = (M, { ok, near }) => {
  // 1. homomorphism rho(gh) = rho(g) rho(h), and the permutation representation
  for (const n of [3, 4, 5, 6]) { let err = 0;
    for (let g = 0; g < 2 * n; g++) for (let h = 0; h < 2 * n; h++) { const A = M.rho2(n, M.dmul(n, g, h)), B = M.mul2(M.rho2(n, g), M.rho2(n, h)); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) err = Math.max(err, Math.abs(A[i][j] - B[i][j])); for (let v = 0; v < n; v++) if (M.vertexImage(n, M.dmul(n, g, h), v) !== M.vertexImage(n, g, M.vertexImage(n, h, v))) err = 1; }
    ok(err < 1e-12, `D${n}: rho and the vertex action are homomorphisms`);
    // vertex action agrees with the matrices: rho(g) maps vertex j to vertex g(j)
    for (let g = 0; g < 2 * n; g++) for (let j = 0; j < n; j++) { const a = (2 * Math.PI * j) / n, R = M.rho2(n, g), x = R[0][0] * Math.cos(a) + R[0][1] * Math.sin(a), y = R[1][0] * Math.cos(a) + R[1][1] * Math.sin(a), b = (2 * Math.PI * M.vertexImage(n, g, j)) / n; ok(Math.hypot(x - Math.cos(b), y - Math.sin(b)) < 1e-12, 'matrix moves vertex j to g(j)'); }
    // orders: rotations by 2pi k/n have order n/gcd, reflections order 2; the permutation character is the fixed-point count and averages to 1 (one orbit)
    let s = 0; for (let g = 0; g < 2 * n; g++) s += M.fixedPoints(n, g); near(s / (2 * n), 1, 1e-12); ok(M.order(n, n) === 2 && M.order(n, 1) === n, 'orders'); }
  // 2. character tables
  for (const name of ['S3', 'D4', 'Q8', 'A4']) { const G = M.TABLES[name], k = G.irreps.length;
    near(G.sizes.reduce((a, b) => a + b, 0), G.order, 1e-12); ok(k === G.classes.length, `${name}: as many irreducibles as classes`);
    let ss = 0; G.irreps.forEach(([, ch]) => { ss += (Array.isArray(ch[0]) ? ch[0][0] : ch[0]) ** 2; }); near(ss, G.order, 1e-12);
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { const z = M.inner(G, G.irreps[i][1], G.irreps[j][1]); near(z[0], i === j ? 1 : 0, 1e-12); near(z[1], 0, 1e-12); }
    // column orthogonality: sum_i chi_i(C) conj chi_i(C') = |G| / |C| delta
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) { let re = 0; G.irreps.forEach(([, ch]) => { const x = Array.isArray(ch[a]) ? ch[a] : [ch[a], 0], y = Array.isArray(ch[b]) ? ch[b] : [ch[b], 0]; re += x[0] * y[0] + x[1] * y[1]; }); near(re, a === b ? G.order / G.sizes[a] : 0, 1e-12); }
    for (const r of ['regular', 'natural', 'square']) { const m = M.decompose(G, G.reps[r]); m.forEach((x) => ok(Math.abs(x - Math.round(x)) < 1e-12 && x > -1e-12, `${name} ${r}: integer multiplicity`)); }
    // regular representation contains each irreducible as often as its dimension
    M.decompose(G, G.reps.regular).forEach((x, i) => { const d = G.irreps[i][1][0]; near(x, Array.isArray(d) ? d[0] : d, 1e-12); }); }
  // D4 and Q8 share a table; the quaternion 4-dim real rep is twice the 2-dim irreducible
  near(M.decompose(M.TABLES.Q8, M.TABLES.Q8.reps.natural)[4], 2, 1e-12); near(M.decompose(M.TABLES.A4, M.TABLES.A4.reps.square)[3], 2, 1e-12);
  // the D4 table agrees with the actual D4 matrices: the 2-dim rho has character E
  { const n = 4, E = M.TABLES.D4.irreps[4][1], reps = [0, 2, 1, 4, 5]; reps.forEach((g, c) => { const R = M.rho2(n, g); near(R[0][0] + R[1][1], E[c], 1e-12); }); near(M.fixedPoints(4, 4), 2, 1e-12); near(M.fixedPoints(4, 5), 0, 1e-12); }
  // 3. ring modes
  for (const n of [5, 6, 8]) { const u = M.ringModes(n, 1), want = Array.from({ length: n }, (_, q) => M.uniformOmega(n, q)).sort((a, b) => a - b); u.forEach((md, i) => near(md.w, want[i], 1e-9));
    // trace(M^-1 K) = sum omega^2
    near(u.reduce((s, md) => s + md.w * md.w, 0), 2 * n, 1e-9);
    const d = M.ringModes(n, 2.5); near(d.reduce((s, md) => s + md.w * md.w, 0), 2 * (n - 1) + 2 / 2.5, 1e-9);
    // every odd (antisymmetric) mode of the defected ring keeps a symmetric-ring frequency
    const odd = d.filter((md) => M.mirrorParity(md.v) < 0); ok(odd.length === Math.floor((n - 1) / 2), 'one odd partner per pair');
    odd.forEach((md) => ok(want.some((w) => Math.abs(w - md.w) < 1e-9), 'odd modes unchanged'));
    ok(d.filter((md) => M.mirrorParity(md.v) > 0).length === n - odd.length, 'the rest are even'); }
  // Jacobi agrees with a 2x2 closed form
  { const e = M.jacobiEigen([[2, 1], [1, 3]]).vals.sort((a, b) => a - b); near(e[0], (5 - Math.sqrt(5)) / 2, 1e-12); near(e[1], (5 + Math.sqrt(5)) / 2, 1e-12); }
};
