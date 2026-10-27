'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/combinatorics.cjs) ---------- */
  // Partitions as arrays of parts in non-increasing order.
  function partitionsOf(n, ok = () => true, distinct = false, max = n) {
    const out = [], cur = [];
    const rec = (rem, mx) => {
      if (rem === 0) { out.push(cur.slice()); return; }
      for (let k = Math.min(rem, mx); k >= 1; k--) { if (!ok(k)) continue; cur.push(k); rec(rem - k, distinct ? k - 1 : k); cur.pop(); }
    };
    rec(n, max);
    return out;
  }
  const oddPartitions = (n) => partitionsOf(n, (k) => k % 2 === 1);
  const distinctPartitions = (n) => partitionsOf(n, () => true, true);
  // p(n) for n = 0..N by Euler's pentagonal number theorem
  function partitionCounts(N) {
    const p = [1];
    for (let n = 1; n <= N; n++) {
      let s = 0;
      for (let k = 1; ; k++) {
        const g1 = (k * (3 * k - 1)) / 2, g2 = (k * (3 * k + 1)) / 2, sg = k % 2 ? 1 : -1;
        if (g1 > n) break;
        s += sg * p[n - g1]; if (g2 <= n) s += sg * p[n - g2];
      }
      p.push(s);
    }
    return p;
  }
  // number of partitions of 0..N into parts from a set, each part at most once if distinct
  function restrictedCounts(N, ok, distinct) {
    const a = new Array(N + 1).fill(0); a[0] = 1;
    for (let k = 1; k <= N; k++) {
      if (!ok(k)) continue;
      if (distinct) for (let m = N; m >= k; m--) a[m] += a[m - k];
      else for (let m = k; m <= N; m++) a[m] += a[m - k];
    }
    return a;
  }
  const oddCore = (k) => { while (k % 2 === 0) k /= 2; return k; };
  // Glaisher's bijection as a process: repeatedly merge two equal parts (the smallest repeated value first) until every part is distinct.
  function glaisherSteps(parts) {
    let cur = parts.slice().sort((a, b) => b - a);
    const steps = [{ parts: cur.slice(), merged: null }];
    for (let guard = 0; guard < 1000; guard++) {
      const cnt = new Map(); cur.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
      const reps = [...cnt.entries()].filter(([, c]) => c >= 2).map(([x]) => x).sort((a, b) => a - b);
      if (!reps.length) break;
      const a = reps[0]; let removed = 0;
      cur = cur.filter((x) => (x === a && removed < 2 ? (removed++, false) : true));
      cur.push(2 * a); cur.sort((x, y) => y - x);
      steps.push({ parts: cur.slice(), merged: a });
    }
    return steps;
  }
  const glaisher = (parts) => { const s = glaisherSteps(parts); return s[s.length - 1].parts; };
  // inverse: a distinct part o·2^j splits back into 2^j copies of the odd number o
  const glaisherInverse = (parts) => { const out = []; parts.forEach((d) => { const o = oddCore(d); for (let i = 0; i < d / o; i++) out.push(o); }); return out.sort((a, b) => b - a); };

  // Catalan objects. Dyck words over 'U','D' in lexicographic order (U before D).
  const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
  const catalan = (n) => binom(2 * n, n) / (n + 1);
  function dyckWords(n) {
    const out = [], w = [];
    const rec = (u, d) => { if (u === n && d === n) { out.push(w.join('')); return; } if (u < n) { w.push('U'); rec(u + 1, d); w.pop(); } if (d < u) { w.push('D'); rec(u, d + 1); w.pop(); } };
    rec(0, 0); return out;
  }
  // first-return decomposition w = U A D B: the root's left subtree is A, its right subtree is B
  function wordToTree(w, off = 0) {
    if (!w.length) return null;
    let h = 0, j = 0;
    for (; j < w.length; j++) { h += w[j] === 'U' ? 1 : -1; if (h === 0) break; }
    return { open: off, close: off + j, l: wordToTree(w.slice(1, j), off + 1), r: wordToTree(w.slice(j + 1), off + j + 1) };
  }
  const treeSize = (t) => (t ? 1 + treeSize(t.l) + treeSize(t.r) : 0);
  // the root edge of the polygon (i, j) carries the root triangle (i, m, j); left subtree on (i, m), right on (m, j)
  function treeToTriangles(t, i, j, out = []) {
    if (!t) return out;
    const m = i + treeSize(t.l) + 1;
    out.push({ tri: [i, m, j], open: t.open });
    treeToTriangles(t.l, i, m, out); treeToTriangles(t.r, m, j, out);
    return out;
  }
  const triangulation = (w) => treeToTriangles(wordToTree(w), 0, w.length / 2 + 1);
  // paths of n ups and n downs that dip below zero, counted by André's reflection
  const badPaths = (n) => binom(2 * n, n + 1);

  // Generating functions, their coefficients and the singularity-analysis prediction
  const PHI = (1 + Math.sqrt(5)) / 2;
  const cx = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, sqrt: (a) => { const r = Math.hypot(a[0], a[1]), t = Math.atan2(a[1], a[0]) / 2, s = Math.sqrt(r); return [s * Math.cos(t), s * Math.sin(t)]; }, exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; }, log: (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])] };
  const pc = partitionCounts(400);
  const SEQS = [
    { key: 'fib', rho: 1 / PHI, coef: (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }, asym: (n) => PHI ** n / Math.sqrt(5),
      gf: (z) => cx.div(z, cx.sub(cx.sub([1, 0], z), cx.mul(z, z))), sing: [[1 / PHI, 0], [-PHI, 0]] },
    { key: 'catalan', rho: 0.25, coef: catalan, asym: (n) => 4 ** n / (Math.sqrt(Math.PI) * n ** 1.5),
      gf: (z) => (Math.hypot(z[0], z[1]) < 1e-9 ? [1, 0] : cx.div(cx.sub([1, 0], cx.sqrt(cx.sub([1, 0], cx.mul([4, 0], z)))), cx.mul([2, 0], z))), sing: [[0.25, 0]] },
    { key: 'motzkin', rho: 1 / 3, coef: (n) => { let a = 1, b = 1; if (n === 0) return 1; for (let k = 2; k <= n; k++) [a, b] = [b, ((2 * k + 1) * b + (3 * k - 3) * a) / (k + 2)]; return b; }, asym: (n) => Math.sqrt(27 / (4 * Math.PI)) * 3 ** n / n ** 1.5,
      gf: (z) => { if (Math.hypot(z[0], z[1]) < 1e-6) return [1, 0]; const z2 = cx.mul(z, z), s = cx.sqrt(cx.sub(cx.sub([1, 0], cx.mul([2, 0], z)), cx.mul([3, 0], z2))); return cx.div(cx.sub(cx.sub([1, 0], z), s), cx.mul([2, 0], z2)); }, sing: [[1 / 3, 0], [-1, 0]] },
    { key: 'derange', rho: 1, coef: (n) => { let d = 1, f = 1; for (let k = 1; k <= n; k++) { f /= k; d += (k % 2 ? -1 : 1) * f; } return d; }, asym: () => Math.exp(-1),
      gf: (z) => cx.div(cx.exp([-z[0], -z[1]]), cx.sub([1, 0], z)), sing: [[1, 0]] },
    { key: 'partitions', rho: 1, coef: (n) => pc[n], asym: (n) => Math.exp(Math.PI * Math.sqrt((2 * n) / 3)) / (4 * n * Math.sqrt(3)),
      gf: (z) => { if (Math.hypot(z[0], z[1]) > 0.965) return null; let s = [0, 0], zk = [1, 0]; for (let k = 1; k <= 420; k++) { zk = cx.mul(zk, z); if (Math.hypot(zk[0], zk[1]) < 1e-9) break; s = cx.sub(s, cx.log(cx.sub([1, 0], zk))); } return cx.exp(s); }, sing: [] },
  ];

  (window.LabModels = window.LabModels || {})['combinatorics'] = { partitionsOf, oddPartitions, distinctPartitions, partitionCounts, restrictedCounts, oddCore, glaisherSteps, glaisher, glaisherInverse, binom, catalan, dyckWords, wordToTree, treeSize, treeToTriangles, triangulation, badPaths, SEQS, cx, PHI };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const TOK = ['c1', 'c2', 'c3', 'c4'];
  const coreTok = (o) => TOK[((o - 1) / 2) % 4];
  const sup = (e) => String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] ?? c).join('');
  const big = (x) => (x < 1e6 ? fmt(Math.round(x), 7) : (() => { const e = Math.floor(Math.log10(x)); return `${fmt(x / 10 ** e, 4)}×10${sup(e)}`; })());
  const partStr = (ps) => ps.join(' + ');

  /* ---------- 1. partitions: odd parts = distinct parts ---------- */
  const PC = partitionCounts(40), QC = restrictedCounts(40, () => true, true), OC = restrictedCounts(40, (k) => k % 2 === 1, false);
  D['partitions-glaisher'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = v.n, odds = oddPartitions(n), q = odds.length, idx = (((v.k - 1) % q) + q) % q, start = odds[idx];
      const steps = glaisherSteps(start), S = steps.length - 1, fin = steps[S].parts;
      const rows = Math.max(...steps.map((s) => s.parts.length)), cols = Math.max(...steps.map((s) => s.parts[0]));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const cap = L.h('p', 'lab-cap', c1, '');
      const W = cols + Math.max(4.2, cols * 0.42), f = L.fig(c1, { x: [0, W], y: [-rows - 0.4, 0.6], equal: true, axes: false, grid: false, maxH: 460 });
      const G = f.group('main');
      const draw = (s) => {
        while (G.firstChild) G.removeChild(G.firstChild);
        const st = steps[s], ps = st.parts, add = (e) => (G.appendChild(e), e);
        let newDone = false;
        ps.forEach((part, r) => {
          const o = oddCore(part), tok = coreTok(o), isNew = st.merged !== null && part === 2 * st.merged && !newDone;
          if (isNew) newDone = true;
          for (let c = 0; c < part; c++) add(f.rect(c + 0.06, -r - 0.94, 0.88, 0.88, { c: tok, fill: tok, fo: isNew ? 0.85 : 0.45, w: 0.8 }));
          if (isNew) add(f.rect(0, -r - 1, part, 1, { c: 'hl', w: 2.6 }));
          const j = Math.round(Math.log2(part / o));
          add(f.text(part + 0.35, -r - 0.5, j ? `${part} = ${o}·2${sup(j)}` : `${part}`, { small: true, c: isNew ? 'hl' : tok, anchor: 'start', dy: 4 }));
        });
        cap.textContent = s === 0
          ? T(`A partition of ${n} into odd parts, one row per part, coloured by its odd part. Press Play to merge equal rows two at a time.`, `${n} の奇数部分への分割です。部分ごとに一行で、奇数の部分で色分けしています。再生を押すと、等しい行を二つずつ合わせます。`)
          : s < S
            ? T(`Step ${s} of ${S}: two rows of ${st.merged} merged into one row of ${2 * st.merged}. The colour, the odd part, never changes.`, `${S} 段階中の ${s} 段階目：長さ ${st.merged} の二行を長さ ${2 * st.merged} の一行に合わせました。色、つまり奇数の部分は変わりません。`)
            : T(`Done after ${S} merge${S === 1 ? '' : 's'}: no two rows are equal, so this is a partition of ${n} into distinct parts. Each colour has split its count into powers of two.`, `${S} 回の合併で完了です。等しい行が二つとないので、これは ${n} の相異なる部分への分割です。各色は個数を 2 のべきに分けています。`);
      };
      // right: the counts agree for every n
      L.h('p', 'lab-cap', c2, T('Partitions of n into odd parts (rings) and into distinct parts (dots) coincide for every n, while all partitions p(n) grow faster. Drag the gold point to choose n.', 'n の奇数部分への分割（輪）と相異なる部分への分割（点）の数は、どの n でも一致します。すべての分割の数 p(n) はより速く増えます。金色の点をドラッグして n を選んでください。'));
      const g = L.fig(c2, { x: [0, 25], y: [0, 3.4], aspect: 0.9, xlabel: 'n', ylabel: T('log₁₀ count', 'log₁₀ 個数'), maxH: 420, ticksY: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
      g.line(L.seq(24, (i) => [i + 1, Math.log10(PC[i + 1])]), { c: 'muted', w: 1.6, dash: '5 3' });
      g.text(23.6, Math.log10(PC[23]), 'p(n)', { small: true, c: 'muted', anchor: 'end', dy: -8 });
      for (let m = 1; m <= 24; m++) { g.dot(m, Math.log10(OC[m]), { c: 'c2', r: 6, hollow: true, layer: 'main' }); g.dot(m, Math.log10(QC[m]), { c: 'c1', r: 2.8, layer: 'main' }); }
      g.handle(n, Math.log10(q), { c: 'hl', r: 7, axis: 'x', snap: 1, label: 'n', bounds: [3, 24, 0, 3.4], onDrag: (x) => ctx.set('n', Math.round(x)) });
      L.legend(ctx.host, [{ c: 'c2', kind: 'dot', label: T('odd parts', '奇数の部分') }, { c: 'c1', kind: 'dot', label: T('distinct parts', '相異なる部分') }, { c: 'muted', dash: true, label: T('all partitions p(n)', 'すべての分割 p(n)') }, { c: 'hl', label: T('the merged row', '合わせた行') }]);
      const back = glaisherInverse(fin).join(',') === start.join(',');
      const out = (s) => ctx.readout([
        { k: 'n', v: String(n), tone: 'key' },
        { k: T('odd parts', '奇数の部分'), v: partStr(start) },
        { k: T('distinct parts', '相異なる部分'), v: partStr(fin), tone: 'good' },
        { k: T('partition', '分割'), v: T(`${idx + 1} of ${q}`, `${q} 個中 ${idx + 1} 番目`) },
        { k: T('odd = distinct', '奇数 = 相異'), v: `${OC[n]} = ${QC[n]}` },
        { k: 'p(n)', v: String(PC[n]) },
      ], back
        ? T('Read backwards, every distinct part o·2ʲ splits into 2ʲ copies of the odd number o, which recovers the starting partition. Merging is forced at every step, so the map is a bijection.', '逆に読むと、相異なる部分 o·2ʲ はそれぞれ奇数 o の 2ʲ 個の写しに分かれ、最初の分割に戻ります。合併はどの段階でも一通りに決まるので、この写像は全単射です。')
        : '');
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const s = Math.min(S, Math.floor(t / 0.9)); draw(s); out(s); lb.textContent = T(`merge ${s} of ${S}`, `合併 ${S} 回中 ${s} 回`); return s < S; }, { autoplay: false, once: true, initialT: 1e4, playLabel: T('Play: merge equal parts', '再生：等しい部分を合わせる') });
    },
  };

  /* ---------- 2. Catalan objects in lockstep ---------- */
  const DYCK = L.seq(8, (n) => dyckWords(n));
  D['catalan-objects'] = {
    render(ctx, v) {
      const n = v.n, words = DYCK[n], C = words.length, idx = (((v.k - 1) % C) + C) % C, w = words[idx];
      const tree = wordToTree(w), tris = treeToTriangles(tree, 0, n + 1);
      // matching pairs and depths
      const match = {}, depth = {}; { const stk = []; for (let i = 0; i < w.length; i++) { if (w[i] === 'U') { depth[i] = stk.length; stk.push(i); } else match[stk.pop()] = i; } }
      const opens = Object.keys(match).map(Number).sort((a, b) => a - b), selOpen = opens[(v.sel - 1) % n], selClose = match[selOpen];
      const row = L.h('div', 'lab-row', ctx.host), A = L.h('div', 'lab-col', row), B = L.h('div', 'lab-col', row), Cc = L.h('div', 'lab-col', row);
      // Dyck path
      L.h('p', 'lab-cap', A, T('A Dyck path: up and down steps that never go below the axis. The gold pair is an up step and the down step that first returns to its level.', 'ディック経路：軸の下へ決して行かない上りと下りの歩みです。金色の組は上りと、それが最初に同じ高さへ戻る下りです。'));
      const H = Math.max(2, n), pf = L.fig(A, { x: [-0.3, 2 * n + 0.3], y: [-0.4, H + 0.4], equal: true, axes: false, grid: false, maxH: 300 });
      for (let x = 0; x <= 2 * n; x++) for (let y = (x % 2); y <= Math.min(x, 2 * n - x, H); y += 2) pf.dot(x, y, { c: 'muted', r: 2, op: 0.55, layer: 'under' });
      pf.seg([0, 0], [2 * n, 0], { c: 'muted', w: 1.2, layer: 'under' });
      const ys = [0]; for (const s of w) ys.push(ys[ys.length - 1] + (s === 'U' ? 1 : -1));
      pf.poly(L.seq(selClose - selOpen + 2, (i) => [selOpen + i, ys[selOpen + i]]), { c: 'hl', fill: 'hl', fo: 0.14, w: 0 });
      pf.line(ys.map((y, i) => [i, y]), { c: 'c1', w: 2.6 });
      pf.seg([selOpen, ys[selOpen]], [selOpen + 1, ys[selOpen + 1]], { c: 'hl', w: 4.2, layer: 'over' }); pf.seg([selClose, ys[selClose]], [selClose + 1, ys[selClose + 1]], { c: 'hl', w: 4.2, layer: 'over' });
      // binary tree, laid out in order with its n + 1 leaves
      L.h('p', 'lab-cap', B, T('The binary tree: an up step is a node, what lies inside its pair is the left subtree, what follows is the right. Hollow leaves are the polygon’s sides.', '二分木：上りの歩みが節点で、その組の内側が左部分木、後に続く部分が右部分木です。中抜きの葉は多角形の辺です。'));
      const nodes = [], leaves = [], edges = []; let pos = 0, maxd = 0;
      const lay = (t, d, parent) => { if (!t) { const lf = { x: pos++, d }; leaves.push(lf); if (parent) edges.push([parent, lf]); maxd = Math.max(maxd, d); return lf; } const me = { d, t }; const l = lay(t.l, d + 1, me); me.x = pos++; nodes.push(me); lay(t.r, d + 1, me); if (parent) edges.push([parent, me]); maxd = Math.max(maxd, d); void l; return me; };
      lay(tree, 0, null);
      const tf = L.fig(B, { x: [-0.6, 2 * n + 0.6], y: [-maxd - 0.5, 0.6], aspect: 0.75, axes: false, grid: false, maxH: 300 });
      const ty = (d) => -d * 0.95;
      edges.forEach(([a, b]) => tf.seg([a.x, ty(a.d)], [b.x, ty(b.d)], { c: 'ink', w: 1.4, op: 0.75 }));
      leaves.forEach((lf) => tf.dot(lf.x, ty(lf.d), { c: 'muted', r: 3, hollow: true }));
      nodes.forEach((nd) => tf.dot(nd.x, ty(nd.d), { c: nd.t.open === selOpen ? 'hl' : 'c1', r: nd.t.open === selOpen ? 7 : 5 }));
      // triangulated polygon
      L.h('p', 'lab-cap', Cc, T(`The triangulated ${n + 2}-gon: the root triangle stands on the bottom side, and each node of the tree is one triangle.`, `三角形分割した ${n + 2} 角形：根の三角形が底辺の上に立ち、木の節点一つが三角形一つです。`));
      // vertex 0 at the bottom left, then clockwise up the left side, over the top, down to vertex m − 1 at the bottom right
      const m = n + 2, Q = L.seq(m, (i) => { const a = -Math.PI / 2 - Math.PI / m - (2 * Math.PI * i) / m; return [Math.cos(a), Math.sin(a)]; });
      const gf = L.fig(Cc, { x: [-1.25, 1.25], y: [-1.2, 1.25], equal: true, axes: false, grid: false, maxH: 300 });
      tris.forEach(({ tri, open }) => gf.poly(tri.map((i) => Q[i]), { c: open === selOpen ? 'hl' : 'c1', fill: open === selOpen ? 'hl' : 'c1', fo: open === selOpen ? 0.5 : 0.08 + 0.05 * (depth[open] % 3), w: 1.2 }));
      gf.poly(Q, { c: 'ink', w: 1.8 });
      gf.seg(Q[0], Q[m - 1], { c: 'ink', w: 3.4 });
      Q.forEach((p, i) => gf.text(p[0] * 1.13, p[1] * 1.13, String(i), { small: true, c: 'muted', dy: 4 }));
      L.legend(ctx.host, [{ c: 'c1', label: T('the object', '対象') }, { c: 'hl', label: T('the matched pair, its node and its triangle', '対応する組、その節点とその三角形') }]);
      const selTri = tris.find((t) => t.open === selOpen).tri;
      ctx.readout([
        { k: T('Catalan number', 'カタラン数'), v: `C${'₀₁₂₃₄₅₆₇'[n]} = ${C}`, tone: 'key' },
        { k: T('object', '対象'), v: T(`${idx + 1} of ${C}`, `${C} 個中 ${idx + 1} 番目`) },
        { k: T('word', '語'), v: w },
        { k: T('gold pair', '金色の組'), v: T(`steps ${selOpen + 1} and ${selClose + 1}`, `${selOpen + 1} 歩目と ${selClose + 1} 歩目`) },
        { k: T('gold triangle', '金色の三角形'), v: `(${selTri.join(', ')})`, tone: 'good' },
        { k: T('paths dipping below, C(2n, n+1)', '下へはみ出す経路 C(2n, n+1)'), v: String(badPaths(n)) },
      ], T(`Of the C(${2 * n}, ${n}) = ${binom(2 * n, n)} paths with ${n} ups and ${n} downs, the ${badPaths(n)} that dip below the axis are counted by reflecting them after their first dip, which leaves ${binom(2 * n, n)} − ${badPaths(n)} = ${C}.`, `上り ${n} 回と下り ${n} 回の C(${2 * n}, ${n}) = ${binom(2 * n, n)} 本の経路のうち、軸の下へはみ出す ${badPaths(n)} 本は最初のはみ出しの後を折り返して数えられ、残りは ${binom(2 * n, n)} − ${badPaths(n)} = ${C} 本です。`));
    },
  };

  /* ---------- 3. generating functions and their singularities ---------- */
  const NAMES = [['Fibonacci numbers', 'フィボナッチ数'], ['Catalan numbers', 'カタラン数'], ['Motzkin numbers', 'モツキン数'], ['derangements Dₙ/n!', '完全順列 Dₙ/n!'], ['partitions p(n)', '分割数 p(n)']];
  const GFTEX = ['z/(1 − z − z²)', '(1 − √(1 − 4z))/2z', '(1 − z − √(1 − 2z − 3z²))/2z²', 'e^(−z)/(1 − z)', '∏ 1/(1 − zᵏ)'];
  const PRED = ['1/√5', 'n⁻³ᐟ²/√π', '√(27/4π) n⁻³ᐟ²', '1/e', 'exp(π√(2n/3))/(4√3 n)'];
  const VIEW = [1.0, 0.6, 1.2, 1.6, 1.05], SLOPE = [0, -1.5, -1.5, 0, null];
  const frac = (x) => x - Math.floor(x);
  D['gf-asymptotics'] = {
    render(ctx, v) {
      const s = SEQS[v.seq], st = ctx.state, n = v.n, N = 100, R = VIEW[v.seq];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, v.seq === 4
        ? T(`The generating function ${GFTEX[4]}: hue is its argument, and the light and dark lines are a grid of constant modulus and constant argument. The grid crowds without limit towards every point of the unit circle, which is a natural boundary.`, `母関数 ${GFTEX[4]} です。色相が偏角で、明暗の線は絶対値が一定の線と偏角が一定の線の格子です。格子は単位円周のどの点へ向かっても限りなく密になり、単位円は自然境界です。`)
        : T(`The generating function ${GFTEX[v.seq]}: hue is its argument, and the light and dark lines are a grid of constant modulus and constant argument. Where the function is analytic the grid is made of little squares; at the singularities it pinches or tears. The dashed circle is the radius of convergence ρ = ${fmt(s.rho, 4)}, reaching the nearest singularity (gold).`, `母関数 ${GFTEX[v.seq]} です。色相が偏角で、明暗の線は絶対値が一定の線と偏角が一定の線の格子です。関数が正則な所では格子は小さな正方形でできており、特異点では縮んだり裂けたりします。破線の円は収束半径 ρ = ${fmt(s.rho, 4)} で、最も近い特異点（金）まで届きます。`));
      const cf = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, xlabel: 'Re z', ylabel: 'Im z', maxH: 420 });
      if (st.key !== v.seq) {
        const res = 150, img = new Array(res * res);
        for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) { const z = [-R + ((i + 0.5) * 2 * R) / res, R - ((j + 0.5) * 2 * R) / res], w = s.gf(z); img[j * res + i] = w && isFinite(w[0]) && isFinite(w[1]) ? [Math.atan2(w[1], w[0]), Math.hypot(w[0], w[1])] : null; }
        st.key = v.seq; st.img = img; st.res = res;
      }
      const pl = L.colours().plate;
      cf.raster((x, y) => {
        const i = Math.floor(((x + R) / (2 * R)) * st.res), j = Math.floor(((R - y) / (2 * R)) * st.res), c = st.img[clamp(j, 0, st.res - 1) * st.res + clamp(i, 0, st.res - 1)];
        if (!c) return pl;
        const base = L.cmaps.phase(c[0], 1.5), fm = frac(2 * Math.log2(Math.max(c[1], 1e-12))), fp = frac((c[0] + Math.PI) / (Math.PI / 6));
        const k = 0.62 + 0.38 * Math.pow(fm, 0.35) * Math.pow(fp, 0.35);
        return base.map((u, q) => 0.85 * u * k + 0.15 * pl[q]);
      }, { res: 2 });
      cf.circle(0, 0, s.rho, { c: 'ink', w: 2, dash: '6 4' });
      s.sing.forEach(([a, b], i) => { if (Math.abs(a) <= R) { cf.dot(a, b, { c: i ? 'ink' : 'hl', r: i ? 4.5 : 6.5 }); cf.text(a, b, `z = ${i ? fmt(a, 3) : ['1/φ', '1/4', '1/3', '1'][v.seq]}`, { small: true, c: 'ink', anchor: a > 0 && a < 0.7 * R ? 'start' : 'end', dx: a > 0 && a < 0.7 * R ? 10 : -10, dy: -12 }); } });
      // coefficients with the exponential growth divided out, on log-log axes
      const n0 = v.seq === 3 ? 2 : 1, ns = L.seq(N - n0 + 1, (i) => i + n0), as = ns.map((k) => s.coef(k)), ps = ns.map((k) => s.asym(k));
      const sc = (a, k) => Math.log10(a) + k * Math.log10(s.rho), ya = as.map((a, i) => sc(a, ns[i])), yp = ps.map((p, i) => sc(p, ns[i]));
      const lo = Math.min(...ya, ...yp), hi = Math.max(...ya, ...yp), pad = Math.max(0.25, 0.08 * (hi - lo));
      L.h('p', 'lab-cap', c2, v.seq === 4
        ? T('log p(n) against log n. With ρ = 1 there is no exponential factor to divide out, and the curve keeps bending upwards: p(n) grows faster than any power of n but slower than any exponential.', 'log n に対する log p(n) です。ρ = 1 なので割るべき指数因子はなく、曲線は上へ曲がり続けます。p(n) は n のどんなべきよりも速く、どんな指数関数よりも遅く増えます。')
        : T(`The coefficients with their exponential growth divided out, aₙρⁿ, on log–log axes (dots), against the prediction ${PRED[v.seq]} (dashed). What is left is the power of n set by the type of the singularity${SLOPE[v.seq] ? ': here a line of slope −3/2' : ': here a constant'}.`, `指数的な増大を割った係数 aₙρⁿ を両対数軸で（点）、予言 ${PRED[v.seq]}（破線）と比べます。残るのは特異点の型で決まる n のべきで${SLOPE[v.seq] ? '、ここでは傾き −3/2 の直線' : '、ここでは定数'}です。`));
      const g = L.fig(c2, { x: [0, 2.05], y: [lo - pad, hi + pad], aspect: 0.55, xlabel: 'n', ylabel: v.seq === 4 ? 'log₁₀ p(n)' : 'log₁₀ aₙρⁿ', maxH: 250, ticksX: [[0, '1'], [0.699, '5'], [1, '10'], [1.699, '50'], [2, '100']] });
      g.line(ns.map((k, i) => [Math.log10(k), yp[i]]), { c: 'c2', w: 2.2, dash: '6 4', layer: 'over' });
      let lastX = -1; ns.forEach((k, i) => { const x = Math.log10(k); if (k <= 10 || x - lastX >= 0.045) { g.dot(x, ya[i], { c: 'c1', r: 3, layer: 'main' }); lastX = x; } });
      g.vline(Math.log10(Math.max(n, n0)), { c: 'hl', w: 1.2, dash: '3 3', layer: 'under' });
      const ratio = as.map((a, i) => a / ps[i]), rlo = Math.min(0.8, ...ratio.slice(2)), rhi = Math.max(1.2, ...ratio.slice(2));
      L.h('p', 'lab-cap', c2, T('The ratio aₙ / prediction tends to 1. Drag the gold point along n.', '比 aₙ / 予言は 1 に近づきます。金色の点を n に沿ってドラッグしてください。'));
      const rf = L.fig(c2, { x: [0, N + 1], y: [rlo - 0.03, rhi + 0.03], aspect: 0.4, xlabel: 'n', ylabel: T('ratio', '比'), maxH: 190 });
      rf.hline(1, { c: 'c2', w: 1.4, dash: '6 4', layer: 'under' });
      rf.line(ns.map((k, i) => [k, clamp(ratio[i], rlo - 0.03, rhi + 0.03)]), { c: 'c1', w: 2 });
      const nn = Math.max(n, n0);
      rf.handle(nn, clamp(ratio[nn - n0], rlo - 0.03, rhi + 0.03), { c: 'hl', r: 7, axis: 'x', snap: 1, label: 'n', bounds: [n0, N, rlo, rhi], onDrag: (x) => ctx.set('n', Math.max(n0, Math.round(x))) });
      L.legend(ctx.host, [{ c: 'c1', kind: 'dot', label: T('coefficient aₙ', '係数 aₙ') }, { c: 'c2', dash: true, label: T('singularity prediction', '特異点からの予言') }, { c: 'ink', dash: true, label: T('radius of convergence', '収束半径') }]);
      const a = as[nn - n0], p = ps[nn - n0], r = a / p;
      ctx.readout([
        { k: T('sequence', '数列'), v: T(...NAMES[v.seq]), tone: 'key' },
        { k: 'n', v: String(nn) },
        { k: 'aₙ', v: v.seq === 3 ? fmt(a, 6) : big(a) },
        { k: T('prediction', '予言'), v: v.seq === 3 ? fmt(p, 6) : big(p) },
        { k: T('ratio', '比'), v: fmt(r, 6), tone: Math.abs(r - 1) < 0.01 ? 'good' : undefined },
        { k: T('growth 1/ρ', '増大率 1/ρ'), v: v.seq === 4 ? T('subexponential', '指数未満') : fmt(1 / s.rho, 5) },
      ], [
        T('A simple pole at 1/φ gives pure geometric growth, and the second pole at −φ is so far away that the error shrinks like (1/φ²)ⁿ: by n = 20 the prediction rounded is exact.', '1/φ の単純極は純粋な幾何級数的増大を与え、−φ にある第二の極は遠いので誤差は (1/φ²)ⁿ のように縮みます。n = 20 までに、予言を丸めると正確な値になります。'),
        T('A square-root branch point at 1/4 gives 4ⁿ times n⁻³ᐟ²: the exponent −3/2 comes from the power 1/2 in the singular part, through the binomial theorem. The ratio approaches 1 only like 1 − 9/8n.', '1/4 の平方根型分岐点は 4ⁿ に n⁻³ᐟ² を掛けたものを与えます。指数 −3/2 は特異部分の 1/2 乗から二項定理を通して出てきます。比は 1 − 9/8n のようにしか 1 に近づきません。'),
        T('The same square-root type at 1/3, so the same n⁻³ᐟ² correction to 3ⁿ. The other branch point at −1 is farther away and only adds a correction that alternates in sign and shrinks like (1/3)ⁿ.', '1/3 で同じ平方根型なので、3ⁿ への補正も同じ n⁻³ᐟ² です。−1 のもう一つの分岐点は遠く、符号が交互に変わり (1/3)ⁿ のように縮む補正を加えるだけです。'),
        T('A simple pole at 1, where the function behaves like e⁻¹/(1 − z): the fraction of permutations with no fixed point tends to 1/e, and since e⁻ᶻ is entire the error falls faster than any power, like 1/(n+1)!.', '1 での単純極で、関数はそこで e⁻¹/(1 − z) のようにふるまいます。固定点のない置換の割合は 1/e に近づき、e⁻ᶻ は整関数なので誤差はどんなべきよりも速く、1/(n+1)! のように減ります。'),
        T('No isolated singularity at all: the whole unit circle is a natural boundary. The saddle-point method near z = 1 gives Hardy and Ramanujan’s formula, and their full series with Rademacher’s correction gives p(n) exactly. The leading term alone is still 4.6% too high at n = 100.', '孤立特異点はまったくなく、単位円全体が自然境界です。z = 1 の近くでの鞍点法がハーディとラマヌジャンの式を与え、ラーデマッハーの補正を含む完全な級数は p(n) を正確に与えます。主要項だけでは n = 100 でもまだ 4.6% 大きすぎます。'),
      ][v.seq]);
    },
  };
})();
