'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Swashplate kinematics: a pitch link at azimuth psi + delta lifts the pitch horn of the blade at psi by z(psi + delta),
   * so with the plate's height z(phi) = z_c + r_h [th1c cos(phi - delta) + th1s sin(phi - delta)] the blade pitch is
   * theta(psi) = th0 + th1c cos psi + th1s sin psi (small-angle linkage).
   * Flapping (centrally hinged, uniform inflow lambda, advance ratio mu, Lock number gamma), nondimensional time psi:
   * beta'' + beta = (gamma/2) int_0^1 (U_T^2 theta - U_P U_T) r dr, U_T = r + mu sin psi, U_P = lambda + r beta' + mu beta cos psi.
   * In hover beta0 = gamma (theta0/8 - lambda/6). Momentum theory: v_h = sqrt(T/(2 rho A)), ideal power T v_h; in climb
   * v_i/v_h = -x/2 + sqrt(x^2/4 + 1), x = V_c/v_h; in the vortex ring state the empirical fit of Leishman (2006),
   * v_i/v_h = kappa - 1.125x - 1.372x^2 - 1.718x^3 - 0.655x^4 for -2 <= x <= 0; windmill brake -x/2 - sqrt(x^2/4 - 1) for x <= -2.
   */
  const pitch = (psi, th0, th1c, th1s) => th0 + th1c * Math.cos(psi) + th1s * Math.sin(psi);
  // plate tilt (slopes gx, gy and center height) that produces the given pitch law through links at azimuth psi + delta
  function plate(th0, th1c, th1s, rh, R, delta) {
    return { zc: rh * th0, gx: (rh * (th1c * Math.cos(delta) - th1s * Math.sin(delta))) / R, gy: (rh * (th1c * Math.sin(delta) + th1s * Math.cos(delta))) / R };
  }
  const plateZ = (P, R, phi) => P.zc + R * (P.gx * Math.cos(phi) + P.gy * Math.sin(phi));

  function flapMoment(psi, beta, dbeta, o) {
    const th = pitch(psi, o.th0, o.th1c || 0, o.th1s || 0), sp = Math.sin(psi), cp = Math.cos(psi), N = 24;
    let s = 0;
    for (let i = 0; i < N; i++) {
      const r = (i + 0.5) / N, ut = r + o.mu * sp, up = o.lam + r * dbeta + o.mu * beta * cp, tw = (o.tw || 0) * (r - 0.75);
      s += (ut * ut * (th + tw) - up * ut) * r;
    }
    return (o.gamma / 2) * (s / N);
  }
  // periodic flapping: integrate until it settles, then sample one revolution
  function flapping(o, revs = 24, nPer = 240) {
    let b = 0, db = 0, psi = 0; const h = TAU / nPer;
    const f = (ps, x, v) => [v, -x + flapMoment(ps, x, v, o)];
    const out = [];
    for (let k = 0; k < revs * nPer; k++) {
      const k1 = f(psi, b, db), k2 = f(psi + h / 2, b + (h / 2) * k1[0], db + (h / 2) * k1[1]), k3 = f(psi + h / 2, b + (h / 2) * k2[0], db + (h / 2) * k2[1]), k4 = f(psi + h, b + h * k3[0], db + h * k3[1]);
      b += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); db += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); psi += h;
      if (k >= (revs - 1) * nPer) out.push({ psi: psi % TAU, b, db });
    }
    out.sort((a, c) => a.psi - c.psi);
    // first harmonics: beta = b0 - b1c cos psi - b1s sin psi
    let b0 = 0, c1 = 0, s1 = 0; for (const p of out) { b0 += p.b; c1 += p.b * Math.cos(p.psi); s1 += p.b * Math.sin(p.psi); }
    const n = out.length; return { samples: out, b0: b0 / n, b1c: (-2 * c1) / n, b1s: (-2 * s1) / n };
  }
  const hoverConing = (gamma, th0, lam) => gamma * (th0 / 8 - lam / 6);
  // local angle of attack on the disc (deg) and reverse-flow test
  function aoa(r, psi, o, F) {
    const k = Math.round(((((psi % TAU) + TAU) % TAU) / TAU) * F.samples.length) % F.samples.length, p = F.samples[k];
    const ut = r + o.mu * Math.sin(psi), up = o.lam + r * p.db + o.mu * p.b * Math.cos(psi);
    const th = pitch(psi, o.th0, o.th1c || 0, o.th1s || 0) + (o.tw || 0) * (r - 0.75);
    return { alpha: (th - Math.atan2(up, Math.abs(ut))) / DEG, reverse: ut < 0 };
  }
  // momentum theory
  const vh = (T0, rho, R) => Math.sqrt(T0 / (2 * rho * PI * R * R));
  const KAPPA = 1;                 // the fit with an ideal rotor (kappa = 1), so it meets momentum theory in hover
  function inducedRatio(x) {       // v_i / v_h against x = V_c / v_h (positive up)
    if (x >= 0) return -x / 2 + Math.sqrt((x * x) / 4 + 1);
    if (x <= -2) return -x / 2 - Math.sqrt((x * x) / 4 - 1);
    return KAPPA - 1.125 * x - 1.372 * x * x - 1.718 * x ** 3 - 0.655 * x ** 4;
  }
  // ideal autorotation: V_c + v_i = 0 on the empirical branch
  function autorotation() { let a = -2, b = -1; const g = (x) => x + inducedRatio(x); for (let i = 0; i < 80; i++) { const m = 0.5 * (a + b); if (g(a) * g(m) <= 0) b = m; else a = m; } return 0.5 * (a + b); }
  const M = { pitch, plate, plateZ, flapMoment, flapping, hoverConing, aoa, vh, inducedRatio, autorotation };
  (window.LabModels = window.LabModels || {})['helicopter-rotors'] = M;

  /* ================= 1. the swashplate (3D) ================= */
  const HUB = 1.32, RG = 0.42, RH = 0.27, RP = Math.hypot(RG, RH), DL = Math.atan2(RH, RG), Z0 = 0.62, NB = 4, BLADE = [0.78, 3.6];
  D['swashplate'] = {
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
        st.leg = L.h('div', '', st.frame);
      }
      const th0 = v.th0 * DEG, th1c = v.th1c * DEG, th1s = v.th1s * DEG;
      st.psi ??= 0.6;
      L.setText(st.cap1, T(tx`A four-bladed rotor head. Three servo jacks raise and tilt the stationary lower ring of the swashplate; the upper ring turns with the rotor on a bearing, and its pitch links push each blade’s pitch horn. Raising the plate is collective pitch \(\theta_0\); tilting it is cyclic, \(\theta_{1c}\cos\psi+\theta_{1s}\sin\psi\). Drag the gold stick to tilt the plate. Blades are shortened.`, tx`4 枚羽根のローターヘッドです。三本のサーボジャッキがスワッシュプレートの固定された下側のリングを持ち上げ、傾けます。上側のリングは軸受の上でローターとともに回り、そのピッチリンクが各ブレードのピッチホーンを押します。プレートを持ち上げるのがコレクティブピッチ \(\theta_0\)、傾けるのがサイクリック \(\theta_{1c}\cos\psi+\theta_{1s}\sin\psi\) です。金色のスティックをドラッグしてプレートを傾けてください。ブレードは短く描いています。`));
      L.setText(st.cap2, T(tx`Blade pitch around one revolution, measured from the tail (\(\psi=0\)) in the direction of rotation. With forward cyclic the advancing blade (\(\psi=90^\circ\)) gets less pitch and the retreating blade more, which evens out their lift.`, tx`1 回転にわたるブレードのピッチで、方位角は尾部（\(\psi=0\)）から回転の向きに測ります。前方へのサイクリックでは、前進側のブレード（\(\psi=90^\circ\)）のピッチが減り、後退側のブレードのピッチが増えて、揚力の差がならされます。`));
      const draw2d = () => {
        st.g2.replaceChildren();
        const lo = Math.min(-2, (th0 - Math.hypot(th1c, th1s)) / DEG - 2), hi = Math.max(16, (th0 + Math.hypot(th1c, th1s)) / DEG + 2);
        const f = L.fig(st.g2, { x: [0, 360], y: [lo, hi], aspect: 0.7, maxH: 330, xlabel: T(tx`azimuth \(\psi\) (degrees)`, tx`方位角 \(\psi\)（度）`), ylabel: tx`\(\theta\) (°)`, ticksX: [0, 90, 180, 270, 360].map((d) => [d, String(d)]) });
        f.hline(v.th0, { c: 'muted', dash: '4 4' });
        f.line(L.sample(0, 360, 240, (d) => [d, pitch(d * DEG, th0, th1c, th1s) / DEG]), { c: 'c1', w: 2.6 });
        f.text(90, hi, T('advancing', '前進側'), { small: true, dy: 14, c: 'muted' }); f.text(270, hi, T('retreating', '後退側'), { small: true, dy: 14, c: 'muted' });
        st.dots = []; st.f2 = f;
      };
      const mark = () => {
        if (!st.f2) return; st.f2.clear('over');
        for (let b = 0; b < NB; b++) { const ps = (((st.psi + (b * TAU) / NB) % TAU) + TAU) % TAU; st.f2.dot(ps / DEG, pitch(ps, th0, th1c, th1s) / DEG, { c: b ? 'c2' : 'hl', r: b ? 3.5 : 5.5, layer: 'over' }); }
      };
      draw2d(); mark();
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T(tx`blade pitch \(\theta(\psi)\)`, tx`ブレードのピッチ \(\theta(\psi)\)`) }, { kind: 'dot', c: 'hl', label: T('the striped blade', '縞のあるブレード') }, { kind: 'dot', c: 'c2', label: T('the other blades', 'ほかのブレード') }]);
      const amp = Math.hypot(th1c, th1s) / DEG, tilt = (Math.atan(Math.hypot(plate(th0, th1c, th1s, RH, RP, DL).gx, plate(th0, th1c, th1s, RH, RP, DL).gy)) / DEG);
      ctx.readout([
        { k: T(tx`collective \(\theta_0\)`, tx`コレクティブ \(\theta_0\)`), v: tx`\(${fmt(v.th0, 3)}^\circ\)` },
        { k: T(tx`cyclic amplitude \(\sqrt{\theta_{1c}^2+\theta_{1s}^2}\)`, tx`サイクリックの振幅 \(\sqrt{\theta_{1c}^2+\theta_{1s}^2}\)`), v: tx`\(${fmt(amp, 3)}^\circ\)`, tone: 'key' },
        { k: T(tx`pitch range \(\theta_0\pm\) amplitude`, tx`ピッチの範囲 \(\theta_0\pm\) 振幅`), v: tx`\(${fmt(v.th0 - amp, 3)}^\circ\ldots${fmt(v.th0 + amp, 3)}^\circ\)` },
        { k: T('swashplate tilt', 'スワッシュプレートの傾き'), v: tx`\(${fmt(tilt, 3)}^\circ\)` },
      ], T('The pilot never moves the blades directly: the collective lever raises the plate and the cyclic stick tilts it, and the rotating links turn that tilt into a pitch change once per revolution.', '操縦士がブレードを直接動かすことはありません。コレクティブレバーがプレートを持ち上げ、サイクリックスティックがプレートを傾け、回転するリンクがその傾きを 1 回転に 1 度のピッチ変化に変えます。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.78, maxH: 540, camera: [4.6, -6.2, 5.2], target: [0, 0, 0.9], fov: 34,
        label: T('3D rotor head with swashplate, pitch links and blades turning. Drag to rotate the view; drag the gold stick to tilt the swashplate.', 'スワッシュプレート、ピッチリンク、回転するブレードをもつ 3D のローターヘッド。ドラッグで視点を回し、金色のスティックでスワッシュプレートを傾けられます。'),
        init(S) {
          st.flat = false; st.S = S;
          const TH = S.THREE, V3 = (a) => new TH.Vector3(...a);
          const alu = S.mat('#c7ccd2', { metal: 0.95, rough: 0.24, coat: 0.3 }), steel = S.mat('#8d949b', { metal: 0.95, rough: 0.3 }), dark = S.mat('#2a2e33', { metal: 0.7, rough: 0.38, coat: 0.5 }), black = S.mat('#1d2024', { metal: 0.2, rough: 0.5, coat: 0.6 });
          const cyl = (r0, r1, h, seg = 40) => new TH.CylinderGeometry(r1, r0, h, seg).rotateX(PI / 2);
          // a rod between two points that can be moved every frame
          const rod = (mat, r) => { const m = new TH.Mesh(new TH.CylinderGeometry(r, r, 1, 16), mat); m.castShadow = true; S.add(m); m.set = (a, b) => { const A = V3(a), B = V3(b), d = B.clone().sub(A), len = d.length(); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), d.normalize()); m.scale.set(1, len, 1); }; return m; };
          const ball = (mat, r) => { const m = new TH.Mesh(new TH.SphereGeometry(r, 20, 14), mat); S.add(m); return m; };
          // main gearbox and mast
          const gb = new TH.Mesh(new TH.BoxGeometry(1.3, 0.9, 0.42, 1, 1, 1), S.mat('#59616a', { metal: 0.6, rough: 0.45, coat: 0.4 })); gb.position.set(0, 0, -0.05); S.add(gb);
          for (const [x, y] of [[0.55, 0.35], [-0.55, 0.35], [0.55, -0.35], [-0.55, -0.35]]) { const bolt = new TH.Mesh(cyl(0.035, 0.035, 0.05, 12), steel); bolt.position.set(x, y, 0.18); S.add(bolt); }
          const dome = new TH.Mesh(new TH.SphereGeometry(0.34, 40, 16, 0, TAU, 0, PI / 2).rotateX(PI / 2), S.mat('#59616a', { metal: 0.6, rough: 0.4 })); dome.position.set(0, 0, 0.16); S.add(dome);
          const mast = new TH.Mesh(cyl(0.085, 0.085, HUB + 0.1 - 0.2, 40), steel); mast.position.set(0, 0, 0.2 + (HUB + 0.1 - 0.2) / 2); S.add(mast);
          // swashplate: the stationary lower ring and the rotating upper ring (ring geometry: a lathe of a rounded rectangle)
          const ringGeo = (rin, rout, h) => { const pts = []; const rr = 0.012; for (const [x, y] of [[rin, -h / 2], [rout - rr, -h / 2], [rout, -h / 2 + rr], [rout, h / 2 - rr], [rout - rr, h / 2], [rin, h / 2]]) pts.push(new TH.Vector2(x, y)); pts.push(new TH.Vector2(rin, -h / 2)); return new TH.LatheGeometry(pts, 96).rotateX(PI / 2); };
          st.lower = new TH.Group(); st.lower.add(new TH.Mesh(ringGeo(0.14, RP + 0.08, 0.07), dark)); S.add(st.lower);
          st.upper = new TH.Group(); st.upper.add(new TH.Mesh(ringGeo(0.14, RP + 0.04, 0.06), alu)); S.add(st.upper);
          const uniball = new TH.Mesh(new TH.SphereGeometry(0.15, 32, 20), steel); st.uni = uniball; S.add(uniball);
          // lugs on the rotating ring for the pitch links
          st.lugs = L.seq(NB, () => { const m = new TH.Mesh(new TH.BoxGeometry(0.07, 0.07, 0.1), alu); st.upper.add(m); return m; });
          // three servo jacks below the stationary ring, at 0, 120 and 240 degrees
          st.jacks = [0, 1, 2].map((k) => { const az = (k * TAU) / 3 + PI / 6, body = rod(S.mat('#b9bec4', { metal: 0.9, rough: 0.22 }), 0.045), piston = rod(S.mat('#e5e8eb', { metal: 1, rough: 0.12 }), 0.022); return { az, body, piston }; });
          // scissor link driving the rotating ring
          st.sc = [rod(alu, 0.022), rod(alu, 0.022)]; st.scJ = ball(steel, 0.035);
          const collar = new TH.Mesh(cyl(0.12, 0.12, 0.08, 32), alu); collar.position.set(0, 0, HUB - 0.22); S.add(collar);
          // hub, grips and blades (all in a rotating group)
          st.rotor = new TH.Group(); S.add(st.rotor);
          const hubPlate = new TH.Mesh(cyl(0.24, 0.24, 0.13, 48), alu); hubPlate.position.z = HUB; st.rotor.add(hubPlate);
          const cap = new TH.Mesh(new TH.SphereGeometry(0.16, 32, 16, 0, TAU, 0, PI / 2).rotateX(PI / 2), alu); cap.position.z = HUB + 0.065; st.rotor.add(cap);
          const section = S.naca(0.12, 0, 0.4, 22);
          st.blades = L.seq(NB, (b) => {
            const arm = new TH.Group(); arm.rotation.z = (b * TAU) / NB; st.rotor.add(arm);
            const feather = new TH.Group(); feather.position.set(0, 0, HUB); arm.add(feather);   // rotates about the blade axis (x)
            const grip = new TH.Mesh(new TH.CylinderGeometry(0.075, 0.085, BLADE[0] - 0.18, 32).rotateZ(PI / 2), alu); grip.position.x = 0.18 + (BLADE[0] - 0.18) / 2; feather.add(grip);
            for (const x of [0.32, 0.62]) { const band = new TH.Mesh(new TH.TorusGeometry(0.085, 0.012, 10, 32).rotateY(PI / 2), dark); band.position.x = x; feather.add(band); }
            const horn = new TH.Mesh(new TH.BoxGeometry(0.05, RH, 0.04), alu); horn.position.set(RG, RH / 2, -0.06); feather.add(horn);
            const hornBall = new TH.Mesh(new TH.SphereGeometry(0.03, 16, 12), steel); hornBall.position.set(RG, RH, -0.06); feather.add(hornBall);
            // the blade: NACA 0012, chord 0.3, 8 degrees of linear twist, quarter chord on the pitch axis
            const chord = 0.3, twist = -8 * DEG, len = BLADE[1] - BLADE[0];
            const bl = S.sweep((u) => [BLADE[0] + len * u, 0, 0], (u) => { const tw = twist * (u - 0.2), c = Math.cos(tw), s = Math.sin(tw), ch = u < 0.04 ? chord * (0.55 + 0.45 * (u / 0.04)) : chord; return section.map(([x, y]) => { const a = (x - 0.25) * ch, bb = y * ch; return [a * s + bb * c, -(a * c - bb * s)]; }); }, { n: 60, up: [0, 0, 1], c: b === 0 ? '#3b3f44' : '#3b3f44', rough: 0.32, coat: 0.85, caps: true, add: false });
            feather.add(bl);
            // painted tip stripes, and a stripe band near the root on the reference blade
            const stripe = (x0, w, col) => { const m = S.sweep((u) => [x0 + w * u, 0, 0], () => section.map(([x, y]) => { const a = (x - 0.25) * chord * 1.004, bb = y * chord * 1.04; const tw = twist * ((x0 - BLADE[0]) / len - 0.2), c = Math.cos(tw), s = Math.sin(tw); return [a * s + bb * c, -(a * c - bb * s)]; }), { n: 2, up: [0, 0, 1], c: col, rough: 0.35, coat: 0.8, add: false }); feather.add(m); };
            stripe(BLADE[1] - 0.22, 0.1, '#f2c12e'); stripe(BLADE[1] - 0.1, 0.08, '#e8e8e8');
            if (b === 0) { stripe(1.3, 0.16, '#d8a531'); stripe(1.55, 0.16, '#d8a531'); }
            return { arm, feather };
          });
          st.links = L.seq(NB, () => ({ rod: rod(steel, 0.018), e1: ball(alu, 0.032), e2: ball(alu, 0.032) }));
          // the cyclic stick: a handle above the gearbox, its horizontal offset tilting the plate
          st.stickBase = [0.95, -0.95, 0.05];
          st.stick = rod(black, 0.022);
          st.hdl = S.handle([0, 0, 0], { c: 'hl', r: 0.07, plane: [[0, 0, 1], [0, 0, 0.75]], label: T('cyclic stick', 'サイクリックスティック'), onDrag: (q) => {
            const dx = clamp(q.x - st.stickBase[0], -0.32, 0.32), dy = clamp(q.y - st.stickBase[1], -0.32, 0.32);
            st.ctx.set('th1s', Math.round((-dy / 0.32) * 8 * 2) / 2, true); st.ctx.set('th1c', Math.round((dx / 0.32) * 8 * 2) / 2); return null; } });
          S.label(T('swashplate', 'スワッシュプレート'), [RP + 0.25, 0, Z0 + 0.05], { small: true });
          S.label(T('pitch link', 'ピッチリンク'), [-RP - 0.15, -0.35, Z0 + 0.42], { small: true, align: 'end' });
          S.label(T('servo jacks', 'サーボジャッキ'), [-0.75, 0.6, 0.35], { small: true, align: 'end' });
          S.animate((dt) => { if (S.reduced()) return false; st.psi = (st.psi + Math.min(dt, 0.05) * 1.6) % TAU; st.pose?.(); mark(); return true; });
        },
        update(S) {
          const TH = S.THREE, P = plate(th0, th1c, th1s, RH, RP, DL), n = new TH.Vector3(-P.gx, -P.gy, 1).normalize();
          const q = new TH.Quaternion().setFromUnitVectors(new TH.Vector3(0, 0, 1), n);
          st.pose = () => {
            const psi = st.psi;
            st.lower.position.set(0, 0, Z0 + P.zc); st.lower.quaternion.copy(q);
            st.upper.position.set(0, 0, Z0 + P.zc + 0.075); st.upper.quaternion.copy(q).multiply(new TH.Quaternion().setFromAxisAngle(new TH.Vector3(0, 0, 1), psi));
            st.uni.position.set(0, 0, Z0 + P.zc);
            st.rotor.rotation.z = psi;
            const ringPt = (phi, r, dz) => { const lp = new TH.Vector3(r * Math.cos(phi), r * Math.sin(phi), dz).applyQuaternion(q); return [lp.x, lp.y, lp.z + Z0 + P.zc]; };
            st.blades.forEach((B, b) => {
              const az = psi + (b * TAU) / NB, th = pitch(az, th0, th1c, th1s);
              B.feather.rotation.x = th;
              const lug = st.lugs[b], phiL = (b * TAU) / NB + DL; lug.position.set(RP * Math.cos(phiL), RP * Math.sin(phiL), 0.065);
              const a = ringPt(az + DL, RP, 0.11), hornTip = [RG * Math.cos(az) - RH * Math.cos(th) * Math.sin(az), RG * Math.sin(az) + RH * Math.cos(th) * Math.cos(az), HUB - 0.06 + RH * Math.sin(th)];
              st.links[b].rod.set(a, hornTip); st.links[b].e1.position.set(...a); st.links[b].e2.position.set(...hornTip);
            });
            st.jacks.forEach((J) => { const top = ringPt(J.az, RP + 0.02, -0.04), base = [(RP + 0.02) * Math.cos(J.az), (RP + 0.02) * Math.sin(J.az), 0.17], mid = [0, 1, 2].map((c) => base[c] + 0.55 * (top[c] - base[c])); J.body.set(base, mid); J.piston.set(mid, top); });
            const scA = ringPt(psi + PI, 0.2, 0.1), scC = [0.2 * Math.cos(psi + PI), 0.2 * Math.sin(psi + PI), HUB - 0.22], scB = [0.32 * Math.cos(psi + PI), 0.32 * Math.sin(psi + PI), (scA[2] + scC[2]) / 2];
            st.sc[0].set(scA, scB); st.sc[1].set(scB, scC); st.scJ.position.set(...scB);
            S.invalidate();
          };
          const tip = [st.stickBase[0] + (th1c / (8 * DEG)) * 0.32, st.stickBase[1] - (th1s / (8 * DEG)) * 0.32, 0.75];
          st.stick.set(st.stickBase, tip); st.hdl.at(tip);
          st.pose();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, maxH: 380, axes: false, grid: false });
          f.circle(0, 0, 1, { c: 'muted', w: 1 });
          for (let b = 0; b < NB; b++) { const az = st.psi + (b * TAU) / NB, th = pitch(az, th0, th1c, th1s) / DEG; f.seg([0, 0], [Math.cos(az), Math.sin(az)], { c: b ? 'c1' : 'hl', w: 3 }); f.text(1.15 * Math.cos(az), 1.15 * Math.sin(az), tx`\(${fmt(th, 2)}^\circ\)`, { small: true }); }
        },
      });
    },
  };

  /* ================= 2. flapping in forward flight ================= */
  D['blade-flapping'] = {
    render(ctx, v) {
      const o = { mu: v.mu, th0: v.th0 * DEG, th1s: v.th1s * DEG, th1c: 0, lam: v.lam, gamma: v.gamma, tw: -8 * DEG }, F = flapping(o);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`The rotor disc seen from above, nose at the top, turning anticlockwise. Color is the local angle of attack of the blade section. The gray circle on the retreating side is reverse flow, where the air meets the trailing edge first (diameter \(\mu R\)); red marks stall, angles above \(12^\circ\).`, tx`上から見たローター円盤で、機首は上、反時計回りに回ります。色はブレード断面の局所的な迎角です。後退側の灰色の円は逆流域で、空気が後縁から当たります（直径 \(\mu R\)）。赤は \(12^\circ\) を超える失速を示します。`));
      const f = L.fig(c1, { x: [-1.42, 1.42], y: [-1.2, 1.2], equal: true, maxH: 380, axes: false, grid: false });
      // azimuth psi measured from the tail (bottom, -y) anticlockwise: position (sin psi, -cos psi)
      const plateRGB = L.cmaps.seq(0), mutedRGB = [0.55, 0.56, 0.6], stallRGB = [0.84, 0.2, 0.16];
      f.raster((x, y) => {
        const r = Math.hypot(x, y); if (r > 1 || r < 0.12) return plateRGB;
        const psi = Math.atan2(x, -y), a = aoa(r, psi, o, F);
        if (a.reverse) return mutedRGB;
        return a.alpha > 12 ? stallRGB : L.cmaps.warm(clamp(a.alpha / 14, 0, 1));
      }, { res: 3 });
      // reverse-flow circle: r = -mu sin psi, a circle of diameter mu centered at (-mu/2, 0)
      f.circle(-o.mu / 2, 0, o.mu / 2, { c: 'ink', w: 1.6, dash: '4 3', fill: 'muted', fo: 0.35 });
      // stall boundary as dots where alpha crosses 12 degrees
      for (let i = 0; i < 180; i++) { const psi = (i / 180) * TAU; let prev = null; for (let j = 0; j <= 50; j++) { const r = 0.15 + (0.85 * j) / 50, a = aoa(r, psi, o, F); if (a.reverse) { prev = null; continue; } const s = a.alpha > 12; if (prev !== null && s !== prev) f.dot(r * Math.sin(psi), -r * Math.cos(psi), { c: 'c2', r: 1.8 }); prev = s; } }
      f.circle(0, 0, 1, { c: 'ink', w: 1.2 });
      f.arrow([0, -1.12], [0, -0.9], { c: 'muted', w: 1.4 }); f.text(0, -1.12, T('tail ψ = 0°', '尾部 ψ = 0°').replace('ψ = 0°', tx`\(\psi=0^\circ\)`), { small: true, anchor: 'middle', dy: 12 });
      f.text(1.02, 0, T('advancing', '前進側'), { small: true, anchor: 'start' }); f.text(-1.02, 0, T('retreating', '後退側'), { small: true, anchor: 'end' });
      f.arrow([-0.15, 1.1], [0.15, 1.1], { c: 'c1', w: 2 }); f.text(0, 1.1, T('flight', '飛行方向'), { small: true, anchor: 'middle', dy: -8 });
      L.h('p', 'lab-cap', c2, T(tx`Flap angle \(\beta(\psi)\) over one revolution, solved from the blade’s equation of motion until it repeats. The blade rises on the advancing side and falls on the retreating side, with the largest flap 90° later than the largest lift: the tip-path plane tilts back.`, tx`ブレードの運動方程式を繰り返しになるまで解いて得た、1 回転にわたるフラップ角 \(\beta(\psi)\) です。ブレードは前進側で上がり後退側で下がり、最大のフラップは最大の揚力より 90° 遅れます。翼端軌跡面は後ろへ傾きます。`));
      const bs = F.samples.map((p) => p.b / DEG), lo = Math.min(...bs) - 1, hi = Math.max(...bs) + 1;
      const g = L.fig(c2, { x: [0, 360], y: [Math.min(lo, -1), Math.max(hi, 8)], aspect: 0.8, maxH: 380, xlabel: T(tx`azimuth \(\psi\) (degrees)`, tx`方位角 \(\psi\)（度）`), ylabel: tx`\(\beta\) (°)`, ticksX: [0, 90, 180, 270, 360].map((d) => [d, String(d)]) });
      g.line(F.samples.map((p) => [p.psi / DEG, p.b / DEG]), { c: 'c1', w: 2.6 });
      g.hline(F.b0 / DEG, { c: 'muted', dash: '4 4' });
      g.line(L.sample(0, 360, 200, (d) => [d, (F.b0 - F.b1c * Math.cos(d * DEG) - F.b1s * Math.sin(d * DEG)) / DEG]), { c: 'c4', w: 1.6, dash: '6 4' });
      L.legend(ctx.host, [{ kind: 'fill', c: 'hl', label: T('angle of attack, 0 to 14°', '迎角 0 から 14°') }, { kind: 'fill', c: 'muted', label: T('reverse flow', '逆流域') }, { kind: 'dot', c: 'c2', label: T('stall boundary (12°)', '失速の境界（12°）') }, { c: 'c1', label: T(tx`flap angle \(\beta(\psi)\)`, tx`フラップ角 \(\beta(\psi)\)`) }, { c: 'c4', dash: true, label: T(tx`first harmonics \(\beta_0-\beta_{1c}\cos\psi-\beta_{1s}\sin\psi\)`, tx`1 次調和成分 \(\beta_0-\beta_{1c}\cos\psi-\beta_{1s}\sin\psi\)`) }]);
      ctx.readout([
        { k: T(tx`coning \(\beta_0\)`, tx`コーニング \(\beta_0\)`), v: tx`\(${fmt(F.b0 / DEG, 3)}^\circ\)` },
        { k: T(tx`longitudinal tilt \(\beta_{1c}\) (back is positive)`, tx`縦の傾き \(\beta_{1c}\)（後ろが正）`), v: tx`\(${fmt(F.b1c / DEG, 3)}^\circ\)`, tone: 'key' },
        { k: T(tx`lateral tilt \(\beta_{1s}\)`, tx`横の傾き \(\beta_{1s}\)`), v: tx`\(${fmt(F.b1s / DEG, 3)}^\circ\)` },
        { k: T(tx`hover coning \(\gamma(\theta_0/8-\lambda/6)\), untwisted`, tx`ホバーのコーニング \(\gamma(\theta_0/8-\lambda/6)\)、ねじりなし`), v: tx`\(${fmt(hoverConing(v.gamma, v.th0 * DEG, v.lam) / DEG, 3)}^\circ\)` },
      ], v.mu > 0.32 ? T('At high advance ratio the reverse-flow region swallows a large part of the retreating side and the retreating blade needs ever more pitch: this, with compressibility on the advancing tip, is what limits a conventional helicopter’s speed.', '前進比が大きいと、逆流域が後退側の大きな部分を飲み込み、後退側のブレードはますます大きなピッチを必要とします。これが前進側の翼端での圧縮性とともに、通常のヘリコプターの速度を制限するものです。')
        : T('The advancing blade meets faster air and gains lift; free to flap, it rises, which reduces its angle of attack, and the retreating blade falls, which increases its own. Flapping balances the lift without rolling the aircraft.', '前進側のブレードは速い気流を受けて揚力が増えます。自由にフラップできるので上がり、それによって迎角が減ります。後退側のブレードは下がって迎角が増えます。フラッピングは機体を横転させずに揚力を釣り合わせます。'));
    },
  };

  /* ================= 3. momentum theory and autorotation ================= */
  D['rotor-momentum'] = {
    render(ctx, v) {
      const rho = 1.225 * Math.exp(-v.alt / 8500), Tn = v.mass * 9.81, R = v.R, A = PI * R * R, vH = vh(Tn, rho, R), x = v.vc / vH, vi = inducedRatio(x) * vH, xa = autorotation();
      const Pideal = Tn * (v.vc + vi), Ph = (Tn * vH) / v.fm;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`The rotor as an actuator disc. Air is accelerated through the disc and the slipstream contracts to half the disc area, where its speed doubles to \(2v_i\). The thrust is the momentum flux, \(T=2\rho A v_i(V_c+v_i)\). Schematic, not to scale.`, tx`作動円盤としてのローターです。空気は円盤を通って加速され、後流は円盤の半分の面積まで細くなり、そこで速さは 2 倍の \(2v_i\) になります。推力は運動量の流束 \(T=2\rho A v_i(V_c+v_i)\) です。模式図で、縮尺どおりではありません。`));
      const s = L.fig(c1, { x: [-1.6, 1.6], y: [-2.6, 1.2], equal: true, maxH: 360, axes: false, grid: false });
      const up = v.vc >= -vH * 0.2, wr = (yy) => (yy >= 0 ? 1 + 0.9 * (1 - Math.exp(-yy * 2)) : 1 / Math.SQRT2 + (1 - 1 / Math.SQRT2) * Math.exp(yy * 2.2));
      if (up) { s.poly([...L.sample(1.1, -2.6, 60, (yy) => [wr(yy), yy]), ...L.sample(-2.6, 1.1, 60, (yy) => [-wr(yy), yy])], { fill: 'c1', fo: 0.12, c: 'c1', w: 1.4 }); }
      else { for (let k = 0; k < 2; k++) { const sx = k ? 1 : -1; s.line(L.sample(0, TAU, 80, (t) => [sx * (1 + 0.32 * Math.cos(t)), 0.32 * Math.sin(t)]), { c: 'c2', w: 2, arrow: false }); } }
      s.rect(-1, -0.04, 2, 0.08, { fill: 'ink', fo: 0.9, nostroke: true });
      s.text(0, 0.12, T('rotor disc, area A', 'ローター円盤、面積 A').replace(' A', tx` \(A\)`), { small: true, anchor: 'middle', dy: -6 });
      if (up) { s.arrow([0, 0.9], [0, 0.35], { c: 'c1', w: 2 }); s.text(0.1, 0.75, tx`\(V_c\)`, { small: true, anchor: 'start' }); s.arrow([0, -0.3], [0, -1.0], { c: 'c1', w: 2.4 }); s.text(0.1, -0.65, tx`\(V_c+v_i\)`, { small: true, anchor: 'start' }); s.arrow([0, -1.6], [0, -2.5], { c: 'c1', w: 3 }); s.text(0.1, -2.1, tx`\(V_c+2v_i\)`, { small: true, anchor: 'start' }); }
      else s.text(0, -1.2, T('vortex ring state: the wake recirculates', 'ボルテックスリング状態：後流が循環します'), { small: true, anchor: 'middle', c: 'c2' });
      L.h('p', 'lab-cap', c2, T(tx`Induced velocity against climb rate, both in units of the hover value \(v_h=\sqrt{T/2\rho A}\). Momentum theory holds in climb and in fast descent; between them, in the vortex ring state, the flow recirculates and the curve is an empirical fit to flight test data. Ideal autorotation, \(V_c+v_i=0\), needs no power at all. Drag the gold point.`, tx`誘導速度を上昇率に対して描き、どちらもホバーの値 \(v_h=\sqrt{T/2\rho A}\) を単位とします。運動量理論は上昇中と速い降下中に成り立ちます。その間のボルテックスリング状態では流れが循環し、曲線は飛行試験データへの経験的な当てはめです。理想的なオートローテーション \(V_c+v_i=0\) では動力はまったく要りません。金色の点をドラッグしてください。`));
      const g = L.fig(c2, { x: [-3, 2], y: [0, 2.6], aspect: 0.8, maxH: 360, xlabel: T(tx`climb rate \(V_c/v_h\)`, tx`上昇率 \(V_c/v_h\)`), ylabel: tx`\(v_i/v_h\)` });
      g.area([[-2, 0], [-2, 2.6], [0, 2.6], [0, 0]], { c: 'c2', fo: 0.08 }); g.text(-1, 2.45, T('vortex ring state', 'ボルテックスリング状態'), { small: true, anchor: 'middle', c: 'c2' });
      g.line(L.sample(0, 2, 100, (q) => [q, inducedRatio(q)]), { c: 'c1', w: 2.4 });
      g.line(L.sample(-3, -2, 60, (q) => [q, inducedRatio(q)]), { c: 'c1', w: 2.4 });
      g.line(L.sample(-2, 0, 100, (q) => [q, inducedRatio(q)]), { c: 'c2', w: 2.4, dash: '6 4' });
      g.line([[-2.6, 2.6], [0, 0]], { c: 'muted', w: 1.2, dash: '3 3' }); g.text(-2.45, 2.45, tx`\(v_i=-V_c\)`, { small: true, anchor: 'start', c: 'muted' });
      g.dot(xa, inducedRatio(xa), { c: 'c4', r: 5 }); g.text(xa, inducedRatio(xa), T('ideal autorotation', '理想的なオートローテーション'), { small: true, anchor: 'end', dx: -8, dy: 14, c: 'c4' });
      g.handle(clamp(x, -3, 2), inducedRatio(clamp(x, -3, 2)), { c: 'hl', axis: 'x', bounds: [-3, 2, 0, 2.6], label: T('climb rate', '上昇率'), onDrag: (q) => ctx.set('vc', clamp(Math.round(q * vH * 10) / 10, -30, 20)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('momentum theory', '運動量理論') }, { c: 'c2', dash: true, label: T('empirical fit, vortex ring state', '経験的な当てはめ、ボルテックスリング状態') }, { kind: 'dot', c: 'c4', label: T(tx`ideal autorotation \(V_c+v_i=0\)`, tx`理想的なオートローテーション \(V_c+v_i=0\)`) }]);
      ctx.readout([
        { k: T(tx`disc loading \(T/A\)`, tx`円盤荷重 \(T/A\)`), v: tx`\(${fmt(Tn / A, 4)}\ \mathrm{N/m^2}\)` },
        { k: T(tx`hover induced velocity \(v_h=\sqrt{T/2\rho A}\)`, tx`ホバーの誘導速度 \(v_h=\sqrt{T/2\rho A}\)`), v: tx`\(${fmt(vH, 3)}\ \mathrm{m/s}\)`, tone: 'key' },
        { k: T(tx`hover power \(Tv_h/\mathrm{FM}\)`, tx`ホバーの動力 \(Tv_h/\mathrm{FM}\)`), v: tx`\(${fmt(Ph / 1000, 4)}\ \mathrm{kW}\)` },
        { k: T(tx`ideal power now \(T(V_c+v_i)\)`, tx`いまの理想動力 \(T(V_c+v_i)\)`), v: tx`\(${fmt(Pideal / 1000, 4)}\ \mathrm{kW}\)` },
        { k: T('ideal autorotation descent rate', '理想的なオートローテーションの降下率'), v: tx`\(${fmt(-xa * vH, 3)}\ \mathrm{m/s}\)` },
      ], T('Hover power grows as T^(3/2)/√A: a large, lightly loaded rotor is efficient, which is why helicopters have long blades, and why they burn far more fuel per kilogram lifted than an aircraft with wings.', 'ホバーの動力は T^(3/2)/√A に比例して増えます。大きく軽い荷重のローターは効率がよく、そのためヘリコプターのブレードは長いのです。またそのため、翼のある航空機より持ち上げる 1 kg あたりずっと多くの燃料を使います。').replace('T^(3/2)/√A', tx`\(T^{3/2}/\sqrt A\)`));
    },
  };
})();
