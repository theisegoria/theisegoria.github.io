// Stirling engines: the Schmidt closed forms equal the numeric loop integrals of p dVe, p dVc and p dV of the model's own
// pressure; with isothermal spaces the cycle efficiency W/Qe is exactly Carnot; the work vanishes at alpha = 0 and 180
// degrees; the masses in the five spaces always add up to the charge and the mean of p over a cycle is the given p_mean;
// p_min and p_max bound the pressure; the ideal Stirling cycle with a perfect regenerator equals Carnot, with no
// regenerator it follows the eps = 0 formula, and eta rises monotonically with eps; for equal cylinders the best phase
// sits near 90 degrees and moves towards 90 as dead space grows; the worked examples reproduce.
module.exports = (M, { ok, near }) => {
  const PI = Math.PI, DEG = PI / 180;
  const cases = [
    { Vswc: 1, Vswe: 1, Vclc: 0.1, Vcle: 0.1, Vk: 0.15, Vr: 0.4, Vh: 0.2, Tk: 300, Th: 900, alpha: 90 * DEG, pmean: 1 },
    { Vswc: 0.6, Vswe: 1, Vclc: 0, Vcle: 0, Vk: 0, Vr: 0, Vh: 0, Tk: 320, Th: 700, alpha: 70 * DEG, pmean: 2 },
    { Vswc: 2, Vswe: 1, Vclc: 0.05, Vcle: 0.2, Vk: 0.3, Vr: 0.8, Vh: 0.1, Tk: 290, Th: 1100, alpha: 120 * DEG, pmean: 0.5 },
  ];
  for (const o of cases) {
    const E = M.schmidt(o), n = 6000;
    near(M.loopWork(E, 'e', n), E.We, 1e-6 * Math.abs(E.We) + 1e-9);
    near(M.loopWork(E, 'c', n), E.Wc, 1e-6 * Math.abs(E.Wc) + 1e-9);
    near(M.loopWork(E, 'total', n), E.W, 1e-6 * Math.abs(E.W) + 1e-9);
    ok(E.W > 0 && E.Wc < 0 && E.We > 0, 'an engine: expansion gives work, compression takes some back');
    near(E.W / E.We, 1 - o.Tk / o.Th, 1e-12);                                 // isothermal Schmidt engine is Carnot
    // mass conservation: the five spaces always hold the whole charge
    for (const t of [0, 0.7, 2.1, 3.9, 5.5]) { const m = E.masses(t); near(m.c + m.k + m.r + m.h + m.e, 1 / 1, 1e-12); }
    // the mean pressure over a cycle is p_mean
    let pm = 0; for (let i = 0; i < n; i++) pm += E.p((2 * PI * (i + 0.5)) / n) / n; near(pm, o.pmean, 1e-9 * o.pmean);
    let lo = Infinity, hi = -Infinity; for (let i = 0; i < 720; i++) { const p = E.p((2 * PI * i) / 720); lo = Math.min(lo, p); hi = Math.max(hi, p); }
    ok(lo >= E.pmin * (1 - 1e-9) && hi <= E.pmax * (1 + 1e-9) && hi > E.pmax * 0.999, 'p_min and p_max bound the pressure');
    // the gas law in each space: p V = m R T, with the charge fixed by p_mean
    { const t = 1.3, m = E.masses(t); near(E.p(t) * E.Vc(t), m.c * E.MR * o.Tk, 1e-9 * E.p(t) * E.Vc(t) + 1e-15); }
    // zero work in phase and in opposition
    // (with no dead space at all an in-phase engine squeezes the gas to zero volume, so test those with dead space)
    if (o.Vk + o.Vr + o.Vh + o.Vclc + o.Vcle > 0) { near(M.schmidt({ ...o, alpha: 0 }).W, 0, 1e-12); near(M.schmidt({ ...o, alpha: PI }).W, 0, 1e-12); }
    // running backwards makes a heat pump: negative work
    ok(M.schmidt({ ...o, alpha: -o.alpha }).W < 0, 'reversed phase absorbs work');
  }
  // no temperature difference, no work
  near(M.schmidt({ ...cases[0], Th: 300 }).W, 0, 1e-12);
  // ideal Stirling with perfect regeneration equals Carnot; with none it follows the eps = 0 formula
  for (const [Th, Tc, r, g] of [[900, 300, 2, 0], [600, 330, 3.5, 1], [1100, 290, 1.5, 2]]) {
    const G = M.GASES[g], R1 = M.regen(1, Th, Tc, r, G), R0 = M.regen(0, Th, Tc, r, G);
    near(R1.eta, 1 - Tc / Th, 1e-12);
    near(R0.eta, ((Th - Tc) * Math.log(r)) / (Th * Math.log(r) + (Th - Tc) / (G.g - 1)), 1e-12);
    near(R0.eta, M.etaRegen(0, Th, Tc, r, G.g), 1e-12);
    let prev = -1; for (let e = 0; e <= 1.0001; e += 0.05) { const x = M.regen(Math.min(1, e), Th, Tc, r, G).eta; ok(x > prev, 'efficiency rises with regenerator effectiveness'); prev = x; }
    near(R1.Tout, Th, 1e-12); near(R0.Tout, Tc, 1e-12);
    // ideal cycle work is the same Schmidt-independent R (Th - Tc) ln r
    near(M.idealStirling(G.R, Tc, Th, 1, r).W, R1.W, 1e-9 * R1.W);
  }
  // best phase for equal cylinders: under 90 degrees with no dead space, approaching 90 as dead space grows
  const a0 = M.optimum(0, 1 / 3, 0, 1).alpha, a1 = M.optimum(0.5, 1 / 3, 0, 1).alpha, a2 = M.optimum(2, 1 / 3, 0, 1).alpha;
  ok(a0 > 70 && a0 < 85 && a1 > a0 && a2 > a1 && a2 < 90.5 && Math.abs(a2 - 90) < 2, 'Schmidt optimum phase near 90 degrees for equal volumes');
  // worked examples
  { const E = M.engine(90, 900, 300); near(E.W, 53.75, 0.01); near(E.We, 80.62, 0.01); near(E.pmax / 1e5, 16.29, 0.01); near(E.b, 0.4525, 1e-4); }
  { const R = M.regen(0.9, 900, 300, 2); near(R.eta, 0.5826, 1e-4); near(R.Qreg / 1e3, 1869.3, 0.1); }
  near(M.workMap(90, 1, 0.5, 1 / 3, 0), 0.2932, 1e-4);
};
