'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  const pop = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; };
  // n coin steps scaled by 1/sqrt(n): returns [t, W] points
  function walk(n, r) { const out = [[0, 0]]; let s = 0; for (let i = 1; i <= n; i++) { s += r() < 0.5 ? -1 : 1; out.push([i / n, s / Math.sqrt(n)]); } return out; }
  // endpoint W_n(1) sampled with 32 coin flips per random word
  function walkEnd(n, r) { let heads = 0, left = n; while (left > 0) { const b = Math.min(32, left); const w = Math.floor(r() * 4294967296) >>> 0; heads += pop(b === 32 ? w : w & ((1 << b) - 1)); left -= b; } return (2 * heads - n) / Math.sqrt(n); }
  // Brownian path on [0,1] with 2^K increments
  function brownian(K, seed) { const r = rng(seed), n = 1 << K, sd = Math.sqrt(1 / n), B = new Float64Array(n + 1); for (let i = 1; i <= n; i++) B[i] = B[i - 1] + sd * gauss(r); return B; }
  function variations(B, m) {
    const n = B.length - 1, step = n >> m;
    let tv = 0, qv = 0, ito = 0, strat = 0;
    for (let i = 0; i < n; i += step) { const d = B[i + step] - B[i]; tv += Math.abs(d); qv += d * d; ito += B[i] * d; strat += 0.5 * (B[i] + B[i + step]) * d; }
    return { tv, qv, ito, strat };
  }
  // Ornstein-Uhlenbeck: exact moments and exact-transition sampling
  const ouMean = (x0, th, t) => x0 * Math.exp(-th * t);
  const ouVar = (sig, th, t) => (th < 1e-9 ? sig * sig * t : sig * sig / (2 * th) * (1 - Math.exp(-2 * th * t)));
  function ouPaths(x0, th, sig, tMax, dt, count, seed) {
    const r = rng(seed), steps = Math.round(tMax / dt), a = Math.exp(-th * dt), s = Math.sqrt(ouVar(sig, th, dt));
    const paths = [];
    for (let k = 0; k < count; k++) { const p = new Float64Array(steps + 1); p[0] = x0; for (let i = 1; i <= steps; i++) p[i] = p[i - 1] * a + s * gauss(r); paths.push(p); }
    return paths;
  }
  (window.LabModels = window.LabModels || {})['stochastic-processes'] = { rng, gauss, walk, walkEnd, brownian, variations, ouMean, ouVar, ouPaths };

  const normPdf = (x, m = 0, v = 1) => Math.exp(-(x - m) * (x - m) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

  /* ---------- 1. scaling ---------- */
  D.scaling = {
    render(ctx, v) {
      const n = 1 << v.k, z = v.zoom, tw = Math.pow(4, -z), sw = Math.pow(2, -z);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      c1.style.gridColumn = 'span 2';
      L.h('p', 'lab-cap', c1, z ? T(`Zoomed in ${4 ** z}× in time and ${2 ** z}× in space`, `時間を ${4 ** z} 倍、空間を ${2 ** z} 倍に拡大`) : T('Forty rescaled walks, one highlighted', '縮尺を変えた 40 本の歩み（1 本を強調）'));
      const f = L.fig(c1, { x: [0, tw], y: [-3 * sw, 3 * sw], aspect: 0.5, maxH: 380, xlabel: 't', ylabel: 'W' });
      f.area(L.sample(0, tw, 200, (t) => 2 * Math.sqrt(t)).concat(L.sample(0, tw, 200, (t) => -2 * Math.sqrt(t)).reverse()), { c: 'c1', fo: 0.07, base: 0 });
      f.poly(L.sample(0, tw, 200, (t) => Math.sqrt(t)).concat(L.sample(0, tw, 200, (t) => -Math.sqrt(t)).reverse()), { c: 'c1', fo: 0.12, w: 0, layer: 'under' });
      const r = rng(v.seed);
      const cut = (pts) => pts.filter((p) => p[0] <= tw + 1e-12);
      for (let i = 0; i < 40; i++) f.line(cut(walk(n, r)), { c: 'c1', w: 0.9, op: 0.28 });
      const main = cut(walk(n, rng(v.seed + 1000)));
      // staircase rendering of the highlighted walk shows its steps honestly
      const stairs = []; main.forEach((p, i) => { if (i) stairs.push([p[0], main[i - 1][1]]); stairs.push(p); });
      f.line(stairs, { c: 'hl', w: 2.2 });
      L.h('p', 'lab-cap', c2, T('W(1) from 2000 walks against the normal density', '2000 本の W(1) と正規密度'));
      const g = L.fig(c2, { x: [-4, 4], y: [0, 0.5], aspect: 0.9, maxH: 380, xlabel: 'W(1)' });
      const rr = rng(v.seed + 77), ends = L.seq(2000, () => walkEnd(n, rr));
      const bw = Math.max(0.25, 2 / Math.sqrt(n)), bins = new Map();
      // align bins with the lattice of attainable values when n is small
      ends.forEach((x) => { const b = Math.floor((x + 4 + bw / 2) / bw); bins.set(b, (bins.get(b) || 0) + 1); });
      bins.forEach((c, b) => g.rect(-4 - bw / 2 + b * bw, 0, bw, c / (2000 * bw), { c: 'c1', fo: 0.45, w: 0.6 }));
      g.line(L.sample(-4, 4, 200, (x) => normPdf(x)), { c: 'c2', w: 2.4 });
      const mean = ends.reduce((s, x) => s + x, 0) / ends.length, vr = ends.reduce((s, x) => s + (x - mean) ** 2, 0) / (ends.length - 1);
      L.legend(ctx.host, [{ c: 'hl', label: T('one walk, drawn as its steps', '1 本の歩み（段差のまま表示）') }, { kind: 'fill', c: 'c1', label: T('±√t and ±2√t', '±√t と ±2√t') }, { c: 'c2', label: T('standard normal density', '標準正規密度') }]);
      const visible = Math.round(n * tw);
      ctx.readout([{ k: 'n', v: String(n), tone: 'key' }, { k: T('steps in view', '表示中の歩数'), v: String(visible) }, { k: T('sample variance of W(1)', 'W(1) の標本分散'), v: fmt(vr, 3) }],
        visible < 16 ? T('Zoomed this far with this few steps, the staircase shows: the scaling limit needs n to grow faster than the zoom.', 'この歩数でここまで拡大すると階段が見えます。スケーリング極限には、拡大よりも速く n を大きくする必要があります。') : T('Zoom in: the picture keeps the same roughness, because Brownian motion is self-similar with exponent ½.', '拡大しても同じ粗さのままです。ブラウン運動は指数 ½ の自己相似性を持つからです。'));
    },
  };

  /* ---------- 2. quadratic variation ---------- */
  D['quadratic-variation'] = {
    render(ctx, v) {
      const K = 14, B = brownian(K, v.seed), n = 1 << K, m = v.m, step = n >> m;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`One Brownian path and its ${2 ** m}-piece partition`, `1 本のブラウン経路と ${2 ** m} 分割`));
      let lo = Infinity, hi = -Infinity; for (const x of B) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
      const pad = (hi - lo) * 0.1 + 0.05;
      const f = L.fig(c1, { x: [0, 1], y: [lo - pad, hi + pad], aspect: 0.72, maxH: 380, xlabel: 't', ylabel: 'B' });
      const every = Math.max(1, n / 2048);
      const pts = []; for (let i = 0; i <= n; i += every) pts.push([i / n, B[i]]);
      f.line(pts, { c: 'c1', w: 1, op: 0.7 });
      const chords = []; for (let i = 0; i <= n; i += step) chords.push([i / n, B[i]]);
      f.line(chords, { c: 'c2', w: 2 });
      if (m <= 7) chords.forEach((p) => f.dot(p[0], p[1], { c: 'c2', r: 3.2 }));
      L.h('p', 'lab-cap', c2, T('Two sums as the partition refines (log scale)', '分割を細かくしたときの二つの和（対数目盛）'));
      const g = L.fig(c2, { x: [0.5, 14.5], y: [-4.5, 2.5], aspect: 0.72, maxH: 380, xlabel: T('level m', '段階 m'), ticksY: [[-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1'], [2, '100']], ticksX: [2, 4, 6, 8, 10, 12, 14].map((k) => [k, String(k)]) });
      const levels = L.seq(14, (i) => i + 1), vars = levels.map((k) => variations(B, k));
      const smooth = levels.map((k) => { const s = n >> k; let q = 0; for (let i = 0; i < n; i += s) { const d = 0.5 * (Math.sin(2 * Math.PI * (i + s) / n) - Math.sin(2 * Math.PI * i / n)); q += d * d; } return q > 1e-12 ? q : NaN; });
      g.hline(0, { c: 'c3', dash: '3 4', w: 1.2 });
      g.line(levels.map((k, i) => [k, Math.log10(vars[i].tv)]), { c: 'c2', w: 2.2 });
      g.line(levels.map((k, i) => [k, Math.log10(vars[i].qv)]), { c: 'c3', w: 2.6 });
      g.line(levels.map((k, i) => [k, Math.log10(smooth[i])]), { c: 'muted', w: 1.6, dash: '5 4' });
      g.vline(m, { c: 'hl', w: 1.4, dash: '3 3' });
      levels.forEach((k, i) => { g.dot(k, Math.log10(vars[i].tv), { c: 'c2', r: k === m ? 6 : 3 }); g.dot(k, Math.log10(vars[i].qv), { c: 'c3', r: k === m ? 6 : 3 }); });
      g.text(13.6, Math.log10(vars[12].tv) + 0.3, 'Σ|ΔB|', { anchor: 'end', small: true, c: 'c2' });
      g.text(14.3, Math.log10(vars[13].qv) + 0.35, 'Σ(ΔB)²', { anchor: 'end', small: true, c: 'c3' });
      g.text(14.3, Math.log10(smooth[13]) + 0.4, T('smooth curve', '滑らかな曲線'), { anchor: 'end', small: true, c: 'muted' });
      const w = vars[m - 1], B1 = B[n];
      L.legend(ctx.host, [{ c: 'c2', label: T('total variation Σ|ΔB|', '全変動 Σ|ΔB|') }, { c: 'c3', label: T('quadratic variation Σ(ΔB)²', '二次変分 Σ(ΔB)²') }, { c: 'muted', dash: true, label: T('Σ(Δf)² for f = ½ sin 2πt', 'f = ½ sin 2πt の Σ(Δf)²') }]);
      ctx.readout([{ k: 'Σ|ΔB|', v: fmt(w.tv, 3) }, { k: 'Σ(ΔB)²', v: fmt(w.qv, 4), tone: 'key' }, { k: T('Itô sum Σ B ΔB', '伊藤和 Σ B ΔB'), v: fmt(w.ito, 4) }, { k: '(B₁² − 1)/2', v: fmt((B1 * B1 - 1) / 2, 4) }, { k: T('Stratonovich sum', 'ストラトノヴィッチ和'), v: fmt(w.strat, 4) }, { k: 'B₁²/2', v: fmt(B1 * B1 / 2, 4) }],
        T('The two stochastic integrals differ by exactly half the quadratic variation, which is why their limits differ by t/2.', '二つの確率積分の差はちょうど二次変分の半分で、そのため極限は t/2 だけ違います。'));
    },
  };

  /* ---------- 3. Fokker-Planck ---------- */
  D['fokker-planck'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, key = `${v.theta}|${v.sigma}|${v.x0}`, dt = 0.02, tMax = 4;
      if (st.key !== key) { st.paths = ouPaths(v.x0, v.theta, v.sigma, tMax, dt, 600, 11); st.key = key; }
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      c1.style.gridColumn = 'span 2';
      L.h('p', 'lab-cap', c1, T('Exact density (shading) with 30 of the 600 simulated paths. Drag the gold line to move the time slice.', '厳密な密度（濃淡）と、600 本のシミュレーション経路のうち 30 本。金色の線をドラッグすると時刻の断面を動かせます。'));
      const f = L.fig(c1, { x: [0, tMax], y: [-3.6, 3.6], aspect: 0.46, maxH: 380, xlabel: 't', ylabel: 'x', grid: false });
      f.raster((t, x) => { const vv = Math.max(ouVar(v.sigma, v.theta, t), 0.004); const p = normPdf(x, ouMean(v.x0, v.theta, t), vv) * Math.sqrt(2 * Math.PI * vv); return Math.pow(p, 0.8) * 0.85; }, { cmap: 'warm', res: 3 });
      st.paths.slice(0, 30).forEach((p) => f.line(L.seq(p.length, (i) => [i * dt, p[i]]), { c: 'c1', w: 0.9, op: 0.5 }));
      f.line(L.sample(0, tMax, 200, (t) => ouMean(v.x0, v.theta, t)), { c: 'ink', w: 1.6, dash: '5 4' });
      for (const s of [1, -1]) f.line(L.sample(0, tMax, 200, (t) => ouMean(v.x0, v.theta, t) + s * 2 * Math.sqrt(ouVar(v.sigma, v.theta, t))), { c: 'c4', w: 1.4, dash: '3 3' });
      L.h('p', 'lab-cap', c2, T('Histogram of all 600 paths at the slice, against the exact solution', '断面での 600 本すべてのヒストグラムと厳密解'));
      const g = L.fig(c2, { x: [-3.6, 3.6], y: [0, 1.2], aspect: 0.62, maxH: 300, xlabel: 'x' });
      const drawSlice = (t) => {
        f.clear('over'); g.clear('main'); g.clear('under');
        f.vline(t, { c: 'hl', w: 2.4, dash: '', layer: 'over' });
        const k = Math.round(t / dt), xs = st.paths.map((p) => p[k]);
        const bw = 0.2, counts = new Map(); xs.forEach((x) => { const b = Math.floor((x + 3.6) / bw); counts.set(b, (counts.get(b) || 0) + 1); });
        const m = ouMean(v.x0, v.theta, t), vv = ouVar(v.sigma, v.theta, t);
        const peak = normPdf(m, m, vv);
        g.clear('over');
        const ymax = Math.max(1.2, peak * 1.1);
        const sy = 1.2 / ymax;
        counts.forEach((c, b) => g.rect(-3.6 + b * bw, 0, bw, c / (600 * bw) * sy, { c: 'c1', fo: 0.45, w: 0.6 }));
        g.line(L.sample(-3.6, 3.6, 300, (x) => normPdf(x, m, vv) * sy), { c: 'c2', w: 2.4 });
        const sm = xs.reduce((s, x) => s + x, 0) / xs.length, sv = xs.reduce((s, x) => s + (x - sm) ** 2, 0) / (xs.length - 1);
        ctx.readout([{ k: 't', v: fmt(t, 2) }, { k: T('mean: paths / exact', '平均：経路 / 厳密'), v: `${fmt(sm, 3)} / ${fmt(m, 3)}`, tone: 'key' }, { k: T('variance: paths / exact', '分散：経路 / 厳密'), v: `${fmt(sv, 3)} / ${fmt(vv, 3)}`, tone: 'key' }, { k: T('long-run variance σ²/2θ', '長時間後の分散 σ²/2θ'), v: v.theta > 0 ? fmt(v.sigma * v.sigma / (2 * v.theta), 3) : '∞' }, { k: T('histogram scale', 'ヒストグラムの縮尺'), v: sy < 1 ? `×${fmt(sy, 2)}` : '×1' }],
          v.theta === 0 ? T('With no pull back to zero the spread grows like σ√t forever: pure diffusion.', '0 への引き戻しがなければ広がりは σ√t のように増え続けます。純粋な拡散です。') : T('The spread saturates: noise injects variance at rate σ², the drift removes it at rate 2θ times the variance.', '広がりは飽和します。ノイズは分散を速さ σ² で注ぎ、ドリフトは分散の 2θ 倍の速さで取り除きます。'));
      };
      drawSlice(v.t);
      f.handle(v.t, 3.2, { c: 'hl', r: 8, axis: 'x', label: T('Time slice', '時刻の断面'), bounds: [0.05, tMax, 3.2, 3.2], onDrag: (x) => { ctx.set('t', x, true); ctx.redraw(); } });
      st.anim = L.animator(ctx.host, (d, t) => { if (d === 0 && t === 0) return; const tt = Math.min(tMax, 0.05 + t * 0.8); ctx.set('t', tt, true); drawSlice(tt); if (tt >= tMax) return false; }, { autoplay: false, once: true, playLabel: T('Sweep the slice', '断面を動かす') });
      L.legend(ctx.host, [{ c: 'c1', label: T('sample paths', '標本経路') }, { c: 'ink', dash: true, label: T('exact mean x₀·exp(−θt)', '厳密な平均 x₀·exp(−θt)') }, { c: 'c4', dash: true, label: T('mean ± 2 standard deviations', '平均 ± 2 標準偏差') }, { c: 'c2', label: T('exact density at the slice', '断面での厳密な密度') }]);
    },
  };
})();
