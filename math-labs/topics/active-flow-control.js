'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = PI / 180;

  /* ---------------- models (no DOM) ----------------
   * 1. Thin-aerofoil jet-flap theory (Spence 1956) for a jet blown from the trailing edge at deflection tau to the
   *    chord, through the interpolation formulas of Williams, Butler & Wood (ARC R&M 3304, 1962):
   *      dCL/dtau = [4 pi Cmu (1 + 0.151 Cmu^1/2 + 0.139 Cmu)]^1/2,  dCL/dalpha = 2 pi (1 + 0.151 Cmu^1/2 + 0.219 Cmu),
   *    CL = tau dCL/dtau + alpha dCL/dalpha. A plain flap of chord fraction E at deflection delta adds, by thin-aerofoil
   *    theory, Delta CL = 2 [(pi - theta_h) + sin theta_h] delta with the hinge at x/c = (1 - cos theta_h)/2 = 1 - E.
   * 2. Circulation control on a Joukowski section with a rounded trailing edge: a circle of centre mu and radius
   *    a = |1 - mu| + eps encloses zeta = 1, so z = zeta + 1/zeta maps it to a smooth profile whose trailing edge is
   *    rounded. No point of it is sharp, so the Kutta condition no longer fixes Gamma. Putting the rear stagnation
   *    point at circle angle theta_s (where the blown jet finally separates) gives Gamma = 4 pi U a sin(alpha - theta_s).
   * 3. Control allocation for N fluidic effectors: B u = m (roll, pitch, yaw), 0 <= u <= umax, min |u|^2, solved by a
   *    primal active-set method after a bounded least-squares phase that finds the closest attainable moment. */

  /* ---- 1. jet flap ---- */
  const clTau = (cm) => Math.sqrt(4 * PI * cm * (1 + 0.151 * Math.sqrt(cm) + 0.139 * cm));
  const clAlpha = (cm) => 2 * PI * (1 + 0.151 * Math.sqrt(cm) + 0.219 * cm);
  function jetFlap(cm, tauDeg, alphaDeg) {
    const tau = tauDeg * DEG, al = alphaDeg * DEG, Ct = clTau(cm), Ca = clAlpha(cm);
    const CL = tau * Ct + al * Ca, CL0 = 2 * PI * al;
    const reaction = cm * Math.sin(tau + al);              // vertical component of the jet's own momentum flux
    const dCL = CL - CL0;                                  // what blowing adds
    return { cm, tau, al, Ct, Ca, CL, CL0, dCL, reaction, superc: CL - CL0 - reaction, aug: cm > 0 ? dCL / cm : Infinity };
  }
  const flapTheta = (E) => Math.acos(Math.max(-1, Math.min(1, 2 * E - 1)));
  const flapSlope = (E) => { const th = flapTheta(E); return 2 * ((PI - th) + Math.sin(th)); };    // dCL / d delta per radian
  // the momentum coefficient at which the jet flap's lift increment equals target (bisection; null if none below cmMax)
  function cmuFor(target, tauDeg, alphaDeg, cmMax = 5) {
    if (target <= 0) return 0;
    const f = (c) => jetFlap(c, tauDeg, alphaDeg).dCL - target;
    if (f(cmMax) < 0) return null;
    let lo = 0, hi = cmMax;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const RHO = 1.225;
  // blowing for a wing of area S (m^2) at airspeed V with jet speed Vj: mass flow, power
  function blowing(cm, V, Vj, S) {
    const q = 0.5 * RHO * V * V, mdot = cm * q * S / Vj, P = 0.5 * mdot * Vj * Vj;
    return { q, mdot, P, thrust: mdot * Vj };
  }

  /* ---- complex helpers ---- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cabs = (a) => Math.hypot(a[0], a[1]), cexp = (t) => [Math.cos(t), Math.sin(t)];
  const csqrt = (a) => { const r = cabs(a), re = Math.sqrt((r + a[0]) / 2), im = Math.sqrt(Math.max(0, (r - a[0]) / 2)) * (a[1] < 0 ? -1 : 1); return [re, im]; };
  const wrap = (t) => { while (t > PI) t -= 2 * PI; while (t < -PI) t += 2 * PI; return t; };

  /* ---- 2. circulation control ---- */
  const CC = { mx: 0, my: 0.04 };                           // nearly elliptic, lightly cambered: 18% thick at eps = 0.2
  // circle with rear stagnation point at theta_s; eps = how far the circle clears zeta = 1 (0 gives the sharp Joukowski edge)
  function coanda(alphaDeg, eps, sepDeg, o = {}) {
    const mu = [o.mx ?? CC.mx, o.my ?? CC.my], al = alphaDeg * DEG;
    const a = cabs(sub([1, 0], mu)) + eps;
    const thRef = Math.atan2(-mu[1], 1 - mu[0]);            // direction of zeta = 1 seen from the centre: the old sharp edge
    const thS = thRef - sepDeg * DEG;                        // the jet carries the stagnation point round toward the lower side
    const G = 4 * PI * a * Math.sin(al - thS);
    const ea = cexp(-al), eap = cexp(al);
    const dWz = (zt) => { const d = sub(zt, mu); return add(sub(ea, div(mul([a * a, 0], eap), mul(d, d))), div([0, G / (2 * PI)], d)); };
    const toZ = (zt) => add(zt, div([1, 0], zt));
    const dzdzt = (zt) => sub([1, 0], div([1, 0], mul(zt, zt)));
    const dWdz = (zt) => div(dWz(zt), dzdzt(zt));
    const onC = (th) => add(mu, mul([a, 0], cexp(th)));
    const fromZ = (z) => {
      const s = csqrt(sub(mul(z, z), [4, 0]));
      const r1 = [(z[0] + s[0]) / 2, (z[1] + s[1]) / 2], r2 = [(z[0] - s[0]) / 2, (z[1] - s[1]) / 2];
      const d1 = cabs(sub(r1, mu)), d2 = cabs(sub(r2, mu));
      const r = d1 >= d2 ? r1 : r2;
      return Math.max(d1, d2) >= a * (1 - 1e-9) ? r : null;
    };
    const velZ = (x, y) => { const zt = fromZ([x, y]); if (!zt) return null; const w = dWdz(zt); return [w[0], -w[1]]; };
    const velZeta = (x, y) => { const zt = [x, y]; if (cabs(sub(zt, mu)) < a) return null; const w = dWz(zt); return [w[0], -w[1]]; };
    const cpAt = (th) => { const w = dWdz(onC(th)); return 1 - (w[0] * w[0] + w[1] * w[1]); };
    // stream function of W = U(zeta' e^{-i alpha} + a^2 e^{i alpha}/zeta') + i Gamma/(2 pi) log zeta', zeta' = zeta - mu; on the circle it is Gamma ln(a) / 2 pi
    const psi = (zt) => { const d = sub(zt, mu), A = add(mul(d, ea), div(mul([a * a, 0], eap), d)); return A[1] + G / (2 * PI) * Math.log(cabs(d)); };
    // surface points, counter-clockwise from the stagnation point
    const surf = (n = 720) => {
      const pts = [];
      for (let i = 0; i <= n; i++) { const th = thS + 2 * PI * i / n, z = toZ(onC(th)); pts.push({ th, x: z[0], y: z[1], cp: cpAt(th) }); }
      return pts;
    };
    const S0 = surf();
    let xmin = Infinity, xmax = -Infinity, ile = 0, ite = 0;
    S0.forEach((p, i) => { if (p.x < xmin) { xmin = p.x; ile = i; } if (p.x > xmax) { xmax = p.x; ite = i; } });
    const chord = xmax - xmin, zLE = [S0[ile].x, S0[ile].y], zTE = [S0[ite].x, S0[ite].y];
    const chi = Math.atan2(zTE[1] - zLE[1], zTE[0] - zLE[0]);     // chord-line angle
    // geometry along the circle angle
    const tangent = (th) => { const t = mul(dzdzt(onC(th)), [-a * Math.sin(th), a * Math.cos(th)]); return Math.atan2(t[1], t[0]); }; // direction of increasing th
    const curvR = (th) => { const h = 1e-4, p0 = toZ(onC(th - h)), p1 = toZ(onC(th)), p2 = toZ(onC(th + h)); const d1 = [(p2[0] - p0[0]) / (2 * h), (p2[1] - p0[1]) / (2 * h)], d2 = [(p2[0] - 2 * p1[0] + p0[0]) / (h * h), (p2[1] - 2 * p1[1] + p0[1]) / (h * h)]; const sp = Math.hypot(d1[0], d1[1]); return sp ** 3 / Math.abs(d1[0] * d2[1] - d1[1] * d2[0]); };
    // the slot: on the upper surface where x/c = 0.93, found by bisection between the old edge and the leading edge
    const xc = (th) => (toZ(onC(th))[0] - xmin) / chord;
    let lo = thRef, hi = thRef + PI * 0.9;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (xc(m) > 0.93) lo = m; else hi = m; }
    const thSlot = (lo + hi) / 2;
    // the flow leaves the stagnation point along the outward normal; its deflection below the chord is the effective tau
    const leave = tangent(thS) - PI / 2;                     // outward normal (the surface runs counter-clockwise)
    const tauEff = wrap(chi - leave);
    // how far the jet wraps: the clockwise turn of the surface tangent from the slot to the stagnation point
    let wrapAng = 0; { const n = 200; let prev = tangent(thSlot); for (let i = 1; i <= n; i++) { const t = tangent(thSlot + (thS - thSlot) * i / n); wrapAng += wrap(prev - t); prev = t; } }
    const Rte = curvR(thRef);
    const CL = 2 * G / chord;
    const alphaC = al - chi;                                 // angle of attack measured from the chord line
    return { mu, a, eps, al, alphaC, thRef, thS, thSlot, G, CL, psi, psiBody: G / (2 * PI) * Math.log(a), dWz, dWdz, toZ, onC, fromZ, velZ, velZeta, cpAt, surf, S0, ile, ite, xmin, xmax, chord, chi, tangent, curvR, tauEff, wrapAng, Rte, Gmax: 4 * PI * a };
  }
  // lift and drag from integrating the surface pressure (for the checks): returns [CL, CD]
  function forcesFromPressure(J, n = 4000) {
    let fx = 0, fy = 0;
    for (let i = 0; i < n; i++) {
      const t0 = J.thS + 2 * PI * i / n, t1 = J.thS + 2 * PI * (i + 1) / n;
      const p = J.toZ(J.onC(t0)), q = J.toZ(J.onC(t1)), cp = J.cpAt((t0 + t1) / 2), dx = q[0] - p[0], dy = q[1] - p[1];
      fx += -cp * dy; fy += cp * dx;            // counter-clockwise: outward normal (dy, -dx), pressure pushes along -n
    }
    const ca = Math.cos(J.al), sa = Math.sin(J.al);
    return [(-fx * sa + fy * ca) / J.chord, (fx * ca + fy * sa) / J.chord];
  }
  // dividing streamline from the rear stagnation point, integrated in the circle plane and mapped (z-plane points)
  function dividing(J, len = 3, h = 0.01) {
    let p = J.onC(J.thS); const nrm = cexp(J.thS); p = add(p, mul([0.004 * J.a, 0], nrm));
    const out = [J.toZ(J.onC(J.thS))];
    const vel = (q) => { const w = J.dWz(q); const s = Math.hypot(w[0], w[1]) || 1; return [w[0] / s, -w[1] / s]; };
    let s = 0;
    for (let i = 0; i < 4000 && s < len; i++) {
      const k1 = vel(p), k2 = vel(add(p, [k1[0] * h / 2, k1[1] * h / 2])), k3 = vel(add(p, [k2[0] * h / 2, k2[1] * h / 2])), k4 = vel(add(p, [k3[0] * h, k3[1] * h]));
      p = add(p, [(k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * h / 6, (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * h / 6]);
      const z = J.toZ(p), last = out[out.length - 1]; s += Math.hypot(z[0] - last[0], z[1] - last[1]); out.push(z);
    }
    return out;
  }
  // physical scale for the readouts: chord 0.5 m at 30 m/s in sea-level air
  const CC_C = 0.5, CC_V = 30;
  function coandaJet(J, cmu, hmm) {
    const R = J.Rte / J.chord * CC_C, h = hmm / 1000, q = 0.5 * RHO * CC_V * CC_V;
    const uj = CC_V * Math.sqrt(cmu * CC_C / (2 * h));       // Cmu = 2 h uj^2 / (c V^2) for a jet of free-stream density
    const dp = RHO * uj * uj * h / R;                        // radial pressure balance across the curved jet sheet
    return { R, h, q, uj, dp, hR: h / R };
  }

  /* ---- 3. control allocation ---- */
  // generic tailless planform, half-span 1: leading edge from the apex to the tip, a cranked trailing edge
  const APEX = 0.95, TIPLE = -0.2, TIPTE = -0.33, TEC = -0.52, KINK = [0.32, -0.66], XCG = -0.05;
  const xLE = (eta) => APEX + (TIPLE - APEX) * Math.abs(eta);
  const xTE = (eta) => { const e = Math.abs(eta); return e <= KINK[0] ? TEC + (KINK[1] - TEC) * e / KINK[0] : KINK[1] + (TIPTE - KINK[1]) * (e - KINK[0]) / (1 - KINK[0]); };
  const AREA = (() => { let s = 0; const n = 4000; for (let i = 0; i < n; i++) { const e = -1 + (i + 0.5) * 2 / n; s += (xLE(e) - xTE(e)) * 2 / n; } return s; })();
  const CBAR = AREA / 2;                                     // mean chord = area / span (span 2)
  const KU = 14, KL = 20, KD = 3;                            // schematic effectiveness: dCL or dCD per unit Cmu
  const STATIONS = [0.2, 0.56, 0.84];
  // 14 effectors: per side, three stations with an upper and a lower trailing-edge slot, plus a drag effector at the tip
  const EFFECTORS = (() => {
    const E = [];
    for (const side of [-1, 1]) {
      STATIONS.forEach((eta, j) => {
        for (const surf of ['upper', 'lower']) E.push({ side, eta, y: side * eta, x: xTE(eta) + 0.02, kind: 'lift', surf, k: surf === 'lower' ? KL : -KU, j, name: (side < 0 ? 'L' : 'R') + (j + 1) + (surf === 'lower' ? 'l' : 'u') });
      });
      E.push({ side, eta: 0.95, y: side * 0.95, x: (xLE(0.95) + xTE(0.95)) / 2, kind: 'drag', surf: 'tip', k: KD, name: (side < 0 ? 'L' : 'R') + 'd' });
    }
    return E;
  })();
  // B: rows = roll C_l (right wing down positive), pitch C_m (nose up), yaw C_n (nose right); x forward, y right
  function effectorMatrix(E = EFFECTORS) {
    const b = 2;
    return [
      E.map((e) => (e.kind === 'lift' ? -(e.y / b) * e.k : 0)),
      E.map((e) => (e.kind === 'lift' ? ((e.x - XCG) / CBAR) * e.k : 0)),
      E.map((e) => (e.kind === 'drag' ? (e.y / b) * e.k : 0)),
    ];
  }
  const matvec = (B, u) => B.map((r) => r.reduce((s, x, i) => s + x * u[i], 0));
  // solve a small symmetric system; pivots below tol are treated as zero (minimum-norm on a consistent system)
  function symSolve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]), piv = [];
    const scale = Math.max(1e-300, ...A.map((r, i) => Math.abs(r[i])));
    const x = new Array(n).fill(0), used = new Array(n).fill(false);
    for (let c = 0; c < n; c++) {
      let p = -1, best = 1e-11 * scale;
      for (let r = 0; r < n; r++) if (!used[r] && Math.abs(M[r][c]) > best) { best = Math.abs(M[r][c]); p = r; }
      if (p < 0) continue;
      used[p] = true; piv.push([p, c]);
      for (let r = 0; r < n; r++) if (r !== p) { const f = M[r][c] / M[p][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[p][k]; }
    }
    for (const [p, c] of piv) x[c] = M[p][n] / M[p][c];
    return x;
  }
  // box-constrained QP  min 1/2 u'Hu + g'u, lo <= u <= hi, H positive definite: primal active set
  function boxQP(H, g, lo, hi, u0) {
    const n = g.length; let u = u0 ? u0.slice() : new Array(n).fill(0); u = u.map((x, i) => Math.min(hi[i], Math.max(lo[i], x)));
    const W = u.map((x, i) => (x <= lo[i] ? -1 : x >= hi[i] ? 1 : 0));
    for (let it = 0; it < 200; it++) {
      const F = []; for (let i = 0; i < n; i++) if (!W[i]) F.push(i);
      let target = u.slice();
      if (F.length) {
        const A = F.map((i) => F.map((j) => H[i][j])), rhs = F.map((i) => { let s = -g[i]; for (let j = 0; j < n; j++) if (W[j]) s -= H[i][j] * u[j]; return s; });
        const xF = symSolve(A, rhs); F.forEach((i, k) => { target[i] = xF[k]; });
      }
      let alpha = 1, block = -1;
      for (const i of F) { const p = target[i] - u[i]; if (p < -1e-15 && target[i] < lo[i]) { const t = (lo[i] - u[i]) / p; if (t < alpha) { alpha = t; block = i; } } if (p > 1e-15 && target[i] > hi[i]) { const t = (hi[i] - u[i]) / p; if (t < alpha) { alpha = t; block = i; } } }
      for (const i of F) u[i] += alpha * (target[i] - u[i]);
      if (block >= 0) { W[block] = u[block] <= (lo[block] + hi[block]) / 2 ? -1 : 1; u[block] = W[block] < 0 ? lo[block] : hi[block]; continue; }
      // at the subspace minimum: release the bound whose multiplier has the wrong sign
      let worst = 0, wi = -1;
      for (let i = 0; i < n; i++) if (W[i]) { let gr = g[i]; for (let j = 0; j < n; j++) gr += H[i][j] * u[j]; const v = W[i] < 0 ? -gr : gr; if (v > worst + 1e-14) { worst = v; wi = i; } }
      if (wi < 0) return u;
      W[wi] = 0;
    }
    return u;
  }
  // min |u|^2 subject to B u = m and the box, from a feasible start (B u0 = m): primal active set with KKT release
  function minNormEq(B, m, lo, hi, u0) {
    const n = u0.length, r = B.length; let u = u0.slice();
    const W = u.map((x, i) => (x <= lo[i] + 1e-15 ? -1 : x >= hi[i] - 1e-15 ? 1 : 0));
    let lam = new Array(r).fill(0);
    for (let it = 0; it < 300; it++) {
      const F = []; for (let i = 0; i < n; i++) if (!W[i]) F.push(i);
      const res = m.map((mi, k) => { let s = mi; for (let i = 0; i < n; i++) if (W[i]) s -= B[k][i] * u[i]; return s; });
      const G = B.map((ra) => B.map((rb) => F.reduce((s, i) => s + ra[i] * rb[i], 0)));
      lam = symSolve(G, res);
      const target = u.slice(); F.forEach((i) => { target[i] = B.reduce((s, row, k) => s + row[i] * lam[k], 0); });
      let alpha = 1, block = -1;
      for (const i of F) { const p = target[i] - u[i]; if (p < 0 && target[i] < lo[i] - 1e-15) { const t = Math.max(0, (lo[i] - u[i]) / p); if (t < alpha) { alpha = t; block = i; } } if (p > 0 && target[i] > hi[i] + 1e-15) { const t = Math.max(0, (hi[i] - u[i]) / p); if (t < alpha) { alpha = t; block = i; } } }
      for (const i of F) u[i] += alpha * (target[i] - u[i]);
      if (block >= 0) { W[block] = target[block] < lo[block] ? -1 : 1; u[block] = W[block] < 0 ? lo[block] : hi[block]; continue; }
      // multipliers of the active bounds: s = (B' lam)_i; a variable at its lower bound needs s <= u_i, at the upper bound s >= u_i
      let worst = 1e-13, wi = -1;
      for (let i = 0; i < n; i++) if (W[i]) { const s = B.reduce((acc, row, k) => acc + row[i] * lam[k], 0), v = W[i] < 0 ? s - u[i] : u[i] - s; if (v > worst) { worst = v; wi = i; } }
      if (wi < 0) return { u, lam };
      W[wi] = 0;
    }
    return { u, lam };
  }
  // w weights the rows when the command cannot be met, so that the best fit is judged in units of each axis's full command
  function allocate(m0, umax, B0 = effectorMatrix(), w = [1, 1, 1]) {
    const B = B0.map((r, k) => r.map((x) => x * w[k])), m = m0.map((x, k) => x * w[k]);
    const n = B[0].length, lo = new Array(n).fill(0), hi = new Array(n).fill(umax);
    // phase 1: the attainable moment closest to m (bounded least squares, a whisper of regularisation for uniqueness)
    const H = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => B.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-9 : 0)));
    const g = Array.from({ length: n }, (_, i) => -B.reduce((s, r, k) => s + r[i] * m[k], 0));
    const uA = boxQP(H, g, lo, hi);
    const mA = matvec(B, uA), scale = Math.max(1e-6, Math.hypot(...m));
    const miss = Math.hypot(...m.map((x, k) => x - mA[k]));
    const feasible = miss < 1e-6 * scale;
    // phase 2: the least blowing that delivers that moment (exactly m when it is attainable)
    const tgt = feasible ? m : mA;
    let start = uA;
    if (feasible) {           // nudge the phase-1 point onto B u = m exactly (it is within 1e-9 of it)
      const corr = symSolve(B.map((ra) => B.map((rb) => ra.reduce((s, x, i) => s + x * rb[i], 0))), m.map((x, k) => x - mA[k]));
      start = uA.map((x, i) => Math.min(umax, Math.max(0, x + B.reduce((s, row, k) => s + row[i] * corr[k], 0))));
    }
    const sol = minNormEq(B, tgt, lo, hi, start), lam = sol.lam, u = sol.u.map((x) => Math.min(umax, Math.max(0, x)));   // clip rounding at the bounds
    const got = matvec(B0, u);
    return { u, lam, got, feasible, miss: Math.hypot(...m0.map((x, k) => (x - got[k]) * w[k])), sat: u.map((x) => x >= umax * (1 - 1e-9)), B: B0 };
  }
  const BLEED = { S: 40, V: 200, rho: 0.41, Vj: 300 };       // reference flight condition for the bleed readout (about 10 km)
  const bleed = (u) => { const q = 0.5 * BLEED.rho * BLEED.V ** 2; return u.reduce((s, x) => s + x, 0) * q * BLEED.S / BLEED.Vj; };

  const M = { clTau, clAlpha, jetFlap, flapTheta, flapSlope, cmuFor, blowing, RHO, coanda, forcesFromPressure, dividing, coandaJet, CC, CC_C, CC_V,
    xLE, xTE, AREA, CBAR, XCG, EFFECTORS, effectorMatrix, matvec, allocate, boxQP, minNormEq, bleed, BLEED, KU, KL, KD, cabs, sub };
  (window.LabModels = window.LabModels || {})['active-flow-control'] = M;

  const deg = (r) => r / DEG;

  /* ---------------- 1. jet-flap lift ---------------- */
  const S_WING = 10;                                        // m^2, for the blowing readout
  D['jet-flap-lift'] = {
    render(ctx, v) {
      const cm = v.cmu, tau = v.tau, al = v.alpha, E = v.E;
      const J = jetFlap(cm, tau, al), fs = flapSlope(E), flapCL = J.CL0 + fs * tau * DEG;
      const cmMatch = cmuFor(fs * tau * DEG, tau, al, 5);
      const row = L.h('div', 'lab-row is-wide', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      // CL against Cmu
      L.h('p', 'lab-cap', c1, T('Lift coefficient against the jet momentum coefficient Cμ, from Spence’s jet-flap theory. The thick curve is your jet deflection τ; the faint ones are τ = 15° to 75°. Lift climbs like √Cμ at first, so even a weak jet buys a lot. The dashed orange line is what the jet’s own thrust could lift on its own, and the teal line is a hinged flap of chord fraction E turned through the same angle. Drag the gold point.', '揚力係数を噴流の運動量係数 Cμ に対して描いています。スペンスのジェットフラップ理論によるものです。太い曲線がいまの噴流の偏向角 τ で、薄い曲線は τ = 15° から 75° です。揚力は最初 √Cμ のように増えるので、弱い噴流でも大きな効果があります。橙の破線は噴流自身の推力だけで持ち上げられる量、青緑の線は翼弦比 E のヒンジ式フラップを同じ角度だけ曲げたときの揚力です。金色の点をドラッグしてください。'));
      const CMX = 0.5, top = Math.max(1.5, jetFlap(CMX, Math.max(tau, 30), al).CL, flapCL) * 1.08, bot = Math.min(0, J.CL0) - 0.15;
      const f = L.fig(c1, { x: [0, CMX], y: [bot, top], aspect: 0.66, maxH: 330, xlabel: T('momentum coefficient Cμ = ṁV_j / (q∞S)', '運動量係数 Cμ = ṁV_j / (q∞S)'), ylabel: 'C_L' });
      for (const tk of [15, 30, 45, 60, 75]) if (Math.abs(tk - tau) > 2) f.line(L.sample(0, CMX, 120, (c) => [c, jetFlap(c, tk, al).CL]), { c: 'muted', w: 1, op: 0.45 });
      f.hline(J.CL0, { c: 'muted', w: 1, dash: true });
      f.line(L.sample(0, CMX, 60, (c) => [c, J.CL0 + c * Math.sin((tau + al) * DEG)]), { c: 'c2', w: 1.8, dash: true });
      f.hline(flapCL, { c: 'c3', w: 1.8, dash: '6 4' });
      f.line(L.sample(0, CMX, 200, (c) => [c, jetFlap(c, tau, al).CL]), { c: 'c1', w: 2.8 });
      if (cmMatch !== null && cmMatch > 0 && cmMatch <= CMX) { f.dot(cmMatch, flapCL, { c: 'c3', r: 4.5 }); }
      f.text(CMX, flapCL, T('plain flap, δ = τ', '普通のフラップ δ = τ'), { small: true, anchor: 'end', dy: -6, c: 'c3' });
      f.text(CMX, J.CL0, T('no blowing', '吹き出しなし'), { small: true, anchor: 'end', dy: 13, c: 'muted' });
      f.handle(cm, J.CL, { c: 'hl', axis: 'x', label: T('momentum coefficient', '運動量係数'), bounds: [0, CMX, bot, top], snap: 0.005, onDrag: (x) => ctx.set('cmu', x) });
      // augmentation, log-log
      L.h('p', 'lab-cap', c1, T('Lift augmentation ΔC_L / Cμ, on logarithmic scales: the lift that blowing adds, per unit of jet momentum. At small Cμ it grows like 1/√Cμ, the slope of −1/2 here, which is why a little blowing is so effective.', '揚力増強比 ΔC_L / Cμ を対数目盛で描いています。吹き出しが加える揚力を、噴流の運動量 1 単位あたりで表したものです。Cμ が小さいと 1/√Cμ のように大きくなり、ここでは傾き −1/2 の直線になります。少しの吹き出しがよく効くのはこのためです。'));
      const lg = Math.log10, aug = (c) => jetFlap(c, tau, al).dCL / c;
      const g = L.fig(c1, { x: [-3, lg(CMX)], y: [0, 2.6], aspect: 0.42, maxH: 200, xlabel: 'Cμ', ylabel: 'ΔC_L / Cμ', ticksX: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [lg(0.5), '0.5']], ticksY: [[0, '1'], [lg(3), '3'], [1, '10'], [lg(30), '30'], [2, '100'], [lg(300), '300']] });
      const augPts = L.sample(-3, lg(CMX), 160, (x) => { const r = aug(10 ** x); return r > 1 ? [x, Math.min(2.6, lg(r))] : null; }).filter(Boolean);
      if (augPts.length > 1) g.line(augPts, { c: 'c1', w: 2.4 });
      else g.text(lg(0.02), 1.3, T('blowing adds no lift at this τ and α', 'この τ と α では吹き出しは揚力を加えません'), { small: true, anchor: 'middle', c: 'muted' });
      if (cm > 0 && J.aug > 1) g.dot(lg(Math.max(cm, 0.001)), Math.min(2.6, lg(J.aug)), { c: 'hl', r: 5 });
      // section diagram
      L.h('p', 'lab-cap', c2, T('A thin wing blowing a jet sheet from its trailing edge (shape schematic). Drag the gold point to turn the jet. The arrows are drawn to the same scale: the lift (gold) and the jet’s reaction on the wing (orange). The reaction is tiny; nearly all the extra lift is circulation that the jet induces on the wing.', '後縁から噴流の膜を吹き出す薄い翼です（形は模式図です）。金色の点をドラッグすると噴流の向きが変わります。矢印は同じ縮尺で、揚力（金色）と、噴流が翼に及ぼす反力（橙）です。反力はごく小さく、増えた揚力のほとんどは噴流が翼のまわりに誘導する循環によるものです。'));
      const s = L.fig(c2, { x: [-0.25, 2.25], y: [-0.95, 0.75], equal: true, axes: false, grid: false, maxH: 250 });
      const a = al * DEG, te = [Math.cos(a), -Math.sin(a)];
      s.arrow([-0.2, 0.55], [0.25, 0.55], { c: 'ink', w: 1.8 }); s.text(-0.2, 0.55, 'U∞', { small: true, dy: -8 });
      const th0 = -(a + tau * DEG), ell = 0.3 + 1.6 * cm, ks = 0.62 / Math.max(1.6, J.CL);
      const jet = [te]; { let p = te.slice(); for (let i = 1; i <= 120; i++) { const sx = i * 0.012, ang = th0 * Math.exp(-sx / ell); p = [p[0] + 0.012 * Math.cos(ang), p[1] + 0.012 * Math.sin(ang)]; jet.push(p); if (p[0] > 2.2 || p[1] < -0.92) break; } }
      s.line(jet, { c: 'c2', w: 2 + 7 * Math.sqrt(cm / 0.5), op: 0.85 });
      s.seg([0, 0], te, { c: 'ink', w: 5 });
      const lift = ks * J.CL, mid = [0.5 * Math.cos(a), -0.5 * Math.sin(a)];
      if (Math.abs(lift) > 0.01) s.arrow(mid, [mid[0], mid[1] + lift], { c: 'hl', w: 3 });
      const rx = -ks * cm * Math.cos(th0), ry = -ks * cm * Math.sin(th0);
      if (Math.hypot(rx, ry) > 0.004) s.arrow(te, [te[0] + rx * 4, te[1] + ry * 4], { c: 'c2', w: 2.4 });
      s.text(te[0] + rx * 4, te[1] + ry * 4, T('reaction ×4', '反力 ×4'), { small: true, dx: 6, dy: -4, c: 'c2' });
      s.text(mid[0], mid[1] + lift, T('lift', '揚力'), { small: true, dx: 7, dy: 4, c: 'hl' });
      const hp = [te[0] + 0.42 * Math.cos(th0), te[1] + 0.42 * Math.sin(th0)];
      s.handle(hp[0], hp[1], { c: 'hl', label: T('jet direction', '噴流の向き'), onDrag: (x, y) => { const t = -Math.atan2(y - te[1], x - te[0]) / DEG - al; ctx.set('tau', Math.max(0, Math.min(80, Math.round(t)))); } });
      s.text(te[0], te[1], 'τ', { math: true, dx: 14, dy: 18 });
      // where the lift comes from
      L.h('p', 'lab-cap', c2, T('Where the lift coefficient comes from.', '揚力係数の内訳です。'));
      const parts = [[J.CL0, 'muted', T('incidence 2πα', '迎角 2πα')], [J.reaction, 'c2', T('jet reaction', '噴流の反力')], [J.superc, 'c1', T('supercirculation', '超循環')]];
      const lo = Math.min(0, J.CL0, J.CL) - 0.1, hi = Math.max(J.CL, J.CL0, 0.5) * 1.06 + 0.05;
      const b = L.fig(c2, { x: [lo, hi], y: [0, 1], aspect: 0.2, minH: 96, maxH: 110, xlabel: 'C_L', grid: false, ticksY: [] });
      let x0 = 0;
      for (const [val, col] of parts) { b.rect(Math.min(x0, x0 + val), 0.25, Math.abs(val), 0.5, { c: col, fill: col, fo: 0.75, w: 1 }); x0 += val; }
      b.vline(J.CL, { c: 'ink', w: 1.6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('jet flap, your τ', 'ジェットフラップ（いまの τ）') }, { c: 'c2', dash: true, label: T('jet thrust alone, Cμ sin(τ + α)', '噴流の推力だけ Cμ sin(τ + α)') }, { c: 'c3', dash: true, label: T('plain flap of chord E at δ = τ', '翼弦比 E の普通のフラップ（δ = τ）') }, { kind: 'fill', c: 'muted', label: T('incidence 2πα', '迎角 2πα') }, { kind: 'fill', c: 'c1', label: T('supercirculation', '超循環') }]);
      const B = blowing(cm, v.V, v.vj, S_WING), dL = J.dCL * B.q * S_WING;
      ctx.readout([
        { k: T('C_L = τ ∂C_L/∂τ + α ∂C_L/∂α', 'C_L = τ ∂C_L/∂τ + α ∂C_L/∂α'), v: fmt(J.CL, 3), tone: 'key' },
        { k: T('∂C_L/∂τ, ∂C_L/∂α (per rad)', '∂C_L/∂τ、∂C_L/∂α（1/rad）'), v: fmt(J.Ct, 3) + ', ' + fmt(J.Ca, 3) },
        { k: T('augmentation ΔC_L / Cμ', '増強比 ΔC_L / Cμ'), v: cm > 0 ? fmt(J.aug, 3) : '−', tone: 'key' },
        { k: T('jet reaction / added lift', '噴流の反力 / 増えた揚力'), v: J.dCL > 1e-9 ? fmt(100 * J.reaction / J.dCL, 2) + '%' : '−' },
        { k: T('plain flap giving the same ΔC_L', '同じ ΔC_L を出す普通のフラップ'), v: fmt(J.dCL / fs / DEG, 3) + '°' },
        { k: T(`blowing on ${S_WING} m² at ${v.V} m/s: ṁ, P = ½ṁV_j²`, `${S_WING} m²・${v.V} m/s での吹き出し：ṁ、P = ½ṁV_j²`), v: fmt(B.mdot, 3) + ' kg/s, ' + fmt(B.P / 1000, 3) + ' kW' },
        { k: T('extra lift, and power per kN of it', '増えた揚力と 1 kN あたりの動力'), v: fmt(dL / 1000, 3) + ' kN, ' + (dL > 1 ? fmt(B.P / dL, 3) + ' kW/kN' : '−') },
      ], cmMatch !== null && cmMatch <= CMX && cmMatch > 0 ? T(`A jet turned through ${tau}° matches a plain flap of chord fraction ${E} turned the same way at Cμ = ${fmt(cmMatch, 3)}; above that the jet flap wins. A slower, thicker jet with the same Cμ costs less power, since P = ½ Cμ q∞ S V_j.`, `${tau}° 曲げた噴流は、Cμ = ${fmt(cmMatch, 3)} で、同じ角度だけ曲げた翼弦比 ${E} の普通のフラップに追いつき、それより上ではジェットフラップが上回ります。P = ½ Cμ q∞ S V_j なので、同じ Cμ なら遅く厚い噴流のほうが動力は少なくて済みます。`)
        : T('Thin-aerofoil theory: valid for small angles and attached flow. Doubling the jet speed at the same Cμ halves the mass flow but doubles the power.', '薄翼理論なので、角度が小さく流れが付着している範囲で成り立ちます。同じ Cμ で噴流速度を二倍にすると、質量流量は半分になりますが動力は二倍になります。'));
    },
  };

  /* ---------------- 2. the Coanda wing ---------------- */
  // circle angles spread evenly in arc length plus turning, so the small rounded edge gets its share of points
  function profileAngles(J, n, lam = 0.15) {
    const N = 3000, th0 = J.thRef + PI, cum = [0]; let prev = J.toZ(J.onC(th0)), pt = J.tangent(th0);
    for (let i = 1; i <= N; i++) { const th = th0 + 2 * PI * i / N, z = J.toZ(J.onC(th)), t = J.tangent(th); cum.push(cum[i - 1] + Math.hypot(z[0] - prev[0], z[1] - prev[1]) + lam * Math.abs(wrap(t - pt))); prev = z; pt = t; }
    const tot = cum[N], out = []; let k = 0;
    for (let j = 0; j <= n; j++) { const s = tot * j / n; while (k < N - 1 && cum[k + 1] < s) k++; const f = (s - cum[k]) / Math.max(1e-12, cum[k + 1] - cum[k]); out.push(th0 + 2 * PI * (k + Math.min(1, f)) / N); }
    return out;
  }
  const SC2 = 0.55, SPAN = 1.25;
  const CC_SEEDS = [-1.3, -0.75, -0.4, -0.18, -0.06, 0.04, 0.12, 0.26, 0.5, 0.85, 1.3], CC_NP = 6;
  // the jet path in the z-plane: hugging the surface from the slot to the stagnation point, then along the dividing streamline
  // the jet in the z-plane: hugging the surface from the slot to where it separates, then leaving along the surface
  // tangent and bending toward the free stream (the free part's shape is schematic)
  function jetPath(J, off = 0.03, len = 0.9) {
    const pts = [], n = 60;
    for (let i = 0; i <= n; i++) { const th = J.thSlot + (J.thS - J.thSlot) * i / n, z = J.toZ(J.onC(th)), nr = J.tangent(th) - PI / 2; pts.push([z[0] + off * Math.cos(nr), z[1] + off * Math.sin(nr)]); }
    const phi0 = J.tangent(J.thS) + PI, dphi = wrap(phi0 - J.al), h = 0.01;
    let p = pts[n].slice();
    for (let s = h; s <= len; s += h) { const ph = J.al + dphi * Math.exp(-s / 0.22); p = [p[0] + h * Math.cos(ph), p[1] + h * Math.sin(ph)]; pts.push(p); }
    return pts;
  }
  // streamlines that start far upstream on chosen values of the stream function, with the time along each
  function traceCC(J, deltas, h = 0.03) {
    const out = [];
    for (const d of deltas) {
      const target = J.psiBody + d, x0 = -3.3;
      let lo = -3, hi = 3;
      for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, zt = J.fromZ([x0, m]); if (!zt) { lo = m; continue; } if (J.psi(zt) < target) lo = m; else hi = m; }
      let p = [x0, (lo + hi) / 2], t = 0; const pts = [], times = [];
      const unit = (q) => { const w = J.velZ(q[0], q[1]); if (!w) return null; const m = Math.hypot(w[0], w[1]); return m > 1e-9 ? [w[0] / m, w[1] / m, m] : null; };
      for (let k = 0; k < 700; k++) {
        const k1 = unit(p); if (!k1) break;
        pts.push(p); times.push(t);
        const k2 = unit([p[0] + h * k1[0] / 2, p[1] + h * k1[1] / 2]); if (!k2) break;
        const k3 = unit([p[0] + h * k2[0] / 2, p[1] + h * k2[1] / 2]); if (!k3) break;
        const k4 = unit([p[0] + h * k3[0], p[1] + h * k3[1]]); if (!k4) break;
        p = [p[0] + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, p[1] + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
        t += h / Math.max(0.06, k1[2]);
        if (p[0] > 3.3 || Math.abs(p[1]) > 2.4) break;
      }
      if (pts.length > 4) out.push({ pts, times, T: t, d });
    }
    return out;
  }
  const cpShade = (cp) => Math.max(-1, Math.min(1, cp > 0 ? cp : cp / 3));
  D['coanda-wing'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', st.c1, T('A circulation-control wing. A thin jet (orange) leaves the glowing slot and clings to the rounded trailing edge, the Coanda surface, before it lets go. Where it lets go is the rear stagnation point of the outer flow, and that, not a sharp edge, fixes the circulation. The wing is coloured by pressure, blue for suction, and the smoke moves along exact potential-flow streamlines at the true local speed: it races over the suction side and whips round the Coanda edge. Drag the gold point round the edge.', '循環制御翼です。薄い噴流（橙）が光るスロットから出て、丸い後縁、つまりコアンダ面に沿って回り込み、やがて離れます。離れる点が外側の流れの後方よどみ点で、鋭い縁ではなくこの点が循環を決めます。翼は圧力で塗り分けていて、青が吸い込みです。煙は厳密なポテンシャル流の流線に沿って本当の局所速度で動きます。吸い込み側では速く走り、コアンダ面の縁を勢いよく回り込みます。金色の点を縁に沿ってドラッグしてください。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The same section, flat: pressure shading, streamlines and the jet. Moving the stagnation point round the edge to the lower side raises the circulation, and every streamline ahead of the wing bends up to meet it.', '同じ断面を平面で見ています。圧力の濃淡、流線、噴流です。よどみ点を縁に沿って下面側へ動かすと循環が増え、翼の前方の流線もすべてそれに合わせて上へ曲がります。'));
        st.p2 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('Pressure along the chord, suction up. At the right edge the upper curve rises where the Coanda surface pulls the flow round, and the lower curve dips to the stagnation point where the jet lets go.', '翼弦に沿った圧力で、吸い込みが上です。右端では、コアンダ面が流れを引き回すところで上面の曲線が上がり、噴流が離れるよどみ点で下面の曲線が下がります。'));
        st.p3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const J = coanda(v.alpha, v.eps, v.sep), J0 = coanda(v.alpha, v.eps, 0);
      const dCL = J.CL - J0.CL, tauE = deg(J.tauEff), cmuE = cmuFor(dCL, Math.max(0, tauE), deg(J.alphaC), 20);
      const jet = coandaJet(J, cmuE || 0, v.h);
      const thNear = (x, y) => { let best = Infinity, bt = J.thRef; for (let i = 0; i <= 180; i++) { const th = J.thRef - 45 * DEG * i / 180, z = J.toZ(J.onC(th)), d = (z[0] - x) ** 2 + (z[1] - y) ** 2; if (d < best) { best = d; bt = th; } } return bt; };
      const setSep = (th) => { const s = Math.round(deg(J.thRef - th) * 2) / 2; ctx.set('sep', Math.max(0, Math.min(45, s))); };
      const draw2d = () => {
        st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) { st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Drag the gold point on the section to move the separation point.', '断面の金色の点をドラッグすると、はく離点が動きます。')); }
        const W = 2.75, H = 1.5;
        const f = L.fig(st.flat ? st.v3 : st.p2, { x: [-W, W + 0.35], y: [-H, H], equal: true, axes: false, grid: false, maxH: 330 });
        f.raster((x, y) => { const vv = J.velZ(x, y); if (!vv) return [0.5, 0.5, 0.5]; return cpShade(1 - (vv[0] * vv[0] + vv[1] * vv[1])); }, { cmap: 'div', res: 4 });
        f.stream((x, y) => J.velZ(x, y) || [0, 0], L.seq(15, (i) => [-W + 0.02, -H + 0.1 + (2 * H - 0.2) * i / 14]), { both: false, c: 'ink', w: 1.05, op: 0.55, h: 0.02, steps: 900, stop: (p) => !J.velZ(p[0], p[1]) });
        f.poly(J.S0.map((p) => [p.x, p.y]), { c: 'ink', fill: 'plate', fo: 1, w: 1.5 });
        f.line(jetPath(J, 0.03), { c: 'c2', w: 3, op: 0.9 });
        const zs = J.toZ(J.onC(J.thSlot)); f.dot(zs[0], zs[1], { c: 'c2', r: 4 });
        f.text(zs[0], zs[1], T('slot', 'スロット'), { small: true, dy: -10, dx: -6, anchor: 'end', c: 'c2' });
        const ca = Math.cos(J.al), sa = Math.sin(J.al);
        f.arrow([-W + 0.2, H - 0.25], [-W + 0.2 + 0.6 * ca, H - 0.25 + 0.6 * sa], { c: 'ink', w: 2 }); f.text(-W + 0.25, H - 0.25, 'U', { math: true, small: true, dy: -8 });
        const zp = J.toZ(J.onC(J.thS));
        if (st.flat) f.handle(zp[0], zp[1], { c: 'hl', label: T('separation point', 'はく離点'), onDrag: (x, y) => setSep(thNear(x, y)) });
        else f.dot(zp[0], zp[1], { c: 'hl', r: 5 });
        // Cp
        const P = J.S0, up = [], lo = [];
        const ile = J.ile, ite = J.ite;
        P.forEach((p, i) => { const xcv = (p.x - J.xmin) / J.chord; if (i >= ite && i <= ile) up.push([xcv, -p.cp]); else lo.push([xcv, -p.cp, i]); });
        lo.sort((a, b) => ((a[2] - ile + P.length) % P.length) - ((b[2] - ile + P.length) % P.length));
        const ymax = Math.min(14, Math.max(2, ...up.map((p) => p[1])) * 1.08), ymin = Math.max(-3, Math.min(-1.2, ...lo.map((p) => p[1]), ...up.map((p) => p[1])) - 0.2);
        const h = L.fig(st.p3, { x: [0, 1], y: [ymin, ymax], aspect: 0.5, maxH: 210, xlabel: 'x / c', ylabel: '−Cp' });
        h.hline(0, { c: 'ink', w: 1, op: 0.5 });
        h.line(up.map((p) => [p[0], Math.min(ymax, p[1])]), { c: 'c1', w: 2.3 });
        h.line(lo.map((p) => [p[0], Math.max(ymin, Math.min(ymax, p[1]))]), { c: 'c2', w: 2.3 });
        L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('suction, Cp < 0', '吸い込み Cp < 0') }, { kind: 'fill', c: 'c2', label: T('pressure above free stream', '一様流より高い圧力') }, { c: 'c1', label: T('upper surface, round to the stagnation point', '上面（よどみ点まで）') }, { c: 'c2', label: T('lower surface', '下面') }, { kind: 'dot', c: 'hl', label: T('rear stagnation point, where the jet separates', '後方よどみ点（噴流がはく離する点）') }]);
        const fast = jet.uj > 250;
        ctx.readout([
          { k: T('circulation Γ = 4πUa sin(α − θ_s)', '循環 Γ = 4πUa sin(α − θ_s)'), v: fmt(J.G, 3) + T(` (unblown ${fmt(J0.G, 3)})`, `（吹き出しなし ${fmt(J0.G, 3)}）`) },
          { k: T('lift coefficient C_L = 2Γ / Uc', '揚力係数 C_L = 2Γ / Uc'), v: fmt(J.CL, 3) + T(` (unblown ${fmt(J0.CL, 3)})`, `（吹き出しなし ${fmt(J0.CL, 3)}）`), tone: 'key' },
          { k: T('flow leaves the edge at τ below the chord; jet wraps', '流れが縁を離れる角 τ（翼弦から下向き）と噴流の巻きつき角'), v: fmt(tauE, 3) + '°, ' + fmt(deg(J.wrapAng), 3) + '°' },
          { k: T('Cμ that jet-flap theory needs (estimate)', 'ジェットフラップ理論が求める Cμ（見積もり）'), v: cmuE === null ? T('beyond its range', '範囲外') : fmt(cmuE, 3), tone: 'key' },
          { k: T(`jet speed for a ${v.h} mm slot (c = 0.5 m, 30 m/s)`, `${v.h} mm のスロットでの噴流速度（c = 0.5 m、30 m/s）`), v: fmt(jet.uj, 3) + ' m/s', tone: fast ? 'warn' : undefined },
          { k: T('Coanda edge radius R, and h / R', 'コアンダ面の半径 R と h / R'), v: fmt(jet.R * 1000, 3) + ' mm, ' + fmt(jet.hR, 2) },
          { k: T('pressure drop across the jet Δp = ρu_j²h / R', '噴流を横切る圧力差 Δp = ρu_j²h / R'), v: fmt(jet.dp / 1000, 3) + ' kPa = ' + fmt(jet.dp / jet.q, 3) + ' q∞' },
        ], fast ? T('The jet would be fast enough for compressibility to matter: real circulation-control slots choke near sonic speed. A wider slot lowers the speed for the same Cμ.', 'この噴流は圧縮性が効くほど速くなります。実際の循環制御のスロットは音速付近でチョークします。スロットを広げれば、同じ Cμ でも速度は下がります。')
          : T('The link to jet-flap theory treats the rounded edge as a thin jet flap whose jet leaves the way the outer flow leaves the edge; it is a rough guide, and measured circulation-control sections do better. For a given Cμ the pressure drop across the jet is Δp = Cμ q∞ c / R, whatever the slot height.', 'ジェットフラップ理論との対応は、丸い縁を、外側の流れが縁を離れる向きに噴流を出す薄いジェットフラップとみなしたもので、大まかな目安です。実測の循環制御翼はこれより成績が良くなります。Cμ が決まれば、噴流を横切る圧力差はスロットの高さによらず Δp = Cμ q∞ c / R です。'));
      };
      const P3 = (z, y) => [z[0] * SC2, y, z[1] * SC2];
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.74, maxH: 470, camera: [1.9, -4.6, 2.3], target: [0.45, 0, -0.1], fov: 30,
        init(S) {
          st.flat = false;
          const TH = S.THREE;
          st.wingU = 300;
          st.wing = S.surface(() => [0, 0, 0], { u: [0, 1], v: [-SPAN, SPAN], nu: st.wingU, nv: 6, c: 'muted', rough: 0.3, coat: 0.65, colour: () => S.colour('muted') });
          st.capMat = S.mat('plate', { metal: 0.2, rough: 0.4, coat: 0.5 });
          st.caps = [-1, 1].map(() => { const m = new TH.Mesh(new TH.BufferGeometry(), st.capMat); S.add(m); return m; });
          st.slot = S.tube([[0, -SPAN, 0], [0, SPAN, 0]], { c: 'c2', r: 0.012, glow: 0.9 });
          st.jet = S.surface(() => [0, 0, 0], { u: [0, 1], v: [-SPAN * 0.995, SPAN * 0.995], nu: 80, nv: 4, c: 'c2', opacity: 0.85, glow: 0.7, rough: 0.2, coat: 0.3 });
          st.jetFree = S.surface(() => [0, 0, 0], { u: [0, 1], v: [-SPAN * 0.995, SPAN * 0.995], nu: 60, nv: 4, c: 'c2', opacity: 0.3, glow: 0.4, rough: 0.3, coat: 0 });
          st.jetEdge = S.tube([[0, 0, 0], [0.001, 0, 0]], { c: 'c2', r: 0.006, glow: 0.9, n: 200 });
          st.tubes = Array.from({ length: CC_SEEDS.length * 2 }, (_, i) => S.tube([[0, 0, 0], [0.001, 0, 0]], { c: i % 2 ? 'c3' : 'c1', r: 0.0065, n: 160, rough: 0.35 }));
          st.smoke = S.points([[0, 0, 0]], { colours: [S.colour('hl')], r: 0.02, max: CC_SEEDS.length * 2 * CC_NP, rough: 0.3, coat: 0.2, glow: 0.4 });
          S.animate((dt) => {
            if (!st.placeSmoke || S.reduced()) return false;
            st.clock = (st.clock || 0) + Math.min(dt, 0.05) * 0.8;
            st.placeSmoke(st.clock); return true;
          });
          st.divLine = S.lines([], { c: 'hl', opacity: 0.9, w: 2.2 });
          st.flow = S.arrow([-1.75, -SPAN - 0.02, 0.62], [0.55, 0, 0], { c: 'ink', r: 0.016 });
          S.label('U', [-1.5, -SPAN - 0.02, 0.78], { math: true, small: true, align: 'middle' });
          st.lSlot = S.label(T('slot', 'スロット'), [0, 0, 0], { small: true, c: 'c2', align: 'end' });
          st.hdl = S.handle([0, 0, 0], { r: 0.05, c: 'hl', label: T('separation', 'はく離'), plane: [[0, 1, 0], [0, -SPAN - 0.03, 0]], onDrag: (q) => { const th = thNear(q.x / SC2, q.z / SC2); setSep(th); return P3(J.toZ(J.onC(th)), -SPAN - 0.03); } });
        },
        update(S) {
          const TH = S.THREE;
          const ths = profileAngles(J, st.wingU), pts = ths.map((th) => J.toZ(J.onC(th))), cps = ths.map((th) => J.cpAt(th));
          st.wing.update((u, y) => { const i = Math.round(u * st.wingU); return P3(pts[i], y); }, (u) => S.cmap.div(cpShade(cps[Math.round(u * st.wingU)])));
          const contour = pts.slice(0, -1).map((p) => new TH.Vector2(p[0] * SC2, p[1] * SC2));
          const tri = TH.ShapeUtils.triangulateShape(contour, []);
          st.caps.forEach((m, k) => {
            const y = k ? SPAN : -SPAN, pos = new Float32Array(contour.length * 3);
            contour.forEach((p, i) => { pos[3 * i] = p.x; pos[3 * i + 1] = y; pos[3 * i + 2] = p.y; });
            const g = new TH.BufferGeometry(); g.setAttribute('position', new TH.BufferAttribute(pos, 3)); g.setIndex(tri.flat()); g.computeVertexNormals();
            m.geometry.dispose(); m.geometry = g;
          });
          const zs = J.toZ(J.onC(J.thSlot)), ns = J.tangent(J.thSlot) - PI / 2;
          const sp = [zs[0] + 0.012 * Math.cos(ns), zs[1] + 0.012 * Math.sin(ns)];
          st.slot.update([P3(sp, -SPAN), P3(sp, SPAN)]);
          st.lSlot.set(P3(sp, SPAN * 0.6));
          const jp = jetPath(J, 0.016, 0.5);
          st.jetEdge.update(jp.map((q) => P3(q, -SPAN * 0.995)));
          const seg = (arr) => { const nj = arr.length - 1; return (u, y) => { const s = u * nj, i = Math.min(nj - 1, Math.floor(s)), f = s - i, p = [arr[i][0] + (arr[i + 1][0] - arr[i][0]) * f, arr[i][1] + (arr[i + 1][1] - arr[i][1]) * f]; return P3(p, y); }; };
          st.jet.update(seg(jp.slice(0, 61))); st.jetFree.update(seg(jp.slice(60)));
          const yE = -SPAN - 0.008, flow = traceCC(J, CC_SEEDS), STN = [yE - 0.01, 0];
          st.tubes.forEach((tb, i) => { const fl = flow[i >> 1], y = STN[i % 2]; tb.visible = !!fl; if (fl) tb.update(fl.pts.filter((_, k) => k % 2 === 0 || k === fl.pts.length - 1).map((q) => P3(q, y))); });
          st.placeSmoke = (clock) => {
            const pts = [];
            flow.forEach((fl, li) => STN.forEach((y, si) => {
              for (let j = 0; j < CC_NP; j++) {
                const tt = ((clock * 1.1 + fl.T * (j / CC_NP) + 0.31 * li + 0.5 * si) % fl.T + fl.T) % fl.T;
                let lo = 0, hi = fl.times.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (fl.times[mid] <= tt) lo = mid; else hi = mid; }
                const f = Math.min(1, (tt - fl.times[lo]) / Math.max(1e-9, fl.times[hi] - fl.times[lo])), a = fl.pts[lo], b = fl.pts[hi];
                pts.push(P3([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])], y));
              }
            }));
            st.smoke.update(pts, pts.map(() => S.colour('hl')), pts.map(() => 0.02));
          };
          st.placeSmoke(st.clock || 0);
          const dv = dividing(J, 2.2, 0.015), ds = []; for (let k = 0; k + 1 < dv.length; k++) ds.push([P3(dv[k], yE - 0.004), P3(dv[k + 1], yE - 0.004)]);
          st.divLine.update(ds);
          st.hdl.at(P3(J.toZ(J.onC(J.thS)), -SPAN - 0.03));
          S.fitStage?.(); S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. effector allocation ---------------- */
  const CMD = [0.03, 0.04, 0.003];                          // full-stick roll, pitch and yaw moment coefficients
  const SC3 = 1.5;
  // a thin flying wing: sharp biconvex sections about 2% thick outboard, blending into a low centre body about 3.5%
  // thick; |eta| is smoothed for the skin only, so the centreline carries no crease
  const sab = (eta) => Math.sqrt(eta * eta + 0.0025);
  const thick = (eta) => (xLE(sab(eta)) - xTE(sab(eta))) * (0.021 + 0.015 * Math.exp(-((eta / 0.3) ** 2)));
  const prof = (u, eta) => { const w = Math.exp(-((eta / 0.3) ** 2)), bic = 4 * u * (1 - u), rnd = Math.sqrt(Math.max(0, u)) * (1 - u) / 0.3849; return (1 - w) * bic + w * (0.5 * bic + 0.5 * rnd); };
  // airframe point: u from leading edge (0) to trailing edge (1), eta spanwise (right positive), side +1 upper, -1 lower; world axes X fwd, Y left, Z up
  const air = (u, eta, side) => { const c = xLE(sab(eta)) - xTE(sab(eta)), x = xLE(sab(eta)) - u * c, z = (side > 0 ? 0.6 : -0.4) * thick(eta) * prof(u, eta); return [x * SC3, -eta * SC3, z * SC3]; };
  function arcPts(c, axis, e, r, ang, n = 40) {
    const a = axis, b = [a[1] * e[2] - a[2] * e[1], a[2] * e[0] - a[0] * e[2], a[0] * e[1] - a[1] * e[0]];
    return L.seq(n + 1, (i) => { const t = ang * i / n; return [0, 1, 2].map((k) => c[k] + r * (e[k] * Math.cos(t) + b[k] * Math.sin(t))); });
  }
  D['effector-allocation'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', st.c1, T('A generic tailless aircraft with no moving control surfaces. Fourteen fluidic effectors line its trailing edges: blue slots on the upper surface spoil lift, orange slots on the lower surface add it, and teal effectors at the tips blow to make drag for yaw. Each glows in proportion to how hard it blows. The gold arcs are the roll, pitch and yaw moments delivered; faint arcs are the commands.', '可動の操縦翼面をもたない、一般的な尾翼なし機です。後縁に 14 個の流体式効果器が並びます。上面の青いスロットは揚力を減らし、下面の橙のスロットは揚力を増やし、翼端の青緑の効果器は吹き出して偏揺れ用の抗力を作ります。それぞれ、吹き出しの強さに比例して光ります。金色の弧は実際に得たロール、ピッチ、ヨーのモーメントで、薄い弧は指令値です。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The stick: drag the gold point for roll (left, right) and pitch (up, down); yaw is the slider. A hollow orange point shows what the effectors actually deliver when they cannot meet the command.', '操縦桿です。金色の点をドラッグすると、左右でロール、上下でピッチを指令します。ヨーはスライダーです。効果器が指令を満たせないときは、中抜きの橙の点が実際に得られた値を示します。'));
        st.p2 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('How hard each effector blows, as its momentum coefficient. Jets can only blow, so no bar goes below zero; gold caps mark effectors at their limit.', '各効果器の吹き出しの強さを運動量係数で示します。噴流は吹くことしかできないので、棒は 0 より下にはなりません。金色のふたは限界に達した効果器です。'));
        st.p3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const umax = v.umax / 1000, cmd = [v.roll * CMD[0], v.pitch * CMD[1], v.yaw * CMD[2]];
      const B = effectorMatrix(), R = allocate(cmd, umax, B, CMD.map((x) => 1 / x));
      const frac = R.got.map((x, k) => x / CMD[k]), nsat = R.sat.filter(Boolean).length;
      const dCL = EFFECTORS.reduce((s, e, i) => s + (e.kind === 'lift' ? e.k * R.u[i] : 0), 0), mdot = bleed(R.u);
      const colOf = (e) => (e.kind === 'drag' ? 'c3' : e.surf === 'upper' ? 'c1' : 'c2');
      const draw2d = () => {
        st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const f0 = L.fig(st.v3, { x: [-1.15, 1.15], y: [-1.1, 1.2], equal: true, axes: false, grid: false, maxH: 330 });
          const le = L.sample(-1, 1, 60, (e) => [e, xLE(e)]), tr = L.sample(1, -1, 120, (e) => [e, xTE(e)]);
          f0.poly(le.concat(tr), { c: 'muted', fill: 'muted', fo: 0.3, w: 1.4 });
          EFFECTORS.forEach((e, i) => { f0.dot(e.y + (e.kind === 'lift' ? (e.surf === 'upper' ? -0.025 : 0.025) : 0), e.x - 0.02, { c: colOf(e), r: 2.5 + 7 * R.u[i] / umax }); });
          f0.dot(0, XCG, { c: 'ink', r: 3, hollow: true }); f0.text(0, XCG, T('c.g.', '重心'), { small: true, dx: 7 });
        }
        const f = L.fig(st.p2, { x: [-1.25, 1.25], y: [-1.18, 1.18], equal: true, axes: false, grid: false, maxH: 230 });
        f.rect(-1, -1, 2, 2, { c: 'muted', w: 1.2, fill: 'plate', fo: 0.4 });
        f.seg([-1, 0], [1, 0], { c: 'muted', w: 1, op: 0.6 }); f.seg([0, -1], [0, 1], { c: 'muted', w: 1, op: 0.6 });
        f.text(1, 0, T('roll right', '右ロール'), { small: true, anchor: 'end', dy: -6 }); f.text(0, 1, T('nose up', '機首上げ'), { small: true, dx: 6, dy: 12 });
        if (!R.feasible) { f.seg([v.roll, v.pitch], [frac[0], frac[1]], { c: 'c2', w: 1.4, dash: true }); f.dot(frac[0], frac[1], { c: 'c2', r: 5, hollow: true }); }
        f.handle(v.roll, v.pitch, { c: 'hl', label: T('stick', '操縦桿'), bounds: [-1, 1, -1, 1], snap: 0.01, onDrag: (x, y) => { ctx.set('roll', x, true); ctx.set('pitch', y); } });
        const names = EFFECTORS.map((e) => e.name);
        const g = L.fig(st.p3, { x: [-0.6, 13.6], y: [0, v.umax * 1.18], aspect: 0.5, maxH: 220, ylabel: 'Cμ (×10⁻³)', ticksX: names.map((nm, i) => [i, nm]), grid: false });
        g.hline(v.umax, { c: 'muted', w: 1.2, dash: true }); g.text(13.6, v.umax, 'u_max', { small: true, anchor: 'end', dy: -5, c: 'muted' });
        EFFECTORS.forEach((e, i) => { const h = R.u[i] * 1000; if (h > 1e-9) g.rect(i - 0.34, 0, 0.68, h, { c: colOf(e), fill: colOf(e), fo: 0.8, w: 1 }); if (R.sat[i]) g.seg([i - 0.4, h], [i + 0.4, h], { c: 'hl', w: 4 }); });
        g.vline(6.5, { c: 'muted', w: 1, op: 0.5 });
        L.legend(st.leg, [{ kind: 'fill', c: 'c1', label: T('upper slot: less lift', '上面スロット：揚力を減らす') }, { kind: 'fill', c: 'c2', label: T('lower slot: more lift', '下面スロット：揚力を増やす') }, { kind: 'fill', c: 'c3', label: T('tip effector: drag for yaw', '翼端の効果器：偏揺れ用の抗力') }, { c: 'hl', label: T('moments delivered (arcs)', '得られたモーメント（弧）') }]);
        ctx.readout([
          { k: T('roll C_l: command, delivered', 'ロール C_l：指令と実際'), v: fmt(cmd[0], 3) + ', ' + fmt(R.got[0], 3), tone: Math.abs(cmd[0] - R.got[0]) > 1e-6 ? 'warn' : undefined },
          { k: T('pitch C_m: command, delivered', 'ピッチ C_m：指令と実際'), v: fmt(cmd[1], 3) + ', ' + fmt(R.got[1], 3), tone: Math.abs(cmd[1] - R.got[1]) > 1e-6 ? 'warn' : undefined },
          { k: T('yaw C_n: command, delivered', 'ヨー C_n：指令と実際'), v: fmt(cmd[2], 3) + ', ' + fmt(R.got[2], 3), tone: Math.abs(cmd[2] - R.got[2]) > 1e-7 ? 'warn' : undefined },
          { k: T('total blowing Σu, and ‖u‖', '吹き出しの合計 Σu と ‖u‖'), v: fmt(R.u.reduce((s, x) => s + x, 0) * 1000, 3) + ' ×10⁻³, ' + fmt(Math.hypot(...R.u) * 1000, 3) + ' ×10⁻³', tone: 'key' },
          { k: T('bleed air (40 m², 200 m/s at 10 km, V_j = 300 m/s)', '抽気量（40 m²、高度 10 km で 200 m/s、V_j = 300 m/s）'), v: fmt(mdot, 3) + ' kg/s', tone: 'key' },
          { k: T('lift change left to the angle of attack', '迎角で補う揚力の変化'), v: 'ΔC_L = ' + fmt(dCL, 3) },
          { k: T('effectors at their limit', '限界に達した効果器'), v: String(nsat), tone: R.feasible ? (nsat ? undefined : 'good') : 'warn' },
        ], R.feasible ? T('The allocator finds the least blowing, in the sense of the smallest ‖u‖², that delivers the commanded moments exactly with every jet between zero and its limit. Effector strengths are schematic.', '割り当て器は、すべての噴流を 0 と限界の間に保ったまま指令のモーメントをちょうど実現する、最も少ない吹き出し（‖u‖² が最小）を求めます。効果器の強さは模式的な値です。')
          : T('The command is out of reach: the allocator returns the attainable moment closest to it, each axis weighted by its full-stick value, and the least blowing that achieves that. Effector strengths are schematic.', '指令は実現できません。割り当て器は、各軸をその最大指令値で重みづけして指令に最も近い実現可能なモーメントを求め、それを最も少ない吹き出しで実現します。効果器の強さは模式的な値です。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 480, camera: [-3.3, 1.25, 5.0], target: [0.0, -0.05, -0.1], fov: 31,
        init(S) {
          st.flat = false;
          const TH = S.THREE;
          st.body = new TH.Group(); S.add(st.body);
          const grey = S.colour('muted').clone().lerp(new TH.Color(1, 1, 1), 0.38);
          const skin = { c: grey, metal: 0.08, rough: 0.52, coat: 0.35, coatRough: 0.28, add: false };
          st.up = S.surface((u, e) => air(u, e, 1), { ...skin, u: [0, 1], v: [-1, 1], nu: 70, nv: 240 });
          st.lo = S.surface((u, e) => air(u, e, -1), { ...skin, u: [0, 1], v: [-1, 1], nu: 70, nv: 240 });
          st.body.add(st.up, st.lo);
          // crisp planform edges, and faint panel seams on the upper skin (no hinge lines: nothing here moves)
          const edge = [], seams = [];
          const ring = (fn, n) => L.seq(n + 1, (k) => fn(k / n));
          const le = ring((t) => air(0, -1 + 2 * t, 1), 80), te = ring((t) => air(1, -1 + 2 * t, 1), 160);
          for (let k = 0; k < le.length - 1; k++) edge.push([le[k], le[k + 1]]);
          for (let k = 0; k < te.length - 1; k++) edge.push([te[k], te[k + 1]]);
          edge.push([air(0, -1, 1), air(1, -1, 1)], [air(0, 1, 1), air(1, 1, 1)]);
          const lift = (p) => [p[0], p[1], p[2] + 0.004];
          for (const eta of [-0.3, 0.3, -0.62, 0.62]) { const c = ring((t) => lift(air(0.04 + 0.92 * t, eta, 1)), 30); for (let k = 0; k < c.length - 1; k++) seams.push([c[k], c[k + 1]]); }
          for (const u of [0.3, 0.62]) { const c = ring((t) => lift(air(u, -0.3 + 0.6 * t, 1)), 30); for (let k = 0; k < c.length - 1; k++) seams.push([c[k], c[k + 1]]); }
          st.body.add(S.lines(edge, { c: 'ink', opacity: S.dark ? 0.55 : 0.7, w: 1.5, add: false }));
          st.body.add(S.lines(seams, { c: 'ink', opacity: S.dark ? 0.2 : 0.24, w: 1, add: false }));
          st.eff = EFFECTORS.map((e) => {
            const col = colOf(e), mat = S.mat(col, { glow: 1, rough: 0.3, coat: 0.6 });
            let pts;
            if (e.kind === 'lift') { const side = e.surf === 'upper' ? 1 : -1; pts = L.seq(11, (k) => { const p = air(0.972, (e.eta - 0.075 + 0.15 * k / 10) * Math.sign(e.side), side); return [p[0], p[1], p[2] + side * 0.003]; }); }
            else { const eta = e.eta * Math.sign(e.side); pts = L.seq(7, (k) => { const p = air(0.3 + 0.45 * k / 6, eta, 1); return [p[0], p[1] - Math.sign(e.side) * 0.0, p[2] + 0.004]; }); }
            const slot = S.tube(pts, { c: col, r: 0.008, add: false, radial: 8 });
            slot.material = mat; st.body.add(slot);
            const plumes = [0.22, 0.17, 0.13, 0.1, 0.07].map((op) => { const pl = S.surface(() => [0, 0, 0], { c: col, u: [0, 1], v: [0, 1], nu: 5, nv: 6, opacity: op, glow: 0.7, rough: 0.6, coat: 0, add: false }); pl.castShadow = false; pl.renderOrder = 2; st.body.add(pl); return pl; });
            return { e, mat, slot, plumes, col };
          });
          // moment arcs (world-fixed): roll about X, pitch about -Y (nose up), yaw about -Z (nose right)
          const mk = (op) => ({ tube: S.tube([[0, 0, 0], [0, 0, 0.01]], { c: op < 1 ? 'muted' : 'hl', r: op < 1 ? 0.007 : 0.015, opacity: op, glow: op < 1 ? 0 : 0.3 }), head: S.arrow([0, 0, 0], [0, 0, 0.1], { c: op < 1 ? 'muted' : 'hl', r: op < 1 ? 0.007 : 0.015, opacity: op, head: 0.1 }) });
          st.arcs = [0, 1, 2].map(() => ({ got: mk(1), cmd: mk(0.45) }));
          st.arcGeo = [
            { c: [(APEX + 0.05) * SC3, 0, 0.05], axis: [1, 0, 0], e: [0, 0, 1], r: 0.3 },
            { c: [(TEC - 0.45) * SC3, -0.55 * SC3, 0.05], axis: [0, -1, 0], e: [0, 0, 1], r: 0.36 },
            { c: [XCG * SC3, 0, 0.5], axis: [0, 0, -1], e: [1, 0, 0], r: 0.5 },
          ];
          S.label(T('roll', 'ロール'), [(APEX + 0.05) * SC3, -0.32, 0.12], { small: true });
          S.label(T('pitch', 'ピッチ'), [(TEC - 0.45) * SC3, -0.55 * SC3, 0.5], { small: true, align: 'middle' });
          S.label(T('yaw', 'ヨー'), [XCG * SC3 + 0.5, 0, 0.6], { small: true });
        },
        update(S) {
          const off = S.colour('ink').clone().lerp(S.colour('muted'), 0.35);
          st.eff.forEach(({ e, mat, plumes, col }, i) => {
            const k = Math.min(1, R.u[i] / umax), on = S.colour(col);
            mat.color.copy(off.clone().lerp(on, Math.min(1, 0.15 + 1.2 * k))); mat.emissive.copy(on); mat.emissiveIntensity = 1.6 * k;
            const len = 0.05 + 0.3 * Math.sqrt(k);
            plumes.forEach((pl, j) => {
              pl.visible = k > 0.005; if (!pl.visible) return;
              const L1 = len * (0.4 + 0.18 * j), wid = 0.01 + 0.012 * j;
              if (e.kind === 'lift') {
                const side = e.surf === 'upper' ? 1 : -1, ang = side * 16 * DEG;
                pl.update((s, t) => { const eta = (e.eta - 0.075 + 0.15 * t) * Math.sign(e.side), p = air(1, eta, side), th = side * wid * s * (t * (1 - t) * 4); return [p[0] - s * L1 * Math.cos(ang), p[1], p[2] + s * L1 * Math.sin(ang) + th * 0.5]; });
              } else {
                const eta = e.eta * Math.sign(e.side), out = -Math.sign(e.side);
                pl.update((s, t) => { const p = air(0.3 + 0.45 * t, eta, 1); return [p[0] - s * L1 * 0.35, p[1] + out * s * L1 * 0.5, p[2] + s * L1 * (0.5 + j * 0.1)]; });
              }
            });
          });
          // a modest tilt toward the delivered moments (body: x fwd, y right, z down; world: X fwd, Y left, Z up)
          st.body.rotation.set(4.5 * DEG * frac[0], -3.5 * DEG * frac[1], -4.5 * DEG * frac[2], 'ZYX');
          st.arcs.forEach((A, k) => {
            const G = st.arcGeo[k];
            for (const [obj, val] of [[A.got, frac[k]], [A.cmd, cmd[k] / CMD[k]]]) {
              const ang = Math.max(-1, Math.min(1, val)) * 1.5 * PI;
              if (Math.abs(ang) < 0.05) { obj.tube.visible = false; obj.head.visible = false; continue; }
              const pts = arcPts(G.c, G.axis, G.e, G.r, ang);
              obj.tube.update(pts.slice(0, -3)); obj.tube.visible = true;
              const a = pts[pts.length - 4], b = pts[pts.length - 1];
              obj.head.set(a, [b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
            }
          });
          S.fitStage?.(); S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
