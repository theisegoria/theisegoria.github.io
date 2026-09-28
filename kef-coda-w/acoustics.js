/* Acoustics for the speaker companions: pure functions, no DOM, no three.js.
 * Tested in Node by acoustics.test.mjs.  Everything here is linear acoustics
 * of ideal point sources in free space or in a rectangular room with image
 * sources.  It models interference and geometry exactly for those idealised
 * sources; it does not model driver directivity, diffraction, absorption
 * spectra, room modes or any manufacturer's DSP.
 */
export const C = 343;                                    // m/s, air at 20 C

/** Wavenumber for frequency f in Hz. */
export const k = (f) => 2 * Math.PI * f / C;

/** Complex pressure at a point from a list of monopoles.
 *  source: {p:[x,y,z], amp (Pa·m), phase (rad), delay (s)}.
 *  Returns [re, im] of the sum of amp·e^{-i(k r - phase - 2π f delay)}/r. */
export function pressureAt(sources, f, x, y, z) {
  const kk = k(f), w = 2 * Math.PI * f;
  let re = 0, im = 0;
  for (const s of sources) {
    const dx = x - s.p[0], dy = y - s.p[1], dz = z - s.p[2];
    const r = Math.max(0.02, Math.hypot(dx, dy, dz));       // 2 cm floor keeps the singularity off the raster
    let a = s.amp / r;
    if (s.dir) a *= s.dir(dx / r, dy / r, dz / r);           // optional directivity weight, 0..1
    const ph = -kk * r + (s.phase || 0) + w * (s.delay || 0);
    re += a * Math.cos(ph); im += a * Math.sin(ph);
  }
  return [re, im];
}

/** |p| in dB re 1 Pa on a plane: origin o, axes u and v (unit vectors, metres), extents ±hu, ±hv, n×n samples. */
export function fieldOnPlane(sources, f, o, u, v, hu, hv, n) {
  const out = new Float32Array(n * n);
  let max = -1e9;
  for (let j = 0; j < n; j++) {
    const tv = -hv + 2 * hv * (j / (n - 1));
    for (let i = 0; i < n; i++) {
      const tu = -hu + 2 * hu * (i / (n - 1));
      const x = o[0] + u[0] * tu + v[0] * tv, y = o[1] + u[1] * tu + v[1] * tv, z = o[2] + u[2] * tu + v[2] * tv;
      const [re, im] = pressureAt(sources, f, x, y, z);
      const db = 20 * Math.log10(Math.hypot(re, im) + 1e-12);
      out[j * n + i] = db; if (db > max) max = db;
    }
  }
  return { db: out, n, max };
}

/** Instantaneous pressure (real part at time t) on a plane, for the wave animation. */
export function waveOnPlane(sources, f, t, o, u, v, hu, hv, n) {
  const out = new Float32Array(n * n);
  const w = 2 * Math.PI * f;
  for (let j = 0; j < n; j++) {
    const tv = -hv + 2 * hv * (j / (n - 1));
    for (let i = 0; i < n; i++) {
      const tu = -hu + 2 * hu * (i / (n - 1));
      const x = o[0] + u[0] * tu + v[0] * tv, y = o[1] + u[1] * tu + v[1] * tv, z = o[2] + u[2] * tu + v[2] * tv;
      const [re, im] = pressureAt(sources, f, x, y, z);
      out[j * n + i] = re * Math.cos(w * t) - im * Math.sin(w * t);
    }
  }
  return out;
}

/** Far-field polar response in a plane: returns dB relative to the maximum, for angles (radians) measured
 *  in the plane spanned by unit vectors a (angle 0) and b (angle π/2), at radius R from the origin o. */
export function polar(sources, f, o, a, b, R = 3, nAng = 181) {
  const out = new Float32Array(nAng); let max = -1e9;
  for (let i = 0; i < nAng; i++) {
    const th = 2 * Math.PI * i / nAng;
    const x = o[0] + R * (a[0] * Math.cos(th) + b[0] * Math.sin(th)), y = o[1] + R * (a[1] * Math.cos(th) + b[1] * Math.sin(th)), z = o[2] + R * (a[2] * Math.cos(th) + b[2] * Math.sin(th));
    const [re, im] = pressureAt(sources, f, x, y, z);
    const db = 20 * Math.log10(Math.hypot(re, im) + 1e-12);
    out[i] = db; if (db > max) max = db;
  }
  for (let i = 0; i < nAng; i++) out[i] -= max;
  return out;
}

