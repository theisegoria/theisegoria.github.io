/* Kinematics of a one-minute flying tourbillon, as pure functions of time.
 * No DOM, no three.js: model.test.mjs runs this in Node.
 *
 * Conventions.  Angles are radians about the movement axis, positive
 * counter-clockwise seen from the dial; hands (and the cage, which is the
 * seconds hand) therefore run negative.  A follower's angle comes from its
 * driver through driven(), which phases the teeth so a tooth always meets a gap.
 */
export const TEETH = { barrel: 96, centre_pinion: 8, centre: 80, third_pinion: 10, third: 75, cage_pinion: 10, fixed: 84, escape_pinion: 7, escape: 20, cannon: 10, minute_wheel: 30, minute_pinion: 8, hour_wheel: 32 };
export const BEAT_HZ = 4;                                    // 28,800 vibrations per hour
export const ESCAPE_STEP = 2 * Math.PI / TEETH.escape / 2;   // one vibration lets half a tooth pitch pass: 9 degrees
export const BALANCE_AMPLITUDE = 270 * Math.PI / 180;
export const CAGE_PERIOD = 60;                               // seconds per turn of the cage
export const RESERVE_HOURS = 65;

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const wrap = (a) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));

/** External mesh: the follower's angle from the driver's, with tooth phasing; phi is the direction driver -> follower. */
export function driven(rotA, zA, zB, phi) {
  const off = phi * (1 + zA / zB) + Math.PI - Math.PI / zB;
  return -(zA / zB) * rotA + off;
}

/** The escapement inside the cage: escape wheel steps of 9 degrees, one per vibration, the balance swinging, the fork flipping.
 *  All angles are in the cage's own frame. */
export function escapement(t, amplitude = BALANCE_AMPLITUDE) {
  const u = t * 2 * BEAT_HZ;
  const k = Math.floor(u + 0.5);
  const d = u - k;
  const g = smooth(-0.15, 0.15, d);
  const escape = -ESCAPE_STEP * (k + g);                      // the escape wheel runs negative, like the hands
  const balance = amplitude * Math.sin(Math.PI * u);
  const before = (k % 2 === 0) ? -1 : 1, after = -before;
  const fork = 0.14 * (before * (1 - g) + after * g);
  const phase = Math.abs(d) < 0.15 ? (d < -0.04 ? 'unlock' : d < 0.07 ? 'impulse' : 'drop') : 'locked';
  return { escape, balance, fork, phase, beat: k };
}

/** Why the escape wheel turns at all: seen from the cage, the fixed wheel rotates backwards at the cage rate,
 *  and it drives the escape pinion.  That gives the mean rate the escapement must meter out. */
export function planetaryRate(cagePeriod = CAGE_PERIOD) {
  const cageRate = -2 * Math.PI / cagePeriod;                  // rad/s, negative like the hands
  const escapeRel = cageRate * TEETH.fixed / TEETH.escape_pinion;   // rad/s relative to the cage, same sign as the cage
  return { cageRate, escapeRel, vibrationsPerSecond: Math.abs(escapeRel) / ESCAPE_STEP };
}

/** Every angle of the mechanism after `t` seconds.  L is the layout from the model metadata (mm, dial view). */
export function angles(t, L) {
  const dir = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const e = escapement(t);
  const cage = -2 * Math.PI * t / CAGE_PERIOD;
  // escape pinion on the fixed wheel: in the cage frame the fixed wheel turns by -cage, and drives the pinion
  const phiE = Math.atan2(L.escape_rel[1], L.escape_rel[0]);
  const escapeMean = driven(-cage, TEETH.fixed, TEETH.escape_pinion, phiE);          // what the mesh alone would give
  const escape = escapeMean + (e.escape - (-ESCAPE_STEP * t * 2 * BEAT_HZ));           // the escapement's stepping superimposed on the mean
  // the train behind the cage: the cage pinion is driven by the third wheel; invert
  const inv = (rotB, zA, zB, phi) => (driven(0, zA, zB, phi) - rotB) * (zB / zA);
  const third = inv(cage, TEETH.third, TEETH.cage_pinion, dir(L.third, L.cage));
  const centre = inv(third, TEETH.centre, TEETH.third_pinion, dir(L.centre, L.third));
  const barrel = inv(centre, TEETH.barrel, TEETH.centre_pinion, dir(L.barrel, L.centre));
  // motion works: cannon (with the centre arbor) -> minute wheel -> hour wheel
  const minuteWheel = driven(centre, TEETH.cannon, TEETH.minute_wheel, dir(L.centre, L.minute));
  const hour = driven(minuteWheel, TEETH.minute_pinion, TEETH.hour_wheel, dir(L.minute, L.centre));
  return { cage, escape, escapeMean, balance: e.balance, fork: e.fork, phase: e.phase, third, centre, barrel, minute: centre, hour, beat: e.beat };
}

/** The point of the thing: a fixed error e0 that depends on the balance's orientation in the field of gravity,
 *  positional error(theta) = e0 * cos(theta - theta0), averaged over one cage turn is zero;
 *  without the cage the watch sits at one theta all night.  Returns the running mean over `seconds`. */
export function gravityError(e0, theta0, seconds, cagePeriod = CAGE_PERIOD, samples = 600) {
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const t = seconds * i / samples;
    const theta = cagePeriod > 0 ? 2 * Math.PI * t / cagePeriod : 0;
    sum += e0 * Math.cos(theta - theta0);
  }
  return sum / samples;
}

/** Hairspring as (r, phi) samples in the cage frame, the inner end carried round by the balance. */
export function hairspringSpiral(balanceAngle, studAngle, turns = 12, rIn = 0.55, rOut = 3.4, samples = 720) {
  const total = turns * 2 * Math.PI + balanceAngle;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const phi = studAngle - total * (1 - s);
    const r = rIn + (rOut - rIn) * Math.pow(s, 0.9);
    pts.push([r, phi]);
  }
  return pts;
}

/** Mainspring as (r, phi) samples for a wind state 0..1 (used for the barrel cutaway). */
export function mainspringSpiral(wind, rArbor = 1.15, rWall = 5.55, turns = 13, samples = 900) {
  const pts = [];
  const inner = rArbor + (rWall - rArbor) * 0.62 * (1 - wind);
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    pts.push([inner + (rWall - 0.12 - inner) * s, 2 * Math.PI * turns * s]);
  }
  return pts;
}
