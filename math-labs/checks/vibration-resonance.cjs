// Vibration: the driven response solves m x'' + c x' + k x = F cos wt; its peak is 1 / (2 zeta sqrt(1 - zeta^2));
// free decay falls by exp(-delta) per cycle and satisfies the equation of motion; transmissibility is 1 at sqrt 2
// for every damping and 1 / (r^2 - 1) undamped; the mount frequency follows from sag alone.
module.exports = (M, { ok, near }) => {
  near(M.gain(1, 0.1), 5, 1e-12); near(M.gain(0, 0.3), 1, 1e-12); near(M.peakGain(0.1), 5.02519, 1e-4); near(M.peakRatio(0.1), 0.98995, 1e-4); near(M.gain(M.peakRatio(0.1), 0.1), M.peakGain(0.1), 1e-9);
  for (const z of [0.05, 0.1, 0.3, 0.5]) { const rp = M.peakRatio(z); ok(M.gain(rp, z) >= M.gain(rp - 0.01, z) && M.gain(rp, z) >= M.gain(rp + 0.01, z), 'the peak is where the model says'); near(M.lag(1, z), 90, 1e-9); near(M.quality(z), M.gain(1, z), 1e-12); }
  near(M.gain(0.5, 0.1), 1.32164, 1e-4); near(M.lag(0.5, 0.1), 7.5946, 1e-3); near(M.gain(2, 0.1), 0.33041, 1e-4); ok(M.lag(2, 0.1) > 170 && M.lag(0.1, 0.1) < 2, 'in step below resonance, opposed above');
  { const z = 0.2, r = 0.7, H = M.gain(r, z), ph = M.lag(r, z) * Math.PI / 180, x = (t) => H * Math.cos(r * t - ph), h = 1e-4; for (const t of [0.3, 1.7, 4.1]) { const xd = (x(t + h) - x(t - h)) / (2 * h), xdd = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h); near(xdd + 2 * z * xd + x(t), Math.cos(r * t), 1e-5); } }
  near(M.logDec(0.05), 0.314553, 1e-5); near(Math.exp(-M.logDec(0.05)), 0.73012, 1e-4); near(M.cyclesToHalve(0.05), 2.2036, 1e-3); near(M.dampedFreq(2, 0.05), 1.9975, 1e-4); near(M.cyclesToHalve(0.3), 0.35079, 1e-4); near(M.cyclesToHalve(0.001), 110.318, 1e-2);
  for (const z of [0.02, 0.1, 0.4]) { const fn = 2, Td = 1 / M.dampedFreq(fn, z); near(M.ring(0, fn, z), 1, 1e-12); near(M.ring(Td, fn, z), Math.exp(-M.logDec(z)), 1e-9); near(M.ring(3 * Td, fn, z), Math.exp(-3 * M.logDec(z)), 1e-9); near(M.envelope(Td, fn, z), Math.exp(-M.logDec(z)), 1e-9);
    const w = 2 * Math.PI * fn, h = 1e-5, t = 0.37, x = (q) => M.ring(q, fn, z) + (z / Math.sqrt(1 - z * z)) * Math.exp(-z * w * q) * Math.sin(w * Math.sqrt(1 - z * z) * q), xd = (x(t + h) - x(t - h)) / (2 * h), xdd = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h); near((xdd + 2 * z * w * xd + w * w * x(t)) / (w * w), 0, 1e-4); }
  near(M.ring(0, 2, 1), 1, 1e-12); ok(M.ring(0.5, 2, 1) > 0 && M.ring(0.5, 2, 1) < 0.02, 'critically damped: back without crossing zero');
  for (const z of [0, 0.1, 0.5, 1]) near(M.transmit(Math.SQRT2, z), 1, 1e-12); near(M.transmit(3, 0), 0.125, 1e-12); near(M.transmit(Math.sqrt(11), 0), 0.1, 1e-12); near(M.transmit(0, 0.2), 1, 1e-12); near(M.transmit(1, 0.1), 5.09902, 1e-4);
  ok(M.transmit(3, 0.1) > M.transmit(3, 0) && M.transmit(1, 0.1) < M.transmit(1, 0.05), 'damping helps at resonance and hurts above the crossover'); ok(M.transmit(1.2, 0.1) > 1 && M.transmit(1.6, 0.1) < 1, 'worse than rigid below sqrt 2, better above');
  near(M.mountFreq(5), 7.04968, 1e-4); near(M.mountFreq(25), 3.15271, 1e-4); near(M.mountFreq(20) / M.mountFreq(5), 0.5, 1e-12); near(M.sagFor(M.mountFreq(12)), 12, 1e-9); near(M.transmit(20 / M.mountFreq(5), 0.1), 0.16259, 1e-4); near(M.sagFor(20 / Math.sqrt(11)), 6.8335, 1e-3);
};
