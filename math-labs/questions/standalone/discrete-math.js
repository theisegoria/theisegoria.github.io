'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { gcd } = P.util;

  /* ---------- elementary cellular automata ---------- */
  const bit = (rule, l, c, r) => (rule >> (4 * l + 2 * c + r)) & 1;
  const step = (row, rule, wrap) => row.map((_, i) => {
    const g = (j) => (wrap ? row[(j + row.length) % row.length] : (row[j] || 0));
    return bit(rule, g(i - 1), g(i), g(i + 1));
  });
  const single = (t) => { const row = Array(2 * t + 5).fill(0); row[t + 2] = 1; return row; };
  const run = (rule, t) => { let row = single(t); for (let k = 0; k < t; k++) row = step(row, rule, false); return row; };
  const live = (row) => row.reduce((a, b) => a + b, 0);
  const pop = (n) => n.toString(2).split('').filter((c) => c === '1').length;
  const bin8 = (n) => n.toString(2).padStart(8, '0');
  const mirror = (rule) => { let out = 0; for (let l = 0; l < 2; l++) for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) out |= bit(rule, r, c, l) << (4 * l + 2 * c + r); return out; };
  const conjugate = (rule) => { let out = 0; for (let l = 0; l < 2; l++) for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) out |= (1 - bit(rule, 1 - l, 1 - c, 1 - r)) << (4 * l + 2 * c + r); return out; };
  const fromFn = (fn) => { let out = 0; for (let l = 0; l < 2; l++) for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) out |= (fn(l, c, r) ? 1 : 0) << (4 * l + 2 * c + r); return out; };
  const choose = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); };

  Q['discrete-math-rules'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rule = r.int(1, 254), l = r.int(0, 1), c = r.int(0, 1), rt = r.int(0, 1);
        const idx = 4 * l + 2 * c + rt, out = bit(rule, l, c, rt);
        return {
          q: [`In elementary rule ${rule}, what does a cell with left neighbour ${l}, itself ${c} and right neighbour ${rt} become?`, `基本規則 ${rule} で、左隣が ${l}、自分が ${c}、右隣が ${rt} のセルは次に何になりますか。`],
          a: { type: 'int', v: out },
          hint: ['Write the rule number in binary; the pattern read as a binary number picks the output bit.', '規則の番号を二進数で書きます。近傍のパターンを二進数として読むと、出力のビットの位置が決まります。'],
          sol: [[`The rule in binary is ${bin8(rule)}. The pattern ${l}${c}${rt} is ${idx} in binary, so we need bit ${idx} counted from the right (the last digit is bit 0).`, `規則を二進数で書くと ${bin8(rule)} です。パターン ${l}${c}${rt} は二進数で ${idx} なので、右端を第0ビットとして第 ${idx} ビットを見ます。`], [`That bit is ${out}, so the cell becomes ${out}. The rule table lists the eight outputs from input 111 down to 000, which is the same binary digits left to right.`, `そのビットは ${out} なので、セルは ${out} になります。規則表は入力 111 から 000 の順に8つの出力を並べたもので、二進数の桁を左から右に読む順序と同じです。`]],
          set: { rule },
        };
      }
      if (form === 1) {
        const rule = r.int(1, 254);
        const ones = pop(rule);
        return {
          q: [`How many of the eight neighbourhoods $000, \\dots, 111$ produce the output 1 under rule ${rule}?`, `規則 ${rule} では、8通りの近傍 $000, \\dots, 111$ のうち、出力が 1 になるものはいくつありますか。`],
          a: { type: 'int', v: ones },
          hint: ['The rule number written in binary is the table of outputs.', '二進数で書いた規則の番号が、出力の表そのものです。'],
          sol: [[`${rule} in binary is ${bin8(rule)}.`, `${rule} を二進数で書くと ${bin8(rule)} です。`], [`It contains ${ones} ones, so ${ones} of the 8 neighbourhoods give 1. Each of the 256 rules is exactly one choice of eight output bits.`, `1 は ${ones} 個あるので、8つの近傍のうち ${ones} 個が 1 を出力します。256 個の規則は、8個の出力ビットの選び方とちょうど1対1に対応します。`]],
          set: { rule },
        };
      }
      const rule = r.int(1, 254);
      const outs = [7, 6, 5, 4, 3, 2, 1, 0].map((i) => (rule >> i) & 1);
      return {
        q: [`A rule table lists the outputs for inputs $111, 110, \\dots, 000$ as ${outs.join(' ')}. What is the rule number?`, `規則表は入力 $111, 110, \\dots, 000$ に対する出力を ${outs.join(' ')} と並べています。規則の番号はいくつですか。`],
        a: { type: 'int', v: rule },
        hint: ['Read the eight outputs as one binary number.', '8つの出力を1つの二進数として読みます。'],
        sol: [[`The binary number ${outs.join('')} equals ${rule}.`, `二進数 ${outs.join('')} は ${rule} です。`], [`The convention is that the output for $111$ is the leading digit and the output for $000$ is the last. Rule ${rule} is the rule whose output bits are exactly these.`, `入力 $111$ の出力が最上位の桁、$000$ の出力が最後の桁という約束です。この出力ビットをもつ規則が規則 ${rule} です。`]],
        set: { rule },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rule = r.int(1, 254), w = 7;
        const row = Array.from({ length: w }, () => r.int(0, 1));
        const wrap = r.chance(0.5);
        const nx = step(row, rule, wrap);
        return {
          q: [`Rule ${rule} is applied to the row ${row.join('')} (seven cells) with ${wrap ? 'the ends joined (wrap-around)' : 'cells outside the row fixed at 0'}. How many cells are 1 in the next generation?`, `規則 ${rule} を、7セルの行 ${row.join('')} に${wrap ? '両端をつないで' : '外側のセルを 0 に固定して'}適用します。次の世代で 1 のセルはいくつですか。`],
          a: { type: 'int', v: live(nx) },
          hint: ['Update each cell from its own neighbourhood in the old row, not the new one.', '各セルを、新しい行ではなく古い行の近傍から更新します。'],
          sol: [[`Rule ${rule} in binary is ${bin8(rule)}. Applying it cell by cell to ${row.join('')} gives ${nx.join('')}.`, `規則 ${rule} は二進数で ${bin8(rule)} です。${row.join('')} に1セルずつ適用すると ${nx.join('')} になります。`], [`That row has ${live(nx)} ones. All cells change together from the same old generation, so the order of updating does not matter.`, `この行の 1 は ${live(nx)} 個です。すべてのセルは同じ古い世代から一斉に更新されるので、更新の順序は関係ありません。`]],
          set: { rule },
        };
      }
      if (form === 1) {
        const t = r.int(3, 30);
        const row = run(90, t);
        const v = live(row);
        return {
          q: [`Rule 90 is started from a single 1 with 0 everywhere else. How many cells are 1 in generation ${t}? (Generation 0 is the starting row.)`, `規則 90 を、1 つの 1 とそれ以外すべて 0 の状態から始めます。第 ${t} 世代で 1 のセルはいくつですか。（第 0 世代は最初の行です。）`],
          a: { type: 'int', v },
          hint: ['Rule 90 is "left XOR right", so row $t$ is row $t$ of Pascal\'s triangle mod 2. Think about the binary digits of $t$.', '規則 90 は「左 XOR 右」なので、第 $t$ 世代はパスカルの三角形の第 $t$ 行を 2 で割った余りです。$t$ の二進表示に注目します。'],
          sol: [[`The 1s in generation $t$ sit where the binomial coefficient $\\binom{t}{k}$ is odd. By Lucas' theorem that happens for $2^{s}$ values of $k$, where $s$ is the number of ones in the binary form of $t$.`, `第 $t$ 世代の 1 は、二項係数 $\\binom{t}{k}$ が奇数になる位置にあります。リュカの定理より、その $k$ の個数は $2^{s}$ で、$s$ は $t$ の二進表示にある 1 の個数です。`], [`Here $${t} = ${t.toString(2)}_2$ has ${pop(t)} ones, so there are $2^{${pop(t)}} = ${v}$ live cells. This count is why the pattern is a nested triangle: the picture is self-similar.`, `ここで $${t} = ${t.toString(2)}_2$ には 1 が ${pop(t)} 個あるので、生きたセルは $2^{${pop(t)}} = ${v}$ 個です。この個数が、模様が入れ子の三角形、つまり自己相似になる理由です。`]],
          set: { rule: 90, rows: Math.max(10, t + 1) },
        };
      }
      const rule = r.pick([18, 22, 30, 54, 60, 90, 110, 126, 150]);
      const t = r.int(3, 9);
      const row = run(rule, t);
      return {
        q: [`Start rule ${rule} from a single 1 on a background of 0. How many cells are 1 after ${t} generations?`, `規則 ${rule} を、背景が 0 で 1 つだけ 1 の状態から始めます。${t} 世代後に 1 のセルはいくつですか。`],
        a: { type: 'int', v: live(row) },
        hint: ['Simulate row by row. Cells farther than $t$ from the start are still 0, so you only need a window of width $2t+1$.', '1行ずつ追います。出発点から距離 $t$ より遠いセルはまだ 0 なので、幅 $2t+1$ の窓で足ります。'],
        sol: [[`Starting from the single cell, applying rule ${rule} ${t} times gives a row with ${live(row)} ones.`, `1 つのセルから規則 ${rule} を ${t} 回適用すると、1 が ${live(row)} 個の行になります。`], [`The most this could be is $2t + 1 = ${2 * t + 1}$: since $f(000) = 0$, the live cells never spread farther than one cell per step.`, `最大でも $2t + 1 = ${2 * t + 1}$ 個です。$f(000) = 0$ なので、生きたセルの広がりは 1 世代につき 1 セルを超えません。`]],
        set: { rule, rows: Math.max(10, t + 1) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rule = r.int(1, 254);
        const useMirror = r.chance(0.5);
        const v = useMirror ? mirror(rule) : conjugate(rule);
        return {
          q: useMirror
            ? [`Swapping left and right in every rule table turns rule ${rule} into its mirror image. What is the mirror rule's number?`, `規則表のすべての入力で左と右を入れ替えると、規則 ${rule} は鏡像の規則になります。その規則の番号はいくつですか。`]
            : [`Swapping the roles of 0 and 1 (complementing every input and every output) turns rule ${rule} into its conjugate. What is the conjugate rule's number?`, `0 と 1 の役割を入れ替える（入力も出力もすべて反転する）と、規則 ${rule} は共役な規則になります。その規則の番号はいくつですか。`],
          a: { type: 'int', v },
          hint: useMirror ? ['Only the inputs 001 and 100, and 011 and 110, change places. Swap those outputs.', '入れ替わるのは 001 と 100、011 と 110 の出力だけです。それらを交換します。'] : ['Output for input $abc$ in the new rule is the complement of the old output for the complemented input.', '新しい規則の入力 $abc$ に対する出力は、古い規則の反転した入力に対する出力を反転したものです。'],
          sol: useMirror
            ? [[`Rule ${rule} is ${bin8(rule)}. The new output for input $lcr$ is the old output for $rcl$, so the outputs for 001 and 100 trade places, and so do 011 and 110.`, `規則 ${rule} は ${bin8(rule)} です。新しい規則の入力 $lcr$ の出力は、古い規則の入力 $rcl$ の出力なので、001 と 100、011 と 110 の出力が入れ替わります。`], [`The result is ${bin8(v)}, which is rule ${v}. It behaves as the same world reflected left to right. ${v === rule ? 'Here the rule equals its own mirror image.' : ''}`, `結果は ${bin8(v)} で、規則 ${v} です。左右を反転した同じ世界のように振る舞います。${v === rule ? 'この規則は自分自身の鏡像と等しくなります。' : ''}`]]
            : [[`Rule ${rule} is ${bin8(rule)}. Complement all inputs: the table is read in reverse order. Complement all outputs: every digit flips.`, `規則 ${rule} は ${bin8(rule)} です。入力をすべて反転すると表の読む順序が逆になり、出力をすべて反転すると各桁が反転します。`], [`Reversing and flipping gives ${bin8(v)}, which is rule ${v}. It produces the same pictures with black and white exchanged.`, `逆順にして反転すると ${bin8(v)} で、規則 ${v} です。白と黒を入れ替えた同じ図を作ります。`]],
          set: { rule },
        };
      }
      if (form === 1) {
        const fns = [
          ['left XOR centre', '左 XOR 中央', (l, c) => l ^ c],
          ['centre XOR right', '中央 XOR 右', (l, c, rt) => c ^ rt],
          ['left XOR right', '左 XOR 右', (l, c, rt) => l ^ rt],
          ['left XOR centre XOR right', '左 XOR 中央 XOR 右', (l, c, rt) => l ^ c ^ rt],
          ['left OR right', '左 OR 右', (l, c, rt) => l | rt],
          ['left AND right', '左 AND 右', (l, c, rt) => l & rt],
          ['NOT centre', '中央の NOT', (l, c) => 1 - c],
          ['the majority of the three cells', '3 セルの多数決', (l, c, rt) => (l + c + rt >= 2 ? 1 : 0)],
          ['centre OR (left AND right)', '中央 OR (左 AND 右)', (l, c, rt) => c | (l & rt)],
          ['left, unless centre and right are both 1', '左（ただし中央と右がともに 1 のときは 0）', (l, c, rt) => (c & rt ? 0 : l)],
        ];
        const it = r.pick(fns);
        const v = fromFn(it[2]);
        return {
          q: [`A cell becomes ${it[0]}. Which elementary rule number is this?`, `セルは次の世代で「${it[1]}」になります。これは基本規則の何番ですか。`],
          a: { type: 'int', v },
          hint: ['Evaluate the formula on the eight inputs $111, 110, \\dots, 000$ and read the outputs as a binary number.', '8つの入力 $111, 110, \\dots, 000$ で式を評価し、出力を二進数として読みます。'],
          sol: [[`The outputs for $111, 110, \\dots, 000$ are ${[7, 6, 5, 4, 3, 2, 1, 0].map((i) => it[2]((i >> 2) & 1, (i >> 1) & 1, i & 1) ? 1 : 0).join(' ')}.`, `入力 $111, 110, \\dots, 000$ に対する出力は ${[7, 6, 5, 4, 3, 2, 1, 0].map((i) => it[2]((i >> 2) & 1, (i >> 1) & 1, i & 1) ? 1 : 0).join(' ')} です。`], [`As a binary number this is ${bin8(v)} = ${v}. Every Boolean function of three bits is exactly one of the 256 rules.`, `二進数にすると ${bin8(v)} = ${v} です。3 ビットの論理関数は、256 個の規則のちょうど 1 つに対応します。`]],
          set: { rule: v },
        };
      }
      const m = r.int(3, 6);
      const t = Math.pow(2, m) - 1;
      const row = run(90, t);
      return {
        q: [`Rule 90 starts from a single 1. How many cells are 1 in generation $2^{${m}} - 1 = ${t}$?`, `規則 90 を 1 つだけの 1 から始めます。第 $2^{${m}} - 1 = ${t}$ 世代で 1 のセルはいくつですか。`],
        a: { type: 'int', v: live(row) },
        hint: ['Write $2^m - 1$ in binary and count its ones. Every row $\\binom{t}{k}$ is odd for $t = 2^m - 1$.', '$2^m - 1$ を二進数で書いて 1 を数えます。$t = 2^m - 1$ では $\\binom{t}{k}$ がすべて奇数です。'],
        sol: [[`${t} in binary is ${t.toString(2)}: ${m} ones. So there are $2^{${m}} = ${Math.pow(2, m)}$ live cells.`, `${t} を二進数で書くと ${t.toString(2)} で、1 が ${m} 個あります。したがって生きたセルは $2^{${m}} = ${Math.pow(2, m)}$ 個です。`], [`Every cell of the window of width $2t + 1$ whose parity fits is on: this is the bottom edge of a completed triangle in the Sierpinski pattern, the row just before the pattern splits again.`, `幅 $2t + 1$ の窓で偶奇の合うセルがすべて 1 になります。これはシェルピンスキー模様で完成した三角形の底辺、模様が再び分かれる直前の行です。`]],
        set: { rule: 90, rows: Math.max(10, t + 1) },
      };
    },
  ];

  /* ---------- counting, sets, logic and pigeonhole ---------- */
  Q['discrete-math-counting'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 4), what = r.int(0, 1);
        const v = what ? Math.pow(2, Math.pow(2, k)) : Math.pow(2, k);
        return {
          q: what ? [`A rule looks at ${k} neighbouring cell${k > 1 ? 's' : ''}, each 0 or 1. How many different rules are there?`, `規則は隣り合う ${k} 個のセル（それぞれ 0 か 1）を見ます。異なる規則は何通りありますか。`] : [`A rule looks at ${k} neighbouring cell${k > 1 ? 's' : ''}, each 0 or 1. How many different input patterns can it see?`, `規則は隣り合う ${k} 個のセル（それぞれ 0 か 1）を見ます。見える入力パターンは何通りありますか。`],
          a: { type: 'int', v },
          hint: what ? ['A rule chooses an output independently for each input pattern.', '規則は入力パターンごとに独立に出力を選びます。'] : ['Each cell is a binary choice.', '各セルは 0 か 1 の二択です。'],
          sol: what ? [[`There are $2^{${k}} = ${Math.pow(2, k)}$ input patterns.`, `入力パターンは $2^{${k}} = ${Math.pow(2, k)}$ 通りです。`], [`Each pattern gets output 0 or 1 independently, so there are $2^{${Math.pow(2, k)}} = ${v}$ rules. For $k = 3$ this is the familiar 256.`, `各パターンの出力は 0 か 1 を独立に選べるので、規則は $2^{${Math.pow(2, k)}} = ${v}$ 通りです。$k = 3$ なら、おなじみの 256 です。`]] : [[`Each of the ${k} cells has 2 states, and the choices are independent: $2^{${k}} = ${v}$.`, `${k} 個のセルはそれぞれ 2 状態で、選び方は互いに独立なので $2^{${k}} = ${v}$ 通りです。`], ['This is the number of rows in the rule table, not the number of rules.', 'これは規則表の行の数であって、規則の数ではありません。']],
        };
      }
      if (form === 1) {
        const n = 8;
        const a = Array.from({ length: n }, () => r.int(0, 1)), b = Array.from({ length: n }, () => r.int(0, 1));
        const A = a.flatMap((v, i) => (v ? [i + 1] : [])), B = b.flatMap((v, i) => (v ? [i + 1] : []));
        const I = A.filter((x) => B.includes(x));
        return {
          q: [`Two rows of 8 cells are ${a.join('')} and ${b.join('')}. Let $A$ and $B$ be the sets of positions (numbered 1 to 8 from the left) holding a 1. Find $|A \\cap B|$.`, `8 セルの 2 つの行が ${a.join('')} と ${b.join('')} です。左から 1 から 8 まで番号を付け、1 のある位置の集合を $A$、$B$ とします。$|A \\cap B|$ を求めてください。`],
          a: { type: 'int', v: I.length },
          hint: ['Write out $A$ and $B$ as lists of positions and see which positions appear in both.', '$A$ と $B$ を位置の一覧として書き、両方に現れる位置を探します。'],
          sol: [[`$A = \\{${A.join(', ')}\\}$ and $B = \\{${B.join(', ')}\\}$.`, `$A = \\{${A.join(', ')}\\}$、$B = \\{${B.join(', ')}\\}$ です。`], [`The positions in both are $\\{${I.join(', ')}\\}$, so $|A \\cap B| = ${I.length}$. A row of bits and a subset of positions carry exactly the same information.`, `両方にある位置は $\\{${I.join(', ')}\\}$ なので $|A \\cap B| = ${I.length}$ です。ビットの行と位置の部分集合は、まったく同じ情報をもっています。`]],
        };
      }
      const l = r.int(0, 1), rt = r.int(0, 1);
      return {
        q: [`In rule 90 a cell becomes 1 exactly when its two neighbours differ. The left neighbour is ${l} and the right neighbour is ${rt}. What does the cell become?`, `規則 90 では、両隣が異なるときにちょうど、セルは 1 になります。左隣が ${l}、右隣が ${rt} のとき、セルは何になりますか。`],
        a: { type: 'int', v: l ^ rt },
        hint: ['"Differ" is exclusive or.', '「異なる」は排他的論理和です。'],
        sol: [[`$${l} \\oplus ${rt} = ${l ^ rt}$.`, `$${l} \\oplus ${rt} = ${l ^ rt}$ です。`], [`The centre cell is ignored by rule 90. XOR is addition mod 2, which is why rule 90 gives Pascal's triangle mod 2.`, `規則 90 では中央のセルは無視されます。XOR は 2 を法とする足し算で、これが規則 90 がパスカルの三角形（mod 2）を作る理由です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(3, 12);
        return {
          q: [`A board has ${N} cells, each 0 or 1, with a fixed boundary rule. What is the smallest number of successive configurations (generation 0, 1, 2, ...) that guarantees two of them are equal?`, `盤面は ${N} セルで、各セルは 0 か 1、境界条件は固定です。連続する配置（第 0, 1, 2, ... 世代）が何個あれば、そのうち 2 つが必ず等しくなりますか。最小の個数を答えてください。`],
          a: { type: 'int', v: Math.pow(2, N) + 1 },
          hint: ['Count the possible configurations, then use the pigeonhole principle.', '可能な配置の個数を数え、鳩の巣原理を使います。'],
          sol: [[`There are $2^{${N}} = ${Math.pow(2, N)}$ configurations (the pigeonholes).`, `配置は $2^{${N}} = ${Math.pow(2, N)}$ 通りです（鳩の巣に当たります）。`], [`Among $2^{${N}} + 1 = ${Math.pow(2, N) + 1}$ successive configurations two must coincide, and since the rule is deterministic the history repeats from there. One fewer might not be enough, since it can visit every configuration once.`, `連続する $2^{${N}} + 1 = ${Math.pow(2, N) + 1}$ 個の配置のうち 2 つは必ず一致し、規則が決定論的なのでそこから先は繰り返しです。1 つ少ないと、すべての配置を 1 回ずつ通る場合があり、足りないかもしれません。`]],
        };
      }
      if (form === 1) {
        const preds = [
          ['f(000) = 0', 'f(000) = 0 となる', (rule) => bit(rule, 0, 0, 0) === 0],
          ['f(000) = 0 and f(111) = 0', 'f(000) = 0 かつ f(111) = 0 となる', (rule) => bit(rule, 0, 0, 0) === 0 && bit(rule, 1, 1, 1) === 0],
          ['left-right symmetric (the rule equals its mirror image)', '左右対称な（鏡像が自分自身と等しい）', (rule) => mirror(rule) === rule],
          ['totalistic (the output depends only on how many of the three cells are 1)', '全体和型の（出力が 3 セルのうち 1 のセルの個数だけで決まる）', (rule) => { const by = {}; for (let i = 0; i < 8; i++) { const s = (i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1); const o = (rule >> i) & 1; if (by[s] === undefined) by[s] = o; else if (by[s] !== o) return false; } return true; }],
          ['conjugation-invariant (the rule equals its conjugate)', '共役で不変な（共役が自分自身と等しい）', (rule) => conjugate(rule) === rule],
        ];
        const it = r.pick(preds);
        let cnt = 0; for (let rule = 0; rule < 256; rule++) if (it[2](rule)) cnt++;
        return {
          q: [`How many of the 256 elementary rules are ${it[0]}?`, `256 個の基本規則のうち、${it[1]}ものはいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Each condition ties some of the eight output bits to each other or fixes them. Count the free bits that remain: the answer is a power of 2.', '各条件は、8 個の出力ビットのいくつかを互いに結びつけるか固定します。残る自由なビットの数を数えれば、答えは 2 のべきです。'],
          sol: [[`Every rule is a choice of 8 output bits; the condition removes freedom. Checking all 256 rules, ${cnt} satisfy it.`, `規則は 8 個の出力ビットの選び方であり、条件がその自由度を減らします。256 個の規則すべてを調べると、条件を満たすものは ${cnt} 個です。`], [`${cnt} $= 2^{${Math.round(Math.log2(cnt))}}$: ${Math.round(Math.log2(cnt))} output bits remain free. Constraints on the table translate directly into a count of rules.`, `${cnt} $= 2^{${Math.round(Math.log2(cnt))}}$ で、自由なビットは ${Math.round(Math.log2(cnt))} 個です。表への制約は、そのまま規則の個数に反映されます。`]],
        };
      }
      const m = r.int(10, 60);
      return {
        q: [`A single cell is 1 at the centre of a board of $2\\cdot ${m}+1$ cells, with 0 outside, and the rule has $f(000) = 0$. After how many generations could a 1 first appear at the edge of the board? (Give the smallest possible generation.)`, `$2\\cdot ${m}+1$ セルの盤面の中央だけが 1 で、外側は 0、規則は $f(000) = 0$ を満たします。端のセルに 1 が現れうる最も早い世代はいつですか。`],
        a: { type: 'int', v: m },
        hint: ['Show by induction that after $t$ steps every 1 lies within $t$ cells of the centre.', '$t$ 世代後には、すべての 1 が中央から距離 $t$ 以内にあることを帰納法で示します。'],
        sol: [[`At generation 0 only the centre is 1. If every 1 is within $t$ cells of the centre at time $t$, a cell farther than $t + 1$ has three zero inputs, so it stays 0 (because $f(000) = 0$).`, `第 0 世代では中央だけが 1 です。時刻 $t$ にすべての 1 が中央から距離 $t$ 以内にあるなら、距離が $t + 1$ より遠いセルは入力がすべて 0 で、$f(000) = 0$ なので 0 のままです。`], [`The edge is ${m} cells from the centre, so a 1 can reach it no earlier than generation ${m}. This bound is the light cone: information travels at most one cell per generation.`, `端は中央から ${m} セル離れているので、1 が届くのは第 ${m} 世代以降です。この下限が光円錐で、情報は 1 世代に 1 セルより速く伝わりません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.int(0, 3);
        const f = [
          ['2^(2^(2*r+1))', 'rules that look at a radius-$r$ neighbourhood (the cell and $r$ cells on each side)', '半径 $r$ の近傍（そのセルと両側の $r$ 個ずつ）を見る規則', 'r', 'A radius-$r$ neighbourhood has $2r + 1$ cells, so there are $2^{2r+1}$ input patterns, and each gets an independent output bit.', '半径 $r$ の近傍は $2r + 1$ 個のセルなので、入力パターンは $2^{2r+1}$ 通りで、それぞれに独立な出力ビットがあります。', 'It grows doubly exponentially in $r$, which is why exhaustive search over rules is only possible for very small neighbourhoods.', '$r$ について二重指数的に増えるので、規則の総当たりができるのは非常に小さい近傍だけです。'],
          ['2^(N*2^N)', 'maps from the configurations of an $N$-cell board to themselves (every conceivable global update, local or not)', '$N$ セルの盤面の配置全体からそれ自身への写像（局所的かどうかを問わない、すべての大域的な更新）', 'N', 'There are $2^N$ configurations, and a map picks one of $2^N$ successors for each of them: $(2^N)^{2^N}$.', '配置は $2^N$ 通りで、写像はそれぞれに $2^N$ 通りの行き先から 1 つを選びます。$(2^N)^{2^N}$ です。', 'Almost none of these maps is a local rule applied everywhere, which is why a cellular automaton is a very special kind of dynamical system.', 'これらのほとんどは、同じ局所規則をどこにでも適用したものではありません。セル・オートマトンがきわめて特別な力学系であるのはそのためです。'],
          ['2^(2^k)', 'rules whose output depends on $k$ input bits', '出力が $k$ ビットの入力で決まる規則', 'k', 'There are $2^k$ input patterns, each with a free output bit.', '入力パターンは $2^k$ 通りで、それぞれに自由な出力ビットがあります。', 'For $k = 1$ there are 4 rules, for $k = 2$ there are 16, for $k = 3$ there are 256.', '$k = 1$ なら 4 通り、$k = 2$ なら 16 通り、$k = 3$ なら 256 通りです。'],
          ['2^(2^(2*r+1)-1)', 'radius-$r$ rules with $f(0, \\dots, 0) = 0$ (so an empty board stays empty)', '$f(0, \\dots, 0) = 0$ を満たす半径 $r$ の規則（空の盤面は空のまま）', 'r', 'One of the $2^{2r+1}$ input patterns, the all-zero one, has its output fixed at 0; the others are free.', '$2^{2r+1}$ 通りの入力のうち、すべて 0 のものは出力が 0 に固定され、残りは自由です。', 'These are exactly the rules for which the light-cone argument applies: a pattern cannot appear from nothing.', 'これらは光円錐の議論が使える規則そのものです。何もないところから模様は生まれません。'],
        ][t];
        return {
          q: [`Give the number of ${f[1]} as a formula in $${f[3]}$.`, `${f[2]}の個数を $${f[3]}$ の式で答えてください。`],
          a: { type: 'expr', v: f[0], vars: [f[3]], dom: { [f[3]]: [1, 3] }, lhs: ['Number $=$', '個数 $=$'] },
          hint: ['First count the possible inputs; then count independent choices of output.', 'まず入力の個数を数え、次に出力の独立な選び方を数えます。'],
          sol: [[f[4], f[5]], [`The count is $${P.toTeX(P.parse(f[0], [f[3]]))}$. ${f[6]}`, `個数は $${P.toTeX(P.parse(f[0], [f[3]]))}$ です。${f[7]}`]],
        };
      }
      if (form === 1) {
        const l = [], total = 512; let births = 0, survive = 0;
        for (let m = 0; m < total; m++) { const centre = (m >> 4) & 1; let n = 0; for (let i = 0; i < 9; i++) if (i !== 4) n += (m >> i) & 1; const nx = n === 3 || (centre && n === 2) ? 1 : 0; if (nx && !centre) births++; if (nx && centre) survive++; }
        const which = r.int(0, 2);
        const v = [births, survive, births + survive][which];
        return {
          q: [which === 0 ? `Among the $2^9 = 512$ possible 3 by 3 patches (centre and its 8 neighbours), how many have a dead centre that is born in the next generation?` : which === 1 ? `Among the $2^9 = 512$ possible 3 by 3 patches (centre and its 8 neighbours), how many have a live centre that survives?` : `Among the $2^9 = 512$ possible 3 by 3 patches (centre and its 8 neighbours), how many have a live centre in the next generation?`, which === 0 ? `3 × 3 の領域（中央と周囲 8 セル）は $2^9 = 512$ 通りあります。そのうち、中央が死んでいて次の世代で誕生するものはいくつですか。` : which === 1 ? `3 × 3 の領域（中央と周囲 8 セル）は $2^9 = 512$ 通りあります。そのうち、中央が生きていて生存するものはいくつですか。` : `3 × 3 の領域（中央と周囲 8 セル）は $2^9 = 512$ 通りあります。そのうち、次の世代で中央が生きているものはいくつですか。`],
          a: { type: 'int', v },
          hint: ['Count the ways to choose which of the 8 neighbours are alive: $\\binom{8}{k}$ patches have exactly $k$ live neighbours.', '周囲 8 セルのどれが生きているかの選び方を数えます。生きた隣がちょうど $k$ 個の領域は $\\binom{8}{k}$ 通りです。'],
          sol: [[which === 0 ? 'A dead centre is born with exactly 3 live neighbours: $\\binom{8}{3} = 56$.' : which === 1 ? 'A live centre survives with 2 or 3 live neighbours: $\\binom{8}{2} + \\binom{8}{3} = 28 + 56 = 84$.' : 'Births $\\binom{8}{3} = 56$ plus survivals $\\binom{8}{2} + \\binom{8}{3} = 84$.', which === 0 ? '死んだ中央は、生きた隣がちょうど 3 個のときに誕生します。$\\binom{8}{3} = 56$ 通りです。' : which === 1 ? '生きた中央は、生きた隣が 2 個か 3 個のときに生存します。$\\binom{8}{2} + \\binom{8}{3} = 28 + 56 = 84$ 通りです。' : '誕生が $\\binom{8}{3} = 56$ 通り、生存が $\\binom{8}{2} + \\binom{8}{3} = 84$ 通りです。'], [`The answer is ${v}. Out of 512 local situations, only a minority leads to a live cell, which is why random soup tends to die down at first.`, `答えは ${v} です。512 通りの局所的な状況のうち、生きたセルになるのは一部だけで、これがランダム配置が最初は減っていきやすい理由です。`]],
        };
      }
      const N = r.int(4, 9);
      return {
        q: [`A deterministic update acts on an $N = ${N}$ cell binary board. What is the largest possible period of a repeating cycle of configurations?`, `決定論的な更新が $N = ${N}$ セルの二値盤面に作用します。繰り返しの周期として、最大でいくつが可能ですか。`],
        a: { type: 'int', v: Math.pow(2, N) },
        hint: ['A cycle can contain each configuration at most once.', '周期の中に同じ配置は 2 回現れません。'],
        sol: [[`A cycle visits distinct configurations, and there are only $2^{${N}} = ${Math.pow(2, N)}$ of them.`, `周期は異なる配置を順にたどるもので、配置は $2^{${N}} = ${Math.pow(2, N)}$ 通りしかありません。`], [`So the period is at most ${Math.pow(2, N)}, attained only if the map is a single cycle through all configurations. Any real rule has the transient plus the period at most this large.`, `したがって周期は高々 ${Math.pow(2, N)} で、すべての配置を通る 1 つの周期になる写像のときだけ達成されます。現実の規則では、過渡部分と周期の合計もこれ以下です。`]],
      };
    },
  ];

  /* ---------- Game of Life ---------- */
  const lifeStep = (board, w, h, wrap) => board.map((v, i) => {
    let n = 0; const x = i % w, y = Math.floor(i / w);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      let a = x + dx, b = y + dy;
      if (wrap) { a = (a + w) % w; b = (b + h) % h; }
      if (a >= 0 && a < w && b >= 0 && b < h) n += board[b * w + a];
    }
    return +(n === 3 || (v === 1 && n === 2));
  });
  const PATTERNS = {
    block: { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], name: ['block', 'ブロック'] },
    beehive: { cells: [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2]], name: ['beehive', 'ビーハイブ'] },
    blinker: { cells: [[0, 1], [1, 1], [2, 1]], name: ['blinker', 'ブリンカー'] },
    toad: { cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]], name: ['toad', 'ヒキガエル'] },
    beacon: { cells: [[0, 0], [1, 0], [0, 1], [3, 2], [2, 3], [3, 3]], name: ['beacon', 'ビーコン'] },
    glider: { cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]], name: ['glider', 'グライダー'] },
    lwss: { cells: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]], name: ['lightweight spaceship', '軽量宇宙船'] },
  };
  const placeOn = (cells, w, h, ox, oy) => { const b = Array(w * h).fill(0); cells.forEach(([x, y]) => { b[((y + oy) % h) * w + ((x + ox) % w)] = 1; }); return b; };
  const sameShifted = (a, b, w, h, dx, dy) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] !== b[((y + dy + h) % h) * w + ((x + dx + w) % w)]) return false; return true; };
  const classify = (key) => {
    const W = 24, H = 24, b0 = placeOn(PATTERNS[key].cells, W, H, 9, 9);
    let b = b0;
    for (let p = 1; p <= 40; p++) {
      b = lifeStep(b, W, H, true);
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (sameShifted(b0, b, W, H, dx, dy)) return { period: p, dx, dy };
    }
    return null;
  };
  const CLS = {}; for (const k of Object.keys(PATTERNS)) CLS[k] = classify(k);
  const arrTeX = (rows) => `\\begin{array}{${'c'.repeat(rows[0].length)}} ${rows.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{array}`;

  Q['discrete-math-life'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const patch = Array.from({ length: 9 }, () => (r.chance(0.4) ? 1 : 0));
        const n = patch.reduce((a, b) => a + b, 0) - patch[4];
        const nx = n === 3 || (patch[4] && n === 2) ? 1 : 0;
        const rows = [patch.slice(0, 3), patch.slice(3, 6), patch.slice(6, 9)];
        return {
          q: [`A 3 by 3 patch is $${arrTeX(rows)}$ (1 is alive; the centre is the middle entry). What is the centre cell in the next generation: 1 or 0?`, `3 × 3 の領域は $${arrTeX(rows)}$ です（1 が生きている状態で、中央は真ん中の値です）。次の世代の中央のセルは 1 と 0 のどちらですか。`],
          a: { type: 'int', v: nx },
          hint: ['Count the live neighbours (not including the centre), then apply the birth and survival rules.', '生きた隣接セル（中央を除く）を数え、誕生と生存の規則を適用します。'],
          sol: [[`The centre is ${patch[4] ? 'alive' : 'dead'} and has ${n} live neighbour${n === 1 ? '' : 's'}.`, `中央は${patch[4] ? '生きていて' : '死んでいて'}、生きた隣接セルは ${n} 個です。`], [patch[4] ? `A live cell survives with 2 or 3 neighbours, so the centre becomes ${nx}.` : `A dead cell is born with exactly 3 neighbours, so the centre becomes ${nx}.`, patch[4] ? `生きたセルは隣が 2 個か 3 個のとき生存するので、中央は ${nx} になります。` : `死んだセルは隣がちょうど 3 個のとき誕生するので、中央は ${nx} になります。`]],
        };
      }
      if (form === 1) {
        const alive = r.chance(0.5), n = r.int(0, 8);
        const nx = n === 3 || (alive && n === 2) ? 1 : 0;
        return {
          q: [`A ${alive ? 'live' : 'dead'} cell has ${n} live neighbours. Is it alive in the next generation?`, `${alive ? '生きた' : '死んだ'}セルの生きた隣接セルが ${n} 個です。次の世代でそのセルは生きていますか。`],
          a: { type: 'choice', fixed: true, v: nx ? 0 : 1, opts: [['Yes, alive', 'はい、生きている'], ['No, dead', 'いいえ、死んでいる']] },
          hint: ['Birth needs exactly 3. Survival needs 2 or 3.', '誕生にはちょうど 3 個、生存には 2 個か 3 個が必要です。'],
          sol: [[alive ? `Survival needs 2 or 3 live neighbours; here there are ${n}.` : `Birth needs exactly 3 live neighbours; here there are ${n}.`, alive ? `生存には生きた隣が 2 個か 3 個必要で、ここでは ${n} 個です。` : `誕生には生きた隣がちょうど 3 個必要で、ここでは ${n} 個です。`], [nx ? 'So the cell is alive next generation.' : n < 2 ? 'Too few neighbours: death by isolation.' : n > 3 ? 'Too many neighbours: death by crowding.' : 'The conditions are not met, so the cell is dead.', nx ? 'したがって次の世代で生きています。' : n < 2 ? '隣が少なすぎるので孤立して死にます。' : n > 3 ? '隣が多すぎるので過密で死にます。' : '条件を満たさないので死んでいます。']],
        };
      }
      const key = r.pick(Object.keys(PATTERNS));
      const c = CLS[key];
      const kind = c.period === 1 && c.dx === 0 && c.dy === 0 ? 0 : (c.dx === 0 && c.dy === 0 ? 1 : 2);
      return {
        q: [`A ${PATTERNS[key].name[0]} is run on a large board. Which kind of pattern is it: a still life (never changes), an oscillator (returns in place) or a spaceship (returns shifted)?`, `${PATTERNS[key].name[1]}を大きな盤面で動かします。静止物（変化しない）、振動子（同じ場所に戻る）、宇宙船（ずれて戻る）のどれですか。`],
        a: { type: 'choice', fixed: true, v: kind, opts: [['Still life', '静止物'], ['Oscillator', '振動子'], ['Spaceship', '宇宙船']] },
        hint: ['Step it a few generations and compare with the start, allowing a shift.', '数世代進めて、ずれを許して最初の形と比べます。'],
        sol: [[`Running it shows that it first repeats after ${c.period} generation${c.period > 1 ? 's' : ''}${c.dx || c.dy ? `, shifted by (${c.dx}, ${c.dy}) cells` : ' in the same place'}.`, `実行すると、${c.period} 世代後に初めて同じ形になります。${c.dx || c.dy ? `位置は (${c.dx}, ${c.dy}) セルずれます。` : '位置は変わりません。'}`], [kind === 0 ? 'Period 1 with no motion: a fixed point of the update.' : kind === 1 ? `Period ${c.period} with no net motion: an oscillator.` : 'It repeats its shape elsewhere: a travelling pattern.', kind === 0 ? '周期 1 で動かない、更新の固定点です。' : kind === 1 ? `周期 ${c.period} で位置は変わらない、振動子です。` : '形が別の場所で繰り返される、移動するパターンです。']],
        set: PATTERNS[key].name[0] === 'glider' || key === 'blinker' || key === 'block' ? { preset: key } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const W = 5, H = 5;
        const board = Array.from({ length: W * H }, () => (r.chance(0.4) ? 1 : 0));
        const cells = [[0, 0], [4, 0], [0, 4], [4, 4], [2, 0], [0, 2]];
        const [cx, cy] = r.pick(cells);
        const wrap = r.chance(0.5);
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          let a = cx + dx, b = cy + dy;
          if (wrap) { a = (a + W) % W; b = (b + H) % H; }
          if (a >= 0 && a < W && b >= 0 && b < H) n += board[b * W + a];
        }
        const rows = Array.from({ length: H }, (_, y) => board.slice(y * W, y * W + W).map((v, x) => (x === cx && y === cy ? `\\boxed{${v}}` : v)));
        return {
          q: [`On this 5 by 5 board $${arrTeX(rows)}$ the boxed cell is in row ${cy + 1}, column ${cx + 1}. With ${wrap ? 'wrap-around edges' : 'cells outside the board counted as 0'}, how many live neighbours does it have?`, `この 5 × 5 の盤面 $${arrTeX(rows)}$ で、枠で囲んだセルは ${cy + 1} 行 ${cx + 1} 列です。${wrap ? '両端をつないだ境界' : '盤面の外を 0 とみなす境界'}のとき、生きた隣接セルはいくつですか。`],
          a: { type: 'int', v: n },
          hint: [wrap ? 'On a wrap-around board the left edge neighbours the right edge, and the top neighbours the bottom.' : 'Outside the board there are no live cells, so a corner has only three neighbours inside.', wrap ? '両端をつなぐと、左端は右端と、上端は下端と隣り合います。' : '盤面の外に生きたセルはないので、角には盤面内に隣が 3 つしかありません。'],
          sol: [[`The eight neighbours, read ${wrap ? 'with wrap-around' : 'inside the board only'}, contain ${n} ones.`, `8 個の隣接セルを${wrap ? '両端をつないで' : '盤面の内側だけで'}読むと、1 は ${n} 個です。`], [`So the cell has ${n} live neighbour${n === 1 ? '' : 's'}. The boundary rule changes the answer for cells on the edge, which is why the page lets you choose it.`, `したがって生きた隣接セルは ${n} 個です。境界の規則は端のセルの答えを変えるので、このページでは境界条件を選べるようになっています。`]],
        };
      }
      if (form === 1) {
        const W = 6, H = 6;
        let board;
        do { board = Array.from({ length: W * H }, () => (r.chance(0.35) ? 1 : 0)); } while (board.reduce((a, b) => a + b, 0) < 6);
        const nx = lifeStep(board, W, H, true);
        const rows = Array.from({ length: H }, (_, y) => board.slice(y * W, y * W + W));
        return {
          q: [`A 6 by 6 board with wrap-around edges is $${arrTeX(rows)}$. How many cells are alive in the next generation?`, `両端をつないだ 6 × 6 の盤面が $${arrTeX(rows)}$ です。次の世代で生きているセルはいくつですか。`],
          a: { type: 'int', v: nx.reduce((a, b) => a + b, 0) },
          hint: ['Count the live neighbours of every cell, remembering that edges wrap. It helps to work row by row.', 'すべてのセルの生きた隣接セルを数えます。端はつながっていることに注意し、行ごとに進めると楽です。'],
          sol: [[`Applying the birth and survival rules to all 36 cells at once gives the next board with ${nx.reduce((a, b) => a + b, 0)} live cells (from ${board.reduce((a, b) => a + b, 0)} now).`, `36 セルすべてに誕生と生存の規則を同時に適用すると、次の盤面の生きたセルは ${nx.reduce((a, b) => a + b, 0)} 個になります（現在は ${board.reduce((a, b) => a + b, 0)} 個）。`], ['The update is synchronous: every count is made on the old board, none on a half-updated one.', '更新は同期的です。数えるのはすべて古い盤面の上で、更新の途中の盤面は使いません。']],
        };
      }
      const keys = ['blinker', 'toad', 'beacon', 'glider', 'lwss', 'block'];
      const key = r.pick(keys), c = CLS[key];
      const mult = r.int(2, 6), T = c.period * mult;
      const dist = Math.max(Math.abs(c.dx), Math.abs(c.dy)) * mult;
      return {
        q: [`A ${PATTERNS[key].name[0]} is run on a very large board. After ${T} generations, how many cells has it moved in the larger of the horizontal and vertical directions? (Use 0 if it has not moved.)`, `${PATTERNS[key].name[1]}を非常に大きな盤面で動かします。${T} 世代後に、水平・垂直のうち大きいほうの方向に何セル動いていますか。（動かないなら 0 です。）`],
        a: { type: 'int', v: dist },
        hint: ['Find its period and its displacement per period, then scale up.', '周期と 1 周期あたりの移動量を見つけて、倍にします。'],
        sol: [[`It repeats every ${c.period} generation${c.period > 1 ? 's' : ''}, moving by (${c.dx}, ${c.dy}) each time.`, `${c.period} 世代ごとに同じ形になり、そのたびに (${c.dx}, ${c.dy}) 動きます。`], [`${T} generations is ${mult} periods, so it moves ${dist} cell${dist === 1 ? '' : 's'}. ${dist ? `Its speed is ${Math.max(Math.abs(c.dx), Math.abs(c.dy))}/${c.period} of a cell per generation, and no pattern can exceed one cell per generation.` : 'An oscillator or still life stays where it is.'}`, `${T} 世代は ${mult} 周期分なので、${dist} セル動きます。${dist ? `速さは 1 世代あたり ${Math.max(Math.abs(c.dx), Math.abs(c.dy))}/${c.period} セルで、どのパターンも 1 世代に 1 セルを超えられません。` : '振動子や静止物はその場にとどまります。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const Ws = [8, 10, 12, 16, 20, 24, 32], W = r.pick(Ws), H = r.pick(Ws.filter((x) => x !== W));
        const L = W * H / gcd(W, H);
        return {
          q: [`A glider moves one cell diagonally every 4 generations. On a ${W} by ${H} board with wrap-around edges, after how many generations does it first return to its starting place with its starting shape?`, `グライダーは 4 世代ごとに斜めに 1 セル進みます。両端をつないだ ${W} × ${H} の盤面で、最初の位置に最初の形で初めて戻るのは何世代後ですか。`],
          a: { type: 'int', v: 4 * L },
          hint: ['It returns only at multiples of 4 generations, and then it has moved $d$ cells both across and down. Both must be multiples of the board size.', '戻るのは 4 世代の倍数のときだけで、そのとき横にも縦にも $d$ セル動いています。どちらも盤面の大きさの倍数でなければなりません。'],
          sol: [[`After $4d$ generations it has moved $d$ cells horizontally and $d$ cells vertically. It is back exactly when $${W}$ divides $d$ and $${H}$ divides $d$.`, `$4d$ 世代後には横に $d$ セル、縦にも $d$ セル動いています。$d$ が $${W}$ でも $${H}$ でも割り切れるときにちょうど元に戻ります。`], [`The smallest such $d$ is $\\operatorname{lcm}(${W}, ${H}) = ${L}$, so the answer is $4 \\cdot ${L} = ${4 * L}$ generations. The glider has the same shape only every 4 generations (after 2 it is a reflected copy), so nothing earlier can match.`, `最小の $d$ は $\\operatorname{lcm}(${W}, ${H}) = ${L}$ なので、答えは $4 \\cdot ${L} = ${4 * L}$ 世代です。グライダーが同じ形になるのは 4 世代ごとだけです（2 世代後は鏡像）。それより早く一致することはありません。`]],
        };
      }
      const key = r.pick(['blinker', 'toad', 'beacon']);
      const c = CLS[key];
      const k = r.int(1, 12), T = k * 1;
      const same = (T % c.period) === 0;
      return {
        q: [`A ${PATTERNS[key].name[0]} (period ${c.period}) is started and run for ${T} generations. Is the board back to exactly its starting pattern?`, `${PATTERNS[key].name[1]}（周期 ${c.period}）を始めて ${T} 世代進めます。盤面はちょうど最初の形に戻っていますか。`],
        a: { type: 'choice', fixed: true, v: same ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['An oscillator is back at the start exactly when the number of generations is a multiple of its period.', '振動子が最初の形に戻るのは、世代数が周期の倍数のときだけです。'],
        sol: [[`The period is ${c.period}, and ${T} ${same ? 'is' : 'is not'} a multiple of ${c.period}${same ? '' : ` (the remainder is ${T % c.period})`}.`, `周期は ${c.period} で、${T} は ${c.period} の倍数${same ? 'です' : `ではありません（余りは ${T % c.period}）`}。`], [same ? 'So the pattern is back at its starting phase.' : 'So the board shows another phase of the cycle, not the starting pattern.', same ? 'したがって最初の位相に戻っています。' : 'したがって盤面は最初の形ではなく、周期の別の位相を示しています。']],
      };
    },
  ];

  if (typeof window !== 'undefined') {
    const host = (window.PracticeHosts ||= {});
    const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    const rules = {
      set(v) {
        const input = document.getElementById('rule'); if (!input) return;
        if (v.rule !== undefined) { input.value = String(v.rule); fire(input, 'change'); }
        if (v.rows !== undefined) { const rows = document.getElementById('rows'); if (rows) { rows.value = String(Math.min(100, v.rows)); fire(rows, 'input'); } }
        const seed = document.getElementById('seed'); if (seed && seed.value !== 'single') { seed.value = 'single'; fire(seed, 'change'); }
        document.getElementById('eca')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      },
    };
    host['discrete-math-rules'] = rules;
    host['discrete-math-life'] = {
      set(v) {
        const sel = document.getElementById('preset'); if (!sel || v.preset === undefined) return;
        sel.value = v.preset; fire(sel, 'change');
        document.getElementById('life-board')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      },
    };
  }
})();
