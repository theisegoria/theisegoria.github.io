'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- model (pure, checked by checks/complex-systems.cjs) ---------- */
  // 1. Kuramoto. Natural frequencies: the N quantiles of the Lorentzian of half-width gamma (deterministic, symmetric, median 0).
  const lorentzQuantiles = (N, gamma) => Float64Array.from({ length: N }, (_, k) => gamma * Math.tan(Math.PI * ((k + 0.5) / N - 0.5)));
  function orderParam(th) { let c = 0, s = 0; for (let i = 0; i < th.length; i++) { c += Math.cos(th[i]); s += Math.sin(th[i]); } const N = th.length; return { r: Math.hypot(c, s) / N, psi: Math.atan2(s, c) }; }
  // one Euler step of the mean-field form: theta_i += dt (omega_i + K r sin(psi - theta_i))
  function kuramotoStep(th, om, K, dt) {
    const { r, psi } = orderParam(th);
    for (let i = 0; i < th.length; i++) th[i] = (th[i] + dt * (om[i] + K * r * Math.sin(psi - th[i]))) % TAU;
    return r;
  }
  const kuramotoInit = (N, seed) => { const R = rng(seed); return Float64Array.from({ length: N }, () => R() * TAU); };
  // time average of r over T steps after a burn-in
  function kuramotoRun(N, gamma, K, dt, burn, T, seed = 2) {
    const th = kuramotoInit(N, seed), om = lorentzQuantiles(N, gamma); let acc = 0;
    for (let t = 0; t < burn; t++) kuramotoStep(th, om, K, dt);
    for (let t = 0; t < T; t++) acc += kuramotoStep(th, om, K, dt);
    return { th, om, rMean: acc / T };
  }
  const rTheory = (K, gamma) => (K > 2 * gamma ? Math.sqrt(1 - 2 * gamma / K) : 0);
  const lockedFraction = (K, r, gamma) => (2 / Math.PI) * Math.atan(K * r / gamma);

  // 2. the abelian sandpile on an L x L grid with open boundaries. add() returns the avalanche size (number of topplings).
  function sandpileAdd(z, Ls, i, j) {
    z[i * Ls + j]++;
    if (z[i * Ls + j] < 4) return 0;
    const stack = [i * Ls + j]; let topples = 0;
    while (stack.length) {
      const k = stack.pop(); if (z[k] < 4) continue;
      const n = Math.floor(z[k] / 4); z[k] -= 4 * n; topples += n;
      const a = Math.floor(k / Ls), b = k % Ls;
      if (a > 0) { z[k - Ls] += n; if (z[k - Ls] >= 4) stack.push(k - Ls); }
      if (a < Ls - 1) { z[k + Ls] += n; if (z[k + Ls] >= 4) stack.push(k + Ls); }
      if (b > 0) { z[k - 1] += n; if (z[k - 1] >= 4) stack.push(k - 1); }
      if (b < Ls - 1) { z[k + 1] += n; if (z[k + 1] >= 4) stack.push(k + 1); }
    }
    return topples;
  }
  const grains = (z) => { let s = 0; for (let i = 0; i < z.length; i++) s += z[i]; return s; };
  // drop n grains (mode 0: centre, 1: uniformly random sites); returns the pile and every avalanche size
  function sandpileRun(Ls, n, mode, seed = 7, z = null, sizes = null, R = null) {
    z = z || new Uint8Array(Ls * Ls); sizes = sizes || []; R = R || rng(seed); const c = Ls >> 1;
    for (let g = 0; g < n; g++) { const i = mode === 0 ? c : Math.floor(R() * Ls), j = mode === 0 ? c : Math.floor(R() * Ls); sizes.push(sandpileAdd(z, Ls, i, j)); }
    return { z, sizes, R };
  }
  // log-binned histogram of avalanche sizes s >= 1, and the least-squares slope of log P against log s over bins with enough counts
  function sizeHistogram(sizes, binsPerDecade = 4) {
    const bins = new Map(); let total = 0;
    for (const s of sizes) { if (s < 1) continue; total++; const b = Math.floor(Math.log10(s) * binsPerDecade); bins.set(b, (bins.get(b) || 0) + 1); }
    const rows = [...bins.entries()].sort((a, b) => a[0] - b[0]).map(([b, cnt]) => { const lo = Math.pow(10, b / binsPerDecade), hi = Math.pow(10, (b + 1) / binsPerDecade); const width = Math.max(1, Math.floor(hi) - Math.floor(lo)); return { s: Math.sqrt(lo * hi), p: cnt / (total * width), count: cnt }; });
    const fitRows = rows.filter((r) => r.count >= 8); let slope = null;
    if (fitRows.length >= 3) { const xs = fitRows.map((r) => Math.log10(r.s)), ys = fitRows.map((r) => Math.log10(r.p)); const n = xs.length, sx = xs.reduce((a, b) => a + b), sy = ys.reduce((a, b) => a + b), sxx = xs.reduce((a, x) => a + x * x, 0), sxy = xs.reduce((a, x, i) => a + x * ys[i], 0); slope = (n * sxy - sx * sy) / (n * sxx - sx * sx); }
    return { rows, slope, total };
  }

  // 3. site percolation on an L x L square lattice: sites open where the uniform field u < p; clusters by union-find; spanning = a cluster touching row 0 and row L - 1
  const field = (Ls, seed) => { const R = rng(seed); return Float32Array.from({ length: Ls * Ls }, () => R()); };
  function clusters(u, Ls, p) {
    const n = Ls * Ls, parent = new Int32Array(n), open = new Uint8Array(n);
    for (let k = 0; k < n; k++) { parent[k] = k; open[k] = u[k] < p ? 1 : 0; }
    const find = (k) => { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[b] = a; };
    for (let i = 0; i < Ls; i++) for (let j = 0; j < Ls; j++) { const k = i * Ls + j; if (!open[k]) continue; if (j + 1 < Ls && open[k + 1]) union(k, k + 1); if (i + 1 < Ls && open[k + Ls]) union(k, k + Ls); }
    const label = new Int32Array(n).fill(-1), size = new Map(), top = new Set(), bottom = new Set();
    for (let k = 0; k < n; k++) { if (!open[k]) continue; const r = find(k); label[k] = r; size.set(r, (size.get(r) || 0) + 1); if (k < Ls) top.add(r); if (k >= n - Ls) bottom.add(r); }
    let spanning = null; for (const r of top) if (bottom.has(r)) { spanning = r; break; }
    let largest = null, lsz = 0; for (const [r, s] of size) if (s > lsz) { lsz = s; largest = r; }
    const openCount = open.reduce((a, b) => a + b, 0);
    return { label, size, spanning, largest, largestSize: lsz, count: size.size, openCount };
  }
  const spans = (u, Ls, p) => clusters(u, Ls, p).spanning !== null;
  // spanning probability over `samples` random fields, for each p in ps
  const spanningCurve = (Ls, ps, samples, seed0 = 100) => ps.map((p) => { let c = 0; for (let s = 0; s < samples; s++) if (spans(field(Ls, seed0 + s), Ls, p)) c++; return [p, c / samples]; });
  const PC = 0.592746;

  // 4. Vicsek. Particles in a periodic box of side Lb, speed v0, interaction radius 1, noise eta uniform in [-eta/2, eta/2].
  function vicsekInit(N, Lb, seed) { const R = rng(seed); return { x: Float64Array.from({ length: N }, () => R() * Lb), y: Float64Array.from({ length: N }, () => R() * Lb), th: Float64Array.from({ length: N }, () => R() * TAU), R, Lb, N }; }
  function vicsekStep(s, eta, v0 = 0.05) {
    const { x, y, th, N, Lb, R } = s, cells = Math.max(1, Math.floor(Lb)), cw = Lb / cells, half = Lb / 2;
    const head = new Int32Array(cells * cells).fill(-1), next = new Int32Array(N), cx = new Float64Array(N), cy = new Float64Array(N);
    for (let i = 0; i < N; i++) { const c = Math.floor(x[i] / cw) + cells * Math.floor(y[i] / cw); next[i] = head[c]; head[c] = i; cx[i] = Math.cos(th[i]); cy[i] = Math.sin(th[i]); }
    const nth = new Float64Array(N); let nsum = 0;
    for (let i = 0; i < N; i++) {
      let sc = 0, ss = 0, cnt = 0; const xi = x[i], yi = y[i], ci = Math.floor(xi / cw), cj = Math.floor(yi / cw);
      for (let di = -1; di <= 1; di++) {
        const a = (ci + di + cells) % cells;
        for (let dj = -1; dj <= 1; dj++) {
          const c = a + cells * ((cj + dj + cells) % cells);
          for (let j = head[c]; j >= 0; j = next[j]) {
            let dx = x[j] - xi, dy = y[j] - yi;
            if (dx > half) dx -= Lb; else if (dx < -half) dx += Lb;
            if (dy > half) dy -= Lb; else if (dy < -half) dy += Lb;
            if (dx * dx + dy * dy < 1) { sc += cx[j]; ss += cy[j]; cnt++; }
          }
        }
      }
      nsum += cnt; nth[i] = Math.atan2(ss, sc) + eta * (R() - 0.5);
    }
    for (let i = 0; i < N; i++) { th[i] = nth[i]; let nx = x[i] + v0 * Math.cos(th[i]), ny = y[i] + v0 * Math.sin(th[i]); if (nx < 0) nx += Lb; else if (nx >= Lb) nx -= Lb; if (ny < 0) ny += Lb; else if (ny >= Lb) ny -= Lb; x[i] = nx; y[i] = ny; }
    return nsum / N;
  }
  function polarisation(th) { let c = 0, s = 0; for (let i = 0; i < th.length; i++) { c += Math.cos(th[i]); s += Math.sin(th[i]); } return Math.hypot(c, s) / th.length; }
  function vicsekRun(N, rho, eta, burn, T, seed = 4, v0 = 0.05) {
    const s = vicsekInit(N, Math.sqrt(N / rho), seed); let acc = 0, nb = 0;
    for (let t = 0; t < burn; t++) vicsekStep(s, eta, v0);
    for (let t = 0; t < T; t++) { nb += vicsekStep(s, eta, v0); acc += polarisation(s.th); }
    return { state: s, phiMean: acc / T, neighbours: nb / T };
  }

  (window.LabModels = window.LabModels || {})['complex-systems'] = { rng, lorentzQuantiles, orderParam, kuramotoStep, kuramotoInit, kuramotoRun, rTheory, lockedFraction, sandpileAdd, grains, sandpileRun, sizeHistogram, field, clusters, spans, spanningCurve, PC, vicsekInit, vicsekStep, polarisation, vicsekRun };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------- 1. Kuramoto ---------- */
  const KN = 120, KDT = 0.02;
  D['kuramoto'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, K = v.K, gamma = v.gamma, col = L.colours();
      if (st.gamma !== gamma) { st.om = lorentzQuantiles(KN, gamma); st.gamma = gamma; st.cv = null; }
      if (!st.th) st.th = kuramotoInit(KN, 2);
      // measured r(K) for this gamma, once
      // measured r(K) for this gamma, one K at a time: 400 steps of burn-in and 400 of averaging each, spread across animation frames
      if (!st.cv) st.cv = { pts: [], i: 0, th: null, t: 0, acc: 0 };
      const advanceCurve = (budget) => { const cv = st.cv; let added = false; while (budget > 0 && cv.i < 25) { if (!cv.th) { cv.th = kuramotoInit(KN, 2); cv.t = 0; cv.acc = 0; } const Kc = cv.i * 0.25, k = Math.min(budget, 800 - cv.t); for (let q = 0; q < k; q++) { const r = kuramotoStep(cv.th, st.om, Kc, KDT); if (cv.t >= 400) cv.acc += r; cv.t++; } budget -= k; if (cv.t >= 800) { cv.pts.push([Kc, cv.acc / 400]); cv.i++; cv.th = null; added = true; } } return added; };
      if (L.reduced()) advanceCurve(Infinity);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The oscillators on the unit circle, coloured by natural frequency (cool slow, warm fast), and the mean field r e^{iψ}.', '単位円上の振動子です。色は自然振動数（寒色が遅く、暖色が速い）を表し、矢印は平均場 r e^{iψ} です。'));
      const f = L.fig(c1, { x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, maxH: 400 });
      f.circle(0, 0, 1, { c: 'muted', w: 1, op: 0.6, layer: 'under' });
      const tone = (i) => { const u = (i + 0.5) / KN; return u < 0.5 ? mixc(col.c1, col.c3, u * 2) : mixc(col.c3, col.c2, (u - 0.5) * 2); };
      const dots = L.seq(KN, (i) => L.el('circle', { r: 4.2, style: `fill:rgb(${tone(i).map(Math.round).join(',')})` }, f.layers.main));
      let sumR = 0, cnt = 0;
      const draw = () => {
        const th = st.th, { r, psi } = orderParam(th);
        for (let i = 0; i < KN; i++) { dots[i].setAttribute('cx', f.X(Math.cos(th[i]))); dots[i].setAttribute('cy', f.Y(Math.sin(th[i]))); }
        f.clear('over');
        f.arrow([0, 0], [r * Math.cos(psi), r * Math.sin(psi)], { c: 'hl', w: 3, layer: 'over' });
        f.dot(0, 0, { c: 'muted', r: 2.5, layer: 'over' });
        f.text(0, -1.17, `r = ${fmt(r, 3)}`, { c: 'hl', layer: 'over' });
        return r;
      };
      // right: r against K, theory and measurement
      L.h('p', 'lab-cap', c2, T('The order parameter r against K: the exact curve √(1 − 2γ/K) for N → ∞, and the time average measured with N = 120.', 'K に対する秩序変数 r です。N → ∞ での厳密な曲線 √(1 − 2γ/K) と、N = 120 で測った時間平均を示します。'));
      const g = L.fig(c2, { x: [0, 6], y: [0, 1.05], aspect: 0.72, xlabel: 'K', ylabel: 'r', maxH: 400 });
      g.vline(2 * gamma, { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' });
      g.text(2 * gamma, 1.0, `K꜀ = 2γ = ${fmt(2 * gamma, 2)}`, { small: true, c: 'c4', anchor: 2 * gamma > 4 ? 'end' : 'start', dx: 2 * gamma > 4 ? -5 : 5 });
      g.line(L.sample(0, 6, 240, (k) => rTheory(k, gamma)), { c: 'c4', w: 2, layer: 'main' });
      const curveG = g.group('main');
      const drawCurve = () => { while (curveG.firstChild) curveG.removeChild(curveG.firstChild); const pts = st.cv.pts; if (pts.length > 1) curveG.appendChild(g.line(pts, { c: 'c1', w: 1.8, layer: 'main' })); pts.forEach(([k, r]) => curveG.appendChild(g.dot(k, r, { c: 'c1', r: 2.6, layer: 'main' }))); };
      drawCurve();
      g.handle(K, rTheory(K, gamma), { c: 'hl', r: 7, axis: 'x', snap: 0.1, label: T('Coupling K', '結合 K'), bounds: [0, 6, 0, 1.05], onDrag: (x) => ctx.set('K', Math.round(x * 10) / 10) });
      const live = L.el('circle', { r: 5, style: `fill:var(--lab-hl);opacity:0.55` }, g.layers.over);
      const rTh = rTheory(K, gamma);
      const readout = (r, rAvg) => ctx.readout([
        { k: 'K, γ', v: `${fmt(K, 1)}, ${fmt(gamma, 2)}` },
        { k: T('r now', '現在の r'), v: fmt(r, 3), tone: 'key' },
        { k: T('r, time average', 'r の時間平均'), v: rAvg === null ? '…' : fmt(rAvg, 3), tone: 'good' },
        { k: 'K꜀ = 2γ', v: fmt(2 * gamma, 2), tone: K > 2 * gamma ? 'good' : 'warn' },
        { k: '√(1 − K꜀/K)', v: K > 2 * gamma ? fmt(rTh, 3) : '0' },
        { k: T('locked, |ωᵢ| ≤ K r', 'ロック、|ωᵢ| ≤ K r'), v: `${st.om.filter((w) => Math.abs(w) <= K * r).length} / ${KN} (${T('theory', '理論')} ${fmt(100 * lockedFraction(K, rTh, gamma), 0)}%)` },
      ], K <= 2 * gamma
        ? T(`K = ${fmt(K, 1)} is at or below K꜀ = ${fmt(2 * gamma, 2)}: the pulls cancel, no oscillator locks for good, and r only shows the 1/√N fluctuation of 120 random phases.`, `K = ${fmt(K, 1)} は K꜀ = ${fmt(2 * gamma, 2)} 以下です。引力は打ち消し合い、どの振動子も永続的にはロックせず、r は 120 個のランダムな位相の 1/√N のゆらぎを示すだけです。`)
        : T(`Above K꜀ the mean field feeds itself: locked oscillators make r larger, a larger K r captures more of them, and the balance is r = ${fmt(rTh, 3)}. The fast tail keeps drifting through and rattles r slightly.`, `K꜀ より上では平均場が自分自身を養います。ロックした振動子が r を大きくし、大きくなった K r がさらに多くを捕らえ、そのつり合いが r = ${fmt(rTh, 3)} です。速い裾の振動子は通り抜け続け、r をわずかに揺らします。`));
      // burn in so the static frame is already representative, then animate live
      for (let t = 0; t < 1500; t++) kuramotoStep(st.th, st.om, K, KDT);
      readout(draw(), null);
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        for (let k = 0; k < 4; k++) { const r = kuramotoStep(st.th, st.om, K, KDT); sumR += r; cnt++; }
        const r = draw(); live.setAttribute('cx', g.X(K)); live.setAttribute('cy', g.Y(r));
        if (advanceCurve(100)) drawCurve();
        if (cnt % 40 === 0) readout(r, sumR / cnt);
        lab.textContent = `t = ${fmt(cnt * KDT, 1)}`;
      }, { autoplay: true, initialT: 0 });
      L.legend(ctx.host, [{ c: 'hl', label: T('mean field r e^{iψ}', '平均場 r e^{iψ}') }, { c: 'c4', label: T('exact r(K) for N → ∞', 'N → ∞ での厳密な r(K)') }, { c: 'c1', kind: 'dot', label: T('time-averaged r, N = 120', '時間平均した r、N = 120') }]);
    },
  };

  /* ---------- 2. the sandpile ---------- */
  const SL = 101, SNAP = 1000;
  D['sandpile'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, n = v.n, col = L.colours();
      if (st.mode !== v.mode) { st.mode = v.mode; st.snaps = [{ n: 0, z: new Uint8Array(SL * SL), sizes: [], seed: 7 }]; st.cur = null; }
      // state at grain count m: continue from the latest snapshot at or below m (snapshots every SNAP grains)
      const at = (m) => {
        if (st.cur && st.cur.n === m) return st.cur;
        let base = st.cur && st.cur.n <= m ? st.cur : null;
        for (const s of st.snaps) if (s.n <= m && (!base || s.n > base.n)) base = s;
        let z = Uint8Array.from(base.z), sizes = base.sizes.slice(), R = rng(base.seed), k = base.n;
        // the random stream must be replayed from the snapshot's seed position: store the number of draws instead
        R = rng(7); for (let d = 0; d < 2 * k; d++) R();
        while (k < m) { const step = Math.min(m - k, SNAP - (k % SNAP)); sandpileRun(SL, step, v.mode, 0, z, sizes, R); k += step; if (k % SNAP === 0 && !st.snaps.some((s) => s.n === k)) st.snaps.push({ n: k, z: Uint8Array.from(z), sizes: sizes.slice(), seed: 7 }); }
        st.cur = { n: m, z, sizes }; return st.cur;
      };
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The ${SL} × ${SL} pile: cells shaded by height 0, 1, 2, 3. Grains falling off the edge are lost.`, `${SL} × ${SL} の砂山です。セルは高さ 0、1、2、3 で塗り分けます。端から落ちた砂粒は失われます。`));
      const f = L.fig(c1, { x: [0, SL], y: [0, SL], equal: true, axes: false, maxH: 420 });
      const shade = [col.plate, mixc(col.plate, col.c1, 0.4), mixc(col.plate, col.c1, 0.8), col.ink];
      const paint = (S) => f.raster((x, y) => { const i = clamp(Math.floor(SL - y), 0, SL - 1), j = clamp(Math.floor(x), 0, SL - 1); return shade[Math.min(3, S.z[i * SL + j])]; }, { res: 1, pixel: true });
      L.h('p', 'lab-cap', c2, T('Avalanche sizes: the fraction of avalanches of each size, both axes logarithmic, with the fitted slope.', '雪崩の大きさです。各大きさの雪崩の割合を両対数で示し、フィットした傾きを添えています。'));
      const g = L.fig(c2, { x: [0, 4.2], y: [-6, 0.3], aspect: 0.72, xlabel: 'log₁₀ s', ylabel: 'log₁₀ P(s)', maxH: 420 });
      const drawHist = (S) => {
        g.clear('main'); g.clear('over');
        const H = sizeHistogram(S.sizes);
        H.rows.forEach((r) => g.dot(Math.log10(r.s), Math.log10(r.p), { c: r.count >= 8 ? 'c1' : 'muted', r: 4, layer: 'main' }));
        if (H.slope !== null) { const fitted = H.rows.filter((r) => r.count >= 8), x0 = Math.log10(fitted[0].s), x1 = Math.log10(fitted[fitted.length - 1].s), y0 = Math.log10(fitted[0].p); g.line([[x0, y0], [x1, y0 + H.slope * (x1 - x0)]], { c: 'hl', w: 2, layer: 'main' }); g.text(x1, y0 + H.slope * (x1 - x0), `slope ${fmt(H.slope, 2)}`, { c: 'hl', dx: 8, dy: -8, anchor: 'end', layer: 'over' }); }
        return H;
      };
      const readout = (S, H) => {
        const mean = S.sizes.length ? S.sizes.reduce((a, b) => a + b, 0) / S.sizes.length : 0, big = S.sizes.length ? Math.max(...S.sizes) : 0, kept = grains(S.z);
        ctx.readout([
          { k: T('grains dropped', '落とした砂粒'), v: S.n.toLocaleString(), tone: 'key' },
          { k: T('grains on the pile', '砂山の上の砂粒'), v: kept.toLocaleString() },
          { k: T('lost off the edge', '端から失われた'), v: (S.n - kept).toLocaleString(), tone: S.n - kept ? 'warn' : undefined },
          { k: T('mean height', '平均の高さ'), v: fmt(kept / (SL * SL), 3) },
          { k: T('mean, largest avalanche', '雪崩の平均、最大'), v: `${fmt(mean, 1)}, ${big.toLocaleString()}` },
          { k: T('fitted exponent τ', 'フィットした指数 τ'), v: H.slope === null ? T('too few avalanches', '雪崩が少なすぎます') : fmt(-H.slope, 2), tone: 'good' },
        ], v.mode === 0
          ? T('Grains at the centre only: the pile is a single deterministic object. Its diamond of period-like regions is the same on every run, and the avalanche sizes rise with the pile rather than scattering over a power law.', '砂粒を中央にだけ落とすと、砂山は単一の決定論的な対象です。周期的に見える領域からなるひし形はどの実行でも同じで、雪崩の大きさはべき乗則に散らばるのではなく砂山とともに増えていきます。')
          : T('Random sites: after the pile fills to its stationary mean height of about 2.1, avalanches of every size occur, and the straight line on the log-log plot is the signature of criticality that nobody tuned.', 'ランダムな場所に落とすと、砂山が定常的な平均の高さおよそ 2.1 まで満たされたあと、あらゆる大きさの雪崩が起こります。両対数図の直線が、誰も調整していない臨界性のしるしです。'));
      };
      const S0 = at(n); paint(S0); readout(S0, drawHist(S0));
      const RATE = Math.max(500, n / 15);
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const m = Math.min(n, Math.floor(t * RATE / 250) * 250); const S = at(m); paint(S); readout(S, drawHist(S)); lab.textContent = T(`${m.toLocaleString()} grains`, `${m.toLocaleString()} 粒`); if (m >= n) return false; }, { autoplay: false, once: true, initialT: n / RATE + 1, duration: n / RATE + 1, playLabel: T('Drop the grains from the start', '最初から砂粒を落とす') });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('height 1, 2 (light to dark)', '高さ 1、2（薄い順）') }, { c: 'ink', kind: 'fill', label: T('height 3, one grain from toppling', '高さ 3、あと一粒で崩れる') }, { c: 'hl', label: T('least-squares slope, −τ', '最小二乗の傾き、−τ') }]);
    },
  };

  /* ---------- 3. percolation ---------- */
  const PS = L.seq(21, (i) => i / 20);
  D['percolation'] = {
    render(ctx, v) {
      const st = ctx.state, Ls = v.L === 0 ? 24 : 48, p = v.p, col = L.colours();
      const key = `${Ls}|${v.seed}`;
      if (st.key !== key) { st.u = field(Ls, 40 + v.seed); st.key = key; }
      if (!st.curves) st.curves = { 24: spanningCurve(24, PS, 40), 48: spanningCurve(48, PS, 20) };
      const C = clusters(st.u, Ls, p);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Site percolation on the ${Ls} × ${Ls} lattice at p = ${fmt(p, 2)}. Gold: the spanning cluster; blue: the largest cluster when nothing spans.`, `${Ls} × ${Ls} の格子上の、p = ${fmt(p, 2)} でのサイト・パーコレーションです。金色は張り渡しクラスター、青は何も張り渡さないときの最大クラスターです。`));
      const f = L.fig(c1, { x: [0, Ls], y: [0, Ls], equal: true, axes: false, maxH: 420 });
      const closed = col.plate, other = mixc(col.plate, col.muted, 0.45), big = col.c1, gold = col.hl;
      // stable colour per cluster root so clusters keep their shade as p grows: hash the root's smallest site index
      const shadeOf = (r) => { const t = ((r * 2654435761) >>> 0) / 4294967296; return mixc(other, col.c3, 0.15 + 0.35 * t); };
      f.raster((x, y) => { const i = clamp(Math.floor(Ls - y), 0, Ls - 1), j = clamp(Math.floor(x), 0, Ls - 1), r = C.label[i * Ls + j]; if (r < 0) return closed; if (r === C.spanning) return gold; if (C.spanning === null && r === C.largest) return big; return shadeOf(r); }, { res: 1, pixel: true });
      L.h('p', 'lab-cap', c2, T('Probability that a spanning cluster exists, from 40 and 20 random lattices per p. Drag the gold point to change p.', '張り渡しクラスターが存在する確率です。各 p について 40 個と 20 個のランダムな格子から求めました。金色の点をドラッグして p を変えてください。'));
      const g = L.fig(c2, { x: [0, 1], y: [0, 1.05], aspect: 0.72, xlabel: 'p', ylabel: T('P(spans)', 'P(張り渡す)'), maxH: 420 });
      g.vline(PC, { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); g.text(PC, 1.0, `p꜀ = ${fmt(PC, 4)}`, { small: true, c: 'c4', anchor: 'start', dx: 5 });
      g.line(st.curves[24], { c: 'c3', w: 1.8, layer: 'main' }); g.line(st.curves[48], { c: 'c1', w: 2.2, layer: 'main' });
      const cur = st.curves[Ls], pi = Math.min(19, Math.floor(p * 20)), yk = cur[pi][1] + (cur[pi + 1][1] - cur[pi][1]) * (p * 20 - pi);
      g.handle(p, yk, { c: 'hl', r: 7, axis: 'x', snap: 0.01, label: T('Occupation probability p', '占有確率 p'), bounds: [0, 1, 0, 1.05], onDrag: (x) => ctx.set('p', Math.round(x * 100) / 100) });
      L.legend(ctx.host, [{ c: 'hl', kind: 'fill', label: T('spanning cluster (top to bottom)', '張り渡しクラスター（上から下へ）') }, { c: 'c1', kind: 'fill', label: T('largest cluster; and P(spans) for L = 48', '最大クラスター、および L = 48 の P(張り渡す)') }, { c: 'c3', label: T('P(spans) for L = 24', 'L = 24 の P(張り渡す)') }, { c: 'c4', dash: true, label: 'p꜀ = 0.5927' }]);
      const frac = C.openCount ? C.largestSize / C.openCount : 0;
      ctx.readout([
        { k: 'p', v: fmt(p, 2), tone: 'key' },
        { k: T('open sites', '開いたサイト'), v: `${C.openCount} (${fmt(100 * C.openCount / (Ls * Ls), 1)}%)` },
        { k: T('clusters', 'クラスター数'), v: String(C.count) },
        { k: T('largest cluster', '最大クラスター'), v: `${C.largestSize} = ${fmt(100 * frac, 1)}% ${T('of the open sites', 'の開いたサイト')}` },
        { k: T('spans top to bottom', '上から下へ張り渡す'), v: C.spanning !== null ? T('yes', 'はい') : T('no', 'いいえ'), tone: C.spanning !== null ? 'good' : 'warn' },
        { k: T('P(spans) at this p, L = ', 'この p での P(張り渡す)、L = ') + Ls, v: fmt(yk, 2) },
      ], p < PC - 0.08
        ? T('Well below p꜀: many small clusters, and the largest holds only a few percent of the open sites. Their typical size, the correlation length, grows like (p꜀ − p)^(−4/3) as p rises.', 'p꜀ よりかなり下です。小さなクラスターが多数あり、最大のものも開いたサイトの数パーセントしか含みません。その典型的な大きさである相関長は、p が上がるにつれて (p꜀ − p)^(−4/3) のように増えます。')
        : p > PC + 0.08
          ? T('Well above p꜀: one giant cluster holds most open sites and spans; the rest are small islands trapped in its holes. The giant cluster’s share grows like (p − p꜀)^(5/36) near the threshold.', 'p꜀ よりかなり上です。一つの巨大クラスターがほとんどの開いたサイトを含んで張り渡し、残りはその穴に閉じ込められた小さな島です。巨大クラスターの割合は閾値の近くで (p − p꜀)^(5/36) のように増えます。')
          : T('Near p꜀ the picture is scale-free: clusters of every size, and the largest one is a fractal of dimension 91/48 that may or may not span this particular sample. Try another random sample.', 'p꜀ の近くでは図はスケールをもちません。あらゆる大きさのクラスターがあり、最大のものは次元 91/48 のフラクタルで、この標本を張り渡すかどうかは場合によります。別の乱数の標本を試してください。'));
    },
  };

  /* ---------- 4. Vicsek ---------- */
  const VN = 300, V0 = 0.05;
  D['vicsek'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, eta = v.eta, rho = v.rho, Lb = Math.sqrt(VN / rho), col = L.colours();
      if (!st.s || st.rho !== rho) { st.s = vicsekInit(VN, Lb, 4); st.rho = rho; st.cv = null; }
      // measured phi(eta) at this density, one eta at a time (150 steps of burn-in, 150 averaged), spread across animation frames
      if (!st.cv) st.cv = { pts: [], i: 0, sim: null, t: 0, acc: 0 };
      const advanceCurve = (budget) => { const cv = st.cv; let added = false; while (budget > 0 && cv.i < 17) { if (!cv.sim) { cv.sim = vicsekInit(VN, Lb, 4); cv.t = 0; cv.acc = 0; } const e = cv.i * 0.4, k = Math.min(budget, 300 - cv.t); for (let q = 0; q < k; q++) { vicsekStep(cv.sim, e, V0); if (cv.t >= 150) cv.acc += polarisation(cv.sim.th); cv.t++; } budget -= k; if (cv.t >= 300) { cv.pts.push([e, cv.acc / 150]); cv.i++; cv.sim = null; added = true; } } return added; };
      if (L.reduced()) advanceCurve(Infinity);
      const s = st.s;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${VN} particles in a periodic box of side ${fmt(Lb, 1)} (interaction radius 1). Each arrow is a heading; the gold arrow is the mean velocity.`, `一辺 ${fmt(Lb, 1)} の周期的な箱の中の ${VN} 個の粒子です（相互作用半径 1）。各矢印は向きで、金色の矢印は平均速度です。`));
      const f = L.fig(c1, { x: [0, Lb], y: [0, Lb], equal: true, axes: false, maxH: 420 });
      f.circle(0.9, Lb - 0.9, 1, { c: 'muted', w: 1, dash: '3 3', op: 0.7, layer: 'under' });
      f.text(0.9, Lb - 0.9, 'R = 1', { small: true, c: 'muted', layer: 'under' });
      const g = f.group('main'), arrows = L.seq(VN, () => L.el('path', { style: `stroke:var(--lab-c1);stroke-width:1.5;fill:none;opacity:0.85` }, g));
      const len = 0.28 * Math.max(1, Lb / 12);
      const draw = () => {
        for (let i = 0; i < VN; i++) { const x = s.x[i], y = s.y[i], c = Math.cos(s.th[i]), sn = Math.sin(s.th[i]); arrows[i].setAttribute('d', `M${f.X(x - c * len * 0.5).toFixed(1)} ${f.Y(y - sn * len * 0.5).toFixed(1)}L${f.X(x + c * len * 0.5).toFixed(1)} ${f.Y(y + sn * len * 0.5).toFixed(1)}`); }
        const phi = polarisation(s.th); let cx = 0, cy = 0; for (let i = 0; i < VN; i++) { cx += Math.cos(s.th[i]); cy += Math.sin(s.th[i]); }
        f.clear('over');
        const ang = Math.atan2(cy, cx), cxm = Lb / 2, cym = Lb / 2, R0 = 0.22 * Lb;
        f.arrow([cxm, cym], [cxm + R0 * phi * Math.cos(ang), cym + R0 * phi * Math.sin(ang)], { c: 'hl', w: 3.5, layer: 'over' });
        f.circle(cxm, cym, R0, { c: 'hl', w: 1, dash: '3 3', op: 0.45, layer: 'over' });
        f.text(cxm, cym - R0 - 0.06 * Lb, `φ = ${fmt(phi, 3)}`, { c: 'hl', layer: 'over' });
        return phi;
      };
      L.h('p', 'lab-cap', c2, T('Polarisation φ against noise η at this density, averaged over 150 steps after 150 of burn-in. Drag the gold point to change η.', 'この密度でのノイズ η に対する分極 φ です。150 ステップの助走のあとの 150 ステップで平均しました。金色の点をドラッグして η を変えてください。'));
      const h = L.fig(c2, { x: [0, 6.4], y: [0, 1.05], aspect: 0.72, xlabel: 'η', ylabel: 'φ', maxH: 420, piX: true });
      h.hline(1 / Math.sqrt(VN), { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); h.text(6.3, 1 / Math.sqrt(VN), '1/√N', { small: true, c: 'muted', anchor: 'end', dy: -6 });
      const curveG = h.group('main');
      const drawCurve = () => { while (curveG.firstChild) curveG.removeChild(curveG.firstChild); const pts = st.cv.pts; if (pts.length > 1) curveG.appendChild(h.line(pts, { c: 'c1', w: 2.2, layer: 'main' })); pts.forEach(([e, ph]) => curveG.appendChild(h.dot(e, ph, { c: 'c1', r: 3, layer: 'main' }))); };
      drawCurve();
      const yk = st.cv.pts[Math.round(eta / 0.4)] ? st.cv.pts[Math.round(eta / 0.4)][1] : polarisation(s.th);
      h.handle(eta, yk, { c: 'hl', r: 7, axis: 'x', snap: 0.1, label: T('Noise η', 'ノイズ η'), bounds: [0, 6.3, 0, 1.05], onDrag: (x) => ctx.set('eta', Math.round(x * 10) / 10) });
      const live = L.el('circle', { r: 5, style: 'fill:var(--lab-hl);opacity:0.55' }, h.layers.over);
      let acc = 0, cnt = 0, nb = 0;
      const readout = (phi) => ctx.readout([
        { k: 'η, ρ', v: `${fmt(eta, 1)}, ${fmt(rho, 1)}` },
        { k: T('φ now', '現在の φ'), v: fmt(phi, 3), tone: 'key' },
        { k: T('φ, time average', 'φ の時間平均'), v: cnt ? fmt(acc / cnt, 3) : '…', tone: 'good' },
        { k: T('mean neighbours within R', 'R 内の平均隣人数'), v: cnt ? fmt(nb / cnt, 1) : fmt(Math.PI * rho, 1) },
        { k: T('random crowd, 1/√N', 'ランダムな群衆、1/√N'), v: fmt(1 / Math.sqrt(VN), 3) },
      ], eta < 1.5
        ? T('Low noise: every particle copies its neighbours almost exactly, alignment spreads from patch to patch, and moving carries the agreement across the box. The flock drifts as one body in a direction chosen by nothing but chance.', 'ノイズが小さいと、各粒子は隣人をほぼ正確に真似し、整列は区画から区画へ広がり、移動が合意を箱全体に運びます。群れは偶然だけが選んだ方向へ一つの体として漂います。')
        : eta > 4.5
          ? T('High noise: the random kick each step is larger than the pull of the neighbours, headings decorrelate within a few steps, and φ sits at the 1/√N of independent particles.', 'ノイズが大きいと、各ステップのランダムな蹴りが隣人の引力より大きく、向きの相関は数ステップで消え、φ は独立な粒子の 1/√N にとどまります。')
          : T('Near the transition: dense patches align while sparse regions lose it, so φ swings between order and disorder on a slow timescale. Larger density lowers the noise needed to break the flock apart.', '転移の近くです。密な区画は整列し疎な領域はそれを失うので、φ は遅い時間スケールで秩序と無秩序の間を揺れます。密度が大きいほど、群れを壊すのに必要なノイズは小さくなります。'));
      for (let t = 0; t < 200; t++) vicsekStep(s, eta, V0);
      readout(draw());
      st.anim = L.animator(ctx.host, (dt, t, lab) => { nb += vicsekStep(s, eta, V0); const phi = draw(); acc += phi; cnt++; live.setAttribute('cx', h.X(eta)); live.setAttribute('cy', h.Y(phi)); if (advanceCurve(20)) drawCurve(); if (cnt % 20 === 0) readout(phi); lab.textContent = T(`step ${cnt}`, `${cnt} ステップ`); }, { autoplay: true, initialT: 0 });
      L.legend(ctx.host, [{ c: 'c1', label: T('a particle and its heading', '粒子とその向き') }, { c: 'hl', label: T('mean velocity, length φ', '平均速度、長さ φ') }, { c: 'c1', kind: 'dot', label: T('time-averaged φ(η)', '時間平均した φ(η)') }]);
    },
  };
})();
