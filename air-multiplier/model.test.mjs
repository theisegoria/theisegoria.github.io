// node --test air-multiplier/model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b} (tol ${tol})`);

test('jet constants follow from the spreading rates', () => {
  // the round-jet constant is Ricou and Spalding's 0.32 x/d, rewritten per sqrt(area)
  near(M.CR, 0.32 * Math.sqrt(Math.PI) / 2, 0.003);
  // the plane-jet constant sits inside the classical 0.44 to 0.62 sqrt(x/B) range
  assert.ok(M.CP > 0.44 && M.CP < 0.62, M.CP);
});

test('the fan curve reproduces the patent operating point', () => {
  const op = M.operatingPoint(1, 1.3, 350);
  near(op.Q0 * 1000, 27, 0.5);                 // l/s
  near(op.U0, 19, 0.5);
  assert.ok(op.Re > 1000 && op.Re < 2500, op.Re);  // a transitional slot jet
});

test('fan laws: flow scales with speed, pressure with its square', () => {
  const a = M.operatingPoint(1, 1.3, 350), b = M.operatingPoint(0.5, 1.3, 350);
  near(b.Q0 / a.Q0, 0.5, 1e-9);
  near(b.dp / a.dp, 0.25, 1e-9);
  // and the multiplication ratio does not depend on speed at all
  near(M.solve({ ...M.DEFAULTS, speed: 0.4 }).ratio, M.solve(M.DEFAULTS).ratio, 1e-9);
});

test('patent: 400 to 500 l/s at three loop diameters', () => {
  const s = M.solve({ speed: 1, slotMm: 1.3, diameterMm: 350, x: 1.05 });
  assert.ok(s.Q * 1000 > 400 && s.Q * 1000 < 500, s.Q * 1000);
});

test('Jafari et al. 2016: 60 cm loop, 6 mm slot, 3D downstream, measured 11.7', () => {
  const r = M.ratio(1.8, 0.006, 0.6);
  assert.ok(Math.abs(r - 11.7) / 11.7 < 0.2, r);
});

test('Joshi et al. 2023: 1.2 mm beats 2.0 mm by about a quarter', () => {
  const g = M.ratio(1.0, 0.0012, 0.3) / M.ratio(1.0, 0.002, 0.3) - 1;
  assert.ok(g > 0.18 && g < 0.34, g);
});

test('the composite curve is continuous and smooth at the crossover', () => {
  const B = 0.0013, D = 0.35, xs = M.crossover(B, D);
  near(xs / (Math.PI * D), 1.036, 0.005);
  const h = 1e-5;
  near(M.ratio(xs - h, B, D), M.ratio(xs + h, B, D), 1e-3);
  const sL = (M.ratio(xs, B, D) - M.ratio(xs - h, B, D)) / h;
  const sR = (M.ratio(xs + h, B, D) - M.ratio(xs, B, D)) / h;
  near(sL, sR, 0.01 * sL);
  near(M.peakSpeed(xs - h, B, D), M.peakSpeed(xs + h, B, D), 1e-3);
});

test('the ratio flatters narrow slots; delivered air peaks near the matched slot', () => {
  const at = (b) => M.solve({ speed: 1, slotMm: b, diameterMm: 350, x: 1 });
  assert.ok(at(0.6).ratio > at(1.3).ratio && at(1.3).ratio > at(3).ratio);
  const best = M.bestSlotMm(350);
  near(best, 1.41, 0.02);
  assert.ok(at(best).Q >= at(0.6).Q && at(best).Q >= at(3).Q);
});

test('flows add up and shares sum to one', () => {
  for (const x of [0.05, 0.5, 1.2, 2.5]) {
    const s = M.solve({ ...M.DEFAULTS, x });
    near(s.Q0 + s.induced + s.entrained, s.Q, 1e-12);
    near(s.share.primary + s.share.induced + s.share.entrained, 1, 1e-12);
    assert.ok(s.induced >= 0 && s.entrained >= s.induced - 1e-12);
  }
});

test('the profile is a closed simple polygon with the slot the right width', () => {
  for (const b of [0.6, 1.3, 4]) {
    const p = M.profile(b);
    near(Math.hypot(p.S1[0] - p.S2[0], p.S1[1] - p.S2[1]) * 1000, b, 1e-9);
    // no self-intersections
    const P = p.pts, n = P.length;
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const a = P[i], b2 = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
      const hit = cross(a, b2, c) * cross(a, b2, d) < 0 && cross(c, d, a) * cross(c, d, b2) < 0;
      assert.ok(!hit, `segments ${i} and ${j} cross at slot ${b}`);
    }
  }
});
