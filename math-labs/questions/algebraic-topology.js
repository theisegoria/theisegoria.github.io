'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI;

  /* ---------- homology over the two-element field, from first principles ---------- */
  const rank2 = (M) => {
    if (!M.length || !M[0].length) return 0;
    const a = M.map((r) => r.slice()); let k = 0;
    for (let j = 0; j < a[0].length && k < a.length; j++) {
      const r = a.findIndex((row, i) => i >= k && row[j]); if (r < 0) continue;
      [a[k], a[r]] = [a[r], a[k]];
      for (let i = 0; i < a.length; i++) if (i !== k && a[i][j]) for (let q = j; q < a[i].length; q++) a[i][q] ^= a[k][q];
      k++;
    }
    return k;
  };
  const betti = (nv, E, F) => {
    const d1 = Array.from({ length: nv }, (_, i) => E.map((e) => Number(e.includes(i))));
    const d2 = E.map((e) => F.map((f) => Number(e.every((i) => f.includes(i)))));
    const r1 = rank2(d1), r2 = rank2(d2);
    return [nv - r1, E.length - r1 - r2, F.length - r2, r1, r2];
  };
  const VN = 'abcdefgh';
  const ename = (e) => VN[e[0]] + VN[e[1]];

  // the square of the experiment: stage s has edges ALL_E[0..min(5,s)) and faces ALL_F[0..s-5)
  const ALL_E = [[0, 1], [1, 2], [2, 3], [0, 3], [0, 2]], ALL_F = [[0, 1, 2], [0, 2, 3]];
  const stageCx = (s) => ({ E: ALL_E.slice(0, Math.min(5, s)), F: ALL_F.slice(0, Math.max(0, s - 5)) });

  Q.complex = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.int(4, 12), c = r.int(1, 3), cap = (V - c + 1) * (V - c) / 2, E = r.int(V - c, Math.min(cap, V - c + 4));
        return {
          q: [`A graph has $V = ${V}$ vertices, $E = ${E}$ edges and $${c}$ connected component${c > 1 ? 's' : ''}. How many independent cycles does it have ($\\beta_1$)?`, `頂点 $V = ${V}$、辺 $E = ${E}$、連結成分 $${c}$ 個のグラフがあります。独立な閉路はいくつありますか（$\\beta_1$）。`],
          a: { type: 'int', v: E - V + c },
          hint: ['With no faces, $\\beta_1 = E - \\operatorname{rank}\\partial_1$ and $\\operatorname{rank}\\partial_1 = V - \\beta_0$.', '面がなければ $\\beta_1 = E - \\operatorname{rank}\\partial_1$ で、$\\operatorname{rank}\\partial_1 = V - \\beta_0$ です。'],
          sol: [[`$\\operatorname{rank}\\partial_1 = V - \\beta_0 = ${V} - ${c} = ${V - c}$: a spanning forest needs that many edges.`, `$\\operatorname{rank}\\partial_1 = V - \\beta_0 = ${V} - ${c} = ${V - c}$ で、全域森にはちょうどこれだけの辺が必要です。`], [`$\\beta_1 = E - \\operatorname{rank}\\partial_1 = ${E} - ${V - c} = ${E - V + c}$: every edge beyond the forest closes one new cycle.`, `$\\beta_1 = E - \\operatorname{rank}\\partial_1 = ${E} - ${V - c} = ${E - V + c}$ です。森を超える辺は1本ごとに新しい閉路を1つ閉じます。`]],
        };
      }
      if (form === 1) {
        const s = r.int(0, 7), { E, F } = stageCx(s), b = betti(4, E, F);
        return {
          q: [`At stage $${s}$ of the construction (${E.length} edge${E.length === 1 ? '' : 's'}${F.length ? `, ${F.length} face${F.length > 1 ? 's' : ''}` : ''}), how many connected components are there ($\\beta_0$)?`, `構成の段階 $${s}$（辺 ${E.length} 本${F.length ? `、面 ${F.length} 枚` : ''}）では、連結成分はいくつありますか（$\\beta_0$）。`],
          a: { type: 'int', v: b[0] },
          hint: ['$\\beta_0 = V - \\operatorname{rank}\\partial_1$; faces play no part.', '$\\beta_0 = V - \\operatorname{rank}\\partial_1$ で、面は関係しません。'],
          sol: [[`The edges so far are ${E.length ? E.map((e) => `$${ename(e)}$`).join(', ') : 'none'}, and $\\operatorname{rank}\\partial_1 = ${b[3]}$.`, `ここまでの辺は ${E.length ? E.map((e) => `$${ename(e)}$`).join('、') : 'ありません'}で、$\\operatorname{rank}\\partial_1 = ${b[3]}$ です。`], [`$\\beta_0 = 4 - ${b[3]} = ${b[0]}$.`, `$\\beta_0 = 4 - ${b[3]} = ${b[0]}$ です。`]],
          set: { stage: s },
        };
      }
      const V = r.int(3, 9);
      return {
        q: [`A connected graph has $${V}$ vertices. What is the rank of its boundary matrix $\\partial_1$ over the two-element field?`, `頂点 $${V}$ 個の連結グラフがあります。2元体上の境界行列 $\\partial_1$ の階数はいくつですか。`],
        a: { type: 'int', v: V - 1 },
        hint: ['The kernel of $\\partial_0$ is everything; what does the image of $\\partial_1$ miss?', '$\\partial_0$ の核は全体です。$\\partial_1$ の像に入らないものは何でしょうか。'],
        sol: [['Each column of $\\partial_1$ has two ones, so every boundary has an even number of vertices: the image lies in the sums of an even number of vertices.', '$\\partial_1$ の各列には 1 が2つあるので、境界はどれも偶数個の頂点の和です。像は偶数個の頂点の和の中にあります。'], [`For a connected graph it is all of that subspace, which has dimension $${V} - 1 = ${V - 1}$. So $\\beta_0 = ${V} - ${V - 1} = 1$.`, `連結グラフでは像はその部分空間全体で、次元は $${V} - 1 = ${V - 1}$ です。よって $\\beta_0 = ${V} - ${V - 1} = 1$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.int(1, 7), { E, F } = stageCx(s), b = betti(4, E, F);
        return {
          q: [`At stage $${s}$ of the square (${E.length} edge${E.length === 1 ? '' : 's'}, ${F.length} face${F.length === 1 ? '' : 's'}), compute $\\beta_1 = E - \\operatorname{rank}\\partial_1 - \\operatorname{rank}\\partial_2$.`, `正方形の段階 $${s}$（辺 ${E.length} 本、面 ${F.length} 枚）で $\\beta_1 = E - \\operatorname{rank}\\partial_1 - \\operatorname{rank}\\partial_2$ を計算してください。`],
          a: { type: 'int', v: b[1] },
          hint: ['Count how many edges join different components (that is the rank of $\\partial_1$) and how many independent face boundaries there are.', '異なる成分をつなぐ辺の数（これが $\\partial_1$ の階数）と、独立な面の境界の数を数えます。'],
          sol: [[`$\\operatorname{rank}\\partial_1 = ${b[3]}$ and $\\operatorname{rank}\\partial_2 = ${b[4]}$.`, `$\\operatorname{rank}\\partial_1 = ${b[3]}$、$\\operatorname{rank}\\partial_2 = ${b[4]}$ です。`], [`$\\beta_1 = ${E.length} - ${b[3]} - ${b[4]} = ${b[1]}$.`, `$\\beta_1 = ${E.length} - ${b[3]} - ${b[4]} = ${b[1]}$ です。`], [b[1] ? `${b[1]} independent loop${b[1] > 1 ? 's' : ''} bound${b[1] > 1 ? '' : 's'} nothing yet.` : 'Every cycle is now a boundary: no holes.', b[1] ? `${b[1]} 個の独立なループがまだ何の境界にもなっていません。` : 'すべての閉路が境界になり、穴はありません。']],
          set: { stage: s },
        };
      }
      if (form === 1) {
        const nv = r.int(4, 6);
        const all = []; for (let i = 0; i < nv; i++) for (let j = i + 1; j < nv; j++) all.push([i, j]);
        const E = r.sample(all, r.int(nv - 1, Math.min(all.length, nv + 3))).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const b = betti(nv, E, []);
        return {
          q: [`The graph on vertices $${VN.slice(0, nv).split('').join(', ')}$ has edges $${E.map(ename).join(', ')}$. Find $(\\beta_0, \\beta_1)$.`, `頂点 $${VN.slice(0, nv).split('').join(', ')}$ のグラフの辺は $${E.map(ename).join(', ')}$ です。$(\\beta_0, \\beta_1)$ を求めてください。`],
          a: { type: 'tuple', v: [b[0], b[1]], labels: ['$\\beta_0$', '$\\beta_1$'], tol: 1e-9 },
          hint: ['Find the components first; then $\\beta_1 = E - V + \\beta_0$.', 'まず連結成分を求め、$\\beta_1 = E - V + \\beta_0$ を使います。'],
          sol: [[`Following the edges gives $\\beta_0 = ${b[0]}$ component${b[0] > 1 ? 's' : ''}, so $\\operatorname{rank}\\partial_1 = ${nv} - ${b[0]} = ${b[3]}$.`, `辺をたどると連結成分は $\\beta_0 = ${b[0]}$ 個で、$\\operatorname{rank}\\partial_1 = ${nv} - ${b[0]} = ${b[3]}$ です。`], [`$\\beta_1 = ${E.length} - ${b[3]} = ${b[1]}$.`, `$\\beta_1 = ${E.length} - ${b[3]} = ${b[1]}$ です。`]],
        };
      }
      const which = r.int(0, 2);
      const F = [[[0, 1, 2], [0, 2, 3]], [[0, 1, 2]], [[0, 1, 3], [1, 2, 3]]][which];
      const cnt = new Map(); F.forEach((t) => [[t[0], t[1]], [t[1], t[2]], [t[0], t[2]]].forEach((e) => { const k = ename(e); cnt.set(k, (cnt.get(k) || 0) + 1); }));
      const bd = [...cnt].filter(([, c]) => c % 2).map(([k]) => k).sort();
      return {
        q: [`Over the two-element field, how many edges are in the boundary of the 2-chain $${F.map((t) => t.map((i) => VN[i]).join('')).join(' + ')}$?`, `2元体上で、2-チェイン $${F.map((t) => t.map((i) => VN[i]).join('')).join(' + ')}$ の境界には何本の辺が含まれますか。`],
        a: { type: 'int', v: bd.length },
        hint: ['Add the boundaries of the faces; an edge shared by two faces appears twice and cancels.', '各面の境界を足します。2枚の面が共有する辺は2回現れて打ち消されます。'],
        sol: [[`The face boundaries contribute ${[...cnt].map(([k, c]) => `$${k}$${c > 1 ? ` (${c} times)` : ''}`).join(', ')}.`, `面の境界から ${[...cnt].map(([k, c]) => `$${k}$${c > 1 ? `（${c} 回）` : ''}`).join('、')} が出てきます。`], [`Mod 2 the boundary is $${bd.join(' + ')}$: ${bd.length} edges.${F.length === 2 ? ' The shared edge has cancelled, which is why two faces glued along an edge have a single loop as boundary.' : ''}`, `2を法として境界は $${bd.join(' + ')}$ で、辺は ${bd.length} 本です。${F.length === 2 ? '共有する辺は打ち消されます。辺で貼り合わせた2枚の面の境界が1つのループになるのはこのためです。' : ''}`]],
        set: which === 0 ? { stage: 7 } : which === 1 ? { stage: 6 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 4), nv = 4;
        const all = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]], tris = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]].slice(0, k);
        const b = betti(nv, all, tris);
        return {
          q: [`Take the complete graph on four vertices and fill $${k}$ of its four triangles. Find $(\\beta_0, \\beta_1, \\beta_2)$ over the two-element field.`, `4頂点の完全グラフをとり、4枚の三角形のうち $${k}$ 枚を埋めます。2元体上で $(\\beta_0, \\beta_1, \\beta_2)$ を求めてください。`],
          a: { type: 'tuple', v: [b[0], b[1], b[2]], labels: ['$\\beta_0$', '$\\beta_1$', '$\\beta_2$'], tol: 1e-9 },
          hint: ['$K_4$ alone has $\\beta_1 = 6 - 3 = 3$. Each filled triangle kills a cycle, unless its boundary is already a sum of the others.', '$K_4$ だけなら $\\beta_1 = 6 - 3 = 3$ です。埋めた三角形は1つずつ閉路を消しますが、その境界がすでに他の和になっていれば別です。'],
          sol: [[`$\\operatorname{rank}\\partial_1 = 3$, and the ${k} triangle boundar${k > 1 ? 'ies have' : 'y has'} rank $${b[4]}$${k === 4 ? ': the four boundaries sum to zero mod 2, so only three are independent' : ''}.`, `$\\operatorname{rank}\\partial_1 = 3$ で、${k} 枚の三角形の境界の階数は $${b[4]}$ です${k === 4 ? '。4つの境界の和は2を法として 0 なので、独立なのは3つだけです' : ''}。`], [`$\\beta_1 = 6 - 3 - ${b[4]} = ${b[1]}$ and $\\beta_2 = ${k} - ${b[4]} = ${b[2]}$.`, `$\\beta_1 = 6 - 3 - ${b[4]} = ${b[1]}$、$\\beta_2 = ${k} - ${b[4]} = ${b[2]}$ です。`], [k === 4 ? 'All four faces make the hollow tetrahedron, a sphere: the dependency among the faces is the enclosed void, $\\beta_2 = 1$.' : `Check: $\\chi = 4 - 6 + ${k} = ${4 - 6 + k} = ${b[0]} - ${b[1]} + ${b[2]}$.`, k === 4 ? '4枚すべてで中空の四面体、つまり球面になります。面どうしの従属関係が囲まれた空洞 $\\beta_2 = 1$ です。' : `確認：$\\chi = 4 - 6 + ${k} = ${4 - 6 + k} = ${b[0]} - ${b[1]} + ${b[2]}$。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['Write $\\beta_1$ of the complete graph $K_n$ (no faces) as a function of $n$.', '完全グラフ $K_n$（面なし）の $\\beta_1$ を $n$ の関数で表してください。'],
          a: { type: 'expr', v: '(n-1)*(n-2)/2', vars: ['n'], dom: { n: [3, 12] }, lhs: ['$\\beta_1(K_n) =$', '$\\beta_1(K_n) =$'] },
          hint: ['$K_n$ has $n(n-1)/2$ edges and is connected.', '$K_n$ は辺を $n(n-1)/2$ 本もち、連結です。'],
          sol: [['$\\beta_1 = E - V + \\beta_0 = \\tfrac{n(n-1)}{2} - n + 1$.', '$\\beta_1 = E - V + \\beta_0 = \\tfrac{n(n-1)}{2} - n + 1$ です。'], ['This simplifies to $\\tfrac{(n-1)(n-2)}{2}$: the edges among the $n - 1$ vertices other than a hub, each closing a triangle with the hub.', '整理すると $\\tfrac{(n-1)(n-2)}{2}$ です。中心の1頂点以外の $n - 1$ 頂点どうしを結ぶ辺が、それぞれ中心と三角形を閉じます。'], ['In a Vietoris–Rips filtration all of these cycles are born, and almost all are filled by triangles at once; persistence is what tells the few long-lived ones apart.', 'ヴィートリス・リップスのフィルトレーションではこれらの閉路がすべて生まれ、ほとんどはすぐに三角形で埋まります。少数の長く生き残るものを見分けるのがパーシステンスです。']],
        };
      }
      const s = r.int(1, 7), prev = stageCx(s - 1), cur = stageCx(s), b0 = betti(4, prev.E, prev.F), b1 = betti(4, cur.E, cur.F);
      const added = s <= 5 ? `the edge $${ename(ALL_E[s - 1])}$` : `the face $${ALL_F[s - 6].map((i) => VN[i]).join('')}$`;
      const addedJ = s <= 5 ? `辺 $${ename(ALL_E[s - 1])}$` : `面 $${ALL_F[s - 6].map((i) => VN[i]).join('')}$`;
      const opts = [['$\\beta_0$ drops by one', '$\\beta_0$ が1減る'], ['$\\beta_1$ rises by one', '$\\beta_1$ が1増える'], ['$\\beta_1$ drops by one', '$\\beta_1$ が1減る'], ['$\\beta_2$ rises by one', '$\\beta_2$ が1増える']];
      const ans = b1[0] < b0[0] ? 0 : b1[1] > b0[1] ? 1 : b1[1] < b0[1] ? 2 : 3;
      return {
        q: [`Going from stage $${s - 1}$ to stage $${s}$ adds ${added}. What happens to the Betti numbers?`, `段階 $${s - 1}$ から段階 $${s}$ へ進むと${addedJ}が加わります。ベッチ数はどう変わりますか。`],
        a: { type: 'choice', opts, v: ans, fixed: true },
        hint: ['A new $k$-simplex either raises $\\operatorname{rank}\\partial_k$ (it kills a $(k-1)$-cycle) or creates a new $k$-cycle. Never both.', '新しい $k$ 単体は、$\\operatorname{rank}\\partial_k$ を上げる（$(k-1)$ 次の閉路を消す）か、新しい $k$ 次の閉路を作るかのどちらかで、両方は起きません。'],
        sol: [[`Before: $(\\beta_0, \\beta_1, \\beta_2) = (${b0.slice(0, 3).join(', ')})$. After: $(${b1.slice(0, 3).join(', ')})$.`, `前：$(\\beta_0, \\beta_1, \\beta_2) = (${b0.slice(0, 3).join(', ')})$。後：$(${b1.slice(0, 3).join(', ')})$ です。`], [[`The boundary of the new edge joins two different components, so $\\operatorname{rank}\\partial_1$ rises and $\\beta_0$ drops.`, `The new edge's endpoints are already connected, so it closes a cycle and $\\beta_1$ rises.`, `The new face's boundary was a cycle that bounded nothing; now it is a boundary and $\\beta_1$ drops.`, 'The face boundary was already a boundary, so a 2-cycle appears.'][ans], [`新しい辺の境界は異なる2つの成分をつなぐので、$\\operatorname{rank}\\partial_1$ が上がり $\\beta_0$ が減ります。`, '新しい辺の両端はすでにつながっているので閉路が閉じ、$\\beta_1$ が増えます。', '新しい面の境界は何の境界でもない閉路でしたが、境界になったので $\\beta_1$ が減ります。', '面の境界はすでに境界だったので、2次元のサイクルが現れます。'][ans]]],
        set: { stage: s },
      };
    },
  ];

  /* ---------- 2. persistence ---------- */
  function persistence(pts) {
    const m = pts.length, d = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    const S = [];
    for (let i = 0; i < m; i++) S.push({ v: 0, dim: 0, key: `${i}`, verts: [i] });
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) S.push({ v: d(i, j), dim: 1, key: `${i},${j}`, verts: [i, j] });
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) for (let k = j + 1; k < m; k++) S.push({ v: Math.max(d(i, j), d(i, k), d(j, k)), dim: 2, key: `${i},${j},${k}`, verts: [i, j, k] });
    S.sort((a, b) => a.v - b.v || a.dim - b.dim);
    const idx = new Map(S.map((s, i) => [s.key, i]));
    const cols = S.map((s) => (s.dim === 0 ? [] : s.dim === 1 ? [idx.get(`${s.verts[0]}`), idx.get(`${s.verts[1]}`)] : [idx.get(`${s.verts[0]},${s.verts[1]}`), idx.get(`${s.verts[0]},${s.verts[2]}`), idx.get(`${s.verts[1]},${s.verts[2]}`)]).sort((a, b) => a - b));
    const low = new Map(), bars = [], paired = new Set();
    for (let j = 0; j < S.length; j++) {
      let c = cols[j];
      while (c.length && low.has(c[c.length - 1])) { const o = cols[low.get(c[c.length - 1])], s = new Set(c); o.forEach((x) => (s.has(x) ? s.delete(x) : s.add(x))); c = [...s].sort((a, b) => a - b); }
      cols[j] = c;
      if (c.length) { const i = c[c.length - 1]; low.set(i, j); paired.add(i); paired.add(j); if (S[j].v - S[i].v > 1e-9) bars.push({ dim: S[i].dim, b: S[i].v, d: S[j].v }); }
    }
    S.forEach((s, i) => { if (!paired.has(i) && s.dim === 0) bars.push({ dim: 0, b: 0, d: Infinity }); });
    return bars;
  }
  const ngon = (m) => Array.from({ length: m }, (_, i) => [Math.cos(2 * PI * i / m), Math.sin(2 * PI * i / m)]);
  const chord = (m, k) => 2 * Math.sin(k * PI / m);
  const upStep = (x) => Math.min(2.1, Math.ceil((x + 1e-9) / 0.05) * 0.05);
  const cxAt = (pts, eps) => {
    const m = pts.length, d = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]), E = [], F = [];
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) if (d(i, j) <= eps + 1e-9) E.push([i, j]);
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) for (let k = j + 1; k < m; k++) if (d(i, j) <= eps + 1e-9 && d(i, k) <= eps + 1e-9 && d(j, k) <= eps + 1e-9) F.push([i, j, k]);
    return { E, F, b: betti(m, E, F) };
  };
  Q.filtration = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(5, 12), dd = chord(m, 1);
        return {
          q: [`$${m}$ points sit evenly on the unit circle. At which threshold $\\varepsilon$ do neighbouring points first get joined by an edge?`, `$${m}$ 個の点が単位円上に等間隔に並んでいます。隣どうしの点が初めて辺で結ばれる閾値 $\\varepsilon$ はいくつですか。`],
          a: { type: 'num', v: dd, tol: 0.002 },
          hint: ['Disks of diameter $\\varepsilon$ touch when the distance between centres is $\\varepsilon$.', '直径 $\\varepsilon$ の円板は、中心間の距離が $\\varepsilon$ のときに触れ合います。'],
          sol: [[`Neighbours subtend $2\\pi/${m}$ at the centre, so their distance is the chord $2\\sin(\\pi/${m}) = ${n(dd, 4)}$.`, `隣どうしの点は中心角 $2\\pi/${m}$ をなすので、距離は弦の長さ $2\\sin(\\pi/${m}) = ${n(dd, 4)}$ です。`], [`At $\\varepsilon = ${n(dd, 3)}$ all $${m}$ edges appear at once: the components merge and a loop is born.`, `$\\varepsilon = ${n(dd, 3)}$ で $${m}$ 本の辺が一斉に現れ、連結成分が合流してループが生まれます。`]],
          set: m === 8 ? { eps: upStep(dd) } : undefined,
        };
      }
      if (form === 1) {
        const m = r.int(4, 12);
        return {
          q: [`A cloud of $${m}$ distinct points is filtered by the Vietoris–Rips complex. How many $H_0$ bars does the barcode have, counting the one that never dies?`, `相異なる $${m}$ 点の点群をヴィートリス・リップス複体でフィルトレーションします。決して消えない1本も含め、$H_0$ のバーは何本ありますか。`],
          a: { type: 'int', v: m },
          hint: ['At $\\varepsilon = 0$ every point is its own component.', '$\\varepsilon = 0$ では各点がそれぞれ1つの連結成分です。'],
          sol: [[`Each of the $${m}$ points is born as a component at $\\varepsilon = 0$, so there are $${m}$ bars.`, `$${m}$ 個の点はどれも $\\varepsilon = 0$ で連結成分として生まれるので、バーは $${m}$ 本です。`], [`$${m - 1}$ of them die as edges merge components; the last lives forever because the cloud is eventually connected.`, `そのうち $${m - 1}$ 本は辺が成分を合流させるときに消え、最後の1本は点群が最終的に連結になるので永遠に生き残ります。`]],
        };
      }
      const eps = r.step(0.1, 2.1, 0.05), { E, b } = cxAt(ngon(8), eps);
      return {
        q: [`For the figure's starting cloud (eight points evenly on the unit circle) at $\\varepsilon = ${n(eps)}$, how many edges does the complex have?`, `図の最初の点群（単位円上に等間隔の8点）で $\\varepsilon = ${n(eps)}$ のとき、複体の辺は何本ですか。`],
        a: { type: 'int', v: E.length },
        hint: ['The possible distances are the chords $2\\sin(k\\pi/8)$ for $k = 1, 2, 3, 4$; there are $8$ pairs at each of $k = 1, 2, 3$ and $4$ at $k = 4$.', '距離は弦 $2\\sin(k\\pi/8)$（$k = 1, 2, 3, 4$）で、$k = 1, 2, 3$ ではそれぞれ $8$ 組、$k = 4$ では $4$ 組です。'],
        sol: [[`Chords: $${[1, 2, 3, 4].map((k) => n(chord(8, k), 3)).join(', ')}$. Those $\\le ${n(eps)}$ are present.`, `弦の長さは $${[1, 2, 3, 4].map((k) => n(chord(8, k), 3)).join(', ')}$ で、$${n(eps)}$ 以下のものが存在します。`], [`That gives $${E.length}$ edges, with $\\beta_0 = ${b[0]}$ and $\\beta_1 = ${b[1]}$.`, `辺は $${E.length}$ 本で、$\\beta_0 = ${b[0]}$、$\\beta_1 = ${b[1]}$ です。`]],
        set: { eps },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const eps = r.pick([0.3, 0.8, 1, 1.2, 1.5, 1.8, 1.85, 1.9, 2]), { b, F } = cxAt(ngon(8), eps);
        return {
          q: [`Eight points evenly on the unit circle, at threshold $\\varepsilon = ${n(eps)}$. Find $(\\beta_0, \\beta_1)$.`, `単位円上に等間隔の8点で、閾値 $\\varepsilon = ${n(eps)}$ のとき $(\\beta_0, \\beta_1)$ を求めてください。`],
          a: { type: 'tuple', v: [b[0], b[1]], labels: ['$\\beta_0$', '$\\beta_1$'], tol: 1e-9 },
          hint: ['Compare $\\varepsilon$ with the chords $0.765$, $1.414$, $1.848$, $2$. The octagon\'s loop is filled once triangles through every third point exist.', '$\\varepsilon$ を弦の長さ $0.765$、$1.414$、$1.848$、$2$ と比べます。3つおきの点を通る三角形ができると八角形のループは埋まります。'],
          sol: [[eps < chord(8, 1) ? 'Below the first chord there are no edges: eight separate points.' : `Edges up to length $${n(eps)}$ connect all eight points, and there are $${F.length}$ filled triangles.`, eps < chord(8, 1) ? '最初の弦より小さいので辺はなく、8つの孤立点です。' : `長さ $${n(eps)}$ までの辺で8点はすべてつながり、埋まった三角形は $${F.length}$ 枚です。`], [`Reducing the boundary matrices gives $\\beta_0 = ${b[0]}$, $\\beta_1 = ${b[1]}$.${b[1] ? ' The loop around the circle is still open.' : ''}`, `境界行列を簡約すると $\\beta_0 = ${b[0]}$、$\\beta_1 = ${b[1]}$ です。${b[1] ? '円を一周するループはまだ埋まっていません。' : ''}`]],
          set: { eps },
        };
      }
      const a = r.pick([0.4, 0.5, 0.6, 0.8, 1]), bb = r.pick([0.6, 0.8, 1, 1.2, 1.5].filter((x) => x > a)), dg = Math.hypot(a, bb);
      return {
        q: [`Four points form an $${a} \\times ${bb}$ rectangle. Over which interval $[\\text{birth}, \\text{death})$ of $\\varepsilon$ does its $H_1$ bar live?`, `4点が $${a} \\times ${bb}$ の長方形をなしています。その $H_1$ のバーは $\\varepsilon$ のどの区間 $[\\text{誕生}, \\text{消滅})$ に存在しますか。`],
        a: { type: 'tuple', v: [bb, dg], labels: [['birth', '誕生'], ['death', '消滅']], tol: 0.002 },
        hint: ['The loop closes when the last side appears; triangles need a diagonal.', 'ループは最後の辺が現れたときに閉じます。三角形には対角線が必要です。'],
        sol: [[`At $\\varepsilon = ${a}$ the short sides join the points in pairs; at $\\varepsilon = ${bb}$ the long sides close the rectangle: the loop is born.`, `$\\varepsilon = ${a}$ で短い辺が点を2つずつ結び、$\\varepsilon = ${bb}$ で長い辺が長方形を閉じてループが生まれます。`], [`Triangles need a diagonal, of length $\\sqrt{${a}^2 + ${bb}^2} = ${n(dg, 4)}$; then both diagonals and all four triangles fill the loop at once.`, `三角形には長さ $\\sqrt{${a}^2 + ${bb}^2} = ${n(dg, 4)}$ の対角線が必要で、そのとき2本の対角線と4枚の三角形がループを一度に埋めます。`], [`The bar is $[${bb}, ${n(dg, 3)})$; its length $${n(dg - bb, 3)}$ measures how round the hole is.`, `バーは $[${bb}, ${n(dg, 3)})$ で、長さ $${n(dg - bb, 3)}$ は穴の丸さを表します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const m = r.int(5, 10), bars = persistence(ngon(m)).filter((x) => x.dim === 1).sort((x, y) => (y.d - y.b) - (x.d - x.b)), top = bars[0];
        return {
          q: [`$${m}$ points sit evenly on the unit circle. The Vietoris–Rips filtration has one long $H_1$ bar. At which $\\varepsilon$ does it die?`, `$${m}$ 個の点が単位円上に等間隔に並んでいます。ヴィートリス・リップスのフィルトレーションには長い $H_1$ のバーが1本あります。それは $\\varepsilon$ がいくつで消えますか。`],
          a: { type: 'num', v: top.d, tol: 0.002 },
          hint: ['The loop dies when triangles can wrap all the way round: their sides must span at least a third of the circle.', '三角形が円を一周して覆えるようになるとループは消えます。三角形の辺が円の3分の1以上にわたる必要があります。'],
          sol: [[`The bar is born at the neighbour chord $2\\sin(\\pi/${m}) = ${n(top.b, 4)}$.`, `バーは隣どうしの弦 $2\\sin(\\pi/${m}) = ${n(top.b, 4)}$ で生まれます。`], [`Reducing the boundary matrix over the two-element field, the loop's class is killed by a triangle at $\\varepsilon = ${n(top.d, 4)} = 2\\sin(${Math.round(Math.asin(top.d / 2) * m / PI)}\\pi/${m})$, the first chord to span at least a third of the circle, when triangles that surround the centre appear.`, `2元体上で境界行列を簡約すると、ループの類は $\\varepsilon = ${n(top.d, 4)} = 2\\sin(${Math.round(Math.asin(top.d / 2) * m / PI)}\\pi/${m})$ で三角形により消されます。円の3分の1以上にわたる最初の弦の長さで、中心を囲む三角形が現れるときです。`], ['Long bars like this one are the signal; the circle is detected from a finite sample.', 'このような長いバーが信号で、有限個の標本から円が検出されます。']],
          set: m === 8 ? { eps: upStep(top.d) } : undefined,
        };
      }
      const xs = [0]; const k = r.int(4, 6);
      for (let i = 1; i < k; i++) xs.push(Number((xs[i - 1] + r.pick([0.1, 0.2, 0.3, 0.5, 0.8, 1.2])).toFixed(2)));
      const gaps = xs.slice(1).map((x, i) => Number((x - xs[i]).toFixed(2)));
      const G = Math.max(...gaps);
      return {
        q: [`Points on a line at $x = ${xs.join(', ')}$. What is the death time of the longest finite $H_0$ bar?`, `直線上の点 $x = ${xs.join(', ')}$ があります。有限な $H_0$ のバーのうち最も長いものが消える時刻はいくつですか。`],
        a: { type: 'num', v: G, tol: 1e-3 },
        hint: ['Components merge along the shortest available edges: here, the gaps between neighbours.', '連結成分は利用できる最短の辺に沿って合流します。ここでは隣どうしの間隔です。'],
        sol: [[`The gaps are $${gaps.join(', ')}$; each $H_0$ bar dies when its gap is bridged.`, `間隔は $${gaps.join(', ')}$ で、各 $H_0$ のバーはその間隔が橋渡しされたときに消えます。`], [`The last merge happens at the largest gap, $${G}$: the barcode's longest finite $H_0$ bar measures the widest split in the data.`, `最後の合流は最大の間隔 $${G}$ で起こります。最も長い有限な $H_0$ のバーは、データの最も大きな切れ目を測ります。`]],
      };
    },
  ];

  /* ---------- 3. Euler characteristic ---------- */
  const POLY = [['cube', '立方体', 8, 12, 6], ['octahedron', '正八面体', 6, 12, 8], ['icosahedron', '正二十面体', 12, 30, 20], ['dodecahedron', '正十二面体', 20, 30, 12], ['triangular prism', '三角柱', 6, 9, 5], ['square pyramid', '四角錐', 5, 8, 5], ['pentagonal prism', '五角柱', 10, 15, 7]];
  const SURF = [['a disk', '円板', [1, 0, 0], 0], ['a sphere', '球面', [1, 0, 1], 1], ['an annulus', '円環', [1, 1, 0], 2], ['a torus', 'トーラス', [1, 2, 1], 3], ['a genus-2 surface', '種数2の曲面', [1, 4, 1], -1], ['a Möbius band', 'メビウスの帯', [1, 1, 0], -1]];
  Q.euler = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [en, ja, V, E, F] = r.pick(POLY);
        return {
          q: [`The surface of a ${en} has $V = ${V}$, $E = ${E}$, $F = ${F}$. What is its Euler characteristic?`, `${ja}の表面は $V = ${V}$、$E = ${E}$、$F = ${F}$ です。オイラー標数はいくつですか。`],
          a: { type: 'int', v: V - E + F },
          hint: ['$\\chi = V - E + F$, whatever shape the faces have.', '面の形によらず $\\chi = V - E + F$ です。'],
          sol: [[`$\\chi = ${V} - ${E} + ${F} = ${V - E + F}$.`, `$\\chi = ${V} - ${E} + ${F} = ${V - E + F}$ です。`], ['Every convex polyhedron is a sphere topologically, so it always gets $2$, the same as the tetrahedron in the figure.', '凸多面体はどれも位相的には球面なので、図の四面体と同じく必ず $2$ になります。']],
          set: { solid: 1 },
        };
      }
      if (form === 1) {
        const [en, ja, b, sv] = r.pick(SURF.slice(0, 5));
        return {
          q: [`The Betti numbers of ${en} are $(\\beta_0, \\beta_1, \\beta_2) = (${b.join(', ')})$. What is its Euler characteristic?`, `${ja}のベッチ数は $(\\beta_0, \\beta_1, \\beta_2) = (${b.join(', ')})$ です。オイラー標数はいくつですか。`],
          a: { type: 'int', v: b[0] - b[1] + b[2] },
          hint: ['Alternate the signs.', '符号を交互にとります。'],
          sol: [[`$\\chi = ${b[0]} - ${b[1]} + ${b[2]} = ${b[0] - b[1] + b[2]}$.`, `$\\chi = ${b[0]} - ${b[1]} + ${b[2]} = ${b[0] - b[1] + b[2]}$ です。`], ['Any triangulation gives the same $V - E + F$: the counts depend on the triangulation, the alternating sum does not.', 'どの三角形分割でも $V - E + F$ は同じです。個数は分割によりますが、交代和はよりません。']],
          set: sv >= 0 ? { solid: sv } : undefined,
        };
      }
      const which = r.int(0, 3), D = [[7, 12, 6], [4, 6, 4], [12, 24, 12], [9, 27, 18]][which];
      return {
        q: [`Count the finished ${['disk', 'sphere (tetrahedron surface)', 'annulus', '3 × 3 torus'][which]} in the figure: $(V, E, F)$?`, `図の完成した${['円板', '球面（四面体の表面）', '円環', '3 × 3 のトーラス'][which]}を数えてください。$(V, E, F)$ はいくつですか。`],
        a: { type: 'tuple', v: D, labels: ['$V$', '$E$', '$F$'], tol: 1e-9 },
        hint: [which === 3 ? 'Glued corners and sides count once.' : 'Count each shared edge once.', which === 3 ? '貼り合わせた角と辺は1回だけ数えます。' : '共有される辺は1回だけ数えます。'],
        sol: [[`$(V, E, F) = (${D.join(', ')})$.`, `$(V, E, F) = (${D.join(', ')})$ です。`], [`So $\\chi = ${D[0]} - ${D[1]} + ${D[2]} = ${D[0] - D[1] + D[2]}$.${which >= 1 && which !== 2 ? ' Each edge lies on exactly two triangles, so $3F = 2E$: the surface is closed.' : ''}`, `よって $\\chi = ${D[0]} - ${D[1]} + ${D[2]} = ${D[0] - D[1] + D[2]}$ です。${which >= 1 && which !== 2 ? '各辺はちょうど2枚の三角形に属するので $3F = 2E$ で、曲面は閉じています。' : ''}`]],
        set: { solid: which },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [chi, en, ja] = r.pick([[2, 'a sphere', '球面'], [0, 'a torus', 'トーラス'], [-2, 'a genus-2 surface', '種数2の曲面'], [1, 'a projective plane', '射影平面']]), V = r.int(Math.max(4, 7 - chi), 14);
        return {
          q: [`A triangulation of ${en} ($\\chi = ${chi}$) has $V = ${V}$ vertices. How many edges does it have?`, `${ja}（$\\chi = ${chi}$）の三角形分割の頂点が $V = ${V}$ 個です。辺は何本ありますか。`],
          a: { type: 'int', v: 3 * (V - chi) },
          hint: ['In a closed triangulated surface every edge borders exactly two triangles, so $3F = 2E$.', '閉じた三角形分割の曲面では各辺がちょうど2枚の三角形に接するので $3F = 2E$ です。'],
          sol: [['Put $F = \\tfrac23 E$ into $V - E + F = \\chi$: $V - \\tfrac13 E = \\chi$.', '$F = \\tfrac23 E$ を $V - E + F = \\chi$ に代入すると $V - \\tfrac13 E = \\chi$ です。'], [`$E = 3(V - \\chi) = 3(${V} - (${chi})) = ${3 * (V - chi)}$, and $F = ${2 * (V - chi)}$.`, `$E = 3(V - \\chi) = 3(${V} - (${chi})) = ${3 * (V - chi)}$、$F = ${2 * (V - chi)}$ です。`]],
          set: chi === 2 && V === 4 ? { solid: 1 } : chi === 0 && V === 9 ? { solid: 3 } : undefined,
        };
      }
      if (form === 1) {
        const m = r.int(1, 6), V = m === 6 ? 7 : m + 2, E = m === 6 ? 12 : 2 * m + 1, F = m;
        return {
          q: [`The hexagonal disk is built as a fan around its centre. After $${m}$ triangle${m > 1 ? 's' : ''} have been placed, what are $(V, E, F)$?`, `六角形の円板を中心のまわりの扇形として組み立てます。三角形を $${m}$ 枚置いた後の $(V, E, F)$ はいくつですか。`],
          a: { type: 'tuple', v: [V, E, F], labels: ['$V$', '$E$', '$F$'], tol: 1e-9 },
          hint: ['Each new triangle shares one edge with the last; the sixth shares two.', '新しい三角形は直前のものと1辺を共有します。6枚目は2辺を共有します。'],
          sol: [[m < 6 ? `The first triangle brings $3$ vertices and $3$ edges; each later one adds $1$ vertex and $2$ edges. So $V = ${V}$, $E = ${E}$, $F = ${F}$.` : 'The last triangle adds no vertex and only one edge, since it closes the fan: $V = 7$, $E = 12$, $F = 6$.', m < 6 ? `最初の三角形で頂点 $3$、辺 $3$、その後は1枚ごとに頂点 $1$、辺 $2$ が増えます。よって $V = ${V}$、$E = ${E}$、$F = ${F}$ です。` : '最後の三角形は扇を閉じるので、頂点は増えず辺は1本だけ増えます。$V = 7$、$E = 12$、$F = 6$ です。'], [`$\\chi = ${V} - ${E} + ${F} = 1$ at this stage, as at every stage: each step adds $(1, 2, 1)$ or $(0, 1, 1)$, which leave $V - E + F$ unchanged.`, `この段階でも $\\chi = ${V} - ${E} + ${F} = 1$ で、どの段階でも同じです。各手順で $(1, 2, 1)$ か $(0, 1, 1)$ が加わり、$V - E + F$ は変わりません。`]],
          set: { solid: 0 },
        };
      }
      const g = r.int(0, 5);
      return {
        q: [`A closed orientable surface of genus $${g}$ (a sphere with $${g}$ handle${g === 1 ? '' : 's'}) has $\\beta_0 = \\beta_2 = 1$. What is $\\beta_1$, and so $\\chi$? Give $\\chi$.`, `種数 $${g}$ の向き付け可能な閉曲面（$${g}$ 個の取っ手をつけた球面）では $\\beta_0 = \\beta_2 = 1$ です。$\\beta_1$ はいくつで、したがって $\\chi$ はいくつですか。$\\chi$ を答えてください。`],
        a: { type: 'int', v: 2 - 2 * g },
        hint: ['Each handle carries two independent loops: one around it and one through it.', '取っ手1つにつき独立なループが2つあります。取っ手を回るものと、取っ手をくぐるものです。'],
        sol: [[`$\\beta_1 = 2g = ${2 * g}$.`, `$\\beta_1 = 2g = ${2 * g}$ です。`], [`$\\chi = 1 - ${2 * g} + 1 = ${2 - 2 * g}$.${g === 0 ? ' The sphere in the figure.' : g === 1 ? ' The torus in the figure.' : ''}`, `$\\chi = 1 - ${2 * g} + 1 = ${2 - 2 * g}$ です。${g === 0 ? '図の球面です。' : g === 1 ? '図のトーラスです。' : ''}`]],
        set: g === 0 ? { solid: 1 } : g === 1 ? { solid: 3 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [chi, en, ja] = r.pick([[2, 'a sphere', '球面'], [0, 'a torus', 'トーラス'], [1, 'a projective plane', '射影平面'], [-2, 'a genus-2 surface', '種数2の曲面'], [-4, 'a genus-3 surface', '種数3の曲面']]);
        let V = 4; while (3 * (V - chi) > V * (V - 1) / 2 || V - chi <= 0) V++;
        return {
          q: [`In a triangulation every pair of vertices is joined by at most one edge, so $E \\le V(V - 1)/2$. What is the smallest $V \\ge 4$ this allows for ${en} ($\\chi = ${chi}$)?`, `三角形分割では2頂点を結ぶ辺は高々1本なので $E \\le V(V - 1)/2$ です。${ja}（$\\chi = ${chi}$）に対して、これが許す $V \\ge 4$ の最小値はいくつですか。`],
          a: { type: 'int', v: V },
          hint: ['Use $E = 3(V - \\chi)$ for a closed triangulated surface.', '閉じた三角形分割の曲面では $E = 3(V - \\chi)$ です。'],
          sol: [[`The condition is $3(V - ${chi < 0 ? `(${chi})` : chi}) \\le V(V - 1)/2$, that is $V^2 - 7V + 6\\chi \\ge 0$.`, `条件は $3(V - ${chi < 0 ? `(${chi})` : chi}) \\le V(V - 1)/2$、すなわち $V^2 - 7V + 6\\chi \\ge 0$ です。`], [`The smallest solution with $V \\ge 4$ is $V = ${V}$${chi === 0 ? ': the seven-vertex torus exists, so the bound is sharp. The figure\'s torus uses $9$.' : chi === 2 ? ': the tetrahedron in the figure.' : chi === -2 ? '; for genus two the true minimum is $10$, one of the rare cases where this bound is not reached.' : '.'}`, `$V \\ge 4$ での最小の解は $V = ${V}$ です${chi === 0 ? '。7頂点のトーラスが実在するので、この評価は最良です。図のトーラスは $9$ 個を使っています。' : chi === 2 ? '。図の四面体です。' : chi === -2 ? '。種数2では実際の最小値は $10$ で、この評価に届かない数少ない例外の1つです。' : '。'}`]],
          set: chi === 2 ? { solid: 1 } : chi === 0 ? { solid: 3 } : undefined,
        };
      }
      if (form === 1) {
        const k = r.int(1, 5), base = r.pick([[2, 'a sphere', '球面'], [0, 'a torus', 'トーラス']]);
        return {
          q: [`Cut $${k}$ ${k > 1 ? 'disjoint ' : ''}open disk${k > 1 ? 's' : ''} out of ${base[1]}. What is the Euler characteristic of what is left?`, `${base[2]}から${k > 1 ? '互いに交わらない' : ''}開円板を $${k}$ 枚切り取ります。残りのオイラー標数はいくつですか。`],
          a: { type: 'int', v: base[0] - k },
          hint: ['Triangulate so each disk is a single triangle: removing it deletes one face and nothing else.', '各円板がちょうど1枚の三角形になるように分割します。それを取り除くと面が1枚減るだけです。'],
          sol: [[`Removing an open triangle lowers $F$ by one and keeps $V$ and $E$, so $\\chi$ drops by $1$ per disk.`, `開いた三角形を取り除くと $V$ と $E$ はそのままで $F$ が1減るので、円板1枚ごとに $\\chi$ が $1$ 減ります。`], [`$\\chi = ${base[0]} - ${k} = ${base[0] - k}$.${base[0] === 2 && k === 1 ? ' A sphere minus a disk is a disk.' : base[0] === 2 && k === 2 ? ' A sphere minus two disks is an annulus.' : ''}`, `$\\chi = ${base[0]} - ${k} = ${base[0] - k}$ です。${base[0] === 2 && k === 1 ? '球面から円板を除くと円板です。' : base[0] === 2 && k === 2 ? '球面から円板を2枚除くと円環です。' : ''}`]],
          set: base[0] === 2 && k <= 2 ? { solid: k === 1 ? 0 : 2 } : undefined,
        };
      }
      const pick = r.int(0, 2);
      const cases = [
        { en: 'Glue two disks along their boundary circles.', ja: '2枚の円板を境界の円に沿って貼り合わせます。', parts: [1, 1], cut: 0, cutEn: 'a circle', cutJa: '円', ans: 2, what: ['a sphere', '球面'] },
        { en: 'Glue the two boundary circles of an annulus to each other.', ja: '円環の2つの境界円を互いに貼り合わせます。', parts: [0], cut: 0, cutEn: 'a circle', cutJa: '円', ans: 0, what: ['a torus (or a Klein bottle)', 'トーラス（またはクラインの壺）'] },
        { en: 'Join two tori by a tube: remove a disk from each and glue in an annulus.', ja: '2つのトーラスを管でつなぎます。それぞれから円板を除き、円環を貼り込みます。', parts: [-1, -1, 0], cut: 0, cutEn: 'two circles', cutJa: '2つの円', ans: -2, what: ['a genus-2 surface', '種数2の曲面'] },
      ][pick];
      return {
        q: [`${cases.en} What is the Euler characteristic of the result?`, `${cases.ja}結果のオイラー標数はいくつですか。`],
        a: { type: 'int', v: cases.ans },
        hint: ['$\\chi(A \\cup B) = \\chi(A) + \\chi(B) - \\chi(A \\cap B)$, and a circle has $\\chi = 0$.', '$\\chi(A \\cup B) = \\chi(A) + \\chi(B) - \\chi(A \\cap B)$ で、円の $\\chi$ は $0$ です。'],
        sol: [[`The pieces have $\\chi = ${cases.parts.join(', ')}$ and they meet in ${cases.cutEn}, with $\\chi = 0$.`, `部品の $\\chi$ は $${cases.parts.join(', ')}$ で、${cases.cutJa}（$\\chi = 0$）で交わります。`], [`So $\\chi = ${cases.parts.join(' + ').replace(/\+ -/g, '- ')} - 0 = ${cases.ans}$: ${cases.what[0]}.`, `よって $\\chi = ${cases.parts.join(' + ').replace(/\+ -/g, '- ')} - 0 = ${cases.ans}$ で、${cases.what[1]}です。`]],
        set: pick === 0 ? { solid: 1 } : undefined,
      };
    },
  ];
})();
