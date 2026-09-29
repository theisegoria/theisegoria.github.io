import * as M from './model.js';
let n = 0, fail = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL', msg); } };
const near = (a, b, eps, msg) => ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);
const TAU = 2 * Math.PI;
const wrapDiff = (a, b) => { let d = a - b; d -= TAU * Math.round(d / TAU); return d; };
const L = { lift_contact_deg: 26.02 };

// month lengths: Gregorian where the mechanism agrees, every fourth year a leap year (2100 included, which is the known limit of a 48-month cam)
ok(M.monthLength(2024, 2) === 29 && M.monthLength(2025, 2) === 28 && M.monthLength(2028, 2) === 29, 'leap Februaries');
ok(M.monthLength(2100, 2) === 29, 'the mechanism treats 2100 as a leap year (the Gregorian calendar does not)');
for (let y = 2024; y <= 2027; y++) for (let m = 1; m <= 12; m++) {
  const g = new Date(Date.UTC(y, m, 0)).getUTCDate();
  ok(M.monthLength(y, m) === g, `length ${y}-${m}`);
}
// cam: 48 distinct notches, January of the leap year first
ok(M.camIndex(2024, 1) === 0 && M.camIndex(2027, 12) === 47 && M.camIndex(2028, 1) === 0, 'cam index cycle');
// jumps: one tooth on ordinary nights, 32 - L on the last night
ok(M.jumpTeeth(15, 31) === 1 && M.jumpTeeth(31, 31) === 1, '31-day month never jumps more than one');
ok(M.jumpTeeth(30, 30) === 2 && M.jumpTeeth(28, 28) === 4 && M.jumpTeeth(29, 29) === 3, 'end-of-month jumps');
ok(M.jumpTeeth(28, 30) === 1 && M.jumpTeeth(28, 29) === 1, 'the 28th of a longer month is an ordinary night');
// walk four years, a day at a time: the displayed date must equal the calendar date, and the star must move exactly N teeth each night
let ms = Date.UTC(2024, 0, 1, 12);
for (let i = 0; i < 1461; i++) {
  const s = M.calendar(ms, L);
  const d = new Date(ms);
  ok(s.day === d.getUTCDate() && s.m === d.getUTCMonth() + 1, `date shown ${s.y}-${s.m}-${s.day}`);
  near(s.dateStar, -TAU * (s.day - 1) / 31, 1e-9, 'date star at rest on the index');
  ok(s.f === 0 && s.phase === 'running', 'no lift at noon');
  const before = M.calendar(ms + 11.5 * 3600e3, L);        // 23:30, mid-lift, before the snap
  const after = M.calendar(ms + 12 * 3600e3, L);           // 00:00 next day
  const t = M.tonight(ms);
  near(wrapDiff(after.dateStar, before.dateStar), -TAU * t.teeth / 31, 1e-9, `night ${s.y}-${s.m}-${s.day}: star moves ${t.teeth} teeth`);
  ok(after.day === t.to, `next date ${t.to}`);
  near(wrapDiff(after.dayStar, before.dayStar), -TAU / 7, 1e-9, 'day star one step a night');
  near(wrapDiff(after.moon, before.moon), -TAU / 59, 1e-9, 'moon disc one tooth a night');
  if (t.monthChanges) { near(wrapDiff(after.monthStar, before.monthStar), -TAU / 12, 1e-9, 'month star steps at month end'); near(wrapDiff(after.cam, before.cam), -TAU / 48, 1e-9, 'cam one notch at month end'); }
  else { near(wrapDiff(after.monthStar, before.monthStar), 0, 1e-9, 'month star still'); near(wrapDiff(after.cam, before.cam), 0, 1e-9, 'cam still'); }
  // the lever: further travel in short months, every day of that month
  ok(before.lever > before.rest && near(before.rest, -M.NOTCH[s.len] * M.EXTRA_PER_MM, 1e-12, 'rest depth from the notch') !== false, 'lever lifting');
  ms += 86400000;
}
// the 24-hour wheel: the lift finger points at the contact direction at midnight and turns clockwise
near(M.calendar(Date.UTC(2025, 5, 10, 0, 0), L).w24, 26.02 * Math.PI / 180, 1e-9, 'lift finger at contact at midnight');
ok(M.calendar(Date.UTC(2025, 5, 10, 6), L).w24 < M.calendar(Date.UTC(2025, 5, 10, 0), L).w24, 'w24 runs clockwise');
// moon: full moon 14.77 days after the reference sits centred in the window (disc angle 0 mod pi)
near(Math.abs(Math.sin(M.moonDiscAngle(15))), Math.abs(Math.sin(Math.PI / 2 - TAU * 15 / 59)), 1e-12, 'moon angle formula');
near(M.moonDiscAngle(0), Math.PI / 2, 1e-12, 'new moon: disc a quarter turn on, moons hidden');
near(M.moonAgeDays(Date.UTC(2024, 0, 11, 11, 57)), 0, 0.6, 'new moon of 11 January 2024 (within a day of the mean cycle)');
// weeks
ok(M.isoWeek(Date.UTC(2024, 0, 1)) === 1 && M.isoWeek(Date.UTC(2024, 11, 30)) === 1 && M.isoWeek(Date.UTC(2020, 11, 31)) === 53, 'ISO week numbers');
console.log(`${n - fail}/${n} calendar checks passed`);
if (fail) process.exit(1);
