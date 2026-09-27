/* The bladeless fan: the flow model, as pure functions.
 *
 * Nothing here touches the page, so node --test air-multiplier/model.test.mjs
 * can check it against the published numbers before any of it is drawn.
 *
 * Units: SI throughout (metres, seconds, pascals, cubic metres a second) except
 * where a name ends in Mm or Ls.
 *
 * The chain:
 *   1. An impeller in the base (fan curve) pushes air through the slot
 *      (a sharp orifice). Where the two curves cross sets the primary flow Q0
 *      and the slot speed U0.
 *   2. The slot jet wraps the Coanda surface and leaves the ring as a thin
 *      annular sheet. Close to the ring, each piece of that sheet behaves like
 *      a plane turbulent jet and entrains air from both of its faces: the inner
 *      face can only be fed through the ring, from behind (induction); the outer
 *      face is fed from around the rim (entrainment).
 *   3. Once the sheet has swallowed the core, the flow forgets its annular
 *      origin and grows like a round jet with the same momentum flux.
 *   The crossover is where the two growth laws have equal slope, so the
 *   composite is smooth and nothing is fitted to the answer.
 */

export const RHO = 1.2;          // air, kg/m^3
export const NU = 1.5e-5;        // kinematic viscosity, m^2/s

/* Self-similar Gaussian jets. A plane jet's velocity half-width grows at about
 * 0.10 to 0.11 of the distance (Gutmark and Wygnanski 1976); a round jet's at
 * 0.094 (Hussein, Capp and George 1994). Everything else below follows from
 * conserving momentum with those two numbers. */
export const S_PLANE = 0.11;
export const S_ROUND = 0.094;
const LN2 = Math.LN2;
// plane: Q/Q0 = CP * sqrt(x/B),  um/U0 = KP * sqrt(B/x)
export const CP = Math.sqrt(Math.PI / LN2) * S_PLANE / Math.sqrt(S_PLANE * Math.sqrt(Math.PI / (2 * LN2)));
export const KP = 1 / Math.sqrt(S_PLANE * Math.sqrt(Math.PI / (2 * LN2)));
// round: Q/Q0 = CR * x / sqrt(A0)
export const CR = (Math.PI / LN2) * S_ROUND * Math.sqrt(2 * LN2 / Math.PI);

/* The fan. Dyson publishes neither the impeller's pressure nor its free flow,
 * so this curve is an assumption, a parabola chosen to pass through the one
 * operating point the patent does give: about 27 l/s through a 1.3 mm slot on
 * a 350 mm loop (Gammack, Nicolas and Simmonds 2012). Fan laws scale it with
 * speed: pressure as speed squared, flow as speed. */
export const FAN = { dpMax: 400, qMax: 0.040 };
export const CD = 1.0;           // slot discharge coefficient (a rounded entry)

export const DEFAULTS = { speed: 1, slotMm: 1.3, diameterMm: 350, x: 1.0 };

/** Primary operating point: the fan curve meets the slot's resistance. */
export function operatingPoint(speed, slotMm, diameterMm) {
  const B = slotMm / 1000, D = diameterMm / 1000;
  const L = Math.PI * D;                 // slot length: the loop's circumference
  const A0 = B * L;
  const dpMax = FAN.dpMax * speed * speed, qMax = FAN.qMax * speed;
  if (speed <= 0) return { B, D, L, A0, Q0: 0, U0: 0, dp: 0, M0: 0, power: 0, Re: 0 };
  // dp_fan = dpMax (1 - (Q/qMax)^2);  dp_slot = rho/2 (Q / (CD A0))^2
  const k = RHO / (2 * CD * CD * A0 * A0);
  const Q0 = Math.sqrt(dpMax / (k + dpMax / (qMax * qMax)));
  const U0 = Q0 / A0;
  const dp = k * Q0 * Q0;
  return { B, D, L, A0, Q0, U0, dp, M0: RHO * U0 * U0 * A0, power: Q0 * dp, Re: U0 * B / NU };
}

/** Where the annular sheet hands over to a round jet: equal growth slopes. */
export function crossover(B, D) {
  const A0 = B * Math.PI * D;
  return (CP / (2 * CR)) ** 2 * A0 / B;       // = 1.036 * pi * D, whatever the slot
}

/** Total volume flow at distance x downstream of the trailing edge, as a multiple of Q0. */
export function ratio(x, B, D) {
  if (x <= 0) return 1;
  const A0 = B * Math.PI * D;
  const xs = crossover(B, D);
  const plane = (xx) => Math.max(1, CP * Math.sqrt(xx / B));
  if (x <= xs) return plane(x);
  return plane(xs) + CR * (x - xs) / Math.sqrt(A0);
}

/** Peak (time-averaged) jet speed at x, as a multiple of U0. Used for the
 *  particle speeds; beyond the crossover it decays as 1/x from where the
 *  sheet left off, which keeps it continuous. */
export function peakSpeed(x, B, D) {
  if (x <= 0) return 1;
  const xs = crossover(B, D);
  const plane = (xx) => Math.min(1, KP * Math.sqrt(B / xx));
  return x <= xs ? plane(x) : plane(xs) * xs / x;
}

