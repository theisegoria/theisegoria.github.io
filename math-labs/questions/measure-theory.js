'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI;

  /* ---------- 1. Riemann versus Lebesgue partitions ---------- */
  Q.partitions = [
    // warm-up: measure of a set, one step
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 9), c = (k / 10) ** 2;
        return {
          q: [`Find the Lebesgue measure of $\\{x \\in [0, 1] : x^2 \\ge ${n(c)}\\}$.`, `$\\{x \\in [0, 1] : x^2 \\ge ${n(c)}\\}$ のルベーグ測度を求めてください。`],
          a: { type: 'num', v: 1 - k / 10 },
          hint: ['On $[0, 1]$ the condition $x^2 \\ge c$ is the same as $x \\ge \\sqrt c$.', '$[0, 1]$ 上では $x^2 \\ge c$ は $x \\ge \\sqrt c$ と同じです。'],
          sol: [[`$x^2 \\ge ${n(c)}$ with $x \\ge 0$ means $x \\ge ${n(k / 10)}$, so the set is the interval $[${n(k / 10)}, 1]$.`, `$x \\ge 0$ で $x^2 \\ge ${n(c)}$ は $x \\ge ${n(k / 10)}$ と同値なので、集合は区間 $[${n(k / 10)}, 1]$ です。`], [`Its length is $1 - ${n(k / 10)} = ${n(1 - k / 10)}$. This is one of the numbers $\\lambda\\{f \\ge y\\}$ that the Lebesgue sum adds up.`, `長さは $1 - ${n(k / 10)} = ${n(1 - k / 10)}$ です。これはルベーグ和が足し合わせる数 $\\lambda\\{f \\ge y\\}$ の一つです。`]],
        };
      }
      if (form === 1) {
        let a, b, c, d;
        do { a = r.step(0, 0.6, 0.1); b = a + r.step(0.1, 0.4, 0.1); c = r.step(0, 0.8, 0.1); d = c + r.step(0.1, 0.3, 0.1); } while (d > 1.0001 || b > 1.0001);
        const lo = Math.max(a, c), hi = Math.min(b, d), over = Math.max(0, hi - lo);
        const m = (b - a) + (d - c) - over;
        return {
          q: [`What is the Lebesgue measure of $[${n(a)}, ${n(b)}] \\cup [${n(c)}, ${n(d)}]$?`, `$[${n(a)}, ${n(b)}] \\cup [${n(c)}, ${n(d)}]$ のルベーグ測度はいくつですか。`],
          a: { type: 'num', v: m, tol: 1e-6 },
          hint: ['Add the two lengths, then subtract what you counted twice.', '二つの長さを足し、二重に数えた部分を引きます。'],
          sol: [[`The lengths are $${n(b - a)}$ and $${n(d - c)}$; the overlap has length $${n(over)}$.`, `長さは $${n(b - a)}$ と $${n(d - c)}$ で、重なりの長さは $${n(over)}$ です。`], [`$\\lambda = ${n(b - a)} + ${n(d - c)} - ${n(over)} = ${n(m)}$: measure is additive on disjoint pieces, so overlaps must not be counted twice.`, `$\\lambda = ${n(b - a)} + ${n(d - c)} - ${n(over)} = ${n(m)}$ です。測度は互いに素な部分について加法的なので、重なりを二度数えてはいけません。`]],
        };
      }
      const which = r.int(0, 2);
      const sets = [
        ['the rationals in $[0, 1]$', '$[0, 1]$ の有理数全体', 0, ['A countable set is a countable union of points, each of measure $0$.', '可算集合は測度 $0$ の点の可算和です。']],
        ['the irrationals in $[0, 1]$', '$[0, 1]$ の無理数全体', 1, ['They are $[0, 1]$ minus a countable set of measure $0$.', '$[0, 1]$ から測度 $0$ の可算集合を除いたものです。']],
        ['the middle-thirds Cantor set', 'カントール集合（中央の三分の一を取り除く）', 0, ['The removed intervals have total length $\\tfrac13 + \\tfrac29 + \\tfrac4{27} + \\dots = 1$.', '取り除く区間の長さの合計は $\\tfrac13 + \\tfrac29 + \\tfrac4{27} + \\dots = 1$ です。']],
      ];
      const [en, ja, v, why] = sets[which];
      return {
        q: [`What is the Lebesgue measure of ${en}?`, `${ja}のルベーグ測度はいくつですか。`],
        a: { type: 'choice', opts: [['$0$', '$0$'], ['$1$', '$1$'], ['$\\tfrac12$', '$\\tfrac12$'], ['It is not measurable', '可測ではない']], v: v === 0 ? 0 : 1, fixed: true },
        hint: ['Lebesgue measure is countably additive, and a single point has measure $0$.', 'ルベーグ測度は可算加法的で、一点の測度は $0$ です。'],
        sol: [why, [v === 0 ? 'So the measure is $0$, although the set is infinite (and, for the Cantor set, uncountable).' : 'So the measure is $1$: almost every point of $[0, 1]$ is irrational.', v === 0 ? 'したがって測度は $0$ です。集合は無限（カントール集合では非可算）であるにもかかわらずです。' : 'したがって測度は $1$ です。$[0, 1]$ のほとんどすべての点は無理数です。']],
      };
    },
    // standard: the lab's sums for simple functions
    (r) => {
      const form = r.int(0, 2);
      const N = r.int(2, 24);
      if (form === 0) {
        const v = (N - 1) / (2 * N);
        return {
          q: [`For $f(x) = x$ on $[0, 1]$, compute the Lebesgue lower sum $\\sum_{k=1}^{n} \\tfrac1n\\,\\lambda\\{f \\ge k/n\\}$ with $n = ${N}$ levels.`, `$[0, 1]$ 上の $f(x) = x$ について、$n = ${N}$ 段のルベーグ下和 $\\sum_{k=1}^{n} \\tfrac1n\\,\\lambda\\{f \\ge k/n\\}$ を計算してください。`],
          a: { type: 'num', v, show: frac(N - 1, 2 * N) },
          hint: ['$\\{x \\ge k/n\\}$ is the interval $[k/n, 1]$.', '$\\{x \\ge k/n\\}$ は区間 $[k/n, 1]$ です。'],
          sol: [[`$\\lambda\\{x \\ge k/${N}\\} = 1 - k/${N}$, so the sum is $\\tfrac1{${N}}\\sum_{k=1}^{${N}}(1 - k/${N}) = \\tfrac1{${N}}\\left(${N} - \\tfrac{${N + 1}}{2}\\right)$.`, `$\\lambda\\{x \\ge k/${N}\\} = 1 - k/${N}$ なので、和は $\\tfrac1{${N}}\\sum_{k=1}^{${N}}(1 - k/${N}) = \\tfrac1{${N}}\\left(${N} - \\tfrac{${N + 1}}{2}\\right)$ です。`], [`That is $\\tfrac{${N - 1}}{${2 * N}} = ${n(v)}$, short of $\\int_0^1 x\\,dx = \\tfrac12$ by $\\tfrac1{${2 * N}}$. For this increasing $f$ the Riemann lower sum is the same number.`, `これは $\\tfrac{${N - 1}}{${2 * N}} = ${n(v)}$ で、$\\int_0^1 x\\,dx = \\tfrac12$ より $\\tfrac1{${2 * N}}$ だけ小さい値です。この増加関数ではリーマン下和も同じ値になります。`]],
          set: { resolution: N },
        };
      }
      if (form === 1) {
        const v = (N - 1) * (2 * N - 1) / (6 * N * N);
        return {
          q: [`Compute the Riemann lower sum of $f(x) = x^2$ on $[0, 1]$ with $n = ${N}$ equal pieces.`, `$[0, 1]$ 上の $f(x) = x^2$ を $n = ${N}$ 等分したリーマン下和を計算してください。`],
          a: { type: 'num', v, show: frac((N - 1) * (2 * N - 1), 6 * N * N) },
          hint: ['$x^2$ is increasing, so its least value on $[i/n, (i+1)/n]$ is at the left end.', '$x^2$ は増加関数なので、$[i/n, (i+1)/n]$ での最小値は左端の値です。'],
          sol: [[`$L = \\sum_{i=0}^{${N - 1}} \\tfrac1{${N}}\\left(\\tfrac{i}{${N}}\\right)^2 = \\tfrac{1}{${N}^3}\\cdot\\tfrac{${N - 1}\\cdot ${N}\\cdot ${2 * N - 1}}{6}$.`, `$L = \\sum_{i=0}^{${N - 1}} \\tfrac1{${N}}\\left(\\tfrac{i}{${N}}\\right)^2 = \\tfrac{1}{${N}^3}\\cdot\\tfrac{${N - 1}\\cdot ${N}\\cdot ${2 * N - 1}}{6}$ です。`], [`$L = ${n(v, 5)}$, below $\\int_0^1 x^2\\,dx = \\tfrac13$. The gap shrinks like $\\tfrac1{2n}$ as the partition is refined.`, `$L = ${n(v, 5)}$ で、$\\int_0^1 x^2\\,dx = \\tfrac13$ より小さい値です。分割を細かくすると差は $\\tfrac1{2n}$ のように縮みます。`]],
        };
      }
      const a = r.pick([2, 3, 4, 0.5, 1.5]);
      return {
        q: [`On $[0, 1]$ let $f(x) = x^{${n(a)}}$. Use the layer-cake formula $\\int f = \\int_0^1 \\lambda\\{f \\ge y\\}\\,dy$ to find $\\int_0^1 f$.`, `$[0, 1]$ 上で $f(x) = x^{${n(a)}}$ とします。層別の公式 $\\int f = \\int_0^1 \\lambda\\{f \\ge y\\}\\,dy$ を使って $\\int_0^1 f$ を求めてください。`],
        a: { type: 'num', v: 1 / (a + 1), show: a === 0.5 ? '\\tfrac23' : a === 1.5 ? '\\tfrac25' : frac(1, a + 1) },
        hint: ['First find the set $\\{x^a \\ge y\\}$ as an interval.', 'まず集合 $\\{x^a \\ge y\\}$ を区間として求めます。'],
        sol: [[`$x^{${n(a)}} \\ge y$ exactly when $x \\ge y^{1/${n(a)}}$, so $\\lambda\\{f \\ge y\\} = 1 - y^{${n(1 / a)}}$.`, `$x^{${n(a)}} \\ge y$ は $x \\ge y^{1/${n(a)}}$ と同値なので、$\\lambda\\{f \\ge y\\} = 1 - y^{${n(1 / a)}}$ です。`], [`$\\int_0^1 (1 - y^{${n(1 / a)}})\\,dy = 1 - \\tfrac{1}{${n(1 / a)} + 1} = ${n(1 / (a + 1))}$, the same as $\\int_0^1 x^{${n(a)}}\\,dx$: slicing horizontally and vertically measure the same area.`, `$\\int_0^1 (1 - y^{${n(1 / a)}})\\,dy = 1 - \\tfrac{1}{${n(1 / a)} + 1} = ${n(1 / (a + 1))}$ で、$\\int_0^1 x^{${n(a)}}\\,dx$ と一致します。横に切っても縦に切っても同じ面積を測っています。`]],
      };
    },
    // challenge
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, b; do { a = r.int(0, 4); b = r.int(0, 4); } while (a === b);
        return {
          q: [`Let $f = ${a}$ on the irrationals of $[0, 1]$ and $f = ${b}$ on the rationals. Give the Riemann lower integral, the Riemann upper integral and the Lebesgue integral of $f$.`, `$[0, 1]$ の無理数上で $f = ${a}$、有理数上で $f = ${b}$ とします。$f$ のリーマン下積分、リーマン上積分、ルベーグ積分を答えてください。`],
          a: { type: 'tuple', v: [Math.min(a, b), Math.max(a, b), a], labels: [['lower', '下積分'], ['upper', '上積分'], ['Lebesgue', 'ルベーグ']], tol: 1e-9 },
          hint: ['Every interval contains both rationals and irrationals; but the rationals have measure $0$.', 'どの区間にも有理数と無理数の両方が含まれますが、有理数全体の測度は $0$ です。'],
          sol: [[`Every piece of every partition contains both kinds of point, so the least value on each piece is $${Math.min(a, b)}$ and the greatest is $${Math.max(a, b)}$. The lower and upper integrals are $${Math.min(a, b)}$ and $${Math.max(a, b)}$, and $f$ is not Riemann integrable.`, `どの分割のどの小区間にも両方の点があるので、各小区間での最小値は $${Math.min(a, b)}$、最大値は $${Math.max(a, b)}$ です。下積分は $${Math.min(a, b)}$、上積分は $${Math.max(a, b)}$ で、$f$ はリーマン積分可能ではありません。`], [`Lebesgue: $f = ${a}\\cdot\\mathbf 1_{\\text{irr}} + ${b}\\cdot\\mathbf 1_{\\mathbb Q}$, so $\\int f = ${a}\\cdot 1 + ${b}\\cdot 0 = ${a}$.`, `ルベーグ積分では $f = ${a}\\cdot\\mathbf 1_{\\text{irr}} + ${b}\\cdot\\mathbf 1_{\\mathbb Q}$ なので $\\int f = ${a}\\cdot 1 + ${b}\\cdot 0 = ${a}$ です。`], ['Cutting the range instead of the domain only asks for the measure of each level set, and a set of measure zero does not count.', '定義域ではなく値域を切れば、各水準集合の測度だけが必要になり、測度 $0$ の集合は寄与しません。']],
        };
      }
      if (form === 1) {
        const kind = r.int(0, 1);
        if (kind === 0) {
          const a = r.pick([2, 3, 4]);
          return {
            q: [`For $f(x) = x^{${a}}$ on $[0, 1]$, write the distribution function $m(y) = \\lambda\\{x \\in [0, 1] : f(x) \\ge y\\}$ for $0 < y < 1$.`, `$[0, 1]$ 上の $f(x) = x^{${a}}$ について、$0 < y < 1$ での分布関数 $m(y) = \\lambda\\{x \\in [0, 1] : f(x) \\ge y\\}$ を書いてください。`],
            a: { type: 'expr', v: `1-y^(1/${a})`, vars: ['y'], dom: { y: [0.05, 0.95] }, lhs: ['$m(y) =$', '$m(y) =$'] },
            hint: ['Solve $x^a \\ge y$ for $x$ and measure the interval you get.', '$x^a \\ge y$ を $x$ について解き、得られる区間の長さを測ります。'],
            sol: [[`$x^{${a}} \\ge y \\iff x \\ge y^{1/${a}}$, so the set is $[y^{1/${a}}, 1]$.`, `$x^{${a}} \\ge y \\iff x \\ge y^{1/${a}}$ なので、集合は $[y^{1/${a}}, 1]$ です。`], [`$m(y) = 1 - y^{1/${a}}$. Integrating it over $0 < y < 1$ gives $1 - \\tfrac{${a}}{${a + 1}} = \\tfrac1{${a + 1}} = \\int_0^1 x^{${a}}\\,dx$.`, `$m(y) = 1 - y^{1/${a}}$ です。これを $0 < y < 1$ で積分すると $1 - \\tfrac{${a}}{${a + 1}} = \\tfrac1{${a + 1}} = \\int_0^1 x^{${a}}\\,dx$ になります。`]],
          };
        }
        return {
          q: ['For $f(x) = \\sin(\\pi x)$ on $[0, 1]$, write $m(y) = \\lambda\\{x : f(x) \\ge y\\}$ for $0 < y < 1$. The function rises and falls, but the set is a single interval.', '$[0, 1]$ 上の $f(x) = \\sin(\\pi x)$ について、$0 < y < 1$ での $m(y) = \\lambda\\{x : f(x) \\ge y\\}$ を書いてください。関数は上がって下がりますが、集合は一つの区間です。'],
          a: { type: 'expr', v: '1-2*asin(y)/pi', vars: ['y'], dom: { y: [0.05, 0.95] }, lhs: ['$m(y) =$', '$m(y) =$'] },
          hint: ['$\\sin(\\pi x) \\ge y$ between the two solutions $x_1 = \\tfrac1\\pi\\arcsin y$ and $1 - x_1$.', '$\\sin(\\pi x) \\ge y$ となるのは二つの解 $x_1 = \\tfrac1\\pi\\arcsin y$ と $1 - x_1$ の間です。'],
          sol: [['By symmetry about $x = \\tfrac12$ the set is $[x_1, 1 - x_1]$ with $x_1 = \\tfrac1\\pi\\arcsin y$.', '$x = \\tfrac12$ についての対称性から、集合は $[x_1, 1 - x_1]$、$x_1 = \\tfrac1\\pi\\arcsin y$ です。'], ['$m(y) = 1 - \\tfrac2\\pi\\arcsin y$. It falls from $1$ to $0$ as $y$ rises, and its integral over $[0, 1]$ is $\\tfrac2\\pi = \\int_0^1 \\sin(\\pi x)\\,dx$.', '$m(y) = 1 - \\tfrac2\\pi\\arcsin y$ です。$y$ が増えると $1$ から $0$ へ減り、$[0, 1]$ での積分は $\\tfrac2\\pi = \\int_0^1 \\sin(\\pi x)\\,dx$ です。']],
        };
      }
      const eps = r.pick([0.05, 0.04, 0.03, 0.025, 0.02, 0.1, 0.0625]);
      let N = Math.floor(1 / (2 * eps)) + 1;
      while (1 / (2 * N) >= eps) N++;
      while (N > 1 && 1 / (2 * (N - 1)) < eps) N--;
      return {
        q: [`For $f(x) = x$ on $[0, 1]$, the Lebesgue lower sum with $n$ levels is $\\tfrac{n-1}{2n}$. What is the least $n$ for which it is within $${n(eps)}$ of $\\int_0^1 f = \\tfrac12$, strictly?`, `$[0, 1]$ 上の $f(x) = x$ の $n$ 段のルベーグ下和は $\\tfrac{n-1}{2n}$ です。$\\int_0^1 f = \\tfrac12$ との差が $${n(eps)}$ より真に小さくなる最小の $n$ を求めてください。`],
        a: { type: 'int', v: N },
        hint: ['The error is $\\tfrac12 - \\tfrac{n-1}{2n} = \\tfrac1{2n}$.', '誤差は $\\tfrac12 - \\tfrac{n-1}{2n} = \\tfrac1{2n}$ です。'],
        sol: [[`The error is $\\tfrac1{2n}$, and $\\tfrac1{2n} < ${n(eps)}$ means $n > ${n(1 / (2 * eps))}$.`, `誤差は $\\tfrac1{2n}$ で、$\\tfrac1{2n} < ${n(eps)}$ は $n > ${n(1 / (2 * eps))}$ と同値です。`], [`The least integer is $n = ${N}$. Each level of height $\\tfrac1n$ wastes a triangle of area $\\tfrac1{2n^2}$, and there are $n$ of them.`, `最小の整数は $n = ${N}$ です。高さ $\\tfrac1n$ の各段で面積 $\\tfrac1{2n^2}$ の三角形が失われ、それが $n$ 個あります。`]],
        set: N <= 24 ? { resolution: N } : undefined,
      };
    },
  ];

  /* ---------- 2. simple functions under sqrt ---------- */
  const sInt = (N) => (N - 1) * (4 * N + 1) / (6 * N * N);
  Q['simple-functions'] = [
    (r) => {
      const form = r.int(0, 1);
      const m = r.int(1, 4), N = 2 ** m;
      if (form === 0) {
        const x = r.pick([0.05, 0.1, 0.2, 0.3, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]);
        const s = Math.floor(N * Math.sqrt(x)) / N;
        return {
          q: [`With $s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$, find $s_{${m}}(${n(x)})$.`, `$s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$ のとき、$s_{${m}}(${n(x)})$ を求めてください。`],
          a: { type: 'num', v: s, tol: 1e-9, show: frac(Math.floor(N * Math.sqrt(x)), N) },
          hint: [`Round $\\sqrt x$ down to a multiple of $1/${N}$.`, `$\\sqrt x$ を $1/${N}$ の倍数に切り下げます。`],
          sol: [[`$\\sqrt{${n(x)}} = ${n(Math.sqrt(x), 4)}$ and $${N}\\sqrt{${n(x)}} = ${n(N * Math.sqrt(x), 4)}$, whose floor is $${Math.floor(N * Math.sqrt(x))}$.`, `$\\sqrt{${n(x)}} = ${n(Math.sqrt(x), 4)}$、$${N}\\sqrt{${n(x)}} = ${n(N * Math.sqrt(x), 4)}$ で、その切り捨ては $${Math.floor(N * Math.sqrt(x))}$ です。`], [`$s_{${m}}(${n(x)}) = ${Math.floor(N * Math.sqrt(x))}/${N} = ${n(s)}$, never above $\\sqrt x$ and within $1/${N}$ of it.`, `$s_{${m}}(${n(x)}) = ${Math.floor(N * Math.sqrt(x))}/${N} = ${n(s)}$ で、$\\sqrt x$ を超えず、差は $1/${N}$ 未満です。`]],
          set: { resolution: m },
        };
      }
      const k = r.int(0, N - 1), len = (2 * k + 1) / (N * N);
      return {
        q: [`How long is the set on which the step of $s_{${m}}$ at height $${frac(k, N)}$ sits? Give $\\lambda\\{x \\in [0, 1] : s_{${m}}(x) = ${frac(k, N)}\\}$.`, `$s_{${m}}$ の高さ $${frac(k, N)}$ の段がのっている集合の長さはいくつですか。$\\lambda\\{x \\in [0, 1] : s_{${m}}(x) = ${frac(k, N)}\\}$ を答えてください。`],
        a: { type: 'num', v: len, show: frac(2 * k + 1, N * N) },
        hint: [`$s_{${m}}(x) = k/${N}$ exactly when $k/${N} \\le \\sqrt x < (k+1)/${N}$.`, `$s_{${m}}(x) = k/${N}$ となるのは $k/${N} \\le \\sqrt x < (k+1)/${N}$ のときです。`],
        sol: [[`Square the band: $x \\in [${k * k}/${N * N},\\ ${(k + 1) ** 2}/${N * N})$.`, `帯を2乗すると $x \\in [${k * k}/${N * N},\\ ${(k + 1) ** 2}/${N * N})$ です。`], [`Its length is $(2k+1)/${N * N} = ${frac(2 * k + 1, N * N)}$: the preimages of equal value bands get longer as $k$ grows, because $\\sqrt x$ flattens.`, `長さは $(2k+1)/${N * N} = ${frac(2 * k + 1, N * N)}$ です。$\\sqrt x$ が平らになるため、等しい幅の値の帯の逆像は $k$ とともに長くなります。`]],
        set: { resolution: m },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const m = r.int(0, 4), N = 2 ** m, I = sInt(N);
        return {
          q: [`Compute $\\int_0^1 s_{${m}}\\,dx$ for $s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$.`, `$s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$ について $\\int_0^1 s_{${m}}\\,dx$ を計算してください。`],
          a: { type: 'num', v: I, show: frac((N - 1) * (4 * N + 1), 6 * N * N) },
          hint: ['A simple function integrates as $\\sum (\\text{value}) \\times (\\text{length of its set})$; the step $k/N$ sits on a set of length $(2k+1)/N^2$.', '単関数の積分は $\\sum (\\text{値}) \\times (\\text{その集合の長さ})$ です。段 $k/N$ は長さ $(2k+1)/N^2$ の集合の上にあります。'],
          sol: [[`With $N = ${N}$: $\\int s_{${m}} = \\sum_{k=0}^{${N - 1}} \\tfrac{k}{${N}}\\cdot\\tfrac{2k+1}{${N * N}}$.`, `$N = ${N}$ として $\\int s_{${m}} = \\sum_{k=0}^{${N - 1}} \\tfrac{k}{${N}}\\cdot\\tfrac{2k+1}{${N * N}}$ です。`], [`Using $\\sum k^2$ and $\\sum k$ this is $\\tfrac{(N-1)(4N+1)}{6N^2} = ${frac((N - 1) * (4 * N + 1), 6 * N * N)} \\approx ${n(I, 5)}$.`, `$\\sum k^2$ と $\\sum k$ を使うと $\\tfrac{(N-1)(4N+1)}{6N^2} = ${frac((N - 1) * (4 * N + 1), 6 * N * N)} \\approx ${n(I, 5)}$ です。`], [`It is below $\\int_0^1\\sqrt x\\,dx = \\tfrac23$ by $${n(2 / 3 - I, 4)}$, because every step lies under the curve.`, `どの段も曲線の下にあるので、$\\int_0^1\\sqrt x\\,dx = \\tfrac23$ より $${n(2 / 3 - I, 4)}$ だけ小さくなります。`]],
          set: { resolution: m },
        };
      }
      const c1 = r.int(1, 5), c2 = r.nz(-3, 4);
      let a1, b1, a2, b2;
      do { a1 = r.step(0, 0.6, 0.1); b1 = a1 + r.step(0.2, 0.6, 0.1); a2 = r.step(0, 0.7, 0.1); b2 = a2 + r.step(0.1, 0.5, 0.1); } while (b1 > 1.0001 || b2 > 1.0001);
      const I = c1 * (b1 - a1) + c2 * (b2 - a2);
      return {
        q: [`Integrate the simple function $s = ${c1}\\cdot\\mathbf 1_{[${n(a1)}, ${n(b1)}]} ${c2 < 0 ? '-' : '+'} ${Math.abs(c2)}\\cdot\\mathbf 1_{[${n(a2)}, ${n(b2)}]}$ over $[0, 1]$.`, `単関数 $s = ${c1}\\cdot\\mathbf 1_{[${n(a1)}, ${n(b1)}]} ${c2 < 0 ? '-' : '+'} ${Math.abs(c2)}\\cdot\\mathbf 1_{[${n(a2)}, ${n(b2)}]}$ を $[0, 1]$ で積分してください。`],
        a: { type: 'num', v: I, tol: 1e-6 },
        hint: ['$\\int \\sum c_i\\mathbf 1_{A_i} = \\sum c_i\\,\\lambda(A_i)$, even when the sets overlap.', '集合が重なっていても $\\int \\sum c_i\\mathbf 1_{A_i} = \\sum c_i\\,\\lambda(A_i)$ です。'],
        sol: [[`$\\lambda([${n(a1)}, ${n(b1)}]) = ${n(b1 - a1)}$ and $\\lambda([${n(a2)}, ${n(b2)}]) = ${n(b2 - a2)}$.`, `$\\lambda([${n(a1)}, ${n(b1)}]) = ${n(b1 - a1)}$、$\\lambda([${n(a2)}, ${n(b2)}]) = ${n(b2 - a2)}$ です。`], [`$\\int s = ${c1}\\cdot ${n(b1 - a1)} ${c2 < 0 ? '-' : '+'} ${Math.abs(c2)}\\cdot ${n(b2 - a2)} = ${n(I)}$. Linearity makes the overlap harmless: on it $s$ simply takes the value $${c1 + c2}$.`, `$\\int s = ${c1}\\cdot ${n(b1 - a1)} ${c2 < 0 ? '-' : '+'} ${Math.abs(c2)}\\cdot ${n(b2 - a2)} = ${n(I)}$ です。線形性により重なりは問題になりません。重なりの上では $s$ は値 $${c1 + c2}$ をとるだけです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['With $N = 2^n$, the integral of $s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$ is $\\tfrac{(N-1)(4N+1)}{6N^2}$. Write the gap $\\tfrac23 - \\int_0^1 s_n$ as a function of $N$.', '$N = 2^n$ とすると、$s_n(x) = 2^{-n}\\lfloor 2^n\\sqrt x\\rfloor$ の積分は $\\tfrac{(N-1)(4N+1)}{6N^2}$ です。差 $\\tfrac23 - \\int_0^1 s_n$ を $N$ の関数として書いてください。'],
          a: { type: 'expr', v: '(3N+1)/(6N^2)', vars: ['N'], dom: { N: [1, 40] }, lhs: ['$\\tfrac23 - \\int s_n =$', '$\\tfrac23 - \\int s_n =$'] },
          hint: ['Put both terms over $6N^2$.', '両方の項を分母 $6N^2$ にそろえます。'],
          sol: [['$\\tfrac23 = \\tfrac{4N^2}{6N^2}$ and $(N-1)(4N+1) = 4N^2 - 3N - 1$.', '$\\tfrac23 = \\tfrac{4N^2}{6N^2}$、$(N-1)(4N+1) = 4N^2 - 3N - 1$ です。'], ['The gap is $\\tfrac{3N+1}{6N^2} \\approx \\tfrac{1}{2N}$: halving the step size halves the error, as for a Riemann sum of a smooth function.', '差は $\\tfrac{3N+1}{6N^2} \\approx \\tfrac{1}{2N}$ です。刻みを半分にすると誤差も半分になり、滑らかな関数のリーマン和と同じ振る舞いです。']],
        };
      }
      if (form === 1) {
        const eps = r.pick([0.1, 0.05, 0.02, 0.01, 0.005, 0.002]);
        let m = 0; while ((3 * 2 ** m + 1) / (6 * 4 ** m) >= eps) m++;
        const N = 2 ** m;
        return {
          q: [`What is the least level $n$ for which $\\tfrac23 - \\int_0^1 s_n < ${n(eps)}$? (The gap is $\\tfrac{3N+1}{6N^2}$ with $N = 2^n$.)`, `$\\tfrac23 - \\int_0^1 s_n < ${n(eps)}$ となる最小のレベル $n$ はいくつですか（差は $N = 2^n$ として $\\tfrac{3N+1}{6N^2}$ です）。`],
          a: { type: 'int', v: m },
          hint: ['The gap is about $\\tfrac1{2N}$; check the candidate and the one before it exactly.', '差はおよそ $\\tfrac1{2N}$ です。候補とその一つ前を正確に確かめます。'],
          sol: [[`$n = ${m}$, $N = ${N}$: gap $= ${frac(3 * N + 1, 6 * N * N)} \\approx ${n((3 * N + 1) / (6 * N * N), 4)} < ${n(eps)}$.`, `$n = ${m}$、$N = ${N}$ では差 $= ${frac(3 * N + 1, 6 * N * N)} \\approx ${n((3 * N + 1) / (6 * N * N), 4)} < ${n(eps)}$ です。`], m > 0 ? [`$n = ${m - 1}$, $N = ${N / 2}$: gap $\\approx ${n((3 * N / 2 + 1) / (6 * N * N / 4), 4)} \\ge ${n(eps)}$, so $${m}$ is the least level. Each level doubles the number of value bands and roughly halves the gap.`, `$n = ${m - 1}$、$N = ${N / 2}$ では差 $\\approx ${n((3 * N / 2 + 1) / (6 * N * N / 4), 4)} \\ge ${n(eps)}$ なので、最小は $${m}$ です。レベルを一つ上げると値の帯が倍になり、差はほぼ半分になります。`] : ['Already $n = 0$ works.', 'すでに $n = 0$ で成り立ちます。']],
          set: m <= 8 ? { resolution: m } : undefined,
        };
      }
      // non-dyadic rounding is not monotone
      const nn = r.int(2, 6), k = r.int(1, nn - 1), y = k / nn;
      // t_n(y) = floor(n y)/n = k/n; t_{n+1}(y) = floor((n+1)k/n)/(n+1)
      const t1 = Math.floor((nn + 1) * y + 1e-12) / (nn + 1);
      const drop = t1 < y - 1e-12;
      return {
        q: [`Round a value down to a multiple of $1/n$ instead: $t_n = \\lfloor n f\\rfloor/n$. At a point where $f = ${frac(k, nn)}$, compare $t_{${nn}}$ and $t_{${nn + 1}}$. Is $(t_n)$ an increasing sequence in general?`, `値を $1/n$ の倍数に切り下げる $t_n = \\lfloor n f\\rfloor/n$ を考えます。$f = ${frac(k, nn)}$ となる点で $t_{${nn}}$ と $t_{${nn + 1}}$ を比べてください。$(t_n)$ は一般に増加列ですか。`],
        a: { type: 'choice', opts: [[`No: here $t_{${nn}} = ${frac(k, nn)}$ but $t_{${nn + 1}} = ${frac(Math.round(t1 * (nn + 1)), nn + 1)}$, which is smaller.`, `いいえ。ここでは $t_{${nn}} = ${frac(k, nn)}$ ですが $t_{${nn + 1}} = ${frac(Math.round(t1 * (nn + 1)), nn + 1)}$ で、小さくなります。`], ['Yes: a finer grid can only move the rounded value up.', 'はい。格子が細かくなれば切り下げた値は上がるだけです。'], ['Yes, as long as $f$ is continuous.', 'はい。$f$ が連続であれば増加します。'], [`No: here $t_{${nn + 1}} > ${frac(k, nn)} = f$, so it overshoots.`, `いいえ。ここでは $t_{${nn + 1}} > ${frac(k, nn)} = f$ となり、超えてしまいます。`]], v: 0 },
        hint: ['The grid of multiples of $1/(n+1)$ does not contain the grid of multiples of $1/n$; the dyadic grids $2^{-n}$ are nested.', '$1/(n+1)$ の倍数の格子は $1/n$ の倍数の格子を含みません。二進の格子 $2^{-n}$ は入れ子になっています。'],
        sol: [[`$t_{${nn}} = \\lfloor ${nn}\\cdot ${frac(k, nn)}\\rfloor/${nn} = ${frac(k, nn)}$, exact. $t_{${nn + 1}} = \\lfloor ${n((nn + 1) * y, 4)}\\rfloor/${nn + 1} = ${frac(Math.round(t1 * (nn + 1)), nn + 1)}$.`, `$t_{${nn}} = \\lfloor ${nn}\\cdot ${frac(k, nn)}\\rfloor/${nn} = ${frac(k, nn)}$ でちょうど一致します。$t_{${nn + 1}} = \\lfloor ${n((nn + 1) * y, 4)}\\rfloor/${nn + 1} = ${frac(Math.round(t1 * (nn + 1)), nn + 1)}$ です。`], [drop ? 'The value went down, so $(t_n)$ is not increasing and the monotone convergence theorem cannot be applied to it directly.' : 'The value went down, so $(t_n)$ is not increasing.', '値が下がったので $(t_n)$ は増加列ではなく、単調収束定理をそのまま使うことはできません。'], ['Refining by halving keeps every old grid point, so $s_{n+1} \\ge s_n$: that nesting is why the lab uses dyadic levels.', '半分ずつ細かくすれば古い格子点がすべて残るので $s_{n+1} \\ge s_n$ となります。この入れ子こそ、実験で二進のレベルを使う理由です。']],
      };
    },
  ];

  /* ---------- 3. a mass that escapes ---------- */
  const H = (m) => { let s = 0; for (let i = 1; i <= m; i++) s += 1 / i; return s; };
  Q.convergence = [
    (r) => {
      const form = r.int(0, 1);
      const N = r.int(1, 40);
      if (form === 0) {
        const x = r.pick([0.03, 0.07, 0.12, 0.18, 0.22, 0.3, 0.45, 0.6, 0.85]);
        const v = x < 1 / N ? N : 0;
        return {
          q: [`With $f_n = n\\,\\mathbf 1_{(0, 1/n)}$, what is $f_{${N}}(${n(x)})$?`, `$f_n = n\\,\\mathbf 1_{(0, 1/n)}$ のとき、$f_{${N}}(${n(x)})$ はいくつですか。`],
          a: { type: 'num', v, tol: 1e-9 },
          hint: [`Is $${n(x)}$ inside $(0, 1/${N})$?`, `$${n(x)}$ は $(0, 1/${N})$ に入っていますか。`],
          sol: [[`$1/${N} = ${n(1 / N, 4)}$, so $${n(x)}$ is ${v ? 'inside' : 'outside'} the spike's base.`, `$1/${N} = ${n(1 / N, 4)}$ なので、$${n(x)}$ は尖りの底辺の${v ? '内側' : '外側'}にあります。`], [`$f_{${N}}(${n(x)}) = ${v}$. ${v ? 'For larger n the spike narrows past this point and the value drops to $0$.' : 'Once the spike has narrowed past a point, the value there stays $0$.'}`, `$f_{${N}}(${n(x)}) = ${v}$ です。${v ? 'n が大きくなると尖りはこの点より細くなり、値は $0$ に落ちます。' : '尖りが一度ある点より細くなると、そこでの値は $0$ のままです。'}`]],
          set: { n: N },
        };
      }
      const c = r.pick([1, 2, 3, 0.5]), pw = r.pick([1, 2, 0.5]);
      const I = c * N ** pw / N;
      const lab = pw === 1 ? 'n' : pw === 2 ? 'n^2' : '\\sqrt n';
      return {
        q: [`Compute $\\int_0^1 g_{${N}}$ for $g_n = ${c === 1 ? '' : n(c)}${lab}\\,\\mathbf 1_{(0, 1/n)}$.`, `$g_n = ${c === 1 ? '' : n(c)}${lab}\\,\\mathbf 1_{(0, 1/n)}$ について $\\int_0^1 g_{${N}}$ を計算してください。`],
        a: { type: 'num', v: I },
        hint: ['Height times width.', '高さ×幅です。'],
        sol: [[`$g_{${N}}$ is a rectangle of height $${n(c * N ** pw, 4)}$ on an interval of length $1/${N}$.`, `$g_{${N}}$ は長さ $1/${N}$ の区間上の高さ $${n(c * N ** pw, 4)}$ の長方形です。`], [`$\\int g_{${N}} = ${n(I, 4)}$. ${pw === 1 ? 'With height $n$ the area stays fixed while the spike narrows.' : pw === 2 ? 'With height $n^2$ the area grows without bound.' : 'With height $\\sqrt n$ the area shrinks to $0$.'}`, `$\\int g_{${N}} = ${n(I, 4)}$ です。${pw === 1 ? '高さ $n$ では尖りが細くなっても面積は一定です。' : pw === 2 ? '高さ $n^2$ では面積は限りなく大きくなります。' : '高さ $\\sqrt n$ では面積は $0$ に縮みます。'}`]],
        set: pw === 1 && c === 1 ? { n: N } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let x; do { x = r.step(0.03, 0.97, 0.01); } while (Math.abs(1 / x - Math.round(1 / x)) < 1e-6);
        const N0 = Math.ceil(1 / x);
        return {
          q: [`For $f_n = n\\,\\mathbf 1_{(0, 1/n)}$ and $x = ${n(x)}$, from which $n$ on is $f_n(x) = 0$?`, `$f_n = n\\,\\mathbf 1_{(0, 1/n)}$、$x = ${n(x)}$ のとき、どの $n$ から先で $f_n(x) = 0$ となりますか。`],
          a: { type: 'int', v: N0 },
          hint: ['$f_n(x) = 0$ exactly when $1/n \\le x$.', '$f_n(x) = 0$ となるのは $1/n \\le x$ のときです。'],
          sol: [[`$1/n \\le ${n(x)}$ means $n \\ge 1/${n(x)} = ${n(1 / x, 4)}$.`, `$1/n \\le ${n(x)}$ は $n \\ge 1/${n(x)} = ${n(1 / x, 4)}$ と同値です。`], [`So $f_n(${n(x)}) = 0$ for all $n \\ge ${N0}$ and the pointwise limit at this $x$ is $0$, although every $\\int f_n$ is $1$. Points nearer $0$ need larger $n$: the convergence is not uniform.`, `したがって $n \\ge ${N0}$ のすべてで $f_n(${n(x)}) = 0$ となり、この $x$ での各点極限は $0$ です。それでも $\\int f_n$ はどれも $1$ です。$0$ に近い点ほど大きな $n$ が必要で、収束は一様ではありません。`]],
          set: N0 <= 40 ? { n: N0 } : undefined,
        };
      }
      if (form === 1) {
        let x; do { x = r.step(0.03, 0.97, 0.01); } while (Math.abs(1 / x - Math.round(1 / x)) < 1e-6);
        const sup = Math.ceil(1 / x) - 1;
        return {
          q: [`Evaluate the envelope $g(x) = \\sup_n f_n(x)$ of $f_n = n\\,\\mathbf 1_{(0, 1/n)}$ at $x = ${n(x)}$.`, `$f_n = n\\,\\mathbf 1_{(0, 1/n)}$ の包絡 $g(x) = \\sup_n f_n(x)$ を $x = ${n(x)}$ で求めてください。`],
          a: { type: 'int', v: sup },
          hint: ['$f_n(x) = n$ for every $n < 1/x$; take the largest such $n$.', '$n < 1/x$ を満たすすべての $n$ で $f_n(x) = n$ です。その最大の $n$ をとります。'],
          sol: [[`$1/${n(x)} = ${n(1 / x, 4)}$, so the spikes covering $x$ are $n = 1, \\dots, ${sup}$.`, `$1/${n(x)} = ${n(1 / x, 4)}$ なので、$x$ を覆う尖りは $n = 1, \\dots, ${sup}$ です。`], [`$g(${n(x)}) = ${sup}$. In general $g(x) = \\lceil 1/x\\rceil - 1 \\approx 1/x$, whose integral over $(0, 1)$ diverges, so no integrable function dominates all $f_n$.`, `$g(${n(x)}) = ${sup}$ です。一般に $g(x) = \\lceil 1/x\\rceil - 1 \\approx 1/x$ で、$(0, 1)$ 上の積分は発散するため、すべての $f_n$ を支配する可積分関数はありません。`]],
          set: { n: Math.min(40, Math.max(1, sup)) },
        };
      }
      const M = r.int(3, 12), I = H(M + 1) - 1;
      return {
        q: [`The envelope $g = \\sup_n n\\,\\mathbf 1_{(0, 1/n)}$ equals $m$ on $(\\tfrac1{m+1}, \\tfrac1m]$. Compute $\\int_{1/${M + 1}}^{1} g\\,dx$.`, `包絡 $g = \\sup_n n\\,\\mathbf 1_{(0, 1/n)}$ は $(\\tfrac1{m+1}, \\tfrac1m]$ 上で $m$ に等しくなります。$\\int_{1/${M + 1}}^{1} g\\,dx$ を計算してください。`],
        a: { type: 'num', v: I },
        hint: ['Each piece contributes $m\\left(\\tfrac1m - \\tfrac1{m+1}\\right) = \\tfrac1{m+1}$.', '各部分の寄与は $m\\left(\\tfrac1m - \\tfrac1{m+1}\\right) = \\tfrac1{m+1}$ です。'],
        sol: [[`$\\int = \\sum_{m=1}^{${M}} m\\left(\\tfrac1m - \\tfrac1{m+1}\\right) = \\sum_{m=1}^{${M}}\\tfrac1{m+1} = \\tfrac12 + \\dots + \\tfrac1{${M + 1}}$.`, `$\\int = \\sum_{m=1}^{${M}} m\\left(\\tfrac1m - \\tfrac1{m+1}\\right) = \\sum_{m=1}^{${M}}\\tfrac1{m+1} = \\tfrac12 + \\dots + \\tfrac1{${M + 1}}$ です。`], [`That is $H_{${M + 1}} - 1 = ${n(I, 4)}$. Harmonic numbers grow like $\\ln M$, so the integral over $(0, 1]$ is infinite.`, `これは $H_{${M + 1}} - 1 = ${n(I, 4)}$ です。調和数は $\\ln M$ のように増えるので、$(0, 1]$ 上の積分は無限大です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([0.5, 0.75, 1, 1.5, 2]);
        const v = a < 1 ? 0 : a === 1 ? 1 : 2;
        const aT = a === 0.5 ? '1/2' : a === 0.75 ? '3/4' : a === 1.5 ? '3/2' : String(a);
        return {
          q: [`Let $f_n = n^{${aT}}\\,\\mathbf 1_{(0, 1/n)}$ on $[0, 1]$. Then $f_n \\to 0$ at every point. What happens to $\\int f_n$?`, `$[0, 1]$ 上で $f_n = n^{${aT}}\\,\\mathbf 1_{(0, 1/n)}$ とします。すべての点で $f_n \\to 0$ です。$\\int f_n$ はどうなりますか。`],
          a: { type: 'choice', opts: [['$\\int f_n \\to 0$, so $f_n \\to 0$ in $L^1$', '$\\int f_n \\to 0$ で、$L^1$ でも $f_n \\to 0$'], ['$\\int f_n = 1$ for every $n$', 'すべての $n$ で $\\int f_n = 1$'], ['$\\int f_n \\to \\infty$', '$\\int f_n \\to \\infty$'], ['$\\int f_n \\to 0$ is forced by pointwise convergence', '各点収束から必ず $\\int f_n \\to 0$']], v, fixed: true },
          hint: ['Height times width: $n^a\\cdot\\tfrac1n$.', '高さ×幅で $n^a\\cdot\\tfrac1n$ です。'],
          sol: [[`$\\int f_n = n^{${aT}}\\cdot\\tfrac1n = n^{${n(a - 1)}}$.`, `$\\int f_n = n^{${aT}}\\cdot\\tfrac1n = n^{${n(a - 1)}}$ です。`], [a < 1 ? 'The exponent is negative, so the integrals tend to $0$: here the limit and the integral can be exchanged (the envelope $\\approx x^{-a}$ is integrable).' : a === 1 ? 'The exponent is $0$: the integral stays $1$ while the limit function is $0$, the case drawn in the lab.' : 'The exponent is positive: the integrals blow up although the functions tend to $0$ pointwise.', a < 1 ? '指数が負なので積分は $0$ に近づきます。この場合は極限と積分を交換できます（包絡 $\\approx x^{-a}$ が可積分です）。' : a === 1 ? '指数は $0$ で、極限関数は $0$ なのに積分は $1$ のままです。実験で描いている場合です。' : '指数が正なので、各点では $0$ に近づくのに積分は発散します。'], ['Pointwise convergence alone says nothing about the integrals; the last option is the classic mistake.', '各点収束だけでは積分について何も言えません。最後の選択肢は典型的な誤りです。']],
          set: a === 1 ? { n: 20 } : undefined,
        };
      }
      if (form === 1) {
        const a = r.pick([0.5, 0.75, 1, 1.5]);
        const aT = a === 0.5 ? '1/2' : a === 0.75 ? '3/4' : a === 1.5 ? '3/2' : '1';
        const ok = a < 1;
        return {
          q: [`Does the dominated convergence theorem apply to $f_n = n^{${aT}}\\,\\mathbf 1_{(0, 1/n)}$ on $[0, 1]$?`, `$[0, 1]$ 上の $f_n = n^{${aT}}\\,\\mathbf 1_{(0, 1/n)}$ に優収束定理は使えますか。`],
          a: { type: 'choice', opts: [[`Yes: $\\sup_n f_n \\le x^{-${aT}}$, which is integrable on $(0, 1)$`, `はい。$\\sup_n f_n \\le x^{-${aT}}$ で、これは $(0, 1)$ 上で可積分です`], [`No: $\\sup_n f_n \\approx x^{-${aT}}$, which is not integrable on $(0, 1)$`, `いいえ。$\\sup_n f_n \\approx x^{-${aT}}$ で、これは $(0, 1)$ 上で可積分ではありません`], ['Yes: each $f_n$ is bounded, so each one is dominated', 'はい。各 $f_n$ は有界なので、それぞれ支配されています'], ['No: the functions are not continuous', 'いいえ。関数が連続ではないからです']], v: ok ? 0 : 1, fixed: true },
          hint: ['The best dominating function is the envelope $\\sup_n f_n$. Is $\\int_0^1 x^{-a}\\,dx$ finite?', '最良の支配関数は包絡 $\\sup_n f_n$ です。$\\int_0^1 x^{-a}\\,dx$ は有限ですか。'],
          sol: [[`At $x$ the spikes with $n < 1/x$ cover it, so $\\sup_n f_n(x)$ is about $(1/x)^{${aT}} = x^{-${aT}}$.`, `点 $x$ を覆うのは $n < 1/x$ の尖りなので、$\\sup_n f_n(x)$ はおよそ $(1/x)^{${aT}} = x^{-${aT}}$ です。`], [`$\\int_0^1 x^{-${aT}}\\,dx$ is ${ok ? `finite, $= ${n(1 / (1 - a))}$` : 'infinite'} because the exponent is ${ok ? 'below' : 'at least'} $1$.`, `指数が $1$ ${ok ? '未満' : '以上'}なので、$\\int_0^1 x^{-${aT}}\\,dx$ は${ok ? `有限で $${n(1 / (1 - a))}$` : '無限大'}です。`], [ok ? 'So DCT applies and $\\int f_n \\to 0$, matching $n^{a-1} \\to 0$.' : 'So no integrable dominating function exists; the theorem says nothing, and indeed $\\int f_n$ does not tend to $0$. One fixed $g$ must work for all $n$ at once.', ok ? 'したがって優収束定理が使え、$\\int f_n \\to 0$ で、$n^{a-1} \\to 0$ と一致します。' : 'したがって可積分な支配関数はなく、定理は何も保証しません。実際 $\\int f_n$ は $0$ に近づきません。一つの固定した $g$ がすべての $n$ に同時に効く必要があります。']],
        };
      }
      const k = r.int(2, 5), j = r.int(0, 2 ** k - 1), N = 2 ** k + j;
      return {
        q: [`The typewriter sequence sets $f_n = \\mathbf 1_{[j/2^k,\\ (j+1)/2^k)}$ for $n = 2^k + j$, $0 \\le j < 2^k$. For $n = ${N}$, $\\int f_n = ${frac(1, 2 ** k)}$. Which statement about the whole sequence is true?`, `タイプライター列は $n = 2^k + j$（$0 \\le j < 2^k$）に対して $f_n = \\mathbf 1_{[j/2^k,\\ (j+1)/2^k)}$ とします。$n = ${N}$ では $\\int f_n = ${frac(1, 2 ** k)}$ です。列全体について正しいのはどれですか。`],
        a: { type: 'choice', opts: [['$f_n \\to 0$ in $L^1$ and in measure, but $f_n(x)$ converges at no point of $[0, 1)$', '$L^1$ でも測度でも $f_n \\to 0$ ですが、$[0, 1)$ のどの点でも $f_n(x)$ は収束しない'], ['$f_n \\to 0$ almost everywhere, because $\\int f_n \\to 0$', '$\\int f_n \\to 0$ なので、ほとんど至るところ $f_n \\to 0$'], ['$f_n$ does not converge in $L^1$, because it never settles down pointwise', '各点で落ち着かないので、$L^1$ でも収束しない'], ['$f_n \\to 0$ uniformly, since the bumps get narrower', '山が細くなるので一様に $f_n \\to 0$']], v: 0 },
        hint: ['Each sweep $k$ covers $[0, 1)$ once with bumps of width $2^{-k}$.', '各周回 $k$ で、幅 $2^{-k}$ の山が $[0, 1)$ を一回ずつ覆います。'],
        sol: [[`$\\int |f_n| = 2^{-k} \\to 0$, so $f_n \\to 0$ in $L^1$, hence in measure.`, `$\\int |f_n| = 2^{-k} \\to 0$ なので $L^1$ で $f_n \\to 0$、したがって測度収束もします。`], ['But every sweep passes over every $x$, so $f_n(x) = 1$ infinitely often and $= 0$ infinitely often: no pointwise limit anywhere.', 'しかし各周回はすべての $x$ を通るので、$f_n(x)$ は無限回 $1$、無限回 $0$ となり、どの点でも各点極限はありません。'], ['The lab\'s spike is the mirror image: pointwise convergence without $L^1$ convergence. Neither mode implies the other (though $L^1$ convergence gives an a.e. convergent subsequence).', '実験の尖りはその鏡像で、$L^1$ 収束なしの各点収束です。どちらの収束も他方を導きません（ただし $L^1$ 収束からは、ほとんど至るところ収束する部分列が取れます）。']],
      };
    },
  ];
})();
