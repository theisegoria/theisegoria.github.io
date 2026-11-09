// Neuron biophysics: RT/F and the Nernst potentials of a mammalian neuron match textbook values; GHK reduces to Nernst
// when one ion dominates and lies between E_K and E_Na; the HH rest state is a fixed point near -65 mV; a strong pulse
// fires one spike peaking near +40 mV and a weak one none; the computed threshold separates them; a second pulse
// during refractoriness fails and later succeeds; warming raises the threshold; the cable solution satisfies
// lambda^2 V'' = V, has zero slope at sealed ends, peaks at the electrode and lambda goes as sqrt(d).
module.exports = (M, { ok, near }) => {
  near(M.RTF(37), 26.727, 0.002);
  near(M.nernst(5, 140, 1), -89.06, 0.02); near(M.nernst(145, 12, 1), 66.60, 0.02); near(M.nernst(110, 7, -1), -73.62, 0.02);
  const I = M.ION;
  near(M.ghk(I, { K: 1, Na: 0, Cl: 0 }), M.nernst(I.Ko, I.Ki, 1), 1e-9);
  near(M.ghk(I, { K: 0, Na: 1, Cl: 0 }), M.nernst(I.Nao, I.Nai, 1), 1e-9);
  const Vr = M.ghk(I, { K: 1, Na: 0.04, Cl: 0.45 }); near(Vr, -69.8, 0.1); ok(Vr > M.nernst(5, 140, 1) && Vr < M.nernst(145, 12, 1), 'GHK between');
  // rest is a fixed point
  const g = M.steady(-65), d = M.deriv([-65, g.m, g.h, g.n], 0, 1); near(d[0], 0, 0.02); near(d[1], 0, 1e-12); near(d[3], 0, 1e-12);
  const quiet = M.simulate([], { tEnd: 30 }); near(quiet.V[quiet.V.length - 1], -65, 0.1);
  const s1 = M.simulate([{ t0: 5, w: 1, amp: 10 }]); near(M.spikes(s1.V), 1, 0.5); near(Math.max(...s1.V), 39, 3);
  const s0 = M.simulate([{ t0: 5, w: 1, amp: 4 }]); near(M.spikes(s0.V), 0, 0.5);
  const thr = M.threshold(1, 6.3); near(thr, 6.91, 0.1);
  near(M.spikes(M.simulate([{ t0: 5, w: 1, amp: thr * 1.02 }]).V), 1, 0.5); near(M.spikes(M.simulate([{ t0: 5, w: 1, amp: thr * 0.98 }]).V), 0, 0.5);
  near(M.spikes(M.simulate([{ t0: 5, w: 1, amp: 10 }, { t0: 9, w: 1, amp: 10 }]).V), 1, 0.5);
  near(M.spikes(M.simulate([{ t0: 5, w: 1, amp: 10 }, { t0: 30, w: 1, amp: 10 }]).V), 2, 0.5);
  ok(M.threshold(1, 18.5) > thr, 'warming raises threshold');
  near(M.lambda(20000, 2), 1, 1e-12); near(M.lambda(20000, 8) / M.lambda(20000, 2), 2, 1e-12);
  for (const [x0, Lc, lam] of [[0, 2, 1], [0.7, 3, 0.8], [2.4, 2.5, 1.3]]) {
    near(M.cableV(x0, x0, Lc, lam), 1, 1e-12);
    const h = 1e-3;
    for (const x of [0.2 * Lc, 0.55 * Lc, 0.9 * Lc]) { if (Math.abs(x - x0) < 3 * h) continue; const V2 = (M.cableV(x + h, x0, Lc, lam) - 2 * M.cableV(x, x0, Lc, lam) + M.cableV(x - h, x0, Lc, lam)) / (h * h); near(lam * lam * V2, M.cableV(x, x0, Lc, lam), 1e-4); }
    if (x0 > 0) near((M.cableV(h, x0, Lc, lam) - M.cableV(0, x0, Lc, lam)) / h, 0, 2e-3);
    if (x0 < Lc) near((M.cableV(Lc, x0, Lc, lam) - M.cableV(Lc - h, x0, Lc, lam)) / h, 0, 2e-3);
  }
  near(M.cableV(2, 0, 2, 1), 1 / Math.cosh(2), 1e-12);
  // the soma load: Rall's boundary condition V'(0) = rho V(0)/lambda, and rho = 1 makes the soma look like an infinite cable
  for (const rho of [0.5, 1, 3]) {
    const lam = 0.9, Lc = 2.2, x0 = 1.4, h = 1e-5, V0 = M.cableV(0, x0, Lc, lam, rho);
    near((M.cableV(h, x0, Lc, lam, rho) - V0) / h, (rho / lam) * V0, 2e-4);
    for (const x of [0.4, 1.0, 1.8]) { const hh = 1e-3, V2 = (M.cableV(x + hh, x0, Lc, lam, rho) - 2 * M.cableV(x, x0, Lc, lam, rho) + M.cableV(x - hh, x0, Lc, lam, rho)) / (hh * hh); near(lam * lam * V2, M.cableV(x, x0, Lc, lam, rho), 1e-4); }
  }
  near(M.cableV(0, 2, 2, 1, 1), Math.exp(-2), 1e-12); near(M.cableV(0, 2, 2, 1, 3), 1 / (Math.cosh(2) + 3 * Math.sinh(2)), 1e-12);
};
