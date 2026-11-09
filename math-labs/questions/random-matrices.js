'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI;
  const semiCDF = (x) => { const y = Math.max(-2, Math.min(2, x)); return 0.5 + (y * Math.sqrt(4 - y * y)) / (4 * PI) + Math.asin(y / 2) / PI; };
  const catalan = (k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * 2 * (2 * i + 1)) / (i + 2); return Math.round(c); };

  /* ---------------- rmt-semicircle ---------------- */
  Q['rmt-semicircle'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.pick([0, 0.5, 1, 1.2, 1.5, 1.6, 1.8]), d = Math.sqrt(4 - x * x) / (2 * PI);
        return {
          q: [`What is the semicircle density $\\rho(x) = \\sqrt{4 - x^2}/(2\\pi)$ at $x = ${n(x, 1)}$? Give three decimals.`, `半円の密度 $\\rho(x) = \\sqrt{4 - x^2}/(2\\pi)$ の $x = ${n(x, 1)}$ での値はいくらですか。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: d, tol: 0.0015 },
          hint: ['Substitute directly.', 'そのまま代入します。'],
          sol: [[`$\\sqrt{4 - ${n(x * x, 2)}} = ${n(Math.sqrt(4 - x * x), 4)}$, divided by $2\\pi = 6.2832$.`, `$\\sqrt{4 - ${n(x * x, 2)}} = ${n(Math.sqrt(4 - x * x), 4)}$ を $2\\pi = 6.2832$ で割ります。`], [`$\\rho(${n(x, 1)}) = ${n(d, 4)}$; the density is largest at 0, $1/\\pi = 0.318$, and falls to zero at the edges $\\pm2$.`, `$\\rho(${n(x, 1)}) = ${n(d, 4)}$ です。密度は 0 で最大の $1/\\pi = 0.318$ で、端 $\\pm2$ でゼロになります。`]],
        };
      }
      if (form === 1) {
        const m = r.int(1, 5), C = catalan(m);
        return {
          q: [`As $n \\to \\infty$, what does $\\frac1n\\operatorname{tr}H^{${2 * m}}$ converge to for a Wigner matrix normalized to the semicircle on $[-2, 2]$?`, `半円が $[-2, 2]$ になるよう正規化したウィグナー行列で、$n \\to \\infty$ のとき $\\frac1n\\operatorname{tr}H^{${2 * m}}$ は何に収束しますか。`],
          a: { type: 'int', v: C },
          hint: ['The even moments of the semicircle are the Catalan numbers.', '半円の偶数次モーメントはカタラン数です。'],
          sol: [[`The $2m$th moment is $C_m = \\frac{1}{m+1}\\binom{2m}{m}$ with $m = ${m}$.`, `$2m$ 次モーメントは $m = ${m}$ として $C_m = \\frac{1}{m+1}\\binom{2m}{m}$ です。`], [`$C_{${m}} = ${C}$, the number of non-crossing pairings of ${2 * m} points.`, `$C_{${m}} = ${C}$ で、${2 * m} 点の交差しない対の作り方の数です。`]],
        };
      }
      const N = r.pick([10, 20, 50, 100, 150]);
      return {
        q: [`For an $n \\times n$ Gaussian Wigner matrix with $n = ${N}$ (off-diagonal variance $1/n$, diagonal $2/n$), what is $\\frac1n\\mathbb E\\operatorname{tr}H^2$ exactly?`, `$n = ${N}$ の $n \\times n$ ガウス・ウィグナー行列（非対角の分散 $1/n$、対角 $2/n$）で、$\\frac1n\\mathbb E\\operatorname{tr}H^2$ の厳密な値はいくらですか。`],
        a: { type: 'num', v: 1 + 1 / N, rel: 1e-4, show: `1 + \\tfrac{1}{${N}}` },
        hint: ['$\\operatorname{tr}H^2 = \\sum_{i,j} H_{ij}^2$.', '$\\operatorname{tr}H^2 = \\sum_{i,j} H_{ij}^2$ です。'],
        sol: [[`$\\mathbb E\\operatorname{tr}H^2 = n\\cdot\\frac{2}{n} + n(n-1)\\cdot\\frac{1}{n} = n + 1$.`, `$\\mathbb E\\operatorname{tr}H^2 = n\\cdot\\frac{2}{n} + n(n-1)\\cdot\\frac{1}{n} = n + 1$ です。`], [`Divided by $n$: $1 + 1/${N} = ${n(1 + 1 / N, 4)}$, tending to the semicircle's second moment 1.`, `$n$ で割って $1 + 1/${N} = ${n(1 + 1 / N, 4)}$ で、半円の 2 次モーメント 1 に近づきます。`]],
        set: { n: N, kind: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.pick([0.5, 1, 1.5]), fr = semiCDF(a) - semiCDF(-a);
        return {
          q: [`What fraction of the eigenvalues of a large Wigner matrix lies in $[-${n(a, 1)}, ${n(a, 1)}]$? Give three decimals.`, `大きなウィグナー行列の固有値のうち、$[-${n(a, 1)}, ${n(a, 1)}]$ に入るものの割合はいくらですか。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: fr, tol: 0.0015 },
          hint: ['$\\int_{-a}^{a}\\frac{\\sqrt{4-x^2}}{2\\pi}dx = \\frac{a\\sqrt{4-a^2}}{2\\pi} + \\frac{2}{\\pi}\\arcsin\\frac a2$.', '$\\int_{-a}^{a}\\frac{\\sqrt{4-x^2}}{2\\pi}dx = \\frac{a\\sqrt{4-a^2}}{2\\pi} + \\frac{2}{\\pi}\\arcsin\\frac a2$ です。'],
          sol: [[`The area term is $${n(a, 1)}\\sqrt{4 - ${n(a * a, 2)}}/(2\\pi) = ${n((a * Math.sqrt(4 - a * a)) / (2 * PI), 4)}$ and the angle term $\\frac{2}{\\pi}\\arcsin(${n(a / 2, 2)}) = ${n((2 / PI) * Math.asin(a / 2), 4)}$.`, `面積の項は $${n(a, 1)}\\sqrt{4 - ${n(a * a, 2)}}/(2\\pi) = ${n((a * Math.sqrt(4 - a * a)) / (2 * PI), 4)}$、角の項は $\\frac{2}{\\pi}\\arcsin(${n(a / 2, 2)}) = ${n((2 / PI) * Math.asin(a / 2), 4)}$ です。`], [`Together $${n(fr, 4)}$, more than the uniform guess $${n(a / 2, 3)}$, because the semicircle is heaviest in the middle.`, `合わせて $${n(fr, 4)}$ で、一様分布の見積もり $${n(a / 2, 3)}$ より多くなります。半円は中央が最も重いからです。`]],
        };
      }
      const sigma = r.pick([0.5, 2, 3, 5]), N = r.pick([100, 400, 900, 2500]), edge = 2 * sigma * Math.sqrt(N);
      return {
        q: [`A symmetric $${N} \\times ${N}$ matrix has independent off-diagonal entries of standard deviation $${n(sigma, 1)}$ and is not rescaled. Approximately where is its largest eigenvalue?`, `対称な $${N} \\times ${N}$ 行列の非対角成分は独立で標準偏差 $${n(sigma, 1)}$ をもち、尺度は直していません。最大固有値はおよそどこにありますか。`],
        a: { type: 'num', v: edge, rel: 0.01 },
        hint: ['Rescaling by $1/(\\sigma\\sqrt n)$ gives the semicircle on $[-2, 2]$.', '$1/(\\sigma\\sqrt n)$ で尺度を直すと $[-2, 2]$ 上の半円になります。'],
        sol: [[`$H/(\\sigma\\sqrt n)$ has its spectrum on $[-2, 2]$, so the raw edge is $2\\sigma\\sqrt n$.`, `$H/(\\sigma\\sqrt n)$ のスペクトルは $[-2, 2]$ にあるので、元の行列の端は $2\\sigma\\sqrt n$ です。`], [`$2 \\times ${n(sigma, 1)} \\times \\sqrt{${N}} = ${n(edge, 3)}$: the spectrum grows like $\\sqrt n$, not like $n$.`, `$2 \\times ${n(sigma, 1)} \\times \\sqrt{${N}} = ${n(edge, 3)}$ です。スペクトルは $n$ ではなく $\\sqrt n$ のように広がります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 2) {
        const sg = r.pick([0.5, 1.5, 2, 3]), S2 = n(sg * sg, 2);
        return {
          q: [`A Wigner matrix whose off-diagonal entries have variance $${S2}/n$ has a semicircle of radius $2\\sigma$ with $\\sigma = ${n(sg, 1)}$. Write its eigenvalue density for $|x| < ${n(2 * sg, 1)}$.`, `非対角成分の分散が $${S2}/n$ のウィグナー行列の半円は半径 $2\\sigma$、$\\sigma = ${n(sg, 1)}$ です。$|x| < ${n(2 * sg, 1)}$ での固有値の密度を書いてください。`],
          a: { type: 'expr', v: `sqrt(${4 * sg * sg}-x^2)/(2*pi*${sg * sg})`, vars: ['x'], dom: { x: [0.05, 1.8 * sg] }, lhs: ['$\\rho(x) =$', '$\\rho(x) =$'] },
          hint: ['Rescale $x = \\sigma y$ in $\\sqrt{4 - y^2}/(2\\pi)$ and keep the total mass 1.', '$\\sqrt{4 - y^2}/(2\\pi)$ で $x = \\sigma y$ と尺度を変え、全体の質量を 1 に保ちます。'],
          sol: [['If $y = x/\\sigma$ has density $\\sqrt{4 - y^2}/(2\\pi)$, then $x$ has density $\\frac{1}{\\sigma}\\cdot\\frac{\\sqrt{4 - x^2/\\sigma^2}}{2\\pi} = \\frac{\\sqrt{4\\sigma^2 - x^2}}{2\\pi\\sigma^2}$.', '$y = x/\\sigma$ の密度が $\\sqrt{4 - y^2}/(2\\pi)$ なら、$x$ の密度は $\\frac{1}{\\sigma}\\cdot\\frac{\\sqrt{4 - x^2/\\sigma^2}}{2\\pi} = \\frac{\\sqrt{4\\sigma^2 - x^2}}{2\\pi\\sigma^2}$ です。'], [`With $\\sigma^2 = ${S2}$: $\\rho(x) = \\sqrt{${n(4 * sg * sg, 2)} - x^2}/(${n(2 * sg * sg, 2)}\\pi)$, peaking at $1/(\\pi\\sigma) = ${n(1 / (PI * sg), 4)}$.`, `$\\sigma^2 = ${S2}$ では $\\rho(x) = \\sqrt{${n(4 * sg * sg, 2)} - x^2}/(${n(2 * sg * sg, 2)}\\pi)$ で、最大値は $1/(\\pi\\sigma) = ${n(1 / (PI * sg), 4)}$ です。`]],
        };
      }
      if (form === 3) {
        const N = r.pick([64, 125, 216, 343, 512, 1000, 8000]), w = Math.pow(N, -2 / 3);
        return {
          q: [`The largest eigenvalue of an $n \\times n$ Wigner matrix fluctuates around 2 on the Tracy–Widom scale $n^{-2/3}$. What is that scale for $n = ${N}$?`, `$n \\times n$ ウィグナー行列の最大固有値は、トレイシー・ウィドムの尺度 $n^{-2/3}$ で 2 の周りを揺らぎます。$n = ${N}$ のときその尺度はいくらですか。`],
          a: { type: 'num', v: w, rel: 0.003 },
          hint: ['Compute $n^{1/3}$ first, then square and invert.', 'まず $n^{1/3}$ を計算し、2 乗して逆数をとります。'],
          sol: [[`$n^{1/3} = ${n(Math.cbrt(N), 4)}$, so $n^{2/3} = ${n(Math.cbrt(N) ** 2, 4)}$.`, `$n^{1/3} = ${n(Math.cbrt(N), 4)}$ なので $n^{2/3} = ${n(Math.cbrt(N) ** 2, 4)}$ です。`], [`$n^{-2/3} = ${sig(w, 3)}$: much smaller than the $n^{-1/2}$ of an ordinary average, because the edge is pinned by all the other eigenvalues.`, `$n^{-2/3} = ${sig(w, 3)}$ で、通常の平均の $n^{-1/2}$ よりずっと小さくなります。端はほかのすべての固有値に押さえられているからです。`]],
        };
      }
      if (form === 0) {
        return {
          q: ['Entries drawn from a Student t distribution with 1.5 degrees of freedom, scaled by $1/\\sqrt n$: does the eigenvalue histogram converge to the semicircle?', '自由度 1.5 のスチューデントの t 分布から成分を選び、$1/\\sqrt n$ で尺度をそろえます。固有値のヒストグラムは半円に収束しますか。'],
          a: { type: 'choice', fixed: true, v: 1, opts: [['Yes, by universality', 'はい、普遍性により収束します'], ['No: the variance is infinite', 'いいえ、分散が無限大です'], ['Yes, but only for even n', 'はい、ただし n が偶数のときだけです']] },
          hint: ['Universality has a hypothesis. Which moment of the t distribution with ν ≤ 2 is infinite?', '普遍性には仮定があります。ν ≤ 2 の t 分布で無限大になるのはどのモーメントですか。'],
          sol: [['The t distribution with $\\nu$ degrees of freedom has finite variance only for $\\nu > 2$.', '自由度 $\\nu$ の t 分布の分散が有限なのは $\\nu > 2$ のときだけです。'], ['With $\\nu = 1.5$ the moment method fails and a few huge entries dominate: the limit is a heavy-tailed law, not the semicircle.', '$\\nu = 1.5$ ではモーメント法が使えず、少数の巨大な成分が支配します。極限は半円ではなく、裾の重い法則になります。']],
          set: { kind: 2 },
        };
      }
      const k = r.pick([4, 6]), m = k / 2, E = catalan(m);
      const pair = k === 4 ? ['$(12)(34)$, $(14)(23)$', '$(12)(34)$、$(14)(23)$'] : ['five pairings of 6 points', '6 点の 5 通りの対'];
      return {
        q: [`In $\\frac1n\\mathbb E\\operatorname{tr}H^{${k}}$, closed walks of length ${k} contribute only if every edge is traversed exactly twice along a tree. How many such pairings are there (the limit of the moment)?`, `$\\frac1n\\mathbb E\\operatorname{tr}H^{${k}}$ では、長さ ${k} の閉じた歩みのうち、木に沿ってどの辺もちょうど 2 回通るものだけが寄与します。そのような対の作り方は何通りですか（モーメントの極限）。`],
        a: { type: 'int', v: E },
        hint: ['Count pairings of the ' + k + ' steps that do not cross.', `${k} 歩の交差しない対の作り方を数えます。`],
        sol: [[`The non-crossing pairings of ${k} points number $C_{${m}}$; the crossing ones (such as $(13)(24)$) are suppressed by a factor $1/n$.`, `${k} 点の交差しない対の数は $C_{${m}}$ で、$(13)(24)$ のような交差するものは $1/n$ 倍だけ小さくなります。`], [`So the limit is $${E}$ (${pair[0]} for $k = 4$ and so on).`, `したがって極限は $${E}$ です（$k = 4$ なら ${pair[1]} など）。`]],
      };
    },
  ];

  /* ---------------- rmt-repulsion ---------------- */
  const P1 = (s) => 1 - Math.exp((-PI * s * s) / 4);
  Q['rmt-repulsion'] = [
    (r) => {
      const a = r.step(-1.5, 1.5, 0.1), b = r.step(-1.5, 1.5, 0.1), lam = Math.hypot(a, b);
      return {
        q: [`What are the eigenvalues of $\\begin{pmatrix}${n(a, 1)} & ${n(b, 1)}\\\\ ${n(b, 1)} & ${n(-a, 1)}\\end{pmatrix}$? Give the positive one.`, `$\\begin{pmatrix}${n(a, 1)} & ${n(b, 1)}\\\\ ${n(b, 1)} & ${n(-a, 1)}\\end{pmatrix}$ の固有値は何ですか。正のほうを答えてください。`],
        a: { type: 'num', v: lam, rel: 0.003 },
        hint: ['The trace is 0, so the eigenvalues are $\\pm\\sqrt{-\\det}$.', 'トレースが 0 なので、固有値は $\\pm\\sqrt{-\\det}$ です。'],
        sol: [[`$\\det = -a^2 - b^2 = -${n(a * a + b * b, 2)}$, so $\\lambda = \\pm\\sqrt{${n(a * a + b * b, 2)}}$.`, `$\\det = -a^2 - b^2 = -${n(a * a + b * b, 2)}$ なので $\\lambda = \\pm\\sqrt{${n(a * a + b * b, 2)}}$ です。`], [`$\\lambda_+ = ${n(lam, 4)}$: the height of the cone above the point $(a, b)$.`, `$\\lambda_+ = ${n(lam, 4)}$ で、点 $(a, b)$ の上にある円錐の高さです。`]],
        set: { a, b },
      };
    },
    (r) => {
      const form = r.int(0, 1), s = r.pick([0.1, 0.2, 0.3, 0.5, 0.8, 1]);
      if (form === 0) {
        const p1 = P1(s), p0 = 1 - Math.exp(-s);
        return {
          q: [`Using Wigner's surmise for real symmetric matrices, what is the probability that a spacing (mean 1) is below $${n(s, 1)}$? Give three significant figures.`, `実対称行列のウィグナーの推測式を使うと、間隔（平均 1）が $${n(s, 1)}$ 未満になる確率はいくらですか。有効数字 3 桁で答えてください。`],
          a: { type: 'num', v: p1, rel: 0.004 },
          hint: ['Integrate $\\frac{\\pi}{2}se^{-\\pi s^2/4}$ from 0.', '$\\frac{\\pi}{2}se^{-\\pi s^2/4}$ を 0 から積分します。'],
          sol: [[`$\\Pr(S < s) = 1 - e^{-\\pi s^2/4} = 1 - e^{-${n((PI * s * s) / 4, 4)}}$.`, `$\\Pr(S < s) = 1 - e^{-\\pi s^2/4} = 1 - e^{-${n((PI * s * s) / 4, 4)}}$ です。`], [`$= ${sig(p1, 3)}$, compared with $${sig(p0, 3)}$ for independent levels: repulsion empties the small gaps.`, `$= ${sig(p1, 3)}$ で、独立な準位の $${sig(p0, 3)}$ と比べると、反発によって小さな間隔が空になることがわかります。`]],
        };
      }
      const a = r.step(-1.5, 1.5, 0.1), b = r.step(-1.5, 1.5, 0.1), S = (2 * Math.hypot(a, b)) / Math.sqrt(PI);
      return {
        q: [`For the $2 \\times 2$ ensemble with $a, b \\sim N(0, \\tfrac12)$, the mean gap is $\\sqrt\\pi$. What is the normalized spacing $s$ of the matrix with $a = ${n(a, 1)}$, $b = ${n(b, 1)}$?`, `$a, b \\sim N(0, \\tfrac12)$ の $2 \\times 2$ アンサンブルでは平均間隔は $\\sqrt\\pi$ です。$a = ${n(a, 1)}$、$b = ${n(b, 1)}$ の行列の正規化した間隔 $s$ はいくらですか。`],
        a: { type: 'num', v: S, rel: 0.004 },
        hint: ['The gap is $2\\sqrt{a^2 + b^2}$.', '間隔は $2\\sqrt{a^2 + b^2}$ です。'],
        sol: [[`Gap $= 2\\sqrt{${n(a * a + b * b, 2)}} = ${n(2 * Math.hypot(a, b), 4)}$.`, `間隔 $= 2\\sqrt{${n(a * a + b * b, 2)}} = ${n(2 * Math.hypot(a, b), 4)}$ です。`], [`Dividing by $\\sqrt\\pi = 1.7725$ gives $s = ${n(S, 4)}$.`, `$\\sqrt\\pi = 1.7725$ で割ると $s = ${n(S, 4)}$ です。`]],
        set: { a, b },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const bt = r.pick([1, 2, 4]), lbl = { 1: ['real symmetric', '実対称'], 2: ['complex Hermitian', '複素エルミート'], 4: ['quaternion self-dual', '四元数の自己双対'] }[bt];
        return {
          q: [`For ${lbl[0]} matrices (Dyson index $\\beta = ${bt}$), the spacing density behaves as $P(s) \\propto s^k$ near $s = 0$. What is $k$?`, `${lbl[1]}行列（ダイソン指数 $\\beta = ${bt}$）では、間隔の密度は $s = 0$ の近くで $P(s) \\propto s^k$ のようにふるまいます。$k$ はいくつですか。`],
          a: { type: 'int', v: bt },
          hint: ['Count the real conditions a degeneracy imposes, minus one.', '縮退が課す実条件の数から 1 を引きます。'],
          sol: [[`A degeneracy imposes $\\beta + 1$ real conditions (a diagonal difference and $\\beta$ real parts of the off-diagonal entry).`, `縮退は $\\beta + 1$ 個の実条件（対角成分の差と、非対角成分の $\\beta$ 個の実部）を課します。`], [`Matrices with gap below $s$ fill a ball in $\\beta + 1$ dimensions of volume $\\propto s^{\\beta+1}$, so the density goes as $s^{${bt}}$.`, `間隔が $s$ 未満の行列は $\\beta + 1$ 次元で体積 $\\propto s^{\\beta+1}$ の球を埋めるので、密度は $s^{${bt}}$ のようにふるまいます。`]],
        };
      }
      if (form === 1) {
        const p = r.pick([0.01, 0.05, 0.1, 0.25, 0.5]), s = Math.sqrt((-4 * Math.log(1 - p)) / PI);
        return {
          q: [`Below what spacing $s$ do only ${n(100 * p, 0)}% of spacings fall, according to the real symmetric Wigner surmise?`, `実対称のウィグナーの推測式によると、間隔の ${n(100 * p, 0)}% だけがそれより小さくなる間隔 $s$ はいくらですか。`],
          a: { type: 'num', v: s, rel: 0.004 },
          hint: ['Invert $1 - e^{-\\pi s^2/4} = p$.', '$1 - e^{-\\pi s^2/4} = p$ を逆に解きます。'],
          sol: [[`$e^{-\\pi s^2/4} = ${n(1 - p, 2)}$ gives $s^2 = -\\frac{4}{\\pi}\\ln ${n(1 - p, 2)} = ${n(s * s, 4)}$.`, `$e^{-\\pi s^2/4} = ${n(1 - p, 2)}$ から $s^2 = -\\frac{4}{\\pi}\\ln ${n(1 - p, 2)} = ${n(s * s, 4)}$ です。`], [`$s = ${n(s, 4)}$; for independent levels the same fraction lies below only $${n(-Math.log(1 - p), 4)}$.`, `$s = ${n(s, 4)}$ です。独立な準位では、同じ割合の境目は $${n(-Math.log(1 - p), 4)}$ にすぎません。`]],
        };
      }
      return {
        q: ['Find the spacing density $P(s)$ for traceless $2 \\times 2$ real symmetric matrices with $a, b$ independent $N(0, \\tfrac12)$, as a function of the raw gap $s = 2\\sqrt{a^2 + b^2}$.', '$a, b$ が独立に $N(0, \\tfrac12)$ に従う、トレースがゼロの $2 \\times 2$ 実対称行列について、生の間隔 $s = 2\\sqrt{a^2 + b^2}$ の関数として間隔の密度 $P(s)$ を求めてください。'],
        a: { type: 'expr', v: '(s/2)*exp(-s^2/4)', vars: ['s'], dom: { s: [0.1, 3] }, lhs: ['$P(s) =$', '$P(s) =$'] },
        hint: ['$a^2 + b^2$ is exponential with mean 1 when $a, b \\sim N(0, \\tfrac12)$.', '$a, b \\sim N(0, \\tfrac12)$ のとき $a^2 + b^2$ は平均 1 の指数分布です。'],
        sol: [['With $\\rho = \\sqrt{a^2 + b^2}$, the joint density $\\frac1\\pi e^{-\\rho^2}$ in polar form gives $P(\\rho) = 2\\rho e^{-\\rho^2}$: the factor $\\rho$ is the circle length.', '$\\rho = \\sqrt{a^2 + b^2}$ とすると、同時密度 $\\frac1\\pi e^{-\\rho^2}$ を極座標で書いて $P(\\rho) = 2\\rho e^{-\\rho^2}$ です。因子 $\\rho$ は円周の長さです。'], ['With $s = 2\\rho$, $P(s) = \\frac12 P(\\rho) = \\frac s2 e^{-s^2/4}$, whose mean is $\\sqrt\\pi$; rescaling to mean 1 gives the surmise.', '$s = 2\\rho$ とすると $P(s) = \\frac12 P(\\rho) = \\frac s2 e^{-s^2/4}$ で、平均は $\\sqrt\\pi$ です。平均を 1 にそろえると推測式になります。']],
      };
    },
  ];

  /* ---------------- rmt-mp ---------------- */
  const edges = (g) => [(1 - Math.sqrt(g)) ** 2, (1 + Math.sqrt(g)) ** 2];
  const outl = (th, g) => (1 + th) * (1 + g / th);
  Q['rmt-mp'] = [
    (r) => {
      const p = r.pick([40, 60, 80, 100, 120]), g = r.pick([0.1, 0.25, 0.5, 0.75, 1]), N = Math.round(p / g), [lo, hi] = edges(g), up = r.chance(0.5);
      return {
        q: [`Pure noise of variance 1: $p = ${p}$ variables, $n = ${N}$ samples. Where is the ${up ? 'upper' : 'lower'} edge of the sample covariance spectrum?`, `分散 1 の純粋な雑音で、変数 $p = ${p}$、標本 $n = ${N}$ です。標本共分散のスペクトルの${up ? '上' : '下'}端はどこですか。`],
        a: { type: 'num', v: up ? hi : lo, tol: 0.003 },
        hint: ['$\\lambda_\\pm = (1 \\pm \\sqrt\\gamma)^2$ with $\\gamma = p/n$.', '$\\gamma = p/n$ として $\\lambda_\\pm = (1 \\pm \\sqrt\\gamma)^2$ です。'],
        sol: [[`$\\gamma = ${p}/${N} = ${n(g, 2)}$ and $\\sqrt\\gamma = ${n(Math.sqrt(g), 4)}$.`, `$\\gamma = ${p}/${N} = ${n(g, 2)}$、$\\sqrt\\gamma = ${n(Math.sqrt(g), 4)}$ です。`], [`$\\lambda_${up ? '+' : '-'} = (1 ${up ? '+' : '-'} ${n(Math.sqrt(g), 4)})^2 = ${n(up ? hi : lo, 4)}$, although every true variance is 1.`, `$\\lambda_${up ? '+' : '-'} = (1 ${up ? '+' : '-'} ${n(Math.sqrt(g), 4)})^2 = ${n(up ? hi : lo, 4)}$ です。真の分散はどれも 1 です。`]],
        set: { g, p, th: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1), g = r.pick([0.1, 0.25, 0.5, 0.75, 1]), th = r.pick([1, 1.5, 2, 3, 4]);
      if (form === 0) {
        const L0 = outl(th, g);
        return {
          q: [`A spike of strength $\\theta = ${n(th, 1)}$ (true variance $${n(1 + th, 1)}$) with $\\gamma = ${n(g, 2)}$. Where does the top sample eigenvalue converge?`, `強さ $\\theta = ${n(th, 1)}$（真の分散 $${n(1 + th, 1)}$）のスパイクで $\\gamma = ${n(g, 2)}$ です。最大の標本固有値はどこに収束しますか。`],
          a: { type: 'num', v: L0, rel: 0.003 },
          hint: ['Check $\\theta > \\sqrt\\gamma$, then use $(1 + \\theta)(1 + \\gamma/\\theta)$.', '$\\theta > \\sqrt\\gamma$ を確かめてから $(1 + \\theta)(1 + \\gamma/\\theta)$ を使います。'],
          sol: [[`$\\sqrt\\gamma = ${n(Math.sqrt(g), 3)} < ${n(th, 1)}$, so an outlier separates.`, `$\\sqrt\\gamma = ${n(Math.sqrt(g), 3)} < ${n(th, 1)}$ なので外れ値が離れます。`], [`$\\lambda = ${n(1 + th, 1)} \\times (1 + ${n(g / th, 4)}) = ${n(L0, 4)}$, above the true $${n(1 + th, 1)}$ by a factor $1 + \\gamma/\\theta$.`, `$\\lambda = ${n(1 + th, 1)} \\times (1 + ${n(g / th, 4)}) = ${n(L0, 4)}$ で、真の値 $${n(1 + th, 1)}$ より $1 + \\gamma/\\theta$ 倍大きくなります。`]],
          set: { g, th },
        };
      }
      const ov = (1 - g / (th * th)) / (1 + g / th);
      return {
        q: [`With $\\gamma = ${n(g, 2)}$ and $\\theta = ${n(th, 1)}$, what is the limiting squared overlap $|\\langle\\hat v, e_1\\rangle|^2$ of the top sample eigenvector with the true direction?`, `$\\gamma = ${n(g, 2)}$、$\\theta = ${n(th, 1)}$ のとき、最大の標本固有ベクトルと真の方向の重なりの 2 乗 $|\\langle\\hat v, e_1\\rangle|^2$ の極限はいくらですか。`],
        a: { type: 'num', v: ov, tol: 0.002 },
        hint: ['$(1 - \\gamma/\\theta^2)/(1 + \\gamma/\\theta)$.', '$(1 - \\gamma/\\theta^2)/(1 + \\gamma/\\theta)$ です。'],
        sol: [[`$1 - \\gamma/\\theta^2 = ${n(1 - g / (th * th), 4)}$ and $1 + \\gamma/\\theta = ${n(1 + g / th, 4)}$.`, `$1 - \\gamma/\\theta^2 = ${n(1 - g / (th * th), 4)}$、$1 + \\gamma/\\theta = ${n(1 + g / th, 4)}$ です。`], [`Overlap $${n(ov, 4)}$: the estimated direction is tilted by about $${n((Math.acos(Math.sqrt(ov)) * 180) / PI, 1)}^\\circ$ from the truth.`, `重なりは $${n(ov, 4)}$ で、推定した方向は真の方向から約 $${n((Math.acos(Math.sqrt(ov)) * 180) / PI, 1)}^\\circ$ 傾いています。`]],
        set: { g, th },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([100, 200, 500, 1000]), N = r.pick([400, 800, 2000, 5000]), g = p / N, th = Math.sqrt(g);
        return {
          q: [`With $p = ${p}$ variables and $n = ${N}$ samples, what is the smallest extra variance $\\theta$ whose direction produces a separated eigenvalue?`, `変数 $p = ${p}$、標本 $n = ${N}$ のとき、その方向が離れた固有値を生むような余分な分散 $\\theta$ の最小値はいくらですか。`],
          a: { type: 'num', v: th, rel: 0.003, show: `\\sqrt{${p}/${N}}` },
          hint: ['The BBP threshold is $\\theta = \\sqrt{p/n}$.', 'BBP のしきい値は $\\theta = \\sqrt{p/n}$ です。'],
          sol: [[`$\\gamma = ${p}/${N} = ${n(g, 4)}$.`, `$\\gamma = ${p}/${N} = ${n(g, 4)}$ です。`], [`$\\theta_c = \\sqrt\\gamma = ${n(th, 4)}$: weaker directions are invisible in the spectrum, however real.`, `$\\theta_c = \\sqrt\\gamma = ${n(th, 4)}$ です。それより弱い方向は、どれほど本物でもスペクトルには見えません。`]],
        };
      }
      if (form === 1) {
        const g = r.pick([0.1, 0.25, 0.5]), th = r.pick([1, 1.5, 2, 3]), lam = outl(th, g);
        return {
          q: [`An analyst sees a sample eigenvalue at $${n(lam, 4)}$ with $\\gamma = ${n(g, 2)}$. Assuming it is a BBP outlier, what is the true variance $1 + \\theta$ of that direction?`, `$\\gamma = ${n(g, 2)}$ のデータで、標本固有値が $${n(lam, 4)}$ に見えました。BBP の外れ値だと仮定すると、その方向の真の分散 $1 + \\theta$ はいくらですか。`],
          a: { type: 'num', v: 1 + th, rel: 0.003 },
          hint: ['Solve $\\lambda = (1 + \\theta)(1 + \\gamma/\\theta)$ for $\\theta$: a quadratic $\\theta^2 + (1 + \\gamma - \\lambda)\\theta + \\gamma = 0$.', '$\\lambda = (1 + \\theta)(1 + \\gamma/\\theta)$ を $\\theta$ について解きます。2 次方程式 $\\theta^2 + (1 + \\gamma - \\lambda)\\theta + \\gamma = 0$ です。'],
          sol: [[`$\\theta^2 + (1 + ${n(g, 2)} - ${n(lam, 4)})\\theta + ${n(g, 2)} = 0$; take the root above $\\sqrt\\gamma$.`, `$\\theta^2 + (1 + ${n(g, 2)} - ${n(lam, 4)})\\theta + ${n(g, 2)} = 0$ の、$\\sqrt\\gamma$ より大きい根をとります。`], [`$\\theta = ${n(th, 4)}$, so the true variance is $${n(1 + th, 4)}$, noticeably below the observed $${n(lam, 4)}$.`, `$\\theta = ${n(th, 4)}$ なので真の分散は $${n(1 + th, 4)}$ で、観測値 $${n(lam, 4)}$ よりはっきり小さくなります。`]],
          set: { g, th },
        };
      }
      return {
        q: ['As a function of the spike strength $\\theta$ (above threshold), write the limiting top eigenvalue for $\\gamma = 1/4$.', 'しきい値より上のスパイクの強さ $\\theta$ の関数として、$\\gamma = 1/4$ のときの最大固有値の極限を書いてください。'],
        a: { type: 'expr', v: '(1+t)*(1+1/(4*t))', vars: ['t'], dom: { t: [0.6, 4] }, lhs: ['$\\lambda(\\theta) =$ (write $t$ for $\\theta$)', '$\\lambda(\\theta) =$（$\\theta$ は $t$ と書きます）'] },
        hint: ['$(1 + \\theta)(1 + \\gamma/\\theta)$.', '$(1 + \\theta)(1 + \\gamma/\\theta)$ です。'],
        sol: [['The outlier sits at $(1 + \\theta)(1 + \\gamma/\\theta)$ for $\\theta > \\sqrt\\gamma$.', '$\\theta > \\sqrt\\gamma$ では外れ値は $(1 + \\theta)(1 + \\gamma/\\theta)$ にあります。'], ['With $\\gamma = 1/4$: $(1 + \\theta)(1 + \\frac{1}{4\\theta})$, which equals the edge $9/4$ exactly at $\\theta = 1/2$, where it touches the bulk.', '$\\gamma = 1/4$ では $(1 + \\theta)(1 + \\frac{1}{4\\theta})$ で、$\\theta = 1/2$ でちょうど端 $9/4$ に等しくなり、そこで塊に接します。']],
        set: { g: 0.25 },
      };
    },
  ];
})();
