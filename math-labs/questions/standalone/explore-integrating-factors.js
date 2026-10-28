'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const sgn = (c) => (c < 0 ? '-' : '');
  const coef = (c) => (Math.abs(c) === 1 ? '' : String(Math.abs(c)));
  // c x^p written for TeX, p integer (may be negative)
  const pw = (v, p) => (p === 1 ? v : `${v}^{${p}}`);
  const E = (s) => s.replace(/\+ -/g, '- ').replace(/- -/g, '+ ');

  /* ---------- 1. linear equations: y' + P y = Q ---------- */
  Q['explore-integrating-factors-linear'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const k = r.nz(-5, 5);
        const c = r.nz(-4, 4);
        return {
          q: [`For $y' ${k < 0 ? '-' : '+'} ${coef(k)}y = ${c}x$, find the integrating factor $\\mu(x) = e^{\\int P\\,dx}$, taking the integration constant to be zero.`,
              `$y' ${k < 0 ? '-' : '+'} ${coef(k)}y = ${c}x$ の積分因子 $\\mu(x) = e^{\\int P\\,dx}$ を、積分定数を $0$ として求めてください。`],
          a: { type: 'expr', v: E(`exp(${k}*x)`), vars: ['x'], lhs: ['$\\mu(x)=$', '$\\mu(x)=$'] },
          hint: ['Read off $P(x)$, the coefficient of $y$, and integrate it.', '$y$ の係数 $P(x)$ を読み取って積分します。'],
          sol: [[`Here $P(x) = ${k}$, so $\\int P\\,dx = ${k}x$.`, `ここで $P(x) = ${k}$ なので $\\int P\\,dx = ${k}x$ です。`],
                [`Hence $\\mu(x) = e^{${k}x}$. Then $\\mu' = ${k}\\mu = P\\mu$, which is exactly what makes $\\mu y' + \\mu P y = (\\mu y)'$.`, `したがって $\\mu(x) = e^{${k}x}$ です。$\\mu' = ${k}\\mu = P\\mu$ となり、これが $\\mu y' + \\mu P y = (\\mu y)'$ を成り立たせる条件です。`]],
        };
      }
      if (form === 1) {
        const k = r.nz(-4, 5);
        return {
          q: [`On $x > 0$, find the integrating factor of $y' + \\dfrac{${k}}{x}y = x$, taking the integration constant to be zero.`,
              `$x > 0$ で、$y' + \\dfrac{${k}}{x}y = x$ の積分因子を、積分定数を $0$ として求めてください。`],
          a: { type: 'expr', v: E(`x^(${k})`), vars: ['x'], lhs: ['$\\mu(x)=$', '$\\mu(x)=$'] },
          hint: ['$\\int \\dfrac{k}{x}\\,dx = k\\ln x$ for $x>0$.', '$x>0$ では $\\int \\dfrac{k}{x}\\,dx = k\\ln x$ です。'],
          sol: [[`$\\int P\\,dx = \\int \\dfrac{${k}}{x}\\,dx = ${k}\\ln x$.`, `$\\int P\\,dx = \\int \\dfrac{${k}}{x}\\,dx = ${k}\\ln x$ です。`],
                [`So $\\mu = e^{${k}\\ln x} = x^{${k}}$. Multiplying turns the left side into $(x^{${k}}y)'$.`, `よって $\\mu = e^{${k}\\ln x} = x^{${k}}$ です。これを掛けると左辺は $(x^{${k}}y)'$ になります。`]],
        };
      }
      if (form === 2) {
        const m = r.pick([-3, -2, 2, 3, 4, 5]);
        return {
          q: [`An integrating factor of $y' + P(x)y = Q(x)$ on $x > 0$ is $\\mu(x) = x^{${m}}$. What is $P(x)$?`,
              `$x > 0$ で、$y' + P(x)y = Q(x)$ の積分因子が $\\mu(x) = x^{${m}}$ であるとき、$P(x)$ を求めてください。`],
          a: { type: 'expr', v: E(`${m}/x`), vars: ['x'], lhs: ['$P(x)=$', '$P(x)=$'] },
          hint: ['The defining property is $\\mu' + "'" + ' = P\\mu$.', '定義の性質は $\\mu' + "'" + ' = P\\mu$ です。'],
          sol: [[`From $\\mu' = P\\mu$ we get $P = \\mu'/\\mu = (\\ln\\mu)'$.`, `$\\mu' = P\\mu$ から $P = \\mu'/\\mu = (\\ln\\mu)'$ です。`],
                [`With $\\mu = x^{${m}}$ this is $P = ${m}x^{${m - 1}}/x^{${m}} = \\dfrac{${m}}{x}$.`, `$\\mu = x^{${m}}$ のとき $P = ${m}x^{${m - 1}}/x^{${m}} = \\dfrac{${m}}{x}$ です。`]],
        };
      }
      const k = r.int(1, 5), y0 = r.nz(-6, 6);
      return {
        q: [`Solve $y' + ${coef(k)}y = 0$ with $y(0) = ${y0}$ and give $y(1)$ to 3 decimal places.`,
            `$y' + ${coef(k)}y = 0$、$y(0) = ${y0}$ を解いて、$y(1)$ を小数第 3 位まで求めてください。`],
        a: { type: 'num', v: y0 * Math.exp(-k), tol: 0.0011 },
        hint: ['Here $Q = 0$, so $(\\mu y)' + "'" + ' = 0$ and $\\mu y$ is constant.', '$Q = 0$ なので $(\\mu y)' + "'" + ' = 0$ で、$\\mu y$ は定数です。'],
        sol: [[`With $\\mu = e^{${k}x}$ the equation says $(e^{${k}x}y)' = 0$, so $y = Ce^{-${k}x}$.`, `$\\mu = e^{${k}x}$ とすると $(e^{${k}x}y)' = 0$ なので $y = Ce^{-${k}x}$ です。`],
              [`$y(0) = C = ${y0}$, so $y(1) = ${y0}e^{-${k}} = ${n(y0 * Math.exp(-k), 3)}$. The solution decays at rate ${k}.`, `$y(0) = C = ${y0}$ なので $y(1) = ${y0}e^{-${k}} = ${n(y0 * Math.exp(-k), 3)}$ です。解は速さ ${k} で減衰します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let k, m;
        do { k = r.int(1, 4); m = r.nz(-3, 3); } while (m + k === 0);
        const c = r.nz(-6, 6), y0 = r.nz(-5, 5);
        const A = c / (k + m), C = y0 - A;
        return {
          q: [`Solve $y' + ${coef(k)}y = ${c}e^{${m === 1 ? '' : m}x}$ with $y(0) = ${y0}$. Give $y(x)$.`,
              `$y' + ${coef(k)}y = ${c}e^{${m === 1 ? '' : m}x}$、$y(0) = ${y0}$ を解いて $y(x)$ を求めてください。`],
          a: { type: 'expr', v: E(`${A}*exp(${m}*x) + ${C}*exp(${-k}*x)`), vars: ['x'], lhs: ['$y(x)=$', '$y(x)=$'] },
          hint: [`Multiply by $\\mu = e^{${k}x}$, integrate $(\\mu y)'$, then use $y(0)$.`, `$\\mu = e^{${k}x}$ を掛けて $(\\mu y)'$ を積分し、$y(0)$ を使います。`],
          sol: [[`$\\mu = e^{${k}x}$, so $(e^{${k}x}y)' = ${c}e^{${k + m}x}$.`, `$\\mu = e^{${k}x}$ なので $(e^{${k}x}y)' = ${c}e^{${k + m}x}$ です。`],
                [`Integrating, $e^{${k}x}y = \\dfrac{${c}}{${k + m}}e^{${k + m}x} + C$, so $y = ${n(A, 4)}e^{${m}x} + Ce^{-${k}x}$.`, `積分して $e^{${k}x}y = \\dfrac{${c}}{${k + m}}e^{${k + m}x} + C$ なので $y = ${n(A, 4)}e^{${m}x} + Ce^{-${k}x}$ です。`],
                [`$y(0) = ${n(A, 4)} + C = ${y0}$ gives $C = ${n(C, 4)}$. The $e^{-${k}x}$ term is a transient; the first term is the forced response.`, `$y(0) = ${n(A, 4)} + C = ${y0}$ より $C = ${n(C, 4)}$ です。$e^{-${k}x}$ の項は過渡項、第 1 項が強制応答です。`]],
        };
      }
      if (form === 1) {
        let k, m;
        do { k = r.int(1, 4); m = r.int(0, 3); } while (m + k + 1 === 0);
        const c = r.nz(-4, 4), y0 = r.nz(-4, 4);
        const A = c / (m + k + 1), C = y0 - A;
        return {
          q: [`On $x > 0$ solve $y' + \\dfrac{${k}}{x}y = ${c}x^{${m}}$ with $y(1) = ${y0}$. Give $y(x)$.`,
              `$x > 0$ で $y' + \\dfrac{${k}}{x}y = ${c}x^{${m}}$、$y(1) = ${y0}$ を解いて $y(x)$ を求めてください。`],
          a: { type: 'expr', v: E(`${A}*x^(${m + 1}) + ${C}*x^(${-k})`), vars: ['x'], lhs: ['$y(x)=$', '$y(x)=$'] },
          hint: [`The integrating factor is $x^{${k}}$.`, `積分因子は $x^{${k}}$ です。`],
          sol: [[`$\\mu = x^{${k}}$, so $(x^{${k}}y)' = ${c}x^{${m + k}}$.`, `$\\mu = x^{${k}}$ なので $(x^{${k}}y)' = ${c}x^{${m + k}}$ です。`],
                [`Integrating, $x^{${k}}y = \\dfrac{${c}}{${m + k + 1}}x^{${m + k + 1}} + C$, so $y = ${n(A, 4)}x^{${m + 1}} + Cx^{-${k}}$.`, `積分して $x^{${k}}y = \\dfrac{${c}}{${m + k + 1}}x^{${m + k + 1}} + C$ なので $y = ${n(A, 4)}x^{${m + 1}} + Cx^{-${k}}$ です。`],
                [`$y(1) = ${n(A, 4)} + C = ${y0}$ gives $C = ${n(C, 4)}$. Differentiating back confirms the equation.`, `$y(1) = ${n(A, 4)} + C = ${y0}$ より $C = ${n(C, 4)}$ です。微分して元の方程式に戻すと検算できます。`]],
        };
      }
      const k = r.int(1, 4), c = r.nz(-5, 5), y0 = r.nz(-5, 5), x1 = r.pick([0.5, 1, 1.5, 2]);
      const y1 = c / k * (1 - Math.exp(-k * x1)) + y0 * Math.exp(-k * x1);
      return {
        q: [`A tank variable obeys $y' + ${coef(k)}y = ${c}$ with $y(0) = ${y0}$. Find $y(${n(x1)})$ to 3 decimal places.`,
            `量 $y$ が $y' + ${coef(k)}y = ${c}$、$y(0) = ${y0}$ に従うとき、$y(${n(x1)})$ を小数第 3 位まで求めてください。`],
        a: { type: 'num', v: y1, tol: 0.0011 },
        hint: [`$\\mu = e^{${k}x}$ and $(\\mu y)' = ${c}e^{${k}x}$.`, `$\\mu = e^{${k}x}$ で $(\\mu y)' = ${c}e^{${k}x}$ です。`],
        sol: [[`$(e^{${k}x}y)' = ${c}e^{${k}x}$ gives $e^{${k}x}y = \\dfrac{${c}}{${k}}e^{${k}x} + C$.`, `$(e^{${k}x}y)' = ${c}e^{${k}x}$ より $e^{${k}x}y = \\dfrac{${c}}{${k}}e^{${k}x} + C$ です。`],
              [`So $y = \\dfrac{${c}}{${k}} + Ce^{-${k}x}$ and $y(0) = ${y0}$ gives $C = ${n(y0 - c / k, 4)}$.`, `よって $y = \\dfrac{${c}}{${k}} + Ce^{-${k}x}$ で、$y(0) = ${y0}$ から $C = ${n(y0 - c / k, 4)}$ です。`],
              [`$y(${n(x1)}) = ${n(y1, 3)}$. The solution relaxes toward the steady value $${n(c / k, 4)}$.`, `$y(${n(x1)}) = ${n(y1, 3)}$ です。解は定常値 $${n(c / k, 4)}$ に近づいていきます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const k = r.int(1, 4), c = r.nz(-5, 5), y0 = r.nz(-5, 5);
        return {
          q: [`Solve $y' + ${coef(k)}y = ${c}e^{-${k}x}$ with $y(0) = ${y0}$. (The naive formula divides by zero here.) Give $y(x)$.`,
              `$y' + ${coef(k)}y = ${c}e^{-${k}x}$、$y(0) = ${y0}$ を解いて $y(x)$ を求めてください（素朴な公式はここで $0$ で割ってしまいます）。`],
          a: { type: 'expr', v: E(`(${c}*x + ${y0})*exp(${-k}*x)`), vars: ['x'], lhs: ['$y(x)=$', '$y(x)=$'] },
          hint: ['After multiplying by $\\mu$, the right side becomes a constant.', '$\\mu$ を掛けると右辺は定数になります。'],
          sol: [[`$\\mu = e^{${k}x}$, so $(e^{${k}x}y)' = ${c}$.`, `$\\mu = e^{${k}x}$ なので $(e^{${k}x}y)' = ${c}$ です。`],
                [`Integrating gives $e^{${k}x}y = ${c}x + C$, so $y = (${c}x + C)e^{-${k}x}$, and $y(0) = C = ${y0}$.`, `積分すると $e^{${k}x}y = ${c}x + C$ なので $y = (${c}x + C)e^{-${k}x}$ で、$y(0) = C = ${y0}$ です。`],
                [`The forcing has the same exponent as the homogeneous solution (resonance), so a factor $x$ appears.`, `強制項が同次解と同じ指数をもつ（共鳴）ので、因子 $x$ が現れます。`]],
        };
      }
      if (form === 1) {
        const k = r.int(1, 4), c = r.nz(-4, 4), y0 = r.nz(-4, 4);
        return {
          q: [`On $x > 0$ solve $y' + \\dfrac{${k}}{x}y = ${c}x^{${-k - 1}}$ with $y(1) = ${y0}$. Give $y(x)$ (the answer contains a logarithm).`,
              `$x > 0$ で $y' + \\dfrac{${k}}{x}y = ${c}x^{${-k - 1}}$、$y(1) = ${y0}$ を解いて $y(x)$ を求めてください（答えには対数が現れます）。`],
          a: { type: 'expr', v: E(`(${c}*ln(x) + ${y0})*x^(${-k})`), vars: ['x'], lhs: ['$y(x)=$', '$y(x)=$'] },
          hint: [`$\\mu = x^{${k}}$; what is $x^{${k}} \\cdot x^{${-k - 1}}$?`, `$\\mu = x^{${k}}$ です。$x^{${k}} \\cdot x^{${-k - 1}}$ は何でしょう。`],
          sol: [[`$(x^{${k}}y)' = ${c}x^{-1}$.`, `$(x^{${k}}y)' = ${c}x^{-1}$ です。`],
                [`Integrating, $x^{${k}}y = ${c}\\ln x + C$, so $y = (${c}\\ln x + C)x^{-${k}}$, and $y(1) = C = ${y0}$.`, `積分して $x^{${k}}y = ${c}\\ln x + C$ なので $y = (${c}\\ln x + C)x^{-${k}}$ で、$y(1) = C = ${y0}$ です。`],
                [`The power-law case $m + k = -1$ is the resonant one: $\\int x^{-1}dx$ is a logarithm, not a power.`, `べき乗の場合 $m + k = -1$ が共鳴にあたります。$\\int x^{-1}dx$ はべきではなく対数になります。`]],
        };
      }
      if (form === 2) {
        const p = r.pick([0.5, 1, 2, 3, 4, -0.5, -0.25]);
        const y0 = 1 / (p + 1);
        return {
          q: [`For $y' + ${n(p)}y = e^{x}$ the solution is $y = \\dfrac{e^{x}}{${n(p)}+1} + Ce^{-${n(p)}x}$. For which value of $y(0)$ does the transient term vanish?`,
              `$y' + ${n(p)}y = e^{x}$ の解は $y = \\dfrac{e^{x}}{${n(p)}+1} + Ce^{-${n(p)}x}$ です。過渡項が消えるのは $y(0)$ がいくつのときですか。`],
          a: { type: 'num', v: y0, tol: 0.0005 },
          hint: ['The transient vanishes when $C = 0$.', '過渡項が消えるのは $C = 0$ のときです。'],
          sol: [[`$y(0) = \\dfrac{1}{${n(p)}+1} + C$, so $C = 0$ requires $y(0) = \\dfrac{1}{${n(p + 1)}}$.`, `$y(0) = \\dfrac{1}{${n(p)}+1} + C$ なので、$C = 0$ には $y(0) = \\dfrac{1}{${n(p + 1)}}$ が必要です。`],
                [`That is $y(0) = ${n(y0, 4)}$. Starting exactly on the forced solution, there is nothing to decay.`, `つまり $y(0) = ${n(y0, 4)}$ です。強制解の上から出発すれば、減衰する成分はありません。`]],
        };
      }
      const k = r.int(1, 3), c = r.nz(-3, 3);
      return {
        q: [`Solve $y' + ${coef(k)}y = ${c}x$ with $y(0) = 0$. Give $y(x)$.`,
            `$y' + ${coef(k)}y = ${c}x$ の解で $y(0) = 0$ を満たすものを求めて、$y(x)$ を答えてください。`],
        a: { type: 'expr', v: E(`${c / k}*x - ${c / (k * k)} + ${c / (k * k)}*exp(${-k}*x)`), vars: ['x'], lhs: ['$y(x)=$', '$y(x)=$'] },
        hint: [`$\\int xe^{${k}x}\\,dx$ needs integration by parts.`, `$\\int xe^{${k}x}\\,dx$ には部分積分を使います。`],
        sol: [[`$(e^{${k}x}y)' = ${c}xe^{${k}x}$, and $\\int xe^{${k}x}dx = \\left(\\dfrac{x}{${k}} - \\dfrac{1}{${k * k}}\\right)e^{${k}x}$.`, `$(e^{${k}x}y)' = ${c}xe^{${k}x}$ で、$\\int xe^{${k}x}dx = \\left(\\dfrac{x}{${k}} - \\dfrac{1}{${k * k}}\\right)e^{${k}x}$ です。`],
              [`So $y = ${n(c / k, 4)}x - ${n(c / (k * k), 4)} + Ce^{-${k}x}$, and $y(0) = 0$ gives $C = ${n(c / (k * k), 4)}$.`, `よって $y = ${n(c / k, 4)}x - ${n(c / (k * k), 4)} + Ce^{-${k}x}$ で、$y(0) = 0$ から $C = ${n(c / (k * k), 4)}$ です。`],
              [`For large $x$ the solution follows the line $${n(c / k, 4)}x - ${n(c / (k * k), 4)}$ with a lag of $1/${k}$.`, `$x$ が大きいと、解は直線 $${n(c / k, 4)}x - ${n(c / (k * k), 4)}$ に遅れ $1/${k}$ でついていきます。`]],
      };
    },
  ];

  /* ---------- 2. differential forms: exactness and potentials ---------- */
  Q['explore-integrating-factors-exact'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const C = r.nz(-3, 3), B = r.int(-4, 4), D = r.int(-4, 4);
        const exact = r.chance(0.5);
        const A = exact ? 2 * C : 2 * C + r.pick([-2, -1, 1, 2, 3]);
        const M = terms([[A, 'xy'], [B, '']]);
        const N = terms([[C, 'x^2'], [D, '']]);
        return {
          q: [`Is $(${M})\\,dx + (${N})\\,dy = 0$ exact?`, `$(${M})\\,dx + (${N})\\,dy = 0$ は完全ですか。`],
          a: { type: 'choice', fixed: true, v: exact ? 0 : 1, opts: [['Yes, exact', 'はい、完全です'], ['No, not exact', 'いいえ、完全ではありません']] },
          hint: ['Compare $M_y$ with $N_x$.', '$M_y$ と $N_x$ を比べます。'],
          sol: [[`$M_y = ${A}x$ and $N_x = ${2 * C}x$.`, `$M_y = ${A}x$、$N_x = ${2 * C}x$ です。`],
                [exact ? 'They agree, so the form is exact and a potential $F$ exists.' : `They differ by $${A - 2 * C}x$, so the form is not exact; no $F$ has $F_x = M$ and $F_y = N$ at once.`, exact ? '一致するので完全で、ポテンシャル $F$ が存在します。' : `差は $${A - 2 * C}x$ なので完全ではありません。$F_x = M$ と $F_y = N$ を同時に満たす $F$ はありません。`]],
        };
      }
      if (form === 1) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), x0 = r.int(1, 3), y0 = r.int(1, 3);
        const My = 2 * a * x0 * y0 + 0, Nx = 2 * b * x0 * y0;
        return {
          q: [`For $M = ${a}xy^2$ and $N = ${b}x^2y$, find $M_y - N_x$ at $(${x0}, ${y0})$.`,
              `$M = ${a}xy^2$、$N = ${b}x^2y$ のとき、点 $(${x0}, ${y0})$ での $M_y - N_x$ を求めてください。`],
          a: { type: 'int', v: My - Nx },
          hint: ['$M_y = 2axy$ and $N_x = 2bxy$.', '$M_y = 2axy$、$N_x = 2bxy$ です。'],
          sol: [[`$M_y = ${2 * a}xy$ and $N_x = ${2 * b}xy$.`, `$M_y = ${2 * a}xy$、$N_x = ${2 * b}xy$ です。`],
                [`At $(${x0}, ${y0})$: $${2 * a * x0 * y0} - (${2 * b * x0 * y0}) = ${My - Nx}$. ${a === b ? 'It is zero everywhere, so the form is exact.' : 'It is not zero, so the form is not exact there.'}`, `$(${x0}, ${y0})$ では $${2 * a * x0 * y0} - (${2 * b * x0 * y0}) = ${My - Nx}$ です。${a === b ? 'どこでも $0$ なので完全です。' : '$0$ ではないので、この点で完全ではありません。'}`]],
        };
      }
      const a = r.nz(-3, 3), b = r.nz(-3, 3);
      return {
        q: [`The solutions of $M\\,dx + N\\,dy = 0$ are the level curves of $F(x,y) = ${terms([[a, 'x^2y'], [b, 'y^3']])}$. Find $M$.`,
            `$M\\,dx + N\\,dy = 0$ の解は $F(x,y) = ${terms([[a, 'x^2y'], [b, 'y^3']])}$ の等位曲線です。$M$ を求めてください。`],
        a: { type: 'expr', v: E(`${2 * a}*x*y`), vars: ['x', 'y'], lhs: ['$M=$', '$M=$'] },
        hint: ['$M = F_x$.', '$M = F_x$ です。'],
        sol: [[`Along a level curve $dF = F_x\\,dx + F_y\\,dy = 0$, so $M = F_x$ and $N = F_y$.`, `等位曲線に沿って $dF = F_x\\,dx + F_y\\,dy = 0$ なので、$M = F_x$、$N = F_y$ です。`],
              [`$M = F_x = ${2 * a}xy$ (and $N = F_y = ${terms([[a, 'x^2'], [3 * b, 'y^2']])}$).`, `$M = F_x = ${2 * a}xy$ です（$N = F_y = ${terms([[a, 'x^2'], [3 * b, 'y^2']])}$）。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.int(-3, 3), d = r.int(-3, 3);
        const M = terms([[2 * a, 'xy'], [b, 'y^2'], [c, '']]);
        const N = terms([[a, 'x^2'], [2 * b, 'xy'], [d, '']]);
        const F = E(`${a}*x^2*y + ${b}*x*y^2 + ${c}*x + ${d}*y`);
        return {
          q: [`The form $(${M})\\,dx + (${N})\\,dy = 0$ is exact. Find its potential $F(x,y)$ with $F(0,0) = 0$.`,
              `$(${M})\\,dx + (${N})\\,dy = 0$ は完全です。$F(0,0) = 0$ となるポテンシャル $F(x,y)$ を求めてください。`],
          a: { type: 'expr', v: F, vars: ['x', 'y'], lhs: ['$F(x,y)=$', '$F(x,y)=$'] },
          hint: ['Integrate $M$ in $x$, then fix the leftover function of $y$ using $F_y = N$.', '$M$ を $x$ で積分し、残る $y$ の関数を $F_y = N$ で決めます。'],
          sol: [[`$F = \\int M\\,dx = ${terms([[a, 'x^2y'], [b, 'xy^2'], [c, 'x']])} + g(y)$.`, `$F = \\int M\\,dx = ${terms([[a, 'x^2y'], [b, 'xy^2'], [c, 'x']])} + g(y)$ です。`],
                [`Then $F_y = ${terms([[a, 'x^2'], [2 * b, 'xy']])} + g'(y)$ must equal $N$, so $g'(y) = ${d}$ and $g = ${d}y$.`, `$F_y = ${terms([[a, 'x^2'], [2 * b, 'xy']])} + g'(y)$ が $N$ に等しいので、$g'(y) = ${d}$、$g = ${d}y$ です。`],
                [`So $F = ${terms([[a, 'x^2y'], [b, 'xy^2'], [c, 'x'], [d, 'y']])}$, and the solutions are the curves $F = C$.`, `したがって $F = ${terms([[a, 'x^2y'], [b, 'xy^2'], [c, 'x'], [d, 'y']])}$ で、解は曲線 $F = C$ です。`]],
        };
      }
      if (form === 1) {
        const a = r.nz(-3, 3), c = r.nz(-4, 4), x0 = r.int(1, 3), y0 = r.int(1, 4), x1 = r.pick([2, 3, 4]);
        const Cc = a * x0 * x0 * y0 + c * x0;
        const y1 = (Cc - c * x1) / (a * x1 * x1);
        return {
          q: [`The curve through $(${x0}, ${y0})$ solving $(${terms([[2 * a, 'xy'], [c, '']])})\\,dx + ${a === 1 ? '' : `(${a})`}x^2\\,dy = 0$ is a level curve of its potential. Find its $y$-value at $x = ${x1}$.`,
              `$(${terms([[2 * a, 'xy'], [c, '']])})\\,dx + ${a === 1 ? '' : `(${a})`}x^2\\,dy = 0$ の解で点 $(${x0}, ${y0})$ を通る曲線について、$x = ${x1}$ での $y$ の値を求めてください。`],
          a: { type: 'num', v: y1, tol: 0.0006 },
          hint: ['Find $F$ first; then $F(x,y) = F(x_0,y_0)$ is the curve.', 'まず $F$ を求めます。曲線は $F(x,y) = F(x_0,y_0)$ です。'],
          sol: [[`$M_y = ${2 * a}x = N_x$, and $F = ${terms([[a, 'x^2y'], [c, 'x']])}$.`, `$M_y = ${2 * a}x = N_x$ で、$F = ${terms([[a, 'x^2y'], [c, 'x']])}$ です。`],
                [`Through $(${x0}, ${y0})$: $C = ${Cc}$.`, `点 $(${x0}, ${y0})$ を通るので $C = ${Cc}$ です。`],
                [`At $x = ${x1}$: $y = \\dfrac{${Cc} - ${c * x1}}{${a * x1 * x1}} = ${n(y1, 4)}$. Each level curve is one solution; this is the one through the given point.`, `$x = ${x1}$ では $y = \\dfrac{${Cc} - ${c * x1}}{${a * x1 * x1}} = ${n(y1, 4)}$ です。各等位曲線が 1 つの解で、これが与えられた点を通るものです。`]],
        };
      }
      const a = r.nz(-3, 3), b = r.nz(-3, 3);
      const Fv = E(`${a}*y*sin(x) + ${b}*x*y^2`);
      const Mx = terms([[a, 'y\\cos x'], [b, 'y^2']]);
      const Nx = terms([[a, '\\sin x'], [2 * b, 'xy']]);
      return {
        q: [`The form $(${Mx})\\,dx + (${Nx})\\,dy = 0$ is exact. Find its potential $F$ with $F(0,0) = 0$.`,
            `$(${Mx})\\,dx + (${Nx})\\,dy = 0$ は完全です。$F(0,0) = 0$ となるポテンシャル $F$ を求めてください。`],
        a: { type: 'expr', v: Fv, vars: ['x', 'y'], lhs: ['$F(x,y)=$', '$F(x,y)=$'] },
        hint: ['Integrate $M$ with respect to $x$ and compare with $N$.', '$M$ を $x$ で積分して $N$ と比べます。'],
        sol: [[`$\\int M\\,dx = ${terms([[a, 'y\\sin x'], [b, 'xy^2']])} + g(y)$.`, `$\\int M\\,dx = ${terms([[a, 'y\\sin x'], [b, 'xy^2']])} + g(y)$ です。`],
              [`Its $y$-derivative is already $${Nx}$, so $g' = 0$ and $g$ is constant, which $F(0,0) = 0$ sets to $0$.`, `この $y$ 微分はすでに $${Nx}$ なので $g' = 0$ で、$g$ は定数です。$F(0,0) = 0$ より $0$ になります。`],
              [`So $F = ${terms([[a, 'y\\sin x'], [b, 'xy^2']])}$.`, `したがって $F = ${terms([[a, 'y\\sin x'], [b, 'xy^2']])}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const q = r.nz(-3, 3), m = r.nz(-3, 3);
        const Mt = terms([['k', 'xy'], [m, 'y^2']]);
        const Nt = terms([[q, 'x^2'], ['n', 'xy']]);
        return {
          q: [`Find the constants $k$ and $n$ that make $(kxy + ${m < 0 ? `(${m})` : m}y^2)\\,dx + (${q < 0 ? `(${q})` : q}x^2 + nxy)\\,dy = 0$ exact. Enter $k$ then $n$.`,
              `$(kxy + ${m < 0 ? `(${m})` : m}y^2)\\,dx + (${q < 0 ? `(${q})` : q}x^2 + nxy)\\,dy = 0$ が完全になる定数 $k$、$n$ を求めてください。$k$、$n$ の順に入力します。`],
          a: { type: 'tuple', v: [2 * q, 2 * m], labels: ['$k$', '$n$'], tol: 1e-9 },
          hint: ['Require $M_y = N_x$ for all $x$ and $y$: compare the coefficients of $x$ and of $y$.', 'すべての $x$、$y$ で $M_y = N_x$ を要求し、$x$ の係数と $y$ の係数を比べます。'],
          sol: [[`$M_y = kx + ${2 * m}y$ and $N_x = ${2 * q}x + ny$.`, `$M_y = kx + ${2 * m}y$、$N_x = ${2 * q}x + ny$ です。`],
                [`Matching the $x$ terms gives $k = ${2 * q}$; matching the $y$ terms gives $n = ${2 * m}$.`, `$x$ の項を比べて $k = ${2 * q}$、$y$ の項を比べて $n = ${2 * m}$ です。`],
                [`Both conditions are needed: with only one matched, $M_y - N_x$ is a non-zero multiple of $x$ or $y$.`, `両方の条件が必要です。片方だけ合わせても、$M_y - N_x$ は $x$ または $y$ の $0$ でない倍数になります。`]],
        };
      }
      const a = r.nz(-3, 3), b = r.nz(-3, 3);
      const k = r.pick([1, 2, 3]);
      // F = a x^k y + b y^2 ; N = a x^k + 2 b y ; M = a k x^(k-1) y. Ask for the missing exponent through a test at a point
            return {
        q: [`$F(x,y) = ${terms([[a, `x^${k}y`], [b, 'y^2']])}$ is the potential of $M\\,dx + N\\,dy = 0$. Write $N$.`,
            `$F(x,y) = ${terms([[a, `x^${k}y`], [b, 'y^2']])}$ が $M\\,dx + N\\,dy = 0$ のポテンシャルであるとき、$N$ を求めてください。`],
        a: { type: 'expr', v: E(`${a}*x^${k} + ${2 * b}*y`), vars: ['x', 'y'], lhs: ['$N=$', '$N=$'] },
        hint: ['$N = F_y$.', '$N = F_y$ です。'],
        sol: [[`$N = F_y = ${terms([[a, `x^${k}`], [2 * b, 'y']])}$.`, `$N = F_y = ${terms([[a, `x^${k}`], [2 * b, 'y']])}$ です。`],
              [`Also $M = F_x = ${terms([[a * k, k === 1 ? 'y' : `x^${k - 1}y`]])}$, and $M_y = N_x = ${a * k}${k === 1 ? '' : `x^${k - 1}`}$, as exactness requires. A form that has a potential always passes this test.`, `また $M = F_x = ${terms([[a * k, k === 1 ? 'y' : `x^${k - 1}y`]])}$ で、$M_y = N_x = ${a * k}${k === 1 ? '' : `x^${k - 1}`}$ となり、完全性の条件を満たします。ポテンシャルをもつ形式は必ずこの検査を通ります。`]],
      };
    },
  ];

  /* ---------- 3. repair: finding mu ---------- */
  Q['explore-integrating-factors-repair'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, c;
        do { a = r.nz(-4, 5); c = r.nz(-3, 4); } while (a === c);
        const b = r.nz(-3, 3);
        return {
          q: [`For $(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ compute $\\dfrac{M_y - N_x}{N}$ as a function of $x$.`,
              `$(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ について、$\\dfrac{M_y - N_x}{N}$ を $x$ の関数として求めてください。`],
          a: { type: 'expr', v: E(`${a - c}/(${c}*x)`), vars: ['x'], lhs: ['$\\dfrac{M_y - N_x}{N} =$', '$\\dfrac{M_y - N_x}{N} =$'] },
          hint: ['$M_y = $ the coefficient of $y$ in $M$; $N_x$ is the derivative of $N$.', '$M_y$ は $M$ の $y$ の係数、$N_x$ は $N$ の導関数です。'],
          sol: [[`$M_y = ${a}$ and $N_x = ${c}$.`, `$M_y = ${a}$、$N_x = ${c}$ です。`],
                [`$\\dfrac{M_y - N_x}{N} = \\dfrac{${a - c}}{${c}x}$. It depends on $x$ only, so an integrating factor $\\mu(x)$ exists.`, `$\\dfrac{M_y - N_x}{N} = \\dfrac{${a - c}}{${c}x}$ で、$x$ だけの関数なので積分因子 $\\mu(x)$ が存在します。`]],
        };
      }
      if (form === 1) {
        let a, b;
        do { a = r.nz(-3, 3); b = r.nz(-4, 4); } while (b === 2 * a);
        const val = (2 * a - b) / b;
        return {
          q: [`For $${a}y^2\\,dx + ${b}xy\\,dy = 0$ the quotient $\\dfrac{M_y - N_x}{N}$ equals $\\dfrac{c}{x}$. Find $c$.`,
              `$${a}y^2\\,dx + ${b}xy\\,dy = 0$ では、$\\dfrac{M_y - N_x}{N}$ は $\\dfrac{c}{x}$ に等しくなります。$c$ を求めてください。`],
          a: { type: 'num', v: val, tol: 1e-6, show: frac(2 * a - b, b) },
          hint: ['$M_y = 2ay$ and $N_x = by$; divide by $N = bxy$.', '$M_y = 2ay$、$N_x = by$ で、$N = bxy$ で割ります。'],
          sol: [[`$M_y = ${2 * a}y$, $N_x = ${b}y$, so $M_y - N_x = ${2 * a - b}y$.`, `$M_y = ${2 * a}y$、$N_x = ${b}y$ なので $M_y - N_x = ${2 * a - b}y$ です。`],
                [`Dividing by $N = ${b}xy$: $\\dfrac{${2 * a - b}}{${b}x}$, so $c = ${n(val, 4)}$ and $\\mu = x^{c}$.`, `$N = ${b}xy$ で割ると $\\dfrac{${2 * a - b}}{${b}x}$ なので $c = ${n(val, 4)}$、$\\mu = x^{c}$ です。`]],
        };
      }
      const c1 = r.nz(-3, 3), a1 = r.nz(-3, 3), b1 = r.nz(-3, 3);
      const Mt = terms([[c1, 'y']]);
      const Nt = terms([[a1, 'y'], [b1, 'x']]);
      const isExact = (c1 === b1);
      return {
        q: [`For $(${Mt})\\,dx + (${Nt})\\,dy = 0$, which integrating factor can the one-variable test find?`,
            `$(${Mt})\\,dx + (${Nt})\\,dy = 0$ に対して、1 変数の判定で見つかる積分因子はどれですか。`],
        a: { type: 'choice', fixed: true, v: isExact ? 2 : 1, opts: [['One depending on $x$ only', '$x$ だけに依存するもの'], ['One depending on $y$ only', '$y$ だけに依存するもの'], ['The form is already exact', 'すでに完全である']] },
        hint: ['Compute $M_y$ and $N_x$ first. If they agree, no factor is needed.', 'まず $M_y$ と $N_x$ を求めます。一致すれば因子は不要です。'],
        sol: [[`$M_y = ${c1}$ and $N_x = ${b1}$.`, `$M_y = ${c1}$、$N_x = ${b1}$ です。`],
              isExact ? [`They agree, so the form is already exact.`, `一致するので、すでに完全です。`]
                    : [`$\\dfrac{N_x - M_y}{M} = \\dfrac{${b1 - c1}}{${c1}y}$ depends on $y$ only, so $\\mu(y)$ works; $\\dfrac{M_y - N_x}{N} = \\dfrac{${c1 - b1}}{${Nt}}$ mixes $x$ and $y$ (since $N$ involves both), so no $\\mu(x)$ this way.`, `$\\dfrac{N_x - M_y}{M} = \\dfrac{${b1 - c1}}{${c1}y}$ は $y$ だけの関数なので $\\mu(y)$ が使えます。一方 $\\dfrac{M_y - N_x}{N} = \\dfrac{${c1 - b1}}{${Nt}}$ は $N$ が両方を含むので $x$ だけの関数になりません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let p;
        do { p = r.int(-4, 5); } while (p === 0 || p === -1 || p === -2);
        const c = r.nz(-3, 3), b = r.nz(-3, 3);
        const a = c * (p + 1);
        return {
          q: [`Find an integrating factor $\\mu(x)$ of $(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ on $x > 0$ (integration constant zero).`,
              `$x > 0$ で $(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ の積分因子 $\\mu(x)$ を求めてください（積分定数は $0$）。`],
          a: { type: 'expr', v: E(`x^(${p})`), vars: ['x'], lhs: ['$\\mu(x)=$', '$\\mu(x)=$'] },
          hint: ['$\\mu = \\exp\\left(\\int \\dfrac{M_y - N_x}{N}\\,dx\\right)$.', '$\\mu = \\exp\\left(\\int \\dfrac{M_y - N_x}{N}\\,dx\\right)$ です。'],
          sol: [[`$M_y = ${a}$, $N_x = ${c}$, so $\\dfrac{M_y - N_x}{N} = \\dfrac{${a - c}}{${c}x} = \\dfrac{${p}}{x}$.`, `$M_y = ${a}$、$N_x = ${c}$ なので $\\dfrac{M_y - N_x}{N} = \\dfrac{${a - c}}{${c}x} = \\dfrac{${p}}{x}$ です。`],
                [`$\\mu = \\exp\\left(\\int \\dfrac{${p}}{x}dx\\right) = x^{${p}}$.`, `$\\mu = \\exp\\left(\\int \\dfrac{${p}}{x}dx\\right) = x^{${p}}$ です。`],
                [`Check: $(\\mu M)_y = ${a}x^{${p}}$ and $(\\mu N)_x = ${c * (p + 1)}x^{${p}}$, equal because ${a} = ${c}\\cdot${p + 1}.`, `検算：$(\\mu M)_y = ${a}x^{${p}}$、$(\\mu N)_x = ${c * (p + 1)}x^{${p}}$ で、${a} = ${c}\\cdot${p + 1} なので等しくなります。`]],
        };
      }
      if (form === 1) {
        let p;
        do { p = r.int(-4, 4); } while (p === 0 || p === -1);
        const c = r.nz(-3, 3), a = r.nz(-3, 3);
        const b = c * (p + 1);
        return {
          q: [`Find an integrating factor $\\mu(y)$ of $${c}y\\,dx + (${terms([[a, 'y'], [b, 'x']])})\\,dy = 0$ on $y > 0$ (integration constant zero).`,
              `$y > 0$ で $${c}y\\,dx + (${terms([[a, 'y'], [b, 'x']])})\\,dy = 0$ の積分因子 $\\mu(y)$ を求めてください（積分定数は $0$）。`],
          a: { type: 'expr', v: E(`y^(${p})`), vars: ['y'], lhs: ['$\\mu(y)=$', '$\\mu(y)=$'] },
          hint: ['Now use $\\mu = \\exp\\left(\\int \\dfrac{N_x - M_y}{M}\\,dy\\right)$.', '今度は $\\mu = \\exp\\left(\\int \\dfrac{N_x - M_y}{M}\\,dy\\right)$ を使います。'],
          sol: [[`$M_y = ${c}$, $N_x = ${b}$, so $\\dfrac{N_x - M_y}{M} = \\dfrac{${b - c}}{${c}y} = \\dfrac{${p}}{y}$.`, `$M_y = ${c}$、$N_x = ${b}$ なので $\\dfrac{N_x - M_y}{M} = \\dfrac{${b - c}}{${c}y} = \\dfrac{${p}}{y}$ です。`],
                [`$\\mu = \\exp\\left(\\int \\dfrac{${p}}{y}dy\\right) = y^{${p}}$.`, `$\\mu = \\exp\\left(\\int \\dfrac{${p}}{y}dy\\right) = y^{${p}}$ です。`],
                [`The roles of $x$ and $y$ swap: the test for $\\mu(y)$ divides by $M$ and has the opposite sign.`, `$x$ と $y$ の役割が入れ替わります。$\\mu(y)$ の判定は $M$ で割り、符号が逆になります。`]],
        };
      }
      let p;
      do { p = r.int(-4, 4); } while (p === 0 || p === -1 || p === -2);
      const c = r.nz(-3, 3), b = r.nz(-3, 3);
      const a = c * (p + 1);
      const x1 = r.pick([1, 2]), y1 = r.pick([1, 2, 3]);
      const F = (x, y) => c * Math.pow(x, p + 1) * y + b * Math.pow(x, p + 2) / (p + 2);
      return {
        q: [`After multiplying $(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ by its integrating factor $x^{${p}}$, the form is exact with a potential $F$ that has no constant term. Find $F(${x1}, ${y1})$.`,
            `$(${terms([[a, 'y'], [b, 'x']])})\\,dx + ${c === 1 ? '' : `(${c})`}x\\,dy = 0$ に積分因子 $x^{${p}}$ を掛けると完全になります。定数項をもたないポテンシャル $F$ について、$F(${x1}, ${y1})$ を求めてください。`],
        a: { type: 'num', v: F(x1, y1), tol: 0.0006 },
        hint: [`Integrate $\\mu N$ in $y$, then match $F_x = \\mu M$.`, `$\\mu N$ を $y$ で積分し、$F_x = \\mu M$ と合わせます。`],
        sol: [[`$\\mu N = ${c}x^{${p + 1}}$, so $F = ${c}x^{${p + 1}}y + g(x)$.`, `$\\mu N = ${c}x^{${p + 1}}$ なので $F = ${c}x^{${p + 1}}y + g(x)$ です。`],
              [`$F_x = ${c * (p + 1)}x^{${p}}y + g'(x)$ must equal $\\mu M = ${a}x^{${p}}y + ${b}x^{${p + 1}}$, so $g' = ${b}x^{${p + 1}}$ and $g = \\dfrac{${b}}{${p + 2}}x^{${p + 2}}$.`, `$F_x = ${c * (p + 1)}x^{${p}}y + g'(x)$ が $\\mu M = ${a}x^{${p}}y + ${b}x^{${p + 1}}$ に等しいので、$g' = ${b}x^{${p + 1}}$、$g = \\dfrac{${b}}{${p + 2}}x^{${p + 2}}$ です。`],
              [`$F(${x1}, ${y1}) = ${n(F(x1, y1), 4)}$. The curves $F = C$ solve the original equation wherever $x > 0$.`, `$F(${x1}, ${y1}) = ${n(F(x1, y1), 4)}$ です。曲線 $F = C$ は $x > 0$ で元の方程式の解です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3);
        return {
          q: [`Write $y' + ${a}xy = x$ as $M\\,dx + N\\,dy = 0$ with $N = 1$, then use $\\dfrac{M_y - N_x}{N}$ to find an integrating factor $\\mu(x)$ (constant zero).`,
              `$y' + ${a}xy = x$ を $N = 1$ の $M\\,dx + N\\,dy = 0$ の形に書き、$\\dfrac{M_y - N_x}{N}$ から積分因子 $\\mu(x)$ を求めてください（定数は $0$）。`],
          a: { type: 'expr', v: E(`exp(${a}*x^2/2)`), vars: ['x'], dom: { x: [0.3, 1.6] }, lhs: ['$\\mu(x)=$', '$\\mu(x)=$'] },
          hint: [`In $(${a}xy - x)\\,dx + dy = 0$ the quantity $M_y$ is exactly $P(x)$.`, `$(${a}xy - x)\\,dx + dy = 0$ では $M_y$ がちょうど $P(x)$ です。`],
          sol: [[`$M = ${a}xy - x$, $N = 1$, so $M_y = ${a}x$ and $N_x = 0$.`, `$M = ${a}xy - x$、$N = 1$ なので $M_y = ${a}x$、$N_x = 0$ です。`],
                [`$\\dfrac{M_y - N_x}{N} = ${a}x$, so $\\mu = e^{\\int ${a}x\\,dx} = e^{${a}x^2/2}$.`, `$\\dfrac{M_y - N_x}{N} = ${a}x$ なので $\\mu = e^{\\int ${a}x\\,dx} = e^{${a}x^2/2}$ です。`],
                [`This is exactly the linear-ODE factor $e^{\\int P}$: the two halves of the method are one idea, since for $N = 1$ the repair test returns $P(x)$ itself.`, `これは線形 ODE の因子 $e^{\\int P}$ そのものです。$N = 1$ のとき修復の判定式は $P(x)$ をそのまま返すので、二つの方法は同じ考えです。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 4, -2, -3]);
        return {
          q: [`The linear equation $y' + ${k}y/(1+x) = 1$ on $x > -1$ has integrating factor $\\mu(x) = (1+x)^m$. Find $m$.`,
              `$x > -1$ での線形方程式 $y' + ${k}y/(1+x) = 1$ の積分因子は $\\mu(x) = (1+x)^m$ です。$m$ を求めてください。`],
          a: { type: 'int', v: k },
          hint: ['$\\int \\dfrac{dx}{1+x} = \\ln(1+x)$.', '$\\int \\dfrac{dx}{1+x} = \\ln(1+x)$ です。'],
          sol: [[`$\\int \\dfrac{${k}}{1+x}dx = ${k}\\ln(1+x)$.`, `$\\int \\dfrac{${k}}{1+x}dx = ${k}\\ln(1+x)$ です。`],
                [`So $\\mu = (1+x)^{${k}}$ and $m = ${k}$. The factor is finite and nonzero for $x > -1$, so no solution is lost there.`, `よって $\\mu = (1+x)^{${k}}$ で $m = ${k}$ です。この因子は $x > -1$ で有限かつ $0$ でないので、解は失われません。`]],
        };
      }
      let p;
      do { p = r.int(-4, 4); } while (p === 0);
      const pos = p > 0;
      return {
        q: [`An equation $M\\,dx + N\\,dy = 0$ is multiplied by $\\mu = x^{${p}}$ to make it exact. Does the multiplied equation have the line $x = 0$ as an extra solution that the original need not have?`,
            `方程式 $M\\,dx + N\\,dy = 0$ に $\\mu = x^{${p}}$ を掛けて完全にしました。掛けた後の方程式は、元の方程式がもつとは限らない余分な解として直線 $x = 0$ をもちますか。`],
        a: { type: 'choice', fixed: true, v: pos ? 0 : 1, opts: [['Yes: both coefficients vanish on $x = 0$, so it becomes a spurious solution', 'はい。$x = 0$ では両方の係数が $0$ になり、余分な解になります'], ['No: the factor is not defined on $x = 0$, so that line must be checked in the original', 'いいえ。掛けた方程式は $x = 0$ で定義されないので、その直線は元の方程式で別に調べます'], ['No: multiplying by a factor never changes the solutions', 'いいえ。因子を掛けても解は決して変わりません']] },
        hint: ['Evaluate $x^{p}$ at $x = 0$ for this sign of $p$.', 'この符号の $p$ について $x = 0$ での $x^{p}$ を考えます。'],
        sol: [[pos ? `For $p = ${p} > 0$, $x^{${p}} = 0$ at $x = 0$, so $x^{${p}}M = x^{${p}}N = 0$ there and the line satisfies the multiplied equation whatever $M$ and $N$ are.` : `For $p = ${p} < 0$, $x^{${p}}$ is not defined at $x = 0$, so the multiplied equation says nothing on that line.`, pos ? `$p = ${p} > 0$ なので $x = 0$ で $x^{${p}} = 0$ となり、$x^{${p}}M = x^{${p}}N = 0$ です。$M$、$N$ によらず、その直線は掛けた方程式を満たします。` : `$p = ${p} < 0$ なので $x = 0$ で $x^{${p}}$ は定義されず、掛けた方程式はその直線について何も言いません。`],
              [`So the factor preserves solution curves only where it is finite and nonzero: solve on $x > 0$ and $x < 0$, and test $x = 0$ in the original equation by hand.`, `したがって因子が解曲線を保つのは、有限で $0$ でない場所だけです。$x > 0$ と $x < 0$ で解き、$x = 0$ は元の方程式で別に確かめます。`]],
      };
    },
  ];
})();
