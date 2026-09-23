/* How my headphones measure my ears: the acoustic and control model.
 *
 * Pure functions, no DOM and no three.js, so every number the page shows can
 * be checked in Node (see model.test.mjs). The model is a lumped toy with
 * physically sized parts, not Bose's plant. Its job is to reproduce the
 * mechanism the patents describe: a multitone chime, a driver-to-microphone
 * response G_sd that depends on the wearer, and a feedback filter retuned so
 * that the loop gain G_sd * K_fb returns to its designed target.
 */

// ---------- constants ----------
export const C = 343;          // speed of sound, m/s
export const RHO = 1.2;        // air density, kg/m^3
export const FS = 48000;       // sample rate the chime tones are locked to
export const NFFT = 1024;      // 48000 / 1024 = 46.875 Hz, the patent's fundamental
export const F0 = FS / NFFT;

// ---------- complex arithmetic on [re, im] pairs ----------
export const cx = (re, im = 0) => [re, im];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const inv = (a) => div([1, 0], a);
export const abs = (a) => Math.hypot(a[0], a[1]);
export const arg = (a) => Math.atan2(a[1], a[0]);
export const db = (a) => 20 * Math.log10(Math.max(1e-12, abs(a)));
export const expj = (phi) => [Math.cos(phi), Math.sin(phi)];
const csin = (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
const ccos = (z) => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])];

// ---------- the chime ----------
/* US 10,937,410: ten or more tones between about 45 Hz and 16 kHz, built on a
 * 46.875 Hz fundamental. The patent's example spectrum lists 24 tones: 93.75,
 * 187.5, 281.25, 375, 562.5, 750 and 843.75 Hz, then 1031.3 Hz up to 16969 Hz
 * at a quarter octave or closer. Every one is an exact multiple of 46.875 Hz,
 * which is 48 kHz over a 1024 point FFT: each tone sits in the centre of one
 * FFT bin, so one transform reads the response at every tone with no spectral
 * leakage. The stand-in chime on the page plays exactly this list. */
const BINS = [2, 4, 6, 8, 12, 16, 18, 22, 26, 32, 38, 46, 54, 64, 76, 90, 108, 128, 152, 182, 216, 256, 304, 362];
export const CHIME = BINS.map((b) => b * F0);
export const PATENT_TONES = [93.75, 187.5, 281.25, 375, 562.5, 750, 843.75, 1031.25, 1218.75, 1500, 1781.25, 2156.25, 2531.25, 3000, 3562.5, 4218.75, 5062.5, 6000, 7125, 8531.25, 10125, 12000, 14250, 16968.75];

/** One period of the chime (NFFT samples) with Schroeder phases so the crest factor stays low. */
export function chimePeriod(n = NFFT) {
  const out = new Float32Array(n);
  const K = BINS.length;
  BINS.forEach((b, k) => {
    const ph = -Math.PI * k * k / K;               // Schroeder phase
    const amp = 1 / Math.sqrt(1 + (b * F0 / 3000) ** 2) + 0.15; // softer highs, it has to sound pleasant
    for (let i = 0; i < n; i++) out[i] += amp * Math.cos(2 * Math.PI * b * i / n + ph);
  });
  let m = 0; for (const v of out) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < n; i++) out[i] /= m;
  return out;
}

// ---------- form factors ----------
/* Over-ear: a big front cavity (cup plus the air round the pinna) with the
 * feedback microphone in the cup; the canal hangs off it. Earbud: the tip sits
 * in the canal, the front cavity is the nozzle, and the microphone looks
 * straight down the canal, so the canal is most of what it hears. */
export const FORMS = {
  overear: {
    label: 'Over-ear',
    V: 120e-6,             // front cavity, m^3
    Sd: 1.0e-3, md: 4e-4, ks: 300, Qd: 0.55,   // 40 mm driver
    leakMax: 40e-6, leakLen: 0.010, leakBase: 0.6e-6,  // cushion leak: up to 40 mm^2 (a glasses arm)
    insert: 0,             // nothing enters the canal
    fc: 1300,              // designed loop-gain crossover, Hz
    eqCentres: [60, 120, 250, 600, 1300],
  },
  earbud: {
    label: 'Earbud',
    V: 0.35e-6,            // nozzle and tip volume
    Sd: 7.9e-5, md: 3e-5, ks: 120, Qd: 0.6,     // 10 mm driver
    leakMax: 4e-6, leakLen: 0.004, leakBase: 0.03e-6,  // tip leak: up to 4 mm^2
    insert: 0.007,         // the tip takes up the first 7 mm of canal
    fc: 1900,
    eqCentres: [250, 600, 1300, 2600, 4500],
  },
};

