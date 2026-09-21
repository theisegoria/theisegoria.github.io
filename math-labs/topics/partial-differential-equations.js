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
  D.heat = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const fixed = v.bc > 0.5, H = heat(v.kappa, fixed), snap = (t) => H.snaps[Math.round(L.clamp(t, 0, TMAX) / TMAX * NS)];
      const Q0 = total(H.snaps[0]);
      L.h('p', 'lab-cap', ctx.host, T('Temperature along the rod at time t', '時刻 t での棒に沿った温度'));
      const f = L.fig(ctx.host, { x: [0, LEN], y: [0, 1.1], aspect: 0.36, maxH: 280, xlabel: T('position x', '位置 x'), ylabel: 'u' });
      const xs = (u) => Array.from(u, (y, i) => [i * DX, y]);
      f.line(xs(H.snaps[0]), { c: 'muted', w: 1.4, dash: '4 4' });
      if (!fixed) f.hline(Q0 / LEN, { c: 'c3', w: 1.4, dash: '6 4' });
      f.layers.dyn = f.group('main');
      L.h('p', 'lab-cap', ctx.host, T('Space–time picture: each row is the rod at one moment, time running downward', '時空図：各行がある時刻の棒で、時間は下向きに進みます'));
      const g = L.fig(ctx.host, { x: [0, LEN], y: [-TMAX, 0], aspect: 0.4, maxH: 300, grid: false, xlabel: T('position x', '位置 x'), ylabel: T('time (down)', '時間（下向き）'), ticksY: [0, 10, 20, 30, 40].map((t) => [-t, String(t)]) });
      g.raster((x, y) => { const u = snap(-y), i = Math.min(NX - 2, Math.floor(x / DX)), a = x / DX - i; return Math.pow(L.clamp(u[i] * (1 - a) + u[i + 1] * a, 0, 1), 0.7); }, { cmap: 'warm', res: 3 });
      const draw = (t) => {
        const u = snap(t);
        f.clear('dyn'); g.clear('over');
        f.area(xs(u), { c: 'c2', fo: 0.18, layer: 'dyn' });
        f.line(xs(u), { c: 'c2', w: 2.8, layer: 'dyn' });
        let im = 0; for (let i = 0; i < NX; i++) if (u[i] > u[im]) im = i;
        f.dot(im * DX, u[im], { c: 'hl', r: 5.5, layer: 'dyn' });
        g.hline(-t, { c: 'c1', w: 2, dash: false, layer: 'over' });
        ctx.readout([{ k: T('peak temperature', '最高温度'), v: fmt(u[im], 3), tone: 'key' }, { k: T('total heat ∫u dx', '総熱量 ∫u dx'), v: fmt(total(u), 3), tone: fixed ? 'warn' : 'good' }, { k: T('at t = 0', 't = 0 で'), v: fmt(Q0, 3) }, { k: 'r = κΔt/Δx²', v: fmt(H.r, 2) }],
          fixed ? T('Ends held at 0 act as sinks: heat leaks out through them and the total falls toward zero.', '0 に保たれた端は熱の吸い込み口として働き、熱が逃げて総量は 0 に向かいます。')
            : T(`Insulated ends: no heat escapes, so the total stays at ${fmt(Q0, 3)} and the rod settles to the mean temperature ${fmt(Q0 / LEN, 3)}.`, `断熱端：熱は逃げないので総量は ${fmt(Q0, 3)} のまま保たれ、棒は平均温度 ${fmt(Q0 / LEN, 3)} に落ち着きます。`));
      };
      sweep(ctx, ctx.host, v, TMAX, 6, draw);
      L.legend(ctx.host, [{ c: 'c2', label: T('temperature u(x, t)', '温度 u(x, t)') }, { c: 'muted', dash: true, label: T('initial state', '初期状態') }].concat(fixed ? [] : [{ c: 'c3', dash: true, label: T('final uniform temperature', '最終的な一様温度') }]).concat([{ c: 'c1', label: T('current time in the space–time picture', '時空図での現在時刻') }]));
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
        f.line(L.sample(0, LEN, 300, (x) => right(x, t)), { c: 'c1', w: 1.5, dash: '5 4', layer: 'dyn' });
        f.line(L.sample(0, LEN, 300, (x) => left(x, t)), { c: 'c4', w: 1.5, dash: '5 4', layer: 'dyn' });
        f.line(L.sample(0, LEN, 400, (x) => right(x, t) + left(x, t)), { c: 'c2', w: 3, layer: 'dyn' });
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
  D.laplace = {
    render(ctx, v) {
      const st = ctx.state;
      st.pos ||= [[-0.8, 0], [0.8, 0]];
      const el = [{ p: st.pos[0], V: v.left }, { p: st.pos[1], V: v.right }];
      const S = solve(el, st.V); st.V = S.V;
      const Vg = S.V;
      const at = (x, y) => { const fx = L.clamp((x - XR[0]) / HG, 0, GX - 1.001), fy = L.clamp((y - YR[0]) / HG, 0, GY - 1.001), i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = j * GX + i; return Vg[k] * (1 - a) * (1 - b) + Vg[k + 1] * a * (1 - b) + Vg[k + GX] * (1 - a) * b + Vg[k + GX + 1] * a * b; };
      const E = (x, y) => { const e = HG * 0.5; return [-(at(x + e, y) - at(x - e, y)) / (2 * e), -(at(x, y + e) - at(x, y - e)) / (2 * e)]; };
      const f = L.fig(ctx.host, { x: XR, y: YR, equal: true, maxH: 460, grid: false });
      f.raster((x, y) => at(x, y) * 0.85, { cmap: 'div' });
      // equipotentials by marching squares, one path per level
      const levels = L.seq(19, (i) => -0.9 + 0.1 * i).filter((l) => Math.abs(l) > 1e-9);
      for (const lv of levels) {
        const pts = [];
        for (let j = 0; j < GY - 1; j++) for (let i = 0; i < GX - 1; i++) {
          const k = j * GX + i, q = [Vg[k], Vg[k + 1], Vg[k + GX + 1], Vg[k + GX]], c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          const cross = [];
          for (let e = 0; e < 4; e++) { const a = q[e] - lv, b = q[(e + 1) % 4] - lv; if ((a < 0) !== (b < 0)) { const t = a / (a - b), p0 = c[e], p1 = c[(e + 1) % 4]; cross.push([XR[0] + (p0[0] + t * (p1[0] - p0[0])) * HG, YR[0] + (p0[1] + t * (p1[1] - p0[1])) * HG]); } }
          if (cross.length >= 2) pts.push(cross[0], cross[1], null);
          if (cross.length === 4) pts.push(cross[2], cross[3], null);
        }
        if (pts.length) f.line(pts, { c: 'ink', w: 0.9, op: 0.45, layer: 'under' });
      }
      // field lines from each charged electrode
      const inEl = (p, skip) => el.some((e, i) => i !== skip && e.V !== 0 && Math.hypot(p[0] - e.p[0], p[1] - e.p[1]) < RE);
      el.forEach((e, idx) => {
        if (Math.abs(e.V) < 1e-9) return;
        const s = Math.sign(e.V), seeds = L.seq(14, (k) => { const a = (k + 0.5) / 14 * L.TAU; return [e.p[0] + (RE + 0.02) * Math.cos(a), e.p[1] + (RE + 0.02) * Math.sin(a)]; });
        f.stream((x, y) => { const q = E(x, y); return [s * q[0], s * q[1]]; }, seeds, { both: false, c: 'c3', w: 1.4, op: 0.85, h: 0.012, steps: 700, stop: (p) => inEl(p, idx) || Math.abs(p[0]) > 1.98 || Math.abs(p[1]) > 1.48 });
      });
      f.rect(XR[0], YR[0], XR[1] - XR[0], YR[1] - YR[0], { c: 'ink', fill: false, w: 3 });
      el.forEach((e, i) => {
        f.circle(e.p[0], e.p[1], RE, { c: 'ink', fill: e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted', fo: 1, w: 1.5 });
        f.handle(e.p[0], e.p[1], { c: e.V > 0 ? 'pos' : e.V < 0 ? 'neg' : 'muted', r: 7, label: T(`Electrode ${'AB'[i]}`, `電極 ${'AB'[i]}`), bounds: [-1.7, 1.7, -1.2, 1.2], onDrag: (x, y) => { st.pos[i] = [x, y]; ctx.redraw(); } });
        f.text(e.p[0], e.p[1] + RE, `${'AB'[i]}: ${fmt(e.V, 1)}`, { dy: -8, small: true });
      });
      f.text(XR[1], YR[0], T('walls at V = 0', '壁は V = 0'), { anchor: 'end', dx: -8, dy: -8, small: true, c: 'muted' });
      f.hover((x, y) => { const q = E(x, y); return { text: `V = ${fmt(at(x, y), 3)}   |E| = ${fmt(Math.hypot(...q), 3)}` }; });
      // strongest field in the free region
      let best = 0, bp = [0, 0];
      for (let j = 2; j < GY - 2; j++) for (let i = 2; i < GX - 2; i++) { const k = j * GX + i; if (S.fixed[k] || S.fixed[k + 1] || S.fixed[k - 1] || S.fixed[k + GX] || S.fixed[k - GX]) continue; const ex = (Vg[k + 1] - Vg[k - 1]) / (2 * HG), ey = (Vg[k + GX] - Vg[k - GX]) / (2 * HG), m = Math.hypot(ex, ey); if (m > best) { best = m; bp = [XR[0] + i * HG, YR[0] + j * HG]; } }
      if (best > 0) f.dot(bp[0], bp[1], { c: 'hl', r: 5.5 });
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: T('V > 0', 'V > 0') }, { kind: 'fill', c: 'neg', label: T('V < 0', 'V < 0') }, { c: 'ink', label: T('equipotentials, every 0.1', '等電位線（0.1 ごと）') }, { c: 'c3', label: T('field lines of E = −∇V', '電気力線 E = −∇V') }, { kind: 'dot', c: 'hl', label: T('strongest field', '最も強い電場') }]);
      const k0 = Math.round((0 - YR[0]) / HG) * GX + Math.round((0 - XR[0]) / HG);
      const r4 = (x) => Math.round(x * 1e4) / 1e4;
      const mean = (Vg[k0 - 1] + Vg[k0 + 1] + Vg[k0 - GX] + Vg[k0 + GX]) / 4;
      ctx.readout([{ k: T('V at the centre', '中心の V'), v: fmt(r4(Vg[k0]), 4), tone: 'key' }, { k: T('mean of its 4 neighbours', '隣接4点の平均'), v: fmt(r4(mean), 4) }, { k: T('largest |E|', '最大の |E|'), v: fmt(best, 3) }, { k: T('relaxation sweeps', '緩和の反復回数'), v: String(S.it) }],
        T('Drag the electrodes. Each value is the average of its neighbours, so V has no peaks or pits away from the electrodes and walls, and the field is strongest where the equipotentials crowd together.', '電極をドラッグできます。各点の値は隣接点の平均なので、電極と壁から離れた所に V の山や谷はなく、電場は等電位線が密集する所で最も強くなります。'));
    },
  };
})();
