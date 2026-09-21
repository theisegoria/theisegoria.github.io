'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const bez = (a, c, b, n = 40) => L.seq(n + 1, (i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });

  // A two-state transition diagram: node sizes show current mass, arrow widths show p and q.
  function diagram(host, p, q, mass, o = {}) {
    const f = L.fig(host, { axes: false, x: [0, 10], y: [0, 4.2], equal: true, maxH: 230 });
    const A = [2.6, 2.1], B = [7.4, 2.1];
    const r = (m) => 0.45 + 0.9 * Math.sqrt(Math.max(0, m));
    const w = (x) => 1 + 7 * x;
    if (p > 0) f.line(bez([A[0] + 0.5, A[1] + 0.5], [5, 3.9], [B[0] - 0.55, B[1] + 0.55]), { c: 'c1', w: w(p), op: 0.85, arrow: true });
    if (q > 0) f.line(bez([B[0] - 0.5, B[1] - 0.5], [5, 0.3], [A[0] + 0.55, A[1] - 0.55]), { c: 'c2', w: w(q), op: 0.85, arrow: true });
    // self loops, drawn as arcs on the outer side of each state
    const loop = (P, side, stay, c, rr) => { const cx = P[0] + side * (rr + 0.42), pts = L.seq(41, (i) => { const th = (side > 0 ? Math.PI : 0) + side * (0.95 + i / 40 * (2 * Math.PI - 1.9)); return [cx + 0.42 * Math.cos(th), P[1] + 0.42 * Math.sin(th)]; }); f.line(pts, { c, w: 1 + 4 * stay, op: 0.45, arrow: true }); };
    loop(A, -1, 1 - p, 'c1', r(mass[0]));
    loop(B, 1, 1 - q, 'c2', r(mass[1]));
    f.circle(A[0], A[1], r(mass[0]), { c: 'c1', fill: true, fo: 0.22, w: 2 });
    f.circle(B[0], B[1], r(mass[1]), { c: 'c2', fill: true, fo: 0.22, w: 2 });
    f.text(A[0], A[1], 'A', { math: true, dy: 5 });
    f.text(B[0], B[1], 'B', { math: true, dy: 5 });
    f.text(5, 3.75, `p = ${fmt(p, 2)}`, { c: 'c1', small: true, dy: -6 });
    f.text(5, 0.5, `q = ${fmt(q, 2)}`, { c: 'c2', small: true, dy: 16 });
    f.text(A[0], A[1] - r(mass[0]), fmt(mass[0], 3), { small: true, dy: 16 });
    f.text(B[0], B[1] - r(mass[1]), fmt(mass[1], 3), { small: true, dy: 16 });
    if (o.caption) L.h('p', 'lab-cap', host, o.caption);
    return f;
  }
  const seriesA = (a0, p, q, n) => { const out = [a0]; let a = a0; for (let k = 0; k < n; k++) { a = a * (1 - p) + (1 - a) * q; out.push(a); } return out; };

  D.transition = {
    render(ctx, v) {
      const { p, q } = v, n = Math.round(v.steps), a = seriesA(0.5, p, q, n), pi = p + q > 0 ? q / (p + q) : 0.5;
      diagram(ctx.host, p, q, [a[n], 1 - a[n]], { caption: T(`After ${n} steps, starting from ½ in each state. Circle area is probability; arrow width is transition probability.`, `各状態に½ずつ置いて ${n} ステップ後。円の面積が確率、矢印の太さが遷移確率を表します。`) });
      const N = Math.max(n, 6);
      const f = L.fig(ctx.host, { x: [-0.6, N + 0.6], y: [0, 1], aspect: 0.42, xlabel: T('step n', 'ステップ n'), ylabel: T('probability', '確率'), ticksY: [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']] });
      const bw = Math.min(0.72, 0.8);
      for (let k = 0; k <= n; k++) {
        f.rect(k - bw / 2, 0, bw, a[k], { c: 'c1', fo: 0.55, w: 0, nostroke: true });
        f.rect(k - bw / 2, a[k], bw, 1 - a[k], { c: 'c2', fo: 0.28, w: 0, nostroke: true });
      }
      if (p + q > 0) f.hline(pi, { c: 'ink', dash: '5 4', w: 1.4 });
      if (p + q > 0) f.text(N + 0.5, pi, `π(A) = ${fmt(pi, 3)}`, { anchor: 'end', dy: -7, small: true });
      f.hover((x) => { const k = Math.round(x); if (k < 0 || k > n) return null; return { x: k, y: a[k], text: `n = ${k}: P(A) = ${fmt(a[k], 4)}` }; });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('mass in A', 'Aにある確率') }, { kind: 'fill', c: 'c2', label: T('mass in B', 'Bにある確率') }, { c: 'ink', dash: true, label: T('stationary share of A', 'Aの定常確率') }]);
      const lam = 1 - p - q;
      ctx.readout([{ k: `P(Xₙ = A), n = ${n}`, v: fmt(a[n], 4), tone: 'key' }, { k: 'π(A)', v: p + q > 0 ? fmt(pi, 4) : T('any', '任意') }, { k: T('second eigenvalue 1 − p − q', '第2固有値 1 − p − q'), v: fmt(lam, 3), tone: Math.abs(lam) > 0.95 ? 'warn' : undefined }],
        Math.abs(lam) < 1e-9 ? T('Here 1 − p − q = 0, so the chain forgets its start in a single step.', 'ここでは 1 − p − q = 0 なので、1ステップで初期状態を忘れます。') : lam < 0 ? T('A negative eigenvalue makes the mass oscillate as it settles.', '固有値が負なので、確率は振動しながら落ち着きます。') : '');
    },
  };

  D.stationary = {
    render(ctx, v) {
      const { p, q } = v, n = Math.round(v.steps), N = Math.max(30, n), pi = q / (p + q);
      const f = L.fig(ctx.host, { x: [0, N], y: [0, 1], aspect: 0.5, xlabel: T('step n', 'ステップ n'), ylabel: T('P(Xₙ = A)', 'P(Xₙ = A)') });
      const starts = [[1, 'c1', T('start in A', 'Aから開始')], [0, 'c2', T('start in B', 'Bから開始')], [0.5, 'c4', T('start half and half', '半々で開始')]];
      f.hline(pi, { c: 'ink', w: 1.6, dash: '6 4' });
      f.text(N, pi, `π(A) = ${fmt(pi, 3)}`, { anchor: 'end', dy: -8, small: true });
      f.vline(n, { c: 'hl', w: 1.4, dash: '2 3' });
      for (const [a0, c] of starts) {
        const s = seriesA(a0, p, q, N);
        f.line(s.map((y, k) => [k, y]), { c, w: 2.2 });
        f.dot(n, s[n], { c });
      }
      // geometric envelope |1-p-q|^n around pi
      const lam = 1 - p - q;
      f.area(L.seq(N + 1, (k) => [k, pi + Math.abs(lam) ** k * Math.max(pi, 1 - pi)]), { c: 'muted', fo: 0.06, base: pi });
      f.area(L.seq(N + 1, (k) => [k, pi - Math.abs(lam) ** k * Math.max(pi, 1 - pi)]), { c: 'muted', fo: 0.06, base: pi });
      f.hover((x) => { const k = Math.round(x); if (k < 0 || k > N) return null; return { x: k, text: `n = ${k}: ${starts.map(([a0]) => fmt(seriesA(a0, p, q, k)[k], 3)).join(' · ')}` }; });
      L.legend(ctx.host, starts.map(([, c, lab]) => ({ c, label: lab })).concat([{ c: 'ink', dash: true, label: T('stationary distribution', '定常分布') }, { kind: 'fill', c: 'muted', label: T('envelope |1 − p − q|ⁿ', '包絡線 |1 − p − q|ⁿ') }]));
      const gap = Math.abs(lam) ** n;
      ctx.readout([{ k: 'π', v: `(${fmt(pi, 3)}, ${fmt(1 - pi, 3)})`, tone: 'key' }, { k: T(`worst gap at n = ${n}`, `n = ${n} での最大の差`), v: fmt(gap * Math.max(pi, 1 - pi), 4) }, { k: T('steps to halve the gap', '差が半分になるステップ数'), v: Math.abs(lam) < 1e-9 ? '1' : Math.abs(lam) >= 1 ? '∞' : fmt(Math.log(0.5) / Math.log(Math.abs(lam)), 2) }]);
    },
  };

  // Seeded generator so the sample paths are stable for a given setting.
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  D.absorbing = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const a = v.alpha, N = Math.round(v.goal), i0 = Math.min(Math.round(v.fortune), N - 1);
      const r = (1 - a) / a;
      const h = (x) => (Math.abs(a - 0.5) < 1e-9 ? x / N : (1 - r ** x) / (1 - r ** N));
      const row = L.h('div', 'lab-row', ctx.host);
      const left = L.h('div', 'lab-col', row), right = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', left, T('Sample games from fortune i: each step wins 1 with probability α.', '資産 i からの試行例：各ステップで確率 α で1増えます。'));
      const TM = Math.max(40, N * N * 1.2);
      const f = L.fig(left, { x: [0, TM], y: [0, N], aspect: 0.62, maxH: 360, xlabel: T('time', '時間'), ylabel: T('fortune', '資産'), ticksY: L.ticks(0, N, 5).filter((y) => Number.isInteger(y)).map((y) => [y, String(y)]) });
      f.hline(N, { c: 'c3', dash: false, w: 2 }); f.hline(0, { c: 'c2', dash: false, w: 2 });
      f.text(TM, N, T('goal', '目標'), { anchor: 'end', dy: -6, small: true, c: 'c3' });
      f.text(TM, 0, T('ruin', '破産'), { anchor: 'end', dy: -6, small: true, c: 'c2' });
      L.h('p', 'lab-cap', right, T('Probability of reaching N before 0.', '0より先に N に到達する確率。'));
      const g2 = L.fig(right, { x: [0, N], y: [0, 1], aspect: 0.62, maxH: 360, xlabel: T('initial fortune i', '初期資産 i'), ylabel: 'hᵢ' });
      g2.line(L.sample(0, N, 200, h), { c: 'c1', w: 2.4 });
      for (let x = 0; x <= N; x++) g2.dot(x, h(x), { c: 'c1', r: 3 });
      g2.dot(i0, h(i0), { c: 'hl', r: 6 });
      g2.text(i0, h(i0), fmt(h(i0), 3), { dx: -10, dy: -10, anchor: 'end' });
      const rand = rng(Math.round(a * 1000) * 131 + i0 * 17 + N);
      const games = [];
      for (let k = 0; k < 24; k++) { let x = i0, path = [[0, x]]; for (let t = 1; t < 4000 && x > 0 && x < N; t++) { x += rand() < a ? 1 : -1; path.push([t, x]); } games.push(path); }
      const wins = games.filter((pth) => pth[pth.length - 1][1] === N).length;
      const empirical = g2.dot(i0, wins / games.length, { c: 'c4', r: 5, hollow: true });
      void empirical;
      const g = f.group('main');
      ctx.state.anim = L.animator(left, (dt, t) => {
        f.clear('main');
        const shown = Math.min(games.length, Math.floor(t * 4) + 1);
        const head = t * 60;
        for (let k = 0; k < shown; k++) {
          const pth = games[k], lim = k < shown - 1 ? pth.length : Math.min(pth.length, Math.floor(head - (shown - 1) * 15) + 1);
          const part = pth.slice(0, Math.max(1, lim)), end = pth[pth.length - 1][1];
          const done = part.length === pth.length;
          f.line(part, { c: done ? (end === N ? 'c3' : 'c2') : 'ink', w: done ? 1.2 : 1.8, op: done ? 0.5 : 0.9 });
        }
        return shown < games.length || Math.floor(head - (shown - 1) * 15) + 1 < games[games.length - 1].length;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Replay the games', '試行を再生') });
      void g;
      L.legend(ctx.host, [{ c: 'c3', label: T('reached the goal', '目標に到達') }, { c: 'c2', label: T('ruined', '破産') }, { c: 'c1', label: 'hᵢ' }, { kind: 'dot', c: 'c4', label: T('share of the 24 sample games won', '24回の試行で到達した割合') }]);
      ctx.readout([{ k: `h(${i0})`, v: fmt(h(i0), 4), tone: 'key' }, { k: T('sample games won', '試行での到達'), v: `${wins} / ${games.length}` }, { k: T('ruin probability', '破産確率'), v: fmt(1 - h(i0), 4) }]);
    },
  };
})();
