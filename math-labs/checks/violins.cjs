// Violins: Helmholtz motion has a corner on a parabolic envelope, a mean velocity of zero under the bow, and a
// sawtooth bridge force of amplitude Z vb / beta; the Schelleng limits scale as 1/beta and 1/beta^2 and both as vb;
// the body response peaks at its modes; the air resonance follows the bottle formula.
module.exports = (M, { ok, near }) => {
  for (let s = 0; s < 4; s++) { near(Math.sqrt(M.STR[s].T / M.mu(s)) / (2 * M.LEN), M.STR[s].f, 1e-9); near(M.Zc(s), M.STR[s].T / (2 * M.LEN * M.STR[s].f), 1e-12); }
  near(M.Zc(2), 0.18881, 1e-5); near(2 * M.LEN * 440, 286, 1e-9); near(M.yMax(0.3, 440, 0.1) * 1000, 0.85227, 1e-4); near(M.yMax(0.6, 440, 0.1) / M.yMax(0.3, 440, 0.1), 2, 1e-12); near(M.yMax(0.3, 440, 0.05) / M.yMax(0.3, 440, 0.1), 2, 1e-12);
  near(M.envelope(0.5, 1), 1, 1e-12); near(M.envelope(0, 1), 0, 1e-12); near(M.envelope(1, 1), 0, 1e-12); near(M.kink(0.25).x, 0.5, 1e-12); ok(M.kink(0.25).sign === 1 && M.kink(0.75).sign === -1, 'the corner goes out on one side and back on the other'); near(M.kink(0.1).x, M.kink(0.9).x, 1e-12);
  for (const ph of [0.1, 0.3, 0.6, 0.85]) { const k = M.kink(ph); near(M.stringShape(k.x, ph, 1), k.sign * M.envelope(k.x, 1), 1e-12); near(M.stringShape(0, ph, 1), 0, 1e-12); near(M.stringShape(1, ph, 1), 0, 1e-12); near(M.stringShape(k.x / 2, ph, 1), M.stringShape(k.x, ph, 1) / 2, 1e-12); }
  for (const beta of [0.05, 0.1, 0.2]) { let s = 0; const n = 20000; for (let i = 0; i < n; i++) s += M.bowVelocity((i + 0.5) / n, 0.3, beta); near(s / n, 0, 2e-3); near(M.bowVelocity(0.5, 0.3, beta), 0.3, 1e-12); near(M.bowVelocity(0, 0.3, beta), -0.3 * (1 - beta) / beta, 1e-12); }
  { const beta = 0.1, ph = 0.3, dt = 1e-4, f = 440, ym = M.yMax(0.3, f, beta), v = (M.stringShape(beta, ph + dt, ym) - M.stringShape(beta, ph - dt, ym)) / (2 * dt) * f; near(Math.abs(v), 0.3, 1e-6); }
  near(M.bridgeForce(0, 0.3, 0.1, M.Zc(2)), 0.56643, 1e-4); near(M.bridgeForce(0.5, 0.3, 0.1, M.Zc(2)), 0, 1e-12); near(M.bridgeForce(0.999999, 0.3, 0.1, M.Zc(2)), -0.56643, 1e-4);
  { const beta = 0.1, f = 440, ym = M.yMax(0.3, f, beta), h = 1e-6, slope = M.stringShape(h, 0.2, ym) * M.LEN / (h * M.LEN) / M.LEN; near(M.STR[2].T * slope, M.Zc(2) * 0.3 / beta * (1 - 2 * 0.2), 1e-6); }
  const Z = M.Zc(2); near(M.fMax(0.3, 0.1, Z), 2.2657, 1e-3); near(M.fMin(0.3, 0.1, Z), 0.071299, 1e-5); near(M.fMax(0.3, 0.05, Z) / M.fMax(0.3, 0.1, Z), 2, 1e-12); near(M.fMin(0.3, 0.05, Z) / M.fMin(0.3, 0.1, Z), 4, 1e-12); near(M.fMax(0.6, 0.1, Z) / M.fMax(0.3, 0.1, Z), 2, 1e-12); near(M.fMin(0.6, 0.1, Z) / M.fMin(0.3, 0.1, Z), 2, 1e-12);
  near(M.fMax(0.3, Z / (4 * M.RB), Z), M.fMin(0.3, Z / (4 * M.RB), Z), 1e-9); near(M.fMax(0.3, 0.04, Z), 5.6643, 1e-3); near(M.fMin(0.3, 0.04, Z), 0.44562, 1e-4);
  ok(M.regime(0.5, 0.3, 0.1, Z) === 1 && M.regime(0.02, 0.3, 0.1, Z) === 0 && M.regime(5, 0.3, 0.1, Z) === 2, 'three regimes of bowing'); for (let b = 0.02; b <= 0.3; b += 0.02) ok(M.fMax(0.3, b, Z) > M.fMin(0.3, b, Z), 'a playable range exists where a bow can reach');
  for (const [f0] of M.MODES.slice(0, 3)) ok(M.body(f0) > M.body(f0 * 0.85) && M.body(f0) > M.body(f0 * 1.15), 'the body response peaks at its low modes'); ok(M.body(196) < 0.2 * M.body(460) && M.body(7000) < 0.1 * M.body(2500), 'weak below the air resonance and far above the bridge hill');
  near(M.body(460), 1.012, 5e-3); near(M.body(275), 0.5558, 1e-3); near(M.partial(4, 196), M.body(784) / 4, 1e-12); { const p = [1, 2, 3, 4, 5, 6].map((n) => M.partial(n, 196)); ok(p[3] === Math.max(...p), 'the fourth harmonic of open G is the strongest'); near(p[0] / p[3], 0.72, 0.02); }
  near(M.airResonance(12, 2, 22), 285.09, 0.01); near(M.airResonance(24, 2, 22) / M.airResonance(12, 2, 22), Math.SQRT2, 1e-12); near(M.airResonance(12, 4, 22) / M.airResonance(12, 2, 22), Math.SQRT1_2, 1e-12);
};