export const CANAL_R = 3.75e-3;             // canal radius, m (7.5 mm diameter)
export const CANAL_S = Math.PI * CANAL_R ** 2;
export const NOMINAL = { L: 0.025, leak: 0.1 }; // the ear the product was tuned on
const LOSS = 0.035;                         // canal wall and eardrum loss, as a fraction of k
const DELAY = 40e-6;                        // acoustic path plus converter latency, s

/** Leak area in m^2 for a 0..1 slider. Quadratic so small leaks get resolution. */
export const leakArea = (form, x) => form.leakBase + form.leakMax * x * x;

/* Acoustic impedances (Pa s / m^3). */
function zCavity(w, V) { return inv([0, w * V / (RHO * C * C)]); }
function zLeak(w, A, len) {
  const M = RHO * (len + 0.85 * Math.sqrt(A / Math.PI)) / A;     // slit mass with end correction
  const R = 0.025 * RHO * C / A;                             // viscous and radiation loss, lumped
  return [R, w * M];
}
function kLossy(w) { return [w / C, -LOSS * w / C]; }
/** Input impedance of a lossy tube of length l closed at the eardrum. */
function zCanal(w, l) {
  const z0 = RHO * C / CANAL_S;
  const kl = mul(kLossy(w), [l, 0]);
  // -j z0 cot(kl)
  const cot = div(ccos(kl), csin(kl));
  return mul([0, -z0], cot);
}

/**
 * Driver-to-microphone response G_sd, and the eardrum response G_ed, at f Hz,
 * for canal length L (m) and leak slider x (0..1). Both are normalised so the
 * nominal ear reads 0 dB at 200 Hz in each form factor.
 */
export function responses(form, f, L, x) {
  const w = 2 * Math.PI * f;
  const A = leakArea(form, x);
  const lres = Math.max(0.004, L - form.insert);
  // Driver: a mass on a spring, with the trapped air adding stiffness.
  const kair = RHO * C * C * form.Sd * form.Sd / (form.V + CANAL_S * lres);
  const k = form.ks + kair;
  const w0 = Math.sqrt(k / form.md);
  const Rm = form.md * w0 / form.Qd;
  const zm = [Rm, w * form.md - form.ks / w];               // driver's own mechanical impedance
  // Volume velocity into the front: U = F Sd / (zm + Sd^2 Z_front), F = 1
  const zc = zCavity(w, form.V);
  const zl = zLeak(w, A, form.leakLen);
  const zt = zCanal(w, lres);
  const zpar = inv(add(add(inv(zc), inv(zl)), inv(zt)));
  const zmech = add(zm, mul([form.Sd * form.Sd, 0], zpar));
  const U = div([form.Sd, 0], zmech);
  const p = mul(U, zpar);                                    // pressure at the microphone
  const gsd = mul(p, expj(-w * DELAY));
  const ped = div(p, ccos(mul(kLossy(w), [lres, 0])));      // pressure at the eardrum
  return { gsd, ged: ped };
}

const normCache = new Map();
function norm(form) {
  if (!normCache.has(form)) {
    const r = responses(form, 200, NOMINAL.L, NOMINAL.leak);
    normCache.set(form, { sd: abs(r.gsd), ed: abs(r.ged) });
  }
  return normCache.get(form);
}
export function G(form, f, L, x) {
  const r = responses(form, f, L, x);
  const n = norm(form);
  return { gsd: mul(r.gsd, [1 / n.sd, 0]), ged: mul(r.ged, [1 / n.ed, 0]) };
}

// ---------- the designed loop ----------
/* Target loop gain: about 30 dB of feedback at low frequency, a single pole
 * roll-off so the slope is near -20 dB per decade at crossover, a second pole
 * well above it, and the fixed delay. The patent's figures are a crossover of
 * 1.5 kHz or more and about 45 degrees of phase at crossover. */
export function loopTarget(form, f) {
  const f1 = form.fc / 31.6;
  const p1 = inv([1, f / f1]);
  const p2 = inv([1, f / 9000]);
  const hp = div([0, f / 12], [1, f / 12]);                 // no gain at DC
  return mul(mul(mul([31.6, 0], p1), mul(p2, hp)), expj(-2 * Math.PI * f * DELAY));
}

