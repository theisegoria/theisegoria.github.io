'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/cosmology.cjs) ----------
     Units: H0 = 1, c = 1. Time in 1/H0, distance in c/H0. Radiation neglected.
     E^2(a) = Om a^-3 + Ok a^-2 + OL,  Ok = 1 - Om - OL. */
  const H0_DEFAULT = 67.7;                     // km/s/Mpc (Planck 2018)
  const GYR_PER_HUBBLE = (H0) => 977.792 / H0; // 1/H0 in Gyr
  const MPC_PER_HUBBLE = (H0) => 299792.458 / H0; // c/H0 in Mpc
  const OR_PLANCK = 9.1e-5;                    // photons + massless neutrinos, used only where a lab says so
  const E2 = (a, Om, OL, Or = 0) => Om / (a * a * a) + (1 - Om - OL - Or) / (a * a) + OL + Or / (a * a * a * a);
  const E = (a, Om, OL, Or = 0) => Math.sqrt(Math.max(0, E2(a, Om, OL, Or)));
  const Ez = (z, Om, OL) => E(1 / (1 + z), Om, OL);
  const q0 = (Om, OL) => Om / 2 - OL;
  // acceleration equation: a'' / a = -Om a^-3 / 2 + OL (curvature drops out)
  const accel = (a, Om, OL) => a * (-0.5 * Om / (a * a * a) + OL);
  const aAccel = (Om, OL) => (OL > 0 ? Math.cbrt(Om / (2 * OL)) : NaN);

  // Simpson's rule on [lo, hi] with n (even) panels
  function simpson(f, lo, hi, n) {
    const h = (hi - lo) / n; let s = f(lo) + f(hi);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(lo + i * h);
    return s * h / 3;
  }
  // minimum of E^2 on a in [a0, a1] (log grid, then golden refinement)
  function minE2(Om, OL, a0, a1, n = 400) {
    const l0 = Math.log(a0), l1 = Math.log(a1); let best = Infinity, bi = 0;
    for (let i = 0; i <= n; i++) { const v = E2(Math.exp(l0 + (l1 - l0) * i / n), Om, OL); if (v < best) { best = v; bi = i; } }
    let lo = l0 + (l1 - l0) * Math.max(0, bi - 1) / n, hi = l0 + (l1 - l0) * Math.min(n, bi + 1) / n;
    const g = (Math.sqrt(5) - 1) / 2; let c = hi - g * (hi - lo), d = lo + g * (hi - lo), fc = E2(Math.exp(c), Om, OL), fd = E2(Math.exp(d), Om, OL);
    for (let i = 0; i < 40; i++) { if (fc < fd) { hi = d; d = c; fd = fc; c = hi - g * (hi - lo); fc = E2(Math.exp(c), Om, OL); } else { lo = c; c = d; fc = fd; d = lo + g * (hi - lo); fd = E2(Math.exp(d), Om, OL); } }
    return Math.min(best, fc, fd);
  }
  // 'bounce' (E^2 vanishes at some a < 1: no big bang), 'recollapse' (E^2 vanishes at some a > 1), or 'forever'
  function classify(Om, OL) {
    if (minE2(Om, OL, 1e-4, 1) <= 0) return 'bounce';
    if (OL < 0) return 'recollapse';
    if (minE2(Om, OL, 1, 1e4) <= 0) return 'recollapse';
    return 'forever';
  }
  // the two boundaries in the (Om, OL) plane, by bisection on OL (E^2 is monotone in OL on each side of a = 1)
  function bounceBoundary(Om) { let lo = 0, hi = 6; for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (minE2(Om, m, 1e-4, 1) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; }
  function recollapseBoundary(Om) { if (Om <= 1) return 0; let lo = 0, hi = 3; for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (minE2(Om, m, 1, 1e4) <= 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  // closed forms (Carroll, Press and Turner 1992), for checking
  const bounceClosed = (Om) => (Om <= 0 ? 1 : Om < 0.5 ? 4 * Om * Math.cosh(Math.acosh((1 - Om) / Om) / 3) ** 3 : 4 * Om * Math.cos(Math.acos((1 - Om) / Om) / 3) ** 3);
  const recollapseClosed = (Om) => (Om <= 1 ? 0 : 4 * Om * Math.cos(Math.acos((1 - Om) / Om) / 3 + 4 * Math.PI / 3) ** 3);

  // age t0 = int₀^1 da / (a E), with a = u^2 to remove the a -> 0 behaviour
  function age(Om, OL) {
    if (classify(Om, OL) === 'bounce') return NaN;
    return simpson((u) => (u <= 0 ? 0 : 2 / (u * E(u * u, Om, OL))), 0, 1, 2000);
  }
  // a(t) by RK4 on the second-order system (a, adot), from a = 1, adot = 1 at t = 0; forward to tMax or a crunch, backward to a -> 0 or a bounce
  function trajectory(Om, OL, tMax = 2.8, tMin = -2.8) {
    const f = (a, v) => [v, accel(a, Om, OL)];
    const run = (dir) => {
      const out = [[0, 1, 1]]; let t = 0, a = 1, v = 1;
      for (let i = 0; i < 200000; i++) {
        const dt = dir * Math.min(0.002, 0.03 * a / Math.max(1e-9, Math.abs(v)), 0.02 / Math.max(1e-9, Math.abs(accel(a, Om, OL))));
        const k1 = f(a, v), k2 = f(a + 0.5 * dt * k1[0], v + 0.5 * dt * k1[1]), k3 = f(a + 0.5 * dt * k2[0], v + 0.5 * dt * k2[1]), k4 = f(a + dt * k3[0], v + dt * k3[1]);
        a += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6; v += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6; t += dt;
        if (a <= 1e-3) { const rem = (2 / 3) * Math.pow(a, 1.5) / Math.sqrt(Math.max(Om, 1e-12)); out.push([t + (dir > 0 ? rem : -rem), 0, v]); return out; }
        out.push([t, a, v]);
        if (a > 12 || (dir > 0 && t >= tMax) || (dir < 0 && t <= tMin)) return out;
      }
      return out;
    };
    const back = run(-1), fwd = run(1);
    const pts = back.slice(1).reverse().concat(fwd);
    const crunch = fwd[fwd.length - 1][1] === 0 ? fwd[fwd.length - 1][0] : null;
    const bang = back[back.length - 1][1] === 0 ? -back[back.length - 1][0] : null;
    let amin = null; if (bang === null) { let m = Infinity; for (const p of back) if (p[1] < m) m = p[1]; amin = m; }
    return { pts, crunch, bang, amin };
  }
  // where adot is minimal (a'' = 0) on the trajectory, refined by a parabola through three samples
  function accelOnset(traj) {
    const p = traj.pts; let k = -1, m = Infinity;
    for (let i = 1; i < p.length - 1; i++) if (p[i][1] > 0 && p[i][2] < m) { m = p[i][2]; k = i; }
    if (k < 1 || p[k - 1][1] === 0 || p[k + 1][1] === 0) return null;
    const [t0, a0, v0] = p[k - 1], [t1, a1, v1] = p[k], [t2, a2, v2] = p[k + 1];
    const d = (v0 - 2 * v1 + v2); if (Math.abs(d) < 1e-15) return { t: t1, a: a1 };
    const s = 0.5 * (v0 - v2) / d; // offset in units of the local step
    return { t: t1 + s * (s > 0 ? t2 - t1 : t1 - t0), a: a1 + s * (s > 0 ? a2 - a1 : a1 - a0) };
  }

  // distances: comoving Dc(z) = int₀^z dz / E, transverse DM by S_k, lookback t_L = int dz / ((1+z) E), on a grid
  function distanceTable(Om, OL, zMax = 10, n = 1000) {
    const Ok = 1 - Om - OL, z = new Float64Array(n + 1), DC = new Float64Array(n + 1), DM = new Float64Array(n + 1), TL = new Float64Array(n + 1);
    const h = zMax / n; let c = 0, tl = 0, fp = 1 / Ez(0, Om, OL), gp = fp;
    let m = n + 1;
    for (let i = 1; i <= n; i++) {
      const zi = i * h, zm = zi - h / 2;
      if (E2(1 / (1 + zi), Om, OL) <= 0 || E2(1 / (1 + zm), Om, OL) <= 0) { m = i; break; }
      const fm = 1 / Ez(zm, Om, OL), fi = 1 / Ez(zi, Om, OL);
      c += h * (fp + 4 * fm + fi) / 6; tl += h * (gp + 4 * fm / (1 + zm) + fi / (1 + zi)) / 6;
      z[i] = zi; DC[i] = c; TL[i] = tl; DM[i] = transverse(c, Ok); fp = fi; gp = fi / (1 + zi);
    }
    return { z: z.subarray(0, m), DC: DC.subarray(0, m), DM: DM.subarray(0, m), TL: TL.subarray(0, m), Ok, zBreak: m <= n ? m * h : null };
  }
  function transverse(DC, Ok) { const s = Math.sqrt(Math.abs(Ok)); if (Ok > 1e-9) return Math.sinh(s * DC) / s; if (Ok < -1e-9) return Math.sin(s * DC) / s; return DC; }
  const comoving = (z, Om, OL) => simpson((x) => 1 / Ez(x, Om, OL), 0, z, 400);
  const lookback = (z, Om, OL) => simpson((x) => 1 / ((1 + x) * Ez(x, Om, OL)), 0, z, 400);
  const DL = (z, Om, OL) => (1 + z) * transverse(comoving(z, Om, OL), 1 - Om - OL);
  const DA = (z, Om, OL) => transverse(comoving(z, Om, OL), 1 - Om - OL) / (1 + z);
  // the redshift where DA is largest (golden section on [0.2, 6])
  function zDAmax(Om, OL, top = 6) {
    let lo = 0.2, hi = top; const g = (Math.sqrt(5) - 1) / 2; let c = hi - g * (hi - lo), d = lo + g * (hi - lo), fc = -DA(c, Om, OL), fd = -DA(d, Om, OL);
    for (let i = 0; i < 60; i++) { if (fc < fd) { hi = d; d = c; fd = fc; c = hi - g * (hi - lo); fc = -DA(c, Om, OL); } else { lo = c; c = d; fc = fd; d = lo + g * (hi - lo); fd = -DA(d, Om, OL); } }
    return (lo + hi) / 2;
  }
  const interp = (xs, ys, x) => { let lo = 0, hi = xs.length - 1; if (x <= xs[0]) return ys[0]; if (x >= xs[hi]) return ys[hi]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; } const u = (x - xs[lo]) / (xs[hi] - xs[lo]); return ys[lo] + u * (ys[hi] - ys[lo]); };

  // conformal time: tables of t(a) and eta(a) on a log grid, eta = int da / (a^2 E), t = int da / (a E)
  function conformalTable(Om, OL, Or = 0, aMax = 1e4, n = 8000) {
    const a0 = Or > 0 ? 1e-8 : 1e-6, s0 = Math.log(a0), s1 = Math.log(aMax), h = (s1 - s0) / n;
    const lnA = new Float64Array(n + 1), T = new Float64Array(n + 1), ETA = new Float64Array(n + 1), HS = new Float64Array(n + 1);
    // start: matter dominated, t = (2/3) a^{3/2} / sqrt(Om), eta = 2 sqrt(a) / sqrt(Om); or radiation dominated, t = a^2 / (2 sqrt(Or)), eta = a / sqrt(Or)
    const sOm = Math.sqrt(Math.max(Om, 1e-12));
    let t = Or > 0 ? a0 * a0 / (2 * Math.sqrt(Or)) : (2 / 3) * Math.pow(a0, 1.5) / sOm, eta = Or > 0 ? a0 / Math.sqrt(Or) : 2 * Math.sqrt(a0) / sOm;
    const ft = (s) => { const a = Math.exp(s); return 1 / E(a, Om, OL, Or); }, fe = (s) => { const a = Math.exp(s); return 1 / (a * E(a, Om, OL, Or)); };
    lnA[0] = s0; T[0] = t; ETA[0] = eta; HS[0] = 1 / (a0 * E(a0, Om, OL, Or));
    let ftp = ft(s0), fep = fe(s0), broken = -1;
    for (let i = 1; i <= n; i++) {
      const s = s0 + i * h, sm = s - h / 2, a = Math.exp(s);
      if (E2(a, Om, OL, Or) <= 0) { broken = i; break; }
      const fti = ft(s), fei = fe(s); t += h * (ftp + 4 * ft(sm) + fti) / 6; eta += h * (fep + 4 * fe(sm) + fei) / 6;
      lnA[i] = s; T[i] = t; ETA[i] = eta; HS[i] = 1 / (a * E(a, Om, OL, Or)); ftp = fti; fep = fei;
    }
    const m = broken < 0 ? n + 1 : broken;
    const tab = { lnA: lnA.subarray(0, m), T: T.subarray(0, m), ETA: ETA.subarray(0, m), HS: HS.subarray(0, m), Om, OL, Or };
    const i0 = Math.round(-s0 / h); tab.t0 = T[i0]; tab.eta0 = ETA[i0];
    // eta_inf: finite when the tail beyond a = 1e3 has converged; then add the de Sitter remainder 1/(aMax sqrt(OL))
    const i3 = Math.round((Math.log(1e3) - s0) / h);
    if (broken >= 0) { tab.etaInf = NaN; tab.finite = false; }
    else if (ETA[n] - ETA[i3] < 5e-3 && OL > 0) { tab.etaInf = ETA[n] + 1 / (aMax * Math.sqrt(OL)); tab.finite = true; }
    else { tab.etaInf = Infinity; tab.finite = false; }
    tab.etaOfA = (a) => interp(tab.lnA, tab.ETA, Math.log(a));
    tab.tOfA = (a) => interp(tab.lnA, tab.T, Math.log(a));
    tab.aOfT = (tt) => Math.exp(interp(tab.T, tab.lnA, tt));
    tab.etaOfT = (tt) => interp(tab.T, tab.ETA, tt);
    tab.aOfEta = (e) => Math.exp(interp(tab.ETA, tab.lnA, e));
    tab.tOfEta = (e) => interp(tab.ETA, tab.T, e);
    return tab;
  }
  const particleHorizon = (tab, eta) => eta;                       // chi_p = eta (c = 1)
  const eventHorizon = (tab, eta) => (tab.finite ? tab.etaInf - eta : Infinity);
  const hubbleSphere = (a, Om, OL, Or = 0) => 1 / (a * E(a, Om, OL, Or));     // chi_H = c / (a H)
  const COSMOS = [{ Om: 0.31, OL: 0.69, Or: OR_PLANCK }, { Om: 1, OL: 0, Or: 0 }, { Om: 0.001, OL: 1, Or: 0 }];

  (window.LabModels = window.LabModels || {})['cosmology'] = { H0_DEFAULT, OR_PLANCK, GYR_PER_HUBBLE, MPC_PER_HUBBLE, E2, E, Ez, q0, accel, aAccel, simpson, minE2, classify, bounceBoundary, recollapseBoundary, bounceClosed, recollapseClosed, age, trajectory, accelOnset, distanceTable, transverse, comoving, lookback, DL, DA, zDAmax, conformalTable, particleHorizon, eventHorizon, hubbleSphere, COSMOS };

  if (!L.fig) return; // model-only load (checks)
  const Tr = L.T, fmt = L.fmt;
  const GYR = GYR_PER_HUBBLE(H0_DEFAULT), GLY = GYR; // c/H0 in Gly equals 1/H0 in Gyr
  const gyr = (x, d = 2) => fmt(x * GYR, d);

  /* ---------- 1. the Friedmann equation ---------- */
  let BOUND = null;
  const boundaries = () => {
    if (BOUND) return BOUND;
    const n = 90, Om = L.seq(n + 1, (i) => 3 * i / n);
    BOUND = { bounce: Om.map((o) => [o, bounceBoundary(o)]), recollapse: Om.map((o) => [o, recollapseBoundary(o)]) };
    return BOUND;
  };
  D['friedmann'] = {
    render(ctx, v) {
      const Om = v.om, OL = v.ol, Ok = 1 - Om - OL, cls = classify(Om, OL), B = boundaries();
      const traj = trajectory(Om, OL, 40 / GYR, -40 / GYR), t0 = age(Om, OL), on = accelOnset(traj), aA = aAccel(Om, OL);
      const crunch = traj.crunch !== null ? traj.crunch : cls === 'recollapse' ? trajectory(Om, OL, 2000 / GYR, 0).crunch : null;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, Tr('The (Ωₘ, ΩΛ) plane. Drag the gold point: it is your cosmology. The lines separate flat from curved, accelerating from decelerating, and the shaded regions are the models that recollapse or never had a big bang.', '(Ωₘ, ΩΛ) 平面です。金色の点をドラッグしてください。それがあなたの宇宙モデルです。線は平坦と曲がった宇宙、加速と減速を分け、色のついた領域は再収縮する模型と、ビッグバンをもたない模型です。'));
      const f = L.fig(c1, { x: [0, 3], y: [-1, 3], aspect: 0.95, xlabel: 'Ωₘ', ylabel: 'ΩΛ', maxH: 440 });
      f.poly([...B.bounce, [3, 3.2], [0, 3.2]], { c: 'c4', fill: 'c4', fo: 0.16, w: 0, layer: 'under' });
      f.poly([[0, -1.1], [3, -1.1], ...B.recollapse.slice().reverse()], { c: 'c2', fill: 'c2', fo: 0.16, w: 0, layer: 'under' });
      f.line(B.bounce, { c: 'c4', w: 1.6 });
      f.line(B.recollapse.filter((p) => p[0] >= 1), { c: 'c2', w: 1.6 }); f.seg([0, 0], [1, 0], { c: 'c2', w: 1.6 });
      f.seg([0, 1], [3, -2], { c: 'ink', w: 1.2, dash: '5 4' });
      f.seg([0, 0], [3, 1.5], { c: 'c3', w: 1.4, dash: '2 3' });
      f.text(1.55, 2.75, Tr('no big bang (bounce)', 'ビッグバンなし（バウンス）'), { small: true, c: 'c4', anchor: 'start' });
      f.text(2.9, -0.75, Tr('recollapses', '再収縮する'), { small: true, c: 'c2', anchor: 'end' });
      f.text(1.4, 1.55, Tr('accelerating today, q₀ < 0', '現在は加速、q₀ < 0'), { small: true, c: 'c3', anchor: 'start' });
      f.text(2.9, 0.82, Tr('decelerating, q₀ > 0', '減速、q₀ > 0'), { small: true, c: 'c3', anchor: 'end' });
      f.text(0.98, 0.14, Tr('flat', '平坦'), { small: true, c: 'ink', anchor: 'start', dx: 4 });
      f.text(0.4, 1.2, Tr('closed (Ωₖ < 0)', '閉じた宇宙（Ωₖ < 0）'), { small: true, c: 'muted', anchor: 'start' });
      f.text(1.2, -0.42, Tr('open (Ωₖ > 0)', '開いた宇宙（Ωₖ > 0）'), { small: true, c: 'muted', anchor: 'start' });
      [[1, 0, 'EdS'], [0, 0, Tr('empty', '空')], [0.31, 0.69, 'ΛCDM']].forEach(([x, y, s]) => { f.dot(x, y, { c: 'muted', r: 3.5 }); f.text(x, y, s, { small: true, c: 'muted', dx: x && !y ? -8 : 7, dy: y ? -7 : 15, anchor: x && !y ? 'end' : 'start' }); });
      f.handle(Om, OL, { c: 'hl', label: Tr('Your cosmology (Ωₘ, ΩΛ)', 'あなたの宇宙モデル (Ωₘ, ΩΛ)'), bounds: [0, 3, -1, 3], onDrag: (x, y) => { ctx.set('om', x, true); ctx.set('ol', y); } });
      f.text(Om, OL, `(${fmt(Om, 2)}, ${fmt(OL, 2)})`, { small: true, c: 'hl', dx: 12, dy: 14, anchor: 'start', layer: 'over' });

      L.h('p', 'lab-cap', c2, Tr('The scale factor a(t) for that cosmology, integrated from the Friedmann equation, with Einstein–de Sitter, the empty universe and ΛCDM for reference. Today is a = 1 at t = t₀; the orange dot is where the expansion starts accelerating.', 'その宇宙モデルのスケール因子 a(t) を、フリードマン方程式から積分したものです。参考にアインシュタイン・ド・ジッター模型、空の宇宙、ΛCDM も描いています。現在は t = t₀ の a = 1 で、橙の点は膨張が加速に転じる時刻です。'));
      const tPast = Number.isFinite(t0) ? Math.min(30, t0 * GYR * 1.08) : 30;
      const aTop = Math.min(6, Math.max(2.2, ...traj.pts.filter((p) => p[0] * GYR <= 40).map((p) => p[1]))) * 1.05;
      const g = L.fig(c2, { x: [-tPast, 40], y: [0, aTop], aspect: 0.95, xlabel: Tr('t − t₀ (Gyr)', 't − t₀（十億年）'), ylabel: 'a', maxH: 440 });
      const drawTraj = (tr, o) => g.line(tr.pts.map(([t, a]) => [t * GYR, a]), o);
      [[1, 0, Tr('EdS', 'EdS')], [0, 0, Tr('empty', '空')], [0.31, 0.69, 'ΛCDM']].forEach(([o, l, s]) => { const tr = trajectory(o, l, 40 / GYR, -40 / GYR); drawTraj(tr, { c: 'muted', w: 1, dash: '4 3', op: 0.8 }); const p = tr.pts[tr.pts.length - 1]; if (p[1] < aTop && p[0] * GYR >= 39) g.text(39.5, p[1], s, { small: true, c: 'muted', anchor: 'end', dy: -5 }); });
      g.hline(1, { c: 'muted', w: 0.8, dash: '2 3', op: 0.6, layer: 'under' });
      g.vline(0, { c: 'muted', w: 0.8, dash: '2 3', op: 0.6, layer: 'under' });
      drawTraj(traj, { c: 'c1', w: 2.8 });
      if (on && on.a > 0) { g.dot(on.t * GYR, on.a, { c: 'c2', r: 5 }); g.text(on.t * GYR, on.a, Tr('ä = 0', 'ä = 0'), { small: true, c: 'c2', dx: 8, dy: 14, anchor: 'start' }); }
      g.dot(0, 1, { c: 'hl', r: 5 }); g.text(0, 1, Tr('today', '現在'), { small: true, c: 'hl', dx: -8, dy: -8, anchor: 'end' });
      if (traj.crunch !== null) g.text(traj.crunch * GYR, 0.05, Tr('big crunch', 'ビッグクランチ'), { small: true, c: 'c1', anchor: 'end', dx: -6, dy: -4 });
      if (traj.bang !== null) g.text(-traj.bang * GYR, 0.05, Tr('big bang', 'ビッグバン'), { small: true, c: 'c1', anchor: 'start', dx: 6, dy: -4 });
      L.legend(ctx.host, [{ c: 'hl', kind: 'dot', label: Tr('your (Ωₘ, ΩΛ), and today', 'あなたの (Ωₘ, ΩΛ) と現在') }, { c: 'c1', label: Tr('a(t) from the Friedmann equation', 'フリードマン方程式による a(t)') }, { c: 'c2', kind: 'fill', label: Tr('recollapse boundary and region', '再収縮の境界と領域') }, { c: 'c4', kind: 'fill', label: Tr('no big bang', 'ビッグバンなし') }, { c: 'c3', dash: true, label: Tr('q₀ = 0, ΩΛ = Ωₘ/2', 'q₀ = 0、ΩΛ = Ωₘ/2') }, { c: 'muted', dash: true, label: Tr('flat, Ωₘ + ΩΛ = 1; reference models', '平坦、Ωₘ + ΩΛ = 1；参照モデル') }]);
      const q = q0(Om, OL);
      const future = cls === 'bounce' ? Tr(`no big bang: a never fell below ${fmt(traj.amin, 3)}`, `ビッグバンなし：a は ${fmt(traj.amin, 3)} より小さくなりません`) : cls === 'recollapse' ? (crunch !== null ? Tr(`recollapses at t − t₀ = ${gyr(crunch, 1)} Gyr`, `t − t₀ = ${gyr(crunch, 1)} 十億年で再収縮`) : Tr('recollapses after 2000 Gyr', '2 兆年より後に再収縮')) : Tr('expands forever', '永遠に膨張');
      const onsetAge = on && Number.isFinite(t0) ? t0 + on.t : NaN;
      ctx.readout([
        { k: Tr('age t₀', '年齢 t₀'), v: Number.isFinite(t0) ? `${gyr(t0)} Gyr` : Tr('undefined', '定義されません'), tone: 'key' },
        { k: 'q₀ = Ωₘ/2 − ΩΛ', v: fmt(q, 3), tone: q < 0 ? 'good' : undefined },
        { k: 'Ωₖ', v: fmt(Ok, 3) },
        { k: Tr('future', '未来'), v: future, tone: cls === 'forever' ? undefined : 'warn' },
        { k: Tr('acceleration began', '加速の開始'), v: cls === 'bounce' && aA < traj.amin ? Tr('always accelerating: no big bang', 'つねに加速：ビッグバンなし') : OL > 0 && aA < 1 ? (Number.isFinite(onsetAge) ? Tr(`a = ${fmt(aA, 3)}, z = ${fmt(1 / aA - 1, 2)}, age ${gyr(onsetAge)} Gyr`, `a = ${fmt(aA, 3)}、z = ${fmt(1 / aA - 1, 2)}、年齢 ${gyr(onsetAge)} 十億年`) : Tr(`a = ${fmt(aA, 3)}, z = ${fmt(1 / aA - 1, 2)}`, `a = ${fmt(aA, 3)}、z = ${fmt(1 / aA - 1, 2)}`)) : OL > 0 && Number.isFinite(aA) ? Tr(`not yet: at a = ${fmt(aA, 2)}`, `まだです：a = ${fmt(aA, 2)} で`) : Tr('never (ΩΛ ≤ 0)', 'なし（ΩΛ ≤ 0）') },
      ], Tr(`Radiation is neglected, so the first few tens of thousands of years are slightly wrong and t₀ is high by about 0.02 Gyr for ΛCDM. H₀ = ${H0_DEFAULT} km/s/Mpc, so 1/H₀ = ${fmt(GYR, 2)} Gyr; the age of the empty universe is exactly that.`, `放射は無視しているので、最初の数万年はわずかに不正確で、ΛCDM の t₀ は約 0.02 十億年だけ大きめに出ます。H₀ = ${H0_DEFAULT} km/s/Mpc なので 1/H₀ = ${fmt(GYR, 2)} 十億年で、空の宇宙の年齢はちょうどこの値です。`));
    },
  };

  /* ---------- 2. distances and redshift ---------- */
  D['distances'] = {
    render(ctx, v) {
      const st = ctx.state, Om = v.om, OL = v.ol, H0 = v.h0, logx = v.scale === 1;
      const key = `${Om}|${OL}`;
      if (st.key !== key) { st.tab = distanceTable(Om, OL); st.zmax = zDAmax(Om, OL, st.tab.zBreak !== null ? Math.max(0.3, st.tab.zBreak - 0.05) : 6); st.key = key; }
      const tab = st.tab, cH = MPC_PER_HUBBLE(H0) / 1000, tH = GYR_PER_HUBBLE(H0);
      st.z ??= 1; const zTop = tab.zBreak !== null ? Math.max(0.05, tab.zBreak - 0.02) : 10, z = clamp(st.z, logx ? 0.01 : 0, zTop);
      const dc = comoving(z, Om, OL), dm = transverse(dc, tab.Ok), dl = (1 + z) * dm, da = dm / (1 + z), tl = lookback(z, Om, OL);
      const daMax = DA(st.zmax, Om, OL);
      const ROD = 0.1; // Mpc: a 100 kpc galaxy
      const theta = (dz) => (dz > 0 ? ROD / (dz * cH * 1000) * 206264.806 : Infinity); // arcsec
      const X = logx ? (zz) => Math.log10(zz) : (zz) => zz;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const dcMax = tab.DC[tab.DC.length - 1] * cH, yTop = Math.max(1, dcMax * 1.25), noBang = tab.zBreak !== null;
      const zEnd = tab.z[tab.z.length - 1];
      L.h('p', 'lab-cap', c1, Tr(`Three distances to a source at redshift z. Drag the gold point. DL rises past the frame (at z = ${fmt(zEnd, noBang ? 2 : 0)} it is ${fmt((1 + zEnd) * tab.DM[tab.DM.length - 1] * cH, 0)} Gpc); DA rises, turns over at z = ${fmt(st.zmax, 2)}, and falls.`, `赤方偏移 z の天体までの三つの距離です。金色の点をドラッグしてください。DL は枠の上へ抜けます（z = ${fmt(zEnd, noBang ? 2 : 0)} で ${fmt((1 + zEnd) * tab.DM[tab.DM.length - 1] * cH, 0)} Gpc）。DA は上昇し、z = ${fmt(st.zmax, 2)} で折り返して下がります。`));
      const f = L.fig(c1, { x: logx ? [-2, 1] : [0, 10], y: [0, yTop], aspect: 0.85, xlabel: 'z', ylabel: 'Gpc', maxH: 420, ticksX: logx ? [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10']] : null });
      const series = (arr, fn) => { const out = []; for (let i = 1; i < tab.z.length; i++) { const zz = tab.z[i]; if (logx && zz < 0.01) continue; out.push([X(zz), fn(arr[i], zz)]); } return out; };
      f.line(series(tab.DM, (d, zz) => (1 + zz) * d * cH), { c: 'c4', w: 2 });
      f.line(series(tab.DC, (d) => d * cH), { c: 'c1', w: 2.4 });
      f.line(series(tab.DM, (d, zz) => d * cH / (1 + zz)), { c: 'c2', w: 2.4 });
      f.vline(X(st.zmax), { c: 'c2', w: 0.9, dash: '3 3', op: 0.6, layer: 'under' });
      f.dot(X(st.zmax), daMax * cH, { c: 'c2', r: 3.5 });
      { const right = X(st.zmax) > (logx ? -0.2 : 6); f.text(X(st.zmax), daMax * cH, Tr(`DA max, z = ${fmt(st.zmax, 2)}`, `DA 最大、z = ${fmt(st.zmax, 2)}`), { small: true, c: 'c2', dx: right ? -6 : 6, dy: -8, anchor: right ? 'end' : 'start' }); }
      f.text(X(Math.min(zEnd, logx ? 9.5 : 9.8)), Math.min(yTop * 0.94, dcMax * 1.02), 'Dc', { math: true, c: 'c1', anchor: 'end', dy: -4 });
      f.text(X(Math.min(zEnd, logx ? 9.5 : 9.8)), tab.DM[tab.DM.length - 1] * cH / (1 + zEnd), 'DA', { math: true, c: 'c2', anchor: 'end', dy: 14 });
      { let zl = 0; for (let i = 1; i < tab.z.length; i++) if ((1 + tab.z[i]) * tab.DM[i] * cH > 0.7 * yTop) { zl = tab.z[i]; break; } if (zl > (logx ? 0.02 : 0)) f.text(X(zl), 0.7 * yTop, 'DL', { math: true, c: 'c4', anchor: 'start', dx: 9, dy: 4 }); }
      f.vline(X(z), { c: 'hl', w: 1, dash: '3 3', op: 0.7, layer: 'under' });
      f.dot(X(z), dl * cH, { c: 'c4', r: 3.5 }); f.dot(X(z), dc * cH, { c: 'c1', r: 3.5 });
      f.handle(X(z), da * cH, { c: 'hl', axis: 'x', label: Tr('Redshift z', '赤方偏移 z'), bounds: [logx ? -2 : 0, X(zTop), 0, yTop], onDrag: (x) => { st.z = logx ? Math.pow(10, x) : Math.round(x * 100) / 100; ctx.redraw(); } });
      f.hover((x) => { const zz = logx ? Math.pow(10, x) : x; if (zz < 0 || zz > 10) return null; const i = Math.round(zz / 10 * 1000); if (i >= tab.z.length) return null; return { x, text: `z = ${fmt(zz, 2)}: Dc ${fmt(tab.DC[i] * cH, 2)}, DA ${fmt(tab.DM[i] * cH / (1 + zz), 2)} Gpc` }; });

      L.h('p', 'lab-cap', c2, Tr('What DA means: a galaxy 100 kpc across seen through a 60″ field. Its angular size is θ = ℓ/DA, so past the turnover galaxies look larger again, only fainter. The dashed outline is the smallest it ever looks.', 'DA の意味：差し渡し 100 kpc の銀河を 60″ の視野で見たものです。見かけの大きさは θ = ℓ/DA なので、折り返し点を越えると銀河はふたたび大きく見え、ただし暗くなります。破線は最も小さく見えるときの輪郭です。'));
      const S = L.stage(c2, { w: 100, h: 74, maxH: 300 });
      const cx = 50, cy = 36, R = 28, ppa = 2 * R / 60; // stage units per arcsec
      S.circle(cx, cy, R, { c: 'ink', w: 1, fill: 'ink', fo: 0.06 });
      for (let k = -2; k <= 2; k++) if (k) { S.seg([cx + k * 10 * ppa, cy + R + 1], [cx + k * 10 * ppa, cy + R + 3.5], { c: 'muted', w: 0.8 }); }
      S.seg([cx - 30 * ppa, cy + R + 3.5], [cx - 20 * ppa, cy + R + 3.5], { c: 'ink', w: 1.4 });
      S.text(cx - 25 * ppa, cy + R + 4.5, '10″', { small: true, c: 'ink', anchor: 'middle', dy: -3 });
      const th = Math.min(theta(da), 400), thMin = theta(daMax), tone = clamp(1 / ((1 + z) * (1 + z)), 0.06, 1);
      const ell = (t, o) => { const a = Math.min(R * 1.6, t * ppa / 2), b = a * 0.42; S.line(L.seq(73, (i) => { const u = 2 * Math.PI * i / 72; return [cx + a * Math.cos(u) * Math.cos(0.5) - b * Math.sin(u) * Math.sin(0.5), cy + a * Math.cos(u) * Math.sin(0.5) + b * Math.sin(u) * Math.cos(0.5)]; }), o); };
      ell(thMin, { c: 'c2', w: 1, dash: '2 2' });
      ell(th, { c: 'hl', w: 1.4, fill: 'hl', fo: 0.15 + 0.7 * tone });
      S.text(cx, cy - R - 4.5, Tr(`θ = ${th >= 400 ? '> 400' : fmt(th, 1)}″ at z = ${fmt(z, 2)}, flux × (1+z)⁻² = ${fmt(1 / ((1 + z) ** 2), 3)}`, `z = ${fmt(z, 2)} で θ = ${th >= 400 ? '> 400' : fmt(th, 1)}″、フラックス × (1+z)⁻² = ${fmt(1 / ((1 + z) ** 2), 3)}`), { small: true, c: 'ink', anchor: 'middle', dy: 4 });
      L.h('p', 'lab-cap', c2, Tr('Lookback time: how long the light has been travelling.', '過去を見ている時間：光が旅してきた時間です。'));
      const t0d = noBang ? NaN : age(Om, OL), tTop = noBang ? Math.ceil(tab.TL[tab.TL.length - 1] * tH) + 1.5 : Math.ceil(t0d * tH) + 1.5;
      const g = L.fig(c2, { x: logx ? [-2, 1] : [0, 10], y: [0, tTop], aspect: 0.42, xlabel: 'z', ylabel: Tr('Gyr', '十億年'), maxH: 200, ticksX: logx ? [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10']] : null });
      g.line(series(tab.TL, (t) => t * tH), { c: 'c3', w: 2.2 });
      if (!noBang) { g.hline(t0d * tH, { c: 'muted', w: 0.8, dash: '3 3', op: 0.7, layer: 'under' }); g.text(X(9.8), t0d * tH, Tr('age of the universe', '宇宙の年齢'), { small: true, c: 'muted', anchor: 'end', dy: -4 }); }
      g.dot(X(z), tl * tH, { c: 'hl', r: 4 });
      L.legend(ctx.host, [{ c: 'c1', label: Tr('comoving Dc', '共動距離 Dc') }, { c: 'c4', label: Tr('luminosity DL = (1+z) DM', '光度距離 DL = (1+z) DM') }, { c: 'c2', label: Tr('angular-diameter DA = DM/(1+z)', '角径距離 DA = DM/(1+z)') }, { c: 'c3', label: Tr('lookback time', '過去を見ている時間') }, { c: 'hl', kind: 'dot', label: Tr('the chosen z', '選んだ z') }]);
      const geom = tab.Ok > 1e-9 ? Tr('open, DM = sinh(√Ωₖ Dc)/√Ωₖ', '開いた宇宙、DM = sinh(√Ωₖ Dc)/√Ωₖ') : tab.Ok < -1e-9 ? Tr('closed, DM = sin(√|Ωₖ| Dc)/√|Ωₖ|', '閉じた宇宙、DM = sin(√|Ωₖ| Dc)/√|Ωₖ|') : Tr('flat, DM = Dc', '平坦、DM = Dc');
      ctx.readout([
        { k: 'z', v: fmt(z, 2), tone: 'key' },
        { k: 'Dc', v: `${fmt(dc * cH, 3)} Gpc` },
        { k: 'DL', v: `${fmt(dl * cH, 3)} Gpc` },
        { k: 'DA', v: `${fmt(da * cH, 3)} Gpc`, tone: 'good' },
        { k: Tr('lookback time', '過去を見ている時間'), v: `${fmt(tl * tH, 2)} Gyr` },
        { k: 'θ (100 kpc)', v: th >= 400 ? '> 400″' : `${fmt(th, 1)}″` },
        { k: Tr('DA largest at', 'DA の最大'), v: `z = ${fmt(st.zmax, 2)}, ${fmt(daMax * cH, 2)} Gpc`, tone: 'warn' },
      ], (noBang ? Tr(`These parameters give a universe with no big bang: H vanishes at z = ${fmt(tab.zBreak, 2)}, so the curves stop there. `, `このパラメータではビッグバンのない宇宙になります。z = ${fmt(tab.zBreak, 2)} で H が 0 になるので、曲線はそこで止まります。`) : '') + Tr(`Ωₖ = ${fmt(tab.Ok, 2)}: ${geom}. c/H₀ = ${fmt(cH, 2)} Gpc and 1/H₀ = ${fmt(tH, 2)} Gyr for H₀ = ${H0} km/s/Mpc. Radiation is neglected.`, `Ωₖ = ${fmt(tab.Ok, 2)}：${geom}。H₀ = ${H0} km/s/Mpc では c/H₀ = ${fmt(cH, 2)} Gpc、1/H₀ = ${fmt(tH, 2)} 十億年です。放射は無視しています。`));
    },
  };

  /* ---------- 3. horizons and light cones ---------- */
  D['horizons'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, C = COSMOS[v.model], Om = C.Om, OL = C.OL, Or = C.Or;
      if (st.key !== v.model) { st.tab = conformalTable(Om, OL, Or); st.key = v.model; }
      const tab = st.tab, eta0 = tab.eta0, t0 = tab.t0, fin = tab.finite;
      const t60 = 60 / GYR, etaTop = fin ? tab.etaInf : tab.etaOfT(t60) * 1.02;
      const Xr = etaTop * 1.02, tickT = [1, 5, 13.8, 30, 60].filter((t) => t / GYR < tab.T[tab.T.length - 1] && tab.etaOfT(t / GYR) <= etaTop);
      st.chi ??= 30 / GLY; const chi = clamp(st.chi, 0.5 / GLY, Xr);
      const cap = L.h('p', 'lab-cap', ctx.host, Tr('Comoving distance χ across, conformal time η up: light always travels at 45°. Vertical lines are galaxies at rest in the expansion, labelled by their distance today; the ticks on the right convert η to cosmic time t and scale factor a. Drag the gold galaxy along the "now" line; press Play to watch the past light cone grow from the big bang to today.', '横軸は共動距離 χ、縦軸は共形時間 η で、光はつねに 45° に進みます。縦線は膨張とともに動く銀河で、現在の距離を添えています。右端の目盛りは η を宇宙時間 t とスケール因子 a に換算したものです。金色の銀河を「現在」の線に沿ってドラッグしてください。再生を押すと、過去の光円錐がビッグバンから現在まで育っていきます。'));
      void cap;
      const yt = []; for (const t of tickT) { const y = tab.etaOfT(t / GYR) * GLY; if (Math.abs(y - eta0 * GLY) < 0.03 * etaTop * GLY) continue; if (yt.length && y - yt[yt.length - 1][0] < 0.035 * etaTop * GLY) continue; yt.push([y, `${t}`]); }
      const f = L.fig(ctx.host, { x: [-Xr * GLY, Xr * GLY], y: [0, etaTop * GLY], equal: true, xlabel: Tr('comoving distance χ (Gly)', '共動距離 χ（十億光年）'), ylabel: Tr('conformal time η (Gly)', '共形時間 η（十億光年）'), maxH: 560 });
      const compact = !!f.small;
      // comoving galaxies
      const step = Xr * GLY > 200 ? 100 : Xr * GLY > 80 ? 20 : 10;
      for (let x = -Math.floor(Xr * GLY / step) * step; x <= Xr * GLY; x += step) if (x) { f.vline(x, { c: 'muted', w: 0.7, op: 0.45, dash: false, layer: 'under' }); if (Math.abs(x) % ((compact ? 4 : 2) * step) === 0 && Math.abs(x) < Xr * GLY - step / 2) f.text(x, 0, `${Math.abs(x)}`, { small: true, c: 'muted', anchor: 'middle', dy: -4, layer: 'main' }); }
      f.vline(0, { c: 'ink', w: 1, op: 0.7, dash: false, layer: 'under' });
      if (!compact) f.text(0, etaTop * GLY * 0.62, Tr('us', '私たち'), { small: true, c: 'ink', anchor: 'start', dx: 5, layer: 'main' });
      // cosmic-time ticks on the right
      yt.forEach(([y, s]) => { f.hline(y, { c: 'muted', w: 0.6, dash: '2 4', op: 0.5, layer: 'under' }); if (compact && +s !== 1 && +s !== 30) return; const corner = y > Xr * GLY - 20; f.text(corner ? y - 4 : Xr * GLY, y, Tr(`${s} Gyr, a = ${fmt(tab.aOfT(+s / GYR), 2)}`, `${s} 十億年、a = ${fmt(tab.aOfT(+s / GYR), 2)}`), { small: true, c: 'muted', anchor: 'end', dy: y > 0.96 * etaTop * GLY ? 12 : -3, dx: -3, layer: 'main' }); });
      // particle horizon chi = eta, event horizon chi = eta_inf - eta, Hubble sphere chi = 1 / (a H)
      const nE = 200, etas = L.seq(nE + 1, (i) => etaTop * i / nE);
      const ph = etas.map((e) => [e * GLY, e * GLY]);
      f.line(ph, { c: 'c2', w: 2 }); f.line(ph.map(([x, y]) => [-x, y]), { c: 'c2', w: 2 });
      if (fin) { const eh = etas.map((e) => [(tab.etaInf - e) * GLY, e * GLY]); f.line(eh, { c: 'c4', w: 2 }); f.line(eh.map(([x, y]) => [-x, y]), { c: 'c4', w: 2 }); }
      const hs = []; for (let i = 0; i < tab.ETA.length; i += 4) { if (tab.ETA[i] > etaTop) break; hs.push([tab.HS[i] * GLY, tab.ETA[i] * GLY]); }
      f.line(hs, { c: 'c3', w: 1.8, dash: '6 3' }); f.line(hs.map(([x, y]) => [-x, y]), { c: 'c3', w: 1.8, dash: '6 3' });
      if (!compact) f.text(eta0 * GLY * 0.72, eta0 * GLY * 0.72, Tr('particle horizon', '粒子的地平線'), { small: true, c: 'c2', anchor: 'start', dx: 6, dy: 12, layer: 'main' });
      if (fin && !compact) f.text(-(tab.etaInf - eta0 * 0.35) * GLY, eta0 * 0.35 * GLY, Tr('event horizon', '事象の地平線'), { small: true, c: 'c4', anchor: 'end', dx: -6, dy: 12, layer: 'main' });
      if (!compact) { const yl = 0.87 * etaTop * GLY; let k = hs.findIndex((q) => q[1] >= yl); if (k < 0) k = hs.length - 1; f.text(hs[k][0], hs[k][1], Tr('Hubble sphere', 'ハッブル球'), { small: true, c: 'c3', anchor: 'start', dx: 6, dy: 4, layer: 'main' }); }
      // the dragged galaxy: worldline, its light emitted today, and the emission event we see today
      const chiG = chi * GLY, reach = fin ? chi < tab.etaInf - eta0 : true, etaArr = eta0 + chi;
      f.vline(chiG, { c: 'hl', w: 2, op: 0.9, dash: false, layer: 'under' });
      if (reach && etaArr <= etaTop) { f.seg([chiG, eta0 * GLY], [0, etaArr * GLY], { c: 'hl', w: 1.6, dash: '4 3' }); f.dot(0, etaArr * GLY, { c: 'hl', r: 4, hollow: true }); }
      else f.seg([chiG, eta0 * GLY], [chiG - (etaTop - eta0) * GLY, etaTop * GLY], { c: 'hl', w: 1.6, dash: '4 3' });
      if (chi < eta0) f.dot(chiG, (eta0 - chi) * GLY, { c: 'hl', r: 4 });
      f.handle(chiG, eta0 * GLY, { c: 'hl', axis: 'x', label: Tr('A galaxy at comoving distance χ', '共動距離 χ の銀河'), bounds: [0.5, Xr * GLY, 0, etaTop * GLY], onDrag: (x) => { st.chi = Math.round(x * 10) / 10 / GLY; ctx.redraw(); } });
      // animated "now": the past light cone from (0, eta_now)
      const DUR = 6;
      const frame = (u) => {
        f.clear('over');
        const tn = t0 * clamp(u, 0.003, 1), en = tab.etaOfT(tn), an = tab.aOfT(tn), y = en * GLY;
        f.poly([[-y, 0], [0, y], [y, 0]], { c: 'c1', fill: 'c1', fo: 0.1, w: 0, layer: 'over' });
        f.seg([-y, 0], [0, y], { c: 'c1', w: 2.2, layer: 'over' }); f.seg([0, y], [y, 0], { c: 'c1', w: 2.2, layer: 'over' });
        f.hline(y, { c: 'ink', w: 1, dash: '3 3', op: 0.8, layer: 'over' });
        f.text(0, y, compact ? Tr(`now, t = ${fmt(tn * GYR, 1)} Gyr`, `現在、t = ${fmt(tn * GYR, 1)} 十億年`) : Tr(`now: t = ${fmt(tn * GYR, 1)} Gyr, a = ${fmt(an, 2)}`, `現在：t = ${fmt(tn * GYR, 1)} 十億年、a = ${fmt(an, 2)}`), { small: true, c: 'ink', anchor: 'middle', dy: -7, layer: 'over' });
        return tn;
      };
      frame(1);
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const u = Math.min(1, t / DUR); frame(u); lab.textContent = Tr(`t = ${fmt(u * t0 * GYR, 1)} Gyr`, `t = ${fmt(u * t0 * GYR, 1)} 十億年`); if (u >= 1) return false; }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: Tr('Play from the big bang', 'ビッグバンから再生') });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: Tr('our past light cone', '私たちの過去の光円錐') }, { c: 'c2', label: Tr('particle horizon χ = η', '粒子的地平線 χ = η') }, { c: 'c4', label: Tr('event horizon χ = η∞ − η', '事象の地平線 χ = η∞ − η') }, { c: 'c3', dash: true, label: Tr('Hubble sphere χ = c/(aH)', 'ハッブル球 χ = c/(aH)') }, { c: 'hl', label: Tr('the dragged galaxy and its light', 'ドラッグした銀河とその光') }]);
      const vrec = chi; // v/c today = chi H0 / c with a = 1
      const items = [
        { k: Tr('particle horizon today', '現在の粒子的地平線'), v: `${fmt(eta0 * GLY, 1)} Gly`, tone: 'key' },
        { k: Tr('event horizon today', '現在の事象の地平線'), v: fin ? `${fmt((tab.etaInf - eta0) * GLY, 1)} Gly` : Tr('none (η∞ = ∞)', 'なし（η∞ = ∞）'), tone: fin ? undefined : 'warn' },
        { k: Tr('Hubble radius today', '現在のハッブル半径'), v: `${fmt(hubbleSphere(1, Om, OL, Or) * GLY, 1)} Gly` },
        { k: 'η₀, η∞', v: `${fmt(eta0 * GLY, 1)} Gly, ${fin ? fmt(tab.etaInf * GLY, 1) + ' Gly' : '∞'}` },
        { k: Tr('age t₀', '年齢 t₀'), v: `${fmt(t0 * GYR, 1)} Gyr` },
        { k: Tr(`galaxy at χ = ${fmt(chiG, 1)} Gly`, `χ = ${fmt(chiG, 1)} 十億光年の銀河`), v: Tr(`recedes at ${fmt(vrec, 2)} c; light sent today ${reach ? `arrives at t = ${fmt(tab.tOfEta(Math.min(etaArr, tab.ETA[tab.ETA.length - 1])) * GYR, 0)} Gyr` : 'never arrives'}`, `後退速度 ${fmt(vrec, 2)} c、今日出た光は${reach ? ` t = ${fmt(tab.tOfEta(Math.min(etaArr, tab.ETA[tab.ETA.length - 1])) * GYR, 0)} 十億年に到着` : '決して届きません'}`), tone: reach ? 'good' : 'warn' },
      ];
      const note = v.model === 1 ? Tr('Einstein–de Sitter: η grows without bound, so there is no event horizon. Every galaxy\'s light eventually arrives, however far it is, though the wait grows like χ³.', 'アインシュタイン・ド・ジッター模型では η は際限なく増えるので、事象の地平線はありません。どんなに遠い銀河の光もいつかは届きますが、待ち時間は χ³ のように増えます。')
        : v.model === 2 ? Tr('Nearly de Sitter: a = 1 is placed at t₀, far into the Λ era, so the event horizon today sits close to the Hubble radius c/H₀ and almost nothing beyond it will ever be seen.', 'ほぼド・ジッター宇宙です。a = 1 を Λ の時代に入って久しい t₀ に置いているので、現在の事象の地平線はハッブル半径 c/H₀ のすぐ近くにあり、その外側はほとんど何も見えなくなります。')
          : Tr('ΛCDM: galaxies between 14.4 and 16 Gly today recede faster than light and yet their light emitted now still reaches us, because the Hubble sphere keeps growing and overtakes the photon. Beyond 16 Gly nothing sent today will ever arrive.', 'ΛCDM では、現在 14.4 から 16 十億光年にある銀河は光より速く後退していますが、今出た光はそれでも届きます。ハッブル球が広がり続けて光子に追いつくからです。16 十億光年より外から今日出た光は決して届きません。');
      ctx.readout(items, note);
    },
  };
})();
