import * as M from './model.js';
let n = 0, fail = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL', msg); } };
const near = (a, b, eps, msg) => ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);
const TAU = 2 * Math.PI;
const L = { cage: [0, -8.5], third: [-3.439, -4.451], centre: [0, 0], barrel: [-1.1287, 6.4014], minute: [1.915, -1.607], escape_rel: [-2.566, -0.934], pallet_rel: [-0.508, -2.906] };

// the cage is the seconds hand
near(M.angles(60, L).cage - M.angles(0, L).cage, -TAU, 1e-9, 'cage: one negative turn per minute');
// planetary rate: 84/7 = 12 cage turns per escape-wheel turn relative to the cage, and 8 vibrations per second
const pr = M.planetaryRate();
near(pr.escapeRel / pr.cageRate, 12, 1e-12, 'escape rel / cage = 12');
near(pr.vibrationsPerSecond, 8, 1e-9, '8 vibrations per second');
// the escapement steps 9 degrees per vibration and averages the planetary rate
for (let i = 0; i < 200; i++) { const a = M.escapement(i / 8 + 0.125 + 0.5).escape, b = M.escapement(i / 8 + 0.125 + 0.5 + 0.125).escape; near(b - a, -M.ESCAPE_STEP, 1e-9, 'one step per vibration'); }
near((M.angles(120, L).escape - M.angles(0, L).escape) / 120, pr.escapeRel, 1e-6, 'stepped escape angle averages the mesh rate');
// the balance swings symmetrically at 4 Hz
near(M.escapement(0.125).balance, 0, 1e-9, 'balance through zero at the beat');
near(M.escapement(0.0625).balance, M.BALANCE_AMPLITUDE, 1e-9, 'balance at the extreme a quarter beat later');
near(M.escapement(1).balance, M.escapement(0).balance, 1e-9, 'balance period divides 1 s');
// train periods: third 7.5 min, centre 1 h, barrel 12 h, hour wheel 12 h
const per = (key, T) => near(Math.abs(M.angles(T, L)[key] - M.angles(0, L)[key]), TAU, 1e-6, `${key}: one turn in ${T} s`);
per('third', 450); per('centre', 3600); per('barrel', 43200); per('hour', 43200);
ok(M.angles(3600, L).centre < M.angles(0, L).centre, 'centre wheel runs negative (clockwise)');
ok(M.angles(3600, L).hour < M.angles(0, L).hour, 'hour wheel runs clockwise');
ok(M.angles(3600, L).third > M.angles(0, L).third, 'third wheel runs the other way');
// gravity: a fixed positional error averages to zero over whole cage turns, but not without the cage
near(M.gravityError(3, 0.7, 60), 0, 1e-2, 'error averages to zero over one turn');
near(M.gravityError(3, 0.7, 3600), 0, 1e-2, 'and over an hour');
near(M.gravityError(3, 0.7, 3600, 0), 3 * Math.cos(-0.7), 1e-9, 'without a cage the error stays');
// hairspring: inner end follows the balance, outer end stays at the stud
const h0 = M.hairspringSpiral(0, -0.25), h1 = M.hairspringSpiral(0.5, -0.25);
near(h0[h0.length - 1][1], -0.25, 1e-9, 'outer end at the stud'); near(h1[h1.length - 1][1], -0.25, 1e-9, 'outer end fixed');
near(h1[0][1] - h0[0][1], -0.5, 1e-9, 'inner end turns with the balance');
console.log(`${n - fail}/${n} tourbillon checks passed`);
if (fail) process.exit(1);
