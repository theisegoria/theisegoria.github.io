'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  /* ---------------- 1. Potential flow streamlines ---------------- */
  D.streamlines = {
    render(ctx, v) {
      const st = ctx.state;
      st.pos ||= [[-1, 0], [1, 0]];
      const U = v.uniform, src = [{ p: st.pos[0], m: v.source }, { p: st.pos[1], m: v.sink }];
      const k = 1 / (2 * Math.PI);
      const vel = (x, y) => { let u = U, w = 0; for (const s of src) { const dx = x - s.p[0], dy = y - s.p[1], r2 = dx * dx + dy * dy + 1e-9; u += s.m * k * dx / r2; w += s.m * k * dy / r2; } return [u, w]; };
      const X = [-3, 3], Y = [-1.8, 1.8];
      const f = L.fig(ctx.host, { x: X, y: Y, equal: true, maxH: 460, grid: false });
      const ref = U > 0.05 ? U : 0.4;
      f.raster((x, y) => { const q = vel(x, y); return L.clamp(Math.hypot(q[0], q[1]) / (2.2 * ref), 0, 1) * 0.85; }, { cmap: 'seq' });
      const near = (p, d) => src.some((s) => s.m !== 0 && Math.hypot(p[0] - s.p[0], p[1] - s.p[1]) < d);
      const seeds = [];
      if (U > 0.05) for (let y = Y[0] + 0.15; y < Y[1]; y += 0.3) seeds.push([X[0] + 0.01, y]);
      src.forEach((s) => { if (Math.abs(s.m) < 0.05) return; const n = Math.min(24, Math.max(8, Math.round(Math.abs(s.m) * 10))); for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * L.TAU; seeds.push([s.p[0] + 0.07 * Math.cos(a), s.p[1] + 0.07 * Math.sin(a)]); } });
      f.stream(vel, seeds, { c: 'ink', w: 1.1, op: 0.55, h: 0.015, steps: 900, stop: (p) => near(p, 0.05), flow: true });
      // stagnation points: coarse search, then Newton
      const stag = [], still = U <= 0.05 && Math.abs(v.source) < 0.05 && Math.abs(v.sink) < 0.05;
      if (!still) for (let i = 0; i <= 60; i++) for (let j = 0; j <= 36; j++) {
        let p = [X[0] + (X[1] - X[0]) * i / 60, Y[0] + (Y[1] - Y[0]) * j / 36];
        const q0 = vel(...p); if (Math.hypot(...q0) > 0.35 * ref) continue;
        for (let it = 0; it < 30; it++) {
          const e = 1e-5, q = vel(...p), qx = vel(p[0] + e, p[1]), qy = vel(p[0], p[1] + e);
          const a = (qx[0] - q[0]) / e, b = (qy[0] - q[0]) / e, c = (qx[1] - q[1]) / e, d = (qy[1] - q[1]) / e, det = a * d - b * c;
          if (Math.abs(det) < 1e-12) break;
          const dx = (d * q[0] - b * q[1]) / det, dy = (-c * q[0] + a * q[1]) / det;
          p = [p[0] - dx, p[1] - dy]; if (Math.hypot(dx, dy) < 1e-10) break;
        }
        if (Math.hypot(...vel(...p)) < 1e-6 && p[0] > X[0] && p[0] < X[1] && p[1] > Y[0] && p[1] < Y[1] && !near(p, 0.1) && !stag.some((s) => Math.hypot(s[0] - p[0], s[1] - p[1]) < 1e-3)) stag.push(p);
      }
      // dividing streamlines leave the stagnation points
      const div = [];
      stag.forEach((p) => { for (const a of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) div.push([p[0] + 0.02 * Math.cos(a + 0.785), p[1] + 0.02 * Math.sin(a + 0.785)]); });
      if (div.length) f.stream(vel, div, { c: 'c2', w: 2.2, op: 0.95, h: 0.01, steps: 1400, stop: (p) => near(p, 0.05) });
      stag.forEach((p) => f.dot(p[0], p[1], { c: 'hl', r: 5.5 }));
      src.forEach((s, i) => {
        const tone = s.m > 0 ? 'pos' : s.m < 0 ? 'neg' : 'muted';
        f.handle(s.p[0], s.p[1], { c: tone, r: 10, label: T(i ? 'Second singularity' : 'First singularity', i ? '2つ目の特異点' : '1つ目の特異点'), bounds: [-2.6, 2.6, -1.4, 1.4], onDrag: (x, y) => { st.pos[i] = [x, y]; ctx.redraw(); } });
        f.text(s.p[0], s.p[1], s.m > 0 ? '+' : s.m < 0 ? '−' : '0', { dy: 5, c: 'plate' });
      });
      f.hover((x, y) => { const q = vel(x, y); return { text: `u = (${fmt(q[0], 2)}, ${fmt(q[1], 2)})  |u| = ${fmt(Math.hypot(...q), 2)}` }; });
      L.legend(ctx.host, [{ c: 'ink', label: T('streamlines', '流線') }, { kind: 'fill', c: 'c1', label: T('speed |u| (darker is faster)', '速さ |u|（濃いほど速い）') }, { c: 'c2', label: T('dividing streamline', '分離流線') }, { kind: 'dot', c: 'hl', label: T('stagnation point, u = 0', 'よどみ点 u = 0') }]);
      const net = v.source + v.sink;
      const closed = U > 0.05 && Math.abs(net) < 1e-9 && v.source !== 0;
      ctx.readout([{ k: T('stagnation points', 'よどみ点'), v: String(stag.length), tone: 'key' }, { k: T('net outflow m₁ + m₂', '正味の湧き出し m₁ + m₂'), v: fmt(net, 2) }, { k: 'U', v: fmt(U, 2) }],
        still ? T('With no stream and no singularities the fluid is at rest.', '一様流も特異点もなければ流体は静止しています。') : closed ? T('Equal source and sink in a stream: the dividing streamline closes into a Rankine oval, and the flow outside is exactly the flow past a solid body of that shape.', '一様流の中に等しい湧き出しと吸い込み：分離流線は閉じてランキン楕円になり、その外側の流れは同じ形の固体を過ぎる流れと厳密に一致します。')
          : T('Drag the two singularities. Red is a source (m > 0), blue a sink (m < 0). Streamlines are integrated from the velocity field and are tangent to it everywhere.', '2つの特異点をドラッグできます。赤は湧き出し（m > 0）、青は吸い込み（m < 0）です。流線は速度場から積分したもので、どこでも速度に接しています。'));
    },
  };

  /* ---------------- 2. Venturi: continuity and Bernoulli ---------------- */
  D.bernoulli = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const ratio = v.area, u1 = v.speed, rho = 1000, p1 = 150; // kPa
      const bump = (x) => (x < 2.5 || x > 7.5 ? 0 : 0.5 * (1 - Math.cos(2 * Math.PI * (x - 2.5) / 5)));
      const A = (x) => 1 - (1 - ratio) * bump(x); // A(x)/A1, and the half-height of the channel
      const u = (x) => u1 / A(x);
      const p = (x) => p1 + 0.5 * rho * (u1 * u1 - u(x) ** 2) / 1000;
      const u2 = u1 / ratio, p2 = p(5);
      const hmax = Math.max(1, ratio);
      const plo = Math.min(p1, p2), col = (pp) => 0.5 + (pp - plo) / 25; // 1 unit per 25 kPa above the lowest pressure
      const top = hmax + Math.max(col(p1), col(p2), 2.2) + 0.9;
      L.h('p', 'lab-cap', ctx.host, T('A horizontal venturi. Tracers are released at equal time intervals. The liquid in each tube rises with the static pressure there: a difference of 25 kPa moves it by the inlet half-width.', '水平なベンチュリ管。トレーサーは等しい時間間隔で放出されます。細管の液面はその位置の静圧に応じて上がり、25 kPa の差で入口の半幅だけ動きます。'));
      const f = L.fig(ctx.host, { axes: false, x: [0, 10], y: [-hmax - 0.2, top], equal: true, maxH: 400 });
      const wall = L.sample(0, 10, 200, (x) => A(x));
      f.poly(wall.concat(wall.map(([x, y]) => [x, -y]).reverse()), { c: 'c1', fo: 0.08, w: 0, layer: 'under' });
      f.line(wall, { c: 'ink', w: 2.4 });
      f.line(wall.map(([x, y]) => [x, -y]), { c: 'ink', w: 2.4 });
      // streamlines of the quasi-one-dimensional flow: fixed fractions of the local half-height
      for (const s of [-0.66, -0.33, 0, 0.33, 0.66]) f.line(wall.map(([x, y]) => [x, s * y]), { c: 'c1', w: 1, op: 0.45, layer: 'under' });
      // piezometer tubes
      [[1.2, T('inlet', '入口')], [5, T('throat', 'のど部')], [8.8, T('outlet', '出口')]].forEach(([x, name]) => {
        const y0 = A(x), hgt = col(p(x));
        f.rect(x - 0.13, y0, 0.26, top - 0.3 - y0, { c: 'muted', fo: 0.04, w: 1 });
        f.rect(x - 0.13, y0, 0.26, hgt, { c: 'c1', fo: 0.55, nostroke: true });
        f.text(x, y0 + hgt, `${fmt(p(x), 1)} kPa`, { dy: -6, small: true, dx: 0 });
        f.text(x, -A(x), name, { dy: 16, small: true, c: 'muted' });
      });
      f.line([[1.2, A(1.2) + col(p(1.2))], [5, A(5) + col(p2)], [8.8, A(8.8) + col(p(8.8))]], { c: 'c2', w: 1.2, dash: '4 4' });
      // tracer particles: position from the travel time t(x) = ∫ dx / u(x)
      const n = 400, tx = [0]; for (let i = 1; i <= n; i++) { const xa = 10 * (i - 1) / n, xb = 10 * i / n; tx.push(tx[i - 1] + (xb - xa) / u((xa + xb) / 2)); }
      const xAt = (t) => { let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tx[m] < t) lo = m; else hi = m; } return 10 * (lo + (t - tx[lo]) / (tx[hi] - tx[lo])) / n; };
      const Ttot = tx[n], dtRel = 10 / u1 / 14;
      f.layers.dyn = f.group('main');
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        f.clear('dyn');
        const tt = t * 0.8;
        for (let j = 0; j * dtRel < Ttot + dtRel; j++) {
          const tau = ((tt % dtRel) + j * dtRel); if (tau > Ttot) continue;
          const x = xAt(tau);
          for (const s of [-0.66, -0.33, 0, 0.33, 0.66]) f.dot(x, s * A(x), { c: 'hl', r: 3.2, layer: 'dyn' });
        }
      }, { autoplay: true });
      L.h('p', 'lab-cap', ctx.host, T('Along the centreline: static pressure falls exactly as the dynamic pressure rises', '中心線に沿って：静圧は動圧が増えた分だけ下がります'));
      const dp = Math.abs(p1 - p2), ym = Math.max(1, dp * 1.25);
      const g = L.fig(ctx.host, { x: [0, 10], y: [-ym, ym], aspect: 0.34, maxH: 260, xlabel: T('position along the pipe', '管に沿った位置'), ylabel: T('change from inlet (kPa)', '入口からの変化 (kPa)') });
      g.hline(0, { c: 'ink', w: 1.8, dash: '6 4' });
      g.line(L.sample(0, 10, 200, (x) => p(x) - p1), { c: 'c2', w: 2.6 });
      g.line(L.sample(0, 10, 200, (x) => 0.5 * rho * (u(x) ** 2 - u1 * u1) / 1000), { c: 'c1', w: 2.6 });
      L.legend(ctx.host, [{ c: 'c2', label: T('static pressure P − P₁', '静圧 P − P₁') }, { c: 'c1', label: T('dynamic pressure ½ρ(v² − v₁²)', '動圧 ½ρ(v² − v₁²)') }, { c: 'ink', dash: true, label: T('their sum, zero everywhere', '和（どこでも 0）') }, { kind: 'dot', c: 'hl', label: T('tracers', 'トレーサー') }]);
      ctx.readout([{ k: T('throat speed v₂ = v₁A₁/A₂', 'のど部の速さ v₂ = v₁A₁/A₂'), v: `${fmt(u2, 2)} m/s`, tone: 'key' }, { k: T('throat pressure', 'のど部の圧力'), v: `${fmt(p2, 1)} kPa` }, { k: 'P₁ − P₂ = ½ρ(v₂² − v₁²)', v: `${fmt(p1 - p2, 2)} kPa` }],
        T('Water, ρ = 1000 kg/m³, inlet pressure 150 kPa, horizontal pipe so ρgz is the same everywhere. An area ratio above 1 widens the pipe and the pressure rises instead.', '水（ρ = 1000 kg/m³）、入口圧力 150 kPa、水平な管なので ρgz はどこでも同じです。面積比が1より大きいと管が広がり、圧力は逆に上がります。'));
    },
  };

  /* ---------------- 3. Vorticity and circulation ---------------- */
  // Area of the intersection of two circles (radii r1, r2, centre distance d).
  const lens = (r1, r2, d) => {
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
    const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)), b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
    return a + b - 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  };
  D.vorticity = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state; st.c ||= [0, 0];
      const prof = Math.round(v.profile), Om = v.rotation, rho = v.radius, a = 0.6;
      const uth = (r) => prof === 0 ? Om * r : prof === 1 ? Om * a * a / Math.max(r, 1e-6) : (r < a ? Om * r : Om * a * a / r);
      const om = (r) => prof === 0 ? 2 * Om : prof === 1 ? 0 : (r < a ? 2 * Om : 0);
      const vel = (x, y) => { const r = Math.hypot(x, y); if (r < 1e-9) return [0, 0]; const q = uth(r) / r; return [-q * y, q * x]; };
      const row = L.h('div', 'lab-row', ctx.host);
      const cA = L.h('div', 'lab-col', row), cB = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', cA, T('Velocity field, vorticity (colour) and the loop C. Crosses are paddle wheels carried by the flow.', '速度場、渦度（色）、ループ C。十字は流れに運ばれる水車です。'));
      L.h('p', 'lab-cap', cB, T('Profiles against radius r', '半径 r に対する分布'));
      const f = L.fig(cA, { x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, maxH: 440, grid: false });
      if (prof !== 1 && Math.abs(Om) > 1e-9) f.raster((x, y) => om(Math.hypot(x, y)) / 4 * 0.9, { cmap: 'div' });
      [0.3, 0.6, 1.0, 1.4, 1.8].forEach((r) => f.circle(0, 0, r, { c: 'muted', w: 0.8, op: 0.45, layer: 'under' }));
      if (Math.abs(Om) > 1e-9) f.field(vel, { n: f.small ? 11 : 15, c: 'ink' });
      if (prof === 2) f.circle(0, 0, a, { c: 'ink', w: 1, dash: '3 4', op: 0.7 });
      if (prof === 1 && Math.abs(Om) > 1e-9) f.dot(0, 0, { c: Om > 0 ? 'pos' : 'neg', r: 5, layer: 'main' });
      // the loop and the circulation along it
      const [cx, cy] = st.c, M = 720;
      let G = 0;
      for (let i = 0; i < M; i++) { const t = (i + 0.5) / M * L.TAU, x = cx + rho * Math.cos(t), y = cy + rho * Math.sin(t), q = vel(x, y); G += (q[0] * -Math.sin(t) + q[1] * Math.cos(t)) * rho * L.TAU / M; }
      const d0 = Math.hypot(cx, cy);
      const flux = prof === 0 ? 2 * Om * Math.PI * rho * rho : prof === 1 ? (d0 < rho ? 2 * Math.PI * Om * a * a : 0) : 2 * Om * lens(rho, a, d0);
      f.circle(cx, cy, rho, { c: 'c2', w: 2.8 });
      const ta = Math.PI / 4, pa = [cx + rho * Math.cos(ta), cy + rho * Math.sin(ta)];
      f.arrow(pa, [pa[0] - 0.02 * Math.sin(ta), pa[1] + 0.02 * Math.cos(ta)], { c: 'c2', w: 2.8 });
      f.text(cx + rho * 0.72, cy - rho * 0.72, 'C', { math: true, dx: 10, dy: 10, c: 'c2' });
      f.handle(cx, cy, { c: 'c2', r: 7, label: T('Loop centre', 'ループの中心'), bounds: [-1.6, 1.6, -1.6, 1.6], onDrag: (x, y) => { st.c = [x, y]; ctx.redraw(); } });
      // paddle wheels: carried round at angular speed u/r, turning at ω/2
      const wheels = [];
      [0.35, 0.95, 1.6].forEach((r, i) => { for (let j = 0; j < 3; j++) wheels.push([r, j * L.TAU / 3 + i * 0.5]); });
      f.layers.dyn = f.group('main');
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        f.clear('dyn');
        const tt = t * 0.6;
        wheels.forEach(([r, p0]) => {
          const ang = p0 + uth(r) / r * tt, x = r * Math.cos(ang), y = r * Math.sin(ang), spin = om(r) / 2 * tt, s = 0.13;
          for (const k of [0, Math.PI / 2]) f.seg([x - s * Math.cos(spin + k), y - s * Math.sin(spin + k)], [x + s * Math.cos(spin + k), y + s * Math.sin(spin + k)], { c: 'hl', w: 3, layer: 'dyn' });
          f.seg([x, y], [x + s * Math.cos(spin), y + s * Math.sin(spin)], { c: 'c4', w: 3, layer: 'dyn' });
        });
      }, { autoplay: true });
      const ym = Math.max(1, 2.3 * Math.abs(Om));
      const g = L.fig(cB, { x: [0, 2.2], y: [-ym, ym], aspect: 0.9, maxH: 440, xlabel: 'r', ylabel: '' });
      g.line(L.sample(0.005, 2.2, 400, (r) => { const q = uth(r); return Math.abs(q) > 1.5 * ym ? NaN : q; }), { c: 'c1', w: 2.4 });
      if (prof === 1) { g.line(L.sample(0, 2.2, 2, () => 0), { c: 'c3', w: 2.4 }); g.text(0.05, 0, T('ω = 0 for r > 0', 'r > 0 で ω = 0'), { anchor: 'start', dy: -8, small: true, c: 'c3' }); }
      else g.line(L.sample(0, 2.2, 400, om), { c: 'c3', w: 2.4 });
      if (prof === 2) g.vline(a, { c: 'muted' });
      if (d0 < 1e-6 || prof === 0) g.vline(rho, { c: 'c2', dash: '4 3', w: 1.4 });
      L.legend(ctx.host, [{ c: 'c1', label: T('speed u_θ(r)', '周方向速度 u_θ(r)') }, { c: 'c3', label: T('vorticity ω(r)', '渦度 ω(r)') }, { c: 'c2', label: T('loop C', 'ループ C') }, { kind: 'fill', c: 'pos', label: T('vorticity > 0', '渦度 > 0') }, { c: 'hl', label: T('paddle wheels', '水車') }]);
      const inside = prof === 1 ? (d0 < rho ? T('The loop encloses the vortex line', 'ループが渦糸を囲んでいます') : T('The loop misses the vortex line, so Γ = 0', 'ループが渦糸を囲まないので Γ = 0')) : '';
      ctx.readout([{ k: 'Γ = ∮u·dl', v: fmt(G, 3), tone: 'key' }, { k: '∬ω dA', v: fmt(flux, 3) }, { k: T('ω at the loop centre', 'ループ中心の ω'), v: prof === 1 ? (d0 < 1e-6 ? '∞' : '0') : fmt(om(d0), 3) }],
        (inside ? inside + T('. ', '。') : '') + T('Drag the loop. Stokes: the circulation equals the vorticity flux through the loop. In the free vortex the paddle wheels orbit without turning.', 'ループをドラッグできます。ストークスの定理により、循環はループを貫く渦度の流束に等しくなります。自由渦では水車は回転せずに周回します。'));
    },
  };
})();
