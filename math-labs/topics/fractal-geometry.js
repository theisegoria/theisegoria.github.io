'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const SQ3 = Math.sqrt(3), LN2 = Math.LN2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // small seeded generator (mulberry32) so every raster and every check is reproducible
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- model (pure, checked by checks/fractal-geometry.cjs) ---------- */
  // 1. iterated function systems. An affine map is [a, b, c, d, e, f]: x' = a x + b y + e, y' = c x + d y + f.
  const similarity = (r, th, tx, ty) => [r * Math.cos(th), -r * Math.sin(th), r * Math.sin(th), r * Math.cos(th), tx, ty];
  const apply = (m, x, y) => [m[0] * x + m[1] * y + m[4], m[2] * x + m[3] * y + m[5]];
  // three similarities of ratio r with the given fixed points: S_i(x) = r x + (1 - r) p_i
  const threeMaps = (P, r) => P.map(([px, py]) => [r, 0, 0, r, (1 - r) * px, (1 - r) * py]);
  const TRI = [[0, 0], [1, 0], [0.5, SQ3 / 2]];
  const FERN = [[0, 0, 0, 0.16, 0, 0], [0.85, 0.04, -0.04, 0.85, 0, 1.6], [0.2, -0.26, 0.23, 0.22, 0, 1.6], [-0.15, 0.28, 0.26, 0.24, 0, 0.44]];
  const KOCH = [similarity(1 / 3, 0, 0, 0), similarity(1 / 3, Math.PI / 3, 1 / 3, 0), similarity(1 / 3, -Math.PI / 3, 0.5, SQ3 / 6), similarity(1 / 3, 0, 2 / 3, 0)];
  // the system for a choice: maps, chaos-game probabilities, and the ratios when the maps are similarities
  function system(kind, r = 0.5, P = TRI) {
    if (kind === 0) return { maps: threeMaps(TRI, 0.5), probs: [1 / 3, 1 / 3, 1 / 3], ratios: [0.5, 0.5, 0.5], box: [-0.06, 1.06, -0.06, 0.95] };
    if (kind === 1) return { maps: FERN, probs: [0.01, 0.85, 0.07, 0.07], ratios: null, box: [-4.2, 4.2, -0.3, 10.3] };
    if (kind === 2) return { maps: KOCH, probs: [0.25, 0.25, 0.25, 0.25], ratios: [1 / 3, 1 / 3, 1 / 3, 1 / 3], box: [-0.06, 1.06, -0.25, 0.45] };
    return { maps: threeMaps(P, r), probs: [1 / 3, 1 / 3, 1 / 3], ratios: [r, r, r], box: [-0.06, 1.06, -0.06, 0.95] };
  }
  // the chaos game: n points from a random start, choosing map i with probability probs[i]
  function iterate(maps, probs, n, seed = 1, start = [0.3, 0.2]) {
    const R = rng(seed), xs = new Float32Array(n), ys = new Float32Array(n), cum = []; let acc = 0;
    probs.forEach((p) => { acc += p; cum.push(acc); });
    let x = start[0], y = start[1];
    for (let k = 0; k < n; k++) {
      const u = R() * acc; let i = 0; while (i < cum.length - 1 && u > cum[i]) i++;
      const m = maps[i]; const nx = m[0] * x + m[1] * y + m[4]; y = m[2] * x + m[3] * y + m[5]; x = nx;
      xs[k] = x; ys[k] = y;
    }
    return { xs, ys };
  }
  // Moran's equation sum r_i^d = 1: its left side, and its unique root (the left side is strictly decreasing in d)
  const moran = (ratios, d) => ratios.reduce((s, r) => s + Math.pow(r, d), 0);
  function moranRoot(ratios) {
    let lo = 0, hi = 1; while (moran(ratios, hi) > 1) hi *= 2;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (moran(ratios, mid) > 1) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // the closed form for m equal ratios r: d = log m / log(1 / r)
  const equalRatioDim = (m, r) => Math.log(m) / Math.log(1 / r);

  // 2. box counting. Points are [x, y]; N(eps) counts the cells of the eps-grid (anchored at the origin) that contain a point.
  function boxCount(points, eps) {
    const S = new Set(); const inv = 1 / eps;
    for (const [x, y] of points) S.add(Math.floor(x * inv + 1e-9) * 1048576 + Math.floor(y * inv + 1e-9));
    return S.size;
  }
  const occupied = (points, eps) => { const S = new Map(); const inv = 1 / eps; for (const [x, y] of points) { const i = Math.floor(x * inv + 1e-9), j = Math.floor(y * inv + 1e-9); S.set(i * 1048576 + j, [i, j]); } return [...S.values()]; };
  // least-squares slope of y against x over the pairs [x, y]
  function fitSlope(pairs) {
    const n = pairs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pairs) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), intercept = (sy - slope * sx) / n;
    return { slope, intercept };
  }
  // insert points along a polyline so that consecutive points are at most h apart
  function densify(poly, h) {
    const out = [poly[0]];
    for (let k = 1; k < poly.length; k++) {
      const [ax, ay] = poly[k - 1], [bx, by] = poly[k], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / h));
      for (let i = 1; i <= m; i++) out.push([ax + (bx - ax) * i / m, ay + (by - ay) * i / m]);
    }
    return out;
  }
  // the Koch curve as a polyline of 4^level + 1 vertices on the base segment [0, 1]
  function koch(level) {
    let pts = [[0, 0], [1, 0]];
    for (let l = 0; l < level; l++) {
      const next = [pts[0]];
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1], [bx, by] = pts[k], dx = (bx - ax) / 3, dy = (by - ay) / 3;
        const p1 = [ax + dx, ay + dy], p3 = [ax + 2 * dx, ay + 2 * dy];
        const p2 = [p1[0] + dx * 0.5 - dy * SQ3 / 2, p1[1] + dy * 0.5 + dx * SQ3 / 2];
        next.push(p1, p2, p3, [bx, by]);
      }
      pts = next;
    }
    return pts;
  }
  const sierpinskiPoints = (n, seed = 7) => { const { xs, ys } = iterate(threeMaps(TRI, 0.5), [1 / 3, 1 / 3, 1 / 3], n + 50, seed); const out = []; for (let k = 50; k < n + 50; k++) out.push([xs[k], ys[k]]); return out; };
  // the graph of a random walk with n steps on [0, 1], rescaled to fit the unit square (its box dimension is 3/2 in the limit)
  function brownianGraph(n, seed = 3) {
    const R = rng(seed), ys = [0]; let b = 0;
    for (let k = 1; k <= n; k++) { const u = Math.max(1e-12, R()), v = R(); b += Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); ys.push(b); }
    const lo = Math.min(...ys), hi = Math.max(...ys);
    return ys.map((y, k) => [k / n, 0.05 + 0.9 * (y - lo) / (hi - lo)]);
  }
  const circlePoints = (n) => L.seq(n, (k) => [0.5 + 0.45 * Math.cos(2 * Math.PI * k / n), 0.5 + 0.45 * Math.sin(2 * Math.PI * k / n)]);
  // rescale any point set into the corner of [0.02, 0.98]^2 (same factor on both axes) so the dyadic grid means the same thing for every set
  function normalise(points) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of points) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const s = 0.96 / Math.max(x1 - x0, y1 - y0, 1e-12);
    return points.map(([x, y]) => [0.02 + (x - x0) * s, 0.02 + (y - y0) * s]);
  }
  // N(2^-k) for k = 1..kmax, and the fitted slope of log2 N against k over [ka, kb]
  function boxSeries(points, kmax, ka, kb) {
    const rows = L.seq(kmax, (i) => { const k = i + 1; return [k, boxCount(points, Math.pow(2, -k))]; });
    const fit = fitSlope(rows.filter(([k]) => k >= ka && k <= kb).map(([k, N]) => [k, Math.log2(N)]));
    return { rows, ...fit };
  }

  // 3. z -> z^2 + c. escape(c): does the orbit of 0 leave the disc |z| <= 2, and after how many steps
  function escape(cr, ci, maxIter = 500) {
    let x = 0, y = 0;
    for (let n = 1; n <= maxIter; n++) { const nx = x * x - y * y + cr; y = 2 * x * y + ci; x = nx; if (x * x + y * y > 4) return { escaped: true, n }; }
    return { escaped: false, n: maxIter };
  }
  // continuous escape time of z0 under z^2 + c (Vepstas / Milnor's Green's function normalisation): -1 when it stays bounded
  function smoothEscape(zr, zi, cr, ci, maxIter) {
    let x = zr, y = zi;
    for (let n = 0; n < maxIter; n++) {
      const x2 = x * x, y2 = y * y;
      if (x2 + y2 > 256) return n + 1 - Math.log(0.5 * Math.log(x2 + y2)) / LN2;
      y = 2 * x * y + ci; x = x2 - y2 + cr;
    }
    return -1;
  }
  // membership in the filled Julia set K_c: the orbit of z stays within |z| <= 2 for maxIter steps
  const juliaInside = (zr, zi, cr, ci, maxIter = 80) => smoothEscape(zr, zi, cr, ci, maxIter) < 0;
  // the attracting cycle reached by the critical orbit: iterate 0 for `burn` steps, then find the least period within tol
  function period(cr, ci, o = {}) {
    const burn = o.burn ?? 2000, maxP = o.maxP ?? 64, tol = o.tol ?? 1e-7;
    let x = 0, y = 0;
    for (let n = 0; n < burn; n++) { const nx = x * x - y * y + cr; y = 2 * x * y + ci; x = nx; if (x * x + y * y > 4) return null; }
    const cyc = [[x, y]]; let px = x, py = y;
    for (let p = 1; p <= maxP; p++) {
      const nx = px * px - py * py + cr; py = 2 * px * py + ci; px = nx;
      if (Math.hypot(px - x, py - y) < tol) {
        // multiplier: product of the derivative 2 z over the cycle
        let mr = 1, mi = 0;
        for (const [zx, zy] of cyc) { const ar = 2 * zx, ai = 2 * zy; const t = mr * ar - mi * ai; mi = mr * ai + mi * ar; mr = t; }
        return { p, cycle: cyc, lambda: Math.hypot(mr, mi) };
      }
      cyc.push([px, py]);
    }
    return null;
  }
  const PRESETS = [null, [0, 0], [-1, 0], [-0.123, 0.745], [0, 1], [0.4, 0.4]];

  // 4. L-systems. expand() rewrites every symbol at once; turtle() reads F-like symbols as unit steps, + and - as turns, [ ] as push/pop.
  const LSYS = [
    { axiom: 'F', rules: { F: 'F+F--F+F' }, angle: 60, draw: 'F', heading: 0, copies: 4, scale: 3, iter: (l) => Math.min(l, 7) },
    { axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, draw: 'F', heading: 0, copies: 2, scale: Math.SQRT2, iter: (l) => Math.min(Math.round(1.5 * l), 12) },
    { axiom: 'A', rules: { A: 'B-A-B', B: 'A+B+A' }, angle: 60, draw: 'AB', heading: 0, copies: 3, scale: 2, iter: (l) => Math.min(l, 8) },
    { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, draw: 'F', heading: 90, copies: null, scale: null, iter: (l) => Math.min(l, 6) },
  ];
  function expand(axiom, rules, n) { let s = axiom; for (let k = 0; k < n; k++) { let out = ''; for (const ch of s) out += rules[ch] ?? ch; s = out; } return s; }
  // the turtle path as one point list; null separates branches (pen up). Returns the points, the segment count and the bounding box.
  function turtle(str, angleDeg, drawChars, heading = 0) {
    const a = angleDeg * Math.PI / 180; let x = 0, y = 0, th = heading * Math.PI / 180; const stack = [], pts = [[0, 0]]; let segs = 0, penDown = true;
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const ch of str) {
      if (drawChars.includes(ch)) { x += Math.cos(th); y += Math.sin(th); if (!penDown) { pts.push(null, [x - Math.cos(th), y - Math.sin(th)]); penDown = true; } pts.push([x, y]); segs++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      else if (ch === '+') th += a; else if (ch === '-') th -= a;
      else if (ch === '[') stack.push([x, y, th]); else if (ch === ']') { [x, y, th] = stack.pop(); penDown = false; }
    }
    return { pts, segs, box: [x0, x1, y0, y1], end: [x, y] };
  }
  const lsystemDim = (copies, scale) => (copies && scale ? Math.log(copies) / Math.log(scale) : null);

  // 5. Newton's method for p(z) = prod (z - r_k), roots as [re, im] pairs
  function newtonStep(zr, zi, roots) {
    // p and p' by the product rule: p = prod d_k, p' = sum_k prod_{j != k} d_j
    let pr = 1, pi = 0; const dr = [], di = [];
    for (const [rr, ri] of roots) { const ar = zr - rr, ai = zi - ri; dr.push(ar); di.push(ai); const t = pr * ar - pi * ai; pi = pr * ai + pi * ar; pr = t; }
    let qr = 0, qi = 0;
    for (let k = 0; k < roots.length; k++) { let tr = 1, ti = 0; for (let j = 0; j < roots.length; j++) { if (j === k) continue; const t = tr * dr[j] - ti * di[j]; ti = tr * di[j] + ti * dr[j]; tr = t; } qr += tr; qi += ti; }
    const d = qr * qr + qi * qi; if (d < 1e-300) return [NaN, NaN];
    return [zr - (pr * qr + pi * qi) / d, zi - (pi * qr - pr * qi) / d];
  }
  // iterate until within tol of a root: {root: index or -1, n, orbit}
  function newtonRun(zr, zi, roots, maxIter = 40, tol = 1e-6, keepOrbit = false) {
    const orbit = keepOrbit ? [[zr, zi]] : null;
    for (let n = 0; n <= maxIter; n++) {
      for (let k = 0; k < roots.length; k++) if (Math.hypot(zr - roots[k][0], zi - roots[k][1]) < tol) return { root: k, n, orbit };
      if (n === maxIter) break;
      [zr, zi] = newtonStep(zr, zi, roots); if (!Number.isFinite(zr) || !Number.isFinite(zi)) return { root: -1, n, orbit };
      if (orbit) orbit.push([zr, zi]);
    }
    return { root: -1, n: maxIter, orbit };
  }
  // the fraction of a res x res grid over the box that converges to each root (index roots.length = no root)
  function basinFractions(roots, box, res, maxIter) {
    const cnt = new Array(roots.length + 1).fill(0), [X0, X1, Y0, Y1] = box;
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) { const r = newtonRun(X0 + (i + 0.5) / res * (X1 - X0), Y0 + (j + 0.5) / res * (Y1 - Y0), roots, maxIter, 1e-4); cnt[r.root < 0 ? roots.length : r.root]++; }
    return cnt.map((c) => c / (res * res));
  }
  const ROOTS_UNITY = [[1, 0], [-0.5, Math.sqrt(3) / 2], [-0.5, -Math.sqrt(3) / 2]];
  const ROOTS_CYCLE = [[-1.7692923542386314, 0], [0.8846461771193157, 0.5897428050222056], [0.8846461771193157, -0.5897428050222056]];

  (window.LabModels = window.LabModels || {})['fractal-geometry'] = { rng, similarity, apply, threeMaps, TRI, FERN, KOCH, system, iterate, moran, moranRoot, equalRatioDim, boxCount, occupied, fitSlope, densify, koch, sierpinskiPoints, brownianGraph, circlePoints, normalise, boxSeries, escape, smoothEscape, juliaInside, period, PRESETS, LSYS, expand, turtle, lsystemDim, newtonStep, newtonRun, basinFractions, ROOTS_UNITY, ROOTS_CYCLE };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------- 1. iterated function systems ---------- */
  const SYS_NAME = [['Sierpinski triangle', 'シェルピンスキーの三角形'], ['Barnsley fern', 'バーンズリーのシダ'], ['Koch curve', 'コッホ曲線'], ['custom, three maps', 'カスタム、三つの写像']];
  D['ifs-chaos-game'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, kind = v.sys, r = v.r, N = v.n;
      st.P ||= [[0.1, 0.1], [0.9, 0.15], [0.45, 0.85]];
      const S = system(kind, r, st.P), key = `${kind}|${r}|${N}|${st.P.flat().join(',')}`;
      if (st.key !== key) { st.pts = iterate(S.maps, S.probs, N, 11, [0.3, 0.2]); st.key = key; }
      const pts = st.pts;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The attractor F drawn by the chaos game: every point is the image of the previous one under one map chosen at random. In the custom system, drag the three fixed points.', 'カオスゲームで描いた吸引集合 F です。各点は、ランダムに選んだ一つの写像による直前の点の像です。カスタム系では三つの不動点をドラッグできます。'));
      const [X0, X1, Y0, Y1] = S.box;
      const f = L.fig(c1, { x: [X0, X1], y: [Y0, Y1], equal: true, xlabel: 'x', ylabel: 'y', maxH: kind === 1 ? 470 : 400 });
      const col = L.colours();
      const canvas = f.raster(() => col.plate, { res: 2 }), cw = canvas.width, chh = canvas.height, g2 = canvas.getContext('2d');
      const ink = `rgb(${col.c1.join(',')})`;
      const drawPts = (from, to) => {
        g2.fillStyle = ink; g2.globalAlpha = kind === 1 ? 0.55 : 0.75;
        for (let k = from; k < to; k++) { const px = (pts.xs[k] - X0) / (X1 - X0) * cw, py = (Y1 - pts.ys[k]) / (Y1 - Y0) * chh; g2.fillRect(px, py, 1, 1); }
        g2.globalAlpha = 1;
      };
      // fixed points of the similarities, as small labelled dots (handles in the custom system)
      const fixedPts = kind === 1 ? [] : S.maps.map((m) => { const d = (1 - m[0]) * (1 - m[3]) - m[1] * m[2]; return [((1 - m[3]) * m[4] + m[1] * m[5]) / d, (m[2] * m[4] + (1 - m[0]) * m[5]) / d]; });
      fixedPts.forEach((p, i) => {
        if (kind === 3) f.handle(p[0], p[1], { c: 'c2', r: 7, label: T(`Fixed point of map ${i + 1}`, `写像 ${i + 1} の不動点`), bounds: [X0 + 0.03, X1 - 0.03, Y0 + 0.03, Y1 - 0.03], onDrag: (x, y) => { st.P[i] = [Math.round(x * 200) / 200, Math.round(y * 200) / 200]; ctx.redraw(); } });
        else f.dot(p[0], p[1], { c: 'c2', r: 4, layer: 'main' });
        if (kind !== 2) f.text(p[0], p[1], `p${'₁₂₃₄'[i]}`, { small: true, c: 'c2', dx: i === 0 ? -10 : 10, dy: p[1] > (Y0 + Y1) / 2 ? -12 : 16, anchor: i === 0 ? 'end' : 'start', layer: 'main' });
      });
      // the chaos game, point by point: the first steps are drawn large so the approach to F is visible
      const DUR = 8, LEAD = 12;
      const frame = (t) => {
        f.clear('over');
        const k = t >= DUR ? N : Math.min(N, Math.floor(N * (t / DUR) ** 2));
        g2.fillStyle = `rgb(${col.plate.join(',')})`; g2.fillRect(0, 0, cw, chh);
        drawPts(0, k);
        if (k < N) { const m = Math.min(k, LEAD); if (m > 1) f.line(L.seq(m, (i) => [pts.xs[i], pts.ys[i]]), { c: 'hl', w: 1.2, op: 0.7, layer: 'over' }); for (let i = 0; i < m; i++) f.dot(pts.xs[i], pts.ys[i], { c: 'hl', r: i === k - 1 ? 5 : 3, layer: 'over' }); if (k > 0) f.dot(pts.xs[k - 1], pts.ys[k - 1], { c: 'hl', r: 5, layer: 'over' }); }
        return k;
      };
      frame(DUR);
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const k = frame(Math.min(t, DUR)); lab.textContent = T(`${k.toLocaleString()} points`, `${k.toLocaleString()} 点`); if (t >= DUR) return false; }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play the chaos game', 'カオスゲームを再生') });

      // right: Moran's equation, or the box-count estimate for the fern
      let d = null, note, items;
      if (S.ratios) {
        d = moranRoot(S.ratios);
        L.h('p', 'lab-cap', c2, T('Moran’s function M(d) = Σ rᵢᵈ. It crosses 1 at the similarity dimension.', 'モランの関数 M(d) = Σ rᵢᵈ です。1 と交わる点が相似次元です。'));
        const DX = Math.max(2.5, d + 0.5), mR = S.ratios.length, g = L.fig(c2, { x: [0, DX], y: [0, mR + 0.8], aspect: 0.75, xlabel: 'd', ylabel: 'M(d)', maxH: 400 });
        g.hline(1, { c: 'muted', w: 1, dash: '4 3', layer: 'under' });
        g.line(L.sample(0, DX, 200, (x) => moran(S.ratios, x)), { c: 'c1', w: 2.6 });
        g.vline(d, { c: 'hl', w: 1.2, dash: '3 3', op: 0.8, layer: 'under' });
        g.dot(d, 1, { c: 'hl', r: 6 });
        const right = d > 0.7 * DX; g.text(d, 1, `d = ${fmt(d, 3)}`, { c: 'hl', dx: right ? -10 : 10, dy: right ? 22 : -12, anchor: right ? 'end' : 'start' });
        g.text(0.08, mR, `M(0) = m = ${mR}`, { small: true, c: 'muted', anchor: 'start', dy: 16 });
        if (kind === 3 && r > 0.5) { g.vline(2, { c: 'c2', w: 1, dash: '2 3', op: 0.8, layer: 'under' }); g.text(2, mR + 0.5, T('d = 2: the plane', 'd = 2：平面'), { small: true, c: 'c2', anchor: 'end', dx: -4 }); }
        L.legend(ctx.host, [{ c: 'c1', label: T('the attractor F (chaos game)', '吸引集合 F（カオスゲーム）') }, { c: 'c2', kind: 'dot', label: T('fixed points of the maps', '写像の不動点') }, { c: 'hl', kind: 'dot', label: T('root of Σ rᵢᵈ = 1', 'Σ rᵢᵈ = 1 の根') }]);
        const m = S.ratios.length, overlap = kind === 3 && r > 0.5;
        items = [
          { k: T('system', '系'), v: T(...SYS_NAME[kind]) },
          { k: 'm, r', v: `${m}, ${fmt(S.ratios[0], 3)}` },
          { k: T('similarity dimension d', '相似次元 d'), v: fmt(d, 4), tone: overlap ? 'warn' : 'key' },
          { k: 'log m / log(1/r)', v: fmt(equalRatioDim(m, S.ratios[0]), 4), tone: 'good' },
          { k: 'Σ rᵢᵈ', v: fmt(moran(S.ratios, d), 6) },
        ];
        note = overlap
          ? T(`With r = ${fmt(r, 2)} > 1/2 the three images of the triangle overlap, so the open set condition fails: the Moran root ${fmt(d, 3)} is only an upper bound on the true dimension, which can never exceed 2.`, `r = ${fmt(r, 2)} > 1/2 では三角形の三つの像が重なり、開集合条件が破れます。モランの根 ${fmt(d, 3)} は真の次元の上界にすぎず、真の次元は決して 2 を超えません。`)
          : kind === 3
            ? T(`Three similarities of ratio r = ${fmt(r, 2)} give d = log 3 / log(1/r) whatever the fixed points are: dragging them changes the shape of F, not its dimension, as long as the images stay disjoint.`, `比 r = ${fmt(r, 2)} の三つの相似変換なら、不動点がどこにあっても d = log 3 / log(1/r) です。不動点をドラッグしても、像が互いに離れている限り F の形は変わりますが次元は変わりません。`)
            : T(`${m} maps of ratio ${fmt(S.ratios[0], 3)} give d = log ${m} / log(1/${fmt(S.ratios[0], 3)}) = ${fmt(d, 4)}. The chaos game with equal probabilities lands on each piece equally often, so the raster is evenly dark.`, `比 ${fmt(S.ratios[0], 3)} の写像 ${m} 個で d = log ${m} / log(1/${fmt(S.ratios[0], 3)}) = ${fmt(d, 4)} です。等確率のカオスゲームは各部分に同じ頻度で落ちるので、点描は一様な濃さになります。`);
      } else {
        // the fern is affine, not self-similar: count boxes on the drawn points instead
        if (!st.fernFit || st.fernKey !== key) { const P = normalise(L.seq(N, (k) => [pts.xs[k], pts.ys[k]])); st.fernFit = boxSeries(P, 7, 3, 6); st.fernKey = key; }
        const B = st.fernFit, dets = S.maps.map((m) => Math.abs(m[0] * m[3] - m[1] * m[2]));
        L.h('p', 'lab-cap', c2, T('The fern is affine, not self-similar, so Moran’s equation does not apply. Instead: the box count N(ε) of the drawn points against 1/ε, both on log₂ scales.', 'シダはアフィンであって自己相似ではないので、モランの方程式は使えません。代わりに、描いた点の箱数 N(ε) を 1/ε に対して、両軸 log₂ で示します。'));
        const g = L.fig(c2, { x: [0.5, 7.5], y: [0, 14], aspect: 0.75, xlabel: 'log₂(1/ε)', ylabel: 'log₂ N(ε)', maxH: 400 });
        g.line([[0.5, B.intercept + 0.5 * B.slope], [7.5, B.intercept + 7.5 * B.slope]], { c: 'hl', w: 1.6, dash: '5 3', layer: 'under' });
        B.rows.forEach(([k, n]) => g.dot(k, Math.log2(n), { c: k >= 3 && k <= 6 ? 'c1' : 'muted', r: 5 }));
        g.text(7.3, 1.6, T(`slope ${fmt(B.slope, 3)} over k = 3..6`, `k = 3..6 での傾き ${fmt(B.slope, 3)}`), { c: 'hl', anchor: 'end' });
        L.legend(ctx.host, [{ c: 'c1', label: T('the fern (chaos game, 4 affine maps)', 'シダ（カオスゲーム、4 つのアフィン写像）') }, { c: 'c1', kind: 'dot', label: T('N(ε), boxes hit by the points', 'N(ε)、点が入った箱の数') }, { c: 'hl', dash: true, label: T('least-squares slope', '最小二乗の傾き') }]);
        items = [
          { k: T('system', '系'), v: T(...SYS_NAME[kind]) },
          { k: T('box-count estimate of d', '箱数え法による d の推定'), v: fmt(B.slope, 3), tone: 'key' },
          { k: '|det Aᵢ|', v: dets.map((x) => fmt(x, 3)).join(', ') },
          { k: T('open set condition', '開集合条件'), v: T('not a similarity IFS', '相似変換の IFS ではない'), tone: 'warn' },
        ];
        note = T('Each map squeezes the plane by a different factor in different directions (the determinants are the area factors), so no single ratio rᵢ exists and Σ rᵢᵈ = 1 has no meaning. The slope of the box count is an estimate from finitely many points at finitely many scales, and the coarsest scales are left out of the fit.', '各写像は平面を方向ごとに異なる比率で押しつぶすので（行列式は面積の倍率です）、一つの比 rᵢ が存在せず、Σ rᵢᵈ = 1 に意味がありません。箱数の傾きは有限個の点と有限個のスケールからの推定で、最も粗いスケールはフィットから外しています。');
      }
      items.push({ k: T('points drawn', '描いた点の数'), v: N.toLocaleString() });
      ctx.readout(items, note);
    },
  };

  /* ---------- 2. box counting ---------- */
  const SET_NAME = [['Koch curve', 'コッホ曲線'], ['Sierpinski triangle', 'シェルピンスキーの三角形'], ['Brownian graph', 'ブラウン運動のグラフ'], ['circle', '円']];
  const THEORY = [Math.log(4) / Math.log(3), Math.log(3) / Math.log(2), 1.5, 1];
  const KMAX = 7;
  function setPoints(kind) {
    if (kind === 0) return { poly: koch(6), pts: null };
    if (kind === 1) return { poly: null, pts: normalise(sierpinskiPoints(40000)) };
    if (kind === 2) return { poly: brownianGraph(4096, 3), pts: null };
    return { poly: circlePoints(720).concat([circlePoints(720)[0]]), pts: null };
  }
  D['box-counting'] = {
    render(ctx, v) {
      const st = ctx.state, kind = v.set, k = v.k, eps = Math.pow(2, -k), [ka, kb] = v.fit === 0 ? [1, KMAX] : [4, KMAX];
      if (st.kind !== kind) {
        const s = setPoints(kind); const poly = s.poly ? normalise(s.poly) : null;
        const pts = poly ? densify(poly, Math.pow(2, -KMAX) / 3) : s.pts;
        st.kind = kind; st.poly = poly; st.pts = pts;
        st.rows = L.seq(KMAX, (i) => [i + 1, boxCount(pts, Math.pow(2, -(i + 1)))]);
        st.occ = {}; st.grid = null;
      }
      st.occ[k] ||= occupied(st.pts, eps);
      const fit = fitSlope(st.rows.filter(([kk]) => kk >= ka && kk <= kb).map(([kk, n]) => [kk, Math.log2(n)]));
      const Nk = st.rows[k - 1][1], dth = THEORY[kind];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The set inside the unit square with the grid of side ε = 2⁻${'⁰¹²³⁴⁵⁶⁷'[k]}. Shaded: the N(ε) boxes it meets.`, `単位正方形の中の集合と、一辺 ε = 2⁻${'⁰¹²³⁴⁵⁶⁷'[k]} の格子です。網掛けは集合が触れる N(ε) 個の箱です。`));
      const f = L.fig(c1, { x: [0, 1], y: [0, 1], equal: true, xlabel: 'x', ylabel: 'y', maxH: 400, ticksX: [[0, '0'], [0.5, '½'], [1, '1']], ticksY: [[0, '0'], [0.5, '½'], [1, '1']] });
      const fo = k >= 6 ? 0.22 : 0.3;
      st.occ[k].forEach(([i, j]) => f.rect(i * eps, j * eps, eps, eps, { c: 'hl', fill: 'hl', fo, nostroke: true, layer: 'under' }));
      const n = 1 << k;
      for (let i = 0; i <= n; i++) { const o = { c: 'muted', w: k >= 6 ? 0.4 : 0.7, op: k >= 6 ? 0.45 : 0.6, layer: 'under' }; f.seg([i * eps, 0], [i * eps, 1], o); f.seg([0, i * eps], [1, i * eps], o); }
      if (st.poly) f.line(st.poly, { c: 'c1', w: kind === 0 ? 1.1 : 1.3 });
      else {
        // a point set: paint the cells of a fine grid that hold a point (the raster sits under the shaded boxes' layer, so the boxes stay visible)
        const c = L.colours(), G = 240;
        if (!st.grid) { st.grid = new Uint8Array(G * G); for (const [x, y] of st.pts) st.grid[Math.min(G - 1, Math.floor(y * G)) * G + Math.min(G - 1, Math.floor(x * G))] = 1; }
        const grid = st.grid, cell = (x, y) => grid[clamp(Math.floor(y * G), 0, G - 1) * G + clamp(Math.floor(x * G), 0, G - 1)];
        f.raster((x, y) => (cell(x, y) ? mixc(c.plate, c.c1, 0.85) : c.plate), { res: 2 });
      }

      L.h('p', 'lab-cap', c2, T('log₂ N(ε) against log₂(1/ε) = k. Drag the gold point to change ε; the fit uses the filled points.', 'log₂ N(ε) を log₂(1/ε) = k に対して描いています。金色の点をドラッグすると ε が変わります。フィットには塗った点を使います。'));
      const g = L.fig(c2, { x: [0.4, 7.6], y: [0, 14], aspect: 0.75, xlabel: 'k = log₂(1/ε)', ylabel: 'log₂ N(ε)', maxH: 400, ticksX: L.seq(7, (i) => [i + 1, String(i + 1)]) });
      const yk = Math.log2(Nk);
      g.line([[0.4, fit.intercept + 0.4 * fit.slope], [7.6, fit.intercept + 7.6 * fit.slope]], { c: 'c1', w: 2, layer: 'under' });
      g.line([[0.4, yk + (0.4 - k) * dth], [7.6, yk + (7.6 - k) * dth]], { c: 'c4', w: 1.6, dash: '5 3', layer: 'under' });
      st.rows.forEach(([kk, nn]) => g.dot(kk, Math.log2(nn), kk >= ka && kk <= kb ? { c: 'c1', r: 4.5 } : { c: 'c1', r: 4.5, hollow: true }));
      g.vline(k, { c: 'hl', w: 1, dash: '3 3', op: 0.7, layer: 'under' });
      g.handle(k, yk, { c: 'hl', axis: 'x', snap: 1, label: T('Box size exponent k', '箱の大きさの指数 k'), bounds: [1, KMAX, 0, 14], onDrag: (x) => ctx.set('k', Math.round(x)) });
      g.text(k, yk, `N = ${Nk}`, { c: 'hl', dx: k >= 6 ? -14 : 14, dy: k >= 6 ? 30 : 20, anchor: k >= 6 ? 'end' : 'start', layer: 'over' });
      g.text(7.5, 0.9, T(`fit ${fmt(fit.slope, 3)}, theory ${fmt(dth, 3)}`, `フィット ${fmt(fit.slope, 3)}、理論値 ${fmt(dth, 3)}`), { small: true, c: 'muted', anchor: 'end' });
      L.legend(ctx.host, [{ c: 'c1', label: T('the set, and the least-squares line through the filled points', '集合と、塗った点を通る最小二乗直線') }, { c: 'hl', kind: 'fill', label: T('occupied boxes at the chosen ε', '選んだ ε で占有された箱') }, { c: 'c4', dash: true, label: T('theoretical slope d through the chosen point', '理論値の傾き d を選んだ点に通した直線') }]);
      const resid = fit.slope - dth;
      ctx.readout([
        { k: T('set', '集合'), v: T(...SET_NAME[kind]) },
        { k: 'ε', v: `2⁻${'⁰¹²³⁴⁵⁶⁷'[k]} = ${fmt(eps, 4)}` },
        { k: 'N(ε)', v: String(Nk), tone: 'key' },
        { k: T('fitted slope', 'フィットした傾き'), v: fmt(fit.slope, 4), tone: 'good' },
        { k: T('theoretical d', '理論値 d'), v: fmt(dth, 4) },
        { k: T('residual', '残差'), v: fmt(resid, 4), tone: Math.abs(resid) > 0.1 ? 'warn' : undefined },
      ], [
        T('The Koch curve is exactly self-similar, so log N(ε) is close to a straight line at every scale shown; only the coarsest boxes, which see the curve as a segment, pull the slope down.', 'コッホ曲線は厳密に自己相似なので、示したすべてのスケールで log N(ε) はほぼ直線です。曲線を線分としてしか見ない最も粗い箱だけが傾きを引き下げます。'),
        T('The triangle is drawn by 40,000 chaos-game points. At the finest grid a few of the 3⁷ = 2187 boxes may be missed by chance, which lowers N slightly.', '三角形は 40,000 点のカオスゲームで描いています。最も細かい格子では 3⁷ = 2187 個の箱のうち数個が偶然に取りこぼされ、N がわずかに小さくなることがあります。'),
        T('The graph of Brownian motion has box dimension 3/2 in the limit. This trace has 4096 steps, so below the step it is a polyline of dimension 1: fit over the fine scales to see the slope drift.', 'ブラウン運動のグラフは極限で箱次元 3/2 をもちます。この軌跡は 4096 ステップなので、ステップより細かいところでは次元 1 の折れ線です。細かいスケールでフィットすると傾きがずれるのが分かります。'),
        T('A circle is a smooth curve: N(ε) grows like the length divided by ε, so the slope is 1 and the residual is the finite-scale error of the count itself.', '円は滑らかな曲線です。N(ε) は長さを ε で割ったように増えるので傾きは 1 で、残差は数え上げ自体の有限スケールの誤差です。'),
      ][kind]);
    },
  };

  /* ---------- 3. Julia sets from the Mandelbrot set ---------- */
  const PRESET_NAME = [['free', '自由'], ['main cardioid, c = 0', '主心臓形、c = 0'], ['period-2 bulb, c = −1', '周期 2 の球根、c = −1'], ['Douady rabbit', 'ドゥアディの兎'], ['dendrite, c = i', '樹状、c = i'], ['Cantor dust', 'カントール塵']];
  const MX0 = -2.15, MX1 = 0.75, MY0 = -1.25, MY1 = 1.25, MITER = 160, GW = 348, GH = 300;
  D['julia-mandelbrot'] = {
    render(ctx, v) {
      const st = ctx.state;
      let cr = v.cr, ci = v.ci;
      if (v.preset !== 0 && st.preset !== v.preset) { [cr, ci] = PRESETS[v.preset]; ctx.set('cr', cr, true); ctx.set('ci', ci, true); }
      st.preset = v.preset;
      const col = L.colours();
      if (!st.mgrid) {
        const g = new Float32Array(GW * GH);
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) g[j * GW + i] = smoothEscape(0, 0, MX0 + (i + 0.5) / GW * (MX1 - MX0), MY1 - (j + 0.5) / GH * (MY1 - MY0), MITER);
        st.mgrid = g;
      }
      const shade = (nu) => { if (nu < 0) return col.ink; const t = Math.pow(clamp(nu / 40, 0, 1), 0.5); const band = 0.72 + 0.28 * Math.cos(1.2 * nu); return mixc(col.plate, col.c1, (0.12 + 0.88 * t) * band); };
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The parameter plane: the Mandelbrot set M (solid) and, outside it, the continuous escape time of the orbit of 0. Drag c.', 'パラメータ平面です。マンデルブロ集合 M（塗りつぶし）と、その外側では 0 の軌道の連続的な脱出時間を示します。c をドラッグできます。'));
      const f = L.fig(c1, { x: [MX0, MX1], y: [MY0, MY1], equal: true, xlabel: 'Re c', ylabel: 'Im c', maxH: 400 });
      f.raster((x, y) => { const i = clamp(Math.floor((x - MX0) / (MX1 - MX0) * GW), 0, GW - 1), j = clamp(Math.floor((MY1 - y) / (MY1 - MY0) * GH), 0, GH - 1); return shade(st.mgrid[j * GW + i]); }, { res: 2 });
      f.handle(cr, ci, { c: 'hl', label: T('Parameter c', 'パラメータ c'), bounds: [MX0 + 0.02, MX1 - 0.02, MY0 + 0.02, MY1 - 0.02], onDrag: (x, y) => { st.preset = 0; ctx.set('preset', 0, true); ctx.set('cr', x, true); ctx.set('ci', y, true); ctx.redraw(); } });
      f.text(cr, ci, 'c', { math: true, c: 'hl', dx: 12, dy: -10, anchor: 'start', layer: 'over' });

      const esc = escape(cr, ci, 500), per = esc.escaped ? null : period(cr, ci);
      L.h('p', 'lab-cap', c2, T('The dynamical plane: the filled Julia set K(c) of z² + c (solid), with the attracting cycle marked when the orbit of 0 settles on one.', '力学平面です。z² + c の充填ジュリア集合 K(c)（塗りつぶし）と、0 の軌道が落ち着いたときの吸引的周期軌道を示します。'));
      const JX = 1.75, JY = 1.5, g = L.fig(c2, { x: [-JX, JX], y: [-JY, JY], equal: true, xlabel: 'Re z', ylabel: 'Im z', maxH: 400 });
      const jshade = (nu) => { if (nu < 0) return col.c1; const t = Math.pow(clamp(nu / 30, 0, 1), 0.7); return mixc(col.plate, col.c1, 0.5 * t); };
      g.raster((x, y) => jshade(smoothEscape(x, y, cr, ci, 80)), { res: 3 });
      if (per) { per.cycle.forEach(([x, y], i) => { g.dot(x, y, { c: 'hl', r: 5 }); if (per.p <= 8) g.text(x, y, `z${'₀₁₂₃₄₅₆₇'[i]}`, { small: true, c: 'hl', dx: 9, dy: -8, anchor: 'start', layer: 'over' }); }); if (per.p > 1 && per.p <= 8) g.line(per.cycle.concat([per.cycle[0]]), { c: 'hl', w: 1, dash: '3 3', op: 0.8 }); }
      L.legend(ctx.host, [{ c: 'ink', kind: 'fill', label: T('M: the orbit of 0 stays bounded', 'M：0 の軌道が有界にとどまる') }, { c: 'c1', kind: 'fill', label: T('K(c): points whose orbit stays bounded', 'K(c)：軌道が有界にとどまる点') }, { c: 'hl', kind: 'dot', label: T('c, and the cycle the orbit of 0 reaches', 'c と、0 の軌道が到達する周期軌道') }]);
      const cs = `${fmt(cr, 3)} ${ci < 0 ? '−' : '+'} ${fmt(Math.abs(ci), 3)}i`;
      const items = [
        { k: 'c', v: cs, tone: 'key' },
        { k: T('preset', '既定値'), v: T(...PRESET_NAME[v.preset]) },
        { k: T('orbit of 0', '0 の軌道'), v: esc.escaped ? T(`|zₙ| > 2 after ${esc.n} ${esc.n === 1 ? 'step' : 'steps'}`, `${esc.n} 回で |zₙ| > 2`) : T('bounded for 500 steps', '500 回まで有界'), tone: esc.escaped ? 'warn' : 'good' },
        { k: 'K(c)', v: esc.escaped ? T('Cantor dust (c ∉ M)', 'カントール塵（c ∉ M）') : T('connected (c ∈ M)', '連結（c ∈ M）') },
      ];
      if (per) items.push({ k: T('period of the cycle', '周期軌道の周期'), v: String(per.p) }, { k: '|λ| = |Π 2zₖ|', v: fmt(per.lambda, 4), tone: per.lambda < 1 ? 'good' : 'warn' });
      else if (!esc.escaped) items.push({ k: T('cycle', '周期軌道'), v: T('none found (period > 64 or chaotic)', '見つからず（周期 > 64 か混沌的）') });
      const note = esc.escaped
        ? T('The critical point escapes, so every equipotential inside the critical value pinches: K(c) falls apart into a totally disconnected Cantor set, and the raster shows only dust. Drag c back into M to reconnect it.', '臨界点が脱出するので、臨界値より内側の等ポテンシャル線はすべてくびれます。K(c) は完全不連結なカントール集合に崩れ、点描には塵しか映りません。c を M の中へ戻すと再びつながります。')
        : per && per.lambda < 1
          ? T(`The orbit of 0 is drawn into an attracting cycle of period ${per.p} with multiplier |λ| = ${fmt(per.lambda, 3)} < 1: c sits in a hyperbolic component of M, and K(c) has interior around each point of the cycle.`, `0 の軌道は乗数 |λ| = ${fmt(per.lambda, 3)} < 1 の周期 ${per.p} の吸引的周期軌道に引き込まれます。c は M の双曲成分の中にあり、K(c) は周期軌道の各点のまわりに内部をもちます。`)
          : per
            ? T(`The orbit of 0 lands exactly on a cycle of period ${per.p}, but |λ| = ${fmt(per.lambda, 3)} > 1: the cycle is repelling, c is a Misiurewicz point on the boundary of M, and K(c) has empty interior.`, `0 の軌道は周期 ${per.p} の周期軌道にちょうど落ちますが、|λ| = ${fmt(per.lambda, 3)} > 1 なので反発的です。c は M の境界上のミシュレヴィッチ点で、K(c) は内部をもちません。`)
            : T('The orbit stays bounded but settles on no short cycle: c is near the boundary of M or in a bulb of high period, and the classification by this readout is inconclusive.', '軌道は有界ですが短い周期軌道には落ち着きません。c は M の境界の近くか高い周期の球根の中にあり、この表示だけでは判定できません。');
      ctx.readout(items, note);
    },
  };

  /* ---------- 4. L-systems ---------- */
  const LS_NAME = [['Koch curve', 'コッホ曲線'], ['dragon curve', 'ドラゴン曲線'], ['Sierpinski arrowhead', 'シェルピンスキーのアローヘッド'], ['plant', '植物']];
  D['l-systems'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, S = LSYS[v.sys];
      if (st.sys !== v.sys) { if (st.sys !== undefined) ctx.set('angle', S.angle, true); st.sys = v.sys; }
      const angle = st.sys === v.sys && v.angle !== undefined ? v.angle : S.angle, n = S.iter(v.level);
      const key = `${v.sys}|${n}|${angle}`;
      if (st.key !== key) { st.str = expand(S.axiom, S.rules, n); st.tt = turtle(st.str, angle, S.draw, S.heading); st.key = key; }
      const tt = st.tt, [bx0, bx1, by0, by1] = tt.box, w = Math.max(bx1 - bx0, 1e-9), h = Math.max(by1 - by0, 1e-9), m = 0.05 * Math.max(w, h);
      const wide = w > 1.3 * h;
      L.h('p', 'lab-cap', ctx.host, T(`${T(...LS_NAME[v.sys])}, ${n} ${n === 1 ? 'rewriting step' : 'rewriting steps'}, drawn with δ = ${angle}°. The string has ${st.str.length.toLocaleString()} symbols.`, `${T(...LS_NAME[v.sys])}、書き換え ${n} 回、δ = ${angle}° で描画。文字列は ${st.str.length.toLocaleString()} 記号です。`));
      const f = L.fig(ctx.host, { x: [bx0 - m, bx1 + m], y: [by0 - m, by1 + m], equal: true, axes: false, maxH: wide ? 320 : 460 });
      const width = tt.segs > 6000 ? 0.7 : tt.segs > 1500 ? 1 : 1.6;
      const drawUpto = (k) => { f.clear('main'); const pts = k >= tt.pts.length ? tt.pts : tt.pts.slice(0, k); f.line(pts, { c: v.sys === 3 ? 'c3' : 'c1', w: width, layer: 'main' }); if (k < tt.pts.length) { const last = pts[pts.length - 1] || pts[pts.length - 2]; if (last) f.dot(last[0], last[1], { c: 'hl', r: 4, layer: 'over' }); } else f.clear('over'); };
      drawUpto(Infinity);
      const total = tt.pts.length, DUR = 6;
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const k = Math.min(total, Math.floor(total * Math.min(1, t / DUR))); drawUpto(k); lab.textContent = T(`${Math.min(k, tt.segs).toLocaleString()} segments`, `${Math.min(k, tt.segs).toLocaleString()} 線分`); if (k >= total) return false; }, { autoplay: false, once: true, initialT: DUR + 1, duration: DUR + 1, playLabel: T('Draw with the turtle', 'タートルで描く') });
      const dim = lsystemDim(S.copies, S.scale), span = Math.hypot(tt.end[0], tt.end[1]);
      const rulesTxt = Object.entries(S.rules).map(([k, r]) => `${k} → ${r}`).join(',  ');
      ctx.readout([
        { k: T('rules', '規則'), v: rulesTxt, tone: 'key' },
        { k: T('segments', '線分の数'), v: tt.segs.toLocaleString() },
        { k: T('end-to-end span (unit steps)', '両端の距離（単位長）'), v: fmt(span, 2) },
        { k: T('copies, scale factor', '写しの数、縮尺'), v: S.copies ? `${S.copies}, ${fmt(S.scale, 3)}` : T('not self-similar', '自己相似ではない') },
        { k: T('similarity dimension', '相似次元'), v: dim === null ? '·' : fmt(dim, 4), tone: dim === null ? 'warn' : 'good' },
        { k: T('log(segments) / log(span)', 'log(線分の数) / log(距離)'), v: span > 1 && tt.segs > 1 ? fmt(Math.log(tt.segs) / Math.log(span), 4) : '·' },
      ], angle === S.angle
        ? [T('Each rewriting replaces every step by the four-step generator scaled by 1/3: the drawing is the level-n approximation of the Koch curve, and log(segments)/log(span) is already log 4 / log 3 at every level.', '書き換えのたびに各ステップは 1/3 に縮めた四ステップの生成子で置き換えられます。描画はコッホ曲線のレベル n の近似で、log(線分の数)/log(距離) はどのレベルでも log 4 / log 3 です。'),
          T('The dragon: fold a strip of paper in half n times and open every fold to a right angle. Each level is two copies of the previous one, rotated 45° and scaled by 1/√2, which is why the ratio of log(segments) to log(span) is exactly 2.', 'ドラゴン曲線は、紙の帯を n 回半分に折り、すべての折り目を直角に開いたものです。各レベルは前のレベルを 45° 回転して 1/√2 に縮めた写し二つなので、log(線分の数) と log(距離) の比はちょうど 2 です。'),
          T('Two symbols, A and B, both draw, and the rules for them are mirror images: the curve alternates its handedness at every level and converges to the Sierpinski triangle, with the same dimension log 3 / log 2 as the chaos game gave.', '二つの記号 A と B はどちらも描画し、その規則は互いに鏡像です。曲線はレベルごとに向きを反転させながらシェルピンスキーの三角形へ収束し、次元はカオスゲームで得た log 3 / log 2 と同じです。'),
          T('X carries the branching structure and draws nothing; F → FF stretches every existing segment while X sprouts new branches, so old growth lengthens as new growth appears, as in a real plant. The brackets return the turtle to the branch point.', 'X は枝分かれの構造を担い、何も描きません。F → FF は既存のすべての線分を引き伸ばし、X は新しい枝を芽吹かせるので、実際の植物のように新しい成長が現れる間に古い部分が長くなります。括弧はタートルを分岐点へ戻します。')][v.sys]
        : T(`With δ = ${angle}° instead of ${S.angle}° the rewriting is unchanged but the geometry is not: the pieces no longer fit end to end as scaled copies, so the similarity dimension no longer applies to the drawing.`, `δ を ${S.angle}° ではなく ${angle}° にしても書き換えは同じですが幾何は変わります。部分はもはや縮小した写しとして端と端で接がらないので、相似次元はこの描画には当てはまりません。`));
    },
  };

  /* ---------- 5. Newton's method and its basins ---------- */
  const NX = 2.1, NY = 1.6, NRES = 320;
  D['newton-fractal'] = {
    render(ctx, v) {
      const st = ctx.state, col = L.colours(), maxIter = v.iter;
      if (v.preset !== 2) st.roots = (v.preset === 0 ? ROOTS_UNITY : ROOTS_CYCLE).map((r) => r.slice());
      else st.roots ||= ROOTS_UNITY.map((r) => r.slice());
      const roots = st.roots, tones = [col.c1, col.c2, col.c3], ink = col.ink, plate = col.plate;
      const shade = (k, n) => { if (k < 0) return ink; const t = Math.pow(clamp(n / Math.max(8, maxIter * 0.7), 0, 1), 0.6); return mixc(tones[k], plate, 0.15 + 0.6 * t); };
      L.h('p', 'lab-cap', ctx.host, T('Each point coloured by the root Newton’s method reaches from it, lighter the more steps it takes; black where no root is reached. Drag the roots and the start point z₀.', '各点を、そこから始めたニュートン法が到達する根で色分けし、歩数が多いほど薄くしています。どの根にも到達しなければ黒です。根と出発点 z₀ をドラッグできます。'));
      const f = L.fig(ctx.host, { x: [-NX, NX], y: [-NY, NY], equal: true, xlabel: 'Re z', ylabel: 'Im z', maxH: 470 });
      f.raster((x, y) => { const r = newtonRun(x, y, roots, maxIter, 1e-4); return shade(r.root, r.n); }, { res: 2 });
      const run = newtonRun(v.x0, v.y0, roots, maxIter, 1e-6, true);
      f.line(run.orbit, { c: 'hl', w: 1.6, op: 0.9, layer: 'over' });
      run.orbit.slice(1).forEach(([x, y], i) => f.dot(x, y, { c: 'hl', r: i === run.orbit.length - 2 ? 4 : 2.5, layer: 'over' }));
      roots.forEach((r, k) => f.handle(r[0], r[1], { c: ['c1', 'c2', 'c3'][k], r: 8, label: T(`Root ${k + 1}`, `根 ${k + 1}`), bounds: [-NX + 0.05, NX - 0.05, -NY + 0.05, NY - 0.05], onDrag: (x, y) => { if (v.preset !== 2) ctx.set('preset', 2, true); st.roots[k] = [Math.round(x * 100) / 100, Math.round(y * 100) / 100]; ctx.redraw(); } }));
      roots.forEach((r, k) => f.text(r[0], r[1], `r${'₁₂₃'[k]}`, { c: ['c1', 'c2', 'c3'][k], dx: 13, dy: -10, anchor: 'start', layer: 'over' }));
      f.handle(v.x0, v.y0, { c: 'hl', r: 7, label: T('Start point z₀', '出発点 z₀'), bounds: [-2, 2, -1.55, 1.55], onDrag: (x, y) => { ctx.set('x0', x, true); ctx.set('y0', y, true); ctx.redraw(); } });
      f.text(v.x0, v.y0, 'z₀', { c: 'hl', dx: 11, dy: 16, anchor: 'start', layer: 'over' });
      if (v.preset === 1) { [[0, 0], [1, 0]].forEach(([x, y], i) => { f.dot(x, y, { c: 'ink', r: 4, hollow: true, layer: 'over' }); f.text(x, y, i ? '1' : '0', { small: true, c: 'ink', dx: 0, dy: -9, layer: 'over' }); }); f.line([[0, 0], [1, 0]], { c: 'ink', w: 1, dash: '3 3', op: 0.7, layer: 'over' }); }
      if (!st.frac || st.fracKey !== `${roots.flat().join(',')}|${maxIter}`) { st.frac = basinFractions(roots, [-NX, NX, -NY, NY], 90, maxIter); st.fracKey = `${roots.flat().join(',')}|${maxIter}`; }
      const fr = st.frac, rootTxt = (r) => `${fmt(r[0], 2)} ${r[1] < 0 ? '−' : '+'} ${fmt(Math.abs(r[1]), 2)}i`;
      L.legend(ctx.host, roots.map((r, k) => ({ c: ['c1', 'c2', 'c3'][k], kind: 'fill', label: T(`basin of r${'₁₂₃'[k]} = ${rootTxt(r)}`, `r${'₁₂₃'[k]} = ${rootTxt(r)} の吸引域`) })).concat([{ c: 'ink', kind: 'fill', label: T('no root reached', 'どの根にも到達せず') }, { c: 'hl', kind: 'dot', label: T('the orbit of z₀', 'z₀ の軌道') }]));
      ctx.readout([
        { k: 'z₀', v: rootTxt([v.x0, v.y0]), tone: 'key' },
        { k: T('orbit of z₀', 'z₀ の軌道'), v: run.root >= 0 ? T(`reaches r${'₁₂₃'[run.root]} in ${run.n} steps (|z − r| < 10⁻⁶)`, `${run.n} 歩で r${'₁₂₃'[run.root]} に到達（|z − r| < 10⁻⁶）`) : T(`no root within ${maxIter} steps`, `${maxIter} 歩以内にどの根にも到達せず`), tone: run.root >= 0 ? 'good' : 'warn' },
        { k: T('basin areas r₁, r₂, r₃ (this view)', '吸引域の面積 r₁、r₂、r₃（この表示範囲）'), v: fr.slice(0, 3).map((x) => fmt(100 * x, 1) + '%').join(', ') },
        { k: T('no root', '根なし'), v: fmt(100 * fr[3], 1) + '%', tone: fr[3] > 0.01 ? 'warn' : undefined },
        { k: T('N(z) − r near a root', '根の近くでの N(z) − r'), v: T('∝ (z − r)²: quadratic convergence', '∝ (z − r)²：二次収束') },
      ], v.preset === 1
        ? T('For z³ − 2z + 2, N(0) = 1 and N(1) = 0: the cycle {0, 1} is superattracting for Newton’s map and its basin, in black, is a small open set around each of the two points (about 0.8% of this view, with infinitely many smaller preimages) with its own fractal boundary. Starting there, Newton’s method oscillates for ever.', 'z³ − 2z + 2 では N(0) = 1 かつ N(1) = 0 です。周期軌道 {0, 1} はニュートン写像にとって超吸引的で、その吸引域（黒）は二つの点それぞれのまわりの小さな開集合（この表示範囲のおよそ 0.8% で、さらに無限個の小さな逆像があります）で、独自のフラクタルな境界をもちます。そこから始めるとニュートン法は永遠に振動します。')
        : run.root >= 0 && run.n <= 6
          ? T(`z₀ is well inside a basin: ${run.n} steps to six decimals, with the error roughly squared at every step once the orbit is close.`, `z₀ は吸引域の内部にあります。小数六桁まで ${run.n} 歩で、軌道が近づいてからは誤差が一歩ごとにほぼ二乗されます。`)
          : T('Near the boundary the orbit is thrown around before it settles: every neighbourhood of a boundary point contains starts that end at each of the three roots, so the colour at z₀ is decided by digits far down its expansion.', '境界の近くでは軌道は落ち着く前に振り回されます。境界点のどんな近傍にも三つの根それぞれに終わる出発点が含まれるので、z₀ の色はその展開のはるか下の桁で決まります。'));
    },
  };
})();
