'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const bez = (a, c, b, n = 40) => L.seq(n + 1, (i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });

  // A two-state transition diagram: node sizes show current mass, arrow widths show p and q.
  function diagram(host, p, q, mass, o = {}) {
    if (o.caption) L.h('p', 'lab-cap', host, o.caption);
    const f = L.fig(host, { axes: false, x: [0, 10], y: [0, 4.4], equal: true, maxH: 260 });
    const A = [2.7, 2.2], B = [7.3, 2.2];
    const r = (m) => 0.45 + 0.9 * Math.sqrt(Math.max(0, m));
    const rA = r(mass[0]), rB = r(mass[1]);
    const w = (x) => 1 + 7 * x;
    // an arrowhead drawn as a polygon, so its size follows the stroke width and it sits exactly on the node rim
    const head = (tip, dir, wpx, c) => {
      const l = Math.hypot(dir[0], dir[1]) || 1, u = [dir[0] / l, dir[1] / l], nn = [-u[1], u[0]];
      const h = 0.2 + 0.018 * wpx, hw = 0.1 + 0.012 * wpx;
      f.poly([tip, [tip[0] - h * u[0] + hw * nn[0], tip[1] - h * u[1] + hw * nn[1]], [tip[0] - h * u[0] - hw * nn[0], tip[1] - h * u[1] - hw * nn[1]]], { c, fill: true, fo: 0.9, w: 0 });
      return h;
    };
    const onRim = (P, rr, th) => [P[0] + rr * Math.cos(th), P[1] + rr * Math.sin(th)];
    // curved arrows between the states, from rim to rim
    const arc = (P, rP, Q, rQ, th0, th1, ctrl, x, c) => {
      const a = onRim(P, rP, th0), b = onRim(Q, rQ, th1), wp = w(x);
      const pts = bez(a, ctrl, b), last = pts[pts.length - 1], prev = pts[pts.length - 3];
      const dir = [last[0] - prev[0], last[1] - prev[1]], l = Math.hypot(...dir), h = 0.2 + 0.018 * wp;
      const cut = pts.filter((pt) => Math.hypot(pt[0] - b[0], pt[1] - b[1]) > h * 0.8);
      f.line(cut, { c, w: wp, op: 0.85 });
      head(b, dir, wp, c);
      void l;
    };
    if (p > 0) arc(A, rA, B, rB, 0.55, Math.PI - 0.55, [5, 4.4], p, 'c1');
    if (q > 0) arc(B, rB, A, rA, Math.PI + 0.55, -0.55, [5, 0], q, 'c2');
    // self loops: a small circle beside each state, drawn only outside the node, ending on the rim with an arrowhead
    const loop = (P, rr, side, stay, c) => {
      const rho = 0.42, d = 0.25, Dd = rr + d, cx = P[0] + side * Dd;
      const phi0 = Math.acos(L.clamp((rr * rr - Dd * Dd - rho * rho) / (2 * Dd * rho), -1, 1));
      const pt = (ph) => [cx + side * rho * Math.cos(ph), P[1] + rho * Math.sin(ph)];
      const wp = 1 + 4 * stay, h = 0.2 + 0.018 * wp;
      const dphi = h * 0.8 / rho;
      const pts = L.seq(41, (i) => pt(-phi0 + (2 * phi0 - dphi) * i / 40));
      f.line(pts, { c, w: wp, op: 0.6 });
      const tip = pt(phi0), tang = [-side * Math.sin(phi0), Math.cos(phi0)];
      head(tip, tang, wp, c);
      f.text(cx, Math.min(P[1] - rho, P[1] - rr) - 0.05, `1 − ${side < 0 ? 'p' : 'q'} = ${fmt(stay, 2)}`, { c, small: true, dy: 12 });
    };
    loop(A, rA, -1, 1 - p, 'c1');
    loop(B, rB, 1, 1 - q, 'c2');
    f.circle(A[0], A[1], rA, { c: 'c1', fill: true, fo: 0.22, w: 2 });
    f.circle(B[0], B[1], rB, { c: 'c2', fill: true, fo: 0.22, w: 2 });
    f.text(A[0], A[1], 'A', { math: true, dy: 5 });
    f.text(B[0], B[1], 'B', { math: true, dy: 5 });
    f.text(5, 3.95, `p = ${fmt(p, 2)}`, { c: 'c1', small: true, dy: -4 });
    f.text(5, 0.45, `q = ${fmt(q, 2)}`, { c: 'c2', small: true, dy: 16 });
    const pm = (m) => fmt(Math.round(m * 1000) / 1000, 3);
    f.text(A[0], A[1] + rA, pm(mass[0]), { small: true, dy: -6 });
    f.text(B[0], B[1] + rB, pm(mass[1]), { small: true, dy: -6 });
    return f;
  }
  const seriesA = (a0, p, q, n) => { const out = [a0]; let a = a0; for (let k = 0; k < n; k++) { a = a * (1 - p) + (1 - a) * q; out.push(a); } return out; };

  D.transition = {
    render(ctx, v) {
      const { p, q } = v, n = Math.round(v.steps), a = seriesA(0.5, p, q, n), pi = p + q > 0 ? q / (p + q) : 0.5;
      const row = L.h('div', 'lab-row', ctx.host);
      const left = L.h('div', 'lab-col', row), right = L.h('div', 'lab-col', row);
      diagram(left, p, q, [a[n], 1 - a[n]], { caption: T(`After ${n} steps, starting from ½ in each state. Circle area is probability; arrow width is transition probability.`, `各状態に½ずつ置いて ${n} ステップ後。円の面積が確率、矢印の太さが遷移確率を表します。`) });
      L.h('p', 'lab-cap', right, T('Probability in each state, step by step (blue A, orange B).', '各ステップでの各状態の確率（青が A、橙が B）。'));
      const N = Math.max(n, 6);
      const f = L.fig(right, { x: [-0.6, N + 0.6], y: [0, 1], aspect: 0.6, maxH: 300, xlabel: T('step n', 'ステップ n'), ticksY: [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']] });
      const bw = 0.72;
      for (let k = 0; k <= n; k++) {
        f.rect(k - bw / 2, 0, bw, a[k], { c: 'c1', fo: 0.55, w: 0, nostroke: true });
        f.rect(k - bw / 2, a[k], bw, 1 - a[k], { c: 'c2', fo: 0.28, w: 0, nostroke: true });
      }
      if (p + q > 0) f.hline(pi, { c: 'ink', dash: '5 4', w: 1.4 });
      if (p + q > 0) f.text(N + 0.5, pi, `π(A) = ${fmt(pi, 3)}`, { anchor: 'end', dy: pi > 0.85 ? 14 : -7, small: true });
      f.hover((x) => { const k = Math.round(x); if (k < 0 || k > n) return null; return { x: k, y: a[k], text: `n = ${k}: P(A) = ${fmt(a[k], 4)}` }; });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('mass in A', 'Aにある確率') }, { kind: 'fill', c: 'c2', label: T('mass in B', 'Bにある確率') }, { c: 'ink', dash: true, label: T('stationary share of A', 'Aの定常確率') }]);
      const lam = 1 - p - q;
      ctx.readout([{ k: `P(Xₙ = A), n = ${n}`, v: fmt(a[n], 4), tone: 'key' }, { k: 'π(A)', v: p + q > 0 ? fmt(pi, 4) : T('any', '任意') }, { k: T('second eigenvalue 1 − p − q', '第2固有値 1 − p − q'), v: fmt(lam, 3), tone: Math.abs(lam) > 0.95 ? 'warn' : undefined }],
        Math.abs(lam) < 1e-9 ? T('Here 1 − p − q = 0, so the chain forgets its start in a single step.', 'ここでは 1 − p − q = 0 なので、1ステップで初期状態を忘れます。') : lam < 0 ? T('A negative eigenvalue makes the mass oscillate as it settles.', '固有値が負なので、確率は振動しながら落ち着きます。') : '');
    },
  };

  D.stationary = {
    render(ctx, v) {
      const { p, q } = v, n = Math.round(v.steps), N = Math.max(4, n), pi = q / (p + q);
      L.h('p', 'lab-cap', ctx.host, T('P(Xₙ = A) against the step n, for three starting distributions.', '3通りの初期分布についての、ステップ n に対する P(Xₙ = A)。'));
      const f = L.fig(ctx.host, { x: [0, N], y: [0, 1], aspect: 0.5, xlabel: T('step n', 'ステップ n') });
      const starts = [[1, 'c1', T('start in A', 'Aから開始')], [0, 'c2', T('start in B', 'Bから開始')], [0.5, 'c4', T('start half and half', '半々で開始')]];
      f.hline(pi, { c: 'ink', w: 1.6, dash: '6 4' });
      f.text(N * 0.5, pi, `π(A) = ${fmt(pi, 3)}`, { anchor: 'middle', dy: pi > 0.85 ? 14 : -8, small: true });
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
      const gap = Math.abs(lam) ** n, al = Math.abs(lam);
      ctx.readout([{ k: 'π', v: `(${fmt(pi, 3)}, ${fmt(1 - pi, 3)})`, tone: 'key' }, { k: 'λ₂ = 1 − p − q', v: fmt(lam, 3) }, { k: T(`worst gap at n = ${n}`, `n = ${n} での最大の差`), v: fmt(gap * Math.max(pi, 1 - pi), 4) }, { k: T('half-life ln 2 / |ln λ₂| (steps)', '半減期 ln 2 / |ln λ₂|（ステップ）'), v: al < 1e-9 ? '0' : al >= 1 ? '∞' : fmt(Math.LN2 / Math.abs(Math.log(al)), 2) }],
        T('The gap to π shrinks by the factor |λ₂| every step, so it halves every ln 2 / |ln λ₂| steps whatever the start.', 'π との差は毎ステップ |λ₂| 倍に縮むので、初期分布によらず ln 2 / |ln λ₂| ステップごとに半分になります。'));
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
      L.h('p', 'lab-cap', left, T('Sample games, fortune against time: from fortune i, each step wins 1 with probability α.', '試行例（時間に対する資産）：資産 i から、各ステップで確率 α で1増えます。'));
      const rand = rng(Math.round(a * 1000) * 131 + i0 * 17 + N);
      const games = [];
      for (let k = 0; k < 24; k++) { let x = i0, path = [[0, x]]; for (let t = 1; t < 4000 && x > 0 && x < N; t++) { x += rand() < a ? 1 : -1; path.push([t, x]); } games.push(path); }
      const TM = Math.max(20, Math.ceil(Math.max(...games.map((g) => g.length)) * 1.08));
      const f = L.fig(left, { x: [0, TM], y: [-0.6, N + 0.6], aspect: 0.62, maxH: 360, xlabel: T('time', '時間'), ticksY: L.ticks(0, N, 5).filter((y) => Number.isInteger(y)).map((y) => [y, String(y)]) });
      f.hline(N, { c: 'c3', dash: false, w: 2 }); f.hline(0, { c: 'c2', dash: false, w: 2 });
      f.text(TM, N, T(`goal N = ${N}`, `目標 N = ${N}`), { anchor: 'end', dx: -4, dy: -5, small: true, c: 'c3' });
      f.text(TM, 0, T('ruin', '破産'), { anchor: 'end', dx: -4, dy: 13, small: true, c: 'c2' });
      L.h('p', 'lab-cap', right, T('Probability of reaching N before 0.', '0より先に N に到達する確率。'));
      const g2 = L.fig(right, { x: [0, N], y: [0, 1], aspect: 0.62, maxH: 360, xlabel: T('initial fortune i', '初期資産 i'), ylabel: 'hᵢ' });
      g2.line(L.sample(0, N, 200, h), { c: 'c1', w: 2.4 });
      for (let x = 0; x <= N; x++) g2.dot(x, h(x), { c: 'c1', r: 3 });
      g2.dot(i0, h(i0), { c: 'hl', r: 6 });
      g2.text(i0, h(i0), `h(${i0}) = ${fmt(h(i0), 3)}`, { dx: 12, dy: 14, anchor: 'start', small: true });
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
