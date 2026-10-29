// Adaptive-cycle engines: the bypass-free limit is the textbook ideal turbojet; the turbine supplies exactly the fan and
// compressor work; the kinetic energy added to the streams is the thermal efficiency times the fuel energy; propulsive
// efficiency reduces to 2/(1 + Vj/V0) for one stream and overall efficiency is V0 F / (f h); the optimum fan pressure
// ratio equalises the jets and maximises thrust; the optimum bypass ratio minimises TSFC with V9 = (V19 + V0)/2; more
// bypass lowers specific thrust always and TSFC up to that optimum; a three-stream engine with no third stream, or with
// both bypass streams at one pressure ratio, is the two-stream engine; the third stream absorbs Q = m cp dT; Breguet's
// mass history integrates the range equation; the mission radius uses exactly the fuel on board.
module.exports = (M, { ok, near }) => {
  const g = M.G, e = (g - 1) / g;
  // 1. alpha = 0 is the ideal turbojet: (V9/a0)^2 = 2/(g-1) [tl - tr (tc - 1) - tl/(tr tc)], f = cp T0 (tl - tr tc)/h
  for (const [M0, z, T4, pc] of [[0, 0, 1600, 20], [0.85, 11, 1700, 30], [2, 11, 1900, 12], [1.2, 5, 1500, 8]]) {
    const c = M.turbofan(M0, z, T4, pc, 3, 0), A = M.isa(z), tr = 1 + 0.2 * M0 * M0, tl = T4 / A.T, tc = pc ** e;
    const v9 = A.a * Math.sqrt(2 / (g - 1) * (tl - tr * (tc - 1) - tl / (tr * tc)));
    near(c.V9, v9, 1e-9 * v9); near(c.Fs, v9 - M0 * A.a, 1e-8);
    near(c.f, M.CP * A.T * (tl - tr * tc) / M.HPR, 1e-14);
    // the same jet from dimensional enthalpy: Tt5 = Tt4 - (Tt3 - Tt2), expanded through the total pressure ratio
    const Tt5 = T4 - A.T * tr * (tc - 1), Pratio = tr ** (1 / e) * pc * c.tt ** (1 / e);
    near(c.V9, Math.sqrt(2 * M.CP * Tt5 * (1 - Pratio ** -e)), 1e-6 * v9);
  }
  // 2. energy balance: turbine work = compressor + fan work; kinetic energy added = eta_T x fuel energy
  for (const [M0, z, T4, pc, pf, a] of [[0.85, 11, 1700, 30, 3, 0.8], [0, 0, 1500, 25, 1.6, 5], [1.5, 11, 2000, 30, 4.5, 0.4]]) {
    const c = M.turbofan(M0, z, T4, pc, pf, a); ok(c.ok, 'test engine runs');
    near(c.wt, c.wc + c.wf, 1e-6 * c.wt);
    near(c.KE / 2, c.f * M.HPR * c.etaT, 1e-6 * c.KE);
    if (M0 > 0) near(c.etaO, M0 * c.a0 * c.Fc / (c.f * M.HPR), 1e-9);
  }
  // 3. propulsive efficiency of one stream is 2/(1 + Vj/V0)
  { const c = M.turbofan(0.8, 9, 1600, 20, 3, 0); near(c.etaP, 2 / (1 + c.V9 / c.V0), 1e-12); }
  // 4. optimum fan pressure ratio: V19 = V9, and no other fan ratio gives more thrust
  for (const a of [2, 5, 8]) {
    const pf = M.optPf(0.85, 11, 1600, 30, a), c = M.turbofan(0.85, 11, 1600, 30, pf, a);
    near(c.V[0], c.V9, 1e-6 * c.V9);
    for (const d of [-0.05, 0.05]) { const o = M.turbofan(0.85, 11, 1600, 30, pf * (1 + d), a); ok(!o.ok || o.Fc < c.Fc, 'optimum fan maximises thrust'); }
  }
  // 5. optimum bypass ratio: minimum TSFC, where V9 = (V19 + V0)/2
  for (const [pf, T4] of [[1.8, 1600], [2.5, 1800], [3.5, 1700]]) {
    const as = M.optA(0.85, 11, T4, 30, pf), c = M.turbofan(0.85, 11, T4, 30, pf, as);
    near(c.V9, (c.V[0] + c.V0) / 2, 1e-6 * c.V9);
    let best = Infinity, ba = 0; for (let i = 1; i < 4000; i++) { const a = as * 2 * i / 4000, o = M.turbofan(0.85, 11, T4, 30, pf, a); if (o.ok && o.S < best) { best = o.S; ba = a; } }
    near(ba, as, 2e-3 * as + 1e-3);
    // 6. more bypass air: specific thrust falls everywhere, TSFC falls up to the optimum
    let lastF = Infinity, lastS = Infinity;
    for (let i = 0; i <= 50; i++) { const o = M.turbofan(0.85, 11, T4, 30, pf, as * i / 50); ok(o.Fs < lastF && o.S < lastS + 1e-15, 'monotone up to the optimum'); lastF = o.Fs; lastS = o.S; }
  }
  // 7. three streams reduce to two: no third stream, or both bypass streams at the same fan ratio
  {
    const a = M.cycle(0.9, 11, 1800, 30, [{ a: 0.4, pf: 3.8 }, { a: 0, pf: 2.2 }]), b = M.turbofan(0.9, 11, 1800, 30, 3.8, 0.4);
    near(a.Fc, b.Fc, 1e-9); near(a.S, b.S, 1e-15);
    const c = M.cycle(0.9, 11, 1800, 30, [{ a: 0.4, pf: 3 }, { a: 0.7, pf: 3 }]), d = M.turbofan(0.9, 11, 1800, 30, 3, 1.1);
    near(c.Fs, d.Fs, 1e-9); near(c.etaP, d.etaP, 1e-12);
  }
  // 8. the mode schedule keeps the inlet airflow; cruise mode trades thrust for TSFC; Q = m3 cp dT
  {
    const lo = M.three(0.9, 11, 1800, 0), hi = M.three(0.9, 11, 1800, 1);
    near(lo.mc + lo.m2 + lo.m3, M.SCH.m0, 1e-9); near(hi.mc + hi.m2 + hi.m3, M.SCH.m0, 1e-9);
    ok(hi.F < lo.F && hi.S < lo.S, 'cruise mode: less thrust, less fuel per newton');
    const q = M.three(0.9, 11, 1800, 0.6, 450);
    near(q.m3 * M.CP * q.dT, 450e3, 1e-6); near(M.heatCap(q.m3, q.dT), 450, 1e-9);
    ok(q.V[1] > M.three(0.9, 11, 1800, 0.6, 0).V[1], 'heat added to the third stream speeds its jet');
  }
  // 9. Breguet: the closed-form mass history integrates dm/dx = -g S m / (V L/D), and inverts the log range formula
  {
    const S = 2.4e-5, V = 265, LD = 9; let m = 30000; const n = 20000, X = 2e6;
    for (let i = 0; i < n; i++) { const h = X / n, k = (mm) => -9.80665 * S * mm / (V * LD); const k1 = k(m), k2 = k(m + h * k1 / 2), k3 = k(m + h * k2 / 2), k4 = k(m + h * k3); m += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; }
    near(m, M.breguetMass(30000, X, S, V, LD), 1e-6);
    near(M.breguetRange(S, V, LD, 30000, m), X, 1e-3);
  }
  // 10. the mission radius burns exactly the usable fuel, and the adaptive engine reaches farther than the low-bypass one
  {
    const ms = M.mission(1800, 9, 0.3, 50000, 240);
    for (const E of ms.eng) near(M.flyMission(E, 9, 50000, 240, E.R).m3, 30000 * 0.7, 1e-3);
    ok(ms.eng[0].can && !ms.eng[1].can && ms.eng[2].can, 'only the low-bypass and adaptive engines make the dash');
    ok(ms.eng[2].R > ms.eng[0].R && ms.fuelSave > 0 && ms.fuelSave < ms.tsfcSave, 'adaptive engine flies farther, dash fuel unchanged');
  }
};
