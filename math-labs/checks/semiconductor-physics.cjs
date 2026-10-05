// Semiconductor physics: silicon band gap and intrinsic density against Green (1990), mass-action law and charge neutrality, freeze-out / extrinsic / intrinsic regimes, the abrupt junction against its closed forms and Poisson's equation, and the Shockley diode (open-circuit voltage, fill factor, temperature coefficient).
module.exports = (M, { ok, near }) => {
  // 1. band gap and ni
  near(M.Eg(0), 1.17, 1e-12); near(M.Eg(300), 1.1245, 1e-4); near(M.ni(300) / 1.08e10, 1, 0.03);
  near((M.Eg(300.001) - M.Eg(299.999)) / 0.002, M.dEgdT(300), 1e-9);
  // charge neutrality and np = ni^2 at every temperature
  for (const T of [40, 100, 300, 600]) for (const [Nd, Na] of [[1e16, 0], [0, 1e15], [3e17, 0]]) { const c = M.carriers(T, Nd, Na); near((c.n * c.p) / M.ni(T) ** 2, 1, 1e-9); near((c.p + M.ndPlus(c.EF, T, Nd) - c.n - M.naMinus(c.EF, T, Na)) / Math.max(Nd, Na), 0, 1e-9); }
  // regimes: freeze-out at 50 K, full ionisation at 300 K, intrinsic at 700 K for 1e15
  { const c50 = M.carriers(50, 1e16, 0), c300 = M.carriers(300, 1e16, 0), c700 = M.carriers(700, 1e15, 0);
    ok(c50.n < 0.2 * 1e16, 'freeze-out at 50 K'); near(c300.n / 1e16, 1, 0.01); ok(c700.n > 3 * 1e15, 'intrinsic at 700 K');
    near(M.carriers(300, 0, 0).n / M.ni(300), 1, 1e-9); // undoped: n = p = ni
    // n-type Fermi level above midgap, p-type below; Ec - EF = kT ln(Nc/n) in the extrinsic range
    ok(c300.EF > M.Eg(300) / 2 && M.carriers(300, 0, 1e16).EF < M.Eg(300) / 2, 'Fermi level on the majority side'); near(M.Eg(300) - c300.EF, M.KB * 300 * Math.log(M.Nc(300) / c300.n), 1e-9);
    // low-temperature freeze-out law: n ~ sqrt(Nc Nd / 2) exp(-Ed / 2kT)
    const T = 30, c = M.carriers(T, 1e16, 0); near(Math.log(c.n / (Math.sqrt((M.Nc(T) * 1e16) / 2) * Math.exp(-0.045 / (2 * M.KB * T)))), 0, 0.05); }
  // Fermi function symmetry
  near(M.fermi(0.5, 0.5, 300), 0.5, 1e-12); near(M.fermi(0.6, 0.5, 300) + M.fermi(0.4, 0.5, 300), 1, 1e-12);
  // 2. junction: closed forms, continuity, Poisson
  { const J = M.junction(1e17, 1e16, 0); near(J.Vbi, M.KB * 300 * Math.log(1e33 / M.ni(300) ** 2), 1e-12); near(J.Vbi, 0.770, 0.005); near(J.W * 1e4, 0.331, 0.002);
    near(1e17 * J.xp, 1e16 * J.xn, 1e3); near(J.U(-J.xp), J.Vbi, 1e-12); near(J.U(J.xn), 0, 1e-12);
    // potential continuous at 0 and field continuous at 0
    near(J.U(-1e-12), J.U(1e-12), 1e-6); near(J.field(-1e-12), J.field(1e-12), 1e-3 * J.Emax); near(J.field(0), J.Emax, 1e-6 * J.Emax);
    // Poisson: dU/dx = field (energy in eV per cm vs V/cm), d field/dx = rho / eps
    const h = 1e-8, x = 0.5 * J.xn; near((J.U(x + h) - J.U(x - h)) / (2 * h), -J.field(x), 1e-4 * J.Emax); near((J.field(x + h) - J.field(x - h)) / (2 * h), (-M.Q * 1e16) / M.EPS, 1e-4 * (M.Q * 1e16) / M.EPS);
    // reverse bias widens as sqrt(Vbi - V); C = eps / W
    const Jr = M.junction(1e17, 1e16, -3); near(Jr.W / J.W, Math.sqrt((J.Vbi + 3) / J.Vbi), 1e-12); near(J.C, M.EPS / J.W, 1e-20);
    // the band edges far away: Ec - EF = kT ln(Nc/Nd), EF - Ev = kT ln(Nv/Na), and the total bending recovers Vbi
    near(J.EcN + J.Vbi - M.Eg(300) + J.EvP, 0, 1e-9); }
  // 3. diode
  { near(M.diodeI(0, 300, 1, 0), 0, 1e-20); near(M.diodeI(-1, 300, 1, 0), -M.Is(300), 1e-25); near(M.Is(300), 1e-12, 1e-24);
    const Vo = M.voc(300, 1, 0.04); near(M.diodeI(Vo, 300, 1, 0.04), 0, 1e-12); near(Vo, 0.631, 0.002);
    const mp = M.maxPower(300, 1, 0.04), voc = Vo / (M.KB * 300), ffGreen = (voc - Math.log(voc + 0.72)) / (voc + 1); near(mp.P / (Vo * 0.04), ffGreen, 0.005);
    // at the maximum, dP/dV = 0
    const P = (V) => -V * M.diodeI(V, 300, 1, 0.04); near((P(mp.V + 1e-4) - P(mp.V - 1e-4)) / 2e-4, 0, 1e-4);
    // ideal diode: 59.5 mV per decade at 300 K
    near((M.vAtCurrent(1e-2, 300, 1) - M.vAtCurrent(1e-3, 300, 1)) * 1000, 59.52, 0.05);
    // temperature coefficient at fixed current: (V - Eg + T dEg/dT - 3kT) / T
    const V = M.vAtCurrent(1e-3, 300, 1), num = (M.vAtCurrent(1e-3, 300.5, 1) - M.vAtCurrent(1e-3, 299.5, 1)); near(num, (V - M.Eg(300) + 300 * M.dEgdT(300) - 3 * M.KB * 300) / 300, 1e-7); ok(num < -0.0018 && num > -0.0028, 'about -2 mV/K'); }
};