/** A ring array of N tweeters at radius r around a vertical axis at height h, each firing outward.
 *  Delay-and-sum beamforming toward azimuth `steer` (radians): every source is delayed so its wave
 *  arrives in phase along the steering direction.  `focus` in 0..1 blends between omni (equal
 *  weights, no delays: every tweeter plays the same signal) and the steered beam. */
export function tweeterRing(N, r, h, steer, focus, opts = {}) {
  const out = [];
  const su = [Math.cos(steer), Math.sin(steer)];
  const width = opts.width ?? 1.2;              // cardioid-ish tweeter directivity exponent
  for (let i = 0; i < N; i++) {
    const a = 2 * Math.PI * i / N + (opts.offset || 0);
    const px = r * Math.cos(a), pz = r * Math.sin(a);
    const outward = [Math.cos(a), Math.sin(a)];
    const proj = px * su[0] + pz * su[1];        // position along the steering direction
    // delay so that the wave from each tweeter arrives together along `steer`: sources behind wait longer
    const delay = focus * (proj - r) / C;        // ≤ 0: the front tweeter has the largest advance; negative delay = earlier
    const align = outward[0] * su[0] + outward[1] * su[1];
    const weight = (1 - focus) + focus * Math.max(0.05, 0.5 + 0.5 * align);   // taper the rear tweeters when focused
    out.push({ p: [px, h, pz], amp: weight, phase: 0, delay: -delay,
      dir: (dx, dy, dz) => { const c = dx * outward[0] + dz * outward[1]; return Math.pow(Math.max(0, 0.5 + 0.5 * c), width); } });
  }
  return out;
}

/** Image sources of a point source in a rectangular room [0,Lx]×[0,Ly]×[0,Lz] up to `order` reflections.
 *  beta = pressure reflection coefficient per wall (0..1).  Returns [{p, order, amp, delay, walls}].
 *  Standard Allen & Berkley construction. */
export function imageSources(src, L, order = 2, beta = 0.8) {
  const out = [];
  const range = [];
  for (let i = -order; i <= order; i++) range.push(i);
  for (const nx of range) for (const ny of range) for (const nz of range) {
    for (const sx of [0, 1]) for (const sy of [0, 1]) for (const sz of [0, 1]) {
      const px = (1 - 2 * sx) * src[0] + 2 * nx * L[0];   // reflections: x -> -x about x = 0, then translate by 2 n Lx
      const py = (1 - 2 * sy) * src[1] + 2 * ny * L[1];
      const pz = (1 - 2 * sz) * src[2] + 2 * nz * L[2];
      const o = Math.abs(2 * nx - sx) + Math.abs(2 * ny - sy) + Math.abs(2 * nz - sz);
      if (o > order) continue;
      if (o === 0 && (nx || ny || nz || sx || sy || sz)) continue;
      out.push({ p: [px, py, pz], order: o, amp: Math.pow(beta, o) });
    }
  }
  // dedupe (the construction lists each image once, but guard anyway)
  const seen = new Set(); const uniq = [];
  for (const s of out) { const key = s.p.map((x) => x.toFixed(6)).join(','); if (!seen.has(key)) { seen.add(key); uniq.push(s); } }
  return uniq;
}

/** Echogram at the listener: arrivals sorted by time with their pressure amplitude (1/r × beta^order). */
export function echogram(src, listener, L, order = 2, beta = 0.8) {
  const imgs = imageSources(src, L, order, beta);
  const arr = imgs.map((s) => { const r = Math.hypot(s.p[0] - listener[0], s.p[1] - listener[1], s.p[2] - listener[2]); return { t: r / C, r, amp: s.amp / r, order: s.order, p: s.p }; });
  arr.sort((a, b) => a.t - b.t);
  const direct = arr[0];
  return arr.map((a) => ({ ...a, dt: a.t - direct.t, db: 20 * Math.log10(a.amp / direct.amp) }));
}

/** The first-order reflection path off the wall that a given image source represents:
 *  the bounce point is where the segment listener -> image crosses the mirroring plane. */
