// Guitars: string frequency follows (1/2L) sqrt(T/mu) and its inverse; fret positions halve the string at the
// twelfth and repeat geometrically; pluck harmonics rebuild the triangle and vanish at nodes; neck relief is linear
// in rod tension; the pickup misses harmonics with a node above it; the coil resonates at 1/(2 pi sqrt(LC)).
module.exports = (M, { ok, near }) => {
  for (let i = 0; i < 6; i++) { const T = M.tensionFor(M.OPEN[i], M.MU[i]); near(M.freq(M.SCALE, T, M.MU[i]), M.OPEN[i], 1e-9); ok(T > 65 && T < 90, 'string tensions are similar'); }
  near(M.tensionFor(329.63, 4.01e-4), 73.18, 0.02); near(Math.sqrt(M.tensionFor(329.63, 4.01e-4) / 4.01e-4), 427.2, 0.1); near(M.totalTension(), 453.73, 0.01); near(M.totalTension(1.2) / M.totalTension(), 1.2, 1e-12);
  near(M.freq(0.324, 73.18, 4.01e-4) / M.freq(0.648, 73.18, 4.01e-4), 2, 1e-12); near(M.freq(0.648, 4 * 73.18, 4.01e-4) / M.freq(0.648, 73.18, 4.01e-4), 2, 1e-12);
  near(M.fretPos(0), 0, 1e-15); near(M.fretPos(12), 0.324, 1e-12); near(M.fretPos(1) * 1000, 36.369, 1e-3); near(M.fretPos(24), 0.75 * 0.648, 1e-12);
  for (let n = 1; n < 21; n++) near((M.fretPos(n + 1) - M.fretPos(n)) / (M.fretPos(n) - M.fretPos(n - 1)), 2 ** (-1 / 12), 1e-12); for (let n = 0; n <= 9; n++) near((M.SCALE - M.fretPos(n + 12)) / (M.SCALE - M.fretPos(n)), 0.5, 1e-12);
  near(M.fretted(4, 12), 220, 1e-9); near(M.fretted(4, 5), 146.83, 0.01); ok(M.noteName(82.41) === 'E2' && M.noteName(329.63) === 'E4' && M.noteName(440) === 'A4' && M.noteName(261.63) === 'C4' && M.noteName(M.fretted(4, 5)) === 'D3', 'note names');
  near(M.harmonic(1, 0.5), 8 / Math.PI ** 2, 1e-12); near(M.harmonic(2, 0.5), 0, 1e-12); near(M.harmonic(3, 0.5) / M.harmonic(1, 0.5), -1 / 9, 1e-12); near(M.harmonic(5, 0.2), 0, 1e-12); near(M.harmonic(2, 0.2) / M.harmonic(1, 0.2), 0.40451, 1e-4); near(M.harmonic(3, 0.2) / M.harmonic(1, 0.2), 0.17978, 1e-4);
  for (const p of [0.2, 0.35, 0.5]) { near(M.shape(p, p, 4000), 1, 2e-3); near(M.shape(p / 2, p, 4000), 0.5, 2e-3); near(M.shape((1 + p) / 2, p, 4000), 0.5, 2e-3); near(M.shape(0, p, 50), 0, 1e-12); }
  near(M.EI, 481.85, 0.01); const F = M.totalTension(); near(M.relief(F, 0) * 1000, 0.28602, 1e-4); near(M.relief(F, M.rodFor(F, 0.00025)), 0.00025, 1e-12); near(M.rodFor(F, 0.00025), 114.28, 0.01); near(M.rodFor(F, 0), 2 * F, 1e-9); near(M.relief(F, 2 * F), 0, 1e-15); ok(M.relief(F, 1500) < 0, 'an over-tight rod bows the neck back');
  near(M.relief(F, 500) - M.relief(F, 0), M.relief(F, 1000) - M.relief(F, 500), 1e-15); ok(M.relief(M.totalTension(1.2), 110) > M.relief(F, 110), 'heavier strings bow the neck more');
  near(M.sensed(4, 0.18, 0.25), 0, 1e-12); near(M.sensed(5, 0.18, 0.2), 0, 1e-12); ok(M.sensed(4, 0.18, 0.06) > 0 && M.sensed(1, 0.18, 0.25) > M.sensed(1, 0.18, 0.06), 'the bridge pickup hears every harmonic but less fundamental'); near(M.sensed(3, 0.18, 0.3), Math.abs(3 * M.harmonic(3, 0.18) * Math.sin(0.9 * Math.PI)), 1e-12);
  near(M.coilPeak(500e-12), 4042.5, 0.1); near(M.coilPeak(500e-12), 1 / (2 * Math.PI * Math.sqrt(2.5 * 620e-12)), 1e-9); near(M.coilPeak(1500e-12), 2500.9, 0.1); near(M.coil(M.coilPeak(500e-12), 500e-12, 10), 1.4977, 1e-3); near(M.coil(100, 500e-12, 10), 0.9523, 1e-3);
  ok(M.coil(M.coilPeak(500e-12), 500e-12, 0) < 0.1 && M.coil(20000, 500e-12, 10) < 0.1, 'tone control and high frequencies cut the output'); { let best = 0, at = 0; for (let f = 500; f < 12000; f += 10) { const h = M.coil(f, 500e-12, 10); if (h > best) { best = h; at = f; } } ok(Math.abs(at - M.coilPeak(500e-12)) < 400, 'the response peaks near the resonance'); }
};
