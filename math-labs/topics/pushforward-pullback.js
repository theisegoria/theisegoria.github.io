'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/pushforward-pullback.cjs) ---------- */
  const cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

  // 1. the bilinear map of the unit square onto the quadrilateral P00, P10, P11, P01
  // phi(u, v) = A + uB + vC + uvE with A = P00, B = P10 - P00, C = P01 - P00, E = P00 - P10 - P01 + P11
  function bilinear(P) {
    const [P00, P10, P11, P01] = P, A = P00, B = sub(P10, P00), C = sub(P01, P00), E = [P00[0] - P10[0] - P01[0] + P11[0], P00[1] - P10[1] - P01[1] + P11[1]];
    const map = (u, v) => [A[0] + u * B[0] + v * C[0] + u * v * E[0], A[1] + u * B[1] + v * C[1] + u * v * E[1]];
    // det D phi = (B + vE) x (C + uE) = B x C + u (B x E) + v (E x C): affine, so its zero set is a straight line
    const j0 = cr(B, C), ju = cr(B, E), jv = cr(E, C);
    const jac = (u, v) => j0 + ju * u + jv * v;
    // every (u, v) in the closed square with phi(u, v) = y: a quadratic in u, then v
    function preimages(y) {
      const w = sub(y, A), a = cr(B, E), b = cr(B, C) - cr(w, E), c = -cr(w, C), us = [];
      const sc = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), 1e-300);
      if (Math.abs(a) < 1e-12 * sc) { if (Math.abs(b) > 1e-14 * sc) us.push(-c / b); }
      else { const d = b * b - 4 * a * c; if (d >= 0) { const s = Math.sqrt(d), q = -0.5 * (b + (b >= 0 ? s : -s)); us.push(q / a); if (q !== 0) us.push(c / q); } }
      const out = [], eps = 1e-9;
      for (const u of us) {
        if (!(u >= -eps && u <= 1 + eps)) continue;
        const g = [C[0] + u * E[0], C[1] + u * E[1]], gg = g[0] * g[0] + g[1] * g[1];
        if (gg < 1e-24) continue;
        const r = [w[0] - u * B[0], w[1] - u * B[1]], v = (r[0] * g[0] + r[1] * g[1]) / gg;
        if (v >= -eps && v <= 1 + eps) { const z = map(u, v); if (Math.hypot(z[0] - y[0], z[1] - y[1]) < 1e-7 * (1 + Math.hypot(y[0], y[1]))) out.push([u, v]); }
      }
      if (out.length === 2 && Math.hypot(out[0][0] - out[1][0], out[0][1] - out[1][1]) < 1e-9) out.pop();
      return out;
    }
    return { map, jac, preimages, j: [j0, ju, jv], B, C, E };
  }
  // shoelace area of the polygon: for the bilinear map the edges are straight, so this is the signed integral of det D phi
  const shoelace = (P) => { let s = 0; for (let i = 0; i < P.length; i++) s += cr(P[i], P[(i + 1) % P.length]); return s / 2; };
  // midpoint-rule integrals over the square: pull back f and integrate with |det| and with det
  function pullIntegrals(Bm, f, n = 160) {
    let abs = 0, sgn = 0; const h = 1 / n;
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const u = (i + 0.5) * h, v = (k + 0.5) * h, J = Bm.jac(u, v), y = Bm.map(u, v), fy = f(y[0], y[1]); abs += fy * Math.abs(J); sgn += fy * J; }
    return { abs: abs * h * h, signed: sgn * h * h };
  }
  // the same integrals computed downstairs: f times the number of preimages, and f on the image alone
  function pushIntegrals(Bm, P, f, n = 200) {
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), hx = (x1 - x0) / n, hy = (y1 - y0) / n;
    let mult = 0, img = 0, twice = 0;
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = x0 + (i + 0.5) * hx, y = y0 + (k + 0.5) * hy, N = Bm.preimages([x, y]).length; if (!N) continue; const fy = f(x, y); mult += N * fy; img += fy; if (N > 1) twice += 1; }
    return { mult: mult * hx * hy, image: img * hx * hy, twiceArea: twice * hx * hy };
  }
  const INTEGRANDS = [(x, y) => 1, (x, y) => Math.exp(-((x - 1.05) ** 2 + (y - 0.75) ** 2) / 0.35), (x, y) => x * x + y * y];

  // 2. push-forward of a measure on [0, 1] by T(x) = x + a sin(2 pi x) / (2 pi)
  const T = (a) => (x) => x + a * Math.sin(TAU * x) / TAU;
  const Tp = (a) => (x) => 1 + a * Math.cos(TAU * x);
  // error function (Abramowitz and Stegun 7.1.26, |error| < 1.5e-7)
  const erf = (x) => { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  // source measures: uniform, or a normal bump (mean 0.3, sd 0.14) truncated to [0, 1]
  function source(kind) {
    if (kind === 0) return { rho: (x) => (x >= 0 && x <= 1 ? 1 : 0), cdf: (x) => clamp(x, 0, 1), quantile: (p) => p };
    const m = 0.3, s = 0.14, lo = Phi(-m / s), Z = Phi((1 - m) / s) - lo;
    const rho = (x) => (x >= 0 && x <= 1 ? Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(TAU) * Z) : 0);
    const cdf = (x) => clamp((Phi((clamp(x, 0, 1) - m) / s) - lo) / Z, 0, 1);
    const quantile = (p) => { let a = 0, b = 1; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (cdf(c) < p) a = c; else b = c; } return (a + b) / 2; };
    return { rho, cdf, quantile };
  }
  const bisect = (g, a, b, n = 60) => { let ga = g(a); if (ga === 0) return a; if (g(b) === 0) return b; for (let i = 0; i < n; i++) { const c = (a + b) / 2, gc = g(c); if ((gc > 0) === (ga > 0)) { a = c; ga = gc; } else b = c; } return (a + b) / 2; };
  // all x in [0, 1] with T(x) = y
  function roots(Tf, y, n = 600) {
    const out = []; let xp = 0, gp = Tf(0) - y;
    if (gp === 0) out.push(0);
    for (let i = 1; i <= n; i++) { const x = i / n, g = Tf(x) - y; if (g === 0) out.push(x); else if (gp !== 0 && (g > 0) !== (gp > 0)) out.push(bisect((t) => Tf(t) - y, xp, x)); xp = x; gp = g; }
    return out;
  }
  // density of the push-forward: sum over preimages of rho / |T'|
  const pushDensity = (Tf, Tpf, rho, y) => roots(Tf, y).reduce((s, x) => s + rho(x) / Math.max(1e-12, Math.abs(Tpf(x))), 0);
  // the preimage T^{-1}([y0, y1]) as a union of intervals of [0, 1]
  function preimageIntervals(Tf, y0, y1, n = 1200) {
    const inB = (x) => { const t = Tf(x); return t >= y0 && t <= y1; }, edge = (a, b) => { const ta = Tf(a), tb = Tf(b), yv = (ta < y0) !== (tb < y0) ? y0 : y1; return bisect((t) => Tf(t) - yv, a, b); };
    const out = []; let start = inB(0) ? 0 : null, prev = 0;
    for (let i = 1; i <= n; i++) { const x = i / n, ins = inB(x); if (ins && start === null) start = edge(prev, x); if (!ins && start !== null) { out.push([start, edge(prev, x)]); start = null; } prev = x; }
    if (start !== null) out.push([start, 1]);
    return out;
  }
  const massOf = (cdf, ivs) => ivs.reduce((s, [a, b]) => s + cdf(b) - cdf(a), 0);
  // heights where T' = 0 (the fold points of the graph), only when a > 1
  const caustics = (a) => { if (a <= 1) return []; const x1 = Math.acos(-1 / a) / TAU; return [x1, 1 - x1]; };

  // 3. push-forward of a density on the plane by F: R^2 -> R, by the coarea formula q(c) = integral over {F = c} of p / |grad F|
  function density2(kind, r) {
    if (kind === 1) return (x, y) => (Math.abs(x) <= 1 && Math.abs(y) <= 1 ? 0.25 : 0);
    const k = 1 - r * r, n = 1 / (TAU * Math.sqrt(k));
    return (x, y) => n * Math.exp(-(x * x - 2 * r * x * y + y * y) / (2 * k));
  }
  const MAPS = [
    { F: (x, y) => x, g: () => 1 },
    { F: (x, y) => x + y, g: () => Math.SQRT2 },
    { F: (x, y) => Math.hypot(x, y), g: () => 1 },
    { F: (x, y) => x * y, g: (x, y) => Math.hypot(x, y) },
  ];
  function coarea(map, p, c, kind) {
    const W = kind === 1 ? 1.2 : 7;
    if (map === 0 || map === 1) { const n = 4000, h = 2 * W / n; let s = 0; for (let i = 0; i < n; i++) { const t = -W + (i + 0.5) * h; s += map === 0 ? p(c, t) : p(t, c - t); } return s * h; }
    if (map === 2) { if (c < 0) return 0; const n = 1440; let s = 0; for (let i = 0; i < n; i++) { const t = TAU * (i + 0.5) / n; s += p(c * Math.cos(t), c * Math.sin(t)); } return s * c * TAU / n; }
    // F = xy: on the branch x = +-e^s the weight dl / |grad F| is exactly ds
    const s0 = -16, s1 = kind === 1 ? 0.3 : 3, n = 8000, h = (s1 - s0) / n; let s = 0;
    for (let i = 0; i < n; i++) { const t = s0 + (i + 0.5) * h, e = Math.exp(t); s += p(e, c / e) + p(-e, -c / e); }
    return s * h;
  }
  // the same push-forward measured directly: mass of the plane cells whose F falls in each bin
  function histogram(map, p, kind, lo, hi, bins, n = 400) {
    const Lh = kind === 1 ? 1 : 5, h = 2 * Lh / n, m = new Float64Array(bins), F = MAPS[map].F, bw = (hi - lo) / bins; let tot = 0;
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = -Lh + (i + 0.5) * h, y = -Lh + (k + 0.5) * h, w = p(x, y) * h * h; tot += w; const b = Math.floor((F(x, y) - lo) / bw); if (b >= 0 && b < bins) m[b] += w; }
    return { dens: Array.from(m, (x) => x / bw), total: tot };
  }
  // closed forms, for checking
  const K0 = (x) => { const n = 4000, T0 = 12, h = T0 / n; let s = 0; for (let i = 0; i < n; i++) { const t = (i + 0.5) * h; s += Math.exp(-x * Math.cosh(t)); } return s * h; };
  const normalPdf = (x, v) => Math.exp(-x * x / (2 * v)) / Math.sqrt(TAU * v);

  (window.LabModels = window.LabModels || {})['pushforward-pullback'] = { bilinear, shoelace, pullIntegrals, pushIntegrals, INTEGRANDS, T, Tp, source, roots, pushDensity, preimageIntervals, massOf, caustics, density2, MAPS, coarea, histogram, K0, normalPdf, erf };

  if (!L.fig) return; // model-only load (checks)
  const Tr = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------- 1. the area formula ---------- */
  D['area-formula'] = {
    render(ctx, v) {
      const st = ctx.state;
      st.P ||= { P00: [0, 0], P10: [1.6, 0.2], P01: [0.2, 1.25] };
      const P = [st.P.P00, st.P.P10, [v.x11, v.y11], st.P.P01], Bm = bilinear(P), f = INTEGRANDS[v.fn];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      // right first: the plane, where the corners are dragged
      L.h('p', 'lab-cap', c1, Tr('Upstairs: the unit square, coloured by the pulled-back integrand (f∘φ)·det Dφ. Warm where φ keeps orientation, cool where it reverses it.', '上の空間：単位正方形を、引き戻した被積分関数 (f∘φ)·det Dφ で色づけています。φ が向きを保つところは暖色、反転させるところは寒色です。'));
      const g = L.fig(c1, { x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, xlabel: 'u', ylabel: 'v', maxH: 380, ticksX: [[0, '0'], [0.5, '½'], [1, '1']], ticksY: [[0, '0'], [0.5, '½'], [1, '1']] });
      let S = 1e-9; for (let i = 0; i <= 20; i++) for (let k = 0; k <= 20; k++) { const y = Bm.map(i / 20, k / 20); S = Math.max(S, Math.abs(f(y[0], y[1]) * Bm.jac(i / 20, k / 20))); }
      g.raster((u, w) => (u < 0 || u > 1 || w < 0 || w > 1 ? 0 : (() => { const y = Bm.map(u, w); return 0.85 * f(y[0], y[1]) * Bm.jac(u, w) / S; })()), { cmap: 'div' });
      for (let k = 0; k <= 8; k++) { g.seg([k / 8, 0], [k / 8, 1], { c: 'ink', w: 0.6, op: 0.35 }); g.seg([0, k / 8], [1, k / 8], { c: 'ink', w: 0.6, op: 0.35 }); }
      g.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { c: 'ink', w: 1.6, fo: 0 });
      // the fold line det D phi = 0 is straight because the determinant is affine in (u, v)
      const [j0, ju, jv] = Bm.j, fold = [];
      for (let i = 0; i <= 400; i++) { const t = i / 400; if (Math.abs(jv) >= Math.abs(ju)) { const w = -(j0 + ju * t) / jv; if (w >= 0 && w <= 1) fold.push([t, w]); } else { const u = -(j0 + jv * t) / ju; if (u >= 0 && u <= 1) fold.push([u, t]); } }
      if (Math.abs(jv) < Math.abs(ju)) fold.sort((a, b) => a[1] - b[1]);
      if (fold.length > 1) { g.line(fold, { c: 'c2', w: 2.6 }); const m = fold[fold.length >> 1]; g.text(m[0], m[1], 'det Dφ = 0', { small: true, c: 'c2', dx: 8, dy: -8, anchor: 'start' }); }
      [[0, 0, '(0,0)'], [1, 0, '(1,0)'], [1, 1, '(1,1)'], [0, 1, '(0,1)']].forEach(([u, w, s]) => g.text(u, w, s, { small: true, c: 'muted', dx: u ? 6 : -6, dy: w ? -6 : 14, anchor: u ? 'start' : 'end' }));

      L.h('p', 'lab-cap', c2, Tr('Downstairs: the image φ(square). Drag the four corners. The shading is f times the number of points of the square that land there.', '下の空間：像 φ(正方形) です。四つの角をドラッグできます。濃さは f に、そこへ写ってくる正方形の点の個数を掛けたものです。'));
      const X0 = -0.9, X1 = 2.7, Y0 = -0.9, Y1 = 2.3;
      const h = L.fig(c2, { x: [X0, X1], y: [Y0, Y1], equal: true, xlabel: 'x', ylabel: 'y', maxH: 380 });
      let fmax = 1e-9; for (let i = 0; i <= 20; i++) for (let k = 0; k <= 20; k++) { const y = Bm.map(i / 20, k / 20); fmax = Math.max(fmax, f(y[0], y[1])); }
      const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]), bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
      h.raster((x, y) => { if (x < bx0 || x > bx1 || y < by0 || y > by1) return 0; const N = Bm.preimages([x, y]).length; return N ? 0.46 * N * (0.25 + 0.75 * f(x, y) / fmax) : 0; }, { cmap: 'seq' });
      for (let k = 0; k <= 8; k++) { h.line(L.seq(41, (i) => Bm.map(k / 8, i / 40)), { c: 'ink', w: 0.6, op: 0.35 }); h.line(L.seq(41, (i) => Bm.map(i / 40, k / 8)), { c: 'ink', w: 0.6, op: 0.35 }); }
      h.poly(P, { c: 'ink', w: 1.8, fo: 0 });
      if (fold.length > 1) h.line(fold.map(([u, w]) => Bm.map(u, w)), { c: 'c2', w: 2.6 });
      const names = [['P00', 'φ(0,0)'], ['P10', 'φ(1,0)'], [null, 'φ(1,1)'], ['P01', 'φ(0,1)']];
      P.forEach((p, i) => {
        const [key, lab] = names[i], cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, right = p[0] >= cx, up = p[1] >= cy;
        h.text(p[0], p[1], lab, { small: true, c: i === 2 ? 'hl' : 'ink', dx: right ? 12 : -12, dy: up ? -10 : 18, anchor: right ? 'start' : 'end', layer: 'over' });
        h.handle(p[0], p[1], { c: i === 2 ? 'hl' : 'c3', label: Tr(`Corner ${lab}`, `角 ${lab}`), bounds: [X0 + 0.05, X1 - 0.05, Y0 + 0.05, Y1 - 0.05], onDrag: (x, y) => {
          if (key) { st.P[key] = [Math.round(x * 100) / 100, Math.round(y * 100) / 100]; ctx.redraw(); } else { ctx.set('x11', x, true); ctx.set('y11', y, true); ctx.redraw(); }
        } });
      });
      L.legend(ctx.host, [{ c: 'pos', kind: 'fill', label: Tr('det Dφ > 0 (orientation kept)', 'det Dφ > 0（向きを保つ）') }, { c: 'neg', kind: 'fill', label: Tr('det Dφ < 0 (orientation reversed)', 'det Dφ < 0（向きが反転）') }, { c: 'c1', kind: 'fill', label: Tr('f · #preimages (darker = covered twice)', 'f · 逆像の個数（濃い = 二重に覆われる）') }, { c: 'c2', label: Tr('fold, and its image', '折り目とその像') }]);
      const I1 = pullIntegrals(Bm, f), I2 = pushIntegrals(Bm, P, f);
      let jmin = Infinity; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([u, w]) => { jmin = Math.min(jmin, Bm.jac(u, w)); });
      const folded = jmin < 0 && I2.twiceArea > 1e-4, flipped = jmin < 0 && !folded;
      ctx.readout([
        { k: '∫ (f∘φ) |det Dφ| du dv', v: fmt(I1.abs, 3), tone: 'key' },
        { k: Tr('∫ f · #φ⁻¹(y) dy', '∫ f · #φ⁻¹(y) dy'), v: fmt(I2.mult, 3), tone: 'good' },
        { k: Tr('∫ over the image φ(D) of f', '像 φ(D) 上の ∫ f'), v: fmt(I2.image, 3), tone: folded ? 'warn' : undefined },
        { k: '∫ (f∘φ) det Dφ du dv', v: fmt(I1.signed, 3) },
        { k: Tr('area covered twice', '二重に覆われる面積'), v: fmt(I2.twiceArea, 3) },
      ], folded
        ? Tr('The corner has been pulled across, so φ folds: a strip of the plane is covered twice. The pulled-back integral with |det Dφ| still equals the downstairs integral, but only once you count each point as many times as it is hit. The image alone undercounts, and the signed integral cancels the folded layer.', '角が内側へ引き込まれたので φ は折れ曲がり、平面の一部が二重に覆われています。|det Dφ| を使って引き戻した積分は、各点を当たった回数だけ数えれば下の積分に一致します。像だけの積分は足りず、符号付きの積分では折り返した層が打ち消されます。')
        : flipped ? Tr('Every determinant is negative: φ is one-to-one but reverses orientation. The absolute value makes the two sides agree; the signed integral comes out negative.', '行列式はすべて負です。φ は一対一ですが向きを反転させます。絶対値をとると両辺が一致し、符号付きの積分は負になります。')
          : Tr('φ is one-to-one and keeps orientation, so all four integrals agree (the downstairs ones are grid estimates to about three digits). Drag the gold corner φ(1,1) inside the triangle of the other three to make the map fold.', 'φ は一対一で向きを保つので、四つの積分はすべて一致します（下の空間の値は三桁程度の格子による推定です）。金色の角 φ(1,1) を他の三つの角がつくる三角形の内側へドラッグすると、写像が折れ曲がります。'));
    },
  };

  /* ---------- 2. pushing a measure forward ---------- */
  const BINS = 25;
  D['pushforward-measure'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, a = v.a, src = source(v.src), Tf = T(a), Tpf = Tp(a), key = `${a}|${v.src}`;
      if (st.key !== key) {
        const bars = L.seq(BINS, (i) => massOf(src.cdf, preimageIntervals(Tf, i / BINS, (i + 1) / BINS)) * BINS);
        const curve = L.seq(401, (i) => { const y = (i + 0.5) / 401; return [pushDensity(Tf, Tpf, src.rho, y), y]; });
        const N = 500, parts = L.seq(N, (i) => { const x = src.quantile((i + 0.5) / N); return { x, y: Tf(x), t0: 3.2 * (((i * 0.6180339887) % 1)) }; });
        Object.assign(st, { key, bars, curve, parts });
      }
      st.c ??= 0.5;
      const c = st.c, w = v.w, y0 = clamp(c - w / 2, 0, 1), y1 = clamp(c + w / 2, 0, 1);
      const ivs = preimageIntervals(Tf, y0, y1), mass = massOf(src.cdf, ivs);
      const rmax = Math.max(...L.seq(201, (i) => src.rho(i / 200)));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, Tr('The map y = T(x), with the source measure μ drawn along the bottom. The shaded strips are T⁻¹(B), everything that lands in the window B.', '写像 y = T(x) です。下端に元の測度 μ を描いています。縦の帯は T⁻¹(B)、つまり窓 B に落ちてくるものすべてです。'));
      const YB = -0.3, lf = L.fig(c1, { x: [0, 1], y: [YB, 1], equal: true, xlabel: 'x', ylabel: 'y', maxH: 430, ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      const base = -0.04, sc = (YB + 0.03 - base) / rmax; // the density strip hangs below the axis
      lf.rect(0, y0, 1, y1 - y0, { c: 'hl', fill: 'hl', fo: 0.16, nostroke: true, layer: 'under' });
      ivs.forEach(([p, q]) => {
        lf.rect(p, 0, q - p, 1, { c: 'c2', fill: 'c2', fo: 0.13, nostroke: true, layer: 'under' });
        lf.area(L.sample(p, q, 40, (x) => [x, base + sc * src.rho(x)]), { base, c: 'hl', fo: 0.75, w: 0 });
      });
      lf.line(L.sample(0, 1, 300, (x) => [x, base + sc * src.rho(x)]), { c: 'ink', w: 1.4 });
      lf.hline(base, { c: 'muted', w: 0.8, dash: false, op: 0.6 });
      lf.text(0.99, base + sc * rmax * 0.55, 'μ', { math: true, c: 'ink', anchor: 'end' });
      lf.line(L.sample(0, 1, 400, (x) => [x, Tf(x)]), { c: 'c1', w: 3 });
      lf.line([[0, 0], [1, 1]], { c: 'muted', w: 0.8, dash: '3 4', op: 0.6, layer: 'under' });
      caustics(a).forEach((x) => { const y = Tf(x); lf.seg([0, y], [x, y], { c: 'c4', w: 1.1, dash: '3 3' }); lf.dot(x, y, { c: 'c4', r: 4 }); });
      ivs.forEach(([p, q]) => { lf.seg([p, 0], [p, Tf(p)], { c: 'c2', w: 1, op: 0.8 }); lf.seg([q, 0], [q, Tf(q)], { c: 'c2', w: 1, op: 0.8 }); });
      lf.text(0.03, c, 'B', { math: true, c: 'hl', anchor: 'start', dy: 4, layer: 'over' });

      L.h('p', 'lab-cap', c2, Tr('The push-forward T#μ on the same y axis: exact bin masses (bars), the density Σ ρ/|T′| (curve) and the particles that have arrived (outline). Drag the window.', '同じ y 軸にとった押し出し T#μ です。各区間の正確な質量（棒）、密度 Σ ρ/|T′|（曲線）、到着した粒子（輪郭）を示します。窓をドラッグできます。'));
      const bmax = Math.max(...st.bars), dmax = Math.min(4.2, Math.max(2.2, bmax * 1.25));
      const rf = L.fig(c2, { x: [0, dmax], y: [YB, 1], aspect: 1.3, xlabel: Tr('density', '密度'), maxH: 430, ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      rf.rect(0, y0, dmax, y1 - y0, { c: 'hl', fill: 'hl', fo: 0.16, nostroke: true, layer: 'under' });
      st.bars.forEach((b, i) => { rf.rect(0, i / BINS, Math.min(b, dmax), 1 / BINS, { c: 'muted', fill: 'muted', fo: 0.28, w: 0.5, op: 0.6, layer: 'under' }); if (b > dmax) rf.text(dmax, (i + 0.5) / BINS, `${fmt(b, 1)} ›`, { small: true, c: 'muted', anchor: 'end', dy: 4 }); });
      // the density curve has 1/sqrt singularities at the fold heights; cut it at the frame
      let run = []; const flush = () => { if (run.length > 1) rf.line(run, { c: 'c1', w: 2.4 }); run = []; };
      st.curve.forEach(([d, y]) => { if (d > dmax) { if (run.length) run.push([dmax, y]); flush(); } else run.push([d, y]); }); flush();
      caustics(a).forEach((x) => { const y = Tf(x); rf.hline(y, { c: 'c4', w: 1.1, dash: '3 3' }); rf.text(dmax, y, Tr('fold: T′ = 0', '折り目：T′ = 0'), { small: true, c: 'c4', anchor: 'end', dy: -5 }); });
      rf.handle(dmax * 0.82, c, { c: 'hl', axis: 'y', label: Tr('Centre of the window B', '窓 B の中心'), bounds: [0, dmax, w / 2, 1 - w / 2], onDrag: (x, y) => { st.c = Math.round(y * 200) / 200; ctx.redraw(); } });
      rf.text(dmax * 0.82, c, 'B', { math: true, c: 'hl', dx: 14, dy: 4, anchor: 'start', layer: 'over' });
      // particles: each rises from x to the graph, then runs across to its height y = T(x)
      const DUR = 5, parts = st.parts, NP = parts.length;
      const frame = (t) => {
        lf.clear('over'); rf.clear('over');
        const cnt = new Float64Array(BINS); let inB = 0, arrived = 0;
        for (const p of parts) {
          const s = t - p.t0; if (s <= 0) continue;
          if (s < 0.55) { const k = s / 0.55; lf.dot(p.x, base + (p.y - base) * k, { c: 'c3', r: 2.4, layer: 'over' }); continue; }
          if (s < 1.15) { const k = (s - 0.55) / 0.6; lf.dot(p.x + (1 - p.x) * k, p.y, { c: 'c3', r: 2.4, layer: 'over' }); continue; }
          arrived++; cnt[Math.min(BINS - 1, Math.floor(p.y * BINS))]++; if (p.y >= y0 && p.y <= y1) inB++;
        }
        const pts = []; for (let i = 0; i < BINS; i++) { const d = Math.min(dmax, cnt[i] / NP * BINS); pts.push([d, i / BINS], [d, (i + 1) / BINS]); }
        rf.line([[0, 0], ...pts, [0, 1]], { c: 'c3', w: 1.6, layer: 'over' });
        return { inB, arrived };
      };
      let last = frame(DUR);
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { const u = Math.min(DUR, t); last = frame(u); lab.textContent = Tr(`${last.arrived} of ${NP} arrived`, `${NP} 個中 ${last.arrived} 個が到着`); if (u >= DUR) return false; }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: Tr('Drop the particles', '粒子を落とす') });
      L.legend(ctx.host, [{ c: 'c1', label: Tr('T, and the density of T#μ', 'T と T#μ の密度') }, { c: 'hl', kind: 'fill', label: Tr('window B and the mass of T⁻¹(B)', '窓 B と T⁻¹(B) の質量') }, { c: 'c3', label: Tr('particles drawn from μ', 'μ から取った粒子') }, { c: 'c4', dash: true, label: Tr('fold heights', '折り目の高さ') }]);
      const ca = caustics(a);
      ctx.readout([
        { k: 'B', v: `[${fmt(y0, 3)}, ${fmt(y1, 3)}]` },
        { k: 'T#μ(B) = μ(T⁻¹(B))', v: fmt(mass, 4), tone: 'key' },
        { k: Tr('pieces of T⁻¹(B)', 'T⁻¹(B) の区間の数'), v: String(ivs.length), tone: ivs.length > 1 ? 'warn' : undefined },
        { k: Tr('particles in B', 'B に入った粒子'), v: fmt(frame(DUR).inB / NP, 3), tone: 'good' },
        { k: Tr('fold heights T(x*)', '折り目の高さ T(x*)'), v: ca.length ? ca.map((x) => fmt(Tf(x), 3)).join(', ') : Tr('none (a ≤ 1)', 'なし（a ≤ 1）') },
      ], a > 1
        ? Tr('For a > 1 the map is no longer monotone. A window near a fold height pulls back to pieces on both sides of the turning point, and the density ρ/|T′| blows up like 1/√|y − y*| there, yet every bar stays finite: the push-forward measure is perfectly well defined even where its density is not.', 'a > 1 では写像は単調ではなくなります。折り目の高さ付近の窓を引き戻すと、折り返し点の両側に区間ができ、そこで密度 ρ/|T′| は 1/√|y − y*| のように発散します。それでも棒の高さはすべて有限です。押し出し測度は、密度が定義できない場所でもきちんと定義されています。')
          : Tr('For a ≤ 1, T is increasing, so T⁻¹(B) is a single interval and the density is ρ(x)/T′(x) at the one preimage. Push a past 1 to make the graph fold back.', 'a ≤ 1 では T は増加関数なので、T⁻¹(B) はただ一つの区間で、密度はただ一つの逆像での ρ(x)/T′(x) です。a を 1 より大きくするとグラフが折り返します。'));
      void last;
    },
  };

  /* ---------- 3. integrating along the fibres ---------- */
  const RANGES = [[[-3.2, 3.2], [-1.3, 1.3]], [[-4.6, 4.6], [-2.2, 2.2]], [[0, 4], [0, 1.55]], [[-2.6, 2.6], [-1.1, 1.1]]];
  const DEFAULT_C = [[0.8, 0.45], [1.1, 0.6], [1.3, 0.8], [0.6, 0.25]];
  D['coarea-fibres'] = {
    render(ctx, v) {
      const st = ctx.state, map = v.map, kind = v.dist, r = kind === 0 ? v.r : 0, p = density2(kind, r), M = MAPS[map], [lo, hi] = RANGES[map][kind];
      const key = `${map}|${kind}|${r}`, bins = 48;
      if (st.key !== key) {
        const hist = histogram(map, p, kind, lo, hi, bins);
        const curve = L.seq(321, (i) => { const c = lo + (hi - lo) * (i + 0.5) / 321; return [c, coarea(map, p, c, kind)]; });
        let tot = 0, mean = 0; curve.forEach(([c, q]) => { tot += q; mean += c * q; }); const dc = (hi - lo) / 321;
        if (map === 3) { const n = 240, a0 = Math.log(1e-7), a1 = Math.log(hi), hs = (a1 - a0) / n; let t2 = 0; for (let i = 0; i < n; i++) { const e = Math.exp(a0 + (i + 0.5) * hs); t2 += (coarea(map, p, e, kind) + coarea(map, p, -e, kind)) * e * hs; } tot = t2 / dc; }
        const Lh = kind === 1 ? 1 : 5, n = 300, h = 2 * Lh / n; let EF = 0; for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = -Lh + (i + 0.5) * h, y = -Lh + (k + 0.5) * h; EF += M.F(x, y) * p(x, y) * h * h; }
        Object.assign(st, { key, hist, curve, tot: tot * dc, mean: mean * dc, EF });
        if (st.cmap !== `${map}|${kind}`) { st.c = DEFAULT_C[map][kind]; st.cmap = `${map}|${kind}`; }
      }
      const c = clamp(st.c, lo, hi), qc = coarea(map, p, c, kind), dband = (hi - lo) / 36;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, Tr('The density p on the plane, the fibres F = const, and the thin shell c ≤ F ≤ c + δ. Where |∇F| is small the shell is wide and collects more mass.', '平面上の密度 p、ファイバー F = 一定、そして薄い殻 c ≤ F ≤ c + δ です。|∇F| が小さいところでは殻が広くなり、より多くの質量を集めます。'));
      const Wd = kind === 1 ? 1.5 : 3.2, f = L.fig(c1, { x: [-Wd, Wd], y: [-Wd, Wd], equal: true, xlabel: 'x', ylabel: 'y', maxH: 400 });
      const pm = kind === 1 ? 0.25 : 1 / (TAU * Math.sqrt(1 - r * r)), col = L.colours();
      f.raster((x, y) => { const base = L.cmaps.seq(0.8 * p(x, y) / pm), Fv = M.F(x, y); return Fv >= c && Fv <= c + dband ? mixc(base, col.hl, 0.85) : base; }, { res: 2 });
      // a family of fibres, drawn from their exact parametrisations
      const fib = (cv, o) => {
        if (map === 0) f.seg([cv, -Wd], [cv, Wd], o);
        else if (map === 1) f.seg([cv - Wd * 1.2, Wd * 1.2], [cv + Wd * 1.2, -Wd * 1.2], o);
        else if (map === 2) { if (cv > 0) f.line(L.seq(181, (i) => [cv * Math.cos(TAU * i / 180), cv * Math.sin(TAU * i / 180)]), o); }
        else if (Math.abs(cv) > 1e-9) [1, -1].forEach((sg) => f.line(L.sample(Math.log(Math.abs(cv) / Wd), Math.log(Wd), 160, (s) => [sg * Math.exp(s), sg * cv / Math.exp(s)]), o));
        else { f.seg([-Wd, 0], [Wd, 0], o); f.seg([0, -Wd], [0, Wd], o); }
      };
      const nf = 10; for (let i = 1; i < nf; i++) fib(lo + (hi - lo) * i / nf, { c: 'ink', w: 0.7, op: 0.35 });
      fib(c, { c: 'hl', w: 2.6 });
      const Fname = ['F = x', 'F = x + y', 'F = √(x² + y²)', 'F = xy'][map];
      f.text(Wd * 0.96, Wd * 0.9, Fname, { math: true, c: 'ink', anchor: 'end' });

      L.h('p', 'lab-cap', c2, Tr('The push-forward F#(p dA) on the line. Bars: mass of the plane cells with F in each bin. Curve: the coarea formula. Drag the level c.', '直線上の押し出し F#(p dA) です。棒：F が各区間に入る平面の小区画の質量。曲線：余面積公式。水準 c をドラッグできます。'));
      const qmax = Math.max(...st.hist.dens) * 1.25 || 1; // a log spike (F = xy at c = 0) is cut at the frame
      const g = L.fig(c2, { x: [lo, hi], y: [0, qmax], aspect: 0.8, xlabel: 'c', ylabel: 'q(c)', maxH: 360 });
      const bw = (hi - lo) / bins;
      st.hist.dens.forEach((d, i) => g.rect(lo + i * bw, 0, bw, Math.min(d, qmax), { c: 'muted', fill: 'muted', fo: 0.3, w: 0.5, op: 0.6, layer: 'under' }));
      g.line(st.curve.map(([cc, q]) => [cc, Math.min(q, qmax)]), { c: 'c1', w: 2.6 });
      g.vline(c, { c: 'hl', w: 1.2, op: 0.7, dash: '3 3', layer: 'under' });
      g.handle(c, Math.min(qc, qmax), { c: 'hl', axis: 'x', label: Tr('Level c of the fibre', 'ファイバーの水準 c'), bounds: [lo, hi, 0, qmax], onDrag: (x) => { st.c = Math.round(x * 100) / 100; ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: Tr('density p', '密度 p') }, { c: 'hl', label: Tr('fibre F = c and its shell', 'ファイバー F = c とその殻') }, { c: 'muted', kind: 'fill', label: Tr('mass per bin, counted on the plane', '平面で数えた区間ごとの質量') }, { c: 'c1', label: Tr('q(c) = ∫ p / |∇F| over F = c', 'F = c 上の ∫ p / |∇F|') }]);
      const b = Math.floor((c - lo) / bw), hb = b >= 0 && b < bins ? st.hist.dens[b] : 0;
      const grad = ['1', '√2', '1', '√(x² + y²)'][map];
      ctx.readout([
        { k: 'q(c)', v: fmt(qc, 4), tone: 'key' },
        { k: Tr('bar at c (plane count)', 'c での棒（平面で数えた値）'), v: fmt(hb, 4), tone: 'good' },
        { k: '|∇F|', v: grad },
        { k: '∫ q(c) dc', v: fmt(st.tot, 4) },
        { k: Tr('∫ c q(c) dc and ∫ F p dA', '∫ c q(c) dc と ∫ F p dA'), v: `${fmt(st.mean, 3)}, ${fmt(st.EF, 3)}` },
      ], [
        Tr('Projection: the fibres are vertical lines with |∇F| = 1, so q is the marginal density ∫ p(c, y) dy.', '射影：ファイバーは |∇F| = 1 の鉛直線なので、q は周辺密度 ∫ p(c, y) dy です。'),
        Tr('Sum: along x + y = c, |∇F| = √2 exactly cancels the √2 in arc length, leaving the convolution ∫ p(t, c − t) dt. For two uniforms that is a triangle.', '和：x + y = c に沿って |∇F| = √2 が弧長の √2 をちょうど打ち消し、畳み込み ∫ p(t, c − t) dt が残ります。一様分布二つなら三角形になります。'),
        Tr('Radius: the fibre is a circle of length 2πc, so even a density peaked at the origin pushes forward to one that vanishes there, c·exp(−c²/2) for the standard Gaussian.', '半径：ファイバーは長さ 2πc の円なので、原点で最大の密度でも、押し出すと原点で 0 になります。標準ガウス分布では c·exp(−c²/2) です。'),
        Tr('Product: near c = 0 the hyperbolas xy = c hug the axes, where |∇F| is tiny, so the shells are wide and q has a logarithmic spike: K₀(|c|)/π for independent Gaussians.', '積：c = 0 の近くでは双曲線 xy = c が座標軸に沿い、そこでは |∇F| がとても小さいので殻が広くなり、q は対数的に尖ります。独立なガウス分布では K₀(|c|)/π です。'),
      ][map]);
    },
  };
})();
