'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { gcd } = P.util;
  const mod = (a, n) => ((a % n) + n) % n;

  /* D_n as pairs [m, e] = r^m s^e, with s r = r^-1 s; on vertices r: i -> i + 1, s: i -> -i */
  const mul = (n, [a, x], [b, y]) => [mod(a + (x ? -b : b), n), x ^ y];
  const inv = (n, [a, x]) => (x ? [a, 1] : [mod(-a, n), 0]);
  const tex = ([m, e]) => (m === 0 ? (e ? 's' : 'e') : `r${m === 1 ? '' : `^{${m}}`}${e ? 's' : ''}`);
  const rk = (k) => (k === 1 ? 'r' : `r^{${k}}`);
  const ord = (n, g) => { let h = g, k = 1; while (h[0] !== 0 || h[1] !== 0) { h = mul(n, h, g); k++; } return k; };
  const classes = (n) => (n % 2 ? (n + 3) / 2 : (n + 6) / 2);
  const idx = (n, [m, e]) => m + e * n;   // the table's numbering: rotations 0..n-1, then reflections

  /* ---------- 1. order matters ---------- */
  Q.compose = [
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8), k = r.int(form === 1 ? 2 : 1, n - 1);
      if (form === 0) {
        const m = mod(-k, n);
        return {
          q: [`In $D_{${n}}$, write $s\\,${rk(k)}$ as $r^m s$ with $0 \\le m < ${n}$. What is $m$?`, `$D_{${n}}$ で $s\\,${rk(k)}$ を $r^m s$（$0 \\le m < ${n}$）の形に書きます。$m$ はいくつですか。`],
          a: { type: 'int', v: m },
          hint: ['Push $s$ past the rotation with $s\\,r = r^{-1}s$: a reflection reverses the sense of rotation.', '$s\\,r = r^{-1}s$ を使って $s$ を回転の右へ移します。鏡映は回転の向きを逆にします。'],
          sol: [[`$s\\,${rk(k)} = r^{-${k}}s$, and $-${k} \\equiv ${m} \\pmod{${n}}$.`, `$s\\,${rk(k)} = r^{-${k}}s$ で、$-${k} \\equiv ${m} \\pmod{${n}}$ です。`], [`So $s\\,${rk(k)} = ${tex([m, 1])}$, while $${rk(k)}\\,s = ${tex([k, 1])}$: ${m === k ? 'here the two agree because $2k$ is a multiple of $n$.' : 'two different reflections.'}`, `よって $s\\,${rk(k)} = ${tex([m, 1])}$、一方 $${rk(k)}\\,s = ${tex([k, 1])}$ で、${m === k ? '$2k$ が $n$ の倍数なのでここでは一致します。' : '異なる二つの鏡映です。'}`]],
          set: { n, k },
        };
      }
      if (form === 1) {
        const o = n / gcd(n, k);
        return {
          q: [`What is the order of $${rk(k)}$ in $D_{${n}}$?`, `$D_{${n}}$ における $${rk(k)}$ の位数はいくつですか。`],
          a: { type: 'int', v: o },
          hint: ['Count how many turns of $k$ steps it takes to come back to the start, a multiple of $n$ steps.', '$k$ ステップの回転を何回すると元に戻るか（$n$ の倍数ステップ）を数えます。'],
          sol: [[`$(${rk(k)})^j = e$ when $${k}j$ is a multiple of $${n}$; the smallest such $j$ is $${n}/\\gcd(${n}, ${k}) = ${n}/${gcd(n, k)} = ${o}$.`, `$${k}j$ が $${n}$ の倍数のとき $(${rk(k)})^j = e$ で、そのような最小の $j$ は $${n}/\\gcd(${n}, ${k}) = ${n}/${gcd(n, k)} = ${o}$ です。`], [o === n ? `$${rk(k)}$ alone generates all ${n} rotations.` : `It generates only ${o} of the ${n} rotations.`, o === n ? `$${rk(k)}$ だけで ${n} 個の回転すべてを生成します。` : `${n} 個の回転のうち ${o} 個しか生成しません。`]],
          set: { n, k },
        };
      }
      return {
        q: [`What is the order of the element $${tex([k, 1])}$ of $D_{${n}}$?`, `$D_{${n}}$ の元 $${tex([k, 1])}$ の位数はいくつですか。`],
        a: { type: 'int', v: ord(n, [k, 1]) },
        hint: ['Square it, using $s\\,r^k = r^{-k}s$.', '$s\\,r^k = r^{-k}s$ を使って二乗してください。'],
        sol: [[`$(${tex([k, 1])})^2 = ${rk(k)}\\,s\\,${rk(k)}\\,s = ${rk(k)}\\,r^{-${k}}\\,s\\,s = e$.`, `$(${tex([k, 1])})^2 = ${rk(k)}\\,s\\,${rk(k)}\\,s = ${rk(k)}\\,r^{-${k}}\\,s\\,s = e$ です。`], ['Every $r^k s$ is a reflection in some mirror line, whatever $k$ is, so its order is 2.', 'どの $r^k s$ も $k$ によらずある鏡の線での鏡映なので、位数は 2 です。']],
        set: { n, k },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8), k = r.int(1, n - 1);
      if (form === 0) {
        // a word r^a s r^b s r^c (s^d)
        const a = r.int(0, n - 1), b = r.int(1, n - 1), c = r.int(0, n - 1), d = r.int(0, 1);
        const w = [[a, 0], [0, 1], [b, 0], [0, 1], [c, 0]].concat(d ? [[0, 1]] : []);
        const res = w.reduce((acc, g) => mul(n, acc, g), [0, 0]);
        const wt = [a ? rk(a) : '', 's', rk(b), 's', c ? rk(c) : '', d ? 's' : ''].filter(Boolean).join('\\,');
        return {
          q: [`In $D_{${n}}$, write $${wt}$ as $r^m s^e$ with $0 \\le m < ${n}$ and $e \\in \\{0, 1\\}$. Give $(m, e)$.`, `$D_{${n}}$ で $${wt}$ を $r^m s^e$（$0 \\le m < ${n}$、$e \\in \\{0, 1\\}$）の形に書き、$(m, e)$ を答えてください。`],
          a: { type: 'tuple', v: res, labels: ['$m$', '$e$'], tol: 0.01 },
          hint: ['Each $s$ moved to the right flips the sign of the rotation it passes: $s\\,r^b = r^{-b}s$. Then $s^2 = e$.', '$s$ を右へ移すたびに、通り過ぎた回転の符号が変わります（$s\\,r^b = r^{-b}s$）。そして $s^2 = e$ です。'],
          sol: [[`$s\\,${rk(b)}\\,s = r^{-${b}}\\,s\\,s = r^{-${b}}$, so the word is $r^{${a} - ${b} + ${c}}${d ? 's' : ''}$.`, `$s\\,${rk(b)}\\,s = r^{-${b}}\\,s\\,s = r^{-${b}}$ なので、この語は $r^{${a} - ${b} + ${c}}${d ? 's' : ''}$ です。`], [`$${a} - ${b} + ${c} = ${a - b + c} \\equiv ${res[0]} \\pmod{${n}}$: the element is $${tex(res)}$.`, `$${a} - ${b} + ${c} = ${a - b + c} \\equiv ${res[0]} \\pmod{${n}}$ なので、元は $${tex(res)}$ です。`], [`An even number of reflections gives a rotation, an odd number a reflection: here ${2 + d} of them, so ${d ? 'a reflection' : 'a rotation'}.`, `鏡映が偶数回なら回転、奇数回なら鏡映になります。ここでは ${2 + d} 回なので${d ? '鏡映' : '回転'}です。`]],
          set: { n, k: b },
        };
      }
      if (form === 1) {
        const j = r.int(0, n - 1), first = r.int(0, 1), pos = first ? mod(-(j + k), n) : mod(k - j, n);
        const op = first ? `s \\circ ${rk(k)}` : `${rk(k)} \\circ s`;
        return {
          q: [`The vertices of a regular ${n}-gon are numbered $0, \\dots, ${n - 1}$ anticlockwise from the top, and $s$ is the reflection in the vertical line through vertex 0. After $${op}$, at which position does the label $${j}$ sit?`, `正 ${n} 角形の頂点に上から反時計回りに $0, \\dots, ${n - 1}$ と番号を付け、$s$ は頂点 0 を通る鉛直線での鏡映とします。$${op}$ の後、ラベル $${j}$ はどの位置にありますか。`],
          a: { type: 'int', v: pos },
          hint: ['Follow the label one step at a time: $s$ sends position $i$ to $-i$, and $r^k$ sends $i$ to $i + k$, both mod $n$. The right-hand map acts first.', 'ラベルを一段ずつ追います。$s$ は位置 $i$ を $-i$ に、$r^k$ は $i$ を $i + k$ に送ります（いずれも $n$ を法として）。右側の写像が先に作用します。'],
          sol: [first ? [`$${rk(k)}$ first: $${j} \\mapsto ${mod(j + k, n)}$. Then $s$: $${mod(j + k, n)} \\mapsto ${pos}$.`, `先に $${rk(k)}$：$${j} \\mapsto ${mod(j + k, n)}$。次に $s$：$${mod(j + k, n)} \\mapsto ${pos}$ です。`] : [`$s$ first: $${j} \\mapsto ${mod(-j, n)}$. Then $${rk(k)}$: $${mod(-j, n)} \\mapsto ${pos}$.`, `先に $s$：$${j} \\mapsto ${mod(-j, n)}$。次に $${rk(k)}$：$${mod(-j, n)} \\mapsto ${pos}$ です。`], [`Label $${j}$ ends at position $${pos}$. Press Play in the figure to watch it travel.`, `ラベル $${j}$ は位置 $${pos}$ に来ます。図の再生ボタンで動きを確かめられます。`]],
          set: { n, k },
        };
      }
      const cnt = n % 2 ? 1 : 2;
      return {
        q: [`For how many $k$ in $\\{0, 1, \\dots, ${n - 1}\\}$ do $r^k s$ and $s\\,r^k$ give the same symmetry of the regular ${n}-gon?`, `$\\{0, 1, \\dots, ${n - 1}\\}$ のうち、正 ${n} 角形の対称として $r^k s$ と $s\\,r^k$ が一致する $k$ はいくつありますか。`],
        a: { type: 'int', v: cnt },
        hint: ['$s\\,r^k = r^{-k}s$, so the question is when $r^k = r^{-k}$.', '$s\\,r^k = r^{-k}s$ なので、問題は $r^k = r^{-k}$ となるのはいつかです。'],
        sol: [[`$r^k s = r^{-k} s$ exactly when $2k \\equiv 0 \\pmod{${n}}$.`, `$r^k s = r^{-k} s$ となるのは $2k \\equiv 0 \\pmod{${n}}$ のときちょうどです。`], [n % 2 ? `With $n = ${n}$ odd, only $k = 0$ works.` : `With $n = ${n}$ even, $k = 0$ and $k = ${n / 2}$ (the half turn) work.`, n % 2 ? `$n = ${n}$ は奇数なので $k = 0$ だけです。` : `$n = ${n}$ は偶数なので $k = 0$ と $k = ${n / 2}$（半回転）です。`], ['The half turn commutes with everything: it is the only non-trivial element of the centre of $D_n$.', '半回転はすべての元と可換で、$D_n$ の中心の自明でない唯一の元です。']],
        set: { n, k: n % 2 ? 0 : n / 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8);
      if (form === 0) {
        const c = classes(n);
        return {
          q: [`How many conjugacy classes does $D_{${n}}$ have?`, `$D_{${n}}$ の共役類はいくつありますか。`],
          a: { type: 'int', v: c },
          hint: ['Conjugating $r^k$ by $s$ gives $r^{-k}$. Conjugating $s$ by $r$ gives $r^2 s$, so it moves the mirror by two steps.', '$r^k$ を $s$ で共役すると $r^{-k}$ になります。$s$ を $r$ で共役すると $r^2 s$ で、鏡の線が二ステップずれます。'],
          sol: [[`Rotations pair up as $\\{r^k, r^{-k}\\}$: ${n % 2 ? `$\\{e\\}$ and ${(n - 1) / 2} pairs, so ${(n + 1) / 2} classes` : `$\\{e\\}$, $\\{r^{${n / 2}}\\}$ and ${n / 2 - 1} pairs, so ${n / 2 + 1} classes`}.`, `回転は $\\{r^k, r^{-k}\\}$ の組になります。${n % 2 ? `$\\{e\\}$ と ${(n - 1) / 2} 組で、${(n + 1) / 2} 個の類` : `$\\{e\\}$、$\\{r^{${n / 2}}\\}$ と ${n / 2 - 1} 組で、${n / 2 + 1} 個の類`}です。`], [n % 2 ? `For odd $n$, $r^k s \\mapsto r^{k+2} s$ reaches every reflection, so they form one class.` : 'For even $n$, conjugation shifts $k$ in $r^k s$ by even steps only, so the reflections split into two classes: mirrors through vertices and mirrors through edge midpoints.', n % 2 ? '奇数の $n$ では $r^k s \\mapsto r^{k+2} s$ ですべての鏡映に届くので、一つの類になります。' : '偶数の $n$ では共役で $r^k s$ の $k$ は偶数ステップしかずれないので、鏡映は二つの類（頂点を通る鏡と辺の中点を通る鏡）に分かれます。'], [`Total: $${c}$ classes.`, `合計 $${c}$ 個の類です。`]],
          set: { n },
        };
      }
      if (form === 1) {
        const c = n + (n % 2 ? 0 : 1);
        return {
          q: [`How many elements of order 2 does $D_{${n}}$ have?`, `$D_{${n}}$ には位数 2 の元がいくつありますか。`],
          a: { type: 'int', v: c },
          hint: ['Check the reflections and the rotations separately.', '鏡映と回転を別々に調べてください。'],
          sol: [[`All ${n} reflections $r^k s$ have order 2.`, `${n} 個の鏡映 $r^k s$ はすべて位数 2 です。`], [n % 2 ? `A rotation $r^k$ has order 2 only if $2k \\equiv 0 \\pmod{${n}}$ with $k \\ne 0$, impossible for odd $n$.` : `Among rotations only the half turn $r^{${n / 2}}$ has order 2.`, n % 2 ? `回転 $r^k$ が位数 2 になるのは $k \\ne 0$ で $2k \\equiv 0 \\pmod{${n}}$ のときだけで、奇数の $n$ ではあり得ません。` : `回転の中では半回転 $r^{${n / 2}}$ だけが位数 2 です。`], [`Total ${c}. Counting elements of each order is a quick way to tell groups apart: the cyclic group of order ${2 * n} has just one element of order 2.`, `合計 ${c} 個です。各位数の元を数えると群を見分けられます。位数 ${2 * n} の巡回群には位数 2 の元が一つしかありません。`]],
          set: { n },
        };
      }
      const k = r.int(1, n - 1), d = mod(2 * k, n);
      return {
        q: [`In $D_{${n}}$, $${rk(k)}\\,s = r^d\\,(s\\,${rk(k)})$ for some $0 \\le d < ${n}$. Find $d$.`, `$D_{${n}}$ で、ある $0 \\le d < ${n}$ について $${rk(k)}\\,s = r^d\\,(s\\,${rk(k)})$ が成り立ちます。$d$ を求めてください。`],
        a: { type: 'int', v: d },
        hint: ['Write $s\\,r^k$ as $r^{-k}s$ and compare.', '$s\\,r^k$ を $r^{-k}s$ と書いて比べてください。'],
        sol: [[`$s\\,${rk(k)} = r^{-${k}}s$, so $r^d\\,r^{-${k}}s = ${rk(k)}\\,s$ requires $d - ${k} \\equiv ${k}$.`, `$s\\,${rk(k)} = r^{-${k}}s$ なので、$r^d\\,r^{-${k}}s = ${rk(k)}\\,s$ には $d - ${k} \\equiv ${k}$ が必要です。`], [`$d \\equiv 2\\cdot${k} = ${2 * k} \\equiv ${d} \\pmod{${n}}$.`, `$d \\equiv 2\\cdot${k} = ${2 * k} \\equiv ${d} \\pmod{${n}}$ です。`], [d === 0 ? 'The two orders agree here.' : `The two results differ by the rotation $${tex([d, 0])}$, which is what the readout reports.`, d === 0 ? 'ここでは二つの順序が一致します。' : `二つの結果は回転 $${tex([d, 0])}$ だけ異なり、読み取り欄がそれを示しています。`]],
        set: { n, k },
      };
    },
  ];

  /* ---------- 2. multiplication table ---------- */
  Q.table = [
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8);
      if (form === 0) {
        const a = r.int(1, n - 1), b = r.int(1, n - 1);
        return {
          q: [`In the rotation group $C_{${n}}$, written additively as steps $0, \\dots, ${n - 1}$, what is $${a}\\cdot${b}$?`, `回転群 $C_{${n}}$ をステップ $0, \\dots, ${n - 1}$ の足し算で書くとき、$${a}\\cdot${b}$ はいくつですか。`],
          a: { type: 'int', v: (a + b) % n },
          hint: ['Turning $a$ steps and then $b$ steps is turning $a + b$ steps, counted modulo $n$.', '$a$ ステップ回ってから $b$ ステップ回るのは $a + b$ ステップ回ることで、$n$ を法として数えます。'],
          sol: [[`$${a} + ${b} = ${a + b}$${a + b >= n ? `, and $${a + b} - ${n} = ${a + b - n}$` : ''}.`, `$${a} + ${b} = ${a + b}$${a + b >= n ? `、$${a + b} - ${n} = ${a + b - n}$` : ''} です。`], [`So $${a}\\cdot${b} = ${(a + b) % n}$${a + b === n ? ': the identity, so these two steps are inverse to each other' : ''}.`, `よって $${a}\\cdot${b} = ${(a + b) % n}$ です。${a + b === n ? 'これは単位元なので、この二つのステップは互いに逆元です。' : ''}`]],
          set: { group: 0, n, a, b },
        };
      }
      if (form === 1) {
        const a = r.int(1, n - 1);
        return {
          q: [`In $C_{${n}}$ (steps modulo ${n}), which element is the inverse of $${a}$?`, `$C_{${n}}$（${n} を法とするステップ）で、$${a}$ の逆元はどれですか。`],
          a: { type: 'int', v: n - a },
          hint: ['Find the column where row $a$ shows the identity $0$.', '行 $a$ に単位元 $0$ が現れる列を探します。'],
          sol: [[`We need $${a} + b \\equiv 0 \\pmod{${n}}$, so $b = ${n} - ${a} = ${n - a}$.`, `$${a} + b \\equiv 0 \\pmod{${n}}$ が必要なので、$b = ${n} - ${a} = ${n - a}$ です。`], ['Turning back the rest of the way round undoes the turn.', '残りの分だけ回って一周すると、回転が打ち消されます。']],
          set: { group: 0, n, a, b: n - a },
        };
      }
      const a = r.int(1, n - 1), o2 = mod(-a, n);
      const opts = [[`$${tex([a, 1])}$ itself`, `$${tex([a, 1])}$ 自身`]].concat(o2 !== a ? [[`$${tex([o2, 1])}$`, `$${tex([o2, 1])}$`]] : [], [[`$${tex([o2, 0])}$`, `$${tex([o2, 0])}$`], ['$s$', '$s$']]);
      return {
        q: [`In $D_{${n}}$, what is the inverse of the reflection $${tex([a, 1])}$?`, `$D_{${n}}$ で、鏡映 $${tex([a, 1])}$ の逆元は何ですか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Apply the same reflection twice.', '同じ鏡映を二回施してください。'],
        sol: [[`$(${tex([a, 1])})(${tex([a, 1])}) = r^{${a}}\\,r^{-${a}}\\,s\\,s = e$.`, `$(${tex([a, 1])})(${tex([a, 1])}) = r^{${a}}\\,r^{-${a}}\\,s\\,s = e$ です。`], ['Every reflection is its own inverse, so each reflection row of the table has the identity on the diagonal.', 'どの鏡映も自分自身の逆元なので、表の鏡映の行では単位元が対角線上にあります。']],
        set: { group: 1, n, a: idx(n, [a, 1]), b: idx(n, [a, 1]) },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8);
      if (form === 0) {
        const g = [r.int(0, n - 1), r.int(0, 1)], h = [r.int(0, n - 1), r.int(0, 1)];
        if (!g[1] && !h[1]) h[1] = 1;
        if (!g[1] && !g[0]) g[0] = r.int(1, n - 1);
        const p = mul(n, g, h);
        return {
          q: [`In $D_{${n}}$, compute $(${tex(g)})(${tex(h)})$ in the form $r^m s^e$, $0 \\le m < ${n}$. Give $(m, e)$.`, `$D_{${n}}$ で $(${tex(g)})(${tex(h)})$ を $r^m s^e$（$0 \\le m < ${n}$）の形で求め、$(m, e)$ を答えてください。`],
          a: { type: 'tuple', v: p, labels: ['$m$', '$e$'], tol: 0.01 },
          hint: ['$(r^a s^x)(r^b s^y) = r^{a + (-1)^x b}\\,s^{x + y}$: a reflection on the left reverses the next rotation.', '$(r^a s^x)(r^b s^y) = r^{a + (-1)^x b}\\,s^{x + y}$ です。左の鏡映は次の回転の向きを逆にします。'],
          sol: [[`Here $a = ${g[0]}$, $x = ${g[1]}$, $b = ${h[0]}$, $y = ${h[1]}$: $m \\equiv ${g[0]} ${g[1] ? '-' : '+'} ${h[0]} \\equiv ${p[0]}$ and $e = ${g[1] + h[1]} \\bmod 2 = ${p[1]}$.`, `$a = ${g[0]}$、$x = ${g[1]}$、$b = ${h[0]}$、$y = ${h[1]}$ なので、$m \\equiv ${g[0]} ${g[1] ? '-' : '+'} ${h[0]} \\equiv ${p[0]}$、$e = ${g[1] + h[1]} \\bmod 2 = ${p[1]}$ です。`], [`The product is $${tex(p)}$, the entry in row $${tex(g)}$ and column $${tex(h)}$ of the table.`, `積は $${tex(p)}$ で、表の行 $${tex(g)}$、列 $${tex(h)}$ の成分です。`]],
          set: { group: 1, n, a: idx(n, g), b: idx(n, h) },
        };
      }
      if (form === 1) {
        const a = r.int(1, n - 1), b = r.int(0, n - 1), g = [a, 0], h = [b, 1];
        const gh = mul(n, g, h), hg = mul(n, h, g);
        return {
          q: [`In $D_{${n}}$, let $a = ${tex(g)}$ and $b = ${tex(h)}$. Then $a\\cdot b = r^{m}s$ and $b\\cdot a = r^{m'}s$. Find $(m, m')$ with $0 \\le m, m' < ${n}$.`, `$D_{${n}}$ で $a = ${tex(g)}$、$b = ${tex(h)}$ とします。$a\\cdot b = r^{m}s$、$b\\cdot a = r^{m'}s$ となる $(m, m')$（$0 \\le m, m' < ${n}$）を求めてください。`],
          a: { type: 'tuple', v: [gh[0], hg[0]], labels: ['$m$', "$m'$"], tol: 0.01 },
          hint: ['In $b\\cdot a$ the reflection comes first, so it reverses the rotation that follows.', '$b\\cdot a$ では鏡映が先にあるので、続く回転の向きを逆にします。'],
          sol: [[`$a\\cdot b = r^{${a}}\\,r^{${b}}s = r^{${mod(a + b, n)}}s$.`, `$a\\cdot b = r^{${a}}\\,r^{${b}}s = r^{${mod(a + b, n)}}s$ です。`], [`$b\\cdot a = r^{${b}}s\\,r^{${a}} = r^{${b}}r^{-${a}}s = r^{${mod(b - a, n)}}s$.`, `$b\\cdot a = r^{${b}}s\\,r^{${a}} = r^{${b}}r^{-${a}}s = r^{${mod(b - a, n)}}s$ です。`], [gh[0] === hg[0] ? `They agree because $2\\cdot${a}$ is a multiple of ${n}: $r^{${a}}$ is the half turn.` : 'They differ, so the table is not symmetric about its diagonal at these two cells.', gh[0] === hg[0] ? `$2\\cdot${a}$ が ${n} の倍数なので一致します。$r^{${a}}$ は半回転です。` : '異なるので、表はこの二つのセルで対角線について対称ではありません。']],
          set: { group: 1, n, a: idx(n, g), b: idx(n, h) },
        };
      }
      const a = r.int(0, n - 1), b = r.int(0, n - 1), x = mod(b - a, n);
      return {
        q: [`In the table of $C_{${n}}$, row $${a}$ contains the value $${b}$ exactly once. In which column?`, `$C_{${n}}$ の表で、行 $${a}$ には値 $${b}$ がちょうど一回現れます。どの列ですか。`],
        a: { type: 'int', v: x },
        hint: ['Solve $a + x \\equiv b$: multiply on the left by the inverse of $a$.', '$a + x \\equiv b$ を解きます。左から $a$ の逆元を掛けてください。'],
        sol: [[`$x \\equiv ${b} - ${a} \\equiv ${x} \\pmod{${n}}$.`, `$x \\equiv ${b} - ${a} \\equiv ${x} \\pmod{${n}}$ です。`], ['Because $x = a^{-1}b$ is the only solution, each value appears once in each row: every row of a group table is a permutation of the elements.', '$x = a^{-1}b$ が唯一の解なので、各行に各値がちょうど一回現れます。群の表のどの行も元の並べ替えです。']],
        set: { group: 0, n, a, b: x },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 8);
      if (form === 0) {
        const c = classes(n);
        return {
          q: [`How many ordered pairs $(a, b)$ of elements of $D_{${n}}$ satisfy $ab = ba$? (These are the cells of the table that match their mirror image across the diagonal.)`, `$D_{${n}}$ の元の順序対 $(a, b)$ で $ab = ba$ を満たすものはいくつありますか（表で、対角線についての鏡像と一致するセルの数です）。`],
          a: { type: 'int', v: 2 * n * c },
          hint: ['Count by rows: row $a$ has $|C(a)|$ such cells, the size of its centraliser, and $|C(a)| = |G|/|\\text{class of } a|$.', '行ごとに数えます。行 $a$ には中心化群の大きさ $|C(a)|$ 個のセルがあり、$|C(a)| = |G|/|a \\text{ の類}|$ です。'],
          sol: [['Summing $|G|/|\\text{class}|$ over the elements of a class gives $|G|$, so the total is $|G|$ times the number of classes.', '一つの類の元について $|G|/|\\text{類}|$ を足すと $|G|$ になるので、合計は $|G|$ と類の数の積です。'], [`$D_{${n}}$ has $|G| = ${2 * n}$ and ${c} classes, so there are $${2 * n}\\cdot${c} = ${2 * n * c}$ commuting pairs out of $${4 * n * n}$.`, `$D_{${n}}$ は $|G| = ${2 * n}$ で類が ${c} 個なので、$${4 * n * n}$ 組のうち可換な組は $${2 * n}\\cdot${c} = ${2 * n * c}$ 組です。`], ['The probability that two random elements commute is (classes)/|G|, here ' + `$${c}/${2 * n}$.`, '無作為な二元が可換である確率は（類の数）/|G| で、ここでは ' + `$${c}/${2 * n}$ です。`]],
          set: { group: 1, n },
        };
      }
      if (form === 1) {
        const g = [r.int(0, n - 1), r.int(0, 1)], b = [r.int(0, n - 1), r.int(0, 1)];
        const x = mul(n, b, inv(n, g));
        return {
          q: [`In $D_{${n}}$, solve $x\\cdot(${tex(g)}) = ${tex(b)}$ for $x = r^m s^e$, $0 \\le m < ${n}$. Give $(m, e)$.`, `$D_{${n}}$ で $x\\cdot(${tex(g)}) = ${tex(b)}$ を $x = r^m s^e$（$0 \\le m < ${n}$）について解き、$(m, e)$ を答えてください。`],
          a: { type: 'tuple', v: x, labels: ['$m$', '$e$'], tol: 0.01 },
          hint: ['Multiply on the right by the inverse, and keep the order: $x = b\\,a^{-1}$, not $a^{-1}b$.', '右から逆元を掛けます。順序に注意して $x = b\\,a^{-1}$ で、$a^{-1}b$ ではありません。'],
          sol: [[`$(${tex(g)})^{-1} = ${tex(inv(n, g))}$${g[1] ? ' (a reflection is its own inverse)' : ''}.`, `$(${tex(g)})^{-1} = ${tex(inv(n, g))}$ です${g[1] ? '（鏡映は自分自身の逆元）' : ''}。`], [`$x = (${tex(b)})(${tex(inv(n, g))}) = ${tex(x)}$.`, `$x = (${tex(b)})(${tex(inv(n, g))}) = ${tex(x)}$ です。`], [`Check: $(${tex(x)})(${tex(g)}) = ${tex(mul(n, x, g))}$. ${tex(mul(n, inv(n, g), b)) === tex(x) ? 'Here $a^{-1}b$ happens to give the same answer.' : `The other order, $a^{-1}b = ${tex(mul(n, inv(n, g), b))}$, would be wrong.`}`, `確認：$(${tex(x)})(${tex(g)}) = ${tex(mul(n, x, g))}$ です。${tex(mul(n, inv(n, g), b)) === tex(x) ? 'ここではたまたま $a^{-1}b$ でも同じ答えになります。' : `逆の順序 $a^{-1}b = ${tex(mul(n, inv(n, g), b))}$ は誤りです。`}`]],
          set: { group: 1, n, a: idx(n, x), b: idx(n, g) },
        };
      }
      return {
        q: [`How many of the $${4 * n * n}$ cells of the multiplication table of $D_{${n}}$ contain a rotation (including $e$)?`, `$D_{${n}}$ の積の表の $${4 * n * n}$ 個のセルのうち、回転（$e$ を含む）が入っているのはいくつですか。`],
        a: { type: 'int', v: 2 * n * n },
        hint: ['Whether a product is a rotation depends only on how many of its two factors are reflections.', '積が回転かどうかは、二つの因子のうち何個が鏡映かだけで決まります。'],
        sol: [[`$r^a s^x \\cdot r^b s^y$ is a rotation exactly when $x + y$ is even: both rotations ($${n}\\times${n}$ cells) or both reflections ($${n}\\times${n}$ cells).`, `$r^a s^x \\cdot r^b s^y$ が回転になるのは $x + y$ が偶数のときちょうどで、両方回転（$${n}\\times${n}$ セル）か両方鏡映（$${n}\\times${n}$ セル）です。`], [`That is $2\\cdot${n * n} = ${2 * n * n}$ cells, exactly half: the map $r^a s^x \\mapsto (-1)^x$ is a homomorphism onto $\\{\\pm 1\\}$, and the rotations are its kernel.`, `$2\\cdot${n * n} = ${2 * n * n}$ セルで、ちょうど半分です。写像 $r^a s^x \\mapsto (-1)^x$ は $\\{\\pm 1\\}$ への準同型で、回転はその核です。`]],
        set: { group: 1, n },
      };
    },
  ];

  /* ---------- 3. orbits, stabilisers, cosets ---------- */
  // the subgroup generated by r^k (and s), acting on vertices 0..n-1
  function subgroup(n, k, withS) {
    const gens = [[mod(k, n), 0]].concat(withS ? [[0, 1]] : []);
    const G = [[0, 0]], seen = new Set(['0,0']);
    for (let q = 0; q < G.length; q++) for (const g of gens) { const h = mul(n, g, G[q]); const key = h.join(); if (!seen.has(key)) { seen.add(key); G.push(h); } }
    return G;
  }
  const act = (n, [m, e], i) => mod((e ? -i : i) + m, n);
  const orbitsOf = (n, G) => { const done = new Set(), out = []; for (let i = 0; i < n; i++) if (!done.has(i)) { const o = [...new Set(G.map((g) => act(n, g, i)))]; o.forEach((j) => done.add(j)); out.push(o.sort((a, b) => a - b)); } return out; };
  const phi = (d) => { let c = 0; for (let i = 1; i <= d; i++) if (gcd(i, d) === 1) c++; return c; };
  Q.orbit = [
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 12), k = r.int(1, n - 1), g = gcd(n, k);
      if (form === 0) return {
        q: [`How many elements does the subgroup $\\langle ${rk(k)} \\rangle$ of rotations of a regular ${n}-gon have?`, `正 ${n} 角形の回転の部分群 $\\langle ${rk(k)} \\rangle$ の元はいくつですか。`],
        a: { type: 'int', v: n / g },
        hint: ['Count the distinct powers of $r^k$ before they repeat.', '$r^k$ の冪が繰り返すまでに何個の異なる元があるかを数えます。'],
        sol: [[`$|\\langle ${rk(k)} \\rangle| = ${n}/\\gcd(${n}, ${k}) = ${n}/${g} = ${n / g}$.`, `$|\\langle ${rk(k)} \\rangle| = ${n}/\\gcd(${n}, ${k}) = ${n}/${g} = ${n / g}$ です。`], [`They are the turns by multiples of ${g} step${g === 1 ? '' : 's'}${g === 1 ? ', so every rotation is reached' : ''}.`, `それらは ${g} ステップの倍数の回転です${g === 1 ? 'ので、すべての回転に届きます' : ''}。`]],
        set: { n, k, refl: 0 },
      };
      if (form === 1) return {
        q: [`Into how many orbits does $\\langle ${rk(k)} \\rangle$ split the ${n} vertices of a regular ${n}-gon?`, `$\\langle ${rk(k)} \\rangle$ は正 ${n} 角形の ${n} 個の頂点をいくつの軌道に分けますか。`],
        a: { type: 'int', v: g },
        hint: ['Each orbit has as many vertices as the subgroup has elements, since no rotation but $e$ fixes a vertex.', '$e$ 以外の回転は頂点を固定しないので、各軌道の頂点の数は部分群の元の数と同じです。'],
        sol: [[`Each orbit has $|\\langle ${rk(k)} \\rangle| = ${n / g}$ vertices.`, `各軌道は $|\\langle ${rk(k)} \\rangle| = ${n / g}$ 個の頂点をもちます。`], [`So there are $${n}/${n / g} = ${g} = \\gcd(${n}, ${k})$ orbits${g === 1 ? ': one orbit, the subgroup moves any vertex to any other' : ''}.`, `よって軌道は $${n}/${n / g} = ${g} = \\gcd(${n}, ${k})$ 個です${g === 1 ? '。軌道は一つで、部分群はどの頂点も他のどの頂点にも移します' : ''}。`]],
        set: { n, k, refl: 0 },
      };
      const x = r.int(0, n - 1), y = mod(x + r.int(1, n - 1), n), inOrb = mod(y - x, g) === 0;
      return {
        q: [`Under $\\langle ${rk(k)} \\rangle$ acting on the vertices $0, \\dots, ${n - 1}$ of a regular ${n}-gon, is vertex $${y}$ in the orbit of vertex $${x}$?`, `正 ${n} 角形の頂点 $0, \\dots, ${n - 1}$ に $\\langle ${rk(k)} \\rangle$ が作用するとき、頂点 $${y}$ は頂点 $${x}$ の軌道に入っていますか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: inOrb ? 0 : 1, fixed: true },
        hint: [`The orbit of $x$ is $x$ plus the multiples of $\\gcd(n, k)$.`, `$x$ の軌道は、$x$ に $\\gcd(n, k)$ の倍数を足したものです。`],
        sol: [[`$\\gcd(${n}, ${k}) = ${g}$, and $${y} - ${x} = ${y - x}$${inOrb ? ` is a multiple of ${g}` : ` is not a multiple of ${g}`}.`, `$\\gcd(${n}, ${k}) = ${g}$ で、$${y} - ${x} = ${y - x}$ は ${g} の倍数${inOrb ? 'です' : 'ではありません'}。`], [inOrb ? `So yes: some power of $${rk(k)}$ carries $${x}$ to $${y}$.` : `So no: $${x}$ and $${y}$ lie in different orbits.`, inOrb ? `よって、はい。$${rk(k)}$ のある冪が $${x}$ を $${y}$ に移します。` : `よって、いいえ。$${x}$ と $${y}$ は別の軌道にあります。`]],
        set: { n, k, refl: 0, x },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 12), k = r.int(1, n - 1), g = gcd(n, k);
      if (form === 0) {
        const G = subgroup(n, k, true), x = r.int(0, n - 1);
        const orb = [...new Set(G.map((h) => act(n, h, x)))], stab = G.filter((h) => act(n, h, x) === x);
        return {
          q: [`$G = \\langle ${rk(k)}, s \\rangle$ acts on the vertices of a regular ${n}-gon ($s$: $i \\mapsto -i$). How many elements of $G$ fix vertex $${x}$?`, `$G = \\langle ${rk(k)}, s \\rangle$ が正 ${n} 角形の頂点に作用します（$s$：$i \\mapsto -i$）。頂点 $${x}$ を固定する $G$ の元はいくつありますか。`],
          a: { type: 'int', v: stab.length },
          hint: ['Use $|G| = |Gx|\\cdot|G_x|$: find the size of $G$ and of the orbit of $x$.', '$|G| = |Gx|\\cdot|G_x|$ を使います。$G$ の大きさと $x$ の軌道の大きさを求めてください。'],
          sol: [[`$G$ holds the rotations by multiples of $${g}$ and the reflections $r^{${g}j}s$: $|G| = 2\\cdot${n / g} = ${G.length}$.`, `$G$ は $${g}$ の倍数の回転と鏡映 $r^{${g}j}s$ からなり、$|G| = 2\\cdot${n / g} = ${G.length}$ です。`], [`The orbit of $${x}$ is $\\{${orb.sort((a, b) => a - b).join(', ')}\\}$, with ${orb.length} vertices.`, `$${x}$ の軌道は $\\{${orb.join(', ')}\\}$ で、${orb.length} 個の頂点です。`], [`So $|G_{${x}}| = ${G.length}/${orb.length} = ${stab.length}$: ${stab.length === 2 ? 'the identity and one reflection whose mirror passes through the vertex' : 'only the identity, since no mirror of $G$ passes through this vertex'}.`, `よって $|G_{${x}}| = ${G.length}/${orb.length} = ${stab.length}$ です。${stab.length === 2 ? '単位元と、鏡がこの頂点を通る一つの鏡映です。' : 'この頂点を通る $G$ の鏡はないので、単位元だけです。'}`]],
          set: { n, k, refl: 1, x },
        };
      }
      if (form === 1) return {
        q: [`How many left cosets does the rotation subgroup $\\langle ${rk(k)} \\rangle$ have in $D_{${n}}$?`, `回転の部分群 $\\langle ${rk(k)} \\rangle$ は $D_{${n}}$ の中にいくつの左剰余類をもちますか。`],
        a: { type: 'int', v: 2 * g },
        hint: ['Lagrange: the cosets all have the size of the subgroup and partition the group.', 'ラグランジュの定理：剰余類はすべて部分群と同じ大きさで、群を分割します。'],
        sol: [[`$|D_{${n}}| = ${2 * n}$ and $|\\langle ${rk(k)} \\rangle| = ${n / g}$.`, `$|D_{${n}}| = ${2 * n}$、$|\\langle ${rk(k)} \\rangle| = ${n / g}$ です。`], [`The index is $${2 * n}/${n / g} = ${2 * g}$: ${g} coset${g === 1 ? '' : 's'} of rotations and ${g} of reflections.`, `指数は $${2 * n}/${n / g} = ${2 * g}$ で、回転の剰余類が ${g} 個、鏡映の剰余類が ${g} 個です。`]],
        set: { n, k, refl: 0 },
      };
      const G = subgroup(n, k, true), O = orbitsOf(n, G);
      return {
        q: [`Into how many orbits does $\\langle ${rk(k)}, s \\rangle$ split the ${n} vertices of a regular ${n}-gon?`, `$\\langle ${rk(k)}, s \\rangle$ は正 ${n} 角形の ${n} 個の頂点をいくつの軌道に分けますか。`],
        a: { type: 'int', v: O.length },
        hint: ['Start from the $\\gcd(n, k)$ orbits of the rotations; the reflection $i \\mapsto -i$ may glue some of them together.', '回転による $\\gcd(n, k)$ 個の軌道から始めます。鏡映 $i \\mapsto -i$ がそのいくつかを貼り合わせるかもしれません。'],
        sol: [[`The rotations alone give ${g} orbit${g === 1 ? '' : 's'}: the residues mod ${g}.`, `回転だけでは ${g} 個の軌道（${g} を法とする剰余）です。`], [`$s$ sends residue $c$ to $-c$, so classes $c$ and $-c$ merge: ${O.map((o) => `\\{${o.join(', ')}\\}`).map((s) => `$${s}$`).join(', ')}.`, `$s$ は剰余 $c$ を $-c$ に送るので、類 $c$ と $-c$ が合わさります。${O.map((o) => `$\\{${o.join(', ')}\\}$`).join('、')} です。`], [`${O.length} orbit${O.length === 1 ? '' : 's'}, of sizes ${O.map((o) => o.length).join(', ')}: with reflections, orbits need not all be the same size.`, `軌道は ${O.length} 個で、大きさは ${O.map((o) => o.length).join('、')} です。鏡映があると、軌道の大きさはそろうとは限りません。`]],
        set: { n, k, refl: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2), n = r.int(3, 12);
      if (form === 0) {
        const c = r.pick([2, 2, 3]);
        const divs = []; for (let d = 1; d <= n; d++) if (n % d === 0) divs.push(d);
        const total = divs.reduce((s, d) => s + phi(d) * c ** (n / d), 0) / n;
        return {
          q: [`Beads of ${c} colours are placed on the ${n} vertices of a regular ${n}-gon. How many different necklaces are there, counting two as the same when a rotation carries one to the other?`, `${c} 色のビーズを正 ${n} 角形の ${n} 個の頂点に置きます。回転で互いに移り合うものを同じとみなすと、異なるネックレスは何通りありますか。`],
          a: { type: 'int', v: total },
          hint: ['Burnside: the number of orbits is the average number of colourings fixed by a group element. $r^j$ fixes the colourings that are constant on each of its $\\gcd(n, j)$ cycles.', 'バーンサイドの補題：軌道の数は、群の元が固定する塗り方の数の平均です。$r^j$ は自分の $\\gcd(n, j)$ 個の巡回の上で一定な塗り方を固定します。'],
          sol: [[`$r^j$ fixes $${c}^{\\gcd(${n}, j)}$ colourings. Grouping $j$ by $d = ${n}/\\gcd(${n}, j)$, there are $\\varphi(d)$ rotations of order $d$, each fixing $${c}^{${n}/d}$.`, `$r^j$ は $${c}^{\\gcd(${n}, j)}$ 通りの塗り方を固定します。$d = ${n}/\\gcd(${n}, j)$ でまとめると、位数 $d$ の回転は $\\varphi(d)$ 個あり、それぞれ $${c}^{${n}/d}$ 通りを固定します。`], [`$\\dfrac{1}{${n}}\\left(${divs.map((d) => `${phi(d)}\\cdot ${c}^{${n / d}}`).join(' + ')}\\right) = \\dfrac{${total * n}}{${n}} = ${total}$.`, `$\\dfrac{1}{${n}}\\left(${divs.map((d) => `${phi(d)}\\cdot ${c}^{${n / d}}`).join(' + ')}\\right) = \\dfrac{${total * n}}{${n}} = ${total}$ です。`], [`That is more than $${c}^{${n}}/${n}$, because the symmetric colourings lie in orbits with fewer than ${n} members; averaging the fixed points counts those orbits correctly.`, `これは $${c}^{${n}}/${n}$ より大きくなります。対称な塗り方は ${n} 個より少ない元からなる軌道に入るからで、固定点の平均はそうした軌道も正しく数えます。`]],
          set: { n, k: 1, refl: 0 },
        };
      }
      if (form === 1) {
        const c = 2;
        const divs = []; for (let d = 1; d <= n; d++) if (n % d === 0) divs.push(d);
        const rot = divs.reduce((s, d) => s + phi(d) * c ** (n / d), 0);
        const ref = n % 2 ? n * c ** ((n + 1) / 2) : (n / 2) * (c ** (n / 2 + 1) + c ** (n / 2));
        const total = (rot + ref) / (2 * n);
        return {
          q: [`Black and white beads are placed on the ${n} vertices of a regular ${n}-gon. Counting two arrangements as the same when any symmetry in $D_{${n}}$ (rotations and reflections) carries one to the other, how many bracelets are there?`, `黒と白のビーズを正 ${n} 角形の ${n} 個の頂点に置きます。$D_{${n}}$ のどの対称（回転と鏡映）で移り合うものも同じとみなすと、ブレスレットは何通りありますか。`],
          a: { type: 'int', v: total },
          hint: ['Burnside with all $2n$ elements. A reflection fixes a colouring when the colours match across its mirror; count the vertex pairs and the vertices on the mirror.', '$2n$ 個の元すべてでバーンサイドの補題を使います。鏡映が塗り方を固定するのは、鏡の両側で色が一致するときです。頂点の組と鏡の上の頂点を数えてください。'],
          sol: [[`The rotations together fix $${rot}$ colourings, as for necklaces.`, `回転は合わせて $${rot}$ 通りの塗り方を固定します（ネックレスと同じ）。`], [n % 2 ? `Each of the ${n} mirrors passes through one vertex and pairs the other ${n - 1}: $2^{${(n + 1) / 2}}$ fixed each, $${ref}$ in all.` : `${n / 2} mirrors pass through two vertices ($2^{${n / 2 + 1}}$ fixed each) and ${n / 2} through two edge midpoints ($2^{${n / 2}}$ each): $${ref}$ in all.`, n % 2 ? `${n} 本の鏡はそれぞれ一つの頂点を通り、残り ${n - 1} 個を組にするので、各 $2^{${(n + 1) / 2}}$ 通り、合計 $${ref}$ 通りを固定します。` : `${n / 2} 本の鏡は二つの頂点を通り（各 $2^{${n / 2 + 1}}$ 通り）、${n / 2} 本は二つの辺の中点を通ります（各 $2^{${n / 2}}$ 通り）。合計 $${ref}$ 通りです。`], [`$(${rot} + ${ref})/${2 * n} = ${total}$ bracelets.`, `$(${rot} + ${ref})/${2 * n} = ${total}$ 通りのブレスレットです。`]],
          set: { n, k: 1, refl: 1 },
        };
      }
      const divs = []; for (let d = 1; d <= 2 * n; d++) if ((2 * n) % d === 0) divs.push(d);
      const yes = r.chance(0.6);
      let m;
      if (yes) m = r.pick(divs.filter((d) => d > 1 && d < 2 * n)); else { const bad = []; for (let d = 2; d < 2 * n; d++) if ((2 * n) % d) bad.push(d); m = r.pick(bad); }
      const sub = !yes ? '' : n % m === 0 ? `\\langle r^{${n / m}} \\rangle` : 2 * n / m === n ? '\\langle s \\rangle' : `\\langle r^{${2 * n / m}}, s \\rangle`;
      return {
        q: [`Does $D_{${n}}$ (order ${2 * n}) have a subgroup of order ${m}?`, `$D_{${n}}$（位数 ${2 * n}）は位数 ${m} の部分群をもちますか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: yes ? 0 : 1, fixed: true },
        hint: ['Lagrange rules out orders that do not divide the group order. For the others, look among rotation subgroups and rotation subgroups with a reflection added.', 'ラグランジュの定理は群の位数を割り切らない位数を除外します。それ以外は、回転の部分群と、それに鏡映を加えた部分群の中から探してください。'],
        sol: yes ? [[`${m} divides ${2 * n}.`, `${m} は ${2 * n} を割り切ります。`], [n % m === 0 ? `$${sub}$, the rotations by multiples of ${n / m} steps, has exactly ${m} elements.` : (m === 2 ? `$${sub}$ holds the identity and one reflection.` : `$${sub}$ has ${m / 2} rotations and ${m / 2} reflections, ${m} elements in all.`), n % m === 0 ? `$${sub}$（${n / m} ステップの倍数の回転）はちょうど ${m} 個の元をもちます。` : (m === 2 ? `$${sub}$ は単位元と一つの鏡映からなります。` : `$${sub}$ は ${m / 2} 個の回転と ${m / 2} 個の鏡映、合わせて ${m} 個の元をもちます。`)], ['For dihedral groups every divisor of the order occurs; that is not true of all groups ($A_4$ has no subgroup of order 6).', '二面体群では位数のどの約数も部分群の位数として現れます。これはすべての群で成り立つわけではありません（$A_4$ には位数 6 の部分群がありません）。']]
          : [[`${m} does not divide ${2 * n}.`, `${m} は ${2 * n} を割り切りません。`], ['By Lagrange the order of a subgroup divides the order of the group, because the cosets split the group into pieces of equal size. So no.', 'ラグランジュの定理により、剰余類が群を同じ大きさの断片に分けるので、部分群の位数は群の位数を割り切ります。よってありません。']],
        set: { n },
      };
    },
  ];
})();
