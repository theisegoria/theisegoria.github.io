'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- model (pure, checked by checks/laser-physics.cjs) ---------- */
  // 1. Four-level rate equations in units of the upper-level lifetime tau.
  //    n = N / N_th, p = photon number in units of the saturation value, r = pump / threshold pump, rho = tau / tau_c.
  //    dn/dt = r - n - n p,   dp/dt = rho [ (n - 1) p + beta n ]
  const steadyP = (r, beta) => ((r - 1) + Math.sqrt((r - 1) ** 2 + 4 * beta * r)) / 2;
  const steadyN = (r, beta) => r / (1 + steadyP(r, beta));
  const relaxOmega = (r, rho) => (r > 1 ? Math.sqrt(rho * (r - 1)) : 0); // in 1/tau
  const relaxGamma = (r) => r / 2;
  // RK4 from n = 0, p = beta; returns sampled trace { t, n, p } with `keep` points over [0, tEnd]
  function integrate(r, beta, rho, tEnd, keep = 800) {
    const dt = 0.04 / (rho * Math.max(1, r)), steps = Math.ceil(tEnd / dt), every = Math.max(1, Math.floor(steps / keep));
    const f = (n, p) => [r - n - n * p, rho * ((n - 1) * p + beta * n)];
    let n = 0, p = beta; const T = [0], N = [n], P = [p];
    for (let k = 1; k <= steps; k++) {
      const a = f(n, p), b = f(n + 0.5 * dt * a[0], p + 0.5 * dt * a[1]), c = f(n + 0.5 * dt * b[0], p + 0.5 * dt * b[1]), d = f(n + dt * c[0], p + dt * c[1]);
      n += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); p += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]); if (p < 0) p = 0;
      if (k % every === 0) { T.push(k * dt); N.push(n); P.push(p); }
    }
    return { t: T, n: N, p: P };
  }
  // local maxima of p (spikes) and the mean interval between the later ones
  function spikes(tr) { const out = []; for (let i = 1; i < tr.p.length - 1; i++) if (tr.p[i] > tr.p[i - 1] && tr.p[i] >= tr.p[i + 1] && tr.p[i] > 1e-3) out.push(i); return out; }
  function measuredOmega(tr) { const s = spikes(tr); if (s.length < 3) return null; const ts = s.slice(1).map((i) => tr.t[i]); return (2 * Math.PI * (ts.length - 1)) / (ts[ts.length - 1] - ts[0]); }

  // 2. Fabry-Perot cavity
  const C = 299792458;
  const fsr = (Lm) => C / (2 * Lm); // Hz
  const finesse = (R) => (Math.PI * Math.sqrt(R)) / (1 - R);
  const airy = (dnu, FSR, R) => 1 / (1 + ((4 * R) / (1 - R) ** 2) * Math.sin((Math.PI * dnu) / FSR) ** 2);
  const thresholdGain = (R) => -Math.log(R); // single-pass gain for two mirrors of reflectivity R: R^2 e^{2G} = 1
  const dopplerGain = (nu, G0, fwhm) => G0 * Math.exp((-4 * Math.LN2 * nu * nu) / (fwhm * fwhm));
  // detunings of the cavity modes within +-span of line centre for mirror spacing Lm and wavelength lam
  function modes(Lm, lam, span) { const F = fsr(Lm), x = (2 * Lm) / lam, frac = x - Math.floor(x), out = []; for (let m = Math.ceil(-span / F + frac); m <= Math.floor(span / F + frac); m++) out.push((m - frac) * F); return out; }
  const lasingModes = (Lm, lam, G0, fwhm, R) => modes(Lm, lam, 3 * fwhm).filter((d) => dopplerGain(d, G0, fwhm) > thresholdGain(R));

  // 3. mode locking: N modes, amplitudes a, phases phi; t in units of the round-trip time
  function amplitudes(N, shape) { const m0 = (N - 1) / 2; return L0.seq(N, (k) => (shape === 0 ? 1 : Math.exp(-0.5 * ((k - m0) / Math.max(1, N / 5)) ** 2))); }
  function intensity(a, phi, t) { const N = a.length, m0 = (N - 1) / 2; let re = 0, im = 0; for (let k = 0; k < N; k++) { const ang = 2 * Math.PI * (k - m0) * t + phi[k]; re += a[k] * Math.cos(ang); im += a[k] * Math.sin(ang); } return re * re + im * im; }
  const meanIntensity = (a) => a.reduce((s, q) => s + q * q, 0);
  function phases(N, lock, seed = 7) { const R = rng(seed), out = []; for (let k = 0; k < N; k++) out.push((1 - lock) * (2 * Math.PI * R() - Math.PI)); return out; }
  // full width at half maximum of the brightest pulse in one period, by bisection on a fine grid
  function pulseFWHM(a, phi, n = 4000) { let im = 0, mx = -1; for (let i = 0; i < n; i++) { const v = intensity(a, phi, i / n); if (v > mx) { mx = v; im = i; } } const half = mx / 2, t0 = im / n; const edge = (dir) => { let lo = 0, hi = 0.5; if (intensity(a, phi, t0 + dir * hi) > half) return null; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (intensity(a, phi, t0 + dir * mid) > half) lo = mid; else hi = mid; } return (lo + hi) / 2; }; const l = edge(-1), r = edge(1); return l === null || r === null ? null : l + r; }
  const L0 = { seq: (n, f) => Array.from({ length: n }, (_, i) => f(i)) };

  (window.LabModels = window.LabModels || {})['laser-physics'] = { rng, steadyP, steadyN, relaxOmega, relaxGamma, integrate, spikes, measuredOmega, C, fsr, finesse, airy, thresholdGain, dopplerGain, modes, lasingModes, amplitudes, intensity, meanIntensity, phases, pulseFWHM };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const SUP = { '-': '⁻', '.': '·', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const pow10 = (e) => '10' + String(e).replace('-', '−').split('').map((ch) => (ch === '−' ? '⁻' : SUP[ch] ?? ch)).join('');

  /* ---------- 1. rate equations ---------- */
  D['rate-equations'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, r = v.r, beta = Math.pow(10, v.lb), rho = Math.round(Math.pow(10, v.lrho)), logm = v.scale === 1;
      const tEnd = 6, key = `${r}|${v.lb}|${v.lrho}`;
      if (st.key !== key) { st.tr = integrate(r, beta, rho, tEnd); st.key = key; }
      const tr = st.tr, pss = steadyP(r, beta), nss = steadyN(r, beta), wR = relaxOmega(r, rho), wM = measuredOmega(tr);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Output against pump: the steady state of the rate equations for three values of β, the current one bold. Drag the gold point along the pump axis.', 'ポンプに対する出力です。三つの β の値について速度方程式の定常状態を示し、現在の値を太線にしています。金色の点をポンプ軸に沿ってドラッグしてください。'));
      const xr = logm ? [-1, Math.log10(6)] : [0, 6], yr = logm ? [-7, 1] : [0, 5.2];
      const X = (q) => (logm ? Math.log10(q) : q), Y = (q) => (logm ? Math.log10(Math.max(q, 1e-7)) : q);
      const tk = (a) => a.map((e) => [e, e === 0 ? '1' : `10${e < 0 ? '⁻' : ''}${'⁰¹²³⁴⁵⁶⁷'[Math.abs(e)]}`]);
      const f = L.fig(c1, { x: xr, y: yr, aspect: 0.78, xlabel: T('pump r = R / Rₜₕ', 'ポンプ r = R / Rₜₕ'), ylabel: T('photons p (units of saturation)', '光子数 p（飽和単位）'), maxH: 400, ...(logm ? { ticksX: [[-1, '0.1'], [0, '1'], [Math.log10(6), '6']], ticksY: tk([-6, -4, -2, 0]) } : {}) });
      f.vline(X(1), { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); f.text(X(1), yr[0] + (yr[1] - yr[0]) * 0.55, T('threshold', 'しきい値'), { small: true, c: 'c4', anchor: 'start', dx: 5 });
      const curve = (b) => L.sample(logm ? 0.1 : 0, 6, 400, (q) => [X(q), Y(steadyP(q, b))]);
      [-2, -4, -6].filter((e) => Math.abs(e - v.lb) > 0.01).forEach((e, i) => f.line(curve(Math.pow(10, e)), { c: i ? 'c3' : 'muted', w: 1.2, dash: '4 3' }));
      f.line(curve(beta), { c: 'c1', w: 2.6 });
      if (logm) f.text(X(0.15), Y(steadyP(0.15, beta)), `β = ${pow10(v.lb)}`, { small: true, c: 'c1', dy: -8, anchor: 'start' });
      f.handle(X(Math.max(r, logm ? 0.1 : 0)), Y(pss), { c: 'hl', r: 7, axis: 'x', label: T('Pump', 'ポンプ'), bounds: [xr[0], xr[1], yr[0], yr[1]], onDrag: (x) => ctx.set('r', Math.round((logm ? Math.pow(10, x) : x) * 20) / 20) });

      L.h('p', 'lab-cap', c2, T(`Switching on at t = 0 with ρ = τ/τ꜀ = ${rho}: inversion n (teal) and photons p (blue), with their steady values dashed. Time in units of the upper-level lifetime τ.`, `ρ = τ/τ꜀ = ${rho} で t = 0 に点灯したときの反転分布 n（青緑）と光子数 p（青）です。定常値を破線で示します。時間は上準位の寿命 τ を単位とします。`));
      let pm = 0; for (const q of tr.p) pm = Math.max(pm, q);
      const ymax = Math.max(1.6, nss * 1.15, Math.min(pm, 6 * Math.max(pss, 1)) * 1.08);
      const g = L.fig(c2, { x: [0, tEnd], y: [0, ymax], aspect: 0.78, xlabel: 't / τ', ylabel: 'n, p', maxH: 400 });
      g.hline(nss, { c: 'c3', w: 1, dash: '4 3', layer: 'under' }); g.hline(pss, { c: 'c1', w: 1, dash: '4 3', layer: 'under' });
      const live = g.group('main');
      L.legend(ctx.host, [{ c: 'c1', label: T('photons p', '光子数 p') }, { c: 'c3', label: T('inversion n = N / Nₜₕ', '反転分布 n = N / Nₜₕ') }, { c: 'muted', dash: true, label: 'β = 10⁻² / 10⁻⁴ / 10⁻⁶' }, { c: 'hl', kind: 'dot', label: T('operating point', '動作点') }]);
      const sp = spikes(tr), tth = r > 1 ? -Math.log(1 - 1 / r) : null;
      ctx.readout([
        { k: 'r, β, ρ', v: `${fmt(r, 2)}, ${pow10(v.lb)}, ${rho}`, tone: 'key' },
        { k: T('steady p, n', '定常の p、n'), v: `${fmt(pss, 3)}, ${fmt(nss, 4)}`, tone: 'good' },
        { k: T('relaxation ωτ: predicted, measured', '緩和振動 ωτ：予測、測定'), v: r > 1 ? `${fmt(wR, 3)}, ${wM ? fmt(wM, 3) : '·'}` : '·' },
        { k: T('damping γτ = r/2', '減衰 γτ = r/2'), v: fmt(relaxGamma(r), 3) },
        { k: T('n reaches 1 at t/τ', 'n が 1 に達する t/τ'), v: tth ? fmt(tth, 3) : T('never', '達しない') },
        { k: T('first spike / steady p', '最初のスパイク / 定常の p'), v: sp.length && pss > 1e-3 ? fmt(tr.p[sp[0]] / pss, 2) : '·' },
      ], r < 1
        ? T(`Below threshold: the inversion settles at n = r = ${fmt(r, 2)} and only spontaneous emission feeds the mode, p ≈ βr/(1 − r). Gain never catches up with loss.`, `しきい値より下です。反転分布は n = r = ${fmt(r, 2)} に落ち着き、モードを養うのは自然放出だけで、p ≈ βr/(1 − r) です。利得が損失に追いつくことはありません。`)
        : T(`Above threshold the inversion is clamped at n = 1: every extra pump photon becomes a laser photon, so p = r − 1 = ${fmt(r - 1, 2)}. On the way there the inversion overshoots, the photons arrive in a spike that drains it, and the two ring at ω = √(ρ(r − 1))/τ while decaying at r/2τ.`, `しきい値より上では反転分布は n = 1 に固定されます。余分なポンプ光子はすべてレーザー光子になるので p = r − 1 = ${fmt(r - 1, 2)} です。そこへ至る途中で反転分布は行き過ぎ、光子がスパイクとなって押し寄せて反転分布を消費し、両者は ω = √(ρ(r − 1))/τ で振動しながら r/2τ で減衰します。`));
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        const tt = Math.min(tEnd, t * 1.5), k = tr.t.findIndex((q) => q > tt), m = k < 0 ? tr.t.length : k;
        while (live.firstChild) live.removeChild(live.firstChild);
        const P = [], N = []; for (let i = 0; i < m; i++) { P.push([tr.t[i], Math.min(tr.p[i], ymax * 1.5)]); N.push([tr.t[i], tr.n[i]]); }
        if (m > 1) { live.appendChild(g.line(N, { c: 'c3', w: 2, layer: 'main' })); live.appendChild(g.line(P, { c: 'c1', w: 2.2, layer: 'main' })); live.appendChild(g.dot(P[m - 1][0], P[m - 1][1], { c: 'hl', r: 4, layer: 'main' })); }
        lab.textContent = `t = ${fmt(tt, 2)} τ`;
        return tt < tEnd;
      }, { autoplay: false, initialT: 100, once: true, playLabel: T('Play: switch on', '再生：点灯') });
    },
  };

  /* ---------- 2. cavity modes ---------- */
  const LAM = 632.8e-9, FWHM = 1.5e9, SPAN = 2.4e9;
  D['laser-cavity-modes'] = {
    render(ctx, v) {
      const Lcm = v.L, Lm = Lcm / 100 + v.dz * 1e-9, R = v.R, G0 = v.G / 100, F = fsr(Lm), Fin = finesse(R), Gth = thresholdGain(R);
      const md = modes(Lm, LAM, SPAN), las = md.filter((d) => dopplerGain(d, G0, FWHM) > Gth);
      const excess = las.reduce((s, d) => s + dopplerGain(d, G0, FWHM) - Gth, 0);
      L.h('p', 'lab-cap', ctx.host, T('The cavity: two mirrors, the gain tube between them, and the standing wave of the mode nearest line centre. Drag the right-hand mirror. The wave is drawn with 12 half-wavelengths; a real He–Ne cavity holds about a million.', '共振器です。二枚の鏡、その間の利得管、そして線中心に最も近いモードの定在波を示します。右の鏡をドラッグしてください。波は半波長 12 個で描いています。実際のヘリウムネオン共振器にはおよそ百万個が入ります。'));
      const s = L.fig(ctx.host, { x: [-6, 112], y: [-1.2, 1.2], aspect: ctx.host.clientWidth < 560 ? 0.42 : 0.22, axes: false, grid: false, maxH: 190 });
      const mirror = (x, sgn) => s.line(L.sample(-0.95, 0.95, 40, (y) => [x + sgn * 2.2 * y * y, y]), { c: 'ink', w: 4 });
      mirror(0, -1); mirror(Lcm, 1);
      s.rect(Lcm * 0.18, -0.38, Lcm * 0.64, 0.76, { c: 'c2', fill: 'c2', fo: 0.13, w: 1 });
      s.text(Lcm * 0.5, -0.98, T('gain medium', '利得媒質'), { small: true, c: 'c2' });
      const q = 12, amp = 0.62;
      s.line(L.sample(0, Lcm, 400, (x) => [x, amp * Math.sin((Math.PI * q * x) / Lcm)]), { c: 'c1', w: 1.8 });
      s.line(L.sample(0, Lcm, 400, (x) => [x, -amp * Math.sin((Math.PI * q * x) / Lcm)]), { c: 'c1', w: 1.2, op: 0.45 });
      const pw = clamp(excess / 0.05, 0, 1);
      if (las.length) { s.rect(Lcm + 2.5, -0.06 - 0.16 * pw, 110 - Lcm, 0.12 + 0.32 * pw, { fill: 'hl', fo: 0.3 + 0.5 * pw, nostroke: true }); s.text(Math.min(104, Lcm + 8), 0.42, T('output', '出力'), { small: true, c: 'hl', anchor: 'start' }); }
      s.text(Lcm / 2, 1.05, `L = ${fmt(Lcm, 3)} cm`, { small: true, c: 'muted' });
      s.handle(Lcm, 0, { c: 'hl', r: 8, axis: 'x', snap: 0.5, label: T('Mirror position', '鏡の位置'), bounds: [10, 100, -1, 1], onDrag: (x) => ctx.set('L', Math.round(x * 2) / 2) });

      L.h('p', 'lab-cap', ctx.host, T('The spectrum near 632.8 nm: Doppler-broadened gain per pass (orange), the loss it must beat (dashed), the cavity resonances (blue), and the modes that lase (gold). Frequencies are offsets from line centre.', '632.8 nm 付近のスペクトルです。ドップラー広がりをもつ一往路あたりの利得（橙）、それが上回るべき損失（破線）、共振器の共鳴（青）、そして発振するモード（金）を示します。周波数は線中心からのずれです。'));
      const ymax = Math.max(G0, Gth) * 100 * 1.25;
      const g = L.fig(ctx.host, { x: [-SPAN / 1e9, SPAN / 1e9], y: [0, ymax], aspect: 0.42, xlabel: T('ν − ν₀, GHz', 'ν − ν₀、GHz'), ylabel: T('gain per pass, %', '一往路あたりの利得、%'), maxH: 380 });
      // Airy transmission scaled to the full height: a coarse sweep plus a fine one around each resonance
      const pts = []; const hw = F / Fin; md.forEach((d) => { for (let k = -24; k <= 24; k++) { const x = d + (k / 4) * hw * Math.max(1, Math.abs(k) / 6); pts.push(x); } });
      for (let i = 0; i <= 1600; i++) pts.push(-SPAN + (2 * SPAN * i) / 1600);
      pts.sort((a, b) => a - b);
      g.area(pts.filter((x) => Math.abs(x) <= SPAN).map((x) => [x / 1e9, 0.98 * ymax * airy(x, F, R)]), { c: 'c1', fo: 0.12, base: 0, w: 1.1, layer: 'under' });
      md.forEach((d) => g.seg([d / 1e9, 0], [d / 1e9, 0.98 * ymax], { c: 'c1', w: 1.2, op: 0.5, layer: 'under' }));
      g.area(L.sample(-SPAN, SPAN, 300, (x) => [x / 1e9, 100 * dopplerGain(x, G0, FWHM)]), { c: 'c2', fo: 0.22, base: 0, w: 2.2 });
      g.hline(100 * Gth, { c: 'ink', w: 1.4, dash: '5 4', layer: 'main' }); g.text(-SPAN / 1e9, 100 * Gth, T(`loss: −ln R = ${fmt(100 * Gth, 3)}%`, `損失：−ln R = ${fmt(100 * Gth, 3)}%`), { small: true, anchor: 'start', dx: 6, dy: -6 });
      las.forEach((d) => { const gv = 100 * dopplerGain(d, G0, FWHM); g.seg([d / 1e9, 0], [d / 1e9, gv], { c: 'hl', w: 3, layer: 'over' }); g.dot(d / 1e9, gv, { c: 'hl', r: 5, layer: 'over' }); });
      if (md.length > 1) { const a = md[Math.floor(md.length / 2)] / 1e9, b = a + F / 1e9, yy = ymax * 0.9; g.arrow([a, yy], [b, yy], { c: 'c1', w: 1.2, layer: 'over' }); g.arrow([b, yy], [a, yy], { c: 'c1', w: 1.2, layer: 'over' }); g.text((a + b) / 2, yy, T(`FSR ${fmt(F / 1e6, 3)} MHz`, `FSR ${fmt(F / 1e6, 3)} MHz`), { small: true, c: 'c1', dy: -8 }); }
      L.legend(ctx.host, [{ c: 'c2', kind: 'fill', label: T('gain, Doppler width 1.5 GHz', '利得、ドップラー幅 1.5 GHz') }, { c: 'ink', dash: true, label: T('threshold: loss per pass', 'しきい値：一往路あたりの損失') }, { c: 'c1', kind: 'fill', label: T('cavity transmission (Airy)', '共振器の透過（エアリー）') }, { c: 'hl', label: T('lasing modes', '発振モード') }]);
      const dnu = F / Fin;
      ctx.readout([
        { k: T('free spectral range c/2L', '自由スペクトル領域 c/2L'), v: `${fmt(F / 1e6, 4)} MHz`, tone: 'key' },
        { k: T('finesse', 'フィネス'), v: fmt(Fin, 3) },
        { k: T('mode linewidth', 'モードの線幅'), v: `${fmt(dnu / 1e6, 3)} MHz` },
        { k: T('photon lifetime τ꜀', '光子寿命 τ꜀'), v: `${fmt(1e9 / (2 * Math.PI * dnu), 3)} ns` },
        { k: 'Q', v: fmt(C / LAM / dnu, 2) },
        { k: T('lasing modes', '発振モード'), v: String(las.length), tone: las.length ? 'good' : 'warn' },
      ], !las.length
        ? T(`No mode lases: the peak gain ${fmt(100 * G0, 3)}% per pass is below the mirror loss ${fmt(100 * Gth, 3)}%. Raise the gain or the reflectivity.`, `発振するモードはありません。一往路あたりのピーク利得 ${fmt(100 * G0, 3)}% が鏡の損失 ${fmt(100 * Gth, 3)}% を下回っています。利得か反射率を上げてください。`)
        : las.length === 1
          ? T('A single longitudinal mode: the cavity is short enough that only one resonance fits under the part of the gain curve above threshold. Nudge the mirror by a fraction of a wavelength and the comb slides, and the laser hops to the neighbouring mode.', '単一の縦モードです。共振器が十分短いので、利得曲線のうちしきい値を超える部分には共鳴が一つしか入りません。鏡を波長の何分の一か動かすと櫛が滑り、レーザーは隣のモードへ跳び移ります。')
          : T(`${las.length} modes lase at once. Each sees its own slice of atoms with the right Doppler shift, so in this inhomogeneously broadened gas they do not compete; lengthen the cavity and more resonances fit under the gain.`, `${las.length} 個のモードが同時に発振します。各モードはちょうどよいドップラーずれをもつ原子の一部だけを見るので、この不均一広がりの気体では互いに競合しません。共振器を長くすると、利得の下により多くの共鳴が入ります。`));
    },
  };

  /* ---------- 3. mode locking ---------- */
  D['mode-locking'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const N = v.N, lock = v.lock, shape = v.shape, a = amplitudes(N, shape), phi = phases(N, lock), mean = meanIntensity(a);
      const NS = 900, Is = L.seq(NS + 1, (i) => intensity(a, phi, (2 * i) / NS) / mean);
      let peak = 0; for (const q of Is) peak = Math.max(peak, q);
      const fw = pulseFWHM(a, phi), m0 = (N - 1) / 2;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A ring cavity, with the intracavity intensity painted around it and a small fraction leaking out through the output coupler at the right.', 'リング共振器です。共振器内の強度を周に沿って塗り、右の出力結合鏡からわずかな割合が漏れ出ます。'));
      const ring = L.fig(c1, { x: [-1.35, 2.75], y: [-1.35, 1.35], equal: true, axes: false, grid: false, maxH: 300 });
      ring.circle(0, 0, 1, { c: 'muted', w: 2, op: 0.35 });
      ring.seg([1, -0.22], [1, 0.22], { c: 'ink', w: 4 });
      ring.text(0, 0, T('round trip T', '一周 T'), { small: true, c: 'muted' });
      const dyn = ring.group('over');
      L.h('p', 'lab-cap', c2, T('The comb of modes: amplitude as bar height, phase as the direction of the arrow on top. Drag the gold handle to change how many modes take part.', 'モードの櫛です。振幅を棒の高さで、位相を上の矢印の向きで示します。金色のハンドルをドラッグして、参加するモードの数を変えてください。'));
      const xm = 21.5, sp = L.fig(c2, { x: [-xm, xm], y: [0, 1.55], aspect: 0.72, xlabel: T('mode number q − q₀', 'モード番号 q − q₀'), ylabel: T('amplitude', '振幅'), maxH: 300 });
      for (let k = 0; k < N; k++) { const x = k - m0; sp.seg([x, 0], [x, a[k]], { c: 'c1', w: N > 25 ? 3 : 5, layer: 'main' }); const rr = 0.42, cx = x, cy = a[k] + 0.2, dx = Math.cos(phi[k]) * rr * 0.9, dy = Math.sin(phi[k]) * 0.16; sp.arrow([cx - dx / 2, cy - dy / 2], [cx + dx / 2, cy + dy / 2], { c: lock > 0.98 ? 'hl' : 'c4', w: 1.4, layer: 'over' }); }
      sp.handle(m0 + 0.001, 0.02, { c: 'hl', r: 7, axis: 'x', snap: 0.5, label: T('Number of modes', 'モードの数'), bounds: [0, 20, 0, 1.5], onDrag: (x) => ctx.set('N', Math.round(2 * x) + 1) });

      L.h('p', 'lab-cap', ctx.host, T('Output intensity over two round trips, in units of its mean. With locked phases the modes add in step once per round trip: a pulse N times the mean, about T/N long.', '二周分の出力強度を、その平均を単位として示します。位相がそろうと、モードは一周に一度だけ足並みをそろえて足し合わさり、平均の N 倍で長さ約 T/N のパルスになります。'));
      const yMax = Math.max(3, peak * 1.12);
      const g = L.fig(ctx.host, { x: [0, 2], y: [0, yMax], aspect: 0.3, xlabel: 't / T', ylabel: 'I / ⟨I⟩', maxH: 260 });
      g.area(Is.map((q, i) => [(2 * i) / NS, q]), { c: 'c1', fo: 0.18, base: 0, w: 2 });
      g.hline(1, { c: 'muted', w: 1, dash: '4 3', layer: 'under' }); g.text(0.5, 1, '⟨I⟩', { small: true, c: 'muted', dy: -5 });
      if (lock > 0.98 && shape === 0) { g.hline(N, { c: 'hl', w: 1, dash: '3 3', layer: 'under' }); g.text(0.5, N, `N = ${N}`, { small: true, c: 'hl', dy: -5 }); }
      const cur = g.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T('intensity and mode amplitudes', '強度とモード振幅') }, { c: lock > 0.98 ? 'hl' : 'c4', label: T('mode phases (arrows)', 'モードの位相（矢印）') }, { c: 'hl', kind: 'dot', label: T('now', '現在') }]);
      ctx.readout([
        { k: T('modes N, locking', 'モード数 N、ロック'), v: `${N}, ${fmt(lock, 2)}`, tone: 'key' },
        { k: T('peak / mean', 'ピーク / 平均'), v: fmt(peak, 3), tone: 'good' },
        { k: T('pulse FWHM / T', 'パルスの FWHM / T'), v: fw ? fmt(fw, 3) : '·' },
        { k: '0.886 / N', v: fmt(0.886 / N, 3) },
        { k: T('mean intensity Σ aₙ²', '平均強度 Σ aₙ²'), v: fmt(mean, 3) },
      ], lock > 0.98
        ? T(`Locked: every mode has the same phase, so at t = 0, T, 2T, … all ${N} fields add up to N times the amplitude of one, and the intensity is ${shape === 0 ? 'N² over a mean of N' : 'concentrated'} in one short pulse. Between pulses the modes cancel.`, `ロックしています。すべてのモードの位相が同じなので、t = 0、T、2T、… では ${N} 個の場がすべて一つの振幅の N 倍に足し合わさり、強度は${shape === 0 ? '平均 N に対して N²' : '一つの短いパルスに集中'}となります。パルスの間ではモードは打ち消し合います。`)
        : T('With random phases the same modes, carrying exactly the same mean power, make a noisy intensity that repeats every round trip: a speckle in time. Slide the locking towards 1 and the speckle condenses into a pulse.', '位相がランダムだと、まったく同じ平均パワーをもつ同じモードが、一周ごとに繰り返す雑音のような強度を作ります。時間のスペックルです。ロックを 1 に近づけていくと、スペックルはパルスへと凝縮します。'));
      const draw = (t) => {
        while (dyn.firstChild) dyn.removeChild(dyn.firstChild);
        const S = 160, sc = 1 / Math.max(peak, 1);
        for (let i = 0; i < S; i++) { // position x around the ring sees the field emitted at t - x
          const x = i / S, th0 = 2 * Math.PI * x, th1 = 2 * Math.PI * (x + 1 / S), q = intensity(a, phi, t - x) / mean * sc;
          dyn.appendChild(ring.line([[Math.cos(th0), Math.sin(th0)], [Math.cos(th1), Math.sin(th1)]], { c: 'c1', w: 1 + 11 * q, op: 0.25 + 0.75 * q, layer: 'over' }));
        }
        for (let i = 0; i < 70; i++) { const d = i / 70, q = intensity(a, phi, t - d * 1.25) / mean * sc; dyn.appendChild(ring.seg([1.05 + d * 1.6, 0], [1.05 + (d + 1 / 70) * 1.6, 0], { c: 'hl', w: 0.5 + 6 * q, op: 0.2 + 0.8 * q, layer: 'over' })); }
        while (cur.firstChild) cur.removeChild(cur.firstChild);
        const tm = t % 2; cur.appendChild(g.vline(tm, { c: 'hl', w: 1.2, dash: false, layer: 'over' })); cur.appendChild(g.dot(tm, intensity(a, phi, tm) / mean, { c: 'hl', r: 5, layer: 'over' }));
      };
      st0(ctx).anim = L.animator(ctx.host, (dt, t, lab) => { draw(t * 0.25); lab.textContent = `t = ${fmt((t * 0.25) % 2, 2)} T`; }, { autoplay: true, initialT: 0 });
    },
  };
  const st0 = (ctx) => ctx.state;
})();
