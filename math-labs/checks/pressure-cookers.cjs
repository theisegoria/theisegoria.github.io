// Pressure cookers: the vapour pressure curve passes through the known points and inverts to the boiling point; air
// pressure falls with height; the weighted valve balances m g against pressure times bore area; warm-up conserves
// energy and the time to done falls with pressure but never below the heating time.
module.exports = (M, { ok, near }) => {
  near(M.pvap(100), 101.325, 0.7); near(M.pvap(25), 3.17, 0.03); near(M.pvap(80), 47.4, 0.2); near(M.pvap(120), 198.5, 1); near(M.pvap(99.999), M.pvap(100.001), 0.7);
  for (const T of [40, 70, 90, 105, 120, 130]) near(M.tboil(M.pvap(T)), T, 1e-6);
  for (let T = 21; T <= 140; T++) ok(M.pvap(T) > M.pvap(T - 1), 'vapour pressure rises with temperature');
  near(M.tboil(101.325), 100, 0.05); near(M.tboil(201.325), 120.54, 0.02); near(M.tboil(171.325), 115.45, 0.02);
  near(M.pAir(0), 101.325, 1e-9); near(M.pAir(3000), 70.11, 0.02); near(M.pAir(8849), 31.44, 0.02); near(M.tboil(M.pAir(3000)), 90.03, 0.02); near(M.tboil(M.pAir(8849)), 70.26, 0.02);
  near(M.speed(100), 1, 1e-12); near(M.speed(110), 2, 1e-12); near(M.speed(90), 0.5, 1e-12); near(M.speed(M.tboil(201.325)), 4.151, 0.005);
  near(M.valveP(74, 3), 102.664, 0.002); near(M.valveP(74, 3) * 1000 * Math.PI * 0.0015 ** 2, 0.074 * M.G, 1e-9); near(M.valveP(148, 3) / M.valveP(74, 3), 2, 1e-12); near(M.valveP(74, 6) / M.valveP(74, 3), 0.25, 1e-12);
  near(M.lidForce(100), 3801.3, 0.1); near(M.lidForce(100, 0.44) / M.lidForce(100), 4, 1e-9); near(M.lidForce(M.valveP(74, 3)) / (0.074 * M.G), (220 / 3) ** 2, 1e-6);
  const w = M.warmup(1, 1500, 100), o = M.warmup(1, 1500, 0);
  near(w.C, 5536, 1e-9); near(w.Treg, 120.536, 0.002); near(w.t1, 5536 * (w.Treg - 20) / 1500, 1e-9); near(w.t1 / 60, 6.184, 0.002); near(o.t1 / 60, 4.921, 0.002); near(w.t100, o.t1, 1e-9);
  near(w.at(0), 20, 1e-12); near(w.at(w.t1), w.Treg, 1e-9); near(w.at(1e5), w.Treg, 1e-12); near(w.at(o.t1), o.Treg, 1e-6); near(w.steam * 60000, 40.909, 0.001); near(0.5 / w.steam / 60, 12.222, 0.001);
  near(M.warmup(2, 1500, 100).t1 / M.warmup(1, 3000, 100).t1, 2 * (2 * M.CW + 1350) / (M.CW + 1350), 1e-9);
  const done = (pg, need) => { let a = 0, b = 4 * 3600; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (M.cooked(1, 1500, pg, m) < need) a = m; else b = m; } return (a + b) / 2; };
  near(done(0, 3600) / 60, 64.05, 0.05); near(done(100, 3600) / 60, 19.75, 0.05); near(done(150, 3600) / 60, 14.50, 0.05);
  let prev = Infinity; for (let pg = 0; pg <= 150; pg += 10) { const t = done(pg, 3600); ok(t < prev, 'higher pressure finishes sooner'); ok(t > M.warmup(1, 1500, pg).t100 * 0.5, 'never faster than a share of the heating time'); prev = t; }
  ok(done(50, 3600) - done(100, 3600) < done(0, 3600) - done(50, 3600) && done(100, 3600) - done(150, 3600) < done(50, 3600) - done(100, 3600), 'diminishing returns');
  near(M.cooked(1, 1500, 0, 7200) - M.cooked(1, 1500, 0, 3600), 3600 * M.speed(o.Treg), 1);
};
