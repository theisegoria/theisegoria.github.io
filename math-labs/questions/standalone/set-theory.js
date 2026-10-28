'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { gcd } = P.util;

  const setTeX = (a) => (a.length ? `\\{${a.join(', ')}\\}` : '\\varnothing');
  const key = (x) => (Array.isArray(x) ? '[' + x.map(key).sort().join(',') + ']' : String(x));
  const inSet = (x, S) => S.some((y) => key(y) === key(x));
  const subsetOf = (X, S) => X.every((x) => inSet(x, S));
  const tex = (x) => (Array.isArray(x) ? (x.length ? `\\{${x.map(tex).join(', ')}\\}` : '\\varnothing') : String(x));
  const choose = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); };
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const sCount = (n, k) => { let s = 0; for (let j = 0; j <= k; j++) s += (j % 2 ? -1 : 1) * choose(k, j) * Math.pow(k - j, n); return s; };
  const bell = (n) => { let row = [1]; for (let i = 1; i < n; i++) { const next = [row[row.length - 1]]; for (const v of row) next.push(next[next.length - 1] + v); row = next; } return row[row.length - 1]; };
  const U = [1, 2, 3, 4, 5, 6, 7, 8];

  /* ---------- operations, subsets, power sets, products ---------- */
  Q['set-theory-operations'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const A = r.sample(U, r.int(3, 5)).sort((x, y) => x - y), B = r.sample(U, r.int(3, 5)).sort((x, y) => x - y);
        const op = r.int(0, 3);
        const I = A.filter((x) => B.includes(x)), Un = U.filter((x) => A.includes(x) || B.includes(x));
        const D = A.filter((x) => !B.includes(x)), C = U.filter((x) => !A.includes(x));
        const sets = [[I, 'A \\cap B', 'the intersection', '共通部分'], [Un, 'A \\cup B', 'the union', '和集合'], [D, 'A \\setminus B', 'the difference', '差集合'], [C, 'A^{c}', 'the complement of $A$ in $U$', '$U$ に関する $A$ の補集合']][op];
        return {
          q: [`Let $U = \\{1, \\dots, 8\\}$, $A = ${setTeX(A)}$ and $B = ${setTeX(B)}$. How many elements does $${sets[1]}$ have?`, `$U = \\{1, \\dots, 8\\}$、$A = ${setTeX(A)}$、$B = ${setTeX(B)}$ とします。$${sets[1]}$ の要素は何個ですか。`],
          a: { type: 'int', v: sets[0].length },
          hint: [`Write ${sets[2]} out as a list before counting.`, `数える前に、${sets[3]}を書き並べてみましょう。`],
          sol: [[`$${sets[1]} = ${setTeX(sets[0])}$.`, `$${sets[1]} = ${setTeX(sets[0])}$ です。`], [`It has ${sets[0].length} element${sets[0].length === 1 ? '' : 's'}. Each number of $U$ sits in exactly one of the four regions of the Venn diagram, and the operation just selects regions.`, `要素は ${sets[0].length} 個です。$U$ の各数はベン図の4つの領域のどれか1つにだけ入り、演算はその領域を選ぶだけです。`]],
        };
      }
      if (form === 1) {
        const a = r.int(4, 12), b = r.int(4, 12), c = r.int(0, Math.min(a, b) - 1);
        return {
          q: [`$|A| = ${a}$, $|B| = ${b}$ and $|A \\cap B| = ${c}$. Find $|A \\cup B|$.`, `$|A| = ${a}$、$|B| = ${b}$、$|A \\cap B| = ${c}$ です。$|A \\cup B|$ を求めてください。`],
          a: { type: 'int', v: a + b - c },
          hint: ['Adding $|A| + |B|$ counts the overlap twice.', '$|A| + |B|$ では共通部分を2回数えています。'],
          sol: [[`$|A \\cup B| = |A| + |B| - |A \\cap B| = ${a} + ${b} - ${c}$.`, `$|A \\cup B| = |A| + |B| - |A \\cap B| = ${a} + ${b} - ${c}$ です。`], [`So the union has ${a + b - c} elements: the ${c} shared elements are counted once, not twice.`, `したがって和集合の要素は ${a + b - c} 個です。共有する ${c} 個を2回ではなく1回だけ数えます。`]],
        };
      }
      if (form === 2) {
        const n = r.int(2, 8), v = r.int(0, 2);
        const val = [Math.pow(2, n), Math.pow(2, n) - 1, Math.pow(2, n) - 2][v];
        const what = [['subsets', 'subsets (counting $\\varnothing$ and $S$ itself)', 'すべての部分集合（$\\varnothing$ と自分自身を含む）'], ['proper subsets', 'proper subsets', '真部分集合'], ['nonempty proper subsets', 'subsets that are neither empty nor the whole set', '空集合でも全体でもない部分集合']][v];
        return {
          q: [`A set $S$ has ${n} elements. How many ${what[1]} does it have?`, `集合 $S$ の要素は ${n} 個です。${what[2]}は何個ありますか。`],
          a: { type: 'int', v: val },
          hint: ['Each element is either in or out: two choices, made independently.', '各要素は「入れる」か「入れない」かの2通りで、互いに独立です。'],
          sol: [[`There are $2^{${n}} = ${Math.pow(2, n)}$ subsets in all, one for each way of deciding membership of the ${n} elements.`, `部分集合は全部で $2^{${n}} = ${Math.pow(2, n)}$ 個あります。${n} 個の要素それぞれに帰属を決める方法と1対1に対応します。`], [v === 0 ? 'Nothing is excluded, so the count is $2^n$.' : v === 1 ? 'Remove the set itself: only $S$ is not proper.' : 'Remove both $\\varnothing$ and $S$.', v === 0 ? '除外するものはないので $2^n$ 個です。' : v === 1 ? '真部分集合でないのは $S$ 自身だけなので、それを除きます。' : '$\\varnothing$ と $S$ の両方を除きます。'], [`The answer is ${val}.`, `答えは ${val} 個です。`]],
        };
      }
      const a = r.pick([1, 2, 3]), b = r.pick([4, 5]);
      const cand = [a, b, [a], [a, b], []];
      const S = r.sample(cand, 3);
      const stm = [[a, 'e'], [[a], 'e'], [[a, b], 'e'], [[], 'e'], [[a], 's'], [[a, b], 's'], [[[a]], 's'], [[], 's']];
      const chosen = r.sample(stm, 6);
      let cnt = 0; const lines = [];
      for (const [x, k] of chosen) { const t = k === 'e' ? inSet(x, S) : subsetOf(x, S); if (t) cnt++; lines.push(`$${tex(x)} ${k === 'e' ? '\\in' : '\\subseteq'} S$ is ${t ? 'true' : 'false'}`); }
      const linesJa = chosen.map(([x, k]) => `$${tex(x)} ${k === 'e' ? '\\in' : '\\subseteq'} S$ は${(k === 'e' ? inSet(x, S) : subsetOf(x, S)) ? '真' : '偽'}`);
      return {
        q: [`Let $S = ${tex(S)}$. How many of these six statements are true? ${chosen.map(([x, k]) => `$${tex(x)} ${k === 'e' ? '\\in' : '\\subseteq'} S$`).join(', ')}.`, `$S = ${tex(S)}$ とします。次の6つの主張のうち、正しいものはいくつありますか。${chosen.map(([x, k]) => `$${tex(x)} ${k === 'e' ? '\\in' : '\\subseteq'} S$`).join('、')}。`],
        a: { type: 'int', v: cnt },
        hint: ['$x \\in S$ asks whether $x$ is one of the listed items. $X \\subseteq S$ asks whether every element of $X$ is.', '$x \\in S$ は $x$ が並んでいる要素の1つかを、$X \\subseteq S$ は $X$ のすべての要素が $S$ にあるかを問います。'],
        sol: [[lines.join('; ') + '.', linesJa.join('、') + '。'], [`${cnt} of the six are true. The two symbols ask different questions: membership looks at the items of $S$ as they are written, containment looks inside the candidate set.`, `正しいのは ${cnt} 個です。2つの記号は別の問いです。$\\in$ は $S$ に書かれた要素そのものを見て、$\\subseteq$ は候補の集合の中身を見ます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.int(8, 20), b = r.int(8, 20), c = r.int(8, 20), ab = r.int(2, 6), ac = r.int(2, 6), bc = r.int(2, 6), abc = r.int(0, 2);
        const v = a + b + c - ab - ac - bc + abc;
        return {
          q: [`$|A| = ${a}$, $|B| = ${b}$, $|C| = ${c}$, $|A \\cap B| = ${ab}$, $|A \\cap C| = ${ac}$, $|B \\cap C| = ${bc}$ and $|A \\cap B \\cap C| = ${abc}$. Find $|A \\cup B \\cup C|$.`, `$|A| = ${a}$、$|B| = ${b}$、$|C| = ${c}$、$|A \\cap B| = ${ab}$、$|A \\cap C| = ${ac}$、$|B \\cap C| = ${bc}$、$|A \\cap B \\cap C| = ${abc}$ です。$|A \\cup B \\cup C|$ を求めてください。`],
          a: { type: 'int', v },
          hint: ['Add the singles, subtract the pairs, add back the triple.', '1つずつを足し、2つずつを引き、3つ全部を足し戻します。'],
          sol: [[`$|A \\cup B \\cup C| = ${a} + ${b} + ${c} - ${ab} - ${ac} - ${bc} + ${abc}$.`, `$|A \\cup B \\cup C| = ${a} + ${b} + ${c} - ${ab} - ${ac} - ${bc} + ${abc}$ です。`], [`The triple overlap is subtracted three times by the pairs and added once more, so it ends up counted exactly once. The union has ${v} elements.`, `三重の共通部分は、2つずつの項で3回引かれ、あとで1回足し戻されて、ちょうど1回だけ数えられます。和集合の要素は ${v} 個です。`]],
        };
      }
      if (form === 1) {
        const N = r.int(30, 80), a = r.int(10, 25), b = r.int(10, 25), c = r.int(2, Math.min(a, b) - 2);
        const un = a + b - c, v = N - un, w = a + b - 2 * c;
        const which = r.int(0, 1);
        return {
          q: [`In a universe of $${N}$ elements, $|A| = ${a}$, $|B| = ${b}$ and $|A \\cap B| = ${c}$. How many elements are in ${which ? '$A \\triangle B$ (exactly one of the two sets)' : '$(A \\cup B)^c$ (neither set)'}?`, `要素が $${N}$ 個の全体集合で、$|A| = ${a}$、$|B| = ${b}$、$|A \\cap B| = ${c}$ です。${which ? '$A \\triangle B$（どちらか一方だけに入る要素）' : '$(A \\cup B)^c$（どちらにも入らない要素）'}は何個ですか。`],
          a: { type: 'int', v: which ? w : v },
          hint: [which ? 'Remove the overlap from each set first.' : 'Find $|A \\cup B|$ first, then take the rest of the universe.', which ? '先にそれぞれの集合から共通部分を除きます。' : 'まず $|A \\cup B|$ を求め、全体から引きます。'],
          sol: which
            ? [[`Only in $A$: $${a} - ${c} = ${a - c}$. Only in $B$: $${b} - ${c} = ${b - c}$.`, `$A$ だけ：$${a} - ${c} = ${a - c}$。$B$ だけ：$${b} - ${c} = ${b - c}$ です。`], [`So $|A \\triangle B| = ${w}$, which is $|A| + |B| - 2|A \\cap B|$: the overlap is removed from both sides.`, `よって $|A \\triangle B| = ${w}$ で、これは $|A| + |B| - 2|A \\cap B|$ です。共通部分を両側から取り除いています。`]]
            : [[`$|A \\cup B| = ${a} + ${b} - ${c} = ${un}$.`, `$|A \\cup B| = ${a} + ${b} - ${c} = ${un}$ です。`], [`By De Morgan, $(A \\cup B)^c = A^c \\cap B^c$ has $${N} - ${un} = ${v}$ elements: those in neither set.`, `ド・モルガンの法則より $(A \\cup B)^c = A^c \\cap B^c$ で、要素は $${N} - ${un} = ${v}$ 個、つまりどちらにも入らないものです。`]],
        };
      }
      if (form === 2) {
        const x = r.int(2, 4), y = r.int(2, 5), t = r.int(0, 3);
        const val = [x * y, Math.pow(y, x), Math.pow(2, x * x), Math.pow(2, x * y)][t];
        const ask = [['ordered pairs in $X \\times Y$', '$X \\times Y$ の順序対'], ['functions $f : X \\to Y$', '関数 $f : X \\to Y$'], ['binary relations on $X$ (subsets of $X \\times X$)', '$X$ 上の二項関係（$X \\times X$ の部分集合）'], ['relations from $X$ to $Y$ (subsets of $X \\times Y$)', '$X$ から $Y$ への関係（$X \\times Y$ の部分集合）']][t];
        const how = [`$|X \\times Y| = |X|\\,|Y| = ${x} \\cdot ${y}$.`, `Each of the ${x} inputs independently picks one of ${y} outputs: $${y}^{${x}}$.`, `$X \\times X$ has $${x}^2 = ${x * x}$ pairs, and a relation chooses any subset of them: $2^{${x * x}}$.`, `$X \\times Y$ has $${x * y}$ pairs, and a relation is any subset of them: $2^{${x * y}}$.`];
        const howJa = [`$|X \\times Y| = |X|\\,|Y| = ${x} \\cdot ${y}$ です。`, `${x} 個の入力が互いに独立に ${y} 個の出力から1つずつ選ぶので $${y}^{${x}}$ です。`, `$X \\times X$ の順序対は $${x}^2 = ${x * x}$ 個で、関係はその任意の部分集合なので $2^{${x * x}}$ です。`, `$X \\times Y$ の順序対は $${x * y}$ 個で、関係はその任意の部分集合なので $2^{${x * y}}$ です。`];
        return {
          q: [`${t === 2 ? `$|X| = ${x}$.` : `$|X| = ${x}$ and $|Y| = ${y}$.`} How many ${ask[0]} are there?`, `${t === 2 ? `$|X| = ${x}$` : `$|X| = ${x}$、$|Y| = ${y}$`} です。${ask[1]}は何個ありますか。`],
          a: { type: 'int', v: val },
          hint: ['Count the pairs first, then ask what is being chosen from them.', 'まず順序対の個数を数え、次に何を選ぶのかを考えます。'],
          sol: [[how[t], howJa[t]], [`That is ${val}. A function is a relation that picks exactly one pair for each input, which is why there are far fewer functions than relations.`, `答えは ${val} です。関数は各入力にちょうど1つの順序対を選ぶ関係なので、関係よりずっと少なくなります。`]],
        };
      }
      const n = r.int(3, 6);
      const kind = r.int(0, 1);
      const v = kind === 0 ? Math.pow(3, n) : Math.pow(7, n);
      return {
        q: [kind === 0 ? `$S$ has ${n} elements. How many pairs $(A, B)$ of subsets satisfy $A \\subseteq B \\subseteq S$?` : `$S$ has ${n} elements. How many ordered triples $(A, B, C)$ of subsets satisfy $A \\cup B \\cup C = S$?`, kind === 0 ? `$S$ の要素は ${n} 個です。$A \\subseteq B \\subseteq S$ を満たす部分集合の組 $(A, B)$ は何通りありますか。` : `$S$ の要素は ${n} 個です。$A \\cup B \\cup C = S$ を満たす部分集合の順序つき3つ組 $(A, B, C)$ は何通りありますか。`],
        a: { type: 'int', v },
        hint: ['Decide each element of $S$ separately: how many allowed fates does it have?', '$S$ の要素を1つずつ別々に考え、取りうる状態が何通りあるかを数えます。'],
        sol: kind === 0
          ? [['Each element is in $A$ (so also in $B$), in $B$ only, or in neither: 3 allowed fates. "In $A$ but not in $B$" is forbidden.', '各要素は「$A$ に入る（したがって $B$ にも）」「$B$ だけに入る」「どちらにも入らない」の3通りです。「$A$ に入るが $B$ に入らない」は許されません。'], [`The choices are independent, so there are $3^{${n}} = ${v}$ pairs.`, `選択は独立なので、組は $3^{${n}} = ${v}$ 通りです。`]]
          : [['Each element must lie in at least one of $A$, $B$, $C$: $2^3 - 1 = 7$ allowed fates, since only "in none" is forbidden.', '各要素は $A$、$B$、$C$ の少なくとも1つに入らなければなりません。「どれにも入らない」だけが禁止なので、$2^3 - 1 = 7$ 通りです。'], [`The choices are independent, so there are $7^{${n}} = ${v}$ triples.`, `選択は独立なので、3つ組は $7^{${n}} = ${v}$ 通りです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const t = r.int(0, 3);
        const f = [['2^(n-1)', 'subsets of even size', '偶数個の要素をもつ部分集合', 'Pair subsets by toggling one fixed element: this flips the parity of the size, so exactly half the $2^n$ subsets have even size.', '1つの固定した要素の出入りを切り替えると大きさの偶奇が変わるので、$2^n$ 個の部分集合のちょうど半分が偶数個です。'], ['2^(2^n)', 'subsets of $\\mathcal P(S)$ (the power set of the power set)', '$\\mathcal P(S)$ の部分集合（べき集合のべき集合）', '$|\\mathcal P(S)| = 2^n$, and a subset of a set with $m$ elements can be chosen in $2^m$ ways, with $m = 2^n$.', '$|\\mathcal P(S)| = 2^n$ で、$m$ 要素の集合の部分集合は $2^m$ 個なので、$m = 2^n$ を代入します。'], ['2^(n^2)', 'binary relations on $S$', '$S$ 上の二項関係', '$S \\times S$ has $n^2$ pairs, and a relation is any subset of them.', '$S \\times S$ の順序対は $n^2$ 個で、関係はその任意の部分集合です。'], ['2^(n^2-n)', 'reflexive binary relations on $S$', '$S$ 上の反射的な二項関係', 'All $n$ diagonal pairs are forced in; each of the other $n^2 - n$ pairs is free.', '対角の $n$ 個の対は必ず含まれ、残りの $n^2 - n$ 個は自由に選べます。']][t];
        return {
          q: [`$|S| = n$. Give the number of ${f[1]} as a formula in $n$.`, `$|S| = n$ のとき、${f[2]}の個数を $n$ の式で答えてください。`],
          a: { type: 'expr', v: f[0], vars: ['n'], dom: { n: [1, 3.5] }, lhs: ['Number $=$', '個数 $=$'] },
          hint: [t === 1 ? 'Apply "a set with $m$ elements has $2^m$ subsets" twice.' : 'Think of each choice as in or out, then count how many independent in/out decisions there are.', t === 1 ? '「$m$ 要素の集合には $2^m$ 個の部分集合がある」を2回使います。' : '各選択を「入れる・入れない」とみなし、独立な決定がいくつあるか数えます。'],
          sol: [[f[3], f[4]], [`The count is $${P.toTeX(P.parse(f[0], ['n']))}$. Counting by independent in/out decisions is the whole method: the answer is a power of 2 whose exponent counts the decisions.`, `個数は $${P.toTeX(P.parse(f[0], ['n']))}$ です。独立な出入りの決定で数えるのが方法のすべてで、答えは決定の個数を指数とする 2 のべきになります。`]],
        };
      }
      if (form === 1) {
        const n = r.int(3, 6);
        return {
          q: [`How many equivalence relations are there on a set with ${n} elements? (Equivalently, how many ways to split it into nonempty blocks?)`, `${n} 個の要素をもつ集合上の同値関係は何通りありますか。（同じことですが、空でないブロックに分ける方法は何通りですか。）`],
          a: { type: 'int', v: bell(n) },
          hint: ['An equivalence relation is the same data as a partition. Count partitions by the size of the block containing a chosen element.', '同値関係は分割と同じ情報です。ある要素を含むブロックの大きさで場合分けして数えます。'],
          sol: [[`Equivalence relations correspond one to one with partitions into blocks, so the count is the Bell number $B_{${n}}$.`, `同値関係は分割と1対1に対応するので、答えはベル数 $B_{${n}}$ です。`], [`Using $B_{m+1} = \\sum_k \\binom{m}{k} B_k$ gives $B_{${n}} = ${bell(n)}$.`, `$B_{m+1} = \\sum_k \\binom{m}{k} B_k$ を使うと $B_{${n}} = ${bell(n)}$ です。`]],
        };
      }
      if (form === 2) {
        const n = r.int(3, 7), k = r.int(2, 3);
        const surj = sCount(n, k);
        const st = surj / fact(k);
        return {
          q: [`How many surjections are there from a set with ${n} elements onto a set with ${k} elements? (Use inclusion and exclusion on the outputs that are missed.)`, `要素が ${n} 個の集合から要素が ${k} 個の集合への全射は何個ありますか。（取りこぼす出力について包除原理を使ってください。）`],
          a: { type: 'int', v: surj },
          hint: ['Count all functions, subtract those missing one output, add back those missing two.', 'すべての関数から、1つの出力を取りこぼすものを引き、2つ取りこぼすものを足し戻します。'],
          sol: [[`$\\sum_{j}(-1)^j\\binom{${k}}{j}(${k}-j)^{${n}} = ${surj}$.`, `$\\sum_{j}(-1)^j\\binom{${k}}{j}(${k}-j)^{${n}} = ${surj}$ です。`], [`Dividing by $${k}!$ counts the ways to split the inputs into ${k} nonempty blocks: ${st}. So surjections are partitions together with a labelling of the blocks by outputs.`, `$${k}!$ で割ると、入力を空でない ${k} 個のブロックに分ける方法の数 ${st} になります。全射は、分割とブロックへの出力の割り当ての組です。`]],
        };
      }
      const n = r.int(3, 6);
      return {
        q: [`How many equivalence relations on an $n$-element set have exactly two classes? Give a formula in $n$.`, `$n$ 個の要素をもつ集合上で、同値類がちょうど2つになる同値関係は何通りですか。$n$ の式で答えてください。`],
        a: { type: 'expr', v: '2^(n-1)-1', vars: ['n'], dom: { n: [1, 3.5] }, lhs: ['Number $=$', '個数 $=$'] },
        hint: ['A two-class relation is a split into two nonempty unlabelled blocks. How many labelled splits are there?', '類が2つの関係は、空でない2つのブロックへの分け方です。名前を付けた分け方は何通りですか。'],
        sol: [['Label each element "left" or "right": $2^n$ ways, but the two all-same labellings leave a block empty, so $2^n - 2$ remain.', '各要素に「左」「右」の名前を付けると $2^n$ 通りです。ただし全部同じ名前だと空のブロックができるので、$2^n - 2$ 通りが残ります。'], ['The blocks are not named, so each split was counted twice: $(2^n - 2)/2 = 2^{n-1} - 1$.', 'ブロックに名前はないので、各分け方を2回数えています。$(2^n - 2)/2 = 2^{n-1} - 1$ です。'], [`For $n = ${n}$ this is $${Math.pow(2, n - 1) - 1}$, the Stirling number $S(${n}, 2)$.`, `$n = ${n}$ では ${Math.pow(2, n - 1) - 1} で、スターリング数 $S(${n}, 2)$ です。`]],
      };
    },
  ];

  /* ---------- relations, quotients, functions ---------- */
  const X4 = [1, 2, 3, 4];
  const props = (pairs, X) => {
    const has = (a, b) => pairs.some(([p, q]) => p === a && q === b);
    let refl = true, sym = true, trans = true, wRefl, wSym, wTrans;
    for (const a of X) if (!has(a, a)) { refl = false; wRefl = a; break; }
    for (const a of X) for (const b of X) if (has(a, b) && !has(b, a) && sym) { sym = false; wSym = [a, b]; }
    for (const a of X) for (const b of X) for (const c of X) if (has(a, b) && has(b, c) && !has(a, c) && trans) { trans = false; wTrans = [a, b, c]; }
    return { refl, sym, trans, wRefl, wSym, wTrans };
  };

  Q['set-theory-relations'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(2, 5), N = r.int(12, 30), rem = r.int(0, m - 1);
        const cnt = Array.from({ length: N }, (_, i) => i + 1).filter((x) => x % m === rem).length;
        return {
          q: [`Define $a \\sim b$ on $\\{1, \\dots, ${N}\\}$ to mean that $${m}$ divides $a - b$. How many elements are in the class of the numbers with remainder $${rem}$?`, `$\\{1, \\dots, ${N}\\}$ 上で、$a - b$ が $${m}$ で割り切れることを $a \\sim b$ と定めます。余り $${rem}$ の数の同値類には要素がいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['List the numbers with that remainder, or count them with a quotient.', 'その余りをもつ数を並べるか、商で数えます。'],
          sol: [[`The numbers in $\\{1, \\dots, ${N}\\}$ with remainder ${rem} on division by ${m} are ${Array.from({ length: N }, (_, i) => i + 1).filter((x) => x % m === rem).slice(0, 6).join(', ')}${cnt > 6 ? ', ...' : ''}.`, `$\\{1, \\dots, ${N}\\}$ のうち ${m} で割った余りが ${rem} の数は ${Array.from({ length: N }, (_, i) => i + 1).filter((x) => x % m === rem).slice(0, 6).join('、')}${cnt > 6 ? '、...' : ''} です。`], [`There are ${cnt} of them. The ${m} classes cover ${N} numbers, so their sizes differ by at most 1.`, `全部で ${cnt} 個です。${m} 個の類が ${N} 個の数を分け合うので、大きさの差は高々1です。`]],
          set: { m },
        };
      }
      if (form === 1) {
        const n = r.int(3, 9), t = r.int(0, 3);
        const v = [n * (n + 1) / 2, n * (n - 1) / 2, n, n * n][t];
        const nm = [['$x \\le y$', '$x \\le y$'], ['$x < y$', '$x < y$'], ['$x = y$', '$x = y$'], ['"every $x$ is related to every $y$"', '「すべての $x$ がすべての $y$ と関係する」']][t];
        return {
          q: [`How many ordered pairs $(x, y)$ with $x, y \\in \\{1, \\dots, ${n}\\}$ belong to the relation ${nm[0]}?`, `$x, y \\in \\{1, \\dots, ${n}\\}$ の順序対 $(x, y)$ のうち、関係 ${nm[1]} に属するものは何個ですか。`],
          a: { type: 'int', v },
          hint: ['Count by the value of $x$, or by the shape of the region in the grid of all pairs.', '$x$ の値ごとに数えるか、全順序対の格子での領域の形で数えます。'],
          sol: [[[`Row $x$ has $${n} - x + 1$ allowed values of $y$, so the total is $${n}(${n}+1)/2$.`, `Row $x$ has $y \\in \\{1, \\dots, x-1\\}$, so the total is $${n}(${n}-1)/2$.`, `Only the diagonal pairs $(x, x)$ qualify: ${n} of them.`, `All $${n} \\times ${n}$ pairs qualify.`][t], [`$x$ に対して $y$ は $${n} - x + 1$ 通りなので、合計は $${n}(${n}+1)/2$ です。`, `$x$ に対して $y \\in \\{1, \\dots, x-1\\}$ なので、合計は $${n}(${n}-1)/2$ です。`, `対角の順序対 $(x, x)$ だけが該当し、${n} 個です。`, `$${n} \\times ${n}$ 個のすべてが該当します。`][t]], [`That is ${v}. A relation on an $n$-set is a subset of the $n^2$ cells of the grid; these four are the diagonal, the triangle on or above it, the triangle above it, and the whole grid.`, `答えは ${v} です。$n$ 個の集合上の関係は $n^2$ 個の格子の部分集合で、この4つは対角線、対角線を含む三角形、対角線を含まない三角形、格子全体に当たります。`]],
        };
      }
      const X = [1, 2, 3];
      const all = []; for (const a of X) for (const b of X) all.push([a, b]);
      let pairs;
      const style = r.int(0, 3);
      if (style === 0) { const cut = r.int(1, 2); pairs = all.filter(([a, b]) => (a <= cut) === (b <= cut)); }
      else if (style === 1) pairs = all.filter(([a, b]) => a <= b);
      else if (style === 2) pairs = all.filter(([a, b]) => a === b || r.chance(0.35));
      else pairs = all.filter(([a, b]) => (a + b) % 2 === 0 || (a === 1 && b === 2));
      const p = props(pairs, X);
      const eq = p.refl && p.sym && p.trans;
      const listTeX = pairs.map(([a, b]) => `(${a}, ${b})`).join(', ');
      const fail = !p.refl ? [`it is not reflexive: $(${p.wRefl}, ${p.wRefl})$ is missing`, `反射的ではありません。$(${p.wRefl}, ${p.wRefl})$ がありません`] : !p.sym ? [`it is not symmetric: $(${p.wSym[0]}, ${p.wSym[1]})$ is present but $(${p.wSym[1]}, ${p.wSym[0]})$ is not`, `対称的ではありません。$(${p.wSym[0]}, ${p.wSym[1]})$ はありますが $(${p.wSym[1]}, ${p.wSym[0]})$ がありません`] : !p.trans ? [`it is not transitive: $(${p.wTrans[0]}, ${p.wTrans[1]})$ and $(${p.wTrans[1]}, ${p.wTrans[2]})$ are present but $(${p.wTrans[0]}, ${p.wTrans[2]})$ is not`, `推移的ではありません。$(${p.wTrans[0]}, ${p.wTrans[1]})$ と $(${p.wTrans[1]}, ${p.wTrans[2]})$ はありますが $(${p.wTrans[0]}, ${p.wTrans[2]})$ がありません`] : null;
      return {
        q: [`On $X = \\{1, 2, 3\\}$ the relation $R$ consists of the pairs ${listTeX ? '$' + listTeX + '$' : 'none'}. Is $R$ an equivalence relation?`, `$X = \\{1, 2, 3\\}$ 上の関係 $R$ は順序対 ${listTeX ? '$' + listTeX + '$' : 'なし'} からなります。$R$ は同値関係ですか。`],
        a: { type: 'choice', fixed: true, v: eq ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['Check reflexive, symmetric and transitive in turn, and stop at the first failure.', '反射的、対称的、推移的を順に確かめ、最初に失敗したところで止めます。'],
        sol: eq
          ? [['All three properties hold: every diagonal pair is present, every pair has its reverse, and every two-step connection has its shortcut.', '3つの性質がすべて成り立ちます。対角の順序対がすべてあり、どの対にも逆の対があり、2段階のつながりにはすべて直接の対があります。'], ['So $R$ is an equivalence relation, and it splits $X$ into disjoint classes.', 'したがって $R$ は同値関係で、$X$ を互いに素な類に分けます。']]
          : [[`$R$ is not an equivalence relation: ${fail[0]}.`, `$R$ は同値関係ではありません。${fail[1]}。`], ['One counterexample to one property is enough to rule it out.', '性質を1つでも反例で崩せば、同値関係ではないと言えます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([5, 7, 11, 13]);
        const cls = new Set(); const seen = new Map();
        for (let a = 0; a < p; a++) { const k = (a * a) % p; seen.set(k, (seen.get(k) || 0) + 1); }
        return {
          q: [`On $\\{0, 1, \\dots, ${p - 1}\\}$ define $a \\sim b$ to mean $a^2 \\equiv b^2 \\pmod{${p}}$. How many equivalence classes does $\\sim$ have?`, `$\\{0, 1, \\dots, ${p - 1}\\}$ 上で、$a^2 \\equiv b^2 \\pmod{${p}}$ を $a \\sim b$ と定めます。同値類はいくつありますか。`],
          a: { type: 'int', v: seen.size },
          hint: ['Two numbers are equivalent exactly when they have the same square mod the prime. Which pairs have the same square?', '同じ平方（素数を法として）をもつ2数が同値です。どんな組が同じ平方をもつでしょうか。'],
          sol: [[`Modulo the prime ${p}, $a^2 \\equiv b^2$ forces $a \\equiv \\pm b$. So the classes are $\\{0\\}$ and the pairs $\\{a, ${p}-a\\}$.`, `素数 ${p} を法とすると、$a^2 \\equiv b^2$ から $a \\equiv \\pm b$ が従います。類は $\\{0\\}$ と対 $\\{a, ${p}-a\\}$ です。`], [`That gives $1 + (${p}-1)/2 = ${seen.size}$ classes. The classes are the fibres of the squaring map, so they are the same as the set of squares.`, `類の数は $1 + (${p}-1)/2 = ${seen.size}$ です。類は平方写像のファイバーなので、平方数の集合と対応します。`]],
        };
      }
      if (form === 1) {
        const nx = 5, ny = r.int(3, 4), Y = 'abcd'.slice(0, ny).split('');
        const f = Array.from({ length: nx }, () => r.pick(Y));
        const S = r.sample([1, 2, 3, 4, 5], r.int(2, 4)).sort((x, y) => x - y);
        const T = r.sample(Y, r.int(1, 2)).sort();
        const imS = [...new Set(S.map((i) => f[i - 1]))];
        const pre = [1, 2, 3, 4, 5].filter((i) => T.includes(f[i - 1]));
        const askPre = r.chance(0.5);
        const table = `\\begin{array}{c|ccccc} x & 1 & 2 & 3 & 4 & 5 \\\\ \\hline f(x) & ${f.join(' & ')} \\end{array}`;
        return {
          q: askPre ? [`A function $f$ is given by $${table}$. How many elements does the preimage $f^{-1}(${setTeX(T)})$ have?`, `関数 $f$ を $${table}$ で定めます。逆像 $f^{-1}(${setTeX(T)})$ の要素は何個ですか。`] : [`A function $f$ is given by $${table}$. How many elements does the image $f(${setTeX(S)})$ have?`, `関数 $f$ を $${table}$ で定めます。像 $f(${setTeX(S)})$ の要素は何個ですか。`],
          a: { type: 'int', v: askPre ? pre.length : imS.length },
          hint: askPre ? ['Collect every input whose output lies in the target set.', '出力が目標の集合に入る入力をすべて集めます。'] : ['Apply $f$ to each input in the subset, then remove repeats.', '部分集合の各入力に $f$ を適用し、重複を取り除きます。'],
          sol: askPre
            ? [[`The inputs landing in $${setTeX(T)}$ are $${setTeX(pre)}$.`, `出力が $${setTeX(T)}$ に入る入力は $${setTeX(pre)}$ です。`], [`So $|f^{-1}(${setTeX(T)})| = ${pre.length}$. A preimage is defined for any target subset, with or without an inverse function.`, `したがって $|f^{-1}(${setTeX(T)})| = ${pre.length}$ です。逆像は、逆関数がなくてもどんな目標の部分集合に対しても定まります。`]]
            : [[`The outputs are ${S.map((i) => f[i - 1]).join(', ')}.`, `出力は ${S.map((i) => f[i - 1]).join('、')} です。`], [`Repeated outputs count once, so $f(${setTeX(S)}) = ${setTeX(imS)}$ has ${imS.length} element${imS.length === 1 ? '' : 's'}.`, `重複した出力は1回だけ数えるので、$f(${setTeX(S)}) = ${setTeX(imS)}$ の要素は ${imS.length} 個です。`]],
        };
      }
      const m = r.int(2, 6), a0 = r.int(1, 40);
      const cls = ((a0 % m) + m) % m;
      return {
        q: [`Integers are related when $${m}$ divides their difference. A set of representatives, one from each class, must be chosen so that every integer is related to exactly one of them. How many representatives are needed?`, `整数 $a, b$ は $a - b$ が $${m}$ で割り切れるとき関係があるとします。すべての整数がちょうど1つの代表と関係をもつように、各類から1つずつ代表を選びます。代表はいくつ必要ですか。`],
        a: { type: 'int', v: m },
        hint: ['The classes are the possible remainders on division by the modulus.', '類は、その数で割ったときに起こりうる余りに対応します。'],
        sol: [[`The relation remembers only the remainder, and there are ${m} possible remainders $0, \\dots, ${m - 1}$. For example ${a0} is in the class of remainder ${cls}.`, `この関係は余りだけを覚えていて、余りは $0, \\dots, ${m - 1}$ の ${m} 通りです。たとえば ${a0} は余り ${cls} の類に入ります。`], [`So there are ${m} classes and ${m} representatives are needed. The quotient set $\\mathbb Z/{\\sim}$ is the set of classes, and each integer lies in exactly one of them.`, `したがって類は ${m} 個で、代表も ${m} 個必要です。商集合 $\\mathbb Z/{\\sim}$ は類の集合で、各整数はちょうど1つの類に入ります。`]],
        set: { m: Math.min(m, 5) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 2, 3]), n = r.int(k === 2 ? 4 : 4, 7);
        const v = sCount(n, k);
        const all = Math.pow(k, n);
        return {
          q: [`How many functions $f : \\{1, \\dots, ${n}\\} \\to \\{${'abc'.slice(0, k).split('').join(', ')}\\}$ are onto the whole codomain?`, `関数 $f : \\{1, \\dots, ${n}\\} \\to \\{${'abc'.slice(0, k).split('').join(', ')}\\}$ のうち、終域全体への全射はいくつありますか。`],
          a: { type: 'int', v },
          hint: ['Count all functions, then remove the ones that miss at least one output (inclusion and exclusion).', 'すべての関数を数え、出力を少なくとも1つ取りこぼすものを（包除原理で）除きます。'],
          sol: k === 2
            ? [[`All functions: $2^{${n}} = ${all}$. The two constant functions miss an output.`, `関数は全部で $2^{${n}} = ${all}$ 個です。2つの定数関数は出力を取りこぼします。`], [`So there are $2^{${n}} - 2 = ${v}$ surjections. For a general $n$ the formula is $2^n - 2$.`, `したがって全射は $2^{${n}} - 2 = ${v}$ 個です。一般の $n$ では $2^n - 2$ です。`]]
            : [[`All functions: $3^{${n}} = ${all}$. Those missing one given output number $2^{${n}} = ${Math.pow(2, n)}$ each, three choices of output; those missing two number 1 each, three choices.`, `関数は全部で $3^{${n}} = ${all}$ 個です。特定の出力1つを取りこぼすものは $2^{${n}} = ${Math.pow(2, n)}$ 個ずつで出力の選び方が3通り、2つ取りこぼすものは1個ずつで3通りです。`], [`Inclusion and exclusion: $3^{${n}} - 3 \\cdot 2^{${n}} + 3 = ${v}$ surjections, which is $3! = 6$ times the number of ways to split the inputs into three nonempty blocks.`, `包除原理より $3^{${n}} - 3 \\cdot 2^{${n}} + 3 = ${v}$ 個です。これは入力を空でない3つのブロックに分ける方法の数の $3! = 6$ 倍です。`]],
        };
      }
      if (form === 1) {
        const ny = 4, Y = 'abcd'.split('');
        let f;
        do { f = [r.pick(Y), r.pick(Y), r.pick(Y), r.pick(Y)]; } while (f[0] === f[1] || new Set(f).size > 3);
        const S1 = [1, 2], S2 = [3, 4];
        const i1 = new Set(S1.map((i) => f[i - 1])), i2 = new Set(S2.map((i) => f[i - 1]));
        const common = [...i1].filter((y) => i2.has(y)).sort();
        const table = `\\begin{array}{c|cccc} x & 1 & 2 & 3 & 4 \\\\ \\hline f(x) & ${f.join(' & ')} \\end{array}`;
        return {
          q: [`With $${table}$, take the disjoint subsets $S_1 = \\{1, 2\\}$ and $S_2 = \\{3, 4\\}$. How many elements does $f(S_1) \\cap f(S_2)$ have?`, `$${table}$ で、互いに素な部分集合 $S_1 = \\{1, 2\\}$、$S_2 = \\{3, 4\\}$ を考えます。$f(S_1) \\cap f(S_2)$ の要素は何個ですか。`],
          a: { type: 'int', v: common.length },
          hint: ['Compute the two images separately, then intersect them.', '2つの像を別々に求めてから共通部分をとります。'],
          sol: [[`$f(S_1) = ${setTeX([...i1].sort())}$ and $f(S_2) = ${setTeX([...i2].sort())}$.`, `$f(S_1) = ${setTeX([...i1].sort())}$、$f(S_2) = ${setTeX([...i2].sort())}$ です。`], [`Their intersection has ${common.length} element${common.length === 1 ? '' : 's'}, while $f(S_1 \\cap S_2) = f(\\varnothing) = \\varnothing$ has none. ${common.length ? 'So images do not preserve intersections: only $f(S_1 \\cap S_2) \\subseteq f(S_1) \\cap f(S_2)$ holds in general.' : 'Here equality happens to hold, but only because no two inputs from different sets collide.'}`, `共通部分の要素は ${common.length} 個ですが、$f(S_1 \\cap S_2) = f(\\varnothing) = \\varnothing$ は空です。${common.length ? '像は共通部分を保ちません。一般には $f(S_1 \\cap S_2) \\subseteq f(S_1) \\cap f(S_2)$ しか成り立ちません。' : 'ここでは偶然等号が成り立ちますが、それは異なる集合の入力どうしが衝突していないからです。'}`]],
        };
      }
      const n = r.int(3, 6), m = r.int(2, Math.min(4, n));
      let inj = 1; for (let i = 0; i < m; i++) inj *= (n - i);
      return {
        q: [`How many injective functions are there from a set with ${m} elements to a set with ${n} elements?`, `${m} 個の要素の集合から ${n} 個の要素の集合への単射は何個ありますか。`],
        a: { type: 'int', v: inj },
        hint: ['Choose the outputs one input at a time; each earlier choice removes an option.', '入力を1つずつ順に出力を選びます。先の選択のたびに選べる数が1つ減ります。'],
        sol: [[`The first input has ${n} choices, the next ${n - 1}, and so on: $${Array.from({ length: m }, (_, i) => n - i).join(' \\cdot ')}$.`, `最初の入力には ${n} 通り、次には ${n - 1} 通り、と続き、$${Array.from({ length: m }, (_, i) => n - i).join(' \\cdot ')}$ です。`], [`That is ${inj}. Compare with $${n}^{${m}} = ${Math.pow(n, m)}$ functions in all: injectivity forbids collisions.`, `答えは ${inj} です。関数全体の $${n}^{${m}} = ${Math.pow(n, m)}$ 個と比べると、単射は衝突を禁じた分だけ少なくなります。`]],
      };
    },
  ];

  /* ---------- infinity and Cantor ---------- */
  const COUNT = [
    ['the integers $\\mathbb Z$', '整数全体 $\\mathbb Z$', true, 'List them $0, 1, -1, 2, -2, \\dots$.', '$0, 1, -1, 2, -2, \\dots$ と並べられます。'],
    ['the rationals $\\mathbb Q$', '有理数全体 $\\mathbb Q$', true, 'List the fractions $p/q$ in order of $p + q$.', '分数 $p/q$ を $p + q$ の順に並べられます。'],
    ['the set of pairs $\\mathbb N \\times \\mathbb N$', '組の集合 $\\mathbb N \\times \\mathbb N$', true, 'Walk the grid along the diagonals $a + b = 0, 1, 2, \\dots$.', '格子を対角線 $a + b = 0, 1, 2, \\dots$ に沿ってたどれます。'],
    ['the even positive integers', '正の偶数全体', true, 'Pair $n$ with $2n$.', '$n$ を $2n$ と対応させます。'],
    ['the set of finite subsets of $\\mathbb N$', '$\\mathbb N$ の有限部分集合全体', true, 'Send $\\{a_1, \\dots, a_k\\}$ to $2^{a_1} + \\dots + 2^{a_k}$, which is a binary expansion with finitely many ones.', '$\\{a_1, \\dots, a_k\\}$ を $2^{a_1} + \\dots + 2^{a_k}$ に対応させます。1が有限個の二進展開です。'],
    ['the interval $(0, 1)$ of real numbers', '実数の区間 $(0, 1)$', false, 'Cantor\'s diagonal argument builds a number missing from any list.', 'カントールの対角線論法で、どんな一覧にも載らない数が作れます。'],
    ['the set of infinite binary sequences', '無限の二進列全体', false, 'Flip the $n$th bit of the $n$th listed sequence.', '一覧の第 $n$ 列の第 $n$ ビットを反転します。'],
    ['the power set $\\mathcal P(\\mathbb N)$ of the natural numbers', 'べき集合 $\\mathcal P(\\mathbb N)$', false, 'Cantor\'s theorem: no set maps onto its own power set.', 'カントールの定理により、どの集合からも自身のべき集合への全射はありません。'],
    ['the set of all real numbers', '実数全体', false, 'It contains $(0, 1)$, which is already uncountable.', '実数全体はすでに非可算な $(0, 1)$ を含みます。'],
  ];
  const pairAt = (a, b) => (a + b) * (a + b + 1) / 2 + b;
  const unpair = (n) => { let s = 0; while ((s + 1) * (s + 2) / 2 <= n) s++; const b = n - s * (s + 1) / 2; return [s - b, b]; };

  Q['set-theory-infinity'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const it = r.pick(COUNT);
        return {
          q: [`Is ${it[0]} countable (can it be listed as a sequence)?`, `${it[1]}は可算ですか（数列として並べられますか）。`],
          a: { type: 'choice', fixed: true, v: it[2] ? 0 : 1, opts: [['Yes, countable', 'はい、可算です'], ['No, uncountable', 'いいえ、非可算です']] },
          hint: ['Try to describe a list that reaches every element, or a diagonal argument that beats every list.', 'すべての要素に届く一覧を作れるか、どんな一覧にも勝つ対角線論法があるかを考えます。'],
          sol: [[it[2] ? `Yes. ${it[3]}` : `No. ${it[3]}`, it[2] ? `はい、可算です。${it[4]}` : `いいえ、非可算です。${it[4]}`], [it[2] ? 'A part can be as large as the whole for infinite sets: countable means the same size as $\\mathbb N$.' : 'Infinite does not mean "all the same size": this set is strictly larger than $\\mathbb N$.', it[2] ? '無限集合では部分が全体と同じ大きさになりえます。可算とは $\\mathbb N$ と同じ大きさということです。' : '無限だからといって同じ大きさとは限りません。この集合は $\\mathbb N$ より真に大きいです。']],
        };
      }
      if (form === 1) {
        const n = 4;
        const rows = Array.from({ length: n }, () => Array.from({ length: n }, () => r.int(0, 1)));
        const bits = rows.map((row, i) => 1 - row[i]).join('');
        const arr = `\\begin{array}{c|cccc} & 1 & 2 & 3 & 4 \\\\ \\hline ${rows.map((row, i) => `${i + 1} & ${row.join(' & ')}`).join(' \\\\ ')} \\end{array}`;
        return {
          q: [`Four binary sequences (rows) are listed by their first four bits: $${arr}$. Flip the diagonal bits to build the first four bits of the diagonal sequence $b_n = 1 - a_{nn}$. Type them as four digits, such as 0110.`, `4つの二進列（行）を最初の4ビットで並べます。$${arr}$ 対角成分を反転して、対角線列 $b_n = 1 - a_{nn}$ の最初の4ビットを作ってください。0110 のように4桁の数字で答えます。`],
          a: { type: 'int', v: Number(bits), show: `\\texttt{${bits}}` },
          hint: ['Read the diagonal $a_{11}, a_{22}, a_{33}, a_{44}$, then flip each bit.', '対角成分 $a_{11}, a_{22}, a_{33}, a_{44}$ を読み、それぞれ反転します。'],
          sol: [[`The diagonal is ${rows.map((row, i) => row[i]).join('')}, so flipping gives ${bits}.`, `対角成分は ${rows.map((row, i) => row[i]).join('')} なので、反転すると ${bits} です。`], ['The new sequence differs from row $n$ at position $n$ for every $n$, so it equals no listed row. The same construction beats any list, which is why the infinite binary sequences are uncountable.', '新しい列は、どの $n$ についても第 $n$ 行と第 $n$ ビットで異なるので、一覧のどの行とも一致しません。同じ作り方がどんな一覧にも通用するため、無限の二進列は非可算です。']],
        };
      }
      const k = r.int(1, 4);
      const vals = [1, 2, 4, 16];
      return {
        q: [`Let $P_0 = \\varnothing$ and $P_{j+1} = \\mathcal P(P_j)$. How many elements does $P_${k}$ have?`, `$P_0 = \\varnothing$、$P_{j+1} = \\mathcal P(P_j)$ とします。$P_${k}$ の要素は何個ですか。`],
        a: { type: 'int', v: vals[k - 1] },
        hint: ['Each step turns a set with $m$ elements into one with $2^m$ elements.', '1段階ごとに、$m$ 個の集合が $2^m$ 個の集合になります。'],
        sol: [[`$|P_0| = 0$, $|P_1| = 2^0 = 1$, $|P_2| = 2$, $|P_3| = 4$, $|P_4| = 16$.`, `$|P_0| = 0$、$|P_1| = 2^0 = 1$、$|P_2| = 2$、$|P_3| = 4$、$|P_4| = 16$ です。`], [`So $|P_${k}| = ${vals[k - 1]}$. The power set of the empty set is $\\{\\varnothing\\}$, which has one element, so even $\\varnothing$ generates a growing tower.`, `したがって $|P_${k}| = ${vals[k - 1]}$ です。空集合のべき集合は 1 個の要素をもつ $\\{\\varnothing\\}$ なので、空集合だけからでも増え続ける塔ができます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let p, q;
        do { p = r.int(1, 6); q = r.int(1, 6); } while (gcd(p, q) !== 1);
        const s = p + q;
        let pos = 0;
        for (let t = 2; t <= s; t++) for (let a = 1; a < t; a++) { const b = t - a; if (gcd(a, b) !== 1) continue; pos++; if (t === s && a === p) break; }
        return {
          q: [`List the positive rationals $p/q$ in lowest terms by increasing $p + q$, and within the same sum by increasing $p$. What position does $${p}/${q}$ have in the list? (The first entry is $1/1$.)`, `正の有理数 $p/q$ を既約分数で、$p + q$ が小さい順、同じ和の中では $p$ が小さい順に並べます。$${p}/${q}$ は何番目ですか。（最初は $1/1$ です。）`],
          a: { type: 'int', v: pos },
          hint: ['Count the reduced fractions with a smaller sum, then find the place among those with the same sum.', '和が小さい既約分数を数え、同じ和の中での順位を加えます。'],
          sol: [[`The sum is ${s}. The reduced fractions with smaller sum number ${pos - (() => { let c = 0; for (let a = 1; a <= p; a++) if (gcd(a, s - a) === 1) c++; return c; })()}.`, `和は ${s} です。和がこれより小さい既約分数は ${pos - (() => { let c = 0; for (let a = 1; a <= p; a++) if (gcd(a, s - a) === 1) c++; return c; })()} 個あります。`], [`Among those with sum ${s}, $${p}/${q}$ is number ${(() => { let c = 0; for (let a = 1; a <= p; a++) if (gcd(a, s - a) === 1) c++; return c; })()}, so its position is ${pos}. Every positive rational has a finite sum, so it is reached after finitely many steps: the rationals are countable.`, `和が ${s} のものの中では ${(() => { let c = 0; for (let a = 1; a <= p; a++) if (gcd(a, s - a) === 1) c++; return c; })()} 番目なので、全体で ${pos} 番目です。正の有理数はどれも和が有限なので有限回で現れ、有理数は可算です。`]],
        };
      }
      if (form === 1) {
        const a = r.int(0, 6), b = r.int(0, 6);
        const v = pairAt(a, b);
        return {
          q: [`The pairing function $\\pi(a, b) = \\dfrac{(a + b)(a + b + 1)}{2} + b$ matches pairs of non-negative integers with single non-negative integers. Compute $\\pi(${a}, ${b})$.`, `対応 $\\pi(a, b) = \\dfrac{(a + b)(a + b + 1)}{2} + b$ は、非負整数の組を非負整数1つに結びつけます。$\\pi(${a}, ${b})$ を求めてください。`],
          a: { type: 'int', v },
          hint: ['Substitute: first find $a + b$.', '代入します。まず $a + b$ を求めます。'],
          sol: [[`$a + b = ${a + b}$, so $\\pi = ${(a + b) * (a + b + 1) / 2} + ${b} = ${v}$.`, `$a + b = ${a + b}$ なので $\\pi = ${(a + b) * (a + b + 1) / 2} + ${b} = ${v}$ です。`], ['The triangular number counts all pairs on earlier diagonals, and $b$ is the place along the current one. Each integer is hit exactly once, so $\\mathbb N \\times \\mathbb N$ is countable.', '三角数は前の対角線上の組の個数を数え、$b$ は今の対角線上での位置です。どの整数もちょうど1回現れるので、$\\mathbb N \\times \\mathbb N$ は可算です。']],
        };
      }
      const m = r.int(2, 6), n = r.int(1, 5), t = r.int(0, 1);
      const v = t === 0 ? Math.pow(n, m) : Math.pow(2, m);
      return {
        q: t === 0 ? [`How many functions are there from a set with ${m} elements to a set with ${n} elements?`, `${m} 個の要素の集合から ${n} 個の要素の集合への関数は何個ありますか。`] : [`A subset of a set $S$ with ${m} elements corresponds to its indicator function $S \\to \\{0, 1\\}$. How many such functions are there?`, `${m} 個の要素の集合 $S$ の部分集合は、指示関数 $S \\to \\{0, 1\\}$ と対応します。そのような関数は何個ありますか。`],
        a: { type: 'int', v },
        hint: ['Each input independently chooses an output.', '各入力が独立に出力を1つ選びます。'],
        sol: [[t === 0 ? `Each of the ${m} inputs has ${n} possible outputs: $${n}^{${m}}$.` : `Each of the ${m} elements is sent to 0 or 1: $2^{${m}}$.`, t === 0 ? `${m} 個の入力それぞれに出力が ${n} 通りあり、$${n}^{${m}}$ です。` : `${m} 個の要素それぞれが 0 か 1 に移るので $2^{${m}}$ です。`], [`That is ${v}. Writing $B^A$ for the set of functions $A \\to B$ gives $|\\mathcal P(S)| = |\\{0,1\\}^S| = 2^{|S|}$, the identity behind Cantor's theorem.`, `答えは ${v} です。関数 $A \\to B$ の集合を $B^A$ と書くと $|\\mathcal P(S)| = |\\{0,1\\}^S| = 2^{|S|}$ で、これがカントールの定理の背景にある等式です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const n = 4;
        const A = [1, 2, 3, 4];
        const f = A.map(() => A.filter(() => r.chance(0.5)));
        const D = A.filter((a) => !f[a - 1].includes(a));
        const fl = f.map((s, i) => `f(${i + 1}) = ${setTeX(s)}`).join(',\\ ');
        const fja = fl;
        return {
          q: [`Let $A = \\{1, 2, 3, 4\\}$ and $f : A \\to \\mathcal P(A)$ with $${fl}$. The diagonal set is $D = \\{a \\in A \\mid a \\notin f(a)\\}$. How many elements does $D$ have?`, `$A = \\{1, 2, 3, 4\\}$ と $f : A \\to \\mathcal P(A)$ を $${fja}$ で定めます。対角線集合 $D = \\{a \\in A \\mid a \\notin f(a)\\}$ の要素は何個ですか。`],
          a: { type: 'int', v: D.length },
          hint: ['For each $a$, check whether $a$ belongs to its own image set $f(a)$.', '各 $a$ について、$a$ が自分の像の集合 $f(a)$ に入っているかを調べます。'],
          sol: [[`$a$ is in $D$ exactly when $a \\notin f(a)$, which holds for $${setTeX(D)}$.`, `$a \\notin f(a)$ となる $a$ が $D$ の要素で、それは $${setTeX(D)}$ です。`], [`So $|D| = ${D.length}$. And $D$ differs from every $f(a)$ at the element $a$, so $D$ is not in the image of $f$: no $f$ can map onto $\\mathcal P(A)$.`, `よって $|D| = ${D.length}$ です。$D$ はどの $f(a)$ とも要素 $a$ で異なるので $D$ は $f$ の像に入らず、$\\mathcal P(A)$ の上への $f$ は存在しません。`]],
        };
      }
      if (form === 1) {
        const n = r.int(2, 5);
        const pick = r.int(0, 1);
        const expr = pick === 0 ? `${n} + \\omega` : `\\omega + ${n}`;
        return {
          q: [`As ordinals, is $${expr}$ equal to $\\omega$?`, `順序数として、$${expr}$ は $\\omega$ に等しいですか。`],
          a: { type: 'choice', fixed: true, v: pick === 0 ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
          hint: ['Ordinal addition is not commutative. Ask whether the sum has a last element.', '順序数の加法は可換ではありません。和に最後の要素があるかを考えます。'],
          sol: [[pick === 0 ? `Put ${n} new elements in front of $\\omega$ and relabel: the first ${n} become $0, \\dots, ${n - 1}$ and each old $k$ becomes $k + ${n}$. This is an order isomorphism, so $${n} + \\omega = \\omega$.` : `$\\omega + ${n}$ is $\\omega$ followed by ${n} more points. It has a greatest element, while $\\omega$ has none, so the two are not order isomorphic.`, pick === 0 ? `$\\omega$ の前に ${n} 個の新しい要素を置き、番号を付け直します。最初の ${n} 個が $0, \\dots, ${n - 1}$ になり、古い $k$ は $k + ${n}$ になります。これは順序同型なので $${n} + \\omega = \\omega$ です。` : `$\\omega + ${n}$ は $\\omega$ のあとに ${n} 点が続いたものです。最大元をもちますが $\\omega$ にはないので、順序同型ではありません。`], ['The cardinalities agree ($\\aleph_0$ both times), but the order types differ. That is exactly the difference between cardinals and ordinals.', '濃度はどちらも $\\aleph_0$ で等しいのに、順序型は異なります。これが基数と順序数の違いです。']],
        };
      }
      const k = r.int(2, 5);
      return {
        q: [`A hotel has rooms $1, 2, 3, \\dots$ all occupied. ${k} new guests arrive. The manager moves the guest in room $n$ to room $n + ${k}$. What is the largest-numbered room that becomes free for the new guests?`, `ホテルには部屋 $1, 2, 3, \\dots$ があり、すべて埋まっています。新しい客が ${k} 人来ました。支配人は部屋 $n$ の客を部屋 $n + ${k}$ に移します。新しい客のために空く部屋のうち、番号が最大のものはどれですか。`],
        a: { type: 'int', v: k },
        hint: ['Which room numbers are not of the form $n + k$ for any $n \\ge 1$?', '$n \\ge 1$ のどれについても $n + k$ の形にならない部屋番号はどれですか。'],
        sol: [[`Room $m$ is reached from room $m - ${k}$ only if $m - ${k} \\ge 1$, so rooms $1, \\dots, ${k}$ are not occupied.`, `部屋 $m$ に移ってくるのは部屋 $m - ${k}$ の客で、それは $m - ${k} \\ge 1$ のときだけです。したがって部屋 $1, \\dots, ${k}$ が空きます。`], [`The largest freed room is ${k}. The shift $n \\mapsto n + ${k}$ is a one-to-one map of $\\mathbb N$ onto a proper part of itself: that is what an infinite set is allowed to do and a finite set is not.`, `空く部屋の最大は ${k} です。移動 $n \\mapsto n + ${k}$ は $\\mathbb N$ を自分自身の真の一部の上へ1対1に写します。有限集合にはできず、無限集合だけにできることです。`]],
      };
    },
  ];

  if (typeof window !== 'undefined') {
    const host = (window.PracticeHosts ||= {});
    host['set-theory-relations'] = {
      set(v) {
        if (v.m === undefined) return;
        const sel = document.getElementById('modulus'); if (!sel) return;
        sel.value = String(v.m); sel.dispatchEvent(new Event('change', { bubbles: true }));
        sel.scrollIntoView({ block: 'center', behavior: 'smooth' });
      },
    };
  }
})();
