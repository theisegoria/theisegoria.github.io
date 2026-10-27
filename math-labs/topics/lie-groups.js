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

  /* ---------- shared 3D frame: a 3D view with a 2D panel beside it ---------- */
  function frame3(ctx, cap1, cap2, wide = true) {
    const st = ctx.state;
    if (!st.frame || !st.frame.isConnected) {
      ctx.host.replaceChildren();
      st.frame = L.h('div', '', ctx.host);
      const row = L.h('div', wide ? 'lab-row is-wide' : 'lab-row', st.frame);
      st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
      st.cap1 = L.h('p', 'lab-cap', st.c1, cap1);
      st.v3 = L.h('div', '', st.c1);
      st.cap2 = L.h('p', 'lab-cap', st.c2, cap2);
      st.g2 = L.h('div', '', st.c2);
      st.bar = L.h('div', '', st.frame);
      st.leg = L.h('div', '', st.frame);
    }
    return st;
  }
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sc3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  // a translucent unit sphere with a few parallels and meridians
  function sphere3(S, r = 1) {
    S.surface((u, w) => [r * Math.cos(u) * Math.cos(w), r * Math.sin(u) * Math.cos(w), r * Math.sin(w)], { u: [0, L.TAU], v: [-PI / 2, PI / 2], nu: 72, nv: 36, c: 'muted', opacity: S.dark ? 0.16 : 0.13, rough: 0.7, coat: 0 });
    const segs = [];
    for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = r * Math.sin(la), rr = r * Math.cos(la); for (let i = 0; i < 96; i++) { const a = L.TAU * i / 96, b = L.TAU * (i + 1) / 96; segs.push([[rr * Math.cos(a), rr * Math.sin(a), z], [rr * Math.cos(b), rr * Math.sin(b), z]]); } }
    for (let k = 0; k < 6; k++) { const lo = k * PI / 6; for (let i = 0; i < 96; i++) { const a = L.TAU * i / 96, b = L.TAU * (i + 1) / 96; segs.push([[r * Math.cos(a) * Math.cos(lo), r * Math.cos(a) * Math.sin(lo), r * Math.sin(a)], [r * Math.cos(b) * Math.cos(lo), r * Math.cos(b) * Math.sin(lo), r * Math.sin(b)]]); } }
    S.lines(segs, { c: 'muted', opacity: S.dark ? 0.28 : 0.3 });
  }

  /* ---------- 1. exponential map ---------- */
  const CAP3 = 1.9;
  function expGeom(v) {
    const th = v.theta * DEG, N = v.terms, tilt = v.tilt * DEG;
    const n = [Math.sin(tilt) * Math.cos(PI / 6), Math.sin(tilt) * Math.sin(PI / 6), Math.cos(tilt)];
    const u = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
    const p0 = [0.866 * u[0] + 0.5 * n[0], 0.866 * u[1] + 0.5 * n[1], 0.866 * u[2] + 0.5 * n[2]];
    const centre = n.map((x) => x * dot(p0, n));
    const truePath = L.seq(91, (i) => mv(rot(n, th * i / 90), p0));
    const seriesPath = L.seq(91, (i) => mv(expSeries(n, th * i / 90, N), p0));
    const pT = truePath[90], pS = seriesPath[90];
    const errs = L.seq(16, (k) => norm(mv(expSeries(n, th, k + 1), p0).map((x, i) => x - pT[i])));
    return { th, N, n, p0, centre, truePath, seriesPath, pT, pS, errs, S: expSeries(n, th, N) };
  }
  function expSide(ctx, st, G) {
    const { N, errs, pS } = G;
    st.g2.replaceChildren();
    const g = L.fig(st.g2, { x: [0.3, 16.7], y: [-16, 2], aspect: 0.72, maxH: 340, xlabel: T('terms N', '項数 N'), ticksY: [[-15, '10⁻¹⁵'], [-10, '10⁻¹⁰'], [-5, '10⁻⁵'], [0, '1']], ticksX: [1, 4, 8, 12, 16].map((k) => [k, String(k)]) });
    g.line(errs.map((e, k) => [k + 1, Math.max(-16, Math.log10(Math.max(e, 1e-17)))]), { c: 'c1', w: 1.6, op: 0.6 });
    errs.forEach((e, k) => { const y = Math.max(-16, Math.log10(Math.max(e, 1e-17))); g.seg([k + 1, -16], [k + 1, y], { c: k + 1 === N ? 'c2' : 'c1', w: k + 1 === N ? 3 : 1.2, op: k + 1 === N ? 0.9 : 0.3, layer: 'under' }); g.dot(k + 1, y, { c: k + 1 === N ? 'c2' : 'c1', r: k + 1 === N ? 7 : 4 }); });
    g.hline(Math.log10(2.2e-16), { c: 'muted', dash: '2 3' });
    g.hover((x) => { const k = Math.round(x); if (k < 1 || k > 16) return null; return { x: k, text: `N = ${k}: ${fmt(errs[k - 1], 3)}` }; });
    st.leg.replaceChildren();
    L.legend(st.leg, [{ c: 'hl', label: T('exp(θK) v, the true rotation', 'exp(θK) v（本当の回転）') }, { c: 'c2', label: T(`series with ${N} term${N === 1 ? '' : 's'}`, `${N} 項の級数`) }, { c: 'c1', label: T('rotation axis n', '回転軸 n') }, { c: 'muted', dash: true, label: T('machine precision', '機械精度') }]);
    ctx.readout([{ k: T('gap at θ', 'θ でのずれ'), v: fmt(errs[N - 1], 3), tone: 'key' }, { k: '‖SᵀS − I‖', v: fmt(orthErr(G.S), 3), tone: orthErr(G.S) > 1e-6 ? 'warn' : 'good' }, { k: 'tr R = 1 + 2cos θ', v: fmt(1 + 2 * Math.cos(G.th), 3) }, { k: T('|v| after series', '級数後の |v|'), v: fmt(norm(pS), 3) }],
      N >= 12 && errs[N - 1] < 1e-6 ? T('With enough terms the partial sum is a rotation to within rounding: the series has converged onto the group.', '十分な項数では部分和は丸め誤差の範囲で回転になります。級数が群の上に収束しました。') : T('Few terms give a matrix that is not a rotation: the point leaves the sphere. Larger angles need more terms, roughly N ≈ θ + a few.', '項が少ないと回転でない行列になり、点は球面を離れます。角度が大きいほど多くの項が必要で、目安は N ≈ θ に数項を足した程度です。'));
  }
  // the flat figure: an orbiting SVG projection, used when there is no 3D
  function expFlat(ctx, st, G) {
    const { th, n, p0, centre, truePath, seriesPath, pT } = G;
    const cam = camera(st);
    st.v3.replaceChildren();
    const f = L.fig(st.v3, { x: [-1.75, 1.75], y: [-1.3, 1.65], equal: true, axes: false, maxH: 430 });
    orbit(f, ctx);
    sphere(f, cam, 1);
    axes3(f, cam);
    const nb = n.map((x) => -1.35 * x), nt = n.map((x) => 1.35 * x);
    f.line([cam.P(nb), cam.P(nt)], { c: 'c1', w: 2.4, arrow: true });
    const nl = cam.P(n.map((x) => 1.5 * x)); f.text(nl[0], nl[1], 'n', { math: true, c: 'c1', dy: 4 });
    const circ = L.seq(121, (i) => mv(rot(n, L.TAU * i / 120), p0));
    curve3(f, cam, circ, { c: 'hl', w: 1.2, op: 0.55, dash: '4 4' }, { c: 'hl', w: 1, op: 0.3, dash: '2 4' });
    f.poly([cam.P(centre), ...L.seq(61, (i) => cam.P(mv(rot(n, th * i / 60), p0)))], { c: 'hl', fo: 0.14, w: 0, op: 1, layer: 'under' });
    curve3(f, cam, truePath, { c: 'hl', w: 3.2 }, { c: 'hl', w: 2.2, op: 0.55 });
    const CAP = 1.55, inView = seriesPath.map((p) => { const s = norm(p); return s > CAP ? p.map((x) => x * CAP / s) : p; });
    const offFrame = norm(seriesPath[90]) > CAP;
    curve3(f, cam, inView, { c: 'c2', w: 2.6 }, { c: 'c2', w: 1.8, op: 0.55 });
    f.line([cam.P(pT), cam.P(inView[90])], { c: 'ink', w: 1.2, dash: '2 3' });
    f.dot(...cam.P(p0), { c: 'ink', r: 4 });
    f.dot(...cam.P(pT), { c: 'hl', r: 6.5 });
    f.dot(...cam.P(inView[90]), { c: 'c2', r: 5.5, hollow: offFrame });
    if (offFrame) { const q = cam.P(inView[90]); f.text(q[0], q[1], T('off the frame', '枠の外'), { small: true, c: 'c2', dy: -10 }); }
    const s0 = cam.P(p0); f.text(s0[0], s0[1], 'v', { math: true, dx: -10, dy: -6 });
  }
  D['exp-map'] = {
    three: true,
    render(ctx, v) {
      const st = frame3(ctx, T('The true rotation (gold) against the truncated series (orange). Drag the gold point around its circle to change θ; drag elsewhere to turn the view.', '本当の回転（金）と打ち切った級数（橙）。金色の点を円に沿ってドラッグすると θ が変わり、それ以外の場所をドラッグすると視点が回ります。'), T('Distance from the true point after N terms (log scale)', 'N 項で打ち切ったときの本当の点からの距離（対数目盛）'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 450, camera: [3.1, -3.8, 2.25], target: [0, 0, 0.1], fov: 33,
        init(S) {
          st.flat = false;
          sphere3(S, 1);
          S.axes({ len: 1.32 });
          st.nA = S.arrow([0, 0, -1.4], [0, 0, 2.8], { c: 'c1', r: 0.017 });
          st.nL = S.label('n', [0, 0, 1.5], { math: true, c: 'c1' });
          st.circ = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.007, closed: true, opacity: 0.6 });
          st.sector = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 72, nv: 2, c: 'hl', opacity: 0.2, rough: 0.8, coat: 0 });
          st.tp = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.026, glow: 0.25 });
          st.sp = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c2', r: 0.02 });
          st.gap = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'ink', opacity: 0.75 });
          st.s0 = S.sphere([0, 0, 0], 0.045, { c: 'ink' });
          st.eS = S.sphere([0, 0, 0], 0.055, { c: 'c2' });
          st.vL = S.label('v', [0, 0, 0], { math: true, align: 'end', dy: 14 });
          st.sL = S.label('', [0, 0, 0], { small: true, c: 'c2' });
          st.h = S.handle([0, 0, 0], {
            r: 0.065, plane: [[0, 0, 1], [0, 0, 0]],
            onDrag: (q) => {
              const G = st.G; if (!G) return null;
              const e1 = sub3(G.p0, G.centre), e2 = cross(G.n, e1), w = sub3([q.x, q.y, q.z], G.centre);
              let a = Math.atan2(dot(w, e2), dot(w, e1)); if (a < 0) a += L.TAU;
              const deg = Math.round(a / DEG);
              ctx.set('theta', deg >= 360 && G.th < PI ? 0 : deg);
              return mv(rot(G.n, deg * DEG), G.p0);
            },
          });
        },
        update(S, vv) {
          const G = st.G = expGeom(vv), { th, n, p0, centre, truePath, seriesPath, pT } = G;
          st.nA.set(sc3(n, -1.4), sc3(n, 2.8)); st.nL.set(sc3(n, 1.55));
          st.circ.update(L.seq(97, (i) => mv(rot(n, L.TAU * i / 96), p0)));
          st.sector.update((a, s) => { const q = mv(rot(n, th * a), p0); return add3(centre, sc3(sub3(q, centre), s)); });
          st.tp.update(th > 1e-3 ? truePath : [p0, add3(p0, [0, 0, 1e-4])]);
          const cap = seriesPath.map((p) => { const s = norm(p); return s > CAP3 ? sc3(p, CAP3 / s) : p; });
          st.sp.update(th > 1e-3 ? cap : [p0, add3(p0, [0, 0, 1e-4])]);
          const end = cap[90], off = norm(seriesPath[90]) > CAP3;
          st.eS.at(end); st.gap.update([[pT, end]]);
          st.s0.at(p0); st.vL.set(sc3(p0, 1.12));
          st.sL.set(add3(sc3(end, 1.1), [0, 0, -0.06]), th < 1e-3 ? '' : off ? T('S_N v, off the frame', 'S_N v（枠の外）') : 'S_N v');
          st.h.userData.handle.plane = [n, centre];
          st.h.at(pT);
          expSide(ctx, st, G);
        },
        fallback(c, vv) { st.flat = true; st.cap1.textContent = T('True rotation (gold) against the truncated series (orange). Drag to turn the view.', '本当の回転（金）と打ち切った級数（橙）。ドラッグで視点を回せます。'); const G = expGeom(vv); expFlat(c, st, G); expSide(c, st, G); },
      });
      if (!st.__v3 && !st.flat) expSide(ctx, st, expGeom(v));
    },
  };

  /* ---------- 2. the double cover and the belt ---------- */
  const X0 = -1.6, X1 = 1.0, HW = 0.32, BHS = 0.28, BCX = X1 + BHS;
  const ribbonEdge = (s, w, ang, untwist) => { const q = ribbonQ(s, ang, untwist), p = qrot(q, [0, w * HW, 0]); return [X0 + (X1 - X0) * s + p[0], p[1], p[2]]; };
  function coverFlat(f, cam, ang, untwist) {
    f.clear('main'); f.clear('over'); f.clear('under');
    const wall = [[X0, -0.9, -0.9], [X0, 0.9, -0.9], [X0, 0.9, 0.9], [X0, -0.9, 0.9]].map(cam.P);
    f.poly(wall, { c: 'muted', fo: 0.18, w: 1, layer: 'under' });
    const M = 80, quads = [];
    for (let i = 0; i < M; i++) {
      const s0 = i / M, s1 = (i + 1) / M;
      const a = ribbonEdge(s0, -1, ang, untwist), b = ribbonEdge(s0, 1, ang, untwist), c = ribbonEdge(s1, 1, ang, untwist), d = ribbonEdge(s1, -1, ang, untwist);
      const nrm = qrot(ribbonQ((s0 + s1) / 2, ang, untwist), [0, 0, 1]);
      const facing = dot(nrm, cam.N);
      quads.push({ pts: [a, b, c, d], z: cam.depth([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2]), front: facing >= 0, shade: Math.abs(facing) });
    }
    quads.sort((p, q) => p.z - q.z).forEach((q) => f.poly(q.pts.map(cam.P), { c: q.front ? 'c1' : 'c2', fo: 0.35 + 0.55 * q.shade, w: 0.6, op: 0.95 }));
    const qe = ribbonQ(1, ang, untwist);
    const corners = [-1, 1].flatMap((i) => [-1, 1].flatMap((j) => [-1, 1].map((k) => [i, j, k])));
    const Pc = (c) => { const w = qrot(qe, [c[0] * BHS, c[1] * BHS, c[2] * BHS]); return [BCX + w[0], w[1], w[2]]; };
    const faces = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]].map(([ax, sg]) => {
      const cs = corners.filter((c) => c[ax] === sg);
      const o = [cs[0], cs[1], cs[3], cs[2]].map(Pc);
      const nn = qrot(qe, [ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0]);
      return { o, vis: dot(nn, cam.N), top: ax === 2 && sg === 1 };
    }).filter((q) => q.vis > 0).sort((a, b) => a.vis - b.vis);
    faces.forEach((q) => f.poly(q.o.map(cam.P), { c: q.top ? 'hl' : 'ink', fo: q.top ? 0.75 : 0.12 + 0.3 * q.vis, w: 1.2, layer: 'over' }));
  }
  function coverCircles(g, ang, untwist) {
    g.clear('main'); g.clear('over'); g.clear('under');
    g.circle(0, 0, 1.05, { c: 'c1', w: 1.2, op: 0.45 });
    g.circle(0, 0, 0.62, { c: 'c3', w: 1.2, op: 0.45 });
    const outer = L.seq(Math.max(2, Math.round(ang)), (i) => { const t = ang * DEG * i / Math.max(1, Math.round(ang) - 1); return [1.05 * Math.sin(t), 1.05 * Math.cos(t)]; });
    if (ang > 0.5) g.line(outer, { c: 'c1', w: 3.2, op: 0.85 });
    const inner = L.seq(241, (i) => { const q = ribbonQ(i / 240, ang, untwist); return [0.62 * q[1], 0.62 * q[0]]; });
    if (ang > 0.5) g.line(inner, { c: 'c3', w: 3.6 });
    const tq = ang * DEG / 2, to = ang * DEG;
    g.dot(1.05 * Math.sin(to), 1.05 * Math.cos(to), { c: 'c1', r: 6 });
    const qe1 = ribbonQ(1, ang, untwist); g.dot(0.62 * qe1[1], 0.62 * qe1[0], { c: 'c3', r: 7 });
    g.text(0, 0.62 - 0.14, '+1', { small: true, c: 'c3', dy: 4 });
    g.text(0, -0.62 + 0.14, '−1', { small: true, c: 'c3', dy: 4 });
    g.text(0, 1.2, T('identity', '恒等変換'), { small: true, c: 'c1', dy: 4 });
    g.text(0, 0, `q = ${fmt(Math.cos(tq), 2)} + ${fmt(Math.sin(tq), 2)} i`, { small: true, dy: 4 });
  }
  function coverReadout(ctx, ang, untwist, full) {
    const tq = ang * DEG / 2;
    const back = Math.abs(ang % 360) < 0.5 || Math.abs(ang % 360 - 360) < 0.5;
    const sign = Math.cos(tq) > 0 ? '+1' : '−1';
    ctx.readout([{ k: T('rotation angle', '回転角'), v: `${fmt(ang, 0)}°`, tone: 'key' }, { k: T('orientation back to start?', '姿勢は元どおり？'), v: back ? T('yes', 'はい') : T('no', 'いいえ'), tone: back ? 'good' : undefined }, { k: T('quaternion q', '四元数 q'), v: back ? sign : `(${fmt(Math.cos(tq), 2)}, ${fmt(Math.sin(tq), 2)}, 0, 0)`, tone: back && sign === '−1' ? 'warn' : undefined }, { k: T('untwist', 'ほどき'), v: Math.abs(full - 720) < 1e-9 ? `${fmt(untwist * 100, 0)}%` : T('needs 720°', '720° が必要') }],
      Math.abs(ang - 720) < 1e-9 ? (untwist >= 0.999 ? T('The double twist is gone and the block never moved: the 720° loop shrinks to a point.', '二重のねじれが消え、ブロックは一度も動いていません。720° のループは一点に縮みます。') : T('Drag Untwist, or press Play: the second turn’s axis swings round until it cancels the first, and the ribbon flattens while the block stays still.', '「ほどく」をドラッグするか再生を押してください。二回目の回転軸が回り込んで一回目を打ち消し、ブロックは静止したままリボンが平らになります。')) : Math.abs(ang - 360) < 1e-9 ? T('The block looks exactly as it started, yet q = −1 and the ribbon keeps a twist that no motion of the ribbon can remove.', 'ブロックは最初とまったく同じに見えますが q = −1 で、リボンにはどう動かしても取れないねじれが残ります。') : T('The block turns at the full angle; the SU(2) point turns at half the angle.', 'ブロックは全角度で回り、SU(2) の点は半分の角度で回ります。'));
  }
  D['double-cover'] = {
    three: true,
    render(ctx, v) {
      const st = frame3(ctx, T('A ribbon from the wall to a block whose top face is gold. Its two sides are coloured differently so every twist shows. Drag to turn the view.', '壁から上面が金色のブロックへ伸びるリボン。表と裏を色分けしているので、ねじれがすべて見えます。ドラッグで視点を回せます。'), T('Rotation angle in SO(3) (outer) and the ribbon’s path lifted to SU(2), seen edge-on (inner)', 'SO(3) の回転角（外側）と、SU(2) に持ち上げたリボンの経路を横から見たもの（内側）'));
      st.anim?.stop(); st.bar.replaceChildren();
      const full = v.angle, is720 = Math.abs(full - 720) < 1e-9;
      st.untwist ??= 0;
      if (!is720) st.untwist = 0;
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [-1.45, 1.45], y: [-1.35, 1.35], equal: true, axes: false, maxH: 340 });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('ribbon front', 'リボンの表') }, { kind: 'fill', c: 'c2', label: T('ribbon back', 'リボンの裏') }, { c: 'c1', label: T('SO(3): angle θ', 'SO(3)：角度 θ') }, { c: 'c3', label: T('SU(2): angle θ/2', 'SU(2)：角度 θ/2') }]);
      const draw = (ang, untwist) => {
        if (st.flat) { if (!st.ff || !st.ff.svg.isConnected) { st.v3.replaceChildren(); st.ff = L.fig(st.v3, { x: [-2.1, 2.1], y: [-1.45, 1.45], equal: true, axes: false, maxH: 400 }); orbit(st.ff, ctx); } coverFlat(st.ff, camera(st, 0.95, 0.42), ang, untwist); }
        else st.draw3d?.(ang, untwist);
        coverCircles(g, ang, untwist);
        coverReadout(ctx, ang, untwist, full);
      };
      st.draw = draw;
      const T1 = Math.max(0.8, 2.6 * full / 360), T2 = is720 ? 3 : 0, DUR = T1 + T2;
      let inp = null;
      st.anim = L.animator(st.bar, (dt, t) => {
        const a = full * Math.min(1, t / T1), u = is720 ? L.clamp((t - T1) / Math.max(T2, 1e-9), 0, 1) : 0;
        if (is720 && t > T1) { st.untwist = u; if (inp) inp.value = u; }
        st.frameArgs = [a, t >= T1 ? st.untwist : 0];
        draw(...st.frameArgs);
        return t < DUR;
      }, { autoplay: false, once: true, duration: DUR, initialT: T1 + (is720 ? st.untwist * T2 : 0), playLabel: is720 ? T('Turn twice, then untwist', '2回転してからほどく') : T('Turn the block', 'ブロックを回す') });
      if (is720) {
        const lab = L.h('label', 'lab-control', st.bar); lab.style.display = 'flex'; lab.style.gap = '8px'; lab.style.alignItems = 'center'; lab.style.margin = '4px 0 8px';
        lab.append(document.createTextNode(T('Untwist', 'ほどく')));
        inp = L.h('input', '', lab); inp.type = 'range'; inp.min = 0; inp.max = 1; inp.step = 0.01; inp.value = st.untwist; inp.style.flex = '1';
        inp.addEventListener('input', () => { st.anim?.stop(); st.untwist = Number(inp.value); draw(full, st.untwist); });
      }
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 420, camera: [1.4, -4.6, 2.3], target: [-0.2, 0, 0], fov: 34,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          S.box([0.06, 1.9, 1.9], [X0 - 0.035, 0, 0], { c: 'muted', rough: 0.8, coat: 0 });
          S.label(T('wall', '壁'), [X0, -0.95, 0.95], { small: true, c: 'muted' });
          S.lines([[[X0, 0, 0], [BCX + 0.75, 0, 0]]], { c: 'muted', opacity: 0.5 });
          S.label(T('axis', '軸'), [BCX + 0.75, 0, 0], { small: true, c: 'muted' });
          const fn = (s, w) => ribbonEdge(s, w, st.ra ?? 0, st.ru ?? 0);
          st.rf = S.surface(fn, { u: [0, 1], v: [-1, 1], nu: 180, nv: 2, c: 'c1', side: THREE.FrontSide, rough: 0.5, coat: 0.3 });
          st.rb = S.surface(fn, { u: [0, 1], v: [-1, 1], nu: 180, nv: 2, c: 'c2', side: THREE.BackSide, rough: 0.5, coat: 0.3 });
          const m = S.mat('muted', { rough: 0.45, coat: 0.5 }), top = S.mat('hl', { rough: 0.35, coat: 0.6, glow: 0.15 });
          st.block = new THREE.Mesh(new THREE.BoxGeometry(2 * BHS, 2 * BHS, 2 * BHS), [m, m, m, m, top, m]);
          st.block.position.set(BCX, 0, 0); S.add(st.block);
          st.draw3d = (ang, untwist) => {
            st.ra = ang; st.ru = untwist;
            st.rf.update(fn); st.rb.update(fn);
            const q = ribbonQ(1, ang, untwist);
            st.block.quaternion.set(q[1], q[2], q[3], q[0]);
            S.invalidate();
          };
        },
        update() { draw(...(st.frameArgs || [full, st.untwist])); },
        fallback() { st.flat = true; st.ff = null; st.cap1.textContent = T('A ribbon from the wall to a block. Its two faces are coloured differently so every twist shows. Drag to turn the view.', '壁からブロックへ伸びるリボン。表と裏を色分けしているので、ねじれがすべて見えます。ドラッグで視点を回せます。'); draw(...(st.frameArgs || [full, st.untwist])); },
      });
      st.frameArgs = [full, st.untwist];
      draw(full, st.untwist);
    },
  };

  /* ---------- 3. the commutator ---------- */
  const CP0 = unit([0.62, 0.48, 0.62]);
  function commGeom(e) {
    const legs = [[[1, 0, 0], e], [[0, 1, 0], e], [[1, 0, 0], -e], [[0, 1, 0], -e]];
    let p = CP0;
    const legPts = legs.map(([ax, ang]) => { const pts = L.seq(41, (i) => mv(rot(ax, ang * i / 40), p)); p = pts[40]; return pts; });
    const Cm = commutator(e), end = mv(Cm, CP0);
    return { e, legPts, Cm, end, gap: norm(sub3(end, CP0)), ang: angleOf(Cm), ax: axisOf(Cm), zp: norm(cross([0, 0, 1], CP0)) };
  }
  function commSide(ctx, st, G) {
    const { e, gap, zp, ang, ax } = G, p0 = CP0;
    const tiltZ = Math.acos(L.clamp(Math.abs(ax[2]), 0, 1)) / DEG;
    st.g2.replaceChildren();
    const gapOf = (x) => { const q = mv(commutator(x), p0); return norm(q.map((y, i) => y - p0[i])); };
    const yLo = zp * 0.7, yM = zp * 1.12;
    const g = L.fig(st.g2, { x: [Math.log10(0.02), Math.log10(1.5)], y: [yLo, yM], aspect: 0.8, maxH: 360, xlabel: 'ε', ylabel: T('gap ÷ ε²', '隙間 ÷ ε²'), ticksX: [[Math.log10(0.02), '0.02'], [Math.log10(0.05), '0.05'], [-1, '0.1'], [Math.log10(0.2), '0.2'], [Math.log10(0.5), '0.5'], [0, '1']] });
    g.hline(zp, { c: 'c4', w: 1.8, dash: '5 4' });
    g.text(Math.log10(0.021), zp, T(`prediction |ẑ × v| = ${fmt(zp, 3)}`, `予測 |ẑ × v| = ${fmt(zp, 3)}`), { anchor: 'start', dx: 4, dy: 15, small: true, c: 'c4' });
    g.line(L.sample(Math.log10(0.02), Math.log10(1.5), 160, (lx) => { const x = Math.pow(10, lx); return Math.max(yLo, gapOf(x) / (x * x)); }), { c: 'hl', w: 3.2 });
    g.vline(Math.log10(e), { c: 'hl', w: 1.2, dash: '2 3' });
    g.dot(Math.log10(e), Math.max(yLo, gap / (e * e)), { c: 'hl', r: 6.5 });
    g.hover((lx) => { const x = Math.pow(10, lx); if (x < 0.02 || x > 1.5) return null; const gg = gapOf(x); return { x: lx, y: gg / (x * x), text: `ε = ${fmt(x, 3)}  ${T('gap', '隙間')} = ${fmt(gg, 4)}  ÷ ε² = ${fmt(gg / (x * x), 3)}` }; });
    st.leg.replaceChildren();
    L.legend(st.leg, [{ c: 'c1', label: T('rotations about x (1, then 3 undoes it)', 'x 軸まわりの回転（1、3 で戻す）') }, { c: 'c3', label: T('rotations about y (2, then 4)', 'y 軸まわりの回転（2、4 で戻す）') }, { c: 'hl', label: T('the gap left over, and gap ÷ ε²', '残った隙間と 隙間 ÷ ε²') }, { c: 'c4', dash: true, label: T('[Y, X] = −Z: the leftover axis, and the ε² prediction |ẑ × v|', '[Y, X] = −Z：残った回転の軸と ε² の予測 |ẑ × v|') }]);
    ctx.readout([{ k: T('gap', '隙間'), v: fmt(gap, 4), tone: 'key' }, { k: 'ε²', v: fmt(e * e, 4) }, { k: T('leftover rotation angle', '残った回転の角度'), v: fmt(ang, 4) }, { k: T('its axis, tilt from the z axis', 'その軸の z 軸からの傾き'), v: `${fmt(tiltZ, 1)}°` }, { k: T('gap ÷ ε²', '隙間 ÷ ε²'), v: fmt(gap / (e * e), 3) }, { k: '|ẑ × v|', v: fmt(zp, 3) }],
      e < 0.2 ? T('At small ε the leftover rotation is almost exactly ε² about the z axis, pointing down: the bracket [Y, X] = −Z, read off a picture.', 'ε が小さいと、残った回転はほぼ正確に下向きの z 軸まわりの ε² です。括弧積 [Y, X] = −Z を図から読み取れます。') : T('At larger ε, third-order terms tilt the leftover axis away from z and the ratio drifts from |ẑ × v|.', 'ε が大きいと三次の項が残りの軸を z から傾け、比は |ẑ × v| からずれます。'));
  }
  function commFlat(ctx, st, G) {
    const cam = camera(st, 0.55, 0.5), p0 = CP0, { legPts, end } = G;
    st.v3.replaceChildren();
    const f = L.fig(st.v3, { x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, maxH: 420 });
    orbit(f, ctx);
    sphere(f, cam, 1);
    axes3(f, cam);
    const cols = ['c1', 'c3', 'c1', 'c3'];
    const cen2 = legPts.flat().map(cam.P).reduce((a, q) => [a[0] + q[0], a[1] + q[1]], [0, 0]).map((x) => x / (4 * 41));
    legPts.forEach((pts, k) => {
      curve3(f, cam, pts, { c: cols[k], w: 3, dash: k >= 2 ? '6 3' : '' }, { c: cols[k], w: 2, op: 0.5, dash: '2 3' });
      const mid = cam.P(pts[20]); const dxo = mid[0] - cen2[0], dyo = mid[1] - cen2[1], mo = Math.hypot(dxo, dyo) || 1;
      f.text(mid[0], mid[1], String(k + 1), { small: true, c: cols[k], dx: 14 * dxo / mo, dy: -14 * dyo / mo + 4, layer: 'over' });
    });
    f.dot(...cam.P(p0), { c: 'ink', r: 5, hollow: true });
    f.dot(...cam.P(end), { c: 'hl', r: 5 });
    f.line([cam.P(p0), cam.P(end)], { c: 'hl', w: 2.6, arrow: true, layer: 'over' });
    const sp = cam.P(p0); { const dxo = sp[0] - cen2[0], dyo = sp[1] - cen2[1], mo = Math.hypot(dxo, dyo) || 1; f.text(sp[0], sp[1], T('start', '出発'), { small: true, dx: 22 * dxo / mo, dy: -22 * dyo / mo + 4, layer: 'over' }); }
  }
  D.commutator = {
    three: true,
    render(ctx, v) {
      const st = frame3(ctx, T('Four rotations of the sphere that ought to cancel, applied to one point. Drag to turn the view.', '打ち消し合うはずの四つの回転を球面上の1点に施します。ドラッグで視点を回せます。'), T('The ratio gap ÷ ε² against ε (log scale, y axis zoomed): it tends to |ẑ × v| as ε → 0', 'ε（対数目盛、縦軸は拡大）に対する比 隙間 ÷ ε²：ε → 0 で |ẑ × v| に近づきます'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 450, camera: [3.3, 2.3, 2.6], target: [0.25, 0.2, 0.25], fov: 30,
        init(S) {
          st.flat = false;
          sphere3(S, 1);
          S.axes({ len: 1.3 });
          st.legs = [0, 1, 2, 3].map((k) => S.tube([[0, 0, 0], [0, 0, 0.01]], { c: k % 2 ? 'c3' : 'c1', r: k < 2 ? 0.02 : 0.014, opacity: k < 2 ? 1 : 0.85 }));
          st.legL = [0, 1, 2, 3].map((k) => S.label(String(k + 1), [0, 0, 0], { small: true, c: k % 2 ? 'c3' : 'c1', align: 'middle' }));
          st.s0 = S.sphere(CP0, 0.04, { c: 'ink' });
          S.label(T('start v', '出発点 v'), add3(sc3(CP0, 1.08), [0, 0, 0.05]), { small: true });
          st.end = S.sphere(CP0, 0.04, { c: 'hl', glow: 0.3 });
          st.gapA = S.arrow(CP0, [0, 0, 0.01], { c: 'hl', r: 0.011, glow: 0.3 });
          st.axA = S.arrow([0, 0, 0], [0, 0, -1.25], { c: 'c4', r: 0.016 });
          st.axL = S.label(T('leftover axis', '残った回転の軸'), [0, 0, -1.35], { small: true, c: 'c4' });
        },
        update(S, vv) {
          const G = commGeom(vv.eps);
          G.legPts.forEach((pts, k) => {
            st.legs[k].update(pts.map((p) => sc3(p, 1.006)));
            const m = pts[20], rad = sub3(m, CP0), out = norm(rad) > 1e-9 ? unit(rad) : [0, 0, 1];
            st.legL[k].set(add3(sc3(m, 1.04), sc3(out, 0.07)));
          });
          st.end.at(G.end);
          st.gapA.set(CP0, sub3(G.end, CP0));
          st.axA.set([0, 0, 0], sc3(G.ax, 1.25)); st.axL.set(sc3(G.ax, 1.36));
          commSide(ctx, st, G);
        },
        fallback(c, vv) { st.flat = true; const G = commGeom(vv.eps); commFlat(c, st, G); commSide(c, st, G); },
      });
      if (!st.__v3 && !st.flat) commSide(ctx, st, commGeom(v.eps));
    },
  };
})();
