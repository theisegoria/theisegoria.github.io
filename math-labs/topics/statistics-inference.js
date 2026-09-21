'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(L.TAU * r()); };
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(L.TAU);
  // inverse standard normal CDF (Acklam, relative error below 1.2e-9)
  function probit(p) {
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) return -probit(1 - p);
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  // Student t quantile via the regularized incomplete beta function
  const lgamma = (x) => { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let s = 1.000000000190015; for (const k of g) s += k / ++y; return -tmp + Math.log(2.5066282746310005 * s / x); };
  function betacf(a, b, x) { let c = 1, d = 1 - (a + b) * x / (a + 1); d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2)); d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; h *= d * c; aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1)); d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break; } return h; }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const tcdf = (t, nu) => { const x = nu / (nu + t * t), p = 0.5 * ibeta(x, nu / 2, 0.5); return t > 0 ? 1 - p : p; };
  const tquant = (p, nu) => { let lo = -50, hi = 50; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (tcdf(m, nu) < p) lo = m; else hi = m; } return (lo + hi) / 2; };

  /* ---------- 1. sampling means ---------- */
  const SHAPES = [
    { name: T('normal', '正規'), draw: (r) => gauss(r), pdf: (z) => phi(z) },
    { name: T('skewed (exponential)', '歪んだ分布（指数）'), draw: (r) => -Math.log(1 - r()) - 1, pdf: (z) => (z >= -1 ? Math.exp(-(z + 1)) : 0) },
    { name: T('uniform', '一様'), draw: (r) => Math.sqrt(3) * (2 * r() - 1), pdf: (z) => (Math.abs(z) <= Math.sqrt(3) ? 1 / (2 * Math.sqrt(3)) : 0) },
  ];
  D.mean = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = Math.round(v.n), s = v.sigma, sh = SHAPES[Math.round(v.shape ?? 0)] || SHAPES[0], se = s / Math.sqrt(n), M = 200;
      // standardized draws: sample j always uses the same stream, so n and σ only rescale or extend it
      const samples = L.seq(M, (j) => { const r = rng(40503 * (j + 1) + 17 * Math.round(v.shape ?? 0)); return L.seq(n, () => sh.draw(r) * s); });
      const means = samples.map((xs) => xs.reduce((a, b) => a + b, 0) / n);
      L.h('p', 'lab-cap', ctx.host, T(`Population (${sh.name}, mean 0, σ = ${fmt(s, 2)}) and one sample of n = ${n}`, `母集団（${sh.name}、平均0、σ = ${fmt(s, 2)}）と大きさ n = ${n} の標本1つ`));
      const pdf = (x) => sh.pdf(x / s) / s;
      const pmax = Math.max(...L.sample(-10, 10, 400, pdf).map((p) => p[1]));
      const f = L.fig(ctx.host, { x: [-10, 10], y: [-0.28 * pmax, pmax * 1.12], aspect: 0.32, minH: 170, maxH: 260, ticksY: [[0, '0']], xlabel: T('value', '値') });
      f.rect(-3, -0.28 * pmax, 6, 1.4 * pmax, { c: 'muted', fo: 0.06, nostroke: true, layer: 'under' });
      f.area(L.sample(-10, 10, 400, pdf), { c: 'c3', fo: 0.22 });
      f.line(L.sample(-10, 10, 400, pdf), { c: 'c3', w: 2.2 });
      f.vline(0, { c: 'ink', dash: '5 4', w: 1.2 });
      L.h('p', 'lab-cap', ctx.host, T(`Means of ${M} samples (axis zoomed to the shaded window −3 to 3)`, `${M} 個の標本平均（網掛けの −3 から 3 に拡大）`));
      const g = L.fig(ctx.host, { x: [-3, 3], y: [0, 1], aspect: 0.3, minH: 190, maxH: 280, xlabel: T('sample mean x̄', '標本平均 x̄'), ticksY: [[0, '0']] });
      const bw = Math.max(0.02, se / 2.5), peak = phi(0) / se;
      const G = { ymax: 1 };
      const nb = Math.ceil(6 / bw);
      const counts = new Array(nb).fill(0);
      // rescale the lower figure's y to fit the theoretical density
      const ymax = peak * 1.3;
      const Y = (y) => y / ymax; // plot in 0..1
      void G;
      let shown = -1;
      const draw = (k) => {
        counts.fill(0);
        for (let j = 0; j < k; j++) { const b = Math.floor((means[j] + 3) / bw); if (b >= 0 && b < nb) counts[b]++; }
        g.clear('main');
        counts.forEach((c, b) => { if (c) g.rect(-3 + b * bw, 0, bw, Y(c / (M * bw)), { c: 'c1', fo: 0.45, w: 0.8 }); });
        const cur = Math.max(0, k - 1), xs = samples[cur], mu = means[cur];
        f.clear('over');
        xs.forEach((x, i) => f.dot(x, -0.1 * pmax - (i % 3) * 0.05 * pmax, { c: 'c1', r: 2.6, op: 0.75 }));
        f.seg([mu, -0.26 * pmax], [mu, pmax * 1.05], { c: 'hl', w: 2.4, layer: 'over' });
        f.text(mu, pmax * 1.05, `x̄ = ${fmt(mu, 3)}`, { dy: 2, dx: 6, anchor: 'start', small: true });
        g.clear('over');
        g.line(L.sample(-3, 3, 300, (x) => Y(phi(x / se) / se)), { c: 'c2', w: 2.4, layer: 'over' });
        g.seg([-se, Y(peak) * 1.12], [se, Y(peak) * 1.12], { c: 'ink', w: 1.6, layer: 'over' });
        g.text(se, Y(peak) * 1.12, `±SE = ±${fmt(se, 3)}`, { anchor: 'start', dx: 6, dy: 4, small: true });
        if (k > 0) g.dot(mu, 0, { c: 'hl', r: 5.5 });
        shown = k;
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const k = Math.min(M, 1 + Math.floor(t * 24));
        if (k !== shown) draw(k);
        label.textContent = k < M ? T(`${k} samples`, `${k} 標本`) : '';
        return k < M;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Draw the samples again', '標本を引き直す') });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c3', label: T('population density', '母集団の密度') }, { kind: 'dot', c: 'c1', label: T('one sample', '1つの標本') }, { c: 'hl', label: T('its mean', 'その平均') }, { kind: 'fill', c: 'c1', label: T('histogram of sample means', '標本平均のヒストグラム') }, { c: 'c2', label: 'N(0, σ²/n)' }]);
      const mm = means.reduce((a, b) => a + b, 0) / M, sdm = Math.sqrt(means.reduce((a, b) => a + (b - mm) ** 2, 0) / (M - 1));
      ctx.readout([{ k: 'SE = σ/√n', v: fmt(se, 4), tone: 'key' }, { k: T(`SD of the ${M} means`, `${M} 個の平均の標準偏差`), v: fmt(sdm, 4) }, { k: T('average of the means', '平均の平均'), v: mm.toFixed(3).replace('-', '−') }],
        Math.round(v.shape ?? 0) === 1 && n < 15 ? T('With a skewed population and small n, the means are still visibly skewed.', '歪んだ母集団で n が小さいと、平均の分布にも歪みが残ります。') : T('Quadruple n to halve the spread of the means.', 'n を4倍にすると平均のばらつきは半分になります。'));
    },
  };

  /* ---------- 2. confidence intervals ---------- */
  D.interval = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = Math.round(v.n), level = v.level, mu = 10, sigma = 2, K = 50;
      const z = probit(1 - (1 - level) / 2), half = z * sigma / Math.sqrt(n);
      const means = L.seq(K, (j) => { const r = rng(7919 * (j + 3)); let s = 0; for (let i = 0; i < n; i++) s += gauss(r); return mu + sigma * s / n; });
      const hit = means.map((m) => Math.abs(m - mu) <= half);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Where z comes from: the central ${Math.round(level * 100)}% of N(0, 1)`, `z の由来：N(0, 1) の中央 ${Math.round(level * 100)}%`));
      const f = L.fig(c1, { x: [-3.6, 3.6], y: [0, 0.46], aspect: 0.75, maxH: 330, xlabel: 'z', ticksY: [[0, '0'], [0.2, '0.2'], [0.4, '0.4']] });
      f.area(L.sample(-z, z, 200, phi), { c: 'c1', fo: 0.3 });
      f.area(L.sample(-3.6, -z, 80, phi), { c: 'c2', fo: 0.3 });
      f.area(L.sample(z, 3.6, 80, phi), { c: 'c2', fo: 0.3 });
      f.line(L.sample(-3.6, 3.6, 300, phi), { c: 'ink', w: 2 });
      f.vline(z, { c: 'c1', dash: false, w: 1.6 }); f.vline(-z, { c: 'c1', dash: false, w: 1.6 });
      f.text(z, 0.36, `z = ${fmt(z, 3)}`, { anchor: 'start', dx: 5, small: true, c: 'c1' });
      f.text(0, 0.14, `${fmt(level * 100, 0)}%`, {});
      f.text(-3.3, 0.06, `${fmt((1 - level) * 50, 1)}%`, { small: true, c: 'c2', anchor: 'start' });
      L.h('p', 'lab-cap', c2, T(`${K} samples of size ${n} from a population with μ = 10, σ = 2`, `μ = 10、σ = 2 の母集団からの大きさ ${n} の標本 ${K} 個`));
      const g = L.fig(c2, { x: [mu - 4.2, mu + 4.2], y: [0, K + 1], aspect: 0.75, maxH: 330, xlabel: T('interval x̄ ± zσ/√n', '区間 x̄ ± zσ/√n'), ticksY: [[1, '1'], [25, '25'], [50, '50']] });
      g.vline(mu, { c: 'ink', dash: '6 4', w: 1.6, layer: 'under' });
      g.text(mu, K + 1, 'μ', { math: true, dx: 8, dy: 14, anchor: 'start' });
      let shown = -1;
      const draw = (k) => {
        g.clear('main'); g.clear('over');
        for (let j = 0; j < k; j++) {
          const y = j + 1, c = hit[j] ? 'c1' : 'c2';
          g.seg([means[j] - half, y], [means[j] + half, y], { c, w: hit[j] ? 2 : 3 });
          g.dot(means[j], y, { c, r: hit[j] ? 2.4 : 3.4 });
        }
        shown = k;
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const k = Math.min(K, Math.floor(t * 10));
        if (k !== shown) draw(k);
        label.textContent = k < K ? `${k} / ${K}` : '';
        return k < K;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Repeat the experiment', '実験を繰り返す') });
      const miss = hit.filter((h) => !h).length;
      L.legend(ctx.host, [{ c: 'c1', label: T('interval covers μ', 'μ を含む区間') }, { c: 'c2', label: T('interval misses μ', 'μ を外した区間') }, { c: 'ink', dash: true, label: T('true mean μ', '真の平均 μ') }]);
      ctx.readout([{ k: `z${T('', '')}`, v: fmt(z, 3) }, { k: 'SE = σ/√n', v: fmt(sigma / Math.sqrt(n), 3) }, { k: T('half-width z·SE', '半幅 z·SE'), v: fmt(half, 3), tone: 'key' }, { k: T('intervals missing μ', 'μ を外した区間'), v: `${miss} / ${K}` }, { k: T('expected misses', '期待される外れ'), v: fmt(K * (1 - level), 1) }],
        T('Changing the level keeps the same samples and only rescales every interval.', '信頼水準を変えても標本は同じで、すべての区間の幅だけが変わります。'));
    },
  };

  /* ---------- 3. least squares ---------- */
  D.regression = {
    render(ctx, v) {
      const st = ctx.state, key = `${v.slope}|${v.noise}`, n = 12;
      if (st.key !== key) {
        const r = rng(2718);
        st.pts = L.seq(n, (i) => { const x = 0.1 + i * 1.8 / (n - 1) + (r() - 0.5) * 0.06, e = gauss(r); return [x, 1 + v.slope * x + v.noise * e]; });
        st.key = key;
      }
      const P = st.pts, xb = P.reduce((a, p) => a + p[0], 0) / n, yb = P.reduce((a, p) => a + p[1], 0) / n;
      const Sxx = P.reduce((a, p) => a + (p[0] - xb) ** 2, 0), Sxy = P.reduce((a, p) => a + (p[0] - xb) * (p[1] - yb), 0), Syy = P.reduce((a, p) => a + (p[1] - yb) ** 2, 0);
      const b1 = Sxy / Sxx, b0 = yb - b1 * xb, fit = (x) => b0 + b1 * x;
      const res = P.map(([x, y]) => y - fit(x)), SSR = res.reduce((a, e) => a + e * e, 0), s2 = SSR / (n - 2), s = Math.sqrt(s2);
      const tq = tquant(0.975, n - 2), R2 = Syy > 0 ? 1 - SSR / Syy : 1;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Data, least-squares line and 95% confidence band for the mean response', 'データ、最小二乗直線、平均応答の95%信頼帯'));
      const lo = Math.min(1, 1 + 2 * v.slope), hi = Math.max(1, 1 + 2 * v.slope), Y0 = Math.floor(lo - 1 - 2.5 * v.noise), Y1 = Math.ceil(hi + 1 + 2.5 * v.noise);
      const f = L.fig(c1, { x: [0, 2], y: [Y0, Y1], aspect: 0.85, maxH: 400, xlabel: 'x', ylabel: 'y' });
      const band = (x, sg) => fit(x) + sg * tq * s * Math.sqrt(1 / n + (x - xb) ** 2 / Sxx);
      f.poly(L.sample(0, 2, 80, (x) => [x, band(x, 1)]).concat(L.sample(0, 2, 80, (x) => [2 - x, band(2 - x, -1)])), { c: 'c1', fo: 0.14, w: 0, layer: 'under' });
      f.line([[0, 1], [2, 1 + 2 * v.slope]], { c: 'muted', w: 1.6, dash: '6 5' });
      P.forEach(([x, y], i) => f.seg([x, y], [x, fit(x)], { c: 'c2', w: 1.8, op: 0.85 }));
      f.line([[0, fit(0)], [2, fit(2)]], { c: 'c1', w: 2.8 });
      P.forEach(([x, y], i) => f.handle(x, y, { c: 'ink', r: 5, label: T(`Data point ${i + 1}`, `データ点 ${i + 1}`), bounds: [0.02, 1.98, Y0 + 0.1, Y1 - 0.1], onDrag: (nx, ny) => { st.pts[i] = [nx, ny]; ctx.redraw(); } }));
      f.dot(xb, yb, { c: 'hl', r: 5 });
      f.text(xb, yb, '(x̄, ȳ)', { dx: 8, dy: 18, anchor: 'start', small: true });
      L.h('p', 'lab-cap', c2, T('Residuals yᵢ − ŷᵢ against x', 'x に対する残差 yᵢ − ŷᵢ'));
      const rm = Math.max(0.5, ...res.map(Math.abs)) * 1.2;
      const g = L.fig(c2, { x: [0, 2], y: [-rm, rm], aspect: 0.85, maxH: 400, xlabel: 'x', ylabel: T('residual', '残差') });
      g.hline(0, { c: 'c1', dash: false, w: 2 });
      P.forEach(([x], i) => { g.seg([x, 0], [x, res[i]], { c: 'c2', w: 2 }); g.dot(x, res[i], { c: 'c2', r: 3.5 }); });
      L.legend(ctx.host, [{ c: 'c1', label: T('fitted line ŷ = β̂₀ + β̂₁x', '回帰直線 ŷ = β̂₀ + β̂₁x') }, { kind: 'fill', c: 'c1', label: T('95% band for the mean of y', 'y の平均の95%信頼帯') }, { c: 'muted', dash: true, label: T('true line y = 1 + slope·x', '真の直線 y = 1 + 傾き·x') }, { c: 'c2', label: T('residuals', '残差') }]);
      const se1 = s / Math.sqrt(Sxx);
      ctx.readout([{ k: 'β̂₁', v: `${fmt(b1, 3)} ± ${fmt(tq * se1, 3)}`, tone: 'key' }, { k: 'β̂₀', v: fmt(b0, 3) }, { k: T('sum of squared residuals', '残差平方和'), v: fmt(SSR, 4) }, { k: 'R²', v: fmt(R2, 3) }, { k: T('residuals sum to', '残差の和'), v: fmt(res.reduce((a, e) => a + e, 0), 3) }],
        T('Drag any point: the line always passes through (x̄, ȳ), and a point far from x̄ pulls the slope hardest.', '点をドラッグできます。直線は常に (x̄, ȳ) を通り、x̄ から遠い点ほど傾きを強く動かします。'));
    },
  };
})();
