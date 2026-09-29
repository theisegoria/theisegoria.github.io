'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/galois-theory.cjs) ---------- */
  // complex numbers as [re, im]
  const C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    pow: (a, n) => { let r = [1, 0]; for (let k = 0; k < n; k++) r = C.mul(r, a); return r; },
    abs: (a) => Math.hypot(a[0], a[1]), polar: (r, t) => [r * Math.cos(t), r * Math.sin(t)],
  };
  // Durand-Kerner roots of a monic polynomial with coefficients c[0] + c[1] x + ... + x^n
  function durandKerner(c, iters = 300) {
    const n = c.length, r = Array.from({ length: n }, (_, k) => C.polar(1.2, TAU * k / n + 0.4));
    const P = (z) => { let v = [1, 0]; for (let k = n - 1; k >= 0; k--) v = C.add(C.mul(v, z), [c[k], 0]); return v; };
    for (let it = 0; it < iters; it++) for (let i = 0; i < n; i++) { let den = [1, 0]; for (let j = 0; j < n; j++) if (j !== i) den = C.mul(den, C.sub(r[i], r[j])); r[i] = C.sub(r[i], C.div(P(r[i]), den)); }
    return r;
  }
  const A3 = Math.cbrt(2), A4 = Math.pow(2, 0.25), W3 = C.polar(1, TAU / 3);
  // the six polynomials: coefficients (lowest first, monic), labelled roots, the rational relations tested, and what theory says
  const POLYS = [
    { name: 'x³ − 2', coef: [-2, 0, 0], roots: [[A3, 0], C.mul([A3, 0], W3), C.mul([A3, 0], C.pow(W3, 2))], labels: ['α', 'αω', 'αω²'], rel: [], group: ['S₃', 'S₃'], order: 6, disc: -108 },
    { name: 'x⁴ − 2', coef: [-2, 0, 0, 0], roots: [[A4, 0], [0, A4], [-A4, 0], [0, -A4]], labels: ['α', 'iα', '−α', '−iα'], rel: [{ n: 'r₁ + r₃ = 0', f: (r) => C.add(r[0], r[2]) }, { n: 'r₂ + r₄ = 0', f: (r) => C.add(r[1], r[3]) }], group: ['D₄ (dihedral)', 'D₄（二面体群）'], order: 8, disc: -2048 },
    { name: 'x⁴ + 1', coef: [1, 0, 0, 0], roots: [1, 3, 5, 7].map((k) => C.polar(1, TAU * k / 8)), labels: ['ζ', 'ζ³', 'ζ⁵', 'ζ⁷'], rel: [{ n: 'r₂ = r₁³', f: (r) => C.sub(r[1], C.pow(r[0], 3)) }, { n: 'r₃ = r₁⁵', f: (r) => C.sub(r[2], C.pow(r[0], 5)) }, { n: 'r₄ = r₁⁷', f: (r) => C.sub(r[3], C.pow(r[0], 7)) }], group: ['C₂ × C₂ (Klein)', 'C₂ × C₂（クライン）'], order: 4, disc: 256 },
    { name: 'x⁴ + x³ + x² + x + 1', coef: [1, 1, 1, 1], roots: [1, 2, 3, 4].map((k) => C.polar(1, TAU * k / 5)), labels: ['ζ', 'ζ²', 'ζ³', 'ζ⁴'], rel: [{ n: 'r₂ = r₁²', f: (r) => C.sub(r[1], C.pow(r[0], 2)) }, { n: 'r₃ = r₁³', f: (r) => C.sub(r[2], C.pow(r[0], 3)) }, { n: 'r₄ = r₁⁴', f: (r) => C.sub(r[3], C.pow(r[0], 4)) }], group: ['C₄ (cyclic)', 'C₄（巡回群）'], order: 4, disc: 125 },
    { name: 'x³ − 3x + 1', coef: [1, -3, 0], roots: [1, 2, 4].map((k) => [2 * Math.cos(TAU * k / 9), 0]), labels: ['2cos(2π/9)', '2cos(4π/9)', '2cos(8π/9)'], rel: [{ n: 'r₂ = r₁² − 2', f: (r) => C.sub(r[1], C.sub(C.pow(r[0], 2), [2, 0])) }, { n: 'r₃ = r₂² − 2', f: (r) => C.sub(r[2], C.sub(C.pow(r[1], 2), [2, 0])) }], group: ['C₃ (cyclic)', 'C₃（巡回群）'], order: 3, disc: 81 },
    { name: 'x⁵ − x − 1', coef: [-1, -1, 0, 0, 0], roots: null, labels: ['r₁', 'r₂', 'r₃', 'r₄', 'r₅'], rel: [], group: ['S₅', 'S₅'], order: 120, disc: 2869 },
  ];
  POLYS[5].roots = durandKerner(POLYS[5].coef).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  // permutations of {0..n-1} in lexicographic order, as arrays sigma with sigma[k] = image of k
  const permutations = (n) => { const out = [], rec = (pre, rest) => { if (!rest.length) { out.push(pre); return; } rest.forEach((x, i) => rec(pre.concat([x]), rest.slice(0, i).concat(rest.slice(i + 1)))); }; rec([], Array.from({ length: n }, (_, i) => i)); return out; };
  const PERMS = {}; for (const n of [3, 4, 5]) PERMS[n] = permutations(n);
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const compose = (p, q) => p.map((_, k) => p[q[k]]); // (p ∘ q)(k) = p(q(k))
  const permKey = (p) => p.join('');
  const inverse = (p) => { const inv = new Array(p.length); p.forEach((v, k) => { inv[v] = k; }); return inv; };
  function cycles(p) { const seen = new Array(p.length).fill(false), out = []; for (let s = 0; s < p.length; s++) { if (seen[s]) continue; const c = []; let k = s; while (!seen[k]) { seen[k] = true; c.push(k); k = p[k]; } out.push(c); } return out; }
  const cycleType = (p) => cycles(p).map((c) => c.length).sort((a, b) => b - a);
  const permOrder = (p) => cycleType(p).reduce((a, b) => { const g = (x, y) => (y ? g(y, x % y) : x); return a * b / g(a, b); }, 1);
  const cycleNotation = (p) => { const cs = cycles(p).filter((c) => c.length > 1); return cs.length ? cs.map((c) => '(' + c.map((k) => k + 1).join(' ') + ')').join('') : 'e'; };
  // apply a permutation to the labelled roots: root k goes to root sigma(k), so the new tuple has entry k = r[sigma[k]]
  const permuteRoots = (roots, p) => p.map((v) => roots[v]);
  // the first relation the permutation breaks, or null
  function breaks(preset, p, tol = 1e-7) { const P = POLYS[preset], rp = permuteRoots(P.roots, p); for (const rel of P.rel) if (C.abs(rel.f(rp)) > tol) return rel; return null; }
  function galoisGroup(preset) { const n = POLYS[preset].roots.length; return PERMS[n].map((p, i) => ({ p, i })).filter(({ p }) => !breaks(preset, p)); }
  // the discriminant from the roots (real up to rounding)
  const discriminant = (roots) => { let d = [1, 0]; for (let i = 0; i < roots.length; i++) for (let j = i + 1; j < roots.length; j++) { const s = C.sub(roots[i], roots[j]); d = C.mul(d, C.mul(s, s)); } return d[0]; };
  const isSquare = (D) => { if (D < 0) return false; const s = Math.round(Math.sqrt(Math.round(D))); return s * s === Math.round(D); };
  const isEven = (p) => cycles(p).reduce((s, c) => s + c.length - 1, 0) % 2 === 0;
  // closure of a set of permutations under composition, and all subgroups of a group
  function closure(gens, n) { const id = Array.from({ length: n }, (_, i) => i), set = new Map([[permKey(id), id]]); let grew = true; while (grew) { grew = false; for (const a of [...set.values()]) for (const g of gens) { const c = compose(g, a); const k = permKey(c); if (!set.has(k)) { set.set(k, c); grew = true; } } } return [...set.values()]; }
  function subgroups(G) {
    const n = G[0].length, found = new Map(), add = (H) => { const key = H.map(permKey).sort().join('|'); if (!found.has(key)) { found.set(key, H); return true; } return false; };
    add([Array.from({ length: n }, (_, i) => i)]);
    G.forEach((g) => add(closure([g], n)));
    let grew = true;
    while (grew) { grew = false; const cur = [...found.values()]; for (const A of cur) for (const B of cur) { if (A === B) continue; const H = closure(A.concat(B), n); if (add(H)) grew = true; } }
    return [...found.values()].sort((a, b) => a.length - b.length || a.map(permKey).sort().join().localeCompare(b.map(permKey).sort().join()));
  }
  const contains = (H, K) => { const s = new Set(H.map(permKey)); return K.every((k) => s.has(permKey(k))); };
  const isNormal = (H, G) => { const s = new Set(H.map(permKey)); return G.every((g) => H.every((h) => s.has(permKey(compose(compose(g, h), inverse(g)))))); };
  // name the elements of D4 or S3 as powers of a rotation rho and a reflection tau
  function nameElements(G) {
    const n = G[0].length, id = Array.from({ length: n }, (_, i) => i);
    const rho = G.slice().sort((a, b) => permOrder(b) - permOrder(a) || permKey(a).localeCompare(permKey(b)))[0];
    const pows = closure([rho], n); const names = new Map();
    let r = id; for (let k = 0; k < pows.length; k++) { names.set(permKey(r), k === 0 ? 'e' : k === 1 ? 'ρ' : `ρ${'⁰¹²³⁴⁵'[k]}`); r = compose(rho, r); }
    const tau = G.find((g) => !names.has(permKey(g)) && permOrder(g) === 2);
    if (tau) { r = id; for (let k = 0; k < pows.length; k++) { const e = compose(r, tau); if (!names.has(permKey(e))) names.set(permKey(e), (k === 0 ? '' : k === 1 ? 'ρ' : `ρ${'⁰¹²³⁴⁵'[k]}`) + 'τ'); r = compose(rho, r); } }
    return { names, rho, tau };
  }
  // a minimal generating set for H, named
  function generatorNames(H, names) {
    const n = H[0].length, sorted = H.filter((h) => permOrder(h) > 1).sort((a, b) => permOrder(b) - permOrder(a) || (names.get(permKey(a)) || '').length - (names.get(permKey(b)) || '').length);
    for (const a of sorted) if (closure([a], n).length === H.length) return [names.get(permKey(a))];
    for (const a of sorted) for (const b of sorted) if (a !== b && closure([a, b], n).length === H.length) return [names.get(permKey(a)), names.get(permKey(b))].sort((x, y) => (x.includes('τ') ? 1 : 0) - (y.includes('τ') ? 1 : 0));
    return sorted.map((h) => names.get(permKey(h)));
  }
  // candidate intermediate fields, with generators written in the labelled roots
  const FIELDS = [
    { poly: 1, list: [
      { name: 'ℚ', deg: 1, gens: [] },
      { name: 'ℚ(√2)', deg: 2, gens: [(r) => C.pow(r[0], 2)] }, { name: 'ℚ(i)', deg: 2, gens: [(r) => C.div(r[1], r[0])] }, { name: 'ℚ(i√2)', deg: 2, gens: [(r) => C.mul(r[0], r[1])] },
      { name: 'ℚ(∜2)', deg: 4, gens: [(r) => r[0]] }, { name: 'ℚ(i∜2)', deg: 4, gens: [(r) => r[1]] }, { name: 'ℚ((1+i)∜2)', deg: 4, gens: [(r) => C.add(r[0], r[1])] }, { name: 'ℚ((1−i)∜2)', deg: 4, gens: [(r) => C.sub(r[0], r[1])] }, { name: 'ℚ(√2, i)', deg: 4, gens: [(r) => C.pow(r[0], 2), (r) => C.div(r[1], r[0])] },
      { name: 'ℚ(∜2, i)', deg: 8, gens: [(r) => r[0], (r) => r[1]] } ] },
    { poly: 0, list: [
      { name: 'ℚ', deg: 1, gens: [] },
      { name: 'ℚ(ω)', deg: 2, gens: [(r) => C.div(r[1], r[0])] },
      { name: 'ℚ(∛2)', deg: 3, gens: [(r) => r[0]] }, { name: 'ℚ(ω∛2)', deg: 3, gens: [(r) => r[1]] }, { name: 'ℚ(ω²∛2)', deg: 3, gens: [(r) => r[2]] },
      { name: 'ℚ(∛2, ω)', deg: 6, gens: [(r) => r[0], (r) => r[1]] } ] },
  ];
  const fixesGen = (roots, h, gen, tol = 1e-7) => C.abs(C.sub(gen(permuteRoots(roots, h)), gen(roots))) < tol;
  // the fixed field of H among the candidates: the candidate of largest degree all of whose generators every element of H fixes
  function fixedField(H, ext) { const roots = POLYS[FIELDS[ext].poly].roots; const ok = FIELDS[ext].list.filter((F) => F.gens.every((g) => H.every((h) => fixesGen(roots, h, g)))); return ok.sort((a, b) => b.deg - a.deg)[0]; }
  // the whole correspondence for an extension: subgroups (by order) with generator names, fixed fields, indices and normality
  function correspondence(ext) {
    const preset = FIELDS[ext].poly, G = galoisGroup(preset).map((x) => x.p), subs = subgroups(G), { names } = nameElements(G);
    return { G, names, subs: subs.map((H) => ({ H, order: H.length, index: G.length / H.length, gens: generatorNames(H, names), field: fixedField(H, ext), normal: isNormal(H, G) })) };
  }
  // 3. constructions
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const phi = (n) => { let r = n; for (let p = 2; p * p <= n; p++) if (n % p === 0) { while (n % p === 0) n /= p; r -= r / p; } if (n > 1) r -= r / n; return r; };
  const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;
  const factor = (n) => { const f = []; for (let p = 2; p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } return f; };
  const FERMAT = [3, 5, 17, 257, 65537];
  const constructibleNgon = (n) => isPow2(phi(n));
  // the degree of cos(a degrees) over Q, for a whole number of degrees
  const cosDegree = (a) => { const m = 360 / gcd(((a % 360) + 360) % 360 || 360, 360); return m <= 2 ? 1 : phi(m) / 2; };
  const trisectionCubic = (cosT) => (c) => 4 * c * c * c - 3 * c - cosT;

  (window.LabModels = window.LabModels || {})['galois-theory'] = { C, durandKerner, POLYS, permutations, PERMS, factorial, compose, inverse, cycles, cycleType, permOrder, cycleNotation, permuteRoots, breaks, galoisGroup, discriminant, isSquare, isEven, closure, subgroups, contains, isNormal, nameElements, generatorNames, FIELDS, fixedField, correspondence, gcd, phi, isPow2, factor, FERMAT, constructibleNgon, cosDegree, trisectionCubic };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const clickable = (f, elm, fn, label) => { elm.style.cursor = 'pointer'; elm.setAttribute('tabindex', '0'); elm.setAttribute('role', 'button'); elm.setAttribute('aria-label', label); elm.addEventListener('click', fn); elm.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); elm.style.pointerEvents = 'all'; f.layers.ui.appendChild(elm); };
  const SUB = '₁₂₃₄₅';

  /* ---------- 1. which permutations are allowed ---------- */
  D['roots-automorphisms'] = {
    render(ctx, v) {
      const st = ctx.state, P = POLYS[v.poly], n = P.roots.length, N = factorial(n), idx = Math.min(v.perm, N - 1), perms = PERMS[n], p = perms[idx];
      if (v.perm !== idx) ctx.set('perm', idx, true);
      if (st.poly !== v.poly) { st.G = galoisGroup(v.poly); st.Gset = new Set(st.G.map((x) => x.i)); st.poly = v.poly; }
      const inG = st.Gset.has(idx), broken = breaks(v.poly, p);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The roots of ${P.name} in the complex plane, and where the permutation σ sends each one.`, `複素平面上の ${P.name} の根と、置換 σ がそれぞれをどこへ送るかです。`));
      const R = Math.max(...P.roots.map(C.abs)) * 1.35;
      const f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, xlabel: 'Re', ylabel: 'Im', maxH: 400 });
      f.circle(0, 0, C.abs(P.roots[0]), { c: 'muted', w: 1, dash: '3 3', op: 0.6, layer: 'under' });
      const col = inG ? 'hl' : 'c2';
      p.forEach((to, k) => {
        if (to === k) { f.circle(P.roots[k][0], P.roots[k][1], R * 0.07, { c: col, w: 1.5, layer: 'main' }); return; }
        const a = P.roots[k], b = P.roots[to], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
        const cx = mx - dy / d * d * 0.25, cy = my + dx / d * d * 0.25, sh = R * 0.06;
        const pts = L.seq(25, (i) => { const t = 0.04 + 0.92 * i / 24; const u = 1 - t; return [u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]]; });
        void sh; f.line(pts, { c: col, w: 2, arrow: true, layer: 'main' });
      });
      P.roots.forEach((r, k) => { f.dot(r[0], r[1], { c: 'c1', r: 6, layer: 'over' }); f.text(r[0], r[1], `r${SUB[k]} = ${P.labels[k]}`, { small: true, c: 'c1', dx: r[0] >= -1e-9 ? 10 : -10, dy: r[1] >= 0 ? -10 : 16, anchor: r[0] >= -1e-9 ? 'start' : 'end', layer: 'over' }); });
      // right: the table of all n! permutations, coloured by membership
      L.h('p', 'lab-cap', c2, T(`All ${N} permutations of the ${n} roots. Filled: in the Galois group. Click one to select it.`, `${n} 個の根の置換 ${N} 個すべてです。塗りつぶしはガロア群の元です。クリックで選べます。`));
      const cols = n === 3 ? 6 : n === 4 ? 6 : 12, rows = Math.ceil(N / cols);
      const g = L.fig(c2, { x: [0, cols], y: [0, rows], equal: true, axes: false, maxH: 400 });
      perms.forEach((q, i) => {
        const cx = i % cols, cy = rows - 1 - Math.floor(i / cols), on = st.Gset.has(i), cur = i === idx;
        g.rect(cx + 0.08, cy + 0.08, 0.84, 0.84, { c: cur ? 'hl' : on ? 'c1' : 'muted', w: cur ? 2.5 : 1, fill: on ? 'c1' : 'plate', fo: on ? (cur ? 0.55 : 0.32) : 1, layer: 'main' });
        if (n <= 4) { const t = g.text(cx + 0.5, cy + 0.5, q.map((x) => x + 1).join(''), { small: true, c: on ? 'ink' : 'muted', dy: 4, layer: 'over' }); t.style.fontSize = n === 3 ? '13px' : '11px'; }
        const hit = L.el('rect', { x: g.X(cx), y: g.Y(cy + 1), width: g.X(1) - g.X(0), height: g.Y(0) - g.Y(1), fill: 'transparent' });
        clickable(g, hit, () => ctx.set('perm', i), T(`Permutation ${i}: ${cycleNotation(q)}`, `置換 ${i}：${cycleNotation(q)}`));
      });
      const Dn = discriminant(P.roots), sq = isSquare(Dn), ct = cycleType(p);
      L.legend(ctx.host, [{ c: 'c1', kind: 'dot', label: T('roots r₁ … rₙ', '根 r₁ … rₙ') }, { c: 'hl', label: T('σ, an element of the Galois group', 'σ、ガロア群の元') }, { c: 'c2', label: T('σ, excluded: it breaks a rational relation', 'σ、除外：有理的な関係を壊す') }, { c: 'c1', kind: 'fill', label: T('permutations in the group', '群に属する置換') }]);
      ctx.readout([
        { k: 'σ', v: `${cycleNotation(p)} (${T('index', '番号')} ${idx})`, tone: 'key' },
        { k: T('cycle type, order', '型、位数'), v: `${ct.join('+')}, ${permOrder(p)}` },
        { k: T('in the Galois group', 'ガロア群に属する'), v: inG ? T('yes', 'はい') : T(`no: breaks ${broken.n}`, `いいえ：${broken.n} を壊す`), tone: inG ? 'good' : 'warn' },
        { k: '|Gal|', v: `${st.G.length} = ${T(...P.group)}`, tone: 'good' },
        { k: 'Δ', v: `${Math.round(Dn)}${sq ? T(' = ' + Math.round(Math.sqrt(Dn)) + '², a square: Gal ⊆ A' + n, ' = ' + Math.round(Math.sqrt(Dn)) + '²、平方数：Gal ⊆ A' + n) : T(', not a square: Gal ⊄ A' + n, '、平方数でない：Gal ⊄ A' + n)}` },
        { k: T('σ even', 'σ は偶置換'), v: isEven(p) ? T('yes', 'はい') : T('no', 'いいえ') },
      ], v.poly === 5
        ? T('No rational relation of low degree ties the roots of x⁵ − x − 1 together, and its Galois group is all of S₅. Since S₅ is not solvable, the equation has no solution by radicals: Abel and Galois, in one polynomial.', 'x⁵ − x − 1 の根を結ぶ低次の有理的な関係はなく、そのガロア群は S₅ 全体です。S₅ は可解でないので、この方程式は根号では解けません。アーベルとガロアが一つの多項式に凝縮されています。')
        : inG
          ? T(`σ preserves every relation on the list, and the group of survivors has ${st.G.length} elements, matching the degree of the splitting field.`, `σ はリストのすべての関係を保ち、生き残った置換の群は ${st.G.length} 個の元をもちます。これは分解体の次数と一致します。`)
          : T(`σ sends the roots somewhere the relation ${broken.n} no longer holds, so no automorphism can act this way: the arrows are drawn in orange to mark an impossible symmetry.`, `σ は根を、関係 ${broken.n} がもはや成り立たない場所へ送ります。このように作用する自己同型は存在しないので、矢印は不可能な対称性のしるしとして橙色で描いています。`));
    },
  };

  /* ---------- 2. the Galois correspondence ---------- */
  D['correspondence'] = {
    render(ctx, v) {
      const st = ctx.state, ext = v.ext;
      if (st.ext !== ext) { st.cor = correspondence(ext); st.ext = ext; }
      const { G, subs } = st.cor, NS = subs.length, pick = clamp(v.pick, 0, NS), sel = pick ? subs[pick - 1] : null;
      if (v.pick !== pick) ctx.set('pick', pick, true);
      // levels by order: trivial group at the top, G at the bottom; fields mirror them (K at the top, Q at the bottom)
      const orders = [...new Set(subs.map((s) => s.order))].sort((a, b) => a - b), levels = orders.length;
      L.h('p', 'lab-cap', ctx.host, T('Left: the subgroups of the Galois group, smallest at the top. Right: the intermediate fields, largest at the top. Each subgroup sits level with the field it fixes; click any node.', '左はガロア群の部分群で、最小のものが上です。右は中間体で、最大のものが上です。各部分群はそれが固定する体と同じ高さにあります。どのノードでもクリックできます。'));
      const W = 160, H = 10 + 16 * levels, f = L.stage(ctx.host, { w: W, h: H, maxH: 560 });
      const pos = new Map();
      orders.forEach((o, li) => { const group = subs.filter((s) => s.order === o); const y = H - 12 - li * 16; group.forEach((s, k) => { pos.set(s, { x: 3 + (k + 0.5) / group.length * 74, y, fx: 83 + (k + 0.5) / group.length * 74 }); }); });
      const boxW = (txt) => Math.max(9, 1.55 * txt.length + 3.5), node = (x, y, txt, on, dim, kind) => {
        const w = boxW(txt); f.rect(x - w / 2, y - 3.6, w, 7.2, { c: on ? 'hl' : kind === 'H' ? 'c1' : 'c3', w: on ? 1.8 : 1, fill: on ? 'hl' : kind === 'H' ? 'c1' : 'c3', fo: on ? 0.32 : dim ? 0.05 : 0.15, op: dim ? 0.4 : 1, layer: 'main' });
        const t = f.text(x, y, txt, { c: on ? 'hl' : 'ink', dy: 4, layer: 'over' }); t.style.fontSize = '12px'; if (dim) t.style.opacity = 0.4; return w;
      };
      // inclusion edges (Hasse: H < K with no subgroup strictly between)
      const between = (A, B) => subs.some((S) => S !== A && S !== B && contains(B.H, S.H) && contains(S.H, A.H) && S.order !== A.order && S.order !== B.order);
      const chainOf = sel ? new Set(subs.filter((s) => contains(sel.H, s.H) || contains(s.H, sel.H))) : null;
      subs.forEach((A) => subs.forEach((B) => {
        if (A === B || A.order >= B.order || !contains(B.H, A.H) || between(A, B)) return;
        const a = pos.get(A), b = pos.get(B), on = sel && chainOf.has(A) && chainOf.has(B);
        f.seg([a.x, a.y - 3.6], [b.x, b.y + 3.6], { c: on ? 'hl' : 'c1', w: on ? 1.8 : 0.8, op: sel && !on ? 0.18 : 0.7, layer: 'under' });
        f.seg([a.fx, a.y - 3.6], [b.fx, b.y + 3.6], { c: on ? 'hl' : 'c3', w: on ? 1.8 : 0.8, op: sel && !on ? 0.18 : 0.7, layer: 'under' });
      }));
      if (sel) { const a = pos.get(sel); f.seg([a.x + boxW(sel.order === 1 ? '{e}' : sel.order === G.length ? 'G' : '⟨' + sel.gens.join(', ') + '⟩') / 2 + 1, a.y], [a.fx - boxW(sel.field.name) / 2 - 1, a.y], { c: 'hl', w: 1.3, dash: '2 2', op: 0.9, layer: 'under' }); }
      f.text(40, H - 1.5, T('subgroups H of G, order above each', 'G の部分群 H、上に位数'), { small: true, c: 'c1', layer: 'over' });
      f.text(120, H - 1.5, T('fixed fields Kᴴ, degree over ℚ above each', '固定体 Kᴴ、上に ℚ 上の次数'), { small: true, c: 'c3', layer: 'over' });
      subs.forEach((s, i) => {
        const a = pos.get(s), on = sel === s, dim = !!sel && !chainOf.has(s);
        const label = s.order === 1 ? '{e}' : s.order === G.length ? 'G' : '⟨' + s.gens.join(', ') + '⟩';
        const w1 = node(a.x, a.y, label, on, dim, 'H'), w2 = node(a.fx, a.y, s.field.name, on, dim, 'F');
        const t1 = f.text(a.x - w1 / 2, a.y + 3.6, `|H| = ${s.order}`, { small: true, c: 'muted', anchor: 'start', dy: -2, layer: 'over' }), t2 = f.text(a.fx - w2 / 2, a.y + 3.6, `[${s.field.deg}]`, { small: true, c: 'muted', anchor: 'start', dy: -2, layer: 'over' });
        if (dim) { t1.style.opacity = 0.4; t2.style.opacity = 0.4; }
        for (const [x, w] of [[a.x, w1], [a.fx, w2]]) { const hit = L.el('rect', { x: f.X(x - w / 2), y: f.Y(a.y + 4.5), width: f.X(w) - f.X(0), height: f.Y(0) - f.Y(9), fill: 'transparent' }); clickable(f, hit, () => ctx.set('pick', on ? 0 : i + 1), `${label} ↔ ${s.field.name}`); }
      });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('subgroup, with its order above', '部分群、上に位数') }, { c: 'c3', kind: 'fill', label: T('fixed field, with its degree over ℚ', '固定体、上に ℚ 上の次数') }, { c: 'hl', label: T('the selected pair and the chain through it', '選んだ対とそれを通る鎖') }]);
      const items = [{ k: '|G|', v: `${G.length} = [K : ℚ]` }, { k: T('subgroups = intermediate fields', '部分群 = 中間体'), v: String(NS), tone: 'good' }];
      if (sel) items.push({ k: 'H', v: sel.order === 1 ? '{e}' : sel.order === G.length ? 'G' : '⟨' + sel.gens.join(', ') + '⟩', tone: 'key' }, { k: '|H|, [G : H]', v: `${sel.order}, ${sel.index}` }, { k: 'Kᴴ', v: sel.field.name, tone: 'key' }, { k: '[Kᴴ : ℚ]', v: `${sel.field.deg} = [G : H]`, tone: sel.field.deg === sel.index ? 'good' : 'warn' }, { k: T('H normal', 'H は正規'), v: sel.normal ? T(`yes: Kᴴ/ℚ is Galois with group of order ${sel.index}`, `はい：Kᴴ/ℚ は位数 ${sel.index} の群をもつガロア拡大`) : T('no: Kᴴ/ℚ is not Galois', 'いいえ：Kᴴ/ℚ はガロア拡大ではない'), tone: sel.normal ? 'good' : 'warn' });
      ctx.readout(items, sel
        ? (sel.order === 1 ? T('The trivial subgroup fixes everything, so its field is all of K. Its partner at the other end is G itself, which fixes only ℚ.', '自明な部分群はすべてを固定するので、その体は K 全体です。反対側の相手は G 自身で、ℚ だけを固定します。')
          : sel.normal ? T(`Every conjugate of H is H again, so its fixed field is sent to itself by all of G and is Galois over ℚ in its own right; its group is the quotient G/H, of order ${sel.index}.`, `H のどの共役も H 自身なので、その固定体は G 全体によって自分自身に写され、それ自体が ℚ 上ガロアです。その群は位数 ${sel.index} の商群 G/H です。`)
            : T('H is not normal: some g ∈ G moves the fixed field to a different field of the same degree, the fixed field of gHg⁻¹, which is its conjugate on the same level.', 'H は正規ではありません。ある g ∈ G は固定体を同じ次数の別の体、すなわち gHg⁻¹ の固定体へ動かします。それは同じ高さにある共役です。'))
        : T('Select a subgroup or a field. Going up the left lattice shrinks the subgroup and enlarges the field on the right: the correspondence reverses inclusions.', '部分群か体を選んでください。左の束を上へ行くと部分群は小さくなり、右の体は大きくなります。対応は包含を逆にします。'));
      st.rho = st.cor.names;
    },
  };

  /* ---------- 3. constructions ---------- */
  const CONSTRUCTIBLE_TO_64 = L.seq(62, (i) => i + 3).filter(constructibleNgon);
  D['constructions'] = {
    render(ctx, v) {
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      if (v.problem === 0) {
        const n = v.n, ph = phi(n), ok = isPow2(ph), fac = factor(n);
        L.h('p', 'lab-cap', c1, T(`The regular ${n}-gon, vertices at the n-th roots of unity. Solid if constructible, dashed if not.`, `正 ${n} 角形で、頂点は 1 の n 乗根です。作図可能なら実線、不可能なら破線です。`));
        const f = L.fig(c1, { x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, maxH: 400 });
        f.circle(0, 0, 1, { c: 'muted', w: 1, op: 0.5, layer: 'under' });
        const pts = L.seq(n + 1, (k) => [Math.cos(TAU * k / n), Math.sin(TAU * k / n)]);
        f.line(pts, { c: ok ? 'c1' : 'c2', w: 2, dash: ok ? undefined : '4 3', layer: 'main' });
        if (n <= 24) pts.slice(0, n).forEach(([x, y]) => f.dot(x, y, { c: ok ? 'c1' : 'c2', r: 3.5, layer: 'main' }));
        f.dot(1, 0, { c: 'hl', r: 5, layer: 'over' }); f.dot(Math.cos(TAU / n), Math.sin(TAU / n), { c: 'hl', r: 5, layer: 'over' });
        f.text(Math.cos(TAU / n), Math.sin(TAU / n), 'ζ = e^{2πi/n}', { c: 'hl', dx: 10, dy: -8, anchor: 'start', layer: 'over' });
        f.seg([0, 0], [Math.cos(TAU / n), 0], { c: 'hl', w: 1.2, dash: '2 2', layer: 'over' }); f.seg([Math.cos(TAU / n), 0], [Math.cos(TAU / n), Math.sin(TAU / n)], { c: 'hl', w: 1.2, dash: '2 2', layer: 'over' });
        f.text(Math.cos(TAU / n) / 2, 0, 'cos(2π/n)', { small: true, c: 'hl', dy: 14, layer: 'over' });
        L.h('p', 'lab-cap', c2, T('φ(n) for n = 3 … 64 on a log₂ scale. Powers of 2 sit on the grid lines: those n-gons are constructible. Click a bar.', 'n = 3 … 64 の φ(n) を log₂ 目盛で示します。2 のべきは格子線の上に乗り、その n 角形は作図可能です。棒をクリックできます。'));
        const g = L.fig(c2, { x: [2.5, 64.5], y: [0, 6.3], aspect: 0.7, xlabel: 'n', ylabel: 'log₂ φ(n)', maxH: 400, ticksY: [[0, '1'], [1, '2'], [2, '4'], [3, '8'], [4, '16'], [5, '32'], [6, '64']] });
        for (let k = 0; k <= 6; k++) g.hline(k, { c: 'muted', w: 0.6, dash: '2 3', op: 0.6, layer: 'under' });
        for (let m = 3; m <= 64; m++) { const p2 = isPow2(phi(m)), cur = m === n; g.rect(m - 0.4, 0, 0.8, Math.log2(phi(m)), { c: cur ? 'hl' : p2 ? 'c1' : 'muted', w: cur ? 1.5 : 0, fill: cur ? 'hl' : p2 ? 'c1' : 'muted', fo: p2 ? 0.7 : 0.3, nostroke: !cur, layer: 'main' }); const hit = L.el('rect', { x: g.X(m - 0.5), y: g.Y(6.3), width: g.X(1) - g.X(0), height: g.Y(0) - g.Y(6.3), fill: 'transparent' }); clickable(g, hit, () => ctx.set('n', m), `n = ${m}, φ = ${phi(m)}`); }
        L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('φ(n) a power of 2: constructible', 'φ(n) が 2 のべき：作図可能') }, { c: 'muted', kind: 'fill', label: T('not constructible', '作図不可能') }, { c: 'hl', kind: 'dot', label: T('the chosen n', '選んだ n') }]);
        const fp = [...new Set(fac)].filter((p) => FERMAT.includes(p)), odd = [...new Set(fac)].filter((p) => p !== 2), repeated = fac.length !== new Set(fac).size && odd.some((p) => fac.filter((q) => q === p).length > 1);
        ctx.readout([
          { k: 'n', v: `${n} = ${fac.join(' · ')}`, tone: 'key' },
          { k: 'φ(n)', v: `${ph}${ok ? ' = 2' + String(Math.log2(ph)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('') : ''}` },
          { k: '[ℚ(cos 2π/n) : ℚ]', v: String(ph / 2) },
          { k: T('constructible', '作図可能'), v: ok ? T('yes', 'はい') : T('no', 'いいえ'), tone: ok ? 'good' : 'warn' },
          { k: T('Fermat primes in n', 'n に含まれるフェルマー素数'), v: fp.length ? fp.join(', ') : T('none', 'なし') },
        ], ok
          ? T(`φ(${n}) = ${ph} is a power of 2, so the tower ℚ ⊂ … ⊂ ℚ(cos 2π/${n}) has ${Math.log2(ph / 2)} quadratic steps and the ${n}-gon can be drawn. There are ${CONSTRUCTIBLE_TO_64.length} such n up to 64.`, `φ(${n}) = ${ph} は 2 のべきなので、塔 ℚ ⊂ … ⊂ ℚ(cos 2π/${n}) は ${Math.log2(ph / 2)} 段の二次拡大からなり、正 ${n} 角形は描けます。64 以下にはそのような n が ${CONSTRUCTIBLE_TO_64.length} 個あります。`)
          : repeated ? T(`n has a repeated odd prime factor, so φ(n) picks up that prime and cannot be a power of 2: the ${n}-gon is not constructible, even though a smaller polygon with the same prime may be.`, `n は奇素数の因子を繰り返しもつので、φ(n) はその素数を含み 2 のべきにはなれません。正 ${n} 角形は作図不可能です。同じ素数をもつより小さい多角形は作図できることがあるにもかかわらずです。`)
            : T(`n has an odd prime factor that is not a Fermat prime, so φ(n) has an odd factor and the ${n}-gon is not constructible.`, `n はフェルマー素数でない奇素数の因子をもつので、φ(n) は奇数の因子をもち、正 ${n} 角形は作図不可能です。`));
      } else {
        const th = v.theta, cT = Math.cos(th * Math.PI / 180), d1 = cosDegree(th), d3 = cosDegree(th / 3), rel = d3 / d1, ok = rel !== 3;
        L.h('p', 'lab-cap', c1, T(`The angle θ = ${th}° and its trisectors at ${th / 3}° steps, solid if constructible from θ, dashed if not.`, `角 θ = ${th}° と、${th / 3}° 刻みの三等分線です。θ から作図可能なら実線、不可能なら破線です。`));
        const f = L.fig(c1, { x: [-1.25, 1.25], y: [-0.35, 1.25], equal: true, axes: false, maxH: 400 });
        f.seg([0, 0], [1.15, 0], { c: 'ink', w: 1.6, layer: 'main' });
        f.seg([0, 0], [1.15 * Math.cos(th * Math.PI / 180), 1.15 * Math.sin(th * Math.PI / 180)], { c: 'ink', w: 1.6, layer: 'main' });
        f.line(L.sample(0, th * Math.PI / 180, 60, (a) => [0.5 * Math.cos(a), 0.5 * Math.sin(a)]), { c: 'c1', w: 1.4, layer: 'main' });
        [1, 2].forEach((k) => { const a = th * k / 3 * Math.PI / 180; f.seg([0, 0], [1.05 * Math.cos(a), 1.05 * Math.sin(a)], { c: ok ? 'hl' : 'c2', w: 1.6, dash: ok ? undefined : '4 3', layer: 'main' }); });
        f.text(0.62 * Math.cos(th / 2 * Math.PI / 180), 0.62 * Math.sin(th / 2 * Math.PI / 180), `θ = ${th}°`, { c: 'c1', layer: 'over' });
        f.text(1.1 * Math.cos(th / 3 * Math.PI / 180), 1.1 * Math.sin(th / 3 * Math.PI / 180), `θ/3 = ${th / 3}°`, { small: true, c: ok ? 'hl' : 'c2', anchor: 'start', dx: 6, layer: 'over' });
        L.h('p', 'lab-cap', c2, T('The trisection cubic 4c³ − 3c − cos θ. Its three real roots are cos(θ/3), cos(θ/3 + 120°), cos(θ/3 + 240°).', '三等分の三次式 4c³ − 3c − cos θ です。三つの実根は cos(θ/3)、cos(θ/3 + 120°)、cos(θ/3 + 240°) です。'));
        const g = L.fig(c2, { x: [-1.15, 1.15], y: [-2.2, 2.2], aspect: 0.7, xlabel: 'c', ylabel: '4c³ − 3c − cos θ', maxH: 400 });
        const cubic = trisectionCubic(cT);
        g.line(L.sample(-1.15, 1.15, 200, cubic), { c: 'c1', w: 2.2, layer: 'main' });
        [0, 120, 240].forEach((o, i) => { const c = Math.cos((th / 3 + o) * Math.PI / 180); g.dot(c, 0, { c: i === 0 ? 'hl' : 'c1', r: i === 0 ? 6 : 4, layer: 'over' }); if (i === 0) g.text(c, 0, `cos ${th / 3}° = ${fmt(c, 4)}`, { c: 'hl', dy: -12, layer: 'over' }); });
        L.legend(ctx.host, [{ c: 'c1', label: T('the angle θ and the cubic', '角 θ と三次式') }, { c: 'hl', label: T('trisectors and cos(θ/3), constructible', '三等分線と cos(θ/3)、作図可能') }, { c: 'c2', dash: true, label: T('trisectors that cannot be constructed from θ', 'θ から作図できない三等分線') }]);
        ctx.readout([
          { k: 'θ, cos θ', v: `${th}°, ${fmt(cT, 4)}`, tone: 'key' },
          { k: '[ℚ(cos θ) : ℚ]', v: String(d1) },
          { k: '[ℚ(cos θ/3) : ℚ]', v: String(d3) },
          { k: T('relative degree', '相対次数'), v: String(rel), tone: ok ? 'good' : 'warn' },
          { k: T('trisectable from θ', 'θ から三等分可能'), v: ok ? T('yes', 'はい') : T('no', 'いいえ'), tone: ok ? 'good' : 'warn' },
        ], ok
          ? (rel === 1 ? T(`cos(θ/3) already lies in ℚ(cos θ): the cubic has a root there, and the trisection needs no new construction at all.`, `cos(θ/3) はすでに ℚ(cos θ) に含まれています。三次式はそこに根をもち、三等分に新しい作図はまったく要りません。`) : T(`The cubic splits over ℚ(cos θ) into a linear and a quadratic factor, so cos(θ/3) is one square root away and the trisection is a single compass step.`, `三次式は ℚ(cos θ) 上で一次因子と二次因子に分かれるので、cos(θ/3) は平方根一つ分の距離にあり、三等分はコンパスの一手です。`))
          : T(`The cubic is irreducible over ℚ(cos θ), so cos(θ/3) has degree 3 over it. Degree 3 never divides a power of 2: no finite sequence of ruler and compass steps reaches ${th / 3}° from ${th}°. Yet ${th / 3}° may be constructible from scratch by another route when its own degree is a power of 2; check the readout above.`, `三次式は ℚ(cos θ) 上既約なので、cos(θ/3) はその上で次数 3 です。次数 3 が 2 のべきを割ることはないので、定規とコンパスの有限回の手順で ${th}° から ${th / 3}° に達することはできません。ただし ${th / 3}° 自体の次数が 2 のべきなら、別の経路で一から作図できることがあります。上の表示を確かめてください。`));
      }
    },
  };
})();
