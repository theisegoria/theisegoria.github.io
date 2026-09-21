'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * Math.PI;

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  // pendulum H = p^2/2 - cos q, RK4 step
  function pendStep(q, p, h) {
    const f = (Q, P) => [P, -Math.sin(Q)];
    const [a1, b1] = f(q, p), [a2, b2] = f(q + h / 2 * a1, p + h / 2 * b1), [a3, b3] = f(q + h / 2 * a2, p + h / 2 * b2), [a4, b4] = f(q + h * a3, p + h * b3);
    return [q + h / 6 * (a1 + 2 * a2 + 2 * a3 + a4), p + h / 6 * (b1 + 2 * b2 + 2 * b3 + b4)];
  }
  // evolve a disc boundary; returns frames[f] = array of [q,p] (unwrapped), frame spacing dtFrame
  function flowDisc(q0, p0, r, tMax, M = 720, dtFrame = 0.1, h = 0.02) {
    let pts = L.seq(M, (i) => [q0 + r * Math.cos(TAU * i / M), p0 + r * Math.sin(TAU * i / M)]);
    const frames = [pts.map((x) => x.slice())];
    const sub = Math.round(dtFrame / h);
    for (let fr = 1; fr * dtFrame <= tMax + 1e-9; fr++) {
      for (let s = 0; s < sub; s++) pts = pts.map(([q, p]) => pendStep(q, p, h));
      frames.push(pts.map((x) => x.slice()));
    }
    return frames;
  }
  const shoelace = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };

  // Kepler problem with unit mass and GM = 1
  const acc = (x, y) => { const r = Math.hypot(x, y), r3 = r * r * r; return [-x / r3, -y / r3]; };
  const energy = (s) => (s[2] * s[2] + s[3] * s[3]) / 2 - 1 / Math.hypot(s[0], s[1]);
  const kepler = {
    euler(s, h) { const a = acc(s[0], s[1]); return [s[0] + h * s[2], s[1] + h * s[3], s[2] + h * a[0], s[3] + h * a[1]]; },
    leapfrog(s, h) { let a = acc(s[0], s[1]); const px = s[2] + h / 2 * a[0], py = s[3] + h / 2 * a[1]; const x = s[0] + h * px, y = s[1] + h * py; a = acc(x, y); return [x, y, px + h / 2 * a[0], py + h / 2 * a[1]]; },
    rk4(s, h) {
      const f = (u) => { const a = acc(u[0], u[1]); return [u[2], u[3], a[0], a[1]]; };
      const add = (u, k, c) => u.map((x, i) => x + c * k[i]);
      const k1 = f(s), k2 = f(add(s, k1, h / 2)), k3 = f(add(s, k2, h / 2)), k4 = f(add(s, k3, h));
      return s.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    },
  };
  function integrateKepler(method, e, h, tMax) {
    let s = [1 - e, 0, 0, Math.sqrt((1 + e) / (1 - e))];
    const E0 = energy(s), n = Math.ceil(tMax / h), out = [], errs = [];
    const every = Math.max(1, Math.floor(n / 3000));
    for (let i = 0; i <= n; i++) {
      if (i % every === 0 || i === n) { out.push([s[0], s[1]]); errs.push([i * h, (energy(s) - E0) / Math.abs(E0)]); }
      if (i === n) break;
      s = kepler[method](s, h);
      if (!s.every(Number.isFinite) || Math.hypot(s[0], s[1]) > 40) { errs.push([(i + 1) * h, NaN]); break; }
    }
    return { pts: out, errs, final: errs.filter((x) => Number.isFinite(x[1])).at(-1)[1] };
  }

  // Rippled central potential V = r^4/4 (1 + eps cos n phi), leapfrog
  function rippleForce(x, y, eps, n) {
    const r2 = x * x + y * y, phi = Math.atan2(y, x), c = Math.cos(n * phi), s = Math.sin(n * phi);
    // dV/dx = r^2 x (1 + eps c) + (r^4/4) eps (-n s) dphi/dx, with dphi/dx = -y/r^2, dphi/dy = x/r^2
    const k = 0.25 * r2 * eps * n * s;
    return [-(r2 * x * (1 + eps * c) + k * y), -(r2 * y * (1 + eps * c) - k * x)];
  }
  const rippleV = (x, y, eps, n) => { const r2 = x * x + y * y; return 0.25 * r2 * r2 * (1 + eps * Math.cos(n * Math.atan2(y, x))); };
  function integrateRipple(eps, n, tMax, h = 0.005) {
    let x = 1, y = 0, px = 0.3, py = 0.75;
    const out = [];
    const N = Math.round(tMax / h), every = Math.max(1, Math.floor(N / 4000));
    for (let i = 0; i <= N; i++) {
      if (i % every === 0) out.push({ t: i * h, x, y, L: x * py - y * px, E: (px * px + py * py) / 2 + rippleV(x, y, eps, n) });
      let a = rippleForce(x, y, eps, n); px += h / 2 * a[0]; py += h / 2 * a[1];
      x += h * px; y += h * py;
      a = rippleForce(x, y, eps, n); px += h / 2 * a[0]; py += h / 2 * a[1];
    }
    return out;
  }
  (window.LabModels = window.LabModels || {})['hamiltonian-mechanics'] = { pendStep, flowDisc, shoelace, integrateKepler, energy, integrateRipple, rippleForce, rippleV };

  /* ---------- 1. phase flow ---------- */
  D['phase-flow'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, key = `${v.q0}|${v.p0}|${v.radius}`;
      if (st.key !== key) { st.frames = flowDisc(v.q0, v.p0, v.radius, 16); st.key = key; st.area0 = shoelace(st.frames[0]); }
      const H = (q, p) => p * p / 2 - Math.cos(q);
      L.h('p', 'lab-cap', ctx.host, T('Phase space of a pendulum: angle q across, momentum p up. Drag the dashed disc to move the initial states.', '振り子の相空間：横が角度 q、縦が運動量 p。点線の円板をドラッグすると初期状態を動かせます。'));
      const f = L.fig(ctx.host, { x: [-PI, PI], y: [-2.9, 2.9], aspect: 0.62, maxH: 460, piX: true, xlabel: T('angle q', '角度 q'), ylabel: T('momentum p', '運動量 p'), grid: false });
      const col = L.colours();
      f.raster((q, p) => { const E = H(q, p); const t = E < 1 ? 0.2 * (1 - (E + 1) / 2) + 0.05 : 0; return [0, 1, 2].map((i) => col.plate[i] + (col.c1[i] - col.plate[i]) * t); }, { res: 3 });
      // energy contours drawn explicitly: p = ±sqrt(2(E + cos q))
      const level = (E, o) => { for (const sg of [1, -1]) { const pts = L.sample(-PI, PI, 400, (q) => { const u = 2 * (E + Math.cos(q)); return u >= 0 ? sg * Math.sqrt(u) : NaN; }); f.line(pts, o); } };
      [-0.8, -0.5, -0.2, 0.2, 0.6, 1.5, 2.3, 3.2].forEach((E) => level(E, { c: 'muted', w: 1, op: 0.55, layer: 'under' }));
      level(1, { c: 'ink', w: 2, op: 0.7, layer: 'under' });
      // initial disc (dashed) and its draggable centre
      const disc = L.seq(121, (i) => [v.q0 + v.radius * Math.cos(TAU * i / 120), v.p0 + v.radius * Math.sin(TAU * i / 120)]);
      f.line(disc, { c: 'ink', w: 1.4, dash: '4 3', layer: 'under' });
      f.handle(v.q0, v.p0, { c: 'ink', r: 7, label: T('Centre of the initial disc', '初期円板の中心'), bounds: [-3, 3, -2.5, 2.5], onDrag: (x, y) => { ctx.set('q0', x, true); ctx.set('p0', y, true); ctx.redraw(); } });
      const wrapQ = (q) => ((q + PI) % TAU + TAU) % TAU - PI;
      const drawAt = (t) => {
        f.clear('main');
        const k = L.clamp(Math.round(t / 0.1), 0, st.frames.length - 1), pts = st.frames[k];
        // draw the unwrapped blob at the shifts that can intersect the window
        const cq = pts.reduce((s, x) => s + x[0], 0) / pts.length, base = cq - wrapQ(cq);
        let qmin = Infinity, qmax = -Infinity; pts.forEach(([q]) => { qmin = Math.min(qmin, q); qmax = Math.max(qmax, q); });
        for (let s = -3; s <= 3; s++) { const sh = s * TAU - base; if (qmax + sh < -PI - 0.1 || qmin + sh > PI + 0.1) continue; f.poly(pts.map(([q, p]) => [q + sh, p]), { c: 'hl', fo: 0.55, w: 1.6 }); }
        const area = shoelace(pts);
        ctx.readout([{ k: 't', v: fmt(k * 0.1, 1) }, { k: T('area now', '現在の面積'), v: fmt(area, 4), tone: 'key' }, { k: T('initial area πr²', '初期面積 πr²'), v: fmt(PI * v.radius * v.radius, 4) }, { k: T('ratio', '比'), v: fmt(area / st.area0, 4), tone: Math.abs(area / st.area0 - 1) < 0.01 ? 'good' : 'warn' }, { k: T('energy of centre', '中心のエネルギー'), v: fmt(H(v.q0, v.p0), 3) }],
          H(v.q0, v.p0) > 1 ? T('Above the separatrix the states rotate over the top, and the blob winds round the cylinder: it leaves on the right and returns on the left.', 'セパラトリクスより上では状態は頂点を越えて回り、塊は円柱に巻きつきます。右から出て左から戻ります。') : T('The disc is sheared, not squeezed: inner orbits are faster than outer ones, so it spirals into a filament of the same area.', '円板は押し潰されずにせん断されます。内側の軌道ほど速いので、同じ面積の糸へと巻き込まれます。'));
      };
      drawAt(v.t);
      st.anim = L.animator(ctx.host, (dt, t) => { if (t === 0 && dt === 0) { drawAt(v.t); return; } const tt = Math.min(16, t); ctx.set('t', tt, true); drawAt(tt); if (tt >= 16) return false; }, { autoplay: false, initialT: 0, once: true, playLabel: T('Run the flow from t = 0', 't = 0 から流す') });
      L.legend(ctx.host, [{ kind: 'fill', c: 'hl', label: T('the evolved set of states', '時間発展した状態の集合') }, { c: 'ink', label: T('separatrix H = 1', 'セパラトリクス H = 1') }, { c: 'muted', label: T('other energy levels', '他のエネルギー準位') }]);
    },
  };

  /* ---------- 2. symplectic integrators ---------- */
  D.symplectic = {
    render(ctx, v) {
      const tMax = v.orbits * TAU, e = v.ecc;
      const runs = [['euler', 'c2', T('explicit Euler', '陽的オイラー法')], ['rk4', 'c1', 'RK4'], ['leapfrog', 'c3', T('leapfrog (symplectic)', 'リープフロッグ法（シンプレクティック）')]].map(([m, c, name]) => ({ m, c, name, ...integrateKepler(m, e, v.h, tMax) }));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The orbit in the plane: faint trails, with the final orbit drawn bold. The dashed ellipse is the exact orbit.', '平面上の軌道：薄い軌跡と、太く描いた最後の一周。点線の楕円が厳密な軌道です。'));
      const a = 1, b = Math.sqrt(1 - e * e);
      const f = L.fig(c1, { x: [-3.4, 1.9], y: [-2.3, 2.3], equal: true, maxH: 420, grid: false });
      f.line(L.seq(241, (i) => { const t = TAU * i / 240; return [a * Math.cos(t) - a * e, b * Math.sin(t)]; }), { c: 'ink', w: 1.3, dash: '5 4', op: 0.8 });
      f.dot(0, 0, { c: 'hl', r: 7 });
      const perOrbit = (r) => Math.max(2, Math.round(r.pts.length * TAU / Math.max(TAU, r.errs.at(-1)[0])));
      runs.forEach((r) => f.line(r.pts, { c: r.c, w: 0.8, op: 0.28 }));
      runs.forEach((r) => f.line(r.pts.slice(-perOrbit(r) - 1), { c: r.c, w: 2.4 }));
      runs.forEach((r) => { const p = r.pts.at(-1); if (Number.isFinite(p[0])) f.dot(p[0], p[1], { c: r.c, r: 4.5 }); });
      L.h('p', 'lab-cap', c2, T('Relative energy error against time (signed log scale)', '相対エネルギー誤差と時間（符号付き対数目盛）'));
      const TH = 1e-7, sl = (x) => (Math.abs(x) < TH ? x / TH : Math.sign(x) * (1 + Math.log10(Math.abs(x) / TH)));
      const ticksY = [[0, '0'], [sl(1e-5), '10⁻⁵'], [sl(1e-3), '10⁻³'], [sl(0.1), '0.1'], [sl(10), '10'], [sl(-1e-5), '−10⁻⁵'], [sl(-1e-3), '−10⁻³'], [sl(-0.1), '−0.1']];
      const g = L.fig(c2, { x: [0, v.orbits], y: [sl(-1), sl(30)], aspect: 0.85, maxH: 420, xlabel: T('time (orbits)', '時間（周回数）'), ticksY });
      runs.forEach((r) => g.line(r.errs.map(([t, x]) => [t / TAU, Number.isFinite(x) ? sl(x) : NaN]), { c: r.c, w: r.m === 'leapfrog' ? 1.2 : 2, op: 0.9 }));
      g.hover((x) => { const t = x * TAU; const vals = runs.map((r) => { const k = r.errs.findIndex((q) => q[0] >= t); return k < 0 ? null : r.errs[k][1]; }); return { x, text: `${fmt(x, 1)}: E ${fmt(vals[0] ?? NaN, 2)}, R ${fmt(vals[1] ?? NaN, 2)}, L ${fmt(vals[2] ?? NaN, 2)}` }; });
      L.legend(ctx.host, runs.map((r) => ({ c: r.c, label: r.name })));
      const sci = (x) => (Math.abs(x) < 1e-12 ? '0' : Math.abs(x) >= 0.01 ? fmt(x, 3) : fmt(Number(x.toPrecision(2)), 6));
      const out = runs.map((r) => ({ k: r.name, v: sci(r.final), tone: r.m === 'leapfrog' ? 'good' : r.m === 'euler' ? 'warn' : undefined }));
      const lfMax = Math.max(...runs[2].errs.map((x) => Math.abs(x[1])));
      ctx.readout(out.concat([{ k: T('leapfrog worst error', 'リープフロッグ法の最大誤差'), v: sci(lfMax), tone: 'key' }]), T('Each chip is the relative energy error at the end of the run. Lengthen the run: RK4 keeps drifting down, leapfrog keeps oscillating within the same band.', '各チップは実行終了時の相対エネルギー誤差です。実行時間を延ばすと、RK4 は下がり続け、リープフロッグ法は同じ幅の中で振動し続けます。'));
    },
  };

  /* ---------- 3. Noether ---------- */
  D.noether = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const run = integrateRipple(v.eps, v.n, v.time);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The orbit over the potential (darker is higher)', 'ポテンシャル上の軌道（濃いほど高い）'));
      const f = L.fig(c1, { x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, maxH: 400, grid: false, axes: false });
      f.raster((x, y) => Math.min(1, Math.sqrt(rippleV(x, y, v.eps, v.n) / 1.6)) * 0.42, { cmap: 'seq', res: 2 });
      f.line(run.map((s) => [s.x, s.y]), { c: 'c1', w: 1.1, op: 0.55 });
      L.h('p', 'lab-cap', c2, T('Angular momentum L and energy E along the run', '実行中の角運動量 L とエネルギー E'));
      const Ls = run.map((s) => s.L), Es = run.map((s) => s.E);
      const lo = Math.min(...Ls, ...Es), hi = Math.max(...Ls, ...Es), pad = Math.max(0.05, (hi - lo) * 0.12);
      const g = L.fig(c2, { x: [0, v.time], y: [Math.min(0, lo - pad), hi + pad], aspect: 0.8, maxH: 380, xlabel: T('time', '時間') });
      g.line(run.map((s) => [s.t, s.E]), { c: 'c3', w: 2.4, layer: 'under' });
      g.line(run.map((s) => [s.t, s.L]), { c: 'c2', w: 2.2, layer: 'under' });
      g.text(v.time * 0.98, run.at(-1).E, 'E', { anchor: 'end', c: 'c3', math: true, dy: -8 });
      g.text(v.time * 0.98, run.at(-1).L, 'L', { anchor: 'end', c: 'c2', math: true, dy: 16 });
      const draw = (t) => {
        f.clear('over'); g.clear('main');
        const k = Math.min(run.length - 1, run.findIndex((s) => s.t >= t) < 0 ? run.length - 1 : run.findIndex((s) => s.t >= t));
        const tail = run.slice(Math.max(0, k - 120), k + 1).map((s) => [s.x, s.y]);
        f.line(tail, { c: 'c1', w: 3, layer: 'over' });
        f.dot(run[k].x, run[k].y, { c: 'hl', r: 6.5 });
        g.vline(run[k].t, { c: 'hl', w: 1.4, dash: '3 3', layer: 'main' });
        g.dot(run[k].t, run[k].L, { c: 'c2', r: 4.5 }); g.dot(run[k].t, run[k].E, { c: 'c3', r: 4.5 });
      };
      draw(v.time);
      ctx.state.anim = L.animator(ctx.host, (dt, t) => { const tt = Math.min(v.time, t * 4); draw(tt); if (tt >= v.time) return false; }, { autoplay: false, once: true, initialT: v.time / 4, playLabel: T('Replay the particle', '粒子を再生') });
      const Lmin = Math.min(...Ls), Lmax = Math.max(...Ls), Emin = Math.min(...Es), Emax = Math.max(...Es);
      L.legend(ctx.host, [{ c: 'c1', label: T('trajectory', '軌道') }, { c: 'c2', label: T('angular momentum L', '角運動量 L') }, { c: 'c3', label: T('energy E', 'エネルギー E') }]);
      ctx.readout([{ k: T('L range', 'L の範囲'), v: `${fmt(Lmin, 3)} … ${fmt(Lmax, 3)}`, tone: v.eps === 0 ? 'good' : 'warn' }, { k: T('E range', 'E の範囲'), v: `${fmt(Emin, 4)} … ${fmt(Emax, 4)}`, tone: 'good' }, { k: T('symmetry', '対称性'), v: v.eps === 0 ? T('all rotations', 'すべての回転') : T(`${v.n}-fold only`, `${v.n} 回対称のみ`), tone: 'key' }],
        v.eps === 0 ? T('With a round potential, L is constant to rounding error and the orbit is a rosette confined between two circles.', '丸いポテンシャルでは L は丸め誤差の範囲で一定で、軌道は二つの円の間に収まるロゼットです。') : T('The ripple exerts a torque, so L swaps back and forth with the radial motion while E stays put: energy survives because the potential still does not depend on time.', 'うねりがトルクを及ぼすので、L は動径方向の運動と行き来しますが E は動きません。ポテンシャルが時間に依存しないので、エネルギーは保存されたままです。'));
    },
  };
})();
