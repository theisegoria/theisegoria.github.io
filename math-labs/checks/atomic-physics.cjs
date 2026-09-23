// Atomic physics: hydrogen eigenfunctions, Bohr-level spectra, and the weak-field Zeeman pattern of the sodium D lines.
module.exports = (A, { ok, near }) => {
  // 1. radial functions: normalised, orthogonal, <r> and <1/r> in closed form, n - l - 1 radial nodes
  for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 2], [4, 1], [5, 3], [5, 0]]) {
    near(A.integrateR(n, l, (r, R) => r * r * R * R), 1, 1e-7);
    near(A.integrateR(n, l, (r, R) => r * r * r * R * R), A.meanR(n, l), 1e-5);
    near(A.integrateR(n, l, (r, R) => r * R * R), 1 / (n * n), 1e-7);
    ok(A.radialNodes(n, l).length === n - l - 1, `R_${n}${l} has ${n - l - 1} radial nodes`);
  }
  near(A.integrateR(3, 0, (r, R) => r * r * R * A.radial(2, 0, r)), 0, 1e-8);
  near(A.radial(1, 0, 0), 2, 1e-12);
  // 2. spherical harmonics: normalised and orthogonal on the sphere
  const sph = (f) => { let s = 0; const N = 400, M = 400; for (let i = 0; i < N; i++) { const th = (i + 0.5) * Math.PI / N; for (let j = 0; j < M; j++) s += f(th, (j + 0.5) * 2 * Math.PI / M) * Math.sin(th); } return s * (Math.PI / N) * (2 * Math.PI / M); };
  for (const [l, m] of [[0, 0], [1, 1], [2, -2], [3, 1]]) near(sph((th, ph) => A.realY(l, m, th, ph) ** 2), 1, 1e-4);
  near(sph((th, ph) => A.realY(2, 1, th, ph) * A.realY(2, -1, th, ph)), 0, 1e-8);
  // the d_z2 nodal cones sit at the magic angle, cos^2 theta = 1/3
  near(A.polarNodes(2, 0)[0], Math.acos(1 / Math.sqrt(3)), 1e-9);
  // 3. spectra: vacuum wavelengths of well-known lines (Bohr levels, reduced-mass Rydberg)
  near(A.lambda(2, 3), 656.46, 0.02);   // H-alpha
  near(A.lambda(1, 2), 121.567, 0.002); // Lyman-alpha
  near(A.seriesLimit(2), 364.70, 0.01); // Balmer limit
  near(A.lambda(3, 4), 1875.6, 0.2);    // Paschen-alpha
  near(-A.level(1), 13.598434, 1e-9);
  // 4. Zeeman: Lande factors and the D1 / D2 patterns
  near(A.lande(A.LEVELS.S12), 2, 1e-12); near(A.lande(A.LEVELS.P12), 2 / 3, 1e-12); near(A.lande(A.LEVELS.P32), 4 / 3, 1e-12);
  const shifts = (ln) => A.components(ln).map((c) => Math.round(c.shift * 3)).sort((a, b) => a - b).join(',');
  ok(shifts('D1') === '-4,-2,2,4', 'D1 splits into +-2/3 and +-4/3');
  ok(shifts('D2') === '-5,-3,-1,1,3,5', 'D2 splits into +-1/3, +-1 and +-5/3');
  // every upper sublevel decays at the same total rate: sum of 3j^2 over lower states = 1/(2J_u + 1)
  for (const ln of ['D1', 'D2']) {
    const cs = A.components(ln), Ju = A.LEVELS[A.DLINES[ln].up].J;
    for (let mu = -Ju; mu <= Ju; mu++) near(cs.filter((c) => c.mu === mu).reduce((s, c) => s + c.strength, 0), 1 / (2 * Ju + 1), 1e-12);
  }
  const d2 = A.components('D2'), st = (s) => d2.find((c) => Math.abs(c.shift - s) < 1e-9).strength;
  near(st(1) / st(5 / 3), 3, 1e-12); near(st(-1 / 3) / st(5 / 3), 2, 1e-12);
  near(A.w3j(2, 2, 0, 0, 0, 0), -1 / Math.sqrt(3), 1e-12);
  // D2 - D1 separation is the 3p fine-structure splitting, about 2.13 meV
  near(A.HC / A.DLINES.D2.lam - A.HC / A.DLINES.D1.lam, 2.1311e-3, 2e-6);
};
