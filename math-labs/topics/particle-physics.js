'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180, C = 0.299792458;      // GeV per (tesla metre) for unit charge
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Units: GeV for energy, momentum and mass (c = 1), metres, tesla.
   * Two-body decay M -> m + m: rest-frame momentum p* = sqrt(M^2/4 - m^2); boost along the parent's direction (+x).
   * Invariant mass m^2 = (E1 + E2)^2 - |p1 + p2|^2. A track of charge q and transverse momentum pT in a field B along z
   * is a helix of radius R = pT/(0.2998 |q| B); positive charges turn clockwise seen from +z.
   * Quark model: flavour SU(3) weights (I3, Y) of u, d, s add; Q = I3 + Y/2 (Gell-Mann and Nishijima). Masses in MeV (PDG).
   * One-loop running: 1/alpha_i(mu) = 1/alpha_i(MZ) - (b_i/2pi) ln(mu/MZ), with (b1, b2, b3) = (41/10, -19/6, -7) in the
   * Standard Model (b3 = -(11 - 2 nf/3) for nf flavours) and (33/5, 1, -3) with supersymmetric partners.
   */
  const PART = [
    { M: 0.77526, G: 0.1491, m: 0.13957, mu: false, ctau: 0, tex: tx`\rho^0\to\pi^+\pi^-`, d: tx`\pi` },
    { M: 0.497611, G: 7.351e-15, m: 0.13957, mu: false, ctau: 0.026844, tex: tx`K^0_S\to\pi^+\pi^-`, d: tx`\pi` },
    { M: 3.0969, G: 9.26e-5, m: 0.1056584, mu: true, ctau: 0, tex: tx`J/\psi\to\mu^+\mu^-`, d: tx`\mu` },
    { M: 91.1876, G: 2.4955, m: 0.1056584, mu: true, ctau: 0, tex: tx`Z\to\mu^+\mu^-`, d: tx`\mu` },
  ];
  const pStar = (M, m1, m2 = m1) => Math.sqrt(Math.max(0, (M * M - (m1 + m2) ** 2) * (M * M - (m1 - m2) ** 2))) / (2 * M);
  function decay(M, m, p, cth, phi = 0) {
    const ps = pStar(M, m), Es = M / 2, E = Math.hypot(p, M), g = E / M, bg = p / M, sth = Math.sqrt(Math.max(0, 1 - cth * cth));
    const mk = (s) => [g * Es + s * bg * ps * cth, s * g * ps * cth + bg * Es, s * ps * sth * Math.cos(phi), s * ps * sth * Math.sin(phi)];
    return { p1: mk(1), p2: mk(-1), ps, gamma: g, betaGamma: bg };
  }
  const invMass = (a, b) => Math.sqrt(Math.max(0, (a[0] + b[0]) ** 2 - (a[1] + b[1]) ** 2 - (a[2] + b[2]) ** 2 - (a[3] + b[3]) ** 2));
  const radius = (pT, B, q = 1) => pT / (C * Math.abs(q) * B);
  const sagitta = (pT, B, Lc) => (C * B * Lc * Lc) / (8 * pT);
  const R_SOL = 1.2, ZH = 3;
  // points of a track from origin o = [x, y, z]; helix inside the solenoid (r < R_SOL), straight beyond, until r = rStop
  function track(p4, q, B, o = [0, 0, 0], rStop = 2.4) {
    const [, px, py, pz] = p4, pT = Math.hypot(px, py), phi0 = Math.atan2(py, px), w = (-q * C * B) / pT, pts = [o.slice()];
    let x = o[0], y = o[1], z = o[2], s = 0, ph = phi0; const ds = 0.01;
    for (let i = 0; i < 4000; i++) {
      s += ds;
      if (Math.abs(w) > 1e-9) { x = o[0] + (Math.sin(phi0 + w * s) - Math.sin(phi0)) / w; y = o[1] - (Math.cos(phi0 + w * s) - Math.cos(phi0)) / w; } else { x = o[0] + s * Math.cos(phi0); y = o[1] + s * Math.sin(phi0); }
      z = o[2] + (s * pz) / pT; ph = phi0 + w * s; pts.push([x, y, z]);
      if (Math.hypot(x, y) >= R_SOL || Math.abs(z) > ZH || Math.abs(w * s) > 1.5 * TAU) break;
    }
    const looper = Math.hypot(x, y) < R_SOL - 1e-9 && Math.abs(z) <= ZH;
    if (!looper && Math.abs(z) <= ZH) for (let i = 0; i < 2000 && Math.hypot(x, y) < rStop && Math.abs(z) <= ZH; i++) { x += ds * Math.cos(ph); y += ds * Math.sin(ph); z += (ds * pz) / pT; pts.push([x, y, z]); }
    return { pts, R: radius(pT, B, q), looper };
  }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // fractional mass resolution of a tracker: curvature measurement (worse at high pT, better in a strong field) and scattering
  const massRes = (i, p, B) => { const P = PART[i], pT = Math.hypot(p, P.M) / 2; return Math.hypot((1.5e-4 * pT * 2) / B, 0.006) / Math.SQRT2; };
  function sampleMasses(i, p, B, N, seed = 7) {
    const P = PART[i], r = rng(seed + 31 * i), sig = massRes(i, p, B) * P.M, out = [];
    for (let k = 0; k < N; k++) {
      const u = r(), g = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(TAU * r());
      out.push(P.M + (P.G / 2) * Math.tan(PI * (clamp(u, 0.02, 0.98) - 0.5)) + sig * g);
    }
    return out;
  }
  const lorentz = (m, M, G) => G / 2 / PI / ((m - M) ** 2 + (G / 2) ** 2);

  // ---- quark model ----
  const QK = { u: [0.5, 1 / 3, 2 / 3], d: [-0.5, 1 / 3, -1 / 3], s: [0, -2 / 3, -1 / 3] }, QN = ['u', 'd', 's'];
  // weight of a list of [flavour, isAntiquark]: I3, Y, Q, strangeness
  function weight(list) { let i3 = 0, y = 0, Q = 0, S = 0; for (const [f, anti] of list) { const k = anti ? -1 : 1; i3 += k * QK[f][0]; y += k * QK[f][1]; Q += k * QK[f][2]; if (f === 's') S -= k; } return { i3, y, Q, S }; }
  const B3 = (name, tex, quarks, mass) => ({ name, tex, quarks, mass, ...weight(quarks.split('').map((f) => [f, false])) });
  const MES = (name, tex, q, aq, mass) => ({ name, tex, quarks: q + aq, q, aq, mass, ...weight([[q, false], [aq, true]]) });
  const MULT = [
    { key: 'mesons', states: [MES('pi+', tx`\pi^+`, 'u', 'd', 139.57), MES('pi-', tx`\pi^-`, 'd', 'u', 139.57), MES('K+', tx`K^+`, 'u', 's', 493.677), MES('K0', tx`K^0`, 'd', 's', 497.611), MES('K0bar', tx`\bar K^0`, 's', 'd', 497.611), MES('K-', tx`K^-`, 's', 'u', 493.677),
      { name: 'pi0', tex: tx`\pi^0`, quarks: 'uu', centre: true, mass: 134.977, i3: 0, y: 0, Q: 0, S: 0 }, { name: 'eta', tex: tx`\eta`, quarks: 'dd', centre: true, mass: 547.862, i3: 0, y: 0, Q: 0, S: 0 }, { name: 'etap', tex: tx`\eta^{\prime}`, quarks: 'ss', centre: true, mass: 957.78, i3: 0, y: 0, Q: 0, S: 0 }] },
    { key: 'octet', states: [B3('p', tx`p`, 'uud', 938.272), B3('n', tx`n`, 'udd', 939.565), B3('Lambda', tx`\Lambda`, 'uds', 1115.683), B3('Sigma+', tx`\Sigma^+`, 'uus', 1189.37), B3('Sigma0', tx`\Sigma^0`, 'uds', 1192.642), B3('Sigma-', tx`\Sigma^-`, 'dds', 1197.449), B3('Xi0', tx`\Xi^0`, 'uss', 1314.86), B3('Xi-', tx`\Xi^-`, 'dss', 1321.71)] },
    { key: 'decuplet', states: [B3('Delta++', tx`\Delta^{++}`, 'uuu', 1232), B3('Delta+', tx`\Delta^+`, 'uud', 1232), B3('Delta0', tx`\Delta^0`, 'udd', 1232), B3('Delta-', tx`\Delta^-`, 'ddd', 1232), B3('Sigma*+', tx`\Sigma^{*+}`, 'uus', 1382.8), B3('Sigma*0', tx`\Sigma^{*0}`, 'uds', 1383.7), B3('Sigma*-', tx`\Sigma^{*-}`, 'dds', 1387.2), B3('Xi*0', tx`\Xi^{*0}`, 'uss', 1531.8), B3('Xi*-', tx`\Xi^{*-}`, 'dss', 1535.0), B3('Omega-', tx`\Omega^-`, 'sss', 1672.45)] },
  ];
  const sortQ = (a) => a.slice().sort((x, y) => QN.indexOf(x) - QN.indexOf(y)).join('');
  // states of multiplet k with the chosen quark content (q1 q2 q3 for baryons; q1 anti-q2 for mesons)
  function lookup(k, q) {
    if (k === 0) return q[0] === q[1] ? MULT[0].states.filter((s) => s.centre) : MULT[0].states.filter((s) => !s.centre && s.q === q[0] && s.aq === q[1]);
    const key = sortQ(q); return MULT[k].states.filter((s) => s.quarks === key);
  }
  const avg = (k, names) => { const s = MULT[k].states.filter((x) => names.includes(x.name)); return s.reduce((a, x) => a + x.mass, 0) / s.length; };
  const OCT = () => ({ N: avg(1, ['p', 'n']), Lam: avg(1, ['Lambda']), Sig: avg(1, ['Sigma+', 'Sigma0', 'Sigma-']), Xi: avg(1, ['Xi0', 'Xi-']) });
  const DEC = () => [avg(2, ['Delta++']), avg(2, ['Sigma*+', 'Sigma*0', 'Sigma*-']), avg(2, ['Xi*0', 'Xi*-']), avg(2, ['Omega-'])];
  const gmoOctet = () => { const o = OCT(); return { lhs: 2 * (o.N + o.Xi), rhs: 3 * o.Lam + o.Sig }; };
  const gmoEta = () => { const mp = avg(0, ['pi+', 'pi0', 'pi-']), mk = avg(0, ['K+', 'K0']); return Math.sqrt((4 * mk * mk - mp * mp) / 3); };

  // ---- running couplings ----
  const MZ = 91.1876, AS_MZ = 0.118, AEM_INV = 127.95, S2W = 0.2312;
  const INV_MZ = [0.6 * AEM_INV * (1 - S2W), AEM_INV * S2W, 1 / AS_MZ];
  const B_SM = [41 / 10, -19 / 6, -7], B_SUSY = [33 / 5, 1, -3];
  const b0 = (nf) => 11 - (2 * nf) / 3;
  const alphaS = (Q, nf = 5) => { const inv = 1 / AS_MZ + (b0(nf) / TAU) * Math.log(Q / MZ); return inv > 0 ? 1 / inv : Infinity; };
  const lambdaQCD = (nf = 5) => MZ * Math.exp(-TAU / (b0(nf) * AS_MZ));
  // inverse couplings at scale mu (GeV); model 0: Standard Model, 1: supersymmetric partners above msusy
  function invAlpha(mu, model = 0, msusy = 1000) {
    return INV_MZ.map((a0, i) => {
      if (model === 0 || mu <= msusy) return a0 - (B_SM[i] / TAU) * Math.log(mu / MZ);
      return a0 - (B_SM[i] / TAU) * Math.log(msusy / MZ) - (B_SUSY[i] / TAU) * Math.log(mu / msusy);
    });
  }
  // log10 of the scale where couplings i and j meet
  function crossing(i, j, model = 0, msusy = 1000) {
    const f = (t) => { const a = invAlpha(10 ** t, model, msusy); return a[i] - a[j]; };
    let lo = 2, hi = 40; if (f(lo) * f(hi) > 0) return NaN;
    for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  const M = { C, PART, pStar, decay, invMass, radius, sagitta, track, R_SOL, massRes, sampleMasses, lorentz, QK, weight, MULT, lookup, OCT, DEC, gmoOctet, gmoEta, MZ, AS_MZ, INV_MZ, B_SM, B_SUSY, b0, alphaS, lambdaQCD, invAlpha, crossing };
  (window.LabModels = window.LabModels || {})['particle-physics'] = M;

  /* ================= 1. invariant mass in a detector (3D) ================= */
  const XC = 0.03;                                        // the event is drawn just in front of the cut face
  const W3 = (q) => [XC + q[2], q[0], q[1]];              // physics (x, y, z = beam) to world (X = beam, Y, Z up)
  function buildDetector(S) {
    const ring = (r1, r2, x0, x1, c, o = {}) => {
      const mk = (fn, u, v, nu, nv) => { const m = S.surface(fn, { u, v, nu, nv, c, rough: 0.4, coat: 0.3, ...o }); m.receiveShadow = false; return m; };
      mk((th, x) => [x, r2 * Math.cos(th), r2 * Math.sin(th)], [0, TAU], [x0, x1], 96, 1);
      if (r2 - r1 > 0.03) {
        mk((th, x) => [x, r1 * Math.cos(th), r1 * Math.sin(th)], [0, TAU], [x0, x1], 96, 1);
        mk((th, r) => [x1, r * Math.cos(th), r * Math.sin(th)], [0, TAU], [r1, r2], 96, 1);
        mk((th, r) => [x0, r * Math.cos(th), r * Math.sin(th)], [0, TAU], [r1, r2], 96, 1);
      }
    };
    for (const r of [0.1, 0.22, 0.38, 0.6, 0.85, 1.08]) ring(r - 0.006, r + 0.006, -2.6, 0, '#27344d', { metal: 0.6, rough: 0.35 });   // silicon layers
    ring(R_SOL, 1.34, -2.9, 0, '#c9ced4', { metal: 0.9, rough: 0.28 });                    // superconducting solenoid in its cryostat
    ring(1.42, 1.82, -2.95, 0, '#9ed1c6', { rough: 0.2, coat: 0.9 });                        // electromagnetic calorimeter (crystals)
    ring(1.9, 2.95, -ZH, 0, '#b08d57', { metal: 0.85, rough: 0.42 });                        // hadron calorimeter (brass absorber)
    ring(3.2, 3.5, -ZH, 0, '#a8433a', { rough: 0.5, coat: 0.4 });   // muon stations in the iron return yoke
    // radial tower boundaries on the two calorimeter faces
    const seg = []; for (let k = 0; k < 72; k++) { const a = (k / 72) * TAU; seg.push([[0.002, 1.42 * Math.cos(a), 1.42 * Math.sin(a)], [0.002, 1.82 * Math.cos(a), 1.82 * Math.sin(a)]]); }
    for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU; seg.push([[0.002, 1.9 * Math.cos(a), 1.9 * Math.sin(a)], [0.002, 2.95 * Math.cos(a), 2.95 * Math.sin(a)]]); }
    S.lines(seg, { c: '#3c3c3c', opacity: 0.35 });
    S.tube([[-ZH - 0.4, 0, 0], [1.6, 0, 0]], { r: 0.022, c: '#d9dde1', metal: 0.9, rough: 0.25 });   // beam pipe
  }
  D['invariant-mass'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx; st.anim?.stop();
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.bar = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const P = PART[v.part], p = v.p, B = v.B, dk = decay(P.M, P.m, p, v.cth), E = Math.hypot(p, P.M);
      const Ldec = P.ctau * dk.betaGamma, vtx = [Ldec, 0, 0], rStop = P.mu ? 3.75 : 2.35;
      const t1 = track(dk.p1, +1, B, vtx, rStop), t2 = track(dk.p2, -1, B, vtx, rStop);
      const open = Math.acos(clamp((dk.p1[1] * dk.p2[1] + dk.p1[2] * dk.p2[2]) / (Math.hypot(dk.p1[1], dk.p1[2]) * Math.hypot(dk.p2[1], dk.p2[2])), -1, 1));
      const mrec = invMass(dk.p1, dk.p2);
      L.setText(st.cap1, T(tx`A generic collider detector cut open across the beam: silicon tracker layers, the solenoid, crystal and brass calorimeters, and muon stations. A particle made at the centre decays as \(${P.tex}\); the field along the beam bends the positive track (orange) one way and the negative (blue) the other, with radius \(R=p_T/(0.3B)\). Drag the gold handle to change the decay angle.`, tx`ビームを横切る面で切り開いた一般的な衝突型実験の検出器です。シリコン飛跡検出器の層、ソレノイド、結晶と真鍮のカロリメータ、ミューオン検出器があります。中心で作られた粒子が \(${P.tex}\) と崩壊します。ビームに沿った磁場は正の飛跡（オレンジ）と負の飛跡（青）を逆向きに、半径 \(R=p_T/(0.3B)\) で曲げます。金色のハンドルをドラッグして崩壊角を変えてください。`));
      L.setText(st.cap2, T(tx`Each event gives one value of \(m=\sqrt{(E_1+E_2)^2-|\mathbf p_1+\mathbf p_2|^2}\). Collected over many events they pile up at the parent’s mass. Dashed: the natural line shape of width \(\Gamma\); the histogram is wider because momenta are measured with finite precision.`, tx`事象ごとに \(m=\sqrt{(E_1+E_2)^2-|\mathbf p_1+\mathbf p_2|^2}\) の値が一つ得られます。多くの事象を集めると、親粒子の質量のところに積み上がります。破線は幅 \(\Gamma\) の自然な線形です。運動量の測定精度が有限なので、ヒストグラムはそれより広くなります。`));
      L.setText(st.cap3, T(tx`Laboratory energies of the two daughters against the decay angle \(\cos\theta^{*}\) in the parent’s rest frame. They trade energy, but the sum, and the invariant mass, never change.`, tx`親粒子の静止系での崩壊角 \(\cos\theta^{*}\) に対する、二つの娘粒子の実験室系でのエネルギーです。エネルギーを分け合いますが、和と不変質量は決して変わりません。`));
      // histogram
      const sigM = massRes(v.part, p, B) * P.M, halfW = Math.max(3.2 * (P.G / 2 + 1.6 * sigM), 1e-4), lo = P.M - halfW, hi = P.M + halfW, NB = 40, bw = (hi - lo) / NB, NEV = 800;
      const masses = sampleMasses(v.part, p, B, NEV);
      const natural = (m) => lorentz(m, P.M, Math.max(P.G, bw / 40)) * bw;
      const drawHist = (nEv) => {
        st.g2.replaceChildren();
        const h = new Array(NB).fill(0); for (let k = 0; k < nEv; k++) { const b = Math.floor((masses[k] - lo) / bw); if (b >= 0 && b < NB) h[b]++; }
        const top = Math.max(8, Math.max(...sampleHistMax(masses, lo, bw, NB)) * 1.15);
        const f = L.fig(st.g2, { x: [lo, hi], y: [0, top], aspect: 0.56, maxH: 250, xlabel: T(tx`invariant mass \(m\) (GeV)`, tx`不変質量 \(m\)（GeV）`) });
        for (let b = 0; b < NB; b++) if (h[b]) f.rect(lo + b * bw, 0, bw, h[b], { c: 'c1', fill: 'c1', fo: 0.55, w: 0.6 });
        f.line(L.sample(lo, hi, 400, (m) => Math.min(top * 1.2, natural(m) * nEv)), { c: 'c3', dash: '5 4', w: 1.6 });
        f.vline(mrec, { c: 'hl', w: 2 }); f.text(mrec, top, T('this event', 'この事象'), { small: true, dy: 12, dx: 5, anchor: 'start', c: 'hl' });
      };
      st.g3.replaceChildren();
      const eMax = E * 1.05, g = L.fig(st.g3, { x: [-1, 1], y: [0, eMax], aspect: 0.5, maxH: 220, xlabel: tx`\(\cos\theta^{*}\)` });
      const e1 = (c) => dk.gamma * (P.M / 2) + dk.betaGamma * dk.ps * c;
      g.line([[-1, e1(-1)], [1, e1(1)]], { c: 'c2', w: 2.4 }); g.line([[-1, e1(1)], [1, e1(-1)]], { c: 'c1', w: 2.4 }); g.hline(E, { c: 'ink', dash: '5 4' });
      g.text(0.96, E, tx`\(E_1+E_2\)`, { small: true, anchor: 'end', dy: 24 });
      g.dot(v.cth, e1(-v.cth), { c: 'c1', r: 4 });
      g.handle(v.cth, e1(v.cth), { c: 'hl', axis: 'x', bounds: [-1, 1, 0, eMax], label: T('decay angle', '崩壊角'), onDrag: (x) => ctx.set('cth', clamp(Math.round(x * 50) / 50, -1, 1)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T(tx`positive daughter \(${P.d}^+\), \(E_1\)`, tx`正の娘粒子 \(${P.d}^+\)、\(E_1\)`) }, { c: 'c1', label: T(tx`negative daughter \(${P.d}^-\), \(E_2\); events`, tx`負の娘粒子 \(${P.d}^-\)、\(E_2\)、事象数`) }, { c: 'c3', dash: true, label: T(tx`natural width \(\Gamma\)`, tx`自然幅 \(\Gamma\)`) }, { c: 'hl', label: T('this event', 'この事象') }]);
      const pT1 = Math.hypot(dk.p1[1], dk.p1[2]), pT2 = Math.hypot(dk.p2[1], dk.p2[2]);
      ctx.readout([
        { k: T(tx`\(E_1,\ E_2\) (GeV)`, tx`\(E_1,\ E_2\)（GeV）`), v: tx`\(${fmt(dk.p1[0], 4)},\ ${fmt(dk.p2[0], 4)}\)` },
        { k: T(tx`track radii \(p_T/(0.3B)\)`, tx`飛跡の半径 \(p_T/(0.3B)\)`), v: tx`\(${fmt(radius(pT1, B), 3)},\ ${fmt(radius(pT2, B), 3)}\ \mathrm{m}\)` },
        { k: T('opening angle', '開き角'), v: tx`\(${fmt(open / DEG, 3)}^\circ\)` },
        { k: T(tx`reconstructed \(m\)`, tx`再構成した \(m\)`), v: tx`\(${fmt(mrec, 5)}\ \mathrm{GeV}\)`, tone: 'key' },
        ...(P.ctau ? [{ k: T(tx`mean flight before decay \(\beta\gamma c\tau\)`, tx`崩壊までの平均飛行距離 \(\beta\gamma c\tau\)`), v: tx`\(${fmt(Ldec * 100, 3)}\ \mathrm{cm}\)` }] : []),
      ], T('Energies, angles and radii all depend on how the parent was moving and how it happened to decay. One combination does not: the invariant mass. That is how particles that live far too briefly to be seen are discovered, as bumps in a mass spectrum.', 'エネルギー、角度、半径はどれも、親粒子がどう動いていたか、たまたまどう崩壊したかによって変わります。ただ一つの組み合わせ、不変質量だけは変わりません。直接見るには寿命が短すぎる粒子は、こうして質量スペクトルの山として発見されます。'));
      let last = -1;
      st.bar.replaceChildren();
      st.anim = L.animator(st.bar, (dt, t, lab) => { const nEv = Math.min(NEV, Math.round(t * 160)); if (nEv !== last) { last = nEv; drawHist(nEv); } if (lab) L.setText(lab, T(`${nEv} events`, `${nEv} 事象`)); return nEv < NEV; }, { autoplay: false, once: true, initialT: 99, playLabel: T('Play: collect events', '再生：事象を集める') });
      const dirOf = (c) => { const q = decay(P.M, P.m, p, c).p1; return Math.atan2(q[2], q[1]); };
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.92 : 0.78, maxH: 540, camera: [9.4, -6.6, 3.9], target: [-0.9, 0.3, -0.15], fov: 30,
        label: T('3D detector with the two tracks of a decay. Drag to rotate; drag the gold handle.', '崩壊の二本の飛跡を表示した 3D の検出器。ドラッグで回転、金色のハンドルをドラッグできます。'),
        init(S) {
          st.flat = false; buildDetector(S);
          st.tr = [S.tube([[0, 0, 0], [0.01, 0, 0]], { r: 0.036, c: 'c2', glow: 0.55 }), S.tube([[0, 0, 0], [0.01, 0, 0]], { r: 0.036, c: 'c1', glow: 0.55 })];
          st.tr.forEach((m) => { m.castShadow = false; });
          st.par = S.tube([[0, 0, 0], [0.01, 0, 0]], { r: 0.012, c: '#8a8f98', opacity: 0.7 }); st.par.castShadow = false;
          st.vx = S.sphere([0, 0, 0], 0.045, { c: 'ink' });
          st.dep = [S.sphere([0, 0, 0], 0.11, { c: 'c2', glow: 0.8 }), S.sphere([0, 0, 0], 0.11, { c: 'c1', glow: 0.8 })];
          st.lb = [S.label('', [0, 0, 0], { c: 'c2' }), S.label('', [0, 0, 0], { c: 'c1' })];
          st.hdl = S.handle([0, 0, 0], { r: 0.085, c: 'hl', plane: [[1, 0, 0], [XC + 0.02, 0, 0]], onDrag: (q) => {
            const cur = st.cur, ang = Math.atan2(q.z, q.y - cur.L); let best = cur.cth, bd = 9;
            for (let i = 0; i <= 100; i++) { const c = -1 + i / 50; let d = Math.abs(cur.dirOf(c) - ang); d = Math.min(d, TAU - d); if (d + 0.02 * Math.abs(c - cur.cth) < bd) { bd = d + 0.02 * Math.abs(c - cur.cth); best = c; } }
            st.ctx.set('cth', Math.round(best * 50) / 50);
            const a2 = cur.dirOf(best); return [XC + 0.02, cur.L + 0.62 * Math.cos(a2), 0.62 * Math.sin(a2)];
          } });
          const at = (r, deg) => [0.06, r * Math.cos(deg * DEG), r * Math.sin(deg * DEG)];
          S.label(T('silicon tracker', 'シリコン飛跡検出器'), at(0.78, 305), { small: true }); S.label(T('solenoid', 'ソレノイド'), at(1.27, 200), { small: true });
          S.label(T('crystal calorimeter', '結晶カロリメータ'), at(1.62, 150), { small: true }); S.label(T('brass calorimeter', '真鍮カロリメータ'), at(2.45, 118), { small: true }); S.label(T('muon station', 'ミューオン検出器'), at(3.35, 95), { small: true });
        },
        update(S) {
          st.cur = { L: Ldec, cth: v.cth, dirOf };
          [t1, t2].forEach((t, i) => {
            const step = Math.max(1, Math.floor(t.pts.length / 160)), pts = t.pts.filter((_, k) => k % step === 0 || k === t.pts.length - 1).map(W3);
            st.tr[i].update(pts); const end = W3(t.pts[t.pts.length - 1]);
            st.dep[i].at(end); st.dep[i].visible = !P.mu && !t.looper;
            st.lb[i].set([end[0] + 0.05, end[1], end[2] + 0.22], tx`\(${P.d}^${i ? '-' : '+'}\)`);
          });
          st.par.update([W3([0, 0, 0]), W3([Math.max(Ldec, 0.001), 0, 0])]); st.par.visible = Ldec > 0.01;
          st.vx.at(W3(vtx));
          const a = dirOf(v.cth); st.hdl.at([XC + 0.02, Ldec + 0.62 * Math.cos(a), 0.62 * Math.sin(a)]);
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-3.9, 3.9], y: [-3.6, 3.6], equal: true, maxH: 440, axes: false, grid: false });
          for (const r of [0.1, 0.22, 0.38, 0.6, 0.85, 1.08, R_SOL, 1.42, 1.82, 1.9, 2.95, 3.2, 3.5]) f.circle(0, 0, r, { c: 'muted', w: r > 1.1 ? 1.4 : 0.8 });
          f.line(t1.pts.map((q) => [q[0], q[1]]), { c: 'c2', w: 2.6 }); f.line(t2.pts.map((q) => [q[0], q[1]]), { c: 'c1', w: 2.6 });
          f.dot(Ldec, 0, { c: 'ink', r: 3 });
        },
      });
    },
  };
  function sampleHistMax(masses, lo, bw, NB) { const h = new Array(NB).fill(0); for (const m of masses) { const b = Math.floor((m - lo) / bw); if (b >= 0 && b < NB) h[b]++; } return h; }

  /* ================= 2. the quark model: weights that add ================= */
  const QC = { u: 'c1', d: 'c2', s: 'c3' };
  D['quark-model'] = {
    render(ctx, v) {
      const k = v.mult, q = [QN[v.q1], QN[v.q2], QN[v.q3]], meson = k === 0;
      const list = meson ? [[q[0], false], [q[1], true]] : q.map((f) => [f, false]);
      const w = weight(list), found = lookup(k, q), sel = found[clamp(ctx.state.pick ?? 0, 0, Math.max(0, found.length - 1))];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Isospin \(I_3\) across, hypercharge \(Y\) up. Each quark is a step in this plane (an antiquark the reverse step), and a hadron sits where its quarks’ steps end. ${meson ? tx`A meson is a quark and an antiquark: \(q_1\bar q_2\) (the third choice is not used).` : 'A baryon is three quarks.'} Drag the gold point onto a particle, or choose the quarks.`, tx`横軸はアイソスピン \(I_3\)、縦軸はハイパーチャージ \(Y\) です。クォーク一つはこの平面での一歩（反クォークは逆向きの一歩）で、ハドロンはクォークの歩みの終点にあります。${meson ? tx`中間子はクォークと反クォーク \(q_1\bar q_2\) です（三つ目の選択は使いません）。` : 'バリオンはクォーク三つです。'}金色の点を粒子の上へドラッグするか、クォークを選んでください。`));
      const f = L.fig(c1, { x: [-1.95, 1.95], y: meson ? [-1.6, 1.6] : [-2.5, 1.6], equal: true, maxH: 430, xlabel: tx`\(I_3\)`, ylabel: tx`\(Y\)` });
      // lines of constant charge Q = I3 + Y/2
      for (let Q = -2; Q <= 2; Q++) { f.line([[Q + 1.5, -3], [Q - 1, 2]], { c: 'muted', w: 0.8, dash: '2 5', op: 0.7, layer: 'under' }); }
      const groups = {};
      for (const s of MULT[k].states) (groups[s.i3 + ',' + s.y] ||= []).push(s);
      for (const key in groups) {
        const g = groups[key], s0 = g[0]; f.dot(s0.i3, s0.y, { c: 'ink', r: g.length > 1 ? 6.5 : 4.5, hollow: g.length > 1 });
        if (g.length > 1) f.dot(s0.i3, s0.y, { c: 'ink', r: 2.5 });
        f.text(s0.i3, s0.y, tx`\(${g.map((s) => s.tex).join(',\\,')}\)`, { dy: s0.y > 0.5 ? -12 : 20, small: true });
      }
      let at = [0, 0];
      list.forEach(([fl, anti]) => { const sgn = anti ? -1 : 1, to = [at[0] + sgn * QK[fl][0], at[1] + sgn * QK[fl][1]]; f.arrow(at, to, { c: QC[fl], w: 2.6, dash: anti ? '5 3' : null }); at = to; });
      f.handle(w.i3, w.y, { c: 'hl', bounds: [-1.7, 1.7, -2.3, 1.4], label: T('hadron', 'ハドロン'), onDrag: (x, y) => {
        let best = null, bd = 1e9; for (const s of MULT[k].states) { const d = Math.hypot(s.i3 - x, s.y - y); if (d < bd) { bd = d; best = s; } }
        const here = MULT[k].states.filter((s) => s.i3 === best.i3 && s.y === best.y); ctx.state.pick = 0;
        const qs = meson ? (best.centre ? [q[0], q[0], q[2]] : [best.q, best.aq, q[2]]) : best.quarks.split('');
        ctx.set('q1', QN.indexOf(qs[0]), true); ctx.set('q2', QN.indexOf(qs[1]), true); ctx.set('q3', QN.indexOf(qs[2]));
        void here;
      } });
      // mass pattern
      const g2cap = L.h('p', 'lab-cap', c2);
      if (k === 2) {
        const d = DEC(), pred = 2 * d[2] - d[1];
        L.setText(g2cap, T(tx`Decuplet masses against the number of strange quarks. Each strange quark costs about the same, so the rows are equally spaced. In 1962 this predicted a tenth particle, \(\Omega^-=sss\), near 1680 MeV; it was found in 1964 at 1672 MeV.`, tx`十重項の質量を、ストレンジクォークの個数に対して描いています。ストレンジクォーク 1 個あたりの質量の増加がほぼ同じなので、段は等間隔に並びます。1962 年、これによって 10 番目の粒子 \(\Omega^-=sss\) が 1680 MeV 付近にあると予言され、1964 年に 1672 MeV で見つかりました。`));
        const g = L.fig(c2, { x: [-0.4, 3.4], y: [1150, 1750], aspect: 0.95, maxH: 430, xlabel: T('strange quarks; mass in MeV', 'ストレンジクォークの個数、質量は MeV'), ticksX: [[0, '0'], [1, '1'], [2, '2'], [3, '3']] });
        const sl = (d[2] - d[0]) / 2; g.line([[-0.3, d[0] - 0.3 * sl], [3.3, d[0] + 3.3 * sl]], { c: 'c3', dash: '5 4' });
        ['\\Delta', '\\Sigma^{*}', '\\Xi^{*}', '\\Omega^-'].forEach((t, i) => { g.dot(i, d[i], { c: i === -w.S ? 'hl' : 'c1', r: i === -w.S ? 6.5 : 5 }); g.text(i, d[i], tx`\(${t}\ ${fmt(d[i], 1)}\)`, { small: true, dx: -9, dy: -8, anchor: 'end' }); });
        g.dot(3, pred, { c: 'c2', r: 5, hollow: true }); g.text(3, pred, T(tx`predicted \(${fmt(pred, 0)}\)`, tx`予言 \(${fmt(pred, 0)}\)`), { small: true, dx: -9, dy: 14, anchor: 'end', c: 'c2' });
      } else if (k === 1) {
        const o = OCT(), G = gmoOctet();
        L.setText(g2cap, T(tx`Octet masses against the number of strange quarks. \(\Lambda\) and \(\Sigma\) have the same quarks but different isospin, and the Gell-Mann and Okubo relation \(2(m_N+m_\Xi)=3m_\Lambda+m_\Sigma\) ties the four levels together: ${fmt(G.lhs, 0)} against ${fmt(G.rhs, 0)} MeV.`, tx`八重項の質量を、ストレンジクォークの個数に対して描いています。\(\Lambda\) と \(\Sigma\) はクォークが同じでアイソスピンが異なり、ゲルマン・大久保の関係式 \(2(m_N+m_\Xi)=3m_\Lambda+m_\Sigma\) が四つの準位を結びつけます。${fmt(G.lhs, 0)} MeV に対して ${fmt(G.rhs, 0)} MeV です。`));
        const g = L.fig(c2, { x: [-0.5, 2.5], y: [880, 1380], aspect: 0.95, maxH: 430, xlabel: T('strange quarks; mass in MeV', 'ストレンジクォークの個数、質量は MeV'), ticksX: [[0, '0'], [1, '1'], [2, '2']] });
        g.line([[0, o.N], [2, o.Xi]], { c: 'c3', dash: '5 4' });
        [[0, o.N, 'N'], [1, o.Lam, '\\Lambda'], [1, o.Sig, '\\Sigma'], [2, o.Xi, '\\Xi']].forEach(([x, m, t]) => { g.dot(x, m, { c: x === -w.S ? 'hl' : 'c1', r: x === -w.S ? 6.5 : 5 }); g.text(x, m, tx`\(${t}\ ${fmt(m, 1)}\)`, { small: true, dx: 10, dy: t === '\\Sigma' ? -4 : t === '\\Lambda' ? 12 : 4, anchor: 'start' }); });
        g.dot(1, (3 * o.Lam + o.Sig) / 4, { c: 'c2', r: 4.5, hollow: true }); g.text(1, (3 * o.Lam + o.Sig) / 4, tx`\(\tfrac14(3\Lambda+\Sigma)\)`, { small: true, dx: -10, dy: 4, anchor: 'end', c: 'c2' });
      } else {
        const mp = 0.138039, mk = 0.495644, me = 0.547862, pe = gmoEta() / 1000;
        L.setText(g2cap, T(tx`For the light mesons the pattern holds for squared masses: \(4m_K^2=m_\pi^2+3m_\eta^2\) predicts \(m_\eta=${fmt(pe * 1000, 0)}\) MeV against the measured 548 MeV. The \(\eta^{\prime}\), at 958 MeV, is the ninth state and stands apart.`, tx`軽い中間子では、この規則は質量の二乗について成り立ちます。\(4m_K^2=m_\pi^2+3m_\eta^2\) から \(m_\eta=${fmt(pe * 1000, 0)}\) MeV が予言され、測定値は 548 MeV です。958 MeV の \(\eta^{\prime}\) は 9 番目の状態で、別格です。`));
        const g = L.fig(c2, { x: [-0.5, 2.5], y: [0, 1.0], aspect: 0.95, maxH: 430, ylabel: tx`\(m^2\ (\mathrm{GeV}^2)\)`, ticksX: [[0, 'π'], [1, 'K'], [2, 'η, η′']] });
        g.line([[0, mp * mp], [1, mk * mk]], { c: 'c3', dash: '5 4' }); g.line([[1, mk * mk], [2, pe * pe]], { c: 'c3', dash: '5 4' });
        [[0, mp, '\\pi'], [1, mk, 'K'], [2, me, '\\eta'], [2, 0.95778, '\\eta^{\\prime}']].forEach(([x, m, t]) => { g.dot(x, m * m, { c: 'c1', r: 5 }); g.text(x, m * m, tx`\(${t}\)`, { small: true, dx: 10, dy: 4, anchor: 'start' }); });
        g.dot(2, pe * pe, { c: 'c2', r: 4.5, hollow: true }); g.text(2, pe * pe, T('predicted', '予言'), { small: true, dx: -10, dy: -6, anchor: 'end', c: 'c2' });
      }
      L.legend(ctx.host, [{ c: 'c1', label: tx`\(u\ (\tfrac12,\tfrac13)\)` }, { c: 'c2', label: tx`\(d\ (-\tfrac12,\tfrac13)\)` }, { c: 'c3', label: tx`\(s\ (0,-\tfrac23)\)` }, { c: 'muted', dash: true, label: T(tx`lines of equal charge \(Q=I_3+\tfrac12Y\)`, tx`電荷 \(Q=I_3+\tfrac12Y\) が等しい線`) }]);
      const content = meson ? tx`${q[0]}\bar ${q[1]}` : q.join('');
      const names = found.length ? tx`\(${found.map((s) => s.tex).join(',\\ ')}\)` : T('none in this multiplet', 'この多重項にはありません');
      ctx.readout([
        { k: T('quark content', 'クォークの組成'), v: tx`\(${content}\)` },
        { k: tx`\(I_3,\ Y,\ Q=I_3+\tfrac12Y\)`, v: tx`\(${fmt(w.i3, 3)},\ ${fmt(w.y, 3)},\ ${fmt(w.Q, 3)}\)` },
        { k: T('strangeness', 'ストレンジネス'), v: String(w.S) },
        { k: T('particle', '粒子'), v: names, tone: found.length ? 'key' : 'warn' },
        { k: T('mass (MeV)', '質量（MeV）'), v: found.length ? found.map((s) => fmt(s.mass, 2)).join(', ') : '–' },
      ], !found.length ? T('Three identical quarks need a flavour state that is symmetric under exchange, and the spin one-half octet has none: uuu, ddd and sss exist only in the spin three-halves decuplet.', '同じクォーク三つには、入れ替えについて対称なフレーバー状態が必要ですが、スピン 1/2 の八重項にはそれがありません。uuu、ddd、sss はスピン 3/2 の十重項にだけ存在します。') : T('Charge is not put in by hand: it follows from the position in the diagram. The patterns are the weight diagrams of the group SU(3), found before quarks were proposed to explain them.', '電荷は手で入れたものではなく、図の中の位置から決まります。これらの模様は群 SU(3) のウェイト図で、それを説明するクォークが提案されるより前に見つかっていました。'));
      void sel;
    },
  };

  /* ================= 3. running couplings ================= */
  D['running-couplings'] = {
    render(ctx, v) {
      const nf = v.nf, Q = 10 ** v.lq, model = v.model, msusy = 10 ** v.ms, aQ = alphaS(Q, nf), bb = b0(nf);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The strong coupling \(\alpha_s(Q)\) at one loop, fixed to \(0.118\) at the \(Z\) mass, with \(n_f=${nf}\) quark flavours. Gluons carry colour themselves and anti-screen the charge, so the coupling falls at high energy, as long as \(11-\tfrac23n_f>0\). Drag the gold point.`, tx`1 ループでの強い結合定数 \(\alpha_s(Q)\) です。\(Z\) の質量で \(0.118\) に合わせ、クォークのフレーバー数は \(n_f=${nf}\) です。グルーオン自身が色をもち、電荷を反遮蔽するので、\(11-\tfrac23n_f>0\) であるかぎり高エネルギーで結合は弱くなります。金色の点をドラッグしてください。`));
      const f = L.fig(c1, { x: [0, 3.3], y: [0, 0.5], aspect: 0.82, maxH: 380, xlabel: T(tx`energy scale \(Q\) (GeV)`, tx`エネルギースケール \(Q\)（GeV）`), ylabel: tx`\(\alpha_s\)`, ticksX: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
      f.line(L.sample(0, 3.3, 300, (t) => { const a = alphaS(10 ** t, nf); return [t, a > 0 && a < 0.6 ? a : NaN]; }).filter((q) => Number.isFinite(q[1])), { c: 'c1', w: 2.6 });
      if (nf !== 5) f.line(L.sample(0, 3.3, 300, (t) => { const a = alphaS(10 ** t, 5); return [t, a > 0 && a < 0.6 ? a : NaN]; }).filter((q) => Number.isFinite(q[1])), { c: 'muted', w: 1.4, dash: '5 4' });
      f.dot(Math.log10(MZ), AS_MZ, { c: 'ink', r: 4.5 }); f.text(Math.log10(MZ), AS_MZ, tx`\(\alpha_s(M_Z)=0.118\)`, { small: true, dy: -10, dx: 4, anchor: 'start' });
      f.dot(Math.log10(1.777), 0.32, { c: 'c2', r: 4.5, hollow: true }); f.text(Math.log10(1.777), 0.32, T(tx`measured in \(\tau\) decays`, tx`\(\tau\) の崩壊での測定`), { small: true, dy: -10, dx: 6, anchor: 'start', c: 'c2' });
      f.handle(v.lq, clamp(aQ, 0, 0.5), { c: 'hl', axis: 'x', bounds: [0, 3.3, 0, 0.5], label: tx`\(Q\)`, onDrag: (x) => ctx.set('lq', clamp(Math.round(x * 50) / 50, 0, 3.3)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The inverse couplings of the three gauge forces run in straight lines against \(\log\mu\). In the Standard Model they nearly, but not quite, meet. ${model ? 'With supersymmetric partners above the chosen mass the slopes change and the three lines cross almost at one point.' : 'Switch on supersymmetric partners to see the slopes change.'}`, tx`三つのゲージ力の結合定数の逆数は、\(\log\mu\) に対して直線的に変化します。標準模型ではほぼ一点で交わりますが、ぴったりではありません。${model ? '選んだ質量より上で超対称パートナーを入れると傾きが変わり、三本の線はほぼ一点で交わります。' : '超対称パートナーを入れると、傾きが変わる様子が見られます。'}`));
      const g = L.fig(c2, { x: [2, 18], y: [0, 65], aspect: 0.82, maxH: 380, xlabel: T(tx`\(\log_{10}\mu\) (GeV)`, tx`\(\log_{10}\mu\)（GeV）`), ylabel: tx`\(1/\alpha_i\)` });
      ['c2', 'c3', 'c1'].forEach((c, i) => g.line(L.sample(Math.log10(MZ), 18, 200, (t) => [t, invAlpha(10 ** t, model, msusy)[i]]), { c, w: 2.4 }));
      if (model) { g.vline(v.ms, { c: 'muted', dash: '3 4' }); g.text(v.ms, 63, tx`\(M_{\rm SUSY}\)`, { small: true, dx: 5, anchor: 'start', dy: 4 }); }
      const X = [crossing(0, 1, model, msusy), crossing(1, 2, model, msusy), crossing(0, 2, model, msusy)];
      [[0, 1], [1, 2], [0, 2]].forEach(([i], k) => { if (Number.isFinite(X[k]) && X[k] < 18) g.dot(X[k], invAlpha(10 ** X[k], model, msusy)[i], { c: 'hl', r: 4.5 }); });
      L.legend(ctx.host, [{ c: 'c1', label: T(tx`strong: \(\alpha_s\), \(1/\alpha_3\)`, tx`強い力：\(\alpha_s\)、\(1/\alpha_3\)`) }, { c: 'c3', label: T(tx`weak \(1/\alpha_2\)`, tx`弱い力 \(1/\alpha_2\)`) }, { c: 'c2', label: T(tx`hypercharge \(1/\alpha_1\) (with the factor \(\tfrac53\))`, tx`ハイパーチャージ \(1/\alpha_1\)（係数 \(\tfrac53\) を含む）`) }, { c: 'hl', kind: 'dot', label: T('pairwise crossings', '二本ずつの交点') }]);
      const spread = Math.max(...X) - Math.min(...X);
      ctx.readout([
        { k: tx`\(\alpha_s(Q)\) at \(Q=${fmt(Q, 3)}\ \mathrm{GeV}\)`, v: Number.isFinite(aQ) ? fmt(aQ, 4) : T('beyond the pole', '極の先'), tone: 'key' },
        { k: tx`\(b_0=11-\tfrac23n_f\)`, v: fmt(bb, 4), tone: bb > 0 ? 'good' : 'warn' },
        { k: T(tx`scale where the one-loop coupling diverges, \(\Lambda\)`, tx`1 ループの結合が発散するスケール \(\Lambda\)`), v: bb > 0 ? tx`\(${fmt(lambdaQCD(nf) * 1000, 3)}\ \mathrm{MeV}\)` : '–' },
        { k: T(tx`crossings \(\log_{10}\mu\): 1–2, 2–3, 1–3`, tx`交点の \(\log_{10}\mu\)：1–2、2–3、1–3`), v: X.map((x) => (Number.isFinite(x) ? fmt(x, 4) : '–')).join(', '), tone: spread < 0.6 ? 'good' : undefined },
      ], bb > 0 ? T('Asymptotic freedom: quarks inside a proton hit hard behave as almost free, while at about the proton’s own size the coupling grows strong and confines them. One loop only; the measured value at low energy is higher than this simple line.', '漸近的自由性：強く叩かれた陽子の中のクォークはほとんど自由にふるまい、陽子自身の大きさ程度のスケールでは結合が強くなってクォークを閉じ込めます。ここでは 1 ループだけなので、低エネルギーでの測定値はこの単純な曲線より大きくなります。') : T('With seventeen or more flavours the quarks’ screening would win, and the strong force would grow with energy as electromagnetism does.', 'フレーバーが 17 以上あると、クォークによる遮蔽が勝ち、強い力は電磁気力のようにエネルギーとともに強くなります。'));
    },
  };
})();
