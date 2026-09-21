'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const H = () => window.MathLabs.homology; // homology over the two-element field, from the runtime
  const rank2 = (m) => window.MathLabs.rank2(m);
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const noStroke = (t) => { t.style.stroke = 'none'; return t; };
  const COMP = ['c1', 'c2', 'c3', 'c4'];
  const components = (nv, edges) => {
    const p = L.seq(nv, (i) => i), find = (i) => (p[i] === i ? i : (p[i] = find(p[i])));
    edges.forEach(([a, b]) => { p[find(a)] = find(b); });
    const roots = [...new Set(L.seq(nv, find))];
    return L.seq(nv, (i) => roots.indexOf(find(i)));
  };

  // A small 0/1 matrix drawn as a grid, with one highlighted column.
  function matrix(host, M, rows, cols, o = {}) {
    const r = rows.length, c = Math.max(1, cols.length);
    const f = fig(host, { axes: false, x: [0, c + 1.2], y: [0, r + 1.1], equal: true, maxH: o.maxH ?? 210, pad: { l: 4, r: 4, t: 4, b: 4 } });
    const cp = f.X(1) - f.X(0), sm = cp < 30;
    rows.forEach((nm, i) => noStroke(f.text(0.6, r - i - 0.5, nm, { dy: 4, small: sm, c: 'muted' })));
    cols.forEach((nm, j) => noStroke(f.text(1.7 + j, r + 0.55, nm, { dy: 4, small: sm, c: j === o.hot ? 'hl' : 'muted' })));
    if (!cols.length) noStroke(f.text(1.7, r / 2, T('(no columns yet)', '（列はまだありません）'), { small: true, c: 'muted', anchor: 'start', dy: 4 }));
    for (let i = 0; i < r; i++) for (let j = 0; j < cols.length; j++) {
      const one = M[i][j];
      f.rect(1.2 + j + 0.05, r - i - 1 + 0.05, 0.9, 0.9, { c: j === o.hot ? 'hl' : 'c1', fo: one ? (j === o.hot ? 0.75 : 0.45) : 0.04, w: 0.8, op: one ? 1 : 0.5, rx: 3 });
      noStroke(f.text(1.7 + j, r - i - 0.5, one ? '1' : '0', { dy: 4, small: sm, c: one ? 'ink' : 'muted' }));
    }
    f.seg([1.2, 0.02], [1.2, r], { c: 'muted', w: 1.2 });
    return f;
  }

  D.complex = {
    render(ctx, v) {
      const stage = Math.round(v.stage);
      const P = [[-1, -1], [1, -1], [1, 1], [-1, 1]], VN = ['a', 'b', 'c', 'd'];
      const ALL_E = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]], ALL_F = [[0, 1, 2], [0, 2, 3]];
      const nE = Math.min(5, stage), nF = Math.max(0, stage - 5);
      const edges = ALL_E.slice(0, nE), faces = ALL_F.slice(0, nF);
      const ename = (e) => VN[e[0]] + VN[e[1]], fname = (t) => t.map((i) => VN[i]).join('');
      const [b0, b1] = H()(4, edges, faces);
      const d1 = L.seq(4, (i) => edges.map((e) => Number(e.includes(i))));
      const d2 = edges.map((e) => faces.map((t) => Number(e.every((i) => t.includes(i)))));
      const r1 = rank2(d1), r2 = rank2(d2);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const added = stage === 0 ? T('four vertices', '4つの頂点') : stage <= 5 ? T(`edge ${ename(ALL_E[stage - 1])}`, `辺 ${ename(ALL_E[stage - 1])}`) : T(`face ${fname(ALL_F[stage - 6])}`, `面 ${fname(ALL_F[stage - 6])}`);
      L.h('p', 'lab-cap', c1, T(`Stage ${stage}: added ${added}`, `段階 ${stage}：${added}を追加`));
      const f = fig(c1, { axes: false, x: [-1.55, 1.55], y: [-1.5, 1.5], equal: true, maxH: 340 });
      faces.forEach((t, i) => f.poly(t.map((k) => P[k]), { c: 'c3', fo: stage === 6 + i ? 0.42 : 0.22, w: 0, layer: 'under' }));
      // representative cycles that are not boundaries
      const cyc = { 4: [[0, 1, 2, 3]], 5: [[0, 1, 4], [4, 2, 3]], 6: [[4, 2, 3]] }[stage] || [];
      cyc.forEach((cy, ci) => cy.forEach((ei) => { const [a, b] = ALL_E[ei]; f.line([P[a], P[b]], { c: ci ? 'c4' : 'hl', w: 9, op: 0.45, layer: 'under' }); }));
      const comp = components(4, edges);
      edges.forEach((e, i) => {
        const [a, b] = e;
        f.line([P[a], P[b]], { c: 'ink', w: i === stage - 1 ? 3.4 : 2.2 });
        const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2];
        const off = e[0] === 0 && e[1] === 2 ? [0.16, -0.12] : [m[0] * 0.14, m[1] * 0.14];
        noStroke(f.text(m[0] + off[0], m[1] + off[1], ename(e), { small: true, c: 'muted', dy: 4 }));
      });
      P.forEach((p, i) => { f.dot(p[0], p[1], { c: COMP[comp[i] % 4], r: 9 }); noStroke(f.text(p[0] * 1.2, p[1] * 1.2, VN[i], { math: true, dy: 5 })); });
      faces.forEach((t) => { const c = [0, 1].map((k) => t.reduce((s, i) => s + P[i][k], 0) / 3); noStroke(f.text(c[0], c[1], fname(t), { small: true, dy: 4 })); });
      L.h('p', 'lab-cap', c2, T(`∂₁: edges → vertices, rank ${r1}`, `∂₁：辺 → 頂点、階数 ${r1}`));
      matrix(c2, d1, VN, edges.map(ename), { hot: stage >= 1 && stage <= 5 ? stage - 1 : -1, maxH: 190 });
      L.h('p', 'lab-cap', c2, faces.length ? T(`∂₂: faces → edges, rank ${r2}`, `∂₂：面 → 辺、階数 ${r2}`) : T('∂₂: no faces yet, so rank ∂₂ = 0', '∂₂：面はまだないので rank ∂₂ = 0'));
      if (faces.length) matrix(c2, d2, edges.map(ename), faces.map(fname), { hot: stage >= 6 ? stage - 6 : -1, maxH: 230 });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('Vertices, coloured by component', '頂点（連結成分ごとに色分け）') }, { kind: 'fill', c: 'c3', label: T('Filled faces', '埋めた面') }].concat(cyc.length ? [{ c: 'hl', label: T('A cycle that bounds nothing', '何の境界でもない閉路') }] : []).concat(cyc.length > 1 ? [{ c: 'c4', label: T('A second independent cycle', '独立な2つ目の閉路') }] : []));
      ctx.readout([
        { k: 'β₀ = V − rank ∂₁', v: `4 − ${r1} = ${b0}`, tone: 'key' },
        { k: 'β₁ = E − rank ∂₁ − rank ∂₂', v: `${nE} − ${r1} − ${r2} = ${b1}`, tone: 'key' },
        { k: 'V, E, F', v: `4, ${nE}, ${nF}` },
      ], [T('Each new vertex is its own component.', '新しい頂点はそれぞれ別の連結成分です。'), T('The edge joins two components, so rank ∂₁ grows and β₀ drops.', '辺が2つの成分をつなぐので rank ∂₁ が増え、β₀ が減ります。'), T('The edge joins two components, so rank ∂₁ grows and β₀ drops.', '辺が2つの成分をつなぐので rank ∂₁ が増え、β₀ が減ります。'), T('The edge joins two components, so rank ∂₁ grows and β₀ drops.', '辺が2つの成分をつなぐので rank ∂₁ が増え、β₀ が減ります。'), T('This edge joins a component to itself: rank ∂₁ stays 3, and a cycle appears.', 'この辺は同じ成分どうしをつなぐので rank ∂₁ は3のままで、閉路が生まれます。'), T('The diagonal closes a second independent cycle.', '対角線が2つ目の独立な閉路を作ります。'), T('The face abc has boundary ab + bc + ac, so that cycle is now a boundary and β₁ drops.', '面 abc の境界は ab + bc + ac なので、その閉路は境界になり β₁ が減ります。'), T('The last face fills the remaining cycle: the square is a disk, with β₀ = 1 and β₁ = 0.', '最後の面が残りの閉路を埋めます。正方形は円板になり、β₀ = 1、β₁ = 0 です。')][stage]);
    },
  };

  // Persistent homology (H0 and H1) of the clique complex, by the standard column reduction over F2.
  function persistence(pts) {
    const n = pts.length, d = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    const S = [];
    for (let i = 0; i < n; i++) S.push({ v: 0, dim: 0, key: `${i}`, verts: [i] });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) S.push({ v: d(i, j), dim: 1, key: `${i},${j}`, verts: [i, j] });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) S.push({ v: Math.max(d(i, j), d(i, k), d(j, k)), dim: 2, key: `${i},${j},${k}`, verts: [i, j, k] });
    S.sort((a, b) => a.v - b.v || a.dim - b.dim);
    const idx = new Map(S.map((s, i) => [s.key, i]));
    const cols = S.map((s) => (s.dim === 0 ? [] : s.dim === 1 ? [idx.get(`${s.verts[0]}`), idx.get(`${s.verts[1]}`)] : [idx.get(`${s.verts[0]},${s.verts[1]}`), idx.get(`${s.verts[0]},${s.verts[2]}`), idx.get(`${s.verts[1]},${s.verts[2]}`)]).sort((a, b) => a - b));
    const lowOwner = new Map(), bars = [], paired = new Set();
    for (let j = 0; j < S.length; j++) {
      let c = cols[j];
      while (c.length && lowOwner.has(c[c.length - 1])) {
        const o = cols[lowOwner.get(c[c.length - 1])], s = new Set(c);
        o.forEach((x) => (s.has(x) ? s.delete(x) : s.add(x)));
        c = [...s].sort((a, b) => a - b);
      }
      cols[j] = c;
      if (c.length) { const i = c[c.length - 1]; lowOwner.set(i, j); paired.add(i); paired.add(j); if (S[j].v - S[i].v > 1e-9) bars.push({ dim: S[i].dim, b: S[i].v, d: S[j].v }); }
    }
    S.forEach((s, i) => { if (!paired.has(i) && s.dim === 0) bars.push({ dim: 0, b: 0, d: Infinity }); });
    return bars.filter((b) => b.dim <= 1).sort((a, b) => a.dim - b.dim || b.d - b.b - (a.d - a.b));
  }

  D.filtration = {
    render(ctx, v) {
      const st = ctx.state, eps = v.eps;
      st.pts ||= L.seq(8, (i) => [Math.cos(L.TAU * i / 8), Math.sin(L.TAU * i / 8)]);
      const pts = st.pts, n = pts.length, dd = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      const edges = [], faces = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (dd(i, j) <= eps + 1e-9) edges.push([i, j]);
      const has = (i, j) => dd(i, j) <= eps + 1e-9;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) if (has(i, j) && has(i, k) && has(j, k)) faces.push([i, j, k]);
      const [b0, b1] = H()(n, edges, faces);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The complex at threshold ε = ${fmt(eps, 2)}. Drag the points.`, `閾値 ε = ${fmt(eps, 2)} での複体。点はドラッグできます。`));
      const f = fig(c1, { axes: false, x: [-1.7, 1.7], y: [-1.6, 1.6], equal: true, maxH: 380 });
      pts.forEach((p) => f.circle(p[0], p[1], eps / 2, { c: 'c1', fill: true, fo: 0.06, w: 0.8, op: 0.5, layer: 'under' }));
      faces.forEach((t) => f.poly(t.map((i) => pts[i]), { c: 'c3', fo: 0.13, w: 0, layer: 'under' }));
      edges.forEach(([i, j]) => f.line([pts[i], pts[j]], { c: 'ink', w: 1.6, op: 0.8 }));
      pts.forEach((p, i) => f.handle(p[0], p[1], { c: 'c2', r: 7, label: T(`Point ${i + 1}`, `点 ${i + 1}`), bounds: [-1.6, 1.6, -1.5, 1.5], onDrag: (x, y) => { st.pts[i] = [x, y]; ctx.redraw(); } }));
      // barcode
      const bars = persistence(pts), XM = 2.2;
      L.h('p', 'lab-cap', c2, T('Barcode: each bar is a feature, from the ε where it is born to the ε where it dies.', 'バーコード：各バーは1つの特徴で、生まれる ε から消える ε まで伸びます。'));
      const nb = bars.length, g = fig(c2, { x: [0, XM], y: [-0.5, nb + 0.5], aspect: 0.95, maxH: 380, xlabel: 'ε', ticksY: [], grid: false });
      bars.forEach((b, k) => {
        const y = nb - 1 - k + 0.5;
        const end = Math.min(b.d, XM);
        const alive = b.b <= eps + 1e-9 && eps < b.d;
        g.line([[b.b, y], [end, y]], { c: b.dim ? 'c2' : 'c1', w: alive ? 6 : 4, op: alive ? 1 : 0.45 });
        if (b.d === Infinity) g.text(XM, y, '→ ∞', { anchor: 'end', small: true, dy: -6, c: 'c1' });
      });
      const h0 = bars.filter((b) => b.dim === 0).length;
      noStroke(g.text(0.02, nb - 0.5, 'H₀', { anchor: 'start', small: true, c: 'c1', dy: -6, dx: 2 }));
      if (h0 < nb) noStroke(g.text(0.02, nb - h0 - 0.5, 'H₁', { anchor: 'start', small: true, c: 'c2', dy: -6, dx: 2 }));
      if (h0 < nb) g.hline(nb - h0, { c: 'muted', w: 0.8, dash: '2 3' });
      g.vline(eps, { c: 'hl', w: 2, dash: false, layer: 'over' });
      g.text(eps, nb + 0.2, `ε`, { math: true, c: 'hl', dx: 8, anchor: 'start' });
      g.hover((x) => { if (x < 0) return null; const a0 = bars.filter((b) => !b.dim && b.b <= x && x < b.d).length, a1 = bars.filter((b) => b.dim && b.b <= x && x < b.d).length; return { x, text: `ε = ${fmt(x, 2)}: β₀ = ${a0}, β₁ = ${a1}` }; });
      L.legend(ctx.host, [{ c: 'c1', label: T('H₀ bars: components', 'H₀ のバー：連結成分') }, { c: 'c2', label: T('H₁ bars: loops', 'H₁ のバー：ループ') }, { c: 'hl', label: T('Current threshold, crossing β₀ + β₁ bars', '現在の閾値（β₀ + β₁ 本のバーと交わる）') }, { kind: 'fill', c: 'c3', label: T('Filled triangles', '埋めた三角形') }]);
      const alive1 = bars.filter((b) => b.dim === 1 && b.b <= eps + 1e-9 && eps < b.d).length;
      ctx.readout([
        { k: 'β₀', v: String(b0), tone: 'key' }, { k: 'β₁', v: String(b1), tone: 'key' },
        { k: T('edges, triangles', '辺、三角形'), v: `${edges.length}, ${faces.length}` },
        { k: T('H₁ bars crossing ε', 'ε と交わる H₁ のバー'), v: String(alive1), tone: alive1 === b1 ? 'good' : 'warn' },
      ], T('Long bars are robust features of the point cloud; short bars are noise. Only H₀ and H₁ are shown, since the complex is cut off at dimension two.', '長いバーは点群の頑健な特徴で、短いバーは雑音です。複体を2次元で打ち切っているので、H₀ と H₁ だけを示します。'));
    },
  };

  // Surfaces as lists of drawn triangles: each has three drawn points and the three vertex ids they represent.
  function surfaces() {
    const out = [];
    { // disk: hexagon with a centre
      const tri = [], P = [[0, 0]].concat(L.seq(6, (i) => [1.3 * Math.cos(L.TAU * i / 6), 1.3 * Math.sin(L.TAU * i / 6)]));
      for (let i = 0; i < 6; i++) { const a = 1 + i, b = 1 + (i + 1) % 6; tri.push({ ids: [0, a, b], pts: [P[0], P[a], P[b]] }); }
      out.push({ nv: 7, tri, vpts: P.map((p, i) => ({ id: i, p })) });
    }
    { // sphere: boundary of a tetrahedron, in perspective; vertex 2 is at the back
      const P = [[-1.25, -0.75], [1.25, -0.8], [0.3, -0.05], [-0.05, 1.3]];
      const T4 = [[0, 1, 3], [1, 2, 3], [0, 2, 3], [0, 1, 2]];
      out.push({ nv: 4, tri: T4.map((t) => ({ ids: t, pts: t.map((i) => P[i]) })), vpts: P.map((p, i) => ({ id: i, p })), back: 2 });
    }
    { // annulus
      const O = L.seq(6, (i) => [1.4 * Math.cos(L.TAU * i / 6), 1.4 * Math.sin(L.TAU * i / 6)]), I = L.seq(6, (i) => [0.62 * Math.cos(L.TAU * (i + 0.5) / 6), 0.62 * Math.sin(L.TAU * (i + 0.5) / 6)]);
      const tri = [];
      for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; tri.push({ ids: [i, j, 6 + i], pts: [O[i], O[j], I[i]] }); tri.push({ ids: [6 + i, j, 6 + j], pts: [I[i], O[j], I[j]] }); }
      out.push({ nv: 12, tri, vpts: O.map((p, i) => ({ id: i, p })).concat(I.map((p, i) => ({ id: 6 + i, p }))) });
    }
    { // torus: 3 by 3 grid on a square with opposite sides identified
      const s = 0.9, P = (i, j) => [(i - 1.5) * s, (j - 1.5) * s], id = (i, j) => (i % 3) + 3 * (j % 3);
      const tri = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        tri.push({ ids: [id(i, j), id(i + 1, j), id(i + 1, j + 1)], pts: [P(i, j), P(i + 1, j), P(i + 1, j + 1)] });
        tri.push({ ids: [id(i, j), id(i + 1, j + 1), id(i, j + 1)], pts: [P(i, j), P(i + 1, j + 1), P(i, j + 1)] });
      }
      const vpts = []; for (let j = 0; j <= 3; j++) for (let i = 0; i <= 3; i++) vpts.push({ id: id(i, j), p: P(i, j) });
      out.push({ nv: 9, tri, vpts, square: s * 1.5 });
    }
    return out;
  }

  D.euler = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const which = Math.round(v.solid), S = surfaces()[which];
      const names = [T('Disk', '円板'), T('Sphere (tetrahedron surface)', '球面（四面体の表面）'), T('Annulus', '円環'), T('Torus', 'トーラス')];
      // order the triangles so the surface grows through shared edges
      const ekey = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
      const order = [0], left = new Set(L.seq(S.tri.length - 1, (i) => i + 1));
      while (left.size) {
        const seenE = new Set(order.flatMap((k) => { const t = S.tri[k].ids; return [ekey(t[0], t[1]), ekey(t[1], t[2]), ekey(t[0], t[2])]; }));
        let pick = [...left].find((k) => { const t = S.tri[k].ids; return [ekey(t[0], t[1]), ekey(t[1], t[2]), ekey(t[0], t[2])].some((e) => seenE.has(e)); });
        if (pick === undefined) pick = [...left][0];
        order.push(pick); left.delete(pick);
      }
      const stats = (m) => {
        const tris = order.slice(0, m).map((k) => S.tri[k].ids);
        const vs = [...new Set(tris.flat())].sort((a, b) => a - b), map = new Map(vs.map((x, i) => [x, i]));
        const es = [...new Set(tris.flatMap((t) => [ekey(t[0], t[1]), ekey(t[1], t[2]), ekey(t[0], t[2])]))].map((s) => s.split(',').map((x) => map.get(Number(x))));
        const fs = tris.map((t) => t.map((x) => map.get(x)));
        const b = vs.length ? H()(vs.length, es, fs) : [0, 0, 0];
        return { V: vs.length, E: es.length, F: fs.length, b, vs: new Set(vs) };
      };
      const f = fig(ctx.host, { axes: false, x: [-1.75, 1.75], y: [-1.6, 1.6], equal: true, maxH: 380 });
      const capText = which === 3 ? T('The torus is drawn as a square whose opposite sides are glued in the direction of the arrows; the 16 drawn corners are only 9 vertices.', 'トーラスは、向かい合う辺を矢印の向きに貼り合わせた正方形として描いています。描いた16個の角は9個の頂点にすぎません。') : which === 1 ? T('Edges to the vertex at the back are dashed.', '奥の頂点へ向かう辺は破線です。') : '';
      if (capText) L.h('p', 'lab-cap', ctx.host, capText);
      if (S.square) { const q = S.square; f.poly([[-q, -q], [q, -q], [q, q], [-q, q]], { c: 'muted', fo: 0.03, w: 0, layer: 'under' }); }
      const drawTo = (m) => {
        f.clear('main'); f.clear('over');
        if (S.square) { /* re-add side arrows */ const q = S.square; const tick = (a, b, cc, k) => { const mm = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [(b[0] - a[0]), (b[1] - a[1])], l = Math.hypot(...d), u = [d[0] / l, d[1] / l]; for (let i = 0; i < k; i++) { const c0 = [mm[0] + u[0] * 0.13 * (i - (k - 1) / 2), mm[1] + u[1] * 0.13 * (i - (k - 1) / 2)]; f.arrow([c0[0] - u[0] * 0.12, c0[1] - u[1] * 0.12], [c0[0] + u[0] * 0.08, c0[1] + u[1] * 0.08], { c: cc, w: 2.4, layer: 'over' }); } }; for (const y of [-q, q]) tick([-q, y], [q, y], 'c2', 1); for (const x of [-q, q]) tick([x, -q], [x, q], 'c4', 2); }
        const shown = order.slice(0, m);
        shown.forEach((k, i) => f.poly(S.tri[k].pts, { c: i === m - 1 && m < S.tri.length ? 'hl' : 'c1', fo: i === m - 1 && m < S.tri.length ? 0.5 : S.back !== undefined ? 0.12 : 0.2, w: 0 }));
        const drawn = new Set();
        shown.forEach((k) => { const t = S.tri[k]; [[0, 1], [1, 2], [0, 2]].forEach(([a, b]) => { const key = t.pts[a].concat(t.pts[b]).map((x) => x.toFixed(3)).join(); const key2 = t.pts[b].concat(t.pts[a]).map((x) => x.toFixed(3)).join(); if (drawn.has(key) || drawn.has(key2)) return; drawn.add(key); const back = S.back !== undefined && (t.ids[a] === S.back || t.ids[b] === S.back); f.line([t.pts[a], t.pts[b]], { c: 'ink', w: 1.5, dash: back ? '5 4' : false, op: back ? 0.6 : 0.85 }); }); });
        const st = stats(m);
        S.vpts.forEach(({ id, p }) => { if (st.vs.has(id)) { f.dot(p[0], p[1], { c: 'c2', r: 5.5 }); if (S.square) f.text(p[0], p[1], String(id + 1), { small: true, dx: -9, dy: -6, c: 'muted' }); } });
        return st;
      };
      const put = (st, m) => {
        const chi = st.V - st.E + st.F, bchi = st.b[0] - st.b[1] + st.b[2];
        ctx.readout([
          { k: 'V − E + F', v: `${st.V} − ${st.E} + ${st.F} = ${chi}`, tone: 'key' },
          { k: 'β₀ − β₁ + β₂', v: `${st.b[0]} − ${st.b[1]} + ${st.b[2]} = ${bchi}`, tone: chi === bchi ? 'good' : 'warn' },
          { k: T('triangles placed', '置いた三角形'), v: `${m} / ${S.tri.length}` },
        ], m < S.tri.length ? T('The two alternating sums agree at every stage of the construction, not only at the end.', '2つの交代和は、完成時だけでなく構成のどの段階でも一致します。') : [T('One component and no holes: χ = 1.', '連結成分が1つで穴がないので χ = 1 です。'), T('The last face closes the surface and creates a 2-cycle: β₂ = 1, χ = 2.', '最後の面が曲面を閉じて2次元のサイクルを作り、β₂ = 1、χ = 2 になります。'), T('The loop around the hole gives β₁ = 1, so χ = 0.', '穴を回るループで β₁ = 1 となり、χ = 0 です。'), T('Two independent loops and one enclosed surface: 1 − 2 + 1 = 0. The annulus also has χ = 0, so χ alone does not tell surfaces apart.', '独立な2つのループと閉じた面が1つで 1 − 2 + 1 = 0 です。円環も χ = 0 なので、χ だけでは曲面を区別できません。')][which]);
      };
      const N = S.tri.length, STEP = 0.35, DUR = N * STEP + 0.2;
      let lastM = -1;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const m = Math.min(N, Math.floor(t / STEP) + 1);
        if (m !== lastM) { lastM = m; const st = drawTo(m); put(st, m); }
        label.textContent = m < N ? `${names[which]} · ${m} / ${N}` : '';
        return t < DUR;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Build it triangle by triangle', '三角形を1枚ずつ置く') });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('Faces', '面') }, { c: 'ink', label: T('Edges', '辺') }, { kind: 'dot', c: 'c2', label: T('Vertices', '頂点') }, { kind: 'fill', c: 'hl', label: T('Face just added', '追加したばかりの面') }].concat(S.square ? [{ c: 'c2', label: T('Sides glued: one arrow to one arrow, two to two', '貼り合わせる辺：矢印1本どうし、2本どうし') }] : []));
    },
  };
})();
