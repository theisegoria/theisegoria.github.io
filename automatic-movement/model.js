/* The kinematics of the movement, as pure functions of time and state.
 * No DOM, no three.js: this file is also run in Node by model.test.mjs.
 *
 * Conventions.  Angles are radians about the movement's axis, positive
 * counter-clockwise when the movement is seen from the dial.  Hands therefore
 * run in the negative direction.  Every wheel in a chain gets its angle from
 * the wheel that drives it, through `driven()`, which also phases the teeth
 * so that a tooth of the driver always meets a gap of the follower.
 */

export const TEETH = {
  barrel: 96, centre_pinion: 8, centre: 80, third_pinion: 10, third: 75, fourth_pinion: 10, fourth: 84, escape_pinion: 7, escape: 20,
  centre_drive: 24, motion_idler: 24, cannon: 24, cannon_leaves: 10, minute_wheel: 30, minute_pinion: 8, hour_wheel: 32, date_drive: 64, date_ring: 31,
  chrono_drive: 60, chrono_inter: 60, clutch_drive: 60, mc_idler: 20, minute_counter: 30, hc_pinion: 8, hc_inter: 48, hc_inter_pinion: 16, hour_counter: 32,
  column_ratchet: 16, columns: 8, rotor_pinion: 8, reverser: 40, reduction: 48, reduction_pinion: 8, ratchet_drive: 60, ratchet: 60, crown_wheel: 24, crown_inter: 40, setting: 32, sliding: 12,
};

export const BEAT_HZ = 4;                       // 28,800 vibrations per hour: 8 vibrations, 4 full oscillations, per second
export const ESCAPE_STEP = 2 * Math.PI / TEETH.escape / 2;   // one vibration lets one half tooth pitch pass: 9 degrees
export const BALANCE_AMPLITUDE = 270 * Math.PI / 180;         // swing from rest to the extreme, a healthy fully wound value
export const RESERVE_HOURS = 80;
export const BARREL_TURNS = RESERVE_HOURS / 12;               // the barrel turns once in 12 h, so a full wind is 6.67 turns

/** Ratio helper: the follower's angle from the driver's, external mesh, with tooth phasing.
 *  phi is the direction (radians) from the driver's axis to the follower's axis. */
export function driven(rotA, zA, zB, phi) {
  const off = phi * (1 + zA / zB) + Math.PI - Math.PI / zB;
  return -(zA / zB) * rotA + off;
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const wrap = (a) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));   // to (-pi, pi]

/** The escapement, as a function of running time in seconds.
 *  Returns the escape wheel's stepped angle (positive direction), the balance
 *  angle, the pallet angle, and which phase of the beat we are in. */
export function escapement(t, amplitude = BALANCE_AMPLITUDE) {
  const u = t * 2 * BEAT_HZ;                  // beats (vibrations) elapsed
  const k = Math.floor(u + 0.5);              // nearest beat centre: the balance passes its rest point at u = k
  const d = u - k;                            // -0.5 .. 0.5 within the beat, 0 at the zero crossing
  // The wheel is locked for most of the beat; it is unlocked and gives its
  // impulse in the ~30 % of the beat centred on the zero crossing.
  const g = smooth(-0.15, 0.15, d);
  const escape = ESCAPE_STEP * (k + g);
  const balance = amplitude * Math.sin(Math.PI * u);
  // The fork stays against one banking, then flips to the other while the
  // impulse pin passes through its notch, i.e. while the wheel is unlocked.
  const before = (k % 2 === 0) ? -1 : 1, after = -before;
  const fork = (0.14) * (before * (1 - g) + after * g);   // +-8 degrees of lever travel
  const phase = Math.abs(d) < 0.15 ? (d < -0.04 ? 'unlock' : d < 0.07 ? 'impulse' : 'drop') : 'locked';
  return { escape, balance, fork, phase, beat: k, vibrationsPerSecond: 2 * BEAT_HZ };
}

