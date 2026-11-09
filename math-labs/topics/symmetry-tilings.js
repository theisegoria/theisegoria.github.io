'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, PHI = (1 + Math.sqrt(5)) / 2, S3 = Math.sqrt(3);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * The 17 wallpaper groups in the standard settings of the International Tables, Vol. A: each group is a lattice
   * (basis a1, a2) and a list of coset representatives (W, w) acting on fractional coordinates, f -> W f + w; centered
   * cells add the centring translation (1/2, 1/2). In Cartesian coordinates the linear part is B W B^-1 with B = [a1 a2],
   * which must be orthogonal. Symmetry elements are read off from the operations themselves: a rotation x -> A x + t has
   * its center where (I - A) c = t; a reflection with axis direction d and normal n has its line at (t.n/2) n, and the
   * component t.d is its glide (zero for a mirror). Penrose rhombus tilings come from Robinson-triangle deflation.
   */
  const LAT = {
    oblique: [[1, 0], [0.32, 0.9]],
    rect: [[1, 0], [0, 0.78]],
    crect: [[1.2, 0], [0, 0.82]],
    square: [[1, 0], [0, 1]],
    hex: [[1, 0], [-0.5, S3 / 2]],
  };
  const op = (a, b, c, d, w1 = 0, w2 = 0) => ({ W: [[a, b], [c, d]], w: [w1, w2] });
  const h = 0.5;
  const P4 = [op(1, 0, 0, 1), op(-1, 0, 0, -1), op(0, -1, 1, 0), op(0, 1, -1, 0)];
  const P3 = [op(1, 0, 0, 1), op(0, -1, 1, -1), op(-1, 1, -1, 0)];
  const M31 = [op(0, 1, 1, 0), op(1, -1, 0, -1), op(-1, 0, -1, 1)];      // p31m mirrors: (y,x), (x-y,-y), (-x,-x+y)
  const M3_1 = [op(0, -1, -1, 0), op(-1, 1, 0, 1), op(1, 0, 1, -1)];      // p3m1 mirrors: (-y,-x), (-x+y,y), (x,x-y)
  const R6 = [op(-1, 0, 0, -1), op(0, 1, -1, 1), op(1, -1, 1, 0)];        // (-x,-y), (y,-x+y), (x-y,x)
  const centre = (ops) => [...ops, ...ops.map((o) => ({ W: o.W, w: [o.w[0] + h, o.w[1] + h] }))];
  const GROUPS = [
    { id: 'p1', lat: 'oblique', ops: [op(1, 0, 0, 1)] },
    { id: 'p2', lat: 'oblique', ops: [op(1, 0, 0, 1), op(-1, 0, 0, -1)] },
    { id: 'pm', lat: 'rect', ops: [op(1, 0, 0, 1), op(-1, 0, 0, 1)] },
    { id: 'pg', lat: 'rect', ops: [op(1, 0, 0, 1), op(-1, 0, 0, 1, 0, h)] },
    { id: 'cm', lat: 'crect', ops: centre([op(1, 0, 0, 1), op(-1, 0, 0, 1)]) },
    { id: 'pmm', lat: 'rect', ops: [op(1, 0, 0, 1), op(-1, 0, 0, -1), op(-1, 0, 0, 1), op(1, 0, 0, -1)] },
    { id: 'pmg', lat: 'rect', ops: [op(1, 0, 0, 1), op(-1, 0, 0, -1), op(-1, 0, 0, 1, h, 0), op(1, 0, 0, -1, h, 0)] },
    { id: 'pgg', lat: 'rect', ops: [op(1, 0, 0, 1), op(-1, 0, 0, -1), op(-1, 0, 0, 1, h, h), op(1, 0, 0, -1, h, h)] },
    { id: 'cmm', lat: 'crect', ops: centre([op(1, 0, 0, 1), op(-1, 0, 0, -1), op(-1, 0, 0, 1), op(1, 0, 0, -1)]) },
    { id: 'p4', lat: 'square', ops: P4 },
    { id: 'p4m', lat: 'square', ops: [...P4, op(-1, 0, 0, 1), op(1, 0, 0, -1), op(0, 1, 1, 0), op(0, -1, -1, 0)] },
    { id: 'p4g', lat: 'square', ops: [...P4, op(-1, 0, 0, 1, h, h), op(1, 0, 0, -1, h, h), op(0, 1, 1, 0, h, h), op(0, -1, -1, 0, h, h)] },
    { id: 'p3', lat: 'hex', ops: P3 },
    { id: 'p3m1', lat: 'hex', ops: [...P3, ...M3_1] },
    { id: 'p31m', lat: 'hex', ops: [...P3, ...M31] },
    { id: 'p6', lat: 'hex', ops: [...P3, ...R6] },
    { id: 'p6m', lat: 'hex', ops: [...P3, ...R6, ...M3_1, ...M31] },
  ];
  const basis = (g) => LAT[g.lat];
  const inv2 = (m) => { const d = m[0][0] * m[1][1] - m[0][1] * m[1][0]; return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]]; };
  const mul2 = (a, b) => [[a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]], [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]]];
  const app = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
  // Cartesian form x -> A x + t of a fractional operation, B having the basis vectors as columns
  function cart(g) {
    const [a1, a2] = basis(g), B = [[a1[0], a2[0]], [a1[1], a2[1]]], Bi = inv2(B);
    return { B, Bi, ops: g.ops.map((o) => ({ A: mul2(mul2(B, o.W), Bi), t: app(B, o.w), det: o.W[0][0] * o.W[1][1] - o.W[0][1] * o.W[1][0] })) };
  }
  // composition closure: W1 W2, W1 w2 + w1 must equal some listed op modulo integer translations
  function closes(g) {
    const fr = (x) => x - Math.round(x);
    for (const p of g.ops) for (const q of g.ops) {
      const W = mul2(p.W, q.W), w = app(p.W, q.w).map((x, i) => x + p.w[i]);
      if (!g.ops.some((o) => o.W.every((r, i) => r.every((x, j) => x === W[i][j])) && Math.abs(fr(o.w[0] - w[0])) < 1e-9 && Math.abs(fr(o.w[1] - w[1])) < 1e-9)) return false;
    }
    return true;
  }
  // symmetry elements visible in a window: rotation centers with their order, mirror lines and glide lines
  function elements(g, win, R = 4) {
    const C = cart(g), rot = new Map(), lines = new Map();
    for (const o of C.ops) {
      const A = o.A, isId = Math.abs(A[0][0] - 1) < 1e-9 && Math.abs(A[1][1] - 1) < 1e-9 && Math.abs(A[0][1]) < 1e-9;
      if (isId) continue;
      for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
        const t = [o.t[0] + i * C.B[0][0] + j * C.B[0][1], o.t[1] + i * C.B[1][0] + j * C.B[1][1]];
        if (o.det > 0) {
          const th = Math.atan2(A[1][0], A[0][0]), ord = Math.round(TAU / Math.abs(th));
          const M = [[1 - A[0][0], -A[0][1]], [-A[1][0], 1 - A[1][1]]], c = app(inv2(M), t);
          if (c[0] < win[0] - 0.05 || c[0] > win[1] + 0.05 || c[1] < win[2] - 0.05 || c[1] > win[3] + 0.05) continue;
          const key = `${Math.round(c[0] * 1e5)}|${Math.round(c[1] * 1e5)}`;
          rot.set(key, { c, n: Math.max(ord, rot.get(key)?.n ?? 0) });
        } else {
          const ph = Math.atan2(A[1][0], A[0][0]) / 2, d = [Math.cos(ph), Math.sin(ph)], nn = [-d[1], d[0]];
          const off = (t[0] * nn[0] + t[1] * nn[1]) / 2, gl = t[0] * d[0] + t[1] * d[1];
          let phk = ph, o2 = off; if (phk < -1e-9) { phk += PI; o2 = -o2; } if (Math.abs(phk - PI) < 1e-9 || Math.abs(phk) < 1e-9) phk = 0;
          const key = `${Math.round(phk * 1e6)}|${Math.round(o2 * 1e5)}`;
          const prev = lines.get(key), mirror = Math.abs(gl) < 1e-7;
          lines.set(key, { phi: phk, off: o2, mirror: (prev?.mirror ?? false) || mirror });
        }
      }
    }
    return { rot: [...rot.values()], lines: [...lines.values()] };
  }
  // the point group order and the highest rotation order
  const pointOrder = (g) => g.ops.length / (g.lat === 'crect' ? 2 : 1);
  function maxRot(g) { let m = 1; for (const o of cart(g).ops) if (o.det > 0) { const th = Math.atan2(o.A[1][0], o.A[0][0]); if (Math.abs(th) > 1e-9) m = Math.max(m, Math.round(TAU / Math.abs(th))); } return m; }
  const hasReflection = (g) => g.ops.some((o) => o.W[0][0] * o.W[1][1] - o.W[0][1] * o.W[1][0] < 0);

  /* crystallographic restriction: a rotation preserving a lattice has an integer trace in the lattice basis; in the plane
   * that trace is 2 cos(2 pi / n), an integer only for n = 1, 2, 3, 4, 6 */
  const trace2 = (n) => 2 * Math.cos(TAU / n);
  const allowed = (n) => Math.abs(trace2(n) - Math.round(trace2(n))) < 1e-9;
  const LAT3 = {
    cubic: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    hex: [[1, 0, 0], [-0.5, S3 / 2, 0], [0, 0, 1.25]],
  };
  const AXES = { '001': [0, 0, 1], '111': [1, 1, 1], '110': [1, 1, 0] };
  function rotMat(u, th) {
    const n = Math.hypot(...u), [x, y, z] = u.map((q) => q / n), c = Math.cos(th), s = Math.sin(th), C1 = 1 - c;
    return [[c + x * x * C1, x * y * C1 - z * s, x * z * C1 + y * s], [y * x * C1 + z * s, c + y * y * C1, y * z * C1 - x * s], [z * x * C1 - y * s, z * y * C1 + x * s, c + z * z * C1]];
  }
  const mv3 = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
  function inv3(m) {
    const [a, b, c] = m[0], [d, e, f] = m[1], [g, hh, i] = m[2], A = e * i - f * hh, B = -(d * i - f * g), C = d * hh - e * g, det = a * A + b * B + c * C;
    return [[A / det, -(b * i - c * hh) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * hh - b * g) / det, (a * e - b * d) / det]];
  }
  // lattice points within radius rad of the origin (Cartesian), basis vectors as rows
  function latticePts(lat, rad) {
    const b = LAT3[lat], out = [], K = Math.ceil(rad / 0.8) + 1;
    for (let i = -K; i <= K; i++) for (let j = -K; j <= K; j++) for (let k = -K; k <= K; k++) {
      const p = [i * b[0][0] + j * b[1][0] + k * b[2][0], i * b[0][1] + j * b[1][1] + k * b[2][1], i * b[0][2] + j * b[1][2] + k * b[2][2]];
      if (Math.hypot(...p) <= rad + 1e-9) out.push(p);
    }
    return out;
  }
  const onLattice = (lat, p) => { const b = LAT3[lat], Bt = [[b[0][0], b[1][0], b[2][0]], [b[0][1], b[1][1], b[2][1]], [b[0][2], b[1][2], b[2][2]]], f = mv3(inv3(Bt), p); return f.every((x) => Math.abs(x - Math.round(x)) < 1e-6); };
  function restriction(lat, axis, n, rad = 2.6) {
    const R = rotMat(AXES[axis] ?? [0, 0, 1], TAU / n), pts = latticePts(lat, rad), rot = pts.map((p) => mv3(R, p));
    const hit = rot.map((q) => onLattice(lat, q));
    return { pts, rot, hit, frac: hit.filter(Boolean).length / pts.length, sym: hit.every(Boolean) };
  }

  /* Penrose P3: Robinson triangles (kind 0 thin, 1 thick), each step deflates by the golden ratio */
  function penrose(steps) {
    let tri = [];
    for (let i = 0; i < 10; i++) {
      let B = [Math.cos(((2 * i - 1) * PI) / 10), Math.sin(((2 * i - 1) * PI) / 10)], C = [Math.cos(((2 * i + 1) * PI) / 10), Math.sin(((2 * i + 1) * PI) / 10)];
      if (i % 2 === 0) [B, C] = [C, B];
      tri.push([0, [0, 0], B, C]);
    }
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    for (let s = 0; s < steps; s++) {
      const out = [];
      for (const [k, A, B, C] of tri) {
        if (k === 0) { const P = lerp(A, B, 1 / PHI); out.push([0, C, P, B], [1, P, C, A]); }
        else { const Q = lerp(B, A, 1 / PHI), R = lerp(B, C, 1 / PHI); out.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]); }
      }
      tri = out;
    }
    return tri;
  }
  const counts = (steps) => { let a = 10, b = 0; for (let s = 0; s < steps; s++) [a, b] = [a + b, a + 2 * b]; return [a, b]; };
  function vertices(tri) {
    const m = new Map();
    for (const t of tri) for (const p of [t[1], t[2], t[3]]) m.set(`${Math.round(p[0] * 1e7)}|${Math.round(p[1] * 1e7)}`, p);
    return [...m.values()];
  }
  // diffraction intensity |sum exp(i k.r)|^2 / N^2 on a grid
  function diffraction(pts, K, n, taper = 0) {
    const I = new Float64Array(n * n), wt = pts.map((p) => (taper ? Math.exp(-(p[0] * p[0] + p[1] * p[1]) / (taper * taper)) : 1)), N = wt.reduce((a, b) => a + b, 0);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (a * n + b > (n * n - 1) / 2) { I[a * n + b] = I[n * n - 1 - (a * n + b)]; continue; }   // I(-k) = I(k)
      const kx = -K + (2 * K * b) / (n - 1), ky = -K + (2 * K * a) / (n - 1); let re = 0, im = 0;
      for (let q = 0; q < pts.length; q++) { const p = pts[q], ph = kx * p[0] + ky * p[1]; re += wt[q] * Math.cos(ph); im += wt[q] * Math.sin(ph); }
      I[a * n + b] = (re * re + im * im) / (N * N);
    }
    return I;
  }
  const M = { GROUPS, LAT, cart, closes, elements, pointOrder, maxRot, hasReflection, trace2, allowed, rotMat, latticePts, onLattice, restriction, penrose, counts, vertices, diffraction, PHI };
  (window.LabModels = window.LabModels || {})['symmetry-tilings'] = M;

  /* ================= 1. the seventeen wallpaper groups ================= */
  const NAMES = {
    p1: ['translations only', '並進だけ'], p2: ['half-turns', '半回転'], pm: ['parallel mirrors', '平行な鏡'], pg: ['parallel glides', '平行な映進'],
    cm: ['mirrors and glides alternating', '鏡と映進が交互'], pmm: ['two perpendicular mirror families', '直交する二組の鏡'], pmg: ['mirrors one way, glides the other', '一方向に鏡、もう一方向に映進'],
    pgg: ['glides both ways', '両方向に映進'], cmm: ['perpendicular mirrors, centered cell', '直交する鏡、面心の格子'], p4: ['quarter-turns', '四分の一回転'],
    p4m: ['quarter-turns on mirrors', '鏡の上の四分の一回転'], p4g: ['quarter-turns off the mirrors', '鏡から外れた四分の一回転'], p3: ['third-turns', '三分の一回転'],
    p3m1: ['third-turns, all centers on mirrors', '三分の一回転、すべての中心が鏡の上'], p31m: ['third-turns, some centers off the mirrors', '三分の一回転、一部の中心が鏡の外'],
    p6: ['sixth-turns', '六分の一回転'], p6m: ['sixth-turns and mirrors', '六分の一回転と鏡'],
  };
  const WIN = [-0.05, 3.25, -0.05, 2.45];
  function clipLine(p, d, w) {
    let t0 = -1e9, t1 = 1e9;
    for (const [pp, dd, lo, hi] of [[p[0], d[0], w[0], w[1]], [p[1], d[1], w[2], w[3]]]) {
      if (Math.abs(dd) < 1e-12) { if (pp < lo || pp > hi) return null; continue; }
      let a = (lo - pp) / dd, b = (hi - pp) / dd; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    return t1 > t0 ? [[p[0] + d[0] * t0, p[1] + d[1] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1]] : null;
  }
  function closedSpline(P, m = 14) {
    const out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    return out;
  }
  D['wallpaper'] = {
    render(ctx, v) {
      const st = ctx.state, g = GROUPS[clamp(v.grp - 1, 0, 16)], C = cart(g);
      // motif control points kept in fractional coordinates so they survive a change of lattice
      st.mf ||= [[0.34, 0.12], [0.5, 0.19], [0.39, 0.29]];
      const toC = (f) => app(C.B, f), toF = (x) => app(C.Bi, x);
      const P = st.mf.map(toC), shape = closedSpline(P);
      const f = L.fig(ctx.host, { x: [WIN[0], WIN[1]], y: [WIN[2], WIN[3]], equal: true, maxH: 520, axes: false, grid: false });
      // lattice cells
      const cellLines = [];
      for (let i = -6; i <= 8; i++) for (const [a, b] of [[C.B[0][0], C.B[1][0]], [C.B[0][1], C.B[1][1]]]) {
        const other = a === C.B[0][0] && b === C.B[1][0] ? [C.B[0][1], C.B[1][1]] : [C.B[0][0], C.B[1][0]];
        const seg = clipLine([i * other[0], i * other[1]], [a, b], WIN); if (seg) cellLines.push(seg);
      }
      for (const s of cellLines) f.seg(s[0], s[1], { c: 'muted', w: 0.7, op: 0.45, layer: 'under' });
      // copies of the motif
      let nCopies = 0;
      for (let i = -4; i <= 6; i++) for (let j = -4; j <= 6; j++) for (let k = 0; k < C.ops.length; k++) {
        const o = C.ops[k], tt = [o.t[0] + i * C.B[0][0] + j * C.B[0][1], o.t[1] + i * C.B[1][0] + j * C.B[1][1]];
        const tr = (p) => { const q = app(o.A, p); return [q[0] + tt[0], q[1] + tt[1]]; };
        const cen = tr([(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]);
        if (cen[0] < WIN[0] - 0.3 || cen[0] > WIN[1] + 0.3 || cen[1] < WIN[2] - 0.3 || cen[1] > WIN[3] + 0.3) continue;
        const home = i === 0 && j === 0 && k === 0;
        f.poly(shape.map(tr), { fill: o.det > 0 ? 'c1' : 'c2', fo: home ? 0.85 : 0.55, c: home ? 'hl' : o.det > 0 ? 'c1' : 'c2', w: home ? 2.4 : 0.8 });
        const eye = tr(P[0]); f.dot(eye[0], eye[1], { c: 'ink', r: 2.2 });
        nCopies++;
      }
      // symmetry elements
      if (v.show) {
        const E = elements(g, WIN);
        for (const l of E.lines) {
          const d = [Math.cos(l.phi), Math.sin(l.phi)], nn = [-d[1], d[0]], seg = clipLine([l.off * nn[0], l.off * nn[1]], d, WIN);
          if (seg) f.seg(seg[0], seg[1], { c: l.mirror ? 'c3' : 'c4', w: l.mirror ? 2 : 1.3, op: l.mirror ? 0.95 : 0.7, dash: l.mirror ? null : '6 5', layer: 'over' });
        }
        for (const r of E.rot) {
          const s = 0.058, k = r.n;
          if (k === 2) f.poly([[r.c[0], r.c[1] - s * 1.3], [r.c[0] + s * 0.7, r.c[1]], [r.c[0], r.c[1] + s * 1.3], [r.c[0] - s * 0.7, r.c[1]]], { fill: 'ink', fo: 1, c: 'plate', w: 1, layer: 'over' });
          else f.poly(L.seq(k, (q) => [r.c[0] + s * 1.25 * Math.cos(PI / 2 + (TAU * q) / k), r.c[1] + s * 1.25 * Math.sin(PI / 2 + (TAU * q) / k)]), { fill: k === 3 ? 'c4' : k === 4 ? 'c3' : 'hl', fo: 1, c: 'plate', w: 1, layer: 'over' });
        }
      }
      // handles on the original motif
      P.forEach((p, i) => f.handle(p[0], p[1], { c: 'hl', label: T(`motif point ${i + 1}`, `模様の点 ${i + 1}`), bounds: [WIN[0] + 0.05, WIN[1] - 0.05, WIN[2] + 0.05, WIN[3] - 0.05], onDrag: (x, y) => { st.mf[i] = toF([x, y]); ctx.redraw(); } }));
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('copies by rotations and translations', '回転と並進による複製') }, { kind: 'fill', c: 'c2', label: T('mirror-image copies (reflections, glides)', '鏡像の複製（反射、映進）') }, { c: 'c3', label: T('mirror line', '鏡映線') }, { c: 'c4', dash: true, label: T('glide line', '映進線') }, { kind: 'dot', c: 'ink', label: T('◆ 2-fold, ▲ 3-fold, ■ 4-fold, ⬢ 6-fold center', '◆ 2 回、▲ 3 回、■ 4 回、⬢ 6 回の中心') }]);
      const nm = NAMES[g.id];
      ctx.readout([
        { k: T('group (IUCr symbol)', '群（国際記号）'), v: `${v.grp}. ${g.id}: ${T(nm[0], nm[1])}`, tone: 'key' },
        { k: T('lattice', '格子'), v: T({ oblique: 'oblique', rect: 'rectangular', crect: 'centered rectangular', square: 'square', hex: 'hexagonal' }[g.lat], { oblique: '斜方', rect: '長方', crect: '面心長方', square: '正方', hex: '六方' }[g.lat]) },
        { k: T('point group order (copies per primitive cell)', '点群の位数（基本単位胞あたりの複製の数）'), v: `${pointOrder(g)}` },
        { k: T('highest rotation; reflections?', '最大の回転、反射の有無'), v: `${maxRot(g)}-${T('fold', '回')}; ${hasReflection(g) ? T('yes', 'あり') : T('none', 'なし')}` },
      ], T('Drag the three gold points to reshape the motif. However you draw it, the group dictates where every copy goes: the pattern changes, its symmetry does not.', '金色の三点をドラッグして模様の形を変えてください。どう描いても、すべての複製の行き先は群が決めます。模様は変わりますが、その対称性は変わりません。'));
    },
  };

  /* ================= 2. the crystallographic restriction (3D) ================= */
  const AXK = ['001', '111', '110'];
  D['crystal-restriction'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const lat = v.lat ? 'hex' : 'cubic', axis = v.lat ? '001' : AXK[v.axis], n = v.n, Rr = restriction(lat, axis, n);
      L.setText(st.cap1, T(tx`A crystal lattice (blue) and a copy of it turned by \(2\pi/n\) about the gold axis (orange). Where a turned point lands on a lattice point it glows gold. The turn is a symmetry of the crystal only if every point lands; try \(n=5\). Choose the lattice and, for the cube, the axis.`, tx`結晶格子（青）と、それを金色の軸のまわりに \(2\pi/n\) 回した複製（橙）です。回した点が格子点に重なると金色に光ります。結晶の対称性になるのは、すべての点が重なるときだけです。\(n=5\) を試してください。格子を選び、立方格子では軸も選べます。`));
      L.setText(st.cap2, T(tx`In the lattice basis a symmetry is an integer matrix, so its trace \(1+2\cos(2\pi/n)\) (in 3D) must be an integer. The dots are \(2\cos(2\pi/n)\); only \(n=1,2,3,4,6\) sit on the integer lines.`, tx`格子の基底で見ると対称操作は整数行列なので、そのトレース \(1+2\cos(2\pi/n)\)（3 次元）は整数でなければなりません。点は \(2\cos(2\pi/n)\) です。整数の線に乗るのは \(n=1,2,3,4,6\) だけです。`));
      const draw2d = () => {
        st.g2.replaceChildren();
        const f = L.fig(st.g2, { x: [0.5, 12.5], y: [-2.5, 2.5], aspect: 0.62, maxH: 300, xlabel: T(tx`rotation order \(n\)`, tx`回転の次数 \(n\)`), ylabel: tx`\(2\cos(2\pi/n)\)`, ticksX: L.seq(12, (i) => [i + 1, String(i + 1)]) });
        for (const k of [-2, -1, 0, 1, 2]) f.hline(k, { c: 'c3', w: 1.3, op: 0.8 });
        f.line(L.sample(1, 12.5, 300, (x) => [x, trace2(x)]), { c: 'muted', w: 1.2, dash: '3 3' });
        for (let k = 1; k <= 12; k++) f.dot(k, trace2(k), { c: allowed(k) ? 'c3' : 'c2', r: k === n ? 7 : 4.5, hollow: !allowed(k) });
        f.dot(n, trace2(n), { c: 'hl', r: 4 });
        f.handle(n, trace2(n), { c: 'hl', axis: 'x', bounds: [2, 8, -2.3, 2.3], snap: 1, label: T('rotation order', '回転の次数'), onDrag: (x) => ctx.set('n', clamp(Math.round(x), 2, 8)) });
      };
      draw2d();
      st.leg.replaceChildren(); L.legend(st.leg, [{ kind: 'dot', c: 'c1', label: T('lattice points', '格子点') }, { kind: 'dot', c: 'c2', label: T('rotated copy', '回した複製') }, { kind: 'dot', c: 'hl', label: T('rotated point lands on the lattice', '回した点が格子に重なる') }, { kind: 'dot', c: 'c3', label: T('allowed order: integer trace', '許される次数：トレースが整数') }]);
      ctx.readout([
        { k: T(tx`rotation by \(2\pi/n\)`, tx`\(2\pi/n\) の回転`), v: tx`\(n=${n},\ ${fmt(360 / n, 3)}^\circ\); ${T('axis', '軸')} \([${axis}]\)` },
        { k: T(tx`trace \(2\cos(2\pi/n)\)`, tx`トレース \(2\cos(2\pi/n)\)`), v: fmt(trace2(n), 4), tone: allowed(n) ? 'good' : 'warn' },
        { k: T('lattice points that land on lattice points', '格子点に重なる格子点'), v: `${Rr.hit.filter(Boolean).length} / ${Rr.pts.length}` },
        { k: T('a symmetry of this lattice?', 'この格子の対称操作か'), v: Rr.sym ? T('yes', 'はい') : T('no', 'いいえ'), tone: 'key' },
      ], Rr.sym ? T('Every point lands on a point: the turn maps the crystal onto itself.', 'すべての点が点に重なります。この回転は結晶をそれ自身に写します。')
        : allowed(n) ? T(tx`This order is allowed in principle, but not about this axis of this lattice: the cube has 4-fold axes along \([001]\), 3-fold along \([111]\) and 2-fold along \([110]\); the hexagonal lattice has 6-fold along its \(c\) axis.`, tx`この次数は原理的には許されますが、この格子のこの軸のまわりでは対称操作になりません。立方格子は \([001]\) に 4 回軸、\([111]\) に 3 回軸、\([110]\) に 2 回軸をもち、六方格子は \(c\) 軸に 6 回軸をもちます。`)
          : T('No lattice in any dimension up to three has this symmetry: only points on the axis itself come back.', '3 次元以下のどんな格子もこの対称性をもちません。戻ってくるのは軸上の点だけです。'));
      const u = (() => { const a = AXES[axis]; const nn = Math.hypot(...a); return a.map((q) => q / nn); })();
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 500, camera: [5.4, -7.0, 4.2], target: [0, 0, 0], fov: 32,
        label: T('3D lattice and its rotated copy. Drag to rotate the view.', '3D の格子とその回転した複製。ドラッグで視点を回せます。'),
        init(S) {
          st.flat = false;
          st.base = S.points([[0, 0, 0]], { c: '#3d6fb6', r: 0.13, max: 400, metal: 0.35, rough: 0.22, coat: 0.9 });
          st.rot = S.points([[0, 0, 0]], { c: '#e0793a', r: 0.1, max: 400, rough: 0.12, coat: 1, opacity: 0.55 });
          st.hit = S.points([[0, 0, 0]], { c: '#e8b53b', r: 0.15, max: 400, metal: 0.85, rough: 0.18, coat: 0.8, glow: 0.25 });
          // bonds between nearest neighbours as solid rods (one instanced cylinder)
          const TH = S.THREE;
          st.rods = new TH.InstancedMesh(new TH.CylinderGeometry(1, 1, 1, 14, 1, true), S.mat('#9aa3ad', { metal: 0.7, rough: 0.3, coat: 0.5 }), 1200);
          st.rods.count = 0; st.rods.castShadow = true; S.add(st.rods);
          st.ax = S.tube([[0, 0, -3], [0, 0, 3]], { r: 0.03, c: 'hl' });
          st.axLab = S.label('', [0, 0, 3.2], { small: true });
          st.arc = S.tube([[1, 0, 0], [0, 1, 0]], { r: 0.022, c: 'c4' });

        },
        update(S) {
          const R2 = restriction(v.lat ? 'hex' : 'cubic', v.lat ? '001' : AXK[v.axis], v.n), uu = (() => { const a = AXES[v.lat ? '001' : AXK[v.axis]]; const nn = Math.hypot(...a); return a.map((q) => q / nn); })();
          st.base.update(R2.pts.filter((_, i) => !R2.hit[i]));
          const bl = [], b3 = LAT3[v.lat ? 'hex' : 'cubic'];
          for (const p of R2.pts) for (const e of b3) { const q = [p[0] + e[0], p[1] + e[1], p[2] + e[2]]; if (Math.hypot(...q) <= 2.6 + 1e-9) bl.push([p, q]); }
          { const TH = S.THREE, M4 = new TH.Matrix4(), Q = new TH.Quaternion(), up = new TH.Vector3(0, 1, 0), a = new TH.Vector3(), b = new TH.Vector3(), d = new TH.Vector3(), sc = new TH.Vector3();
            bl.slice(0, 1200).forEach(([p, q], i) => { a.set(...p); b.set(...q); d.subVectors(b, a); const len = d.length(); Q.setFromUnitVectors(up, d.normalize()); sc.set(0.032, len, 0.032); M4.compose(a.clone().add(b).multiplyScalar(0.5), Q, sc); st.rods.setMatrixAt(i, M4); });
            st.rods.count = Math.min(1200, bl.length); st.rods.instanceMatrix.needsUpdate = true; }
          st.rot.update(R2.rot.filter((_, i) => !R2.hit[i]));
          st.hit.update(R2.rot.filter((_, i) => R2.hit[i]));
          st.ax.update([uu.map((q) => -3.1 * q), uu.map((q) => 3.1 * q)]);
          st.axLab.set(uu.map((q) => 3.35 * q), `[${v.lat ? '001' : AXK[v.axis]}]`);
          // an arc showing the turn 2 pi / n about the axis, at radius 1.6, offset along the axis
          const e1 = Math.abs(uu[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], p = [uu[1] * e1[2] - uu[2] * e1[1], uu[2] * e1[0] - uu[0] * e1[2], uu[0] * e1[1] - uu[1] * e1[0]], pn = Math.hypot(...p), a = p.map((q) => q / pn);
          const b = [uu[1] * a[2] - uu[2] * a[1], uu[2] * a[0] - uu[0] * a[2], uu[0] * a[1] - uu[1] * a[0]];
          st.arc.update(L.seq(41, (i) => { const t = (TAU / v.n) * (i / 40); return [0, 1, 2].map((c) => 2.9 * uu[c] + 0.8 * (Math.cos(t) * a[c] + Math.sin(t) * b[c])); }));
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, maxH: 420, axes: false, grid: false });
          const R2 = restriction(lat, '001', n), sl = (p) => Math.abs(p[2]) < 1e-9;
          R2.pts.forEach((p) => sl(p) && f.dot(p[0], p[1], { c: 'c1', r: 5 }));
          R2.rot.forEach((p, i) => sl(p) && f.dot(p[0], p[1], { c: R2.hit[i] ? 'hl' : 'c2', r: 3 }));
        },
      });
    },
  };

  /* ================= 3. Penrose tiling and its diffraction ================= */
  const pCache = {}, NG = 101;
  function pData(steps) {
    if (pCache[steps]) return pCache[steps];
    const tri = penrose(steps), vt = vertices(tri), edge = Math.pow(PHI, -steps), K = (TAU / edge) * 1.9;
    const inner = vt.slice().sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1])).slice(0, 460), r0 = Math.hypot(...inner[inner.length - 1]) * 0.5;
    return (pCache[steps] = { tri, vt, edge, K, I: diffraction(inner, K, NG, r0), nv: inner.length });
  }
  D['penrose'] = {
    render(ctx, v) {
      ctx.state.anim?.stop(); ctx.state.shown = -1;
      const steps = v.steps;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A Penrose tiling of thick and thin rhombs, grown by cutting every triangle into smaller ones in the golden ratio. It never repeats, yet every patch you see occurs again, infinitely often.', '太い菱形と細い菱形によるペンローズ・タイリングです。三角形を黄金比で小さな三角形に切り分けて育てます。決して繰り返しませんが、見えるどの部分も無限に何度も現れます。'));
      const f = L.fig(c1, { x: [-1, 1], y: [-1, 1], equal: true, maxH: 400, axes: false, grid: false });
      L.h('p', 'lab-cap', c2, T(tx`Its diffraction pattern: the intensity \(I(\mathbf k)=\bigl|\sum_j e^{i\mathbf k\cdot\mathbf r_j}\bigr|^2\) of waves scattered by the vertices. Sharp Bragg spots, the mark of long-range order, with tenfold symmetry, which no periodic crystal can have.`, tx`その回折パターンです。頂点で散乱された波の強度 \(I(\mathbf k)=\bigl|\sum_j e^{i\mathbf k\cdot\mathbf r_j}\bigr|^2\) を描いています。長距離秩序のしるしである鋭いブラッグ点が、周期的な結晶には不可能な 10 回対称で並びます。`));
      const g = L.fig(c2, { x: [-1, 1], y: [-1, 1], equal: true, maxH: 400, axes: false, grid: false });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T(tx`thick rhomb (\(72^\circ\))`, tx`太い菱形（\(72^\circ\)）`) }, { kind: 'fill', c: 'c2', label: T(tx`thin rhomb (\(36^\circ\))`, tx`細い菱形（\(36^\circ\)）`) }, { kind: 'fill', c: 'hl', label: T('diffraction intensity (log scale)', '回折強度（対数目盛）') }]);
      const draw = (s) => {
        const Dd = pData(s);
        f.clear('main'); f.clear('under');
        for (const [k, A, B, C] of Dd.tri) f.poly([A, B, C], { fill: k ? 'c1' : 'c2', fo: k ? 0.55 : 0.8, c: 'plate', w: s > 5 ? 0.3 : 0.7, layer: 'under' });
        for (const [k, A, B, C] of Dd.tri) f.seg(A, B, { c: 'ink', w: s > 5 ? 0.35 : 0.8, op: 0.55 });   // rhomb edges: the B-C side is the diagonal shared by the two halves
        for (const [k, A, B, C] of Dd.tri) f.seg(A, C, { c: 'ink', w: s > 5 ? 0.35 : 0.8, op: 0.55 });
        g.clear('under');
        const n = NG, I = Dd.I;
        g.raster((x, y) => {
          const bx = ((x + 1) / 2) * (n - 1), by = ((y + 1) / 2) * (n - 1), i0 = clamp(Math.floor(bx), 0, n - 2), j0 = clamp(Math.floor(by), 0, n - 2), tx = bx - i0, ty = by - j0;
          const val = (1 - tx) * (1 - ty) * I[j0 * n + i0] + tx * (1 - ty) * I[j0 * n + i0 + 1] + (1 - tx) * ty * I[(j0 + 1) * n + i0] + tx * ty * I[(j0 + 1) * n + i0 + 1];
          if (x * x + y * y > 1) return 0;
          return clamp(1 + Math.log10(val + 1e-9) / 2.6, 0, 1);
        }, { cmap: 'warm', res: 3 });
        const [thin, thick] = counts(s);
        ctx.readout([
          { k: T('deflation steps; triangles', 'デフレーションの回数、三角形'), v: `${s}; ${Dd.tri.length}` },
          { k: T('thick : thin triangles', '太い : 細い 三角形'), v: tx`\(${thick}:${thin}=${s ? fmt(thick / thin, 5) : '0'}\)`, tone: 'key' },
          { k: T(tx`golden ratio \(\varphi=(1+\sqrt5)/2\)`, tx`黄金比 \(\varphi=(1+\sqrt5)/2\)`), v: fmt(PHI, 6) },
          { k: T('vertices used for diffraction', '回折に使った頂点'), v: `${Dd.nv}` },
        ], T(tx`The ratio of thick to thin tiles tends to \(\varphi\), an irrational number: a periodic tiling would have a rational ratio, so the pattern can never repeat. The spots sit at combinations of five wave vectors with golden-ratio spacings.`, tx`太い菱形と細い菱形の比は無理数 \(\varphi\) に近づきます。周期的なタイリングなら比は有理数になるはずなので、この模様は決して繰り返せません。回折点は、黄金比の間隔をもつ五つの波数ベクトルの組み合わせの位置にあります。`));
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const s = Math.min(steps, Math.floor(t * 1.2));
        if (s !== ctx.state.shown) { ctx.state.shown = s; draw(s); if (lab) lab.textContent = T(`step ${s} of ${steps}`, `${steps} 回中 ${s} 回目`); }
        return s < steps;
      }, { initialT: 1e6, once: true, playLabel: T('Deflate', 'デフレーション') });
    },
  };
})();
