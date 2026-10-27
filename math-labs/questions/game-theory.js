'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const PI = Math.PI;

  // classic games, same order and payoffs as the experiment
  const GAMES = [
    { A: [[3, 0], [5, 1]], B: [[3, 5], [0, 1]], name: ['the prisoner’s dilemma', '囚人のジレンマ'], rows: [['Cooperate', '協力'], ['Defect', '裏切り']] },
    { A: [[4, 0], [3, 3]], B: [[4, 3], [0, 3]], name: ['the stag hunt', '鹿狩り'], rows: [['Stag', '鹿'], ['Hare', '兎']] },
    { A: [[3, 0], [0, 2]], B: [[2, 0], [0, 3]], name: ['the battle of the sexes', '男女の争い'], rows: [['Opera', 'オペラ'], ['Football', 'サッカー']] },
    { A: [[0, -1], [1, -10]], B: [[0, 1], [-1, -10]], name: ['chicken', 'チキンゲーム'], rows: [['Swerve', 'よける'], ['Straight', '直進']] },
    { A: [[1, -1], [-1, 1]], B: [[-1, 1], [1, -1]], name: ['matching pennies', 'コイン合わせ'], rows: [['Heads', '表'], ['Tails', '裏']] },
  ];
  const bim = (A, B, rl = ['U', 'D'], cl = ['L', 'R']) => `\\begin{array}{c|cc} & \\text{${cl[0]}} & \\text{${cl[1]}} \\\\ \\hline \\text{${rl[0]}} & ${A[0][0]},\\,${B[0][0]} & ${A[0][1]},\\,${B[0][1]} \\\\ \\text{${rl[1]}} & ${A[1][0]},\\,${B[1][0]} & ${A[1][1]},\\,${B[1][1]} \\end{array}`;
  const isPureNE = (g, r, c) => g.A[r][c] >= g.A[1 - r][c] && g.B[r][c] >= g.B[r][1 - c];
  const pureNE = (g) => { const out = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (isPureNE(g, r, c)) out.push([r, c]); return out; };
  // p = P(row U), q = P(column L); returns null unless strictly interior
  function mixedNE(g) {
    const da = g.A[0][0] - g.A[0][1] - g.A[1][0] + g.A[1][1], db = g.B[0][0] - g.B[1][0] - g.B[0][1] + g.B[1][1];
    if (!da || !db) return null;
    const qn = g.A[1][1] - g.A[0][1], pn = g.B[1][1] - g.B[1][0], q = qn / da, p = pn / db;
    return p > 0 && p < 1 && q > 0 && q < 1 ? { p, q, pf: frac(pn, db), qf: frac(qn, da) } : null;
  }
  const rowPay = (g, p, q) => p * (q * g.A[0][0] + (1 - q) * g.A[0][1]) + (1 - p) * (q * g.A[1][0] + (1 - q) * g.A[1][1]);
  function genericGame(r, want) {
    for (;;) {
      const A = [[r.int(0, 5), r.int(0, 5)], [r.int(0, 5), r.int(0, 5)]], B = [[r.int(0, 5), r.int(0, 5)], [r.int(0, 5), r.int(0, 5)]];
      if (A[0][0] === A[1][0] || A[0][1] === A[1][1] || B[0][0] === B[0][1] || B[1][0] === B[1][1]) continue;
      const g = { A, B };
      if (!want || want(g)) return g;
    }
  }
  const cellName = (r, c) => `(${r ? 'D' : 'U'}, ${c ? 'R' : 'L'})`;

  /* ---------- 1. Nash equilibria of 2×2 games ---------- */
  Q['nash-2x2'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = genericGame(r), ne = pureNE(g);
        return {
          q: [`Row picks U or D, Column picks L or R; payoffs are (Row, Column): $${bim(g.A, g.B)}$. How many pure-strategy Nash equilibria are there?`, `行は U か D、列は L か R を選びます。利得は（行, 列）の順です：$${bim(g.A, g.B)}$。純粋戦略のナッシュ均衡はいくつありますか。`],
          a: { type: 'int', v: ne.length },
          hint: ['In each cell ask: could Row gain by switching rows? Could Column gain by switching columns? An equilibrium cell answers no to both.', '各マスで、行が行を変えて得をするか、列が列を変えて得をするかを調べます。どちらも「いいえ」のマスが均衡です。'],
          sol: [[`Row's best replies: against L, ${g.A[0][0] > g.A[1][0] ? 'U' : 'D'} ($${Math.max(g.A[0][0], g.A[1][0])}$ vs $${Math.min(g.A[0][0], g.A[1][0])}$); against R, ${g.A[0][1] > g.A[1][1] ? 'U' : 'D'}. Column's: against U, ${g.B[0][0] > g.B[0][1] ? 'L' : 'R'}; against D, ${g.B[1][0] > g.B[1][1] ? 'L' : 'R'}.`, `行の最適応答は、L に対して ${g.A[0][0] > g.A[1][0] ? 'U' : 'D'}（$${Math.max(g.A[0][0], g.A[1][0])}$ 対 $${Math.min(g.A[0][0], g.A[1][0])}$）、R に対して ${g.A[0][1] > g.A[1][1] ? 'U' : 'D'} です。列の最適応答は、U に対して ${g.B[0][0] > g.B[0][1] ? 'L' : 'R'}、D に対して ${g.B[1][0] > g.B[1][1] ? 'L' : 'R'} です。`], [ne.length ? `The cells that are best replies for both: ${ne.map(([a, b]) => cellName(a, b)).join(', ')}, so ${ne.length}.` : 'No cell is a best reply for both players, so there are none: the deviation arrows chase each other round the table.', ne.length ? `両者にとって最適応答であるマスは ${ne.map(([a, b]) => cellName(a, b)).join('、')} なので、${ne.length} 個です。` : '両者にとって最適応答であるマスはないので 0 個です。逸脱の矢印が表をぐるぐる回ります。'], [ne.length === 1 ? 'With one pure equilibrium a generic 2×2 game has no other: the total count is odd.' : ne.length === 2 ? 'With two pure equilibria there is also a mixed one between them, so three in all.' : 'Nash’s theorem still guarantees an equilibrium, in mixed strategies.', ne.length === 1 ? '純粋均衡が一つなら、一般的な 2×2 ゲームに他の均衡はありません。均衡の総数は奇数です。' : ne.length === 2 ? '純粋均衡が二つあれば、その間に混合均衡も一つあり、全部で三つです。' : 'それでもナッシュの定理により、混合戦略の均衡は存在します。']],
        };
      }
      if (form === 1) {
        const k = r.int(0, 4), g = GAMES[k], rr = r.int(0, 1), cc = r.int(0, 1), yes = isPureNE(g, rr, cc);
        const rn = g.rows[rr], cn = g.rows[cc];
        return {
          q: [`In ${g.name[0]} (choose it in the figure), is (${rn[0]}, ${cn[0]}) a Nash equilibrium?`, `${g.name[1]}（図で選べます）で、（${rn[1]}, ${cn[1]}）はナッシュ均衡ですか。`],
          a: { type: 'choice', opts: [['Yes: neither player gains by switching alone.', 'はい。どちらも一人で変えて得をしません。'], ['No: at least one player gains by switching alone.', 'いいえ。少なくとも一人は一人で変えて得をします。']], v: yes ? 0 : 1, fixed: true },
          hint: ['Find the cell in the table and look for a deviation arrow leaving it.', '表でそのマスを見つけ、そこから出る逸脱の矢印を探します。'],
          sol: [[`Payoffs there: Row $${g.A[rr][cc]}$, Column $${g.B[rr][cc]}$. Row switching gives $${g.A[1 - rr][cc]}$; Column switching gives $${g.B[rr][1 - cc]}$.`, `そこでの利得は行 $${g.A[rr][cc]}$、列 $${g.B[rr][cc]}$ です。行が変えると $${g.A[1 - rr][cc]}$、列が変えると $${g.B[rr][1 - cc]}$ になります。`], [yes ? 'Neither switch is profitable, so the cell is an equilibrium.' : `${g.A[1 - rr][cc] > g.A[rr][cc] ? 'Row' : 'Column'} would switch, so it is not an equilibrium.`, yes ? 'どちらも変えて得をしないので、このマスは均衡です。' : `${g.A[1 - rr][cc] > g.A[rr][cc] ? '行' : '列'}が変えたがるので、均衡ではありません。`]],
          set: { game: k },
        };
      }
      const k = r.int(0, 4), g = GAMES[k], p = r.step(0.1, 0.9, 0.1), q = r.step(0.1, 0.9, 0.1), v = rowPay(g, p, q);
      return {
        q: [`In ${g.name[0]}, Row plays ${g.rows[0][0]} with probability $p = ${n(p)}$ and Column plays ${g.rows[0][0]} with probability $q = ${n(q)}$. What is Row's expected payoff?`, `${g.name[1]}で、行は確率 $p = ${n(p)}$ で「${g.rows[0][1]}」、列は確率 $q = ${n(q)}$ で「${g.rows[0][1]}」を選びます。行の期待利得はいくつですか。`],
        a: { type: 'num', v, tol: 1e-6 },
        hint: ['Weight each of Row’s four payoffs by the probability of its cell, $p q$, $p(1 - q)$, and so on.', '行の四つの利得に、そのマスの確率 $p q$、$p(1 - q)$ などで重みをつけます。'],
        sol: [[`Row's payoffs are $${g.A[0][0]}, ${g.A[0][1]}, ${g.A[1][0]}, ${g.A[1][1]}$ with probabilities $${n(p * q)}, ${n(p * (1 - q))}, ${n((1 - p) * q)}, ${n((1 - p) * (1 - q))}$.`, `行の利得 $${g.A[0][0]}, ${g.A[0][1]}, ${g.A[1][0]}, ${g.A[1][1]}$ の確率はそれぞれ $${n(p * q)}, ${n(p * (1 - q))}, ${n((1 - p) * q)}, ${n((1 - p) * (1 - q))}$ です。`], [`The expectation is $${n(v)}$, the readout's value when the white point is at $(q, p) = (${n(q)}, ${n(p)})$.`, `期待値は $${n(v)}$ で、白い点を $(q, p) = (${n(q)}, ${n(p)})$ に置いたときの読み取り値です。`]],
        set: { game: k, p, q },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = genericGame(r, (h) => mixedNE(h) !== null), m = mixedNE(g);
        return {
          q: [`Payoffs (Row, Column): $${bim(g.A, g.B)}$. Find the mixed Nash equilibrium, with $p$ = P(Row plays U) and $q$ = P(Column plays L).`, `利得（行, 列）は $${bim(g.A, g.B)}$ です。混合ナッシュ均衡を求めてください。$p$ は行が U を選ぶ確率、$q$ は列が L を選ぶ確率です。`],
          a: { type: 'tuple', v: [m.p, m.q], labels: ['$p$', '$q$'], tol: 1e-4 },
          hint: ['Each player mixes so as to make the other indifferent: $q$ comes from Row’s payoffs, $p$ from Column’s.', '各プレイヤーは相手を無差別にするように混ぜます。$q$ は行の利得から、$p$ は列の利得から決まります。'],
          sol: [[`Row indifferent: $${terms([[g.A[0][0], 'q'], [g.A[0][1], '(1 - q)']])} = ${terms([[g.A[1][0], 'q'], [g.A[1][1], '(1 - q)']])}$, so $q = ${m.qf}$.`, `行が無差別：$${terms([[g.A[0][0], 'q'], [g.A[0][1], '(1 - q)']])} = ${terms([[g.A[1][0], 'q'], [g.A[1][1], '(1 - q)']])}$ より $q = ${m.qf}$ です。`], [`Column indifferent: $${terms([[g.B[0][0], 'p'], [g.B[1][0], '(1 - p)']])} = ${terms([[g.B[0][1], 'p'], [g.B[1][1], '(1 - p)']])}$, so $p = ${m.pf}$.`, `列が無差別：$${terms([[g.B[0][0], 'p'], [g.B[1][0], '(1 - p)']])} = ${terms([[g.B[0][1], 'p'], [g.B[1][1], '(1 - p)']])}$ より $p = ${m.pf}$ です。`], ['Notice the cross-over: each probability is fixed by the other player’s payoffs, so changing your own payoffs moves the other player’s mix, not yours.', '入れ替わりに注目してください。各確率は相手の利得で決まるので、自分の利得を変えると動くのは相手の混合で、自分のものではありません。']],
        };
      }
      if (form === 1) {
        const k = r.pick([1, 2, 3, 4]), g = GAMES[k], m = mixedNE(g);
        return {
          q: [`Find the mixed equilibrium of ${g.name[0]}: $p$ = P(Row plays ${g.rows[0][0]}), $q$ = P(Column plays ${g.rows[0][0]}).`, `${g.name[1]}の混合均衡を求めてください。$p$ は行が「${g.rows[0][1]}」を選ぶ確率、$q$ は列が「${g.rows[0][1]}」を選ぶ確率です。`],
          a: { type: 'tuple', v: [m.p, m.q], labels: ['$p$', '$q$'], tol: 1e-4 },
          hint: ['Use the payoff table in the figure: the mix of one player makes the other indifferent between their two choices.', '図の利得表を使います。一方の混合は、もう一方の二つの選択肢を無差別にします。'],
          sol: [[`Row's payoffs are $${g.A[0][0]}, ${g.A[0][1]} / ${g.A[1][0]}, ${g.A[1][1]}$; indifference gives $q = ${m.qf}$.`, `行の利得は $${g.A[0][0]}, ${g.A[0][1]} / ${g.A[1][0]}, ${g.A[1][1]}$ で、無差別の条件から $q = ${m.qf}$ です。`], [`Column's payoffs give $p = ${m.pf}$ in the same way.`, `同様に列の利得から $p = ${m.pf}$ です。`], ['Drag the white point there: it sits exactly where the blue and orange best-reply lines cross in the middle of the square.', '白い点をそこへ動かすと、正方形の中で青とオレンジの最適応答の線が交わる点にちょうど重なります。']],
          set: { game: k, p: Math.round(m.p * 100) / 100, q: Math.round(m.q * 100) / 100 },
        };
      }
      let g, dom;
      do { g = genericGame(r); const u = g.A[0][0] > g.A[1][0], d = g.A[0][1] > g.A[1][1]; dom = u && d ? 0 : !u && !d ? 1 : 2; } while (dom === 2 && r.chance(0.5));
      return {
        q: [`Payoffs (Row, Column): $${bim(g.A, g.B)}$. Does Row have a strictly dominant strategy?`, `利得（行, 列）は $${bim(g.A, g.B)}$ です。行には強支配戦略がありますか。`],
        a: { type: 'choice', opts: [['Yes, U', 'はい、U'], ['Yes, D', 'はい、D'], ['No: the better row depends on Column’s choice', 'いいえ。より良い行は列の選択によって変わります']], v: dom, fixed: true },
        hint: ['Compare Row’s payoffs column by column (the first number in each cell).', '行の利得（各マスの最初の数）を列ごとに比べます。'],
        sol: [[`Against L: U gives $${g.A[0][0]}$, D gives $${g.A[1][0]}$. Against R: U gives $${g.A[0][1]}$, D gives $${g.A[1][1]}$.`, `L に対して U は $${g.A[0][0]}$、D は $${g.A[1][0]}$ です。R に対して U は $${g.A[0][1]}$、D は $${g.A[1][1]}$ です。`], [dom < 2 ? `${dom ? 'D' : 'U'} is better in both columns, so it strictly dominates and Row plays it whatever Column believes.` : 'U is better against one column and D against the other, so neither dominates and Row has to think about what Column will do.', dom < 2 ? `どちらの列でも ${dom ? 'D' : 'U'} の方が良いので強支配し、列が何をすると思っても行はそれを選びます。` : '一方の列では U、もう一方では D が良いので、どちらも支配せず、行は列の出方を考えなければなりません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = genericGame(r, (h) => r.chance(0.5) ? pureNE(h).length === 1 : true), pn = pureNE(g), m = mixedNE(g), tot = pn.length + (m ? 1 : 0);
        return {
          q: [`Payoffs (Row, Column): $${bim(g.A, g.B)}$. Count all Nash equilibria, pure and mixed.`, `利得（行, 列）は $${bim(g.A, g.B)}$ です。ナッシュ均衡を、純粋と混合を合わせてすべて数えてください。`],
          a: { type: 'int', v: tot },
          hint: ['Count the pure ones first, then check whether the indifference probabilities both lie strictly between 0 and 1.', 'まず純粋均衡を数え、次に無差別となる確率が両方とも 0 と 1 の間にあるかを調べます。'],
          sol: [[`Pure: ${pn.length ? pn.map(([a, b]) => cellName(a, b)).join(', ') : 'none'}.`, `純粋均衡：${pn.length ? pn.map(([a, b]) => cellName(a, b)).join('、') : 'なし'}。`], [m ? `Indifference gives $p = ${m.pf}$, $q = ${m.qf}$, both inside $(0, 1)$: one mixed equilibrium.` : 'The indifference conditions give a probability outside $(0, 1)$ (or none), so there is no mixed equilibrium: some row or column is always strictly better somewhere.', m ? `無差別の条件から $p = ${m.pf}$、$q = ${m.qf}$ で、どちらも $(0, 1)$ の中にあるので混合均衡が一つあります。` : '無差別の条件から得られる確率が $(0, 1)$ の外にある（または存在しない）ので、混合均衡はありません。'], [`Total ${tot}. For generic games the count is always odd, the two best-reply staircases cross an odd number of times.`, `合計 ${tot} 個です。一般的なゲームでは均衡の数は必ず奇数で、二つの最適応答の階段は奇数回交わります。`]],
        };
      }
      if (form === 1) {
        const a = r.pick([2, 3, 4, 5]), c = r.pick([1, 2, 3].filter((x) => x !== a)), d = r.pick([1, 2, 3]), e = r.pick([2, 3, 4, 5].filter((x) => x !== d));
        const p = e / (d + e), q = c / (a + c), uR = a * c / (a + c), uC = d * e / (d + e);
        return {
          q: [`A coordination game: $${bim([[a, 0], [0, c]], [[d, 0], [0, e]])}$. What does each player expect at the mixed equilibrium?`, `協調ゲーム $${bim([[a, 0], [0, c]], [[d, 0], [0, e]])}$ があります。混合均衡での各プレイヤーの期待利得はいくつですか。`],
          a: { type: 'tuple', v: [uR, uC], labels: [['Row', '行'], ['Column', '列']], tol: 1e-4 },
          hint: ['At a mixed equilibrium each player is indifferent, so their payoff equals the payoff of either pure choice.', '混合均衡では各プレイヤーが無差別なので、利得はどちらの純粋な選択の利得とも等しくなります。'],
          sol: [[`Row indifferent: $${a}q = ${c}(1 - q)$, so $q = ${frac(c, a + c)}$. Column indifferent: $${d}p = ${e}(1 - p)$, so $p = ${frac(e, d + e)}$.`, `行が無差別：$${a}q = ${c}(1 - q)$ より $q = ${frac(c, a + c)}$。列が無差別：$${d}p = ${e}(1 - p)$ より $p = ${frac(e, d + e)}$ です。`], [`Row gets $${a}q = ${frac(a * c, a + c)}$ and Column $${d}p = ${frac(d * e, d + e)}$.`, `行は $${a}q = ${frac(a * c, a + c)}$、列は $${d}p = ${frac(d * e, d + e)}$ を得ます。`], [`Both are below the worst pure equilibrium payoff ($${Math.min(a, c)}$ and $${Math.min(d, e)}$): randomizing makes them miss each other ${n(100 * (p * (1 - q) + (1 - p) * q), 3)}% of the time.`, `どちらも悪い方の純粋均衡の利得（$${Math.min(a, c)}$ と $${Math.min(d, e)}$）より小さくなります。確率を混ぜるので、${n(100 * (p * (1 - q) + (1 - p) * q), 3)}% の確率で出会い損ねるからです。`]],
        };
      }
      return {
        q: ['In the game $\\begin{array}{c|cc} & \\text{L} & \\text{R} \\\\ \\hline \\text{U} & a,\\,-1 & -1,\\,1 \\\\ \\text{D} & -1,\\,1 & 1,\\,-1 \\end{array}$ with $a > 0$, write the equilibrium probability $q^*$ that Column plays L, as a function of $a$.', '$a > 0$ のゲーム $\\begin{array}{c|cc} & \\text{L} & \\text{R} \\\\ \\hline \\text{U} & a,\\,-1 & -1,\\,1 \\\\ \\text{D} & -1,\\,1 & 1,\\,-1 \\end{array}$ で、列が L を選ぶ均衡確率 $q^*$ を $a$ の式で書いてください。'],
        a: { type: 'expr', v: '2/(a+3)', vars: ['a'], dom: { a: [0.2, 6] }, lhs: ['$q^*(a) =$', '$q^*(a) =$'] },
        hint: ['Column’s probability is whatever makes Row indifferent between U and D.', '列の確率は、行にとって U と D を無差別にする値です。'],
        sol: [['Row indifferent: $aq - (1 - q) = -q + (1 - q)$, that is $(a + 1)q - 1 = 1 - 2q$.', '行が無差別：$aq - (1 - q) = -q + (1 - q)$、すなわち $(a + 1)q - 1 = 1 - 2q$ です。'], ['So $q^* = \\dfrac{2}{a + 3}$; at $a = 1$ this is the $\\tfrac12$ of matching pennies.', 'したがって $q^* = \\dfrac{2}{a + 3}$ で、$a = 1$ ならコイン合わせの $\\tfrac12$ です。'], ['Raising Row’s reward $a$ for (U, L) makes Column play L less, not Row play U more: Row’s own mix, fixed by Column’s payoffs, stays at $\\tfrac12$.', '(U, L) での行の報酬 $a$ を上げると、行が U を増やすのではなく、列が L を減らします。行自身の混合は列の利得で決まるので $\\tfrac12$ のままです。']],
        set: { game: 4 },
      };
    },
  ];

  /* ---------- 2. replicator dynamics, rock-paper-scissors ---------- */
  const rps = (w) => [[0, -1, w], [w, 0, -1], [-1, w, 0]];
  const fit = (w, x) => rps(w).map((row) => row[0] * x[0] + row[1] * x[1] + row[2] * x[2]);
  const NM = [['rock', 'グー'], ['paper', 'パー'], ['scissors', 'チョキ']];
  const startMix = (r) => { const xp = r.step(0.1, 0.6, 0.05), xs = r.step(0.1, Math.min(0.6, 0.9 - xp), 0.05); return [Number((1 - xp - xs).toFixed(2)), xp, xs]; };
  Q.replicator = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let w, x, f;
        do { w = r.step(0.4, 2, 0.2); x = startMix(r); f = fit(w, x); } while ([...f].sort((a, b) => b - a)[0] - [...f].sort((a, b) => b - a)[1] < 0.02);
        const best = f.indexOf(Math.max(...f));
        return {
          q: [`Rock-paper-scissors with win payoff $w = ${n(w)}$; the shares are rock $${n(x[0])}$, paper $${n(x[1])}$, scissors $${n(x[2])}$. Which share is growing fastest relative to its size?`, `勝ちの利得 $w = ${n(w)}$ のじゃんけんで、割合はグー $${n(x[0])}$、パー $${n(x[1])}$、チョキ $${n(x[2])}$ です。自分の大きさに対して最も速く増えている割合はどれですか。`],
          a: { type: 'choice', opts: NM, v: best, fixed: true },
          hint: ['$\\dot x_i / x_i = (Ax)_i - x\\cdot Ax$: compare the fitnesses $(Ax)_i$.', '$\\dot x_i / x_i = (Ax)_i - x\\cdot Ax$ なので、適応度 $(Ax)_i$ を比べます。'],
          sol: [[`Rock: $-x_P + w x_S = ${n(f[0])}$. Paper: $w x_R - x_S = ${n(f[1])}$. Scissors: $-x_R + w x_P = ${n(f[2])}$.`, `グー：$-x_P + w x_S = ${n(f[0])}$、パー：$w x_R - x_S = ${n(f[1])}$、チョキ：$-x_R + w x_P = ${n(f[2])}$ です。`], [`${NM[best][0][0].toUpperCase() + NM[best][0].slice(1)} has the highest fitness, so its share grows fastest in relative terms: it is the strategy that beats whatever is currently common.`, `${NM[best][1]}の適応度が最も高いので、その割合が相対的に最も速く増えます。いま多数派の戦略に勝つ戦略です。`]],
          set: { w, xp: x[1], xs: x[2] },
        };
      }
      if (form === 1) {
        const w = r.step(0.4, 2, 0.2), x = startMix(r), s = x[0] * x[1] + x[1] * x[2] + x[2] * x[0];
        return {
          q: [`With win payoff $w = ${n(w)}$ and shares $(x_R, x_P, x_S) = (${n(x[0])}, ${n(x[1])}, ${n(x[2])})$, what is the population's mean payoff $x\\cdot Ax$?`, `勝ちの利得 $w = ${n(w)}$、割合 $(x_R, x_P, x_S) = (${n(x[0])}, ${n(x[1])}, ${n(x[2])})$ のとき、集団の平均利得 $x\\cdot Ax$ はいくつですか。`],
          a: { type: 'num', v: (w - 1) * s, tol: 1e-6 },
          hint: ['Each pair of different strategies meets with probability $2x_ix_j$, and one wins $w$ while the other loses $1$.', '異なる二つの戦略は確率 $2x_ix_j$ で出会い、一方が $w$ を得て他方が $1$ を失います。'],
          sol: [[`$x\\cdot Ax = (w - 1)(x_Rx_P + x_Px_S + x_Sx_R) = ${n(w - 1)}\\cdot ${n(s, 4)}$.`, `$x\\cdot Ax = (w - 1)(x_Rx_P + x_Px_S + x_Sx_R) = ${n(w - 1)}\\cdot ${n(s, 4)}$ です。`], [`$= ${n((w - 1) * s, 4)}$. ${w > 1 ? 'Positive: mixing pays, so the population is pushed towards the centre.' : w < 1 ? 'Negative: every encounter destroys value, and the population is pushed towards the corners.' : 'Zero: the game is zero-sum.'}`, `$= ${n((w - 1) * s, 4)}$ です。${w > 1 ? '正なので混ざると得をし、集団は中心へ押されます。' : w < 1 ? '負なので出会うたびに価値が失われ、集団は頂点の方へ押されます。' : '0 で、ゲームはゼロ和です。'}`]],
          set: { w, xp: x[1], xs: x[2] },
        };
      }
      const w = r.pick([0.4, 0.6, 0.8, 1, 1, 1.2, 1.5, 1.8, 2]);
      return {
        q: [`In rock-paper-scissors with win payoff $w = ${n(w)}$ (a loss costs 1), what happens to orbits near the interior equilibrium $(\\tfrac13, \\tfrac13, \\tfrac13)$?`, `勝ちの利得 $w = ${n(w)}$（負けの損失は 1）のじゃんけんで、内部の平衡点 $(\\tfrac13, \\tfrac13, \\tfrac13)$ の近くの軌道はどうなりますか。`],
        a: { type: 'choice', opts: [['They spiral in: a stable spiral', '内側へ渦を巻く（安定な渦状点）'], ['They are closed loops: a neutral centre', '閉じた輪になる（中立な中心）'], ['They spiral out: an unstable spiral', '外側へ渦を巻く（不安定な渦状点）']], v: w > 1 ? 0 : w < 1 ? 2 : 1, fixed: true },
        hint: ['Compare what a win gains with what a loss costs.', '勝ちで得るものと負けで失うものを比べます。'],
        sol: [[`The eigenvalues there are $\\tfrac{1 - w}{6} \\pm i\\tfrac{w + 1}{2\\sqrt3}$, with real part $${n((1 - w) / 6, 4)}$.`, `そこでの固有値は $\\tfrac{1 - w}{6} \\pm i\\tfrac{w + 1}{2\\sqrt3}$ で、実部は $${n((1 - w) / 6, 4)}$ です。`], [w > 1 ? 'Negative real part: the orbits spiral in to one third each.' : w < 1 ? 'Positive real part: the orbits spiral outwards towards the boundary cycle.' : 'Zero real part, and the product $x_Rx_Px_S$ is conserved exactly, so the orbits close.', w > 1 ? '実部が負なので、軌道は三分の一ずつの点へ渦を巻いて入ります。' : w < 1 ? '実部が正なので、軌道は境界のサイクルへ向かって外へ渦を巻きます。' : '実部が 0 で、積 $x_Rx_Px_S$ が厳密に保存されるので、軌道は閉じます。']],
        set: { w },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w = r.step(0.4, 2, 0.2), x = startMix(r), f = fit(w, x), fb = x[0] * f[0] + x[1] * f[1] + x[2] * f[2], i = r.int(0, 2), d = x[i] * (f[i] - fb);
        return {
          q: [`Win payoff $w = ${n(w)}$, shares $(x_R, x_P, x_S) = (${n(x[0])}, ${n(x[1])}, ${n(x[2])})$. Compute the replicator rate $\\dot x_{${'RPS'[i]}}$ for ${NM[i][0]}.`, `勝ちの利得 $w = ${n(w)}$、割合 $(x_R, x_P, x_S) = (${n(x[0])}, ${n(x[1])}, ${n(x[2])})$ です。${NM[i][1]}のレプリケーター方程式の速度 $\\dot x_{${'RPS'[i]}}$ を求めてください。`],
          a: { type: 'num', v: d, tol: 5e-5 },
          hint: ['$\\dot x_i = x_i\\big((Ax)_i - x\\cdot Ax\\big)$.', '$\\dot x_i = x_i\\big((Ax)_i - x\\cdot Ax\\big)$ です。'],
          sol: [[`Fitnesses: $(Ax) = (${n(f[0])}, ${n(f[1])}, ${n(f[2])})$; mean $x\\cdot Ax = ${n(fb, 5)}$.`, `適応度は $(Ax) = (${n(f[0])}, ${n(f[1])}, ${n(f[2])})$、平均は $x\\cdot Ax = ${n(fb, 5)}$ です。`], [`$\\dot x_{${'RPS'[i]}} = ${n(x[i])}\\,(${n(f[i])} - ${n(fb, 5)}) = ${n(d, 5)}$.`, `$\\dot x_{${'RPS'[i]}} = ${n(x[i])}\\,(${n(f[i])} - ${n(fb, 5)}) = ${n(d, 5)}$ です。`], [`${d > 0 ? 'Positive: this strategy does better than average and spreads.' : 'Negative: it does worse than average and shrinks.'} The three rates always add to zero, so the point stays in the triangle.`, `${d > 0 ? '正なので、この戦略は平均より良く、広がります。' : '負なので、平均より悪く、縮みます。'}三つの速度の和は常に 0 なので、点は三角形の中にとどまります。`]],
          set: { w, xp: x[1], xs: x[2] },
        };
      }
      if (form === 1) {
        const w = r.step(0.2, 2, 0.1), re = (1 - w) / 6, im = (w + 1) / (2 * Math.sqrt(3));
        return {
          q: [`Linearize the rock-paper-scissors replicator dynamics with $w = ${n(w)}$ at the centre. Give the real and imaginary parts of the eigenvalues $\\mu \\pm i\\nu$ ($\\nu > 0$).`, `$w = ${n(w)}$ のじゃんけんのレプリケーター動学を中心で線形化します。固有値 $\\mu \\pm i\\nu$（$\\nu > 0$）の実部と虚部を求めてください。`],
          a: { type: 'tuple', v: [re, im], labels: ['$\\mu$', '$\\nu$'], tol: 2e-4 },
          hint: ['The formula above the figure gives $\\mu = (1 - w)/6$ and $\\nu = (w + 1)/(2\\sqrt3)$; derive them if you can from the Jacobian in coordinates $(x_R, x_P)$.', '$\\mu = (1 - w)/6$、$\\nu = (w + 1)/(2\\sqrt3)$ です。できれば座標 $(x_R, x_P)$ でのヤコビ行列から導いてください。'],
          sol: [[`$\\mu = (1 - ${n(w)})/6 = ${n(re, 4)}$ and $\\nu = (${n(w)} + 1)/(2\\sqrt3) = ${n(im, 4)}$.`, `$\\mu = (1 - ${n(w)})/6 = ${n(re, 4)}$、$\\nu = (${n(w)} + 1)/(2\\sqrt3) = ${n(im, 4)}$ です。`], [`The orbits turn with period about $2\\pi/\\nu = ${n(2 * PI / im, 3)}$ and ${re < 0 ? 'decay' : re > 0 ? 'grow' : 'neither grow nor decay'} by a factor $e^{2\\pi\\mu/\\nu} = ${n(Math.exp(2 * PI * re / im), 3)}$ per turn.`, `軌道は周期およそ $2\\pi/\\nu = ${n(2 * PI / im, 3)}$ で回り、一回りごとに $e^{2\\pi\\mu/\\nu} = ${n(Math.exp(2 * PI * re / im), 3)}$ 倍に${re < 0 ? '減衰します' : re > 0 ? '増大します' : 'なり、増えも減りもしません'}。`]],
          set: { w },
        };
      }
      const w = r.step(0.4, 2, 0.2), x = startMix(r), s = x[0] * x[1] + x[1] * x[2] + x[2] * x[0], rate = (w - 1) * (1 - 3 * s);
      return {
        q: [`At $w = ${n(w)}$ and shares $(${n(x[0])}, ${n(x[1])}, ${n(x[2])})$, how fast is $\\log(x_Rx_Px_S)$ changing?`, `$w = ${n(w)}$、割合 $(${n(x[0])}, ${n(x[1])}, ${n(x[2])})$ のとき、$\\log(x_Rx_Px_S)$ はどれだけの速さで変化していますか。`],
        a: { type: 'num', v: rate, tol: 5e-5 },
        hint: ['$\\frac{d}{dt}\\log(x_Rx_Px_S) = \\sum_i \\dot x_i/x_i = \\sum_i (Ax)_i - 3\\,x\\cdot Ax$.', '$\\frac{d}{dt}\\log(x_Rx_Px_S) = \\sum_i \\dot x_i/x_i = \\sum_i (Ax)_i - 3\\,x\\cdot Ax$ です。'],
        sol: [[`$\\sum_i (Ax)_i = w - 1$ because each row of $A$ sums to $w - 1$, and $x\\cdot Ax = (w - 1)\\,${n(s, 4)}$.`, `$A$ の各行の和は $w - 1$ なので $\\sum_i (Ax)_i = w - 1$、また $x\\cdot Ax = (w - 1)\\,${n(s, 4)}$ です。`], [`Rate $= (w - 1)(1 - 3\\cdot ${n(s, 4)}) = ${n(rate, 5)}$.`, `速さ $= (w - 1)(1 - 3\\cdot ${n(s, 4)}) = ${n(rate, 5)}$ です。`], ['Since $x_Rx_P + x_Px_S + x_Sx_R \\le \\tfrac13$ on the triangle, the second factor is never negative: the sign of $w - 1$ alone decides whether the product grows.', '三角形上では $x_Rx_P + x_Px_S + x_Sx_R \\le \\tfrac13$ なので第2因子は負になりません。積が増えるかどうかは $w - 1$ の符号だけで決まります。']],
        set: { w, xp: x[1], xs: x[2] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w = r.pick([0.5, 0.75, 1, 1.25, 1.5]);
        return {
          q: [`Rock-paper-scissors with $w = ${n(w)}$. Along the line $x_R = x_P = a$, $x_S = 1 - 2a$, write $\\frac{d}{dt}\\log(x_Rx_Px_S)$ as a function of $a$, in factored form if you can.`, `$w = ${n(w)}$ のじゃんけんで、直線 $x_R = x_P = a$、$x_S = 1 - 2a$ に沿った $\\frac{d}{dt}\\log(x_Rx_Px_S)$ を $a$ の式で書いてください（できれば因数分解した形で）。`],
          a: { type: 'expr', v: `${n(w - 1, 6)}*(1-3*a)^2`, vars: ['a'], dom: { a: [0.05, 0.45] }, lhs: ['$\\frac{d}{dt}\\log V =$', '$\\frac{d}{dt}\\log V =$'] },
          hint: ['Start from $(w - 1)\\big(1 - 3(x_Rx_P + x_Px_S + x_Sx_R)\\big)$.', '$(w - 1)\\big(1 - 3(x_Rx_P + x_Px_S + x_Sx_R)\\big)$ から始めます。'],
          sol: [['$x_Rx_P + x_Px_S + x_Sx_R = a^2 + 2a(1 - 2a) = 2a - 3a^2$.', '$x_Rx_P + x_Px_S + x_Sx_R = a^2 + 2a(1 - 2a) = 2a - 3a^2$ です。'], [`$1 - 3(2a - 3a^2) = 1 - 6a + 9a^2 = (1 - 3a)^2$, so the rate is $${n(w - 1)}\\,(1 - 3a)^2$.`, `$1 - 3(2a - 3a^2) = 1 - 6a + 9a^2 = (1 - 3a)^2$ なので、速さは $${n(w - 1)}\\,(1 - 3a)^2$ です。`], [w === 1 ? 'With $w = 1$ it vanishes identically: the product is conserved.' : 'A perfect square: it vanishes only at the centre $a = \\tfrac13$, and elsewhere has the sign of $w - 1$, which is why $x_Rx_Px_S$ is a Lyapunov function.', w === 1 ? '$w = 1$ では恒等的に 0 で、積は保存されます。' : '完全平方なので中心 $a = \\tfrac13$ でのみ 0 になり、それ以外では $w - 1$ の符号をもちます。$x_Rx_Px_S$ がリャプノフ関数になるのはこのためです。']],
          set: { w },
        };
      }
      if (form === 1) {
        const T = r.pick([8, 10, 12, 14, 16, 18]), w = 4 * Math.sqrt(3) * PI / T - 1;
        return {
          q: [`Near the centre, the rock-paper-scissors cycle should take time $T = ${T}$ per turn. What win payoff $w$ does that require?`, `中心の近くで、じゃんけんのサイクルの一回りにかかる時間を $T = ${T}$ にしたいとします。必要な勝ちの利得 $w$ はいくつですか。`],
          a: { type: 'num', v: w, tol: 2e-3 },
          hint: ['The period near the centre is $2\\pi/\\nu$ with $\\nu = (w + 1)/(2\\sqrt3)$.', '中心付近の周期は $2\\pi/\\nu$、$\\nu = (w + 1)/(2\\sqrt3)$ です。'],
          sol: [[`$\\dfrac{2\\pi\\cdot 2\\sqrt3}{w + 1} = ${T}$ gives $w + 1 = \\dfrac{4\\sqrt3\\pi}{${T}} = ${n(w + 1, 4)}$.`, `$\\dfrac{2\\pi\\cdot 2\\sqrt3}{w + 1} = ${T}$ より $w + 1 = \\dfrac{4\\sqrt3\\pi}{${T}} = ${n(w + 1, 4)}$ です。`], [`$w = ${n(w, 4)}$: ${w > 1 ? 'the cycles also decay, since $w > 1$' : w < 1 ? 'the cycles also grow, since $w < 1$' : 'neutral cycles'}. Faster rotation needs a bigger stake on each encounter.`, `$w = ${n(w, 4)}$ で、${w > 1 ? '$w > 1$ なのでサイクルは減衰もします' : w < 1 ? '$w < 1$ なのでサイクルは増大もします' : 'サイクルは中立です'}。速く回るには、一回の出会いの賭け金を大きくする必要があります。`]],
          set: { w: Math.round(w * 20) / 20 },
        };
      }
      const V = r.pick([2, 3, 4, 6]), C = r.pick([5, 6, 8, 9, 10, 12].filter((c) => c > V));
      return {
        q: [`Hawk-dove: a contested resource is worth $V = ${V}$; two hawks fight and the loser pays $C = ${C}$, so hawk meets hawk for $(V - C)/2$, hawk meets dove for $V$, dove meets hawk for $0$ and dove meets dove for $V/2$. Under replicator dynamics, what share of hawks is the stable equilibrium?`, `タカ・ハト：争われる資源の価値は $V = ${V}$ で、タカ同士は戦い負けた方が $C = ${C}$ を払います。利得はタカ対タカ $(V - C)/2$、タカ対ハト $V$、ハト対タカ $0$、ハト対ハト $V/2$ です。レプリケーター動学で安定な平衡点のタカの割合はいくつですか。`],
        a: { type: 'num', v: V / C, show: frac(V, C) },
        hint: ['At an interior rest point the two strategies earn the same.', '内部の静止点では二つの戦略の利得が等しくなります。'],
        sol: [[`With hawk share $x$: hawk earns $x\\tfrac{V - C}{2} + (1 - x)V$, dove earns $(1 - x)\\tfrac V2$.`, `タカの割合を $x$ とすると、タカの利得は $x\\tfrac{V - C}{2} + (1 - x)V$、ハトの利得は $(1 - x)\\tfrac V2$ です。`], [`Setting them equal: $\\tfrac V2 = x\\tfrac C2$, so $x^* = V/C = ${frac(V, C)}$.`, `等しいとおくと $\\tfrac V2 = x\\tfrac C2$ なので $x^* = V/C = ${frac(V, C)}$ です。`], ['Below $x^*$ hawks earn more and spread; above it they earn less and shrink, so the mix is stable. Unlike rock-paper-scissors, a two-strategy population cannot cycle.', '$x^*$ より少ないとタカの方が得をして増え、多いと損をして減るので、この混合は安定です。じゃんけんと違い、二戦略の集団は循環できません。']],
      };
    },
  ];

  /* ---------- 3. zero-sum games and minimax ---------- */
  const ZS = [
    { M: [[0.58, 0.83, 0.95], [0.93, 0.80, 0.60]], name: ['the penalty kick', 'PK'], cols: [['Dive left', '左へ跳ぶ'], ['Stay', '動かない'], ['Dive right', '右へ跳ぶ']] },
    { M: [[3, -1, 2, 0], [-2, 4, -1, 1.5]], name: ['the 2 × 4 game', '2 × 4 のゲーム'], cols: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']] },
    { M: [[4, 2, 5], [3, 1, 2]], name: ['the saddle-point game', '鞍点のあるゲーム'], cols: [['A', 'A'], ['B', 'B'], ['C', 'C']] },
  ];
  const lineVal = (M, j, p) => p * M[0][j] + (1 - p) * M[1][j];
  const env = (M, p) => Math.min(...M[0].map((_, j) => lineVal(M, j, p)));
  function solve(M) {
    const m = M[0].length, cand = [0, 1];
    for (let j = 0; j < m; j++) for (let k = j + 1; k < m; k++) { const sj = M[0][j] - M[1][j], sk = M[0][k] - M[1][k]; if (sj !== sk) { const p = (M[1][k] - M[1][j]) / (sj - sk); if (p > 0 && p < 1) cand.push(p); } }
    let best = { p: 0, v: -Infinity }; for (const p of cand) { const v = env(M, p); if (v > best.v + 1e-12) best = { p, v }; }
    return best;
  }
  const mtx = (M) => `\\begin{pmatrix} ${M[0].map((x) => n(x)).join(' & ')} \\\\ ${M[1].map((x) => n(x)).join(' & ')} \\end{pmatrix}`;
  Q['minimax-lp'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), M = ZS[k].M, p = r.step(0.1, 0.9, 0.1), vals = M[0].map((_, j) => lineVal(M, j, p)), v = Math.min(...vals);
        return {
          q: [`In ${ZS[k].name[0]} (payoffs to Row: $${mtx(M)}$), Row plays the first row with probability $p = ${n(p)}$. What payoff is Row guaranteed whatever Column does?`, `${ZS[k].name[1]}（行の利得 $${mtx(M)}$）で、行は確率 $p = ${n(p)}$ で第 1 行を選びます。列が何をしても行に保証される利得はいくつですか。`],
          a: { type: 'num', v, tol: 1e-6 },
          hint: ['Compute Row’s expected payoff against each column; Column will pick the worst one for Row.', '各列に対する行の期待利得を計算します。列は行にとって最悪のものを選びます。'],
          sol: [[`Against the columns: $${vals.map((x) => n(x, 4)).join(',\\ ')}$.`, `各列に対して $${vals.map((x) => n(x, 4)).join(',\\ ')}$ です。`], [`The minimum is $${n(v, 4)}$: the height of the lower envelope at $p = ${n(p)}$.`, `最小値は $${n(v, 4)}$ で、$p = ${n(p)}$ での下側の包絡線の高さです。`]],
          set: { game: k, p },
        };
      }
      if (form === 1) {
        let M, sad;
        do {
          M = [[r.int(-3, 6), r.int(-3, 6), r.int(-3, 6)], [r.int(-3, 6), r.int(-3, 6), r.int(-3, 6)]];
          const rowMin = M.map((row) => Math.min(...row)), colMax = M[0].map((_, j) => Math.max(M[0][j], M[1][j]));
          sad = Math.max(...rowMin) === Math.min(...colMax) ? Math.max(...rowMin) : null;
        } while (sad === null);
        const rowMin = M.map((row) => Math.min(...row)), colMax = M[0].map((_, j) => Math.max(M[0][j], M[1][j]));
        return {
          q: [`The zero-sum game with payoffs to Row $${mtx(M)}$ has a saddle point. What is its value?`, `行の利得が $${mtx(M)}$ のゼロ和ゲームには鞍点があります。値はいくつですか。`],
          a: { type: 'num', v: sad, tol: 1e-9 },
          hint: ['Row’s security level is the largest row minimum; Column’s is the smallest column maximum.', '行の保証水準は行の最小値の最大、列の保証水準は列の最大値の最小です。'],
          sol: [[`Row minima: $${rowMin.join(', ')}$, so maximin $= ${Math.max(...rowMin)}$. Column maxima: $${colMax.join(', ')}$, so minimax $= ${Math.min(...colMax)}$.`, `行の最小値は $${rowMin.join(', ')}$ で maximin $= ${Math.max(...rowMin)}$、列の最大値は $${colMax.join(', ')}$ で minimax $= ${Math.min(...colMax)}$ です。`], [`They agree, so $v = ${sad}$ in pure strategies: an entry that is the smallest in its row and the largest in its column. Neither player gains anything by randomizing.`, `両者が一致するので、純粋戦略で $v = ${sad}$ です。その行で最小、その列で最大の要素です。どちらも確率を混ぜて得るものはありません。`]],
        };
      }
      const k = r.int(0, 1), M = ZS[k].M, p = r.step(0.05, 0.95, 0.05);
      const vals = M[0].map((_, j) => lineVal(M, j, p)), j = vals.indexOf(Math.min(...vals));
      const sorted = [...vals].sort((a, b) => a - b);
      if (sorted[1] - sorted[0] < 1e-6) return Q['minimax-lp'][0](r);
      return {
        q: [`In ${ZS[k].name[0]} (payoffs to Row: $${mtx(M)}$), Row plays the first row with probability $p = ${n(p)}$. Which pure column is Column's best reply?`, `${ZS[k].name[1]}（行の利得 $${mtx(M)}$）で、行は確率 $p = ${n(p)}$ で第 1 行を選びます。列の最適応答はどの純粋戦略ですか。`],
        a: { type: 'choice', opts: ZS[k].cols, v: j, fixed: true },
        hint: ['Column wants Row’s expected payoff to be as small as possible.', '列は行の期待利得をできるだけ小さくしたいのです。'],
        sol: [[`Row expects $${vals.map((x) => n(x, 4)).join(',\\ ')}$ against the columns.`, `各列に対する行の期待利得は $${vals.map((x) => n(x, 4)).join(',\\ ')}$ です。`], [`The smallest is ${ZS[k].cols[j][0]}, $${n(vals[j], 4)}$: that line forms the envelope at this $p$.`, `最小は「${ZS[k].cols[j][1]}」の $${n(vals[j], 4)}$ で、この $p$ ではその直線が包絡線になっています。`]],
        set: { game: k, p },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form !== 1) {
        let a, b, c, d, den;
        do { a = r.int(-3, 5); b = r.int(-3, 5); c = r.int(-3, 5); d = r.int(-3, 5); den = a - b - c + d; } while (!den || Math.max(Math.min(a, b), Math.min(c, d)) >= Math.min(Math.max(a, c), Math.max(b, d)));
        const p = (d - c) / den, v = (a * d - b * c) / den, y = (d - b) / den;
        if (form === 0) return {
          q: [`Solve the zero-sum game with payoffs to Row $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$: Row's optimal probability $p^*$ of the first row, and the value $v$.`, `行の利得が $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$ のゼロ和ゲームを解いてください。行が第 1 行を選ぶ最適確率 $p^*$ と値 $v$ を求めます。`],
          a: { type: 'tuple', v: [p, v], labels: ['$p^*$', '$v$'], tol: 1e-4 },
          hint: ['There is no saddle point, so at the optimum Row is equally well off against both columns.', '鞍点がないので、最適点で行はどちらの列に対しても同じ利得になります。'],
          sol: [[`$${terms([[a, 'p'], [c, '(1 - p)']])} = ${terms([[b, 'p'], [d, '(1 - p)']])}$ gives $p^* = \\dfrac{${d} - ${c < 0 ? '(' + c + ')' : c}}{${den}} = ${frac(d - c, den)}$.`, `$${terms([[a, 'p'], [c, '(1 - p)']])} = ${terms([[b, 'p'], [d, '(1 - p)']])}$ より $p^* = \\dfrac{${d} - ${c < 0 ? '(' + c + ')' : c}}{${den}} = ${frac(d - c, den)}$ です。`], [`$v = \\dfrac{ad - bc}{a - b - c + d} = ${frac(a * d - b * c, den)}$.`, `$v = \\dfrac{ad - bc}{a - b - c + d} = ${frac(a * d - b * c, den)}$ です。`], ['On the envelope picture this is the crossing of the two lines, the top of the lower envelope.', '包絡線の図では二直線の交点、すなわち下側の包絡線の頂上です。']],
        };
        return {
          q: [`In the zero-sum game $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$ (payoffs to Row), with what probability should Column play the first column?`, `ゼロ和ゲーム $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$（行の利得）で、列は第 1 列をどの確率で選ぶべきですか。`],
          a: { type: 'num', v: y, show: frac(d - b, den) },
          hint: ['Column mixes so that Row gets the same against either row.', '列は、行がどちらの行を選んでも同じ利得になるように混ぜます。'],
          sol: [[`$${terms([[a, 'y'], [b, '(1 - y)']])} = ${terms([[c, 'y'], [d, '(1 - y)']])}$, so $y^* = \\dfrac{${d} - ${b < 0 ? '(' + b + ')' : b}}{${den}} = ${frac(d - b, den)}$.`, `$${terms([[a, 'y'], [b, '(1 - y)']])} = ${terms([[c, 'y'], [d, '(1 - y)']])}$ より $y^* = \\dfrac{${d} - ${b < 0 ? '(' + b + ')' : b}}{${den}} = ${frac(d - b, den)}$ です。`], [`Mixed this way Column holds Row to $${frac(a * d - b * c, den)}$ whatever Row does: the value from Column's side, which is the minimax theorem.`, `このように混ぜると、行が何をしても列は行を $${frac(a * d - b * c, den)}$ に抑えます。列の側から見た値で、これがミニマックス定理です。`]],
        };
      }
      const s = solve(ZS[0].M);
      return {
        q: [`Penalty kick, scoring probabilities $${mtx(ZS[0].M)}$ (rows: kick left, kick right; columns: dive left, stay, dive right). Find the kicker's optimal probability $p^*$ of kicking left and the scoring probability $v$ it guarantees.`, `PK の得点確率は $${mtx(ZS[0].M)}$ です（行：左へ蹴る、右へ蹴る。列：左へ跳ぶ、動かない、右へ跳ぶ）。キッカーが左へ蹴る最適確率 $p^*$ と、それで保証される得点確率 $v$ を求めてください。`],
        a: { type: 'tuple', v: [s.p, s.v], labels: ['$p^*$', '$v$'], tol: 2e-3 },
        hint: ['Find where pairs of lines cross and take the highest point of the lower envelope.', '直線の対どうしの交点を求め、下側の包絡線の最高点をとります。'],
        sol: [['The lines are $0.93 - 0.35p$ (dive left), $0.80 + 0.03p$ (stay) and $0.60 + 0.35p$ (dive right).', '直線は $0.93 - 0.35p$（左へ跳ぶ）、$0.80 + 0.03p$（動かない）、$0.60 + 0.35p$（右へ跳ぶ）です。'], [`The envelope peaks where "dive left" meets "dive right": $0.93 - 0.35p = 0.60 + 0.35p$, $p^* = ${n(s.p, 4)}$, $v = ${n(s.v, 4)}$; "stay" gives $${n(0.8 + 0.03 * s.p, 4)}$ there, more than $v$, so the keeper never stays.`, `包絡線は「左へ跳ぶ」と「右へ跳ぶ」の交点で最大になります。$0.93 - 0.35p = 0.60 + 0.35p$ より $p^* = ${n(s.p, 4)}$、$v = ${n(s.v, 4)}$ です。そこで「動かない」は $${n(0.8 + 0.03 * s.p, 4)}$ で $v$ より大きいので、キーパーは動かない選択をとりません。`]],
        set: { game: 0, p: Math.round(s.p * 1000) / 1000 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let M, s;
        do { M = [[r.int(-2, 5), r.int(-2, 5), r.int(-2, 5)], [r.int(-2, 5), r.int(-2, 5), r.int(-2, 5)]]; s = solve(M); } while (s.p <= 0.02 || s.p >= 0.98);
        return {
          q: [`Find the value of the zero-sum game with payoffs to Row $${mtx(M)}$.`, `行の利得が $${mtx(M)}$ のゼロ和ゲームの値を求めてください。`],
          a: { type: 'num', v: s.v, tol: 2e-3 },
          hint: ['Draw the three lines $p\\,a_{1j} + (1 - p)\\,a_{2j}$ on $[0, 1]$ and find the top of their lower envelope.', '$[0, 1]$ 上に三本の直線 $p\\,a_{1j} + (1 - p)\\,a_{2j}$ を描き、下側の包絡線の頂上を求めます。'],
          sol: [[`The lines are ${M[0].map((_, j) => `$${terms([[M[1][j], ''], [M[0][j] - M[1][j], 'p']])}$`).join(', ')}.`, `直線は ${M[0].map((_, j) => `$${terms([[M[1][j], ''], [M[0][j] - M[1][j], 'p']])}$`).join('、')} です。`], [`The envelope peaks at $p^* = ${n(s.p, 4)}$ with height $v = ${n(s.v, 4)}$, where two lines of opposite slope cross.`, `包絡線は傾きの符号が逆の二直線が交わる $p^* = ${n(s.p, 4)}$ で最大となり、高さは $v = ${n(s.v, 4)}$ です。`], ['Column’s optimal mix uses only those two columns; the third is too expensive for Column at $p^*$, so it gets zero weight.', '列の最適な混合はその二つの列だけを使います。残りの列は $p^*$ で列にとって高くつくので、重みは 0 です。']],
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 4, 5, 6]);
        return {
          q: [`In the zero-sum game $\\begin{pmatrix} x & 0 \\\\ 0 & 1 \\end{pmatrix}$ with $x > 0$, what $x$ makes the value exactly $1/${k}$?`, `$x > 0$ のゼロ和ゲーム $\\begin{pmatrix} x & 0 \\\\ 0 & 1 \\end{pmatrix}$ で、値をちょうど $1/${k}$ にする $x$ はいくつですか。`],
          a: { type: 'num', v: 1 / (k - 1), show: frac(1, k - 1) },
          hint: ['No saddle point when $x > 0$, so $v = (ad - bc)/(a - b - c + d)$.', '$x > 0$ では鞍点がないので $v = (ad - bc)/(a - b - c + d)$ です。'],
          sol: [['$v = \\dfrac{x\\cdot 1 - 0}{x + 1} = \\dfrac{x}{x + 1}$.', '$v = \\dfrac{x\\cdot 1 - 0}{x + 1} = \\dfrac{x}{x + 1}$ です。'], [`$\\dfrac{x}{x + 1} = \\dfrac1{${k}}$ gives $x = ${frac(1, k - 1)}$.`, `$\\dfrac{x}{x + 1} = \\dfrac1{${k}}$ より $x = ${frac(1, k - 1)}$ です。`], ['The value is less than both diagonal payoffs: Column’s randomizing costs Row, and the value behaves like a harmonic mean of $x$ and $1$.', '値は対角のどちらの利得よりも小さくなります。列が確率を混ぜることで行は損をし、値は $x$ と $1$ の調和平均のようにふるまいます。']],
        };
      }
      let M, s, zero;
      do {
        M = [[r.int(-2, 5), r.int(-2, 5), r.int(-2, 5)], [r.int(-2, 5), r.int(-2, 5), r.int(-2, 5)]]; s = solve(M);
        const act = M[0].map((_, j) => Math.abs(lineVal(M, j, s.p) - s.v) < 1e-9);
        zero = act.filter((x) => !x).length === 1 ? act.indexOf(false) : -1;
      } while (s.p <= 0.02 || s.p >= 0.98 || zero < 0);
      const labels = [['Column 1', '第 1 列'], ['Column 2', '第 2 列'], ['Column 3', '第 3 列']];
      return {
        q: [`In the zero-sum game $${mtx(M)}$ (payoffs to Row), Column's optimal mix leaves one column unused. Which?`, `ゼロ和ゲーム $${mtx(M)}$（行の利得）で、列の最適な混合は一つの列を使いません。どれですか。`],
        a: { type: 'choice', opts: labels, v: zero, fixed: true },
        hint: ['Find Row’s optimal $p^*$; Column only uses columns whose lines pass through the top of the envelope.', '行の最適な $p^*$ を求めます。列が使うのは、包絡線の頂上を通る直線の列だけです。'],
        sol: [[`The envelope peaks at $p^* = ${n(s.p, 4)}$, value $${n(s.v, 4)}$.`, `包絡線は $p^* = ${n(s.p, 4)}$ で最大となり、値は $${n(s.v, 4)}$ です。`], [`Column ${zero + 1} gives Row $${n(lineVal(M, zero, s.p), 4)} > v$ there, so putting weight on it would only help Row: complementary slackness gives it probability zero.`, `第 ${zero + 1} 列はそこで行に $${n(lineVal(M, zero, s.p), 4)} > v$ を与えるので、重みを置くと行を助けるだけです。相補性により、その確率は 0 です。`]],
      };
    },
  ];
})();
