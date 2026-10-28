'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, gcd, frac, terms } = P.util;

  const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
  const dfact = (k) => { let f = 1; for (let i = k; i > 1; i -= 2) f *= i; return f; };
  const pw = (a, b, m) => { let r = 1 % m; a %= m; while (b > 0) { if (b & 1) r = (r * a) % m; a = (a * a) % m; b >>= 1; } return r; };
  const mono = (c, v) => (c === 1 ? v : c === -1 ? '-' + v : c + v);
  const sgn = (c) => (c < 0 ? '-' : '+');

  /* ---------- limits and series ---------- */
  const GROWTH = [
    { tex: (c) => `${c === 1 ? '' : c}(\\ln x)^{${2}}`, rank: [0, 2], mk: (c, k) => `${c === 1 ? '' : c}(\\ln x)^{${k}}` },
  ];
  const term = (kind, k, c) => {
    // kind 0: (ln x)^k, 1: x^k, 2: e^{kx}, 3: x!  (rank levels)
    if (kind === 0) return { tex: `${c === 1 ? '' : c}(\\ln x)^{${k}}`, rank: [0, k] };
    if (kind === 1) return { tex: `${c === 1 ? '' : c}x^{${k}}`, rank: [1, k] };
    if (kind === 2) return { tex: `${c === 1 ? '' : c}e^{${k === 1 ? '' : k}x}`, rank: [2, k] };
    return { tex: `${c === 1 ? '' : c}\\,x^{x}`, rank: [3, 1] };
  };

  Q['explore-structure-before-algebra-limits'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kinds = [0, 1, 2, 3];
        let k1 = r.pick(kinds), k2 = r.pick(kinds);
        const e1 = k1 === 0 ? r.int(2, 5) : k1 === 1 ? r.int(1, 6) : k1 === 2 ? r.int(1, 3) : 1;
        const e2 = k2 === 0 ? r.int(2, 5) : k2 === 1 ? r.int(1, 6) : k2 === 2 ? r.int(1, 3) : 1;
        const c1 = r.int(1, 5), c2 = r.int(1, 5);
        const f = term(k1, e1, c1), g = term(k2, e2, c2);
        const cmp = f.rank[0] !== g.rank[0] ? Math.sign(f.rank[0] - g.rank[0]) : Math.sign(f.rank[1] - g.rank[1]);
        const cls = cmp > 0 ? 2 : cmp < 0 ? 0 : 1;
        const opts = [['$0$', '$0$'], ['a finite non-zero number', '0 でない有限の値'], ['$+\\infty$', '$+\\infty$']];
        return {
          q: [`As $x \\to \\infty$, what happens to $\\dfrac{${f.tex}}{${g.tex}}$?`, `$x \\to \\infty$ のとき、$\\dfrac{${f.tex}}{${g.tex}}$ はどうなりますか。`],
          a: { type: 'choice', fixed: true, v: cls, opts },
          hint: ['Rank the growth classes first: powers of a logarithm, then powers of $x$, then exponentials, then $x^x$. A larger class wins whatever the constants and exponents.', 'まず増大度の階層を比べます。対数のべき、$x$ のべき、指数関数、$x^x$ の順に大きくなります。上の階層が、係数や指数にかかわらず勝ちます。'],
          sol: [[cmp === 0 ? `Both terms are in the same class with the same exponent, so only the constants matter: the ratio tends to $${c1}/${c2}$.` : `The numerator is in a ${cmp > 0 ? 'faster' : 'slower'} growth class (or has a ${cmp > 0 ? 'larger' : 'smaller'} exponent in the same class).`, cmp === 0 ? `どちらも同じ階層で指数も同じなので、係数だけが効き、比は $${c1}/${c2}$ に近づきます。` : `分子のほうが${cmp > 0 ? '速く' : 'ゆっくり'}増える階層（または同じ階層でより${cmp > 0 ? '大きい' : '小さい'}指数）にあります。`], [cmp > 0 ? 'So the ratio grows without bound.' : cmp < 0 ? 'So the ratio tends to $0$.' : `So the limit is the finite non-zero number $${frac(c1, c2)}$.`, cmp > 0 ? 'したがって比は限りなく大きくなります。' : cmp < 0 ? 'したがって比は $0$ に近づきます。' : `したがって極限は 0 でない有限の値 $${frac(c1, c2)}$ です。`]],
        };
      }
      if (form === 1) {
        const a = r.int(1, 6), b = r.int(1, 6), t = r.int(0, 3);
        const L = [
          [`\\dfrac{e^{${a}x} - 1}{${b === 1 ? '' : b}x}`, a / b, `$e^{u} - 1 \\sim u$, so the quotient behaves like $${a}x/${b}x$.`, `$e^{u} - 1 \\sim u$ なので、商は $${a}x/${b}x$ のように振る舞います。`],
          [`\\dfrac{\\sin ${a}x}{${b === 1 ? '' : b}x}`, a / b, `$\\sin u \\sim u$ for small $u$.`, `$u$ が小さいとき $\\sin u \\sim u$ です。`],
          [`\\dfrac{\\ln(1 + ${a}x)}{${b === 1 ? '' : b}x}`, a / b, `$\\ln(1 + u) \\sim u$ for small $u$.`, `$u$ が小さいとき $\\ln(1 + u) \\sim u$ です。`],
          [`\\dfrac{\\tan ${a}x}{${b === 1 ? '' : b}x}`, a / b, `$\\tan u \\sim u$ for small $u$.`, `$u$ が小さいとき $\\tan u \\sim u$ です。`],
        ][t];
        return {
          q: [`Find $\\displaystyle\\lim_{x \\to 0} ${L[0]}$.`, `$\\displaystyle\\lim_{x \\to 0} ${L[0]}$ を求めてください。`],
          a: { type: 'num', v: L[1], show: frac(a, b) },
          hint: ['Replace the inner function by its first-order approximation.', '内側の関数を 1 次近似で置き換えます。'],
          sol: [[L[2], L[3]], [`The numerator is $\\sim ${a}x$ and the denominator is $${b === 1 ? '' : b}x$, so the limit is $${frac(a, b)}$. No L'Hôpital is needed: the first non-cancelling term already shows the answer.`, `分子は $\\sim ${a}x$、分母は $${b === 1 ? '' : b}x$ なので、極限は $${frac(a, b)}$ です。ロピタルの定理は不要で、最初の項を見るだけで答えが分かります。`]],
        };
      }
      const p = r.int(2, 6), a0 = r.int(1, 4), t = r.int(0, 2);
      const F = [
        [`x^{${p}}`, p * Math.pow(a0, p - 1), `${p}a^{${p - 1}}`, `$\\dfrac{d}{dx}x^{${p}} = ${p}x^{${p - 1}}$`],
        [`e^{${p}x}`, p * Math.exp(p * a0), `${p}e^{${p}a}`, `$\\dfrac{d}{dx}e^{${p}x} = ${p}e^{${p}x}$`],
        [`\\sin ${p}x`, p * Math.cos(p * a0), `${p}\\cos ${p}a`, `$\\dfrac{d}{dx}\\sin ${p}x = ${p}\\cos ${p}x$`],
      ][t];
      return {
        q: [`Evaluate $\\displaystyle\\lim_{h \\to 0}\\dfrac{f(${a0} + h) - f(${a0})}{h}$ for $f(x) = ${F[0]}$. (Decimals are fine.)`, `$f(x) = ${F[0]}$ のとき、$\\displaystyle\\lim_{h \\to 0}\\dfrac{f(${a0} + h) - f(${a0})}{h}$ を求めてください。（小数でかまいません。）`],
        a: { type: 'num', v: F[1], rel: 0.003 },
        hint: ['This is a difference quotient in disguise: the limit is $f\'(a)$.', '差商が姿を変えたものです。極限は $f\'(a)$ です。'],
        sol: [[`The limit is $f'(${a0})$, and ${F[3]}.`, `極限は $f'(${a0})$ で、${F[3]} です。`], [`At $a = ${a0}$ this gives $${F[2].replace(/a/g, String(a0))} = ${n(F[1], 5)}$. Spotting the definition saves any expansion.`, `$a = ${a0}$ を代入すると $${F[2].replace(/a/g, String(a0))} = ${n(F[1], 5)}$ です。定義の形に気づけば、展開は不要です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 4), t = r.int(0, 4);
        const L = [
          [`\\dfrac{e^{${a}x} - 1 - ${a}x}{x^2}`, a * a / 2, `${frac(a * a, 2)}`, `Expand $e^{u} = 1 + u + u^2/2 + \\dots$ with $u = ${a}x$; the $1$ and $u$ cancel, leaving $u^2/2 = ${frac(a * a, 2)}x^2$.`, `$e^{u} = 1 + u + u^2/2 + \\dots$ を $u = ${a}x$ で展開します。$1$ と $u$ は相殺され、$u^2/2 = ${frac(a * a, 2)}x^2$ が残ります。`],
          [`\\dfrac{\\sin ${a}x - ${a}x}{x^3}`, -a * a * a / 6, `${frac(-a * a * a, 6)}`, `Expand $\\sin u = u - u^3/6 + \\dots$; after the $u$ cancels, the leading term is $-u^3/6 = ${frac(-a * a * a, 6)}x^3$.`, `$\\sin u = u - u^3/6 + \\dots$ を展開します。$u$ が相殺されたあとの先頭項は $-u^3/6 = ${frac(-a * a * a, 6)}x^3$ です。`],
          [`\\dfrac{\\cos ${a}x - 1 + ${frac(a * a, 2)}x^2}{x^4}`, Math.pow(a, 4) / 24, `${frac(Math.pow(a, 4), 24)}`, `Expand $\\cos u = 1 - u^2/2 + u^4/24 - \\dots$; the first two terms cancel, leaving $u^4/24 = ${frac(Math.pow(a, 4), 24)}x^4$.`, `$\\cos u = 1 - u^2/2 + u^4/24 - \\dots$ を展開します。最初の 2 項は相殺され、$u^4/24 = ${frac(Math.pow(a, 4), 24)}x^4$ が残ります。`],
          [`\\dfrac{${a}x - \\ln(1 + ${a}x)}{x^2}`, a * a / 2, `${frac(a * a, 2)}`, `Expand $\\ln(1 + u) = u - u^2/2 + \\dots$; then $u - \\ln(1 + u) \\sim u^2/2 = ${frac(a * a, 2)}x^2$.`, `$\\ln(1 + u) = u - u^2/2 + \\dots$ を展開すると、$u - \\ln(1 + u) \\sim u^2/2 = ${frac(a * a, 2)}x^2$ です。`],
          [`\\dfrac{\\tan ${a}x - \\sin ${a}x}{x^3}`, a * a * a / 2, `${frac(a * a * a, 2)}`, `Since $\\tan u - \\sin u = \\tan u\\,(1 - \\cos u) \\sim u \\cdot u^2/2 = u^3/2$, the numerator is $\\sim ${frac(a * a * a, 2)}x^3$.`, `$\\tan u - \\sin u = \\tan u\\,(1 - \\cos u) \\sim u \\cdot u^2/2 = u^3/2$ なので、分子は $\\sim ${frac(a * a * a, 2)}x^3$ です。`],
        ][t];
        return {
          q: [`Find $\\displaystyle\\lim_{x \\to 0} ${L[0]}$.`, `$\\displaystyle\\lim_{x \\to 0} ${L[0]}$ を求めてください。`],
          a: { type: 'num', v: L[1], show: L[2], rel: 0.003 },
          hint: ['Expand only as far as the first term that does not cancel.', '相殺されない最初の項まで展開します。'],
          sol: [[L[3], L[4]], [`Dividing by the power of $x$ in the denominator gives the limit $${L[2]}$. Here the order of expansion is dictated by the denominator: stop one term past where the cancellation happens.`, `分母の $x$ のべきで割ると、極限は $${L[2]}$ です。展開の次数は分母で決まります。相殺が起こる次数のすぐ先で止めます。`]],
        };
      }
      if (form === 1) {
        const t = r.int(0, 4), p = r.int(1, 4);
        const R = [
          [`\\dfrac{1}{n^{${p + 1}}}\\sum_{k=1}^{n} k^{${p}}`, 1 / (p + 1), `${frac(1, p + 1)}`, `This is $\\frac1n\\sum (k/n)^{${p}}$, a Riemann sum of $x^{${p}}$ on $[0, 1]$, so the limit is $\\int_0^1 x^{${p}}\\,dx = ${frac(1, p + 1)}$.`, `これは $\\frac1n\\sum (k/n)^{${p}}$ で、$[0, 1]$ 上の $x^{${p}}$ のリーマン和です。極限は $\\int_0^1 x^{${p}}\\,dx = ${frac(1, p + 1)}$ です。`],
          [`\\sum_{k=1}^{n}\\dfrac{1}{n + k}`, Math.LN2, '\\ln 2', 'Write $\\frac1{n+k} = \\frac1n\\cdot\\frac1{1 + k/n}$: the sum is a Riemann sum of $1/(1 + x)$ on $[0, 1]$, so the limit is $\\ln 2$.', '$\\frac1{n+k} = \\frac1n\\cdot\\frac1{1 + k/n}$ と書くと、$[0, 1]$ 上の $1/(1 + x)$ のリーマン和です。極限は $\\ln 2$ です。'],
          [`\\sum_{k=1}^{n}\\dfrac{n}{n^2 + k^2}`, Math.PI / 4, '\\dfrac{\\pi}{4}', 'Write $\\frac{n}{n^2 + k^2} = \\frac1n\\cdot\\frac1{1 + (k/n)^2}$: a Riemann sum of $1/(1 + x^2)$, so the limit is $\\arctan 1 = \\pi/4$.', '$\\frac{n}{n^2 + k^2} = \\frac1n\\cdot\\frac1{1 + (k/n)^2}$ と書くと、$1/(1 + x^2)$ のリーマン和です。極限は $\\arctan 1 = \\pi/4$ です。'],
          [`\\dfrac1n\\sum_{k=1}^{n} e^{k/n}`, Math.E - 1, 'e - 1', 'This is a Riemann sum of $e^x$ on $[0, 1]$, so the limit is $e - 1$.', '$[0, 1]$ 上の $e^x$ のリーマン和なので、極限は $e - 1$ です。'],
          [`\\dfrac1n\\sum_{k=1}^{n}\\sin\\dfrac{k\\pi}{n}`, 2 / Math.PI, '\\dfrac{2}{\\pi}', 'This is a Riemann sum of $\\sin \\pi x$ on $[0, 1]$, so the limit is $\\int_0^1 \\sin\\pi x\\,dx = 2/\\pi$.', '$[0, 1]$ 上の $\\sin \\pi x$ のリーマン和なので、極限は $\\int_0^1 \\sin\\pi x\\,dx = 2/\\pi$ です。'],
        ][t];
        return {
          q: [`Find $\\displaystyle\\lim_{n \\to \\infty} ${R[0]}$.`, `$\\displaystyle\\lim_{n \\to \\infty} ${R[0]}$ を求めてください。`],
          a: { type: 'num', v: R[1], show: R[2], rel: 0.002 },
          hint: ['Do not manipulate the terms. Ask whether the sum is $\\frac1n\\sum f(k/n)$ for a nice $f$.', '項をいじる前に、和が $\\frac1n\\sum f(k/n)$ の形かどうかを確認します。'],
          sol: [[R[3], R[4]], [`The limit is $${R[2]} \\approx ${n(R[1], 5)}$. Recognising the Riemann sum turns an apparently hard limit of a sum into one integral.`, `極限は $${R[2]} \\approx ${n(R[1], 5)}$ です。リーマン和と見抜くと、和の難しそうな極限が 1 つの積分になります。`]],
        };
      }
      const a = r.int(1, 4), b = r.int(1, 4), t = r.int(0, 3);
      const E = [
        [`\\left(1 + \\dfrac{${a}}{n}\\right)^{${b}n}`, 'n \\to \\infty', Math.exp(a * b), `e^{${a * b}}`, `$(1 + u/n)^n \\to e^{u}$, and the extra factor $${b}$ in the exponent raises this to the power $${b}$: $e^{${a}\\cdot ${b}}$.`, `$(1 + u/n)^n \\to e^{u}$ で、指数の余分な因子 $${b}$ により $${b}$ 乗されて $e^{${a}\\cdot ${b}}$ になります。`],
        [`(1 + ${a}x)^{${b}/x}`, 'x \\to 0', Math.exp(a * b), `e^{${a * b}}`, `Put $x = 1/m$ with $m \\to \\infty$: $(1 + ${a}/m)^{${b}m} \\to e^{${a}\\cdot ${b}}$.`, `$x = 1/m$ とおくと $m \\to \\infty$ で、$(1 + ${a}/m)^{${b}m} \\to e^{${a}\\cdot ${b}}$ です。`],
        [`\\left(1 - \\dfrac{${a}}{n}\\right)^{${b}n}`, 'n \\to \\infty', Math.exp(-a * b), `e^{-${a * b}}`, `$(1 - u/n)^n \\to e^{-u}$; the exponent $${b}n$ raises it to the power $${b}$.`, `$(1 - u/n)^n \\to e^{-u}$ で、指数 $${b}n$ により $${b}$ 乗されます。`],
        [`\\left(\\cos\\dfrac{${a}}{n}\\right)^{${b}n^2}`, 'n \\to \\infty', Math.exp(-a * a * b / 2), `e^{-${frac(a * a * b, 2)}}`, `Take logarithms: $${b}n^2\\ln\\cos(${a}/n) \\sim ${b}n^2 \\cdot (-${a}^2/(2n^2)) = -${frac(a * a * b, 2)}$, since $\\ln\\cos u \\sim -u^2/2$.`, `対数をとります。$\\ln\\cos u \\sim -u^2/2$ なので $${b}n^2\\ln\\cos(${a}/n) \\sim ${b}n^2 \\cdot (-${a}^2/(2n^2)) = -${frac(a * a * b, 2)}$ です。`],
      ][t];
      return {
        q: [`Find $\\displaystyle\\lim_{${E[1]}} ${E[0]}$.`, `$\\displaystyle\\lim_{${E[1]}} ${E[0]}$ を求めてください。`],
        a: { type: 'num', v: E[2], show: E[3], rel: 0.003 },
        hint: ['A $1^\\infty$ shape: take the logarithm and find what the exponent multiplies.', '$1^\\infty$ の形です。対数をとり、指数が何に掛かっているかを調べます。'],
        sol: [[E[4], E[5]], [`So the limit is $${E[3]} \\approx ${n(E[2], 5)}$. The cue was the form (something near $1$) raised to a large power.`, `したがって極限は $${E[3]} \\approx ${n(E[2], 5)}$ です。合図は「$1$ に近いものの大きなべき」という形でした。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const t = r.int(0, 2);
        const F = [
          ['xy/(x^2+y^2)', 'm/(1+m^2)', 'y = mx', '\\dfrac{xy}{x^2 + y^2}', 'm', '(x, y) \\to (0, 0)', 'Substitute $y = mx$: $\\dfrac{m x^2}{x^2 + m^2x^2} = \\dfrac{m}{1 + m^2}$.', '$y = mx$ を代入すると $\\dfrac{m x^2}{x^2 + m^2x^2} = \\dfrac{m}{1 + m^2}$ です。'],
          ['k/(1+k^2)', 'k/(1+k^2)', 'y = kx^2', '\\dfrac{x^2 y}{x^4 + y^2}', 'k', '(x, y) \\to (0, 0)', 'Substitute $y = kx^2$: $\\dfrac{k x^4}{x^4 + k^2x^4} = \\dfrac{k}{1 + k^2}$.', '$y = kx^2$ を代入すると $\\dfrac{k x^4}{x^4 + k^2x^4} = \\dfrac{k}{1 + k^2}$ です。'],
          ['k/(1+k^2)', 'k/(1+k^2)', 'x = ky^2', '\\dfrac{x y^2}{x^2 + y^4}', 'k', '(x, y) \\to (0, 0)', 'Substitute $x = ky^2$: $\\dfrac{k y^4}{k^2y^4 + y^4} = \\dfrac{k}{1 + k^2}$.', '$x = ky^2$ を代入すると $\\dfrac{k y^4}{k^2y^4 + y^4} = \\dfrac{k}{1 + k^2}$ です。'],
        ][t];
        const v = t === 0 ? 'm/(1+m^2)' : 'k/(1+k^2)';
        const par = t === 0 ? 'm' : 'k';
        return {
          q: [`Along the path $${F[2]}$, what does $${F[3]}$ tend to as ${'$' + F[5] + '$'}? Give your answer as a formula in $${par}$.`, `経路 $${F[2]}$ に沿って ${'$' + F[5] + '$'} のとき、$${F[3]}$ は何に近づきますか。$${par}$ の式で答えてください。`],
          a: { type: 'expr', v, vars: [par], dom: { [par]: [0.3, 3] }, lhs: ['Limit $=$', '極限 $='] },
          hint: ['Substitute the path into the expression and simplify; the powers of $x$ should cancel.', '経路の式を代入して簡単にします。$x$ のべきが約分されるはずです。'],
          sol: [[F[6], F[7]], [`The value depends on $${par}$, so different paths give different limits: for instance $${par} = 1$ gives $1/2$ and $${par} = 0$ gives $0$. One disagreement between paths shows the two-variable limit does not exist.`, `値は $${par}$ に依存するので、経路によって極限が異なります。たとえば $${par} = 1$ なら $1/2$、$${par} = 0$ なら $0$ です。経路で値が 1 つでも食い違えば、2 変数の極限は存在しません。`]],
        };
      }
      if (form === 1) {
        const k = r.int(1, 6);
        let H = 0; for (let j = 1; j <= k; j++) H += 1 / j;
        const v = H / k;
        let hn = 0, hd = 1; for (let j = 1; j <= k; j++) { hn = hn * j + hd; hd = hd * j; const g = gcd(hn, hd); hn /= g; hd /= g; }
        const sh = frac(hn, hd * k);
        return {
          q: [`Find $\\displaystyle\\sum_{m=1}^{\\infty}\\dfrac{1}{m(m + ${k})}$.`, `$\\displaystyle\\sum_{m=1}^{\\infty}\\dfrac{1}{m(m + ${k})}$ を求めてください。`],
          a: { type: 'num', v, show: sh, rel: 1e-4 },
          hint: ['Split into partial fractions and look for a telescoping sum.', '部分分数に分け、望遠和にならないか調べます。'],
          sol: [[`$\\dfrac{1}{m(m + ${k})} = \\dfrac1${k}\\left(\\dfrac1m - \\dfrac1{m + ${k}}\\right)$.`, `$\\dfrac{1}{m(m + ${k})} = \\dfrac1${k}\\left(\\dfrac1m - \\dfrac1{m + ${k}}\\right)$ です。`], [`In the sum everything cancels except the first ${k} terms of $1/m$, leaving $\\dfrac1${k}\\left(1 + \\dfrac12 + \\dots + \\dfrac1${k}\\right) = ${sh} \\approx ${n(v, 5)}$.`, `和では $1/m$ の最初の ${k} 項を除いてすべて相殺され、$\\dfrac1${k}\\left(1 + \\dfrac12 + \\dots + \\dfrac1${k}\\right) = ${sh} \\approx ${n(v, 5)}$ が残ります。`]],
        };
      }
      if (form === 2) {
        const t = r.int(0, 3);
        let tex, conv, why, whyJa;
        if (t === 0) {
          const p = r.pick([0.5, 1, 1.5, 2, 3]); tex = `\\sum_{m=1}^{\\infty}\\dfrac{1}{m^{${p}}}`; conv = p > 1 ? 0 : 2;
          why = `This is a $p$-series with $p = ${p}$; it converges exactly when $p > 1$.`; whyJa = `$p = ${p}$ の $p$ 級数で、収束するのは $p > 1$ のときに限ります。`;
        } else if (t === 1) {
          const p = r.pick([0.5, 1, 1.5, 2]); tex = `\\sum_{m=2}^{\\infty}\\dfrac{1}{m(\\ln m)^{${p}}}`; conv = p > 1 ? 0 : 2;
          why = `The integral test with $u = \\ln x$ turns this into $\\int du/u^{${p}}$, which converges exactly when $${p} > 1$.`; whyJa = `積分判定で $u = \\ln x$ とおくと $\\int du/u^{${p}}$ になり、収束するのは $${p} > 1$ のときに限ります。`;
        } else if (t === 2) {
          const a = r.int(0, 3), b = r.int(1, 5); tex = `\\sum_{m=1}^{\\infty}\\dfrac{m^{${a}}}{m^{${b}} + 1}`; conv = b - a > 1 ? 0 : 2;
          why = `The terms behave like $m^{${a - b}}$, a $p$-series with $p = ${b - a}$, so by comparison it converges exactly when $${b - a} > 1$.`; whyJa = `項は $m^{${a - b}}$ のように振る舞い、$p = ${b - a}$ の $p$ 級数と比較できます。収束するのは $${b - a} > 1$ のときに限ります。`;
        } else {
          const p = r.pick([0.5, 1, 1.5, 2]); tex = `\\sum_{m=1}^{\\infty}\\dfrac{(-1)^m}{m^{${p}}}`; conv = p > 1 ? 0 : 1;
          why = `The alternating series test gives convergence for every $p > 0$, but the absolute series $\\sum m^{-${p}}$ converges only when $${p} > 1$.`; whyJa = `交代級数判定により $p > 0$ ならいつでも収束しますが、絶対値の級数 $\\sum m^{-${p}}$ が収束するのは $${p} > 1$ のときだけです。`;
        }
        const opts = [['Converges absolutely', '絶対収束する'], ['Converges, but not absolutely', '収束するが絶対収束しない'], ['Diverges', '発散する']];
        return {
          q: [`Classify $${tex}$.`, `$${tex}$ を分類してください。`],
          a: { type: 'choice', fixed: true, v: conv, opts },
          hint: ['Let the shape of the term pick the test: comparison with a $p$-series, the integral test, or the alternating series test.', '項の形が判定法を決めます。$p$ 級数との比較、積分判定、交代級数判定のどれかです。'],
          sol: [[why, whyJa], [conv === 0 ? 'So the series converges absolutely.' : conv === 1 ? 'So it converges, but only conditionally.' : 'So the series diverges.', conv === 0 ? 'したがって級数は絶対収束します。' : conv === 1 ? 'したがって収束しますが、条件収束です。' : 'したがって級数は発散します。']],
        };
      }
      const t = r.int(0, 2), c = r.int(2, 9);
      let x = c, L, texRec, texLim, exact;
      if (t === 0) { for (let i = 0; i < 200; i++) x = (x + c / x) / 2; L = x; texRec = `x_{k+1} = \\dfrac12\\left(x_k + \\dfrac{${c}}{x_k}\\right)`; texLim = `\\sqrt{${c}}`; exact = `\\sqrt{${c}}`; }
      else if (t === 1) { for (let i = 0; i < 400; i++) x = Math.sqrt(c + x); L = x; texRec = `x_{k+1} = \\sqrt{${c} + x_k}`; texLim = `\\dfrac{1 + \\sqrt{${1 + 4 * c}}}{2}`; exact = texLim; }
      else { for (let i = 0; i < 400; i++) x = c / (1 + x); L = x; texRec = `x_{k+1} = \\dfrac{${c}}{1 + x_k}`; texLim = `\\dfrac{-1 + \\sqrt{${1 + 4 * c}}}{2}`; exact = texLim; }
      return {
        q: [`The sequence $x_0 = ${c}$, $${texRec}$ converges. Find its limit. (A decimal is fine.)`, `数列 $x_0 = ${c}$、$${texRec}$ は収束します。極限を求めてください。（小数でかまいません。）`],
        a: { type: 'num', v: L, show: exact, rel: 1e-4 },
        hint: ['If the limit $L$ exists, it must be a fixed point of the recursion. Solve for it.', '極限 $L$ が存在するなら、それは漸化式の不動点です。それを解きます。'],
        sol: [[t === 0 ? `Setting $x_{k+1} = x_k = L$ gives $L = \\frac12(L + ${c}/L)$, so $L^2 = ${c}$.` : t === 1 ? `Setting $x_{k+1} = x_k = L$ gives $L^2 = ${c} + L$, so $L^2 - L - ${c} = 0$.` : `Setting $x_{k+1} = x_k = L$ gives $L(1 + L) = ${c}$, so $L^2 + L - ${c} = 0$.`, t === 0 ? `$x_{k+1} = x_k = L$ とおくと $L = \\frac12(L + ${c}/L)$、すなわち $L^2 = ${c}$ です。` : t === 1 ? `$x_{k+1} = x_k = L$ とおくと $L^2 = ${c} + L$、すなわち $L^2 - L - ${c} = 0$ です。` : `$x_{k+1} = x_k = L$ とおくと $L(1 + L) = ${c}$、すなわち $L^2 + L - ${c} = 0$ です。`], [`The positive root is $${exact} \\approx ${n(L, 6)}$, and the sequence stays positive, so this is the limit. (Finding fixed points only identifies candidates; one still has to show the sequence converges, here by monotonicity and boundedness.)`, `正の根は $${exact} \\approx ${n(L, 6)}$ で、数列は正のままなのでこれが極限です。（不動点は候補を見つけるだけで、数列が収束することは別に示す必要があります。ここでは単調性と有界性で示せます。）`]],
      };
    },
  ];

  /* ---------- integrals ---------- */
  Q['explore-structure-before-algebra-integrals'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 4), c = r.int(1, 6), d = r.int(1, 5), t = r.int(0, 1);
        const v = t === 0 ? 2 * c * Math.pow(a, 3) / 3 : 2 * c * a;
        return {
          q: t === 0 ? [`Evaluate $\\displaystyle\\int_{-${a}}^{${a}} \\left(x^3\\cos x + ${c}x^2 + ${d}x\\right)dx$.`, `$\\displaystyle\\int_{-${a}}^{${a}} \\left(x^3\\cos x + ${c}x^2 + ${d}x\\right)dx$ を求めてください。`] : [`Evaluate $\\displaystyle\\int_{-${a}}^{${a}} \\left(x^5 e^{x^2} + ${c} + ${d}\\sin x\\right)dx$.`, `$\\displaystyle\\int_{-${a}}^{${a}} \\left(x^5 e^{x^2} + ${c} + ${d}\\sin x\\right)dx$ を求めてください。`],
          a: { type: 'num', v, show: t === 0 ? frac(2 * c * Math.pow(a, 3), 3) : String(v), rel: 1e-6 },
          hint: ['Check the parity of each term before integrating anything.', '何かを積分する前に、各項の偶奇を確かめます。'],
          sol: [[t === 0 ? 'The terms $x^3\\cos x$ and $dx$ are odd, so they integrate to $0$ over a symmetric interval.' : 'The terms $x^5e^{x^2}$ and $\\sin x$ are odd, so they integrate to $0$ over a symmetric interval.', t === 0 ? '$x^3\\cos x$ と $dx$ の項は奇関数なので、対称な区間での積分は $0$ です。' : '$x^5e^{x^2}$ と $\\sin x$ は奇関数なので、対称な区間での積分は $0$ です。'], [t === 0 ? `Only $${c}x^2$ survives: $${c}\\cdot 2a^3/3 = ${n(v, 5)}$ with $a = ${a}$.` : `Only the constant $${c}$ survives: $${c}\\cdot 2a = ${v}$ with $a = ${a}$.`, t === 0 ? `残るのは $${c}x^2$ だけで、$a = ${a}$ のとき $${c}\\cdot 2a^3/3 = ${n(v, 5)}$ です。` : `残るのは定数 $${c}$ だけで、$a = ${a}$ のとき $${c}\\cdot 2a = ${v}$ です。`]],
        };
      }
      if (form === 1) {
        const t = r.int(0, 3), a = r.int(1, 3), m = r.int(1, 4);
        const I = [
          [`\\int_0^{${a}} 2x\\,e^{x^2}\\,dx`, Math.exp(a * a) - 1, `e^{${a * a}} - 1`, `With $u = x^2$, $du = 2x\\,dx$: the integral is $\\int_0^{${a * a}} e^u\\,du = e^{${a * a}} - 1$.`, `$u = x^2$、$du = 2x\\,dx$ とおくと、$\\int_0^{${a * a}} e^u\\,du = e^{${a * a}} - 1$ です。`],
          [`\\int_0^{\\pi/2} \\sin^{${m}}x\\cos x\\,dx`, 1 / (m + 1), frac(1, m + 1), `With $u = \\sin x$, $du = \\cos x\\,dx$: $\\int_0^1 u^{${m}}\\,du = ${frac(1, m + 1)}$.`, `$u = \\sin x$、$du = \\cos x\\,dx$ とおくと $\\int_0^1 u^{${m}}\\,du = ${frac(1, m + 1)}$ です。`],
          [`\\int_1^{e} \\dfrac{(\\ln x)^{${m}}}{x}\\,dx`, 1 / (m + 1), frac(1, m + 1), `With $u = \\ln x$, $du = dx/x$: $\\int_0^1 u^{${m}}\\,du = ${frac(1, m + 1)}$.`, `$u = \\ln x$、$du = dx/x$ とおくと $\\int_0^1 u^{${m}}\\,du = ${frac(1, m + 1)}$ です。`],
          [`\\int_0^{${a}} \\dfrac{x}{x^2 + ${m}}\\,dx`, 0.5 * Math.log((a * a + m) / m), `\\tfrac12\\ln\\dfrac{${a * a + m}}{${m}}`, `With $u = x^2 + ${m}$, $du = 2x\\,dx$: the integral is $\\tfrac12\\ln\\frac{${a * a + m}}{${m}}$.`, `$u = x^2 + ${m}$、$du = 2x\\,dx$ とおくと、積分は $\\tfrac12\\ln\\frac{${a * a + m}}{${m}}$ です。`],
        ][t];
        return {
          q: [`Evaluate $${I[0]}$. (A decimal is fine.)`, `$${I[0]}$ を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v: I[1], show: I[2], rel: 1e-3 },
          hint: ['Look for a factor that is the derivative of another part of the integrand.', '被積分関数の中に、別の部分の導関数になっている因子がないか探します。'],
          sol: [[I[3], I[4]], [`The value is $${I[2]} \\approx ${n(I[1], 5)}$. Match the visible differential first; the substitution then does itself.`, `値は $${I[2]} \\approx ${n(I[1], 5)}$ です。まず見えている微分を合わせれば、置換は自然に決まります。`]],
        };
      }
      const t = r.int(0, 2), a = r.pick([2, 4, 6, 8, 10]);
      const G = [['e^{x}', 'e^{x}', 'e^{a-x}'], ['x + 1', 'x + 1', 'a - x + 1'], ['x^2 + 1', 'x^2 + 1', '(a-x)^2 + 1']][t];
      return {
        q: [`Evaluate $\\displaystyle\\int_0^{${a}} \\dfrac{${G[1]}}{${G[1]} + ${G[2].replace('a', String(a))}}\\,dx$.`, `$\\displaystyle\\int_0^{${a}} \\dfrac{${G[1]}}{${G[1]} + ${G[2].replace('a', String(a))}}\\,dx$ を求めてください。`],
        a: { type: 'num', v: a / 2, tol: 1e-9 },
        hint: ['Replace $x$ by $' + a + ' - x$ and add the new integral to the old one.', '$x$ を $' + a + ' - x$ に置き換え、新しい積分を元の積分に足します。'],
        sol: [[`Call the integral $I$. Substituting $x \\mapsto ${a} - x$ turns the integrand into $\\dfrac{g(${a}-x)}{g(${a}-x) + g(x)}$, so $I$ is also the integral of that.`, `積分を $I$ とします。$x \\mapsto ${a} - x$ と置き換えると被積分関数は $\\dfrac{g(${a}-x)}{g(${a}-x) + g(x)}$ になり、$I$ はこの積分にも等しくなります。`], [`Adding the two expressions gives $2I = \\int_0^{${a}} 1\\,dx = ${a}$, so $I = ${a / 2}$. The structure (a function over itself plus its reflection) gives the answer with no antiderivative.`, `2 つの式を足すと $2I = \\int_0^{${a}} 1\\,dx = ${a}$ なので $I = ${a / 2}$ です。構造（関数をそれ自身と鏡像の和で割ったもの）が、原始関数なしで答えを与えます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(2, 5);
        let I = Math.E - 1; const seq = [I];
        for (let j = 1; j <= k; j++) { I = Math.E - j * I; seq.push(I); }
        const ex = (() => { const c = [0, 0]; return null; })();
        return {
          q: [`Let $I_j = \\displaystyle\\int_0^1 x^{j} e^{x}\\,dx$. Find $I_{${k}}$. (A decimal is fine.)`, `$I_j = \\displaystyle\\int_0^1 x^{j} e^{x}\\,dx$ とします。$I_{${k}}$ を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v: seq[k], rel: 2e-3 },
          hint: ['Integrate by parts once to get a recursion linking $I_j$ and $I_{j-1}$.', '部分積分を 1 回行い、$I_j$ と $I_{j-1}$ を結ぶ漸化式を作ります。'],
          sol: [[`By parts, $I_j = [x^j e^x]_0^1 - j I_{j-1} = e - jI_{j-1}$, with $I_0 = e - 1$.`, `部分積分より $I_j = [x^j e^x]_0^1 - j I_{j-1} = e - jI_{j-1}$、$I_0 = e - 1$ です。`], [`Running the ladder up: ${seq.map((v, j) => `$I_{${j}} = ${n(v, 5)}$`).join(', ')}. So $I_{${k}} \\approx ${n(seq[k], 5)}$.`, `漸化式を順にたどると ${seq.map((v, j) => `$I_{${j}} = ${n(v, 5)}$`).join('、')} となり、$I_{${k}} \\approx ${n(seq[k], 5)}$ です。`]],
        };
      }
      if (form === 1) {
        const k = r.int(2, 5), a = r.int(2, 5), t = r.int(0, 1);
        const v = t === 0 ? fact(k) / Math.pow(a, k + 1) : Math.log(a * 2 / 1) * 0 + Math.log(a / 1);
        if (t === 1) {
          const b = a + r.int(1, 4);
          return {
            q: [`Evaluate $\\displaystyle\\int_0^{\\infty} \\dfrac{e^{-${a}x} - e^{-${b}x}}{x}\\,dx$. (A decimal is fine.)`, `$\\displaystyle\\int_0^{\\infty} \\dfrac{e^{-${a}x} - e^{-${b}x}}{x}\\,dx$ を求めてください。（小数でかまいません。）`],
            a: { type: 'num', v: Math.log(b / a), show: `\\ln\\dfrac{${b}}{${a}}`, rel: 1e-3 },
            hint: ['Write the integrand as an integral over a parameter, or recognise the Frullani form $\\int (f(ax) - f(bx))/x\\,dx$.', '被積分関数をパラメータ積分で書くか、フルラーニの形 $\\int (f(ax) - f(bx))/x\\,dx$ と見抜きます。'],
            sol: [[`With $f(u) = e^{-u}$ this is Frullani's integral: $\\int_0^\\infty \\frac{f(ax) - f(bx)}{x}dx = (f(0) - f(\\infty))\\ln\\frac{b}{a}$.`, `$f(u) = e^{-u}$ とするとフルラーニの積分で、$\\int_0^\\infty \\frac{f(ax) - f(bx)}{x}dx = (f(0) - f(\\infty))\\ln\\frac{b}{a}$ です。`], [`Here $f(0) - f(\\infty) = 1$, so the value is $\\ln\\frac{${b}}{${a}} \\approx ${n(Math.log(b / a), 5)}$. Equivalently, $\\frac{e^{-ax} - e^{-bx}}{x} = \\int_a^b e^{-sx}ds$, and integrating in $x$ first gives $\\int_a^b ds/s$.`, `ここで $f(0) - f(\\infty) = 1$ なので値は $\\ln\\frac{${b}}{${a}} \\approx ${n(Math.log(b / a), 5)}$ です。同じことですが、$\\frac{e^{-ax} - e^{-bx}}{x} = \\int_a^b e^{-sx}ds$ と書き、先に $x$ で積分すると $\\int_a^b ds/s$ になります。`]],
          };
        }
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{\\infty} x^{${k}} e^{-${a}x}\\,dx$. (A decimal is fine.)`, `$\\displaystyle\\int_0^{\\infty} x^{${k}} e^{-${a}x}\\,dx$ を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v, show: frac(fact(k), Math.pow(a, k + 1)), rel: 1e-3 },
          hint: ['Start from $\\int_0^\\infty e^{-sx}dx = 1/s$ and differentiate with respect to the parameter $s$.', '$\\int_0^\\infty e^{-sx}dx = 1/s$ から始め、パラメータ $s$ で微分します。'],
          sol: [[`Differentiating $\\int_0^\\infty e^{-sx}dx = 1/s$ ${k} times in $s$ gives $\\int_0^\\infty x^{${k}}e^{-sx}dx = ${k}!/s^{${k + 1}}$.`, `$\\int_0^\\infty e^{-sx}dx = 1/s$ を $s$ で ${k} 回微分すると $\\int_0^\\infty x^{${k}}e^{-sx}dx = ${k}!/s^{${k + 1}}$ です。`], [`At $s = ${a}$ this is $${fact(k)}/${Math.pow(a, k + 1)} = ${n(v, 6)}$. Differentiating under the integral sign is Feynman's trick: turn a hard integral into a derivative of an easy one.`, `$s = ${a}$ では $${fact(k)}/${Math.pow(a, k + 1)} = ${n(v, 6)}$ です。積分記号下の微分（ファインマンの技法）は、難しい積分を易しい積分の微分に変えます。`]],
        };
      }
      const t = r.int(0, 2), b = r.int(2, 4), m = r.int(0, 2), nn = r.int(2, 5);
      if (t === 0) {
        const v = fact(nn) / Math.pow(m + 1, nn + 1);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^1 x^{${m}}\\left(-\\ln x\\right)^{${nn}}dx$. (A decimal is fine.)`, `$\\displaystyle\\int_0^1 x^{${m}}\\left(-\\ln x\\right)^{${nn}}dx$ を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v, show: frac(fact(nn), Math.pow(m + 1, nn + 1)), rel: 1e-3 },
          hint: ['Substitute $x = e^{-u}$ to turn the logarithm into a plain power.', '$x = e^{-u}$ と置換して、対数を単なるべきにします。'],
          sol: [[`With $x = e^{-u}$, $dx = -e^{-u}du$ the integral becomes $\\int_0^\\infty u^{${nn}}e^{-${m + 1}u}du$.`, `$x = e^{-u}$、$dx = -e^{-u}du$ とおくと、積分は $\\int_0^\\infty u^{${nn}}e^{-${m + 1}u}du$ になります。`], [`This is a gamma integral: $${nn}!/${m + 1}^{${nn + 1}} = ${n(v, 6)}$. The logarithm was a disguise for an exponential.`, `ガンマ積分で、$${nn}!/${m + 1}^{${nn + 1}} = ${n(v, 6)}$ です。対数は指数関数の変装でした。`]],
        };
      }
      if (t === 1) {
        const mm = r.int(1, 3);
        const v = Math.PI * Math.PI / 2 * dfact(2 * mm - 1) / dfact(2 * mm);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{\\pi} x\\sin^{${2 * mm}}x\\,dx$. (A decimal is fine.)`, `$\\displaystyle\\int_0^{\\pi} x\\sin^{${2 * mm}}x\\,dx$ を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v, show: `\\dfrac{${dfact(2 * mm - 1)}\\pi^2}{${2 * dfact(2 * mm)}}`, rel: 1e-3 },
          hint: ['Reflect $x \\mapsto \\pi - x$: $\\sin$ does not change, but $x$ becomes $\\pi - x$. Add the two forms.', '$x \\mapsto \\pi - x$ と反転します。$\\sin$ は変わらず、$x$ が $\\pi - x$ になります。2 つの形を足します。'],
          sol: [[`Reflecting gives $I = \\int_0^\\pi(\\pi - x)\\sin^{${2 * mm}}x\\,dx$, so $2I = \\pi\\int_0^\\pi \\sin^{${2 * mm}}x\\,dx$ and $I = \\frac\\pi2\\int_0^\\pi\\sin^{${2 * mm}}x\\,dx$.`, `反転すると $I = \\int_0^\\pi(\\pi - x)\\sin^{${2 * mm}}x\\,dx$ なので、$2I = \\pi\\int_0^\\pi \\sin^{${2 * mm}}x\\,dx$、$I = \\frac\\pi2\\int_0^\\pi\\sin^{${2 * mm}}x\\,dx$ です。`], [`The Wallis integral is $\\int_0^\\pi\\sin^{${2 * mm}}x\\,dx = \\pi\\cdot\\frac{${dfact(2 * mm - 1)}}{${dfact(2 * mm)}}$, so $I = \\frac{\\pi^2}{2}\\cdot\\frac{${dfact(2 * mm - 1)}}{${dfact(2 * mm)}} \\approx ${n(v, 5)}$.`, `ウォリスの積分は $\\int_0^\\pi\\sin^{${2 * mm}}x\\,dx = \\pi\\cdot\\frac{${dfact(2 * mm - 1)}}{${dfact(2 * mm)}}$ なので、$I = \\frac{\\pi^2}{2}\\cdot\\frac{${dfact(2 * mm - 1)}}{${dfact(2 * mm)}} \\approx ${n(v, 5)}$ です。`]],
        };
      }
      const C = [
        ['\\int_0^1 \\dfrac{\\ln(1 + x)}{x}\\,dx', Math.PI * Math.PI / 12, '\\dfrac{\\pi^2}{12}', 'Expand $\\ln(1 + x) = \\sum (-1)^{k+1}x^k/k$ and integrate term by term: $\\sum (-1)^{k+1}/k^2 = \\pi^2/12$.', '$\\ln(1 + x) = \\sum (-1)^{k+1}x^k/k$ と展開して項別に積分すると $\\sum (-1)^{k+1}/k^2 = \\pi^2/12$ です。'],
        ['-\\int_0^1 \\dfrac{\\ln(1 - x)}{x}\\,dx', Math.PI * Math.PI / 6, '\\dfrac{\\pi^2}{6}', 'Expand $-\\ln(1 - x) = \\sum x^k/k$ and integrate term by term: $\\sum 1/k^2 = \\pi^2/6$.', '$-\\ln(1 - x) = \\sum x^k/k$ と展開して項別に積分すると $\\sum 1/k^2 = \\pi^2/6$ です。'],
        ['-\\int_0^1 \\dfrac{\\ln x}{1 + x}\\,dx', Math.PI * Math.PI / 12, '\\dfrac{\\pi^2}{12}', 'Expand $\\frac1{1 + x} = \\sum(-1)^kx^k$ and use $-\\int_0^1 x^k\\ln x\\,dx = 1/(k + 1)^2$: the sum is $\\sum (-1)^k/(k + 1)^2 = \\pi^2/12$.', '$\\frac1{1 + x} = \\sum(-1)^kx^k$ と展開し、$-\\int_0^1 x^k\\ln x\\,dx = 1/(k + 1)^2$ を使うと、和は $\\sum (-1)^k/(k + 1)^2 = \\pi^2/12$ です。'],
      ][r.int(0, 2)];
      return {
        q: [`Evaluate $${C[0]}$. (A decimal is fine.)`, `$${C[0]}$ を求めてください。（小数でかまいません。）`],
        a: { type: 'num', v: C[1], show: C[2], rel: 1e-3 },
        hint: ['Expand into a power series and integrate term by term; then identify the numerical series.', 'べき級数に展開して項別に積分し、現れる数列の和を同定します。'],
        sol: [[C[3], C[4]], [`The value is $${C[2]} \\approx ${n(C[1], 5)}$. Interchanging sum and integral is justified here because the series converges well enough (for example by monotone convergence).`, `値は $${C[2]} \\approx ${n(C[1], 5)}$ です。和と積分の交換は、級数が十分よく収束する（たとえば単調収束定理が使える）ので正当化できます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      const b = r.int(1, 4);
      if (form === 0) {
        return {
          q: [`Define $I(a) = \\displaystyle\\int_0^1 \\dfrac{x^{a} - 1}{\\ln x}\\,dx$ for $a > 0$. Find $I(a)$ as a formula in $a$. (Hint: differentiate in $a$.)`, `$a > 0$ に対して $I(a) = \\displaystyle\\int_0^1 \\dfrac{x^{a} - 1}{\\ln x}\\,dx$ とします。$I(a)$ を $a$ の式で求めてください。（ヒント：$a$ で微分します。）`],
          a: { type: 'expr', v: 'ln(1+a)', vars: ['a'], dom: { a: [0.35, 3] }, lhs: ['$I(a) =$', '$I(a) =$'] },
          hint: ['$\\dfrac{d}{da}x^a = x^a\\ln x$ cancels the denominator.', '$\\dfrac{d}{da}x^a = x^a\\ln x$ で分母が消えます。'],
          sol: [[`$I'(a) = \\int_0^1 x^a\\,dx = \\dfrac{1}{a + 1}$, and $I(0) = 0$.`, `$I'(a) = \\int_0^1 x^a\\,dx = \\dfrac{1}{a + 1}$、$I(0) = 0$ です。`], [`Integrating gives $I(a) = \\ln(1 + a)$. The parameter turned a non-elementary integrand into a trivial one.`, `積分すると $I(a) = \\ln(1 + a)$ です。パラメータを入れたことで、初等的でない被積分関数が自明なものになりました。`]],
        };
      }
      if (form === 1) {
        return {
          q: [`Define $I(a) = \\displaystyle\\int_0^{\\infty} e^{-ax}\\sin(${b}x)\\,dx$ for $a > 0$. Find $I(a)$ as a formula in $a$.`, `$a > 0$ に対して $I(a) = \\displaystyle\\int_0^{\\infty} e^{-ax}\\sin(${b}x)\\,dx$ とします。$I(a)$ を $a$ の式で求めてください。`],
          a: { type: 'expr', v: `${b}/(a^2+${b * b})`, vars: ['a'], dom: { a: [0.35, 3] }, lhs: ['$I(a) =$', '$I(a) =$'] },
          hint: ['Treat it as the imaginary part of $\\int_0^\\infty e^{-(a - ib)x}dx$.', '$\\int_0^\\infty e^{-(a - ib)x}dx$ の虚部とみなします。'],
          sol: [[`$\\int_0^\\infty e^{-(a - ${b}i)x}dx = \\dfrac{1}{a - ${b}i} = \\dfrac{a + ${b}i}{a^2 + ${b * b}}$.`, `$\\int_0^\\infty e^{-(a - ${b}i)x}dx = \\dfrac{1}{a - ${b}i} = \\dfrac{a + ${b}i}{a^2 + ${b * b}}$ です。`], [`Taking the imaginary part gives $I(a) = \\dfrac{${b}}{a^2 + ${b * b}}$ (the real part gives the cosine integral $a/(a^2 + ${b * b})$). No integration by parts was needed.`, `虚部をとると $I(a) = \\dfrac{${b}}{a^2 + ${b * b}}$ です（実部は余弦の積分 $a/(a^2 + ${b * b})$ を与えます）。部分積分は不要でした。`]],
        };
      }
      if (form === 2) {
        return {
          q: [`Define $I(a) = \\displaystyle\\int_0^{\\infty} \\dfrac{1 - e^{-ax}}{x}\\,e^{-x}\\,dx$ for $a > 0$. Find $I(a)$ as a formula in $a$.`, `$a > 0$ に対して $I(a) = \\displaystyle\\int_0^{\\infty} \\dfrac{1 - e^{-ax}}{x}\\,e^{-x}\\,dx$ とします。$I(a)$ を $a$ の式で求めてください。`],
          a: { type: 'expr', v: 'ln(1+a)', vars: ['a'], dom: { a: [0.35, 3] }, lhs: ['$I(a) =$', '$I(a) =$'] },
          hint: ['Differentiate in $a$: the factor $1/x$ cancels against $\\partial_a(1 - e^{-ax}) = xe^{-ax}$.', '$a$ で微分すると、$\\partial_a(1 - e^{-ax}) = xe^{-ax}$ により因子 $1/x$ が消えます。'],
          sol: [[`$I'(a) = \\int_0^\\infty e^{-(1 + a)x}dx = \\dfrac{1}{1 + a}$, and $I(0) = 0$.`, `$I'(a) = \\int_0^\\infty e^{-(1 + a)x}dx = \\dfrac{1}{1 + a}$、$I(0) = 0$ です。`], [`So $I(a) = \\ln(1 + a)$. This is Frullani's integral for the pair of rates $1$ and $1 + a$.`, `したがって $I(a) = \\ln(1 + a)$ です。これは速さ $1$ と $1 + a$ の組に対するフルラーニの積分です。`]],
        };
      }
      return {
        q: [`Define $I(a) = \\displaystyle\\int_0^{\\infty} e^{-x^2}\\cos(ax)\\,dx$. Find $I(a)$ as a formula in $a$.`, `$I(a) = \\displaystyle\\int_0^{\\infty} e^{-x^2}\\cos(ax)\\,dx$ とします。$I(a)$ を $a$ の式で求めてください。`],
        a: { type: 'expr', v: 'sqrt(pi)/2*exp(-a^2/4)', vars: ['a'], dom: { a: [0.2, 2.5] }, lhs: ['$I(a) =$', '$I(a) =$'] },
        hint: ['Differentiate in $a$ and integrate by parts: you get a differential equation for $I$.', '$a$ で微分して部分積分すると、$I$ についての微分方程式が得られます。'],
        sol: [[`$I'(a) = -\\int_0^\\infty xe^{-x^2}\\sin(ax)\\,dx = -\\dfrac a2 I(a)$ after integrating by parts, with $I(0) = \\sqrt\\pi/2$.`, `$I'(a) = -\\int_0^\\infty xe^{-x^2}\\sin(ax)\\,dx$ を部分積分すると $-\\dfrac a2 I(a)$ となり、$I(0) = \\sqrt\\pi/2$ です。`], [`The first-order linear equation $I' = -\\frac a2 I$ gives $I(a) = \\dfrac{\\sqrt\\pi}{2}e^{-a^2/4}$: the Gaussian is its own Fourier transform up to scaling.`, `1 階線形方程式 $I' = -\\frac a2 I$ から $I(a) = \\dfrac{\\sqrt\\pi}{2}e^{-a^2/4}$ が得られます。ガウス関数は、尺度を除いて自分自身のフーリエ変換です。`]],
      };
    },
  ];

  /* ---------- differential equations ---------- */
  const ODES = [
    ['y\' = xy^2', 0, 'it can be written as $dy/y^2 = x\\,dx$', '$dy/y^2 = x\\,dx$ と書けます'],
    ['y\' = y(1 - y)', 0, 'it is autonomous, so $dy/(y(1 - y)) = dx$', '自律系なので $dy/(y(1 - y)) = dx$ と書けます'],
    ['y\' = e^{x - y}', 0, 'it equals $e^{x}e^{-y}$, so $e^{y}dy = e^{x}dx$', '$e^{x}e^{-y}$ に等しいので $e^{y}dy = e^{x}dx$ と書けます'],
    ['y\' = (1 + y^2)\\cos x', 0, 'it can be written as $dy/(1 + y^2) = \\cos x\\,dx$', '$dy/(1 + y^2) = \\cos x\\,dx$ と書けます'],
    ['y\' + 2y = x', 1, 'it has the form $y\' + p(x)y = q(x)$ with $q = x$ not a multiple of $y$', '$y\' + p(x)y = q(x)$ の形で、$q = x$ は $y$ の倍数ではありません'],
    ['y\' + \\dfrac{y}{x} = x^2', 1, 'it has the form $y\' + p(x)y = q(x)$ and the term $q = x^2$ does not contain $y$', '$y\' + p(x)y = q(x)$ の形で、$q = x^2$ に $y$ は含まれません'],
    ['xy\' + y = e^{x}', 1, 'dividing by $x$ gives $y\' + y/x = e^{x}/x$, linear in $y$', '$x$ で割ると $y\' + y/x = e^{x}/x$ で、$y$ について線形です'],
    ['y\' - y\\tan x = \\sec x', 1, 'it is linear in $y$ with a forcing term that does not involve $y$', '$y$ について線形で、強制項に $y$ は含まれません'],
    ['(2xy + 1)\\,dx + (x^2 + 3y^2)\\,dy = 0', 2, '$\\partial_y(2xy + 1) = 2x = \\partial_x(x^2 + 3y^2)$', '$\\partial_y(2xy + 1) = 2x = \\partial_x(x^2 + 3y^2)$ です'],
    ['(3x^2y + 2x)\\,dx + (x^3 + 2y)\\,dy = 0', 2, '$\\partial_y(3x^2y + 2x) = 3x^2 = \\partial_x(x^3 + 2y)$', '$\\partial_y(3x^2y + 2x) = 3x^2 = \\partial_x(x^3 + 2y)$ です'],
    ['(\\cos x + y)\\,dx + (x + 2y)\\,dy = 0', 2, '$\\partial_y(\\cos x + y) = 1 = \\partial_x(x + 2y)$', '$\\partial_y(\\cos x + y) = 1 = \\partial_x(x + 2y)$ です'],
  ];

  Q['explore-structure-before-algebra-odes'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const it = r.pick(ODES);
        return {
          q: [`Which description fits the equation $${it[0]}$ best?`, `方程式 $${it[0]}$ に最もよく当てはまる記述はどれですか。`],
          a: { type: 'choice', fixed: true, v: it[1], opts: [['Separable', '変数分離形'], ['Linear in $y$ (and not separable)', '$y$ について線形（かつ変数分離形でない）'], ['Exact (and neither separable nor linear)', '完全形（変数分離形でも線形でもない）']] },
          hint: ['Ask in turn: can the variables be separated? is it linear in $y$? is $M\\,dx + N\\,dy$ a total differential, $M_y = N_x$?', '順に問います。変数を分けられるか、$y$ について線形か、$M\\,dx + N\\,dy$ が全微分か（$M_y = N_x$）。'],
          sol: [[`Here ${it[2]}.`, `ここでは${it[3]}。`], [it[1] === 0 ? 'So separate the variables and integrate both sides.' : it[1] === 1 ? 'So use the integrating factor $\\mu = e^{\\int p\\,dx}$.' : 'So look for a potential function $\\psi$ with $\\psi_x = M$, $\\psi_y = N$.', it[1] === 0 ? 'したがって変数を分離し、両辺を積分します。' : it[1] === 1 ? 'したがって積分因子 $\\mu = e^{\\int p\\,dx}$ を使います。' : 'したがって $\\psi_x = M$、$\\psi_y = N$ を満たすポテンシャル関数 $\\psi$ を探します。']],
        };
      }
      if (form === 1) {
        const k = r.pick([-2, -1, 1, 2, 3]), y0 = r.int(1, 5), T = r.pick([0.5, 1, 2]), t = r.int(0, 1);
        if (t === 0) {
          const v = y0 * Math.exp(k * T);
          return {
            q: [`A quantity satisfies $y' = ${k}y$ with $y(0) = ${y0}$. Find $y(${T})$. (A decimal is fine.)`, `量 $y$ が $y' = ${k}y$、$y(0) = ${y0}$ を満たします。$y(${T})$ を求めてください。（小数でかまいません。）`],
            a: { type: 'num', v, rel: 3e-3 },
            hint: ['Separate the variables: $dy/y = k\\,dx$.', '変数を分離します。$dy/y = k\\,dx$ です。'],
            sol: [[`$\\ln|y| = ${k}x + C$, so $y = ${y0}e^{${k}x}$ using $y(0) = ${y0}$.`, `$\\ln|y| = ${k}x + C$ なので、$y(0) = ${y0}$ を使って $y = ${y0}e^{${k}x}$ です。`], [`At $x = ${T}$: $y = ${y0}e^{${k * T}} \\approx ${n(v, 5)}$. A ${k > 0 ? 'growth' : 'decay'} rate ${Math.abs(k)} gives ${k > 0 ? 'doubling' : 'halving'} time $\\ln 2/${Math.abs(k)}$.`, `$x = ${T}$ では $y = ${y0}e^{${k * T}} \\approx ${n(v, 5)}$ です。${k > 0 ? '増加' : '減少'}率 ${Math.abs(k)} では、${k > 0 ? '倍増' : '半減'}の時間は $\\ln 2/${Math.abs(k)}$ です。`]],
          };
        }
        const kk = Math.abs(k);
        return {
          q: [`A quantity satisfies $y' = ${k > 0 ? '' : '-'}${kk}y$ with $y(0) > 0$. How long does it take to ${k > 0 ? 'double' : 'halve'}? (A decimal is fine.)`, `量 $y$ が $y' = ${k > 0 ? '' : '-'}${kk}y$、$y(0) > 0$ を満たします。${k > 0 ? '2 倍' : '半分'}になるまでの時間を求めてください。（小数でかまいません。）`],
          a: { type: 'num', v: Math.LN2 / kk, show: `\\dfrac{\\ln 2}{${kk}}`, rel: 3e-3 },
          hint: ['The solution is $y(0)e^{kt}$; set it equal to $2y(0)$ or $\\frac12 y(0)$.', '解は $y(0)e^{kt}$ です。それが $2y(0)$ または $\\frac12 y(0)$ になる $t$ を求めます。'],
          sol: [[`$y(t) = y(0)e^{${k}t}$, so we need $e^{${kk}t} = 2$ (or its reciprocal).`, `$y(t) = y(0)e^{${k}t}$ なので、$e^{${kk}t} = 2$（またはその逆数）となる $t$ が必要です。`], [`Hence $t = \\ln 2/${kk} \\approx ${n(Math.LN2 / kk, 5)}$, independent of $y(0)$: exponential change has a fixed doubling or halving time.`, `したがって $t = \\ln 2/${kk} \\approx ${n(Math.LN2 / kk, 5)}$ で、$y(0)$ によりません。指数的な変化には一定の倍増・半減時間があります。`]],
        };
      }
      const t = r.int(0, 1);
      if (t === 0) {
        const a = r.int(1, 5);
        return {
          q: [`Find an integrating factor $\\mu(x)$ for $y' + ${a}y = \\sin x$.`, `$y' + ${a}y = \\sin x$ の積分因子 $\\mu(x)$ を求めてください。`],
          a: { type: 'expr', v: `exp(${a}*x)`, vars: ['x'], dom: { x: [0.2, 1.5] }, lhs: ['$\\mu(x) =$', '$\\mu(x) =$'] },
          hint: ['For $y' + "' + p(x)y = q(x)$, take $\\mu = e^{\\int p\\,dx}$.", '$y\' + p(x)y = q(x)$ では $\\mu = e^{\\int p\\,dx}$ をとります。'],
          sol: [[`Here $p = ${a}$, so $\\mu = e^{\\int ${a}\\,dx} = e^{${a}x}$.`, `$p = ${a}$ なので、$\\mu = e^{\\int ${a}\\,dx} = e^{${a}x}$ です。`], [`Then $(\\mu y)' = \\mu(y' + ${a}y) = e^{${a}x}\\sin x$, so the left side has become one exact derivative that can be integrated directly.`, `すると $(\\mu y)' = \\mu(y' + ${a}y) = e^{${a}x}\\sin x$ で、左辺が 1 つの導関数になり、そのまま積分できます。`]],
        };
      }
      const k = r.int(1, 4);
      return {
        q: [`Find an integrating factor $\\mu(x)$ for $y' + \\dfrac{${k}}{x}\\,y = x^2$ on $x > 0$.`, `$x > 0$ で $y' + \\dfrac{${k}}{x}\\,y = x^2$ の積分因子 $\\mu(x)$ を求めてください。`],
        a: { type: 'expr', v: `x^${k}`, vars: ['x'], dom: { x: [0.35, 2.15] }, lhs: ['$\\mu(x) =$', '$\\mu(x) =$'] },
        hint: ['Compute $\\int p\\,dx$ with $p = k/x$.', '$p = k/x$ として $\\int p\\,dx$ を計算します。'],
        sol: [[`$\\int ${k}/x\\,dx = ${k}\\ln x$, so $\\mu = e^{${k}\\ln x} = x^{${k}}$.`, `$\\int ${k}/x\\,dx = ${k}\\ln x$ なので、$\\mu = e^{${k}\\ln x} = x^{${k}}$ です。`], [`Multiplying through, $(x^{${k}}y)' = x^{${k + 2}}$, so $y = x^{3}/(${k + 3}) + Cx^{-${k}}$.`, `両辺に掛けると $(x^{${k}}y)' = x^{${k + 2}}$ なので、$y = x^{3}/(${k + 3}) + Cx^{-${k}}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 4), b = r.int(-6, 8), y0 = r.int(-3, 5);
        const eq = b / a;
        const coef = y0 - eq;
        const v = `${eq}+(${coef})*exp(-${a}*x)`;
        return {
          q: [`Solve $y' + ${a}y = ${b}$ with $y(0) = ${y0}$. Give $y(x)$.`, `$y' + ${a}y = ${b}$、$y(0) = ${y0}$ を解いて $y(x)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['x'], dom: { x: [0, 2] }, lhs: ['$y(x) =$', '$y(x) =$'] },
          hint: ['First find the constant (equilibrium) solution; the rest decays at rate $' + a + '$.', 'まず定数解（平衡点）を求めます。残りは速さ $' + a + '$ で減衰します。'],
          sol: [[`The equilibrium is $y = ${b}/${a} = ${n(eq, 5)}$, since then $y' = 0$.`, `平衡点は $y = ${b}/${a} = ${n(eq, 5)}$ です。このとき $y' = 0$ だからです。`], [`The difference $y - ${n(eq, 5)}$ obeys $u' = -${a}u$, so $y = ${n(eq, 5)} + (${n(coef, 5)})e^{-${a}x}$ using $y(0) = ${y0}$.`, `差 $y - ${n(eq, 5)}$ は $u' = -${a}u$ に従うので、$y(0) = ${y0}$ を使って $y = ${n(eq, 5)} + (${n(coef, 5)})e^{-${a}x}$ です。`], [`As $x \\to \\infty$ the solution settles at ${n(eq, 5)}: for a constant forcing, the structure is "equilibrium plus decaying transient".`, `$x \\to \\infty$ で解は ${n(eq, 5)} に落ち着きます。定数の強制では、構造は「平衡点＋減衰する過渡成分」です。`]],
        };
      }
      if (form === 1) {
        const c = r.int(1, 4), d = 2 * r.int(1, 3);
        return {
          q: [`For which constant $k$ is $(${2 * c}xy + k y^2)\\,dx + (${c}x^2 + ${d}xy)\\,dy = 0$ exact?`, `定数 $k$ がいくつのとき、$(${2 * c}xy + k y^2)\\,dx + (${c}x^2 + ${d}xy)\\,dy = 0$ は完全形になりますか。`],
          a: { type: 'num', v: d / 2, tol: 1e-9 },
          hint: ['Exactness means $\\partial_y M = \\partial_x N$.', '完全形であるとは $\\partial_y M = \\partial_x N$ のことです。'],
          sol: [[`$\\partial_y M = ${2 * c}x + 2ky$ and $\\partial_x N = ${2 * c}x + ${d}y$.`, `$\\partial_y M = ${2 * c}x + 2ky$、$\\partial_x N = ${2 * c}x + ${d}y$ です。`], [`These agree exactly when $2k = ${d}$, so $k = ${d / 2}$. Then the equation is $d\\psi = 0$ for a potential function $\\psi$.`, `これらが一致するのは $2k = ${d}$、すなわち $k = ${d / 2}$ のときだけです。そのとき方程式は、ポテンシャル関数 $\\psi$ について $d\\psi = 0$ になります。`]],
        };
      }
      let r1 = r.int(-3, 3), r2 = r.int(-3, 3);
      while (r2 === r1) r2 = r.int(-3, 3);
      const c1 = r.nz(-3, 3), c2 = r.nz(-3, 3);
      const A = c1 + c2, B = r1 * c1 + r2 * c2;
      const p = -(r1 + r2), q = r1 * r2;
      return {
        q: [`Solve $y'' ${p === 0 ? '' : (sgn(p) + ' ' + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'y\'')} ${q === 0 ? '' : (sgn(q) + ' ' + (Math.abs(q) === 1 ? '' : Math.abs(q)) + 'y')} = 0$ with $y(0) = ${A}$ and $y'(0) = ${B}$. Give $y(x)$.`, `$y'' ${p === 0 ? '' : (sgn(p) + ' ' + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'y\'')} ${q === 0 ? '' : (sgn(q) + ' ' + (Math.abs(q) === 1 ? '' : Math.abs(q)) + 'y')} = 0$、$y(0) = ${A}$、$y'(0) = ${B}$ を解いて $y(x)$ を求めてください。`],
        a: { type: 'expr', v: `${c1}*exp(${r1}*x)+${c2}*exp(${r2}*x)`, vars: ['x'], dom: { x: [0, 1.5] }, lhs: ['$y(x) =$', '$y(x) =$'] },
        hint: ['Try $y = e^{rx}$ and solve the characteristic equation for $r$.', '$y = e^{rx}$ を試し、特性方程式を $r$ について解きます。'],
        sol: [[`The characteristic equation is $r^2 ${p === 0 ? '' : sgn(p) + ' ' + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'r'} ${q === 0 ? '' : sgn(q) + ' ' + Math.abs(q)} = (r - ${r1})(r - ${r2}) = 0$, so $y = c_1e^{${r1}x} + c_2e^{${r2}x}$.`, `特性方程式は $r^2 ${p === 0 ? '' : sgn(p) + ' ' + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'r'} ${q === 0 ? '' : sgn(q) + ' ' + Math.abs(q)} = (r - ${r1})(r - ${r2}) = 0$ なので、$y = c_1e^{${r1}x} + c_2e^{${r2}x}$ です。`], [`The conditions give $c_1 + c_2 = ${A}$ and $${r1}c_1 + ${r2 < 0 ? '(' + r2 + ')' : r2}c_2 = ${B}$, so $c_1 = ${c1}$ and $c_2 = ${c2}$.`, `初期条件から $c_1 + c_2 = ${A}$、$${r1}c_1 + ${r2 < 0 ? '(' + r2 + ')' : r2}c_2 = ${B}$ となり、$c_1 = ${c1}$、$c_2 = ${c2}$ です。`], ['Two distinct real roots give two independent exponentials, and the two initial conditions fix their weights.', '異なる 2 つの実根が 2 つの独立な指数関数を与え、2 つの初期条件がその重みを決めます。']],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const c = r.int(1, 3), d = 2 * r.int(1, 3);
        return {
          q: [`The equation $(${2 * c}xy + ${d / 2}y^2)\\,dx + (${c}x^2 + ${d}xy)\\,dy = 0$ is exact. Find a potential function $\\psi(x, y)$ with $\\psi_x = M$ and $\\psi_y = N$, so that the solutions are $\\psi = C$.`, `方程式 $(${2 * c}xy + ${d / 2}y^2)\\,dx + (${c}x^2 + ${d}xy)\\,dy = 0$ は完全形です。$\\psi_x = M$、$\\psi_y = N$ を満たすポテンシャル関数 $\\psi(x, y)$ を求めてください。解は $\\psi = C$ です。`],
          a: { type: 'expr', v: `${c}*x^2*y+${d / 2}*x*y^2`, vars: ['x', 'y'], dom: { x: [0.4, 2], y: [0.4, 2] }, const: true, lhs: ['$\\psi(x, y) =$', '$\\psi(x, y) =$'] },
          hint: ['Integrate $M$ in $x$, then fix the unknown function of $y$ using $\\psi_y = N$.', '$M$ を $x$ で積分し、$\\psi_y = N$ を使って $y$ の未知関数を決めます。'],
          sol: [[`Integrating $M$ in $x$: $\\psi = ${c}x^2y + ${d / 2}xy^2 + h(y)$.`, `$M$ を $x$ で積分すると $\\psi = ${c}x^2y + ${d / 2}xy^2 + h(y)$ です。`], [`Then $\\psi_y = ${c}x^2 + ${d}xy + h'(y)$ must equal $N = ${c}x^2 + ${d}xy$, so $h' = 0$ and $h$ is a constant.`, `$\\psi_y = ${c}x^2 + ${d}xy + h'(y)$ が $N = ${c}x^2 + ${d}xy$ に等しいので $h' = 0$、$h$ は定数です。`], [`So $\\psi = ${c}x^2y + ${d / 2}xy^2$ (up to a constant), and the solution curves are its level sets.`, `したがって $\\psi = ${c}x^2y + ${d / 2}xy^2$（定数を除く）で、解曲線はその等高線です。`]],
        };
      }
      if (form === 1) {
        let r1 = r.int(-2, 4), r2 = r.int(-2, 4);
        while (r2 === r1) r2 = r.int(-2, 4);
        const c1 = r.nz(-3, 3), c2 = r.nz(-3, 3);
        const A = c1 + c2, B = r1 * c1 + r2 * c2;
        const a = 1 - (r1 + r2), b = r1 * r2;
        const tm = (c, v) => (c === 0 ? '' : `${c < 0 ? '-' : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`);
        return {
          q: [`Solve the Cauchy-Euler equation $x^2y'' ${tm(a, 'xy\'')} ${tm(b, 'y')} = 0$ for $x > 0$ with $y(1) = ${A}$ and $y'(1) = ${B}$. Give $y(x)$.`, `コーシー・オイラーの方程式 $x^2y'' ${tm(a, 'xy\'')} ${tm(b, 'y')} = 0$（$x > 0$）を、$y(1) = ${A}$、$y'(1) = ${B}$ のもとで解いて $y(x)$ を求めてください。`],
          a: { type: 'expr', v: `${c1}*x^(${r1})+${c2}*x^(${r2})`, vars: ['x'], dom: { x: [0.4, 2.2] }, lhs: ['$y(x) =$', '$y(x) =$'] },
          hint: ['The equation is equidimensional: try $y = x^r$.', '次元がそろった方程式です。$y = x^r$ を試します。'],
          sol: [[`With $y = x^r$ we get $r(r - 1) ${tm(a, 'r')} ${tm(b, '')} = 0$, i.e. $(r - ${r1})(r - ${r2}) = 0$.`, `$y = x^r$ を代入すると $r(r - 1) ${tm(a, 'r')} ${tm(b, '')} = 0$、すなわち $(r - ${r1})(r - ${r2}) = 0$ です。`], [`So $y = c_1x^{${r1}} + c_2x^{${r2}}$, and $y(1) = ${A}$, $y'(1) = ${B}$ give $c_1 = ${c1}$, $c_2 = ${c2}$.`, `したがって $y = c_1x^{${r1}} + c_2x^{${r2}}$ で、$y(1) = ${A}$、$y'(1) = ${B}$ から $c_1 = ${c1}$、$c_2 = ${c2}$ です。`], ['The substitution $x = e^t$ turns this into a constant-coefficient equation, which is why the same characteristic-equation method works.', '置換 $x = e^t$ で定数係数の方程式になるので、同じ特性方程式の方法が使えます。']],
        };
      }
      if (form === 2) {
        const k = r.int(2, 5);
        return {
          q: [`Find the constant $c$ such that $y = x^{${k}}$ solves $y' = c\\,y^{${k - 1}/${k}}$ for $x > 0$.`, `$y = x^{${k}}$ が $x > 0$ で $y' = c\\,y^{${k - 1}/${k}}$ を解くような定数 $c$ を求めてください。`],
          a: { type: 'num', v: k, tol: 1e-9 },
          hint: ['Substitute: $y' + "' = kx^{k-1}$ and $y^{(k-1)/k} = x^{k-1}$.", '代入します。$y\' = kx^{k-1}$ で、$y^{(k-1)/k} = x^{k-1}$ です。'],
          sol: [[`$y' = ${k}x^{${k - 1}}$ and $y^{${k - 1}/${k}} = x^{${k - 1}}$, so $c = ${k}$.`, `$y' = ${k}x^{${k - 1}}$、$y^{${k - 1}/${k}} = x^{${k - 1}}$ なので $c = ${k}$ です。`], [`The zero function $y = 0$ also solves $y' = ${k}y^{${k - 1}/${k}}$ with the same initial value $y(0) = 0$, so the initial value problem has two solutions. Separating variables would have divided by $y^{${k - 1}/${k}}$ and silently lost $y = 0$.`, `零関数 $y = 0$ も同じ初期値 $y(0) = 0$ で $y' = ${k}y^{${k - 1}/${k}}$ を解くので、この初期値問題には解が 2 つあります。変数を分離すると $y^{${k - 1}/${k}}$ で割ることになり、$y = 0$ が黙って失われます。`]],
        };
      }
      const p = r.pick([0.5, 2 / 3, 1, 1.5, 2]);
      const label = p === 2 / 3 ? '2/3' : String(p);
      const unique = p >= 1;
      return {
        q: [`Does the initial value problem $y' = |y|^{${label}}$, $y(0) = 0$ have a unique solution on an interval around $0$?`, `初期値問題 $y' = |y|^{${label}}$、$y(0) = 0$ は、$0$ を含む区間でただ 1 つの解をもちますか。`],
        a: { type: 'choice', fixed: true, v: unique ? 0 : 1, opts: [['Yes, unique', 'はい、一意です'], ['No, there are several solutions', 'いいえ、複数の解があります']] },
        hint: ['Uniqueness is guaranteed when the right-hand side is Lipschitz in $y$ near the initial value. Is $|y|^p$ Lipschitz at $0$?', '右辺が初期値の近くで $y$ についてリプシッツなら一意性が保証されます。$|y|^p$ は $0$ でリプシッツでしょうか。'],
        sol: [[unique ? `For $p = ${label} \\ge 1$ the function $|y|^p$ is Lipschitz near $0$, so the Picard-Lindelöf theorem gives exactly one solution (here $y = 0$).` : `For $p = ${label} < 1$ the slope of $|y|^p$ is unbounded at $0$, so it is not Lipschitz there, and uniqueness can fail.`, unique ? `$p = ${label} \\ge 1$ のとき $|y|^p$ は $0$ の近くでリプシッツなので、ピカール・リンデレフの定理によりただ 1 つの解（ここでは $y = 0$）があります。` : `$p = ${label} < 1$ のとき $|y|^p$ の傾きは $0$ で非有界なのでリプシッツでなく、一意性は崩れえます。`], [unique ? 'So the solution is unique.' : `Indeed besides $y = 0$ there is the solution $y = \\left((1 - p)x\\right)^{1/(1 - p)}$ for $x \\ge 0$, and gluing gives a whole family. Existence is cheap; uniqueness needs a condition.`, unique ? 'したがって解は一意です。' : `実際、$y = 0$ のほかに $x \\ge 0$ で $y = \\left((1 - p)x\\right)^{1/(1 - p)}$ という解があり、貼り合わせると無数の解ができます。存在は容易ですが、一意性には条件が必要です。`]],
      };
    },
  ];

  /* ---------- logic and puzzles ---------- */
  Q['explore-structure-before-algebra-logic'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const m = r.int(3, 9), k = r.int(2, 4), N = m * (k - 1) + r.int(1, m), v = Math.ceil(N / m);
        return {
          q: [`${N} letters are put into ${m} pigeonholes. What is the largest number $k$ such that some pigeonhole is guaranteed to contain at least $k$ letters?`, `${N} 通の手紙を ${m} 個の仕分け箱に入れます。どれかの箱に少なくとも $k$ 通が必ず入っているような $k$ の最大値はいくつですか。`],
          a: { type: 'int', v },
          hint: ['If every box had at most $k - 1$ letters, how many could there be in total?', 'どの箱にも高々 $k - 1$ 通しか入らないとすると、全部で何通まで入るでしょうか。'],
          sol: [[`If every box held at most $${v - 1}$ letters, there would be at most $${m}\\cdot ${v - 1} = ${m * (v - 1)}$ letters, but there are ${N}.`, `どの箱も高々 $${v - 1}$ 通なら、全部で高々 $${m}\\cdot ${v - 1} = ${m * (v - 1)}$ 通ですが、実際は ${N} 通あります。`], [`So some box has at least $\\lceil ${N}/${m} \\rceil = ${v}$ letters, and no larger number can be guaranteed (spread the letters as evenly as possible).`, `したがってどれかの箱に少なくとも $\\lceil ${N}/${m} \\rceil = ${v}$ 通が入ります。これより大きい数は保証できません（できるだけ均等に分ければよいのです）。`]],
        };
      }
      if (form === 1) {
        const c = r.int(2, 5), k = r.int(2, 4);
        return {
          q: [`A drawer holds many socks in ${c} colours. What is the smallest number of socks you must take out, without looking, to be sure of ${k} socks of the same colour?`, `引き出しに ${c} 色の靴下がたくさん入っています。同じ色の靴下が ${k} 足以上あることを確実にするには、見ないで少なくとも何足取り出す必要がありますか。`],
          a: { type: 'int', v: c * (k - 1) + 1 },
          hint: ['Think of the worst case: how many can you take with no colour reaching ' + k + '?', '最悪の場合を考えます。どの色も ' + k + ' 足に届かないまま、何足まで取り出せるでしょうか。'],
          sol: [[`The worst case takes ${k - 1} of each of the ${c} colours: ${c}\\cdot ${k - 1} = ${c * (k - 1)} socks with no colour reaching ${k}.`, `最悪の場合、${c} 色それぞれから ${k - 1} 足ずつ、合計 ${c}\\cdot ${k - 1} = ${c * (k - 1)} 足を取っても、どの色も ${k} 足に届きません。`], [`One more sock must complete a colour, so the answer is ${c * (k - 1) + 1}. Pigeonhole arguments always count the worst-case spread plus one.`, `もう 1 足取れば必ずどれかの色がそろうので、答えは ${c * (k - 1) + 1} です。鳩の巣原理は、最悪の分布に 1 を加えて数えます。`]],
        };
      }
      if (form === 2) {
        const cnt = r.pick([[2, 2, 1], [3, 2, 1], [2, 2, 2], [3, 3], [4, 2, 1], [2, 1, 1, 1], [3, 1, 1, 1]]);
        const letters = 'ABCD'.slice(0, cnt.length);
        const total = cnt.reduce((a, b) => a + b, 0);
        let v = fact(total); cnt.forEach((c) => { v /= fact(c); });
        const word = cnt.map((c, i) => letters[i].repeat(c)).join('');
        return {
          q: [`How many different arrangements are there of the letters of ${word}?`, `${word} の文字を並べ替えると、異なる並べ方は何通りありますか。`],
          a: { type: 'int', v },
          hint: ['Count as if all letters were distinct, then divide out the swaps of identical letters.', 'まずすべての文字が異なるものとして数え、同じ文字の入れ替えの分で割ります。'],
          sol: [[`If all ${total} letters were distinct there would be $${total}! = ${fact(total)}$ arrangements.`, `${total} 文字がすべて異なれば $${total}! = ${fact(total)}$ 通りです。`], [`Swapping identical letters changes nothing: divide by ${cnt.map((c) => `$${c}!$`).join(' and ')}, giving ${v}.`, `同じ文字の入れ替えでは何も変わらないので、${cnt.map((c) => `$${c}!$`).join('、')} で割ると ${v} 通りです。`]],
        };
      }
      const nn = r.int(3, 12), t = r.int(0, 2);
      const E = [
        [`${nn} fair dice are rolled. What is the expected number showing 5 or 6?`, `公正なサイコロを ${nn} 個振ります。5 または 6 が出る個数の期待値はいくつですか。`, nn / 3, `By linearity each die contributes $\\frac13$, regardless of the others: ${nn}/3.`, `期待値の線形性により、各サイコロが他と無関係に $\\frac13$ を寄与します。${nn}/3 です。`],
        [`A fair coin is flipped ${nn} times. What is the expected number of adjacent pairs of flips that match?`, `公正なコインを ${nn} 回投げます。隣り合う 2 回が一致する組の個数の期待値はいくつですか。`, (nn - 1) / 2, `There are ${nn - 1} adjacent pairs, and each matches with probability $\\frac12$, so by linearity ${nn - 1}/2.`, `隣り合う組は ${nn - 1} 個あり、それぞれ確率 $\\frac12$ で一致するので、線形性により ${nn - 1}/2 です。`],
        [`${nn} people hand their hats to a random shuffler, who returns one hat to each person at random. What is the expected number of people who get their own hat back?`, `${nn} 人が帽子を預け、ランダムに 1 人 1 個ずつ返されます。自分の帽子が戻る人数の期待値はいくつですか。`, 1, `Each person gets their own hat with probability $1/${nn}$, so the expected total is $${nn}\\cdot 1/${nn} = 1$.`, `各人が自分の帽子を得る確率は $1/${nn}$ なので、期待値は $${nn}\\cdot 1/${nn} = 1$ です。`],
      ][t];
      return {
        q: [E[0], E[1]],
        a: { type: 'num', v: E[2], rel: 1e-3, show: t === 0 ? frac(nn, 3) : t === 1 ? frac(nn - 1, 2) : '1' },
        hint: ['Write the count as a sum of indicator variables and add their expectations; independence is not needed.', '個数を指示変数の和で書き、その期待値を足します。独立性は不要です。'],
        sol: [[E[3], E[4]], ['The events are not independent in the hat problem and overlap in the pairs problem, yet linearity of expectation still applies. That is what makes it such a strong structural cue.', '帽子の問題では事象が独立ではなく、コインの問題では重なっていますが、期待値の線形性はそのまま使えます。だからこそ強い構造の合図になります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([4, 6, 8]);
        const c1 = [r.int(0, N - 1), r.int(0, N - 1)];
        let c2;
        do { c2 = [r.int(0, N - 1), r.int(0, N - 1)]; } while (c2[0] === c1[0] && c2[1] === c1[1]);
        const col = (c) => (c[0] + c[1]) % 2;
        const ok = col(c1) !== col(c2);
        const name = (c) => `${'abcdefgh'[c[1]]}${N - c[0]}`;
        return {
          q: [`Two squares, ${name(c1)} and ${name(c2)}, are removed from a ${N} by ${N} chessboard (squares of the usual two colours). Can the remaining squares be exactly covered by $1 \\times 2$ dominoes?`, `${N} × ${N} のチェス盤（通常の 2 色）から 2 つのマス ${name(c1)} と ${name(c2)} を取り除きます。残りのマスを $1 \\times 2$ のドミノでちょうど敷き詰められますか。`],
          a: { type: 'choice', fixed: true, v: ok ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
          hint: ['Each domino covers one square of each colour. Compare the numbers of remaining squares of each colour.', 'ドミノ 1 枚は両方の色のマスを 1 つずつ覆います。残ったマスの色ごとの個数を比べます。'],
          sol: [[`The two removed squares are ${col(c1) === col(c2) ? 'the same colour' : 'of opposite colours'}, so the colour counts of the remaining squares are ${col(c1) === col(c2) ? `${(N * N) / 2 - 2} and ${(N * N) / 2}` : `${(N * N) / 2 - 1} and ${(N * N) / 2 - 1}`}.`, `取り除いた 2 マスは${col(c1) === col(c2) ? '同じ色' : '異なる色'}なので、残りの色ごとのマス数は ${col(c1) === col(c2) ? `${(N * N) / 2 - 2} と ${(N * N) / 2}` : `${(N * N) / 2 - 1} と ${(N * N) / 2 - 1}`} です。`], [ok ? 'The invariant does not rule out a tiling, and for a board with even side length a tiling does exist whenever the removed squares have opposite colours (Gomory\'s theorem, using a closed path through all squares).' : 'Every domino covers one square of each colour, so equal counts are necessary. They differ, so no tiling exists.', ok ? '不変量は敷き詰めを否定せず、一辺が偶数の盤では、取り除いた 2 マスの色が異なれば必ず敷き詰められます（ゴモリーの定理。全マスを通る閉じた道を使います）。' : 'ドミノは各色のマスを 1 つずつ覆うので、個数が等しいことが必要です。個数が異なるので敷き詰められません。']],
        };
      }
      if (form === 1) {
        let best = null;
        for (let tries = 0; tries < 200; tries++) {
          const m = r.int(3, 4), s = Array.from({ length: m }, () => r.int(0, m));
          const sols = [];
          for (let mask = 0; mask < (1 << m); mask++) {
            let k = 0; for (let i = 0; i < m; i++) if (mask >> i & 1) k++;
            let okk = true;
            for (let i = 0; i < m; i++) { const knave = !!(mask >> i & 1), statementTrue = s[i] === k; if (knave === statementTrue) okk = false; }
            if (okk) sols.push(k);
          }
          if (sols.length === 1) { best = { m, s, k: sols[0] }; break; }
        }
        if (!best) best = { m: 3, s: [1, 1, 2], k: 1 };
        const names = 'ABCD';
        return {
          q: [`On an island, knights always tell the truth and knaves always lie. ${best.m} islanders ${names.slice(0, best.m).split('').join(', ')} speak. ${best.s.map((v, i) => `${names[i]} says: "Exactly ${v} of us ${v === 1 ? 'is a knave' : 'are knaves'}."`).join(' ')} Exactly one assignment of roles is consistent. How many of them are knaves?`, `ある島では、騎士は必ず本当のことを言い、悪党は必ず嘘をつきます。${best.m} 人の島民 ${names.slice(0, best.m).split('').join('、')} が話します。${best.s.map((v, i) => `${names[i]}：「私たちのうちちょうど ${v} 人が悪党だ。」`).join('')}役割の割り当てで矛盾しないものはただ 1 つです。悪党は何人ですか。`],
          a: { type: 'int', v: best.k },
          hint: ['Fix the number $k$ of knaves. Then exactly the speakers who said "$k$" are truthful, hence knights.', '悪党の人数 $k$ を固定します。すると「$k$ 人」と言った人だけが本当のことを言っているので、騎士です。'],
          sol: [[`If there are $k$ knaves, the speakers who said "exactly $k$" are knights and all others are knaves. So we need #(speakers who said $k$) $= ${best.m} - k$.`, `悪党が $k$ 人なら、「ちょうど $k$ 人」と言った人が騎士で、残りは悪党です。したがって「$k$ と言った人の数」$= ${best.m} - k$ が必要です。`], [`Checking $k = 0, \\dots, ${best.m}$, only $k = ${best.k}$ works. Reducing to one counting equation beats trying all $2^{${best.m}}$ role assignments.`, `$k = 0, \\dots, ${best.m}$ を調べると、成り立つのは $k = ${best.k}$ だけです。1 つの数え上げの式に帰着させるほうが、$2^{${best.m}}$ 通りの割り当てをすべて試すより速いです。`]],
        };
      }
      const N = r.int(4, 120), Nn = N;
      let w = 0, cap = 1; while (cap < Nn) { cap *= 3; w++; }
      return {
        q: [`Among ${Nn} coins one is heavier and the rest weigh the same. What is the smallest number of weighings on a balance scale that always finds the heavy coin?`, `${Nn} 枚のコインのうち 1 枚だけが重く、残りは同じ重さです。天秤ばかりで、重いコインを必ず見つけられる最小の測定回数はいくつですか。`],
        a: { type: 'int', v: w },
        hint: ['Each weighing has three outcomes. How many cases can $w$ weighings distinguish?', '1 回の測定には 3 通りの結果があります。$w$ 回の測定で区別できる場合の数はいくつでしょうか。'],
        sol: [[`Each weighing gives left heavy, right heavy or balance: 3 outcomes. So $w$ weighings distinguish at most $3^w$ cases, and we need $3^w \\ge ${Nn}$.`, `1 回の測定の結果は、左が重い・右が重い・つり合うの 3 通りです。$w$ 回の測定で区別できるのは高々 $3^w$ 通りなので、$3^w \\ge ${Nn}$ が必要です。`], [`The smallest such $w$ is ${w} ($3^{${w}} = ${cap}$). It is also enough: split the coins into three nearly equal piles and compare two of them. The counting bound is tight.`, `そのような最小の $w$ は ${w} です（$3^{${w}} = ${cap}$）。これで足ります。コインを 3 つのほぼ等しい山に分け、2 つを比べます。数え上げの下限は達成されます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const mode = r.int(0, 1);
        if (mode === 0) {
          const piles = [r.int(1, 9), r.int(1, 9), r.int(1, 9)];
          const X = piles[0] ^ piles[1] ^ piles[2];
          let cnt = 0; piles.forEach((p, i) => { for (let t = 1; t <= p; t++) { const q = piles.slice(); q[i] = p - t; if ((q[0] ^ q[1] ^ q[2]) === 0) cnt++; } });
          return {
            q: [`In Nim with piles of sizes ${piles.join(', ')}, a move removes any positive number of stones from one pile, and the player who takes the last stone wins. How many first moves leave the opponent in a losing position?`, `山の大きさが ${piles.join('、')} のニムで、1 回の手は 1 つの山から正の個数の石を取り除くことで、最後の石を取った人が勝ちです。相手を負けの局面に追い込む最初の手は何通りありますか。`],
            a: { type: 'int', v: cnt },
            hint: ['A position is losing exactly when the XOR (nim-sum) of the pile sizes is $0$.', '山の大きさの XOR（ニム和）が $0$ であることが、負けの局面である条件です。'],
            sol: [[`The nim-sum is ${piles.join(' \\oplus ')} $= ${X}$.`, `ニム和は ${piles.join(' \\oplus ')} $= ${X}$ です。`], [X === 0 ? 'It is already $0$, so every move leaves a nonzero nim-sum: the first player loses and there are no winning moves.' : `A pile of size $p$ can be reduced to $p \\oplus ${X}$ exactly when that is smaller than $p$. Counting such piles gives ${cnt} winning move${cnt === 1 ? '' : 's'}.`, X === 0 ? 'すでに $0$ なので、どの手でもニム和は 0 でなくなります。先手は負けで、勝ちの手はありません。' : `山 $p$ を $p \\oplus ${X}$ に減らせるのは、それが $p$ より小さいときだけです。そのような山を数えると、勝ちの手は ${cnt} 通りです。`]],
          };
        }
        const k = r.int(2, 5); let N = r.int(10, 40); if (N % (k + 1) === 0) N += 1;
        const win = Array(N + 1).fill(false);
        for (let i = 1; i <= N; i++) for (let m = 1; m <= Math.min(k, i); m++) if (!win[i - m]) win[i] = true;
        const mvs = []; for (let m = 1; m <= Math.min(k, N); m++) if (!win[N - m]) mvs.push(m);
        return {
          q: [`A pile has ${N} stones. Players alternately take 1 to ${k} stones, and whoever takes the last stone wins. How many stones should the first player take to win?`, `山に石が ${N} 個あります。2 人が交互に 1 個から ${k} 個まで取り、最後の石を取った人が勝ちです。先手が勝つには最初に何個取ればよいですか。`],
          a: { type: 'int', v: mvs[0] },
          hint: ['Work backwards: which pile sizes are losing for the player to move?', '後ろから考えます。手番の人にとって負けになる山の大きさはどれでしょうか。'],
          sol: [[`A pile of size $0$ is lost for the player to move, and so are all multiples of $${k + 1}$: from such a pile any move leaves a non-multiple, from which one can move back to a multiple.`, `大きさ $0$ の山は手番の人の負けで、$${k + 1}$ の倍数もすべてそうです。そこからのどの手も倍数でない山になり、そこからは倍数に戻せます。`], [`Here ${N} $\\equiv ${N % (k + 1)} \\pmod{${k + 1}}$, so take ${N % (k + 1)} stone${N % (k + 1) === 1 ? '' : 's'} to leave a multiple of ${k + 1}, then answer each opponent move $m$ with ${k + 1} $- m$.`, `${N} $\\equiv ${N % (k + 1)} \\pmod{${k + 1}}$ なので、${N % (k + 1)} 個取って ${k + 1} の倍数を残し、以後は相手が $m$ 個取るたびに ${k + 1} $- m$ 個取ります。`]],
        };
      }
      if (form === 1) {
        const pats = ['HH', 'HT', 'HHH', 'HTH', 'HHT', 'THH', 'HTHT', 'HHTH', 'HTTH'];
        const pat = r.pick(pats), L = pat.length;
        let E = 0; for (let k = 1; k <= L; k++) if (pat.slice(0, k) === pat.slice(L - k)) E += Math.pow(2, k);
        return {
          q: [`A fair coin is flipped repeatedly. What is the expected number of flips until the pattern ${pat} first appears?`, `公正なコインを繰り返し投げます。パターン ${pat} が初めて現れるまでの投げる回数の期待値はいくつですか。`],
          a: { type: 'int', v: E },
          hint: ['Overlap matters: add $2^k$ for every $k$ for which the first $k$ letters of the pattern equal its last $k$ letters.', '重なりが効きます。パターンの最初の $k$ 文字と最後の $k$ 文字が等しくなる $k$ ごとに $2^k$ を足します。'],
          sol: [[`The lengths $k$ at which the pattern's prefix equals its suffix are ${Array.from({ length: L }, (_, i) => i + 1).filter((k) => pat.slice(0, k) === pat.slice(L - k)).join(', ')}.`, `パターンの接頭辞と接尾辞が一致する長さ $k$ は ${Array.from({ length: L }, (_, i) => i + 1).filter((k) => pat.slice(0, k) === pat.slice(L - k)).join('、')} です。`], [`The expected waiting time is the sum of $2^k$ over them, ${E}. Patterns with more self-overlap take longer on average, even though all patterns of the same length are equally likely at any position.`, `期待される待ち時間はそれらの $2^k$ の和で、${E} です。同じ長さのパターンは各位置で同じ確率で現れるのに、自己重複が多いパターンほど平均では待ち時間が長くなります。`]],
        };
      }
      if (form === 2) {
        const t = r.int(0, 2);
        if (t === 0) {
          const N = r.int(30, 800); let z = 0; for (let q = 5; q <= N; q *= 5) z += Math.floor(N / q);
          return {
            q: [`With how many zeros does the decimal expansion of ${N}! end?`, `${N}! の十進表示は、末尾にいくつの 0 が並びますか。`],
            a: { type: 'int', v: z },
            hint: ['Each trailing zero comes from a factor $10 = 2\\cdot 5$; there are plenty of 2s, so count the 5s.', '末尾の 0 は因数 $10 = 2\\cdot 5$ から生じます。2 は十分あるので、5 の個数を数えます。'],
            sol: [[`The exponent of 5 in $${N}!$ is $\\lfloor ${N}/5 \\rfloor + \\lfloor ${N}/25 \\rfloor + \\lfloor ${N}/125 \\rfloor + \\dots = ${z}$.`, `$${N}!$ に含まれる 5 の指数は $\\lfloor ${N}/5 \\rfloor + \\lfloor ${N}/25 \\rfloor + \\lfloor ${N}/125 \\rfloor + \\dots = ${z}$ です。`], [`The exponent of 2 is much larger, so the number of trailing zeros is ${z}.`, `2 の指数ははるかに大きいので、末尾の 0 は ${z} 個です。`]],
          };
        }
        if (t === 1) {
          const a = r.int(2, 9), b = r.int(50, 400), m = r.pick([7, 9, 10, 11, 13]);
          return {
            q: [`What is the remainder when $${a}^{${b}}$ is divided by ${m}?`, `$${a}^{${b}}$ を ${m} で割った余りはいくつですか。`],
            a: { type: 'int', v: pw(a, b, m) },
            hint: ['Powers modulo $m$ repeat; find the cycle length.', '$m$ を法とするべきは周期的に繰り返します。周期を見つけます。'],
            sol: [[`Computing powers of ${a} modulo ${m}: ${Array.from({ length: 6 }, (_, i) => pw(a, i + 1, m)).join(', ')}, ... The sequence is periodic.`, `${a} のべきを ${m} を法として計算すると ${Array.from({ length: 6 }, (_, i) => pw(a, i + 1, m)).join('、')}、... で、周期的です。`], [`Reducing the exponent using the cycle (or repeated squaring) gives the remainder ${pw(a, b, m)}.`, `周期（または繰り返し 2 乗）を使って指数を縮めると、余りは ${pw(a, b, m)} です。`]],
          };
        }
        const a = r.int(2, 9), b = r.int(20, 300);
        return {
          q: [`What is the last digit of $${a}^{${b}}$?`, `$${a}^{${b}}$ の一の位はいくつですか。`],
          a: { type: 'int', v: pw(a, b, 10) },
          hint: ['The last digit is the remainder mod 10; the powers cycle with a short period.', '一の位は 10 で割った余りで、べきは短い周期で循環します。'],
          sol: [[`The last digits of the powers of ${a} are ${Array.from({ length: 6 }, (_, i) => pw(a, i + 1, 10)).join(', ')}, ... a cycle.`, `${a} のべきの一の位は ${Array.from({ length: 6 }, (_, i) => pw(a, i + 1, 10)).join('、')}、... と循環します。`], [`Using the cycle for exponent ${b} gives the last digit ${pw(a, b, 10)}.`, `指数 ${b} に周期を適用すると、一の位は ${pw(a, b, 10)} です。`]],
        };
      }
      const nn = r.int(3, 6);
      let Hn = 0; for (let j = 1; j <= nn; j++) Hn += 1 / j;
      return {
        q: [`A fair ${nn}-sided die is rolled until every face has appeared at least once. What is the expected number of rolls? (A decimal is fine.)`, `公正な ${nn} 面のサイコロを、すべての面が少なくとも 1 回出るまで振ります。振る回数の期待値はいくつですか。（小数でかまいません。）`],
        a: { type: 'num', v: nn * Hn, rel: 2e-3 },
        hint: ['Split the wait into stages: the time to get the $j$th new face, given $j - 1$ faces already seen, is geometric.', '待ち時間を段階に分けます。すでに $j - 1$ 面が出ているときに $j$ 番目の新しい面を得るまでの時間は幾何分布です。'],
        sol: [[`With $j - 1$ faces seen, a new face appears with probability $(${nn} - j + 1)/${nn}$, so that stage takes $${nn}/(${nn} - j + 1)$ rolls on average.`, `$j - 1$ 面が出ているとき、新しい面が出る確率は $(${nn} - j + 1)/${nn}$ なので、その段階は平均 $${nn}/(${nn} - j + 1)$ 回かかります。`], [`Adding the stages by linearity: $${nn}\\left(1 + \\frac12 + \\dots + \\frac1{${nn}}\\right) \\approx ${n(nn * Hn, 5)}$. This is the coupon collector's problem.`, `線形性で各段階を足すと $${nn}\\left(1 + \\frac12 + \\dots + \\frac1{${nn}}\\right) \\approx ${n(nn * Hn, 5)}$ です。これはクーポン収集問題です。`]],
      };
    },
  ];
})();
