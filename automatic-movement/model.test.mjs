import * as M from './model.js';
import { readFileSync } from 'node:fs';
const L = JSON.parse(readFileSync(new URL('./assets/movement-meta.json', import.meta.url))).layout;
let n = 0; const ok = (c, m) => { if (!c) throw new Error('FAIL ' + m); n++; };
const near = (a, b, t, m) => ok(Math.abs(a - b) < t, `${m}: ${a} vs ${b}`);
const r = M.rates();
near(r.fourth, 60, 1e-9, 'fourth wheel 60 turns/h'); near(r.centre, 1, 1e-9, 'centre 1/h'); near(r.cannon, 1, 1e-9, 'cannon 1/h');
near(r.hour_wheel, 1 / 12, 1e-9, 'hour wheel 1/12'); near(r.date_drive, 1 / 24, 1e-9, 'date drive 1/24'); near(r.barrel, 1 / 12, 1e-9, 'barrel 1/12 per h');
near(r.hour_counter, 1 / 12, 1e-9, 'hour counter 1/12'); near(r.escape, 720, 1e-9, 'escape 720/h');
near(M.BARREL_TURNS, 80 / 12, 1e-9, 'reserve turns');
// escapement: 8 steps per second, 9 degrees each, wheel angle monotone
let prev = -1; for (let t = 0; t <= 2; t += 0.001) { const e = M.escapement(t); ok(e.escape >= prev - 1e-12, 'monotone'); prev = e.escape; }
near(M.escapement(1).escape - M.escapement(0).escape, 8 * M.ESCAPE_STEP, 1e-9, '8 vibrations per second');
near(M.escapement(5).escape - M.escapement(0).escape, 2 * Math.PI, 1e-9, 'escape wheel one turn in 5 s');
// train angles: fourth wheel one turn per minute, negative (clockwise from the dial)
const a0 = M.trainAngles(0, L), a60 = M.trainAngles(60, L), a3600 = M.trainAngles(3600, L);
near(a60.fourth - a0.fourth, -2 * Math.PI, 1e-9, 'fourth -1 turn/min'); near(a3600.centre - a0.centre, -2 * Math.PI, 1e-9, 'centre -1 turn/h');
near(a3600.cannon - a0.cannon, -2 * Math.PI, 1e-9, 'cannon clockwise 1 turn/h'); near(a3600.hour_wheel - a0.hour_wheel, -2 * Math.PI / 12, 1e-9, 'hour wheel');
near(a60.clutch_drive - a0.clutch_drive, -2 * Math.PI, 1e-9, 'chrono drive clockwise 1/min'); near(a3600.hour_counter_drive - a0.hour_counter_drive, -2 * Math.PI / 12, 1e-9, 'hour counter drive');
ok(a3600.barrel - a0.barrel > 0, 'barrel turns the other way');
// tooth phasing: a driver tooth pointing at the follower meets a gap
for (const [zA, zB, phi] of [[80, 10, 0.3], [96, 8, 2.0], [24, 24, -1.2], [60, 60, 0.0]]) {
  const rotA = phi - Math.PI / zA;           // driver tooth centre at angle phi
  const rotB = M.driven(rotA, zA, zB, phi);
  const gapDir = phi + Math.PI;              // follower must have a gap pointing back at the driver
  const u = ((gapDir - rotB) / (2 * Math.PI) * zB) % 1; const frac = ((u % 1) + 1) % 1;
  ok(Math.min(frac, 1 - frac) < 1e-9, `phasing ${zA}:${zB}`);
}
// winding: rotor to barrel reduction and crown ratio
near(1 / M.WIND_PER_ROTOR_RADIAN, 45, 1e-9, 'rotor:barrel 45:1'); near(M.CROWN_PER_RATCHET_TURN, 2.5, 1e-9, 'crown turns per arbor turn');
// chronograph: start, run 61 s, stop, reset
let c = M.chronoInit(); const t0 = M.trainAngles(0, L);
c = M.chronoStep(c, 0, 0, t0.clutch_drive, t0.hour_counter_drive, true, false); ok(c.running, 'running');
for (let t = 0; t < 61; t += 0.05) { const a = M.trainAngles(t, L); c = M.chronoStep(c, 0.05, 0.05, a.clutch_drive, a.hour_counter_drive, false, false); }
near(M.wrap(c.seconds), M.wrap(-2 * Math.PI * 61 / 60), 0.01, 'chrono seconds after 61 s'); ok(c.minuteSteps === 1, 'minute counter stepped once');
c = M.chronoStep(c, 0, 0, 0, 0, true, false); ok(!c.running, 'stopped');
c = M.chronoStep(c, 0, 0, 0, 0, false, true); for (let i = 0; i < 20; i++) c = M.chronoStep(c, 0.05, 0.05, 0, 0, false, false);
near(c.seconds, 0, 1e-9, 'reset to zero'); near(c.minutes, 0, 1e-9, 'minutes reset');
// mainspring and hairspring stay inside their bounds
for (const w of [0, 0.5, 1]) for (const [r] of M.mainspringSpiral(w)) ok(r >= 1.15 - 1e-9 && r <= 5.55 + 1e-9, 'spring radius');
for (const b of [-4.7, 0, 4.7]) { const h = M.hairspringSpiral(b, 1.0); near(h[0][0], 0.55, 1e-9, 'collet'); near(h[h.length - 1][0], 3.55, 1e-9, 'stud'); near(h[h.length - 1][1], 1.0, 1e-9, 'stud angle fixed'); near(h[0][1], 1.0 - 12 * 2 * Math.PI - b, 1e-9, 'collet carried by balance'); }
console.log(n, 'model checks passed');