/** Everything the page reports, for one setting of the controls. */
export function solve({ speed, slotMm, diameterMm, x }) {
  const op = operatingPoint(speed, slotMm, diameterMm);
  const xs = crossover(op.B, op.D);
  const r = ratio(x, op.B, op.D);
  const Q = op.Q0 * r;
  // Inside the crossover the sheet entrains equally from both faces, so half of
  // what it has gathered came through the ring. After it, the core is full and
  // every further litre comes from around the outside.
  const rCore = ratio(Math.min(x, xs), op.B, op.D);
  const induced = op.Q0 * (rCore - 1) / 2;
  const entrained = Q - op.Q0 - induced;
  // mean speed of the air drawn through the open centre of the ring
  const Rin = op.D / 2;
  const throughSpeed = induced / (Math.PI * Rin * Rin);
  return {
    ...op, x, xs, ratio: r, Q, induced, entrained, throughSpeed,
    share: Q > 0 ? { primary: op.Q0 / Q, induced: induced / Q, entrained: entrained / Q } : { primary: 1, induced: 0, entrained: 0 },
    peak: op.U0 * peakSpeed(x, op.B, op.D),
  };
}

/** Sample Q(x)/Q0 for the chart. */
export function curve(slotMm, diameterMm, xMax = 3, n = 121) {
  const B = slotMm / 1000, D = diameterMm / 1000;
  const out = [];
  for (let i = 0; i < n; i++) { const x = (xMax * i) / (n - 1); out.push([x, ratio(x, B, D)]); }
  return out;
}

/** Slot width that maximises jet momentum for this fan: the slot's resistance
 *  matched to the fan, where the slot takes half the shut-off pressure. */
export function bestSlotMm(diameterMm) {
  const aMatch = FAN.qMax / CD * Math.sqrt(RHO / (2 * FAN.dpMax));   // A0 at dp_slot = dpMax/2
  return aMatch / (Math.PI * diameterMm / 1000) * 1000;
}

/* ------------------------------------------------------------------ profile
 * The loop's cross-section, in (u, v): u along the axis from the nose (m),
 * v radial from the slot's radius, positive outward. A thick rounded rear
 * holds the plenum; the slot opens on the inside; a convex Coanda surface
 * turns the sheet, then a straight diffuser flares outward at 15 degrees to
 * the trailing edge, the angle the patent prefers. One closed polygon: the
 * wall material, with the plenum and slot passage cut in from the inside. */
/** Centripetal-free, uniform Catmull-Rom through the points, n steps a span. */
function catmull(P, n) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}

export const PROFILE = { chord: 0.09, coandaR: 0.010, diffuserDeg: 15, startDeg: -60 };

export function profile(slotMm = 1.3) {
  const B = slotMm / 1000;
  const { chord, coandaR: rc, diffuserDeg, startDeg } = PROFILE;
  const d2r = Math.PI / 180;
  // S2: the downstream lip of the slot, the start of the Coanda surface
  const S2 = [0.0149, -0.0041];
  const th0 = startDeg * d2r, th1 = diffuserDeg * d2r;
  const C = [S2[0] - rc * Math.sin(th0), S2[1] + rc * Math.cos(th0)];
  const arcAt = (th) => [C[0] + rc * Math.sin(th), C[1] - rc * Math.cos(th)];
  const nrm = [Math.sin(th0), -Math.cos(th0)];      // away from the surface
  const S1 = [S2[0] + B * nrm[0], S2[1] + B * nrm[1]]; // upstream lip
  const E = arcAt(th1);
  const TE = [chord, E[1] + (chord - E[0]) * Math.tan(th1)];
  // plenum: an ellipse inside the thick rear
  const pc = [0.021, 0.0125], pr = [0.011, 0.0092];
  const ell = (deg) => [pc[0] + pr[0] * Math.cos(deg * d2r), pc[1] + pr[1] * Math.sin(deg * d2r)];
  const pts = [];
  // outer skin, trailing edge forward to the nose, then under to the lip
  const top = [[0.075, TE[1] + 0.009], [0.06, TE[1] + 0.016], [0.045, 0.029], [0.032, 0.031], [0.02, 0.030],
    [0.011, 0.026], [0.005, 0.020], [0.0015, 0.013], [0, 0.006], [0.0012, -0.0005], [0.0045, -0.0065], [0.0085, -0.0105]];
  pts.push(...catmull([TE, ...top, [S1[0] - 0.0012, S1[1] - 0.0045]], 5), S1);
  // up the slot passage (converging toward the slot) into the plenum, round it
  // clockwise so the plenum stays outside the wall, and back down to S2
  for (let a = 205; a >= -110; a -= 7.5) pts.push(ell(a));
  pts.push(S2);
  // the Coanda surface, then the diffuser (the TE closes the polygon)
  for (let i = 1; i <= 12; i++) pts.push(arcAt(th0 + (th1 - th0) * i / 12));
  for (let i = 1; i < 6; i++) { const f = i / 6; pts.push([E[0] + (TE[0] - E[0]) * f, E[1] + (TE[1] - E[1]) * f]); }
  // the path a parcel of primary air takes: plenum centre, down the passage,
  // out of the slot, along the surface a slot-width off it, off the edge
  const mid = [(S1[0] + S2[0]) / 2, (S1[1] + S2[1]) / 2];
  const path = [pc, [(ell(205)[0] + ell(250)[0]) / 2, (ell(205)[1] + ell(250)[1]) / 2], mid];
  for (let i = 1; i <= 12; i++) {
    const th = th0 + (th1 - th0) * i / 12, p = arcAt(th);
    const off = B / 2 + 0.0006 * i / 12;
    path.push([p[0] + off * Math.sin(th), p[1] - off * Math.cos(th)]);
  }
  const off = B / 2 + 0.0015;
  path.push([TE[0] + off * Math.sin(th1), TE[1] - off * Math.cos(th1)]);
  return { pts, S1, S2, C, E, TE, plenum: { c: pc, r: pr }, path, vMin: C[1] - rc };
}
