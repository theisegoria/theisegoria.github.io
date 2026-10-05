// Wavelets: the FFT against a direct DFT, the Morlet scale-period relation and Heisenberg product, orthonormality of the Haar and Daubechies-4 filter banks (perfect reconstruction, Parseval, vanishing moments), and thresholding against Fourier truncation.
module.exports = (M, { ok, near }) => {
  // 1. FFT against the definition, and the round trip
  { const n = 16, x = Array.from({ length: n }, (_, i) => Math.sin(1.3 * i) + 0.2 * i), re = Float64Array.from(x), im = new Float64Array(n); M.fft(re, im);
    let dr = 0, di = 0; for (let j = 0; j < n; j++) { dr += x[j] * Math.cos((-2 * Math.PI * 5 * j) / n); di += x[j] * Math.sin((-2 * Math.PI * 5 * j) / n); } near(re[5], dr, 1e-10); near(im[5], di, 1e-10);
    M.fft(re, im, true); near(re[7], x[7], 1e-12); near(im[3], 0, 1e-12); }
  // 2. Morlet: |W|^2 of a pure tone peaks at the scale whose Fourier period is the tone's (Torrence and Compo)
  { const n = 1024, f0 = 40, w0 = 6, x = Float64Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * f0 * i) / n));
    const scales = Array.from({ length: 301 }, (_, i) => 0.018 + i * 0.00004), rows = M.cwtScales(x, 1 / n, scales, w0);
    let best = -1, bs = 0; rows.forEach((r, i) => { const p = r.re[512] ** 2 + r.im[512] ** 2; if (p > best) { best = p; bs = scales[i]; } });
    near(bs, M.scaleForFreq(f0, w0), 1e-4); near(M.fourierFactor(6), 1.0330, 1e-4);
    // the transform of a tone is flat in time (the tone is stationary)
    near(rows[150].re[200] ** 2 + rows[150].im[200] ** 2, rows[150].re[700] ** 2 + rows[150].im[700] ** 2, 1e-9);
    // a white-noise-free constant has no wavelet power: the analytic Morlet ignores zero frequency
    const cst = new Float64Array(n).fill(3), rc = M.cwtScales(cst, 1 / n, [0.05], w0)[0]; near(rc.re[100], 0, 1e-12); }
  // Heisenberg: a Gaussian atom attains the bound sigma_t sigma_omega = 1/2
  { const hb = M.heisenberg(0.03); near(hb.st * hb.sw, 0.5, 1e-12);
    // numerically: |psi(t)|^2 for envelope e^{-t^2/2s^2} has standard deviation s / sqrt2
    const s = 0.7; let m0 = 0, m2 = 0; for (let t = -10; t <= 10; t += 0.001) { const w = Math.exp(-(t * t) / (s * s)); m0 += w; m2 += w * t * t; } near(Math.sqrt(m2 / m0), s / Math.SQRT2, 1e-6); }
  // 3. filter banks: normalisation, orthogonality to even shifts, vanishing moments
  { const [haar, d4] = M.FILTERS, g4 = M.highpass(d4);
    near(d4.reduce((a, b) => a + b, 0), Math.SQRT2, 1e-12); near(d4.reduce((a, b) => a + b * b, 0), 1, 1e-12); near(d4[0] * d4[2] + d4[1] * d4[3], 0, 1e-12);
    near(g4.reduce((a, b) => a + b, 0), 0, 1e-12); near(g4.reduce((a, b, n) => a + n * b, 0), 0, 1e-12); ok(Math.abs(g4.reduce((a, b, n) => a + n * n * b, 0)) > 0.1, 'D4 has exactly two vanishing moments');
    near(M.highpass(haar).reduce((a, b, n) => a + n * b, 0), -Math.SQRT1_2, 1e-12);
    // perfect reconstruction and Parseval for both, on a signal with a jump
    const N = 256, x = Float64Array.from({ length: N }, (_, i) => Math.sin(i * 0.37) + (i > 100 ? 1 : 0));
    for (const h of M.FILTERS) { const c = M.dwt(x, h, 1), y = M.idwt(c, h); let e = 0; for (let i = 0; i < N; i++) e = Math.max(e, Math.abs(y[i] - x[i])); ok(e < 1e-12, 'perfect reconstruction'); near(M.energy(M.flatten(c)), M.energy(x), 1e-9); ok(M.flatten(c).length === N, 'critically sampled'); }
    // D4 is blind to a straight line away from the wrap-around; Haar is not
    const lin = Float64Array.from({ length: N }, (_, i) => i / N), dD = M.dwtStep(lin, d4).d, dH = M.dwtStep(lin, haar).d;
    ok(Math.max(...dD.slice(0, N / 2 - 1).map(Math.abs)) < 1e-14 && Math.abs(dD[N / 2 - 1]) > 0.1, 'D4 kills linear trends'); near(dH[10], -Math.SQRT1_2 / N, 1e-14);
    // projection onto V_j: j = 8 is the identity, j = 0 is the mean
    const c = M.dwt(x, d4, 1); near(M.rms(M.project(c, d4, 8), x), 0, 1e-12); const mean = x.reduce((a, b) => a + b, 0) / N; near(M.project(c, d4, 0)[37], mean, 1e-12);
    // the cascade: a scaling function has integral 1 / sqrt(scale) in samples (sum phi = sqrt(N / 2^lev))
    const z = M.dwt(new Float64Array(N), d4, 8); z.a[2] = 1; near(M.idwt(z, d4).reduce((a, b) => a + b, 0), Math.sqrt(N / 8), 1e-10); }
  // 4. thresholding
  { near(M.universalLambda(0.1, 512), 0.3532, 1e-4); near(M.soft(1.5, 0.4), 1.1, 1e-12); near(M.soft(-0.3, 0.4), 0, 1e-12); near(M.hard(-0.5, 0.4), -0.5, 1e-12);
    // Blocks is exactly sparse for Haar: the coarse 16 plus the nonzero details reproduce it; Fourier with as many terms does not
    const cl = M.standardise(M.sampleSignal('blocks', 512)), h = M.FILTERS[0], c = M.dwt(cl, h, 1), fl = M.flatten(c);
    const th = fl.map((q, i) => (i < 16 ? q : M.hard(q, 0.3))), K = th.filter((q) => q !== 0).length, ew = M.rms(M.idwt(M.unflatten(th, c), h), cl), ef = M.rms(M.fourierKeep(cl, K), cl);
    ok(K < 70 && ew < 1e-9, 'Blocks is sparse in the Haar basis'); ok(ef > 0.2, 'Fourier with the same number of terms rings');
    near(M.rms(M.fourierKeep(cl, 512), cl), 0, 1e-12);
    // denoising at the universal threshold: hard thresholding cuts the error by more than 3
    const R = M.rng(4), sig = 0.1, noisy = cl.map((q) => q + sig * M.gauss(R)), cn = M.dwt(noisy, h, 1), fn = M.flatten(cn), lu = M.universalLambda(sig, 512);
    const den = M.idwt(M.unflatten(fn.map((q, i) => (i < 16 ? q : M.hard(q, lu))), cn), h); ok(M.rms(den, cl) < M.rms(noisy, cl) / 3, 'hard thresholding removes most of the noise');
    // soft thresholding helps on a smooth signal in the D4 basis
    const hs = M.standardise(M.sampleSignal('heavisine', 512)), h4 = M.FILTERS[1], nz = hs.map((q) => q + 0.25 * M.gauss(R)), cz = M.dwt(nz, h4, 1), fz = M.flatten(cz);
    ok(M.rms(M.idwt(M.unflatten(fz.map((q, i) => (i < 16 ? q : M.soft(q, M.universalLambda(0.25, 512)))), cz), h4), hs) < 0.6 * M.rms(nz, hs), 'soft thresholding denoises HeaviSine'); }
};
