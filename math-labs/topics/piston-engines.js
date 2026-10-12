'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const RAD = Math.PI / 180;

  /* ---------- model (pure, checked by checks/piston-engines.cjs); SI units, angles in radians ---------- */
  // crank radius r, rod length l = r/λ; x = piston distance from top dead centre
  const pistonX = (th, r, lam) => r * (1 - Math.cos(th)) + (r / lam) * (1 - Math.sqrt(1 - lam * lam * Math.sin(th) ** 2));
  const dXdTh = (th, r, lam) => { const s = Math.sin(th), c = Math.cos(th), q = Math.sqrt(1 - lam * lam * s * s); return r * s * (1 + (lam * c) / q); };
  const d2XdTh2 = (th, r, lam) => { const s = Math.sin(th), c = Math.cos(th), q = Math.sqrt(1 - lam * lam * s * s); return r * (c + (lam * (c * c - s * s)) / q + (lam ** 3 * s * s * c * c) / q ** 3); };
  const pistonV = (th, r, lam, w) => w * dXdTh(th, r, lam);
  const pistonA = (th, r, lam, w) => w * w * d2XdTh2(th, r, lam);
  // the usual two-term approximation: primary and secondary harmonics
  const pistonA2 = (th, r, lam, w) => r * w * w * (Math.cos(th) + lam * Math.cos(2 * th));

  // air-standard cycles, per kilogram of air; state 1 = bottom dead centre at intake conditions
  const GAM = 1.4, CV = 718, RG = 287;
  function otto(rc, T1 = 300, p1 = 1e5, qin = 1.8e6) {
    const v1 = (RG * T1) / p1, v2 = v1 / rc, T2 = T1 * rc ** (GAM - 1), p2 = p1 * rc ** GAM, T3 = T2 + qin / CV, p3 = (p2 * T3) / T2, T4 = T3 / rc ** (GAM - 1), p4 = (p3 / rc ** GAM);
    const w = qin - CV * (T4 - T1); return { v1, v2, T1, T2, T3, T4, p1, p2, p3, p4, eta: w / qin, w, mep: w / (v1 - v2) };
  }
  const ottoEta = (rc) => 1 - rc ** (1 - GAM);
  function diesel(rc, cut, T1 = 300, p1 = 1e5) {
    const v1 = (RG * T1) / p1, v2 = v1 / rc, v3 = v2 * cut, T2 = T1 * rc ** (GAM - 1), p2 = p1 * rc ** GAM, T3 = T2 * cut, p3 = p2, T4 = T3 * (v3 / v1) ** (GAM - 1), p4 = p3 * (v3 / v1) ** GAM;
    const qin = GAM * CV * (T3 - T2), w = qin - CV * (T4 - T1); return { v1, v2, v3, T1, T2, T3, T4, p1, p2, p3, p4, eta: w / qin, w, qin, mep: w / (v1 - v2) };
  }
  const dieselEta = (rc, cut) => 1 - (rc ** (1 - GAM) * (cut ** GAM - 1)) / (GAM * (cut - 1));

  // a single cylinder through a four-stroke cycle with Wiebe heat release, closed part integrated in crank angle
  const ENG = { bore: 0.086, r: 0.043, lam: 0.3, rc: 10, p0: 1e5, T0: 320, burn0: -10 * RAD, burnDur: 50 * RAD, mrec: 0.45, fuelQ: 1.45e3 };
  function cylinderPressure(e = ENG, n = 1440) {
    const Ap = (Math.PI * e.bore ** 2) / 4, Vd = Ap * 2 * e.r, Vc = Vd / (e.rc - 1), V = (th) => Vc + Ap * pistonX(th, e.r, e.lam), dV = (th) => Ap * dXdTh(th, e.r, e.lam);
    const xb = (th) => (th < e.burn0 ? 0 : 1 - Math.exp(-5 * ((th - e.burn0) / e.burnDur) ** 3));
    // crank angle 0..4π: 0 = TDC at the start of intake, 2π = firing TDC
    const out = [], h = (4 * Math.PI) / n; let p = e.p0;
    for (let k = 0; k <= n; k++) {
      const th = k * h;
      if (th <= Math.PI) p = e.p0; // intake
      else if (th < 3 * Math.PI) { // compression, combustion and expansion: dp = (γ−1)/V dQ − γ p/V dV
        const f = (t, pp) => { const tt = t - 2 * Math.PI, dq = e.fuelQ * (xb(tt + 1e-5) - xb(tt - 1e-5)) / 2e-5; return ((GAM - 1) / V(t)) * dq - (GAM * pp * dV(t)) / V(t); };
        const t0 = th - h, k1 = f(t0, p), k2 = f(t0 + h / 2, p + (h / 2) * k1), k3 = f(t0 + h / 2, p + (h / 2) * k2), k4 = f(t0 + h, p + h * k3);
        p = th - h < Math.PI ? e.p0 : p + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      } else p = e.p0; // exhaust (blowdown at bottom dead centre)
      out.push({ th, p, V: V(th) });
    }
    return { pts: out, Vd, Vc, Ap };
  }
  // torque on the crankshaft from one cylinder: gas force and the inertia of the reciprocating mass
  function cylinderTorque(cyl, rpm, e = ENG) {
    const w = (rpm * 2 * Math.PI) / 60;
    return cyl.pts.map(({ th, p }) => { const dx = dXdTh(th, e.r, e.lam), gas = (p - e.p0) * cyl.Ap * dx, inert = -e.mrec * pistonA(th, e.r, e.lam, w) * dx; return { th, gas, inert, T: gas + inert }; });
  }
  // inline layouts: crank phase of each cylinder, firing offsets (fraction of 4π) and position along the crankshaft
  const LAYOUTS = [
    { n: 1, cranks: [0], fire: [0] },
    { n: 2, cranks: [0, 180], fire: [0, 180] },
    { n: 3, cranks: [0, 240, 120], fire: [0, 240, 480] },
    { n: 4, cranks: [0, 180, 180, 0], fire: [0, 180, 540, 360] },
    { n: 6, cranks: [0, 240, 120, 120, 240, 0], fire: [0, 480, 240, 600, 120, 360] },
  ];
  // shaking forces and rocking couples per unit r ω² m: sum over cylinders of cos(k(θ + φ)), weighted by position z for couples
  function balance(lay) {
    const z = lay.cranks.map((_, i) => i - (lay.n - 1) / 2), ph = lay.cranks.map((c) => c * RAD);
    const amp = (k, wz) => { const re = ph.reduce((s, p, i) => s + (wz ? z[i] : 1) * Math.cos(k * p), 0), im = ph.reduce((s, p, i) => s + (wz ? z[i] : 1) * Math.sin(k * p), 0); return Math.hypot(re, im); };
    return { F1: amp(1, false), F2: amp(2, false), M1: amp(1, true), M2: amp(2, true) };
  }
  function engineTorque(lay, rpm, cyl) {
    const one = cylinderTorque(cyl, rpm), n = one.length - 1, tot = one.map((o) => ({ th: o.th, T: 0 }));
    for (const f of lay.fire) { const sh = Math.round((f / 720) * n); for (let k = 0; k <= n; k++) tot[k].T += one[(((k - sh) % n) + n) % n].T; }
    const mean = tot.slice(0, n).reduce((s, o) => s + o.T, 0) / n;
    // energy surplus over the cycle, ΔE = max − min of ∫(T − mean) dθ
    let E = 0, emax = 0, emin = 0; const h = (4 * Math.PI) / n; for (let k = 0; k < n; k++) { E += (tot[k].T - mean) * h; emax = Math.max(emax, E); emin = Math.min(emin, E); }
    return { tot, mean, dE: emax - emin, peak: Math.max(...tot.map((o) => o.T)), low: Math.min(...tot.map((o) => o.T)) };
  }

  (window.LabModels = window.LabModels || {})['piston-engines'] = { pistonX, dXdTh, d2XdTh2, pistonV, pistonA, pistonA2, GAM, CV, RG, otto, ottoEta, diesel, dieselEta, ENG, cylinderPressure, cylinderTorque, LAYOUTS, balance, engineTorque };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt, TAU = 2 * Math.PI;

  // engine drawing on a stage: crank at (cx, cy), cylinder above
  function drawEngine(s, G, th, cx, cy, R, lam, opt = {}) {
    while (G.firstChild) G.removeChild(G.firstChild);
    const add = (e) => (G.appendChild(e), e), l = R / lam, pin = [cx + R * Math.sin(th), cy + R * Math.cos(th)], py = cy + R * Math.cos(th) + Math.sqrt(l * l - (R * Math.sin(th)) ** 2), bw = opt.bw ?? R * 1.9, ph = R * 0.9;
    const top = cy + R + l + ph * 0.6 + (opt.clear ?? R * 0.35);
    // cylinder walls and head
    add(s.seg([cx - bw / 2 - 1.2, cy + l - R + 0.2 * R], [cx - bw / 2 - 1.2, top], { c: 'ink', w: 2.4 })); add(s.seg([cx + bw / 2 + 1.2, cy + l - R + 0.2 * R], [cx + bw / 2 + 1.2, top], { c: 'ink', w: 2.4 })); add(s.seg([cx - bw / 2 - 1.2, top], [cx + bw / 2 + 1.2, top], { c: 'ink', w: 2.4 }));
    if (opt.gas !== undefined) add(s.rect(cx - bw / 2, py + ph * 0.6, bw, top - py - ph * 0.6, { c: opt.gasC || 'c2', fill: opt.gasC || 'c2', fo: opt.gas, nostroke: true }));
    // crank disc, rod, piston
    add(s.circle(cx, cy, R * 1.25, { c: 'muted', w: 1.2, fill: 'muted', fo: 0.12 }));
    add(s.seg([cx, cy], pin, { c: 'c4', w: 4 }));
    add(s.seg(pin, [cx, py], { c: 'c1', w: 3.4 }));
    add(s.rect(cx - bw / 2, py - ph * 0.4, bw, ph, { c: 'c3', fill: 'c3', fo: 0.55, w: 1.6, rx: 2 }));
    add(s.circle(cx, py, R * 0.12, { c: 'ink', w: 1.2, fill: 'plate', fo: 1 })); add(s.circle(pin[0], pin[1], R * 0.13, { c: 'ink', w: 1.2, fill: 'plate', fo: 1 })); add(s.circle(cx, cy, R * 0.1, { c: 'ink', w: 1.2, fill: 'ink', fo: 1 }));
    return { pin, py, top };
  }

  /* ---------- 1. the crank–slider ---------- */
  D['crank-slider'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const lam = v.lam, rpm = v.rpm, w = (rpm * TAU) / 60, R = ENG.r, th0 = v.th * RAD;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Crank (violet), connecting rod (blue) and piston (teal), with crank radius r = 43 mm and rod length l = r/λ = ${fmt(43 / lam, 1)} mm, drawn to scale.`, `クランク（紫）、コンロッド（青）、ピストン（青緑）です。クランク半径 r = 43 mm、コンロッドの長さ l = r/λ = ${fmt(43 / lam, 1)} mm で、縮尺どおりに描いています。`));
      const Rm = 43, lm = Rm / lam, H = Rm * 1.4 + lm + Rm + 70, s = L.stage(c1, { w: 150, h: H, maxH: 470 });
      const G = s.group('main');
      L.h('p', 'lab-cap', c2, T('Piston acceleration against crank angle at this speed (blue), with its two harmonics: the primary r ω² cos θ and the secondary λ r ω² cos 2θ (dashed). Drag the gold point to turn the crank.', 'この回転数でのクランク角に対するピストンの加速度（青）と、その二つの調和成分です。一次 r ω² cos θ と二次 λ r ω² cos 2θ（破線）です。金色の点をドラッグしてクランクを回してください。'));
      const ths = L.seq(361, (i) => i * RAD), g0 = 9.80665, as = ths.map((t) => pistonA(t, R, lam, w) / g0), amax = Math.max(...as.map(Math.abs)) * 1.15;
      const g = L.fig(c2, { x: [0, 360], y: [-amax, amax], aspect: 0.55, xlabel: T('crank angle θ (°)', 'クランク角 θ（°）'), ylabel: T('acceleration (g)', '加速度（g）'), maxH: 250, ticksX: [[0, 'TDC'], [90, '90'], [180, 'BDC'], [270, '270'], [360, 'TDC']] });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      g.line(ths.map((t) => [t / RAD, (R * w * w * Math.cos(t)) / g0]), { c: 'c4', w: 1.4, dash: '6 4' });
      g.line(ths.map((t) => [t / RAD, (lam * R * w * w * Math.cos(2 * t)) / g0]), { c: 'c2', w: 1.4, dash: '6 4' });
      g.line(ths.map((t, i) => [t / RAD, as[i]]), { c: 'c1', w: 2.6 });
      g.handle(v.th, pistonA(th0, R, lam, w) / g0, { c: 'hl', r: 7, axis: 'x', snap: 1, label: T('Crank angle', 'クランク角'), bounds: [0, 360, -amax, amax], onDrag: (x) => ctx.set('th', Math.round(clamp(x, 0, 360))) });
      const vs = ths.map((t) => pistonV(t, R, lam, w)), vmax = Math.max(...vs.map(Math.abs)) * 1.15;
      L.h('p', 'lab-cap', c2, T('Piston speed (teal) and position from top dead centre (grey, scaled to the stroke).', 'ピストンの速さ（青緑）と上死点からの位置（灰、行程に合わせて縮尺）です。'));
      const hf = L.fig(c2, { x: [0, 360], y: [-vmax, vmax], aspect: 0.4, xlabel: T('crank angle θ (°)', 'クランク角 θ（°）'), ylabel: 'm/s', maxH: 180, ticksX: [[0, 'TDC'], [90, '90'], [180, 'BDC'], [270, '270'], [360, 'TDC']] });
      hf.hline(0, { c: 'muted', w: 1, layer: 'under' });
      hf.line(ths.map((t) => [t / RAD, -vmax * 0.9 + (1.8 * vmax * pistonX(t, R, lam)) / (2 * R)]), { c: 'muted', w: 1.6 });
      hf.line(ths.map((t, i) => [t / RAD, vs[i]]), { c: 'c3', w: 2.4 });
      let imax = 0; vs.forEach((x, i) => { if (i <= 180 && x > vs[imax]) imax = i; }); hf.dot(imax, vs[imax], { c: 'c3', r: 4.5 }); hf.text(imax, vs[imax], `${imax}°`, { small: true, c: 'c3', anchor: 'start', dx: 6, dy: -4 });
      const cur = g.group('over'), cur2 = hf.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T('exact acceleration', '厳密な加速度') }, { c: 'c4', dash: true, label: T('primary', '一次') }, { c: 'c2', dash: true, label: T('secondary', '二次') }, { c: 'c3', label: T('piston speed', 'ピストンの速さ') }]);
      const draw = (th) => { const deg = ((th / RAD) % 360 + 360) % 360; drawEngine(s, G, th, 75, Rm * 1.3 + 4, Rm, lam, { bw: 70, clear: 14 }); while (cur.firstChild) cur.removeChild(cur.firstChild); while (cur2.firstChild) cur2.removeChild(cur2.firstChild); cur.appendChild(g.vline(deg, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); cur2.appendChild(hf.vline(deg, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); cur2.appendChild(hf.dot(deg, pistonV(th, R, lam, w), { c: 'hl', r: 4.5 })); return deg; };
      const aT = pistonA(0, R, lam, w), aB = pistonA(Math.PI, R, lam, w);
      ctx.readout([
        { k: 'λ = r/l', v: fmt(lam, 3), tone: 'key' },
        { k: 'rpm', v: fmt(rpm, 0) },
        { k: T('mean piston speed', '平均ピストン速度'), v: `${fmt((4 * R * rpm) / 60, 1)} m/s` },
        { k: T('peak speed, at', '最大速度とその角度'), v: `${fmt(vs[imax], 1)} m/s, ${imax}°` },
        { k: T('acceleration at TDC, BDC', '上死点、下死点の加速度'), v: `${fmt(aT / g0, 0)} g, ${fmt(aB / g0, 0)} g`, tone: 'warn' },
      ], T(`The rod tilts as the crank turns, so the piston covers more than half its stroke in the first 90°: it moves fastest at ${imax}°, before 90°, and decelerates harder at top dead centre, r ω²(1 + λ) = ${fmt(aT / g0, 0)} g, than at the bottom, r ω²(1 − λ) = ${fmt(-aB / g0, 0)} g. That asymmetry is the secondary harmonic, at twice the crank frequency, and a shorter rod (larger λ) makes it bigger.`, `クランクが回るとコンロッドが傾くので、ピストンは最初の 90° で行程の半分より多く進みます。最も速いのは 90° より前の ${imax}° で、上死点では r ω²(1 + λ) = ${fmt(aT / g0, 0)} g と、下死点の r ω²(1 − λ) = ${fmt(-aB / g0, 0)} g より強く減速します。この非対称がクランクの二倍の周波数の二次成分で、コンロッドが短い（λ が大きい）ほど大きくなります。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const deg = draw(th0 + TAU * 0.4 * t); lb.textContent = `θ = ${fmt(Math.round(deg), 3)}°`; }, { autoplay: false, initialT: 0, playLabel: T('Play: turn the crank', '再生：クランクを回す') });
    },
  };

  /* ---------- 2. the Otto and Diesel cycles ---------- */
  D['otto-cycle'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const rc = v.rc, dies = v.cycle === 1, cut = v.cut, cyc = dies ? diesel(rc, cut) : otto(rc);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, dies
        ? T('The air-standard Diesel cycle on a pressure–volume diagram: adiabatic compression, heat added at constant pressure while the piston moves out to the cutoff volume, adiabatic expansion, heat rejected at constant volume. The enclosed area is the work per cycle.', '圧力・体積線図上の空気標準ディーゼルサイクルです。断熱圧縮、ピストンが締切体積まで動く間の定圧加熱、断熱膨張、定積放熱からなります。囲まれた面積が一サイクルあたりの仕事です。')
        : T('The air-standard Otto cycle on a pressure–volume diagram: adiabatic compression, heat added at constant volume at top dead centre, adiabatic expansion, heat rejected at constant volume. The enclosed area is the work per cycle.', '圧力・体積線図上の空気標準オットーサイクルです。断熱圧縮、上死点での定積加熱、断熱膨張、定積放熱からなります。囲まれた面積が一サイクルあたりの仕事です。'));
      const pmax = cyc.p3 / 1e5, vmax = cyc.v1;
      const f = L.fig(c1, { x: [0, vmax * 1.08], y: [0, Math.max(60, pmax * 1.1)], aspect: 0.82, xlabel: T('specific volume (m³/kg)', '比体積（m³/kg）'), ylabel: T('pressure (bar)', '圧力（bar）'), maxH: 400 });
      const adi = (va, pa, vb, n = 80) => L.sample(va, vb, n, (vv) => [vv, (pa * (va / vv) ** GAM) / 1e5]);
      const comp = adi(cyc.v1, cyc.p1, cyc.v2), heat = dies ? [[cyc.v2, cyc.p2 / 1e5], [cyc.v3, cyc.p3 / 1e5]] : [[cyc.v2, cyc.p2 / 1e5], [cyc.v2, cyc.p3 / 1e5]], exp = adi(dies ? cyc.v3 : cyc.v2, cyc.p3, cyc.v1), rej = [[cyc.v1, cyc.p4 / 1e5], [cyc.v1, cyc.p1 / 1e5]];
      const loop = comp.concat(heat, exp, rej);
      f.poly(loop, { c: 'hl', fill: 'hl', fo: 0.22, w: 0 });
      f.line(comp, { c: 'c1', w: 2.6 }); f.line(heat, { c: 'c2', w: 3 }); f.line(exp, { c: 'c4', w: 2.6 }); f.line(rej, { c: 'c3', w: 3 });
      f.seg([0, 1], [cyc.v1, 1], { c: 'muted', w: 1.2, dash: '4 4' });
      [[cyc.v1, cyc.p1, '1'], [cyc.v2, cyc.p2, '2'], [dies ? cyc.v3 : cyc.v2, cyc.p3, '3'], [cyc.v1, cyc.p4, '4']].forEach(([vv, pp, k]) => { f.dot(vv, pp / 1e5, { c: 'ink', r: 3.5 }); f.text(vv, pp / 1e5, k, { small: true, c: 'ink', anchor: 'start', dx: 6, dy: -4 }); });
      f.text(cyc.v2, cyc.p3 / 1e5, `${fmt(cyc.T3, 0)} K`, { small: true, c: 'c2', anchor: 'start', dx: dies ? 40 : 12, dy: 12 });
      const pt = f.group('over');
      // efficiency against compression ratio
      L.h('p', 'lab-cap', c2, T('Ideal efficiency against compression ratio: Otto (blue) and Diesel at this cutoff ratio (orange). Drag the gold point.', '圧縮比に対する理想効率です。オットー（青）と、この締切比でのディーゼル（オレンジ）です。金色の点をドラッグしてください。'));
      const g = L.fig(c2, { x: [2, 24], y: [0, 0.8], aspect: 0.72, xlabel: T('compression ratio r', '圧縮比 r'), ylabel: 'η', maxH: 320 });
      g.rect(8, 0, 5, 0.8, { c: 'c1', fill: 'c1', fo: 0.07, nostroke: true, layer: 'under' }); g.text(10.5, 0.77, T('petrol', 'ガソリン'), { small: true, c: 'c1', dy: 4 });
      g.rect(14, 0, 8, 0.8, { c: 'c2', fill: 'c2', fo: 0.07, nostroke: true, layer: 'under' }); g.text(18, 0.77, T('diesel', 'ディーゼル'), { small: true, c: 'c2', dy: 4 });
      g.line(L.sample(2, 24, 200, (r) => [r, ottoEta(r)]), { c: 'c1', w: 2.6 });
      g.line(L.sample(2, 24, 200, (r) => [r, dieselEta(r, cut)]), { c: 'c2', w: 2.2, dash: dies ? false : '6 4' });
      g.handle(rc, cyc.eta, { c: 'hl', r: 7, axis: 'x', snap: 0.1, label: T('Compression ratio', '圧縮比'), bounds: [4, 22, 0, 0.8], onDrag: (x) => ctx.set('rc', Math.round(clamp(x, 4, 22) * 10) / 10) });
      L.legend(ctx.host, [{ c: 'c1', label: T('compression; Otto efficiency', '圧縮、オットーの効率') }, { c: 'c2', label: T('heat added; Diesel efficiency', '加熱、ディーゼルの効率') }, { c: 'c4', label: T('expansion', '膨張') }, { c: 'c3', label: T('heat rejected', '放熱') }, { c: 'hl', kind: 'fill', label: T('net work', '正味の仕事') }]);
      ctx.readout([
        { k: T('cycle', 'サイクル'), v: dies ? T('Diesel', 'ディーゼル') : T('Otto', 'オットー'), tone: 'key' },
        { k: T('efficiency η', '効率 η'), v: `${fmt(100 * cyc.eta, 1)}%`, tone: 'good' },
        { k: T('end of compression', '圧縮の終わり'), v: `${fmt(cyc.T2, 0)} K, ${fmt(cyc.p2 / 1e5, 1)} bar` },
        { k: T('peak', '最高'), v: `${fmt(cyc.T3, 0)} K, ${fmt(cyc.p3 / 1e5, 1)} bar` },
        { k: T('mean effective pressure', '平均有効圧'), v: `${fmt(cyc.mep / 1e5, 1)} bar` },
      ], dies
        ? T(`A Diesel engine compresses air alone, hot enough (${fmt(cyc.T2, 0)} K) to ignite fuel injected near the top, and burns it as the piston moves away. At equal compression ratio that is less efficient than the Otto cycle, because some heat arrives at larger volume; but Diesels can run r = 15 to 22 without knock, and win overall.`, `ディーゼル機関は空気だけを圧縮し、その温度（${fmt(cyc.T2, 0)} K）は上死点付近で噴射した燃料に火がつくほど高く、ピストンが離れる間に燃やします。同じ圧縮比ではオットーサイクルより効率が低くなります。一部の熱がより大きな体積で加わるからです。しかしディーゼルはノッキングなしに r = 15〜22 で運転でき、全体としては勝ちます。`)
        : T(`Efficiency depends only on the compression ratio, η = 1 − r^(1−γ): the gas expands from a smaller volume through a larger ratio and hands more of its heat to the piston. Petrol engines stop near r = 10 to 13 because the hot compressed mixture would ignite on its own (knock) before the spark.`, `効率は圧縮比だけで決まり、η = 1 − r^(1−γ) です。気体はより小さな体積からより大きな比で膨張し、熱のより多くをピストンに渡します。ガソリン機関が r = 10〜13 付近で止まるのは、熱く圧縮された混合気が点火より前に勝手に燃えてしまう（ノッキング）からです。`));
      // the operating point travelling round the loop, with a piston beside the diagram
      const per = loop.length;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const k = Math.floor(t * 70) % per, [vv, pp] = loop[k]; while (pt.firstChild) pt.removeChild(pt.firstChild); pt.appendChild(f.dot(vv, pp, { c: 'ink', r: 6 })); pt.appendChild(f.vline(vv, { c: 'ink', w: 1, dash: '2 3', layer: 'over' })); lb.textContent = [T('compression', '圧縮'), T('heat addition', '加熱'), T('expansion', '膨張'), T('heat rejection', '放熱')][k < comp.length ? 0 : k < comp.length + heat.length ? 1 : k < per - 2 ? 2 : 3]; }, { autoplay: false, initialT: 0, playLabel: T('Play: run the cycle', '再生：サイクルを回す') });
    },
  };

  /* ---------- 3. torque, flywheels and balance ---------- */
  const LNAMES = [['single', '単気筒'], ['inline twin (180°)', '直列 2 気筒（180°）'], ['inline three', '直列 3 気筒'], ['inline four', '直列 4 気筒'], ['inline six', '直列 6 気筒']];
  D['engine-balance'] = {
    render(ctx, v) {
      const lay = LAYOUTS[v.lay], rpm = v.rpm, st = ctx.state;
      if (!st.cyl) st.cyl = cylinderPressure();
      const E = engineTorque(lay, rpm, st.cyl), bal = balance(lay), w = (rpm * TAU) / 60, I = 0.12, Cs = E.dE / (I * w * w);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Crankshaft torque over one four-stroke cycle (720°) at ${fmt(rpm, 0)} rpm, full load: the sum of every cylinder’s gas torque and the inertia torque of its piston. The dashed line is the mean; gold shading is energy the flywheel must store and give back.`, `${fmt(rpm, 0)} rpm、全負荷での四行程一サイクル（720°）にわたるクランク軸のトルクです。各気筒のガスによるトルクとピストンの慣性トルクの和です。破線が平均で、金色の陰影はフライホイールが蓄えて返さねばならないエネルギーです。`));
      const tmax = Math.max(80, E.peak * 1.1), tmin = Math.min(-40, E.low * 1.1);
      const g = L.fig(c1, { x: [0, 720], y: [tmin, tmax], aspect: 0.62, xlabel: T('crank angle (°)', 'クランク角（°）'), ylabel: 'N·m', maxH: 340, ticksX: [[0, '0'], [180, '180'], [360, '360'], [540, '540'], [720, '720']] });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      const pts = E.tot.map((o) => [o.th / RAD, o.T]);
      g.area(pts.map(([x, y]) => [x, Math.max(y, E.mean)]), { c: 'hl', fill: 'hl', fo: 0.3, base: E.mean, w: 0 });
      g.line(pts, { c: 'c1', w: 2.2 });
      g.hline(E.mean, { c: 'c2', w: 1.6, dash: '6 4' }); g.text(715, E.mean, T(`mean ${fmt(E.mean, 0)} N·m`, `平均 ${fmt(E.mean, 0)} N·m`), { small: true, c: 'c2', anchor: 'end', dy: -6 });
      // phasors for the shaking forces
      L.h('p', 'lab-cap', c2, T('Shaking forces as phasors, one arrow per cylinder: primary forces turn at crank speed (angles φ), secondary forces at twice crank speed (angles 2φ). If the arrows close into a loop, that force cancels.', '揺さぶり力をフェーザで表し、気筒ごとに一本の矢印にします。一次の力はクランクの速さで回り（角 φ）、二次の力はその二倍で回ります（角 2φ）。矢印が閉じた輪になれば、その力は打ち消し合います。'));
      const chain = (k) => { let x = 0, y = 0; const pts = [[0, 0]]; lay.cranks.forEach((cdeg) => { const a = k * cdeg * RAD; x += Math.cos(a); y += Math.sin(a); pts.push([x, y]); }); return pts; };
      const C1 = chain(1), C2 = chain(2), ext = Math.max(1.2, ...C1.concat(C2).map((q) => Math.max(Math.abs(q[0]), Math.abs(q[1])))) + 0.5, off = 2 * ext + 0.4;
      const ph = L.fig(c2, { x: [-ext, off + ext], y: [-ext - 0.6, ext], equal: true, axes: false, grid: false, maxH: 230 });
      [[C1, 0, T('primary (φ)', '一次（φ）'), 'c4'], [C2, off, T('secondary (2φ)', '二次（2φ）'), 'c2']].forEach(([C, ox, nm, c]) => {
        ph.circle(ox, 0, 1, { c: 'muted', w: 0.8, dash: '2 3' }); ph.dot(ox, 0, { c: 'muted', r: 2.5 });
        for (let i = 1; i < C.length; i++) ph.arrow([ox + C[i - 1][0], C[i - 1][1]], [ox + C[i][0], C[i][1]], { c, w: 2.2 });
        const [x, y] = C[C.length - 1], m = Math.hypot(x, y);
        if (m > 1e-9) ph.arrow([ox, 0], [ox + x, y], { c: 'ink', w: 3 });
        ph.text(ox, -ext - 0.3, `${nm}: |Σ| = ${fmt(m, 2)}`, { small: true, c: m > 1e-9 ? 'c2' : 'muted' });
      });
      L.legend(ctx.host, [{ c: 'c1', label: T('crankshaft torque', 'クランク軸トルク') }, { c: 'c2', dash: true, label: T('mean torque', '平均トルク') }, { c: 'hl', kind: 'fill', label: T('surplus energy stored by the flywheel', 'フライホイールが蓄える余剰エネルギー') }, { c: 'ink', label: T('net shaking force', '正味の揺さぶり力') }]);
      const yes = (x) => (x < 1e-9 ? T('balanced', '釣り合い') : fmt(x, 3));
      ctx.readout([
        { k: T('layout', '配置'), v: T(...LNAMES[v.lay]), tone: 'key' },
        { k: T('peak / mean torque', '最大／平均トルク'), v: fmt(E.peak / E.mean, 2) },
        { k: T('flywheel energy swing ΔE', 'フライホイールのエネルギー変動 ΔE'), v: `${fmt(E.dE, 0)} J` },
        { k: T('speed fluctuation, I = 0.12 kg·m²', '回転変動、I = 0.12 kg·m²'), v: `${fmt(100 * Cs, 2)}%`, tone: Cs < 0.02 ? 'good' : 'warn' },
        { k: T('primary, secondary force', '一次、二次の力'), v: `${yes(bal.F1)}, ${yes(bal.F2)}` },
        { k: T('primary, secondary rocking couple', '一次、二次の偶力'), v: `${yes(bal.M1)}, ${yes(bal.M2)}` },
      ], [
        T('A single cylinder fires once every two turns and has to coast through the other three strokes on the flywheel, so torque swings from strongly negative to many times the mean, and both primary and secondary shaking forces are unbalanced (a counterweight can cancel only part of the primary).', '単気筒は二回転に一回しか爆発せず、残りの三行程はフライホイールで惰性で回らねばならないので、トルクは大きく負の値から平均の何倍もの値まで振れ、一次と二次の揺さぶり力はどちらも釣り合いません（釣り合いおもりで消せるのは一次の一部だけです）。'),
        T('Cranks at 180° cancel the primary force, but the two pistons are not in the same place along the shaft, so they rock the engine end to end (a primary couple), and their secondary forces add. The firing is uneven, 180° then 540°.', '180° のクランクは一次の力を打ち消しますが、二つのピストンは軸に沿って同じ場所にないので、エンジンを前後に揺らします（一次偶力）。また二次の力は足し合わされます。爆発の間隔は 180°、540° と不等間隔です。'),
        T('Three cranks at 120° cancel both primary and secondary forces, but leave rocking couples, which is why many three-cylinder engines carry a balance shaft. The firing is even, every 240°.', '120° ずつの三つのクランクは一次と二次の力をどちらも打ち消しますが、揺れの偶力は残ります。だから多くの三気筒エンジンはバランスシャフトをもちます。爆発は 240° ごとの等間隔です。'),
        T('The flat-plane inline four cancels primary forces and couples, but its four secondary phasors all point the same way: a vertical shake at twice crank speed that grows with the square of rpm, which larger fours cancel with a pair of balance shafts. It fires every 180°, so the torque never goes far below zero.', 'フラットプレーンの直列 4 気筒は一次の力と偶力を打ち消しますが、四つの二次のフェーザはすべて同じ向きを指します。クランクの二倍の速さの上下の揺れで、回転数の二乗で大きくなり、大きめの四気筒は一組のバランスシャフトでそれを消します。180° ごとに爆発するので、トルクが 0 より大きく下がることはありません。'),
        T('The inline six cancels primary and secondary forces and couples: its two halves are mirror-image inline threes, so the couples cancel as well. With a firing every 120° the torque is the smoothest of these layouts, which is why it was long the benchmark for refinement.', '直列 6 気筒は一次と二次の力と偶力をすべて打ち消します。前後の半分が鏡像の直列 3 気筒になっているので、偶力も打ち消し合うのです。120° ごとに爆発するのでトルクはこれらの配置の中で最もなめらかで、だから長く上質さの基準とされてきました。'),
      ][v.lay]);
    },
  };
})();
