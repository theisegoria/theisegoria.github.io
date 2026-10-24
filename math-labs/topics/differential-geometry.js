'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180;

  // ---------- 1. curvature of a plane curve ----------
  const CURVES = [
    (b) => (t) => { const x = -PI + TAU * t; return [x, 2 * b * Math.sin(x)]; },
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
      f.text(p[0] + tg[0] * 1.02, p[1] + tg[1] * 1.02, 'T', { math: true, c: 'c1', anchor: 'middle', dy: 5 });
      f.text(p[0] + nn[0] * 0.8, p[1] + nn[1] * 0.8, 'N', { math: true, c: 'c3', anchor: 'middle', dy: 5 });
      f.handle(p[0], p[1], { c: 'c2', label: T('Point on the curve', '曲線上の点'), onDrag: (x, y) => { let best = 0, bd = Infinity; P.forEach((q, i) => { const dd = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (dd < bd) { bd = dd; best = i; } }); ctx.set('at', ts[best] >= 1 && closed ? 0 : ts[best]); } });
      // right: kappa against arc length
      L.h('p', 'lab-cap', c2, T('Signed curvature κ against arc length s. The area under the graph is the total turning of the tangent.', '弧長 s に対する符号付き曲率 κ。グラフの下の面積が接線の総回転角です。'));
      const ky = Math.max(0.5, kmax) * 1.15;
      const g = fig(c2, { x: [0, total], y: [-ky, ky], aspect: 0.8, maxH: 380, xlabel: T('arc length s', '弧長 s'), ylabel: 'κ' });
      const KS = K.map((kk, i) => [sArr[i], kk]);
      g.area(KS.map(([s, kk]) => [s, Math.max(0, kk)]), { c: 'pos', fo: 0.25 });
      g.area(KS.map(([s, kk]) => [s, Math.min(0, kk)]), { c: 'neg', fo: 0.25 });
      g.line(KS, { c: 'ink', w: 2 });
      const iAt = Math.round(at * N), si = sArr[iAt];
      let running = 0; for (let i = 1; i <= iAt; i++) running += 0.5 * (K[i] + K[i - 1]) * (sArr[i] - sArr[i - 1]);
      g.vline(si, { c: 'hl', w: 1.2 }); g.dot(si, k, { c: 'hl', r: 6.5 });
      g.hover((x) => { let i = sArr.findIndex((s) => s >= x); if (i < 0) return null; return { x: sArr[i], y: K[i], text: `s = ${fmt(sArr[i], 2)}: κ = ${fmt(K[i], 3)}` }; });
      L.legend(ctx.host, [{ c: 'c1', label: T('unit tangent T', '単位接ベクトル T') }, { c: 'c3', label: T('unit normal N (T turned 90° anticlockwise)', '単位法線 N（T を反時計回りに90°回転）') }, { c: 'hl', dash: true, label: T('osculating circle, radius 1/|κ|', '接触円（半径 1/|κ|）') }, { kind: 'fill', c: 'pos', label: T('κ > 0: turning left', 'κ > 0：左に曲がる') }, { kind: 'fill', c: 'neg', label: T('κ < 0: turning right', 'κ < 0：右に曲がる') }]);
      ctx.readout([
        { k: 'κ', v: fmt(k, 3), tone: 'key' },
        { k: T('radius 1/|κ|', '半径 1/|κ|'), v: Math.abs(k) < 1e-3 ? '∞' : fmt(1 / Math.abs(k), 3) },
        closed ? { k: '∮κ ds', v: `${fmt(turning, 3)} = ${fmt(turning / TAU, 2)} × 2π` } : { k: T('∫₀ˢ κ ds up to the point', '点までの ∫₀ˢ κ ds'), v: `${fmt(running, 3)} rad` },
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
  function geoRender(ctx, v, st) {
      const v0 = rad(v.latitude), psi = rad(v.heading ?? 35), len = 36 * v.arc;
      const G = geodesic(0, v0, psi, len);
      const up0 = Math.cos(psi) / rho(v0), vp0 = Math.sin(psi) / Tr;
      const C = G.map(([u, vv]) => [u, vv]), Cl = G.map((_, i) => [up0 * i * 0.02, v0 + vp0 * i * 0.02]);
      const clair = G.map(([, vv, up]) => rho(vv) ** 2 * up), c0 = clair[0], drift = Math.max(...clair.map((x) => Math.abs(x - c0)));
      const c1 = st.c1, c2 = st.c2;
      c2.replaceChildren(); st.leg.replaceChildren();
      st.draw3d(G, Cl, v0);
      if (st.flat) { c1.replaceChildren(); L.h('p', 'lab-cap', c1, T('The torus, seen from above at an angle, shaded by Gaussian curvature.', '斜め上から見たトーラス。ガウス曲率で塗り分けています。')); }
      const f = st.flat ? fig(c1, { axes: false, x: [-3.05, 3.05], y: [-2.8, 2.8], equal: true, maxH: 400 }) : null;
      if (f) {
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
      }
      // right: the coordinate chart
      L.h('p', 'lab-cap', c2, T('The same curves in the (u, v) chart. The coordinate line is straight here; the geodesic is not.', '同じ曲線を (u, v) 座標で表示。座標直線はここでは直線ですが、測地線は曲がります。'));
      const g = fig(c2, { x: [0, TAU], y: [-PI, PI], aspect: 0.8, maxH: 380, xlabel: T('u (around the axis)', 'u（軸のまわり）'), ticksX: [[0, '0'], [PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [TAU, '2π']], ticksY: [[-PI, '−π'], [-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2'], [PI, 'π']] });
      g.raster((x, y) => Kt(y) / 1.05 * 0.8, { cmap: 'div', res: 4 });
      const chart = (pts, o) => { let seg = [], last = null; pts.forEach(([u, vv]) => { const q = [wrapU(u), wrap(vv)]; if (last && (Math.abs(q[0] - last[0]) > PI || Math.abs(q[1] - last[1]) > PI)) { if (seg.length > 1) g.line(seg, o); seg = []; } seg.push(q); last = q; }); if (seg.length > 1) g.line(seg, o); };
      if (Math.abs(c0) > TR - Tr) { const vb = Math.acos(L.clamp((Math.abs(c0) - TR) / Tr, -1, 1)); [vb, -vb].forEach((y) => g.hline(y, { c: 'ink', w: 1, dash: '3 4', op: 0.6 })); }
      chart(Cl, { c: 'c2', w: 2 });
      chart(C, { c: 'hl', w: 2.6 });
      g.dot(0, v0, { c: 'ink', r: 5.5 });
      g.text(TAU, PI, T('v (around the tube)', 'v（管のまわり）'), { anchor: 'end', small: true, c: 'ink', dx: -4, dy: 14 });
      g.text(TAU, 0, T('outer equator', '外側の赤道'), { anchor: 'end', small: true, c: 'ink', dx: -4, dy: -5 });
      g.text(TAU, -PI, T('inner equator', '内側の赤道'), { anchor: 'end', small: true, c: 'ink', dx: -4, dy: -5 });
      const aU = 2 * (-Tr * Math.sin(v0) / rho(v0)) * up0 * vp0, aV = rho(v0) * Math.sin(v0) / Tr * up0 * up0;
      const kg = Math.hypot(rho(v0) * aU, Tr * aV);
      L.legend(st.leg, [{ c: 'hl', label: T('Geodesic: solves ∇γ̇γ̇ = 0', '測地線：∇γ̇γ̇ = 0 の解') }, { c: 'c2', label: T('Coordinate straight line, same start and direction', '座標直線（同じ出発点と向き）') }, { kind: 'fill', c: 'pos', label: T('K > 0 (outer half)', 'K > 0（外側）') }, { kind: 'fill', c: 'neg', label: T('K < 0 (inner half)', 'K < 0（内側）') }].concat(Math.abs(c0) > TR - Tr ? [{ c: 'ink', dash: true, label: T('Clairaut band: ρ(v) = |c|', 'クレローの帯：ρ(v) = |c|') }] : []));
      ctx.readout([
        { k: T('Clairaut c = ρ cos ψ', 'クレロー定数 c = ρ cos ψ'), v: fmt(c0, 4), tone: 'key' },
        { k: T('drift of c along the geodesic', '測地線に沿った c のずれ'), v: fmt(drift, 2), tone: 'good' },
        { k: T('|∇γ̇γ̇| of the coordinate line at the start', '出発点での座標直線の |∇γ̇γ̇|'), v: fmt(kg, 3), tone: kg > 1e-3 ? 'warn' : undefined },
      ], T(`R = ${TR}, r = ${Tr}; the outer equator is v = 0. ρ = R + r cos v is the distance from the axis, and ψ the angle with the parallel.`, `R = ${TR}、r = ${Tr} で、外側の赤道が v = 0 です。ρ = R + r cos v は軸からの距離、ψ は緯線とのなす角です。`) + (Math.abs(c0) > TR - Tr ? T(' Since |c| > R − r, the geodesic cannot reach the inner equator and oscillates between the dashed lines.', ' |c| > R − r なので測地線は内側の赤道に届かず、破線の間を振動します。') : T(' Since |c| < R − r, the geodesic winds through the hole.', ' |c| < R − r なので、測地線は穴をくぐって巻き付きます。')));
  }

  function geoFrame(ctx) {
    const st = ctx.state;
    if (!st.frame || !st.frame.isConnected) {
      ctx.host.replaceChildren();
      st.frame = L.h('div', '', ctx.host);
      const row = L.h('div', 'lab-row', st.frame);
      st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
      st.cap1 = L.h('p', 'lab-cap', st.c1, T('The torus in 3D, coloured by Gaussian curvature. Drag to turn it.', '3D のトーラス。ガウス曲率で色分けしています。ドラッグで回転できます。'));
      st.v3 = L.h('div', '', st.c1);
      st.leg = L.h('div', '', st.frame);
    }
    return st;
  }
  const X3 = (u, vv, lift = 0) => { const r = rho(vv) + lift * Math.cos(vv); return [r * Math.cos(u), r * Math.sin(u), (Tr + lift) * Math.sin(vv)]; };
  D['geodesic-surface'] = {
    three: true,
    render(ctx, v) {
      const st = geoFrame(ctx);
      st.draw3d = () => {};
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 420, camera: [4.2, -5.6, 4.6], fov: 34,
        init(S) {
          st.flat = false;
          S.surface((u, vv) => X3(u, vv), { u: [0, TAU], v: [-PI, PI], nu: 120, nv: 60, colour: (u, vv) => S.cmap.div(Kt(vv) / 1.05 * 0.9), rough: 0.55, coat: 0.2, wire: true, wireEvery: 8, wireEveryV: 6 });
          st.geo = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.045, glow: 0.35 });
          st.coord = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c2', r: 0.03 });
          st.start = S.sphere([0, 0, 0], 0.085, { c: 'ink' });
          S.label(T('outer equator, K > 0', '外側の赤道、K > 0'), [TR + Tr, 0, 0.1], { small: true, align: 'end' });
          S.label(T('inner equator, K < 0', '内側の赤道、K < 0'), [-(TR - Tr) + 0.12, 0, 0.12], { small: true });
          st.draw3d = (G, Cl, v0) => {
            st.geo.update(G.map(([u, vv]) => X3(u, vv, 0.035)));
            st.coord.update(Cl.map(([u, vv]) => X3(u, vv, 0.03)));
            st.start.at(X3(0, v0, 0.04));
          };
        },
        update(S, vv) { geoRender(ctx, vv, st); },
        fallback(c, vv) { st.flat = true; st.draw3d = () => {}; geoRender(c, vv, st); },
      });
      if (!ctx.state.__v3 && !st.flat) geoRender(ctx, v, st);
    },
  };

  // ---------- 3. Gaussian curvature of a graph ----------
  const gz = (b) => (x, y) => 0.5 * (x * x + b * y * y);
  const gK = (b) => (x, y) => b / (1 + x * x + b * b * y * y) ** 2;
  function gaussQuantities(b, px, py) {
    const a = 1, fx = a * px, fy = b * py, W = Math.sqrt(1 + fx * fx + fy * fy);
    const E = 1 + fx * fx, F = fx * fy, Gg = 1 + fy * fy, Lf = a / W, M = 0, Nf = b / W;
    const Kp = (Lf * Nf - M * M) / (E * Gg - F * F), Hm = (E * Nf - 2 * F * M + Gg * Lf) / (2 * (E * Gg - F * F));
    const disc = Math.sqrt(Math.max(0, Hm * Hm - Kp));
    return { E, F, Gg, Lf, M, Nf, Kp, Hm, k1: Hm + disc, k2: Hm - disc };
  }
  const GR = 1.2;
  function gaussFlat(f, b, px, py, turn, ctx) {
    const z = gz(b), K = gK(b);
    const az = rad(turn), el = rad(28);
    const P = (x, y, zz) => { const xr = x * Math.cos(az) - y * Math.sin(az), yr = x * Math.sin(az) + y * Math.cos(az); return { p: [xr, yr * Math.sin(el) + zz * Math.cos(el)], d: -yr * Math.cos(el) + zz * Math.sin(el) }; };
    const n = 16, quads = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x0 = -GR + 2 * GR * i / n, x1 = -GR + 2 * GR * (i + 1) / n, y0 = -GR + 2 * GR * j / n, y1 = -GR + 2 * GR * (j + 1) / n;
      const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => P(x, y, z(x, y)));
      quads.push({ d: c.reduce((s2, q) => s2 + q.d, 0) / 4, pts: c.map((q) => q.p), k: K((x0 + x1) / 2, (y0 + y1) / 2) });
    }
    quads.sort((p1, p2) => p1.d - p2.d);
    quads.forEach((q) => { const e = f.poly(q.pts, { c: Math.abs(q.k) < 1e-9 ? 'muted' : q.k > 0 ? 'pos' : 'neg', fo: 0.18 + 0.5 * Math.min(1, Math.abs(q.k)), w: 0.8, op: 1, layer: 'under' }); e.style.stroke = 'var(--lab-ink)'; e.style.strokeOpacity = '0.25'; });
    f.line(L.sample(-GR, GR, 60, (x) => P(x, py, z(x, py)).p), { c: 'c1', w: 2.4 });
    f.line(L.sample(-GR, GR, 60, (y) => P(px, y, z(px, y)).p), { c: 'c3', w: 2.4 });
    const pp = P(px, py, z(px, py)).p;
    f.dot(pp[0], pp[1], { c: 'hl', r: 6.5 });
    f.svg.style.cursor = 'grab';
    f.svg.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const d0 = { x: e.clientX, t: ctx.state.turn ?? 35 };
      const move = (ev) => { ctx.state.turn = ((d0.t + (ev.clientX - d0.x) * 0.6 + 540) % 360) - 180; ctx.redraw(); };
      const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    });
  }
  D.gaussian = {
    three: true,
    render(ctx, v) {
      const st = ctx.state, b = -v.saddle;
      st.p ||= [0.45, 0.3];
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('The surface z = ½(x² + b y²) in 3D, coloured by K. Drag the gold point along the surface; drag elsewhere to turn it.', '3D の曲面 z = ½(x² + b y²)。K で色分けしています。金色の点は曲面に沿ってドラッグでき、それ以外の場所をドラッグすると回転します。'));
        st.v3 = L.h('div', '', st.c1);
        st.leg = L.h('div', '', st.frame);
      }
      const draw2d = () => {
        const [px, py] = st.p, z = gz(b), K = gK(b);
        const q = gaussQuantities(b, px, py);
        st.c2.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.c1.replaceChildren();
          L.h('p', 'lab-cap', st.c1, T('The surface z = ½(x² + b y²), shaded by the sign of K. Drag across the picture to turn it.', '曲面 z = ½(x² + b y²)。K の符号で塗り分けています。図をドラッグすると回転します。'));
          gaussFlat(fig(st.c1, { axes: false, x: [-1.9, 1.9], y: [-1.45, 2.15], equal: true, maxH: 380 }), b, px, py, st.turn ?? 35, ctx);
        }
        L.h('p', 'lab-cap', st.c2, T('Gaussian curvature K(x, y) from above, with contours of height. Drag the gold point.', '上から見たガウス曲率 K(x, y) と高さの等高線。金色の点をドラッグできます。'));
        const g = fig(st.c2, { x: [-GR, GR], y: [-GR, GR], equal: true, maxH: 360, xlabel: 'x', ylabel: 'y' });
        g.raster((x, y) => K(x, y) * 0.85, { cmap: 'div', res: 3 });
        for (const c of [-0.6, -0.4, -0.2, 0.2, 0.4, 0.6]) {
          [1, -1].forEach((sg) => { const pts = L.sample(-GR, GR, 120, (y) => { const qq = (2 * c - b * y * y); return qq >= 0 ? [sg * Math.sqrt(qq), y] : [NaN, NaN]; }); g.line(pts, { c: 'ink', w: 0.9, op: 0.45 }); });
        }
        g.line([[-GR, py], [GR, py]], { c: 'c1', w: 1.6, dash: '5 4' });
        g.line([[px, -GR], [px, GR]], { c: 'c3', w: 1.6, dash: '5 4' });
        g.handle(px, py, { c: 'hl', label: T('Point on the surface', '曲面上の点'), onDrag: (x, y) => { st.p = [x, y]; ctx.redraw(); } });
        L.legend(st.leg, [{ kind: 'fill', c: 'pos', label: T('K > 0: bowl-like', 'K > 0：鉢型') }, { kind: 'fill', c: 'neg', label: T('K < 0: saddle-like', 'K < 0：鞍型') }, { c: 'c1', label: T('curve y = const through the point', '点を通る y = 一定の曲線') }, { c: 'c3', label: T('curve x = const through the point', '点を通る x = 一定の曲線') }, { c: 'ink', label: T('contours of z', 'z の等高線') }]);
        ctx.readout([
          { k: 'E, F, G', v: `${fmt(q.E, 3)}, ${fmt(q.F, 3)}, ${fmt(q.Gg, 3)}` },
          { k: 'L, M, N', v: `${fmt(q.Lf, 3)}, ${fmt(q.M, 3)}, ${fmt(q.Nf, 3)}` },
          { k: 'K = (LN − M²)/(EG − F²)', v: fmt(q.Kp, 4), tone: 'key' },
          { k: 'κ₁, κ₂', v: `${fmt(q.k1, 3)}, ${fmt(q.k2, 3)}` },
          { k: T('K at the origin = b', '原点での K = b'), v: fmt(b, 3) },
        ], Math.abs(b) < 1e-9 ? T('With b = 0 the surface is a parabolic cylinder: one principal curvature vanishes, K = 0 everywhere, and the surface can be unrolled onto a plane without stretching.', 'b = 0 では曲面は放物柱面で、主曲率の一方が 0 になり、至るところ K = 0 です。伸縮なしに平面へ展開できます。') : b > 0 ? T('Both principal curvatures have the same sign: the surface bends the same way in every direction.', '2つの主曲率が同符号なので、どの方向にも同じ向きに曲がります。') : T('The principal curvatures have opposite signs: the surface bends up in one direction and down in the other.', '主曲率が異符号なので、一方の方向には上に、他方には下に曲がります。'));
        return { z };
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 420, camera: [3.3, -3.9, 2.9], target: [0, 0, 0.15], fov: 32,
        init(S) {
          st.flat = false; st.b = b;
          st.surf = S.graph(gz(b), { x: [-GR, GR], y: [-GR, GR], nu: 90, nv: 90, colour: (u, w) => S.cmap.div(gK(st.b)(u, w) * 1.9), rough: 0.5, coat: 0.45, wire: true, wireEvery: 9, wireEveryV: 9 });
          st.cx = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.022 });
          st.cy = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c3', r: 0.022 });
          st.n = S.arrow([0, 0, 0], [0, 0, 0.5], { c: 'ink', r: 0.014 });
          st.h = S.handle([0, 0, 0], { r: 0.075, plane: [[0, 0, 1], [0, 0, 0]], bounds: [-GR, GR, -GR, GR], onDrag: (q) => { st.p = [q.x, q.y]; ctx.redraw(); return [q.x, q.y, gz(st.b)(q.x, q.y) + 0.02]; } });
          st.lab = S.label('K', [0, 0, 0], { small: true });
        },
        update(S, vv) {
          const bb = -vv.saddle, z = gz(bb);
          if (st.b !== bb) { st.b = bb; st.surf.update(z); }
          const [px, py] = st.p, lift = 0.012;
          st.cx.update(L.sample(-GR, GR, 80, (x) => [x, py, z(x, py) + lift]).map((q) => q));
          st.cy.update(L.sample(-GR, GR, 80, (y) => [px, y, z(px, y) + lift]).map((q) => q));
          const fx = px, fy = bb * py, W = Math.hypot(1, fx, fy);
          st.n.set([px, py, z(px, py)], [-fx / W * 0.5, -fy / W * 0.5, 1 / W * 0.5]);
          st.h.at([px, py, z(px, py) + 0.02]);
          st.lab.set([px, py, z(px, py) + 0.12], 'K = ' + fmt(gaussQuantities(bb, px, py).Kp, 3));
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
