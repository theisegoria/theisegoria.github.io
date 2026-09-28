// Quantum information: CHSH correlations and bounds, the teleportation state-vector protocol, and entanglement entropy of a two-qubit family.
module.exports = (Q, { ok, near }) => {
  const PI = Math.PI, D = PI / 180;
  // 1. the Φ+ correlation is cos(a − b), and the hidden-variable ramp agrees with it at 0, 90 and 180 degrees only
  for (const [a, b] of [[0, 0], [0, 45], [30, 100], [200, 15], [90, 270]]) near(Q.E_quantum(a * D, b * D), Math.cos((a - b) * D), 1e-12);
  near(Q.E_lhv(0, 0), 1, 1e-12); near(Q.E_lhv(0, PI / 2), 0, 1e-12); near(Q.E_lhv(0.3, 0.3 + PI), -1, 1e-12); near(Q.E_lhv(0, PI / 4), 0.5, 1e-12);
  // 2. S at the optimal settings is 2√2 exactly, and never exceeds it on a grid
  near(Q.S(0, 90 * D, 45 * D, 135 * D), 2 * Math.SQRT2, 1e-12);
  let smax = -Infinity, lmax = -Infinity;
  for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) for (let k = 0; k < 24; k++) for (let l = 0; l < 24; l++) {
    const a = i * 15 * D, ap = j * 15 * D, b = k * 15 * D, bp = l * 15 * D;
    smax = Math.max(smax, Math.abs(Q.S(a, ap, b, bp)));
    lmax = Math.max(lmax, Math.abs(Q.S(a, ap, b, bp, Q.E_lhv)));
  }
  ok(smax <= Q.TSIRELSON + 1e-12, 'quantum S never exceeds 2√2');
  ok(lmax <= 2 + 1e-12 && lmax > 1.99, 'hidden-variable S reaches 2 and never exceeds it');
  // 3. the optimiser over b′ finds the ceiling from the optimal Alice/Bob pair, and the LHV optimum stays at 2
  const best = Q.maxOverBp(0, 90 * D, 45 * D);
  ok(best.S >= 2.8, `optimiser reaches ${best.S}`); near(best.S, 2 * Math.SQRT2, 1e-6); near(best.bp, 135 * D, 1e-3);
  ok(Q.maxOverBp(0, 90 * D, 45 * D, Q.E_lhv).S <= 2 + 1e-9, 'LHV optimum is at most 2');
  // 4. teleportation: every outcome has probability 1/4, the corrected state has fidelity 1, the uncorrected one is a Pauli away
  const rnd = (n) => { let s = 12345 + n; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; };
  const r = rnd(7);
  for (let trial = 0; trial < 5; trial++) {
    const th = r() * PI, ph = r() * 2 * PI;
    for (let o = 0; o < 4; o++) {
      const m1 = o >> 1, m2 = o & 1, R = Q.teleport(th, ph, m1, m2);
      near(R.p, 0.25, 1e-12);
      near(Q.fidelity(R.psi, R.rhoBob[4]), 1, 1e-10);
      const before = Q.fidelity(R.psi, R.rhoBob[3]), rb = Q.blochOfPsi(th, ph);
      // the pre-correction Bloch vector is X^{m2} Z^{m1} applied to the Bloch vector of ψ
      let v = rb.slice(); if (m1) v = [-v[0], -v[1], v[2]]; if (m2) v = [v[0], -v[1], -v[2]];
      const got = Q.blochOfRho(R.rhoBob[3]);
      ok(Math.hypot(got[0] - v[0], got[1] - v[1], got[2] - v[2]) < 1e-10, 'Bob holds the expected Pauli image of ψ');
      if (o === 0) near(before, 1, 1e-10);
      // Bob's reduced state before the outcome is known is I/2 at every step up to the measurement
      for (let k = 0; k <= 2; k++) { const rho = R.rhoBob[k]; near(rho[0][0][0], 0.5, 1e-12); near(rho[1][1][0], 0.5, 1e-12); near(Math.hypot(rho[0][1][0], rho[0][1][1]), 0, 1e-12); }
    }
    // the state stays normalised through the gates
    const R0 = Q.teleport(th, ph, 0, 0);
    for (let k = 0; k < 5; k++) near(R0.stages[k].reduce((acc, a) => acc + a[0] * a[0] + a[1] * a[1], 0), 1, 1e-12);
  }
  // Hadamard squared is the identity and CNOT twice is the identity
  { const s = Q.initial(1.1, 0.4), hh = Q.gate1(Q.gate1(s, 0, Q.H), 0, Q.H), cc = Q.cnot(Q.cnot(s, 0, 1), 0, 1);
    ok(s.every((a, i) => Math.abs(a[0] - hh[i][0]) < 1e-12 && Math.abs(a[1] - hh[i][1]) < 1e-12), 'H H = I');
    ok(s.every((a, i) => Math.abs(a[0] - cc[i][0]) < 1e-12 && Math.abs(a[1] - cc[i][1]) < 1e-12), 'CNOT CNOT = I'); }
  // 5. entanglement entropy: 1 bit at θ = π/4, 0 at θ = 0, eigenvalues cos²θ and sin²θ, concurrence sin 2θ, invariance under β
  near(Q.entropy(Q.eig2(Q.rhoA(Q.state2(PI / 4, 0)))), 1, 1e-12);
  near(Q.entropy(Q.eig2(Q.rhoA(Q.state2(0, 0)))), 0, 1e-12);
  near(Q.entropy(Q.eig2(Q.rhoA(Q.state2(PI / 2, 1.3)))), 0, 1e-12);
  for (const th of [0.2, 0.5, PI / 6, 1.1]) {
    const s0 = Q.state2(th, 0), l0 = Q.eig2(Q.rhoA(s0));
    near(Math.max(...l0), Math.max(Math.cos(th) ** 2, Math.sin(th) ** 2), 1e-12);
    near(Math.min(...l0), Math.min(Math.cos(th) ** 2, Math.sin(th) ** 2), 1e-12);
    near(Q.concurrence(s0), Math.abs(Math.sin(2 * th)), 1e-12);
    near(Q.len3(Q.blochReal(Q.rhoA(s0))), Math.sqrt(1 - Q.concurrence(s0) ** 2), 1e-12);
    for (const be of [0.7, 2.0, 5.5]) {
      const s = Q.state2(th, be);
      near(Q.entropy(Q.eig2(Q.rhoA(s))), Q.entropy(l0), 1e-12);
      near(Q.concurrence(s), Q.concurrence(s0), 1e-12);
      // the two reduced states share a spectrum (Schmidt), and the state stays normalised
      const lb = Q.eig2(Q.rhoB(s)); near(lb[0], l0[0], 1e-12); near(lb[1], l0[1], 1e-12);
      near(s.reduce((acc, x) => acc + x * x, 0), 1, 1e-12);
    }
  }
  // the entropy is maximal exactly at the maximally entangled point
  ok(Q.entropy(Q.eig2(Q.rhoA(Q.state2(PI / 4 + 0.05, 0)))) < 1 && Q.entropy(Q.eig2(Q.rhoA(Q.state2(PI / 4 - 0.05, 0)))) < 1, 'entropy peaks at θ = π/4');
};
