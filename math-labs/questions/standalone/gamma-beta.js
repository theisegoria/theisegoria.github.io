'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, gcd } = P.util;
  const PI = Math.PI, YN = (en, ja) => [en, ja];

  function lgamma(z) {
    const c = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(PI) - Math.log(Math.sin(PI * z)) - lgamma(1 - z);
    z -= 1; let x = 0.9999999999998099; c.forEach((v, i) => { x += v / (z + i + 1); });
    const t = z + 7.5; return 0.5 * Math.log(2 * PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  const G = (z) => Math.exp(lgamma(z)), B = (a, b) => Math.exp(lgamma(a) + lgamma(b) - lgamma(a + b));
  const fact = (m) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
  const dfact = (m) => { let f = 1; for (let i = m; i > 1; i -= 2) f *= i; return f; };
  // Gamma(k + 1/2) = (2k - 1)!! / 2^k * sqrt(pi)
  const halfG = (k) => [dfact(2 * k - 1), 2 ** k];
  // nice closed form: v = p/q or v = (p/q) pi, denominators up to 4096
  function nice(v) {
    for (let q = 1; q <= 4096; q++) { const p = Math.round(v * q); if (p !== 0 && Math.abs(p / q - v) < 1e-9 * Math.max(1, Math.abs(v))) { const g = gcd(p, q); return frac(p / g, q / g); } }
    for (let q = 1; q <= 4096; q++) { const p = Math.round(v / PI * q); if (p !== 0 && Math.abs(p / q * PI - v) < 1e-9 * Math.max(1, Math.abs(v))) { const g = gcd(p, q); const f = frac(p / g, q / g); return (f === '1' ? '' : f) + '\\pi'; } }
    return undefined;
  }
  const numA = (v, extra = {}) => { const sh = nice(v); return { type: 'num', v, ...(sh ? { show: sh } : {}), ...extra }; };
  const halfTex = (k) => { const [p, q] = halfG(k); return (q === 1 ? (p === 1 ? '' : String(p)) : frac(p, q)) + '\\sqrt{\\pi}'; };
  // base^k written without a zero or unit exponent
  const pw = (b, k) => (k === 0 ? '' : k === 1 ? b : `${b}^{${k}}`);
  const argTex = (x) => (Number.isInteger(x) ? String(x) : frac(Math.round(x * 2), 2));

  /* ---------- 1. the Gamma function ---------- */
  Q['gamma-beta-gamma'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(2, 9);
        return {
          q: [`What is $\\Gamma(${m})$?`, `$\\Gamma(${m})$ はいくらですか。`],
          a: { type: 'int', v: fact(m - 1) },
          hint: ['The shift matters: $\\Gamma(n + 1) = n!$.', 'ずれに注意します。$\\Gamma(n + 1) = n!$ です。'],
          sol: [[`$\\Gamma(${m}) = \\Gamma(${m - 1} + 1) = ${m - 1}! = ${fact(m - 1)}$.`, `$\\Gamma(${m}) = \\Gamma(${m - 1} + 1) = ${m - 1}! = ${fact(m - 1)}$ です。`], ['Gamma extends the factorial, shifted by one, and fills in the values between the integers.', 'ガンマ関数は階乗を 1 だけずらして拡張し、整数の間の値も与えます。']],
        };
      }
      if (form === 1) {
        const k = r.int(1, 5);
        return {
          q: [`Use $\\Gamma(1/2) = \\sqrt{\\pi}$ and the recurrence to find $\\Gamma(${k} + \\tfrac12)$.`, `$\\Gamma(1/2) = \\sqrt{\\pi}$ と漸化式を使って $\\Gamma(${k} + \\tfrac12)$ を求めてください。`],
          a: numA(G(k + 0.5), { show: halfTex(k) }),
          hint: ['Apply $\\Gamma(s + 1) = s\\,\\Gamma(s)$ repeatedly, starting from $s = 1/2$.', '$s = 1/2$ から始めて、$\\Gamma(s + 1) = s\\,\\Gamma(s)$ を繰り返し使います。'],
          sol: [[`$\\Gamma(${k} + \\tfrac12) = ${Array.from({ length: k }, (_, i) => frac(2 * (k - i) - 1, 2)).join(' \\cdot ')}\\cdot\\Gamma(\\tfrac12)$.`, `$\\Gamma(${k} + \\tfrac12) = ${Array.from({ length: k }, (_, i) => frac(2 * (k - i) - 1, 2)).join(' \\cdot ')}\\cdot\\Gamma(\\tfrac12)$ です。`], [`The product is $${frac(halfG(k)[0], halfG(k)[1])}$, so the value is $${halfTex(k)} \\approx ${n(G(k + 0.5), 5)}$.`, `係数の積は $${frac(halfG(k)[0], halfG(k)[1])}$ なので、値は $${halfTex(k)} \\approx ${n(G(k + 0.5), 5)}$ です。`], ['Every positive half-integer value reduces to $\\sqrt{\\pi}$ times a rational number.', '正の半整数での値はすべて、$\\sqrt{\\pi}$ に有理数を掛けた形になります。']],
        };
      }
      const s = r.pick([1.5, 2.5, 3.5, 2.2, 3.4, 4.3]), g = G(s);
      return {
        q: [`Given $\\Gamma(${n(s)}) \\approx ${n(g, 5)}$, find $\\Gamma(${n(s + 1)})$ without a calculator for Gamma. Give four significant figures.`, `$\\Gamma(${n(s)}) \\approx ${n(g, 5)}$ が与えられています。ガンマ関数の電卓を使わずに $\\Gamma(${n(s + 1)})$ を求めてください（有効数字 4 桁）。`],
        a: { type: 'num', v: s * g, rel: 0.002 },
        hint: ['Use $\\Gamma(s + 1) = s\\,\\Gamma(s)$ with $s = ' + n(s) + '$.', '$s = ' + n(s) + '$ として $\\Gamma(s + 1) = s\\,\\Gamma(s)$ を使います。'],
        sol: [[`$\\Gamma(${n(s + 1)}) = ${n(s)}\\cdot\\Gamma(${n(s)}) = ${n(s)}\\cdot ${n(g, 5)} = ${n(s * g, 5)}$.`, `$\\Gamma(${n(s + 1)}) = ${n(s)}\\cdot\\Gamma(${n(s)}) = ${n(s)}\\cdot ${n(g, 5)} = ${n(s * g, 5)}$ です。`], ['The recurrence needs only one value in each unit interval to generate all the others.', '漸化式があれば、各単位区間で一つの値を知るだけで他のすべてが得られます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(1, 6), c = r.pick([1, 2, 3, 4, 5]);
        const v = fact(m) / c ** (m + 1);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^\\infty x^{${m}}e^{-${c === 1 ? '' : c}x}\\,dx$.`, `$\\displaystyle\\int_0^\\infty x^{${m}}e^{-${c === 1 ? '' : c}x}\\,dx$ を計算してください。`],
          a: numA(v, { show: frac(fact(m), c ** (m + 1)) }),
          hint: [`Substitute $t = ${c === 1 ? '' : c}x$ to reach $\\Gamma(${m + 1})$.`, `$t = ${c === 1 ? '' : c}x$ とおくと $\\Gamma(${m + 1})$ の形になります。`],
          sol: [[`With $t = ${c === 1 ? '' : c}x$, $x = t/${c}$ and $dx = dt/${c}$, the integral is $\\dfrac{1}{${c}^{${m + 1}}}\\int_0^\\infty t^{${m}}e^{-t}\\,dt$.`, `$t = ${c === 1 ? '' : c}x$、$x = t/${c}$、$dx = dt/${c}$ とおくと、積分は $\\dfrac{1}{${c}^{${m + 1}}}\\int_0^\\infty t^{${m}}e^{-t}\\,dt$ です。`], [`This is $\\Gamma(${m + 1})/${c}^{${m + 1}} = ${m}!/${c ** (m + 1)} = ${frac(fact(m), c ** (m + 1))}$.`, `これは $\\Gamma(${m + 1})/${c}^{${m + 1}} = ${m}!/${c ** (m + 1)} = ${frac(fact(m), c ** (m + 1))}$ です。`], ['A rate $c$ in the exponential contributes a factor $c^{-(m+1)}$: the power of $x$ fixes the power of $c$.', '指数の係数 $c$ は因子 $c^{-(m+1)}$ として現れ、$x$ のべきが $c$ のべきを決めます。']],
        };
      }
      if (form === 1) {
        const opts = [[1, 2, 1], [3, 2, 1], [1, 2, 4], [1, 3, 1], [2, 3, 1], [3, 3, 1], [2, 4, 1], [4, 2, 1], [1, 4, 1], [5, 2, 1]];
        const [p, rr, c] = r.pick(opts);
        const v = G(p / rr) / (rr * c ** (p / rr));
        return {
          q: [`Evaluate $\\displaystyle\\int_0^\\infty ${pw('x', p - 1)}e^{-${c === 1 ? '' : c}x^{${rr}}}\\,dx$.`, `$\\displaystyle\\int_0^\\infty ${pw('x', p - 1)}e^{-${c === 1 ? '' : c}x^{${rr}}}\\,dx$ を計算してください。`],
          a: numA(v),
          hint: [`Let $t = ${c === 1 ? '' : c}x^{${rr}}$; the match is $\\Gamma(p/r)/(r\\,c^{p/r})$ with $p = ${p}$, $r = ${rr}$.`, `$t = ${c === 1 ? '' : c}x^{${rr}}$ とおきます。$p = ${p}$、$r = ${rr}$ で $\\Gamma(p/r)/(r\\,c^{p/r})$ に一致します。`],
          sol: [[`The integral equals $\\dfrac{\\Gamma(p/r)}{r\\,c^{p/r}}$ with $p = ${p}$, $r = ${rr}$, $c = ${c}$.`, `積分は $\\dfrac{\\Gamma(p/r)}{r\\,c^{p/r}}$ で、$p = ${p}$、$r = ${rr}$、$c = ${c}$ です。`], [`That is $\\dfrac{\\Gamma(${frac(p, rr)})}{${rr}\\cdot ${c}^{${frac(p, rr)}}} \\approx ${n(v, 5)}$.`, `つまり $\\dfrac{\\Gamma(${frac(p, rr)})}{${rr}\\cdot ${c}^{${frac(p, rr)}}} \\approx ${n(v, 5)}$ です。`], ['The exponent $p - 1$ on $x$ and the power $r$ inside the exponential together decide which Gamma value appears.', '$x$ の指数 $p - 1$ と指数関数の中のべき $r$ が、どのガンマ値が現れるかを決めます。']],
        };
      }
      const a = r.pick([1.5, 2.5, 0.5, 3.5]), nn = r.int(2, 3);
      let prod = 1; for (let i = 0; i < nn; i++) prod *= a + i;
      return {
        q: [`Compute $\\dfrac{\\Gamma(${n(a + nn)})}{\\Gamma(${n(a)})}$ exactly.`, `$\\dfrac{\\Gamma(${n(a + nn)})}{\\Gamma(${n(a)})}$ を厳密に計算してください。`],
        a: numA(prod),
        hint: ['Peel off the recurrence $\\Gamma(s + 1) = s\\,\\Gamma(s)$ one step at a time.', '漸化式 $\\Gamma(s + 1) = s\\,\\Gamma(s)$ を一段ずつはがしていきます。'],
        sol: [[`$\\Gamma(${n(a + nn)}) = ${Array.from({ length: nn }, (_, i) => n(a + nn - 1 - i)).join(' \\cdot ')}\\cdot\\Gamma(${n(a)})$.`, `$\\Gamma(${n(a + nn)}) = ${Array.from({ length: nn }, (_, i) => n(a + nn - 1 - i)).join(' \\cdot ')}\\cdot\\Gamma(${n(a)})$ です。`], [`The ratio is $${Array.from({ length: nn }, (_, i) => n(a + i)).join(' \\cdot ')} = ${n(prod)}$.`, `比は $${Array.from({ length: nn }, (_, i) => n(a + i)).join(' \\cdot ')} = ${n(prod)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(2, 4);
        const e = Array.from({ length: m }, (_, i) => `(s+${i})`).join('*').replace('(s+0)', 's');
        return {
          q: [`Write $\\Gamma(s + ${m})/\\Gamma(s)$ as a polynomial in $s$.`, `$\\Gamma(s + ${m})/\\Gamma(s)$ を $s$ の多項式で表してください。`],
          a: { type: 'expr', v: e, vars: ['s'], lhs: [`$\\Gamma(s + ${m})/\\Gamma(s) =$`, `$\\Gamma(s + ${m})/\\Gamma(s) =$`] },
          hint: ['Apply $\\Gamma(x + 1) = x\\Gamma(x)$ repeatedly, from the top down.', '上から順に $\\Gamma(x + 1) = x\\Gamma(x)$ を繰り返し使います。'],
          sol: [[`$\\Gamma(s + ${m}) = ${Array.from({ length: m }, (_, i) => (i === m - 1 ? 's' : `(s + ${m - 1 - i})`)).join('\\,')}\\,\\Gamma(s)$.`, `$\\Gamma(s + ${m}) = ${Array.from({ length: m }, (_, i) => (i === m - 1 ? 's' : `(s + ${m - 1 - i})`)).join('\\,')}\\,\\Gamma(s)$ です。`], [`So the ratio is $${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}$, the rising factorial of length ${m}.`, `したがって比は $${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}$ で、長さ ${m} の上昇階乗です。`], [`For $s = 1$ it reduces to $${m}! = ${fact(m)}$, the factorial that Gamma was built to extend.`, `$s = 1$ では $${m}! = ${fact(m)}$ となり、ガンマ関数が拡張しようとした階乗に一致します。`]],
        };
      }
      if (form === 1) {
        const e = r.pick([-1.5, -1, -0.75, -0.5, 0, 1, 2.5]);
        const conv = e > -1;
        return {
          q: [`Does $\\displaystyle\\int_0^\\infty t^{${n(e)}}e^{-t}\\,dt$ converge?`, `$\\displaystyle\\int_0^\\infty t^{${n(e)}}e^{-t}\\,dt$ は収束しますか。`],
          a: { type: 'choice', opts: [YN('Yes, to $\\Gamma(' + n(e + 1) + ')$', 'はい、$\\Gamma(' + n(e + 1) + ')$ に収束する'), YN('No, it diverges at $0$', 'いいえ、$0$ で発散する')], v: conv ? 0 : 1, fixed: true },
          hint: ['Write the integrand as $t^{s-1}e^{-t}$ and compare $s$ with $0$.', '被積分関数を $t^{s-1}e^{-t}$ と書き、$s$ を $0$ と比べます。'],
          sol: [[`Matching $t^{s-1}$ gives $s = ${n(e + 1)}$, and the defining integral needs $s > 0$.`, `$t^{s-1}$ と見比べると $s = ${n(e + 1)}$ で、定義の積分には $s > 0$ が必要です。`], [conv ? `Here $s > 0$, so it converges to $\\Gamma(${n(e + 1)})$.` : `Here $s \\le 0$, so the integrand behaves like $t^{${n(e)}}$ near $0$ and the integral diverges, even though the continued $\\Gamma$ may have a finite value.`, conv ? `ここでは $s > 0$ なので $\\Gamma(${n(e + 1)})$ に収束します。` : `ここでは $s \\le 0$ なので、$0$ の近くで被積分関数は $t^{${n(e)}}$ のように振る舞い、積分は発散します。解析接続した $\\Gamma$ が有限値をもつ場合でも同じです。`]],
        };
      }
      const s = r.pick([3, 4, 5, 6, 7, 2.5, 3.5, 4.5]);
      return {
        q: [`$\\Gamma(s) = ${n(G(s), 6)}$ with $s > 2$. Find $s$.`, `$s > 2$ で $\\Gamma(s) = ${n(G(s), 6)}$ です。$s$ を求めてください。`],
        a: { type: 'num', v: s, tol: 0.01 },
        hint: Number.isInteger(s) ? ['Check whether the value is a factorial.', 'この値が階乗かどうか確かめます。'] : ['The value is a rational multiple of $\\sqrt{\\pi}$; compare with $\\Gamma(k + 1/2)$.', 'この値は $\\sqrt{\\pi}$ の有理数倍です。$\\Gamma(k + 1/2)$ と比べます。'],
        sol: [Number.isInteger(s) ? [`${n(G(s), 6)} $= ${fact(s - 1)} = ${s - 1}!$, so $s - 1 = ${s - 1}$.`, `${n(G(s), 6)} $= ${fact(s - 1)} = ${s - 1}!$ なので $s - 1 = ${s - 1}$ です。`] : [`${n(G(s), 6)} $= ${halfTex(s - 0.5)}$, which is $\\Gamma(${argTex(s)})$.`, `${n(G(s), 6)} $= ${halfTex(s - 0.5)}$ で、これは $\\Gamma(${argTex(s)})$ です。`], [`Gamma is increasing for $s > 2$, so the solution is unique: $s = ${n(s)}$.`, `ガンマ関数は $s > 2$ で増加するので解は一意で、$s = ${n(s)}$ です。`]],
      };
    },
  ];

  /* ---------- 2. the Beta function ---------- */
  Q['gamma-beta-beta'] = [
    (r) => {
      if (r.chance(0.6)) {
        const m = r.int(1, 5), k = r.int(1, 5);
        const v = fact(m - 1) * fact(k - 1) / fact(m + k - 1);
        return {
          q: [`Find $B(${m}, ${k}) = \\displaystyle\\int_0^1 ${pw('t', m - 1)}${pw('(1 - t)', k - 1)}\\,dt$.`, `$B(${m}, ${k}) = \\displaystyle\\int_0^1 ${pw('t', m - 1)}${pw('(1 - t)', k - 1)}\\,dt$ を求めてください。`],
          a: numA(v, { show: frac(fact(m - 1) * fact(k - 1), fact(m + k - 1)) }),
          hint: ['At positive integers, $B(m, n) = (m - 1)!\\,(n - 1)!/(m + n - 1)!$.', '正の整数では $B(m, n) = (m - 1)!\\,(n - 1)!/(m + n - 1)!$ です。'],
          sol: [[`$B(${m}, ${k}) = \\dfrac{\\Gamma(${m})\\Gamma(${k})}{\\Gamma(${m + k})} = \\dfrac{${m - 1}!\\,${k - 1}!}{${m + k - 1}!}$.`, `$B(${m}, ${k}) = \\dfrac{\\Gamma(${m})\\Gamma(${k})}{\\Gamma(${m + k})} = \\dfrac{${m - 1}!\\,${k - 1}!}{${m + k - 1}!}$ です。`], [`That is $${frac(fact(m - 1) * fact(k - 1), fact(m + k - 1))}$.`, `これは $${frac(fact(m - 1) * fact(k - 1), fact(m + k - 1))}$ です。`], ['Swapping the two arguments gives the same value, because $t \\mapsto 1 - t$ swaps the factors.', '$t \\mapsto 1 - t$ で二つの因子が入れ替わるので、引数を入れ替えても値は同じです。']],
        };
      }
      const a = r.int(1, 4), b = r.int(1, 4), ga = fact(a - 1), gb = fact(b - 1), gab = fact(a + b - 1);
      return {
        q: [`Given $\\Gamma(${a}) = ${ga}$, $\\Gamma(${b}) = ${gb}$ and $\\Gamma(${a + b}) = ${gab}$, what is $B(${a}, ${b})$?`, `$\\Gamma(${a}) = ${ga}$、$\\Gamma(${b}) = ${gb}$、$\\Gamma(${a + b}) = ${gab}$ が与えられています。$B(${a}, ${b})$ はいくらですか。`],
        a: numA(ga * gb / gab, { show: frac(ga * gb, gab) }),
        hint: ['Use $B(a, b) = \\Gamma(a)\\Gamma(b)/\\Gamma(a + b)$.', '$B(a, b) = \\Gamma(a)\\Gamma(b)/\\Gamma(a + b)$ を使います。'],
        sol: [[`$B(${a}, ${b}) = \\dfrac{${ga}\\cdot ${gb}}{${gab}} = ${frac(ga * gb, gab)}$.`, `$B(${a}, ${b}) = \\dfrac{${ga}\\cdot ${gb}}{${gab}} = ${frac(ga * gb, gab)}$ です。`], ['The total shape parameter $a + b$ sits in the denominator.', '全体の形状パラメータ $a + b$ が分母に入ります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([0.5, 1.5, 2.5]), b = r.pick([0.5, 1.5, 2.5]);
        const v = B(a, b);
        return {
          q: [`Evaluate $B(${argTex(a)}, ${argTex(b)})$. Enter a decimal or an exact value such as $3\\pi/8$.`, `$B(${argTex(a)}, ${argTex(b)})$ を求めてください。小数、または $3\\pi/8$ のような厳密値で答えてください。`],
          a: numA(v),
          hint: ['Write it as $\\Gamma(a)\\Gamma(b)/\\Gamma(a + b)$ and reduce each half-integer Gamma to $\\sqrt{\\pi}$ times a rational.', '$\\Gamma(a)\\Gamma(b)/\\Gamma(a + b)$ と書き、半整数のガンマ値を $\\sqrt{\\pi}$ の有理数倍にそろえます。'],
          sol: [[`$\\Gamma(${argTex(a)}) = ${halfTex(a - 0.5)}$ and $\\Gamma(${argTex(b)}) = ${halfTex(b - 0.5)}$, while $\\Gamma(${argTex(a + b)}) = ${fact(a + b - 1)}$.`, `$\\Gamma(${argTex(a)}) = ${halfTex(a - 0.5)}$、$\\Gamma(${argTex(b)}) = ${halfTex(b - 0.5)}$、$\\Gamma(${argTex(a + b)}) = ${fact(a + b - 1)}$ です。`], [`So $B = ${nice(v) ? nice(v) : n(v, 5)} \\approx ${n(v, 5)}$.`, `したがって $B = ${nice(v) ? nice(v) : n(v, 5)} \\approx ${n(v, 5)}$ です。`], ['The $\\sqrt{\\pi}\\cdot\\sqrt{\\pi}$ in the numerator is why $\\pi$ appears.', '分子の $\\sqrt{\\pi}\\cdot\\sqrt{\\pi}$ が、$\\pi$ が現れる理由です。']],
        };
      }
      if (form === 1) {
        const a = r.int(1, 4), b = r.int(1, 4), L = r.pick([2, 3, 4]);
        const v = L ** (a + b - 1) * fact(a - 1) * fact(b - 1) / fact(a + b - 1);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{${L}} ${pw('x', a - 1)}${pw(`(${L} - x)`, b - 1)}\\,dx$.`, `$\\displaystyle\\int_0^{${L}} ${pw('x', a - 1)}${pw(`(${L} - x)`, b - 1)}\\,dx$ を計算してください。`],
          a: numA(v),
          hint: [`Substitute $x = ${L}t$ to land on $[0, 1]$.`, `$x = ${L}t$ とおいて区間を $[0, 1]$ に直します。`],
          sol: [[`With $x = ${L}t$ the integral becomes $${L}^{${a + b - 1}}\\int_0^1 t^{${a - 1}}(1 - t)^{${b - 1}}\\,dt = ${L}^{${a + b - 1}}B(${a}, ${b})$.`, `$x = ${L}t$ とおくと、積分は $${L}^{${a + b - 1}}\\int_0^1 t^{${a - 1}}(1 - t)^{${b - 1}}\\,dt = ${L}^{${a + b - 1}}B(${a}, ${b})$ になります。`], [`The value is $${L ** (a + b - 1)}\\cdot ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))} = ${n(v, 5)}$.`, `値は $${L ** (a + b - 1)}\\cdot ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))} = ${n(v, 5)}$ です。`], ['The total degree $a + b - 1$ of the integrand plus the length element gives the power of $L$.', '被積分関数の次数と長さ要素を合わせた $a + b - 1$ が $L$ のべきになります。']],
        };
      }
      const a = r.int(2, 4), b = r.int(2, 4), t = r.pick([0.25, 0.5, 0.75]);
      const v = t ** (a - 1) * (1 - t) ** (b - 1) / (fact(a - 1) * fact(b - 1) / fact(a + b - 1));
      return {
        q: [`The Beta density is $f(t) = t^{a-1}(1 - t)^{b-1}/B(a, b)$. For $a = ${a}$, $b = ${b}$, find $f(${n(t)})$. Give four decimals.`, `ベータ分布の密度は $f(t) = t^{a-1}(1 - t)^{b-1}/B(a, b)$ です。$a = ${a}$、$b = ${b}$ のとき $f(${n(t)})$ を小数第4位まで求めてください。`],
        a: { type: 'num', v, tol: 6e-5 },
        hint: [`First get $B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$.`, `まず $B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$ を求めます。`],
        sol: [[`The unnormalized height is $${n(t)}^{${a - 1}}(${n(1 - t)})^{${b - 1}} = ${n(t ** (a - 1) * (1 - t) ** (b - 1), 6)}$.`, `正規化前の高さは $${n(t)}^{${a - 1}}(${n(1 - t)})^{${b - 1}} = ${n(t ** (a - 1) * (1 - t) ** (b - 1), 6)}$ です。`], [`Dividing by $B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$ gives $f(${n(t)}) = ${n(v, 5)}$.`, `$B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$ で割ると $f(${n(t)}) = ${n(v, 5)}$ です。`], ['Dividing by $B$ makes the area under the curve exactly $1$, so $f$ is a probability density.', '$B$ で割ることで曲線の下の面積がちょうど $1$ になり、$f$ は確率密度になります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(1, 4);
        const e = `${fact(m - 1)}/(${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s+${i})`)).join('*')})`;
        return {
          q: [`Write $B(${m}, s)$ as a function of $s > 0$.`, `$B(${m}, s)$ を $s > 0$ の式で表してください。`],
          a: { type: 'expr', v: e, vars: ['s'], lhs: [`$B(${m}, s) =$`, `$B(${m}, s) =$`] },
          hint: [`$B(${m}, s) = \\Gamma(${m})\\Gamma(s)/\\Gamma(s + ${m})$; use the recurrence on $\\Gamma(s + ${m})$.`, `$B(${m}, s) = \\Gamma(${m})\\Gamma(s)/\\Gamma(s + ${m})$ です。$\\Gamma(s + ${m})$ に漸化式を使います。`],
          sol: [[`$\\Gamma(s + ${m}) = ${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}\\,\\Gamma(s)$.`, `$\\Gamma(s + ${m}) = ${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}\\,\\Gamma(s)$ です。`], [`With $\\Gamma(${m}) = ${fact(m - 1)}$ the $\\Gamma(s)$ cancels: $B(${m}, s) = \\dfrac{${fact(m - 1)}}{${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}}$.`, `$\\Gamma(${m}) = ${fact(m - 1)}$ なので $\\Gamma(s)$ が約分され、$B(${m}, s) = \\dfrac{${fact(m - 1)}}{${Array.from({ length: m }, (_, i) => (i === 0 ? 's' : `(s + ${i})`)).join('')}}$ です。`], ['A small integer in the first slot always turns Beta into a rational function.', '第一引数が小さな整数なら、ベータ関数はいつも有理関数になります。']],
        };
      }
      if (form === 1) {
        const a = r.pick([2, 3]), b = r.int(2, 7);
        const K = a === 2 ? b * (b + 1) : b * (b + 1) * (b + 2) / 2;
        return {
          q: [`For which positive integer $b$ is $B(${a}, b) = \\dfrac{1}{${K}}$?`, `$B(${a}, b) = \\dfrac{1}{${K}}$ となる正の整数 $b$ はいくつですか。`],
          a: { type: 'int', v: b },
          hint: [a === 2 ? 'Use $B(2, b) = 1/(b(b + 1))$.' : 'Use $B(3, b) = 2/(b(b + 1)(b + 2))$.', a === 2 ? '$B(2, b) = 1/(b(b + 1))$ を使います。' : '$B(3, b) = 2/(b(b + 1)(b + 2))$ を使います。'],
          sol: [[a === 2 ? `$b(b + 1) = ${K}$.` : `$b(b + 1)(b + 2) = ${2 * K}$.`, a === 2 ? `$b(b + 1) = ${K}$ です。` : `$b(b + 1)(b + 2) = ${2 * K}$ です。`], [`The consecutive-integer product ${a === 2 ? `$${b}\\cdot ${b + 1}$` : `$${b}\\cdot ${b + 1}\\cdot ${b + 2}$`} gives $b = ${b}$.`, `連続する整数の積 ${a === 2 ? `$${b}\\cdot ${b + 1}$` : `$${b}\\cdot ${b + 1}\\cdot ${b + 2}$`} から $b = ${b}$ です。`], ['The product grows quickly with $b$, so the solution is unique.', '積は $b$ とともに急に増えるので、解は一つに決まります。']],
        };
      }
      const a = r.int(2, 4), b = r.int(2, 4);
      const k = a + b - 1;
      return {
        q: [`Write $\\displaystyle\\int_0^{L} ${pw('x', a - 1)}${pw('(L - x)', b - 1)}\\,dx$ as a function of $L > 0$.`, `$\\displaystyle\\int_0^{L} ${pw('x', a - 1)}${pw('(L - x)', b - 1)}\\,dx$ を $L > 0$ の式で表してください。`],
        a: { type: 'expr', v: `${fact(a - 1) * fact(b - 1)}*L^${k}/${fact(a + b - 1)}`, vars: ['L'], lhs: ['$I(L) =$', '$I(L) =$'] },
        hint: ['Substitute $x = Lt$ and pull out the power of $L$.', '$x = Lt$ とおいて、$L$ のべきをくくり出します。'],
        sol: [[`$x = Lt$ gives $L^{${k}}\\int_0^1 t^{${a - 1}}(1 - t)^{${b - 1}}\\,dt = L^{${k}}B(${a}, ${b})$.`, `$x = Lt$ とおくと $L^{${k}}\\int_0^1 t^{${a - 1}}(1 - t)^{${b - 1}}\\,dt = L^{${k}}B(${a}, ${b})$ です。`], [`With $B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$, $I(L) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}L^{${k}}$.`, `$B(${a}, ${b}) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}$ なので $I(L) = ${frac(fact(a - 1) * fact(b - 1), fact(a + b - 1))}L^{${k}}$ です。`], [`The exponent ${k} equals $a + b - 1$: ${a - 1} from $x$, ${b - 1} from $L - x$, and one from $dx$.`, `指数 ${k} は $a + b - 1$ で、$x$ から ${a - 1}、$L - x$ から ${b - 1}、$dx$ から 1 です。`]],
      };
    },
  ];

  /* ---------- 3. recognising the family ---------- */
  Q['gamma-beta-integrals'] = [
    (r) => {
      if (r.chance(0.5)) {
        const m = r.int(0, 5), k = r.int(0, 5);
        const v = 0.5 * B((m + 1) / 2, (k + 1) / 2);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{\\pi/2} ${pw('\\sin', m)}${m === 0 ? '' : '\\theta'}${m === 0 || k === 0 ? '' : '\\,'}${pw('\\cos', k)}${k === 0 ? '' : '\\theta'}\\,d\\theta$. Enter a decimal or an exact value.`, `$\\displaystyle\\int_0^{\\pi/2} ${pw('\\sin', m)}${m === 0 ? '' : '\\theta'}${m === 0 || k === 0 ? '' : '\\,'}${pw('\\cos', k)}${k === 0 ? '' : '\\theta'}\\,d\\theta$ を計算してください。小数でも厳密値でも構いません。`],
          a: numA(v),
          hint: ['Let $t = \\sin^2\\theta$: the integral equals $\\tfrac12 B\\left(\\tfrac{m+1}{2}, \\tfrac{n+1}{2}\\right)$.', '$t = \\sin^2\\theta$ とおくと、積分は $\\tfrac12 B\\left(\\tfrac{m+1}{2}, \\tfrac{n+1}{2}\\right)$ に等しくなります。'],
          sol: [[`The match is $\\tfrac12 B(${argTex((m + 1) / 2)}, ${argTex((k + 1) / 2)})$.`, `一致する形は $\\tfrac12 B(${argTex((m + 1) / 2)}, ${argTex((k + 1) / 2)})$ です。`], [`In Gamma form, $\\dfrac{\\Gamma(${argTex((m + 1) / 2)})\\Gamma(${argTex((k + 1) / 2)})}{2\\,\\Gamma(${argTex((m + k + 2) / 2)})} = ${nice(v) ?? n(v, 5)} \\approx ${n(v, 5)}$.`, `ガンマ関数で書くと $\\dfrac{\\Gamma(${argTex((m + 1) / 2)})\\Gamma(${argTex((k + 1) / 2)})}{2\\,\\Gamma(${argTex((m + k + 2) / 2)})} = ${nice(v) ?? n(v, 5)} \\approx ${n(v, 5)}$ です。`], [m % 2 === 0 && k % 2 === 0 ? 'Both exponents are even, so the answer is a rational multiple of $\\pi$.' : 'At least one exponent is odd, so the answer is rational.', m % 2 === 0 && k % 2 === 0 ? '両方の指数が偶数なので、答えは $\\pi$ の有理数倍です。' : '少なくとも一方の指数が奇数なので、答えは有理数です。']],
        };
      }
      const opts = [[1, 2, 1], [3, 2, 1], [1, 2, 4], [1, 3, 1], [3, 3, 1], [2, 2, 1], [4, 2, 1], [2, 1, 2], [3, 1, 1], [5, 2, 2]];
      const [p, rr, c] = r.pick(opts);
      const v = G(p / rr) / (rr * c ** (p / rr));
      return {
        q: [`Use $\\displaystyle\\int_0^\\infty x^{p-1}e^{-cx^r}\\,dx = \\frac{\\Gamma(p/r)}{r\\,c^{p/r}}$ to evaluate $\\displaystyle\\int_0^\\infty ${pw('x', p - 1)}e^{-${c === 1 ? '' : c}x^{${rr}}}\\,dx$.`, `$\\displaystyle\\int_0^\\infty x^{p-1}e^{-cx^r}\\,dx = \\frac{\\Gamma(p/r)}{r\\,c^{p/r}}$ を使って $\\displaystyle\\int_0^\\infty ${pw('x', p - 1)}e^{-${c === 1 ? '' : c}x^{${rr}}}\\,dx$ を計算してください。`],
        a: numA(v),
        hint: ['Read off $p$, $r$, $c$ from the integrand.', '被積分関数から $p$、$r$、$c$ を読み取ります。'],
        sol: [[`Here $p = ${p}$, $r = ${rr}$, $c = ${c}$, so $p/r = ${frac(p, rr)}$.`, `ここで $p = ${p}$、$r = ${rr}$、$c = ${c}$ なので、$p/r = ${frac(p, rr)}$ です。`], [`The value is $\\dfrac{\\Gamma(${frac(p, rr)})}{${rr}\\cdot ${c}^{${frac(p, rr)}}} \\approx ${n(v, 5)}$.`, `値は $\\dfrac{\\Gamma(${frac(p, rr)})}{${rr}\\cdot ${c}^{${frac(p, rr)}}} \\approx ${n(v, 5)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const opts = [[1, 2, 2], [1, 2, 3], [1, 1, 2], [1, 1, 3], [1, 1, 4], [2, 2, 2], [2, 1, 3], [3, 2, 3], [1, 2, 4]];
        const [p, rr, q] = r.pick(opts);
        const v = B(p / rr, q - p / rr) / rr;
        return {
          q: [`Evaluate $\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{(1 + x^{${rr}})^{${q}}}\\,dx$ using $\\displaystyle\\int_0^\\infty \\frac{x^{p-1}}{(1 + x^r)^q}\\,dx = \\frac{1}{r}B\\!\\left(\\frac{p}{r},\\ q - \\frac{p}{r}\\right)$.`.replace('x^{0}', '1'), `$\\displaystyle\\int_0^\\infty \\frac{x^{p-1}}{(1 + x^r)^q}\\,dx = \\frac{1}{r}B\\!\\left(\\frac{p}{r},\\ q - \\frac{p}{r}\\right)$ を使って、$\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{(1 + x^{${rr}})^{${q}}}\\,dx$ を計算してください。`.replace('x^{0}', '1')],
          a: numA(v),
          hint: ['Substitute $t = x^r/(1 + x^r)$ or match directly with the formula; read off $p$, $r$, $q$.', '$t = x^r/(1 + x^r)$ と置くか、公式と直接見比べて $p$、$r$、$q$ を読み取ります。'],
          sol: [[`Here $p = ${p}$, $r = ${rr}$, $q = ${q}$, so $p/r = ${frac(p, rr)}$ and $q - p/r = ${frac(q * rr - p, rr)}$.`, `ここで $p = ${p}$、$r = ${rr}$、$q = ${q}$ なので、$p/r = ${frac(p, rr)}$、$q - p/r = ${frac(q * rr - p, rr)}$ です。`], [`The value is $\\tfrac{1}{${rr}}B(${frac(p, rr)}, ${frac(q * rr - p, rr)}) = ${nice(v) ?? n(v, 5)} \\approx ${n(v, 5)}$.`, `値は $\\tfrac{1}{${rr}}B(${frac(p, rr)}, ${frac(q * rr - p, rr)}) = ${nice(v) ?? n(v, 5)} \\approx ${n(v, 5)}$ です。`], [`Convergence needs $0 < p < rq$, here $0 < ${p} < ${rr * q}$.`, `収束には $0 < p < rq$ が必要で、ここでは $0 < ${p} < ${rr * q}$ です。`]],
        };
      }
      if (form === 1) {
        const p = r.int(1, 4), qq = r.int(1, 4);
        const v = G(qq) / p ** qq;
        return {
          q: [`Evaluate $\\displaystyle\\int_0^1 ${pw('x', p - 1)}${pw('(-\\ln x)', qq - 1)}\\,dx$.`, `$\\displaystyle\\int_0^1 ${pw('x', p - 1)}${pw('(-\\ln x)', qq - 1)}\\,dx$ を計算してください。`],
          a: numA(v, { show: frac(fact(qq - 1), p ** qq) }),
          hint: ['Let $t = -\\ln x$, so $x = e^{-t}$ and $dx = -e^{-t}dt$.', '$t = -\\ln x$ とおくと $x = e^{-t}$、$dx = -e^{-t}dt$ です。'],
          sol: [[`The integral becomes $\\int_0^\\infty ${pw('t', qq - 1)}e^{-${p === 1 ? '' : p}t}\\,dt$.`, `積分は $\\int_0^\\infty ${pw('t', qq - 1)}e^{-${p === 1 ? '' : p}t}\\,dt$ になります。`], [`That is $\\Gamma(${qq})/${p}^{${qq}} = ${frac(fact(qq - 1), p ** qq)}$.`, `これは $\\Gamma(${qq})/${p}^{${qq}} = ${frac(fact(qq - 1), p ** qq)}$ です。`], ['The logarithm turns the interval $(0, 1]$ into a half-line, where the exponential form of Gamma applies.', '対数によって区間 $(0, 1]$ が半直線に移り、ガンマ関数の指数型の積分が使えます。']],
        };
      }
      const rr = r.pick([2, 3, 4, 5, 6]), p = r.int(1, rr - 1);
      const v = PI / (rr * Math.sin(PI * p / rr));
      return {
        q: [`Evaluate $\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{1 + x^{${rr}}}\\,dx$. Give four decimals.`.replace('x^{0}', '1'), `$\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{1 + x^{${rr}}}\\,dx$ を計算してください（小数第4位まで）。`.replace('x^{0}', '1')],
        a: { type: 'num', v, tol: 6e-5, ...(nice(v) ? { show: nice(v) } : {}) },
        hint: ['This is $\\tfrac1r B(p/r,\\ 1 - p/r)$, and $\\Gamma(z)\\Gamma(1 - z) = \\pi/\\sin(\\pi z)$.', 'これは $\\tfrac1r B(p/r,\\ 1 - p/r)$ で、$\\Gamma(z)\\Gamma(1 - z) = \\pi/\\sin(\\pi z)$ を使います。'],
        sol: [[`With $p = ${p}$, $r = ${rr}$ the Beta form is $\\tfrac{1}{${rr}} B(${frac(p, rr)}, ${frac(rr - p, rr)})$, and $\\Gamma(${frac(p, rr)})\\Gamma(${frac(rr - p, rr)}) = \\pi/\\sin(${frac(p, rr)}\\pi)$.`, `$p = ${p}$、$r = ${rr}$ のときベータ関数の形は $\\tfrac{1}{${rr}} B(${frac(p, rr)}, ${frac(rr - p, rr)})$ で、$\\Gamma(${frac(p, rr)})\\Gamma(${frac(rr - p, rr)}) = \\pi/\\sin(${frac(p, rr)}\\pi)$ です。`], [`So the value is $\\dfrac{\\pi}{${rr}\\sin(${frac(p, rr)}\\pi)} \\approx ${n(v, 5)}$.`, `したがって値は $\\dfrac{\\pi}{${rr}\\sin(${frac(p, rr)}\\pi)} \\approx ${n(v, 5)}$ です。`], ['The reflection formula turns a Beta integral with complementary arguments into a plain sine.', '反転公式により、補い合う引数をもつベータ積分が単なる正弦で表されます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(0, 4), k = r.int(0, 4);
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{\\pi/2} \\sin^{${2 * m + 1}}\\theta\\,\\cos^{${2 * k + 1}}\\theta\\,d\\theta$ as an exact fraction.`, `$\\displaystyle\\int_0^{\\pi/2} \\sin^{${2 * m + 1}}\\theta\\,\\cos^{${2 * k + 1}}\\theta\\,d\\theta$ を既約分数で求めてください。`],
          a: numA(fact(m) * fact(k) / (2 * fact(m + k + 1)), { show: frac(fact(m) * fact(k), 2 * fact(m + k + 1)) }),
          hint: ['With odd exponents $2m + 1$ and $2k + 1$, the Beta arguments are integers $m + 1$ and $k + 1$.', '奇数の指数 $2m + 1$、$2k + 1$ では、ベータ関数の引数は整数 $m + 1$、$k + 1$ になります。'],
          sol: [[`The integral equals $\\tfrac12 B(${m + 1}, ${k + 1})$.`, `積分は $\\tfrac12 B(${m + 1}, ${k + 1})$ に等しくなります。`], [`$B(${m + 1}, ${k + 1}) = \\dfrac{${m}!\\,${k}!}{${m + k + 1}!}$, so the integral is $${frac(fact(m) * fact(k), 2 * fact(m + k + 1))}$.`, `$B(${m + 1}, ${k + 1}) = \\dfrac{${m}!\\,${k}!}{${m + k + 1}!}$ なので、積分は $${frac(fact(m) * fact(k), 2 * fact(m + k + 1))}$ です。`], ['Odd powers also admit the substitution $u = \\cos\\theta$, which gives the same rational number.', '奇数べきなら $u = \\cos\\theta$ の置換でも同じ有理数が得られます。']],
        };
      }
      if (form === 1) {
        const p = r.int(1, 8), rr = r.int(1, 5), q = r.int(1, 4);
        const conv = p < rr * q;
        return {
          q: [`Does $\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{(1 + x^{${rr}})^{${q}}}\\,dx$ converge?`, `$\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{(1 + x^{${rr}})^{${q}}}\\,dx$ は収束しますか。`],
          a: { type: 'choice', opts: [YN('Yes, it converges', 'はい、収束する'), YN('No, it diverges', 'いいえ、発散する')], v: conv ? 0 : 1, fixed: true },
          hint: ['Compare the integrand with powers of $x$ at infinity: it behaves like $x^{p - 1 - rq}$.', '無限遠での被積分関数を $x$ のべきと比べます。$x^{p - 1 - rq}$ のように振る舞います。'],
          sol: [[`At infinity the integrand behaves like $x^{${p - 1 - rr * q}}$; at $0$ like $x^{${p - 1}}$, which is fine for $p = ${p} > 0$.`, `無限遠では被積分関数は $x^{${p - 1 - rr * q}}$、$0$ の近くでは $x^{${p - 1}}$ のように振る舞い、後者は $p = ${p} > 0$ なので問題ありません。`], [`Convergence needs $p < rq$, i.e. $${p} < ${rr * q}$: ${conv ? 'true' : 'false'}.`, `収束には $p < rq$、つまり $${p} < ${rr * q}$ が必要で、これは${conv ? '成り立ちます' : '成り立ちません'}。`], ['The Beta formula applies exactly when the integral converges: both arguments $p/r$ and $q - p/r$ must be positive.', 'ベータ関数の公式が使えるのは積分が収束するときだけで、二つの引数 $p/r$ と $q - p/r$ がともに正である必要があります。']],
        };
      }
      const rr = r.pick([2, 3, 4, 6]), p = r.int(1, rr - 1);
      return {
        q: [`Write $\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{1 + x^{${rr}}}\\,dx$ in closed form with a sine, then give its value to four decimals.`.replace('x^{0}', '1'), `$\\displaystyle\\int_0^\\infty \\frac{${pw('x', p - 1) || '1'}}{1 + x^{${rr}}}\\,dx$ を正弦を使った閉じた形で表し、その値を小数第4位まで求めてください。`.replace('x^{0}', '1')],
        a: { type: 'num', v: PI / (rr * Math.sin(PI * p / rr)), tol: 6e-5 },
        hint: ['Use $\\pi/(r\\sin(\\pi p/r))$, valid for $0 < p < r$.', '$0 < p < r$ で成り立つ $\\pi/(r\\sin(\\pi p/r))$ を使います。'],
        sol: [[`With $p = ${p}$, $r = ${rr}$ the formula gives $\\dfrac{\\pi}{${rr}\\sin(${frac(p, rr)}\\pi)}$.`, `$p = ${p}$、$r = ${rr}$ では公式から $\\dfrac{\\pi}{${rr}\\sin(${frac(p, rr)}\\pi)}$ となります。`], [`Numerically, $\\sin(${frac(p, rr)}\\pi) = ${n(Math.sin(PI * p / rr), 5)}$, so the value is ${n(PI / (rr * Math.sin(PI * p / rr)), 5)}.`, `数値では $\\sin(${frac(p, rr)}\\pi) = ${n(Math.sin(PI * p / rr), 5)}$ なので、値は ${n(PI / (rr * Math.sin(PI * p / rr)), 5)} です。`], ['Replacing $p$ by $r - p$ gives the same value, since the sine is symmetric about $\\pi/2$.', '$p$ を $r - p$ に替えても、正弦が $\\pi/2$ について対称なので値は同じです。']],
      };
    },
  ];
})();
