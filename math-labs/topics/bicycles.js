'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180, G = 9.81, RHO = 1.225;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * 1. Self-stability: the linearised Whipple model in the benchmark form of Meijaard, Papadopoulos, Ruina and Schwab (2007),
   *    M q'' + v C1 q' + (g K0 + v^2 K2) q = 0 for lean phi and steer delta, with the coefficient matrices built from the
   *    benchmark parameters by the paper's formulas (so trail, steer-axis tilt and wheel spin inertia can be varied).
   *    Eigenvalues are the roots of det(M s^2 + v C1 s + g K0 + v^2 K2) = 0.
   * 2. Gearing and power: speed = cadence x (front teeth / rear teeth) x wheel circumference; power at the wheel is
   *    aerodynamic drag + rolling resistance + climbing, divided by the drivetrain efficiency at the crank.
   * 3. Indexed shifting: derailleur movement = shift ratio x cable movement; the sprockets are a fixed pitch apart.
   * 4. Braking: load transfer m a h / w; the front tyre skids when mu N_f is exceeded, the bicycle pitches over when N_r = 0.
   * 5. Brake systems: hand force x lever ratio x (caliper ratio or piston area ratio) gives the pad force; friction on both
   *    pads acts at the rim or rotor radius.
   */
  const BENCH = { w: 1.02, c: 0.08, lam: PI / 10, rR: 0.3, mR: 2, IRxx: 0.0603, IRyy: 0.12, xB: 0.3, zB: -0.9, mB: 85, IBxx: 9.2, IBxz: 2.4, IBzz: 2.8,
    xH: 0.9, zH: -0.7, mH: 4, IHxx: 0.05892, IHxz: -0.00756, IHzz: 0.00708, rF: 0.35, mF: 3, IFxx: 0.1405, IFyy: 0.28 };
  function whipple(o = {}) {
    const P = { ...BENCH, ...o }, { w, c, lam, rR, mR, IRxx, IRyy, xB, zB, mB, IBxx, IBxz, IBzz, xH, zH, mH, IHxx, IHxz, IHzz, rF, mF, IFxx, IFyy } = P;
    const sl = Math.sin(lam), cl = Math.cos(lam);
    const mT = mR + mB + mH + mF, xT = (xB * mB + xH * mH + w * mF) / mT, zT = (-rR * mR + zB * mB + zH * mH - rF * mF) / mT;
    const ITxx = IRxx + IBxx + IHxx + IFxx + mR * rR * rR + mB * zB * zB + mH * zH * zH + mF * rF * rF;
    const ITxz = IBxz + IHxz - mB * xB * zB - mH * xH * zH + mF * w * rF;
    const ITzz = IRxx + IBzz + IHzz + IFxx + mB * xB * xB + mH * xH * xH + mF * w * w;
    const mA = mH + mF, xA = (xH * mH + w * mF) / mA, zA = (zH * mH - rF * mF) / mA;
    const IAxx = IHxx + IFxx + mH * (zH - zA) ** 2 + mF * (rF + zA) ** 2;
    const IAxz = IHxz - mH * (xH - xA) * (zH - zA) + mF * (w - xA) * (rF + zA);
    const IAzz = IHzz + IFxx + mH * (xH - xA) ** 2 + mF * (w - xA) ** 2;
    const uA = (xA - w - c) * cl - zA * sl;
    const IAll = mA * uA * uA + IAxx * sl * sl + 2 * IAxz * sl * cl + IAzz * cl * cl;
    const IAlx = -mA * uA * zA + IAxx * sl + IAxz * cl, IAlz = mA * uA * xA + IAxz * sl + IAzz * cl;
    const mu = (c / w) * cl, SR = IRyy / rR, SF = IFyy / rF, ST = SR + SF, SA = mA * uA + mu * mT * xT;
    const M = [[ITxx, IAlx + mu * ITxz], [IAlx + mu * ITxz, IAll + 2 * mu * IAlz + mu * mu * ITzz]];
    const K0 = [[mT * zT, -SA], [-SA, -SA * sl]];
    const K2 = [[0, ((ST - mT * zT) / w) * cl], [0, ((SA + SF * sl) / w) * cl]];
    const C1 = [[0, mu * ST + SF * cl + (ITxz / w) * cl - mu * mT * zT], [-(mu * ST + SF * cl), (IAlz / w) * cl + mu * (SA + (ITzz / w) * cl)]];
    return { M, K0, K2, C1, P };
  }
  // complex roots of a real polynomial (coefficients highest first), Durand-Kerner
  function polyRoots(a) {
    const n = a.length - 1, c = a.map((x) => x / a[0]); let z = Array.from({ length: n }, (_, k) => [Math.cos(0.4 + (TAU * k) / n) * 1.3, Math.sin(0.4 + (TAU * k) / n) * 1.3]);
    const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
    const scale = 1 + Math.max(...c.map(Math.abs)); z = z.map((q) => [q[0] * scale * 0.5, q[1] * scale * 0.5]);
    for (let it = 0; it < 500; it++) {
      let move = 0;
      z = z.map((zi, i) => {
        let p = [1, 0]; for (let k = 1; k <= n; k++) { p = mul(p, zi); p[0] += c[k]; }
        let q = [1, 0]; for (let j = 0; j < n; j++) if (j !== i) q = mul(q, [zi[0] - z[j][0], zi[1] - z[j][1]]);
        const d = div(p, q); move = Math.max(move, Math.abs(d[0]) + Math.abs(d[1])); return [zi[0] - d[0], zi[1] - d[1]];
      });
      if (move < 1e-13) break;
    }
    return z;
  }
  function charPoly(W, v) {
    const { M, K0, K2, C1 } = W, C = C1.map((r) => r.map((x) => x * v)), K = K0.map((r, i) => r.map((x, j) => G * x + v * v * K2[i][j]));
    return [M[0][0] * M[1][1] - M[0][1] * M[1][0],
      M[0][0] * C[1][1] + M[1][1] * C[0][0] - M[0][1] * C[1][0] - M[1][0] * C[0][1],
      M[0][0] * K[1][1] + M[1][1] * K[0][0] - M[0][1] * K[1][0] - M[1][0] * K[0][1] + C[0][0] * C[1][1] - C[0][1] * C[1][0],
      C[0][0] * K[1][1] + C[1][1] * K[0][0] - C[0][1] * K[1][0] - C[1][0] * K[0][1],
      K[0][0] * K[1][1] - K[0][1] * K[1][0]];
  }
  const eigen = (W, v) => polyRoots(charPoly(W, v)).sort((p, q) => p[0] - q[0]);
  const growth = (W, v) => Math.max(...eigen(W, v).map((z) => z[0]));
  // the self-stable speed range: weave speed (oscillation stops growing) and capsize speed (a real root turns positive)
  function stableRange(W, vmax = 12) {
    let lo = NaN, hi = NaN, prev = growth(W, 0.05) < 0;
    for (let v = 0.1; v <= vmax + 1e-9; v += 0.05) {
      const s = growth(W, v) < 0;
      if (s && !prev && !Number.isFinite(lo)) { let a = v - 0.05, b = v; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (growth(W, m) < 0) b = m; else a = m; } lo = (a + b) / 2; }
      if (!s && prev && Number.isFinite(lo) && !Number.isFinite(hi)) { let a = v - 0.05, b = v; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (growth(W, m) < 0) a = m; else b = m; } hi = (a + b) / 2; }
      prev = s;
    }
    return { weave: lo, capsize: hi };
  }
  // response to a sideways knock: initial lean rate, RK4; returns samples {t, phi, delta, psi, y}
  function simulate(W, v, o = {}) {
    const { M, K0, K2, C1, P } = W, dt = o.dt ?? 0.002, Tmax = o.T ?? 8, det = M[0][0] * M[1][1] - M[0][1] * M[1][0], cl = Math.cos(P.lam);
    const acc = (q, qd) => {
      const f0 = -(v * (C1[0][0] * qd[0] + C1[0][1] * qd[1]) + (G * K0[0][0] + v * v * K2[0][0]) * q[0] + (G * K0[0][1] + v * v * K2[0][1]) * q[1]);
      const f1 = -(v * (C1[1][0] * qd[0] + C1[1][1] * qd[1]) + (G * K0[1][0] + v * v * K2[1][0]) * q[0] + (G * K0[1][1] + v * v * K2[1][1]) * q[1]);
      return [(M[1][1] * f0 - M[0][1] * f1) / det, (M[0][0] * f1 - M[1][0] * f0) / det];
    };
    let s = [0, 0, o.kick ?? 0.5, 0, 0, 0];           // phi, delta, phi', delta', psi, y
    const der = (u) => { const a = acc([u[0], u[1]], [u[2], u[3]]); return [u[2], u[3], a[0], a[1], ((v * u[1] + P.c * u[3]) * cl) / P.w, v * u[4]]; };
    const out = [{ t: 0, phi: 0, delta: 0, psi: 0, y: 0 }]; let fell = false;
    for (let i = 1; i * dt <= Tmax + 1e-9; i++) {
      const k1 = der(s), k2 = der(s.map((x, j) => x + (dt / 2) * k1[j])), k3 = der(s.map((x, j) => x + (dt / 2) * k2[j])), k4 = der(s.map((x, j) => x + dt * k3[j]));
      s = s.map((x, j) => x + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      if (Math.abs(s[0]) > 1.0 || Math.abs(s[1]) > 1.2) fell = true;
      if (i % 10 === 0) out.push({ t: i * dt, phi: s[0], delta: s[1], psi: s[4], y: s[5] });
      if (fell) break;
    }
    return { pts: out, fell };
  }

  // ---- gearing and power ----
  const RINGS = [34, 50], COGS = [32, 28, 24, 21, 19, 17, 15, 14, 13, 12, 11], CIRC = 2.105, CRANK = 0.1725, PITCH = 0.0127;
  const RIDE = { m: 80, CdA: 0.32, Crr: 0.005, eta: 0.975 };
  const pitchRadius = (N) => PITCH / (2 * Math.sin(PI / N));
  const speed = (cad, nf, nr) => (cad / 60) * (nf / nr) * CIRC;                       // m/s
  function power(v, gradePct = 0, o = {}) {
    const R = { ...RIDE, ...o }, th = Math.atan(gradePct / 100);
    const aero = 0.5 * RHO * R.CdA * v ** 3, roll = R.Crr * R.m * G * Math.cos(th) * v, climb = R.m * G * Math.sin(th) * v;
    return { aero, roll, climb, wheel: aero + roll + climb, crank: (aero + roll + climb) / R.eta };
  }
  function speedForPower(Pc, gradePct = 0, o = {}) { let lo = 0, hi = 40; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (power(m, gradePct, o).crank < Pc) lo = m; else hi = m; } return (lo + hi) / 2; }

  // ---- indexed shifting ----
  const SHIFT = { pitch: 3.74, ratio: 3.74 / 2.7, pull: 2.7, quiet: 0.4, limit: 1.3 };       // mm; 11 sprockets
  // lateral position of the guide pulley (mm from the smallest sprocket) in gear k = 1..11 counted from the smallest
  function derailleurPos(k, o = {}) {
    const pull = o.pull ?? SHIFT.pull, slack = o.slack ?? 0, adj = o.adj ?? 0, fr = o.fric ?? 0, dir = o.dir ?? 0;      // dir +1 arrived by pulling cable, -1 by releasing
    return SHIFT.ratio * ((k - 1) * pull - slack + adj - dir * fr);
  }
  const shiftError = (k, o = {}) => (o.electronic ? 0 : derailleurPos(k, o) - (k - 1) * SHIFT.pitch);

  // ---- braking ----
  const WB = 1.02;
  function braking(mu, lf, h, mode) {       // lf: centre of mass behind the front contact; mode 0 front, 1 rear, 2 both
    const lr = WB - lf, po = lf / h;        // decelerations in units of g
    let a, limit;
    if (mode === 0) { const skid = WB - mu * h > 1e-9 ? (mu * lr) / (WB - mu * h) : Infinity; a = Math.min(skid, po); limit = skid < po ? 'skid' : 'pitch'; }
    else if (mode === 1) { a = (mu * lf) / (WB + mu * h); limit = 'skid'; }
    else { a = Math.min(mu, po); limit = mu < po ? 'skid' : 'pitch'; }
    return { a, limit, Nf: (lr + a * h) / WB, Nr: (lf - a * h) / WB, pitch: po };
  }
  const stopDistance = (v, a) => (v * v) / (2 * a * G);

  // ---- brake systems ----
  const BRK = {
    rim: { lever: 4, caliper: 1.3, eff: 0.85, muDry: 0.7, muWet: 0.3, r: 0.311 },
    disc: { lever: 7, dMaster: 0.010, dSlave: 0.022, eff: 0.95, muDry: 0.4, muWet: 0.35 },
    rTyre: 0.34, rotors: [0.14, 0.16, 0.18, 0.203],
  };
  const rotorRadius = (D) => D / 2 - 0.012;                                             // effective radius of the pad on the brake track
  function brakeForce(type, hand, wet = false, rotorD = 0.16) {
    if (type === 0) { const b = BRK.rim, ma = b.lever * b.caliper * b.eff, N = hand * ma, mu = wet ? b.muWet : b.muDry; return { ma, pad: N, mu, r: b.r, tyre: (2 * mu * N * b.r) / BRK.rTyre, pressure: 0 }; }
    const b = BRK.disc, area = (b.dSlave / b.dMaster) ** 2, ma = b.lever * area * b.eff, N = hand * ma, mu = wet ? b.muWet : b.muDry, r = rotorRadius(rotorD);
    return { ma, pad: N, mu, r, tyre: (2 * mu * N * r) / BRK.rTyre, pressure: (hand * b.lever * b.eff) / ((PI * b.dMaster ** 2) / 4) };
  }
  const M = { BENCH, whipple, polyRoots, charPoly, eigen, growth, stableRange, simulate, RINGS, COGS, CIRC, CRANK, RIDE, pitchRadius, speed, power, speedForPower, SHIFT, derailleurPos, shiftError, WB, braking, stopDistance, BRK, rotorRadius, brakeForce, G };
  (window.LabModels = window.LabModels || {}).bicycles = M;

  /* ---------------- a road bicycle in 3D (shared by the 3D experiments) ----------------
   * Side-view coordinates: x forward, z up, origin at the rear tyre's contact point; y to the rider's left.
   * The steering axis meets the ground a distance c (the trail) ahead of the front contact and is tilted back by lam.
   */
  const RW = 0.34, WBD = 1.0;
  const axisPoint = (lam, c, t) => [WBD + c - t * Math.sin(lam), 0, t * Math.cos(lam)];
  function crownT(lam, c) { let t = 0.3; for (let i = 0; i < 400; i++) { const p = axisPoint(lam, c, t); if (Math.hypot(p[0] - WBD, p[2] - RW) >= 0.385 && p[2] > RW) return t; t += 0.002; } return t; }
  function buildBike(S, o = {}) {
    const TH = S.THREE, lam = o.lam ?? 18 * DEG, c = o.c ?? 0.06, brake = o.brake ?? 'disc', rotorD = o.rotor ?? 0.16;
    const root = new TH.Group(), lean = new TH.Group(); root.add(lean);
    const mt = {
      paint: S.mat(o.paint ?? '#1e4f8f', { rough: 0.3, coat: 1, coatRough: 0.08 }), alloy: S.mat('#c5cad0', { metal: 0.95, rough: 0.28 }), steel: S.mat('#d8dadd', { metal: 1, rough: 0.22 }),
      black: S.mat('#17181a', { rough: 0.55, coat: 0.3 }), tyre: S.mat('#1a1a1c', { rough: 0.92, coat: 0 }), chain: S.mat('#8b9096', { metal: 0.9, rough: 0.4 }), pad: S.mat('#7a3b2a', { rough: 0.8, coat: 0 }),
      clear: S.mat('#2a2c30', { rough: 0.4, opacity: 0.38 }),
    };
    const V = (p) => new TH.Vector3(p[0], p[1], p[2]), geos = [];
    const add = (m, parent) => { m.castShadow = m.material.opacity >= 0.6; (parent || lean).add(m); geos.push(m.geometry); return m; };
    const cyl = (a, b, r, mat, parent, r2 = r, seg = 18) => { const A = V(a), d = V(b).sub(A), len = d.length(); const m = new TH.Mesh(new TH.CylinderGeometry(r2, r, len, seg), mat); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), d.normalize()); return add(m, parent); };
    const tube = (pts, r, mat, parent) => { const m = S.tube(pts, { r, add: false, radial: 12 }); m.material = mat; return add(m, parent); };
    const box = (size, pos, mat, parent) => { const m = new TH.Mesh(new TH.BoxGeometry(...size), mat); m.position.set(...pos); return add(m, parent); };

    // ----- wheels -----
    const wheel = (rear) => {
      const g = new TH.Group();
      add(new TH.Mesh(new TH.TorusGeometry(RW - 0.0125, 0.0125, 16, 80).rotateX(PI / 2), mt.tyre), g);
      const prof = [[0.297, 0], [0.304, 0.0085], [0.3165, 0.0105], [0.3165, -0.0105], [0.304, -0.0085], [0.297, 0]].map((q) => new TH.Vector2(q[0], q[1]));
      add(new TH.Mesh(new TH.LatheGeometry(prof, 80), mt.alloy), g);
      const hw = rear ? 0.062 : 0.048;
      cyl([0, -hw, 0], [0, hw, 0], 0.014, mt.alloy, g); cyl([0, -0.036, 0], [0, -0.032, 0], 0.027, mt.alloy, g); cyl([0, 0.032, 0], [0, 0.036, 0], 0.027, mt.alloy, g);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, side = i % 2 ? 1 : -1, off = ((i >> 1) % 2 ? 1 : -1) * 0.55; cyl([0.026 * Math.cos(a), side * 0.034, 0.026 * Math.sin(a)], [0.298 * Math.cos(a + off), 0, 0.298 * Math.sin(a + off)], 0.0011, mt.steel, g, 0.0011, 6); }
      return g;
    };
    const rearW = wheel(true); rearW.position.set(0, 0, RW); lean.add(rearW);
    // ----- frame -----
    const BB = [0.41, 0, 0.27], ST = [0.252, 0, 0.786], tc = crownT(lam, c), crown = axisPoint(lam, c, tc), hb = axisPoint(lam, c, tc + 0.03), ht = axisPoint(lam, c, tc + 0.17);
    cyl(BB, ST, 0.016, mt.paint); cyl([0.262, 0, 0.752], axisPoint(lam, c, tc + 0.155), 0.015, mt.paint); cyl(BB, axisPoint(lam, c, tc + 0.05), 0.019, mt.paint); cyl(hb, ht, 0.021, mt.paint);
    for (const s of [-1, 1]) { cyl([0.4, s * 0.03, 0.27], [0, s * 0.068, RW], 0.009, mt.paint); cyl([0.26, s * 0.018, 0.745], [0, s * 0.068, RW], 0.0075, mt.paint); }
    cyl([0.41, -0.036, 0.27], [0.41, 0.036, 0.27], 0.021, mt.paint);
    cyl(ST, [0.222, 0, 0.885], 0.0135, mt.alloy);
    { const sd = new TH.Mesh(new TH.SphereGeometry(1, 24, 14), mt.black); sd.scale.set(0.135, 0.068, 0.022); sd.position.set(0.205, 0, 0.905); add(sd); }
    // ----- drivetrain (on the rider's right, y < 0) -----
    const crank = new TH.Group(); crank.position.set(...BB); lean.add(crank);
    const ring = new TH.Mesh(new TH.CylinderGeometry(pitchRadius(50), pitchRadius(50), 0.003, 50), mt.black); ring.position.y = -0.047; add(ring, crank);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; cyl([0, -0.045, 0], [0.085 * Math.cos(a), -0.047, 0.085 * Math.sin(a)], 0.006, mt.alloy, crank); }
    for (const s of [-1, 1]) { cyl([0, s * 0.055, 0], [s * 0.1725, s * 0.062, 0], 0.011, mt.alloy, crank, 0.008); box([0.09, 0.07, 0.014], [s * 0.1725, s * 0.11, 0], mt.black, crank); cyl([s * 0.1725, s * 0.062, 0], [s * 0.1725, s * 0.08, 0], 0.006, mt.steel, crank); }
    const cogs = new TH.Group(); cogs.position.set(0, -0.045, 0); rearW.add(cogs);
    COGS.forEach((nT, i) => { const m = new TH.Mesh(new TH.CylinderGeometry(pitchRadius(nT), pitchRadius(nT), 0.0018, Math.max(22, nT * 2)), mt.steel); m.position.y = 0.018 - i * 0.0037; add(m, cogs); });
    const rc = pitchRadius(17), rf = pitchRadius(50), yc = -0.047;
    tube([[BB[0], yc, BB[2] + rf], [0, yc, RW + rc]], 0.0032, mt.chain); 
    const j1 = [0.03, yc, RW - 0.085], j2 = [0.055, yc, RW - 0.165];
    tube([[BB[0], yc, BB[2] - rf], [j2[0] + 0.02, yc, j2[2] - 0.02], [j2[0] - 0.02, yc, j2[2]], [j1[0] + 0.02, yc, j1[2] + 0.005], [j1[0] - 0.015, yc, j1[2] + 0.03], [-rc * 0.9, yc, RW - 0.02]], 0.0032, mt.chain);
    for (const j of [j1, j2]) cyl([j[0], yc - 0.004, j[2]], [j[0], yc + 0.004, j[2]], 0.021, mt.black);
    cyl([j1[0], yc - 0.008, j1[2]], [j2[0], yc - 0.008, j2[2]], 0.005, mt.alloy); box([0.05, 0.02, 0.03], [0.02, yc - 0.02, RW - 0.045], mt.black);
    // ----- steering assembly: fork, stem, bars, front wheel; turns about the steering axis -----
    const pivot = new TH.Group(); pivot.position.set(...crown); const baseQ = new TH.Quaternion().setFromUnitVectors(new TH.Vector3(0, 0, 1), new TH.Vector3(-Math.sin(lam), 0, Math.cos(lam))); pivot.quaternion.copy(baseQ); lean.add(pivot);
    const front = [], F = (m) => { front.push(m); return m; };
    const AF = [WBD, 0, RW];
    F(cyl(axisPoint(lam, c, tc - 0.012), axisPoint(lam, c, tc + 0.028), 0.022, mt.paint));
    F(cyl([crown[0], -0.052, crown[2]], [crown[0], 0.052, crown[2]], 0.013, mt.paint));
    for (const s of [-1, 1]) { const mid = axisPoint(lam, c, tc * 0.45); F(tube([[crown[0], s * 0.05, crown[2]], [mid[0], s * 0.05, mid[2]], [AF[0], s * 0.05, AF[2]]], 0.011, mt.paint)); }
    const sTop = axisPoint(lam, c, tc + 0.2), fwd = [Math.cos(lam * 0.4), 0, Math.sin(lam * 0.4)], barC = [sTop[0] + 0.1 * fwd[0], 0, sTop[2] + 0.1 * fwd[2]];
    F(cyl(axisPoint(lam, c, tc + 0.16), sTop, 0.015, mt.alloy)); F(cyl(sTop, barC, 0.014, mt.black));
    for (const s of [-1, 1]) {
      F(tube([[barC[0], 0, barC[2]], [barC[0], s * 0.15, barC[2]], [barC[0] + 0.01, s * 0.2, barC[2]], [barC[0] + 0.07, s * 0.205, barC[2] - 0.002], [barC[0] + 0.105, s * 0.205, barC[2] - 0.05], [barC[0] + 0.075, s * 0.205, barC[2] - 0.115], [barC[0] - 0.015, s * 0.205, barC[2] - 0.125]], 0.0125, mt.black));
      F(cyl([barC[0] + 0.07, s * 0.205, barC[2]], [barC[0] + 0.115, s * 0.205, barC[2] + 0.035], 0.016, mt.black, null, 0.013));
    }
    const frontW = wheel(false); frontW.position.set(...AF); lean.add(frontW); front.push(frontW);
    // brake lever blade on the left hood (the front brake in this picture)
    const blade = new TH.Group(); blade.position.set(barC[0] + 0.118, 0.205, barC[2] + 0.03); lean.add(blade); front.push(blade);
    tube([[0, 0, 0], [0.022, 0, -0.045], [0.018, 0, -0.105], [0.006, 0, -0.13]], 0.0055, mt.alloy, blade);
    const pads = []; let hoseTo = null;
    if (brake === 'disc') {
      const ro = rotorD / 2, ri = ro - 0.015, t = 0.0009, yR = 0.044;
      const rot = new TH.Mesh(new TH.LatheGeometry([[ri, -t], [ro, -t], [ro, t], [ri, t], [ri, -t]].map((q) => new TH.Vector2(q[0], q[1])), 72), mt.steel); rot.position.y = yR; add(rot, frontW);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3, len = ri - 0.02, m = new TH.Mesh(new TH.BoxGeometry(len, 0.0018, 0.011), mt.steel); m.position.set((0.02 + len / 2) * Math.cos(a), yR, (0.02 + len / 2) * Math.sin(a)); m.rotation.y = -a; add(m, frontW); }
      const a = PI / 2 + lam + 0.62, rp = rotorRadius(rotorD), cal = new TH.Group(); cal.position.set(AF[0] + rp * Math.cos(a), yR, AF[2] + rp * Math.sin(a)); cal.rotation.y = -a; lean.add(cal); front.push(cal);
      box([0.04, 0.02, 0.058], [0.002, -0.017, 0], mt.black, cal); box([0.04, 0.02, 0.058], [0.002, 0.017, 0], mt.clear, cal); box([0.012, 0.054, 0.058], [0.03, 0, 0], mt.black, cal);
      for (const s of [-1, 1]) {
        const pad = box([0.024, 0.0035, 0.042], [0, s * 0.004, 0], mt.pad, cal), pis = new TH.Mesh(new TH.CylinderGeometry(0.011, 0.011, 0.012, 24), mt.steel); pis.position.set(0, s * 0.012, 0); add(pis, cal);
        pads.push({ m: pad, s, y0: t + 0.00175, piston: pis });
      }
      hoseTo = [AF[0] + (rp + 0.03) * Math.cos(a), 0.062, AF[2] + (rp + 0.03) * Math.sin(a)];
    } else {
      const u = [crown[0] - AF[0], 0, crown[2] - AF[2]], ul = Math.hypot(u[0], u[2]); u[0] /= ul; u[2] /= ul; const fw = [u[2], 0, -u[0]];
      const at = (r, y, f = 0.03) => [AF[0] + r * u[0] + f * fw[0], y, AF[2] + r * u[2] + f * fw[2]];
      F(cyl(at(0.388, 0, 0), at(0.388, 0, 0.045), 0.005, mt.steel));
      for (const s of [-1, 1]) {
        F(tube([at(0.4, s * 0.004), at(0.392, s * 0.034), at(0.35, s * 0.04), at(0.318, s * 0.027)], 0.0055, mt.alloy));
        const g = new TH.Group(); g.position.set(...at(0.311, 0, 0.03)); g.quaternion.setFromUnitVectors(new TH.Vector3(0, 0, 1), new TH.Vector3(u[0], 0, u[2])); lean.add(g); front.push(g);
        const pad = box([0.052, 0.008, 0.011], [0, s * 0.016, 0], mt.pad, g); pads.push({ m: pad, s, y0: 0.0105 + 0.004 });
      }
      F(tube([at(0.4, 0.004), at(0.43, 0.03), at(0.47, 0.05)], 0.0022, mt.steel));
      hoseTo = at(0.47, 0.05);
    }
    // hose or cable from the lever to the brake
    { const h1 = [barC[0] + 0.1, 0.2, barC[2] + 0.005], h2 = [barC[0] + 0.01, 0.12, barC[2] - 0.035], h3 = [crown[0] + 0.03, 0.058, crown[2] + 0.06]; F(tube(brake === 'disc' ? [h1, h2, h3, [(crown[0] + AF[0]) / 2 + 0.01, 0.064, (crown[2] + AF[2]) / 2], hoseTo] : [h1, h2, [h3[0] + 0.03, 0.05, h3[2] + 0.05], hoseTo], 0.0028, mt.black)); }
    lean.updateMatrixWorld(true); for (const m of front) pivot.attach(m);
    S.add(root);
    const qz = new TH.Quaternion(), ZA = new TH.Vector3(0, 0, 1);
    return {
      root, lean, pivot, rearW, frontW, crank, blade, pads, brake,
      pose(p) {                           // lean right and steer right are positive, as in the equations
        root.position.set(0, -(p.y ?? 0), 0); root.rotation.z = -(p.psi ?? 0); lean.rotation.x = p.phi ?? 0;
        pivot.quaternion.copy(baseQ).multiply(qz.setFromAxisAngle(ZA, -(p.delta ?? 0)));
        if (p.roll !== undefined) { rearW.rotation.y = p.roll; frontW.rotation.y = p.roll; }
        if (p.crank !== undefined) crank.rotation.y = p.crank;
        S.invalidate();
      },
      squeeze(k) { const gap = (brake === 'disc' ? 0.0022 : 0.004) * (1 - clamp(k, 0, 1)); for (const q of pads) { q.m.position.y = q.s * (q.y0 + gap); if (q.piston) q.piston.position.y = q.s * (q.y0 + gap + 0.0078); } blade.rotation.y = 0.3 * clamp(k, 0, 1); S.invalidate(); },
      dispose() { S.scene.remove(root); for (const g of geos) g.dispose(); },
    };
  }
  // ground: an asphalt slab with painted metre squares that scroll under the bicycle
  function buildGround(S) {
    const TH = S.THREE, g = new TH.Group();
    const slab = new TH.Mesh(new TH.BoxGeometry(60, 40, 0.02), S.mat('#a3a6aa', { rough: 0.96, coat: 0 })); slab.position.set(1.2, 0, -0.011); slab.receiveShadow = true; S.add(slab);
    const segs = []; for (let i = -12; i <= 14; i++) segs.push([[i, -8.5, 0.002], [i, 8.5, 0.002]]); for (let j = -8; j <= 9; j++) segs.push([[-12, j - 0.5, 0.002], [14, j - 0.5, 0.002]]);
    const lines = S.lines(segs, { c: '#f4f5f6', opacity: 0.6 });
    return { lines, shift(x, y) { lines.position.set(-(((x % 1) + 1) % 1), ((y % 1) + 1) % 1, 0); } };
  }
  // side view in 2D (metres): used for the braking figure and as the fallback of the 3D experiments
  function sideBike(f, o = {}) {
    const lam = o.lam ?? 18 * DEG, c = o.c ?? 0.06, w = o.w ?? WBD, col = o.col ?? 'ink', tc = crownT(lam, c), ax = (t) => { const p = axisPoint(lam, c, t); return [p[0] + (w - WBD), p[2]]; };
    for (const x of [0, w]) { f.circle(x, RW, RW, { c: col, w: 3.2 }); f.circle(x, RW, 0.3, { c: 'muted', w: 1 }); f.dot(x, RW, { c: col, r: 3 }); }
    const BB = [0.41, 0.27], ST = [0.252, 0.786];
    f.line([[0, RW], BB, ST, [0, RW]], { c: 'c1', w: 3 }); f.line([BB, ax(tc + 0.05)], { c: 'c1', w: 3.4 }); f.line([[0.262, 0.752], ax(tc + 0.155)], { c: 'c1', w: 3 });
    f.line([ax(tc + 0.2), ax(tc), [w, RW]], { c: 'c1', w: 3 }); f.line([ST, [0.222, 0.885]], { c: 'muted', w: 2.4 }); f.line([[0.12, 0.905], [0.3, 0.905]], { c: col, w: 4.5 });
    const st = ax(tc + 0.2); f.line([st, [st[0] + 0.1, st[1] + 0.02], [st[0] + 0.19, st[1] + 0.02], [st[0] + 0.21, st[1] - 0.05], [st[0] + 0.17, st[1] - 0.1]], { c: col, w: 3 });
    f.circle(BB[0], BB[1], 0.1, { c: 'muted', w: 1.6 });
    if (o.axis) { f.line([ax(-0.05), ax(tc + 0.35)], { c: 'c2', w: 1.4, dash: '5 4' }); }
    if (o.rider) {
      const hip = [0.2, 0.93], sh = [0.62, 1.38], hand = [st[0] + 0.17, st[1] + 0.03], head = [0.71, 1.52], knee = [0.5, 0.73], foot = [0.47, 0.2];
      f.line([hip, sh, hand], { c: 'c4', w: 5, op: 0.75 }); f.line([hip, knee, foot], { c: 'c4', w: 5, op: 0.75 }); f.circle(head[0], head[1], 0.1, { c: 'c4', w: 4, op: 0.75 });
    }
  }

  /* ================= 1. self-stability (3D) ================= */
  D['bicycle-self-stability'] = {
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
      const lam = v.lam * DEG, W = whipple({ c: v.c, lam, IFyy: BENCH.IFyy * v.gyro, IRyy: BENCH.IRyy * v.gyro }), key = [v.c, v.lam, v.gyro].join(':');
      if (st.key !== key) { st.key = key; st.range = stableRange(W); st.curve = L.seq(101, (i) => { const sp = 0.1 * i + 0.001; return [sp, eigen(W, sp)]; }); }
      const R = st.range, ev = eigen(W, Math.max(v.v, 0.001)), gmax = Math.max(...ev.map((z) => z[0])), sim = simulate(W, v.v), stable = gmax < 0;
      st.sim = sim; st.v = v.v;
      L.setText(st.cap1, T(tx`A riderless bicycle rolling at \(v\) is knocked sideways. It leans, and the front assembly, free to turn about the tilted steering axis, steers into the lean; the wheels then run back under the centre of mass. Within a range of speeds the wobble dies away with no one steering. The painted squares are one metre.`, tx`速さ \(v\) で転がる無人の自転車を、横からたたきます。自転車は傾き、傾いたステアリング軸のまわりに自由に回る前部が傾いた側へ切れて、車輪が重心の下へ戻ります。ある範囲の速さでは、誰も操縦しなくてもふらつきが収まります。路面の四角は 1 メートルです。`));
      L.setText(st.cap2, T(tx`Growth rates \(\operatorname{Re}s\) of the four modes against speed (blue: oscillating weave pair, orange: non-oscillating capsize and castering). The bicycle is self-stable where every rate is negative, between the weave and capsize speeds (shaded). Drag the gold point to set the speed.`, tx`四つのモードの成長率 \(\operatorname{Re}s\) を速さに対して描いています（青は振動するウィーブの対、オレンジは振動しないキャプサイズとキャスター）。すべての成長率が負になるウィーブ速度とキャプサイズ速度の間（色を付けた範囲）で、自転車は自己安定です。金色の点をドラッグして速さを決めてください。`));
      L.setText(st.cap3, T(tx`Lean \(\varphi\) and steer \(\delta\) after the knock (a lean rate of 0.5 rad/s), in degrees.`, tx`たたいた後（傾きの角速度 0.5 rad/s）の傾き \(\varphi\) と舵角 \(\delta\) で、単位は度です。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 10], y: [-8, 6], aspect: 0.6, maxH: 270, xlabel: T(tx`speed \(v\) (m/s)`, tx`速さ \(v\)（m/s）`), ylabel: tx`\(\operatorname{Re}s\ (1/\mathrm{s})\)` });
      if (Number.isFinite(R.weave)) f.rect(R.weave, -8, (Number.isFinite(R.capsize) ? Math.min(10, R.capsize) : 10) - R.weave, 14, { c: 'c3', fill: 'c3', fo: 0.14, nostroke: true, layer: 'under' });
      f.hline(0, { c: 'ink', w: 1.2 });
      for (const [sp, zs] of st.curve) for (const z of zs) if (z[0] > -8 && z[0] < 6) f.dot(sp, z[0], { c: Math.abs(z[1]) > 1e-6 ? 'c1' : 'c2', r: 1.7 });
      f.handle(v.v, clamp(gmax, -8, 6), { c: 'hl', axis: 'x', bounds: [0, 10, -8, 6], label: T('speed', '速さ'), onDrag: (x) => ctx.set('v', clamp(Math.round(x * 10) / 10, 0, 10)) });
      const pts = sim.pts, tEnd = 8, amp = Math.max(0.12, ...pts.map((q) => Math.max(Math.abs(q.phi), Math.abs(q.delta)))) / DEG;
      const g = L.fig(st.g3, { x: [0, tEnd], y: [-Math.min(60, amp * 1.1), Math.min(60, amp * 1.1)], aspect: 0.5, maxH: 220, xlabel: T(tx`time (s)`, tx`時間（s）`) });
      g.line(pts.map((q) => [q.t, q.phi / DEG]), { c: 'c1', w: 2.4 }); g.line(pts.map((q) => [q.t, q.delta / DEG]), { c: 'c2', w: 2 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T(tx`weave modes; lean \(\varphi\)`, tx`ウィーブ、傾き \(\varphi\)`) }, { c: 'c2', label: T(tx`capsize and castering modes; steer \(\delta\)`, tx`キャプサイズとキャスター、舵角 \(\delta\)`) }, { c: 'c3', kind: 'fill', label: T('self-stable speeds', '自己安定な速さ') }]);
      ctx.readout([
        { k: T('weave speed, capsize speed', 'ウィーブ速度、キャプサイズ速度'), v: Number.isFinite(R.weave) ? tx`\(${fmt(R.weave, 3)},\ ${Number.isFinite(R.capsize) ? fmt(R.capsize, 3) : '>12'}\ \mathrm{m/s}\)` : T('no self-stable range', '自己安定な範囲なし'), tone: Number.isFinite(R.weave) ? undefined : 'warn' },
        { k: T(tx`largest growth rate at \(v=${fmt(v.v, 1)}\) m/s`, tx`\(v=${fmt(v.v, 1)}\) m/s での最大の成長率`), v: tx`\(${fmt(gmax, 3)}\ \mathrm{s^{-1}}\)`, tone: stable ? 'good' : 'warn' },
        { k: T('weave frequency', 'ウィーブの振動数'), v: (() => { const z = ev.find((q) => q[1] > 1e-6); return z ? tx`\(${fmt(z[1] / TAU, 3)}\ \mathrm{Hz}\)` : '–'; })() },
        { k: T('after the knock', 'たたいた後'), v: sim.fell ? T('falls over', '倒れる') : stable ? T('recovers, on a new heading', '立ち直り、新しい向きに進む') : T('slowly diverges', 'ゆっくり発散する'), tone: 'key' },
      ], T('Neither the gyroscopic effect nor trail alone explains it: each helps the front wheel steer into a fall, and what matters is the combination with where the front assembly’s mass sits. Remove the wheels’ spin, or stand the steering axis upright, and this bicycle loses its stable range.', 'ジャイロ効果だけでも、トレールだけでも説明はつきません。どちらも前輪が倒れる側へ切れるのを助けますが、決め手は前部の質量の位置との組み合わせです。車輪のスピンをなくすか、ステアリング軸を直立させると、この自転車は安定な範囲を失います。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.76, maxH: 520, camera: [2.75, -2.9, 1.55], target: [0.5, 0, 0.5], fov: 32,
        label: T('3D bicycle recovering from a sideways knock. Drag to rotate.', '横からたたかれて立ち直る 3D の自転車。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.gr = buildGround(S); st.bkey = null; st.tau = 0;
          st.trail = S.polyline([[0, 0, 0.004], [0.01, 0, 0.004]], { c: 'hl', w: 3 });
          st.at = (tau) => { const P = st.sim.pts, dt = P.length > 1 ? P[1].t : 1, i = Math.min(P.length - 1, Math.floor(tau / dt)); return P[i]; };
          st.show = (tau) => {
            const q = st.at(tau), xr = st.v * tau;
            st.bike.pose({ phi: clamp(q.phi, -1.2, 1.2), delta: clamp(q.delta, -0.9, 0.9), psi: q.psi, roll: xr / RW, crank: 0 });
            st.gr.shift(xr, -q.y);
            const tr = []; for (let s = Math.max(0, tau - 1.6); s <= tau + 1e-9; s += 0.04) { const p = st.at(s); tr.push([-(st.v * (tau - s)), -(p.y - q.y), 0.004]); }
            if (tr.length > 1) st.trail.update(tr);
          };
          S.animate((dt) => { if (S.reduced()) return false; const end = st.sim.pts[st.sim.pts.length - 1].t; st.tau += Math.min(dt, 0.05); if (st.tau > end + 1.2) st.tau = 0; st.show(Math.min(st.tau, end)); return true; });
        },
        update(S) {
          const bkey = v.c + ':' + v.lam;
          if (st.bkey !== bkey) { st.bike?.dispose(); st.bike = buildBike(S, { lam, c: v.c, brake: 'disc' }); st.bkey = bkey; }
          st.tau = 0; st.show(S.reduced() ? 0.7 : 0);
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-0.5, 1.6], y: [-0.1, 1.2], equal: true, maxH: 360, axes: false, grid: false });
          f2.hline(0, { c: 'muted', w: 2 }); sideBike(f2, { lam, c: v.c, axis: true });
        },
      });
    },
  };

  /* ================= 2. gears, cadence and power ================= */
  // the chain's path, in metres, seen from the drive side: chainring at the origin, sprocket behind it, two derailleur pulleys
  function chainPath(nf, nr) {
    const rf = pitchRadius(nf), rc = pitchRadius(nr), rp = pitchRadius(11), Cc = [-0.405, 0.07];
    const circ = [{ c: [0, 0], r: rf, s: -1 }, { c: [Cc[0] + 0.045, Cc[1] - rc - 0.115], r: rp, s: -1 }, { c: [Cc[0] + 0.012, Cc[1] - rc - 0.04], r: rp, s: 1 }, { c: Cc, r: rc, s: -1 }];
    const n = circ.length, leave = [], arrive = [];
    for (let i = 0; i < n; i++) {
      const a = circ[i], b = circ[(i + 1) % n], d = [b.c[0] - a.c[0], b.c[1] - a.c[1]], Dd = Math.hypot(d[0], d[1]), mu = Math.atan2(d[1], d[0]) - Math.acos(clamp((a.r * a.s - b.r * b.s) / Dd, -1, 1));
      leave[i] = Math.atan2(a.s * Math.sin(mu), a.s * Math.cos(mu)); arrive[(i + 1) % n] = Math.atan2(b.s * Math.sin(mu), b.s * Math.cos(mu));
    }
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = circ[i]; let a0 = arrive[i], a1 = leave[i];
      if (a.s < 0) { while (a1 > a0) a1 -= TAU; } else { while (a1 < a0) a1 += TAU; }
      const steps = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 0.08));
      for (let k = 0; k <= steps; k++) { const al = a0 + ((a1 - a0) * k) / steps; pts.push([a.c[0] + a.r * Math.cos(al), a.c[1] + a.r * Math.sin(al)]); }
    }
    pts.push(pts[0]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], circ };
  }
  M.chainPath = chainPath;
  const teeth = (cx, cy, N, ang) => { const r = pitchRadius(N), out = []; for (let i = 0; i < 2 * N; i++) { const a = ang + (i / (2 * N)) * TAU; const rr = i % 2 ? r + 0.0035 : r - 0.003; out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return out; };
  D['bicycle-gearing'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const nf = RINGS[v.ring], nr = COGS[v.cog - 1], ratio = nf / nr, sp = speed(v.cad, nf, nr), Pw = power(sp, v.grade), path = chainPath(nf, nr);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The drivetrain from the right-hand side, to scale: a \(${nf}\)-tooth chainring drives a \(${nr}\)-tooth sprocket through a chain of 12.7 mm pitch, and the derailleur’s two sprung pulleys take up the slack. One turn of the cranks turns the wheel \(${nf}/${nr}=${fmt(ratio, 2)}\) times.`, tx`右側から見た駆動系を、実際の比率で描いています。歯数 \(${nf}\) のチェーンリングが、ピッチ 12.7 mm のチェーンを介して歯数 \(${nr}\) のスプロケットを回し、ばねの付いたディレイラーの二つのプーリーがたるみを取ります。クランクが 1 回転すると、車輪は \(${nf}/${nr}=${fmt(ratio, 2)}\) 回転します。`));
      const f = L.fig(c1, { x: [-0.52, 0.23], y: [-0.215, 0.2], equal: true, maxH: 400, axes: false, grid: false });
      const Cc = path.circ[3].c;
      f.line([[0, 0], Cc], { c: 'muted', w: 5, op: 0.5, layer: 'under' }); f.circle(Cc[0], Cc[1], 0.3165, { c: 'muted', w: 2, op: 0.5, layer: 'under' }); f.circle(Cc[0], Cc[1], RW, { c: 'ink', w: 5, op: 0.35, layer: 'under' });
      f.line(path.pts, { c: 'muted', w: 2.2, layer: 'under' });
      for (const p of [path.circ[1], path.circ[2]]) f.circle(p.c[0], p.c[1], p.r - 0.004, { c: 'ink', w: 1.4, layer: 'under' });
      const nPins = Math.round(path.len / 0.0127), spacing = path.len / nPins;
      const pin = (s) => { s = ((s % path.len) + path.len) % path.len; let lo = 0, hi = path.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path.cum[m] <= s) lo = m; else hi = m; } const u = (s - path.cum[lo]) / (path.cum[hi] - path.cum[lo] || 1); return [path.pts[lo][0] + u * (path.pts[hi][0] - path.pts[lo][0]), path.pts[lo][1] + u * (path.pts[hi][1] - path.pts[lo][1])]; };
      const draw = (t) => {
        f.clear('over'); f.clear('main');
        const th = -(v.cad / 60) * TAU * t, s = (-th) * pitchRadius(nf);       // chain travel
        f.poly(teeth(0, 0, nf, th), { c: 'c1', fill: 'c1', fo: 0.22, w: 1.4 }); f.poly(teeth(Cc[0], Cc[1], nr, th * ratio), { c: 'c2', fill: 'c2', fo: 0.3, w: 1.4 });
        f.line([[CRANK * Math.cos(th + PI), CRANK * Math.sin(th + PI)], [CRANK * Math.cos(th), CRANK * Math.sin(th)]], { c: 'ink', w: 6 });
        for (const e of [th, th + PI]) f.line([[CRANK * Math.cos(e) - 0.035, CRANK * Math.sin(e)], [CRANK * Math.cos(e) + 0.035, CRANK * Math.sin(e)]], { c: 'ink', w: 7 });
        f.dot(Cc[0] + 0.7 * pitchRadius(nr) * Math.cos(th * ratio), Cc[1] + 0.7 * pitchRadius(nr) * Math.sin(th * ratio), { c: 'c2', r: 3 });
        for (let i = 0; i < nPins; i++) { const q = pin(i * spacing + s); f.dot(q[0], q[1], { c: 'ink', r: 1.5 }); }
      };
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Power needed at the cranks against road speed for an 80 kg rider and bicycle on a \(${fmt(v.grade, 1)}\%\) grade: air drag grows as \(v^3\), rolling and climbing as \(v\). The ticks along the bottom are the speeds of all 22 gears at this cadence. Drag the gold point to change the cadence.`, tx`勾配 \(${fmt(v.grade, 1)}\%\) で、乗り手と自転車を合わせて 80 kg のとき、クランクで必要なパワーを速さに対して描いています。空気抵抗は \(v^3\)、転がり抵抗と登坂は \(v\) に比例して増えます。下の目盛りは、このケイデンスでの全 22 段の速さです。金色の点をドラッグしてケイデンスを変えてください。`));
      const g = L.fig(c2, { x: [0, 70], y: [0, 900], aspect: 0.86, maxH: 400, xlabel: T('speed (km/h)', '速さ（km/h）'), ylabel: T('power (W)', 'パワー（W）') });
      const cl = (y) => clamp(y, 0, 950);
      g.line(L.sample(0, 70, 140, (k) => cl(power(k / 3.6, v.grade).aero / RIDE.eta)), { c: 'c2', dash: '5 4', w: 1.6 });
      g.line(L.sample(0, 70, 140, (k) => cl((power(k / 3.6, v.grade).roll + power(k / 3.6, v.grade).climb) / RIDE.eta)), { c: 'c3', dash: '5 4', w: 1.6 });
      g.line(L.sample(0, 70, 140, (k) => cl(power(k / 3.6, v.grade).crank)), { c: 'c1', w: 2.6 });
      RINGS.forEach((a, i) => COGS.forEach((b) => { const k = speed(v.cad, a, b) * 3.6; if (k < 70) g.seg([k, 0], [k, i ? 42 : 26], { c: i ? 'c4' : 'muted', w: 1.6 }); }));
      g.vline(sp * 3.6, { c: 'hl', dash: '3 4' });
      g.handle(Math.min(70, sp * 3.6), cl(Pw.crank), { c: 'hl', axis: 'x', bounds: [0, 70, 0, 900], label: T('speed', '速さ'), onDrag: (x) => ctx.set('cad', clamp(Math.round(((x / 3.6) / (ratio * CIRC)) * 60), 40, 130)) });
      L.legend(ctx.host, [{ c: 'c1', label: T(tx`chainring; total power at the cranks`, tx`チェーンリング、クランクでの全パワー`) }, { c: 'c2', label: T('sprocket; air drag (dashed)', 'スプロケット、空気抵抗（破線）') }, { c: 'c3', dash: true, label: T('rolling resistance and climbing', '転がり抵抗と登坂') }, { c: 'c4', label: T('gears on the 50-tooth ring (grey: 34)', '50 歯のリングの各段（灰色は 34 歯）') }]);
      const om = (v.cad / 60) * TAU, torque = Pw.crank / om;
      ctx.readout([
        { k: T('gear ratio, development per crank turn', 'ギア比、クランク 1 回転で進む距離'), v: tx`\(${fmt(ratio, 3)},\ ${fmt(ratio * CIRC, 2)}\ \mathrm{m}\)` },
        { k: T('speed', '速さ'), v: tx`\(${fmt(sp * 3.6, 1)}\ \mathrm{km/h}\)`, tone: 'key' },
        { k: T('power at the cranks', 'クランクでのパワー'), v: Pw.crank > 0 ? tx`\(${fmt(Pw.crank, 0)}\ \mathrm{W}\)` : T('none: coasting downhill', 'なし：下りで惰行'), tone: Pw.crank > 400 ? 'warn' : undefined },
        { k: T('crank torque, mean pedal force, chain tension', 'クランクのトルク、平均の踏力、チェーンの張力'), v: Pw.crank > 0 ? tx`\(${fmt(torque, 1)}\ \mathrm{N\,m},\ ${fmt(torque / CRANK, 0)}\ \mathrm{N},\ ${fmt(torque / pitchRadius(nf), 0)}\ \mathrm{N}\)` : '–' },
      ], T('Legs give their best power over a narrow band of cadence, roughly 70 to 100 turns a minute. Gears do not add power: they let the rider hold that cadence, trading force at the pedal for distance per turn, from a wall-climbing 34/32 to a 50/11 for descents.', '脚が最もよくパワーを出せるのは、毎分およそ 70 から 100 回転という狭いケイデンスの範囲です。変速機はパワーを増やしません。壁のような坂を登る 34/32 から下り用の 50/11 まで、ペダルにかける力と 1 回転で進む距離を取り替えて、乗り手がそのケイデンスを保てるようにします。'));
      ctx.state.anim = L.animator(ctx.host, (dt, t) => { draw(t); return true; }, { autoplay: true, initialT: 0.11, playLabel: T('Play', '再生') });
    },
  };

  /* ================= 3. shifting: cable indexing and electronic ================= */
  D['bicycle-shifting'] = {
    render(ctx, v) {
      const el = v.mode === 1, k = v.gear, o = { pull: v.pull, slack: v.slack, adj: v.adj, fric: v.fric, electronic: el };
      const err = shiftError(k, { ...o, dir: 0 }), eUp = shiftError(k, { ...o, dir: 1 }), eDn = shiftError(k, { ...o, dir: -1 }), ideal = (k - 1) * SHIFT.pitch, pos = ideal + err;
      const worst = Math.max(Math.abs(eUp), Math.abs(eDn)), state = worst < SHIFT.quiet ? 0 : worst < SHIFT.limit ? 1 : 2;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), el
        ? T(tx`The rear derailleur from behind, in millimetres. The eleven sprockets are 3.74 mm apart. The shifter is only a switch: a small geared motor in the derailleur swings the parallelogram until its position sensor reads the stored value for the chosen sprocket, so cable stretch and friction have nothing to act on.`, tx`後ろから見たリアディレイラーで、単位はミリメートルです。11 枚のスプロケットは 3.74 mm 間隔で並びます。シフターは単なるスイッチです。ディレイラー内の小さな減速機付きモーターが、位置センサーの値が選んだスプロケットの記憶値になるまで平行四辺形リンクを動かすので、ケーブルの伸びや摩擦が入り込む余地がありません。`)
        : T(tx`The rear derailleur from behind, in millimetres. The eleven sprockets are 3.74 mm apart. Each click of the shifter pulls \(${fmt(v.pull, 2)}\) mm of cable against the derailleur’s spring, and the parallelogram multiplies that by about 1.4 to move the guide pulley sideways. The chain (gold) runs from the pulley up to the sprocket above it.`, tx`後ろから見たリアディレイラーで、単位はミリメートルです。11 枚のスプロケットは 3.74 mm 間隔で並びます。シフターを 1 回クリックするごとに、ディレイラーのばねに逆らってケーブルが \(${fmt(v.pull, 2)}\) mm 引かれ、平行四辺形リンクがそれを約 1.4 倍にしてガイドプーリーを横に動かします。チェーン（金色）はプーリーから上のスプロケットへ伸びています。`));
      const f = L.fig(c1, { x: [-36, 50], y: [-96, 12], equal: true, maxH: 470, axes: false, grid: false });
      f.rect(-3, -15, 46, 15, { c: 'muted', fill: 'muted', fo: 0.35, nostroke: true });
      const rmm = (i) => pitchRadius(COGS[10 - i]) * 1000;                    // i = 0 smallest sprocket
      for (let i = 0; i < 11; i++) { const x = i * SHIFT.pitch, sel = i === k - 1; f.rect(x - 0.8, -rmm(i), 1.6, rmm(i), { c: sel ? 'c2' : 'ink', fill: sel ? 'c2' : 'ink', fo: sel ? 0.95 : 0.55, nostroke: true }); }
      f.text(0, 5, '11', { small: true }); f.text(10 * SHIFT.pitch, 5, '32', { small: true }); f.text(19, 5, T('teeth', '歯'), { small: true, c: 'muted' });
      const py = -rmm(k - 1) - 19, px = clamp(pos, -8, 46);
      f.line([[ideal, -rmm(k - 1) - 1], [ideal, -93]], { c: 'c2', dash: '3 4', w: 1.2 });
      // fixed body on the hanger, outboard of the cassette; two links to the knuckle that carries the pulley cage
      const body = [-24, -34], K = [px - 9, py + 5];
      f.rect(body[0] - 5, body[1] - 16, 10, 22, { c: 'c1', fill: 'c1', fo: 0.55 });
      for (const off of [0, -11]) f.line([[body[0] + 3, body[1] + off], [K[0], K[1] + off]], { c: 'c1', w: 4.5 });
      f.line([[K[0], K[1]], [K[0], K[1] - 11]], { c: 'c1', w: 4.5 }); f.line([[K[0], K[1] - 5], [px - 3.6, py - 2]], { c: 'c1', w: 4.5 });
      f.line([[px, py + 10], [ideal, -rmm(k - 1) + 1]], { c: 'hl', w: 5 });                                   // chain run from pulley to sprocket
      for (const s2 of [-1, 1]) f.rect(px + s2 * 3.6 - 0.6, py - 13, 1.2, 26, { c: 'c1', fill: 'c1', fo: 0.85, nostroke: true });
      f.rect(px - 1.1, py - 11, 2.2, 22, { c: 'ink', fill: 'ink', fo: 0.9, nostroke: true });
      if (el) { f.rect(body[0] - 8, body[1] - 34, 16, 16, { c: 'c3', fill: 'c3', fo: 0.6 }); f.text(body[0] - 9, body[1] - 42, T('motor and sensor', 'モーターとセンサー'), { small: true, anchor: 'start', c: 'c3' }); }
      else { f.line([[K[0], K[1]], [body[0] + 1, body[1] + 6], [body[0] - 2, 2]], { c: 'c4', w: 1.8 }); f.text(body[0] - 10, 8, T('cable to shifter', 'シフターへのケーブル'), { small: true, anchor: 'start', c: 'c4' }); }
      f.text(px + (px > 30 ? -8 : 8), py - 22, tx`\(${fmt(err, 2)}\ \mathrm{mm}\)`, { small: true, anchor: px > 30 ? 'end' : 'start', c: state === 0 ? 'c3' : 'c2' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the guide pulley sits from the centre of each sprocket: arriving by pulling cable (blue) and by releasing it (orange), which differ by the cable’s friction. Inside the green band shifting is quiet; beyond the dashed lines the chain starts to climb onto the neighbouring sprocket. ${el ? '' : 'Drag the gold point: it turns the barrel adjuster.'}`, tx`ガイドプーリーが各スプロケットの中心からどれだけずれているかを示します。ケーブルを引いて着いた場合（青）と、ゆるめて着いた場合（オレンジ）で、ケーブルの摩擦の分だけ違います。緑の帯の中なら変速は静かで、破線を越えるとチェーンが隣のスプロケットへ乗り上がり始めます。${el ? '' : '金色の点をドラッグすると、アジャスターが回ります。'}`));
      const g = L.fig(c2, { x: [0.5, 11.5], y: [-3, 3], aspect: 0.9, maxH: 460, xlabel: T('sprocket (1 = smallest)', 'スプロケット（1 が最小）'), ylabel: T('offset (mm)', 'ずれ（mm）'), ticksX: L.seq(11, (i) => [i + 1, String(i + 1)]) });
      g.rect(0.5, -SHIFT.quiet, 11, 2 * SHIFT.quiet, { c: 'c3', fill: 'c3', fo: 0.18, nostroke: true, layer: 'under' });
      for (const s of [-1, 1]) g.hline(s * SHIFT.limit, { c: 'c2', dash: '5 4' });
      const cy = (y) => clamp(y, -3, 3);
      g.line(L.seq(11, (i) => [i + 1, cy(shiftError(i + 1, { ...o, dir: 1 }))]), { c: 'c1', w: 2.2 }); g.line(L.seq(11, (i) => [i + 1, cy(shiftError(i + 1, { ...o, dir: -1 }))]), { c: 'c2', w: 2.2 });
      for (let i = 1; i <= 11; i++) { g.dot(i, cy(shiftError(i, { ...o, dir: 1 })), { c: 'c1', r: 3 }); g.dot(i, cy(shiftError(i, { ...o, dir: -1 })), { c: 'c2', r: 3 }); }
      if (el) g.dot(k, 0, { c: 'hl', r: 6 });
      else g.handle(k, cy(err), { c: 'hl', axis: 'y', bounds: [0.5, 11.5, -3, 3], label: T('barrel adjuster', 'アジャスター'), onDrag: (x, y) => ctx.set('adj', clamp(Math.round(((y + (k - 1) * SHIFT.pitch) / SHIFT.ratio - (k - 1) * v.pull + v.slack) * 20) / 20, 0, 2)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('arriving by pulling cable (to a larger sprocket)', 'ケーブルを引いて到着（大きいスプロケットへ）') }, { c: 'c2', label: T('arriving by releasing cable; selected sprocket', 'ケーブルをゆるめて到着、選択中のスプロケット') }, { c: 'c3', kind: 'fill', label: T('quiet running', '静かに回る範囲') }, { c: 'hl', label: T('chain', 'チェーン') }]);
      ctx.readout([
        { k: T('pulley position, sprocket position', 'プーリーの位置、スプロケットの位置'), v: tx`\(${fmt(pos, 2)},\ ${fmt(ideal, 2)}\ \mathrm{mm}\)` },
        { k: T('movement per click', '1 クリックあたりの動き'), v: el ? tx`\(${fmt(SHIFT.pitch, 2)}\ \mathrm{mm}\)` : tx`\(${fmt(SHIFT.ratio, 3)}\times${fmt(v.pull, 2)}=${fmt(SHIFT.ratio * v.pull, 2)}\ \mathrm{mm}\)`, tone: !el && Math.abs(SHIFT.ratio * v.pull - SHIFT.pitch) > 0.08 ? 'warn' : undefined },
        { k: T('offset in this gear', 'この段でのずれ'), v: tx`\(${fmt(err, 2)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('result', '結果'), v: [T('quiet, crisp shifts', '静かで歯切れのよい変速'), T('chain rubs and ticks, slow shifts', 'チェーンがこすれて音が出る、変速が遅い'), T('chain tries to jump to the next sprocket', 'チェーンが隣のスプロケットへ跳ぼうとする')][state], tone: ['good', 'warn', 'warn'][state] },
      ], el ? T('Electronic shifting replaces a force transmitted along a cable with a position commanded by a motor. The derailleur corrects itself after every shift, never needs the cable adjusted, and can shift under load or trim the front derailleur automatically, at the cost of a battery to charge.', '電動変速は、ケーブルで伝える力を、モーターが指令どおりに取る位置で置き換えます。ディレイラーは変速のたびに自分で位置を補正し、ケーブルの調整が要らず、負荷をかけたままの変速やフロントディレイラーの自動トリムもできます。その代わり、充電する電池が必要です。') : T('A slack cable shifts every gear by the same amount, which one turn of the barrel adjuster cures. A shifter whose pull does not match the sprocket spacing builds up an error from gear to gear that no adjustment can remove, which is why shifters, derailleurs and cassettes are sold as matched sets.', 'ケーブルがたるむと、どの段も同じ量だけずれます。これはアジャスターを回せば直ります。引き量がスプロケットの間隔に合わないシフターでは、段を追うごとに誤差が積み重なり、どう調整しても取り除けません。シフター、ディレイラー、カセットが組み合わせの決まったセットとして売られているのはそのためです。'));
    },
  };

  /* ================= 4. braking: load transfer, skid and pitch-over ================= */
  D['bicycle-braking'] = {
    render(ctx, v) {
      const B = braking(v.mu, v.lf, v.h, v.mode), vms = v.v / 3.6, dist = stopDistance(vms, B.a), cx = WB - v.lf;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A rider braking as hard as the chosen brake allows, moving to the right. The braking force acts at the road, below the centre of mass, so it pitches the bicycle forward and shifts load from the rear wheel to the front. Arrows are forces as fractions of the weight. Drag the gold centre of mass.`, tx`選んだブレーキで可能なかぎり強く制動している、右向きに進む乗り手です。制動力は重心より下の路面にはたらくので、自転車を前のめりにし、荷重を後輪から前輪へ移します。矢印は重さに対する力の割合です。金色の重心をドラッグしてください。`));
      const f = L.fig(c1, { x: [-0.55, 1.75], y: [-0.5, 1.75], equal: true, maxH: 440, axes: false, grid: false });
      f.hline(0, { c: 'muted', w: 2 }); sideBike(f, { w: WB, rider: true });
      const S1 = 0.55;
      f.arrow([cx, v.h], [cx, v.h - S1], { c: 'ink', w: 2.6 }); f.text(cx, v.h - S1, tx`\(mg\)`, { small: true, dx: -8, dy: 4, anchor: 'end' });
      f.arrow([cx, v.h], [cx + S1 * B.a, v.h], { c: 'c4', w: 2.6, dash: '5 3' }); f.text(cx + S1 * B.a, v.h, tx`\(ma\)`, { small: true, dx: 6, dy: -6, anchor: 'start', c: 'c4' });
      if (B.Nr > 0.01) { f.arrow([0, 0], [0, S1 * B.Nr], { c: 'c3', w: 2.6 }); } f.text(0, -0.14, tx`\(N_r=${fmt(B.Nr, 2)}\,mg\)`, { small: true, c: 'c3' });
      f.arrow([WB, 0], [WB, S1 * B.Nf], { c: 'c3', w: 2.6 }); f.text(WB, -0.14, tx`\(N_f=${fmt(B.Nf, 2)}\,mg\)`, { small: true, c: 'c3' });
      const Ff = v.mode === 1 ? 0 : v.mode === 0 ? B.a : Math.min(B.a, v.mu * B.Nf), Fr = B.a - Ff;
      if (Ff > 0.005) f.arrow([WB, -0.04], [WB - S1 * Ff, -0.04], { c: 'c2', w: 3 }); if (Fr > 0.005) f.arrow([0, -0.04], [-S1 * Fr, -0.04], { c: 'c2', w: 3 });
      f.text(WB / 2, -0.36, T(tx`braking force \(${fmt(B.a, 2)}\,mg\)`, tx`制動力 \(${fmt(B.a, 2)}\,mg\)`), { small: true, c: 'c2' });
      f.handle(cx, v.h, { c: 'hl', bounds: [WB - 0.85, WB - 0.4, 0.8, 1.35], label: T('centre of mass', '重心'), onDrag: (x, y) => { ctx.set('lf', clamp(Math.round((WB - x) * 100) / 100, 0.4, 0.85), true); ctx.set('h', clamp(Math.round(y * 100) / 100, 0.8, 1.35)); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Greatest deceleration, in units of \(g\), against the tyre’s grip \(\mu\) for each choice of brake. The front brake can use nearly all of the grip, until the rear wheel lifts at \(a=g\,\ell_f/h\) (dashed). The rear brake unloads its own wheel as it works. Drag the gold point to change the grip.`, tx`それぞれのブレーキについて、最大の減速度（\(g\) 単位）をタイヤのグリップ \(\mu\) に対して描いています。前ブレーキは、後輪が浮く \(a=g\,\ell_f/h\)（破線）まで、グリップのほぼすべてを使えます。後ブレーキは、効くほど自分の車輪の荷重を減らしてしまいます。金色の点をドラッグしてグリップを変えてください。`));
      const g = L.fig(c2, { x: [0.1, 1.1], y: [0, 1.0], aspect: 0.86, maxH: 440, xlabel: T(tx`grip \(\mu\)`, tx`グリップ \(\mu\)`), ylabel: tx`\(a/g\)` });
      g.hline(B.pitch, { c: 'ink', dash: '5 4' }); g.text(0.12, B.pitch, T('rear wheel lifts', '後輪が浮く'), { small: true, anchor: 'start', dy: -7 });
      [['c1', 0], ['c2', 1], ['c3', 2]].forEach(([c, m]) => g.line(L.sample(0.1, 1.1, 200, (x) => Math.min(1, braking(x, v.lf, v.h, m).a)), { c, w: m === v.mode ? 3 : 1.8, op: m === v.mode ? 1 : 0.75, dash: m === 2 ? '6 3' : null }));
      g.handle(v.mu, Math.min(1, B.a), { c: 'hl', axis: 'x', bounds: [0.1, 1.1, 0, 1], label: T('grip', 'グリップ'), onDrag: (x) => ctx.set('mu', clamp(Math.round(x * 50) / 50, 0.1, 1.1)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('front brake only', '前ブレーキだけ') }, { c: 'c2', label: T('rear brake only; braking force', '後ブレーキだけ、制動力') }, { c: 'c3', dash: true, label: T('both, shared ideally; normal forces', '両方を理想的に配分、垂直抗力') }, { c: 'c4', dash: true, label: T(tx`inertial force \(ma\)`, tx`慣性力 \(ma\)`) }]);
      ctx.readout([
        { k: T('deceleration', '減速度'), v: tx`\(${fmt(B.a, 3)}\,g=${fmt(B.a * G, 2)}\ \mathrm{m/s^2}\)`, tone: 'key' },
        { k: T('limited by', '制限するもの'), v: B.limit === 'pitch' ? T('pitching over the front wheel', '前輪を軸にした前転') : T('the tyre skidding', 'タイヤの滑り'), tone: B.limit === 'pitch' ? 'warn' : undefined },
        { k: T(tx`stopping distance from \(${fmt(v.v, 0)}\) km/h`, tx`\(${fmt(v.v, 0)}\) km/h からの停止距離`), v: tx`\(${fmt(dist, 1)}\ \mathrm{m}\)` },
        { k: T('load on the front wheel', '前輪にかかる荷重'), v: tx`\(${fmt(100 * B.Nf, 0)}\%\)` },
      ], T('On a dry road a bicycle is limited not by grip but by going over the handlebars, at about 0.6 g. That is why hard stops are made mostly with the front brake, with the rider’s weight pushed back and low; on a wet or loose surface the limit becomes the skid, and a locked front wheel cannot be steered.', '乾いた路面では、自転車の制動を制限するのはグリップではなく、およそ 0.6 g でハンドルを越えて前転することです。強い制動を主に前ブレーキで行い、乗り手が体重を後ろへ低く移すのはそのためです。濡れた路面や砂利の上では限界は滑りになり、ロックした前輪では舵が効きません。'));
    },
  };

  /* ================= 5. brake systems: cable rim brake and hydraulic disc (3D) ================= */
  const M_TOT = 80;
  D['bicycle-brake-systems'] = {
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
      const disc = v.type === 1, wet = v.wet === 1, D0 = BRK.rotors[v.rotor], R = brakeForce(v.type, v.F, wet, D0), po = braking(1.2, 0.62, 1.05, 0).pitch, limit = po * M_TOT * G;
      const dec = Math.min(R.tyre, limit) / (M_TOT * G), b = disc ? BRK.disc : BRK.rim;
      const stage = disc ? [v.F, v.F * b.lever * b.eff, R.pad, 2 * R.mu * R.pad, R.tyre] : [v.F, v.F * b.lever * b.eff, R.pad, 2 * R.mu * R.pad, R.tyre];
      L.setText(st.cap1, disc
        ? T(tx`A hydraulic disc brake. The lever pushes a 10 mm master piston; the trapped fluid carries the pressure down the hose to two 22 mm pistons that clamp the pads onto a steel rotor. The near half of the caliper is drawn translucent, and the pad clearance is exaggerated about eight times. Raise the hand force and watch the pads close.`, tx`油圧ディスクブレーキです。レバーが直径 10 mm のマスターピストンを押し、閉じ込められた作動油がホースを通して圧力を伝え、直径 22 mm の二つのピストンがパッドを鋼のローターに押し付けます。キャリパーの手前半分は半透明に描き、パッドのすき間は約 8 倍に誇張しています。手の力を上げて、パッドが閉じる様子を見てください。`)
        : T(tx`A cable rim brake. The lever pulls a steel cable through its housing; the cable draws the two arms of the caliper together about their pivot and presses rubber pads onto the sides of the aluminium rim. The pad clearance is exaggerated about twice. Raise the hand force and watch the pads close.`, tx`ワイヤー式のリムブレーキです。レバーが鋼のワイヤーをアウターの中で引き、ワイヤーがキャリパーの二本のアームを支点のまわりで引き寄せて、ゴムのパッドをアルミのリムの側面に押し付けます。パッドのすき間は約 2 倍に誇張しています。手の力を上げて、パッドが閉じる様子を見てください。`));
      L.setText(st.cap2, T(tx`Braking force at the tyre against the force of the hand, for both systems, dry (solid) and wet (dashed). Above the horizontal line the rear wheel would lift. Drag the gold point.`, tx`二つの方式について、手の力に対するタイヤでの制動力を、乾いた状態（実線）と濡れた状態（破線）で描いています。水平線より上では後輪が浮きます。金色の点をドラッグしてください。`));
      L.setText(st.cap3, T(tx`The force at each stage. Levers and pistons multiply it; friction passes on a fraction \(2\mu\) of the clamping force; and the small radius of the rim or rotor compared with the tyre gives some back.`, tx`各段階での力です。てこやピストンが力を増やし、摩擦は締め付け力の \(2\mu\) 倍を伝え、タイヤに比べて小さいリムやローターの半径が、その一部を打ち消します。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 150], y: [0, 900], aspect: 0.6, maxH: 260, xlabel: T('hand force (N)', '手の力（N）'), ylabel: T('force at the tyre (N)', 'タイヤでの力（N）') });
      f.hline(limit, { c: 'ink', dash: '5 4' }); f.text(148, limit, T('rear wheel lifts', '後輪が浮く'), { small: true, anchor: 'end', dy: -7 });
      for (const [ty, w2, c] of [[0, false, 'c1'], [0, true, 'c1'], [1, false, 'c2'], [1, true, 'c2']]) f.line([[0, 0], [150, Math.min(900, brakeForce(ty, 150, w2, D0).tyre)]].map(([x, y], i) => (i ? [x * Math.min(1, 900 / brakeForce(ty, 150, w2, D0).tyre), y] : [x, y])), { c, w: ty === v.type && w2 === wet ? 3 : 1.7, dash: w2 ? '5 4' : null });
      f.handle(v.F, Math.min(900, R.tyre), { c: 'hl', axis: 'x', bounds: [0, 150, 0, 900], label: T('hand force', '手の力'), onDrag: (x) => ctx.set('F', clamp(Math.round(x / 2) * 2, 0, 150)) });
      const top = Math.max(100, ...stage) * 1.18, g = L.fig(st.g3, { x: [0, 5], y: [0, top], aspect: 0.55, maxH: 240, ylabel: T('force (N)', '力（N）'), ticksX: [[0.5, T('hand', '手')], [1.5, disc ? T('piston', 'ピストン') : T('cable', 'ワイヤー')], [2.5, T('each pad', 'パッド 1 枚')], [3.5, T('friction', '摩擦')], [4.5, T('tyre', 'タイヤ')]] });
      stage.forEach((s, i) => { g.rect(i + 0.18, 0, 0.64, s, { c: ['c4', 'c1', 'c1', 'c2', 'c3'][i], fill: ['c4', 'c1', 'c1', 'c2', 'c3'][i], fo: 0.6 }); g.text(i + 0.5, s, fmt(s, 0), { small: true, dy: -6 }); });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('cable rim brake', 'ワイヤー式リムブレーキ') }, { c: 'c2', label: T('hydraulic disc brake', '油圧ディスクブレーキ') }, { c: 'muted', dash: true, label: T('wet', '濡れた状態') }]);
      const travel = 20 / (disc ? b.lever * (b.dSlave / b.dMaster) ** 2 : b.lever * b.caliper), E40 = 0.5 * M_TOT * (40 / 3.6) ** 2;
      ctx.readout([
        { k: T('pad force per newton at the lever', 'レバーでの 1 N あたりのパッドの力'), v: tx`\(${fmt(R.ma, 1)}\)` },
        { k: disc ? T('pressure in the hose', 'ホース内の圧力') : T('cable tension', 'ワイヤーの張力'), v: disc ? tx`\(${fmt(R.pressure / 1e5, 0)}\ \mathrm{bar}\)` : tx`\(${fmt(stage[1], 0)}\ \mathrm{N}\)` },
        { k: T('braking force at the tyre, deceleration of 80 kg', 'タイヤでの制動力、80 kg の減速度'), v: tx`\(${fmt(R.tyre, 0)}\ \mathrm{N},\ ${fmt(dec, 2)}\,g\)`, tone: R.tyre > limit ? 'warn' : 'key' },
        { k: T('pad movement for 20 mm at the finger', '指先が 20 mm 動くときのパッドの動き'), v: tx`\(${fmt(travel, 2)}\ \mathrm{mm}\)` },
        { k: T('one stop from 40 km/h heats the braking surface by', '40 km/h から 1 回止まるときの制動面の温度上昇'), v: disc ? tx`\(${fmt(E40 / (0.13 * 460), 0)}\ \mathrm{K}\)` : tx`\(${fmt(E40 / (0.45 * 900), 0)}\ \mathrm{K}\)` },
      ], disc ? T('Multiplying the force thirty times divides the movement by the same factor, so the pads sit a third of a millimetre from the rotor and the pistons must creep forward as the pads wear, which the seals do by themselves. Fluid does not stretch or drag as a cable does, and a rotor is out of the road spray, so the brake feels the same in the rain.', '力を 30 倍にすると、動きは同じ倍率で小さくなります。そのためパッドはローターから 3 分の 1 ミリメートルのところにあり、パッドが減るにつれてピストンは少しずつ前へ出なければなりませんが、これはシールが自動で行います。作動油はワイヤーのように伸びたりこすれたりせず、ローターは路面の水しぶきから離れているので、雨の中でも効きが変わりません。') : T('A rim brake uses the wheel’s own rim as a very large disc, so it needs little clamping force and a light caliper. Its weaknesses are the cable, which stretches and drags in its housing, and water: a wet aluminium rim loses more than half its friction, and the heat of a long descent goes into the rim and the tyre it holds.', 'リムブレーキは、車輪自身のリムをとても大きなディスクとして使うので、締め付け力が小さくて済み、キャリパーも軽くできます。弱点は、伸びたりアウターの中でこすれたりするワイヤーと、水です。濡れたアルミのリムは摩擦の半分以上を失い、長い下りの熱はリムと、そこにはまっているタイヤに入ります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.78, maxH: 540, camera: [2.25, 1.7, 0.95], target: [0.9, 0.0, 0.5], fov: 30,
        label: T('3D front brake of a bicycle. Drag to rotate.', '自転車の前ブレーキ（3D）。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.bkey = null; st.spin = 0; buildGround(S);
          S.animate((dt) => { if (S.reduced() || !st.bike) return false; st.spin += Math.min(dt, 0.05) * 9 * st.free; st.bike.frontW.rotation.y = st.spin; st.bike.rearW.rotation.y = st.spin; S.invalidate(); return true; });
        },
        update(S) {
          const bkey = v.type + ':' + v.rotor;
          if (st.bkey !== bkey) {
            st.bike?.dispose(); S.clearLabels?.(); st.bike = buildBike(S, { brake: disc ? 'disc' : 'rim', rotor: D0 }); st.bkey = bkey; st.bike.pose({ delta: -0.12 });
            S.label(T('lever', 'レバー'), [1.2, 0.3, 1.06], { small: true }); S.label(disc ? T('hose', 'ホース') : T('cable', 'ワイヤー'), [0.98, 0.16, 0.86], { small: true });
            S.label(disc ? T('caliper and pads', 'キャリパーとパッド') : T('caliper and pads', 'キャリパーとパッド'), disc ? [0.9, 0.16, 0.42] : [0.93, 0.14, 0.76], { small: true }); S.label(disc ? T('rotor', 'ローター') : T('rim', 'リム'), disc ? [1.02, 0.12, 0.25] : [1.2, 0.08, 0.6], { small: true });
          }
          st.free = Math.max(0, 1 - R.tyre / limit);
          st.bike.squeeze(clamp(v.F / 12, 0, 1)); st.bike.blade.rotation.y = 0.1 * clamp(v.F / 12, 0, 1) + 0.25 * (v.F / 150);
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [0.3, 1.6], y: [-0.1, 1.2], equal: true, maxH: 380, axes: false, grid: false });
          f2.hline(0, { c: 'muted', w: 2 }); sideBike(f2, {});
          if (disc) f2.circle(WBD, RW, D0 / 2, { c: 'c2', w: 3 }); else f2.circle(WBD, RW, 0.311, { c: 'c2', w: 3 });
        },
      });
    },
  };
})();
