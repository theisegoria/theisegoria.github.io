'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  // A Play bar that sweeps the time slider from its current value to tmax, drawing each frame.
  function sweep(ctx, host, v, tmax, rate, draw) {
    ctx.state.anim = L.animator(host, (dt, t, lab) => {
      const tt = Math.min(tmax, t * rate);
      draw(tt);
      lab.textContent = `t = ${tt.toFixed(1)}`;
      if (dt > 0) ctx.set('time', tt, true);
      return tt < tmax;
    }, { autoplay: false, once: true, initialT: v.time / rate, playLabel: T('Play', '再生') });
  }

  /* ---------------- 1. Heat equation by finite differences ---------------- */
  const LEN = 10, NX = 101, DX = LEN / (NX - 1), TMAX = 40, NS = 400;
  const hotSpot = (x) => Math.exp(-((x - 3) ** 2) / (2 * 0.35 ** 2)) + 0.45 * Math.exp(-((x - 7.2) ** 2) / (2 * 0.6 ** 2));
  function heat(kappa, fixed) {
    const dt = 0.4 * DX * DX / kappa, r = kappa * dt / (DX * DX);
    let u = Float64Array.from({ length: NX }, (_, i) => hotSpot(i * DX)), w = new Float64Array(NX);
    if (fixed) { u[0] = 0; u[NX - 1] = 0; }
    const snaps = [Float64Array.from(u)];
    let t = 0;
    for (let s = 1; s <= NS; s++) {
      const target = s * TMAX / NS;
      while (t < target - 1e-12) {
        const h = Math.min(dt, target - t), rr = kappa * h / (DX * DX);
        for (let i = 1; i < NX - 1; i++) w[i] = u[i] + rr * (u[i - 1] - 2 * u[i] + u[i + 1]);
        if (fixed) { w[0] = 0; w[NX - 1] = 0; } else { w[0] = u[0] + 2 * rr * (u[1] - u[0]); w[NX - 1] = u[NX - 1] + 2 * rr * (u[NX - 2] - u[NX - 1]); }
        [u, w] = [w, u]; t += h;
      }
      snaps.push(Float64Array.from(u));
    }
    return { snaps, r };
  }
  const total = (u) => { let s = 0; for (let i = 0; i < NX; i++) s += (i === 0 || i === NX - 1 ? 0.5 : 1) * u[i] * DX; return s; };
  function heatFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null; st.prof = null; st.hkey = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('The whole history as a surface: height is the temperature u(x, t), position x runs across, time t runs away from you. The blue curve is the rod now. Drag to turn it.', '全経過を曲面で表します。高さが温度 u(x, t)、横方向が位置 x、奥へ向かう方向が時間 t です。青い曲線が現在の棒です。ドラッグで回転できます。'));
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, T('Temperature along the rod at time t', '時刻 t での棒に沿った温度'));
    st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  // scene coordinates for the space-time surface
  const HX = (x) => (x - LEN / 2) * 0.42, HY = (t) => (t - TMAX / 2) * 0.105, HZ = (u) => u * 1.55;
  D.heat = {
    three: true,
    render(ctx, v) {
      const st = heatFrame(ctx);
      const fixed = v.bc > 0.5, key = `${v.kappa}|${fixed}`;
      if (st.hkey !== key) { st.H = heat(v.kappa, fixed); st.hkey = key; st.prof = null; st.rast = null; st.surfKey = null; }
      const H = st.H, snap = (t) => H.snaps[Math.round(L.clamp(t, 0, TMAX) / TMAX * NS)];
      const Q0 = total(H.snaps[0]);
      const xs = (u) => Array.from(u, (y, i) => [i * DX, y]);
      if (!st.prof || !st.prof.svg.isConnected) {
        st.g2.replaceChildren();
        const f = st.prof = L.fig(st.g2, { x: [0, LEN], y: [0, 1.1], aspect: 0.62, maxH: 340, xlabel: T('position x', '位置 x'), ylabel: 'u' });
        f.line(xs(H.snaps[0]), { c: 'muted', w: 1.4, dash: '4 4' });
        if (!fixed) f.hline(Q0 / LEN, { c: 'c3', w: 1.4, dash: '6 4' });
        f.layers.dyn = f.group('main');
      }
      // the flat fallback: the space-time picture as a raster, as before
      const drawRaster = () => {
        if (st.rast && st.rast.svg.isConnected) return;
        st.v3.replaceChildren();
        st.cap1.textContent = T('Space–time picture: each row is the rod at one moment, time running downward. Each row is scaled to its own peak, so the spreading shape stays visible after the rod has cooled.', '時空図：各行がある時刻の棒で、時間は下向きに進みます。各行はその時刻の最高温度で正規化しているので、冷えた後も広がりの形が見えます。');
        const g = st.rast = L.fig(st.v3, { x: [0, LEN], y: [-TMAX, 0], aspect: 0.62, maxH: 360, grid: false, xlabel: T('position x', '位置 x'), ylabel: T('time (down)', '時間（下向き）'), ticksY: [0, 10, 20, 30, 40].map((t) => [-t, String(t)]) });
        const rowMax = H.snaps.map((u) => { let m = 0; for (let i = 0; i < NX; i++) if (u[i] > m) m = u[i]; return m || 1; });
        g.raster((x, y) => { const si = Math.round(L.clamp(-y, 0, TMAX) / TMAX * NS), u = H.snaps[si], i = Math.min(NX - 2, Math.floor(x / DX)), a = x / DX - i; return Math.pow(L.clamp((u[i] * (1 - a) + u[i + 1] * a) / rowMax[si], 0, 1), 0.8); }, { cmap: 'warm', res: 3 });
      };
      const draw = (t) => {
        const u = snap(t), f = st.prof;
        f.clear('dyn');
        f.area(xs(u), { c: 'c1', fo: 0.14, layer: 'dyn' });
        f.line(xs(u), { c: 'c1', w: 2.8, layer: 'dyn' });
        let im = 0; for (let i = 0; i < NX; i++) if (u[i] > u[im]) im = i;
        f.dot(im * DX, u[im], { c: 'hl', r: 5.5, layer: 'dyn' });
        if (st.flat) { drawRaster(); st.rast.clear('over'); st.rast.hline(-t, { c: 'c1', w: 2, dash: false, layer: 'over' }); }
        else st.draw3d?.(t, u, im);
        ctx.readout([{ k: T('peak temperature', '最高温度'), v: fmt(u[im], 3), tone: 'key' }, { k: T('total heat ∫u dx', '総熱量 ∫u dx'), v: fmt(total(u), 3), tone: fixed ? 'warn' : 'good' }, { k: T('at t = 0', 't = 0 で'), v: fmt(Q0, 3) }, { k: 'r = κΔt/Δx²', v: fmt(H.r, 2) }],
          fixed ? T('Ends held at 0 act as sinks: heat leaks out through them and the total falls toward zero.', '0 に保たれた端は熱の吸い込み口として働き、熱が逃げて総量は 0 に向かいます。')
            : T(`Insulated ends: no heat escapes, so the total stays at ${fmt(Q0, 3)} and the rod settles to the mean temperature ${fmt(Q0 / LEN, 3)}.`, `断熱端：熱は逃げないので総量は ${fmt(Q0, 3)} のまま保たれ、棒は平均温度 ${fmt(Q0 / LEN, 3)} に落ち着きます。`));
      };
      st.anim?.stop(); st.bar.replaceChildren();
      const rate = 6;
      st.anim = L.animator(st.bar, (dt, t, lab) => {
        const tt = Math.min(TMAX, t * rate);
        draw(tt);
        lab.textContent = `t = ${tt.toFixed(1)}`;
        if (dt > 0) ctx.set('time', Math.round(tt), true);
        return tt < TMAX;
      }, { autoplay: false, once: true, initialT: v.time / rate, playLabel: T('Play', '再生') });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('the rod at the current time', '現在時刻の棒') }, { kind: 'dot', c: 'hl', label: T('hottest point', '最も熱い点') }, { c: 'muted', dash: true, label: T('initial state', '初期状態') }].concat(fixed ? [] : [{ c: 'c3', dash: true, label: T('final uniform temperature', '最終的な一様温度') }]));
      const narrow = ctx.host.clientWidth < 560;
      L.view3d(ctx, v, {
        host: st.v3, aspect: narrow ? 0.92 : 0.74, maxH: 460, camera: narrow ? [3.7, -8.6, 5.6] : [3.3, -7.6, 4.9], target: [0, 0.1, 0.25], fov: 34,
        init(S) {
          st.flat = false;
          const NT = 80;
          st.surf = S.surface(() => [0, 0, 0], { u: [0, NX - 1], v: [0, NT], nu: NX - 1, nv: NT, colour: () => S.colour('c2'), rough: 0.5, coat: 0.25, wire: true, wireEvery: 10, wireEveryV: 8 });
          st.setSurf = () => {
            const Hs = st.H.snaps, si = (j) => Math.round(j / NT * NS);
            st.surf.update((i, j) => { const ii = Math.round(i), jj = Math.round(j); return [HX(ii * DX), HY(jj / NT * TMAX), HZ(Hs[si(jj)][ii])]; },
              (i, j, p) => S.cmap.warm(Math.pow(L.clamp(p[2] / HZ(1), 0, 1), 0.7)));
            st.surfKey = st.hkey;
          };
          S.lines([[[HX(0), HY(0), 0], [HX(LEN), HY(0), 0]], [[HX(LEN), HY(0), 0], [HX(LEN), HY(TMAX), 0]], [[HX(LEN), HY(TMAX), 0], [HX(0), HY(TMAX), 0]], [[HX(0), HY(TMAX), 0], [HX(0), HY(0), 0]]], { c: 'muted', opacity: 0.5 });
          S.arrow([HX(0) - 0.25, HY(0), 0], [0, HY(TMAX) - HY(0) + 0.3, 0], { c: 'muted', r: 0.012 });
          S.arrow([HX(0), HY(0) - 0.3, 0], [HX(LEN) - HX(0) + 0.3, 0, 0], { c: 'muted', r: 0.012 });
          S.label(T('time t, 0 to 40', '時間 t（0 から 40）'), [HX(0) - 0.25, HY(TMAX) + 0.35, 0], { small: true, c: 'muted', align: 'middle' });
          S.label(T('position x', '位置 x'), [HX(LEN) + 0.3, HY(0) - 0.3, 0], { small: true, c: 'muted' });
          st.slice = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.026, glow: 0.25 });
          st.shadow = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.012, opacity: 0.45 });
          st.peak = S.sphere([0, 0, 0], 0.07, { c: 'hl', glow: 0.35 });
          st.nowLab = S.label('', [0, 0, 0], { small: true });
          st.draw3d = (t, u, im) => {
            if (st.surfKey !== st.hkey) st.setSurf();
            const y = HY(t);
            st.slice.update(Array.from(u, (z, i) => [HX(i * DX), y, HZ(z) + 0.02]));
            st.shadow.update([[HX(0), y, 0.005], [HX(LEN), y, 0.005]]);
            st.peak.at([HX(im * DX), y, HZ(u[im]) + 0.03]);
            st.nowLab.set([HX(LEN) + 0.08, y, HZ(u[NX - 1]) + 0.05], `t = ${Math.round(t)}`);
          };
          st.setSurf();
        },
        update() { st.anim?.redraw(); },
        fallback() { st.flat = true; st.draw3d = null; st.anim?.redraw(); },
      });
      st.anim.redraw();
    },
  };

  /* ---------------- 2. Wave equation: d'Alembert with reflections ---------------- */
  D.wave = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const c = v.c, free = v.ends > 0.5, TM = 30;
      const F0 = (x) => Math.exp(-((x - 3) ** 2) / (2 * 0.45 ** 2));
      // extend the initial shape to the whole line: odd about each fixed end, even about each free end
      const F = (x) => { let y = ((x % (2 * LEN)) + 2 * LEN) % (2 * LEN); if (y > LEN) y -= 2 * LEN; return y >= 0 ? F0(y) : (free ? F0(-y) : -F0(-y)); };
      const right = (x, t) => 0.5 * F(x - c * t), left = (x, t) => 0.5 * F(x + c * t);
      L.h('p', 'lab-cap', ctx.host, T('The string at time t and the two travelling halves that add up to it', '時刻 t の弦と、足し合わせると弦になる2つの進行波'));
      const f = L.fig(ctx.host, { x: [0, LEN], y: [-1.1, 1.1], aspect: 0.34, maxH: 270, xlabel: T('position x', '位置 x'), ylabel: 'u' });
      f.layers.dyn = f.group('main');
      const endMark = (x) => { if (free) f.seg([x, -0.25], [x, 0.25], { c: 'muted', w: 1.4, dash: '2 3' }); else f.rect(x - (x > 0 ? 0 : 0.12), -0.3, 0.12, 0.6, { c: 'ink', fo: 0.8, nostroke: true, layer: 'over' }); };
      L.h('p', 'lab-cap', ctx.host, T('Space–time picture: the pulses travel along the lines x ± ct and bounce between the ends', '時空図：パルスは直線 x ± ct に沿って進み、両端の間で跳ね返ります'));
      const g = L.fig(ctx.host, { x: [0, LEN], y: [-TM, 0], aspect: 0.42, maxH: 300, grid: false, xlabel: T('position x', '位置 x'), ylabel: T('time (down)', '時間（下向き）'), ticksY: [0, 10, 20, 30].map((t) => [-t, String(t)]) });
      g.raster((x, y) => (right(x, -y) + left(x, -y)) * 0.95, { cmap: 'div', res: 3 });
      const draw = (t) => {
        f.clear('dyn'); f.clear('over'); g.clear('over');
        endMark(0); endMark(LEN);
        f.line(L.sample(0, LEN, 400, (x) => right(x, t) + left(x, t)), { c: 'c2', w: 3.2, op: 0.8, layer: 'dyn' });
        f.line(L.sample(0, LEN, 300, (x) => right(x, t)), { c: 'c1', w: 1.3, dash: '5 4', layer: 'over' });
        f.line(L.sample(0, LEN, 300, (x) => left(x, t)), { c: 'c4', w: 1.3, dash: '5 4', layer: 'over' });
        g.hline(-t, { c: 'hl', w: 2, dash: false, layer: 'over' });
      };
      sweep(ctx, ctx.host, v, TM, 3, draw);
      L.legend(ctx.host, [{ c: 'c2', label: T('string u = ½F(x − ct) + ½F(x + ct)', '弦 u = ½F(x − ct) + ½F(x + ct)') }, { c: 'c1', dash: true, label: T('right-moving half', '右向きの半分') }, { c: 'c4', dash: true, label: T('left-moving half', '左向きの半分') }, { kind: 'fill', c: 'pos', label: T('u > 0', 'u > 0') }, { kind: 'fill', c: 'neg', label: T('u < 0', 'u < 0') }]);
      ctx.readout([{ k: T('wave speed c', '波速 c'), v: fmt(c, 2), tone: 'key' }, { k: T('time to cross the string L/c', '弦を渡る時間 L/c'), v: fmt(LEN / c, 3) }, { k: T('period of the motion 2L/c', '運動の周期 2L/c'), v: fmt(2 * LEN / c, 3) }],
        free ? T('A free end reflects a pulse with the same sign.', '自由端ではパルスは同じ符号で反射します。') : T('A fixed end reflects a pulse upside down: the incoming wave meets its own inverted mirror image, so the end never moves.', '固定端ではパルスは上下反転して反射します。入ってくる波が反転した鏡像と重なるので、端は動きません。'));
    },
  };

  /* ---------------- 3. Laplace's equation by relaxation ---------------- */
  const GX = 81, GY = 61, XR = [-2, 2], YR = [-1.5, 1.5], HG = (XR[1] - XR[0]) / (GX - 1), RE = 0.18;
  function solve(el, prev) {
    const V = prev ? Float64Array.from(prev) : new Float64Array(GX * GY), fixed = new Int8Array(GX * GY);
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      const k = j * GX + i, x = XR[0] + i * HG, y = YR[0] + j * HG;
      if (i === 0 || j === 0 || i === GX - 1 || j === GY - 1) { fixed[k] = 1; V[k] = 0; continue; }
      for (const e of el) if (Math.hypot(x - e.p[0], y - e.p[1]) <= RE) { fixed[k] = 1; V[k] = e.V; }
    }
    const w = 1.9; let it = 0, change = 1;
    for (; it < 2000 && change > 1e-6; it++) {
      change = 0;
      for (let j = 1; j < GY - 1; j++) for (let i = 1; i < GX - 1; i++) {
        const k = j * GX + i; if (fixed[k]) continue;
        const nv = V[k] + w * ((V[k - 1] + V[k + 1] + V[k - GX] + V[k + GX]) / 4 - V[k]);
        change = Math.max(change, Math.abs(nv - V[k])); V[k] = nv;
      }
    }
    return { V, fixed, it };
  }
  // everything the figures need, computed once per render
  function lapModel(st, v) {
    st.pos ||= [[-0.8, 0], [0.8, 0]];
    const el = [{ p: st.pos[0], V: v.left }, { p: st.pos[1], V: v.right }];
    const S = solve(el, st.V); st.V = S.V;
    const Vg = S.V;
    const at = (x, y) => { const fx = L.clamp((x - XR[0]) / HG, 0, GX - 1.001), fy = L.clamp((y - YR[0]) / HG, 0, GY - 1.001), i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = j * GX + i; return Vg[k] * (1 - a) * (1 - b) + Vg[k + 1] * a * (1 - b) + Vg[k + GX] * (1 - a) * b + Vg[k + GX + 1] * a * b; };
    const E = (x, y) => { const e = HG * 0.5; return [-(at(x + e, y) - at(x - e, y)) / (2 * e), -(at(x, y + e) - at(x, y - e)) / (2 * e)]; };
    st.sweeps = (st.sweeps || 0) + S.it;
    // strongest field in the free region
    let best = 0, bp = [0, 0];
    for (let j = 2; j < GY - 2; j++) for (let i = 2; i < GX - 2; i++) { const k = j * GX + i; if (S.fixed[k] || S.fixed[k + 1] || S.fixed[k - 1] || S.fixed[k + GX] || S.fixed[k - GX]) continue; const ex = (Vg[k + 1] - Vg[k - 1]) / (2 * HG), ey = (Vg[k + GX] - Vg[k - GX]) / (2 * HG), m = Math.hypot(ex, ey); if (m > best) { best = m; bp = [XR[0] + i * HG, YR[0] + j * HG]; } }
    // probe line through A and B, clipped to the box
    const A = st.pos[0], B = st.pos[1], dAB = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dir = dAB > 1e-6 ? [(B[0] - A[0]) / dAB, (B[1] - A[1]) / dAB] : [1, 0];
    let s0 = -Infinity, s1 = Infinity;
    [[XR, 0], [YR, 1]].forEach(([R, k]) => { if (Math.abs(dir[k]) > 1e-9) { const a = (R[0] - A[k]) / dir[k], b = (R[1] - A[k]) / dir[k]; s0 = Math.max(s0, Math.min(a, b)); s1 = Math.min(s1, Math.max(a, b)); } });
    const P = (sv) => [A[0] + sv * dir[0], A[1] + sv * dir[1]];
    // neighbour-mean check at an off-axis free grid point (the nearest free point to (0.6, 0.6))
    const gi = Math.round((0.6 - XR[0]) / HG), gj = Math.round((0.6 - YR[0]) / HG);
    let k0 = -1;
    for (let rad = 0; rad < 20 && k0 < 0; rad++) for (let dj = -rad; dj <= rad && k0 < 0; dj++) for (let di = -rad; di <= rad && k0 < 0; di++) { const i = gi + di, j = gj + dj; if (i < 2 || j < 2 || i > GX - 3 || j > GY - 3) continue; const k = j * GX + i; if (!S.fixed[k] && !S.fixed[k - 1] && !S.fixed[k + 1] && !S.fixed[k - GX] && !S.fixed[k + GX]) k0 = k; }
    if (k0 < 0) k0 = Math.round((0 - YR[0]) / HG) * GX + Math.round((0 - XR[0]) / HG);
    const px = XR[0] + (k0 % GX) * HG, py = YR[0] + Math.floor(k0 / GX) * HG;
    const mean = (Vg[k0 - 1] + Vg[k0 + 1] + Vg[k0 - GX] + Vg[k0 + GX]) / 4;
    // equipotential segments by marching squares, one list per level
    const levels = L.seq(19, (i) => -0.9 + 0.1 * i).filter((l) => Math.abs(l) > 1e-9);
    const contours = levels.map((lv) => {
      const segs = [];
      for (let j = 0; j < GY - 1; j++) for (let i = 0; i < GX - 1; i++) {
        const k = j * GX + i, q = [Vg[k], Vg[k + 1], Vg[k + GX + 1], Vg[k + GX]], c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
        const cross = [];
        for (let e = 0; e < 4; e++) { const a = q[e] - lv, b = q[(e + 1) % 4] - lv; if ((a < 0) !== (b < 0)) { const t = a / (a - b), p0 = c[e], p1 = c[(e + 1) % 4]; cross.push([XR[0] + (p0[0] + t * (p1[0] - p0[0])) * HG, YR[0] + (p0[1] + t * (p1[1] - p0[1])) * HG]); } }
        if (cross.length >= 2) segs.push([cross[0], cross[1]]);
        if (cross.length === 4) segs.push([cross[2], cross[3]]);
      }
      return { lv, segs };
    });
    const inEl = (p, skip) => el.some((e, i) => i !== skip && e.V !== 0 && Math.hypot(p[0] - e.p[0], p[1] - e.p[1]) < RE);
    const seedsOf = (e) => L.seq(14, (k) => { const a = (k + 0.5) / 14 * L.TAU; return [e.p[0] + (RE + 0.02) * Math.cos(a), e.p[1] + (RE + 0.02) * Math.sin(a)]; });
    const stopAt = (idx) => (p) => inEl(p, idx) || Math.abs(p[0]) > 1.98 || Math.abs(p[1]) > 1.48;
    return { el, S, Vg, at, E, best, bp, A, B, dAB, dir, s0, s1, P, k0, px, py, mean, contours, seedsOf, stopAt };
  }
  // field lines for the 3D sheet: RK4 along the unit field, as the 2D figure's stream does
  function fieldLines(M) {
    const out = [], h = 0.02;
    const unit = (p, s) => { const q = M.E(p[0], p[1]), m = Math.hypot(q[0], q[1]); return m > 1e-9 ? [s * q[0] / m, s * q[1] / m] : null; };
    M.el.forEach((e, idx) => {
      if (Math.abs(e.V) < 1e-9) return;
      const s = Math.sign(e.V), stop = M.stopAt(idx);
      for (const seed of M.seedsOf(e)) {
        let p = seed.slice(); const pts = [p];
        for (let k = 0; k < 420; k++) {
          const k1 = unit(p, s); if (!k1) break;
          const k2 = unit([p[0] + h * k1[0] / 2, p[1] + h * k1[1] / 2], s); if (!k2) break;
          const k3 = unit([p[0] + h * k2[0] / 2, p[1] + h * k2[1] / 2], s); if (!k3) break;
          const k4 = unit([p[0] + h * k3[0], p[1] + h * k3[1]], s); if (!k4) break;
          p = [p[0] + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, p[1] + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
          pts.push(p);
          if (stop(p)) break;
        }
        out.push(pts);
      }
    });
    return out;
  }
  function lapFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('The potential V as a height over the box: a sheet pinned to 0 at the walls and pushed up or down at the electrodes. Field lines run straight downhill. Drag the electrodes, or drag elsewhere to turn the view.', '箱の上に電位 V を高さとして描いたものです。壁で 0 に留められ、電極で押し上げられたり押し下げられたりした膜になります。電気力線はまっすぐ坂を下ります。電極をドラッグして動かし、それ以外の場所のドラッグで視点を回せます。'));
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, T('V along the probe line, distance s measured from electrode A', '測定線に沿った V（距離 s は電極 A から測ります）'));
    st.g2 = L.h('div', '', st.c2);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  const ZS = 0.8;
  D.laplace = {
    three: true,
    render(ctx, v) {
      const st = lapFrame(ctx);
      const M = lapModel(st, v);
      const { el, Vg, at, E, best, bp, s0, s1, P, k0, px, py, mean } = M;
      const draw2d = () => {
        st.v3.replaceChildren();
        st.cap1.textContent = T('Potential V in the box, with the probe line through both electrodes', '箱の中の電位 V と、両電極を通る測定線');
        const f = L.fig(st.v3, { x: XR, y: YR, equal: true, maxH: 460, grid: false });
        f.raster((x, y) => at(x, y) * 0.85, { cmap: 'div' });
        for (const c of M.contours) if (c.segs.length) f.line(c.segs.flatMap((s) => [s[0], s[1], null]), { c: 'ink', w: 0.9, op: 0.45, layer: 'under' });
        el.forEach((e, idx) => {
          if (Math.abs(e.V) < 1e-9) return;
          const s = Math.sign(e.V);
          f.stream((x, y) => { const q = E(x, y); return [s * q[0], s * q[1]]; }, M.seedsOf(e), { both: false, c: 'c3', w: 1.4, op: 0.85, h: 0.012, steps: 700, stop: M.stopAt(idx) });
        });
        f.rect(XR[0], YR[0], XR[1] - XR[0], YR[1] - YR[0], { c: 'ink', fill: false, w: 3 });
        el.forEach((e, i) => {
          f.circle(e.p[0], e.p[1], RE, { c: 'ink', fill: e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted', fo: 1, w: 1.5 });
          f.handle(e.p[0], e.p[1], { c: e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted', r: 7, label: T(`Electrode ${'AB'[i]}`, `電極 ${'AB'[i]}`), bounds: [-1.7, 1.7, -1.2, 1.2], onDrag: (x, y) => { st.pos[i] = [x, y]; ctx.redraw(); } });
          f.rect(e.p[0] - 0.27, e.p[1] - RE - 0.27, 0.54, 0.22, { c: 'plate', fill: 'plate', fo: 0.9, w: 0, rx: 4, layer: 'over' });
          f.text(e.p[0], e.p[1] - RE - 0.16, `${'AB'[i]}: ${fmt(e.V, 1)}`, { dy: 4, small: true, layer: 'over' }).style.stroke = 'none';
        });
        f.line([P(s0), P(s1)], { c: 'hl', w: 1.4, dash: '6 4', op: 0.9, layer: 'over' });
        f.text(XR[1], YR[0], T('walls at V = 0', '壁は V = 0'), { anchor: 'end', dx: -8, dy: -8, small: true, c: 'muted' });
        f.hover((x, y) => { const q = E(x, y); return { text: `V = ${fmt(at(x, y), 3)}   |E| = ${fmt(Math.hypot(...q), 3)}` }; });
        if (best > 0) f.dot(bp[0], bp[1], { c: 'hl', r: 5.5 });
        f.dot(px, py, { c: 'ink', r: 4, hollow: true });
        f.text(px, py, 'P', { dx: 7, dy: -5, anchor: 'start', small: true });
      };
      const side = () => {
        st.g2.replaceChildren();
        const g = L.fig(st.g2, { x: [s0, s1], y: [-1.25, 1.25], aspect: 0.75, maxH: 420, xlabel: T('distance s along the line', '線に沿った距離 s'), ylabel: 'V' });
        g.hline(0, { c: 'muted', w: 1, layer: 'under' });
        [[0, el[0]], [M.dAB, el[1]]].forEach(([sv, e], i) => {
          g.rect(sv - RE, -1.25, 2 * RE, 2.5, { c: e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted', fo: 0.18, nostroke: true, layer: 'under' });
          g.text(sv, 1.25, 'AB'[i], { dy: 13, small: true });
        });
        g.line(L.sample(s0, s1, 300, (sv) => { const q = P(sv); return at(q[0], q[1]); }), { c: 'c1', w: 2.4 });
        g.hover((sv) => { const q = P(sv); return { x: sv, y: at(q[0], q[1]), text: `s = ${fmt(sv, 2)}: V = ${fmt(at(q[0], q[1]), 3)}` }; });
        st.leg.replaceChildren();
        L.legend(st.leg, [{ kind: 'fill', c: 'pos', label: T('V > 0', 'V > 0') }, { kind: 'fill', c: 'neg', label: T('V < 0', 'V < 0') }, { c: 'ink', label: T('equipotentials, every 0.1', '等電位線（0.1 ごと）') }, { c: 'c3', label: T('field lines of E = −∇V', '電気力線 E = −∇V') }, { kind: 'dot', c: 'hl', label: T('strongest field', '最も強い電場') }, { c: 'hl', dash: true, label: T('probe line', '測定線') }, { kind: 'dot', c: 'ink', label: T('P: neighbour-mean check', 'P：隣接平均の確認点') }]);
        const r4 = (x) => Math.round(x * 1e4) / 1e4;
        ctx.readout([{ k: T(`V at P = (${fmt(px, 2)}, ${fmt(py, 2)})`, `P = (${fmt(px, 2)}, ${fmt(py, 2)}) での V`), v: fmt(r4(Vg[k0]), 4), tone: 'key' }, { k: T('mean of its 4 neighbours', '隣接4点の平均'), v: fmt(r4(mean), 4) }, { k: T('largest |E|', '最大の |E|'), v: fmt(best, 3) }, { k: T('relaxation sweeps so far', 'これまでの緩和の反復回数'), v: String(st.sweeps) }],
          T('Drag the electrodes. Each value is the average of its neighbours, so V has no peaks or pits away from the electrodes and walls, and the field is strongest where the equipotentials crowd together.', '電極をドラッグできます。各点の値は隣接点の平均なので、電極と壁から離れた所に V の山や谷はなく、電場は等電位線が密集する所で最も強くなります。'));
      };
      side();
      st.M = M;
      const narrow = ctx.host.clientWidth < 560;
      L.view3d(ctx, v, {
        host: st.v3, aspect: narrow ? 0.9 : 0.76, maxH: 470, camera: narrow ? [3.1, -5.6, 4.6] : [2.7, -4.8, 3.9], target: [0, 0, -0.05], fov: 34,
        init(S) {
          st.flat = false;
          const lift = (x, y, d = 0.012) => [x, y, st.M.at(x, y) * ZS + d];
          st.sheet = S.surface(() => [0, 0, 0], { u: [0, GX - 1], v: [0, GY - 1], nu: GX - 1, nv: GY - 1, colour: () => S.colour('muted'), rough: 0.55, coat: 0.2 });
          st.sheet.userData.noOcclude = true;
          st.iso = S.lines([], { c: 'ink', opacity: S.dark ? 0.4 : 0.32 });
          st.fl = S.lines([], { c: 'c3', opacity: 0.95 });
          st.probe = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.011, glow: 0.3 });
          S.lines([[[XR[0], YR[0], 0], [XR[1], YR[0], 0]], [[XR[1], YR[0], 0], [XR[1], YR[1], 0]], [[XR[1], YR[1], 0], [XR[0], YR[1], 0]], [[XR[0], YR[1], 0], [XR[0], YR[0], 0]]], { c: 'ink', opacity: 0.8 });
          S.label(T('walls at V = 0', '壁は V = 0'), [XR[1], YR[1], 0], { small: true, c: 'muted', align: 'end' });
          st.strong = S.sphere([0, 0, 0], 0.05, { c: 'hl', glow: 0.35 });
          st.pP = S.sphere([0, 0, 0], 0.04, { c: 'ink' });
          st.pLab = S.label('P', [0, 0, 0], { math: true, small: true, occlude: true });
          st.hs = [0, 1].map((i) => S.handle(lift(...st.pos[i], 0), {
            r: 0.1, c: 'c1', label: 'AB'[i], plane: [[0, 0, 1], [0, 0, 0]], bounds: [-1.7, 1.7, -1.2, 1.2],
            onDrag: (q) => { st.pos[i] = [q.x, q.y]; ctx.redraw(); return [q.x, q.y, st.M.el[i].V * ZS + 0.02]; },
          }));
          st.draw3d = () => {
            const Mm = st.M, G = Mm.Vg;
            st.sheet.update((i, j) => { const ii = Math.round(i), jj = Math.round(j); return [XR[0] + ii * HG, YR[0] + jj * HG, G[jj * GX + ii] * ZS]; },
              (i, j, p) => { const w = p[2] / ZS; return S.cmap.div(Math.sign(w) * Math.pow(Math.min(1, Math.abs(w)), 0.55) * 0.95); });
            st.iso.update(Mm.contours.flatMap((c) => c.segs.map(([a, b]) => [[a[0], a[1], c.lv * ZS + 0.01], [b[0], b[1], c.lv * ZS + 0.01]])));
            const segs = [];
            for (const pts of fieldLines(Mm)) for (let k = 0; k + 1 < pts.length; k++) segs.push([lift(...pts[k], 0.018), lift(...pts[k + 1], 0.018)]);
            st.fl.update(segs);
            st.probe.update(L.sample(Mm.s0, Mm.s1, 160, (sv) => lift(...Mm.P(sv), 0.022)));
            st.strong.visible = Mm.best > 0; st.strong.at(lift(...Mm.bp, 0.03));
            st.pP.at(lift(Mm.px, Mm.py, 0.02)); st.pLab.set(lift(Mm.px, Mm.py, 0.05));
            Mm.el.forEach((e, i) => {
              const h = st.hs[i], z = e.V * ZS + 0.02;
              h.userData.handle.plane = [[0, 0, 1], [0, 0, z]];
              const hc = S.colour(e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted'); h.material.color.copy(hc); h.children[0]?.material?.color?.copy(hc);
              h.at([e.p[0], e.p[1], z]);
            });
            S.invalidate();
          };
        },
        update() { st.draw3d?.(); },
        fallback() { st.flat = true; draw2d(); },
      });
    },
  };
})();
