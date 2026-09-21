'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rad = (d) => d * Math.PI / 180;

  // Keep a figure's scale fixed while a handle is being dragged, so the mapping under the pointer never jumps.
  const lock = (ctx) => {
    const st = ctx.state;
    if (st.dragging) return;
    st.dragging = true;
    const end = () => { document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); st.dragging = false; ctx.redraw(); };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  };
  const held = (st, key, fresh) => { if (st.dragging && st[key] !== undefined) return st[key]; st[key] = fresh; return fresh; };
  const nice = (x, list) => list.find((v) => v >= x) ?? list[list.length - 1];

  /* ---------------- 1. Projectile ---------------- */
  const G = 9.8, KD = 0.006; // gravity (m/s²) and quadratic drag constant k (1/m)
  // RK4 integration of r'' = g − k|v|v from the origin until the ball returns to y = 0.
  function flight(th, s, k) {
    let x = 0, y = 0, vx = s * Math.cos(th), vy = s * Math.sin(th), t = 0;
    const dt = 0.004, out = [[t, x, y, vx, vy]];
    const acc = (ux, uy) => { const m = Math.hypot(ux, uy); return [-k * m * ux, -G - k * m * uy]; };
    for (let i = 0; i < 40000; i++) {
      const a1 = acc(vx, vy), a2 = acc(vx + a1[0] * dt / 2, vy + a1[1] * dt / 2), a3 = acc(vx + a2[0] * dt / 2, vy + a2[1] * dt / 2), a4 = acc(vx + a3[0] * dt, vy + a3[1] * dt);
      const nx = x + dt * (vx + dt / 6 * (a1[0] + a2[0] + a3[0])), ny = y + dt * (vy + dt / 6 * (a1[1] + a2[1] + a3[1]));
      const nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]), nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      if (ny < 0 && t > 0) { const f = y / (y - ny); out.push([t + f * dt, x + f * (nx - x), 0, vx + f * (nvx - vx), vy + f * (nvy - vy)]); break; }
      x = nx; y = ny; vx = nvx; vy = nvy; t += dt; out.push([t, x, y, vx, vy]);
    }
    return out;
  }
  const at = (path, t) => { const tf = path[path.length - 1][0]; if (t >= tf) return path[path.length - 1]; const i = Math.min(path.length - 2, Math.floor(t / 0.004)); const a = path[i], b = path[i + 1], f = (t - a[0]) / (b[0] - a[0] || 1); return a.map((q, j) => q + f * (b[j] - q)); };

  D.projectile = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, th = rad(v.angle), s = v.speed, drag = v.drag > 0.5;
      const X = held(st, 'X', nice(1.06 * s * s / G, [6, 10, 15, 20, 30, 40, 50, 60, 70, 80, 100])), Y = X * 0.56;
      const sc = 0.3 * X / Math.sqrt(G * X); // metres of arrow per m/s
      const f = L.fig(ctx.host, { x: [0, X], y: [0, Y], equal: true, maxH: 460, xlabel: T('horizontal distance x (m)', '水平距離 x (m)'), ylabel: T('height y (m)', '高さ y (m)') });
      const path = flight(th, s, drag ? KD : 0);
      const vac = drag ? flight(th, s, 0) : null;
      const tf = path[path.length - 1][0], R = path[path.length - 1][1];
      let apex = path[0]; path.forEach((p) => { if (p[2] > apex[2]) apex = p; });
      // envelope of every trajectory at this speed (vacuum): y = s²/2g − g x²/2s²
      f.line(L.sample(0, X, 160, (x) => s * s / (2 * G) - G * x * x / (2 * s * s)), { c: 'muted', w: 1.3, dash: '2 4', layer: 'under' });
      if (drag) f.line(vac.map((p) => [p[1], p[2]]), { c: 'c1', w: 1.6, dash: '6 5', op: 0.6 });
      else if (Math.abs(v.angle - 45) > 0.5) f.line(flight(Math.PI / 2 - th, s, 0).map((p) => [p[1], p[2]]), { c: 'c1', w: 1.6, dash: '6 5', op: 0.55 });
      f.line(path.map((p) => [p[1], p[2]]), { c: 'c1', w: 3 });
      // strobe: positions at ten equal time steps
      for (let k = 1; k < 10; k++) { const p = at(path, tf * k / 10); f.dot(p[1], p[2], { c: 'c1', r: 3.6, hollow: true, layer: 'main' }); }
      f.seg([apex[1], 0], [apex[1], apex[2]], { c: 'muted', w: 1.1, dash: '3 3' });
      f.text(apex[1], apex[2] / 2, 'H', { math: true, dx: 10, anchor: 'start', layer: 'main' });
      f.line([[0.012 * X, 0.025 * Y], [R - 0.012 * X, 0.025 * Y]], { c: 'ink', w: 1, op: 0.6 });
      f.text(R * 0.72, 0.025 * Y, 'R', { math: true, dy: -6, layer: 'main' });
      // launch vector handle
      const tip = [s * Math.cos(th) * sc, s * Math.sin(th) * sc];
      f.arrow([0, 0], tip, { c: 'c2', w: 3 });
      f.text(tip[0], tip[1], 'v₀', { math: true, dx: 14, dy: -4, anchor: 'start', c: 'c2', layer: 'main' });
      f.handle(tip[0], tip[1], { c: 'c2', label: T('Launch velocity', '初速度ベクトル'), bounds: [0.02 * X, 0.9 * X, 0.02 * X, 0.95 * Y], onDrag: (x, y) => { lock(ctx); ctx.set('angle', Math.atan2(y, x) * 180 / Math.PI, true); ctx.set('speed', Math.hypot(x, y) / sc); } });
      const vs = 0.55 * sc;
      f.layers.dyn = f.group('main');
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        f.clear('over'); f.clear('dyn');
        const tt = Math.min(t * 1.4, tf), p = at(path, tt);
        f.arrow([p[1], p[2]], [p[1] + p[3] * vs, p[2]], { c: 'c3', w: 2.4, layer: 'dyn' });
        if (Math.abs(p[4]) * vs > X * 0.004) f.arrow([p[1], p[2]], [p[1], p[2] + p[4] * vs], { c: 'c4', w: 2.4, layer: 'dyn' });
        f.dot(p[1], p[2], { c: 'hl', r: 7 });
        lab.textContent = `t = ${tt.toFixed(2)} s   vₓ = ${p[3].toFixed(2)}   vᵧ = ${p[4].toFixed(2)} m/s`;
        return t * 1.4 < tf;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Launch', '発射') });
      L.legend(ctx.host, [{ c: 'c1', label: T('trajectory, dots every tenth of the flight', '軌道（点は飛行時間の1/10ごと）') },
        drag ? { c: 'c1', dash: true, label: T('same launch in a vacuum', '真空中の同じ発射') } : { c: 'c1', dash: true, label: T(`complementary angle ${90 - v.angle}°, same range`, `余角 ${90 - v.angle}°（同じ飛距離）`) },
        { c: 'muted', dash: true, label: T('reach of every angle at this speed', 'この速さで届く範囲の境界') },
        { c: 'c3', label: 'vₓ' }, { c: 'c4', label: 'vᵧ' }]);
      const items = [{ k: T('range R', '飛距離 R'), v: `${fmt(R, 3)} m`, tone: 'key' }, { k: T('peak height H', '最高点 H'), v: `${fmt(apex[2], 3)} m` }, { k: T('flight time', '飛行時間'), v: `${fmt(tf, 3)} s` }];
      if (drag) items.push({ k: T('vacuum range', '真空中の飛距離'), v: `${fmt(s * s * Math.sin(2 * th) / G, 3)} m`, tone: 'warn' });
      else items.push({ k: T('vₓ = v₀cos θ, constant', 'vₓ = v₀cos θ（一定）'), v: `${fmt(s * Math.cos(th), 3)} m/s` });
      ctx.readout(items, drag
        ? T('With drag the horizontal velocity decays, the path is no longer a parabola, and the descent is steeper than the climb.', '抵抗があると水平速度が減衰し、軌道は放物線でなくなり、下りが上りより急になります。')
        : T('Drag the orange arrow tip. The dots are evenly spaced sideways because vₓ never changes; only vᵧ is changed by gravity.', '橙の矢印の先端をドラッグできます。vₓ は変わらないので点は横方向に等間隔に並び、重力が変えるのは vᵧ だけです。'));
    },
  };

  /* ---------------- 2. Damped oscillator ---------------- */
  function oscillate(c, k, tmax, dt = 0.004) {
    let x = 1, u = 0; const out = [[0, 1, 0]];
    const a = (x, u) => -c * u - k * x;
    for (let t = dt; t <= tmax + 1e-9; t += dt) {
      const k1x = u, k1u = a(x, u), k2x = u + k1u * dt / 2, k2u = a(x + k1x * dt / 2, u + k1u * dt / 2);
      const k3x = u + k2u * dt / 2, k3u = a(x + k2x * dt / 2, u + k2u * dt / 2), k4x = u + k3u * dt, k4u = a(x + k3x * dt, u + k3u * dt);
      x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); u += dt / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
      out.push([t, x, u]);
    }
    return out;
  }
  D.oscillator = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const c = v.damping, k = v.stiffness, m = 1, TM = 12;
      const w0 = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(m * k)), disc = c * c - 4 * m * k;
      const regime = Math.abs(disc) < 1e-9 ? 'crit' : disc < 0 ? 'under' : 'over';
      const run = oscillate(c, k, TM), crit = oscillate(2 * Math.sqrt(k * m), k, TM);
      // spring–mass–damper strip
      const s = L.fig(ctx.host, { axes: false, x: [-0.25, 4.6], y: [-0.62, 0.62], equal: true, maxH: 190 });
      s.rect(-0.25, -0.62, 0.2, 1.24, { c: 'muted', fo: 0.35, nostroke: true, layer: 'under' });
      s.seg([-0.05, -0.62], [-0.05, 0.62], { c: 'muted', w: 2, layer: 'under' });
      s.seg([-0.05, -0.56], [4.6, -0.56], { c: 'muted', w: 1.2, layer: 'under' });
      const eq = 2.7, amp = 0.95;
      s.vline(eq, { c: 'muted', w: 1, dash: '3 4' });
      s.text(eq, -0.56, T('x = 0', 'x = 0'), { dy: -6, small: true, c: 'muted', layer: 'main' });
      const drawStrip = (x) => {
        s.clear('main');
        const mx = eq + amp * x, left = mx - 0.28;
        const n = 12, zig = L.seq(2 * n + 3, (i) => { if (i === 0) return [-0.05, 0.22]; if (i === 2 * n + 2) return [left, 0.22]; const a = 0.12 + (left - 0.29) * (i - 1) / (2 * n); return [a, 0.22 + (i % 2 ? 0.1 : -0.1)]; });
        s.line([[-0.05, 0.22], [0.12, 0.22]].concat(zig.slice(1)), { c: 'c1', w: 2, layer: 'main' });
        // dashpot: cylinder fixed to the wall, piston rod on the mass
        const cy = -0.22, cx0 = 0.6, cx1 = 1.35;
        s.seg([-0.05, cy], [cx0, cy], { c: 'c2', w: 2, layer: 'main' });
        s.line([[cx1, cy + 0.12], [cx0, cy + 0.12], [cx0, cy - 0.12], [cx1, cy - 0.12]], { c: 'c2', w: 2, layer: 'main' });
        const px = Math.min(cx1 - 0.05, Math.max(cx0 + 0.1, left - 1.05));
        s.seg([px, cy + 0.09], [px, cy - 0.09], { c: 'c2', w: 3, layer: 'main' });
        s.seg([px, cy], [left, cy], { c: 'c2', w: 2, layer: 'main' });
        s.rect(left, -0.4, 0.56, 0.8, { c: 'hl', fo: 0.85, w: 1.5, rx: 4, layer: 'main' });
        s.text(mx, 0, 'm', { math: true, dy: 5, layer: 'main' });
        s.text(0.9, 0.36, 'k', { math: true, dy: -6, c: 'c1', layer: 'main' });
        s.text(0.97, cy, 'c', { math: true, dy: 26, c: 'c2', layer: 'main' });
      };
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Displacement x(t), released from x = 1 at rest', '変位 x(t)（x = 1 から静かに放す）'));
      L.h('p', 'lab-cap', c2, T('Roots of ms² + cs + k = 0; faint path: roots as c goes 0 → 8', 'ms² + cs + k = 0 の根（薄い線は c を 0 → 8 と変えたときの軌跡）'));
      const g = L.fig(c1, { x: [0, TM], y: [-1.1, 1.1], aspect: 0.62, maxH: 340, xlabel: T('time t', '時間 t'), ylabel: 'x' });
      if (regime === 'under' && c > 0) {
        g.line(L.sample(0, TM, 200, (t) => Math.exp(-c * t / 2) / Math.sqrt(1 - zeta * zeta)), { c: 'muted', w: 1.2, dash: '3 4' });
        g.line(L.sample(0, TM, 200, (t) => -Math.exp(-c * t / 2) / Math.sqrt(1 - zeta * zeta)), { c: 'muted', w: 1.2, dash: '3 4' });
      }
      if (regime !== 'crit') g.line(crit.filter((_, i) => i % 5 === 0).map((p) => [p[0], p[1]]), { c: 'c3', w: 1.8, dash: '6 5' });
      g.line(run.filter((_, i) => i % 3 === 0).map((p) => [p[0], p[1]]), { c: 'c1', w: 2.6 });
      const r = L.fig(c2, { x: [-8.4, 1.2], y: [-3.6, 3.6], equal: true, maxH: 340, xlabel: 'Re s', ylabel: 'Im s' });
      r.circle(0, 0, w0, { c: 'muted', w: 1, dash: '3 4' });
      const locus = (cc) => { const d = cc * cc - 4 * k; return d < 0 ? [[-cc / 2, Math.sqrt(-d) / 2], [-cc / 2, -Math.sqrt(-d) / 2]] : [[(-cc + Math.sqrt(d)) / 2, 0], [(-cc - Math.sqrt(d)) / 2, 0]]; };
      const cs = L.seq(161, (i) => i / 20);
      r.line(cs.map((cc) => locus(cc)[0]), { c: 'c4', w: 1.4, op: 0.35 });
      r.line(cs.map((cc) => locus(cc)[1]), { c: 'c4', w: 1.4, op: 0.35 });
      const roots = locus(c);
      roots.forEach((p) => r.dot(p[0], p[1], { c: 'c4', r: 6.5 }));
      r.text(0, w0, 'ω₀', { math: true, dx: 8, dy: -6, anchor: 'start', c: 'muted' });
      r.text(roots[0][0], roots[0][1], regime === 'under' ? T('complex pair: oscillation', '複素共役: 振動') : regime === 'crit' ? T('double root', '重根') : T('two real roots', '2つの実根'), { dy: roots[0][1] > 0 ? -12 : -14, anchor: roots[0][0] < -5 ? 'start' : 'end', small: true, c: 'c4' });
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const tt = t % TM, i = Math.min(run.length - 1, Math.round(tt / 0.004)), p = run[i];
        drawStrip(p[1]);
        g.clear('over');
        g.vline(tt, { c: 'hl', w: 1.2, dash: '2 3', layer: 'over' });
        g.dot(tt, p[1], { c: 'hl', r: 6 });
        lab.textContent = `t = ${tt.toFixed(2)}   x = ${p[1].toFixed(3)}`;
      }, { autoplay: true, playLabel: T('Play', '再生') });
      L.legend(ctx.host, [{ c: 'c1', label: T('this oscillator', 'この振動子') }, { c: 'c3', dash: true, label: T('critical damping c = 2√(mk), same k', '臨界減衰 c = 2√(mk)（同じ k）') }, { c: 'muted', dash: true, label: T('envelope ±e^(−ct/2m)', '包絡線 ±e^(−ct/2m)') }, { kind: 'dot', c: 'c4', label: T('characteristic roots', '特性根') }]);
      const name = regime === 'under' ? (c === 0 ? T('undamped', '減衰なし') : T('underdamped', '減衰不足')) : regime === 'crit' ? T('critical', '臨界減衰') : T('overdamped', '過減衰');
      const items = [{ k: T('regime', '状態'), v: name, tone: 'key' }, { k: 'c² − 4mk', v: fmt(disc, 3) }, { k: 'ζ = c/2√(mk)', v: fmt(zeta, 3) }];
      items.push(regime === 'under' ? { k: T('ω_d = √(ω₀² − c²/4m²)', 'ω_d = √(ω₀² − c²/4m²)'), v: fmt(Math.sqrt(w0 * w0 - c * c / 4), 3) } : { k: T('slowest decay rate', '最も遅い減衰率'), v: fmt(-roots[0][0], 3) });
      ctx.readout(items, T(`m = 1, ω₀ = √(k/m) = ${fmt(w0, 3)}. When the roots are complex the motion oscillates; the real part −c/2m sets the decay. Past critical damping one root moves toward 0 and the return gets slower again.`, `m = 1、ω₀ = √(k/m) = ${fmt(w0, 3)}。根が複素数なら振動し、実部 −c/2m が減衰の速さを決めます。臨界減衰を超えると一方の根が 0 に近づき、戻りは再び遅くなります。`));
    },
  };

  /* ---------------- 3. Kepler orbit ---------------- */
  // Launch at r0 = 1 on the +x axis with purely tangential speed v; the orbit is the conic r = p/(1 + e cos(θ − ω)).
  function kepler(v, mu) {
    const p = v * v / mu, ex = p - 1, e = Math.abs(ex), om = ex >= 0 ? 0 : Math.PI, h = v;
    const rot = ([x, y]) => [x * Math.cos(om) - y * Math.sin(om), x * Math.sin(om) + y * Math.cos(om)];
    const o = { p, e, om, h, E: v * v / 2 - mu };
    if (e < 1 - 1e-9) {
      const a = p / (1 - e * e), b = a * Math.sqrt(1 - e * e), n = Math.sqrt(mu / (a * a * a));
      Object.assign(o, { kind: e < 1e-9 ? 'circle' : 'ellipse', a, b, period: 2 * Math.PI / n, t0: om === 0 ? 0 : Math.PI / n });
      o.pos = (t) => { const M = n * t; let E = e < 0.8 ? M : Math.PI; for (let i = 0; i < 40; i++) { const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= dE; if (Math.abs(dE) < 1e-12) break; } return rot([a * (Math.cos(E) - e), b * Math.sin(E)]); };
    } else if (e > 1 + 1e-9) {
      const a = p / (e * e - 1), n = Math.sqrt(mu / (a * a * a));
      Object.assign(o, { kind: 'hyperbola', a, t0: 0 });
      o.pos = (t) => { const M = n * t; let H = Math.asinh(M / e); for (let i = 0; i < 60; i++) { const dH = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1); H -= dH; if (Math.abs(dH) < 1e-12) break; } return rot([a * (e - Math.cosh(H)), a * Math.sqrt(e * e - 1) * Math.sinh(H)]); };
    } else {
      Object.assign(o, { kind: 'parabola', t0: 0 });
      // Barker's equation: t = ½√(p³/μ)(D + D³/3), D = tan(ν/2)
      o.pos = (t) => { const A = 3 * t / Math.sqrt(p * p * p / mu), B = Math.cbrt(A + Math.sqrt(A * A + 1)), Dv = B - 1 / B, nu = 2 * Math.atan(Dv), r = p / (1 + Math.cos(nu)); return rot([r * Math.cos(nu), r * Math.sin(nu)]); };
    }
    o.vel = (t) => { const d = 1e-5, a = o.pos(t - d), b = o.pos(t + d); return [(b[0] - a[0]) / (2 * d), (b[1] - a[1]) / (2 * d)]; };
    return o;
  }
  D['mechanics-orbit'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const mu = v.mu, K = kepler(v.speed, mu), bound = K.kind === 'ellipse' || K.kind === 'circle';
      let box;
      if (bound) {
        const cx = -K.a * K.e * Math.cos(K.om);
        box = [Math.min(cx - K.a, -1), Math.max(cx + K.a, 1), -Math.max(K.b, 1), Math.max(K.b, 1)];
      } else box = [-4.2, 1.8, -2.6, 2.6];
      const padX = 0.12 * (box[1] - box[0]), padY = 0.12 * (box[3] - box[2]);
      let x0 = box[0] - padX, x1 = box[1] + padX, y0 = box[2] - padY, y1 = box[3] + padY;
      // keep a landscape frame
      const want = 0.64 * (x1 - x0);
      if (y1 - y0 < want) { const m = (y1 - y0 - want) / 2; y0 += m; y1 -= m; } else { const wx = (y1 - y0) / 0.64, m = (wx - (x1 - x0)) / 2; x0 -= m; x1 += m; }
      const f = L.fig(ctx.host, { x: [x0, x1], y: [y0, y1], equal: true, maxH: 460, grid: false, xlabel: 'x', ylabel: 'y' });
      // time window: one period, or until the body is far out
      let ta, tb;
      if (bound) { ta = 0; tb = K.period; } else { let t = 0.05; while (Math.hypot(...K.pos(t)) < 1.6 * Math.hypot(x1 - x0, y1 - y0) && t < 1e4) t *= 1.15; ta = -t; tb = t; }
      const N = 12, pts = L.seq(601, (i) => K.pos(ta + (tb - ta) * i / 600));
      for (let j = 0; j < N; j += 2) {
        const seg = L.seq(41, (i) => K.pos(ta + (tb - ta) * (j + i / 40) / N));
        f.poly([[0, 0]].concat(seg), { c: 'c1', fo: 0.16, w: 0, layer: 'under' });
      }
      for (let j = 0; j <= N; j++) { const q = K.pos(ta + (tb - ta) * j / N); f.seg([0, 0], q, { c: 'c1', w: 0.8, op: 0.3, layer: 'under' }); }
      f.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 4' });
      f.line(pts, { c: 'c1', w: 2.6, closed: bound });
      f.dot(0, 0, { c: 'hl', r: 9, layer: 'main' });
      f.text(0, 0, T('centre, μ', '中心 μ'), { dy: -14, small: true, layer: 'main' });
      f.dot(1, 0, { c: 'c2', r: 4, layer: 'main' });
      f.text(1, 0, K.kind === 'circle' ? T('launch', '発射点') : K.om === 0 ? T('launch = periapsis', '発射点 = 近点') : T('launch = apoapsis', '発射点 = 遠点'), { dx: -10, dy: 18, anchor: 'end', small: true, c: 'c2', layer: 'main' });
      if (K.kind === 'ellipse') {
        const peri = K.pos(0), apo = K.pos(K.period / 2);
        f.seg(peri, apo, { c: 'muted', w: 1, dash: '5 4' });
        if (K.om !== 0 && Math.hypot(...peri) > 0.12 * (x1 - x0)) f.text(peri[0], peri[1], T('periapsis', '近点'), { dx: -8, dy: -8, anchor: 'end', small: true, layer: 'main' });
        else f.text(apo[0], apo[1], T('apoapsis', '遠点'), { dx: 8, dy: -8, anchor: 'start', small: true, layer: 'main' });
      }
      const vmax = K.h * (1 + K.e) / K.p, vsc = 0.16 * (x1 - x0) / vmax;
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        f.clear('over');
        const span = tb - ta, tt = ta + (((K.t0 - ta + t * span / 9) % span) + span) % span;
        const p = K.pos(tt), u = K.vel(tt);
        f.seg([0, 0], p, { c: 'hl', w: 1.6, layer: 'over' });
        f.arrow(p, [p[0] + u[0] * vsc, p[1] + u[1] * vsc], { c: 'c2', w: 2.4, layer: 'over' });
        f.dot(p[0], p[1], { c: 'c2', r: 7 });
      }, { autoplay: true });
      L.legend(ctx.host, [{ c: 'c1', label: T('orbit from the launch speed', '初速から決まる軌道') }, { kind: 'fill', c: 'c1', label: T('areas swept in equal times', '等しい時間に掃く面積') }, { c: 'muted', dash: true, label: T('circle r = 1', '円 r = 1') }, { c: 'c2', label: T('velocity', '速度') }]);
      const name = { circle: T('circle', '円'), ellipse: T('ellipse', '楕円'), parabola: T('parabola (escape)', '放物線（脱出）'), hyperbola: T('hyperbola (escape)', '双曲線（脱出）') }[K.kind];
      const items = [{ k: T('orbit', '軌道'), v: name, tone: bound ? 'key' : 'warn' }, { k: 'e = |v₀²/μ − 1|', v: fmt(K.e, 3) }, { k: T('energy v²/2 − μ/r', 'エネルギー v²/2 − μ/r'), v: fmt(K.E, 3) }, { k: T('angular momentum h', '角運動量 h'), v: fmt(K.h, 3) }];
      if (bound) items.push({ k: T('period 2π√(a³/μ)', '周期 2π√(a³/μ)'), v: fmt(K.period, 3) });
      ctx.readout(items, T(`Launched tangentially at r = 1. Circular speed √μ = ${fmt(Math.sqrt(mu), 3)}, escape speed √(2μ) = ${fmt(Math.sqrt(2 * mu), 3)}. Each shaded sector takes 1/12 of the ${bound ? 'period' : 'time shown'}, and all have the same area h·Δt/2.`, `r = 1 から接線方向に発射。円軌道速度 √μ = ${fmt(Math.sqrt(mu), 3)}、脱出速度 √(2μ) = ${fmt(Math.sqrt(2 * mu), 3)}。塗った各扇形は${bound ? '周期' : '表示時間'}の 1/12 で、面積はすべて h·Δt/2 に等しくなります。`));
    },
  };
})();
