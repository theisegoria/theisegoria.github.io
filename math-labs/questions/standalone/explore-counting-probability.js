'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, gcd } = P.util;
  const K = 'explore-counting-probability-';
  const C = (a, b) => { if (b < 0 || b > a) return 0; b = Math.min(b, a - b); let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); };
  const Pm = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r *= a - i; return r; };
  const fact = (m) => Pm(m, m);
  const NAMES = [['Alice', 'アリス'], ['Bob', 'ボブ']];

  /* ---------- counting ---------- */
  Q[K + 'choose'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(6, 12), k = r.int(2, 4), v = Pm(nn, k);
        return {
          q: [`In how many ways can ${k} officers with ${k} distinct roles be chosen from ${nn} people, no one holding two roles? Count $P(${nn}, ${k})$.`, `${nn} 人から、役割の異なる ${k} 人の役員を選ぶ方法は何通りですか（兼任なし）。$P(${nn}, ${k})$ を数えてください。`],
          a: { type: 'int', v },
          hint: ['The pool shrinks by one after each choice.', '一人選ぶたびに候補が一人ずつ減ります。'],
          sol: [[`$P(${nn}, ${k}) = ${Array.from({ length: k }, (_, i) => nn - i).join(' \\cdot ')}$.`, `$P(${nn}, ${k}) = ${Array.from({ length: k }, (_, i) => nn - i).join(' \\cdot ')}$ です。`], [`$= ${v}$.`, `$= ${v}$ です。`], ['Order matters because the roles differ, so there is nothing to divide out.', '役割が違うので順序が区別され、割る必要はありません。']],
        };
      }
      if (form === 1) {
        const nn = r.int(6, 14), k = r.int(2, 5), v = C(nn, k);
        return {
          q: [`How many ways are there to choose a committee of ${k} from ${nn} people?`, `${nn} 人から ${k} 人の委員会を選ぶ方法は何通りですか。`],
          a: { type: 'int', v },
          hint: ['Each committee is counted $k!$ times when you count ordered choices.', '順序つきで数えると、各委員会は $k!$ 回数えられます。'],
          sol: [[`Ordered choices: $${Pm(nn, k)}$. Each committee appears $${k}! = ${fact(k)}$ times.`, `順序つきの選び方は $${Pm(nn, k)}$ 通りで、各委員会は $${k}! = ${fact(k)}$ 回ずつ数えられます。`], [`$\\dbinom{${nn}}{${k}} = ${Pm(nn, k)}/${fact(k)} = ${v}$.`, `$\\dbinom{${nn}}{${k}} = ${Pm(nn, k)}/${fact(k)} = ${v}$ です。`]],
        };
      }
      const a = r.int(2, 5), b = r.int(2, 5), c = r.int(2, 4);
      return {
        q: [`A meal is one of ${a} starters, then one of ${b} mains, then one of ${c} desserts. How many different meals are there?`, `前菜 ${a} 種、主菜 ${b} 種、デザート ${c} 種から一つずつ選ぶ食事は何通りありますか。`],
        a: { type: 'int', v: a * b * c },
        sol: [[`Independent stages multiply: $${a}\\cdot ${b}\\cdot ${c} = ${a * b * c}$.`, `独立した段階は掛け算で、$${a}\\cdot ${b}\\cdot ${c} = ${a * b * c}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const nn = r.int(5, 12), rr = r.int(3, 5), v = C(nn + rr - 1, rr - 1);
        return {
          q: [`How many non-negative integer solutions does $x_1 + x_2 + \\cdots + x_{${rr}} = ${nn}$ have?`, `$x_1 + x_2 + \\cdots + x_{${rr}} = ${nn}$ の非負整数解は何個ありますか。`],
          a: { type: 'int', v },
          hint: ['Draw ${nn} stars and ${rr - 1} bars.'.replace('${nn}', nn).replace('${rr - 1}', rr - 1), `${nn} 個の星と ${rr - 1} 本の仕切りを並べます。`],
          sol: [[`Each solution is a row of ${nn} stars and ${rr - 1} bars: $${nn + rr - 1}$ slots, choose where the bars go.`, `解は ${nn} 個の星と ${rr - 1} 本の仕切りの並びに対応し、$${nn + rr - 1}$ 個の場所から仕切りの位置を選びます。`], [`$\\dbinom{${nn + rr - 1}}{${rr - 1}} = ${v}$.`, `$\\dbinom{${nn + rr - 1}}{${rr - 1}} = ${v}$ です。`]],
        };
      }
      if (form === 1) {
        const total = r.int(8, 14), k = r.int(3, 5), m = r.int(1, 2);
        const v = C(total - m, k - m);
        return {
          q: [`A committee of ${k} is chosen from ${total} people. How many committees include ${m === 1 ? 'a particular person' : 'two particular people'}?`, `${total} 人から ${k} 人の委員会を選びます。特定の${m === 1 ? '一人' : '二人'}を含む委員会は何通りですか。`],
          a: { type: 'int', v },
          sol: [[`Put ${m === 1 ? 'that person' : 'both of them'} in; choose the remaining ${k - m} from the other ${total - m}.`, `${m === 1 ? 'その人' : '二人'}を入れ、残りの ${k - m} 人を他の ${total - m} 人から選びます。`], [`$\\dbinom{${total - m}}{${k - m}} = ${v}$.`, `$\\dbinom{${total - m}}{${k - m}} = ${v}$ です。`]],
        };
      }
      if (form === 2) {
        const counts = r.pick([[3, 2, 1], [2, 2, 2], [4, 2, 1], [3, 3, 1], [2, 2, 1, 1], [3, 2, 2]]);
        const letters = 'ABCD'.slice(0, counts.length), tot = counts.reduce((x, y) => x + y, 0);
        const v = fact(tot) / counts.reduce((x, c) => x * fact(c), 1);
        return {
          q: [`How many distinct arrangements are there of the letters ${counts.map((c, i) => `${letters[i]} (${c}x)`).join(', ')}, ${tot} letters in all?`, `文字 ${counts.map((c, i) => `${letters[i]} が ${c} 個`).join('、')}、合計 ${tot} 文字を並べると、異なる並び方は何通りですか。`],
          a: { type: 'int', v },
          hint: ['Count as if all letters were different, then divide by the repeats.', 'すべて区別して数えてから、重複の分を割ります。'],
          sol: [[`$${tot}! = ${fact(tot)}$ if all were different.`, `すべて区別すると $${tot}! = ${fact(tot)}$ 通りです。`], [`Each pattern is counted $${counts.map((c) => c + '!').join(' \\cdot ')} = ${counts.reduce((x, c) => x * fact(c), 1)}$ times, so the answer is $${v}$.`, `各並びは $${counts.map((c) => c + '!').join(' \\cdot ')} = ${counts.reduce((x, c) => x * fact(c), 1)}$ 回ずつ数えられるので、答えは $${v}$ です。`]],
        };
      }
      const h = r.int(2, 4), v = C(2 * h, h) / 2;
      return {
        q: [`${2 * h} people are split into two unnamed teams of ${h}. How many splits are there?`, `${2 * h} 人を、名前のない ${h} 人ずつの二チームに分ける方法は何通りですか。`],
        a: { type: 'int', v },
        hint: ['First count the splits into a "red" and a "blue" team.', 'まず「赤チーム」と「青チーム」に分ける場合を数えます。'],
        sol: [[`With named teams: $\\dbinom{${2 * h}}{${h}} = ${C(2 * h, h)}$.`, `チームに名前があれば $\\dbinom{${2 * h}}{${h}} = ${C(2 * h, h)}$ 通りです。`], [`Without names, swapping the two teams gives the same split, so divide by $2$: $${v}$.`, `名前がなければ二チームの入れ替えは同じ分け方なので $2$ で割り、$${v}$ 通りです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const N = r.int(30, 100), a = r.pick([2, 3, 4, 5]), b = r.pick([6, 7, 9, 10].filter((x) => x !== a));
        const l = a * b / gcd(a, b), v = Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / l);
        return {
          q: [`How many integers from $1$ to $${N}$ are divisible by $${a}$ or by $${b}$ (or both)?`, `$1$ から $${N}$ までの整数のうち、$${a}$ または $${b}$（または両方）で割り切れるものは何個ですか。`],
          a: { type: 'int', v },
          hint: ['The two sets overlap: subtract the multiples of the lcm once.', '二つの集合は重なっています。最小公倍数の倍数を一度引きます。'],
          sol: [[`$\\lfloor ${N}/${a}\\rfloor = ${Math.floor(N / a)}$ and $\\lfloor ${N}/${b}\\rfloor = ${Math.floor(N / b)}$.`, `$\\lfloor ${N}/${a}\\rfloor = ${Math.floor(N / a)}$、$\\lfloor ${N}/${b}\\rfloor = ${Math.floor(N / b)}$ です。`], [`Both: multiples of $\\mathrm{lcm} = ${l}$, which is $${Math.floor(N / l)}$.`, `両方は最小公倍数 $${l}$ の倍数で、$${Math.floor(N / l)}$ 個です。`], [`Inclusion-exclusion: $${Math.floor(N / a)} + ${Math.floor(N / b)} - ${Math.floor(N / l)} = ${v}$. Adding without the correction would count the overlap twice.`, `包除原理により $${Math.floor(N / a)} + ${Math.floor(N / b)} - ${Math.floor(N / l)} = ${v}$ です。補正なしに足すと重なりを二重に数えます。`]],
        };
      }
      if (form === 1) {
        const m = r.int(4, 6), D = [1, 0, 1, 2, 9, 44, 265][m];
        return {
          q: [`${m} guests leave their hats and each takes one hat at random. In how many of the $${m}!$ outcomes does nobody get their own hat?`, `${m} 人の客が帽子を預け、でたらめに一つずつ持ち帰ります。$${m}!$ 通りの結果のうち、誰も自分の帽子を取らないものは何通りですか。`],
          a: { type: 'int', v: D },
          hint: ['Inclusion-exclusion: $D_n = n!\\sum_{k=0}^n (-1)^k/k!$.', '包除原理で $D_n = n!\\sum_{k=0}^n (-1)^k/k!$ です。'],
          sol: [[`$D_${m} = ${m}!\\left(1 - 1 + \\tfrac{1}{2!} - \\tfrac{1}{3!} + \\cdots\\right)$.`, `$D_${m} = ${m}!\\left(1 - 1 + \\tfrac{1}{2!} - \\tfrac{1}{3!} + \\cdots\\right)$ です。`], [`Evaluating gives $D_${m} = ${D}$.`, `計算すると $D_${m} = ${D}$ です。`], [`That is a fraction $${n(D / fact(m), 4)}$ of all outcomes, already close to $1/e \\approx 0.3679$.`, `全体の $${n(D / fact(m), 4)}$ にあたり、すでに $1/e \\approx 0.3679$ に近い値です。`]],
        };
      }
      if (form === 2) {
        const w = r.int(3, 6), h = r.int(3, 5), x = r.int(1, w - 1), y = r.int(1, h - 1);
        const v = C(w + h, w) - C(x + y, x) * C(w - x + h - y, w - x);
        return {
          q: [`Paths go from $(0,0)$ to $(${w}, ${h})$ using unit steps right or up. How many avoid the point $(${x}, ${y})$?`, `$(0,0)$ から $(${w}, ${h})$ まで、右か上への単位歩進だけで進む経路のうち、点 $(${x}, ${y})$ を通らないものは何通りですか。`],
          a: { type: 'int', v },
          hint: ['Count all paths, then subtract those that go through the point.', 'すべての経路から、その点を通る経路を引きます。'],
          sol: [[`All paths: $\\dbinom{${w + h}}{${w}} = ${C(w + h, w)}$.`, `全経路は $\\dbinom{${w + h}}{${w}} = ${C(w + h, w)}$ です。`], [`Through $(${x}, ${y})$: $\\dbinom{${x + y}}{${x}}\\dbinom{${w - x + h - y}}{${w - x}} = ${C(x + y, x)}\\cdot ${C(w - x + h - y, w - x)}$.`, `$(${x}, ${y})$ を通る経路は $\\dbinom{${x + y}}{${x}}\\dbinom{${w - x + h - y}}{${w - x}} = ${C(x + y, x)}\\cdot ${C(w - x + h - y, w - x)}$ です。`], [`Difference: $${v}$. Each count is a product of independent stages, then a subtraction of the bad set.`, `差は $${v}$ です。独立な段階の積で数え、悪い集合を引いています。`]],
        };
      }
      const total = r.int(8, 14), k = r.int(3, 5), v = C(total, k) - C(total - 2, k);
      return {
        q: [`A committee of ${k} is chosen from ${total} people. How many committees contain ${NAMES[0][0]} or ${NAMES[1][0]} (or both)?`, `${total} 人から ${k} 人の委員会を選びます。${NAMES[0][1]} または ${NAMES[1][1]}（または両方）を含む委員会は何通りですか。`],
        a: { type: 'int', v },
        hint: ['Easier to count the complement: committees containing neither.', '余事象、つまりどちらも含まない委員会を数えるほうが簡単です。'],
        sol: [[`All committees: $\\dbinom{${total}}{${k}} = ${C(total, k)}$.`, `全委員会は $\\dbinom{${total}}{${k}} = ${C(total, k)}$ です。`], [`Neither: $\\dbinom{${total - 2}}{${k}} = ${C(total - 2, k)}$.`, `どちらも含まないのは $\\dbinom{${total - 2}}{${k}} = ${C(total - 2, k)}$ です。`], [`So $${v}$. Adding "contains ${NAMES[0][0]}" and "contains ${NAMES[1][0]}" directly would double-count committees with both.`, `したがって $${v}$ 通りです。「${NAMES[0][1]} を含む」と「${NAMES[1][1]} を含む」を単純に足すと、両方を含む委員会が二重に数えられます。`]],
      };
    },
  ];

  /* ---------- binomial theorem and identities ---------- */
  Q[K + 'binomial'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(4, 12), k = r.int(1, nn - 2);
        return {
          q: [`Using Pascal's rule, $\\dbinom{${nn}}{${k}} + \\dbinom{${nn}}{${k + 1}}$ equals which binomial coefficient? Give its value.`, `パスカルの規則により $\\dbinom{${nn}}{${k}} + \\dbinom{${nn}}{${k + 1}}$ は二項係数のひとつに等しくなります。その値を求めてください。`],
          a: { type: 'int', v: C(nn + 1, k + 1) },
          sol: [[`Pascal's rule: $\\dbinom{n}{k} + \\dbinom{n}{k+1} = \\dbinom{n+1}{k+1}$.`, `パスカルの規則：$\\dbinom{n}{k} + \\dbinom{n}{k+1} = \\dbinom{n+1}{k+1}$ です。`], [`So the sum is $\\dbinom{${nn + 1}}{${k + 1}} = ${C(nn + 1, k + 1)}$.`, `したがって和は $\\dbinom{${nn + 1}}{${k + 1}} = ${C(nn + 1, k + 1)}$ です。`], ['Combinatorially: a ($k+1$)-subset of $n+1$ items either leaves out the last item or contains it.', '組合せ的には、$n+1$ 個から選ぶ $(k+1)$ 個の部分集合は、最後の要素を含むか含まないかのどちらかです。']],
        };
      }
      if (form === 1) {
        const nn = r.int(3, 10);
        return {
          q: [`What is $\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}$, the sum of row ${nn} of Pascal's triangle?`, `パスカルの三角形の第 ${nn} 行の和 $\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}$ を求めてください。`],
          a: { type: 'int', v: 2 ** nn },
          hint: ['Set $x = y = 1$ in $(x + y)^n$.', '$(x + y)^n$ に $x = y = 1$ を代入します。'],
          sol: [[`$(1 + 1)^{${nn}} = \\sum_k \\binom{${nn}}{k}$.`, `$(1 + 1)^{${nn}} = \\sum_k \\binom{${nn}}{k}$ です。`], [`So the sum is $2^{${nn}} = ${2 ** nn}$: the number of subsets of a ${nn}-element set, sorted by size.`, `和は $2^{${nn}} = ${2 ** nn}$ で、${nn} 個の集合の部分集合の総数を大きさ別に分けたものです。`]],
        };
      }
      const nn = r.int(4, 9), k = r.int(1, nn - 1);
      return {
        q: [`What is the coefficient of $x^{${k}}$ in $(1 + x)^{${nn}}$?`, `$(1 + x)^{${nn}}$ における $x^{${k}}$ の係数を求めてください。`],
        a: { type: 'int', v: C(nn, k) },
        sol: [[`Choose $x$ from ${k} of the ${nn} brackets: $\\dbinom{${nn}}{${k}} = ${C(nn, k)}$ ways.`, `${nn} 個の括弧のうち ${k} 個から $x$ を選ぶ方法は $\\dbinom{${nn}}{${k}} = ${C(nn, k)}$ 通りです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(4, 7), k = r.int(1, nn - 1), a = r.nz(-3, 3), b = r.nz(-3, 3);
        const v = C(nn, k) * a ** k * b ** (nn - k);
        return {
          q: [`Find the coefficient of $x^{${k}}y^{${nn - k}}$ in $(${a === 1 ? '' : a === -1 ? '-' : a}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y)^{${nn}}$.`, `$(${a === 1 ? '' : a === -1 ? '-' : a}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y)^{${nn}}$ における $x^{${k}}y^{${nn - k}}$ の係数を求めてください。`],
          a: { type: 'int', v },
          hint: ['The term comes from choosing $ax$ in $k$ brackets and $by$ in the rest.', '$k$ 個の括弧から $ax$ を、残りから $by$ を選んだ項です。'],
          sol: [[`Coefficient $= \\dbinom{${nn}}{${k}}\\,(${a})^{${k}}(${b})^{${nn - k}}$.`, `係数は $\\dbinom{${nn}}{${k}}\\,(${a})^{${k}}(${b})^{${nn - k}}$ です。`], [`$= ${C(nn, k)}\\cdot ${a ** k}\\cdot ${b ** (nn - k)} = ${v}$.`, `$= ${C(nn, k)}\\cdot ${a ** k}\\cdot ${b ** (nn - k)} = ${v}$ です。`]],
        };
      }
      if (form === 1) {
        const m = r.int(3, 7), nn = r.int(3, 7), k = r.int(2, Math.min(m + nn - 1, 6));
        let s = 0; for (let i = 0; i <= k; i++) s += C(m, i) * C(nn, k - i);
        return {
          q: [`Evaluate $\\displaystyle\\sum_{i=0}^{${k}} \\binom{${m}}{i}\\binom{${nn}}{${k} - i}$.`, `$\\displaystyle\\sum_{i=0}^{${k}} \\binom{${m}}{i}\\binom{${nn}}{${k} - i}$ を求めてください。`],
          a: { type: 'int', v: s },
          hint: ['Vandermonde: count $k$-subsets of two groups, split by how many come from the first.', 'ヴァンデルモンド：二つの群からの $k$ 個の選び方を、第一群から何個取るかで分けます。'],
          sol: [[`Vandermonde's identity: $\\sum_i \\binom{m}{i}\\binom{n}{k-i} = \\binom{m+n}{k}$.`, `ヴァンデルモンドの恒等式：$\\sum_i \\binom{m}{i}\\binom{n}{k-i} = \\binom{m+n}{k}$ です。`], [`$= \\dbinom{${m + nn}}{${k}} = ${s}$.`, `$= \\dbinom{${m + nn}}{${k}} = ${s}$ です。`], [`Both sides count the ways to choose ${k} people from ${m} + ${nn}; the sum just sorts them by group.`, `どちらの辺も ${m} 人と ${nn} 人の合計から ${k} 人を選ぶ方法を数えていて、和は群ごとに分けているだけです。`]],
        };
      }
      const rr = r.int(2, 4), nn = r.int(rr + 2, 10);
      let s = 0; for (let i = rr; i <= nn; i++) s += C(i, rr);
      return {
        q: [`Evaluate the hockey-stick sum $\\displaystyle\\sum_{i=${rr}}^{${nn}} \\binom{i}{${rr}}$.`, `ホッケースティック和 $\\displaystyle\\sum_{i=${rr}}^{${nn}} \\binom{i}{${rr}}$ を求めてください。`],
        a: { type: 'int', v: s },
        sol: [[`Hockey stick: $\\sum_{i=r}^{n}\\binom{i}{r} = \\binom{n+1}{r+1}$.`, `ホッケースティック恒等式：$\\sum_{i=r}^{n}\\binom{i}{r} = \\binom{n+1}{r+1}$ です。`], [`$= \\dbinom{${nn + 1}}{${rr + 1}} = ${s}$.`, `$= \\dbinom{${nn + 1}}{${rr + 1}} = ${s}$ です。`], ['Count $(r+1)$-subsets of $\\{1, \\dots, n+1\\}$ by their largest element.', '$\\{1, \\dots, n+1\\}$ の $(r+1)$ 個の部分集合を、最大の要素で分けて数えます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(3, 6), c = r.int(1, 4);
        return {
          q: [`Find a closed form for $\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}\\,${c}^{${nn} - k}x^k$.`, `$\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}\\,${c}^{${nn} - k}x^k$ の閉じた形を求めてください。`],
          a: { type: 'expr', v: `(x+${c})^${nn}`, vars: ['x'], lhs: ['$\\text{sum} =$', '和 $=$'] },
          sol: [[`This is the binomial expansion of $(x + ${c})^{${nn}}$ with $y = ${c}$.`, `$y = ${c}$ とした $(x + ${c})^{${nn}}$ の二項展開です。`], [`So the sum equals $(x + ${c})^{${nn}}$.`, `したがって和は $(x + ${c})^{${nn}}$ です。`]],
        };
      }
      if (form === 1) {
        const nn = r.int(3, 7), p = r.int(2, 4);
        return {
          q: [`Simplify $\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}\\,${p}^k\\,x^k$ as a function of $x$.`, `$\\displaystyle\\sum_{k=0}^{${nn}} \\binom{${nn}}{k}\\,${p}^k\\,x^k$ を $x$ の式として簡単にしてください。`],
          a: { type: 'expr', v: `(1+${p}*x)^${nn}`, vars: ['x'], lhs: ['$\\text{sum} =$', '和 $=$'] },
          hint: ['Write $${p}^k x^k = (${p}x)^k$.'.replace(/\$\{p\}/g, p), `$${p}^k x^k = (${p}x)^k$ と書きます。`],
          sol: [[`With $t = ${p}x$ the sum is $\\sum_k \\binom{${nn}}{k}t^k = (1 + t)^{${nn}}$.`, `$t = ${p}x$ とおくと、和は $\\sum_k \\binom{${nn}}{k}t^k = (1 + t)^{${nn}}$ です。`], [`So it equals $(1 + ${p}x)^{${nn}}$; at $x = 1$ it is $${(1 + p) ** nn}$, the total weight of all subsets.`, `したがって $(1 + ${p}x)^{${nn}}$ で、$x = 1$ では $${(1 + p) ** nn}$、つまり全部分集合の重みの合計です。`]],
        };
      }
      const nn = r.int(4, 10);
      return {
        q: [`What is the alternating sum $\\displaystyle\\sum_{k=0}^{${nn}} (-1)^k\\binom{${nn}}{k}$?`, `交代和 $\\displaystyle\\sum_{k=0}^{${nn}} (-1)^k\\binom{${nn}}{k}$ はいくつですか。`],
        a: { type: 'int', v: 0 },
        hint: ['Put $x = 1$, $y = -1$ in $(x + y)^n$.', '$(x + y)^n$ に $x = 1$、$y = -1$ を代入します。'],
        sol: [[`$(1 + (-1))^{${nn}} = 0^{${nn}} = 0$.`, `$(1 + (-1))^{${nn}} = 0^{${nn}} = 0$ です。`], ['So even-sized and odd-sized subsets are equally many: a set with $n \\ge 1$ elements has $2^{n-1}$ of each.', 'したがって偶数個の部分集合と奇数個の部分集合は同数で、$n \\ge 1$ の集合ではそれぞれ $2^{n-1}$ 個です。']],
      };
    },
  ];

  /* ---------- probability ---------- */
  Q[K + 'probability'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.int(3, 11), cnt = 6 - Math.abs(s - 7);
        return {
          q: [`Two fair dice are rolled. What is the probability that the sum is $${s}$?`, `公平なサイコロを二つ振ります。目の和が $${s}$ になる確率はいくつですか。`],
          a: { type: 'num', v: cnt / 36, show: frac(cnt, 36) },
          sol: [[`$${cnt}$ of the $36$ equally likely outcomes give sum $${s}$.`, `等確率な $36$ 通りのうち、和が $${s}$ になるのは $${cnt}$ 通りです。`], [`$P = ${frac(cnt, 36)} \\approx ${n(cnt / 36, 4)}$.`, `$P = ${frac(cnt, 36)} \\approx ${n(cnt / 36, 4)}$ です。`]],
        };
      }
      if (form === 1) {
        const suit = r.pick([[13, 'a heart', 'ハート'], [4, 'an ace', 'エース'], [12, 'a face card', '絵札'], [26, 'a red card', '赤いカード']]);
        return {
          q: [`One card is drawn from a standard 52-card deck. What is the probability that it is ${suit[1]}?`, `52 枚の標準的なトランプから 1 枚引きます。それが${suit[2]}である確率はいくつですか。`],
          a: { type: 'num', v: suit[0] / 52, show: frac(suit[0], 52) },
          sol: [[`${suit[0]} of the 52 cards qualify.`, `52 枚のうち ${suit[0]} 枚が当てはまります。`], [`$P = ${frac(suit[0], 52)}$.`, `$P = ${frac(suit[0], 52)}$ です。`]],
        };
      }
      const R = r.int(3, 6), B = r.int(3, 6), v = (R / (R + B)) * ((R - 1) / (R + B - 1));
      return {
        q: [`A bag has ${R} red and ${B} blue balls. Two are drawn without replacement. What is the probability that both are red?`, `袋に赤玉 ${R} 個と青玉 ${B} 個が入っています。戻さずに 2 個引くとき、両方とも赤である確率はいくつですか。`],
        a: { type: 'num', v, show: frac(R * (R - 1), (R + B) * (R + B - 1)) },
        sol: [[`First red: $${R}/${R + B}$. Then red again: $${R - 1}/${R + B - 1}$.`, `1 個目が赤: $${R}/${R + B}$。次も赤: $${R - 1}/${R + B - 1}$ です。`], [`$P = ${frac(R * (R - 1), (R + B) * (R + B - 1))} \\approx ${n(v, 4)}$.`, `$P = ${frac(R * (R - 1), (R + B) * (R + B - 1))} \\approx ${n(v, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const R = r.int(4, 8), B = r.int(4, 8), m = r.int(3, 5), k = r.int(1, Math.min(m, R)), v = C(R, k) * C(B, m - k) / C(R + B, m);
        return {
          q: [`${m} balls are drawn without replacement from ${R} red and ${B} blue. What is the probability of exactly ${k} red? Give three decimals.`, `赤玉 ${R} 個と青玉 ${B} 個から、戻さずに ${m} 個引きます。赤がちょうど ${k} 個である確率を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['Count favorable hands over all hands, using combinations.', '組合せで、好ましい引き方を全体の引き方で割ります。'],
          sol: [[`Favorable: $\\dbinom{${R}}{${k}}\\dbinom{${B}}{${m - k}} = ${C(R, k) * C(B, m - k)}$. All: $\\dbinom{${R + B}}{${m}} = ${C(R + B, m)}$.`, `好ましい引き方は $\\dbinom{${R}}{${k}}\\dbinom{${B}}{${m - k}} = ${C(R, k) * C(B, m - k)}$、全体は $\\dbinom{${R + B}}{${m}} = ${C(R + B, m)}$ です。`], [`$P = ${n(v, 4)}$.`, `$P = ${n(v, 4)}$ です。`], ['This is the hypergeometric distribution: the binomial formula would be wrong because the draws are not independent.', 'これは超幾何分布です。引くたびに状況が変わり独立でないため、二項分布の式は使えません。']],
        };
      }
      if (form === 1) {
        const nn = r.int(4, 10), k = r.int(1, nn - 1), p = r.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6]), v = C(nn, k) * p ** k * (1 - p) ** (nn - k);
        return {
          q: [`A coin lands heads with probability $${n(p)}$. In ${nn} independent flips, what is the probability of exactly ${k} heads? Give three decimals.`, `表が出る確率 $${n(p)}$ のコインを独立に ${nn} 回投げます。ちょうど ${k} 回表が出る確率を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          sol: [[`$P = \\dbinom{${nn}}{${k}}(${n(p)})^{${k}}(${n(1 - p)})^{${nn - k}}$.`, `$P = \\dbinom{${nn}}{${k}}(${n(p)})^{${k}}(${n(1 - p)})^{${nn - k}}$ です。`], [`$= ${C(nn, k)}\\cdot ${n(p ** k, 6)}\\cdot ${n((1 - p) ** (nn - k), 6)} = ${n(v, 4)}$.`, `$= ${C(nn, k)}\\cdot ${n(p ** k, 6)}\\cdot ${n((1 - p) ** (nn - k), 6)} = ${n(v, 4)}$ です。`]],
        };
      }
      if (form === 2) {
        const D = r.int(10, 30), m = r.int(3, 5), v = Pm(D, m) / D ** m;
        return {
          q: [`${m} people each have a birthday uniformly in a ${D}-day year. What is the probability that all ${m} birthdays differ? Give three decimals.`, `${m} 人がそれぞれ、${D} 日の一年のうち一様に誕生日をもちます。${m} 人の誕生日がすべて異なる確率を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['Multiply the chance that each new person avoids all earlier birthdays.', '新しい人が、それまでの誕生日をすべて避ける確率を掛けていきます。'],
          sol: [[`$P = \\dfrac{${Array.from({ length: m }, (_, i) => D - i).join(' \\cdot ')}}{${D}^{${m}}}$.`, `$P = \\dfrac{${Array.from({ length: m }, (_, i) => D - i).join(' \\cdot ')}}{${D}^{${m}}}$ です。`], [`$= ${n(v, 4)}$, so a shared birthday has probability $${n(1 - v, 4)}$.`, `$= ${n(v, 4)}$ なので、誕生日が重なる確率は $${n(1 - v, 4)}$ です。`]],
        };
      }
      const faces = r.pick([4, 6, 8, 10, 12]), cnt = r.int(2, 3);
      const ev = cnt * (faces + 1) / 2;
      return {
        q: [`What is the expected total when ${cnt} fair ${faces}-sided dice are rolled?`, `公平な ${faces} 面サイコロ ${cnt} 個を振ったときの目の合計の期待値を求めてください。`],
        a: { type: 'num', v: ev },
        sol: [[`One die has mean $(1 + ${faces})/2 = ${n((faces + 1) / 2)}$.`, `サイコロ 1 個の平均は $(1 + ${faces})/2 = ${n((faces + 1) / 2)}$ です。`], [`By linearity the total has mean $${cnt}\\cdot ${n((faces + 1) / 2)} = ${n(ev)}$.`, `期待値の線形性により、合計の平均は $${cnt}\\cdot ${n((faces + 1) / 2)} = ${n(ev)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const prev = r.pick([0.001, 0.005, 0.01, 0.02, 0.05]), sens = r.pick([0.9, 0.95, 0.99]), spec = r.pick([0.9, 0.95, 0.98]);
        const tp = prev * sens, fp = (1 - prev) * (1 - spec), v = tp / (tp + fp);
        return {
          q: [`A condition has prevalence $${n(prev * 100)}\\%$. A test has sensitivity $${n(sens * 100)}\\%$ and specificity $${n(spec * 100)}\\%$. Given a positive result, what is the probability that the person has the condition? Give three decimals.`, `ある状態の有病率は $${n(prev * 100)}\\%$ です。検査の感度は $${n(sens * 100)}\\%$、特異度は $${n(spec * 100)}\\%$ です。陽性だったとき、本当にその状態である確率を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['Count true positives and false positives per person tested.', '検査した一人あたりの真陽性と偽陽性の確率を比べます。'],
          sol: [[`True positives: $${n(prev)}\\times ${n(sens)} = ${n(tp, 6)}$. False positives: $${n(1 - prev)}\\times ${n(1 - spec)} = ${n(fp, 6)}$.`, `真陽性は $${n(prev)}\\times ${n(sens)} = ${n(tp, 6)}$、偽陽性は $${n(1 - prev)}\\times ${n(1 - spec)} = ${n(fp, 6)}$ です。`], [`$P(\\text{condition}\\mid +) = ${n(tp, 6)}/(${n(tp, 6)} + ${n(fp, 6)}) = ${n(v, 4)}$.`, `$P(\\text{状態}\\mid +) = ${n(tp, 6)}/(${n(tp, 6)} + ${n(fp, 6)}) = ${n(v, 4)}$ です。`], [`${v < 0.5 ? 'Most positives are false: when the condition is rare, even a good test gives a misleadingly low posterior. P(A | B) is not P(B | A).' : 'Here the prior is large enough that a positive result is more likely true than false, but still far from certain.'}`, `${v < 0.5 ? '陽性の多くは偽陽性です。まれな状態では、良い検査でも事後確率は低くなります。P(A | B) と P(B | A) は別物です。' : 'ここでは事前確率が十分大きく、陽性は偽陽性より真陽性の可能性が高いのですが、確実とはほど遠い値です。'}`]],
        };
      }
      if (form === 1) {
        const nn = r.int(5, 40), v = (nn - 1) / 4;
        return {
          q: [`A fair coin is flipped ${nn} times. What is the expected number of positions where two consecutive flips are both heads (HH)?`, `公平なコインを ${nn} 回投げます。連続する二回がどちらも表（HH）になる位置の個数の期待値を求めてください。`],
          a: { type: 'num', v, show: frac(nn - 1, 4) },
          hint: ['Use indicator variables, one per adjacent pair. Overlaps do not matter for the mean.', '隣り合う組ごとに指示変数をおきます。平均には、重なりは影響しません。'],
          sol: [[`There are ${nn - 1} adjacent pairs, each HH with probability $1/4$.`, `隣り合う組は ${nn - 1} 個あり、それぞれ確率 $1/4$ で HH です。`], [`Linearity: $E = ${nn - 1}\\cdot\\tfrac14 = ${frac(nn - 1, 4)}$, even though the indicators are dependent.`, `線形性により $E = ${nn - 1}\\cdot\\tfrac14 = ${frac(nn - 1, 4)}$ で、指示変数が従属でも成り立ちます。`]],
        };
      }
      if (form === 2) {
        const nn = r.int(4, 12);
        return {
          q: [`${nn} people put their coats in a pile and each takes one at random. What is the expected number who get their own coat?`, `${nn} 人がコートを山に置き、それぞれでたらめに一つ取ります。自分のコートを取る人数の期待値を求めてください。`],
          a: { type: 'num', v: 1 },
          hint: ['One indicator per person; each has probability $1/n$.', '一人ごとに指示変数をおくと、それぞれの確率は $1/n$ です。'],
          sol: [[`Person $i$ gets their own coat with probability $1/${nn}$.`, `$i$ 番目の人が自分のコートを取る確率は $1/${nn}$ です。`], [`$E = ${nn}\\cdot\\tfrac{1}{${nn}} = 1$, whatever $n$ is, although the indicators are dependent.`, `$E = ${nn}\\cdot\\tfrac{1}{${nn}} = 1$ で、$n$ によらず 1 です。指示変数は従属ですが、線形性は使えます。`]],
        };
      }
      return {
        q: ['In Monty Hall you pick door 1 and a host opens another door showing a goat. If the host knew where the car was and always opens a goat door, what is the probability that switching wins? Compare with a host who opens a random other door and happens to show a goat.', 'モンティ・ホールで、あなたは 1 番の扉を選び、司会者が別の扉を開けてヤギを見せます。司会者が車の場所を知っていて必ずヤギの扉を開ける場合、替えると勝つ確率はいくつですか。司会者がほかの扉をでたらめに開け、たまたまヤギが出た場合と比べてください。'],
        a: { type: 'choice', fixed: true, opts: [['$2/3$ with the knowing host; $1/2$ with the random host', '事情を知る司会者なら $2/3$、でたらめな司会者なら $1/2$'], ['$2/3$ in both cases', 'どちらの場合も $2/3$'], ['$1/2$ in both cases', 'どちらの場合も $1/2$'], ['$1/2$ with the knowing host; $2/3$ with the random host', '事情を知る司会者なら $1/2$、でたらめな司会者なら $2/3$']], v: 0 },
        hint: ['Ask how likely the observed event (a goat shown) is under each hypothesis about where the car is.', '車の場所についての各仮説のもとで、観察された事象（ヤギが出た）がどれだけ起こりやすいかを考えます。'],
        sol: [[`Knowing host: if your door hides the car (probability $1/3$) he opens either goat door; otherwise (probability $2/3$) he must open the one other goat door. Showing a goat is certain, so it tells you nothing about door 1, and switching wins with $2/3$.`, `事情を知る司会者：あなたの扉に車があれば（確率 $1/3$）どちらのヤギの扉も開け、なければ（確率 $2/3$）残りのヤギの扉を必ず開けます。ヤギが出るのは確実なので、1 番の扉について何も分からず、替えると $2/3$ で勝ちます。`], [`Random host: with the car behind door 1 he shows a goat with probability $1$, but with the car behind another door he shows a goat only with probability $1/2$. Updating: $P(\\text{car at 1}\\mid\\text{goat}) = \\dfrac{1/3}{1/3 + 1/3} = 1/2$.`, `でたらめな司会者：車が 1 番にあればヤギは確率 $1$ で出ますが、車が他の扉にあるとヤギが出るのは確率 $1/2$ です。更新すると $P(\\text{1 番に車}\\mid\\text{ヤギ}) = \\dfrac{1/3}{1/3 + 1/3} = 1/2$ です。`], ['The same sentence "a goat was shown" carries different information under different protocols: you must model how the fact was reported.', '「ヤギが出た」という同じ事実でも、手順が違えば得られる情報が違います。その事実がどう報告されたかをモデル化する必要があります。']],
      };
    },
  ];
})();
