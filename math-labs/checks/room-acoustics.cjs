// Room acoustics: mode frequencies of the worked example (and the 2:1 degeneracy), nodes at the centre, the mode count against Weyl's formula, the modal sum peaking at an isolated mode, Sabine and Eyring (worked example, 0.161 from first principles, Eyring < Sabine), the critical distance in both forms, the mean free path 4V/S by Monte Carlo, and the boundary comb (worked example, notch positions and depths, bass lift, field sum = direct x H).
module.exports = (M, { ok, near }) => {
  const f = (...n) => M.modeFreq(5, 4, 2.5, ...n);
  near(f(1, 0, 0), 34.3, 1e-9); near(f(0, 1, 0), 42.875, 1e-9); near(f(0, 0, 1), 68.6, 1e-9); near(f(2, 0, 0), f(0, 0, 1), 1e-12); near(f(1, 1, 0), 54.907, 0.001);
  ok(M.modeKind([1, 0, 0]) === 'axial' && M.modeKind([1, 1, 0]) === 'tangential' && M.modeKind([1, 2, 1]) === 'oblique', 'mode kinds');
  const list = M.modeList(5, 4, 2.5, 400);
  ok(list.every((m, i) => i === 0 || m.f >= list[i - 1].f), 'sorted');
  near(M.modeShape([1, 0, 0], 5, 4, 2.5, 2.5, 1, 1), 0, 1e-12); near(M.modeShape([0, 1, 0], 5, 4, 2.5, 1, 2, 1), 0, 1e-12); near(Math.abs(M.modeShape([3, 2, 1], 5, 4, 2.5, 0, 0, 0)), 1, 1e-12);
  // mode count against Weyl's asymptotic formula (rigid walls, including axial and tangential corrections)
  { const n = list.length, w = M.weyl(5, 4, 2.5, 400); ok(Math.abs(n - w) / w < 0.05, `Weyl count ${n} vs ${w.toFixed(1)}`); }
  // at an isolated low mode, a listener off its node sees a peak near the mode frequency
  { const L = [7, 3.1, 2.4], ml = M.modeList(...L, 400), src = [0, 0, 0], rcv = [0.3, 0.3, 0.3], f1 = M.modeFreq(...L, 1, 0, 0); let best = [0, 0];
    for (let x = 18; x <= 30; x += 0.01) { const a = M.cx.abs(M.modalResponse(...L, src, rcv, x, 2.0, ml)); if (a > best[1]) best = [x, a]; } near(best[0], f1, 0.3); }
  // Sabine: worked example; the constant from first principles; Eyring below Sabine and to zero at alpha -> 1
  { const R = M.roomAbsorption(0, 0, 0, 0.05, 50); near(R.V, 50, 1e-12); near(R.S, 85, 1e-12); near(R.A, 11.25, 1e-12); near(M.sabine(R.V, R.A), 0.716, 1e-3);
    const Rc = M.roomAbsorption(0, 1, 0, 0.05, 50); near(M.sabine(Rc.V, Rc.A), 0.528, 1e-3);
    near(4 * Math.log(1e6) / 343, 0.1611, 1e-4);
    ok(M.eyring(R.V, R.S, R.abar) < M.sabine(R.V, R.A), 'Eyring below Sabine'); near(M.eyring(R.V, R.S, 0.01) / M.sabine(R.V, R.S * 0.01), 1, 0.006); ok(M.eyring(50, 85, 0.999999) < 0.01, 'Eyring vanishes');
    near(M.critDist(2, R.A), 0.669, 1e-3); near(M.critDist(2, R.A), 0.057 * Math.sqrt(2 * R.V / M.sabine(R.V, R.A)), 0.01);
    near(M.levelDirect(2, M.critDist(2, R.A)), M.levelReverb(R.A), 1e-9);
    near(M.schroeder(0.4, 50), 178.9, 0.1); }
  // mean free path 4V/S: chords from surface points with cosine-weighted inward directions (Cauchy's formula), seeded Monte Carlo
  { let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const [a, b, h] = [5, 4, 2.5], faces = [[a * b, 2], [a * b, 2], [b * h, 0], [b * h, 0], [a * h, 1], [a * h, 1]], S = 2 * (a * b + b * h + a * h), dims = [a, b, h];
    let tot = 0; const N = 200000;
    for (let i = 0; i < N; i++) {
      let u = rnd() * S, fi = 0; while (u > faces[fi][0]) { u -= faces[fi][0]; fi++; }
      const ax = faces[fi][1], hi = fi % 2 === 1, p = dims.map((d) => rnd() * d); p[ax] = hi ? dims[ax] : 0;
      const r = Math.sqrt(rnd()), ph = 2 * Math.PI * rnd(), cz = Math.sqrt(1 - r * r), dir = [0, 0, 0], o = [0, 1, 2].filter((k) => k !== ax);
      dir[o[0]] = r * Math.cos(ph); dir[o[1]] = r * Math.sin(ph); dir[ax] = hi ? -cz : cz;
      let t = Infinity; for (let k = 0; k < 3; k++) if (Math.abs(dir[k]) > 1e-12) { const tt = ((dir[k] > 0 ? dims[k] : 0) - p[k]) / dir[k]; if (tt > 1e-9) t = Math.min(t, tt); }
      tot += t;
    }
    near(tot / N, M.meanFreePath(a * b * h, S), 0.02); }
  // boundary comb: worked example
  { const R = M.reflection(1.0, 1.2, 3); near(R.r1, 3.00666, 1e-5); near(R.r2, 3.72022, 1e-5); near(R.Delta, 0.71356, 1e-5);
    const ns = M.notches(R.Delta, 1000); near(ns[0], 240.35, 0.01); near(ns[1], 721.04, 0.02);
    near(M.dB(M.boundaryH(1.0, 1.2, 3, 0.9, ns[0])), 20 * Math.log10(1 - 0.9 * R.r1 / R.r2), 1e-9); near(M.dB(M.boundaryH(1.0, 1.2, 3, 0.9, ns[0])), -11.2, 0.1);
    near(M.dB(M.boundaryH(1.0, 1.2, 3, 0.9, 2 * ns[0])), 20 * Math.log10(1 + 0.9 * R.r1 / R.r2), 1e-9); }
  { near(M.reflection(0.5, 3, 0).Delta, 1, 1e-12); near(M.notches(1, 200)[0], 171.5, 1e-9); near(M.notches(0.2, 1000)[0], 857.5, 1e-9); near(M.dB(M.boundaryH(0.1, 2.6, 0, 0.9, 5)), 5.27, 0.01); }
  // the field of source + image at the listener equals the direct wave times H
  { const a = 0.8, b = 1.5, d = 2.2, g = 0.7, fr = 333, k = 2 * Math.PI * fr / M.C, R = M.reflection(a, b, d), p = M.fieldAt(a, g, k, d, b), dir = M.cx.scale(M.cx.expj(-k * R.r1), 1 / R.r1), H = M.boundaryH(a, b, d, g, fr), q = M.cx.mul(dir, H); near(p[0], q[0], 1e-12); near(p[1], q[1], 1e-12); }
};
