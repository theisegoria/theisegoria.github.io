'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const circ = (cx, cy, r, n = 120) => L.seq(n + 1, (i) => [cx + r * Math.cos(L.TAU * i / n), cy + r * Math.sin(L.TAU * i / n)]);

  D.descent = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, k = v.k, eta = v.eta, N = 40;
      st.start ||= [2.6, 1.3];
      const [x0, y0] = st.start;
      const fq = (x, y) => 0.5 * (x * x + k * y * y);
      const mx = 1 - eta, my = 1 - eta * k, rho = Math.max(Math.abs(mx), Math.abs(my));
      const pts = L.seq(N + 1, (n) => [x0 * mx ** n, y0 * my ** n]);
      const vals = pts.map(([x, y]) => fq(x, y));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Contours of f and the gradient steps; drag the start', 'f の等高線と勾配ステップ。始点をドラッグできます'));
      const f = L.fig(c1, { x: [-3.2, 3.2], y: [-2.2, 2.2], equal: true, maxH: 380 });
      f.raster((x, y) => 0.3 * (1 - Math.exp(-fq(x, y) / 3)), { cmap: 'seq' });
      [0.1, 0.4, 1, 2, 3.5, 5.5, 8].forEach((c) => f.line(L.seq(121, (i) => [Math.sqrt(2 * c) * Math.cos(L.TAU * i / 120), Math.sqrt(2 * c / k) * Math.sin(L.TAU * i / 120)]), { c: 'c1', w: 1, op: 0.5, layer: 'under' }));
      f.arrow([x0, y0], [0, 0], { c: 'c3', w: 1.8, dash: '6 4', layer: 'under' });
      f.text(x0 / 2, y0 / 2, T('Newton', 'ニュートン'), { c: 'c3', small: true, dy: -8, dx: -6, anchor: 'end', layer: 'under' });
      f.dot(0, 0, { c: 'ink', r: 3.5 });
      L.h('p', 'lab-cap', c2, T('f(xₙ) on a log scale', 'f(xₙ)（対数目盛）'));
      const lv = vals.map((x) => Math.log10(Math.max(x, 1e-12)));
      const top = Math.min(8, Math.max(2, Math.ceil(Math.max(...lv)) + 1));
      const g = L.fig(c2, { x: [0, N], y: [-10, top], aspect: 0.72, maxH: 380, xlabel: T('iteration n', '反復 n'), ylabel: 'log₁₀ f', ticksY: L.seq(Math.floor((top + 10) / (top > 2 ? 4 : 2)) + 1, (i) => -10 + (top > 2 ? 4 : 2) * i).map((y) => [y, `10${y < 0 ? '⁻' : ''}${String(Math.abs(y)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}`]) });
      g.hline(-6, { c: 'muted', dash: '3 4' });
      g.text(N, -6, '10⁻⁶', { anchor: 'end', dy: -5, small: true, c: 'muted' });
      if (rho > 0) g.line([[0, lv[0]], [N, lv[0] + 2 * N * Math.log10(rho)]], { c: 'c2', w: 1.6, dash: '6 4' });
      g.line(lv.map((y, n) => [n, y]), { c: 'c1', w: 1.6, op: 0.6 });
      lv.forEach((y, n) => g.dot(n, y, { c: 'c1', r: 2.6, layer: 'main' }));
      let shown = -1;
      const draw = (m) => {
        f.clear('main'); f.clear('over'); g.clear('over');
        let vis = pts.slice(0, m + 1); const out = vis.findIndex(([x, y]) => Math.abs(x) > 8 || Math.abs(y) > 8); if (out > 0) vis = vis.slice(0, out + 1);
        f.line(vis, { c: 'hl', w: 2.2 });
        vis.forEach(([x, y], i) => f.dot(x, y, { c: 'hl', r: i === m ? 5 : 3, layer: 'main' }));
        g.dot(m, lv[m], { c: 'hl', r: 5.5 });
        shown = m;
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const m = Math.min(N, Math.floor(t / 0.22));
        if (m !== shown) draw(m);
        label.textContent = m < N ? `n = ${m}` : '';
        return m < N;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Play the iterations', '反復を再生') });
      f.handle(x0, y0, { c: 'c2', label: T('Starting point', '始点'), bounds: [-3, 3, -2, 2], onDrag: (x, y) => { st.start = [Math.abs(x) < 0.05 ? 0.05 : x, y]; ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'hl', label: T('gradient descent iterates', '勾配降下の反復') }, { c: 'c3', dash: true, label: T('one Newton step', 'ニュートン法の1ステップ') }, { c: 'c2', dash: true, label: T('rate ρ²ⁿ, ρ = max(|1 − η|, |1 − ηκ|)', '速さ ρ²ⁿ、ρ = max(|1 − η|, |1 − ηκ|)') }]);
      const hit = vals.findIndex((x) => x < 1e-6);
      const opt = 2 / (1 + k);
      ctx.readout([{ k: T('multipliers 1 − η, 1 − ηκ', '倍率 1 − η、1 − ηκ'), v: `${fmt(mx, 3)}, ${fmt(my, 3)}` }, { k: 'ρ', v: fmt(rho, 3), tone: rho >= 1 ? 'warn' : 'key' }, { k: T('stable if η <', '安定条件 η <'), v: fmt(2 / k, 3) }, { k: T('best fixed η = 2/(1 + κ)', '最良の η = 2/(1 + κ)'), v: fmt(opt, 3) }, { k: T('steps to f < 10⁻⁶', 'f < 10⁻⁶ までの回数'), v: hit >= 0 ? String(hit) : T(`more than ${N}`, `${N} 回超`) }],
        rho >= 1 ? T('Here |1 − ηκ| ≥ 1, so the y-coordinate is not damped and the iterates fail to converge.', 'ここでは |1 − ηκ| ≥ 1 なので y 座標が減衰せず、反復は収束しません。') : my < 0 ? T('1 − ηκ is negative, so the y-coordinate flips sign each step: the zigzag.', '1 − ηκ が負なので y 座標が毎回符号を変え、ジグザグになります。') : '');
    },
  };

  D.constraint = {
    render(ctx, v) {
      const st = ctx.state, b = v.b, ineq = Math.round(v.kind ?? 0) === 1;
      st.s ??= 1.3;
      const active = !ineq || b > 0;
      const opt = active ? [b / 2, b / 2] : [0, 0], fstar = active ? b * b / 2 : 0, lam = active ? b : 0;
      const s = st.s, u = [Math.SQRT1_2, -Math.SQRT1_2];
      const Q = [b / 2 + s * u[0], b / 2 + s * u[1]], fQ = Q[0] ** 2 + Q[1] ** 2;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Contours of x² + y² and the constraint line', 'x² + y² の等高線と制約の直線'));
      const f = L.fig(c1, { x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, maxH: 400 });
      if (ineq) f.poly([[-10, b + 10], [10, b - 10], [10, 10], [-10, 10]].map(([x, y]) => [x, Math.max(y, b - x)]), { c: 'c3', fo: 0.12, w: 0, layer: 'under' });
      [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].forEach((r) => f.line(circ(0, 0, r), { c: 'muted', w: 1, op: 0.45, layer: 'under' }));
      f.line([[-5, b + 5], [5, b - 5]], { c: 'c1', w: 2.6 });
      const rs = Math.hypot(...opt);
      if (rs > 1e-3) f.line(circ(0, 0, rs), { c: 'hl', w: 2.4 });
      f.line(circ(0, 0, Math.sqrt(fQ)), { c: 'c2', w: 1.6, dash: '5 4' });
      if (active && Math.abs(b) > 0.2) {
        const gl = 0.6 * Math.sign(b);
        f.arrow(opt, [opt[0] + b * 0.45, opt[1] + b * 0.45], { c: 'ink', w: 2.2 });
        f.text(opt[0] + b * 0.45, opt[1] + b * 0.45, '∇f', { dx: 12, dy: 4, anchor: 'start' });
        void gl;
      }
      f.dot(opt[0], opt[1], { c: 'hl', r: 6 });
      f.text(opt[0], opt[1], `(${fmt(opt[0], 2)}, ${fmt(opt[1], 2)})`, { dx: -10, dy: 18, anchor: 'end', small: true });
      const hb = [b / 2 - 2.1 * u[0], b / 2 - 2.1 * u[1]];
      f.handle(hb[0], hb[1], { c: 'c1', label: T('Move the constraint line', '制約の直線を動かす'), onDrag: (x, y) => ctx.set('b', x + y) });
      f.handle(Q[0], Q[1], { c: 'c2', label: T('Trial point on the line', '直線上の試験点'), onDrag: (x, y) => { st.s = L.clamp((x - b / 2) * u[0] + (y - b / 2) * u[1], -3, 3); ctx.redraw(); } });
      f.text(hb[0], hb[1], `x + y ${ineq ? '≥' : '='} ${fmt(b, 2)}`, { dx: 14, dy: -10, anchor: 'start', c: 'c1', small: true });
      L.h('p', 'lab-cap', c2, T('The objective along the line, at signed position s', '直線に沿った目的関数（位置 s）'));
      const g = L.fig(c2, { x: [-3, 3], y: [0, 14], aspect: 0.9, maxH: 400, xlabel: T('position along the line s', '直線上の位置 s'), ylabel: 'f' });
      g.line(L.sample(-3, 3, 200, (x) => b * b / 2 + x * x), { c: 'c1', w: 2.6 });
      g.hline(fstar, { c: 'hl', dash: '6 4', w: 1.6 });
      g.dot(0, b * b / 2, { c: active ? 'hl' : 'muted', r: 5.5 });
      g.dot(s, b * b / 2 + s * s, { c: 'c2', r: 5.5 });
      g.text(s, b * b / 2 + s * s, `f = ${fmt(fQ, 2)}`, { dx: s > 0 ? -10 : 10, anchor: s > 0 ? 'end' : 'start', dy: -6, small: true });
      if (!active) g.text(0, fstar, T('unconstrained minimum 0 is feasible', '制約なしの最小値 0 が実行可能'), { dy: -8, small: true });
      L.legend(ctx.host, [{ c: 'c1', label: ineq ? T('boundary x + y = b', '境界 x + y = b') : T('constraint x + y = b', '制約 x + y = b') }, { c: 'hl', label: T('smallest reachable contour', '到達できる最小の等高線') }, { c: 'c2', dash: true, label: T('contour through the trial point', '試験点を通る等高線') }].concat(ineq ? [{ kind: 'fill', c: 'c3', label: T('feasible region', '実行可能領域') }] : []));
      ctx.readout([{ k: '(x*, y*)', v: `(${fmt(opt[0], 3)}, ${fmt(opt[1], 3)})` }, { k: 'f*', v: fmt(fstar, 3), tone: 'key' }, { k: 'λ*', v: fmt(lam, 3) }, { k: T('trial f', '試験点の f'), v: fmt(fQ, 3) }],
        !active ? T('With x + y ≥ b and b ≤ 0, the origin is feasible: the constraint is inactive and its multiplier is 0.', 'x + y ≥ b で b ≤ 0 なら原点が実行可能です。制約は効いておらず、乗数は0です。') : T('Drag the blue handle to move the line and the orange one along it. At the optimum ∇f = λ∇(x + y) is perpendicular to the line.', '青のハンドルで直線を、橙のハンドルで直線上の点を動かせます。最適点では ∇f = λ∇(x + y) が直線に垂直です。'));
    },
  };

  D.duality = {
    render(ctx, v) {
      const b = v.b, lam = v.lambda, fs = b * b / 2, gl = lam * b - lam * lam / 2, gap = fs - gl;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Optimal value f*(b); its slope is the multiplier', '最適値 f*(b)。その傾きが乗数です'));
      const f = L.fig(c1, { x: [-3.2, 3.2], y: [-1, 5.5], aspect: 0.85, maxH: 380, xlabel: 'b', ylabel: 'f*(b)' });
      f.line(L.sample(-3.2, 3.2, 200, (x) => x * x / 2), { c: 'c1', w: 2.6 });
      f.line([[b - 1.6, fs - 1.6 * b], [b + 1.6, fs + 1.6 * b]], { c: 'c2', w: 2, dash: '6 4' });
      f.text(b + 1.2, fs + 1.2 * b, `${T('slope', '傾き')} λ* = ${fmt(b, 2)}`, { anchor: b > 0 ? 'end' : 'start', dx: b > 0 ? -8 : 8, dy: b > 0 ? -4 : 16, small: true, c: 'c2' });
      f.handle(b, fs, { c: 'c1', axis: 'x', bounds: [-3, 3, -1, 5.5], label: T('Constraint value b', '制約値 b'), onDrag: (x) => ctx.set('b', x) });
      L.h('p', 'lab-cap', c2, T('Dual function g(λ) never exceeds f*; drag λ', '双対関数 g(λ) は f* を超えません。λ をドラッグできます'));
      const g = L.fig(c2, { x: [-4.2, 4.2], y: [-6, 5.5], aspect: 0.85, maxH: 380, xlabel: 'λ', ylabel: 'g(λ)' });
      g.line(L.sample(-4.2, 4.2, 200, (x) => x * b - x * x / 2), { c: 'c4', w: 2.6 });
      g.hline(fs, { c: 'c1', dash: '6 4', w: 1.8 });
      g.text(4.1, fs, `f* = ${fmt(fs, 3)}`, { anchor: 'end', dy: -7, small: true, c: 'c1' });
      g.dot(b, fs, { c: 'c1', r: 4 });
      if (gap > 0.05) { g.seg([lam, gl], [lam, fs], { c: 'c2', w: 2.4 }); g.text(lam, (gl + fs) / 2, `${T('gap', 'ギャップ')} ${fmt(gap, 3)}`, { dx: lam > 0 ? -14 : 14, anchor: lam > 0 ? 'end' : 'start', small: true, c: 'c2' }); }
      const sl = b - lam;
      g.line([[lam - 1.2, gl - 1.2 * sl], [lam + 1.2, gl + 1.2 * sl]], { c: 'ink', w: 1.4, op: 0.7 });
      g.handle(lam, gl, { c: 'hl', axis: 'x', bounds: [-4, 4, -6, 5.5], label: T('Trial multiplier λ', '試す乗数 λ'), onDrag: (x) => ctx.set('lambda', x) });
      L.legend(ctx.host, [{ c: 'c1', label: 'f*(b) = b²/2' }, { c: 'c2', dash: true, label: T('tangent, slope λ* = b', '接線、傾き λ* = b') }, { c: 'c4', label: 'g(λ) = λb − λ²/2' }, { c: 'ink', label: T('slope of g = b − λ, the constraint violation', 'g の傾き = b − λ（制約の違反量）') }]);
      ctx.readout([{ k: 'g(λ)', v: fmt(gl, 3) }, { k: 'f*', v: fmt(fs, 3) }, { k: T('gap f* − g(λ) = (b − λ)²/2', 'ギャップ f* − g(λ) = (b − λ)²/2'), v: fmt(gap, 3), tone: gap < 1e-9 ? 'good' : 'key' }, { k: T('minimizer of L', 'L の最小点'), v: `(${fmt(lam / 2, 2)}, ${fmt(lam / 2, 2)})` }, { k: 'b − x − y', v: fmt(sl, 3) }],
        T('For a trial λ, minimizing L gives x = y = λ/2, which misses the constraint by b − λ. Raising λ toward b closes the gap.', '試す λ で L を最小化すると x = y = λ/2 となり、制約を b − λ だけ外します。λ を b に近づけるとギャップが閉じます。'));
    },
  };
})();