/** Peaking biquad (analogue prototype), gain g dB at centre fc, quality q. */
export function peaking(f, fc, g, q = 0.9) {
  const A = Math.pow(10, g / 40);
  const s = [0, f / fc];                                    // normalised s = j f / fc
  const s2 = mul(s, s);
  const num = add(add(s2, mul(s, [A / q, 0])), [1, 0]);
  const den = add(add(s2, mul(s, [1 / (A * q), 0])), [1, 0]);
  return div(num, den);
}

// ---------- the customisation ----------
/** Chime tones inside the band a form factor customises over. */
export function bandTones(form) {
  const lo = form.eqCentres[0] * 0.6, hi = form.eqCentres.at(-1) * 1.3;
  return CHIME.filter((f) => f >= lo && f <= hi);
}

function pinv(A, lambda = 1.5) {
  // (A^T A + lambda I)^-1 A^T, small dense matrices only
  const m = A.length, n = A[0].length;
  const AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    let s = i === j ? lambda : 0; for (let r = 0; r < m; r++) s += A[r][i] * A[r][j]; return s;
  }));
  // Gauss-Jordan inverse
  const M = AtA.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= k * M[c][j]; }
  }
  const Inv = M.map((row) => row.slice(n));
  return Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, r) => {
    let s = 0; for (let k = 0; k < n; k++) s += Inv[i][k] * A[r][k]; return s;
  }));
}

const influenceCache = new Map();
/** The influence matrix: dB change at each tone per dB of each filter's gain, and its pseudo-inverse. Computed once, offline in a real product. */
export function influence(form) {
  if (!influenceCache.has(form)) {
    const tones = bandTones(form);
    const A = tones.map((f) => form.eqCentres.map((fc) => db(peaking(f, fc, 1))));
    influenceCache.set(form, { tones, A, P: pinv(A) });
  }
  return influenceCache.get(form);
}

/** Deterministic small measurement noise, so re-measuring gives slightly different answers. */
export function noise(seed, i) {
  const s = Math.sin((seed + 1) * 12.9898 + i * 78.233) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 2;   // -1..1
}

/**
 * Run the noise-cancelling half of CustomTune once: the measured deviation at
 * the chime tones and the filter gains that cancel it.
 */
export function customTune(form, L, x, { seed = 0, noiseDb = 0.4 } = {}) {
  const { tones, P } = influence(form);
  // 1. measure: deviation of this ear's G_sd from the nominal, in dB, at the tones
  const dG = tones.map((f, i) => db(G(form, f, L, x).gsd) - db(G(form, f, NOMINAL.L, NOMINAL.leak).gsd) + noiseDb * noise(seed, i));
  // 2. one matrix multiply: filter gains that cancel it (subtract in log space)
  const theta = P.map((row) => Math.max(-12, Math.min(12, -row.reduce((s, a, i) => s + a * dG[i], 0))));
  return { tones, dG, theta, seed };
}

/** Compensator correction B(f) from the filter gains. */
export function correction(form, theta, f) {
  let b = [1, 0];
  form.eqCentres.forEach((fc, j) => { b = mul(b, peaking(f, fc, theta[j])); });
  return b;
}

/** Loop gain on this ear, with or without the correction. */
export function loop(form, f, L, x, theta) {
  const dG = div(G(form, f, L, x).gsd, G(form, f, NOMINAL.L, NOMINAL.leak).gsd);
  let l = mul(loopTarget(form, f), dG);
  if (theta) l = mul(l, correction(form, theta, f));
  return l;
}

/** Log-spaced frequency grid. */
export function grid(f0 = 20, f1 = 20000, n = 240) {
  const out = []; const r = Math.log(f1 / f0);
  for (let i = 0; i < n; i++) out.push(f0 * Math.exp(r * i / (n - 1)));
  return out;
}

/** Crossover (first |L| = 1 going up in frequency), phase margin in degrees, and stability. */
export function margins(form, L, x, theta) {
  const fs = grid(200, 12000, 600);
  let prev = null;
  for (const f of fs) {
    const l = loop(form, f, L, x, theta);
    const m = abs(l);
    if (prev && prev.m >= 1 && m < 1) {
      // interpolate in log f
      const t = Math.log(prev.m) / (Math.log(prev.m) - Math.log(m));
      const fc = prev.f * Math.pow(f / prev.f, t);
      const lc = loop(form, fc, L, x, theta);
      let ph = arg(lc) * 180 / Math.PI; while (ph > 0) ph -= 360;
      return { fc, pm: 180 + ph };
    }
    prev = { f, m };
  }
  return { fc: NaN, pm: NaN };
}

/** Noise reduction from the feedback loop alone, in dB (negative is quieter): 20 log10 |1 / (1 + L)|. */
export function anc(form, f, L, x, theta) {
  return -db(add([1, 0], loop(form, f, L, x, theta)));
}

