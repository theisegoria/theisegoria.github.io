'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const frac = (x) => x - Math.floor(x);

  /* ---------- model (pure, checked by checks/ergodic-theory.cjs) ---------- */
  // seeded generator so every figure is reproducible
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 1. rotation of the circle by alpha: x_n = x_0 + n alpha mod 1
  const ALPHAS = [(Math.sqrt(5) - 1) / 2, Math.SQRT2 - 1, Math.PI - 3, Math.E - 2, 3 / 8];
  const rotOrbit = (alpha, n, x0 = 0) => L_seq(n, (i) => frac(x0 + i * alpha));
  function L_seq(n, f) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = f(i); return a; }
  // the gaps between neighbouring points on the circle, in circular order
  function gapsOf(pts) { const s = pts.slice().sort((a, b) => a - b), g = []; for (let i = 0; i < s.length; i++) g.push(i + 1 < s.length ? s[i + 1] - s[i] : 1 - s[i] + s[0]); return { sorted: s, gaps: g }; }
  function distinctGaps(gaps, tol = 1e-9) { const d = []; gaps.slice().sort((a, b) => a - b).forEach((x) => { if (!d.length || x - d[d.length - 1] > tol) d.push(x); }); return d; }
  // star discrepancy of a point set in [0,1): sup over [0,t) of |#/N - t|
  function starDisc(pts) { const s = pts.slice().sort((a, b) => a - b), n = s.length; let d = 0; for (let i = 0; i < n; i++) d = Math.max(d, (i + 1) / n - s[i], s[i] - i / n); return d; }
  const arcVisits = (pts, a, len) => pts.reduce((k, x) => k + (frac(x - a) < len ? 1 : 0), 0) / pts.length;

  // 2. maps of the torus [0,1)^2 that preserve area
  const MAPS = {
    cat: { f: (x, y) => [frac(2 * x + y), frac(x + y)], inv: (x, y) => [frac(x - y), frac(-x + 2 * y)], lyap: Math.log((3 + Math.sqrt(5)) / 2) },
    baker: { f: (x, y) => { const b = x < 0.5 ? 0 : 1; return [frac(2 * x), (y + b) / 2]; }, inv: (x, y) => { const b = y < 0.5 ? 0 : 1; return [(x + b) / 2, frac(2 * y)]; }, lyap: Math.log(2) },
    rotation: { f: (x, y) => [frac(x + ALPHAS[0]), frac(y + ALPHAS[1])], inv: (x, y) => [frac(x - ALPHAS[0]), frac(y - ALPHAS[1])], lyap: 0 },
  };
  const MAPKEYS = ['cat', 'baker', 'rotation'];
  // the cat map is the square of Fibonacci's matrix, so on an N x N grid its period is half the Pisano period
  function catPeriod(N) { let a = 1, b = 0, c = 0, d = 1; for (let k = 1; k < 100000; k++) { [a, b, c, d] = [(2 * a + c) % N, (2 * b + d) % N, (a + c) % N, (b + d) % N]; if (a === 1 % N && b === 0 && c === 0 && d === 1 % N) return k; } return NaN; }
  function pisano(N) { let a = 0, b = 1; for (let k = 1; k < 200000; k++) { [a, b] = [b, (a + b) % N]; if (a === 0 && b === 1 % N) return k; } return NaN; }
  // fraction of the disc D that lies in the square S after k steps, k = 0..K, from M points spread over D
  function mixCurve(key, dc, dr, S, K, M = 6000, seed = 7) {
    const r = rng(seed), F = MAPS[key].f, pts = [];
    while (pts.length < M) { const x = 2 * r() - 1, y = 2 * r() - 1; if (x * x + y * y <= 1) pts.push([frac(dc[0] + dr * x), frac(dc[1] + dr * y)]); }
    const inS = ([x, y]) => x >= S[0] && x < S[0] + S[2] && y >= S[1] && y < S[1] + S[2];
    const out = [];
    for (let k = 0; k <= K; k++) { out.push(pts.reduce((s, p) => s + (inS(p) ? 1 : 0), 0) / M); for (let i = 0; i < M; i++) pts[i] = F(pts[i][0], pts[i][1]); }
    return out;
  }
  // growth rate of a tangent vector under the cat map's Jacobian (the same matrix at every point)
  function catLyapunov(n = 60) { let u = [1, 0.3], s = 0; for (let k = 0; k < n; k++) { u = [2 * u[0] + u[1], u[0] + u[1]]; const m = Math.hypot(u[0], u[1]); s += Math.log(m); u = [u[0] / m, u[1] / m]; } return s / n; }

  // 3. orbits for Birkhoff averages
  // the doubling map is a shift on binary digits; doing it on the digits avoids the floating-point collapse to 0
  function doublingOrbit(x0, n, seed = 11, W = 40) {
    const r = rng(seed), bits = new Uint8Array(n + W);
    let x = x0; for (let j = 0; j < 30; j++) { x *= 2; bits[j] = x >= 1 ? 1 : 0; x -= bits[j]; }
    for (let j = 30; j < n + W; j++) bits[j] = r() < 0.5 ? 1 : 0;
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) { let v = 0, w = 0.5; for (let j = 0; j < W; j++, w *= 0.5) if (bits[i + j]) v += w; out[i] = v; }
    return out;
  }
  function logisticOrbit(x0, n) { const out = new Float64Array(n); let x = x0; for (let i = 0; i < n; i++) { out[i] = x; x = 4 * x * (1 - x); } return out; }
  // leading digit of b^n through the rotation n log10 b mod 1
  function powerDigits(b, n) { const out = new Uint8Array(n), l = Math.log10(b); for (let i = 0; i < n; i++) out[i] = Math.floor(10 ** frac((i + 1) * l)); return out; }
  const logisticDensity = (x) => 1 / (Math.PI * Math.sqrt(x * (1 - x)));
  const logisticCdf = (x) => (2 / Math.PI) * Math.asin(Math.sqrt(x));
  const benford = (d) => Math.log10(1 + 1 / d);
  function birkhoff(values) { const out = new Float64Array(values.length); let s = 0; for (let i = 0; i < values.length; i++) { s += values[i]; out[i] = s / (i + 1); } return out; }

  (window.LabModels = window.LabModels || {})['ergodic-theory'] = { rng, ALPHAS, rotOrbit, gapsOf, distinctGaps, starDisc, arcVisits, MAPS, catPeriod, pisano, mixCurve, catLyapunov, doublingOrbit, logisticOrbit, powerDigits, logisticDensity, logisticCdf, benford, birkhoff };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt, TAU = 2 * Math.PI;
  const put = (G, e) => (G.appendChild(e), e);
  const empty = (G) => { while (G.firstChild) G.removeChild(G.firstChild); };
  const ANAMES = [['α = (√5 − 1)/2, the golden mean', 'α = (√5 − 1)/2（黄金比）'], ['α = √2 − 1', 'α = √2 − 1'], ['α = π − 3', 'α = π − 3'], ['α = e − 2', 'α = e − 2'], ['α = 3/8, rational', 'α = 3/8（有理数）']];

  /* ---------- 1. rotation of the circle ---------- */
  D['irrational-rotation'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, alpha = ALPHAS[v.al], N = v.n, len = v.len;
      if (st.a0 === undefined) st.a0 = 0.1;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The orbit 0, α, 2α, … on a circle of circumference 1. The gaps between neighbouring points are coloured by length: there are never more than three lengths. The violet band is the arc A; drag the gold handle to move it.', '円周 1 の円の上の軌道 0, α, 2α, … です。隣り合う点の間のすきまを長さで色分けしています。長さは決して三種類を超えません。紫の帯が弧 A で、金色のハンドルをドラッグして動かせます。'));
      const f = L.fig(c1, { x: [-1.36, 1.36], y: [-1.36, 1.36], equal: true, axes: false, grid: false, maxH: 400 });
      const P = (t, r = 1) => [r * Math.cos(TAU * t), r * Math.sin(TAU * t)];
      const arcPts = (a, b, r) => L.sample(a, b, Math.max(2, Math.ceil((b - a) * 160)), (t) => P(t, r));
      f.circle(0, 0, 1, { c: 'muted', w: 1, op: 0.5, layer: 'under' });
      f.line(arcPts(st.a0, st.a0 + len, 1.17), { c: 'c4', w: 7, op: 0.55, layer: 'under' });
      f.text(...P(st.a0 + len / 2, 1.3), 'A', { c: 'c4', math: true });
      f.text(0, 0.1, ANAMES[v.al][0].split(',')[0], { c: 'ink', math: true });
      const G = f.group('main');
      f.handle(...P(st.a0, 1.17), { c: 'hl', r: 7, label: T('Start of the arc A', '弧 A の始点'), bounds: [-1.36, 1.36, -1.36, 1.36], onDrag: (x, y) => { st.a0 = frac(Math.atan2(y, x) / TAU); ctx.redraw(); } });

      L.h('p', 'lab-cap', c2, T('Star discrepancy D*ₙ of the first n points, the worst error of "fraction of points in [0, t)" against t, on log scales. For an irrational α it falls roughly like (log n)/n; for a rational one it stops falling.', '最初の n 点のスター・ディスクレパンシー D*ₙ を両対数で示します。「[0, t) に入る点の割合」と t の差の最悪値です。無理数の α ではおよそ (log n)/n のように減り、有理数では減るのが止まります。'));
      const NM = 2000, all = rotOrbit(alpha, NM), ns = [], seen = new Set();
      for (let i = 0; i <= 90; i++) { const n = Math.round(10 ** ((i / 90) * Math.log10(NM))); if (!seen.has(n)) { seen.add(n); ns.push(n); } }
      const ds = ns.map((n) => [Math.log10(n), Math.log10(starDisc(all.slice(0, n)))]);
      const g = L.fig(c2, { x: [0, Math.log10(NM)], y: [-3.6, 0], aspect: 0.72, maxH: 330, xlabel: T('points n', '点の数 n'), ylabel: 'D*ₙ', ticksX: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], ticksY: [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1']] });
      g.line(L.sample(0, Math.log10(NM), 80, (x) => x - 0.0001 > 0 ? Math.log10(Math.log(10 ** x) / 10 ** x) : NaN), { c: 'muted', w: 1.4, dash: '6 4' });
      g.line(L.sample(0, Math.log10(NM), 20, (x) => -x), { c: 'muted', w: 1, dash: '2 4' });
      g.text(2.45, -2.45 + 0.05, '1/n', { small: true, c: 'muted', anchor: 'end' });
      g.text(3.25, Math.log10(Math.log(1778) / 1778) + 0.12, '(log n)/n', { small: true, c: 'muted', anchor: 'end' });
      g.line(ds, { c: 'c1', w: 2.4 });
      const cur = g.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T('shortest gap', '最短のすきま') }, { c: 'c3', label: T('middle gap', '中間のすきま') }, { c: 'c2', label: T('longest gap (sum of the other two)', '最長のすきま（他の二つの和）') }, { c: 'c4', kind: 'fill', label: T('arc A', '弧 A') }, { c: 'hl', label: T('newest point', '最新の点') }]);

      const draw = (n) => {
        empty(G); empty(cur);
        const pts = all.slice(0, n), { sorted, gaps } = gapsOf(pts), dist = distinctGaps(gaps, 1e-9);
        const tone = (gp) => { if (dist.length < 2) return 'c1'; const i = dist.findIndex((d) => Math.abs(d - gp) <= 1e-9); return dist.length === 2 ? ['c1', 'c2'][i] : ['c1', 'c3', 'c2'][i]; };
        if (n > 1) sorted.forEach((s, i) => put(G, f.line(arcPts(s, s + gaps[i], 1), { c: tone(gaps[i]), w: 4.5 })));
        sorted.forEach((s) => put(G, f.dot(...P(s), { c: 'ink', r: n > 200 ? 1.6 : 2.6, layer: 'main' })));
        const last = all[n - 1]; put(G, f.dot(...P(last), { c: 'hl', r: 5.5, layer: 'main' }));
        if (n <= 12) for (let i = 0; i < n; i++) put(G, f.text(...P(all[i], 0.86), String(i), { small: true, c: 'muted', layer: 'main' }));
        const ln = Math.log10(n); put(cur, g.vline(ln, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); put(cur, g.dot(ln, Math.log10(starDisc(pts)), { c: 'hl', r: 5 }));
        const fA = arcVisits(pts, st.a0, len);
        ctx.readout([
          { k: 'α', v: fmt(alpha, 6), tone: 'key' },
          { k: 'n', v: String(n) },
          { k: T('gap lengths', 'すきまの長さ'), v: dist.map((d) => fmt(d, 4)).join(', ') },
          { k: T('fraction of points in A', 'A に入る点の割合'), v: fmt(fA, 4), tone: Math.abs(fA - len) < 0.02 ? 'good' : 'warn' },
          { k: T('length of A', 'A の長さ'), v: fmt(len, 3) },
          { k: 'D*ₙ', v: fmt(starDisc(pts), 4) },
        ], v.al === 4
          ? T('For a rational α = 3/8 the orbit closes after 8 steps and visits only 8 points, so the fraction in A depends on where A sits and never settles to its length. The rotation preserves length but is not ergodic: the 8 points form an invariant set.', '有理数 α = 3/8 では軌道は 8 歩で閉じて 8 点しか訪れないので、A に入る割合は A の位置しだいで、その長さには落ち着きません。回転は長さを保ちますがエルゴード的ではありません。8 点が不変集合をなすからです。')
          : T(`For irrational α no point repeats, and every arc gets its fair share: the fraction of points in A tends to the length of A, wherever A is (Weyl). At every n the points cut the circle into gaps of at most three lengths, ${dist.length} here, and when there are three the longest is the sum of the other two (the three-gap theorem).`, `無理数の α ではどの点も繰り返さず、どの弧も公平な分け前を得ます。A に入る点の割合は、A がどこにあっても A の長さに近づきます（ワイル）。どの n でも点は円を高々三種類の長さのすきまに分け、ここでは ${dist.length} 種類です。三種類のときは最長のものが他の二つの和になります（三間隙定理）。`));
      };
      st.anim = L.animator(ctx.host, (dt, t, lb) => { const n = Math.max(1, Math.min(N, 1 + Math.floor(t * 6))); draw(n); lb.textContent = `n = ${n}`; return n < N; }, { autoplay: false, once: true, initialT: N / 6 + 1, playLabel: T('Play: add the points one by one', '再生：点を一つずつ加える') });
    },
  };

  /* ---------- 2. mixing on the torus ---------- */
  const MNAMES = [['Arnold’s cat map', 'アーノルドの猫写像'], ['baker’s map', 'パン屋の写像'], ['rotation of the torus', 'トーラスの回転']];
  const S = [0.62, 0.12, 0.3];
  D['mixing-maps'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, key = MAPKEYS[v.map], M = MAPS[key], K = v.k, KMAX = 20, dr = 0.17;
      if (!st.dc) st.dc = [0.3, 0.55];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The unit square with opposite edges glued (a torus), painted with a gold disc D on a two-tone background, after k applications of the map. Each pixel is coloured by where it came from. Drag the gold handle to move D; the dashed square is the test set S.', '向かい合う辺をはり合わせた単位正方形（トーラス）を、二色の背景の上の金色の円板 D で塗り、写像を k 回施したものです。各画素はそれがどこから来たかで色を付けています。金色のハンドルで D を動かせます。破線の正方形が検査用の集合 S です。'));
      const f = L.fig(c1, { x: [0, 1], y: [0, 1], equal: true, maxH: 400, xlabel: 'x', ylabel: 'y', ticksX: [[0, '0'], [0.5, '½'], [1, '1']], ticksY: [[0, '0'], [0.5, '½'], [1, '1']] });
      const col = L.colours(), mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const bgL = mix(col.plate, col.c1, 0.32), bgR = mix(col.plate, col.c3, 0.32), gold = mix(col.plate, col.hl, 0.95);
      const inD = (x, y) => { let dx = Math.abs(x - st.dc[0]), dy = Math.abs(y - st.dc[1]); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); return dx * dx + dy * dy <= dr * dr; };
      const paint = (k) => f.raster((x, y) => { let p = [x, y]; for (let i = 0; i < k; i++) p = M.inv(p[0], p[1]); return inD(p[0], p[1]) ? gold : p[0] < 0.5 ? bgL : bgR; }, { res: f.small ? 2 : 2.5 });
      f.rect(S[0], S[1], S[2], S[2], { c: 'ink', w: 1.6, dash: '5 4', fill: false, layer: 'over' }); f.text(S[0] + S[2] / 2, S[1] + S[2], 'S', { c: 'ink', math: true, dy: -6 });
      f.circle(st.dc[0], st.dc[1], dr, { c: 'ink', w: 1.2, dash: '3 4', op: 0.7, layer: 'over' }); f.text(st.dc[0] - dr * 0.75, st.dc[1] + dr * 0.75, 'D', { c: 'ink', math: true, anchor: 'end' });
      f.handle(st.dc[0], st.dc[1], { c: 'hl', r: 7, label: T('Centre of the disc D', '円板 D の中心'), bounds: [0, 1, 0, 1], onDrag: (x, y) => { st.dc = [x, y]; delete st.curve; ctx.redraw(); } });

      L.h('p', 'lab-cap', c2, T('Fraction of the disc D that lies in S after k steps (blue), against the area of S (dashed). Mixing means this fraction tends to area(S), for every D and S: the disc forgets where it started. The grey band is the sampling noise of 6000 points.', 'k 歩後に S に入っている円板 D の割合（青）と、S の面積（破線）です。混合とは、どんな D と S についてもこの割合が S の面積に近づくことで、円板は出発点を忘れます。灰色の帯は 6000 点で数えることによる標本のゆらぎです。'));
      if (!st.curve || st.curveKey !== key) { st.curve = mixCurve(key, st.dc, dr, S, KMAX); st.curveKey = key; }
      const cv = st.curve, mS = S[2] * S[2], band = 2 * Math.sqrt((mS * (1 - mS)) / 6000);
      const g = L.fig(c2, { x: [0, KMAX], y: [0, Math.max(0.2, Math.max(...cv) * 1.15)], aspect: 0.7, maxH: 320, xlabel: T('steps k', '歩数 k'), ylabel: T('fraction of D in S', 'S に入る D の割合') });
      g.rect(0, mS - band, KMAX, 2 * band, { c: 'muted', fill: 'muted', fo: 0.18, nostroke: true, layer: 'under' });
      g.hline(mS, { c: 'c2', w: 1.6, dash: '6 4' }); g.text(KMAX, mS, T(`area(S) = ${fmt(mS, 2)}`, `S の面積 = ${fmt(mS, 2)}`), { small: true, c: 'c2', anchor: 'end', dy: -7 });
      g.line(cv.map((y, k) => [k, y]), { c: 'c1', w: 2.4 }); cv.forEach((y, k) => g.dot(k, y, { c: 'c1', r: 2.6, layer: 'main' }));
      const cur = g.group('over');
      L.legend(ctx.host, [{ c: 'hl', kind: 'fill', label: T('image of D', 'D の像') }, { c: 'c1', label: T('fraction of D in S', 'S に入る D の割合') }, { c: 'c2', dash: true, label: T('area of S', 'S の面積') }]);
      const per = key === 'cat' ? catPeriod(101) : NaN;
      let shown = -1;
      const draw = (k) => {
        if (k !== shown) { paint(k); shown = k; }
        empty(cur); put(cur, g.vline(k, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); put(cur, g.dot(k, cv[k], { c: 'hl', r: 5.5 }));
        ctx.readout([
          { k: T('map', '写像'), v: T(...MNAMES[v.map]), tone: 'key' },
          { k: 'k', v: String(k) },
          { k: T('fraction of D in S', 'S に入る D の割合'), v: fmt(cv[k], 3) },
          { k: T('area of S', 'S の面積'), v: fmt(mS, 3) },
          { k: T('Lyapunov exponent', 'リャプノフ指数'), v: key === 'rotation' ? '0' : `${fmt(M.lyap, 4)} (${key === 'cat' ? 'log φ²' : 'log 2'})`, tone: key === 'rotation' ? 'warn' : 'good' },
          ...(key === 'cat' ? [{ k: T('period on a 101 × 101 grid', '101 × 101 格子での周期'), v: String(per) }] : []),
        ], [
          T(`The cat map (x, y) ↦ (2x + y, x + y) mod 1 stretches by φ² ≈ 2.618 along one direction and shrinks by the same factor along another, so D is drawn into filaments thinner than a pixel within a few steps, folded round the torus, and spread evenly: the fraction in S settles at the area of S. On a finite pixel grid the map is a permutation and every picture comes back, here after ${per} steps, but that recurrence is a property of the grid, not of the area-preserving map on the torus.`, `猫写像 (x, y) ↦ (2x + y, x + y) mod 1 は、ある方向に φ² ≈ 2.618 倍に引き伸ばし、別の方向に同じ比で縮めます。そのため D は数歩で画素より細い糸に引き延ばされ、トーラスに巻きつけられ、一様に広がります。S に入る割合は S の面積に落ち着きます。有限の画素格子の上では写像は置換なので、どの絵もいつかは戻り、ここでは ${per} 歩で戻ります。しかしこの回帰は格子の性質で、トーラス上の面積を保つ写像の性質ではありません。`),
          T('The baker’s map stretches the square to double width, cuts it in half and stacks the halves, like kneading dough. Horizontal distances double each step, a Lyapunov exponent of log 2, and the disc is layered into ever finer horizontal sheets that fill the square evenly.', 'パン屋の写像は正方形を横に二倍に伸ばし、半分に切って重ねます。生地をこねるのと同じです。横の距離は一歩ごとに二倍になり（リャプノフ指数 log 2）、円板はどんどん薄い横向きの層に重ねられて、正方形を一様に満たします。'),
          T('An irrational rotation of the torus is ergodic, so a single point’s orbit visits every region in proportion to its area, but it is not mixing: the disc moves rigidly and never spreads, so the fraction of D in S jumps between 0 and larger values forever and never settles at the area of S.', 'トーラスの無理数回転はエルゴード的なので、一つの点の軌道はどの領域もその面積に比例して訪れます。しかし混合的ではありません。円板は形を変えずに動くだけで広がらないので、S に入る D の割合は 0 と大きな値の間を永遠に行き来し、S の面積には落ち着きません。'),
        ][v.map]);
      };
      const rate = 1.6;
      st.anim = L.animator(ctx.host, (dt, t, lb) => { const k = Math.min(K, Math.floor(t * rate)); draw(k); lb.textContent = `k = ${k}`; return k < K; }, { autoplay: false, once: true, initialT: (K + 0.5) / rate, playLabel: T('Play: apply the map step by step', '再生：写像を一歩ずつ施す') });
    },
  };

  /* ---------- 3. Birkhoff averages ---------- */
  const SYS = [['doubling map x ↦ 2x mod 1', '倍写像 x ↦ 2x mod 1'], ['logistic map x ↦ 4x(1 − x)', 'ロジスティック写像 x ↦ 4x(1 − x)'], ['leading digits of 2ⁿ, 3ⁿ, 7ⁿ', '2ⁿ, 3ⁿ, 7ⁿ の最上位の数字']];
  D['birkhoff-averages'] = {
    render(ctx, v) {
      const st = ctx.state, mode = v.sys, N = Math.round(10 ** v.lgN);
      if (st.x0 === undefined) st.x0 = 0.2718;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const target = [1 / 3, 3 / 8, Math.log10(2)][mode];
      let orbits, obs;
      if (mode < 2) {
        const starts = [st.x0, 0.6180339, 0.1234567, 0.8765432];
        orbits = starts.map((x, i) => (mode === 0 ? doublingOrbit(x, N, 11 + i) : logisticOrbit(x, N)));
        obs = orbits.map((o) => o.map((x) => x * x));
      } else {
        orbits = [2, 3, 7].map((b) => powerDigits(b, N));
        obs = orbits.map((o) => Array.from(o, (d) => (d === 1 ? 1 : 0)));
      }
      if (mode < 2) {
        L.h('p', 'lab-cap', c1, T(`Where the orbit of x₀ spends its time: a histogram of its first ${N.toLocaleString()} points (blue bars) against the invariant density (orange). Drag the gold handle to choose x₀.`, `x₀ の軌道がどこで時間を過ごすかを示します。最初の ${N.toLocaleString()} 点のヒストグラム（青い棒）と不変密度（オレンジ）です。金色のハンドルで x₀ を選べます。`));
        const B = 40, h = new Array(B).fill(0); orbits[0].forEach((x) => { h[Math.min(B - 1, Math.floor(x * B))]++; });
        const ymax = mode === 0 ? 1.8 : 4.2;
        const f = L.fig(c1, { x: [0, 1], y: [0, ymax], aspect: 0.72, maxH: 330, xlabel: 'x', ylabel: T('density', '密度') });
        h.forEach((c, i) => { const dd = (c / N) * B; f.rect(i / B, 0, 1 / B, Math.min(dd, ymax), { c: 'c1', fill: 'c1', fo: 0.35, w: 0.6 }); });
        if (mode === 0) f.line([[0, 1], [1, 1]], { c: 'c2', w: 2.6 });
        else f.line(L.sample(0.004, 0.996, 300, logisticDensity), { c: 'c2', w: 2.6 });
        f.handle(st.x0, 0, { c: 'hl', r: 7, axis: 'x', label: T('Starting point x₀', '出発点 x₀'), bounds: [0.001, 0.999, 0, 0], onDrag: (x) => { st.x0 = x; ctx.redraw(); } });
        f.text(st.x0, 0, 'x₀', { c: 'hl', math: true, dy: -14 });
      } else {
        L.h('p', 'lab-cap', c1, T(`Leading digits of 2ⁿ for n = 1 … ${N.toLocaleString()} (blue bars) against Benford’s law log₁₀(1 + 1/d) (orange). The leading digit of 2ⁿ is read off n log₁₀ 2 mod 1, an irrational rotation of the circle.`, `n = 1 … ${N.toLocaleString()} の 2ⁿ の最上位の数字（青い棒）とベンフォードの法則 log₁₀(1 + 1/d)（オレンジ）です。2ⁿ の最上位の数字は n log₁₀ 2 mod 1 から読み取れ、これは円の無理数回転です。`));
        const cnt = new Array(10).fill(0); orbits[0].forEach((d) => cnt[d]++);
        const f = L.fig(c1, { x: [0.4, 9.6], y: [0, 0.34], aspect: 0.72, maxH: 330, xlabel: T('leading digit d', '最上位の数字 d'), ylabel: T('frequency', '頻度'), ticksX: L.seq(9, (i) => [i + 1, String(i + 1)]) });
        for (let d = 1; d <= 9; d++) f.rect(d - 0.36, 0, 0.72, cnt[d] / N, { c: 'c1', fill: 'c1', fo: 0.35, w: 0.6 });
        f.line(L.sample(1, 9, 8, (d) => benford(d)), { c: 'c2', w: 2.2 }); for (let d = 1; d <= 9; d++) f.dot(d, benford(d), { c: 'c2', r: 4 });
      }
      L.h('p', 'lab-cap', c2, mode < 2
        ? T('Running time averages (1/n) Σ x_k² along four orbits (gold handle’s orbit in blue), against the space average ∫ x² dμ (dashed). Birkhoff’s theorem: for almost every x₀ they agree in the limit.', '四つの軌道に沿った時間平均 (1/n) Σ x_k² の推移（金色のハンドルの軌道は青）と、空間平均 ∫ x² dμ（破線）です。バーコフの定理によれば、ほとんどすべての x₀ について極限で一致します。')
        : T('Running fraction of n ≤ N for which bⁿ starts with a 1, for b = 2 (blue), 3 (teal) and 7 (violet), against log₁₀ 2 (dashed).', 'n ≤ N のうち bⁿ が 1 で始まるものの割合の推移です。b = 2（青）、3（青緑）、7（紫）で、破線は log₁₀ 2 です。'));
      const lg = Math.log10(N), avgs = obs.map(birkhoff);
      const g = L.fig(c2, { x: [0, lg], y: [target - 0.2, target + 0.2], aspect: 0.72, maxH: 330, xlabel: T('steps n', '歩数 n'), ylabel: T('time average', '時間平均'), ticksX: L.seq(Math.floor(lg) + 1, (i) => [i, i === 0 ? '1' : `10${'⁰¹²³⁴⁵'[i]}`]) });
      g.line(L.sample(0, lg, 120, (x) => target + 1 / Math.sqrt(10 ** x) * 0.25), { c: 'muted', w: 1, dash: '2 4' });
      g.line(L.sample(0, lg, 120, (x) => target - 1 / Math.sqrt(10 ** x) * 0.25), { c: 'muted', w: 1, dash: '2 4' });
      g.hline(target, { c: 'c2', w: 1.6, dash: '6 4' });
      const cols = mode < 2 ? ['c1', 'c3', 'c4', 'muted'] : ['c1', 'c3', 'c4'];
      avgs.slice().reverse().forEach((a, ri) => { const i = avgs.length - 1 - ri, pts = []; for (let j = 0; j <= 300; j++) { const n = Math.max(1, Math.round(10 ** ((j / 300) * lg))); pts.push([Math.log10(n), a[n - 1]]); } g.line(pts, { c: cols[i], w: i === 0 ? 2.6 : 1.5, op: i === 0 ? 1 : 0.85 }); });
      g.dot(lg, avgs[0][N - 1], { c: 'hl', r: 5.5 });
      L.legend(ctx.host, mode < 2
        ? [{ c: 'c1', kind: 'fill', label: T('orbit histogram', '軌道のヒストグラム') }, { c: 'c2', label: mode === 0 ? T('invariant density 1', '不変密度 1') : T('invariant density 1/(π√(x(1 − x)))', '不変密度 1/(π√(x(1 − x)))') }, { c: 'c1', label: T('time average from x₀', 'x₀ からの時間平均') }, { c: 'muted', dash: true, label: T('envelope ∝ 1/√n', '1/√n に比例する包絡線') }]
        : [{ c: 'c1', label: '2ⁿ' }, { c: 'c3', label: '3ⁿ' }, { c: 'c4', label: '7ⁿ' }, { c: 'c2', label: T('Benford, log₁₀(1 + 1/d)', 'ベンフォード、log₁₀(1 + 1/d)') }]);
      const a0 = avgs[0][N - 1];
      ctx.readout([
        { k: T('system', '系'), v: T(...SYS[mode]), tone: 'key' },
        { k: 'N', v: N.toLocaleString() },
        { k: mode < 2 ? T('time average from x₀', 'x₀ からの時間平均') : T('fraction of 2ⁿ starting with 1', '1 で始まる 2ⁿ の割合'), v: fmt(a0, 5) },
        { k: T('space average', '空間平均'), v: `${fmt(target, 5)} (${['1/3', '3/8', 'log₁₀ 2'][mode]})` },
        { k: T('error × √N', '誤差 × √N'), v: fmt(Math.abs(a0 - target) * Math.sqrt(N), 2), tone: Math.abs(a0 - target) < 3 / Math.sqrt(N) ? 'good' : 'warn' },
      ], [
        T('The doubling map shifts the binary digits of x one place left, so for almost every x₀ the digits behave like fair coin tosses and the orbit is spread evenly over [0, 1): the time average of x² tends to ∫ x² dx = 1/3. Exceptions exist but have measure zero, such as every rational x₀, whose orbit is eventually periodic.', '倍写像は x の二進数の桁を一つ左にずらすので、ほとんどすべての x₀ について桁は公平な硬貨投げのようにふるまい、軌道は [0, 1) に一様に広がります。x² の時間平均は ∫ x² dx = 1/3 に近づきます。例外はありますが測度は 0 で、たとえば有理数の x₀ はどれも軌道がいずれ周期的になります。'),
        T('The logistic map at r = 4 is chaotic but not uniform: orbits linger near 0 and 1, where the map is flat, with the arcsine density 1/(π√(x(1 − x))). Time averages along almost every orbit equal averages against that density, here ∫ x² dμ = 3/8, even though each orbit is unpredictable.', 'r = 4 のロジスティック写像はカオス的ですが一様ではありません。写像が平らになる 0 と 1 の近くに軌道は長く留まり、その分布は逆正弦密度 1/(π√(x(1 − x))) です。ほとんどすべての軌道に沿った時間平均はこの密度に対する平均に一致し、ここでは ∫ x² dμ = 3/8 です。個々の軌道は予測できないにもかかわらずです。'),
        T('2ⁿ starts with the digit d exactly when n log₁₀ 2 mod 1 lies in [log₁₀ d, log₁₀(d + 1)). Since log₁₀ 2 is irrational, that rotation is uniformly distributed, so the frequency of d is the length log₁₀(1 + 1/d) of that interval: 30.1% of powers of 2 start with 1 and only 4.6% with 9. The same holds for 3ⁿ and 7ⁿ.', '2ⁿ が数字 d で始まるのは、n log₁₀ 2 mod 1 が [log₁₀ d, log₁₀(d + 1)) に入るときに限ります。log₁₀ 2 は無理数なのでこの回転は一様に分布し、d の頻度はその区間の長さ log₁₀(1 + 1/d) になります。2 のべきの 30.1% は 1 で始まり、9 で始まるのは 4.6% だけです。3ⁿ と 7ⁿ でも同じことが成り立ちます。'),
      ][mode]);
    },
  };
})();
