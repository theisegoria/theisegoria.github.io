'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/representation-theory.cjs) ---------- */
  // Dihedral group D_n: element index g in 0..2n-1; g < n is the rotation r^g, g >= n is the reflection s r^(g-n).
  // s is the reflection in the x-axis, r the rotation by 2 pi / n.
  const rot = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
  const mul2 = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  const S = [[1, 0], [0, -1]];
  const rho2 = (n, g) => (g < n ? rot((2 * Math.PI * g) / n) : mul2(S, rot((2 * Math.PI * (g - n)) / n)));
  // group law on indices: (s^a r^b)(s^c r^d) = s^(a+c) r^((-1)^c b + d)
  function dmul(n, g, h) { const a = g < n ? 0 : 1, b = g % n, c = h < n ? 0 : 1, d = h % n; const e = (((c ? -b : b) + d) % n + n) % n; return ((a + c) % 2) * n + e; }
  // action on vertex j (vertex j at angle 2 pi j / n)
  const vertexImage = (n, g, j) => (g < n ? (j + g) % n : (((-(j + (g - n))) % n) + n) % n);
  const permMatrix = (n, g) => { const P = L0.seq(n, () => new Array(n).fill(0)); for (let j = 0; j < n; j++) P[vertexImage(n, g, j)][j] = 1; return P; };
  const fixedPoints = (n, g) => { let c = 0; for (let j = 0; j < n; j++) if (vertexImage(n, g, j) === j) c++; return c; };
  const order = (n, g) => { let k = 1, h = g; while (h !== 0) { h = dmul(n, h, g); k++; } return k; };
  const L0 = { seq: (n, f) => Array.from({ length: n }, (_, i) => f(i)) };

  // character tables: classes with sizes, irreducible characters as complex [re, im]
  const W = [-0.5, Math.sqrt(3) / 2], W2 = [-0.5, -Math.sqrt(3) / 2], R = (x) => [x, 0];
  const TABLES = {
    S3: { order: 6, classes: ['e', '(12)', '(123)'], sizes: [1, 3, 2], irreps: [['trivial', [1, 1, 1]], ['sign', [1, -1, 1]], ['standard', [2, 0, -1]]],
      reps: { regular: [6, 0, 0], natural: [3, 1, 0], square: [4, 0, 1] }, natural: ['permuting 3 points', '3 点の置換'], square: ['standard ⊗ standard', '標準 ⊗ 標準'] },
    D4: { order: 8, classes: ['e', 'r²', 'r, r³', 's, sr²', 'sr, sr³'], sizes: [1, 1, 2, 2, 2], irreps: [['A₁', [1, 1, 1, 1, 1]], ['A₂', [1, 1, 1, -1, -1]], ['B₁', [1, 1, -1, 1, -1]], ['B₂', [1, 1, -1, -1, 1]], ['E', [2, -2, 0, 0, 0]]],
      reps: { regular: [8, 0, 0, 0, 0], natural: [4, 0, 0, 2, 0], square: [4, 4, 0, 0, 0] }, natural: ['permuting the 4 vertices of a square', '正方形の 4 頂点の置換'], square: ['E ⊗ E', 'E ⊗ E'] },
    Q8: { order: 8, classes: ['1', '−1', '±i', '±j', '±k'], sizes: [1, 1, 2, 2, 2], irreps: [['trivial', [1, 1, 1, 1, 1]], ['χᵢ', [1, 1, 1, -1, -1]], ['χⱼ', [1, 1, -1, 1, -1]], ['χₖ', [1, 1, -1, -1, 1]], ['2-dim', [2, -2, 0, 0, 0]]],
      reps: { regular: [8, 0, 0, 0, 0], natural: [4, -4, 0, 0, 0], square: [4, 4, 0, 0, 0] }, natural: ['left multiplication on the quaternions ℍ = ℝ⁴', '四元数 ℍ = ℝ⁴ への左乗法'], square: ['2-dim ⊗ 2-dim', '2 次元 ⊗ 2 次元'] },
    A4: { order: 12, classes: ['e', '(12)(34)', '(123)', '(132)'], sizes: [1, 3, 4, 4], irreps: [['trivial', [R(1), R(1), R(1), R(1)]], ['χ_ω', [R(1), R(1), W, W2]], ['χ_ω²', [R(1), R(1), W2, W]], ['3-dim', [R(3), R(-1), R(0), R(0)]]],
      reps: { regular: [12, 0, 0, 0], natural: [4, 0, 1, 1], square: [9, 1, 0, 0] }, natural: ['permuting 4 points', '4 点の置換'], square: ['3-dim ⊗ 3-dim', '3 次元 ⊗ 3 次元'] },
  };
  const cx = (v) => (Array.isArray(v) ? v : [v, 0]);
  // <chi, psi> = (1/|G|) sum_classes size * chi * conj(psi)
  function inner(T, chi, psi) { let re = 0, im = 0; T.sizes.forEach((s, k) => { const a = cx(chi[k]), b = cx(psi[k]); re += s * (a[0] * b[0] + a[1] * b[1]); im += s * (a[1] * b[0] - a[0] * b[1]); }); return [re / T.order, im / T.order]; }
  const decompose = (T, chi) => T.irreps.map(([, ch]) => inner(T, chi, ch)[0]);

  // ring of n beads: K circulant (2, -1), mass 1 except bead 0 of mass mu. Returns sorted { w, v } (w = omega / omega0).
  function jacobiEigen(A) { const n = A.length, a = A.map((r) => r.slice()), V = L0.seq(n, (i) => L0.seq(n, (j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) { let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2; if (off < 1e-22) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (Math.abs(a[p][q]) < 1e-300) continue; const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; } } }
    return { vals: a.map((r, i) => r[i]), vecs: V }; }
  function ringModes(n, mu) {
    const m = L0.seq(n, (j) => (j === 0 ? mu : 1)), A = L0.seq(n, (i) => L0.seq(n, (j) => { const k = i === j ? 2 : (Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1) ? (n === 2 ? -2 : -1) : 0; return k / Math.sqrt(m[i] * m[j]); }));
    if (n === 2) { A[0][1] = A[1][0] = -2 / Math.sqrt(m[0] * m[1]); }
    const { vals, vecs } = jacobiEigen(A);
    const modes = vals.map((l, k) => ({ w: Math.sqrt(Math.max(0, l)), v: L0.seq(n, (j) => vecs[j][k] / Math.sqrt(m[j])) }));
    modes.sort((p, q) => p.w - q.w);
    modes.forEach((md) => { let mx = 0, s = 0; md.v.forEach((x) => { if (Math.abs(x) > mx) { mx = Math.abs(x); s = Math.sign(x); } }); md.v = md.v.map((x) => (x / mx) * s); });
    return modes;
  }
  const uniformOmega = (n, k) => 2 * Math.abs(Math.sin((Math.PI * k) / n));
  // parity of a mode under the mirror through bead 0 (j -> -j): +1 symmetric, -1 antisymmetric, 0 neither
  function mirrorParity(v) { const n = v.length; let sp = 0, sm = 0; for (let j = 0; j < n; j++) { const a = v[j], b = v[(n - j) % n]; sp += (a - b) ** 2; sm += (a + b) ** 2; } return sp < 1e-12 ? 1 : sm < 1e-12 ? -1 : 0; }

  (window.LabModels = window.LabModels || {})['representation-theory'] = { rho2, mul2, dmul, vertexImage, permMatrix, fixedPoints, order, TABLES, inner, decompose, jacobiEigen, ringModes, uniformOmega, mirrorParity };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (k) => String(k).split('').map((d) => SUB[d]).join('');
  const sup = (k) => String(k).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const gname = (n, g) => (g === 0 ? 'e' : g < n ? (g === 1 ? 'r' : `r${sup(g)}`) : g === n ? 's' : g === n + 1 ? 'sr' : `sr${sup(g - n)}`);
  const num = (x) => { const r = Math.round(x * 1000) / 1000; return Math.abs(r) < 5e-4 ? '0' : fmt(r, 3); };

  /* ---------- 1. symmetries as matrices ---------- */
  D['rep-matrices'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, n = v.n, g = Math.min(v.g, 2 * n - 1), M = rho2(n, g), refl = g >= n;
      st.v ||= [0.62, 0.34];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The regular ${n}-gon, a flag that shows orientation, and the element ${gname(n, g)} acting on both. Drag the blue vector; its image under the matrix ρ(${gname(n, g)}) is gold.`, `正 ${n} 角形と向きを示す旗、そして両方に作用する元 ${gname(n, g)} です。青いベクトルをドラッグしてください。行列 ρ(${gname(n, g)}) による像が金色です。`));
      const f = L.fig(c1, { x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, xlabel: 'x', ylabel: 'y', maxH: 400 });
      const verts = L.seq(n, (j) => [Math.cos((2 * Math.PI * j) / n), Math.sin((2 * Math.PI * j) / n)]);
      f.poly(verts, { c: 'muted', w: 1.2, fill: 'muted', fo: 0.06 });
      // mirror lines and rotation centre
      if (refl) { const a = -(Math.PI * (g - n)) / n; f.seg([-1.3 * Math.cos(a), -1.3 * Math.sin(a)], [1.3 * Math.cos(a), 1.3 * Math.sin(a)], { c: 'c4', w: 1.4, dash: '6 4' }); }
      const flag = [[0.18, 0.05], [0.62, 0.05], [0.62, 0.17], [0.32, 0.17], [0.32, 0.27], [0.5, 0.27], [0.5, 0.37], [0.18, 0.37]];
      f.poly(flag, { c: 'c1', w: 1.4, fill: 'c1', fo: 0.18 });
      const lab = f.group('over'), dyn = f.group('main');
      verts.forEach(([x, y], j) => f.text(x * 1.16, y * 1.16, String(j + 1), { small: true, c: 'muted' }));
      const vv = st.v;
      f.arrow([0, 0], vv, { c: 'c1', w: 2.4 });
      f.handle(vv[0], vv[1], { c: 'c1', r: 7, label: T('Vector v', 'ベクトル v'), bounds: [-1.2, 1.2, -1.2, 1.2], onDrag: (x, y) => { st.v = [x, y]; ctx.redraw(); } });
      // animation: rotations turn through the angle; reflections fold through 3D about the mirror line
      const frame = (s) => {
        let A;
        if (!refl) A = rot((2 * Math.PI * g * s) / n);
        else { const a = -(Math.PI * (g - n)) / n, Rm = rot(a), Rt = rot(-a), F = [[1, 0], [0, Math.cos(Math.PI * s)]]; A = mul2(Rm, mul2(F, Rt)); }
        while (dyn.firstChild) dyn.removeChild(dyn.firstChild); while (lab.firstChild) lab.removeChild(lab.firstChild);
        const ap = (p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
        dyn.appendChild(f.poly(flag.map(ap), { c: 'hl', w: 2, fill: 'hl', fo: 0.35, layer: 'main' }));
        dyn.appendChild(f.arrow([0, 0], ap(vv), { c: 'hl', w: 2.6, layer: 'main' }));
        if (s >= 1) verts.forEach((p, j) => { const q = verts[vertexImage(n, g, j)]; if (vertexImage(n, g, j) === j) lab.appendChild(f.circle(p[0], p[1], 0.07, { c: 'c3', w: 2, layer: 'over' })); void q; });
      };
      L.h('p', 'lab-cap', c2, T(`Two representations of the same element: the 2 × 2 matrix acting on the plane, and the ${n} × ${n} permutation matrix of the vertices. The character is the trace.`, `同じ元の二つの表現です。平面に作用する 2 × 2 行列と、頂点の ${n} × ${n} 置換行列です。指標はトレースです。`));
      const P = permMatrix(n, g), tr = M[0][0] + M[1][1];
      const m = L.fig(c2, { x: [0, 10], y: [0, 10.2], equal: true, axes: false, grid: false, maxH: 400 });
      m.text(0.2, 8.75, 'ρ₂(g) =', { anchor: 'start' });
      [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(([i2, j2]) => m.text(4.0 + j2 * 1.9, 9.25 - i2 * 1.0, num(M[i2][j2]), { c: Math.abs(M[i2][j2]) < 1e-9 ? 'muted' : 'ink' }));
      m.line([[3.35, 9.85], [3.15, 9.85], [3.15, 7.65], [3.35, 7.65]], { c: 'ink', w: 1.4 }); m.line([[6.55, 9.85], [6.75, 9.85], [6.75, 7.65], [6.55, 7.65]], { c: 'ink', w: 1.4 });
      m.text(7.2, 8.75, `χ₂ = ${num(tr)}`, { anchor: 'start', c: 'hl' });
      m.text(0.2, 6.85, 'P(g)', { anchor: 'start' }); m.text(7.2, 6.85, `χ = ${fixedPoints(n, g)}`, { anchor: 'start', c: 'c3' });
      const cell = Math.min(7.6, 5.6) / n, gx = 1.6 + (7.6 - cell * n) / 2, gy = 0.2;
      for (let i2 = 0; i2 < n; i2++) for (let j2 = 0; j2 < n; j2++) m.rect(gx + j2 * cell, gy + (n - 1 - i2) * cell, cell * 0.9, cell * 0.9, { fill: P[i2][j2] ? (i2 === j2 ? 'c3' : 'c1') : 'plate', fo: P[i2][j2] ? 0.85 : 1, c: 'muted', w: 0.5 });
      for (let j2 = 0; j2 < n; j2++) { m.text(gx + (j2 + 0.45) * cell, gy + n * cell + 0.3, String(j2 + 1), { small: true, c: 'muted' }); m.text(gx - 0.35, gy + (n - 1 - j2 + 0.45) * cell, String(j2 + 1), { small: true, c: 'muted' }); }
      L.legend(ctx.host, [{ c: 'c1', label: T('v and the flag', 'v と旗') }, { c: 'hl', label: T(`after ${gname(n, g)}`, `${gname(n, g)} の後`) }, { c: 'c4', dash: true, label: T('mirror line', '鏡映の軸') }, { c: 'c3', kind: 'fill', label: T('fixed vertex (diagonal 1 of P)', '固定される頂点（P の対角の 1）') }]);
      const ord = order(n, g);
      ctx.readout([
        { k: T('element', '元'), v: `${gname(n, g)} ∈ D${sub(n)}`, tone: 'key' },
        { k: T('order', '位数'), v: String(ord) },
        { k: 'det ρ₂', v: refl ? '−1' : '1' },
        { k: T('χ₂ = trace', 'χ₂ = トレース'), v: num(M[0][0] + M[1][1]), tone: 'good' },
        { k: T('χ_perm = fixed vertices', 'χ_perm = 固定頂点'), v: String(fixedPoints(n, g)), tone: 'good' },
        { k: T('ρ₂(v)', 'ρ₂(v)'), v: `(${num(M[0][0] * vv[0] + M[0][1] * vv[1])}, ${num(M[1][0] * vv[0] + M[1][1] * vv[1])})` },
      ], refl
        ? T(`A reflection has eigenvalues 1 and −1, so its trace is 0 whichever mirror it is. It fixes ${fixedPoints(n, g)} vertices: ${n % 2 ? 'for odd n every mirror passes through exactly one vertex' : fixedPoints(n, g) ? 'this mirror runs through two opposite vertices' : 'this mirror runs through two edge midpoints'}.`, `鏡映の固有値は 1 と −1 なので、どの鏡でもトレースは 0 です。固定する頂点は ${fixedPoints(n, g)} 個です。${n % 2 ? '奇数の n ではどの鏡もちょうど一つの頂点を通ります。' : fixedPoints(n, g) ? 'この鏡は向かい合う二つの頂点を通ります。' : 'この鏡は二つの辺の中点を通ります。'}`)
        : T(`A rotation by ${num((360 * g) / n)}° has trace 2 cos(2π·${g}/${n}) = ${num(M[0][0] + M[1][1])}. Conjugate elements, here rᵏ and r⁻ᵏ, always have the same trace, which is why a character is a function on conjugacy classes.`, `${num((360 * g) / n)}° の回転のトレースは 2 cos(2π·${g}/${n}) = ${num(M[0][0] + M[1][1])} です。共役な元、ここでは rᵏ と r⁻ᵏ は常に同じトレースをもちます。だから指標は共役類の上の関数なのです。`));
      st.anim = L.animator(ctx.host, (dt, t, lb) => { const s = clamp(t / 1.4, 0, 1); frame(s); lb.textContent = s < 1 ? T('applying…', '作用中…') : T(`${gname(n, g)} applied`, `${gname(n, g)} を作用`); return s < 1; }, { autoplay: false, initialT: 100, once: true, playLabel: T('Play: apply g', '再生：g を作用') });
    },
  };

  /* ---------- 2. character tables ---------- */
  const GROUPS = ['S3', 'D4', 'Q8', 'A4'], REPS = ['regular', 'natural', 'square'];
  const cstr = (z) => { const [a, b] = cx(z); if (Math.abs(b) < 1e-9) return num(a); if (Math.abs(a + 0.5) < 1e-9) return b > 0 ? 'ω' : 'ω²'; return `${num(a)}${b > 0 ? '+' : '−'}${num(Math.abs(b))}i`; };
  D['characters'] = {
    render(ctx, v) {
      const G = TABLES[GROUPS[v.grp]], repKey = REPS[v.rep], chi = G.reps[repKey], mult = decompose(G, chi), col = L.colours();
      const nI = G.irreps.length, nC = G.classes.length;
      const repName = repKey === 'regular' ? T('the regular representation', '正則表現') : repKey === 'natural' ? T(G.natural[0], G.natural[1]) : T(G.square[0], G.square[1]);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The character table of ${GROUPS[v.grp]}: one row per irreducible representation, one column per conjugacy class (size underneath). The gold row is the character of ${repName}.`, `${GROUPS[v.grp]} の指標表です。行は既約表現、列は共役類（大きさは下に）です。金色の行は${repName}の指標です。`));
      const W0 = nC + 2.6, H0 = nI + 3.2;
      const f = L.fig(c1, { x: [0, W0], y: [0, H0], equal: true, axes: false, grid: false, maxH: 400 });
      const cellC = (z) => { const [a, b] = cx(z); if (Math.abs(b) > 1e-9) return L.cmaps.phase(Math.atan2(b, a), 0.8); return L.cmaps.div(clamp(a / 3, -1, 1)); };
      const X0 = 2.4, Y0 = 1.4;
      G.classes.forEach((c, k) => { f.text(X0 + k + 0.5, Y0 + nI + 1.55, c, { small: true }); f.text(X0 + k + 0.5, 0.5, `×${G.sizes[k]}`, { small: true, c: 'muted' }); });
      G.irreps.forEach(([name], i) => f.text(X0 - 0.2, Y0 + nI - i + 0.5, name, { anchor: 'end', small: true }));
      f.raster((x, y) => { const k = Math.floor(x - X0), r = Math.floor(y - Y0); if (k < 0 || k >= nC) return col.plate; if (r >= 1 && r <= nI) return cellC(G.irreps[nI - r][1][k]); if (r === 0 && y - Y0 > 0.08) return [col.hl[0] * 0.45 + col.plate[0] * 0.55, col.hl[1] * 0.45 + col.plate[1] * 0.55, col.hl[2] * 0.45 + col.plate[2] * 0.55]; return col.plate; }, { res: 2 });
      for (let k = 0; k <= nC; k++) f.seg([X0 + k, Y0], [X0 + k, Y0 + nI + 1], { c: 'plate', w: 2 });
      for (let r = 0; r <= nI + 1; r++) f.seg([X0, Y0 + r], [X0 + nC, Y0 + r], { c: 'plate', w: 2 });
      G.irreps.forEach(([, ch], i) => ch.forEach((z, k) => f.text(X0 + k + 0.5, Y0 + nI - i + 0.5, cstr(z), { small: true })));
      chi.forEach((z, k) => f.text(X0 + k + 0.5, Y0 + 0.5, cstr(z), { small: true, c: 'ink' }));
      f.text(X0 - 0.2, Y0 + 0.5, 'χ', { anchor: 'end', c: 'hl' });
      L.h('p', 'lab-cap', c2, T('Multiplicities mᵢ = ⟨χ, χᵢ⟩ of each irreducible in χ (bars), against the dimension of that irreducible (dots). For the regular representation they coincide.', 'χ に含まれる各既約表現の重複度 mᵢ = ⟨χ, χᵢ⟩（棒）と、その既約表現の次元（点）です。正則表現では両者が一致します。'));
      const mmax = Math.max(3, ...mult) + 0.6;
      const g = L.fig(c2, { x: [-0.6, nI - 0.4], y: [0, mmax], aspect: 0.8, ylabel: T('multiplicity', '重複度'), ticksX: G.irreps.map(([nm], i) => [i, nm]), maxH: 400 });
      mult.forEach((mi, i) => { g.rect(i - 0.3, 0, 0.6, mi, { fill: 'c1', fo: 0.75, c: 'c1', w: 1 }); g.text(i, mi, fmt(Math.round(mi * 1000) / 1000, 3), { dy: -8, small: true, c: 'c1' }); g.dot(i, cx(G.irreps[i][1][0])[0], { c: 'c2', r: 5, hollow: true }); });
      L.legend(ctx.host, [{ c: 'pos', kind: 'fill', label: T('positive', '正') }, { c: 'neg', kind: 'fill', label: T('negative', '負') }, { c: 'c4', kind: 'fill', label: T('complex: hue is the phase', '複素数：色相が偏角') }, { c: 'c1', kind: 'fill', label: T('multiplicity mᵢ', '重複度 mᵢ') }, { c: 'c2', kind: 'dot', label: T('dimension dᵢ', '次元 dᵢ') }]);
      // orthonormality as a number: max deviation of the Gram matrix from the identity
      let dev = 0; G.irreps.forEach((a, i) => G.irreps.forEach((b, j) => { const z = inner(G, a[1], b[1]); dev = Math.max(dev, Math.abs(z[0] - (i === j ? 1 : 0)), Math.abs(z[1])); }));
      const nn = inner(G, chi, chi)[0], dims = G.irreps.map(([, ch]) => cx(ch[0])[0]);
      ctx.readout([
        { k: '|G|', v: String(G.order), tone: 'key' },
        { k: T('Σ dᵢ²', 'Σ dᵢ²'), v: dims.map((d) => d * d).join(' + ') + ' = ' + dims.reduce((s, d) => s + d * d, 0) },
        { k: T('dim χ = χ(e)', 'dim χ = χ(e)'), v: String(cx(chi[0])[0]) },
        { k: '⟨χ, χ⟩ = Σ mᵢ²', v: fmt(nn, 3), tone: 'good' },
        { k: T('χ = Σ mᵢ χᵢ', 'χ = Σ mᵢ χᵢ'), v: mult.map((m_, i) => (Math.round(m_) ? `${Math.round(m_) > 1 ? Math.round(m_) : ''}${G.irreps[i][0]}` : '')).filter(Boolean).join(' + ') },
        { k: T('rows orthonormal to', '行の正規直交性の誤差'), v: dev < 1e-12 ? '< 10⁻¹²' : fmt(dev, 3) },
      ], v.grp === 2
        ? T('Q₈ has exactly the same character table as D₄, yet the two groups are not isomorphic: D₄ has five elements of order 2 and Q₈ has one. Characters determine representations, not groups.', 'Q₈ は D₄ とまったく同じ指標表をもちますが、二つの群は同型ではありません。D₄ には位数 2 の元が五つ、Q₈ には一つしかありません。指標が決めるのは表現であって、群ではないのです。')
        : nn === 1 ? T('⟨χ, χ⟩ = 1: this representation is irreducible.', '⟨χ, χ⟩ = 1 なので、この表現は既約です。')
          : T(`⟨χ, χ⟩ = ${fmt(nn, 3)} is the sum of the squared multiplicities, so the decomposition can be read off without ever finding an invariant subspace: take the inner product with each row.`, `⟨χ, χ⟩ = ${fmt(nn, 3)} は重複度の二乗の和です。だから不変部分空間を一つも見つけずに分解が読み取れます。各行との内積を取るだけです。`));
    },
  };

  /* ---------- 3. normal modes of a ring ---------- */
  D['ring-vibrations'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = v.n, mu = v.mu, k = Math.min(v.m, n - 1), modes = ringModes(n, mu), uni = ringModes(n, 1), md = modes[k];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${n} beads on a closed string, each displaced along its spoke; mode ${k + 1} of ${n}. ${mu !== 1 ? `Bead 1 is ${fmt(mu, 3)} times heavier.` : ''}`, `閉じた弦の上の ${n} 個のビーズで、各ビーズは自分の放射方向に変位します。${n} 個中のモード ${k + 1} です。${mu !== 1 ? `ビーズ 1 は ${fmt(mu, 3)} 倍重くしてあります。` : ''}`));
      const f = L.fig(c1, { x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, grid: false, maxH: 380 });
      f.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 4', op: 0.6 });
      if (mu !== 1) f.seg([-1.45, 0], [1.45, 0], { c: 'c4', w: 1.2, dash: '6 4' });
      const dyn = f.group('main');
      const amp = 0.28;
      const draw = (ph) => {
        while (dyn.firstChild) dyn.removeChild(dyn.firstChild);
        const pts = L.seq(n, (j) => { const a = (2 * Math.PI * j) / n, r = 1 + amp * md.v[j] * Math.cos(ph); return [r * Math.cos(a), r * Math.sin(a)]; });
        dyn.appendChild(f.poly(pts, { c: 'c1', w: 2, fill: 'c1', fo: 0.08, layer: 'main' }));
        pts.forEach((p, j) => { const a = (2 * Math.PI * j) / n; dyn.appendChild(f.seg([Math.cos(a) * 0.62, Math.sin(a) * 0.62], [Math.cos(a) * 1.38, Math.sin(a) * 1.38], { c: 'muted', w: 0.6, op: 0.4, layer: 'under' })); dyn.appendChild(f.circle(p[0], p[1], j === 0 ? 0.075 * Math.sqrt(mu) : 0.075, { c: j === 0 && mu !== 1 ? 'c2' : 'hl', fill: j === 0 && mu !== 1 ? 'c2' : 'hl', fo: 1, w: 1, layer: 'over' })); });
      };
      L.h('p', 'lab-cap', c2, T('Frequencies ω / ω₀, sorted. Hollow dots: the symmetric ring, where the modes pair up. Filled: with bead 1 changed. Drag the gold handle to choose a mode.', '振動数 ω / ω₀ を小さい順に並べています。白抜きの点は対称な環で、モードが対になります。塗りつぶしの点はビーズ 1 を変えたときです。金色のハンドルをドラッグしてモードを選んでください。'));
      const g = L.fig(c2, { x: [-0.6, n - 0.4], y: [0, 2.25], aspect: 0.8, xlabel: T('mode, by frequency', 'モード（振動数順）'), ylabel: 'ω / ω₀', ticksX: L.seq(n, (i) => [i, String(i + 1)]), maxH: 380 });
      uni.forEach((u, i) => g.dot(i, u.w, { c: 'muted', r: 6, hollow: true }));
      modes.forEach((u, i) => { const p = mirrorParity(u.v); g.dot(i, u.w, { c: mu === 1 ? 'c1' : p < 0 ? 'c3' : 'c2', r: 4.2 }); });
      // pair brackets for degenerate uniform levels
      for (let i = 1; i < n; i++) if (Math.abs(uni[i].w - uni[i - 1].w) < 1e-9) g.seg([i - 1, uni[i].w + 0.1], [i, uni[i].w + 0.1], { c: 'muted', w: 1.2 });
      g.handle(k, 0.04, { c: 'hl', r: 7, axis: 'x', snap: 1, label: T('Mode', 'モード'), bounds: [0, n - 1, 0, 2], onDrag: (x) => ctx.set('m', Math.round(x)) });
      g.vline(k, { c: 'hl', w: 1, dash: '3 3', layer: 'under' });
      const par = mirrorParity(md.v), uniK = uni[k].w, deg = uni.filter((u) => Math.abs(u.w - uniK) < 1e-9).length;
      const kk = Math.round((n * Math.asin(Math.min(1, uniK / 2))) / Math.PI);
      const irrep = mu !== 1 ? (par > 0 ? T("A′ (even under the mirror)", "A′（鏡映で偶）") : par < 0 ? T("A″ (odd under the mirror)", "A″（鏡映で奇）") : '?') : kk === 0 ? 'A₁' : 2 * kk === n ? 'B' : `E${sub(kk)}`;
      L.legend(ctx.host, [{ c: 'muted', kind: 'dot', label: T('symmetric ring', '対称な環') }, ...(mu !== 1 ? [{ c: 'c2', kind: 'dot', label: T('even about the mirror', '鏡映で偶') }, { c: 'c3', kind: 'dot', label: T('odd: node at bead 1, frequency unchanged', '奇：ビーズ 1 が節、振動数は不変') }] : [{ c: 'c1', kind: 'dot', label: T('frequencies', '振動数') }]), { c: 'hl', kind: 'dot', label: T('chosen mode', '選んだモード') }]);
      ctx.readout([
        { k: T('mode', 'モード'), v: `${k + 1} / ${n}`, tone: 'key' },
        { k: 'ω / ω₀', v: fmt(md.w, 4), tone: 'good' },
        { k: T('symmetric ring: 2 sin(πq/n)', '対称な環：2 sin(πq/n)'), v: fmt(uniK, 4) },
        { k: T('irreducible representation', '既約表現'), v: irrep },
        { k: T('degeneracy (symmetric ring)', '縮退度（対称な環）'), v: String(deg) },
        { k: T('mass ratio μ', '質量比 μ'), v: fmt(mu, 3) },
      ], mu === 1
        ? T(`The ring has the symmetry D${sub(n)}, so the modes are its irreducible representations: Fourier waves around the ring. Waves q and n − q are mirror images and together form one two-dimensional irreducible representation, which is why they share a frequency. Every degeneracy here is forced by symmetry.`, `環は D${sub(n)} の対称性をもつので、モードはその既約表現、環を一周するフーリエ波です。波 q と n − q は互いの鏡像で、合わせて一つの二次元既約表現をなします。だから同じ振動数を共有します。ここでの縮退はすべて対称性が強いるものです。`)
        : T('A heavier bead leaves only the mirror through it. Each pair splits into an even mode, which moves the heavy bead and slows down, and an odd mode with a node exactly at bead 1, which never feels the extra mass and keeps its frequency to every digit.', '重いビーズがあると、それを通る鏡映だけが残ります。各対は、重いビーズを動かして遅くなる偶のモードと、ちょうどビーズ 1 に節をもつ奇のモードに分かれます。奇のモードは余分な質量をまったく感じず、振動数をすべての桁で保ちます。'));
      draw(0);
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { draw(md.w < 1e-6 ? 0 : 2 * Math.PI * 0.55 * Math.max(md.w, 0.15) * t); lb.textContent = `ω / ω₀ = ${fmt(md.w, 3)}`; }, { autoplay: true, initialT: 0 });
    },
  };
})();
