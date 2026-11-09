'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Nernst: E = (RT/zF) ln(c_out/c_in). Goldman-Hodgkin-Katz voltage equation for K+, Na+ and Cl- with relative
   * permeabilities. Hodgkin-Huxley (1952) squid axon in the modern convention (rest near -65 mV), with the rates scaled
   * by phi = 3^((T - 6.3)/10). Passive cable with sealed ends: lambda = sqrt(R_m d/(4 R_i)); a steady current injected at
   * x0 gives V proportional to cosh(x/lambda) cosh((L - x0)/lambda) for x < x0 and the mirror image beyond.
   */
  const R = 8.314462618, F = 96485.33212;
  const RTF = (Tc) => (R * (Tc + 273.15)) / F * 1000;            // mV
  const nernst = (co, ci, z, Tc = 37) => (RTF(Tc) / z) * Math.log(co / ci);
  const ghk = (c, p, Tc = 37) => RTF(Tc) * Math.log((p.K * c.Ko + p.Na * c.Nao + p.Cl * c.Cli) / (p.K * c.Ki + p.Na * c.Nai + p.Cl * c.Clo));
  const ION = { Ko: 5, Ki: 140, Nao: 145, Nai: 12, Clo: 110, Cli: 7, Cao: 2, Cai: 1e-4 };   // mammalian neuron, mM

  // Hodgkin-Huxley
  const vt = (x) => (Math.abs(x) < 1e-7 ? 1 : x / (1 - Math.exp(-x)));               // x/(1 - e^-x), finite at 0
  const rates = (V) => ({
    an: 0.1 * vt((V + 55) / 10), bn: 0.125 * Math.exp(-(V + 65) / 80),
    am: vt((V + 40) / 10), bm: 4 * Math.exp(-(V + 65) / 18),
    ah: 0.07 * Math.exp(-(V + 65) / 20), bh: 1 / (1 + Math.exp(-(V + 35) / 10)),
  });
  const HH = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387 };
  const steady = (V) => { const r = rates(V); return { m: r.am / (r.am + r.bm), h: r.ah / (r.ah + r.bh), n: r.an / (r.an + r.bn) }; };
  function currents(V, m, h, n) { return { INa: HH.gNa * m ** 3 * h * (V - HH.ENa), IK: HH.gK * n ** 4 * (V - HH.EK), IL: HH.gL * (V - HH.EL) }; }
  function deriv(s, I, phi) {
    const [V, m, h, n] = s, r = rates(V), c = currents(V, m, h, n);
    return [(I - c.INa - c.IK - c.IL) / HH.C, phi * (r.am * (1 - m) - r.bm * m), phi * (r.ah * (1 - h) - r.bh * h), phi * (r.an * (1 - n) - r.bn * n)];
  }
  // stimulus: pulses [{t0, w, amp}] in ms and uA/cm^2
  function simulate(pulses, o = {}) {
    const dt = o.dt ?? 0.01, tEnd = o.tEnd ?? 50, phi = Math.pow(3, ((o.T ?? 6.3) - 6.3) / 10), V0 = o.V0 ?? -65, g = steady(V0);
    let s = [V0, g.m, g.h, g.n]; const out = { t: [], V: [], m: [], h: [], n: [], I: [] };
    const Iat = (t) => pulses.reduce((a, p) => a + (t >= p.t0 && t < p.t0 + p.w ? p.amp : 0), 0);
    const N = Math.round(tEnd / dt), every = Math.max(1, Math.round(0.05 / dt));
    for (let i = 0; i <= N; i++) {
      const t = i * dt;
      if (i % every === 0) { out.t.push(t); out.V.push(s[0]); out.m.push(s[1]); out.h.push(s[2]); out.n.push(s[3]); out.I.push(Iat(t)); }
      const I = Iat(t + dt / 2), k1 = deriv(s, Iat(t), phi), s2 = s.map((x, j) => x + (dt / 2) * k1[j]), k2 = deriv(s2, I, phi), s3 = s.map((x, j) => x + (dt / 2) * k2[j]), k3 = deriv(s3, I, phi), s4 = s.map((x, j) => x + dt * k3[j]), k4 = deriv(s4, Iat(t + dt), phi);
      s = s.map((x, j) => x + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    }
    return out;
  }
  const spikes = (V, thr = 0) => { let c = 0; for (let i = 1; i < V.length; i++) if (V[i - 1] < thr && V[i] >= thr) c++; return c; };
  // threshold amplitude of a single pulse of width w (ms), by bisection
  function threshold(w = 1, Tc = 6.3) {
    let lo = 0, hi = 60;
    for (let k = 0; k < 30; k++) { const mid = 0.5 * (lo + hi), s = simulate([{ t0: 2, w, amp: mid }], { tEnd: 20, T: Tc, dt: 0.02 }); if (spikes(s.V) > 0) hi = mid; else lo = mid; }
    return hi;
  }
  // passive cable
  const lambda = (Rm, d_um, Ri = 100) => Math.sqrt((Rm * d_um * 1e-4) / (4 * Ri)) * 10;   // mm (Rm ohm cm^2, d in um, Ri ohm cm)
  /* V(x)/V(x0) on a dendrite 0 <= x <= Lc: soma at x = 0 drawing rho times the input conductance of a semi-infinite
     cable (Rall's boundary condition V'(0) = rho V(0)/lambda; rho = 0 is a sealed end), sealed tip at Lc */
  function cableV(x, x0, Lc, lam, rho = 0) {
    const prox = (y) => Math.cosh(y / lam) + rho * Math.sinh(y / lam), dist = (y) => Math.cosh((Lc - y) / lam);
    return x <= x0 ? prox(x) / prox(x0) : dist(x) / dist(x0);
  }
  const vUnmy = (d) => 1.0 * Math.sqrt(d);     // m/s, d in um: rough fit for unmyelinated mammalian fibers at 37 C
  const vMyel = (d) => 6.0 * d;                 // m/s, d = outer diameter in um (Hursh 1939)
  const M = { R, F, RTF, nernst, ghk, ION, rates, HH, steady, currents, deriv, simulate, spikes, threshold, lambda, cableV, vUnmy, vMyel };
  (window.LabModels = window.LabModels || {})['neuron-biophysics'] = M;

  /* ================= 1. Nernst and GHK ================= */
  D['nernst-ghk'] = {
    render(ctx, v) {
      const Tc = v.temp, c = { ...ION, Ko: v.ko, Nao: v.nao }, pNa = Math.pow(10, v.lp), p = { K: 1, Na: pNa, Cl: 0.45 };
      const E = { K: nernst(c.Ko, c.Ki, 1, Tc), Na: nernst(c.Nao, c.Nai, 1, Tc), Cl: nernst(c.Clo, c.Cli, -1, Tc), Ca: nernst(c.Cao, c.Cai, 2, Tc) };
      const Vm = ghk(c, p, Tc);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Each ion’s equilibrium potential on one voltage scale, and the membrane potential (gold) that the Goldman–Hodgkin–Katz equation predicts from all of them at once, weighted by permeability. Drag the gold bar to set the sodium permeability.', '各イオンの平衡電位を一つの電圧の目盛りに並べ、ゴールドマン・ホジキン・カッツの式が透過性の重みをつけてそれらすべてから予言する膜電位（金色）を示します。金色の棒をドラッグしてナトリウムの透過性を決めてください。'));
      const f = L.fig(c1, { x: [0, 4], y: [-110, 150], aspect: 1.05, maxH: 420, ylabel: T('membrane potential (mV)', '膜電位（mV）'), ticksX: [[0.6, 'K⁺'], [1.4, 'Na⁺'], [2.2, 'Cl⁻'], [3.0, 'Ca²⁺'], [3.6, 'Vₘ']] });
      f.hline(0, { c: 'muted', w: 1 });
      const ions = [['K', 0.6, 'c1'], ['Na', 1.4, 'c2'], ['Cl', 2.2, 'c3'], ['Ca', 3.0, 'c4']];
      for (const [k, x, col] of ions) {
        const e = clamp(E[k], -110, 150);
        f.rect(x - 0.24, Math.min(0, e), 0.48, Math.abs(e), { fill: col, fo: 0.35, c: col, w: 1.2 });
        f.seg([x - 0.3, e], [x + 0.3, e], { c: col, w: 3 });
        f.text(x, e, `${fmt(E[k], 3)}`, { small: true, anchor: 'middle', dy: e >= 0 ? -8 : 16, c: col });
      }
      f.seg([0.2, Vm], [3.85, Vm], { c: 'hl', w: 1.3, dash: '5 4' });
      f.handle(3.6, Vm, { c: 'hl', axis: 'y', bounds: [3.6, 3.6, -100, 60], label: T('membrane potential: drag to change the sodium permeability', '膜電位：ドラッグでナトリウムの透過性を変えます'), onDrag: (x, y) => {
        // invert GHK for pNa at fixed pK and pCl
        const ex = Math.exp(clamp(y, -99, 55) / RTF(Tc)), num = ex * (c.Ki + 0.45 * c.Clo) - (c.Ko + 0.45 * c.Cli), den = c.Nao - ex * c.Nai;
        const pn = num / den; if (pn > 0) ctx.set('lp', clamp(Math.round(Math.log10(pn) * 20) / 20, -3, 1.5));
      } });
      f.text(3.6, Vm, `${fmt(Vm, 3)} mV`, { small: true, anchor: 'middle', dy: Vm > 0 ? -12 : 18, c: 'hl' });
      L.h('p', 'lab-cap', c2, T(tx`Resting potential against external potassium, on a log scale. At high \([\mathrm K^+]_o\) the membrane follows the potassium Nernst line, \(61.5\ \mathrm{mV}\) per tenfold at \(37\,^\circ\mathrm C\); at low \([\mathrm K^+]_o\) the small sodium leak pulls it away, as Hodgkin and Katz measured.`, tx`外液のカリウム濃度（対数目盛）に対する静止電位です。\([\mathrm K^+]_o\) が高いと膜はカリウムのネルンストの直線（\(37\,^\circ\mathrm C\) で 10 倍あたり \(61.5\ \mathrm{mV}\)）に従い、低いと小さなナトリウムの漏れがそこから引き離します。ホジキンとカッツが測ったとおりです。`));
      const g = L.fig(c2, { x: [0, 2.3], y: [-120, 10], aspect: 0.9, maxH: 420, xlabel: T(tx`\(\log_{10}[\mathrm K^+]_o\) (mM)`, tx`\(\log_{10}[\mathrm K^+]_o\)（mM）`), ylabel: T('potential (mV)', '電位（mV）') });
      g.line(L.sample(0, 2.3, 200, (lk) => [lk, nernst(10 ** lk, c.Ki, 1, Tc)]), { c: 'c1', w: 2, dash: '6 4' });
      g.line(L.sample(0, 2.3, 200, (lk) => [lk, ghk({ ...c, Ko: 10 ** lk }, p, Tc)]), { c: 'hl', w: 2.8 });
      g.hline(0, { c: 'muted', w: 0.8 });
      g.handle(Math.log10(v.ko), Vm, { c: 'hl', axis: 'x', bounds: [0, Math.log10(20), -120, 10], label: T('external potassium', '外液のカリウム'), onDrag: (lk) => ctx.set('ko', clamp(Math.round(10 ** lk * 2) / 2, 1, 20)) });
      L.legend(ctx.host, [{ c: 'c1', label: tx`\(E_{\mathrm K}\)` }, { c: 'c2', label: tx`\(E_{\mathrm{Na}}\)` }, { c: 'c3', label: tx`\(E_{\mathrm{Cl}}\)` }, { c: 'c4', label: tx`\(E_{\mathrm{Ca}}\)` }, { c: 'hl', label: T(tx`membrane potential \(V_m\) (GHK)`, tx`膜電位 \(V_m\)（GHK）`) }]);
      ctx.readout([
        { k: T(tx`\(RT/F\) at this temperature`, tx`この温度での \(RT/F\)`), v: `${fmt(RTF(Tc), 4)} mV` },
        { k: tx`\(E_{\mathrm K}=\frac{RT}{F}\ln\frac{[\mathrm K^+]_o}{[\mathrm K^+]_i}\)`, v: `${fmt(E.K, 3)} mV`, tone: 'key' },
        { k: tx`\(E_{\mathrm{Na}}\)`, v: `${fmt(E.Na, 3)} mV` },
        { k: T(tx`permeabilities \(P_{\mathrm K}:P_{\mathrm{Na}}:P_{\mathrm{Cl}}\)`, tx`透過性 \(P_{\mathrm K}:P_{\mathrm{Na}}:P_{\mathrm{Cl}}\)`), v: tx`\(1:${fmt(pNa, 3)}:0.45\)` },
        { k: T(tx`membrane potential \(V_m\) (GHK)`, tx`膜電位 \(V_m\)（GHK）`), v: `${fmt(Vm, 3)} mV`, tone: 'key' },
      ], pNa > 1 ? T(tx`With sodium permeability above potassium’s the membrane swings towards \(E_{\mathrm{Na}}\): this is the peak of an action potential, when sodium channels have opened.`, tx`ナトリウムの透過性がカリウムを上回ると、膜は \(E_{\mathrm{Na}}\) の側へ振れます。ナトリウムチャネルが開いた活動電位の頂点がこれです。`)
        : T(tx`At rest the membrane is mostly permeable to potassium, so it sits a little above \(E_{\mathrm K}\). Raising \([\mathrm K^+]_o\), as in hyperkalemia, depolarizes every cell.`, tx`静止時の膜はおもにカリウムを通すので、\(E_{\mathrm K}\) より少し上に位置します。高カリウム血症のように \([\mathrm K^+]_o\) が上がると、すべての細胞が脱分極します。`));
    },
  };

  /* ================= 2. Hodgkin-Huxley ================= */
  D['hodgkin-huxley'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const pulses = [{ t0: 5, w: 1, amp: v.amp }]; if (v.amp2 > 0) pulses.push({ t0: 5 + v.delay, w: 1, amp: v.amp2 });
      const S = simulate(pulses, { T: v.temp, tEnd: 50 }), N = S.t.length;
      const thr = ctx.state.thrKey === v.temp ? ctx.state.thr : (ctx.state.thr = threshold(1, v.temp), ctx.state.thrKey = v.temp, ctx.state.thr);
      L.h('p', 'lab-cap', ctx.host, T('Membrane potential after one or two 1 ms current pulses (bars along the bottom). Below threshold the membrane relaxes; above it the sodium channels run away and an action potential fires. A second pulse soon after fails: the membrane is refractory.', '1 ms の電流パルスを 1 回か 2 回与えたあとの膜電位です（下の棒がパルス）。しきい値より下では膜は元に戻り、上ではナトリウムチャネルが暴走して活動電位が発火します。すぐあとの 2 回目のパルスは失敗します。膜が不応期にあるからです。'));
      const f = L.fig(ctx.host, { x: [0, 50], y: [-90, 55], aspect: 0.38, maxH: 300, xlabel: T('time (ms)', '時間（ms）'), ylabel: tx`\(V\) (mV)` });
      f.hline(HH.ENa, { c: 'c2', dash: '4 4', w: 1 }); f.text(49, HH.ENa, tx`\(E_{\mathrm{Na}}\)`, { small: true, anchor: 'end', dy: -5, c: 'c2' });
      f.hline(HH.EK, { c: 'c1', dash: '4 4', w: 1 }); f.text(49, HH.EK, tx`\(E_{\mathrm K}\)`, { small: true, anchor: 'end', dy: 13, c: 'c1' });
      for (const p of pulses) f.rect(p.t0, -90, p.w, 6 * Math.min(1.6, p.amp / 15), { fill: 'c4', fo: 0.9, nostroke: true });
      L.h('p', 'lab-cap', ctx.host, T(tx`The three gates: sodium activation \(m\) (fast), sodium inactivation \(h\) and potassium activation \(n\) (slow). The spike is \(m\) opening before \(h\) can close it; recovery waits for \(h\) to reopen and \(n\) to close.`, tx`三つのゲートです。ナトリウムの活性化 \(m\)（速い）、ナトリウムの不活性化 \(h\)、カリウムの活性化 \(n\)（遅い）。スパイクは \(h\) が閉じる前に \(m\) が開くことで起こり、回復には \(h\) が再び開き \(n\) が閉じるのを待たなければなりません。`));
      const g = L.fig(ctx.host, { x: [0, 50], y: [0, 1], aspect: 0.24, maxH: 190, xlabel: T('time (ms)', '時間（ms）'), ylabel: T('gate', 'ゲート') });
      L.legend(ctx.host, [{ c: 'ink', label: tx`\(V\)` }, { c: 'c2', label: T(tx`\(m\) (\(\mathrm{Na^+}\) activation)`, tx`\(m\)（\(\mathrm{Na^+}\) 活性化）`) }, { c: 'c3', label: T(tx`\(h\) (\(\mathrm{Na^+}\) inactivation)`, tx`\(h\)（\(\mathrm{Na^+}\) 不活性化）`) }, { c: 'c1', label: T(tx`\(n\) (\(\mathrm{K^+}\) activation)`, tx`\(n\)（\(\mathrm{K^+}\) 活性化）`) }, { kind: 'fill', c: 'c4', label: T('stimulus', '刺激') }]);
      const k = spikes(S.V), peak = Math.max(...S.V);
      ctx.readout([
        { k: T('spikes fired', '発火したスパイク'), v: `${k} / ${pulses.length}`, tone: 'key' },
        { k: T('peak potential', '最大電位'), v: `${fmt(peak, 3)} mV` },
        { k: T('threshold for a 1 ms pulse at this temperature', 'この温度での 1 ms パルスのしきい値'), v: tx`\(${fmt(thr, 3)}\ \mu\mathrm{A/cm^2}\)` },
        { k: T(tx`rate factor \(\phi=3^{(T-6.3)/10}\)`, tx`速度因子 \(\phi=3^{(T-6.3)/10}\)`), v: fmt(Math.pow(3, (v.temp - 6.3) / 10), 3) },
      ], T(tx`The threshold is not a fixed voltage built into the model: it emerges where the inward sodium current, which grows as \(m^3\), first outruns the outward potassium and leak currents.`, tx`しきい値はモデルに組み込まれた固定の電圧ではありません。\(m^3\) で増える内向きのナトリウム電流が、外向きのカリウム電流と漏れ電流を初めて上回るところに現れるのです。`));
      const upto = (t) => { const j = Math.min(N - 1, Math.round(t / 0.05)); return j; };
      const draw = (t) => {
        const j = upto(t);
        f.clear('main'); g.clear('main');
        const slice = (arr) => L.seq(j + 1, (i) => [S.t[i], arr[i]]);
        f.line(slice(S.V), { c: 'ink', w: 2.4 });
        g.line(slice(S.m), { c: 'c2', w: 2 }); g.line(slice(S.h), { c: 'c3', w: 2 }); g.line(slice(S.n), { c: 'c1', w: 2 });
        f.dot(S.t[j], S.V[j], { c: 'hl', r: 4.5 });
        return j < N - 1;
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { const more = draw(t * 12); if (lab) L.setText(lab, tx`\(t=${fmt(Math.min(50, t * 12), 3)}\ \mathrm{ms}\)`); return more; }, { initialT: 1e6, once: true, playLabel: T('Replay', '再生') });
    },
  };

  /* ================= 3. the cable (3D) ================= */
  // a deterministic random source for the neuron's shape
  const rnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const SOMA = [0, 0, 1.05], AX0 = 0.4, AXL = 5.7;
  const apical = (u) => [AX0 + AXL * u, 0.22 * Math.sin(Math.PI * u) - 0.05 * u, SOMA[2] + 0.05 + 0.45 * u + 0.12 * Math.sin(2.2 * Math.PI * u)];
  const apicalR = (u, d) => (0.05 + 0.024 * d) * (1 - 0.45 * u) * (u < 0.06 ? 1 + 2.2 * (0.06 - u) / 0.06 : 1);
  const vColour = (THREE, v) => {   // resting membrane rose -> orange -> pale gold as the voltage rises
    const a = new THREE.Color('#7d4256'), b = new THREE.Color('#ee7d2a'), c = new THREE.Color('#ffe27a');
    return v < 0.5 ? a.lerp(b, v / 0.5) : b.lerp(c, (v - 0.5) / 0.5);
  };
  D['cable-equation'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        st.cap1 = L.h('p', 'lab-cap', st.frame); st.v3 = L.h('div', '', st.frame);
        const row = L.h('div', 'lab-row', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap2 = L.h('p', 'lab-cap', st.c1); st.g2 = L.h('div', '', st.c1);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const lam = lambda(v.rm, v.d), Lc = v.len, x0 = v.x0 * Lc, rho = v.rho, V = (x) => cableV(x, x0, Lc, lam, rho);
      L.setText(st.cap1, T(tx`A pyramidal neuron with a glass micropipette injecting a steady current into its apical dendrite. The dendrite is painted by its voltage as a fraction of the value under the pipette: charge leaks out through the membrane as it spreads, so the voltage decays over the length constant \(\lambda\). The tip of the dendrite is sealed; at the other end the soma drains current like a load \(\rho\) times a semi-infinite cable. Drag the pipette along the dendrite. Diameters and the axon’s myelin are drawn thicker than life.`, tx`ガラスの微小ピペットで、錐体ニューロンの尖端樹状突起に一定の電流を注入しています。樹状突起は、ピペットの下での値に対する電圧の割合で塗り分けています。電荷は広がりながら膜を通して漏れ出すので、電圧は長さ定数 \(\lambda\) の距離で減衰します。樹状突起の先端は閉じていて、反対側の端では細胞体が、半無限ケーブルの \(\rho\) 倍の負荷として電流を吸い込みます。ピペットを樹状突起に沿ってドラッグしてください。直径と軸索の髄鞘は実物より太く描いています。`));
      L.setText(st.cap2, T(tx`The voltage profile along the dendrite, soma at the left, with the infinite-cable exponential \(e^{-|x-x_0|/\lambda}\) for comparison. The sealed tip reflects current back and flattens the voltage; the soma pulls it down.`, tx`樹状突起に沿った電圧分布で、左端が細胞体です。比較のため無限ケーブルの指数関数 \(e^{-|x-x_0|/\lambda}\) も描いています。閉じた先端は電流を跳ね返して電圧を平らにし、細胞体は電圧を引き下げます。`));
      L.setText(st.cap3, T(tx`Conduction speed against fiber diameter: bare axons speed up only as \(\sqrt d\), myelinated ones in proportion to \(d\), by letting the signal jump between the nodes of Ranvier.`, tx`線維の直径に対する伝導速度です。むき出しの軸索は \(\sqrt d\) でしか速くなりませんが、有髄線維は信号をランビエ絞輪から絞輪へ跳ばすことで \(d\) に比例して速くなります。`));
      const draw2d = () => {
        st.g2.replaceChildren(); st.g3.replaceChildren();
        const f = L.fig(st.g2, { x: [0, Lc], y: [0, 1.05], aspect: 0.56, maxH: 260, xlabel: T(tx`distance from the soma \(x\) (mm)`, tx`細胞体からの距離 \(x\)（mm）`), ylabel: tx`\(V/V(x_0)\)` });
        f.line(L.sample(0, Lc, 300, (x) => [x, Math.exp(-Math.abs(x - x0) / lam)]), { c: 'c3', w: 1.8, dash: '6 4' });
        f.area(L.sample(0, Lc, 300, (x) => [x, V(x)]), { c: 'c2', fo: 0.18 });
        f.line(L.sample(0, Lc, 300, (x) => [x, V(x)]), { c: 'c2', w: 2.6 });
        if (x0 + lam < Lc) { f.seg([x0, Math.exp(-1)], [x0 + lam, Math.exp(-1)], { c: 'ink', w: 2 }); f.text(x0 + lam / 2, Math.exp(-1), tx`\(\lambda=${fmt(lam, 3)}\ \mathrm{mm}\)`, { small: true, anchor: 'middle', dy: -7, c: 'ink' }); }
        f.handle(x0, 1, { c: 'hl', axis: 'x', bounds: [0, Lc, 0, 1.05], label: T('pipette', 'ピペット'), onDrag: (x) => ctx.set('x0', clamp(Math.round((x / Lc) * 100) / 100, 0, 1)) });
        const g = L.fig(st.g3, { x: [-1, 1.3], y: [-1, 2.2], aspect: 0.56, maxH: 260, xlabel: T(tx`\(\log_{10}\) diameter (µm)`, tx`\(\log_{10}\) 直径（µm）`), ylabel: T(tx`\(\log_{10}\) speed (m/s)`, tx`\(\log_{10}\) 速度（m/s）`) });
        g.line(L.sample(-1, 1.3, 120, (ld) => [ld, Math.log10(vUnmy(10 ** ld))]), { c: 'c1', w: 2.4 });
        g.line(L.sample(-1, 1.3, 120, (ld) => [ld, Math.log10(vMyel(10 ** ld))]), { c: 'c4', w: 2.4 });
        g.vline(Math.log10(v.d), { c: 'hl', w: 1.5, dash: '3 3' });
        g.dot(Math.log10(v.d), Math.log10(vUnmy(v.d)), { c: 'c1', r: 4.5 }); g.dot(Math.log10(v.d), Math.log10(vMyel(v.d)), { c: 'c4', r: 4.5 });
      };
      draw2d();
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('dendrite with soma load and sealed tip', '細胞体の負荷と閉じた先端をもつ樹状突起') }, { c: 'c3', dash: true, label: T(tx`infinite cable \(e^{-|x-x_0|/\lambda}\)`, tx`無限ケーブル \(e^{-|x-x_0|/\lambda}\)`) }, { c: 'c1', label: T(tx`unmyelinated \(v\approx\sqrt d\)`, tx`無髄 \(v\approx\sqrt d\)`) }, { c: 'c4', label: T(tx`myelinated \(v\approx 6d\)`, tx`有髄 \(v\approx 6d\)`) }, { kind: 'dot', c: 'hl', label: T('pipette', 'ピペット') }]);
      ctx.readout([
        { k: T(tx`length constant \(\lambda=\sqrt{R_m d/4R_i}\)`, tx`長さ定数 \(\lambda=\sqrt{R_m d/4R_i}\)`), v: tx`\(${fmt(lam, 3)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T(tx`electrotonic length \(L/\lambda\)`, tx`電気的長さ \(L/\lambda\)`), v: fmt(Lc / lam, 3) },
        { k: T(tx`voltage at the soma \(V(0)/V(x_0)\)`, tx`細胞体での電圧 \(V(0)/V(x_0)\)`), v: fmt(V(0), 3) },
        { k: T(tx`voltage at the tip \(V(L)/V(x_0)\)`, tx`先端での電圧 \(V(L)/V(x_0)\)`), v: fmt(V(Lc), 3) },
        { k: T('speed at this diameter: bare, myelinated', 'この直径での速度：無髄、有髄'), v: tx`\(${fmt(vUnmy(v.d), 3)}\), \(${fmt(vMyel(v.d), 3)}\ \mathrm{m/s}\)` },
      ], Lc / lam < 1 ? T('Electrotonically short: the whole dendrite sits at nearly the same voltage, so a synapse anywhere on it is heard at the soma almost undiminished.', '電気的に短い樹状突起です。全体がほぼ同じ電圧になるので、どこにあるシナプスの入力も細胞体にほとんど弱まらずに届きます。')
        : T('Electrotonically long: inputs far from the soma are attenuated before they reach it, which is one reason neurons place their inputs and active channels where they do.', '電気的に長い樹状突起です。細胞体から遠い入力は届く前に減衰します。ニューロンが入力や能動的なチャネルを特定の場所に置く理由の一つがこれです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.5, maxH: 520, camera: (ctx.host.clientWidth || 900) < 560 ? [1.6, -16, 6.8] : [0.9, -10.8, 4.9], target: [0.05, 0, 0.85], fov: 32,
        label: T('3D pyramidal neuron with a micropipette on its apical dendrite. Drag to rotate; drag the gold pipette holder along the dendrite.', '尖端樹状突起に微小ピペットを当てた 3D の錐体ニューロン。ドラッグで回転、金色のピペットの保持具を樹状突起に沿ってドラッグできます。'),
        init(S) {
          st.flat = false;
          const TH = S.THREE, R = rnd(20261109), MEM = { rough: 0.5, coat: 0.25, sheen: 0.4, sheenColour: '#ffd9cf' };
          const membrane = new TH.Color('#c99a8f');
          // soma: a rounded pyramid, drawn out towards the apical dendrite and the axon hillock
          S.surface((th, ph) => {
            const d = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], ax = d[0];
            const r = 0.5 * (1 + 0.42 * Math.max(0, ax) ** 3 + 0.18 * Math.max(0, -ax) ** 4 - 0.12 * d[2] * d[2] + 0.03 * Math.sin(5 * ph) * Math.sin(th));
            return [SOMA[0] + r * d[0] * 1.08, SOMA[1] + r * d[1], SOMA[2] + r * d[2] * 0.86];
          }, { u: [0, Math.PI], v: [0, 2 * Math.PI], nu: 48, nv: 72, c: membrane, ...MEM });
          // the nucleus seen through a glassy window would be too much; a soft sheen is enough. Basal dendrites:
          const branch = (p0, dir, len, r0, depth) => {
            const bend = [R() - 0.5, R() - 0.5, (R() - 0.5) * 0.6].map((q) => q * len * 0.5);
            const p1 = [0, 1, 2].map((c) => p0[c] + dir[c] * len);
            const path = (u) => [0, 1, 2].map((c) => p0[c] + dir[c] * len * u + bend[c] * Math.sin(Math.PI * u));
            const r1 = r0 * 0.62;
            S.sweep(path, (u) => S.ring(r0 + (r1 - r0) * u, 12), { n: 18, c: membrane, ...MEM, caps: depth === 0 });
            if (depth > 0) for (const s of [-1, 1]) {
              const a = (0.45 + 0.3 * R()) * s, c = Math.cos(a), sn = Math.sin(a);
              const nd = [dir[0] * c - dir[1] * sn, dir[0] * sn + dir[1] * c, dir[2] + (R() - 0.5) * 0.5], nn = Math.hypot(...nd);
              branch(p1, nd.map((q) => q / nn), len * (0.62 + 0.2 * R()), r1, depth - 1);
            }
          };
          for (let k = 0; k < 5; k++) {
            const a = Math.PI * (0.45 + 1.1 * (k / 4)) + (R() - 0.5) * 0.3, dz = -0.18 - 0.22 * R(), dir = [Math.cos(a), Math.sin(a), dz], n = Math.hypot(...dir);
            const d = dir.map((q) => q / n), p0 = [SOMA[0] + 0.4 * d[0], SOMA[1] + 0.4 * d[1], SOMA[2] + 0.36 * d[2]];
            branch(p0, d, 1.0 + 0.4 * R(), 0.075, 2);
          }
          // oblique branches off the apical trunk (passive look, membrane coloured)
          for (const [u, side] of [[0.22, 1], [0.38, -1], [0.55, 1], [0.7, -1]]) {
            const p = apical(u), dir = [0.55, side * 0.75, 0.35], n = Math.hypot(...dir);
            branch(p, dir.map((q) => q / n), 0.9, 0.05, 1);
          }
          // the apical dendrite, painted by voltage, and its spines
          st.ap = S.sweep(apical, (u) => S.ring(apicalR(u, v.d), 20), { n: 140, colour: () => membrane, ...MEM, caps: true });
          const sp = [];
          for (let i = 0; i < 190; i++) { const u = 0.07 + 0.92 * R(), ang = R() * 2 * Math.PI; sp.push({ u, ang, len: 0.05 + 0.03 * R(), r: 0.022 + 0.014 * R() }); }
          st.spineDef = sp;
          st.spines = S.points(sp.map(() => [0, 0, 0]), { colours: sp.map(() => membrane), r: 0.03, max: sp.length, rough: 0.45, coat: 0.3 });
          st.necks = S.lines([], { c: '#b98b80', opacity: 0.9, w: 1.4 });
          // axon: hillock, initial segment, myelinated internodes and nodes of Ranvier
          const axPath = (u) => [-0.42 - 5.2 * u, -0.12 * u, SOMA[2] - 0.15 - 0.55 * u + 0.08 * Math.sin(3 * u)];
          S.sweep(axPath, (u) => S.ring(u < 0.06 ? 0.16 - (0.16 - 0.035) * (u / 0.06) : 0.035, 14), { n: 160, c: '#b88a80', ...MEM, caps: true });
          const MY = new TH.Color('#f1ead9');
          for (let k = 0; k < 5; k++) {
            const a = 0.12 + k * 0.175, b = a + 0.155;
            S.sweep((t) => axPath(a + (b - a) * t), (t) => S.ring(0.035 + 0.085 * Math.pow(Math.max(0, 1 - Math.pow(2 * t - 1, 8)), 0.5), 22), { n: 40, c: MY, rough: 0.22, coat: 0.85, sheen: 0.3, caps: true });
          }
          // the micropipette: a pulled glass capillary with a chlorided silver wire, in a metal holder
          st.glass = S.sweep((t) => [0, 0, t], (t) => S.ring(0.012 + 0.15 * Math.min(1, Math.pow(t / 1.9, 1.6)), 28), { n: 60, c: '#dfe9ef', glass: true, thickness: 0.02, ior: 1.47, rough: 0.05 });
          st.wire = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.012, c: '#c3c7cc', metal: 0.95, rough: 0.22 });
          st.holder = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.9, 40).rotateX(Math.PI / 2), S.mat('#3c4147', { metal: 0.85, rough: 0.3, coat: 0.6 })); S.add(st.holder);
          st.tipGlow = S.sphere([0, 0, 0], 0.035, { c: 'hl', glow: 0.9 });
          st.hdl = S.handle([0, 0, 0], { c: 'hl', r: 0.12, facing: true, label: T('pipette holder', 'ピペットの保持具'), onDrag: (q) => { const fr = clamp(Math.round(((q.x - AX0) / AXL) * 100) / 100, 0, 1); st.ctx.set('x0', fr); return null; } });
          const L3 = (s2, p, o2) => S.label(s2, p, { small: true, ...o2 });
          L3(T('soma', '細胞体'), [SOMA[0] - 0.1, SOMA[1], SOMA[2] + 0.78], { align: 'middle' });
          L3(T('apical dendrite with spines', 'スパイン付きの尖端樹状突起'), [AX0 + AXL * 0.45, 0, SOMA[2] - 0.45], { align: 'middle' });
          L3(T('basal dendrites', '基底樹状突起'), [-0.2, 0, -0.35], { align: 'middle' });
          L3(T('myelin', '髄鞘'), [axPath(0.37)[0], axPath(0.37)[1] - 0.25, axPath(0.37)[2] + 0.32]);
          L3(T('node of Ranvier', 'ランビエ絞輪'), [axPath(0.47)[0], axPath(0.47)[1] - 0.3, axPath(0.47)[2] - 0.35]);
          L3(T('axon', '軸索'), [axPath(0.96)[0], axPath(0.96)[1], axPath(0.96)[2] + 0.3]);
          st.pipLab = L3(T('micropipette', '微小ピペット'), [0, 0, 0]);
        },
        update(S) {
          const TH = S.THREE, lam2 = lambda(v.rm, v.d), Lc2 = v.len, xx0 = v.x0 * Lc2, rh = v.rho, Vf = (u) => cableV(u * Lc2, xx0, Lc2, lam2, rh);
          st.ap.update(apical, (u) => S.ring(apicalR(u, v.d), 20), (u) => vColour(TH, Vf(u)));
          // spines: necks and heads around the trunk, coloured like the trunk beneath them
          const heads = [], cols = [], radii = [], necks = [];
          for (const s of st.spineDef) {
            const p = apical(s.u), q = apical(Math.min(1, s.u + 0.004)), t = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], tn = Math.hypot(...t), T0 = t.map((x) => x / tn);
            let n1 = [-T0[1], T0[0], 0]; const nn = Math.hypot(...n1) || 1; n1 = n1.map((x) => x / nn);
            const n2 = [T0[1] * n1[2] - T0[2] * n1[1], T0[2] * n1[0] - T0[0] * n1[2], T0[0] * n1[1] - T0[1] * n1[0]];
            const dir = [0, 1, 2].map((c) => Math.cos(s.ang) * n1[c] + Math.sin(s.ang) * n2[c]), r = apicalR(s.u, v.d);
            const base = [0, 1, 2].map((c) => p[c] + dir[c] * r * 0.92), head = [0, 1, 2].map((c) => p[c] + dir[c] * (r + s.len));
            heads.push(head); radii.push(s.r); cols.push(vColour(TH, Vf(s.u))); necks.push([base, head]);
          }
          st.spines.update(heads, cols, radii); st.necks.update(necks);
          // pipette: approaches from the front and above, its tip touching the dendrite's surface
          const u0 = v.x0, p = apical(u0), r0 = apicalR(u0, v.d), ax = [-0.32, -0.5, 0.8], an = Math.hypot(...ax), A = ax.map((x) => x / an);
          const tip = [0, 1, 2].map((c) => p[c] + A[c] * r0 * 1.02), at = (t) => [0, 1, 2].map((c) => tip[c] + A[c] * t);
          st.glass.update((t) => at(t * 2.4), (t) => S.ring(0.012 + 0.15 * Math.min(1, Math.pow((t * 2.4) / 1.9, 1.6)), 28));
          st.wire.update([at(0.7), at(2.9)]);
          const hp = at(2.75); st.holder.position.set(hp[0], hp[1], hp[2]); st.holder.quaternion.setFromUnitVectors(new TH.Vector3(0, 0, 1), new TH.Vector3(...A));
          st.tipGlow.at(tip); st.hdl.at(at(3.3)); st.pipLab.set(at(1.6).map((q, c) => q + [0.45, 0, 0][c]));
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [0, Lc], y: [-1, 1], aspect: 0.25, maxH: 200, axes: false, grid: false });
          f.raster((x, y) => (Math.abs(y) < 0.35 ? V(x) : 0), { cmap: 'warm', res: 4 });
          f.text(0, 0.6, T('soma', '細胞体'), { small: true, anchor: 'start' }); f.text(Lc, 0.6, T('sealed tip', '閉じた先端'), { small: true, anchor: 'end' });
          f.handle(x0, 0.7, { c: 'hl', axis: 'x', bounds: [0, Lc, -1, 1], label: T('pipette', 'ピペット'), onDrag: (x) => ctx.set('x0', clamp(Math.round((x / Lc) * 100) / 100, 0, 1)) });
        },
      });
    },
  };
})();
