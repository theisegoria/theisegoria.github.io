// Touchscreens: the profile is symmetric, largest at the contact and weaker and wider through thicker glass; the
// centroid recovers a noise-free finger to within half a millimetre anywhere in the interior, far better than the
// strongest node alone, and is exact on a node by symmetry; the charge-transfer formula agrees with step-by-step
// charge sharing, and the count scales with the capacitor ratio.
module.exports = (M, { ok, near }) => {
  near(M.dC(0, 4, 0.7), M.peak(4, 0.7), 1e-15); near(M.dC(3, 4, 0.7), M.dC(-3, 4, 0.7), 1e-15); near(M.peak(4, 0.7), 0.3742, 1e-4); near(M.sigma(4, 0.7), 3.255, 1e-3); near(M.peak(4, 2.7), 0.1488, 1e-4); near(M.sigma(4, 2.7), 4.515, 1e-3);
  ok(M.peak(4, 0.4) > M.peak(4, 0.7) && M.peak(4, 0.7) > M.peak(4, 2), 'thicker glass, weaker signal'); ok(M.sigma(4, 2) > M.sigma(4, 0.7), 'thicker glass, wider response'); ok(M.peak(2, 0.7) < M.peak(4, 0.7) && M.peak(4, 0.7) <= M.DC0, 'a smaller contact gives less');
  near(M.dC(M.sigma(4, 0.7), 4, 0.7) / M.peak(4, 0.7), Math.exp(-0.5), 1e-12);
  let worst = 0, worstNode = 0; for (let x = 7.5; x <= 32.5; x += 0.5) for (let y = 7.5; y <= 52.5; y += 0.5) { const l = M.locate(M.frame(x, y, 4, 0.7, 0)); worst = Math.max(worst, Math.hypot(l.x - x, l.y - y)); worstNode = Math.max(worstNode, Math.hypot(l.node[0] - x, l.node[1] - y)); }
  ok(worst < 0.5, 'centroid within half a millimetre'); ok(worstNode > 3.4 && worstNode < 3.6, 'nearest node off by up to half a diagonal'); ok(worst < worstNode / 6, 'centroid beats the grid');
  { const l = M.locate(M.frame(17.5, 32.5, 4, 0.7, 0)); near(l.x, 17.5, 1e-9); near(l.y, 32.5, 1e-9); near(l.peak, M.peak(4, 0.7), 1e-12); }
  { const a = M.locate(M.frame(17, 33, 4, 0.7, 0)), b = M.locate(M.frame(17, 33, 4, 0.7, 0.05)); ok(Math.hypot(a.x - 17, a.y - 33) < 0.5, 'noise-free case'); ok(Math.hypot(b.x - 17, b.y - 33) < 2, 'moderate noise leaves a usable estimate'); }
  ok(M.frame(10, 10, 4, 0.7, 0).length === M.GRID.nx * M.GRID.ny, 'one reading per node'); for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) ok(Math.abs(M.hash(i, j)) <= 1, 'bounded noise pattern');
  // charge sharing step by step
  for (const [cx, cs] of [[2, 1500], [1.63, 1500], [3, 10000]]) { let v = 0, n = 0; const vdd = 3.3; while (v < vdd / 2) { v = (cs * v + cx * vdd) / (cs + cx); n++; near(v, M.vAfter(n, cx, cs, vdd), 1e-9); } ok(n === M.transfers(cx, cs), 'count matches the closed form'); near(M.transfersExact(cx, cs), (cs / cx) * Math.log(2), (cs / cx) * Math.log(2) * 2e-3 + 0.6); }
  ok(M.transfers(2, 1500) === 521 && M.transfers(1.63, 1500) === 639, 'worked example'); near(M.transfersExact(2, 3000) / M.transfersExact(2, 1500), 2, 1e-3); ok(M.transfersExact(1.6, 1500) > M.transfersExact(2, 1500), 'a touched node needs more transfers');
  near(M.vAfter(0, 2, 1500), 0, 1e-15); ok(M.vAfter(1e7, 2, 1500) <= 3.3 && M.vAfter(1e7, 2, 1500) > 3.29, 'tends to the supply');
};
