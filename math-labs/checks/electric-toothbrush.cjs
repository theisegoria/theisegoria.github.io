// Electric toothbrush: the amplitude formula agrees with a time-domain simulation of the driven oscillator, has its
// static, resonant and high-frequency limits and a peak at f0 sqrt(1 - 1/2Q^2); phase lag is 90 degrees at resonance;
// power lost equals mean torque times angular velocity; the wireless efficiency bound has its limits, is monotone, and
// equals the optimum of the two-coil circuit over the load.
module.exports = (M, { ok, near }) => {
  const d = (r) => (r * 180) / Math.PI;
  near(d(M.amp(260, 0)), 6, 1e-9); near(d(M.amp(1e-6, 0)), 6 / 12, 1e-6); ok(M.amp(2600, 0) < M.amp(1e-6, 0) / 50, 'falls off above resonance'); near(M.peakFreq(0), 260 * Math.sqrt(1 - 1 / 288), 1e-9);
  { let best = 0, bf = 0; for (let f = 200; f <= 320; f += 0.01) if (M.amp(f, 0) > best) { best = M.amp(f, 0); bf = f; } near(bf, M.peakFreq(0), 0.02); }
  near(d(M.phaseLag(260, 0)), 90, 1e-9); ok(M.phaseLag(100, 0) < 0.2 && M.phaseLag(600, 0) > Math.PI - 0.2, 'in step below, opposed above');
  // time-domain check: theta'' + (w0/Q) theta' + w0^2 theta = (w0^2 theta_res / Q0) sin(w t) for the free brush
  for (const f of [200, 260, 300]) { const w0 = 2 * Math.PI * 260, w = 2 * Math.PI * f, dt = 1 / (f * 4000); let th = 0, om = 0, mx = 0; const steps = 4000 * 60; for (let i = 0; i < steps; i++) { const acc = (w0 * w0 * M.THRES / 12) * Math.sin(w * i * dt) - (w0 / 12) * om - w0 * w0 * th; om += acc * dt; th += om * dt; if (i > steps - 8000) mx = Math.max(mx, Math.abs(th)); } near(mx / M.amp(f, 0), 1, 0.01); }
  near(M.qOf(0), 12, 1e-12); near(M.qOf(1.5), 6, 1e-12); near(M.f0Of(1), 265.2, 1e-9); ok(M.amp(260, 1) < M.amp(260, 0) && M.amp(260, 3) < M.amp(260, 1), 'pressing shrinks the swing'); near(d(M.amp(260, 1)), 3.394, 1e-3); near(d(M.amp(230, 0)), 2.178, 1e-3);
  near(M.tipAmp(260, 0) * 2000, 2.304, 1e-3); near(M.tipSpeed(260, 0), 1.882, 1e-3); near(M.lossPower(260, 0), 0.3984, 1e-4);
  { const w = 2 * Math.PI * 260, a = M.amp(260, 0), tau = (M.J * w * w * M.THRES) / 12; near(0.5 * tau * w * a, M.lossPower(260, 0), 1e-9); }
  near(M.coupling(0), 0.75, 1e-12); near(M.coupling(3), 0.4116, 1e-4); ok(M.coupling(8) < M.coupling(3), 'coupling falls with gap');
  near(M.etaMax(0, 10), 0, 1e-12); ok(M.etaMax(1, 1e4) > 0.999 && M.etaMax(0.4116, 8) < 1, 'limits of the bound'); near(M.etaMax(M.coupling(3), 8), 0.5497, 1e-4); near(M.etaMax(M.coupling(8), 8), 0.222, 1e-3); near(M.etaMax(M.coupling(3), 24), 0.817, 1e-3);
  let prev = 0; for (const x of [0.1, 1, 3, 10, 100]) { const e = M.etaMax(Math.sqrt(x), 1); ok(e > prev, 'efficiency rises with the figure of merit'); prev = e; }
  // the bound equals the best series-series efficiency over the load: eta = (x a) / ((1 + a)(1 + a + x)), a = R_load / R_2
  for (const x of [1, 10.84, 100]) { let best = 0; for (let a = 0.01; a < 200; a *= 1.002) best = Math.max(best, (x * a) / ((1 + a) * (1 + a + x))); near(best, M.etaMax(Math.sqrt(x), 1), 1e-5); }
  const sp = (s) => (s[0] / 60) * s[1] / 1000; near(sp(M.STYLES[0]), 0.1, 1e-12); near(sp(M.STYLES[1]), 0.832, 1e-3); near(sp(M.STYLES[2]), 1.198, 1e-3); near(M.STYLES[2][0], 31200, 1e-9); near(M.BATT / (1.5 * 2 / 60), 52, 1e-9);
};