/** Angles of the going train and motion works for a movement that has run `t` seconds since an arbitrary origin. */
export function trainAngles(t, L) {
  const e = escapement(t);
  const dir = (a, b) => Math.atan2(L[b][1] - L[a][1], L[b][0] - L[a][0]);
  // Work backwards from the escape wheel, which the balance meters out.
  const escape = e.escape;
  // escape pinion is driven by the fourth wheel: escape = driven(fourth, Z4, Zep, phi(fourth->escape)); invert.
  const inv = (rotB, zA, zB, phi) => (driven(0, zA, zB, phi) - rotB) * (zB / zA);
  const fourth = inv(escape, TEETH.fourth, TEETH.escape_pinion, dir('fourth', 'escape'));
  const third = inv(fourth, TEETH.third, TEETH.fourth_pinion, dir('third', 'fourth'));
  const centre = inv(third, TEETH.centre, TEETH.third_pinion, dir('centre', 'third'));
  const barrel = inv(centre, TEETH.barrel, TEETH.centre_pinion, dir('barrel', 'centre'));
  // Motion works on the dial side: centre arbor -> idler -> cannon pinion -> minute wheel -> hour wheel -> date driving wheel
  const motion_idler = driven(centre, TEETH.centre_drive, TEETH.motion_idler, dir('centre', 'motion_idler'));
  const cannon = driven(motion_idler, TEETH.motion_idler, TEETH.cannon, dir('motion_idler', 'origin'));
  const minute_wheel = driven(cannon, TEETH.cannon_leaves, TEETH.minute_wheel, dir('origin', 'minute_wheel'));
  const hour_wheel = driven(minute_wheel, TEETH.minute_pinion, TEETH.hour_wheel, dir('minute_wheel', 'origin'));
  const date_drive = driven(hour_wheel, TEETH.hour_wheel, TEETH.date_drive, dir('origin', 'date_drive'));
  // Chronograph drive from the fourth arbor: driving wheel -> intermediate -> clutch driving wheel (1 rpm at the centre)
  const chrono_inter = driven(fourth, TEETH.chrono_drive, TEETH.chrono_inter, dir('fourth', 'chrono_inter'));
  const clutch_drive = driven(chrono_inter, TEETH.chrono_inter, TEETH.clutch_drive, dir('chrono_inter', 'origin'));
  // Hour-counter drive from the centre arbor: 6:1 then 2:1, one turn in 12 h
  const hc_inter = driven(centre, TEETH.hc_pinion, TEETH.hc_inter, dir('centre', 'hc_inter'));
  const hour_counter_drive = driven(hc_inter, TEETH.hc_inter_pinion, TEETH.hour_counter, dir('hc_inter', 'hour_counter'));
  return { ...e, fourth, third, centre, barrel, motion_idler, cannon, minute_wheel, hour_wheel, date_drive, chrono_inter, clutch_drive, hc_inter, hour_counter_drive };
}

/** Rates in turns per hour, for the readout and for the tests. */
export function rates() {
  const r = {};
  r.escape = (2 * BEAT_HZ * 3600) / (2 * TEETH.escape);      // vibrations per hour / (2 per tooth) / teeth
  r.fourth = r.escape * TEETH.escape_pinion / TEETH.fourth;
  r.third = r.fourth * TEETH.fourth_pinion / TEETH.third;
  r.centre = r.third * TEETH.third_pinion / TEETH.centre;
  r.barrel = r.centre * TEETH.centre_pinion / TEETH.barrel;
  r.cannon = r.centre;                                        // 24:24:24
  r.minute_wheel = r.cannon * TEETH.cannon_leaves / TEETH.minute_wheel;
  r.hour_wheel = r.minute_wheel * TEETH.minute_pinion / TEETH.hour_wheel;
  r.date_drive = r.hour_wheel * TEETH.hour_wheel / TEETH.date_drive;
  r.clutch_drive = r.fourth;                                  // 60:60:60
  r.hour_counter = r.centre * (TEETH.hc_pinion / TEETH.hc_inter) * (TEETH.hc_inter_pinion / TEETH.hour_counter);
  return r;
}

