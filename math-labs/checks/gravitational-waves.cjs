// Gravitational waves: TT displacement is traceless (area-preserving to first order) and the cross pattern is the plus
// pattern rotated by 45°; leading-order inspiral: f(tau) and tau(f) invert each other, dPhi/dt = 2 pi f, the geometric
// and physical clocks agree, the separation at the ISCO frequency is 6 GM/c^2, GW150914-like numbers; antenna pattern:
// overhead response 1, blind spots at (90°, 45°), sky average of F+^2 is 1/5, rms independent of psi.
module.exports = (M, { ok, near }) => {
  // 1. polarisation
  { const h = 1e-3; const [x, y] = M.ttDisplace(1, 0, h, 0), [x2, y2] = M.ttDisplace(0, 1, h, 0); near(x - 1, h / 2, 1e-12); near(y2 - 1, -h / 2, 1e-12); near(y, 0, 1e-15); near(x2, 0, 1e-15); }
  { // cross = plus rotated by 45 degrees: displacement of a point at 45° under plus equals that of a point at 0° under cross, rotated
    const h = 0.01, c = Math.SQRT1_2; const [ax, ay] = M.ttDisplace(c, c, 0, h); const along = (ax * c + ay * c) - 1; const [bx] = M.ttDisplace(1, 0, h, 0); near(along, bx - 1, 1e-12); }
  { const s = M.armStrain(2e-21, 0); near(s.diff, 2e-21, 1e-30); near(s.x + s.y, 0, 1e-30); }
  { // circular polarisation has constant |h|
    for (let t = 0; t < 7; t += 0.3) { const [a, b] = M.polar(1, 0, 0.2, t); near(Math.hypot(a, b), 0.2, 1e-12); } }
  // 2. inspiral
  const Mc = M.chirpMass(36, 29);
  near(Mc, 28.0956, 1e-3);
  near(M.chirpMass(10, 10), 20 * Math.pow(0.25, 0.6), 1e-12);
  for (const f of [20, 50, 150]) near(M.fOfTau(M.tauOfF(f, Mc), Mc), f, 1e-9 * f);
  { const tau = 0.3, d = 1e-6; const dphi = (M.phaseOfTau(tau - d, Mc) - M.phaseOfTau(tau + d, Mc)) / (2 * d); near(dphi, 2 * Math.PI * M.fOfTau(tau, Mc), 1e-4 * dphi); }
  near(M.sepOfF(M.fISCO(65), 65), 6, 1e-9);
  near(M.fISCO(65), 67.65, 0.01);
  { // geometric clock: tau(a) in units of M equals tauOfF in seconds divided by M T_sun
    const m1 = 36, m2 = 29, Mt = 65, nu = M.eta(m1, m2), a = 11; const f = 1 / (Math.PI * Math.pow(a, 1.5) * Mt * M.TSUN);
    near(M.tauOfSep(a, nu) * Mt * M.TSUN, M.tauOfF(f, Mc), 1e-9); near(M.sepOfTau(M.tauOfSep(a, nu), nu), a, 1e-12); }
  { const n = M.cycles(20, M.fISCO(65), Mc); ok(n > 20 && n < 30, 'GW150914-like: about two dozen cycles above 20 Hz'); }
  near(M.strain(M.fISCO(65), Mc, 410) * 1e21, 1.25, 0.01);
  // 3. antenna pattern
  near(M.Frms(0, 0.7), 1, 1e-12); near(M.Fplus(0, 0, 0), 1, 1e-12);
  near(M.Frms(Math.PI / 2, Math.PI / 4), 0, 1e-12);
  for (const ps of [0, 0.4, 1.1]) near(Math.hypot(M.Fplus(0.7, 0.3, ps), M.Fcross(0.7, 0.3, ps)), M.Frms(0.7, 0.3), 1e-12);
  { let s = 0, w = 0; const N = 400; for (let i = 0; i < N; i++) { const th = (i + 0.5) * Math.PI / N, sw = Math.sin(th); for (let j = 0; j < 2 * N; j++) { const ph = (j + 0.5) * Math.PI / N; s += M.Frms(th, ph) ** 2 * sw; w += sw; } } near(s / w / 2, 0.2, 1e-4); }
};
