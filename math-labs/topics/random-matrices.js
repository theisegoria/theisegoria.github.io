'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Wigner matrices H = (A + A^T)/sqrt(2n): off-diagonal variance 1/n, diagonal 2/n, spectrum filling [-2, 2] with the
   * semicircle density sqrt(4 - x^2)/(2 pi). Eigenvalues: Householder reduction to tridiagonal form, then Sturm-sequence
   * bisection (robust and exact to round-off). The beta-Hermite ensembles come from the Dumitriu-Edelman tridiagonal
   * model, diagonal N(0, 2), off-diagonal chi_{beta(n-1)}, ..., chi_beta, all over sqrt(2), whose edge is sqrt(2 beta n).
   * Sample covariance S = X X^T / n of p x n data: Marchenko-Pastur on [(1 - sqrt g)^2, (1 + sqrt g)^2], g = p/n, and a
   * population spike 1 + theta escapes the bulk at (1 + theta)(1 + g/theta) once theta > sqrt g (Baik, Ben Arous, Peche).
   */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    const u = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    let spare = null;
    const gauss = () => { if (spare !== null) { const s = spare; spare = null; return s; } let x, y, s; do { x = 2 * u() - 1; y = 2 * u() - 1; s = x * x + y * y; } while (s >= 1 || s === 0); const m = Math.sqrt((-2 * Math.log(s)) / s); spare = y * m; return x * m; };
    const chi = (k) => { let s = 0; for (let i = 0; i < k; i++) { const g = gauss(); s += g * g; } return Math.sqrt(s); };
    return { u, gauss, chi };
  }
  // entries with mean 0 and variance 1 (kind 0 Gaussian, 1 coin flip, 2 Student t with 1.5 degrees of freedom: infinite variance)
  function entry(R, kind) {
    if (kind === 1) return R.u() < 0.5 ? -1 : 1;
    if (kind === 2) { const nu = 1.5, chi2 = gammaSample(R, nu / 2) * 2; return R.gauss() / Math.sqrt(chi2 / nu); }
    return R.gauss();
  }
  function gammaSample(R, k) { // Marsaglia-Tsang, with the k < 1 boost
    if (k < 1) return gammaSample(R, k + 1) * Math.pow(R.u() || 1e-300, 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) { let x, v; do { x = R.gauss(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const uu = R.u(); if (uu < 1 - 0.0331 * x ** 4 || Math.log(uu) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; }
  }
  function wigner(n, R, kind = 0) {
    const A = new Float64Array(n * n), s = 1 / Math.sqrt(n);
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const x = (i === j ? Math.SQRT2 : 1) * entry(R, kind) * s; A[i * n + j] = x; A[j * n + i] = x; }
    return A;
  }
  // Householder: symmetric n x n (row-major, overwritten) -> tridiagonal diag d, off-diagonal e (length n - 1)
  function tridiag(A, n) {
    const v = new Float64Array(n), p = new Float64Array(n);
    for (let k = 0; k < n - 2; k++) {
      let norm = 0; for (let i = k + 1; i < n; i++) norm += A[i * n + k] ** 2; norm = Math.sqrt(norm);
      if (norm < 1e-300) continue;
      const x0 = A[(k + 1) * n + k], alpha = x0 > 0 ? -norm : norm;
      for (let i = k + 1; i < n; i++) v[i] = A[i * n + k]; v[k + 1] -= alpha;
      let vn = 0; for (let i = k + 1; i < n; i++) vn += v[i] * v[i]; vn = Math.sqrt(vn);
      if (vn < 1e-300) continue;
      for (let i = k + 1; i < n; i++) v[i] /= vn;
      let K = 0;
      for (let i = k + 1; i < n; i++) { let s = 0; const r = i * n; for (let j = k + 1; j < n; j++) s += A[r + j] * v[j]; p[i] = s; K += v[i] * s; }
      for (let i = k + 1; i < n; i++) p[i] -= K * v[i];
      for (let i = k + 1; i < n; i++) { const r = i * n, vi = v[i], wi = p[i]; for (let j = k + 1; j < n; j++) A[r + j] -= 2 * (vi * p[j] + wi * v[j]); }
      A[(k + 1) * n + k] = alpha; A[k * n + k + 1] = alpha;
      for (let i = k + 2; i < n; i++) { A[i * n + k] = 0; A[k * n + i] = 0; }
    }
    const d = new Float64Array(n), e = new Float64Array(Math.max(0, n - 1));
    for (let i = 0; i < n; i++) d[i] = A[i * n + i];
    for (let i = 0; i < n - 1; i++) e[i] = A[(i + 1) * n + i];
    return { d, e };
  }
  // number of eigenvalues below x of the tridiagonal (d, e): Sturm count
  function sturm(d, e, x) {
    let c = 0, q = d[0] - x; if (q < 0) c++;
    for (let i = 1; i < d.length; i++) { q = d[i] - x - (e[i - 1] * e[i - 1]) / (q === 0 ? 1e-300 : q); if (q < 0) c++; }
    return c;
  }
  function tridiagEig(d, e) {
    const n = d.length; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < n - 1 ? Math.abs(e[i]) : 0); lo = Math.min(lo, d[i] - r); hi = Math.max(hi, d[i] + r); }
    const out = new Float64Array(n), tol = 1e-12 * Math.max(1, hi - lo);
    for (let k = 0; k < n; k++) { let a = lo, b = hi; while (b - a > tol) { const m = 0.5 * (a + b); if (sturm(d, e, m) > k) b = m; else a = m; } out[k] = 0.5 * (a + b); }
    return out;
  }
  const eigSym = (A, n) => { const B = Float64Array.from(A), t = tridiag(B, n); return tridiagEig(t.d, t.e); };
  // the beta-Hermite tridiagonal model, rescaled so the spectrum fills [-2, 2]
  function betaHermite(n, beta, R) {
    const s = 1 / Math.sqrt((beta * n) / 2), d = new Float64Array(n), e = new Float64Array(n - 1);
    for (let i = 0; i < n; i++) d[i] = R.gauss() * s;   // N(0, 2)/sqrt 2 = N(0, 1)
    for (let i = 0; i < n - 1; i++) e[i] = (R.chi(beta * (n - 1 - i)) / Math.SQRT2) * s;
    return tridiagEig(d, e);
  }
  const semicircle = (x) => (Math.abs(x) < 2 ? Math.sqrt(4 - x * x) / TAU : 0);
  const semiCDF = (x) => { const y = clamp(x, -2, 2); return 0.5 + (y * Math.sqrt(4 - y * y)) / (4 * PI) + Math.asin(y / 2) / PI; };
  const catalan = (k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * 2 * (2 * i + 1)) / (i + 2); return Math.round(c); };
  // unfolded nearest-neighbour spacings from the bulk |x| < cut, in units of the local mean spacing
  function spacings(ev, cut = 1.4) {
    const n = ev.length, out = [];
    for (let i = 0; i + 1 < n; i++) if (Math.abs(ev[i]) < cut && Math.abs(ev[i + 1]) < cut) out.push(n * (semiCDF(ev[i + 1]) - semiCDF(ev[i])));
    return out;
  }
  const surmise = (s, beta) => beta === 1 ? (PI / 2) * s * Math.exp((-PI * s * s) / 4) : beta === 2 ? (32 / (PI * PI)) * s * s * Math.exp((-4 * s * s) / PI) : Math.exp(-s);
  const surmiseCDF = (s, beta) => beta === 1 ? 1 - Math.exp((-PI * s * s) / 4) : beta === 2 ? quad((x) => surmise(x, 2), 0, s, 400) : 1 - Math.exp(-s);
  function quad(f, a, b, n = 200) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }
  function poissonLevels(n, R) { // independent levels with the semicircle density: sorted uniforms through its quantile
    const out = new Float64Array(n), u = Array.from({ length: n }, () => R.u()).sort((a, b) => a - b);
    for (let i = 0; i < n; i++) out[i] = semiQuantile(u[i]); return out; }
  function semiQuantile(q) { let a = -2, b = 2; for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b); if (semiCDF(m) < q) a = m; else b = m; } return 0.5 * (a + b); }
  // Marchenko-Pastur
  const mpEdges = (g) => [(1 - Math.sqrt(g)) ** 2, (1 + Math.sqrt(g)) ** 2];
  const mpDensity = (x, g) => { const [a, b] = mpEdges(g); return x > a && x < b ? Math.sqrt((b - x) * (x - a)) / (TAU * g * x) : 0; };
  const bbpOutlier = (th, g) => (th > Math.sqrt(g) ? (1 + th) * (1 + g / th) : mpEdges(g)[1]);
  const bbpOverlap = (th, g) => (th > Math.sqrt(g) ? (1 - g / (th * th)) / (1 + g / th) : 0);
  // one sample covariance with a single spike along e1; returns its eigenvalues and the squared overlap of the top eigenvector with e1
  function covSample(p, n, th, R) {
    const X = new Float64Array(p * n), a = Math.sqrt(1 + th);
    for (let i = 0; i < p; i++) for (let j = 0; j < n; j++) X[i * n + j] = R.gauss() * (i === 0 ? a : 1);
    const S = new Float64Array(p * p);
    for (let i = 0; i < p; i++) for (let k = i; k < p; k++) { let s = 0; const ri = i * n, rk = k * n; for (let j = 0; j < n; j++) s += X[ri + j] * X[rk + j]; s /= n; S[i * p + k] = s; S[k * p + i] = s; }
    const ev = eigSym(S, p), top = ev[p - 1];
    // inverse iteration for the top eigenvector
    const shift = top + 1e-7 * Math.max(1, top);
    let x = new Float64Array(p).fill(1 / Math.sqrt(p));
    for (let it = 0; it < 3; it++) { x = solveShift(S, p, shift, x); let nn = 0; for (let i = 0; i < p; i++) nn += x[i] * x[i]; nn = Math.sqrt(nn); for (let i = 0; i < p; i++) x[i] /= nn; }
    return { ev, top, overlap: x[0] * x[0] };
  }
  function solveShift(S, p, mu, b) { // (S - mu I) y = b by Gaussian elimination with partial pivoting
    const M = new Float64Array(p * p), y = Float64Array.from(b);
    for (let i = 0; i < p * p; i++) M[i] = S[i]; for (let i = 0; i < p; i++) M[i * p + i] -= mu;
    for (let k = 0; k < p; k++) {
      let piv = k, best = Math.abs(M[k * p + k]); for (let i = k + 1; i < p; i++) { const v = Math.abs(M[i * p + k]); if (v > best) { best = v; piv = i; } }
      if (piv !== k) { for (let j = 0; j < p; j++) { const t = M[k * p + j]; M[k * p + j] = M[piv * p + j]; M[piv * p + j] = t; } const t = y[k]; y[k] = y[piv]; y[piv] = t; }
      const dkk = M[k * p + k] || 1e-300;
      for (let i = k + 1; i < p; i++) { const f = M[i * p + k] / dkk; if (!f) continue; for (let j = k; j < p; j++) M[i * p + j] -= f * M[k * p + j]; y[i] -= f * y[k]; }
    }
    for (let i = p - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < p; j++) s -= M[i * p + j] * y[j]; y[i] = s / (M[i * p + i] || 1e-300); }
    return y;
  }
  const M = { rng, wigner, tridiag, sturm, tridiagEig, eigSym, betaHermite, semicircle, semiCDF, catalan, spacings, surmise, surmiseCDF, quad, poissonLevels, semiQuantile, mpEdges, mpDensity, bbpOutlier, bbpOverlap, covSample, solveShift, gammaSample };
  (window.LabModels = window.LabModels || {})['random-matrices'] = M;

  function histogram(vals, lo, hi, nb) {
    const c = new Float64Array(nb), w = (hi - lo) / nb; let inside = 0;
    for (const x of vals) { const k = Math.floor((x - lo) / w); if (k >= 0 && k < nb) { c[k]++; inside++; } }
    return { c, w, lo, total: vals.length, inside };
  }
  const drawHist = (f, h, norm, o = {}) => { for (let k = 0; k < h.c.length; k++) if (h.c[k]) f.rect(h.lo + k * h.w, 0, h.w, h.c[k] / norm, { fill: o.c ?? 'c1', fo: o.fo ?? 0.55, c: o.c ?? 'c1', w: 0.6, layer: 'under' }); };

  /* ================= 1. the semicircle ================= */
    D['rmt-semicircle'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = v.n, kind = v.kind, target = Math.max(4, Math.ceil(3000 / n));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The newest matrix itself, entry by entry: warm for positive, cool for negative. Nothing in this noise looks like a semicircle.', 'いま作った行列そのものを成分ごとに描いています。暖色が正、寒色が負です。この雑音のどこにも半円は見えません。'));
      const g = L.fig(c1, { x: [0, n], y: [0, n], equal: true, maxH: 340, axes: false, grid: false });
      L.h('p', 'lab-cap', c2, T(tx`Histogram of all eigenvalues collected so far, against Wigner’s semicircle \(\rho(x)=\sqrt{4-x^2}/2\pi\). Press Add matrices to add them one at a time.`, tx`これまでに集めたすべての固有値のヒストグラムと、ウィグナーの半円 \(\rho(x)=\sqrt{4-x^2}/2\pi\) です。「行列を追加」で一つずつ追加します。`));
      const X = 3.2, f = L.fig(c2, { x: [-X, X], y: [0, 0.42], aspect: 0.72, maxH: 340, xlabel: T(tx`eigenvalue \(x\)`, tx`固有値 \(x\)`), ylabel: T('density', '密度') });
      f.line(L.sample(-2, 2, 241, (x) => [x, semicircle(x)]), { c: 'c2', w: 2.6, layer: 'over' });
      f.vline(-2, { c: 'muted', dash: '3 4' }); f.vline(2, { c: 'muted', dash: '3 4' });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T(tx`eigenvalues of \(H=(A+A^{\mathsf T})/\sqrt{2n}\)`, tx`\(H=(A+A^{\mathsf T})/\sqrt{2n}\) の固有値`) }, { c: 'c2', label: T(tx`semicircle law \(\rho(x)\)`, tx`半円則 \(\rho(x)\)`) }]);
      const R = rng(1234 + 7 * n + 1000 * kind), all = []; let last = null, m2 = 0, m4 = 0, count = 0, outside = 0;
      const add = () => { const A = wigner(n, R, kind); last = A; const ev = eigSym(A, n); for (const x of ev) { all.push(x); m2 += x * x; m4 += x ** 4; if (Math.abs(x) > 2.05) outside++; } count++; };
      const paint = () => {
        const A = last, sc = 2.2 / Math.sqrt(n);
        g.clear('under');
        g.raster((x, y) => { const i = clamp(n - 1 - Math.floor(y), 0, n - 1), j = clamp(Math.floor(x), 0, n - 1); return clamp(A[i * n + j] / sc, -1, 1); }, { cmap: 'div', pixel: true, res: Math.max(1, 3 * (n / 200)) });
        f.clear('under');
        const h = histogram(all, -X, X, 64); drawHist(f, h, all.length * h.w);
        const N = all.length;
        ctx.readout([
          { k: T('matrices × size', '行列の数 × 大きさ'), v: tx`\(${count}\times${n}=${N}\)` },
          { k: T(tx`second moment \(\tfrac1n\operatorname{tr}H^2\) (semicircle: 1)`, tx`2 次モーメント \(\tfrac1n\operatorname{tr}H^2\)（半円：1）`), v: fmt(m2 / N, 3), tone: kind < 2 ? 'key' : undefined },
          { k: T(tx`fourth moment \(\tfrac1n\operatorname{tr}H^4\) (semicircle: \(C_2=2\))`, tx`4 次モーメント \(\tfrac1n\operatorname{tr}H^4\)（半円：\(C_2=2\)）`), v: fmt(m4 / N, 3) },
          { k: T(tx`eigenvalues outside \([-2,2]\)`, tx`\([-2,2]\) の外の固有値`), v: `${fmt((100 * outside) / N, 2)}%`, tone: outside / N > 0.02 ? 'warn' : 'good' },
        ], kind === 2 ? T('With infinite variance the semicircle never forms: a few huge entries throw eigenvalues far outside, and the bulk piles up near zero. Universality needs finite variance.', '分散が無限大だと半円はできません。ごく少数の巨大な成分が固有値を遠くへ飛ばし、残りはゼロ付近に積み上がります。普遍性には有限の分散が必要です。')
          : T(tx`The entries can be Gaussian or plain coin flips: once the variance is fixed at \(1/n\), the limit is the same semicircle. Its even moments are the Catalan numbers \(1, 2, 5, 14\), which count non-crossing pairings.`, tx`成分はガウスでも単なる硬貨投げでも構いません。分散を \(1/n\) にそろえれば、極限は同じ半円になります。その偶数次モーメントはカタラン数 \(1, 2, 5, 14\) で、交差しない対の作り方を数えています。`));
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const want = Math.min(target, 1 + Math.floor(t * 6));
        if (want <= count) return count < target;
        while (count < want) add();
        paint(); if (lab) lab.textContent = T(`${count} of ${target} matrices`, `行列 ${count} / ${target}`);
        return count < target;
      }, { initialT: 1e6, once: true, playLabel: T('Add matrices', '行列を追加') });
    },
  };

  /* ================= 2. level repulsion: the eigenvalue cone ================= */
  const BETA = [1, 2, 0];
  function spacingData(beta, seed) {
    const R = rng(seed), out = [], n = 160;
    for (let s = 0; s < 22; s++) { const ev = beta === 0 ? poissonLevels(n, R) : betaHermite(n, beta, R); out.push(...spacings(ev)); }
    return out;
  }
  const spCache = {};
  D['rmt-repulsion'] = {
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
      const beta = BETA[v.ens], a = v.a, b = v.b, r = Math.hypot(a, b), sNorm = (2 * r) / Math.sqrt(PI);
      L.setText(st.cap1, T(tx`Every real symmetric \(2\times2\) matrix with zero trace is \(\begin{pmatrix}a&b\\b&-a\end{pmatrix}\), with eigenvalues \(\pm\sqrt{a^2+b^2}\). Over the \((a,b)\) floor the two eigenvalues form a double cone that touches at one point. Drag the gold matrix: the gap between the sheets is the spacing. The dots are random matrices; few land near the tip because the circle of radius \(r\) has length \(2\pi r\).`, tx`トレースがゼロの実対称 \(2\times2\) 行列はすべて \(\begin{pmatrix}a&b\\b&-a\end{pmatrix}\) の形で、固有値は \(\pm\sqrt{a^2+b^2}\) です。\((a,b)\) の床の上で、二つの固有値は一点で接する二重円錐になります。金色の行列をドラッグしてください。二枚の面の隙間が固有値の間隔です。点はランダムな行列で、先端の近くにはほとんど落ちません。半径 \(r\) の円の長さが \(2\pi r\) だからです。`));
      L.setText(st.cap2, T('Unfolded nearest-neighbour spacings from large matrices, against the Wigner surmises and the Poisson law of uncorrelated levels. The gold line is the spacing of the matrix you hold.', '大きな行列から得た、単位をそろえた最近接間隔のヒストグラムと、ウィグナーの推測式、相関のない準位のポアソン則です。金色の線は、いま持っている行列の間隔です。'));
      const key = `${beta}`; const sp = spCache[key] ||= spacingData(beta, 99 + beta * 13);
      const draw2d = () => {
        st.g2.replaceChildren();
        const f = L.fig(st.g2, { x: [0, 3.5], y: [0, 1.15], aspect: 0.78, maxH: 360, xlabel: T(tx`spacing \(s\) (mean 1)`, tx`間隔 \(s\)（平均 1）`), ylabel: tx`\(P(s)\)` });
        const h = histogram(sp, 0, 3.5, 35); drawHist(f, h, sp.length * h.w, { c: 'c1', fo: 0.45 });
        f.line(L.sample(0, 3.5, 200, (s) => [s, surmise(s, 1)]), { c: 'c2', w: 2.4 });
        f.line(L.sample(0, 3.5, 200, (s) => [s, surmise(s, 2)]), { c: 'c4', w: 2.4 });
        f.line(L.sample(0, 3.5, 200, (s) => [s, surmise(s, 0)]), { c: 'c3', w: 2.2, dash: '6 4' });
        f.text(0.12, 1.0, T(tx`Poisson \(e^{-s}\)`, tx`ポアソン \(e^{-s}\)`), { small: true, c: 'c3', dy: -2 });
        if (sNorm < 3.5) { f.vline(sNorm, { c: 'hl', w: 2 }); f.text(sNorm, 1.1, tx`\(s=${fmt(sNorm, 3)}\)`, { small: true, c: 'hl', anchor: sNorm > 2.6 ? 'end' : 'start', dx: sNorm > 2.6 ? -5 : 5 }); }
      };
      draw2d();
      st.leg.replaceChildren(); L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: [T(tx`real symmetric (\(\beta=1\))`, tx`実対称（\(\beta=1\)）`), T(tx`complex Hermitian (\(\beta=2\))`, tx`複素エルミート（\(\beta=2\)）`), T('uncorrelated levels', '相関のない準位')][v.ens] }, { c: 'c2', label: T(tx`surmise \(\beta=1\): \(\tfrac{\pi}{2}s\,e^{-\pi s^2/4}\)`, tx`推測式 \(\beta=1\)：\(\tfrac{\pi}{2}s\,e^{-\pi s^2/4}\)`) }, { c: 'c4', label: T(tx`surmise \(\beta=2\): \(\tfrac{32}{\pi^2}s^2e^{-4s^2/\pi}\)`, tx`推測式 \(\beta=2\)：\(\tfrac{32}{\pi^2}s^2e^{-4s^2/\pi}\)`) }, { c: 'c3', dash: true, label: T(tx`Poisson \(e^{-s}\)`, tx`ポアソン \(e^{-s}\)`) }, { kind: 'dot', c: 'hl', label: T('your matrix', 'あなたの行列') }]);
      const p1 = surmiseCDF(sNorm, 1), p2 = surmiseCDF(sNorm, 2), p0 = surmiseCDF(sNorm, 0);
      ctx.readout([
        { k: T(tx`eigenvalues \(\lambda_\pm=\pm\sqrt{a^2+b^2}\)`, tx`固有値 \(\lambda_\pm=\pm\sqrt{a^2+b^2}\)`), v: tx`\(a=${fmt(a, 2)},\ b=${fmt(b, 2)},\ \lambda=\pm${fmt(r, 3)}\)` },
        { k: T(tx`spacing in mean units \(s=2r/\sqrt\pi\)`, tx`平均を単位とする間隔 \(s=2r/\sqrt\pi\)`), v: fmt(sNorm, 3), tone: 'key' },
        { k: T(tx`\(\Pr(S<s)\): \(\beta=1\), \(\beta=2\), Poisson`, tx`\(\Pr(S<s)\)：\(\beta=1\)、\(\beta=2\)、ポアソン`), v: `${fmt(100 * p1, 3)}%, ${fmt(100 * p2, 3)}%, ${fmt(100 * p0, 3)}%` },
      ], T(tx`A degeneracy needs both \(a=0\) and \(b=0\), two conditions at once, so it has probability zero and nearby matrices are rare in proportion to \(r\): that is linear repulsion, \(P(s)\propto s\). A complex Hermitian \(b\) adds a third condition, giving \(P(s)\propto s^2\).`, tx`縮退には \(a=0\) と \(b=0\) の二つの条件が同時に必要なので確率はゼロで、その近くの行列も \(r\) に比例してしか現れません。これが一次の反発 \(P(s)\propto s\) です。\(b\) が複素数のエルミート行列では条件が三つになり、\(P(s)\propto s^2\) となります。`));
      const Rc = 2.4;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 500, camera: [7.6, -8.6, 4.6], target: [0, 0, -0.35], fov: 32,
        label: T('3D double cone of the two eigenvalues over the (a, b) plane. Drag to rotate; drag the gold point to choose a matrix.', '(a, b) 平面上の二つの固有値がなす 3D の二重円錐。ドラッグで回転、金色の点で行列を選べます。'),
        init(S) {
          st.flat = false;
          const cone = (sg) => S.surface((rr, ph) => [rr * Math.cos(ph), rr * Math.sin(ph), sg * rr], { u: [0, Rc], v: [0, TAU], nu: 40, nv: 96, c: sg > 0 ? 'c1' : 'c2', opacity: 0.62, wire: true, wireEvery: 8, rough: 0.3 });
          cone(1); cone(-1);
          const R = rng(7), pts = [], cols = [];
          for (let i = 0; i < 520; i++) { const x = R.gauss() * Math.SQRT1_2, y = R.gauss() * Math.SQRT1_2; if (Math.hypot(x, y) > Rc) continue; pts.push([x, y, -Rc - 0.42]); cols.push(S.cmap.seq(Math.min(1, Math.hypot(x, y) / 1.6))); }
          S.points(pts, { colours: cols, r: 0.035 });
          
          st.gap = S.lines([], { c: 'hl', opacity: 1, w: 3 });
          st.up = S.sphere([0, 0, 0], 0.08, { c: 'hl' }); st.dn = S.sphere([0, 0, 0], 0.08, { c: 'hl' });
          st.drop = S.lines([], { c: 'hl', opacity: 0.5, w: 1.2 });
          st.hdl = S.handle([0, 0, -Rc], { c: 'hl', r: 0.11, plane: [[0, 0, 1], [0, 0, -Rc - 0.4]], label: T(tx`your matrix \((a,b)\)`, tx`あなたの行列 \((a,b)\)`), onDrag: (q) => { let x = q.x, y = q.y; const rr = Math.hypot(x, y); if (rr > 2) { x *= 2 / rr; y *= 2 / rr; } x = Math.round(x * 100) / 100; y = Math.round(y * 100) / 100; st.ctx.set('a', x, true); st.ctx.set('b', y); return [x, y, -Rc - 0.4]; } });
          S.label(tx`\(\lambda_+=+\sqrt{a^2+b^2}\)`, [-1.25, 1.25, 1.95], { small: true }); S.label(tx`\(\lambda_-=-\sqrt{a^2+b^2}\)`, [-1.25, 1.25, -1.6], { small: true });
          S.label(T('degenerate point', '縮退点'), [0.12, 0, 0.12], { small: true });
          const zf = -Rc - 0.42; S.label(tx`\(a\)`, [Rc + 0.3, 0, zf]); S.label(tx`\(b\)`, [0, Rc + 0.3, zf]);
          S.lines([[[-Rc, 0, zf], [Rc, 0, zf]], [[0, -Rc, zf], [0, Rc, zf]]], { c: 'muted', opacity: 0.6 });
        },
        update(S) {
          const aa = st.ctx ? v.a : a, bb = v.b, rr = Math.hypot(aa, bb);
          st.up.at([aa, bb, rr]); st.dn.at([aa, bb, -rr]);
          st.gap.update([[[aa, bb, -rr], [aa, bb, rr]]]);
          st.drop.update([[[aa, bb, -Rc - 0.4], [aa, bb, -rr]]]);
          st.hdl.at([aa, bb, -Rc - 0.4]); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, maxH: 420, xlabel: tx`\(a\)`, ylabel: tx`\(b\)` });
          f.raster((x, y) => Math.min(1, Math.hypot(x, y) / 2.2), { cmap: 'seq', res: 5 });
          for (let k = 1; k <= 4; k++) f.circle(0, 0, k * 0.5, { c: 'muted', w: 0.8, dash: '3 3' });
          f.handle(a, b, { c: 'hl', bounds: [-2, 2, -2, 2], label: T('your matrix', 'あなたの行列'), onDrag: (x, y) => { ctx.set('a', Math.round(x * 100) / 100, true); ctx.set('b', Math.round(y * 100) / 100); } });
          f.text(0, 0, T('degenerate', '縮退'), { small: true, dy: -8, anchor: 'middle' });
        },
      });
    },
  };

  /* ================= 3. Marchenko-Pastur and the spike ================= */
  const covCache = {};
  function covData(g, p, th) {
    const key = `${g}|${p}|${th}`; if (covCache[key]) return covCache[key];
    const n = Math.round(p / g), R = rng(4242 + p + Math.round(1000 * g)), reps = Math.max(2, Math.round(1200 / p));
    const ev = [], tops = [], ov = [];
    for (let k = 0; k < reps; k++) { const c = covSample(p, n, th, R); ev.push(...c.ev); tops.push(c.top); ov.push(c.overlap); }
    const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const out = { n, reps, ev, top: mean(tops), tops, overlap: mean(ov) };
    const keys = Object.keys(covCache); if (keys.length > 40) delete covCache[keys[0]];
    return (covCache[key] = out);
  }
  D['rmt-mp'] = {
    render(ctx, v) {
      const g = v.g, p = v.p, th = v.th, C = covData(g, p, th), [lo, hi] = mpEdges(g), out = bbpOutlier(th, g);
      const xmax = Math.max(hi, out, ...C.tops) * 1.12;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`Eigenvalues of the sample covariance of pure noise plus one real direction of variance \(1+\theta\). The noise spreads into the Marchenko–Pastur bulk; the gold marks are the top eigenvalue of each sample.`, tx`純粋な雑音に、分散 \(1+\theta\) の本物の方向を一つ加えたデータの標本共分散の固有値です。雑音はマルチェンコ・パストゥールの塊に広がります。金色の印は各標本の最大固有値です。`));
      let dmax = 0; for (let i = 1; i < 200; i++) dmax = Math.max(dmax, mpDensity(lo + ((hi - lo) * i) / 200, g));
      const ytop = Math.min(2.6, dmax * 1.25);
      const f = L.fig(c1, { x: [0, xmax], y: [0, ytop], aspect: 0.72, maxH: 340, xlabel: T(tx`eigenvalue \(\lambda\) of \(S=XX^{\mathsf T}/n\)`, tx`\(S=XX^{\mathsf T}/n\) の固有値 \(\lambda\)`), ylabel: T('density', '密度') });
      const h = histogram(C.ev, 0, xmax, 70); drawHist(f, h, C.ev.length * h.w);
      f.line(L.sample(lo, hi, 300, (x) => [x, Math.min(ytop * 1.4, mpDensity(x, g))]), { c: 'c2', w: 2.6, layer: 'over' });
      f.vline(hi, { c: 'muted', dash: '4 4' }); f.text(hi, ytop * 0.93, tx`\(\lambda_+\)`, { small: true, dx: 4, c: 'muted' });
      for (const t of C.tops) f.seg([t, 0], [t, ytop * 0.12], { c: 'hl', w: 1.6, layer: 'over' });
      if (th > Math.sqrt(g)) { f.vline(out, { c: 'c4', dash: '5 3', w: 1.6 }); f.text(out, ytop * 0.6, T('predicted outlier', '予言される外れ値'), { small: true, c: 'c4', anchor: out > xmax * 0.7 ? 'end' : 'start', dx: out > xmax * 0.7 ? -5 : 5 }); }
      L.h('p', 'lab-cap', c2, T(tx`Where the top eigenvalue sits as the signal grows. Below \(\theta=\sqrt\gamma\) the signal is invisible, swallowed by the edge; above it an outlier detaches. Drag the gold point.`, tx`信号を強くしたときの最大固有値の位置です。\(\theta=\sqrt\gamma\) より下では信号は端に飲み込まれて見えません。それより上では外れ値が離れていきます。金色の点をドラッグしてください。`));
      const thMax = 4, ymax2 = bbpOutlier(thMax, g) * 1.06;
      const q = L.fig(c2, { x: [0, thMax], y: [0, ymax2], aspect: 0.72, maxH: 340, xlabel: T(tx`spike strength \(\theta\)`, tx`スパイクの強さ \(\theta\)`), ylabel: T('top eigenvalue', '最大固有値') });
      q.line([[0, hi], [thMax, hi]], { c: 'muted', dash: '4 4' });
      q.line(L.sample(0, thMax, 240, (t) => [t, bbpOutlier(t, g)]), { c: 'c4', w: 2.6 });
      q.line(L.sample(0, thMax, 240, (t) => [t, 1 + t]), { c: 'c3', w: 1.6, dash: '6 4' });
      q.vline(Math.sqrt(g), { c: 'c2', dash: '3 3' }); q.text(Math.sqrt(g), ymax2 * 0.08, tx`\(\theta=\sqrt\gamma\)`, { small: true, c: 'c2', dx: 4 });
      q.text(thMax * 0.97, 1 + thMax * 0.97, T(tx`true variance \(1+\theta\)`, tx`真の分散 \(1+\theta\)`), { small: true, c: 'c3', anchor: 'end', dy: -8 });
      q.handle(th, C.top, { c: 'hl', axis: 'x', bounds: [0, thMax, 0, ymax2], label: T('measured top eigenvalue', '測った最大固有値'), onDrag: (x) => ctx.set('th', clamp(Math.round(x * 20) / 20, 0, thMax)) });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('sample eigenvalues', '標本の固有値') }, { c: 'c2', label: T('Marchenko–Pastur density', 'マルチェンコ・パストゥール密度') }, { c: 'c4', label: T(tx`BBP prediction \((1+\theta)(1+\gamma/\theta)\)`, tx`BBP の予言 \((1+\theta)(1+\gamma/\theta)\)`) }, { c: 'c3', dash: true, label: T(tx`true variance \(1+\theta\)`, tx`真の分散 \(1+\theta\)`) }, { kind: 'dot', c: 'hl', label: T('top eigenvalues', '最大固有値') }]);
      ctx.readout([
        { k: T(tx`\(\gamma=p/n\); bulk edges \(\lambda_\pm=(1\pm\sqrt\gamma)^2\)`, tx`\(\gamma=p/n\)、塊の端 \(\lambda_\pm=(1\pm\sqrt\gamma)^2\)`), v: tx`\(${fmt(g, 3)}\ (p=${p},\ n=${C.n});\ ${fmt(lo, 3)}\ldots${fmt(hi, 3)}\)` },
        { k: T('top eigenvalue: measured mean vs prediction', '最大固有値：測定の平均と予言'), v: `${fmt(C.top, 3)} vs ${fmt(out, 3)}`, tone: 'key' },
        { k: T(tx`overlap \(|\langle\hat v,e_1\rangle|^2\): measured vs \(\frac{1-\gamma/\theta^2}{1+\gamma/\theta}\)`, tx`重なり \(|\langle\hat v,e_1\rangle|^2\)：測定と \(\frac{1-\gamma/\theta^2}{1+\gamma/\theta}\)`), v: `${fmt(C.overlap, 3)} vs ${fmt(bbpOverlap(th, g), 3)}` },
      ], th > Math.sqrt(g) ? T(tx`The outlier is real but biased upward: it sits at \((1+\theta)(1+\gamma/\theta)\), above the true variance \(1+\theta\), and its eigenvector only partly points along the signal. At finite \(p\) the transition is smoothed.`, tx`外れ値は本物ですが上に偏っています。真の分散 \(1+\theta\) より大きい \((1+\theta)(1+\gamma/\theta)\) に現れ、その固有ベクトルは信号の向きを一部しか向きません。有限の \(p\) では転移はなめらかになります。`)
        : T('Below the threshold a genuine direction of extra variance produces no outlier at all: the top eigenvalue stays at the noise edge and its eigenvector is almost orthogonal to the signal. No method based on the sample covariance alone can see it.', 'しきい値より下では、分散の大きい本物の方向があっても外れ値はまったく現れません。最大固有値は雑音の端にとどまり、その固有ベクトルは信号とほぼ直交します。標本共分散だけに頼る方法では見つけられません。'));
    },
  };
})();
