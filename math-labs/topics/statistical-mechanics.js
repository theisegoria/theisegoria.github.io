'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  D.boltzmann = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const Tk = v.temperature, gap = v.gap, w = Math.exp(-gap / Tk), Z = 1 + w, p1 = w / Z, p0 = 1 / Z, M = 60;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${M} independent two-level particles (Metropolis dynamics) and the exact Boltzmann shares`, `${M} 個の独立な二準位粒子（メトロポリス法）と厳密なボルツマン分布`));
      const f = L.fig(c1, { x: [0, 10], y: [-0.7, 3.6], aspect: 0.8, maxH: 360, grid: false, xlabel: '', ylabel: T('energy E', 'エネルギー E'), ticksX: [], ticksY: [[0, '0'], [gap, 'ΔE']] });
      f.line([[0.3, 0], [7, 0]], { c: 'ink', w: 2.4 });
      f.line([[0.3, gap], [7, gap]], { c: 'ink', w: 2.4 });
      f.rect(7.4, -0.28, 2.4 * p0, 0.56, { c: 'c1', fo: 0.5, w: 1 });
      f.rect(7.4, gap - 0.28, Math.max(0.02, 2.4 * p1), 0.56, { c: 'c2', fo: 0.5, w: 1 });
      f.text(7.4, 0, `p₀ = ${fmt(p0, 3)}`, { anchor: 'start', dy: -20, small: true, layer: 'main' });
      f.text(7.4, gap, `p₁ = ${fmt(p1, 3)}`, { anchor: 'start', dy: -20, small: true, layer: 'main' });
      // Metropolis with random single-particle updates, advanced incrementally
      let state = null, sweeps = 0, r = null;
      const reset = () => { state = new Array(M).fill(0); sweeps = 0; r = rng(1234 + Math.round(Tk * 100) * 7 + Math.round(gap * 100)); };
      const sweep = () => { for (let k = 0; k < M; k++) { const i = Math.floor(r() * M); if (state[i] === 0) { if (r() < w) state[i] = 1; } else state[i] = 0; } sweeps++; };
      const RATE = 8, T0 = 40;
      const draw = () => {
        f.clear('over');
        let up = 0;
        state.forEach((s, i) => { up += s; const x = 0.55 + (i % 30) * 0.22 + (i >= 30 ? 0.11 : 0), y = (s ? gap : 0) + (i >= 30 ? 0.16 : -0.16) + 0.02; f.dot(x, y, { c: s ? 'c2' : 'c1', r: 3.6 }); });
        return up;
      };
      let last = 0;
      ctx.state.anim = L.animator(c1, (dt, t, label) => {
        const target = Math.floor(t * RATE);
        if (!state || target < sweeps) reset();
        while (sweeps < target) sweep();
        last = draw();
        label.textContent = `${T('sweep', 'スイープ')} ${sweeps}: ${last}/${M} ${T('excited', '励起')}`;
        return t < T0 + 60;
      }, { autoplay: false, initialT: T0, playLabel: T('Run the dynamics', 'ダイナミクスを実行'), onRestart: reset });
      L.h('p', 'lab-cap', c2, T('Excited share and heat capacity against temperature', '温度に対する励起の割合と熱容量'));
      const g = L.fig(c2, { x: [0, 5], y: [0, 0.6], aspect: 0.8, maxH: 360, xlabel: T('temperature T (k = 1)', '温度 T（k = 1）'), ylabel: '' });
      const P1 = (t) => 1 / (1 + Math.exp(gap / t)), C = (t) => { const x = gap / t; return x * x * Math.exp(x) / (1 + Math.exp(x)) ** 2; };
      g.hline(0.5, { c: 'muted', dash: '4 4' });
      g.text(0.1, 0.5, T('T → ∞: ½', 'T → ∞：½'), { anchor: 'start', dy: -6, small: true, c: 'muted' });
      g.line(L.sample(0.02, 5, 300, P1), { c: 'c2', w: 2.6 });
      g.line(L.sample(0.02, 5, 300, C), { c: 'c4', w: 2.2, dash: '7 4' });
      g.vline(Tk, { c: 'hl', dash: '3 3', w: 1.4 });
      g.dot(Tk, P1(Tk), { c: 'c2', r: 5.5 });
      g.dot(Tk, C(Tk), { c: 'c4', r: 4.5 });
      g.handle(Tk, P1(Tk), { c: 'hl', axis: 'x', bounds: [0.2, 5, 0, 0.6], label: T('Temperature', '温度'), onDrag: (x) => ctx.set('temperature', x) });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('particle in the ground state', '基底状態の粒子') }, { kind: 'dot', c: 'c2', label: T('particle in the excited state', '励起状態の粒子') }, { c: 'c2', label: T('p₁(T), excited share', 'p₁(T)、励起の割合') }, { c: 'c4', dash: true, label: T('heat capacity C/k per particle', '1粒子あたりの熱容量 C/k') }]);
      ctx.readout([{ k: 'exp(−ΔE/kT)', v: fmt(w, 4) }, { k: 'Z', v: fmt(Z, 4) }, { k: 'p₁', v: fmt(p1, 4), tone: 'key' }, { k: T('simulated share', 'シミュレーションの割合'), v: `${last}/${M}` }, { k: '⟨E⟩', v: fmt(p1 * gap, 4) }],
        T('Units with Boltzmann’s constant k = 1. Each particle jumps up with probability exp(−ΔE/kT) and always drops down, which balances exactly at the Boltzmann shares.', 'ボルツマン定数 k = 1 の単位です。各粒子は確率 exp(−ΔE/kT) で上がり、必ず下がります。この釣り合いがちょうどボルツマン分布になります。'));
    },
  };

  D.partition = {
    render(ctx, v) {
      const n = Math.round(v.states), Tk = v.temperature;
      const stats = (m) => { const ws = L.seq(m, (i) => Math.exp(-i / Tk)), Z = ws.reduce((a, b) => a + b, 0), ps = ws.map((x) => x / Z), U = ps.reduce((a, p, i) => a + p * i, 0), F = -Tk * Math.log(Z); return { ws, Z, ps, U, F, S: (U - F) / Tk }; };
      const S = stats(n);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Levels Eᵢ = i·ε, i = 0 to ${n - 1}; bar length is the probability pᵢ`, `準位 Eᵢ = i·ε（i = 0 から ${n - 1}）。棒の長さが確率 pᵢ`));
      const pm = Math.max(...S.ps);
      const f = L.fig(c1, { x: [0, Math.max(0.3, pm * 1.25)], y: [-0.8, Math.max(n, 6) - 0.2], aspect: 0.95, maxH: 400, xlabel: T('probability pᵢ', '確率 pᵢ'), ylabel: T('energy / ε', 'エネルギー / ε') });
      for (let i = 0; i < n; i++) f.hline(i, { c: 'ink', dash: false, w: 0.8, op: 0.3, layer: 'under' });
      S.ps.forEach((p, i) => f.rect(0, i - 0.36, p, 0.72, { c: 'c1', fo: 0.55, w: 1 }));
      f.hline(S.U, { c: 'hl', dash: '6 4', w: 2 });
      f.text(Math.max(0.3, pm * 1.25), S.U, `⟨E⟩ = ${fmt(S.U, 3)} ε`, { anchor: 'end', dx: -4, dy: -6, small: true });
      L.h('p', 'lab-cap', c2, T('Free energy against the number of accessible states, at this temperature', 'この温度での、利用可能な状態数に対する自由エネルギー'));
      const Fs = L.seq(19, (i) => stats(i + 2).F), Finf = Tk * Math.log(1 - Math.exp(-1 / Tk));
      const lo = Math.min(Finf, ...Fs), hi = Math.max(...Fs);
      const pad = (hi - lo) * 0.15 + 0.05;
      const g = L.fig(c2, { x: [0, 21], y: [lo - pad, hi + pad], aspect: 0.95, maxH: 400, xlabel: T('accessible states n', '利用可能な状態数 n'), ylabel: 'F / ε' });
      g.hline(Finf, { c: 'c4', dash: '6 4', w: 1.8 });
      g.text(21, Finf, T('n → ∞', 'n → ∞'), { anchor: 'end', dy: 14, dx: -4, small: true, c: 'c4' });
      g.line(Fs.map((F, i) => [i + 2, F]), { c: 'c1', w: 1.6, op: 0.6 });
      Fs.forEach((F, i) => g.dot(i + 2, F, { c: 'c1', r: 3.2 }));
      g.dot(n, S.F, { c: 'hl', r: 6.5 });
      g.text(n, S.F, `F = ${fmt(S.F, 3)}`, { dy: -12, anchor: n > 14 ? 'end' : 'start', dx: n > 14 ? -6 : 6, small: true });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('Boltzmann probability of each level', '各準位のボルツマン確率') }, { c: 'hl', dash: true, label: T('mean energy', '平均エネルギー') }, { c: 'c4', dash: true, label: T('infinite ladder, F = kT ln(1 − exp(−ε/kT))', '無限の梯子、F = kT ln(1 − exp(−ε/kT))') }]);
      ctx.readout([{ k: 'Z', v: fmt(S.Z, 4) }, { k: 'F = −kT ln Z', v: fmt(S.F, 4), tone: 'key' }, { k: '⟨E⟩', v: fmt(S.U, 4) }, { k: T('entropy S/k', 'エントロピー S/k'), v: fmt(S.S, 4) }],
        T('Units with Boltzmann’s constant k = 1 and ε = 1. Each extra level adds a positive term to Z and lowers F, but levels far above kT add almost nothing.', 'ボルツマン定数 k = 1、ε = 1 の単位です。準位を1つ加えるごとに Z に正の項が加わり F は下がりますが、kT よりずっと高い準位の寄与はほとんどありません。'));
    },
  };

  D['random-walk'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const N = Math.round(v.steps), b = v.bias, p = (1 + b) / 2, K = 30;
      const mean = (n) => n * b, sd = (n) => Math.sqrt(n * (1 - b * b));
      const paths = L.seq(K, (j) => { const r = rng(5501 * (j + 1)); let x = 0; const out = [0]; for (let i = 0; i < 200; i++) { x += r() < p ? 1 : -1; out.push(x); } return out; });
      // many walkers for the empirical mean square
      const W = 1000; let ms = 0; { const r = rng(777); for (let j = 0; j < W; j++) { let x = 0; for (let i = 0; i < N; i++) x += r() < p ? 1 : -1; ms += x * x; } ms /= W; }
      const lf = [0]; for (let i = 1; i <= N; i++) lf.push(lf[i - 1] + Math.log(i));
      const pmf = L.seq(N + 1, (k) => { const lp = lf[N] - lf[k] - lf[N - k] + (k ? k * Math.log(p) : 0) + (N - k ? (N - k) * Math.log(1 - p) : 0); return [2 * k - N, p === 0 ? (k === 0 ? 1 : 0) : p === 1 ? (k === N ? 1 : 0) : Math.exp(lp)]; });
      const ext = Math.max(8, ...paths.map((pt) => Math.max(...pt.slice(0, N + 1).map(Math.abs)))) * 1.08;
      const lo = Math.min(-ext, mean(N) - 3.5 * sd(N)), hi = Math.max(ext, mean(N) + 3.5 * sd(N));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${K} walks of ±1 steps, with the band ⟨x⟩ ± 2σ`, `±1 歩のランダムウォーク ${K} 本と帯 ⟨x⟩ ± 2σ`));
      const f = L.fig(c1, { x: [0, N], y: [lo, hi], aspect: 0.85, maxH: 400, xlabel: T('step n', '歩数 n'), ylabel: T('position x', '位置 x') });
      f.poly(L.sample(0, N, 100, (n) => [n, mean(n) + 2 * sd(n)]).concat(L.sample(0, N, 100, (n) => [N - n, mean(N - n) - 2 * sd(N - n)])), { c: 'c1', fo: 0.12, w: 0, layer: 'under' });
      f.line(L.sample(0, N, 100, (n) => mean(n)), { c: 'c1', w: 1.8, dash: '6 4', layer: 'under' });
      L.h('p', 'lab-cap', c2, T(`Exact distribution of the position after N = ${N} steps`, `N = ${N} 歩後の位置の厳密な分布`));
      const pmax = Math.max(...pmf.map((q) => q[1]));
      const g = L.fig(c2, { x: [0, pmax * 1.15], y: [lo, hi], aspect: 0.85, maxH: 400, xlabel: T('probability', '確率'), ticksX: [[0, '0'], [Number((pmax).toPrecision(1)), String(Number((pmax).toPrecision(1)))]] });
      pmf.forEach(([x, q]) => { if (q > 1e-5) g.rect(0, x - 0.8, q, 1.6, { c: 'c1', fo: 0.5, w: 0.6 }); });
      if (sd(N) > 0.5) g.line(L.sample(lo, hi, 200, (x) => [2 * Math.exp(-((x - mean(N)) ** 2) / (2 * sd(N) ** 2)) / (sd(N) * Math.sqrt(L.TAU)), x]), { c: 'c2', w: 2 });
      g.hline(mean(N), { c: 'c1', dash: '6 4', w: 1.4 });
      let shown = -1;
      const draw = (m) => {
        f.clear('main'); g.clear('over');
        paths.forEach((pt, j) => f.line(pt.slice(0, m + 1).map((x, i) => [i, x]), { c: j === 0 ? 'hl' : 'ink', w: j === 0 ? 2.4 : 1, op: j === 0 ? 1 : 0.3 }));
        if (m === N) paths.forEach((pt) => g.dot(pmax * 1.08, pt[N], { c: 'hl', r: 2.6, op: 0.7 }));
        shown = m;
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const m = Math.min(N, Math.floor(t * 40));
        if (m !== shown) draw(m);
        label.textContent = m < N ? `n = ${m}` : '';
        return m < N;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Replay the walks', 'ウォークを再生') });
      L.legend(ctx.host, [{ c: 'hl', label: T('one highlighted walk', '強調した1本') }, { c: 'c1', dash: true, label: T('mean drift Nb', '平均の移動 Nb') }, { kind: 'fill', c: 'c1', label: T('band ±2σ, and exact distribution', '±2σ の帯と厳密な分布') }, { c: 'c2', label: T('normal approximation', '正規近似') }, { kind: 'dot', c: 'hl', label: T('endpoints of the 30 walks', '30本の終点') }]);
      const ex2 = N * (1 - b * b) + (N * b) ** 2;
      ctx.readout([{ k: '⟨x⟩ = Nb', v: fmt(N * b, 3) }, { k: 'Var = N(1 − b²)', v: fmt(N * (1 - b * b), 3) }, { k: '⟨x²⟩', v: fmt(ex2, 4), tone: 'key' }, { k: T(`mean of x² over ${W} walkers`, `${W} 人の歩行者での x² の平均`), v: fmt(ms, 4) }, { k: T('rms spread √Var', '広がり √Var'), v: fmt(Math.sqrt(N * (1 - b * b)), 3) }],
        T('Only positions with the same parity as N occur, two units apart, so the normal density is doubled to match the bars.', 'N と同じ偶奇の位置だけが2単位おきに現れるため、正規密度は棒に合わせて2倍しています。'));
    },
  };
})();
