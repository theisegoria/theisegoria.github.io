// Flush toilets: weir and siphon flows follow their formulas, a fast pour primes the siphon and removes more than
// was poured while a slow pour does not; the cistern empties by Torricelli's law and the cycle conserves water; the
// float valve balances buoyancy times lever ratio against pressure times opening.
module.exports = (M, { ok, near }) => {
  near(M.weirQ(0), 0, 1e-12); near(M.weirQ(-0.01), 0, 1e-12); near(M.weirQ(0.04) / M.weirQ(0.01), 8, 1e-9); near(M.weirQ(M.primeH()), M.QPRIME, 1e-12); near(M.primeH() * 100, 4.854, 0.002);
  near(M.siphonV(0), Math.sqrt(2 * M.G * 0.25 / 4), 1e-12); near(M.siphonV(0), 1.1072, 1e-4); near(M.siphonQ(0) * 1000, 2.6305, 1e-3); near(M.ATR * 1e4, 23.758, 0.002); near(M.siphonV(0.05, 0.25, 0), Math.sqrt(2 * M.G * 0.3), 1e-12);
  const f = M.pour(6, 3), s = M.pour(6, 30);
  ok(f.primed && !s.primed, 'a fast pour primes, a slow one does not'); near(f.gone * 1000, 7.51, 0.03); ok(f.gone > 0.006 + 0.9 * M.AB * M.SEAL, 'siphon takes the bowl with it'); ok(f.hEnd < -M.SEAL + 0.003, 'bowl drawn down to the lip'); near(f.peak * 1000, 2.875, 0.01);
  near(s.gone * 1000 + s.hEnd * M.AB * 1000, 6, 0.02); ok(s.hEnd > 0 && s.hEnd < 0.005, 'slow pour leaves the bowl full'); ok(Math.max(...s.tr.map((q) => q.h)) < M.primeH(), 'slow pour stays under the priming level'); near(Math.max(...s.tr.map((q) => q.h)) * 100, 1.66, 0.02);
  near(f.gone + f.hEnd * M.AB, 0.006, 3e-5); ok(M.pour(3, 2).primed && !M.pour(6, 8).primed, 'priming depends on rate, not volume');
  near(M.torricelliQ(0.2) * 1000, 2.3333, 1e-3); near(M.torricelliQ(0.2) / M.torricelliQ(0.05), 2, 1e-12); near(M.emptyTime(0.2, 0.1), 3.0127, 1e-3); near(M.emptyTime(0.2, 0), 2 * M.AC * 0.2 / M.torricelliQ(0.2), 1e-9);
  { let h = 0.2, t = 0; const dt = 1e-4; while (h > 0.1) { h -= M.torricelliQ(h) * dt / M.AC; t += dt; } near(t, M.emptyTime(0.2, 0.1), 2e-3); }
  for (const v of [3, 6, 9]) { const c = M.cycle(v, 3), last = c.tr[c.tr.length - 1]; near(c.drop, v / 1000 / M.AC, 1e-12); ok(c.tBreak > 0, 'every flush siphons'); ok(last.hc > M.H0 - 0.001 && !last.open, 'cistern refills and the flapper is shut'); ok(last.h > -0.002 && last.h < 0.01, 'the seal is restored'); ok(c.tShut > M.emptyTime(0.2, 0.2 - c.drop), 'filling during the flush lengthens it'); }
  near(M.cycle(6, 3).tShut, 3.36, 0.03); near(M.cycle(6, 3).tBreak, 3.86, 0.03); near(M.cycle(6, 3).tEnd, 58.7, 0.5); ok(M.cycle(6, 6).tEnd < M.cycle(6, 3).tEnd, 'higher pressure refills sooner');
  near(M.capVol(0.05, 0.1), 4 / 3 * Math.PI * 0.05 ** 3, 1e-12); near(M.capVol(0.05, 0.05), 2 / 3 * Math.PI * 0.05 ** 3, 1e-12); near(M.capVol(0.05, 0), 0, 1e-15);
  near(M.holdBar(8, 50, 100, 4), 32.689, 0.002); near(M.holdBar(8, 50, 100, 8) / M.holdBar(8, 50, 100, 4), 0.25, 1e-12); near(M.holdBar(4, 50, 100, 4) / M.holdBar(8, 50, 100, 4), 0.5, 1e-12);
  near(M.restDepth(8, 50, 4, 3), 18.694, 0.002); near(M.holdBar(8, 50, M.restDepth(8, 50, 4, 3), 4), 3, 1e-6); ok(M.restDepth(8, 50, 4, 6) > M.restDepth(8, 50, 4, 3), 'more pressure, deeper float'); ok(M.restDepth(4, 40, 6, 6) === Infinity, 'a small float on a short lever cannot close');
  near(M.fillQmax(3) * 1000, 0.21547, 1e-4); near(M.fillQmax(6) / M.fillQmax(3), Math.SQRT2, 1e-12); near(0.006 / M.fillQmax(3), 27.846, 0.002); near(0.006 / M.fillQmax(6), 19.690, 0.002);
};
