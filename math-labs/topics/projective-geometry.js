'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;

  /* ---------------- homogeneous coordinates and models (no DOM) ---------------- */
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const det3 = (a, b, c) => dot3(a, cross3(b, c));
  const IDEAL = 1e-7;
  const isIdeal = (h) => Math.abs(h[2]) < IDEAL * len3(h);
  const chart = (h) => (isIdeal(h) ? null : [h[0] / h[2], h[1] / h[2]]);
  const hom = (p) => [p[0], p[1], 1];
  const join = (p, q) => cross3(hom(p), hom(q));                           // line through two chart points
  const lineAt = (c, th) => cross3(hom(c), [Math.cos(th), Math.sin(th), 0]);   // line through c with direction angle th
  const meet = cross3;                                                      // the point where two lines cross

  // Two lines in the chart: l1 = AB, l2 through C at the angle rel to l1. Everything the first lab shows.
  function twoLines(A, B, C, rel) {
    const th1 = Math.atan2(B[1] - A[1], B[0] - A[0]), th2 = th1 + rel;
    const u1 = [Math.cos(th1), Math.sin(th1)], u2 = [Math.cos(th2), Math.sin(th2)];
    const foot = (p, u) => { const s = p[0] * u[0] + p[1] * u[1]; return [p[0] - s * u[0], p[1] - s * u[1]]; };
    const l1 = join(A, B), l2 = lineAt(C, th2);
    let P = unit3(meet(l1, l2));
    if (P[2] < 0 || (Math.abs(P[2]) < 1e-9 && (P[0] < 0 || (P[0] === 0 && P[1] < 0)))) P = P.map((x) => -x);
    const ideal = isIdeal(P);
    return { th1, th2, u1, u2, q1: foot(A, u1), q2: foot(C, u2), l1, l2, P, ideal, chartP: ideal ? null : chart(P), dirDeg: deg(Math.atan2(P[1], P[0])) };
  }
  // A traveller on l1: Q(psi) = q1 + LT tan(psi) u1. Its homogeneous vector is smooth through psi = pi/2 (the point at infinity).
  const LT = 1.2;
  function traveller(g, psi) {
    const c = Math.cos(psi), s = Math.sin(psi);
    const h = [g.q1[0] * c + LT * s * g.u1[0], g.q1[1] * c + LT * s * g.u1[1], c];
    const hu = unit3(h);
    return { h: hu, chart: Math.abs(c) < 1e-9 ? null : [g.q1[0] + LT * (s / c) * g.u1[0], g.q1[1] + LT * (s / c) * g.u1[1]] };
  }
  const clipRange = (q, u, H) => {                                          // a-range with |q + a u|_inf <= H
    let a0 = -1e9, a1 = 1e9;
    for (let i = 0; i < 2; i++) {
      if (Math.abs(u[i]) < 1e-12) { if (Math.abs(q[i]) > H) return null; continue; }
      const t0 = (-H - q[i]) / u[i], t1 = (H - q[i]) / u[i];
      a0 = Math.max(a0, Math.min(t0, t1)); a1 = Math.min(a1, Math.max(t0, t1));
    }
    return a1 > a0 ? [a0, a1] : null;
  };

  // Cross-ratio. (a,b;c,d) = (c-a)(d-b) / ((c-b)(d-a)) on positions along a line.
  const cr = (a, b, c, d) => ((c - a) * (d - b)) / ((c - b) * (d - a));
  const det2 = (u, v) => u[0] * v[1] - u[1] * v[0];
  const crPencil = (O, A, B, C, Dd) => {                                    // from four rays at O: sin ratios, the det form
    const r = (P) => [P[0] - O[0], P[1] - O[1]], a = r(A), b = r(B), c = r(C), d = r(Dd);
    return (det2(a, c) * det2(b, d)) / (det2(b, c) * det2(a, d));
  };
  const harmonicD = (a, b, c) => { const den = 2 * c - a - b; return Math.abs(den) < 1e-9 ? Infinity : ((c - a) * b + (c - b) * a) / den; };
  // Perspectivity from l1 (the x-axis) to the line l2 through E at angle phi, centre O. Position t' is measured along l2 from E.
  function perspect(O, E, phi, t) {
    const r = [t - O[0], -O[1]], n = [-Math.sin(phi), Math.cos(phi)], den = n[0] * r[0] + n[1] * r[1];
    if (Math.abs(den) < 1e-12) return null;
    const s = (n[0] * (E[0] - O[0]) + n[1] * (E[1] - O[1])) / den, X = [O[0] + s * r[0], O[1] + s * r[1]];
    return { s, X, t: (X[0] - E[0]) * Math.cos(phi) + (X[1] - E[1]) * Math.sin(phi) };
  }
  const vanishing = (O, phi) => (Math.abs(Math.sin(phi)) < 1e-12 ? null : O[0] - O[1] * Math.cos(phi) / Math.sin(phi));   // point of l1 whose ray is parallel to l2
  function imageOfInfinity(O, E, phi) {                                     // where the horizontal ray from O meets l2 (image of the point at infinity of l1)
    const n = [-Math.sin(phi), Math.cos(phi)], den = n[0];
    if (Math.abs(den) < 1e-12) return null;
    const s = (n[0] * (E[0] - O[0]) + n[1] * (E[1] - O[1])) / den, X = [O[0] + s, O[1]];
    return { X, t: (X[0] - E[0]) * Math.cos(phi) + (X[1] - E[1]) * Math.sin(phi) };
  }

  // The cone x^2 + y^2 = z^2 (half-angle 45 degrees) cut by the plane n.X = 1, n = (sin tau, 0, cos tau).
  // The plane has orthonormal axes e1 = (cos tau, 0, -sin tau), e2 = (0, 1, 0) about its foot F = n.
  // Central projection from the apex sends the circle (cos th, sin th, 1) to the section; this is the whole story.
  const ecc = (tau) => Math.SQRT2 * Math.sin(rad(tau));
  const kindOf = (tau) => (tau < 1e-9 ? 0 : Math.abs(tau - 45) < 1e-9 ? 2 : tau < 45 ? 1 : 3);   // circle, ellipse, parabola, hyperbola
  function sectionPoint(tau, th) {
    const t = rad(tau), s = Math.sin(t), c = Math.cos(t), den = s * Math.cos(th) + c;
    if (Math.abs(den) < 1e-9) return null;
    const k = 1 / den, X = [k * Math.cos(th), k * Math.sin(th), k];
    return { k, X, uv: [(X[0] - s) * c - (X[2] - c) * s, X[1]] };
  }
  const planePoint = (tau, uv) => { const t = rad(tau), s = Math.sin(t), c = Math.cos(t); return [s + uv[0] * c, uv[1], c - uv[0] * s]; };
  const angleOfPlanePoint = (tau, uv) => { const X = planePoint(tau, uv); return Math.atan2(X[1] / X[2], X[0] / X[2]); };
  const sectionResidual = (tau, uv) => { const t = rad(2 * tau); return Math.cos(t) * uv[0] * uv[0] + uv[1] * uv[1] + 2 * Math.sin(t) * uv[0] - Math.cos(t); };
  const atInfinity = (tau) => { const c = Math.cos(rad(tau)), s = Math.sin(rad(tau)); if (s < 1e-12) return 0; const r = c / s; return r > 1 + 1e-9 ? 0 : Math.abs(r - 1) <= 1e-9 ? 1 : 2; };

  // Pascal: six points in the plane (chart coordinates), a hexagon order, the three crossings of opposite sides and their collinearity.
  const ORDERS = [[0, 1, 2, 3, 4, 5], [0, 2, 4, 1, 3, 5], [0, 3, 1, 4, 2, 5]];
  function pascal(pts, order) {
    const o = order || ORDERS[0], H = pts.map(hom);
    const sides = o.map((i, k) => cross3(H[i], H[o[(k + 1) % 6]]));
    const Q = [0, 1, 2].map((k) => unit3(cross3(sides[k], sides[k + 3])));
    const defect = Math.abs(det3(Q[0], Q[1], Q[2]));
    let best = null;
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) { const l = cross3(Q[i], Q[j]), n = len3(l); if (!best || n > best.n) best = { n, l: n > 1e-12 ? unit3(l) : null }; }
    return { sides, Q, defect, line: best.l };
  }
  const lineBox = (l, x0, x1, y0, y1) => {                                // endpoints of the line a x + b y + c = 0 inside a box
    const [a, b, c] = l, out = [];
    if (Math.abs(b) > 1e-12) for (const x of [x0, x1]) { const y = -(a * x + c) / b; if (y >= y0 - 1e-9 && y <= y1 + 1e-9) out.push([x, y]); }
    if (Math.abs(a) > 1e-12) for (const y of [y0, y1]) { const x = -(b * y + c) / a; if (x >= x0 - 1e-9 && x <= x1 + 1e-9) out.push([x, y]); }
    return out.length >= 2 ? [out[0], out[out.length - 1]] : null;
  };

  const M = { dot3, cross3, unit3, det3, hom, join, lineAt, meet, chart, isIdeal, twoLines, traveller, clipRange, cr, crPencil, harmonicD, perspect, vanishing, imageOfInfinity, ecc, kindOf, sectionPoint, planePoint, angleOfPlanePoint, sectionResidual, atInfinity, pascal, lineBox, ORDERS };
  (window.LabModels = window.LabModels || {})['projective-geometry'] = M;

  /* ---------------- shared layout ---------------- */
  function frame(ctx, caps) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null; st.g = null;
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
  const num = (x, d = 2) => (Math.abs(x) < 0.5 * Math.pow(10, -d) ? fmt(0, d) : fmt(x, d));
  const hstr = (h, d = 2) => `[${num(h[0], d)} : ${num(h[1], d)} : ${num(h[2], d)}]`;
  const xy = (p, d = 2) => `(${num(p[0], d)}, ${num(p[1], d)})`;

  /* ---------------- 1. the projective plane ---------------- */
  const CH = 3.2, RH = 2.5, RAY = 3.7;
  D['projective-plane'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('Every point of the plane z = 1 is a line through the origin O, and every line of that plane is a plane through O. Two lines meet where their planes meet: a line through O. Drag A, B and C, or tilt the second line with the slider.', '平面 z = 1 の各点は原点 O を通る直線に、この平面の各直線は O を通る平面に対応します。二直線は、それぞれの平面が交わるところ、つまり O を通る直線で交わります。A、B、C をドラッグするか、スライダーで第二の直線を傾けてください。'),
        T('The same plane z = 1 seen from above. Gold is the point where the two lines meet; violet runs along the first line and goes through infinity.', '同じ平面 z = 1 を真上から見た図です。金色は二直線の交点で、紫は第一の直線に沿って走り、無限遠を通り抜けます。'),
      ]);
      st.pts ||= { A: [-1.7, -0.9], B: [1.5, 0.2], C: [-0.6, 1.8] };
      const { A, B, C } = st.pts;
      const g = twoLines(A, B, C, rad(v.rel ?? 35));
      st.drawTrav = (psi) => drawTrav(psi);
      const par = Math.abs(v.rel ?? 35) < 0.5;

      const readout = () => {
        const P = g.P;
        ctx.readout([
          { k: T('angle between the lines', '二直線のなす角'), v: `${fmt(v.rel ?? 35, 0)}°`, tone: par ? 'warn' : undefined },
          { k: T('ℓ₁ ∩ ℓ₂ = [X : Y : Z]', 'ℓ₁ ∩ ℓ₂ = [X : Y : Z]'), v: hstr(P, 3), tone: 'key' },
          g.ideal
            ? { k: T('in the chart', 'チャートの中では'), v: T(`none: Z = 0, a point at infinity in direction ${fmt(((g.dirDeg % 180) + 180) % 180, 1)}°`, `なし：Z = 0、方向 ${fmt(((g.dirDeg % 180) + 180) % 180, 1)}° の無限遠点`), tone: 'warn' }
            : { k: T('in the chart z = 1', 'チャート z = 1 では'), v: xy(g.chartP, 3) + T('  = (X/Z, Y/Z)', '  = (X/Z, Y/Z)'), tone: 'good' },
          { k: T('direction of the common line through O', 'O を通る共通の直線の向き'), v: `(${num(P[0], 3)}, ${num(P[1], 3)}, ${num(P[2], 3)})` },
        ], g.ideal
          ? T('The planes of the two lines meet in a horizontal line through O. It never pierces the plane z = 1, so the lines have no common point in the chart; but it is a perfectly good point of the projective plane, the point at infinity of both lines.', '二直線の平面は、O を通る水平な直線で交わります。この直線は平面 z = 1 を貫かないので、チャートの中に共通点はありません。しかしこれは射影平面のれっきとした点で、二直線に共通の無限遠点です。')
          : T('Any two distinct lines of the projective plane meet in exactly one point. Tilt the second line towards parallel and the gold point runs off along the line, leaving the chart and arriving at the horizon z = 0.', '射影平面の相異なる二直線は、ちょうど一点で交わります。第二の直線を平行に近づけると、金色の点は直線に沿って走り去り、チャートを離れて地平線 z = 0 に到達します。'));
      };

      const drawTrav = (psi) => {
        const tr = traveller(g, psi);
        if (!st.flat && st.S) {
          const h = tr.h;
          st.tray.update([[h.map((x) => -x * RAY), h.map((x) => x * RAY)]]);
          const inside = tr.chart && Math.abs(tr.chart[0]) <= CH && Math.abs(tr.chart[1]) <= CH;
          st.trav.visible = !!inside; if (inside) st.trav.at([tr.chart[0], tr.chart[1], 1]);
          st.S.invalidate();
        }
        if (st.g && st.g.svg?.isConnected && st.tg) {
          while (st.tg.firstChild) st.tg.removeChild(st.tg.firstChild);
          const add = (node) => { st.tg.appendChild(node); };
          if (tr.chart && Math.abs(tr.chart[0]) < CH && Math.abs(tr.chart[1]) < CH) add(st.g.dot(tr.chart[0], tr.chart[1], { c: 'c4', r: 6.5 }));
          else {
            const d = tr.chart ? Math.hypot(...tr.chart) : 1, dir = tr.chart ? [tr.chart[0] / d, tr.chart[1] / d] : g.u1;
            for (const sg of tr.chart ? [1] : [1, -1]) { const e = [sg * dir[0] * (CH - 0.3), sg * dir[1] * (CH - 0.3)]; add(st.g.arrow([e[0] * 0.86, e[1] * 0.86], e, { c: 'c4', w: 3, layer: 'over' })); }
          }
        }
      };

      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const f = st.g = L.fig(st.g2, { x: [-CH, CH], y: [-CH, CH], equal: true, maxH: 400, xlabel: 'x = X/Z', ylabel: 'y = Y/Z' });
        const ext = (q, u, c, extra = {}) => f.line([[q[0] - 9 * u[0], q[1] - 9 * u[1]], [q[0] + 9 * u[0], q[1] + 9 * u[1]]], { c, w: 2.6, ...extra });
        ext(g.q1, g.u1, 'c1'); ext(g.q2, g.u2, 'c3');
        const P = g.P;
        if (g.ideal) {
          const dir = [P[0], P[1]];
          for (const sg of [1, -1]) f.arrow([sg * dir[0] * (CH - 0.75), sg * dir[1] * (CH - 0.75)], [sg * dir[0] * (CH - 0.12), sg * dir[1] * (CH - 0.12)], { c: 'hl', w: 4 });
          f.text(dir[0] * (CH - 0.5) + 0.12, dir[1] * (CH - 0.5) + 0.3, T('P at infinity', '無限遠点 P'), { c: 'hl', small: true, anchor: dir[0] > 0 ? 'end' : 'start' });
        } else if (Math.abs(g.chartP[0]) <= CH - 0.05 && Math.abs(g.chartP[1]) <= CH - 0.05) {
          f.dot(g.chartP[0], g.chartP[1], { c: 'hl', r: 8 });
          f.text(g.chartP[0] + 0.28, g.chartP[1] + 0.3, 'P', { math: true, c: 'hl' });
        } else {
          const d = Math.hypot(...g.chartP), e = [g.chartP[0] / d * (CH - 0.15), g.chartP[1] / d * (CH - 0.15)];
          f.arrow([e[0] * 0.8, e[1] * 0.8], e, { c: 'hl', w: 4 });
          f.text(e[0] * 0.8, e[1] * 0.8 + 0.28, T(`P off the chart, ${fmt(d, 1)} from O`, `P はチャートの外、O から ${fmt(d, 1)}`), { c: 'hl', small: true, anchor: e[0] > 0 ? 'end' : 'start' });
        }
        for (const [key, col, name, u] of [['A', 'c1', 'A', g.u1], ['B', 'c1', 'B', g.u1], ['C', 'c3', 'C', g.u2]]) {
          const p = st.pts[key], nx = -u[1], ny = u[0], sg = ny > 0 ? -1 : 1;
          f.handle(p[0], p[1], { c: col, label: name, bounds: [-CH + 0.3, CH - 0.3, -CH + 0.3, CH - 0.3], onDrag: (x, y) => { st.pts[key] = [x, y]; ctx.redraw(); } });
          f.text(p[0] + sg * 0.34 * nx, p[1] + sg * 0.34 * ny - 0.09, name, { math: true, c: col });
        }
        st.tg = f.group('over');
        L.legend(st.leg, [{ c: 'c1', label: T('line ℓ₁ = AB', '直線 ℓ₁ = AB') }, { c: 'c3', label: T('line ℓ₂ through C', 'C を通る直線 ℓ₂') }, { kind: 'dot', c: 'hl', label: T('P = ℓ₁ ∩ ℓ₂', 'P = ℓ₁ ∩ ℓ₂') }, { kind: 'dot', c: 'c4', label: T('a traveller on ℓ₁', 'ℓ₁ 上の旅人') }]);
        readout();
      };

      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => { st.psi = (0.5 * t) % PI; st.drawTrav?.(st.psi); }, { initialT: 1.5, playLabel: T('Send the traveller round the line', '旅人を直線に沿って走らせる') });
      }
      const upd3 = (S) => {
        // chart lines and the two planes through O that contain them
        const line3 = (q, u) => { const r = clipRange(q, u, CH); return r ? [[q[0] + r[0] * u[0], q[1] + r[0] * u[1], 1], [q[0] + r[1] * u[0], q[1] + r[1] * u[1], 1]] : null; };
        const l1 = line3(g.q1, g.u1), l2 = line3(g.q2, g.u2);
        st.t1.update(l1 || []); st.t2.update(l2 || []);
        const setWedge = (mesh, q, u) => {
          const r = clipRange(q, u, CH) || [0, 0];
          mesh.update((s, w) => { const a = r[0] + (r[1] - r[0]) * w; return [s * (q[0] + a * u[0]), s * (q[1] + a * u[1]), s]; });
        };
        setWedge(st.w1, g.q1, g.u1); setWedge(st.w2, g.q2, g.u2);
        st.d1.update([[-RH * g.u1[0], -RH * g.u1[1], 0], [RH * g.u1[0], RH * g.u1[1], 0]]);
        st.d2.update([[-RH * g.u2[0], -RH * g.u2[1], 0], [RH * g.u2[0], RH * g.u2[1], 0]]);
        st.i1a.at([RH * g.u1[0], RH * g.u1[1], 0]); st.i1b.at([-RH * g.u1[0], -RH * g.u1[1], 0]);
        st.i2a.at([RH * g.u2[0], RH * g.u2[1], 0]); st.i2b.at([-RH * g.u2[0], -RH * g.u2[1], 0]);
        st.pray.update([[-RAY * g.P[0], -RAY * g.P[1], -RAY * g.P[2]], [RAY * g.P[0], RAY * g.P[1], RAY * g.P[2]]]);
        const show = !g.ideal && Math.abs(g.chartP[0]) <= CH && Math.abs(g.chartP[1]) <= CH;
        st.ps.visible = show; st.pl.show(show); if (show) { st.ps.at([g.chartP[0], g.chartP[1], 1]); st.pl.set([g.chartP[0], g.chartP[1], 1.0]); }
        st.pi.visible = g.ideal; if (g.ideal) st.pi.at([RH * g.P[0] * 1.0, RH * g.P[1] * 1.0, 0]);
        st.hA.at([A[0], A[1], 1]); st.hB.at([B[0], B[1], 1]); st.hC.at([C[0], C[1], 1]);
        S.invalidate();
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: ctx.host.clientWidth < 520 ? 1.0 : 0.82, maxH: 560, camera: [5.9, -7.1, 5.6], target: [0, 0, 0.5], fov: 37,
        init(S) {
          st.flat = false; st.S = S;
          const segs = [];
          for (let i = -3; i <= 3; i++) segs.push([[i, -CH, 1], [i, CH, 1]], [[-CH, i, 1], [CH, i, 1]]);
          S.lines(segs, { c: 'grid', opacity: 0.8, w: 1 });
          S.polyline([[-CH, -CH, 1], [CH, -CH, 1], [CH, CH, 1], [-CH, CH, 1], [-CH, -CH, 1]], { c: 'muted', opacity: 0.7 });
          S.surface((x, y) => [x, y, 1], { u: [-CH, CH], v: [-CH, CH], nu: 1, nv: 1, c: 'plate', opacity: 0.3, rough: 0.2, coat: 0.8 });
          S.tube(L.seq(121, (i) => [RH * Math.cos(TAU * i / 120), RH * Math.sin(TAU * i / 120), 0]), { c: 'muted', r: 0.014, closed: true });
          S.disc([0, 0, 0], [0, 0, 1], RH, { c: 'plate', opacity: 0.16 });
          S.label(T('chart z = 1', 'チャート z = 1'), [CH - 0.1, CH - 0.15, 1.02], { small: true, align: 'end' });
          S.label(T('horizon z = 0', '地平線 z = 0'), [RH * 0.72, -RH * 0.78, 0], { small: true });
          S.sphere([0, 0, 0], 0.075, { c: 'ink' }); S.label('O', [0.1, 0.1, 0], { math: true });
          st.w1 = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 1, nv: 1, c: 'c1', opacity: 0.3, rough: 0.3, coat: 0.7 });
          st.w2 = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 1, nv: 1, c: 'c3', opacity: 0.3, rough: 0.3, coat: 0.7 });
          st.t1 = S.tube([[0, 0, 1], [0, 0, 1.01]], { c: 'c1', r: 0.032 });
          st.t2 = S.tube([[0, 0, 1], [0, 0, 1.01]], { c: 'c3', r: 0.032 });
          st.d1 = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.02 });
          st.d2 = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c3', r: 0.02 });
          st.i1a = S.sphere([0, 0, 0], 0.055, { c: 'c1' }); st.i1b = S.sphere([0, 0, 0], 0.055, { c: 'c1' });
          st.i2a = S.sphere([0, 0, 0], 0.055, { c: 'c3' }); st.i2b = S.sphere([0, 0, 0], 0.055, { c: 'c3' });
          st.pray = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.026, glow: 0.35 });
          st.ps = S.sphere([0, 0, 1], 0.1, { c: 'hl', glow: 0.5 }); st.pl = S.label('P', [0, 0, 1], { math: true, c: 'hl' });
          st.pi = S.sphere([0, 0, 0], 0.1, { c: 'hl', glow: 0.5 });
          st.tray = S.lines([[[0, 0, 0], [0, 0, 0.01]]], { c: 'c4', opacity: 0.9, w: 2 });
          st.trav = S.sphere([0, 0, 1], 0.085, { c: 'c4', glow: 0.25 });
          const hd = (key, col) => S.handle([...st.pts[key], 1], { plane: [[0, 0, 1], [0, 0, 1]], bounds: [-CH + 0.3, CH - 0.3, -CH + 0.3, CH - 0.3], r: 0.08, c: col, label: key, onDrag: (q) => { st.pts[key] = [q.x, q.y]; ctx.redraw(); return [q.x, q.y, 1]; } });
          st.hA = hd('A', 'c1'); st.hB = hd('B', 'c1'); st.hC = hd('C', 'c3');
        },
        update(S) { upd3(S); draw2d(); drawTrav(st.psi ?? 0.75); },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('3D graphics are not available here; the chart on the right carries the construction.', 'ここでは 3D 表示を使えません。右のチャートに作図があります。')); setTimeout(() => { if (!st.g2.firstChild) { draw2d(); drawTrav(st.psi ?? 0.75); } }, 0); },
      });
      if (!st.__v3 && !st.flat) { draw2d(); drawTrav(st.psi ?? 0.75); }
      st.anim?.redraw();
    },
  };

  /* ---------------- 2. cross-ratio ---------------- */
  D['cross-ratio'] = {
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', c1, T('Light from O throws the points A, B, C, D of the blue line onto the teal screen. Distances change, but one number does not. Drag O, the four points, or the screen’s pivot; tilt the screen with the slider.', '点 O から出た光が、青い直線の点 A、B、C、D を青緑のスクリーンに投影します。距離は変わりますが、ある一つの数は変わりません。O、四点、スクリーンの支点をドラッグし、スライダーでスクリーンを傾けてください。'));
        st.g1 = L.h('div', '', c1);
        L.h('p', 'lab-cap', c2, T('The projection as a map from position on ℓ₁ to position on ℓ₂. It is a Möbius map: one pole (the point whose ray is parallel to the screen) and one horizontal asymptote (the image of infinity).', '投影を、ℓ₁ 上の位置から ℓ₂ 上の位置への写像として描いた図です。メビウス写像で、極（光線がスクリーンと平行になる点）が一つ、水平な漸近線（無限遠の像）が一つあります。'));
        st.g2 = L.h('div', '', c2);
        st.leg = L.h('div', '', st.frame);
      }
      st.O ||= [0.7, 5.3]; st.E ||= [0.4, 2.7]; st.x ||= [-3.3, -1.5, 0.4, 2.8];
      const harm = Math.round(v.mode ?? 0) === 1;
      if (harm) st.x[3] = harmonicD(st.x[0], st.x[1], st.x[2]);
      const O = st.O, E = st.E, phi = rad(v.tilt ?? 28), xs = st.x.slice();
      const names = ['A', 'B', 'C', 'D'];
      const cl = (x) => (Number.isFinite(x) ? x : 1e6);
      const X1 = xs.map((x) => [cl(x), 0]);
      const img = xs.map((x) => perspect(O, E, phi, cl(x)));
      const tt = xs.map((x) => cl(x));
      const crL1 = cr(...tt);
      const finite2 = img.every((q) => q && Math.abs(q.t) < 1e5);
      const crL2 = finite2 ? cr(...img.map((q) => q.t)) : null;
      const crRays = crPencil(O, ...X1);
      const ratio = (a, b, c) => (c - a) / (c - b);

      st.g1.replaceChildren(); st.g2.replaceChildren(); st.leg.replaceChildren();
      const f = L.fig(st.g1, { x: [-5, 5], y: [-1.5, 6.4], equal: true, axes: false, grid: false, maxH: 460 });
      // the two lines
      f.line([[-5, 0], [5, 0]], { c: 'c1', w: 3.4 });
      const u2 = [Math.cos(phi), Math.sin(phi)];
      f.line([[E[0] - 12 * u2[0], E[1] - 12 * u2[1]], [E[0] + 12 * u2[0], E[1] + 12 * u2[1]]], { c: 'c3', w: 3.4 });
      f.text(-4.85, 0.32, 'ℓ₁', { math: true, c: 'c1' });
      // vanishing marks
      const vx = vanishing(O, phi), inf2 = imageOfInfinity(O, E, phi);
      if (vx !== null && Math.abs(vx) < 5) { f.dot(vx, 0, { c: 'c2', r: 5.5, hollow: true }); f.text(vx, -0.5, T('vanishing', '消失点'), { c: 'c2', small: true, anchor: 'middle' }); f.seg(O, [vx, 0], { c: 'c2', w: 1, dash: '3 4', op: 0.7 }); }
      if (inf2) { f.seg(O, inf2.X, { c: 'c2', w: 1, dash: '3 4', op: 0.6 }); f.dot(inf2.X[0], inf2.X[1], { c: 'c2', r: 5.5, hollow: true }); }
      // the pencil of rays
      xs.forEach((x, i) => {
        const X = [cl(x), 0], q = img[i];
        f.seg(O, X, { c: 'c2', w: 1.6, op: 0.85 });
        if (q && Math.abs(q.s) < 40 && (q.s > 1.001 || q.s < -0.001)) f.seg(O, q.X, { c: 'c2', w: 1.2, dash: '5 4', op: 0.6 });
      });
      // the points
      xs.forEach((x, i) => {
        if (Number.isFinite(x) && Math.abs(x) < 6) {
          const free = !(harm && i === 3);
          if (free) f.handle(x, 0, { c: 'c1', label: names[i], axis: 'x', bounds: [-4.8, 4.8, -1, 1], onDrag: (nx) => { st.x[i] = nx; ctx.redraw(); } });
          else f.dot(x, 0, { c: 'c1', r: 8, layer: 'over' });
          f.text(x, -0.55, names[i], { math: true, c: 'c1', anchor: 'middle' });
        }
        const q = img[i];
        if (q && Math.abs(q.X[0]) < 5.5 && Math.abs(q.X[1]) < 6.4) { f.dot(q.X[0], q.X[1], { c: 'c3', r: 6.5, layer: 'over' }); f.text(q.X[0] + 0.16, q.X[1] + 0.34, names[i] + '′', { math: true, c: 'c3' }); }
      });
      f.handle(O[0], O[1], { c: 'c2', label: 'O', bounds: [-4.5, 4.5, 0.6, 6.1], onDrag: (x, y) => { st.O = [x, y]; ctx.redraw(); } });
      f.text(O[0] + 0.18, O[1] + 0.3, 'O', { math: true, c: 'c2' });
      f.handle(E[0], E[1], { c: 'c3', label: T('pivot of ℓ₂', 'ℓ₂ の支点'), bounds: [-4.5, 4.5, 0.3, 5.5], onDrag: (x, y) => { st.E = [x, y]; ctx.redraw(); } });
      L.legend(st.leg, [{ c: 'c1', label: T('ℓ₁ and A, B, C, D', 'ℓ₁ と A, B, C, D') }, { c: 'c3', label: T('screen ℓ₂ and A′, B′, C′, D′', 'スクリーン ℓ₂ と A′, B′, C′, D′') }, { c: 'c2', label: T('rays from O', 'O からの光線') }, { kind: 'dot', c: 'c2', label: T('open circles: vanishing point, image of ∞', '白抜きの円：消失点、無限遠の像') }]);

      // the map t -> t'
      const ts = L.seq(501, (i) => -5 + 10 * i / 500);
      const g = L.fig(st.g2, { x: [-5, 5], y: [-7, 7], aspect: 1, maxH: 460, xlabel: T('position on ℓ₁', 'ℓ₁ 上の位置'), ylabel: T('position on ℓ₂ from its pivot', 'ℓ₂ 上の位置（支点から）') });
      let seg = [];
      const flush = () => { if (seg.length > 1) g.line(seg, { c: 'c2', w: 2.8 }); seg = []; };
      for (const t of ts) { const q = perspect(O, E, phi, t); if (!q || Math.abs(q.t) > 40) flush(); else seg.push([t, q.t]); }
      flush();
      if (vx !== null && Math.abs(vx) < 5) g.vline(vx, { c: 'muted', dash: '5 4' });
      if (inf2) g.hline(inf2.t, { c: 'muted', dash: '5 4' });
      xs.forEach((x, i) => {
        const q = img[i];
        if (!q || !Number.isFinite(x) || Math.abs(x) > 5 || Math.abs(q.t) > 7) return;
        g.seg([x, -7], [x, q.t], { c: 'c1', w: 1.2, dash: '4 3', op: 0.8 }); g.seg([-5, q.t], [x, q.t], { c: 'c3', w: 1.2, dash: '4 3', op: 0.8 });
        g.dot(x, q.t, { c: 'hl', r: 6.5, layer: 'over' });
        g.text(x + 0.12, q.t + 0.45, names[i], { math: true });
      });

      const r1 = ratio(...tt.slice(0, 3)), r2 = finite2 ? ratio(...img.slice(0, 3).map((q) => q.t)) : null;
      ctx.readout([
        { k: T('(A,B;C,D) on ℓ₁', 'ℓ₁ 上の (A,B;C,D)'), v: fmt(crL1, 4), tone: 'key' },
        { k: T('(A′,B′;C′,D′) on ℓ₂', 'ℓ₂ 上の (A′,B′;C′,D′)'), v: crL2 === null ? T('a point is at infinity', '無限遠の点あり') : fmt(crL2, 4), tone: crL2 === null ? 'warn' : 'key' },
        { k: T('from the four rays at O (sines)', 'O での四光線（正弦比）'), v: fmt(crRays, 4), tone: 'key' },
        { k: T('AC/BC on ℓ₁ and on ℓ₂', 'ℓ₁ と ℓ₂ での AC/BC'), v: `${fmt(r1, 3)} → ${r2 === null ? '∞' : fmt(r2, 3)}`, tone: 'warn' },
      ], harm
        ? T('Harmonic position: D is placed so that (A,B;C,D) = −1. A harmonic quadruple stays harmonic on every screen, whatever the projection does to the lengths.', '調和位置：D は (A,B;C,D) = −1 となるように置かれています。調和な四点は、投影が長さをどう変えても、どのスクリーンの上でも調和なままです。')
        : T('The ratio AC/BC of lengths changes under projection, but the ratio of ratios (A,B;C,D) = AC·BD / (BC·AD) does not. Tilt the screen until it is parallel to a ray: that image goes to infinity and the cross-ratio is still the same number.', '長さの比 AC/BC は投影で変わりますが、比の比 (A,B;C,D) = AC·BD / (BC·AD) は変わりません。スクリーンをある光線と平行になるまで傾けてください。その像は無限遠に飛びますが、複比は同じ値のままです。'));
    },
  };

  /* ---------------- 3. conics: sections of a cone, and Pascal's hexagon ---------------- */
  const ZC = 3.0, PL = 3.2;
  const KINDS = [T('circle', '円'), T('ellipse', '楕円'), T('parabola', '放物線'), T('hyperbola', '双曲線')];
  const SIX0 = [24, 78, 140, 205, 262, 318].map(rad);
  // pieces of the section curve as polylines of in-plane coordinates, broken at infinity and at the display cap
  function sectionPieces(tau, zcap = ZC, uvcap = 9, n = 540) {
    const pieces = []; let cur = [], first = null, last = null, allOk = true;
    for (let i = 0; i <= n; i++) {
      const q = sectionPoint(tau, TAU * i / n);
      const ok = q && Math.abs(q.X[2]) <= zcap + 1e-9 && Math.abs(q.uv[0]) < uvcap && Math.abs(q.uv[1]) < uvcap && (!last || Math.abs(q.X[2] - last.X[2]) < 0.8);
      if (!ok) { allOk = false; if (cur.length > 1) pieces.push(cur); cur = []; last = null; continue; }
      cur.push(q); last = q; if (!first) first = q;
    }
    if (cur.length > 1) pieces.push(cur);
    if (!allOk && pieces.length > 1 && first) { const a = pieces[0], b = pieces[pieces.length - 1]; if (Math.abs(a[0].X[2] - b[b.length - 1].X[2]) < 0.1 && Math.hypot(a[0].uv[0] - b[b.length - 1].uv[0], a[0].uv[1] - b[b.length - 1].uv[1]) < 0.3) { pieces[pieces.length - 1] = b.concat(a); pieces.shift(); } }
    return pieces;
  }

  D['conic-pascal'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('Light from the apex through a circle makes a cone. Any plane cuts it in a conic: tilt the plane and the section goes ellipse, parabola, hyperbola. The six teal points slide on the circle; gold marks the Pascal line of the hexagon they span.', '頂点から円を通る光は円錐を作ります。どんな平面で切っても切り口は円錐曲線で、平面を傾けると楕円、放物線、双曲線と移ります。六つの青緑の点は円の上を動き、金色は、それらが作る六角形のパスカル線です。'),
        T('The section as it looks in its own plane. Drag the numbered points along the curve: the three crossings of opposite sides of the hexagon always lie on one line.', '切り口を、その平面の中で見た図です。番号を付けた点を曲線に沿ってドラッグしてください。六角形の向かい合う辺の三つの交点は、いつも一直線上にあります。'),
      ]);
      const tau = v.tilt ?? 28, ord = ORDERS[Math.round(v.order ?? 1)] || ORDERS[0];
      st.base ||= SIX0.slice();
      st.spin ??= 0;
      const kind = kindOf(tau), e = ecc(tau);
      const pieces = sectionPieces(tau), pieces2 = sectionPieces(tau, 14, 7);
      const frameBox = (() => {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const pc of pieces2) for (const q of pc) { x0 = Math.min(x0, q.uv[0]); x1 = Math.max(x1, q.uv[0]); y0 = Math.min(y0, q.uv[1]); y1 = Math.max(y1, q.uv[1]); }
        if (x0 > x1) { x0 = -2; x1 = 2; y0 = -2; y1 = 2; }
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = Math.max(1.5, (x1 - x0) / 2 * 1.14), hy = Math.max(1.5, (y1 - y0) / 2 * 1.14);
        return [cx - hx, cx + hx, cy - hy, cy + hy];
      })();
      const angs = () => st.base.map((a) => a + st.spin);
      const compute = () => {
        const th = angs(), ims = th.map((a) => sectionPoint(tau, a));
        const ok = ims.every(Boolean);
        const uv = ok ? ims.map((q) => q.uv) : null;
        const pas = ok ? pascal(uv, ord) : null;
        return { th, ims, ok, uv, pas };
      };
      let cur = compute();
      st.cur = cur;
      const nInf = atInfinity(tau);

      const readout = () => {
        const pas = cur.pas;
        ctx.readout([
          { k: T('section', '切り口'), v: KINDS[kind], tone: 'key' },
          { k: T('plane–axis angle vs cone angle', '平面と軸の角 / 円錐の半頂角'), v: `${fmt(90 - tau, 0)}° ${kind === 2 ? '=' : kind <= 1 ? '>' : '<'} 45°` },
          { k: T('e = cos(angle) / cos 45° = √2 sin τ', 'e = cos(角) / cos 45° = √2 sin τ'), v: fmt(e, 3), tone: 'key' },
          { k: T('points at infinity', '無限遠点の数'), v: String(nInf) },
          { k: T('Pascal: |det(Q₁,Q₂,Q₃)|', 'パスカル：|det(Q₁,Q₂,Q₃)|'), v: pas ? (pas.defect < 1e-9 ? '< 10⁻⁹' : fmt(pas.defect, 2)) : T('a point is at infinity', '無限遠の点あり'), tone: pas && pas.defect < 1e-9 ? 'good' : 'warn' },
        ], kind === 0 ? T('A plane perpendicular to the axis cuts a circle. Tilt it and the circle stretches into an ellipse.', '軸に垂直な平面の切り口は円です。傾けると円は引き伸ばされて楕円になります。')
          : kind === 1 ? T('The plane is steeper than the cone’s side, so it cuts every generator on one nappe: a closed ellipse with e < 1.', '平面が円錐の母線より立っているので、片側の円錐面のすべての母線と交わります。e < 1 の閉じた楕円です。')
            : kind === 2 ? T('The plane is parallel to one generator: that generator never meets it, so one point of the section is at infinity. A parabola, e = 1.', '平面が一本の母線と平行になり、その母線は平面と交わりません。切り口の一点が無限遠にあります。放物線で、e = 1 です。')
              : T('The plane is flatter than the cone’s side and cuts both nappes. Two generators are parallel to it: two points at infinity, two branches. A hyperbola, e > 1.', '平面が母線より寝ていて、円錐面の両側と交わります。平面と平行な母線が二本あり、無限遠点が二つ、枝が二つできます。双曲線で、e > 1 です。'));
      };

      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const [x0, x1, y0, y1] = frameBox;
        const f = st.g = L.fig(st.g2, { x: [x0, x1], y: [y0, y1], equal: true, maxH: 440, xlabel: 'u', ylabel: 'v' });
        for (const pc of pieces2) f.line(pc.map((q) => q.uv), { c: 'c2', w: 3 });
        const { ok, uv, pas } = cur;
        if (ok) {
          // extended opposite sides, then the hexagon
          for (let k = 0; k < 3; k++) {
            const Qk = pas.Q[k];
            if (!isIdeal(Qk)) {
              const q = chart(Qk);
              for (const side of [k, k + 3]) { const a = uv[ord[side]], b = uv[ord[(side + 1) % 6]]; const far = Math.hypot(q[0] - a[0], q[1] - a[1]) > Math.hypot(q[0] - b[0], q[1] - b[1]) ? b : a; f.seg(far, q, { c: 'muted', w: 1, dash: '4 4', op: 0.8 }); }
            }
          }
          for (let k = 0; k < 6; k++) f.seg(uv[ord[k]], uv[ord[(k + 1) % 6]], { c: 'c4', w: 2.2 });
          if (pas.line) { const seg = lineBox(pas.line, x0, x1, y0, y1); if (seg) f.line(seg, { c: 'hl', w: 3.4, layer: 'over' }); }
          pas.Q.forEach((Qk, k) => { if (!isIdeal(Qk)) { const q = chart(Qk); if (q[0] > x0 && q[0] < x1 && q[1] > y0 && q[1] < y1) { f.dot(q[0], q[1], { c: 'hl', r: 7, layer: 'over' }); f.text(q[0] + 0.05 * (x1 - x0), q[1] + 0.04 * (y1 - y0), 'Q' + '₁₂₃'[k], { math: true, c: 'hl' }); } } });
          uv.forEach((p, i) => {
            if (p[0] <= x0 || p[0] >= x1 || p[1] <= y0 || p[1] >= y1) return;
            f.handle(p[0], p[1], { c: 'c3', label: String(i + 1), bounds: [x0, x1, y0, y1], onDrag: (x, y) => { st.base[i] = angleOfPlanePoint(tau, [x, y]) - st.spin; ctx.redraw(); } });
            f.text(p[0] + 0.03 * (x1 - x0), p[1] + 0.05 * (y1 - y0), String(i + 1), { c: 'c3' });
          });
        }
        L.legend(st.leg, [{ c: 'c2', label: T('the section', '切り口') }, { kind: 'dot', c: 'c3', label: T('six points on it', '曲線上の六点') }, { c: 'c4', label: T('hexagon', '六角形') }, { kind: 'dot', c: 'hl', label: T('Q₁, Q₂, Q₃ and the Pascal line', 'Q₁, Q₂, Q₃ とパスカル線') }]);
        readout();
      };

      const upd3pts = (S) => {
        const { ok, ims, uv, pas, th } = cur;
        st.hs.forEach((h, i) => h.at([Math.cos(th[i]), Math.sin(th[i]), 1]));
        if (!ok) { st.hexl.update([]); st.rays.update([]); st.imgs.forEach((s) => { s.visible = false; }); st.pq.forEach((s) => { s.visible = false; }); st.pascal.update([]); S.invalidate(); return; }
        const P3 = uv.map((p) => planePoint(tau, p));
        st.imgs.forEach((s, i) => { s.visible = true; s.at(P3[i]); });
        const segs = [];
        for (let k = 0; k < 6; k++) segs.push([P3[ord[k]], P3[ord[(k + 1) % 6]]]);
        st.hexl.update(segs);
        st.rays.update(th.map((a, i) => { const k = ims[i].k, sc = Math.max(1, Math.min(Math.abs(k), 4.5)) * Math.sign(k || 1); return [[0, 0, 0], [Math.cos(a) * sc, Math.sin(a) * sc, sc]]; }));
        st.pq.forEach((s, k) => { const Qk = pas.Q[k], q = isIdeal(Qk) ? null : chart(Qk); const okp = q && Math.abs(q[0]) < PL && Math.abs(q[1]) < PL; s.visible = !!okp; if (okp) s.at(planePoint(tau, q)); });
        const seg = pas.line ? lineBox(pas.line, -PL, PL, -PL, PL) : null;
        st.pascal.update(seg ? seg.map((p) => planePoint(tau, p)) : []);
        S.invalidate();
      };
      const refresh = () => {
        cur = compute(); st.cur = cur;
        if (!st.flat && st.S) upd3pts(st.S);
        draw2d();
      };
      st.refresh = refresh;
      if (!st.anim) {
        let last = -1;
        st.anim = L.animator(st.bar, (dt, t) => {
          st.spin = 0.55 * Math.sin(0.9 * t);
          if (dt === 0) return;
          if (t - last > 0.05) { last = t; st.refresh?.(); }
        }, { initialT: 0, autoplay: false, playLabel: T('Slide the six points', '六点を滑らせる') });
      }
      L.view3d(ctx, v, {
        host: st.v3, aspect: ctx.host.clientWidth < 520 ? 1.05 : 0.86, maxH: 580, camera: [6.9, -8.2, 3.9], target: [0, 0, 0.7], fov: 36,
        init(S) {
          st.flat = false; st.S = S;
          st.cone = S.surface((z, ph) => [z * Math.cos(ph), z * Math.sin(ph), z], { u: [-ZC, ZC], v: [0, TAU], nu: 12, nv: 96, c: 'c1', opacity: 0.2, rough: 0.35, coat: 0.7, wire: true, wireEvery: 6, wireEveryV: 8, wireOpacity: 0.16 });
          S.sphere([0, 0, 0], 0.07, { c: 'ink' }); S.label(T('apex', '頂点'), [0.12, 0.05, -0.05], { small: true });
          S.tube(L.seq(121, (i) => [Math.cos(TAU * i / 120), Math.sin(TAU * i / 120), 1]), { c: 'c3', r: 0.02, closed: true });
          st.plane = S.surface(() => [0, 0, 0], { u: [-1, 1], v: [-1, 1], nu: 1, nv: 1, c: 'hl', opacity: 0.2, rough: 0.3, coat: 0.6 });
          st.curves = L.seq(3, () => S.tube([[0, 0, -9], [0, 0, -9.01]], { c: 'c2', r: 0.04 }));
          st.rays = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'muted', opacity: 0.55, w: 1.2 });
          st.hexl = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c4', opacity: 0.95, w: 2.4 });
          st.pascal = S.tube([[0, 0, -9], [0, 0, -9.01]], { c: 'hl', r: 0.03, glow: 0.35 });
          st.imgs = L.seq(6, () => S.sphere([0, 0, 0], 0.055, { c: 'c2' }));
          st.pq = L.seq(3, () => S.sphere([0, 0, 0], 0.08, { c: 'hl', glow: 0.4 }));
          st.hs = L.seq(6, (i) => S.handle([Math.cos(st.base[i]), Math.sin(st.base[i]), 1], { plane: [[0, 0, 1], [0, 0, 1]], r: 0.08, c: 'c3', label: String(i + 1), onDrag: (q) => { const a = Math.atan2(q.y, q.x); st.base[i] = a - st.spin; ctx.redraw(); return [Math.cos(a), Math.sin(a), 1]; } }));
          st.key = null;
        },
        update(S) {
          const key = String(tau);
          if (st.key !== key) {
            st.key = key;
            const t = rad(tau), s = Math.sin(t), c = Math.cos(t);
            st.plane.update((a, b) => [s + a * PL * c, b * PL, c - a * PL * s]);
            const polys = pieces.map((pc) => pc.map((q) => q.X));
            st.curves.forEach((tb, i) => tb.update(polys[i] && polys[i].length > 1 ? polys[i] : []));
          }
          upd3pts(S); draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('3D graphics are not available here; the section on the right shows the conic and the hexagon.', 'ここでは 3D 表示を使えません。右の切り口の図に円錐曲線と六角形があります。')); setTimeout(() => { if (!st.g2.firstChild) draw2d(); }, 0); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
