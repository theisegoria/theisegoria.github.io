// Data storage: the mean seek uses E sqrt|x - y| = 8/15 (checked by integration); latency is half a revolution; data rate
// is proportional to radius and matches the stated bit density; the actuator geometry puts the head at the requested
// radius; the Gaussian tail function has its known values; flash levels are ordered, the default references minimise
// errors locally, error rate rises with wear and with bits per cell and hits the correction limit near the typical
// endurance figures; workload times reduce to their closed forms.
module.exports = (M, { ok, near }) => {
  let s = 0; const N = 400; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += Math.sqrt(Math.abs((i + 0.5) / N - (j + 0.5) / N)); near(s / (N * N), 8 / 15, 2e-4);
  near(M.meanSeek(), 0.0008 + 0.0152 * (8 / 15), 1e-12); near(M.seekTime(0.0205, 0.046), 0.016, 1e-12); near(M.seekTime(0.03, 0.03), 0, 1e-15);
  ok(M.seekTime(0.03, 0.0364) / M.seekTime(0.03, 0.0316) < 2.01 && M.seekTime(0.03, 0.0364) > M.seekTime(0.03, 0.0316), 'four times the distance, about twice the time');
  near(M.latency(7200), 60 / 7200 / 2, 1e-15); near(M.hddIops(7200), 76.49, 0.01); ok(M.hddIops(15000) / M.hddIops(7200) < 1.25, 'spin speed helps little');
  near(M.dataRate(0.046, 7200) / M.dataRate(0.023, 7200), 2, 1e-12); near(M.dataRate(0.046, 7200), 120 * 2 * Math.PI * 0.046 * 57.6e6 / 8, 1e-3);
  for (const r of [0.0205, 0.03, 0.04, 0.046]) { const p = M.headPos(r); near(Math.hypot(p[0], p[1]), r, 1e-12); near(Math.hypot(p[0] - M.PIV[0], p[1] - M.PIV[1]), M.LA, 1e-12); }
  ok(M.armAngle(0.046) > M.armAngle(0.0205), 'the arm swings outward monotonically');
  near(M.Qf(0), 0.5, 1e-7); near(M.Qf(1.6448536), 0.05, 1e-6); near(M.Qf(3), 0.0013499, 1e-6); near(M.Qf(-1) + M.Qf(1), 1, 1e-7);
  for (const b of [1, 2, 3, 4]) {
    const lv = M.levels(b, 1000, 12), refs = M.defaultRefs(lv); ok(lv.length === 2 ** b && refs.length === 2 ** b - 1, 'level count');
    ok(lv.every((q, i) => i === 0 || q.mean > lv[i - 1].mean) && refs.every((x, i) => x > lv[i].mean && x < lv[i + 1].mean), 'levels ordered, references between them');
    const e0 = M.rber(lv, refs, b); for (let i = 0; i < refs.length; i += Math.max(1, refs.length >> 1)) for (const d of [-0.05, 0.05]) { const r2 = refs.slice(); r2[i] += d; ok(M.rber(lv, r2, b) >= e0 * 0.999, 'default reference is near the optimum'); }
    ok(M.rber(M.levels(b, 20000, 12), M.defaultRefs(M.levels(b, 20000, 12)), b) > e0, 'wear raises the error rate');
  }
  const at = (b, c) => { const lv = M.levels(b, c, 12); return M.rber(lv, M.defaultRefs(lv), b); };
  ok(at(1, 3000) < at(2, 3000) && at(2, 3000) < at(3, 3000) && at(3, 3000) < at(4, 3000), 'more bits per cell, more errors');
  for (const [b, lo, hi] of [[1, 30000, 80000], [2, 6000, 15000], [3, 2000, 4500], [4, 600, 1500]]) ok(at(b, lo) < M.ECC_LIMIT && at(b, hi) > M.ECC_LIMIT, `endurance of ${b} bits per cell in the typical range`);
  { const lv = [{ mean: 0, sigma: 1 }, { mean: 4, sigma: 1 }]; near(M.rber(lv, [2], 1), M.Qf(2), 1e-12); }
  const G = 2 ** 30;
  near(M.jobTime(0, G, 0).time, G / 200e6, 1e-9); near(M.jobTime(0, G, 1, 1).time, (G / 4096) / M.hddIops(7200), 1e-6); near(M.jobTime(1, G, 1, 1).time, (G / 4096) * 90e-6, 1e-9);
  near(M.jobTime(2, G, 1, 64).iops, 64 / 25e-6, 1e-6); near(M.jobTime(1, G, 1, 64).iops, 32 / 90e-6, 1e-6); near(M.jobTime(2, G, 0.25, 1).time, 0.25 * (G / 4096) * 25e-6 + 0.75 * G / 7e9, 1e-9);
  ok(M.jobTime(0, G, 1, 32).iops > M.jobTime(0, G, 1, 1).iops && M.jobTime(0, G, 1, 32).iops < 400, 'queueing helps a disc only modestly');
};
