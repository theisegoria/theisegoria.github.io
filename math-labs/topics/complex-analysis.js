'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = L.TAU;
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const pw = (z, k) => { let r = [1, 0]; for (let i = 0; i < k; i++) r = mul(r, z); return r; };
  const cexp = (z) => { const m = Math.exp(z[0]); return [m * Math.cos(z[1]), m * Math.sin(z[1])]; };
  const arg = (z) => Math.atan2(z[1], z[0]);
  const deg = (r) => r * 180 / PI;
  const cstr = (z, d = 3) => `${fmt(z[0], d)} ${z[1] < 0 ? '−' : '+'} ${fmt(Math.abs(z[1]), d)}i`;
  const arc = (c, r, a0, a1, n = 24) => L.seq(n + 1, (i) => { const t = a0 + (a1 - a0) * i / n; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; });

  /* ---------- 1. conformal maps z -> z^k ---------- */
  D.conformal = {
    render(ctx, v) {
      const k = Math.round(v.power), ang = v.angle * PI / 180, st = ctx.state;
      st.z0 ||= [0.8, 0.5];
      const z0 = st.z0, F = (z) => pw(z, k), w0 = F(z0);
      const R = 1.5, W = Math.min(7, Math.max(1.6, Math.pow(1.55, k)));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('z-plane: a grid and two short curves through z₀. Drag z₀.', 'z 平面：格子と z₀ を通る2本の短い曲線。z₀ をドラッグできます。'));
      L.h('p', 'lab-cap', c2, T(`w-plane: their images under w = z${['', '', '²', '³', '⁴'][k]}.`, `w 平面：w = z${['', '', '²', '³', '⁴'][k]} による像。`));
      const a = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, maxH: 380, xlabel: 'Re z', ylabel: 'Im z' });
      const b = L.fig(c2, { x: [-W, W], y: [-W, W], equal: true, maxH: 380, xlabel: 'Re w', ylabel: 'Im w' });
      for (let i = -6; i <= 6; i++) {
        const s = i * 0.25;
        const vert = L.sample(-R, R, 160, (y) => [s, y]), hor = L.sample(-R, R, 160, (x) => [x, s]);
        const o = { w: i === 0 ? 1.4 : 0.9, op: i === 0 ? 0.7 : 0.4, layer: 'under' };
        a.line(vert, Object.assign({ c: 'c1' }, o)); a.line(hor, Object.assign({ c: 'c3' }, o));
        b.line(vert.map(F), Object.assign({ c: 'c1' }, o)); b.line(hor.map(F), Object.assign({ c: 'c3' }, o));
      }
      const th1 = 0.35, th2 = th1 + ang, len = 0.42;
      const probe = (th) => L.sample(-len, len, 60, (t) => [z0[0] + t * Math.cos(th) + 0.25 * t * t * Math.sin(th), z0[1] + t * Math.sin(th) - 0.25 * t * t * Math.cos(th)]);
      const p1 = probe(th1), p2 = probe(th2);
      a.line(p1, { c: 'c2', w: 3 }); a.line(p2, { c: 'c4', w: 3 });
      b.line(p1.map(F), { c: 'c2', w: 3 }); b.line(p2.map(F), { c: 'c4', w: 3 });
      // measured angle between image curves at w0
      const eps = 1e-4, dirOut = (th) => { const q = F([z0[0] + eps * Math.cos(th), z0[1] + eps * Math.sin(th)]); return arg([q[0] - w0[0], q[1] - w0[1]]); };
      let out = dirOut(th2) - dirOut(th1); out = ((out % TAU) + TAU) % TAU;
      a.line(arc(z0, 0.16, th1, th2), { c: 'hl', w: 2.2 });
      const r0 = Math.hypot(...z0), d1 = dirOut(th1);
      b.line(arc(w0, 0.1 * W, d1, d1 + out), { c: 'hl', w: 2.2 });
      a.text(z0[0], z0[1], `${fmt(v.angle, 0)}°`, { dx: 14, dy: -14, anchor: 'start', small: true });
      b.dot(w0[0], w0[1], { c: 'hl', r: 5 });
      b.text(w0[0], w0[1], `${fmt(deg(out), 1)}°`, { dx: 12, dy: -12, anchor: 'start', small: true });
      a.handle(z0[0], z0[1], { c: 'hl', snap: 0.05, bounds: [-1.3, 1.3, -1.3, 1.3], label: T('Point z₀', '点 z₀'), onDrag: (x, y) => { st.z0 = [x, y]; ctx.redraw(); } });
      const dF = k === 1 ? [1, 0] : mul([k, 0], pw(z0, k - 1));
      L.legend(ctx.host, [{ c: 'c1', label: T('lines Re z = const', '直線 Re z = 一定') }, { c: 'c3', label: T('lines Im z = const', '直線 Im z = 一定') }, { c: 'c2', label: T('curve 1', '曲線 1') }, { c: 'c4', label: T('curve 2', '曲線 2') }]);
      const crit = r0 < 1e-9 && k > 1;
      ctx.readout([
        { k: "f′(z₀) = kz₀ᵏ⁻¹", v: cstr(dF, 3) },
        { k: T('local scale |f′|', '局所的な拡大率 |f′|'), v: fmt(Math.hypot(...dF), 3) },
        { k: T('rotation arg f′', '回転 arg f′'), v: crit ? '·' : `${fmt(deg(arg(dF)), 1)}°` },
        { k: T('angle in → out', '角度 入力 → 出力'), v: `${fmt(v.angle, 0)}° → ${fmt(deg(out), 1)}°`, tone: crit ? 'warn' : 'good' },
      ], crit ? T(`At z₀ = 0 the derivative vanishes and every angle is multiplied by ${k}.`, `z₀ = 0 では導関数が0になり、すべての角度が ${k} 倍されます。`) : T('Both curves turn by the same arg f′(z₀) and stretch by |f′(z₀)|, so the angle between them survives. Drag z₀ to 0 to break it.', '2本の曲線は同じ arg f′(z₀) だけ回転し、|f′(z₀)| 倍に伸びるので、間の角度は保たれます。z₀ を0へ動かすと崩れます。'));
    },
  };

  /* ---------- 2. residues ---------- */
  // f(z) = 1/(z - a) + 2/(z - b), a = pole on the real axis, b = 0.9 + 0.9i; contour |z - c| = r anticlockwise
  const RB = [0.9, 0.9];
  function residueModel(v) {
    const c = [v.cx ?? 0, v.cy ?? 0], r = v.radius, A = [v.pole, 0];
    const poles = [{ p: A, res: 1, name: 'a' }, { p: RB, res: 2, name: 'b' }];
    const f = (z) => { const u = div([1, 0], [z[0] - A[0], z[1] - A[1]]), w = div([2, 0], [z[0] - RB[0], z[1] - RB[1]]); return [u[0] + w[0], u[1] + w[1]]; };
    // running integral along the positively oriented circle, trapezoid rule
    const M = 2400, path = [[0, 0]];
    let I = [0, 0], prev = null;
    for (let j = 0; j <= M; j++) {
      const t = TAU * j / M, e = [Math.cos(t), Math.sin(t)];
      const g = mul(f([c[0] + r * e[0], c[1] + r * e[1]]), [-r * e[1], r * e[0]]);
      if (prev) { I = [I[0] + (prev[0] + g[0]) / 2 * TAU / M, I[1] + (prev[1] + g[1]) / 2 * TAU / M]; path.push(I.slice()); }
      prev = g;
    }
    const dist = poles.map((P) => Math.hypot(P.p[0] - c[0], P.p[1] - c[1]) - r);
    const near = dist.some((d) => Math.abs(d) < 0.04);
    const inside = poles.filter((P, i) => dist[i] < 0);
    const sum = inside.reduce((s, P) => s + P.res, 0);
    return { c, r, A, poles, f, path, I, M, dist, near, inside, sum };
  }
  // height of the modulus surface: log|f|, compressed smoothly so the poles stay in the frame
  const RZ = (lg) => (lg >= 0 ? 0.75 * 2.2 * Math.tanh(lg / 2.2) : 0.75 * 1.1 * Math.tanh(lg / 1.1));
  const RBOX = 2.2;
  function residuePhase2D(host, m, ctx) {
    const { c, r, poles, f, dist } = m;
    const a = L.fig(host, { x: [-RBOX, RBOX], y: [-RBOX, RBOX], equal: true, maxH: 380, xlabel: 'Re z', ylabel: 'Im z' });
    const col = L.colours();
    a.raster((x, y) => { const w = f([x, y]), p = L.cmaps.phase(arg(w), Math.hypot(...w)); return [p[0] * 0.55 + col.plate[0] * 0.45, p[1] * 0.55 + col.plate[1] * 0.45, p[2] * 0.55 + col.plate[2] * 0.45]; }, { res: 3 });
    a.circle(c[0], c[1], r, { c: 'ink', w: 2.8 });
    for (let q = 0; q < 4; q++) { const t = q * PI / 2 + PI / 4, p = [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)], d = [-Math.sin(t), Math.cos(t)]; a.arrow([p[0] - d[0] * 0.02, p[1] - d[1] * 0.02], [p[0] + d[0] * 0.2, p[1] + d[1] * 0.2], { c: 'ink', w: 2.2 }); }
    poles.forEach((P, i) => {
      a.dot(P.p[0], P.p[1], { c: dist[i] < 0 ? 'hl' : 'ink', r: 6.5 });
      if (i === 0) { const right = P.p[0] >= c[0] ? P.p[0] < 1.4 : P.p[0] < -1.4; a.text(P.p[0], P.p[1], T(`Res ${P.res}`, `留数 ${P.res}`), right ? { dx: 10, dy: 4, anchor: 'start', small: true } : { dx: -10, dy: 4, anchor: 'end', small: true }); }
      else a.text(P.p[0], P.p[1], T(`Res ${P.res}`, `留数 ${P.res}`), { dy: -12, small: true });
    });
    a.handle(c[0], c[1], { c: 'c2', r: 7, bounds: [-1.8, 1.8, -1.8, 1.8], snap: 0.05, label: T('Centre of the contour', '経路の中心'), onDrag: (x, y) => { ctx.set('cx', x, true); ctx.set('cy', y); } });
    return a;
  }
  D.residue = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('log|f| as a surface over the z-plane, coloured by the phase of f. The poles rise as towers, the zero of f sinks as a pit (heights compressed near the poles). The contour γ runs on the surface; drag the orange point at its centre. Enclosed poles are labelled in gold.', 'z 平面の上の曲面 log|f|。色は f の偏角です。極は塔のようにそびえ、f の零点は穴のように沈みます（極の近くでは高さを圧縮しています）。経路 γ は曲面の上に描かれ、中心の橙色の点をドラッグできます。囲まれた極は金色で示します。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The running integral ∫f dz as you travel once round the circle.', '円を1周する間の途中までの積分 ∫f dz。'));
        st.g2 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
        L.legend(st.leg, [{ c: 'ink', label: T('contour γ, counterclockwise', '経路 γ（反時計回り）') }, { kind: 'dot', c: 'hl', label: T('enclosed pole; final value of the integral', '囲まれた極・積分の最終値') }, { c: 'c1', label: T('running integral', '途中までの積分') }, { kind: 'dot', c: 'c2', label: T('centre of the contour (drag)', '経路の中心（ドラッグ）') }]);
      }
      const m = residueModel(v);
      st.m = m;
      // the running integral panel
      st.g2.replaceChildren();
      const b = L.fig(st.g2, { x: [-11, 11], y: [-4, 22], equal: true, maxH: 380, xlabel: 'Re', ylabel: 'Im' });
      [0, 1, 2, 3].forEach((k) => { b.hline(TAU * k, { c: 'muted', w: 1, dash: '3 4' }); b.text(11, TAU * k, k ? `${2 * k}πi` : '0', { anchor: 'end', dx: -4, dy: -5, small: true, c: 'muted' }); });
      b.line(m.path, { c: 'c1', w: 1.4, op: 0.3 });
      b.dot(0, 0, { c: 'ink', r: 4 });
      st.b = b;
      ctx.readout([
        { k: T('poles inside', '内部の極'), v: m.inside.length ? m.inside.map((P) => P.name).join(', ') : T('none', 'なし') },
        { k: T('2πi × Σ Res', '2πi × Σ 留数'), v: m.sum ? `${2 * m.sum}πi` : '0', tone: 'key' },
        { k: T('numerical ∮ f dz', '数値計算の ∮ f dz'), v: m.near ? T('pole on γ', '極が γ 上') : cstr(m.I, 3), tone: m.near ? 'warn' : 'good' },
      ], m.near ? T('A pole sits on the contour, so the integral is undefined; move the circle off it.', '極が経路上にあるため積分は定義されません。円を極からずらしてください。') : T('f(z) = 1/(z − a) + 2/(z − b). With no pole inside, the running integral wanders and comes back to 0; otherwise it ends exactly at 2πi·ΣRes.', 'f(z) = 1/(z − a) + 2/(z − b)。内部に極がなければ途中までの積分はさまよった後に0へ戻り、極があればちょうど 2πi·Σ留数 で終わります。'));
      const height = (x, y) => { const w = st.m.f([x, y]); return RZ(Math.log(Math.hypot(w[0], w[1]))); };
      const drawAt = (u) => {
        const mm = st.m, k = Math.round(L.clamp(u, 0, 1) * mm.M);
        st.b.clear('over');
        st.b.line(mm.path.slice(0, k + 1), { c: 'c1', w: 2.4, layer: 'over' });
        const P = mm.path[k];
        st.b.dot(P[0], P[1], { c: k === mm.M ? 'hl' : 'c2', r: 6.5, layer: 'over' });
        if (st.S && !st.flat) {
          const t = TAU * k / mm.M, x = mm.c[0] + mm.r * Math.cos(t), y = mm.c[1] + mm.r * Math.sin(t);
          st.walker.at([x, y, height(x, y) + 0.06]);
          st.walker.visible = k < mm.M;
          st.S.invalidate();
        }
      };
      const DUR = 4;
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lab) => { const u = Math.min(1, t / DUR); drawAt(u); lab.textContent = u < 1 ? T(`${Math.round(u * 360)}° round the contour`, `経路を ${Math.round(u * 360)}° 進んだところ`) : ''; return t < DUR; }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Walk the contour', '経路を一周する') });
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 470, camera: [4.6, -7.6, 5.3], target: [0, 0, 0.05], fov: 33,
        init(S) {
          st.flat = false; st.S = S;
          st.surf = S.graph((x, y) => height(x, y), { x: [-RBOX, RBOX], y: [-RBOX, RBOX], nu: 150, nv: 150, rough: 0.5, coat: 0.35, wire: true, wireEvery: 15, wireEveryV: 15, wireOpacity: 0.12, colour: (x, y) => { const w = st.m.f([x, y]); return S.cmap.phase(arg(w), Math.hypot(w[0], w[1])); } });
          st.ring = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'ink', r: 0.026, closed: true });
          st.poleLabs = [S.label(T('Res 1', '留数 1'), [0, 0, 1.75], { small: true, align: 'middle' }), S.label(T('Res 2', '留数 2'), [RB[0], RB[1], 1.75], { small: true, align: 'middle' })];
          st.walker = S.sphere([0, 0, 0], 0.07, { c: 'hl', glow: 0.5 });
          st.walker.visible = false;
          st.ho = { plane: [[0, 0, 1], [0, 0, 0]], bounds: [-1.8, 1.8, -1.8, 1.8], r: 0.075, c: 'c2', onDrag: (q) => { const x = Math.round(q.x * 20) / 20, y = Math.round(q.y * 20) / 20; ctx.set('cx', x, true); ctx.set('cy', y); return [x, y, height(x, y) + 0.05]; } };
          st.ctr = S.handle([0, 0, 0], st.ho);
          st.pole = null;
        },
        update(S, vv) {
          const mm = st.m;
          if (st.pole !== vv.pole) { st.pole = vv.pole; st.surf.update((x, y) => height(x, y)); }
          const circ = (zf) => L.seq(181, (i) => { const t = TAU * i / 180, x = mm.c[0] + mm.r * Math.cos(t), y = mm.c[1] + mm.r * Math.sin(t); return [x, y, zf(x, y)]; });
          st.ring.update(circ((x, y) => height(x, y) + 0.03));
          const zc = height(mm.c[0], mm.c[1]);
          st.ho.plane[1] = [0, 0, zc];
          st.ctr.at([mm.c[0], mm.c[1], zc + 0.05]);
          mm.poles.forEach((P, i) => {
            st.poleLabs[i].el.style.color = mm.dist[i] < 0 ? S.colour('hl').getStyle() : '';
            st.poleLabs[i].el.style.fontWeight = mm.dist[i] < 0 ? '700' : '';
            st.poleLabs[i].set([P.p[0], P.p[1], height(P.p[0] + 0.02, P.p[1] + 0.02) + 0.08]);
          });
          st.anim?.redraw();
        },
        fallback(c2, vv) {
          st.flat = true; st.v3.replaceChildren();
          st.cap1.textContent = T('Phase of f (colour) with its two poles. Drag the centre of the circle.', 'f の偏角（色）と2つの極。円の中心をドラッグできます。');
          residuePhase2D(st.v3, residueModel(vv), ctx);
          st.anim?.redraw();
        },
      });
      st.anim?.redraw();
    },
  };

  /* ---------- 3. harmonic conjugates ---------- */
  // marching squares: returns polylines (as one point list with null breaks) for each level
  function contours(fn, x0, x1, y0, y1, nx, ny, levels, cap) {
    const g = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) g[j * (nx + 1) + i] = fn(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny);
    const out = [], dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    for (const c of levels) {
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const v = [g[j * (nx + 1) + i], g[j * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i]];
        if (v.some((q) => !Number.isFinite(q) || Math.abs(q) > cap)) continue;
        const X = x0 + i * dx, Y = y0 + j * dy;
        const P = [[X, Y], [X + dx, Y], [X + dx, Y + dy], [X, Y + dy]];
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const p = v[e] - c, q = v[(e + 1) % 4] - c;
          if ((p < 0) !== (q < 0)) { const t = p / (p - q); pts.push([P[e][0] + t * (P[(e + 1) % 4][0] - P[e][0]), P[e][1] + t * (P[(e + 1) % 4][1] - P[e][1])]); }
        }
        if (pts.length >= 2) { out.push(pts[0], pts[1], null); if (pts.length === 4) out.push(pts[2], pts[3], null); }
      }
    }
    return out;
  }
  const FUNCS = [
    { g: (z) => mul(z, z), d: (z) => [2 * z[0], 2 * z[1]], name: 'z²', step: 1, cap: 9, k: 0.32 },
    { g: (z) => pw(z, 3), d: (z) => mul([3, 0], mul(z, z)), name: 'z³', step: 2.5, cap: 25, k: 0.075 },
    { g: cexp, d: cexp, name: 'eᶻ', step: 1, cap: 8, k: 0.17 },
    { g: (z) => div([1, 0], z), d: (z) => div([-1, 0], mul(z, z)), name: '1/z', step: 0.5, cap: 5, k: 0.55 },
  ];
  const HRING = 0.35, HB = 2.3, HC = 1.3;
  function harmonicSetup(v) {
    const Fn = FUNCS[Math.round(v.fn ?? 0)] || FUNCS[0], ph = v.phase * PI / 180, rot = [Math.cos(ph), Math.sin(ph)];
    const F = (z) => mul(rot, Fn.g(z)), dF = (z) => mul(rot, Fn.d(z));
    const p = [v.px ?? 0.9, v.py ?? 0.6], d = dF(p), m = Math.hypot(...d);
    const gu = [d[0], -d[1]], gv = [d[1], d[0]];
    let mean = 0; const NR = 720;
    for (let i = 0; i < NR; i++) { const t = TAU * i / NR; mean += F([p[0] + HRING * Math.cos(t), p[1] + HRING * Math.sin(t)])[0] / NR; }
    return { Fn, F, dF, p, d, m, gu, gv, w: F(p), mean, encl: Fn === FUNCS[3] && Math.hypot(...p) < HRING };
  }
  function harmonicMap(host, ctx, h) {
    const { Fn, F, p, m, gu, gv } = h, R = 2;
    const f = L.fig(host, { x: [-R, R], y: [-R, R], equal: true, maxH: 400, xlabel: 'x' });
    { const t = f.text(R, R, 'y', { anchor: 'end', dx: -6, dy: 15, layer: 'over' }); t.setAttribute('class', 'lab-axlabel'); } // the kit's top-left slot collides with the top tick
    f.raster((x, y) => 0.45 * Math.tanh(F([x, y])[0] / (2 * Fn.step)), { cmap: 'div', res: 3 });
    const levels = L.seq(Math.round(2 * Fn.cap / Fn.step) + 1, (i) => -Fn.cap + i * Fn.step + Fn.step / 2);
    const n = f.small ? 90 : 130;
    f.line(contours((x, y) => F([x, y])[0], -R, R, -R, R, n, n, levels, Fn.cap * 1.5), { c: 'c1', w: 1.5, op: 0.9 });
    f.line(contours((x, y) => F([x, y])[1], -R, R, -R, R, n, n, levels, Fn.cap * 1.5), { c: 'c2', w: 1.5, op: 0.9 });
    if (m > 1e-6) {
      const s = 0.55 / m;
      f.arrow(p, [p[0] + gu[0] * s, p[1] + gu[1] * s], { c: 'c1', w: 3.2, layer: 'over' });
      f.arrow(p, [p[0] + gv[0] * s, p[1] + gv[1] * s], { c: 'c2', w: 3.2, layer: 'over' });
      const q = 0.12, e1 = [gu[0] / m * q, gu[1] / m * q], e2 = [gv[0] / m * q, gv[1] / m * q];
      f.line([[p[0] + e1[0], p[1] + e1[1]], [p[0] + e1[0] + e2[0], p[1] + e1[1] + e2[1]], [p[0] + e2[0], p[1] + e2[1]]], { c: 'ink', w: 1.4, layer: 'over' });
      f.text(p[0] + gu[0] * s, p[1] + gu[1] * s, '∇u', { dx: 8 * Math.sign(gu[0] || 1), dy: -6, c: 'c1', anchor: gu[0] >= 0 ? 'start' : 'end' });
      f.text(p[0] + gv[0] * s, p[1] + gv[1] * s, '∇v', { dx: 8 * Math.sign(gv[0] || 1), dy: -6, c: 'c2', anchor: gv[0] >= 0 ? 'start' : 'end' });
    }
    f.circle(p[0], p[1], HRING, { c: 'hl', w: 1.6, dash: '4 3' });
    f.handle(p[0], p[1], { c: 'hl', snap: 0.05, bounds: [-1.9, 1.9, -1.9, 1.9], label: T('Probe point', '調べる点'), onDrag: (x, y) => { ctx.set('px', x, true); ctx.set('py', y); } });
    return f;
  }
  function harmonicAlong(host, h) {
    // walk from the probe along the unit vector e = ∇u/|∇u|. Then du/ds = |∇u| = |f′| and dv/ds = ∇v·e = 0 at s = 0.
    const { Fn, F, p, m, gu } = h;
    const e = m > 1e-6 ? [gu[0] / m, gu[1] / m] : [1, 0], S = 0.6;
    const along = (s) => F([p[0] + s * e[0], p[1] + s * e[1]]);
    const uS = L.sample(-S, S, 121, (s) => [s, along(s)[0]]), vS = L.sample(-S, S, 121, (s) => [s, along(s)[1]]);
    const vals = uS.concat(vS).map((q) => q[1]).filter(Number.isFinite);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const cap = Fn.cap * 1.5; lo = Math.max(lo, -cap); hi = Math.min(hi, cap);
    const padY = Math.max(0.15 * (hi - lo), 0.2); lo -= padY; hi += padY;
    const g = L.fig(host, { x: [-S, S], y: [lo, hi], aspect: 0.9, maxH: 400, xlabel: T('distance s along ∇u', '∇u 方向の距離 s') });
    const clipY = (pts) => pts.map((q) => Number.isFinite(q[1]) && Math.abs(q[1]) < cap ? q : [q[0], NaN]);
    g.line(clipY(uS), { c: 'c1', w: 2.6 });
    g.line(clipY(vS), { c: 'c2', w: 2.6 });
    const w0 = F(p), tl = 0.32;
    if (m > 1e-6) {
      g.line([[-tl, w0[0] - tl * m], [tl, w0[0] + tl * m]], { c: 'c1', w: 1.2, dash: '4 3', op: 0.8 });
      g.line([[-tl, w0[1]], [tl, w0[1]]], { c: 'c2', w: 1.2, dash: '4 3', op: 0.8 });
    }
    g.vline(0, { c: 'hl', dash: '2 3', w: 1.2 });
    g.dot(0, w0[0], { c: 'c1', r: 5 }); g.dot(0, w0[1], { c: 'c2', r: 5 });
    const upU = w0[0] >= w0[1];
    g.text(0, w0[0], T('u: slope |f′|', 'u：傾き |f′|'), { dx: 8, dy: upU ? -8 : 16, anchor: 'start', small: true, c: 'c1' });
    g.text(0, w0[1], T('v: slope 0', 'v：傾き 0'), { dx: 8, dy: upU ? 16 : -8, anchor: 'start', small: true, c: 'c2' });
  }
  D.harmonic = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('The graph of u = Re f (height compressed where |u| is large), with level curves of u and v drawn on it. ∇u points straight uphill and ∇v runs level along the surface. Drag the gold probe.', 'u = Re f のグラフ（|u| が大きいところでは高さを圧縮）と、その上に描いた u と v の等高線。∇u は真上り坂を向き、∇v は曲面に沿って水平に進みます。金色の点をドラッグできます。'));
        st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2, T('Level curves of u and v from above, with both gradients and the averaging ring at the probe.', '上から見た u と v の等高線と、調べる点での2つの勾配と平均をとる輪。'));
        st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const h = harmonicSetup(v);
      st.h = h;
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          st.cap1.textContent = T('Level curves of u and v, with both gradients at the probe', 'u と v の等高線と、調べる点での2つの勾配');
          st.cap2.textContent = T('u and v along the line through the probe in the direction of ∇u', '調べる点を通り ∇u の方向に進む直線上の u と v');
          harmonicMap(st.v3, ctx, h);
          harmonicAlong(st.g2, h);
        } else harmonicMap(st.g2, ctx, h);
        const nm = h.Fn.name;
        L.legend(st.leg, [{ c: 'c1', label: T(`level curves of u = Re(eⁱᵠ${nm})`, `u = Re(eⁱᵠ${nm}) の等高線`) }, { c: 'c2', label: T(`level curves of v = Im(eⁱᵠ${nm})`, `v = Im(eⁱᵠ${nm}) の等高線`) }, { kind: 'fill', c: 'pos', label: T('u > 0', 'u > 0') }, { kind: 'fill', c: 'neg', label: T('u < 0', 'u < 0') }, { c: 'hl', label: T(`ring of radius ${HRING} round the probe`, `調べる点を囲む半径 ${HRING} の輪`) }].concat(st.flat ? [{ c: 'muted', dash: true, label: T('right: tangents at the probe, slopes |f′| and 0', '右：調べる点での接線（傾き |f′| と 0）') }] : []));
        ctx.readout([
          { k: 'u, v', v: `${fmt(h.w[0], 3)}, ${fmt(h.w[1], 3)}` },
          { k: '|∇u| = |∇v| = |f′|', v: fmt(h.m, 3), tone: 'key' },
          { k: '∇u · ∇v', v: fmt(h.gu[0] * h.gv[0] + h.gu[1] * h.gv[1], 3), tone: 'good' },
          { k: T('mean of u on the ring', '輪の上の u の平均'), v: fmt(h.mean, 4), tone: h.encl ? 'warn' : 'good' },
        ], h.encl ? T('The ring encloses the pole of 1/z, where u is not harmonic, so its average no longer equals u at the centre.', '輪が 1/z の極を囲んでいます。そこで u は調和ではないので、輪の上の平均はもはや中心での u に等しくありません。')
          : h.m < 1e-3 ? T('Here f′ = 0: both gradients vanish and the level curves cross at other angles. The average on the ring still equals u at the centre.', 'ここでは f′ = 0 で、両方の勾配が0になり、等高線は別の角度で交わります。輪の上の平均は今も中心での u に等しいままです。')
            : T('Cauchy–Riemann: ∇v is ∇u turned by 90°, with the same length. Mean value: the average of u on the ring equals u at its centre.', 'コーシー・リーマン方程式：∇v は ∇u を90°回したもので、長さも同じです。平均値の性質：輪の上の u の平均は中心での u に等しくなります。'));
      };
      const Hs = (u) => HC * Math.tanh(st.h.Fn.k * u / HC);
      const zAt = (x, y) => Hs(st.h.F([x, y])[0]);
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 470, camera: [2.9, -7.1, 8.4], target: [0, 0.1, -0.2], fov: 33,
        init(S) {
          st.flat = false;
          st.surf = S.graph((x, y) => zAt(x, y), { x: [-HB, HB], y: [-HB, HB], nu: 130, nv: 130, rough: 0.5, coat: 0.4, colour: (x, y) => S.cmap.div(0.9 * Math.tanh(st.h.F([x, y])[0] / (2 * st.h.Fn.step))) });
          st.lu = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c1', opacity: 0.95 });
          st.lv = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c2', opacity: 0.95 });
          st.ring = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.03, closed: true, glow: 0.3 });
          st.au = S.arrow([0, 0, 0], [0, 0, 0.1], { c: 'c1', r: 0.03 });
          st.av = S.arrow([0, 0, 0], [0, 0, 0.1], { c: 'c2', r: 0.03 });
          st.lau = S.label('∇u', [0, 0, 0], { c: 'c1', occlude: true });
          st.lav = S.label('∇v', [0, 0, 0], { c: 'c2', occlude: true });
          st.ho = { plane: [[0, 0, 1], [0, 0, 0]], bounds: [-1.9, 1.9, -1.9, 1.9], r: 0.075, onDrag: (q) => { const x = Math.round(q.x * 20) / 20, y = Math.round(q.y * 20) / 20; ctx.set('px', x, true); ctx.set('py', y); return [x, y, zAt(x, y) + 0.02]; } };
          st.handle = S.handle([0, 0, 0], st.ho);
          st.key = null;
        },
        update(S, vv) {
          const hh = st.h, key = `${vv.fn}|${vv.phase}`;
          if (st.key !== key) {
            st.key = key;
            st.surf.update((x, y) => zAt(x, y));
            const levels = L.seq(Math.round(2 * hh.Fn.cap / hh.Fn.step) + 1, (i) => -hh.Fn.cap + i * hh.Fn.step + hh.Fn.step / 2);
            const segs = (k) => { const pts = contours((x, y) => hh.F([x, y])[k], -HB, HB, -HB, HB, 120, 120, levels, hh.Fn.cap * 1.5), out = []; for (let i = 0; i + 1 < pts.length; i += 3) { const a = pts[i], b = pts[i + 1]; if (a && b) out.push([[a[0], a[1], zAt(a[0], a[1]) + 0.012], [b[0], b[1], zAt(b[0], b[1]) + 0.012]]); } return out; };
            st.lu.update(segs(0)); st.lv.update(segs(1));
          }
          const [px, py] = hh.p, z0 = zAt(px, py);
          st.ho.plane[1] = [0, 0, z0];
          st.handle.at([px, py, z0 + 0.02]);
          st.ring.update(L.seq(121, (i) => { const t = TAU * i / 120, x = px + HRING * Math.cos(t), y = py + HRING * Math.sin(t); return [x, y, zAt(x, y) + 0.02]; }));
          if (hh.m > 1e-6) {
            const eu = [hh.gu[0] / hh.m, hh.gu[1] / hh.m], ev = [-eu[1], eu[0]], uu = hh.w[0], k = hh.Fn.k;
            const slope = k * (1 - Math.tanh(k * uu / HC) ** 2) * hh.m;   // d(height)/ds along ∇u
            const len = 0.8, nu = Math.hypot(1, slope);
            const vu = [eu[0] * len / nu, eu[1] * len / nu, slope * len / nu], vvv = [ev[0] * len, ev[1] * len, 0];
            const base = [px, py, z0 + 0.03];
            st.au.set(base, vu); st.av.set(base, vvv);
            st.lau.set([base[0] + vu[0] * 1.12, base[1] + vu[1] * 1.12, base[2] + vu[2] * 1.12]);
            st.lav.set([base[0] + vvv[0] * 1.12, base[1] + vvv[1] * 1.12, base[2] + 0.04]);
            st.au.visible = st.av.visible = true; st.lau.el.style.display = st.lav.el.style.display = '';
          } else { st.au.visible = st.av.visible = false; st.lau.el.style.display = st.lav.el.style.display = 'none'; }
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
