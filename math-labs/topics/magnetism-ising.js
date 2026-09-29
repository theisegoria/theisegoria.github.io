'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- model (pure, checked by checks/magnetism-ising.cjs); J = k = 1 ---------- */
  const TC2D = 2 / Math.log(1 + Math.SQRT2), TC_TRI = 4 / Math.log(3);
  // Onsager-Yang spontaneous magnetisation of the square lattice
  const onsagerM = (T) => (T >= TC2D ? 0 : Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8));
  // 2D lattice on a torus. One sweep = L*L single-spin Metropolis attempts at random sites. Returns the acceptance fraction.
  function metropolisSweep(s, Ls, T, h, R) {
    const n = Ls * Ls; let acc = 0;
    const ex = [1, Math.exp(-4 / T), Math.exp(-8 / T)]; // exp(-dE/T) for dE = 4J and 8J, the only positive costs when h = 0
    for (let a = 0; a < n; a++) {
      const k = Math.floor(R() * n), i = Math.floor(k / Ls), j = k % Ls;
      const nb = s[((i - 1 + Ls) % Ls) * Ls + j] + s[((i + 1) % Ls) * Ls + j] + s[i * Ls + (j - 1 + Ls) % Ls] + s[i * Ls + (j + 1) % Ls];
      const dE = 2 * s[k] * (nb + h);
      if (dE <= 0 || R() < (h === 0 ? ex[Math.abs(nb) >> 1] : Math.exp(-dE / T))) { s[k] = -s[k]; acc++; }
    }
    return acc / n;
  }
  const latticeInit = (Ls, ordered = true, seed = 1) => { const s = new Int8Array(Ls * Ls); if (ordered) s.fill(1); else { const R = rng(seed); for (let k = 0; k < s.length; k++) s[k] = R() < 0.5 ? 1 : -1; } return s; };
  const magnetisation = (s) => { let m = 0; for (let k = 0; k < s.length; k++) m += s[k]; return m / s.length; };
  function energyPerSpin(s, Ls, h) { let e = 0; for (let i = 0; i < Ls; i++) for (let j = 0; j < Ls; j++) { const k = i * Ls + j; e -= s[k] * (s[((i + 1) % Ls) * Ls + j] + s[i * Ls + (j + 1) % Ls]) + h * s[k]; } return e / (Ls * Ls); }
  // |m| averaged over `avg` sweeps after `burn` sweeps from an ordered start
  function latticeRun(Ls, T, h, burn, avg, seed = 3) { const s = latticeInit(Ls, true), R = rng(seed); let acc = 0; for (let t = 0; t < burn; t++) metropolisSweep(s, Ls, T, h, R); for (let t = 0; t < avg; t++) { metropolisSweep(s, Ls, T, h, R); acc += Math.abs(magnetisation(s)); } return acc / avg; }
  // 1D ring of N spins
  function chainSweep(s, T, h, R) { const N = s.length; let acc = 0; for (let a = 0; a < N; a++) { const k = Math.floor(R() * N); const dE = 2 * s[k] * (s[(k - 1 + N) % N] + s[(k + 1) % N] + h); if (dE <= 0 || R() < Math.exp(-dE / T)) { s[k] = -s[k]; acc++; } } return acc / N; }
  const chainCorr = (s, rmax) => { const N = s.length, out = new Float64Array(rmax + 1); for (let r = 0; r <= rmax; r++) { let c = 0; for (let k = 0; k < N; k++) c += s[k] * s[(k + r) % N]; out[r] = c / N; } return out; };
  const domainWalls = (s) => { let w = 0; for (let k = 0; k < s.length; k++) if (s[k] !== s[(k + 1) % s.length]) w++; return w; };
  // transfer matrix V = [[e^{(J+h)/T}, e^{-J/T}], [e^{-J/T}, e^{(J-h)/T}]] and its eigenvalues
  function transferEigen(T, h) { const a = Math.exp(1 / T), c = Math.cosh(h / T), sh = Math.sinh(h / T), q = Math.sqrt(sh * sh + Math.exp(-4 / T)); return { plus: a * (c + q), minus: a * (c - q) }; }
  const chainM = (T, h) => Math.sinh(h / T) / Math.sqrt(Math.sinh(h / T) ** 2 + Math.exp(-4 / T));
  const chainXi = (T) => -1 / Math.log(Math.tanh(1 / T));
  // exact <s_0 s_r> on a ring of N spins from the transfer matrix: tr(S V^r S V^{N-r}) / tr(V^N)
  function exactCorrRing(T, h, r, N) {
    const V = [[Math.exp((1 + h) / T), Math.exp(-1 / T)], [Math.exp(-1 / T), Math.exp((1 - h) / T)]], S = [[1, 0], [0, -1]];
    const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
    const pow = (A, n) => { let R = [[1, 0], [0, 1]], B = A; while (n > 0) { if (n & 1) R = mul(R, B); B = mul(B, B); n >>= 1; } return R; };
    // rescale by the largest eigenvalue to avoid overflow
    const lam = transferEigen(T, h).plus, Vs = V.map((row) => row.map((x) => x / lam));
    const num = mul(mul(S, pow(Vs, r)), mul(S, pow(Vs, N - r))), den = pow(Vs, N);
    return (num[0][0] + num[1][1]) / (den[0][0] + den[1][1]);
  }
  // mean field: the self-consistent m = tanh((z m + h) / T), largest solution, and all solutions
  function mfSolve(z, T, h, m0 = 1) { let m = m0; for (let k = 0; k < 400; k++) m = Math.tanh((z * m + h) / T); return m; }
  function mfSolutions(z, T, h) { const g = (m) => Math.tanh((z * m + h) / T) - m, out = []; let prev = g(-1.2); for (let x = -1.2; x < 1.2; x += 0.002) { const cur = g(x + 0.002); if (prev === 0 || prev * cur < 0) { let lo = x, hi = x + 0.002; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid; } out.push((lo + hi) / 2); } prev = cur; } return out; }
  const mfNearTc = (z, T) => (T < z ? Math.sqrt(3 * (1 - T / z)) : 0);

  (window.LabModels = window.LabModels || {})['magnetism-ising'] = { rng, TC2D, TC_TRI, onsagerM, metropolisSweep, latticeInit, magnetisation, energyPerSpin, latticeRun, chainSweep, chainCorr, domainWalls, transferEigen, chainM, chainXi, exactCorrRing, mfSolve, mfSolutions, mfNearTc };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* ---------- 1. the 2D Ising model ---------- */
  const LS = 64, TS = L.seq(22, (i) => 0.8 + i * 0.2);
  D['metropolis'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, Tk = v.T, h = v.h, col = L.colours();
      st.s ||= latticeInit(LS, true); st.R ||= rng(9);
      if (st.lastT !== Tk || st.lastH !== h) { for (let t = 0; t < 80; t++) metropolisSweep(st.s, LS, Tk, h, st.R); st.lastT = Tk; st.lastH = h; }
      if (!st.cv || st.cvh !== h) { st.cv = { pts: [], i: 0, s: null, t: 0, acc: 0 }; st.cvh = h; }
      // measured <|m|>(T): 200 sweeps of burn-in and 200 averaged per T, spread across frames
      const advanceCurve = (budget) => { const cv = st.cv; let added = false; while (budget > 0 && cv.i < TS.length) { if (!cv.s) { cv.s = latticeInit(LS, true); cv.t = 0; cv.acc = 0; cv.R = rng(3); } const Tq = TS[cv.i], k = Math.min(budget, 400 - cv.t); for (let q = 0; q < k; q++) { metropolisSweep(cv.s, LS, Tq, h, cv.R); if (cv.t >= 200) cv.acc += Math.abs(magnetisation(cv.s)); cv.t++; } budget -= k; if (cv.t >= 400) { cv.pts.push([Tq, cv.acc / 200]); cv.i++; cv.s = null; added = true; } } return added; };
      if (L.reduced()) advanceCurve(Infinity);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The ${LS} × ${LS} lattice at kT = ${fmt(Tk, 2)} J, two Metropolis sweeps per frame. Blue spins point up, orange down.`, `kT = ${fmt(Tk, 2)} J での ${LS} × ${LS} 格子です。一フレームにメトロポリスのスイープ二回。青は上向き、橙は下向きのスピンです。`));
      const f = L.fig(c1, { x: [0, LS], y: [0, LS], equal: true, axes: false, maxH: 420 });
      const up = col.c1, down = mixc(col.plate, col.c2, 0.75);
      const paint = () => f.raster((x, y) => (st.s[clamp(Math.floor(LS - y), 0, LS - 1) * LS + clamp(Math.floor(x), 0, LS - 1)] > 0 ? up : down), { res: 1, pixel: true });
      L.h('p', 'lab-cap', c2, T('|m| against T: Onsager’s exact curve, the running measurement (dots, filled in as they finish), and the live value in gold.', 'T に対する |m| です。オンサーガーの厳密な曲線、測定値（点、完了するごとに埋まる）、そして金色の現在値を示します。'));
      const g = L.fig(c2, { x: [0.5, 5.1], y: [0, 1.08], aspect: 0.72, xlabel: 'kT / J', ylabel: '|m|', maxH: 420 });
      g.vline(TC2D, { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); g.text(TC2D, 1.03, `T꜀ = ${fmt(TC2D, 3)}`, { small: true, c: 'c4', anchor: 'start', dx: 5 });
      if (h === 0) g.line(L.sample(0.5, 5.1, 400, (t) => onsagerM(t)), { c: 'c4', w: 2, layer: 'main' });
      const curveG = g.group('main');
      const drawCurve = () => { while (curveG.firstChild) curveG.removeChild(curveG.firstChild); st.cv.pts.forEach(([t, m]) => curveG.appendChild(g.dot(t, m, { c: 'c1', r: 3.2, layer: 'main' }))); };
      drawCurve();
      g.handle(Tk, h === 0 ? onsagerM(Tk) : 0.5, { c: 'hl', r: 7, axis: 'x', snap: 0.02, label: T('Temperature', '温度'), bounds: [0.8, 5, 0, 1.08], onDrag: (x) => ctx.set('T', Math.round(x * 50) / 50) });
      const live = L.el('circle', { r: 5.5, style: 'fill:var(--lab-hl);opacity:0.6' }, g.layers.over);
      let hist = [], accRate = 0, frames = 0;
      const readout = () => {
        const m = magnetisation(st.s), avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : Math.abs(m);
        ctx.readout([
          { k: 'kT / J', v: `${fmt(Tk, 2)} = ${fmt(Tk / TC2D, 3)} T꜀`, tone: 'key' },
          { k: T('m now', '現在の m'), v: fmt(m, 3), tone: 'good' },
          { k: T('⟨|m|⟩, last 200 sweeps', '⟨|m|⟩、直近 200 スイープ'), v: fmt(avg, 3) },
          { k: T('Onsager m(T)', 'オンサーガーの m(T)'), v: h === 0 ? fmt(onsagerM(Tk), 3) : T('h ≠ 0: no closed form', 'h ≠ 0：閉じた式なし') },
          { k: T('energy per spin', 'スピンあたりのエネルギー'), v: fmt(energyPerSpin(st.s, LS, h), 3) + ' J' },
          { k: T('flips accepted', '受け入れた反転'), v: fmt(100 * accRate, 1) + '%' },
        ], Tk < TC2D * 0.9
          ? T('Below T꜀: a flip against the majority costs up to 8J and is almost always refused, so the lattice stays saturated apart from isolated flipped spins and the occasional small droplet.', 'T꜀ より下です。多数派に逆らう反転には最大 8J かかりほぼ常に拒否されるので、格子は孤立した反転スピンとときおりの小さな液滴を除いて飽和したままです。')
          : Tk > TC2D * 1.1
            ? T('Above T꜀: domains of both signs form and dissolve with a finite correlation length, |m| averages to the 1/L noise of a finite lattice, and Onsager’s spontaneous magnetisation is exactly zero.', 'T꜀ より上です。両方の符号のドメインが有限の相関長で生成と消滅を繰り返し、|m| は有限格子の 1/L のノイズに平均され、オンサーガーの自発磁化はちょうど 0 です。')
            : T('Near T꜀: domains of every size, a correlation length comparable to the box, and critical slowing down. The running average drifts for a long time and can jump when the whole lattice changes sign.', 'T꜀ の近くです。あらゆる大きさのドメイン、箱に匹敵する相関長、そして臨界減速。移動平均は長い間さまよい、格子全体が符号を変えるときに跳ぶことがあります。'));
      };
      paint(); readout();
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        let a = 0; for (let k = 0; k < 2; k++) a += metropolisSweep(st.s, LS, Tk, h, st.R); accRate = a / 2; frames++;
        const m = Math.abs(magnetisation(st.s)); hist.push(m); if (hist.length > 100) hist.shift();
        paint(); live.setAttribute('cx', g.X(Tk)); live.setAttribute('cy', g.Y(hist.reduce((x, y) => x + y, 0) / hist.length));
        if (advanceCurve(10)) drawCurve();
        if (frames % 15 === 0) readout();
        lab.textContent = T(`${2 * frames} sweeps`, `${2 * frames} スイープ`);
      }, { autoplay: true, initialT: 0 });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('spin up', '上向きスピン') }, { c: 'c2', kind: 'fill', label: T('spin down', '下向きスピン') }, { c: 'c4', label: T('exact m(T), h = 0', '厳密な m(T)、h = 0') }, { c: 'c1', kind: 'dot', label: T('measured ⟨|m|⟩', '測定した ⟨|m|⟩') }, { c: 'hl', kind: 'dot', label: T('this run', 'この実行') }]);
    },
  };

  /* ---------- 2. the chain ---------- */
  const CN = 240, RMAX = 30;
  D['ising-chain'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, Tk = v.T, h = v.h, col = L.colours();
      if (!st.s || st.T !== Tk || st.h !== h) { st.s = new Int8Array(CN).fill(1); st.R = rng(5); for (let t = 0; t < 300; t++) chainSweep(st.s, Tk, h, st.R); st.T = Tk; st.h = h; st.acc = new Float64Array(RMAX + 1); st.n = 0; st.msum = 0; }
      const th = Math.tanh(1 / Tk), xi = chainXi(Tk), mEx = chainM(Tk, h);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`A ring of ${CN} spins at kT = ${fmt(Tk, 2)} J, drawn in 8 rows of 30. Ticks mark domain walls.`, `kT = ${fmt(Tk, 2)} J での ${CN} スピンの環を 30 個ずつ 8 行に描いています。目盛はドメイン壁です。`));
      const f = L.fig(c1, { x: [0, 30], y: [0, 8], equal: true, axes: false, maxH: 300 });
      const up = col.c1, down = mixc(col.plate, col.c2, 0.75);
      const paint = () => { f.raster((x, y) => { const k = clamp(Math.floor(7.999 - y), 0, 7) * 30 + clamp(Math.floor(x), 0, 29); return st.s[k] > 0 ? up : down; }, { res: 1, pixel: true }); f.clear('over'); for (let k = 0; k < CN; k++) if (st.s[k] !== st.s[(k + 1) % CN] && (k + 1) % 30) f.seg([(k % 30) + 1, 7 - Math.floor(k / 30) + 0.15], [(k % 30) + 1, 7 - Math.floor(k / 30) + 0.85], { c: 'ink', w: 1.6, layer: 'over' }); };
      L.h('p', 'lab-cap', c2, T('The correlation ⟨s₀ sᵣ⟩ against distance r: exact (curve) and measured (dots, accumulating while the chain runs).', '距離 r に対する相関 ⟨s₀ sᵣ⟩ です。厳密解（曲線）と測定値（点、鎖が動く間に蓄積）を示します。'));
      const g = L.fig(c2, { x: [0, RMAX], y: [-0.05, 1.05], aspect: 0.72, xlabel: 'r', ylabel: '⟨s₀ sᵣ⟩', maxH: 300 });
      g.line(L.sample(0, RMAX, 200, (r) => exactCorrRing(Tk, h, Math.round(r), CN)), { c: 'c4', w: 2, layer: 'main' });
      if (h > 0) { g.hline(mEx * mEx, { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); g.text(RMAX, mEx * mEx, 'm²', { small: true, c: 'muted', anchor: 'end', dy: -5 }); }
      if (xi < RMAX) { g.vline(xi, { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' }); g.text(xi, 1.0, `ξ = ${fmt(xi, 2)}`, { small: true, c: 'hl', anchor: xi > 20 ? 'end' : 'start', dx: xi > 20 ? -5 : 5 }); }
      const dotsG = g.group('over');
      const drawDots = () => { while (dotsG.firstChild) dotsG.removeChild(dotsG.firstChild); if (!st.n) return; for (let r = 0; r <= RMAX; r++) dotsG.appendChild(g.dot(r, st.acc[r] / st.n, { c: 'c1', r: 3.2, layer: 'over' })); };
      const readout = () => ctx.readout([
        { k: 'kT / J, h / J', v: `${fmt(Tk, 2)}, ${fmt(h, 2)}`, tone: 'key' },
        { k: 'tanh(J/kT)', v: fmt(th, 4) },
        { k: T('ξ, spins', 'ξ、スピン数'), v: xi > 1e6 ? '> 10⁶' : fmt(xi, xi > 100 ? 0 : 2), tone: 'good' },
        { k: T('λ₋/λ₊', 'λ₋/λ₊'), v: (() => { const e = transferEigen(Tk, h); return fmt(e.minus / e.plus, 4); })() },
        { k: T('domain walls: seen, expected', 'ドメイン壁：観測、期待値'), v: `${domainWalls(st.s)}, ${fmt(CN * (1 - exactCorrRing(Tk, h, 1, CN)) / 2, 1)}` },
        { k: T('m: exact, measured', 'm：厳密、測定'), v: `${fmt(mEx, 3)}, ${st.n ? fmt(st.msum / st.n, 3) : '…'}` },
      ], Tk < 0.5
        ? T('Cold: ξ exceeds the ring, so the whole chain sits in one domain and looks ordered. Raise T slightly and the first walls appear; nothing singular happens at any temperature, the order simply fades as ξ shrinks.', '冷たい状態です。ξ が環を超えるので鎖全体が一つのドメインに収まり、秩序があるように見えます。T を少し上げると最初の壁が現れます。どの温度でも特異なことは起こらず、ξ が縮むにつれて秩序が薄れていくだけです。')
        : T(`Each domain wall costs 2J and there are ${CN} places to put one: the free energy 2J − kT ln N of a wall is negative for any N large enough, so walls always appear and the chain has no ordered phase.`, `各ドメイン壁は 2J を要し、置ける場所は ${CN} か所あります。壁の自由エネルギー 2J − kT ln N は十分大きい N でいつでも負になるので、壁は常に現れ、鎖に秩序相はありません。`));
      paint(); drawDots(); readout();
      st.anim = L.animator(ctx.host, (dt, t, lab) => { for (let k = 0; k < 3; k++) { chainSweep(st.s, Tk, h, st.R); const c = chainCorr(st.s, RMAX); for (let r = 0; r <= RMAX; r++) st.acc[r] += c[r]; st.msum += magnetisation(st.s); st.n++; } paint(); if (st.n % 15 === 0) { drawDots(); readout(); } lab.textContent = T(`${st.n} sweeps`, `${st.n} スイープ`); }, { autoplay: true, initialT: 0 });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('spin up', '上向きスピン') }, { c: 'c2', kind: 'fill', label: T('spin down', '下向きスピン') }, { c: 'c4', label: T('exact ⟨s₀ sᵣ⟩ (transfer matrix)', '厳密な ⟨s₀ sᵣ⟩（転移行列）') }, { c: 'c1', kind: 'dot', label: T('measured', '測定値') }, { c: 'hl', dash: true, label: T('correlation length ξ', '相関長 ξ') }]);
    },
  };

  /* ---------- 3. mean field ---------- */
  D['mean-field'] = {
    render(ctx, v) {
      const Tk = v.T, z = v.z, h = v.h, sols = mfSolutions(z, Tk, h), mPlus = Math.max(...sols);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The self-consistency equation: y = m against y = tanh((zJm + h)/kT). Every crossing is a solution.', '自己無撞着方程式です。y = m と y = tanh((zJm + h)/kT) を重ね、交点がすべて解です。'));
      const f = L.fig(c1, { x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, xlabel: 'm', ylabel: 'y', maxH: 400 });
      f.line([[-1.15, -1.15], [1.15, 1.15]], { c: 'muted', w: 1.4, layer: 'under' });
      f.line(L.sample(-1.15, 1.15, 200, (m) => Math.tanh((z * m + h) / Tk)), { c: 'c1', w: 2.4, layer: 'main' });
      sols.forEach((m) => f.dot(m, m, { c: Math.abs(m - mPlus) < 1e-9 ? 'hl' : 'c2', r: Math.abs(m - mPlus) < 1e-9 ? 6.5 : 5, layer: 'over' }));
      f.text(mPlus, mPlus, `m = ${fmt(mPlus, 3)}`, { c: 'hl', dx: mPlus > 0.6 ? -10 : 10, dy: mPlus > 0.6 ? 20 : -10, anchor: mPlus > 0.6 ? 'end' : 'start', layer: 'over' });
      f.text(-1.05, 1.02, `slope at 0 = zJ/kT = ${fmt(z / Tk, 2)}`, { small: true, c: 'c1', anchor: 'start' });
      L.h('p', 'lab-cap', c2, T('m(T) at this h: the mean-field solution for the chosen z, and the exact answers where they are known. Drag the gold point to change T.', 'この h での m(T) です。選んだ z の平均場解と、知られている厳密解を示します。金色の点をドラッグして T を変えてください。'));
      const g = L.fig(c2, { x: [0, 6.3], y: [0, 1.08], aspect: 0.72, xlabel: 'kT / J', ylabel: 'm', maxH: 400 });
      g.vline(z, { c: 'c1', w: 1.2, dash: '4 3', layer: 'under' }); g.text(z, 1.03, `T꜀ᴹᶠ = ${z}`, { small: true, c: 'c1', anchor: 'end', dx: -4 });
      const exactTc = z === 4 ? TC2D : z === 6 ? TC_TRI : null;
      if (exactTc) { g.vline(exactTc, { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); g.text(exactTc, 0.96, `T꜀ = ${fmt(exactTc, 3)}`, { small: true, c: 'c4', anchor: 'end', dx: -4 }); }
      g.line(L.sample(0.3, 6.3, 300, (t) => Math.max(...mfSolutions(z, t, h))), { c: 'c1', w: 2.2, layer: 'main' });
      if (z === 4 && h === 0) g.line(L.sample(0.3, 6.3, 400, (t) => onsagerM(t)), { c: 'c4', w: 2, layer: 'main' });
      if (z === 2) g.line(L.sample(0.3, 6.3, 300, (t) => chainM(t, h)), { c: 'c4', w: 2, layer: 'main' });
      g.handle(Tk, mPlus, { c: 'hl', r: 7, axis: 'x', snap: 0.05, label: T('Temperature', '温度'), bounds: [0.5, 6, 0, 1.08], onDrag: (x) => ctx.set('T', Math.round(x * 20) / 20) });
      const exactM = z === 4 && h === 0 ? onsagerM(Tk) : z === 2 ? chainM(Tk, h) : null;
      L.legend(ctx.host, [{ c: 'c1', label: T('mean field, y = tanh((zJm + h)/kT) and m(T)', '平均場、y = tanh((zJm + h)/kT) と m(T)') }, { c: 'c4', label: T('exact: Onsager (z = 4) or the chain (z = 2)', '厳密解：オンサーガー（z = 4）または鎖（z = 2）') }, { c: 'hl', kind: 'dot', label: T('the stable solution', '安定な解') }, { c: 'c2', kind: 'dot', label: T('other crossings (the middle one is unstable)', 'その他の交点（真ん中は不安定）') }]);
      ctx.readout([
        { k: 'kT / J, z, h / J', v: `${fmt(Tk, 2)}, ${z}, ${fmt(h, 2)}`, tone: 'key' },
        { k: T('solutions', '解の数'), v: String(sols.length) },
        { k: T('m, mean field', 'm、平均場'), v: fmt(mPlus, 4), tone: 'good' },
        { k: T('m, exact', 'm、厳密'), v: exactM === null ? T('not known in closed form', '閉じた式は知られていない') : fmt(exactM, 4) },
        { k: 'kT꜀: MF, exact', v: `${z}, ${exactTc ? fmt(exactTc, 3) : z === 2 ? '0' : '?'}` },
        { k: T('χ above T꜀ᴹᶠ', 'T꜀ᴹᶠ より上の χ'), v: Tk > z && h === 0 ? fmt(1 / (Tk - z), 3) : '·' },
      ], sols.length === 3
        ? T(`Three crossings: ±m and the unstable m = 0 between them. Mean field at kT = ${fmt(Tk, 2)} gives m = ${fmt(mPlus, 3)}${exactM !== null ? `, the exact answer is ${fmt(exactM, 3)}` : ''}: the average neighbour overstates the order because real neighbours fluctuate together.`, `交点は三つです。±m と、その間の不安定な m = 0。kT = ${fmt(Tk, 2)} で平均場は m = ${fmt(mPlus, 3)} を与えます${exactM !== null ? `が、厳密解は ${fmt(exactM, 3)} です` : ''}。平均化された隣人は秩序を過大に見積もります。実際の隣人は一緒にゆらぐからです。`)
        : h > 0 ? T('With a field the tanh curve is shifted and there is a single crossing at every temperature: the field picks the direction and the transition is smoothed away, in mean field and exactly alike.', '磁場があると tanh の曲線がずれ、どの温度でも交点は一つだけです。磁場が向きを決め、転移は平均場でも厳密解でも同じように消えて滑らかになります。')
          : T(`One crossing at m = 0: the slope zJ/kT = ${fmt(z / Tk, 2)} of the tanh at the origin is below 1, so no self-sustaining magnetisation exists. Lower T until the slope passes 1 and the ordered solutions are born.`, `m = 0 での交点が一つだけです。原点での tanh の傾き zJ/kT = ${fmt(z / Tk, 2)} は 1 未満なので、自己維持する磁化は存在しません。傾きが 1 を超えるまで T を下げると秩序解が生まれます。`));
    },
  };
})();
