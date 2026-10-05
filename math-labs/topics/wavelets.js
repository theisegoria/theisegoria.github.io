'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (R) => { let u = 0, v = 0; while (u === 0) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ---------- model (pure, checked by checks/wavelets.cjs) ---------- */
  // in-place radix-2 FFT; inverse includes the 1/N
  function fft(re, im, inverse = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inverse ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  // Morlet: psi0(eta) = pi^(-1/4) e^{i w0 eta} e^{-eta^2/2}; analytic Fourier transform pi^(-1/4) e^{-(w - w0)^2/2} for w > 0
  const morletHat = (w, w0) => (w > 0 ? Math.pow(Math.PI, -0.25) * Math.exp(-0.5 * (w - w0) * (w - w0)) : 0);
  // Fourier period of the Morlet at scale s (Torrence and Compo): lambda = 4 pi s / (w0 + sqrt(2 + w0^2))
  const fourierFactor = (w0) => (4 * Math.PI) / (w0 + Math.sqrt(2 + w0 * w0));
  const scaleForFreq = (f, w0) => 1 / (f * fourierFactor(w0));
  // Time-frequency transform of x (sampled at dt) on rows of frequency freqs[]. mode 0: Morlet CWT (scale from frequency);
  // mode 1: short-time Fourier with a fixed Gaussian window sigma = sRef. Returns { re, im } arrays per row.
  function tfTransform(x, dt, freqs, w0, mode = 0, sRef = 0) {
    const n = x.length, Xr = Float64Array.from(x), Xi = new Float64Array(n); fft(Xr, Xi);
    const omega = (k) => (2 * Math.PI * (k <= n / 2 ? k : k - n)) / (n * dt);
    return freqs.map((f) => {
      const s = mode === 0 ? scaleForFreq(f, w0) : sRef, wc = mode === 0 ? w0 / s : 2 * Math.PI * f;
      const norm = Math.sqrt((2 * Math.PI * s) / dt), re = new Float64Array(n), im = new Float64Array(n);
      for (let k = 0; k < n; k++) { const w = omega(k), g = w > 0 ? norm * Math.pow(Math.PI, -0.25) * Math.exp(-0.5 * (s * w - s * wc) ** 2) : 0; re[k] = Xr[k] * g; im[k] = Xi[k] * g; }
      fft(re, im, true); return { re, im, s };
    });
  }
  // the plain Morlet CWT at an explicit list of scales (for checks)
  function cwtScales(x, dt, scales, w0) { return tfTransform(x, dt, scales.map((s) => 1 / (s * fourierFactor(w0))), w0, 0); }
  // Heisenberg box of a Gaussian atom with envelope e^{-t^2/2s^2}: sigma_t = s/sqrt2, sigma_omega = 1/(sqrt2 s)
  const heisenberg = (s) => ({ st: s / Math.SQRT2, sw: 1 / (Math.SQRT2 * s) });

  // orthonormal filters: Haar and Daubechies-4 (two vanishing moments)
  const S3 = Math.sqrt(3);
  const FILTERS = [[Math.SQRT1_2, Math.SQRT1_2], [(1 + S3) / (4 * Math.SQRT2), (3 + S3) / (4 * Math.SQRT2), (3 - S3) / (4 * Math.SQRT2), (1 - S3) / (4 * Math.SQRT2)]];
  const highpass = (h) => h.map((_, n) => (n % 2 ? -1 : 1) * h[h.length - 1 - n]);
  // one periodic analysis step: x (length n) -> a, d (length n/2)
  function dwtStep(x, h) { const n = x.length, g = highpass(h), a = new Float64Array(n / 2), d = new Float64Array(n / 2); for (let k = 0; k < n / 2; k++) { let sa = 0, sd = 0; for (let m = 0; m < h.length; m++) { const v = x[(2 * k + m) % n]; sa += h[m] * v; sd += g[m] * v; } a[k] = sa; d[k] = sd; } return { a, d }; }
  function idwtStep(a, d, h) { const n = 2 * a.length, g = highpass(h), x = new Float64Array(n); for (let k = 0; k < a.length; k++) for (let m = 0; m < h.length; m++) x[(2 * k + m) % n] += h[m] * a[k] + g[m] * d[k]; return x; }
  // full decomposition to `coarse` scaling coefficients: { a, d: [level 0 (coarsest), ..., finest] }
  function dwt(x, h, coarse = 1) { let a = Float64Array.from(x); const ds = []; while (a.length > coarse) { const r = dwtStep(a, h); ds.unshift(r.d); a = r.a; } return { a, d: ds }; }
  function idwt(c, h) { let a = c.a; for (const d of c.d) a = idwtStep(a, d, h); return a; }
  // projection onto V_j: keep the scaling coefficients and the detail levels 0..j-1 (2^j coefficients in all when coarse = 1)
  function project(c, h, j) { return idwt({ a: c.a, d: c.d.map((d, l) => (l < j ? d : new Float64Array(d.length))) }, h); }
  const flatten = (c) => [...c.a, ...c.d.flatMap((d) => [...d])];
  function unflatten(v, like) { let i = 0; const a = Float64Array.from(v.slice(0, like.a.length)); i = like.a.length; const d = like.d.map((dd) => { const out = Float64Array.from(v.slice(i, i + dd.length)); i += dd.length; return out; }); return { a, d }; }
  const L0 = { seq: (n, f) => Array.from({ length: n }, (_, i) => f(i)) };
  const hard = (v, lam) => (Math.abs(v) > lam ? v : 0);
  const soft = (v, lam) => Math.sign(v) * Math.max(0, Math.abs(v) - lam);
  const universalLambda = (sigma, n) => sigma * Math.sqrt(2 * Math.log(n));
  // keep the K largest-magnitude orthonormal Fourier coefficients of x, return the real reconstruction
  function fourierKeep(x, K) {
    const n = x.length, re = Float64Array.from(x), im = new Float64Array(n); fft(re, im);
    const idx = L0.seq(n, (i) => i).sort((p, q) => Math.hypot(re[q], im[q]) - Math.hypot(re[p], im[p]));
    const keep = new Uint8Array(n); for (let i = 0; i < Math.min(K, n); i++) keep[idx[i]] = 1;
    for (let k = 0; k < n; k++) if (!keep[k]) { re[k] = 0; im[k] = 0; }
    fft(re, im, true); return re;
  }
    const rms = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s / a.length); };
  const energy = (v) => { let s = 0; for (const x of v) s += x * x; return s; };
  const standardise = (v) => { const m = v.reduce((p, q) => p + q, 0) / v.length, sd = Math.sqrt(v.reduce((p, q) => p + (q - m) ** 2, 0) / v.length); return v.map((x) => (x - m) / sd); };

  // test signals on t in [0, 1)
  const BLK_T = [0.1, 0.13, 0.15, 0.23, 0.25, 0.40, 0.44, 0.65, 0.76, 0.78, 0.81], BLK_H = [4, -5, 3, -4, 5, -4.2, 2.1, 4.3, -3.1, 2.1, -4.2];
  const doppler = (t) => Math.sqrt(t * (1 - t)) * Math.sin((2 * Math.PI * 1.05) / (t + 0.05));
  const SIGNALS = {
    chirp: (t) => Math.sin(2 * Math.PI * (4 * t + 60 * t * t)) + 2.2 * Math.exp(-0.5 * ((t - 0.62) / 0.0025) ** 2),
    tones: (t) => (t < 0.45 ? Math.sin(2 * Math.PI * 10 * t) : Math.sin(2 * Math.PI * 48 * t)) + 0.6 * Math.sin(2 * Math.PI * 110 * t) * Math.exp(-0.5 * ((t - 0.25) / 0.04) ** 2) + 2.2 * Math.exp(-0.5 * ((t - 0.8) / 0.0025) ** 2),
    doppler: (t) => 4 * doppler(t),
    jump: (t) => 0.6 * Math.sin(2 * Math.PI * 1.5 * t) + (t > 0.37 ? 0.9 : 0) + (t > 0.7 ? 2.4 * (t - 0.7) : 0),
    ramp: (t) => 2 * t - 1 + (t > 0.55 ? -1 : 0),
    blocks: (t) => BLK_T.reduce((s, tj, j) => s + (t > tj ? BLK_H[j] : 0), 0),
    heavisine: (t) => 4 * Math.sin(4 * Math.PI * t) - Math.sign(t - 0.3) - Math.sign(0.72 - t),
  };
  const sampleSignal = (name, n) => Float64Array.from({ length: n }, (_, i) => SIGNALS[name](i / n));

  (window.LabModels = window.LabModels || {}).wavelets = { rng, gauss, fft, morletHat, fourierFactor, scaleForFreq, tfTransform, cwtScales, heisenberg, FILTERS, highpass, dwtStep, idwtStep, dwt, idwt, project, flatten, unflatten, hard, soft, universalLambda, fourierKeep, rms, energy, standardise, SIGNALS, sampleSignal };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------- 1. the scalogram ---------- */
  const NC = 512, FMIN = 2, FMAX = 220, ROWS = 96, SIGN1 = ['chirp', 'tones', 'doppler'];
  const LF0 = Math.log2(FMIN), LF1 = Math.log2(FMAX);
  const rowFreqs = L.seq(ROWS, (i) => Math.pow(2, LF0 + ((i + 0.5) / ROWS) * (LF1 - LF0)));
  D['wavelet-transform'] = {
    render(ctx, v) {
      const st = ctx.state, sig = SIGN1[v.sig] || 'chirp', mode = v.mode, w0 = v.w0, col = L.colours();
      const sRef = scaleForFreq(16, w0), key = `${sig}|${mode}|${w0}`;
      if (st.key !== key) {
        const x = sampleSignal(sig, NC), rows = tfTransform(x, 1 / NC, rowFreqs, w0, mode, sRef);
        // power, rectified by scale for the wavelet (Liu et al.), so equal-amplitude tones look equally bright
        const P = rows.map((r) => { const p = new Float64Array(NC); for (let i = 0; i < NC; i++) p[i] = (r.re[i] ** 2 + r.im[i] ** 2) / r.s; return p; });
        let mx = 0; P.forEach((p) => p.forEach((q) => { if (q > mx) mx = q; }));
        Object.assign(st, { key, x, rows, P, mx });
      }
      const { x, rows, P, mx } = st;
      const bt = v.pt, pf = v.pf, lpf = Math.log2(pf);
      const ri = clamp(Math.round(((lpf - LF0) / (LF1 - LF0)) * ROWS - 0.5), 0, ROWS - 1), bi = clamp(Math.round(bt * NC), 0, NC - 1);
      const s = mode === 0 ? scaleForFreq(pf, w0) : sRef, hb = heisenberg(s), sf = hb.sw / (2 * Math.PI);
      const wc = mode === 0 ? w0 / s : 2 * Math.PI * pf;

      L.h('p', 'lab-cap', ctx.host, T(`The signal (${NC} samples on one unit of time) with the ${mode === 0 ? 'wavelet' : 'windowed sinusoid'} at the probe drawn over it: real part and envelope, scaled to fit.`, `信号（1 単位時間に ${NC} 標本）と、プローブ位置の${mode === 0 ? 'ウェーブレット' : '窓付き正弦波'}を重ねています。実部と包絡線を見やすい大きさに拡大しています。`));
      let amp = 0; for (const q of x) amp = Math.max(amp, Math.abs(q));
      const top = L.fig(ctx.host, { x: [0, 1], y: [-amp * 1.12, amp * 1.12], aspect: 0.26, xlabel: '', ylabel: 'x(t)', maxH: 220 });
      top.line(L.seq(NC, (i) => [i / NC, x[i]]), { c: 'c1', w: 1.3 });
      const env = (t) => Math.exp(-0.5 * ((t - bt) / s) ** 2), atom = (t) => env(t) * Math.cos(wc * (t - bt));
      const lo = Math.max(0, bt - 4.2 * s), hi = Math.min(1, bt + 4.2 * s), sc = amp * 0.92;
      top.line(L.sample(lo, hi, 500, (t) => atom(t) * sc), { c: 'hl', w: 2.2, layer: 'over' });
      top.line(L.sample(lo, hi, 160, (t) => env(t) * sc), { c: 'hl', w: 1, dash: '3 3', layer: 'over', op: 0.8 });
      top.line(L.sample(lo, hi, 160, (t) => -env(t) * sc), { c: 'hl', w: 1, dash: '3 3', layer: 'over', op: 0.8 });

      L.h('p', 'lab-cap', ctx.host, mode === 0
        ? T('The scalogram: |W(s, b)|² / s on a logarithmic frequency axis. Drag the gold probe. Its box is the atom’s spread in time and frequency, one standard deviation each way; outside the pale curves the transform feels the ends of the record.', 'スカログラムです。対数周波数軸の上に |W(s, b)|² / s を示します。金色のプローブをドラッグしてください。枠は原子の時間と周波数の広がりで、各方向に標準偏差一つ分です。淡い曲線の外側では変換が記録の端の影響を受けます。')
        : T('The short-time Fourier transform with one fixed Gaussian window, matched to the wavelet at 16 cycles. Every box has the same shape, whatever the frequency.', '固定したガウス窓による短時間フーリエ変換です。窓は 16 サイクルでウェーブレットと一致させてあります。周波数によらず、すべての枠が同じ形です。'));
      const ticksY = [2, 4, 8, 16, 32, 64, 128].map((q) => [Math.log2(q), String(q)]);
      const g = L.fig(ctx.host, { x: [0, 1], y: [LF0, LF1], aspect: 0.5, xlabel: T('time b', '時刻 b'), ylabel: T('cycles per unit', '単位あたりサイクル'), ticksY, maxH: 440 });
      const base = col.plate, c2 = col.c2, hl = col.hl;
      g.raster((tx, ly) => {
        const r = clamp(Math.floor(((ly - LF0) / (LF1 - LF0)) * ROWS), 0, ROWS - 1), i = clamp(Math.floor(tx * NC), 0, NC - 1);
        const q = Math.sqrt(P[r][i] / mx);
        return q < 0.5 ? mixc(base, c2, q * 2) : mixc(c2, hl, (q - 0.5) * 2);
      }, { res: 2 });
      // cone of influence: e-folding time sqrt(2) s from either end of the record (periodic transform)
      if (mode === 0) {
        const coi = (lf) => Math.SQRT2 * scaleForFreq(Math.pow(2, lf), w0);
        const pts = L.sample(LF0, LF1, 120, (lf) => [Math.min(0.5, coi(lf)), lf]);
        g.line(pts, { c: 'ink', w: 1, dash: '4 3', op: 0.55 }); g.line(pts.map(([a, b]) => [1 - a, b]), { c: 'ink', w: 1, dash: '4 3', op: 0.55 });
      }
      if (sig === 'chirp') g.line(L.sample(0.01, 1, 120, (t) => [t, Math.log2(4 + 120 * t)]), { c: 'c4', w: 1.2, dash: '2 4', op: 0.9 });
      if (sig === 'doppler') g.line(L.sample(0.0, 1, 200, (t) => [t, clamp(Math.log2(1.05 / (t + 0.05) ** 2), LF0, LF1)]), { c: 'c4', w: 1.2, dash: '2 4', op: 0.9 });
      // Heisenberg box around the probe
      const flo = Math.max(FMIN, pf - sf), fhi = Math.min(FMAX, pf + sf);
      const bx = [[bt - hb.st, Math.log2(flo)], [bt + hb.st, Math.log2(flo)], [bt + hb.st, Math.log2(fhi)], [bt - hb.st, Math.log2(fhi)]];
      g.poly(bx, { c: 'ink', w: 1.6, fill: 'hl', fo: 0.12, layer: 'over' });
      g.handle(bt, lpf, { c: 'hl', r: 7, label: T('Probe: time and frequency', 'プローブ：時刻と周波数'), bounds: [0, 1, LF0, LF1], onDrag: (tx, ly) => { ctx.set('pt', Math.round(tx * 200) / 200, true); ctx.set('pf', Math.round(Math.pow(2, ly))); } });
      g.hover((tx, ly) => { if (tx < 0 || tx > 1 || ly < LF0 || ly > LF1) return null; const r = clamp(Math.floor(((ly - LF0) / (LF1 - LF0)) * ROWS), 0, ROWS - 1), i = clamp(Math.floor(tx * NC), 0, NC - 1); return { text: `b = ${fmt(tx, 3)}, f = ${fmt(Math.pow(2, ly), 3)}, |W|²/s = ${fmt(P[r][i] / mx, 2)}` }; });
      const leg = [{ c: 'c1', label: T('signal', '信号') }, { c: 'hl', label: T(mode === 0 ? 'wavelet at the probe' : 'window at the probe', mode === 0 ? 'プローブのウェーブレット' : 'プローブの窓') }, { c: 'hl', kind: 'fill', label: T('time and frequency spread (box)', '時間と周波数の広がり（枠）') }];
      if (sig === 'chirp' || sig === 'doppler') leg.push({ c: 'c4', dash: true, label: T('true instantaneous frequency', '真の瞬時周波数') });
      if (mode === 0) leg.push({ c: 'ink', dash: true, label: T('cone of influence', '影響円錐') });
      L.legend(ctx.host, leg);
      const W2 = rows[ri].re[bi] ** 2 + rows[ri].im[bi] ** 2;
      ctx.readout([
        { k: T('probe b, f', 'プローブ b、f'), v: `${fmt(bt, 3)}, ${fmt(pf, 3)}`, tone: 'key' },
        { k: mode === 0 ? T('scale s', 'スケール s') : T('window σ', '窓 σ'), v: fmt(s, 3) },
        { k: 'σₜ', v: fmt(hb.st, 3), tone: 'good' },
        { k: 'σ_f', v: fmt(sf, 3), tone: 'good' },
        { k: 'σₜ σ_ω', v: fmt(hb.st * hb.sw, 3) },
        { k: T('cycles under the envelope (±2σ)', '包絡線の下のサイクル数（±2σ）'), v: fmt((wc * 4 * hb.st) / (2 * Math.PI), 2) },
        { k: '|W|²/s', v: fmt(W2 / rows[ri].s / mx, 3) },
      ], mode === 0
        ? T(`At ${fmt(pf, 3)} cycles the wavelet is ${fmt(hb.st, 3)} wide in time and ${fmt(sf, 3)} cycles wide in frequency. Move the probe up and the box gets thinner and taller with the same area: that is the whole design, short atoms for high frequencies and long ones for low.`, `${fmt(pf, 3)} サイクルでは、ウェーブレットの時間幅は ${fmt(hb.st, 3)}、周波数幅は ${fmt(sf, 3)} サイクルです。プローブを上へ動かすと、枠は面積を保ったまま細く高くなります。高い周波数には短い原子、低い周波数には長い原子を使う、これが設計のすべてです。`)
        : T(`Every atom is ${fmt(hb.st, 3)} wide in time. Low frequencies get fewer than ${fmt((wc * 4 * hb.st) / (2 * Math.PI), 2)} cycles under the window and smear in frequency; high ones get many cycles and smear the click in time.`, `どの原子も時間幅は ${fmt(hb.st, 3)} です。低い周波数では窓の下に ${fmt((wc * 4 * hb.st) / (2 * Math.PI), 2)} サイクルしか入らず周波数方向にぼけ、高い周波数では多くのサイクルが入り、クリックが時間方向にぼけます。`));
    },
  };

  /* ---------- 2. multiresolution ---------- */
  const NM = 256, LEV = 8, SIGN2 = ['jump', 'doppler', 'ramp'];
  D['haar-multiresolution'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, sig = SIGN2[v.sig] || 'jump', b = v.basis, h = FILTERS[b], jSel = v.j;
      const key = `${sig}|${b}`;
      if (st.key !== key) {
        const x = sampleSignal(sig, NM), c = dwt(x, h, 1);
        let mx = 0; c.d.forEach((d, l) => d.forEach((q) => { mx = Math.max(mx, Math.abs(q) * Math.pow(2, l / 2)); }));
        // basis functions by the cascade: a unit coefficient at level 3, position 3
        const lev = b === 0 ? 2 : 3, pos = b === 0 ? 1 : 2;
        const unit = (which) => { const z = dwt(new Float64Array(NM), h, Math.pow(2, lev)); if (which === 'psi') z.d[0][pos] = 1; else z.a[pos] = 1; return idwt(z, h); };
        const both = [0, 1].map((bb) => { const cc = dwt(x, FILTERS[bb], 1); return L.seq(LEV + 1, (j) => rms(x, project(cc, FILTERS[bb], j))); });
        Object.assign(st, { key, x, c, mx, psi: unit('psi'), phi: unit('phi'), both, xe: Math.sqrt(energy(x) / NM) });
      }
      const { x, c, mx, psi, phi, both, xe } = st;
      let amp = 0; for (const q of x) amp = Math.max(amp, Math.abs(q));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The signal (${NM} samples) and its projection onto V_j: the scaling coefficients and the first j detail levels, 2^j coefficients in all.`, `信号（${NM} 標本）と、その V_j への射影です。スケーリング係数と最初の j 段の詳細、合わせて 2^j 個の係数を使います。`));
      const f = L.fig(c1, { x: [0, 1], y: [-amp * 1.15, amp * 1.15], aspect: 0.62, xlabel: 't', ylabel: 'x(t)', maxH: 360 });
      f.line(L.seq(NM, (i) => [(i + 0.5) / NM, x[i]]), { c: 'muted', w: 1.2 });
      const approxG = f.group('main');
      const drawApprox = (j) => {
        while (approxG.firstChild) approxG.removeChild(approxG.firstChild);
        const pj = project(c, h, j), pts = [];
        if (b === 0) for (let i = 0; i < NM; i++) { pts.push([i / NM, pj[i]], [(i + 1) / NM, pj[i]]); }
        else for (let i = 0; i < NM; i++) pts.push([(i + 0.5) / NM, pj[i]]);
        approxG.appendChild(f.line(pts, { c: 'c1', w: 2.2, layer: 'main' }));
        return pj;
      };
      L.h('p', 'lab-cap', c2, T(b === 0 ? 'One Haar scaling function φ and wavelet ψ: a box and a step.' : 'One Daubechies-4 scaling function φ and wavelet ψ, drawn by the cascade: set a single coefficient to 1 and invert.', b === 0 ? 'ハールのスケーリング関数 φ とウェーブレット ψ の一つずつです。箱と段差です。' : 'ドブシー 4 のスケーリング関数 φ とウェーブレット ψ の一つずつです。係数を一つだけ 1 にして逆変換するカスケードで描いています。'));
      let pm = 0; for (let i = 0; i < NM; i++) pm = Math.max(pm, Math.abs(psi[i]), Math.abs(phi[i]));
      const bf = L.fig(c2, { x: [0.2, 0.68], y: [-pm * 1.15, pm * 1.15], aspect: 0.62, xlabel: 't', ylabel: '', maxH: 360 });
      const step = (arr) => { const out = []; for (let i = 0; i < NM; i++) { const t0 = i / NM; if (t0 < 0.19 || t0 > 0.69) continue; if (b === 0) out.push([t0, arr[i]], [t0 + 1 / NM, arr[i]]); else out.push([t0 + 0.5 / NM, arr[i]]); } return out; };
      bf.hline(0, { c: 'muted', w: 1, dash: false, layer: 'under', op: 0.5 });
      bf.line(step(phi), { c: 'c3', w: 2.2 }); bf.line(step(psi), { c: 'c4', w: 2.2 });
      bf.text(0.665, pm * 1.02, b === 0 ? T('Haar: 1 vanishing moment', 'ハール：消失モーメント 1') : T('D4: 2 vanishing moments', 'D4：消失モーメント 2'), { small: true, anchor: 'end', c: 'muted' });

      L.h('p', 'lab-cap', ctx.host, T('The detail coefficients d_{l,k}, one row per level, each cell placed where its wavelet lives. Orange is positive, blue negative, and each level is scaled by 2^{l/2} so that a jump looks equally strong at every level. Rows above the gold handle are discarded; drag it to keep more levels.', '詳細係数 d_{l,k} です。段ごとに一行、各セルはそのウェーブレットが生きる位置に置かれています。橙は正、青は負です。各段は 2^{l/2} 倍してあり、跳びはどの段でも同じ強さに見えます。金色のハンドルより上の行は捨てられます。ドラッグしてより多くの段を残してください。'));
      const ticksY = L.seq(LEV, (l) => [l + 0.5, `${l}`]).concat([[-0.5, 'a']]);
      const pg = L.fig(ctx.host, { x: [0, 1], y: [-1, LEV], aspect: 0.34, xlabel: T('position k / 2^l', '位置 k / 2^l'), ylabel: T('level l', '段 l'), ticksY, maxH: 300, grid: false });
      const amax = Math.max(...c.a.map(Math.abs)) || 1;
      pg.raster((tx, ly) => {
        if (ly < 0) return clamp(c.a[0] / amax, -1, 1) * 0.6;
        const l = clamp(Math.floor(ly), 0, LEV - 1), d = c.d[l], k = clamp(Math.floor(tx * d.length), 0, d.length - 1), q = (d[k] * Math.pow(2, l / 2)) / mx;
        return Math.sign(q) * Math.pow(Math.abs(q), 0.45);
      }, { res: 2 });
      for (let l = 1; l < LEV; l++) pg.hline(l, { c: 'plate', w: 1, dash: false, layer: 'main', op: 0.8 });
      pg.hline(0, { c: 'ink', w: 1.2, dash: false, layer: 'main', op: 0.5 });
      const veil = pg.group('over');
      const drawVeil = (j) => { while (veil.firstChild) veil.removeChild(veil.firstChild); if (j < LEV) veil.appendChild(pg.rect(0, j, 1, LEV - j, { fill: 'plate', fo: 0.78, nostroke: true, layer: 'over' })); };
      pg.handle(1, jSel, { c: 'hl', r: 7, axis: 'y', snap: 1, label: T('Levels kept', '残す段数'), bounds: [1, 1, 0, LEV], onDrag: (_, y) => ctx.set('j', Math.round(y)) });
      L.legend(ctx.host, [{ c: 'muted', label: T('signal', '信号') }, { c: 'c1', label: T('projection onto V_j', 'V_j への射影') }, { c: 'c3', label: 'φ' }, { c: 'c4', label: 'ψ' }, { c: 'pos', kind: 'fill', label: T('d > 0', 'd > 0') }, { c: 'neg', kind: 'fill', label: T('d < 0', 'd < 0') }]);
      const dmx = Math.max(...c.d.flatMap((d) => [...d].map(Math.abs))), sig1 = c.d.map((d) => d.filter((q) => Math.abs(q) > 0.01 * dmx).length), total = sig1.reduce((p, q) => p + q, 0);
      const readout = (j) => ctx.readout([
        { k: T('levels kept j', '残す段数 j'), v: String(j), tone: 'key' },
        { k: T('coefficients', '係数の数'), v: `${Math.pow(2, j)} / ${NM}` },
        { k: T('relative error, this basis', '相対誤差、この基底'), v: fmt(both[b][j] / xe, 3), tone: 'good' },
        { k: T('relative error: Haar, D4', '相対誤差：ハール、D4'), v: `${fmt(both[0][j] / xe, 3)}, ${fmt(both[1][j] / xe, 3)}` },
        { k: T('details above 1% of the largest', '最大値の 1% を超える詳細'), v: `${total} / ${NM - 1}` },
      ], b === 1 && sig === 'ramp'
        ? T('A straight line is invisible to D4: its wavelet has two vanishing moments, so every detail coefficient of a line is zero. What survives is the step and the wrap-around at the ends, where the periodic transform sees a jump.', 'D4 には直線が見えません。ウェーブレットが二つの消失モーメントをもつので、直線の詳細係数はすべて 0 です。残るのは段差と、周期的な変換が跳びを見る両端の折り返しだけです。')
        : T('Each level halves the cell width: a coarse level costs few coefficients and captures the broad shape, fine levels are needed only where the signal changes abruptly, and there the large coefficients line up in a vertical column above the jump.', '段が一つ進むごとにセルの幅は半分になります。粗い段は少ない係数で大まかな形を捉え、細かい段は信号が急に変わるところでだけ必要です。そこでは大きな係数が跳びの真上に縦一列に並びます。'));
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        const j = Math.min(jSel, Math.floor(t / 0.7));
        drawApprox(j); drawVeil(j); readout(j);
        lab.textContent = T(`V_${j}: ${Math.pow(2, j)} coefficients`, `V_${j}：係数 ${Math.pow(2, j)} 個`);
        return t < 0.7 * jSel + 0.3;
      }, { autoplay: false, initialT: 100, once: true, playLabel: T('Play: add levels', '再生：段を加える') });
    },
  };

  /* ---------- 3. thresholding ---------- */
  const NT = 512, KEEP0 = 16, SIGN3 = ['blocks', 'heavisine', 'doppler'];
  D['wavelet-compression'] = {
    render(ctx, v) {
      const st = ctx.state, sig = SIGN3[v.sig] || 'blocks', b = v.basis, h = FILTERS[b], sigma = v.sigma, lam = v.lam, rule = v.rule;
      const key = `${sig}|${b}|${sigma}`;
      if (st.key !== key) {
        const clean = standardise(sampleSignal(sig, NT)), R = rng(11), noisy = clean.map((q) => q + sigma * gauss(R));
        const c = dwt(noisy, h, 1), flat = flatten(c);
        const re = Float64Array.from(noisy), im = new Float64Array(NT); fft(re, im);
        const fmag = L.seq(NT, (k) => Math.hypot(re[k], im[k]) / Math.sqrt(NT)).sort((p, q) => q - p);
        const wmag = flat.map(Math.abs).sort((p, q) => q - p);
        Object.assign(st, { key, clean, noisy, c, flat, fmag, wmag });
      }
      const { clean, noisy, c, flat, fmag, wmag } = st;
      // keep the scaling coefficient always; threshold the details
      const thr = flat.map((q, i) => (i < KEEP0 ? q : rule === 0 ? hard(q, lam) : soft(q, lam)));
      const K = thr.filter((q) => q !== 0).length, wrec = idwt(unflatten(thr, c), h), frec = fourierKeep(noisy, K);
      const ew = rms(wrec, clean), ef = rms(frec, clean), en = rms(noisy, clean), lu = universalLambda(sigma, NT);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The noisy signal (dots), the truth (grey), and two reconstructions from the same ${K} numbers: the largest wavelet coefficients and the largest Fourier coefficients.`, `ノイズ入りの信号（点）、真の信号（灰色）、そして同じ ${K} 個の数からの二つの再構成です。最大のウェーブレット係数と最大のフーリエ係数を使います。`));
      let lo = Infinity, hi = -Infinity; for (const q of noisy) { lo = Math.min(lo, q); hi = Math.max(hi, q); }
      const pad = 0.08 * (hi - lo);
      const f = L.fig(c1, { x: [0, 1], y: [lo - pad, hi + pad], aspect: 0.72, xlabel: 't', ylabel: 'x(t)', maxH: 420 });
      if (sigma > 0) { const gd = f.group('under'); for (let i = 0; i < NT; i += 2) gd.appendChild(f.dot((i + 0.5) / NT, noisy[i], { c: 'c3', r: 1.7, op: 0.55, layer: 'under' })); }
      f.line(L.seq(NT, (i) => [(i + 0.5) / NT, clean[i]]), { c: 'muted', w: 1.4, op: 0.8 });
      f.line(L.seq(NT, (i) => [(i + 0.5) / NT, frec[i]]), { c: 'c2', w: 1.7 });
      f.line(L.seq(NT, (i) => [(i + 0.5) / NT, wrec[i]]), { c: 'c1', w: 2.1 });
      L.h('p', 'lab-cap', c2, T('All coefficients sorted by size, on a log scale. Drag the gold line: everything below it is thrown away. The dashed line is the universal threshold σ√(2 ln N).', 'すべての係数を大きさの順に並べ、対数目盛で示します。金色の線をドラッグしてください。その下はすべて捨てられます。破線は普遍しきい値 σ√(2 ln N) です。'));
      const ymin = -3, ymax = Math.log10(Math.max(wmag[0], fmag[0]) * 1.6);
      const ticksY = [-3, -2, -1, 0, 1].filter((q) => q <= ymax).map((q) => [q, q === 0 ? '1' : `10${q < 0 ? '⁻' : ''}${'⁰¹²³'[Math.abs(q)]}`]);
      const g = L.fig(c2, { x: [0, Math.log10(NT)], y: [ymin, ymax], aspect: 0.72, xlabel: T('rank (log scale)', '順位（対数目盛）'), ylabel: '|c|', ticksX: [[0, '1'], [1, '10'], [2, '100'], [Math.log10(NT), String(NT)]], ticksY, maxH: 420 });
      const lg = (q) => Math.log10(Math.max(q, 1e-3));
      g.line(fmag.map((q, i) => [Math.log10(i + 1), lg(q)]), { c: 'c2', w: 2 });
      g.line(wmag.map((q, i) => [Math.log10(i + 1), lg(q)]), { c: 'c1', w: 2.4 });
      if (sigma > 0) { g.hline(lg(lu), { c: 'c4', w: 1.2, dash: '5 3', layer: 'under' }); g.text(0.05, lg(lu), `σ√(2 ln N) = ${fmt(lu, 3)}`, { small: true, c: 'c4', anchor: 'start', dy: 14 }); }
      g.hline(lg(lam), { c: 'hl', w: 1.6, dash: false, layer: 'over' });
      g.vline(Math.log10(Math.max(1, K)), { c: 'hl', w: 1, dash: '2 3', layer: 'under', op: 0.7 });
      g.handle(Math.log10(NT) * 0.86, lg(lam), { c: 'hl', r: 7, axis: 'y', label: T('Threshold λ', 'しきい値 λ'), bounds: [0, Math.log10(NT), -2, Math.log10(3)], onDrag: (_, y) => ctx.set('lam', Math.round(Math.pow(10, y) * 1000) / 1000) });
      L.legend(ctx.host, [{ c: 'muted', label: T('truth', '真の信号') }, { c: 'c1', label: T(`wavelet (${b === 0 ? 'Haar' : 'D4'}), ${rule === 0 ? 'hard' : 'soft'} threshold`, `ウェーブレット（${b === 0 ? 'ハール' : 'D4'}）、${rule === 0 ? 'ハード' : 'ソフト'}しきい値`) }, { c: 'c2', label: T('Fourier, same number of terms', 'フーリエ、同じ項数') }, { c: 'hl', label: T('threshold λ', 'しきい値 λ') }]);
      ctx.readout([
        { k: 'λ', v: fmt(lam, 3), tone: 'key' },
        { k: T('coefficients kept', '残した係数'), v: `${K} / ${NT} (${fmt((100 * K) / NT, 1)}%)` },
        { k: T('RMS error: wavelet', 'RMS 誤差：ウェーブレット'), v: fmt(ew, 3), tone: 'good' },
        { k: T('RMS error: Fourier', 'RMS 誤差：フーリエ'), v: fmt(ef, 3), tone: ew < ef ? undefined : 'warn' },
        { k: T('RMS error of the raw data', '生データの RMS 誤差'), v: fmt(en, 3) },
        { k: 'σ√(2 ln N)', v: fmt(lu, 3) },
      ], ew < ef
        ? T(`With ${K} terms the wavelet error is ${fmt(ef / Math.max(ew, 1e-9), 2)} times smaller than Fourier's. A jump needs every Fourier frequency at once, so truncation rings across the whole interval; in the wavelet basis it costs a handful of coefficients at each level, all stacked above the jump.`, `${K} 項でウェーブレットの誤差はフーリエの ${fmt(ef / Math.max(ew, 1e-9), 2)} 分の 1 です。跳びはすべてのフーリエ周波数を一度に必要とするので、打ち切ると区間全体に振動が広がります。ウェーブレット基底では、各段で跳びの真上に重なるわずかな係数で済みます。`)
        : T('Here Fourier does as well or better: a signal made of a few smooth oscillations is already sparse in the Fourier basis. Try Blocks, or lower λ to keep fewer terms.', 'ここではフーリエも同等以上です。少数の滑らかな振動からなる信号はフーリエ基底ですでに疎だからです。ブロックを選ぶか、λ を変えて項の数を変えてみてください。'));
    },
  };
})();
