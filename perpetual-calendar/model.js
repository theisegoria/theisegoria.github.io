/* Kinematics of a classic 48-month-cam perpetual calendar, as pure functions
 * of the simulated clock.  No DOM, no three.js: model.test.mjs runs this in Node.
 *
 * The mechanism modelled.  The hour wheel drives a 24-hour wheel.  Once a day
 * the 24-hour wheel's finger lifts the grand lever; on the way up the lever's
 * beak advances the 31-tooth date star by one tooth and its day arm advances
 * the 7-tooth day star, then the lever drops back.  The lever's rest position
 * is set by a feeler resting in the current notch of a 48-notch cam that turns
 * once in four years, so in a short month the lever swings further every day,
 * and on the last day of that month its snail arm reaches the date star's
 * snail and drags the star round to the 1st.  When the date star passes the
 * 31st a finger on it steps a transfer star, whose own finger steps the month
 * star, which turns the cam through an intermediate wheel at 4:1.  The moon
 * disc (59 teeth, two moons) is advanced one tooth a night by a second finger
 * on the 24-hour wheel.
 *
 * Angles are radians about each axis, positive counter-clockwise seen from
 * the dial; hands and stars therefore run negative.
 */
export const TEETH = { hour_wheel: 36, w24: 72, date: 31, day: 7, month: 12, month_pinion: 12, inter: 24, inter_pinion: 12, cam_wheel: 24, cam_notches: 48, moon: 59, transfer: 8 };
export const LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const NOTCH = { 31: 0.0, 30: 0.28, 29: 0.56, 28: 0.84 };   // mm, depth of the cam notch for each month length
export const STROKE = 8 * Math.PI / 180;                          // the lever's daily stroke from the lift finger
export const EXTRA_PER_MM = 7 * Math.PI / 180;                    // extra rest depth per mm of notch
export const LIFT_HOURS = 1.0;                                    // the finger lifts the lever over the last hour of the day
export const SNAP = [0.86, 1.0];                                  // the stars jump (jumper snap) in the last part of the lift
export const SYNODIC = 29.530588853;                              // days
export const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14);         // a reference new moon

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = 2 * Math.PI;

/** The mechanism's own leap rule: every fourth year, 2100 included (it does not know the Gregorian century rule). */
export const isLeapMech = (y) => ((y % 4) + 4) % 4 === 0;
export function monthLength(y, m) { return LENGTHS[m - 1] + (m === 2 && isLeapMech(y) ? 1 : 0); }
/** Notch index on the cam: 0 is January of a leap year. */
export const camIndex = (y, m) => (((y % 4) + 4) % 4) * 12 + (m - 1);
/** Teeth the date star moves on the night of day d in a month of length L. */
export const jumpTeeth = (d, L) => (d < L ? 1 : 32 - L);
export const notchDepth = (L) => NOTCH[L];

/** Days (fractional) since the reference new moon, for a UTC timestamp. */
export const moonAgeDays = (ms) => (((ms - NEW_MOON_REF) / 86400000) % SYNODIC + SYNODIC) % SYNODIC;
/** The disc steps one tooth per night; tooth count since the reference new moon, at the start of the given UTC day. */
export function moonTooth(ms) {
  const dayStart = Math.floor(ms / 86400000) * 86400000;
  return Math.floor((dayStart - NEW_MOON_REF) / 86400000);
}
/** Disc angle for a tooth count: the moon is centred in the window (which sits at +y from the disc axis) at full moon. */
export const moonDiscAngle = (k) => Math.PI / 2 - TAU * (((k % 59) + 59) % 59) / 59;

/** ISO week number of a UTC date. */
export function isoWeek(ms) {
  const d = new Date(ms); const day = (d.getUTCDay() + 6) % 7;
  const thu = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const jan4 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((thu - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

/** The whole display and mechanism for a simulated UTC timestamp.  L is the layout from the model metadata. */
export function calendar(ms, L) {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600 + d.getUTCMilliseconds() / 3.6e6;
  const len = monthLength(y, m);
  const N = jumpTeeth(day, len);
  const f = clamp((h - (24 - LIFT_HOURS)) / LIFT_HOURS, 0, 1);          // 0 until the lift begins, 1 at midnight
  const snap = smooth(SNAP[0], SNAP[1], f);
  const depth = notchDepth(len);
  const rest = -depth * EXTRA_PER_MM;
  const lever = rest + (STROKE - rest) * smooth(0, 1, f);               // the lever drops back to `rest` at midnight, when f returns to 0
  const liftContact = (L?.lift_contact_deg ?? 26) * Math.PI / 180;
  const w24 = liftContact - TAU * h / 24;                                // direction of the lift finger
  const hourWheel = -TAU * (h % 12) / 12;
  const minute = -TAU * ((h * 60) % 60) / 60;
  // stars: the base for today, advanced during the snap
  const dateStar = -TAU * (day - 1) / 31 - TAU * N * snap / 31;
  const dow = d.getUTCDay();
  const dayStar = -TAU * dow / 7 - TAU * snap / 7;
  const monthEnd = day === len;
  const monthsSinceEpoch = (y - 2000) * 12 + (m - 1);
  const monthStar = -TAU * (m - 1) / 12 - (monthEnd ? TAU * snap / 12 : 0);
  const transfer = -TAU * (monthsSinceEpoch % 8) / 8 - (monthEnd ? TAU * snap / 8 : 0);
  // cam: the notch for this month sits under the feeler, which is at -pi/2 from the cam axis; one notch clockwise per month
  const idx = camIndex(y, m) + (monthEnd ? snap : 0);
  const cam = -Math.PI / 2 - TAU * (idx + 0.5) / 48;
  const inter = 2 * (cam - (-Math.PI / 2 - TAU * 0.5 / 48));           // the intermediate turns twice as fast, the other way (sign handled in the scene by mesh direction)
  const leap = cam;                                                      // the leap-year hand is on the cam's own pipe
  const k = moonTooth(ms);
  const moon = moonDiscAngle(k) - TAU * snap / 59;
  const week = isoWeek(ms);
  const weekNext = isoWeek(ms + 86400000);
  const weekHand = -TAU * (week - 1) / 52 - (weekNext !== week ? TAU * snap / 52 : 0);
  const phase = f === 0 ? 'running' : f < SNAP[0] ? 'lifting' : 'jumping';
  return { y, m, day, h, dow, len, N, f, snap, depth, rest, lever, w24, hourWheel, minute, dateStar, dayStar, monthStar, transfer, cam, inter, leap, moon, moonAge: moonAgeDays(ms), moonTooth: k, week, weekHand, phase, monthEnd, leapYear: isLeapMech(y), camIndex: camIndex(y, m) };
}

/** Step one whole day: what the mechanism will do tonight. */
export function tonight(ms) {
  const d = new Date(ms); const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const len = monthLength(y, m); const N = jumpTeeth(day, len);
  return { from: day, to: day < len ? day + 1 : 1, teeth: N, monthChanges: day === len, len, depth: notchDepth(len), leapYear: isLeapMech(y) };
}
