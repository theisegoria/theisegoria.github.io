// Nuclear physics: the liquid-drop formula reproduces measured binding energies to a few per cent away from light nuclei, peaks near iron, puts the valley where dB/dZ = 0 and gives known stability and alpha-instability; the Bateman solution conserves atoms, solves its ODEs and matches Monte Carlo; the Gamow model's integral agrees with numerical quadrature and its half-lives sit within about an order of magnitude of measured ones.
module.exports = (M, { ok, near }) => {
  // 1. liquid drop
  for (const [A, Z, ba] of M.MEAS) if (A >= 40) near(M.B(A, Z) / A / ba, 1, 0.02);
  { let best = 0, bestA = 0; for (let A = 20; A <= 250; A++) { const z = Math.round(M.zValley(A)), ba = M.B(A, z) / A; if (ba > best) { best = ba; bestA = A; } } ok(bestA >= 50 && bestA <= 70, `B/A peaks near iron (A = ${bestA})`); }
  for (const A of [40, 100, 200]) { const z = M.zValley(A), h = 1e-4, Bz = (Z) => M.AV * A - M.AS * Math.cbrt(A * A) - (M.AC * Z * (Z - 1)) / Math.cbrt(A) - (M.AA * (A - 2 * Z) ** 2) / A; near((Bz(z + h) - Bz(z - h)) / (2 * h), 0, 1e-6); }
  near(M.zValley(208), 81, 1.5); near(M.zValley(56), 25.5, 1.2);
  ok(M.betaStable(56, 26) && M.betaStable(208, 82) && !M.betaStable(60, 27) && !M.betaStable(137, 55), 'beta stability of Fe-56, Pb-208 and instability of Co-60, Cs-137');
  ok(M.atomicMass(90, 39) < M.atomicMass(90, 38), 'Sr-90 decays to Y-90');
  ok(M.Qalpha(238, 92) > 0 && M.Qalpha(56, 26) < 0, 'U-238 can alpha decay, Fe-56 cannot');
  ok(M.bound(208, 82) && !M.bound(40, 32), 'drip lines');
  { const r = M.semf(208, 82); near(r.vol - r.surf - r.coul - r.asym + r.pair, r.B, 1e-9); }
  // 2. decay chains: conservation, the ODEs, peak time, transient-equilibrium ratio, Monte Carlo
  for (const [ta, tb] of [[10, 1], [1, 10], [1000, 0.5]]) {
    const la = Math.LN2 / ta, lb = Math.LN2 / tb;
    for (const t of [0.3, 2, 7, 25]) { const s = M.bateman(la, lb, t), h = 1e-6 * Math.max(1, t), sp = M.bateman(la, lb, t + h), sm = M.bateman(la, lb, t - h);
      near(s.NA + s.NB + s.NC, 1, 1e-12); near((sp.NB - sm.NB) / (2 * h), la * s.NA - lb * s.NB, 1e-6); near((sp.NA - sm.NA) / (2 * h), -la * s.NA, 1e-6); }
    const tm = M.tMaxDaughter(la, lb), e = 1e-4; ok(M.bateman(la, lb, tm).NB >= M.bateman(la, lb, tm + e).NB && M.bateman(la, lb, tm).NB >= M.bateman(la, lb, tm - e).NB, 'daughter maximum');
  }
  { const la = Math.LN2 / 10, lb = Math.LN2 / 1, t = 80, s = M.bateman(la, lb, t); near((lb * s.NB) / (la * s.NA), lb / (lb - la), 1e-6); }
  { const la = Math.LN2 / 3, lb = Math.LN2 / 1, n = 20000, ts = M.decayTimes(n, la, lb), t = 4; let a = 0, b = 0; for (const [x, y] of ts) { if (t < x) a++; else if (t < y) b++; } const s = M.bateman(la, lb, t); near(a / n, s.NA, 0.015); near(b / n, s.NB, 0.015); }
  // 3. alpha decay: closed-form Gamow integral vs quadrature, model vs data
  { const Z = 92, A = 238, Q = 4.27, a = M.alpha(Z, A, Q), HC = 197.327, n = 200000; let s = 0;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, r = a.R + (a.b - a.R) * (1 - (1 - u) ** 2), dr = 2 * (1 - u) * (a.b - a.R) / n, V = (2 * (Z - 2) * 1.439964) / r; s += Math.sqrt(Math.max(0, 2 * a.mu * (V - Q))) * dr; }
    near((2 * s) / HC, a.G, 1e-3 * a.G); }
  let rms = 0; for (const [, Z, A, Q, t] of M.ALPHAS) { const d = Math.log10(M.alpha(Z, A, Q).thalf / t); rms += d * d; ok(Math.abs(d) < 2, `alpha model within 2 decades for Z=${Z}, A=${A}`); }
  ok(Math.sqrt(rms / M.ALPHAS.length) < 0.8, 'rms error under 0.8 decades');
  // the Geiger–Nuttall span: 24 orders of magnitude between Po-212 and Th-232
  ok(Math.log10(M.alpha(90, 232, 4.083).thalf / M.alpha(84, 212, 8.954).thalf) > 22, 'a factor of two in Q spans over 22 decades');
};
