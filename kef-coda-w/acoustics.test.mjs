import * as A from './acoustics.js';
let n = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL ' + m); n++; };
const near = (a, b, t, m) => ok(Math.abs(a - b) < t, `${m}: ${a} vs ${b}`);
// monopole: 1/r
const s = [{ p: [0, 0, 0], amp: 1 }];
near(Math.hypot(...A.pressureAt(s, 1000, 1, 0, 0)), 1, 1e-12, '1/r at 1 m'); near(Math.hypot(...A.pressureAt(s, 1000, 2, 0, 0)), 0.5, 1e-12, '1/r at 2 m');
// two in-phase sources half a wavelength apart cancel on the axis through them
const f = 1000, lam = A.C / f;
const pair = [{ p: [0, 0, 0], amp: 1 }, { p: [lam / 2, 0, 0], amp: 1 }];
ok(Math.hypot(...A.pressureAt(pair, f, 10, 0, 0)) < 0.002, 'end-fire cancellation');
ok(Math.hypot(...A.pressureAt(pair, f, 0, 10, 0)) > 0.19, 'broadside addition');
// LR4 crossover: sum is unity and in phase at every frequency
for (const fr of [100, 500, 2000, 2500, 5000, 20000]) { const [lr, li, hr, hi] = A.crossover(fr, 2500); near(Math.hypot(lr + hr, li + hi), 1, 1e-9, 'LR4 flat sum at ' + fr); }
near(Math.hypot(...A.crossover(2500, 2500).slice(0, 2)), 0.5, 1e-9, 'LP is -6 dB at fc');
// coincident two-way is flat at every angle; separated is not
for (const a of [0, 30, 60]) { const lis = [0, 2 * Math.sin(a * Math.PI / 180), 2 * Math.cos(a * Math.PI / 180)]; for (const fr of [500, 2500, 6000]) near(A.twoWayResponse(fr, 2500, [0, 0, 0], [0, 0, 0], lis), 0, 1e-9, `coincident flat ${a} ${fr}`); }
const map = A.responseMap(200, 10000, 40, -60, 60, 41, 2500, 0.13, 2);
let mn = 1e9, mx = -1e9; for (const v of map) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
ok(mn < -6 && mx < 3, 'separated map has deep off-axis dips ' + mn + ' ' + mx);
near(A.responseMap(200, 10000, 10, -60, 60, 11, 2500, 0, 2).reduce((a, b) => Math.max(a, Math.abs(b)), 0), 0, 1e-9, 'coincident map flat');
// on axis the separated pair is nearly flat too (path difference ~ 0)
near(A.twoWayResponse(2500, 2500, [0, -0.065, 0], [0, 0.065, 0], [0, 0, 2]), 0, 0.05, 'separated on axis nearly flat');
// image sources: 6 first-order, 1 direct, order-2 count = 1 + 6 + 18? (walls pairs) ; check counts and distances
const L = [4, 2.7, 5]; const src = [1, 1, 1];
const img1 = A.imageSources(src, L, 1, 0.8);
ok(img1.filter((s) => s.order === 0).length === 1 && img1.filter((s) => s.order === 1).length === 6, 'first-order images: 6');
const img2 = A.imageSources(src, L, 2, 0.8);
ok(img2.filter((s) => s.order === 2).length === 18, 'second-order images: 18 got ' + img2.filter((s) => s.order === 2).length);
const floor = img1.find((s) => s.p[1] < 0); near(floor.p[1], -1, 1e-12, 'floor image mirrored');
const ceil = img1.find((s) => s.p[1] > L[1]); near(ceil.p[1], 2 * 2.7 - 1, 1e-12, 'ceiling image');
const lis = [3, 1.2, 3];
const e = A.echogram(src, lis, L, 2, 0.8);
near(e[0].dt, 0, 1e-12, 'direct first'); ok(e.every((x, i) => i === 0 || x.dt >= e[i - 1].dt), 'sorted'); ok(e[0].db === 0, 'direct 0 dB');
const bp = A.bouncePoint(ceil, lis, L); near(bp[1], L[1], 1e-9, 'bounce on ceiling'); 
// equal angles: incidence = reflection
const ang = (a, b) => Math.atan2(Math.hypot(a[0] - b[0], a[2] - b[2]), Math.abs(a[1] - b[1]));
near(ang(src, bp), ang(lis, bp), 1e-9, 'incidence equals reflection');
// tweeter ring: steered beam peaks toward the steering azimuth
const ring = A.tweeterRing(5, 0.055, 0.03, 0.7, 1);
const pol = A.polar(ring, 4000, [0, 0.03, 0], [1, 0, 0], [0, 0, 1], 3, 360);
let best = 0; for (let i = 0; i < 360; i++) if (pol[i] > pol[best]) best = i;
near(best * Math.PI / 180, 0.7, 0.12, 'beam peak at steer angle');
const omni = A.polar(A.tweeterRing(5, 0.055, 0.03, 0.7, 0), 1000, [0, 0.03, 0], [1, 0, 0], [0, 0, 1], 3, 360);
ok(Math.max(...omni) - Math.min(...omni) < 3, 'omni ring within 3 dB at 1 kHz');
// field raster returns finite values
const fld = A.fieldOnPlane(ring, 3000, [0, 0.03, 0], [1, 0, 0], [0, 0, 1], 1, 1, 32);
ok(fld.db.every(Number.isFinite), 'finite field');
const pd = A.pathDifference(0.13, 30 * Math.PI / 180, 2, 2500); near(pd.d, 0.13 * Math.sin(30 * Math.PI / 180), 0.003, 'path difference ~ d sin a');
console.log(n, 'acoustics checks passed');
