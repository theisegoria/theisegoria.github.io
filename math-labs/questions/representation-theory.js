'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, gcd } = P.util;
  const PI = Math.PI, mod = (a, m) => ((a % m) + m) % m;

  /* D_n as in the experiment: index g < n is the rotation r^g, g >= n the reflection s r^(g-n); s is the mirror in the x axis */
  const rot = (a) => [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]];
  const mul2 = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  const rho = (N, g) => (g < N ? rot(2 * PI * g / N) : mul2([[1, 0], [0, -1]], rot(2 * PI * (g - N) / N)));
  const img = (N, g, j) => (g < N ? (j + g) % N : mod(-(j + g - N), N));
  const fixed = (N, g) => { let c = 0; for (let j = 0; j < N; j++) if (img(N, g, j) === j) c++; return c; };
  const name = (N, g) => (g === 0 ? 'e' : g < N ? (g === 1 ? 'r' : `r^{${g}}`) : g === N ? 's' : g === N + 1 ? 'sr' : `sr^{${g - N}}`);
  const clean = (x) => (Math.abs(x) < 1e-12 ? 0 : x);
  // exact TeX for the cosines of multiples of 2 pi / n that occur here
  function nice(x) {
    x = clean(x);
    const s = x < 0 ? '-' : '', a = Math.abs(x);
    if (Math.abs(a - Math.round(a)) < 1e-9) return String(Math.round(x));
    for (const [v, t] of [[0.5, '\\tfrac12'], [Math.SQRT1_2, '\\tfrac{\\sqrt2}{2}'], [Math.sqrt(3) / 2, '\\tfrac{\\sqrt3}{2}'], [Math.SQRT2, '\\sqrt2'], [Math.sqrt(3), '\\sqrt3'], [(Math.sqrt(5) - 1) / 2, '\\tfrac{\\sqrt5 - 1}{2}'], [(Math.sqrt(5) + 1) / 2, '\\tfrac{\\sqrt5 + 1}{2}']]) if (Math.abs(a - v) < 1e-9) return s + t;
    return n(x, 4);
  }
  const mTeX = (M) => `\\begin{pmatrix}${nice(M[0][0])} & ${nice(M[0][1])} \\\\ ${nice(M[1][0])} & ${nice(M[1][1])}\\end{pmatrix}`;

  /* ---------- 1. symmetries as matrices ---------- */
  Q['rep-matrices'] = [
    (r) => {
      const form = r.int(0, 2), N = r.int(3, 8);
      if (form === 0) {
        const k = r.int(1, N - 1), chi = 2 * Math.cos(2 * PI * k / N);
        return {
          q: [`In the 2-dimensional representation of $D_{${N}}$ by rotations and reflections of the plane, what is the character $\\chi_2(${name(N, k)})$? Give three decimals.`, `平面の回転と鏡映による $D_{${N}}$ の 2 次元表現で、指標 $\\chi_2(${name(N, k)})$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: chi, tol: 0.002, show: nice(chi) },
          hint: ['The trace of a rotation matrix by angle $\\alpha$ is $2\\cos\\alpha$.', '角度 $\\alpha$ の回転行列のトレースは $2\\cos\\alpha$ です。'],
          sol: [[`$${name(N, k)}$ turns the plane by $2\\pi\\cdot${k}/${N} = ${n(360 * k / N, 3)}^\\circ$.`, `$${name(N, k)}$ は平面を $2\\pi\\cdot${k}/${N} = ${n(360 * k / N, 3)}^\\circ$ 回します。`], [`$\\chi_2 = 2\\cos ${n(360 * k / N, 3)}^\\circ = ${nice(chi)}$${Math.abs(chi - Math.round(chi)) > 1e-9 ? ` $\\approx ${n(chi, 4)}$` : ''}. The same number for $r^{-${k}}$, which is conjugate to it.`, `$\\chi_2 = 2\\cos ${n(360 * k / N, 3)}^\\circ = ${nice(chi)}$${Math.abs(chi - Math.round(chi)) > 1e-9 ? ` $\\approx ${n(chi, 4)}$` : ''} です。共役な $r^{-${k}}$ でも同じ値になります。`]],
          set: { n: N, g: k },
        };
      }
      if (form === 1) {
        const m = r.int(0, N - 1), g = N + m, f = fixed(N, g);
        return {
          q: [`The vertices of a regular ${N}-gon sit at angles $2\\pi j/${N}$, and $s$ is the mirror in the $x$ axis. How many vertices does the reflection $${name(N, g)}$ fix? (This is its character in the permutation representation.)`, `正 ${N} 角形の頂点は角度 $2\\pi j/${N}$ にあり、$s$ は $x$ 軸での鏡映です。鏡映 $${name(N, g)}$ が固定する頂点はいくつですか（置換表現での指標です）。`],
          a: { type: 'int', v: f },
          hint: ['$s r^m$ sends vertex $j$ to $-(j + m)$; solve $2j \\equiv -m \\pmod n$.', '$s r^m$ は頂点 $j$ を $-(j + m)$ に送ります。$2j \\equiv -m \\pmod n$ を解いてください。'],
          sol: [[`Fixed vertices satisfy $2j \\equiv ${mod(-m, N)} \\pmod{${N}}$.`, `固定される頂点は $2j \\equiv ${mod(-m, N)} \\pmod{${N}}$ を満たします。`], [N % 2 ? `For odd $n$ there is exactly one solution: every mirror passes through one vertex and the midpoint of the opposite edge.` : m % 2 ? 'For even $n$ and odd $m$ there is none: this mirror runs through two edge midpoints.' : 'For even $n$ and even $m$ there are two: this mirror runs through two opposite vertices.', N % 2 ? '奇数の $n$ では解はちょうど一つで、どの鏡も一つの頂点と向かいの辺の中点を通ります。' : m % 2 ? '偶数の $n$ で $m$ が奇数なら解はありません。この鏡は二つの辺の中点を通ります。' : '偶数の $n$ で $m$ が偶数なら解は二つで、この鏡は向かい合う二つの頂点を通ります。'], [`$\\chi_{\\text{perm}}(${name(N, g)}) = ${f}$, while $\\chi_2$ of every reflection is $0$: the two representations have different characters.`, `$\\chi_{\\text{perm}}(${name(N, g)}) = ${f}$ です。一方、どの鏡映でも $\\chi_2 = 0$ なので、二つの表現の指標は異なります。`]],
          set: { n: N, g },
        };
      }
      const g = r.int(1, 2 * N - 1), refl = g >= N, o = refl ? 2 : N / gcd(N, g);
      return {
        q: [`What is the smallest $m \\ge 1$ with $\\rho(${name(N, g)})^m = I$ in the 2-dimensional representation of $D_{${N}}$?`, `$D_{${N}}$ の 2 次元表現で、$\\rho(${name(N, g)})^m = I$ となる最小の $m \\ge 1$ はいくつですか。`],
        a: { type: 'int', v: o },
        hint: ['The representation is faithful, so $\\rho(g)$ has the same order as $g$.', 'この表現は忠実なので、$\\rho(g)$ の位数は $g$ の位数と同じです。'],
        sol: refl ? [[`$\\rho(${name(N, g)})$ is a reflection matrix, eigenvalues $1$ and $-1$.`, `$\\rho(${name(N, g)})$ は鏡映の行列で、固有値は $1$ と $-1$ です。`], ['Its square is $I$, so $m = 2$.', '二乗すると $I$ なので $m = 2$ です。']]
          : [[`$\\rho(${name(N, g)})$ rotates by $2\\pi\\cdot${g}/${N}$.`, `$\\rho(${name(N, g)})$ は $2\\pi\\cdot${g}/${N}$ だけ回転させます。`], [`It returns to $I$ after $${N}/\\gcd(${N}, ${g}) = ${o}$ steps: its eigenvalues $e^{\\pm 2\\pi i\\cdot${g}/${N}}$ are primitive ${o}th roots of unity.`, `$${N}/\\gcd(${N}, ${g}) = ${o}$ 回で $I$ に戻ります。固有値 $e^{\\pm 2\\pi i\\cdot${g}/${N}}$ は 1 の原始 ${o} 乗根です。`]],
        set: { n: N, g },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([4, 4, 6, 3, 8]), g = r.int(1, 2 * N - 1), v = [r.nz(-2, 2), r.int(-2, 2)];
        const M = rho(N, g), w = [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]].map(clean);
        return {
          q: [`In the 2-dimensional representation of $D_{${N}}$, apply $\\rho(${name(N, g)})$ to $v = (${v.join(', ')})$.`, `$D_{${N}}$ の 2 次元表現で、$\\rho(${name(N, g)})$ を $v = (${v.join(', ')})$ に施してください。`],
          a: { type: 'tuple', v: w, labels: ['$x$', '$y$'], tol: 0.005 },
          hint: [g < N ? 'Write down the rotation matrix for the angle $2\\pi k/n$.' : '$\\rho(s r^m) = \\rho(s)\\rho(r^m)$: rotate first, then flip the sign of $y$.', g < N ? '角度 $2\\pi k/n$ の回転行列を書きます。' : '$\\rho(s r^m) = \\rho(s)\\rho(r^m)$ です。先に回転し、次に $y$ の符号を変えます。'],
          sol: [[`$\\rho(${name(N, g)}) = ${mTeX(M)}$.`, `$\\rho(${name(N, g)}) = ${mTeX(M)}$ です。`], [`$\\rho(${name(N, g)})\\,v = (${w.map((x) => n(x, 4)).join(',\\ ')})$.`, `$\\rho(${name(N, g)})\\,v = (${w.map((x) => n(x, 4)).join(',\\ ')})$ です。`], [`The length $\\sqrt{${v[0] ** 2 + v[1] ** 2}}$ is kept: every $\\rho(g)$ here is orthogonal.`, `長さ $\\sqrt{${v[0] ** 2 + v[1] ** 2}}$ は保たれます。ここでの $\\rho(g)$ はすべて直交行列です。`]],
          set: { n: N, g },
        };
      }
      if (form === 1) {
        const N = r.int(3, 8), g = r.int(0, 2 * N - 1), c2 = g < N ? 2 * Math.cos(2 * PI * g / N) : 0, cp = fixed(N, g);
        return {
          q: [`For the element $${name(N, g)}$ of $D_{${N}}$, give its character in the 2-dimensional representation and in the permutation representation on the ${N} vertices.`, `$D_{${N}}$ の元 $${name(N, g)}$ について、2 次元表現での指標と、${N} 個の頂点への置換表現での指標を答えてください。`],
          a: { type: 'tuple', v: [c2, cp], labels: ['$\\chi_2$', '$\\chi_{\\text{perm}}$'], tol: 0.002 },
          hint: ['The first is a trace of a $2\\times2$ matrix; the second counts fixed vertices.', '一つ目は $2\\times2$ 行列のトレース、二つ目は固定される頂点の数です。'],
          sol: [[g < N ? `A rotation by $2\\pi\\cdot${g}/${N}$: $\\chi_2 = 2\\cos(2\\pi\\cdot${g}/${N}) = ${nice(c2)}$.` : 'A reflection has eigenvalues $1$ and $-1$: $\\chi_2 = 0$.', g < N ? `$2\\pi\\cdot${g}/${N}$ の回転なので $\\chi_2 = 2\\cos(2\\pi\\cdot${g}/${N}) = ${nice(c2)}$ です。` : '鏡映の固有値は $1$ と $-1$ なので $\\chi_2 = 0$ です。'], [g === 0 ? `The identity fixes all ${N} vertices: $\\chi_{\\text{perm}} = ${N}$, the dimension.` : g < N ? 'A non-trivial rotation moves every vertex: $\\chi_{\\text{perm}} = 0$.' : `This mirror passes through ${cp} vertex${cp === 1 ? '' : 'es'}: $\\chi_{\\text{perm}} = ${cp}$.`, g === 0 ? `単位元は ${N} 個の頂点すべてを固定するので $\\chi_{\\text{perm}} = ${N}$ で、これは次元です。` : g < N ? '自明でない回転はすべての頂点を動かすので $\\chi_{\\text{perm}} = 0$ です。' : `この鏡は ${cp} 個の頂点を通るので $\\chi_{\\text{perm}} = ${cp}$ です。`]],
          set: { n: N, g },
        };
      }
      const N = r.int(3, 8), a = r.int(1, N - 1), b = r.int(1, N - 1), m = mod(b - a, N);
      return {
        q: [`In $D_{${N}}$, the product $\\rho(sr^{${a}})\\,\\rho(sr^{${b}})$ is $\\rho(r^m)$ for some $0 \\le m < ${N}$. Find $m$.`, `$D_{${N}}$ で、積 $\\rho(sr^{${a}})\\,\\rho(sr^{${b}})$ はある $0 \\le m < ${N}$ について $\\rho(r^m)$ に等しくなります。$m$ を求めてください。`],
        a: { type: 'int', v: m },
        hint: ['Use $r^a s = s r^{-a}$ to bring the two $s$ together, and $s^2 = e$.', '$r^a s = s r^{-a}$ を使って二つの $s$ を隣り合わせ、$s^2 = e$ を使います。'],
        sol: [[`$s r^{${a}}\\, s r^{${b}} = s\\,s\\,r^{-${a}} r^{${b}} = r^{${b} - ${a}}$.`, `$s r^{${a}}\\, s r^{${b}} = s\\,s\\,r^{-${a}} r^{${b}} = r^{${b} - ${a}}$ です。`], [`$${b} - ${a} \\equiv ${m} \\pmod{${N}}$. Because $\\rho$ is a homomorphism, the matrix product is $\\rho(r^{${m}})$: two reflections make a rotation by twice the angle between their mirrors.`, `$${b} - ${a} \\equiv ${m} \\pmod{${N}}$ です。$\\rho$ は準同型なので、行列の積は $\\rho(r^{${m}})$ です。二つの鏡映は、鏡の間の角度の 2 倍の回転になります。`]],
        set: { n: N, g: N + b },
      };
    },
    (r) => {
      const form = r.int(0, 2), N = r.int(3, 8);
      if (form === 0) {
        let s2 = 0; for (let g = 0; g < 2 * N; g++) s2 += fixed(N, g) ** 2;
        const ip = s2 / (2 * N);
        return {
          q: [`Compute $\\langle \\chi_{\\text{perm}}, \\chi_{\\text{perm}} \\rangle$ for $D_{${N}}$ permuting the ${N} vertices of a regular ${N}-gon.`, `正 ${N} 角形の ${N} 個の頂点を置換する $D_{${N}}$ について、$\\langle \\chi_{\\text{perm}}, \\chi_{\\text{perm}} \\rangle$ を計算してください。`],
          a: { type: 'int', v: Math.round(ip) },
          hint: ['$\\langle\\chi, \\chi\\rangle = \\frac{1}{|G|}\\sum_g \\chi(g)^2$. Only $e$ and the reflections fix any vertex.', '$\\langle\\chi, \\chi\\rangle = \\frac{1}{|G|}\\sum_g \\chi(g)^2$ です。頂点を固定するのは $e$ と鏡映だけです。'],
          sol: [[N % 2 ? `$e$ contributes $${N}^2$; each of the ${N} reflections fixes one vertex, contributing $1$.` : `$e$ contributes $${N}^2$; ${N / 2} reflections fix two vertices ($4$ each) and ${N / 2} fix none.`, N % 2 ? `$e$ は $${N}^2$ を与え、${N} 個の鏡映はそれぞれ一つの頂点を固定して $1$ ずつ与えます。` : `$e$ は $${N}^2$ を与え、${N / 2} 個の鏡映は二つの頂点を固定して $4$ ずつ、残り ${N / 2} 個は 0 を与えます。`], [`$\\langle\\chi, \\chi\\rangle = \\dfrac{${s2}}{${2 * N}} = ${Math.round(ip)}$.`, `$\\langle\\chi, \\chi\\rangle = \\dfrac{${s2}}{${2 * N}} = ${Math.round(ip)}$ です。`], [`So the permutation representation is a sum of irreducibles with $\\sum m_i^2 = ${Math.round(ip)}$: the trivial one, ${N % 2 ? `and ${(N - 1) / 2} distinct 2-dimensional ones` : `${N / 2 - 1} distinct 2-dimensional ones and one more 1-dimensional one`}, each once. It also counts the orbits of $D_{${N}}$ on pairs of vertices, one per possible distance.`, `よって置換表現は $\\sum m_i^2 = ${Math.round(ip)}$ となる既約表現の和で、自明表現と${N % 2 ? ` ${(N - 1) / 2} 個の異なる 2 次元表現` : ` ${N / 2 - 1} 個の異なる 2 次元表現ともう一つの 1 次元表現`}がそれぞれ一回ずつ現れます。これは頂点の組への $D_{${N}}$ の軌道の数、つまり距離の種類の数にも等しくなります。`]],
          set: { n: N },
        };
      }
      if (form === 1) return {
        q: [`In the 2-dimensional representation of $D_{${N}}$, write $\\chi_2(r^k)$ as a function of $k$.`, `$D_{${N}}$ の 2 次元表現で、$\\chi_2(r^k)$ を $k$ の式で表してください。`],
        a: { type: 'expr', v: `2cos(2pi*k/${N})`, vars: ['k'], dom: { k: [0.3, 3.7] }, lhs: ['$\\chi_2(r^k) =$', '$\\chi_2(r^k) =$'] },
        hint: ['$\\rho(r^k) = \\rho(r)^k$ is the rotation by $k$ times the basic angle.', '$\\rho(r^k) = \\rho(r)^k$ は基本の角度の $k$ 倍の回転です。'],
        sol: [[`$\\rho(r^k)$ rotates by $2\\pi k/${N}$, whose eigenvalues are $e^{\\pm 2\\pi i k/${N}}$.`, `$\\rho(r^k)$ は $2\\pi k/${N}$ だけ回転させ、固有値は $e^{\\pm 2\\pi i k/${N}}$ です。`], [`$\\chi_2(r^k) = e^{2\\pi i k/${N}} + e^{-2\\pi i k/${N}} = 2\\cos\\dfrac{2\\pi k}{${N}}$.`, `$\\chi_2(r^k) = e^{2\\pi i k/${N}} + e^{-2\\pi i k/${N}} = 2\\cos\\dfrac{2\\pi k}{${N}}$ です。`], ['It is even in $k$, which is the statement that $r^k$ and $r^{-k}$ are conjugate.', 'これは $k$ について偶関数で、$r^k$ と $r^{-k}$ が共役であることを表しています。']],
        set: { n: N, g: 1 },
      };
      const k = r.int(1, N - 1), c = 2 * Math.cos(2 * PI * k / N);
      let rotSame = 0; for (let j = 0; j < N; j++) if (Math.abs(2 * Math.cos(2 * PI * j / N) - c) < 1e-9) rotSame++;
      const zero = Math.abs(c) < 1e-9, total = rotSame + (zero ? N : 0);
      return {
        q: [`How many elements $g$ of $D_{${N}}$ have $\\chi_2(g) = \\chi_2(${name(N, k)})$?`, `$D_{${N}}$ の元 $g$ のうち、$\\chi_2(g) = \\chi_2(${name(N, k)})$ となるものはいくつありますか。`],
        a: { type: 'int', v: total },
        hint: ['Rotations: when is $\\cos(2\\pi j/n) = \\cos(2\\pi k/n)$? Reflections all have $\\chi_2 = 0$.', '回転について：$\\cos(2\\pi j/n) = \\cos(2\\pi k/n)$ となるのはいつでしょうか。鏡映はすべて $\\chi_2 = 0$ です。'],
        sol: [[`$\\chi_2(${name(N, k)}) = ${nice(c)}$. Among rotations, $r^j$ matches when $j \\equiv \\pm ${k}$: ${rotSame} element${rotSame === 1 ? '' : 's'}.`, `$\\chi_2(${name(N, k)}) = ${nice(c)}$ です。回転では $j \\equiv \\pm ${k}$ のとき一致し、${rotSame} 個です。`], [zero ? `The value is $0$, which every one of the ${N} reflections also has: ${total} in all.` : `The reflections have $\\chi_2 = 0 \\ne ${nice(c)}$, so ${total} in all.`, zero ? `値が $0$ なので、${N} 個の鏡映もすべて同じ値をもちます。合計 ${total} 個です。` : `鏡映は $\\chi_2 = 0 \\ne ${nice(c)}$ なので、合計 ${total} 個です。`], [zero ? 'A character is constant on conjugacy classes, but different classes may still share a value; the full table of all irreducible characters is what separates them.' : `These ${total} elements form exactly one conjugacy class.`, zero ? '指標は共役類の上で一定ですが、異なる類が同じ値をもつこともあります。類を区別するのは、すべての既約指標からなる表全体です。' : `この ${total} 個の元はちょうど一つの共役類をなします。`]],
        set: { n: N, g: k },
      };
    },
  ];

  /* ---------- 2. character tables ---------- */
  const W = [-0.5, Math.sqrt(3) / 2], W2 = [-0.5, -Math.sqrt(3) / 2];
  const GROUPS = {
    S3: { tex: 'S_3', order: 6, classes: ['e', '(12)', '(123)'], sizes: [1, 3, 2], irreps: [['\\text{trivial}', [1, 1, 1]], ['\\text{sign}', [1, -1, 1]], ['\\text{std}', [2, 0, -1]]], natural: [3, 1, 0], nat: ['permuting 3 points', '3 点の置換'] },
    D4: { tex: 'D_4', order: 8, classes: ['e', 'r^2', 'r^{\\pm1}', 's, sr^2', 'sr, sr^3'], sizes: [1, 1, 2, 2, 2], irreps: [['A_1', [1, 1, 1, 1, 1]], ['A_2', [1, 1, 1, -1, -1]], ['B_1', [1, 1, -1, 1, -1]], ['B_2', [1, 1, -1, -1, 1]], ['E', [2, -2, 0, 0, 0]]], natural: [4, 0, 0, 2, 0], nat: ['permuting the 4 vertices of a square', '正方形の 4 頂点の置換'] },
    Q8: { tex: 'Q_8', order: 8, classes: ['1', '-1', '\\pm i', '\\pm j', '\\pm k'], sizes: [1, 1, 2, 2, 2], irreps: [['\\text{trivial}', [1, 1, 1, 1, 1]], ['\\chi_i', [1, 1, 1, -1, -1]], ['\\chi_j', [1, 1, -1, 1, -1]], ['\\chi_k', [1, 1, -1, -1, 1]], ['\\rho_2', [2, -2, 0, 0, 0]]], natural: [4, -4, 0, 0, 0], nat: ['left multiplication on the quaternions', '四元数への左乗法'] },
    A4: { tex: 'A_4', order: 12, classes: ['e', '(12)(34)', '(123)', '(132)'], sizes: [1, 3, 4, 4], irreps: [['\\text{trivial}', [1, 1, 1, 1]], ['\\chi_\\omega', [1, 1, W, W2]], ['\\chi_{\\omega^2}', [1, 1, W2, W]], ['\\rho_3', [3, -1, 0, 0]]], natural: [4, 0, 1, 1], nat: ['permuting 4 points', '4 点の置換'] },
    S4: { tex: 'S_4', order: 24, classes: ['e', '(12)', '(12)(34)', '(123)', '(1234)'], sizes: [1, 6, 3, 8, 6], irreps: [['\\text{trivial}', [1, 1, 1, 1, 1]], ['\\text{sign}', [1, -1, 1, 1, -1]], ['\\rho_2', [2, 0, 2, -1, 0]], ['\\rho_3', [3, 1, -1, 0, -1]], ["\\rho_3'", [3, -1, -1, 0, 1]]], natural: [4, 2, 0, 1, 0], nat: ['permuting 4 points', '4 点の置換'] },
  };
  const LAB = { S3: 0, D4: 1, Q8: 2, A4: 3 };
  const cx = (v) => (Array.isArray(v) ? v : [v, 0]);
  const inner = (G, a, b) => { let re = 0; G.sizes.forEach((s, k) => { const x = cx(a[k]), y = cx(b[k]); re += s * (x[0] * y[0] + x[1] * y[1]); }); return re / G.order; };
  const cTeX = (z) => { const [a, b] = cx(z); if (Math.abs(b) < 1e-9) return String(Math.round(a * 1000) / 1000); return b > 0 ? '\\omega' : '\\omega^2'; };
  const chiOf = (nm) => (nm.startsWith('\\chi') ? nm : `\\chi_{${nm}}`);
  const pTeX = (z) => { const t = cTeX(z); return t.startsWith('-') ? `(${t})` : t; };
  const rowTeX = (G, chi) => `\\begin{array}{c|${'c'.repeat(G.classes.length)}} & ${G.classes.join(' & ')} \\\\ \\text{size} & ${G.sizes.join(' & ')} \\\\ \\hline \\chi & ${chi.map(cTeX).join(' & ')}\\end{array}`;
  const combine = (G, m) => G.classes.map((_, k) => { let re = 0, im = 0; G.irreps.forEach(([, ch], i) => { const z = cx(ch[k]); re += m[i] * z[0]; im += m[i] * z[1]; }); return Math.abs(im) < 1e-9 ? Math.round(re * 1e9) / 1e9 : [re, im]; });
  const decompTeX = (G, m) => m.map((mi, i) => (mi ? `${mi > 1 ? mi : ''}${G.irreps[i][0]}` : '')).filter(Boolean).join(' + ') || '0';
  Q.characters = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pool = [['S3', 'S_3', 6, [1, 1, 2]], ['D4', 'D_4', 8, [1, 1, 1, 1, 2]], ['Q8', 'Q_8', 8, [1, 1, 1, 1, 2]], ['A4', 'A_4', 12, [1, 1, 1, 3]], [null, 'S_4', 24, [1, 1, 2, 3, 3]], [null, 'D_5', 10, [1, 1, 2, 2]], [null, 'D_6', 12, [1, 1, 1, 1, 2, 2]], [null, 'A_5', 60, [1, 3, 3, 4, 5]]];
        const [key, gt, ord, dims] = r.pick(pool), miss = dims[dims.length - 1], shown = dims.slice(0, -1);
        return {
          q: [`$${gt}$ has order ${ord}. Its irreducible representations have dimensions ${shown.join(', ')} and one more, the largest. What is its dimension?`, `$${gt}$ の位数は ${ord} です。既約表現の次元は ${shown.join('、')} ともう一つ（最大のもの）です。その次元はいくつですか。`],
          a: { type: 'int', v: miss },
          hint: ['The squares of the dimensions add up to the order of the group.', '次元の二乗の和は群の位数に等しくなります。'],
          sol: [[`$\\sum d_i^2 = |G|$: $${shown.map((d) => `${d}^2`).join(' + ')} + d^2 = ${ord}$.`, `$\\sum d_i^2 = |G|$ より $${shown.map((d) => `${d}^2`).join(' + ')} + d^2 = ${ord}$ です。`], [`$d^2 = ${ord - shown.reduce((s, d) => s + d * d, 0)}$, so $d = ${miss}$. Each irreducible occurs $d_i$ times in the regular representation, which has dimension $|G|$.`, `$d^2 = ${ord - shown.reduce((s, d) => s + d * d, 0)}$ より $d = ${miss}$ です。各既約表現は次元 $|G|$ の正則表現に $d_i$ 回ずつ現れます。`]],
          set: key ? { grp: LAB[key], rep: 0 } : undefined,
        };
      }
      if (form === 1) {
        const key = r.pick(Object.keys(GROUPS)), G = GROUPS[key];
        return {
          q: [`The conjugacy classes of $${G.tex}$ have sizes ${G.sizes.join(', ')}. How many irreducible representations does it have?`, `$${G.tex}$ の共役類の大きさは ${G.sizes.join('、')} です。既約表現はいくつありますか。`],
          a: { type: 'int', v: G.sizes.length },
          hint: ['Characters are functions on classes, and the irreducible ones form an orthonormal basis of them.', '指標は類の上の関数で、既約指標はその正規直交基底をなします。'],
          sol: [[`There are ${G.sizes.length} classes (sizes adding up to $|G| = ${G.order}$).`, `類は ${G.sizes.length} 個あります（大きさの和は $|G| = ${G.order}$）。`], [`The number of irreducible representations equals the number of conjugacy classes: ${G.sizes.length}, so the character table is square.`, `既約表現の数は共役類の数に等しく ${G.sizes.length} 個です。だから指標表は正方形になります。`]],
          set: key in LAB ? { grp: LAB[key] } : undefined,
        };
      }
      const key = r.pick(Object.keys(GROUPS)), G = GROUPS[key], i = r.int(0, G.irreps.length - 1);
      return {
        q: [`In the regular representation of $${G.tex}$ (order ${G.order}), how many times does the irreducible $${G.irreps[i][0]}$ of dimension ${cx(G.irreps[i][1][0])[0]} occur?`, `$${G.tex}$（位数 ${G.order}）の正則表現に、次元 ${cx(G.irreps[i][1][0])[0]} の既約表現 $${G.irreps[i][0]}$ は何回現れますか。`],
        a: { type: 'int', v: cx(G.irreps[i][1][0])[0] },
        hint: ['The regular character is $|G|$ at $e$ and $0$ elsewhere. Take its inner product with $\\chi_i$.', '正則指標は $e$ で $|G|$、それ以外で $0$ です。$\\chi_i$ との内積を取ります。'],
        sol: [[`$m_i = \\frac{1}{${G.order}}\\cdot ${G.order}\\cdot\\chi_i(e) = \\chi_i(e)$.`, `$m_i = \\frac{1}{${G.order}}\\cdot ${G.order}\\cdot\\chi_i(e) = \\chi_i(e)$ です。`], [`So $m_i = d_i = ${cx(G.irreps[i][1][0])[0]}$: every irreducible occurs as often as its dimension.`, `よって $m_i = d_i = ${cx(G.irreps[i][1][0])[0]}$ で、どの既約表現も次元と同じ回数だけ現れます。`]],
        set: key in LAB ? { grp: LAB[key], rep: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const key = r.pick(['S3', 'D4', 'Q8', 'A4', 'S4']), G = GROUPS[key];
      if (form === 2) {
        const chi = G.natural, m = G.irreps.map(([, ch]) => Math.round(inner(G, chi, ch)));
        return {
          q: [`Decompose the representation of $${G.tex}$ by ${G.nat[0]}, whose character is below. Give the multiplicity of each irreducible, in table order. $${rowTeX(G, chi)}$`, `$${G.tex}$ の${G.nat[1]}による表現を分解してください。指標は下のとおりです。各既約表現の重複度を表の順に答えてください。 $${rowTeX(G, chi)}$`],
          a: { type: 'tuple', v: m, labels: G.irreps.map(([nm]) => `$${nm}$`), tol: 0.01 },
          hint: ['$m_i = \\frac{1}{|G|}\\sum_C |C|\\,\\chi(C)\\,\\overline{\\chi_i(C)}$, one inner product per row of the table.', '$m_i = \\frac{1}{|G|}\\sum_C |C|\\,\\chi(C)\\,\\overline{\\chi_i(C)}$ で、表の行ごとに内積を一つ取ります。'],
          sol: [[`For example, the trivial row gives $\\frac{1}{${G.order}}(${G.sizes.map((s, k) => `${s}\\cdot ${pTeX(chi[k])}`).join(' + ')}) = ${m[0]}$: the number of orbits.`, `たとえば自明表現の行では $\\frac{1}{${G.order}}(${G.sizes.map((s, k) => `${s}\\cdot ${pTeX(chi[k])}`).join(' + ')}) = ${m[0]}$ で、これは軌道の数です。`], [`All rows: $\\chi = ${decompTeX(G, m)}$, and $\\langle\\chi, \\chi\\rangle = ${m.reduce((s, x) => s + x * x, 0)}$ agrees with $\\sum m_i^2$.`, `すべての行で計算すると $\\chi = ${decompTeX(G, m)}$ で、$\\langle\\chi, \\chi\\rangle = ${m.reduce((s, x) => s + x * x, 0)}$ は $\\sum m_i^2$ と一致します。`]],
          set: key in LAB ? { grp: LAB[key], rep: 1 } : undefined,
        };
      }
      // a random combination of irreducibles; complex conjugate pairs get equal weight so the character is real
      let m;
      do { m = G.irreps.map(() => r.int(0, 2)); if (key === 'A4') m[2] = m[1]; } while (m.every((x) => x === 0) || m.reduce((s, x) => s + x, 0) < 2);
      const chi = combine(G, m);
      if (form === 0) {
        const i = r.int(0, G.irreps.length - 1);
        return {
          q: [`A representation of $${G.tex}$ has the character below. How many times does $${G.irreps[i][0]}$ occur in it? $${rowTeX(G, chi)}$`, `$${G.tex}$ のある表現の指標は下のとおりです。$${G.irreps[i][0]}$ は何回現れますか。 $${rowTeX(G, chi)}$`],
          a: { type: 'int', v: Math.round(inner(G, chi, G.irreps[i][1])) },
          hint: ['Take the inner product with that row of the character table, weighting each class by its size.', '指標表のその行との内積を、各類をその大きさで重み付けして取ります。'],
          sol: [[`$\\langle\\chi, ${chiOf(G.irreps[i][0])}\\rangle = \\frac{1}{${G.order}}\\left(${G.sizes.map((s, k) => `${s}\\cdot ${pTeX(chi[k])}\\cdot ${pTeX(G.irreps[i][1][k])}`).join(' + ')}\\right)${key === 'A4' && i > 0 && i < 3 ? '$ (with $\\omega\\bar\\omega = 1$, $\\omega^2 + \\bar\\omega^2 = -1$)' : '$'}.`, `$\\langle\\chi, ${chiOf(G.irreps[i][0])}\\rangle = \\frac{1}{${G.order}}\\left(${G.sizes.map((s, k) => `${s}\\cdot ${pTeX(chi[k])}\\cdot ${pTeX(G.irreps[i][1][k])}`).join(' + ')}\\right)${key === 'A4' && i > 0 && i < 3 ? '$（$\\omega\\bar\\omega = 1$、$\\omega^2 + \\bar\\omega^2 = -1$ を使います）' : '$'} です。`], [`$= ${Math.round(inner(G, chi, G.irreps[i][1]))}$. The full decomposition is $\\chi = ${decompTeX(G, m)}$.`, `$= ${Math.round(inner(G, chi, G.irreps[i][1]))}$ です。全体の分解は $\\chi = ${decompTeX(G, m)}$ です。`]],
        };
      }
      return {
        q: [`A representation of $${G.tex}$ has the character below. Compute $\\langle\\chi, \\chi\\rangle$. $${rowTeX(G, chi)}$`, `$${G.tex}$ のある表現の指標は下のとおりです。$\\langle\\chi, \\chi\\rangle$ を計算してください。 $${rowTeX(G, chi)}$`],
        a: { type: 'int', v: Math.round(inner(G, chi, chi)) },
        hint: ['$\\langle\\chi, \\chi\\rangle = \\frac{1}{|G|}\\sum_C |C|\\,|\\chi(C)|^2$.', '$\\langle\\chi, \\chi\\rangle = \\frac{1}{|G|}\\sum_C |C|\\,|\\chi(C)|^2$ です。'],
        sol: [[`$\\frac{1}{${G.order}}\\left(${G.sizes.map((s, k) => `${s}\\cdot ${n(cx(chi[k])[0] ** 2 + cx(chi[k])[1] ** 2, 4)}`).join(' + ')}\\right) = ${Math.round(inner(G, chi, chi))}$.`, `$\\frac{1}{${G.order}}\\left(${G.sizes.map((s, k) => `${s}\\cdot ${n(cx(chi[k])[0] ** 2 + cx(chi[k])[1] ** 2, 4)}`).join(' + ')}\\right) = ${Math.round(inner(G, chi, chi))}$ です。`], [`This is $\\sum m_i^2$ for $\\chi = ${decompTeX(G, m)}$. ${Math.round(inner(G, chi, chi)) === 1 ? 'It equals 1, so the representation is irreducible.' : 'It is more than 1, so the representation is reducible.'}`, `これは $\\chi = ${decompTeX(G, m)}$ の $\\sum m_i^2$ です。${Math.round(inner(G, chi, chi)) === 1 ? '1 なので、この表現は既約です。' : '1 より大きいので、この表現は可約です。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const key = r.pick(['S3', 'D4', 'A4', 'S4', 'Q8']), G = GROUPS[key];
        const i = G.irreps.length - 1, base = G.irreps[i][1].map((z) => cx(z)[0]);
        const sq = base.map((x) => x * x), m = G.irreps.map(([, ch]) => Math.round(inner(G, sq, ch)));
        return {
          q: [`Decompose the tensor square $${G.irreps[i][0]} \\otimes ${G.irreps[i][0]}$ of $${G.tex}$ into irreducibles. Give the multiplicity of each, in table order. $${rowTeX(G, G.irreps[i][1])}$ (the row shown is $\\chi_{${G.irreps[i][0]}}$)`, `$${G.tex}$ のテンソル二乗 $${G.irreps[i][0]} \\otimes ${G.irreps[i][0]}$ を既約表現に分解し、各重複度を表の順に答えてください。 $${rowTeX(G, G.irreps[i][1])}$（示した行は $\\chi_{${G.irreps[i][0]}}$ です）`],
          a: { type: 'tuple', v: m, labels: G.irreps.map(([nm]) => `$${nm}$`), tol: 0.01 },
          hint: ['The character of a tensor product is the product of the characters, class by class.', 'テンソル積の指標は、類ごとの指標の積です。'],
          sol: [[`$\\chi_{\\otimes} = \\chi^2 = (${sq.join(', ')})$ on the classes.`, `類ごとに $\\chi_{\\otimes} = \\chi^2 = (${sq.join(', ')})$ です。`], [`Inner products with the rows give $${G.irreps[i][0]} \\otimes ${G.irreps[i][0]} = ${decompTeX(G, m)}$, dimension $${sq[0]}$.`, `各行との内積から $${G.irreps[i][0]} \\otimes ${G.irreps[i][0]} = ${decompTeX(G, m)}$ で、次元は $${sq[0]}$ です。`], key === 'Q8' ? ['The trivial representation occurs once because the character is real, so the representation is equivalent to its dual. Here the invariant is an antisymmetric form: the 2-dimensional representation of $Q_8$ is quaternionic and preserves no inner product on a real form of it.', '指標が実なので表現は双対と同値になり、自明表現がちょうど一回現れます。ここでの不変量は反対称形式です。$Q_8$ の 2 次元表現は四元数型で、実形の上の内積を保つことはありません。'] : ['The trivial representation occurs exactly once because the irreducible is real: the invariant is the inner product that the group preserves.', '既約表現が実なので自明表現はちょうど一回現れます。その不変量は、群が保つ内積です。']],
          set: key in LAB ? { grp: LAB[key], rep: 2 } : undefined,
        };
      }
      if (form === 1) {
        const N = r.int(3, 12), c = N % 2 ? (N + 3) / 2 : (N + 6) / 2, b = (2 * N - c) / 3;
        return {
          q: [`$D_{${N}}$ has order ${2 * N} and ${c} conjugacy classes, and all its irreducible representations have dimension 1 or 2. How many are 2-dimensional?`, `$D_{${N}}$ は位数 ${2 * N}、共役類 ${c} 個で、既約表現の次元はすべて 1 か 2 です。2 次元のものはいくつありますか。`],
          a: { type: 'int', v: b },
          hint: ['Two equations: the count of irreducibles, and the sum of the squares of their dimensions.', '二つの式を立てます。既約表現の個数と、次元の二乗の和です。'],
          sol: [[`With $a$ one-dimensional and $b$ two-dimensional: $a + b = ${c}$ and $a + 4b = ${2 * N}$.`, `1 次元が $a$ 個、2 次元が $b$ 個とすると $a + b = ${c}$、$a + 4b = ${2 * N}$ です。`], [`Subtracting, $3b = ${2 * N - c}$, so $b = ${b}$ and $a = ${c - b}$.`, `引き算して $3b = ${2 * N - c}$ より $b = ${b}$、$a = ${c - b}$ です。`], [`They are the representations $r \\mapsto$ rotation by $2\\pi j/${N}$ for $1 \\le j < ${N}/2$, the ones that drive the ring of beads in the next experiment.`, `それらは $1 \\le j < ${N}/2$ について $r \\mapsto$（$2\\pi j/${N}$ の回転）とする表現で、次の実験のビーズの環を動かすものです。`]],
        };
      }
      const key = r.pick(['S3', 'D4', 'Q8', 'S4']), G = GROUPS[key];
      let m; do { m = G.irreps.map(() => (r.chance(0.35) ? 1 : 0)); if (r.chance(0.3)) m[r.int(0, m.length - 1)] = 2; } while (m.every((x) => x === 0));
      const chi = combine(G, m), nn = m.reduce((s, x) => s + x * x, 0), distinct = m.filter((x) => x > 0).length, rep = m.some((x) => x > 1);
      const v = nn === 1 ? 0 : !rep ? 1 : 2;
      return {
        q: [`A representation of $${G.tex}$ has the character below. Which describes it? $${rowTeX(G, chi)}$`, `$${G.tex}$ のある表現の指標は下のとおりです。どれに当てはまりますか。 $${rowTeX(G, chi)}$`],
        a: { type: 'choice', opts: [['Irreducible', '既約'], ['A sum of different irreducibles, each once', '異なる既約表現の和で、それぞれ一回ずつ'], ['Some irreducible occurs more than once', 'ある既約表現が二回以上現れる']], v, fixed: true },
        hint: ['$\\langle\\chi, \\chi\\rangle = \\sum m_i^2$ tells you a lot; if it is not decisive, compute the multiplicities.', '$\\langle\\chi, \\chi\\rangle = \\sum m_i^2$ から多くがわかります。それで決まらなければ重複度を計算してください。'],
        sol: [[`$\\langle\\chi, \\chi\\rangle = ${nn}$.`, `$\\langle\\chi, \\chi\\rangle = ${nn}$ です。`], [`The multiplicities give $\\chi = ${decompTeX(G, m)}$: ${nn === 1 ? 'irreducible' : rep ? 'an irreducible repeats' : `${distinct} different irreducibles, each once`}.`, `重複度から $\\chi = ${decompTeX(G, m)}$ で、${nn === 1 ? '既約です' : rep ? '既約表現が繰り返されています' : `${distinct} 個の異なる既約表現がそれぞれ一回ずつ現れます`}。`], [nn === 4 ? 'Here $\\langle\\chi, \\chi\\rangle = 4$ alone could mean four distinct irreducibles or one twice, so the multiplicities had to be computed.' : 'Orthonormality turns a question about invariant subspaces into arithmetic on one row of numbers.', nn === 4 ? 'ここでは $\\langle\\chi, \\chi\\rangle = 4$ だけでは、四つの異なる既約表現か一つが二回かを区別できないので、重複度を計算する必要があります。' : '正規直交性のおかげで、不変部分空間の問題が一行の数の計算になります。']],
      };
    },
  ];

  /* ---------- 3. ring of beads ---------- */
  const W0 = (N, q) => 2 * Math.abs(Math.sin(PI * q / N));
  const modeIndex = (N, q) => (q === 0 ? 0 : 2 * q < N ? 2 * q - 1 : N - 1);   // position of wave q among the sorted frequencies (q <= n/2)
  Q['ring-vibrations'] = [
    (r) => {
      const form = r.int(0, 2), N = r.int(3, 12);
      if (form === 0) {
        const q = r.int(1, Math.floor(N / 2)), w = W0(N, q);
        return {
          q: [`A symmetric ring of ${N} equal beads. What is the frequency $\\omega_q/\\omega_0$ of the wave with $q = ${q}$? Give four decimals.`, `${N} 個の等しいビーズの対称な環で、$q = ${q}$ の波の振動数 $\\omega_q/\\omega_0$ はいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: w, tol: 2e-4 },
          hint: ['$\\omega_q = 2\\omega_0\\,|\\sin(\\pi q/n)|$.', '$\\omega_q = 2\\omega_0\\,|\\sin(\\pi q/n)|$ です。'],
          sol: [[`$2\\sin(\\pi\\cdot${q}/${N}) = 2\\sin ${n(180 * q / N, 3)}^\\circ = ${n(w, 5)}$.`, `$2\\sin(\\pi\\cdot${q}/${N}) = 2\\sin ${n(180 * q / N, 3)}^\\circ = ${n(w, 5)}$ です。`], [2 * q === N ? 'This is the zigzag mode, neighbours moving oppositely: the highest frequency, $2\\omega_0$, and it has no partner.' : `The wave $q = ${N - q}$, its mirror image, has the same frequency.`, 2 * q === N ? 'これは隣どうしが逆向きに動くジグザグのモードで、最高の振動数 $2\\omega_0$ をもち、相手はいません。' : `その鏡像である $q = ${N - q}$ の波も同じ振動数をもちます。`]],
          set: { n: N, m: modeIndex(N, q), mu: 1 },
        };
      }
      if (form === 1) {
        const q = r.int(1, N - 1), p = N - q;
        return {
          q: [`In a symmetric ring of ${N} beads, which other wave number $q'$ in $1, \\dots, ${N - 1}$ has the same frequency as $q = ${q}$${2 * q === N ? ' (answer $q$ itself if there is none)' : ''}?`, `${N} 個のビーズの対称な環で、$q = ${q}$ と同じ振動数をもつ、$1, \\dots, ${N - 1}$ の中の別の波数 $q'$ はどれですか${2 * q === N ? '（なければ $q$ 自身を答えてください）' : ''}。`],
          a: { type: 'int', v: p },
          hint: ['$\\sin^2(\\pi q/n)$ is unchanged by $q \\mapsto n - q$. What does that do to the wave?', '$\\sin^2(\\pi q/n)$ は $q \\mapsto n - q$ で変わりません。それは波に何をするでしょうか。'],
          sol: [[`$|\\sin(\\pi(${N} - ${q})/${N})| = |\\sin(\\pi - \\pi\\cdot${q}/${N})| = |\\sin(\\pi\\cdot${q}/${N})|$.`, `$|\\sin(\\pi(${N} - ${q})/${N})| = |\\sin(\\pi - \\pi\\cdot${q}/${N})| = |\\sin(\\pi\\cdot${q}/${N})|$ です。`], [2 * q === N ? `Here $${N} - ${q} = ${q}$: this mode is alone, a one-dimensional representation.` : `$q' = ${p}$: the same wave running the other way round, its mirror image. Together they span one two-dimensional irreducible representation, so the shared frequency is forced by symmetry.`, 2 * q === N ? `ここでは $${N} - ${q} = ${q}$ で、このモードは単独、つまり 1 次元表現です。` : `$q' = ${p}$ で、逆向きに回る同じ波、つまり鏡像です。二つで一つの 2 次元既約表現を張るので、振動数の一致は対称性によって強いられます。`]],
          set: { n: N, mu: 1 },
        };
      }
      const d = Math.floor(N / 2) + 1;
      return {
        q: [`How many different frequencies (counting $\\omega = 0$) does a symmetric ring of ${N} equal beads have?`, `${N} 個の等しいビーズの対称な環には、何種類の振動数（$\\omega = 0$ を含む）がありますか。`],
        a: { type: 'int', v: d },
        hint: ['Pair the waves $q$ and $n - q$.', '波 $q$ と $n - q$ を組にしてください。'],
        sol: [[`$q = 0$ is the rigid motion, $\\omega = 0$. ${N % 2 ? `The other ${N - 1} waves form ${(N - 1) / 2} pairs.` : `$q = ${N / 2}$ is alone, and the other ${N - 2} waves form ${(N - 2) / 2} pairs.`}`, `$q = 0$ は剛体運動で $\\omega = 0$ です。${N % 2 ? `残り ${N - 1} 個の波は ${(N - 1) / 2} 組になります。` : `$q = ${N / 2}$ は単独で、残り ${N - 2} 個の波は ${(N - 2) / 2} 組になります。`}`], [`So ${d} distinct frequencies for ${N} modes, $\\lfloor ${N}/2 \\rfloor + 1$: one per irreducible representation of $D_{${N}}$ that occurs.`, `よって ${N} 個のモードに対して振動数は $\\lfloor ${N}/2 \\rfloor + 1 = ${d}$ 種類で、現れる $D_{${N}}$ の既約表現一つにつき一つです。`]],
        set: { n: N, mu: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2), N = r.int(4, 12);
      if (form === 0) {
        const F = r.pick([20, 40, 50, 80, 100]), a = r.pick([0.05, 0.1, 0.15, 0.2]), m = r.pick([0.005, 0.01, 0.02, 0.05]), q = r.int(1, Math.floor(N / 2));
        const w0 = Math.sqrt(F / (m * a)), f = W0(N, q) * w0 / (2 * PI);
        return {
          q: [`A ring of ${N} beads of mass ${n(m * 1000)} g each, spaced $a = ${n(a * 100)}$ cm apart on a string under tension $F = ${F}$ N. What is the frequency in hertz of the wave $q = ${q}$?`, `質量 ${n(m * 1000)} g のビーズ ${N} 個が、張力 $F = ${F}$ N の弦に間隔 $a = ${n(a * 100)}$ cm で並んだ環です。$q = ${q}$ の波の振動数は何ヘルツですか。`],
          a: { type: 'num', v: f, rel: 0.005, unit: ['Hz', 'Hz'] },
          hint: ['First $\\omega_0 = \\sqrt{F/(ma)}$, then $\\omega_q = 2\\omega_0\\sin(\\pi q/n)$, then $f = \\omega/2\\pi$.', 'まず $\\omega_0 = \\sqrt{F/(ma)}$、次に $\\omega_q = 2\\omega_0\\sin(\\pi q/n)$、最後に $f = \\omega/2\\pi$ です。'],
          sol: [[`$\\omega_0 = \\sqrt{${F}/(${n(m)}\\times${n(a)})} = ${sig(w0, 4)}$ rad/s.`, `$\\omega_0 = \\sqrt{${F}/(${n(m)}\\times${n(a)})} = ${sig(w0, 4)}$ rad/s です。`], [`$\\omega_{${q}} = 2\\times${sig(w0, 4)}\\times\\sin(\\pi\\cdot${q}/${N}) = ${sig(W0(N, q) * w0, 4)}$ rad/s, so $f = ${sig(f, 4)}$ Hz.`, `$\\omega_{${q}} = 2\\times${sig(w0, 4)}\\times\\sin(\\pi\\cdot${q}/${N}) = ${sig(W0(N, q) * w0, 4)}$ rad/s なので、$f = ${sig(f, 4)}$ Hz です。`], ['An audible pitch for a few grams on a taut string; the whole spectrum is fixed by this one scale $\\omega_0$ and the symmetry.', '張った弦の数グラムのビーズとしては可聴域の高さです。スペクトル全体は、この一つの尺度 $\\omega_0$ と対称性で決まります。']],
          set: { n: N, m: modeIndex(N, q), mu: 1 },
        };
      }
      if (form === 1) {
        const top = W0(N, Math.floor(N / 2)), low = W0(N, 1);
        return {
          q: [`In a symmetric ring of ${N} beads, what is the ratio of the highest frequency to the lowest non-zero frequency? Give three decimals.`, `${N} 個のビーズの対称な環で、最高の振動数と 0 でない最低の振動数の比はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: top / low, tol: 0.002 },
          hint: ['The highest is the $q$ nearest $n/2$, the lowest non-zero is $q = 1$.', '最高は $n/2$ に最も近い $q$、0 でない最低は $q = 1$ です。'],
          sol: [[`Highest: $2\\sin(\\pi\\cdot${Math.floor(N / 2)}/${N}) = ${n(top, 4)}$. Lowest non-zero: $2\\sin(\\pi/${N}) = ${n(low, 4)}$.`, `最高は $2\\sin(\\pi\\cdot${Math.floor(N / 2)}/${N}) = ${n(top, 4)}$、0 でない最低は $2\\sin(\\pi/${N}) = ${n(low, 4)}$ です。`], [`Ratio $${n(top / low, 4)}$, growing roughly like $${N}/\\pi$ as the ring gets longer: a long chain has slow long waves and fast zigzags.`, `比は $${n(top / low, 4)}$ で、環が長くなるとおよそ $${N}/\\pi$ のように増えます。長い鎖には遅い長波長の波と速いジグザグがあります。`]],
          set: { n: N, mu: 1 },
        };
      }
      const pairs = Math.floor((N - 1) / 2);
      return {
        q: [`A symmetric ring of ${N} equal beads has ${N} normal modes. How many of its frequencies are shared by exactly two modes?`, `${N} 個の等しいビーズの対称な環には ${N} 個の基準振動があります。ちょうど二つのモードが共有する振動数はいくつありますか。`],
        a: { type: 'int', v: pairs },
        hint: ['Which waves $q$ are their own mirror image $n - q$?', 'どの波 $q$ が自分自身の鏡像 $n - q$ になるでしょうか。'],
        sol: [[N % 2 ? '$q = 0$ is its own mirror image and stands alone.' : `$q = 0$ and $q = ${N / 2}$ equal their own mirror images and stand alone.`, `$q = 0$${N % 2 ? '' : ` と $q = ${N / 2}$`} は自分自身の鏡像で、単独です。`], [`The remaining ${N - (N % 2 ? 1 : 2)} waves pair off: ${pairs} doubly degenerate frequencies, one per two-dimensional irreducible representation of $D_{${N}}$.`, `残りの ${N - (N % 2 ? 1 : 2)} 個の波が組になり、二重に縮退した振動数は ${pairs} 個で、$D_{${N}}$ の 2 次元既約表現一つにつき一つです。`]],
        set: { n: N, mu: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2), N = r.int(4, 12);
      if (form === 0) {
        const mu = r.pick([1.5, 2, 2.5, 3, 4]), u = Math.floor((N - 1) / 2) + 1;
        return {
          q: [`Bead 1 of a ring of ${N} beads is made ${n(mu)} times heavier. How many of the ${N} frequencies stay exactly the same as for the symmetric ring (count $\\omega = 0$)?`, `${N} 個のビーズの環でビーズ 1 を ${n(mu)} 倍重くします。${N} 個の振動数のうち、対称な環とまったく同じままのものはいくつありますか（$\\omega = 0$ も数えます）。`],
          a: { type: 'int', v: u },
          hint: ['Only the mirror through bead 1 survives. A mode that is odd under it has a node at bead 1.', '残る対称はビーズ 1 を通る鏡映だけです。それについて奇のモードはビーズ 1 に節をもちます。'],
          sol: [[`Each of the ${Math.floor((N - 1) / 2)} degenerate pairs can be rotated so that one member is $\\sin(2\\pi q j/${N})$, which vanishes at bead 1: that mode never moves the heavy bead and keeps its frequency exactly.`, `${Math.floor((N - 1) / 2)} 組の縮退した対は、一方が $\\sin(2\\pi q j/${N})$ となるように選べ、これはビーズ 1 で 0 になります。このモードは重いビーズを動かさないので、振動数を正確に保ちます。`], [`The rigid motion of the whole ring still has $\\omega = 0$. Every other mode moves bead 1 and slows down.`, `環全体の剛体運動は $\\omega = 0$ のままです。それ以外のモードはすべてビーズ 1 を動かし、遅くなります。`], [`Unchanged: $${Math.floor((N - 1) / 2)} + 1 = ${u}$ of the ${N}.`, `変わらないのは ${N} 個中 $${Math.floor((N - 1) / 2)} + 1 = ${u}$ 個です。`]],
          set: { n: N, mu },
        };
      }
      if (form === 1) {
        const q = r.int(1, Math.floor((N - 1) / 2)), mu = r.pick([2, 3, 4, 1.5]), w = W0(N, q);
        return {
          q: [`With bead 1 made ${n(mu)} times heavier, the degenerate pair $q = ${q}$, $q = ${N - q}$ of a ${N}-bead ring splits in two. What is $\\omega/\\omega_0$ of the member that is odd under the mirror through bead 1? Give four decimals.`, `ビーズ 1 を ${n(mu)} 倍重くすると、${N} 個のビーズの環の縮退した対 $q = ${q}$、$q = ${N - q}$ が二つに分かれます。ビーズ 1 を通る鏡映について奇であるモードの $\\omega/\\omega_0$ はいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: w, tol: 2e-4 },
          hint: ['An odd mode has a node exactly at the heavy bead. Does it notice the mass?', '奇のモードは重いビーズのところにちょうど節をもちます。質量に気づくでしょうか。'],
          sol: [['The odd combination $u_j = \\sin(2\\pi q j/n)$ is zero at bead 1, so the extra mass is multiplied by zero in the equations of motion.', '奇の組み合わせ $u_j = \\sin(2\\pi q j/n)$ はビーズ 1 で 0 なので、運動方程式で余分な質量には 0 が掛かります。'], [`It keeps the symmetric value $2\\sin(\\pi\\cdot${q}/${N}) = ${n(w, 5)}$, independent of $\\mu$.`, `対称な場合の値 $2\\sin(\\pi\\cdot${q}/${N}) = ${n(w, 5)}$ を保ち、$\\mu$ によりません。`], ['Its even partner moves bead 1 and drops below this value: the split you see in the frequency plot.', '偶の相手はビーズ 1 を動かすのでこの値より下がります。振動数の図で見える分裂です。']],
          set: { n: N, mu },
        };
      }
      const w = 2 * Math.sin(PI / (2 * N));
      return {
        q: [`Let bead 1 of a ${N}-bead ring become infinitely heavy ($\\mu \\to \\infty$). What does the lowest non-zero frequency $\\omega/\\omega_0$ of the remaining beads tend to? Give four decimals.`, `${N} 個のビーズの環でビーズ 1 を無限に重くします（$\\mu \\to \\infty$）。残りのビーズの 0 でない最低の振動数 $\\omega/\\omega_0$ はどこに近づきますか（小数第4位まで）。`],
        a: { type: 'num', v: w, tol: 2e-4 },
        hint: ['An immovable bead is a fixed end. The other beads form a chain of $n - 1$ beads between two fixed ends, $n$ spacings long.', '動かないビーズは固定端です。残りのビーズは、二つの固定端の間の $n - 1$ 個のビーズの鎖（間隔 $n$ 個分）になります。'],
        sol: [[`A chain of $${N - 1}$ beads fixed at both ends has modes $u_j = \\sin(p\\pi j/${N})$ with $\\omega_p = 2\\omega_0\\sin(p\\pi/${2 * N})$, $p = 1, \\dots, ${N - 1}$.`, `両端を固定した $${N - 1}$ 個のビーズの鎖のモードは $u_j = \\sin(p\\pi j/${N})$ で、$\\omega_p = 2\\omega_0\\sin(p\\pi/${2 * N})$（$p = 1, \\dots, ${N - 1}$）です。`], [`The lowest is $p = 1$: $2\\sin(\\pi/${2 * N}) = ${n(w, 5)}$, below the symmetric ring's lowest $2\\sin(\\pi/${N}) = ${n(W0(N, 1), 4)}$.`, `最低は $p = 1$ で $2\\sin(\\pi/${2 * N}) = ${n(w, 5)}$ で、対称な環の最低値 $2\\sin(\\pi/${N}) = ${n(W0(N, 1), 4)}$ より下です。`], ['The even $p$ are exactly the odd modes of the ring, unchanged at every $\\mu$; the odd $p$ are where the even modes end up.', '偶数の $p$ はちょうど環の奇のモードで、どの $\\mu$ でも変わりません。奇数の $p$ は偶のモードの行き着く先です。']],
        set: { n: N, mu: 4 },
      };
    },
  ];
})();
