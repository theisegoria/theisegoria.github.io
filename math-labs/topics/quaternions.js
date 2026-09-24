'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/quaternions.cjs) ---------- */
  // quaternions as [w, x, y, z]; 3-vectors as [x, y, z]
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit3 = (a) => { const n = norm3(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const qmul = (a, b) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qconj = (q) => [q[0], -q[1], -q[2], -q[3]];
  const qdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const qnorm = (q) => Math.sqrt(qdot(q, q));
  const qscale = (q, s) => q.map((x) => x * s);
  const qunit = (q) => qscale(q, 1 / (qnorm(q) || 1));
  const qinv = (q) => qscale(qconj(q), 1 / qdot(q, q));
  const pure = (v) => [0, v[0], v[1], v[2]];
  const vec = (q) => [q[1], q[2], q[3]];
  // unit axis n, angle th (radians): q = cos(th/2) + sin(th/2) n
  const fromAxisAngle = (n, th) => { const u = unit3(n), s = Math.sin(th / 2); return [Math.cos(th / 2), s * u[0], s * u[1], s * u[2]]; };
  // rotation angle in [0, 2 pi] of the rotation q represents (sign-insensitive angle is min(a, 2 pi - a))
  const rotAngle = (q) => 2 * Math.acos(clamp(Math.abs(q[0]) / (qnorm(q) || 1), -1, 1));
  // the sandwich q v q^-1, and the two halves of it
  const rotate = (q, v) => vec(qmul(qmul(q, pure(v)), qinv(q)));
  const leftHalf = (q, v) => qmul(q, pure(v));
  // rotation matrix of a unit quaternion (Euler-Rodrigues)
  function toMatrix(q) {
    const [w, x, y, z] = qunit(q);
    return [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
      [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
      [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]];
  }
  // Shepperd's method: pick the largest of 4w^2, 4x^2, 4y^2, 4z^2 to avoid dividing by a small number
  function fromMatrix(M) {
    const tr = M[0][0] + M[1][1] + M[2][2];
    const c = [tr, M[0][0], M[1][1], M[2][2]];
    let k = 0; for (let i = 1; i < 4; i++) if (c[i] > c[k]) k = i;
    let q;
    if (k === 0) { const s = 2 * Math.sqrt(1 + tr); q = [s / 4, (M[2][1] - M[1][2]) / s, (M[0][2] - M[2][0]) / s, (M[1][0] - M[0][1]) / s]; }
    else if (k === 1) { const s = 2 * Math.sqrt(1 + M[0][0] - M[1][1] - M[2][2]); q = [(M[2][1] - M[1][2]) / s, s / 4, (M[0][1] + M[1][0]) / s, (M[0][2] + M[2][0]) / s]; }
    else if (k === 2) { const s = 2 * Math.sqrt(1 + M[1][1] - M[0][0] - M[2][2]); q = [(M[0][2] - M[2][0]) / s, (M[0][1] + M[1][0]) / s, s / 4, (M[1][2] + M[2][1]) / s]; }
    else { const s = 2 * Math.sqrt(1 + M[2][2] - M[0][0] - M[1][1]); q = [(M[1][0] - M[0][1]) / s, (M[0][2] + M[2][0]) / s, (M[1][2] + M[2][1]) / s, s / 4]; }
    return q[0] < 0 ? qscale(q, -1) : q;
  }
  const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  // Rodrigues' formula, independent of quaternions (for checking)
  const rodrigues = (n, th, v) => { const u = unit3(n), c = Math.cos(th), s = Math.sin(th); return add3(add3(scale3(v, c), scale3(cross(u, v), s)), scale3(u, dot(u, v) * (1 - c))); };

  // interpolation between unit quaternions a and b, t in [0, 1]; no sign flip here (the caller chooses)
  function slerp(a, b, t) {
    const d = clamp(qdot(a, b), -1, 1), phi = Math.acos(d);
    if (phi < 1e-9) return qunit(a.map((x, i) => x + t * (b[i] - x)));
    const sa = Math.sin((1 - t) * phi) / Math.sin(phi), sb = Math.sin(t * phi) / Math.sin(phi);
    return a.map((x, i) => sa * x + sb * b[i]);
  }
  const nlerp = (a, b, t) => qunit(a.map((x, i) => (1 - t) * x + t * b[i]));
  // exp and log of quaternions: exp(v) for pure v, log of a unit quaternion
  const qexp = (v) => { const th = norm3(v); if (th < 1e-12) return [1, v[0], v[1], v[2]]; const s = Math.sin(th) / th; return [Math.cos(th), v[0] * s, v[1] * s, v[2] * s]; };
  const qlog = (q) => { const u = qunit(q), s = norm3(vec(u)), th = Math.atan2(s, u[0]); return s < 1e-12 ? [0, 0, 0] : scale3(vec(u), th / s); };
  // angle of the rotation carrying orientation p to orientation q, sign-insensitive (radians)
  const between = (p, q) => { const d = Math.min(qnorm(p.map((x, i) => x - q[i])), qnorm(p.map((x, i) => x + q[i]))); return 4 * Math.asin(Math.min(1, d / 2)); };
  // angular speed |omega| of a path q(t) by central differences (radians per unit t)
  const speed = (path, t, h = 1e-4) => { const a = Math.max(0, t - h), b = Math.min(1, t + h); return between(path(a), path(b)) / (b - a); };
  // arc length of a path of orientations: the total angle turned through
  const turned = (path, n = 400) => { let s = 0, prev = path(0); for (let i = 1; i <= n; i++) { const q = path(i / n); s += between(prev, q); prev = q; } return s; };
  // speed of nlerp at t = 1/2 relative to slerp, for unit quaternions an angle phi apart on the 3-sphere
  const nlerpMidRatio = (phi) => (phi < 1e-9 ? 1 : 2 * Math.tan(phi / 2) / phi);

  // Euler angles, aerospace z-y-x: R = Rz(yaw) Ry(pitch) Rx(roll)
  const fromEuler = (yaw, pitch, roll) => qmul(qmul(fromAxisAngle([0, 0, 1], yaw), fromAxisAngle([0, 1, 0], pitch)), fromAxisAngle([1, 0, 0], roll));
  function toEuler(q) {
    const M = toMatrix(q);
    const pitch = Math.asin(clamp(-M[2][0], -1, 1));
    if (Math.abs(M[2][0]) > 1 - 1e-12) return [Math.atan2(-M[0][1], M[1][1]), pitch, 0]; // locked: only yaw minus roll (or plus) is defined
    return [Math.atan2(M[1][0], M[0][0]), pitch, Math.atan2(M[2][1], M[2][2])];
  }
  // world-frame directions of the three gimbal axes, and the Jacobian from Euler rates to angular velocity
  function gimbalAxes(yaw, pitch) {
    const z = [0, 0, 1], y1 = [-Math.sin(yaw), Math.cos(yaw), 0], x2 = [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch)];
    return [z, y1, x2];
  }
  const eulerRateJacobian = (yaw, pitch) => { const [a, b, c] = gimbalAxes(yaw, pitch); return [[a[0], b[0], c[0]], [a[1], b[1], c[1]], [a[2], b[2], c[2]]]; };
  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  // the Gram matrix J^T J is [[1,0,-s],[0,1,0],[-s,0,1]] with s = sin(pitch): singular values 1 and sqrt(1 +- s)
  const sigmaMin = (pitch) => Math.sqrt(Math.max(0, 1 - Math.abs(Math.sin(pitch))));
  // interpolate Euler angles linearly (the naive method), returning a quaternion path
  const eulerPath = (e0, e1) => (t) => fromEuler(e0[0] + t * (e1[0] - e0[0]), e0[1] + t * (e1[1] - e0[1]), e0[2] + t * (e1[2] - e0[2]));

  (window.LabModels = window.LabModels || {})['quaternions'] = { dot, cross, qmul, qconj, qnorm, qunit, qinv, qdot, pure, vec, fromAxisAngle, rotAngle, rotate, leftHalf, toMatrix, fromMatrix, mv, rodrigues, slerp, nlerp, qexp, qlog, between, speed, turned, nlerpMidRatio, fromEuler, toEuler, gimbalAxes, eulerRateJacobian, det3, sigmaMin, eulerPath };

  if (!L.fig) return; // model-only load (checks)

  /* ---------- a small orbiting 3D camera over an SVG figure ---------- */
  function camera(st, a0 = 0.7, e0 = 0.35) {
    st.view ||= { a: a0, e: e0 };
    const { a, e } = st.view;
    const R = [-Math.sin(a), Math.cos(a), 0], U = [-Math.cos(a) * Math.sin(e), -Math.sin(a) * Math.sin(e), Math.cos(e)], N = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
    // screen point (x, y) inside the unit disc back to the front hemisphere of the unit sphere
    const lift = (x, y) => { const r2 = x * x + y * y; if (r2 >= 1) { const r = Math.sqrt(r2); x /= r; y /= r; return add3(scale3(R, x), scale3(U, y)); } return add3(add3(scale3(R, x), scale3(U, y)), scale3(N, Math.sqrt(1 - r2))); };
    return { P: (p) => [dot(p, R), dot(p, U)], depth: (p) => dot(p, N), N, lift };
  }
  function orbit(f, ctx) {
    f.svg.style.cursor = 'grab'; f.svg.style.touchAction = 'none';
    f.svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.lab-handle')) return;
      ev.preventDefault();
      const x0 = ev.clientX, y0 = ev.clientY, v0 = { ...ctx.state.view };
      const move = (m) => { ctx.state.view = { a: v0.a - (m.clientX - x0) * 0.01, e: clamp(v0.e + (m.clientY - y0) * 0.01, -1.4, 1.4) }; ctx.redraw(); };
      const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    });
  }
  // a 3D polyline, solid in front of the plane through the origin facing the viewer and faint behind it
  function curve3(f, cam, pts, o, oBack) {
    let run = [], front = null;
    const flush = () => { if (run.length > 1) f.line(run, front ? o : (oBack || o)); };
    pts.forEach((p) => { const fr = cam.depth(p) >= -1e-9; if (front !== null && fr !== front) { const last = run[run.length - 1]; flush(); run = [last]; } front = fr; run.push(cam.P(p)); });
    flush();
  }
  function sphere(f, cam, r = 1) {
    const back = { c: 'muted', w: 0.6, dash: '2 4', op: 0.35, layer: 'under' };
    for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = r * Math.sin(la), rr = r * Math.cos(la); curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [rr * Math.cos(q), rr * Math.sin(q), z]; }), { c: 'muted', w: k === 0 ? 1 : 0.7, op: 0.45, layer: 'under' }, back); }
    for (let k = 0; k < 6; k++) { const lo = k * PI / 6; curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [r * Math.cos(q) * Math.cos(lo), r * Math.cos(q) * Math.sin(lo), r * Math.sin(q)]; }), { c: 'muted', w: 0.7, op: 0.4, layer: 'under' }, back); }
    f.circle(0, 0, r, { c: 'ink', w: 1.1, op: 0.45, layer: 'under' });
  }
  function axes3(f, cam, len = 1.25) {
    [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']].forEach(([p, s]) => {
      const tip = scale3(p, len), q = cam.P(tip);
      f.line([cam.P([0, 0, 0]), q], { c: 'muted', w: 1, op: cam.depth(tip) >= 0 ? 0.7 : 0.35, dash: '3 3', layer: 'under' });
      const lab = cam.P(scale3(p, len + 0.1));
      f.text(lab[0], lab[1], s, { math: true, small: true, c: 'muted', dy: 4 });
    });
  }
  // an orthonormal pair spanning the plane perpendicular to n
  const perpBasis = (n, hint) => { let e1 = sub3(hint, scale3(n, dot(hint, n))); if (norm3(e1) < 1e-6) e1 = sub3([1, 0, 0], scale3(n, n[0])); if (norm3(e1) < 1e-6) e1 = sub3([0, 1, 0], scale3(n, n[1])); e1 = unit3(e1); return [e1, cross(n, e1)]; };
  const sph = (az, el) => [Math.cos(el * DEG) * Math.cos(az * DEG), Math.cos(el * DEG) * Math.sin(az * DEG), Math.sin(el * DEG)];
  const azel = (p) => [Math.atan2(p[1], p[0]) / DEG, Math.asin(clamp(p[2], -1, 1)) / DEG];
  const qstr = (q, d = 3) => `(${q.map((x) => fmt(Math.abs(x) < 5e-13 ? 0 : x, d)).join(', ')})`;

  /* ---------- 1. the sandwich q v q* ---------- */
  D['quat-sandwich'] = {
    render(ctx, v) {
      const th = v.th * DEG, n = sph(v.naz, v.nel), vv = sph(v.vaz, v.vel);
      const q = fromAxisAngle(n, th), vr = rotate(q, vv), half = leftHalf(q, vv);
      const a = dot(n, vv), vperp = sub3(vv, scale3(n, a)), rp = norm3(vperp);
      const [e1, e2] = perpBasis(n, vperp);
      const cam = camera(ctx.state, 0.75, 0.38);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The rotation in space. Drag the tips of v and of the axis n; drag elsewhere to turn the view.', '空間での回転です。v と軸 n の先端をドラッグできます。それ以外の場所をドラッグすると視点が回ります。'));
      const f = L.fig(c1, { x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, maxH: 430 });
      orbit(f, ctx);
      sphere(f, cam, 1);
      axes3(f, cam);
      // the axis n through the origin
      curve3(f, cam, [scale3(n, -1.3), [0, 0, 0], scale3(n, 1.3)], { c: 'c4', w: 2.2 }, { c: 'c4', w: 1.6, op: 0.5, dash: '4 3' });
      const nt = cam.P(scale3(n, 1.3)); f.text(nt[0], nt[1], 'n', { math: true, c: 'c4', dx: 10, dy: -6 });
      // the circle v sweeps about n, and the arc actually swept
      const ctr = scale3(n, a);
      const circ = L.seq(145, (i) => { const s = L.TAU * i / 144; return add3(ctr, add3(scale3(e1, rp * Math.cos(s)), scale3(e2, rp * Math.sin(s)))); });
      curve3(f, cam, circ, { c: 'c3', w: 1.2, op: 0.7, dash: '5 4' }, { c: 'c3', w: 1, op: 0.35, dash: '2 4' });
      if (rp > 1e-3 && th > 1e-3) {
        const arc = L.seq(121, (i) => { const s = th * i / 120; return add3(ctr, add3(scale3(e1, rp * Math.cos(s)), scale3(e2, rp * Math.sin(s)))); });
        curve3(f, cam, arc, { c: 'hl', w: 3.2 }, { c: 'hl', w: 2.4, op: 0.55 });
        const mid = cam.P(arc[60]); f.text(mid[0], mid[1], 'θ', { math: true, c: 'hl', dx: 10, dy: -8 });
      }
      f.line([cam.P(ctr), cam.P(vv)], { c: 'c3', w: 1, op: 0.6, dash: '2 3' });
      f.line([cam.P(ctr), cam.P(vr)], { c: 'c3', w: 1, op: 0.6, dash: '2 3' });
      f.line([cam.P([0, 0, 0]), cam.P(vv)], { c: 'ink', w: 2.4, arrow: true, layer: 'over' });
      f.line([cam.P([0, 0, 0]), cam.P(vr)], { c: 'hl', w: 2.8, arrow: true, layer: 'over' });
      const pr = cam.P(vr); f.text(pr[0], pr[1], 'q v q*', { math: true, c: 'hl', dx: 12, dy: 14, anchor: 'start' });
      const pv = cam.P(vv); f.text(pv[0], pv[1], 'v', { math: true, dx: -12, dy: -10 });
      const dragTo = (kaz, kel) => (x, y) => { const p = cam.lift(x, y), [az, el] = azel(p); ctx.set(kaz, Math.round(az), true); ctx.set(kel, Math.round(el), true); ctx.redraw(); };
      if (cam.depth(vv) >= 0) f.handle(pv[0], pv[1], { c: 'c2', r: 7, label: T('Tip of the vector v', 'ベクトル v の先端'), bounds: [-1, 1, -1, 1], onDrag: dragTo('vaz', 'vel') });
      const nh = cam.P(n); if (cam.depth(n) >= 0) f.handle(nh[0], nh[1], { c: 'c4', r: 7, label: T('Tip of the rotation axis n', '回転軸 n の先端'), bounds: [-1, 1, -1, 1], onDrag: dragTo('naz', 'nel') });

      // right: the two halves of the sandwich, in the two planes that matter
      L.h('p', 'lab-cap', c2, T('Perpendicular part v⊥, in the plane at right angles to n: q· turns it by θ/2, then ·q* by θ/2 more', '垂直成分 v⊥（n に直交する平面）：q· で θ/2 回り、·q* でさらに θ/2 回ります'));
      const g = L.fig(c2, { x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, maxH: 250 });
      g.hline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' }); g.vline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' });
      // each panel is drawn with its part scaled to unit length, so a short part still reads clearly
      const u1 = [1, 0], uh = [Math.cos(th / 2), Math.sin(th / 2)], uf = [Math.cos(th), Math.sin(th)];
      g.line(L.seq(121, (i) => [Math.cos(L.TAU * i / 120), Math.sin(L.TAU * i / 120)]), { c: 'c3', w: 1, op: 0.6, dash: '4 3' });
      if (th > 1e-3) {
        g.line(L.seq(61, (i) => { const s = th / 2 * i / 60; return [0.3 * Math.cos(s), 0.3 * Math.sin(s)]; }), { c: 'c1', w: 2.2 });
        g.line(L.seq(61, (i) => { const s = th / 2 + th / 2 * i / 60; return [0.42 * Math.cos(s), 0.42 * Math.sin(s)]; }), { c: 'hl', w: 2.2 });
      }
      g.arrow([0, 0], u1, { c: 'ink', w: 2.2 });
      g.arrow([0, 0], uh, { c: 'c1', w: 2.2 });
      g.arrow([0, 0], uf, { c: 'hl', w: 2.6 });
      const lab2 = (p, s, c, math = true) => g.text(p[0] * 1.14, p[1] * 1.14, s, { math, small: true, c, anchor: p[0] > 0.3 ? 'start' : p[0] < -0.3 ? 'end' : 'middle', dy: p[1] < -0.3 ? 12 : 4 });
      lab2(u1, 'v⊥', 'ink'); lab2(uh, 'q v⊥', 'c1'); lab2(uf, 'q v⊥ q*', 'hl');
      g.text(1.28, -1.22, T(`n out of the page · |v⊥| = ${fmt(rp, 2)}`, `n は手前向き · |v⊥| = ${fmt(rp, 2)}`), { small: true, c: 'muted', anchor: 'end' });

      L.h('p', 'lab-cap', c2, T('Parallel part a n, in the plane of 1 and n: q· tips it out into the real direction, ·q* tips it back', '平行成分 a n（1 と n の張る平面）：q· で実数方向へ傾き、·q* で元に戻ります'));
      const k = L.fig(c2, { x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, maxH: 250 });
      k.hline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' }); k.vline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' });
      k.text(1.25, 0, T('real', '実部'), { small: true, c: 'muted', anchor: 'end', dy: -8 });
      k.text(0, 1.22, 'n', { math: true, small: true, c: 'muted', dx: 10 });
      k.line(L.seq(121, (i) => [Math.cos(L.TAU * i / 120), Math.sin(L.TAU * i / 120)]), { c: 'c3', w: 1, op: 0.5, dash: '4 3' });
      const sg = a >= 0 ? 1 : -1, hp = [-sg * Math.sin(th / 2), sg * Math.cos(th / 2)];
      if (th > 1e-3) {
        const s0 = sg > 0 ? PI / 2 : -PI / 2;
        k.line(L.seq(61, (i) => { const s = s0 + th / 2 * i / 60; return [0.4 * Math.cos(s), 0.4 * Math.sin(s)]; }), { c: 'c1', w: 2.2 });
      }
      k.arrow([0, 0], [0, sg], { c: 'hl', w: 3.2 });
      k.arrow([0, 0], [0, sg], { c: 'ink', w: 1.6, dash: '4 3' });
      k.arrow([0, 0], hp, { c: 'c1', w: 2.2 });
      k.text(0, sg, T('a n, before and after', 'a n（前と後）'), { small: true, dx: 10, dy: sg > 0 ? 10 : -4, anchor: 'start' });
      k.text(hp[0] * 1.1, hp[1] * 1.1, 'q (a n)', { small: true, math: true, c: 'c1', anchor: hp[0] < -0.2 ? 'end' : hp[0] > 0.2 ? 'start' : 'middle', dy: hp[1] < 0 ? 12 : -4 });
      k.dot(hp[0], 0, { c: 'c2', r: 4 });
      k.seg([hp[0], 0], hp, { c: 'c2', w: 1, dash: '2 3' });
      k.text(hp[0], 0, T('real part', '実部'), { small: true, c: 'c2', anchor: 'middle', dy: hp[1] >= 0 ? 14 : -6 });
      k.text(1.28, -1.22, `|a| = ${fmt(Math.abs(a), 2)}`, { small: true, c: 'muted', anchor: 'end' });

      L.legend(ctx.host, [{ c: 'ink', label: T('v, and its two parts', 'v とその二つの成分') }, { c: 'c1', label: T('after q· only (half the angle)', 'q· のみの後（角度は半分）') }, { c: 'hl', label: T('after the sandwich q v q*', 'サンドイッチ q v q* の後') }, { c: 'c4', label: T('axis n', '軸 n') }]);
      const re1 = half[0], re2 = qmul(half, qconj(q))[0];
      ctx.readout([{ k: 'q', v: qstr(q), tone: 'key' }, { k: T('rotation angle θ', '回転角 θ'), v: `${fmt(v.th, 0)}°` }, { k: 'a = n·v', v: fmt(a, 3) }, { k: T('real part of q v', 'q v の実部'), v: fmt(re1, 3), tone: Math.abs(re1) > 1e-3 ? 'warn' : undefined }, { k: T('real part of q v q*', 'q v q* の実部'), v: fmt(Math.abs(re2) < 5e-13 ? 0 : re2, 3), tone: 'good' }, { k: '|q v q*|', v: fmt(norm3(vr), 3) }],
        Math.abs(a) < 1e-3 ? T('v is perpendicular to n, so q v is already a pure vector turned by θ/2. The second factor turns it by the other θ/2.', 'v が n に直交しているので、q v はすでに θ/2 回っただけの純粋なベクトルです。二つ目の因子が残りの θ/2 を回します。')
          : T('Multiplying by q alone rotates v⊥ by θ/2 but also tips the parallel part into the real direction, by −sin(θ/2) a. Multiplying by q* on the right repeats the turn and undoes the tipping: that is why the angle is halved in q.', 'q だけを掛けると v⊥ は θ/2 回りますが、平行成分も実数方向へ −sin(θ/2) a だけ傾きます。右から q* を掛けると回転が繰り返され、傾きが打ち消されます。q の中の角度が半分なのはこのためです。'));
    },
  };

  /* ---------- 2. interpolating orientations ---------- */
  const QA_EULER = [-120 * DEG, 25 * DEG, -30 * DEG];
  D['slerp'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const Om = v.om * DEG, axis = unit3([Math.sin(v.tilt * DEG), 0.25 * Math.sin(v.tilt * DEG), Math.cos(v.tilt * DEG)]);
      // key A is a fixed, ordinary orientation; key B is A turned by Omega about the chosen axis
      const qA = fromEuler(...QA_EULER), qB0 = qmul(fromAxisAngle(axis, Om), qA), long = v.path === 1;
      const qB = long ? qscale(qB0, -1) : qB0;
      const eA = toEuler(qA), eB = toEuler(qB0);
      // a marked point of the body, chosen so that its path is a wide circle about the turning axis
      const P0 = unit3(add3(unit3([-axis[2], 0, axis[0]]), scale3(axis, 1.15))), BODY = rotate(qconj(qA), P0);
      const paths = [
        { key: 'slerp', c: 'hl', w: 3.4, f: (t) => slerp(qA, qB, t), label: T('slerp', 'slerp') },
        { key: 'nlerp', c: 'c1', w: 2.2, f: (t) => nlerp(qA, qB, t), label: T('normalised lerp', '正規化した線形補間') },
        { key: 'euler', c: 'c2', w: 2.2, f: eulerPath(eA, eB), label: T('lerp of Euler angles', 'オイラー角の線形補間') },
      ];
      const stats = paths.map((p) => { const sp = L.seq(101, (i) => speed(p.f, i / 100)); return { sp, tot: turned(p.f), max: Math.max(...sp), min: Math.min(...sp) }; });
      const cam = camera(ctx.state, Math.atan2(axis[1], axis[0]) + 0.15, Math.asin(axis[2]) + 0.12);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Where one marked point of the body travels, with ticks at t = 0, 0.1, …, 1. Evenly spaced ticks mean constant speed. Drag to turn the view.', '物体の一点がたどる経路で、t = 0, 0.1, …, 1 に目盛りを打っています。目盛りが等間隔なら速さは一定です。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, maxH: 430 });
      orbit(f, ctx);
      sphere(f, cam, 1); axes3(f, cam);
      L.h('p', 'lab-cap', c2, T('Angular speed |ω| along each path (degrees per unit t)', '各経路での角速度 |ω|（t 一単位あたりの度）'));
      const ymax = Math.max(...stats.map((s) => s.max)) / DEG * 1.15 + 5;
      const g = L.fig(c2, { x: [0, 1], y: [0, ymax], aspect: 0.75, maxH: 360, xlabel: 't', ylabel: '|ω|' });
      [...paths].reverse().forEach((p) => {
        curve3(f, cam, L.seq(121, (j) => rotate(p.f(j / 120), BODY)), { c: p.c, w: p.w, op: 0.95 }, { c: p.c, w: p.w * 0.7, op: 0.4, dash: '3 3' });
        g.line(stats[paths.indexOf(p)].sp.map((s, j) => [j / 100, s / DEG]), { c: p.c, w: p.w });
      });
      [...paths].reverse().forEach((p) => { for (let j = 0; j <= 10; j++) { const s = rotate(p.f(j / 10), BODY), P = cam.P(s); f.dot(P[0], P[1], { c: p.c, r: j % 5 ? 3 : 4.2, op: cam.depth(s) >= 0 ? 1 : 0.45, layer: 'main' }); } });
      g.hline(stats[0].tot / DEG, { c: 'muted', w: 1, dash: '4 4', op: 0.7, layer: 'under' });
      g.text(0.02, stats[0].tot / DEG, T('average = total angle', '平均 = 総回転角'), { small: true, c: 'muted', anchor: 'start', dy: -6 });
      const pA = cam.P(P0), pB = cam.P(rotate(qB0, BODY));
      f.text(pA[0], pA[1], 'A', { math: true, dx: -14, dy: 16, layer: 'main' }); f.text(pB[0], pB[1], 'B', { math: true, dx: 14, dy: -10, layer: 'main' });
      // the moving body frame for slerp
      const draw = (t) => {
        f.clear('over'); g.clear('over');
        const q = paths[0].f(t);
        [[[1, 0, 0], 'c3'], [[0, 1, 0], 'c4'], [[0, 0, 1], 'ink']].forEach(([e, c]) => { const w = rotate(q, scale3(e, 0.55)); f.line([cam.P([0, 0, 0]), cam.P(w)], { c, w: 2.4, arrow: true, layer: 'over' }); });
        paths.forEach((p) => { const s = rotate(p.f(t), BODY), P = cam.P(s); f.dot(P[0], P[1], { c: p.c, r: 6, layer: 'over' }); });
        g.vline(t, { c: 'ink', w: 1, op: 0.5, dash: '3 3', layer: 'over' });
        stats.forEach((s, i) => g.dot(t, speed(paths[i].f, t) / DEG, { c: paths[i].c, r: 4.5, layer: 'over' }));
      };
      const DUR = 4;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { const u = Math.min(1, t / DUR); draw(u); lab.textContent = `t = ${fmt(u, 2)}`; if (u >= 1) return false; }, { autoplay: false, once: true, duration: DUR, initialT: DUR * 0.5, playLabel: T('Play from A to B', 'A から B へ再生') });
      L.legend(ctx.host, paths.map((p) => ({ c: p.c, label: p.label })));
      const d = qdot(qA, qB);
      ctx.readout([{ k: 'q_A · q_B', v: fmt(d, 3), tone: d < 0 ? 'warn' : undefined }, { k: T('slerp: total angle', 'slerp：総回転角'), v: `${fmt(stats[0].tot / DEG, 1)}°`, tone: 'key' }, { k: T('nlerp: peak ÷ average speed', 'nlerp：最大速度 ÷ 平均'), v: fmt(stats[1].max / stats[1].tot, 3) }, { k: T('Euler lerp: total angle', 'オイラー角補間：総回転角'), v: `${fmt(stats[2].tot / DEG, 1)}°`, tone: stats[2].tot > 1.2 * stats[0].tot ? 'warn' : undefined }],
        long ? T('q_B and −q_B are the same orientation. Interpolating to the one with a negative dot product goes the long way round, 360° − Ω, and nlerp nearly passes through zero, where its speed spikes. Always flip the sign so that q_A · q_B ≥ 0.', 'q_B と −q_B は同じ姿勢です。内積が負になる方へ補間すると 360° − Ω の遠回りになり、nlerp はほとんど 0 を通過して速さが跳ね上がります。q_A · q_B ≥ 0 となるよう必ず符号を反転させてください。')
          : T('slerp follows a great circle on the 3-sphere at constant speed, so the body turns about one fixed axis. nlerp follows the same arc but fastest in the middle. Interpolating the Euler angles of A and B turns through a longer, wandering path, and an angle that crosses ±180° runs the long way round.', 'slerp は 3 次元球面上の大円を一定の速さで進むので、物体は固定した一本の軸のまわりに回ります。nlerp は同じ弧をたどりますが、中央で最も速くなります。A と B のオイラー角を補間すると、より長く曲がりくねった経路を回り、±180° をまたぐ角度は遠回りします。'));
    },
  };

  /* ---------- 3. gimbal lock ---------- */
  function ringPts(u, w, r, n = 97) { return L.seq(n, (i) => { const s = L.TAU * i / (n - 1); return add3(scale3(u, r * Math.cos(s)), scale3(w, r * Math.sin(s))); }); }
  D['gimbal-lock'] = {
    render(ctx, v) {
      const yaw = v.yaw * DEG, pitch = v.pitch * DEG, roll = v.roll * DEG;
      const q = fromEuler(yaw, pitch, roll), Rm = toMatrix(q);
      const [az, ay, ax] = gimbalAxes(yaw, pitch);
      const bodyY = mv(Rm, [0, 1, 0]);
      const cam = camera(ctx.state, 0.55, 0.62);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Three nested gimbals: yaw about z, pitch about the carried y axis, roll about the body’s x axis. Drag to turn the view.', '入れ子の三つのジンバル：z 軸まわりのヨー、運ばれた y 軸まわりのピッチ、機体の x 軸まわりのロールです。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.65, 1.65], y: [-1.65, 1.65], equal: true, axes: false, maxH: 440 });
      orbit(f, ctx);
      const back = (c) => ({ c, w: 2, op: 0.35, dash: '3 3' });
      curve3(f, cam, ringPts(az, ay, 1.35), { c: 'c1', w: 5, op: 0.9 }, back('c1'));
      curve3(f, cam, ringPts(ay, ax, 1.15), { c: 'c3', w: 5, op: 0.9 }, back('c3'));
      curve3(f, cam, ringPts(ax, bodyY, 0.95), { c: 'c2', w: 5, op: 0.9 }, back('c2'));
      [[az, 1.5, 'c1', T('yaw', 'ヨー')], [ay, 1.45, 'c3', T('pitch', 'ピッチ')], [ax, 1.3, 'c2', T('roll', 'ロール')]].forEach(([a, len, c, s], i) => {
        f.line([cam.P(scale3(a, -len)), cam.P(scale3(a, len))], { c, w: 1.4, dash: '6 4', op: 0.85, layer: 'under' });
        const tip = cam.P(scale3(a, len)); f.text(tip[0], tip[1], s, { small: true, c, dx: 6, dy: i === 2 ? 14 : -6, anchor: 'start' });
      });
      // the aircraft: fuselage along body x, wings along body y, fin along body z
      const S = 0.62, V = { n: [1, 0, 0], t: [-0.6, 0, 0], l: [-0.3, -0.75, 0], r: [-0.3, 0.75, 0], f: [-0.55, 0, 0.38], m: [-0.2, 0, 0] };
      const W = Object.fromEntries(Object.entries(V).map(([k2, p]) => [k2, mv(Rm, scale3(p, S))]));
      const tris = [[W.n, W.l, W.t, 'ink'], [W.n, W.r, W.t, 'ink'], [W.t, W.f, W.m, 'hl']].map(([A, B, C, c]) => {
        const nn = unit3(cross(sub3(B, A), sub3(C, A)));
        return { pts: [A, B, C], z: cam.depth(scale3(add3(add3(A, B), C), 1 / 3)), sh: Math.abs(dot(nn, cam.N)), c };
      }).sort((a, b) => a.z - b.z);
      tris.forEach((t) => f.poly(t.pts.map(cam.P), { c: t.c, fo: t.c === 'hl' ? 0.85 : 0.2 + 0.35 * t.sh, w: 1.2, layer: 'over' }));
      const nose = cam.P(W.n); f.dot(nose[0], nose[1], { c: 'hl', r: 4, layer: 'over' });

      // right: how close the three axes are to losing a dimension
      L.h('p', 'lab-cap', c2, T('Smallest singular value of the map from Euler rates to angular velocity. Drag the point along the curve.', 'オイラー角の変化率から角速度への写像の最小特異値です。曲線上の点をドラッグしてください。'));
      const g = L.fig(c2, { x: [-90, 90], y: [0, 1.1], aspect: 0.72, maxH: 340, xlabel: T('pitch θ (degrees)', 'ピッチ θ（度）'), ticksX: [[-90, '−90'], [-45, '−45'], [0, '0'], [45, '45'], [90, '90']] });
      g.line(L.sample(-90, 90, 361, (p) => Math.cos(p * DEG)), { c: 'c4', w: 1.8, dash: '5 4' });
      g.line(L.sample(-90, 90, 721, (p) => sigmaMin(p * DEG)), { c: 'hl', w: 3.2 });
      const sm = sigmaMin(pitch);
      g.vline(v.pitch, { c: 'ink', w: 1, op: 0.45, dash: '3 3', layer: 'under' });
      g.handle(v.pitch, sm, { c: 'hl', label: T('Pitch angle', 'ピッチ角'), axis: 'x', bounds: [-90, 90, 0, 1.1], onDrag: (x) => { ctx.set('pitch', Math.round(x), true); ctx.redraw(); } });
      g.text(-86, 1.02, T('|det J| = cos θ', '|det J| = cos θ'), { small: true, c: 'c4', anchor: 'start' });
      g.text(-45, 0.22, 'σ_min = √(1 − |sin θ|)', { small: true, c: 'hl', anchor: 'middle' });
      L.legend(ctx.host, [{ c: 'c1', label: T('yaw gimbal and axis', 'ヨーのジンバルと軸') }, { c: 'c3', label: T('pitch gimbal and axis', 'ピッチのジンバルと軸') }, { c: 'c2', label: T('roll gimbal and axis', 'ロールのジンバルと軸') }, { c: 'hl', label: 'σ_min' }, { c: 'c4', dash: true, label: '|det J|' }]);
      const sep = Math.acos(clamp(Math.abs(dot(az, ax)), 0, 1)) / DEG;
      const locked = Math.abs(Math.abs(v.pitch) - 90) < 0.5;
      ctx.readout([{ k: T('angle between yaw and roll axes', 'ヨー軸とロール軸のなす角'), v: `${fmt(sep, 1)}°`, tone: locked ? 'warn' : 'key' }, { k: '|det J| = cos θ', v: fmt(Math.cos(pitch), 3) }, { k: T('Euler rate needed, worst direction', '最悪の方向に必要なオイラー角速度'), v: sm < 1e-6 ? '∞' : `${fmt(1 / sm, 2)} × |ω|`, tone: sm < 0.2 ? 'warn' : undefined }, { k: 'q', v: qstr(q), tone: 'good' }],
        locked ? T(`Gimbal lock: the roll axis now lies along the yaw axis, so yaw and roll turn the aircraft about the same line and only ${v.pitch > 0 ? 'yaw − roll' : 'yaw + roll'} matters. One direction of turning cannot be reached by any Euler rates. The quaternion is perfectly ordinary here.`, `ジンバルロックです。ロール軸がヨー軸と重なったので、ヨーとロールは機体を同じ直線のまわりに回し、効くのは ${v.pitch > 0 ? 'ヨー − ロール' : 'ヨー + ロール'} だけです。どんなオイラー角速度でも到達できない回転方向が一つあります。ここでも四元数はまったく普通の値です。`)
          : T('Push the pitch towards ±90°: the yaw and roll rings fold into one plane and the smallest singular value falls to zero. The quaternion components change smoothly throughout, because unit quaternions cover the rotations without a singular point.', 'ピッチを ±90° に近づけてください。ヨーとロールの輪が一つの平面に折りたたまれ、最小特異値が 0 に落ちます。四元数の成分は終始なめらかに変わります。単位四元数は特異点なしに回転全体を覆っているからです。'));
    },
  };
})();
