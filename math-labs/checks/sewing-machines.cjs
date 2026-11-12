// Sewing machines: needle, take-up and hook follow their timing laws and are periodic; the hook turns twice per
// stitch and meets the needle after bottom dead centre; the loop grows then is cast off; feed happens only with
// the needle out of the cloth; slider-crank kinematics match numerical derivatives; thread use adds up.
module.exports = (M, { ok, near }) => {
  near(M.needleTip(0), 14, 1e-12); near(M.needleTip(180), -10, 1e-12); near(M.needleTip(205), -8.8757, 1e-3); near(M.needleTip(205) - M.needleTip(180), 1.1243, 1e-3); near(M.needleTip(360), M.needleTip(0), 1e-9);
  near(M.takeUp(70), 51, 1e-12); near(M.takeUp(250), 33, 1e-12); near(M.takeUp(70) - M.takeUp(250), 18, 1e-12); near(M.hookAngle(205), 90, 1e-12); near(M.hookAngle(385) - M.hookAngle(205), -360, 1e-12); near(M.hookAngle(565) - M.hookAngle(205), -720, 1e-12);
  ok(M.needleTip(205) > M.needleTip(180) && M.needleTip(205) < 0, 'the hook meets a rising needle still below the cloth');
  { const a = M.loopPhase(205), b = M.loopPhase(374.9), c = M.loopPhase(376), d = M.loopPhase(439.9), e = M.loopPhase(100); near(a.f, 0, 1e-12); ok(a.stage === 1 && b.stage === 1 && c.stage === 2 && d.stage === 2 && e.stage === 0, 'loop stages in order'); near(b.f, 1, 1e-3); near(d.f, 0, 2e-3); near(M.loopPhase(290).f, 0.5, 1e-12); }
  for (let th = 0; th < 360; th += 5) { if (M.feedProgress(th) > 0.001 && M.feedProgress(th) < 0.999) ok(!M.needleInCloth(th), 'cloth moves only with the needle clear'); ok(M.feedProgress(th) >= 0 && M.feedProgress(th) <= 1, 'feed between 0 and 1'); }
  near(M.feedProgress(289), 0, 1e-12); near(M.feedProgress(0), 0.5, 1e-9); near(M.feedProgress(70), 1, 1e-12); near(M.feedProgress(100), 0, 1e-12); ok(M.needleInCloth(180) && !M.needleInCloth(0) && !M.needleInCloth(90) && M.needleInCloth(100), 'needle is in the cloth round bottom dead centre');
  const r = 0.015, l = 0.045; near(M.sliderCrank(0, r, l).x, r, 1e-12); near(M.sliderCrank(180, r, l).x, -r, 1e-12); near(M.sliderCrank(0, r, l).a, -r * (1 + r / l), 1e-12); near(M.sliderCrank(180, r, l).a, r * (1 - r / l), 1e-12);
  for (const d of [20, 75, 140, 260]) { const h = 0.01, a = M.sliderCrank(d - h, r, l), b = M.sliderCrank(d + h, r, l), c = M.sliderCrank(d, r, l), dr = 2 * h * Math.PI / 180; near((b.x - a.x) / dr, c.v, 1e-8); near((b.v - a.v) / dr, c.a, 1e-8); }
  const p = M.needlePeak(800, 30); near(p.w, 83.776, 1e-3); near(p.v, 1.3253, 1e-3); near(p.a, 0.015 * p.w ** 2 * (1 + 1 / 3), 1e-6); near(p.a / 9.81, 14.309, 1e-2); const q = M.needlePeak(5000, 30); near(q.v / p.v, 6.25, 1e-9); near(q.a / p.a, 6.25 ** 2, 1e-9); near(q.a / 9.81, 558.9, 0.1); ok(p.v > r * p.w, 'a short rod raises the peak speed above r omega');
  near(M.knotDepth(1, 1), 0.5, 1e-12); near(M.knotDepth(2, 1), 0, 1e-12); near(M.knotDepth(0.5, 1), 1, 1e-12); ok(M.knotDepth(1.5, 1) < 0.5 && M.knotDepth(0.8, 1) > 0.5, 'the crossing moves toward the tighter thread');
  { const u = M.threadUse(2.5, 1, 0.5); near(u.top, 3.5, 1e-12); near(u.bob, 3.5, 1e-12); near((u.top + u.bob) / 2.5, 2.8, 1e-12); const w = M.threadUse(2.5, 1, 0.2); near(w.top + w.bob, 7, 1e-12); near((M.threadUse(1.5, 1, 0.5).top * 2) / 1.5, 3.3333, 1e-3); near(M.threadUse(2.5, 1, -0.1).top, 2.5, 1e-12); }
  near(M.eyePasses(60, 2.5, 1, 0.5), 34.286, 1e-3);
};
