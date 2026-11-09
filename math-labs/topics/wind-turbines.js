'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180, RHO = 1.225;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Actuator disc (Rankine-Froude): axial induction a, C_P = 4a(1 - a)^2 (Betz maximum 16/27 at a = 1/3), C_T = 4a(1 - a),
   * far-wake speed U(1 - 2a), wake area A(1 - a)/(1 - 2a). On the axis the velocity is U[1 - a(1 + x/sqrt(x^2 + R^2))]
   * (a uniformly loaded disc), used here for the shape of the stream tube by continuity.
   * Glauert's optimum rotor with wake rotation: C_P,max(lambda) = (24/lambda^2) int_{1/4}^{a2} [(1 - a)(1 - 2a)(1 - 4a)/(1 - 3a)]^2 da,
   * with lambda^2 = (1 - a2)(1 - 4 a2)^2/(1 - 3 a2) at the tip.
   * Blade element momentum for a three-bladed rotor designed for lambda_d = 7 (Betz-optimum chord and twist), thin-airfoil
   * lift with stall, Prandtl tip loss, Glauert's correction for heavily loaded annuli.
   */
  const cp = (a) => 4 * a * (1 - a) ** 2, ct = (a) => 4 * a * (1 - a);
  const axialSpeed = (x, a, R = 1) => 1 - a * (1 + x / Math.hypot(x, R));
  const tubeRadius = (x, a, R = 1) => R * Math.sqrt((1 - a) / Math.max(1e-6, axialSpeed(x, a, R)));
  function glauertCp(lam) {
    // tip value a2 in (1/4, 1/3) solving lam^2 = (1 - a)(1 - 4a)^2/(1 - 3a), by bisection
    const g = (a) => ((1 - a) * (1 - 4 * a) ** 2) / (1 - 3 * a) - lam * lam;
    let lo = 0.25, hi = 1 / 3 - 1e-12; for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (g(m) < 0) lo = m; else hi = m; }
    // the integrand grows like (1 - 3a)^-2 near the tip value, so integrate in s = -ln(1 - 3a), da = e^-s/3 ds
    const a2 = 0.5 * (lo + hi), s0 = Math.log(4), s2 = -Math.log(1 - 3 * a2), N = 2000, h = (s2 - s0) / N;
    const f = (s) => { const a = (1 - Math.exp(-s)) / 3; return ((((1 - a) * (1 - 2 * a) * (1 - 4 * a)) / (1 - 3 * a)) ** 2 * Math.exp(-s)) / 3; };
    let sum = f(s0) + f(s2); for (let i = 1; i < N; i++) sum += f(s0 + i * h) * (i % 2 ? 4 : 2);
    return (24 / (lam * lam)) * ((sum * h) / 3);
  }
  // the design: three blades, design tip-speed ratio 7, design lift coefficient 1.0 at 6 degrees
  const B = 3, LD = 7, CLD = 1.0, AD = 6 * DEG;
  const designPhi = (r) => (2 / 3) * Math.atan(1 / (LD * r));                       // r = radius / R
  const chord = (r) => Math.min(0.085, (8 * PI * r * (1 - Math.cos(designPhi(r)))) / (B * CLD));   // chord / R, capped at the root
  const twist = (r) => designPhi(r) - AD;                                              // section angle relative to the rotor plane at zero pitch
  function polar(al) {   // thin-airfoil lift with a soft stall at about 12 degrees, and a simple drag polar
    const d = al / DEG, cl = d < 12 ? 2 * PI * (al + 2 * DEG) * 0.9 : Math.max(0.6, 2 * PI * (14 * DEG) * 0.9 - 0.05 * (d - 12));
    return { cl: d < -10 ? -0.8 : cl, cd: 0.008 + 0.012 * (d / 10) ** 2 + (d > 12 ? 0.02 * (d - 12) : 0) };
  }
  // BEM: returns C_P, C_T and per-annulus results at tip-speed ratio lam and pitch (radians)
  function bem(lam, pitch = 0, n = 30) {
    let cpS = 0, ctS = 0; const out = [];
    for (let i = 0; i < n; i++) {
      const r = 0.15 + (0.85 * (i + 0.5)) / n, dr = 0.85 / n, lr = lam * r, sigma = (B * chord(r)) / (2 * PI * r);
      let a = 0.3, ap = 0.0, phi = 0, al = 0, P = null, F = 1;
      for (let k = 0; k < 200; k++) {
        phi = Math.atan2(1 - a, lr * (1 + ap)); al = phi - twist(r) - pitch; P = polar(al);
        const cn = P.cl * Math.cos(phi) + P.cd * Math.sin(phi), cT = P.cl * Math.sin(phi) - P.cd * Math.cos(phi);
        const f = (B / 2) * (1 - r) / (r * Math.max(1e-4, Math.sin(phi))); F = Math.max(1e-3, (2 / PI) * Math.acos(Math.min(1, Math.exp(-f))));
        let an = 1 / ((4 * F * Math.sin(phi) ** 2) / (sigma * cn) + 1);
        if (an > 0.4) {   // Glauert correction (Buhl's form) for heavily loaded annuli
          const CTl = (sigma * (1 - a) ** 2 * cn) / Math.sin(phi) ** 2;
          an = (18 * F - 20 - 3 * Math.sqrt(Math.max(0, CTl * (50 - 36 * F) + 12 * F * (3 * F - 4)))) / (36 * F - 50);
        }
        const apn = 1 / ((4 * F * Math.sin(phi) * Math.cos(phi)) / (sigma * cT) - 1);
        const da = an - a, dap = apn - ap; a += 0.4 * da; ap += 0.4 * dap;
        if (Math.abs(da) < 1e-7 && Math.abs(dap) < 1e-7) break;
      }
      const W2 = ((1 - a) ** 2 + (lr * (1 + ap)) ** 2), cT = P.cl * Math.sin(phi) - P.cd * Math.cos(phi), cn = P.cl * Math.cos(phi) + P.cd * Math.sin(phi);
      // power and thrust coefficients from the blade forces: dC_P = (B c W^2 cT lam r dr)/(pi R^2 ...) in units R = U = 1
      cpS += (B * chord(r) * W2 * cT * lam * r * dr) / PI;
      ctS += (B * chord(r) * W2 * cn * dr) / PI;
      out.push({ r, a, ap, alpha: al, phi, F });
    }
    return { cp: cpS, ct: ctS, ann: out };
  }
  const M = { cp, ct, axialSpeed, tubeRadius, glauertCp, chord, twist, designPhi, polar, bem, B, LD };
  (window.LabModels = window.LabModels || {})['wind-turbines'] = M;

  /* ---------------- a realistic three-bladed upwind turbine (shared by the 3D labs) ---------------- */
  function buildTurbine(S, o = {}) {
    const TH = S.THREE, R = o.R ?? 1.6, hubH = o.hub ?? 2.9, g = new TH.Group();
    const white = S.mat('#eef0f1', { rough: 0.32, coat: 0.7 }), grey = S.mat('#c9cdd1', { rough: 0.4, coat: 0.5 });
    // tower: a tapered steel tube with a flange at the base
    const tower = S.sweep((u) => [0, 0, u * (hubH - 0.12)], (u) => S.ring(0.09 - 0.04 * u, 36), { n: 30, c: '#e9ecee', rough: 0.35, coat: 0.6, add: false }); g.add(tower);
    const flange = new TH.Mesh(new TH.CylinderGeometry(0.15, 0.17, 0.06, 40).rotateX(PI / 2), grey); flange.position.z = 0.03; g.add(flange);
    const door = new TH.Mesh(new TH.BoxGeometry(0.01, 0.06, 0.13), S.mat('#9aa1a8', { metal: 0.6, rough: 0.4 })); door.position.set(0.087, 0, 0.16); g.add(door);
    // nacelle: a rounded box, yawing on top of the tower; hub axis along -x (the turbine faces into the wind, which blows +x)
    const nac = new TH.Group(); nac.position.set(0, 0, hubH); g.add(nac);
    const body = new TH.Mesh(new TH.CapsuleGeometry(0.13, 0.42, 8, 24).rotateZ(PI / 2), white); body.scale.set(1, 1, 1.05); body.position.set(0.24, 0, 0.0); nac.add(body);
    const cooler = new TH.Mesh(new TH.BoxGeometry(0.12, 0.2, 0.05), grey); cooler.position.set(0.42, 0, 0.15); nac.add(cooler);
    const anemo = new TH.Mesh(new TH.CylinderGeometry(0.006, 0.006, 0.09, 8).rotateX(PI / 2), grey); anemo.position.set(0.5, 0.05, 0.19); nac.add(anemo);
    // rotor: hub, spinner (nose cone) and three blades; the rotor group spins about x
    const rotor = new TH.Group(); rotor.position.set(-0.12, 0, 0); nac.add(rotor);
    const spinPts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; spinPts.push(new TH.Vector2(0.13 * Math.sqrt(Math.max(0, 1 - (1 - t) ** 2.2)), -0.26 * (1 - t))); }
    const spinner = new TH.Mesh(new TH.LatheGeometry(spinPts, 48).rotateZ(-PI / 2), white); spinner.position.x = -0.02; rotor.add(spinner);
    const blades = [];
    for (let b = 0; b < 3; b++) {
      const arm = new TH.Group(); arm.rotation.x = (b * TAU) / 3; rotor.add(arm);
      const pitchG = new TH.Group(); arm.add(pitchG);
      // blade: radial along +z of the arm; sections from a cylinder at the root to cambered airfoils with Betz-optimum chord and twist
      const r0 = 0.06, sec = (u) => {
        const rr = (r0 + (R - r0) * u) / R, c = chord(Math.max(rr, 0.16)) * R, tw = twist(Math.max(rr, 0.16)), th = clamp(0.42 - 1.5 * (rr - 0.12), 0.15, 0.42);
        const foil = S.naca(th, 0.03, 0.4, 18), blend = clamp((rr - 0.06) / 0.14, 0, 1), cr = 0.045;
        return foil.map(([x, y], j) => {
          const ang = (j / foil.length) * TAU, cx = -cr * Math.cos(ang), cy = cr * Math.sin(ang);     // the round root
          const ax = (x - 0.3) * c, ay = y * c, px = (1 - blend) * cx + blend * ax, py = (1 - blend) * cy + blend * ay;
          const ca = Math.cos(tw), sa = Math.sin(tw);
          // chord along the direction of rotation (tangential, +y here), rotated by the twist towards the wind (+x)
          return [px * sa - py * ca, px * ca + py * sa];
        });
      };
      const mesh = S.sweep((u) => [0, 0, r0 + (R - r0) * u], sec, { n: 46, up: [1, 0, 0], c: '#f3f4f5', rough: 0.3, coat: 0.85, caps: true, add: false });
      pitchG.add(mesh);
      const tip = S.sweep((u) => [0, 0, R * (0.94 + 0.05 * u)], (u) => sec(0.94 + 0.05 * u).map(([p, q]) => [p * 1.01, q * 1.01]), { n: 3, up: [1, 0, 0], c: '#d64b3b', rough: 0.35, coat: 0.8, add: false });
      pitchG.add(tip);
      blades.push(pitchG);
    }
    S.add(g);
    return { group: g, rotor, blades, hubPos: [-0.12, 0, hubH], setPitch: (p) => blades.forEach((q) => { q.rotation.z = p; }) };
  }

  /* ================= 1. Betz: the stream tube (3D) ================= */
  const XA = -2.6, XB = 4.8;   // stream tube extent, in rotor radii
  D['betz-streamtube'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        st.cap1 = L.h('p', 'lab-cap', st.frame); st.v3 = L.h('div', '', st.frame);
        const row = L.h('div', 'lab-row', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap2 = L.h('p', 'lab-cap', st.c1); st.g2 = L.h('div', '', st.c1);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const a = v.a, Cp = cp(a), Ct = ct(a), A = PI * v.R * v.R, P = 0.5 * RHO * A * v.U ** 3 * Cp;
      L.setText(st.cap1, T(tx`A three-bladed turbine in a steady wind \(U\) from the left. The translucent tube holds exactly the air that passes through the rotor: it slows from \(U\) to \(U(1-a)\) at the disc and \(U(1-2a)\) far behind, so by continuity the tube widens. The smoke moves at the local speed. Drag the slider \(a\), or the gold point on the graph below.`, tx`左から一定の風 \(U\) を受ける 3 枚羽根の風車です。半透明の管は、ちょうどローターを通り抜ける空気を囲んでいます。空気は円盤で \(U\) から \(U(1-a)\) に、はるか後ろで \(U(1-2a)\) に遅くなるので、連続の式によって管は太くなります。煙は局所的な速さで動きます。スライダー \(a\) か、下のグラフの金色の点をドラッグしてください。`));
      L.setText(st.cap2, T(tx`Power and thrust coefficients against the induction factor. Extracting power needs the air slowed, but slowing it too much diverts it around the rotor: the best compromise, \(a=1/3\), captures \(16/27\) of the wind’s power.`, tx`誘導係数に対するパワー係数と推力係数です。パワーを取り出すには空気を遅くする必要がありますが、遅くしすぎると空気はローターを避けて流れます。最良の折り合い \(a=1/3\) で、風のパワーの \(16/27\) を取り込みます。`));
      L.setText(st.cap3, T(tx`Wind speed along the axis of the stream tube, \(U[1-a(1+x/\sqrt{x^2+R^2})]\): half the slowing happens before the air reaches the rotor.`, tx`流管の軸に沿った風速 \(U[1-a(1+x/\sqrt{x^2+R^2})]\) です。減速の半分は、空気がローターに達する前に起こります。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 0.5], y: [0, 1.05], aspect: 0.62, maxH: 280, xlabel: T(tx`axial induction \(a\)`, tx`軸方向誘導係数 \(a\)`), ylabel: T('coefficient', '係数') });
      f.line(L.sample(0, 0.5, 200, (x) => [x, cp(x)]), { c: 'c1', w: 2.6 }); f.line(L.sample(0, 0.5, 200, (x) => [x, ct(x)]), { c: 'c2', w: 2.2 });
      f.hline(16 / 27, { c: 'c3', dash: '5 4' }); f.text(0.02, 16 / 27, T(tx`Betz limit \(16/27\)`, tx`ベッツの限界 \(16/27\)`), { small: true, anchor: 'start', dy: -7, c: 'c3' });
      f.handle(a, Cp, { c: 'hl', axis: 'x', bounds: [0, 0.5, 0, 1], label: T('induction factor', '誘導係数'), onDrag: (x) => ctx.set('a', clamp(Math.round(x * 100) / 100, 0, 0.5)) });
      const g = L.fig(st.g3, { x: [-4, 7], y: [0, 1.05], aspect: 0.62, maxH: 280, xlabel: T(tx`distance from the rotor \(x/R\)`, tx`ローターからの距離 \(x/R\)`), ylabel: tx`\(u/U\)` });
      g.line(L.sample(-4, 7, 200, (x) => [x, axialSpeed(x, a)]), { c: 'c1', w: 2.6 }); g.vline(0, { c: 'ink', dash: null, w: 3 });
      g.hline(1 - 2 * a, { c: 'muted', dash: '4 4' }); g.text(6.9, 1 - 2 * a, tx`\(1-2a\)`, { small: true, anchor: 'end', dy: -6 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: tx`\(C_P=4a(1-a)^2\)` }, { c: 'c2', label: tx`\(C_T=4a(1-a)\)` }, { c: 'c3', dash: true, label: T('Betz limit', 'ベッツの限界') }]);
      ctx.readout([
        { k: tx`\(C_P\), \(C_T\)`, v: tx`\(${fmt(Cp, 4)},\ ${fmt(Ct, 4)}\)`, tone: Math.abs(a - 1 / 3) < 0.006 ? 'good' : undefined },
        { k: T(tx`speed at the disc and far behind, \(U(1-a)\), \(U(1-2a)\)`, tx`円盤とはるか後ろでの速さ \(U(1-a)\)、\(U(1-2a)\)`), v: tx`\(${fmt(v.U * (1 - a), 3)},\ ${fmt(v.U * (1 - 2 * a), 3)}\ \mathrm{m/s}\)` },
        { k: T(tx`wake area ratio \((1-a)/(1-2a)\)`, tx`後流の面積比 \((1-a)/(1-2a)\)`), v: a < 0.5 ? fmt((1 - a) / (1 - 2 * a), 3) : '∞' },
        { k: T(tx`power \(\tfrac12\rho AU^3C_P\)`, tx`パワー \(\tfrac12\rho AU^3C_P\)`), v: tx`\(${fmt(P / 1e6, 4)}\ \mathrm{MW}\)`, tone: 'key' },
      ], T('A turbine cannot stop the wind: the air must keep moving to leave the rotor. At most 59.3% of the kinetic energy flowing through the rotor area can be extracted by any turbine, however it is built.', '風車は風を止められません。空気はローターから出ていくために動き続けなければならないからです。どんな作り方をしても、ローターの面積を流れる運動エネルギーのうち取り出せるのは最大 59.3% です。'));
      const SC = 1.6;   // display units per rotor radius
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.85 : 0.5, maxH: 520, camera: [-7.2, -10.2, 6.4], target: [1.6, 0, 2.5], fov: 32,
        label: T('3D wind turbine with its stream tube and smoke. Drag to rotate.', '流管と煙をもつ 3D の風車。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.S = S;
          st.T = buildTurbine(S, { R: SC, hub: 2.9 });
          st.T.setPitch(0);
          const hx = st.T.hubPos[0];
          st.tube = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, TAU], nu: 120, nv: 48, c: '#7fb3d8', opacity: 0.1, rough: 0.2, coat: 0.6 });
          st.tube.castShadow = false;
          st.rings = S.lines([], { c: '#5d93bf', opacity: 0.5, w: 1.2 });
          st.smoke = S.points([[0, 0, 0]], { c: '#ffffff', r: 0.035, max: 24 * 18, rough: 0.6, coat: 0.2 });
          S.label(tx`wind \(U\)`, [hx + XA * SC - 0.2, 0, 2.9 + SC + 0.35]);
          st.uArrows = [-0.9, 0, 0.9].map((dz) => S.arrow([hx + XA * SC - 0.9, 0, 2.9 + dz], [0.7, 0, 0], { c: 'c1', r: 0.025 }));
          st.lab = S.label('', [hx + XB * SC - 0.4, 0, 2.9 + SC * 1.75], { small: true, align: 'end' });
          st.clock = 0;
          S.animate((dt) => {
            if (S.reduced()) return false;
            const d = Math.min(dt, 0.05); st.clock += d;
            st.T.rotor.rotation.x = (st.T.rotor.rotation.x + d * 1.1) % TAU;
            st.moveSmoke?.(d); return true;
          });
        },
        update(S) {
          const aa = v.a, hz = 2.9, x0 = st.T.hubPos[0];
          st.tube.update((u, th) => { const xm = XA + (XB - XA) * u, rr = tubeRadius(xm, aa, 1) * SC; return [x0 + xm * SC, rr * Math.cos(th), hz + rr * Math.sin(th)]; });
          const ringSegs = []; for (const xm of [-2, -1, 0, 1, 2, 3, 4]) { const rr = tubeRadius(xm, aa, 1) * SC; for (let k = 0; k < 48; k++) { const t1 = (k / 48) * TAU, t2 = ((k + 1) / 48) * TAU; ringSegs.push([[x0 + xm * SC, rr * Math.cos(t1), hz + rr * Math.sin(t1)], [x0 + xm * SC, rr * Math.cos(t2), hz + rr * Math.sin(t2)]]); } }
          st.rings.update(ringSegs);
          // smoke: 18 streamlines on the tube surface, 24 puffs each, advancing at the local speed
          st.puffs ??= L.seq(18 * 24, (i) => ({ th: ((i % 18) / 18) * TAU, x: XA + ((XB - XA) * Math.floor(i / 18)) / 24 }));
          const place = () => { const pts = st.puffs.map((p) => { const rr = tubeRadius(p.x, aa, 1) * SC * 0.985; return [x0 + p.x * SC, rr * Math.cos(p.th), hz + rr * Math.sin(p.th)]; }); st.smoke.update(pts); };
          st.moveSmoke = (d) => { for (const p of st.puffs) { p.x += d * 1.2 * axialSpeed(p.x, aa, 1); if (p.x > XB) p.x = XA; } place(); };
          place();
          st.lab.set(null, tx`\(C_P=${fmt(cp(aa), 3)}\)`);
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [XA, XB], y: [-3, 3], aspect: 0.4, maxH: 260, axes: false, grid: false });
          f2.area([...L.sample(XA, XB, 120, (x) => [x, tubeRadius(x, a)]), ...L.sample(XB, XA, 120, (x) => [x, -tubeRadius(x, a)])], { c: 'c1', fo: 0.2 });
          f2.seg([0, -1], [0, 1], { c: 'ink', w: 4 });
        },
      });
    },
  };

  /* ================= 2. blade element momentum: the real rotor ================= */
  const cpCache = {};
  function cpCurve(pitch) { const k = pitch.toFixed(2); return (cpCache[k] ||= L.sample(1.5, 13, 47, (l) => [l, Math.max(0, bem(l, pitch * DEG).cp)])); }
  D['bem-blade'] = {
    render(ctx, v) {
      const lam = v.lam, pitchR = v.pitch * DEG, Rb = bem(lam, pitchR), curve = cpCurve(v.pitch);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`The blade, designed for tip-speed ratio 7: chord \(c\) and twist \(\beta\) along the span (Betz-optimum shape, root chord capped), and the angle of attack \(\alpha\) each section actually sees at the current \(\lambda\) and pitch, from blade element momentum theory.`, tx`周速比 7 で設計したブレードです。翼幅に沿った翼弦 \(c\) とねじり \(\beta\)（ベッツ最適の形、根もとの翼弦は上限で切っています）と、現在の \(\lambda\) とピッチで各断面が実際に受ける迎角 \(\alpha\) を、翼素運動量理論で求めています。`));
      const f = L.fig(c1, { x: [0.15, 1], y: [-6, 26], aspect: 0.75, maxH: 330, xlabel: T(tx`radius \(r/R\)`, tx`半径 \(r/R\)`), ylabel: T('degrees, or chord × 200', '度、または翼弦 × 200') });
      f.line(L.sample(0.15, 1, 100, (r) => [r, chord(r) * 200]), { c: 'muted', w: 2.2 });
      f.line(L.sample(0.15, 1, 100, (r) => [r, (twist(r) + pitchR) / DEG]), { c: 'c4', w: 2.2 });
      f.line(Rb.ann.map((q) => [q.r, q.alpha / DEG]), { c: 'c1', w: 2.6 });
      f.hline(12, { c: 'c2', dash: '4 4' }); f.text(0.99, 12, T('stall', '失速'), { small: true, anchor: 'end', dy: -6, c: 'c2' });
      L.h('p', 'lab-cap', c2, T(tx`Power coefficient against tip-speed ratio \(\lambda=\Omega R/U\) for this blade, with the Betz limit and Glauert’s ideal rotor (which includes the loss to wake rotation). Drag the gold point to change \(\lambda\).`, tx`このブレードの周速比 \(\lambda=\Omega R/U\) に対するパワー係数と、ベッツの限界、グラウアートの理想ローター（後流の回転による損失を含む）です。金色の点をドラッグして \(\lambda\) を変えてください。`));
      const g = L.fig(c2, { x: [1.5, 13], y: [0, 0.62], aspect: 0.75, maxH: 330, xlabel: T(tx`tip-speed ratio \(\lambda\)`, tx`周速比 \(\lambda\)`), ylabel: tx`\(C_P\)` });
      g.hline(16 / 27, { c: 'c3', dash: '5 4' });
      g.line(L.sample(1.5, 13, 60, (l) => [l, glauertCp(l)]), { c: 'c3', w: 1.8 });
      g.line(curve, { c: 'c1', w: 2.6 });
      g.handle(lam, Math.max(0, Rb.cp), { c: 'hl', axis: 'x', bounds: [1.5, 13, 0, 0.62], label: T('tip-speed ratio', '周速比'), onDrag: (x) => ctx.set('lam', clamp(Math.round(x * 10) / 10, 1.5, 13)) });
      L.legend(ctx.host, [{ c: 'muted', label: T(tx`chord \(c/R\) × 200`, tx`翼弦 \(c/R\) × 200`) }, { c: 'c4', label: T(tx`section angle \(\beta\) (twist + pitch)`, tx`断面の角 \(\beta\)（ねじり + ピッチ）`) }, { c: 'c1', label: T(tx`angle of attack \(\alpha\); \(C_P(\lambda)\)`, tx`迎角 \(\alpha\)、\(C_P(\lambda)\)`) }, { c: 'c3', label: T(tx`Glauert ideal rotor; Betz \(16/27\) (dashed)`, tx`グラウアートの理想ローター、ベッツ \(16/27\)（破線）`) }]);
      const best = curve.reduce((m, p) => (p[1] > m[1] ? p : m), [0, 0]), P = 0.5 * RHO * PI * 60 ** 2 * v.U ** 3 * Math.max(0, Rb.cp);
      ctx.readout([
        { k: T(tx`\(C_P\) at this \(\lambda\) and pitch`, tx`この \(\lambda\) とピッチでの \(C_P\)`), v: fmt(Math.max(0, Rb.cp), 4), tone: 'key' },
        { k: T(tx`best \(C_P\) of this blade, at \(\lambda\)`, tx`このブレードの最良の \(C_P\)、そのときの \(\lambda\)`), v: tx`\(${fmt(best[1], 3)}\) at \(\lambda=${fmt(best[0], 3)}\)` },
        { k: T(tx`Glauert ideal \(C_{P,\max}(\lambda)\)`, tx`グラウアートの理想 \(C_{P,\max}(\lambda)\)`), v: fmt(glauertCp(lam), 4) },
        { k: T(tx`rotor speed and power for \(R=60\) m at \(U\)`, tx`\(U\) での \(R=60\) m のローターの回転数とパワー`), v: tx`\(${fmt((60 * lam * v.U) / (TAU * 60), 3)}\ \mathrm{rpm},\ ${fmt(P / 1e6, 3)}\ \mathrm{MW}\)` },
      ], T('Below the design λ the sections meet the air at too steep an angle and stall from the root outward; above it the angle falls and drag dominates. Pitching the blades to feather is how a turbine sheds power in a gale.', '設計の λ より低いと、断面は急すぎる角度で空気に当たり、根もとから外へ向かって失速します。高いと迎角が下がり、抗力が支配的になります。強風のときは、ブレードをフェザー側へピッチを変えてパワーを逃がします。').replace(/ λ /g, tx` \(\lambda\) `));
    },
  };

  /* ================= 3. tip-speed ratio and the helical wake (3D) ================= */
  D['tip-vortex-wake'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const lam = v.lam, a = 1 / 3, pitchLen = (TAU * (1 - a)) / lam;          // helix advance per turn, in rotor radii
      const rpm = (60 * lam * v.U) / (TAU * v.R);
      L.setText(st.cap1, T(tx`Each blade tip sheds a vortex that the wind carries downstream at about \(U(1-a)\) while the rotor turns, so the three vortices wind into helices. Their spacing along the wind is \(2\pi(1-a)R/(B\lambda)\): at high tip-speed ratio the helices pack tightly. Wake drawn for the Betz induction \(a=1/3\).`, tx`各ブレードの翼端は渦を放ち、ローターが回る間に風がそれを約 \(U(1-a)\) で下流へ運ぶので、三本の渦はらせんに巻きます。風の向きのらせんの間隔は \(2\pi(1-a)R/(B\lambda)\) で、周速比が高いとらせんは密に詰まります。後流はベッツの誘導 \(a=1/3\) で描いています。`));
      L.setText(st.cap2, T(tx`Glauert’s ideal rotor: a rotor that turns slowly must exert more torque, and leaves more energy behind in the swirl of its wake, so the best \(C_P\) falls below \(16/27\) at low \(\lambda\).`, tx`グラウアートの理想ローターです。ゆっくり回るローターは大きなトルクを出さなければならず、後流の旋回により多くのエネルギーを残すので、\(\lambda\) が低いと最良の \(C_P\) は \(16/27\) を下回ります。`));
      L.setText(st.cap3, T(tx`Why big turbines turn slowly: at fixed \(\lambda\) and wind speed, the rotor speed falls as \(1/R\).`, tx`大きな風車がゆっくり回る理由：\(\lambda\) と風速が一定なら、回転数は \(1/R\) に比例して下がります。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const g = L.fig(st.g2, { x: [0.5, 12], y: [0, 0.62], aspect: 0.55, maxH: 240, xlabel: T(tx`tip-speed ratio \(\lambda\)`, tx`周速比 \(\lambda\)`), ylabel: tx`\(C_{P,\max}\)` });
      g.hline(16 / 27, { c: 'c3', dash: '5 4' }); g.line(L.sample(0.5, 12, 80, (l) => [l, glauertCp(l)]), { c: 'c1', w: 2.6 });
      g.handle(lam, glauertCp(lam), { c: 'hl', axis: 'x', bounds: [0.5, 12, 0, 0.62], label: T('tip-speed ratio', '周速比'), onDrag: (x) => ctx.set('lam', clamp(Math.round(x * 10) / 10, 0.5, 12)) });
      const h = L.fig(st.g3, { x: [5, 130], y: [0, 120], aspect: 0.55, maxH: 240, xlabel: T(tx`rotor radius \(R\) (m)`, tx`回転半径 \(R\)（m）`), ylabel: 'rpm' });
      h.line(L.sample(5, 130, 120, (R) => [R, Math.min(120, (60 * lam * v.U) / (TAU * R))]), { c: 'c2', w: 2.4 });
      h.dot(v.R, Math.min(120, rpm), { c: 'hl', r: 5.5 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T(tx`Glauert ideal \(C_{P,\max}(\lambda)\)`, tx`グラウアートの理想 \(C_{P,\max}(\lambda)\)`) }, { c: 'c3', dash: true, label: T(tx`Betz \(16/27\)`, tx`ベッツ \(16/27\)`) }, { c: 'c2', label: T(tx`rotor speed \(60\lambda U/2\pi R\)`, tx`回転数 \(60\lambda U/2\pi R\)`) }]);
      ctx.readout([
        { k: T(tx`helix spacing \(2\pi(1-a)/(B\lambda)\)`, tx`らせんの間隔 \(2\pi(1-a)/(B\lambda)\)`), v: tx`\(${fmt(pitchLen / 3, 3)}\,R\)` },
        { k: T(tx`Glauert \(C_{P,\max}\)`, tx`グラウアートの \(C_{P,\max}\)`), v: fmt(glauertCp(lam), 4), tone: 'key' },
        { k: T('rotor speed', '回転数'), v: tx`\(${fmt(rpm, 3)}\ \mathrm{rpm}\)` },
        { k: T('tip speed', '翼端の速さ'), v: tx`\(${fmt(lam * v.U, 3)}\ \mathrm{m/s}\)` },
      ], T('Tip speed is held near 80 to 90 m/s by noise and erosion of the leading edge, so a 120 m blade turns only about seven times a minute.', '翼端の速さは騒音と前縁の浸食のため 80 から 90 m/s 程度に抑えられるので、長さ 120 m のブレードは毎分約 7 回しか回りません。'));
      const SC = 1.5, HZ = 2.7;
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.78, maxH: 520, camera: [-6.2, -7.2, 5.0], target: [2.6, 0, 2.6], fov: 34,
        label: T('3D turbine with its helical tip vortices. Drag to rotate.', 'らせん状の翼端渦をもつ 3D の風車。ドラッグで回転できます。'),
        init(S) {
          st.flat = false;
          st.T = buildTurbine(S, { R: SC, hub: HZ });
          st.vort = [0, 1, 2].map(() => S.tube([[0, 0, 0], [0.01, 0, 0]], { r: 0.03, c: '#a9bccb', opacity: 0.7, rough: 0.6, coat: 0.2, n: 600 }));
          st.vort.forEach((m) => { m.castShadow = false; });
          st.phase = 0;
          S.animate((dt) => { if (S.reduced()) return false; const d = Math.min(dt, 0.05); st.phase = (st.phase + d * 0.9) % TAU; st.T.rotor.rotation.x = st.phase; st.draw?.(); return true; });
        },
        update(S) {
          const x0 = st.T.hubPos[0], L2 = 4.6;
          st.draw = () => {
            st.vort.forEach((m, b) => {
              const pts = [];
              for (let i = 0; i <= 500; i++) {
                const s = (i / 500) * L2, turns = s / pitchLen, ang = -(st.phase + (b * TAU) / 3) - turns * TAU, rr = SC * (1 + 0.22 * (1 - Math.exp(-s / 0.6)));
                pts.push([x0 - 0.05 + s * SC, rr * Math.cos(ang + PI / 2), HZ + rr * Math.sin(ang + PI / 2)]);
              }
              m.update(pts);
            });
            S.invalidate();
          };
          st.draw();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [0, 8], y: [-2, 2], aspect: 0.4, maxH: 260, axes: false, grid: false });
          for (let b = 0; b < 3; b++) f.line(L.sample(0, 7.5, 400, (s) => [s, Math.cos((s / pitchLen) * TAU + (b * TAU) / 3) * 1.1]), { c: 'c1', w: 1.4 });
        },
      });
    },
  };
})();
