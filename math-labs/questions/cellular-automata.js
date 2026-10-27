'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const commas = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');

  // ---------- elementary rules ----------
  const bit = (rule, k) => (rule >> k) & 1;
  const stepRow = (row, rule) => row.map((_, i) => bit(rule, 4 * row[(i - 1 + row.length) % row.length] + 2 * row[i] + row[(i + 1) % row.length]));
  const mirror = (rule) => { let m = 0; for (let k = 0; k < 8; k++) { const a = (k >> 2) & 1, b = (k >> 1) & 1, c = k & 1; if (bit(rule, k)) m |= 1 << (4 * c + 2 * b + a); } return m; };
  const complement = (rule) => { let m = 0; for (let k = 0; k < 8; k++) if (!bit(rule, k)) m |= 1 << (7 - k); return m; };
  const outputs = (rule) => [7, 6, 5, 4, 3, 2, 1, 0].map((k) => bit(rule, k)).join('');
  const NB = ['111', '110', '101', '100', '011', '010', '001', '000'];
  const popcount = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const FAMOUS = [30, 90, 110, 184, 150, 54, 18, 60, 102, 126, 22, 45, 73, 105];
  const rowTeX = (row) => row.join('\\,');

  Q['elementary-ca'] = [
    (r) => {
      const form = r.int(0, 2), rule = r.chance(0.5) ? r.pick(FAMOUS) : r.int(1, 254);
      if (form === 0) return {
        q: [`A rule sends the neighbourhoods $111, 110, 101, 100, 011, 010, 001, 000$ to $${outputs(rule).split('').join(', ')}$ in that order. What is its Wolfram rule number?`, `あるルールは近傍 $111, 110, 101, 100, 011, 010, 001, 000$ をこの順に $${outputs(rule).split('').join(', ')}$ に写します。ウルフラムのルール番号はいくつですか。`],
        a: { type: 'int', v: rule },
        hint: ['Read the eight outputs as a binary number, $111$ first.', '八つの出力を、$111$ を先頭にした二進数として読んでください。'],
        sol: [[`$${outputs(rule)}_2 = ${[7, 6, 5, 4, 3, 2, 1, 0].filter((k) => bit(rule, k)).map((k) => 2 ** k).join(' + ') || '0'} = ${rule}$.`, `$${outputs(rule)}_2 = ${[7, 6, 5, 4, 3, 2, 1, 0].filter((k) => bit(rule, k)).map((k) => 2 ** k).join(' + ') || '0'} = ${rule}$ です。`], ['The output for neighbourhood $abc$ is the bit worth $2^{4a+2b+c}$, so the rule number is the rule table written as a number.', '近傍 $abc$ の出力は $2^{4a+2b+c}$ の位の桁なので、ルール番号はルール表をそのまま数として書いたものです。']],
        set: { rule },
      };
      if (form === 1) {
        const k = r.int(0, 7), nb = NB[7 - k];
        return {
          q: [`Under rule ${rule}, what does a cell become if it and its neighbours read $${nb}$?`, `ルール ${rule} で、セルとその両隣が $${nb}$ のとき、セルは次に何になりますか。`],
          a: { type: 'int', v: bit(rule, k) },
          hint: [`Write ${rule} in binary and find the bit worth $2^{${k}}$.`, `${rule} を二進数で書き、$2^{${k}}$ の位の桁を探してください。`],
          sol: [[`$${rule} = ${outputs(rule)}_2$, listing the outputs for $111$ down to $000$.`, `$${rule} = ${outputs(rule)}_2$ で、これは $111$ から $000$ までの出力を並べたものです。`], [`$${nb}$ is $${k}$ in binary, so the output is bit ${k} (counting from the right, from 0): ${bit(rule, k)}.`, `$${nb}$ は二進で $${k}$ なので、出力は右から数えて第 ${k} 桁（0 から数えます）の ${bit(rule, k)} です。`]],
          set: { rule },
        };
      }
      return {
        q: [`For how many of the eight neighbourhoods does rule ${rule} output 1?`, `ルール ${rule} が 1 を出力する近傍は、八つのうちいくつですか。`],
        a: { type: 'int', v: popcount(rule) },
        hint: ['Count the 1 bits of the rule number.', 'ルール番号の二進表示の 1 を数えてください。'],
        sol: [[`$${rule} = ${outputs(rule)}_2$ has ${popcount(rule)} ones.`, `$${rule} = ${outputs(rule)}_2$ には 1 が ${popcount(rule)} 個あります。`], [`So Langton's $\\lambda = ${popcount(rule)}/8$. ${popcount(rule) === 4 ? 'Balanced rules like this include most of the interesting ones, though $\\lambda$ alone does not decide the behaviour.' : popcount(rule) < 4 ? 'Low $\\lambda$ tends to let patterns die out, though not always.' : 'High $\\lambda$ tends to fill the row, though not always.'}`, `よってラングトンの $\\lambda = ${popcount(rule)}/8$ です。${popcount(rule) === 4 ? 'このような均衡したルールには興味深いものが多く含まれますが、$\\lambda$ だけで振る舞いが決まるわけではありません。' : popcount(rule) < 4 ? '$\\lambda$ が小さいとパターンは消えやすい傾向がありますが、いつもではありません。' : '$\\lambda$ が大きいと行は埋まりやすい傾向がありますが、いつもではありません。'}`]],
        set: { rule },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rule = r.pick(FAMOUS); let row; do { row = Array.from({ length: 8 }, () => (r.chance(0.45) ? 1 : 0)); } while (row.every((x) => !x));
        const next = stepRow(row, rule);
        return {
          q: [`A ring of 8 cells reads $${rowTeX(row)}$ (the ends are neighbours). After one step of rule ${rule}, how many cells are 1?`, `8 個のセルの環が $${rowTeX(row)}$ となっています（両端は隣どうしです）。ルール ${rule} で一ステップ進めると、1 のセルはいくつになりますか。`],
          a: { type: 'int', v: next.reduce((s, x) => s + x, 0) },
          hint: [`Rule ${rule} is $${outputs(rule)}_2$: the outputs for $111, 110, \\dots, 000$. Remember to wrap around at the ends.`, `ルール ${rule} は $${outputs(rule)}_2$ で、$111, 110, \\dots, 000$ に対する出力です。両端で折り返すのを忘れないでください。`],
          sol: [[`The neighbourhoods are ${row.map((_, i) => `$${row[(i + 7) % 8]}${row[i]}${row[(i + 1) % 8]}$`).join(', ')}.`, `近傍は ${row.map((_, i) => `$${row[(i + 7) % 8]}${row[i]}${row[(i + 1) % 8]}$`).join('、')} です。`], [`Looking each up gives the next row $${rowTeX(next)}$, with ${next.reduce((s, x) => s + x, 0)} ones.`, `それぞれを表で引くと次の行は $${rowTeX(next)}$ で、1 は ${next.reduce((s, x) => s + x, 0)} 個です。`]],
          set: { rule, init: 1 },
        };
      }
      if (form === 1) {
        const t = r.int(5, 100), s = popcount(t);
        return {
          q: [`Rule 90 starts from a single live cell. How many cells are alive at time $t = ${t}$?`, `ルール 90 を一つの生きたセルから始めます。時刻 $t = ${t}$ に生きているセルはいくつですか。`],
          a: { type: 'int', v: 2 ** s },
          hint: ['Rule 90 is $x_{i-1} \\oplus x_{i+1}$, so row $t$ is row $t$ of Pascal\'s triangle mod 2, spread out.', 'ルール 90 は $x_{i-1} \\oplus x_{i+1}$ なので、第 $t$ 行は（間をあけて並べた）パスカルの三角形 mod 2 の第 $t$ 行です。'],
          sol: [[`The live cells at time $t$ are the odd binomial coefficients $\\binom{t}{k}$.`, `時刻 $t$ に生きているセルは、奇数の二項係数 $\\binom{t}{k}$ に対応します。`], [`By Lucas' theorem there are $2^{s(t)}$ of them, where $s(t)$ counts the 1s of $t$ in binary: $${t} = ${t.toString(2)}_2$ has ${s}, so $2^{${s}} = ${2 ** s}$.`, `リュカの定理によりその個数は $2^{s(t)}$ で、$s(t)$ は $t$ の二進表示の 1 の個数です。$${t} = ${t.toString(2)}_2$ には ${s} 個あるので $2^{${s}} = ${2 ** s}$ です。`], ['That is why the Sierpinski triangle thins out just before each power of 2 and is nearly empty right at it.', 'シェルピンスキーの三角形が 2 のべきの直前で込み合い、ちょうど 2 のべきの行でほとんど空になるのはこのためです。']],
          set: { rule: 90, init: 0, rows: Math.min(140, Math.max(30, Math.ceil((t + 1) / 10) * 10)) },
        };
      }
      const rule = r.int(1, 254), which = r.int(0, 1), ans = which ? complement(rule) : mirror(rule);
      return {
        q: [which ? `What is the rule number of the complement of rule ${rule} (swap 0 and 1 in inputs and outputs)?` : `What is the rule number of the mirror image of rule ${rule} (swap the left and right neighbours)?`, which ? `ルール ${rule} の補ルール（入力と出力の 0 と 1 を入れ替えたもの）の番号はいくつですか。` : `ルール ${rule} の鏡像（左右の隣を入れ替えたもの）のルール番号はいくつですか。`],
        a: { type: 'int', v: ans },
        hint: [which ? 'The new output for $abc$ is $1 - f(\\bar a\\bar b\\bar c)$.' : 'The new output for $abc$ is the old output for $cba$.', which ? '$abc$ に対する新しい出力は $1 - f(\\bar a\\bar b\\bar c)$ です。' : '$abc$ に対する新しい出力は、$cba$ に対する元の出力です。'],
        sol: [[`Rule ${rule}: outputs $${outputs(rule)}$ for $111, \\dots, 000$.`, `ルール ${rule} の出力は $111, \\dots, 000$ に対して $${outputs(rule)}$ です。`], [which ? `Complementing reverses the list and flips every bit: $${outputs(ans)}$.` : `Only $110 \\leftrightarrow 011$ and $100 \\leftrightarrow 001$ swap; the palindromes stay: $${outputs(ans)}$.`, which ? '補をとると並びが逆になり、すべての桁が反転します。$' + outputs(ans) + '$ です。' : `入れ替わるのは $110 \\leftrightarrow 011$ と $100 \\leftrightarrow 001$ だけで、回文の近傍はそのままです。$${outputs(ans)}$ です。`], [`That is rule ${ans}${ans === rule ? ', the rule itself: it is symmetric under this operation' : ''}. Its diagram is the same as rule ${rule}'s ${which ? 'with black and white swapped' : 'flipped left to right'}.`, `これはルール ${ans} です${ans === rule ? '（ルール自身で、この操作について対称です）' : ''}。その図はルール ${rule} の図を${which ? '白黒反転' : '左右反転'}したものです。`]],
        set: { rule },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const v = r.int(0, 2);
        const ask = [['only reflection', '鏡映だけ', 2, (256 + 64) / 2, '$\\tfrac12(256 + 2^6) = 160$'], ['only complementation', '補をとる操作だけ', 2, (256 + 16) / 2, '$\\tfrac12(256 + 2^4) = 136$'], ['reflection and complementation together', '鏡映と補をとる操作の両方', 4, 88, '$\\tfrac14(256 + 64 + 16 + 16) = 88$']][v];
        return {
          q: [`Count the elementary rules up to ${ask[0]}: how many classes are there?`, `${ask[1]}で移り合うものを同じとみなすと、基本ルールはいくつの類に分かれますか。`],
          a: { type: 'int', v: ask[3] },
          hint: ['Burnside: the number of orbits is the average number of rules fixed by each symmetry.', 'バーンサイドの補題：軌道の数は、各対称性が固定するルールの数の平均です。'],
          sol: [['The identity fixes all 256 rules. Reflection fixes a rule when the outputs for $110, 011$ agree and those for $100, 001$ agree: $2^6 = 64$. Complementation pairs the 8 neighbourhoods into 4 and fixes $2^4 = 16$; so does the product.', '恒等変換は 256 個のルールすべてを固定します。鏡映がルールを固定するのは $110, 011$ の出力が等しく、$100, 001$ の出力も等しいときで $2^6 = 64$ 個です。補をとる操作は 8 個の近傍を 4 組に分け、$2^4 = 16$ 個を固定します。両方の合成も同じく 16 個です。'], [`Averaging over the ${ask[2]} group elements: ${ask[4]}.`, `${ask[2]} 個の群の元で平均すると ${ask[4]} です。`]],
        };
      }
      if (form === 1) {
        const v = r.pick([[2, 2, false], [3, 1, false], [2, 1, true], [2, 2, true], [3, 1, true], [4, 1, true]]);
        const [k, rad, tot] = v, inputs = tot ? (k - 1) * (2 * rad + 1) + 1 : k ** (2 * rad + 1), count = k ** inputs;
        return {
          q: [tot ? `How many totalistic rules are there with ${k} states and radius ${rad} (the new state depends only on the sum of the ${2 * rad + 1} cells)?` : `How many rules are there with ${k} states and radius ${rad} (neighbourhoods of ${2 * rad + 1} cells)?`, tot ? `状態が ${k} 個、半径 ${rad} の総和型ルール（新しい状態が ${2 * rad + 1} 個のセルの和だけで決まるもの）はいくつありますか。` : `状態が ${k} 個、半径 ${rad}（${2 * rad + 1} 個のセルの近傍）のルールはいくつありますか。`],
          a: { type: 'int', v: count },
          hint: ['Count the possible inputs first; a rule chooses one output for each.', 'まず入力の種類を数えます。ルールはそれぞれに出力を一つ選びます。'],
          sol: [[tot ? `The sum of ${2 * rad + 1} cells with values ${k === 2 ? '0 or 1' : `$0, \\dots, ${k - 1}$`} takes ${inputs} values.` : `There are $${k}^{${2 * rad + 1}} = ${inputs}$ neighbourhoods.`, tot ? `値が ${k === 2 ? '0 か 1' : `$0, \\dots, ${k - 1}$`} の ${2 * rad + 1} 個のセルの和は ${inputs} 通りの値をとります。` : `近傍は $${k}^{${2 * rad + 1}} = ${inputs}$ 通りです。`], [`Each gets one of ${k} outputs: $${k}^{${inputs}} = ${commas(count)}$ rules.`, `それぞれに ${k} 通りの出力があるので、ルールは $${k}^{${inputs}} = ${commas(count)}$ 個です。`], [tot ? 'Totalistic rules are a tiny, symmetric corner of the space, which is why they were the first to be surveyed.' : 'Even small enlargements of the neighbourhood make exhaustive search hopeless; the 256 elementary rules are special because they can all be looked at.', tot ? '総和型ルールは空間のごく小さな対称な一角で、最初に網羅的に調べられたのはそのためです。' : '近傍を少し広げるだけで総当たりは絶望的になります。256 個の基本ルールが特別なのは、すべてを見ることができるからです。']],
        };
      }
      const k = r.int(2, 6), T = 2 ** k;
      return {
        q: [`Rule 90 from a single cell: how many live cells are there in total in rows $0$ to $${T - 1}$?`, `ルール 90 を一つのセルから始めます。第 $0$ 行から第 $${T - 1}$ 行までの生きたセルの総数はいくつですか。`],
        a: { type: 'int', v: 3 ** k },
        hint: ['The first $2^k$ rows contain three copies of the first $2^{k-1}$ rows.', '最初の $2^k$ 行には、最初の $2^{k-1}$ 行の写しが三つ入っています。'],
        sol: [['Row $t$ has $2^{s(t)}$ live cells. Doubling the range adds a top bit to every $t$, doubling each count for the new half.', '第 $t$ 行の生きたセルは $2^{s(t)}$ 個です。範囲を2倍にすると新しい半分の $t$ には最上位の 1 が加わり、各行の個数が2倍になります。'], [`So the total triples each time: $N(2^k) = 3N(2^{k-1})$, $N(1) = 1$, giving $3^{${k}} = ${3 ** k}$.`, `よって総数は毎回3倍になります。$N(2^k) = 3N(2^{k-1})$、$N(1) = 1$ より $3^{${k}} = ${3 ** k}$ です。`], [`This is the self-similarity of the Sierpinski triangle: three half-size copies, so its dimension is $\\log 3/\\log 2 \\approx 1.585$.`, `これはシェルピンスキーの三角形の自己相似性です。半分の大きさの写しが三つあるので、次元は $\\log 3/\\log 2 \\approx 1.585$ です。`]],
        set: { rule: 90, init: 0, rows: Math.max(30, Math.min(140, Math.ceil(T / 10) * 10)) },
      };
    },
  ];

  // ---------- Life ----------
  const RULES = [{ B: [3], S: [2, 3], name: 'B3/S23', en: 'Life', ja: 'ライフ' }, { B: [3, 6], S: [2, 3], name: 'B36/S23', en: 'HighLife', ja: 'ハイライフ' }, { B: [2], S: [], name: 'B2/S', en: 'Seeds', ja: 'Seeds' }, { B: [3, 6, 7, 8], S: [3, 4, 6, 7, 8], name: 'B3678/S34678', en: 'Day & Night', ja: 'Day & Night' }];
  function lifeStep(g, W, H, rule = RULES[0]) {
    const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += g[((y + dy + H) % H) * W + (x + dx + W) % W];
      out[y * W + x] = g[y * W + x] ? (rule.S.includes(c) ? 1 : 0) : (rule.B.includes(c) ? 1 : 0);
    }
    return out;
  }
  const place = (rows, W, H, x0, y0) => { const g = new Uint8Array(W * H); rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'O') g[(y0 + j) * W + x0 + i] = 1; })); return g; };
  const same = (a, b) => a.every((x, i) => x === b[i]);
  const pop = (g) => g.reduce((s, x) => s + x, 0);
  const patTeX = (rows) => `{\\large\\begin{array}{${'c'.repeat(rows[0].length)}}${rows.map((row) => [...row].map((ch) => (ch === 'O' ? '\\blacksquare' : '\\square')).join(' & ')).join(' \\\\ ')}\\end{array}}`;
  const OSC = [
    ['block', 'ブロック', ['OO', 'OO']], ['beehive', '蜂の巣', ['.OO.', 'O..O', '.OO.']], ['loaf', 'パン', ['.OO.', 'O..O', '.O.O', '..O.']], ['boat', 'ボート', ['OO.', 'O.O', '.O.']], ['tub', 'たらい', ['.O.', 'O.O', '.O.']],
    ['blinker', 'ブリンカー', ['OOO']], ['toad', 'ヒキガエル', ['.OOO', 'OOO.']], ['beacon', 'ビーコン', ['OO..', 'OO..', '..OO', '..OO']], ['pentadecathlon', 'ペンタデカスロン', ['..O....O..', 'OO.OOOO.OO', '..O....O..']],
  ];
  function period(rows) {
    const W = 24, H = 18, g0 = place(rows, W, H, 7, 7); let g = g0;
    for (let t = 1; t <= 40; t++) { g = lifeStep(g, W, H); if (same(g, g0)) return t; }
    return null;
  }
  const lcm = (a, b) => { const g = (x, y) => (y ? g(y, x % y) : x); return a / g(a, b) * b; };
  Q['game-of-life'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const ri = r.pick([0, 0, 1, 2, 3]), rule = RULES[ri], alive = r.chance(0.5), k = r.int(0, 8);
        const lives = alive ? rule.S.includes(k) : rule.B.includes(k);
        return {
          q: [`Under ${rule.en} (${rule.name}), a ${alive ? 'live' : 'dead'} cell has ${k} live neighbour${k === 1 ? '' : 's'}. Is it alive in the next generation?`, `${rule.ja}（${rule.name}）で、${alive ? '生きた' : '死んだ'}セルの生きた隣接セルが ${k} 個です。次の世代でこのセルは生きていますか。`],
          a: { type: 'choice', opts: [['Alive', '生きている'], ['Dead', '死んでいる']], v: lives ? 0 : 1, fixed: true },
          hint: ['B lists the neighbour counts at which a dead cell is born; S those at which a live cell survives.', 'B は死んだセルが誕生する隣接数、S は生きたセルが生き残る隣接数の一覧です。'],
          sol: [[alive ? `A live cell survives when its count is in S = {${rule.S.join(', ') || '∅'}}.` : `A dead cell is born when its count is in B = {${rule.B.join(', ')}}.`, alive ? `生きたセルは、隣接数が S = {${rule.S.join(', ') || '∅'}} に入るとき生き残ります。` : `死んだセルは、隣接数が B = {${rule.B.join(', ')}} に入るとき誕生します。`], [`${k} ${lives ? 'is' : 'is not'} in that set, so the cell is ${lives ? 'alive' : 'dead'}.`, `${k} はその集合に${lives ? '入っている' : '入っていない'}ので、セルは${lives ? '生きています' : '死んでいます'}。`]],
          set: { rule: ri },
        };
      }
      let cells; do { cells = Array.from({ length: 9 }, () => (r.chance(0.42) ? 1 : 0)); } while (cells.reduce((s, x, i) => s + (i === 4 ? 0 : x), 0) === 0);
      const k = cells.reduce((s, x, i) => s + (i === 4 ? 0 : x), 0), rows = [0, 1, 2].map((j) => cells.slice(3 * j, 3 * j + 3).map((x) => (x ? 'O' : '.')).join(''));
      const next = cells[4] ? [2, 3].includes(k) : k === 3;
      return {
        q: [`How many live neighbours does the centre cell have here? $${patTeX(rows)}$`, `この図で中央のセルの生きた隣接セルはいくつですか。$${patTeX(rows)}$`],
        a: { type: 'int', v: k },
        hint: ['Count all eight surrounding cells, diagonals included, but not the centre itself.', '斜めも含めた周りの八つのセルを数えます。中央そのものは数えません。'],
        sol: [[`${k} of the eight surrounding cells are live.`, `周りの八つのセルのうち ${k} 個が生きています。`], [`The centre is ${cells[4] ? 'live' : 'dead'}, so under Life it ${next ? (cells[4] ? 'survives' : 'is born') : (cells[4] ? 'dies' : 'stays dead')} in the next generation.`, `中央は${cells[4] ? '生きている' : '死んでいる'}ので、ライフでは次の世代に${next ? (cells[4] ? '生き残ります' : '誕生します') : (cells[4] ? '死にます' : '死んだままです')}。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let rows, g0, g1;
        do {
          rows = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => (r.chance(0.4) ? 'O' : '.')).join(''));
          g0 = place(rows, 12, 12, 4, 4); g1 = lifeStep(g0, 12, 12);
        } while (pop(g0) < 3 || pop(g0) > 8);
        let births = 0, deaths = 0; g0.forEach((x, i) => { if (x && !g1[i]) deaths++; if (!x && g1[i]) births++; });
        return {
          q: [`Under Life (B3/S23), how many cells are alive one generation after this pattern (on an otherwise empty plane)? $${patTeX(rows)}$`, `ライフ（B3/S23）で、何もない平面に置いたこのパターンの一世代後に生きているセルはいくつですか。$${patTeX(rows)}$`],
          a: { type: 'int', v: pop(g1) },
          hint: ['Check every live cell for survival (2 or 3 neighbours), then every dead cell next to the pattern for birth (exactly 3).', '生きたセルはすべて生存（隣接 2 か 3）を、パターンに接する死んだセルはすべて誕生（ちょうど 3）を確かめてください。'],
          sol: [[`Of the ${pop(g0)} live cells, ${deaths} ${deaths === 1 ? 'dies' : 'die'} and ${pop(g0) - deaths} ${pop(g0) - deaths === 1 ? 'survives' : 'survive'}.`, `${pop(g0)} 個の生きたセルのうち ${deaths} 個が死に、${pop(g0) - deaths} 個が生き残ります。`], [`${births} dead cell${births === 1 ? ' has' : 's have'} exactly three live neighbours and ${births === 1 ? 'is' : 'are'} born, so the population becomes ${pop(g0) - deaths} + ${births} = ${pop(g1)}.`, `ちょうど三つの生きた隣接セルをもつ死んだセルが ${births} 個あって誕生するので、個体数は ${pop(g0) - deaths} + ${births} = ${pop(g1)} になります。`]],
        };
      }
      if (form === 1) {
        const g = 4 * r.int(2, 100);
        return {
          q: [`A glider moves one cell diagonally every 4 generations. After ${g} generations, how many cells has it moved horizontally?`, `グライダーは 4 世代ごとに斜めに 1 マス進みます。${g} 世代後、横方向に何マス進んでいますか。`],
          a: { type: 'int', v: g / 4 },
          hint: ['Diagonal means one cell across and one cell down at the same time.', '斜めとは、横に 1 マスと縦に 1 マスを同時に進むことです。'],
          sol: [[`${g}/4 = ${g / 4} periods, each moving it (1, 1).`, `${g}/4 = ${g / 4} 周期で、各周期に (1, 1) 進みます。`], [`So ${g / 4} cells across and ${g / 4} down: speed $c/4$, the fastest diagonal speed any Life pattern can have.`, `よって横に ${g / 4} マス、縦に ${g / 4} マスです。速さは $c/4$ で、ライフのパターンが斜めに動ける最高の速さです。`]],
          set: g <= 400 ? { pattern: 0, rule: 0, gen: g } : { pattern: 0, rule: 0 },
        };
      }
      const per = r.pick([30, 46, 60, 120]);
      return {
        q: [`A glider gun fires one glider every ${per} generations, and gliders travel at $c/4$. How many cells apart (along each axis) are successive gliders in the stream?`, `グライダー銃は ${per} 世代ごとにグライダーを一つ発射し、グライダーは $c/4$ で進みます。流れの中で続くグライダーどうしは、各軸方向に何マス離れていますか。`],
        a: { type: 'num', v: per / 4 },
        hint: ['In one period of the gun, the previous glider has kept moving.', '銃の一周期のあいだに、前のグライダーは進み続けています。'],
        sol: [[`In ${per} generations a glider moves ${per}/4 = ${n(per / 4)} cells along each axis.`, `${per} 世代でグライダーは各軸方向に ${per}/4 = ${n(per / 4)} マス進みます。`], [`So the stream has spacing ${n(per / 4)}${per % 4 ? ': a fractional spacing just means neighbouring gliders are in different phases of their four-generation cycle' : ''}.${per === 30 ? ' Gosper\'s gun, in the figure, is the period-30 case.' : ''}`, `よって間隔は ${n(per / 4)} です${per % 4 ? '。端数の間隔は、隣り合うグライダーが四世代周期の異なる位相にあることを意味するだけです' : ''}。${per === 30 ? '図のゴスパーの銃は周期 30 の場合です。' : ''}`]],
        set: per === 30 ? { pattern: 2, rule: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [en, ja, rows] = r.pick(OSC), p = period(rows);
        if (!p) throw new Error('no period');
        return {
          q: [`What is the period of this Life pattern (1 for a still life)? $${patTeX(rows)}$`, `このライフのパターンの周期はいくつですか（固定物体なら 1）。$${patTeX(rows)}$`],
          a: { type: 'int', v: p },
          hint: ['Apply the rule to every cell, and repeat until the original pattern comes back.', 'すべてのセルに規則を適用し、元のパターンが戻ってくるまで繰り返してください。'],
          sol: [[`This is the ${en}.`, `これは${ja}です。`], [p === 1 ? 'Every live cell has 2 or 3 live neighbours and no dead cell has exactly 3, so nothing changes: a still life, period 1.' : `It returns to itself after ${p} generations and not before, so its period is ${p}.`, p === 1 ? '生きたセルはどれも生きた隣接セルが 2 か 3 で、ちょうど 3 の死んだセルはないので、何も変わりません。固定物体で、周期は 1 です。' : `${p} 世代後に初めて元に戻るので、周期は ${p} です。`], [p === 15 ? 'Period 15 is long for so few cells: the pentadecathlon passes through fifteen different shapes in between.' : 'Still lifes, oscillators and gliders are the debris that random soups leave behind.', p === 15 ? 'この少ないセル数で周期 15 は長く、ペンタデカスロンはその間に十五の異なる形を経ます。' : '固定物体、振動子、グライダーは、ランダムなスープが後に残す残骸です。']],
        };
      }
      if (form === 1) {
        let W, H; do { W = r.int(8, 64); H = r.int(8, 64); } while (W === H && r.chance(0.7));
        const T = 4 * lcm(W, H);
        return {
          q: [`A glider moves on a ${W} × ${H} torus (opposite edges joined). After how many generations does it first return to its starting cells in the same phase?`, `グライダーが ${W} × ${H} のトーラス（向かい合う辺をつないだもの）の上を動きます。同じ位相で出発点のセルに初めて戻るのは何世代後ですか。`],
          a: { type: 'int', v: T },
          hint: ['After $4m$ generations it has moved $(m, m)$. Both coordinates must wrap round exactly.', '$4m$ 世代後には $(m, m)$ 進んでいます。両方の座標がちょうど一周しなければなりません。'],
          sol: [[`Return needs $m$ to be a multiple of both ${W} and ${H}: the least is $\\operatorname{lcm}(${W}, ${H}) = ${lcm(W, H)}$.`, `戻るには $m$ が ${W} と ${H} の両方の倍数でなければならず、最小は $\\operatorname{lcm}(${W}, ${H}) = ${lcm(W, H)}$ です。`], [`So $4\\cdot ${lcm(W, H)} = ${T}$ generations.${W === 64 && H === 40 ? ' This is the torus in the figure.' : ''}`, `よって $4\\cdot ${lcm(W, H)} = ${T}$ 世代です。${W === 64 && H === 40 ? 'これは図のトーラスです。' : ''}`]],
        };
      }
      const k = r.int(2, 8), g = r.int(3, 40);
      return {
        q: [`A pattern fits in a ${k} × ${k} box. What is the largest width its bounding box can have after ${g} generations?`, `あるパターンが ${k} × ${k} の箱に収まっています。${g} 世代後、外接する箱の幅は最大でいくつになりえますか。`],
        a: { type: 'int', v: k + 2 * g },
        hint: ['A cell can only be born next to a live cell.', 'セルは生きたセルの隣にしか誕生できません。'],
        sol: [['Each generation the live region can grow by at most one cell in every direction: that is the speed of light $c$.', '各世代で、生きた領域はどの方向にも高々 1 マスしか広がれません。これが光速 $c$ です。'], [`Over ${g} generations it gains at most ${g} on each side: width at most ${k} + 2·${g} = ${k + 2 * g}.`, `${g} 世代では各辺で高々 ${g} マス広がるので、幅は高々 ${k} + 2·${g} = ${k + 2 * g} です。`], ['Actual patterns stay far below this: the fastest spaceships move at $c/2$ orthogonally and $c/4$ diagonally.', '実際のパターンはこれをはるかに下回ります。最速の宇宙船でも直交方向に $c/2$、斜めに $c/4$ です。']],
      };
    },
  ];

  // ---------- Langton's ant ----------
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], DIR = [['east', '東'], ['north', '北'], ['west', '西'], ['south', '南']];
  function ant(steps, start = []) {
    const black = new Set(start.map(([x, y]) => `${x},${y}`)); let x = 0, y = 0, d = 1;
    for (let t = 0; t < steps; t++) { const k = `${x},${y}`; if (black.has(k)) { d = (d + 1) & 3; black.delete(k); } else { d = (d + 3) & 3; black.add(k); } x += DX[d]; y += DY[d]; }
    return { x, y, d, black: black.size };
  }
  Q['langtons-ant'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const d = r.int(0, 3), white = r.chance(0.5), nd = white ? (d + 3) & 3 : (d + 1) & 3;
        return {
          q: [`The ant faces ${DIR[d][0]} and stands on a ${white ? 'white' : 'black'} cell. Which way does it face after this step?`, `アリが${DIR[d][1]}を向いて${white ? '白い' : '黒い'}セルの上にいます。このステップのあと、アリはどちらを向いていますか。`],
          a: { type: 'choice', opts: [['north', '北'], ['east', '東'], ['south', '南'], ['west', '西']], v: [1, 0, 3, 2].indexOf(nd), fixed: true },
          hint: ['White: turn right. Black: turn left.', '白なら右に、黒なら左に曲がります。'],
          sol: [[`On a ${white ? 'white' : 'black'} cell the ant turns ${white ? 'right' : 'left'} by 90°.`, `${white ? '白い' : '黒い'}セルではアリは${white ? '右' : '左'}に 90° 曲がります。`], [`From ${DIR[d][0]} that is ${DIR[nd][0]}; it then flips the cell to ${white ? 'black' : 'white'} and steps forward.`, `${DIR[d][1]}からだと${DIR[nd][1]}です。そのあとセルを${white ? '黒' : '白'}に変えて一歩進みます。`]],
        };
      }
      const k = r.int(1, 12), s = ant(k);
      return {
        q: [`Starting on an all-white grid, how many cells are black after ${k} step${k === 1 ? '' : 's'}?`, `すべて白い格子から始めて、${k} ステップ後に黒いセルはいくつありますか。`],
        a: { type: 'int', v: s.black },
        hint: ['Trace it on squared paper: the first four steps go round a small square.', '方眼紙でたどってください。最初の 4 ステップは小さな正方形を一周します。'],
        sol: [[k <= 4 ? `Each of the first ${k} steps lands on a fresh white cell and blackens it.` : 'The first four steps blacken four cells and bring the ant back to its start, now black; from there it turns left and the pattern grows.', k <= 4 ? `最初の ${k} ステップはどれも新しい白いセルに着いて、それを黒くします。` : '最初の 4 ステップで四つのセルが黒くなり、アリは出発点（今は黒）に戻ります。そこから左に曲がり、模様が育っていきます。'], [`After ${k} steps there are ${s.black} black cells, and the ant is at (${s.x}, ${s.y}) facing ${DIR[s.d][0]}.`, `${k} ステップ後の黒いセルは ${s.black} 個で、アリは (${s.x}, ${s.y}) で${DIR[s.d][1]}を向いています。`]],
        set: { start: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(5, 16), s = ant(k);
        return {
          q: [`The ant starts at $(0, 0)$ facing north on an all-white grid. Where is it after ${k} steps? (East is $+x$, north is $+y$.)`, `アリはすべて白い格子の $(0, 0)$ で北を向いて出発します。${k} ステップ後にどこにいますか（東を $+x$、北を $+y$ とします）。`],
          a: { type: 'tuple', v: [s.x, s.y], labels: ['$x$', '$y$'] },
          hint: ['Keep a list of black cells as you go; each step is turn, flip, move.', '黒いセルの一覧をつけながら進めてください。各ステップは、曲がる、反転する、進む、です。'],
          sol: [['On white the ant turns right, so it first moves east to $(1, 0)$; four right turns bring it back to the origin after 4 steps, on a cell that is now black.', '白ではアリは右に曲がるので、最初は東へ進んで $(1, 0)$ に行きます。右に四回曲がって 4 ステップ後に原点に戻り、そのセルは今は黒です。'], [`After ${k} steps it is at (${s.x}, ${s.y}) facing ${DIR[s.d][0]}, with ${s.black} black cells behind it.`, `${k} ステップ後には (${s.x}, ${s.y}) にいて${DIR[s.d][1]}を向いており、黒いセルは ${s.black} 個です。`]],
        };
      }
      if (form === 1) {
        const st = r.int(0, 1), b0 = st ? 9 : 0, steps = 50 * r.int(1, 240), even = (b0 + steps) % 2 === 0;
        const check = ant(Math.min(steps, 600), st ? [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => [i, j])) : []).black;
        if ((check - b0 - Math.min(steps, 600)) % 2 !== 0) throw new Error('parity');
        return {
          q: [`Starting from ${st ? 'a 3 × 3 black square' : 'an all-white grid'}, is the number of black cells after ${steps.toLocaleString('en-US')} steps even or odd?`, `${st ? '3 × 3 の黒い正方形' : 'すべて白い格子'}から始めて、${steps.toLocaleString('en-US')} ステップ後の黒いセルの数は偶数ですか、奇数ですか。`],
          a: { type: 'choice', opts: [['Even', '偶数'], ['Odd', '奇数']], v: even ? 0 : 1, fixed: true },
          hint: ['Every step flips exactly one cell.', 'どのステップもちょうど一つのセルを反転させます。'],
          sol: [['Each step changes the number of black cells by $\\pm 1$, so its parity flips at every step.', '各ステップで黒いセルの数は $\\pm 1$ だけ変わるので、偶奇は毎ステップ入れ替わります。'], [`So black ≡ ${b0} + ${steps} ≡ ${(b0 + steps) % 2} (mod 2): ${even ? 'even' : 'odd'}. This is the parity check in the readout.`, `よって 黒 ≡ ${b0} + ${steps} ≡ ${(b0 + steps) % 2} (mod 2) で${even ? '偶数' : '奇数'}です。読み取り欄の偶奇の確認がこれです。`]],
          set: { steps, start: st },
        };
      }
      const m = r.int(2, 40);
      return {
        q: [`On its highway the ant repeats a 104-step cycle that moves it 2 cells diagonally and adds 12 black cells. How many black cells does it add in ${(104 * m).toLocaleString('en-US')} steps of highway?`, `高速道路の上でアリは 104 ステップの周期を繰り返し、そのたびに斜めに 2 マス進んで黒いセルを 12 個増やします。高速道路を ${(104 * m).toLocaleString('en-US')} ステップ進むと、黒いセルはいくつ増えますか。`],
        a: { type: 'int', v: 12 * m },
        hint: ['Count whole cycles.', '周期の数を数えてください。'],
        sol: [[`${(104 * m).toLocaleString('en-US')} / 104 = ${m} cycles.`, `${(104 * m).toLocaleString('en-US')} / 104 = ${m} 周期です。`], [`${m} × 12 = ${12 * m} new black cells, and the ant has moved ${2 * m} cells along each axis: the straight rising stretch at the end of the graph.`, `${m} × 12 = ${12 * m} 個の黒いセルが増え、アリは各軸方向に ${2 * m} マス進みます。グラフの最後のまっすぐ上がる部分がこれです。`]],
        set: { start: 0, steps: 12000 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const D = 2 * r.int(5, 150);
        return {
          q: [`On the highway the ant advances $(2, 2)$ every 104 steps. How many steps does it need to move ${D} cells along each axis?`, `高速道路の上でアリは 104 ステップごとに $(2, 2)$ 進みます。各軸方向に ${D} マス進むには何ステップかかりますか。`],
          a: { type: 'int', v: 52 * D },
          hint: ['Find how many cycles cover the distance.', '何周期でその距離を進むかを求めてください。'],
          sol: [[`${D}/2 = ${D / 2} cycles of 104 steps.`, `${D}/2 = ${D / 2} 周期で、1 周期は 104 ステップです。`], [`${D / 2} × 104 = ${52 * D} steps. The average speed is $2\\sqrt2/104 \\approx 0.027$ cells per step: the highway is slow, but it never stops.`, `${D / 2} × 104 = ${52 * D} ステップです。平均の速さは 1 ステップあたり $2\\sqrt2/104 \\approx 0.027$ マスで、高速道路は遅いものの、決して止まりません。`]],
        };
      }
      if (form === 1) return {
        q: ['You are shown the grid, the ant\'s cell and its heading after some step. Can you recover the configuration one step earlier?', 'あるステップのあとの格子、アリのいるセル、向きが示されています。一ステップ前の状態を復元できますか。'],
        a: { type: 'choice', opts: [['Yes: step back against the heading, flip that cell back, and its restored colour tells which way the ant had turned.', 'できる。向きと逆に一歩戻ってそのセルを元に反転させれば、戻した色からアリがどちらに曲がったかがわかる。'], ['No: two different grids can lead to the same grid in one step.', 'できない。異なる二つの格子が一ステップで同じ格子になりうる。'], ['Only if the ant is on the highway.', 'アリが高速道路の上にいるときだけできる。'], ['Only by running the whole history again from the start.', '最初から全履歴をやり直すことでしかできない。']], v: 0 },
        hint: ['The ant moved forward from the cell it just changed.', 'アリは、変えたばかりのセルから前に進みました。'],
        sol: [['The previous cell is one step behind the ant. Undo its flip: if it is now black it was white, so the ant turned right there (and vice versa).', '直前のセルはアリの一歩後ろです。その反転を元に戻します。今が黒なら元は白で、アリはそこで右に曲がったことになります（逆も同様です）。'], ['Undoing that turn gives the old heading. So the map is a bijection on configurations, and this reversibility is the key to the proof that the ant cannot stay in a bounded region.', 'その曲がりを戻すと元の向きがわかります。したがってこの写像は状態の全単射で、この可逆性が、アリが有界な領域にとどまれないことの証明の鍵になります。']],
      };
      return {
        q: ['Which statement is a theorem about Langton\'s ant on any finite starting pattern?', '有限の初期パターンから始めたラングトンのアリについて、定理として証明されているのはどれですか。'],
        a: { type: 'choice', opts: [['Its path is unbounded: it cannot stay in any finite region forever.', '経路は非有界である。どんな有限の領域にもいつまでもとどまることはできない。'], ['It always builds a highway eventually.', '必ずいつかは高速道路を作る。'], ['The number of black cells grows without bound.', '黒いセルの数は限りなく増える。'], ['It never visits the same cell twice.', '同じセルを二度訪れることはない。']], v: 0 },
        hint: ['One of these is a conjecture supported by every experiment so far, but not proved.', 'このうち一つは、これまでのすべての実験が支持しているものの、証明されていない予想です。'],
        sol: [['Unboundedness is the Cohen and Kong theorem: a bounded run would be periodic by reversibility, and examining the cells at the edge of the visited region shows no periodic run is possible.', '非有界性はコーエンとコンの定理です。有界な実行は可逆性から周期的になり、訪れた領域の端のセルを調べると周期的な実行はありえないことがわかります。'], ['That every start leads to a highway is only conjectured. The ant revisits cells constantly, and leaving the region is not the same as accumulating black cells.', 'どの初期状態からも高速道路に至るというのは予想にすぎません。アリはしょっちゅう同じセルを訪れますし、領域を出ていくことは黒いセルが増え続けることと同じではありません。']],
      };
    },
  ];

  // ---------- rule 184 traffic ----------
  const step184 = (row) => { const L = row.length, out = new Array(L).fill(0); let moved = 0; row.forEach((c, i) => { if (!c) return; const a = (i + 1) % L; if (!row[a]) { out[a] = 1; moved++; } else out[i] = 1; }); return { row: out, moved }; };
  const tent = (rho) => Math.min(rho, 1 - rho);
  const roadTeX = (row) => row.join('\\,');
  Q['rule-184-traffic'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rho = r.step(0.05, 0.95, 0.05);
        return {
          q: [`What is the long-run flow $q$ (cars passing a point per step) of rule 184 at density $\\rho = ${n(rho)}$?`, `密度 $\\rho = ${n(rho)}$ のルール 184 の長時間での流量 $q$（1 ステップに一点を通過する車の数）はいくつですか。`],
          a: { type: 'num', v: tent(rho) },
          hint: ['Below density 1/2 every car moves; above it every gap moves.', '密度 1/2 未満ではすべての車が、それを超えるとすべての隙間が動きます。'],
          sol: [[rho <= 0.5 ? `$\\rho \\le 1/2$: after the transient every car moves every step, so $q = \\rho$.` : `$\\rho > 1/2$: every gap moves backwards every step, so $q = 1 - \\rho$.`, rho <= 0.5 ? '$\\rho \\le 1/2$ なので、過渡状態のあとはすべての車が毎ステップ動き、$q = \\rho$ です。' : '$\\rho > 1/2$ なので、すべての隙間が毎ステップ後ろへ動き、$q = 1 - \\rho$ です。'], [`$q = \\min(\\rho, 1 - \\rho) = ${n(tent(rho))}$.`, `$q = \\min(\\rho, 1 - \\rho) = ${n(tent(rho))}$ です。`]],
          set: { rho, model: 0 },
        };
      }
      if (form === 1) {
        const rho = r.step(0.05, 0.95, 0.05), v = tent(rho) / rho;
        return {
          q: [`At density $\\rho = ${n(rho)}$ in rule 184, what is the long-run mean speed of a car (cells per step)?`, `ルール 184 で密度 $\\rho = ${n(rho)}$ のとき、車の長時間での平均速度（1 ステップあたりのマス数）はいくつですか。`],
          a: { type: 'num', v, show: rho <= 0.5 ? '1' : `\\tfrac{${n(1 - rho)}}{${n(rho)}}` },
          hint: ['Mean speed is flow divided by density.', '平均速度は流量を密度で割ったものです。'],
          sol: [[`$q = \\min(\\rho, 1 - \\rho) = ${n(tent(rho))}$.`, `$q = \\min(\\rho, 1 - \\rho) = ${n(tent(rho))}$ です。`], [`$v = q/\\rho = ${n(v, 4)}$. ${rho <= 0.5 ? 'Free flow: every car moves every step.' : 'Congested: a car waits in a jam part of the time.'}`, `$v = q/\\rho = ${n(v, 4)}$ です。${rho <= 0.5 ? '自由な流れで、すべての車が毎ステップ動きます。' : '渋滞していて、車は一部の時間を渋滞の中で待ちます。'}`]],
          set: { rho, model: 0 },
        };
      }
      let row; do { row = Array.from({ length: 10 }, () => (r.chance(0.5) ? 1 : 0)); } while (row.every((x) => x) || row.every((x) => !x));
      const s = step184(row);
      return {
        q: [`On a ring of 10 cells (cars move right; the last cell's right neighbour is the first), the cars are at $${roadTeX(row)}$. How many cars move in the next step?`, `10 セルの環（車は右へ進み、最後のセルの右隣は最初のセル）で、車が $${roadTeX(row)}$ にあります。次のステップで動く車は何台ですか。`],
        a: { type: 'int', v: s.moved },
        hint: ['A car moves exactly when the cell ahead is empty: count the pairs $1\\,0$, including the one that wraps round.', '車が動くのは前のセルが空いているときに限ります。折り返しも含めて $1\\,0$ の組を数えてください。'],
        sol: [[`The pairs (car, empty) are where a car sits directly behind a gap; there are ${s.moved}.`, `（車, 空き）の組は、車のすぐ前が空いている所で、${s.moved} 個あります。`], [`The next row is $${roadTeX(s.row)}$. The number of cars is unchanged: rule 184 conserves them.`, `次の行は $${roadTeX(s.row)}$ です。車の数は変わりません。ルール 184 は車の数を保存します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Lr = r.pick([20, 50, 100, 200]), N = r.int(Math.round(Lr * 0.1), Math.round(Lr * 0.9)), stopped = Math.max(0, 2 * N - Lr);
        return {
          q: [`A ring of ${Lr} cells carries ${N} cars under rule 184. After the transient, how many cars wait at each step?`, `${Lr} セルの環にルール 184 で ${N} 台の車が走っています。過渡状態のあと、各ステップで待つ車は何台ですか。`],
          a: { type: 'int', v: stopped },
          hint: ['In the steady state, compare the number of cars with the number of gaps.', '定常状態で、車の数と隙間の数を比べてください。'],
          sol: [[`There are ${N} cars and ${Lr - N} gaps.`, `車は ${N} 台、隙間は ${Lr - N} 個です。`], [N <= Lr - N ? 'At most half full: the jams dissolve and every car eventually has a gap ahead, so none waits.' : `More than half full: every gap is filled from behind at every step, so ${Lr - N} cars move and ${N} − ${Lr - N} = ${stopped} wait.`, N <= Lr - N ? '半分以下の混み具合なので渋滞は解消し、やがてどの車の前にも隙間があるので、待つ車はありません。' : `半分を超えているので、どの隙間も毎ステップ後ろから埋まり、${Lr - N} 台が動いて ${N} − ${Lr - N} = ${stopped} 台が待ちます。`]],
          set: { rho: Math.min(0.95, Math.max(0.05, Math.round(N / Lr * 20) / 20)), model: 0 },
        };
      }
      if (form === 1) {
        const rho = r.step(0.05, 0.95, 0.05), Tt = r.pick([100, 200, 500, 1000]);
        return {
          q: [`At density $\\rho = ${n(rho)}$ on a long rule-184 road, how many cars pass a fixed point in ${Tt} steps (after the transient)?`, `ルール 184 の長い道路で密度 $\\rho = ${n(rho)}$ のとき、過渡状態のあとの ${Tt} ステップで一点を通過する車は何台ですか。`],
          a: { type: 'int', v: Math.round(tent(rho) * Tt) },
          hint: ['Flow is cars per step through a point.', '流量は、1 ステップに一点を通過する車の数です。'],
          sol: [[`$q = \\min(${n(rho)}, ${n(1 - rho)}) = ${n(tent(rho))}$.`, `$q = \\min(${n(rho)}, ${n(1 - rho)}) = ${n(tent(rho))}$ です。`], [`${n(tent(rho))} × ${Tt} = ${Math.round(tent(rho) * Tt)} cars.${Math.abs(rho - 0.5) < 1e-9 ? ' This is the maximum any density allows.' : ''}`, `${n(tent(rho))} × ${Tt} = ${Math.round(tent(rho) * Tt)} 台です。${Math.abs(rho - 0.5) < 1e-9 ? 'これはどの密度でも超えられない最大値です。' : ''}`]],
          set: { rho, model: 0 },
        };
      }
      let row; do { row = Array.from({ length: 8 }, () => (r.chance(0.55) ? 1 : 0)); } while (row.every((x) => x) || row.every((x) => !x) || step184(row).moved === row.reduce((s, x) => s + x, 0));
      const next = step184(row).row, all = row.map((_, i) => row[(i + row.length - 1) % row.length]), into = row.map((c, i) => (c || row[(i + row.length - 1) % row.length] ? 1 : 0));
      const cands = [next, all, into, row.map((c, i) => row[(i + 1) % row.length])].map((x) => x.join(''));
      const uniq = [...new Set(cands)];
      return {
        q: [`A ring of 8 cells reads $${roadTeX(row)}$ (cars move right and wrap round). What is it after one step of rule 184?`, `8 セルの環が $${roadTeX(row)}$ です（車は右へ進み、端で折り返します）。ルール 184 で一ステップ後はどうなりますか。`],
        a: { type: 'choice', opts: uniq.map((s) => [`$${s.split('').join('\\,')}$`, `$${s.split('').join('\\,')}$`]), v: 0 },
        hint: ['Only cars with an empty cell ahead move; all moves happen at once.', '前のセルが空いている車だけが動き、すべての移動は同時に起こります。'],
        sol: [['Look at each car: if the cell to its right is empty it moves there, otherwise it stays.', '各車について、右のセルが空いていればそこへ動き、そうでなければとどまります。'], [`Result: $${roadTeX(next)}$. Shifting every car regardless of blocking would put two cars in one cell, and the number of cars must stay the same.`, `結果は $${roadTeX(next)}$ です。前がふさがっていても全車を動かすと一つのセルに二台が入ってしまいます。車の数は変わらないはずです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let r1, r2; do { r1 = r.step(0.1, 0.45, 0.05); r2 = r.step(0.55, 1, 0.05); } while (Math.abs(1 - r1 - r2) < 1e-9 && r.chance(0.6));
        const s = (tent(r2) - tent(r1)) / (r2 - r1);
        return {
          q: [`Free traffic at density $${n(r1)}$ runs into a jam at density $${n(r2)}$ ahead of it. At what speed does the boundary between them move (cells per step, positive in the direction of travel)?`, `密度 $${n(r1)}$ の自由な流れが、前方の密度 $${n(r2)}$ の渋滞に突っ込みます。両者の境界はどんな速さで動きますか（1 ステップあたりのマス数、進行方向を正とします）。`],
          a: { type: 'num', v: s, tol: 1e-3 },
          hint: ['Cars are conserved: the front moves at $s = \\dfrac{q_2 - q_1}{\\rho_2 - \\rho_1}$.', '車は保存されるので、境界の速さは $s = \\dfrac{q_2 - q_1}{\\rho_2 - \\rho_1}$ です。'],
          sol: [[`$q_1 = ${n(tent(r1))}$ and $q_2 = 1 - ${n(r2)} = ${n(tent(r2))}$.`, `$q_1 = ${n(tent(r1))}$、$q_2 = 1 - ${n(r2)} = ${n(tent(r2))}$ です。`], [`$s = \\dfrac{${n(tent(r2))} - ${n(tent(r1))}}{${n(r2)} - ${n(r1)}} = ${n(s, 4)}$.`, `$s = \\dfrac{${n(tent(r2))} - ${n(tent(r1))}}{${n(r2)} - ${n(r1)}} = ${n(s, 4)}$ です。`], [s < -1e-9 ? 'Negative: the tail of the jam grows backwards towards the oncoming cars, although every car only ever moves forwards.' : s > 1e-9 ? 'Positive: the jam is fed more slowly than it drains, so it shrinks and its tail moves forwards.' : 'Zero: inflow and outflow balance and the jam stands still.', s < -1e-9 ? '負なので、渋滞の末尾は向かってくる車の方へ後ろ向きに伸びていきます。どの車も前にしか動かないのにです。' : s > 1e-9 ? '正なので、渋滞に入る車より出ていく車が多く、渋滞は縮み、末尾は前へ進みます。' : '0 なので流入と流出が釣り合い、渋滞は止まったままです。']],
        };
      }
      if (form === 1) return {
        q: ['For rule 184 above density $1/2$, write the long-run mean speed $v$ of a car as a function of the density $\\rho$.', '密度が $1/2$ を超えるとき、ルール 184 の車の長時間での平均速度 $v$ を密度 $\\rho$ の式で表してください。'],
        a: { type: 'expr', v: '(1-rho)/rho', vars: ['rho'], dom: { rho: [0.55, 0.95] }, lhs: ['$v(\\rho) =$', '$v(\\rho) =$'] },
        hint: ['Read the rule for the gaps: they flow backwards at speed 1.', 'ルールを隙間について読んでください。隙間は速さ 1 で後ろへ流れます。'],
        sol: [['A gap moves left exactly when the cell on its left holds a car. Above $\\rho = 1/2$ every gap has a car behind it after the transient, so every gap moves every step.', '隙間が左へ動くのは、左のセルに車があるときに限ります。$\\rho = 1/2$ を超えると、過渡状態のあとはどの隙間の後ろにも車があるので、すべての隙間が毎ステップ動きます。'], ['Each gap that moves is one car moving, so $q = 1 - \\rho$, and $v = q/\\rho = (1 - \\rho)/\\rho$.', '隙間が一つ動くことは車が一台動くことなので、$q = 1 - \\rho$、$v = q/\\rho = (1 - \\rho)/\\rho$ です。'], ['It falls from 1 at $\\rho = 1/2$ to 0 at a full road, the downward branch of the fundamental diagram divided by $\\rho$.', '$\\rho = 1/2$ での 1 から満杯の道路での 0 まで下がります。基本図の下り坂を $\\rho$ で割ったものです。']],
        set: { model: 0, rho: r.step(0.55, 0.95, 0.05) },
      };
      const J = r.int(3, 30);
      let row = Array.from({ length: J + 60 }, (_, i) => (i < J ? 1 : 0)), t = 0, all = false;
      while (!all && t < 200) { const s = step184(row); t++; all = s.moved === J; row = s.row; }
      return {
        q: [`${J} cars stand bumper to bumper at the front of an empty road (rule 184). At which step does the last car move for the first time?`, `空いた道路の先頭に ${J} 台の車が隙間なく並んでいます（ルール 184）。最後の車が初めて動くのは何ステップ目ですか。`],
        a: { type: 'int', v: t },
        hint: ['Follow the gap that opens in front of the first car.', '先頭の車の前に開く隙間を追ってください。'],
        sol: [['The front car moves at step 1, opening a gap behind it. That gap moves back one car per step, releasing one car each step.', '先頭の車はステップ 1 で動き、その後ろに隙間ができます。この隙間は 1 ステップに一台ずつ後ろへ移り、そのたびに車を一台解放します。'], [`So car $k$ first moves at step $k$, and the last car at step ${t}: the jam dissolves from the front at one car per step, and its tail never moves until the gap arrives.`, `よって $k$ 台目の車が初めて動くのはステップ $k$ で、最後の車はステップ ${t} です。渋滞は先頭から 1 ステップに一台ずつ解け、隙間が届くまで末尾は動きません。`]],
      };
    },
  ];
})();
