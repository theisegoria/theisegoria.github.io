// Coding theory: Hamming(7,4) corrects every single error in every codeword and its 16 codewords are pairwise at
// distance >= 3 with weight enumerator 1 + 7z^3 + 7z^4 + z^7; the block failure formula matches brute force over all
// error patterns; the bundled small codes have the stated distances and the n = 3 repetition code is perfect; the
// asymptotic bounds are ordered (GV <= Hamming <= Singleton) and the famous codes respect the Hamming bound; GF(13)
// arithmetic is a field; Reed-Solomon decoding recovers every message from any pattern with 2e + s <= n - k and
// never claims success with a polynomial that disagrees with more than t surviving symbols.
module.exports = (M, { ok, near }) => {
  // --- Hamming(7,4) ---
  const words = [];
  for (let m = 0; m < 16; m++) {
    const w = M.h74Encode(m);
    ok(M.h74Syndrome(w) === 0, 'codeword has zero syndrome');
    const d0 = M.h74Decode(w); ok(d0.m === m && d0.s === 0, 'clean decode');
    for (let p = 1; p <= 7; p++) { const r = w.slice(); r[p] ^= 1; const d = M.h74Decode(r); ok(d.s === p, 'syndrome names the flipped bit'); ok(d.m === m, 'single error corrected'); }
    words.push(parseInt(w.slice(1).join(''), 2));
  }
  ok(M.minDistance(words) === 3, 'Hamming(7,4) has distance 3');
  const wt = [0, 0, 0, 0, 0, 0, 0, 0]; words.forEach((w) => { wt[M.hd(w, 0)]++; });
  ok(wt.join() === '1,0,0,7,7,0,0,1', 'weight enumerator 1 + 7z^3 + 7z^4 + z^7');
  // double errors always decode wrongly (a perfect code moves them to the wrong ball)
  { const w = M.h74Encode(5); let wrong = 0; for (let a = 1; a <= 7; a++) for (let b = a + 1; b <= 7; b++) { const r = w.slice(); r[a] ^= 1; r[b] ^= 1; if (M.h74Decode(r).m !== 5) wrong++; } ok(wrong === 21, 'every double error decodes wrongly'); }
  // block failure by brute force over the 128 error patterns
  for (const p of [0.001, 0.03, 0.2, 0.45]) {
    let fail = 0;
    for (let e = 0; e < 128; e++) {
      const k = M.hd(e, 0), pr = Math.pow(p, k) * Math.pow(1 - p, 7 - k), w = M.h74Encode(11), r = w.slice();
      for (let i = 0; i < 7; i++) if ((e >> i) & 1) r[i + 1] ^= 1;
      if (M.h74Decode(r).m !== 11) fail += pr;
    }
    near(fail, M.blockFailCoded(p), 1e-12);
    near(M.blockFailRaw(p), 1 - (1 - p) ** 4, 1e-15);
  }
  // --- Hamming space ---
  const want = [3, 2, 4, 2, 2];
  M.CODES.forEach((c, i) => { ok(M.minDistance(c.words) === want[i], 'code distance ' + i); ok(c.words.every((w) => w < (1 << c.n)), 'words fit'); });
  ok(M.codeStats(M.CODES[0]).perfect, 'n = 3 repetition is perfect');
  ok(!M.codeStats(M.CODES[2]).perfect && M.codeStats(M.CODES[2]).hammingOK, 'n = 4 repetition is not perfect but obeys the bound');
  // ties in the n = 4 repetition code: exactly the six weight-2 words
  { let ties = 0; for (let x = 0; x < 16; x++) if (M.nearest(M.CODES[2].words, x).who.length > 1) ties++; ok(ties === 6, 'six tied words'); }
  ok(M.ballVolume(7, 1) === 8 && M.ballVolume(23, 3) === 2048, 'Hamming and Golay balls');
  ok(16 * M.ballVolume(7, 1) === 128 && 4096 * M.ballVolume(23, 3) === 2 ** 23, 'Hamming(7,4) and Golay(23) are perfect');
  for (let i = 1; i < 100; i++) {
    const dl = i / 100;
    ok(M.BOUNDS.gv(dl) <= M.BOUNDS.hamming(dl) + 1e-12 && M.BOUNDS.hamming(dl) <= M.BOUNDS.singleton(dl) + 1e-12, 'bounds ordered');
  }
  near(M.H2(0.5), 1, 1e-15); near(M.H2(0.11), 0.4999, 2e-4);
  M.FAMOUS.forEach((q) => { const t = Math.floor((q.d - 1) / 2); ok(2 ** q.k * M.ballVolume(q.n, t) <= 2 ** q.n, 'famous code obeys Hamming bound: ' + q.name); ok(q.k <= q.n - q.d + 1, 'Singleton: ' + q.name); });
  // --- GF(13) ---
  for (let a = 1; a < 13; a++) ok((a * M.inv(a)) % 13 === 1, 'inverse');
  // --- Reed-Solomon ---
  let seed = 1;
  const rnd = (m) => { seed = (seed * 48271) % 2147483647; return seed % m; };
  for (let trial = 0; trial < 400; trial++) {
    const k = 2 + rnd(5), n = Math.min(12, k + 2 + rnd(7)), msg = M.rsMessage(k, rnd(100)), sent = M.rsEncode(msg, n);
    ok(sent.length === n, 'length');
    const budget = n - k, s = rnd(budget + 1), e = Math.floor((budget - s) / 2) - (rnd(3) === 0 ? 0 : rnd(2));
    const recv = sent.slice(), idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = rnd(i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    idx.slice(0, s).forEach((i) => { recv[i] = -1; });
    idx.slice(s, s + Math.max(0, e)).forEach((i) => { recv[i] = (sent[i] + 1 + rnd(12)) % 13; });
    const d = M.rsDecode(recv, k);
    ok(d.ok, `RS decodes within budget (n ${n}, k ${k}, s ${s}, e ${e})`);
    if (d.ok) { ok(d.P.every((c, i) => c === msg[i]), 'RS recovers the message'); ok(d.bad.length === Math.max(0, e), 'RS locates every error'); }
  }
  // beyond the budget a success must still be a genuine codeword within t of the survivors
  for (let trial = 0; trial < 200; trial++) {
    const k = 3, n = 9, msg = M.rsMessage(k, trial), sent = M.rsEncode(msg, n), recv = sent.slice();
    for (let i = 0; i < 4; i++) recv[(trial + 2 * i) % n] = (sent[(trial + 2 * i) % n] + 3) % 13;
    const d = M.rsDecode(recv, k);
    if (d.ok) { const bad = recv.map((y, i) => (M.peval(d.P, i + 1) !== y ? 1 : 0)).reduce((a, b) => a + b, 0); ok(bad <= 3, 'claimed decode is within t'); }
  }
  // the minimum distance of RS is n - k + 1: two messages differing agree in at most k - 1 points
  for (let a = 0; a < 30; a++) { const k = 4, n = 12, p = M.rsEncode(M.rsMessage(k, a), n), q = M.rsEncode(M.rsMessage(k, a + 31), n); const same = p.filter((y, i) => y === q[i]).length; ok(p.join() === q.join() || same <= k - 1, 'RS distance'); }
};
