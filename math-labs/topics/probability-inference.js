'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const beta = (x, a, b) => window.MathLabs.betaDensity(x, a, b);
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // standard normal CDF (Abramowitz and Stegun 7.1.26, error below 1.5e-7)
  const Phi = (z) => { const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x); const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e); };
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(L.TAU);

  // Quantiles of Beta(a, b) from a fine cumulative sum.
  function betaQuantiles(a, b, qs) {
    const n = 2000, cdf = new Float64Array(n + 1);
    let prev = beta(0, a, b), acc = 0;
    for (let i = 1; i <= n; i++) { const y = beta(i / n, a, b); acc += (prev + y) / 2 / n; cdf[i] = acc; prev = y; }
    return qs.map((q) => { const target = q * acc; let i = 1; while (i < n && cdf[i] < target) i++; const lo = cdf[i - 1], hi = cdf[i]; return (i - 1 + (hi > lo ? (target - lo) / (hi - lo) : 0)) / n; });
  }

  D.bayes = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const A0 = v.alpha, B0 = v.beta, H = Math.round(v.h), Tt = Math.round(v.t), N = H + Tt;
      // a fixed, seeded order of the observed flips
      const r = rng(9173 + H * 101 + Tt * 7), order = L.seq(N, (i) => i < H);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      const counts = (k) => { let h = 0; for (let i = 0; i < k; i++) if (order[i]) h++; return [h, k - h]; };
      const grid = L.sample(0, 1, 240, (x) => x);
      let ymax = 1.2;
      for (let k = 0; k <= N; k++) { const [h, t] = counts(k); for (const [x] of grid) ymax = Math.max(ymax, beta(x, A0 + h, B0 + t)); }
      grid.forEach(([x]) => { ymax = Math.max(ymax, beta(x, H + 1, Tt + 1)); });
      ymax *= 1.12;

      // coin strip
      const perRow = Math.max(15, Math.ceil(N / 2)), rows = N > perRow ? 2 : 1;
      const strip = N ? L.stage(ctx.host, { w: 100, h: rows === 2 ? 8 : 4.4, maxH: 100 }) : null;
      const coinR = Math.min(1.6, 100 / perRow * 0.36);
      const drawCoins = (k) => {
        if (!strip) return;
        strip.clear('main'); strip.clear('over');
        for (let i = 0; i < N; i++) {
          const row = Math.floor(i / perRow), col = i % perRow;
          const x = 50 + (col - (Math.min(N - row * perRow, perRow) - 1) / 2) * (100 / perRow) * 0.92, y = rows === 2 ? (row ? 2 : 6) : 2.2;
          const seen = i < k, c = order[i] ? 'c1' : 'c2';
          strip.circle(x, y, coinR, { c, fill: seen ? true : false, fo: order[i] ? 0.85 : 0.25, w: 1.4, op: seen ? 1 : 0.3 });
        }
      };

      const f = L.fig(ctx.host, { x: [0, 1], y: [0, ymax], aspect: 0.5, maxH: 400, xlabel: T('probability of heads p', '表の確率 p'), ylabel: T('density', '密度') });
      f.line(grid.map(([x]) => [x, beta(x, A0, B0)]), { c: 'muted', w: 2, dash: '6 5', layer: 'under' });
      let last = null;
      const draw = (k) => {
        f.clear('main'); f.clear('over');
        const [h, t] = counts(k), a = A0 + h, b = B0 + t;
        const post = grid.map(([x]) => [x, beta(x, a, b)]);
        const [lo, hi] = betaQuantiles(a, b, [0.025, 0.975]);
        f.area(post, { c: 'c1', fo: 0.1, layer: 'main' });
        f.area(post.filter(([x]) => x >= lo && x <= hi).concat([[hi, beta(hi, a, b)]]).sort((p, q) => p[0] - q[0]), { c: 'c1', fo: 0.22, layer: 'main' });
        f.line(post, { c: 'c1', w: 2.8 });
        if (N) f.line(grid.map(([x]) => [x, beta(x, H + 1, Tt + 1)]), { c: 'c2', w: 2, dash: '2 4' });
        const m = a / (a + b), dm = beta(m, a, b);
        f.seg([m, 0], [m, dm], { c: 'hl', w: 2 });
        f.dot(m, dm, { c: 'hl', r: 5.5 });
        f.text(m, dm * 0.3, `${T('mean', '平均')} ${fmt(m, 3)}`, { dx: m > 0.5 ? -8 : 8, anchor: m > 0.5 ? 'end' : 'start', small: true });
        f.text(lo, 0, T('95%', '95%'), { dx: 5, dy: -8, anchor: 'start', small: true, c: 'c1' });
        drawCoins(k);
        last = { k, h, t, a, b, m, lo, hi };
      };
      const STEP = 0.4;
      ctx.state.anim = N ? L.animator(ctx.host, (dt, t, label) => {
        const k = Math.min(N, Math.floor(t / STEP));
        if (!last || last.k !== k) draw(k);
        label.textContent = k < N ? T(`${k} of ${N} flips`, `${N} 回中 ${k} 回`) : '';
        return k < N;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Play the flips one at a time', '1回ずつ更新を再生') }) : (draw(0), null);
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('heads', '表') }, { kind: 'dot', c: 'c2', label: T('tails', '裏') }, { c: 'muted', dash: true, label: T('prior', '事前分布') }, { c: 'c2', dash: true, label: T('likelihood, rescaled to area 1', '尤度（面積1に規格化）') }, { c: 'c1', label: T('posterior', '事後分布') }, { kind: 'fill', c: 'c1', label: T('central 95% credible interval', '中央95%信用区間') }]);
      const { a, b, m, lo, hi } = last;
      const mode = a > 1 && b > 1 ? (a - 1) / (a + b - 2) : a <= 1 && b > 1 ? 0 : b <= 1 && a > 1 ? 1 : NaN;
      ctx.readout([{ k: T('posterior', '事後分布'), v: `Beta(${a}, ${b})`, tone: 'key' }, { k: T('mean', '平均'), v: fmt(m, 3) }, { k: T('mode', '最頻値'), v: Number.isFinite(mode) ? fmt(mode, 3) : T('none', 'なし') }, { k: T('95% interval', '95%区間'), v: `[${fmt(lo, 3)}, ${fmt(hi, 3)}]` }, { k: T('observed fraction', '観測比率'), v: N ? fmt(H / N, 3) : 'n/a' }],
        (A0 === 1 && B0 === 1 ? T('With the flat prior Beta(1, 1) the posterior coincides with the rescaled likelihood. ', '一様な事前分布 Beta(1, 1) では、事後分布は規格化した尤度と一致します。') : T(`The prior counts as ${A0 - 1} heads and ${B0 - 1} tails added to a flat prior. `, `この事前分布は、一様な事前分布に表 ${A0 - 1} 回と裏 ${B0 - 1} 回を加えたものに相当します。`)) + T('The order of the flips does not change the final posterior.', '投げた順番は最終的な事後分布を変えません。'));
    },
  };

  D.clt = {
    render(ctx, v) {
      const n = Math.round(v.n), p = v.p, q = 1 - p;
      const pmf = (nn) => { const out = []; let pr = q ** nn; for (let k = 0; k <= nn; k++) { if (k) pr *= (nn - k + 1) / k * p / q; out.push(pr); } return out; };
      const kolmogorov = (nn) => { const sd = Math.sqrt(nn * p * q), m = pmf(nn); let F = 0, d = 0; for (let k = 0; k <= nn; k++) { const z = (k - nn * p) / sd, P = Phi(z); d = Math.max(d, Math.abs(F - P)); F += m[k]; d = Math.max(d, Math.abs(F - P)); } return d; };
      const sd = Math.sqrt(n * p * q), m = pmf(n);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Exact distribution of the standardized sum Zₙ, n = ${n}`, `標準化した和 Zₙ の厳密な分布（n = ${n}）`));
      const hmax = Math.max(0.45, ...m.map((x) => x * sd));
      const f = L.fig(c1, { x: [-4.2, 4.2], y: [0, hmax * 1.12], aspect: 0.72, maxH: 380, xlabel: 'z', ylabel: T('density', '密度') });
      m.forEach((pr, k) => { const z = (k - n * p) / sd; if (pr * sd > 1e-4) f.rect(z - 0.5 / sd, 0, 1 / sd, pr * sd, { c: 'c1', fo: 0.35, w: 1 }); });
      f.line(L.sample(-4.2, 4.2, 240, phi), { c: 'c2', w: 2.6 });
      f.hover((x) => { const k = Math.round(x * sd + n * p); if (k < 0 || k > n) return null; return { x: (k - n * p) / sd, text: `Sₙ = ${k}: P = ${fmt(m[k], 4)}` }; });
      L.h('p', 'lab-cap', c2, T('Largest gap between the two distribution functions', '2つの分布関数の最大のずれ'));
      const ns = L.seq(59, (i) => i + 2), ds = ns.map(kolmogorov);
      const be = (nn) => 0.4748 * (p * p + q * q) / Math.sqrt(p * q * nn);
      const lg = Math.log10;
      const g = L.fig(c2, { x: [0, 62], y: [-1.9, 0.05], aspect: 0.72, maxH: 380, xlabel: T('number of trials n', '試行回数 n'), ylabel: 'sup |Fₙ − Φ|', ticksY: [[-2, '0.01'], [lg(0.03), '0.03'], [-1, '0.1'], [lg(0.3), '0.3'], [0, '1']] });
      g.line(ns.map((k) => [k, lg(Math.min(1.2, be(k)))]), { c: 'muted', w: 1.8, dash: '6 4' });
      g.line(ns.map((k, i) => [k, lg(ds[i])]), { c: 'c1', w: 1.4, op: 0.5 });
      ns.forEach((k, i) => g.dot(k, lg(ds[i]), { c: 'c1', r: 2.4 }));
      g.dot(n, lg(ds[n - 2]), { c: 'hl', r: 6.5 });
      g.text(n, lg(ds[n - 2]), fmt(ds[n - 2], 3), { dy: 22, small: true });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('binomial mass × σ, bar width 1/σ', '二項確率 × σ、棒の幅 1/σ') }, { c: 'c2', label: T('standard normal density', '標準正規密度') }, { kind: 'dot', c: 'c1', label: T('largest gap for each n (log scale)', '各 n での最大のずれ（対数目盛）') }, { c: 'muted', dash: true, label: T('Berry–Esseen bound', 'ベリー・エッセンの上界') }]);
      const skew = (q - p) / sd;
      ctx.readout([{ k: T('mean np', '平均 np'), v: fmt(n * p, 3) }, { k: T('variance np(1 − p)', '分散 np(1 − p)'), v: fmt(sd * sd, 3) }, { k: T('skewness', '歪度'), v: fmt(skew, 3) }, { k: 'sup |Fₙ − Φ|', v: fmt(ds[n - 2], 4), tone: 'key' }],
        T('The gap shrinks like 1/√n: faster for p near ½, more slowly for lopsided coins, whose sums stay skewed.', 'ずれは 1/√n の速さで縮みます。p が ½ に近いほど速く、偏ったコインでは和の歪みが残るため遅くなります。'));
    },
  };

  D.conditional = {
    render(ctx, v) {
      const b = v.b, a1 = v.inside, a0 = v.outside;
      const pAB = b * a1, pA = pAB + (1 - b) * a0, pAgB = a1, pBgA = pA > 0 ? pAB / pA : NaN;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The sample space: area is probability', '標本空間：面積が確率です'));
      const f = L.fig(c1, { x: [-0.02, 1.02], y: [-0.02, 1.16], equal: true, maxH: 380, axes: false });
      f.rect(0, 0, 1, 1, { c: 'muted', fo: 0.03, w: 1.4 });
      f.rect(0, 0, b, 1, { c: 'c1', fo: 0.12, w: 1.8 });
      f.rect(0, 0, b, a1, { c: 'hl', fo: 0.55, w: 1.6 });
      f.rect(b, 0, 1 - b, a0, { c: 'c2', fo: 0.35, w: 1.6 });
      f.text(b / 2, 1.07, 'B', { math: true, c: 'c1', dy: 5 });
      f.text((1 + b) / 2, 1.07, 'Bᶜ', { math: true, c: 'muted', dy: 5 });
      if (a1 > 0.1 && b > 0.14) f.text(b / 2, a1 / 2, 'A∩B', { dy: 5 });
      if (a0 > 0.1 && b < 0.86) f.text((1 + b) / 2, a0 / 2, 'A∩Bᶜ', { dy: 5 });
      f.text(b, a1, fmt(a1, 2), { dx: -5, anchor: 'end', dy: a1 > 0.9 ? 16 : -6, small: true });
      f.text(1, a0, fmt(a0, 2), { dx: -5, anchor: 'end', dy: a0 > 0.9 ? 16 : -6, small: true });
      f.handle(b, 1.07, { c: 'c1', axis: 'x', bounds: [0.1, 0.9, 1.07, 1.07], label: T('Width of B', 'Bの幅'), onDrag: (x) => ctx.set('b', x) });
      f.handle(b * 0.4, a1, { c: 'hl', axis: 'y', bounds: [0, 1, 0, 1], label: T('Height of A inside B', 'B内のAの高さ'), onDrag: (x, y) => ctx.set('inside', y) });
      f.handle(b + (1 - b) * 0.4, a0, { c: 'c2', axis: 'y', bounds: [0, 1, 0, 1], label: T('Height of A outside B', 'B外のAの高さ'), onDrag: (x, y) => ctx.set('outside', y) });

      L.h('p', 'lab-cap', c2, T('Same numerator, different denominators', '同じ分子、異なる分母'));
      const g = L.fig(c2, { x: [-0.02, 1.02], y: [0.15, 3.25], aspect: 0.8, maxH: 380, axes: false });
      const bar = (y, parts, title, value) => {
        let x = 0;
        parts.forEach(([w, c, fo]) => { if (w > 1e-9) g.rect(x, y, w, 0.42, { c, fo, w: 1.2 }); x += w; });
        g.text(0, y + 0.42, title, { anchor: 'start', dy: -9, small: true });
        g.text(1, y + 0.42, value, { anchor: 'end', dy: -9 });
      };
      bar(2.55, [[pA, 'c2', 0.35], [1 - pA, 'muted', 0.06]], T('P(A): A as a share of everything', 'P(A)：全体に占めるA'), fmt(pA, 3));
      bar(1.45, [[pAgB, 'hl', 0.55], [1 - pAgB, 'c1', 0.12]], T('P(A | B): A∩B as a share of B', 'P(A | B)：Bに占めるA∩B'), fmt(pAgB, 3));
      if (pA > 0) bar(0.35, [[pBgA, 'hl', 0.55], [1 - pBgA, 'c2', 0.35]], T('P(B | A): A∩B as a share of A', 'P(B | A)：Aに占めるA∩B'), fmt(pBgA, 3));
      else g.text(0.5, 0.55, T('P(B | A) is undefined when P(A) = 0', 'P(A) = 0 のとき P(B | A) は定義されません'), { small: true });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: 'B' }, { kind: 'fill', c: 'hl', label: 'A∩B' }, { kind: 'fill', c: 'c2', label: 'A∩Bᶜ' }]);
      const indep = Math.abs(a1 - a0) < 1e-9;
      ctx.readout([{ k: 'P(A∩B)', v: fmt(pAB, 3), tone: 'key' }, { k: 'P(A)', v: fmt(pA, 3) }, { k: 'P(A | B)', v: fmt(pAgB, 3) }, { k: 'P(B | A)', v: pA > 0 ? fmt(pBgA, 3) : 'n/a' }, { k: T('independent?', '独立？'), v: indep ? T('yes', 'はい') : T('no', 'いいえ'), tone: indep ? 'good' : undefined }],
        T('Drag the blue handle to resize B and the gold and orange handles to change the height of A.', '青のハンドルでBの幅を、金色と橙のハンドルでAの高さを変えられます。'));
    },
  };
})();
