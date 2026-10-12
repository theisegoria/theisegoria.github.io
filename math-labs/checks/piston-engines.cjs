// Piston engines: crank-slider kinematics (stroke 2r, derivatives, the two-harmonic expansion, top-dead-centre acceleration r w^2 (1 + lambda)); Otto and Diesel cycles against their closed-form efficiencies and the first law; the Wiebe-burn cylinder model releases its heat and closes its energy balance; layout balance results and the mean torque equal to the cycle work over 4 pi.
module.exports = (M, { ok, near }) => {
  const r = 0.043, lam = 0.3, w = 300;
  // 1. kinematics
  near(M.pistonX(0, r, lam), 0, 1e-15); near(M.pistonX(Math.PI, r, lam), 2 * r, 1e-15);
  for (const th of [0.3, 1.2, 2.5, 4]) { const h = 1e-5; near((M.pistonX(th + h, r, lam) - M.pistonX(th - h, r, lam)) / (2 * h), M.dXdTh(th, r, lam), 1e-9); near((M.dXdTh(th + h, r, lam) - M.dXdTh(th - h, r, lam)) / (2 * h), M.d2XdTh2(th, r, lam), 1e-7); }
  near(M.pistonA(0, r, lam, w), r * w * w * (1 + lam), 1e-6); near(M.pistonA(Math.PI, r, lam, w), -r * w * w * (1 - lam), 1e-6);
  // the two-harmonic approximation is good to O(λ³)
  { let err = 0; for (let k = 0; k < 360; k++) { const th = (k * Math.PI) / 180; err = Math.max(err, Math.abs(M.pistonA(th, r, lam, w) - M.pistonA2(th, r, lam, w)) / (r * w * w)); } ok(err < 0.02, 'two-harmonic expansion within 2%'); }
  // maximum piston speed occurs before 90°
  { let best = 0, bt = 0; for (let k = 0; k <= 1800; k++) { const th = (k * Math.PI) / 1800, v = M.pistonV(th, r, lam, w); if (v > best) { best = v; bt = th; } } ok(bt < Math.PI / 2 && bt > Math.PI / 3, 'peak speed before 90°'); }
  // 2. cycles: closed forms and first law
  for (const rc of [6, 10, 18]) { const o = M.otto(rc); near(o.eta, M.ottoEta(rc), 1e-12); near(o.w, 1.8e6 - M.CV * (o.T4 - o.T1), 1e-6); near(o.p2 * o.v2 / o.T2, o.p1 * o.v1 / o.T1, 1e-6); }
  near(M.ottoEta(10), 1 - 10 ** -0.4, 1e-15); near(M.ottoEta(10), 0.6019, 1e-4);
  for (const [rc, cut] of [[18, 2], [15, 2.5]]) { const d = M.diesel(rc, cut); near(d.eta, M.dieselEta(rc, cut), 1e-12); ok(d.eta < M.ottoEta(rc), 'Diesel below Otto at equal r'); }
  near(M.dieselEta(18, 1 + 1e-7), M.ottoEta(18), 1e-6);
  // 3. cylinder model: compression from intake follows p V^γ, energy balance of the closed cycle
  const cyl = M.cylinderPressure();
  { const pts = cyl.pts, k1 = pts.findIndex((p) => p.th > 1.25 * Math.PI), k2 = pts.findIndex((p) => p.th > 1.75 * Math.PI); near((pts[k1].p * pts[k1].V ** M.GAM) / (pts[k2].p * pts[k2].V ** M.GAM), 1, 1e-6);
    // work of the closed part = heat released − change in internal energy  (U = pV/(γ−1))
    let W = 0; const i0 = pts.findIndex((p) => p.th > Math.PI), i1 = pts.findIndex((p) => p.th >= 3 * Math.PI) - 1; for (let i = i0; i < i1; i++) W += 0.5 * (pts[i].p + pts[i + 1].p) * (pts[i + 1].V - pts[i].V);
    const dU = (pts[i1].p * pts[i1].V - pts[i0].p * pts[i0].V) / (M.GAM - 1); near((W + dU) / M.ENG.fuelQ, 1, 0.01);
    ok(W > 0.4 * M.ENG.fuelQ && W < 0.62 * M.ENG.fuelQ, 'indicated efficiency between 40% and the ideal 60%'); }
  // 4. balance of the layouts
  const b = M.LAYOUTS.map(M.balance), z = (x) => x < 1e-9;
  ok(!z(b[0].F1) && !z(b[0].F2), 'single unbalanced'); ok(z(b[1].F1) && !z(b[1].M1) && !z(b[1].F2), 'twin: primary couple and secondary force');
  ok(z(b[2].F1) && z(b[2].F2) && !z(b[2].M1), 'three: forces balanced, couple left'); ok(z(b[3].F1) && z(b[3].M1) && Math.abs(b[3].F2 - 4) < 1e-9, 'four: secondary force 4');
  ok(z(b[4].F1) && z(b[4].F2) && z(b[4].M1) && z(b[4].M2), 'six: fully balanced');
  // mean torque = cycle work / 4π for every layout, and the inertia torque averages to zero
  { let W = 0; const pts = cyl.pts; for (let i = 0; i < pts.length - 1; i++) W += 0.5 * (pts[i].p + pts[i + 1].p - 2 * M.ENG.p0) * (pts[i + 1].V - pts[i].V);
    for (const lay of M.LAYOUTS) { const E = M.engineTorque(lay, 4000, cyl); near(E.mean, (lay.n * W) / (4 * Math.PI), 0.01 * E.mean); }
    const one = M.cylinderTorque(cyl, 6000); near(one.slice(0, -1).reduce((s, o) => s + o.inert, 0) / (one.length - 1), 0, 1e-6); }
  { const e6 = M.engineTorque(M.LAYOUTS[4], 3000, cyl), e1 = M.engineTorque(M.LAYOUTS[0], 3000, cyl); ok(e6.dE / e6.mean < e1.dE / e1.mean / 10, 'six is much smoother than a single, relative to its mean torque'); }
};
