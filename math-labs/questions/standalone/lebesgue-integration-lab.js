'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const YN = (en, ja) => [en, ja];

  /* ---------- 1. simple functions: height times measure ---------- */
  Q['lebesgue-integration-lab-simple'] = [
    (r) => {
      if (r.chance(0.55)) {
        const h = [r.step(0, 8, 0.5), r.step(0, 8, 0.5), r.step(0, 8, 0.5)], tot = h[0] + h[1] + h[2];
        return {
          q: [`A simple function takes the value $${n(h[0])}$ on $[0, 1)$, $${n(h[1])}$ on $[1, 2)$ and $${n(h[2])}$ on $[2, 3]$. What is its Lebesgue integral over $[0, 3]$?`, `単関数は $[0, 1)$ で $${n(h[0])}$、$[1, 2)$ で $${n(h[1])}$、$[2, 3]$ で $${n(h[2])}$ をとります。$[0, 3]$ でのルベーグ積分はいくらですか。`],
          a: { type: 'num', v: tot },
          hint: ['Multiply each height by the measure of its set, then add.', '各高さにその集合の測度を掛けて足します。'],
          sol: [[`The three sets have measure $1$ each (a single endpoint has measure $0$).`, '三つの集合の測度はどれも $1$ です（一点の測度は $0$）。'], [`$\\int s\\,d\\mu = ${n(h[0])}\\cdot 1 + ${n(h[1])}\\cdot 1 + ${n(h[2])}\\cdot 1 = ${n(tot)}$.`, `$\\int s\\,d\\mu = ${n(h[0])}\\cdot 1 + ${n(h[1])}\\cdot 1 + ${n(h[2])}\\cdot 1 = ${n(tot)}$ です。`], ['This is exactly the formula the calculator beneath the lab evaluates.', 'これは実験の下の計算機が評価している式そのものです。']],
          set: { h1: h[0], h2: h[1], h3: h[2] },
        };
      }
      const L = [r.pick([0.5, 1, 1.5, 2]), r.pick([0.5, 1, 2, 3]), r.pick([0.5, 1, 1.5])], a = [r.int(1, 6), r.int(1, 6), r.int(1, 6)];
      const tot = a[0] * L[0] + a[1] * L[1] + a[2] * L[2];
      return {
        q: [`A simple function equals $${a[0]}$ on a set of measure $${n(L[0])}$, $${a[1]}$ on a set of measure $${n(L[1])}$ and $${a[2]}$ on a set of measure $${n(L[2])}$ (the sets are disjoint). What is $\\int s\\,d\\mu$?`, `単関数は、測度 $${n(L[0])}$ の集合上で $${a[0]}$、測度 $${n(L[1])}$ の集合上で $${a[1]}$、測度 $${n(L[2])}$ の集合上で $${a[2]}$ をとります（集合は互いに素です）。$\\int s\\,d\\mu$ はいくらですか。`],
        a: { type: 'num', v: tot },
        hint: ['The definition is $\\int s\\,d\\mu = \\sum_k a_k\\,\\mu(E_k)$.', '定義は $\\int s\\,d\\mu = \\sum_k a_k\\,\\mu(E_k)$ です。'],
        sol: [[`$\\sum_k a_k\\mu(E_k) = ${a[0]}\\cdot ${n(L[0])} + ${a[1]}\\cdot ${n(L[1])} + ${a[2]}\\cdot ${n(L[2])}$.`, `$\\sum_k a_k\\mu(E_k) = ${a[0]}\\cdot ${n(L[0])} + ${a[1]}\\cdot ${n(L[1])} + ${a[2]}\\cdot ${n(L[2])}$ です。`], [`That equals ${n(tot)}.`, `これは ${n(tot)} に等しくなります。`], ['The sets need not be intervals; only their measures enter.', '集合は区間である必要はなく、測度だけが関与します。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([1, 2, 3, 4]), h = r.pick([0.25, 0.5, 1]);
        // f(x) = x on [0, c], rounded down to multiples of h
        let tot = 0, k = 0;
        while (k * h < c) { const lo = k * h, hi = Math.min((k + 1) * h, c); tot += lo * (hi - lo); k++; }
        return {
          q: [`Take $f(x) = x$ on $[0, ${c}]$ and round it down to multiples of $${n(h)}$, so $s = ${n(h)}\\lfloor x/${n(h)}\\rfloor$. What is $\\int s\\,d\\mu$?`, `$[0, ${c}]$ 上の $f(x) = x$ を $${n(h)}$ の倍数に切り下げた単関数 $s = ${n(h)}\\lfloor x/${n(h)}\\rfloor$ を考えます。$\\int s\\,d\\mu$ を求めてください。`],
          a: { type: 'num', v: tot, show: frac(Math.round(tot * 64), 64) },
          hint: ['Each value $j h$ is taken on a set of length $h$; add $jh \\cdot h$ over the levels.', '各値 $jh$ は長さ $h$ の集合上でとられます。各段で $jh \\cdot h$ を足します。'],
          sol: [[`The levels are $0, ${n(h)}, ${n(2 * h)}, \\ldots, ${n(c - h)}$, each on a set of measure $${n(h)}$.`, `段は $0, ${n(h)}, ${n(2 * h)}, \\ldots, ${n(c - h)}$ で、それぞれ測度 $${n(h)}$ の集合上でとられます。`], [`$\\int s\\,d\\mu = ${n(h)}\\cdot ${n(h)}\\,(0 + 1 + \\cdots + ${Math.round(c / h) - 1}) = ${n(tot)}$.`, `$\\int s\\,d\\mu = ${n(h)}\\cdot ${n(h)}\\,(0 + 1 + \\cdots + ${Math.round(c / h) - 1}) = ${n(tot)}$ です。`], [`The true integral is $${n(c * c / 2)}$; the shortfall is $${n(c * c / 2 - tot)} = ${n(h)}\\cdot ${c}/2$, the width of a band times half the domain.`, `真の積分は $${n(c * c / 2)}$ で、不足分は $${n(c * c / 2 - tot)} = ${n(h)}\\cdot ${c}/2$ です。帯の幅×定義域の半分に等しくなっています。`]],
        };
      }
      if (form === 1) {
        const v = r.int(2, 9), w = r.int(1, 9) * (r.chance(0.5) ? 1 : -1), Lg = r.pick([1, 2, 3, 5, 10]), kind = r.int(0, 1);
        return {
          q: [kind === 0 ? `On $[0, ${Lg}]$ let $g = ${v}$ everywhere except at the single point $x = 1/2$, where $g = ${w}$. What is $\\int_0^{${Lg}} g\\,d\\mu$?` : `On $[0, ${Lg}]$ let $g = ${v}$ except on the finite set $\\{1/2, 1/3, 1/4\\}$, where $g = ${w}$. What is $\\int_0^{${Lg}} g\\,d\\mu$?`, kind === 0 ? `$[0, ${Lg}]$ 上で、一点 $x = 1/2$ だけ $g = ${w}$、それ以外では $g = ${v}$ とします。$\\int_0^{${Lg}} g\\,d\\mu$ はいくらですか。` : `$[0, ${Lg}]$ 上で、有限集合 $\\{1/2, 1/3, 1/4\\}$ だけ $g = ${w}$、それ以外では $g = ${v}$ とします。$\\int_0^{${Lg}} g\\,d\\mu$ はいくらですか。`],
          a: { type: 'num', v: v * Lg },
          hint: ['Finite sets have Lebesgue measure zero.', '有限集合のルベーグ測度は $0$ です。'],
          sol: [['A finite set is null, so changing $g$ on it does not change the integral.', '有限集合は零集合なので、そこで $g$ を変えても積分は変わりません。'], [`$\\int g\\,d\\mu = ${v}\\cdot ${Lg} + (${w})\\cdot 0 = ${v * Lg}$.`, `$\\int g\\,d\\mu = ${v}\\cdot ${Lg} + (${w})\\cdot 0 = ${v * Lg}$ です。`], ['The lab says the same in its note: changing endpoints does not alter the answer.', '実験の注記にあるとおり、端点を変えても答えは変わりません。']],
        };
      }
      const h = r.step(0, 8, 0.5), g = r.step(0, 8, 0.5), t3 = r.step(0.5, 6, 0.5);
      const tot = h + g + t3;
      return {
        q: [`The heights on $[0, 1)$ and $[1, 2)$ are $${n(h)}$ and $${n(g)}$. What height on $[2, 3]$ makes the integral over $[0, 3]$ equal to $${n(tot)}$?`, `$[0, 1)$ と $[1, 2)$ での高さが $${n(h)}$ と $${n(g)}$ です。$[0, 3]$ での積分が $${n(tot)}$ になるには、$[2, 3]$ での高さをいくつにすればよいですか。`],
        a: { type: 'num', v: t3 },
        hint: ['Write the total as a sum of height times measure and solve for the unknown height.', '全体を高さ×測度の和で書き、未知の高さについて解きます。'],
        sol: [[`$${n(h)}\\cdot 1 + ${n(g)}\\cdot 1 + x\\cdot 1 = ${n(tot)}$.`, `$${n(h)}\\cdot 1 + ${n(g)}\\cdot 1 + x\\cdot 1 = ${n(tot)}$ です。`], [`So $x = ${n(tot)} - ${n(h + g)} = ${n(t3)}$.`, `したがって $x = ${n(tot)} - ${n(h + g)} = ${n(t3)}$ です。`]],
        set: { h1: h, h2: g, h3: t3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 6), b = r.int(1, 6);
        return {
          q: [`A simple function equals $${a}$ on $[0, t)$ and $${b}$ on $[t, 3]$, with $0 < t < 3$. Write $\\int_0^3 s\\,d\\mu$ as a function of $t$.`, `単関数 $s$ は $[0, t)$ で $${a}$、$[t, 3]$ で $${b}$ をとります（$0 < t < 3$）。$\\int_0^3 s\\,d\\mu$ を $t$ の式で表してください。`],
          a: { type: 'expr', v: `${a}*t+${b}*(3-t)`, vars: ['t'], dom: { t: [0.3, 2.7] }, lhs: ['$\\int_0^3 s\\,d\\mu =$', '$\\int_0^3 s\\,d\\mu =$'] },
          hint: ['The two sets have measures $t$ and $3 - t$.', '二つの集合の測度は $t$ と $3 - t$ です。'],
          sol: [[`$\\mu([0, t)) = t$ and $\\mu([t, 3]) = 3 - t$.`, `$\\mu([0, t)) = t$、$\\mu([t, 3]) = 3 - t$ です。`], [`$\\int s\\,d\\mu = ${a === 1 ? '' : a}t + ${b}(3 - t) = ${a - b === 0 ? '' : n(a - b) + 't + '}${3 * b}$.`, `$\\int s\\,d\\mu = ${a === 1 ? '' : a}t + ${b}(3 - t) = ${a - b === 0 ? '' : n(a - b) + 't + '}${3 * b}$ です。`], [`It is linear in $t$ with slope $${n(a - b)}$: moving the boundary right gives more length to the ${a >= b ? 'taller' : 'shorter'} piece.`, `$t$ について傾き $${n(a - b)}$ の一次式です。境界を右へ動かすと、${a >= b ? '高い' : '低い'}ほうの部分の長さが増えます。`]],
        };
      }
      if (form === 1) {
        const a = r.int(2, 9);
        return {
          q: [`Let $s = ${a}$ on $\\mathbb{Q} \\cap [0, 1]$ and $s = 0$ elsewhere in $[0, 1]$. What is $\\int_0^1 s\\,d\\mu$, and is $s$ a simple function?`, `$[0, 1]$ の有理数で $s = ${a}$、それ以外で $s = 0$ とします。$\\int_0^1 s\\,d\\mu$ を求め、$s$ が単関数かどうか答えてください。`],
          a: { type: 'choice', opts: [YN('Integral $0$; yes, a simple function (a measurable set times a constant)', '積分は $0$。単関数（可測集合と定数の積）である'), YN(`Integral $${a}$; not simple, since $\\mathbb{Q}$ is dense`, `積分は $${a}$。$\\mathbb{Q}$ が稠密なので単関数ではない`), YN('Integral $0$; not a simple function, because its set is not an interval', '積分は $0$。集合が区間でないので単関数ではない'), YN(`The integral does not exist`, '積分は存在しない')], v: 0, fixed: true },
          hint: ['A simple function is a finite combination of indicators of measurable sets, not necessarily intervals.', '単関数は可測集合の指示関数の有限和で、区間である必要はありません。'],
          sol: [[`$s = ${a}\\cdot\\mathbf{1}_{\\mathbb{Q} \\cap [0,1]}$ and $\\mathbb{Q} \\cap [0,1]$ is measurable.`, `$s = ${a}\\cdot\\mathbf{1}_{\\mathbb{Q} \\cap [0,1]}$ で、$\\mathbb{Q} \\cap [0,1]$ は可測です。`], ['Its measure is $0$ (countable), so $\\int s\\,d\\mu = a\\cdot 0 = 0$.', '測度は $0$（可算集合）なので、$\\int s\\,d\\mu = a\\cdot 0 = 0$ です。'], ['This is the Dirichlet function scaled: easy for Lebesgue, impossible for Riemann.', 'これはディリクレ関数の定数倍で、ルベーグには簡単でもリーマンには不可能です。']],
        };
      }
      const k = r.int(2, 6), c = r.int(2, 5);
      return {
        q: [`The function $f(x) = x/${c}$ on $[0, ${c}]$ takes values in $[0, 1]$. Cut the value range into $${k}$ equal bands $[j/${k}, (j + 1)/${k})$ and let $s$ equal the band's lower value $j/${k}$ on its preimage. What is $\\int s\\,d\\mu$? (The top value $1$ is taken only at $x = ${c}$.)`, `$[0, ${c}]$ 上の関数 $f(x) = x/${c}$ の値は $[0, 1]$ にあります。値域を $${k}$ 等分した帯 $[j/${k}, (j + 1)/${k})$ を考え、$s$ は各帯の逆像上で下端の値 $j/${k}$ をとるとします。$\\int s\\,d\\mu$ を求めてください（最大値 $1$ は $x = ${c}$ の一点でのみとられます）。`],
        a: { type: 'num', v: c * (k - 1) / (2 * k), show: frac(c * (k - 1), 2 * k) },
        hint: ['Each preimage is an interval of length $' + c + '/' + k + '$; sum $\\frac{j}{' + k + '} \\cdot \\frac{' + c + '}{' + k + '}$ over $j = 0, \\ldots, ' + (k - 1) + '$.', '各逆像は長さ $' + c + '/' + k + '$ の区間です。$j = 0, \\ldots, ' + (k - 1) + '$ について $\\frac{j}{' + k + '} \\cdot \\frac{' + c + '}{' + k + '}$ を足します。'],
        sol: [[`Each band $[j/${k}, (j + 1)/${k})$ has preimage $[${n(c * 1)}j/${k}, ${n(c)}(j+1)/${k})$ of length $${c}/${k}$.`, `各帯 $[j/${k}, (j + 1)/${k})$ の逆像は長さ $${c}/${k}$ の区間です。`], [`$\\int s\\,d\\mu = \\frac{${c}}{${k}^2}\\sum_{j=0}^{${k - 1}} j = \\frac{${c}\\cdot ${k - 1}}{${2 * k}} = ${n(c * (k - 1) / (2 * k), 5)}$.`, `$\\int s\\,d\\mu = \\frac{${c}}{${k}^2}\\sum_{j=0}^{${k - 1}} j = \\frac{${c}\\cdot ${k - 1}}{${2 * k}} = ${n(c * (k - 1) / (2 * k), 5)}$ です。`], [`The true integral is $${n(c / 2)}$, and the lower sum falls short by $${c}/${2 * k} \\le ${c}/${k}$, the band width times the domain length.`, `真の積分は $${n(c / 2)}$ で、下からの和の不足分は $${c}/${2 * k} \\le ${c}/${k}$ です。帯の幅×定義域の長さ以内に収まっています。`]],
      };
    },
  ];

  /* ---------- 2. convergence theorems ---------- */
  Q['lebesgue-integration-lab-limits'] = [
    (r) => {
      if (r.chance(0.5)) {
        const m = r.int(1, 12);
        return {
          q: [`The powers $f_n(x) = x^n$ stay below the integrable function $1$ on $[0, 1]$. What is $\\int_0^1 f_n\\,d\\mu$ for $n = ${m}$?`, `べき乗 $f_n(x) = x^n$ は $[0, 1]$ で可積分な関数 $1$ の下にとどまります。$n = ${m}$ のときの $\\int_0^1 f_n\\,d\\mu$ を求めてください。`],
          a: { type: 'num', v: 1 / (m + 1), show: frac(1, m + 1) },
          hint: ['Power rule.', 'べき乗の積分公式です。'],
          sol: [[`$\\int_0^1 x^{${m}}\\,dx = \\dfrac{1}{${m + 1}}$.`, `$\\int_0^1 x^{${m}}\\,dx = \\dfrac{1}{${m + 1}}$ です。`], ['These tend to $0 = \\int 0\\,d\\mu$, so the limit passes through the integral.', 'これらは $0 = \\int 0\\,d\\mu$ に収束するので、極限は積分の中に入ります。']],
        };
      }
      const m = r.int(2, 15), c = r.pick([1, 2, 3, 5]);
      return {
        q: [`The moving spike is $f_n = ${c === 1 ? '' : c}n\\cdot\\mathbf{1}_{(0, 1/n)}$. At $n = ${m}$, what are its height and its integral? Enter the integral.`, `動くスパイクは $f_n = ${c === 1 ? '' : c}n\\cdot\\mathbf{1}_{(0, 1/n)}$ です。$n = ${m}$ のときの高さと積分を考え、積分の値を答えてください。`],
        a: { type: 'num', v: c },
        hint: ['Height times the length $1/n$.', '高さ×長さ $1/n$ です。'],
        sol: [[`The height is $${c * m}$ and the base has length $1/${m}$.`, `高さは $${c * m}$、底辺の長さは $1/${m}$ です。`], [`The integral is $${c * m}/${m} = ${c}$ for every $n$.`, `積分は $${c * m}/${m} = ${c}$ で、どの $n$ でも同じです。`], ['Every integral stays at the same value while the pointwise limit is $0$: that is what the lab flags as a warning.', 'どの積分も同じ値のままなのに各点での極限は $0$ です。これが実験で警告として示されている点です。']],
      };
    },
    (r) => {
      const items = [
        { f: 'f_n = \\min(f, n) \\text{ for } f(x) = x^{-1/2} \\text{ on } (0, 1]', k: 1, w: ['the truncations $\\min(f, n)$ increase to $f$ and are nonnegative: monotone convergence, in the lab\'s first panel', '切り詰め $\\min(f, n)$ は非負で $f$ に増加するので単調収束定理です（実験の最初のパネル）'] },
        { f: 'f_n(x) = x^n \\text{ on } [0, 1]', k: 0, w: ['all $|f_n| \\le 1$, an integrable bound that works for every $n$, as in the lab\'s second panel', 'すべて $|f_n| \\le 1$ で、どの $n$ にも通用する可積分な上界があります（実験の二番目のパネル）'] },
        { f: 'f_n = n\\,\\mathbf{1}_{(0, 1/n)}', k: 2, w: ['no single integrable function bounds every spike, and the sequence is not increasing', 'すべてのスパイクを押さえる単一の可積分関数はなく、数列も増加ではありません'] },
        { f: 'f_n(x) = \\dfrac{\\sin(nx)}{n} \\text{ on } [0, \\pi]', k: 0, w: ['$|f_n| \\le 1$ and $f_n \\to 0$ pointwise, so dominated convergence applies', '$|f_n| \\le 1$ かつ $f_n \\to 0$ なので優収束定理が使えます'] },
        { f: 'f_n = \\mathbf{1}_{[n, n+1]} \\text{ on } \\mathbb{R}', k: 2, w: ['the sequence is not increasing and any bound would have to be $1$ on all of $[1, \\infty)$', '数列は増加でなく、優関数は $[1, \\infty)$ 全体で $1$ でなければならなくなります'] },
      ];
      const it = r.pick(items);
      return {
        q: [`Which result controls the limit of $\\int f_n\\,d\\mu$ for $${it.f}$?`, `$${it.f}$ について、$\\int f_n\\,d\\mu$ の極限を制御する結果はどれですか。`],
        a: { type: 'choice', opts: [YN('Dominated convergence', '優収束定理'), YN('Monotone convergence', '単調収束定理'), YN('Neither one applies', 'どちらも使えない')], v: it.k, fixed: true },
        hint: ['Ask: is the sequence increasing and nonnegative, or is there one integrable bound for all $n$?', '数列は非負で増加か、またはすべての $n$ に共通の可積分な上界があるかを調べます。'],
        sol: [[`Here ${it.w[0]}.`, `この場合、${it.w[1]}。`], ['Pointwise convergence alone is never enough: the extra hypothesis is what lets the limit pass through the integral.', '各点収束だけでは不十分です。極限を積分に通すには追加の仮定が必要です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['Let $f(x) = x^{-1/2}$ on $(0, 1]$ and $f_n = \\min(f, n)$. Find $\\int_0^1 f_n\\,d\\mu$ as a function of $n$. (On $(0, 1/n^2]$ the function equals $n$; elsewhere it equals $x^{-1/2}$.)', '$(0, 1]$ 上で $f(x) = x^{-1/2}$、$f_n = \\min(f, n)$ とします。$\\int_0^1 f_n\\,d\\mu$ を $n$ の式で求めてください（$(0, 1/n^2]$ では $f_n = n$、それ以外では $x^{-1/2}$ です）。'],
          a: { type: 'expr', v: '2-1/n', vars: ['n'], dom: { n: [1, 6] }, lhs: ['$\\int_0^1 f_n\\,d\\mu =$', '$\\int_0^1 f_n\\,d\\mu =$'] },
          hint: ['Split at $x = 1/n^2$ and integrate each piece.', '$x = 1/n^2$ で分けてそれぞれ積分します。'],
          sol: [['On $(0, 1/n^2]$: $n\\cdot n^{-2} = 1/n$. On $[1/n^2, 1]$: $\\int x^{-1/2}\\,dx = 2 - 2/n$.', '$(0, 1/n^2]$ では $n\\cdot n^{-2} = 1/n$。$[1/n^2, 1]$ では $\\int x^{-1/2}\\,dx = 2 - 2/n$ です。'], ['Adding: $\\int f_n\\,d\\mu = 2 - 1/n$.', '足すと $\\int f_n\\,d\\mu = 2 - 1/n$ です。'], ['This increases to $2 = \\int f\\,d\\mu$, exactly as monotone convergence says.', 'これは $2 = \\int f\\,d\\mu$ に増加し、単調収束定理のとおりです。']],
        };
      }
      if (form === 1) {
        const d = r.pick([0.1, 0.05, 0.02, 0.01, 0.004]);
        const N = Math.floor(1 / d + 1e-9) + 1;
        return {
          q: [`With $f_n = \\min(x^{-1/2}, n)$ on $(0, 1]$ we have $\\int f_n\\,d\\mu = 2 - 1/n$. What is the smallest $n$ with $\\int f_n\\,d\\mu > ${n(2 - d)}$?`, `$(0, 1]$ 上の $f_n = \\min(x^{-1/2}, n)$ では $\\int f_n\\,d\\mu = 2 - 1/n$ です。$\\int f_n\\,d\\mu > ${n(2 - d)}$ となる最小の $n$ を求めてください。`],
          a: { type: 'int', v: N },
          hint: ['Rewrite the inequality as $1/n < d$.', '不等式を $1/n < d$ の形にします。'],
          sol: [[`$2 - 1/n > ${n(2 - d)}$ means $1/n < ${n(d)}$, so $n > ${n(1 / d)}$.`, `$2 - 1/n > ${n(2 - d)}$ は $1/n < ${n(d)}$、つまり $n > ${n(1 / d)}$ のことです。`], [`The smallest such integer is $${N}$.`, `これを満たす最小の整数は $${N}$ です。`], ['The integrals climb to $2$ but never reach it for finite $n$, which is why we need the limit theorem.', '積分は $2$ に近づきますが、有限の $n$ では届きません。そのため極限の定理が必要になります。']],
        };
      }
      const c = r.pick([2, 3, 4, 5, 6, 8]), M = r.pick([3, 5, 10]);
      const tot = c * M;
      return {
        q: [`Let $f_n = ${c}\\,\\mathbf{1}_{[0,\\,${M}(1 - 1/n)]}$. These increase to $${c}\\,\\mathbf{1}_{[0,\\,${M})}$. What is $\\lim_{n\\to\\infty}\\int f_n\\,d\\mu$?`, `$f_n = ${c}\\,\\mathbf{1}_{[0,\\,${M}(1 - 1/n)]}$ とします。これは $${c}\\,\\mathbf{1}_{[0,\\,${M})}$ に増加します。$\\lim_{n\\to\\infty}\\int f_n\\,d\\mu$ を求めてください。`],
        a: { type: 'num', v: tot },
        hint: ['Monotone convergence lets you integrate the limit function instead.', '単調収束定理により、極限関数を積分すれば済みます。'],
        sol: [[`$\\int f_n\\,d\\mu = ${c}\\cdot ${M}(1 - 1/n)$, which increases with $n$.`, `$\\int f_n\\,d\\mu = ${c}\\cdot ${M}(1 - 1/n)$ で、$n$ とともに増加します。`], [`Its limit is $${c}\\cdot ${M} = ${tot}$, which equals $\\int ${c}\\,\\mathbf{1}_{[0,\\,${M})}\\,d\\mu$.`, `極限は $${c}\\cdot ${M} = ${tot}$ で、$\\int ${c}\\,\\mathbf{1}_{[0,\\,${M})}\\,d\\mu$ に等しくなります。`]],
      };
    },
  ];
})();
