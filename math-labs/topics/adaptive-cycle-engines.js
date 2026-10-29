'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI;

  /* ---------------- models (no DOM) ----------------
   * Ideal cycle analysis (Mattingly, Elements of Propulsion, ch. 7; Kerrebrock, Aircraft Engines and Gas Turbines):
   * calorically perfect air, gamma = 1.4, cp = 1004.5 J/(kg K), isentropic components, complete combustion with
   * h_PR = 42.8 MJ/kg, fuel mass neglected beside air mass, separate nozzles that expand each stream to ambient
   * pressure. Ratios: tau_r = 1 + (gamma-1)/2 M0^2, tau_lambda = Tt4 / T0, tau = pi^((gamma-1)/gamma).
   * One turbine drives every compression: tau_t = 1 - (tau_r/tau_lambda)[(tau_c - 1) + sum_i alpha_i (tau_fi - 1)],
   * where the core flow passes through the whole compression system (tau_c is the overall ratio) and stream i,
   * alpha_i times the core flow, leaves after a fan of ratio pi_fi.
   * 1. The two-stream turbofan, its optimum fan ratio (V19 = V9) and its optimum bypass ratio (V9 = (V19 + V0)/2).
   * 2. A three-stream adaptive engine: inner bypass alpha2 at pi_f, third stream alpha3 at pi_f3 < pi_f, alpha3
   *    scheduled by the mode at constant inlet airflow; aircraft heat Q rejected into the third stream.
   * 3. A mission: Breguet cruise legs and a timed dash, for the adaptive engine frozen in either mode and for the
   *    engine that switches. */
  const G = 1.4, CP = 1004.5, RG = CP * (G - 1) / G, HPR = 42.8e6, EX = (G - 1) / G, G0 = 9.80665;
  const isa = (zkm) => { const Tm = zkm < 11 ? 288.15 - 6.5 * zkm : 216.65; return { T: Tm, a: Math.sqrt(G * RG * Tm) }; };

  // streams: [{a, pf, dT}] bypass streams; dT = heat added at constant total pressure (K)
  function cycle(M0, z, T4, pc, streams) {
    const A = isa(z), T0 = A.T, a0 = A.a, V0 = M0 * a0, tr = 1 + (G - 1) / 2 * M0 * M0, tl = T4 / T0, tc = pc ** EX;
    let w = tc - 1; for (const s of streams) w += s.a * (s.pf ** EX - 1);
    const tt = 1 - tr / tl * w, x = tr * tc * tt, f = CP * T0 * (tl - tr * tc) / HPR;
    const base = { T0, a0, V0, tr, tl, tc, tt, f, wc: CP * T0 * tr * (tc - 1), wt: CP * T4 * (1 - tt) };
    if (!(tt > 0 && x > 1 && f > 0)) return { ...base, ok: false };
    const V9 = a0 * Math.sqrt(2 / (G - 1) * tl / (tr * tc) * (x - 1));
    let Fc = V9 - V0, KE = V9 * V9 - V0 * V0, mt = 1, wf = 0;
    const V = streams.map((s) => {
      const tf = s.pf ** EX, v = Math.sqrt(2 * CP * (T0 * tr * tf + (s.dT || 0)) * (1 - 1 / (tr * tf)));
      Fc += s.a * (v - V0); KE += s.a * (v * v - V0 * V0); mt += s.a; wf += s.a * CP * T0 * tr * (tf - 1);
      return v;
    });
    const etaP = V0 > 0 ? 2 * V0 * Fc / KE : 0, etaT = 1 - 1 / (tr * tc);
    return { ...base, ok: Fc > 0, V9, V, Fc, Fs: Fc / mt, S: f / Fc, KE, mt, wf, etaP, etaT, etaO: etaP * etaT };
  }
  const turbofan = (M0, z, T4, pc, pf, a) => cycle(M0, z, T4, pc, [{ a, pf }]);
  // optimum fan ratio for a given bypass ratio (Mattingly eq. 7.59): makes the fan and core jets equally fast
  function optPf(M0, z, T4, pc, a) {
    const T0 = isa(z).T, tr = 1 + (G - 1) / 2 * M0 * M0, tl = T4 / T0, tc = pc ** EX;
    const tf = (tl - tr * (tc - 1) - tl / (tr * tc) + a * tr + 1) / (tr * (1 + a));
    return tf > 1 ? tf ** (1 / EX) : NaN;
  }
  // optimum bypass ratio for a given fan ratio (Mattingly eq. 7.63): least TSFC, where V9 = (V19 + V0) / 2
  function optA(M0, z, T4, pc, pf) {
    const T0 = isa(z).T, tr = 1 + (G - 1) / 2 * M0 * M0, tl = T4 / T0, tc = pc ** EX, tf = pf ** EX;
    const s = Math.sqrt(tr * tf - 1) + Math.sqrt(tr - 1);
    return (tl - tr * (tc - 1) - tl / (tr * tc) - s * s / 4) / (tr * (tf - 1));
  }
  // the largest bypass ratio (<= amax) at which the turbofan still burns no more fuel per thrust than the turbojet
  function aLimit(M0, z, T4, pc, pf, amax = 10) {
    const S0 = turbofan(M0, z, T4, pc, pf, 0); if (!S0.ok) return 0;
    const good = (a) => { const c = turbofan(M0, z, T4, pc, pf, a); return c.ok && c.S <= S0.S * (1 + 1e-9); };
    let lo = 0, n = 200;
    for (let i = 1; i <= n; i++) { const a = amax * i / n; if (!good(a)) { let hi = a; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (good(m)) lo = m; else hi = m; } return lo; } lo = a; }
    return amax;
  }

  /* ---- 2. the three-stream engine ---- */
  const SCH = { pc: 30, pf: 3.8, pf3: 2.2, a2: 0.35, a3lo: 0.1, a3hi: 1.2, m0: 100 };
  const alpha3 = (m) => SCH.a3lo + (SCH.a3hi - SCH.a3lo) * m;
  function three(M0, z, T4, m, Q = 0) {
    const a3 = alpha3(m), mt = 1 + SCH.a2 + a3, mc = SCH.m0 / mt, m3 = mc * a3;
    const dT = Q * 1000 / (m3 * CP);
    const c = cycle(M0, z, T4, SCH.pc, [{ a: SCH.a2, pf: SCH.pf }, { a: a3, pf: SCH.pf3, dT }]);
    return { ...c, mode: m, a3, mc, m2: mc * SCH.a2, m3, dT, F: c.ok ? mc * c.Fc : NaN, T3s: c.T0 * c.tr * SCH.pf3 ** EX };
  }
  const heatCap = (m3, dTallow) => m3 * CP * dTallow / 1000;     // kW

  /* ---- 3. the mission ---- */
  const MIS = { m0: 30000, n: 2, cruise: [0.9, 11], dash: [1.5, 11] };
  const breguetMass = (mStart, d, S, V, LD) => mStart * Math.exp(-d * G0 * S / (V * LD));
  const breguetRange = (S, V, LD, w0, w1) => V / (G0 * S) * LD * Math.log(w0 / w1);
  function missionEngine(T4, mc, md) {
    const c = three(MIS.cruise[0], MIS.cruise[1], T4, mc), d = three(MIS.dash[0], MIS.dash[1], T4, md);
    return { Sc: c.S, Sd: d.S, Fdash: d.F, Vc: c.V0, Vd: d.V0, c, d };
  }
  // out a radius R, a dash of tdash seconds at Freq per engine, back R; returns the mass history
  function flyMission(E, LD, Freq, tdash, R) {
    const m1 = breguetMass(MIS.m0, R, E.Sc, E.Vc, LD);
    const Fd = Math.min(Freq, E.Fdash), mdash = MIS.n * Fd * E.Sd * tdash;
    const m2 = m1 - mdash, m3 = m2 > 0 ? breguetMass(m2, R, E.Sc, E.Vc, LD) : NaN;
    return { m1, m2, m3, mdash, ddash: E.Vd * tdash };
  }
  function radius(E, LD, ff, Freq, tdash) {
    const mEnd = MIS.m0 * (1 - ff);
    if (!(flyMission(E, LD, Freq, tdash, 0).m3 >= mEnd)) return 0;
    let lo = 0, hi = 2e7;
    for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2, r = flyMission(E, LD, Freq, tdash, mid).m3; if (r >= mEnd) lo = mid; else hi = mid; }
    return lo;
  }
  function mission(T4, LD, ff, Freq, tdash) {
    const eng = [missionEngine(T4, 0, 0), missionEngine(T4, 1, 1), missionEngine(T4, 1, 0)];
    const out = eng.map((E) => { const R = radius(E, LD, ff, Freq, tdash); return { ...E, R, can: E.Fdash >= Freq, fly: flyMission(E, LD, Freq, tdash, R) }; });
    const lowR = out[0].R, ad = out[2];
    const fuelLow = MIS.m0 * ff, fuelAd = MIS.m0 - flyMission(ad, LD, Freq, tdash, lowR).m3;
    return { eng: out, fuelSave: 1 - fuelAd / fuelLow, radiusGain: ad.R / lowR - 1, tsfcSave: 1 - ad.Sc / out[0].Sc, Fcruise: MIS.m0 * G0 / LD / MIS.n };
  }

  const M = { G, CP, HPR, G0, isa, cycle, turbofan, optPf, optA, aLimit, SCH, alpha3, three, heatCap, MIS, breguetMass, breguetRange, missionEngine, flyMission, radius, mission };
  (window.LabModels = window.LabModels || {})['adaptive-cycle-engines'] = M;

  const mg = (S) => S * 1e6;      // kg/(N s) to mg/(N s)
  // on a narrow screen the camera backs away along its line of sight so the whole object stays in frame
  const cam = (ctx, c, t, k) => (ctx.host.clientWidth && ctx.host.clientWidth < 560 ? c.map((x, i) => t[i] + (x - t[i]) * k) : c);

  /* ---------------- 1. bypass trade-off: TSFC over (alpha, pi_f) ---------------- */
  const AX = 0.45, PF0 = 1.2, PF1 = 6, PY = 0.625;
  D['bypass-tradeoff'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('Height: the fuel per newton (TSFC) saved, compared with a plain turbojet with the same core, over every fan pressure ratio and bypass ratio at this flight condition. Colour: the thrust per kilogram of air per second, warm where it is high. The orange line runs along the crest across the fan axis: for each bypass ratio, the fan pressure ratio that burns least fuel. The violet line is the best bypass ratio for each fan. Where the hill meets the floor, a turbofan would save nothing. Drag the gold point.', '高さは、同じコアのただのターボジェットと比べて節約できる 1 N あたりの燃料（TSFC）で、この飛行条件で、すべてのファン圧力比とバイパス比について描いています。色は空気 1 kg/s あたりの推力で、大きいところほど暖色です。橙の線はファン軸方向の稜線で、各バイパス比で燃料が最も少なくなるファン圧力比です。紫の線は各ファンでの最良のバイパス比です。丘が床に接するところでは、ターボファンは何も節約しません。金色の点をドラッグしてください。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Along the bypass ratio, with this fan: thrust per unit airflow falls steadily, while TSFC falls to a minimum and rises again. Drag the gold point.', 'このファンでバイパス比に沿って見ると、空気流量あたりの推力は一様に下がり、TSFC は最小値まで下がってからまた上がります。金色の点をドラッグしてください。'));
        st.p1 = L.h('div', '', st.c2); st.p2 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('Exhaust speeds. Where the core jet (orange) crosses the fan jet (blue), this fan pressure ratio is the best one for that bypass ratio.', '排気の速さです。コアの噴流（橙）がファンの噴流（青）と交わるところで、このファン圧力比がそのバイパス比に最良になります。'));
        st.p3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const key = [v.M0, v.alt, v.pc, v.T4].join('|');
      const cur = turbofan(v.M0, v.alt, v.T4, v.pc, v.pf, v.a);
      const tj = turbofan(v.M0, v.alt, v.T4, v.pc, v.pf, 0);
      // global extent of the shown surface
      const geom = () => {
        if (st.gkey === key) return st.g;
        const lim = L.seq(49, (j) => aLimit(v.M0, v.alt, v.T4, v.pc, PF0 + (PF1 - PF0) * j / 48));
        let Smin = Infinity, Fmin = Infinity, Fmax = -Infinity;
        for (let j = 0; j <= 48; j++) for (let i = 0; i <= 40; i++) {
          const pf = PF0 + (PF1 - PF0) * j / 48, c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, lim[j] * i / 40);
          if (!c.ok) continue; Smin = Math.min(Smin, c.S); Fmin = Math.min(Fmin, c.Fs); Fmax = Math.max(Fmax, c.Fs);
        }
        const S0 = tj.ok ? tj.S : Smin * 2;
        const memo = new Map(), lim2 = (pf) => { const k = pf.toFixed(5); if (!memo.has(k)) memo.set(k, aLimit(v.M0, v.alt, v.T4, v.pc, pf) * 0.9995); return memo.get(k); };
        st.gkey = key; st.g = { lim, lim2, Smin, S0, Fmin, Fmax };
        return st.g;
      };
      const gg = geom();
      const ZS = 3, Z = (S) => 0.004 + ZS * Math.max(0, 1 - S / gg.S0);
      const valley = () => { const pts = []; for (let i = 0; i <= 160; i++) { const a = 10 * i / 160, pf = optPf(v.M0, v.alt, v.T4, v.pc, a); if (!(pf >= PF0 && pf <= PF1) || a > gg.lim2(pf) + 1e-9) continue; const c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, a); if (c.ok) pts.push([a, pf, c.S]); } return pts; };
      const bestA = () => { const pts = []; for (let j = 0; j <= 120; j++) { const pf = PF0 + (PF1 - PF0) * j / 120, a = optA(v.M0, v.alt, v.T4, v.pc, pf); if (!(a > 0) || a > gg.lim2(pf)) continue; const c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, a); if (c.ok) pts.push([a, pf, c.S]); } return pts; };

      const draw2d = () => {
        st.p1.replaceChildren(); st.p2.replaceChildren(); st.p3.replaceChildren(); st.leg.replaceChildren();
        const aTop = Math.max(0.5, Math.min(10, aLimit(v.M0, v.alt, v.T4, v.pc, v.pf) * 1.25, 10));
        const curve = L.seq(161, (i) => { const a = aTop * i / 160, c = turbofan(v.M0, v.alt, v.T4, v.pc, v.pf, a); return c.ok ? [a, c] : null; }).filter(Boolean);
        if (st.flat) {
          st.v3.replaceChildren();
          const f0 = L.fig(st.v3, { x: [0, 10], y: [PF0, PF1], aspect: 0.62, maxH: 360, xlabel: T('bypass ratio α', 'バイパス比 α'), ylabel: T('fan pressure ratio π_f', 'ファン圧力比 π_f') });
          f0.raster((a, pf) => { if (a > gg.lim2(pf)) return 0; const c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, a); return c.ok ? L.clamp(1 - c.S / gg.S0, 0, 0.7) / 0.7 : 0; }, { cmap: 'seq', res: 6 });
          const vp = valley(); if (vp.length > 1) f0.line(vp.map((p) => [p[0], p[1]]), { c: 'c2', w: 2.6 });
          const bp = bestA(); if (bp.length > 1) f0.line(bp.map((p) => [p[0], p[1]]), { c: 'c4', w: 2.6 });
          f0.handle(v.a, v.pf, { c: 'hl', label: T('this engine', 'この機関'), bounds: [0, 10, PF0, PF1], onDrag: (x, y) => { ctx.set('a', Math.round(x * 20) / 20, true); ctx.set('pf', Math.round(y * 20) / 20); } });
        }
        const F1 = Math.max(...curve.map((p) => p[1].Fs)) * 1.08;
        const f = L.fig(st.p1, { x: [0, aTop], y: [0, F1], aspect: 0.42, maxH: 170, xlabel: T('bypass ratio α', 'バイパス比 α'), ylabel: 'F/ṁ₀ (N·s/kg)' });
        f.line(curve.map((p) => [p[0], p[1].Fs]), { c: 'c1', w: 2.6 });
        if (cur.ok) f.handle(v.a, cur.Fs, { c: 'hl', axis: 'x', bounds: [0, aTop, 0, F1], snap: 0.05, label: 'α', onDrag: (x) => ctx.set('a', Math.min(10, Math.max(0, x))) });
        const Ss = curve.map((p) => mg(p[1].S)), s0 = Math.min(...Ss), s1 = Math.max(...Ss);
        const h = L.fig(st.p2, { x: [0, aTop], y: [s0 - (s1 - s0) * 0.12 - 0.5, s1 + (s1 - s0) * 0.1 + 0.5], aspect: 0.42, maxH: 170, xlabel: T('bypass ratio α', 'バイパス比 α'), ylabel: 'TSFC (mg/N·s)' });
        h.line(curve.map((p) => [p[0], mg(p[1].S)]), { c: 'c2', w: 2.6 });
        const as = optA(v.M0, v.alt, v.T4, v.pc, v.pf);
        if (as > 0 && as < aTop) { const c = turbofan(v.M0, v.alt, v.T4, v.pc, v.pf, as); if (c.ok) { h.dot(as, mg(c.S), { c: 'c4', r: 5 }); h.text(as, mg(c.S), T('best α for this fan', 'このファンの最良の α'), { small: true, c: 'c4', dy: 16, anchor: as > aTop * 0.6 ? 'end' : 'start' }); } }
        if (cur.ok) h.dot(v.a, mg(cur.S), { c: 'hl', r: 6 });
        const Vt = Math.max(...curve.map((p) => p[1].V9), ...curve.map((p) => p[1].V[0]), cur.V0 || 0) * 1.1;
        const g = L.fig(st.p3, { x: [0, aTop], y: [0, Vt], aspect: 0.42, maxH: 170, xlabel: T('bypass ratio α', 'バイパス比 α'), ylabel: 'm/s' });
        g.line(curve.map((p) => [p[0], p[1].V9]), { c: 'c2', w: 2.4 });
        g.line(curve.map((p) => [p[0], p[1].V[0]]), { c: 'c1', w: 2.4 });
        if (v.M0 > 0) g.hline(curve[0][1].V0, { c: 'muted', w: 1.2, dash: true });
        for (let i = 1; i < curve.length; i++) { const d0 = curve[i - 1][1].V9 - curve[i - 1][1].V[0], d1 = curve[i][1].V9 - curve[i][1].V[0]; if (d0 > 0 && d1 <= 0) { const t = d0 / (d0 - d1), a = curve[i - 1][0] + t * (curve[i][0] - curve[i - 1][0]); g.dot(a, curve[i][1].V[0], { c: 'c3', r: 5 }); g.text(a, curve[i][1].V[0], 'V₁₉ = V₉', { small: true, c: 'c3', dy: -10, anchor: a > aTop * 0.6 ? 'end' : 'start' }); } }
        if (cur.ok) { g.vline(v.a, { c: 'hl', w: 1.2, dash: '3 3' }); }
        L.legend(st.leg, [{ c: 'c1', label: T('specific thrust; fan jet V₁₉', '比推力、ファン噴流 V₁₉') }, { c: 'c2', label: T('TSFC; core jet V₉; best fan for each α', 'TSFC、コア噴流 V₉、各 α の最良のファン') }, { c: 'c4', label: T('best α for each fan', '各ファンの最良の α') }, { c: 'muted', dash: true, label: T('flight speed V₀', '飛行速度 V₀') }, { kind: 'dot', c: 'hl', label: T('this engine', 'この機関') }]);
        const pfs = optPf(v.M0, v.alt, v.T4, v.pc, v.a);
        if (!cur.ok) { ctx.readout([{ k: T('this engine', 'この機関'), v: T('the turbine cannot drive this fan and bypass flow', 'タービンがこのファンとバイパス流を駆動できません'), tone: 'warn' }], T('Lower the bypass ratio or the fan pressure ratio, or raise the turbine inlet temperature.', 'バイパス比かファン圧力比を下げるか、タービン入口温度を上げてください。')); return; }
        ctx.readout([
          { k: T('specific thrust F/ṁ₀', '比推力 F/ṁ₀'), v: fmt(cur.Fs, 0) + ' N·s/kg', tone: 'key' },
          { k: T('TSFC = f / (F/ṁ_c)', 'TSFC = f / (F/ṁ_c)'), v: fmt(mg(cur.S), 2) + ' mg/(N·s)', tone: 'key' },
          { k: T('jets V₉ (core), V₁₉ (fan), V₀', '噴流 V₉（コア）、V₁₉（ファン）、V₀'), v: `${fmt(cur.V9, 0)}, ${fmt(cur.V[0], 0)}, ${fmt(cur.V0, 0)} m/s` },
          { k: T('efficiency: propulsive, thermal, overall', '効率：推進、熱、総合'), v: `${fmt(100 * cur.etaP, 1)}%, ${fmt(100 * cur.etaT, 1)}%, ${fmt(100 * cur.etaO, 1)}%` },
          { k: T('best fan ratio for this α', 'この α の最良のファン圧力比'), v: pfs >= 1 && pfs <= v.pc ? fmt(pfs, 2) : T('above the overall pressure ratio', '全体圧力比より上'), tone: Math.abs(pfs - v.pf) < 0.1 ? 'good' : undefined },
          { k: T('best α for this fan', 'このファンの最良の α'), v: as > 0 ? fmt(as, 2) : '0' },
        ], (() => {
          const cb = as > v.a + 0.3 ? turbofan(v.M0, v.alt, v.T4, v.pc, v.pf, as) : null;
          if (cb && cb.ok) return T(`Raising the bypass ratio from ${fmt(v.a, 2)} to ${fmt(as, 2)}, the best for this fan, would cut the fuel per newton by ${fmt(100 * (1 - cb.S / cur.S), 0)}%, but the thrust per kilogram of air would fall by ${fmt(100 * (1 - cb.Fs / cur.Fs), 0)}%, so the same thrust would need a much bigger engine. A fighter engine must fit its airframe and still give combat thrust, so it accepts the higher fuel burn.`, `バイパス比を ${fmt(v.a, 2)} からこのファンに最良の ${fmt(as, 2)} に上げると、1 N あたりの燃料は ${fmt(100 * (1 - cb.S / cur.S), 0)}% 減りますが、空気 1 kg あたりの推力は ${fmt(100 * (1 - cb.Fs / cur.Fs), 0)}% 下がるので、同じ推力にはずっと大きな機関が要ります。戦闘機の機関は機体に収まり、なお戦闘の推力を出さなければならないので、多い燃料消費を受け入れます。`);
          return T('At or beyond the best bypass ratio for this fan: the core jet is now slower than the average of the fan jet and the flight speed, so sending more air round the core no longer saves fuel. To go further the fan pressure ratio must come down too, which is the airliner direction: lots of air pushed gently.', 'このファンの最良のバイパス比か、それを超えています。コアの噴流はファンの噴流と飛行速度の平均より遅くなっているので、コアの外へ空気を回しても、もう燃料は減りません。さらに進むにはファン圧力比も下げる必要があり、それが旅客機の方向です。たくさんの空気をおだやかに押すのです。');
        })());
      };

      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 500, camera: cam(ctx, [0.65, -6.25, 4.55], [2.15, 1.3, 0.55], 1.25), target: [2.15, 1.3, 0.55], fov: 34,
        init(S) {
          st.flat = false;
          st.surf = S.surface(() => [0, 0, 0], { u: [0, 1], v: [PF0, PF1], nu: 70, nv: 60, c: 'c1', rough: 0.3, coat: 0.8, wire: true, wireEvery: 7, wireEveryV: 6 });
          const grid = [];
          for (const a of [0, 2, 4, 6, 8, 10]) grid.push([[a * AX, 0, 0], [a * AX, (PF1 - PF0) * PY, 0]]);
          for (const pf of [1.2, 2, 3, 4, 5, 6]) grid.push([[0, (pf - PF0) * PY, 0], [10 * AX, (pf - PF0) * PY, 0]]);
          S.lines(grid, { c: 'grid', w: 1.1, opacity: S.dark ? 0.6 : 0.9 });
          S.lines([[[10 * AX, 0, 0], [10 * AX, 0, 2.1]]], { c: 'muted', w: 1.6, opacity: 0.8 });
          for (const a of [0, 5, 10]) S.label(String(a), [a * AX, -0.12, 0], { small: true, c: 'muted', align: 'middle', dy: 14 });
          for (const pf of [2, 4, 6]) S.label(String(pf), [-0.12, (pf - PF0) * PY, 0], { small: true, c: 'muted', align: 'end' });
          S.label(T('bypass ratio α', 'バイパス比 α'), [5 * AX, -0.32, 0], { small: true, align: 'middle', dy: 26 });
          S.label(T('fan pressure ratio π_f', 'ファン圧力比 π_f'), [0.2, (PF1 - PF0) * PY + 0.5, 0], { small: true, align: 'middle' });
          S.light(1.2);
          S.label(T('fuel saved', '燃料の節約'), [10 * AX, 0, 2.25], { small: true, align: 'end' });
          for (const k of [20, 40, 60]) S.label(k + '%', [10 * AX, 0, ZS * k / 100], { small: true, c: 'muted' });
          st.valley = S.tube([[0, 0, 0], [0, 0, 1e-3]], { c: 'c2', r: 0.028, glow: 0.35 });
          st.bestA = S.tube([[0, 0, 0], [0, 0, 1e-3]], { c: 'c4', r: 0.024, glow: 0.3 });
          st.drop = S.lines([[[0, 0, 0], [0, 0, 0.1]]], { c: 'hl', w: 1.6, opacity: 0.9 });
          st.foot = S.sphere([0, 0, 0], 0.035, { c: 'hl' });
          st.hdl = S.handle([0, 0, 0], { facing: true, r: 0.085, c: 'hl', onDrag: (q) => {
            const a = L.clamp(Math.round(q.x / AX * 20) / 20, 0, 10), pf = L.clamp(Math.round((q.y / PY + PF0) * 20) / 20, PF0, PF1);
            ctx.set('a', a, true); ctx.set('pf', pf);
            const c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, a);
            return [a * AX, (pf - PF0) * PY, c.ok ? Z(c.S) : 0.004];
          } });
          st.key3 = null;
        },
        update(S) {
          if (st.key3 !== key) {
            st.key3 = key;
            st.surf.update((u, pf) => { const a = u * gg.lim2(pf), c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, a); return [a * AX, (pf - PF0) * PY, c.ok ? Z(c.S) : 0.004]; },
              (u, pf) => { const c = turbofan(v.M0, v.alt, v.T4, v.pc, pf, u * gg.lim2(pf)); return S.cmap.seq(c.ok ? 0.08 + 0.9 * (c.Fs - gg.Fmin) / Math.max(1e-9, gg.Fmax - gg.Fmin) : 0); });
            const vp = valley(); st.valley.update(vp.length > 1 ? vp.map((p) => [p[0] * AX, (p[1] - PF0) * PY, Z(p[2]) + 0.012]) : []);
            const bp = bestA(); st.bestA.update(bp.length > 1 ? bp.map((p) => [p[0] * AX, (p[1] - PF0) * PY, Z(p[2]) + 0.012]) : []);
          }
          const x = v.a * AX, y = (v.pf - PF0) * PY, zz = cur.ok ? Z(cur.S) : 0.004;
          st.hdl.at([x, y, zz]); st.foot.at([x, y, 0]); st.drop.update([[[x, y, 0], [x, y, zz]]]);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.cap1.textContent = T('Fuel per unit thrust (TSFC) saved against the turbojet, over every fan pressure ratio and bypass ratio, brightest where the saving is largest. The orange line is the best fan for each bypass ratio, the violet line the best bypass ratio for each fan. In the palest region a turbofan saves nothing. Drag the gold point.', 'ターボジェットに比べて節約できる推力あたりの燃料（TSFC）を、すべてのファン圧力比とバイパス比について描いています。節約が最も大きいところが最も明るい色です。橙の線は各バイパス比の最良のファン、紫の線は各ファンの最良のバイパス比です。最も淡い領域では、ターボファンは何も節約しません。金色の点をドラッグしてください。'); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 2. the three-stream engine (3D cutaway) ---------------- */
  // generic, schematic geometry (not any real engine). Axis along x, radii in casing units.
  const GEO = {
    x0: -3.0, xFan1: -2.32, xFan2: -1.86, xVane: -1.32, xCDFS: -1.0, xSplit3: -1.5, xSplitC: -0.82,
    xComb: 0.85, xExit3: 2.05, xExit2: 2.45, xExitC: 2.8, xPlug: 3.25, Rc: 1.0,
  };
  const casingIn = (x) => x < 1.2 ? 1.0 : 1.0 - 0.1 * ((x - 1.2) / (GEO.xExit3 - 1.2)) ** 1.5;
  const split3 = (x) => x < 0.9 ? 0.8 : 0.8 - 0.12 * ((x - 0.9) / (GEO.xExit2 - 0.9)) ** 1.4;      // third-stream splitter
  const coreOut = (x) => x < -0.82 ? 0.56 : x < 0.5 ? 0.56 - 0.07 * (x + 0.82) / 1.32 : x < 1.3 ? 0.49 + 0.02 * Math.sin(PI * (x - 0.5) / 0.8) : x < 2.1 ? 0.49 + 0.06 * (x - 1.3) / 0.8 : 0.55 - 0.13 * ((x - 2.1) / (GEO.xExitC - 2.1));
  const hubR = (x) => x < -2.2 ? Math.max(0, 0.36 * Math.sqrt(Math.max(0, (x + 2.95) / 0.75))) : x < -0.8 ? 0.36 + 0.04 * (x + 2.2) / 1.4 : x < 0.5 ? 0.3 + 0.1 * (x + 0.8) / 1.3 : x < 1.3 ? 0.4 : x < 2.1 ? 0.4 - 0.04 * (x - 1.3) / 0.8 : Math.max(0, 0.36 * (1 - ((x - 2.1) / (GEO.xPlug - 2.1)) ** 1.6));
  const TH0 = PI / 2, TH1 = PI;                  // the cut-away quadrant (y < 0, z > 0 faces the camera)
  const PM = (x, r, th) => [x, r * Math.cos(th), r * Math.sin(th)];

  D['three-stream-engine'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('A generic three-stream engine, cut away (schematic, not any real engine). The front fan stages compress all the air; the outer part leaves as the third stream (teal) through the variable vanes of the mode valve and a heat exchanger. The rest passes a further fan stage and splits into the inner bypass (blue) and the core (orange). Particles cross each section at a rate proportional to its mass flow and leave at its exhaust speed; speeds inside the engine are schematic. Drag the gold lever to change mode.', '一般的な三流路機関の切断模型です（模式図で、特定の実機ではありません）。前方のファン段がすべての空気を圧縮し、外側の部分はモード弁の可変翼と熱交換器を通って第三流路（青緑）として出ていきます。残りはもう一段のファンを通り、内側のバイパス（青）とコア（橙）に分かれます。粒子は各流路の質量流量に比例する割合で断面を横切り、その流路の排気速度で出ていきます。機関内部の速さは模式的です。金色のレバーをドラッグするとモードが変わります。'));
        st.v3 = L.h('div', '', st.c1);
        st.bar = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Thrust against fuel per unit thrust, for 100 kg/s of inlet air. The violet curve is the adaptive engine as the mode runs from combat to cruise; the grey dots are conventional two-stream engines with the same core and fan, each built for one bypass ratio. Drag the gold point along the curve.', '入口空気 100 kg/s あたりの推力と、推力あたりの燃料です。紫の曲線は、モードを戦闘から巡航まで動かしたときのアダプティブ機関です。灰色の点は、同じコアとファンをもつ従来の二流路機関で、それぞれ一つのバイパス比のために作られています。金色の点を曲線に沿ってドラッグしてください。'));
        st.p1 = L.h('div', '', st.c2);
        L.h('p', 'lab-cap', st.c2, T('Exhaust speed of each stream; the bar thickness is its share of the airflow. The dashed line is the flight speed.', '各流路の排気速度です。棒の太さは空気流量の割合です。破線は飛行速度です。'));
        st.p2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const E = three(v.M0, v.alt, v.T4, v.mode, v.Q);
      const draw2d = () => {
        st.p1.replaceChildren(); st.p2.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) drawFlat();
        const ms = L.seq(61, (i) => three(v.M0, v.alt, v.T4, i / 60, v.Q)).filter((c) => c.ok);
        const sTop = Math.max(...ms.map((c) => c.S)) * 1.5;
        const fixed = [0.3, 0.5, 0.8, 1.2, 1.6].map((a) => { const c = turbofan(v.M0, v.alt, v.T4, SCH.pc, SCH.pf, a); return { a, c, F: c.ok ? c.Fc * SCH.m0 / (1 + a) : NaN }; }).filter((p) => p.c.ok && p.c.S < sTop);
        const xs = [...ms.map((c) => mg(c.S)), ...fixed.map((p) => mg(p.c.S))], ys = [...ms.map((c) => c.F / 1000), ...fixed.map((p) => p.F / 1000)];
        if (!xs.length) { ctx.readout([{ k: T('this engine', 'この機関'), v: T('no thrust at this condition', 'この条件では推力が出ません'), tone: 'warn' }]); return; }
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys) * 1.12, dx = (x1 - x0) * 0.2 + 0.5;
        const f = L.fig(st.p1, { x: [x0 - dx, x1 + dx], y: [Math.max(0, Math.min(...ys) * 0.75), y1], aspect: 0.72, maxH: 300, xlabel: 'TSFC (mg/N·s)', ylabel: T('thrust (kN)', '推力（kN）') });
        fixed.forEach((p, k) => { f.dot(mg(p.c.S), p.F / 1000, { c: 'muted', r: 5, hollow: true }); f.text(mg(p.c.S), p.F / 1000, 'α = ' + p.a, { small: true, c: 'muted', dy: k === 0 ? -11 : 4, dx: k === 0 ? 0 : 9, anchor: k === 0 ? 'middle' : 'start' }); });
        f.line(ms.map((c) => [mg(c.S), c.F / 1000]), { c: 'c4', w: 3 });
        const m0c = ms[0], m1c = ms[ms.length - 1];
        f.text(mg(m0c.S), m0c.F / 1000, T('combat', '戦闘'), { small: true, c: 'c4', dy: -10, anchor: 'end', dx: -6 });
        f.text(mg(m1c.S), m1c.F / 1000, T('cruise', '巡航'), { small: true, c: 'c4', dy: 18, anchor: 'start', dx: 6 });
        if (E.ok) f.handle(mg(E.S), E.F / 1000, { c: 'hl', label: T('mode', 'モード'), bounds: [x0 - dx, x1 + dx, 0, y1], onDrag: (x, y) => {
          let best = 0, bd = Infinity; const sx = (x1 - x0 + 2 * dx), sy = y1;
          ms.forEach((c) => { const d = ((mg(c.S) - x) / sx) ** 2 + ((c.F / 1000 - y) / sy) ** 2; if (d < bd) { bd = d; best = c.mode; } });
          ctx.set('mode', Math.round(best * 100) / 100);
        } });
        // jet bars
        const Vm = Math.max(E.ok ? E.V9 : 0, ...(E.V || [0]), E.V0) * 1.12 || 1;
        const g = L.fig(st.p2, { x: [0, Vm], y: [0, 3], aspect: 0.42, maxH: 160, axes: true, grid: false, xlabel: T('exhaust speed (m/s)', '排気速度（m/s）'), ticksY: [[0.5, T('core', 'コア')], [1.5, T('inner', '内側')], [2.5, T('third', '第三')]] });
        if (E.ok) {
          const sh = [E.mc, E.m2, E.m3].map((m) => m / SCH.m0), vs = [E.V9, E.V[0], E.V[1]], cs = ['c2', 'c1', 'c3'];
          sh.forEach((s, i) => { const hh = 0.12 + 1.6 * s; g.rect(0, i + 0.5 - hh / 2, vs[i], hh, { c: cs[i], fill: cs[i], fo: 0.75, w: 1 }); g.text(vs[i], i + 0.5, fmt(vs[i], 0), { small: true, dx: 5, dy: 4 }); });
          if (E.V0 > 0) g.vline(E.V0, { c: 'ink', w: 1.2, dash: true });
        }
        L.legend(st.leg, [{ kind: 'fill', c: 'c3', label: T('third stream', '第三流路') }, { kind: 'fill', c: 'c1', label: T('inner bypass', '内側バイパス') }, { kind: 'fill', c: 'c2', label: T('core', 'コア') }, { c: 'c4', label: T('adaptive engine, combat to cruise', 'アダプティブ機関、戦闘から巡航') }, { kind: 'dot', c: 'muted', label: T('fixed two-stream engines', '固定の二流路機関') }]);
        if (!E.ok) { ctx.readout([{ k: T('this engine', 'この機関'), v: T('the turbine cannot drive these streams here', 'ここではタービンがこれらの流路を駆動できません'), tone: 'warn' }]); return; }
        const cap = heatCap(E.m3, v.dT), over = E.dT > v.dT;
        ctx.readout([
          { k: T('thrust', '推力'), v: fmt(E.F / 1000, 1) + ' kN', tone: 'key' },
          { k: 'TSFC', v: fmt(mg(E.S), 2) + ' mg/(N·s)', tone: 'key' },
          { k: T('airflow: third, inner, core', '空気流量：第三、内側、コア'), v: `${fmt(E.m3, 1)}, ${fmt(E.m2, 1)}, ${fmt(E.mc, 1)} kg/s` },
          { k: T('jets V₃₉, V₁₉, V₉ (flight V₀)', '噴流 V₃₉、V₁₉、V₉（飛行 V₀）'), v: `${fmt(E.V[1], 0)}, ${fmt(E.V[0], 0)}, ${fmt(E.V9, 0)} (${fmt(E.V0, 0)}) m/s` },
          { k: T('propulsive efficiency', '推進効率'), v: fmt(100 * E.etaP, 1) + '%' },
          { k: T('heat-sink capacity ṁ₃c_pΔT', '吸熱能力 ṁ₃c_pΔT'), v: fmt(cap, 0) + ' kW' },
          { k: T('third-stream rise for the load', '負荷による第三流路の温度上昇'), v: fmt(E.dT, 1) + ' K', tone: over ? 'warn' : 'good' },
        ], over
          ? T(`The aircraft's ${fmt(v.Q, 0)} kW would heat the third stream by ${fmt(E.dT, 0)} K, more than the ${fmt(v.dT, 0)} K allowed. In combat mode the third stream carries least air, just when sensors and weapons make most heat: that tension is part of why the heat sink matters.`, `機体の ${fmt(v.Q, 0)} kW は第三流路を ${fmt(E.dT, 0)} K 温め、許容の ${fmt(v.dT, 0)} K を超えます。戦闘モードでは第三流路の空気が最も少なく、それはセンサーや兵装が最も多く熱を出すときです。この緊張関係が、吸熱源が重要な理由の一つです。`)
          : v.mode > 0.6
            ? T(`Cruise mode: ${fmt(100 * E.m3 / SCH.m0, 0)}% of the air takes the third stream, compressed only by the front stages and leaving at ${fmt(E.V[1], 0)} m/s. The engine moves more air more gently, so its propulsive efficiency rises and it needs less fuel for each newton, at the cost of thrust.`, `巡航モードです。空気の ${fmt(100 * E.m3 / SCH.m0, 0)}% が第三流路を通り、前方の段だけで圧縮されて ${fmt(E.V[1], 0)} m/s で出ていきます。機関はより多くの空気をよりおだやかに動かすので推進効率が上がり、1 N あたりの燃料が少なくてすみますが、推力は下がります。`)
            : T(`Combat mode: the mode valve has closed most of the third stream, so ${fmt(100 * E.mc / SCH.m0, 0)}% of the same inlet air goes through the core, where the fuel is burned. The jets are fast and the thrust is high; the fuel per newton is high too.`, `戦闘モードです。モード弁が第三流路の大部分を閉じたので、同じ入口空気の ${fmt(100 * E.mc / SCH.m0, 0)}% がコアを通り、そこで燃料が燃やされます。噴流は速く推力は大きく、1 N あたりの燃料も多くなります。`));
      };
      const drawFlat = () => {
        st.v3.replaceChildren();
        const f0 = L.fig(st.v3, { x: [-3.2, 3.6], y: [-0.15, 1.3], equal: true, axes: false, grid: false, maxH: 300 });
        const band = (lo, hi, x0, x1, c) => { const a = L.sample(x0, x1, 60, (x) => [x, hi(x)]), b = L.sample(x1, x0, 60, (x) => [x, lo(x)]); f0.poly(a.concat(b), { c, fill: c, fo: 0.35, w: 0 }); };
        band(split3, casingIn, GEO.xSplit3, GEO.xExit3, 'c3'); band(coreOut, split3, GEO.xSplitC, GEO.xExit2, 'c1'); band(hubR, coreOut, GEO.xSplitC, GEO.xExitC, 'c2');
        f0.line(L.sample(GEO.x0, GEO.xExit3, 80, (x) => [x, casingIn(x)]), { c: 'ink', w: 2.4 });
        f0.line(L.sample(GEO.xSplit3, GEO.xExit2, 80, (x) => [x, split3(x)]), { c: 'ink', w: 1.6 });
        f0.line(L.sample(GEO.xSplitC, GEO.xExitC, 80, (x) => [x, coreOut(x)]), { c: 'ink', w: 1.6 });
        f0.line(L.sample(-2.95, GEO.xPlug, 120, (x) => [x, hubR(x)]), { c: 'ink', w: 1.6 });
        const ang = (1 - v.mode) * 1.25; f0.seg([GEO.xVane - 0.08 * Math.cos(ang), 0.9 - 0.08 * Math.sin(ang)], [GEO.xVane + 0.08 * Math.cos(ang), 0.9 + 0.08 * Math.sin(ang)], { c: 'hl', w: 3 });
        f0.text(GEO.xVane, 1.07, T('mode valve', 'モード弁'), { small: true, c: 'hl', anchor: 'middle' });
        f0.circle(GEO.xComb, 0.47, 0.06, { c: 'c2', fill: 'c2', fo: 0.8 });
      };
      st.drawAt = (t) => { if (!st.flat) st.draw3d?.(t); };
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lb) => { st.drawAt(t); lb.textContent = ''; }, { autoplay: true, initialT: 3.7, playLabel: T('Play: run the engine', '再生：機関を回す') });

      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.56, maxH: 520, camera: cam(ctx, [-1.15, -7.6, 3.9], [0.35, 0, 0.1], 1.32), target: [0.35, 0, 0.1], fov: 32,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          const METAL = { metal: 0.82, rough: 0.28, coat: 0.5 }, CUT = { metal: 0.55, rough: 0.5, coat: 0.15 };
          const arc = [TH1, TH0 + TAU];                                  // the 270 degrees that remain
          const shell = (rfn, x0, x1, c, o = {}) => S.surface((x, th) => PM(x, rfn(x), th), { u: [x0, x1], v: arc, nu: o.nu ?? 50, nv: o.nv ?? 54, c, ...METAL, ...o });
          const cutFaces = (rlo, rhi, x0, x1, c) => { for (const th of [TH0, TH1]) S.surface((x, s) => PM(x, rlo(x) + (rhi(x) - rlo(x)) * s, th), { u: [x0, x1], v: [0, 1], nu: 40, nv: 2, c, ...CUT }); };
          // nacelle casing with thickness and painted cut faces
          const outer = (x) => casingIn(x) + 0.08 + (x < -2.7 ? 0.03 * (x + 2.7) / 0.3 : 0);
          shell(outer, GEO.x0, GEO.xExit3, 'muted', { metal: 0.6, rough: 0.34 });
          shell(casingIn, GEO.x0, GEO.xExit3, 'muted', { metal: 0.85, rough: 0.3 });
          cutFaces(casingIn, outer, GEO.x0, GEO.xExit3, 'muted');
          S.surface((s, th) => PM(GEO.x0, casingIn(GEO.x0) + s * (outer(GEO.x0) - casingIn(GEO.x0)), th), { u: [0, 1], v: arc, nu: 2, nv: 54, c: 'muted', ...METAL });
          // splitters, core cowl, hub and plug
          shell(split3, GEO.xSplit3, GEO.xExit2, 'muted', { metal: 0.85, rough: 0.26 });
          shell(coreOut, GEO.xSplitC, GEO.xExitC, 'muted', { metal: 0.8, rough: 0.3 });
          shell(hubR, -2.95, GEO.xPlug, 'muted', { metal: 0.75, rough: 0.3, nu: 90 });
          // the section: each annulus painted in its stream's colour on both cut planes, crisp edge lines on every wall
          const band = (lo, hi, x0, x1, c, th, op) => S.surface((x, q) => PM(x, lo(x) + (hi(x) - lo(x)) * q, th), { u: [x0, x1], v: [0, 1], nu: 70, nv: 2, c, opacity: op, rough: 0.8, coat: 0, metal: 0 });
          const wallIn = (x) => Math.max(hubR(x), 0.001);
          for (const [th, op] of [[TH0 + 0.004, 0.3], [TH1 - 0.004, 0.22]]) {
            band(split3, casingIn, GEO.xSplit3, GEO.xExit3, 'c3', th, op);
            band((x) => coreOut(x), (x) => x < GEO.xSplit3 ? casingIn(x) : split3(x), GEO.xSplitC, GEO.xExit2, 'c1', th, op);
            band(wallIn, coreOut, GEO.xSplitC, GEO.xExitC, 'c2', th, op);
          }
          const prof = (f, x0, x1, n = 60) => { const out = []; for (const th of [TH0, TH1]) for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; out.push([PM(a, f(a), th), PM(b, f(b), th)]); } return out; };
          S.lines([...prof(casingIn, GEO.x0, GEO.xExit3), ...prof(outer, GEO.x0, GEO.xExit3), ...prof(split3, GEO.xSplit3, GEO.xExit2), ...prof(coreOut, GEO.xSplitC, GEO.xExitC), ...prof(hubR, -2.95, GEO.xPlug, 90)], { c: 'ink', w: 2, opacity: S.dark ? 0.75 : 0.85 });
          const ringAt = (x, r, n = 64) => { const out = []; for (let i = 0; i < n; i++) { const a = TH1 + 1.5 * PI * i / n, b = TH1 + 1.5 * PI * (i + 1) / n; out.push([PM(x, r, a), PM(x, r, b)]); } return out; };
          S.lines([...ringAt(GEO.xSplit3, split3(GEO.xSplit3)), ...ringAt(GEO.xSplitC, coreOut(GEO.xSplitC)), ...ringAt(GEO.xExit3, casingIn(GEO.xExit3)), ...ringAt(GEO.xExit2, split3(GEO.xExit2)), ...ringAt(GEO.xExitC, coreOut(GEO.xExitC)), ...ringAt(GEO.x0, outer(GEO.x0))], { c: 'ink', w: 1.6, opacity: 0.7 });
          // blade rows seen in section: their outlines on the two cut planes
          const secRows = [[GEO.xFan1, 0.3, (x) => hubR(x), () => 0.985], [-2.08, 0.14, () => 0.38, () => 0.985], [GEO.xFan2, 0.24, () => 0.38, () => 0.98], [GEO.xCDFS, 0.16, () => 0.38, () => 0.79]];
          for (let i = 0; i < 6; i++) secRows.push([-0.65 + i * 0.2, 0.08, hubR, coreOut]);
          for (let i = 0; i < 3; i++) secRows.push([1.42 + i * 0.24, 0.11, hubR, coreOut]);
          for (const [x, ch, lo, hi] of secRows) for (const th of [TH0 + 0.008, TH1 - 0.008]) S.surface((u, q) => { const xx = x + ch * (u - 0.5); return PM(xx, lo(x) + 0.01 + (hi(x) - lo(x) - 0.02) * q, th); }, { u: [0, 1], v: [0, 1], nu: 1, nv: 1, c: x > 1.3 ? 'c4' : 'muted', metal: 0.7, rough: 0.35 });
          // blade rows: instanced twisted plates
          const bladeGeo = (rh, rt, chord, st0, st1) => {
            const nu = 6, nv = 3, pos = [], idx = [];
            for (let i = 0; i <= nu; i++) { const s = i / nu, r = rh + (rt - rh) * s, b = st0 + (st1 - st0) * s; for (let j = 0; j <= nv; j++) { const c = (j / nv - 0.5) * chord * (1 - 0.25 * s); pos.push(c * Math.cos(b), c * Math.sin(b) + 0.012 * Math.sin(PI * j / nv), r); } }
            for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b2 = a + nv + 1; idx.push(a, b2, a + 1, b2, b2 + 1, a + 1); }
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
          };
          const rowMesh = (x, n, rh, rt, chord, st0, st1, c, o = {}) => {
            const im = new THREE.InstancedMesh(bladeGeo(rh, rt, chord, st0, st1), S.mat(c, { metal: 0.85, rough: 0.24, coat: 0.6, ...o }), n);
            const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1);
            // local frame: (chord x, tangential y, radial z); rotate about the engine axis
            let cnt = 0; for (let k = 0; k < n; k++) { const th = PI / 2 + TAU * k / n, tm = ((th % TAU) + TAU) % TAU; if (tm > TH0 - 0.04 && tm < TH1 + 0.04) continue; q.setFromAxisAngle(ax, TAU * k / n); m4.compose(new THREE.Vector3(x, 0, 0), q, one); im.setMatrixAt(cnt++, m4); } im.count = cnt;
            im.castShadow = true; const grp = new THREE.Group(); grp.add(im); S.add(grp); return grp;
          };
          st.rotors = [];
          st.rotors.push({ g: rowMesh(GEO.xFan1, 20, hubR(GEO.xFan1) - 0.02, 0.985, 0.34, 0.5, 1.15, 'muted'), w: 1 });
          rowMesh(-2.08, 34, 0.38, 0.985, 0.16, -0.25, -0.35, 'muted', { metal: 0.6 });
          st.rotors.push({ g: rowMesh(GEO.xFan2, 26, 0.38, 0.98, 0.26, 0.55, 1.05, 'muted'), w: 1 });
          st.rotors.push({ g: rowMesh(GEO.xCDFS, 32, 0.38, 0.79, 0.18, 0.6, 1.0, 'muted'), w: 1 });
          for (let i = 0; i < 6; i++) { const x = -0.65 + i * 0.2; st.rotors.push({ g: rowMesh(x, 40 + 4 * i, hubR(x) - 0.01, coreOut(x) - 0.004, 0.09, 0.7, 0.9, 'muted'), w: 2.6 }); }
          for (let i = 0; i < 3; i++) { const x = 1.42 + i * 0.24; st.rotors.push({ g: rowMesh(x, 46, hubR(x) - 0.01, coreOut(x) - 0.004, 0.12, -0.7, -0.95, 'c4', { metal: 0.75, rough: 0.3 }), w: i === 0 ? 2.6 : 1 }); }
          // combustor: an annular liner glowing with the turbine inlet temperature
          st.comb = new THREE.Mesh(new THREE.TorusGeometry(0.445, 0.05, 18, 96, 1.5 * PI), S.mat('c2', { glow: 0.6, rough: 0.4 }));
          st.comb.geometry.rotateY(PI / 2); st.comb.rotation.x = 1.5 * PI; st.comb.position.x = GEO.xComb; st.comb.scale.set(2.6, 1, 1); S.add(st.comb);
          st.combSec = [TH0 + 0.012, TH1 - 0.012].map((th) => S.surface((t, q) => PM(GEO.xComb + 0.13 * q * Math.cos(t), 0.445 + 0.05 * q * Math.sin(t), th), { u: [0, TAU], v: [0, 1], nu: 32, nv: 1, c: 'c2', glow: 0.6, rough: 0.4 }));
          // heat exchanger in the third stream: fins
          const hx = new THREE.Group();
          st.hxMat = S.mat('c3', { metal: 0.7, rough: 0.3, glow: 0.05 });
          const finGeo = new THREE.RingGeometry(0.815, 0.985, 96, 1, 0, 1.5 * PI); finGeo.rotateY(PI / 2);
          for (let i = 0; i < 11; i++) { const m = new THREE.Mesh(finGeo, st.hxMat); m.position.x = 0.12 + i * 0.065; m.rotation.x = 1.5 * PI; hx.add(m); }
          S.add(hx);
          { const fins = []; for (let i = 0; i < 11; i++) { const x = 0.12 + i * 0.065; for (const th of [TH0 + 0.01, TH1 - 0.01]) fins.push([PM(x, split3(x) + 0.015, th), PM(x, casingIn(x) - 0.015, th)]); } st.hxSec = S.lines(fins, { c: 'c3', w: 2.4, opacity: 0.95 }); }
          // the mode valve: variable vanes across the third-stream inlet, levers and a unison ring outside the casing
          st.NV = 24; st.vanes = [];
          const vaneGeo = new THREE.BoxGeometry(0.17, 0.014, 0.18), vaneMat = S.mat('c4', { metal: 0.6, rough: 0.3 });
          const leverGeo = new THREE.BoxGeometry(0.1, 0.018, 0.018), leverMat = S.mat('ink', { metal: 0.8, rough: 0.3 });
          for (let k = 0; k < st.NV; k++) {
            const th = TAU * (k + 0.5) / st.NV, piv = new THREE.Group();
            piv.position.set(GEO.xVane, 0, 0); piv.rotation.x = th - PI / 2;   // local +z points radially out at angle th
            const spin = new THREE.Group(); spin.position.z = 0.9; piv.add(spin);
            const vane = new THREE.Mesh(vaneGeo, vaneMat); vane.castShadow = true; spin.add(vane);
            const lev = new THREE.Mesh(leverGeo, leverMat); lev.position.set(0.05, 0, 0.21); spin.add(lev);
            S.add(piv); st.vanes.push(spin);
          }
          const ring = new THREE.Mesh(new THREE.TorusGeometry(1.115, 0.024, 10, 160, 1.5 * PI), S.mat('ink', { metal: 0.85, rough: 0.25 }));
          ring.geometry.rotateY(PI / 2); ring.rotation.x = 1.5 * PI; ring.position.x = GEO.xVane + 0.06; S.add(ring);
          // flow particles: one instanced low-poly mesh with per-instance colour
          st.NP = 2000;
          st.pm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), S.mat(new THREE.Color(1, 1, 1), { rough: 0.35, coat: 0.6 }), st.NP);
          st.pm.frustumCulled = false; st.pm.castShadow = false; { const white = new THREE.Color(1, 1, 1); for (let k = 0; k < st.NP; k++) st.pm.setColorAt(k, white); } st.pm.count = 0; S.add(st.pm);
          st.pcol = { c3: S.colour('c3'), c1: S.colour('c1'), c2: S.colour('c2') };
          // labels
          st.lab = {
            valve: S.label(T('mode valve', 'モード弁'), PM(GEO.xVane, 1.3, TH0 + 0.05), { small: true, align: 'middle' }),
            hx: S.label(T('heat exchanger', '熱交換器'), PM(0.45, 1.25, TH0 + 0.05), { small: true, align: 'middle', c: 'c3' }),
            core: S.label(T('combustor', '燃焼器'), PM(GEO.xComb + 0.2, 0.45, TH1 - 0.02), { small: true, c: 'c2', align: 'start', dy: 22 }),
          };
          // handle: the lever tip of the vane at the cut edge, dragged round the unison ring
          const thH = TH1 + 0.75, hp = PM(GEO.xVane + 0.06, 1.12, thH);
          st.hdl = S.handle(hp, { plane: [[1, 0, 0], [GEO.xVane + 0.06, 0, 0]], r: 0.095, c: 'hl', label: T('mode', 'モード'), onDrag: (q) => {
            // dragging the lever tip along the ring: up and toward the camera closes, down opens
            let a = Math.atan2(q.z, q.y); if (a < 0) a += TAU;
            const m = L.clamp((a - (thH - 0.6)) / 0.6, 0, 1);
            ctx.set('mode', Math.round(m * 100) / 100);
            return PM(GEO.xVane + 0.06, 1.12, thH - 0.6 * (1 - Math.round(m * 100) / 100));
          } });
          st.thH = thH;
                    st.S3 = S;
        },
        update(S) {
          const THREE = S.THREE, m = v.mode, ang = (1 - m) * 1.25;     // vane stagger: 0 open, 1.25 rad nearly closed
          st.vanes.forEach((sp) => { sp.rotation.z = ang; });
          st.hdl.at(PM(GEO.xVane + 0.06, 1.12, st.thH - 0.6 * (1 - m)));
          st.comb.material.emissiveIntensity = 0.25 + 0.75 * L.clamp((v.T4 - 1450) / 600, 0, 1);
          st.hxMat.emissive = S.colour('c2'); st.hxMat.emissiveIntensity = E.ok ? 0.6 * L.clamp(E.dT / 80, 0, 1) : 0;
          // streams: radial bounds along x and a speed profile (m/s) that ends at each jet speed
          const V0 = Math.max(E.V0, 120);
          const M3 = 0.03, PL = 0.7;
          const SP = E.ok ? [
            { c: 'c3', mdot: E.m3, xe: GEO.xExit3, x1: GEO.xExit3 + PL, Vj: E.V[1],
              lo: (x) => x < GEO.xSplit3 ? 0.84 : split3(Math.min(x, GEO.xExit3)) + M3 + 0.01 * Math.max(0, x - GEO.xExit3),
              hi: (x) => casingIn(Math.min(x, GEO.xExit3)) - M3 - 0.03 * Math.max(0, x - GEO.xExit3) },
            { c: 'c1', mdot: E.m2, xe: GEO.xExit2, x1: GEO.xExit2 + PL, Vj: E.V[0],
              lo: (x) => x < GEO.xSplitC ? 0.6 : coreOut(Math.min(x, GEO.xExit2)) + M3,
              hi: (x) => x < GEO.xSplit3 ? 0.78 : split3(Math.min(x, GEO.xExit2)) - M3 - 0.03 * Math.max(0, x - GEO.xExit2) },
            { c: 'c2', mdot: E.mc, xe: GEO.xExitC, x1: GEO.xExitC + PL, Vj: E.V9,
              lo: (x) => x < GEO.xSplitC ? Math.max(hubR(x) + M3, 0.28) : Math.max(0.04, hubR(x) + M3),
              hi: (x) => x < GEO.xSplitC ? 0.54 : coreOut(Math.min(x, GEO.xExitC)) - M3 - 0.06 * Math.max(0, x - GEO.xExitC) },
          ] : [];
          const XS = GEO.x0 + 0.05, VIS = 0.0032;
          const speed = (s, x) => {
            if (x < GEO.xFan1) return V0;
            if (x < s.xe - 0.6) return s.c === 'c2' ? (x > 0.5 && x < 1.3 ? 110 : 170) : 200;
            if (x < s.xe) return 200 + (s.Vj - 200) * (x - s.xe + 0.6) / 0.6;
            return s.Vj;
          };
          // cumulative transit time table per stream, so that particle flux is proportional to mass flow
          SP.forEach((s) => { const n = 240, tab = new Float64Array(n + 1); let tt = 0; for (let i = 1; i <= n; i++) { const x = XS + (s.x1 - XS) * (i - 0.5) / n; tt += (s.x1 - XS) / n / (VIS * speed(s, x)); tab[i] = tt; } s.tab = tab; s.Tt = tt; s.n = n; });
          const wsum = SP.reduce((a, s) => a + s.mdot * s.Tt, 0);
          let k0 = 0; SP.forEach((s) => { s.k0 = k0; s.N = Math.round(st.NP * s.mdot * s.Tt / wsum); k0 += s.N; }); if (SP.length) SP[SP.length - 1].N += st.NP - k0;
          const hash = (i, j) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
          const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
          SP.forEach((s) => { for (let k = 0; k < s.N; k++) st.pm.setColorAt(s.k0 + k, st.pcol[s.c]); });
          if (st.pm.instanceColor) st.pm.instanceColor.needsUpdate = true;
          st.draw3d = (t) => {
            SP.forEach((s) => {
              for (let k = 0; k < s.N; k++) {
                const i = s.k0 + k, ph = ((hash(i, 1) + t / s.Tt) % 1) * s.Tt;
                let lo = 0, hi = s.n; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s.tab[mid] <= ph) lo = mid; else hi = mid; }
                const x = XS + (s.x1 - XS) * (lo + (ph - s.tab[lo]) / Math.max(1e-9, s.tab[hi] - s.tab[lo])) / s.n;
                const r = s.lo(x) + (s.hi(x) - s.lo(x)) * hash(i, 2), th = TH0 + 0.025 + 0.06 * hash(i, 3);
                p.set(x, r * Math.cos(th), r * Math.sin(th)); m4.compose(p, q, sc.setScalar(0.0145)); st.pm.setMatrixAt(i, m4);
              }
            });
            st.pm.count = SP.length ? st.NP : 0;
            st.pm.instanceMatrix.needsUpdate = true;
            S.invalidate();
          };
          st.anim?.redraw();
          draw2d();
        },
        fallback() { st.flat = true; st.cap1.textContent = T('A generic three-stream engine in half section (schematic): the third stream (teal) leaves through the mode valve, the rest splits into inner bypass (blue) and core (orange).', '一般的な三流路機関の半断面です（模式図）。第三流路（青緑）はモード弁を通って出ていき、残りは内側バイパス（青）とコア（橙）に分かれます。'); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
      st.anim?.redraw();
    },
  };

  /* ---------------- 3. mission range ---------------- */
  const ENG = [['fixed low-bypass', '固定の低バイパス'], ['fixed high-bypass', '固定の高バイパス'], ['adaptive', 'アダプティブ']];
  const ECOL = ['c2', 'c1', 'c4'];
  D['mission-range'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const Ms = mission(v.T4, v.ld, v.ff, v.Freq * 1000, v.tdash * 60);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Fuel left against distance flown, for a 30-tonne twin-engine aircraft flying out at Mach 0.9 at 11 km, fighting for the set time at Mach 1.5, and flying home. Each engine flies as far out as its fuel allows. The steep drop in the middle is the dash.', '飛行距離に対する残りの燃料です。30 トンの双発機が高度 11 km をマッハ 0.9 で進出し、決めた時間だけマッハ 1.5 で戦闘し、帰投します。どの機関も燃料が許すかぎり遠くまで進出します。中央の急な落ち込みがダッシュです。'));
      const ph = L.h('div', '', c1), bar = L.h('div', '', c1);
      const fuel = MIS.m0 * v.ff, R0 = Math.max(...Ms.eng.map((e) => e.R)) / 1000;
      const xMax = Math.max(100, 2 * R0 + Math.max(...Ms.eng.map((e) => e.fly.ddash)) / 1000) * 1.04;
      const f = L.fig(ph, { x: [0, xMax], y: [0, 105], aspect: 0.62, maxH: 330, xlabel: T('distance flown (km)', '飛行距離（km）'), ylabel: T('fuel left (%)', '残燃料（%）') });
      const path = (e) => {
        const R = e.R, pts = [], fr = (mass) => 100 * (mass - MIS.m0 * (1 - v.ff)) / fuel;
        for (let i = 0; i <= 60; i++) { const d = R * i / 60; pts.push([d / 1000, fr(breguetMass(MIS.m0, d, e.Sc, e.Vc, v.ld)), (d / e.Vc)]); }
        const t1 = R / e.Vc; pts.push([(R + e.fly.ddash) / 1000, fr(e.fly.m2), t1 + v.tdash * 60]);
        for (let i = 1; i <= 60; i++) { const d = R * i / 60; pts.push([(R + e.fly.ddash + d) / 1000, fr(breguetMass(e.fly.m2, d, e.Sc, e.Vc, v.ld)), t1 + v.tdash * 60 + d / e.Vc]); }
        return pts;
      };
      const paths = Ms.eng.map(path);
      paths.forEach((p, i) => f.line(p.map((q) => [q[0], q[1]]), { c: ECOL[i], w: 1.2, op: 0.35, dash: Ms.eng[i].can ? undefined : '4 3' }));
      f.hline(0, { c: 'muted', w: 1 });
      const tEnd = Math.max(...paths.map((p) => p[p.length - 1][2]));
      const drawAt = (tt) => {
        f.clear('over');
        paths.forEach((p, i) => {
          const sub = []; for (const q of p) { if (q[2] <= tt) sub.push(q); else { const a = sub[sub.length - 1]; if (a) { const u = (tt - a[2]) / (q[2] - a[2]); sub.push([a[0] + u * (q[0] - a[0]), a[1] + u * (q[1] - a[1]), tt]); } break; } }
          if (sub.length > 1) f.line(sub.map((q) => [q[0], q[1]]), { c: ECOL[i], w: 2.8, layer: 'over', dash: Ms.eng[i].can ? undefined : '5 3' });
          const h = sub[sub.length - 1]; if (h) f.dot(h[0], h[1], { c: ECOL[i], r: 5, layer: 'over' });
        });
      };
      ctx.state.anim = L.animator(bar, (dt, t, lb) => { const tt = Math.min(tEnd, t * tEnd / 6); drawAt(tt); lb.textContent = `${fmt(tt / 3600, 2)} h`; return tt < tEnd; }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Play: fly the mission', '再生：任務を飛ぶ') });
      // right: dash thrust and radius
      L.h('p', 'lab-cap', c2, T('Dash thrust each engine can give at Mach 1.5 with 100 kg/s of air, against the requirement (gold, drag it). Only an engine that can make it can fly the mission.', 'マッハ 1.5、空気 100 kg/s で各機関が出せるダッシュ推力と、要求値（金色、ドラッグできます）です。要求を満たせる機関だけがこの任務を飛べます。'));
      const Fm = Math.max(...Ms.eng.map((e) => e.Fdash / 1000), v.Freq) * 1.25;
      const TICKS3 = [[0.5, T('low', '低')], [1.5, T('high', '高')], [2.5, T('adaptive', 'アダプティブ')]];
      const g = L.fig(c2, { x: [0, 3], y: [0, Fm], aspect: 0.55, maxH: 220, ylabel: T('dash thrust (kN)', 'ダッシュ推力（kN）'), ticksX: TICKS3 });
      Ms.eng.forEach((e, i) => { g.rect(i + 0.2, 0, 0.6, e.Fdash / 1000, { c: ECOL[i], fill: ECOL[i], fo: e.can ? 0.8 : 0.3, w: 1.2 }); g.text(i + 0.5, e.Fdash / 1000, fmt(e.Fdash / 1000, 1), { small: true, anchor: 'middle', dy: -6 }); });
      g.hline(v.Freq, { c: 'hl', w: 2 });
      g.handle(2.95, v.Freq, { c: 'hl', axis: 'y', bounds: [0, 3, 20, 80], snap: 1, label: T('required', '要求値'), onDrag: (x, y) => ctx.set('Freq', Math.round(L.clamp(y, 20, 80))) });
      L.h('p', 'lab-cap', c2, T('Combat radius on the same fuel. * cannot make the dash thrust.', '同じ燃料での戦闘行動半径です。* はダッシュの推力を出せません。'));
      const Rm = Math.max(...Ms.eng.map((e) => e.R / 1000), 1) * 1.22;
      const hR = L.fig(c2, { x: [0, 3], y: [0, Rm], aspect: 0.5, maxH: 200, ylabel: T('radius (km)', '行動半径（km）'), ticksX: TICKS3 });
      Ms.eng.forEach((e, i) => { hR.rect(i + 0.2, 0, 0.6, e.R / 1000, { c: ECOL[i], fill: ECOL[i], fo: e.can ? 0.8 : 0.25, w: 1.2, dash: e.can ? undefined : '4 3' }); hR.text(i + 0.5, e.R / 1000, fmt(e.R / 1000, 0) + (e.can ? '' : '*'), { small: true, anchor: 'middle', dy: -6 }); });
      L.legend(ctx.host, ENG.map((n, i) => ({ c: ECOL[i], label: T(...n) })).concat([{ c: 'hl', label: T('required dash thrust', '要求ダッシュ推力') }]));
      const [lo, hi, ad] = Ms.eng;
      ctx.readout([
        { k: T('cruise TSFC: low, high, adaptive', '巡航 TSFC：低、高、アダプティブ'), v: `${fmt(mg(lo.Sc), 2)}, ${fmt(mg(hi.Sc), 2)}, ${fmt(mg(ad.Sc), 2)} mg/(N·s)` },
        { k: T('cruise thrust needed per engine W/(n L/D)', '巡航に要る 1 基あたりの推力 W/(n L/D)'), v: fmt(Ms.Fcruise / 1000, 1) + ' kN' },
        { k: T('combat radius: low, high, adaptive', '戦闘行動半径：低、高、アダプティブ'), v: `${fmt(lo.R / 1000, 0)}, ${fmt(hi.R / 1000, 0)}${hi.can ? '' : '*'}, ${fmt(ad.R / 1000, 0)} km` },
        { k: T('adaptive vs low-bypass: cruise TSFC', 'アダプティブと低バイパスの比較：巡航 TSFC'), v: '−' + fmt(100 * Ms.tsfcSave, 1) + '%', tone: 'key' },
        { k: T('fuel for the same mission', '同じ任務の燃料'), v: '−' + fmt(100 * Ms.fuelSave, 1) + '%', tone: 'key' },
        { k: T('radius on the same fuel', '同じ燃料での行動半径'), v: Number.isFinite(Ms.radiusGain) ? '+' + fmt(100 * Ms.radiusGain, 1) + '%' : '−', tone: 'good' },
      ], !lo.can
        ? T('Even the low-bypass mode cannot give this much dash thrust from 100 kg/s of air at this turbine temperature: no engine of this size can fly the mission.', 'このタービン温度では、低バイパスのモードでも空気 100 kg/s からこれだけのダッシュ推力は出せません。この大きさの機関ではどれもこの任務を飛べません。')
        : hi.can
          ? T('At this requirement even the high-bypass engine can dash, and it would be the best choice: the adaptive engine earns its keep only when the dash needs more thrust than a cruise-optimised cycle can give.', 'この要求なら高バイパス機関でもダッシュでき、それが最良の選択になります。アダプティブ機関が真価を発揮するのは、巡航向けのサイクルでは出せない推力をダッシュが求めるときだけです。')
          : T(`The high-bypass engine would fly farthest but cannot make the dash thrust (*). The low-bypass engine can, but burns more in every cruising kilometre. The adaptive engine cruises like the first and fights like the second. In the Breguet equation the radius is inversely proportional to TSFC, so ${fmt(100 * Ms.tsfcSave, 0)}% less fuel per newton gives about ${fmt(100 * (1 / (1 - Ms.tsfcSave) - 1), 0)}% more range: the same arithmetic links the published "25% fuel, 30% range" pair.`, `高バイパス機関は最も遠くまで飛べますが、ダッシュの推力を出せません（*）。低バイパス機関は出せますが、巡航の 1 km ごとに多くの燃料を使います。アダプティブ機関は前者のように巡航し、後者のように戦います。ブレゲーの式では行動半径は TSFC に反比例するので、1 N あたりの燃料が ${fmt(100 * Ms.tsfcSave, 0)}% 少なければ、航続距離はおよそ ${fmt(100 * (1 / (1 - Ms.tsfcSave) - 1), 0)}% 延びます。公表された「燃料 25%、航続距離 30%」の組も、同じ計算で結びついています。`));
    },
  };
})();
