'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------- model (pure, checked by checks/elliptic-curves.cjs) ---------- */
  // real curve y^2 = x^3 + a x + b
  const cub = (x, a, b) => x * x * x + a * x + b;
  const discriminant = (a, b) => -16 * (4 * a * a * a + 27 * b * b);
  // real roots of x^3 + p x + q, ascending (trigonometric form when there are three)
  function cubicRoots(p, q) {
    const s = -(4 * p * p * p + 27 * q * q);
    if (Math.abs(p) < 1e-14) return [Math.cbrt(-q)];
    if (s > 0) {
      const m = 2 * Math.sqrt(-p / 3), th = Math.acos(Math.max(-1, Math.min(1, 3 * q / (p * m)))) / 3;
      return [0, 1, 2].map((k) => m * Math.cos(th - 2 * PI * k / 3)).sort((u, v) => u - v);
    }
    const r = Math.sqrt(Math.max(0, q * q / 4 + p * p * p / 27));
    return [Math.cbrt(-q / 2 + r) + Math.cbrt(-q / 2 - r)];
  }
  // group law on the real points; null is the point at infinity O
  function addR(P, Q, a) {
    if (!P) return Q; if (!Q) return P;
    const [x1, y1] = P, [x2, y2] = Q; let lam;
    if (Math.abs(x1 - x2) < 1e-9 * (1 + Math.abs(x1))) {
      if (Math.abs(y1 + y2) < 1e-9 * (1 + Math.abs(y1))) return null;
      lam = (3 * x1 * x1 + a) / (2 * y1);
    } else lam = (y2 - y1) / (x2 - x1);
    const x3 = lam * lam - x1 - x2;
    return [x3, lam * (x1 - x3) - y1];
  }
  const negR = (P) => P && [P[0], -P[1]];
  const slopeR = (P, Q, a) => (Math.abs(P[0] - Q[0]) < 1e-9 * (1 + Math.abs(P[0])) ? (Math.abs(P[1] + Q[1]) < 1e-9 * (1 + Math.abs(P[1])) ? Infinity : (3 * P[0] * P[0] + a) / (2 * P[1])) : (Q[1] - P[1]) / (Q[0] - P[0]));
  // curve point for an x coordinate and a branch sign, snapping x to the nearest end of the real locus if needed
  function onCurve(x, s, a, b) {
    if (cub(x, a, b) >= 0) return [x, s * Math.sqrt(cub(x, a, b))];
    const rs = cubicRoots(a, b); let best = rs[0];
    for (const r of rs) if (Math.abs(r - x) < Math.abs(best - x)) best = r;
    return [best, 0];
  }

  // curves over F_p
  const mod = (x, p) => ((x % p) + p) % p;
  function inv(x, p) { let a = mod(x, p), b = p, u = 1, v = 0; while (b) { const q = Math.floor(a / b); [a, b] = [b, a - q * b]; [u, v] = [v, u - q * v]; } return mod(u, p); }
  function addP(P, Q, a, p) {
    if (!P) return Q; if (!Q) return P;
    const [x1, y1] = P, [x2, y2] = Q; let lam;
    if (x1 === x2) { if (mod(y1 + y2, p) === 0) return null; lam = mod((3 * x1 * x1 + a) * inv(2 * y1, p), p); }
    else lam = mod((y2 - y1) * inv(x2 - x1, p), p);
    const x3 = mod(lam * lam - x1 - x2, p);
    return [x3, mod(lam * (x1 - x3) - y1, p)];
  }
  function mulP(k, P, a, p) { let R = null, S = P; while (k > 0) { if (k & 1) R = addP(R, S, a, p); S = addP(S, S, a, p); k >>= 1; } return R; }
  const singularP = (a, b, p) => mod(4 * a * a * a + 27 * b * b, p) === 0;
  function chiTable(p) { const c = new Int8Array(p).fill(-1); c[0] = 0; for (let y = 1; y < p; y++) c[(y * y) % p] = 1; return c; }
  function countPoints(a, b, p, chi = chiTable(p)) { let s = p + 1; for (let x = 0; x < p; x++) s += chi[mod(x * x * x + a * x + b, p)]; return s; }
  function pointsModP(a, b, p) {
    const roots = Array.from({ length: p }, () => []);
    for (let y = 0; y < p; y++) roots[(y * y) % p].push(y);
    const out = [];
    for (let x = 0; x < p; x++) for (const y of roots[mod(x * x * x + a * x + b, p)]) out.push([x, y]);
    return out;
  }
  function orderOf(P, a, p) { let k = 1, R = P; while (R) { R = addP(R, P, a, p); k++; if (k > 4 * p + 10) return -1; } return k; }
  // traces a_p = p + 1 - #E over every non-singular curve y^2 = x^3 + a x + b over F_p
  function traceHistogram(p) {
    const chi = chiTable(p), h = new Map(); let n = 0;
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) {
      if (singularP(a, b, p)) continue;
      const t = p + 1 - countPoints(a, b, p, chi); h.set(t, (h.get(t) || 0) + 1); n++;
    }
    return { h, n };
  }

  // complex numbers as [re, im]
  const cadd = (u, w) => [u[0] + w[0], u[1] + w[1]];
  const csub = (u, w) => [u[0] - w[0], u[1] - w[1]];
  const cmul = (u, w) => [u[0] * w[0] - u[1] * w[1], u[0] * w[1] + u[1] * w[0]];
  const cdiv = (u, w) => { const d = w[0] * w[0] + w[1] * w[1]; return [(u[0] * w[0] + u[1] * w[1]) / d, (u[1] * w[0] - u[0] * w[1]) / d]; };
  const cscale = (u, s) => [u[0] * s, u[1] * s];
  const csin = ([x, y]) => [Math.sin(x) * Math.cosh(y), Math.cos(x) * Math.sinh(y)];
  const ccos = ([x, y]) => [Math.cos(x) * Math.cosh(y), -Math.sin(x) * Math.sinh(y)];
  // Jacobi theta functions for the lattice Z + i t Z (nome e^{-pi t})
  const thetaConst = (t) => { const q = Math.exp(-PI * t); let t2 = 0, t3 = 1; for (let n = 0; n < 14; n++) { t2 += 2 * Math.pow(q, (n + 0.5) * (n + 0.5)); if (n) t3 += 2 * Math.pow(q, n * n); } return [t2, t3]; };
  function thetaPack(v, t) {
    const q = Math.exp(-PI * t);
    let t1 = [0, 0], t1d = [0, 0], t4 = [1, 0], t4d = [0, 0];
    for (let n = 0; n < 14; n++) {
      const s = n % 2 ? -1 : 1, qa = Math.pow(q, (n + 0.5) * (n + 0.5)), k = 2 * n + 1, arg = cscale(v, k);
      t1 = cadd(t1, cscale(csin(arg), 2 * s * qa)); t1d = cadd(t1d, cscale(ccos(arg), 2 * s * qa * k));
      if (n) { const qb = Math.pow(q, n * n), a2 = cscale(v, 2 * n); t4 = cadd(t4, cscale(ccos(a2), 2 * s * qb)); t4d = cadd(t4d, cscale(csin(a2), -4 * n * s * qb)); }
    }
    return { t1, t1d, t4, t4d };
  }
  // Weierstrass p and p' for the lattice Z + i t Z (DLMF 23.6.2 with 2 omega_1 = 1); null at lattice points
  function wp(z, t) {
    let [x, y] = z; y -= t * Math.round(y / t); x -= Math.round(x);
    if (Math.hypot(x, y) < 1e-12) return null;
    const [t2, t3] = thetaConst(t), A = PI * PI * t2 * t2 * t3 * t3;
    const { t1, t1d, t4, t4d } = thetaPack([PI * x, PI * y], t);
    const r = cdiv(t4, t1);
    const val = csub(cscale(cmul(r, r), A), [PI * PI / 3 * (t2 ** 4 + t3 ** 4), 0]);
    const dr = cscale(cdiv(csub(cmul(t4d, t1), cmul(t4, t1d)), cmul(t1, t1)), PI);
    return [val, cscale(cmul(r, dr), 2 * A)];
  }
  // invariants from Eisenstein series: g2 = 60 G4, g3 = 140 G6, q = e^{2 pi i tau} = e^{-2 pi t}
  function g2g3(t) {
    const q = Math.exp(-2 * PI * t); let s3 = 0, s5 = 0;
    for (let n = 1; n <= 40; n++) { let d3 = 0, d5 = 0; for (let d = 1; d <= n; d++) if (n % d === 0) { d3 += d ** 3; d5 += d ** 5; } const qn = q ** n; s3 += d3 * qn; s5 += d5 * qn; }
    return [4 * PI ** 4 / 3 * (1 + 240 * s3), 8 * PI ** 6 / 27 * (1 - 504 * s5)];
  }
  const eRoots = (t) => [wp([0.5, 0], t)[0][0], wp([0.5, t / 2], t)[0][0], wp([0, t / 2], t)[0][0]];
  // direct lattice sum, only for checking
  function wpDirect(z, t, N) {
    let s = cdiv([1, 0], cmul(z, z));
    for (let m = -N; m <= N; m++) for (let n = -N; n <= N; n++) { if (!m && !n) continue; const w = [m, n * t], d = csub(z, w); s = cadd(s, csub(cdiv([1, 0], cmul(d, d)), cdiv([1, 0], cmul(w, w)))); }
    return s;
  }
  // chord-and-tangent law for y^2 = 4x^3 - g2 x - g3 (real points)
  function addW(P, Q, g2) {
    if (!P) return Q; if (!Q) return P;
    const [x1, y1] = P, [x2, y2] = Q; let lam;
    if (Math.abs(x1 - x2) < 1e-9 * (1 + Math.abs(x1))) { if (Math.abs(y1 + y2) < 1e-7 * (1 + Math.abs(y1))) return null; lam = (12 * x1 * x1 - g2) / (2 * y1); }
    else lam = (y2 - y1) / (x2 - x1);
    const x3 = lam * lam / 4 - x1 - x2;
    return [x3, -(y1 + lam * (x3 - x1))];
  }
  (window.LabModels = window.LabModels || {})['elliptic-curves'] = { cub, discriminant, cubicRoots, addR, negR, onCurve, mod, inv, addP, mulP, singularP, chiTable, countPoints, pointsModP, orderOf, traceHistogram, cadd, csub, cmul, cdiv, wp, g2g3, eRoots, wpDirect, addW };

  /* ---------- drawing helpers ---------- */
  // polylines of the real locus y^2 = F(x) between X0 and X1, cut where |y| exceeds Ymax
  function locus(F, roots, X0, X1, Ymax) {
    let xr = X1;
    if (F(X1) > Ymax * Ymax) { let lo = Math.max(X0, roots[roots.length - 1]), hi = X1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (F(m) > Ymax * Ymax) hi = m; else lo = m; } xr = lo; }
    const cuts = [X0, ...roots.filter((r) => r > X0 && r < xr), xr], out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const l = cuts[i], r = cuts[i + 1];
      if (r - l < 1e-9 || F((l + r) / 2) < 0) continue;
      const lr = i > 0, rr = i < cuts.length - 2, w = Math.min(0.25 * (r - l), 0.3), xs = [];
      for (let k = 0; k <= 240; k++) xs.push(l + (r - l) * k / 240);
      for (let k = 1; k <= 24; k++) { if (lr) xs.push(l + w * (k / 24) ** 2); if (rr) xs.push(r - w * (k / 24) ** 2); }
      xs.sort((u, v) => u - v);
      const up = xs.map((x) => [x, Math.sqrt(Math.max(0, F(x)))]), dn = up.map(([x, y]) => [x, -y]);
      if (rr) out.push([...up, ...dn.reverse()]);
      else if (lr) out.push([...up.reverse(), ...dn]);
      else { out.push(up); out.push(dn); }
    }
    return out;
  }
  // Liang-Barsky: the part of the line through (x, y) with direction (dx, dy) inside the box
  function clipLine(x, y, dx, dy, [x0, x1, y0, y1]) {
    let t0 = -1e9, t1 = 1e9;
    for (const [p, q] of [[-dx, x - x0], [dx, x1 - x], [-dy, y - y0], [dy, y1 - y]]) {
      if (Math.abs(p) < 1e-15) { if (q < 0) return null; continue; }
      const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
    }
    return t0 > t1 ? null : [[x + t0 * dx, y + t0 * dy], [x + t1 * dx, y + t1 * dy]];
  }
  const inBox = (P, [x0, x1, y0, y1]) => P && P[0] >= x0 && P[0] <= x1 && P[1] >= y0 && P[1] <= y1;
  const pt = (P, d = 2) => (P ? `(${fmt(P[0], d)}, ${fmt(P[1], d)})` : 'O');
  function nearest(pieces, x, y, sx, sy) {
    let best = null, bd = Infinity;
    for (const pc of pieces) for (const q of pc) { const d = ((q[0] - x) / sx) ** 2 + ((q[1] - y) / sy) ** 2; if (d < bd) { bd = d; best = q; } }
    return best;
  }
  const mixc = (x, y, t) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t);

  /* ---------- 1. chord and tangent ---------- */
  D['chord-tangent'] = {
    render(ctx, v) {
      const a = v.a, b = v.b, dbl = v.op === 1;
      const X0 = -3, X1 = 3.4, Y = 6, box = [X0, X1, -Y, Y];
      const roots = cubicRoots(a, b), F = (x) => cub(x, a, b);
      const pieces = locus(F, roots, X0, X1, Y);
      const P = onCurve(v.px, v.ps ? -1 : 1, a, b), Q = dbl ? P : onCurve(v.qx, v.qs ? -1 : 1, a, b);
      const S = addR(P, Q, a), R3 = negR(S), lam = slopeR(P, Q, a);
      const sing = Math.abs(4 * a * a * a + 27 * b * b) < 0.02;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, dbl ? T('Drag P along the curve. The tangent at P meets the curve once more; reflect that point in the x axis to get 2P.', 'P を曲線に沿ってドラッグしてください。P での接線は曲線ともう一度交わります。その点を x 軸で折り返すと 2P です。') : T('Drag P and Q along the curve. The line through them meets the curve in exactly one more point; reflect it in the x axis to get P + Q.', 'P と Q を曲線に沿ってドラッグしてください。二点を通る直線は曲線とちょうどもう一点で交わります。それを x 軸で折り返すと P + Q です。'));
      const f = L.fig(c1, { x: [X0, X1], y: [-Y, Y], aspect: 0.92, maxH: 500, xlabel: 'x', ylabel: 'y' });
      pieces.forEach((pc) => f.line(pc, { c: 'c1', w: 2.8 }));
      // the chord (or tangent), or a vertical line when the sum is O
      const seg = Number.isFinite(lam) ? clipLine(P[0], P[1], 1, lam, box) : clipLine(P[0], P[1], 0, 1, box);
      if (seg) f.line(seg, { c: 'c2', w: 1.8 });
      if (S) {
        if (inBox(R3, box) && inBox(S, box)) f.line([R3, S], { c: 'muted', w: 1.3, dash: '4 3' });
        if (inBox(R3, box)) f.dot(R3[0], R3[1], { c: 'c2', r: 5.5, hollow: true });
        if (inBox(R3, box)) {
          // place the label in whichever of eight directions is farthest (in pixels) from the curve, the chord and the sum
          const px = f.X(R3[0]), py = f.Y(R3[1]), sx = f.X(S[0]), sy = f.Y(S[1]);
          const cpts = pieces.flat().map(([x, y]) => [f.X(x), f.Y(y)]);
          const chordPts = seg ? seg.map(([x, y]) => [f.X(x), f.Y(y)]) : [];
          const dSeg = (qx, qy) => { if (chordPts.length < 2) return 1e9; const [a1, b1] = chordPts[0], [a2, b2] = chordPts[chordPts.length - 1]; const L2 = (a2 - a1) ** 2 + (b2 - b1) ** 2 || 1; const t = L.clamp(((qx - a1) * (a2 - a1) + (qy - b1) * (b2 - b1)) / L2, 0, 1); return Math.hypot(qx - a1 - t * (a2 - a1), qy - b1 - t * (b2 - b1)); };
          let best = null;
          for (let k = 0; k < 8; k++) {
            const ang = k * Math.PI / 4, qx = px + 22 * Math.cos(ang), qy = py + 22 * Math.sin(ang);
            if (qx < f.pad.l + 24 || qx > f.W - f.pad.r - 24 || qy < f.pad.t + 8 || qy > f.H - f.pad.b - 8) continue;
            let d = Math.min(Math.hypot(qx - sx, qy - sy), dSeg(qx, qy) + 4);
            for (const [cx, cy] of cpts) { const dd = Math.hypot(qx - cx, qy - cy); if (dd < d) d = dd; }
            if (!best || d > best.d) best = { d, qx, qy };
          }
          if (best) f.text(f.IX(best.qx), f.IY(best.qy), '−(P+Q)', { math: true, small: true, dy: 4, c: 'c2' });
        }
        if (inBox(S, box)) { f.dot(S[0], S[1], { c: 'hl', r: 7.5, layer: 'over' }); f.text(S[0], S[1], dbl ? '2P' : 'P+Q', { math: true, dx: S[0] > 2.2 ? -12 : 12, anchor: S[0] > 2.2 ? 'end' : 'start', dy: S[1] >= 0 ? -12 : 18 }); }
      }
      const drag = (kx, ks) => (x, y) => { const q = nearest(pieces, x, y, X1 - X0, 2 * Y); if (!q) return; ctx.set(kx, q[0], true); ctx.set(ks, q[1] < 0 ? 1 : 0, true); ctx.redraw(); };
      f.handle(P[0], P[1], { c: 'c3', label: T('Point P on the curve', '曲線上の点 P'), onDrag: drag('px', 'ps') });
      f.text(P[0], P[1], 'P', { math: true, dx: -14, dy: -12 });
      if (!dbl) { f.handle(Q[0], Q[1], { c: 'c3', label: T('Point Q on the curve', '曲線上の点 Q'), onDrag: drag('qx', 'qs') }); f.text(Q[0], Q[1], 'Q', { math: true, dx: -14, dy: -12 }); }

      // the (a, b) plane and the discriminant
      L.h('p', 'lab-cap', c2, T('Choose the curve: drag the gold point in the (a, b) plane. On the cusp-shaped curve the discriminant vanishes and the curve is singular.', '曲線を選ぶ：(a, b) 平面の金色の点をドラッグしてください。尖点状の曲線の上では判別式が 0 になり、曲線は特異になります。'));
      const g = L.fig(c2, { x: [-3, 2], y: [-2, 3], aspect: 1, maxH: 380, xlabel: 'a', ylabel: 'b' });
      g.raster((A, B) => (4 * A * A * A + 27 * B * B < 0 ? -0.22 : 0.16), { res: 4 });
      const cusp = L.sample(-3, 0, 160, (A) => Math.sqrt(-4 * A * A * A / 27));
      g.line(cusp, { c: 'ink', w: 2.2 }); g.line(cusp.map(([A, B]) => [A, -B]), { c: 'ink', w: 2.2 });
      g.text(-2.1, 0.15, T('two components', '二つの成分'), { small: true, c: 'ink' });
      g.text(0.6, 1.9, T('one component', '一つの成分'), { small: true, c: 'ink' });
      g.text(0, 0, T('cusp', '尖点'), { small: true, dx: 8, dy: 16, anchor: 'start', c: 'muted' });
      g.handle(a, b, { c: 'hl', label: T('Coefficients a and b', '係数 a と b'), onDrag: (x, y) => { ctx.set('a', x, true); ctx.set('b', y, true); ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'c1', label: 'y² = x³ + ax + b' }, { c: 'c2', label: dbl ? T('tangent at P', 'P での接線') : T('line through P and Q', 'P と Q を通る直線') }, { c: 'muted', dash: true, label: T('reflection in the x axis', 'x 軸での折り返し') }, { kind: 'dot', c: 'hl', label: dbl ? '2P' : 'P + Q' }]);
      const dsc = discriminant(a, b);
      ctx.readout([{ k: 'Δ = −16(4a³ + 27b²)', v: fmt(dsc, 3), tone: sing ? 'warn' : 'key' }, { k: 'P', v: pt(P) }, ...(dbl ? [] : [{ k: 'Q', v: pt(Q) }]), { k: T('slope λ', '傾き λ'), v: Number.isFinite(lam) ? fmt(lam, 3) : '∞' }, { k: dbl ? '2P' : 'P + Q', v: pt(S), tone: 'good' }],
        sing ? T('The discriminant is zero: the curve has a node or a cusp, so it is not an elliptic curve and the tangent at that point is undefined.', '判別式が 0 です。曲線に結節点か尖点があるので楕円曲線ではなく、その点での接線は定まりません。')
          : !S ? T('The line is vertical, so its third point is the point at infinity O: the sum is O, the identity of the group.', '直線が垂直なので、三つ目の点は無限遠点 O です。和は群の単位元 O になります。')
            : !inBox(S, box) ? T('The sum lies off the chart: a steep line meets the curve again far out. Its coordinates are in the readout.', '和は図の外にあります。急な直線は遠くで曲線ともう一度交わります。座標は読み取り欄にあります。')
              : T('Three collinear points always add to O. Reflecting the third point is what turns this rule into an associative group law, with O as identity and (x, −y) as the inverse of (x, y).', '一直線上の三点の和は常に O です。三つ目の点を折り返すことで、この規則は結合法則を満たす群の演算になり、O が単位元、(x, −y) が (x, y) の逆元になります。'));
    },
  };

  /* ---------- 2. curves over a finite field ---------- */
  const PRIMES = [7, 13, 23, 31, 47, 61, 83, 97];
  D['curves-mod-p'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const p = PRIMES[Math.round(v.pk)] || 47, a = mod(Math.round(v.a), p), b = mod(Math.round(v.b), p);
      const sing = singularP(a, b, p), pts = pointsModP(a, b, p), N = pts.length + 1;
      let G = null, ord = 1;
      if (!sing) for (const q of pts) { const o = orderOf(q, a, p); if (o > ord) { ord = o; G = q; } }
      const mult = [G]; for (let k = 2; k < ord; k++) mult.push(addP(mult[k - 2], G, a, p));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`All solutions of y² = x³ + ${a}x + ${b} with x and y taken mod ${p}. Press Play to walk G, 2G, 3G, … through the group.`, `x と y を ${p} を法として考えた y² = x³ + ${a}x + ${b} のすべての解です。再生を押すと G, 2G, 3G, … が群の中を歩きます。`));
      const tk = [0, Math.round((p - 1) / 2), p - 1].map((k) => [k, String(k)]);
      const f = L.fig(c1, { x: [-1.5, p + 0.5], y: [-1.5, p + 0.5], equal: true, maxH: 470, grid: false, xlabel: 'x', ylabel: 'y', ticksX: tk, ticksY: tk });
      f.hline(p / 2, { c: 'muted', dash: '3 4', w: 1 });
      const r = L.clamp(230 / p, 2.2, 7.5);
      const draw = (k) => {
        f.clear('main'); f.clear('over');
        // the solutions sit above the axis lines, so points with y = 0 or x = 0 are not cut by them
        pts.forEach(([x, y]) => f.dot(x, y, { c: 'c1', r, op: 0.9, layer: 'over' }));
        if (!G) return;
        for (let i = 1; i <= k && i < mult.length; i++) f.seg(mult[i - 1], mult[i], { c: 'c2', w: 1, op: 0.3 });
        for (let i = 0; i <= k && i < mult.length; i++) f.dot(mult[i][0], mult[i][1], { c: 'c2', r: r * 0.75, layer: 'over' });
        const cur = mult[Math.min(k, mult.length - 1)];
        f.dot(G[0], G[1], { c: 'ink', r: r + 2.5, hollow: true, layer: 'over' });
        f.text(G[0], G[1], 'G', { math: true, dx: 10, dy: -10, layer: 'over' });
        f.dot(cur[0], cur[1], { c: 'hl', r: r + 3, layer: 'over' });
        f.text(cur[0], cur[1], `${Math.min(k, mult.length - 1) + 1}G`, { math: true, small: true, dx: cur[0] > p * 0.8 ? -10 : 10, anchor: cur[0] > p * 0.8 ? 'end' : 'start', dy: 18, layer: 'over' });
      };
      if (G) ctx.state.anim = L.animator(c1, (dt, t) => { const k = Math.min(mult.length - 1, Math.floor(t * Math.max(4, mult.length / 7))); draw(k); if (k >= mult.length - 1) return false; }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Walk the multiples of G', 'G の倍数をたどる') });
      else draw(0);
      // traces over all curves for this p
      const { h, n } = traceHistogram(p), H = 2 * Math.sqrt(p), tr = p + 1 - N;
      L.h('p', 'lab-cap', c2, T(`How far #E strays from p + 1, over all ${n} non-singular curves mod ${p}`, `${p} を法とする特異でない ${n} 本すべての曲線で、#E が p + 1 からどれだけずれるか`));
      const maxc = Math.max(...h.values());
      const g = L.fig(c2, { x: [-H - 2, H + 2], y: [0, maxc * 1.22], aspect: 0.72, maxH: 360, xlabel: T('trace t = p + 1 − #E', 'トレース t = p + 1 − #E'), ticksY: [] });
      for (const [t, c] of h) g.rect(t - 0.42, 0, 0.84, c, { c: t === tr && !sing ? 'hl' : 'c1', fo: t === tr && !sing ? 0.95 : 0.55, w: 0 });
      g.line(L.sample(-H, H, 200, (x) => n * 2 / (PI * H) * Math.sqrt(Math.max(0, 1 - (x / H) ** 2))), { c: 'c2', w: 2 });
      [-H, H].forEach((x) => g.vline(x, { c: 'ink', dash: '4 3', w: 1.3 }));
      g.text(H, maxc * 1.12, '2√p', { math: true, small: true, anchor: 'end', dx: -4 });
      g.text(-H, maxc * 1.12, '−2√p', { math: true, small: true, anchor: 'start', dx: 4 });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('points of the curve', '曲線の点') }, { kind: 'dot', c: 'c2', label: T('multiples of G', 'G の倍数') }, { c: 'c2', label: T('semicircle law (large p)', '半円則（p が大きいとき）') }, { c: 'ink', dash: true, label: T('Hasse bound |t| ≤ 2√p', 'ハッセの限界 |t| ≤ 2√p') }]);
      ctx.readout([{ k: 'p', v: String(p) }, { k: '#E', v: String(N), tone: 'key' }, { k: 'p + 1', v: String(p + 1) }, { k: T('trace t', 'トレース t'), v: String(tr), tone: Math.abs(tr) <= H ? 'good' : 'warn' }, { k: '2√p', v: fmt(H, 2) }, { k: T('order of G', 'G の位数'), v: sing ? '−' : String(ord) }, { k: T('#E ÷ order', '#E ÷ 位数'), v: sing ? '−' : String(N / ord) }],
        sing ? T(`4a³ + 27b² ≡ 0 (mod ${p}): this cubic has a repeated root, so the curve is singular. Change a or b.`, `4a³ + 27b² ≡ 0 (mod ${p}) なので三次式が重根を持ち、曲線は特異です。a か b を変えてください。`)
          : T(`The count ${N} includes the point at infinity. The order of G divides #E, as Lagrange's theorem demands. The walk looks random: recovering k from kG is the discrete logarithm problem that elliptic-curve cryptography relies on.`, `個数 ${N} には無限遠点が含まれます。G の位数はラグランジュの定理どおり #E を割り切ります。この歩みは無秩序に見えます。kG から k を求めることは離散対数問題で、楕円曲線暗号はその難しさに依拠しています。`));
    },
  };

  /* ---------- 3. the complex torus ---------- */
  // everything the lab shows for one setting of the controls
  function latticeData(v) {
    const t = v.t, lineY = (k) => (k ? t / 2 : 0);
    const u = [v.ux, lineY(v.ul)], w = [v.vx, lineY(v.vl)];
    let sx = u[0] + w[0]; sx -= Math.round(sx);
    const sl = (v.ul + v.vl) % 2, s = [sx, lineY(sl)];
    let rx = -sx; rx -= Math.round(rx); if (rx < -0.5 + 1e-9) rx += 1;
    const r3 = [rx, lineY(sl)];
    const isO = (z) => Math.abs(z[0]) < 0.004 && z[1] === 0;
    const [g2, g3] = g2g3(t), e = eRoots(t);
    const toPt = (z) => { if (isO(z)) return null; const W = wp(z, t); return [W[0][0], W[1][0]]; };
    const P = toPt(u), Q = toPt(w), S = addW(P, Q, g2), Wz = toPt(s);
    return { t, u, w, s, sl, r3, isO, g2, g3, e, P, Q, S, Wz };
  }
  // the old flat picture: the plane coloured by the phase of p, with the period rectangle (also the no-3D fallback)
  function latticeFlat(ctx, host, d) {
    const { t, u, w, s, isO } = d;
    const f = L.fig(host, { x: [-0.56, 0.56], y: [-0.24 * t, 1.08 * t], equal: true, axes: false, grid: false, maxH: 460 });
    const col = L.colours();
    f.raster((x, y) => { const W = wp([x, y], t); if (!W) return col.plate; const val = W[0]; return mixc(L.cmaps.phase(Math.atan2(val[1], val[0]), Math.hypot(val[0], val[1])), col.plate, 0.28); }, { res: 3 });
    f.rect(-0.5, 0, 1, t, { c: 'ink', fill: false, fo: 0, w: 1.4, dash: '5 4' });
    f.line([[-0.56, 0], [0.56, 0]], { c: 'c1', w: 3 });
    f.line([[-0.56, t / 2], [0.56, t / 2]], { c: 'c3', w: 3 });
    [[0, 0], [-0.5, 0], [0.5, 0], [0, t], [-0.5, t], [0.5, t]].forEach(([x, y]) => f.dot(x, y, { c: 'ink', r: 3.5 }));
    f.text(0, 0, '0', { math: true, dx: -9, dy: 16 });
    f.text(0, t, 'τ', { math: true, dx: -9, dy: -8 });
    if (!isO(s)) { f.dot(s[0], s[1], { c: 'hl', r: 7.5, layer: 'over' }); f.text(s[0], s[1], 'u+v', { math: true, dx: 10, dy: -12, anchor: 'start' }); }
    if (!isO(d.r3)) f.dot(d.r3[0], d.r3[1], { c: 'c2', r: 5.5, hollow: true, layer: 'over' });
    const drag = (kx, kl) => (x, y) => { ctx.set(kx, L.clamp(x, -0.5, 0.5), true); const m = ((y % t) + t) % t; ctx.set(kl, Math.abs(m - t / 2) < t / 4 ? 1 : 0, true); ctx.redraw(); };
    f.handle(u[0], u[1], { c: 'c4', label: T('Point u of the torus', 'トーラスの点 u'), bounds: [-0.5, 0.5, -0.2 * t, 1.05 * t], onDrag: drag('ux', 'ul') });
    f.handle(w[0], w[1], { c: 'c4', label: T('Point v of the torus', 'トーラスの点 v'), bounds: [-0.5, 0.5, -0.2 * t, 1.05 * t], onDrag: drag('vx', 'vl') });
    f.text(u[0], u[1], 'u', { math: true, dx: -12, dy: -12 });
    f.text(w[0], w[1], 'v', { math: true, dx: -12, dy: -12 });
  }
  // the real curve y^2 = 4x^3 - g2 x - g3 with the chord, the third point and the sum
  function latticeCurve(host, d) {
    const { e, g2, g3, P, Q, S, Wz } = d, [e1, e2, e3] = e;
    const span = e1 - e3, X0 = e3 - 0.25 * span, X1 = e1 + 0.5 * span;
    const Fw = (x) => 4 * x * x * x - g2 * x - g3, Y = 1.08 * Math.sqrt(Math.max(1e-9, Fw(X1))), box = [X0, X1, -Y, Y];
    const g = L.fig(host, { x: [X0, X1], y: [-Y, Y], aspect: 0.95, maxH: 440, xlabel: 'x = ℘(z)', ylabel: 'y = ℘′(z)' });
    locus(Fw, [e3, e2, e1], X0, X1, Y).forEach((pc) => g.line(pc, { c: pc[0][0] < e2 + 1e-9 && pc.every((q) => q[0] <= e2 + 1e-6) ? 'c3' : 'c1', w: 2.8 }));
    if (P && Q) {
      const lam = S && Math.abs(P[0] - Q[0]) > 1e-9 * (1 + Math.abs(P[0])) ? (Q[1] - P[1]) / (Q[0] - P[0]) : S ? (12 * P[0] * P[0] - g2) / (2 * P[1]) : Infinity;
      const seg = Number.isFinite(lam) ? clipLine(P[0], P[1], 1, lam, box) : clipLine(P[0], P[1], 0, 1, box);
      if (seg) g.line(seg, { c: 'c2', w: 1.8 });
      if (S && inBox(S, box) && inBox([S[0], -S[1]], box)) g.line([[S[0], -S[1]], S], { c: 'muted', w: 1.2, dash: '4 3' });
      if (S && inBox([S[0], -S[1]], box)) g.dot(S[0], -S[1], { c: 'c2', r: 5.5, hollow: true });
    }
    [[P, 'P'], [Q, 'Q']].forEach(([X, lb]) => { if (X && inBox(X, box)) { g.dot(X[0], X[1], { c: 'c4', r: 6.5 }); g.text(X[0], X[1], lb, { math: true, dx: -12, dy: -10 }); } });
    if (Wz && inBox(Wz, box)) g.dot(Wz[0], Wz[1], { c: 'ink', r: 12, hollow: true });
    if (S && inBox(S, box)) { g.dot(S[0], S[1], { c: 'hl', r: 6.5, layer: 'over' }); g.text(S[0], S[1], 'P+Q', { math: true, dx: 14, dy: -14, anchor: 'start' }); }
  }
  function latticeReadout(ctx, d) {
    const { t, g2, g3, P, Q, S, Wz } = d;
    const agree = S && Wz ? Math.abs(S[0] - Wz[0]) / (1 + Math.abs(Wz[0])) : (!S && !Wz ? 0 : 1);
    const box = (() => { const [e1, , e3] = d.e, span = e1 - e3, X0 = e3 - 0.25 * span, X1 = e1 + 0.5 * span, Y = 1.08 * Math.sqrt(Math.max(1e-9, 4 * X1 ** 3 - g2 * X1 - g3)); return [X0, X1, -Y, Y]; })();
    ctx.readout([{ k: 'τ', v: `${fmt(t, 2)}i` }, { k: 'g₂', v: fmt(g2, 4) }, { k: 'g₃', v: fmt(g3, 4) }, { k: T('P + Q from the chord', '弦から求めた P + Q'), v: pt(S, 3), tone: 'key' }, { k: '(℘(u+v), ℘′(u+v))', v: pt(Wz, 3), tone: agree < 1e-6 ? 'good' : 'warn' }],
      !P || !Q ? T('A point at a lattice point of the torus maps to O, the point at infinity. Move u or v off the corner.', '格子点にあるトーラスの点は無限遠点 O に写ります。u か v を角から離してください。')
        : !S ? T('u + v is a lattice point, so P + Q = O: the vertical line through P and Q meets the curve only at infinity.', 'u + v が格子点なので P + Q = O です。P と Q を通る垂直な直線は無限遠でしか曲線と交わりません。')
          : !inBox(S, box) ? T('Here u + v lies near a lattice point, where ℘ has a double pole, so P + Q is far off the chart. Both computations still agree, as the readout shows.', 'ここでは u + v が格子点の近くにあり、℘ はそこで二位の極を持つので、P + Q は図のはるか外です。読み取り欄のとおり、二つの計算はそれでも一致します。')
            : T('Adding u and v on the torus and adding P and Q with a ruler give the same point: the gold dot sits inside the ring. The third point of the line is the image of −(u + v), because three points on a line add to O. Two points on the oval add to a point on the branch, and a branch point plus an oval point lands on the oval, matching Im(u + v) on the torus.', 'トーラス上で u と v を足すことと、定規で P と Q を足すことは同じ点を与えます。金色の点が輪の中に収まっています。直線の三つ目の点は −(u + v) の像です。一直線上の三点の和は O だからです。楕円形上の二点の和は枝の上に、枝の点と楕円形の点の和は楕円形の上に来て、トーラス上の Im(u + v) と対応します。'));
  }
  // the doughnut: Re z goes round the axis, Im z round the tube. Im z = 0 is the outer equator, Im z = t/2 the inner one.
  const TOR_R = 1.55, TOR_r = 0.62;
  const torusPt = (x, y, t, lift = 0) => { const ph = 2 * PI * x, th = 2 * PI * y / t, rr = TOR_r + lift, R = TOR_R + rr * Math.cos(th); return [R * Math.cos(ph), R * Math.sin(ph), rr * Math.sin(th)]; };
  const flatPath = (a, b, t, lift, n = 90) => L.seq(n + 1, (i) => torusPt(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, t, lift));
  D['lattice-torus'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('The torus ℂ/Λ, coloured by the value of ℘ (hue = argument). Re z runs round the axis and Im z round the tube; the blue and teal circles are the lines Im z = 0 and Im z = t/2, where ℘ is real. Drag u and v along them. The doughnut’s proportions are fixed for the picture; τ changes the colouring.', '℘ の値で色づけしたトーラス ℂ/Λ です（色相が偏角）。Re z は軸のまわりを、Im z は管のまわりを回ります。青と青緑の円は ℘ が実数になる直線 Im z = 0 と Im z = t/2 で、u と v をその上でドラッグできます。ドーナツの形は図のために固定しており、τ は色づけを変えます。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Its image under z ↦ (℘(z), ℘′(z)): the curve y² = 4x³ − g₂x − g₃', 'z ↦ (℘(z), ℘′(z)) による像：曲線 y² = 4x³ − g₂x − g₃'));
        st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const panels = (d) => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          st.cap1.textContent = T('The plane coloured by the value of ℘ (hue = argument). The pattern repeats across the dashed period rectangle: this is the torus ℂ/Λ. Drag u and v along the two lines where ℘ is real.', '℘ の値で色づけした平面です（色相が偏角）。模様は点線の周期長方形ごとに繰り返し、これがトーラス ℂ/Λ です。℘ が実数になる二本の線に沿って u と v をドラッグしてください。');
          latticeFlat(ctx, st.v3, d);
        }
        latticeCurve(st.g2, d);
        L.legend(st.leg, [{ c: 'c1', label: T('Im z = 0 and its image, the unbounded branch', 'Im z = 0 とその像（非有界な枝）') }, { c: 'c3', label: T('Im z = t/2 and its image, the oval', 'Im z = t/2 とその像（楕円形の閉曲線）') }].concat(st.flat ? [] : [{ c: 'c4', label: T('u, v and the parallelogram 0, u, u + v, v', 'u、v と平行四辺形 0, u, u + v, v') }]).concat([{ kind: 'dot', c: 'hl', label: T('u + v and P + Q by chord and tangent', 'u + v と、弦と接線による P + Q') }, { kind: 'dot', c: 'c2', label: T('third point on the line: −(u + v)', '直線上の三つ目の点：−(u + v)') }, { kind: 'dot', c: 'ink', label: T('ring: (℘(u + v), ℘′(u + v)) computed directly', '輪：直接計算した (℘(u + v), ℘′(u + v))') }]));
        latticeReadout(ctx, d);
      };
      const d0 = latticeData(v);
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 470, camera: [-4.95, 2.85, 3.7], target: [0, 0, -0.2], fov: 34,
        label: T('3D torus coloured by the Weierstrass ℘ function. Drag to rotate.', 'ワイエルシュトラスの ℘ 関数で色づけした 3D のトーラス。ドラッグで回転できます。'),
        init(S) {
          st.flat = false;
          const ink = S.colour('ink').clone(), plate = S.colour('plate');
          st.colour = (tt) => (a, b) => { const W = wp([a, b * tt], tt); if (!W) return ink; const val = W[0]; const h = ((Math.atan2(val[1], val[0]) / (2 * PI)) % 1 + 1) % 1, m = Math.hypot(val[0], val[1]), band = m > 0 ? 0.5 - 0.5 * Math.cos(2 * PI * Math.log2(m)) : 0; return new S.THREE.Color().setHSL(h, 0.78, (S.dark ? 0.4 : 0.35) + 0.12 * band, S.THREE.SRGBColorSpace).lerp(plate, 0.04); };
          st.tCol = d0.t;
          st.surf = S.surface((a, b) => torusPt(a, b, 1), { u: [-0.5, 0.5], v: [0, 1], nu: 168, nv: 84, colour: st.colour(d0.t), rough: 0.62, coat: 0.12 });
          st.eq0 = S.tube(L.seq(161, (i) => torusPt(-0.5 + i / 160, 0, 1, 0.012)), { c: 'c1', r: 0.022, closed: true });
          st.eqH = S.tube(L.seq(161, (i) => torusPt(-0.5 + i / 160, 0.5, 1, 0.012)), { c: 'c3', r: 0.022, closed: true });
          st.edges = [0, 1, 2, 3].map(() => S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c4', r: 0.014 }));
          st.zero = S.sphere(torusPt(0, 0, 1, 0.02), 0.055, { c: 'ink' });
          st.zeroLab = S.label('0', torusPt(0, 0, 1, 0.1), { math: true });
          st.sum = S.sphere([0, 0, 0], 0.075, { c: 'hl', glow: 0.35 });
          st.sumLab = S.label('u+v', [0, 0, 0], { math: true });
          st.third = S.sphere([0, 0, 0], 0.055, { c: 'c2' });
          const drag = (kx, kl) => (q) => {
            const x = L.clamp(Math.atan2(q.y, q.x) / (2 * PI), -0.5, 0.5), line = Math.hypot(q.x, q.y) < TOR_R ? 1 : 0;
            ctx.set(kx, x, true); ctx.set(kl, line, true); ctx.redraw();
            return torusPt(Math.round(x / 0.005) * 0.005, line ? 0.5 : 0, 1, 0.03);
          };
          st.hu = S.handle(torusPt(d0.u[0], d0.u[1], d0.t, 0.03), { c: 'c4', r: 0.075, plane: [[0, 0, 1], [0, 0, 0]], label: 'u', onDrag: drag('ux', 'ul') });
          st.hv = S.handle(torusPt(d0.w[0], d0.w[1], d0.t, 0.03), { c: 'c4', r: 0.075, plane: [[0, 0, 1], [0, 0, 0]], label: 'v', onDrag: drag('vx', 'vl') });
          // labels are HTML over the canvas, so hide each one while its point is on the far side of the torus
          st.occl = [[st.zeroLab, () => [0, 0]], [st.hu.labelItem, () => st.d.u], [st.hv.labelItem, () => st.d.w], [st.sumLab, () => st.d.s]];
          st.occlude = () => {
            if (!st.d) return;
            const c = S.camera.position, t = st.d.t;
            for (const [item, at] of st.occl) {
              const [x, y] = at(), ph = 2 * PI * x, th = 2 * PI * y / t, q = torusPt(x, y, t, 0), nn = [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), Math.sin(th)];
              const dv = [c.x - q[0], c.y - q[1], c.z - q[2]], dl = Math.hypot(...dv);
              item.el.dataset.hidden = (dv[0] * nn[0] + dv[1] * nn[1] + dv[2] * nn[2]) / dl < 0.08 ? '1' : '';
            }
          };
          S.controls.addEventListener('change', st.occlude);
        },
        update(S, vv) {
          const d = latticeData(vv), t = d.t;
          if (st.tCol !== t) { st.tCol = t; st.surf.update((a, b) => torusPt(a, b, 1), st.colour(t)); }
          const uu = [d.u[0] + d.w[0], d.u[1] + d.w[1]], lift = 0.022;
          st.edges[0].update(flatPath([0, 0], d.u, t, lift)); st.edges[1].update(flatPath(d.u, uu, t, lift));
          st.edges[2].update(flatPath([0, 0], d.w, t, lift)); st.edges[3].update(flatPath(d.w, uu, t, lift));
          st.hu.at(torusPt(d.u[0], d.u[1], t, 0.03)); st.hv.at(torusPt(d.w[0], d.w[1], t, 0.03));
          const sp = torusPt(d.s[0], d.s[1], t, 0.035);
          st.sum.visible = st.third.visible = !d.isO(d.s);
          st.sum.position.set(...sp); st.sumLab.set(torusPt(d.s[0], d.s[1], t, 0.12), d.isO(d.s) ? '' : 'u+v');
          st.third.position.set(...torusPt(d.r3[0], d.r3[1], t, 0.03));
          st.d = d; st.occlude();
          S.invalidate();
          panels(d);
        },
        fallback(c, vv) { st.flat = true; panels(latticeData(vv)); },
      });
      if (!st.__v3 && !st.flat) panels(d0);
    },
  };
})();
