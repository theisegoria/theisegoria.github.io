'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI, log10 = Math.log10;

  /* ---------------- models (no DOM) ---------------- */
  const G = 6.6743e-11, CL = 299792458, HP = 6.62607015e-34, HB = HP / TAU, ME = 9.1093837015e-31, MU = 1.66053906660e-27;
  const KB = 1.380649e-23, SIG = 5.670374419e-8, MSUN = 1.98847e30, RSUN = 6.957e8, LSUN = 3.828e26, TSUN = 5772, REARTH = 6.371e6;
  const YR = 365.25 * 86400, MH = 1.6735575e-27;

  // --- Lane-Emden: theta'' + (2/xi) theta' + theta^n = 0, theta(0) = 1, theta'(0) = 0 (cached per n) ---
  const leCache = new Map();
  function lane(n) {
    n = Math.round(n * 1000) / 1000;
    if (leCache.has(n)) return leCache.get(n);
    const h = n > 3.6 ? 0.004 : 0.002, cap = 300000;
    const X = [0], Th = [1], Dt = [0];
    let xi = 1e-4, th = 1 - xi * xi / 6 + n * xi ** 4 / 120, dt = -xi / 3 + n * xi ** 3 / 30;
    X.push(xi); Th.push(th); Dt.push(dt);
    const f = (x, t, d) => [d, -Math.pow(Math.max(t, 0), n) - 2 * d / x];
    let xi1 = NaN, dth1 = NaN;
    for (let i = 0; i < cap; i++) {
      const k1 = f(xi, th, dt), k2 = f(xi + h / 2, th + h / 2 * k1[0], dt + h / 2 * k1[1]), k3 = f(xi + h / 2, th + h / 2 * k2[0], dt + h / 2 * k2[1]), k4 = f(xi + h, th + h * k3[0], dt + h * k3[1]);
      const th2 = th + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dt2 = dt + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (th2 <= 0) { const s = th / (th - th2); xi1 = xi + s * h; dth1 = dt + s * (dt2 - dt); X.push(xi1); Th.push(0); Dt.push(dth1); break; }
      xi += h; th = th2; dt = dt2; X.push(xi); Th.push(th); Dt.push(dt);
    }
    const D1 = -xi1 * xi1 * dth1;
    const o = { n, xi1, D: D1, X, Th, Dt };
    leCache.set(n, o);
    return o;
  }
  const bis = (X, x) => { let lo = 0, hi = X.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (X[m] <= x) lo = m; else hi = m; } return lo; };
  // theta, theta' at xi (linear interpolation of the tabulated solution)
  function leAt(le, xi) {
    if (xi <= 0) return [1, 0];
    if (xi >= le.xi1) return [0, le.Dt[le.Dt.length - 1]];
    const i = bis(le.X, xi), t = (xi - le.X[i]) / (le.X[i + 1] - le.X[i]);
    return [le.Th[i] + t * (le.Th[i + 1] - le.Th[i]), le.Dt[i] + t * (le.Dt[i + 1] - le.Dt[i])];
  }
  // profile at fractional radius s = r/R
  function profile(n, s) {
    const le = lane(n), xi = s * le.xi1, [th, dt] = leAt(le, xi);
    const rho = Math.pow(Math.max(th, 0), n), P = Math.pow(Math.max(th, 0), n + 1);
    return { xi, theta: th, rho, P, T: Math.max(th, 0), m: xi * xi * (-dt) / le.D };
  }
  const rhoRatio = (n) => { const le = lane(n); return le.xi1 ** 3 / (3 * le.D); };                     // rho_c / mean density
  const pcCoef = (n) => { const le = lane(n); return le.xi1 ** 4 / (4 * Math.PI * (n + 1) * le.D ** 2); }; // P(0) / (G M^2 / R^4)
  const tcCoef = (n) => 4 * Math.PI / 3 * pcCoef(n) / rhoRatio(n);                                      // k T(0) / (mu m_u) / (G M / R)
  const bindCoef = (n) => 3 / (5 - n);                                                                    // |Omega| / (G M^2 / R)
  function massRadius(n, frac) {                                                                         // r/R inside which the mass fraction is frac
    let lo = 0, hi = 1;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (profile(n, mid).m < frac) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // physical scales for a star of mass M (Msun) and radius R (Rsun); mu = mean molecular weight
  function physical(n, Mss, Rss, mu) {
    const M = Mss * MSUN, R = Rss * RSUN, rbar = 3 * M / (4 * Math.PI * R ** 3);
    const rc = rhoRatio(n) * rbar, Pc = pcCoef(n) * G * M * M / R ** 4;
    const Tc = tcCoef(n) * mu * MU * G * M / (R * KB);
    return { rbar, rhoc: rc, Pc, Tc, omega: bindCoef(n) * G * M * M / R };
  }

  // --- main sequence (empirical piecewise power laws, masses and radii in solar units) ---
  const msL = (m) => (m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : m < 55 ? 1.4 * Math.pow(m, 3.5) : 32000 * m);
  const msR = (m) => (m < 1 ? Math.pow(m, 0.9) : Math.pow(m, 0.6));
  const teffOf = (L, R) => TSUN * Math.pow(L / (R * R), 0.25);                                      // Stefan-Boltzmann, solar units
  const radiusOf = (L, T) => Math.sqrt(L) * Math.pow(TSUN / T, 2);
  const lumOf = (R, T) => R * R * Math.pow(T / TSUN, 4);
  const lifetimeYr = (m, L) => 0.1 * 0.007 * m * MSUN * CL * CL / (L * LSUN) / YR;                  // 10% of the hydrogen, 0.7% of mc^2
  const WIEN = 2.897771955e-3;
  const wienNm = (T) => WIEN / T * 1e9;
  const planck = (lamNm, T) => { const l = lamNm * 1e-9, x = HP * CL / (l * KB * T); return 2 * HP * CL * CL / Math.pow(l, 5) / (Math.exp(x) - 1); };
  const lamB = (lamNm, T) => lamNm * planck(lamNm, T);                                               // lambda B_lambda (per unit ln lambda)

  // colour of a black body: Wyman-Sloan-Shirley fit to the CIE 1931 observer, then linear sRGB
  const gl = (l, mu, s1, s2) => { const t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  const cieX = (l) => 1.056 * gl(l, 599.8, 37.9, 31.0) + 0.362 * gl(l, 442.0, 16.0, 26.7) - 0.065 * gl(l, 501.1, 20.4, 26.2);
  const cieY = (l) => 0.821 * gl(l, 568.8, 46.9, 40.5) + 0.286 * gl(l, 530.9, 16.3, 31.1);
  const cieZ = (l) => 1.217 * gl(l, 437.0, 11.8, 36.0) + 0.681 * gl(l, 459.0, 26.0, 13.8);
  const toRGB = (X, Y, Z) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
  const gam = (u) => { u = Math.min(1, Math.max(0, u)); return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055; };
  function fitRGB(c) {                                         // bring out-of-gamut colours in by desaturating, then scale to the brightest channel
    const mn = Math.min(c[0], c[1], c[2]); if (mn < 0) c = c.map((u) => u - mn);
    const mx = Math.max(c[0], c[1], c[2]) || 1; return c.map((u) => gam(u / mx));
  }
  function bbRGB(T) {
    let X = 0, Y = 0, Z = 0;
    for (let l = 380; l <= 780; l += 5) { const b = planck(l, T); X += b * cieX(l); Y += b * cieY(l); Z += b * cieZ(l); }
    return fitRGB(toRGB(X, Y, Z));
  }
  const monoRGB = (l) => fitRGB(toRGB(cieX(l), cieY(l), cieZ(l)));
  const hex = (c) => '#' + c.map((u) => Math.round(u * 255).toString(16).padStart(2, '0')).join('');
  const bbHex = (T) => hex(bbRGB(T));
  // the same colour with its saturation raised, for the glowing spheres: the eye adapts to a star's white point, a picture cannot
  const bbShow = (T) => { const c = bbRGB(T), m = (c[0] + c[1] + c[2]) / 3; return hex(c.map((u) => Math.min(1, Math.max(0, m + 1.7 * (u - m))))); };
  const spClass = (T) => (T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M');

  // --- cold degenerate electron gas (Chandrasekhar 1935), SI throughout ---
  const A_CH = Math.PI * Math.pow(ME, 4) * Math.pow(CL, 5) / (3 * Math.pow(HP, 3));
  const rhoOfX = (x, mue) => mue * MU * Math.pow(ME * CL / HB, 3) * x ** 3 / (3 * Math.PI ** 2);
  const xOfRho = (rho, mue) => Math.cbrt(rho * 3 * Math.PI ** 2 / (mue * MU) / Math.pow(ME * CL / HB, 3));
  const pDeg = (x) => A_CH * (x * (2 * x * x - 3) * Math.sqrt(1 + x * x) + 3 * Math.asinh(x));
  // hydrostatic equilibrium dP/dr = -G m rho / r^2 in u = x^2 (regular at the surface where x -> 0)
  function whiteDwarf(rhoc, mue, keep) {
    const B = mue * MU * Math.pow(ME * CL / HB, 3) / (3 * Math.PI ** 2);
    const xc = xOfRho(rhoc, mue), uc = xc * xc;
    const Rest = Math.sqrt(4e13 / (G * rhoc)) * 0.5, h = Math.max(2e3, Rest / (keep ? 800 : 250));
    let r = h * 0.01, m = 4 / 3 * Math.PI * r ** 3 * rhoc, u = uc;
    const du = (r_, m_, u_) => -G * m_ * B * Math.sqrt(1 + Math.max(u_, 0)) / (4 * A_CH * r_ * r_);
    const dm = (r_, u_) => 4 * Math.PI * r_ * r_ * B * Math.pow(Math.max(u_, 0), 1.5);
    const prof = keep ? [[0, 1]] : null;
    for (let i = 0; i < 400000; i++) {
      const a1 = du(r, m, u), b1 = dm(r, u);
      const a2 = du(r + h / 2, m + h / 2 * b1, u + h / 2 * a1), b2 = dm(r + h / 2, u + h / 2 * a1);
      const a3 = du(r + h / 2, m + h / 2 * b2, u + h / 2 * a2), b3 = dm(r + h / 2, u + h / 2 * a2);
      const a4 = du(r + h, m + h * b3, u + h * a3), b4 = dm(r + h, u + h * a3);
      const u2 = u + h / 6 * (a1 + 2 * a2 + 2 * a3 + a4), m2 = m + h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
      if (u2 <= 0) { const s = u / (u - u2); r += s * h; m += s * (m2 - m); if (keep) prof.push([r, 0]); break; }
      r += h; m = m2; u = u2; if (keep) prof.push([r, Math.pow(u, 1.5) / Math.pow(uc, 1.5)]);
    }
    const out = { rhoc, xc, mue, R: r, M: m, Msun: m / MSUN, Rearth: r / REARTH, Rsun: r / RSUN, Pc: pDeg(xc) };
    if (keep) out.prof = prof.map(([rr, d]) => [rr / r, d]);
    return out;
  }
  const wdCache = new Map();
  function wdTable(mue) {
    if (wdCache.has(mue)) return wdCache.get(mue);
    const rows = []; for (let i = 0; i <= 120; i++) { const lg = 5 + i * 0.05; rows.push(Object.assign(whiteDwarf(Math.pow(10, lg + 3), mue), { lg })); }   // lg = log10 of the central density in g/cm^3
    wdCache.set(mue, rows); return rows;
  }
  // closed forms from the two polytropes the equation of state interpolates between
  const KNR = (mue) => Math.pow(3 / Math.PI, 2 / 3) * HP * HP / (20 * ME * Math.pow(mue * MU, 5 / 3));
  const KUR = (mue) => Math.cbrt(3 / Math.PI) * HP * CL / (8 * Math.pow(mue * MU, 4 / 3));
  const chandraMass = (mue) => 4 * Math.PI * lane(3).D * Math.pow(KUR(mue) / (Math.PI * G), 1.5) / MSUN;
  const nrRadius = (Mss, mue) => { const le = lane(1.5); return le.xi1 * Math.cbrt(4 * Math.PI * le.D) * 5 * KNR(mue) / (8 * Math.PI * G) * Math.pow(Mss * MSUN, -1 / 3); };

  const M = { G, CL, HP, ME, MU, KB, SIG, MSUN, RSUN, LSUN, TSUN, REARTH, lane, leAt, profile, rhoRatio, pcCoef, tcCoef, bindCoef, massRadius, physical, msL, msR, teffOf, radiusOf, lumOf, lifetimeYr, wienNm, planck, bbRGB, bbHex, monoRGB, bbShow, spClass, xOfRho, rhoOfX, pDeg, whiteDwarf, wdTable, KNR, KUR, chandraMass, nrRadius };
  (window.LabModels = window.LabModels || {})['stellar-astrophysics'] = M;
  const MUES = [2, 56 / 26, 1];
  const SUPD = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = (k) => (k === 0 ? '1' : '10' + String(k).split('').map((c) => SUPD[c]).join(''));

  /* ---------------- shared layout: a picture (3D) and a 2D figure under it, and a second 2D figure beside ---------------- */
  function frame(ctx, caps) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    L.h('p', 'lab-cap', st.c1, caps[0]);
    st.v3 = L.h('div', '', st.c1);
    if (caps[2]) { L.h('p', 'lab-cap', st.c1, caps[2]); st.g1 = L.h('div', '', st.c1); }
    L.h('p', 'lab-cap', st.c2, caps[1]);
    st.g2 = L.h('div', '', st.c2);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  // two spheres side by side on the x axis, framed so both fit: the camera looks along +y
  function aimPair(S, ra, rb, fov, aspect) {
    const gap = 0.45 * Math.max(ra, rb), W = 2 * ra + 2 * rb + gap, half = Math.tan(fov * PI / 360), mr = Math.max(ra, rb);
    const d = Math.max(0.62 * W * aspect / half, 1.85 * mr / half);
    S.camera.near = d * 0.02; S.camera.far = d * 12; S.camera.updateProjectionMatrix();
    S.look([0, -d, 0.16 * d], [0, 0, 0], true);
    return [-W / 2 + ra, W / 2 - rb, W];
  }
  // a thin ring that marks a body too small to see at this scale (the camera looks along +y, so the ring lies in the xz plane)
  const makeRing = (S) => { const r = S.tube(L.seq(49, (i) => [Math.cos(TAU * i / 48), 0, Math.sin(TAU * i / 48)]), { c: 'ink', r: 0.012, closed: true, opacity: 0.8 }); r.visible = false; return r; };
  const locate = (S, ring, x, rr, W) => { const r = 0.05 * W, on = rr < 0.03 * W; ring.visible = on; if (on) { ring.position.set(x, 0, 0); ring.scale.setScalar(r); } S.invalidate(); return on ? r : rr; };
  // a luminous body: a dim lit surface under an emissive layer of the black-body colour, so it does not wash out to white
  const tint = (m, hex, k = 0.1) => { if (m.material.userData.limb) { m.material.color.set(hex); return; } m.material.color.set(hex).multiplyScalar(k); if (m.material.emissive) m.material.emissive.set(hex); };

  /* ---------------- 1. the Hertzsprung-Russell diagram ---------------- */
  const HRX = [4.85, 3.3], HRY = [-4.3, 7.1], MSLO = -1, MSHI = 1.75;
  const msPoint = (lm) => { const m = Math.pow(10, lm), l = msL(m), r = msR(m); return [log10(teffOf(l, r)), log10(l)]; };
  const CATALOGUE = [['Sirius B', 25200, 0.056, 'start', 8, 14], ['Sirius A', 9940, 25.4, 'start', 9, 4], ['Rigel', 12100, 1.2e5, 'start', 9, 4], ['Betelgeuse', 3600, 1.1e5, 'end', -9, 4]];
  const CLASSES = [['O', 30000, 63000], ['B', 10000, 30000], ['A', 7500, 10000], ['F', 6000, 7500], ['G', 5200, 6000], ['K', 3700, 5200], ['M', 2000, 3700]];
  function starOf(v) {
    if (Math.round(v.mode ?? 0) === 0) { const m = Math.pow(10, v.logM ?? 0), l = msL(m), r = msR(m); return { mode: 0, M: m, L: l, R: r, T: teffOf(l, r) }; }
    const t = Math.pow(10, v.logT ?? 3.76), r = Math.pow(10, v.logR ?? 0); return { mode: 1, M: NaN, L: lumOf(r, t), R: r, T: t };
  }
  const nearestMS = (lt, ll) => {
    let best = MSLO, bd = 1e9;
    for (let i = 0; i <= 350; i++) { const lm = MSLO + (MSHI - MSLO) * i / 350, [x, y] = msPoint(lm); const d = ((x - lt) / 1.5) ** 2 + ((y - ll) / 10.5) ** 2; if (d < bd) { bd = d; best = lm; } }
    return best;
  };
  const fmtRad = (R) => (R < 0.1 ? fmt(R, 4) : R < 10 ? fmt(R, 2) : fmt(R, 0));
  D['star-hr'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The star drawn to scale beside the Sun (radius 1). Its colour is that of a black body at its surface temperature, with the saturation raised so the differences show.', '太陽（半径 1）と並べた、縮尺どおりの星です。色は表面温度の黒体の色で、違いが見えるよう彩度を上げています。'), T('Hertzsprung–Russell diagram: luminosity against surface temperature, hot on the left. Dashed lines are circles of constant radius. Drag the gold point.', 'ヘルツシュプルング・ラッセル図です。縦軸は光度、横軸は表面温度で、高温が左です。破線は半径が一定の線で、金色の点をドラッグできます。'), T('Its light, Bλ(T) relative to its own peak. The coloured area is the visible band.', 'その星の光、Bλ(T) を自分のピークに対する比で示します。色のついた部分が可視光の帯です。')]);
      const s = starOf(v); st.star = s;
      const lt = log10(s.T), ll = log10(s.L);
      /* the HR diagram */
      st.g2.replaceChildren();
      const ticksX = [40000, 20000, 10000, 6000, 4000].map((t) => [log10(t), String(t)]);
      const ticksY = [-4, -2, 0, 2, 4, 6].map((k) => [k, pow10(k)]);
      const f = L.fig(st.g2, { x: HRX, y: HRY, aspect: 1.02, maxH: 560, xlabel: T('surface temperature T (K)', '表面温度 T（K）'), ylabel: T('luminosity L / L☉', '光度 L / L☉'), ticksX, ticksY, grid: false });
      for (const [k, t0, t1] of CLASSES) {
        if (t0 < 60000) f.vline(log10(t0), { c: 'grid', w: 1, dash: '2 5', layer: 'under' });
        f.text((log10(Math.min(t1, 63000)) + log10(t0)) / 2, -4.12, k, { c: 'muted', small: true, layer: 'under' });
      }
      for (const R of [0.01, 0.1, 1, 10, 100, 1000]) {
        const lg = (x) => 2 * log10(R) + 4 * (x - log10(TSUN));
        f.line([[HRX[1], lg(HRX[1])], [HRX[0], lg(HRX[0])]], { c: 'muted', w: 1, dash: '3 5', op: 0.8, layer: 'under' });
        const xl = Math.max(3.36, log10(TSUN) + (-3.5 - 2 * log10(R)) / 4);
        f.text(xl, lg(xl), R >= 1 ? `${fmt(R, 0)} R☉` : `${fmt(R, 2)} R☉`, { c: 'muted', small: true, anchor: 'end', dy: 13, layer: 'under' });
      }
      const ms = L.seq(121, (i) => msPoint(MSLO + (MSHI - MSLO) * i / 120));
      f.line(ms, { c: 'c1', w: 3, layer: 'main' });
      for (const m of [0.1, 0.3, 1, 3, 10, 30]) { const [x, y] = msPoint(log10(m)), hotEnd = m >= 10; f.dot(x, y, { c: 'c1', r: 3.2, layer: 'main' }); f.text(x, y, `${fmt(m, 1)} M☉`, { c: 'c1', small: true, anchor: hotEnd ? 'start' : 'end', dx: hotEnd ? 9 : -7, dy: hotEnd ? 1 : 13, layer: 'main' }); }
      for (const [name, t, l, an, dx, dy] of CATALOGUE) { f.dot(log10(t), log10(l), { c: 'ink', r: 3.4, hollow: true, layer: 'main' }); f.text(log10(t), log10(l), name, { c: 'ink', small: true, anchor: an, dx, dy, layer: 'main' }); }
      f.text(3.66, 2.55, T('giants', '巨星'), { c: 'muted', small: true, layer: 'under' });
      f.text(3.9, 5.75, T('supergiants', '超巨星'), { c: 'muted', small: true, layer: 'under' });
      f.text(4.25, -3.3, T('white dwarfs', '白色矮星'), { c: 'muted', small: true, layer: 'under' });
      f.handle(lt, ll, { c: 'hl', r: 9, label: T('The star: drag along the main sequence, or anywhere in "any star" mode', '星：主系列に沿って、または「任意の星」モードでは自由にドラッグ'), bounds: [HRX[1], HRX[0], HRY[0], HRY[1]],
        onDrag: (x, y) => {
          if (s.mode === 0) ctx.set('logM', Math.round(nearestMS(x, y) * 100) / 100);
          else { ctx.set('logT', x, true); ctx.set('logR', (y - 4 * (x - log10(TSUN))) / 2); }
        } });
      /* the spectrum */
      if (st.g1) {
        st.g1.replaceChildren();
        const g = L.fig(st.g1, { x: [1.5, 3.6], y: [0, 1.32], aspect: 0.5, maxH: 300, xlabel: T('wavelength λ (nm)', '波長 λ（nm）'), ylabel: T('Bλ / peak', 'Bλ / ピーク'), ticksX: [[2, '100'], [2.477, '300'], [3, '1000'], [3.477, '3000']], ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']], grid: false });
        const Tk = s.T, lamMax = wienNm(Tk), pk = planck(lamMax, Tk), rel = (x) => planck(Math.pow(10, x), Tk) / pk;
        const C = L.colours(), cache = new Map(), mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        g.raster((x, y) => {
          const k = Math.round(x * 500); let e = cache.get(k);
          if (!e) { const lam = Math.pow(10, x); e = { b: rel(x), c: lam >= 380 && lam <= 750 ? monoRGB(lam).map((u) => u * 255) : mixc(C.plate, C.muted, 0.3) }; cache.set(k, e); }
          return y <= e.b ? e.c : C.plate;
        }, { res: 2 });
        if (Math.abs(Tk - TSUN) > 40) g.line(L.sample(1.5, 3.6, 160, (x) => planck(Math.pow(10, x), TSUN) / planck(wienNm(TSUN), TSUN)), { c: 'muted', w: 1.4, dash: '4 3' });
        g.line(L.sample(1.5, 3.6, 220, (x) => rel(x)), { c: 'ink', w: 2.2 });
        g.text(log10(565), 1.23, T('visible light', '可視光'), { c: 'muted', small: true });
        const lx = log10(lamMax);
        g.dot(lx, 1, { c: 'hl', r: 5 });
        g.text(lx, 1, `λ peak = ${fmt(lamMax, 0)} nm`, { c: 'ink', small: true, anchor: lx < 2.7 ? 'start' : 'end', dx: lx < 2.7 ? 9 : -9, dy: -7 });
      }
      /* readout and legend */
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('main sequence (empirical fit)', '主系列（経験的な近似）') }, { c: 'muted', dash: true, label: T('constant radius, L = 4πR²σT⁴', '半径一定、L = 4πR²σT⁴') }, { kind: 'dot', c: 'hl', label: T('this star', 'この星') }, { c: 'muted', dash: true, label: T('Sun’s spectrum', '太陽のスペクトル') }]);
      const items = [];
      if (s.mode === 0) items.push({ k: T('mass', '質量'), v: fmt(s.M, 2) + ' M☉', tone: 'key' });
      items.push({ k: 'L', v: fmt(s.L, s.L < 10 ? 3 : 0) + ' L☉', tone: s.mode ? 'key' : undefined }, { k: 'R', v: fmtRad(s.R) + ' R☉' }, { k: T('T (surface)', 'T（表面）'), v: fmt(s.T, 0) + ' K' }, { k: T('class', 'スペクトル型'), v: spClass(s.T) }, { k: T('peak λ', 'ピーク波長'), v: fmt(wienNm(s.T), 0) + ' nm' });
      if (s.mode === 0) items.push({ k: T('hydrogen-burning life', '水素燃焼の寿命'), v: lifetimeYr(s.M, s.L) >= 1e9 ? fmt(lifetimeYr(s.M, s.L) / 1e9, 2) + ' Gyr' : fmt(lifetimeYr(s.M, s.L) / 1e6, 1) + ' Myr' });
      ctx.readout(items, s.mode === 0
        ? T('Along the main sequence L rises far faster than M, so a heavy star burns through its fuel much sooner: t ≈ 10 Gyr × (M/M☉)/(L/L☉). The mass–luminosity and mass–radius laws are empirical fits to measured binaries; temperature then follows exactly from L = 4πR²σT⁴.', '主系列では L が M よりずっと速く増えるので、重い星ほど燃料をはるかに早く使い切ります。寿命は t ≈ 10 Gyr × (M/M☉)/(L/L☉) です。質量光度関係と質量半径関係は連星の観測にあてはめた経験則で、温度は L = 4πR²σT⁴ から厳密に決まります。')
        : T('Every point of the diagram fixes a radius, R/R☉ = √(L/L☉) (T☉/T)². A cool star that is also luminous must be enormous, a hot faint one tiny: this is how giants and white dwarfs were recognised.', '図のどの点にも半径が決まります。R/R☉ = √(L/L☉) (T☉/T)² です。冷たくて明るい星は巨大でなければならず、熱くて暗い星は小さくなければなりません。巨星と白色矮星はこうして見分けられました。'));
      /* the 3D picture */
      const place = (S) => {
        const R = st.star.R, [xa, xb, W] = aimPair(S, 1, R, 30, 0.62), hx = bbShow(st.star.T);
        const ra = locate(S, st.ringA, xa, 1, W), rb = locate(S, st.ringB, xb, R, W);
        st.sunM.at([xa, 0, 0]); tint(st.sunM, bbShow(TSUN));
        st.starM.scale.setScalar(R); st.starM.at([xb, 0, 0]); tint(st.starM, hx);
        st.halo1.scale.setScalar(R * 1.05); st.halo1.at([xb, 0, 0]); tint(st.halo1, hx, 1);
        st.halo2.scale.setScalar(R * 1.2); st.halo2.at([xb, 0, 0]); tint(st.halo2, hx, 1);
        st.lSun.set([xa, 0, ra * 1.04], T('Sun', '太陽'));
        st.lStar.set([xb, 0, rb * 1.04], `${fmtRad(R)} R☉` + (R < 0.5 ? ` = ${fmt(R * RSUN / REARTH, 1)} R⊕` : ''));
        S.fitStage?.(); S.invalidate();
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.62, maxH: 430, camera: [0, -9, 1.4], target: [0, 0, 0], fov: 30, minDistance: 0.2, maxDistance: 20000,
        init(S) {
          st.flat = false;
          const sun = bbShow(TSUN);
          st.sunM = S.sphere([0, 0, 0], 1, { c: sun, limb: 0.62 });
          st.starM = S.sphere([0, 0, 0], 1, { c: sun, limb: 0.62 });
          st.halo1 = S.sphere([0, 0, 0], 1.05, { c: sun, opacity: 0.09, glow: 0.5, coat: 0 });
          st.halo2 = S.sphere([0, 0, 0], 1.2, { c: sun, opacity: 0.035, glow: 0.5, coat: 0 });
          st.lSun = S.label('', [0, 0, 1], { small: true, align: 'middle' }); st.lStar = S.label('', [0, 0, 1], { small: true, align: 'middle' });
          st.ringA = makeRing(S); st.ringB = makeRing(S);
          place(S);
        },
        update(S) { place(S); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const R = st.star.R, W = 2 + 2 * R + 0.45 * Math.max(1, R), g = L.fig(st.v3, { x: [-W / 2 - 0.2, W / 2 + 0.2], y: [-W / 4 - 0.2, W / 4 + 0.2], equal: true, axes: false, maxH: 300 });
          g.circle(-W / 2 + 1, 0, 1, { c: 'hl', fill: true, fo: 0.5 }); g.circle(W / 2 - R, 0, R, { c: 'c2', fill: true, fo: 0.5 });
          g.text(-W / 2 + 1, 0, T('Sun', '太陽'), { c: 'ink', small: true }); g.text(W / 2 - R, 0, `${fmtRad(R)} R☉`, { c: 'ink', small: true });
        },
      });
    },
  };

  /* ---------------- 2. hydrostatic equilibrium: the polytrope ---------------- */
  const FN = 56;
  const dens2v = (rho) => L.clamp(1 + log10(Math.max(rho, 1e-6)) / 3.5, 0, 1);
  // incandescent ramp for density: deep violet, crimson, orange, amber, cream
  const HOT = [[0.16, 0.05, 0.3], [0.62, 0.1, 0.25], [0.89, 0.34, 0.14], [1, 0.71, 0.15], [1, 0.96, 0.76]];
  const hotRGB = (v) => { const t = L.clamp(v, 0, 1) * (HOT.length - 1), i = Math.min(HOT.length - 2, Math.floor(t)), u = t - i, a = HOT[i], b = HOT[i + 1]; return [0, 1, 2].map((k) => 255 * (a[k] + (b[k] - a[k]) * u)); };
  const hot = (TH, v) => { const c = hotRGB(v); return new TH.Color(c[0] / 255, c[1] / 255, c[2] / 255); };
  const arcA = (r) => L.seq(41, (i) => { const t = PI * i / 40; return [r * Math.sin(t), -0.006, r * Math.cos(t)]; });
  const arcB = (r) => L.seq(41, (i) => { const t = PI * i / 40; return [0.006, -r * Math.sin(t), r * Math.cos(t)]; });
  D['star-polytrope'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('A star cut open. Colour on the cut faces is density ρ/ρ(0) on a log scale (bright is dense); the two rings enclose 50% and 90% of the mass. Drag the gold probe along the equator.', '切り開いた星です。切断面の色は密度 ρ/ρ(0) の対数で、明るいほど高密度です。二つの輪は質量の 50% と 90% を囲みます。金色の探針を赤道に沿ってドラッグしてください。'), T('Structure against fractional radius. Everything here follows from one dimensionless equation, the Lane–Emden equation, with only the index n chosen.', '半径に対する構造です。ここにあるものは、指数 n だけを選んだ無次元の方程式、レーン・エムデン方程式からすべて決まります。')]);
      const n = v.n, mass = v.mass, rad = v.rad, mu = v.mu, sp = v.s;
      const le = lane(n), ph = physical(n, mass, rad, mu), pr = profile(n, sp);
      const rh = massRadius(n, 0.5), r9 = massRadius(n, 0.9);
      st.pn = n; st.pv = { n, sp, rh, r9 };
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 1], y: [0, 1.2], aspect: 0.8, maxH: 440, xlabel: T('fractional radius r / R', '半径の割合 r / R'), ylabel: T('relative to the centre', '中心に対する比'), ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      const N = 160, X = (i) => i / N;
      g.line(L.seq(N + 1, (i) => [X(i), profile(n, X(i)).rho]), { c: 'c1', w: 2.6 });
      g.line(L.seq(N + 1, (i) => [X(i), profile(n, X(i)).P]), { c: 'c2', w: 2.2 });
      g.line(L.seq(N + 1, (i) => [X(i), profile(n, X(i)).T]), { c: 'c3', w: 2.2, dash: '6 4' });
      g.line(L.seq(N + 1, (i) => [X(i), profile(n, X(i)).m]), { c: 'c4', w: 2.2 });
      g.vline(sp, { c: 'hl', w: 1.6, dash: false });
      g.dot(sp, pr.rho, { c: 'c1' }); g.dot(sp, pr.P, { c: 'c2' }); g.dot(sp, pr.T, { c: 'c3' }); g.dot(sp, pr.m, { c: 'c4' });
      g.vline(rh, { c: 'muted', w: 1, dash: '2 4' });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: 'ρ/ρ(0) = θⁿ' }, { c: 'c2', label: 'P/P(0) = θⁿ⁺¹' }, { c: 'c3', dash: true, label: T('T/T(0) = θ (ideal gas)', 'T/T(0) = θ（理想気体）') }, { c: 'c4', label: 'm(r)/M' }, { c: 'muted', dash: true, label: T('half of the mass inside', '質量の半分がこの内側') }, { kind: 'dot', c: 'hl', label: T('probe', '探針') }]);
      const kM = ph.rhoc / 1000;
      ctx.readout([
        { k: 'ρ(0) / ρ̄', v: fmt(rhoRatio(n), 3), tone: 'key' }, { k: 'ξ₁', v: fmt(le.xi1, 4) },
        { k: 'ρ(0)', v: fmt(kM, 3) + ' g/cm³' }, { k: 'P(0)', v: fmt(ph.Pc, 3) + ' Pa' }, { k: 'T(0)', v: fmt(ph.Tc / 1e6, 2) + ' MK', tone: 'key' },
        { k: T('|Ω|', '|Ω|'), v: fmt(bindCoef(n), 3) + ' GM²/R' },
        { k: T('probe: m(r)/M', '探針：m(r)/M'), v: fmt(pr.m, 3) }, { k: T('probe: ρ', '探針：ρ'), v: fmt(pr.rho * kM, 3) + ' g/cm³' }, { k: T('probe: T', '探針：T'), v: fmt(pr.T * ph.Tc / 1e6, 2) + ' MK' },
      ], n >= 4.4 ? T('As n approaches 5 the star gains an ever denser core and a long, thin envelope: the radius ξ₁ grows without bound at n = 5, and for n > 5 the solution never reaches zero density.', 'n が 5 に近づくと中心は限りなく密になり、外層は長く薄くなります。n = 5 で半径 ξ₁ は発散し、n > 5 では密度がゼロになりません。')
        : T('Raise n and the star centrally condenses: the same mass sits in a denser core. n = 1.5 is a fully convective star or a non-relativistic degenerate gas; n = 3 is the radiative standard model, and the ultra-relativistic degenerate limit. The central temperature is T(0) ≈ c μ mᵤ G M / (k R), with c a number fixed by n.', 'n を上げると星は中心に集中し、同じ質量がより密な核に入ります。n = 1.5 は完全に対流する星または非相対論的な縮退ガス、n = 3 は放射平衡の標準モデルで、超相対論的な縮退の極限でもあります。中心温度は T(0) ≈ c μ mᵤ G M / (k R) です（c は n で決まる数）。'));
      const faceCol = (S) => (u) => hot(S.THREE, dens2v(profile(st.pn, u).rho));
      const upd = (S) => {
        if (st.drawn !== n) { st.faceA.update(undefined, faceCol(S)); st.faceB.update(undefined, faceCol(S)); st.drawn = n; }
        st.rA1.update(arcA(rh)); st.rB1.update(arcB(rh)); st.rA2.update(arcA(r9)); st.rB2.update(arcB(r9));
        st.probe.at([sp, -0.01, 0]);
        st.lab.set(arcA(rh)[8], T('half the mass', '質量の半分'));
        S.invalidate();
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 500, camera: [3.0, -3.9, 2.2], target: [0, 0, 0], fov: 32, minDistance: 1.6, maxDistance: 9,
        init(S) {
          st.flat = false; st.drawn = null;
          st.shell = S.surface((t, w) => [Math.sin(t) * Math.cos(w), Math.sin(t) * Math.sin(w), Math.cos(t)], { u: [0, PI], v: [0, 1.5 * PI], nu: 40, nv: 90, c: 'c2', rough: 0.4, coat: 0.5, glow: 0.2 });
          st.faceA = S.surface((r, t) => [r * Math.sin(t), -0.002, r * Math.cos(t)], { u: [0, 1], v: [0, PI], nu: FN, nv: FN, colour: () => S.colour('c2'), rough: 0.8, coat: 0.05 });
          st.faceB = S.surface((r, t) => [0.002, -r * Math.sin(t), r * Math.cos(t)], { u: [0, 1], v: [0, PI], nu: FN, nv: FN, colour: () => S.colour('c2'), rough: 0.8, coat: 0.05 });
          const ring = (a, o) => S.polyline(a, { c: 'ink', opacity: o, w: 2 });
          st.rA1 = ring(arcA(rh), 0.95); st.rB1 = ring(arcB(rh), 0.95); st.rA2 = ring(arcA(r9), 0.55); st.rB2 = ring(arcB(r9), 0.55);
          st.lab = S.label('', arcA(rh)[8], { small: true });
          st.probe = S.handle([sp, -0.01, 0], { plane: [[0, 1, 0], [0, 0, 0]], r: 0.05, label: 'r', onDrag: (q) => { const r = L.clamp(Math.hypot(q.x, q.y, q.z), 0.02, 1); ctx.set('s', Math.round(r * 100) / 100); return [r, -0.01, 0]; } });
          upd(S);
        },
        update(S) { upd(S); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-1.05, 1.05], y: [-1.05, 1.05], equal: true, axes: false, maxH: 400 });
          f.raster((x, y) => { const r = Math.hypot(x, y); return r > 1 ? L.colours().plate : hotRGB(dens2v(profile(n, r).rho)); }, { res: 3 });
          f.circle(0, 0, 1, { c: 'ink', w: 1.2 }); f.circle(0, 0, rh, { c: 'ink', w: 1.2, dash: true });
          f.handle(sp, 0, { c: 'hl', label: T('probe', '探針'), bounds: [0.02, 1, 0, 0], onDrag: (x, y) => ctx.set('s', L.clamp(Math.hypot(x, y), 0.02, 1)) });
        },
      });
    },
  };

  /* ---------------- 3. degeneracy pressure and the Chandrasekhar limit ---------------- */
  const SIRIUS_B = [1.02, 0.0084 * RSUN / REARTH];
  D['star-degenerate'] = {
    three: true,
    render(ctx, v) {
      const mi = Math.round(v.mue ?? 0), mue = MUES[mi], lg = v.logrho;
      const st = frame(ctx, [T('A white dwarf drawn to scale beside the Earth. The more massive it is, the smaller it is.', '地球と並べた、縮尺どおりの白色矮星です。質量が大きいほど小さくなります。'), T('Mass–radius relation of a cold white dwarf, one star for each central density. The curve ends at the Chandrasekhar mass. Drag the gold point along it.', '冷えた白色矮星の質量半径関係で、中心密度ごとに一つの星があります。曲線はチャンドラセカール質量で終わります。金色の点を曲線に沿ってドラッグしてください。'), T('Density profile of this star (solid) against the two polytropes the degenerate gas lies between.', 'この星の密度分布（実線）と、縮退ガスがその間にある二つのポリトロープ。')]);
      const rows = wdTable(mue), cur = whiteDwarf(Math.pow(10, lg + 3), mue, true), Mch = chandraMass(mue);
      st.cur = cur;
      const xmax = Math.max(1.7, Math.ceil(Mch * 1.1 * 10) / 10), ymax = Math.ceil(rows.reduce((a, r) => Math.max(a, r.Rearth), 0) * 1.3 * 2) / 2;
      st.g2.replaceChildren();
      const f = L.fig(st.g2, { x: [0, xmax], y: [0, ymax], aspect: 0.82, maxH: 470, xlabel: T('mass M / M☉', '質量 M / M☉'), ylabel: T('radius R / R⊕', '半径 R / R⊕') });
      f.vline(Mch, { c: 'c2', w: 1.6, dash: '6 4', layer: 'under' });
      f.text(Mch, ymax * 0.93, T(`Chandrasekhar limit ${fmt(Mch, 3)} M☉`, `チャンドラセカール限界 ${fmt(Mch, 3)} M☉`), { c: 'c2', small: true, anchor: 'end', dx: -6 });
      f.line(L.sample(0.04, 0.8 * Mch, 80, (m) => [m, nrRadius(m, mue) / REARTH]), { c: 'c3', w: 1.6, dash: '5 4', layer: 'under' });
      f.line(rows.map((r) => [r.Msun, r.Rearth]), { c: 'c1', w: 3 });
      if (mi === 0) { f.dot(SIRIUS_B[0], SIRIUS_B[1], { c: 'ink', r: 4, hollow: true }); f.text(SIRIUS_B[0], SIRIUS_B[1], 'Sirius B', { c: 'ink', small: true, anchor: 'end', dx: -8, dy: 4 }); }
      f.handle(cur.Msun, cur.Rearth, { c: 'hl', r: 9, label: T('Drag along the curve to change the central density', '曲線に沿ってドラッグして中心密度を変える'), bounds: [0, xmax, 0, ymax],
        onDrag: (x, y) => { let best = rows[0], bd = 1e9; for (const r of rows) { const d = ((r.Msun - x) / xmax) ** 2 + ((r.Rearth - y) / ymax) ** 2; if (d < bd) { bd = d; best = r; } } ctx.set('logrho', best.lg); } });
      st.g1.replaceChildren();
      const g = L.fig(st.g1, { x: [0, 1], y: [0, 1.25], aspect: 0.5, maxH: 300, xlabel: T('fractional radius r / R', '半径の割合 r / R'), ylabel: 'ρ / ρ(0)', ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      g.line(L.seq(121, (i) => [i / 120, profile(1.5, i / 120).rho]), { c: 'c3', w: 1.6, dash: '5 4' });
      g.line(L.seq(121, (i) => [i / 120, profile(3, i / 120).rho]), { c: 'c2', w: 1.6, dash: '5 4' });
      g.line(cur.prof, { c: 'c1', w: 2.8 });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('white dwarf (full degenerate equation of state)', '白色矮星（縮退の状態方程式をそのまま使用）') }, { c: 'c3', dash: true, label: T('n = 3/2: non-relativistic electrons, R ∝ M⁻¹ᐟ³', 'n = 3/2：非相対論的な電子、R ∝ M⁻¹ᐟ³') }, { c: 'c2', dash: true, label: T('n = 3: ultra-relativistic electrons, M → Chandrasekhar mass', 'n = 3：超相対論的な電子、M → チャンドラセカール質量') }, { kind: 'dot', c: 'hl', label: T('this star', 'この星') }]);
      const gsurf = G * cur.M / (cur.R * cur.R) * 100;
      ctx.readout([
        { k: 'M', v: fmt(cur.Msun, 3) + ' M☉', tone: 'key' }, { k: 'R', v: fmt(cur.R / 1000, 0) + ' km = ' + fmt(cur.Rearth, 2) + ' R⊕', tone: 'key' },
        { k: T('x(0) = pF / mₑc', 'x(0) = pF / mₑc'), v: fmt(cur.xc, 3) }, { k: 'ρ(0)', v: fmt(Math.pow(10, lg), 3) + ' g/cm³' },
        { k: 'M / M(Ch)', v: fmt(cur.Msun / Mch, 3) }, { k: 'log g (cgs)', v: fmt(log10(gsurf), 2) },
        { k: T('escape speed', '脱出速度'), v: fmt(Math.sqrt(2 * G * cur.M / cur.R) / CL, 4) + ' c' },
      ], cur.xc < 0.5 ? T('Electrons are far below the speed of light (x ≪ 1): pressure grows like ρ^(5/3), so a heavier star is squeezed to a smaller radius, R ∝ M^(−1/3), and adding mass shrinks it.', '電子の速さは光速よりずっと小さく（x ≪ 1）、圧力は ρ^(5/3) で増えるので、重い星ほど小さく押しつぶされ、R ∝ M^(−1/3) です。質量を加えると星は縮みます。')
        : cur.xc < 3 ? T('The electrons are becoming relativistic (x ~ 1): the pressure stiffens less than ρ^(5/3), so the radius falls faster than M^(−1/3).', '電子は相対論的になりつつあり（x ~ 1）、圧力は ρ^(5/3) ほど硬くならないので、半径は M^(−1/3) より速く縮みます。')
          : T('Electrons are ultra-relativistic (x ≫ 1): pressure grows only like ρ^(4/3), which is the n = 3 polytrope, and the mass can no longer rise: it approaches the Chandrasekhar mass as the radius goes to zero.', '電子は超相対論的で（x ≫ 1）、圧力は ρ^(4/3) でしか増えず、これは n = 3 のポリトロープです。質量はこれ以上増えず、半径がゼロに向かうにつれチャンドラセカール質量に近づきます。'));
      const place = (S) => {
        const R = st.cur.Rearth, [xa, xb, W] = aimPair(S, 1, R, 30, 0.62), ra = locate(S, st.ringA, xa, 1, W), rb = locate(S, st.ringB, xb, R, W);
        st.earth.at([xa, 0, 0]);
        st.wd.scale.setScalar(R); st.wd.at([xb, 0, 0]); tint(st.wd, bbShow(14000)); tint(st.hl1, bbShow(14000), 1); tint(st.hl2, bbShow(14000), 1); st.hl1.scale.setScalar(R * 1.05); st.hl1.at([xb, 0, 0]); st.hl2.scale.setScalar(R * 1.2); st.hl2.at([xb, 0, 0]);
        st.lE.set([xa, 0, ra * 1.04], T('Earth', '地球'));
        st.lW.set([xb, 0, rb * 1.04], T(`white dwarf, ${fmt(st.cur.Msun, 2)} M☉`, `白色矮星 ${fmt(st.cur.Msun, 2)} M☉`));
        S.fitStage?.(); S.invalidate();
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.62, maxH: 400, camera: [0, -9, 1.4], target: [0, 0, 0], fov: 30, minDistance: 0.2, maxDistance: 2000,
        init(S) {
          st.flat = false;
          const hx = bbShow(14000);
          st.earth = S.sphere([0, 0, 0], 1, { c: 'c1', rough: 0.35, coat: 0.8 });
          st.wd = S.sphere([0, 0, 0], 1, { c: hx, limb: 0.62 });
          st.hl1 = S.sphere([0, 0, 0], 1.05, { c: hx, opacity: 0.09, glow: 0.5, coat: 0 }); st.hl2 = S.sphere([0, 0, 0], 1.2, { c: hx, opacity: 0.035, glow: 0.5, coat: 0 });
          st.lE = S.label('', [0, 0, 1], { small: true, align: 'middle' }); st.lW = S.label('', [0, 0, 1], { small: true, align: 'middle' });
          st.ringA = makeRing(S); st.ringB = makeRing(S);
          place(S);
        },
        update(S) { place(S); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const R = st.cur.Rearth, W = 2 + 2 * R + 0.45 * Math.max(1, R), q = L.fig(st.v3, { x: [-W / 2 - 0.2, W / 2 + 0.2], y: [-W / 4 - 0.2, W / 4 + 0.2], equal: true, axes: false, maxH: 300 });
          q.circle(-W / 2 + 1, 0, 1, { c: 'c1', fill: true, fo: 0.4 }); q.circle(W / 2 - R, 0, R, { c: 'c2', fill: true, fo: 0.5 });
          q.text(-W / 2 + 1, 0, T('Earth', '地球'), { c: 'ink', small: true }); q.text(W / 2 - R, 0, T('white dwarf', '白色矮星'), { c: 'ink', small: true });
        },
      });
    },
  };
})();
