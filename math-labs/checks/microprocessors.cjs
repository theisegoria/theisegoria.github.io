// Microprocessors: the EKV transistor has the weak-inversion slope n phi_t ln 10 and turns into a square law far above
// threshold, saturates in V_D, and leaks more when hot; the CMOS inverter is a rail-to-rail switch whose midpoint moves
// up with the pMOS width; dynamic power is alpha C V^2 f; Abbe imaging conserves the zero-order intensity, prints a flat
// field below the resolution limit, resolves above it, and the minimum pitch matches lambda/((1+sigma)NA).
module.exports = (M, { ok, near }) => {
  // subthreshold slope: decades per volt deep in weak inversion
  for (const T of [233.15, 300, 398.15]) {
    const i1 = M.idrain(-0.45, 0.75, T), i2 = M.idrain(-0.4, 0.75, T), S = 50 / Math.log10(i2 / i1);
    near(S, M.swing(T), 0.003 * M.swing(T));
  }
  near(M.swing(300), 1.25 * 0.025852 * Math.LN10 * 1000, 0.05);
  // strong inversion, low drain bias: current grows roughly as (V_G - V_T)^2 in saturation
  const sat = (vg) => M.idrain(vg, 1.5, 300);
  const r = Math.log(sat(1.6) / sat(1.1)) / Math.log((1.6 - 0.23) / (1.1 - 0.23));
  ok(r > 1.7 && r < 2.3, 'square law far above threshold');
  // saturation in V_D: from 0.6 V to 0.9 V at V_G = 0.75 the current rises only through DIBL
  ok(M.idrain(0.75, 0.9) / M.idrain(0.75, 0.6) < 1.15 && M.idrain(0.75, 0.6) / M.idrain(0.75, 0.05) > 3, 'saturates in V_D');
  near(M.idrain(0.5, 0, 300), 0, 1e-15);
  ok(M.idrain(0, 0.75, 358.15) > 5 * M.idrain(0, 0.75, 300.15), 'leakage rises with heat');
  const ion = M.idrain(0.75, 0.75), ioff = M.idrain(0, 0.75); ok(ion > 50e-6 && ion < 200e-6 && ion / ioff > 1e4, 'Ion/Ioff');
  // inverter: rails, monotone, midpoint
  for (const vdd of [0.5, 0.75, 1.0]) {
    ok(M.inverterOut(0, vdd).vo > 0.98 * vdd && M.inverterOut(vdd, vdd).vo < 0.02 * vdd, `rails at ${vdd}`);
    let prev = Infinity; for (let v = 0; v <= vdd + 1e-9; v += vdd / 50) { const o = M.inverterOut(v, vdd).vo; ok(o <= prev + 1e-9, 'monotone'); prev = o; }
  }
  const vm = (beta) => { let lo = 0, hi = 0.75; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (M.inverterOut(m, 0.75, beta).vo > m) lo = m; else hi = m; } return (lo + hi) / 2; };
  near(vm(2), 0.375, 0.01);
  ok(vm(1) < vm(2) && vm(2) < vm(4), 'midpoint rises with pMOS width');
  near(M.dynPower(0.1, 1e-9, 0.8, 3e9), 0.192, 1e-12);
  // Abbe imaging
  for (const [lam, NA] of [[193, 1.35], [13.5, 0.33]]) {
    for (const mode of [0, 1, 2]) {
      const pm = M.minPitch(lam, NA, mode);
      near(pm, lam / ((1 + M.SIGMA[mode]) * NA), 1e-12);
      // just below: every source point sees only one order, so the image is flat
      const flat = [0, 0.13, 0.31, 0.5].map((x) => M.aerial(x * pm * 0.97, pm * 0.97, lam, NA, mode).I);
      if (mode !== 1) ok(Math.max(...flat) - Math.min(...flat) < 1e-9, `flat below limit ${lam} ${mode}`);
      // comfortably above: contrast appears
      const p = pm * 1.15, img = [0, 0.25, 0.5].map((x) => M.aerial(x * p, p, lam, NA, mode).I);
      ok(img[0] - img[2] > 0.1, `resolves above limit ${lam} ${mode}`);
    }
    // average over a period equals the sum of the collected |c_m|^2 (Parseval), here for coherent light
    const p = 3.2 * lam / NA, N = 400; let s = 0; for (let i = 0; i < N; i++) s += M.aerial((i / N) * p, p, lam, NA, 0).I / N;
    let e = 0; for (let m = -40; m <= 40; m++) if (Math.abs((m * lam) / p) <= NA) e += M.coeff(m) ** 2;
    near(s, e, 1e-9);
  }
  near(M.aerial(0, 80, 193, 1.35, 0).I, 0.25, 1e-12);
  near(M.k1(38, 193, 1.35), 0.2658, 1e-4);
  ok(Math.abs(M.coeff(2)) < 1e-15 && Math.abs(M.coeff(1) - 1 / Math.PI) < 1e-15, 'grating coefficients');
};
