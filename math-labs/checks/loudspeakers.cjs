// Loudspeakers: Thiele-Small parameters of the worked example, the impedance peak at fs, gyrator consistency (Z = Re + Bl*u_s/i), sealed alignment Butterworth numbers, vented response and the excursion minimum at fb, and the piston pattern (J1 values, first null, DI limits).
module.exports = (M, { ok, near }) => {
  const P = M.DEFAULT, S = M.ts(P);
  near(S.fs, 41.09, 0.01); near(S.Qms, 3.873, 1e-3); near(S.Qes, 0.4131, 1e-4); near(S.Qts, 0.3733, 1e-4); near(S.Vas * 1000, 24.56, 0.01); near(S.eta0 * 100, 0.4036, 1e-3); near(S.Zmax, 62.25, 1e-9);
  // with Le = 0 the impedance peak is exactly at fs and equals Re + Bl^2/Rms, and the phase crosses zero there
  { const Q = { ...P, Le: 0 }; const z = M.elecZ(Q, S.fs); near(z[0], S.Zmax, 1e-9); near(z[1], 0, 1e-9);
    ok(M.cx.abs(M.elecZ(Q, S.fs * 0.9)) < S.Zmax && M.cx.abs(M.elecZ(Q, S.fs * 1.1)) < S.Zmax, 'peak at fs'); }
  // electrical balance: V = Z i and the back emf; i = (V - Bl u) / (Re + j w Le)
  { const f = 120, V = 2.83, u = M.coneVel(P, f, V), zl = [P.Re, 2 * Math.PI * f * P.Le], i = M.cx.div([V - P.Bl * u[0], -P.Bl * u[1]], zl), Z = M.elecZ(P, f), Vc = M.cx.mul(Z, i); near(Vc[0], V, 1e-9); near(Vc[1], 0, 1e-9); }
  // well below fs the excursion tends to the static F*Cms with F = Bl V / Re
  near(M.cx.abs(M.coneDisp(P, 1, 2.83)), P.Bl * 2.83 / P.Re * P.Cms, 2e-5);
  // sealed: 9.5 L gives Qtc 0.707 and f3 = fc; sealed response is -3 dB at fc exactly when Q = 1/sqrt 2
  { const sb = M.sealedBox(S.fs, S.Qts, S.Vas, 0.00949, 100); near(sb.Q, 0.7071, 2e-3); near(sb.fc, 77.84, 0.05); near(M.f3((f) => M.dB(M.sealedBox(S.fs, S.Qts, S.Vas, 0.00949, f).G)), sb.fc, 0.3); near(M.dB(M.sealedBox(100, 1 / Math.SQRT2, 1e-12, 1, 100).G), -3.0103, 1e-6); }
  // vented: 24.6 L at 41 Hz gives f3 near 41 Hz, fourth-order slope far below, and excursion minimum at fb
  { const Vb = 0.0246, fb = 41, g = (f) => M.dB(M.ventedBox(S.fs, S.Qts, S.Vas, Vb, fb, f).G); near(M.f3(g), 40.6, 0.5); near(g(5) - g(10), -24, 0.8);
    const X = (f) => M.cx.abs(M.ventedBox(S.fs, S.Qts, S.Vas, Vb, fb, f).X); let best = [Infinity, 0]; for (let f = 20; f <= 80; f += 0.25) if (X(f) < best[0]) best = [X(f), f]; near(best[1], fb, 1.5); ok(best[0] < 0.3 * X(25), 'the cone nearly stops at fb');
    // high-frequency limits: both responses tend to 0 dB
    near(g(2000), 0, 0.05); near(M.dB(M.sealedBox(S.fs, S.Qts, S.Vas, Vb, 2000).G), 0, 0.05); }
  // piston: J1 values, on-axis 1, the -6 dB point at x = 2.215, first null at 3.8317, DI limits 3 dB (small ka) and ka^2 (large ka)
  near(M.J1(1), 0.4400505857, 1e-9); near(M.J1(3.8317), 0, 1e-4); near(M.piston(2, 0), 1, 1e-12); near(M.piston(2.215 / Math.sin(0.7), 0.7), 0.5, 2e-3);
  near(20 * Math.log10(M.piston(2 * Math.PI * 1000 * 0.065 / 343, Math.PI / 3)), -1.18, 0.02); near(20 * Math.log10(Math.abs(M.piston(2 * Math.PI * 4000 * 0.065 / 343, Math.PI / 3))), -25.3, 0.1);
  near(M.directivityIndex(0.05), 10 * Math.log10(2), 0.01); near(M.directivityIndex(20) - 20 * Math.log10(20), 0, 0.3); near(M.halfAngle6dB(4.43), 30, 0.1); ok(M.halfAngle6dB(1) === 90, 'small ka: no -6 dB point');
};
