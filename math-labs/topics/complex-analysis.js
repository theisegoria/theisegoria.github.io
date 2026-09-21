'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = L.TAU;
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const pw = (z, k) => { let r = [1, 0]; for (let i = 0; i < k; i++) r = mul(r, z); return r; };
  const cexp = (z) => { const m = Math.exp(z[0]); return [m * Math.cos(z[1]), m * Math.sin(z[1])]; };
  const arg = (z) => Math.atan2(z[1], z[0]);
  const deg = (r) => r * 180 / PI;
  const cstr = (z, d = 3) => `${fmt(z[0], d)} ${z[1] < 0 ? '−' : '+'} ${fmt(Math.abs(z[1]), d)}i`;
  const arc = (c, r, a0, a1, n = 24) => L.seq(n + 1, (i) => { const t = a0 + (a1 - a0) * i / n; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });

  /* ---------- 1. conformal maps z -> z^k ---------- */
  D.conformal = {
    render(ctx, v) {
      const k = Math.round(v.power), ang = v.angle * PI / 180, st = ctx.state;
      st.z0 ||= [0.8, 0.5];
      const z0 = st.z0, F = (z) => pw(z, k), w0 = F(z0);
      const R = 1.5, W = Math.min(7, Math.max(1.6, Math.pow(1.55, k)));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('z-plane: a grid and two short curves through z₀. Drag z₀.', 'z 平面：格子と z₀ を通る2本の短い曲線。z₀ をドラッグできます。'));
      L.h('p', 'lab-cap', c2, T(`w-plane: their images under w = z${['', '', '²', '³', '⁴'][k]}.`, `w 平面：w = z${['', '', '²', '³', '⁴'][k]} による像。`));
      const a = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, maxH: 380, xlabel: 'Re z', ylabel: 'Im z' });
      const b = L.fig(c2, { x: [-W, W], y: [-W, W], equal: true, maxH: 380, xlabel: 'Re w', ylabel: 'Im w' });
      for (let i = -6; i <= 6; i++) {
        const s = i * 0.25;
        const vert = L.sample(-R, R, 160, (y) => [s, y]), hor = L.sample(-R, R, 160, (x) => [x, s]);
        const o = { w: i === 0 ? 1.4 : 0.9, op: i === 0 ? 0.7 : 0.4, layer: 'under' };
        a.line(vert, Object.assign({ c: 'c1' }, o)); a.line(hor, Object.assign({ c: 'c3' }, o));
        b.line(vert.map(F), Object.assign({ c: 'c1' }, o)); b.line(hor.map(F), Object.assign({ c: 'c3' }, o));
      }
      const th1 = 0.35, th2 = th1 + ang, len = 0.42;
      const probe = (th) => L.sample(-len, len, 60, (t) => [z0[0] + t * Math.cos(th) + 0.25 * t * t * Math.sin(th), z0[1] + t * Math.sin(th) - 0.25 * t * t * Math.cos(th)]);
      const p1 = probe(th1), p2 = probe(th2);
      a.line(p1, { c: 'c2', w: 3 }); a.line(p2, { c: 'c4', w: 3 });
      b.line(p1.map(F), { c: 'c2', w: 3 }); b.line(p2.map(F), { c: 'c4', w: 3 });
      // measured angle between image curves at w0
      const eps = 1e-4, dirOut = (th) => { const q = F([z0[0] + eps * Math.cos(th), z0[1] + eps * Math.sin(th)]); return arg([q[0] - w0[0], q[1] - w0[1]]); };
      let out = dirOut(th2) - dirOut(th1); out = ((out % TAU) + TAU) % TAU;
      a.line(arc(z0, 0.16, th1, th2), { c: 'hl', w: 2.2 });
      const r0 = Math.hypot(...z0), d1 = dirOut(th1);
      b.line(arc(w0, 0.1 * W, d1, d1 + out), { c: 'hl', w: 2.2 });
      a.text(z0[0], z0[1], `${fmt(v.angle, 0)}°`, { dx: 14, dy: -14, anchor: 'start', small: true });
      b.dot(w0[0], w0[1], { c: 'hl', r: 5 });
      b.text(w0[0], w0[1], `${fmt(deg(out), 1)}°`, { dx: 12, dy: -12, anchor: 'start', small: true });
      a.handle(z0[0], z0[1], { c: 'hl', snap: 0.05, bounds: [-1.3, 1.3, -1.3, 1.3], label: T('Point z₀', '点 z₀'), onDrag: (x, y) => { st.z0 = [x, y]; ctx.redraw(); } });
      const dF = k === 1 ? [1, 0] : mul([k, 0], pw(z0, k - 1));
      L.legend(ctx.host, [{ c: 'c1', label: T('lines Re z = const', '直線 Re z = 一定') }, { c: 'c3', label: T('lines Im z = const', '直線 Im z = 一定') }, { c: 'c2', label: T('curve 1', '曲線 1') }, { c: 'c4', label: T('curve 2', '曲線 2') }]);
      const crit = r0 < 1e-9 && k > 1;
      ctx.readout([
        { k: "f′(z₀) = kz₀ᵏ⁻¹", v: cstr(dF, 3) },
        { k: T('local scale |f′|', '局所的な拡大率 |f′|'), v: fmt(Math.hypot(...dF), 3) },
        { k: T('rotation arg f′', '回転 arg f′'), v: crit ? '·' : `${fmt(deg(arg(dF)), 1)}°` },
        { k: T('angle in → out', '角度 入力 → 出力'), v: `${fmt(v.angle, 0)}° → ${fmt(deg(out), 1)}°`, tone: crit ? 'warn' : 'good' },
      ], crit ? T(`At z₀ = 0 the derivative vanishes and every angle is multiplied by ${k}.`, `z₀ = 0 では導関数が0になり、すべての角度が ${k} 倍されます。`) : T('Both curves turn by the same arg f′(z₀) and stretch by |f′(z₀)|, so the angle between them survives. Drag z₀ to 0 to break it.', '2本の曲線は同じ arg f′(z₀) だけ回転し、|f′(z₀)| 倍に伸びるので、間の角度は保たれます。z₀ を0へ動かすと崩れます。'));
    },
  };

  /* ---------- 2. residues ---------- */
  D.residue = {
    render(ctx, v) {
      const st = ctx.state; st.c ||= [0, 0];
      const c = st.c, r = v.radius, A = [v.pole, 0], B = [0.9, 0.9];
      const poles = [{ p: A, res: 1, name: 'a' }, { p: B, res: 2, name: 'b' }];
      const f = (z) => { const u = div([1, 0], [z[0] - A[0], z[1] - A[1]]), w = div([2, 0], [z[0] - B[0], z[1] - B[1]]); return [u[0] + w[0], u[1] + w[1]]; };
      // running integral along the positively oriented circle, trapezoid rule
      const M = 2400, path = [[0, 0]];
      let I = [0, 0], prev = null;
      for (let j = 0; j <= M; j++) {
        const t = TAU * j / M, e = [Math.cos(t), Math.sin(t)];
        const g = mul(f([c[0] + r * e[0], c[1] + r * e[1]]), [-r * e[1], r * e[0]]);
        if (prev) { I = [I[0] + (prev[0] + g[0]) / 2 * TAU / M, I[1] + (prev[1] + g[1]) / 2 * TAU / M]; path.push(I.slice()); }
        prev = g;
      }
      const dist = poles.map((P) => Math.hypot(P.p[0] - c[0], P.p[1] - c[1]) - r);
      const near = dist.some((d) => Math.abs(d) < 0.04);
      const inside = poles.filter((P, i) => dist[i] < 0);
      const sum = inside.reduce((s, P) => s + P.res, 0);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Phase of f (colour) with its two poles. Drag the centre of the circle.', 'f の偏角（色）と2つの極。円の中心をドラッグできます。'));
      L.h('p', 'lab-cap', c2, T('The running integral ∫f dz as you travel once round the circle.', '円を1周する間の途中までの積分 ∫f dz。'));
      const a = L.fig(c1, { x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, maxH: 380, xlabel: 'Re z', ylabel: 'Im z' });
      const col = L.colours();
      a.raster((x, y) => { const w = f([x, y]), p = L.cmaps.phase(arg(w), Math.hypot(...w)); return [p[0] * 0.55 + col.plate[0] * 0.45, p[1] * 0.55 + col.plate[1] * 0.45, p[2] * 0.55 + col.plate[2] * 0.45]; }, { res: 3 });
      a.circle(c[0], c[1], r, { c: 'ink', w: 2.8 });
      for (let q = 0; q < 4; q++) { const t = q * PI / 2 + PI / 4, p = [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)], d = [-Math.sin(t), Math.cos(t)]; a.arrow([p[0] - d[0] * 0.02, p[1] - d[1] * 0.02], [p[0] + d[0] * 0.2, p[1] + d[1] * 0.2], { c: 'ink', w: 2.2 }); }
      poles.forEach((P, i) => {
        a.dot(P.p[0], P.p[1], { c: dist[i] < 0 ? 'hl' : 'ink', r: 6.5 });
        a.text(P.p[0], P.p[1], T(`Res ${P.res}`, `留数 ${P.res}`), { dy: -12, small: true });
      });
      a.handle(c[0], c[1], { c: 'c2', r: 7, bounds: [-1.8, 1.8, -1.8, 1.8], snap: 0.05, label: T('Centre of the contour', '経路の中心'), onDrag: (x, y) => { st.c = [x, y]; ctx.redraw(); } });
      const b = L.fig(c2, { x: [-11, 11], y: [-4, 22], equal: true, maxH: 380, xlabel: 'Re', ylabel: 'Im' });
      [0, 1, 2, 3].forEach((m) => { b.hline(TAU * m, { c: 'muted', w: 1, dash: '3 4' }); b.text(11, TAU * m, m ? `${2 * m}πi` : '0', { anchor: 'end', dx: -4, dy: -5, small: true, c: 'muted' }); });
      b.line(path, { c: 'c1', w: 2.4 });
      b.dot(0, 0, { c: 'ink', r: 4 });
      b.dot(I[0], I[1], { c: 'hl', r: 6.5 });
      L.legend(ctx.host, [{ c: 'ink', label: T('contour γ, counterclockwise', '経路 γ（反時計回り）') }, { kind: 'dot', c: 'hl', label: T('enclosed pole; final value of the integral', '囲まれた極・積分の最終値') }, { c: 'c1', label: T('running integral', '途中までの積分') }]);
      ctx.readout([
        { k: T('poles inside', '内部の極'), v: inside.length ? inside.map((P) => P.name).join(', ') : T('none', 'なし') },
        { k: T('2πi × Σ Res', '2πi × Σ 留数'), v: sum ? `${2 * sum}πi` : '0', tone: 'key' },
        { k: T('numerical ∮ f dz', '数値計算の ∮ f dz'), v: near ? T('pole on γ', '極が γ 上') : cstr(I, 3), tone: near ? 'warn' : 'good' },
      ], near ? T('A pole sits on the contour, so the integral is undefined; move the circle off it.', '極が経路上にあるため積分は定義されません。円を極からずらしてください。') : T('f(z) = 1/(z − a) + 2/(z − b). With no pole inside, the running integral wanders and comes back to 0; otherwise it ends exactly at 2πi·ΣRes.', 'f(z) = 1/(z − a) + 2/(z − b)。内部に極がなければ途中までの積分はさまよった後に0へ戻り、極があればちょうど 2πi·Σ留数 で終わります。'));
    },
  };

  /* ---------- 3. harmonic conjugates ---------- */
  // marching squares: returns polylines (as one point list with null breaks) for each level
  function contours(fn, x0, x1, y0, y1, nx, ny, levels, cap) {
    const g = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) g[j * (nx + 1) + i] = fn(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny);
    const out = [], dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    for (const c of levels) {
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const v = [g[j * (nx + 1) + i], g[j * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i]];
        if (v.some((q) => !Number.isFinite(q) || Math.abs(q) > cap)) continue;
        const X = x0 + i * dx, Y = y0 + j * dy;
        const P = [[X, Y], [X + dx, Y], [X + dx, Y + dy], [X, Y + dy]];
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const p = v[e] - c, q = v[(e + 1) % 4] - c;
          if ((p < 0) !== (q < 0)) { const t = p / (p - q); pts.push([P[e][0] + t * (P[(e + 1) % 4][0] - P[e][0]), P[e][1] + t * (P[(e + 1) % 4][1] - P[e][1])]); }
        }
        if (pts.length >= 2) { out.push(pts[0], pts[1], null); if (pts.length === 4) out.push(pts[2], pts[3], null); }
      }
    }
    return out;
  }
  const FUNCS = [
    { g: (z) => mul(z, z), d: (z) => [2 * z[0], 2 * z[1]], name: 'z²', step: 1, cap: 9 },
    { g: (z) => pw(z, 3), d: (z) => mul([3, 0], mul(z, z)), name: 'z³', step: 2.5, cap: 25 },
    { g: cexp, d: cexp, name: 'eᶻ', step: 1, cap: 8 },
    { g: (z) => div([1, 0], z), d: (z) => div([-1, 0], mul(z, z)), name: '1/z', step: 0.5, cap: 5 },
  ];
  D.harmonic = {
    render(ctx, v) {
      const st = ctx.state; st.p ||= [0.9, 0.6];
      const Fn = FUNCS[Math.round(v.fn ?? 0)] || FUNCS[0], ph = v.phase * PI / 180, rot = [Math.cos(ph), Math.sin(ph)];
      const F = (z) => mul(rot, Fn.g(z)), dF = (z) => mul(rot, Fn.d(z));
      const R = 2, f = L.fig(ctx.host, { x: [-R, R], y: [-R, R], equal: true, maxH: 460, xlabel: 'x', ylabel: 'y' });
      f.raster((x, y) => 0.45 * Math.tanh(F([x, y])[0] / (2 * Fn.step)), { cmap: 'div', res: 3 });
      const levels = L.seq(Math.round(2 * Fn.cap / Fn.step) + 1, (i) => -Fn.cap + i * Fn.step + Fn.step / 2);
      const n = f.small ? 90 : 130;
      f.line(contours((x, y) => F([x, y])[0], -R, R, -R, R, n, n, levels, Fn.cap * 1.5), { c: 'c1', w: 1.5, op: 0.9 });
      f.line(contours((x, y) => F([x, y])[1], -R, R, -R, R, n, n, levels, Fn.cap * 1.5), { c: 'c2', w: 1.5, op: 0.9 });
      const p = st.p, d = dF(p), m = Math.hypot(...d);
      const gu = [d[0], -d[1]], gv = [d[1], d[0]];
      if (m > 1e-6) {
        const s = 0.55 / m;
        f.arrow(p, [p[0] + gu[0] * s, p[1] + gu[1] * s], { c: 'c1', w: 3.2, layer: 'over' });
        f.arrow(p, [p[0] + gv[0] * s, p[1] + gv[1] * s], { c: 'c2', w: 3.2, layer: 'over' });
        const q = 0.12, e1 = [gu[0] / m * q, gu[1] / m * q], e2 = [gv[0] / m * q, gv[1] / m * q];
        f.line([[p[0] + e1[0], p[1] + e1[1]], [p[0] + e1[0] + e2[0], p[1] + e1[1] + e2[1]], [p[0] + e2[0], p[1] + e2[1]]], { c: 'ink', w: 1.4, layer: 'over' });
        f.text(p[0] + gu[0] * s, p[1] + gu[1] * s, '∇u', { dx: 8 * Math.sign(gu[0] || 1), dy: -6, c: 'c1', anchor: gu[0] >= 0 ? 'start' : 'end' });
        f.text(p[0] + gv[0] * s, p[1] + gv[1] * s, '∇v', { dx: 8 * Math.sign(gv[0] || 1), dy: -6, c: 'c2', anchor: gv[0] >= 0 ? 'start' : 'end' });
      }
      f.handle(p[0], p[1], { c: 'hl', bounds: [-1.9, 1.9, -1.9, 1.9], label: T('Probe point', '調べる点'), onDrag: (x, y) => { st.p = [x, y]; ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'c1', label: T(`level curves of u = Re(e^{iφ}${Fn.name})`, `u = Re(e^{iφ}${Fn.name}) の等高線`).replace('e^{iφ}', 'eⁱᵠ') }, { c: 'c2', label: T(`level curves of v = Im(e^{iφ}${Fn.name})`, `v = Im(e^{iφ}${Fn.name}) の等高線`).replace('e^{iφ}', 'eⁱᵠ') }, { kind: 'fill', c: 'pos', label: T('u > 0', 'u > 0') }, { kind: 'fill', c: 'neg', label: T('u < 0', 'u < 0') }]);
      const w = F(p);
      ctx.readout([
        { k: 'u, v', v: `${fmt(w[0], 3)}, ${fmt(w[1], 3)}` },
        { k: '|∇u| = |∇v| = |f′|', v: fmt(m, 3), tone: 'key' },
        { k: '∇u · ∇v', v: fmt(gu[0] * gv[0] + gu[1] * gv[1], 3), tone: 'good' },
      ], m < 1e-3 ? T('Here f′ = 0: both gradients vanish and the level curves cross at other angles.', 'ここでは f′ = 0 で、両方の勾配が0になり、等高線は別の角度で交わります。') : T('Cauchy–Riemann: ∇v is ∇u turned by 90°, with the same length. Drag the gold probe.', 'コーシー・リーマン方程式：∇v は ∇u を90°回したもので、長さも同じです。金色の点をドラッグできます。'));
    },
  };
})();
