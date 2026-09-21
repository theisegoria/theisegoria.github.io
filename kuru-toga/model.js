/* Kuru Toga: the two models behind the lab, as pure functions.
 *
 * Nothing here touches three.js or the DOM, so it runs in Node for checking
 * (see tests/kuru-toga-model.test.mjs) and in the browser for the scene.
 *
 * 1. The engine. A rotor carrying sawtooth cam faces on both ends sits between
 *    two cam rings fixed to the barrel. Writing pressure drives the rotor back
 *    against a spring and its rear teeth ride up the upper ring: half a tooth
 *    of rotation. Lifting the pen lets the spring drive the rotor forward and
 *    its front teeth ride up the lower ring: the other half, the same way
 *    round, because the two cam pairs are cut half a pitch out of phase. One
 *    press and lift equals one whole tooth, so 40 teeth give 9 degrees and the
 *    20-tooth Advance engine gives 18.
 *
 * 2. The wear. The tip is a height field in the lead's own frame: material
 *    occupies z >= h(rho, alpha). Each stroke the paper plane cuts it, and the
 *    cut removes a fixed volume per stroke, which is Archard's law at constant
 *    load and constant sliding distance. A lead that never turns is cut at one
 *    azimuth forever and grows a flat; a lead that turns by a few degrees each
 *    stroke is cut at every azimuth in succession, and the intersection of all
 *    those half spaces is a cone of half angle theta about the lead axis.
 */

export const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the engine

/** Rotation per complete press-and-lift cycle, in degrees, for a cam ring of `teeth` teeth. */
export const degreesPerStroke = (teeth) => 360 / teeth;

/** Smoothstep, used for the cam slide so the rotor eases rather than snapping. */
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * The state of the engine part way through one cycle.
 *
 * `phase` runs 0 to 1 over press then lift. The rotor travels back over the
 * first half and returns over the second, and it turns through half a tooth in
 * each half, both times in the same direction. `camSlide` is how far through
 * the current tooth the meshing pair has ridden, which is what the animation
 * needs to draw the teeth in contact rather than interpenetrating.
 */
export function engineState(phase, teeth) {
  const p = ((phase % 1) + 1) % 1;
  const step = degreesPerStroke(teeth);
  const pressing = p < 0.5;
  // The cam rides over the middle 70% of each half stroke: the first part of
  // the press takes up the cushion travel, the last part seats the tooth.
  const local = pressing ? p * 2 : (p - 0.5) * 2;
  const ride = smooth((local - 0.15) / 0.7);
  return {
    pressing,
    // 0 at rest, 1 fully pressed: the rotor's axial travel against the spring
    axial: pressing ? smooth(local) : 1 - smooth(local),
    // degrees turned since the start of this cycle
    turned: (pressing ? 0 : step / 2) + (step / 2) * ride,
    // which pair is driving: the rear teeth on the upper ring, or the front on the lower
    driving: pressing ? 'upper' : 'lower',
    camSlide: ride,
  };
}

// ------------------------------------------------------------------ the wear

/**
 * A lead tip as a height field on a polar grid in the lead's own frame.
 * rings + 1 radial stations by `sectors` azimuthal ones. h is the surface
 * height: material is everything above it.
 */
export function makeTip({ radius = 0.25, rings = 28, sectors = 96 } = {}) {
  const nr = rings + 1;
  const h = new Float32Array(nr * sectors);
  const rho = new Float32Array(nr);
  const area = new Float32Array(nr);          // area each station stands for
  const dRho = radius / rings;
  const dAlpha = (2 * Math.PI) / sectors;
  for (let i = 0; i < nr; i++) {
    rho[i] = i * dRho;
    const outer = Math.min(radius, rho[i] + dRho / 2);
    const inner = Math.max(0, rho[i] - dRho / 2);
    area[i] = (dAlpha * (outer * outer - inner * inner)) / 2;
  }
  const cos = new Float32Array(sectors);
  const sin = new Float32Array(sectors);
  for (let j = 0; j < sectors; j++) { cos[j] = Math.cos(j * dAlpha); sin[j] = Math.sin(j * dAlpha); }
  return { radius, rings, sectors, nr, h, rho, area, cos, sin, dRho, dAlpha, azimuth: 0, strokes: 0, contact: new Uint8Array(nr * sectors) };
}

/** Reset a tip to a freshly cut, square end. */
export function resetTip(tip) {
  tip.h.fill(0);
  tip.contact.fill(0);
  tip.azimuth = 0;
  tip.strokes = 0;
}

/**
 * One stroke against the paper.
 *
 * `holdDeg` is the angle between the lead axis and the paper. `volume` is the
 * graphite removed in this stroke, which Archard's law makes independent of how
 * big the contact patch is: the same load over the same sliding distance wears
 * the same volume whether it is spread over a wide flat or a small point.
 * `turnDeg` is how far the lead has turned since the last stroke.
 *
 * Returns the width of the mark this stroke left, the contact area, and how far
 * the tip receded, all in the same units as the radius.
 */
