'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const YN = (en, ja) => [en, ja];
  const RULE = { 0: ['left-endpoint', '左端点'], 0.5: ['midpoint', '中点'], 1: ['right-endpoint', '右端点'] };
  const sq = (x) => x * x, tent = (x) => 1 - Math.abs(2 * x - 1);
  const rsum = (f, N, s) => { let t = 0; for (let k = 0; k < N; k++) t += f((k + s) / N) / N; return t; };
  // exact rational value of the x^2 Riemann sums, as [p, q]
  const sqExact = (N, s) => (s === 0 ? [(N - 1) * (2 * N - 1), 6 * N * N] : s === 1 ? [(N + 1) * (2 * N + 1), 6 * N * N] : [4 * N * N - 1, 12 * N * N]);

  /* ---------- 1. Riemann sums ---------- */
  Q['lebesgue-vs-riemann-sums'] = [
    (r) => {
      if (r.chance(0.65)) {
        const L = r.pick([1, 2, 3, 4]), N = 2 ** L, s = r.pick([0, 0.5, 1]);
        const [p, q] = sqExact(N, s), v = rsum(sq, N, s);
        return {
          q: [`Take $f(x) = x^2$ on $[0, 1]$ with ${N} equal intervals. What is the ${RULE[s][0]} Riemann sum?`, `$[0, 1]$ 上の $f(x) = x^2$ を ${N} 等分します。${RULE[s][1]}のリーマン和はいくらですか。`],
          a: { type: 'num', v, show: frac(p, q) },
          hint: ['Each interval has width $1/N$; evaluate $f$ at the sample point of each one and add up height times width.', '各区間の幅は $1/N$ です。各区間の標本点で $f$ を計算し、高さ×幅を足します。'],
          sol: [[`The sample points are $(k + ${s})/${N}$ for $k = 0, \\ldots, ${N - 1}$, and each width is $1/${N}$.`, `標本点は $k = 0, \\ldots, ${N - 1}$ に対して $(k + ${s})/${N}$、幅はどれも $1/${N}$ です。`], [`$S = \\frac{1}{${N}}\\sum_k \\left(\\frac{k + ${s}}{${N}}\\right)^2 = ${frac(p, q)} \\approx ${n(v, 5)}$.`, `$S = \\frac{1}{${N}}\\sum_k \\left(\\frac{k + ${s}}{${N}}\\right)^2 = ${frac(p, q)} \\approx ${n(v, 5)}$ です。`], [`The exact integral is $1/3$, so the sum is ${v < 1 / 3 ? 'below' : 'above'} it by $${n(Math.abs(1 / 3 - v), 5)}$.`, `厳密な積分は $1/3$ なので、この和はそれより $${n(Math.abs(1 / 3 - v), 5)}$ だけ${v < 1 / 3 ? '小さい' : '大きい'}値です。`]],
          set: { function: 'square', level: L, sample: String(s) },
        };
      }
      const N = r.int(3, 9), k = r.int(1, N), s = r.pick([0, 0.5, 1]);
      const xi = (k - 1 + s) / N;
      return {
        q: [`The interval $[0, 1]$ is cut into ${N} equal pieces. Where is the ${RULE[s][0]} sample point of piece number ${k}? (Pieces are numbered from 1 at the left.)`, `区間 $[0, 1]$ を ${N} 等分します。${k} 番目の小区間（左端が 1 番）の${RULE[s][1]}の標本点はどこですか。`],
        a: { type: 'num', v: xi, show: frac(Math.round((k - 1 + s) * 2), 2 * N) },
        hint: ['Piece $k$ is $[(k - 1)/N, k/N]$.', '$k$ 番目の小区間は $[(k - 1)/N, k/N]$ です。'],
        sol: [[`Piece ${k} is $[${frac(k - 1, N)}, ${frac(k, N)}]$.`, `${k} 番目の小区間は $[${frac(k - 1, N)}, ${frac(k, N)}]$ です。`], [`Its ${RULE[s][0]} point is $${frac(Math.round((k - 1 + s) * 2), 2 * N)} = ${n(xi, 5)}$.`, `その${RULE[s][1]}は $${frac(Math.round((k - 1 + s) * 2), 2 * N)} = ${n(xi, 5)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.int(1, 5), N = 2 ** L;
        return {
          q: [`For $f(x) = x^2$ on $[0, 1]$, the midpoint sum with $N = ${N}$ intervals misses the exact value $1/3$ by how much? Give the absolute error.`, `$[0, 1]$ 上の $f(x) = x^2$ について、$N = ${N}$ 区間の中点和は厳密値 $1/3$ からどれだけずれますか。絶対誤差を答えてください。`],
          a: { type: 'num', v: 1 / (12 * N * N), show: frac(1, 12 * N * N) },
          hint: ['The midpoint sum has a closed form: $(4N^2 - 1)/(12N^2)$.', '中点和には閉じた式 $(4N^2 - 1)/(12N^2)$ があります。'],
          sol: [[`$S = \\dfrac{4N^2 - 1}{12N^2} = \\dfrac13 - \\dfrac{1}{12N^2}$ with $N = ${N}$.`, `$N = ${N}$ のとき $S = \\dfrac{4N^2 - 1}{12N^2} = \\dfrac13 - \\dfrac{1}{12N^2}$ です。`], [`The error is $\\dfrac{1}{12N^2} = ${frac(1, 12 * N * N)}$.`, `誤差は $\\dfrac{1}{12N^2} = ${frac(1, 12 * N * N)}$ です。`], ['Doubling $N$ divides the error by four: the midpoint rule is second order, much better than endpoint rules.', '$N$ を 2 倍にすると誤差は 4 分の 1 になります。中点則は 2 次の精度で、端点則よりずっと優れています。']],
          set: { function: 'square', level: L, sample: '0.5' },
        };
      }
      if (form === 1) {
        const L = r.int(1, 5), N = 2 ** L, s = r.pick([0, 1]);
        const v = Math.abs(1 / 3 - rsum(sq, N, s));
        return {
          q: [`For $f(x) = x^2$ on $[0, 1]$, how far is the ${RULE[s][0]} Riemann sum with $N = ${N}$ intervals from $1/3$?`, `$[0, 1]$ 上の $f(x) = x^2$ について、$N = ${N}$ 区間の${RULE[s][1]}リーマン和は $1/3$ からどれだけ離れていますか。`],
          a: { type: 'num', v, rel: 0.01 },
          hint: [s === 0 ? 'The left sum equals $(N - 1)(2N - 1)/(6N^2)$.' : 'The right sum equals $(N + 1)(2N + 1)/(6N^2)$.', s === 0 ? '左端点和は $(N - 1)(2N - 1)/(6N^2)$ に等しくなります。' : '右端点和は $(N + 1)(2N + 1)/(6N^2)$ に等しくなります。'],
          sol: [[`The ${RULE[s][0]} sum is $${frac(...sqExact(N, s))}$.`, `${RULE[s][1]}和は $${frac(...sqExact(N, s))}$ です。`], [`Subtracting from $1/3$: $|S - 1/3| = ${n(v, 5)}$, which is about $1/(2N) = ${n(1 / (2 * N), 5)}$.`, `$1/3$ との差は $|S - 1/3| = ${n(v, 5)}$ で、およそ $1/(2N) = ${n(1 / (2 * N), 5)}$ です。`], ['Since $x^2$ is increasing, the left sum underestimates while the right sum overestimates; the error only shrinks like $1/N$.', `$x^2$ は増加関数なので、左端点和は過小評価、右端点和は過大評価になります。誤差は $1/N$ の速さでしか縮みません。`]],
          set: { function: 'square', level: L, sample: String(s) },
        };
      }
      const cases = [
        { f: 'x^2', s: 0, k: 0, w: ['$x^2$ is increasing, so on each piece the left value is the smallest', '$x^2$ は増加関数なので、各区間で左端の値が最小'] },
        { f: 'x^2', s: 1, k: 1, w: ['$x^2$ is increasing, so on each piece the right value is the largest', '$x^2$ は増加関数なので、各区間で右端の値が最大'] },
        { f: '1 - x^2', s: 0, k: 1, w: ['$1 - x^2$ is decreasing, so on each piece the left value is the largest', '$1 - x^2$ は減少関数なので、各区間で左端の値が最大'] },
        { f: '1 - x^2', s: 1, k: 0, w: ['$1 - x^2$ is decreasing, so on each piece the right value is the smallest', '$1 - x^2$ は減少関数なので、各区間で右端の値が最小'] },
        { f: 'e^{x}', s: 0, k: 0, w: ['$e^x$ is increasing', '$e^x$ は増加関数'] },
        { f: 'e^{-x}', s: 0, k: 1, w: ['$e^{-x}$ is decreasing', '$e^{-x}$ は減少関数'] },
      ];
      const c = r.pick(cases);
      return {
        q: [`On $[0, 1]$ the ${RULE[c.s][0]} Riemann sum of $f(x) = ${c.f}$ is computed with any number of equal intervals. Compared with the exact integral, it is...`, `$[0, 1]$ 上で、$f(x) = ${c.f}$ の${RULE[c.s][1]}リーマン和を（任意の等分数で）計算します。厳密な積分と比べて、その和は...`],
        a: { type: 'choice', opts: [YN('too small (an underestimate)', '小さすぎる（過小評価）'), YN('too large (an overestimate)', '大きすぎる（過大評価）')], v: c.k, fixed: true },
        hint: ['Compare each sample height with the other heights on the same piece.', '各区間で、標本点の高さをその区間の他の高さと比べます。'],
        sol: [[`${c.w[0][0].toUpperCase() + c.w[0].slice(1)}.`, `${c.w[1]}です。`], [`So the ${RULE[c.s][0]} sum is ${c.k === 0 ? 'always below' : 'always above'} the area under the curve.`, `したがって${RULE[c.s][1]}和は、曲線の下の面積より常に${c.k === 0 ? '小さく' : '大きく'}なります。`], ['For a monotone function the endpoint sums trap the integral between them, as the lab shows for the parabola.', '単調な関数では、二つの端点和が積分を挟みます。放物線の実験で見たとおりです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.pick([0, 0.5, 1]);
        const e = kind === 0 ? '(N-1)*(2*N-1)/(6*N^2)' : kind === 1 ? '(N+1)*(2*N+1)/(6*N^2)' : '(4*N^2-1)/(12*N^2)';
        return {
          q: [`Write the ${RULE[kind][0]} Riemann sum of $f(x) = x^2$ on $[0, 1]$ with $N$ equal intervals as a formula in $N$. (Use $\\sum_{k=1}^{N} k^2 = N(N + 1)(2N + 1)/6$.)`, `$[0, 1]$ 上の $f(x) = x^2$ の、$N$ 等分の${RULE[kind][1]}リーマン和を $N$ の式で表してください（$\\sum_{k=1}^{N} k^2 = N(N + 1)(2N + 1)/6$ を使って構いません）。`],
          a: { type: 'expr', v: e, vars: ['N'], dom: { N: [1.5, 6] }, lhs: ['$S_N =$', '$S_N =$'] },
          hint: [kind === 0 ? 'The left points are $k/N$ for $k = 0, \\ldots, N - 1$.' : kind === 1 ? 'The right points are $k/N$ for $k = 1, \\ldots, N$.' : 'The midpoints are $(2k - 1)/(2N)$ for $k = 1, \\ldots, N$, and $\\sum (2k - 1)^2 = N(4N^2 - 1)/3$.', kind === 0 ? '左端点は $k = 0, \\ldots, N - 1$ に対して $k/N$ です。' : kind === 1 ? '右端点は $k = 1, \\ldots, N$ に対して $k/N$ です。' : '中点は $k = 1, \\ldots, N$ に対して $(2k - 1)/(2N)$ で、$\\sum (2k - 1)^2 = N(4N^2 - 1)/3$ です。'],
          sol: [[kind === 0 ? '$S_N = \\frac{1}{N^3}\\sum_{k=0}^{N-1} k^2 = \\frac{(N - 1)N(2N - 1)}{6N^3}$.' : kind === 1 ? '$S_N = \\frac{1}{N^3}\\sum_{k=1}^{N} k^2 = \\frac{N(N + 1)(2N + 1)}{6N^3}$.' : '$S_N = \\frac{1}{4N^3}\\sum_{k=1}^{N}(2k - 1)^2 = \\frac{N(4N^2 - 1)}{12N^3}$.', kind === 0 ? '$S_N = \\frac{1}{N^3}\\sum_{k=0}^{N-1} k^2 = \\frac{(N - 1)N(2N - 1)}{6N^3}$ です。' : kind === 1 ? '$S_N = \\frac{1}{N^3}\\sum_{k=1}^{N} k^2 = \\frac{N(N + 1)(2N + 1)}{6N^3}$ です。' : '$S_N = \\frac{1}{4N^3}\\sum_{k=1}^{N}(2k - 1)^2 = \\frac{N(4N^2 - 1)}{12N^3}$ です。'], [`Simplifying gives $S_N = ${kind === 0 ? '\\frac{(N - 1)(2N - 1)}{6N^2}' : kind === 1 ? '\\frac{(N + 1)(2N + 1)}{6N^2}' : '\\frac{4N^2 - 1}{12N^2}'}$, and all three tend to $1/3$ as $N \\to \\infty$.`, `整理すると $S_N = ${kind === 0 ? '\\frac{(N - 1)(2N - 1)}{6N^2}' : kind === 1 ? '\\frac{(N + 1)(2N + 1)}{6N^2}' : '\\frac{4N^2 - 1}{12N^2}'}$ で、三つとも $N \\to \\infty$ で $1/3$ に収束します。`]],
        };
      }
      if (form === 1) {
        const eps = r.pick([0.1, 0.05, 0.02, 0.01, 0.005, 0.001]);
        let N = 1; while (1 / (2 * N) - 1 / (6 * N * N) >= eps) N++;
        return {
          q: [`The left Riemann sum of $x^2$ on $[0, 1]$ has error $\\dfrac{1}{2N} - \\dfrac{1}{6N^2}$ with $N$ equal intervals. What is the smallest $N$ with error below ${n(eps)}?`, `$[0, 1]$ 上の $x^2$ の、$N$ 等分の左端点リーマン和の誤差は $\\dfrac{1}{2N} - \\dfrac{1}{6N^2}$ です。誤差が ${n(eps)} 未満になる最小の $N$ を求めてください。`],
          a: { type: 'int', v: N },
          hint: ['The error is about $1/(2N)$; test the integers near $1/(2\\varepsilon)$.', '誤差はおよそ $1/(2N)$ です。$1/(2\\varepsilon)$ の近くの整数を調べます。'],
          sol: [[`At $N = ${N - 1}$ the error is $${n(1 / (2 * (N - 1)) - 1 / (6 * (N - 1) ** 2), 5)}$${N > 1 ? ` $\\ge ${n(eps)}$` : ''}.`.replace('$$', '$'), `$N = ${N - 1}$ では誤差は $${n(N > 1 ? 1 / (2 * (N - 1)) - 1 / (6 * (N - 1) ** 2) : 0, 5)}$ で、$${n(eps)}$ 以上です。`], [`At $N = ${N}$ it is $${n(1 / (2 * N) - 1 / (6 * N * N), 5)} < ${n(eps)}$, so $N = ${N}$.`, `$N = ${N}$ では $${n(1 / (2 * N) - 1 / (6 * N * N), 5)} < ${n(eps)}$ なので $N = ${N}$ です。`], ['Endpoint sums converge only like $1/N$, so each extra digit costs ten times as many intervals.', '端点和は $1/N$ の速さでしか収束しないので、桁を一つ増やすごとに区間数は 10 倍必要です。']],
        };
      }
      const m = r.int(1, 8), N = 2 * m + 1, v = rsum(tent, N, 0.5);
      return {
        q: [`The tent $f(x) = 1 - |2x - 1|$ on $[0, 1]$ has exact integral $1/2$. What is its midpoint Riemann sum with $N = ${N}$ equal intervals? Give five decimals.`, `$[0, 1]$ 上のテント関数 $f(x) = 1 - |2x - 1|$ の厳密な積分は $1/2$ です。$N = ${N}$ 等分の中点リーマン和を小数第5位まで求めてください。`],
        a: { type: 'num', v, tol: 6e-6, show: frac(N * N + 1, 2 * N * N) },
        hint: ['Midpoint sums are exact on any piece where $f$ is linear. Which piece contains the peak?', '中点和は $f$ が線形な区間では正確です。頂点を含む区間はどれでしょうか。'],
        sol: [[`With $N$ odd, the middle piece is centered on $x = 1/2$, so the midpoint rule samples the peak $f = 1$ across width $1/${N}$.`, `$N$ が奇数のとき中央の区間は $x = 1/2$ を中心とするので、中点則は幅 $1/${N}$ にわたって頂点の値 $f = 1$ を使います。`], [`The true area of that piece is $\\frac{1}{${N}}\\left(1 - \\frac{1}{${2 * N}}\\right)$, so the sum overshoots by $\\frac{1}{2N^2} = ${n(1 / (2 * N * N), 6)}$.`, `その区間の真の面積は $\\frac{1}{${N}}\\left(1 - \\frac{1}{${2 * N}}\\right)$ なので、和は $\\frac{1}{2N^2} = ${n(1 / (2 * N * N), 6)}$ だけ過大です。`], [`Total: $\\frac12 + \\frac{1}{2N^2} = ${n(v, 6)}$. For even $N$ the peak falls on a cut and the sum is exactly $\\frac12$.`, `合計は $\\frac12 + \\frac{1}{2N^2} = ${n(v, 6)}$ です。$N$ が偶数なら頂点が分割点に当たり、和はちょうど $\\frac12$ になります。`]],
      };
    },
  ];

  /* ---------- 2. Lebesgue value bands ---------- */
  const lowerSq = (N) => { let t = 0; for (let k = 0; k < N; k++) t += (k / N) * (Math.sqrt((k + 1) / N) - Math.sqrt(k / N)); return t; };
  Q['lebesgue-vs-riemann-bands'] = [
    (r) => {
      const N = r.pick([4, 5, 8, 10]), k = r.int(0, N - 1), isTent = r.chance(0.4);
      const a = k / N, b = (k + 1) / N;
      if (r.chance(0.5)) {
        const m = isTent ? b - a : Math.sqrt(b) - Math.sqrt(a);
        return {
          q: [`Cut the value range $[0, 1]$ into ${N} equal bands and take band number ${k + 1}, $[${frac(k, N)}, ${frac(k + 1, N)})$. For $f(x) = ${isTent ? '1 - |2x - 1|' : 'x^2'}$ on $[0, 1]$, what is the Lebesgue measure of $\\{x : f(x) \\text{ lies in the band}\\}$?`, `値域 $[0, 1]$ を ${N} 等分し、${k + 1} 番目の帯 $[${frac(k, N)}, ${frac(k + 1, N)})$ を取ります。$[0, 1]$ 上の $f(x) = ${isTent ? '1 - |2x - 1|' : 'x^2'}$ について、$f(x)$ がその帯に入る $x$ の集合のルベーグ測度はいくらですか。`],
          a: { type: 'num', v: m, tol: 5e-4 },
          hint: [isTent ? 'The tent is made of two lines of slope $\\pm 2$; invert each.' : 'Solve $x^2 = a$ and $x^2 = b$ for $x \\ge 0$.', isTent ? 'テントは傾き $\\pm 2$ の二本の直線でできています。それぞれの逆を取ります。' : '$x \\ge 0$ で $x^2 = a$ と $x^2 = b$ を解きます。'],
          sol: isTent ? [[`On each side, a rise of $${n(b - a)}$ in height takes a run of $${n((b - a) / 2)}$ in $x$.`, `片側では、高さが $${n(b - a)}$ 増えるのに $x$ は $${n((b - a) / 2)}$ 進みます。`], [`Two sides give the preimage total $${n(b - a, 4)}$, exactly the band width: the tent spreads its values uniformly.`, `両側を合わせた逆像の測度は $${n(b - a, 4)}$ で、帯の幅にちょうど等しくなります。テントは値を一様にばらまいています。`]] : [[`$x^2 \\in [${n(a)}, ${n(b)})$ means $x \\in [\\sqrt{${n(a)}}, \\sqrt{${n(b)}})$.`, `$x^2 \\in [${n(a)}, ${n(b)})$ は $x \\in [\\sqrt{${n(a)}}, \\sqrt{${n(b)}})$ と同じです。`], [`The length is $\\sqrt{${n(b)}} - \\sqrt{${n(a)}} = ${n(m, 4)}$.`, `長さは $\\sqrt{${n(b)}} - \\sqrt{${n(a)}} = ${n(m, 4)}$ です。`], ['Low bands of the parabola have long preimages, high bands short ones: the curve is flat near the bottom.', '放物線では低い帯の逆像が長く、高い帯は短くなります。曲線が底の近くで平らだからです。']],
        };
      }
      const m = Math.sqrt(b) - Math.sqrt(a), c = a * m;
      return {
        q: [`For $f(x) = x^2$ on $[0, 1]$ with ${N} value bands, band number ${k + 1} is $[${frac(k, N)}, ${frac(k + 1, N)})$. The simple function rounds $f$ down to the band's lower value. What does this band contribute to $\\int s\\,d\\mu$ (lower value times measure)? Give four decimals.`, `$[0, 1]$ 上の $f(x) = x^2$ を ${N} 本の値の帯で近似します。${k + 1} 番目の帯は $[${frac(k, N)}, ${frac(k + 1, N)})$ で、単関数は $f$ を帯の下端の値に切り下げます。この帯が $\\int s\\,d\\mu$ に寄与する量（下端の値×測度）を小数第4位まで求めてください。`],
        a: { type: 'num', v: c, tol: 6e-5 },
        hint: ['The preimage of the band is $[\\sqrt{a}, \\sqrt{b})$.', '帯の逆像は $[\\sqrt{a}, \\sqrt{b})$ です。'],
        sol: [[`The preimage has length $\\sqrt{${n(b)}} - \\sqrt{${n(a)}} = ${n(m, 5)}$.`, `逆像の長さは $\\sqrt{${n(b)}} - \\sqrt{${n(a)}} = ${n(m, 5)}$ です。`], [`The contribution is $${n(a)} \\times ${n(m, 5)} = ${n(c, 5)}$.`, `寄与は $${n(a)} \\times ${n(m, 5)} = ${n(c, 5)}$ です。`], ['Summing over all bands gives the lower sum that sits within $1/N$ of the integral.', 'すべての帯を足すと下からの和になり、積分との差は $1/N$ 以内です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(2, 24);
        return {
          q: [`For the tent $f(x) = 1 - |2x - 1|$ on $[0, 1]$ with ${N} equal value bands, what is the simple-function lower sum $\\sum_k a_k\\,\\mu(E_k)$, where $a_k = k/${N}$ for $k = 0, \\ldots, ${N - 1}$?`, `$[0, 1]$ 上のテント関数 $f(x) = 1 - |2x - 1|$ を ${N} 本の値の帯で近似します。$a_k = k/${N}$（$k = 0, \\ldots, ${N - 1}$）として、単関数の下からの和 $\\sum_k a_k\\,\\mu(E_k)$ を求めてください。`],
          a: { type: 'num', v: (N - 1) / (2 * N), show: frac(N - 1, 2 * N) },
          hint: ['Each band has preimage measure $1/N$ for the tent.', 'テントでは、どの帯の逆像の測度も $1/N$ です。'],
          sol: [[`Each $\\mu(E_k) = 1/${N}$, so the sum is $\\frac{1}{${N}}\\sum_{k=0}^{${N - 1}}\\frac{k}{${N}} = \\frac{1}{${N * N}}\\cdot\\frac{${N - 1}\\cdot ${N}}{2}$.`, `どの $\\mu(E_k)$ も $1/${N}$ なので、和は $\\frac{1}{${N}}\\sum_{k=0}^{${N - 1}}\\frac{k}{${N}} = \\frac{1}{${N * N}}\\cdot\\frac{${N - 1}\\cdot ${N}}{2}$ です。`], [`That equals $${frac(N - 1, 2 * N)}$, which is $\\frac12 - \\frac{1}{${2 * N}}$.`, `これは $${frac(N - 1, 2 * N)}$、つまり $\\frac12 - \\frac{1}{${2 * N}}$ です。`], ['The true integral is $1/2$, and the shortfall $1/(2N)$ stays within the guaranteed bound $1/N$.', '真の積分は $1/2$ で、不足分 $1/(2N)$ は保証された上限 $1/N$ の範囲内です。']],
        };
      }
      if (form === 1) {
        const N = r.pick([2, 3, 4, 5, 6, 8]), v = lowerSq(N);
        return {
          q: [`For $f(x) = x^2$ on $[0, 1]$ with ${N} equal value bands, compute the lower sum $\\sum_k \\frac{k}{${N}}\\left(\\sqrt{\\tfrac{k+1}{${N}}} - \\sqrt{\\tfrac{k}{${N}}}\\right)$. Give four decimals.`, `$[0, 1]$ 上の $f(x) = x^2$ を ${N} 本の値の帯で近似し、下からの和 $\\sum_k \\frac{k}{${N}}\\left(\\sqrt{\\tfrac{k+1}{${N}}} - \\sqrt{\\tfrac{k}{${N}}}\\right)$ を求めてください（小数第4位まで）。`],
          a: { type: 'num', v, tol: 6e-5 },
          hint: ['Compute each term for $k = 0, \\ldots, N - 1$ and add; the $k = 0$ term is zero.', '$k = 0, \\ldots, N - 1$ の各項を計算して足します。$k = 0$ の項は 0 です。'],
          sol: [[`Terms: ${Array.from({ length: N }, (_, k) => n((k / N) * (Math.sqrt((k + 1) / N) - Math.sqrt(k / N)), 4)).join(', ')}.`.replace(/\.$/, '') + '.', `各項は ${Array.from({ length: N }, (_, k) => n((k / N) * (Math.sqrt((k + 1) / N) - Math.sqrt(k / N)), 4)).join('、')} です。`], [`Their sum is ${n(v, 5)}, below $1/3 \\approx 0.33333$ by ${n(1 / 3 - v, 5)}.`, `和は ${n(v, 5)} で、$1/3 \\approx 0.33333$ より ${n(1 / 3 - v, 5)} だけ小さい値です。`], [`The guarantee $0 \\le \\int f - \\int s \\le 1/${N} = ${n(1 / N, 4)}$ holds.`, `保証 $0 \\le \\int f - \\int s \\le 1/${N} = ${n(1 / N, 4)}$ が成り立っています。`]],
        };
      }
      const eps = r.pick([0.2, 0.1, 0.05, 0.02, 0.01, 0.004]);
      const N = Math.ceil(1 / eps - 1e-9);
      return {
        q: [`A simple function $s$ takes the lower value of each of $N$ equal value bands, so $0 \\le f - s \\le 1/N$ on $[0, 1]$. What is the smallest $N$ that guarantees $\\int f\\,d\\mu - \\int s\\,d\\mu \\le ${n(eps)}$?`, `単関数 $s$ は $N$ 等分した値の帯の下端の値をとり、$[0, 1]$ 上で $0 \\le f - s \\le 1/N$ を満たします。$\\int f\\,d\\mu - \\int s\\,d\\mu \\le ${n(eps)}$ を保証する最小の $N$ を求めてください。`],
        a: { type: 'int', v: N },
        hint: ['Integrate the bound $f - s \\le 1/N$ over a domain of measure 1.', '不等式 $f - s \\le 1/N$ を測度 1 の領域で積分します。'],
        sol: [['Integrating over $[0, 1]$ gives $\\int f - \\int s \\le 1/N$.', '$[0, 1]$ で積分すると $\\int f - \\int s \\le 1/N$ です。'], [`We need $1/N \\le ${n(eps)}$, so $N \\ge ${n(1 / eps)}$ and the smallest integer is ${N}.`, `$1/N \\le ${n(eps)}$ が必要なので $N \\ge ${n(1 / eps)}$、最小の整数は ${N} です。`], ['This certificate works for every $f$ with $0 \\le f \\le 1$, with no need to know where the preimages are.', 'この保証は $0 \\le f \\le 1$ を満たすどの $f$ にも使え、逆像がどこにあるかを知る必要がありません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: [`By the layer-cake identity $\\int f\\,d\\mu = \\int_0^\\infty \\mu\\{f > t\\}\\,dt$, find $\\int_0^1 x^p\\,dx$ as a function of $p > 0$, using $\\mu\\{x^p > t\\} = 1 - t^{1/p}$ for $0 \\le t \\le 1$.`, `レイヤーケーキの等式 $\\int f\\,d\\mu = \\int_0^\\infty \\mu\\{f > t\\}\\,dt$ を使い、$0 \\le t \\le 1$ で $\\mu\\{x^p > t\\} = 1 - t^{1/p}$ であることから、$\\int_0^1 x^p\\,dx$ を $p > 0$ の式で求めてください。`],
          a: { type: 'expr', v: '1/(p+1)', vars: ['p'], dom: { p: [0.4, 3] }, lhs: ['$\\int_0^1 x^p\\,dx =$', '$\\int_0^1 x^p\\,dx =$'] },
          hint: ['Integrate $1 - t^{1/p}$ over $t \\in [0, 1]$; the power rule gives $\\int_0^1 t^{1/p}\\,dt = \\dfrac{1}{1/p + 1}$.', '$t \\in [0, 1]$ で $1 - t^{1/p}$ を積分します。べき乗の公式より $\\int_0^1 t^{1/p}\\,dt = \\dfrac{1}{1/p + 1}$ です。'],
          sol: [['$\\int_0^1 (1 - t^{1/p})\\,dt = 1 - \\dfrac{p}{p + 1}$.', '$\\int_0^1 (1 - t^{1/p})\\,dt = 1 - \\dfrac{p}{p + 1}$ です。'], ['This equals $\\dfrac{1}{p + 1}$, the same value as the Riemann integral $\\int_0^1 x^p\\,dx$.', 'これは $\\dfrac{1}{p + 1}$ で、リーマン積分 $\\int_0^1 x^p\\,dx$ と同じ値です。'], ['Slicing horizontally instead of vertically gives the same area, which is the layer-cake picture in the lab.', '縦ではなく横にスライスしても面積は同じです。これが実験のレイヤーケーキの見方です。']],
        };
      }
      if (form === 1) {
        const target = r.pick([[0.45, 10], [0.4, 5], [0.4375, 8], [0.475, 20], [0.25, 2], [1 / 3, 3]]);
        const [L, N] = target;
        return {
          q: [`The lower sum of the tent $1 - |2x - 1|$ with $N$ equal value bands is $\\dfrac{N - 1}{2N}$. For which $N$ is it equal to ${n(L)}?`, `テント関数 $1 - |2x - 1|$ を $N$ 本の値の帯で近似した下からの和は $\\dfrac{N - 1}{2N}$ です。これが ${n(L)} になる $N$ はいくつですか。`],
          a: { type: 'int', v: N },
          hint: ['Solve $(N - 1)/(2N) = L$ for $N$.', '$(N - 1)/(2N) = L$ を $N$ について解きます。'],
          sol: [[`$(N - 1)/(2N) = ${n(L)}$ gives $N - 1 = ${n(2 * L)}N$, so $N(1 - ${n(2 * L)}) = 1$.`, `$(N - 1)/(2N) = ${n(L)}$ より $N - 1 = ${n(2 * L)}N$、つまり $N(1 - ${n(2 * L)}) = 1$ です。`], [`Hence $N = 1/${n(1 - 2 * L)} = ${N}$.`, `したがって $N = 1/${n(1 - 2 * L)} = ${N}$ です。`], [`The shortfall from $1/2$ is $1/(2N) = ${n(0.5 - L)}$.`, `$1/2$ との不足分は $1/(2N) = ${n(0.5 - L)}$ です。`]],
        };
      }
      const p = r.pick([2, 3, 4, 0.5]), a = r.pick([0.1, 0.2, 0.25, 0.3, 0.4]), b = a + r.pick([0.1, 0.2, 0.3]);
      const m = b ** (1 / p) - a ** (1 / p);
      return {
        q: [`For $f(x) = x^{${n(p)}}$ on $[0, 1]$, what is the Lebesgue measure of $\\{x : ${n(a)} \\le f(x) < ${n(b)}\\}$? Give four decimals.`, `$[0, 1]$ 上の $f(x) = x^{${n(p)}}$ について、集合 $\\{x : ${n(a)} \\le f(x) < ${n(b)}\\}$ のルベーグ測度を小数第4位まで求めてください。`],
        a: { type: 'num', v: m, tol: 6e-5 },
        hint: ['Since $f$ is increasing, the set is an interval; invert $f$ at both ends.', '$f$ は増加関数なので、この集合は区間です。両端で $f$ の逆関数を取ります。'],
        sol: [[`$x^{${n(p)}} \\ge ${n(a)}$ means $x \\ge ${n(a)}^{1/${n(p)}} = ${n(a ** (1 / p), 5)}$, and $x^{${n(p)}} < ${n(b)}$ means $x < ${n(b ** (1 / p), 5)}$.`, `$x^{${n(p)}} \\ge ${n(a)}$ は $x \\ge ${n(a)}^{1/${n(p)}} = ${n(a ** (1 / p), 5)}$、$x^{${n(p)}} < ${n(b)}$ は $x < ${n(b ** (1 / p), 5)}$ と同じです。`], [`The interval has length $${n(m, 5)}$.`, `この区間の長さは $${n(m, 5)}$ です。`], ['The Lebesgue integral weights each value band by exactly this kind of length.', 'ルベーグ積分は、各値の帯をまさにこの種の長さで重み付けします。']],
      };
    },
  ];

  /* ---------- 3. limits and null sets ---------- */
  Q['lebesgue-vs-riemann-limits'] = [
    (r) => {
      if (r.chance(0.5)) {
        const m = r.int(1, 12);
        return {
          q: [`What is $\\displaystyle\\int_0^1 x^{${m}}\\,dx$? This is the integral of $f_n(x) = x^n$ with $n = ${m}$.`, `$\\displaystyle\\int_0^1 x^{${m}}\\,dx$ はいくらですか。これは $n = ${m}$ のときの $f_n(x) = x^n$ の積分です。`],
          a: { type: 'num', v: 1 / (m + 1), show: frac(1, m + 1) },
          hint: ['Use the power rule.', 'べき乗の積分公式を使います。'],
          sol: [[`$\\int_0^1 x^{${m}}\\,dx = \\dfrac{1}{${m + 1}}$.`, `$\\int_0^1 x^{${m}}\\,dx = \\dfrac{1}{${m + 1}}$ です。`], ['These integrals tend to $0$, the integral of the pointwise limit, and the constant function $1$ dominates every $x^n$.', 'これらの積分は、各点での極限の積分である $0$ に収束します。定数関数 $1$ がすべての $x^n$ を押さえているからです。']],
        };
      }
      const m = r.int(2, 12), c = r.pick([1, 2, 3, 4, 5]);
      return {
        q: [`The spike $f_n = ${c === 1 ? '' : c}n\\cdot\\mathbf{1}_{(0, 1/n)}$ is a rectangle of height $${c === 1 ? '' : c}n$ over $(0, 1/n)$. What is $\\int_0^1 f_n\\,d\\mu$ for $n = ${m}$?`, `スパイク $f_n = ${c === 1 ? '' : c}n\\cdot\\mathbf{1}_{(0, 1/n)}$ は、$(0, 1/n)$ 上の高さ $${c === 1 ? '' : c}n$ の長方形です。$n = ${m}$ のときの $\\int_0^1 f_n\\,d\\mu$ を求めてください。`],
        a: { type: 'num', v: c },
        hint: ['Height times measure of $(0, 1/n)$.', '高さ×$(0, 1/n)$ の測度です。'],
        sol: [[`The measure of $(0, 1/${m})$ is $1/${m}$ and the height is $${c * m}$.`, `$(0, 1/${m})$ の測度は $1/${m}$、高さは $${c * m}$ です。`], [`The integral is $${c * m}\\cdot\\frac{1}{${m}} = ${c}$, the same for every $n$.`, `積分は $${c * m}\\cdot\\frac{1}{${m}} = ${c}$ で、どの $n$ でも同じ値です。`], ['Yet the pointwise limit is $0$ everywhere: the mass has escaped into a point.', 'しかし各点での極限はどこでも $0$ です。質量は一点に逃げ込んでしまいました。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const items = [
          { f: 'f_n(x) = x^n \\text{ on } [0, 1]', k: 0, w: ['$|f_n| \\le 1$, and the constant $1$ is integrable on $[0, 1]$, so dominated convergence applies (the sequence is decreasing, so monotone convergence in its increasing form does not)', '$|f_n| \\le 1$ で、定数 $1$ は $[0, 1]$ で可積分なので優収束定理が使えます（数列は減少なので、増加列向けの単調収束定理は使えません）'] },
          { f: 'f_n(x) = \\min(1/x,\\ n) \\text{ on } (0, 1]', k: 1, w: ['the sequence increases to $1/x$, so monotone convergence applies (and the limit integral is $+\\infty$); no integrable dominator exists', '数列は $1/x$ へ増加するので単調収束定理が使えます（極限の積分は $+\\infty$）。可積分な優関数はありません'] },
          { f: 'f_n = n\\,\\mathbf{1}_{(0, 1/n)} \\text{ on } [0, 1]', k: 2, w: ['the sequence is not monotone and has no integrable dominator, since $\\int f_n = 1$ does not tend to $\\int 0 = 0$', '数列は単調でなく、可積分な優関数もありません。$\\int f_n = 1$ は $\\int 0 = 0$ に収束しないからです'] },
          { f: 'f_n = \\mathbf{1}_{[n, n+1]} \\text{ on } \\mathbb{R}', k: 2, w: ['it is not monotone, and any dominator would have to be at least $1$ on all of $[1, \\infty)$, which is not integrable', '単調ではなく、優関数は $[1, \\infty)$ 全体で $1$ 以上でなければならず、可積分になりません'] },
          { f: 'f_n(x) = \\dfrac{x^n}{1 + x} \\text{ on } [0, 1]', k: 0, w: ['$0 \\le f_n \\le 1$, dominated by the integrable constant $1$', '$0 \\le f_n \\le 1$ で、可積分な定数 $1$ が優関数です'] },
          { f: 'f_n(x) = \\mathbf{1}_{[0,\\, 1 - 1/n]}(x) \\text{ on } [0, 1]', k: 1, w: ['the sets $[0, 1 - 1/n]$ increase, so $f_n$ increases to $\\mathbf{1}_{[0,1)}$ and monotone convergence applies (dominated convergence also applies here, but monotone is the direct fit)', '集合 $[0, 1 - 1/n]$ は増加するので $f_n$ は $\\mathbf{1}_{[0,1)}$ へ増加し、単調収束定理が使えます（優収束定理も使えますが、直接当てはまるのは単調収束定理です）'] },
        ];
        const it = r.pick(items);
        return {
          q: [`Which theorem lets you exchange limit and integral for $${it.f}$?`, `$${it.f}$ について、極限と積分の交換を保証する定理はどれですか。`],
          a: { type: 'choice', opts: [YN('Dominated convergence (a common integrable bound)', '優収束定理（共通の可積分な優関数）'), YN('Monotone convergence (an increasing sequence)', '単調収束定理（増加列）'), YN('Neither applies', 'どちらも使えない')], v: it.k, fixed: true },
          hint: ['Look for a single integrable $g \\ge |f_n|$ for all $n$, or for $0 \\le f_n \\le f_{n+1}$.', 'すべての $n$ に共通の可積分な $g \\ge |f_n|$、または $0 \\le f_n \\le f_{n+1}$ を探します。'],
          sol: [[`Check: ${it.w[0]}.`, `確認すると、${it.w[1]}。`], ['The hypotheses are about the whole sequence, so a single bound or a single order has to work for every $n$ at once.', '仮定は数列全体についてのものなので、一つの上界、または一つの順序がすべての $n$ に対して同時に成り立つ必要があります。']],
        };
      }
      if (form === 1) {
        const c = r.pick([1, 2, 3, 4, 5, 7]), kind = r.int(0, 1);
        return {
          q: [kind === 0 ? `Let $f_n = ${c === 1 ? '' : c}n\\,\\mathbf{1}_{(0, 1/n)}$. Compute $\\lim_{n\\to\\infty}\\int_0^1 f_n\\,d\\mu - \\int_0^1 \\lim_{n\\to\\infty} f_n\\,d\\mu$.` : `Let $f_n = ${c}\\,\\mathbf{1}_{[n, n+1]}$ on $\\mathbb{R}$. Compute $\\lim_{n\\to\\infty}\\int f_n\\,d\\mu - \\int \\lim_{n\\to\\infty} f_n\\,d\\mu$.`, kind === 0 ? `$f_n = ${c === 1 ? '' : c}n\\,\\mathbf{1}_{(0, 1/n)}$ とします。$\\lim_{n\\to\\infty}\\int_0^1 f_n\\,d\\mu - \\int_0^1 \\lim_{n\\to\\infty} f_n\\,d\\mu$ を計算してください。` : `$\\mathbb{R}$ 上で $f_n = ${c}\\,\\mathbf{1}_{[n, n+1]}$ とします。$\\lim_{n\\to\\infty}\\int f_n\\,d\\mu - \\int \\lim_{n\\to\\infty} f_n\\,d\\mu$ を計算してください。`],
          a: { type: 'int', v: c },
          hint: ['Find the limit of the integrals, then the integral of the pointwise limit.', '積分の極限と、各点での極限の積分をそれぞれ求めます。'],
          sol: [[`Every $\\int f_n\\,d\\mu = ${c}$, so the limit of the integrals is ${c}.`, `どの $\\int f_n\\,d\\mu$ も ${c} なので、積分の極限は ${c} です。`], [`The pointwise limit is $0$ everywhere, so the integral of the limit is $0$.`, '各点での極限はどこでも $0$ なので、極限の積分は $0$ です。'], [`The gap is ${c}: no dominated convergence, because no single integrable function bounds all the $f_n$.`, `差は ${c} です。すべての $f_n$ を押さえる単一の可積分関数がないので、優収束定理は使えません。`]],
        };
      }
      const k = r.int(2, 12);
      return {
        q: [`Let $f_n(x) = x^{1/n}$ on $[0, 1]$, an increasing sequence with $f_n \\to 1$ for $x > 0$. What is $\\int_0^1 f_n\\,d\\mu$ for $n = ${k}$?`, `$[0, 1]$ 上で $f_n(x) = x^{1/n}$ とします。$x > 0$ で $f_n \\to 1$ となる増加列です。$n = ${k}$ のときの $\\int_0^1 f_n\\,d\\mu$ を求めてください。`],
        a: { type: 'num', v: k / (k + 1), show: frac(k, k + 1) },
        hint: ['Use the power rule with exponent $1/n$.', '指数 $1/n$ のべき乗の積分公式を使います。'],
        sol: [[`$\\int_0^1 x^{1/${k}}\\,dx = \\dfrac{1}{1/${k} + 1} = ${frac(k, k + 1)}$.`, `$\\int_0^1 x^{1/${k}}\\,dx = \\dfrac{1}{1/${k} + 1} = ${frac(k, k + 1)}$ です。`], ['These increase to $1$, as monotone convergence predicts: $\\int 1\\,d\\mu = 1$.', 'これらは単調収束定理の予言どおり $1$ に増加し、$\\int 1\\,d\\mu = 1$ と一致します。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([1, 2, 3, 5, 0.5, -2]), d = r.pick([1, 2, 3, 4, 0.5, 7]);
        return {
          q: [`Let $D(x) = ${n(c)}$ if $x$ is rational and $D(x) = ${n(d)}$ if $x$ is irrational, on $[0, 1]$. What is the Lebesgue integral $\\int_0^1 D\\,d\\mu$?`, `$[0, 1]$ 上で、$x$ が有理数なら $D(x) = ${n(c)}$、無理数なら $D(x) = ${n(d)}$ とします。ルベーグ積分 $\\int_0^1 D\\,d\\mu$ はいくらですか。`],
          a: { type: 'num', v: d },
          hint: ['The rationals in $[0, 1]$ form a countable set, so their measure is $0$.', '$[0, 1]$ の有理数は可算集合なので、測度は $0$ です。'],
          sol: [['$\\mu(\\mathbb{Q} \\cap [0, 1]) = 0$, so the rational values contribute nothing.', '$\\mu(\\mathbb{Q} \\cap [0, 1]) = 0$ なので、有理数での値は何も寄与しません。'], [`The integral is $${n(d)} \\cdot 1 + ${n(c)} \\cdot 0 = ${n(d)}$.`, `積分は $${n(d)} \\cdot 1 + ${n(c)} \\cdot 0 = ${n(d)}$ です。`], [c === d ? 'Here the two values coincide, so $D$ is constant and Riemann integrable too.' : 'Every Riemann sum, however, can be forced to either value by choosing rational or irrational tags, so the Riemann integral does not exist.', c === d ? 'この場合は二つの値が一致し、$D$ は定数でリーマン積分可能でもあります。' : 'ただし、リーマン和は標本点に有理数と無理数のどちらを選ぶかで二つの値のどちらにもなるので、リーマン積分は存在しません。']],
        };
      }
      if (form === 1) {
        const b = r.pick([2, 3, 4, 5, 10]), eps = r.pick([0.1, 0.5, 1, 2, 3]);
        const tot = eps / (b - 1);
        return {
          q: [`Enumerate the rationals of $[0, 1]$ as $q_1, q_2, \\ldots$ and cover $q_j$ by an interval of length $${n(eps)}/${b}^j$. What is the total length of all these intervals? (Add the geometric series; it bounds $\\mu(\\mathbb{Q} \\cap [0, 1])$.)`, `$[0, 1]$ の有理数を $q_1, q_2, \\ldots$ と並べ、$q_j$ を長さ $${n(eps)}/${b}^j$ の区間で覆います。これらの区間の長さの合計はいくらですか（等比級数の和で、$\\mu(\\mathbb{Q} \\cap [0, 1])$ の上界になります）。`],
          a: { type: 'num', v: tot, show: frac(Math.round(eps * 10), 10 * (b - 1)) },
          hint: ['$\\sum_{j \\ge 1} r^j = r/(1 - r)$ for $|r| < 1$.', '$|r| < 1$ のとき $\\sum_{j \\ge 1} r^j = r/(1 - r)$ です。'],
          sol: [[`The total is $${n(eps)}\\sum_{j \\ge 1} ${b}^{-j} = ${n(eps)}\\cdot\\dfrac{1/${b}}{1 - 1/${b}} = ${n(eps)}\\cdot\\dfrac{1}{${b - 1}}$.`, `合計は $${n(eps)}\\sum_{j \\ge 1} ${b}^{-j} = ${n(eps)}\\cdot\\dfrac{1/${b}}{1 - 1/${b}} = ${n(eps)}\\cdot\\dfrac{1}{${b - 1}}$ です。`], [`That is ${n(tot, 5)}.`, `これは ${n(tot, 5)} です。`], ['Since the first number can be made as small as we like, the rationals have measure zero, although they are dense.', '最初の数はいくらでも小さくできるので、有理数は稠密でも測度が 0 です。']],
        };
      }
      const cases = [
        { f: ['the indicator function of $\\mathbb{Q} \\cap [0, 1]$', '$\\mathbb{Q} \\cap [0, 1]$ の指示関数'], k: 1, w: ['it is discontinuous at every point of $[0, 1]$, a set of measure $1$', '$[0, 1]$ のすべての点で不連続で、その集合の測度は $1$'] },
        { f: ['the indicator function of $\\{1/2, 1/3, 1/4, \\ldots\\}$', '$\\{1/2, 1/3, 1/4, \\ldots\\}$ の指示関数'], k: 0, w: ['its discontinuities form a countable set, which has measure $0$', '不連続点は可算集合で、測度は $0$'] },
        { f: ['the step function equal to $1$ on $[0, 1/2)$ and $2$ on $[1/2, 1]$', '$[0, 1/2)$ で $1$、$[1/2, 1]$ で $2$ をとる階段関数'], k: 0, w: ['it is discontinuous at one point only', '不連続点は一点だけ'] },
        { f: ['the indicator function of a closed set of positive measure with empty interior (a fat Cantor set)', '内点をもたない正測度の閉集合（太いカントール集合）の指示関数'], k: 1, w: ['it is discontinuous at every point of the set, which has positive measure', '集合のすべての点で不連続で、その測度は正'] },
        { f: ['the indicator function of the Cantor ternary set', '3 進カントール集合の指示関数'], k: 0, w: ['it is discontinuous only on the Cantor set, which has measure $0$', '不連続点はカントール集合だけで、その測度は $0$'] },
        { f: ['the function $g(x) = \\sin(1/x)$ with $g(0) = 0$', '$g(0) = 0$ とした関数 $g(x) = \\sin(1/x)$'], k: 0, w: ['it is bounded and discontinuous only at $0$', '有界で、不連続点は $0$ だけ'] },
      ];
      const c = r.pick(cases);
      return {
        q: [`Is ${c.f[0]} Riemann integrable on $[0, 1]$?`, `${c.f[1]}は $[0, 1]$ でリーマン積分可能ですか。`],
        a: { type: 'choice', opts: [YN('Yes', 'はい'), YN('No', 'いいえ')], v: c.k, fixed: true },
        hint: ['A bounded function on $[0, 1]$ is Riemann integrable exactly when its set of discontinuities has Lebesgue measure zero.', '$[0, 1]$ 上の有界関数がリーマン積分可能であるのは、不連続点の集合のルベーグ測度が 0 のときです。'],
        sol: [[`${c.w[0][0].toUpperCase() + c.w[0].slice(1)}.`, `${c.w[1]}です。`], [c.k === 0 ? 'So the discontinuity set is null and the Riemann integral exists (and agrees with the Lebesgue integral).' : 'So the discontinuity set is not null and the Riemann integral does not exist, although the Lebesgue integral of such an indicator still does.', c.k === 0 ? 'したがって不連続点の集合は零集合で、リーマン積分が存在します（ルベーグ積分と一致します）。' : 'したがって不連続点の集合は零集合ではなく、リーマン積分は存在しません。一方、この種の指示関数のルベーグ積分は存在します。']],
      };
    },
  ];
})();
