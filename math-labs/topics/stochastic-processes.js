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
      L.h('p', 'lab-cap', c1, z ? T(`Zoomed in ${4 ** z}× in time and ${2 ** z}× in space`, `時間を ${4 ** z} 倍、空間を ${2 ** z} 倍に拡大`) : T('Forty rescaled walks, one highlighted', '縮尺を変えた 40 本の歩み（1 本を強調）'));
      const f = L.fig(c1, { x: [0, tw], y: [-3 * sw, 3 * sw], aspect: 0.75, maxH: 380, xlabel: 't', ylabel: 'W' });
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
      const g = L.fig(c2, { x: [-4, 4], y: [0, 0.5], aspect: 0.75, maxH: 380, xlabel: 'W(1)' });
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
      L.legend(ctx.host, [{ c: 'c2', label: T('chords of the partition; total variation Σ|ΔB|', '分割の弦・全変動 Σ|ΔB|') }].concat(m <= 7 ? [{ kind: 'dot', c: 'c2', label: T('partition points tₖ', '分割点 tₖ') }] : []).concat([{ c: 'c3', label: T('quadratic variation Σ(ΔB)²', '二次変分 Σ(ΔB)²') }, { c: 'muted', dash: true, label: T('Σ(Δf)² for f = ½ sin 2πt', 'f = ½ sin 2πt の Σ(Δf)²') }]));
      ctx.readout([{ k: 'Σ|ΔB|', v: fmt(w.tv, 3) }, { k: 'Σ(ΔB)²', v: fmt(w.qv, 4), tone: 'key' }, { k: T('Itô sum Σ B ΔB', '伊藤和 Σ B ΔB'), v: fmt(w.ito, 4) }, { k: '(B₁² − 1)/2', v: fmt((B1 * B1 - 1) / 2, 4) }, { k: T('Stratonovich sum', 'ストラトノヴィッチ和'), v: fmt(w.strat, 4) }, { k: 'B₁²/2', v: fmt(B1 * B1 / 2, 4) }],
        T('The two stochastic integrals differ by exactly half the quadratic variation, which is why their limits differ by t/2.', '二つの確率積分の差はちょうど二次変分の半分で、そのため極限は t/2 だけ違います。'));
    },
  };

  /* ---------- 3. Fokker-Planck: the density p(x, t) as a surface over (t, x) ---------- */
  const FP = { tMax: 4, xMax: 3.6, dt: 0.02, N: 600, shown: 30 };
  // world coordinates: x runs along X, time comes toward the viewer along -Y (t = 0 at the back), density up Z
  const WX = (x) => x * 2 / 3, WY = (t) => 2.4 - 1.2 * t;
  D['fokker-planck'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state, { tMax, xMax, dt } = FP;
      const key = `${v.theta}|${v.sigma}|${v.x0}`;
      if (st.key !== key) { st.paths = ouPaths(v.x0, v.theta, v.sigma, tMax, dt, FP.N, 11); st.key = key; st.dirty = true; }
      const mean = (t) => ouMean(v.x0, v.theta, t), vari = (t) => Math.max(ouVar(v.sigma, v.theta, t), 1e-6);
      const dens = (x, t) => normPdf(x, mean(t), vari(t));
      // height scale: the peak density at t = 0.6 maps to 1.3 units; the spike near t = 0 is clipped at 1.3 times that
      const pRef = 1 / Math.sqrt(2 * Math.PI * vari(0.6)), zs = 1.3 / pRef, pCap = 1.3 * pRef;
      const Z = (p) => zs * Math.min(p, pCap);
      st.Z = Z;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, '');
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Histogram of all 600 paths at the slice, against the exact solution', '断面での 600 本すべてのヒストグラムと厳密解'));
        st.g2 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
        st.anim = null;
      }
      st.cap1.textContent = st.flat
        ? T('Exact density (shading) with 30 of the 600 simulated paths. Drag the gold line to move the time slice.', '厳密な密度（濃淡）と、600 本のシミュレーション経路のうち 30 本。金色の線をドラッグすると時刻の断面を動かせます。')
        : T('The exact density p(x, t) as a surface over the (t, x) floor, with 30 of the 600 simulated paths draped over it. Drag the gold handle to move the time slice; drag elsewhere to turn the view. Heights near t = 0, where the density starts as a spike at x₀, are clipped.', '厳密な密度 p(x, t) を (t, x) の床の上の曲面として描き、600 本のシミュレーション経路のうち 30 本を曲面の上に重ねています。金色のハンドルで時刻の断面を動かし、それ以外の場所をドラッグすると視点が回ります。x₀ の尖った山から始まる t = 0 付近の高さは切り詰めています。');

      // the 2D panel: histogram of the paths at the slice against the exact density
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [-xMax, xMax], y: [0, 1.2], aspect: 0.7, maxH: 380, xlabel: 'x' });
      let flatFig = null;
      const drawSlice = (t) => {
        t = Math.min(tMax, Math.max(0.05, t));
        g.clear('main'); g.clear('under'); g.clear('over');
        const k = Math.round(t / dt), xs = st.paths.map((p) => p[k]);
        const bw = 0.2, counts = new Map(); xs.forEach((x) => { const b = Math.floor((x + xMax) / bw); counts.set(b, (counts.get(b) || 0) + 1); });
        const m = mean(t), vv = vari(t), peak = normPdf(m, m, vv), ymax = Math.max(1.2, peak * 1.1), sy = 1.2 / ymax;
        counts.forEach((c, b) => g.rect(-xMax + b * bw, 0, bw, c / (FP.N * bw) * sy, { c: 'c1', fo: 0.45, w: 0.6 }));
        g.line(L.sample(-xMax, xMax, 300, (x) => normPdf(x, m, vv) * sy), { c: 'c2', w: 2.4 });
        const sm = xs.reduce((s, x) => s + x, 0) / xs.length, sv = xs.reduce((s, x) => s + (x - sm) ** 2, 0) / (xs.length - 1);
        ctx.readout([{ k: 't', v: fmt(t, 2) }, { k: T('mean: paths / exact', '平均：経路 / 厳密'), v: `${fmt(sm, 3)} / ${fmt(m, 3)}`, tone: 'key' }, { k: T('variance: paths / exact', '分散：経路 / 厳密'), v: `${fmt(sv, 3)} / ${fmt(vv, 3)}`, tone: 'key' }, { k: T('long-run variance σ²/2θ', '長時間後の分散 σ²/2θ'), v: v.theta > 0 ? fmt(v.sigma * v.sigma / (2 * v.theta), 3) : '∞' }].concat(sy < 0.999 ? [{ k: T('histogram scale', 'ヒストグラムの縮尺'), v: `×${fmt(sy, 2)}` }] : []),
          v.theta === 0 ? T('With no pull back to zero the spread grows like σ√t forever: pure diffusion.', '0 への引き戻しがなければ広がりは σ√t のように増え続けます。純粋な拡散です。') : T('The spread saturates: noise injects variance at rate σ², the drift removes it at rate 2θ times the variance.', '広がりは飽和します。ノイズは分散を速さ σ² で注ぎ、ドリフトは分散の 2θ 倍の速さで取り除きます。'));
        if (flatFig) { flatFig.clear('over'); flatFig.seg([t, -xMax], [t, xMax], { c: 'hl', w: 2.4, layer: 'over' }); }
        st.slice3d?.(t);
        st.tNow = t;
      };
      st.drawSlice = drawSlice;
      const flat2d = () => {
        st.v3.replaceChildren();
        const f = flatFig = L.fig(st.v3, { x: [0, tMax], y: [-xMax, xMax], aspect: 0.7, maxH: 380, xlabel: 't', ylabel: 'x', grid: false });
        f.raster((t, x) => { const vv = Math.max(ouVar(v.sigma, v.theta, t), 0.004); const p = normPdf(x, mean(t), vv) * Math.sqrt(2 * Math.PI * vv); return Math.pow(p, 0.8) * 0.85; }, { cmap: 'warm', res: 3 });
        st.paths.slice(0, FP.shown).forEach((p) => f.line(L.seq(p.length, (i) => [i * dt, p[i]]), { c: 'ink', w: 0.9, op: 0.55 }));
        f.line(L.sample(0, tMax, 200, mean), { c: 'ink', w: 1.6, dash: '5 4' });
        for (const s of [1, -1]) f.line(L.sample(0, tMax, 200, (t) => mean(t) + s * 2 * Math.sqrt(vari(t))), { c: 'c4', w: 1.4, dash: '3 3' });
        f.handle(v.t, 3.2, { c: 'hl', r: 8, axis: 'x', label: T('Time slice', '時刻の断面'), bounds: [0.05, tMax, 3.2, 3.2], onDrag: (x) => { ctx.set('t', x, true); drawSlice(Math.round(x * 20) / 20); } });
      };

      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 470, camera: [2.6, -8.6, 5.4], target: [0, 0, 0.3], fov: 32,
        init(S) {
          st.flat = false; st.dirty = true;
          const W = (t, x, z = 0) => [WX(x), WY(t), z];
          st.surf = S.surface((t, x) => W(t, x), { u: [0.02, tMax], v: [-xMax, xMax], nu: 110, nv: 170, rough: 0.6, coat: 0.25, colour: () => S.cmap.warm(0) });
          // floor: frame, ticks and labels
          const xa = WX(-xMax), xb = WX(xMax), ya = WY(tMax), yb = WY(0);
          S.lines([[[xa, ya, 0], [xb, ya, 0]], [[xb, ya, 0], [xb, yb, 0]], [[xb, yb, 0], [xa, yb, 0]], [[xa, yb, 0], [xa, ya, 0]], [W(0, 0), W(tMax, 0)]], { c: 'muted', opacity: 0.55 });
          S.lines([1, 2, 3].map((t) => [W(t, xMax), W(t, xMax - 0.18)]).concat([-2, 2].map((x) => [W(tMax, x), W(tMax - 0.1, x)])), { c: 'muted', opacity: 0.7 });
          [0, 1, 2, 3, 4].forEach((t) => S.label(String(t), W(t, xMax + 0.15), { small: true, c: 'muted' }));
          [-2, 0, 2].forEach((x) => S.label(fmt(x, 0), W(tMax + 0.12, x), { small: true, c: 'muted', align: 'middle', dy: 18 }));
          S.label('t', W(tMax + 0.45, xMax + 0.15), { math: true, c: 'muted' });
          S.label('x', W(tMax + 0.12, 3.3), { math: true, c: 'muted', align: 'middle', dy: 18 });
          st.pathLines = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'ink', opacity: S.dark ? 0.24 : 0.28 });
          st.env = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c4', opacity: 1 });
          st.ridge = S.tube([[0, 0, 0], [0.01, 0, 0]], { c: 'ink', r: 0.014 });
          st.cut = S.tube([[0, 0, 0], [0.01, 0, 0]], { c: 'c2', r: 0.028, glow: 0.15 });
          st.floorCut = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'hl', opacity: 0.95 });
          st.pLab = S.label('p(x, t)', [0, 0, 0], { math: true, small: true, align: 'middle' });
          st.tLab = S.label('', [0, 0, 0], { small: true, c: 'hl', align: 'end' });
          const hx = -xMax - 0.25;
          st.h = S.handle(W(v.t, hx), { r: 0.09, plane: [[0, 0, 1], [0, 0, 0]], onDrag: (q) => {
            const t = Math.round(L.clamp((2.4 - q.y) / 1.2, 0.05, tMax) * 20) / 20;
            ctx.set('t', t, true); drawSlice(t);
            return W(t, hx);
          } });
          st.slice3d = (t) => {
            const m = mean(t), vv = vari(t), Zs = st.Z;
            st.cut.update(L.sample(-xMax, xMax, 160, (x) => W(t, x, Zs(normPdf(x, m, vv)) + 0.012)));
            st.floorCut.update([[W(t, hx, 0.004), W(t, xMax, 0.004)]]);
            st.h.at(W(t, hx));
            st.tLab.set(W(t, hx - 0.15, 0.05), `t = ${fmt(t, 2)}`);
            S.invalidate();
          };
          st.W = W;
        },
        update(S) {
          if (st.dirty) {
            st.dirty = false;
            const Zs = st.Z, top = Zs(pCap), W = st.W, base = S.cols.plate.clone().lerp(S.cols.muted, S.dark ? 0.35 : 0.22);
            st.surf.update((t, x) => W(t, x, Zs(dens(x, t))), (t, x, p) => { const u = Math.min(1, p[2] / top), w = Math.min(1, 4 * u); return base.clone().lerp(S.cmap.seq(0.08 + 0.92 * u), w * w * (3 - 2 * w)).multiplyScalar(S.dark ? 0.78 : 1); });
            const segs = [];
            // paths are draped on the surface: each point sits at its (t, x) with the surface height above it
            const on = (t, x) => { const xc = L.clamp(x, -xMax, xMax); return W(t, xc, Zs(dens(xc, t)) + 0.03); };
            st.paths.slice(0, FP.shown).forEach((p) => { for (let i = Math.round(0.3 / dt); i + 1 < p.length; i++) segs.push([on(i * dt, p[i]), on((i + 1) * dt, p[i + 1])]); });
            st.pathLines.update(segs);
            const env = [];
            for (const s of [1, -1]) { const pts = L.sample(0.04, tMax, 120, (t) => on(t, mean(t) + s * 2 * Math.sqrt(vari(t)))); for (let i = 0; i + 1 < pts.length; i += 2) env.push([pts[i], pts[i + 1]]); }
            st.env.update(env);
            st.ridge.update(L.sample(0.02, tMax, 160, (t) => W(t, L.clamp(mean(t), -xMax, xMax), Zs(dens(mean(t), t)) + 0.01)));
            const tl = 0.3, ml = L.clamp(mean(tl), -xMax, xMax);
            st.pLab.set(W(tl, ml, Zs(dens(ml, tl)) + 0.12));
          }
          drawSlice(v.t);
        },
        fallback() { st.flat = true; st.slice3d = null; st.cap1.textContent = T('Exact density (shading) with 30 of the 600 simulated paths. Drag the gold line to move the time slice.', '厳密な密度（濃淡）と、600 本のシミュレーション経路のうち 30 本。金色の線をドラッグすると時刻の断面を動かせます。'); flat2d(); drawSlice(v.t); },
      });
      if (!st.__v3 && !st.flat) drawSlice(v.t);
      if (!st.anim) {
        st.anim = L.animator(st.bar, (d, t) => { if (d === 0 && t === 0) return; const tt = Math.min(tMax, 0.05 + t * 0.8); ctx.set('t', Math.round(tt * 20) / 20, true); st.drawSlice(tt); if (tt >= tMax) return false; }, { autoplay: false, once: true, playLabel: T('Sweep the slice', '断面を動かす') });
      }
      const legend = (flat) => { st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'ink', label: flat ? T('sample paths', '標本経路') : T('sample paths, draped over the surface', '標本経路（曲面に重ねて表示）') }, { c: 'ink', dash: flat, label: flat ? T('exact mean x₀·exp(−θt)', '厳密な平均 x₀·exp(−θt)') : T('exact mean x₀·exp(−θt), along the ridge', '厳密な平均 x₀·exp(−θt)（尾根に沿う線）') }, { c: 'c4', dash: true, label: T('mean ± 2 standard deviations', '平均 ± 2 標準偏差') }, { c: 'c2', label: T('exact density at the slice', '断面での厳密な密度') }].concat(flat ? [] : [{ c: 'hl', label: T('time slice', '時刻の断面') }])); };
      legend(!!st.flat);
    },
  };
})();