export function wearStroke(tip, { holdDeg, volume, turnDeg = 0 }) {
  const { nr, sectors, h, rho, area, cos, sin, contact } = tip;
  tip.azimuth += turnDeg * DEG;
  const phi = tip.azimuth;
  const cotTheta = 1 / Math.tan(holdDeg * DEG);
  const cp = Math.cos(phi), sp = Math.sin(phi);

  // Height of the paper plane over each station, relative to its height on the
  // axis: z_plane = D - rho * cot(theta) * cos(alpha - phi).
  // Removed volume grows monotonically with D, so bisect for the D that removes
  // exactly `volume`.
  const lean = new Float32Array(nr * sectors);
  let lo = Infinity;
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < sectors; j++) {
      const k = i * sectors + j;
      lean[k] = rho[i] * cotTheta * (cos[j] * cp + sin[j] * sp);
      const touch = h[k] + lean[k];
      if (touch < lo) lo = touch;
    }
  }
  const removedAt = (D) => {
    let v = 0;
    for (let i = 0; i < nr; i++) {
      const a = area[i];
      for (let j = 0; j < sectors; j++) {
        const k = i * sectors + j;
        const cut = D - lean[k] - h[k];
        if (cut > 0) v += cut * a;
      }
    }
    return v;
  };
  // Bracket from a guess scaled to the volume, then double until it overshoots.
  let hi = lo + Math.max(1e-5, (4 * volume) / (Math.PI * tip.radius * tip.radius));
  while (removedAt(hi) < volume) hi += hi - lo;
  for (let it = 0; it < 30; it++) {
    const mid = (lo + hi) / 2;
    if (removedAt(mid) < volume) lo = mid; else hi = mid;
  }
  const D = (lo + hi) / 2;

  // Apply the cut, and record which stations the paper actually touched.
  let patchArea = 0, halfWidth = 0, recession = 0, along0 = Infinity, along1 = -Infinity;
  let n = 0;
  contact.fill(0);
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < sectors; j++) {
      const k = i * sectors + j;
      const z = D - lean[k];
      if (z > h[k]) {
        recession = Math.max(recession, z - h[k]);
        h[k] = z;
        contact[k] = 1;
        n++;
        patchArea += area[i];
        // Width across the stroke: the pencil leans along phi, so the line is
        // as wide as the patch measured at right angles to phi.
        const across = Math.abs(rho[i] * (sin[j] * cp - cos[j] * sp));
        if (across > halfWidth) halfWidth = across;
        const along = rho[i] * (cos[j] * cp + sin[j] * sp);
        if (along < along0) along0 = along;
        if (along > along1) along1 = along;
      }
    }
  }
  tip.strokes++;
  return {
    lineWidth: 2 * halfWidth,
    patchLength: n ? along1 - along0 : 0,
    patchArea, recession, planeHeight: D, cells: n,
  };
}

/**
 * The tip's mean profile: height above the lowest point, averaged over azimuth,
 * at each radial station. A cone of half angle theta about the axis has
 * dh/drho = cot(theta), so the slope of this profile is how the lab measures
 * what shape the tip has actually converged to.
 */
export function tipProfile(tip) {
  const { nr, sectors, h, rho } = tip;
  const mean = new Float32Array(nr);
  let base = Infinity;
  for (let i = 0; i < nr; i++) {
    let s = 0;
    for (let j = 0; j < sectors; j++) s += h[i * sectors + j];
    mean[i] = s / sectors;
    if (mean[i] < base) base = mean[i];
  }
  for (let i = 0; i < nr; i++) mean[i] -= base;
  return { rho, mean };
}

/**
 * Least-squares slope of the mean profile, as a cone half angle in degrees.
 *
 * Fitted over the outer flank only. The apex carries a small flat, because each
 * stroke has to remove a real volume and a mathematically sharp point would
 * remove none, and including that flat drags the fitted angle several degrees
 * blunt. The flank is the part that has actually converged on the cone.
 */
export function coneHalfAngle(tip, from = 0.45) {
  const { rho, mean } = tipProfile(tip);
  let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
  for (let i = 0; i < rho.length; i++) {
    if (rho[i] < from * tip.radius) continue;
    sx += rho[i]; sy += mean[i]; sxx += rho[i] * rho[i]; sxy += rho[i] * mean[i]; n++;
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  if (!(slope > 1e-6)) return 90;
  return Math.min(90, Math.atan(1 / slope) / DEG);
}

/**
 * The major axis of the flat a lead grows if it never turns: the paper cuts the
 * cylinder at the hold angle, so the ellipse is the diameter stretched by
 * 1/sin(theta). Quoted in the prose, so it lives here beside the simulation
 * that has to agree with it.
 */
export const flatMajorAxis = (diameter, holdDeg) => diameter / Math.sin(holdDeg * DEG);
