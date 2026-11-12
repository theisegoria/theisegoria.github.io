// Camera lenses: the thin-lens relations are mutually consistent (blur vanishes at the focused distance and equals the
// circle of confusion at both depth-of-field limits; the far limit reaches infinity at the hyperfocal distance and the
// near limit is then H/2); the blur scales as f^2/N; aberration and diffraction have their stated power laws and cross
// at the single-element optimum; the half-disc centroid factor is 4/(3 pi); the Bessel function has its known values.
module.exports = (M, { ok, near }) => {
  for (const [f, N, s] of [[50, 2.8, 3000], [85, 1.8, 2000], [24, 8, 1500], [135, 4, 10000], [35, 11, 800]]) {
    const R = M.dofLimits(f, N, s); near(M.blur(f, N, s, s), 0, 1e-15); near(M.blur(f, N, s, R.near), M.COC, 1e-9);
    if (R.far !== Infinity) near(M.blur(f, N, s, R.far), M.COC, 1e-9); ok(R.near < s && R.far > s, 'limits bracket the focus distance');
    near(1 / s + 1 / M.imageDistance(f, s), 1 / f, 1e-12); near(M.imageDistance(f, s) - f, M.extension(f, s), 1e-9);
  }
  { const f = 50, N = 8, H = M.hyperfocal(f, N), R = M.dofLimits(f, N, H); ok(R.far === Infinity, 'far limit is infinite at the hyperfocal distance'); near(R.near, H / 2, 1e-6); near(M.blur(f, N, H, 1e12), M.COC, 1e-6); }
  near(M.hyperfocal(50, 2.8), 29811.9, 0.1); near(M.dofLimits(50, 2.8, 3000).near, 2729.46, 0.01); near(M.dofLimits(50, 2.8, 3000).far, 3330.08, 0.01);
  near(M.blur(85, 2.8, 3000, 1e9) / M.blur(24, 2.8, 3000, 1e9), (85 * 85 / 2915) / (24 * 24 / 2976), 1e-6);
  near(M.blur(50, 2, 3000, 6000) / M.blur(50, 4, 3000, 6000), 2, 1e-12);
  near(M.sphericalBlur(50, 2) / M.sphericalBlur(50, 4), 8, 1e-12); near(M.airy(8) / M.airy(4), 2, 1e-12); near(M.airy(8), 0.010736, 1e-9);
  const s1 = M.sweetSpot(50, false), s6 = M.sweetSpot(50, true); ok(s6.N < s1.N && s6.blur < s1.blur, 'a corrected lens is sharper, and sharpest at a wider aperture');
  near(s1.N, (Math.sqrt(3) * 0.067 * 50 / (2.44 * 550e-6)) ** 0.25, 0.06); near(s6.N, (Math.sqrt(3) * 0.067 * 50 * M.CORRECTION / (2.44 * 550e-6)) ** 0.25, 0.06);
  for (const N of [1.4, 4, 16]) ok(M.totalBlur(50, N, true) >= M.airy(N) && M.totalBlur(50, N, true) <= M.totalBlur(50, N, false), 'diffraction is a floor; correction never hurts');
  near(0.424, 4 / (3 * Math.PI), 5e-4); near(M.pdShift(0.6, 2.8), 0.424 * 0.6 / 2.8, 1e-12); near(M.pdShift(-0.6, 2.8), -M.pdShift(0.6, 2.8), 1e-15); near(M.pdShift(1, 1.4) / M.pdShift(1, 2.8), 2, 1e-12);
  near(M.J1(1), 0.4400505857, 1e-8); near(M.J1(3.8317059702), 0, 1e-6); near(M.J1(-2), -M.J1(2), 1e-12);
  near(M.contrast(20, 0), 1, 1e-12); ok(M.contrast(20, 0.01) > M.contrast(20, 0.03) && M.contrast(20, 0.03) > M.contrast(20, 0.05), 'contrast falls with blur'); near(M.contrast(20, 3.8317059702 / (Math.PI * 20)), 0, 1e-6);
  ok(M.ELEMENTS.length === 6 && M.ELEMENTS.every((e, i) => i === 0 || e[0] >= M.ELEMENTS[i - 1][0] + M.ELEMENTS[i - 1][3] - 1e-9), 'six elements in order along the axis');
  near(M.sag(20, 0), 0, 1e-15); near(M.sag(20, 12), 4, 1e-12); near(M.sag(-20, 12), -4, 1e-12);
};
