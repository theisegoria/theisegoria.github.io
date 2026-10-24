'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;

  /* ---------------- models (no DOM) ----------------
   * A three-joint arm: base yaw q1 about z, shoulder pitch q2 and elbow pitch q3 in the arm's vertical plane.
   * Shoulder at height D1; upper arm L2; forearm L3 (metres). q2 is measured up from horizontal, q3 relative to the upper arm. */
  const D1 = 0.5, L2 = 0.6, L3 = 0.5;
  function fk(q1, q2, q3, l2 = L2, l3 = L3, d1 = D1) {
    const r1 = l2 * Math.cos(q2), z1 = d1 + l2 * Math.sin(q2);
    const r = r1 + l3 * Math.cos(q2 + q3), z = z1 + l3 * Math.sin(q2 + q3);
    const c = Math.cos(q1), s = Math.sin(q1);
    return { base: [0, 0, 0], shoulder: [0, 0, d1], elbow: [r1 * c, r1 * s, z1], tool: [r * c, r * s, z], r, z };
  }
  // inverse kinematics; up = true for elbow up. Unreachable targets get the closest straight or folded arm.
  function ik(x, y, z, up = true, l2 = L2, l3 = L3, d1 = D1) {
    const q1 = Math.hypot(x, y) < 1e-12 ? 0 : Math.atan2(y, x);
    const r = Math.hypot(x, y), s = z - d1, dist = Math.hypot(r, s);
    const Dc = (r * r + s * s - l2 * l2 - l3 * l3) / (2 * l2 * l3);
    const reach = Dc <= 1 + 1e-12 && Dc >= -1 - 1e-12;
    const q3 = (up ? -1 : 1) * Math.acos(Math.max(-1, Math.min(1, Dc)));
    const q2 = Math.atan2(s, r) - Math.atan2(l3 * Math.sin(q3), l2 + l3 * Math.cos(q3));
    return { q1, q2, q3, reach, dist, Dc };
  }
  function jacobian(q1, q2, q3, l2 = L2, l3 = L3) {
    const r = l2 * Math.cos(q2) + l3 * Math.cos(q2 + q3), a = l2 * Math.sin(q2) + l3 * Math.sin(q2 + q3), b = l3 * Math.sin(q2 + q3);
    const c = Math.cos(q1), s = Math.sin(q1);
    return [
      [-r * s, -a * c, -b * c],
      [r * c, -a * s, -b * s],
      [0, r, l3 * Math.cos(q2 + q3)],
    ];
  }
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const mulT = (A) => A.map((ra) => A.map((rb) => ra[0] * rb[0] + ra[1] * rb[1] + ra[2] * rb[2]));   // A Aᵀ
  // eigen-decomposition of a symmetric 3x3 matrix by cyclic Jacobi rotations; returns values (descending) and unit column vectors
  function eigSym(S) {
    const a = S.map((r) => r.slice()), V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 50; sweep++) {
      const off = a[0][1] ** 2 + a[0][2] ** 2 + a[1][2] ** 2;
      if (off < 1e-30) break;
      for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(th), s = Math.sin(th);
        for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < 3; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
    return { values: idx.map((i) => a[i][i]), vectors: idx.map((i) => [V[0][i], V[1][i], V[2][i]]) };
  }
  function manip(q1, q2, q3) {
    const J = jacobian(q1, q2, q3), e = eigSym(mulT(J));
    const sv = e.values.map((x) => Math.sqrt(Math.max(0, x)));
    return { J, det: det3(J), sv, axes: e.vectors, w: sv[0] * sv[1] * sv[2], cond: sv[2] > 1e-12 ? sv[0] / sv[2] : Infinity };
  }
  // rest-to-rest cubic time scaling and paths
  const cubic = (t) => 3 * t * t - 2 * t * t * t;
  const PATHS = [
    { a: [0.75, -0.45, 0.55], b: [0.75, 0.45, 0.55] },     // across the front
    { a: [0.55, 0.12, 0.85], b: [-0.55, 0.12, 0.85] },      // over the top, close to the base axis
    { a: [0.95, 0.0, 0.25], b: [0.35, 0.1, 1.35] },         // a reach upward
  ];
  function wrapNear(q, ref) { while (q - ref > PI) q -= 2 * PI; while (q - ref < -PI) q += 2 * PI; return q; }
  function trajectory(k, mode, n = 200) {
    const { a, b } = PATHS[k];
    const qa = ik(...a, true), qb = ik(...b, true);
    const out = [];
    let prev = [qa.q1, qa.q2, qa.q3];
    for (let i = 0; i <= n; i++) {
      const s = cubic(i / n);
      let q;
      if (mode === 0) q = [qa.q1 + s * (wrapNear(qb.q1, qa.q1) - qa.q1), qa.q2 + s * (qb.q2 - qa.q2), qa.q3 + s * (qb.q3 - qa.q3)];
      else { const p = [0, 1, 2].map((j) => a[j] + s * (b[j] - a[j])); const r = ik(...p, true); q = [wrapNear(r.q1, prev[0]), r.q2, r.q3]; }
      prev = q;
      out.push({ t: i / n, q, p: fk(...q).tool });
    }
    for (let i = 0; i <= n; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1), dt = (i1 - i0) / n;
      out[i].qd = [0, 1, 2].map((j) => (out[i1].q[j] - out[i0].q[j]) / dt);
      out[i].speed = Math.hypot(...out[i].qd);
    }
    return out;
  }
  const pathLength = (tr) => tr.reduce((s, o, i) => (i ? s + Math.hypot(o.p[0] - tr[i - 1].p[0], o.p[1] - tr[i - 1].p[1], o.p[2] - tr[i - 1].p[2]) : 0), 0);
  // planar two-link helpers used by the questions and checks
  const planarFK = (l1, l2, t1, t2) => [l1 * Math.cos(t1) + l2 * Math.cos(t1 + t2), l1 * Math.sin(t1) + l2 * Math.sin(t1 + t2)];
  const planarDet = (l1, l2, t2) => l1 * l2 * Math.sin(t2);

  const M = { D1, L2, L3, fk, ik, jacobian, det3, eigSym, manip, cubic, PATHS, trajectory, pathLength, planarFK, planarDet };
  (window.LabModels = window.LabModels || {})['robot-kinematics'] = M;

  /* ---------------- shared scene pieces ---------------- */
  function frame(ctx, caps) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, caps[0]);
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, caps[1]);
    st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  // builds a stylised arm; returns set(q1, q2, q3) and set3(points)
  function buildArm(S, o = {}) {
    const opacity = o.opacity ?? 1, metal = { metal: 0.75, rough: 0.28, coat: 0.6, opacity };
    const g = new S.THREE.Group();
    const base = S.box([0.34, 0.34, 0.08], [0, 0, 0.04], { c: 'muted', ...metal, add: false });
    const post = new S.THREE.Mesh(new S.THREE.CylinderGeometry(0.07, 0.09, D1, 32), S.mat('ink', metal));
    post.rotation.x = PI / 2; post.position.z = D1 / 2;
    g.add(base, post);
    const j = [S.sphere([0, 0, D1], 0.075, { c: o.joint ?? 'c2', ...metal, add: false }), S.sphere([0, 0, 0], 0.062, { c: o.joint ?? 'c2', ...metal, add: false })];
    const link2 = S.tube([[0, 0, 0], [0, 0, 0.1]], { c: o.c ?? 'c1', r: 0.045, add: false, ...metal });
    const link3 = S.tube([[0, 0, 0], [0, 0, 0.1]], { c: o.c ?? 'c1', r: 0.036, add: false, ...metal });
    const finger1 = S.tube([[0, 0, 0], [0, 0, 0.1]], { c: 'ink', r: 0.012, add: false, ...metal });
    const finger2 = S.tube([[0, 0, 0], [0, 0, 0.1]], { c: 'ink', r: 0.012, add: false, ...metal });
    g.add(...j, link2, link3, finger1, finger2);
    S.add(g);
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
    const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
    g.setQ = (q1, q2, q3) => {
      const P = fk(q1, q2, q3);
      j[0].position.set(...P.shoulder); j[1].position.set(...P.elbow);
      link2.update([P.shoulder, P.elbow]); link3.update([P.elbow, P.tool]);
      const dir = norm(sub(P.tool, P.elbow)), side = norm([-Math.sin(q1), Math.cos(q1), 0]);
      const root = add(P.tool, dir, -0.01);
      finger1.update([add(root, side, 0.035), add(add(root, side, 0.03), dir, 0.07)]);
      finger2.update([add(root, side, -0.035), add(add(root, side, -0.03), dir, 0.07)]);
      S.invalidate();
      return P;
    };
    return g;
  }
  // a frame triad (x c2, y c3, z c1) at p with axes columns R
  function triad(S, size = 0.12) {
    const ax = [S.arrow([0, 0, 0], [size, 0, 0], { c: 'c2', r: 0.008 }), S.arrow([0, 0, 0], [0, size, 0], { c: 'c3', r: 0.008 }), S.arrow([0, 0, 0], [0, 0, size], { c: 'c4', r: 0.008 })];
    return { set(p, R) { ax.forEach((a, i) => a.set(p, [R[0][i] * size, R[1][i] * size, R[2][i] * size])); }, show(v) { ax.forEach((a) => { a.visible = v; }); } };
  }
  // joint frames of the arm (z along each joint axis)
  function frames(q1, q2, q3) {
    const c = Math.cos(q1), s = Math.sin(q1), P = fk(q1, q2, q3);
    const radial = (a) => [Math.cos(a) * c, Math.cos(a) * s, Math.sin(a)];
    const yaw = [-s, c, 0];
    const F = (p, xa, za) => { const ya = [za[1] * xa[2] - za[2] * xa[1], za[2] * xa[0] - za[0] * xa[2], za[0] * xa[1] - za[1] * xa[0]]; return { p, R: [[xa[0], ya[0], za[0]], [xa[1], ya[1], za[1]], [xa[2], ya[2], za[2]]] }; };
    return [F([0, 0, 0.09], [c, s, 0], [0, 0, 1]), F(P.shoulder, radial(q2), yaw), F(P.elbow, radial(q2 + q3), yaw), F(P.tool, radial(q2 + q3), yaw)];
  }
  // 2D side view of the arm in its own vertical plane (r, z)
  function sideView(host, q2, q3, o = {}) {
    const f = L.fig(host, { x: [-0.35, 1.25], y: [-0.1, 1.55], equal: true, maxH: 340, xlabel: T('distance from the base axis r (m)', '基部の軸からの距離 r（m）'), ylabel: 'z (m)' });
    const P = fk(0, q2, q3);
    f.rect(-0.12, -0.1, 0.24, 0.1, { c: 'muted', fill: true, fo: 0.25 });
    f.seg([0, 0], [0, D1], { c: 'ink', w: 6 });
    f.seg([0, D1], [P.elbow[0], P.elbow[2]], { c: 'c1', w: 7 });
    f.seg([P.elbow[0], P.elbow[2]], [P.r, P.z], { c: 'c1', w: 5.5 });
    f.dot(0, D1, { c: 'c2', r: 6 }); f.dot(P.elbow[0], P.elbow[2], { c: 'c2', r: 5.5 });
    f.dot(P.r, P.z, { c: 'ink', r: 3.5 });
    return f;
  }

  /* ---------------- 1. reaching a point ---------------- */
  D['arm-ik'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('Drag the gold target across the floor plane; its height is the z slider. The faint shells bound what the arm can reach; the ghost is the other elbow solution.', '金色の目標を床に平行な面でドラッグしてください。高さは z のスライダーです。淡い殻は腕が届く範囲の境界で、半透明の腕はもう一方の肘の解です。'), T('The arm’s own vertical plane. The elbow must lie on both circles: radius L₂ round the shoulder and L₃ round the target, so there are two solutions, one, or none.', '腕自身の鉛直面。肘は二つの円、すなわち肩を中心とする半径 L₂ の円と目標を中心とする半径 L₃ の円の両方の上になければならないので、解は二つ、一つ、またはありません。')]);
      const up = Math.round(v.elbow ?? 0) === 0, showF = Math.round(v.frames ?? 0) === 1;
      const s = ik(v.x, v.y, v.z, up), o = ik(v.x, v.y, v.z, !up);
      const P = fk(s.q1, s.q2, s.q3);
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const tr = Math.hypot(v.x, v.y), tz = v.z;
        const f = sideView(st.g2, s.q2, s.q3);
        f.circle(0, D1, L2, { c: 'c3', w: 1.2, dash: '4 4', fill: false });
        f.circle(tr, tz, L3, { c: 'c4', w: 1.2, dash: '4 4', fill: false });
        if (s.reach) { const Po = fk(0, o.q2, o.q3); f.seg([0, D1], [Po.elbow[0], Po.elbow[2]], { c: 'c1', w: 2, op: 0.35 }); f.seg([Po.elbow[0], Po.elbow[2]], [Po.r, Po.z], { c: 'c1', w: 2, op: 0.35 }); }
        f.handle(tr, tz, { c: 'hl', label: T('target', '目標'), bounds: [0, 1.2, -0.05, 1.5], onDrag: (rr, zz) => { const a = Math.atan2(v.y, v.x) || 0; ctx.set('x', rr * Math.cos(a), true); ctx.set('y', rr * Math.sin(a), true); ctx.set('z', zz); } });
        L.legend(st.leg, [{ c: 'c1', label: T('the arm (and, faint, the other elbow solution)', '腕（淡い線はもう一方の肘の解）') }, { c: 'c3', dash: true, label: T('reach of the upper arm from the shoulder', '肩からの上腕の届く範囲') }, { c: 'c4', dash: true, label: T('reach of the forearm back from the target', '目標から逆にたどる前腕の届く範囲') }, { kind: 'dot', c: 'hl', label: T('target', '目標') }]);
        ctx.readout([
          { k: 'q₁', v: fmt(deg(s.q1), 1) + '°', tone: 'key' }, { k: 'q₂', v: fmt(deg(s.q2), 1) + '°', tone: 'key' }, { k: 'q₃', v: fmt(deg(s.q3), 1) + '°', tone: 'key' },
          { k: T('distance shoulder to target', '肩から目標までの距離'), v: fmt(s.dist, 3) + ' m' },
          { k: T('reachable', '到達可能'), v: s.reach ? T('yes', 'はい') : T('no', 'いいえ'), tone: s.reach ? 'good' : 'warn' },
        ], s.reach ? T(`cos q₃ = (d² − L₂² − L₃²)/(2L₂L₃) = ${fmt(s.Dc, 3)}. The two solutions share q₁ and differ in the sign of q₃.`, `cos q₃ = (d² − L₂² − L₃²)/(2L₂L₃) = ${fmt(s.Dc, 3)}。二つの解は q₁ が共通で、q₃ の符号が異なります。`)
          : T(`The target is ${s.dist > L2 + L3 ? 'beyond the outer shell' : 'inside the inner shell'}: |cos q₃| would have to exceed 1, so no angles reach it. The arm points as close as it can.`, `目標は${s.dist > L2 + L3 ? '外側の殻の外' : '内側の殻の内'}にあります。|cos q₃| が 1 を超えてしまうので、どの角でも届きません。腕はできるだけ近くを指しています。`));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 480, camera: [2.6, -2.5, 1.9], target: [0.15, 0, 0.55], fov: 34,
        init(S) {
          st.flat = false;
          S.floor({ size: 1.4, n: 14, z: 0 });
          const sh = [0, 0, D1];
          S.surface((u, w) => [sh[0] + (L2 + L3) * Math.sin(u) * Math.cos(w), sh[1] + (L2 + L3) * Math.sin(u) * Math.sin(w), sh[2] + (L2 + L3) * Math.cos(u)], { u: [0, PI], v: [0, 2 * PI], nu: 40, nv: 72, c: 'c3', opacity: 0.07, wire: true, wireEvery: 5, wireEveryV: 6, wireOpacity: 0.1 });
          S.surface((u, w) => [sh[0] + (L2 - L3) * Math.sin(u) * Math.cos(w), sh[1] + (L2 - L3) * Math.sin(u) * Math.sin(w), sh[2] + (L2 - L3) * Math.cos(u)], { u: [0, PI], v: [0, 2 * PI], nu: 20, nv: 36, c: 'c2', opacity: 0.12 });
          st.ghost = buildArm(S, { opacity: 0.22, joint: 'muted' });
          st.arm = buildArm(S);
          st.drop = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'hl', opacity: 0.6 });
          st.reachLine = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c2', opacity: 0.0 });
          st.target = S.handle([v.x, v.y, v.z], { plane: [[0, 0, 1], [0, 0, v.z]], bounds: [-1.15, 1.15, -1.15, 1.15], r: 0.045, onDrag: (q) => { ctx.set('x', q.x, true); ctx.set('y', q.y); return [q.x, q.y, st.z]; } });
          st.tr = [0, 1, 2, 3].map(() => triad(S));
        },
        update(S) {
          st.z = v.z;
          st.target.userData.handle.plane = [[0, 0, 1], [0, 0, v.z]];
          st.target.at([v.x, v.y, v.z]);
          st.arm.setQ(s.q1, s.q2, s.q3);
          st.ghost.visible = s.reach; if (s.reach) st.ghost.setQ(o.q1, o.q2, o.q3);
          st.drop.update([[[v.x, v.y, 0], [v.x, v.y, v.z]]]);
          st.reachLine.material.opacity = s.reach ? 0 : 0.8;
          st.reachLine.update([[P.tool, [v.x, v.y, v.z]]]);
          const Fr = frames(s.q1, s.q2, s.q3);
          st.tr.forEach((t, i) => { t.show(showF); if (showF) t.set(Fr[i].p, Fr[i].R); });
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the side view on the right carries the whole construction.', 'このブラウザでは 3D 表示ができません。右の側面図に作図のすべてがあります。')); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 2. the Jacobian and its ellipsoid ---------------- */
  D.manipulability = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The ellipsoid at the gripper is every tool velocity reachable with joint speeds of length at most 1 rad/s (or, switched, the forces it can resist with unit joint torques). Its axes are the singular directions of the Jacobian.', 'グリッパーの楕円体は、関節速度の大きさを 1 rad/s 以下にしたとき実現できる工具の速度の全体です（切り替えると、単位の関節トルクで支えられる力）。軸はヤコビ行列の特異方向です。'), T('|det J| over the shoulder and elbow angles for this base angle. The pale curves are singular: the elbow straight or folded, or the tool over the base axis. Drag the point.', 'この基部の角での肩と肘の角に対する |det J|。淡い曲線が特異配置で、肘が伸びきるか折りたたまれるか、工具が基部の軸の真上にあるときです。点をドラッグしてください。')]);
      const q1 = rad(v.q1), q2 = rad(v.q2), q3 = rad(v.q3), force = Math.round(v.ell ?? 0) === 1;
      const m = manip(q1, q2, q3), P = fk(q1, q2, q3);
      const lens = m.sv.map((x) => (force ? Math.min(2.5, 1 / Math.max(x, 1e-3)) : x));
      const vis = force ? 0.08 : 0.32;
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const g = L.fig(st.g2, { x: [-30, 150], y: [-170, 170], aspect: 0.82, maxH: 330, xlabel: T('shoulder q₂ (°)', '肩 q₂（°）'), ylabel: T('elbow q₃ (°)', '肘 q₃（°）') });
        g.raster((x, y) => Math.min(1, Math.abs(manip(0, rad(x), rad(y)).det) / 0.22), { cmap: 'seq', res: 4 });
        g.hline(0, { c: 'ink', w: 1, dash: '3 3', op: 0.6 });
        g.handle(v.q2, v.q3, { c: 'hl', label: T('this configuration', 'この配置'), onDrag: (x, y) => { ctx.set('q2', x, true); ctx.set('q3', y); } });
        L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('|det J|: volume of the velocity ellipsoid ÷ (4π/3)', '|det J|：速度楕円体の体積 ÷ (4π/3)') }, { c: 'ink', dash: true, label: T('q₃ = 0: arm straight, singular', 'q₃ = 0：腕がまっすぐで特異') }, { c: 'c2', label: T('principal axes of the ellipsoid', '楕円体の主軸') }]);
        ctx.readout([
          { k: 'det J', v: fmt(m.det, 4), tone: 'key' },
          { k: T('σ₁, σ₂, σ₃ (m/s per rad/s)', 'σ₁, σ₂, σ₃（m/s / rad/s）'), v: m.sv.map((x) => fmt(x, 3)).join(', ') },
          { k: T('condition number σ₁/σ₃', '条件数 σ₁/σ₃'), v: Number.isFinite(m.cond) && m.cond < 1e4 ? fmt(m.cond, 1) : '∞', tone: m.cond > 20 ? 'warn' : undefined },
          { k: T('tool position', '工具の位置'), v: P.tool.map((x) => fmt(x, 2)).join(', ') },
        ], Math.abs(m.det) < 0.01 ? T('Near a singularity one axis of the ellipsoid collapses: there is a direction the tool cannot move in at all, and holding a force along it costs no torque.', '特異配置の近くでは楕円体の軸の一つがつぶれます。工具がまったく動けない方向があり、その方向の力はトルクなしで支えられます。')
          : T(force ? 'The force ellipsoid is the velocity ellipsoid turned inside out: the arm pushes hardest exactly where it moves slowest.' : 'Long axes are directions the tool moves quickly for little joint motion; short axes are directions that need large joint speeds.', force ? '力の楕円体は速度の楕円体を裏返したもので、腕は動きが遅い方向ほど強く押せます。' : '長い軸は小さな関節の動きで工具が速く動く方向、短い軸は大きな関節速度を必要とする方向です。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 480, camera: [2.4, -2.6, 1.8], target: [0.2, 0, 0.6], fov: 34,
        init(S) {
          st.flat = false;
          S.floor({ size: 1.4, n: 14, z: 0 });
          st.arm = buildArm(S);
          st.ell = new S.THREE.Mesh(new S.THREE.SphereGeometry(1, 48, 32), S.mat('c3', { opacity: 0.35, rough: 0.3, coat: 0.8 }));
          st.ell.matrixAutoUpdate = false; S.add(st.ell);
          st.ax = [0, 1, 2].map(() => S.arrow([0, 0, 0], [0.1, 0, 0], { c: 'c2', r: 0.01 }));
          st.lab = S.label('', [0, 0, 0], { small: true });
        },
        update(S) {
          st.arm.setQ(q1, q2, q3);
          const p = P.tool, A = m.axes;
          const Mx = new S.THREE.Matrix4().set(
            A[0][0] * lens[0] * vis, A[1][0] * lens[1] * vis, A[2][0] * lens[2] * vis, p[0],
            A[0][1] * lens[0] * vis, A[1][1] * lens[1] * vis, A[2][1] * lens[2] * vis, p[1],
            A[0][2] * lens[0] * vis, A[1][2] * lens[1] * vis, A[2][2] * lens[2] * vis, p[2],
            0, 0, 0, 1);
          st.ell.matrix.copy(Mx); st.ell.matrixWorldNeedsUpdate = true;
          st.ell.material.color.copy(S.colour(force ? 'c4' : 'c3'));
          st.ax.forEach((a, i) => a.set(p, A[i].map((x) => x * Math.max(0.012, lens[i] * vis))));
          st.lab.set([p[0], p[1], p[2] + Math.max(0.08, lens[0] * vis * 0.6)], force ? T('force ellipsoid', '力の楕円体') : T('velocity ellipsoid', '速度の楕円体'));
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Side view of the arm (3D graphics are not available here).', '腕の側面図（ここでは 3D 表示を使えません）。')); sideView(st.v3, q2, q3); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. joint-space versus straight-line motion ---------------- */
  D['arm-trajectory'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('Two ways to go from A to B in the same time: interpolate the joint angles (the tool swings along a curve) or interpolate the tool position (a straight line, solved by inverse kinematics at every instant).', 'A から B へ同じ時間で動く二つの方法。関節角を補間する（工具は曲線を描く）か、工具の位置を補間する（直線で、各瞬間に逆運動学を解く）か。'), T('Joint speed |q̇| along the motion for both plans. A straight line that passes close to the base axis demands a burst of base rotation.', '両方の計画での関節速度 |q̇|。基部の軸の近くを通る直線は、基部の急な回転を要求します。')]);
      const k = Math.round(v.path ?? 0), mode = Math.round(v.mode ?? 1);
      const key = `${k}`;
      if (st.key !== key) { st.key = key; st.trJ = trajectory(k, 0); st.trC = trajectory(k, 1); }
      const trJ = st.trJ, trC = st.trC, cur = mode === 0 ? trJ : trC;
      const peakJ = Math.max(...trJ.map((o) => o.speed)), peakC = Math.max(...trC.map((o) => o.speed));
      const at = (tt) => cur[Math.min(cur.length - 1, Math.max(0, Math.round(tt * (cur.length - 1))))];
      const draw2d = () => {
        if (!st.g || !st.g.svg.isConnected || st.g.key !== key + mode) {
          st.g2.replaceChildren(); st.leg.replaceChildren();
          const top = Math.min(30, Math.max(peakJ, peakC) * 1.1);
          st.g = L.fig(st.g2, { x: [0, 1], y: [0, top], aspect: 0.66, maxH: 320, xlabel: T('time (fraction of the move)', '時間（動作全体に対する割合）'), ylabel: T('|q̇| (rad per unit time)', '|q̇|（rad / 単位時間）') });
          st.g.key = key + mode; st.top = top;
          st.g.line(trJ.map((o) => [o.t, Math.min(top, o.speed)]), { c: 'c2', w: mode === 0 ? 2.6 : 1.4, op: mode === 0 ? 1 : 0.55 });
          st.g.line(trC.map((o) => [o.t, Math.min(top, o.speed)]), { c: 'c1', w: mode === 1 ? 2.6 : 1.4, op: mode === 1 ? 1 : 0.55 });
          L.legend(st.leg, [{ c: 'c2', label: T('joint-space plan: tool path curves', '関節空間の計画：工具の経路は曲線') }, { c: 'c1', label: T('straight-line plan: inverse kinematics at each instant', '直線の計画：各瞬間に逆運動学') }, { kind: 'dot', c: 'hl', label: 'A, B' }]);
          ctx.readout([
            { k: T('tool path, joint plan', '工具の経路（関節計画）'), v: fmt(pathLength(trJ), 3) + ' m' },
            { k: T('tool path, straight plan', '工具の経路（直線計画）'), v: fmt(pathLength(trC), 3) + ' m' },
            { k: T('peak |q̇|, joint plan', '最大 |q̇|（関節計画）'), v: fmt(peakJ, 2), tone: mode === 0 ? 'key' : undefined },
            { k: T('peak |q̇|, straight plan', '最大 |q̇|（直線計画）'), v: fmt(peakC, 2), tone: peakC > 3 * peakJ ? 'warn' : mode === 1 ? 'key' : undefined },
          ], peakC > 3 * peakJ ? T('The straight line passes close to the base axis, where the base must swing through a large angle in a moment: the Jacobian is nearly singular there.', '直線は基部の軸の近くを通り、そこでは基部が一瞬で大きな角度を回らなければなりません。ヤコビ行列がほぼ特異だからです。')
            : T('Both plans start and stop at rest (cubic time scaling). The joint plan is smooth in the joints and curved in space; the straight plan is the reverse.', '二つの計画とも静止から始まり静止で終わります（三次の時間スケーリング）。関節計画は関節では滑らかで空間では曲がり、直線計画はその逆です。'));
        }
        st.g.clear('over');
        const t = st.tt ?? 1;
        st.g.vline(t, { c: 'hl', w: 1.4, layer: 'over' });
        st.g.dot(t, Math.min(st.top, at(t).speed), { c: mode === 0 ? 'c2' : 'c1', r: 4.5, layer: 'over' });
      };
      const drawAt = (tt) => {
        st.tt = tt;
        const o = at(tt);
        if (!st.flat && st.arm) { st.arm.setQ(...o.q); st.tool.at(o.p); st.S?.invalidate(); }
        if (st.flat && st.fside) { st.fside.replaceChildren(); sideView(st.fside, o.q[1], o.q[2]); }
        draw2d();
      };
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => { const u = (t % 3.2) / 2.6; drawAt(Math.min(1, u)); }, { initialT: 2.6, playLabel: T('Play the move', '動作を再生') });
      }
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 480, camera: [2.3, -2.6, 2.2], target: [0.1, 0, 0.6], fov: 34,
        init(S) {
          st.flat = false; st.S = S;
          S.floor({ size: 1.4, n: 14, z: 0 });
          st.pathJ = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c2', r: 0.012 });
          st.pathC = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.012 });
          st.A = S.sphere([0, 0, 0], 0.035, { c: 'hl' }); st.B = S.sphere([0, 0, 0], 0.035, { c: 'hl' });
          st.la = S.label('A', [0, 0, 0], { math: true }); st.lb = S.label('B', [0, 0, 0], { math: true });
          S.lines([[[0, 0, 0], [0, 0, 1.45]]], { c: 'muted', opacity: 0.5 });
          S.label(T('base axis', '基部の軸'), [0, 0, 1.4], { small: true });
          st.arm = buildArm(S);
          st.tool = S.sphere([0, 0, 0], 0.025, { c: 'ink' });
        },
        update(S) {
          st.pathJ.update(trJ.map((o) => o.p)); st.pathC.update(trC.map((o) => o.p));
          const { a, b } = PATHS[k];
          st.A.at(a); st.B.at(b); st.la.set(a); st.lb.set(b);
          drawAt(st.tt ?? 1);
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Side view of the moving arm (3D graphics are not available here).', '動く腕の側面図（ここでは 3D 表示を使えません）。')); st.fside = L.h('div', '', st.v3); drawAt(st.tt ?? 1); },
      });
      st.anim?.redraw();
    },
  };
})();
