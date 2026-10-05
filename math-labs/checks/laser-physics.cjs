// Laser physics: steady states of the rate equations and their limits, the integrated switch-on against the steady state and the relaxation-oscillation frequency, Fabry-Perot free spectral range, finesse and Airy function, the He-Ne mode count, and mode-locked pulse trains (peak N, width 0.886 T/N, mean power independent of phase).
module.exports = (M, { ok, near }) => {
  // 1. steady state: both equations satisfied; sharp threshold as beta -> 0
  for (const [r, b] of [[0.5, 1e-4], [2, 1e-3], [4, 1e-6]]) { const p = M.steadyP(r, b), n = M.steadyN(r, b); near(r - n - n * p, 0, 1e-12); near((n - 1) * p + b * n, 0, 1e-12); }
  near(M.steadyP(3, 1e-12), 2, 1e-9); near(M.steadyN(3, 1e-12), 1, 1e-9); near(M.steadyP(0.5, 1e-6), 1e-6 * 0.5 / 0.5, 1e-9); near(M.steadyN(0.5, 1e-9), 0.5, 1e-8);
  near(M.steadyP(1, 1e-4), 0.01, 1e-4); // at threshold p = sqrt(beta r)
  // integrated switch-on settles to the steady state, and rings at sqrt(rho (r - 1))
  { const tr = M.integrate(2, 1e-4, 1000, 6); near(tr.p[tr.p.length - 1], M.steadyP(2, 1e-4), 0.02); near(tr.n[tr.n.length - 1], M.steadyN(2, 1e-4), 1e-3);
    near(M.measuredOmega(tr) / M.relaxOmega(2, 1000), 1, 0.03); ok(tr.p[M.spikes(tr)[0]] > 3 * M.steadyP(2, 1e-4), 'the first spike overshoots the steady state');
    const t2 = M.integrate(1.2, 1e-4, 300, 6); near(M.measuredOmega(t2) / M.relaxOmega(1.2, 300), 1, 0.03);
    const t3 = M.integrate(0.6, 1e-4, 300, 6); near(t3.n[t3.n.length - 1], 0.6, 0.01); ok(Math.max(...t3.p) < 1e-3, 'no lasing below threshold'); near(M.relaxGamma(3), 1.5, 1e-12); }
  // 2. cavity: c/2L, finesse, Airy extremes, He-Ne 30 cm with 4% gain and R = 0.98 lases on 3 or 4 modes
  near(M.fsr(0.3) / 1e6, 499.654, 1e-3); near(M.finesse(0.99), 312.58, 0.01); near(M.airy(0, 5e8, 0.9), 1, 1e-12); near(M.airy(2.5e8, 5e8, 0.9), 1 / (1 + 4 * 0.9 / 0.01), 1e-12); near(M.airy(5e8, 5e8, 0.9), 1, 1e-9);
  near(M.thresholdGain(0.98), 0.020203, 1e-6); near(M.dopplerGain(0.75e9, 1, 1.5e9), 0.5, 1e-12);
  { const n = M.lasingModes(0.3, 632.8e-9, 0.04, 1.5e9, 0.98).length; ok(n >= 3 && n <= 4, 'He-Ne 30 cm: three or four modes'); ok(M.lasingModes(0.1, 632.8e-9, 0.025, 1.5e9, 0.98).length <= 1, 'a 10 cm cavity near threshold is single-mode'); ok(M.lasingModes(0.3, 632.8e-9, 0.015, 1.5e9, 0.98).length === 0, 'below threshold nothing lases');
    const md = M.modes(0.3, 632.8e-9, 2e9); near(md[1] - md[0], M.fsr(0.3), 1e-3);
    // moving a mirror by half a wavelength shifts the comb by exactly one FSR (so the set of offsets repeats)
    const a = M.modes(0.3, 632.8e-9, 1e9), b = M.modes(0.3 + 316.4e-9, 632.8e-9, 1e9); near(a[2], b[2], 1e4); }
  // 3. mode locking
  { const a = M.amplitudes(21, 0), ph = M.phases(21, 1); near(M.intensity(a, ph, 0) / M.meanIntensity(a), 21, 1e-9); near(M.intensity(a, ph, 1) / M.meanIntensity(a), 21, 1e-9); near(M.intensity(a, ph, 1 / 21), 0, 1e-9);
    near(M.pulseFWHM(a, ph) * 21, 0.886, 0.002); const a2 = M.amplitudes(101, 0); near(M.pulseFWHM(a2, M.phases(101, 1)) * 101, 0.8859, 5e-4);
    // the time-averaged power does not depend on the phases (Parseval)
    const pr = M.phases(21, 0); let s = 0; for (let i = 0; i < 64; i++) s += M.intensity(a, pr, i / 64); near(s / 64, 21, 1e-9);
    // random phases: no pulse anywhere near N times the mean
    let mx = 0; for (let i = 0; i < 2000; i++) mx = Math.max(mx, M.intensity(a, pr, i / 2000) / 21); ok(mx < 10, 'unlocked peak well below N');
    // Gaussian spectrum, locked: Gaussian pulse, time-bandwidth product 2 ln 2 / pi in FWHM terms
    const sg = 6, g = Array.from({ length: 61 }, (_, k) => Math.exp(-0.5 * ((k - 30) / sg) ** 2)), fw = M.pulseFWHM(g, M.phases(61, 1)), df = 2 * Math.sqrt(2 * Math.log(2)) * sg / Math.SQRT2; near(fw * df, (2 * Math.log(2)) / Math.PI, 2e-3);
    // the page's Gaussian comb (truncated at about 2.4 sigma) is a little wider in time, but still within 5%
    const gp = M.amplitudes(41, 1), fp = M.pulseFWHM(gp, M.phases(41, 1)), dp = 2 * Math.sqrt(2 * Math.log(2)) * (41 / 5) / Math.SQRT2; near(fp * dp / ((2 * Math.log(2)) / Math.PI), 1, 0.05); }
};
