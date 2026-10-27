'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;

  // ---------- machines (the same tables as the experiment) ----------
  const MACHINES = [
    { blank: '_', start: 'R', rules: { 'R,0': ['0', 1, 'R'], 'R,1': ['1', 1, 'R'], 'R,_': ['_', -1, 'C'], 'C,1': ['0', -1, 'C'], 'C,0': ['1', -1, 'H'], 'C,_': ['1', -1, 'H'] }, states: ['R', 'C'], symbols: ['0', '1', '_'] },
    { blank: '0', start: 'A', rules: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', -1, 'B'], 'B,0': ['1', -1, 'A'], 'B,1': ['1', 1, 'H'] }, states: ['A', 'B'], symbols: ['0', '1'] },
    { blank: '0', start: 'A', rules: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', -1, 'B'], 'B,0': ['1', -1, 'A'], 'B,1': ['0', -1, 'C'], 'C,0': ['1', 1, 'H'], 'C,1': ['1', -1, 'D'], 'D,0': ['1', 1, 'D'], 'D,1': ['0', 1, 'A'] }, states: ['A', 'B', 'C', 'D'], symbols: ['0', '1'] },
    { blank: '_', start: 'P', rules: { 'P,1': ['1', 1, 'P'], 'P,_': ['1', 1, 'Q'], 'Q,1': ['1', 1, 'Q'], 'Q,_': ['_', -1, 'E'], 'E,1': ['_', -1, 'H'] }, states: ['P', 'Q', 'E'], symbols: ['1', '_'] },
  ];
  const NAME = [['the binary increment machine', '二進数に 1 を足す機械'], ['the two-state busy beaver', '2 状態のビジービーバー'], ['the four-state busy beaver', '4 状態のビジービーバー'], ['the unary adder', '一進数の足し算の機械']];
  function run(m, tape, max = 2000) {
    const T = new Map(); [...tape].forEach((c, i) => { if (c !== m.blank) T.set(i, c); });
    let head = 0, state = m.start; const hist = [{ T: new Map(T), head, state }];
    for (let s = 0; s < max && state !== 'H'; s++) {
      const r = m.rules[`${state},${T.get(head) ?? m.blank}`]; if (!r) break;
      if (r[0] === m.blank) T.delete(head); else T.set(head, r[0]);
      head += r[1]; state = r[2]; hist.push({ T: new Map(T), head, state });
    }
    return hist;
  }
  const ones = (T) => [...T.values()].filter((c) => c === '1').length;
  const tapeStr = (T, lo, hi, blank) => { let s = ''; for (let i = lo; i <= hi; i++) s += T.get(i) ?? blank; return s; };
  const mv = (d) => (d > 0 ? ['right', '右'] : ['left', '左']);
  const stName = (s) => (s === 'H' ? ['halt', '停止'] : [`state ${s}`, `状態 ${s}`]);
  const LAST = [run(MACHINES[0], '10111').length - 1, run(MACHINES[1], '').length - 1, run(MACHINES[2], '').length - 1, run(MACHINES[3], '111_11').length - 1];

  Q.turing = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mi = r.pick([1, 2, 2]), m = MACHINES[mi], key = r.pick(Object.keys(m.rules)), [w, d, nx] = m.rules[key], [st, sym] = key.split(',');
        const others = m.states.concat(['H']).filter((s) => s !== nx);
        const say = (ww, dd, nn) => [`write ${ww}, move ${mv(dd)[0]}, then ${stName(nn)[0]}`, `${ww} を書き、${mv(dd)[1]}へ動き、${nn === 'H' ? '停止' : `状態 ${nn} へ`}`];
        const opts = [say(w, d, nx), say(w, -d, nx), say(w === '1' ? '0' : '1', d, nx), say(w, d, r.pick(others))];
        return {
          q: [`In ${NAME[mi][0]}, the head is in state ${st} and reads ${sym}. What does the machine do?`, `${NAME[mi][1]}で、ヘッドが状態 ${st} にあり ${sym} を読んでいます。機械は何をしますか。`],
          a: { type: 'choice', opts, v: 0 },
          hint: ['Find the row of the state and the column of the symbol in the transition table.', '遷移表で、状態の行と記号の列を探してください。'],
          sol: [[`The table entry for (${st}, ${sym}) is ${w} ${d > 0 ? 'R' : 'L'} ${nx === 'H' ? 'halt' : nx}.`, `(${st}, ${sym}) の欄は ${w} ${d > 0 ? 'R' : 'L'} ${nx === 'H' ? '停止' : nx} です。`], ['Every step is exactly this: one lookup, one write, one move, one change of state. Nothing else is remembered.', 'どのステップもこれだけです。表を一度引き、一度書き、一度動き、状態を一度変えます。それ以外は何も覚えていません。']],
          set: { machine: mi },
        };
      }
      if (form === 1) {
        let x; do { x = r.int(5, 62); } while (x === 23 && r.chance(0.5));
        const bin = x.toString(2), h = run(MACHINES[0], bin), last = h[h.length - 1];
        const lo = Math.min(...last.T.keys()), out = parseInt(tapeStr(last.T, lo, Math.max(...last.T.keys()), '_'), 2);
        return {
          q: [`The binary increment machine starts on the tape ${bin} with the head on the leftmost digit. When it halts, what number does the tape hold (in decimal)?`, `二進数に 1 を足す機械が、テープ ${bin} の左端の桁にヘッドを置いて始めます。停止したとき、テープはどの数を表していますか（10 進で）。`],
          a: { type: 'int', v: out },
          hint: ['Read the input in binary first.', 'まず入力を二進数として読んでください。'],
          sol: [[`$${bin}_2 = ${x}$.`, `$${bin}_2 = ${x}$ です。`], [`The machine runs to the right end, then turns trailing 1s into 0s and the first 0 into a 1: the tape becomes ${tapeStr(last.T, lo, Math.max(...last.T.keys()), '_')}, which is $${out}$.`, `機械は右端まで進み、末尾の 1 を 0 に変え、最初の 0 を 1 にします。テープは ${tapeStr(last.T, lo, Math.max(...last.T.keys()), '_')} となり、$${out}$ を表します。`]],
          set: x === 23 ? { machine: 0, step: LAST[0] } : { machine: 0 },
        };
      }
      const a = r.int(1, 6), b = r.int(1, 6), h = run(MACHINES[3], '1'.repeat(a) + '_' + '1'.repeat(b)), k = ones(h[h.length - 1].T);
      return {
        q: [`The unary adder starts on ${'1'.repeat(a)}␣${'1'.repeat(b)} (␣ is a blank). How many 1s are on the tape when it halts?`, `一進数の足し算の機械が ${'1'.repeat(a)}␣${'1'.repeat(b)}（␣ は空白）から始めます。停止したとき、テープには 1 がいくつありますか。`],
        a: { type: 'int', v: k },
        hint: ['In unary a number is written as that many 1s.', '一進法では、数はその個数の 1 で書かれます。'],
        sol: [[`The tape holds ${a} and ${b}. The machine fills the gap with a 1, giving ${a + b + 1} ones, then erases the last one.`, `テープには ${a} と ${b} があります。機械はすき間を 1 で埋めて ${a + b + 1} 個にし、最後の 1 を消します。`], [`So ${k} ones remain: the tape now spells $${a} + ${b} = ${k}$ in unary.`, `残る 1 は ${k} 個で、テープは一進法で $${a} + ${b} = ${k}$ を表します。`]],
        set: a === 3 && b === 2 ? { machine: 3, step: LAST[3] } : { machine: 3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mi = r.pick([1, 2, 2]), h = run(MACHINES[mi], ''), k = r.int(3, mi === 1 ? 6 : 24), c = h[k], what = r.int(0, 1);
        const lo = Math.min(0, ...[...c.T.keys()]), hi = Math.max(0, ...[...c.T.keys()]);
        return {
          q: what ? [`Run ${NAME[mi][0]} from a blank tape. After ${k} steps, where is the head, measured in cells from its starting cell (right positive)?`, `${NAME[mi][1]}を空白のテープから動かします。${k} ステップ後、ヘッドは出発したマスから何マスの位置にありますか（右を正とします）。`] : [`Run ${NAME[mi][0]} from a blank tape. How many 1s are on the tape after ${k} steps?`, `${NAME[mi][1]}を空白のテープから動かします。${k} ステップ後、テープ上に 1 はいくつありますか。`],
          a: { type: 'int', v: what ? c.head : ones(c.T) },
          hint: ['Step through the table by hand, keeping the tape, the head and the state.', 'テープ、ヘッド、状態を書き留めながら、表を手で一歩ずつたどってください。'],
          sol: [[`Following the table, after ${k} steps the machine is in ${stName(c.state)[0]} and the tape (from cell ${lo}) reads ${tapeStr(c.T, lo, hi, '0')}.`, `表に従うと、${k} ステップ後の機械は${c.state === 'H' ? '停止' : `状態 ${c.state}`}にあり、テープ（マス ${lo} から）は ${tapeStr(c.T, lo, hi, '0')} です。`], [what ? `The head is at cell ${c.head}.` : `That is ${ones(c.T)} ones; the space-time diagram shows the same column at step ${k}.`, what ? `ヘッドはマス ${c.head} にあります。` : `1 は ${ones(c.T)} 個で、時空図のステップ ${k} の列が同じものを示しています。`]],
          set: { machine: mi, step: k },
        };
      }
      if (form === 1) {
        const x = r.int(5, 120), bin = x.toString(2), steps = run(MACHINES[0], bin).length - 1;
        const t = bin.length - bin.replace(/1+$/, '').length;
        return {
          q: [`How many steps does the binary increment machine take on the input ${bin}, starting on the leftmost digit, until it halts?`, `二進数に 1 を足す機械は、左端の桁から入力 ${bin} を処理して停止するまでに何ステップかかりますか。`],
          a: { type: 'int', v: steps },
          hint: ['Count the three phases: running right, carrying left, writing the final 1.', '右へ進む、左へ繰り上げる、最後の 1 を書く、の三つの段階を数えてください。'],
          sol: [[`Running right over the ${bin.length} digits and stepping back from the blank takes ${bin.length} + 1 steps.`, `${bin.length} 桁の上を右へ進み、空白から一歩戻るのに ${bin.length} + 1 ステップかかります。`], [`There ${t === 1 ? 'is 1 trailing 1' : `are ${t} trailing 1s`} to turn into 0s, then one step writes the 1 and halts: ${bin.length} + 1 + ${t} + 1 = ${steps}.`, `末尾の 1 が ${t} 個あり、それを 0 に変えたあと、1 ステップで 1 を書いて停止します。${bin.length} + 1 + ${t} + 1 = ${steps} です。`], ['The time grows with the length of the input, not with the size of the number: adding 1 to a billion takes about 30 steps.', 'かかる時間は数の大きさではなく入力の長さとともに増えます。10 億に 1 を足しても 30 ステップほどです。']],
          set: x === 23 ? { machine: 0, step: steps } : { machine: 0 },
        };
      }
      const a = r.int(1, 7), b = r.int(1, 7), steps = run(MACHINES[3], '1'.repeat(a) + '_' + '1'.repeat(b)).length - 1;
      return {
        q: [`How many steps does the unary adder take on ${'1'.repeat(a)}␣${'1'.repeat(b)}, starting on the leftmost 1?`, `一進数の足し算の機械は、左端の 1 から ${'1'.repeat(a)}␣${'1'.repeat(b)} を処理するのに何ステップかかりますか。`],
        a: { type: 'int', v: steps },
        hint: ['The head walks right across everything once, then makes two more moves.', 'ヘッドは全体を一度右へ横切り、そのあと二回動きます。'],
        sol: [[`State P crosses the ${a} ones (${a} steps) and fills the gap (1 step); state Q crosses the ${b} ones (${b} steps) and steps back from the blank (1 step).`, `状態 P が ${a} 個の 1 を横切り（${a} ステップ）、すき間を埋めます（1 ステップ）。状態 Q が ${b} 個の 1 を横切り（${b} ステップ）、空白から一歩戻ります（1 ステップ）。`], [`State E erases the last 1 and halts (1 step): ${a} + 1 + ${b} + 1 + 1 = ${steps}.`, `状態 E が最後の 1 を消して停止します（1 ステップ）。${a} + 1 + ${b} + 1 + 1 = ${steps} です。`]],
        set: a === 3 && b === 2 ? { machine: 3, step: steps } : { machine: 3 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const allOnes = r.chance(0.35);
        // verify the formula against the machine on a few inputs before asking
        const ok = [[5, 2], [4, 1], [6, 3]].every(([nn, t]) => run(MACHINES[0], '1'.repeat(nn - t - 1) + '0' + '1'.repeat(t)).length - 1 === nn + t + 2) && run(MACHINES[0], '1111').length - 1 === 10;
        if (!ok) throw new Error('binary increment model changed');
        return allOnes ? {
          q: ['The binary increment machine is given $n$ ones, $11\\cdots1$, with the head on the left. Write the number of steps until it halts as a function of $n$.', '二進数に 1 を足す機械に $n$ 個の 1、$11\\cdots1$ を与え、ヘッドを左端に置きます。停止するまでのステップ数を $n$ の式で表してください。'],
          a: { type: 'expr', v: '2n+2', vars: ['n'], dom: { n: [1, 9] }, lhs: ['$\\text{steps} =$', '$\\text{steps} =$'] },
          hint: ['Every digit is a trailing 1, and the final 1 is written on the blank to the left.', 'すべての桁が末尾の 1 で、最後の 1 は左側の空白に書かれます。'],
          sol: [['Running right and stepping back takes $n + 1$ steps.', '右へ進んで一歩戻るのに $n + 1$ ステップかかります。'], ['All $n$ ones become 0 (that is $n$ steps), then the blank on the left becomes 1 and the machine halts (1 step).', '$n$ 個の 1 がすべて 0 になり（$n$ ステップ）、左の空白が 1 になって停止します（1 ステップ）。'], ['Total $2n + 2$, the worst case for $n$ digits: $2^n - 1$ becomes $2^n$, and the number grows a digit.', '合計 $2n + 2$ で、$n$ 桁での最悪の場合です。$2^n - 1$ が $2^n$ になり、桁が一つ増えます。']],
          set: { machine: 0 },
        } : {
          q: ['The binary increment machine gets an $n$-digit input that ends in exactly $t$ ones (and has a 0 before them). Write the number of steps until it halts in terms of $n$ and $t$.', '二進数に 1 を足す機械に、ちょうど $t$ 個の 1 で終わる（その前に 0 がある）$n$ 桁の入力を与えます。停止するまでのステップ数を $n$ と $t$ の式で表してください。'],
          a: { type: 'expr', v: 'n+t+2', vars: ['n', 't'], dom: { n: [4, 9], t: [0, 3] }, lhs: ['$\\text{steps} =$', '$\\text{steps} =$'] },
          hint: ['Count the run to the right, the carries, and the final write separately.', '右への移動、繰り上げ、最後の書き込みを別々に数えてください。'],
          sol: [['Running right over $n$ digits and stepping back from the blank: $n + 1$ steps.', '$n$ 桁を右へ進み、空白から一歩戻るまでで $n + 1$ ステップです。'], ['Each of the $t$ trailing ones becomes 0: $t$ steps. The 0 before them becomes 1 and the machine halts: 1 step.', '末尾の $t$ 個の 1 がそれぞれ 0 になるのに $t$ ステップ、その前の 0 が 1 になって停止するのに 1 ステップです。'], ['So $n + t + 2$. Averaged over all inputs $t$ is about 1, so incrementing costs about $n + 3$ steps, almost all of it the walk to the end.', 'よって $n + t + 2$ です。入力全体で平均すると $t$ は約 1 なので、1 を足す手間はおよそ $n + 3$ ステップで、ほとんどが端まで歩く分です。']],
          set: { machine: 0 },
        };
      }
      if (form === 1) {
        const ok = run(MACHINES[3], '111_11').length - 1 === 8;
        if (!ok) throw new Error('unary model changed');
        return {
          q: ['Write the number of steps the unary adder takes on $m$ ones, a blank, then $k$ ones, as a function of $m$ and $k$.', '一進数の足し算の機械が、$m$ 個の 1、空白、$k$ 個の 1 を処理するステップ数を、$m$ と $k$ の式で表してください。'],
          a: { type: 'expr', v: 'm+k+3', vars: ['m', 'k'], dom: { m: [1, 8], k: [1, 8] }, lhs: ['$\\text{steps} =$', '$\\text{steps} =$'] },
          hint: ['Every cell of the input is crossed once, plus a fixed number of extra moves.', '入力のどのマスも一度ずつ横切り、それに決まった回数の動きが加わります。'],
          sol: [['P crosses $m$ ones and fills the gap: $m + 1$ steps. Q crosses $k$ ones and steps back: $k + 1$ steps.', 'P が $m$ 個の 1 を横切ってすき間を埋めるのに $m + 1$ ステップ、Q が $k$ 個の 1 を横切って一歩戻るのに $k + 1$ ステップです。'], ['E erases one 1 and halts: 1 step. Total $m + k + 3$.', 'E が 1 を一つ消して停止するのに 1 ステップ。合計 $m + k + 3$ です。'], ['Linear time: unary addition is cheap, but unary itself is exponentially longer than binary, so the input is the expensive part.', '線形時間です。一進法の足し算は安価ですが、一進法そのものが二進法より指数的に長いので、入力のほうが高くつきます。']],
          set: { machine: 3, step: 8 },
        };
      }
      if (form === 2) {
        const k = r.int(1, 3), count = (4 * (k + 1)) ** (2 * k);
        return {
          q: [`How many different transition tables are there for Turing machines with ${k} working state${k > 1 ? 's' : ''} (plus a halt state), two symbols, and moves L or R?`, `作業状態が ${k} 個（と停止状態）、記号が二つ、移動が L か R のチューリング機械の遷移表は何通りありますか。`],
          a: { type: 'int', v: count },
          hint: ['Count the table entries, then the choices for each entry.', '表の欄の数と、各欄の選び方の数を数えてください。'],
          sol: [[`There are ${k} × 2 = ${2 * k} entries (state, symbol read).`, `欄は (状態, 読んだ記号) の組で ${k} × 2 = ${2 * k} 個です。`], [`Each entry chooses a symbol to write (2), a move (2) and a next state (${k + 1}, counting halt): ${4 * (k + 1)} choices. So $${4 * (k + 1)}^{${2 * k}} = ${count.toLocaleString('en-US').replace(/,/g, '{,}')}$.`, `各欄は書く記号（2 通り）、移動（2 通り）、次の状態（停止を含め ${k + 1} 通り）を選ぶので ${4 * (k + 1)} 通りです。よって $${4 * (k + 1)}^{${2 * k}} = ${count.toLocaleString('en-US').replace(/,/g, '{,}')}$ です。`], ['Finitely many machines for each size, so the busy beaver maximum exists; it is finding which of them halt that is impossible in general.', '大きさごとに機械は有限個なので、ビジービーバーの最大値は存在します。一般に不可能なのは、そのうちどれが停止するかを見分けることです。']],
        };
      }
      return {
        q: ['Suppose a program could compute $S(n)$, the largest number of steps taken by any halting $n$-state machine started on a blank tape. How would that decide halting for $n$-state machines on a blank tape?', '空白のテープから始めて停止する $n$ 状態の機械がとる最大のステップ数 $S(n)$ を計算するプログラムがあったとします。それを使うと、空白のテープ上の $n$ 状態の機械の停止をどう判定できますか。'],
        a: { type: 'choice', opts: [['Run the machine for $S(n)$ steps: if it has not halted by then, it never will.', '機械を $S(n)$ ステップ動かす。それまでに停止しなければ、決して停止しない。'], ['Run it until it writes $\\Sigma(n)$ ones, the busy beaver score.', 'ビジービーバーの得点である $\\Sigma(n)$ 個の 1 を書くまで動かす。'], ['Run it until a configuration repeats; a halting machine never repeats one.', '構成が繰り返されるまで動かす。停止する機械は構成を繰り返さない。'], ['It would not help: $S(n)$ grows too fast to be useful.', '役に立たない。$S(n)$ は増え方が速すぎて使えない。']], v: 0 },
        hint: ['$S(n)$ is an upper bound on the running time of every halting machine of that size.', '$S(n)$ は、その大きさの停止するすべての機械の実行時間の上界です。'],
        sol: [['Any $n$-state machine that halts does so within $S(n)$ steps, by definition of the maximum. So running for $S(n)$ steps settles the question.', '最大値の定義により、停止する $n$ 状態の機械はすべて $S(n)$ ステップ以内に停止します。だから $S(n)$ ステップ動かせば決着がつきます。'], ['Counting ones does not bound time, a looping machine need not repeat a configuration on an infinite tape, and how fast $S$ grows is irrelevant to whether it can be computed.', '1 の個数は時間を抑えません。無限のテープでは、ループする機械が構成を繰り返すとは限りません。また $S$ がどれだけ速く増えるかは、計算できるかどうかとは関係ありません。'], ['Since this blank-tape halting problem is undecidable, $S$ cannot be computable: it eventually outgrows every computable function.', '空白テープの停止問題は決定不能なので、$S$ は計算可能ではありえません。$S$ はやがてどんな計算可能関数よりも大きくなります。']],
        set: { machine: 2, step: LAST[2] },
      };
    },
  ];

  // ---------- 2. the diagonal argument ----------
  function haltTable(nn, seed) { let a = seed * 9301 + 49297; const R = () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; return Array.from({ length: nn }, () => Array.from({ length: nn }, () => R() < 0.55)); }
  const sym = (h) => (h ? '\\checkmark' : '\\infty');
  const tabTeX = (tab) => `\\begin{array}{c|${'c'.repeat(tab.length)}} & ${tab.map((_, j) => j).join(' & ')} \\\\ \\hline ${tab.map((row, i) => `P_${i} & ${row.map(sym).join(' & ')}`).join(' \\\\ ')}\\end{array}`;
  const rowStr = (row) => row.map((h) => (h ? '✓' : '∞')).join(' ');
  Q.halting = [
    (r) => {
      const size = r.int(4, 6), seed = r.int(1, 40), tab = haltTable(size, seed), diag = tab.map((row, i) => row[i]);
      if (r.chance(0.5)) {
        const loops = diag.filter((h) => !h).length;
        return {
          q: [`The table below says which program halts (✓) or runs forever (∞) on which input. On how many of the inputs $0, \\dots, ${size - 1}$ does $D$ halt? $${tabTeX(tab)}$`, `下の表は、どのプログラムがどの入力で停止する（✓）か永遠に動く（∞）かを示しています。入力 $0, \\dots, ${size - 1}$ のうち、$D$ が停止するのはいくつですか。$${tabTeX(tab)}$`],
          a: { type: 'int', v: loops },
          hint: ['$D$ on input $j$ does the opposite of $P_j$ on input $j$: only the diagonal matters.', '入力 $j$ に対する $D$ は、入力 $j$ に対する $P_j$ の逆を行います。関係するのは対角線だけです。'],
          sol: [[`The diagonal reads ${rowStr(diag)}.`, `対角線は ${rowStr(diag)} です。`], [`$D$ halts exactly where the diagonal says ∞: ${loops} input${loops === 1 ? '' : 's'}.`, `$D$ が停止するのは対角線が ∞ の所だけで、${loops} 個です。`]],
          set: { size, seed },
        };
      }
      const j = r.int(0, size - 1);
      return {
        q: [`In the table below, ✓ means halts and ∞ means runs forever. What does $D$ do on input ${j}? $${tabTeX(tab)}$`, `下の表で ✓ は停止、∞ は永遠に動くことを表します。入力 ${j} に対して $D$ はどうしますか。$${tabTeX(tab)}$`],
        a: { type: 'choice', opts: [['It halts', '停止する'], ['It runs forever', '永遠に動く']], v: diag[j] ? 1 : 0, fixed: true },
        hint: [`Look only at the cell $(P_${j}, ${j})$.`, `マス $(P_${j}, ${j})$ だけを見てください。`],
        sol: [[`$P_${j}$ on input ${j}: ${diag[j] ? 'halts' : 'runs forever'}.`, `入力 ${j} に対する $P_${j}$ は${diag[j] ? '停止します' : '永遠に動きます'}。`], [`$D$ does the opposite, so it ${diag[j] ? 'runs forever' : 'halts'}. The rest of row ${j} plays no part.`, `$D$ はその逆なので${diag[j] ? '永遠に動きます' : '停止します'}。第 ${j} 行のほかの欄は関係しません。`]],
        set: { size, seed },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        let size, seed, tab, opts;
        for (let tries = 0; tries < 50; tries++) {
          size = r.int(4, 6); seed = r.int(1, 40); tab = haltTable(size, seed);
          const diag = tab.map((row, i) => row[i]), anti = tab.map((row, i) => row[size - 1 - i]);
          opts = [diag.map((h) => !h), diag, tab[0].map((h) => !h), anti.map((h) => !h)].map(rowStr);
          if (new Set(opts).size === 4) break;
        }
        return {
          q: [`For this table (✓ halts, ∞ runs forever), which row is $D$, the program that does the opposite of $P_j$ on input $j$? $${tabTeX(tab)}$`, `この表（✓ は停止、∞ は永遠に動く）で、入力 $j$ に対して $P_j$ の逆を行うプログラム $D$ の行はどれですか。$${tabTeX(tab)}$`],
          a: { type: 'choice', opts: opts.map((o) => [o, o]), v: 0 },
          hint: ['Read the diagonal from top left to bottom right, then flip every entry.', '左上から右下へ対角線を読み、すべての欄を反転してください。'],
          sol: [[`The diagonal is ${opts[1]}; flipped, it is ${opts[0]}.`, `対角線は ${opts[1]} で、反転すると ${opts[0]} です。`], ['The other options are the unflipped diagonal, the flipped first row and the flipped anti-diagonal. The flipped diagonal is the only row guaranteed to differ from every $P_i$, at column $i$.', 'ほかの選択肢は、反転しない対角線、第 0 行の反転、反対角線の反転です。どの $P_i$ とも列 $i$ で必ず異なるのは、反転した対角線だけです。']],
          set: { size, seed },
        };
      }
      const size = r.int(2, 7), count = 2 ** (size * size);
      return {
        q: [`With ${size} programs and ${size} inputs, how many different ✓/∞ tables are possible, and in how many of them does $D$ appear as one of the rows? Give the number of tables.`, `プログラムが ${size} 個、入力が ${size} 個のとき、✓/∞ の表は何通りありえますか。また、そのうち $D$ が行のどれかとして現れるのはいくつですか。表の数を答えてください。`],
        a: { type: 'int', v: count },
        hint: ['Each cell is independently ✓ or ∞.', '各マスは独立に ✓ か ∞ です。'],
        sol: [[`There are ${size}² = ${size * size} cells with 2 choices each: $2^{${size * size}} = ${count.toLocaleString('en-US').replace(/,/g, '{,}')}$ tables.`, `マスは ${size}² = ${size * size} 個で、それぞれ 2 通りなので $2^{${size * size}} = ${count.toLocaleString('en-US').replace(/,/g, '{,}')}$ 通りです。`], ['In none of them is $D$ a row: row $i$ and $D$ always disagree in column $i$. That is the whole argument, checked on every table at once.', 'どの表でも $D$ はどの行とも一致しません。第 $i$ 行と $D$ は必ず列 $i$ で食い違うからです。これが論証のすべてで、すべての表について一度に確かめられます。']],
        set: size >= 4 ? { size } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const dec = r.pick([
          ['Does a given program halt within 1000 steps on input 0?', '与えられたプログラムは入力 0 に対して 1000 ステップ以内に停止するか。', 'Simulate for 1000 steps and look: a bounded search always finishes.', '1000 ステップ模倣して見ればよい。有界な探索は必ず終わります。'],
          ['Does a given finite automaton accept at least one string?', '与えられた有限オートマトンは少なくとも一つの文字列を受理するか。', 'Search the finite state graph for a path from the start to an accepting state.', '有限の状態グラフで、開始状態から受理状態への道を探せばよい。'],
          ['Is a given number the Gödel number of a well-formed formula?', '与えられた数は整論理式のゲーデル数か。', 'Factorise, decode the symbols and check the grammar: every step is a finite computation.', '素因数分解して記号を復号し、文法を確かめればよい。どの段階も有限の計算です。'],
        ]);
        const und = r.sample([
          ['Does a given program ever print a 1 when started on a blank tape?', '与えられたプログラムは、空白のテープから始めていつか 1 を出力するか。'],
          ['Do two given programs compute the same function?', '与えられた二つのプログラムは同じ関数を計算するか。'],
          ['Does a given program halt on every input?', '与えられたプログラムはすべての入力で停止するか。'],
          ['Is the function computed by a given program constant?', '与えられたプログラムが計算する関数は定数か。'],
          ['Does a given program halt on input 0?', '与えられたプログラムは入力 0 で停止するか。'],
        ], 3);
        return {
          q: ['Which of these problems is decidable?', '次の問題のうち、決定可能なものはどれですか。'],
          a: { type: 'choice', opts: [[dec[0], dec[1]], ...und], v: 0 },
          hint: ['A problem is decidable when some program always halts with the right answer. Look for one where the search is bounded.', '問題が決定可能とは、必ず停止して正しく答えるプログラムがあることです。探索が有界なものを探してください。'],
          sol: [[dec[2], dec[3]], ['The other three ask about the unbounded behaviour of arbitrary programs. Each would let you decide halting, and by Rice\'s theorem no non-trivial property of the function a program computes is decidable.', 'ほかの三つは任意のプログラムの際限のない振る舞いを問うものです。どれも停止問題を判定することにつながり、ライスの定理によれば、プログラムが計算する関数の自明でない性質はどれも決定不能です。']],
        };
      }
      if (form === 1) return {
        q: ['You are given a decider $E$ for "does program $P$ halt on the empty input?". How do you use it to decide whether $P$ halts on input $x$?', '「プログラム $P$ は空の入力で停止するか」を判定する $E$ が与えられています。これを使って、$P$ が入力 $x$ で停止するかをどう判定しますか。'],
        a: { type: 'choice', opts: [['Build $P_x$, which ignores its input and runs $P$ on $x$; ask $E$ about $P_x$.', '入力を無視して $x$ 上で $P$ を動かすプログラム $P_x$ を作り、$P_x$ について $E$ に尋ねる。'], ['Ask $E$ about $P$; if $P$ halts on the empty input it halts on $x$ too.', '$P$ について $E$ に尋ねる。空の入力で停止するなら $x$ でも停止する。'], ['Run $P$ on $x$ and ask $E$ only if it has not halted after a while.', '$P$ を $x$ 上で動かし、しばらくして停止しなければ $E$ に尋ねる。'], ['It cannot be done: halting on one input says nothing about halting on others.', 'できない。一つの入力での停止は、ほかの入力での停止について何も語らない。']], v: 0 },
        hint: ['Turn the pair $(P, x)$ into a single program with no input.', '組 $(P, x)$ を、入力のない一つのプログラムに変えてください。'],
        sol: [['$P_x$ is easily built from $P$ and $x$: it writes $x$ on the tape and then behaves like $P$. It halts on the empty input exactly when $P$ halts on $x$.', '$P_x$ は $P$ と $x$ から簡単に作れます。テープに $x$ を書き、あとは $P$ のように振る舞います。$P_x$ が空の入力で停止するのは、$P$ が $x$ で停止するときに限ります。'], ['So $E$ would decide the general halting problem; since that is impossible, $E$ cannot exist either. This is a reduction: it moves undecidability from one problem to another.', 'よって $E$ があれば一般の停止問題が判定できてしまいます。それは不可能なので $E$ も存在しえません。これが帰着で、決定不能性をある問題から別の問題へ移します。']],
      };
      const s = r.pick([2, 3, 4, 10]), k = r.int(3, s === 10 ? 4 : 6), count = (s ** (k + 1) - 1) / (s - 1);
      return {
        q: [`Programs are written as strings over an alphabet of ${s} symbols. How many strings have length at most ${k} (including the empty string)?`, `プログラムは ${s} 文字のアルファベットの文字列として書かれます。長さ ${k} 以下の文字列（空文字列を含む）はいくつありますか。`],
        a: { type: 'int', v: count },
        hint: ['Add up the strings of each length $0, 1, \\dots, k$.', '長さ $0, 1, \\dots, k$ ごとの文字列の数を足してください。'],
        sol: [[`There are $${s}^{\\ell}$ strings of length $\\ell$, so the total is $\\sum_{\\ell=0}^{${k}} ${s}^{\\ell} = \\dfrac{${s}^{${k + 1}} - 1}{${s - 1}} = ${count}$.`, `長さ $\\ell$ の文字列は $${s}^{\\ell}$ 個なので、合計は $\\sum_{\\ell=0}^{${k}} ${s}^{\\ell} = \\dfrac{${s}^{${k + 1}} - 1}{${s - 1}} = ${count}$ です。`], ['Listing programs by length, then alphabetically, numbers them $P_0, P_1, P_2, \\dots$: there are countably many. The diagonal argument shows the functions from inputs to {halt, loop} cannot be listed, so most of them are computed by no program at all.', 'プログラムを長さ順、次に辞書順に並べると $P_0, P_1, P_2, \\dots$ と番号が付くので、可算個です。対角線論法は入力から {停止, ループ} への関数の全体が並べられないことを示すので、そのほとんどはどのプログラムにも計算されません。']],
      };
    },
  ];

  // ---------- 3. Gödel numbering ----------
  const CODES = { '¬': 1, '∨': 2, '→': 3, '∀': 4, '=': 5, '0': 6, 'S': 7, '(': 8, ')': 9, ',': 10, '+': 11, '×': 12, 'x': 13, 'y': 17 };
  const TEXSYM = { '¬': '\\neg', '∨': '\\lor', '→': '\\to', '∀': '\\forall', '×': '\\times', '(': '(', ')': ')', ',': ',', '+': '+', '=': '=', '0': '0', 'S': 'S', 'x': 'x', 'y': 'y' };
  const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
  const PRESETS = [['0', '=', '0'], ['S', '0', '+', 'S', '0', '=', 'S', 'S', '0'], ['¬', '(', '0', '=', 'S', '0', ')'], ['∀', 'x', '(', 'x', '=', 'x', ')']];
  const FORMULAS = [['0', '=', '0'], ['S', '0'], ['x', '=', 'y'], ['¬', '0'], ['0', '+', '0'], ['S', 'x'], ['x', '=', '0'], ['0', '=', 'S'], ['S', '=', '0'], ['¬', 'x'], ['0', '×', '0'], ['(', '0', ')'], ['y', '=', 'x'], ['x', '+', 'S']];
  const god = (seq) => seq.reduce((g, s, i) => g * BigInt(PR[i]) ** BigInt(CODES[s]), 1n);
  const fTeX = (seq) => seq.map((s) => TEXSYM[s]).join('\\,');
  const fTxt = (seq) => seq.join(' ');
  const factTeX = (seq) => seq.map((s, i) => `${PR[i]}^{${CODES[s]}}`).join('\\cdot ');
  const big = (g) => g.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  const SAFE = BigInt(Number.MAX_SAFE_INTEGER);
  const presetIndex = (seq) => PRESETS.findIndex((p) => p.join('') === seq.join(''));
  Q.godel = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let seq; do { seq = r.pick(FORMULAS); } while (god(seq) > SAFE);
        const g = god(seq), pi = presetIndex(seq);
        return {
          q: [`With the codes $c(${TEXSYM[seq[0]]}) = ${CODES[seq[0]]}$${[...new Set(seq.slice(1))].filter((s) => s !== seq[0]).map((s) => `, $c(${TEXSYM[s]}) = ${CODES[s]}$`).join('')}, what is the Gödel number of the string $${fTeX(seq)}$?`, `記号の番号を $c(${TEXSYM[seq[0]]}) = ${CODES[seq[0]]}$${[...new Set(seq.slice(1))].filter((s) => s !== seq[0]).map((s) => `、$c(${TEXSYM[s]}) = ${CODES[s]}$`).join('')} とします。文字列 $${fTeX(seq)}$ のゲーデル数を求めてください。`],
          a: { type: 'int', v: Number(g) },
          hint: ['The $k$-th symbol contributes the $k$-th prime raised to its code.', '$k$ 番目の記号は、$k$ 番目の素数のその番号乗を寄与します。'],
          sol: [[`$\\ulcorner ${fTeX(seq)} \\urcorner = ${factTeX(seq)}$.`, `$\\ulcorner ${fTeX(seq)} \\urcorner = ${factTeX(seq)}$ です。`], [`$= ${big(g)}$. Factorising gives back the exponents in order, and so the string.`, `$= ${big(g)}$ です。素因数分解すると指数が順に戻り、文字列が復元されます。`]],
          set: pi >= 0 ? { formula: pi } : undefined,
        };
      }
      if (form === 1) {
        const pi = r.int(0, 3), seq = PRESETS[pi], k = r.int(1, seq.length);
        return {
          q: [`In the Gödel number of $${fTeX(seq)}$, what is the exponent of the prime $${PR[k - 1]}$?`, `$${fTeX(seq)}$ のゲーデル数で、素数 $${PR[k - 1]}$ の指数はいくつですか。`],
          a: { type: 'int', v: CODES[seq[k - 1]] },
          hint: [`$${PR[k - 1]}$ is prime number ${k}, so it carries symbol ${k}.`, `$${PR[k - 1]}$ は ${k} 番目の素数なので、${k} 番目の記号を担います。`],
          sol: [[`Symbol ${k} of the string is $${TEXSYM[seq[k - 1]]}$.`, `文字列の ${k} 番目の記号は $${TEXSYM[seq[k - 1]]}$ です。`], [`Its code is ${CODES[seq[k - 1]]}, so $${PR[k - 1]}^{${CODES[seq[k - 1]]}}$ divides the number exactly.`, `その番号は ${CODES[seq[k - 1]]} なので、$${PR[k - 1]}^{${CODES[seq[k - 1]]}}$ がちょうど数を割り切ります。`]],
          set: { formula: pi },
        };
      }
      let seq; do { seq = r.pick(FORMULAS); } while (seq.length < 2 || new Set(seq).size < 2);
      const rev = seq.slice().reverse(), alt = seq.map((s) => (s === '0' ? 'S' : s === 'S' ? '0' : s === 'x' ? 'y' : s === 'y' ? 'x' : s === '=' ? '+' : s === '+' ? '=' : s));
      const swap = seq.length > 2 ? [seq[1], seq[0], ...seq.slice(2)] : [seq[0], seq[0]];
      const cands = [seq, rev, alt, swap].map(fTxt), uniq = [...new Set(cands)];
      const opts = uniq.map((s) => [`$${fTeX(s.split(' '))}$`, `$${fTeX(s.split(' '))}$`]);
      if (opts.length < 2) opts.push([`$${fTeX(['¬', ...seq])}$`, `$${fTeX(['¬', ...seq])}$`]);
      return {
        q: [`A Gödel number factorises as $${factTeX(seq)}$. Which string does it encode? (Codes: $\\neg 1$, $= 5$, $0\\ 6$, $S\\ 7$, $+\\ 11$, $\\times\\ 12$, $x\\ 13$, $y\\ 17$, $(\\ 8$, $)\\ 9$.)`, `あるゲーデル数は $${factTeX(seq)}$ と素因数分解されます。どの文字列を表していますか（番号：$\\neg 1$、$= 5$、$0\\ 6$、$S\\ 7$、$+\\ 11$、$\\times\\ 12$、$x\\ 13$、$y\\ 17$、$(\\ 8$、$)\\ 9$）。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Read the exponents in the order of the primes $2, 3, 5, \\dots$', '素数 $2, 3, 5, \\dots$ の順に指数を読んでください。'],
        sol: [[`The exponents in prime order are ${seq.map((s) => CODES[s]).join(', ')}.`, `素数の順に並べた指数は ${seq.map((s) => CODES[s]).join(', ')} です。`], [`Decoding each gives $${fTeX(seq)}$. The order lives in which prime carries which exponent, so reading it backwards is a different string.`, `それぞれを復号すると $${fTeX(seq)}$ です。順序はどの素数がどの指数を担うかに表れているので、逆から読むと別の文字列になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const usePreset = r.chance(0.6);
        let seq, pi = -1;
        if (usePreset) { pi = r.int(0, 3); seq = PRESETS[pi]; } else { const pool = Object.keys(CODES); seq = Array.from({ length: r.int(4, 7) }, () => r.pick(pool)); }
        const g = god(seq), digits = g.toString().length, lg = seq.reduce((s, c, i) => s + CODES[c] * Math.log10(PR[i]), 0);
        return {
          q: [`How many decimal digits does the Gödel number of the string $${fTeX(seq)}$ have? It is $${factTeX(seq)}$.`, `文字列 $${fTeX(seq)}$ のゲーデル数は 10 進で何桁ですか。ゲーデル数は $${factTeX(seq)}$ です。`],
          a: { type: 'int', v: digits },
          hint: ['A positive number $N$ has $\\lfloor \\log_{10} N \\rfloor + 1$ digits, and logarithms turn the product into a sum.', '正の数 $N$ の桁数は $\\lfloor \\log_{10} N \\rfloor + 1$ で、対数をとると積は和になります。'],
          sol: [[`$\\log_{10} N = \\sum c_k\\log_{10} p_k = ${n(lg, 4)}$.`, `$\\log_{10} N = \\sum c_k\\log_{10} p_k = ${n(lg, 4)}$ です。`], [`So $N$ has $\\lfloor ${n(lg, 4)} \\rfloor + 1 = ${digits}$ digits.`, `よって $N$ は $\\lfloor ${n(lg, 4)} \\rfloor + 1 = ${digits}$ 桁です。`], ['Gödel numbers are huge but entirely ordinary numbers: their size is no obstacle to arithmetic talking about them.', 'ゲーデル数は巨大ですが、まったく普通の数です。大きさは、算術がそれについて語る妨げにはなりません。']],
          set: pi >= 0 ? { formula: pi } : undefined,
        };
      }
      if (form === 1) {
        let seq; do { seq = r.pick(FORMULAS); } while (god(seq) > SAFE || seq.length < 2);
        const g = god(seq), rev = seq.slice().reverse();
        const opts = [[`$${fTeX(seq)}$`, `$${fTeX(seq)}$`]];
        if (fTxt(rev) !== fTxt(seq)) opts.push([`$${fTeX(rev)}$`, `$${fTeX(rev)}$`]);
        const near = seq.map((s, i) => (i === 0 ? (s === 'S' ? '0' : 'S') : s)); opts.push([`$${fTeX(near)}$`, `$${fTeX(near)}$`]);
        const longer = [...seq, '0']; opts.push([`$${fTeX(longer)}$`, `$${fTeX(longer)}$`]);
        return {
          q: [`Decode the Gödel number $${big(g)}$. (Codes: $\\neg 1$, $= 5$, $0\\ 6$, $S\\ 7$, $+\\ 11$, $\\times\\ 12$, $x\\ 13$, $y\\ 17$, $(\\ 8$, $)\\ 9$.)`, `ゲーデル数 $${big(g)}$ を復号してください（番号：$\\neg 1$、$= 5$、$0\\ 6$、$S\\ 7$、$+\\ 11$、$\\times\\ 12$、$x\\ 13$、$y\\ 17$、$(\\ 8$、$)\\ 9$）。`],
          a: { type: 'choice', opts, v: 0 },
          hint: ['Divide by 2 as often as you can, then by 3, then by 5, counting each time.', '2 で割れるだけ割り、次に 3、次に 5 で割って、それぞれの回数を数えてください。'],
          sol: [[`$${big(g)} = ${factTeX(seq)}$.`, `$${big(g)} = ${factTeX(seq)}$ です。`], [`The exponents ${seq.map((s) => CODES[s]).join(', ')} decode to $${fTeX(seq)}$. Unique factorisation means no other string has this number.`, `指数 ${seq.map((s) => CODES[s]).join(', ')} を復号すると $${fTeX(seq)}$ です。素因数分解の一意性により、ほかの文字列がこの数をもつことはありません。`]],
        };
      }
      const pi = r.int(0, 3), seq = PRESETS[pi], k = seq.length;
      return {
        q: [`The Gödel number of a formula is divisible by $${PR[k - 1]}$ but not by $${PR[k]}$. How many symbols does the formula have?`, `ある式のゲーデル数は $${PR[k - 1]}$ で割り切れますが、$${PR[k]}$ では割り切れません。式の記号はいくつですか。`],
        a: { type: 'int', v: k },
        hint: ['Every code is at least 1, so every prime up to the last symbol\'s appears.', '番号はどれも 1 以上なので、最後の記号までのすべての素数が現れます。'],
        sol: [[`$${PR[k - 1]}$ is prime number ${k} and $${PR[k]}$ is prime number ${k + 1}.`, `$${PR[k - 1]}$ は ${k} 番目の素数、$${PR[k]}$ は ${k + 1} 番目の素数です。`], [`Since no code is 0, there are no gaps: the string has exactly ${k} symbols, for instance $${fTeX(seq)}$.`, `番号に 0 はないので抜けがなく、文字列はちょうど ${k} 個の記号からなります。たとえば $${fTeX(seq)}$ です。`]],
        set: { formula: pi },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pi = r.int(0, 3), seq = PRESETS[pi], k = seq.length, s = r.pick(['0', 'S', '=', ')', 'x']), ratio = PR[k] ** CODES[s];
        return {
          q: [`$\\ulcorner\\varphi\\urcorner$ is the Gödel number of $\\varphi = ${fTeX(seq)}$. By what factor does it grow when the symbol $${TEXSYM[s]}$ (code ${CODES[s]}) is appended at the end?`, `$\\ulcorner\\varphi\\urcorner$ は $\\varphi = ${fTeX(seq)}$ のゲーデル数です。末尾に記号 $${TEXSYM[s]}$（番号 ${CODES[s]}）を付け加えると、何倍になりますか。`],
          a: { type: 'int', v: ratio },
          hint: [`The new symbol is symbol number ${k + 1}.`, `新しい記号は ${k + 1} 番目の記号です。`],
          sol: [[`$\\varphi$ has ${k} symbols, so the new one is carried by prime number ${k + 1}, which is $${PR[k]}$.`, `$\\varphi$ は ${k} 個の記号からなるので、新しい記号は ${k + 1} 番目の素数 $${PR[k]}$ が担います。`], [`The factor is $${PR[k]}^{${CODES[s]}} = ${big(BigInt(ratio))}$.`, `倍率は $${PR[k]}^{${CODES[s]}} = ${big(BigInt(ratio))}$ です。`], ['Concatenation is a simple arithmetic operation on Gödel numbers. That is what lets formulas about numbers express "this string is that string followed by a symbol", and in the end "this is a proof".', '連結はゲーデル数の上の簡単な算術演算です。だからこそ、数についての式が「この文字列はあの文字列に記号を付けたもの」を、ひいては「これは証明である」を表せます。']],
          set: { formula: pi },
        };
      }
      if (form === 1) {
        const bad = r.int(0, 1), seq = r.pick(FORMULAS.filter((f) => f.length === 3)), e = seq.map((s) => CODES[s]);
        const valid = [r.pick(FORMULAS.filter((f) => f.length === 2)), r.pick(FORMULAS.filter((f) => f.length === 3 && f.join('') !== seq.join(''))), seq].map((f) => `2^{${CODES[f[0]]}}\\cdot 3^{${CODES[f[1]]}}${f[2] ? `\\cdot 5^{${CODES[f[2]]}}` : ''}`);
        const badTeX = bad === 0 ? `2^{${e[0]}}\\cdot 5^{${e[2]}}` : `2^{${e[0]}}\\cdot 3^{${r.pick([14, 15, 16])}}`;
        const uniqValid = [...new Set(valid)].slice(0, 3);
        return {
          q: ['Which of these numbers is not the Gödel number of any string of symbols? (Codes used: 1 to 13 and 17.)', '次の数のうち、どの記号列のゲーデル数でもないものはどれですか（使う番号は 1 から 13 と 17）。'],
          a: { type: 'choice', opts: [[`$${badTeX}$`, `$${badTeX}$`], ...uniqValid.map((t) => [`$${t}$`, `$${t}$`])], v: 0 },
          hint: ['A Gödel number uses the first $k$ primes with no gaps, and every exponent must be a code.', 'ゲーデル数は最初の $k$ 個の素数を抜けなく使い、指数はどれも記号の番号でなければなりません。'],
          sol: [[bad === 0 ? `$${badTeX}$ skips the prime 3: symbol 2 would have code 0, which no symbol has.` : `$${badTeX}$ has exponent ${badTeX.match(/3\^\{(\d+)\}/)[1]} on the prime 3, and no symbol has that code.`, bad === 0 ? `$${badTeX}$ は素数 3 を飛ばしています。2 番目の記号の番号が 0 になりますが、番号 0 の記号はありません。` : `$${badTeX}$ では素数 3 の指数が ${badTeX.match(/3\^\{(\d+)\}/)[1]} ですが、その番号の記号はありません。`], ['The others decode symbol by symbol. So the set of Gödel numbers is itself decidable: factorise and check, which is the first step in making syntax arithmetical.', 'ほかの数は記号ごとに復号できます。したがってゲーデル数の集合そのものは決定可能で、素因数分解して確かめればよいのです。これが構文を算術化する第一歩です。']],
        };
      }
      const pi = r.int(0, 3), seq = PRESETS[pi], k = seq.length, g = god(seq), d = g.toString().length, t = r.pick([2, 3]);
      const dd = (BigInt(g) ** BigInt(t)).toString().length;
      return {
        q: [`$\\ulcorner\\varphi\\urcorner$ for $\\varphi = ${fTeX(seq)}$ has ${d} digits. Repeating $\\varphi$ ${t} times in a row gives a string with ${t * k} symbols. Is its Gödel number $\\ulcorner\\varphi\\urcorner^{${t}}$?`, `$\\varphi = ${fTeX(seq)}$ の $\\ulcorner\\varphi\\urcorner$ は ${d} 桁です。$\\varphi$ を ${t} 回続けて並べると記号 ${t * k} 個の文字列になります。そのゲーデル数は $\\ulcorner\\varphi\\urcorner^{${t}}$ ですか。`],
        a: { type: 'choice', opts: [['No: the copies use new primes, so the number is far larger', 'いいえ。写しは新しい素数を使うので、数はずっと大きくなる'], ['Yes: concatenation multiplies the numbers', 'はい。連結すると数は掛け算される'], ['Yes, up to reordering of the primes', 'はい。素数の並べ替えを除けば同じ'], ['No: it is $t\\,\\ulcorner\\varphi\\urcorner$', 'いいえ。$t\\,\\ulcorner\\varphi\\urcorner$ になる']], v: 0, fixed: true },
        hint: ['Which primes carry symbols ' + (k + 1) + ' to ' + (t * k) + '?', `${k + 1} 番目から ${t * k} 番目の記号を担うのはどの素数ですか。`],
        sol: [[`$\\ulcorner\\varphi\\urcorner^{${t}}$ (${dd} digits) only raises the exponents of the first ${k} primes: it encodes a ${k}-symbol string with codes multiplied by ${t}.`, `$\\ulcorner\\varphi\\urcorner^{${t}}$（${dd} 桁）は最初の ${k} 個の素数の指数を大きくするだけで、番号を ${t} 倍した ${k} 記号の文字列を表します。`], [`The repeated string puts the second copy on the primes $${PR[k]}, \\dots, ${PR[2 * k - 1]}$, so its number is much larger. The order of the symbols is carried by which prime holds which exponent; multiplying numbers loses it.`, `繰り返した文字列では、二つ目の写しが素数 $${PR[k]}, \\dots, ${PR[2 * k - 1]}$ に載るので、数はずっと大きくなります。記号の順序はどの素数がどの指数を担うかに表れていて、数を掛け合わせるとそれが失われます。`]],
        set: { formula: pi },
      };
    },
  ];
})();