/** Automatic winding: the rotor's swing is rectified by the reversers, so the
 *  ratchet wheel only ever advances.  Returns the ratchet advance per radian of rotor travel. */
export const WIND_PER_ROTOR_RADIAN = (TEETH.rotor_pinion / TEETH.reverser) * (TEETH.reverser / TEETH.reduction) * (TEETH.reduction_pinion / TEETH.ratchet_drive) * (TEETH.ratchet_drive / TEETH.ratchet);
export const CROWN_PER_RATCHET_TURN = (TEETH.ratchet / TEETH.ratchet_drive) * (TEETH.ratchet_drive / TEETH.crown_inter) * (TEETH.crown_inter / TEETH.crown_wheel);   // crown turns per barrel-arbor turn = 60/24 = 2.5

/** A wrist model: the rotor is a pendulum in the watch plane.  Gravity's
 *  in-plane component depends on the wrist attitude, which we drive with
 *  slow noise scaled by `activity` (0 still, 1 a brisk walk).  Returns the new
 *  state {angle, omega} after dt seconds. */
export function rotorStep(state, dt, activity, t) {
  const g = 9.81, R = 0.011;                      // effective pendulum length 11 mm
  const tilt = activity * (0.9 + 0.5 * Math.sin(0.7 * t)) ;   // how much of gravity acts in the plane
  const dirn = 1.3 * Math.sin(0.35 * t) + 0.8 * Math.sin(1.1 * t + 1) + 2.1 * Math.sin(0.13 * t);   // where "down" points in the plane
  const jolt = activity * (0.9 * Math.sin(2.3 * t) * Math.cos(0.9 * t + 2) + 0.6 * Math.sin(4.1 * t + 0.4));
  const alpha = -(g / R) * 0.06 * tilt * Math.sin(state.angle - dirn) + 22 * jolt - 1.6 * state.omega;   // scaled: the rotor is on a bearing with winding load
  const omega = state.omega + alpha * dt;
  const angle = state.angle + omega * dt;
  return { angle, omega, travelled: state.travelled + Math.abs(omega * dt) };
}

/** The mainspring inside the barrel: `wind` 0..1.  Returns polar samples of the
 *  spiral from the arbor hook outward, coils crowding the arbor when wound and
 *  the wall when run down. */
export function mainspringSpiral(wind, rArbor = 1.15, rWall = 5.55, turns = 13, samples = 900) {
  const pts = [];
  const thick = 0.11, free = rWall - rArbor - turns * thick;   // radial play the coils can spread across
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;                       // 0 at the arbor, 1 at the wall
    // fraction of the free space taken up between arbor and this coil: wound -> coils inside, so spacing grows with s;
    // unwound -> coils outside, spacing shrinks with s.  Blend the two with `wind`.
    const inner = Math.pow(s, 2.4), outer = 1 - Math.pow(1 - s, 2.4);
    const spread = wind * inner + (1 - wind) * outer;
    const r = rArbor + thick * (turns * s) + free * spread;
    pts.push([r, s * turns * 2 * Math.PI]);
  }
  return pts;
}

/** The hairspring: an Archimedean spiral from the collet (turns with the balance)
 *  to the stud (fixed).  Returns [r, theta] samples in the balance's frame. */
export function hairspringSpiral(balanceAngle, studAngle, turns = 12, rIn = 0.55, rOut = 3.55, samples = 720) {
  const total = turns * 2 * Math.PI + balanceAngle;     // the inner end is carried round by the balance
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const phi = studAngle - total * (1 - s);           // s = 0 at the collet, s = 1 at the stud
    const r = rIn + (rOut - rIn) * Math.pow(s, 0.9);
    pts.push([r, phi]);
  }
  return pts;
}

