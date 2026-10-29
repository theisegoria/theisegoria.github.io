// Aerodynamics: the Joukowski map inverts on the flow domain; the Kutta condition leaves the trailing edge a stagnation
// point of the circle flow; the far field is the free stream; lift from integrating the surface pressure equals the
// Kutta-Joukowski lift 2 Gamma / c; a flat plate gives C_L = 2 pi sin(alpha) and a symmetric aerofoil none at zero
// incidence; the lifting-line solution of an untwisted elliptic wing has e = 1 and the textbook lift slope, the induced
// drag always equals C_L^2 / (pi e AR), a rectangular wing has e < 1, the loading vanishes at the tips and is symmetric;
// the parabolic polar's best L/D and minimum sink agree with brute-force searches.
module.exports = (M, { ok, near }) => {
  for (const [mx, my, al] of [[-0.08, 0.08, 5], [0, 0, 4], [-0.15, 0, 0], [-0.1, 0.15, -3], [-0.05, 0.05, 12]]) {
    const J = M.joukowski(mx, my, al);
    near(M.cabs(J.dWz([1, 0])), 0, 1e-12);
    for (const zt of [[2, 1], [-1.5, -0.7], [0.2, 1.9]]) { const z = J.toZ(zt), back = J.fromZ(z); ok(back !== null, 'outside point maps back'); near(back[0], zt[0], 1e-9); near(back[1], zt[1], 1e-9); }
    const far = J.velZ(-400, 300); near(far[0], Math.cos(al * Math.PI / 180), 2e-3); near(far[1], Math.sin(al * Math.PI / 180), 2e-3);
    if (J.thick < 1e-6) continue;                     // a flat plate's leading-edge suction is a singularity the pressure integral misses
    near(M.liftFromPressure(J), J.CL, 0.012 * Math.max(0.1, Math.abs(J.CL)));
    ok(J.fromZ([J.xmin / 2 + J.xmax / 2, (J.S0[Math.floor(J.ile / 2)].y + J.S0[Math.floor(J.ile * 1.5)].y) / 2]) === null, 'inside the aerofoil is excluded');
  }
  { const J = M.joukowski(0, 0, 6); near(J.chord, 4, 1e-6); near(J.CL, 2 * Math.PI * Math.sin(6 * Math.PI / 180), 1e-9); near(J.thick, 0, 1e-6); }
  { const J = M.joukowski(-0.12, 0, 0); near(J.CL, 0, 1e-12); ok(J.thick > 0.12 && J.thick < 0.2, 'thickness from a left shift'); }
  { const J = M.joukowski(-0.05, 0.1, 0); ok(J.CL > 0, 'camber lifts at zero incidence'); near(M.joukowski(-0.05, 0.1, J.zeroLift).CL, 0, 1e-12); }
  // lifting line
  for (const AR of [4, 8, 16]) {
    const E = M.liftingLine(2, AR, 1, 5, 0);
    near(E.e, 1, 1e-6);
    near(E.CL, 2 * Math.PI * (5 * Math.PI / 180) / (1 + 2 / AR), 1e-6);
    E.An.slice(1).forEach((x) => near(x, 0, 1e-9));
    const R = M.liftingLine(0, AR, 1, 5, 0); ok(R.e < 0.995 && R.e > 0.85, 'rectangular wing e below 1');
    for (const W of [E, R, M.liftingLine(1, AR, 0.4, 6, 2)]) {
      near(W.CDi, W.CL * W.CL / (Math.PI * W.e * AR), 1e-9);
      near(W.gam(1), 0, 1e-9); near(W.gam(-1), 0, 1e-9); near(W.gam(0.37), W.gam(-0.37), 1e-9);
      // mean chord: the wing area is span x mean chord = 4 / AR for span 2
      let A = 0; for (let i = 0; i < 4000; i++) { const y = -1 + (i + 0.5) / 2000; A += W.c(y) / 2000; }
      near(A, 4 / AR, 2e-3);
    }
  }
  { const T4 = M.liftingLine(1, 8, 0.4, 5, 0), R = M.liftingLine(0, 8, 1, 5, 0); ok(T4.e > R.e, 'taper 0.4 beats a rectangle'); }
  // the lifting-line equation holds at points between the collocation stations
  { const W = M.liftingLine(1, 7, 0.5, 4, 1.5); for (const y of [-0.73, -0.21, 0.4, 0.88]) { const a0 = 2 * Math.PI, al = (4 - 1.5 * Math.abs(y)) * Math.PI / 180, lhs = W.gam(y); near(lhs, 0.5 * a0 * W.c(y) * (al - W.ai(y)), 3e-3 * Math.abs(lhs) + 1e-6); } }
  // polar
  for (const [AR, e, cd0, ws] of [[18, 0.9, 0.012, 350], [8, 0.8, 0.025, 500], [30, 0.95, 0.008, 400]]) {
    const P = M.polar(AR, e, cd0, ws);
    let best = 0, bcl = 0; for (let i = 1; i <= 20000; i++) { const cl = 3 * i / 20000, r = cl / P.CD(cl); if (r > best) { best = r; bcl = cl; } }
    near(best, P.LDmax, 1e-6 * P.LDmax); near(bcl, P.CLbg, 1e-3);
    let ms = Infinity, mcl = 0; for (let i = 1; i <= 20000; i++) { const cl = 3 * i / 20000, s = P.sink(cl); if (s < ms) { ms = s; mcl = cl; } }
    near(mcl, P.CLms, 1e-3);
    near(P.CD(P.CLbg), 2 * cd0, 1e-12);
    near(P.CLofV(P.V(0.7)), 0.7, 1e-12);
  }
};
