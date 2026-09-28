// Complex systems: Kuramoto's exact r(K) for the Lorentzian, the abelian sandpile's toppling rule and commutativity, union-find percolation against exact small cases and the known threshold, and the Vicsek order parameter at zero and maximal noise.
module.exports = (M, { ok, near }) => {
  // 1. Kuramoto: Lorentzian quantiles are symmetric with median 0 and the right quartiles; r(K) closed form; simulation near theory above threshold, small below
  { const om = M.lorentzQuantiles(120, 1); near(om[59] + om[60], 0, 1e-12); near(om[89] + om[30], 0, 1e-12); ok(om[0] < -30 && om[119] > 30, 'heavy tails');
    const q = M.lorentzQuantiles(1000, 2); near(q[750], 2, 0.02);
    near(M.rTheory(4, 1), Math.sqrt(0.5), 1e-12); near(M.rTheory(2, 1), 0, 1e-12); near(M.rTheory(1, 1), 0, 1e-12);
    near(M.lockedFraction(3, M.rTheory(3, 1), 1), (2 / Math.PI) * Math.atan(Math.sqrt(3)), 1e-12);
    const hi = M.kuramotoRun(120, 1, 6, 0.02, 1500, 1500); near(hi.rMean, M.rTheory(6, 1), 0.08);
    const lo = M.kuramotoRun(120, 1, 0.5, 0.02, 1500, 1500); ok(lo.rMean < 0.25, 'incoherent below threshold');
    const r0 = M.orderParam(Float64Array.from([0, Math.PI])); near(r0.r, 0, 1e-12); const r1 = M.orderParam(Float64Array.from([0.3, 0.3, 0.3])); near(r1.r, 1, 1e-12); near(r1.psi, 0.3, 1e-12); }
  // 2. sandpile: four grains topple once onto the four neighbours; the pile is stable; grains conserved away from the edge; abelian
  { const z = new Uint8Array(25); for (let k = 0; k < 3; k++) ok(M.sandpileAdd(z, 5, 2, 2) === 0, 'no toppling below 4');
    ok(M.sandpileAdd(z, 5, 2, 2) === 1, 'the fourth grain topples once'); ok(z[12] === 0 && z[7] === 1 && z[17] === 1 && z[11] === 1 && z[13] === 1, 'one grain to each neighbour'); ok(M.grains(z) === 4, 'conserved');
    for (let k = 0; k < 12; k++) M.sandpileAdd(z, 5, 2, 2); ok(M.grains(z) === 16 && z.every((h) => h < 4), '16 grains, stable');
    const a = new Uint8Array(49), b = new Uint8Array(49); for (let k = 0; k < 5; k++) { M.sandpileAdd(a, 7, 3, 3); M.sandpileAdd(a, 7, 2, 4); } for (let k = 0; k < 5; k++) M.sandpileAdd(b, 7, 2, 4); for (let k = 0; k < 5; k++) M.sandpileAdd(b, 7, 3, 3);
    ok(Array.from(a).join('') === Array.from(b).join(''), 'the sandpile is abelian');
    const run = M.sandpileRun(41, 3000, 0); ok(run.z.every((h) => h < 4), 'stable after 3000 centre drops'); ok(M.grains(run.z) === 3000, 'nothing lost while the pile is small'); const small = M.sandpileRun(21, 3000, 0); ok(M.grains(small.z) < 3000 && small.z.every((h) => h < 4), 'grains are lost once the pile reaches the edge');
    ok(run.sizes[2] === 0 && run.sizes[3] === 1 && run.sizes[15] === 6, 'the sixteenth grain makes an avalanche of size 6');
    const H = M.sizeHistogram(M.sandpileRun(61, 20000, 1).sizes); ok(H.slope !== null && H.slope < -0.8 && H.slope > -1.8, 'power law slope in range'); }
  // 3. percolation: exact clusters on a hand-made field, p = 0 and 1, monotone spanning, threshold bracketed on the 48-lattice
  { const u = Float32Array.from([0.1, 0.9, 0.1, 0.1, 0.9, 0.9, 0.9, 0.9, 0.1]); const C = M.clusters(u, 3, 0.5);
    ok(C.count === 3 && C.openCount === 4 && C.largestSize === 2 && C.spanning === null, 'three clusters, none spanning'); ok(C.label[0] === C.label[3] && C.label[2] !== C.label[8] && C.label[4] === -1, 'neighbours join, diagonals do not');
    const C2 = M.clusters(u, 3, 0.95); ok(C2.count === 1 && C2.spanning !== null, 'all open: one spanning cluster');
    const f = M.field(48, 5); ok(!M.spans(f, 48, 0) && M.spans(f, 48, 1), 'p = 0 never spans, p = 1 always');
    let prev = false, mono = true; for (let p = 0; p <= 1.0001; p += 0.02) { const s = M.spans(f, 48, p); if (prev && !s) mono = false; prev = s; } ok(mono, 'spanning is monotone in p for a fixed field');
    const lo = M.spanningCurve(48, [0.5], 30)[0][1], hi = M.spanningCurve(48, [0.7], 30)[0][1]; ok(lo < 0.15 && hi > 0.9, 'threshold between 0.5 and 0.7'); near(M.PC, 0.5927, 1e-3); }
  // 4. Vicsek: zero noise orders, maximal noise does not; speed and box are respected
  { const o = M.vicsekRun(300, 2, 0, 300, 100); ok(o.phiMean > 0.9, 'ordered at zero noise');
    const d = M.vicsekRun(300, 2, 2 * Math.PI, 100, 100); ok(d.phiMean < 0.2, 'disordered at maximal noise');
    const s = M.vicsekInit(50, 5, 1); const x0 = Float64Array.from(s.x), y0 = Float64Array.from(s.y); M.vicsekStep(s, 1, 0.05);
    ok(s.x.every((x) => x >= 0 && x < 5) && s.y.every((y) => y >= 0 && y < 5), 'stays in the box');
    let okSpeed = true; for (let i = 0; i < 50; i++) { let dx = s.x[i] - x0[i], dy = s.y[i] - y0[i]; dx -= 5 * Math.round(dx / 5); dy -= 5 * Math.round(dy / 5); if (Math.abs(Math.hypot(dx, dy) - 0.05) > 1e-9) okSpeed = false; } ok(okSpeed, 'every particle moves v0 per step');
    near(M.polarisation(Float64Array.from([1, 1, 1])), 1, 1e-12); near(M.polarisation(Float64Array.from([0, Math.PI])), 0, 1e-12); }
};
