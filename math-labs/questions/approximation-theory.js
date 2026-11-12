'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const uImag = (b) => 0.5 * Math.log(1 + b * b) + b * Math.atan(1 / b) - 1;     // potential of equally spaced nodes at ib
  const LEVEL = Math.LN2 - 1;

  /* ---------------- remez-equioscillation ---------------- */
  Q['remez-equioscillation'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.int(1, 12);
        return {
          q: [`A polynomial of degree at most $${d}$ is the best uniform approximation to a continuous function. At least how many points of alternating largest error must its error curve have?`, `次数 $${d}$ 以下の多項式が、ある連続関数の最良一様近似になっています。誤差曲線には、符号が交互になる最大誤差の点が少なくともいくつありますか。`],
          a: { type: 'int', v: d + 2 },
          hint: ['The equioscillation theorem asks for $n + 2$ points.', '等振動定理は $n + 2$ 個の点を要求します。'],
          sol: [['Chebyshev’s theorem: $p$ of degree at most $n$ is best exactly when $f - p$ attains $\\pm\\lVert f-p\\rVert_\\infty$ with alternating signs at $n+2$ points.', 'チェビシェフの定理：$n$ 次以下の $p$ が最良であるのは、$f-p$ が $n+2$ 個の点で符号を交互に変えながら $\\pm\\lVert f-p\\rVert_\\infty$ に達するときです。'], [`With $n = ${d}$ that is $${d + 2}$ points, one more than a polynomial of degree $${d}$ has coefficients.`, `$n = ${d}$ では $${d + 2}$ 個で、$${d}$ 次多項式の係数の個数より 1 つ多い数です。`]],
          ...(d <= 10 ? { set: { n: d, d: 0 } } : {}),
        };
      }
      if (form === 1) {
        const d = r.int(2, 9);
        return {
          q: [`How small can the largest error on $[-1,1]$ be when $x^{${d + 1}}$ is approximated by a polynomial of degree at most $${d}$? Give the exact value.`, `$[-1,1]$ で $x^{${d + 1}}$ を $${d}$ 次以下の多項式で近似するとき、最大誤差はどこまで小さくできますか。正確な値を答えてください。`],
          a: { type: 'num', v: 2 ** -d, rel: 1e-6, show: `2^{-${d}}` },
          hint: ['The error of the best approximation is a multiple of a Chebyshev polynomial.', '最良近似の誤差はチェビシェフ多項式の定数倍です。'],
          sol: [[`$T_{${d + 1}}(x)$ has leading coefficient $2^{${d}}$ and swings between $\\pm1$ at $${d + 2}$ points.`, `$T_{${d + 1}}(x)$ の最高次の係数は $2^{${d}}$ で、$${d + 2}$ 個の点で $\\pm1$ の間を振れます。`], [`So $x^{${d + 1}} - 2^{-${d}}T_{${d + 1}}(x)$ has degree $${d}$ and its error $2^{-${d}}T_{${d + 1}}$ equioscillates: $E_{${d}} = 2^{-${d}} = ${n(2 ** -d, 6)}$.`, `したがって $x^{${d + 1}} - 2^{-${d}}T_{${d + 1}}(x)$ は $${d}$ 次で、誤差 $2^{-${d}}T_{${d + 1}}$ は等振動します。$E_{${d}} = 2^{-${d}} = ${n(2 ** -d, 6)}$ です。`]],
        };
      }
      const c = r.int(1, 9), k = r.pick([2, 4]);
      return {
        q: [`What constant is the best uniform approximation (degree 0) to $f(x) = x^${k} + ${c}$ on $[-1,1]$?`, `$[-1,1]$ で $f(x) = x^${k} + ${c}$ を最もよく一様近似する定数（次数 0）はいくつですか。`],
        a: { type: 'num', v: c + 0.5, tol: 1e-9 },
        hint: ['Place the constant halfway between the smallest and largest values of $f$.', '定数を $f$ の最小値と最大値のちょうど中間に置きます。'],
        sol: [[`On $[-1,1]$ the function runs from $${c}$ (at $0$) to $${c + 1}$ (at $\\pm1$).`, `$[-1,1]$ で関数は $${c}$（$0$ で）から $${c + 1}$（$\\pm1$ で）まで動きます。`], [`The midpoint $${n(c + 0.5, 1)}$ leaves errors $-\\tfrac12, +\\tfrac12$ alternating at $-1, 0, 1$: two alternations would be enough for degree 0, so it is best, with $E_0 = \\tfrac12$.`, `中点 $${n(c + 0.5, 1)}$ では、誤差が $-1, 0, 1$ で交互に $\\pm\\tfrac12$ になります。次数 0 には 2 点の交代で十分なので、これが最良で、$E_0 = \\tfrac12$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 6), E = (a * a) / 8;
        return {
          q: [`Find the smallest possible largest error when $x^2$ is approximated by a straight line on $[0, ${a}]$.`, `$[0, ${a}]$ で $x^2$ を直線で近似するとき、最大誤差の最小値を求めてください。`],
          a: { type: 'num', v: E, rel: 1e-6, show: a * a % 8 === 0 ? String(E) : `\\tfrac{${a * a}}{8}` },
          hint: ['For a convex function the best line is parallel to the chord, halfway between the chord and the parallel tangent.', '凸関数では、最良の直線は弦に平行で、弦とそれに平行な接線のちょうど中間にあります。'],
          sol: [[`The chord from $(0,0)$ to $(${a}, ${a * a})$ has slope $${a}$; the tangent with that slope touches at $x = ${n(a / 2, 1)}$.`, `$(0,0)$ から $(${a}, ${a * a})$ への弦の傾きは $${a}$ で、その傾きの接線は $x = ${n(a / 2, 1)}$ で接します。`], [`There the chord is above the curve by $${a}\\cdot${n(a / 2, 1)} - ${n((a * a) / 4, 2)} = ${n((a * a) / 4, 2)}$.`, `そこでは弦が曲線より $${a}\\cdot${n(a / 2, 1)} - ${n((a * a) / 4, 2)} = ${n((a * a) / 4, 2)}$ だけ上にあります。`], [`The best line splits this gap evenly: $E_1 = ${n(E, 4)}$, with three alternations at $0$, $${n(a / 2, 1)}$, $${a}$.`, `最良の直線はこの差を二等分します。$E_1 = ${n(E, 4)}$ で、$0$、$${n(a / 2, 1)}$、$${a}$ の 3 点で交代します。`]],
        };
      }
      if (form === 1) {
        const a = r.pick([1, 4, 9, 16, 25]), E = Math.sqrt(a) / 8;
        return {
          q: [`Find $E_1$, the error of the best straight-line approximation to $\\sqrt{x}$ on $[0, ${a}]$.`, `$[0, ${a}]$ で $\\sqrt{x}$ を直線で最もよく近似したときの誤差 $E_1$ を求めてください。`],
          a: { type: 'num', v: E, rel: 1e-6 },
          hint: ['Chord slope, parallel tangent, then halve the gap.', '弦の傾き、それに平行な接線、そして差を半分にします。'],
          sol: [[`The chord has slope $1/${Math.sqrt(a)}$; $\\tfrac{1}{2\\sqrt{c}}$ equals it at $c = ${n(a / 4, 2)}$.`, `弦の傾きは $1/${Math.sqrt(a)}$ で、$\\tfrac{1}{2\\sqrt{c}}$ がそれに等しくなるのは $c = ${n(a / 4, 2)}$ です。`], [`At $c$ the curve is $${n(Math.sqrt(a) / 2, 3)}$ and the chord is $${n(Math.sqrt(a) / 4, 3)}$, a gap of $${n(Math.sqrt(a) / 4, 3)}$.`, `$c$ で曲線は $${n(Math.sqrt(a) / 2, 3)}$、弦は $${n(Math.sqrt(a) / 4, 3)}$ で、差は $${n(Math.sqrt(a) / 4, 3)}$ です。`], [`Half of it: $E_1 = ${n(E, 4)}$.`, `その半分で $E_1 = ${n(E, 4)}$ です。`]],
        };
      }
      const d = r.int(2, 7), c = r.nz(-6, 6), E = Math.abs(c) * 2 ** -d;
      return {
        q: [`What is $E_{${d}}(f)$ on $[-1,1]$ for $f(x) = ${c}x^{${d + 1}} + x^{${d - 1}} - 2$?`, `$f(x) = ${c}x^{${d + 1}} + x^{${d - 1}} - 2$ について、$[-1,1]$ での $E_{${d}}(f)$ はいくらですか。`],
        a: { type: 'num', v: E, rel: 1e-6 },
        hint: [`Terms of degree at most $${d}$ can be matched exactly; only the top term matters.`, `$${d}$ 次以下の項は正確に合わせられます。効くのは最高次の項だけです。`],
        sol: [[`The lower terms $x^{${d - 1}} - 2$ are themselves polynomials of degree at most $${d}$, so they cost nothing.`, `低い次数の項 $x^{${d - 1}} - 2$ はそれ自体が $${d}$ 次以下の多項式なので、誤差に寄与しません。`], [`$E_{${d}}(x^{${d + 1}}) = 2^{-${d}}$, and scaling by $${c}$ scales the error by $${Math.abs(c)}$.`, `$E_{${d}}(x^{${d + 1}}) = 2^{-${d}}$ で、$${c}$ 倍すると誤差は $${Math.abs(c)}$ 倍になります。`], [`$E_{${d}}(f) = ${Math.abs(c)}\\cdot 2^{-${d}} = ${n(E, 6)}$.`, `$E_{${d}}(f) = ${Math.abs(c)}\\cdot 2^{-${d}} = ${n(E, 6)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.nz(-5, 5) * 4, a = r.int(-4, 4), b = r.int(-5, 5);
        const lin = (3 * c) / 4 + a;
        return {
          q: [`Find the best uniform approximation of degree at most 2 on $[-1,1]$ to $f(x) = ${c}x^3 ${a < 0 ? '-' : '+'} ${Math.abs(a)}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$.`, `$[-1,1]$ で $f(x) = ${c}x^3 ${a < 0 ? '-' : '+'} ${Math.abs(a)}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ の、次数 2 以下の最良一様近似を求めてください。`],
          a: { type: 'expr', v: `${lin}*x+(${b})`, vars: ['x'], dom: { x: [-1, 1] }, lhs: ['$p^{*}(x) =$', '$p^{*}(x) =$'] },
          hint: ['Subtract the multiple of $T_3(x) = 4x^3 - 3x$ that removes the cubic term.', '3 次の項を消すように $T_3(x) = 4x^3 - 3x$ の定数倍を引きます。'],
          sol: [[`$${c}x^3 = ${c / 4}\\,T_3(x) + ${(3 * c) / 4}x$, because $x^3 = \\tfrac14T_3 + \\tfrac34x$.`, `$x^3 = \\tfrac14T_3 + \\tfrac34x$ なので、$${c}x^3 = ${c / 4}\\,T_3(x) + ${(3 * c) / 4}x$ です。`], [`So $f = ${c / 4}\\,T_3(x) + ${lin}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$; dropping the $T_3$ term leaves an error that equioscillates at 4 points.`, `よって $f = ${c / 4}\\,T_3(x) + ${lin}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ です。$T_3$ の項を除くと、残る誤差は 4 点で等振動します。`], [`The best polynomial is $${lin}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ (no quadratic term, since $f$ minus a constant is odd), with error $${Math.abs(c) / 4}$.`, `最良の多項式は $${lin}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ で（$f$ から定数を引くと奇関数なので 2 次の項はありません）、誤差は $${Math.abs(c) / 4}$ です。`]],
        };
      }
      if (form === 1) {
        const k = r.int(3, 9), tol = 10 ** -k, need = Math.ceil(k / Math.log10(2) - 1e-9);
        const d = 2 ** -need <= tol ? need : need + 1;
        return {
          q: [`What is the smallest degree $n$ for which $x^{n+1}$ can be approximated on $[-1,1]$ by a polynomial of degree at most $n$ with largest error at most $10^{-${k}}$?`, `$[-1,1]$ で $x^{n+1}$ を $n$ 次以下の多項式で近似して、最大誤差を $10^{-${k}}$ 以下にできる最小の次数 $n$ はいくつですか。`],
          a: { type: 'int', v: d },
          hint: ['$E_n(x^{n+1}) = 2^{-n}$.', '$E_n(x^{n+1}) = 2^{-n}$ です。'],
          sol: [[`We need $2^{-n} \\le 10^{-${k}}$, that is $n \\ge ${k}/\\log_{10}2 = ${n(k / Math.log10(2), 2)}$.`, `$2^{-n} \\le 10^{-${k}}$、すなわち $n \\ge ${k}/\\log_{10}2 = ${n(k / Math.log10(2), 2)}$ が必要です。`], [`The smallest such integer is $n = ${d}$: each extra degree gains one binary digit, about 0.3 decimal digits.`, `これを満たす最小の整数は $n = ${d}$ です。次数が 1 上がるごとに 2 進で 1 桁、10 進でおよそ 0.3 桁を得ます。`]],
        };
      }
      const pts = r.int(3, 9), deg = r.int(1, 8), best = pts >= deg + 2;
      return {
        q: [`A polynomial $p$ of degree $${deg}$ approximates $f$ on $[-1,1]$, and the error $f - p$ reaches $\\pm\\lVert f-p\\rVert_\\infty$ with alternating signs at exactly $${pts}$ points. What can you conclude?`, `$${deg}$ 次の多項式 $p$ が $[-1,1]$ で $f$ を近似していて、誤差 $f-p$ がちょうど $${pts}$ 個の点で符号を交互に変えながら $\\pm\\lVert f-p\\rVert_\\infty$ に達しています。何が言えますか。`],
        a: { type: 'choice', fixed: true, opts: [[`$p$ is the best approximation of degree at most $${deg}$`, `$p$ は $${deg}$ 次以下の最良近似である`], [`$p$ is not the best approximation of degree at most $${deg}$`, `$p$ は $${deg}$ 次以下の最良近似ではない`], ['Nothing can be said without knowing $f$', '$f$ が分からないと何も言えない']], v: best ? 0 : 1 },
        hint: ['Compare the number of alternations with $n + 2$. The theorem is an “if and only if”.', '交代の回数を $n + 2$ と比べます。定理は必要十分条件です。'],
        sol: [[`Degree $${deg}$ needs $${deg + 2}$ alternations.`, `次数 $${deg}$ には $${deg + 2}$ 回の交代が必要です。`], [best ? `There are $${pts} \\ge ${deg + 2}$, so $p$ is the unique best approximation${pts > deg + 2 ? `, and it is also best among polynomials of degree up to $${pts - 2}$` : ''}.` : `There are only $${pts} < ${deg + 2}$, so some polynomial of degree at most $${deg}$ has a smaller largest error.`, best ? `$${pts} \\ge ${deg + 2}$ 回あるので、$p$ はただ一つの最良近似です${pts > deg + 2 ? `。さらに $${pts - 2}$ 次以下の多項式の中でも最良です` : ''}。` : `$${pts} < ${deg + 2}$ 回しかないので、$${deg}$ 次以下で最大誤差がより小さい多項式があります。`]],
      };
    },
  ];

  /* ---------------- bernstein-weierstrass ---------------- */
  Q['bernstein-weierstrass'] = [
    (r) => {
      const form = r.int(0, 1), N = r.pick([4, 9, 16, 25, 36, 64, 100, 144]), x = r.pick([0.1, 0.2, 0.5, 0.8, 0.9]);
      if (form === 0) {
        const sd = Math.sqrt((x * (1 - x)) / N);
        return {
          q: [`A coin with heads probability $x = ${n(x, 1)}$ is tossed $n = ${N}$ times. What is the standard deviation of the fraction of heads?`, `表の出る確率が $x = ${n(x, 1)}$ のコインを $n = ${N}$ 回投げます。表の割合の標準偏差はいくらですか。`],
          a: { type: 'num', v: sd, rel: 0.005 },
          hint: ['$\\sqrt{x(1-x)/n}$.', '$\\sqrt{x(1-x)/n}$ です。'],
          sol: [[`The variance of $S_n/n$ is $x(1-x)/n = ${n(x * (1 - x), 2)}/${N}$.`, `$S_n/n$ の分散は $x(1-x)/n = ${n(x * (1 - x), 2)}/${N}$ です。`], [`Its square root is $${n(sd, 4)}$: the width of the window over which $B_nf$ averages $f$.`, `その平方根は $${n(sd, 4)}$ で、$B_nf$ が $f$ を平均する窓の幅です。`]],
          set: { n: N, x },
        };
      }
      const a = r.nz(-5, 5), b = r.int(-5, 5), v = a * x + b;
      return {
        q: [`For $f(t) = ${a}t ${b < 0 ? '-' : '+'} ${Math.abs(b)}$, what is $B_{${N}}f(${n(x, 1)})$?`, `$f(t) = ${a}t ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ のとき、$B_{${N}}f(${n(x, 1)})$ はいくらですか。`],
        a: { type: 'num', v, tol: 1e-6 },
        hint: ['The mean of $S_n/n$ is $x$.', '$S_n/n$ の平均は $x$ です。'],
        sol: [['$B_nf(x) = \\mathbb{E}f(S_n/n)$, and expectation is linear with $\\mathbb{E}[S_n/n] = x$.', '$B_nf(x) = \\mathbb{E}f(S_n/n)$ で、期待値は線形で $\\mathbb{E}[S_n/n] = x$ です。'], [`So Bernstein polynomials reproduce straight lines for every $n$: $${a}\\cdot${n(x, 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${n(v, 2)}$.`, `したがってベルンシュタイン多項式はどの $n$ でも 1 次式を再現します。$${a}\\cdot${n(x, 1)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${n(v, 2)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const N = r.pick([2, 4, 5, 8, 10, 20, 50]), x = r.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75]), v = x * x + (x * (1 - x)) / N;
        return {
          q: [`Compute $B_{${N}}f(${n(x, 2)})$ for $f(t) = t^2$.`, `$f(t) = t^2$ について $B_{${N}}f(${n(x, 2)})$ を計算してください。`],
          a: { type: 'num', v, rel: 0.002 },
          hint: ['$\\mathbb{E}[(S_n/n)^2] = x^2 + \\operatorname{Var}(S_n/n)$.', '$\\mathbb{E}[(S_n/n)^2] = x^2 + \\operatorname{Var}(S_n/n)$ です。'],
          sol: [['$B_n(t^2)(x) = x^2 + x(1-x)/n$: the mean square is the squared mean plus the variance.', '$B_n(t^2)(x) = x^2 + x(1-x)/n$ です。二乗の平均は、平均の二乗に分散を加えたものです。'], [`$${n(x * x, 4)} + ${n(x * (1 - x), 4)}/${N} = ${n(v, 5)}$, above $f(x) = ${n(x * x, 4)}$ because $t^2$ is convex.`, `$${n(x * x, 4)} + ${n(x * (1 - x), 4)}/${N} = ${n(v, 5)}$ で、$t^2$ が凸なので $f(x) = ${n(x * x, 4)}$ より上になります。`]],
        };
      }
      const f0 = r.int(-4, 6), f1 = r.int(-4, 6), f2 = r.int(-4, 6), x = r.pick([0.25, 0.5, 0.75]), v = f0 * (1 - x) ** 2 + 2 * f1 * x * (1 - x) + f2 * x * x;
      return {
        q: [`A function has $f(0) = ${f0}$, $f(\\tfrac12) = ${f1}$, $f(1) = ${f2}$. What is $B_2f(${n(x, 2)})$?`, `ある関数が $f(0) = ${f0}$、$f(\\tfrac12) = ${f1}$、$f(1) = ${f2}$ を満たします。$B_2f(${n(x, 2)})$ はいくらですか。`],
        a: { type: 'num', v, tol: 1e-6 },
        hint: ['Weights $(1-x)^2,\\ 2x(1-x),\\ x^2$.', '重みは $(1-x)^2,\\ 2x(1-x),\\ x^2$ です。'],
        sol: [[`The binomial weights at $x = ${n(x, 2)}$ are $${n((1 - x) ** 2, 4)},\\ ${n(2 * x * (1 - x), 4)},\\ ${n(x * x, 4)}$.`, `$x = ${n(x, 2)}$ での二項分布の重みは $${n((1 - x) ** 2, 4)},\\ ${n(2 * x * (1 - x), 4)},\\ ${n(x * x, 4)}$ です。`], [`$B_2f = ${f0}\\cdot${n((1 - x) ** 2, 4)} + ${f1}\\cdot${n(2 * x * (1 - x), 4)} + ${f2}\\cdot${n(x * x, 4)} = ${n(v, 4)}$. This is a quadratic Bézier curve with control values $${f0}, ${f1}, ${f2}$.`, `$B_2f = ${f0}\\cdot${n((1 - x) ** 2, 4)} + ${f1}\\cdot${n(2 * x * (1 - x), 4)} + ${f2}\\cdot${n(x * x, 4)} = ${n(v, 4)}$ です。これは制御値 $${f0}, ${f1}, ${f2}$ をもつ 2 次ベジエ曲線です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(2, 12);
        return {
          q: [`Write $B_{${N}}f(x)$ for $f(t) = t^2$ as a polynomial in $x$.`, `$f(t) = t^2$ について、$B_{${N}}f(x)$ を $x$ の多項式として書いてください。`],
          a: { type: 'expr', v: `x^2+x*(1-x)/${N}`, vars: ['x'], dom: { x: [0, 1] }, lhs: [`$B_{${N}}f(x) =$`, `$B_{${N}}f(x) =$`] },
          hint: ['Mean square equals squared mean plus variance of $S_n/n$.', '二乗の平均は、$S_n/n$ の平均の二乗に分散を加えたものです。'],
          sol: [['$\\mathbb{E}[(S_n/n)^2] = x^2 + x(1-x)/n$.', '$\\mathbb{E}[(S_n/n)^2] = x^2 + x(1-x)/n$ です。'], [`With $n = ${N}$: $x^2 + \\dfrac{x(1-x)}{${N}} = \\dfrac{${N - 1}}{${N}}x^2 + \\dfrac{1}{${N}}x$. The error $x(1-x)/${N}$ is largest, $\\tfrac{1}{${4 * N}}$, at $x = \\tfrac12$.`, `$n = ${N}$ では $x^2 + \\dfrac{x(1-x)}{${N}} = \\dfrac{${N - 1}}{${N}}x^2 + \\dfrac{1}{${N}}x$ です。誤差 $x(1-x)/${N}$ は $x = \\tfrac12$ で最大値 $\\tfrac{1}{${4 * N}}$ をとります。`]],
        };
      }
      if (form === 1) {
        const k = r.int(2, 5), eps = 10 ** -k, N = Math.ceil(1 / (4 * eps) - 1e-9);
        return {
          q: [`For $f(t) = t^2$, what is the smallest $n$ with $\\lVert f - B_nf\\rVert_\\infty \\le 10^{-${k}}$ on $[0,1]$?`, `$f(t) = t^2$ について、$[0,1]$ で $\\lVert f - B_nf\\rVert_\\infty \\le 10^{-${k}}$ となる最小の $n$ はいくつですか。`],
          a: { type: 'int', v: N },
          hint: ['The error is $x(1-x)/n$, largest at $x = \\tfrac12$.', '誤差は $x(1-x)/n$ で、$x = \\tfrac12$ で最大です。'],
          sol: [['$B_nf - f = x(1-x)/n$, with maximum $1/(4n)$.', '$B_nf - f = x(1-x)/n$ で、最大値は $1/(4n)$ です。'], [`$1/(4n) \\le 10^{-${k}}$ gives $n \\ge ${N}$. A parabola, which a degree-2 polynomial matches exactly, needs degree $${N}$ this way: the price of the Bernstein construction.`, `$1/(4n) \\le 10^{-${k}}$ から $n \\ge ${N}$ です。2 次多項式なら正確に表せる放物線に、この方法では次数 $${N}$ が必要です。これがベルンシュタインの構成の代償です。`]],
        };
      }
      const m = r.int(3, 5);
      return {
        q: [`By Voronovskaya’s theorem, $n\\bigl(B_nf(x) - f(x)\\bigr) \\to \\tfrac12x(1-x)f''(x)$. Find this limit for $f(t) = t^${m}$.`, `ヴォロノフスカヤの定理により $n\\bigl(B_nf(x) - f(x)\\bigr) \\to \\tfrac12x(1-x)f''(x)$ です。$f(t) = t^${m}$ についてこの極限を求めてください。`],
        a: { type: 'expr', v: `${(m * (m - 1)) / 2}*x^${m - 1}*(1-x)`, vars: ['x'], dom: { x: [0.05, 0.95] } },
        hint: [`$f''(x) = ${m * (m - 1)}x^{${m - 2}}$.`, `$f''(x) = ${m * (m - 1)}x^{${m - 2}}$ です。`],
        sol: [[`$f''(x) = ${m * (m - 1)}x^{${m - 2}}$.`, `$f''(x) = ${m * (m - 1)}x^{${m - 2}}$ です。`], [`$\\tfrac12x(1-x)\\cdot${m * (m - 1)}x^{${m - 2}} = ${(m * (m - 1)) / 2}x^{${m - 1}}(1-x)$: the error is of order $1/n$ and has the sign of the curvature.`, `$\\tfrac12x(1-x)\\cdot${m * (m - 1)}x^{${m - 2}} = ${(m * (m - 1)) / 2}x^{${m - 1}}(1-x)$ です。誤差は $1/n$ の大きさで、曲率と同じ符号をもちます。`]],
      };
    },
  ];

  /* ---------------- runge-potential ---------------- */
  Q['runge-potential'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const b = r.step(0.1, 1.1, 0.1), rho = b + Math.sqrt(1 + b * b);
        return {
          q: [`A function has its nearest singularities at $\\pm ${n(b, 1)}i$. What is the parameter $\\rho$ of the Bernstein ellipse through them? Three decimals.`, `ある関数の最も近い特異点が $\\pm ${n(b, 1)}i$ にあります。そこを通るベルンシュタイン楕円のパラメータ $\\rho$ はいくらですか。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: rho, tol: 0.0006 },
          hint: ['$\\rho = |z + \\sqrt{z^2 - 1}|$ with $z = ib$.', '$z = ib$ として $\\rho = |z + \\sqrt{z^2 - 1}|$ です。'],
          sol: [[`$z^2 - 1 = -(1 + ${n(b * b, 2)})$, so $\\sqrt{z^2-1} = i\\sqrt{${n(1 + b * b, 2)}}$.`, `$z^2 - 1 = -(1 + ${n(b * b, 2)})$ なので $\\sqrt{z^2-1} = i\\sqrt{${n(1 + b * b, 2)}}$ です。`], [`$\\rho = ${n(b, 1)} + \\sqrt{${n(1 + b * b, 2)}} = ${n(rho, 4)}$: Chebyshev interpolants gain this factor in accuracy with every degree.`, `$\\rho = ${n(b, 1)} + \\sqrt{${n(1 + b * b, 2)}} = ${n(rho, 4)}$ です。チェビシェフ補間は次数が 1 上がるごとにこの倍率で精度を上げます。`]],
          set: { nodes: 1, a: 0, b },
        };
      }
      const x0 = r.step(1.05, 1.5, 0.05), rho = x0 + Math.sqrt(x0 * x0 - 1);
      return {
        q: [`$f(x) = 1/(x - ${n(x0, 2)})$ has a pole on the real axis just outside $[-1,1]$. What is $\\rho$ for it? Three decimals.`, `$f(x) = 1/(x - ${n(x0, 2)})$ は、実軸上で $[-1,1]$ のすぐ外に極をもちます。その $\\rho$ はいくらですか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: rho, tol: 0.0006 },
        hint: ['$\\rho = x_0 + \\sqrt{x_0^2 - 1}$.', '$\\rho = x_0 + \\sqrt{x_0^2 - 1}$ です。'],
        sol: [[`$\\sqrt{${n(x0, 2)}^2 - 1} = ${n(Math.sqrt(x0 * x0 - 1), 4)}$.`, `$\\sqrt{${n(x0, 2)}^2 - 1} = ${n(Math.sqrt(x0 * x0 - 1), 4)}$ です。`], [`$\\rho = ${n(rho, 4)}$. A pole at distance $d$ beyond the end gives $\\rho \\approx 1 + \\sqrt{2d}$, far better than the distance alone suggests.`, `$\\rho = ${n(rho, 4)}$ です。端から距離 $d$ だけ外にある極では $\\rho \\approx 1 + \\sqrt{2d}$ となり、距離だけから想像するよりずっと良い値です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const b = r.step(0.1, 1, 0.1), rho = b + Math.sqrt(1 + b * b), k = r.int(6, 14), N = Math.ceil((k * Math.LN10) / Math.log(rho) - 1e-9);
        return {
          q: [`With Chebyshev nodes and poles at $\\pm ${n(b, 1)}i$ the error falls like $\\rho^{-n}$. About what degree makes $\\rho^{-n} \\le 10^{-${k}}$? Give the smallest integer.`, `チェビシェフ点を使い、極が $\\pm ${n(b, 1)}i$ にあるとき、誤差は $\\rho^{-n}$ のように減ります。$\\rho^{-n} \\le 10^{-${k}}$ となる次数はおよそいくつですか。最小の整数を答えてください。`],
          a: { type: 'int', v: N },
          hint: ['$n \\ge k\\ln 10/\\ln\\rho$.', '$n \\ge k\\ln 10/\\ln\\rho$ です。'],
          sol: [[`$\\rho = ${n(b, 1)} + \\sqrt{${n(1 + b * b, 2)}} = ${n(rho, 4)}$, so $\\ln\\rho = ${n(Math.log(rho), 4)}$.`, `$\\rho = ${n(b, 1)} + \\sqrt{${n(1 + b * b, 2)}} = ${n(rho, 4)}$ なので $\\ln\\rho = ${n(Math.log(rho), 4)}$ です。`], [`$n \\ge ${k}\\times 2.3026/${n(Math.log(rho), 4)} = ${n((k * Math.LN10) / Math.log(rho), 2)}$, so $n = ${N}$.`, `$n \\ge ${k}\\times 2.3026/${n(Math.log(rho), 4)} = ${n((k * Math.LN10) / Math.log(rho), 2)}$ なので $n = ${N}$ です。`]],
          set: { nodes: 1, a: 0, b, n: Math.min(60, 2 * Math.round(N / 2)) },
        };
      }
      const b = r.step(0.1, 0.5, 0.05), u = uImag(b), fac = Math.exp(LEVEL - u);
      return {
        q: [`For equally spaced nodes the potential on the imaginary axis is $u(ib) = \\tfrac12\\ln(1+b^2) + b\\arctan(1/b) - 1$, and at the ends of the interval $u(\\pm1) = \\ln 2 - 1$. For poles at $\\pm ${n(b, 2)}i$, by what factor does the error near the ends grow per degree? Three decimals.`, `等間隔の点では、虚軸上のポテンシャルは $u(ib) = \\tfrac12\\ln(1+b^2) + b\\arctan(1/b) - 1$、区間の端では $u(\\pm1) = \\ln 2 - 1$ です。極が $\\pm ${n(b, 2)}i$ にあるとき、端の近くの誤差は次数 1 ごとに何倍になりますか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: fac, tol: 0.0015 },
        hint: ['The factor is $e^{u(\\pm1) - u(ib)}$.', '倍率は $e^{u(\\pm1) - u(ib)}$ です。'],
        sol: [[`$u(${n(b, 2)}i) = ${n(0.5 * Math.log(1 + b * b), 4)} + ${n(b * Math.atan(1 / b), 4)} - 1 = ${n(u, 4)}$.`, `$u(${n(b, 2)}i) = ${n(0.5 * Math.log(1 + b * b), 4)} + ${n(b * Math.atan(1 / b), 4)} - 1 = ${n(u, 4)}$ です。`], [`$u(\\pm1) = ${n(LEVEL, 4)}$, so the exponent is $${n(LEVEL - u, 4)}$ per degree.`, `$u(\\pm1) = ${n(LEVEL, 4)}$ なので、指数は次数 1 あたり $${n(LEVEL - u, 4)}$ です。`], [`$e^{${n(LEVEL - u, 4)}} = ${n(fac, 4)} > 1$: the interpolants diverge near the ends, Runge’s phenomenon.`, `$e^{${n(LEVEL - u, 4)}} = ${n(fac, 4)} > 1$ で、補間多項式は端の近くで発散します。これがルンゲ現象です。`]],
        set: { nodes: 0, a: 0, b: Math.round(b * 50) / 50 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rho = r.pick([1.5, 2, 2.5, 3, 4, 5]), b = (rho - 1 / rho) / 2;
        return {
          q: [`A function has poles at $\\pm ib$ and its Chebyshev interpolation error falls by a factor $${rho}$ with every extra degree. Find $b$.`, `ある関数が $\\pm ib$ に極をもち、チェビシェフ補間の誤差は次数が 1 上がるごとに $${rho}$ 分の 1 になります。$b$ を求めてください。`],
          a: { type: 'num', v: b, rel: 0.002 },
          hint: ['Invert $\\rho = b + \\sqrt{1 + b^2}$: note $1/\\rho = \\sqrt{1+b^2} - b$.', '$\\rho = b + \\sqrt{1 + b^2}$ を逆に解きます。$1/\\rho = \\sqrt{1+b^2} - b$ に注意します。'],
          sol: [['$\\rho - 1/\\rho = 2b$, because $(\\sqrt{1+b^2}+b)(\\sqrt{1+b^2}-b) = 1$.', '$(\\sqrt{1+b^2}+b)(\\sqrt{1+b^2}-b) = 1$ なので $\\rho - 1/\\rho = 2b$ です。'], [`$b = \\tfrac12(${rho} - ${n(1 / rho, 4)}) = ${n(b, 4)}$: this is the semi-minor axis of the Bernstein ellipse, whose semi-major axis is $\\tfrac12(\\rho + 1/\\rho) = ${n((rho + 1 / rho) / 2, 4)}$.`, `$b = \\tfrac12(${rho} - ${n(1 / rho, 4)}) = ${n(b, 4)}$ です。これはベルンシュタイン楕円の短半径で、長半径は $\\tfrac12(\\rho + 1/\\rho) = ${n((rho + 1 / rho) / 2, 4)}$ です。`]],
        };
      }
      if (form === 1) {
        const b = r.pick([0.1, 0.2, 0.3, 0.4, 0.45, 0.6, 0.7, 0.9, 1.0]), conv = b > 0.5255249;
        return {
          q: [`$f(x) = 1/(x^2 + ${n(b * b, 4)})$ is interpolated at equally spaced points on $[-1,1]$, more and more of them. The critical level curve of the node potential crosses the imaginary axis at $\\pm 0.5255i$. What happens?`, `$f(x) = 1/(x^2 + ${n(b * b, 4)})$ を $[-1,1]$ の等間隔の点で、点を増やしながら補間します。点のポテンシャルの臨界の等高線は虚軸と $\\pm 0.5255i$ で交わります。何が起こりますか。`],
          a: { type: 'choice', fixed: true, opts: [['The interpolants converge on the whole interval', '補間多項式は区間全体で収束する'], ['They diverge near the ends but converge near the middle', '端の近くで発散し、中央の近くでは収束する'], ['They diverge everywhere', 'いたるところで発散する']], v: conv ? 0 : 1 },
          hint: [`The poles are at $\\pm ${n(b, 2)}i$. Are they inside the critical curve?`, `極は $\\pm ${n(b, 2)}i$ にあります。臨界の曲線の内側でしょうか。`],
          sol: [[`The poles $\\pm ${n(b, 2)}i$ have potential $u = ${n(uImag(b), 4)}$; the ends of the interval have $u(\\pm1) = ${n(LEVEL, 4)}$ and the middle has $u(0) = -1$.`, `極 $\\pm ${n(b, 2)}i$ のポテンシャルは $u = ${n(uImag(b), 4)}$ です。区間の端は $u(\\pm1) = ${n(LEVEL, 4)}$、中央は $u(0) = -1$ です。`], [conv ? 'The poles are above every point of the interval, so the error $e^{n(u(x)-u(z_0))}$ tends to zero everywhere on it.' : 'The poles are below the ends but above the middle, so the error grows where $u(x) > u(z_0)$, near the ends, and still shrinks around the middle.', conv ? '極は区間のどの点よりも上にあるので、誤差 $e^{n(u(x)-u(z_0))}$ は区間のいたるところで 0 に近づきます。' : '極は端より下、中央より上にあるので、$u(x) > u(z_0)$ となる端の近くでは誤差が増大し、中央のまわりでは減り続けます。']],
          set: { nodes: 0, a: 0, b: Math.round(b * 50) / 50, n: 30 },
        };
      }
      const rho = r.pick([1.5, 2, 3, 4]);
      return {
        q: [`The Bernstein ellipse with parameter $\\rho = ${rho}$ has foci $\\pm1$. At what point does it cross the positive real axis?`, `パラメータ $\\rho = ${rho}$ のベルンシュタイン楕円の焦点は $\\pm1$ です。この楕円が正の実軸と交わる点を答えてください。`],
        a: { type: 'num', v: (rho + 1 / rho) / 2, rel: 0.002 },
        hint: ['The ellipse is the image of the circle $|w| = \\rho$ under $z = \\tfrac12(w + 1/w)$.', 'この楕円は、$z = \\tfrac12(w + 1/w)$ による円 $|w| = \\rho$ の像です。'],
        sol: [[`Put $w = \\rho$: $z = \\tfrac12(${rho} + ${n(1 / rho, 4)}) = ${n((rho + 1 / rho) / 2, 4)}$.`, `$w = \\rho$ とすると $z = \\tfrac12(${rho} + ${n(1 / rho, 4)}) = ${n((rho + 1 / rho) / 2, 4)}$ です。`], [`The semi-axes are $\\tfrac12(\\rho \\pm 1/\\rho)$ and their sum is $\\rho$ itself: a function analytic inside this ellipse is approximated with error of order $${rho}^{-n}$.`, `半径は $\\tfrac12(\\rho \\pm 1/\\rho)$ で、その和は $\\rho$ そのものです。この楕円の内部で解析的な関数は、$${rho}^{-n}$ 程度の誤差で近似できます。`]],
        set: { nodes: 1 },
      };
    },
  ];
})();
