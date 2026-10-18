// Continuum mechanics: polar decomposition (R orthogonal, U symmetric, F = RU), strain measures under rigid rotation and simple shear;
// beam deflections against the textbook closed forms and equilibrium; Euler loads, the elastica branch against its elliptic-integral
// closed forms and its small-amplitude expansion.
module.exports = (M, { ok, near }) => {
  // 1. kinematics
  for (const F of [[[1, 0.6], [0, 1]], [[1.3, -0.4], [0.2, 0.8]], [[0.7, 0.9], [-0.5, 1.4]]]) {
    const { R, U, lam } = M.polar(F), RU = M.mul(R, U), RtR = M.mul(M.tr(R), R);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { near(RU[i][j], F[i][j], 1e-12); near(RtR[i][j], i === j ? 1 : 0, 1e-12); }
    near(U[0][1], U[1][0], 1e-12); near(lam[0] * lam[1], Math.abs(M.det(F)), 1e-12); near(M.det(R), 1, 1e-12);
    // E is unchanged by an extra rigid rotation
    const E1 = M.green(F), E2 = M.green(M.mul(M.rotM(0.7), F)); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) near(E1[i][j], E2[i][j], 1e-12);
  }
  { const g = 0.6, p = M.polar([[1, g], [0, 1]]); near(p.lam[0], g / 2 + Math.sqrt(1 + g * g / 4), 1e-12); near(p.angle, -Math.atan(g / 2), 1e-12); }
  { const R = M.rotM(Math.PI / 6), E = M.green(R), e = M.smallStrain(R); near(Math.hypot(E[0][0], E[0][1], E[1][1]), 0, 1e-15); near(e[0][0], Math.cos(Math.PI / 6) - 1, 1e-15); }
  // 2. beams: closed forms, boundary conditions and equilibrium
  const { E, I, Lb } = M.BEAM, EI = E * I, P = 3000, q = 2000;
  near(I, 7.2e-7, 1e-20);
  { const b = M.beam('cantilever', P, 1, 0, EI, Lb); near(b.w(1), -P / (3 * EI), 1e-12); near(b.M(0), -P, 1e-6); near(b.w(0), 0, 1e-15); near(b.slope(0), 0, 1e-15); near(b.M(1), 0, 1e-9); }
  { const b = M.beam('cantilever', P, 0.4, 0, EI, Lb); near(b.w(1), -(P * 0.16 * (3 - 0.4)) / (6 * EI), 1e-12); }
  { const b = M.beam('cantilever', 0, 0, q, EI, Lb); near(b.w(1), -q / (8 * EI), 1e-12); near(b.M(0), -q / 2, 1e-6); }
  { const b = M.beam('simple', P, 0.5, 0, EI, Lb); near(b.w(0.5), -P / (48 * EI), 1e-12); near(b.M(0.5), P / 4, 1e-6); near(b.w(1), 0, 1e-15); near(b.M(1), 0, 1e-9); near(b.R0, P / 2, 1e-6); }
  { const b = M.beam('simple', 0, 0, q, EI, Lb); near(b.w(0.5), -5 * q / (384 * EI), 1e-12); near(b.M(0.5), q / 8, 1e-6); }
  { const b = M.beam('fixed', P, 0.5, 0, EI, Lb); near(b.w(0.5), -P / (192 * EI), 1e-12); near(b.M(0), -P / 8, 1e-6); near(b.M(0.5), P / 8, 1e-6); near(b.slope(1), 0, 1e-15); }
  { const b = M.beam('fixed', 0, 0, q, EI, Lb); near(b.w(0.5), -q / (384 * EI), 1e-12); near(b.M(0), -q / 12, 1e-6); }
  // Maxwell–Betti reciprocity: deflection at x2 from a load at x1 equals deflection at x1 from the same load at x2
  for (const s of M.SUPS) { const a = M.beam(s, P, 0.3, 0, EI, Lb), b = M.beam(s, P, 0.8, 0, EI, Lb); near(a.w(0.8), b.w(0.3), 1e-12); }
  // 3. buckling
  near(M.ellK(0), Math.PI / 2, 1e-15); near(M.ellK(Math.SQRT1_2), 1.8540746773013719, 1e-12);
  near(M.eulerLoad(1.2, 1) / 1e3, 10.766, 1e-3); near(M.eulerLoad(1, 2) * 16, M.eulerLoad(1, 0.5), 1e-6);
  for (const r of [1.01, 1.2, 1.5]) near(M.loadRatio(M.pFromLoad(r)), r, 1e-9);
  // small-amplitude expansion of the elastica: P/P_cr ≈ 1 + α²/8
  { const a = 0.05, p = Math.sin(a / 2); near(M.loadRatio(p), 1 + a * a / 8, 1e-6); }
  // integrated shapes against the closed-form deflections, and equal end shortening 2E(p)/K(p) − 1 for every end condition
  { const p = 0.5, Ek = (() => { let s = 0; const n = 20000; for (let i = 0; i < n; i++) { const t = ((i + 0.5) / n) * Math.PI / 2; s += Math.sqrt(1 - p * p * Math.sin(t) ** 2); } return (s * Math.PI) / 2 / n; })(), chord = (2 * Ek) / M.ellK(p) - 1;
    for (const bc of M.BCS) { const e = M.elastica(p, bc), top = e[e.length - 1]; let mx = 0; for (const q of e) mx = Math.max(mx, Math.abs(q[0])); near(mx, M.elasticaDelta(p, bc.id), 1e-4); near(top[1], chord, 1e-4); if (bc.id !== 'free') near(top[0], 0, 1e-6); } }
  { const lc = Math.sqrt(2 * Math.PI ** 2 * M.COL.E / M.COL.sy); near(M.johnson(lc), M.COL.sy / 2, 1e-3); near(M.johnson(lc), Math.PI ** 2 * M.COL.E / lc ** 2, 1e-3); }
};
