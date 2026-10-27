'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, mat, terms } = P.util;
  const PI = Math.PI;
  const pn = (x, p) => x.reduce((s, t) => s + Math.abs(t) ** p, 0) ** (1 / p);
  const vec = (x) => `(${x.join(',\\ ')})`;
  const sqrtTeX = (k) => { // simplest radical form of sqrt(k), k a positive integer
    let a = 1, b = k;
    for (let d = 2; d * d <= b; d++) while (b % (d * d) === 0) { b /= d * d; a *= d; }
    return b === 1 ? String(a) : `${a === 1 ? '' : a}\\sqrt{${b}}`;
  };

  /* ---------- 1. unit balls ---------- */
  Q.norms = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const dim = r.pick([2, 3]);
        const x = Array.from({ length: dim }, () => r.nz(-6, 6));
        const which = r.pick([1, 2, Infinity]);
        const v = which === Infinity ? Math.max(...x.map(Math.abs)) : pn(x, which);
        const sq = x.reduce((s, t) => s + t * t, 0);
        const name = which === Infinity ? '\\infty' : String(which);
        const steps = which === 1 ? `$|${x.join('| + |')}| = ${v}$` : which === 2 ? `$\\sqrt{${x.map((t) => `${t < 0 ? `(${t})` : t}^2`).join(' + ')}} = \\sqrt{${sq}} = ${sqrtTeX(sq)}$` : `$\\max(${x.map((t) => `|${t}|`).join(', ')}) = ${v}$`;
        return {
          q: [`Compute $\\|x\\|_${name === '\\infty' ? '\\infty' : name}$ for $x = ${vec(x)}$.`, `$x = ${vec(x)}$ の $\\|x\\|_${name === '\\infty' ? '\\infty' : name}$ を計算してください。`],
          a: { type: 'num', v, show: which === 2 ? sqrtTeX(sq) : undefined },
          hint: [which === 1 ? 'Add the absolute values.' : which === 2 ? 'Square, add, take the square root.' : 'Take the largest absolute value.', which === 1 ? '絶対値を足します。' : which === 2 ? '2乗して足し、平方根をとります。' : '絶対値の最大をとります。'],
          sol: [[`${steps}.`, `${steps} です。`], [`For any $x$, $\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1$; here they are $${Math.max(...x.map(Math.abs))}$, $${n(pn(x, 2), 4)}$ and $${pn(x, 1)}$.`, `どの $x$ でも $\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1$ で、ここではそれぞれ $${Math.max(...x.map(Math.abs))}$、$${n(pn(x, 2), 4)}$、$${pn(x, 1)}$ です。`]],
          set: { order: which === Infinity ? 8 : which },
        };
      }
      const k = r.int(0, 2), dim = r.pick([2, 3]);
      const ps = [['1', 1], ['2', 2], ['\\infty', 8]][k];
      const shapes2 = [['a diamond (square turned 45°)', '45°回したひし形'], ['a circle', '円'], ['a square with sides parallel to the axes', '辺が軸に平行な正方形'], ['a star with concave sides', '辺がへこんだ星形']];
      const shapes3 = [['an octahedron', '正八面体'], ['a sphere', '球'], ['a cube with faces parallel to the axes', '面が軸に平行な立方体'], ['a star with concave faces', '面がへこんだ星形']];
      const sh = dim === 2 ? shapes2 : shapes3;
      return {
        q: [`In $\\mathbb R^${dim}$, what shape is the unit ball $\\{\\|x\\|_${ps[0]} \\le 1\\}$?`, `$\\mathbb R^${dim}$ で単位球 $\\{\\|x\\|_${ps[0]} \\le 1\\}$ はどんな形ですか。`],
        a: { type: 'choice', opts: sh, v: k },
        hint: ['Find where the ball meets the axes, and whether the boundary is flat, round or cornered between them.', '球が軸と交わる点と、その間の境界が平らか、丸いか、角があるかを調べます。'],
        sol: [[k === 0 ? `$|x_1| + \\dots + |x_${dim}| \\le 1$ is cut out by flat faces through the points $\\pm e_i$.` : k === 1 ? 'The sum of squares $\\le 1$ is the round ball.' : `$\\max_i |x_i| \\le 1$ means every coordinate lies in $[-1, 1]$.`, k === 0 ? `$|x_1| + \\dots + |x_${dim}| \\le 1$ は点 $\\pm e_i$ を通る平らな面で切り取られます。` : k === 1 ? '2乗和 $\\le 1$ は丸い球です。' : `$\\max_i |x_i| \\le 1$ はすべての座標が $[-1, 1]$ に入ることです。`], [`So the ball is ${sh[k][0]}. Every $p$-ball contains the $p = 1$ ball and lies inside the $p = \\infty$ ball.`, `したがって単位球は${sh[k][1]}です。どの $p$ の球も $p = 1$ の球を含み、$p = \\infty$ の球の内側にあります。`]],
        set: { order: ps[1] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([3, 4, 0.5, 1.5]);
        let x; do { x = [r.int(-3, 3), r.int(-3, 3), r.int(0, 2)]; } while (x.filter((t) => t !== 0).length < 2);
        const v = pn(x, p);
        return {
          q: [`Compute $\\|x\\|_{${n(p)}}$ for $x = ${vec(x)}$. Give three decimals.`, `$x = ${vec(x)}$ の $\\|x\\|_{${n(p)}}$ を計算してください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['$\\|x\\|_p = (|x_1|^p + |x_2|^p + |x_3|^p)^{1/p}$.', '$\\|x\\|_p = (|x_1|^p + |x_2|^p + |x_3|^p)^{1/p}$ です。'],
          sol: [[`$\\sum |x_i|^{${n(p)}} = ${x.map((t) => `${Math.abs(t)}^{${n(p)}}`).join(' + ')} = ${n(x.reduce((s, t) => s + Math.abs(t) ** p, 0), 5)}$.`, `$\\sum |x_i|^{${n(p)}} = ${x.map((t) => `${Math.abs(t)}^{${n(p)}}`).join(' + ')} = ${n(x.reduce((s, t) => s + Math.abs(t) ** p, 0), 5)}$ です。`], [`$\\|x\\|_{${n(p)}} = ${n(x.reduce((s, t) => s + Math.abs(t) ** p, 0), 5)}^{1/${n(p)}} = ${n(v, 4)}$. ${p < 1 ? 'With $p < 1$ this is larger than $\\|x\\|_1$, and the formula is no longer a norm.' : `It lies between $\\|x\\|_\\infty = ${Math.max(...x.map(Math.abs))}$ and $\\|x\\|_1 = ${pn(x, 1)}$.`}`, `$\\|x\\|_{${n(p)}} = ${n(x.reduce((s, t) => s + Math.abs(t) ** p, 0), 5)}^{1/${n(p)}} = ${n(v, 4)}$ です。${p < 1 ? '$p < 1$ では $\\|x\\|_1$ より大きく、この式はもはやノルムではありません。' : `$\\|x\\|_\\infty = ${Math.max(...x.map(Math.abs))}$ と $\\|x\\|_1 = ${pn(x, 1)}$ の間にあります。`}`]],
          set: { order: p },
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 3]), p = r.pick([1, 2, 3, 4]);
        const v = (1 / (a * p + 1)) ** (1 / p);
        return {
          q: [`Find the $L^${p}$ norm of $f(x) = x^{${a}}$ on $[0, 1]$, $\\|f\\|_${p} = \\left(\\int_0^1 |f|^${p}\\,dx\\right)^{1/${p}}$.`, `$[0, 1]$ 上の $f(x) = x^{${a}}$ の $L^${p}$ ノルム $\\|f\\|_${p} = \\left(\\int_0^1 |f|^${p}\\,dx\\right)^{1/${p}}$ を求めてください。`],
          a: { type: 'num', v, show: p === 1 ? frac(1, a + 1) : `\\left(\\tfrac1{${a * p + 1}}\\right)^{1/${p}}` },
          hint: ['The same recipe as for vectors, with the sum replaced by an integral.', 'ベクトルと同じ手順で、和を積分に置き換えます。'],
          sol: [[`$\\int_0^1 x^{${a * p}}\\,dx = \\tfrac1{${a * p + 1}}$.`, `$\\int_0^1 x^{${a * p}}\\,dx = \\tfrac1{${a * p + 1}}$ です。`], [`$\\|f\\|_${p} = (1/${a * p + 1})^{1/${p}} = ${n(v, 4)}$. As $p \\to \\infty$ this tends to $\\sup |f| = 1$, just as $\\|x\\|_p \\to \\|x\\|_\\infty$ for vectors.`, `$\\|f\\|_${p} = (1/${a * p + 1})^{1/${p}} = ${n(v, 4)}$ です。$p \\to \\infty$ でこれは $\\sup |f| = 1$ に近づき、ベクトルで $\\|x\\|_p \\to \\|x\\|_\\infty$ となるのと同じです。`]],
        };
      }
      const a = r.pick([1, 4, 9, 2]), b = r.pick([1, 4, 9, 16].filter((t) => t !== a));
      const s = (Math.sqrt(a) + Math.sqrt(b)) ** 2;
      return {
        q: [`Take $x = (${a}, 0)$ and $y = (0, ${b})$. Compute $\\|x + y\\|_{1/2}$, where $\\|z\\|_{1/2} = (\\sqrt{|z_1|} + \\sqrt{|z_2|})^2$, and compare it with $\\|x\\|_{1/2} + \\|y\\|_{1/2}$.`, `$x = (${a}, 0)$、$y = (0, ${b})$ とします。$\\|z\\|_{1/2} = (\\sqrt{|z_1|} + \\sqrt{|z_2|})^2$ として $\\|x + y\\|_{1/2}$ を計算し、$\\|x\\|_{1/2} + \\|y\\|_{1/2}$ と比べてください。`],
        a: { type: 'num', v: s, show: a === 2 ? `(\\sqrt2 + ${Math.sqrt(b)})^2` : undefined },
        hint: ['On a coordinate axis every $p$-norm is just the absolute value.', '座標軸上ではどの $p$ ノルムも絶対値に等しくなります。'],
        sol: [[`$\\|x + y\\|_{1/2} = (\\sqrt{${a}} + \\sqrt{${b}})^2 = ${n(s, 4)}$.`, `$\\|x + y\\|_{1/2} = (\\sqrt{${a}} + \\sqrt{${b}})^2 = ${n(s, 4)}$ です。`], [`But $\\|x\\|_{1/2} + \\|y\\|_{1/2} = ${a} + ${b} = ${a + b}$, which is smaller: the triangle inequality fails.`, `しかし $\\|x\\|_{1/2} + \\|y\\|_{1/2} = ${a} + ${b} = ${a + b}$ で、こちらの方が小さく、三角不等式が破れます。`], ['That is the algebra behind the concave star-shaped ball at $p = 1/2$: the segment from $x$ to $y$ leaves the ball scaled to reach them.', 'これが $p = 1/2$ でへこんだ星形の球になる理由です。$x$ と $y$ を結ぶ線分は、両者に届くよう拡大した球からはみ出します。']],
        set: { order: 0.5 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 1);
        if (k === 0) {
          const d = r.pick([2, 3, 4, 5]);
          return {
            q: [`Write $\\|(1, 1, \\dots, 1)\\|_p$ for the all-ones vector in $\\mathbb R^${d}$ as a function of $p$.`, `$\\mathbb R^${d}$ のすべて 1 のベクトルについて、$\\|(1, 1, \\dots, 1)\\|_p$ を $p$ の関数として書いてください。`],
            a: { type: 'expr', v: `${d}^(1/p)`, vars: ['p'], dom: { p: [1, 8] }, lhs: ['$\\|\\mathbf 1\\|_p =$', '$\\|\\mathbf 1\\|_p =$'] },
            hint: ['Every term of the sum is $1$.', '和の項はどれも $1$ です。'],
            sol: [[`$\\sum_{i=1}^{${d}} 1^p = ${d}$, so $\\|\\mathbf 1\\|_p = ${d}^{1/p}$.`, `$\\sum_{i=1}^{${d}} 1^p = ${d}$ なので $\\|\\mathbf 1\\|_p = ${d}^{1/p}$ です。`], [`It falls from $${d}$ at $p = 1$ to $1 = \\|\\mathbf 1\\|_\\infty$ as $p \\to \\infty$: the corner direction is where the balls differ most.`, `$p = 1$ での $${d}$ から、$p \\to \\infty$ で $1 = \\|\\mathbf 1\\|_\\infty$ へ減ります。角の方向こそ、球どうしの違いが最も大きい方向です。`]],
          };
        }
        const c = r.pick([2, 3, 4, 5]);
        return {
          q: [`Let $f = \\mathbf 1_{[0, 1/${c}]}$ on $[0, 1]$. Write $\\|f\\|_p$ as a function of $p$.`, `$[0, 1]$ 上で $f = \\mathbf 1_{[0, 1/${c}]}$ とします。$\\|f\\|_p$ を $p$ の関数として書いてください。`],
          a: { type: 'expr', v: `(1/${c})^(1/p)`, vars: ['p'], dom: { p: [1, 8] }, lhs: ['$\\|f\\|_p =$', '$\\|f\\|_p =$'] },
          hint: ['$|f|^p = f$ for an indicator function.', '指示関数では $|f|^p = f$ です。'],
          sol: [[`$\\int_0^1 |f|^p = \\lambda([0, 1/${c}]) = 1/${c}$ for every $p$.`, `どの $p$ でも $\\int_0^1 |f|^p = \\lambda([0, 1/${c}]) = 1/${c}$ です。`], [`$\\|f\\|_p = ${c}^{-1/p}$, which increases to $\\|f\\|_\\infty = 1$: on a space of total measure $1$, $\\|f\\|_p$ grows with $p$, the opposite of the vector case.`, `$\\|f\\|_p = ${c}^{-1/p}$ で、$\\|f\\|_\\infty = 1$ へ増加します。全測度 $1$ の空間では $\\|f\\|_p$ は $p$ とともに増え、ベクトルの場合と逆になります。`]],
        };
      }
      if (form === 1) {
        const d = r.pick([2, 3, 4, 9, 16, 5]), which = r.int(0, 1);
        return {
          q: [which === 0 ? `What is the smallest constant $C$ with $\\|x\\|_1 \\le C\\,\\|x\\|_2$ for every $x \\in \\mathbb R^${d === 16 ? '{16}' : d}$?` : `What is the smallest constant $C$ with $\\|x\\|_2 \\le C\\,\\|x\\|_\\infty$ for every $x \\in \\mathbb R^${d === 16 ? '{16}' : d}$?`, which === 0 ? `すべての $x \\in \\mathbb R^${d === 16 ? '{16}' : d}$ で $\\|x\\|_1 \\le C\\,\\|x\\|_2$ となる最小の定数 $C$ はいくつですか。` : `すべての $x \\in \\mathbb R^${d === 16 ? '{16}' : d}$ で $\\|x\\|_2 \\le C\\,\\|x\\|_\\infty$ となる最小の定数 $C$ はいくつですか。`],
          a: { type: 'num', v: Math.sqrt(d), show: sqrtTeX(d) },
          hint: [which === 0 ? 'Cauchy–Schwarz with the all-ones vector; then check when it is an equality.' : 'Each $|x_i| \\le \\|x\\|_\\infty$; when are they all equal?', which === 0 ? 'すべて 1 のベクトルとのコーシー・シュワルツの不等式を使い、等号の場合を確かめます。' : '各 $|x_i| \\le \\|x\\|_\\infty$ です。すべて等しくなるのはいつですか。'],
          sol: [[which === 0 ? `$\\|x\\|_1 = \\sum |x_i|\\cdot 1 \\le \\|x\\|_2\\,\\|\\mathbf 1\\|_2 = \\sqrt{${d}}\\,\\|x\\|_2$.` : `$\\|x\\|_2^2 = \\sum x_i^2 \\le ${d}\\,\\|x\\|_\\infty^2$, so $\\|x\\|_2 \\le \\sqrt{${d}}\\,\\|x\\|_\\infty$.`, which === 0 ? `$\\|x\\|_1 = \\sum |x_i|\\cdot 1 \\le \\|x\\|_2\\,\\|\\mathbf 1\\|_2 = \\sqrt{${d}}\\,\\|x\\|_2$ です。` : `$\\|x\\|_2^2 = \\sum x_i^2 \\le ${d}\\,\\|x\\|_\\infty^2$ なので $\\|x\\|_2 \\le \\sqrt{${d}}\\,\\|x\\|_\\infty$ です。`], [`Equality at $x = (1, \\dots, 1)$, so $C = ${sqrtTeX(d)}$. All norms on $\\mathbb R^d$ are equivalent, but the constants grow with $d$, which is why infinite dimensions behave differently.`, `$x = (1, \\dots, 1)$ で等号が成り立つので $C = ${sqrtTeX(d)}$ です。$\\mathbb R^d$ 上のノルムはすべて同値ですが、定数は $d$ とともに大きくなります。これが無限次元で事情が変わる理由です。`]],
        };
      }
      const p = r.pick([1.5, 2.5, 3, 4, 5, 1.2, 6]);
      const v = 2 ** (1 / p);
      return {
        q: [`For $x = (1, 1)$ the readout shows $\\|x\\|_p = ${n(v, 4)}$. Which $p$ is set?`, `$x = (1, 1)$ で読み取り欄が $\\|x\\|_p = ${n(v, 4)}$ を示しています。$p$ はいくつですか。`],
        a: { type: 'num', v: p, tol: 0.02 },
        hint: ['$\\|(1, 1)\\|_p = 2^{1/p}$; take logarithms.', '$\\|(1, 1)\\|_p = 2^{1/p}$ です。対数をとります。'],
        sol: [[`$2^{1/p} = ${n(v, 4)}$ gives $\\tfrac1p = \\dfrac{\\ln ${n(v, 4)}}{\\ln 2} = ${n(Math.log(v) / Math.log(2), 4)}$.`, `$2^{1/p} = ${n(v, 4)}$ より $\\tfrac1p = \\dfrac{\\ln ${n(v, 4)}}{\\ln 2} = ${n(Math.log(v) / Math.log(2), 4)}$ です。`], [`$p = ${n(p)}$. The diagonal point $(1, 1)$ is where the ball's shape is most sensitive to $p$, so it is the best probe of the exponent.`, `$p = ${n(p)}$ です。対角の点 $(1, 1)$ は球の形が $p$ に最も敏感な場所なので、指数を調べるのに最適です。`]],
        set: { order: p },
      };
    },
  ];

  /* ---------- 2. projection ---------- */
  const DIRS = [[[1, 0], 0], [[1, 1], 45], [[0, 1], 90], [[-1, 1], 135]];
  Q['projection-hilbert'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const [u, ang] = r.pick(DIRS);
        let v; do { v = [r.int(-2, 2), r.int(-2, 2)]; } while (v[0] === 0 && v[1] === 0);
        const c = (v[0] * u[0] + v[1] * u[1]) / (u[0] * u[0] + u[1] * u[1]);
        const p = [c * u[0], c * u[1]];
        return {
          q: [`Project $v = ${vec(v)}$ orthogonally (ordinary dot product) onto the line spanned by $u = ${vec(u)}$.`, `$v = ${vec(v)}$ を、$u = ${vec(u)}$ が張る直線へ（通常の内積で）直交射影してください。`],
          a: { type: 'tuple', v: p, labels: ['$x$', '$y$'], tol: 1e-6 },
          hint: ['$\\operatorname{proj}_u v = \\dfrac{v\\cdot u}{u\\cdot u}\\,u$.', '$\\operatorname{proj}_u v = \\dfrac{v\\cdot u}{u\\cdot u}\\,u$ です。'],
          sol: [[`$v\\cdot u = ${v[0] * u[0] + v[1] * u[1]}$ and $u\\cdot u = ${u[0] * u[0] + u[1] * u[1]}$, so the coefficient is $${frac(v[0] * u[0] + v[1] * u[1], u[0] * u[0] + u[1] * u[1])}$.`, `$v\\cdot u = ${v[0] * u[0] + v[1] * u[1]}$、$u\\cdot u = ${u[0] * u[0] + u[1] * u[1]}$ なので係数は $${frac(v[0] * u[0] + v[1] * u[1], u[0] * u[0] + u[1] * u[1])}$ です。`], [`$\\operatorname{proj}_u v = (${n(p[0])}, ${n(p[1])})$, and the residual $(${n(v[0] - p[0])}, ${n(v[1] - p[1])})$ is perpendicular to $u$.`, `$\\operatorname{proj}_u v = (${n(p[0])}, ${n(p[1])})$ で、残差 $(${n(v[0] - p[0])}, ${n(v[1] - p[1])})$ は $u$ に垂直です。`]],
          set: { x: v[0], y: v[1], angle: ang, w: 1 },
        };
      }
      const w = r.step(1, 4, 0.5), a = [r.nz(-3, 3), r.int(-3, 3)], b = [r.int(-3, 3), r.nz(-3, 3)];
      const ip = a[0] * b[0] + w * a[1] * b[1];
      return {
        q: [`With the inner product $\\langle a, b\\rangle = a_1b_1 + ${n(w)}\\,a_2b_2$, compute $\\langle ${vec(a)}, ${vec(b)}\\rangle$.`, `内積 $\\langle a, b\\rangle = a_1b_1 + ${n(w)}\\,a_2b_2$ について、$\\langle ${vec(a)}, ${vec(b)}\\rangle$ を計算してください。`],
        a: { type: 'num', v: ip, tol: 1e-9 },
        hint: ['Multiply matching components, weighting the second product.', '対応する成分を掛け、2番目の積に重みを掛けます。'],
        sol: [[`$${a[0]}\\cdot ${b[0] < 0 ? `(${b[0]})` : b[0]} + ${n(w)}\\cdot ${a[1] < 0 ? `(${a[1]})` : a[1]}\\cdot ${b[1] < 0 ? `(${b[1]})` : b[1]} = ${n(ip)}$.`, `$${a[0]}\\cdot ${b[0] < 0 ? `(${b[0]})` : b[0]} + ${n(w)}\\cdot ${a[1] < 0 ? `(${a[1]})` : a[1]}\\cdot ${b[1] < 0 ? `(${b[1]})` : b[1]} = ${n(ip)}$ です。`], [`${a[0] * b[0] + a[1] * b[1] === 0 && ip !== 0 ? 'These two vectors are perpendicular in the dot product but not in this inner product: orthogonality depends on the inner product.' : 'Any weight $w > 0$ gives a valid inner product; its unit ball is an ellipse with semi-axes $1$ and $1/\\sqrt w$.'}`, `${a[0] * b[0] + a[1] * b[1] === 0 && ip !== 0 ? 'この二つのベクトルは通常の内積では垂直ですが、この内積では垂直ではありません。直交性は内積によって決まります。' : 'どんな重み $w > 0$ でも内積になります。その単位球は半軸 $1$ と $1/\\sqrt w$ の楕円です。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [u, ang] = r.pick([DIRS[1], DIRS[3]]);
        const w = r.pick([2, 3, 4, 1.5, 2.5]);
        let v; do { v = [r.step(-2, 2, 0.5), r.step(-2, 2, 0.5)]; } while (Math.abs(v[0]) + Math.abs(v[1]) < 0.5);
        const ip = (a, b) => a[0] * b[0] + w * a[1] * b[1];
        const c = ip(v, u) / ip(u, u), p = [c * u[0], c * u[1]];
        return {
          q: [`With $\\langle a, b\\rangle = a_1b_1 + ${n(w)}\\,a_2b_2$, project $v = (${n(v[0])}, ${n(v[1])})$ onto the line spanned by $u = ${vec(u)}$. Give the projection.`, `$\\langle a, b\\rangle = a_1b_1 + ${n(w)}\\,a_2b_2$ のもとで、$v = (${n(v[0])}, ${n(v[1])})$ を $u = ${vec(u)}$ が張る直線へ射影してください。射影を答えてください。`],
          a: { type: 'tuple', v: p, labels: ['$x$', '$y$'], tol: 0.002 },
          hint: ['Same formula, $\\dfrac{\\langle v, u\\rangle}{\\langle u, u\\rangle}u$, but with the weighted inner product in both places.', '同じ式 $\\dfrac{\\langle v, u\\rangle}{\\langle u, u\\rangle}u$ ですが、両方に重み付きの内積を使います。'],
          sol: [[`$\\langle v, u\\rangle = ${n(ip(v, u), 4)}$, $\\langle u, u\\rangle = ${n(ip(u, u), 4)}$, coefficient $${n(c, 4)}$.`, `$\\langle v, u\\rangle = ${n(ip(v, u), 4)}$、$\\langle u, u\\rangle = ${n(ip(u, u), 4)}$ で、係数は $${n(c, 4)}$ です。`], [`$\\operatorname{proj} = (${n(p[0], 4)}, ${n(p[1], 4)})$. The Euclidean projection would have coefficient $${n((v[0] * u[0] + v[1] * u[1]) / (u[0] * u[0] + u[1] * u[1]), 4)}$: the weight pulls the foot toward the direction where distance is cheaper.`, `$\\operatorname{proj} = (${n(p[0], 4)}, ${n(p[1], 4)})$ です。ユークリッドの射影なら係数は $${n((v[0] * u[0] + v[1] * u[1]) / (u[0] * u[0] + u[1] * u[1]), 4)}$ で、重みのため垂線の足は距離の安い方向へずれます。`]],
          set: { x: v[0], y: v[1], angle: ang, w },
        };
      }
      if (form === 1) {
        const u = r.pick([[3, 4], [4, 3], [1, 2], [2, 1], [1, 1], [5, 12]]);
        let v; do { v = [r.int(-4, 4), r.int(-4, 4)]; } while (v[0] * u[1] - v[1] * u[0] === 0);
        const cr = Math.abs(v[0] * u[1] - v[1] * u[0]), L = Math.hypot(...u), d = cr / L;
        return {
          q: [`How far is $v = ${vec(v)}$ from the line spanned by $u = ${vec(u)}$ (Euclidean distance)?`, `$v = ${vec(v)}$ は $u = ${vec(u)}$ が張る直線から（ユークリッド距離で）どれだけ離れていますか。`],
          a: { type: 'num', v: d, show: Number.isInteger(L) ? frac(cr, L) : `\\tfrac{${cr}}{${sqrtTeX(u[0] ** 2 + u[1] ** 2)}}` },
          hint: ['The distance is the length of the residual $v - \\operatorname{proj}_u v$.', '距離は残差 $v - \\operatorname{proj}_u v$ の長さです。'],
          sol: [[`$\\|v\\|^2 = ${v[0] ** 2 + v[1] ** 2}$ and $\\|\\operatorname{proj}_u v\\|^2 = (v\\cdot u)^2/\\|u\\|^2 = ${(v[0] * u[0] + v[1] * u[1]) ** 2}/${u[0] ** 2 + u[1] ** 2}$.`, `$\\|v\\|^2 = ${v[0] ** 2 + v[1] ** 2}$、$\\|\\operatorname{proj}_u v\\|^2 = (v\\cdot u)^2/\\|u\\|^2 = ${(v[0] * u[0] + v[1] * u[1]) ** 2}/${u[0] ** 2 + u[1] ** 2}$ です。`], [`By Pythagoras the residual has length $\\sqrt{${v[0] ** 2 + v[1] ** 2} - ${n((v[0] * u[0] + v[1] * u[1]) ** 2 / (u[0] ** 2 + u[1] ** 2), 4)}} = ${n(d, 4)}$, no point of the line is closer.`, `ピタゴラスの定理より残差の長さは $\\sqrt{${v[0] ** 2 + v[1] ** 2} - ${n((v[0] * u[0] + v[1] * u[1]) ** 2 / (u[0] ** 2 + u[1] ** 2), 4)}} = ${n(d, 4)}$ で、直線上にこれより近い点はありません。`]],
        };
      }
      const k = r.pick([2, 3, 4, 5]), m = r.pick([0, 1, 2].filter((t) => t < k));
      const c = (2 * m + 1) / (k + m + 1);
      const basis = m === 0 ? '1' : m === 1 ? 'x' : 'x^2';
      return {
        q: [`In $L^2[0, 1]$, find the multiple $c\\,${basis}$ closest to $f(x) = x^{${k}}$. Give $c$.`, `$L^2[0, 1]$ で $f(x) = x^{${k}}$ に最も近い $c\\,${basis}$ を求めてください。$c$ を答えてください。`],
        a: { type: 'num', v: c, show: frac(2 * m + 1, k + m + 1) },
        hint: ['It is the projection: $c = \\langle f, g\\rangle/\\langle g, g\\rangle$ with $\\langle f, g\\rangle = \\int_0^1 fg\\,dx$.', '射影です。$\\langle f, g\\rangle = \\int_0^1 fg\\,dx$ として $c = \\langle f, g\\rangle/\\langle g, g\\rangle$ です。'],
        sol: [[`$\\langle x^{${k}}, ${basis}\\rangle = \\int_0^1 x^{${k + m}}\\,dx = \\tfrac1{${k + m + 1}}$ and $\\langle ${basis}, ${basis}\\rangle = \\tfrac1{${2 * m + 1}}$.`, `$\\langle x^{${k}}, ${basis}\\rangle = \\int_0^1 x^{${k + m}}\\,dx = \\tfrac1{${k + m + 1}}$、$\\langle ${basis}, ${basis}\\rangle = \\tfrac1{${2 * m + 1}}$ です。`], [`$c = ${frac(2 * m + 1, k + m + 1)}$. ${m === 0 ? 'The best constant is the mean value of $f$.' : 'The residual $f - c\\,g$ is orthogonal to $g$ in $L^2$, exactly as in the picture.'}`, `$c = ${frac(2 * m + 1, k + m + 1)}$ です。${m === 0 ? '最良の定数は $f$ の平均値です。' : '残差 $f - c\\,g$ は $L^2$ で $g$ に直交し、図とまったく同じです。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 3, 4]);
        const a = 4 / (k + 1) - 6 / (k + 2), b = -6 / (k + 1) + 12 / (k + 2);
        const af = [4 * (k + 2) - 6 * (k + 1), (k + 1) * (k + 2)], bf = [-6 * (k + 2) + 12 * (k + 1), (k + 1) * (k + 2)];
        const bTeX = frac(Math.abs(bf[0]), bf[1]) === '1' ? '' : frac(Math.abs(bf[0]), bf[1]);
        return {
          q: [`Find the best approximation $a + bx$ to $f(x) = x^{${k}}$ in $L^2[0, 1]$ (the projection onto $\\operatorname{span}\\{1, x\\}$).`, `$L^2[0, 1]$ で $f(x) = x^{${k}}$ の最良近似 $a + bx$（$\\operatorname{span}\\{1, x\\}$ への射影）を求めてください。`],
          a: { type: 'expr', v: `(${af[0]})/(${af[1]})+(${bf[0]})/(${bf[1]})*x`, vars: ['x'], dom: { x: [0, 1] }, lhs: ['$a + bx =$', '$a + bx =$'] },
          hint: ['The residual must be orthogonal to both $1$ and $x$: two normal equations in $a$ and $b$.', '残差は $1$ と $x$ の両方に直交しなければなりません。$a$ と $b$ についての二つの正規方程式になります。'],
          sol: [[`$\\langle 1, 1\\rangle = 1$, $\\langle 1, x\\rangle = \\tfrac12$, $\\langle x, x\\rangle = \\tfrac13$, $\\langle f, 1\\rangle = \\tfrac1{${k + 1}}$, $\\langle f, x\\rangle = \\tfrac1{${k + 2}}$.`, `$\\langle 1, 1\\rangle = 1$、$\\langle 1, x\\rangle = \\tfrac12$、$\\langle x, x\\rangle = \\tfrac13$、$\\langle f, 1\\rangle = \\tfrac1{${k + 1}}$、$\\langle f, x\\rangle = \\tfrac1{${k + 2}}$ です。`], [`Solve $a + \\tfrac12 b = \\tfrac1{${k + 1}}$, $\\tfrac12 a + \\tfrac13 b = \\tfrac1{${k + 2}}$: $a = ${frac(af[0], af[1])}$, $b = ${frac(bf[0], bf[1])}$.`, `$a + \\tfrac12 b = \\tfrac1{${k + 1}}$、$\\tfrac12 a + \\tfrac13 b = \\tfrac1{${k + 2}}$ を解くと $a = ${frac(af[0], af[1])}$、$b = ${frac(bf[0], bf[1])}$ です。`], [`So $${frac(af[0], af[1])} ${b < 0 ? '-' : '+'} ${bTeX}x$ is the least-squares line for $x^{${k}}$: projection onto a two-dimensional subspace, the function-space version of dropping a perpendicular onto a plane.`, `したがって $${frac(af[0], af[1])} ${b < 0 ? '-' : '+'} ${bTeX}x$ が $x^{${k}}$ の最小二乗直線です。二次元部分空間への射影で、平面へ垂線を下ろすことの関数空間版です。`]],
        };
      }
      if (form === 1) {
        let x, y, w, c;
        do { x = r.step(-2, 2, 0.5); y = r.step(-2, 2, 0.5); w = r.pick([1.5, 2, 2.5, 3, 4]); c = (x + w * y) / (1 + w); } while (Math.abs(y - c) < 0.2 || Math.abs(x - y) < 0.5);
        return {
          q: [`The line is $y = x$ (angle $45^\\circ$) and $v = (${n(x)}, ${n(y)})$. In the inner product $a_1b_1 + w\\,a_2b_2$ the projection of $v$ lands at $(${n(c, 4)}, ${n(c, 4)})$. Find the weight $w$.`, `直線は $y = x$（角度 $45^\\circ$）で、$v = (${n(x)}, ${n(y)})$ です。内積 $a_1b_1 + w\\,a_2b_2$ での $v$ の射影が $(${n(c, 4)}, ${n(c, 4)})$ になりました。重み $w$ を求めてください。`],
          a: { type: 'num', v: w, tol: 0.01 },
          hint: ['With $u = (1, 1)$ the coefficient is $\\dfrac{v_1 + w v_2}{1 + w}$, a weighted average of $v_1$ and $v_2$.', '$u = (1, 1)$ では係数は $\\dfrac{v_1 + w v_2}{1 + w}$ で、$v_1$ と $v_2$ の重み付き平均です。'],
          sol: [[`$\\dfrac{${n(x)} + w\\cdot ${y < 0 ? `(${n(y)})` : n(y)}}{1 + w} = ${n(c, 4)}$, so $w\\,(${n(y)} - ${n(c, 4)}) = ${n(c, 4)} - ${x < 0 ? `(${n(x)})` : n(x)}$.`, `$\\dfrac{${n(x)} + w\\cdot ${y < 0 ? `(${n(y)})` : n(y)}}{1 + w} = ${n(c, 4)}$ より $w\\,(${n(y)} - ${n(c, 4)}) = ${n(c, 4)} - ${x < 0 ? `(${n(x)})` : n(x)}$ です。`], [`$w = ${n(w)}$. A larger weight makes the second coordinate costlier, so the foot slides toward matching $v_2$.`, `$w = ${n(w)}$ です。重みが大きいほど第2座標のずれが高くつくので、垂線の足は $v_2$ に合う方へずれます。`]],
          set: { x, y, angle: 45, w },
        };
      }
      const nn = r.pick([[1, 2, 2, 3], [2, 1, 2, 3], [2, 2, 1, 3], [1, 4, 8, 9], [2, 3, 6, 7], [4, 4, 7, 9]]);
      const nv = nn.slice(0, 3), L = nn[3], s = r.pick([[1, 1, 1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]]);
      const N = nv.map((t, i) => t * s[i]);
      let v; do { v = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)]; } while (v[0] * N[0] + v[1] * N[1] + v[2] * N[2] === 0);
      const dot = v[0] * N[0] + v[1] * N[1] + v[2] * N[2];
      const plane = `${N[0] === 1 ? '' : N[0] === -1 ? '-' : N[0]}x ${N[1] < 0 ? '-' : '+'} ${Math.abs(N[1]) === 1 ? '' : Math.abs(N[1])}y ${N[2] < 0 ? '-' : '+'} ${Math.abs(N[2]) === 1 ? '' : Math.abs(N[2])}z = 0`;
      return {
        q: [`How far is $v = ${vec(v)}$ from the plane $${plane}$ in $\\mathbb R^3$?`, `$\\mathbb R^3$ で $v = ${vec(v)}$ は平面 $${plane}$ からどれだけ離れていますか。`],
        a: { type: 'num', v: Math.abs(dot) / L, show: frac(Math.abs(dot), L) },
        hint: ['The residual of the projection onto the plane is the component of $v$ along the normal $n$.', '平面への射影の残差は、$v$ の法線 $n$ 方向の成分です。'],
        sol: [[`The normal is $n = ${vec(N)}$ with $\\|n\\| = ${L}$, and $v\\cdot n = ${dot}$.`, `法線は $n = ${vec(N)}$ で $\\|n\\| = ${L}$、$v\\cdot n = ${dot}$ です。`], [`$\\operatorname{proj}_{\\text{plane}} v = v - \\dfrac{v\\cdot n}{\\|n\\|^2}n$, so the distance is $\\dfrac{|v\\cdot n|}{\\|n\\|} = ${frac(Math.abs(dot), L)}$.`, `$\\operatorname{proj}_{\\text{平面}} v = v - \\dfrac{v\\cdot n}{\\|n\\|^2}n$ なので、距離は $\\dfrac{|v\\cdot n|}{\\|n\\|} = ${frac(Math.abs(dot), L)}$ です。`], ['Projecting onto a subspace and onto its orthogonal complement split $v$ into two perpendicular pieces; the shorter route is to compute the one-dimensional piece.', '部分空間への射影と、その直交補空間への射影は $v$ を垂直な二つの部分に分けます。一次元の側を計算する方が近道です。']],
      };
    },
  ];

  /* ---------- 3. spectrum ---------- */
  Q['operator-spectrum'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.int(-4, 4), d = r.int(-4, 4), b = r.nz(-5, 5), low = r.chance(0.5);
        const A = low ? [[a, 0], [b, d]] : [[a, b], [0, d]];
        return {
          q: [`What are the eigenvalues of $${mat(A)}$? Give them largest first.`, `$${mat(A)}$ の固有値は何ですか。大きい順に答えてください。`],
          a: { type: 'tuple', v: [Math.max(a, d), Math.min(a, d)], labels: ['$\\lambda_1$', '$\\lambda_2$'], tol: 1e-9 },
          hint: ['For a triangular matrix, $\\det(A - \\lambda I)$ is the product of the diagonal entries minus $\\lambda$.', '三角行列では $\\det(A - \\lambda I)$ は対角成分から $\\lambda$ を引いたものの積です。'],
          sol: [[`$\\det(A - \\lambda I) = (${a} - \\lambda)(${d} - \\lambda)$; the off-diagonal $${b}$ does not enter.`, `$\\det(A - \\lambda I) = (${a} - \\lambda)(${d} - \\lambda)$ で、非対角成分 $${b}$ は入りません。`], [`The spectrum is $\\{${[...new Set([a, d])].sort((p, q) => q - p).join(', ')}\\}$: for these $\\lambda$, $A - \\lambda I$ is not invertible.`, `スペクトルは $\\{${[...new Set([a, d])].sort((p, q) => q - p).join(', ')}\\}$ で、これらの $\\lambda$ で $A - \\lambda I$ は可逆ではありません。`]],
          set: Math.abs(a) <= 2 && Math.abs(d) <= 2 ? { lambda1: a, lambda2: d } : undefined,
        };
      }
      const l1 = r.step(-2, 2, 0.1), l2 = r.step(-2, 2, 0.1), rho = Math.max(Math.abs(l1), Math.abs(l2));
      return {
        q: [`The operator has eigenvalues $${n(l1)}$ and $${n(l2)}$. What is its spectral radius?`, `作用素の固有値は $${n(l1)}$ と $${n(l2)}$ です。スペクトル半径はいくつですか。`],
        a: { type: 'num', v: rho, tol: 1e-9 },
        hint: ['Largest absolute value, not largest value.', '値の最大ではなく、絶対値の最大です。'],
        sol: [[`$\\rho(A) = \\max(|${n(l1)}|, |${n(l2)}|) = ${n(rho)}$.`, `$\\rho(A) = \\max(|${n(l1)}|, |${n(l2)}|) = ${n(rho)}$ です。`], [rho < 1 ? 'It is below $1$, so $A^n x \\to 0$ for every starting vector.' : rho > 1 ? 'It is above $1$, so iterates generically grow like $\\rho^n$.' : 'It equals $1$: iterates neither decay nor blow up along the dominant direction.', rho < 1 ? '$1$ 未満なので、どの初期ベクトルでも $A^n x \\to 0$ です。' : rho > 1 ? '$1$ より大きいので、反復は一般に $\\rho^n$ のように増えます。' : '$1$ に等しいので、支配的な方向では反復は減衰も発散もしません。']],
        set: { lambda1: l1, lambda2: l2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let l1, l2; do { l1 = r.int(-3, 4); l2 = r.int(-3, 4); } while (l1 === l2);
        const k = r.nz(-2, 2), type = r.int(0, 1);
        // A = P diag(l1, l2) P^-1 with P unimodular
        const Pm = type ? [[1, k], [0, 1]] : [[1, 0], [k, 1]];
        const Pi = type ? [[1, -k], [0, 1]] : [[1, 0], [-k, 1]];
        const Dg = [[l1, 0], [0, l2]];
        const mul = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
        const A = mul(mul(Pm, Dg), Pi);
        const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        return {
          q: [`Find the eigenvalues of $A = ${mat(A)}$, largest first.`, `$A = ${mat(A)}$ の固有値を大きい順に求めてください。`],
          a: { type: 'tuple', v: [Math.max(l1, l2), Math.min(l1, l2)], labels: ['$\\lambda_1$', '$\\lambda_2$'], tol: 1e-6 },
          hint: ['Use the trace and determinant: $\\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = 0$.', '跡と行列式を使います。$\\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = 0$ です。'],
          sol: [[`$\\operatorname{tr}A = ${tr}$, $\\det A = ${det}$.`, `$\\operatorname{tr}A = ${tr}$、$\\det A = ${det}$ です。`], [`$\\lambda^2 ${tr < 0 ? '+' : '-'} ${Math.abs(tr)}\\lambda ${det < 0 ? '-' : '+'} ${Math.abs(det)} = (\\lambda - ${l1 < 0 ? `(${l1})` : l1})(\\lambda - ${l2 < 0 ? `(${l2})` : l2})$, so $\\sigma(A) = \\{${Math.max(l1, l2)}, ${Math.min(l1, l2)}\\}$.`, `$\\lambda^2 ${tr < 0 ? '+' : '-'} ${Math.abs(tr)}\\lambda ${det < 0 ? '-' : '+'} ${Math.abs(det)} = (\\lambda - ${l1 < 0 ? `(${l1})` : l1})(\\lambda - ${l2 < 0 ? `(${l2})` : l2})$ なので $\\sigma(A) = \\{${Math.max(l1, l2)}, ${Math.min(l1, l2)}\\}$ です。`], [`Exactly at these two values $\\det(A - \\lambda I) = 0$, which is where the curve $\\sigma_{\\min}(A - \\lambda I)$ touches zero.`, `ちょうどこの二つの値で $\\det(A - \\lambda I) = 0$ となり、曲線 $\\sigma_{\\min}(A - \\lambda I)$ が 0 に触れます。`]],
          set: Math.abs(l1) <= 2 && Math.abs(l2) <= 2 ? { lambda1: l1, lambda2: l2 } : undefined,
        };
      }
      if (form === 1) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), d = r.nz(-3, 3);
        const A = [[a, b], [0, d]];
        const F = a * a + b * b + d * d, dt = a * d;
        const s1 = Math.sqrt((F + Math.sqrt(F * F - 4 * dt * dt)) / 2);
        return {
          q: [`Find the operator norm $\\|A\\| = \\max_{\\|x\\|_2 = 1}\\|Ax\\|_2$ of $A = ${mat(A)}$. Give three decimals.`, `$A = ${mat(A)}$ の作用素ノルム $\\|A\\| = \\max_{\\|x\\|_2 = 1}\\|Ax\\|_2$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: s1, tol: 6e-4 },
          hint: ['$\\|A\\|$ is the largest singular value: the square root of the largest eigenvalue of $A^{\\mathsf T}A$.', '$\\|A\\|$ は最大特異値で、$A^{\\mathsf T}A$ の最大固有値の平方根です。'],
          sol: [[`For a $2\\times2$ matrix, $\\sigma_1^2 + \\sigma_2^2 = \\sum a_{ij}^2 = ${F}$ and $\\sigma_1\\sigma_2 = |\\det A| = ${Math.abs(dt)}$.`, `$2\\times2$ 行列では $\\sigma_1^2 + \\sigma_2^2 = \\sum a_{ij}^2 = ${F}$、$\\sigma_1\\sigma_2 = |\\det A| = ${Math.abs(dt)}$ です。`], [`$\\sigma_1^2 = \\tfrac12\\left(${F} + \\sqrt{${F}^2 - 4\\cdot ${dt * dt}}\\right) = ${n(s1 * s1, 4)}$, so $\\|A\\| = ${n(s1, 4)}$.`, `$\\sigma_1^2 = \\tfrac12\\left(${F} + \\sqrt{${F}^2 - 4\\cdot ${dt * dt}}\\right) = ${n(s1 * s1, 4)}$ なので $\\|A\\| = ${n(s1, 4)}$ です。`], [`It exceeds the spectral radius $${Math.max(Math.abs(a), Math.abs(d))}$ because $A$ is not symmetric: a non-normal operator can stretch some vector by more than any eigenvalue.`, `$A$ は対称でないため、スペクトル半径 $${Math.max(Math.abs(a), Math.abs(d))}$ を超えます。正規でない作用素は、どの固有値よりも大きくあるベクトルを伸ばせます。`]],
        };
      }
      const l1 = r.step(-1.5, 1.5, 0.5), l2 = r.step(-1.5, 1.5, 0.5), N = r.int(1, 6);
      const a = r.nz(-2, 2), b = r.nz(-2, 2);
      const A1 = l1 ** N * a, B1 = l2 ** N * b;
      return {
        q: [`$A$ has eigenvalue $${n(l1)}$ on $e_1$ and $${n(l2)}$ on $e_2$. Write $x = ${terms([[a, 'e_1'], [b, 'e_2']])}$. Find the coordinates $(\\alpha, \\beta)$ of $A^{${N}}x = \\alpha e_1 + \\beta e_2$.`, `$A$ は $e_1$ 上で固有値 $${n(l1)}$、$e_2$ 上で $${n(l2)}$ をもちます。$x = ${terms([[a, 'e_1'], [b, 'e_2']])}$ とします。$A^{${N}}x = \\alpha e_1 + \\beta e_2$ の座標 $(\\alpha, \\beta)$ を求めてください。`],
        a: { type: 'tuple', v: [A1, B1], labels: ['$\\alpha$', '$\\beta$'], tol: 1e-4 },
        hint: ['In the eigenbasis $A$ is diagonal, so each coordinate is multiplied by its own eigenvalue at every step.', '固有基底では $A$ は対角なので、各座標は毎回それぞれの固有値倍されます。'],
        sol: [[`$A^{${N}}x = ${a}\\cdot(${n(l1)})^{${N}}e_1 + ${b < 0 ? `(${b})` : b}\\cdot(${n(l2)})^{${N}}e_2$.`, `$A^{${N}}x = ${a}\\cdot(${n(l1)})^{${N}}e_1 + ${b < 0 ? `(${b})` : b}\\cdot(${n(l2)})^{${N}}e_2$ です。`], [`$\\alpha = ${n(A1, 5)}$, $\\beta = ${n(B1, 5)}$. ${Math.abs(l1) === Math.abs(l2) ? 'The eigenvalues have equal size, so neither direction takes over.' : `The $e_${Math.abs(l1) > Math.abs(l2) ? 1 : 2}$ part dominates more with each step: that is power iteration.`}`, `$\\alpha = ${n(A1, 5)}$、$\\beta = ${n(B1, 5)}$ です。${Math.abs(l1) === Math.abs(l2) ? '固有値の大きさが等しいので、どちらの方向も支配的になりません。' : `反復のたびに $e_${Math.abs(l1) > Math.abs(l2) ? 1 : 2}$ 成分の優位が増します。これがべき乗法です。`}`]],
        set: { lambda1: l1, lambda2: l2, steps: N },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.pick([0.5, 0.8, 1, 1.2, -0.5, -0.9, 2]), d = r.pick([0.3, 0.6, -0.4, 1.5, -1]), c = r.pick([5, 10, 20, 50]);
        const rho = Math.max(Math.abs(a), Math.abs(d));
        return {
          q: [`Let $A = ${mat([[a, c], [0, d]])}$. Its norm $\\|A\\|$ is larger than $${c}$. What is $\\lim_{n\\to\\infty}\\|A^n\\|^{1/n}$?`, `$A = ${mat([[a, c], [0, d]])}$ とします。ノルム $\\|A\\|$ は $${c}$ より大きくなります。$\\lim_{n\\to\\infty}\\|A^n\\|^{1/n}$ はいくつですか。`],
          a: { type: 'num', v: rho, tol: 1e-6 },
          hint: ['Gelfand\'s formula: the limit is the spectral radius, whatever the off-diagonal entry.', 'ゲルファントの公式により、非対角成分にかかわらず極限はスペクトル半径です。'],
          sol: [[`$A$ is triangular, so $\\sigma(A) = \\{${n(a)}, ${n(d)}\\}$ and $\\rho(A) = ${n(rho)}$.`, `$A$ は三角行列なので $\\sigma(A) = \\{${n(a)}, ${n(d)}\\}$、$\\rho(A) = ${n(rho)}$ です。`], [`$A^n$ has diagonal $(${n(a)})^n$, $(${n(d)})^n$ and an off-diagonal entry that grows at most like $n\\,${c}\\,\\rho^{n-1}$; taking $n$-th roots kills every polynomial factor.`, `$A^n$ の対角は $(${n(a)})^n$、$(${n(d)})^n$ で、非対角成分の増え方は高々 $n\\,${c}\\,\\rho^{n-1}$ 程度です。$n$ 乗根をとると多項式的な因子は消えます。`], [`So the limit is $${n(rho)}$: in the long run only the spectrum matters, however large the transient growth.`, `したがって極限は $${n(rho)}$ です。一時的な増大がどれほど大きくても、長期的にはスペクトルだけが効きます。`]],
          set: Math.abs(a) <= 2 && Math.abs(d) <= 2 ? { lambda1: a, lambda2: d } : undefined,
        };
      }
      if (form === 1) {
        const l1 = r.step(-2, 2, 0.5), l2 = r.step(-2, 2, 0.5);
        let lam; do { lam = r.step(-2, 2, 0.25); } while (Math.abs(lam - l1) < 1e-9 || Math.abs(lam - l2) < 1e-9);
        const dist = Math.min(Math.abs(lam - l1), Math.abs(lam - l2));
        return {
          q: [`$A$ is symmetric with eigenvalues $${n(l1)}$ and $${n(l2)}$. Find $\\|(A - ${n(lam)}I)^{-1}\\|$.`, `$A$ は対称で固有値は $${n(l1)}$ と $${n(l2)}$ です。$\\|(A - ${n(lam)}I)^{-1}\\|$ を求めてください。`],
          a: { type: 'num', v: 1 / dist },
          hint: ['For a symmetric matrix the resolvent norm is $1/\\operatorname{dist}(\\lambda, \\sigma(A))$.', '対称行列ではレゾルベントのノルムは $1/\\operatorname{dist}(\\lambda, \\sigma(A))$ です。'],
          sol: [[`In an orthonormal eigenbasis $(A - \\lambda I)^{-1}$ is diagonal with entries $1/(\\lambda_i - ${n(lam)})$.`, `正規直交固有基底では $(A - \\lambda I)^{-1}$ は対角で、成分は $1/(\\lambda_i - ${n(lam)})$ です。`], [`The largest is $1/${n(dist)} = ${n(1 / dist, 4)}$. It is $1/\\sigma_{\\min}(A - \\lambda I)$, and blows up as $\\lambda$ approaches the spectrum, which is how the spectrum is defined for any operator.`, `最大は $1/${n(dist)} = ${n(1 / dist, 4)}$ です。これは $1/\\sigma_{\\min}(A - \\lambda I)$ で、$\\lambda$ がスペクトルに近づくと発散します。どんな作用素でもスペクトルはこのように定義されます。`]],
          set: { lambda1: l1, lambda2: l2 },
        };
      }
      if (form === 2) {
        const l1 = r.pick([1.2, 1.5, 2, -1.5, 1.8]), l2 = r.pick([0.3, 0.5, 0.6, -0.4, 0.9]), b = r.pick([1, 2, 4]), eps = r.pick([0.1, 0.05, 0.01]);
        const q = Math.abs(l2 / l1);
        let N = 0; while (b * q ** N >= eps) N++;
        return {
          q: [`Start from $x = e_1 + ${b === 1 ? '' : b}e_2$ with $\\lambda_1 = ${n(l1)}$, $\\lambda_2 = ${n(l2)}$. After how many steps $n$ is the ratio $|\\beta_n/\\alpha_n|$ of the $e_2$ to the $e_1$ coordinate of $A^n x$ first below $${n(eps)}$?`, `$x = e_1 + ${b === 1 ? '' : b}e_2$、$\\lambda_1 = ${n(l1)}$、$\\lambda_2 = ${n(l2)}$ から始めます。$A^n x$ の $e_2$ 座標と $e_1$ 座標の比 $|\\beta_n/\\alpha_n|$ が初めて $${n(eps)}$ 未満になるのは何回目ですか。`],
          a: { type: 'int', v: N },
          hint: [`The ratio is $${b}\\,|\\lambda_2/\\lambda_1|^n$.`, `比は $${b}\\,|\\lambda_2/\\lambda_1|^n$ です。`],
          sol: [[`$|\\lambda_2/\\lambda_1| = ${n(q, 4)}$, so the ratio after $n$ steps is $${b}\\cdot ${n(q, 4)}^n$.`, `$|\\lambda_2/\\lambda_1| = ${n(q, 4)}$ なので、$n$ 回後の比は $${b}\\cdot ${n(q, 4)}^n$ です。`], [`$n = ${N}$ gives $${n(b * q ** N, 4)} < ${n(eps)}$${N > 0 ? `, while $n = ${N - 1}$ gives $${n(b * q ** (N - 1), 4)}$` : ''}.`, `$n = ${N}$ で $${n(b * q ** N, 4)} < ${n(eps)}$ ${N > 0 ? `となり、$n = ${N - 1}$ では $${n(b * q ** (N - 1), 4)}$ です` : 'です'}。`], ['Power iteration converges at the rate $|\\lambda_2/\\lambda_1|$ per step: a small eigenvalue gap means slow convergence.', 'べき乗法は1回あたり $|\\lambda_2/\\lambda_1|$ の率で収束します。固有値の比が1に近いと収束は遅くなります。']],
          set: N <= 8 && Math.abs(l1) <= 2 ? { lambda1: l1, lambda2: l2, steps: N } : undefined,
        };
      }
      const c = r.pick([0, 1, 2, -1]);
      return {
        q: [`On $L^2[0, 1]$ let $(Mg)(x) = (x${c ? (c > 0 ? ' + ' + c : ' - ' + -c) : ''})\\,g(x)$. Which describes its spectrum?`, `$L^2[0, 1]$ 上で $(Mg)(x) = (x${c ? (c > 0 ? ' + ' + c : ' - ' + -c) : ''})\\,g(x)$ とします。そのスペクトルを正しく述べているのはどれですか。`],
        a: { type: 'choice', opts: [[`$\\sigma(M) = [${c}, ${c + 1}]$, and $M$ has no eigenvalues at all`, `$\\sigma(M) = [${c}, ${c + 1}]$ で、固有値は一つもない`], [`$\\sigma(M) = [${c}, ${c + 1}]$, and every point of it is an eigenvalue`, `$\\sigma(M) = [${c}, ${c + 1}]$ で、そのすべての点が固有値である`], ['$\\sigma(M)$ is empty, since there are no eigenvalues', '固有値がないので $\\sigma(M)$ は空集合'], [`$\\sigma(M) = \\{${c}, ${c + 1}\\}$, the values at the endpoints`, `$\\sigma(M) = \\{${c}, ${c + 1}\\}$（端点での値）`]], v: 0 },
        hint: ['An eigenfunction would satisfy $(x + c - \\lambda)g(x) = 0$ almost everywhere. And $(M - \\lambda)^{-1}$ is multiplication by $1/(x + c - \\lambda)$: when is that bounded?', '固有関数ならほとんど至るところ $(x + c - \\lambda)g(x) = 0$ です。また $(M - \\lambda)^{-1}$ は $1/(x + c - \\lambda)$ を掛ける作用素です。それが有界なのはいつですか。'],
        sol: [['$(x + c - \\lambda)g = 0$ forces $g = 0$ except at one point, a null set, so $g = 0$ in $L^2$: no eigenvalues.', '$(x + c - \\lambda)g = 0$ からは一点（零集合）を除いて $g = 0$ となり、$L^2$ では $g = 0$ です。固有値はありません。'], [`But for $\\lambda \\in [${c}, ${c + 1}]$ the function $1/(x + c - \\lambda)$ is unbounded, so $M - \\lambda$ has no bounded inverse; outside that interval it does.`, `しかし $\\lambda \\in [${c}, ${c + 1}]$ では $1/(x + c - \\lambda)$ が有界でないので、$M - \\lambda$ は有界な逆をもちません。区間の外では逆をもちます。`], ['In infinite dimensions the spectrum can be much more than the eigenvalues; for a matrix the two coincide, which is what the lab shows.', '無限次元ではスペクトルは固有値よりずっと大きくなりえます。行列では両者が一致し、それが実験で見ている場合です。']],
      };
    },
  ];
})();
