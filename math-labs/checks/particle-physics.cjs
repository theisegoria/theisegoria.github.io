// Particle physics: two-body decays conserve energy and momentum and return the parent's mass as the invariant mass for
// every momentum and decay angle; rest-frame momentum and the Z muon energy have their closed forms; tracks are circles
// of radius pT/(0.2998 B) that bend opposite ways for opposite charges; the sagitta formula agrees with the circle;
// quark weights reproduce the charges of the hadrons (Gell-Mann and Nishijima), the multiplets have 9, 8 and 10 states,
// and the Gell-Mann and Okubo and equal-spacing relations hold to the known accuracy; one-loop running reproduces
// alpha_s(MZ), asymptotic freedom below 16.5 flavours, the Lambda parameter, and the unification scales.
module.exports = (M, { ok, near, values }) => {
  for (const P of M.PART) for (const p of [0, 0.7, 12, 300]) for (const c of [-1, -0.4, 0.3, 1]) {
    const d = M.decay(P.M, P.m, p, c, 0.8);
    near(M.invMass(d.p1, d.p2), P.M, 1e-7 * Math.max(1, p)); near(d.p1[0] + d.p2[0], Math.hypot(p, P.M), 1e-9 * Math.max(1, p));
    near(d.p1[1] + d.p2[1], p, 1e-9 * Math.max(1, p)); near(d.p1[2] + d.p2[2], 0, 1e-12); near(d.p1[3] + d.p2[3], 0, 1e-12);
    near(d.p1[0] ** 2 - d.p1[1] ** 2 - d.p1[2] ** 2 - d.p1[3] ** 2, P.m ** 2, 1e-6 * Math.max(1, p * p));
  }
  near(M.pStar(91.1876, 0.1056584), Math.sqrt(91.1876 ** 2 / 4 - 0.1056584 ** 2), 1e-10); near(M.pStar(0.497611, 0.13957), 0.20597, 1e-4);
  near(M.pStar(1.115683, 0.938272, 0.13957), 0.1006, 2e-4);                    // Lambda -> p pi-, PDG p* = 101 MeV
  near(M.radius(1, 1), 3.3356, 1e-3); near(M.radius(45.59, 2), 76.03, 0.02);
  { // a track is a circle of the stated radius, turning clockwise for positive charge
    const t = M.track([1, 0.3, 0.2, 0.05], 1, 2), R = t.R, pT = Math.hypot(0.3, 0.2); near(R, pT / (M.C * 2), 1e-12);
    const cx = (0.2 / pT) * R, cy = -(0.3 / pT) * R;          // centre: to the right of the initial direction
    let worst = 0; for (const q of t.pts) { if (Math.hypot(q[0], q[1]) <= M.R_SOL) worst = Math.max(worst, Math.abs(Math.hypot(q[0] - cx, q[1] - cy) - R)); } ok(worst < 1e-9, 'helix is a circle inside the solenoid');
    const tn = M.track([1, 0.3, 0.2, 0.05], -1, 2); ok(t.pts[20][0] * 0.2 - t.pts[20][1] * 0.3 > 0 && tn.pts[20][0] * 0.2 - tn.pts[20][1] * 0.3 < 0, 'opposite charges bend opposite ways');
    near(t.pts[40][2] / 0.4, 0.05 / pT, 1e-9);
    ok(M.track([1, 0.1, 0, 0], 1, 2).looper && !t.looper, 'a soft track curls up inside the tracker');
  }
  { const R = 76.03, Lc = 1.1; near(M.sagitta(45.59, 2, Lc), R - Math.sqrt(R * R - (Lc / 2) ** 2), 1e-6); }
  values(M.MULT.map((m) => m.states.length), [9, 8, 10]);
  const charge = { 'pi+': 1, 'pi-': -1, 'K+': 1, K0: 0, K0bar: 0, 'K-': -1, pi0: 0, eta: 0, etap: 0, p: 1, n: 0, Lambda: 0, 'Sigma+': 1, Sigma0: 0, 'Sigma-': -1, Xi0: 0, 'Xi-': -1, 'Delta++': 2, 'Delta+': 1, Delta0: 0, 'Delta-': -1, 'Sigma*+': 1, 'Sigma*0': 0, 'Sigma*-': -1, 'Xi*0': 0, 'Xi*-': -1, 'Omega-': -1 };
  for (const m of M.MULT) for (const s of m.states) { near(s.Q, charge[s.name], 1e-12); near(s.Q, s.i3 + s.y / 2, 1e-12); }
  for (const s of M.MULT[1].states) near(s.y, 1 + s.S, 1e-12);                                  // Y = B + S for baryons
  values(M.lookup(1, ['s', 'u', 'd']).map((s) => s.name), ['Lambda', 'Sigma0']); values(M.lookup(1, ['u', 'u', 'u']).map((s) => s.name), []);
  values(M.lookup(2, ['s', 's', 's']).map((s) => s.name), ['Omega-']); values(M.lookup(0, ['u', 's', 'u']).map((s) => s.name), ['K+']); values(M.lookup(0, ['s', 'd', 'u']).map((s) => s.name), ['K0bar']);
  ok(M.lookup(0, ['d', 'd', 'u']).length === 3, 'three neutral mesons at the centre');
  { const G = M.gmoOctet(); ok(Math.abs(G.lhs - G.rhs) / G.rhs < 0.007 && Math.abs(G.lhs - G.rhs) / G.rhs > 0.004, 'Gell-Mann and Okubo to 0.6%'); }
  { const d = M.DEC(), pred = 2 * d[2] - d[1]; ok(Math.abs(pred - d[3]) < 12 && Math.abs(pred - d[3]) > 5, 'equal spacing predicts the Omega within 10 MeV'); ok(Math.abs(d[1] - d[0] - (d[2] - d[1])) < 6, 'decuplet steps are equal'); }
  ok(Math.abs(M.gmoEta() - 547.862) / 547.862 < 0.04, 'eta mass from the meson mass formula');
  near(M.alphaS(M.MZ), 0.118, 1e-12); near(M.b0(5), 23 / 3, 1e-12); near(M.b0(16.5), 0, 1e-12);
  near(1 / M.alphaS(10), 1 / 0.118 + (23 / (6 * Math.PI)) * Math.log(10 / 91.1876), 1e-9);
  ok(M.alphaS(1000) < M.alphaS(100) && M.alphaS(100) < M.alphaS(10), 'asymptotic freedom'); ok(M.alphaS(1000, 17) > M.alphaS(100, 17), 'seventeen flavours: the coupling grows');
  ok(!Number.isFinite(M.alphaS(M.lambdaQCD(5) * 0.999999)) || M.alphaS(M.lambdaQCD(5) * 1.000001) > 1e3, 'the one-loop coupling diverges at Lambda');
  near(M.INV_MZ[0], 59.02, 0.01); near(M.INV_MZ[1], 29.58, 0.01); near(M.INV_MZ[2], 8.4746, 1e-3);
  { const a = M.invAlpha(M.MZ, 0); for (let i = 0; i < 3; i++) near(a[i], M.INV_MZ[i], 1e-12); }
  { const a = M.invAlpha(1e16, 0), b = M.invAlpha(1e15, 0); for (let i = 0; i < 3; i++) near(a[i] - b[i], (-M.B_SM[i] / (2 * Math.PI)) * Math.LN10, 1e-9); }
  { const x = M.crossing(0, 1, 0), a = M.invAlpha(10 ** x, 0); near(a[0], a[1], 1e-6); near(x, 13.01, 0.02); }
  { const X0 = [M.crossing(0, 1, 0), M.crossing(1, 2, 0), M.crossing(0, 2, 0)], X1 = [M.crossing(0, 1, 1, 1000), M.crossing(1, 2, 1, 1000), M.crossing(0, 2, 1, 1000)];
    const sp = (X) => Math.max(...X) - Math.min(...X); ok(sp(X1) < 0.5 && sp(X0) > 3, 'the supersymmetric slopes bring the three crossings together'); ok(X1.every((x) => x > 15.8 && x < 16.6), 'near 10^16 GeV'); }
  { const m = M.sampleMasses(3, 0, 2, 4000), mean = m.slice().sort((a, b) => a - b)[2000]; near(mean, 91.1876, 0.15); }
};
