'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * Math.PI, DEG = 180 / Math.PI;

  /* ---------- model (pure, checked by checks/rigid-body-dynamics.cjs) ---------- */
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const n = norm(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qrot = (q, v) => { const p = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; };
  // principal moments of a uniform box of unit mass with side lengths a, b, c along the body axes
  const boxInertia = (a, b, c) => [(b * b + c * c) / 12, (a * a + c * c) / 12, (a * a + b * b) / 12];
  // Euler's equations for a torque-free body, plus the attitude q' = q (0, w) / 2 (w in the body frame)
  function freeRHS(I, s) {
    const w = [s[0], s[1], s[2]], q = [s[3], s[4], s[5], s[6]], dq = qmul(q, [0, w[0], w[1], w[2]]);
    return [(I[1] - I[2]) * w[1] * w[2] / I[0], (I[2] - I[0]) * w[2] * w[0] / I[1], (I[0] - I[1]) * w[0] * w[1] / I[2], dq[0] / 2, dq[1] / 2, dq[2] / 2, dq[3] / 2];
  }
  function integrateFree(I, w0, tMax, h = 0.004, every = 5) {
    let s = [w0[0], w0[1], w0[2], 1, 0, 0, 0];
    const n = Math.ceil(tMax / h), out = [];
    const ad = (u, k, c) => u.map((x, i) => x + c * k[i]);
    for (let i = 0; i <= n; i++) {
      if (i % every === 0 || i === n) out.push({ t: i * h, w: [s[0], s[1], s[2]], q: [s[3], s[4], s[5], s[6]] });
      if (i === n) break;
      const k1 = freeRHS(I, s), k2 = freeRHS(I, ad(s, k1, h / 2)), k3 = freeRHS(I, ad(s, k2, h / 2)), k4 = freeRHS(I, ad(s, k3, h));
      s = s.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      const qn = Math.hypot(s[3], s[4], s[5], s[6]); for (let j = 3; j < 7; j++) s[j] /= qn;
    }
    return out;
  }
  const energy = (I, w) => (I[0] * w[0] * w[0] + I[1] * w[1] * w[1] + I[2] * w[2] * w[2]) / 2;
  const Lbody = (I, w) => [I[0] * w[0], I[1] * w[1], I[2] * w[2]];
  const Lspace = (I, sample) => qrot(sample.q, Lbody(I, sample.w));
  // linearised motion near a principal axis spinning at rate w0: wobble frequency (stable) or growth rate (unstable)
  const wobble = (I, j, w0) => { const [a, b] = [0, 1, 2].filter((k) => k !== j); const x = (I[a] - I[j]) * (I[b] - I[j]) / (I[a] * I[b]); return { stable: x > 0, rate: Math.abs(w0) * Math.sqrt(Math.abs(x)) }; };
  // separatrix on the unit angular-momentum sphere: planes L3 = +-k L1 through the middle axis
  const sepSlope = (I) => Math.sqrt((1 / I[0] - 1 / I[1]) / (1 / I[1] - 1 / I[2]));
  // a closed polhode through the unit vector L0 (body frame): dL/dt = L x (L / I)
  function polhode(I, L0, h = 0.01, maxSteps = 6000) {
    let Lb = L0.slice(); const pts = [Lb.slice()]; let far = false;
    const f = (u) => cross(u, [u[0] / I[0], u[1] / I[1], u[2] / I[2]]);
    for (let i = 0; i < maxSteps; i++) {
      const k1 = f(Lb), k2 = f(Lb.map((x, j) => x + h / 2 * k1[j])), k3 = f(Lb.map((x, j) => x + h / 2 * k2[j])), k4 = f(Lb.map((x, j) => x + h * k3[j]));
      Lb = Lb.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); pts.push(Lb.slice());
      const d = norm(Lb.map((x, j) => x - L0[j]));
      if (d > 0.05) far = true; else if (far && d < 0.02) { pts.push(L0.slice()); break; }
    }
    return pts;
  }

  // heavy symmetric top on a fixed pivot: tilt th from the upward vertical, precession ph, spin ps
  // conserved: w3 = ps' + ph' cos th, and p_ph = I1 ph' sin^2 th + I3 w3 cos th
  const steadyRate = (P, th) => { const b = P.I3 * P.w3, disc = b * b - 4 * P.I1 * P.mgl * Math.cos(th); return disc < 0 ? null : 2 * P.mgl / (b + Math.sqrt(disc)); };
  function topRun(P, tMax, h = 0.002, every = 4) {
    const th0 = P.th0, st = steadyRate(P, th0);
    const phd0 = P.mode === 0 || st === null ? 0 : P.mode === 1 ? st : -st;
    const pph = P.I1 * phd0 * Math.sin(th0) ** 2 + P.I3 * P.w3 * Math.cos(th0);
    const phd = (th) => (pph - P.I3 * P.w3 * Math.cos(th)) / (P.I1 * Math.sin(th) ** 2);
    const rhs = (s) => { const w = phd(s[0]), sn = Math.sin(s[0]), cs = Math.cos(s[0]); return [s[1], w * w * sn * cs - P.I3 * P.w3 / P.I1 * w * sn + P.mgl / P.I1 * sn, w, P.w3 - w * cs]; };
    let s = [th0, 0, 0, 0];
    const n = Math.ceil(tMax / h), out = [];
    const ad = (u, k, c) => u.map((x, i) => x + c * k[i]);
    for (let i = 0; i <= n; i++) {
      if (i % every === 0 || i === n) out.push({ t: i * h, th: s[0], thd: s[1], ph: s[2], ps: s[3], phd: phd(s[0]) });
      if (i === n) break;
      const k1 = rhs(s), k2 = rhs(ad(s, k1, h / 2)), k3 = rhs(ad(s, k2, h / 2)), k4 = rhs(ad(s, k3, h));
      s = s.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    }
    return { samples: out, pph, steady: st, phd0 };
  }
  const topEnergy = (P, s) => P.I1 / 2 * (s.thd * s.thd + s.phd * s.phd * Math.sin(s.th) ** 2) + P.mgl * Math.cos(s.th);

  // planar masses: the in-plane inertia tensor about a reference point, and the moment about an axis at angle a
  function inertia2(ms, ref) {
    let xx = 0, yy = 0, xy = 0;
    ms.forEach(([x, y, m]) => { const dx = x - ref[0], dy = y - ref[1]; xx += m * dy * dy; yy += m * dx * dx; xy -= m * dx * dy; });
    return { xx, yy, xy, zz: xx + yy };
  }
  const momentAbout = (ms, ref, a) => ms.reduce((s, [x, y, m]) => { const r = (x - ref[0]) * Math.sin(a) - (y - ref[1]) * Math.cos(a); return s + m * r * r; }, 0);
  const momentFromTensor = (I, a) => I.xx * Math.cos(a) ** 2 + I.yy * Math.sin(a) ** 2 + 2 * I.xy * Math.sin(a) * Math.cos(a);
  function principal(I) {
    const m = (I.xx + I.yy) / 2, r = Math.hypot((I.xx - I.yy) / 2, I.xy), a = Math.atan2(2 * I.xy, I.xx - I.yy) / 2;
    return { Imax: m + r, Imin: m - r, aMax: a, aMin: a + PI / 2 };
  }
  const centreOfMass = (ms) => { const M = ms.reduce((s, x) => s + x[2], 0); return [ms.reduce((s, x) => s + x[0] * x[2], 0) / M, ms.reduce((s, x) => s + x[1] * x[2], 0) / M, M]; };
  (window.LabModels = window.LabModels || {})['rigid-body-dynamics'] = { qrot, boxInertia, integrateFree, energy, Lbody, Lspace, wobble, sepSlope, polhode, steadyRate, topRun, topEnergy, inertia2, momentAbout, momentFromTensor, principal, centreOfMass };

  /* ---------- a small orbiting 3D camera over an SVG figure ---------- */
  function camera(st, key, a0, e0) {
    st[key] ||= { a: a0, e: e0 };
    const { a, e } = st[key];
    const R = [-Math.sin(a), Math.cos(a), 0], U = [-Math.cos(a) * Math.sin(e), -Math.sin(a) * Math.sin(e), Math.cos(e)], N = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
    return { P: (p) => [dot(p, R), dot(p, U)], depth: (p) => dot(p, N), N };
  }
  function orbit(f, ctx, key, after) {
    f.svg.style.cursor = 'grab'; f.svg.style.touchAction = 'none';
    f.svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.lab-handle')) return;
      ev.preventDefault();
      const x0 = ev.clientX, y0 = ev.clientY, v0 = { ...ctx.state[key] };
      const move = (m) => { ctx.state[key] = { a: v0.a - (m.clientX - x0) * 0.01, e: L.clamp(v0.e + (m.clientY - y0) * 0.01, -1.4, 1.4) }; if (after) after(); else ctx.redraw(); };
      const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    });
  }
  function curve3(f, cam, pts, o, oBack) {
    let run = [], front = null;
    const flush = () => { if (run.length > 1) f.line(run, front ? o : (oBack || o)); };
    pts.forEach((p) => { const fr = cam.depth(p) >= 0; if (front !== null && fr !== front) { const last = run[run.length - 1]; flush(); run = [last]; } front = fr; run.push(cam.P(p)); });
    flush();
  }
  function sphere(f, cam) {
    const back = { c: 'muted', w: 0.7, dash: '2 4', op: 0.4, layer: 'under' };
    for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = Math.sin(la), rr = Math.cos(la); curve3(f, cam, L.seq(97, (i) => { const q = TAU * i / 96; return [rr * Math.cos(q), rr * Math.sin(q), z]; }), { c: 'muted', w: 0.8, op: 0.45, layer: 'under' }, back); }
    for (let k = 0; k < 6; k++) { const lo = k * PI / 6; curve3(f, cam, L.seq(97, (i) => { const q = TAU * i / 96; return [Math.cos(q) * Math.cos(lo), Math.cos(q) * Math.sin(lo), Math.sin(q)]; }), { c: 'muted', w: 0.8, op: 0.4, layer: 'under' }, back); }
    f.circle(0, 0, 1, { c: 'ink', w: 1.2, op: 0.5, layer: 'under' });
  }

  /* ---------- 1. the tennis-racket theorem ---------- */
  const DIMS = [3, 2, 0.6], IBOX = boxInertia(...DIMS);
  function drawBox(f, cam, q, s = 0.5, layer = 'main') {
    const h = DIMS.map((x) => x * s / 2);
    const corners = [-1, 1].flatMap((i) => [-1, 1].flatMap((j) => [-1, 1].map((k) => [i, j, k])));
    const P = (c) => qrot(q, [c[0] * h[0], c[1] * h[1], c[2] * h[2]]);
    const faces = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]].map(([ax, sg]) => {
      const cs = corners.filter((c) => c[ax] === sg), o = [cs[0], cs[1], cs[3], cs[2]].map(P);
      const nn = qrot(q, [ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0]);
      return { o, vis: dot(nn, cam.N), ax, sg };
    }).filter((x) => x.vis > 0).sort((a, b) => a.vis - b.vis);
    const colOf = (x) => (x.ax === 1 ? 'c2' : x.ax === 2 ? (x.sg > 0 ? 'c1' : 'c3') : 'ink');
    faces.forEach((x) => f.poly(x.o.map(cam.P), { c: colOf(x), fo: x.ax === 0 ? 0.12 + 0.25 * x.vis : 0.35 + 0.5 * x.vis, w: 1.2, layer }));
  }
  D['tennis-racket'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, j = Math.round(v.axis), key = `${j}|${v.eps}|${v.time}`;
      if (st.key !== key) {
        const w0 = [v.eps, v.eps, v.eps]; w0[j] = 1;
        st.run = integrateFree(IBOX, w0, v.time); st.key = key;
        const cr = []; for (let i = 1; i < st.run.length; i++) if (Math.sign(st.run[i].w[j]) !== Math.sign(st.run[i - 1].w[j])) cr.push(st.run[i].t);
        st.cross = cr;
      }
      const run = st.run, wb = wobble(IBOX, j, 1);
      const tStar = st.cross.length ? st.cross[0] : v.time * 0.3;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The body in space. The orange faces are the ends of the middle axis; the angular momentum L never moves. Drag to turn the view.', '空間の中の物体。橙の面は中間の軸の両端です。角運動量 L は動きません。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, axes: false, grid: false, maxH: 380 });
      L.h('p', 'lab-cap', c2, T('Angular momentum seen from the body: it slides along the polhodes, the curves where the energy ellipsoid meets the sphere', '物体から見た角運動量：エネルギー楕円体と球面の交線であるポールホードに沿って動きます'));
      const g = L.fig(c2, { x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, grid: false, maxH: 380 });
      L.h('p', 'lab-cap', ctx.host, T('Body-frame angular velocity ω₁, ω₂, ω₃ against time', '物体座標での角速度 ω₁, ω₂, ω₃ と時間'));
      const s = L.fig(ctx.host, { x: [0, v.time], y: [-1.2, 1.2], aspect: 0.26, minH: 170, maxH: 230, xlabel: T('time t', '時間 t'), ticksY: [[-1, '−1'], [0, '0'], [1, '1']] });
      ['c1', 'c2', 'c3'].forEach((c, k) => s.line(run.map((x) => [x.t, x.w[k]]), { c, w: k === j ? 2.4 : 1.6, op: 0.9, layer: 'under' }));
      // the static parts of the sphere view
      const drawSphere = () => {
        g.clear('under'); g.clear('main');
        const cam = camera(st, 'v2', 0.75, 0.45);
        sphere(g, cam);
        [[[1, 0, 0], '1', 'c1'], [[0, 1, 0], '2', 'c2'], [[0, 0, 1], '3', 'c3']].forEach(([p, lab, c]) => { [1, -1].forEach((sg) => { const a = p.map((x) => x * sg), tip = p.map((x) => x * sg * 1.22), vis = cam.depth(a) >= 0; g.line([cam.P(a), cam.P(tip)], { c, w: 2.4, op: vis ? 1 : 0.35, layer: 'under' }); if (vis) { const q = cam.P(p.map((x) => x * sg * 1.32)); g.text(q[0], q[1], (sg > 0 ? '+' : '−') + lab, { small: true, c, dy: 4 }); } }); });
        const k = sepSlope(IBOX);
        [1, -1].forEach((sg) => { const n = unit([1, 0, sg * k]); curve3(g, cam, L.seq(181, (i) => { const a = TAU * i / 180; return [Math.sin(a) * n[0], Math.cos(a), Math.sin(a) * n[2]]; }), { c: 'ink', w: 1.8, op: 0.75, layer: 'under' }, { c: 'ink', w: 1, op: 0.3, dash: '3 3', layer: 'under' }); });
        const bs = Math.atan(k);
        [0.3, 0.62, 0.88].forEach((fr) => [bs * fr, PI / 2 - (PI / 2 - bs) * fr].forEach((b) => { const pts = polhode(IBOX, [Math.cos(b), 0, Math.sin(b)]); [1, -1].forEach((sg) => curve3(g, cam, pts.map((p) => p.map((x) => x * sg)), { c: 'muted', w: 1.3, op: 0.85, layer: 'under' }, { c: 'muted', w: 0.8, op: 0.25, dash: '2 3', layer: 'under' })); }));
        const Lb = run.map((x) => unit(Lbody(IBOX, x.w)));
        curve3(g, cam, Lb, { c: 'c4', w: 2.2 }, { c: 'c4', w: 1.4, op: 0.4 });
        return cam;
      };
      let camS = drawSphere();
      orbit(g, ctx, 'v2', () => { camS = drawSphere(); frame(st.tNow ?? tStar); });
      orbit(f, ctx, 'v1', () => frame(st.tNow ?? tStar));
      const frame = (t) => {
        st.tNow = t;
        const cam = camera(st, 'v1', 0.55, 0.32);
        const k = Math.min(run.length - 1, Math.round(t / (run[1].t - run[0].t)));
        const smp = run[k];
        f.clear('main'); f.clear('over'); f.clear('under');
        const Ls = unit(Lspace(IBOX, smp));
        f.line([cam.P(Ls.map((x) => -1.35 * x)), cam.P([0, 0, 0])], { c: 'ink', w: 1.2, dash: '4 3', op: 0.5, layer: 'under' });
        const ax2 = qrot(smp.q, [0, 1, 0]), back2 = cam.depth(ax2) < 0;
        const axLine = (sg) => f.line([cam.P(ax2.map((x) => x * 0.5 * sg)), cam.P(ax2.map((x) => x * 1.05 * sg))], { c: 'c2', w: 2.4, dash: '5 3', layer: 'under' });
        axLine(back2 ? 1 : -1);
        drawBox(f, cam, smp.q);
        f.line([cam.P(ax2.map((x) => x * 0.5 * (back2 ? -1 : 1))), cam.P(ax2.map((x) => x * 1.05 * (back2 ? -1 : 1)))], { c: 'c2', w: 2.4, dash: '5 3', layer: 'over' });
        f.line([cam.P([0, 0, 0]), cam.P(Ls.map((x) => 1.35 * x))], { c: 'ink', w: 2.6, arrow: true, layer: 'over' });
        const lt = cam.P(Ls.map((x) => 1.5 * x)); f.text(lt[0], lt[1], 'L', { math: true, dy: 4 });
        g.clear('over');
        const Lb = unit(Lbody(IBOX, smp.w)), pq = camS.P(Lb);
        g.dot(pq[0], pq[1], { c: 'hl', r: 6.5, op: camS.depth(Lb) >= 0 ? 1 : 0.5 });
        s.clear('main'); s.clear('over');
        s.vline(smp.t, { c: 'hl', w: 1.4, dash: '3 3', layer: 'main' });
        ['c1', 'c2', 'c3'].forEach((c, i) => s.dot(smp.t, smp.w[i], { c, r: 4 }));
      };
      frame(tStar);
      st.anim = L.animator(ctx.host, (dt, t) => { if (dt === 0 && t === 0) { frame(tStar); return; } frame((tStar + 4 * t) % v.time); }, { autoplay: true, initialT: 0, playLabel: T('Spin it', '回す') });
      L.legend(ctx.host, [{ c: 'c1', label: T('ω₁, smallest moment (long axis)', 'ω₁（最小の慣性モーメント、長軸）') }, { c: 'c2', label: T('ω₂, middle moment', 'ω₂（中間の慣性モーメント）') }, { c: 'c3', label: T('ω₃, largest moment (short axis)', 'ω₃（最大の慣性モーメント、短軸）') }, { c: 'c4', label: T('this run on the sphere', 'この運動の球面上の軌跡') }, { c: 'ink', label: T('separatrix', 'セパラトリクス') }]);
      const E = run.map((x) => energy(IBOX, x.w)), Lm = run.map((x) => norm(Lbody(IBOX, x.w)));
      const drift = Math.max(Math.max(...E) - Math.min(...E), Math.max(...Lm) - Math.min(...Lm));
      const gaps = st.cross.slice(1).map((x, i) => x - st.cross[i]), meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : NaN;
      const items = [{ k: T('moments I₁ : I₂ : I₃', '慣性モーメント I₁ : I₂ : I₃'), v: IBOX.map((x) => fmt(x, 3)).join(' : ') }];
      if (wb.stable) items.push({ k: T('wobble period 2π/Ω', 'ぐらつきの周期 2π/Ω'), v: fmt(TAU / wb.rate, 2), tone: 'key' });
      else items.push({ k: T('growth rate λ', '成長率 λ'), v: fmt(wb.rate, 3), tone: 'key' }, { k: T('time between flips', '反転の間隔'), v: Number.isFinite(meanGap) ? fmt(meanGap, 2) : st.cross.length ? T('one flip so far', 'まだ一回') : T('none yet', 'まだなし') });
      items.push({ k: T('drift in E and |L|', 'E と |L| のずれ'), v: drift < 1e-9 ? '< 10⁻⁹' : fmt(drift, 3), tone: drift < 1e-6 ? 'good' : 'warn' });
      ctx.readout(items, wb.stable ? T('Spin about the long or the short axis and the body only wobbles: the momentum point circles its axis on a small closed polhode.', '長軸か短軸のまわりに回すと、物体はぐらつくだけです。運動量の点は小さな閉じたポールホードの上で軸を回ります。') : T('Spin about the middle axis and the smallest nudge grows like exp(λt). The momentum point runs along the separatrix to the opposite pole, so the body flips over, again and again, while L in space stays fixed.', '中間の軸のまわりに回すと、ほんのわずかなずれが exp(λt) のように成長します。運動量の点はセパラトリクスに沿って反対の極まで走るので、空間の L は固定されたまま、物体は何度も裏返ります。'));
    },
  };

  /* ---------- 2. the gyroscope: precession and nutation ---------- */
  D.gyroscope = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, P = { I1: 1, I3: 0.8, mgl: 4, w3: v.spin, th0: v.tilt / DEG, mode: Math.round(v.start) };
      const key = `${v.spin}|${v.tilt}|${v.start}|${v.time}`;
      if (st.key !== key) { st.res = topRun(P, v.time); st.key = key; }
      const { samples: S, steady } = st.res, dtS = S[1].t - S[0].t;
      const axisOf = (x) => [Math.sin(x.th) * Math.cos(x.ph), Math.sin(x.th) * Math.sin(x.ph), Math.cos(x.th)];
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A spinning wheel on a pivot. The violet trail is the path of the tip of its axle. Drag to turn the view.', '支点の上で回る車輪。紫の軌跡は軸の先端がたどる道です。ドラッグで視点を回せます。'));
      const f = L.fig(c1, { x: [-1.35, 1.35], y: [-0.85, 1.3], equal: true, axes: false, grid: false, maxH: 400 });
      L.h('p', 'lab-cap', c2, T('The tip’s path unrolled: elevation of the axle against how far it has precessed', '先端の道を展開したもの：軸の仰角と歳差の進み'));
      const el = S.map((x) => 90 - x.th * DEG), phs = S.map((x) => x.ph * DEG);
      const eLo = Math.min(...el), eHi = Math.max(...el), pad = Math.max(4, (eHi - eLo) * 0.25), mid = (eLo + eHi) / 2, half = Math.max(12, (eHi - eLo) / 2 + pad);
      const pLo = Math.min(0, ...phs), pHi = Math.max(10, ...phs);
      const g = L.fig(c2, { x: [pLo, pHi], y: [mid - half, mid + half], aspect: 0.8, maxH: 380, xlabel: T('precession angle φ (degrees)', '歳差の角 φ（度）'), ylabel: T('elevation (degrees)', '仰角（度）') });
      g.line(S.map((x, i) => [phs[i], el[i]]), { c: 'c4', w: 2, layer: 'under' });
      g.hline(90 - v.tilt, { c: 'muted', dash: '4 4' });
      const draw = (t) => {
        const cam = camera(st, 'v', -1.15, 0.5);
        const k = Math.min(S.length - 1, Math.round(t / dtS)), x = S[k], n = axisOf(x);
        f.clear('under'); f.clear('main'); f.clear('over');
        // floor ring, vertical, pedestal
        curve3(f, cam, L.seq(97, (i) => { const a = TAU * i / 96; return [Math.cos(a), Math.sin(a), 0]; }), { c: 'muted', w: 1, op: 0.45, dash: '3 4', layer: 'under' });
        f.line([cam.P([0, 0, 0]), cam.P([0, 0, 1.2])], { c: 'muted', w: 1, dash: '3 3', layer: 'under' });
        f.poly([cam.P([0, 0, 0]), cam.P([0.22, 0, -0.62]), cam.P([-0.22, 0, -0.62])], { c: 'muted', fo: 0.3, w: 1, layer: 'under' });
        curve3(f, cam, L.seq(49, (i) => { const a = TAU * i / 48; return [0.3 * Math.cos(a), 0.3 * Math.sin(a), -0.62]; }), { c: 'muted', w: 1.2, op: 0.7, layer: 'under' });
        // tip trail
        const trail = S.slice(0, k + 1).map((y) => axisOf(y).map((c) => c * 1.05));
        f.line(trail.map(cam.P), { c: 'c4', w: 1.8, op: 0.9, layer: 'under' });
        // wheel: rim, spokes rotating with the spin angle
        const e1 = [Math.cos(x.th) * Math.cos(x.ph), Math.cos(x.th) * Math.sin(x.ph), -Math.sin(x.th)], e2 = [-Math.sin(x.ph), Math.cos(x.ph), 0];
        const at = (a, r, d = 0.72) => [0, 1, 2].map((i) => d * n[i] + r * (Math.cos(a) * e1[i] + Math.sin(a) * e2[i]));
        const rim = L.seq(73, (i) => at(TAU * i / 72, 0.42));
        f.poly(rim.map(cam.P), { c: 'c1', fo: 0.22, w: 2.2 });
        for (let s6 = 0; s6 < 6; s6++) { const a = x.ps + s6 * PI / 3; f.line([cam.P(at(a, 0.04)), cam.P(at(a, 0.42))], { c: s6 === 0 ? 'c2' : 'c1', w: s6 === 0 ? 2.6 : 1.4 }); }
        f.line([cam.P([0, 0, 0]), cam.P(n.map((c) => c * 1.05))], { c: 'ink', w: 3.2, layer: 'over' });
        f.dot(...cam.P([0, 0, 0]), { c: 'ink', r: 4.5 });
        f.dot(...cam.P(n.map((c) => c * 1.05)), { c: 'hl', r: 6 });
        g.clear('over'); g.dot(phs[k], el[k], { c: 'hl', r: 6.5 });
        const avg = x.t > 0 ? x.ph / x.t : NaN;
        ctx.readout([{ k: 't', v: fmt(x.t, 1) }, { k: T('mean precession rate', '平均の歳差角速度'), v: fmt(avg, 4), tone: 'key' }, { k: T('fast-top estimate mgl / (I₃ω₃)', '速いこまの近似 mgl / (I₃ω₃)'), v: fmt(P.mgl / (P.I3 * P.w3), 4) }, { k: T('nutation frequency ≈ I₃ω₃ / I₁', '章動の角振動数 ≈ I₃ω₃ / I₁'), v: fmt(P.I3 * P.w3 / P.I1, 2) }, { k: T('elevation range', '仰角の範囲'), v: `${fmt(eLo, 1)}° … ${fmt(eHi, 1)}°` }],
          steady === null && P.mode !== 0 ? T('At this spin and tilt no steady precession exists: the spin is too slow to hold the wheel up, so it is released from rest instead.', 'この回転の速さと傾きでは定常歳差は存在しません。車輪を支えるには回転が遅すぎるので、代わりに静止状態から放しています。') : P.mode === 0 ? T('Released from rest, the axle first drops, the gyroscopic torque turns the drop sideways, and the tip traces cusps: it stops dead at the top of every arch.', '静止状態から放すと、軸はまず下がり、ジャイロ効果のトルクがその落下を横向きに変え、先端はカスプを描きます。各アーチの頂点で一瞬完全に止まります。') : P.mode === 1 ? T('Launched at exactly the steady precession rate, the tilt never changes: gravity’s torque is balanced by turning the angular momentum.', 'ちょうど定常歳差の角速度で送り出すと、傾きはまったく変わりません。重力のトルクは角運動量の向きを変えることで釣り合います。') : T('Pushed against the natural precession, the tip overshoots backwards on every cycle and draws loops.', '自然な歳差と逆向きに押すと、先端は毎周期うしろへ行き過ぎ、ループを描きます。'));
      };
      orbit(f, ctx, 'v', () => draw(st.tNow ?? v.time));
      st.anim = L.animator(ctx.host, (dt, t) => { const tt = Math.min(v.time, t); st.tNow = tt; draw(tt); if (tt >= v.time) return false; }, { autoplay: false, once: true, initialT: v.time, playLabel: T('Release the gyroscope', 'ジャイロを放す') });
      L.legend(ctx.host, [{ c: 'c4', label: T('path of the axle tip', '軸の先端の道') }, { c: 'c2', label: T('one spoke, to show the spin', '回転を示す一本のスポーク') }, { c: 'muted', dash: true, label: T('starting elevation', '最初の仰角') }]);
    },
  };

  /* ---------- 3. the inertia tensor and its principal axes ---------- */
  D['inertia-tensor'] = {
    render(ctx, v) {
      const st = ctx.state;
      st.pos ||= [[-1.25, 0.45], [0.95, 0.95], [1.15, -0.65], [-0.45, -1.05]];
      const masses = [1, 1, 1, v.mass], ms = st.pos.map((p, i) => [p[0], p[1], masses[i]]);
      const cm = centreOfMass(ms), ref = Math.round(v.about) === 1 ? [0, 0] : [cm[0], cm[1]];
      const I = inertia2(ms, ref), pr = principal(I), a = v.angle / DEG;
      const Ia = momentAbout(ms, ref, a);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Drag the masses. The gold line is the chosen axis; each thin segment is a distance r⊥ that enters I = Σ m r⊥².', '質点をドラッグしてください。金の線が選んだ軸で、細い線分はそれぞれ I = Σ m r⊥² に入る距離 r⊥ です。'));
      const f = L.fig(c1, { x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, grid: true, maxH: 440 });
      const u = [Math.cos(a), Math.sin(a)], far = (d, s) => [ref[0] + s * 4 * d[0], ref[1] + s * 4 * d[1]];
      // principal axes and the momental ellipse r(a) = k / sqrt(I(a))
      [[pr.aMin, 'c1'], [pr.aMax, 'c3']].forEach(([b, c]) => f.line([far([Math.cos(b), Math.sin(b)], -1), far([Math.cos(b), Math.sin(b)], 1)], { c, w: 1.4, dash: '6 4', op: 0.85, layer: 'under' }));
      const kE = 0.9 * Math.sqrt(Math.max(pr.Imin, 1e-9));
      f.poly(L.seq(181, (i) => { const b = TAU * i / 180, r = kE / Math.sqrt(Math.max(momentFromTensor(I, b), 1e-9)); return [ref[0] + r * Math.cos(b), ref[1] + r * Math.sin(b)]; }), { c: 'c4', fo: 0.12, w: 1.8, layer: 'under' });
      f.line([far(u, -1), far(u, 1)], { c: 'hl', w: 2.6 });
      ms.forEach(([x, y]) => { const t = (x - ref[0]) * u[0] + (y - ref[1]) * u[1], foot = [ref[0] + t * u[0], ref[1] + t * u[1]]; f.seg([x, y], foot, { c: 'ink', w: 1.1, op: 0.7 }); });
      f.dot(cm[0], cm[1], { c: 'ink', r: 4, hollow: true });
      f.text(cm[0], cm[1], T('centre of mass', '重心'), { small: true, c: 'muted', anchor: 'start', dx: 9, dy: 16 });
      ms.forEach(([x, y, m], i) => f.handle(x, y, { c: i === 3 ? 'c2' : 'ink', r: 5 + 3 * Math.sqrt(m), label: T(`Mass ${i + 1}`, `質点 ${i + 1}`), bounds: [-1.9, 1.9, -1.9, 1.9], onDrag: (nx, ny) => { st.pos[i] = [nx, ny]; ctx.redraw(); } }));
      // right: I as a function of the axis angle
      L.h('p', 'lab-cap', c2, T('Moment of inertia about an axis at angle θ. Drag the gold point.', '角度 θ の軸まわりの慣性モーメント。金の点をドラッグしてください。'));
      const curve = L.sample(0, 180, 181, (d) => momentAbout(ms, ref, d / DEG));
      const hi = Math.max(...curve.map((p) => p[1])) * 1.18 + 0.2;
      const g = L.fig(c2, { x: [0, 180], y: [0, hi], aspect: 0.8, maxH: 380, xlabel: T('axis angle θ (degrees)', '軸の角度 θ（度）'), ticksX: [0, 45, 90, 135].map((d) => [d, `${d}°`]) });
      g.line(curve, { c: 'ink', w: 2.4 });
      const wrap = (b) => ((b * DEG) % 180 + 180) % 180;
      [[pr.aMin, 'c1'], [pr.aMax, 'c3']].forEach(([b, c]) => { const d = wrap(b); g.vline(d, { c, dash: '6 4', w: 1.3 }); g.dot(d, momentAbout(ms, ref, d / DEG), { c, r: 5 }); });
      g.handle(v.angle, Ia, { c: 'hl', axis: 'x', bounds: [0, 180, 0, hi], label: T('Axis angle', '軸の角度'), onDrag: (x) => ctx.set('angle', x) });
      L.legend(ctx.host, [{ c: 'hl', label: T('chosen axis', '選んだ軸') }, { c: 'c1', dash: true, label: T('principal axis of least moment', '慣性モーメントが最小の主軸') }, { c: 'c3', dash: true, label: T('principal axis of greatest moment', '慣性モーメントが最大の主軸') }, { kind: 'fill', c: 'c4', label: T('momental ellipse, radius ∝ 1/√I', '慣性楕円（半径 ∝ 1/√I）') }]);
      const items = [{ k: 'I(θ) = Σ m r⊥²', v: fmt(Ia, 3), tone: 'key' }, { k: 'I_min', v: fmt(pr.Imin, 3) }, { k: 'I_max', v: fmt(pr.Imax, 3) }, { k: T('perpendicular axis I_z', '垂直軸 I_z'), v: fmt(I.zz, 3) }];
      if (Math.round(v.about) === 1) { const d = (cm[0]) * Math.sin(a) - (cm[1]) * Math.cos(a); items.push({ k: T('I_cm(θ) + M d²', 'I_cm(θ) + M d²'), v: fmt(momentAbout(ms, [cm[0], cm[1]], a) + cm[2] * d * d, 3), tone: 'good' }); }
      ctx.readout(items, Math.round(v.about) === 1 ? T('About the origin every moment is the centre-of-mass value plus M d², where d is the distance from the centre of mass to the axis: the parallel-axis theorem, checked live.', '原点まわりのどの慣性モーメントも、重心まわりの値に M d² を加えたものです。d は重心から軸までの距離です。平行軸の定理をその場で確かめられます。') : T('However the masses are placed, I(θ) is a pure sinusoid in 2θ. Its maximum and minimum are always exactly 90° apart: those two directions are the principal axes.', '質点をどう置いても I(θ) は 2θ の正弦波そのものです。最大と最小はいつもちょうど 90° 離れていて、その二方向が主軸です。'));
    },
  };
})();
