'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = L.TAU;
  const pn = (x, p) => (Math.abs(x[0]) ** p + Math.abs(x[1]) ** p) ** (1 / p);
  const inf = (x) => Math.max(Math.abs(x[0]), Math.abs(x[1]));
  const ball = (nf, n = 360) => L.seq(n + 1, (i) => { const t = TAU * i / n, u = [Math.cos(t), Math.sin(t)], m = nf(u); return [u[0] / m, u[1] / m]; });

  /* ---------- 1. unit balls ---------- */
  D.norms = {
    render(ctx, v) {
      const p = v.order, st = ctx.state; st.x ||= [1.1, 0.6];
      const x = st.x;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Unit balls {‖x‖ₚ ≤ 1}. Drag the gold vector x.', '単位球 {‖x‖ₚ ≤ 1}。金色のベクトル x をドラッグできます。'));
      L.h('p', 'lab-cap', c2, T('‖x‖ₚ as a function of p for the same x: it decreases towards ‖x‖∞.', '同じ x に対する p の関数としての ‖x‖ₚ：‖x‖∞ に向かって減少します。'));
      const f = L.fig(c1, { x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, maxH: 380, xlabel: 'x₁', ylabel: 'x₂' });
      f.line(ball((u) => pn(u, 1)), { c: 'c1', w: 1.3, dash: '5 4', op: 0.8 });
      f.line(ball((u) => pn(u, 2)), { c: 'c3', w: 1.3, dash: '5 4', op: 0.8 });
      f.line(ball(inf), { c: 'c4', w: 1.3, dash: '5 4', op: 0.8 });
      f.poly(ball((u) => pn(u, p)), { c: 'c2', fo: 0.18, w: 2.6 });
      const np = pn(x, p), s = [x[0] / np, x[1] / np];
      f.arrow([0, 0], x, { c: 'hl', w: 2.6 });
      f.seg([0, 0], s, { c: 'c2', w: 1.4, dash: '2 3', layer: 'over' });
      f.dot(s[0], s[1], { c: 'c2', r: 5.5 });
      f.text(s[0], s[1], 'x/‖x‖ₚ', { dx: s[0] < 0 ? 10 : -10, dy: 18, anchor: s[0] < 0 ? 'start' : 'end', small: true, c: 'c2' });
      f.handle(x[0], x[1], { c: 'hl', snap: 0.05, bounds: [-1.6, 1.6, -1.6, 1.6], label: T('Vector x', 'ベクトル x'), onDrag: (a, b) => { st.x = [a, b]; ctx.redraw(); } });
      const n05 = pn(x, 0.5), ymax = Math.max(0.5, n05 * 1.08);
      const g = L.fig(c2, { x: [0.5, 8], y: [0, ymax], aspect: 0.8, maxH: 380, xlabel: 'p', ylabel: '‖x‖ₚ', ticksX: [0.5, 1, 2, 4, 6, 8].map((k) => [k, String(k)]) });
      g.rect(0.5, 0, 0.5, ymax, { c: 'muted', fo: 0.1, nostroke: true, layer: 'under' });
      g.text(0.75, ymax, T('not a norm', 'ノルムでない'), { dy: 14, small: true, c: 'muted' });
      g.hline(inf(x), { c: 'c4', w: 1.4, dash: '5 4' });
      g.text(8, inf(x), '‖x‖∞', { anchor: 'end', dy: -6, small: true, c: 'c4' });
      g.line(L.sample(0.5, 8, 300, (q) => pn(x, q)), { c: 'c2', w: 2.4 });
      g.dot(1, pn(x, 1), { c: 'c1', r: 4.5 }); g.dot(2, pn(x, 2), { c: 'c3', r: 4.5 });
      g.vline(p, { c: 'hl', w: 1.2, dash: '2 3' });
      g.dot(p, np, { c: 'hl', r: 6 });
      g.handle(p, ymax * 0.06, { c: 'hl', axis: 'x', bounds: [0.5, 8, 0, ymax], label: T('Exponent p', '指数 p'), onDrag: (q) => ctx.set('order', q) });
      L.legend(ctx.host, [{ c: 'c2', label: T(`unit ball for p = ${fmt(p, 1)}`, `p = ${fmt(p, 1)} の単位球`) }, { c: 'c1', dash: true, label: 'p = 1' }, { c: 'c3', dash: true, label: 'p = 2' }, { c: 'c4', dash: true, label: 'p = ∞' }]);
      ctx.readout([
        { k: '‖x‖₁', v: fmt(pn(x, 1), 3) }, { k: '‖x‖₂', v: fmt(pn(x, 2), 3) }, { k: '‖x‖∞', v: fmt(inf(x), 3) },
        { k: `‖x‖ₚ, p = ${fmt(p, 1)}`, v: fmt(np, 3), tone: p < 1 ? 'warn' : 'key' },
      ], p < 1 ? T('For p < 1 the ball is not convex and the triangle inequality fails, so ‖·‖ₚ is not a norm.', 'p < 1 では球が凸でなく三角不等式が成り立たないため、‖·‖ₚ はノルムではありません。') : T('Every ball contains the p = 1 diamond and sits inside the p = ∞ square; larger p means a larger ball and a smaller ‖x‖ₚ.', 'どの球も p = 1 のひし形を含み、p = ∞ の正方形の内側にあります。p が大きいほど球は大きく、‖x‖ₚ は小さくなります。'));
    },
  };

  /* ---------- 2. projection in a weighted inner product ---------- */
  D['projection-hilbert'] = {
    render(ctx, v) {
      const w = v.w ?? 1, th = v.angle * PI / 180, u = [Math.cos(th), Math.sin(th)], vec = [v.x, v.y];
      const ip = (a, b) => a[0] * b[0] + w * a[1] * b[1];
      const c = ip(vec, u) / ip(u, u), p = [c * u[0], c * u[1]], r = [vec[0] - p[0], vec[1] - p[1]];
      const d = Math.sqrt(ip(r, r));
      const e = vec[0] * u[0] + vec[1] * u[1], pe = [e * u[0], e * u[1]];
      const f = L.fig(ctx.host, { x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, maxH: 440 });
      f.line([[-4 * u[0], -4 * u[1]], [4 * u[0], 4 * u[1]]], { c: 'c1', w: 2.2 });
      // unit ball of the inner product, and the smallest ball around v that touches the line
      f.line(L.seq(121, (i) => { const t = TAU * i / 120; return [Math.cos(t), Math.sin(t) / Math.sqrt(w)]; }), { c: 'muted', w: 1.2, dash: '4 4' });
      f.poly(L.seq(121, (i) => { const t = TAU * i / 120; return [vec[0] + d * Math.cos(t), vec[1] + d * Math.sin(t) / Math.sqrt(w)]; }), { c: 'c3', fo: 0.1, w: 1.8 });
      f.arrow([0, 0], vec, { c: 'hl', w: 2.8 });
      f.arrow([0, 0], p, { c: 'c1', w: 3.4 });
      f.seg(p, vec, { c: 'c2', w: 2.2, dash: '5 4' });
      if (Math.abs(w - 1) > 1e-6) { f.dot(pe[0], pe[1], { c: 'ink', r: 4, hollow: true }); f.seg(pe, vec, { c: 'ink', w: 1, dash: '2 3', op: 0.6 }); }
      f.dot(p[0], p[1], { c: 'c1', r: 5 });
      f.text(p[0], p[1], 'proj', { dx: 10, dy: 16, anchor: 'start', small: true, c: 'c1' });
      f.text(vec[0], vec[1], 'v', { math: true, dx: 12, dy: -8 });
      const tip = [1.9 * u[0], 1.9 * u[1]];
      f.handle(vec[0], vec[1], { c: 'hl', snap: 0.1, bounds: [-2, 2, -2, 2], label: T('Vector v', 'ベクトル v'), onDrag: (a, b) => { ctx.set('x', a, true); ctx.set('y', b); } });
      f.handle(tip[0], tip[1], { c: 'c1', label: T('Direction of the subspace', '部分空間の向き'), onDrag: (a, b) => { let dg = Math.atan2(b, a) * 180 / PI; if (dg < 0) dg += 180; if (dg > 180) dg -= 180; ctx.set('angle', dg); } });
      const leg = [{ c: 'c1', label: T('subspace span{u} and proj_u v', '部分空間 span{u} と proj_u v') }, { c: 'c2', dash: true, label: T('residual v − proj', '残差 v − proj') }, { c: 'c3', label: T('smallest ball ‖z − v‖ ≤ d touching the line', '直線に接する最小の球 ‖z − v‖ ≤ d') }, { c: 'muted', dash: true, label: T('unit ball of ⟨·,·⟩', '⟨·,·⟩ の単位球') }];
      if (Math.abs(w - 1) > 1e-6) leg.push({ kind: 'dot', c: 'ink', label: T('Euclidean foot, for comparison', '比較用のユークリッドの垂線の足') });
      L.legend(ctx.host, leg);
      const ang = Math.acos(L.clamp(Math.abs(r[0] * u[0] + r[1] * u[1]) / (Math.hypot(...r) || 1), 0, 1)) * 180 / PI;
      ctx.readout([
        { k: '⟨v − proj, u⟩', v: fmt(ip(r, u), 3), tone: 'good' },
        { k: T('distance ‖v − proj‖', '距離 ‖v − proj‖'), v: fmt(d, 3), tone: 'key' },
        { k: T('residual-to-line angle on screen', '図の上での残差と直線の角度'), v: Math.hypot(...r) < 1e-9 ? '·' : `${fmt(ang, 1)}°` },
      ], Math.abs(w - 1) < 1e-6 ? T('With w = 1 this is the ordinary dot product and the residual looks perpendicular. Raise w to change the inner product.', 'w = 1 では通常の内積で、残差は見た目にも垂直です。w を上げて内積を変えてみてください。') : T('The residual is orthogonal in ⟨·,·⟩ but not on screen: the projection is where the smallest ball of this inner product around v touches the line.', '残差は ⟨·,·⟩ では直交しますが、図の上では直角ではありません。射影は、v を中心とするこの内積の最小の球が直線に接する点です。'));
    },
  };

  /* ---------- 3. spectrum of a 2 x 2 operator ---------- */
  const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'];
  const E1 = [1, 0], E2 = [Math.cos(PI / 3), Math.sin(PI / 3)];
  D['operator-spectrum'] = {
    render(ctx, v) {
      const l1 = v.lambda1, l2 = v.lambda2, n = Math.round(v.steps), st = ctx.state; st.x ||= [1.1, 1.4];
      // A = P diag(l1, l2) P^-1 with columns of P = E1, E2
      const det = E1[0] * E2[1] - E2[0] * E1[1];
      const Pinv = [E2[1] / det, -E2[0] / det, -E1[1] / det, E1[0] / det];
      const coords = (x) => [Pinv[0] * x[0] + Pinv[1] * x[1], Pinv[2] * x[0] + Pinv[3] * x[1]];
      const Ak = (x, k) => { const [a, b] = coords(x), s = l1 ** k * a, t = l2 ** k * b; return [s * E1[0] + t * E2[0], s * E1[1] + t * E2[1]]; };
      const A = [Ak([1, 0], 1), Ak([0, 1], 1)]; // columns
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Iterates x, Ax, …, A${SUP[n]}x. Drag x. The eigenvectors are 60° apart.`, `反復 x, Ax, …, A${SUP[n]}x。x をドラッグできます。固有ベクトルは60°離れています。`));
      L.h('p', 'lab-cap', c2, T('Smallest singular value of A − λI. It is 0 exactly on the spectrum.', 'A − λI の最小特異値。スペクトル上でちょうど0になります。'));
      const R = 2.4, f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, maxH: 380 });
      f.line([[-5 * E1[0], -5 * E1[1]], [5 * E1[0], 5 * E1[1]]], { c: 'c1', w: 1.6, op: 0.7 });
      f.line([[-5 * E2[0], -5 * E2[1]], [5 * E2[0], 5 * E2[1]]], { c: 'c3', w: 1.6, op: 0.7 });
      f.text(R - 0.1, 0, `λ₁ = ${fmt(l1, 1)}`, { anchor: 'end', dy: -8, small: true, c: 'c1' });
      f.text(1.3, 2.25, `λ₂ = ${fmt(l2, 1)}`, { anchor: 'end', dx: -8, small: true, c: 'c3' });
      f.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 4' });
      f.poly(L.seq(121, (i) => Ak([Math.cos(TAU * i / 120), Math.sin(TAU * i / 120)], n)), { c: 'c4', fo: 0.08, w: 1.2, op: 0.8 });
      const pts = L.seq(n + 1, (k) => Ak(st.x, k));
      f.line(pts, { c: 'hl', w: 1.4, dash: '4 3', op: 0.8 });
      pts.forEach((q, k) => { if (Math.abs(q[0]) < R && Math.abs(q[1]) < R) { f.dot(q[0], q[1], { c: 'hl', r: k === n ? 6 : 4 }); if (k <= 1 || k === n) f.text(q[0], q[1], k === 0 ? 'x' : `A${['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸'][k]}x`, { dx: 8, dy: -6, anchor: 'start', small: true }); } });
      const last = pts[n], m = Math.hypot(...last);
      if (m > 1e-12) f.arrow([0, 0], [last[0] / m, last[1] / m], { c: 'c2', w: 2.6 });
      f.handle(st.x[0], st.x[1], { c: 'hl', snap: 0.05, bounds: [-2, 2, -2, 2], label: T('Starting vector x', '初期ベクトル x'), onDrag: (a, b) => { st.x = [a, b]; ctx.redraw(); } });
      const g = L.fig(c2, { x: [-2.6, 2.6], y: [0, 3.2], aspect: 0.8, maxH: 380, xlabel: 'λ', ylabel: 'σmin(A − λI)' });
      const smin = (lam) => { const a = A[0][0] - lam, c = A[0][1], b = A[1][0], d = A[1][1] - lam; const F = a * a + b * b + c * c + d * d, dt = a * d - b * c; return Math.sqrt(Math.max(0, (F - Math.sqrt(Math.max(0, F * F - 4 * dt * dt))) / 2)); };
      g.line(L.sample(-2.6, 2.6, 500, smin), { c: 'c2', w: 2.4 });
      g.vline(0, { c: 'ink', w: 1, dash: '3 3', op: 0.6 });
      [[l1, 'c1', 'λ₁'], [l2, 'c3', 'λ₂']].forEach(([lam, c, name], i) => { g.dot(lam, 0, { c, r: 6.5 }); g.text(lam, 0, name, { dy: -12, dx: i && Math.abs(l1 - l2) < 0.3 ? 14 : 0, c, small: true }); });
      g.hover((lam) => ({ x: lam, y: smin(lam), text: `σmin(A − ${fmt(lam, 2)}I) = ${fmt(smin(lam), 3)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('eigenline of λ₁', 'λ₁ の固有直線') }, { c: 'c3', label: T('eigenline of λ₂', 'λ₂ の固有直線') }, { kind: 'dot', c: 'hl', label: T('iterates Aᵏx', '反復 Aᵏx') }, { kind: 'fill', c: 'c4', label: T('image of the unit circle under Aⁿ', '単位円の Aⁿ による像') }, { c: 'c2', label: T('direction of Aⁿx; σmin(A − λI)', 'Aⁿx の向き・σmin(A − λI)') }]);
      const prev = Math.hypot(...pts[Math.max(0, n - 1)]);
      const dom = Math.max(Math.abs(l1), Math.abs(l2));
      ctx.readout([
        { k: '‖Aⁿx‖', v: fmt(m, 3) },
        { k: '‖Aⁿx‖ / ‖Aⁿ⁻¹x‖', v: n > 0 && prev > 1e-12 ? fmt(m / prev, 3) : '·' },
        { k: T('spectral radius', 'スペクトル半径'), v: fmt(dom, 2), tone: 'key' },
        { k: 'det A = λ₁λ₂', v: fmt(l1 * l2, 3), tone: Math.abs(l1 * l2) < 1e-9 ? 'warn' : undefined },
      ], Math.abs(l1 * l2) < 1e-9 ? T('An eigenvalue is 0: A − 0·I = A is not invertible, so 0 is in the spectrum and A flattens the plane onto a line.', '固有値が0です。A − 0·I = A は可逆でないため0はスペクトルに含まれ、A は平面を直線に潰します。') : T('The growth ratio tends to the spectral radius and the direction of Aⁿx turns towards the dominant eigenline, when one eigenvalue is strictly larger in size.', '一方の固有値の絶対値が真に大きいとき、増加率はスペクトル半径に近づき、Aⁿx の向きは支配的な固有直線へ向かいます。'));
    },
  };
})();