/** Mean feedback noise reduction over a band, dB. */
export function ancBand(form, L, x, theta, f0 = 50, f1 = 500) {
  const fs = grid(f0, f1, 40);
  return fs.reduce((s, f) => s + anc(form, f, L, x, theta), 0) / fs.length;
}

// ---------- the EQ side: predicting the eardrum from the same microphone ----------
/* US 12,028,675 (Bose, Nielsen, priority December 2021; marked on the QC Ultra
 * Headphones) computes the personal EQ from the driver-to-feedback-microphone
 * response measured on the wearer plus laboratory data: canal-microphone
 * measurements "across multiple different people and multiple fittings", reduced
 * to two complex constants per frequency, alpha and beta, by least squares
 * through the model  G_ear = G_sd / (alpha G_sd + beta).  Rearranged, that is
 * linear: G_sd / G_ear = alpha G_sd + beta. I do the same thing here with a
 * synthetic population of ears drawn from this model. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function population(n = 160, seed = 11) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) {
    const g = Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
    const L = Math.min(0.033, Math.max(0.018, 0.025 + 0.0028 * g));
    const x = 0.8 * r() ** 2;
    out.push({ L, x });
  }
  return out;
}
const regCache = new Map();
/** alpha, beta at frequency f, fitted over the population. */
export function regression(form, f) {
  const key = form.label + ':' + f.toPrecision(6);
  if (regCache.has(key)) return regCache.get(key);
  // Least squares for y = a x + b with complex a and b, centred. The x here is
  // itself a measurement, good to a fraction of a dB, so the slope is shrunk by
  // that measurement variance (a ridge term); without it, a frequency where the
  // population barely varies gets a huge slope and amplifies noise.
  const pts = population().map((ear) => { const g = G(form, f, ear.L, ear.x); return [g.gsd, div(g.gsd, g.ged)]; });
  const n = pts.length;
  let mx = [0, 0], my = [0, 0];
  for (const [x, y] of pts) { mx = add(mx, x); my = add(my, y); }
  mx = [mx[0] / n, mx[1] / n]; my = [my[0] / n, my[1] / n];
  let sxx = 0, sxy = [0, 0];
  for (const [x, y] of pts) {
    const dx = sub(x, mx), dy = sub(y, my);
    sxx += dx[0] * dx[0] + dx[1] * dx[1];
    sxy = add(sxy, mul([dx[0], -dx[1]], dy));
  }
  const sigma = 0.07 * abs(mx);                 // about 0.6 dB of measurement scatter
  const a = [sxy[0] / (sxx + n * sigma * sigma), sxy[1] / (sxx + n * sigma * sigma)];
  const b = sub(my, mul(a, mx));
  const res = { a, b };
  regCache.set(key, res);
  return res;
}
/** Predicted eardrum response from a measured G_sd. */
export function predictEar(form, f, gsd) {
  const { a, b } = regression(form, f);
  return div(gsd, add(mul(a, gsd), b));
}
/** Playback EQ in dB: the prediction for the reference ear over the prediction
 * for this ear, so the reference ear gets no correction and every other ear is
 * moved by exactly what the microphone can tell apart. */
export function eqFor(form, f, L, x, seed = 0, noiseDb = 0) {
  let gsd = G(form, f, L, x).gsd;
  if (noiseDb) gsd = mul(gsd, [Math.pow(10, noiseDb * noise(seed + 7, Math.round(Math.log(f) * 40)) / 20), 0]);
  const d = db(predictEar(form, f, G(form, f, NOMINAL.L, NOMINAL.leak).gsd)) - db(predictEar(form, f, gsd));
  return Math.max(-10, Math.min(10, d));
}
/** Eardrum response in dB relative to the reference ear, with or without the EQ. */
export function eardrumDev(form, f, L, x, withEq, seed = 0) {
  let v = db(G(form, f, L, x).ged) - db(G(form, f, NOMINAL.L, NOMINAL.leak).ged);
  if (withEq) v += eqFor(form, f, L, x, seed);
  return v;
}
/** RMS eardrum error over 100 Hz to 8 kHz, dB. */
export function eardrumError(form, L, x, withEq, seed = 0) {
  const fs = grid(100, 8000, 48);
  return Math.sqrt(fs.reduce((s, f) => s + eardrumDev(form, f, L, x, withEq, seed) ** 2, 0) / fs.length);
}

/** Quarter-wave resonance of the canal left open to the cavity: c / 4l. */
export const quarterWave = (form, L) => C / (4 * Math.max(0.004, L - form.insert));
