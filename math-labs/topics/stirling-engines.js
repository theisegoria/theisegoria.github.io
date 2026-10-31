'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {});
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Schmidt (isothermal) analysis of an alpha engine, after Urieli & Berchowitz, Stirling Cycle Engine Analysis (1984),
   * chapter 3: compression space at the cooler temperature Tk, expansion space at the heater temperature Th, dead volumes
   * Vk (cooler), Vr (regenerator, linear temperature profile, effective temperature Tr = (Th - Tk)/ln(Th/Tk)) and Vh (heater),
   *   Vc = Vclc + Vswc (1 + cos t)/2,  Ve = Vcle + Vswe (1 + cos(t + a))/2,
   *   p = M R / (Vc/Tk + Vk/Tk + Vr/Tr + Vh/Th + Ve/Th) = M R / (s (1 + b cos(t + beta))).
   * The cyclic integrals of p dVc and p dVe have closed forms; isothermal spaces make Qc = Wc and Qe = We, so W/Qe = 1 - Tk/Th.
   * Ideal Stirling cycle: two isotherms and two isochores; with a regenerator of effectiveness eps the heater must also
   * supply (1 - eps) cv (Th - Tk) per unit mass.
   */
  function schmidt(o) {
    const { Vswc, Vswe, Vclc = 0, Vcle = 0, Vk = 0, Vr = 0, Vh = 0, Tk, Th, pmean = 1 } = o, a = o.alpha;
    const Tr = Math.abs(Th - Tk) < 1e-9 ? Tk : (Th - Tk) / Math.log(Th / Tk);
    const s = (Vswc / 2 + Vclc + Vk) / Tk + Vr / Tr + (Vswe / 2 + Vcle + Vh) / Th;
    const cx = Vswc / (2 * Tk) + (Vswe * Math.cos(a)) / (2 * Th), sy = (Vswe * Math.sin(a)) / (2 * Th);
    const c = Math.hypot(cx, sy), beta = Math.atan2(sy, cx), b = c / s, rb = Math.sqrt(1 - b * b);
    const MR = pmean * s * rb;                                 // mass times gas constant, fixed by the mean pressure
    const k = b > 1e-12 ? (PI * MR * (rb - 1)) / (s * b * rb) : 0;
    const Wc = Vswc * k * Math.sin(beta), We = Vswe * k * Math.sin(beta - a);
    const Vc = (t) => Vclc + (Vswc * (1 + Math.cos(t))) / 2, Ve = (t) => Vcle + (Vswe * (1 + Math.cos(t + a))) / 2;
    const p = (t) => MR / (s * (1 + b * Math.cos(t + beta)));
    // mass in each space as a fraction of the charge: m_j / M = p V_j / (M R T_j)
    const masses = (t) => { const pp = p(t) / MR; return { c: (pp * Vc(t)) / Tk, k: (pp * Vk) / Tk, r: (pp * Vr) / Tr, h: (pp * Vh) / Th, e: (pp * Ve(t)) / Th }; };
    const Vdead = Vclc + Vcle + Vk + Vr + Vh, Vt = (t) => Vc(t) + Ve(t) + Vk + Vr + Vh;
    const amp = 0.5 * Math.hypot(Vswc + Vswe * Math.cos(a), Vswe * Math.sin(a));
    const Vmid = Vdead + (Vswc + Vswe) / 2, Vmin = Vmid - amp, Vmax = Vmid + amp;
    return { Tr, s, b, beta, MR, Wc, We, W: Wc + We, Qe: We, Qc: Wc, eta: We > 0 ? (Wc + We) / We : 0, Vc, Ve, Vt, p, masses, pmin: MR / (s * (1 + b)), pmax: MR / (s * (1 - b)), Vmin, Vmax, Vdead, o };
  }
  // the ideal Stirling cycle with the same charge between the same volume limits (perfect regenerator)
  const idealStirling = (MR, Tk, Th, Vmin, Vmax) => ({ W: MR * (Th - Tk) * Math.log(Vmax / Vmin), Q: MR * Th * Math.log(Vmax / Vmin), eta: 1 - Tk / Th });
  // numeric loop integral of p dV for any of the volume functions, midpoint rule in crank angle
  function loopWork(E, which = 'total', n = 4000) {
    const V = which === 'c' ? E.Vc : which === 'e' ? E.Ve : E.Vt; let W = 0;
    for (let i = 0; i < n; i++) { const t0 = (TAU * i) / n, t1 = (TAU * (i + 1)) / n; W += E.p((t0 + t1) / 2) * (V(t1) - V(t0)); }
    return W;
  }

  // a small laboratory alpha engine: 60 mm bore, 40 mm stroke in both cylinders, helium at 10 bar mean
  const BORE = 0.06, STROKE = 0.04, VSW = (PI * BORE * BORE * STROKE) / 4, PMEAN = 1e6;
  const ENG = { Vclc: 0.1 * VSW, Vcle: 0.1 * VSW, Vk: 0.15 * VSW, Vr: 0.3 * VSW, Vh: 0.15 * VSW };
  const engine = (alphaDeg, Th, Tk) => schmidt({ Vswc: VSW, Vswe: VSW, ...ENG, Tk, Th, alpha: alphaDeg * DEG, pmean: PMEAN });

  // design map: expansion swept volume 1, compression swept volume kappa, dead volume X split 1:2:1 over cooler,
  // regenerator and heater; work normalised by the reference pressure times the total swept volume
  function workMap(alphaDeg, kap, X, tau, norm = 0) {
    const E = schmidt({ Vswc: kap, Vswe: 1, Vk: X / 4, Vr: X / 2, Vh: X / 4, Tk: 1, Th: 1 / tau, alpha: alphaDeg * DEG, pmean: 1 });
    return E.W / ((norm ? E.pmax : 1) * (1 + kap));
  }
  function optimum(X, tau, norm = 0, kap = null) {
    let best = { W: -Infinity, alpha: 0, kap: 1 };
    const scan = (a0, a1, da, l0, l1, dl) => { for (let a = a0; a <= a1 + 1e-9; a += da) for (let l = l0; l <= l1 + 1e-9; l += dl) { const k = kap ?? 2 ** l, w = workMap(a, k, X, tau, norm); if (w > best.W) best = { W: w, alpha: a, kap: k }; } };
    if (kap === null) { scan(0, 180, 2, -2, 2, 0.05); const a = best.alpha, l = Math.log2(best.kap); scan(Math.max(0, a - 2), Math.min(180, a + 2), 0.05, l - 0.05, l + 0.05, 0.002); }
    else { scan(0, 180, 1, 0, 0, 1); const a = best.alpha; scan(Math.max(0, a - 1), Math.min(180, a + 1), 0.01, 0, 0, 1); }
    return best;
  }

  // the ideal Stirling cycle per unit mass with a regenerator of effectiveness eps; gas constant R, ratio of heats gamma
  const GASES = [{ R: 2077, g: 5 / 3, en: 'helium', ja: 'ヘリウム' }, { R: 4124, g: 1.405, en: 'hydrogen', ja: '水素' }, { R: 287, g: 1.4, en: 'air', ja: '空気' }];
  function regen(eps, Th, Tk, r, gas = GASES[0]) {
    const cv = gas.R / (gas.g - 1), lr = Math.log(r);
    const W = gas.R * (Th - Tk) * lr, Qiso = gas.R * Th * lr, Qreg = cv * (Th - Tk), Qextra = (1 - eps) * Qreg, Qin = Qiso + Qextra;
    const d = ((1 - eps) * (Th - Tk)) / 2;                      // gas-matrix temperature difference for linear profiles
    return { W, Qiso, Qreg, Qextra, Qin, eta: W / Qin, carnot: 1 - Tk / Th, NTU: eps < 1 ? eps / (1 - eps) : Infinity, d, Tout: Tk + eps * (Th - Tk), cv, lr };
  }
  const etaRegen = (eps, Th, Tk, r, g) => ((Th - Tk) * Math.log(r)) / (Th * Math.log(r) + ((1 - eps) * (Th - Tk)) / (g - 1));

  const M = { schmidt, idealStirling, loopWork, engine, workMap, optimum, regen, etaRegen, GASES, VSW, PMEAN, ENG };
  (window.LabModels = window.LabModels || {})['stirling-engines'] = M;

  /* ---------------- shared drawing helpers ---------------- */
  const TLO = 280, THI = 1200;
  const tFrac = (Tk) => clamp((Tk - TLO) / (THI - TLO), 0, 1);
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const tcol2 = (Tk) => { const c = L.colours(), t = tFrac(Tk); return t < 0.5 ? mix3(c.neg, c.c4, t * 2) : mix3(c.c4, c.pos, (t - 0.5) * 2); };
  const css = (rgb) => `rgb(${rgb.map((x) => Math.round(x)).join(',')})`;
  const tcol3 = (S, Tk) => { const t = tFrac(Tk); return t < 0.5 ? S.colour('neg').clone().lerp(S.colour('c4'), t * 2) : S.colour('c4').clone().lerp(S.colour('pos'), (t - 0.5) * 2); };
  const hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const METAL = { metal: 0.72, rough: 0.3, coat: 0.55 };
  const settle = (S) => { let k = 0; const tick = () => { S.invalidate(); if (++k < 24) setTimeout(tick, 250); }; tick(); };

  /* ================= 1. the alpha engine running ================= */
  const R1 = 1, ROD = 3.6, PIN0 = 0.4, CROWN = 0.9, HEAD = ROD + R1 + CROWN + 0.25;  // crank radius 1; head face on the axis
  const S45 = Math.SQRT1_2, AX_C = [S45, 0, S45], AX_H = [-S45, 0, S45], Y_C = 0.34, Y_H = -0.34;
  const pinS = (phi, ax) => { const d = [Math.sin(phi), 0, Math.cos(phi)], along = d[0] * ax[0] + d[2] * ax[2], perp = d[0] * ax[2] - d[2] * ax[0]; return along * R1 + Math.sqrt(ROD * ROD - perp * perp * R1 * R1); };
  // crank throw angles about +Y (0 = pin straight up) for crank angle t of the model: the cold piston is at bottom dead
  // centre at t = 0, the hot one at bottom dead centre when t + alpha = 0
  const phiC = (t) => t - 135 * DEG, phiE = (t, a) => t + a - 225 * DEG;
  const addv = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k, p[2] + q[2] * k];

  function buildEngine(S, st) {
    const TH = S.THREE, P = (st.parts = {});
    const quatZ = (obj, dir) => obj.quaternion.setFromUnitVectors(new TH.Vector3(0, 0, 1), new TH.Vector3(...dir).normalize());
    const cyl = (r, h, n = 56, open = false) => new TH.CylinderGeometry(r, r, h, n, 1, open).rotateX(PI / 2);
    // crankshaft along Y, two throws (cold at +Y, hot at -Y) and a spoked flywheel at the back
    const shaftMat = S.mat('muted', METAL);
    const shaft = new TH.Mesh(new TH.CylinderGeometry(0.34, 0.34, 4.6, 32), shaftMat); shaft.position.y = 0.55; S.add(shaft);
    const webShape = () => { const pts = []; for (let i = 0; i <= 16; i++) { const t = (i / 16) * PI; pts.push(new TH.Vector2(0.42 * Math.cos(t), 1 + 0.42 * Math.sin(t))); } for (let i = 0; i <= 22; i++) { const t = (200 + (140 * i) / 22) * DEG; pts.push(new TH.Vector2(1.1 * Math.cos(t), 1.1 * Math.sin(t))); } const g = new TH.ExtrudeGeometry(new TH.Shape(pts), { depth: 0.2, bevelEnabled: false }); g.translate(0, 0, -0.1); g.rotateX(PI / 2); g.rotateY(0); return g; };
    const web = webShape();
    const throwG = (y, col) => { const g = new TH.Group(), m = S.mat(col, METAL); for (const dy of [-0.3, 0.3]) { const w = new TH.Mesh(web, m); w.position.y = dy; g.add(w); } const pin = new TH.Mesh(new TH.CylinderGeometry(0.26, 0.26, 0.62, 28), S.mat('ink', METAL)); pin.position.set(0, 0, 1); g.add(pin); g.position.y = y; S.add(g); return g; };
    P.thC = throwG(Y_C, 'c4'); P.thE = throwG(Y_H, 'c4');
    const fw = new TH.Group(); fw.position.y = 2.45; S.add(fw);
    const fwMat = S.mat('ink', { metal: 0.8, rough: 0.28, coat: 0.6 });
    const rim = new TH.Mesh(new TH.TorusGeometry(2.35, 0.22, 18, 96), fwMat); rim.rotation.x = PI / 2; fw.add(rim);
    const rim2 = new TH.Mesh(new TH.CylinderGeometry(2.42, 2.42, 0.36, 96, 1, true), fwMat); fw.add(rim2);
    const hub = new TH.Mesh(new TH.CylinderGeometry(0.55, 0.55, 0.5, 32), fwMat); fw.add(hub);
    for (let i = 0; i < 6; i++) { const sp = new TH.Mesh(new TH.BoxGeometry(0.22, 0.14, 1.85), fwMat); const a = (i * PI) / 3; sp.position.set(1.3 * Math.sin(a), 0, 1.3 * Math.cos(a)); sp.rotation.y = a; fw.add(sp); }
    P.fw = fw;
    // bearing pedestals and a base plate
    const baseMat = S.mat('muted', { metal: 0.35, rough: 0.5, coat: 0.3 });
    for (const y of [-0.95, 1.6]) { const ped = new TH.Mesh(new TH.BoxGeometry(0.9, 0.42, 2.0), baseMat); ped.position.set(0, y, -1.15); S.add(ped); const cap = new TH.Mesh(new TH.TorusGeometry(0.42, 0.12, 12, 32), baseMat); cap.rotation.x = PI / 2; cap.position.set(0, y, 0); S.add(cap); }
    const base = new TH.Mesh(new TH.BoxGeometry(5.6, 4.8, 0.3), baseMat); base.position.set(0, 0.5, -2.3); S.add(base);
    // cylinders: a transparent liner, the head (finned on the cold side, a glowing heater dome on the hot side), the gas
    // column between crown and head, the piston and its rod
    const mkCyl = (ax, y, hot) => {
      const g = new TH.Group(); g.position.y = y; quatZ(g, ax); S.add(g);
      const z0 = ROD - R1 - 0.3, liner = new TH.Mesh(cyl(1.2, HEAD - z0, 72, true), S.mat('muted', { opacity: 0.16, rough: 0.12, coat: 1 }));
      liner.position.z = (z0 + HEAD) / 2; liner.userData.noOcclude = true; liner.castShadow = false; g.add(liner);
      const ringM = S.mat('muted', METAL);
      const r0 = new TH.Mesh(new TH.TorusGeometry(1.21, 0.05, 10, 72), ringM); r0.position.z = z0; g.add(r0);
      if (hot) {
        const head = new TH.Mesh(cyl(1.32, 0.42), S.mat('pos', { metal: 0.45, rough: 0.35, glow: 0.55 })); head.position.z = HEAD + 0.21; g.add(head);
        const dome = new TH.Mesh(new TH.SphereGeometry(1.32, 48, 20, 0, TAU, 0, PI / 2).rotateX(PI / 2), S.mat('pos', { metal: 0.45, rough: 0.35, glow: 0.65 })); dome.scale.z = 0.42; dome.position.z = HEAD + 0.42; g.add(dome);
        for (let i = 0; i < 4; i++) { const coil = new TH.Mesh(new TH.TorusGeometry(1.36, 0.06, 10, 72), S.mat('hl', { glow: 0.9, metal: 0.3 })); coil.position.z = HEAD + 0.06 + i * 0.11; g.add(coil); }
      } else {
        const head = new TH.Mesh(cyl(1.3, 0.8), S.mat('muted', METAL)); head.position.z = HEAD + 0.4; g.add(head);
        for (let i = 0; i < 6; i++) { const fin = new TH.Mesh(cyl(1.95, 0.06, 64), S.mat('c1', { metal: 0.75, rough: 0.28, coat: 0.5 })); fin.position.z = HEAD - 1.0 + i * 0.3; g.add(fin); }
      }
      const gas = new TH.Mesh(cyl(1.15, 1, 56), S.mat('pos', { opacity: 0.62, rough: 0.5, coat: 0.2, glow: 0.25 })); gas.castShadow = false; gas.renderOrder = 2; gas.userData.noOcclude = true; g.add(gas);
      const piston = new TH.Group(), pm = S.mat(hot ? 'muted' : 'c3', { metal: 0.6, rough: 0.34, coat: 0.6 });
      const body = new TH.Mesh(cyl(1.15, CROWN + PIN0), pm); body.position.z = (CROWN - PIN0) / 2; piston.add(body);
      for (const z of [CROWN - 0.18, CROWN - 0.34]) { const ring = new TH.Mesh(new TH.TorusGeometry(1.15, 0.025, 8, 64), S.mat('ink', METAL)); ring.position.z = z; piston.add(ring); }
      if (hot) { const cap = new TH.Mesh(cyl(1.12, 0.12), S.mat('pos', { metal: 0.4, rough: 0.4, glow: 0.2 })); cap.position.z = CROWN - 0.06; piston.add(cap); }
      g.add(piston);
      const rod = new TH.Group(), rm = S.mat('c1', METAL);
      const sh = new TH.Mesh(new TH.BoxGeometry(0.2, 0.28, ROD - 0.8), rm); sh.position.z = ROD / 2; rod.add(sh);
      for (const [z, rr, tt] of [[0, 0.38, 0.11], [ROD, 0.24, 0.08]]) { const eye = new TH.Mesh(new TH.TorusGeometry(rr, tt, 12, 36).rotateX(PI / 2), rm); eye.position.z = z; rod.add(eye); }
      S.add(rod);
      return { g, gas, piston, rod, ax, y };
    };
    P.cc = mkCyl(AX_C, Y_C, false); P.ce = mkCyl(AX_H, Y_H, true);
    // the gas path between the heads: cooler, regenerator and heater
    const Hc = addv([0, Y_C, 0], AX_C, HEAD + 0.8), Hh = addv([0, Y_H, 0], AX_H, HEAD + 0.6);
    const ZT = 6.7, RX = 1.55;
    const curve = (pts) => new TH.CatmullRomCurve3(pts.map((q) => new TH.Vector3(...q)), false, 'centripetal');
    const cool = curve([Hc, addv(Hc, AX_C, 0.5), [2.75, 0.17, ZT - 0.15], [RX, 0, ZT]]);
    const heat = curve([[-RX, 0, ZT], [-2.75, -0.17, ZT - 0.15], addv(Hh, AX_H, 0.5), Hh]);
    const reg = new TH.LineCurve3(new TH.Vector3(RX, 0, ZT), new TH.Vector3(-RX, 0, ZT));
    P.paths = [cool, reg, heat].map((cv) => { const n = 80, pts = cv.getSpacedPoints(n).map((q) => [q.x, q.y, q.z]); return pts; });
    const tubeMat = (col, o) => S.mat(col, o);
    const coolTube = new TH.Mesh(new TH.TubeGeometry(cool, 80, 0.26, 16), tubeMat('muted', { opacity: 0.3, rough: 0.15, coat: 1 })); coolTube.castShadow = false; coolTube.userData.noOcclude = true; S.add(coolTube);
    const heatTube = new TH.Mesh(new TH.TubeGeometry(heat, 80, 0.26, 16), tubeMat('pos', { opacity: 0.32, rough: 0.2, coat: 0.6, glow: 0.35 })); heatTube.castShadow = false; heatTube.userData.noOcclude = true; S.add(heatTube);
    for (let i = 0; i < 9; i++) { const u = 0.08 + i * 0.065, p = cool.getPointAt(u), t = cool.getTangentAt(u), fin = new TH.Mesh(new TH.CylinderGeometry(0.52, 0.52, 0.04, 36), S.mat('c1', { metal: 0.75, rough: 0.28 })); fin.position.copy(p); fin.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), t); S.add(fin); }
    for (let i = 0; i < 7; i++) { const u = 0.3 + i * 0.08, p = heat.getPointAt(u), t = heat.getTangentAt(u), coil = new TH.Mesh(new TH.TorusGeometry(0.33, 0.045, 8, 32), S.mat('hl', { glow: 0.9, metal: 0.3 })); coil.position.copy(p); coil.quaternion.setFromUnitVectors(new TH.Vector3(0, 0, 1), t); S.add(coil); }
    const can = new TH.Mesh(new TH.CylinderGeometry(0.58, 0.58, 2 * RX, 48, 1, true).rotateZ(PI / 2), S.mat('muted', { opacity: 0.22, rough: 0.12, coat: 1 })); can.position.set(0, 0, ZT); can.castShadow = false; can.userData.noOcclude = true; S.add(can);
    for (const x of [RX, -RX]) { const fl = new TH.Mesh(new TH.TorusGeometry(0.6, 0.07, 10, 48).rotateY(PI / 2), S.mat('muted', METAL)); fl.position.set(x, 0, ZT); S.add(fl); }
    P.screens = []; const NSC = 14;
    for (let i = 0; i < NSC; i++) { const x = RX - (2 * RX * (i + 0.5)) / NSC, m = new TH.Mesh(new TH.CylinderGeometry(0.55, 0.55, 0.05, 36).rotateZ(PI / 2), S.mat('c4', { metal: 0.5, rough: 0.45, coat: 0.3 })); m.position.set(x, 0, ZT); m.userData.f = (i + 0.5) / NSC; S.add(m); P.screens.push(m); }
    // the working gas as Lagrangian parcels: parcel i always carries the same slice of the charge, numbered from the cold
    // piston crown to the hot piston crown, so the cloud shows where the gas actually is
    P.NP = 170;
    P.lat = L.seq(P.NP, (i) => [Math.sqrt(hash(i, 1)) * 0.92, hash(i, 2) * TAU]);
    P.gasPts = S.points(L.seq(P.NP, () => [0, 0, 0]), { colours: L.seq(P.NP, () => S.colour('c1')), r: 0.075, max: P.NP, rough: 0.3, coat: 0.4, glow: 0.35 });
    P.gasPts.castShadow = false;
    P.hdl = S.handle([0, 2.95, 2], { r: 0.22, c: 'hl', plane: [[0, 1, 0], [0, 2.95, 0]], onDrag: (q) => { const a = Math.atan2(q.x, q.z); const t = ((Math.round((a + 135 * DEG) / DEG) % 360) + 360) % 360; st.anim?.pause(); st.ctx.set('th', t); const ph = phiC(t * DEG); return [2.35 * Math.sin(ph), 2.95, 2.35 * Math.cos(ph)]; } });
    S.label(T('hot cylinder: expansion space', '高温シリンダ：膨張空間'), addv(addv([0, Y_H, 0], AX_H, HEAD + 0.2), [-1, 0, 0], 1.45), { small: true, align: 'end' });
    S.label(T('cold cylinder: compression space', '低温シリンダ：圧縮空間'), addv(addv([0, Y_C, 0], AX_C, HEAD - 0.6), [1, 0, 0], 2.0), { small: true });
    S.label(T('regenerator', '再生器'), [0, 0, ZT + 0.75], { small: true, align: 'middle' });
    S.label(T('heater', '加熱器'), [-2.95, 0, ZT + 0.3], { small: true, align: 'end', c: 'pos' });
    S.label(T('cooler', '冷却器'), [2.95, 0, ZT + 0.3], { small: true, c: 'neg' });
    S.label(T('flywheel', 'フライホイール'), [2.5, 2.45, -1.6], { small: true });
  }
  // place a parcel at fraction f along a sampled path, offset sideways by its own lateral position
  const along = (pts, f, lat, rad) => {
    const n = pts.length - 1, s = clamp(f, 0, 1) * n, i = Math.min(n - 1, Math.floor(s)), u = s - i, a = pts[i], b = pts[i + 1];
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(...t) || 1, e2 = [-t[2] / tl, 0, t[0] / tl];
    const r = lat[0] * rad, c = Math.cos(lat[1]) * r, d = Math.sin(lat[1]) * r;
    return [a[0] + t[0] * u + e2[0] * c, a[1] + t[1] * u + d, a[2] + t[2] * u + e2[2] * c];
  };

  D['stirling-alpha-engine'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame); st.leg = L.h('div', '', st.frame);
      }
      const al = v.alpha * DEG, Th = v.Th, Tk = v.Tc, E = engine(v.alpha, Th, Tk), I = idealStirling(E.MR, Tk, Th, E.Vmin, E.Vmax);
      st.th0 = v.th * DEG;
      st.cap1.textContent = T('An alpha Stirling engine: two cylinders at 90° on one crankshaft, joined through the cooler, the regenerator and the heater. Each dot is the same small slice of the helium charge all cycle, coloured by its temperature, so the cloud shows the gas being pushed from the cold space to the hot one and back. Drag the gold knob on the flywheel to turn the engine.', 'アルファ型スターリングエンジンです。90° に開いた二つのシリンダが一本のクランク軸につながり、冷却器、再生器、加熱器を通して結ばれています。点の一つ一つはサイクルを通じてヘリウムの充てんガスの同じ小さな一部分で、温度で色分けしています。点の群れを見ると、ガスが低温空間から高温空間へ押しやられ、また戻ってくるのが分かります。フライホイールの金色のつまみをドラッグしてエンジンを回してください。');
      st.cap2.textContent = T('Pressure against total gas volume. The shaded loop is the Schmidt analysis of this engine, traversed clockwise; its area is the work per cycle. The dashed outline is the ideal Stirling cycle for the same charge between the same volumes: two isotherms and two isochores.', '全ガス体積に対する圧力です。塗った閉曲線がこのエンジンのシュミット解析で、時計回りにたどり、その面積が一サイクルの仕事です。破線は、同じ充てん量、同じ体積の範囲での理想スターリングサイクルで、二本の等温線と二本の等積線からできています。');
      st.cap3.textContent = T('Where the gas is, as a share of the charge, through one turn of the crank. The hot space fills while the volume is large, so the gas expands hot; it is pushed to the cold side before the squeeze, so it is compressed cold. Drag the gold point to turn the crank.', 'クランク一回転を通じて、ガスがどこにあるかを充てん量に対する割合で示します。高温空間は体積が大きいときに満たされるので、ガスは熱いまま膨張します。圧縮の前には低温側へ押しやられるので、冷たいまま圧縮されます。金色の点をドラッグしてクランクを回してください。');
      // ---- p-V diagram
      const cm3 = 1e6, bar = 1e-5, N = 360;
      const loop = L.seq(N + 1, (i) => { const t = (TAU * i) / N; return [E.Vt(t) * cm3, E.p(t) * bar]; });
      const isoH = L.sample(E.Vmin, E.Vmax, 60, (V) => [V * cm3, (E.MR * Th) / V * bar]), isoK = L.sample(E.Vmin, E.Vmax, 60, (V) => [V * cm3, (E.MR * Tk) / V * bar]);
      const ideal = [...isoH, ...isoK.slice().reverse(), isoH[0]];
      const ymax = Math.max(...isoH.map((q) => q[1])) * 1.06, ymin = Math.min(...isoK.map((q) => q[1])) * 0.9;
      st.g2.replaceChildren(); st.g3.replaceChildren(); st.leg.replaceChildren();
      const g = L.fig(st.g2, { x: [E.Vmin * cm3 * 0.95, E.Vmax * cm3 * 1.03], y: [Math.max(0, ymin), ymax], aspect: 0.62, maxH: 290, xlabel: T('total gas volume V (cm³)', '全ガス体積 V（cm³）'), ylabel: T('p (bar)', 'p（bar）') });
      g.line(ideal, { c: 'muted', w: 1.6, dash: '6 4' });
      g.poly(loop, { c: 'c1', w: 2.6, fill: 'c1', fo: 0.22 });
      const iK = Math.round(N * 0.12); g.arrow(loop[iK], loop[iK + 6], { c: 'c1', w: 2.4 });
      g.text(isoH[8][0], isoH[8][1], T(`isotherm ${Th} K`, `等温線 ${Th} K`), { small: true, c: 'pos', dx: 6, dy: -4 });
      g.text(isoK[50][0], isoK[50][1], T(`isotherm ${Tk} K`, `等温線 ${Tk} K`), { small: true, c: 'neg', dy: 14, anchor: 'end' });
      // ---- where the gas is
      const sh = L.seq(N + 1, (i) => { const t = (TAU * i) / N, m = E.masses(t); return [i, m.c + m.k, m.c + m.k + m.r]; });
      const h2 = L.fig(st.g3, { x: [0, 360], y: [0, 1], aspect: 0.48, maxH: 220, xlabel: T('crank angle θ (°)', 'クランク角 θ（°）'), ylabel: T('share of gas', 'ガスの割合'), ticksX: [[0, '0'], [90, '90'], [180, '180'], [270, '270'], [360, '360']] });
      h2.poly([[0, 0], ...sh.map((q) => [q[0], q[1]]), [360, 0]], { c: 'neg', fill: 'neg', fo: 0.55, w: 1.2 });
      h2.poly([...sh.map((q) => [q[0], q[1]]), ...sh.slice().reverse().map((q) => [q[0], q[2]])], { c: 'c4', fill: 'c4', fo: 0.45, w: 1.2 });
      h2.poly([...sh.map((q) => [q[0], q[2]]), [360, 1], [0, 1]], { c: 'pos', fill: 'pos', fo: 0.5, w: 1.2 });
      h2.text(20, 0.08, T('cold space + cooler', '低温空間＋冷却器'), { small: true, c: 'ink' });
      h2.text(20, 0.93, T('heater + hot space', '加熱器＋高温空間'), { small: true, c: 'ink', dy: 6 });
      const cur = g.group('over'), cur2 = h2.group('over');
      h2.handle(v.th, 0.5, { c: 'hl', axis: 'x', snap: 1, bounds: [0, 360, 0, 1], label: T('crank angle', 'クランク角'), onDrag: (x) => { st.anim?.pause(); ctx.set('th', Math.round(clamp(x, 0, 360))); } });
      L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('Schmidt cycle of this engine', 'このエンジンのシュミットサイクル') }, { c: 'muted', dash: true, label: T('ideal Stirling cycle, same charge', '同じ充てん量の理想スターリングサイクル') }, { kind: 'fill', c: 'neg', label: T('cold gas', '低温のガス') }, { kind: 'fill', c: 'c4', label: T('in the regenerator', '再生器の中') }, { kind: 'fill', c: 'pos', label: T('hot gas', '高温のガス') }, { kind: 'dot', c: 'hl', label: T('present state', '現在の状態') }]);
      const f = 1500 / 60;
      ctx.readout([
        { k: T('work per cycle W = W_e + W_c', '一サイクルの仕事 W = W_e + W_c'), v: `${fmt(E.W, 3)} J = ${fmt(E.We, 3)} ${E.Wc < 0 ? '−' : '+'} ${fmt(Math.abs(E.Wc), 3)} J`, tone: 'key' },
        { k: T('heat taken in at T_h, Q_e = W_e', 'T_h で受け取る熱 Q_e = W_e'), v: `${fmt(E.Qe, 3)} J` },
        { k: T('efficiency W/Q_e, Carnot 1 − T_c/T_h', '効率 W/Q_e、カルノー 1 − T_c/T_h'), v: E.W > 1e-9 ? `${fmt(100 * E.eta, 3)}%, ${fmt(100 * (1 - Tk / Th), 3)}%` : '—' },
        { k: T('pressure swing p_min to p_max', '圧力の振れ p_min〜p_max'), v: `${fmt(E.pmin * bar, 3)} to ${fmt(E.pmax * bar, 3)} bar` },
        { k: T('power at 1500 rpm, W f', '1500 rpm での出力 W f'), v: `${fmt((E.W * f) / 1000, 3)} kW`, tone: 'good' },
        { k: T('ideal Stirling work, same charge and volumes', '同じ充てん量・体積での理想スターリングの仕事'), v: `${fmt(I.W, 3)} J` },
      ], v.alpha === 0 || v.alpha === 180 ? T('With the pistons in phase or in opposition the gas is never moved between the spaces at the right moment: the loop collapses to a line traced back and forth and the engine does no work.', 'ピストンが同位相か逆位相だと、ガスはちょうどよい時に空間の間を移されません。閉曲線はつぶれて往復する一本の線になり、エンジンは仕事をしません。')
        : T(`The Schmidt engine, with isothermal spaces and a perfect regenerator, reaches the Carnot efficiency, but its loop is ${fmt(E.W / I.W * 100, 2)}% of the ideal cycle's area: sinusoidal motion never holds the gas wholly hot or wholly cold, and the ${fmt(E.Vdead / VSW, 2)} swept volumes of dead space never change volume at all.`, `空間を等温、再生器を完全としたシュミットのエンジンはカルノー効率に達しますが、その閉曲線の面積は理想サイクルの ${fmt(E.W / I.W * 100, 2)}% です。正弦波の動きではガスが全部熱い状態や全部冷たい状態にはならず、行程容積の ${fmt(E.Vdead / VSW, 2)} 倍ある死容積はまったく体積を変えないからです。`));
      // ---- pose at crank angle t: 3D parts, gas parcels, cursors
      const poseParts = (t) => {
        const P = st.parts; if (!P || st.flat) return;
        const S = st.S, TH = S.THREE, fc = phiC(t), fe = phiE(t, al);
        P.thC.rotation.y = fc; P.thE.rotation.y = fe; P.fw.rotation.y = fc;
        P.hdl.at([2.35 * Math.sin(fc), 2.95, 2.35 * Math.cos(fc)]);
        const put = (C, phi) => {
          const s = pinS(phi, C.ax), pinW = [Math.sin(phi) * R1, C.y, Math.cos(phi) * R1], ppW = addv([0, C.y, 0], C.ax, s);
          C.piston.position.z = s;
          C.rod.position.set(...pinW); C.rod.quaternion.setFromUnitVectors(new TH.Vector3(0, 0, 1), new TH.Vector3(ppW[0] - pinW[0], ppW[1] - pinW[1], ppW[2] - pinW[2]).normalize());
          const crown = s + CROWN, hgt = Math.max(0.02, HEAD - crown); C.gas.scale.set(1, 1, hgt); C.gas.position.z = crown + hgt / 2;
          return crown;
        };
        const crC = put(P.cc, fc), crE = put(P.ce, fe);
        P.cc.gas.material.color.copy(tcol3(S, Tk)); P.ce.gas.material.color.copy(tcol3(S, Th)); P.cc.gas.material.emissive?.copy(tcol3(S, Tk)); P.ce.gas.material.emissive?.copy(tcol3(S, Th));
        P.screens.forEach((m) => { const Tx = Tk + (Th - Tk) * m.userData.f; m.material.color.copy(tcol3(S, Tx)); });
        // parcels by mass coordinate
        const m = E.masses(t), seg = [m.c, m.k, m.r, m.h, m.e], tot = seg.reduce((a, b) => a + b, 0), pts = [], cols = [];
        for (let i = 0; i < P.NP; i++) {
          let mu = ((i + 0.5) / P.NP) * tot, j = 0; while (j < 4 && mu > seg[j]) { mu -= seg[j]; j++; }
          const fr = seg[j] > 0 ? clamp(mu / seg[j], 0, 1) : 0.5, lat = P.lat[i];
          let q, Tq;
          if (j === 0 || j === 4) {
            const C = j === 0 ? P.cc : P.ce, cr = j === 0 ? crC : crE, z = j === 0 ? cr + fr * (HEAD - cr) : HEAD - fr * (HEAD - cr);
            const ax = C.ax, e2 = [ax[2], 0, -ax[0]], r = lat[0] * 1.02;
            q = addv(addv(addv([0, C.y, 0], ax, z), e2, Math.cos(lat[1]) * r), [0, 1, 0], Math.sin(lat[1]) * r); Tq = j === 0 ? Tk : Th;
          } else if (j === 2) {
            const Tx = Th === Tk ? Tk : Tk * Math.pow(Th / Tk, fr), x = Th === Tk ? fr : (Tx - Tk) / (Th - Tk);
            q = along(P.paths[1], x, lat, 0.45); Tq = Tx;
          } else { q = j === 1 ? along(P.paths[0], fr, lat, 0.18) : along(P.paths[2], fr, lat, 0.18); Tq = j === 1 ? Tk : Th; }
          pts.push(q); cols.push(tcol3(S, Tq));
        }
        P.gasPts.update(pts, cols);
        S.invalidate();
      };
      const pose = (t) => {
        const deg = ((((t / DEG) % 360) + 360) % 360);
        poseParts(t);
        if (st.flat && st.flatPose) st.flatPose(t);
        cur.replaceChildren(); cur2.replaceChildren();
        cur.appendChild(g.dot(E.Vt(t) * cm3, E.p(t) * bar, { c: 'hl', r: 6 }));
        cur2.appendChild(h2.vline(deg, { c: 'hl', w: 1.4, dash: '3 3', layer: 'over' }));
        return deg;
      };
      st.pose = pose;
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lb) => { const d = st.pose(st.th0 + TAU * 0.35 * t); lb.textContent = `θ = ${fmt(Math.round(d), 3)}°`; }, { autoplay: false, initialT: 0, playLabel: T('Play: run the engine', '再生：エンジンを回す') });
      L.view3d(ctx, v, {
        host: st.v3, aspect: 1.0, maxH: 560, camera: [9.5, -15.5, 9.2], target: [0, 0.3, 3.1], fov: 30,
        label: T('3D alpha Stirling engine. Drag to rotate; drag the gold knob on the flywheel to turn the crank.', '3D のアルファ型スターリングエンジン。ドラッグで回転、フライホイールの金色のつまみをドラッグでクランクを回せます。'),
        init(S) { st.flat = false; st.S = S; buildEngine(S, st); settle(S); },
        update(S) { st.pose(st.th0); S.fitStage?.(); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const s = L.stage(st.v3, { w: 160, h: 150, maxH: 460 }), G = s.group('main');
          st.flatPose = (t) => {
            G.replaceChildren(); const sc = 11, cx = 80, cy = 40, add = (n) => G.appendChild(n);
            const P2 = (q) => [cx + q[0] * sc, cy + q[2] * sc];
            const draw = (ax, phi, hot) => {
              const sp = pinS(phi, ax), crown = sp + CROWN, e2 = [ax[2], 0, -ax[0]], pt = (z, w) => P2(addv(addv([0, 0, 0], ax, z), e2, w));
              add(s.poly([pt(ROD - R1 - 0.3, 1.2), pt(HEAD, 1.2), pt(HEAD, -1.2), pt(ROD - R1 - 0.3, -1.2)], { c: 'muted', w: 1.2, fill: 'plate', fo: 0.3 }));
              add(s.poly([pt(crown, 1.15), pt(HEAD, 1.15), pt(HEAD, -1.15), pt(crown, -1.15)], { c: hot ? 'pos' : 'neg', fill: hot ? 'pos' : 'neg', fo: 0.55, w: 1 }));
              add(s.poly([pt(sp - PIN0, 1.15), pt(crown, 1.15), pt(crown, -1.15), pt(sp - PIN0, -1.15)], { c: 'ink', fill: hot ? 'muted' : 'c3', fo: 0.9, w: 1 }));
              add(s.poly([pt(HEAD, 1.32), pt(HEAD + 0.8, 1.32), pt(HEAD + 0.8, -1.32), pt(HEAD, -1.32)], { c: 'ink', fill: hot ? 'pos' : 'muted', fo: 0.9, w: 1 }));
              const pin = P2([Math.sin(phi), 0, Math.cos(phi)]);
              add(s.seg(pin, pt(sp, 0), { c: 'c1', w: 3.5 })); add(s.dot(pin[0], pin[1], { c: 'ink', r: 3 }));
            };
            add(s.circle(cx, cy, 2.35 * sc, { c: 'ink', w: 2.5 }));
            draw(AX_C, phiC(t), false); draw(AX_H, phiE(t, al), true);
            const top = [P2(addv([0, 0, 0], AX_C, HEAD + 0.8)), P2([1.5, 0, 6.7]), P2([-1.5, 0, 6.7]), P2(addv([0, 0, 0], AX_H, HEAD + 0.8))];
            add(s.line(top, { c: 'muted', w: 6, op: 0.6 }));
            add(s.seg(top[1], top[2], { c: 'c4', w: 9, op: 0.8 }));
            add(s.text((top[1][0] + top[2][0]) / 2, top[1][1] + 6, T('regenerator', '再生器'), { small: true, anchor: 'middle' }));
            const k = P2([2.35 * Math.sin(phiC(t)), 0, 2.35 * Math.cos(phiC(t))]); add(s.dot(k[0], k[1], { c: 'hl', r: 5 }));
          };
          setTimeout(() => st.pose(st.th0), 0);
        },
      });
      pose(st.th0);
    },
  };

  /* ================= 2. the Schmidt design map ================= */
  const AXX = (a) => (a / 180) * 6 - 3, AXY = (k) => Math.log2(k) * 1.1;
  const ZS = [4.2, 9.5];                                              // height per unit normalised work, mean and maximum pressure
  D['stirling-schmidt-map'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
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
      const tau = 300 / v.Th, X = v.X, nm = v.norm, kap = v.kap;
      const Wf = (a, k) => workMap(a, k, X, tau, nm), w0 = Wf(v.alpha, kap), opt = optimum(X, tau, nm), optA = optimum(X, tau, nm, kap);
      const zs = ZS[nm];
      const refName = nm ? T('p_max', 'p_max') : T('p_mean', 'p_mean');
      st.cap1.textContent = T(`Work per cycle over the two design choices: the phase angle α (across) and the swept-volume ratio κ = V_sw,c / V_sw,e (into the page, on a log scale), divided by ${nm ? 'the maximum' : 'the mean'} pressure times the total swept volume. Blue runs along the present κ, teal along the present α; the orange ball is the summit. Drag the gold point over the surface.`, `一サイクルの仕事を、二つの設計上の選択、位相角 α（横方向）と行程容積比 κ = V_sw,c / V_sw,e（奥行き方向、対数目盛）の上に描き、${nm ? '最高' : '平均'}圧力と全行程容積の積で割っています。青は現在の κ に沿った線、青緑は現在の α に沿った線、橙の球が頂上です。金色の点を曲面の上でドラッグしてください。`);
      st.cap2.textContent = T('Slice at the present κ: work against phase angle. It vanishes at 0° and 180°, where the volumes move together or in opposition.', '現在の κ での切り口で、位相角に対する仕事です。体積が一緒に動く 0° と逆向きに動く 180° でゼロになります。');
      st.cap3.textContent = T('Slice at the present α: work against the volume ratio.', '現在の α での切り口で、体積比に対する仕事です。');
      const draw2d = () => {
        st.g2.replaceChildren(); st.g3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const f0 = L.fig(st.v3, { x: [0, 180], y: [-2, 2], aspect: 0.7, maxH: 400, xlabel: T('phase angle α (°)', '位相角 α（°）'), ylabel: 'log₂ κ' });
          f0.raster((a, l) => L.cmaps.warm(Wf(a, 2 ** l) * zs / 2.6), { res: 6 });
          f0.dot(opt.alpha, Math.log2(opt.kap), { c: 'c2', r: 6 });
          f0.handle(v.alpha, Math.log2(kap), { c: 'hl', bounds: [0, 180, -2, 2], onDrag: (a, l) => { ctx.set('alpha', Math.round(a)); ctx.set('kap', Math.round(2 ** l * 100) / 100); } });
        }
        const A = L.sample(0, 180, 180, (a) => Wf(a, kap)), K = L.sample(-2, 2, 160, (l) => Wf(v.alpha, 2 ** l));
        const ym = Math.max(opt.W, ...A.map((q) => q[1]), ...K.map((q) => q[1])) * 1.12 || 1;
        const f1 = L.fig(st.g2, { x: [0, 180], y: [0, ym], aspect: 0.55, maxH: 230, xlabel: T('phase angle α (°)', '位相角 α（°）'), ylabel: `W / (${refName} V_T)`, ticksX: [[0, '0'], [45, '45'], [90, '90'], [135, '135'], [180, '180']] });
        f1.line(A, { c: 'c1', w: 2.6 });
        f1.dot(optA.alpha, optA.W, { c: 'c2', r: 5 }); f1.text(optA.alpha, optA.W, `${fmt(optA.alpha, 3)}°`, { small: true, c: 'c2', dy: -9, anchor: 'middle' });
        f1.handle(v.alpha, w0, { c: 'hl', axis: 'x', snap: 1, bounds: [0, 180, 0, ym], label: 'α', onDrag: (x) => ctx.set('alpha', Math.round(clamp(x, 0, 180))) });
        const f2 = L.fig(st.g3, { x: [-2, 2], y: [0, ym], aspect: 0.55, maxH: 230, xlabel: T('volume ratio κ (log scale)', '体積比 κ（対数目盛）'), ylabel: `W / (${refName} V_T)`, ticksX: [[-2, '¼'], [-1, '½'], [0, '1'], [1, '2'], [2, '4']] });
        f2.line(K, { c: 'c3', w: 2.6 });
        f2.handle(Math.log2(kap), w0, { c: 'hl', axis: 'x', bounds: [-2, 2, 0, ym], label: 'κ', onDrag: (x) => ctx.set('kap', Math.round(2 ** clamp(x, -2, 2) * 100) / 100) });
        L.legend(st.leg, [{ c: 'c1', label: T('work against α at this κ', 'この κ での α に対する仕事') }, { c: 'c3', label: T('work against κ at this α', 'この α での κ に対する仕事') }, { kind: 'dot', c: 'c2', label: T('optimum', '最適点') }, { kind: 'dot', c: 'hl', label: T('present design', '現在の設計') }]);
        const Ve = M.VSW, P = w0 * (nm ? 1 : 1) * (Ve * (1 + kap));
        const E = schmidt({ Vswc: kap * Ve, Vswe: Ve, Vk: (X * Ve) / 4, Vr: (X * Ve) / 2, Vh: (X * Ve) / 4, Tk: 300, Th: v.Th, alpha: v.alpha * DEG, pmean: PMEAN });
        ctx.readout([
          { k: T(`normalised work W / (${nm ? 'p_max' : 'p_mean'} V_T)`, `正規化した仕事 W / (${nm ? 'p_max' : 'p_mean'} V_T)`), v: fmt(w0, 3), tone: 'key' },
          { k: T('best α at this κ', 'この κ での最良の α'), v: `${fmt(optA.alpha, 3)}°` },
          { k: T('summit: α, κ, work', '頂上：α、κ、仕事'), v: `${fmt(opt.alpha, 3)}°, ${fmt(opt.kap, 3)}, ${fmt(opt.W, 3)}`, tone: 'good' },
          { k: T('temperature ratio τ = T_c / T_h', '温度比 τ = T_c / T_h'), v: fmt(tau, 3) },
          { k: T(`work and power, 113 cm³ hot cylinder, 10 bar mean, ${v.rpm} rpm`, `仕事と出力（高温側 113 cm³、平均 10 bar、${v.rpm} rpm）`), v: `${fmt(E.W, 3)} J, ${fmt((E.W * v.rpm) / 60000, 3)} kW` },
        ], T(`Power is W f: the map shows the work per cycle, and the speed multiplies it. Dead space flattens the whole surface and moves the best phase towards 90°; ${nm ? 'judged by peak pressure, which sizes the walls and seals, the best phase rises above 90° and the best κ falls, because a gentler pressure swing is worth more than the last joule' : 'judged by mean pressure, a phase a little under 90° wins when there is no dead space'}.`, `出力は W f です。この地図は一サイクルの仕事を示し、回転数がそれに掛かります。死容積は曲面全体を平らにし、最良の位相を 90° に近づけます。${nm ? '壁やシールの寸法を決める最高圧力で評価すると、最後の 1 ジュールより穏やかな圧力変動のほうが価値があるので、最良の位相は 90° より大きくなり、最良の κ は小さくなります' : '平均圧力で評価すると、死容積がないときは 90° より少し小さい位相が勝ちます'}。`));
        void P;
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 500, camera: [5.2, -7.6, 5.4], target: [0, 0, 0.9], fov: 32,
        label: T('3D surface of work over phase angle and volume ratio. Drag to rotate; drag the gold point to choose a design.', '位相角と体積比の上の仕事の 3D 曲面。ドラッグで回転、金色の点をドラッグで設計を選べます。'),
        init(S) {
          st.flat = false; st.S = S;
          S.floor({ size: 3.3, n: 12, z: 0 });
          st.surf = S.surface(() => [0, 0, 0], { u: [0, 180], v: [-2, 2], nu: 90, nv: 60, c: 'c2', rough: 0.32, coat: 0.6, wire: true, wireEvery: 10, wireEveryV: 10, colour: () => S.colour('c2') });
          st.sA = S.tube([[0, 0, 0], [0.01, 0, 0]], { c: 'c1', r: 0.035 }); st.sK = S.tube([[0, 0, 0], [0.01, 0, 0]], { c: 'c3', r: 0.035 });
          st.opt = S.sphere([0, 0, 0], 0.11, { c: 'c2', glow: 0.3 }); st.lOpt = S.label(T('optimum', '最適点'), [0, 0, 0], { small: true });
          st.drop = S.lines([], { c: 'hl', opacity: 0.8, w: 1.6 });
          st.hdl = S.handle([0, 0, 0], { r: 0.13, c: 'hl', plane: [[0, 0, 1], [0, 0, 1]], onDrag: (q) => { const a = clamp(((q.x + 3) / 6) * 180, 0, 180), l = clamp(q.y / 1.1, -2, 2); const A2 = Math.round(a), K2 = Math.round(2 ** l * 100) / 100; ctx.set('alpha', A2); ctx.set('kap', K2); return [AXX(A2), AXY(K2), Wf(A2, K2) * ZS[st.v.norm]]; } });
          for (const [a, s] of [[0, '0°'], [90, '90°'], [180, '180°']]) S.label(s, [AXX(a), -2.65, 0], { small: true, align: 'middle' });
          for (const [k, s] of [[0.25, 'κ = ¼'], [1, 'κ = 1'], [4, 'κ = 4']]) S.label(s, [3.25, AXY(k), 0], { small: true });
          S.label(T('phase angle α', '位相角 α'), [0, -3.2, 0], { small: true, align: 'middle' });
          S.label(T('work', '仕事'), [-3.3, 2.4, 1.6], { small: true, align: 'end' });
          S.lines([[[-3, 2.2, 0], [-3, 2.2, 2.8]]], { c: 'ink', opacity: 0.5, w: 1.4 });
        },
        update(S) {
          st.v = v;
          const zsN = ZS[v.norm], grid = new Map(), key = (a, l) => a.toFixed(3) + ',' + l.toFixed(3);
          const zf = (a, l) => { const k = key(a, l); let z = grid.get(k); if (z === undefined) { z = Wf(a, 2 ** l) * zsN; grid.set(k, z); } return z; };
          st.surf.update((a, l) => [AXX(a), l * 1.1, zf(a, l)], (a, l, p) => S.cmap.warm(clamp(p[2] / 2.6, 0, 1)));
          st.sA.update(L.seq(91, (i) => { const a = i * 2; return [AXX(a), AXY(kap), Wf(a, kap) * zsN + 0.03]; }));
          st.sK.update(L.seq(81, (i) => { const l = -2 + i * 0.05; return [AXX(v.alpha), l * 1.1, Wf(v.alpha, 2 ** l) * zsN + 0.03]; }));
          const po = [AXX(opt.alpha), AXY(opt.kap), opt.W * zsN + 0.06]; st.opt.at(po); st.lOpt.set([po[0], po[1], po[2] + 0.15]);
          const ph = [AXX(v.alpha), AXY(kap), w0 * zsN]; st.hdl.at(ph); st.hdl.setPlane([0, 0, 1], ph);
          st.drop.update([[ph, [ph[0], ph[1], 0]]]);
          S.fitStage?.(); S.invalidate(); draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ================= 3. the regenerator ================= */
  const XR = 2.4;
  D['stirling-regenerator'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
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
      const gas = GASES[v.gas], R = regen(v.eps, v.Th, v.Tc, v.r, gas), Th = v.Th, Tk = v.Tc, d = R.d;
      const Tm = (x) => Tk + d + ((Th - Tk - 2 * d) * (x + XR)) / (2 * XR);             // matrix temperature along the stack
      st.cap1.textContent = T('A regenerator cut open: a glass canister packed with fine wire screens between the cooler (left) and the heater (right). Gas surges through it twice a cycle. Going right it picks up heat the screens stored on the way left, and leaves at the temperature on the gold thermometer; drag it to change the effectiveness ε.', '切り開いた再生器です。冷却器（左）と加熱器（右）の間で、細い金網を詰めたガラスの容器になっています。ガスは一サイクルに二回ここを通り抜けます。右へ向かうときは、左へ向かったときに金網が蓄えた熱を拾い、金色の温度計の温度で出ていきます。温度計をドラッグすると有効度 ε が変わります。');
      st.cap2.textContent = T('Temperature along the regenerator. The screens (grey) sit between the two streams of gas: the cold blow rises from T_c, the hot blow falls from T_h, each lagging the matrix by (1 − ε)(T_h − T_c)/2.', '再生器に沿った温度です。金網（灰）は二つのガスの流れの間にあります。低温側からの流れは T_c から上がり、高温側からの流れは T_h から下がり、どちらも金網から (1 − ε)(T_h − T_c)/2 だけ遅れます。');
      st.cap3.textContent = T('Efficiency of the ideal Stirling cycle against regenerator effectiveness. Only a perfect regenerator reaches Carnot; without one the heater must also supply the whole isochoric heating. Drag the gold point.', '再生器の有効度に対する理想スターリングサイクルの効率です。カルノー効率に達するのは完全な再生器だけで、再生器がなければ加熱器は等積加熱の全部も受けもたねばなりません。金色の点をドラッグしてください。');
      const draw2d = () => {
        st.g2.replaceChildren(); st.g3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const s = L.fig(st.v3, { x: [-3.4, 3.4], y: [-1.3, 1.3], equal: true, axes: false, grid: false, maxH: 300 });
          s.raster((x, y) => (Math.abs(x) < XR && Math.abs(y) < 0.8 ? tcol2(Tm(x)) : Math.abs(y) < 0.4 ? tcol2(x > 0 ? Th : Tk) : null) || [0, 0, 0], { res: 4 });
          for (let i = 0; i <= 24; i++) { const x = -XR + (2 * XR * i) / 24; s.seg([x, -0.8], [x, 0.8], { c: 'ink', w: 0.8, op: 0.4 }); }
          s.rect(-XR, -0.8, 2 * XR, 1.6, { c: 'ink', w: 1.5 });
          s.text(-XR - 0.5, 0.65, T('cooler', '冷却器'), { small: true, anchor: 'middle', c: 'neg' }); s.text(XR + 0.5, 0.65, T('heater', '加熱器'), { small: true, anchor: 'middle', c: 'pos' });
        }
        const f1 = L.fig(st.g2, { x: [0, 1], y: [Tk - 40, Th + 40], aspect: 0.55, maxH: 230, xlabel: T('position, cold end to hot end', '位置（低温端から高温端へ）'), ylabel: 'T (K)' });
        f1.hline(Th, { c: 'pos', w: 1, dash: '4 3' }); f1.hline(Tk, { c: 'neg', w: 1, dash: '4 3' });
        f1.line([[0, Tk + d], [1, Th - d]], { c: 'muted', w: 5, op: 0.8 });
        f1.line([[0, Tk], [1, R.Tout]], { c: 'c1', w: 2.4, arrow: true }); f1.line([[1, Th], [0, Th - (R.Tout - Tk)]], { c: 'c2', w: 2.4, arrow: true });
        f1.text(1, R.Tout, `${fmt(R.Tout, 3)} K`, { small: true, c: 'c1', anchor: 'end', dy: 14 });
        f1.text(0.02, Th, `T_h = ${Th} K`, { small: true, c: 'pos', dy: -6 }); f1.text(0.98, Tk, `T_c = ${Tk} K`, { small: true, c: 'neg', anchor: 'end', dy: 14 });
        const e = L.sample(0, 1, 200, (x) => etaRegen(x, Th, Tk, v.r, gas.g));
        const f2 = L.fig(st.g3, { x: [0, 1], y: [0, Math.min(1, R.carnot * 1.15)], aspect: 0.55, maxH: 230, xlabel: T('regenerator effectiveness ε', '再生器の有効度 ε'), ylabel: 'η' });
        f2.hline(R.carnot, { c: 'c2', w: 1.4, dash: '6 4' }); f2.text(0.03, R.carnot, T(`Carnot ${fmt(100 * R.carnot, 3)}%`, `カルノー ${fmt(100 * R.carnot, 3)}%`), { small: true, c: 'c2', dy: -6 });
        GASES.forEach((G, i) => { if (i !== v.gas) f2.line(L.sample(0, 1, 120, (x) => etaRegen(x, Th, Tk, v.r, G.g)), { c: 'muted', w: 1.2, dash: '3 3' }); });
        f2.line(e, { c: 'c4', w: 2.6 });
        f2.handle(v.eps, R.eta, { c: 'hl', axis: 'x', snap: 0.01, bounds: [0, 1, 0, 1], label: 'ε', onDrag: (x) => ctx.set('eps', Math.round(clamp(x, 0, 1) * 100) / 100) });
        L.legend(st.leg, [{ c: 'muted', label: T('matrix (screens)', 'マトリクス（金網）') }, { c: 'c1', label: T('gas blown cold to hot', '低温側から高温側への流れ') }, { c: 'c2', label: T('gas blown hot to cold', '高温側から低温側への流れ') }, { c: 'c4', label: T(`efficiency, ${gas.en}`, `効率（${gas.ja}）`) }, { c: 'muted', dash: true, label: T('the other gases', 'ほかの気体') }]);
        ctx.readout([
          { k: T('efficiency η, Carnot', '効率 η とカルノー効率'), v: `${fmt(100 * R.eta, 3)}%, ${fmt(100 * R.carnot, 3)}%`, tone: 'key' },
          { k: T('work per kg, W = R(T_h − T_c) ln r', '1 kg あたりの仕事 W = R(T_h − T_c) ln r'), v: `${fmt(R.W / 1e3, 3)} kJ` },
          { k: T('heat at T_h: isothermal + make-up (1 − ε)c_v(T_h − T_c)', 'T_h での熱：等温分＋補充分 (1 − ε)c_v(T_h − T_c)'), v: `${fmt(R.Qiso / 1e3, 3)} + ${fmt(R.Qextra / 1e3, 3)} kJ` },
          { k: T('heat the regenerator stores and returns, c_v(T_h − T_c)', '再生器が蓄えて返す熱 c_v(T_h − T_c)'), v: `${fmt(R.Qreg / 1e3, 3)} kJ`, tone: 'good' },
          { k: T('gas leaves the hot end at; NTU = ε/(1 − ε)', '高温端を出るガスの温度、NTU = ε/(1 − ε)'), v: `${fmt(R.Tout, 3)} K; ${Number.isFinite(R.NTU) ? fmt(R.NTU, 3) : '∞'}` },
        ], T(`The regenerator handles ${fmt(R.Qreg / R.Qiso, 3)} times as much heat per cycle as the heater does along the hot isotherm. Every 1% it fails to return must be bought again with fuel, which is why real regenerators reach ε of 0.95 to 0.99.`, `再生器は一サイクルに、加熱器が高温の等温線上で受けもつ熱の ${fmt(R.Qreg / R.Qiso, 3)} 倍の熱を扱います。返しそこねた 1% ごとに燃料で買い直さなければならないので、実際の再生器の ε は 0.95〜0.99 に達します。`));
      };
      const zT = (Tq) => 1.05 + (1.6 * (Tq - Tk)) / Math.max(1, Th - Tk);
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 460, camera: [1.8, -8.6, 3.6], target: [0, 0, 0.35], fov: 32,
        label: T('3D regenerator. Drag to rotate; drag the gold bead on the thermometer to change the effectiveness.', '3D の再生器。ドラッグで回転、温度計の金色の玉をドラッグで有効度を変えられます。'),
        init(S) {
          st.flat = false; st.S = S;
          const TH = S.THREE;
          const can = new TH.Mesh(new TH.CylinderGeometry(0.86, 0.86, 2 * XR, 64, 1, true).rotateZ(PI / 2), S.mat('muted', { glass: true, thickness: 0.06, ior: 1.5 })); S.add(can);
          for (const x of [XR, -XR]) { const fl = new TH.Mesh(new TH.TorusGeometry(0.88, 0.07, 12, 64).rotateY(PI / 2), S.mat('muted', METAL)); fl.position.x = x; S.add(fl); }
          st.screens = L.seq(24, (i) => { const x = -XR + (2 * XR * (i + 0.5)) / 24, m = new TH.Mesh(new TH.CylinderGeometry(0.8, 0.8, 0.045, 48).rotateZ(PI / 2), S.mat('c4', { metal: 0.55, rough: 0.42, coat: 0.3 })); m.position.x = x; S.add(m); return m; });
          const wires = []; for (let i = 0; i < 24; i++) { const x = -XR + (2 * XR * (i + 0.5)) / 24 - 0.03; for (let k = -3; k <= 3; k++) { const c = k * 0.22, h = Math.sqrt(0.8 * 0.8 - c * c); wires.push([[x, c, -h], [x, c, h]], [[x, -h, c], [x, h, c]]); } }
          S.lines(wires, { c: 'ink', opacity: 0.35, w: 1 });
          const stub = (x0, x1, col, o) => { const m = new TH.Mesh(new TH.CylinderGeometry(0.42, 0.42, Math.abs(x1 - x0), 40).rotateZ(PI / 2), S.mat(col, o)); m.position.x = (x0 + x1) / 2; S.add(m); return m; };
          stub(XR, XR + 1.1, 'pos', { metal: 0.45, rough: 0.35, glow: 0.55 }); stub(-XR, -XR - 1.1, 'muted', METAL);
          for (let i = 0; i < 5; i++) { const c = new TH.Mesh(new TH.TorusGeometry(0.46, 0.05, 8, 40).rotateY(PI / 2), S.mat('hl', { glow: 0.9 })); c.position.x = XR + 0.2 + i * 0.18; S.add(c); }
          for (let i = 0; i < 6; i++) { const f = new TH.Mesh(new TH.CylinderGeometry(0.85, 0.85, 0.05, 48).rotateZ(PI / 2), S.mat('c1', { metal: 0.75, rough: 0.28 })); f.position.x = -XR - 0.15 - i * 0.17; S.add(f); }
          st.NP = 110; st.lat = L.seq(st.NP, (i) => [Math.sqrt(hash(i, 3)) * 0.68, hash(i, 4) * TAU, -XR + 2 * XR * hash(i, 5)]);
          st.pts = S.points(L.seq(st.NP, () => [0, 0, 0]), { colours: L.seq(st.NP, () => S.colour('c1')), r: 0.06, max: st.NP, rough: 0.3, glow: 0.35 }); st.pts.castShadow = false;
          st.thermo = S.tube([[XR + 0.4, 0, 1.05], [XR + 0.4, 0, 2.65]], { c: 'muted', r: 0.05, opacity: 0.45 });
          st.fill = S.tube([[XR + 0.4, 0, 1.0], [XR + 0.4, 0, 1.5]], { c: 'c4', r: 0.035, glow: 0.4 });
          S.lines([[[XR + 0.3, 0, zT(Th)], [XR + 0.62, 0, zT(Th)]], [[XR + 0.3, 0, zT(Tk)], [XR + 0.62, 0, zT(Tk)]]], { c: 'ink', opacity: 0.7, w: 1.5 });
          st.lTh = S.label('', [XR + 0.66, 0, zT(Th) + 0.08], { small: true, c: 'pos' }); st.lTk = S.label('', [XR + 0.66, 0, zT(Tk) + 0.08], { small: true, c: 'neg' });
          st.hdl = S.handle([XR + 0.4, 0, 1.5], { r: 0.11, c: 'hl', plane: [[0, 1, 0], [0, 0, 0]], onDrag: (q) => { const e = Math.round(clamp((q.z - 1.05) / 1.6, 0, 1) * 100) / 100; ctx.set('eps', e); return [XR + 0.4, 0, 1.05 + 1.6 * e]; } });
          st.lOut = S.label('', [XR + 0.55, 0, 1.6], { small: true, c: 'ink' });
          S.label(T('wire-screen matrix', '金網のマトリクス'), [-0.6, 0, 1.15], { small: true, align: 'middle' });
          S.label(T('heater', '加熱器'), [XR + 0.6, 0, -0.75], { small: true, c: 'pos', align: 'middle' });
          S.label(T('cooler', '冷却器'), [-XR - 0.6, 0, -1.15], { small: true, c: 'neg', align: 'middle' });
          st.clock = 0.6;
          S.animate((dt) => { if (S.reduced() || !st.place) return false; st.clock += Math.min(dt, 0.05); st.place(st.clock); return true; });
        },
        update(S) {
          st.screens.forEach((m) => { m.material.color.copy(tcol3(S, Tm(m.position.x))); });
          const zo = zT(R.Tout);
          st.fill.update([[XR + 0.4, 0, 1.0], [XR + 0.4, 0, zo]]); st.fill.material.color.copy(tcol3(S, R.Tout)); st.fill.material.emissive.copy(tcol3(S, R.Tout));
          st.hdl.at([XR + 0.4, 0, zo]); st.lOut.set([XR + 0.55, 0, zo + 0.05], `${fmt(R.Tout, 3)} K`);
          st.lTh.set(null, `${Th} K`); st.lTk.set(null, `${Tk} K`);
          // parcels oscillate through the stack; their temperature lags the matrix by d against the direction of flow
          st.place = (t) => {
            const w = 1.4, ph = w * t, vdir = clamp(3 * Math.cos(ph), -1, 1), pts = [], cols = [];
            for (let i = 0; i < st.NP; i++) {
              const [rr, th, x0] = st.lat[i], x = x0 + 1.25 * Math.sin(ph);
              const inS = Math.abs(x) < XR, rad = inS ? rr : rr * 0.55;
              const Tq = inS ? Tm(x) - d * vdir : x > 0 ? Th : Tk;
              pts.push([x, Math.cos(th) * rad, Math.sin(th) * rad]); cols.push(tcol3(S, Tq));
            }
            st.pts.update(pts, cols);
          };
          st.place(st.clock);
          S.fitStage?.(); S.invalidate(); draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
