'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------- 1. linear spiral ---------- */
  D.phase = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const a = v.a, x0 = v.x, y0 = v.y, R = 3;
      const r0 = Math.hypot(x0, y0);
      const z = (t) => { const s = Math.exp(a * t), c = Math.cos(t), n = Math.sin(t); return [s * (x0 * c - y0 * n), s * (x0 * n + y0 * c)]; };
      // run for two turns, or until the orbit leaves the window
      let Tm = 4 * PI;
      if (a > 0 && r0 > 0) Tm = Math.min(Tm, Math.log(4.4 / r0) / a);
      Tm = Math.max(Tm, 0.5);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Phase plane. Drag the gold point to choose z(0).', '相平面。金色の点をドラッグして z(0) を選びます。'));
      L.h('p', 'lab-cap', c2, T('The same solution in time, inside its envelope ±|z(0)|eᵃᵗ.', '同じ解を時間に沿って描き、包絡線 ±|z(0)|eᵃᵗ と比べます。'));
      const f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, maxH: 400, xlabel: 'x', ylabel: 'y' });
      f.field((x, y) => [a * x - y, x + a * y], { n: f.small ? 11 : 13, c: 'muted' });
      const path = L.sample(0, Tm, 700, z);
      f.line(path, { c: 'c1', w: 1.4, op: 0.35 });
      f.dot(0, 0, { c: 'ink', r: 4, hollow: a > 1e-9 });
      const g = L.fig(c2, { x: [0, 4 * PI], y: [-R, R], aspect: 0.8, maxH: 400, xlabel: 't', ticksX: [[0, '0'], [PI, 'π'], [2 * PI, '2π'], [3 * PI, '3π'], [4 * PI, '4π']] });
      const env = (t) => r0 * Math.exp(a * t);
      g.line(L.sample(0, 4 * PI, 300, env), { c: 'muted', w: 1.3, dash: '5 4' });
      g.line(L.sample(0, 4 * PI, 300, (t) => -env(t)), { c: 'muted', w: 1.3, dash: '5 4' });
      g.line(L.sample(0, Tm, 600, (t) => z(t)[0]), { c: 'c1', w: 2.2 });
      g.line(L.sample(0, Tm, 600, (t) => z(t)[1]), { c: 'c3', w: 2.2 });
      f.handle(x0, y0, { c: 'hl', snap: 0.1, bounds: [-2, 2, -2, 2], label: T('Initial point z(0)', '初期点 z(0)'), onDrag: (x, y) => { ctx.set('x', x, true); ctx.set('y', y); } });
      const D0 = 1.5;
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        const tt = Math.min(t % (Tm + D0), Tm);
        f.clear('over'); g.clear('over');
        const k = Math.max(2, Math.round(700 * tt / Tm));
        f.line(path.slice(0, k), { c: 'c1', w: 2.6, layer: 'over' });
        const p = z(tt), vel = [a * p[0] - p[1], p[0] + a * p[1]];
        const sc = 0.45 / Math.max(0.3, Math.hypot(...vel)) * Math.min(1.6, Math.hypot(...vel));
        f.arrow(p, [p[0] + vel[0] * sc, p[1] + vel[1] * sc], { c: 'c2', w: 2.2, layer: 'over' });
        f.dot(p[0], p[1], { c: 'c1', r: 5.5 });
        g.vline(tt, { c: 'hl', w: 1.2, dash: '2 3', layer: 'over' });
        g.dot(tt, p[0], { c: 'c1', r: 4.5 }); g.dot(tt, p[1], { c: 'c3', r: 4.5 });
      }, { autoplay: false, initialT: Tm, playLabel: T('Play the motion', '運動を再生') });
      L.legend(ctx.host, [{ c: 'c1', label: T('trajectory, and x(t)', '軌道と x(t)') }, { c: 'c3', label: 'y(t)' }, { c: 'c2', label: T('velocity (ẋ, ẏ)', '速度 (ẋ, ẏ)') }, { c: 'muted', dash: true, label: T('envelope ±|z(0)|eᵃᵗ', '包絡線 ±|z(0)|eᵃᵗ') }]);
      const kind = Math.abs(a) < 1e-9 ? T('centre: closed circles', '中心：閉じた円') : a < 0 ? T('stable spiral', '安定渦状点') : T('unstable spiral', '不安定渦状点');
      ctx.readout([
        { k: T('eigenvalues', '固有値'), v: `${fmt(a, 2)} ± i`, tone: 'key' },
        { k: T('type', '種類'), v: kind, tone: Math.abs(a) < 1e-9 ? undefined : a < 0 ? 'good' : 'warn' },
        { k: T('radius factor per turn, exp(2πa)', '1周での半径の倍率 exp(2πa)'), v: fmt(Math.exp(2 * PI * a), 4) },
        { k: T('period of rotation', '回転の周期'), v: '2π' },
      ], T('The imaginary part 1 sets the rotation; the real part a alone decides whether the radius shrinks or grows.', '虚部 1 が回転を決め、実部 a だけが半径の縮小か増大かを決めます。'));
    },
  };

  /* ---------- 2. saddle-node ---------- */
  D.bifurcation = {
    render(ctx, v) {
      const mu = v.mu, s = mu > 0 ? Math.sqrt(mu) : 0;
      const eq = mu > 1e-9 ? [-s, s] : Math.abs(mu) <= 1e-9 ? [0] : [];
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The graph of ẋ = μ − x² and the phase line on the x-axis.', 'ẋ = μ − x² のグラフと、x 軸上の相直線。'));
      L.h('p', 'lab-cap', c2, T('Bifurcation diagram: equilibria against μ. Drag the gold handle.', '分岐図：μ に対する平衡点。金色のハンドルをドラッグできます。'));
      const f = L.fig(c1, { x: [-2.2, 2.2], y: [-3, 2.4], aspect: 0.85, maxH: 360, xlabel: 'x', ylabel: 'ẋ' });
      f.area(L.sample(-2.2, 2.2, 300, (x) => mu - x * x), { c: 'c3', fo: 0.1 });
      f.line(L.sample(-2.2, 2.2, 300, (x) => mu - x * x), { c: 'c1', w: 2.4 });
      // phase line: arrows between equilibria, pointing the way x moves
      const cuts = [-2.2, ...eq, 2.2];
      for (let i = 0; i + 1 < cuts.length; i++) {
        const lo = cuts[i], hi = cuts[i + 1], m = (lo + hi) / 2, dir = Math.sign(mu - m * m);
        const len = Math.min(0.5, (hi - lo) * 0.3);
        if (hi - lo > 0.2) f.arrow([m - dir * len, 0], [m + dir * len, 0], { c: 'c2', w: 3 });
      }
      eq.forEach((x) => {
        const stable = x > 1e-9, semi = Math.abs(x) <= 1e-9;
        f.dot(x, 0, { c: semi ? 'hl' : stable ? 'c3' : 'c2', r: 7, hollow: !stable && !semi });
        f.text(x, 0, semi ? T('semi-stable', '半安定') : stable ? T('stable', '安定') : T('unstable', '不安定'), { dy: 22, small: true });
      });
      if (!eq.length) f.text(0, mu, T('no equilibrium: every x drifts left', '平衡点なし：すべての x が左へ流れる'), { dy: -10, small: true });
      const b = L.fig(c2, { x: [-1, 2], y: [-2, 2], aspect: 0.85, maxH: 360, xlabel: 'μ', ylabel: 'x*' });
      b.field((m, x) => [0, m - x * x], { n: b.small ? 9 : 11, c: 'muted' });
      b.line(L.sample(0, 2, 200, (m) => Math.sqrt(m)), { c: 'c3', w: 2.8 });
      b.line(L.sample(0, 2, 200, (m) => -Math.sqrt(m)), { c: 'c2', w: 2.8, dash: '6 4' });
      b.dot(0, 0, { c: 'ink', r: 3.5 });
      b.text(0, 0, T('fold', '折り返し'), { anchor: 'end', dx: -8, dy: 4, small: true });
      b.vline(mu, { c: 'hl', w: 1.6, dash: '3 3' });
      eq.forEach((x) => b.dot(mu, x, { c: Math.abs(x) < 1e-9 ? 'hl' : x > 0 ? 'c3' : 'c2', r: 6.5, hollow: x < -1e-9 }));
      b.handle(mu, -1.75, { c: 'hl', axis: 'x', bounds: [-1, 2, -2, 2], label: T('Parameter μ', 'パラメータ μ'), onDrag: (m) => ctx.set('mu', m) });
      L.legend(ctx.host, [{ c: 'c1', label: 'ẋ = μ − x²' }, { c: 'c2', label: T('flow direction on the line', '直線上の流れの向き') }, { kind: 'dot', c: 'c3', label: T('stable x* = √μ', '安定 x* = √μ') }, { c: 'c2', dash: true, label: T('unstable x* = −√μ', '不安定 x* = −√μ') }]);
      ctx.readout([
        { k: 'μ', v: fmt(mu, 2) },
        { k: T('equilibria', '平衡点'), v: eq.length ? eq.map((x) => fmt(x, 3)).join(', ') : T('none', 'なし'), tone: 'key' },
        { k: "f′(x*) = −2x*", v: eq.length ? eq.map((x) => fmt(-2 * x, 3)).join(', ') : '·' },
      ], Math.abs(mu) <= 1e-9 ? T('At μ = 0 the single equilibrium attracts from the right and repels to the left, with f′(0) = 0.', 'μ = 0 では唯一の平衡点が右側から吸引し、左側へは反発します。f′(0) = 0 です。')
        : mu > 0 ? T('f′ < 0 at √μ (attracting) and f′ > 0 at −√μ (repelling). As μ falls to 0 the two collide and vanish.', '√μ で f′ < 0（吸引）、−√μ で f′ > 0（反発）です。μ が0に下がると2つは衝突して消えます。')
          : T('μ − x² < 0 everywhere, so every solution decreases without bound.', 'どこでも μ − x² < 0 なので、すべての解は際限なく減少します。'));
    },
  };

  /* ---------- 3. logistic map ---------- */
  const logi = (r, x) => r * x * (1 - x);
  function lyap(r) {
    let x = 0.3141, s = 0;
    for (let i = 0; i < 300; i++) x = logi(r, x);
    for (let i = 0; i < 600; i++) { x = logi(r, x); s += Math.log(Math.max(1e-12, Math.abs(r * (1 - 2 * x)))); }
    return s / 600;
  }
  function period(r, x0) {
    let x = x0;
    for (let i = 0; i < 3000; i++) x = logi(r, x);
    const ref = x;
    for (let p = 1; p <= 64; p++) { x = logi(r, x); if (Math.abs(x - ref) < 1e-7) return p; }
    return 0;
  }
  D.chaos = {
    render(ctx, v) {
      const r = v.r, x0 = v.x, st = ctx.state, N = 50, eps = 1e-6;
      const A = [x0], B = [x0 + eps];
      for (let n = 0; n < N; n++) { A.push(logi(r, A[n])); B.push(logi(r, B[n])); }
      const split = A.findIndex((a, i) => Math.abs(a - B[i]) > 0.1);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Cobweb: go up to the parabola, across to the diagonal, repeat. Drag x₀.', 'クモの巣図：放物線まで上がり、対角線まで横に移る操作を繰り返します。x₀ をドラッグできます。'));
      L.h('p', 'lab-cap', c2, T('Two orbits starting 10⁻⁶ apart.', '10⁻⁶ だけ離れて出発する2つの軌道。'));
      const cw = L.fig(c1, { x: [0, 1], y: [0, 1], equal: true, maxH: 330, xlabel: 'xₙ', ylabel: 'xₙ₊₁' });
      cw.line([[0, 0], [1, 1]], { c: 'muted', w: 1.2 });
      cw.line(L.sample(0, 1, 200, (x) => logi(r, x)), { c: 'c1', w: 2.4 });
      const web = [[x0, 0]];
      for (let n = 0; n < 40; n++) { web.push([A[n], A[n + 1]]); web.push([A[n + 1], A[n + 1]]); }
      cw.line(web.slice(0, 12), { c: 'c2', w: 1.6, op: 0.95 });
      cw.line(web.slice(11), { c: 'c2', w: 1, op: 0.45 });
      const fp = 1 - 1 / r;
      cw.dot(fp, fp, { c: 'ink', r: 4, hollow: true });
      cw.handle(x0, 0.02, { c: 'hl', axis: 'x', bounds: [0.05, 0.9, 0, 1], label: T('Initial value x₀', '初期値 x₀'), onDrag: (x) => ctx.set('x', x) });
      const ts = L.fig(c2, { x: [0, N], y: [0, 1.14], ticksY: [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']], aspect: 0.8, maxH: 330, xlabel: 'n', ylabel: 'xₙ' });
      if (split > 0) { ts.rect(split, 0, N - split, 1.14, { c: 'c2', fo: 0.07, nostroke: true, layer: 'under' }); ts.vline(split, { c: 'c2', w: 1.2 }); ts.text(split, 1.14, T(`apart from n = ${split}`, `n = ${split} から分離`), { anchor: split > N * 0.6 ? 'end' : 'start', dx: split > N * 0.6 ? -5 : 5, dy: 14, small: true, c: 'c2' }); }
      ts.line(A.map((y, n) => [n, y]), { c: 'c1', w: 1.8 });
      ts.line(B.map((y, n) => [n, y]), { c: 'c4', w: 1.8, dash: '5 3' });
      A.forEach((y, n) => ts.dot(n, y, { c: 'c1', r: 2.4 }));
      ts.hover((x) => { const n = Math.round(x); if (n < 0 || n > N) return null; return { x: n, text: `n = ${n}: ${fmt(A[n], 5)} · ${fmt(B[n], 5)}` }; });

      L.h('p', 'lab-cap', ctx.host, T('Long-run values of xₙ for every r (orbit diagram), and the Lyapunov exponent λ(r) below it. Drag the gold handle to set r.', '各 r での xₙ の長期的な値（軌道図）と、その下のリャプノフ指数 λ(r)。金色のハンドルで r を設定します。'));
      const bd = L.fig(ctx.host, { x: [2, 4], y: [0, 1], aspect: 0.4, maxH: 300, ylabel: 'x' });
      const res = 2, cwid = Math.max(1, Math.round(bd.pw / res)), chh = Math.max(1, Math.round(bd.ph / res));
      const key = `${cwid}x${chh}`;
      if (st.bdKey !== key) {
        const H = new Float32Array(cwid * chh);
        for (let i = 0; i < cwid; i++) {
          const rr = 2 + 2 * (i + 0.5) / cwid; let x = 0.2;
          for (let k = 0; k < 400; k++) x = logi(rr, x);
          for (let k = 0; k < 500; k++) { x = logi(rr, x); const j = Math.min(chh - 1, Math.max(0, Math.floor((1 - x) * chh))); H[j * cwid + i] += 1; }
        }
        st.bd = H; st.bdKey = key;
      }
      const H = st.bd;
      bd.raster((x, y) => { const i = Math.min(cwid - 1, Math.floor((x - 2) / 2 * cwid)), j = Math.min(chh - 1, Math.floor((1 - y) * chh)); const c = H[j * cwid + i]; return c ? 0.35 + 0.65 * Math.min(1, Math.log(1 + c) / Math.log(60)) : 0; }, { cmap: 'seq', res });
      bd.vline(r, { c: 'hl', w: 1.8, dash: false, op: 0.9 });
      bd.handle(r, 0.06, { c: 'hl', axis: 'x', bounds: [2, 4, 0, 1], label: T('Parameter r', 'パラメータ r'), onDrag: (x) => ctx.set('r', x) });
      if (!st.ly) st.ly = L.seq(401, (i) => [2 + 2 * i / 400, lyap(2 + 2 * i / 400)]);
      const ly = L.fig(ctx.host, { x: [2, 4], y: [-1.5, 0.9], aspect: 0.2, minH: 140, maxH: 170, xlabel: 'r', ylabel: 'λ', ticksY: [[-1, '−1'], [0, '0'], [0.5, '0.5']] });
      ly.area(st.ly.map(([x, y]) => [x, Math.max(0, y)]), { c: 'c2', fo: 0.35 });
      ly.line(st.ly.map(([x, y]) => [x, Math.max(-1.5, y)]), { c: 'c1', w: 1.4 });
      const lam = lyap(r);
      ly.vline(r, { c: 'hl', w: 1.8, dash: false, op: 0.9 });
      ly.dot(r, Math.max(-1.5, lam), { c: 'hl', r: 5 });
      L.legend(ctx.host, [{ c: 'c1', label: T('map, orbit xₙ, λ(r)', '写像・軌道 xₙ・λ(r)') }, { c: 'c4', dash: true, label: T('orbit from x₀ + 10⁻⁶', 'x₀ + 10⁻⁶ からの軌道') }, { c: 'c2', label: T('cobweb', 'クモの巣') }, { kind: 'fill', c: 'c2', label: T('λ > 0: sensitive dependence', 'λ > 0：鋭敏な依存') }]);
      const p = period(r, x0);
      ctx.readout([
        { k: 'r', v: fmt(r, 2) },
        { k: T('Lyapunov exponent λ', 'リャプノフ指数 λ'), v: lam < -12 ? T('−∞ (superstable)', '−∞（超安定）') : fmt(lam, 3), tone: lam > 0.005 ? 'warn' : 'good' },
        { k: T('long-run behaviour', '長期的な振る舞い'), v: p ? (p === 1 ? T(`fixed point ${fmt(1 - 1 / r, 4)}`, `不動点 ${fmt(1 - 1 / r, 4)}`) : T(`period ${p}`, `周期 ${p}`)) : T('no period ≤ 64 found', '周期 64 以下なし'), tone: 'key' },
        { k: T('orbits differ by 0.1 at', '差が 0.1 を超える n'), v: split > 0 ? `n = ${split}` : T(`not within ${N}`, `${N} 以内ではなし`) },
      ], T('λ > 0 means nearby orbits separate like exp(λn); periodic windows (λ < 0) are scattered through the chaotic range.', 'λ > 0 は近い軌道が exp(λn) のように離れることを意味します。カオス的な範囲にも周期窓（λ < 0）が散らばっています。'));
    },
  };
})();
