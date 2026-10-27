'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, frac } = P.util;
  const PI = Math.PI;
  const HS = Array.from({ length: 24 }, (_, i) => Number(((i + 1) * 0.025).toFixed(3)));
  const RE = (z) => 1 + z, RK = (z) => 1 + z + z * z / 2 + z ** 3 / 6 + z ** 4 / 24, RB = (z) => 1 / (1 - z);
  const pow10 = (e) => `10^{-${e}}`;

  /* ---------- 1. stability on y' = -5y ---------- */
  Q.ode = [
    (r) => {
      const form = r.int(0, 2), h = r.pick(HS);
      if (form === 0) return {
        q: [`Explicit Euler on $y' = -5y$ with step $h = ${n(h)}$: by what factor is $y$ multiplied each step?`, `$y' = -5y$ に刻み $h = ${n(h)}$ の陽的オイラー法を使います。$y$ は毎ステップ何倍されますか。`],
        a: { type: 'num', v: RE(-5 * h), tol: 1e-9 },
        hint: ['$y_{n+1} = y_n + h f(y_n)$ with $f(y) = -5y$.', '$y_{n+1} = y_n + h f(y_n)$、$f(y) = -5y$ です。'],
        sol: [[`$y_{n+1} = y_n - 5h\\,y_n = (1 - ${n(5 * h)})y_n = ${n(1 - 5 * h)}\\,y_n$.`, `$y_{n+1} = y_n - 5h\\,y_n = (1 - ${n(5 * h)})y_n = ${n(1 - 5 * h)}\\,y_n$ です。`], [Math.abs(1 - 5 * h) < 1 ? (1 - 5 * h < 0 ? 'Negative but smaller than 1 in size: the numerical solution decays while flipping sign, unlike the true one.' : 'Between 0 and 1: decay without oscillation, like the true factor $e^{-5h} = ' + n(Math.exp(-5 * h), 4) + '$.') : 'Size at least 1: the numerical solution does not decay although the true one does. Explicit Euler is unstable here.', Math.abs(1 - 5 * h) < 1 ? (1 - 5 * h < 0 ? '負ですが絶対値は 1 より小さいので、数値解は符号を変えながら減衰します。真の解とは違います。' : '0 と 1 の間なので、真の倍率 $e^{-5h} = ' + n(Math.exp(-5 * h), 4) + '$ と同じく振動せずに減衰します。') : '絶対値が 1 以上なので、真の解は減衰するのに数値解は減衰しません。ここでは陽的オイラー法は不安定です。']],
        set: { h },
      };
      if (form === 1) return {
        q: [`Implicit Euler on $y' = -5y$ with $h = ${n(h)}$: what is the factor per step?`, `$y' = -5y$ に $h = ${n(h)}$ の陰的オイラー法を使います。1ステップあたりの倍率はいくつですか。`],
        a: { type: 'num', v: RB(-5 * h), show: frac(1000, Math.round(1000 * (1 + 5 * h))) },
        hint: ['Implicit Euler evaluates $f$ at the new point: $y_{n+1} = y_n + h f(y_{n+1})$.', '陰的オイラー法は新しい点で $f$ を評価します。$y_{n+1} = y_n + h f(y_{n+1})$ です。'],
        sol: [[`$y_{n+1} = y_n - 5h\\,y_{n+1}$, so $(1 + ${n(5 * h)})y_{n+1} = y_n$.`, `$y_{n+1} = y_n - 5h\\,y_{n+1}$ なので $(1 + ${n(5 * h)})y_{n+1} = y_n$ です。`], [`Factor $1/${n(1 + 5 * h)} = ${n(1 / (1 + 5 * h), 4)}$: between 0 and 1 for every $h > 0$, so implicit Euler never blows up on decay problems.`, `倍率は $1/${n(1 + 5 * h)} = ${n(1 / (1 + 5 * h), 4)}$ で、どの $h > 0$ でも 0 と 1 の間にあるので、陰的オイラー法は減衰問題で決して発散しません。`]],
        set: { h },
      };
      const lam = r.pick([-2, -3, 1, 2, -10, 0.5]), hh = r.pick([0.1, 0.2, 0.05, 0.5]), y0 = r.pick([1, 2, 4, 10]), y1 = (1 + lam * hh) * y0;
      return {
        q: [`One explicit Euler step of size $h = ${n(hh)}$ for $y' = ${n(lam)}y$ from $y_0 = ${y0}$. What is $y_1$?`, `$y' = ${n(lam)}y$ について、$y_0 = ${y0}$ から刻み $h = ${n(hh)}$ の陽的オイラー法を一回進めます。$y_1$ はいくつですか。`],
        a: { type: 'num', v: y1, tol: 1e-9 },
        sol: [[`$y_1 = y_0 + h\\cdot ${n(lam)}y_0 = ${y0}\\,(1 ${lam < 0 ? '-' : '+'} ${n(Math.abs(lam * hh))}) = ${n(y1)}$.`, `$y_1 = y_0 + h\\cdot ${n(lam)}y_0 = ${y0}\\,(1 ${lam < 0 ? '-' : '+'} ${n(Math.abs(lam * hh))}) = ${n(y1)}$ です。`], [`The exact value is $${y0}e^{${n(lam * hh)}} = ${n(y0 * Math.exp(lam * hh), 5)}$: Euler follows the tangent line, so its one-step error is about $\\tfrac12(\\lambda h)^2 y_0 = ${n(0.5 * (lam * hh) ** 2 * y0, 4)}$.`, `厳密な値は $${y0}e^{${n(lam * hh)}} = ${n(y0 * Math.exp(lam * hh), 5)}$ です。オイラー法は接線に沿うので、1ステップの誤差はおよそ $\\tfrac12(\\lambda h)^2 y_0 = ${n(0.5 * (lam * hh) ** 2 * y0, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.pick(HS), z = -5 * h, R = RK(z);
        return {
          q: [`RK4 on $y' = -5y$ with $h = ${n(h)}$. What is the factor $R(-5h)$ per step? Give four decimals.`, `$y' = -5y$ に $h = ${n(h)}$ の RK4 を使います。1ステップあたりの倍率 $R(-5h)$ を小数第4位まで求めてください。`],
          a: { type: 'num', v: R, tol: 6e-5 },
          hint: ['For $y\' = \\lambda y$, RK4 reproduces the Taylor series of $e^z$ up to $z^4/24$, with $z = \\lambda h$.', '$y\' = \\lambda y$ に対して RK4 は $e^z$ のテイラー級数を $z^4/24$ まで再現します（$z = \\lambda h$）。'],
          sol: [[`$z = ${n(z)}$: $R = 1 + z + \\tfrac{z^2}2 + \\tfrac{z^3}6 + \\tfrac{z^4}{24} = ${n(R, 5)}$.`, `$z = ${n(z)}$ で $R = 1 + z + \\tfrac{z^2}2 + \\tfrac{z^3}6 + \\tfrac{z^4}{24} = ${n(R, 5)}$ です。`], [`Compare $e^{z} = ${n(Math.exp(z), 5)}$. ${Math.abs(R) < 1 ? 'Inside the stable band.' : 'Outside the band $|R| < 1$: RK4 is unstable at this step size.'}`, `$e^{z} = ${n(Math.exp(z), 5)}$ と比べてください。${Math.abs(R) < 1 ? '安定な帯の中にあります。' : '$|R| < 1$ の帯の外にあるので、この刻み幅では RK4 は不安定です。'}`]],
          set: { h },
        };
      }
      if (form === 1) {
        const h = r.pick([0.025, 0.05, 0.1, 0.125, 0.2, 0.25]), N = Math.round(1 / h), yN = (1 - 5 * h) ** N, ex = Math.exp(-5);
        return {
          q: [`Explicit Euler for $y' = -5y$, $y(0) = 1$ with $h = ${n(h)}$. What is the numerical value at $t = 1$, and the error against $e^{-5}$?`, `$y' = -5y$、$y(0) = 1$ に $h = ${n(h)}$ の陽的オイラー法を使います。$t = 1$ での数値解と、$e^{-5}$ に対する誤差はいくつですか。`],
          a: { type: 'tuple', v: [yN, yN - ex], labels: ['$y_N$', ['error', '誤差']], tol: 5e-6 },
          hint: [`Every step multiplies by $1 - 5h$, and there are $1/h = ${N}$ steps.`, `各ステップで $1 - 5h$ 倍され、ステップ数は $1/h = ${N}$ です。`],
          sol: [[`$y_{${N}} = (1 - ${n(5 * h)})^{${N}} = ${n(1 - 5 * h)}^{${N}} = ${sig(yN, 5)}$.`, `$y_{${N}} = (1 - ${n(5 * h)})^{${N}} = ${n(1 - 5 * h)}^{${N}} = ${sig(yN, 5)}$ です。`], [`$e^{-5} = ${sig(ex, 5)}$, so the error is $${sig(yN - ex, 4)}$.`, `$e^{-5} = ${sig(ex, 5)}$ なので、誤差は $${sig(yN - ex, 4)}$ です。`], [`Euler is first order: halving $h$ roughly halves the error, until $h$ is small enough for the asymptotic rate to take over.`, `オイラー法は1次なので、$h$ を半分にすると誤差もおよそ半分になります（漸近的な振る舞いが支配するほど $h$ が小さければ）。`]],
          set: { h },
        };
      }
      const lam = r.pick([-5, -10, -20, -50, -100, -2]);
      return {
        q: [`For $y' = ${lam}y$, explicit Euler is stable for $0 < h < h_{\\max}$ and decays without oscillating for $0 < h \\le h_1$. Give $h_{\\max}$ and $h_1$.`, `$y' = ${lam}y$ に対して、陽的オイラー法は $0 < h < h_{\\max}$ で安定で、$0 < h \\le h_1$ で振動せずに減衰します。$h_{\\max}$ と $h_1$ を求めてください。`],
        a: { type: 'tuple', v: [2 / -lam, 1 / -lam], labels: ['$h_{\\max}$', '$h_1$'], tol: 1e-6 },
        hint: ['Require $|1 + \\lambda h| < 1$ for stability and $1 + \\lambda h \\ge 0$ for no sign flips.', '安定には $|1 + \\lambda h| < 1$、符号が反転しないには $1 + \\lambda h \\ge 0$ が必要です。'],
        sol: [[`$|1 ${lam}h| < 1 \\iff 0 < h < 2/${-lam} = ${n(2 / -lam)}$.`, `$|1 ${lam}h| < 1 \\iff 0 < h < 2/${-lam} = ${n(2 / -lam)}$ です。`], [`$1 ${lam}h \\ge 0 \\iff h \\le ${n(1 / -lam)}$.`, `$1 ${lam}h \\ge 0 \\iff h \\le ${n(1 / -lam)}$ です。`], [`The step is limited by the fastest decay rate, even long after that component has died away: this is stiffness, and why implicit methods exist.`, `その成分がとうに消えた後でも、刻み幅は最も速い減衰率で制限されます。これが硬さ（スティッフネス）で、陰解法が存在する理由です。`]],
        set: lam === -5 ? { h: 0.4 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lam = r.pick([-5, -2, -10, -1, -4]);
        let lo = -3, hi = -2.5; const g = (z) => z ** 3 + 4 * z * z + 12 * z + 24; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; }
        const z0 = (lo + hi) / 2, hm = z0 / lam;
        return {
          q: [`On the negative real axis, RK4 is stable for $\\lambda h > z_0$, where $R(z_0) = 1$. For $y' = ${lam}y$, what is the largest stable step $h$?`, `負の実軸上では、RK4 は $R(z_0) = 1$ となる $z_0$ について $\\lambda h > z_0$ で安定です。$y' = ${lam}y$ に対する安定な最大の刻み $h$ はいくつですか。`],
          a: { type: 'num', v: hm, tol: 1e-3 },
          hint: ['$R(z) = 1$ means $z(1 + z/2 + z^2/6 + z^3/24) = 0$; solve the cubic numerically.', '$R(z) = 1$ は $z(1 + z/2 + z^2/6 + z^3/24) = 0$ を意味します。三次方程式を数値的に解きます。'],
          sol: [['$R(z) - 1 = \\tfrac{z}{24}(z^3 + 4z^2 + 12z + 24)$; the cubic has one real root.', '$R(z) - 1 = \\tfrac{z}{24}(z^3 + 4z^2 + 12z + 24)$ で、三次式の実根は一つです。'], [`Bisection gives $z_0 = ${n(z0, 5)}$, so $h_{\\max} = ${n(z0, 5)}/(${lam}) = ${n(hm, 4)}$.`, `二分法で $z_0 = ${n(z0, 5)}$ なので $h_{\\max} = ${n(z0, 5)}/(${lam}) = ${n(hm, 4)}$ です。`], ['RK4 allows about $1.39$ times Euler’s step ($2.785$ against $2$), at four times the cost per step: higher order buys accuracy, not much stability.', 'RK4 はオイラー法の約 $1.39$ 倍の刻み（$2.785$ 対 $2$）を許しますが、1ステップの計算量は4倍です。高次化で得られるのは精度で、安定性はあまり増えません。']],
          set: lam === -5 ? { h: 0.55 } : undefined,
        };
      }
      if (form === 1) {
        const m = r.int(0, 1);
        return m === 0 ? {
          q: ['Heun’s method (the explicit trapezoid rule) is $\\tilde y = y_n + h f(y_n)$, $y_{n+1} = y_n + \\tfrac h2\\big(f(y_n) + f(\\tilde y)\\big)$. On $y\' = \\lambda y$ it gives $y_{n+1} = R(z)y_n$ with $z = \\lambda h$. Write $R(z)$.', 'ホイン法（陽的台形則）は $\\tilde y = y_n + h f(y_n)$、$y_{n+1} = y_n + \\tfrac h2\\big(f(y_n) + f(\\tilde y)\\big)$ です。$y\' = \\lambda y$ に対して $z = \\lambda h$ として $y_{n+1} = R(z)y_n$ となります。$R(z)$ を書いてください。'],
          a: { type: 'expr', v: '1+z+z^2/2', vars: ['z'], dom: { z: [-2, 0.5] }, lhs: ['$R(z) =$', '$R(z) =$'] },
          hint: ['Compute $\\tilde y = (1 + z)y_n$ first.', 'まず $\\tilde y = (1 + z)y_n$ を計算します。'],
          sol: [['$\\tilde y = (1 + z)y_n$, so $y_{n+1} = y_n + \\tfrac z2\\big(y_n + (1 + z)y_n\\big)$.', '$\\tilde y = (1 + z)y_n$ なので $y_{n+1} = y_n + \\tfrac z2\\big(y_n + (1 + z)y_n\\big)$ です。'], ['$R(z) = 1 + z + z^2/2$: the Taylor series of $e^z$ to second order, so the method is second order, and stable on the real axis for $-2 < z < 0$, the same interval as Euler.', '$R(z) = 1 + z + z^2/2$ で、$e^z$ のテイラー級数の2次までです。したがって2次の方法で、実軸上で安定なのは $-2 < z < 0$、オイラー法と同じ区間です。']],
        } : {
          q: ['The implicit trapezoid rule (Crank–Nicolson) is $y_{n+1} = y_n + \\tfrac h2\\big(f(y_n) + f(y_{n+1})\\big)$. On $y\' = \\lambda y$ it gives $y_{n+1} = R(z)y_n$ with $z = \\lambda h$. Write $R(z)$.', '陰的台形則（クランク・ニコルソン法）は $y_{n+1} = y_n + \\tfrac h2\\big(f(y_n) + f(y_{n+1})\\big)$ です。$y\' = \\lambda y$ に対して $z = \\lambda h$ として $y_{n+1} = R(z)y_n$ となります。$R(z)$ を書いてください。'],
          a: { type: 'expr', v: '(1+z/2)/(1-z/2)', vars: ['z'], dom: { z: [-3, 0.5] }, lhs: ['$R(z) =$', '$R(z) =$'] },
          hint: ['Collect the $y_{n+1}$ terms on one side.', '$y_{n+1}$ の項を一方の辺に集めます。'],
          sol: [['$(1 - z/2)\\,y_{n+1} = (1 + z/2)\\,y_n$.', '$(1 - z/2)\\,y_{n+1} = (1 + z/2)\\,y_n$ です。'], ['$R(z) = \\dfrac{1 + z/2}{1 - z/2}$, with $|R| < 1$ for every $z < 0$: unconditionally stable like implicit Euler, but second order. As $z \\to -\\infty$, though, $R \\to -1$, so very stiff components oscillate instead of dying out.', '$R(z) = \\dfrac{1 + z/2}{1 - z/2}$ で、すべての $z < 0$ で $|R| < 1$ です。陰的オイラー法と同じく無条件安定で、しかも2次です。ただし $z \\to -\\infty$ で $R \\to -1$ となるので、非常に硬い成分は消えずに振動します。']],
        };
      }
      const k = r.pick([2, 3, 4, 10]), meth = r.int(0, 2), p = [1, 4, 2][meth], names = [['explicit Euler', '陽的オイラー法'], ['RK4', 'RK4'], ['Heun’s method', 'ホイン法']];
      return {
        q: [`For a smooth problem and small $h$, the global error of ${names[meth][0]} behaves like $Ch^p$. If $h$ is divided by $${k}$, by what factor does the error shrink?`, `滑らかな問題で $h$ が小さいとき、${names[meth][1]}の大域誤差は $Ch^p$ のようにふるまいます。$h$ を $${k}$ 分の 1 にすると、誤差は何分の 1 になりますか。`],
        a: { type: 'num', v: k ** p },
        hint: ['Euler has order 1, Heun order 2, RK4 order 4.', 'オイラー法は1次、ホイン法は2次、RK4 は4次です。'],
        sol: [[`Order $p = ${p}$, so the error falls by $${k}^{${p}} = ${k ** p}$.`, `次数は $p = ${p}$ なので、誤差は $${k}^{${p}} = ${k ** p}$ 分の 1 になります。`], [`The work grows only by $${k}$. ${p > 1 ? 'High order pays off once the step is inside the stable region.' : 'First order is cheap per step but needs very many steps for small errors.'}`, `計算量は $${k}$ 倍にしかなりません。${p > 1 ? '刻みが安定領域の中にあれば、高次の方法が割に合います。' : '1次の方法は1ステップは安いですが、小さな誤差には非常に多くのステップが必要です。'}`]],
      };
    },
  ];

  /* ---------- 2. cancellation ---------- */
  const EPS = 2.220446049250313e-16;
  Q.cancellation = [
    (r) => {
      const form = r.int(0, 2), e = r.int(3, 14), x = 10 ** -e;
      if (form === 0) return {
        q: [`The rounding model says the direct formula $(\\sqrt{1 + x} - 1)/x$ has relative error about $\\varepsilon/x$ with $\\varepsilon = 2^{-52} \\approx 2.22 \\times 10^{-16}$. Estimate it at $x = ${pow10(e)}$.`, `丸めのモデルによれば、直接計算 $(\\sqrt{1 + x} - 1)/x$ の相対誤差はおよそ $\\varepsilon/x$ です（$\\varepsilon = 2^{-52} \\approx 2.22 \\times 10^{-16}$）。$x = ${pow10(e)}$ で見積もってください。`],
        a: { type: 'num', v: EPS / x, rel: 0.02 },
        hint: ['Rounding $\\sqrt{1 + x}$ costs an absolute error near $\\varepsilon$, while the true difference is about $x/2$.', '$\\sqrt{1 + x}$ を丸めると絶対誤差は $\\varepsilon$ 程度で、真の差は約 $x/2$ です。'],
        sol: [[`$\\varepsilon/x = 2.22 \\times 10^{-16} \\times 10^{${e}} = ${sig(EPS / x, 3)}$.`, `$\\varepsilon/x = 2.22 \\times 10^{-16} \\times 10^{${e}} = ${sig(EPS / x, 3)}$ です。`], ['That is the dashed line in the figure; the measured points scatter about it because the actual rounding error depends on the bits of each $x$.', '図の破線がこれです。実際の丸め誤差は各 $x$ のビットによるので、測った点はその周りにばらつきます。']],
        set: { exponent: e },
      };
      if (form === 1) {
        const ee = r.int(1, 3), xx = 10 ** -ee, v = 1 / (Math.sqrt(1 + xx) + 1);
        return {
          q: [`Evaluate the stable form $1/(\\sqrt{1 + x} + 1)$ at $x = ${pow10(ee)}$, to seven decimals.`, `安定な形 $1/(\\sqrt{1 + x} + 1)$ を $x = ${pow10(ee)}$ で小数第7位まで計算してください。`],
          a: { type: 'num', v, tol: 6e-8 },
          hint: ['Compute $\\sqrt{1 + x}$, add $1$, invert; nothing cancels.', '$\\sqrt{1 + x}$ を求め、$1$ を足し、逆数をとります。打ち消し合いは起きません。'],
          sol: [[`$\\sqrt{1 + ${n(xx)}} = ${n(Math.sqrt(1 + xx), 9)}$, so the value is $1/${n(Math.sqrt(1 + xx) + 1, 9)} = ${n(v, 8)}$.`, `$\\sqrt{1 + ${n(xx)}} = ${n(Math.sqrt(1 + xx), 9)}$ なので、値は $1/${n(Math.sqrt(1 + xx) + 1, 9)} = ${n(v, 8)}$ です。`], [`Close to the limit $\\tfrac12 - \\tfrac x8 = ${n(0.5 - xx / 8, 8)}$. Every operation here adds two positive numbers or divides, so relative errors stay near $\\varepsilon$.`, `極限の近似 $\\tfrac12 - \\tfrac x8 = ${n(0.5 - xx / 8, 8)}$ に近い値です。ここでの演算は正の数の足し算と割り算だけなので、相対誤差は $\\varepsilon$ 程度にとどまります。`]],
          set: { exponent: ee },
        };
      }
      const dig = -Math.log10(EPS / x);
      return {
        q: [`About how many correct significant digits does the direct formula $(\\sqrt{1 + x} - 1)/x$ give in double precision at $x = ${pow10(e)}$? Use the model relative error $\\approx \\varepsilon/x$.`, `倍精度で $x = ${pow10(e)}$ のとき、直接計算 $(\\sqrt{1 + x} - 1)/x$ はおよそ何桁の正しい有効数字を与えますか。相対誤差のモデル $\\approx \\varepsilon/x$ を使ってください。`],
        a: { type: 'num', v: dig, tol: 0.7 },
        hint: ['Correct digits $\\approx -\\log_{10}(\\text{relative error})$.', '正しい桁数 $\\approx -\\log_{10}(\\text{相対誤差})$ です。'],
        sol: [[`$-\\log_{10}(2.22 \\times 10^{-16} \\cdot 10^{${e}}) = 15.65 - ${e} = ${n(dig, 3)}$.`, `$-\\log_{10}(2.22 \\times 10^{-16} \\cdot 10^{${e}}) = 15.65 - ${e} = ${n(dig, 3)}$ です。`], [`About $${Math.round(dig)}$ digits: each factor of 10 that $x$ shrinks costs one digit, because $\\sqrt{1 + x}$ and $1$ share one more leading digit.`, `およそ $${Math.round(dig)}$ 桁です。$x$ が 10 分の 1 になるごとに $\\sqrt{1 + x}$ と $1$ が共有する先頭の桁が一つ増えるので、1 桁ずつ失われます。`]],
        set: { exponent: e },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([4, 5, 6, 8]), b = 10 ** k, c = r.pick([1, 2, 3, 5]), small = 2 * c / (b + Math.sqrt(b * b - 4 * c));
        return {
          q: [`Find the smaller root of $x^2 - 10^{${k}}x + ${c} = 0$ to six significant figures, avoiding cancellation.`, `$x^2 - 10^{${k}}x + ${c} = 0$ の小さい方の根を、打ち消し合いを避けて有効数字6桁で求めてください。`],
          a: { type: 'num', v: small, rel: 5e-6 },
          hint: ['The product of the roots is $c$; compute the large root safely and divide.', '根の積は $c$ です。大きい方の根を安全に計算し、それで割ります。'],
          sol: [[`The large root $\\tfrac12(10^{${k}} + \\sqrt{10^{${2 * k}} - ${4 * c}})$ adds two positive numbers: no cancellation.`, `大きい根 $\\tfrac12(10^{${k}} + \\sqrt{10^{${2 * k}} - ${4 * c}})$ は正の数の足し算なので打ち消し合いがありません。`], [`Small root $= ${c}/x_{\\text{large}} = \\dfrac{${2 * c}}{10^{${k}} + \\sqrt{10^{${2 * k}} - ${4 * c}}} = ${sig(small, 6)}$.`, `小さい根 $= ${c}/x_{\\text{large}} = \\dfrac{${2 * c}}{10^{${k}} + \\sqrt{10^{${2 * k}} - ${4 * c}}} = ${sig(small, 6)}$ です。`], [`The textbook formula $\\tfrac12(b - \\sqrt{b^2 - 4c})$ subtracts two numbers that agree in about $${2 * k}$ digits and keeps only about $${Math.max(0, 16 - 2 * k)}$.`, `教科書の公式 $\\tfrac12(b - \\sqrt{b^2 - 4c})$ は約 $${2 * k}$ 桁が一致する二数を引くので、約 $${Math.max(0, 16 - 2 * k)}$ 桁しか残りません。`]],
        };
      }
      if (form === 1) {
        const k = r.int(2, 7), digits = Array.from({ length: 9 }, () => r.int(0, 9)); digits[0] = r.int(1, 9);
        const a = digits.slice(), b = digits.slice(); b[k] = (a[k] + r.int(1, 8)) % 10;
        const toNum = (d) => Number(d[0] + '.' + d.slice(1).join(''));
        const A = toNum(a), B = toNum(b);
        return {
          q: [`Subtract $a = ${a[0]}.${a.slice(1).join('')}$ and $b = ${b[0]}.${b.slice(1).join('')}$. How many leading significant digits cancel?`, `$a = ${a[0]}.${a.slice(1).join('')}$ と $b = ${b[0]}.${b.slice(1).join('')}$ を引きます。先頭の有効数字は何桁打ち消されますか。`],
          a: { type: 'int', v: k },
          hint: ['Count the digits the two numbers share before they first differ.', '二つの数が最初に異なるまでに共有している桁を数えます。'],
          sol: [[`They agree in the first $${k}$ digits, so $a - b = ${sig(A - B, 9 - k)}$ starts $${k}$ places further right.`, `二つは先頭の $${k}$ 桁が一致するので、$a - b = ${sig(A - B, 9 - k)}$ は $${k}$ 桁右から始まります。`], [`If $a$ and $b$ each carry a relative error $\\delta$ from earlier rounding, the difference carries about $10^{${k}}\\delta$: the subtraction itself is exact, but it exposes the errors already present.`, `$a$ と $b$ がそれ以前の丸めで相対誤差 $\\delta$ をもつと、差は約 $10^{${k}}\\delta$ の相対誤差をもちます。引き算そのものは正確ですが、すでにある誤差をあらわにするのです。`]],
        };
      }
      const e = r.int(2, 6), x = 10 ** -e, v = 2 * Math.sin(x / 2) ** 2;
      return {
        q: [`Compute $1 - \\cos x$ at $x = ${pow10(e)}$ to three significant figures.`, `$x = ${pow10(e)}$ で $1 - \\cos x$ を有効数字3桁で求めてください。`],
        a: { type: 'num', v, rel: 2e-3 },
        hint: ['Use $1 - \\cos x = 2\\sin^2(x/2)$, or the Taylor series.', '$1 - \\cos x = 2\\sin^2(x/2)$ かテイラー級数を使います。'],
        sol: [[`$1 - \\cos x = 2\\sin^2(x/2) \\approx x^2/2 = ${sig(x * x / 2, 3)}$.`, `$1 - \\cos x = 2\\sin^2(x/2) \\approx x^2/2 = ${sig(x * x / 2, 3)}$ です。`], [`Computed directly in double precision, $\\cos x$ agrees with $1$ in about $${2 * e}$ digits, so only about $${Math.max(0, 16 - 2 * e)}$ survive the subtraction${e >= 8 ? ' (none at all)' : ''}; the rewritten form keeps all of them.`, `倍精度で直接計算すると $\\cos x$ と $1$ は約 $${2 * e}$ 桁一致するので、引き算の後に残るのは約 $${Math.max(0, 16 - 2 * e)}$ 桁です。書き換えた形ではすべての桁が残ります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const fs = [
          { f: (x) => Math.sqrt(1 + x) - 1, tex: '\\sqrt{1 + x} - 1' },
          { f: (x) => Math.exp(x) - 1, tex: 'e^{x} - 1\\ (\\texttt{exp(x) - 1})' },
          { f: (x) => 1 - Math.cos(x), tex: '1 - \\cos x' },
          { f: (x) => Math.log(1 + x), tex: '\\ln(1 + x)\\ (\\texttt{log(1 + x)})' },
        ];
        const k = r.int(0, 3), F = fs[k];
        let e0 = 1; while (e0 < 30 && F.f(10 ** -e0) !== 0) e0++;
        const why = k === 2 ? ['$\\cos x$ rounds to exactly $1$ once $x^2/2$ is below half the spacing of doubles near 1, $2^{-53} \\approx 1.1 \\times 10^{-16}$, that is for $x$ below about $1.5 \\times 10^{-8}$.', '$x^2/2$ が 1 付近の倍精度の間隔の半分 $2^{-53} \\approx 1.1 \\times 10^{-16}$ を下回る、すなわち $x$ がおよそ $1.5 \\times 10^{-8}$ を下回ると、$\\cos x$ はちょうど $1$ に丸められます。'] : ['$1 + x$ (or $e^x$) rounds to exactly $1$ once $x$ is below half the spacing of doubles near 1, $2^{-53} \\approx 1.1 \\times 10^{-16}$.', '$x$ が 1 付近の倍精度の間隔の半分 $2^{-53} \\approx 1.1 \\times 10^{-16}$ を下回ると、$1 + x$（あるいは $e^x$）はちょうど $1$ に丸められます。'];
        return {
          q: [`In IEEE double precision, what is the smallest integer $e$ for which $${F.tex}$, evaluated directly at $x = 10^{-e}$, returns exactly $0$?`, `IEEE 倍精度で、$x = 10^{-e}$ において $${F.tex}$ を直接計算するとちょうど $0$ が返る最小の整数 $e$ はいくつですか。`],
          a: { type: 'int', v: e0 },
          hint: ['Ask when the quantity next to 1 is lost entirely in rounding: compare it with $2^{-53}$.', '1 の隣にある量が丸めで完全に失われるのはいつかを考えます。$2^{-53}$ と比べます。'],
          sol: [why, [`So $e = ${e0}$: every digit of the answer is gone, although the true value is about $${k === 2 ? sig(0.5 * 10 ** (-2 * e0), 2) : sig((k === 0 ? 0.5 : 1) * 10 ** -e0, 2)}$.`, `したがって $e = ${e0}$ で、真の値はおよそ $${k === 2 ? sig(0.5 * 10 ** (-2 * e0), 2) : sig((k === 0 ? 0.5 : 1) * 10 ** -e0, 2)}$ なのに、答えの桁はすべて失われます。`], [k === 1 ? 'Libraries provide $\\texttt{expm1}$ for exactly this reason.' : k === 3 ? 'Libraries provide $\\texttt{log1p}$ for exactly this reason.' : 'Rewriting algebraically avoids the subtraction altogether.', k === 1 ? 'ライブラリが $\\texttt{expm1}$ を用意しているのはまさにこのためです。' : k === 3 ? 'ライブラリが $\\texttt{log1p}$ を用意しているのはまさにこのためです。' : '代数的に書き換えれば引き算そのものを避けられます。']],
          set: k === 0 ? { exponent: e0 } : undefined,
        };
      }
      if (form === 1) {
        const k = r.int(0, 2), F = [
          { tex: '\\dfrac{\\sqrt{1 + x} - 1}{x}', a: '\\tfrac12', c: -1 / 8, cs: '-\\tfrac18', pow: 'x' },
          { tex: '\\dfrac{e^{x} - 1}{x}', a: '1', c: 1 / 2, cs: '\\tfrac12', pow: 'x' },
          { tex: '\\dfrac{1 - \\cos x}{x^2}', a: '\\tfrac12', c: -1 / 24, cs: '-\\tfrac1{24}', pow: 'x^2' },
        ][k];
        return {
          q: [`For small $x$, $${F.tex} \\approx ${F.a} + c\\,${F.pow}$. Find $c$.`, `$x$ が小さいとき $${F.tex} \\approx ${F.a} + c\\,${F.pow}$ です。$c$ を求めてください。`],
          a: { type: 'num', v: F.c, show: F.cs },
          hint: ['Expand the numerator in its Taylor series and divide.', '分子をテイラー級数に展開して割ります。'],
          sol: [[k === 0 ? '$\\sqrt{1 + x} = 1 + \\tfrac x2 - \\tfrac{x^2}8 + \\cdots$' : k === 1 ? '$e^x = 1 + x + \\tfrac{x^2}2 + \\cdots$' : '$\\cos x = 1 - \\tfrac{x^2}2 + \\tfrac{x^4}{24} - \\cdots$', k === 0 ? '$\\sqrt{1 + x} = 1 + \\tfrac x2 - \\tfrac{x^2}8 + \\cdots$ です。' : k === 1 ? '$e^x = 1 + x + \\tfrac{x^2}2 + \\cdots$ です。' : '$\\cos x = 1 - \\tfrac{x^2}2 + \\tfrac{x^4}{24} - \\cdots$ です。'], [`So $c = ${F.cs}$.`, `したがって $c = ${F.cs}$ です。`], ['A short series is a stable way to evaluate such expressions exactly where the direct formula fails, and a check on any rewritten form.', '短い級数は、直接の式が破綻するまさにその所で安定に値を求める方法であり、書き換えた式の検算にもなります。']],
        };
      }
      const x = r.pick([0.01, 0.1, 1, 3, 10, 1e-4]), s = Math.sqrt(1 + x), kap = x / (2 * s * (s + 1));
      return {
        q: [`The relative condition number of $f(x) = (\\sqrt{1 + x} - 1)/x = 1/(\\sqrt{1 + x} + 1)$ is $\\kappa(x) = |x f'(x)/f(x)|$. Evaluate it at $x = ${n(x)}$.`, `$f(x) = (\\sqrt{1 + x} - 1)/x = 1/(\\sqrt{1 + x} + 1)$ の相対条件数は $\\kappa(x) = |x f'(x)/f(x)|$ です。$x = ${n(x)}$ で求めてください。`],
        a: { type: 'num', v: kap, rel: 0.003 },
        hint: ['Differentiate $1/(\\sqrt{1 + x} + 1)$: $f\'/f = -\\dfrac{1}{2\\sqrt{1 + x}(\\sqrt{1 + x} + 1)}$.', '$1/(\\sqrt{1 + x} + 1)$ を微分すると $f\'/f = -\\dfrac{1}{2\\sqrt{1 + x}(\\sqrt{1 + x} + 1)}$ です。'],
        sol: [[`$\\kappa = \\dfrac{x}{2\\sqrt{1 + x}(\\sqrt{1 + x} + 1)} = \\dfrac{${n(x)}}{2\\cdot ${n(s, 5)}\\cdot ${n(s + 1, 5)}} = ${sig(kap, 4)}$.`, `$\\kappa = \\dfrac{x}{2\\sqrt{1 + x}(\\sqrt{1 + x} + 1)} = \\dfrac{${n(x)}}{2\\cdot ${n(s, 5)}\\cdot ${n(s + 1, 5)}} = ${sig(kap, 4)}$ です。`], ['It is below $1$ everywhere and tends to $0$ as $x \\to 0$: the problem is perfectly well conditioned. The huge errors of the direct formula come from the algorithm, not the problem, which is why a rewrite cures them.', 'どこでも $1$ より小さく、$x \\to 0$ で $0$ に近づきます。問題そのものは非常に良条件です。直接計算の大きな誤差は問題ではなくアルゴリズムから来るので、書き換えで治るのです。']],
      };
    },
  ];

  /* ---------- 3. interpolation and Runge's phenomenon ---------- */
  const runge = (x) => 1 / (1 + 25 * x * x);
  const nodePolyMax = (xs) => { let m = 0; for (let i = 0; i <= 20000; i++) { const x = -1 + i / 10000; let p = 1; for (const t of xs) p *= x - t; m = Math.max(m, Math.abs(p)); } return m; };
  Q.interpolation = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(3, 12), j = r.int(1, N - 1), x = Math.cos(j * PI / N);
        return {
          q: [`The Chebyshev–Lobatto nodes for degree $n = ${N}$ are $x_j = \\cos(j\\pi/n)$. What is $x_{${j}}$?`, `次数 $n = ${N}$ のチェビシェフ・ロバット点は $x_j = \\cos(j\\pi/n)$ です。$x_{${j}}$ はいくつですか。`],
          a: { type: 'num', v: x, tol: 1e-4 },
          sol: [[`$x_{${j}} = \\cos(${j}\\pi/${N}) = ${n(x, 5)}$.`, `$x_{${j}} = \\cos(${j}\\pi/${N}) = ${n(x, 5)}$ です。`], ['These are equally spaced points on a semicircle, projected down onto $[-1, 1]$: that is why they crowd towards the ends.', 'これは半円上の等間隔の点を $[-1, 1]$ に射影したものです。端に向かって密集するのはこのためです。']],
          set: N >= 2 ? { n: N, cheb: 1 } : undefined,
        };
      }
      if (form === 1) {
        const N = r.int(2, 20);
        return {
          q: [`Equally spaced interpolation of degree $n = ${N}$ on $[-1, 1]$ uses how many nodes, and how far apart are they?`, `$[-1, 1]$ 上の次数 $n = ${N}$ の等間隔補間では、節点はいくつ使われ、間隔はいくつですか。`],
          a: { type: 'tuple', v: [N + 1, 2 / N], labels: [['nodes', '節点の数'], ['spacing', '間隔']], tol: 1e-4 },
          hint: ['A polynomial of degree $n$ has $n + 1$ coefficients.', '次数 $n$ の多項式の係数は $n + 1$ 個です。'],
          sol: [[`$n + 1 = ${N + 1}$ nodes, so $${N}$ gaps across a length of $2$: spacing $2/${N} = ${n(2 / N, 4)}$.`, `節点は $n + 1 = ${N + 1}$ 個で、長さ $2$ に $${N}$ 個の間隔があるので、間隔は $2/${N} = ${n(2 / N, 4)}$ です。`], ['Exactly $n + 1$ conditions fix the $n + 1$ coefficients, so the interpolant exists and is unique as long as the nodes are distinct.', 'ちょうど $n + 1$ 個の条件が $n + 1$ 個の係数を決めるので、節点が相異なる限り補間多項式は存在し一意です。']],
          set: { n: N, cheb: 0 },
        };
      }
      const a = r.pick([-1, -0.5, 0, 0.2, 0.4]), b = r.pick([0.5, 0.6, 0.8, 1].filter((t) => t > a)), m = (a + b) / 2, lin = (runge(a) + runge(b)) / 2;
      return {
        q: [`Interpolate $f(x) = 1/(1 + 25x^2)$ linearly between $x = ${n(a)}$ and $x = ${n(b)}$. What does the line give at the midpoint $x = ${n(m)}$, and what is the error there?`, `$f(x) = 1/(1 + 25x^2)$ を $x = ${n(a)}$ と $x = ${n(b)}$ の間で線形補間します。中点 $x = ${n(m)}$ での直線の値と、そこでの誤差 $p - f$ はいくつですか。`],
        a: { type: 'tuple', v: [lin, lin - runge(m)], labels: ['$p$', '$p - f$'], tol: 1e-4 },
        sol: [[`$f(${n(a)}) = ${n(runge(a), 5)}$, $f(${n(b)}) = ${n(runge(b), 5)}$; the line at the midpoint is their average, $${n(lin, 5)}$.`, `$f(${n(a)}) = ${n(runge(a), 5)}$、$f(${n(b)}) = ${n(runge(b), 5)}$ で、中点での直線の値はその平均 $${n(lin, 5)}$ です。`], [`$f(${n(m)}) = ${n(runge(m), 5)}$, so the error is $${n(lin - runge(m), 5)}$. ${lin > runge(m) ? 'The line lies above where $f$ is convex.' : 'The line lies below where $f$ is concave.'}`, `$f(${n(m)}) = ${n(runge(m), 5)}$ なので誤差は $${n(lin - runge(m), 5)}$ です。${lin > runge(m) ? '$f$ が下に凸な所では直線は上にあります。' : '$f$ が上に凸な所では直線は下にあります。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const xs = [r.int(-2, 0), 0, 0], ys = [r.int(-3, 4), r.int(-3, 4), r.int(-3, 4)];
        xs[1] = xs[0] + r.int(1, 2); xs[2] = xs[1] + r.int(1, 2);
        const t = xs[0] + r.int(0, 3) + 0.5;
        const L = (k) => xs.reduce((acc, xj, j) => (j === k ? acc : acc * (t - xj) / (xs[k] - xj)), 1);
        const v = ys.reduce((a, y, k) => a + y * L(k), 0);
        return {
          q: [`The quadratic through $(${xs[0]}, ${ys[0]})$, $(${xs[1]}, ${ys[1]})$, $(${xs[2]}, ${ys[2]})$: what is its value at $x = ${n(t)}$?`, `$(${xs[0]}, ${ys[0]})$、$(${xs[1]}, ${ys[1]})$、$(${xs[2]}, ${ys[2]})$ を通る二次式の $x = ${n(t)}$ での値はいくつですか。`],
          a: { type: 'num', v, tol: 1e-6 },
          hint: ['Lagrange form: $p(x) = \\sum_k y_k \\prod_{j \\ne k}\\dfrac{x - x_j}{x_k - x_j}$.', 'ラグランジュ形式：$p(x) = \\sum_k y_k \\prod_{j \\ne k}\\dfrac{x - x_j}{x_k - x_j}$ です。'],
          sol: [[`The basis values at $x = ${n(t)}$ are $${n(L(0), 5)},\\ ${n(L(1), 5)},\\ ${n(L(2), 5)}$ (they add to $1$).`, `$x = ${n(t)}$ での基底の値は $${n(L(0), 5)},\\ ${n(L(1), 5)},\\ ${n(L(2), 5)}$ です（和は $1$）。`], [`$p(${n(t)}) = ${ys[0]}\\cdot ${n(L(0), 5)} + ${ys[1]}\\cdot ${n(L(1), 5)} + ${ys[2]}\\cdot ${n(L(2), 5)} = ${n(v, 5)}$.`, `$p(${n(t)}) = ${ys[0]}\\cdot ${n(L(0), 5)} + ${ys[1]}\\cdot ${n(L(1), 5)} + ${ys[2]}\\cdot ${n(L(2), 5)} = ${n(v, 5)}$ です。`], [t > xs[2] || t < xs[0] ? 'Outside the nodes a basis value exceeds 1 in size: extrapolation amplifies the data, the same mechanism as Runge’s wiggles near the ends.' : 'Inside the nodes the basis values are moderate, so the data are not amplified.', t > xs[2] || t < xs[0] ? '節点の外では基底の値の絶対値が 1 を超えます。外挿はデータを増幅し、端付近のルンゲの振動と同じ仕組みです。' : '節点の内側では基底の値は穏当なので、データは増幅されません。']],
        };
      }
      if (form === 1) {
        const which = r.int(0, 1), h = r.pick([0.1, 0.2, 0.5, 0.05]), M = which ? Math.exp(h) : 1, bound = h * h / 8 * M;
        return {
          q: [`Linear interpolation of $${which ? 'e^x' : '\\sin x'}$ on $[0, ${n(h)}]$: what is the standard error bound $\\tfrac{h^2}{8}\\max|f''|$?`, `$[0, ${n(h)}]$ 上で $${which ? 'e^x' : '\\sin x'}$ を線形補間します。標準的な誤差の上界 $\\tfrac{h^2}{8}\\max|f''|$ はいくつですか。`],
          a: { type: 'num', v: bound, rel: 0.003 },
          hint: ['The error is $\\tfrac{f\'\'(\\xi)}{2}(x - a)(x - b)$, and $|(x - a)(x - b)| \\le h^2/4$.', '誤差は $\\tfrac{f\'\'(\\xi)}{2}(x - a)(x - b)$ で、$|(x - a)(x - b)| \\le h^2/4$ です。'],
          sol: [[which ? `$f'' = e^x \\le e^{${n(h)}} = ${n(M, 5)}$ on the interval.` : '$|f\'\'| = |\\sin x| \\le 1$; a cruder but valid bound uses $1$.', which ? `区間上で $f'' = e^x \\le e^{${n(h)}} = ${n(M, 5)}$ です。` : '$|f\'\'| = |\\sin x| \\le 1$ で、粗いが正しい上界として $1$ を使います。'], [`$\\tfrac{${n(h)}^2}{8}\\cdot ${n(M, 5)} = ${sig(bound, 4)}$.`, `$\\tfrac{${n(h)}^2}{8}\\cdot ${n(M, 5)} = ${sig(bound, 4)}$ です。`], ['Halving $h$ divides the bound by 4: piecewise interpolation converges by refining, without raising the degree.', '$h$ を半分にすると上界は 4 分の 1 になります。区分的な補間は次数を上げずに細かくすることで収束します。']],
        };
      }
      const N = r.int(2, 12);
      return {
        q: [`For the $n + 1 = ${N + 1}$ Chebyshev points (roots of $T_{${N + 1}}$), what is $\\max_{[-1,1]}\\left|\\prod_j (x - x_j)\\right|$?`, `$n + 1 = ${N + 1}$ 個のチェビシェフ点（$T_{${N + 1}}$ の根）について、$\\max_{[-1,1]}\\left|\\prod_j (x - x_j)\\right|$ はいくつですか。`],
        a: { type: 'num', v: 2 ** -N, show: `2^{-${N}}` },
        hint: ['The node polynomial is the monic $T_{n+1}/2^{n}$, and $|T_{n+1}| \\le 1$.', '節点多項式はモニックな $T_{n+1}/2^{n}$ で、$|T_{n+1}| \\le 1$ です。'],
        sol: [[`$T_{${N + 1}}$ has leading coefficient $2^{${N}}$, so $\\prod_j(x - x_j) = T_{${N + 1}}(x)/2^{${N}}$.`, `$T_{${N + 1}}$ の最高次係数は $2^{${N}}$ なので $\\prod_j(x - x_j) = T_{${N + 1}}(x)/2^{${N}}$ です。`], [`Its maximum is $2^{-${N}} = ${sig(2 ** -N, 4)}$, the smallest possible for any monic polynomial of that degree. This factor multiplies $f^{(n+1)}/(n + 1)!$ in the error formula, which is why Chebyshev nodes win.`, `その最大値は $2^{-${N}} = ${sig(2 ** -N, 4)}$ で、同じ次数のモニック多項式の中で最小です。誤差の式ではこれが $f^{(n+1)}/(n + 1)!$ に掛かるので、チェビシェフ点が有利になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 4, 9, 25, 3]), ax = a === 1 ? '' : a;
        return {
          q: [`Write the quadratic that interpolates $f(x) = 1/(1 + ${ax}x^2)$ at $x = -1, 0, 1$.`, `$f(x) = 1/(1 + ${ax}x^2)$ を $x = -1, 0, 1$ で補間する二次式を書いてください。`],
          a: { type: 'expr', v: `1-${a}*x^2/${a + 1}`, vars: ['x'], dom: { x: [-1, 1] }, lhs: ['$p(x) =$', '$p(x) =$'] },
          hint: ['$f$ is even, so $p(x) = c_0 + c_2x^2$.', '$f$ は偶関数なので $p(x) = c_0 + c_2x^2$ です。'],
          sol: [[`$p(0) = f(0) = 1$ and $p(\\pm1) = f(\\pm1) = ${frac(1, a + 1)}$.`, `$p(0) = f(0) = 1$、$p(\\pm1) = f(\\pm1) = ${frac(1, a + 1)}$ です。`], [`$c_0 = 1$ and $c_2 = ${frac(1, a + 1)} - 1 = ${frac(-a, a + 1)}$, so $p(x) = 1 - ${frac(a, a + 1)}x^2$.`, `$c_0 = 1$、$c_2 = ${frac(1, a + 1)} - 1 = ${frac(-a, a + 1)}$ なので $p(x) = 1 - ${frac(a, a + 1)}x^2$ です。`], [`At $x = \\pm\\tfrac12$ it gives $${n(1 - a / (a + 1) / 4, 4)}$ against $f = ${n(1 / (1 + a / 4), 4)}$. ${a === 25 ? 'This is the $n = 2$ case in the figure, where both node families coincide.' : ''}`, `$x = \\pm\\tfrac12$ では $${n(1 - a / (a + 1) / 4, 4)}$ で、$f = ${n(1 / (1 + a / 4), 4)}$ と比べられます。${a === 25 ? '図の $n = 2$ の場合で、二種類の節点は一致します。' : ''}`]],
          set: a === 25 ? { n: 2 } : undefined,
        };
      }
      if (form === 1) {
        const a = r.pick([1, 4, 9, 16, 25, 100]), ax = a === 1 ? '' : a, rho = (1 + Math.sqrt(1 + a)) / Math.sqrt(a);
        return {
          q: [`Chebyshev interpolants of $f(x) = 1/(1 + ${ax}x^2)$ converge like $\\rho^{-n}$, where $\\rho$ is the size of the largest Bernstein ellipse that avoids the poles $x = \\pm i/${n(Math.sqrt(a))}$. Find $\\rho$.`, `$f(x) = 1/(1 + ${ax}x^2)$ のチェビシェフ補間は $\\rho^{-n}$ のように収束します。$\\rho$ は極 $x = \\pm i/${n(Math.sqrt(a))}$ を避ける最大のバーンスタイン楕円の大きさです。$\\rho$ を求めてください。`],
          a: { type: 'num', v: rho, rel: 1e-3 },
          hint: ['The ellipse through $z$ has $\\rho = |z + \\sqrt{z^2 - 1}|$ (taking the root with $\\rho > 1$).', '$z$ を通る楕円の大きさは $\\rho = |z + \\sqrt{z^2 - 1}|$ です（$\\rho > 1$ となる根をとります）。'],
          sol: [[`With $z = i/${n(Math.sqrt(a))}$: $\\sqrt{z^2 - 1} = i\\sqrt{1 + 1/${a}}$.`, `$z = i/${n(Math.sqrt(a))}$ では $\\sqrt{z^2 - 1} = i\\sqrt{1 + 1/${a}}$ です。`], [`$\\rho = \\dfrac{1 + \\sqrt{${1 + a}}}{${n(Math.sqrt(a))}} = ${n(rho, 4)}$.`, `$\\rho = \\dfrac{1 + \\sqrt{${1 + a}}}{${n(Math.sqrt(a))}} = ${n(rho, 4)}$ です。`], [`Each extra degree divides the error by about $${n(rho, 3)}$${a === 25 ? ', the rate quoted in the readout' : ''}. Poles close to $[-1, 1]$ mean $\\rho$ near 1 and slow convergence.`, `次数を一つ上げるごとに誤差はおよそ $${n(rho, 3)}$ 分の 1 になります${a === 25 ? '。読み取り欄の速さがこれです' : ''}。極が $[-1, 1]$ に近いほど $\\rho$ は 1 に近く、収束は遅くなります。`]],
          set: a === 25 ? { cheb: 1 } : undefined,
        };
      }
      const N = r.int(4, 14), eq = nodePolyMax(Array.from({ length: N + 1 }, (_, j) => -1 + 2 * j / N)), ch = nodePolyMax(Array.from({ length: N + 1 }, (_, j) => Math.cos(j * PI / N))), ratio = eq / ch;
      return {
        q: [`For degree $n = ${N}$, compare the node polynomials $\\omega(x) = \\prod_j (x - x_j)$ on $[-1, 1]$: what is the ratio of $\\max|\\omega|$ for equally spaced nodes to that for Chebyshev–Lobatto nodes?`, `次数 $n = ${N}$ について、$[-1, 1]$ 上の節点多項式 $\\omega(x) = \\prod_j (x - x_j)$ を比べます。等間隔点の $\\max|\\omega|$ とチェビシェフ・ロバット点の $\\max|\\omega|$ の比はいくつですか。`],
        a: { type: 'num', v: ratio, rel: 0.01 },
        hint: ['Evaluate both products on a fine grid; for equally spaced nodes the maximum is in the first or last gap.', '二つの積を細かい格子上で評価します。等間隔点では最大値は最初か最後の間隔にあります。'],
        sol: [[`Equally spaced: $\\max|\\omega| = ${sig(eq, 4)}$, attained near the ends. Chebyshev–Lobatto: $${sig(ch, 4)}$, with equal ripples across the interval.`, `等間隔点：$\\max|\\omega| = ${sig(eq, 4)}$ で、端の近くでとります。チェビシェフ・ロバット点：$${sig(ch, 4)}$ で、区間全体で等しい波を打ちます。`], [`Ratio $${n(ratio, 4)}$. It grows roughly like $2^n$ divided by a power of $n$, which is why equally spaced interpolation of the Runge function diverges while the Chebyshev one converges.`, `比は $${n(ratio, 4)}$ です。これはおよそ $2^n$ を $n$ のべきで割ったように増えます。ルンゲ関数の等間隔補間が発散し、チェビシェフ補間が収束するのはこのためです。`]],
        set: { n: N },
      };
    },
  ];
})();