export function bouncePoint(image, listener, L) {
  // find which coordinate was mirrored once: the one outside [0, L]
  for (let i = 0; i < 3; i++) {
    const c = image.p[i];
    if (c < 0 || c > L[i]) {
      const plane = c < 0 ? 0 : L[i];
      const t = (plane - listener[i]) / (c - listener[i]);
      return [0, 1, 2].map((j) => listener[j] + t * (image.p[j] - listener[j]));
    }
  }
  return null;
}

/** Two-way loudspeaker: a low-frequency source and a high-frequency source with a Linkwitz-Riley
 *  4th-order crossover at fc (two cascaded 2nd-order Butterworth sections; the LR4 sum is 0 dB and in phase on axis).
 *  Returns complex gains [reLP, imLP, reHP, imHP] at frequency f. */
export function crossover(f, fc) {
  const s = [0, f / fc];                       // jω/ωc
  // Butterworth 2nd order: H = 1 / (1 + √2 s + s²)
  const den = [1 - s[1] * s[1], Math.SQRT2 * s[1]];   // complex
  const d2 = den[0] * den[0] + den[1] * den[1];
  const lp1 = [den[0] / d2, -den[1] / d2];
  // squared (LR4)
  const lp = [lp1[0] * lp1[0] - lp1[1] * lp1[1], 2 * lp1[0] * lp1[1]];
  // HP 2nd order: H = s² / (1 + √2 s + s²);  s² = -(f/fc)²
  const num = [-s[1] * s[1], 0];
  const hp1 = [(num[0] * den[0] + num[1] * den[1]) / d2, (num[1] * den[0] - num[0] * den[1]) / d2];
  const hp = [hp1[0] * hp1[0] - hp1[1] * hp1[1], 2 * hp1[0] * hp1[1]];
  return [lp[0], lp[1], hp[0], hp[1]];
}

/** Summed response of a two-way pair at a listener: sources at pL (woofer) and pH (tweeter), each a
 *  monopole; returns dB relative to a single ideal source at the same distance as the woofer. */
export function twoWayResponse(f, fc, pL, pH, listener) {
  const [lr, li, hr, hi] = crossover(f, fc);
  const kk = k(f);
  const rL = Math.hypot(listener[0] - pL[0], listener[1] - pL[1], listener[2] - pL[2]);
  const rH = Math.hypot(listener[0] - pH[0], listener[1] - pH[1], listener[2] - pH[2]);
  const eL = [Math.cos(-kk * rL) / rL, Math.sin(-kk * rL) / rL], eH = [Math.cos(-kk * rH) / rH, Math.sin(-kk * rH) / rH];
  const re = lr * eL[0] - li * eL[1] + hr * eH[0] - hi * eH[1];
  const im = lr * eL[1] + li * eL[0] + hr * eH[1] + hi * eH[0];
  return 20 * Math.log10(Math.hypot(re, im) * rL + 1e-12);
}

/** Response map: rows = frequencies (log-spaced fLo..fHi), cols = listening angles (deg, in the vertical plane
 *  through the drivers), listener at distance R.  `sep` is the vertical separation of the sources in metres
 *  (0 = coincident).  Returns Float32Array(nF*nA) of dB. */
export function responseMap(fLo, fHi, nF, aLo, aHi, nA, fc, sep, R = 2) {
  const out = new Float32Array(nF * nA);
  const pL = [0, -sep / 2, 0], pH = [0, sep / 2, 0];
  for (let j = 0; j < nF; j++) {
    const f = fLo * Math.pow(fHi / fLo, j / (nF - 1));
    for (let i = 0; i < nA; i++) {
      const a = (aLo + (aHi - aLo) * i / (nA - 1)) * Math.PI / 180;
      const lis = [0, R * Math.sin(a), R * Math.cos(a)];
      out[j * nA + i] = twoWayResponse(f, fc, pL, pH, lis);
    }
  }
  return out;
}

/** Path-length difference and its phase for two vertically separated sources seen at angle a (rad), distance R. */
export function pathDifference(sep, a, R, f) {
  const rL = Math.hypot(R * Math.sin(a) + sep / 2, R * Math.cos(a)), rH = Math.hypot(R * Math.sin(a) - sep / 2, R * Math.cos(a));
  const d = rL - rH;
  return { d, phaseDeg: 360 * f * d / C };
}
