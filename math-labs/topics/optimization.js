'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const circ = (cx, cy, r, n = 120) => L.seq(n + 1, (i) => [cx + r * Math.cos(L.TAU * i / n), cy + r * Math.sin(L.TAU * i / n)]);
  const SUP = (y) => `10${y < 0 ? '⁻' : ''}${String(Math.abs(y)).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}`;
  // a polyline as tube control points: each straight segment is sampled densely so the spline stays straight
  const straight = (pts) => { const out = []; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1]; for (const t of [0, 0.04, 0.5, 0.96]) out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } if (pts.length) out.push(pts[pts.length - 1]); return out; };

  /* ---------- 1. gradient descent on f = (x^2 + kappa y^2)/2 ---------- */
  const GX = 3.2, GY = 2.2, LEVELS = [0.1, 0.4, 1, 2, 3.5, 5.5, 8, 11, 15, 20];
  const fq = (k) => (x, y) => 0.5 * (x * x + k * y * y);
  const zScale = (k) => 2.1 / fq(k)(GX, GY);
  function descentModel(k, eta, start, N = 40) {
    const [x0, y0] = start, mx = 1 - eta, my = 1 - eta * k, rho = Math.max(Math.abs(mx), Math.abs(my));
    const pts = L.seq(N + 1, (n) => [x0 * mx ** n, y0 * my ** n]);
    return { k, eta, N, mx, my, rho, pts, vals: pts.map(([x, y]) => fq(k)(x, y)) };
  }
  function descentFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('The graph of f in 3D with the iterates, each lifted to its height. Heights are scaled to fit. Drag the orange start point; drag elsewhere to turn the view.', '3D で見た f のグラフと反復点。各点はその高さに置いています（高さは枠に収まるよう縮尺しています）。橙の始点をドラッグでき、それ以外の場所をドラッグすると回転します。'));
    st.v3 = L.h('div', '', st.c1);
    st.p2 = L.h('div', '', st.c2);
    st.row2 = L.h('div', '', st.frame);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  function contourFig(host, m, start, ctx, st) {
    const k = m.k, f2 = fq(k), [x0, y0] = start;
    L.h('p', 'lab-cap', host, T('Contours of f and the gradient steps; drag the start', 'f の等高線と勾配ステップ。始点をドラッグできます'));
    const f = L.fig(host, { x: [-GX, GX], y: [-GY, GY], equal: true, maxH: 380 });
    f.raster((x, y) => 0.3 * (1 - Math.exp(-f2(x, y) / 3)), { cmap: 'seq' });
    LEVELS.slice(0, 7).forEach((c) => f.line(L.seq(121, (i) => [Math.sqrt(2 * c) * Math.cos(L.TAU * i / 120), Math.sqrt(2 * c / k) * Math.sin(L.TAU * i / 120)]), { c: 'c1', w: 1, op: 0.5, layer: 'under' }));
    f.arrow([x0, y0], [0, 0], { c: 'c3', w: 1.8, dash: '6 4', layer: 'under' });
    f.text(x0 / 2, y0 / 2, T('Newton', 'ニュートン'), { c: 'c3', small: true, dy: -8, dx: -6, anchor: 'end', layer: 'under' });
    f.dot(0, 0, { c: 'ink', r: 3.5 });
    f.handle(x0, y0, { c: 'c2', label: T('Starting point', '始点'), bounds: [-3, 3, -2, 2], onDrag: (x, y) => { st.start = [Math.abs(x) < 0.05 ? 0.05 : x, y]; ctx.redraw(); } });
    return f;
  }
  function logFig(host, m, flat) {
    L.h('p', 'lab-cap', host, T('f(xₙ) on a log scale', 'f(xₙ)（対数目盛）'));
    const lv = m.vals.map((x) => Math.log10(Math.max(x, 1e-12)));
    const top = Math.min(8, Math.max(2, Math.ceil(Math.max(...lv)) + 1)), stp = top > 2 ? 4 : 2;
    const g = L.fig(host, { x: [0, m.N], y: [-10, top], aspect: flat ? 0.72 : 0.3, maxH: flat ? 380 : 240, xlabel: T('iteration n', '反復 n'), ylabel: 'log₁₀ f', ticksY: L.seq(Math.floor((top + 10) / stp) + 1, (i) => -10 + stp * i).map((y) => [y, SUP(y)]) });
    g.hline(-6, { c: 'muted', dash: '3 4' });
    g.text(m.N, -6, '10⁻⁶', { anchor: 'end', dy: -5, small: true, c: 'muted' });
    if (m.rho > 0) g.line([[0, lv[0]], [m.N, lv[0] + 2 * m.N * Math.log10(m.rho)]], { c: 'c2', w: 1.6, dash: '6 4' });
    g.line(lv.map((y, n) => [n, y]), { c: 'c1', w: 1.6, op: 0.6 });
    lv.forEach((y, n) => g.dot(n, y, { c: 'c1', r: 2.6, layer: 'main' }));
    return { g, lv };
  }
  function descent2d(ctx, v, st) {
    const m = descentModel(v.k, v.eta, st.start);
    st.m = m;
    st.anim?.stop(); st.bar.replaceChildren(); st.leg.replaceChildren(); st.p2.replaceChildren(); st.row2.replaceChildren();
    let f, G;
    if (st.flat) {
      st.c1.replaceChildren(); st.c2.replaceChildren(); st.c1.parentNode.classList.remove('is-wide');
      f = contourFig(st.c1, m, st.start, ctx, st); G = logFig(st.c2, m, true);
    } else {
      f = contourFig(st.p2, m, st.start, ctx, st); G = logFig(st.row2, m, false);
    }
    const { g, lv } = G;
    const draw = (n) => {
      f.clear('main'); f.clear('over'); g.clear('over');
      let vis = m.pts.slice(0, n + 1); const out = vis.findIndex(([x, y]) => Math.abs(x) > 8 || Math.abs(y) > 8); if (out > 0) vis = vis.slice(0, out + 1);
      f.line(vis, { c: 'hl', w: 2.2 });
      vis.forEach(([x, y], i) => f.dot(x, y, { c: 'hl', r: i === n ? 5 : 3, layer: 'main' }));
      g.dot(n, lv[n], { c: 'hl', r: 5.5 });
      st.shown = n; st.path3d?.(n);
    };
    let last = -1;
    st.anim = L.animator(st.bar, (dt, t, label) => {
      const n = Math.min(m.N, Math.floor(t / 0.22));
      if (n !== last) { last = n; draw(n); }
      label.textContent = n < m.N ? `n = ${n}` : '';
      return n < m.N;
    }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Play the iterations', '反復を再生') });
    L.legend(st.leg, [{ c: 'hl', label: T('gradient descent iterates', '勾配降下の反復') }, { c: 'c3', dash: true, label: T('one Newton step', 'ニュートン法の1ステップ') }, { c: 'c2', dash: true, label: T('rate ρ²ⁿ, ρ = max(|1 − η|, |1 − ηκ|)', '速さ ρ²ⁿ、ρ = max(|1 − η|, |1 − ηκ|)') }]);
    const hit = m.vals.findIndex((x) => x < 1e-6), opt = 2 / (1 + m.k);
    ctx.readout([{ k: T('multipliers 1 − η, 1 − ηκ', '倍率 1 − η、1 − ηκ'), v: `${fmt(m.mx, 3)}, ${fmt(m.my, 3)}` }, { k: 'ρ', v: fmt(m.rho, 3), tone: m.rho >= 1 ? 'warn' : 'key' }, { k: T('stable if η <', '安定条件 η <'), v: fmt(2 / m.k, 3) }, { k: T('best fixed η = 2/(1 + κ)', '最良の η = 2/(1 + κ)'), v: fmt(opt, 3) }, { k: T('steps to f < 10⁻⁶', 'f < 10⁻⁶ までの回数'), v: hit >= 0 ? String(hit) : T(`more than ${m.N}`, `${m.N} 回超`) }],
      m.rho >= 1 ? T('Here |1 − ηκ| ≥ 1, so the y-coordinate is not damped and the iterates fail to converge.', 'ここでは |1 − ηκ| ≥ 1 なので y 座標が減衰せず、反復は収束しません。') : m.my < 0 ? T('1 − ηκ is negative, so the y-coordinate flips sign each step: the zigzag across the valley.', '1 − ηκ が負なので y 座標が毎回符号を変え、谷を横切るジグザグになります。') : '');
  }
  D.descent = {
    three: true,
    render(ctx, v) {
      const st = descentFrame(ctx);
      st.start ||= [2.6, 1.3];
      const lift = (k, s, x, y, d = 0) => [x, y, Math.min(fq(k)(x, y) * s, 3.2) + d];
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.68, maxH: 420, camera: [4.3, -8.1, 11.0], target: [0, 0, 0.25], fov: 30,
        init(S) {
          st.flat = false; st.k3 = null;
          st.surf = S.graph(() => 0, { x: [-GX, GX], y: [-GY, GY], nu: 128, nv: 88, rough: 0.55, coat: 0.3 });
          st.lev = S.lines([], { c: 'ink', opacity: S.dark ? 0.45 : 0.35 });
          st.newton = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c3', r: 0.022 });
          st.path = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.03, glow: 0.25 });
          st.dots = S.points([], { c: 'hl', r: 0.05, max: 41, glow: 0.2 });
          st.cur = S.sphere([0, 0, 0], 0.085, { c: 'hl', glow: 0.35 });
          S.sphere([0, 0, 0.02], 0.06, { c: 'ink' });
          S.label(T('minimum', '最小点'), [0, 0, 0.05], { small: true, dy: 22, align: 'end', dx: -4 });
          st.nLab = S.label(T('Newton', 'ニュートン'), [0, 0, 0], { small: true, c: 'c3', align: 'end' });
          st.h = S.handle([0, 0, 0], { c: 'c2', r: 0.13, plane: [[0, 0, 1], [0, 0, 0]], onDrag: (q) => { const x = L.clamp(q.x, -3, 3), y = L.clamp(q.y, -2, 2); st.start = [Math.abs(x) < 0.05 ? 0.05 : x, y]; ctx.redraw(); return lift(st.k3, st.s3, st.start[0], st.start[1], 0.05); } });
          st.path3d = (n) => {
            const m = st.m; if (!m || st.k3 !== m.k) return;
            let vis = m.pts.slice(0, n + 1); const out = vis.findIndex(([x, y]) => Math.abs(x) > GX * 1.15 || Math.abs(y) > GY * 1.15); if (out > 0) vis = vis.slice(0, out + 1);
            const P = vis.map(([x, y]) => lift(m.k, st.s3, x, y, 0.035));
            st.path.update(P.length > 1 ? straight(P) : [P[0], P[0].map((c, i) => c + (i === 2 ? 0.001 : 0))]);
            st.dots.update(P.slice(0, -1));
            st.cur.at(P[P.length - 1]);
          };
        },
        update(S, vv) {
          descent2d(ctx, vv, st);
          const k = vv.k, s = zScale(k), m = st.m;
          if (st.k3 !== k) {
            st.k3 = k; st.s3 = s;
            const zmax = fq(k)(GX, GY) * s;
            const lo = S.colour('c1').clone().lerp(S.colour('plate'), 0.35), hi = S.colour('c3').clone().lerp(S.colour('plate'), 0.1);
            st.surf.update((x, y) => fq(k)(x, y) * s, (x, y, p) => lo.clone().lerp(hi, Math.sqrt(Math.min(1, p[2] / zmax))));
            const segs = [];
            for (const c of LEVELS) {
              const a = Math.sqrt(2 * c), b = Math.sqrt(2 * c / k), z = c * s + 0.012; let prev = null;
              for (let i = 0; i <= 160; i++) { const t = L.TAU * i / 160, p = [a * Math.cos(t), b * Math.sin(t), z], inside = Math.abs(p[0]) <= GX && Math.abs(p[1]) <= GY; if (prev && inside) segs.push([prev, p]); prev = inside ? p : null; }
            }
            st.lev.update(segs);
          }
          const [x0, y0] = st.start;
          st.h.at(lift(k, s, x0, y0, 0.05));
          st.h.userData.handle.plane = [[0, 0, 1], [0, 0, lift(k, s, x0, y0)[2]]];
          st.newton.update(L.seq(41, (i) => lift(k, s, x0 * (1 - i / 40), y0 * (1 - i / 40), 0.03)));
          st.nLab.set(lift(k, s, x0 * 0.5, y0 * 0.5, 0.06));
          st.path3d(st.shown ?? m.N);
        },
        fallback(c, vv) { st.flat = true; st.path3d = null; descent2d(c, vv, st); },
      });
      if (!st.__v3 && !st.flat) descent2d(ctx, v, st);
    },
  };

  /* ---------- 2. constrained minimum of x^2 + y^2 on x + y = b ---------- */
  const CR = 3.0, CS = 0.28, CU = [Math.SQRT1_2, -Math.SQRT1_2];
  function constraintFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('The bowl f = x² + y² cut by the vertical plane x + y = b (heights scaled). The cut is a parabola; its lowest point is the constrained minimum. Drag the blue handle to slide the plane and the orange one along the cut.', '平面 x + y = b で切った鉢 f = x² + y²（高さは縮尺しています）。切り口は放物線で、その最低点が制約つき最小点です。青のハンドルで平面を、橙のハンドルで切り口に沿って動かせます。'));
    st.v3 = L.h('div', '', st.c1);
    st.p2 = L.h('div', '', st.c2);
    st.row2 = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  function constraint2d(ctx, v, st) {
    const b = v.b, ineq = Math.round(v.kind ?? 0) === 1, active = !ineq || b > 0;
    const opt = active ? [b / 2, b / 2] : [0, 0], fstar = active ? b * b / 2 : 0, lam = active ? b : 0;
    const s = st.s, u = CU;
    const Qp = [b / 2 + s * u[0], b / 2 + s * u[1]], fQ = Qp[0] ** 2 + Qp[1] ** 2;
    st.p2.replaceChildren(); st.row2.replaceChildren(); st.leg.replaceChildren();
    let host1 = st.p2, host2 = st.row2;
    if (st.flat) { st.c1.replaceChildren(); st.c2.replaceChildren(); st.c1.parentNode.classList.remove('is-wide'); host1 = st.c1; host2 = st.c2; }
    L.h('p', 'lab-cap', host1, T('Contours of x² + y² and the constraint line', 'x² + y² の等高線と制約の直線'));
    const f = L.fig(host1, { x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, maxH: 400 });
    if (ineq) f.poly([[-10, b + 10], [10, b - 10], [10, 10], [-10, 10]].map(([x, y]) => [x, Math.max(y, b - x)]), { c: 'c3', fo: 0.12, w: 0, layer: 'under' });
    [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].forEach((r) => f.line(circ(0, 0, r), { c: 'muted', w: 1, op: 0.45, layer: 'under' }));
    f.line([[-5, b + 5], [5, b - 5]], { c: 'c1', w: 2.6 });
    const rs = Math.hypot(...opt);
    if (rs > 1e-3) f.line(circ(0, 0, rs), { c: 'hl', w: 2.4 });
    f.line(circ(0, 0, Math.sqrt(fQ)), { c: 'c2', w: 1.6, dash: '5 4' });
    if (active && Math.abs(b) > 0.2) {
      f.arrow(opt, [opt[0] + b * 0.45, opt[1] + b * 0.45], { c: 'ink', w: 2.2 });
      f.text(opt[0] + b * 0.45, opt[1] + b * 0.45, '∇f', { dx: 12, dy: 4, anchor: 'start' });
    }
    f.dot(opt[0], opt[1], { c: 'hl', r: 6 });
    f.text(opt[0], opt[1], `(${fmt(opt[0], 2)}, ${fmt(opt[1], 2)})`, { dx: -10, dy: 18, anchor: 'end', small: true });
    const hb = [b / 2 - 2.1 * u[0], b / 2 - 2.1 * u[1]];
    f.handle(hb[0], hb[1], { c: 'c1', label: T('Move the constraint line', '制約の直線を動かす'), onDrag: (x, y) => ctx.set('b', x + y) });
    f.handle(Qp[0], Qp[1], { c: 'c2', label: T('Trial point on the line', '直線上の試験点'), onDrag: (x, y) => { st.s = L.clamp((x - b / 2) * u[0] + (y - b / 2) * u[1], -3, 3); ctx.redraw(); } });
    f.text(hb[0], hb[1], `x + y ${ineq ? '≥' : '='} ${fmt(b, 2)}`, { dx: 14, dy: -10, anchor: 'start', c: 'c1', small: true });
    L.h('p', 'lab-cap', host2, st.flat ? T('The objective along the line, at signed position s', '直線に沿った目的関数（位置 s）') : T('The objective along the line, at signed position s: the same parabola as the cut in the 3D view', '直線に沿った目的関数（位置 s）。3D 図の切り口と同じ放物線です'));
    const g = L.fig(host2, { x: [-3, 3], y: [0, 14], aspect: st.flat ? 0.9 : 0.34, maxH: st.flat ? 400 : 230, xlabel: T('position along the line s', '直線上の位置 s'), ylabel: 'f' });
    g.line(L.sample(-3, 3, 200, (x) => b * b / 2 + x * x), { c: 'c1', w: 2.6 });
    g.hline(fstar, { c: 'hl', dash: '6 4', w: 1.6 });
    g.dot(0, b * b / 2, { c: active ? 'hl' : 'muted', r: 5.5 });
    g.dot(s, b * b / 2 + s * s, { c: 'c2', r: 5.5 });
    g.text(s, b * b / 2 + s * s, `f = ${fmt(fQ, 2)}`, { dx: s > 0 ? -10 : 10, anchor: s > 0 ? 'end' : 'start', dy: -6, small: true });
    if (!active) g.text(0, fstar, T('unconstrained minimum 0 is feasible', '制約なしの最小値 0 が実行可能'), { dy: -8, small: true });
    L.legend(st.leg, [{ c: 'c1', label: ineq ? T('boundary x + y = b', '境界 x + y = b') : T('constraint x + y = b', '制約 x + y = b') }, { c: 'hl', label: T('smallest reachable contour', '到達できる最小の等高線') }, { c: 'c2', dash: true, label: T('contour through the trial point', '試験点を通る等高線') }].concat(ineq ? [{ kind: 'fill', c: 'c3', label: T('feasible region', '実行可能領域') }] : []));
    ctx.readout([{ k: '(x*, y*)', v: `(${fmt(opt[0], 3)}, ${fmt(opt[1], 3)})` }, { k: 'f*', v: fmt(fstar, 3), tone: 'key' }, { k: 'λ*', v: fmt(lam, 3) }, { k: T('trial f', '試験点の f'), v: fmt(fQ, 3) }],
      !active ? T('With x + y ≥ b and b ≤ 0, the origin is feasible: the constraint is inactive and its multiplier is 0.', 'x + y ≥ b で b ≤ 0 なら原点が実行可能です。制約は効いておらず、乗数は0です。') : T('At the optimum the gold contour just touches the line, so ∇f = λ∇(x + y) is perpendicular to it. In 3D, the gold ring is that contour lifted to the height f*.', '最適点では金色の等高線が直線にちょうど接するので、∇f = λ∇(x + y) は直線に垂直です。3D では、金色の輪はその等高線を高さ f* まで持ち上げたものです。'));
    return { opt, fstar, fQ, Qp, active, ineq };
  }
  D.constraint = {
    three: true,
    render(ctx, v) {
      const st = constraintFrame(ctx);
      st.s ??= 1.3;
      const Z = (x, y) => CS * (x * x + y * y);
      const ring = (r, z, n = 120) => L.seq(n + 1, (i) => [r * Math.cos(L.TAU * i / n), r * Math.sin(L.TAU * i / n), z]);
      const TOP = CS * CR * CR + 0.15;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 430, camera: [-6.0, -8.6, 9.4], target: [0.2, 0.2, 1.0], fov: 29,
        init(S) {
          st.flat = false; st.key3 = null;
          st.bowl = S.surface((a, r) => [r * Math.cos(a), r * Math.sin(a), CS * r * r], { u: [0, L.TAU], v: [0, CR], nu: 120, nv: 48, rough: 0.5, coat: 0.3, wire: true, wireEvery: 10, wireEveryV: 8 });
          st.plane = S.surface(() => [0, 0, 0], { u: [-1, 1], v: [0, 1], nu: 64, nv: 2, c: 'c1', opacity: 0.3, rough: 0.9, coat: 0 });
          st.plane.userData.noOcclude = true;
          st.edge = S.lines([], { c: 'c1', opacity: 0.55 });
          st.cut = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.042 });
          st.ringH = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.034, closed: true, glow: 0.2 });
          st.ringQ = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c2', r: 0.02, closed: true });
          st.opt = S.sphere([0, 0, 0], 0.12, { c: 'hl', glow: 0.3 });
          st.drop = S.lines([], { c: 'hl', opacity: 0.8 });
          st.hq = S.handle([0, 0, 0], { c: 'c2', r: 0.12, plane: [[Math.SQRT1_2, Math.SQRT1_2, 0], [0, 0, 0]], onDrag: (q) => { const bb = st.b3; st.s = L.clamp((q.x - bb / 2) * CU[0] + (q.y - bb / 2) * CU[1], -3, 3); ctx.redraw(); const x = bb / 2 + st.s * CU[0], y = bb / 2 + st.s * CU[1]; return [x, y, Z(x, y) + 0.03]; } });
          st.hb = S.handle([0, 0, TOP], { c: 'c1', r: 0.1, plane: [[0, 0, 1], [0, 0, TOP]], onDrag: (q) => { ctx.set('b', L.clamp(Math.round((q.x + q.y) * 10) / 10, -3, 3)); } });
          st.lb = S.label('', [0, 0, TOP], { small: true, c: 'c1', dy: -14 });
          st.lopt = S.label('', [0, 0, 0], { small: true, align: 'end', dx: -10 });
        },
        update(S, vv) {
          const r2 = constraint2d(ctx, vv, st), b = vv.b, ineq = r2.ineq;
          st.b3 = b;
          const key = `${b}|${ineq}`;
          if (st.key3 !== key) {
            st.key3 = key;
            const zmax = CS * CR * CR, dim = S.colour('muted'), lo = S.colour('c1').clone().lerp(S.colour('plate'), 0.35), hi = S.colour('c3').clone().lerp(S.colour('plate'), 0.1);
            st.bowl.update((a, r) => [r * Math.cos(a), r * Math.sin(a), CS * r * r], (a, r, p) => { const c = lo.clone().lerp(hi, Math.sqrt(p[2] / zmax)); return ineq && p[0] + p[1] < b ? c.clone().lerp(dim, 0.45).lerp(S.colour('plate'), 0.5) : c; });
            const base = [b / 2, b / 2], half = Math.sqrt(Math.max(0, CR * CR - b * b / 2));
            const P = (t, h) => [base[0] + t * CU[0], base[1] + t * CU[1], h];
            st.plane.update((t, h) => { const q = P(t * half, 0), z0 = Z(q[0], q[1]); return P(t * half, z0 + h * (TOP - z0)); });
            st.edge.update([[P(-half, TOP), P(half, TOP)]]);
            st.cut.update(L.seq(81, (i) => { const t = -half + 2 * half * i / 80, x = base[0] + t * CU[0], y = base[1] + t * CU[1]; return [x, y, Z(x, y) + 0.02]; }));
            const rs = Math.hypot(...r2.opt);
            st.ringH.visible = rs > 0.02; if (rs > 0.02) st.ringH.update(ring(rs, CS * rs * rs + 0.015));
            st.opt.at([r2.opt[0], r2.opt[1], CS * rs * rs + 0.03]);
            st.drop.update([[[r2.opt[0], r2.opt[1], 0], [r2.opt[0], r2.opt[1], CS * rs * rs]]]);
            const hpt = P(-half, TOP);
            st.hb.at(hpt); st.lb.set(hpt, `x + y ${ineq ? '≥' : '='} ${fmt(b, 2)}`);
            st.lopt.set([r2.opt[0], r2.opt[1], CS * rs * rs + 0.05], `f* = ${fmt(r2.fstar, 2)}`);
          }
          st.hq.userData.handle.plane = [[Math.SQRT1_2, Math.SQRT1_2, 0], [b / 2, b / 2, 0]];
          st.hq.at([r2.Qp[0], r2.Qp[1], Z(r2.Qp[0], r2.Qp[1]) + 0.03]);
          const rq = Math.sqrt(r2.fQ);
          st.ringQ.visible = rq <= CR + 0.01 && rq > 0.02; if (st.ringQ.visible) st.ringQ.update(ring(rq, CS * r2.fQ + 0.012));
          S.invalidate();
        },
        fallback(c, vv) { st.flat = true; constraint2d(c, vv, st); },
      });
      if (!st.__v3 && !st.flat) constraint2d(ctx, v, st);
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
      const sl = b - lam;
      if (gap > 0.05) {
        g.seg([lam, gl], [lam, fs], { c: 'c2', w: 2.4 });
        // The tangent of g at λ rises on the side where b − λ points, so the label goes to the other side,
        // and it stays a line-height below the dashed f* line.
        const left = lam > 2.6 ? true : lam < -2.6 ? false : sl > 0;
        const rises = left ? sl < 0 : sl > 0; // near the frame edge the tangent may rise on the chosen side
        const ppu = (g.Y(0) - g.Y(1)); // pixels per unit of g
        const yl = Math.max(Math.min((gl + fs) / 2, fs - 16 / ppu), gl + 4 / ppu);
        const lbl = `${T('gap', 'ギャップ')} ${fmt(gap, 3)}`;
        if (rises) g.text(lam, gl, lbl, { dx: left ? -12 : 12, dy: 22, anchor: left ? 'end' : 'start', small: true, c: 'c2' });
        else g.text(lam, yl, lbl, { dx: left ? -10 : 10, dy: 4, anchor: left ? 'end' : 'start', small: true, c: 'c2' });
      }
      g.line([[lam - 1.2, gl - 1.2 * sl], [lam + 1.2, gl + 1.2 * sl]], { c: 'ink', w: 1.4, op: 0.7 });
      g.handle(lam, gl, { c: 'hl', axis: 'x', bounds: [-4, 4, -6, 5.5], label: T('Trial multiplier λ', '試す乗数 λ'), onDrag: (x) => ctx.set('lambda', x) });
      L.legend(ctx.host, [{ c: 'c1', label: 'f*(b) = b²/2' }, { c: 'c2', dash: true, label: T('tangent, slope λ* = b', '接線、傾き λ* = b') }, { c: 'c4', label: 'g(λ) = λb − λ²/2' }, { c: 'ink', label: T('slope of g = b − λ, the constraint violation', 'g の傾き = b − λ（制約の違反量）') }]);
      ctx.readout([{ k: 'g(λ)', v: fmt(gl, 3) }, { k: 'f*', v: fmt(fs, 3) }, { k: T('gap f* − g(λ) = (b − λ)²/2', 'ギャップ f* − g(λ) = (b − λ)²/2'), v: fmt(gap, 3), tone: gap < 1e-9 ? 'good' : 'key' }, { k: T('minimizer of L', 'L の最小点'), v: `(${fmt(lam / 2, 2)}, ${fmt(lam / 2, 2)})` }, { k: 'b − x − y', v: fmt(sl, 3) }],
        T('For a trial λ, minimizing L gives x = y = λ/2, which misses the constraint by b − λ. Raising λ toward b closes the gap.', '試す λ で L を最小化すると x = y = λ/2 となり、制約を b − λ だけ外します。λ を b に近づけるとギャップが閉じます。'));
    },
  };
})();
