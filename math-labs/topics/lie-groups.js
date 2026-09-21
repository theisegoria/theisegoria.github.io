'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = PI / 180;

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const n = norm(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const I3 = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const hat = (n) => [[0, -n[2], n[1]], [n[2], 0, -n[0]], [-n[1], n[0], 0]];
  // Rodrigues: exact exponential of theta*hat(n) for a unit axis n
  const rot = (n, th) => { const K = hat(n), K2 = mm(K, K), s = Math.sin(th), c = 1 - Math.cos(th); return [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 1 : 0) + s * K[i][j] + c * K2[i][j])); };
  // Partial sum of the exponential series with N terms (n = 0 .. N-1)
  const expSeries = (n, th, N) => { const A = hat(n).map((r) => r.map((x) => x * th)); let term = I3(), S = I3(); for (let k = 1; k < N; k++) { term = mm(term, A).map((r) => r.map((x) => x / k)); S = S.map((r, i) => r.map((x, j) => x + term[i][j])); } return N >= 1 ? S : I3(); };
  const orthErr = (M) => { const P = mm(M.map((r, i) => M.map((q) => q[i])), M); let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += (P[i][j] - (i === j ? 1 : 0)) ** 2; return Math.sqrt(s); };
  const angleOf = (M) => Math.acos(L.clamp((M[0][0] + M[1][1] + M[2][2] - 1) / 2, -1, 1));
  const axisOf = (M) => unit([M[2][1] - M[1][2], M[0][2] - M[2][0], M[1][0] - M[0][1]]);
  // Group commutator for the sequence x, y, -x, -y applied to a vector (operator product read right to left)
  const commutator = (e) => mm(rot([0, 1, 0], -e), mm(rot([1, 0, 0], -e), mm(rot([0, 1, 0], e), rot([1, 0, 0], e))));
  // quaternion of a rotation by th about unit n
  const quat = (n, th) => [Math.cos(th / 2), Math.sin(th / 2) * n[0], Math.sin(th / 2) * n[1], Math.sin(th / 2) * n[2]];
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qrot = (q, v) => { const p = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; };
  // The ribbon: a path in SU(2) from 1 at the wall (s = 0) to the object (s = 1).
  // untwist in (0, 1]: first 0..0.6 swings the second turn's axis from x to -x, then 0.6..1 shrinks the back-and-forth.
  function ribbonQ(s, angleDeg, untwist) {
    const X = [1, 0, 0];
    if (Math.abs(angleDeg - 720) > 1e-9 || untwist <= 0) return quat(X, angleDeg * DEG * s);
    const alpha = PI * Math.min(1, untwist / 0.6), beta = 1 - Math.max(0, (untwist - 0.6) / 0.4);
    const A2 = [Math.cos(alpha), Math.sin(alpha), 0];
    if (s <= 0.5) return quat(X, 2 * PI * beta * 2 * s);
    return qmul(quat(A2, 2 * PI * beta * (2 * s - 1)), quat(X, 2 * PI * beta));
  }
  (window.LabModels = window.LabModels || {})['lie-groups'] = { rot, expSeries, orthErr, angleOf, axisOf, commutator, quat, qrot, ribbonQ, cross, dot };

  /* ---------- a small orbiting 3D camera over an SVG figure ---------- */
  function camera(st, a0 = 0.7, e0 = 0.35) {
    st.view ||= { a: a0, e: e0 };
    const { a, e } = st.view;
    const R = [-Math.sin(a), Math.cos(a), 0], U = [-Math.cos(a) * Math.sin(e), -Math.sin(a) * Math.sin(e), Math.cos(e)], N = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
    return { P: (p) => [dot(p, R), dot(p, U)], depth: (p) => dot(p, N), N };
  }
  function orbit(f, ctx) {
    f.svg.style.cursor = 'grab'; f.svg.style.touchAction = 'none';
    f.svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.lab-handle')) return;
      ev.preventDefault();
      const x0 = ev.clientX, y0 = ev.clientY, v0 = { ...ctx.state.view };
      const move = (m) => { ctx.state.view = { a: v0.a - (m.clientX - x0) * 0.01, e: L.clamp(v0.e + (m.clientY - y0) * 0.01, -1.4, 1.4) }; ctx.redraw(); };
      const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    });
  }
  // draw a 3D polyline, solid in front of the sphere centre plane and faint behind it
  function curve3(f, cam, pts, o, oBack) {
    let run = [], front = null;
    const flush = () => { if (run.length > 1) f.line(run, front ? o : (oBack || o)); };
    pts.forEach((p) => { const fr = cam.depth(p) >= 0; if (front !== null && fr !== front) { const last = run[run.length - 1]; flush(); run = [last]; } front = fr; run.push(cam.P(p)); });
    flush();
  }
  function sphere(f, cam, r = 1) {
    const back = { c: 'muted', w: 0.7, dash: '2 4', op: 0.45, layer: 'under' };
    for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = r * Math.sin(la), rr = r * Math.cos(la); curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [rr * Math.cos(q), rr * Math.sin(q), z]; }), { c: 'muted', w: k === 0 ? 1.1 : 0.8, op: 0.55, layer: 'under' }, back); }
    for (let k = 0; k < 6; k++) { const lo = k * PI / 6; curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [r * Math.cos(q) * Math.cos(lo), r * Math.cos(q) * Math.sin(lo), r * Math.sin(q)]; }), { c: 'muted', w: 0.8, op: 0.5, layer: 'under' }, back); }
    f.circle(0, 0, r, { c: 'ink', w: 1.2, op: 0.5 });
  }
  function axes3(f, cam, len = 1.25) {
    [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']].forEach(([p, s]) => {
      const tip = p.map((v) => v * len), q = cam.P(tip);
      f.line([cam.P([0, 0, 0]), q], { c: 'muted', w: 1, op: cam.depth(tip) >= 0 ? 0.8 : 0.4, dash: '3 3', layer: 'under' });
      const lab = cam.P(p.map((v) => v * (len + 0.1)));
      f.text(lab[0], lab[1], s, { math: true, small: true, c: 'muted', dy: 4 });
    });
  }

  /* ---------- 1. exponential map ---------- */
  D['exp-map'] = {
    render(ctx, v) {
      const th = v.theta * DEG, N = v.terms, tilt = v.tilt * DEG;
      const n = [Math.sin(tilt) * Math.cos(PI / 6), Math.sin(tilt) * Math.sin(PI / 6), Math.cos(tilt)];
      const u = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
      const p0 = [0.866 * u[0] + 0.5 * n[0], 0.866 * u[1] + 0.5 * n[1], 0.866 * u[2] + 0.5 * n[2]];
      const cam = camera(ctx.state);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('True rotation (gold) against the truncated series (orange). Drag to turn the view.', '本当の回転（金）と打ち切った級数（橙）。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.6, 1.6], y: [-1.5, 1.5], equal: true, axes: false, maxH: 430 });
      orbit(f, ctx);
      sphere(f, cam, 1);
      axes3(f, cam);
      // rotation axis
      const nb = n.map((x) => -1.35 * x), nt = n.map((x) => 1.35 * x);
      f.line([cam.P(nb), cam.P(nt)], { c: 'c1', w: 2.4, arrow: true });
      const nl = cam.P(n.map((x) => 1.5 * x)); f.text(nl[0], nl[1], 'n', { math: true, c: 'c1', dy: 4 });
      // the circle of rotation, and the swept sector
      const centre = n.map((x) => x * dot(p0, n));
      const circ = L.seq(121, (i) => mv(rot(n, L.TAU * i / 120), p0));
      curve3(f, cam, circ, { c: 'hl', w: 1.2, op: 0.55, dash: '4 4' }, { c: 'hl', w: 1, op: 0.3, dash: '2 4' });
      const sector = [cam.P(centre), ...L.seq(61, (i) => cam.P(mv(rot(n, th * i / 60), p0)))];
      f.poly(sector, { c: 'hl', fo: 0.14, w: 0, op: 1, layer: 'under' });
      // true path and truncated path
      const truePath = L.seq(91, (i) => mv(rot(n, th * i / 90), p0));
      curve3(f, cam, truePath, { c: 'hl', w: 3.2 }, { c: 'hl', w: 2.2, op: 0.55 });
      const seriesPath = L.seq(91, (i) => mv(expSeries(n, th * i / 90, N), p0));
      const CAP = 1.5, inView = seriesPath.map((p) => { const s = norm(p); return s > CAP ? p.map((x) => x * CAP / s) : p; });
      const offFrame = norm(seriesPath[90]) > CAP;
      curve3(f, cam, inView, { c: 'c2', w: 2.6 }, { c: 'c2', w: 1.8, op: 0.55 });
      const pT = truePath[90], pS = seriesPath[90];
      f.line([cam.P(pT), cam.P(inView[90])], { c: 'ink', w: 1.2, dash: '2 3' });
      f.dot(...cam.P(p0), { c: 'ink', r: 4 });
      f.dot(...cam.P(pT), { c: 'hl', r: 6.5 });
      f.dot(...cam.P(inView[90]), { c: 'c2', r: 5.5, hollow: offFrame });
      if (offFrame) { const q = cam.P(inView[90]); f.text(q[0], q[1], T('off the frame', '枠の外'), { small: true, c: 'c2', dy: -10 }); }
      const s0 = cam.P(p0); f.text(s0[0], s0[1], 'v', { math: true, dx: -10, dy: -6 });
      // right: error against number of terms, log scale
      L.h('p', 'lab-cap', c2, T('Distance from the true point after N terms (log scale)', 'N 項で打ち切ったときの本当の点からの距離（対数目盛）'));
      const errs = L.seq(16, (k) => norm(mv(expSeries(n, th, k + 1), p0).map((x, i) => x - pT[i])));
      const g = L.fig(c2, { x: [0.3, 16.7], y: [-16, 2], aspect: 0.72, maxH: 340, xlabel: T('terms N', '項数 N'), ticksY: [[-15, '10⁻¹⁵'], [-10, '10⁻¹⁰'], [-5, '10⁻⁵'], [0, '1']], ticksX: [1, 4, 8, 12, 16].map((k) => [k, String(k)]) });
      g.line(errs.map((e, k) => [k + 1, Math.max(-16, Math.log10(Math.max(e, 1e-17)))]), { c: 'c1', w: 1.6, op: 0.6 });
      errs.forEach((e, k) => { const y = Math.max(-16, Math.log10(Math.max(e, 1e-17))); g.seg([k + 1, -16], [k + 1, y], { c: k + 1 === N ? 'c2' : 'c1', w: k + 1 === N ? 3 : 1.2, op: k + 1 === N ? 0.9 : 0.3, layer: 'under' }); g.dot(k + 1, y, { c: k + 1 === N ? 'c2' : 'c1', r: k + 1 === N ? 7 : 4 }); });
      g.hline(Math.log10(2.2e-16), { c: 'muted', dash: '2 3' });
      g.hover((x) => { const k = Math.round(x); if (k < 1 || k > 16) return null; return { x: k, text: `N = ${k}: ${fmt(errs[k - 1], 3)}` }; });
      const S = expSeries(n, th, N);
      L.legend(ctx.host, [{ c: 'hl', label: T('exp(θK) v, the true rotation', 'exp(θK) v（本当の回転）') }, { c: 'c2', label: T(`series with ${N} term${N === 1 ? '' : 's'}`, `${N} 項の級数`) }, { c: 'c1', label: T('rotation axis n', '回転軸 n') }, { c: 'muted', dash: true, label: T('machine precision', '機械精度') }]);
      ctx.readout([{ k: T('gap at θ', 'θ でのずれ'), v: fmt(errs[N - 1], 3), tone: 'key' }, { k: '‖SᵀS − I‖', v: fmt(orthErr(S), 3), tone: orthErr(S) > 1e-6 ? 'warn' : 'good' }, { k: 'tr R = 1 + 2cos θ', v: fmt(1 + 2 * Math.cos(th), 3) }, { k: T('|v| after series', '級数後の |v|'), v: fmt(norm(pS), 3) }],
        N >= 12 && errs[N - 1] < 1e-6 ? T('With enough terms the partial sum is a rotation to within rounding: the series has converged onto the group.', '十分な項数では部分和は丸め誤差の範囲で回転になります。級数が群の上に収束しました。') : T('Few terms give a matrix that is not a rotation: the point leaves the sphere. Larger angles need more terms, roughly N ≈ θ + a few.', '項が少ないと回転でない行列になり、点は球面を離れます。角度が大きいほど多くの項が必要で、目安は N ≈ θ に数項を足した程度です。'));
    },
  };

  /* ---------- 2. the double cover and the belt ---------- */
  D['double-cover'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const cam = camera(ctx.state, 0.95, 0.42);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A ribbon from the wall to a block. Its two faces are coloured differently so every twist shows. Drag to turn the view.', '壁からブロックへ伸びるリボン。表と裏を色分けしているので、ねじれがすべて見えます。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-2.1, 2.1], y: [-1.45, 1.45], equal: true, axes: false, maxH: 400 });
      orbit(f, ctx);
      L.h('p', 'lab-cap', c2, T('Rotation angle in SO(3) (outer) and the ribbon’s path lifted to SU(2), seen edge-on (inner)', 'SO(3) の回転角（外側）と、SU(2) に持ち上げたリボンの経路を横から見たもの（内側）'));
      const g = L.fig(c2, { x: [-1.45, 1.45], y: [-1.35, 1.35], equal: true, axes: false, maxH: 340 });
      const X0 = -1.6, X1 = 1.0, HW = 0.32;
      const draw = (ang, untwist) => {
        f.clear('main'); f.clear('over'); f.clear('under'); g.clear('main'); g.clear('over'); g.clear('under');
        // wall
        const wall = [[X0, -0.9, -0.9], [X0, 0.9, -0.9], [X0, 0.9, 0.9], [X0, -0.9, 0.9]].map(cam.P);
        f.poly(wall, { c: 'muted', fo: 0.18, w: 1, layer: 'under' });
        // ribbon quads, painter-sorted
        const M = 80, quads = [];
        const edge = (s, side) => { const q = ribbonQ(s, ang, untwist); const w = qrot(q, [0, side * HW, 0]); return [X0 + (X1 - X0) * s + w[0], w[1], w[2]]; };
        for (let i = 0; i < M; i++) {
          const s0 = i / M, s1 = (i + 1) / M;
          const a = edge(s0, -1), b = edge(s0, 1), c = edge(s1, 1), d = edge(s1, -1);
          const nrm = qrot(ribbonQ((s0 + s1) / 2, ang, untwist), [0, 0, 1]);
          const facing = dot(nrm, cam.N);
          quads.push({ pts: [a, b, c, d], z: cam.depth([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2]), front: facing >= 0, shade: Math.abs(facing) });
        }
        quads.sort((p, q) => p.z - q.z).forEach((q) => f.poly(q.pts.map(cam.P), { c: q.front ? 'c1' : 'c2', fo: 0.35 + 0.55 * q.shade, w: 0.6, op: 0.95 }));
        // block at the end, oriented by the end of the path
        const qe = ribbonQ(1, ang, untwist);
        const cx = X1 + 0.28, hs = 0.28;
        const corners = [-1, 1].flatMap((i) => [-1, 1].flatMap((j) => [-1, 1].map((k) => [i, j, k])));
        const Pc = (c) => { const w = qrot(qe, [c[0] * hs, c[1] * hs, c[2] * hs]); return [cx + w[0], w[1], w[2]]; };
        const faces = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]].map(([ax, sg]) => {
          const cs = corners.filter((c) => c[ax] === sg);
          const o = [cs[0], cs[1], cs[3], cs[2]].map(Pc);
          const nn = qrot(qe, [ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0]);
          return { o, vis: dot(nn, cam.N), top: ax === 2 && sg === 1 };
        }).filter((q) => q.vis > 0).sort((a, b) => a.vis - b.vis);
        faces.forEach((q) => f.poly(q.o.map(cam.P), { c: q.top ? 'hl' : 'ink', fo: q.top ? 0.75 : 0.12 + 0.3 * q.vis, w: 1.2, layer: 'over' }));
        // right: the two circles
        g.circle(0, 0, 1.05, { c: 'c1', w: 1.2, op: 0.45 });
        g.circle(0, 0, 0.62, { c: 'c3', w: 1.2, op: 0.45 });
        const outer = L.seq(Math.max(2, Math.round(ang)), (i) => { const t = ang * DEG * i / Math.max(1, Math.round(ang) - 1); return [1.05 * Math.sin(t), 1.05 * Math.cos(t)]; });
        if (ang > 0.5) g.line(outer, { c: 'c1', w: 3.2, op: 0.85 });
        const inner = L.seq(241, (i) => { const q = ribbonQ(i / 240, ang, untwist); return [0.62 * q[1], 0.62 * q[0]]; });
        if (ang > 0.5) g.line(inner, { c: 'c3', w: 3.6 });
        const tq = ang * DEG / 2, to = ang * DEG;
        g.dot(1.05 * Math.sin(to), 1.05 * Math.cos(to), { c: 'c1', r: 6 });
        { const qe1 = ribbonQ(1, ang, untwist); g.dot(0.62 * qe1[1], 0.62 * qe1[0], { c: 'c3', r: 7 }); }
        g.text(0, 0.62 - 0.14, '+1', { small: true, c: 'c3', dy: 4 });
        g.text(0, -0.62 + 0.14, '−1', { small: true, c: 'c3', dy: 4 });
        g.text(0, 1.2, T('identity', '恒等変換'), { small: true, c: 'c1', dy: 4 });
        g.text(0, 0, `q = ${fmt(Math.cos(tq), 2)} + ${fmt(Math.sin(tq), 2)} i`, { small: true, dy: 4 });
        const back = Math.abs(ang % 360) < 0.5 || Math.abs(ang % 360 - 360) < 0.5;
        const sign = Math.cos(tq) > 0 ? '+1' : '−1';
        ctx.readout([{ k: T('rotation angle', '回転角'), v: `${fmt(ang, 0)}°`, tone: 'key' }, { k: T('orientation back to start?', '姿勢は元どおり？'), v: back ? T('yes', 'はい') : T('no', 'いいえ'), tone: back ? 'good' : undefined }, { k: T('quaternion q', '四元数 q'), v: back ? sign : `(${fmt(Math.cos(tq), 2)}, ${fmt(Math.sin(tq), 2)}, 0, 0)`, tone: back && sign === '−1' ? 'warn' : undefined }, { k: T('untwist', 'ほどき'), v: Math.abs(ang - 720) < 1e-9 ? `${fmt(untwist * 100, 0)}%` : T('needs 720°', '720° が必要') }],
          Math.abs(ang - 720) < 1e-9 ? (untwist >= 0.999 ? T('The double twist is gone and the block never moved: the 720° loop shrinks to a point.', '二重のねじれが消え、ブロックは一度も動いていません。720° のループは一点に縮みます。') : T('Drag Untwist: the second turn’s axis swings round until it cancels the first, and the ribbon flattens while the block stays still.', '「ほどく」をドラッグしてください。二回目の回転軸が回り込んで一回目を打ち消し、ブロックは静止したままリボンが平らになります。')) : Math.abs(ang - 360) < 1e-9 ? T('The block looks exactly as it started, yet q = −1 and the ribbon keeps a twist that no motion of the ribbon can remove.', 'ブロックは最初とまったく同じに見えますが q = −1 で、リボンにはどう動かしても取れないねじれが残ります。') : T('The block turns at the full angle; the SU(2) point turns at half the angle.', 'ブロックは全角度で回り、SU(2) の点は半分の角度で回ります。'));
      };
      const st = ctx.state; st.untwist ??= 0;
      if (Math.abs(v.angle - 720) > 1e-9) st.untwist = 0;
      draw(v.angle, st.untwist);
      if (Math.abs(v.angle - 720) < 1e-9) {
        const bar = L.h('div', 'lab-anim', ctx.host);
        const lab = L.h('label', 'lab-control', bar); lab.style.flex = '1';
        lab.append(document.createTextNode(T('Untwist ', 'ほどく ')));
        const inp = L.h('input', '', lab); inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = 0.01; inp.value = st.untwist;
        inp.addEventListener('input', () => { st.untwist = Number(inp.value); draw(v.angle, st.untwist); });
      }
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('ribbon front', 'リボンの表') }, { kind: 'fill', c: 'c2', label: T('ribbon back', 'リボンの裏') }, { c: 'c1', label: T('SO(3): angle θ', 'SO(3)：角度 θ') }, { c: 'c3', label: T('SU(2): angle θ/2', 'SU(2)：角度 θ/2') }]);
    },
  };

  /* ---------- 3. the commutator ---------- */
  D.commutator = {
    render(ctx, v) {
      const e = v.eps;
      const cam = camera(ctx.state, 0.55, 0.5);
      const p0 = unit([0.62, 0.48, 0.62]);
      const X = [1, 0, 0], Y = [0, 1, 0];
      const legs = [[X, e], [Y, e], [X, -e], [Y, -e]];
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Four rotations that ought to cancel. Drag to turn the view.', '打ち消し合うはずの四つの回転。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, maxH: 420 });
      orbit(f, ctx);
      sphere(f, cam, 1);
      axes3(f, cam);
      let p = p0;
      const cols = ['c1', 'c3', 'c1', 'c3'];
      legs.forEach(([ax, ang], k) => {
        const pts = L.seq(41, (i) => mv(rot(ax, ang * i / 40), p));
        curve3(f, cam, pts, { c: cols[k], w: 3, dash: k >= 2 ? '6 3' : '' }, { c: cols[k], w: 2, op: 0.5, dash: '2 3' });
        const mid = cam.P(pts[20]); f.text(mid[0], mid[1], String(k + 1), { small: true, c: cols[k], dx: 8, dy: -6 });
        p = pts[40];
      });
      const Cm = commutator(e), end = mv(Cm, p0);
      f.dot(...cam.P(p0), { c: 'ink', r: 5 });
      f.dot(...cam.P(end), { c: 'hl', r: 6 });
      f.line([cam.P(p0), cam.P(end)], { c: 'hl', w: 2.4, arrow: true, layer: 'over' });
      const sp = cam.P(p0); f.text(sp[0], sp[1], T('start', '出発'), { small: true, dx: -18, dy: 16 });
      const gap = norm(end.map((x, i) => x - p0[i]));
      const ang = angleOf(Cm), ax = axisOf(Cm), tiltZ = Math.acos(L.clamp(Math.abs(ax[2]), 0, 1)) / DEG;
      const zp = norm(cross([0, 0, 1], p0));
      // right: log-log gap against epsilon
      L.h('p', 'lab-cap', c2, T('Gap against ε, both on log scales', '隙間と ε（両対数）'));
      const g = L.fig(c2, { x: [Math.log10(0.02), Math.log10(1.5)], y: [-4, 0.5], aspect: 0.8, maxH: 360, xlabel: 'ε', ticksX: [[Math.log10(0.02), '0.02'], [Math.log10(0.05), '0.05'], [-1, '0.1'], [Math.log10(0.2), '0.2'], [Math.log10(0.5), '0.5'], [0, '1']], ticksY: [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '10⁻²'], [-1, '0.1'], [0, '1']] });
      const gapOf = (x) => { const q = mv(commutator(x), p0); return norm(q.map((y, i) => y - p0[i])); };
      g.line(L.sample(Math.log10(0.02), Math.log10(1.5), 160, (lx) => Math.log10(gapOf(Math.pow(10, lx)))), { c: 'hl', w: 4, op: 0.8 });
      g.line(L.sample(Math.log10(0.02), Math.log10(1.5), 160, (lx) => Math.log10(zp * Math.pow(10, 2 * lx))), { c: 'c4', w: 1.8, dash: '5 4' });
      g.dot(Math.log10(e), Math.log10(gap), { c: 'hl', r: 6 });
      g.text(Math.log10(0.1), Math.log10(zp * 0.01) - 0.55, T('slope 2: ε² |ẑ × v|', '傾き 2：ε² |ẑ × v|'), { anchor: 'start', small: true, c: 'c4' });
      g.hover((lx) => { const x = Math.pow(10, lx); if (x < 0.02 || x > 1.5) return null; const gg = gapOf(x); return { x: lx, y: Math.log10(gg), text: `ε = ${fmt(x, 3)}  gap = ${fmt(gg, 3)}` }; });
      L.legend(ctx.host, [{ c: 'c1', label: T('rotations about x (1, then 3 undoes it)', 'x 軸まわりの回転（1、3 で戻す）') }, { c: 'c3', label: T('rotations about y (2, then 4)', 'y 軸まわりの回転（2、4 で戻す）') }, { c: 'hl', label: T('the gap left over', '残った隙間') }, { c: 'c4', dash: true, label: T('ε² prediction from [Y, X] = −Z', '[Y, X] = −Z による ε² の予測') }]);
      ctx.readout([{ k: T('gap', '隙間'), v: fmt(gap, 4), tone: 'key' }, { k: 'ε²', v: fmt(e * e, 4) }, { k: T('leftover rotation angle', '残った回転の角度'), v: fmt(ang, 4) }, { k: T('its axis, tilt from the z axis', 'その軸の z 軸からの傾き'), v: `${fmt(tiltZ, 1)}°` }, { k: T('angle ÷ ε²', '角度 ÷ ε²'), v: fmt(ang / (e * e), 3) }],
        e < 0.2 ? T('At small ε the leftover rotation is almost exactly ε² about the z axis: the bracket [Y, X] = −Z, read off a picture.', 'ε が小さいと、残った回転はほぼ正確に z 軸まわりの ε² です。括弧積 [Y, X] = −Z を図から読み取れます。') : T('At larger ε, third-order terms tilt the leftover axis away from z and the ratio drifts from 1.', 'ε が大きいと三次の項が残りの軸を z から傾け、比は 1 からずれます。'));
    },
  };
})();
