'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = PI / 180;

  /* ---------------- models (no DOM) ----------------
   * 1. Joukowski aerofoils: the map z = zeta + 1/zeta sends a circle through zeta = 1 (centre mu, radius
   *    a = |1 - mu|) to an aerofoil with a sharp trailing edge at z = 2. Uniform flow U = 1 at angle alpha
   *    past the circle, with the circulation Gamma = 4 pi a sin(alpha + beta) that puts the rear stagnation
   *    point on zeta = 1 (Kutta condition), maps to the exact potential flow past the aerofoil.
   *    Lift per span is rho U Gamma (Kutta-Joukowski), so C_L = 2 Gamma / c.
   * 2. Prandtl's lifting line for an unswept wing: Gamma(theta) = 2 b U sum A_n sin(n theta), y = -(b/2) cos theta,
   *    solved by collocation over the odd terms (symmetric loading). C_L = pi AR A_1, C_Di = pi AR sum n A_n^2.
   * 3. The parabolic drag polar C_D = C_D0 + C_L^2 / (pi e AR) and steady gliding flight. */

  /* ---- complex helpers ---- */
  const cx = (re, im = 0) => [re, im];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cabs = (a) => Math.hypot(a[0], a[1]), cexp = (t) => [Math.cos(t), Math.sin(t)];
  const csqrt = (a) => { const r = cabs(a), re = Math.sqrt((r + a[0]) / 2), im = Math.sqrt(Math.max(0, (r - a[0]) / 2)) * (a[1] < 0 ? -1 : 1); return [re, im]; };

  /* ---- 1. Joukowski ---- */
  function joukowski(mx, my, alphaDeg) {
    const mu = cx(mx, my), a = cabs(sub(cx(1), mu)), beta = Math.asin(my / a), al = alphaDeg * DEG;
    const G = 4 * PI * a * Math.sin(al + beta);
    const ea = cexp(-al), eap = cexp(al);
    // complex velocity in the zeta plane, dW/dzeta = u - i v
    const dWz = (zt) => { const d = sub(zt, mu); return add(sub(ea, div(mul([a * a, 0], eap), mul(d, d))), div([0, G / (2 * PI)], d)); };
    const toZ = (zt) => add(zt, div(cx(1), zt));
    const fromZ = (z) => {                                   // the preimage outside the circle, or null inside the aerofoil
      const s = csqrt(sub(mul(z, z), cx(4)));
      const r1 = [(z[0] + s[0]) / 2, (z[1] + s[1]) / 2], r2 = [(z[0] - s[0]) / 2, (z[1] - s[1]) / 2];
      const d1 = cabs(sub(r1, mu)), d2 = cabs(sub(r2, mu));
      const r = d1 >= d2 ? r1 : r2;
      return Math.max(d1, d2) >= a * (1 - 1e-9) ? r : null;
    };
    // complex velocity in the z plane
    const dWdz = (zt) => { const dz = sub(cx(1), div(cx(1), mul(zt, zt))); return div(dWz(zt), dz); };
    const velZ = (x, y) => { const zt = fromZ([x, y]); if (!zt) return null; const w = dWdz(zt); return [w[0], -w[1]]; };
    const velZeta = (x, y) => { const zt = [x, y]; if (cabs(sub(zt, mu)) < a) return null; const w = dWz(zt); return [w[0], -w[1]]; };
    // surface, theta measured from the trailing edge (zeta = 1 is at theta = -beta)
    const surf = (n = 360) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const th = -beta + 2 * PI * i / n, zt = add(mu, mul([a, 0], cexp(th))), z = toZ(zt);
        let cp = NaN;
        if (i > 0 && i < n) { const w = dWdz(zt); cp = 1 - (w[0] * w[0] + w[1] * w[1]); }
        pts.push({ th, x: z[0], y: z[1], cp, zt });
      }
      return pts;
    };
    const S0 = surf(720);
    let xmin = Infinity, xmax = -Infinity, ile = 0;
    S0.forEach((p, i) => { if (p.x < xmin) { xmin = p.x; ile = i; } if (p.x > xmax) xmax = p.x; });
    const chord = xmax - xmin;
    let tmax = 0;
    for (let i = 1; i < ile; i++) { const p = S0[i]; let best = Infinity, yl = 0; for (let j = ile; j < S0.length; j++) { const d = Math.abs(S0[j].x - p.x); if (d < best) { best = d; yl = S0[j].y; } } tmax = Math.max(tmax, Math.abs(p.y - yl)); }
    const CL = 2 * G / chord;
    return { mu, a, beta, alpha: al, G, dWz, dWdz, toZ, fromZ, velZ, velZeta, surf, S0, ile, xmin, xmax, chord, CL, thick: tmax / chord, zeroLift: -beta / DEG };
  }
  // lift from integrating the surface pressure, for the checks
  function liftFromPressure(J) {
    let fx = 0, fy = 0; const P = J.S0;
    for (let i = 1; i < P.length - 2; i++) {
      const p = P[i], q = P[i + 1]; if (!Number.isFinite(p.cp) || !Number.isFinite(q.cp)) continue;
      const cp = (p.cp + q.cp) / 2, dx = q.x - p.x, dy = q.y - p.y;
      // the surface runs counter-clockwise, so the outward normal is (dy, -dx); pressure pushes along -n
      fx += -cp * dy; fy += cp * dx;
    }
    const L1 = -fx * Math.sin(J.alpha) + fy * Math.cos(J.alpha);
    return L1 / J.chord;
  }

  /* ---- 2. lifting line ---- */
  function gauss(A, n) {
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    const x = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    return x;
  }
  // plan: 0 rectangular, 1 tapered, 2 elliptic. Span b = 2 (y in [-1, 1]). Returns chord c(y) with mean chord 2 / AR.
  function planform(plan, AR, taper) {
    const cm = 2 / AR;
    if (plan === 0) return (y) => cm;
    if (plan === 2) { const c0 = 4 * cm / PI; return (y) => c0 * Math.sqrt(Math.max(0, 1 - y * y)); }
    const cr = 2 * cm / (1 + taper); return (y) => cr * (1 - (1 - taper) * Math.abs(y));
  }
  function liftingLine(plan, AR, taper, alphaDeg, twistDeg, N = 24, a0 = 2 * PI) {
    const c = planform(plan, AR, taper), b = 2;
    const A = Array.from({ length: N }, () => new Float64Array(N + 1));
    for (let j = 0; j < N; j++) {
      const th = (j + 1) * PI / (2 * N), y = -Math.cos(th), mu = a0 * c(y) / (4 * b), al = (alphaDeg - twistDeg * Math.abs(y)) * DEG;
      for (let k = 0; k < N; k++) { const n = 2 * k + 1; A[j][k] = Math.sin(n * th) * (mu * n + Math.sin(th)); }
      A[j][N] = mu * al * Math.sin(th);
    }
    const An = gauss(A, N);
    const CL = PI * AR * An[0];
    let s = 0; for (let k = 0; k < N; k++) s += (2 * k + 1) * An[k] * An[k];
    const CDi = PI * AR * s, e = s > 0 ? An[0] * An[0] / s : 1;
    const gam = (y) => { const th = Math.acos(Math.max(-1, Math.min(1, -y))); let g = 0; for (let k = 0; k < N; k++) g += An[k] * Math.sin((2 * k + 1) * th); return 2 * b * g; };   // Gamma / U
    const cl = (y) => 2 * gam(y) / c(y);
    const ai = (y) => { const th = Math.acos(Math.max(-1, Math.min(1, -y))), st = Math.sin(th); if (st < 1e-6) return NaN; let g = 0; for (let k = 0; k < N; k++) g += (2 * k + 1) * An[k] * Math.sin((2 * k + 1) * th); return g / st; };
    return { An, CL, CDi, e, gam, cl, ai, c, AR };
  }

  /* ---- 3. glide polar ---- */
  const RHO = 1.225, CLMAX = 1.4;
  function polar(AR, e, CD0, WS) {
    const K = 1 / (PI * e * AR), CD = (CL) => CD0 + K * CL * CL;
    const V = (CL) => Math.sqrt(2 * WS / (RHO * CL)), CLofV = (v) => 2 * WS / (RHO * v * v);
    const sink = (CL) => V(CL) * CD(CL) / CL;
    const CLbg = Math.sqrt(CD0 / K), CLms = Math.sqrt(3 * CD0 / K), LDmax = 1 / (2 * Math.sqrt(K * CD0));
    return { K, CD, V, CLofV, sink, CLbg, CLms, LDmax, Vbg: V(CLbg), Vms: V(Math.min(CLms, CLMAX)), Vs: V(CLMAX), CD0, WS };
  }

  const M = { add, sub, mul, div, cabs, csqrt, joukowski, liftFromPressure, planform, liftingLine, polar, RHO, CLMAX };
  (window.LabModels = window.LabModels || {})['aerodynamics'] = M;

  /* ---------------- 1. Joukowski aerofoil ---------------- */
  // streamlines of the exact flow, traced in the aerofoil frame from seeds upstream; each point carries the
  // time the air takes to reach it, so particles can be moved at the true local speed
  function traceStreams(J, nSeed = 9, h = 0.035) {
    const ca = Math.cos(J.alpha), sa = Math.sin(J.alpha), out = [];
    for (let i = 0; i < nSeed; i++) {
      const yp = -1.5 + 3 * i / (nSeed - 1), xp = -3.4;
      let p = [xp * ca - yp * sa, xp * sa + yp * ca], t = 0;
      const pts = [], times = [], speeds = [];
      for (let k = 0; k < 340; k++) {
        const v0 = J.velZ(p[0], p[1]); if (!v0) break;
        const sp = Math.hypot(v0[0], v0[1]);
        pts.push(p); times.push(t); speeds.push(sp);
        const unit = (q) => { const w = J.velZ(q[0], q[1]); if (!w) return null; const m = Math.hypot(w[0], w[1]); return m > 1e-9 ? [w[0] / m, w[1] / m] : null; };
        const k1 = unit(p); if (!k1) break;
        const k2 = unit([p[0] + h * k1[0] / 2, p[1] + h * k1[1] / 2]); if (!k2) break;
        const k3 = unit([p[0] + h * k2[0] / 2, p[1] + h * k2[1] / 2]); if (!k3) break;
        const k4 = unit([p[0] + h * k3[0], p[1] + h * k3[1]]); if (!k4) break;
        p = [p[0] + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, p[1] + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
        t += h / Math.max(0.08, sp);
        if (p[0] * ca + p[1] * sa > 3.6) break;
      }
      if (pts.length > 4) out.push({ pts, times, speeds, T: t });
    }
    return out;
  }
  D['joukowski-aerofoil'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', st.c1, T('A wind tunnel running the exact potential flow. The wing is painted by its pressure coefficient, blue where the air speeds up and the pressure drops, orange where it slows. Streamlines run at three stations along the span, and the smoke moves at the true local speed: the air over the top arrives first. Drag the gold trailing edge to change the angle of attack.', '厳密なポテンシャル流の風洞です。翼は圧力係数で塗られ、空気が速くなり圧力が下がるところは青、遅くなるところは橙です。流線は翼幅に沿った三か所に描かれ、煙は本当の局所速度で動きます。上面を通る空気が先に着きます。金色の後縁をドラッグすると迎角が変わります。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c1, T('The same flow in the plane of the section, with the pressure field. The streamlines leave the sharp trailing edge smoothly because the circulation is set by the Kutta condition.', '同じ流れを断面の平面で、圧力場とともに示します。流線は鋭い後縁からなめらかに離れていきます。循環がクッタ条件で決まるからです。'));
        st.p1 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The circle it comes from, in the ζ-plane. z = ζ + 1/ζ maps this circle to the aerofoil. Drag the centre: left makes the aerofoil thicker, up makes it cambered. The circle always passes through ζ = 1, which becomes the sharp trailing edge.', '元になる ζ 平面の円です。z = ζ + 1/ζ がこの円を翼型に写します。中心をドラッグしてください。左へ動かすと翼型が厚くなり、上へ動かすと反りがつきます。円はいつも ζ = 1 を通り、そこが鋭い後縁になります。'));
        st.p2 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('Pressure along the chord, plotted upside down as aerodynamicists do: suction (−Cp) up. The area between the upper and lower curves is the section lift coefficient.', '翼弦に沿った圧力を、空気力学の慣習どおり上下逆に描いています。吸い込み（−Cp）が上です。上面と下面の曲線の間の面積が、断面の揚力係数です。'));
        st.p3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const J = joukowski(v.mx, v.my, v.alpha);
      const ca = Math.cos(J.alpha), sa = Math.sin(J.alpha);
      const draw2d = () => {
        st.p1.replaceChildren(); st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) { st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the section below carries the same flow.', 'このブラウザでは 3D 表示ができません。下の断面が同じ流れを示します。')); }
        const W = 2.9, H = 1.55;
        const f = L.fig(st.p1, { x: [-W, W], y: [-H, H], equal: true, axes: false, grid: false, maxH: 300 });
        f.raster((x, y) => { const vv = J.velZ(x, y); if (!vv) return [0.5, 0.5, 0.5]; const cp = 1 - (vv[0] * vv[0] + vv[1] * vv[1]); return Math.max(-1, Math.min(1, cp > 0 ? cp : cp / 3)); }, { cmap: 'div', res: 4 });
        const seeds = L.seq(15, (i) => [-W + 0.02, -H + 0.12 + (2 * H - 0.24) * i / 14]);
        f.stream((x, y) => J.velZ(x, y) || [0, 0], seeds, { both: false, c: 'ink', w: 1.1, op: 0.6, h: 0.02, steps: 900, stop: (p) => !J.velZ(p[0], p[1]) });
        f.poly(J.S0.map((p) => [p.x, p.y]), { c: 'ink', fill: 'plate', fo: 1, w: 1.6 });
        f.arrow([-W + 0.25, H - 0.3], [-W + 0.25 + 0.7 * ca, H - 0.3 + 0.7 * sa], { c: 'ink', w: 2 });
        f.text(-W + 0.3, H - 0.3, 'U', { math: true, small: true, dy: -8 });
        const xm = (J.xmin + J.xmax) / 2;
        f.arrow([xm - 0.1, 0.15], [xm - 0.1 - 0.9 * sa * Math.sign(J.CL), 0.15 + 0.9 * ca * Math.sign(J.CL)], { c: 'hl', w: 3 });
        f.text(xm - 0.1, 0.15 + 0.9 * Math.sign(J.CL), T('lift', '揚力'), { small: true, dx: 8, c: 'hl' });
        const R = 1.9;
        const g = L.fig(st.p2, { x: [-R, R], y: [-1.45, 1.45], equal: true, axes: false, grid: false, maxH: 250 });
        g.hline(0, { c: 'muted', w: 1, op: 0.6 }); g.vline(0, { c: 'muted', w: 1, op: 0.6 });
        g.stream((x, y) => J.velZeta(x, y) || [0, 0], L.seq(13, (i) => [-R + 0.02, -1.4 + 2.8 * i / 12]), { both: false, c: 'ink', w: 1, op: 0.5, h: 0.015, steps: 700, stop: (p) => !J.velZeta(p[0], p[1]) });
        g.circle(J.mu[0], J.mu[1], J.a, { c: 'c1', w: 2.2, fill: 'plate', fo: 1 });
        g.circle(0, 0, 1, { c: 'muted', w: 1, dash: true, fill: false });
        g.dot(1, 0, { c: 'c2', r: 5 }); g.text(1, 0, T('ζ = 1 → trailing edge', 'ζ = 1 → 後縁'), { small: true, dx: 8, dy: 14 });
        g.handle(J.mu[0], J.mu[1], { c: 'hl', label: T('circle centre', '円の中心'), bounds: [-0.25, 0, 0, 0.2], snap: 0.005, onDrag: (x, y) => { ctx.set('mx', x, true); ctx.set('my', y); } });
        const up = J.S0.slice(1, J.ile).filter((p) => Number.isFinite(p.cp)), lo = J.S0.slice(J.ile, -1).filter((p) => Number.isFinite(p.cp));
        const xc = (p) => (p.x - J.xmin) / J.chord;
        const ymax = Math.min(6, Math.max(1.5, ...up.map((p) => -p.cp)) * 1.08);
        const h = L.fig(st.p3, { x: [0, 1], y: [-1.2, ymax], aspect: 0.5, maxH: 210, xlabel: 'x / c', ylabel: '−Cp' });
        h.hline(0, { c: 'ink', w: 1, op: 0.5 });
        h.line(up.map((p) => [xc(p), Math.min(ymax, -p.cp)]), { c: 'c1', w: 2.4 });
        h.line(lo.map((p) => [xc(p), Math.min(ymax, -p.cp)]), { c: 'c2', w: 2.4 });
        L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('suction, Cp < 0 (shading clipped at −3)', '吸い込み Cp < 0（濃淡は −3 で打ち切り）') }, { kind: 'fill', c: 'c2', label: T('pressure above free stream, Cp > 0', '一様流より高い圧力 Cp > 0') }, { c: 'c1', label: T('upper surface', '上面') }, { c: 'c2', label: T('lower surface', '下面') }, { kind: 'dot', c: 'hl', label: T('smoke, moving at the local speed; lift', '局所速度で動く煙、揚力') }]);
        ctx.readout([
          { k: T('lift coefficient C_L = 2Γ / Uc', '揚力係数 C_L = 2Γ / Uc'), v: fmt(J.CL, 3), tone: 'key' },
          { k: T('circulation Γ = 4πUa sin(α + β)', '循環 Γ = 4πUa sin(α + β)'), v: fmt(J.G, 3) },
          { k: T('thin-aerofoil estimate 2π(α + β)', '薄翼理論の見積もり 2π(α + β)'), v: fmt(2 * PI * (J.alpha + J.beta), 3) },
          { k: T('zero-lift angle', '揚力ゼロの迎角'), v: fmt(J.zeroLift, 2) + '°' },
          { k: T('thickness / chord', '厚さ / 翼弦'), v: fmt(J.thick * 100, 1) + '%' },
        ], v.alpha > 12 ? T('In real air the flow would separate from the upper surface around here and the wing would stall; potential flow keeps the lift rising.', '実際の空気では、このあたりで流れが上面からはく離し、翼は失速します。ポテンシャル流では揚力が増えつづけます。') : T('Camber shifts the whole lift curve to the left: a cambered aerofoil lifts even at zero angle of attack.', '反りは揚力曲線全体を左へずらします。反りのある翼型は、迎角ゼロでも揚力を生みます。'));
      };
      // 3D: the aerofoil frame turned so the free stream runs along +x
      const K = 0.62, SP = 1.45, STATIONS = [-0.95, 0, 0.95], NP = 6;
      const rot = (x, y) => [K * (x * ca + y * sa), K * (-x * sa + y * ca)];
      const P3 = (x, y, s) => { const r = rot(x, y); return [r[0], s, r[1]]; };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.66, maxH: 470, camera: (ctx.host.clientWidth || 900) < 560 ? [-3.4, -7.2, 2.7] : [-2.6, -5.4, 2.1], target: [0.35, 0, 0], fov: 32,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          st.wing = S.surface(() => [0, 0, 0], { u: [0, 1], v: [-SP, SP], nu: 240, nv: 2, c: 'muted', colour: () => S.colour('muted'), rough: 0.28, coat: 0.8 });
          st.capMat = S.mat('muted', { rough: 0.4, coat: 0.5 });
          st.caps = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), st.capMat); m.rotation.x = PI / 2; m.castShadow = true; S.add(m); return m; });
          st.tubes = Array.from({ length: 9 * 3 }, (_, i) => S.tube([[0, 0, 0], [0.001, 0, 0]], { c: i % 3 === 1 ? 'c3' : 'c1', r: 0.009, n: 160 }));
          st.smoke = S.points([[0, 0, 0]], { colours: [S.colour('#ffffff')], r: 0.022, max: 9 * 3 * NP, rough: 0.3, coat: 0.2, glow: 0.35 });
          st.lift = S.arrow([0, 0, 0.3], [0, 0, 0.6], { c: 'hl', r: 0.03, glow: 0.2 });
          st.liftLab = S.label(T('lift', '揚力'), [0, 0, 1], { small: true, align: 'middle' });
          S.arrow([-2.5, -SP - 0.25, 0.85], [0.6, 0, 0], { c: 'ink', r: 0.02 });
          S.label('U', [-2.2, -SP - 0.25, 1.02], { small: true, align: 'middle' });
          st.hdl = S.handle([1.2, SP + 0.12, 0], { plane: [[0, 1, 0], [0, SP + 0.12, 0]], r: 0.09, c: 'hl', onDrag: (q) => {
            const al = Math.round(Math.min(16, Math.max(-8, Math.atan2(-q.z, q.x) / DEG)) * 2) / 2;
            if (al !== st.alpha) ctx.set('alpha', al);
            const a2 = al * DEG; return [K * 2 * Math.cos(a2), SP + 0.12, -K * 2 * Math.sin(a2)];
          } });
          st.hdl.labelItem = S.label(T('trailing edge: drag to pitch', '後縁：ドラッグで迎角'), [1.2, SP + 0.12, -0.2], { small: true });
          S.animate((dt) => {
            const d = st.flow; if (!d || S.reduced()) return false;
            st.clock = (st.clock || 0) + Math.min(dt, 0.05) * 0.9;
            st.placeSmoke(st.clock); return true;
          });
        },
        update(S) {
          st.alpha = v.alpha;
          const n = J.S0.length, cps = J.S0.map((p) => p.cp);
          for (let i = 0; i < n; i++) if (!Number.isFinite(cps[i])) cps[i] = Number.isFinite(cps[i + 1]) ? cps[i + 1] : cps[i - 1] ?? 0;
          const at = (u) => Math.max(0, Math.min(n - 1, Math.round(u * (n - 1))));
          st.wing.update((u, s) => { const p = J.S0[at(u)]; return P3(p.x, p.y, s); }, (u) => { const cp = cps[at(u)], q = Math.max(-1, Math.min(1, cp > 0 ? cp : cp / 2.2)); return S.cmap.div(Math.sign(q) * Math.pow(Math.abs(q), 0.55)); });
          const TH = S.THREE, shape = new TH.Shape(J.S0.map((p) => { const r = rot(p.x, p.y); return new TH.Vector2(r[0], r[1]); }));
          st.caps.forEach((m, i) => { m.geometry.dispose(); m.geometry = new TH.ShapeGeometry(shape); m.position.y = i ? SP : -SP; });
          // streamlines, coloured by speed
          const flow = traceStreams(J);
          st.tubes.forEach((tb, i) => {
            const fl = flow[Math.floor(i / 3)], s = STATIONS[i % 3];
            tb.visible = !!fl;
            if (fl) tb.update(fl.pts.filter((_, k) => k % 3 === 0 || k === fl.pts.length - 1).map((p) => P3(p[0], p[1], s)));
          });
          st.flow = flow;
          st.placeSmoke = (clock) => {
            const pts = [], cl = [];
            flow.forEach((fl, li) => STATIONS.forEach((s, si) => {
              for (let j = 0; j < NP; j++) {
                const tt = ((clock * 1.2 + fl.T * (j / NP) + 0.37 * li + 0.21 * si) % fl.T + fl.T) % fl.T;
                let lo = 0, hi = fl.times.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (fl.times[mid] <= tt) lo = mid; else hi = mid; }
                const f = (tt - fl.times[lo]) / Math.max(1e-9, fl.times[hi] - fl.times[lo]), a = fl.pts[lo], b = fl.pts[hi];
                pts.push(P3(a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), s)); cl.push(S.colour('hl'));
              }
            }));
            st.smoke.update(pts, cl, pts.map(() => 0.03));
          };
          st.placeSmoke(st.clock || 0);
          const L3 = Math.max(-0.9, Math.min(1.1, 0.55 * J.CL));
          st.lift.set([0, 0, 0.32], [0, 0, L3]); st.lift.visible = Math.abs(J.CL) > 0.02;
          st.liftLab.set([0.08, 0, 0.32 + L3 + (L3 >= 0 ? 0.12 : -0.12)]);
          const te = [K * 2 * ca, SP + 0.12, -K * 2 * sa];
          st.hdl.at(te); st.hdl.labelItem.set([te[0] + 0.15, te[1], te[2] - 0.38]);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 2. finite wing ---------------- */
  const PLANS = [['Rectangular', '矩形'], ['Tapered', 'テーパー'], ['Elliptic', '楕円']];
  const NACA = (x) => 5 * 0.12 * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const NT = 15;
  D['finite-wing'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', st.c1, T('A wing of finite span, coloured by its local lift coefficient. Lift varies along the span, and wherever it changes, a vortex trails downstream; its strength is drawn as the thickness of the line. The trailing vortices push air down behind the wing (the orange arrows), tilting the lift backwards into induced drag. Drag the gold point at the root trailing edge to change the chord, and so the aspect ratio.', '有限の翼幅をもつ翼を、局所揚力係数で塗り分けています。揚力は翼幅に沿って変わり、変わるところでは必ず渦が下流へ流れ出します。その強さを線の太さで描いています。後流渦は翼の後ろで空気を押し下げ（橙の矢印）、揚力を後ろへ傾けて誘導抗力を生みます。翼根の後縁の金色の点をドラッグすると翼弦が、したがってアスペクト比が変わります。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Circulation along the span (blue) against the elliptic loading with the same total lift (dashed). Only the elliptic loading gives a uniform downwash and the least induced drag.', '翼幅に沿った循環（青）と、総揚力が同じ楕円分布（破線）です。一様な吹き下ろしと最小の誘導抗力を与えるのは楕円分布だけです。'));
        st.p2 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('Local lift coefficient relative to the whole wing. Where it peaks, the section works hardest and stalls first.', '翼全体に対する局所揚力係数の比です。ピークのところで断面が最も働き、最初に失速します。'));
        st.p3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const plan = Math.round(v.plan), AR = v.ar, taper = v.taper, al = v.alpha, tw = v.twist;
      const LL = liftingLine(plan, AR, taper, al, tw);
      const span = 2, SC = 2.2;                                   // b = 2 in model units; drawn half-span SC
      const draw2d = () => {
        st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const f0 = L.fig(st.v3, { x: [-1.1, 1.1], y: [-0.6, 0.6], equal: true, axes: false, grid: false, maxH: 300 });
          const lead = L.sample(-1, 1, 120, (y) => [y, LL.c(y) / 4]), trail = L.sample(1, -1, 120, (y) => [y, -3 * LL.c(y) / 4]);
          f0.poly(lead.concat(trail), { c: 'c1', fill: true, fo: 0.25, w: 1.6 });
        }
        const gmax = Math.max(...L.sample(-1, 1, 80, (y) => LL.gam(y)).map((p) => p[1]));
        const f = L.fig(st.p2, { x: [-1, 1], y: [0, 1.25], aspect: 0.5, maxH: 210, xlabel: T('span position y / (b/2)', '翼幅方向の位置 y / (b/2)'), ylabel: 'Γ / Γ₀' });
        const ge = (y) => 2 * span * LL.An[0] * Math.sqrt(Math.max(0, 1 - y * y));
        f.line(L.sample(-1, 1, 160, (y) => [y, ge(y) / (gmax || 1)]), { c: 'muted', w: 1.6, dash: true });
        f.line(L.sample(-1, 1, 160, (y) => [y, LL.gam(y) / (gmax || 1)]), { c: 'c1', w: 2.6 });
        const h = L.fig(st.p3, { x: [-1, 1], y: [0, 1.6], aspect: 0.45, maxH: 190, xlabel: T('span position y / (b/2)', '翼幅方向の位置 y / (b/2)'), ylabel: 'c_l / C_L' });
        h.hline(1, { c: 'muted', w: 1, dash: true });
        h.line(L.sample(-0.985, 0.985, 160, (y) => [y, Math.min(1.6, LL.cl(y) / (LL.CL || 1))]), { c: 'c3', w: 2.4 });
        let ymx = 0, cmx = 0; for (let i = 0; i <= 100; i++) { const y = -0.98 + 1.96 * i / 100, q = LL.cl(y) / (LL.CL || 1); if (q > cmx) { cmx = q; ymx = y; } }
        h.dot(ymx, Math.min(1.6, cmx), { c: 'hl', r: 5 });
        L.legend(st.leg, [{ c: 'c1', label: T('circulation Γ(y)', '循環 Γ(y)') }, { c: 'muted', dash: true, label: T('elliptic loading, same lift', '同じ揚力の楕円分布') }, { c: 'c3', label: T('local lift coefficient ÷ C_L', '局所揚力係数 ÷ C_L') }, { kind: 'dot', c: 'c4', label: T('trailing vortices (thickness = strength)', '後流渦（太さ = 強さ）') }]);
        const slope = liftingLine(plan, AR, taper, 1, 0).CL / DEG;     // per radian
        ctx.readout([
          { k: T('lift coefficient C_L', '揚力係数 C_L'), v: fmt(LL.CL, 3), tone: 'key' },
          { k: T('induced drag C_Di = C_L² / (π e AR)', '誘導抗力 C_Di = C_L² / (π e AR)'), v: fmt(LL.CDi, 4), tone: 'key' },
          { k: T('span efficiency e', '翼幅効率 e'), v: fmt(LL.e, 4), tone: LL.e > 0.995 ? 'good' : undefined },
          { k: T('lift slope dC_L/dα (per rad)', '揚力傾斜 dC_L/dα（1/rad）'), v: fmt(slope, 3) + T(' vs 2π for the aerofoil', '（翼型は 2π）') },
          { k: T('first section to stall', '最初に失速する断面'), v: Math.abs(ymx) < 0.05 ? T('the root', '翼根') : fmt(Math.abs(ymx), 2) + ' × b/2' },
        ], plan === 0 ? T('A rectangular wing carries too much lift near its tips for its chord; its loading is fuller than elliptic and e falls a few percent.', '矩形翼は翼端近くで翼弦に比べて揚力を受けもちすぎ、分布は楕円より膨らみ、e は数パーセント下がります。')
          : plan === 2 && tw === 0 ? T('The untwisted elliptic wing is the classic optimum: elliptic loading, uniform downwash, and e = 1 exactly.', 'ねじりのない楕円翼は古典的な最適解です。楕円分布、一様な吹き下ろしで、e はちょうど 1 です。')
            : T('A taper ratio near 0.4 gives almost elliptic loading, with e close to 1, without the cost of building an elliptic wing.', 'テーパー比が 0.4 くらいだと、楕円翼を作る手間なしに、ほぼ楕円の分布と 1 に近い e が得られます。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 470, camera: [-3.4, -5.6, 3.3], target: [0.6, 0, 0], fov: 32,
        init(S) {
          st.flat = false;
          S.floor({ size: 7, n: 14, z: -0.9 });
          const mk = () => S.surface(() => [0, 0, 0], { u: [0, 1], v: [-1, 1], nu: 40, nv: 80, c: 'c1', rough: 0.3, coat: 0.7 });
          st.top = mk(); st.bot = mk();
          const THREE = S.THREE;
          st.trailMat = S.mat('c4', { rough: 0.35, coat: 0.5 });
          st.trail = Array.from({ length: NT + 1 }, () => { const m = new THREE.Mesh(new THREE.BufferGeometry(), st.trailMat); S.add(m); return m; });
          st.down = Array.from({ length: 9 }, () => S.arrow([0, 0, 0], [0, 0, -0.1], { c: 'c2', r: 0.018 }));
          st.flow = S.arrow([-1.7, -1.5, 0.45], [0.7, 0, 0], { c: 'ink', r: 0.02 });
          S.label('U', [-1.4, -1.5, 0.62], { small: true, align: 'middle' });
          st.hdl = S.handle([0, 0, 0], { plane: [[0, 0, 1], [0, 0, 0]], bounds: [0.12, 3.2, -0.05, 0.05], r: 0.08, c: 'hl', onDrag: (q) => {
            const pl = st.plan, tp = st.taper, c0 = Math.max(0.05, q.x / 0.75 / SC);
            const cm = pl === 1 ? c0 * (1 + tp) / 2 : pl === 2 ? c0 * PI / 4 : c0;
            const ar = Math.round(Math.min(20, Math.max(3, 2 / cm)) * 2) / 2;
            if (ar !== st.ar) ctx.set('ar', ar);
            return [0.75 * planform(pl, ar, tp)(0) * SC, 0, 0];
          } });
        },
        update(S) {
          const chordD = (y) => LL.c(y) * SC;
          const cls = L.sample(-0.97, 0.97, 80, (y) => LL.cl(y)).map((p) => p[1]).filter(Number.isFinite);
          const clMax = Math.max(1e-6, ...cls), clMin = Math.min(clMax * 0.999, ...cls);
          const sec = (u, vy, sgn) => {
            const y = vy, cd = chordD(y), a = (al - tw * Math.abs(y)) * DEG;
            const xs = -cd / 4 + u * cd, zs = sgn * NACA(u) * cd;
            const xr = xs * Math.cos(a) + zs * Math.sin(a), zr = -xs * Math.sin(a) + zs * Math.cos(a);
            return [xr, y * SC, zr];
          };
          const col = (u, vy) => { const q = (LL.cl(Math.max(-0.97, Math.min(0.97, vy))) - clMin) / (clMax - clMin); return S.cmap.warm(Number.isFinite(q) ? Math.max(0, Math.min(1, q)) * 0.9 + 0.05 : 0.05); };
          st.top.update((u, vy) => sec(u, vy, 1), col); st.bot.update((u, vy) => sec(u, vy, -1), col);
          // trailing vortices at strip edges: strength = drop in Gamma across the edge
          const edges = L.seq(NT + 1, (i) => -1 + 2 * i / NT);
          const strips = [];
          for (let i = 0; i <= NT; i++) { const gl = i > 0 ? LL.gam((edges[i - 1] + edges[i]) / 2) : 0, gr = i < NT ? LL.gam((edges[i] + edges[i + 1]) / 2) : 0; strips.push(Math.abs(gr - gl)); }
          const smax = Math.max(1e-9, ...strips), TH = S.THREE;
          st.trail.forEach((tb, i) => {
            const te = sec(1, edges[i], 1), r = 0.005 + 0.05 * strips[i] / smax;
            tb.geometry.dispose();
            tb.geometry = new TH.TubeGeometry(new TH.LineCurve3(new TH.Vector3(te[0], te[1], te[2]), new TH.Vector3(te[0] + 2.6, te[1], te[2] - 0.06)), 1, r, 12, false);
          });
          // downwash arrows behind the wing, length proportional to the induced angle
          const amax = Math.max(1e-6, ...L.sample(-0.9, 0.9, 30, (y) => Math.abs(LL.ai(y))).map((p) => p[1]).filter(Number.isFinite));
          st.down.forEach((ar, i) => { const y = -0.9 + 1.8 * i / 8, w = LL.ai(y); ar.visible = Number.isFinite(w) && Math.abs(LL.CL) > 1e-4; if (ar.visible) ar.set([1.5, y * SC, 0.25], [0, 0, -0.42 * w / amax * Math.sign(LL.CL || 1)]); });
          st.plan = plan; st.taper = taper; st.ar = AR;
          const root = sec(1, 0, 1); st.hdl.at([root[0], 0, root[2]]);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. glide polar ---------------- */
  D['glide-polar'] = {
    render(ctx, v) {
      const Pp = polar(v.ar, v.e, v.cd0, v.ws), Vv = v.V, CL = Pp.CLofV(Vv), CD = Pp.CD(CL), sink = Pp.sink(CL);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The drag polar: lift coefficient against drag coefficient. The line from the origin that just touches it marks the best lift-to-drag ratio.', '抗力極曲線：揚力係数と抗力係数の関係です。原点から引いて曲線にちょうど接する直線が、最良の揚抗比を示します。'));
      const cdMax = Pp.CD(CLMAX) * 1.15;
      const f = L.fig(c1, { x: [0, cdMax], y: [0, 1.6], aspect: 0.9, maxH: 330, xlabel: T('drag coefficient C_D', '抗力係数 C_D'), ylabel: T('lift coefficient C_L', '揚力係数 C_L') });
      f.line(L.sample(0.02, CLMAX, 160, (c) => [Pp.CD(c), c]), { c: 'c1', w: 2.6 });
      f.line(L.sample(0.02, CLMAX, 80, (c) => [Pp.CD0, c]), { c: 'muted', w: 1.2, dash: true });
      f.seg([0, 0], [Pp.CD(Pp.CLbg) * 1.6, Pp.CLbg * 1.6], { c: 'c3', w: 1.6 });
      f.dot(Pp.CD(Pp.CLbg), Pp.CLbg, { c: 'c3', r: 5 });
      f.text(Pp.CD(Pp.CLbg), Pp.CLbg, T('best L/D', '最良 L/D'), { small: true, dx: -10, dy: -10, anchor: 'end', c: 'c3' });
      f.hline(CLMAX, { c: 'c2', w: 1, dash: true }); f.text(cdMax, CLMAX, T('stall', '失速'), { small: true, anchor: 'end', dy: -5, c: 'c2' });
      if (CL <= CLMAX) f.dot(CD, CL, { c: 'hl', r: 6 });
      L.h('p', 'lab-cap', c2, T('The speed polar: sink rate against airspeed. Drag the gold point to fly faster or slower. A line from the origin touching the curve gives the speed for the flattest glide; the top of the curve is the minimum sink.', '速度極曲線：沈下率と対気速度の関係です。金色の点をドラッグすると速くも遅くも飛べます。原点から引いて曲線に接する直線が、最も浅い滑空の速度を与え、曲線の頂点が最小沈下です。'));
      const Vmax = 60, sMax = Math.min(8, Math.max(2.5, Pp.sink(Pp.CLofV(45)) * 1.1));
      const tks = []; for (let k = 0; k <= sMax; k += sMax > 5 ? 2 : 1) tks.push([-k, String(k)]);
      const g = L.fig(c2, { x: [0, Vmax], y: [-sMax, 0], aspect: 0.9, maxH: 330, xlabel: T('airspeed V (m/s)', '対気速度 V（m/s）'), ylabel: T('sink rate (m/s), downward', '沈下率（m/s）、下向き'), ticksY: tks });
      const vs = Pp.Vs;
      g.line(L.sample(vs, Vmax, 200, (u) => [u, -Pp.sink(Pp.CLofV(u))]).filter((p) => p[1] >= -sMax), { c: 'c1', w: 2.6 });
      g.vline(vs, { c: 'c2', w: 1, dash: true }); g.text(vs, -sMax * 0.95, T('stall', '失速'), { small: true, dx: 4, c: 'c2' });
      const sbg = Pp.sink(Pp.CLbg);
      g.seg([0, 0], [Pp.Vbg * 1.7, -sbg * 1.7], { c: 'c3', w: 1.6 });
      g.dot(Pp.Vbg, -sbg, { c: 'c3', r: 5 }); g.text(Pp.Vbg, -sbg, T('best glide', '最良滑空'), { small: true, dx: 10, dy: 22, c: 'c3' });
      const CLms = Math.min(Pp.CLms, CLMAX), sms = Pp.sink(CLms);
      g.dot(Pp.V(CLms), -sms, { c: 'c4', r: 5 }); g.text(Pp.V(CLms), -sms, T('minimum sink', '最小沈下'), { small: true, dy: -10, dx: -6, anchor: 'end', c: 'c4' });
      g.handle(Math.max(vs, Vv), -Pp.sink(Pp.CLofV(Math.max(vs, Vv))), { c: 'hl', label: T('airspeed', '対気速度'), axis: 'x', bounds: [vs, Vmax, -sMax, 0], snap: 0.5, onDrag: (x) => ctx.set('V', Math.max(15, x)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('parabolic polar C_D = C_D0 + C_L² / (π e AR)', '放物線極曲線 C_D = C_D0 + C_L² / (π e AR)') }, { c: 'c3', label: T('tangent from the origin: best L/D', '原点からの接線：最良 L/D') }, { kind: 'dot', c: 'c4', label: T('minimum sink', '最小沈下') }, { kind: 'dot', c: 'hl', label: T('where you are flying', 'いまの飛行状態') }]);
      const stalled = Vv < vs;
      ctx.readout([
        { k: T('best L/D = 1 / (2√(K C_D0))', '最良 L/D = 1 / (2√(K C_D0))'), v: fmt(Pp.LDmax, 3), tone: 'key' },
        { k: T('best-glide speed, sink', '最良滑空速度と沈下率'), v: fmt(Pp.Vbg, 3) + ' m/s, ' + fmt(sbg, 3) + ' m/s', tone: 'key' },
        { k: T('minimum-sink speed, sink', '最小沈下の速度と沈下率'), v: fmt(Pp.V(CLms), 3) + ' m/s, ' + fmt(sms, 3) + ' m/s' },
        { k: T('stall speed (C_L max 1.4)', '失速速度（C_L 最大 1.4）'), v: fmt(vs, 3) + ' m/s' },
        stalled ? { k: T('at your speed', 'いまの速度'), v: T('stalled', '失速'), tone: 'warn' } : { k: T('at your speed: C_L, L/D, sink', 'いまの速度：C_L、L/D、沈下率'), v: fmt(CL, 3) + ', ' + fmt(CL / CD, 3) + ', ' + fmt(sink, 3) + ' m/s' },
      ], T('At best L/D the induced drag equals the parasite drag. Weight does not change the best glide ratio, only the speed at which it is flown, which is why racing gliders carry water ballast.', '最良 L/D では誘導抗力と有害抗力が等しくなります。重さは最良の滑空比を変えず、それを出す速度だけを変えます。競技用グライダーが水バラストを積むのはこのためです。'));
    },
  };
})();
