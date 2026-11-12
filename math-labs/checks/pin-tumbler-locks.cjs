// Pin-tumbler locks: the join sits one step from the shear line per step of wrong cut, the lock opens only to its
// code (or code plus wafer); the count of cuttable keys matches brute force and its limits; the binding order is a
// permutation by hole error and the plug rotation is a rising staircase.
module.exports = (M, { ok, near }) => {
  near(M.pinError(7, 5), 0.762, 1e-12); near(M.pinError(4, 4), 0, 1e-12); near(M.pinError(2, 5), -1.143, 1e-12);
  ok(M.opens([3, 6, 2, 7, 4]) && !M.opens([3, 6, 2, 5, 4]) && !M.opens([3, 6, 2, 7, 5]), 'only the code opens');
  { let n = 0; for (let k = 0; k < 1e5; k++) { const c = String(k).padStart(5, '0').split('').map(Number); if (M.opens(c)) n++; } near(n, 1, 1e-9); }
  { let n = 0; for (let k = 0; k < 1e5; k++) { const c = String(k).padStart(5, '0').split('').map(Number); if (M.opens(c, M.CODE, [1, 0, 2, 0, 1])) n++; } near(n, 8, 1e-9); near(M.masterOpens(3), 8, 1e-12); }
  near(M.differs(5, 10, 9), 1e5, 1e-9); near(M.differs(5, 10, 10), 1e5, 1e-9); near(M.differs(5, 10, 0), 10, 1e-9); near(M.differs(1, 7, 2), 7, 1e-9); near(M.differs(5, 10, 7), 79666, 1e-9); near(M.differs(6, 10, 7), 753754, 1e-9);
  for (const [d, m] of [[10, 7], [6, 3], [4, 1]]) near(M.differs(2, d, m), d + 2 * m * d - m * (m + 1), 1e-9);
  for (const [n, d, m] of [[3, 4, 1], [4, 5, 2], [3, 6, 3]]) { let c = 0; const rec = (i, prev) => { if (i === n) { c++; return; } for (let a = 0; a < d; a++) if (prev < 0 || Math.abs(a - prev) <= m) rec(i + 1, a); }; rec(0, -1); near(M.differs(n, d, m), c, 1e-9); }
  for (let m = 1; m <= 9; m++) ok(M.differs(5, 10, m) > M.differs(5, 10, m - 1), 'looser rule, more keys'); near(6 ** 6, 46656, 1e-9); near(7 ** 5, 16807, 1e-9);
  for (const seed of [1, 2, 3, 7, 20]) { const b = M.binding(5, 30, seed); ok([...b.order].sort().join('') === '01234', 'binding order is a permutation'); ok(b.e.every((x) => Math.abs(x) <= 30), 'errors within tolerance'); near(b.rot[0], 20 / 6350, 1e-15);
    for (let k = 1; k < 5; k++) { ok(b.e[b.order[k]] <= b.e[b.order[k - 1]], 'pins bind in order of hole error'); ok(b.rot[k] >= b.rot[k - 1], 'rotation never decreases'); near(b.rot[k] - b.rot[0], (b.e[b.order[0]] - b.e[b.order[k]]) / 6350, 1e-15); } }
  ok(M.binding(5, 30, 1).order.join('') !== M.binding(5, 30, 2).order.join(''), 'different locks, different orders'); near(M.binding(5, 60, 4).e[2] / M.binding(5, 30, 4).e[2], 2, 1e-9); near(20 / 6350 * 180 / Math.PI, 0.18046, 1e-5);
};