/** Chronograph state machine.  `pressStart` and `pressReset` are edge events. */
export function chronoStep(c, dt, dtSim, clutchDriveAngle, hourDriveAngle, pressStart, pressReset) {
  const s = { ...c };
  if (pressStart) {
    s.column += 2 * Math.PI / TEETH.column_ratchet;       // the operating lever turns the column wheel one ratchet tooth
    s.running = !s.running;
    if (s.running) { s.offset = wrap(s.seconds - clutchDriveAngle); s.offsetH = wrap(s.hours - hourDriveAngle); }   // clutch closes, brakes lift: the counters follow their drives
  }
  if (pressReset && !s.running) {
    s.resetting = 1;                                       // hammers fall: the hearts turn to their notch
  }
  if (s.running) {
    const prev = s.seconds;
    s.seconds = clutchDriveAngle + s.offset;
    s.elapsed += dtSim;
    // minute counter: one step per full turn of the seconds wheel, taken when the finger passes the idler
    const laps = Math.floor(-s.seconds / (2 * Math.PI)) - Math.floor(-prev / (2 * Math.PI));
    if (laps > 0) s.minuteSteps = (s.minuteSteps + laps);
    s.minuteJump = 1;                                      // jumper animation runs while > 0
    s.hours = hourDriveAngle + s.offsetH;                   // the hour counter follows its friction drive while the brake is off
  }
  if (s.resetting > 0) {
    s.resetting = Math.max(0, s.resetting - dt / 0.16);
    const k = 1 - s.resetting;
    s.seconds = s.resetFrom.seconds * (1 - k) + 0 * k;
    s.minutes = s.resetFrom.minutes * (1 - k);
    s.hours = s.resetFrom.hours * (1 - k);
    if (s.resetting === 0) { s.seconds = 0; s.minutes = 0; s.hours = 0; s.minuteSteps = 0; s.elapsed = 0; s.offset = 0; s.offsetH = 0; }
  } else {
    // minute counter angle: steps of 1/30 turn, with a short jump animation
    const target = -2 * Math.PI * (s.minuteSteps % 30) / 30;
    if (Math.abs(wrap(target - s.minutes)) > 1e-6) {
      const k = Math.min(1, dt / 0.08);
      s.minutes = s.minutes + wrap(target - s.minutes) * k;
      if (Math.abs(wrap(target - s.minutes)) < 0.002) s.minutes = target;
    }
  }
  s.resetFrom = { seconds: wrap(s.seconds), minutes: wrap(s.minutes), hours: wrap(s.hours) };
  return s;
}

export function chronoInit() {
  return { running: false, column: 0, seconds: 0, minutes: 0, hours: 0, offset: 0, offsetH: 0, minuteSteps: 0, elapsed: 0, resetting: 0, minuteJump: 0, resetFrom: { seconds: 0, minutes: 0, hours: 0 } };
}

/** Column-wheel geometry: whether a lever tail at column phase `k` sits on a column (true) or in a gap. */
export function onColumn(columnAngle, leverPhase) {
  const u = ((columnAngle + leverPhase) / (2 * Math.PI) * TEETH.columns) % 1;
  return ((u + 1) % 1) < 0.5;
}

/** Keyless works: crown position 0 wind, 1 date, 2 set.  Returns part displacements. */
export function keyless(position, pull) {
  const p = clamp(pull, 0, 2);                 // continuous, for the animation between positions
  return {
    stemX: 0.55 * p,                           // the stem slides out
    settingLever: 0.16 * p,                    // rotates on its screw as the stem's groove pushes its pin
    yoke: -0.09 * p,                           // the yoke tips and drags the sliding pinion inward
    slidingX: -0.75 * p,
    engaged: p > 1.5 ? 'setting' : p > 0.5 ? 'date' : 'winding',
  };
}
