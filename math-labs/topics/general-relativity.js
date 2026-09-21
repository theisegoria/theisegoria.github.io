'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  // A black hole reads as dark in either theme: filled with ink on a light page, with the plate on a dark one.
  const hole = (f, r) => { const c = L.colours().ink, dark = c[0] + c[1] + c[2] < 384; f.circle(0, 0, r, { c: 'ink', fill: dark ? 'ink' : 'plate', fo: 0.95, w: dark ? 1 : 2.4 }); };

  /* ---------- 1. Flamm's paraboloid ---------- */
  const zE = (r, rs) => 2 * Math.sqrt(Math.max(0, rs * (r - rs)));
  const proper = (r, rs) => Math.sqrt(r * (r - rs)) + rs * Math.log((Math.sqrt(r) + Math.sqrt(r - rs)) / Math.sqrt(rs));

  D['gravity-well'] = {
    render(ctx, v) {
      const rs = v.radius, r0 = v.distance * rs, RM = 10.5, hM = zE(RM, rs), k = 0.3;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The equatorial plane embedded as a surface (drawn in perspective)', '赤道面を曲面として埋め込んだ図（斜めから見た図）'));
      L.h('p', 'lab-cap', c2, T('Its profile z(r): distance along the curve is proper distance', '断面 z(r)：曲線に沿った長さが固有距離です'));
      const f = L.fig(c1, { x: [-RM - 0.3, RM + 0.3], y: [-k * RM - 0.6, hM + k * RM + 0.8], equal: true, axes: false, maxH: 380 });
      const S = (r, p) => [r * Math.cos(p), zE(r, rs) + k * r * Math.sin(p)];
      const ring = (r, o, oBack) => {
        f.line(L.seq(61, (i) => S(r, Math.PI * i / 60)), oBack || Object.assign({}, o, { op: (o.op ?? 1) * 0.45, dash: '3 3' }));
        f.line(L.seq(61, (i) => S(r, Math.PI + Math.PI * i / 60)), o);
      };
      for (let j = 0; j < 12; j++) { const p = j / 12 * L.TAU, back = Math.sin(p) > 0.01; f.line(L.sample(rs, RM, 60, (r) => S(r, p)), { c: 'c1', w: 0.9, op: back ? 0.3 : 0.6, layer: 'under' }); }
      for (let j = 1; j <= 9; j++) { const r = rs + (RM - rs) * (j / 9) ** 1.6; ring(r, { c: 'c1', w: 0.9, op: 0.6, layer: 'under' }); }
      ring(rs, { c: 'c2', w: 2.6 });
      ring(r0, { c: 'hl', w: 3 });
      f.text(0, zE(rs, rs) - k * rs, T('horizon r = rₛ', '地平面 r = rₛ'), { c: 'c2', small: true, dy: 16 });
      f.text(r0, zE(r0, rs), `r = ${fmt(r0, 2)}`, { anchor: 'start', dx: 8, dy: 4, small: true });
      // right: profile
      const g = L.fig(c2, { x: [0, RM], y: [0, Math.max(hM, 3) * 1.08], aspect: 0.9, maxH: 380, xlabel: 'r', ylabel: 'z' });
      g.rect(0, 0, rs, Math.max(hM, 3) * 1.08, { c: 'muted', fo: 0.12, nostroke: true, layer: 'under' });
      g.text(rs / 2, Math.max(hM, 3) * 0.55, T('r < rₛ', 'r < rₛ'), { small: true, c: 'muted' });
      g.line(L.sample(rs, RM, 200, (r) => zE(r, rs)), { c: 'c1', w: 2 });
      g.line(L.sample(rs, r0, 120, (r) => zE(r, rs)), { c: 'hl', w: 5, op: 0.9 });
      g.line([[rs, 0.04], [r0, 0.04]], { c: 'c2', w: 4 });
      const z0 = zE(r0, rs), sl = Math.sqrt(rs / (r0 - rs)), dx = 1.2 / Math.sqrt(1 + sl * sl);
      g.line([[r0 - dx, z0 - sl * dx], [r0 + dx, z0 + sl * dx]], { c: 'ink', w: 1.2, dash: '4 3' });
      g.vline(rs, { c: 'c2', dash: '3 3' });
      g.handle(r0, z0, { c: 'hl', r: 8, axis: 'x', bounds: [1.05 * rs, Math.min(5 * rs, RM), 0, 99], label: T('Radius r', '半径 r'), onDrag: (x) => ctx.set('distance', x / rs) });
      const Lp = proper(r0, rs);
      L.legend(ctx.host, [{ c: 'c1', label: T('embedded surface z = 2√(rₛ(r − rₛ))', '埋め込み曲面 z = 2√(rₛ(r − rₛ))') }, { c: 'c2', label: T('horizon, and the coordinate difference r − rₛ', '地平面と座標の差 r − rₛ') }, { c: 'hl', label: T('proper radial distance from the horizon', '地平面からの固有動径距離') }]);
      ctx.readout([{ k: 'r / rₛ', v: fmt(v.distance, 3) }, { k: T('proper distance ∫dr/√(1 − rₛ/r)', '固有距離 ∫dr/√(1 − rₛ/r)'), v: fmt(Lp, 3), tone: 'key' }, { k: 'r − rₛ', v: fmt(r0 - rs, 3) }, { k: T('slope dz/dr', '傾き dz/dr'), v: fmt(sl, 3) }],
        T('Rulers laid radially measure more than the difference in r, because r is defined by circumference 2πr. The surface is steepest at the horizon.', '動径方向に並べた物差しは r の差より長くなります。r は円周 2πr で定義されるからです。曲面は地平面で最も急になります。'));
    },
  };

  /* ---------- 2. Gravitational time dilation ---------- */
  D['time-dilation'] = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const r = v.distance, lapse = Math.sqrt(1 - 1 / r);
      L.h('p', 'lab-cap', ctx.host, T('A static clock at radius r and a reference clock far away (radii in units of rₛ, sizes not to scale)', '半径 r で静止する時計と遠方の基準時計（半径は rₛ 単位、大きさは実寸ではありません）'));
      const s = L.fig(ctx.host, { x: [-1.3, 12], y: [-1.45, 1.55], equal: true, axes: false, maxH: 260 });
      hole(s, 1);
      s.text(0, -1, T('horizon', '地平面'), { small: true, dy: 16, c: 'muted' });
      s.line([[1, -1.2], [9.2, -1.2]], { c: 'muted', w: 1 });
      for (let q = 1; q <= 8; q++) { s.seg([q, -1.25], [q, -1.15], { c: 'muted', w: 1 }); s.text(q, -1.2, String(q), { small: true, dy: 14, c: 'muted' }); }
      s.text(10.9, -1.2, 'r → ∞', { small: true, dy: 14, c: 'muted' });
      const clockA = [r, 0.1], clockB = [10.9, 0.1], R = 0.62;
      [clockA, clockB].forEach(([x, y], i) => {
        s.circle(x, y, R, { c: i ? 'ink' : 'c1', w: 2, fill: 'plate', fo: 1 });
        for (let q = 0; q < 12; q++) { const a = q / 12 * L.TAU; s.seg([x + 0.84 * R * Math.sin(a), y + 0.84 * R * Math.cos(a)], [x + R * Math.sin(a), y + R * Math.cos(a)], { c: 'muted', w: 1 }); }
      });
      s.layers.anim = s.group('over');
      const draw = (t) => {
        s.clear('anim');
        [[clockA, t * lapse, 'c1', 'τ'], [clockB, t, 'ink', 't']].forEach(([[x, y], val, c, nm]) => {
          const a = val / 6 * L.TAU;
          s.line([[x, y], [x + 0.8 * R * Math.sin(a), y + 0.8 * R * Math.cos(a)]], { c, w: 3, layer: 'anim' });
          s.text(x, y + R + 0.1, `${nm} = ${fmt(val, 2)}`, { small: true, dy: -4, c, layer: 'anim' });
        });
      };
      st.t ??= 12;
      st.anim = L.animator(ctx.host, (dt, t) => { st.t = t; draw(t); }, { autoplay: true, initialT: st.t, playLabel: T('Run the clocks', '時計を動かす') });
      s.seg([r, -1.2], [r, 0.1 - R], { c: 'c1', w: 1.2, dash: '2 3' });
      s.handle(r, -1.2, { c: 'c1', r: 8, axis: 'x', bounds: [1.05, 8, -1.2, -1.2], snap: 0.05, label: T('Clock radius r', '時計の半径 r'), onDrag: (x) => ctx.set('distance', x) });
      // lapse curve
      const g = L.fig(ctx.host, { x: [1, 8], y: [0, 1.15], aspect: 0.4, maxH: 280, xlabel: 'r / rₛ', ylabel: 'dτ/dt' });
      g.hline(1, { c: 'muted', dash: '4 4' });
      g.line(L.sample(1, 8, 300, (x) => Math.sqrt(Math.max(0, 1 - 1 / x))), { c: 'c1', w: 2.4 });
      g.line(L.sample(1.02, 8, 300, (x) => 1 - 0.5 / x), { c: 'c2', w: 1.6, dash: '5 4' });
      g.vline(r, { c: 'hl', dash: '2 3' });
      g.dot(r, lapse, { c: 'hl', r: 6.5 });
      g.text(r, lapse, fmt(lapse, 3), { dx: r > 6.5 ? -10 : 10, dy: 18, anchor: r > 6.5 ? 'end' : 'start', small: true });
      L.legend(ctx.host, [{ c: 'c1', label: T('exact: dτ/dt = √(1 − rₛ/r)', '厳密：dτ/dt = √(1 − rₛ/r)') }, { c: 'c2', dash: true, label: T('weak-field estimate 1 − rₛ/2r = 1 + Φ/c²', '弱重力場の近似 1 − rₛ/2r = 1 + Φ/c²') }, { kind: 'dot', c: 'hl', label: T('this clock', 'この時計') }]);
      ctx.readout([{ k: 'r / rₛ', v: fmt(r, 3) }, { k: 'dτ/dt', v: fmt(lapse, 4), tone: 'key' }, { k: T('lost per far-away hour', '遠方の1時間あたりの遅れ'), v: `${fmt((1 - lapse) * 60, 3)} min` }, { k: T('redshift 1 + z of light sent out', '外へ送った光の赤方偏移 1 + z'), v: fmt(1 / lapse, 4) }],
        T('Drag the blue clock. Near the horizon it barely advances while the far clock keeps its pace; far away the two agree.', '青の時計をドラッグできます。地平面の近くではほとんど進まず、遠方の時計は普段どおり進みます。遠く離れると両者は一致します。'));
    },
  };

  /* ---------- 3. Light bending: exact null geodesics (rₛ = 1) ---------- */
  // Orbit equation u'' + u = (3/2) u², u = rₛ/r, integrated in φ with RK4 from u = 0 at infinity.
  function ray(b, keep = true, h = 0.004) {
    let u = 0, w = 1 / b, phi = 0, umax = 0;
    const pts = [], acc = (uu) => -uu + 1.5 * uu * uu;
    const push = () => { if (!keep || u < 1 / 80) return; const r = 1 / u, ps = Math.PI - phi; pts.push([r * Math.cos(ps), r * Math.sin(ps)]); };
    while (phi < 10 * Math.PI) {
      const k1u = w, k1w = acc(u);
      const k2u = w + h / 2 * k1w, k2w = acc(u + h / 2 * k1u);
      const k3u = w + h / 2 * k2w, k3w = acc(u + h / 2 * k2u);
      const k4u = w + h * k3w, k4w = acc(u + h * k3u);
      const un = u + h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u), wn = w + h / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
      if (un < 0) { phi += h * u / (u - un); return { pts, captured: false, alpha: phi - Math.PI, umax }; }
      u = un; w = wn; phi += h; umax = Math.max(umax, u);
      if (u > 1) { push(); return { pts, captured: true, alpha: Infinity, umax }; }
      push();
    }
    return { pts, captured: true, alpha: Infinity, umax };
  }
  const BC = 1.5 * Math.sqrt(3);
  let curve = null;
  const alphaCurve = () => curve ||= L.seq(140, (i) => { const b = BC + 0.004 + (20 - BC) * (i / 139) ** 2.2; return [b, ray(b, false, 0.003).alpha]; });

  D['light-deflection'] = {
    render(ctx, v) {
      const b = v.impact, R0 = ray(b), E = Math.max(6, 1.35 * b);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Light rays past a black hole, computed from the exact orbit equation (lengths in rₛ)', 'ブラックホールをかすめる光線（厳密な軌道方程式による。長さは rₛ 単位）'));
      L.h('p', 'lab-cap', c2, T('Deflection angle α against impact parameter b', '偏向角 α と衝突パラメータ b'));
      const f = L.fig(c1, { x: [-1.35 * E, 1.35 * E], y: [-0.75 * E, 1.15 * E], equal: true, axes: false, maxH: 400 });
      for (const fr of [0.2, 0.35, 0.55, 0.8, 1.05]) {
        const bb = fr * E; if (Math.abs(bb - b) < 0.06 * E) continue;
        const q = ray(bb);
        f.line(q.pts, { c: q.captured ? 'c2' : 'c1', w: 1.1, op: 0.45 });
      }
      f.line([[-2 * E, b], [2 * E, b]], { c: 'muted', w: 1.2, dash: '5 4' });
      f.line(R0.pts, { c: 'hl', w: 3 });
      f.circle(0, 0, 1.5, { c: 'c4', w: 1.2, dash: '3 3' });
      hole(f, 1);
      if (E < 12) f.text(0, -1.5, T('photon sphere 1.5 rₛ', '光子球 1.5 rₛ'), { small: true, c: 'c4', dy: 14 });
      f.text(-1.3 * E, b, T('undeflected', '偏向なし'), { anchor: 'start', small: true, dy: -6, c: 'muted' });
      if (!R0.captured) {
        const inside = R0.pts.filter(([x, y], i) => i > R0.pts.length / 2 && Math.abs(x) < 1.25 * E && y > -0.68 * E && y < 1.1 * E);
        const p = inside[inside.length - 1];
        if (p) f.text(p[0], p[1], `α = ${fmt(R0.alpha * 180 / Math.PI, 3)}°`, { anchor: p[0] > 0 ? 'end' : 'start', small: true, dy: -10, c: 'hl' });
      }
      // right: α(b)
      const cv = alphaCurve(), yM = 2.2;
      const g = L.fig(c2, { x: [2, 20], y: [0, yM], aspect: 0.9, maxH: 400, xlabel: 'b / rₛ', ylabel: T('α (rad)', 'α（rad）') });
      g.rect(2, 0, BC - 2, yM, { c: 'c2', fo: 0.15, nostroke: true, layer: 'under' });
      g.text((2 + BC) / 2, yM * 0.5, T('captured', '捕獲'), { small: true, c: 'c2' });
      g.vline(BC, { c: 'c2', dash: '3 3' });
      g.line(L.sample(2, 20, 200, (x) => 2 / x), { c: 'c2', w: 1.8, dash: '6 4' });
      g.line(cv.filter(([, a]) => Number.isFinite(a)).map(([x, a]) => [x, Math.min(a, yM * 1.5)]), { c: 'c1', w: 2.4 });
      g.dot(b, 2 / b, { c: 'c2', r: 4.5, hollow: true });
      if (!R0.captured) g.dot(b, Math.min(R0.alpha, yM), { c: 'hl', r: 6.5 });
      g.handle(b, R0.captured ? 0.08 : Math.min(R0.alpha, yM - 0.05), { c: 'hl', r: 8, axis: 'x', bounds: [2, 20, 0, 9], snap: 0.1, label: T('Impact parameter b', '衝突パラメータ b'), onDrag: (x) => ctx.set('impact', x) });
      L.legend(ctx.host, [{ c: 'hl', label: T('this ray', 'この光線') }, { c: 'c1', label: T('exact deflection (numerical geodesic)', '厳密な偏向角（測地線の数値計算）') }, { c: 'c2', dash: true, label: T('weak-field formula α ≈ 2rₛ/b', '弱重力場の式 α ≈ 2rₛ/b') }, { c: 'c4', dash: true, label: T('photon sphere r = 1.5 rₛ', '光子球 r = 1.5 rₛ') }]);
      const weak = 2 / b;
      ctx.readout(R0.captured
        ? [{ k: 'b / rₛ', v: fmt(b, 3) }, { k: T('fate', '結果'), v: T('captured', '捕獲'), tone: 'warn' }, { k: T('critical b = (3√3/2) rₛ', '臨界値 b = (3√3/2) rₛ'), v: fmt(BC, 4) }, { k: T('weak-field formula says', '弱重力場の式の値'), v: `${fmt(weak * 180 / Math.PI, 3)}°` }]
        : [{ k: 'b / rₛ', v: fmt(b, 3) }, { k: T('exact α', '厳密な α'), v: `${fmt(R0.alpha * 180 / Math.PI, 4)}°`, tone: 'key' }, { k: T('weak-field 2rₛ/b', '弱重力場 2rₛ/b'), v: `${fmt(weak * 180 / Math.PI, 4)}°` }, { k: T('error of the estimate', '近似の誤差'), v: `${fmt((weak / R0.alpha - 1) * 100, 3)} %`, tone: Math.abs(weak / R0.alpha - 1) > 0.1 ? 'warn' : undefined }, { k: T('closest approach', '最接近距離'), v: `${fmt(1 / R0.umax, 3)} rₛ` }],
        R0.captured ? T('Below b = 2.598 rₛ the ray spirals in and crosses the horizon; no finite deflection exists.', 'b = 2.598 rₛ より小さいと光線は渦を巻いて地平面を越え、有限の偏向角は存在しません。') : T('Far out the two curves merge; near the photon sphere the exact angle grows without bound and the ray can loop around the hole.', '遠方では2つの曲線は一致します。光子球に近づくと厳密な角度は限りなく大きくなり、光線はブラックホールの周りを回ることもあります。'));
    },
  };
})();
