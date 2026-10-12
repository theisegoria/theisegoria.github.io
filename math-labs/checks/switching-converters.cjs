// Switching converters: the simulated buck settles to V = D Vin with the textbook current and voltage ripple in continuous conduction, to the discontinuous-conduction ratio when the diode cuts off, and stays continuous with a synchronous switch; the lossy conversion ratios obey power balance, the boost peak is 1/(2 sqrt a), and the DCM formula meets the CCM line at K = 1 - D.
module.exports = (M, { ok, near }) => {
  const base = { Vin: 12, D: 0.42, L: 10e-6, C: 47e-6, R: 2, fs: 200e3, sync: false };
  // 1. continuous conduction: averages, ripple, volt-second balance
  { const S = M.buckSteady(base, 30, 600);
    near(S.Vavg / (base.D * base.Vin), 1, 2e-3); near(S.Iavg, S.Vavg / base.R, 2e-3 * S.Iavg);
    const dI = M.buckRipple(base.Vin, base.D, base.L, base.fs); near((S.ipk - S.imin) / dI, 1, 0.02);
    near(S.vpp / M.buckVRipple(dI, base.fs, base.C), 1, 0.08);
    near(S.i[0], S.i[S.i.length - 1], 1e-3 * S.Iavg); ok(S.imin > 0, 'continuous conduction keeps the current positive'); }
  // 2. discontinuous conduction with a diode; synchronous rectification restores M = D
  { const p = Object.assign({}, base, { L: 2e-6, R: 20 }), K = (2 * p.L) / (p.R / p.fs), S = M.buckSteady(p, 30, 600);
    ok(K < M.kCrit(p.D), 'this load is in discontinuous conduction'); near(S.Vavg / p.Vin, M.dcmRatio(p.D, K), 4e-3); ok(S.imin >= 0 && S.i.filter((x) => x === 0).length > 50, 'current sits at zero for part of the period');
    const Q = M.buckSteady(Object.assign({}, p, { sync: true }), 30, 600); near(Q.Vavg / (p.D * p.Vin), 1, 4e-3); ok(Q.imin < 0, 'synchronous switch lets the current reverse'); }
  // 3. conversion ratios: ideal limits, power balance with winding loss, boost peak
  near(M.ratio(1, 0.5).M, 2, 1e-12); near(M.ratio(2, 0.5).M, -1, 1e-12); near(M.ratio(0, 0.3).M, 0.3, 1e-12);
  for (const [type, Dc, a] of [[1, 0.7, 0.02], [2, 0.6, 0.05], [0, 0.4, 0.03]]) {
    // input current: boost = I/(1-D), buck-boost = D I/(1-D) from the source with inductor current I/(1-D); buck = D I with inductor current I
    const r = M.ratio(type, Dc, a), R = 1, V = r.M, I = V / R, iL = type === 0 ? I : I / (1 - Dc), Pin = type === 1 ? iL : type === 2 ? Dc * Math.abs(iL) : Dc * iL; // V_in = 1
    near(V * V / R + iL * iL * a * R, Math.abs(Pin), 1e-9); near(r.eta, (V * V) / Math.abs(Pin), 1e-9);
  }
  { const a = 0.01, pk = M.boostMax(a); let best = 0; for (let k = 0; k < 100000; k++) best = Math.max(best, M.ratio(1, k / 100000, a).M); near(best, pk.M, 1e-6); near(M.ratio(1, pk.D, a).M, pk.M, 1e-12); near(pk.M, 5, 1e-12); }
  // 4. DCM: boundary continuity, light-load limit, D2 volt-second balance
  for (const Dc of [0.2, 0.5, 0.8]) { near(M.dcmRatio(Dc, M.kCrit(Dc)), Dc, 1e-12); const K = 0.1 * M.kCrit(Dc), m = M.dcmRatio(Dc, K); ok(m > Dc && m < 1, 'DCM output above D'); near((1 - m) * Dc, m * M.dcmD2(Dc, m), 1e-12); near(M.dcmRatio(Dc, 1e-9), 1, 1e-4); }
};
