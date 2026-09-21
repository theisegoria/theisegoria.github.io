'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180;

  // ---------- 1. curvature of a plane curve ----------
  const CURVES = [
    (b) => (t) => { const x = -PI + TAU * t; return [x, 1.2 * b * Math.sin(x)]; },
    (b) => (t) => [1.6 * Math.cos(TAU * t), 1.6 * (1 - 0.65 * b) * Math.sin(TAU * t)],
    (b) => (t) => { const th = TAU * t, r = (1 + 2 * b * Math.cos(th)) * 1.9 / (1 + b); return [r * Math.cos(th) - 0.75 * b, r * Math.sin(th)]; },
  ];
  D.curvature = {
    render(ctx, v) {
      const kind = Math.round(v.curve ?? 0), b = v.bend, c = CURVES[kind](b), at = v.at ?? 0.3, closed = kind > 0;
      const h = 1e-4;
      const d1 = (t) => { const p = c(t + h), m = c(t - h); return [(p[0] - m[0]) / (2 * h), (p[1] - m[1]) / (2 * h)]; };
      const d2 = (t) => { const p = c(t + h), o = c(t), m = c(t - h); return [(p[0] - 2 * o[0] + m[0]) / (h * h), (p[1] - 2 * o[1] + m[1]) / (h * h)]; };
      const kap = (t) => { const a = d1(t), bb = d2(t); return (a[0] * bb[1] - a[1] * bb[0]) / Math.pow(a[0] ** 2 + a[1] ** 2, 1.5); };
      const N = 600, ts = L.seq(N + 1, (i) => i / N), P = ts.map(c);
      const sArr = [0]; for (let i = 1; i <= N; i++) sArr.push(sArr[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const K = ts.map(kap), total = sArr[N];
      const turning = K.reduce((acc, k, i) => (i ? acc + 0.5 * (k + K[i - 1]) * (sArr[i] - sArr[i - 1]) : 0), 0);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The curve with its curvature comb and the osculating circle at the chosen point. Drag the point along the curve.', '曲率の櫛と、選んだ点での接触円。点は曲線に沿ってドラッグできます。'));
      const f = fig(c1, { axes: false, x: [-3.5, 3.5], y: [-2.3, 2.3], equal: true, maxH: 380 });
      const kmax = Math.max(1e-6, ...K.map(Math.abs)), sc = 0.7 / Math.max(1, kmax);
      const tip = [];
      for (let i = 0; i <= N; i += 6) {
        const a = d1(ts[i]), l = Math.hypot(...a), n = [-a[1] / l, a[0] / l], p = P[i], q = [p[0] - n[0] * K[i] * sc, p[1] - n[1] * K[i] * sc];
        f.line([p, q], { c: K[i] >= 0 ? 'pos' : 'neg', w: 1, op: 0.55, layer: 'under' });
        tip.push(q);
      }
      f.line(tip, { c: 'muted', w: 1, op: 0.6, layer: 'under' });
      f.line(P, { c: 'ink', w: 2.6 });
      const p = c(at), a = d1(at), l = Math.hypot(...a), tg = [a[0] / l, a[1] / l], nn = [-tg[1], tg[0]], k = kap(at);
      if (Math.abs(k) > 1e-3) {
        const R = 1 / k, ctr = [p[0] + nn[0] * R, p[1] + nn[1] * R];
        f.circle(ctr[0], ctr[1], Math.abs(R), { c: 'hl', w: 1.8, dash: '6 4' });
        f.dot(ctr[0], ctr[1], { c: 'hl', r: 4 });
        f.line([p, ctr], { c: 'hl', w: 1, op: 0.6 });
      }
      f.arrow(p, [p[0] + tg[0] * 0.8, p[1] + tg[1] * 0.8], { c: 'c1', w: 2.4 });
      f.arrow(p, [p[0] + nn[0] * 0.6, p[1] + nn[1] * 0.6], { c: 'c3', w: 2.4 });
      f.text(p[0] + tg[0] * 0.8, p[1] + tg[1] * 0.8, 'T', { math: true, c: 'c1', dx: 8, dy: -6 });
      f.text(p[0] + nn[0] * 0.6, p[1] + nn[1] * 0.6, 'N', { math: true, c: 'c3', dx: 8, dy: -6 });
      f.handle(p[0], p[1], { c: 'c2', label: T('Point on the curve', '曲線上の点'), onDrag: (x, y) => { let best = 0, bd = Infinity; P.forEach((q, i) => { const dd = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (dd < bd) { bd = dd; best = i; } }); ctx.set('at', ts[best] >= 1 && closed ? 0 : ts[best]); } });
      // right: kappa against arc length
      L.h('p', 'lab-cap', c2, T('Signed curvature κ against arc length s. The area under the graph is the total turning of the tangent.', '弧長 s に対する符号付き曲率 κ。グラフの下の面積が接線の総回転角です。'));
      const ky = Math.max(0.5, kmax) * 1.15;
      const g = fig(c2, { x: [0, total], y: [-ky, ky], aspect: 0.8, maxH: 380, xlabel: T('arc length s', '弧長 s'), ylabel: 'κ' });
      const KS = K.map((kk, i) => [sArr[i], kk]);
      g.area(KS.map(([s, kk]) => [s, Math.max(0, kk)]), { c: 'pos', fo: 0.25 });
      g.area(KS.map(([s, kk]) => [s, Math.min(0, kk)]), { c: 'neg', fo: 0.25 });
      g.line(KS, { c: 'ink', w: 2 });
      const si = sArr[Math.round(at * N)];
      g.vline(si, { c: 'hl', w: 1.2 }); g.dot(si, k, { c: 'hl', r: 6.5 });
      g.hover((x) => { let i = sArr.findIndex((s) => s >= x); if (i < 0) return null; return { x: sArr[i], y: K[i], text: `s = ${fmt(sArr[i], 2)}: κ = ${fmt(K[i], 3)}` }; });
      L.legend(ctx.host, [{ c: 'c1', label: T('unit tangent T', '単位接ベクトル T') }, { c: 'c3', label: T('unit normal N (T turned 90° anticlockwise)', '単位法線 N（T を反時計回りに90°回転）') }, { c: 'hl', dash: true, label: T('osculating circle, radius 1/|κ|', '接触円（半径 1/|κ|）') }, { kind: 'fill', c: 'pos', label: T('κ > 0: turning left', 'κ > 0：左に曲がる') }, { kind: 'fill', c: 'neg', label: T('κ < 0: turning right', 'κ < 0：右に曲がる') }]);
      ctx.readout([
        { k: 'κ', v: fmt(k, 3), tone: 'key' },
        { k: T('radius 1/|κ|', '半径 1/|κ|'), v: Math.abs(k) < 1e-3 ? '∞' : fmt(1 / Math.abs(k), 3) },
        { k: '∫κ ds', v: `${fmt(turning, 3)}${closed ? ` = ${fmt(turning / TAU, 2)} × 2π` : ''}` },
      ], closed ? T('For a closed curve the total turning is 2π times the number of times the tangent goes round, however the curve is bent.', '閉曲線では、曲げ方によらず総回転角は接線が回る回数の 2π 倍になります。') : T('Where the curve is straightest the osculating circle grows without bound; at an inflection κ changes sign.', '曲線がまっすぐに近いほど接触円は大きくなり、変曲点で κ の符号が変わります。'));
    },
  };

  // ---------- 2. geodesics on a torus ----------
  const TR = 2, Tr = 0.8;
  const rho = (vv) => TR + Tr * Math.cos(vv);
  const Kt = (vv) => Math.cos(vv) / (Tr * rho(vv));
  const wrap = (x) => { x = ((x + PI) % TAU + TAU) % TAU - PI; return x; };
  const wrapU = (x) => ((x % TAU) + TAU) % TAU;
  function geodesic(u0, v0, psi, len, ds = 0.02) {
    let y = [u0, v0, Math.cos(psi) / rho(v0), Math.sin(psi) / Tr];
    const F = ([u, vv, up, vp]) => { const rr = rho(vv); return [up, vp, 2 * Tr * Math.sin(vv) / rr * up * vp, -rr * Math.sin(vv) / Tr * up * up]; };
    const out = [y.slice()];
    for (let s = 0; s < len; s += ds) {
      const k1 = F(y), k2 = F(y.map((x, i) => x + ds / 2 * k1[i])), k3 = F(y.map((x, i) => x + ds / 2 * k2[i])), k4 = F(y.map((x, i) => x + ds * k3[i]));
      y = y.map((x, i) => x + ds / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      out.push(y.slice());
    }
    return out;
  }
  D['geodesic-surface'] = {
    render(ctx, v) {
      const v0 = rad(v.latitude), psi = rad(v.heading ?? 35), len = 36 * v.arc;
      const G = geodesic(0, v0, psi, len);
      const up0 = Math.cos(psi) / rho(v0), vp0 = Math.sin(psi) / Tr;
      const C = G.map(([u, vv]) => [u, vv]), Cl = G.map((_, i) => [up0 * i * 0.02, v0 + vp0 * i * 0.02]);
      const clair = G.map(([, vv, up]) => rho(vv) ** 2 * up), c0 = clair[0], drift = Math.max(...clair.map((x) => Math.abs(x - c0)));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The torus, seen from above at an angle, shaded by Gaussian curvature.', '斜め上から見たトーラス。ガウス曲率で塗り分けています。'));
      const f = fig(c1, { axes: false, x: [-3.05, 3.05], y: [-2.8, 2.8], equal: true, maxH: 400 });
      const el = rad(52), dv = [0, -Math.cos(el), Math.sin(el)];
      const X3 = (u, vv) => [rho(vv) * Math.cos(u), rho(vv) * Math.sin(u), Tr * Math.sin(vv)];
      const P2 = ([x, y, z]) => [x, y * Math.sin(el) + z * Math.cos(el)];
      const depth = ([x, y, z]) => x * dv[0] + y * dv[1] + z * dv[2];
      const nrm = (u, vv) => [Math.cos(vv) * Math.cos(u), Math.cos(vv) * Math.sin(u), Math.sin(vv)];
      const facing = (u, vv) => { const n = nrm(u, vv); return n[0] * dv[0] + n[1] * dv[1] + n[2] * dv[2] > 0; };
      const NU = 48, NV = 24, quads = [];
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
        const u = TAU * i / NU, u1 = TAU * (i + 1) / NU, vv = -PI + TAU * j / NV, v1 = -PI + TAU * (j + 1) / NV;
        const pts = [X3(u, vv), X3(u1, vv), X3(u1, v1), X3(u, v1)];
        quads.push({ d: pts.reduce((s, p) => s + depth(p), 0) / 4, pts: pts.map(P2), k: Kt((vv + v1) / 2), face: facing((u + u1) / 2, (vv + v1) / 2) });
      }
      quads.sort((a, b) => a.d - b.d);
      quads.forEach((q) => { const e = f.poly(q.pts, { c: q.k >= 0 ? 'pos' : 'neg', fo: 0.12 + 0.45 * Math.min(1, Math.abs(q.k) / 1.05) * (q.face ? 1 : 0.5), w: 0.4, op: 1, layer: 'under' }); e.style.stroke = 'var(--lab-plate)'; e.style.strokeOpacity = '0.5'; });
      const draw3 = (pts, o) => { let seg = [], fr = null; const flush = () => { if (seg.length > 1) f.line(seg, Object.assign({}, o, fr ? {} : { dash: '2 4', op: 0.5 })); seg = []; }; pts.forEach(([u, vv]) => { const ff = facing(u, vv), q = P2(X3(u, vv)); if (fr !== null && ff !== fr) { seg.push(q); flush(); } fr = ff; seg.push(q); }); flush(); };
      draw3(Cl, { c: 'c2', w: 2 });
      draw3(C, { c: 'hl', w: 2.6 });
      const s0 = P2(X3(0, v0));
      f.dot(s0[0], s0[1], { c: 'ink', r: 5.5 });
      // right: the coordinate chart
      L.h('p', 'lab-cap', c2, T('The same curves in the (u, v) chart. The coordinate line is straight here; the geodesic is not.', '同じ曲線を (u, v) 座標で表示。座標直線はここでは直線ですが、測地線は曲がります。'));
      const g = fig(c2, { x: [0, TAU], y: [-PI, PI], aspect: 0.8, maxH: 380, xlabel: T('u (around the axis)', 'u（軸のまわり）'), ylabel: T('v (around the tube)', 'v（管のまわり）'), ticksX: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [TAU, '2π']], ticksY: [[-PI, '−π'], [-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2'], [PI, 'π']] });
      g.raster((x, y) => Kt(y) / 1.05 * 0.8, { cmap: 'div', res: 4 });
      const chart = (pts, o) => { let seg = [], last = null; pts.forEach(([u, vv]) => { const q = [wrapU(u), wrap(vv)]; if (last && (Math.abs(q[0] - last[0]) > PI || Math.abs(q[1] - last[1]) > PI)) { if (seg.length > 1) g.line(seg, o); seg = []; } seg.push(q); last = q; }); if (seg.length > 1) g.line(seg, o); };
      if (Math.abs(c0) > TR - Tr) { const vb = Math.acos(L.clamp((Math.abs(c0) - TR) / Tr, -1, 1)); [vb, -vb].forEach((y) => g.hline(y, { c: 'ink', w: 1, dash: '3 4', op: 0.6 })); }
      chart(Cl, { c: 'c2', w: 2 });
      chart(C, { c: 'hl', w: 2.6 });
      g.dot(0, v0, { c: 'ink', r: 5.5 });
      g.text(TAU, 0, T('outer equator', '外側の赤道'), { anchor: 'end', small: true, c: 'ink', dx: -4, dy: -5 });
      g.text(TAU, -PI, T('inner equator', '内側の赤道'), { anchor: 'end', small: true, c: 'ink', dx: -4, dy: -5 });
      const aU = 2 * (-Tr * Math.sin(v0) / rho(v0)) * up0 * vp0, aV = rho(v0) * Math.sin(v0) / Tr * up0 * up0;
      const kg = Math.hypot(rho(v0) * aU, Tr * aV);
      L.legend(ctx.host, [{ c: 'hl', label: T('Geodesic: solves ∇γ̇γ̇ = 0', '測地線：∇γ̇γ̇ = 0 の解') }, { c: 'c2', label: T('Coordinate straight line, same start and direction', '座標直線（同じ出発点と向き）') }, { kind: 'fill', c: 'pos', label: T('K > 0 (outer half)', 'K > 0（外側）') }, { kind: 'fill', c: 'neg', label: T('K < 0 (inner half)', 'K < 0（内側）') }].concat(Math.abs(c0) > TR - Tr ? [{ c: 'ink', dash: true, label: T('Clairaut band: ρ(v) = |c|', 'クレローの帯：ρ(v) = |c|') }] : []));
      ctx.readout([
        { k: T('Clairaut c = ρ cos ψ', 'クレロー定数 c = ρ cos ψ'), v: fmt(c0, 4), tone: 'key' },
        { k: T('drift of c along the geodesic', '測地線に沿った c のずれ'), v: fmt(drift, 2), tone: 'good' },
        { k: T('|∇γ̇γ̇| of the coordinate line at the start', '出発点での座標直線の |∇γ̇γ̇|'), v: fmt(kg, 3), tone: kg > 1e-3 ? 'warn' : undefined },
      ], T(`R = ${TR}, r = ${Tr}; the outer equator is v = 0. ρ = R + r cos v is the distance from the axis, and ψ the angle with the parallel.`, `R = ${TR}、r = ${Tr} で、外側の赤道が v = 0 です。ρ = R + r cos v は軸からの距離、ψ は緯線とのなす角です。`) + (Math.abs(c0) > TR - Tr ? T(' Since |c| > R − r, the geodesic cannot reach the inner equator and oscillates between the dashed lines.', ' |c| > R − r なので測地線は内側の赤道に届かず、破線の間を振動します。') : T(' Since |c| < R − r, the geodesic winds through the hole.', ' |c| < R − r なので、測地線は穴をくぐって巻き付きます。')));
    },
  };

  // ---------- 3. Gaussian curvature of a graph ----------
  D.gaussian = {
    render(ctx, v) {
      const a = 1, b = -v.saddle, st = ctx.state;
      st.p ||= [0.45, 0.3];
      const z = (x, y) => 0.5 * (a * x * x + b * y * y);
      const K = (x, y) => (a * b) / (1 + a * a * x * x + b * b * y * y) ** 2;
      const [px, py] = st.p;
      const fx = a * px, fy = b * py, W = Math.sqrt(1 + fx * fx + fy * fy);
      const E = 1 + fx * fx, F = fx * fy, Gg = 1 + fy * fy, Lf = a / W, M = 0, Nf = b / W;
      const Kp = (Lf * Nf - M * M) / (E * Gg - F * F), Hm = (E * Nf - 2 * F * M + Gg * Lf) / (2 * (E * Gg - F * F));
      const disc = Math.sqrt(Math.max(0, Hm * Hm - Kp)), k1 = Hm + disc, k2 = Hm - disc;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The surface z = ½(x² + b y²), shaded by the sign of K. Drag across the picture to turn it.', '曲面 z = ½(x² + b y²)。K の符号で塗り分けています。図をドラッグすると回転します。'));
      const f = fig(c1, { axes: false, x: [-1.9, 1.9], y: [-1.45, 2.15], equal: true, maxH: 380 });
      const az = rad(v.turn ?? 35), el = rad(28);
      const P = (x, y, zz) => { const xr = x * Math.cos(az) - y * Math.sin(az), yr = x * Math.sin(az) + y * Math.cos(az); return { p: [xr, yr * Math.sin(el) + zz * Math.cos(el)], d: -yr * Math.cos(el) + zz * Math.sin(el) }; };
      const n = 16, R = 1.2, quads = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x0 = -R + 2 * R * i / n, x1 = -R + 2 * R * (i + 1) / n, y0 = -R + 2 * R * j / n, y1 = -R + 2 * R * (j + 1) / n;
        const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => P(x, y, z(x, y)));
        quads.push({ d: c.reduce((s, q) => s + q.d, 0) / 4, pts: c.map((q) => q.p), k: K((x0 + x1) / 2, (y0 + y1) / 2) });
      }
      quads.sort((p1, p2) => p1.d - p2.d);
      quads.forEach((q) => { const e = f.poly(q.pts, { c: Math.abs(q.k) < 1e-9 ? 'muted' : q.k > 0 ? 'pos' : 'neg', fo: 0.18 + 0.5 * Math.min(1, Math.abs(q.k)), w: 0.8, op: 1, layer: 'under' }); e.style.stroke = 'var(--lab-ink)'; e.style.strokeOpacity = '0.25'; });
      f.line(L.sample(-R, R, 60, (x) => P(x, py, z(x, py)).p), { c: 'c1', w: 2.4 });
      f.line(L.sample(-R, R, 60, (y) => P(px, y, z(px, y)).p), { c: 'c3', w: 2.4 });
      const pp = P(px, py, z(px, py)).p;
      f.dot(pp[0], pp[1], { c: 'hl', r: 6.5 });
      f.svg.style.cursor = 'grab';
      f.svg.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const d0 = { x: e.clientX, t: v.turn ?? 35 };
        const move = (ev) => ctx.set('turn', ((d0.t + (ev.clientX - d0.x) * 0.6 + 540) % 360) - 180);
        const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
      });
      // right: K over the (x, y) domain, with level curves of z
      L.h('p', 'lab-cap', c2, T('Gaussian curvature K(x, y) from above, with contours of height. Drag the gold point.', '上から見たガウス曲率 K(x, y) と高さの等高線。金色の点をドラッグできます。'));
      const g = fig(c2, { x: [-R, R], y: [-R, R], equal: true, maxH: 360, xlabel: 'x', ylabel: 'y' });
      g.raster((x, y) => K(x, y) * 0.85, { cmap: 'div', res: 3 });
      const lv = [-0.6, -0.4, -0.2, 0.2, 0.4, 0.6];
      for (const c of lv) {
        // z = c: x = ±sqrt((2c - b y²)/a)
        [1, -1].forEach((sg) => { const pts = L.sample(-R, R, 120, (y) => { const q = (2 * c - b * y * y) / a; return q >= 0 ? [sg * Math.sqrt(q), y] : [NaN, NaN]; }); g.line(pts, { c: 'ink', w: 0.9, op: 0.45 }); });
      }
      g.line([[-R, py], [R, py]], { c: 'c1', w: 1.6, dash: '5 4' });
      g.line([[px, -R], [px, R]], { c: 'c3', w: 1.6, dash: '5 4' });
      g.handle(px, py, { c: 'hl', label: T('Point on the surface', '曲面上の点'), onDrag: (x, y) => { st.p = [x, y]; ctx.redraw(); } });
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: T('K > 0: bowl-like', 'K > 0：鉢型') }, { kind: 'fill', c: 'neg', label: T('K < 0: saddle-like', 'K < 0：鞍型') }, { c: 'c1', label: T('curve y = const through the point', '点を通る y = 一定の曲線') }, { c: 'c3', label: T('curve x = const through the point', '点を通る x = 一定の曲線') }, { c: 'ink', label: T('contours of z', 'z の等高線') }]);
      ctx.readout([
        { k: 'E, F, G', v: `${fmt(E, 3)}, ${fmt(F, 3)}, ${fmt(Gg, 3)}` },
        { k: 'L, M, N', v: `${fmt(Lf, 3)}, ${fmt(M, 3)}, ${fmt(Nf, 3)}` },
        { k: 'K = (LN − M²)/(EG − F²)', v: fmt(Kp, 4), tone: 'key' },
        { k: 'κ₁, κ₂', v: `${fmt(k1, 3)}, ${fmt(k2, 3)}` },
        { k: T('K at the origin = b', '原点での K = b'), v: fmt(a * b, 3) },
      ], Math.abs(b) < 1e-9 ? T('With b = 0 the surface is a parabolic cylinder: one principal curvature vanishes, K = 0 everywhere, and the surface can be unrolled onto a plane without stretching.', 'b = 0 では曲面は放物柱面で、主曲率の一方が 0 になり、至るところ K = 0 です。伸縮なしに平面へ展開できます。') : b > 0 ? T('Both principal curvatures have the same sign: the surface bends the same way in every direction.', '2つの主曲率が同符号なので、どの方向にも同じ向きに曲がります。') : T('The principal curvatures have opposite signs: the surface bends up in one direction and down in the other.', '主曲率が異符号なので、一方の方向には上に、他方には下に曲がります。'));
    },
  };
})();
