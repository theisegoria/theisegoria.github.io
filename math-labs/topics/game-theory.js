'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/game-theory.cjs) ---------- */
  // 2×2 bimatrix games: A = row player's payoffs, B = column player's; rows Up/Down, columns Left/Right.
  // p = probability that Row plays Up, q = probability that Column plays Left.
  const GAMES = [
    { key: 'pd', A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]], rows: [['Cooperate', '協力'], ['Defect', '裏切り']], cols: [['Cooperate', '協力'], ['Defect', '裏切り']] },
    { key: 'stag', A: [[4, 0], [3, 3]], B: [[4, 3], [0, 3]], rows: [['Stag', '鹿'], ['Hare', '兎']], cols: [['Stag', '鹿'], ['Hare', '兎']] },
    { key: 'bos', A: [[3, 0], [0, 2]], B: [[2, 0], [0, 3]], rows: [['Opera', 'オペラ'], ['Football', 'サッカー']], cols: [['Opera', 'オペラ'], ['Football', 'サッカー']] },
    { key: 'chicken', A: [[0, -1], [1, -10]], B: [[0, 1], [-1, -10]], rows: [['Swerve', 'よける'], ['Straight', '直進']], cols: [['Swerve', 'よける'], ['Straight', '直進']] },
    { key: 'pennies', A: [[1, -1], [-1, 1]], B: [[-1, 1], [1, -1]], rows: [['Heads', '表'], ['Tails', '裏']], cols: [['Heads', '表'], ['Tails', '裏']] },
  ];
  // expected payoffs at mixed strategies (p, q)
  const rowPay = (g, p, q) => p * (q * g.A[0][0] + (1 - q) * g.A[0][1]) + (1 - p) * (q * g.A[1][0] + (1 - q) * g.A[1][1]);
  const colPay = (g, p, q) => q * (p * g.B[0][0] + (1 - p) * g.B[1][0]) + (1 - q) * (p * g.B[0][1] + (1 - p) * g.B[1][1]);
  // advantage of Up over Down for Row given q, and of Left over Right for Column given p
  const rowAdv = (g, q) => q * (g.A[0][0] - g.A[1][0]) + (1 - q) * (g.A[0][1] - g.A[1][1]);
  const colAdv = (g, p) => p * (g.B[0][0] - g.B[0][1]) + (1 - p) * (g.B[1][0] - g.B[1][1]);
  function nash(g) {
    const out = [];
    for (const p of [1, 0]) for (const q of [1, 0]) { const r = p ? 0 : 1, c = q ? 0 : 1; if (g.A[r][c] >= g.A[1 - r][c] && g.B[r][c] >= g.B[r][1 - c]) out.push({ p, q, pure: true }); }
    // mixed: q* makes Row indifferent, p* makes Column indifferent
    const da = g.A[0][0] - g.A[1][0] - g.A[0][1] + g.A[1][1], db = g.B[0][0] - g.B[0][1] - g.B[1][0] + g.B[1][1];
    if (da && db) { const q = -(g.A[0][1] - g.A[1][1]) / da, p = -(g.B[1][0] - g.B[1][1]) / db; if (q > 0 && q < 1 && p > 0 && p < 1) out.push({ p, q, pure: false }); }
    return out;
  }
  // two-population replicator dynamics on the square
  const rep2 = (g, p, q) => [p * (1 - p) * rowAdv(g, q), q * (1 - q) * colAdv(g, p)];

  // generalised rock-paper-scissors: win w, loss −1, draw 0
  const rpsMatrix = (w) => [[0, -1, w], [w, 0, -1], [-1, w, 0]];
  function replicator(A, x) { const f = A.map((r) => r[0] * x[0] + r[1] * x[1] + r[2] * x[2]), fb = x[0] * f[0] + x[1] * f[1] + x[2] * f[2]; return x.map((xi, i) => xi * (f[i] - fb)); }
  function repStep(A, x, h) { const k1 = replicator(A, x), x2 = x.map((v, i) => v + (h / 2) * k1[i]), k2 = replicator(A, x2), x3 = x.map((v, i) => v + (h / 2) * k2[i]), k3 = replicator(A, x3), x4 = x.map((v, i) => v + h * k3[i]), k4 = replicator(A, x4); const y = x.map((v, i) => Math.max(1e-300, v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))); const s = y[0] + y[1] + y[2]; return y.map((v) => v / s); }
  function repOrbit(A, x0, tmax, h = 0.02) { const out = [{ t: 0, x: x0.slice() }]; let x = x0.slice(); for (let t = h; t <= tmax + 1e-9; t += h) { x = repStep(A, x, h); out.push({ t, x }); } return out; }
  // d/dt log(x1 x2 x3) = (w − 1)(1 − 3(x1x2 + x2x3 + x3x1))
  const logVRate = (w, x) => (w - 1) * (1 - 3 * (x[0] * x[1] + x[1] * x[2] + x[2] * x[0]));
  // eigenvalues of the linearisation at the centre: (1 − w)/6 ± i (w + 1)/(2√3)
  const centreEig = (w) => ({ re: (1 - w) / 6, im: (w + 1) / (2 * Math.sqrt(3)) });

  // zero-sum 2×m games: Row picks p = P(row 1); column j pays p a1j + (1 − p) a2j to Row
  const ZS = [
    { key: 'penalty', M: [[0.58, 0.83, 0.95], [0.93, 0.80, 0.60]], rows: [['Kick left', '左へ蹴る'], ['Kick right', '右へ蹴る']], cols: [['Dive left', '左へ跳ぶ'], ['Stay', '動かない'], ['Dive right', '右へ跳ぶ']] },
    { key: 'four', M: [[3, -1, 2, 0], [-2, 4, -1, 1.5]], rows: [['Row 1', '行 1'], ['Row 2', '行 2']], cols: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']] },
    { key: 'saddle', M: [[4, 2, 5], [3, 1, 2]], rows: [['Row 1', '行 1'], ['Row 2', '行 2']], cols: [['A', 'A'], ['B', 'B'], ['C', 'C']] },
  ];
  const lineVal = (M, j, p) => p * M[0][j] + (1 - p) * M[1][j];
  const envelope = (M, p) => Math.min(...M[0].map((_, j) => lineVal(M, j, p)));
  function solveZS(M) {
    const m = M[0].length, cand = [0, 1];
    for (let j = 0; j < m; j++) for (let k = j + 1; k < m; k++) { const sj = M[0][j] - M[1][j], sk = M[0][k] - M[1][k]; if (sj !== sk) { const p = (M[1][k] - M[1][j]) / (sj - sk); if (p > 0 && p < 1) cand.push(p); } }
    let best = { p: 0, v: -Infinity }; for (const p of cand) { const v = envelope(M, p); if (v > best.v + 1e-12) best = { p, v }; }
    // the column player's optimal mix: lines active at p*, weighted so that the mixture is flat (or a pure column at an endpoint)
    const act = M[0].map((_, j) => j).filter((j) => Math.abs(lineVal(M, j, best.p) - best.v) < 1e-9), y = new Array(m).fill(0);
    const slope = (j) => M[0][j] - M[1][j];
    const pos = act.filter((j) => slope(j) >= 0), neg = act.filter((j) => slope(j) <= 0);
    if (best.p > 0 && best.p < 1 && pos.length && neg.length) { const j = neg[0], k = pos.find((x) => x !== j) ?? pos[0]; if (j === k) y[j] = 1; else { const sj = slope(j), sk = slope(k); y[j] = sk / (sk - sj); y[k] = -sj / (sk - sj); } }
    else { const want = best.p === 1 ? pos : best.p === 0 ? neg : act; y[(want.length ? want : act)[0]] = 1; }
    return { p: best.p, v: best.v, y };
  }
  const colMixPay = (M, y, p) => y.reduce((s, yj, j) => s + yj * lineVal(M, j, p), 0);

  (window.LabModels = window.LabModels || {})['game-theory'] = { GAMES, rowPay, colPay, rowAdv, colAdv, nash, rep2, rpsMatrix, replicator, repStep, repOrbit, logVRate, centreEig, ZS, lineVal, envelope, solveZS, colMixPay };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const NAMES = [['Prisoner’s dilemma', '囚人のジレンマ'], ['Stag hunt', '鹿狩り'], ['Battle of the sexes', '男女の争い'], ['Chicken', 'チキンゲーム'], ['Matching pennies', 'コイン合わせ']];
  const fr = (x) => { for (const d of [1, 2, 3, 4, 5, 6, 8, 10, 11, 12]) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? String(n) : `${n}/${d}`; } return fmt(x, 3); };

  /* ---------- 1. 2×2 games and Nash equilibria ---------- */
  D['nash-2x2'] = {
    render(ctx, v) {
      const g = GAMES[v.game], ne = nash(g), p = v.p, q = v.q;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The payoff table: Row’s payoff first, Column’s second. Arrows point to the better reply for the player who can switch; a cell no arrow leaves is a pure Nash equilibrium (gold).', '利得表：先が行プレイヤー、後が列プレイヤーの利得です。矢印は、手を変えられるプレイヤーにとってより良い応答の方を指します。どの矢印も出ていないマスが純粋戦略ナッシュ均衡（金）です。'));
      const s = L.stage(c1, { w: 100, h: 86, maxH: 360 });
      const X0 = 26, Y0 = 8, W = 34, H = 30, cx = (c) => X0 + W * c + W / 2, cy = (r) => Y0 + H * (1 - r) + H / 2;
      const isNE = (r, c) => ne.some((e) => e.pure && e.p === (r ? 0 : 1) && e.q === (c ? 0 : 1));
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const x = X0 + W * c, y = Y0 + H * (1 - r);
        s.rect(x, y, W, H, { c: isNE(r, c) ? 'hl' : 'ink', fill: isNE(r, c) ? 'hl' : 'plate', fo: isNE(r, c) ? 0.28 : 0.6, w: isNE(r, c) ? 2.6 : 1.2 });
        s.text(cx(c) - 6, cy(r) + 1, String(g.A[r][c]), { c: 'c1', dy: 6 }); s.text(cx(c), cy(r) + 1, ',', { c: 'muted', dy: 6 }); s.text(cx(c) + 6, cy(r) + 1, String(g.B[r][c]), { c: 'c2', dy: 6 });
      }
      for (let r = 0; r < 2; r++) s.text(X0 - 2, cy(r), T(...g.rows[r]), { small: true, c: 'c1', anchor: 'end', dy: 4 });
      for (let c = 0; c < 2; c++) s.text(cx(c), Y0 + 2 * H + 4, T(...g.cols[c]), { small: true, c: 'c2' });
      s.text(X0 - 2, Y0 + 2 * H + 4, T('Row \\ Column', '行 \\ 列'), { small: true, c: 'muted', anchor: 'end' });
      // deviation arrows: Row compares vertically within a column, Column horizontally within a row
      for (let c = 0; c < 2; c++) { const d = g.A[0][c] - g.A[1][c]; if (d) { const from = d > 0 ? 1 : 0, to = 1 - from, sg = Math.sign(cy(to) - cy(from)); s.arrow([cx(c) + 13, cy(from) + 8 * sg], [cx(c) + 13, cy(to) - 8 * sg], { c: 'c1', w: 2 }); } }
      for (let r = 0; r < 2; r++) { const d = g.B[r][0] - g.B[r][1]; if (d) { const from = d > 0 ? 1 : 0, to = 1 - from, sg = Math.sign(cx(to) - cx(from)); s.arrow([cx(from) + 9 * sg, cy(r) - 9], [cx(to) - 9 * sg, cy(r) - 9], { c: 'c2', w: 2 }); } }
      // strategy square
      L.h('p', 'lab-cap', c2, T('Mixed strategies: q = probability Column plays the first column (across), p = probability Row plays the first row (up). Blue is Row’s best reply to q, orange is Column’s best reply to p; Nash equilibria are where they cross. The streamlines are both players drifting towards better replies. Drag the white point.', '混合戦略：q は列プレイヤーが第 1 列を選ぶ確率（横）、p は行プレイヤーが第 1 行を選ぶ確率（縦）です。青は q に対する行の最適応答、オレンジは p に対する列の最適応答で、ナッシュ均衡はそれらの交点です。流線は両プレイヤーがより良い応答へ流れていく様子です。白い点をドラッグしてください。'));
      const f = L.fig(c2, { x: [0, 1], y: [0, 1], equal: true, xlabel: 'q', ylabel: 'p', maxH: 400 });
      const seeds = []; for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) seeds.push([i / 6, j / 6]);
      f.stream((x, y) => { const d = rep2(g, y, x); return [d[1], d[0]]; }, seeds, { both: true, c: 'muted', w: 1.1, op: 0.6, steps: 120, h: 0.012 });
      // best-reply correspondences
      const qs = (() => { const da = g.A[0][0] - g.A[1][0] - g.A[0][1] + g.A[1][1]; return da ? -(g.A[0][1] - g.A[1][1]) / da : null; })();
      const ps = (() => { const db = g.B[0][0] - g.B[0][1] - g.B[1][0] + g.B[1][1]; return db ? -(g.B[1][0] - g.B[1][1]) / db : null; })();
      const br1 = []; { const pts = L.seq(201, (i) => i / 200); let prev = null; pts.forEach((x) => { const a = rowAdv(g, x), y = a > 1e-12 ? 1 : a < -1e-12 ? 0 : 0.5; if (prev !== null && y !== prev && qs !== null) br1.push([qs, prev], [qs, y]); br1.push([x, y]); prev = y; }); }
      const br2 = []; { const pts = L.seq(201, (i) => i / 200); let prev = null; pts.forEach((y) => { const a = colAdv(g, y), x = a > 1e-12 ? 1 : a < -1e-12 ? 0 : 0.5; if (prev !== null && x !== prev && ps !== null) br2.push([prev, ps], [x, ps]); br2.push([x, y]); prev = x; }); }
      f.line(br1, { c: 'c1', w: 3.4, op: 0.85 }); f.line(br2, { c: 'c2', w: 3.4, op: 0.85, dash: '9 5' });
      ne.forEach((e) => { f.dot(e.q, e.p, { c: 'hl', r: 8 }); });
      f.handle(q, p, { c: 'ink', r: 7, label: T('Mixed strategy (q, p)', '混合戦略 (q, p)'), bounds: [0, 1, 0, 1], onDrag: (x, y) => { ctx.set('q', Math.round(x * 100) / 100, true); ctx.set('p', Math.round(y * 100) / 100); } });
      const d = rep2(g, p, q), len = Math.hypot(d[0], d[1]);
      if (len > 1e-6) f.arrow([q, p], [q + (0.16 * d[1]) / len, p + (0.16 * d[0]) / len], { c: 'ink', w: 2 });
      L.legend(ctx.host, [{ c: 'c1', label: T('Row’s best reply p(q)', '行の最適応答 p(q)') }, { c: 'c2', dash: true, label: T('Column’s best reply q(p)', '列の最適応答 q(p)') }, { c: 'hl', kind: 'dot', label: T('Nash equilibria', 'ナッシュ均衡') }, { c: 'muted', label: T('drift towards better replies', 'より良い応答への流れ') }]);
      const neStr = ne.map((e) => (e.pure ? `(${T(...g.rows[e.p ? 0 : 1])}, ${T(...g.cols[e.q ? 0 : 1])})` : `p = ${fr(e.p)}, q = ${fr(e.q)}`)).join('; ');
      ctx.readout([
        { k: T('game', 'ゲーム'), v: T(...NAMES[v.game]), tone: 'key' },
        { k: '(q, p)', v: `(${fmt(q, 2)}, ${fmt(p, 2)})` },
        { k: T('Row expects', '行の期待利得'), v: fmt(rowPay(g, p, q), 3) },
        { k: T('Column expects', '列の期待利得'), v: fmt(colPay(g, p, q), 3) },
        { k: T('Nash equilibria', 'ナッシュ均衡'), v: neStr, tone: 'good' },
      ], [
        T('Defecting is better for each player whatever the other does, so (Defect, Defect) is the only equilibrium, though both would get 3 instead of 1 by cooperating. Equilibrium is about no one wanting to switch alone, not about the best joint outcome.', '相手が何をしても各プレイヤーにとって裏切る方が良いので、均衡は (裏切り, 裏切り) だけです。協力すれば二人とも 1 ではなく 3 を得られるのにです。均衡とは一人だけ変えたい人がいないことであり、全体として最良の結果のことではありません。'),
        T('Two pure equilibria: both hunt stag (better for both) or both hunt hare (safe). The mixed equilibrium at p = q = 3/4 is the knife edge between their basins: start above and right of it and the drift carries you to the stag equilibrium.', '純粋均衡は二つです。二人とも鹿を狩る（両者にとってより良い）か、二人とも兎を狩る（安全）かです。p = q = 3/4 の混合均衡は二つの流域の境目で、その右上から始めると流れは鹿の均衡へ運んでくれます。'),
        T('Both prefer to be together but disagree on where. Two pure equilibria, and a mixed one at p = 3/5, q = 2/5 where each player randomises so as to make the other indifferent, which gives both less than either pure outcome.', '二人とも一緒にいたいのですが、場所で意見が分かれます。純粋均衡は二つあり、混合均衡は p = 3/5、q = 2/5 です。そこでは各プレイヤーが相手を無差別にするように確率を混ぜ、どちらの純粋な結果よりも二人とも少ない利得になります。'),
        T('Each wants the other to swerve. The pure equilibria are the two asymmetric outcomes, and the mixed one has each going straight only one time in ten, because a crash costs ten times what swerving does.', 'どちらも相手によけてほしいのです。純粋均衡は二つの非対称な結果で、混合均衡では各プレイヤーは十回に一回だけ直進します。衝突の損失はよけた損失の十倍だからです。'),
        T('No pure equilibrium at all: every cell has an arrow leaving it, and the drift circles the centre. The only equilibrium is for both to randomise 50:50, which is Nash’s theorem at work: every finite game has at least one equilibrium in mixed strategies.', '純粋均衡はまったくありません。どのマスからも矢印が出ていて、流れは中心のまわりを回ります。唯一の均衡は二人とも 50:50 で混ぜることで、これがナッシュの定理です。有限のゲームには混合戦略で少なくとも一つの均衡があります。'),
      ][v.game]);
    },
  };

  /* ---------- 2. replicator dynamics on the simplex ---------- */
  const S3 = Math.sqrt(3) / 2;
  const toXY = (x) => [x[1] + x[2] / 2, x[2] * S3]; // vertices: R = (0,0), P = (1,0), S = (1/2, √3/2)
  const fromXY = (u, v) => { const x3 = v / S3, x2 = u - x3 / 2, x1 = 1 - x2 - x3; return [x1, x2, x3]; };
  D['replicator'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const w = v.w, A = rpsMatrix(w), sxs = Math.min(0.97, v.xp + v.xs), x0 = [1 - sxs, v.xp * sxs / Math.max(1e-9, v.xp + v.xs), v.xs * sxs / Math.max(1e-9, v.xp + v.xs)], ok0 = x0.every((c) => c > 0.005);
      const start = ok0 ? x0 : [0.6, 0.3, 0.1], TM = 60, orb = repOrbit(A, start, TM, 0.03);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The population shares of rock, paper and scissors as a point in a triangle; each corner is a population playing one strategy. Streamlines show the replicator dynamics. Drag the starting point.', 'グー、パー、チョキの人口の割合を三角形の中の一点で表します。各頂点は一つの戦略だけをとる集団です。流線はレプリケーター動学を示します。出発点をドラッグしてください。'));
      const f = L.fig(c1, { x: [-0.08, 1.08], y: [-0.1, S3 + 0.08], equal: true, axes: false, grid: false, maxH: 420 });
      const plc = L.colours().plate;
      f.raster((u, vv) => { const x = fromXY(u, vv); if (x.some((c) => c < 0)) return plc; const V = x[0] * x[1] * x[2] * 27; return 0.45 * V; }, { cmap: 'seq', res: 3 });
      f.poly([[0, 0], [1, 0], [0.5, S3]], { c: 'ink', w: 2, fo: 0 });
      const seeds = []; for (let i = 1; i < 8; i++) for (let j = 1; j < 8 - i; j++) { const a = i / 8, b = j / 8, cc = 1 - a - b; if (cc > 0.04) seeds.push(toXY([a, b, cc])); }
      f.stream((u, vv) => { const x = fromXY(u, vv); if (x.some((c) => c < -1e-9)) return [0, 0]; const d = replicator(A, x); return [d[1] + d[2] / 2, d[2] * S3]; }, seeds, { c: 'muted', w: 1, op: 0.55, both: false, steps: 170, h: 0.012, stop: (q) => fromXY(q[0], q[1]).some((c) => c < 0.002) });
      [['R', [0, 0], 'end', -8, 14], ['P', [1, 0], 'start', 8, 14], ['S', [0.5, S3], 'middle', 0, -10]].forEach(([nm, pt, an, dx, dy]) => f.text(pt[0], pt[1], T({ R: 'rock', P: 'paper', S: 'scissors' }[nm], { R: 'グー', P: 'パー', S: 'チョキ' }[nm]), { small: true, c: 'ink', anchor: an, dx, dy }));
      f.dot(0.5, S3 / 3, { c: 'c2', r: 5 });
      const G = f.group('main');
      f.handle(...toXY(start), { c: 'hl', r: 7, label: T('Starting mix', '出発点の割合'), bounds: [0, 1, 0, S3], onDrag: (u, vv) => { const x = fromXY(u, vv); if (x.every((c) => c > 0.01)) { ctx.set('xp', Math.round(x[1] * 100) / 100, true); ctx.set('xs', Math.round(x[2] * 100) / 100); } } });
      // shares over time and the Lyapunov quantity
      L.h('p', 'lab-cap', c2, T('The three shares against time, and the product x_R x_P x_S (gold), which grows, stays constant or shrinks according to whether a win is worth more than, exactly, or less than a loss costs.', '時間に対する三つの割合と積 x_R x_P x_S（金）です。勝ちの価値が負けの損失より大きいか、等しいか、小さいかで、この積は増えるか、一定か、減ります。'));
      const g = L.fig(c2, { x: [0, TM], y: [0, 1], aspect: 0.62, xlabel: T('time', '時間'), ylabel: T('share', '割合'), maxH: 300 });
      ['c1', 'c2', 'c3'].forEach((c, i) => g.line(orb.map((o) => [o.t, o.x[i]]), { c, w: 2 }));
      g.line(orb.map((o) => [o.t, 27 * o.x[0] * o.x[1] * o.x[2]]), { c: 'hl', w: 2.4, dash: '6 3' });
      const cur = g.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T('rock', 'グー') }, { c: 'c2', label: T('paper', 'パー') }, { c: 'c3', label: T('scissors', 'チョキ') }, { c: 'hl', dash: true, label: T('27 x_R x_P x_S', '27 x_R x_P x_S') }, { c: 'c1', kind: 'fill', label: T('level sets of the product (shading)', '積の等高線（陰影）') }]);
      const ev = centreEig(w);
      ctx.readout([
        { k: T('win payoff w', '勝ちの利得 w'), v: fmt(w, 2), tone: 'key' },
        { k: T('eigenvalues at the centre', '中心での固有値'), v: `${fmt(ev.re, 3)} ± ${fmt(ev.im, 3)}i` },
        { k: T('centre is', '中心は'), v: w > 1 ? T('stable spiral', '安定な渦状点') : w < 1 ? T('unstable spiral', '不安定な渦状点') : T('a neutral centre', '中立な中心'), tone: w > 1 ? 'good' : w < 1 ? 'warn' : undefined },
        { k: T('rotation period near the centre', '中心付近の回転周期'), v: fmt((2 * Math.PI) / ev.im, 3) },
      ], w > 1
        ? T('A win is worth more than a loss costs, so mixed populations do better on average: every orbit spirals in to one third each, and the product of the shares is a Lyapunov function that only grows.', '勝ちの価値が負けの損失より大きいので、混ざった集団の方が平均的に得をします。どの軌道も三分の一ずつの点へ渦を巻いて入り、割合の積は増えるだけのリャプノフ関数です。')
        : w < 1 ? T('A loss costs more than a win gains, so the orbits spiral outwards and spend ever longer near the corners: the population cycles rock → paper → scissors with booms and crashes that grow without limit, approaching the heteroclinic cycle on the boundary.', '負けの損失が勝ちの利得より大きいので、軌道は外へ渦を巻き、頂点の近くにますます長くとどまります。集団はグー → パー → チョキと循環し、好況と崩壊は限りなく大きくなり、境界上のヘテロクリニック・サイクルに近づきます。')
          : T('With w = 1 the game is zero-sum and the product x_R x_P x_S is conserved exactly: every orbit is a closed loop, a level set of the shading, and the population cycles for ever without settling.', 'w = 1 ではゲームはゼロ和で、積 x_R x_P x_S は厳密に保存されます。どの軌道も陰影の等高線である閉じた輪で、集団は落ち着かずに永遠に循環します。'));
      const draw = (t) => { while (G.firstChild) G.removeChild(G.firstChild); while (cur.firstChild) cur.removeChild(cur.firstChild); const k = Math.min(orb.length - 1, Math.round(t / 0.03)); G.appendChild(f.line(orb.slice(0, k + 1).map((o) => toXY(o.x)), { c: 'hl', w: 2.4 })); const pt = toXY(orb[k].x); G.appendChild(f.dot(pt[0], pt[1], { c: 'ink', r: 4.5, layer: 'main' })); cur.appendChild(g.vline(orb[k].t, { c: 'ink', w: 1, dash: '3 3', layer: 'over' })); };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const tt = Math.min(TM, t * 6); draw(tt); lb.textContent = `t = ${fmt(tt, 3)}`; return tt < TM; }, { autoplay: false, once: true, initialT: 1e4, playLabel: T('Play: evolve the population', '再生：集団を進化させる') });
    },
  };

  /* ---------- 3. zero-sum games and the minimax theorem ---------- */
  const ZNAMES = [['Penalty kick (illustrative scoring probabilities)', 'PK（得点確率は例示）'], ['A 2 × 4 game', '2 × 4 のゲーム'], ['A game with a saddle point', '鞍点のあるゲーム']];
  D['minimax-lp'] = {
    render(ctx, v) {
      const G = ZS[v.game], M = G.M, m = M[0].length, sol = solveZS(M), p = v.p;
      const lo = Math.min(...M.flat()), hi = Math.max(...M.flat()), pad = 0.12 * (hi - lo);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Row plays ${T(...G.rows[0])} with probability p. Each line is what Row expects against one pure column; Column will pick the lowest, so Row is guaranteed the lower envelope (shaded). Drag p to the top of the envelope.`, `行プレイヤーは確率 p で「${T(...G.rows[0])}」を選びます。各直線は、列の一つの純粋戦略に対する行の期待利得です。列は最も低いものを選ぶので、行に保証されるのは下側の包絡線（陰影）です。p を包絡線の頂上までドラッグしてください。`));
      const f = L.fig(c1, { x: [0, 1], y: [lo - pad, hi + pad], aspect: 0.8, xlabel: 'p', ylabel: T('Row’s expected payoff', '行の期待利得'), maxH: 400 });
      const ps = L.seq(201, (i) => i / 200);
      f.area(ps.map((x) => [x, envelope(M, x)]), { c: 'c1', fill: 'c1', fo: 0.14, base: lo - pad, w: 0 });
      const TOK = ['c2', 'c3', 'c4', 'muted'];
      for (let j = 0; j < m; j++) { f.line([[0, M[1][j]], [1, M[0][j]]], { c: TOK[j], w: 2, op: 0.9 }); f.text(1, M[0][j], T(...G.cols[j]), { small: true, c: TOK[j], anchor: 'end', dx: -4, dy: -6 }); }
      f.line(ps.map((x) => [x, envelope(M, x)]), { c: 'c1', w: 3.2 });
      f.hline(sol.v, { c: 'hl', w: 1.2, dash: '5 4', layer: 'under' }); f.dot(sol.p, sol.v, { c: 'hl', r: 6 });
      f.text(sol.p, sol.v, `v = ${fmt(sol.v, 4)}`, { small: true, c: 'hl', anchor: sol.p > 0.6 ? 'end' : 'start', dx: sol.p > 0.6 ? -10 : 10, dy: 18 });
      f.handle(p, envelope(M, p), { c: 'ink', r: 7, axis: 'x', label: 'p', bounds: [0, 1, lo - pad, hi + pad], onDrag: (x) => ctx.set('p', Math.round(clamp(x, 0, 1) * 1000) / 1000) });
      // the column player's side
      L.h('p', 'lab-cap', c2, T('Column’s optimal mix, from the dual linear program. Mixed this way, every p gives Row the same payoff v or less (gold line): Column caps Row at exactly what Row can guarantee.', '双対な線形計画から得た列の最適な混合です。このように混ぜると、どの p でも行の利得は v 以下（金の線）になります。列は行をちょうど行が保証できる値に抑えます。'));
      const b = L.fig(c2, { x: [-0.6, m - 0.4], y: [0, 1.08], aspect: 0.5, ylabel: T('probability', '確率'), maxH: 200, ticksX: L.seq(m, (j) => [j, T(...G.cols[j])]), ticksY: [[0, '0'], [0.5, '½'], [1, '1']] });
      sol.y.forEach((y, j) => { b.rect(j - 0.3, 0, 0.6, y, { c: TOK[j], fill: TOK[j], fo: 0.7, w: 1 }); if (y > 0) b.text(j, y, fmt(y, 3), { small: true, c: 'ink', dy: -6 }); });
      const g2 = L.fig(c2, { x: [0, 1], y: [lo - pad, hi + pad], aspect: 0.42, xlabel: 'p', ylabel: T('payoff vs Column’s mix', '列の混合への利得'), maxH: 190 });
      g2.line([[0, colMixPay(M, sol.y, 0)], [1, colMixPay(M, sol.y, 1)]], { c: 'hl', w: 2.6 }); g2.hline(sol.v, { c: 'hl', w: 1, dash: '5 4', layer: 'under' });
      g2.line(ps.map((x) => [x, envelope(M, x)]), { c: 'c1', w: 1.6, dash: '4 3' });
      L.legend(ctx.host, [{ c: 'c1', label: T('lower envelope: Row’s guarantee', '下側の包絡線：行の保証') }, { c: 'hl', label: T('value v and Column’s optimal mix', '値 v と列の最適な混合') }]);
      const minc = (() => { let k = 0; for (let j = 1; j < m; j++) if (lineVal(M, j, p) < lineVal(M, k, p)) k = j; return k; })();
      ctx.readout([
        { k: T('game', 'ゲーム'), v: T(...ZNAMES[v.game]), tone: 'key' },
        { k: 'p', v: fmt(p, 3) },
        { k: T('Row’s guarantee at p', 'p での行の保証'), v: fmt(envelope(M, p), 4) },
        { k: T('Column’s best reply', '列の最適応答'), v: T(...G.cols[minc]) },
        { k: T('optimal p*', '最適な p*'), v: fmt(sol.p, 4), tone: 'good' },
        { k: T('value v', '値 v'), v: fmt(sol.v, 4), tone: 'good' },
      ], v.game === 2
        ? T(`The envelope peaks at an end: ${T(...G.rows[0])} beats ${T(...G.rows[1])} against every column, and Column’s best answer is the pure column ${T(...G.cols[1])}. The value is a saddle point of the table, the smallest entry in its row and the largest in its column, so neither player needs to randomise.`, `包絡線は端で最大になります。「${T(...G.rows[0])}」はどの列に対しても「${T(...G.rows[1])}」に勝ち、列の最良の答えは純粋戦略「${T(...G.cols[1])}」です。値は表の鞍点で、その行で最小、その列で最大の要素なので、どちらのプレイヤーも確率を混ぜる必要がありません。`)
        : T(`The top of the envelope is where two lines cross, so Row’s best p* = ${fmt(sol.p, 4)} leaves Column indifferent between them. Von Neumann’s minimax theorem says max over p of min over columns equals min over Column’s mixes of max over p; here both equal ${fmt(sol.v, 4)}, and the two sides are a pair of dual linear programs.`, `包絡線の頂上は二本の直線が交わる所で、行の最良の p* = ${fmt(sol.p, 4)} は列にとってその二つを無差別にします。フォン・ノイマンのミニマックス定理によれば、p についての列についての最小の最大は、列の混合についての p についての最大の最小に等しく、ここではどちらも ${fmt(sol.v, 4)} です。両者は互いに双対な一組の線形計画です。`));
    },
  };
})();
