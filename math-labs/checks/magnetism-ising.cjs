// Magnetism and the Ising model: Onsager's magnetisation against known values, detailed balance in the Metropolis sweep, ordered and disordered lattices on either side of Tc, the transfer matrix against the closed forms and against brute force on a small ring, and the Curie-Weiss solutions.
module.exports = (M, { ok, near }) => {
  // 1. Onsager
  near(M.TC2D, 2.269185, 1e-6); near(M.onsagerM(2), 0.9113, 1e-4); near(M.onsagerM(2.2), 0.7848, 1e-4); near(M.onsagerM(1), 0.99928, 1e-4); near(M.onsagerM(0.5), 1, 1e-6); near(M.onsagerM(2.27), 0, 1e-12); near(M.onsagerM(5), 0, 1e-12);
  // the exponent 1/8: log m against log(Tc - T) has slope 1/8 just below Tc
  { const t1 = M.TC2D - 1e-4, t2 = M.TC2D - 1e-3; near((Math.log(M.onsagerM(t1)) - Math.log(M.onsagerM(t2))) / (Math.log(M.TC2D - t1) - Math.log(M.TC2D - t2)), 1 / 8, 5e-3); }
  // 2. Metropolis: ordered well below Tc, disordered well above; energy per spin near -2 when cold
  { const s = M.latticeInit(32, true); const R = M.rng(1); for (let t = 0; t < 150; t++) M.metropolisSweep(s, 32, 1.2, 0, R); ok(Math.abs(M.magnetisation(s)) > 0.95, 'ordered at kT = 1.2 J'); ok(M.energyPerSpin(s, 32, 0) < -1.9, 'energy near -2J per spin');
    const s2 = M.latticeInit(32, false, 7); for (let t = 0; t < 150; t++) M.metropolisSweep(s2, 32, 5, 0, R); ok(Math.abs(M.magnetisation(s2)) < 0.15, 'disordered at kT = 5 J');
    near(M.latticeRun(32, 2.0, 0, 150, 150), M.onsagerM(2.0), 0.04);
    // a field aligns the lattice even above Tc
    const s3 = M.latticeInit(24, false, 3); for (let t = 0; t < 200; t++) M.metropolisSweep(s3, 24, 4, 0.5, R); ok(M.magnetisation(s3) > 0.2, 'field induces magnetisation'); }
  // 3. the chain: transfer matrix eigenvalues against the closed forms, exact correlation against brute force, xi
  { const e = M.transferEigen(1.3, 0); near(e.plus, Math.exp(1 / 1.3) + Math.exp(-1 / 1.3), 1e-12); near(e.minus, Math.exp(1 / 1.3) - Math.exp(-1 / 1.3), 1e-12); near(e.minus / e.plus, Math.tanh(1 / 1.3), 1e-12);
    near(M.chainXi(1), -1 / Math.log(Math.tanh(1)), 1e-12); near(M.chainXi(0.2), 11013, 20); near(M.chainM(1, 0), 0, 1e-12); ok(M.chainM(1, 0.3) > 0 && M.chainM(1, 0.3) < 1, 'field magnetisation in (0, 1)');
    // brute force on a ring of 8 spins
    const Tq = 1.1, hq = 0.2, N = 8; let Z = 0, c3 = 0, m = 0;
    for (let cfg = 0; cfg < 256; cfg++) { const s = []; for (let k = 0; k < N; k++) s.push((cfg >> k) & 1 ? 1 : -1); let E = 0; for (let k = 0; k < N; k++) E -= s[k] * s[(k + 1) % N] + hq * s[k]; const w = Math.exp(-E / Tq); Z += w; c3 += w * s[0] * s[3]; m += w * s[0]; }
    near(M.exactCorrRing(Tq, hq, 3, N), c3 / Z, 1e-10); near(M.exactCorrRing(Tq, hq, 0, N), 1, 1e-12);
    // the infinite-chain formulas emerge for a long ring
    near(M.exactCorrRing(1.5, 0, 6, 400), Math.pow(Math.tanh(1 / 1.5), 6), 1e-9); near(M.exactCorrRing(1.5, 0.3, 300, 2000), M.chainM(1.5, 0.3) ** 2, 1e-6);
    // measured correlation tracks the exact one
    const s = new Int8Array(200).fill(1), R = M.rng(2); for (let t = 0; t < 300; t++) M.chainSweep(s, 1, 0, R); const acc = new Float64Array(6); for (let t = 0; t < 1500; t++) { M.chainSweep(s, 1, 0, R); const c = M.chainCorr(s, 5); for (let r = 0; r <= 5; r++) acc[r] += c[r]; } near(acc[1] / 1500, Math.tanh(1), 0.05); near(acc[3] / 1500, Math.pow(Math.tanh(1), 3), 0.07);
    ok(M.domainWalls(Int8Array.from([1, 1, -1, -1, 1, 1])) === 2, 'walls counted around the ring'); }
  // 4. mean field: Tc = z, three solutions below, one above; m = tanh(2m) = 0.9575; the sqrt(3(1 - T/Tc)) law near Tc
  ok(M.mfSolutions(4, 5, 0).length === 1 && M.mfSolutions(4, 3, 0).length === 3 && M.mfSolutions(2, 1.5, 0).length === 3 && M.mfSolutions(2, 2.5, 0).length === 1, 'solution counts around Tc = z');
  near(Math.max(...M.mfSolutions(4, 2, 0)), 0.95750, 1e-4); near(M.mfSolve(4, 2, 0), 0.95750, 1e-4); near(Math.max(...M.mfSolutions(4, 3.9, 0)), M.mfNearTc(4, 3.9), 0.02);
  ok(M.mfSolutions(4, 3, 0.1).length === 1 || M.mfSolutions(4, 3, 0.1).length === 3, 'with a field the count is 1 or 3'); near(M.TC_TRI, 3.6410, 1e-4);
};
