'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------- model (pure, checked by checks/atomic-physics.cjs) ---------- */
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  // generalised Laguerre polynomial L_k^alpha(x) (modern normalisation, L_k^alpha(0) = C(k + alpha, k))
  function laguerre(k, al, x) { if (k === 0) return 1; let a0 = 1, a1 = 1 + al - x; for (let i = 1; i < k; i++) { const a2 = ((2 * i + 1 + al - x) * a1 - (i + al) * a0) / (i + 1); a0 = a1; a1 = a2; } return a1; }
  // hydrogen radial function R_nl(r), r in Bohr radii
  function radial(n, l, r) { const rho = 2 * r / n; return Math.sqrt((2 / n) ** 3 * fact(n - l - 1) / (2 * n * fact(n + l))) * Math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho); }
  // associated Legendre P_l^m(x), m >= 0, without the Condon-Shortley phase
  function legendreP(l, m, x) {
    let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x));
    for (let i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
    if (l === m) return pmm;
    let pm1 = x * (2 * m + 1) * pmm; if (l === m + 1) return pm1;
    let pl = 0; for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * pm1 - (ll + m - 1) * pmm) / (ll - m); pmm = pm1; pm1 = pl; }
    return pl;
  }
  // real spherical harmonics: m > 0 ~ cos(m phi), m < 0 ~ sin(|m| phi)
  function realY(l, m, th, ph) {
    const am = Math.abs(m), N = Math.sqrt((2 * l + 1) / (4 * PI) * fact(l - am) / fact(l + am)), P = legendreP(l, am, Math.cos(th));
    return m === 0 ? N * P : Math.SQRT2 * N * P * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph));
  }
  // psi in the half-plane through the z axis at azimuth phi0; s is the signed distance from the axis
  function psiSlice(n, l, m, phi0, s, z) { const r = Math.hypot(s, z); if (r < 1e-12) return l === 0 ? radial(n, 0, 0) * realY(0, 0, 0, 0) : 0; return radial(n, l, r) * realY(l, m, Math.acos(z / r), s >= 0 ? phi0 : phi0 + PI); }
  const meanR = (n, l) => (3 * n * n - l * (l + 1)) / 2;
  function integrateR(n, l, fn, rmax = 8 * n * n + 30, N = 6000) { const h = rmax / N; let s = 0; for (let i = 0; i <= N; i++) { const r = i * h, w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2; s += w * fn(r, radial(n, l, r)); } return s * h / 3; }
  function roots(fn, lo, hi, N = 3000) { const out = []; let x0 = lo, f0 = fn(lo); for (let i = 1; i <= N; i++) { const x1 = lo + (hi - lo) * i / N, f1 = fn(x1); if (f0 * f1 < 0) { let a = x0, b = x1, fa = f0; for (let k = 0; k < 60; k++) { const c = (a + b) / 2, fc = fn(c); if (fa * fc <= 0) b = c; else { a = c; fa = fc; } } out.push((a + b) / 2); } x0 = x1; f0 = f1; } return out; }
  const radialNodes = (n, l) => roots((r) => laguerre(n - l - 1, 2 * l + 1, 2 * r / n), 1e-6, 6 * n * n + 20);
  const polarNodes = (l, m) => roots((th) => legendreP(l, Math.abs(m), Math.cos(th)), 1e-6, PI - 1e-6);

  // Bohr levels of hydrogen with the reduced-mass Rydberg energy; vacuum wavelengths
  const RY = 13.598434, HC = 1239.841984, MUB = 5.7883818060e-5;
  const level = (n) => -RY / (n * n);
  const lambda = (nl, nu) => HC / (RY * (1 / (nl * nl) - 1 / (nu * nu)));
  const seriesLimit = (nl) => HC * nl * nl / RY;

  // Wigner 3j symbol; all arguments doubled integers (2j, 2m)
  function w3j(j1, j2, j3, m1, m2, m3) {
    if (m1 + m2 + m3 !== 0 || j3 < Math.abs(j1 - j2) || j3 > j1 + j2 || (j1 + j2 + j3) % 2) return 0;
    if (Math.abs(m1) > j1 || Math.abs(m2) > j2 || Math.abs(m3) > j3 || (j1 - m1) % 2 || (j2 - m2) % 2 || (j3 - m3) % 2) return 0;
    const F = (x) => fact(x / 2);
    const tri = Math.sqrt(F(j1 + j2 - j3) * F(j1 - j2 + j3) * F(-j1 + j2 + j3) / F(j1 + j2 + j3 + 2));
    const pre = tri * Math.sqrt(F(j1 + m1) * F(j1 - m1) * F(j2 + m2) * F(j2 - m2) * F(j3 + m3) * F(j3 - m3));
    let s = 0;
    for (let k = 0; k <= 60; k++) {
      const d = [k, (j1 + j2 - j3) / 2 - k, (j1 - m1) / 2 - k, (j2 + m2) / 2 - k, (j3 - j2 + m1) / 2 + k, (j3 - j1 - m2) / 2 + k];
      if (d.some((x) => x < 0)) continue;
      s += (k % 2 ? -1 : 1) / d.reduce((p, x) => p * fact(x), 1);
    }
    return ((j1 - j2 - m3) / 2 % 2 ? -1 : 1) * pre * s;
  }
  // sodium D lines: fine-structure levels (g_s = 2) and NIST/Steck vacuum wavelengths
  const LEVELS = { S12: { L: 0, S: 0.5, J: 0.5, name: '3s ²S₁/₂' }, P12: { L: 1, S: 0.5, J: 0.5, name: '3p ²P₁/₂' }, P32: { L: 1, S: 0.5, J: 1.5, name: '3p ²P₃/₂' } };
  const lande = ({ L: l, S, J }) => 1 + (J * (J + 1) + S * (S + 1) - l * (l + 1)) / (2 * J * (J + 1));
  const DLINES = { D1: { up: 'P12', lo: 'S12', lam: 589.7558 }, D2: { up: 'P32', lo: 'S12', lam: 589.1583 } };
  // weak-field components: shift of the photon energy in units of mu_B B, and the line strength (3j symbol squared)
  function components(line) {
    const U = LEVELS[DLINES[line].up], Lo = LEVELS[DLINES[line].lo], gu = lande(U), gl = lande(Lo), out = [];
    for (let mu = -U.J; mu <= U.J; mu++) for (let ml = -Lo.J; ml <= Lo.J; ml++) {
      const dm = mu - ml; if (Math.abs(dm) > 1) continue;
      const w = w3j(2 * U.J, 2, 2 * Lo.J, -2 * mu, 2 * dm, 2 * ml);
      out.push({ mu, ml, dm, shift: gu * mu - gl * ml, strength: w * w });
    }
    return out;
  }
  const zeemanLambda = (lam0, shift, B) => lam0 - lam0 * lam0 / HC * shift * MUB * B;
  // an approximate colour for a visible wavelength (380 to 750 nm), after Dan Bruton
  function visibleRGB(nm) {
    if (nm < 380 || nm > 750) return null;
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    const k = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
    return [r, g, b].map((c) => 255 * Math.pow(c * k, 0.8));
  }
  (window.LabModels = window.LabModels || {})['atomic-physics'] = { fact, laguerre, radial, legendreP, realY, psiSlice, meanR, integrateR, radialNodes, polarNodes, level, lambda, seriesLimit, w3j, lande, LEVELS, DLINES, components, zeemanLambda, visibleRGB, RY, HC, MUB };

  /* ---------- helpers ---------- */
  const mixc = (x, y, t) => [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t);
  const NAMES = { '1,0': 'p_z', '1,1': 'p_x', '1,-1': 'p_y', '2,0': 'd_z²', '2,1': 'd_xz', '2,-1': 'd_yz', '2,2': 'd_x²−y²', '2,-2': 'd_xy' };
  const orbitalParts = (n, l, m) => { const k = NAMES[`${l},${m}`]; return l === 0 ? [`${n}s`, ''] : k ? [`${n}${k[0]}`, k.slice(2)] : [`${n}${'spdfg'[l]}`, `m = ${String(m).replace('-', '−')}`]; };
  const orbitalName = (n, l, m) => { const [a, b] = orbitalParts(n, l, m); return b ? `${a} (${b})` : a; };
  const SERIES = [['Lyman', 'ライマン'], ['Balmer', 'バルマー'], ['Paschen', 'パッシェン'], ['Brackett', 'ブラケット'], ['Pfund', 'プント']];
  const GREEK = 'αβγδεζηθ';
  const region = (nm) => (nm < 380 ? T('ultraviolet', '紫外') : nm <= 750 ? T('visible', '可視') : T('infrared', '赤外'));

  /* ---------- 1. orbitals ---------- */
  D['hydrogen-orbitals'] = {
    render(ctx, v) {
      const n = Math.round(v.n); let l = Math.round(v.l), m = Math.round(v.m);
      if (l > n - 1) { l = n - 1; ctx.set('l', l, true); }
      if (Math.abs(m) > l) { m = Math.sign(m) * l; ctx.set('m', m, true); }
      const ph = v.phi * PI / 180, R = 2.5 * n * n + 2.5, psi = (s, z) => psiSlice(n, l, m, ph, s, z);
      let pmax = 0; for (let i = 0; i < 90; i++) for (let j = 0; j < 90; j++) pmax = Math.max(pmax, Math.abs(psi(-R + 2 * R * (i + 0.5) / 90, -R + 2 * R * (j + 0.5) / 90)));
      const azi = m === 0 ? 1 : m > 0 ? Math.cos(m * ph) : Math.sin(-m * ph), dead = Math.abs(azi) < 1e-6;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A slice through the atom containing the z axis. Colour shows the sign of ψ (orange positive, blue negative), stronger where |ψ| is larger. Dashed lines are nodes. Drag the gold probe.', 'z 軸を含む平面で原子を切った断面です。色は ψ の符号（橙が正、青が負）を表し、|ψ| が大きいほど濃くなります。点線は節です。金色の探針をドラッグしてください。'));
      const f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, maxH: 470, grid: false, xlabel: T('distance from the z axis (Bohr radii)', 'z 軸からの距離（ボーア半径）'), ylabel: 'z' });
      if (!dead && pmax > 0) f.raster((s, z) => { const q = psi(s, z) / pmax; return Math.sign(q) * Math.pow(Math.abs(q), 0.55); }, { cmap: 'div', res: 3 });
      const rn = radialNodes(n, l), pn = polarNodes(l, m);
      rn.forEach((r) => f.circle(0, 0, r, { c: 'ink', w: 1.2, dash: '4 3', op: 0.7 }));
      pn.forEach((th) => [1, -1].forEach((sg) => f.line([[0, 0], [sg * 1.5 * R * Math.sin(th), 1.5 * R * Math.cos(th)]], { c: 'ink', w: 1.2, dash: '4 3', op: 0.7 })));
      if (m !== 0) f.line([[0, -R], [0, R]], { c: 'ink', w: 1.2, dash: '4 3', op: 0.7 });
      const pr = ctx.state.probe && Math.abs(ctx.state.probe[0]) <= R && Math.abs(ctx.state.probe[1]) <= R ? ctx.state.probe : [0.3 * R, 0.4 * R];
      const pv = psi(pr[0], pr[1]), prr = Math.hypot(pr[0], pr[1]);
      f.handle(pr[0], pr[1], { c: 'hl', label: T('Probe point', '探針'), onDrag: (x, y) => { ctx.state.probe = [x, y]; ctx.redraw(); } });
      const [on, os] = orbitalParts(n, l, m);
      f.text(R, R, on, { anchor: 'end', dx: -10 - (os ? 5.5 * os.length + 1 : 0), dy: 24 });
      if (os) f.text(R, R, os, { small: true, anchor: 'end', dx: -10, dy: 30 });
      // radial probability for every l of this n
      L.h('p', 'lab-cap', c2, T(`Radial probability r²R² for n = ${n}; the solid curve is l = ${l}`, `n = ${n} の動径確率 r²R²。実線が l = ${l} です`));
      const curves = L.seq(n, (ll) => L.sample(0, R, 400, (r) => r * r * radial(n, ll, r) ** 2));
      const ymax = Math.max(...curves.flat().map((q) => q[1]));
      const g = L.fig(c2, { x: [0, R], y: [0, ymax * 1.18], aspect: 0.78, maxH: 360, xlabel: T('r (Bohr radii)', 'r（ボーア半径）'), ticksY: [] });
      curves.forEach((cv, ll) => { if (ll !== l) g.line(cv, { c: 'muted', w: 1.2, dash: '4 3', op: 0.8 }); });
      g.area(curves[l], { c: 'c1', fo: 0.25 }); g.line(curves[l], { c: 'c1', w: 2.6 });
      rn.forEach((r) => g.dot(r, 0, { c: 'ink', r: 4, hollow: true }));
      const mr = meanR(n, l); g.vline(mr, { c: 'c2', w: 1.6, dash: false }); g.text(mr, ymax * 1.1, '⟨r⟩', { math: true, small: true, dx: 5, anchor: 'start', c: 'c2' });
      if (prr <= R) g.vline(prr, { c: 'hl', w: 1.4, dash: '3 3' });
      g.hover((x) => (x < 0 || x > R ? null : { x, y: x * x * radial(n, l, x) ** 2, text: `r = ${fmt(x, 2)}  r²R² = ${fmt(x * x * radial(n, l, x) ** 2, 3)}` }));
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: T('ψ > 0', 'ψ > 0') }, { kind: 'fill', c: 'neg', label: T('ψ < 0', 'ψ < 0') }, { c: 'ink', dash: true, label: T('nodes', '節') }, { c: 'c2', label: '⟨r⟩' }]);
      const num = integrateR(n, l, (r, Rv) => r * r * r * Rv * Rv);
      ctx.readout([{ k: T('orbital', '軌道'), v: orbitalName(n, l, m) }, { k: 'Eₙ', v: `${fmt(level(n), 3)} eV`, tone: 'key' }, { k: T('radial nodes n − l − 1', '動径方向の節 n − l − 1'), v: String(n - l - 1) }, { k: T('angular nodes l', '角度方向の節 l'), v: String(l) }, { k: '⟨r⟩ = (3n² − l(l+1))/2', v: fmt(mr, 3) }, { k: T('⟨r⟩ by integration', '積分で求めた ⟨r⟩'), v: fmt(num, 3), tone: Math.abs(num - mr) < 1e-3 ? 'good' : 'warn' }, { k: T('probe |ψ|²', '探針での |ψ|²'), v: `${fmt(pv * pv, 3)} a₀⁻³` }],
        dead ? T('This slice lies in a nodal plane of the azimuthal factor, so ψ vanishes on all of it. Turn the slice.', 'この断面は方位角因子の節面に一致しているので、ψ は断面全体で 0 です。断面を回してください。')
          : n === 1 ? T('The ground state 1s has no nodes at all: ψ is positive everywhere and falls off as e^(−r/a₀). It is the only orbital with n = 1.', '基底状態 1s には節がまったくありません。ψ はどこでも正で、e^(−r/a₀) のように減衰します。n = 1 の軌道はこれだけです。')
          : T(`All ${n * n} orbitals with n = ${n} share the energy ${fmt(level(n), 3)} eV: in hydrogen the energy depends on n alone. Each has n − 1 = ${n - 1} nodes in total, split between spheres (radial) and cones or planes (angular).`, `n = ${n} の ${n * n} 個の軌道はすべて同じエネルギー ${fmt(level(n), 3)} eV を持ちます。水素ではエネルギーは n だけで決まります。どの軌道も節は合計 n − 1 = ${n - 1} 個で、球面（動径方向）と円錐面や平面（角度方向）に分かれます。`));
    },
  };

  /* ---------- 2. spectral series ---------- */
  D['spectral-lines'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const nl = Math.round(v.nl); let nu = Math.round(v.nu);
      if (nu <= nl) { nu = nl + 1; ctx.set('nu', nu, true); }
      const lam = lambda(nl, nu), E = level(nu) - level(nl), NMAX = 12;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Energy levels Eₙ = −13.6 eV / n², to scale from the series’ lower level up. Every arrow ending on the same level belongs to one series.', 'エネルギー準位 Eₙ = −13.6 eV / n²。系列の下の準位から上を縮尺どおりに描いています。同じ準位で終わる矢印はすべて一つの系列に属します。'));
      const EL = level(nl), YB = EL * 1.1, YT = -EL * 0.1;
      const f = L.fig(c1, { x: [0, 10], y: [YB, YT], aspect: 1.02, maxH: 470, grid: false, ylabel: T('energy (eV)', 'エネルギー (eV)'), ticksX: [], ticksY: [nl, nl + 1, nl + 2].map((k) => [level(k), fmt(level(k), 2)]).concat([[0, '0']]) });
      for (let k = nl; k <= NMAX; k++) f.line([[0.4, level(k)], [8.6, level(k)]], { c: 'ink', w: k <= nl + 3 ? 1.4 : 0.8, op: k <= nl + 3 ? 0.85 : 0.45, layer: 'under' });
      f.line([[0.4, 0], [8.6, 0]], { c: 'muted', w: 1.2, dash: '4 3', layer: 'under' });
      for (let k = nl; k <= nl + 2; k++) f.text(8.75, level(k), `n = ${k}`, { small: true, anchor: 'start', dy: 4 });
      if (nl > 1) f.text(4.5, YB, T(`n = 1 lies further down, at −13.6 eV`, `n = 1 はさらに下、−13.6 eV にあります`), { small: true, c: 'muted', dy: -6 });
      f.text(8.75, 0.25, T('n = ∞ (ionised)', 'n = ∞（電離）'), { small: true, anchor: 'start', dy: 4 });
      const xs = (k) => 1.1 + (k - nl - 1) * (6.8 / Math.max(1, NMAX - nl - 1));
      for (let k = nl + 1; k <= NMAX; k++) if (k !== nu) f.arrow([xs(k), level(k)], [xs(k), level(nl)], { c: 'c1', w: 1.2, op: 0.5, layer: 'under' });
      const x0 = xs(nu), yU = level(nu), yL = level(nl), ym = (yU + yL) / 2;
      const per = 0.22 + 0.32 * (Math.log10(lam) - 2);
      const draw = (tt) => {
        f.clear('main'); f.clear('over');
        const a = Math.min(1, tt), y = yU + (yL - yU) * a;
        f.arrow([x0, yU], [x0, yU + (yL - yU) * Math.max(a, 0.02)], { c: 'hl', w: 3.2 });
        f.dot(x0, y, { c: 'ink', r: 6, layer: 'over' });
        if (tt > 1) { const len = Math.min(1, (tt - 1) / 1.2) * (8.3 - x0 - 0.25); f.line(L.sample(0, len, 220, (s) => [x0 + 0.25 + s, ym + 0.32 * Math.sin(2 * PI * s / per)]), { c: 'hl', w: 2 }); }
      };
      ctx.state.anim = L.animator(c1, (dt, tt) => { draw(tt); if (tt > 2.2) return false; }, { autoplay: false, once: true, initialT: 99, playLabel: T('Drop the electron', '電子を落とす') });
      // the spectrum on a logarithmic wavelength axis
      L.h('p', 'lab-cap', c2, T('The same transitions as spectral lines. Only the Balmer series falls in the visible band.', '同じ遷移をスペクトル線として示します。可視域に入るのはバルマー系列だけです。'));
      const g = L.fig(c2, { x: [Math.log10(80), Math.log10(8000)], y: [0, 1], aspect: 0.62, maxH: 330, grid: false, xlabel: T('vacuum wavelength (nm, logarithmic)', '真空中の波長（nm、対数目盛）'), ticksY: [], ticksX: [100, 200, 500, 1000, 2000, 5000].map((w) => [Math.log10(w), String(w)]) });
      const col = L.colours();
      g.raster((x, y) => { const c = visibleRGB(10 ** x); return c ? mixc(col.plate, c, y < 0.1 ? 0.95 : 0.16) : col.plate; }, { res: 2 });
      for (let s = 1; s <= 5; s++) for (let k = s + 1; k <= 14; k++) { const w = Math.log10(lambda(s, k)); if (s !== nl) g.seg([w, 0.1], [w, 0.34], { c: 'muted', w: 1, op: 0.7 }); }
      for (let k = nl + 1; k <= 30; k++) { const w = Math.log10(lambda(nl, k)); if (k !== nu) g.seg([w, 0.1], [w, 0.6], { c: 'c1', w: 1.4, op: k > 14 ? 0.4 : 0.9 }); }
      g.vline(Math.log10(seriesLimit(nl)), { c: 'c1', dash: '3 3', w: 1.2 });
      g.seg([Math.log10(lam), 0.1], [Math.log10(lam), 0.9], { c: 'hl', w: 4 });
      g.text(Math.log10(lam), 0.93, `${fmt(lam, 1)} nm`, { small: true, dy: 2 });
      g.text(Math.log10(120), 0.7, T('UV', '紫外'), { small: true, c: 'muted' });
      g.text(Math.log10(3000), 0.7, T('infrared', '赤外'), { small: true, c: 'muted' });
      L.legend(ctx.host, [{ c: 'hl', label: T('chosen transition', '選んだ遷移') }, { c: 'c1', label: T(`${SERIES[nl - 1][0]} series`, `${SERIES[nl - 1][1]}系列`) }, { c: 'c1', dash: true, label: T('series limit', '系列の極限') }, { c: 'muted', label: T('other series', '他の系列') }]);
      const name = nu - nl <= GREEK.length ? `${SERIES[nl - 1][0]} ${GREEK[nu - nl - 1]}` : `${SERIES[nl - 1][0]} ${nu} → ${nl}`;
      ctx.readout([{ k: T('transition', '遷移'), v: `n = ${nu} → ${nl}` }, { k: T('line', '線'), v: nl === 2 && nu - nl <= 5 ? `H${GREEK[nu - nl - 1]}` : name }, { k: T('photon energy', '光子のエネルギー'), v: `${fmt(E, 4)} eV` }, { k: T('wavelength (vacuum)', '波長（真空）'), v: `${fmt(lam, 2)} nm`, tone: 'key' }, { k: T('region', '領域'), v: region(lam) }, { k: T('series limit', '系列の極限'), v: `${fmt(seriesLimit(nl), 1)} nm` }],
        T(`1/λ = R_H (1/${nl}² − 1/${nu}²). As n grows the levels crowd towards 0 and the lines crowd towards the series limit, beyond which the spectrum is continuous because the electron is freed.`, `1/λ = R_H (1/${nl}² − 1/${nu}²) です。n が大きくなると準位は 0 に向かって詰まり、線は系列の極限に向かって詰まります。その先では電子が自由になるので、スペクトルは連続になります。`));
    },
  };

  /* ---------- 3. the anomalous Zeeman effect in sodium ---------- */
  const DMC = { 0: 'c1', 1: 'c2', '-1': 'c4' };
  D['zeeman'] = {
    render(ctx, v) {
      const B = v.B, which = Math.round(v.line), pol = Math.round(v.pol);
      const lines = which === 0 ? ['D1'] : which === 1 ? ['D2'] : ['D1', 'D2'];
      const keep = (c) => pol === 0 || (pol === 1 ? c.dm === 0 : c.dm !== 0);
      const comps = lines.map((ln) => { const cs = components(ln), mx = Math.max(...cs.map((c) => c.strength)); return { ln, cs: cs.map((c) => ({ ...c, rel: c.strength / mx })) }; });
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Sublevels split by g_J m_J μ_B B. Splittings are exaggerated and the energy gaps are not to scale.', '副準位は g_J m_J μ_B B だけ分裂します。分裂は誇張してあり、準位間隔は縮尺どおりではありません。'));
      const f = L.fig(c1, { x: [0, 10], y: [0, 10], aspect: 0.95, maxH: 440, axes: false, grid: false });
      const Y0 = { P32: 8.5, P12: 6.5, S12: 1.6 }, K = 0.3, DX = { P32: 0.35, P12: -0.35, S12: 0 }, xm = (m, lv = 'S12') => 5.6 + 1.6 * m + DX[lv];
      const pos = (lv, m) => [xm(m, lv), Y0[lv] + K * lande(LEVELS[lv]) * m * B];
      for (const lv of Object.keys(LEVELS)) {
        const J = LEVELS[lv].J, g = lande(LEVELS[lv]);
        f.line([[1.9, Y0[lv]], [9.4, Y0[lv]]], { c: 'muted', w: 1, dash: '3 4', layer: 'under' });
        for (let m = -J; m <= J; m++) { const [x, y] = pos(lv, m); f.seg([x - 0.55, y], [x + 0.55, y], { c: 'ink', w: 2.6 }); }
        f.text(0.1, Y0[lv], LEVELS[lv].name, { small: true, anchor: 'start', dy: 4 });
        f.text(0.1, Y0[lv] - 0.55, `g_J = ${g === 2 ? '2' : g > 1 ? '4/3' : '2/3'}`, { small: true, anchor: 'start', dy: 4, c: 'muted' });
      }
      for (let m = -0.5; m <= 0.5; m++) f.text(xm(m), Y0.S12 - 0.75, m > 0 ? 'm = +½' : 'm = −½', { small: true, c: 'muted' });
      for (const { ln, cs } of comps) for (const c of cs) if (keep(c)) {
        const a = pos(DLINES[ln].up, c.mu), b = pos('S12', c.ml);
        f.arrow([a[0], a[1] - 0.12], [b[0], b[1] + 0.14], { c: DMC[c.dm], w: 1 + 1.8 * c.rel, op: 0.35 + 0.6 * c.rel });
      }
      // wavelength against field
      L.h('p', 'lab-cap', c2, T('Each component moves linearly with B. Drag the gold marker to set the field.', '各成分は B に比例して動きます。金色の目印をドラッグして磁場を決めてください。'));
      const lam0s = lines.map((ln) => DLINES[ln].lam), half = which === 2 ? 0.1 : 0.075;
      const y0 = Math.min(...lam0s) - half, y1 = Math.max(...lam0s) + half;
      const tks = []; for (let w = Math.ceil((y0 - 589) * 20) / 20; w <= y1 - 589 + 1e-9; w += which === 2 ? 0.1 : 0.05) tks.push([589 + w, String(Math.round(w * 1000))]);
      const g = L.fig(c2, { x: [0, 2], y: [y0, y1], aspect: 0.95, maxH: 440, xlabel: T('field B (tesla)', '磁場 B（テスラ）'), ylabel: T('λ − 589 nm (pm)', 'λ − 589 nm（pm）'), ticksY: tks });
      for (const { ln, cs } of comps) {
        const l0 = DLINES[ln].lam;
        g.hline(l0, { c: 'muted', dash: '3 4', w: 1 }); g.text(0.03, l0, ln, { small: true, anchor: 'start', dy: -6, c: 'muted' });
        for (const c of cs) if (keep(c)) { g.line([[0, l0], [2, zeemanLambda(l0, c.shift, 2)]], { c: DMC[c.dm], w: 0.8 + 2 * c.rel, op: 0.3 + 0.55 * c.rel }); g.dot(B, zeemanLambda(l0, c.shift, B), { c: DMC[c.dm], r: 3 + 3 * c.rel, layer: 'over' }); }
      }
      g.vline(B, { c: 'hl', w: 1.6, dash: false });
      g.handle(B, y0 + 0.05 * (y1 - y0), { c: 'hl', axis: 'x', bounds: [0, 2, y0, y1], label: T('Magnetic field', '磁場'), onDrag: (x) => ctx.set('B', x) });
      L.legend(ctx.host, [{ c: 'c1', label: T('π: Δm = 0', 'π：Δm = 0') }, { c: 'c2', label: 'σ: Δm = +1' }, { c: 'c4', label: 'σ: Δm = −1' }, { c: 'ink', label: T('thicker = stronger (3j symbol squared)', '太いほど強い（3j 記号の二乗）') }]);
      const unit = DLINES.D2.lam ** 2 / HC * MUB * B * 1000, spread = comps.map(({ ln, cs }) => { const s = cs.map((c) => c.shift); return `${ln}: ${fmt((Math.max(...s) - Math.min(...s)) * DLINES[ln].lam ** 2 / HC * MUB * B * 1000, 1)} pm`; }).join(', ');
      ctx.readout([{ k: 'B', v: `${fmt(B, 2)} T` }, { k: 'μ_B B', v: `${fmt(MUB * B * 1e6, 2)} μeV`, tone: 'key' }, { k: T('Δλ per unit of μ_B B', 'μ_B B あたりの Δλ'), v: `${fmt(unit, 2)} pm` }, { k: T('components', '成分の数'), v: comps.map(({ ln, cs }) => `${ln}: ${cs.filter(keep).length}`).join(', ') }, { k: T('total spread', '全体の広がり'), v: spread, tone: 'good' }],
        B < 0.005 ? T('With no field every sublevel of a level has the same energy, so each D line is a single wavelength.', '磁場がなければ一つの準位の副準位はすべて同じエネルギーなので、D 線はそれぞれ一つの波長です。')
          : T('Because g_J differs between the upper and lower levels, the shifts do not collapse onto three values as in the normal Zeeman effect: D1 splits into 4 lines at ±2/3 and ±4/3 units, D2 into 6 at ±1/3, ±1 and ±5/3. This weak-field picture holds while μ_B B is far below the 2.1 meV fine-structure splitting, that is for B well under about 37 T.', '上の準位と下の準位で g_J が異なるので、正常ゼーマン効果のように三つの値にまとまりません。D1 は ±2/3 と ±4/3 単位の 4 本に、D2 は ±1/3、±1、±5/3 の 6 本に分かれます。この弱磁場の描像は、μ_B B が微細構造分裂 2.1 meV よりはるかに小さい間、つまり B がおよそ 37 T より十分小さい間成り立ちます。'));
    },
  };
})();
