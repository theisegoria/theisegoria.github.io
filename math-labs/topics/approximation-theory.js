'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, LN2 = Math.LN2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // a number as TeX with three significant figures, in scientific notation when small or large
  const sci = (x) => { if (!Number.isFinite(x)) return tx`\infty`; if (x === 0) return '0'; const a = Math.abs(x); if (a >= 1e-3 && a < 1e4) return String(Number(x.toPrecision(3))); const [m, e] = x.toExponential(2).split('e'); return tx`${m}\times10^{${Number(e)}}`; };

  /* ---------------- models (no DOM) ----------------
   * Chebyshev polynomials T_k(x) = cos(k arccos x) on [-1, 1]; Clenshaw evaluation of sum c_k T_k.
   * Remez exchange algorithm for the best uniform approximation of degree n: solve sum c_k T_k(x_i) + (-1)^i E = f(x_i)
   * on a reference of n + 2 points, move the reference to the extrema of the error, repeat (Chebyshev's equioscillation
   * theorem: p is best if and only if f - p attains +-||f - p|| with alternating signs at n + 2 points).
   * Bernstein polynomials B_n f(x) = sum f(k/n) C(n, k) x^k (1 - x)^(n - k) = E f(S_n/n), S_n binomial(n, x).
   * Polynomial interpolation in n + 1 nodes by the barycentric formula; logarithmic potentials of the limiting node
   * densities: uniform u(z) = (1/2) Re[(z + 1) log(z + 1) - (z - 1) log(z - 1)] - 1, Chebyshev u(z) = log|z + sqrt(z^2 - 1)| - log 2.
   * Interpolants of a function analytic inside the level curve through z converge on the part of [-1, 1] where u(x) < u(z).
   */
  const chebT = (k, x) => Math.cos(k * Math.acos(clamp(x, -1, 1)));
  function evalCheb(c, x) { let b1 = 0, b2 = 0; for (let k = c.length - 1; k >= 1; k--) { const b = 2 * x * b1 - b2 + c[k]; b2 = b1; b1 = b; } return x * b1 - b2 + c[0]; }
  function solve(A, b) {
    const n = b.length; A = A.map((r) => r.slice()); b = b.slice();
    for (let i = 0; i < n; i++) {
      let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < n; r++) { const m = A[r][i] / A[i][i]; if (m === 0) continue; for (let k = i; k < n; k++) A[r][k] -= m * A[i][k]; b[r] -= m * b[i]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i]; }
    return x;
  }
  const GRID = 4000, XG = Array.from({ length: GRID + 1 }, (_, j) => -Math.cos((PI * j) / GRID));
  // one extremum of largest |e| per run of constant sign
  function signedExtrema(e) {
    const out = []; let cur = null;
    for (let j = 0; j < e.length; j++) {
      const s = e[j] > 0 ? 1 : e[j] < 0 ? -1 : 0; if (s === 0) continue;
      if (!cur || cur.s !== s) { cur = { s, j, v: e[j] }; out.push(cur); } else if (Math.abs(e[j]) > Math.abs(cur.v)) { cur.j = j; cur.v = e[j]; }
    }
    return out;
  }
  function remez(f, n) {
    const fg = XG.map(f), m = n + 2;
    // Chebyshev extrema on the grid, nudged off symmetry so that even and odd functions do not give a degenerate first step
    let ref = Array.from({ length: m }, (_, i) => { const t = i / (m - 1); return Math.round(GRID * (t + 0.06 * t * (1 - t))); });
    let c = new Array(n + 1).fill(0), E = 0, sup = Infinity, it = 0, alt = ref;
    for (; it < 60; it++) {
      const A = ref.map((j, i) => [...Array.from({ length: n + 1 }, (_, k) => chebT(k, XG[j])), i % 2 ? -1 : 1]);
      const s = solve(A, ref.map((j) => fg[j])); c = s.slice(0, n + 1); E = Math.abs(s[n + 1]);
      const e = XG.map((x, j) => fg[j] - evalCheb(c, x));
      sup = 0; for (const q of e) sup = Math.max(sup, Math.abs(q));
      let ex = signedExtrema(e);
      if (ex.length < m) break;                                   // f is (numerically) a polynomial of degree <= n
      while (ex.length > m) { if (Math.abs(ex[0].v) < Math.abs(ex[ex.length - 1].v)) ex.shift(); else ex.pop(); }
      alt = ex.map((q) => q.j);
      if (sup <= E * (1 + 1e-10) + 1e-15) break;
      if (alt.every((j, i) => j === ref[i])) break;
      ref = alt;
    }
    return { c, E: Math.max(E, 0), sup, ref: alt.map((j) => XG[j]), it };
  }
  // interpolant of degree n at the n + 1 Chebyshev points (roots of T_{n+1}), as Chebyshev coefficients
  function chebInterp(f, n) {
    const N = n + 1, xs = Array.from({ length: N }, (_, j) => Math.cos((PI * (j + 0.5)) / N)), fs = xs.map(f);
    return Array.from({ length: N }, (_, k) => { let s = 0; for (let j = 0; j < N; j++) s += fs[j] * Math.cos((k * PI * (j + 0.5)) / N); return ((k ? 2 : 1) * s) / N; });
  }
  const supOn = (g, lo = -1, hi = 1, n = 2000) => { let m = 0; for (let i = 0; i <= n; i++) m = Math.max(m, Math.abs(g(lo + ((hi - lo) * i) / n))); return m; };

  // Bernstein
  const LF = [0]; for (let i = 1; i <= 400; i++) LF.push(LF[i - 1] + Math.log(i));
  function binomPmf(n, x) {
    const w = new Array(n + 1).fill(0);
    if (x <= 0) { w[0] = 1; return w; } if (x >= 1) { w[n] = 1; return w; }
    const lx = Math.log(x), l1 = Math.log(1 - x);
    for (let k = 0; k <= n; k++) w[k] = Math.exp(LF[n] - LF[k] - LF[n - k] + k * lx + (n - k) * l1);
    return w;
  }
  function bernstein(f, n, x) { const w = binomPmf(n, x); let s = 0; for (let k = 0; k <= n; k++) s += w[k] * f(k / n); return s; }

  // barycentric interpolation
  function nodes(kind, n) {      // kind 0: equispaced, 1: Chebyshev (extrema of T_n)
    const x = [], w = [];
    for (let j = 0; j <= n; j++) {
      if (kind === 0) { x.push(-1 + (2 * j) / n); w.push((j % 2 ? -1 : 1) * Math.exp(LF[n] - LF[j] - LF[n - j] - LF[n] / 2)); }   // scaled binomials (common factors cancel)
      else { x.push(-Math.cos((PI * j) / n)); w.push((j % 2 ? -1 : 1) * (j === 0 || j === n ? 0.5 : 1)); }
    }
    return { x, w };
  }
  function bary(nd, fv, t) {
    let num = 0, den = 0;
    for (let j = 0; j < nd.x.length; j++) { const d = t - nd.x[j]; if (d === 0) return fv[j]; const q = nd.w[j] / d; num += q * fv[j]; den += q; }
    return num / den;
  }
  const poleFn = (a, b) => (x) => (b * b) / ((x - a) ** 2 + b * b);
  function interpError(kind, n, f, m = 400) {
    const nd = nodes(kind, n), fv = nd.x.map(f); let e = 0;
    for (let i = 0; i <= m; i++) { const t = -1 + (2 * i) / m; e = Math.max(e, Math.abs(bary(nd, fv, t) - f(t))); }
    return e;
  }
  // potentials
  const reWLogW = (wr, wi) => { const r = Math.hypot(wr, wi); return r === 0 ? 0 : wr * Math.log(r) - wi * Math.atan2(wi, wr); };
  const potUniform = (x, y) => 0.5 * (reWLogW(x + 1, y) - reWLogW(x - 1, y)) - 1;
  function rhoOf(x, y) {          // |z + sqrt(z^2 - 1)| on the branch with modulus >= 1
    const ar = x * x - y * y - 1, ai = 2 * x * y, m = Math.hypot(ar, ai);
    let sr = Math.sqrt((m + ar) / 2), si = Math.sqrt(Math.max(0, (m - ar) / 2)); if (ai < 0) si = -si;
    const r1 = Math.hypot(x + sr, y + si), r2 = Math.hypot(x - sr, y - si);
    return Math.max(r1, r2);
  }
  const potCheb = (x, y) => Math.log(rhoOf(x, y)) - LN2;
  const pot = (kind, x, y) => (kind === 0 ? potUniform(x, y) : potCheb(x, y));
  const potMax = (kind) => (kind === 0 ? LN2 - 1 : -LN2);          // the largest value of u on [-1, 1]

  const FN = [
    { f: (x) => Math.abs(x), tex: tx`|x|` },
    { f: (x) => Math.exp(x), tex: tx`e^x` },
    { f: (x) => 1 / (1 + 25 * x * x), tex: tx`\dfrac{1}{1+25x^2}` },
    { f: (x) => Math.sin(4 * x), tex: tx`\sin 4x` },
  ];
  const BF = [
    { f: (x) => Math.abs(x - 0.5), tex: tx`|x-\tfrac12|` },
    { f: (x) => Math.sin(2 * PI * x), tex: tx`\sin 2\pi x` },
    { f: (x) => Math.exp(-60 * (x - 0.3) ** 2), tex: tx`e^{-60(x-0.3)^2}` },
  ];
  const M = { chebT, evalCheb, solve, remez, chebInterp, supOn, binomPmf, bernstein, nodes, bary, poleFn, interpError, potUniform, potCheb, pot, potMax, rhoOf, FN, BF };
  (window.LabModels = window.LabModels || {})['approximation-theory'] = M;

  /* ================= 1. best uniform approximation: equioscillation ================= */
  const remezCache = {};
  D['remez-equioscillation'] = {
    render(ctx, v) {
      const F = FN[v.fn], n = v.n, key = v.fn + ':' + n, R = (remezCache[key] ||= remez(F.f, n)), ci = (remezCache['c' + key] ||= chebInterp(F.f, n));
      const k = Math.min(v.k, n), d = v.d, E = R.E || 1e-300;
      const p = (x) => evalCheb(R.c, x) + d * E * chebT(k, x), pc = (x) => evalCheb(ci, x);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The function \(f(x)=${F.tex}\) on \([-1,1]\) and polynomials of degree \(${n}\): the best uniform approximation \(p^{*}\) found by the Remez exchange algorithm, and the interpolant at the Chebyshev points.`, tx`\([-1,1]\) 上の関数 \(f(x)=${F.tex}\) と \(${n}\) 次の多項式です。レメズの交換アルゴリズムで求めた最良一様近似 \(p^{*}\) と、チェビシェフ点での補間多項式を描いています。`));
      const ys = L.sample(-1, 1, 300, F.f).map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), pad = 0.18 * (y1 - y0);
      const f = L.fig(c1, { x: [-1, 1], y: [y0 - pad, y1 + pad], aspect: 0.78, maxH: 360, xlabel: tx`\(x\)` });
      f.line(L.sample(-1, 1, 400, F.f), { c: 'ink', w: 2.6 });
      f.line(L.sample(-1, 1, 400, pc), { c: 'c3', w: 1.6, dash: '5 4' });
      f.line(L.sample(-1, 1, 400, p), { c: 'c1', w: 2.2 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The error \(f-p\) in units of \(E_n=\lVert f-p^{*}\rVert_\infty\). For \(p^{*}\) it touches \(\pm E_n\) with alternating signs at \(n+2=${n + 2}\) points (gold). Drag the gold handle at \(x=1\): it adds a multiple of \(T_{${k}}\) to \(p^{*}\), and the largest error can only grow.`, tx`\(E_n=\lVert f-p^{*}\rVert_\infty\) を単位とした誤差 \(f-p\) です。\(p^{*}\) の誤差は \(n+2=${n + 2}\) 個の点（金色）で符号を交互に変えながら \(\pm E_n\) に触れます。\(x=1\) の金色のハンドルをドラッグすると \(p^{*}\) に \(T_{${k}}\) の定数倍が加わり、最大誤差は大きくなるばかりです。`));
      const g = L.fig(c2, { x: [-1, 1], y: [-2.4, 2.4], aspect: 0.78, maxH: 360, xlabel: tx`\(x\)`, ticksY: [[-2, '−2E'], [-1, '−E'], [0, '0'], [1, 'E'], [2, '2E']] });
      g.hline(1, { c: 'c2', dash: '5 4' }); g.hline(-1, { c: 'c2', dash: '5 4' });
      const err = (x) => (F.f(x) - p(x)) / E, errC = (x) => clamp((F.f(x) - pc(x)) / E, -2.6, 2.6);
      g.line(L.sample(-1, 1, 600, errC), { c: 'c3', w: 1.4, dash: '5 4' });
      g.line(L.sample(-1, 1, 800, (x) => clamp(err(x), -2.6, 2.6)), { c: 'c1', w: 2.3 });
      if (Math.abs(d) < 1e-9) for (const x of R.ref) g.dot(x, err(x), { c: 'hl', r: 4.5 });
      const e1 = (F.f(1) - evalCheb(R.c, 1)) / E;
      g.handle(1, clamp(e1 - d, -2.3, 2.3), { c: 'hl', axis: 'y', bounds: [-1, 1, -2.4, 2.4], label: T('perturbation', '摂動'), onDrag: (x, y) => ctx.set('d', clamp(Math.round((e1 - y) * 50) / 50, -1, 1)) });
      L.legend(ctx.host, [{ c: 'ink', label: tx`\(f\)` }, { c: 'c1', label: T(tx`\(p=p^{*}+dE_nT_{${k}}\) and its error`, tx`\(p=p^{*}+dE_nT_{${k}}\) とその誤差`) }, { c: 'c3', dash: true, label: T('Chebyshev interpolant and its error', 'チェビシェフ補間とその誤差') }, { c: 'c2', dash: true, label: tx`\(\pm E_n\)` }]);
      const supP = supOn((x) => F.f(x) - p(x)), supC = supOn((x) => F.f(x) - pc(x));
      ctx.readout([
        { k: T(tx`best error \(E_n(f)\)`, tx`最良の誤差 \(E_n(f)\)`), v: tx`\(${sci(R.E)}\)`, tone: 'key' },
        { k: T(tx`\(\lVert f-p\rVert_\infty\) for the polynomial drawn`, tx`描いている多項式の \(\lVert f-p\rVert_\infty\)`), v: tx`\(${fmt(supP / E, 4)}\,E_n\)`, tone: Math.abs(d) < 1e-9 ? 'good' : 'warn' },
        { k: T(tx`Chebyshev interpolant: error, ratio to \(E_n\)`, tx`チェビシェフ補間：誤差、\(E_n\) との比`), v: tx`\(${sci(supC)},\ ${fmt(supC / E, 3)}\)` },
        { k: T('Remez iterations', 'レメズ法の反復回数'), v: String(R.it + 1) },
      ], T('Equioscillation is the certificate of optimality: any polynomial with a smaller maximum error would differ from the best one by a polynomial with too many sign changes for its degree. The Chebyshev interpolant is never far behind.', '等振動は最適性の証明書です。最大誤差がより小さい多項式があったとすると、最良の多項式との差が、次数に対して多すぎる符号変化をもつことになります。チェビシェフ補間はいつも最良近似にそれほど劣りません。'));
    },
  };

  /* ================= 2. Bernstein polynomials: Weierstrass by coin tossing ================= */
  const NS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 200], supCache = {};
  const bernSup = (i, n) => (supCache[i + ':' + n] ||= (() => { let m = 0; for (let j = 0; j <= 200; j++) { const x = j / 200; m = Math.max(m, Math.abs(bernstein(BF[i].f, n, x) - BF[i].f(x))); } return m; })());
  D['bernstein-weierstrass'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const F = BF[v.fn], x0 = v.x, host = ctx.host;
      const row = L.h('div', 'lab-row', host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const cap1 = L.h('p', 'lab-cap', c1), g1 = L.h('div', '', c1), cap2 = L.h('p', 'lab-cap', c2), g2 = L.h('div', '', c2);
      L.setText(cap2, T(tx`Largest error \(\lVert f-B_nf\rVert_\infty\) against \(n\), on logarithmic axes. Bernstein polynomials always converge, but slowly: like \(1/n\) where \(f\) is smooth, like \(1/\sqrt n\) at a corner.`, tx`最大誤差 \(\lVert f-B_nf\rVert_\infty\) を \(n\) に対して両対数で描いています。ベルンシュタイン多項式は必ず収束しますが、ゆっくりです。\(f\) が滑らかなところでは \(1/n\)、角では \(1/\sqrt n\) の速さです。`));
      const ys = L.sample(0, 1, 200, F.f).map((q) => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), span = y1 - y0, base = y0 - 0.62 * span;
      const draw = (n) => {
        g1.replaceChildren(); g2.replaceChildren();
        L.setText(cap1, T(tx`\(f(x)=${F.tex}\) and its Bernstein polynomial \(B_{${n}}f\). The orange bars are the binomial probabilities of \(k\) heads in \(${n}\) tosses of a coin with bias \(x\), placed at \(k/n\): \(B_nf(x)\) is the average of \(f(k/n)\) with these weights. Drag the gold point.`, tx`\(f(x)=${F.tex}\) とそのベルンシュタイン多項式 \(B_{${n}}f\) です。オレンジの棒は、表の出る確率が \(x\) のコインを \(${n}\) 回投げて表が \(k\) 回出る二項確率で、\(k/n\) の位置に置いています。\(B_nf(x)\) はこの重みによる \(f(k/n)\) の平均です。金色の点をドラッグしてください。`));
        const f = L.fig(g1, { x: [0, 1], y: [base, y1 + 0.12 * span], aspect: 0.78, maxH: 360, xlabel: tx`\(x\)` });
        const w = binomPmf(n, x0), wm = Math.max(...w), bw = Math.min(0.012, 0.6 / n);
        for (let k = 0; k <= n; k++) { const hgt = (w[k] / wm) * 0.4 * span; if (hgt > 0.002 * span) f.rect(k / n - bw / 2, base, bw, hgt, { c: 'c2', fill: 'c2', fo: 0.85, nostroke: true }); }
        const sd = Math.sqrt((x0 * (1 - x0)) / n);
        f.seg([Math.max(0, x0 - sd), base + 0.47 * span], [Math.min(1, x0 + sd), base + 0.47 * span], { c: 'c2', w: 2 });
        if (x0 < 0.6) f.text(Math.min(1, x0 + sd), base + 0.47 * span, tx`\(\pm\sqrt{x(1-x)/n}\)`, { small: true, dx: 8, dy: 4, c: 'c2', anchor: 'start' }); else f.text(Math.max(0, x0 - sd), base + 0.47 * span, tx`\(\pm\sqrt{x(1-x)/n}\)`, { small: true, dx: -8, dy: 4, c: 'c2', anchor: 'end' });
        f.line(L.sample(0, 1, 300, F.f), { c: 'ink', w: 2.6 });
        f.line(L.sample(0, 1, 160, (x) => bernstein(F.f, n, x)), { c: 'c1', w: 2.3 });
        f.vline(x0, { c: 'muted', dash: '3 4' });
        f.handle(x0, bernstein(F.f, n, x0), { c: 'hl', axis: 'x', bounds: [0, 1, base, y1 + 1], label: tx`\(x\)`, onDrag: (x) => ctx.set('x', clamp(Math.round(x * 100) / 100, 0, 1)) });
        const g = L.fig(g2, { x: [0, Math.log10(200)], y: [-3.2, 0.2], aspect: 0.78, maxH: 360, xlabel: tx`\(n\)`, ticksX: [[0, '1'], [1, '10'], [2, '100'], [Math.log10(200), '200']], ticksY: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']] });
        const pts = NS.map((m) => [Math.log10(m), Math.log10(Math.max(1e-9, bernSup(v.fn, m)))]);
        const anchor = pts[pts.length - 1];
        g.line([[0, anchor[1] + anchor[0] * 0.5], anchor], { c: 'c3', dash: '5 4', w: 1.5 }); g.line([[0, Math.min(0.2, anchor[1] + anchor[0])], anchor], { c: 'c4', dash: '5 4', w: 1.5 });
        g.line(pts, { c: 'c1', w: 2.4 }); for (const q of pts) g.dot(q[0], q[1], { c: 'c1', r: 2.6 });
        g.dot(Math.log10(n), Math.log10(Math.max(1e-9, bernSup(v.fn, n))), { c: 'hl', r: 5.5 });
        const bx = bernstein(F.f, n, x0);
        ctx.readout([
          { k: tx`\(B_{${n}}f(x)\), \(f(x)\)`, v: tx`\(${fmt(bx, 4)},\ ${fmt(F.f(x0), 4)}\)` },
          { k: T(tx`spread of \(k/n\): \(\sqrt{x(1-x)/n}\)`, tx`\(k/n\) の広がり \(\sqrt{x(1-x)/n}\)`), v: fmt(sd, 3) },
          { k: tx`\(\lVert f-B_{${n}}f\rVert_\infty\)`, v: tx`\(${sci(bernSup(v.fn, n))}\)`, tone: 'key' },
          { k: T(tx`degree needed for error \(10^{-3}\) at this rate`, tx`この速さで誤差 \(10^{-3}\) に必要な次数`), v: tx`\(\approx ${sci(v.fn === 0 ? (bernSup(0, 200) * Math.sqrt(200) / 1e-3) ** 2 : (bernSup(v.fn, 200) * 200) / 1e-3)}\)` },
        ], T('By the law of large numbers the weights concentrate near x, so the average tends to f(x): that is Bernstein’s proof of the Weierstrass theorem. The price is speed: the best polynomial of the same degree is far closer.', '大数の法則によって重みは x の近くに集まり、平均は f(x) に近づきます。これがベルンシュタインによるワイエルシュトラスの定理の証明です。代償は速さで、同じ次数の最良の多項式ははるかに近くまで迫れます。').replace(/ x,/g, tx` \(x\),`).replace('f(x):', tx`\(f(x)\):`).replace(/ x の/g, tx` \(x\) の`).replace('f(x) に', tx`\(f(x)\) に`));
      };
      L.legend(host, [{ c: 'ink', label: tx`\(f\)` }, { c: 'c1', label: tx`\(B_nf\); \(\lVert f-B_nf\rVert_\infty\)` }, { c: 'c2', kind: 'fill', label: T(tx`binomial weights \(\binom nk x^k(1-x)^{n-k}\)`, tx`二項分布の重み \(\binom nk x^k(1-x)^{n-k}\)`) }, { c: 'c3', dash: true, label: tx`\(\propto n^{-1/2}\)` }, { c: 'c4', dash: true, label: tx`\(\propto n^{-1}\)` }]);
      let last = -1;
      ctx.state.anim = L.animator(host, (dt, t, lab) => {
        const n = Math.min(v.n, Math.max(1, Math.round(Math.exp(t * 1.1))));
        if (n !== last) { last = n; draw(n); }
        if (lab) L.setText(lab, tx`\(n=${n}\)`);
        return n < v.n;
      }, { autoplay: false, once: true, initialT: 99, playLabel: T('Play: raise the degree', '再生：次数を上げる') });
    },
  };

  /* ================= 3. Runge's phenomenon and the potential landscape (3D) ================= */
  const ZS = 1.25, XR = 1.7, YR = 1.25, YN = -0.62, UCAP = 0.42;
  const errCache = {};
  function errCurve(kind, a, b) {
    const key = kind + ':' + a.toFixed(2) + ':' + b.toFixed(2);
    return (errCache[key] ||= (() => { const f = poleFn(a, b), out = []; for (let n = 2; n <= 60; n += 2) out.push([n, Math.log10(Math.max(1e-17, interpError(kind, n, f, 300)))]); return out; })());
  }
  D['runge-potential'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
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
      const kind = v.nodes, n = v.n, a = v.a, b = v.b, f = poleFn(a, b), nd = nodes(kind, n), fv = nd.x.map(f);
      const uz = pot(kind, a, b), um = potMax(kind), conv = uz > um + 1e-9;
      L.setText(st.cap1, T(tx`The complex plane, with height the logarithmic potential \(u(z)\) of the interpolation nodes on \([-1,1]\) (dark bar). The function \(f(x)=\dfrac{b^2}{(x-a)^2+b^2}\) has poles at \(a\pm ib\) (gold). Interpolants converge on the whole interval only if the poles stand above the highest point of the bar; the orange region is where a pole spoils it. Drag the gold pole.`, tx`複素平面で、高さは \([-1,1]\)（濃い棒）上の補間点の対数ポテンシャル \(u(z)\) です。関数 \(f(x)=\dfrac{b^2}{(x-a)^2+b^2}\) は \(a\pm ib\) に極をもちます（金色）。補間多項式が区間全体で収束するのは、極が棒の最も高い点より上にあるときだけです。オレンジの領域に極があると収束が壊れます。金色の極をドラッグしてください。`));
      L.setText(st.cap2, T(tx`\(f\) and its interpolant of degree \(${n}\) at ${kind === 0 ? 'equally spaced' : 'Chebyshev'} nodes.`, tx`\(f\) と、${kind === 0 ? '等間隔' : 'チェビシェフ'}点での \(${n}\) 次の補間多項式です。`));
      L.setText(st.cap3, T(tx`Largest interpolation error on \([-1,1]\) against the degree, for both families of nodes. The dashed lines have the predicted slopes \(e^{\,n(\max u-u(z_0))}\).`, tx`\([-1,1]\) での最大補間誤差を、二種類の点について次数に対して描いています。破線は予測される傾き \(e^{\,n(\max u-u(z_0))}\) です。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const g = L.fig(st.g2, { x: [-1, 1], y: [-0.6, 1.6], aspect: 0.5, maxH: 230, xlabel: tx`\(x\)` });
      g.line(L.sample(-1, 1, 300, f), { c: 'ink', w: 2.4 });
      g.line(L.sample(-1, 1, 500, (t) => clamp(bary(nd, fv, t), -5, 5)), { c: kind === 0 ? 'c2' : 'c1', w: 2 });
      if (n <= 40) nd.x.forEach((x, j) => g.dot(x, fv[j], { c: kind === 0 ? 'c2' : 'c1', r: 2.4 }));
      const e0 = errCurve(0, a, b), e1 = errCurve(1, a, b);
      const h = L.fig(st.g3, { x: [2, 60], y: [-16, 8], aspect: 0.55, maxH: 250, xlabel: T(tx`degree \(n\)`, tx`次数 \(n\)`), ticksY: [[-16, '10⁻¹⁶'], [-12, '10⁻¹²'], [-8, '10⁻⁸'], [-4, '10⁻⁴'], [0, '1'], [4, '10⁴'], [8, '10⁸']] });
      const cl = (pts) => pts.map(([x, y]) => [x, clamp(y, -16, 8)]);
      for (const [kk, e, c] of [[0, e0, 'c2'], [1, e1, 'c1']]) {
        const slope = (potMax(kk) - pot(kk, a, b)) / Math.LN10, anc = e[kk === 0 ? 6 : 4];
        h.line(cl([[2, anc[1] + slope * (2 - anc[0])], [60, anc[1] + slope * (60 - anc[0])]]), { c, dash: '5 4', w: 1.3, op: 0.8 });
        h.line(cl(e), { c, w: 2.3 });
      }
      const cur = (kind === 0 ? e0 : e1)[Math.max(0, Math.round(n / 2) - 1)];
      h.dot(cur[0], clamp(cur[1], -16, 8), { c: 'hl', r: 5.5 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'ink', label: tx`\(f\)` }, { c: 'c2', label: T('equally spaced nodes', '等間隔の点') }, { c: 'c1', label: T('Chebyshev nodes', 'チェビシェフ点') }, { c: 'hl', kind: 'dot', label: T(tx`poles \(a\pm ib\); current degree`, tx`極 \(a\pm ib\)、現在の次数`) }]);
      ctx.readout([
        { k: T(tx`potential at the pole \(u(z_0)\), highest value on \([-1,1]\)`, tx`極でのポテンシャル \(u(z_0)\)、\([-1,1]\) での最大値`), v: tx`\(${fmt(uz, 4)},\ ${fmt(um, 4)}\)` },
        { k: T(tx`predicted error factor per degree \(e^{\max u-u(z_0)}\)`, tx`次数 1 あたりの誤差の倍率の予測 \(e^{\max u-u(z_0)}\)`), v: fmt(Math.exp(um - uz), 4), tone: conv ? 'good' : 'warn' },
        { k: T(tx`measured largest error at \(n=${n}\)`, tx`\(n=${n}\) での最大誤差の実測`), v: tx`\(${sci(interpError(kind, n, f, 400))}\)`, tone: 'key' },
        { k: T('verdict', '判定'), v: conv ? T('converges on the whole interval', '区間全体で収束') : T('diverges near the ends (Runge)', '端の近くで発散（ルンゲ現象）') },
      ], T('Equally spaced nodes sit lower in the middle of the interval than at its ends, so a pole close to the middle is below the ends and the interpolants blow up there. Chebyshev nodes make the potential level along the interval: every pole off the interval is above it, and the error falls like ρ⁻ⁿ on its Bernstein ellipse.', '等間隔の点では、ポテンシャルは区間の中央で端よりも低くなるので、中央の近くにある極は端より下になり、補間多項式は端で発散します。チェビシェフ点ではポテンシャルが区間に沿って水平になります。区間の外のどの極もそれより上にあり、誤差は極を通るベルンシュタイン楕円の ρ⁻ⁿ のように減ります。').replace(/ρ⁻ⁿ/g, tx`\(\rho^{-n}\)`));
      const U = (x, y) => ZS * clamp(pot(kind, x, y), -1.05, UCAP);
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.74, maxH: 520, camera: [1.75, -3.5, 3.6], target: [0, 0.25, -0.6], fov: 30,
        label: T('3D potential landscape over the complex plane. Drag to rotate; drag the gold pole.', '複素平面上のポテンシャルの地形（3D）。ドラッグで回転、金色の極をドラッグできます。'),
        init(S) {
          st.flat = false;
          st.surf = S.surface(() => [0, 0, 0], { u: [-XR, XR], v: [YN, YR], nu: 136, nv: 100, rough: 0.8, coat: 0.05, colour: () => S.cols.c1, wire: true, wireEvery: 8, wireEveryV: 10 });
          st.level = S.surface(() => [0, 0, 0], { u: [-XR, XR], v: [YN, YR], nu: 2, nv: 2, c: 'c2', opacity: 0.2, rough: 0.2 }); st.level.castShadow = false;
          st.bar = S.tube([[0, 0, 0], [0.01, 0, 0]], { r: 0.022, c: 'ink', n: 120, rough: 0.4 });
          st.pts = S.points([[0, 0, 0]], { c: 'ink', r: 0.034, max: 61 });
          st.conj = S.sphere([0, 0, 0], 0.07, { c: 'hl' });
          st.hdl = S.handle([0, 0, 0], { r: 0.075, c: 'hl', label: tx`\(z_0=a+ib\)`, plane: [[0, 0, 1], [0, 0, 0]], onDrag: (q) => {
            const na = clamp(Math.round(q.x * 50) / 50, -1.5, 1.5), nb = clamp(Math.round(q.y * 50) / 50, 0.06, 1.1);
            st.ctx.set('a', na, true); st.ctx.set('b', nb);
            return [na, nb, st.hz ?? 0];
          } });
          st.lab = S.label('', [XR, YN, 0], { small: true, align: 'end' });
        },
        update(S, vv) {
          const lev = ZS * um, tmp = new S.THREE.Color(), warm = S.colour('c2');
          st.surf.update((x, y) => [x, y, U(x, y)], (x, y, p) => {
            const u = p[2] / ZS;
            if (u < um - 1e-6) return tmp.copy(warm).lerp(S.cmap.seq(0.15), clamp((um - u) * 0.6, 0, 0.5)).clone();
            return S.cmap.seq(clamp(0.25 + (u - um) / 1.6, 0, 1));
          });
          st.level.update((x, y) => [x, y, lev + 0.004]);
          st.bar.update(L.seq(121, (i) => { const x = -1 + i / 60; return [x, 0, U(x, 0) + 0.02]; }));
          st.pts.update(nd.x.map((x) => [x, 0, U(x, 0) + 0.03]));
          st.hz = U(vv.a, vv.b) + 0.05;
          st.hdl.setPlane([0, 0, 1], [0, 0, st.hz]); st.hdl.at([vv.a, vv.b, st.hz]); st.conj.at([vv.a, -vv.b, st.hz]); st.conj.visible = vv.b < -YN - 0.04;
          st.lab.set([XR, YN, lev + 0.05], T(tx`level \(\max_{[-1,1]}u\)`, tx`水準 \(\max_{[-1,1]}u\)`));
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-XR, XR], y: [-YR, YR], equal: true, maxH: 420, xlabel: tx`\(\operatorname{Re}z\)`, ylabel: tx`\(\operatorname{Im}z\)` });
          f2.raster((x, y) => { const u = pot(kind, x, y); return u < um ? -clamp((um - u) * 1.4 + 0.25, 0, 1) : clamp((u - um) / 1.2, 0, 1); }, { cmap: 'div', res: 4 });
          f2.seg([-1, 0], [1, 0], { c: 'ink', w: 4 });
          f2.dot(a, -b, { c: 'hl', r: 5 });
          f2.handle(a, b, { c: 'hl', bounds: [-1.5, 1.5, 0.06, 1.1], label: T('pole', '極'), onDrag: (x, y) => { ctx.set('a', clamp(Math.round(x * 50) / 50, -1.5, 1.5), true); ctx.set('b', clamp(Math.round(y * 50) / 50, 0.06, 1.1)); } });
        },
      });
      st.ctx = ctx;
    },
  };
})();
