'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI;

  /* ---------------- models (no DOM) ----------------
   * 1. A London superconducting sphere (radius R, penetration depth lambda) in a uniform field B0 along z.
   *    With A = g(r) sin(theta) phi-hat, the London equation gives g = C i1(r / lambda) inside and
   *    g = B0 r / 2 + D / r^2 outside; continuity of A and dA/dr at r = R fixes C and D. i1 is the modified
   *    spherical Bessel function (x cosh x - sinh x) / x^2. The flux function Psi = r g(r) sin^2(theta) is
   *    constant along field lines. lambda(T) follows the two-fluid law lambda0 / sqrt(1 - t^4).
   * 2. Ginzburg-Landau free energy density f = a |psi|^2 + (b / 2) |psi|^4 with a = a0 (T - Tc), in units
   *    a0 Tc = b = 1: f = (t - 1) |psi|^2 + |psi|^4 / 2.
   * 3. An Abrikosov triangular lattice of London vortices: each carries one flux quantum and a field
   *    B(r) = Phi0 / (2 pi lambda^2) K0(r / lambda); the lattice field is the sum. Lengths in lambda, fields in
   *    Phi0 / (2 pi lambda^2), so Hc2 = kappa^2 and the mean field of a lattice of cell area A is 2 pi / A. */

  /* ---- 1. London sphere ---- */
  function i1(x) {
    if (x < 1e-3) return x / 3 + x ** 3 / 30;
    if (x < 0.3) return x / 3 + x ** 3 / 30 + x ** 5 / 840 + x ** 7 / 45360;
    return (x * Math.cosh(x) - Math.sinh(x)) / (x * x);
  }
  function i1p(x) {
    if (x < 0.3) return 1 / 3 + x * x / 10 + x ** 4 / 168 + x ** 6 / 6480;
    return Math.sinh(x) / x - 2 * i1(x) / x;
  }
  const lambdaT = (t) => (t >= 1 ? Infinity : 1 / Math.sqrt(1 - t ** 4));       // in units of lambda0
  // sphere of radius 1 in field B0 = 1; a = R / lambda (0 = normal metal)
  function londonSphere(a) {
    a = Math.min(a, 300);
    const k = a > 1e-6 ? a * i1p(a) / i1(a) : 1;
    const Dc = (1 - k) / (2 * (k + 2));                 // outside: g = r/2 + D / r^2
    const C = a > 1e-6 ? (0.5 + Dc) / i1(a) : 0;        // inside: g = C i1(r a)
    const g = (r) => (r >= 1 ? r / 2 + Dc / (r * r) : (a > 1e-6 ? C * i1(r * a) : r / 2));
    const h = (r) => r * g(r);                          // Psi = h(r) sin^2 theta
    const dh = (r) => (r >= 1 ? r - Dc / (r * r) : (a > 1e-6 ? C * (i1(r * a) + r * a * i1p(r * a)) : r));
    // field components (B0 = 1): B_r = 2 g cos / r, B_theta = - sin * h'(r) / r
    const B = (r, th) => { r = Math.max(r, 1e-6); const br = 2 * g(r) * Math.cos(th) / r, bt = -Math.sin(th) * dh(r) / r; return [br, bt]; };
    const Bcyl = (rho, z) => { const r = Math.hypot(rho, z), th = Math.atan2(rho, z); const [br, bt] = B(r, th); return [br * Math.sin(th) + bt * Math.cos(th), br * Math.cos(th) - bt * Math.sin(th)]; };
    const f = -2 * Dc;                                   // induced moment as a fraction of a perfect diamagnet
    const Bcentre = a > 1e-6 ? 2 * C * a / 3 : 1;
    const Beq = 1 + f / 2;                               // |B| just outside the equator
    return { a, k, D: Dc, C, g, h, dh, B, Bcyl, f, Bcentre, Beq };
  }
  // closed form of the moment fraction, for the checks
  const momentClosed = (a) => (a < 1e-3 ? a * a / 15 : 1 - 3 / a / Math.tanh(a) + 3 / (a * a));
  // trace the field line Psi = psi0 in the meridional plane; returns [rho, z] points
  function fieldLine(S, psi0, zMax = 2.15, n = 260) {
    const out = [];
    for (let i = 1; i < n; i++) {
      const th = PI * i / n, s2 = Math.sin(th) ** 2, rhs = psi0 / s2;
      let lo = 0, hi = Math.sqrt(2 * rhs) + 2;
      while (S.h(hi) < rhs) hi *= 2;
      for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; if (S.h(mid) < rhs) lo = mid; else hi = mid; }
      const r = (lo + hi) / 2, z = r * Math.cos(th);
      if (Math.abs(z) <= zMax) out.push([r * Math.sin(th), z]);
    }
    return out;
  }

  /* ---- 2. Ginzburg-Landau ---- */
  const glF = (t, m) => (t - 1) * m * m + m ** 4 / 2;
  const glPsi2 = (t) => Math.max(0, 1 - t);
  const glFmin = (t) => -(Math.max(0, 1 - t) ** 2) / 2;
  const BCS_JUMP = 1.426;                                // Delta C / (gamma Tc) in weak-coupling BCS

  /* ---- 3. vortex lattice ---- */
  function besselI0(x) { const t = x / 3.75, t2 = t * t; return 1 + t2 * (3.5156229 + t2 * (3.0899424 + t2 * (1.2067492 + t2 * (0.2659732 + t2 * (0.0360768 + t2 * 0.0045813))))); }
  function K0(x) {
    if (x <= 0) return Infinity;
    if (x <= 2) { const y = x * x / 4; return -Math.log(x / 2) * besselI0(x) + (-0.57721566 + y * (0.4227842 + y * (0.23069756 + y * (0.0348859 + y * (0.00262698 + y * (0.0001075 + y * 0.0000074)))))); }
    const y = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + y * (-0.07832358 + y * (0.02189568 + y * (-0.01062446 + y * (0.00587872 + y * (-0.0025154 + y * 0.00053208))))));
  }
  function K1(x) {
    if (x <= 2) { const t = x / 3.75, t2 = t * t, I1 = x * (0.5 + t2 * (0.87890594 + t2 * (0.51498869 + t2 * (0.15084934 + t2 * (0.02658733 + t2 * (0.00301532 + t2 * 0.00032411)))))); const y = x * x / 4; return Math.log(x / 2) * I1 + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * -0.00004686)))))); }
    const y = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + y * (0.23498619 + y * (-0.0365562 + y * (0.01504268 + y * (-0.00780353 + y * (0.00325614 + y * -0.00068245))))));
  }
  const cellArea = (a) => Math.sqrt(3) / 2 * a * a;
  const spacingFromB = (bbar) => Math.sqrt(2 * (TAU / bbar) / Math.sqrt(3));       // bbar in units Phi0/(2 pi lambda^2)
  // lattice field at (x, y): sum of K0 over vortices within rc, plus the mean-field tail beyond rc
  function latticeB(a, x, y, rc = Math.min(7, 4 * a + 0.5)) {
    const a1 = [a, 0], a2 = [a / 2, a * Math.sqrt(3) / 2];
    const jm = Math.ceil(rc / (a * Math.sqrt(3) / 2)) + 1;
    let s = 0;
    for (let j = -jm; j <= jm; j++) {
      const yj = j * a2[1], dy = y - yj;
      if (Math.abs(dy) > rc) continue;
      const x0 = j * a2[0], im = Math.ceil(rc / a) + 1, ic = Math.round((x - x0) / a);
      for (let i = ic - im; i <= ic + im; i++) { const dx = x - x0 - i * a1[0], r = Math.hypot(dx, dy); if (r < rc) s += K0(Math.max(r, 1e-9)); }
    }
    return s + TAU / cellArea(a) * rc * K1(rc);
  }
  // one unit cell tabulated on an m x m grid in fractional coordinates, for fast periodic lookup
  function latticeTable(a, m = 72) {
    const tab = new Float64Array(m * m), a2x = a / 2, a2y = a * Math.sqrt(3) / 2;
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { const u = i / m, v = j / m; tab[j * m + i] = latticeB(a, u * a + v * a2x, v * a2y); }
    const at = (x, y) => {
      let v = y / a2y, u = (x - v * a2x) / a; u -= Math.floor(u); v -= Math.floor(v);
      const fi = u * m, fj = v * m, i0 = Math.floor(fi) % m, j0 = Math.floor(fj) % m, i1n = (i0 + 1) % m, j1n = (j0 + 1) % m, du = fi - Math.floor(fi), dv = fj - Math.floor(fj);
      return (1 - du) * (1 - dv) * tab[j0 * m + i0] + du * (1 - dv) * tab[j0 * m + i1n] + (1 - du) * dv * tab[j1n * m + i0] + du * dv * tab[j1n * m + i1n];
    };
    return { tab, m, at };
  }
  const PHI0 = 2.067833848e-15;                          // Wb

  const M = { i1, i1p, lambdaT, londonSphere, momentClosed, fieldLine, glF, glPsi2, glFmin, BCS_JUMP, K0, K1, besselI0, cellArea, spacingFromB, latticeB, latticeTable, PHI0 };
  (window.LabModels = window.LabModels || {})['superconductivity'] = M;

  function frame(ctx, caps, twoRight) {
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
    st.p2 = L.h('div', '', st.c2);
    if (twoRight) { st.cap3 = L.h('p', 'lab-cap', st.c2, caps[2]); st.p3 = L.h('div', '', st.c2); }
    st.leg = L.h('div', '', st.frame);
    return st;
  }

  /* ---------------- 1. Meissner sphere ---------------- */
  const RINGS = [0.3, 0.55, 0.8, 1.05, 1.4, 1.85];
  const AZ = 6;
  D['meissner-sphere'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('A superconducting sphere in a uniform vertical field. Below Tc, currents flowing within a penetration depth λ of the surface cancel the field inside, and the field lines bend around the sphere. Near Tc, λ grows and the lines leak through; above Tc the metal is normal and the field passes straight through. The gold ring is the screening current. Drag to turn the view.', '一様な鉛直の磁場の中に置いた超伝導の球です。Tc より下では、表面から侵入長 λ 以内を流れる電流が内部の磁場を打ち消し、磁力線は球のまわりを回り込みます。Tc に近づくと λ が大きくなり、磁力線が内部に漏れ込みます。Tc より上では金属は常伝導で、磁場はまっすぐ通り抜けます。金色の輪は遮蔽電流です。ドラッグで視点を回せます。'),
        T('A slice through the axis, shaded by the field strength |B| / B₀. The lines are the same field lines, each a contour of the flux function.', '軸を通る断面を、磁場の強さ |B| / B₀ で塗り分けています。線は同じ磁力線で、それぞれが磁束関数の等高線です。'),
        T('The penetration depth λ(T) / λ₀ = 1 / √(1 − t⁴). Drag the point to change the temperature.', '侵入長 λ(T) / λ₀ = 1 / √(1 − t⁴) です。点をドラッグすると温度が変わります。'),
      ], true);
      const t = v.t, a0 = v.a0, lam = lambdaT(t), a = t >= 1 ? 0 : a0 / lam;
      const S0 = londonSphere(a);
      const psis = RINGS.map((r0) => r0 * r0 / 2);
      const lines = psis.map((p) => fieldLine(S0, p));
      const draw2d = () => {
        st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) { st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the slice on the right shows the same field.', 'このブラウザでは 3D 表示ができません。右の断面が同じ磁場を示します。')); }
        const W = 2.5;
        const f = L.fig(st.p2, { x: [-W, W], y: [-W, W], equal: true, axes: false, grid: false, maxH: 330 });
        const top = 1.6;
        f.raster((x, z) => { const [bx, bz] = S0.Bcyl(Math.abs(x), z); return Math.min(1, Math.hypot(bx, bz) / top); }, { cmap: 'seq', res: 4 });
        f.circle(0, 0, 1, { c: 'ink', w: 1.6, fill: false });
        if (a > 0 && 1 / a < 0.9) f.circle(0, 0, 1 - 1 / a, { c: 'ink', w: 1, dash: true, fill: false, op: 0.6 });
        lines.forEach((ln) => { f.line(ln.map(([r, z]) => [r, z]), { c: 'ink', w: 1.3, op: 0.75 }); f.line(ln.map(([r, z]) => [-r, z]), { c: 'ink', w: 1.3, op: 0.75 }); });
        f.text(0, -1.12, t >= 1 ? T('normal metal', '常伝導') : T('superconductor', '超伝導体'), { anchor: 'middle', small: true, dy: 10 });
        if (a > 0 && 1 / a < 0.9) f.text(1 - 1 / a, 0, T('depth λ', '深さ λ'), { anchor: 'end', small: true, dx: -4 });
        const g = L.fig(st.p3, { x: [0, 1.2], y: [0, 5], aspect: 0.5, maxH: 200, xlabel: T('temperature t = T / Tc', '温度 t = T / Tc'), ylabel: 'λ / λ₀' });
        g.line(L.sample(0, 0.995, 200, (x) => [x, Math.min(5.2, lambdaT(x))]), { c: 'c1', w: 2.4 });
        g.vline(1, { c: 'muted', dash: true, w: 1 });
        g.text(1, 4.6, 'Tc', { small: true, dx: 4 });
        g.handle(Math.min(t, 1.2), t >= 1 ? 4.8 : Math.min(4.8, lam), { c: 'hl', label: T('temperature', '温度'), axis: 'x', bounds: [0, 1.2, 0, 5], snap: 0.01, onDrag: (x) => ctx.set('t', x) });
        L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('|B| / B₀ from 0 (light) to 1.6 (deep)', '|B| / B₀、0（淡）から 1.6（濃）') }, { c: 'c1', label: T('field lines, 3D', '磁力線（3D）') }, { kind: 'dot', c: 'hl', label: T('screening current and the temperature', '遮蔽電流と温度') }]);
        ctx.readout([
          { k: T('penetration depth λ / R', '侵入長 λ / R'), v: t >= 1 ? '∞' : fmt(1 / a, 3), tone: 'key' },
          { k: T('induced moment ÷ perfect diamagnet', '誘導モーメント ÷ 完全反磁性'), v: fmt(S0.f, 3), tone: 'key' },
          { k: T('field at the equator, just outside', '赤道のすぐ外の磁場'), v: fmt(S0.Beq, 3) + ' B₀' },
          { k: T('field at the centre', '中心の磁場'), v: fmt(S0.Bcentre, 4) + ' B₀', tone: S0.Bcentre < 0.01 ? 'good' : undefined },
        ], t >= 1 ? T('Above Tc there are no supercurrents: the sphere is transparent to a static field.', 'Tc より上では超伝導電流がないので、球は静磁場に対して透明です。')
          : T('A perfect diamagnet (λ → 0) has moment −2πR³B₀/μ₀ and squeezes the field to 1.5 B₀ at its equator; a finite λ lets some flux in and reduces both.', '完全反磁性体（λ → 0）のモーメントは −2πR³B₀/μ₀ で、赤道の磁場を 1.5 B₀ まで押し上げます。有限の λ は磁束の一部を内部に入れ、どちらも小さくします。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.95, maxH: 520, camera: [6.4, -7.8, 2.9], target: [0, 0, 0], fov: 30,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          S.backdrop();
          st.sph = S.sphere([0, 0, 0], 1, { c: 'c3', opacity: 0.1, rough: 0.12, coat: 0.9, glass: true, thickness: 0.6, ior: 1.3 });
          st.tubes = [];
          RINGS.forEach((r0, ri) => { for (let k = 0; k < AZ; k++) st.tubes.push({ ri, k, m: S.tube([[0, 0, -1], [0, 0, 1]], { c: ri < 3 ? 'c1' : 'c4', r: 0.018, n: 200 }) }); });
          st.ring = S.tube(L.seq(97, (i) => [0.92 * Math.cos(TAU * i / 96), 0.92 * Math.sin(TAU * i / 96), 0]), { c: 'hl', r: 0.03, glow: 0.35 });
          st.cones = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 20), S.mat('hl', { rough: 0.3, glow: 0.3 })); S.add(m); return m; });
          st.b0 = S.arrow([-2.15, -1.7, -1.6], [0, 0, 1.1], { c: 'ink', r: 0.03 });
          S.label('B₀', [-2.15, -1.7, -0.35], { small: true, align: 'middle' });
          st.lab = S.label('', [0, 0, -1.35], { small: true, align: 'middle' });
        },
        update(S) {
          st.tubes.forEach(({ ri, k, m }) => {
            const ln = lines[ri], phi = TAU * k / AZ + (ri % 2 ? PI / AZ : 0), c = Math.cos(phi), s = Math.sin(phi);
            m.update(ln.length > 1 ? ln.map(([r, z]) => [r * c, r * s, z]) : [[0, 0, 0], [0, 0, 0.001]]);
          });
          const sc = t < 1;
          st.ring.visible = sc; st.cones.forEach((m) => { m.visible = sc; });
          const rr = Math.max(0.55, 1 - Math.min(0.45, 1 / Math.max(a, 1e-9)) * 0.7);
          st.ring.update(L.seq(97, (i) => [rr * Math.cos(TAU * i / 96), rr * Math.sin(TAU * i / 96), 0]));
          st.cones.forEach((m, i) => {
            const ph = TAU * i / 4 + 0.4, p = new S.THREE.Vector3(rr * Math.cos(ph), rr * Math.sin(ph), 0);
            m.position.copy(p);
            // diamagnetic current runs clockwise seen from +z (negative phi direction)
            const dir = new S.THREE.Vector3(Math.sin(ph), -Math.cos(ph), 0);
            m.quaternion.setFromUnitVectors(new S.THREE.Vector3(0, 1, 0), dir);
          });
          const sm = st.sph.material;
          if (sm.transmission) sm.color.copy(S.colour(sc ? 'c3' : 'muted')).lerp(S.colour('#ffffff'), 0.8);
          st.lab.set([0, 0, -1.4], sc ? '' : T('normal state', '常伝導'));
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 2. Ginzburg-Landau ---------------- */
  D['gl-transition'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('The Ginzburg–Landau free energy over the complex plane of the order parameter ψ. Above Tc it is a bowl with its minimum at ψ = 0. Below Tc the centre rises into a hill and the minimum becomes a ring at |ψ|² = 1 − t: the superconductor must pick one phase on the ring. Drag the gold ball around the trough; every phase costs the same.', '秩序パラメータ ψ の複素平面上の、ギンツブルグ・ランダウ自由エネルギーです。Tc より上では最小が ψ = 0 にあるお椀です。Tc より下では中心が盛り上がって丘になり、最小は |ψ|² = 1 − t の輪になります。超伝導体は輪の上の一つの位相を選ばなければなりません。金色の球を谷に沿ってドラッグしてください。どの位相もエネルギーは同じです。'),
        T('The order parameter and the condensation energy against temperature. Drag the point to cool or warm the sample.', '温度に対する秩序パラメータと凝縮エネルギーです。点をドラッグすると試料を冷やしたり温めたりできます。'),
        T('Specific heat. The free energy falls as (1 − t)², so its second derivative, and the heat capacity, jumps at Tc: a second-order transition. The jump is set to the BCS value 1.43 γTc.', '比熱です。自由エネルギーは (1 − t)² で下がるので、その二階微分、つまり熱容量が Tc で跳びます。これが二次転移です。跳びの大きさは BCS の値 1.43 γTc にしています。'),
      ], true);
      const t = v.t, phi = v.phi * PI / 180, m0 = Math.sqrt(glPsi2(t)), fmin = glFmin(t);
      const ZS = 2, RM = 1.15;
      const draw2d = () => {
        st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const f0 = L.fig(st.v3, { x: [-RM, RM], y: [-0.6, 1.2], aspect: 0.62, maxH: 330, xlabel: 'Re ψ', ylabel: 'f' });
          f0.line(L.sample(-RM, RM, 200, (x) => [x, glF(t, x)]), { c: 'c1', w: 2.6 });
          f0.dot(m0 * Math.cos(phi), fmin, { c: 'hl', r: 7 });
        }
        const g = L.fig(st.p2, { x: [0, 1.4], y: [-0.55, 1.05], aspect: 0.5, maxH: 220, xlabel: 't = T / Tc', ylabel: '' });
        g.hline(0, { c: 'ink', w: 1, op: 0.5 });
        g.line(L.sample(0, 1.4, 160, (x) => [x, glPsi2(x)]), { c: 'c1', w: 2.6 });
        g.line(L.sample(0, 1.4, 160, (x) => [x, glFmin(x)]), { c: 'c2', w: 2.4 });
        g.vline(1, { c: 'muted', dash: true, w: 1 }); g.text(1, 0.95, 'Tc', { small: true, dx: 4 });
        g.handle(t, glPsi2(t), { c: 'hl', label: T('temperature', '温度'), axis: 'x', bounds: [0, 1.4, -1, 2], snap: 0.01, onDrag: (x) => ctx.set('t', x) });
        const h = L.fig(st.p3, { x: [0, 1.4], y: [0, 2.7], aspect: 0.42, maxH: 190, xlabel: 't = T / Tc', ylabel: 'C / γTc' });
        h.line(L.sample(0, 1.4, 100, (x) => [x, x]), { c: 'muted', w: 1.4, dash: true });
        h.line(L.sample(0, 0.999, 120, (x) => [x, x * (1 + BCS_JUMP)]), { c: 'c3', w: 2.4 });
        h.line(L.sample(1, 1.4, 40, (x) => [x, x]), { c: 'c3', w: 2.4 });
        h.seg([1, 1], [1, 1 + BCS_JUMP], { c: 'c3', w: 1.4, dash: true });
        h.dot(t, t < 1 ? t * (1 + BCS_JUMP) : t, { c: 'hl', r: 5 });
        L.legend(st.leg, [{ c: 'c1', label: T('|ψ|² = 1 − t (in units of a₀Tc / b)', '|ψ|² = 1 − t（単位 a₀Tc / b）') }, { c: 'c2', label: T('condensation energy f_s − f_n = −(1 − t)² / 2', '凝縮エネルギー f_s − f_n = −(1 − t)² / 2') }, { c: 'c3', label: T('heat capacity near Tc (GL, scaled to BCS)', 'Tc 近くの熱容量（GL、BCS に合わせた尺度）') }, { c: 'muted', dash: true, label: T('normal metal, C = γT', '常伝導金属 C = γT') }]);
        ctx.readout([
          { k: T('|ψ|² at the minimum', '最小での |ψ|²'), v: fmt(glPsi2(t), 3), tone: 'key' },
          { k: T('condensation energy (units a₀²Tc² / b)', '凝縮エネルギー（単位 a₀²Tc² / b）'), v: fmt(fmin, 4), tone: 'key' },
          { k: T('phase of ψ', 'ψ の位相'), v: t < 1 ? fmt(v.phi, 0) + '°' : T('undefined (ψ = 0)', '定まらない（ψ = 0）') },
          { k: T('coherence length ξ / ξ₀ = 1 / √(1 − t)', 'コヒーレンス長 ξ / ξ₀ = 1 / √(1 − t)'), v: t < 1 ? fmt(1 / Math.sqrt(1 - t), 3) : '∞' },
        ], t < 1 ? T('The free energy does not care which phase is chosen, but the superconductor must choose one: a broken symmetry. Changing the phase slowly through space costs energy, which is the stiffness behind the Meissner effect.', '自由エネルギーはどの位相を選んでも同じですが、超伝導体は一つを選ばなければなりません。これが対称性の破れです。位相を空間的にゆっくり変えるにはエネルギーが要り、それがマイスナー効果の背後にある硬さです。')
          : T('Above Tc the minimum is at ψ = 0: no condensate, no phase, an ordinary metal.', 'Tc より上では最小は ψ = 0 にあります。凝縮体も位相もなく、ふつうの金属です。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 470, camera: [2.5, -3.3, 3.5], target: [0, 0, 0.15], fov: 34,
        init(S) {
          st.flat = false;
          st.surf = S.surface((r, th) => [r * Math.cos(th), r * Math.sin(th), 0], { u: [0, RM], v: [0, TAU], nu: 64, nv: 120, c: 'c1', rough: 0.35, coat: 0.6, wire: true, wireEvery: 8, wireEveryV: 10, wireOpacity: 0.18 });
          st.trough = S.tube([[0, 0, 0], [0, 0, 0.001]], { c: 'hl', r: 0.012, n: 120, closed: true });
          st.ball = S.sphere([0, 0, 0], 0.09, { c: 'hl', glow: 0.2 });
          st.arrow = S.arrow([0, 0, 0], [1, 0, 0], { c: 'ink', r: 0.02 });
          st.labRe = S.label('Re ψ', [RM + 0.15, 0, 0], { small: true }); st.labIm = S.label('Im ψ', [0, RM + 0.15, 0], { small: true });
          S.lines([[[-RM, 0, 0], [RM, 0, 0]], [[0, -RM, 0], [0, RM, 0]]], { c: 'muted', opacity: 0.5, w: 1.2 });
          st.hdl = S.handle([1, 0, 0], { facing: true, r: 0.12, c: 'hl', onDrag: (q) => { const deg = (Math.round(Math.atan2(q.y, q.x) * 180 / PI) + 360) % 360; ctx.set('phi', deg); const mm = Math.sqrt(glPsi2(ctx.state.tNow ?? 0.6)); return [mm * Math.cos(deg * PI / 180), mm * Math.sin(deg * PI / 180), ZS * glFmin(ctx.state.tNow ?? 0.6)]; } });
        },
        update(S) {
          st.tNow = t;
          st.surf.update((r, th) => [r * Math.cos(th), r * Math.sin(th), ZS * glF(t, r)], (r, th) => S.cmap.phase(th, 1).lerp(S.colour('#ffffff'), 0.3 * (1 - r / RM)));
          st.trough.visible = t < 1;
          st.trough.update(L.seq(121, (i) => { const a = TAU * i / 120; return [m0 * Math.cos(a), m0 * Math.sin(a), ZS * fmin + 0.012]; }));
          const p = [m0 * Math.cos(phi), m0 * Math.sin(phi), ZS * fmin + 0.08];
          st.ball.at(p); st.hdl.at(p); st.hdl.enable?.(t < 1);
          st.arrow.visible = t < 1 && m0 > 0.05; if (m0 > 0.05) st.arrow.set([0, 0, ZS * fmin + 0.08], [m0 * Math.cos(phi) * 0.92, m0 * Math.sin(phi) * 0.92, 0]);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. Abrikosov lattice ---------------- */
  D['vortex-lattice'] = {
    render(ctx, v) {
      const st = ctx.state, kap = v.kappa, b = v.b, lamNm = v.lam;
      const bbar = b * kap * kap, a = spacingFromB(bbar), xi = 1 / kap;
      const key = a.toFixed(6);
      if (st.key !== key) { st.key = key; st.table = latticeTable(a); }
      const tab = st.table;
      const Bcore = latticeB(a, xi, 0), Bmin = latticeB(a, a / 2, a / (2 * Math.sqrt(3)));
      const row = L.h('div', 'lab-row is-wide', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A type II superconductor between Hc1 and Hc2. The field enters as vortices, each a tube of normal core (dark dot, radius ξ) wrapped in circulating current that carries exactly one flux quantum. They repel and settle into a triangular lattice. Shading is B; the bar is one penetration depth λ. Drag the ringed vortex to change the spacing, which sets the field.', 'Hc1 と Hc2 の間にある第二種超伝導体です。磁場は渦糸として入ります。渦糸は常伝導の芯（暗い点、半径 ξ）を循環電流が包んだ管で、ちょうど一つの磁束量子を運びます。渦糸は互いに反発し、三角格子に落ち着きます。濃淡は B、棒は侵入長 λ 一つ分です。輪のついた渦糸をドラッグすると間隔が変わり、それが磁場を決めます。'));
      const X = 1.75 * a, Y = 1.3 * a;
      const f = L.fig(c1, { x: [-X, X], y: [-Y, Y], equal: true, axes: false, grid: false, maxH: 420 });
      f.raster((x, y) => Math.max(0, Math.min(1, (tab.at(x, y) - Bmin) / (Bcore - Bmin))) ** 0.6, { cmap: 'seq', res: 3 });
      const pts = [];
      const jm = Math.ceil(Y / (a * Math.sqrt(3) / 2)) + 1, im = Math.ceil(X / a) + 2;
      for (let j = -jm; j <= jm; j++) for (let i = -im; i <= im; i++) { const x = i * a + j * a / 2, y = j * a * Math.sqrt(3) / 2; if (Math.abs(x) <= X && Math.abs(y) <= Y) pts.push([x, y]); }
      pts.forEach(([x, y]) => f.circle(x, y, Math.max(xi, a * 0.02), { c: 'ink', fill: true, fo: 0.85, w: 0 }));
      // the unit cell
      const h = a * Math.sqrt(3) / 2;
      f.poly([[0, 0], [a, 0], [a * 1.5, h], [a / 2, h]], { c: 'hl', fill: false, w: 1.6, dash: true });
      f.circle(a, 0, a * 0.14, { c: 'hl', w: 2.4, fill: false });
      f.handle(a, 0, { c: 'hl', label: T('vortex spacing', '渦糸の間隔'), axis: 'x', bounds: [0.18, 3 * a + 4, 0, 0], onDrag: (nx) => { const na = Math.max(0.05, nx), nb = TAU / cellArea(na) / (kap * kap); ctx.set('b', Math.round(Math.min(0.4, Math.max(0.0005, nb)) * 2000) / 2000); } });
      const barY = -Y * 0.86, barX = -X * 0.92;
      f.seg([barX, barY], [barX + 1, barY], { c: 'ink', w: 3 });
      f.text(barX + 0.5, barY, 'λ', { anchor: 'middle', small: true, math: true, dy: -6 });
      // profile
      L.h('p', 'lab-cap', c2, T('The field along a row of vortices, in units of the mean field B̄. Each vortex is a peak of width λ; between them the field dips but never to zero once λ exceeds the spacing.', '渦糸の列に沿った磁場を、平均磁場 B̄ を単位にして示します。各渦糸は幅 λ の山で、間では磁場が下がりますが、λ が間隔より大きければゼロにはなりません。'));
      const prof = L.sample(-X, X, 300, (x) => [x, Math.min(latticeB(a, x, 0), Bcore) / bbar]);
      const ymax = Math.min(6, Math.max(...prof.map((p) => p[1])) * 1.05);
      const g = L.fig(c2, { x: [-X, X], y: [0, Math.max(1.5, ymax)], aspect: 0.62, maxH: 280, xlabel: T('position along the row (units of λ)', '列に沿った位置（単位 λ）'), ylabel: 'B / B̄' });
      g.line(prof.map(([x, y]) => [x, Math.min(y, ymax)]), { c: 'c1', w: 2.4 });
      g.hline(1, { c: 'muted', dash: true, w: 1.2 }); g.text(X, 1, T('mean B̄', '平均 B̄'), { anchor: 'end', small: true, dy: -5 });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('local field B (deep = strong), clipped at the core', '局所磁場 B（濃いほど強い）、芯で打ち切り') }, { kind: 'dot', c: 'ink', label: T('normal core, radius ξ = λ / κ', '常伝導の芯、半径 ξ = λ / κ') }, { c: 'hl', dash: true, label: T('unit cell: area holds one flux quantum Φ₀', '単位胞：面積内にちょうど一つの磁束量子 Φ₀') }]);
      const unitT = PHI0 / (TAU * (lamNm * 1e-9) ** 2);        // tesla per field unit
      const aNm = a * lamNm;
      ctx.readout([
        { k: T('mean field B̄ = Φ₀ / (cell area)', '平均磁場 B̄ = Φ₀ / 単位胞の面積'), v: fmt(bbar * unitT, 3) + ' T', tone: 'key' },
        { k: T('vortex spacing a', '渦糸の間隔 a'), v: fmt(aNm, 3) + ' nm (' + fmt(a, 3) + ' λ)', tone: 'key' },
        { k: T('Hc2 = Φ₀ / 2πξ²', 'Hc2 = Φ₀ / 2πξ²'), v: fmt(kap * kap * unitT, 3) + ' T' },
        { k: T('Hc1 ≈ Φ₀ ln κ / 4πλ² (large κ)', 'Hc1 ≈ Φ₀ ln κ / 4πλ²（κ が大きいとき）'), v: fmt(0.5 * Math.log(kap) * unitT * 1000, 3) + ' mT' },
        { k: T('field dip between vortices, B_min / B̄', '渦糸の間の磁場 B_min / B̄'), v: fmt(Bmin / bbar, 3) },
        { k: 'Φ₀ = h / 2e', v: '2.068 × 10⁻¹⁵ Wb' },
      ], b > 0.25 ? T('Close to Hc2 the cores overlap and the London picture used here fails; the Abrikosov solution of the full GL equations takes over.', 'Hc2 に近づくと芯が重なり、ここで使っているロンドンの描像は破綻します。そこでは完全な GL 方程式のアブリコソフ解が代わります。')
        : T('The flux quantum is h/2e, not h/e: the current is carried by pairs of electrons. Measuring it was early evidence for Cooper pairs.', '磁束量子は h/e ではなく h/2e です。電流は電子の対が運ぶからです。その測定はクーパー対の初期の証拠になりました。'));
    },
  };
})();
