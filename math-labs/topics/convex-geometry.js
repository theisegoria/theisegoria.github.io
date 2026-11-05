'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {});
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * 1. Polar duality.  K_s is the unit ball of the l_p norm with p = 1/s (s = 0 is the cube, s = 1/2 the ball, s = 1 the
   *    octahedron).  Its polar K° = { y : <x,y> <= 1 for all x in K } is the unit ball of the conjugate norm l_q,
   *    1/p + 1/q = 1, which is K_{1-s}.  The support function of K is the norm of the polar, h_K(y) = |y|_q.
   *    vol K_s = 8 Gamma(1+s)^3 / Gamma(1+3s), so the Mahler product vol(K) vol(K°) = M(s) runs from 32/3 (cube, octahedron)
   *    up to (4 pi / 3)^2 (the ball), the Blaschke-Santalo maximum.
   * 2. Minkowski sums.  h_{A+B} = h_A + h_B, area(A + tD) = area(A) + t perimeter(A) + pi t^2 (Steiner), and
   *    sqrt area(A+B) >= sqrt area(A) + sqrt area(B) (Brunn-Minkowski), with equality exactly for homothetic A and B.
   * 3. Hulls and separation.  The convex hull of a finite set is a polytope; two disjoint polytopes are separated by the
   *    plane through the midpoint of their closest points, and max over unit n of [min_B <n,x> - max_A <n,x>] equals the distance.
   */
  const gammaFn = (x) => {
    if (x < 0.5) return PI / (Math.sin(PI * x) * gammaFn(1 - x));
    x -= 1;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    let a = c[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return Math.sqrt(TAU) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
  };
  const expP = (s) => (s <= 0 ? Infinity : 1 / s);                 // exponent of K_s
  const expQ = (s) => (s >= 1 ? Infinity : 1 / (1 - s));           // exponent of its polar
  const normP = (y, p) => {
    const a = Math.abs(y[0]), b = Math.abs(y[1]), c = Math.abs(y[2]);
    if (p === Infinity) return Math.max(a, b, c);
    if (p === 1) return a + b + c;
    const m = Math.max(a, b, c); if (m === 0) return 0;
    return m * Math.pow(Math.pow(a / m, p) + Math.pow(b / m, p) + Math.pow(c / m, p), 1 / p);
  };
  const volLp = (s) => (8 * Math.pow(gammaFn(1 + s), 3)) / gammaFn(1 + 3 * s);
  const mahler = (s) => volLp(s) * volLp(1 - s);
  const MAHLER_MIN = 32 / 3, MAHLER_MAX = Math.pow((4 * PI) / 3, 2);
  const dirOf = (az, pol) => [Math.sin(pol) * Math.cos(az), Math.sin(pol) * Math.sin(az), Math.cos(pol)];
  const radialLp = (d, e) => 1 / normP(d, e);                         // distance to the boundary of the e-ball along d
  const polarPoint = (s, az, pol) => { const d = dirOf(az, pol), r = radialLp(d, expQ(s)); return [d[0] * r, d[1] * r, d[2] * r]; };
  const supportPoint = (y, s) => {                                    // the point of K_s where <x, y> is greatest
    const p = expP(s), q = expQ(s), sg = Math.sign;
    if (p === Infinity) return [sg(y[0]), sg(y[1]), sg(y[2])];
    if (q === Infinity) {
      const a = y.map(Math.abs), i = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2, x = [0, 0, 0]; x[i] = sg(y[i]); return x;
    }
    const n = normP(y, q);
    return y.map((t) => sg(t) * Math.pow(Math.abs(t) / n, q - 1));
  };
  const hK = (y, s) => normP(y, expQ(s));
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit3 = (a) => { const n = len3(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const polarState = (s, az, pol) => {
    const y = polarPoint(s, az, pol), x = supportPoint(y, s), ny = len3(y);
    return { y, x, ny, dist: 1 / ny, foot: mul3(y, 1 / (ny * ny)), h: hK(y, s), pair: dot3(x, y), nx: normP(x, expP(s)) };
  };

  /* ---------------- planar convex bodies ---------------- */
  const cross2 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const hull2 = (pts) => {                                            // Andrew's monotone chain, counter-clockwise, no collinear vertices
    const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const u = p.filter((q, i) => i === 0 || Math.abs(q[0] - p[i - 1][0]) > 1e-12 || Math.abs(q[1] - p[i - 1][1]) > 1e-12);
    if (u.length < 3) return u;
    const lo = [], up = [];
    for (const q of u) { while (lo.length >= 2 && cross2(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-12) lo.pop(); lo.push(q); }
    for (let i = u.length - 1; i >= 0; i--) { const q = u[i]; while (up.length >= 2 && cross2(up[up.length - 2], up[up.length - 1], q) <= 1e-12) up.pop(); up.push(q); }
    lo.pop(); up.pop();
    const h = lo.concat(up);
    return h.length === 2 && Math.hypot(h[0][0] - h[1][0], h[0][1] - h[1][1]) < 1e-12 ? [h[0]] : h;
  };
  const polyArea = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const polyPerim = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += Math.hypot(q[0] - p[0], q[1] - p[1]); } return P.length < 2 ? 0 : a; };
  const hSupport = (P, th) => { const c = Math.cos(th), s = Math.sin(th); let m = -Infinity; for (const p of P) m = Math.max(m, p[0] * c + p[1] * s); return m; };
  const supportPt2 = (P, th) => { const c = Math.cos(th), s = Math.sin(th); let m = -Infinity, k = 0; P.forEach((p, i) => { const v = p[0] * c + p[1] * s; if (v > m + 1e-12) { m = v; k = i; } }); return P[k]; };
  const minkowski = (A, B) => { const out = []; for (const a of A) for (const b of B) out.push([a[0] + b[0], a[1] + b[1]]); return hull2(out); };
  const scaleP = (P, k) => P.map((p) => [p[0] * k, p[1] * k]);
  const rotP = (P, a) => { const c = Math.cos(a), s = Math.sin(a); return P.map((p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c]); };
  const shiftP = (P, v) => P.map((p) => [p[0] + v[0], p[1] + v[1]]);
  const regularP = (n, R, rot = 0) => L.seq(n, (i) => [R * Math.cos(rot + (TAU * i) / n), R * Math.sin(rot + (TAU * i) / n)]);
  const DISC_N = 180;
  // shapes for the body A (centred on the origin) and the body B
  const shapeA = (k, a) => scaleP([
    [[-1, -1], [1, -1], [1, 1], [-1, 1]],
    regularP(3, 1, PI / 2),
    regularP(6, 1, 0),
    [[-1.4, -0.7], [1.4, -0.7], [1.4, 0.7], [-1.4, 0.7]],
  ][k], a);
  const shapeB = (k, t, rot) => rotP(scaleP([
    regularP(DISC_N, 1, 0),
    [[-1, 0], [1, 0]],
    regularP(3, 1, PI / 2),
    [[-1, -1], [1, -1], [1, 1], [-1, 1]],
  ][k], t), rot);
  const mixedArea = (A, B) => (polyArea(minkowski(A, B)) - polyArea(A) - polyArea(B)) / 2;   // V(A,B) in 2D
  const steiner = (A, t) => polyArea(A) + polyPerim(A) * t + PI * t * t;                       // area of A + tD for a disc D of radius 1
  const minkState = (v) => {
    const A = shapeA(v.ka, v.a), B = shapeB(v.kb, v.t, v.rot * DEG), S = minkowski(A, B), th = v.th * DEG;
    const aA = polyArea(A), aB = polyArea(B), aS = polyArea(S);
    return { A, B, S, th, aA, aB, aS, pA: polyPerim(A), pB: polyPerim(B), pS: polyPerim(S), V: (aS - aA - aB) / 2, hA: hSupport(A, th), hB: hSupport(B, th), hS: hSupport(S, th), bm: Math.sqrt(aS) / (Math.sqrt(aA) + Math.sqrt(aB)) };
  };

  /* ---------------- polytopes in space ---------------- */
  const hull3 = (P, eps = 1e-9) => {
    const n = P.length, planes = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      const c = cross3(sub3(P[j], P[i]), sub3(P[k], P[i])), l = len3(c); if (l < 1e-12) continue;
      let nn = [c[0] / l, c[1] / l, c[2] / l], d = dot3(nn, P[i]), pos = false, neg = false;
      for (let m = 0; m < n; m++) { const s = dot3(nn, P[m]) - d; if (s > eps) pos = true; else if (s < -eps) neg = true; if (pos && neg) break; }
      if ((pos && neg) || (!pos && !neg)) continue;
      if (pos) { nn = [-nn[0], -nn[1], -nn[2]]; d = -d; }
      if (planes.some((q) => dot3(q.n, nn) > 1 - 1e-9 && Math.abs(q.d - d) < 1e-7)) continue;
      const idx = []; for (let m = 0; m < n; m++) if (Math.abs(dot3(nn, P[m]) - d) <= eps * 10) idx.push(m);
      planes.push({ n: nn, d, idx });
    }
    const faces = planes.map((pl) => {
      const c = [0, 0, 0]; pl.idx.forEach((m) => { c[0] += P[m][0]; c[1] += P[m][1]; c[2] += P[m][2]; });
      const k = 1 / pl.idx.length, ctr = [c[0] * k, c[1] * k, c[2] * k], e1 = unit3(sub3(P[pl.idx[0]], ctr)), e2 = cross3(pl.n, e1);
      const idx = pl.idx.slice().sort((a, b) => Math.atan2(dot3(sub3(P[a], ctr), e2), dot3(sub3(P[a], ctr), e1)) - Math.atan2(dot3(sub3(P[b], ctr), e2), dot3(sub3(P[b], ctr), e1)));
      return { n: pl.n, d: pl.d, idx };
    });
    const vset = new Set(); faces.forEach((f) => f.idx.forEach((m) => vset.add(m)));
    const ekey = new Map();
    faces.forEach((f) => f.idx.forEach((a, i) => { const b = f.idx[(i + 1) % f.idx.length], key = a < b ? a + ',' + b : b + ',' + a; if (!ekey.has(key)) ekey.set(key, [Math.min(a, b), Math.max(a, b)]); }));
    const tris = []; faces.forEach((f) => { for (let i = 1; i + 1 < f.idx.length; i++) tris.push([f.idx[0], f.idx[i], f.idx[i + 1]]); });
    const vs = [...vset].sort((a, b) => a - b), es = [...ekey.values()];
    let cen = [0, 0, 0]; vs.forEach((m) => { cen = add3(cen, P[m]); }); cen = mul3(cen, 1 / vs.length);
    return { P, faces, tris, V: vs, E: es, nV: vs.length, nE: es.length, nF: faces.length, centre: cen };
  };
  const hullVolume = (H) => { let v = 0; for (const t of H.tris) v += dot3(H.P[t[0]], cross3(H.P[t[1]], H.P[t[2]])) / 6; return v; };
  const insideHull = (H, p, eps = 1e-9) => H.faces.every((f) => dot3(f.n, p) - f.d < -eps);
  const closestOnTri = (p, a, b, c) => {
    const ab = sub3(b, a), ac = sub3(c, a), ap = sub3(p, a), d1 = dot3(ab, ap), d2 = dot3(ac, ap);
    if (d1 <= 0 && d2 <= 0) return a;
    const bp = sub3(p, b), d3 = dot3(ab, bp), d4 = dot3(ac, bp);
    if (d3 >= 0 && d4 <= d3) return b;
    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return add3(a, mul3(ab, d1 / (d1 - d3)));
    const cp = sub3(p, c), d5 = dot3(ab, cp), d6 = dot3(ac, cp);
    if (d6 >= 0 && d5 <= d6) return c;
    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return add3(a, mul3(ac, d2 / (d2 - d6)));
    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return add3(b, mul3(sub3(c, b), (d4 - d3) / (d4 - d3 + d5 - d6)));
    const den = 1 / (va + vb + vc);
    return add3(a, add3(mul3(ab, vb * den), mul3(ac, vc * den)));
  };
  const closestSegSeg = (p1, q1, p2, q2) => {
    const d1 = sub3(q1, p1), d2 = sub3(q2, p2), r = sub3(p1, p2), a = dot3(d1, d1), e = dot3(d2, d2), f = dot3(d2, r), EPS = 1e-12;
    let s, t;
    if (a <= EPS && e <= EPS) { s = 0; t = 0; }
    else if (a <= EPS) { s = 0; t = clamp(f / e, 0, 1); }
    else {
      const c = dot3(d1, r);
      if (e <= EPS) { t = 0; s = clamp(-c / a, 0, 1); }
      else {
        const b = dot3(d1, d2), den = a * e - b * b;
        s = den > EPS ? clamp((b * f - c * e) / den, 0, 1) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
      }
    }
    return [add3(p1, mul3(d1, s)), add3(p2, mul3(d2, t))];
  };
  const segHitsTri = (p, q, a, b, c) => {                              // Moller-Trumbore, segment p->q
    const d = sub3(q, p), e1 = sub3(b, a), e2 = sub3(c, a), h = cross3(d, e2), det = dot3(e1, h);
    if (Math.abs(det) < 1e-14) return false;
    const f = 1 / det, s = sub3(p, a), u = f * dot3(s, h); if (u < -1e-12 || u > 1 + 1e-12) return false;
    const qv = cross3(s, e1), v = f * dot3(d, qv); if (v < -1e-12 || u + v > 1 + 1e-12) return false;
    const t = f * dot3(e2, qv); return t >= -1e-12 && t <= 1 + 1e-12;
  };
  const hullsOverlap = (A, B) => {
    const inA = B.V.some((m) => insideHull(A, B.P[m], 0)), inB = A.V.some((m) => insideHull(B, A.P[m], 0));
    if (inA || inB) return true;
    for (const [i, j] of A.E) for (const t of B.tris) if (segHitsTri(A.P[i], A.P[j], B.P[t[0]], B.P[t[1]], B.P[t[2]])) return true;
    for (const [i, j] of B.E) for (const t of A.tris) if (segHitsTri(B.P[i], B.P[j], A.P[t[0]], A.P[t[1]], A.P[t[2]])) return true;
    return false;
  };
  const hullDistance = (A, B) => {                                    // exact distance between two convex polytopes
    if (hullsOverlap(A, B)) return { d: 0, overlap: true, pa: A.centre, pb: B.centre };
    let best = { d: Infinity, pa: null, pb: null };
    const take = (pa, pb) => { const d = len3(sub3(pa, pb)); if (d < best.d) best = { d, pa, pb }; };
    for (const m of A.V) for (const t of B.tris) take(A.P[m], closestOnTri(A.P[m], B.P[t[0]], B.P[t[1]], B.P[t[2]]));
    for (const m of B.V) for (const t of A.tris) take(closestOnTri(B.P[m], A.P[t[0]], A.P[t[1]], A.P[t[2]]), B.P[m]);
    for (const [i, j] of A.E) for (const [k, l] of B.E) { const [pa, pb] = closestSegSeg(A.P[i], A.P[j], B.P[k], B.P[l]); take(pa, pb); }
    return { d: best.d, overlap: false, pa: best.pa, pb: best.pb };
  };
  const extent = (H, n) => { let lo = Infinity, hi = -Infinity; for (const m of H.V) { const t = dot3(n, H.P[m]); lo = Math.min(lo, t); hi = Math.max(hi, t); } return [lo, hi]; };
  const gapAlong = (A, B, n) => extent(B, n)[0] - extent(A, n)[1];     // positive: the planes <n,x> = c separate A from B
  const rotZ = (P, a) => { const c = Math.cos(a), s = Math.sin(a); return P.map((p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]); };
  const SOLIDS = [
    ['cube', [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
    ['octahedron', [[1.4, 0, 0], [-1.4, 0, 0], [0, 1.4, 0], [0, -1.4, 0], [0, 0, 1.4], [0, 0, -1.4]]],
    ['tetrahedron', [[0.9, 0.9, 0.9], [0.9, -0.9, -0.9], [-0.9, 0.9, -0.9], [-0.9, -0.9, 0.9]]],
    ['prism', [0, 1, 2].flatMap((i) => [-0.9, 0.9].map((z) => [1.2 * Math.cos(PI / 2 + (TAU * i) / 3), 1.2 * Math.sin(PI / 2 + (TAU * i) / 3), z]))],
    ['cloud', [[1.25, 0.1, 0.1], [-0.55, 1.1, 0.3], [-0.65, -1.0, 0.15], [0.05, 0.0, 1.35], [0.2, 0.15, -1.2], [0.7, 0.75, 0.55], [-0.2, -0.1, 0.35], [0.3, -0.35, -0.2], [0.1, 0.2, 0.05], [0.75, -0.75, -0.35], [-1.0, 0.25, -0.5], [-0.1, 0.75, -0.75]]],
  ];
  const solidPoints = (k) => SOLIDS[k][1].map((p) => p.slice());
  const poseSolid = (k, rz, off) => rotZ(solidPoints(k), rz).map((p) => add3(p, off));
  const sepState = (v) => {
    const A = hull3(solidPoints(v.ka)), B = hull3(poseSolid(v.kb, v.rz * DEG, [v.bx, v.by, v.bz])), r = hullDistance(A, B);
    let n0 = r.overlap ? unit3(sub3(B.centre, A.centre)) : unit3(sub3(r.pb, r.pa));
    if (len3(sub3(B.centre, A.centre)) < 1e-9 && r.overlap) n0 = [1, 0, 0];
    let ax = cross3(n0, [0, 0, 1]); ax = len3(ax) < 1e-6 ? [0, 1, 0] : unit3(ax);
    const perp = cross3(ax, n0), dirAt = (psi) => add3(mul3(n0, Math.cos(psi)), mul3(perp, Math.sin(psi)));
    const psi = v.psi * DEG, n = dirAt(psi), gA = extent(A, n), gB = extent(B, n);
    return { A, B, r, n0, ax, dirAt, psi, n, gA, gB, gap: gB[0] - gA[1] };
  };

  /* ================= 1. polar duality of the l_p balls (3D) ================= */
  const CK = [-2.65, 0, 0], CP = [2.65, 0, 0];
  const planeQuad = (S, centre, nrm, half) => {                       // a flat square of half-width `half`, perpendicular to nrm
    const THREE = S.THREE, n = unit3(nrm), a = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], e1 = unit3(cross3(n, a)), e2 = cross3(n, e1);
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => add3(centre, add3(mul3(e1, half * i), mul3(e2, half * j))));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...c[0], ...c[1], ...c[2], ...c[0], ...c[2], ...c[3]]), 3));
    g.computeVertexNormals(); return g;
  };
  D['convex-polar'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx; st.v = v;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const s = v.s, p = expP(s), q = expQ(s), az = v.az * DEG, pol = v.pol * DEG, E = polarState(s, az, pol);
      const V1 = volLp(s), V2 = volLp(1 - s), M = mahler(s), pf = (e) => (e === Infinity ? '∞' : fmt(e, 3));
      st.cap1.textContent = T('Left: the unit ball K of the ℓp norm, with p = 1/s. Right: its polar K°, all the y with ⟨x, y⟩ ≤ 1 for every x in K. It is the ℓq ball with 1/p + 1/q = 1, so the cube and the octahedron swap, and the sphere is its own polar. Drag the gold point on K°: the gold plane ⟨x, y⟩ = 1 is the tangent plane of K that it stands for, touching K at the gold dot x*. Every point of K° is a tangent plane of K, and every tangent plane of K is a point of K°.', '左：ℓp ノルムの単位球 K で、p = 1/s です。右：その極 K° で、K のすべての x について ⟨x, y⟩ ≤ 1 となる y の全体です。これは 1/p + 1/q = 1 を満たす ℓq 球なので、立方体と正八面体が入れ替わり、球は自分自身の極になります。K° 上の金色の点をドラッグしてください。金色の平面 ⟨x, y⟩ = 1 はその点が表す K の接平面で、金色の点 x* で K に接します。K° のどの点も K の接平面に対応し、K のどの接平面も K° の点に対応します。');
      st.cap2.textContent = T('Volumes of K and K° and their product as s runs from the cube (s = 0) through the ball (s = ½) to the octahedron (s = 1). Scaling K by c scales K° by 1/c, so the product does not change: it measures shape alone. Drag the gold point along the product.', 's を立方体（s = 0）から球（s = ½）、正八面体（s = 1）まで動かしたときの、K と K° の体積とその積です。K を c 倍すると K° は 1/c 倍になるので積は変わらず、形だけを測る量になります。金色の点を積の曲線に沿ってドラッグしてください。');
      // ---- the plot
      st.g2.replaceChildren(); st.leg.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 1], y: [0, 19.5], aspect: 0.74, maxH: 400, xlabel: T('s = 1/p  (cube → ball → octahedron)', 's = 1/p（立方体 → 球 → 正八面体）'), ylabel: T('volume', '体積'), ticksX: [[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, '1']] });
      f.hline(MAHLER_MIN, { c: 'c3', dash: '5 4', w: 1.4 }); f.hline(MAHLER_MAX, { c: 'c4', dash: '5 4', w: 1.4 });
      f.text(0.5, MAHLER_MIN, T('32/3 = 10.67: cube × octahedron', '32/3 = 10.67：立方体 × 正八面体'), { small: true, c: 'c3', anchor: 'middle', dy: 14 });
      f.text(0.98, MAHLER_MAX, T('(4π/3)² = 17.55: the ball', '(4π/3)² = 17.55：球'), { small: true, c: 'c4', anchor: 'end', dy: -7 });
      f.line(L.sample(0, 1, 201, (x) => [x, volLp(x)]), { c: 'c1', w: 2.2 });
      f.line(L.sample(0, 1, 201, (x) => [x, volLp(1 - x)]), { c: 'c2', w: 2.2 });
      f.line(L.sample(0, 1, 201, (x) => [x, mahler(x)]), { c: 'ink', w: 3 });
      f.text(0.12, volLp(0.12) + 0.9, T('vol K', 'vol K'), { small: true, c: 'c1', anchor: 'middle' });
      f.text(0.88, volLp(0.12) + 0.9, T('vol K°', 'vol K°'), { small: true, c: 'c2', anchor: 'middle' });
      f.text(0.14, mahler(0.14) - 1.9, T('product', '積'), { small: true, anchor: 'middle' });
      f.handle(s, M, { c: 'hl', axis: 'x', bounds: [0, 1, 0, 19.5], snap: 0.01, label: T('shape', '形'), onDrag: (x) => ctx.set('s', Math.round(clamp(x, 0, 1) * 100) / 100) });
      f.hover((x) => { if (x < 0 || x > 1) return null; return { x, y: mahler(x), text: `s = ${fmt(x, 3)} · ${fmt(volLp(x), 3)} × ${fmt(volLp(1 - x), 3)} = ${fmt(mahler(x), 4)}` }; });
      L.legend(st.leg, [{ c: 'c1', label: T('vol K', 'vol K') }, { c: 'c2', label: T('vol K° (polar)', 'vol K°（極）') }, { c: 'ink', label: T('product vol K · vol K°', '積 vol K · vol K°') }, { c: 'c3', dash: true, label: T('smallest: 32/3', '最小値：32/3') }, { c: 'c4', dash: true, label: T('largest: (4π/3)²', '最大値：(4π/3)²') }, { kind: 'dot', c: 'hl', label: T('tangent plane and its dual point', '接平面とその双対の点') }]);
      const frac = (M - MAHLER_MIN) / (MAHLER_MAX - MAHLER_MIN);
      ctx.readout([
        { k: T('K = ℓp ball, p = 1/s;  K° = ℓq ball, q', 'K = ℓp 球（p = 1/s）、K° = ℓq 球（q）'), v: `p = ${pf(p)},  q = ${pf(q)}`, tone: 'key' },
        { k: T('vol K, vol K°, product', 'vol K、vol K°、積'), v: `${fmt(V1, 4)},  ${fmt(V2, 4)},  ${fmt(M, 4)}` },
        { k: T('where the product sits between 32/3 and (4π/3)²', '積が 32/3 と (4π/3)² の間のどこにあるか'), v: `${fmt(frac * 100, 3)}%` },
        { k: T('point y on K° (so |y|q = 1)', 'K° 上の点 y（|y|q = 1）'), v: `(${fmt(E.y[0], 3)}, ${fmt(E.y[1], 3)}, ${fmt(E.y[2], 3)}),  |y|q = ${fmt(E.h, 4)}` },
        { k: T('tangent plane ⟨x, y⟩ = 1: distance from the centre 1/|y|, touching K at x*', '接平面 ⟨x, y⟩ = 1：中心からの距離 1/|y|、接点 x*'), v: `${fmt(E.dist, 4)};  x* = (${fmt(E.x[0], 3)}, ${fmt(E.x[1], 3)}, ${fmt(E.x[2], 3)})` },
        { k: T('checks: |x*|p, ⟨x*, y⟩', '確認：|x*|p、⟨x*, y⟩'), v: `${fmt(E.nx, 4)},  ${fmt(E.pair, 4)}`, tone: Math.abs(E.nx - 1) < 1e-6 && Math.abs(E.pair - 1) < 1e-6 ? 'good' : undefined },
      ], T('The support function of K in the direction y is the norm of y in the polar, h_K(y) = |y|q, which equals 1 exactly on the surface of K°: this is why points of K° are the tangent planes of K. The contact point x* is where the planes of K sit on it; at the cube’s corners and the octahedron’s edges it jumps.', 'K の y 方向の支持関数は極のノルム h_K(y) = |y|q に等しく、K° の表面ではちょうど 1 になります。K° の点が K の接平面になるのはそのためです。接点 x* は平面が K に触れる場所で、立方体の頂点や正八面体の辺のところでは飛びます。'));
      const key = String(s);
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 500, camera: [0.6, -10.6, 4.6], target: [0, 0, 0.1], fov: 36,
        label: T('3D view of a convex body and its polar side by side. Drag to rotate; drag the gold point on the right-hand body to choose a tangent plane of the left-hand body.', '凸体とその極を並べた 3D 図。ドラッグで回転、右の物体の金色の点をドラッグすると、左の物体の接平面を選べます。'),
        init(S) {
          st.flat = false; st.S = S; st.key = null;
          st.planeMat = S.mat('hl', { opacity: 0.34, rough: 0.3, coat: 0.2 });
          st.arrP = S.arrow(CP, [0.5, 0, 0], { c: 'hl', r: 0.07 });
          st.arrK = S.arrow(CK, [0.5, 0, 0], { c: 'hl', r: 0.07 });
          st.contact = S.sphere(CK, 0.1, { c: 'hl' });
          st.hdl = S.handle(add3(CP, E.y), { c: 'hl', r: 0.2, facing: true, label: T('y', 'y'), onDrag: (qv) => {
            const d = unit3(sub3([qv.x, qv.y, qv.z], CP)), pol2 = clamp(Math.acos(clamp(d[2], -1, 1)) / DEG, 5, 175), az2 = (((Math.atan2(d[1], d[0]) / DEG) % 360) + 360) % 360;
            st.ctx.set('az', Math.round(az2), true); st.ctx.set('pol', Math.round(pol2));
            return add3(CP, polarPoint(st.v.s, Math.round(az2) * DEG, Math.round(pol2) * DEG));
          } });
          st.lab = [S.label('K', [CK[0], CK[1], 1.95], { math: true, align: 'middle' }), S.label('K°', [CP[0], CP[1], 1.95], { math: true, align: 'middle' }), S.label('x*', [0, 0, 0], { math: true, small: true, c: 'ink' }), S.label('y', [0, 0, 0], { math: true, small: true, c: 'ink' })];
        },
        update(S) {
          if (st.key !== key) {
            st.key = key;
            const fK = (u, w) => { const d = [Math.sin(w) * Math.cos(u), Math.sin(w) * Math.sin(u), Math.cos(w)], r = radialLp(d, p); return [CK[0] + d[0] * r, CK[1] + d[1] * r, CK[2] + d[2] * r]; };
            const fP = (u, w) => { const d = [Math.sin(w) * Math.cos(u), Math.sin(w) * Math.sin(u), Math.cos(w)], r = radialLp(d, q); return [CP[0] + d[0] * r, CP[1] + d[1] * r, CP[2] + d[2] * r]; };
            st.sK?.removeFromParent(); st.sP?.removeFromParent();
            st.sK = S.surface(fK, { u: [0, TAU], v: [0, PI], nu: 192, nv: 96, c: 'c1', rough: 0.3, coat: 0.7 });
            st.sP = S.surface(fP, { u: [0, TAU], v: [0, PI], nu: 192, nv: 96, c: 'c2', rough: 0.3, coat: 0.7 });
          }
          const e = polarState(s, az, pol), yv = add3(CP, e.y), xc = add3(CK, e.x);
          st.hdl.at(yv);
          st.arrP.set(CP, e.y);
          st.arrK.set(CK, e.foot);
          st.contact.at(xc);
          st.plane?.removeFromParent(); st.plane?.geometry.dispose();
          st.plane = new S.THREE.Mesh(planeQuad(S, add3(CK, e.foot), e.y, 1.2), st.planeMat); S.add(st.plane);
          st.lab[2].set(add3(xc, [0.2, 0, 0.2])); st.lab[3].set(add3(yv, [0.22, 0, 0.22]));
          S.fitStage?.(); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const g = L.fig(st.v3, { x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, maxH: 440, axes: false, grid: false });
          const ring = (e) => L.sample(0, TAU, 240, (a) => { const r = radialLp([Math.cos(a), Math.sin(a), 0], e); return [r * Math.cos(a), r * Math.sin(a)]; });
          g.poly(ring(p), { c: 'c1', fo: 0.3, w: 2.4 }); g.poly(ring(q), { c: 'c2', fo: 0.12, w: 2.4 });
          const d = [Math.cos(az), Math.sin(az), 0], r = radialLp(d, q), y2 = [d[0] * r, d[1] * r, 0], x2 = supportPoint(y2, s), n2 = Math.hypot(y2[0], y2[1]);
          const u = [-y2[1] / n2, y2[0] / n2], c0 = [y2[0] / (n2 * n2), y2[1] / (n2 * n2)];
          g.seg([c0[0] - 3 * u[0], c0[1] - 3 * u[1]], [c0[0] + 3 * u[0], c0[1] + 3 * u[1]], { c: 'hl', w: 2 });
          g.dot(x2[0], x2[1], { c: 'hl', r: 5 });
          g.handle(y2[0], y2[1], { c: 'hl', label: T('y', 'y'), onDrag: (x, y) => ctx.set('az', Math.round((((Math.atan2(y, x) / DEG) % 360) + 360) % 360)) });
          g.text(0, -2.05, T('2D slice z = 0: K filled, K° outlined; the line is the tangent plane of K dual to y', '2D の断面 z = 0：K は塗り、K° は輪郭。直線は y に双対な K の接線です'), { small: true, c: 'muted' });
        },
      });
    },
  };

  /* ================= 2. Minkowski sums and support functions (2D) ================= */
  D['convex-minkowski'] = {
    render(ctx, v) {
      const E = minkState(v), { A, B, S } = E, th = E.th, u = [Math.cos(th), Math.sin(th)], w = [-u[1], u[0]];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const isDisc = v.kb === 0;
      L.h('p', 'lab-cap', c1, isDisc
        ? T('The Minkowski sum A + tB is every a + b with a in A and b in the disc tB. Here it is built from three pieces: A itself (blue), a strip of width t along every edge (violet), and a circular wedge at every corner (teal). Their areas add to |A| + t·perimeter + πt², Steiner’s formula. Drag the direction handle: the support line of A + tB sits exactly h_tB(θ) beyond the support line of A.', 'ミンコフスキー和 A + tB は、A の点 a と円板 tB の点 b を足した a + b の全体です。ここでは三つの部分からできています。A 自身（青）、各辺に沿った幅 t の帯（紫）、各頂点の扇形（青緑）です。面積の合計は |A| + t・周長 + πt²（シュタイナーの公式）になります。方向のハンドルをドラッグしてください。A + tB の支持線は、A の支持線からちょうど h_tB(θ) だけ外にあります。')
        : T('The Minkowski sum A + tB is every a + b with a in A and b in tB. Equivalently, slide a copy of tB (teal) around the edge of A: the region it sweeps is A + tB. Drag the direction handle: the support line of A + tB sits exactly h_tB(θ) beyond the support line of A.', 'ミンコフスキー和 A + tB は、A の点 a と tB の点 b を足した a + b の全体です。言いかえると、tB のコピー（青緑）を A の縁に沿って滑らせたときに掃く領域が A + tB です。方向のハンドルをドラッグしてください。A + tB の支持線は、A の支持線からちょうど h_tB(θ) だけ外にあります。'));
      const f = L.fig(c1, { x: [-4.6, 4.6], y: [-4.6, 4.6], equal: true, maxH: 440, axes: false, grid: false });
      f.hline(0, { c: 'muted', w: 1, op: 0.35 }); f.vline(0, { c: 'muted', w: 1, op: 0.35, dash: false });
      f.poly(S, { c: 'c2', fo: isDisc ? 0.04 : 0.1, w: 2.4, layer: 'under' });
      if (isDisc && v.t > 1e-9) {
        const n = A.length;
        for (let i = 0; i < n; i++) {
          const p = A[i], q = A[(i + 1) % n], r0 = A[(i + n - 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nr = [dy / l, -dx / l];
          f.poly([p, q, [q[0] + nr[0] * v.t, q[1] + nr[1] * v.t], [p[0] + nr[0] * v.t, p[1] + nr[1] * v.t]], { c: 'c4', fo: 0.34, w: 1, layer: 'under' });
          const dx0 = p[0] - r0[0], dy0 = p[1] - r0[1], l0 = Math.hypot(dx0, dy0), n0 = [dy0 / l0, -dx0 / l0];
          let a0 = Math.atan2(n0[1], n0[0]), a1 = Math.atan2(nr[1], nr[0]); while (a1 < a0) a1 += TAU;
          f.poly([p, ...L.sample(a0, a1, 18, (a) => [p[0] + v.t * Math.cos(a), p[1] + v.t * Math.sin(a)])], { c: 'c3', fo: 0.4, w: 1, layer: 'under' });
        }
      } else if (v.t > 1e-9) {
        A.forEach((p) => f.poly(shiftP(B, p), { c: 'c3', fill: false, w: 1.2, op: 0.55, dash: '4 3' }));
      }
      f.poly(A, { c: 'c1', fo: 0.45, w: 2.6 });
      // the direction, and the support lines of A and of A + tB
      const aS = supportPt2(A, th), sS = supportPt2(S, th), bS = supportPt2(B, th);
      const line = (h, c, dash, wd) => f.seg([u[0] * h - w[0] * 6, u[1] * h - w[1] * 6], [u[0] * h + w[0] * 6, u[1] * h + w[1] * 6], { c, w: wd, dash });
      line(E.hA, 'c1', '6 4', 1.6); line(E.hS, 'c2', false, 2);
      f.dot(aS[0], aS[1], { c: 'c1', r: 4.5 }); f.dot(sS[0], sS[1], { c: 'c2', r: 4.5 });
      f.arrow([0, 0], [u[0] * 1.2, u[1] * 1.2], { c: 'hl', w: 2.2 });
      if (E.hB > 0.06) f.arrow([u[0] * E.hA + w[0] * 0.5, u[1] * E.hA + w[1] * 0.5], [u[0] * E.hS + w[0] * 0.5, u[1] * E.hS + w[1] * 0.5], { c: 'c3', w: 2.4 });
      f.handle(4.0 * u[0], 4.0 * u[1], { c: 'hl', bounds: [-4.5, 4.5, -4.5, 4.5], label: T('direction θ', '方向 θ'), onDrag: (x, y) => ctx.set('th', Math.round((((Math.atan2(y, x) / DEG) % 360) + 360) % 360)) });
      // ---- support functions
      L.h('p', 'lab-cap', c2, T('The support function h(θ) is how far the body reaches in direction θ. For Minkowski sums it simply adds: the orange curve is the blue curve plus the teal one, at every angle. Drag the gold point.', '支持関数 h(θ) は、物体が方向 θ にどこまで届くかを表します。ミンコフスキー和では単純に足し算になり、オレンジの曲線は、どの角度でも青の曲線と青緑の曲線の和です。金色の点をドラッグしてください。'));
      const hS = (x) => hSupport(S, x * DEG), hA = (x) => hSupport(A, x * DEG), hB = (x) => hSupport(B, x * DEG);
      const ymax = Math.max(1, ...L.seq(73, (i) => hS(i * 5))) * 1.18;
      const g = L.fig(c2, { x: [0, 360], y: [0, ymax], aspect: 0.7, maxH: 400, xlabel: T('direction θ (degrees)', '方向 θ（度）'), ylabel: T('reach h(θ)', '届く距離 h(θ)'), ticksX: [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°'], [360, '360°']] });
      g.line(L.sample(0, 360, 361, (x) => [x, hA(x)]), { c: 'c1', w: 2.2 });
      g.line(L.sample(0, 360, 361, (x) => [x, hB(x)]), { c: 'c3', w: 2.2 });
      g.line(L.sample(0, 360, 361, (x) => [x, hS(x)]), { c: 'c2', w: 3 });
      g.vline(v.th, { c: 'hl', dash: '3 3', w: 1.2 });
      g.dot(v.th, E.hA, { c: 'c1', r: 3.5 }); g.dot(v.th, E.hB, { c: 'c3', r: 3.5 });
      g.handle(v.th, E.hS, { c: 'hl', axis: 'x', snap: 1, bounds: [0, 360, 0, ymax], label: T('θ', 'θ'), onDrag: (x) => ctx.set('th', Math.round(clamp(x, 0, 360))) });
      g.hover((x) => (x < 0 || x > 360 ? null : { x, y: hS(x), text: `θ = ${fmt(x, 3)}° · ${fmt(hA(x), 3)} + ${fmt(hB(x), 3)} = ${fmt(hS(x), 3)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('A, h_A', 'A、h_A') }, { c: 'c3', label: isDisc ? T('tB: strips are violet, wedges teal', 'tB：帯は紫、扇形は青緑') : T('tB, h_tB', 'tB、h_tB') }, { c: 'c2', label: T('A + tB, h_A + h_tB', 'A + tB、h_A + h_tB') }, { kind: 'dot', c: 'hl', label: T('direction θ', '方向 θ') }]);
      const stn = isDisc ? steiner(A, v.t) : null;
      ctx.readout([
        { k: T('reach at θ: h_A, h_tB, h_(A+tB)', 'θ 方向の届く距離：h_A、h_tB、h_(A+tB)'), v: `${fmt(E.hA, 4)} + ${fmt(E.hB, 4)} = ${fmt(E.hS, 4)}`, tone: 'key' },
        { k: T('areas |A|, |tB|, |A + tB|', '面積 |A|、|tB|、|A + tB|'), v: `${fmt(E.aA, 4)},  ${fmt(E.aB, 4)},  ${fmt(E.aS, 4)}` },
        { k: T('|A| + 2V(A,tB) + |tB|, with mixed area V', '|A| + 2V(A,tB) + |tB|（V は混合面積）'), v: `${fmt(E.aA, 4)} + 2·${fmt(E.V, 4)} + ${fmt(E.aB, 4)} = ${fmt(E.aA + 2 * E.V + E.aB, 4)}` },
        { k: isDisc ? T('Steiner: |A| + t·perimeter + πt²', 'シュタイナー：|A| + t・周長 + πt²') : T('perimeters: P(A), P(tB), P(A + tB) (they add)', '周長：P(A)、P(tB)、P(A + tB)（足し算になります）'), v: isDisc ? `${fmt(E.aA, 4)} + ${fmt(E.pA * v.t, 4)} + ${fmt(PI * v.t * v.t, 4)} = ${fmt(stn, 4)}` : `${fmt(E.pA, 4)} + ${fmt(E.pB, 4)} = ${fmt(E.pS, 4)}` },
        { k: T('Brunn–Minkowski ratio √|A + tB| ÷ (√|A| + √|tB|), at least 1', 'ブルン・ミンコフスキー比 √|A + tB| ÷ (√|A| + √|tB|)（1 以上）'), v: fmt(E.bm, 5), tone: Math.abs(E.bm - 1) < 2e-3 ? 'good' : undefined },
      ], T('The ratio is 1 only when A and tB are homothetic: the same shape, the same way up, differing by scale. Try a square for A and a square for B with no rotation, or a triangle with a triangle. Any other pair has a ratio above 1: mixing two different shapes always produces more area than their square roots alone would suggest.', '比が 1 になるのは、A と tB が相似の位置にあるとき、つまり同じ形で同じ向き、大きさだけが違うときに限ります。A も B も正方形で回転なし、または三角形どうしで試してください。それ以外の組み合わせでは比は 1 より大きくなり、異なる形を混ぜると、面積の平方根の和から予想されるより常に大きな面積になります。'));
    },
  };

  /* ================= 3. hulls and separating planes (3D) ================= */
  const SEP_X = [-5.2, 5.2];
  D['convex-separation'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx; st.v = v;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const E = sepState(v), { A, B, r } = E, d = r.d;
      st.cap1.textContent = T('Two convex bodies, each the hull of a few points (the cube, octahedron, tetrahedron and prism are hulls of their corners; the cloud has three points inside, drawn hollow, that the hull swallows). Drag B. The two planes are perpendicular to the gold direction n and just touch A and B. When the bodies are apart, n can be tilted until the planes separate them best: that happens exactly along the shortest segment between them.', '二つの凸体で、どちらも少数の点の凸包です（立方体・正八面体・正四面体・角柱は頂点の凸包で、点群には凸包に飲み込まれる内部の点が三つあり、白抜きで描いてあります）。B をドラッグしてください。二枚の平面は金色の方向 n に垂直で、A と B にちょうど接します。物体が離れているときは、n を傾けて平面が最もよく二つを隔てる向きを探せます。それは二つの間の最短の線分の向きとちょうど一致します。');
      st.cap2.textContent = T('The gap along direction n(ψ), as n tilts away from the shortest-segment direction by ψ. It never exceeds the distance d between the bodies, and reaches it only at ψ = 0. Drag the gold point.', '最短の線分の向きから ψ だけ傾けた方向 n(ψ) に沿った隙間です。二つの物体の距離 d を超えることはなく、ψ = 0 のときだけ d に達します。金色の点をドラッグしてください。');
      st.cap3.textContent = T('The same two bodies seen along n: each casts a shadow, an interval, on the line through n. A positive gap is a separating plane; a negative one is overlap.', '同じ二つの物体を n に沿って見たものです。それぞれが n を通る直線上に影（区間）を落とします。隙間が正なら分離する平面があり、負なら重なっています。');
      // ---- gap against tilt
      st.g2.replaceChildren(); st.g3.replaceChildren(); st.leg.replaceChildren();
      const gs = L.sample(-90, 90, 181, (x) => [x, gapAlong(A, B, E.dirAt(x * DEG))]);
      const gmax = Math.max(d, ...gs.map((q) => q[1])), gmin = Math.min(0, ...gs.map((q) => q[1])), top = Math.max(gmax * 1.6, 0.7), bot = gmin < 0 ? gmin * 1.15 : -0.12 * top;
      const f = L.fig(st.g2, { x: [-90, 90], y: [bot, top], aspect: 0.5, maxH: 250, xlabel: T('tilt ψ of the direction (degrees)', '方向の傾き ψ（度）'), ylabel: T('gap along n(ψ)', 'n(ψ) に沿った隙間'), ticksX: [[-90, '-90°'], [-45, '-45°'], [0, '0°'], [45, '45°'], [90, '90°']] });
      f.hline(0, { c: 'muted', w: 1 });
      if (!r.overlap) { f.hline(d, { c: 'c3', dash: '5 4', w: 1.4 }); f.text(88, d, T('distance d', '距離 d'), { small: true, c: 'c3', anchor: 'end', dy: -7 }); }
      f.line(gs, { c: 'ink', w: 2.8 });
      f.handle(v.psi, E.gap, { c: 'hl', axis: 'x', snap: 1, bounds: [-90, 90, bot, top], label: T('ψ', 'ψ'), onDrag: (x) => ctx.set('psi', Math.round(clamp(x, -90, 90))) });
      f.hover((x) => (x < -90 || x > 90 ? null : { x, y: gapAlong(A, B, E.dirAt(x * DEG)), text: `ψ = ${fmt(x, 3)}° · ${fmt(gapAlong(A, B, E.dirAt(x * DEG)), 4)}` }));
      // ---- shadows on the line through n
      const lo = Math.min(E.gA[0], E.gB[0]), hi = Math.max(E.gA[1], E.gB[1]), pad = (hi - lo) * 0.08 + 0.2;
      const h = L.fig(st.g3, { x: [lo - pad, hi + pad], y: [-0.9, 1.9], aspect: 0.2, maxH: 160, grid: false, xlabel: T('position along n', 'n に沿った位置'), ticksY: [] });
      h.rect(E.gA[0], 0.55, E.gA[1] - E.gA[0], 0.7, { fill: 'c1', fo: 0.55, w: 1.6, c: 'c1' });
      h.rect(E.gB[0], -0.25, E.gB[1] - E.gB[0], 0.7, { fill: 'c2', fo: 0.55, w: 1.6, c: 'c2' });
      h.text((E.gA[0] + E.gA[1]) / 2, 0.9, 'A', { math: true, c: 'ink' }); h.text((E.gB[0] + E.gB[1]) / 2, 0.1, 'B', { math: true, c: 'ink' });
      if (E.gap > 1e-9) { h.arrow([E.gA[1], 0.45], [E.gB[0], 0.45], { c: 'hl', w: 2.4 }); h.text((E.gA[1] + E.gB[0]) / 2, 1.55, `${fmt(E.gap, 3)}`, { small: true, c: 'hl' }); }
      else h.rect(Math.max(E.gA[0], E.gB[0]), -0.25, Math.max(0, Math.min(E.gA[1], E.gB[1]) - Math.max(E.gA[0], E.gB[0])), 1.5, { fill: 'neg', fo: 0.3, nostroke: true });
      L.legend(st.leg, [{ c: 'c1', label: T('body A', '物体 A') }, { c: 'c2', label: T('body B', '物体 B') }, { kind: 'dot', c: 'hl', label: T('shortest segment and direction n', '最短の線分と方向 n') }, { c: 'c3', dash: true, label: T('distance d = best gap', '距離 d = 最良の隙間') }]);
      const nm = SOLIDS[v.ka][0], nb = SOLIDS[v.kb][0];
      const info = (H) => `${H.nV}, ${H.nE}, ${H.nF}`;
      ctx.readout([
        { k: T('A hull (vertices, edges, faces) and B hull', 'A の凸包（頂点・辺・面）と B の凸包'), v: `${nm}: ${info(A)}  |  ${nb}: ${info(B)}`, tone: A.nV - A.nE + A.nF === 2 && B.nV - B.nE + B.nF === 2 ? 'good' : undefined },
        { k: T('distance between the bodies d', '二つの物体の距離 d'), v: r.overlap ? T('0: they overlap', '0：重なっています') : fmt(d, 5), tone: 'key' },
        { k: T('closest points  p in A,  q in B', '最近点  A の p、B の q'), v: r.overlap ? '—' : `(${r.pa.map((x) => fmt(x, 3)).join(', ')})  (${r.pb.map((x) => fmt(x, 3)).join(', ')})` },
        { k: T('direction n(ψ) and the gap along it', '方向 n(ψ) とその方向の隙間'), v: `(${E.n.map((x) => fmt(x, 3)).join(', ')});  ${fmt(E.gap, 5)}`, tone: !r.overlap && Math.abs(E.gap - d) < 1e-6 ? 'good' : undefined },
        { k: T('best separating plane: through the midpoint, margin d/2 on each side', '最良の分離平面：中点を通り、両側の余白は d/2'), v: r.overlap ? '—' : `⟨n, x⟩ = ${fmt((dot3(E.n0, r.pa) + dot3(E.n0, r.pb)) / 2, 4)};  d/2 = ${fmt(d / 2, 4)}` },
      ], T('The distance between two disjoint convex bodies equals the largest gap any direction can achieve: the shortest distance and the widest separating slab are the same number, seen from two sides. This is the geometry behind the maximum-margin classifier.', '交わらない二つの凸体の距離は、どの方向でも達成できる隙間のうち最大のものに等しくなります。最短距離と最も幅の広い分離帯は同じ数を二つの側から見たものです。これが最大マージン分類器の背後にある幾何学です。'));
      const key = `${v.ka}|${v.kb}|${v.bx}|${v.by}|${v.bz}|${v.rz}`;
      const tri = (S, H, mat) => {
        const THREE = S.THREE, pos = new Float32Array(H.tris.length * 9);
        H.tris.forEach((t, i) => t.forEach((m, j) => { pos.set(H.P[m], i * 9 + j * 3); }));
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; return mesh;
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 520, camera: [7.4, -11.6, 6.4], target: [0.6, 0, 0.2], fov: 34,
        label: T('3D view of two convex bodies, the shortest segment between them and two parallel planes perpendicular to n. Drag to rotate; drag the gold ball to move body B.', '二つの凸体、その間の最短の線分、n に垂直な二枚の平行な平面の 3D 図。ドラッグで回転、金色の球をドラッグすると物体 B を動かせます。'),
        init(S) {
          st.flat = false; st.S = S; st.key = null; st.parts = [];
          st.seg = S.tube([[0, 0, 0], [1, 0, 0]], { r: 0.05, c: 'hl', rough: 0.25 });
          st.pa = S.sphere([0, 0, 0], 0.09, { c: 'hl' }); st.pb = S.sphere([0, 0, 0], 0.09, { c: 'hl' });
          st.arrN = S.arrow([0, 0, 0], [1, 0, 0], { c: 'hl', r: 0.06 });
          st.matA = S.mat('c1', { opacity: 0.2, rough: 0.3 }); st.matB = S.mat('c2', { opacity: 0.2, rough: 0.3 });
          st.solA = S.mat('c1', { rough: 0.28, coat: 0.7 }); st.solB = S.mat('c2', { rough: 0.28, coat: 0.7 });
          st.edges = S.lines([], { c: 'ink', opacity: 0.55 });
          st.hdl = S.handle([v.bx, v.by, v.bz], { c: 'hl', r: 0.16, plane: [[0, 0, 1], [0, 0, v.bz]], label: T('B', 'B'), onDrag: (qv) => {
            const x = clamp(Math.round(qv.x * 10) / 10, -5, 5), y = clamp(Math.round(qv.y * 10) / 10, -5, 5);
            st.ctx.set('bx', x, true); st.ctx.set('by', y); return [x, y, st.v.bz];
          } });
          st.lab = [S.label('A', [0, 0, 0], { math: true, c: 'ink' }), S.label('B', [0, 0, 0], { math: true, c: 'ink' })];
          st.hollow = S.points([], { c: 'ink', r: 0.07, max: 12 });
        },
        update(S) {
          st.parts.forEach((m) => { m.removeFromParent(); m.geometry?.dispose(); }); st.parts = [];
          const add = (m) => { S.add(m); st.parts.push(m); return m; };
          add(tri(S, A, st.solA)); add(tri(S, B, st.solB));
          const edges = (H) => H.E.map(([i, j]) => [H.P[i], H.P[j]]);
          st.edges.update(edges(A).concat(edges(B)));
          // points swallowed by the hull are drawn hollow
          const inner = [A, B].flatMap((H) => H.P.filter((_, m) => !H.V.includes(m)));
          st.hollow.update(inner);
          if (!r.overlap) {
            st.seg.update([r.pa, r.pb]); st.seg.visible = true; st.pa.at(r.pa); st.pb.at(r.pb); st.pa.visible = st.pb.visible = true;
          } else { st.seg.visible = false; st.pa.visible = st.pb.visible = false; }
          const mid = mul3(add3(A.centre, B.centre), 0.5), n = E.n;
          const pl = (h, mat) => { const c0 = add3(mid, mul3(n, h - dot3(mid, n))), m = new S.THREE.Mesh(planeQuad(S, c0, n, 3.1), mat); return add(m); };
          pl(E.gA[1], st.matA); pl(E.gB[0], st.matB);
          st.arrN.set(add3(mid, mul3(n, -1.1)), mul3(n, 2.2));
          st.hdl.at([v.bx, v.by, v.bz]); st.hdl.setPlane?.([0, 0, 1], [v.bx, v.by, v.bz]);
          st.lab[0].set(add3(A.centre, [0, 0, 1.7])); st.lab[1].set(add3(B.centre, [0, 0, 1.7]));
          S.fitStage?.(); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const g = L.fig(st.v3, { x: SEP_X, y: [-4.4, 4.4], equal: true, maxH: 440, axes: false, grid: false });
          const outline = (H) => hull2(H.V.map((m) => [H.P[m][0], H.P[m][1]]));
          g.poly(outline(A), { c: 'c1', fo: 0.4, w: 2.4 }); g.poly(outline(B), { c: 'c2', fo: 0.4, w: 2.4 });
          if (!r.overlap) g.seg([r.pa[0], r.pa[1]], [r.pb[0], r.pb[1]], { c: 'hl', w: 2.6 });
          g.handle(v.bx, v.by, { c: 'hl', bounds: [-5, 5, -4.4, 4.4], label: T('B', 'B'), onDrag: (x, y) => { ctx.set('bx', Math.round(x * 10) / 10, true); ctx.set('by', Math.round(y * 10) / 10); } });
          g.text(0, -4.2, T('top view (the xy projection of both bodies)', '上から見た図（両方の物体の xy 平面への射影）'), { small: true, c: 'muted' });
        },
      });
    },
  };

  window.LabModels = window.LabModels || {};
  window.LabModels['convex-geometry'] = {
    gammaFn, volLp, mahler, MAHLER_MIN, MAHLER_MAX, normP, expP, expQ, radialLp, dirOf, polarPoint, supportPoint, hK, polarState,
    hull2, polyArea, polyPerim, hSupport, supportPt2, minkowski, shapeA, shapeB, mixedArea, steiner, minkState, regularP, scaleP, rotP, shiftP,
    hull3, hullVolume, insideHull, closestOnTri, closestSegSeg, hullsOverlap, hullDistance, extent, gapAlong, solidPoints, poseSolid, sepState, SOLIDS,
  };
})();
