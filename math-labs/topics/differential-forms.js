'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const PI = Math.PI, TAU = 2 * PI;
  const simpson = (fn, a, b, n = 600) => { const h = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fn(a + i * h); return s * h / 3; };

  // ---------- 1. line integrals of three 1-forms ----------
  const FIELDS = [
    { F: (x, y) => [y, x], name: ['ω = d(xy) = y dx + x dy (exact)', 'ω = d(xy) = y dx + x dy（完全形式）'] },
    { F: (x, y) => [-y, x], name: ['ω = −y dx + x dy (dω = 2 dx∧dy)', 'ω = −y dx + x dy（dω = 2 dx∧dy）'] },
    { F: (x, y) => { const r2 = x * x + y * y; return [-y / r2, x / r2]; }, name: ['ω = dθ = (−y dx + x dy)/(x² + y²) (closed, not exact)', 'ω = dθ = (−y dx + x dy)/(x² + y²)（閉形式だが完全でない）'] },
  ];
  D['line-integral'] = {
    render(ctx, v) {
      const st = ctx.state, fi = Math.round(v.field ?? 2), FD = FIELDS[fi], r = v.radius, turns = v.turns;
      st.c ||= [0.35, 0.2];
      const c = st.c, th1 = TAU * turns;
      const g = (t) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)], gd = (t) => [-r * Math.sin(t), r * Math.cos(t)];
      const integrand = (t) => { const p = g(t), F = FD.F(p[0], p[1]), d = gd(t); return F[0] * d[0] + F[1] * d[1]; };
      const dist0 = Math.abs(Math.hypot(c[0], c[1]) - r), sing = fi === 2 && dist0 < 0.04;
      const W = sing ? NaN : simpson(integrand, 0, th1, 1200);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${FD.name[0]}. Drag the centre of the path, or its starting point to change the radius.`, `${FD.name[1]}。経路の中心や出発点をドラッグできます。`));
      const f = fig(c1, { x: [-2, 2], y: [-2, 2], equal: true, maxH: 400, grid: false });
      f.field((x, y) => { const F = FD.F(x, y); const m = Math.hypot(...F); return m > 4 ? [F[0] / m * 4, F[1] / m * 4] : F; }, { n: f.small ? 13 : 17, c: 'muted' });
      if (fi === 2) { f.circle(0, 0, 0.07, { c: 'ink', w: 1.6, fill: 'plate', fo: 1 }); f.text(0, 0, T('hole', '穴'), { small: true, dy: -12 }); }
      // path coloured by the sign of F·T
      const n = Math.max(60, Math.round(160 * turns));
      const vals = L.seq(n + 1, (i) => integrand(th1 * i / n) / r);
      const vmax = Math.max(1e-9, ...vals.map(Math.abs));
      for (let i = 0; i < n; i++) {
        const a = g(th1 * i / n), b = g(th1 * (i + 1) / n), val = 0.5 * (vals[i] + vals[i + 1]);
        const lap = Math.floor(th1 * i / n / TAU), off = lap * 0.045;
        const sc = (p) => [c[0] + (p[0] - c[0]) * (1 + off / r), c[1] + (p[1] - c[1]) * (1 + off / r)];
        f.line([sc(a), sc(b)], { c: Math.abs(val) < 1e-6 ? 'muted' : val > 0 ? 'pos' : 'neg', w: 2 + 3.5 * Math.min(1, Math.abs(val) / vmax) });
      }
      for (let k = 1; k <= 3 * Math.ceil(turns); k++) { const t = th1 * k / (3 * Math.ceil(turns) + 1), p = g(t), d = gd(t), l = Math.hypot(...d); f.arrow([p[0] - d[0] / l * 0.08, p[1] - d[1] / l * 0.08], [p[0] + d[0] / l * 0.1, p[1] + d[1] / l * 0.1], { c: 'ink', w: 2 }); }
      const e = g(th1);
      f.dot(e[0], e[1], { c: 'ink', r: 5 });
      f.handle(c[0], c[1], { c: 'c1', label: T('Centre of the path', '経路の中心'), bounds: [-1.6, 1.6, -1.6, 1.6], onDrag: (x, y) => { st.c = [x, y]; ctx.redraw(); } });
      const s0 = g(0);
      f.handle(s0[0], s0[1], { c: 'hl', label: T('Start of the path (sets the radius)', '経路の出発点（半径を決める）'), onDrag: (x, y) => ctx.set('radius', Math.hypot(x - c[0], y - c[1])) });
      // right: running integral
      L.h('p', 'lab-cap', c2, T('The running integral ∫ω as the path is traced.', '経路をたどるにつれて積み上がる積分 ∫ω。'));
      const run = [[0, 0]]; let acc = 0; const m = 400;
      if (!sing) for (let i = 1; i <= m; i++) { acc += simpson(integrand, th1 * (i - 1) / m, th1 * i / m, 4); run.push([turns * i / m, acc]); }
      const ys = run.map((p) => p[1]), ylo = Math.min(0, ...ys), yhi = Math.max(0, ...ys), pad = Math.max(0.3, (yhi - ylo) * 0.12);
      const G = fig(c2, { x: [0, turns], y: [ylo - pad, yhi + pad], aspect: 0.85, maxH: 400, xlabel: T('turns traced', 'たどった回転数'), ylabel: '∫ω' });
      if (fi === 2) for (let k = -4; k <= 4; k++) if (k * TAU > ylo - pad && k * TAU < yhi + pad) { G.hline(k * TAU, { c: 'muted', w: 1, dash: '3 4' }); if (k) G.text(0, k * TAU, `${k === 1 ? '' : k === -1 ? '−' : k}2π`.replace('-', '−'), { anchor: 'start', dx: 4, dy: 14, small: true, c: 'muted' }); }
      if (!sing) { G.line(run, { c: 'c4', w: 2.6 }); G.dot(turns, W, { c: 'hl', r: 6.5 }); }
      L.legend(ctx.host, [{ c: 'pos', label: T('ω(γ̇) > 0: path goes with the field', 'ω(γ̇) > 0：場に沿って進む') }, { c: 'neg', label: T('ω(γ̇) < 0: against the field', 'ω(γ̇) < 0：場に逆らう') }, { c: 'c4', label: T('running integral', '積み上がる積分') }, { kind: 'dot', c: 'c1', label: T('drag: centre', 'ドラッグ：中心') }, { kind: 'dot', c: 'hl', label: T('drag: radius', 'ドラッグ：半径') }]);
      const encl = Math.hypot(c[0], c[1]) < r;
      const note = sing ? T('The path runs through the hole, where dθ is not defined.', '経路が dθ の定義されない穴を通っています。')
        : fi === 0 ? T(`ω = d(xy) is exact, so the integral is xy at the end minus xy at the start: ${fmt(e[0] * e[1] - s0[0] * s0[1], 4)}. Every whole turn contributes 0.`, `ω = d(xy) は完全形式なので、積分は終点の xy から始点の xy を引いたもの ${fmt(e[0] * e[1] - s0[0] * s0[1], 4)} です。1周するごとの寄与は 0 です。`)
        : fi === 1 ? T(`dω = 2 dx∧dy, so each whole turn gives twice the enclosed area, 2πr² = ${fmt(TAU * r * r, 4)}.`, `dω = 2 dx∧dy なので、1周ごとに囲む面積の2倍 2πr² = ${fmt(TAU * r * r, 4)} が加わります。`)
          : encl ? T('dθ is closed (dω = 0 away from the origin), yet each turn around the hole adds 2π: no function θ is defined on the whole punctured plane.', 'dθ は閉形式（原点以外で dω = 0）ですが、穴を1周するごとに 2π 増えます。穴のあいた平面全体で定義された関数 θ は存在しません。') : T('The path does not wind around the hole, so each whole turn contributes 0, as for an exact form.', '経路が穴のまわりを回らないので、完全形式と同じく1周ごとの寄与は 0 です。');
      ctx.readout([
        { k: T('∫ ω along γ', 'γ に沿った ∫ ω'), v: sing ? T('undefined', '定義されない') : fmt(W, 4), tone: sing ? 'warn' : 'key' },
        { k: fi === 2 ? T('∫ω / 2π', '∫ω / 2π') : T('turns', '回転数'), v: fi === 2 && !sing ? fmt(W / TAU, 3) : fmt(turns, 2) },
        { k: T('winds around the origin', '原点を回る'), v: encl ? T('yes', 'はい') : T('no', 'いいえ') },
      ], note);
    },
  };

  // ---------- 2. Stokes' theorem on a disk ----------
  const P = (x, y) => -0.5 * y + y * y * y / 3, Q = (x, y) => 0.5 * x - x * x * x / 3 + 0.4 * x * x;
  const curl = (x, y) => 1 - x * x - y * y + 0.8 * x;
  const circ = (c, r) => simpson((t) => { const x = c[0] + r * Math.cos(t), y = c[1] + r * Math.sin(t); return P(x, y) * (-r * Math.sin(t)) + Q(x, y) * (r * Math.cos(t)); }, 0, TAU, 240);
  const flux = (c, r) => simpson((rho) => rho * simpson((t) => curl(c[0] + rho * Math.cos(t), c[1] + rho * Math.sin(t)), 0, TAU, 48), 0, r, 40);
  D.stokes = {
    render(ctx, v) {
      const st = ctx.state, r = v.radius, o = v.orientation >= 0 ? 1 : -1;
      st.c ||= [0, 0];
      const c = st.c;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Colour shows dω = (1 − x² − y² + 0.8x) dx∧dy; arrows show ω. Drag the disk.', '色は dω = (1 − x² − y² + 0.8x) dx∧dy、矢印は ω を表します。円板はドラッグできます。'));
      const f = fig(c1, { x: [-2, 2], y: [-2, 2], equal: true, maxH: 400, grid: false });
      f.raster((x, y) => curl(x, y) / 2.2, { cmap: 'div', res: 3 });
      f.field((x, y) => [P(x, y), Q(x, y)], { n: f.small ? 11 : 15, c: 'muted' });
      // level set dω = 0
      f.line(L.sample(0, TAU, 160, (t) => [0.4 + Math.sqrt(1.16) * Math.cos(t), Math.sqrt(1.16) * Math.sin(t)]), { c: 'ink', w: 1, dash: '2 4', op: 0.6 });
      f.circle(c[0], c[1], r, { c: 'c4', fill: true, fo: 0.12, w: 2.8 });
      for (let k = 0; k < 6; k++) { const t = TAU * (k + 0.5) / 6, p = [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)], d = [-Math.sin(t) * o, Math.cos(t) * o]; f.arrow([p[0] - d[0] * 0.1, p[1] - d[1] * 0.1], [p[0] + d[0] * 0.12, p[1] + d[1] * 0.12], { c: 'c4', w: 2.6 }); }
      f.handle(c[0], c[1], { c: 'c4', label: T('Centre of the disk', '円板の中心'), bounds: [-1.4, 1.4, -1.4, 1.4], onDrag: (x, y) => { st.c = [x, y]; ctx.redraw(); } });
      const pe = [c[0] + r, c[1]];
      f.handle(pe[0], pe[1], { c: 'hl', label: T('Edge of the disk (sets the radius)', '円板の縁（半径を決める）'), onDrag: (x, y) => ctx.set('radius', Math.hypot(x - c[0], y - c[1])) });
      // right: both sides as functions of the radius
      L.h('p', 'lab-cap', c2, T('Both sides of Stokes’ theorem for disks of every radius about this centre.', 'この中心をもつあらゆる半径の円板についての、ストークスの定理の両辺。'));
      const rs = L.seq(31, (i) => 0.05 * i), lin = rs.map((x) => [x, o * circ(c, x)]), are = rs.map((x) => [x, o * flux(c, x)]);
      const all = lin.map((p) => p[1]), lo = Math.min(0, ...all), hi = Math.max(0, ...all), pad = Math.max(0.2, (hi - lo) * 0.1);
      const g = fig(c2, { x: [0, 1.5], y: [lo - pad, hi + pad], aspect: 0.85, maxH: 400, xlabel: T('radius', '半径'), ylabel: T('integral', '積分') });
      g.line(lin, { c: 'c4', w: 2.6 });
      are.forEach(([x, y], i) => { if (i % 2 === 0) g.dot(x, y, { c: 'c3', r: 4.5 }); });
      const L1 = o * circ(c, r), A1 = o * flux(c, r);
      g.vline(r, { c: 'hl', w: 1.2 });
      g.dot(r, L1, { c: 'hl', r: 7 });
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: 'dω > 0' }, { kind: 'fill', c: 'neg', label: 'dω < 0' }, { c: 'ink', dash: true, label: 'dω = 0' }, { c: 'c4', label: T('∮ over the boundary ∂S', '境界 ∂S 上の ∮') }, { kind: 'dot', c: 'c3', label: T('∬ of dω over S', 'S 上の dω の ∬') }]);
      ctx.readout([
        { k: T('∮ ω over ∂S', '∂S 上の ∮ ω'), v: fmt(L1, 5), tone: 'key' },
        { k: T('∬ dω over S', 'S 上の ∬ dω'), v: fmt(A1, 5), tone: 'key' },
        { k: T('difference', '差'), v: fmt(L1 - A1, 2), tone: 'good' },
        { k: T('orientation', '向き'), v: o > 0 ? T('anticlockwise', '反時計回り') : T('clockwise', '時計回り') },
      ], T('ω = (−y/2 + y³/3) dx + (x/2 − x³/3 + 0.4x²) dy. Once the disk reaches the region where dω < 0, growing it can make both integrals shrink together.', 'ω = (−y/2 + y³/3) dx + (x/2 − x³/3 + 0.4x²) dy です。円板が dω < 0 の領域に入ると、円板を大きくしても両方の積分がそろって減ることがあります。'));
    },
  };

  // ---------- 3. pullback of the area form ----------
  D.pullback = {
    render(ctx, v) {
      const st = ctx.state, s = v.scale, k = v.shear, cb = v.bend ?? 0.4, R = 1.2, hc = 0.3;
      st.p ||= [0.4, 0.3];
      const phi = (u, w) => [s * u + k * w, w + cb * u * u];
      const det = (u) => s - 2 * cb * k * u;
      const [u0, w0] = st.p;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The (u, v) square, coloured by det Dφ. Drag the small cell.', '(u, v) 正方形を det Dφ で色分けしたもの。小さなセルをドラッグできます。'));
      const f = fig(c1, { x: [-R - 0.1, R + 0.1], y: [-R - 0.1, R + 0.1], equal: true, maxH: 360, xlabel: 'u', ylabel: 'v', grid: false });
      const dmax = Math.max(Math.abs(det(-R)), Math.abs(det(R)), 0.2);
      f.raster((u, w) => (Math.abs(u) <= R && Math.abs(w) <= R ? det(u) / dmax * 0.8 : 0), { cmap: 'div', res: 4 });
      const lines = L.seq(9, (i) => -R + 2 * R * i / 8);
      lines.forEach((a) => { f.line([[a, -R], [a, R]], { c: 'ink', w: 0.8, op: 0.35 }); f.line([[-R, a], [R, a]], { c: 'ink', w: 0.8, op: 0.35 }); });
      const cell = [[u0 - hc / 2, w0 - hc / 2], [u0 + hc / 2, w0 - hc / 2], [u0 + hc / 2, w0 + hc / 2], [u0 - hc / 2, w0 + hc / 2]];
      f.poly(cell, { c: 'hl', fo: 0.4, w: 2 });
      f.arrow(cell[0], cell[1], { c: 'c1', w: 2.6 }); f.arrow(cell[0], cell[3], { c: 'c3', w: 2.6 });
      f.handle(u0, w0, { c: 'hl', label: T('Cell', 'セル'), bounds: [-R + hc / 2, R - hc / 2, -R + hc / 2, R - hc / 2], onDrag: (x, y) => { st.p = [x, y]; ctx.redraw(); } });
      // image
      const border = [];
      const edge = (a, b, n = 40) => L.seq(n + 1, (i) => phi(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n));
      [[[-R, -R], [R, -R]], [[R, -R], [R, R]], [[R, R], [-R, R]], [[-R, R], [-R, -R]]].forEach(([a, b]) => border.push(...edge(a, b)));
      const xs = border.map((p) => p[0]), ys = border.map((p) => p[1]);
      const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys)], m = 0.12 * Math.max(bx[1] - bx[0], by[1] - by[0]);
      L.h('p', 'lab-cap', c2, T('Its image under φ. The dashed parallelogram is Dφ applied to the cell.', 'φ による像。破線の平行四辺形はセルに Dφ を施したものです。'));
      const g = fig(c2, { x: [bx[0] - m, bx[1] + m], y: [by[0] - m, by[1] + m], equal: true, maxH: 360, xlabel: 'x', ylabel: 'y', grid: false });
      g.poly(border, { c: 'muted', fo: 0.05, w: 1.2 });
      lines.forEach((a) => { g.line(edge([a, -R], [a, R]), { c: 'c3', w: 0.9, op: 0.5 }); g.line(edge([-R, a], [R, a]), { c: 'c1', w: 0.9, op: 0.5 }); });
      const img = [].concat(edge(cell[0], cell[1], 12), edge(cell[1], cell[2], 12), edge(cell[2], cell[3], 12), edge(cell[3], cell[0], 12));
      const dt0 = det(u0);
      g.poly(img, { c: 'hl', fo: 0.45, w: 2 });
      const J = [[s, k], [2 * cb * u0, 1]], b0 = phi(...cell[0]);
      const Jv = (d) => [J[0][0] * d[0] + J[0][1] * d[1], J[1][0] * d[0] + J[1][1] * d[1]];
      const e1 = Jv([hc, 0]), e2 = Jv([0, hc]);
      g.poly([b0, [b0[0] + e1[0], b0[1] + e1[1]], [b0[0] + e1[0] + e2[0], b0[1] + e1[1] + e2[1]], [b0[0] + e2[0], b0[1] + e2[1]]], { c: 'ink', fo: 0, w: 1.4, dash: '4 3' });
      g.arrow(b0, [b0[0] + e1[0], b0[1] + e1[1]], { c: 'c1', w: 2.6 }); g.arrow(b0, [b0[0] + e2[0], b0[1] + e2[1]], { c: 'c3', w: 2.6 });
      if (Math.abs(s) > 1e-9 && Math.abs(cb * k) > 1e-9) { const uf = s / (2 * cb * k); if (Math.abs(uf) < R) { f.line([[uf, -R], [uf, R]], { c: 'ink', w: 2, dash: '6 4' }); g.line(edge([uf, -R], [uf, R]), { c: 'ink', w: 2, dash: '6 4' }); } }
      const shoe = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
      const ratio = shoe(img) / (hc * hc);
      const total = simpson((u) => 2 * R * det(u), -R, R, 40);
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: T('det Dφ > 0: orientation kept', 'det Dφ > 0：向きを保つ') }, { kind: 'fill', c: 'neg', label: T('det Dφ < 0: orientation reversed', 'det Dφ < 0：向きが反転') }, { c: 'c1', label: T('u direction and its image', 'u 方向とその像') }, { c: 'c3', label: T('v direction and its image', 'v 方向とその像') }, { c: 'ink', dash: true, label: T('fold line det Dφ = 0', '折り目 det Dφ = 0') }]);
      ctx.readout([
        { k: 'det Dφ = s − 2ck·u', v: fmt(dt0, 4), tone: 'key' },
        { k: T('signed area ratio of the cell', 'セルの符号付き面積比'), v: fmt(ratio, 4) },
        { k: '∬ φ*(dx∧dy)', v: fmt(total, 4) },
        { k: T('orientation', '向き'), v: dt0 > 0 ? T('kept', '保存') : dt0 < 0 ? T('reversed', '反転') : T('degenerate', '退化') , tone: dt0 < 0 ? 'warn' : 'good' },
      ], T(`φ(u, v) = (su + kv, v + cu²) with s = ${fmt(s, 2)}, k = ${fmt(k, 2)}, c = ${fmt(cb, 2)}. The small cell's image has signed area close to det Dφ times its area; with f = 1, φ*(dx∧dy) = det Dφ du∧dv, and its integral is the signed area of the image, counted with multiplicity.`, `φ(u, v) = (su + kv, v + cu²)、s = ${fmt(s, 2)}、k = ${fmt(k, 2)}、c = ${fmt(cb, 2)} です。小さなセルの像の符号付き面積はセルの面積の det Dφ 倍に近くなります。f = 1 のとき φ*(dx∧dy) = det Dφ du∧dv で、その積分は重複度を込めた像の符号付き面積です。`));
    },
  };
})();
