'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const YN = (en, ja) => [en, ja];

  /* ---------- 1. measure and null sets ---------- */
  Q['lebesgue-integration-measure'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(0, 3), l1 = r.int(1, 4), gap = r.int(1, 3), l2 = r.int(1, 4), gap2 = r.int(1, 2), l3 = r.int(1, 3);
        const b = a + l1, c = b + gap, d = c + l2, e = d + gap2, f = e + l3;
        return {
          q: [`What is the Lebesgue measure of $[${a}, ${b}] \\cup (${c}, ${d}) \\cup [${e}, ${f}]$?`, `$[${a}, ${b}] \\cup (${c}, ${d}) \\cup [${e}, ${f}]$ のルベーグ測度はいくらですか。`],
          a: { type: 'int', v: l1 + l2 + l3 },
          hint: ['The pieces are disjoint, so measures add; endpoints do not matter.', '三つの部分は互いに素なので測度は足し算できます。端点は影響しません。'],
          sol: [[`The lengths are $${b} - ${a} = ${l1}$, $${d} - ${c} = ${l2}$ and $${f} - ${e} = ${l3}$.`, `長さは $${b} - ${a} = ${l1}$、$${d} - ${c} = ${l2}$、$${f} - ${e} = ${l3}$ です。`], [`By additivity the total is $${l1 + l2 + l3}$.`, `加法性により合計は $${l1 + l2 + l3}$ です。`], ['Open or closed ends make no difference, because a point has measure $0$.', '開か閉かは関係ありません。一点の測度は $0$ だからです。']],
        };
      }
      if (form === 1) {
        const a = r.int(0, 3), L1 = r.int(3, 7), s = r.int(1, L1 - 1), L2 = r.int(2, 6), b = a + L1, c = a + s, d = c + L2;
        const u = Math.max(b, d) - a;
        return {
          q: [`What is $\\mu([${a}, ${b}] \\cup [${c}, ${d}])$? The two intervals overlap.`, `$\\mu([${a}, ${b}] \\cup [${c}, ${d}])$ を求めてください。二つの区間は重なっています。`],
          a: { type: 'int', v: u },
          hint: ['Use $\\mu(A \\cup B) = \\mu(A) + \\mu(B) - \\mu(A \\cap B)$, or just draw the union.', '$\\mu(A \\cup B) = \\mu(A) + \\mu(B) - \\mu(A \\cap B)$ を使うか、和集合を描いてみます。'],
          sol: [[`$\\mu(A) = ${L1}$, $\\mu(B) = ${L2}$, and $A \\cap B = [${c}, ${Math.min(b, d)}]$ has measure ${Math.min(b, d) - c}.`, `$\\mu(A) = ${L1}$、$\\mu(B) = ${L2}$ で、$A \\cap B = [${c}, ${Math.min(b, d)}]$ の測度は ${Math.min(b, d) - c} です。`], [`So $\\mu(A \\cup B) = ${L1} + ${L2} - ${Math.min(b, d) - c} = ${u}$.`, `したがって $\\mu(A \\cup B) = ${L1} + ${L2} - ${Math.min(b, d) - c} = ${u}$ です。`]],
        };
      }
      const k = r.int(3, 40);
      const items = [
        { t: `\\{1, 2, \\ldots, ${k}\\}`, w: ['a finite set', '有限集合'] },
        { t: `\\mathbb{Z} \\cap [0, ${k}]`, w: ['a finite set', '有限集合'] },
        { t: `\\mathbb{Q} \\cap [0, ${k}]`, w: ['a countable set', '可算集合'] },
        { t: `\\{1/m : m = 1, 2, 3, \\ldots\\}`, w: ['a countable set', '可算集合'] },
      ];
      const it = r.pick(items);
      return {
        q: [`What is the Lebesgue measure of $${it.t}$?`, `$${it.t}$ のルベーグ測度はいくらですか。`],
        a: { type: 'int', v: 0 },
        hint: ['Each point has measure $0$; countable additivity handles countably many points.', '一点の測度は $0$ です。可算加法性により可算個の点も扱えます。'],
        sol: [[`The set is ${it.w[0]}, a union of countably many singletons, each of measure $0$.`, `この集合は${it.w[1]}で、測度 $0$ の一点集合の可算和です。`], ['By countable additivity its measure is $0 + 0 + \\cdots = 0$, even if it is dense, as $\\mathbb{Q}$ is.', '可算加法性により測度は $0 + 0 + \\cdots = 0$ です。$\\mathbb{Q}$ のように稠密でも同じです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([0, 0.5, 1, 2, 3]);
        return {
          q: [`Let $A_n = (0,\\ ${n(c)} + 1/n)$ for $n = 1, 2, 3, \\ldots$ These sets decrease. What is $\\mu\\left(\\bigcap_n A_n\\right)$?`, `$n = 1, 2, 3, \\ldots$ に対して $A_n = (0,\\ ${n(c)} + 1/n)$ とします。これらの集合は減少します。$\\mu\\left(\\bigcap_n A_n\\right)$ を求めてください。`],
          a: { type: 'num', v: c },
          hint: ['Find the intersection first: which points lie in every $A_n$?', 'まず共通部分を求めます。すべての $A_n$ に属する点はどれでしょうか。'],
          sol: [[`A point $x > ${n(c)}$ eventually leaves $A_n$, so the intersection is $(0, ${n(c)}]$ (empty if ${n(c)} = 0).`, `$x > ${n(c)}$ の点はやがて $A_n$ から出ていくので、共通部分は $(0, ${n(c)}]$ です（${n(c)} = 0 なら空集合）。`], [`Its measure is $${n(c)}$, which is also the limit of $\\mu(A_n) = ${n(c)} + 1/n$.`, `その測度は $${n(c)}$ で、$\\mu(A_n) = ${n(c)} + 1/n$ の極限とも一致します。`], ['Continuity from above needs $\\mu(A_1) < \\infty$, which holds here.', '上からの連続性には $\\mu(A_1) < \\infty$ が必要で、ここでは成り立っています。']],
        };
      }
      if (form === 1) {
        const k = r.int(1, 6);
        return {
          q: [`The middle-third construction starts with $[0, 1]$ and removes the open middle third of every remaining interval at each stage. What is the total length of the set left after $${k}$ stage${k === 1 ? '' : 's'}?`, `$[0, 1]$ から出発し、各段階で残った各区間の真ん中の開三分の一を取り除きます。$${k}$ 段階後に残る集合の長さの合計はいくらですか。`],
          a: { type: 'num', v: (2 / 3) ** k, show: `\\left(\\tfrac{2}{3}\\right)^{${k}} = ${frac(2 ** k, 3 ** k)}` },
          hint: ['Each stage keeps two thirds of the length.', '各段階で長さの $2/3$ が残ります。'],
          sol: [['Every stage multiplies the total length by $2/3$.', '各段階で、全体の長さは $2/3$ 倍になります。'], [`After ${k} stage${k === 1 ? '' : 's'} the length is $(2/3)^{${k}} = ${frac(2 ** k, 3 ** k)} \\approx ${n((2 / 3) ** k, 5)}$.`, `${k} 段階後の長さは $(2/3)^{${k}} = ${frac(2 ** k, 3 ** k)} \\approx ${n((2 / 3) ** k, 5)}$ です。`], ['The lengths tend to $0$, so the Cantor set has measure zero although it is uncountable.', '長さは $0$ に収束するので、カントール集合は非可算でも測度は $0$ です。']],
        };
      }
      const b = r.pick([[4, 1], [5, 1], [6, 2], [6, 1], [8, 3], [10, 4]]);
      const rem = b[1] / (b[0] - 2);
      return {
        q: [`A fat Cantor set removes, at stage $k = 1, 2, 3, \\ldots$, $2^{k-1}$ open intervals each of length $${b[1]}/${b[0]}^k$ from $[0, 1]$. What is its Lebesgue measure?`, `太いカントール集合では、段階 $k = 1, 2, 3, \\ldots$ ごとに、長さ $${b[1]}/${b[0]}^k$ の開区間を $2^{k-1}$ 個ずつ $[0, 1]$ から取り除きます。そのルベーグ測度はいくらですか。`],
        a: { type: 'num', v: 1 - rem, show: frac(b[0] - 2 - b[1], b[0] - 2) },
        hint: ['Add up the removed lengths: $\\sum_k 2^{k-1}\\cdot c/b^k$ is a geometric series.', '取り除いた長さを足します。$\\sum_k 2^{k-1}\\cdot c/b^k$ は等比級数です。'],
        sol: [[`Stage $k$ removes $2^{k-1}\\cdot ${b[1]}/${b[0]}^k = \\frac{${b[1]}}{2}(2/${b[0]})^k$.`, `段階 $k$ で取り除く長さは $2^{k-1}\\cdot ${b[1]}/${b[0]}^k = \\frac{${b[1]}}{2}(2/${b[0]})^k$ です。`], [`Summing the series gives $\\frac{${b[1]}}{2}\\cdot\\frac{2/${b[0]}}{1 - 2/${b[0]}} = \\frac{${b[1]}}{${b[0] - 2}} = ${frac(b[1], b[0] - 2)}$ removed in total.`, `級数の和は $\\frac{${b[1]}}{2}\\cdot\\frac{2/${b[0]}}{1 - 2/${b[0]}} = \\frac{${b[1]}}{${b[0] - 2}} = ${frac(b[1], b[0] - 2)}$ で、これが取り除かれた長さの合計です。`], [`The set that remains has measure $1 - ${frac(b[1], b[0] - 2)} = ${frac(b[0] - 2 - b[1], b[0] - 2)}$: positive, though it contains no interval at all.`, `残る集合の測度は $1 - ${frac(b[1], b[0] - 2)} = ${frac(b[0] - 2 - b[1], b[0] - 2)}$ で、区間を一つも含まないのに正の値です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const nul = [
          { s: ['$\\mathbb{Q} \\cap [0, 1]$', '$\\mathbb{Q} \\cap [0, 1]$'] }, { s: ['the Cantor ternary set', '3 進カントール集合'] }, { s: ['$\\mathbb{N}$', '$\\mathbb{N}$'] }, { s: ['$\\{\\sin(m) : m \\in \\mathbb{N}\\}$', '$\\{\\sin(m) : m \\in \\mathbb{N}\\}$'] },
        ];
        const pos = [
          { s: ['$[0, 1] \\setminus \\mathbb{Q}$', '$[0, 1] \\setminus \\mathbb{Q}$'] }, { s: ['a fat Cantor set', '太いカントール集合'] }, { s: ['$(0, 1/2)$', '$(0, 1/2)$'] }, { s: ['$[0, 1] \\setminus \\{1/m : m \\in \\mathbb{N}\\}$', '$[0, 1] \\setminus \\{1/m : m \\in \\mathbb{N}\\}$'] },
        ];
        const good = r.pick(nul), bad = r.sample(pos, 3), opts = r.shuffle([good.s, ...bad.map((b) => b.s)]);
        return {
          q: ['Which of these sets has Lebesgue measure zero?', '次のうち、ルベーグ測度が 0 の集合はどれですか。'],
          a: { type: 'choice', opts, v: opts.indexOf(good.s), fixed: true },
          hint: ['Countable sets are null; a set containing an interval, or the complement of a null set in $[0, 1]$, is not.', '可算集合は零集合です。区間を含む集合や、$[0, 1]$ での零集合の補集合は零集合ではありません。'],
          sol: [[`${good.s[0]} is null: ${good.s[0].includes('Cantor') ? 'its stage-$k$ cover has length $(2/3)^k \\to 0$' : 'it is countable'}.`, `${good.s[1]}は零集合です。${good.s[1].includes('カントール') ? '第 $k$ 段階の被覆の長さは $(2/3)^k \\to 0$ です' : '可算集合だからです'}。`], ['The others have positive measure: an interval, a complement of a null set in $[0, 1]$ (measure $1$), or a fat Cantor set.', '他は正の測度をもちます。区間、$[0, 1]$ での零集合の補集合（測度 $1$）、太いカントール集合のいずれかです。']],
        };
      }
      const m = r.int(2, 5);
      return {
        q: [`A countable set $\\{q_1, q_2, \\ldots\\}$ is covered by intervals, the $j$th of length $\\varepsilon/${m}^j$. The total length of the cover is $c\\varepsilon$. Find $c$.`, `可算集合 $\\{q_1, q_2, \\ldots\\}$ を、$j$ 番目の長さが $\\varepsilon/${m}^j$ の区間で覆います。被覆の全長は $c\\varepsilon$ です。$c$ を求めてください。`],
        a: { type: 'num', v: 1 / (m - 1), show: frac(1, m - 1) },
        hint: ['Sum the geometric series $\\sum_{j \\ge 1} m^{-j}$.', '等比級数 $\\sum_{j \\ge 1} m^{-j}$ を足します。'],
        sol: [[`$\\sum_{j \\ge 1} ${m}^{-j} = \\dfrac{1/${m}}{1 - 1/${m}} = \\dfrac{1}{${m - 1}}$.`, `$\\sum_{j \\ge 1} ${m}^{-j} = \\dfrac{1/${m}}{1 - 1/${m}} = \\dfrac{1}{${m - 1}}$ です。`], [`The total length is $\\varepsilon/${m - 1}$, so the multiple is $${frac(1, m - 1)}$.`, `全長は $\\varepsilon/${m - 1}$ なので、倍率は $${frac(1, m - 1)}$ です。`], ['Since $\\varepsilon$ is arbitrary, the outer measure of any countable set is $0$.', '$\\varepsilon$ は任意なので、可算集合の外測度は $0$ です。']],
      };
    },
  ];

  /* ---------- 2. power tests, tails and Tonelli ---------- */
  Q['lebesgue-integration-tails'] = [
    (r) => {
      if (r.chance(0.5)) {
        const q = r.pick([-0.5, -2 / 3, -0.75, -0.25, 0.5, 1, 2, 3]);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^1 x^{${q === -2 / 3 ? '-2/3' : n(q)}}\\,dx$. Give the value.`, `$\\displaystyle\\int_0^1 x^{${q === -2 / 3 ? '-2/3' : n(q)}}\\,dx$ の値を求めてください。`],
          a: { type: 'num', v: 1 / (q + 1), show: frac(Math.round(1 / (q + 1) * 12), 12) },
          hint: ['Power rule: the integral is $1/(q + 1)$, valid because $q > -1$.', 'べき乗の積分公式で $1/(q + 1)$ です。$q > -1$ なので有効です。'],
          sol: [[`$\\int_0^1 x^{q}\\,dx = \\left[\\dfrac{x^{q+1}}{q+1}\\right]_0^1$ with $q + 1 = ${n(q + 1, 5)} > 0$, so the lower limit gives $0$.`, `$\\int_0^1 x^{q}\\,dx = \\left[\\dfrac{x^{q+1}}{q+1}\\right]_0^1$ で $q + 1 = ${n(q + 1, 5)} > 0$ なので、下端の項は $0$ です。`], [`The value is $1/${n(q + 1, 5)} = ${n(1 / (q + 1), 5)}$.`, `値は $1/${n(q + 1, 5)} = ${n(1 / (q + 1), 5)}$ です。`], ['The singularity at $0$ is harmless as long as the exponent is above $-1$.', '指数が $-1$ より大きければ、$0$ での特異性は問題になりません。']],
        };
      }
      const p = r.pick([0.5, 0.9, 1, 1.5, 2, 3, 0.25]), near0 = r.chance(0.5);
      const conv = near0 ? p < 1 : p > 1;
      return {
        q: [near0 ? `Does $\\displaystyle\\int_0^1 x^{-${n(p)}}\\,dx$ converge?` : `Does $\\displaystyle\\int_1^\\infty x^{-${n(p)}}\\,dx$ converge?`, near0 ? `$\\displaystyle\\int_0^1 x^{-${n(p)}}\\,dx$ は収束しますか。` : `$\\displaystyle\\int_1^\\infty x^{-${n(p)}}\\,dx$ は収束しますか。`],
        a: { type: 'choice', opts: [YN('Yes, it converges', 'はい、収束する'), YN('No, it diverges', 'いいえ、発散する')], v: conv ? 0 : 1, fixed: true },
        hint: [near0 ? 'Near $0$ the integral converges exactly when the exponent $-p$ is greater than $-1$.' : 'At infinity the integral converges exactly when $p > 1$.', near0 ? '$0$ の近くでは、指数 $-p$ が $-1$ より大きいときに限って収束します。' : '無限遠では $p > 1$ のときに限って収束します。'],
        sol: [[near0 ? `Here $p = ${n(p)}$ and the test near $0$ is $p < 1$: ${conv ? 'satisfied' : 'violated'}.` : `Here $p = ${n(p)}$ and the test at infinity is $p > 1$: ${conv ? 'satisfied' : 'violated'}.`, near0 ? `ここで $p = ${n(p)}$、$0$ の近くでの条件は $p < 1$ で、${conv ? '満たされています' : '満たされていません'}。` : `ここで $p = ${n(p)}$、無限遠での条件は $p > 1$ で、${conv ? '満たされています' : '満たされていません'}。`], [conv ? `It converges to $${near0 ? frac(Math.round(100 / (1 - p)), 100) : frac(Math.round(100 / (p - 1)), 100)}$.` : 'It diverges (at the borderline $p = 1$ the integral is a logarithm, which is also infinite).', conv ? `収束し、値は $${near0 ? frac(Math.round(100 / (1 - p)), 100) : frac(Math.round(100 / (p - 1)), 100)}$ です。` : '発散します（境界の $p = 1$ では対数になり、これも無限大です）。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 4), b = r.int(1, 4);
        return {
          q: [`Tonelli lets you integrate a nonnegative function in either order. Compute $\\displaystyle\\int_0^1\\int_0^1 x^{${a}}y^{${b}}\\,dx\\,dy$.`, `トネリの定理により、非負関数は積分の順序を入れ替えられます。$\\displaystyle\\int_0^1\\int_0^1 x^{${a}}y^{${b}}\\,dx\\,dy$ を計算してください。`],
          a: { type: 'num', v: 1 / ((a + 1) * (b + 1)), show: frac(1, (a + 1) * (b + 1)) },
          hint: ['The integrand is a product, so the double integral splits into two single integrals.', '被積分関数は積なので、二重積分は二つの単積分の積に分かれます。'],
          sol: [[`$\\int_0^1 x^{${a}}\\,dx = \\dfrac{1}{${a + 1}}$ and $\\int_0^1 y^{${b}}\\,dy = \\dfrac{1}{${b + 1}}$.`, `$\\int_0^1 x^{${a}}\\,dx = \\dfrac{1}{${a + 1}}$、$\\int_0^1 y^{${b}}\\,dy = \\dfrac{1}{${b + 1}}$ です。`], [`The product is $${frac(1, (a + 1) * (b + 1))}$.`, `積は $${frac(1, (a + 1) * (b + 1))}$ です。`]],
        };
      }
      if (form === 1) {
        const p = r.int(0, 4);
        return {
          q: [`Let $T = \\{(x, y) : 0 \\le y \\le x \\le 1\\}$. Compute $\\displaystyle\\iint_T x^{${p}}\\,dA$ by integrating in $y$ first.`, `$T = \\{(x, y) : 0 \\le y \\le x \\le 1\\}$ とします。まず $y$ について積分して、$\\displaystyle\\iint_T x^{${p}}\\,dA$ を計算してください。`],
          a: { type: 'num', v: 1 / (p + 2), show: frac(1, p + 2) },
          hint: ['For fixed $x$, $y$ runs over $[0, x]$, a set of length $x$.', '$x$ を固定すると $y$ は長さ $x$ の区間 $[0, x]$ を動きます。'],
          sol: [[`The inner integral is $\\int_0^x x^{${p}}\\,dy = x^{${p + 1}}$.`, `内側の積分は $\\int_0^x x^{${p}}\\,dy = x^{${p + 1}}$ です。`], [`Then $\\int_0^1 x^{${p + 1}}\\,dx = ${frac(1, p + 2)}$.`, `続いて $\\int_0^1 x^{${p + 1}}\\,dx = ${frac(1, p + 2)}$ です。`], ['Integrating in the other order gives the same answer, as Tonelli guarantees for nonnegative integrands.', '積分の順序を入れ替えても、非負の被積分関数なのでトネリの定理により同じ答えになります。']],
        };
      }
      const a = r.pick([2, 3, 4, 5]);
      return {
        q: [`Use the layer-cake formula for $f(x) = x^{-${a}}$ on $[1, \\infty)$: $\\mu\\{f > t\\} = t^{-1/${a}} - 1$ for $0 < t < 1$ and $0$ for $t \\ge 1$. Compute $\\int f\\,d\\mu = \\int_0^1 (t^{-1/${a}} - 1)\\,dt$.`, `$[1, \\infty)$ 上の $f(x) = x^{-${a}}$ にレイヤーケーキの公式を使います。$0 < t < 1$ で $\\mu\\{f > t\\} = t^{-1/${a}} - 1$、$t \\ge 1$ で $0$ です。$\\int f\\,d\\mu = \\int_0^1 (t^{-1/${a}} - 1)\\,dt$ を計算してください。`],
        a: { type: 'num', v: 1 / (a - 1), show: frac(1, a - 1) },
        hint: ['The power rule applies to $t^{-1/a}$ because $-1/a > -1$.', '$-1/a > -1$ なので、$t^{-1/a}$ にべき乗の積分公式が使えます。'],
        sol: [[`$\\int_0^1 t^{-1/${a}}\\,dt = \\dfrac{1}{1 - 1/${a}} = \\dfrac{${a}}{${a - 1}}$.`, `$\\int_0^1 t^{-1/${a}}\\,dt = \\dfrac{1}{1 - 1/${a}} = \\dfrac{${a}}{${a - 1}}$ です。`], [`Subtracting $\\int_0^1 1\\,dt = 1$ gives $\\dfrac{${a}}{${a - 1}} - 1 = ${frac(1, a - 1)}$.`, `$\\int_0^1 1\\,dt = 1$ を引くと $\\dfrac{${a}}{${a - 1}} - 1 = ${frac(1, a - 1)}$ です。`], [`This matches $\\int_1^\\infty x^{-${a}}\\,dx = ${frac(1, a - 1)}$: slicing by height and by position give the same area, tail included.`, `これは $\\int_1^\\infty x^{-${a}}\\,dx = ${frac(1, a - 1)}$ と一致します。高さで切っても位置で切っても、裾野を含めて同じ面積になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lo = r.chance(0.5);
        return {
          q: [lo ? 'Write $\\displaystyle\\int_0^1 x^{-s}\\,dx$ as a function of $s$, for $0 < s < 1$.' : 'Write $\\displaystyle\\int_1^\\infty x^{-s}\\,dx$ as a function of $s$, for $s > 1$.', lo ? '$0 < s < 1$ のとき $\\displaystyle\\int_0^1 x^{-s}\\,dx$ を $s$ の式で表してください。' : '$s > 1$ のとき $\\displaystyle\\int_1^\\infty x^{-s}\\,dx$ を $s$ の式で表してください。'],
          a: { type: 'expr', v: lo ? '1/(1-s)' : '1/(s-1)', vars: ['s'], dom: lo ? { s: [0.1, 0.9] } : { s: [1.2, 3] }, lhs: ['$I(s) =$', '$I(s) =$'] },
          hint: [lo ? 'The antiderivative is $x^{1-s}/(1 - s)$, and $x^{1-s} \\to 0$ as $x \\to 0^+$.' : 'The antiderivative is $x^{1-s}/(1 - s)$, and $x^{1-s} \\to 0$ as $x \\to \\infty$ when $s > 1$.', lo ? '原始関数は $x^{1-s}/(1 - s)$ で、$x \\to 0^+$ のとき $x^{1-s} \\to 0$ です。' : '原始関数は $x^{1-s}/(1 - s)$ で、$s > 1$ なら $x \\to \\infty$ のとき $x^{1-s} \\to 0$ です。'],
          sol: [[lo ? '$\\int_\\epsilon^1 x^{-s}\\,dx = \\dfrac{1 - \\epsilon^{1-s}}{1 - s} \\to \\dfrac{1}{1 - s}$ as $\\epsilon \\to 0^+$.' : '$\\int_1^R x^{-s}\\,dx = \\dfrac{R^{1-s} - 1}{1 - s} \\to \\dfrac{1}{s - 1}$ as $R \\to \\infty$.', lo ? '$\\int_\\epsilon^1 x^{-s}\\,dx = \\dfrac{1 - \\epsilon^{1-s}}{1 - s} \\to \\dfrac{1}{1 - s}$（$\\epsilon \\to 0^+$）です。' : '$\\int_1^R x^{-s}\\,dx = \\dfrac{R^{1-s} - 1}{1 - s} \\to \\dfrac{1}{s - 1}$（$R \\to \\infty$）です。'], [lo ? 'The value blows up as $s \\to 1^-$: the integral stops converging exactly at the threshold.' : 'The value blows up as $s \\to 1^+$: the integral stops converging exactly at the threshold.', lo ? '$s \\to 1^-$ で値は発散します。積分はちょうど閾値で収束しなくなります。' : '$s \\to 1^+$ で値は発散します。積分はちょうど閾値で収束しなくなります。']],
        };
      }
      if (form === 1) {
        const L = r.pick([1, 2, 3, 4, 5]);
        return {
          q: [`For $p > 1$ compute $\\displaystyle\\int_0^\\infty \\min\\left(1, \\left(\\tfrac{${L}}{x}\\right)^{p}\\right)dx$ as a function of $p$.`, `$p > 1$ のとき $\\displaystyle\\int_0^\\infty \\min\\left(1, \\left(\\tfrac{${L}}{x}\\right)^{p}\\right)dx$ を $p$ の式で求めてください。`],
          a: { type: 'expr', v: `${L}*p/(p-1)`, vars: ['p'], dom: { p: [1.3, 4] }, lhs: ['$J(p) =$', '$J(p) =$'] },
          hint: [`Split at $x = ${L}$: the integrand is $1$ on $[0, ${L}]$ and $(${L}/x)^p$ beyond.`, `$x = ${L}$ で分けます。$[0, ${L}]$ では被積分関数は $1$、それ以降は $(${L}/x)^p$ です。`],
          sol: [[`$\\int_0^{${L}} 1\\,dx = ${L}$ and $\\int_{${L}}^\\infty (${L}/x)^p\\,dx = ${L}\\cdot\\dfrac{1}{p - 1}$.`, `$\\int_0^{${L}} 1\\,dx = ${L}$、$\\int_{${L}}^\\infty (${L}/x)^p\\,dx = ${L}\\cdot\\dfrac{1}{p - 1}$ です。`], [`Adding, $J(p) = ${L}\\left(1 + \\dfrac{1}{p - 1}\\right) = \\dfrac{${L}p}{p - 1}$.`, `足すと $J(p) = ${L}\\left(1 + \\dfrac{1}{p - 1}\\right) = \\dfrac{${L}p}{p - 1}$ です。`], ['Bounding by this function is the standard way to produce a dominating function with a controlled tail.', 'この関数で押さえるのは、裾野の制御された優関数を作る標準的な方法です。']],
        };
      }
      const opts = [YN('For no value of $p$', 'どの $p$ でも収束しない'), YN('For $p < 1$', '$p < 1$ のとき'), YN('For $p > 1$', '$p > 1$ のとき'), YN('For every $p \\ne 1$', '$p \\ne 1$ のすべてで')];
      return {
        q: ['For which real $p$ is $x^{-p}$ integrable (in the Lebesgue sense) over the whole half-line $(0, \\infty)$?', '実数 $p$ がどんな値のとき、$x^{-p}$ は半直線 $(0, \\infty)$ 全体で（ルベーグの意味で）可積分ですか。'],
        a: { type: 'choice', opts, v: 0, fixed: true },
        hint: ['Test the two ends separately: near $0$ and near $\\infty$.', '二つの端、$0$ の近くと $\\infty$ の近くを別々に調べます。'],
        sol: [['Near $0$ we need $p < 1$; near infinity we need $p > 1$.', '$0$ の近くでは $p < 1$、無限遠では $p > 1$ が必要です。'], ['No single $p$ satisfies both, so $x^{-p}$ is never integrable on $(0, \\infty)$.', '両方を満たす $p$ はないので、$x^{-p}$ は $(0, \\infty)$ 上で可積分になることはありません。'], ['Multiplying by a cutoff such as $\\min(1, x^{-p})$ repairs one end only if the other already behaves.', '$\\min(1, x^{-p})$ のような打ち切りで直せるのは、もう一方の端がすでにおとなしい場合に限ります。']],
      };
    },
  ];
})();
