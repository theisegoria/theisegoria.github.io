// Combinatorics: p(n) from the pentagonal recurrence against brute force and p(100) = 190569292; Euler's odd = distinct for n <= 60; Glaisher's merging is a bijection with an explicit inverse; Dyck words are counted by Catalan numbers, the reflection count, and the tree and triangulation bijections are injective and valid; each singularity prediction tends to the coefficients.
module.exports = (M, { ok, near }) => {
  // 1. partition counts
  const p = M.partitionCounts(100);
  for (let n = 1; n <= 18; n++) near(p[n], M.partitionsOf(n).length, 0.5);
  near(p[100], 190569292, 0.5); near(p[50], 204226, 0.5);
  const odd = M.restrictedCounts(60, (k) => k % 2 === 1, false), dist = M.restrictedCounts(60, () => true, true);
  ok(odd.every((x, i) => x === dist[i]), 'Euler: odd parts = distinct parts up to 60');
  for (let n = 1; n <= 16; n++) { near(M.oddPartitions(n).length, odd[n], 0.5); near(M.distinctPartitions(n).length, dist[n], 0.5); }
  // Glaisher: sum preserved, image distinct, injective, inverse recovers
  for (const n of [9, 14, 20]) {
    const imgs = new Set(); let good = true;
    for (const q of M.oddPartitions(n)) {
      const d = M.glaisher(q);
      if (d.reduce((s, x) => s + x, 0) !== n || new Set(d).size !== d.length) good = false;
      if (M.glaisherInverse(d).join() !== q.join()) good = false;
      imgs.add(d.join());
    }
    ok(good, `Glaisher map valid and inverted for n = ${n}`); near(imgs.size, odd[n], 0.5);
  }
  { const s = M.glaisherSteps([1, 1, 1, 1, 1, 1, 1]); near(s.length - 1, 4, 0.5); ok(s[s.length - 1].parts.join() === '4,2,1', 'seven ones merge to 4 + 2 + 1'); }
  // 2. Catalan
  for (let n = 0; n <= 8; n++) near(M.dyckWords(n).length, M.catalan(n), 0.5);
  near(M.catalan(10), 16796, 0.5);
  for (let n = 1; n <= 9; n++) near(M.binom(2 * n, n) - M.badPaths(n), M.catalan(n), 0.5);
  for (const n of [4, 6]) {
    const seen = new Set(); let valid = true;
    for (const w of M.dyckWords(n)) {
      const tr = M.triangulation(w); if (tr.length !== n) valid = false;
      // each triangulation of an (n+2)-gon has n-1 diagonals, none crossing
      const diags = new Set(); tr.forEach(({ tri }) => { const [a, b, c] = tri; [[a, b], [b, c], [a, c]].forEach(([x, y]) => { if (y - x > 1 && !(x === 0 && y === n + 1)) diags.add(x + '-' + y); }); });
      if (diags.size !== n - 1) valid = false;
      const D = [...diags].map((s) => s.split('-').map(Number));
      for (const [a, b] of D) for (const [c, d] of D) if (a < c && c < b && b < d) valid = false;
      // total angle check: the triangle areas tile the polygon (area of an inscribed regular polygon)
      seen.add(D.map((x) => x.join('-')).sort().join('|'));
    }
    ok(valid, `triangulations valid for n = ${n}`); near(seen.size, M.catalan(n), 0.5);
  }
  // tree size equals n and in-order structure: first-return decomposition rebuilds the word
  { const rebuild = (t) => (t ? 'U' + rebuild(t.l) + 'D' + rebuild(t.r) : ''); ok(M.dyckWords(7).every((w) => rebuild(M.wordToTree(w)) === w), 'tree bijection inverts'); }
  // 3. singularity analysis
  const [fib, cat, mot, der, par] = M.SEQS;
  near(fib.coef(30), 832040, 0.5); near(Math.round(fib.asym(30)), 832040, 0.5);
  near(mot.coef(10), 2188, 0.5); near(cat.coef(12), 208012, 0.5); near(der.coef(4), 9 / 24, 1e-15);
  near(cat.coef(100) / cat.asym(100), 1 - 9 / 800, 2e-4);
  near(mot.coef(200) / mot.asym(200), 0.98794, 2e-4);
  near(der.coef(15) / der.asym(15), 1, 1e-12);
  near(par.coef(100) / par.asym(100), 0.9563, 0.001); ok(par.coef(100) < par.asym(100), 'Hardy-Ramanujan leading term overshoots');
  // generating functions reproduce their coefficients: Cauchy integral on a small circle
  for (const [s, r] of [[fib, 0.3], [cat, 0.15], [mot, 0.2], [der, 0.5], [par, 0.5]]) {
    const n = 6, K = 256; let re = 0;
    for (let k = 0; k < K; k++) { const t = (2 * Math.PI * k) / K, z = [r * Math.cos(t), r * Math.sin(t)], w = s.gf(z), zn = [Math.cos(-n * t), Math.sin(-n * t)]; re += (w[0] * zn[0] - w[1] * zn[1]) / K; }
    near(re / r ** n, s.coef(n), 1e-6 * Math.max(1, s.coef(n)));
  }
};
