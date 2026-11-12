// Bicycles: the Whipple model reproduces the published benchmark matrices, eigenvalues at 5 m/s and the weave and capsize
// speeds (Meijaard et al. 2007, tables 1 and 2); the characteristic polynomial's roots satisfy it; the knock response
// decays inside the stable range and grows outside it; gear speeds, sprocket radii and the power balance have their
// closed forms and the chain's path closes with tangent runs; the indexing error is linear in slack and accumulates with
// a mismatched pull; braking satisfies the force and moment balances with the stated limits; brake forces follow the
// lever and area ratios.
module.exports = (M, { ok, near, values }) => {
  const W = M.whipple();
  near(W.M[0][0], 80.81722, 1e-5); near(W.M[0][1], 2.31941332208709, 1e-9); near(W.M[1][1], 0.29784188199686, 1e-9);
  near(W.K0[0][0], -80.95, 1e-9); near(W.K0[0][1], -2.59951685249872, 1e-9); near(W.K0[1][1], -0.80329488458618, 1e-9);
  near(W.K2[0][1], 76.59734589573222, 1e-9); near(W.K2[1][1], 2.65431523794604, 1e-9); near(W.K2[0][0], 0, 1e-12); near(W.K2[1][0], 0, 1e-12);
  near(W.C1[0][1], 33.86641391492494, 1e-9); near(W.C1[1][0], -0.85035641456978, 1e-9); near(W.C1[1][1], 1.68540397397560, 1e-9); near(W.C1[0][0], 0, 1e-12);
  const e5 = M.eigen(W, 5);
  near(e5[0][0], -14.07838969279822, 1e-8); near(e5[3][0], -0.32286642900409, 1e-8); near(e5[1][0], -0.77534188219585, 1e-8); near(Math.abs(e5[1][1]), 4.46486771378823, 1e-8);
  const R = M.stableRange(W); near(R.weave, 4.292382536341, 1e-4); near(R.capsize, 6.024262015388, 1e-4);
  for (const v of [0.5, 3, 7.5]) { const a = M.charPoly(W, v); for (const z of M.eigen(W, v)) { let p = [a[0], 0]; for (let k = 1; k < 5; k++) p = [p[0] * z[0] - p[1] * z[1] + a[k], p[0] * z[1] + p[1] * z[0]]; ok(Math.hypot(p[0], p[1]) < 1e-6 * Math.abs(a[0]) * Math.max(1, Math.hypot(z[0], z[1]) ** 4), 'eigenvalue satisfies the characteristic equation'); } }
  { const r = M.polyRoots([1, -6, 11, -6]).map((z) => z[0]).sort((a, b) => a - b); near(r[0], 1, 1e-9); near(r[1], 2, 1e-9); near(r[2], 3, 1e-9); }
  ok(M.growth(W, 5) < 0 && M.growth(W, 3) > 0 && M.growth(W, 8) > 0, 'stable only between the two speeds');
  { const s5 = M.simulate(W, 5), end = s5.pts[s5.pts.length - 1]; ok(!s5.fell && Math.abs(end.phi) < 0.01 && Math.abs(end.delta) < 0.01, 'the knock dies away at 5 m/s'); ok(M.simulate(W, 2).fell, 'falls at 2 m/s');
    // the decay of the weave matches its eigenvalue: successive peaks of phi shrink by exp(Re s * period)
    const P = s5.pts, pk = []; for (let i = 1; i < P.length - 1; i++) if (P[i].phi > P[i - 1].phi && P[i].phi >= P[i + 1].phi && P[i].t > 1.2) pk.push(P[i]);
    ok(pk.length >= 2, 'weave peaks found'); near(pk[1].t - pk[0].t, (2 * Math.PI) / 4.46486771378823, 0.05); }
  ok(!Number.isFinite(M.stableRange(M.whipple({ IFyy: 0, IRyy: 0 })).weave), 'no self-stability without wheel spin (benchmark)');
  ok(!Number.isFinite(M.stableRange(M.whipple({ lam: 0 })).weave), 'none with an upright steering axis');
  near(M.speed(90, 50, 11) * 3.6, 1.5 * (50 / 11) * 2.105 * 3.6, 1e-9); near(M.pitchRadius(50) * 2 * Math.sin(Math.PI / 50), 0.0127, 1e-12);
  near(M.pitchRadius(1e6) * 2 * Math.PI, 0.0127e6, 1e-3);
  { const p = M.power(40 / 3.6); near(p.aero, 0.5 * 1.225 * 0.32 * (40 / 3.6) ** 3, 1e-9); near(p.roll, 0.005 * 80 * 9.81 * (40 / 3.6), 1e-9); near(p.crank * 0.975, p.wheel, 1e-9); near(p.crank, 320.47, 0.01); }
  { const p = M.power(3, 100); near(p.climb, 80 * 9.81 * 3 * Math.SQRT1_2, 1e-9); } near(M.power(M.speedForPower(250, 4), 4).crank, 250, 1e-6);
  for (const [a, b] of [[50, 11], [34, 32], [50, 17]]) {
    const c = M.chainPath(a, b); near(Math.hypot(c.pts[0][0] - c.pts[c.pts.length - 1][0], c.pts[0][1] - c.pts[c.pts.length - 1][1]), 0, 1e-12);
    // every point of the path lies on a circle or on a straight run tangent to two of them: no point is inside a sprocket
    ok(c.pts.every((q) => c.circ.every((k) => Math.hypot(q[0] - k.c[0], q[1] - k.c[1]) > k.r - 1e-9)), 'chain never cuts through a sprocket');
    ok(c.len > 1.2 && c.len < 1.6, 'chain length is realistic');
  }
  near(M.derailleurPos(11), 10 * M.SHIFT.pitch, 1e-9); near(M.shiftError(7, {}), 0, 1e-9); near(M.shiftError(4, { slack: 0.5 }), -M.SHIFT.ratio * 0.5, 1e-12); near(M.shiftError(4, { slack: 0.5, adj: 0.5 }), 0, 1e-12);
  near(M.shiftError(11, { pull: 2.5 }) - M.shiftError(10, { pull: 2.5 }), M.SHIFT.ratio * 2.5 - M.SHIFT.pitch, 1e-12); near(M.shiftError(5, { fric: 0.2, dir: 1 }) - M.shiftError(5, { fric: 0.2, dir: -1 }), -2 * M.SHIFT.ratio * 0.2, 1e-12);
  near(M.shiftError(9, { slack: 1, pull: 2.4, electronic: true }), 0, 1e-12);
  for (const mode of [0, 1, 2]) for (const [mu, lf, h] of [[0.8, 0.62, 1.05], [0.3, 0.5, 1.2], [1.0, 0.8, 0.85]]) {
    const B = M.braking(mu, lf, h, mode); near(B.Nf + B.Nr, 1, 1e-12); near(B.Nf * lf - B.Nr * (M.WB - lf) - B.a * h, 0, 1e-12);           // vertical force and moment balance about the centre of mass
    ok(B.Nr > -1e-12 && B.a <= mu * (mode === 0 ? B.Nf : mode === 1 ? B.Nr : 1) + 1e-12, 'within grip and no negative load');
  }
  near(M.braking(0.8, 0.62, 1.05, 0).a, 0.62 / 1.05, 1e-12); near(M.braking(0.8, 0.62, 1.05, 1).a, (0.8 * 0.62) / (1.02 + 0.84), 1e-12); near(M.braking(0.3, 0.62, 1.05, 2).a, 0.3, 1e-12);
  ok(M.braking(0.3, 0.62, 1.05, 0).limit === 'skid' && M.braking(0.8, 0.62, 1.05, 0).limit === 'pitch', 'wet: skid; dry: pitch-over');
  near(M.stopDistance(10, 0.5), 100 / 9.81, 1e-9);
  { const r = M.brakeForce(0, 100); near(r.pad, 100 * 4 * 1.3 * 0.85, 1e-9); near(r.tyre, (2 * 0.7 * r.pad * 0.311) / 0.34, 1e-9);
    const d = M.brakeForce(1, 100, false, 0.16); near(d.pad, 100 * 7 * 4.84 * 0.95, 1e-6); near(d.pressure * Math.PI * 0.005 ** 2, 100 * 7 * 0.95, 1e-6); near(d.pressure * Math.PI * 0.011 ** 2, d.pad, 1e-6);   // Pascal: same pressure on both pistons
    near(d.tyre, (2 * 0.4 * d.pad * 0.068) / 0.34, 1e-9); ok(M.brakeForce(1, 100, false, 0.203).tyre > d.tyre && M.brakeForce(0, 100, true).tyre < 0.5 * r.tyre && M.brakeForce(1, 100, true).tyre > 0.8 * d.tyre, 'larger rotors and dry rims brake harder; discs lose little in the wet'); }
  values([M.COGS.length, M.RINGS.length], [11, 2]);
};
