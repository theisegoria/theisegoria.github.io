// Electric motors: the balanced three-phase field has constant magnitude 3/2 and turns at ω; forward/backward decomposition matches the
// locus; DC motor steady state, maximum-power and maximum-efficiency closed forms, the transient settling to the steady state;
// induction motor torque from the full circuit against the Thevenin breakdown formula, R2/s scaling, power balance and generating sign.
module.exports = (M, { ok, near }) => {
  // 1. rotating field
  const bal = M.supply(0);
  for (let t = 0; t < 6.3; t += 0.37) { const [x, y] = M.fieldVec(bal, t); near(Math.hypot(x, y), 1.5, 1e-12); near(Math.atan2(y, x), Math.atan2(Math.sin(t), Math.cos(t)), 1e-12); }
  { const [x, y] = M.fieldVec(M.supply(2), 1); near(Math.atan2(y, x), -1, 1e-12); }
  { const q = M.sequences(M.supply(3)); near(q.F, 0.5, 1e-12); near(q.B, 0.5, 1e-12); let mn = 9; for (let t = 0; t < 6.3; t += 0.01) mn = Math.min(mn, Math.abs(M.fieldVec(M.supply(3), t)[1])); near(mn, 0, 1e-12); }
  { const s = M.supply(1, 0.5), q = M.sequences(s); near(q.F, 1.25, 1e-12); near(q.B, 0.25, 1e-12); let mx = 0, mn = 9; for (let t = 0; t < 6.3; t += 0.001) { const m = Math.hypot(...M.fieldVec(s, t)); mx = Math.max(mx, m); mn = Math.min(mn, m); } near(mx, q.F + q.B, 1e-5); near(mn, q.F - q.B, 1e-5); }
  // air-gap field peaks where the field vector points, divided by p
  { const p = 2, t = 0.8, [x, y] = M.fieldVec(bal, t), th = Math.atan2(y, x) / p; near(M.airgap(bal, t, th, p), 1.5, 1e-12); }
  // 2. DC motor
  const m = M.DCM, V = 12, R = 0.6;
  { const o = M.dcSteady(V, R, 0.1); near(o.I, 5.5, 1e-12); near(o.w, 435, 1e-9); near(o.Pout, 43.5, 1e-9); near(V - R * o.I - m.k * o.w, 0, 1e-12); }
  { const st = M.dcSteady(V, R, 0).stall; near(st, 0.39, 1e-12); near(M.dcSteady(V, R, st).w, 0, 1e-9);
    let best = 0, bt = 0, bp = 0, bpt = 0; for (let i = 1; i < 4000; i++) { const T = (st * i) / 4000, o = M.dcSteady(V, R, T); if (o.eta > best) { best = o.eta; bt = T; } if (o.Pout > bp) { bp = o.Pout; bpt = T; } }
    const em = M.dcEtaMax(V, R); near(best, em.eta, 1e-6); near(bt, em.T, 2e-4); near(bpt, st / 2, 2e-4); }
  { const tr = M.dcSpinUp(V, R, 0.1, 0.4, 2000), last = tr[tr.length - 1]; near(last.w, 435, 0.5); near(last.i, 5.5, 0.01); ok(Math.max(...tr.map((o) => o.i)) > 15, 'inrush current'); }
  { const tr = M.dcSpinUp(V, R, 0.5, 0.05, 200); ok(tr.every((o) => o.w === 0), 'stalled under a load above stall torque'); }
  // 3. induction motor
  for (const [f, rr] of [[50, 1], [50, 3], [25, 1], [60, 0.7]]) {
    const b = M.imBreakdown(f, rr); let best = 0, bs = 0; for (let i = 1; i <= 20000; i++) { const s = i / 20000, T = M.imCircuit(s, f, rr).T; if (T > best) { best = T; bs = s; } }
    near(best, b.Tm, 1e-6 * b.Tm); near(bs, b.sm, 1e-4);
  }
  near(M.imBreakdown(50, 1).Tm, M.imBreakdown(50, 4).Tm, 1e-9);
  // R2/s scaling: same torque at twice the slip with twice the rotor resistance
  near(M.imCircuit(0.05, 50, 1).T, M.imCircuit(0.1, 50, 2).T, 1e-9);
  { const o = M.imCircuit(0.03); near(o.Pag, o.T * o.ws, 1e-6); near(o.Pmech, o.Pag * 0.97, 1e-6); ok(o.Pin > o.Pag && o.Pag > o.Pmech, 'losses in stator and rotor copper');
    // input power = air-gap power + stator copper loss
    near(o.Pin, o.Pag + 3 * o.I1 ** 2 * M.IM.R1, 1e-6 * o.Pin); }
  ok(M.imCircuit(-0.03).T < 0, 'generating above synchronous speed'); near(M.imCircuit(0).T, 0, 1e-15);
  near(M.imOperate(() => M.T_RATED), 0.03, 1e-9); ok(M.imOperate(() => 1.1 * M.imBreakdown().Tm) === null, 'stalls above breakdown');
};
