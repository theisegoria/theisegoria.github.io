'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, terms } = P.util;
  const E = (s) => s.replace(/\+ -/g, '- ').replace(/- -/g, '+ ');
  const cubic = (a, b) => `y^2 = ${terms([[1, 'x^3'], [a, 'x'], [b, '']])}`;
  const disc = (a, b) => 4 * a * a * a + 27 * b * b;

  /* ---------- the cubic y^2 = x^3 + ax + b ---------- */
  Q['algebraic-varieties-introduction-cubic'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(-5, 5), b = r.int(-5, 5);
        const D = disc(a, b);
        return {
          q: [`For the curve $${cubic(a, b)}$, compute the test number $4a^3 + 27b^2$.`, `曲線 $${cubic(a, b)}$ について、判定の数 $4a^3 + 27b^2$ を計算してください。`],
          a: { type: 'int', v: D },
          hint: ['Read off $a$ and $b$ (the coefficient of $x$ and the constant), then substitute.', '$a$（$x$ の係数）と $b$（定数項）を読み取って代入します。'],
          sol: [[`Here $a = ${a}$ and $b = ${b}$.`, `ここで $a = ${a}$、$b = ${b}$ です。`],
                [`$4a^3 + 27b^2 = 4(${a})^3 + 27(${b})^2 = ${4 * a ** 3} + ${27 * b * b} = ${D}$.`, `$4a^3 + 27b^2 = 4(${a})^3 + 27(${b})^2 = ${4 * a ** 3} + ${27 * b * b} = ${D}$ です。`],
                [D === 0 ? 'It is zero, so the cubic has a repeated root and the curve is singular.' : 'It is not zero, so the cubic has three distinct roots and the curve is smooth.', D === 0 ? '$0$ なので、3 次式は重解をもち、曲線は特異です。' : '$0$ ではないので、3 次式の根はすべて異なり、曲線はなめらかです。']],
        };
      }
      if (form === 1) {
        const t = r.int(1, 3);
        const sing = r.chance(0.5);
        let a, b;
        if (sing) { a = -3 * t * t; b = r.pick([-1, 1]) * 2 * t ** 3; } else { do { a = r.int(-6, 3); b = r.int(-5, 5); } while (disc(a, b) === 0); }
        const D = disc(a, b);
        return {
          q: [`Is the curve $${cubic(a, b)}$ singular (over the complex numbers)?`, `曲線 $${cubic(a, b)}$ は（複素数の範囲で）特異ですか。`],
          a: { type: 'choice', fixed: true, v: D === 0 ? 0 : 1, opts: [['Yes, it has a singular point', 'はい、特異点をもちます'], ['No, it is smooth', 'いいえ、なめらかです']] },
          hint: ['Compute $4a^3 + 27b^2$.', '$4a^3 + 27b^2$ を計算します。'],
          sol: [[`$4a^3 + 27b^2 = ${4 * a ** 3} + ${27 * b * b} = ${D}$.`, `$4a^3 + 27b^2 = ${4 * a ** 3} + ${27 * b * b} = ${D}$ です。`],
                [D === 0 ? 'It vanishes: $x^3 + ax + b$ has a double root, and the curve is singular at the point above it.' : 'It does not vanish: all three roots of $x^3 + ax + b$ are distinct, so both partial derivatives never vanish together on the curve.', D === 0 ? '$0$ になるので、$x^3 + ax + b$ は重解をもち、その真上の点で曲線は特異です。' : '$0$ にならないので、$x^3 + ax + b$ の 3 つの根はすべて異なり、曲線上で 2 つの偏導関数が同時に $0$ になることはありません。']],
        };
      }
      const a = r.int(-4, 3), b = r.int(-4, 4);
      const x0 = r.int(-2, 3);
      const rhs = x0 ** 3 + a * x0 + b;
      const yy = r.int(-3, 3);
      // on the curve when the right side is a perfect square (try to land on it half of the time)
      const pt = r.chance(0.5) && rhs >= 0 && Number.isInteger(Math.sqrt(rhs)) ? [x0, r.sign() * Math.sqrt(rhs)] : [x0, yy];
      const on = pt[1] * pt[1] === rhs;
      return {
        q: [`Does the point $(${pt[0]}, ${pt[1]})$ lie on the curve $${cubic(a, b)}$?`, `点 $(${pt[0]}, ${pt[1]})$ は曲線 $${cubic(a, b)}$ 上にありますか。`],
        a: { type: 'choice', fixed: true, v: on ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['Substitute the coordinates into $y^2 - (x^3 + ax + b)$.', '座標を $y^2 - (x^3 + ax + b)$ に代入します。'],
        sol: [[`Left side: $y^2 = ${pt[1] ** 2}$. Right side: $x^3 + ax + b = ${rhs}$.`, `左辺：$y^2 = ${pt[1] ** 2}$。右辺：$x^3 + ax + b = ${rhs}$ です。`],
              [on ? 'They are equal, so the point is on the curve: a variety is exactly the set of points where the polynomial vanishes.' : 'They differ, so the polynomial $y^2 - x^3 - ax - b$ is not zero there and the point is off the curve.', on ? '等しいので、点は曲線上にあります。多様体とは、多項式が $0$ になる点の集合そのものです。' : '異なるので、多項式 $y^2 - x^3 - ax - b$ はその点で $0$ にならず、点は曲線上にありません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const t = r.int(1, 3);
      if (form === 0) {
        const a = -3 * t * t;
        return {
          q: [`For $a = ${a}$, find the positive value of $b$ for which $y^2 = x^3 + ${a < 0 ? `(${a})` : a}x + b$ becomes singular.`, `$a = ${a}$ のとき、$y^2 = x^3 + ${a < 0 ? `(${a})` : a}x + b$ が特異になる正の $b$ を求めてください。`],
          a: { type: 'int', v: 2 * t ** 3 },
          hint: ['Set $4a^3 + 27b^2 = 0$ and solve for $b$.', '$4a^3 + 27b^2 = 0$ として $b$ を解きます。'],
          sol: [[`$27b^2 = -4a^3 = ${-4 * a ** 3}$, so $b^2 = ${(-4 * a ** 3) / 27}$.`, `$27b^2 = -4a^3 = ${-4 * a ** 3}$ なので $b^2 = ${(-4 * a ** 3) / 27}$ です。`],
                [`$b = \\pm ${2 * t ** 3}$; the positive one is $${2 * t ** 3}$. Both signs give a singular curve, but of different shapes.`, `$b = \\pm ${2 * t ** 3}$ で、正のほうは $${2 * t ** 3}$ です。どちらの符号でも特異ですが、形は異なります。`]],
        };
      }
      if (form === 1) {
        const x0 = r.pick([-3, -2, -1, 1, 2, 3]);
        const a = -3 * x0 * x0, b = 2 * x0 ** 3;
        return {
          q: [`The curve $${cubic(a, b)}$ is singular. At which $x$ does its singular point lie? (The singular point is $(x, 0)$.)`, `曲線 $${cubic(a, b)}$ は特異です。特異点の $x$ 座標を求めてください（特異点は $(x, 0)$ です）。`],
          a: { type: 'int', v: x0 },
          hint: ['The singular point is the double root of $x^3 + ax + b$; it also solves $3x^2 + a = 0$.', '特異点は $x^3 + ax + b$ の重解で、$3x^2 + a = 0$ も満たします。'],
          sol: [[`$3x^2 + ${a} = 0$ gives $x^2 = ${-a / 3}$, so $x = \\pm ${Math.abs(x0)}$.`, `$3x^2 + ${a} = 0$ より $x^2 = ${-a / 3}$ なので $x = \\pm ${Math.abs(x0)}$ です。`],
                [`Only $x = ${x0}$ satisfies $x^3 + ${a}x + ${b} = 0$ as well (check: $${x0 ** 3} + ${a * x0} + ${b} = 0$). So the singular point is $(${x0}, 0)$.`, `$x^3 + ${a}x + ${b} = 0$ も満たすのは $x = ${x0}$ だけです（検算：$${x0 ** 3} + ${a * x0} + ${b} = 0$）。よって特異点は $(${x0}, 0)$ です。`]],
        };
      }
      const x0 = r.pick([-3, -2, -1, 1, 2, 3]);
      const a = -3 * x0 * x0, b = 2 * x0 ** 3;
      return {
        q: [`The real curve $${cubic(a, b)}$ is singular at $(${x0}, 0)$. What does the real picture look like there?`, `実数の曲線 $${cubic(a, b)}$ は $(${x0}, 0)$ で特異です。そこでの実数の図形はどうなっていますか。`],
        a: { type: 'choice', fixed: true, v: x0 > 0 ? 0 : 1, opts: [['Two branches cross (a node)', '2 本の枝が交わる（ノード）'], ['An isolated point sits apart from the rest of the curve', '曲線の他の部分から離れた孤立点がある'], ['A sharp cusp', '鋭いとがり（カスプ）']] },
        hint: ['Write the cubic as $(x - x_0)^2(x + 2x_0)$ and check its sign just beside $x_0$.', '3 次式を $(x - x_0)^2(x + 2x_0)$ と書き、$x_0$ のすぐ隣での符号を調べます。'],
        sol: [[`$x^3 + ${a}x + ${b} = (x - ${x0})^2(x + ${2 * x0})$ (in this form the double root is $x_0 = ${x0}$).`, `$x^3 + ${a}x + ${b} = (x - ${x0})^2(x + ${2 * x0})$ です（二重根は $x_0 = ${x0}$）。`],
              [x0 > 0 ? `Beside $x_0$ the factor $x + ${2 * x0}$ is about $${3 * x0} > 0$, so $y^2 \\ge 0$ on both sides and two branches $y \\approx \\pm\\sqrt{${3 * x0}}(x - ${x0})$ cross.` : `Beside $x_0$ the factor $x + ${2 * x0}$ is about $${3 * x0} < 0$, so $y^2 < 0$ on both sides: no real points nearby except $(${x0}, 0)$ itself, an isolated point.`, x0 > 0 ? `$x_0$ の隣では因子 $x + ${2 * x0}$ はおよそ $${3 * x0} > 0$ なので両側で $y^2 \\ge 0$ となり、2 本の枝 $y \\approx \\pm\\sqrt{${3 * x0}}(x - ${x0})$ が交わります。` : `$x_0$ の隣では因子 $x + ${2 * x0}$ はおよそ $${3 * x0} < 0$ なので両側で $y^2 < 0$ となり、$(${x0}, 0)$ 自身を除いて近くに実数の点はありません。孤立点です。`],
              ['Over the complex numbers both are the same kind of singularity (a node); only the real picture differs.', '複素数の範囲ではどちらも同じ種類の特異点（ノード）で、違うのは実数の図だけです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, b;
        do { a = r.int(-6, 3); b = r.int(-4, 4); } while (disc(a, b) === 0);
        const D = disc(a, b);
        const comps = D < 0 ? 2 : 1;
        return {
          q: [`How many connected pieces does the real curve $${cubic(a, b)}$ have?`, `実数の曲線 $${cubic(a, b)}$ はいくつの連結な部分からなりますか。`],
          a: { type: 'int', v: comps },
          hint: ['The real picture has an oval exactly when the cubic has three real roots, that is when $4a^3 + 27b^2 < 0$.', '3 次式が 3 つの実根をもつとき、つまり $4a^3 + 27b^2 < 0$ のときに、実数の図に卵形が現れます。'],
          sol: [[`$4a^3 + 27b^2 = ${D}$, which is ${D < 0 ? 'negative' : 'positive'}.`, `$4a^3 + 27b^2 = ${D}$ で、${D < 0 ? '負' : '正'}です。`],
                [D < 0 ? 'Negative: three real roots, so the real curve is an oval plus an unbounded branch, 2 pieces.' : 'Positive: one real root, so the real curve is a single unbounded branch, 1 piece.', D < 0 ? '負なので実根は 3 つあり、実数の曲線は卵形と無限に伸びる枝の 2 つの部分です。' : '正なので実根は 1 つで、実数の曲線は無限に伸びる 1 本の枝、つまり 1 つの部分です。'],
                ['The sign of the same number that detects singularity also separates the two smooth shapes.', '特異性を見つけるのと同じ数の符号が、なめらかな 2 つの形も区別します。']],
        };
      }
      if (form === 1) {
        const x0 = r.int(1, 8);
        const slope = Math.sqrt(3 * x0);
        const a = -3 * x0 * x0, b = 2 * x0 ** 3;
        return {
          q: [`The curve $${cubic(a, b)}$ has a node at $(${x0}, 0)$ where two branches cross. What is the positive slope of one of the branches there?`, `曲線 $${cubic(a, b)}$ は $(${x0}, 0)$ にノードをもち、2 本の枝が交わります。そこでの枝の傾きのうち正のものを求めてください。`],
          a: { type: 'num', v: slope, tol: 0.0006, show: x0 === 3 ? '3' : `\\sqrt{${3 * x0}}` },
          hint: ['Near $x_0$, $y^2 \\approx (3x_0)(x - x_0)^2$.', '$x_0$ の近くでは $y^2 \\approx (3x_0)(x - x_0)^2$ です。'],
          sol: [[`$x^3 + ${a}x + ${b} = (x - ${x0})^2(x + ${2 * x0})$, and at $x = ${x0}$ the last factor is $${3 * x0}$.`, `$x^3 + ${a}x + ${b} = (x - ${x0})^2(x + ${2 * x0})$ で、$x = ${x0}$ では最後の因子は $${3 * x0}$ です。`],
                [`So $y^2 \\approx ${3 * x0}(x - ${x0})^2$, giving the two tangent lines $y = \\pm\\sqrt{${3 * x0}}\\,(x - ${x0})$. The positive slope is $${n(slope, 4)}$.`, `したがって $y^2 \\approx ${3 * x0}(x - ${x0})^2$ で、接線は $y = \\pm\\sqrt{${3 * x0}}\\,(x - ${x0})$ の 2 本です。正の傾きは $${n(slope, 4)}$ です。`]],
        };
      }
      const t = r.int(1, 4);
      return {
        q: [`For $a = ${-3 * t * t}$ the curve $y^2 = x^3 + ax + b$ is singular for exactly two values of $b$. Enter them in increasing order.`, `$a = ${-3 * t * t}$ のとき、曲線 $y^2 = x^3 + ax + b$ が特異になる $b$ はちょうど 2 つあります。小さいほうから順に入力してください。`],
        a: { type: 'tuple', v: [-2 * t ** 3, 2 * t ** 3], labels: ['$b_1$', '$b_2$'], tol: 1e-9 },
        hint: ['Solve $4a^3 + 27b^2 = 0$ for $b$.', '$4a^3 + 27b^2 = 0$ を $b$ について解きます。'],
        sol: [[`$27b^2 = -4(${-3 * t * t})^3 = ${-4 * (-3 * t * t) ** 3}$, so $b^2 = ${4 * t ** 6}$.`, `$27b^2 = -4(${-3 * t * t})^3 = ${-4 * (-3 * t * t) ** 3}$ なので $b^2 = ${4 * t ** 6}$ です。`],
              [`$b = \\pm ${2 * t ** 3}$. As $b$ moves through these values the curve changes between one piece and two; at each the oval pinches off at a node or shrinks to an isolated point.`, `$b = \\pm ${2 * t ** 3}$ です。$b$ がこれらの値を通ると、曲線は 1 つの部分と 2 つの部分の間で変わります。それぞれの値で、卵形はノードでくびれるか、孤立点に縮みます。`]],
      };
    },
  ];

  /* ---------- singular points through the gradient ---------- */
  Q['algebraic-varieties-introduction-singular'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), c = r.nz(-3, 3), x0 = r.int(-2, 3), y0 = r.int(-2, 3);
        const fx = 3 * x0 * x0 + a * y0;
        return {
          q: [`Let $f(x,y) = x^3 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}xy + ${c < 0 ? `(${c})` : c}y^2$. Find $\\dfrac{\\partial f}{\\partial x}$ at $(${x0}, ${y0})$.`,
              `$f(x,y) = x^3 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}xy + ${c < 0 ? `(${c})` : c}y^2$ とします。点 $(${x0}, ${y0})$ での $\\dfrac{\\partial f}{\\partial x}$ を求めてください。`],
          a: { type: 'int', v: fx },
          hint: ['Differentiate in $x$, treating $y$ as a constant.', '$y$ を定数とみなして $x$ で微分します。'],
          sol: [[`$\\dfrac{\\partial f}{\\partial x} = 3x^2 + ${a}y$.`, `$\\dfrac{\\partial f}{\\partial x} = 3x^2 + ${a}y$ です。`],
                [`At $(${x0}, ${y0})$: $3 \\cdot ${x0 * x0} + ${a} \\cdot ${y0} = ${fx}$. The gradient $(f_x, f_y)$ is the vector that must vanish at a singular point.`, `$(${x0}, ${y0})$ では $3 \\cdot ${x0 * x0} + ${a} \\cdot ${y0} = ${fx}$ です。特異点では勾配 $(f_x, f_y)$ が $0$ ベクトルになる必要があります。`]],
        };
      }
      if (form === 1) {
        const cases = [
          { f: 'y^2 - x^3', pts: [[0, 0, true], [1, 1, false]], g: (x, y) => [-3 * x * x, 2 * y] },
          { f: 'x^2 + y^2 - 1', pts: [[1, 0, false], [0, 1, false]], g: (x, y) => [2 * x, 2 * y] },
          { f: 'xy', pts: [[0, 0, true], [1, 0, false], [0, 2, false]], g: (x, y) => [y, x] },
          { f: 'y^2 - x^2(x+1)', pts: [[0, 0, true], [-1, 0, false]], g: (x, y) => [-3 * x * x - 2 * x, 2 * y] },
        ];
        const c = r.pick(cases);
        const pt = r.pick(c.pts);
        const ft = c.f === 'y^2 - x^3' ? 'y^2 - x^3' : c.f === 'x^2 + y^2 - 1' ? 'x^2 + y^2 - 1' : c.f === 'xy' ? 'xy' : 'y^2 - x^2(x+1)';
        const g = c.g(pt[0], pt[1]);
        return {
          q: [`The point $(${pt[0]}, ${pt[1]})$ lies on the curve $${ft} = 0$. Is the curve singular there?`, `点 $(${pt[0]}, ${pt[1]})$ は曲線 $${ft} = 0$ 上にあります。そこで曲線は特異ですか。`],
          a: { type: 'choice', fixed: true, v: pt[2] ? 0 : 1, opts: [['Yes, singular', 'はい、特異です'], ['No, smooth', 'いいえ、なめらかです']] },
          hint: ['Compute both partial derivatives at the point.', 'その点で 2 つの偏導関数を計算します。'],
          sol: [[`The gradient there is $(${g[0]}, ${g[1]})$.`, `その点での勾配は $(${g[0]}, ${g[1]})$ です。`],
                [pt[2] ? 'It is the zero vector, so the curve has no well-defined tangent direction from the gradient: a singular point.' : 'It is not the zero vector, so the curve is smooth there, with tangent line perpendicular to the gradient.', pt[2] ? '$0$ ベクトルなので、勾配から接線の向きを決められません。特異点です。' : '$0$ ベクトルではないので、曲線はそこでなめらかで、接線は勾配に垂直です。']],
        };
      }
      const m = r.int(2, 4), k = r.int(2, 4);
      return {
        q: [`The curve is the union of ${m} distinct vertical lines and ${k} distinct horizontal lines in the plane. How many singular points does it have?`, `曲線は、平面上の相異なる ${m} 本の鉛直な直線と ${k} 本の水平な直線の和集合です。特異点はいくつありますか。`],
        a: { type: 'int', v: m * k },
        hint: ['A union of lines is singular exactly where two of them meet.', '直線の和集合は、2 本が交わる点でちょうど特異になります。'],
        sol: [[`Two vertical lines never meet, nor do two horizontal lines.`, `鉛直な直線どうし、水平な直線どうしは交わりません。`],
              [`Each of the ${m} vertical lines meets each of the ${k} horizontal ones once, giving ${m} $\\times$ ${k} = ${m * k} crossing points, and each is singular.`, `${m} 本の鉛直線は ${k} 本の水平線とそれぞれ 1 回交わるので、交点は ${m} $\\times$ ${k} = ${m * k} 個で、そのどれもが特異点です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.int(1, 4), q = r.int(1, 4);
        const poly = terms([[1, 'x^3'], [q - 2 * p, 'x^2'], [p * p - 2 * p * q, 'x'], [p * p * q, '']]);
        return {
          q: [`Find the singular point of the curve $y^2 = ${poly}$. Enter its coordinates $(x, y)$.`, `曲線 $y^2 = ${poly}$ の特異点を求めてください。座標 $(x, y)$ を入力します。`],
          a: { type: 'tuple', v: [p, 0], labels: ['$x$', '$y$'], tol: 1e-9 },
          hint: ['The right side factors; look for the repeated factor.', '右辺は因数分解できます。重なっている因数を探します。'],
          sol: [[`The right side is $(x - ${p})^2(x + ${q})$, since expanding gives $${poly}$.`, `右辺は $(x - ${p})^2(x + ${q})$ です。展開すると $${poly}$ になります。`],
                [`With $F = y^2 - (x - ${p})^2(x + ${q})$: $F_y = 2y$ forces $y = 0$, and $F_x = -(x - ${p})(3x + ${2 * q - p}) = 0$ with $F = 0$ leaves $x = ${p}$.`, `$F = y^2 - (x - ${p})^2(x + ${q})$ とすると、$F_y = 2y$ から $y = 0$、$F_x = -(x - ${p})(3x + ${2 * q - p}) = 0$ と $F = 0$ から $x = ${p}$ だけが残ります。`],
                [`The singular point is $(${p}, 0)$, the double root of the cubic.`, `特異点は $(${p}, 0)$、つまり 3 次式の重解の位置です。`]],
        };
      }
      if (form === 1) {
        const s = r.pick([2, 3, 4]);
        let p, q;
        do { p = r.int(1, 3); q = s * s - p; } while (q < 1);
        const poly = terms([[1, 'x^3'], [q - 2 * p, 'x^2'], [p * p - 2 * p * q, 'x'], [p * p * q, '']]);
        return {
          q: [`The curve $y^2 = ${poly}$ has a node at $(${p}, 0)$. What is the positive slope of the tangent lines there?`, `曲線 $y^2 = ${poly}$ は $(${p}, 0)$ にノードをもちます。そこでの接線の傾きのうち正のものを求めてください。`],
          a: { type: 'num', v: s, tol: 1e-6 },
          hint: ['Near the node $y^2 \\approx (x_0 + q)(x - x_0)^2$.', 'ノードの近くでは $y^2 \\approx (x_0 + q)(x - x_0)^2$ です。'],
          sol: [[`The cubic is $(x - ${p})^2(x + ${q})$; at $x = ${p}$ the simple factor is $${p + q}$.`, `3 次式は $(x - ${p})^2(x + ${q})$ で、$x = ${p}$ では単根の因子は $${p + q}$ です。`],
                [`So $y^2 \\approx ${p + q}(x - ${p})^2$ and the tangent lines are $y = \\pm ${s}(x - ${p})$. The positive slope is $${s}$.`, `したがって $y^2 \\approx ${p + q}(x - ${p})^2$ で、接線は $y = \\pm ${s}(x - ${p})$ です。正の傾きは $${s}$ です。`]],
        };
      }
      return {
        q: [`For which values of $c$ is the surface $x^2 + y^2 - z^2 = c$ singular? Enter the number $c$ (there is exactly one).`, `曲面 $x^2 + y^2 - z^2 = c$ が特異になる $c$ の値を求めてください（ちょうど 1 つあります）。`],
        a: { type: 'int', v: 0 },
        hint: ['The gradient is $(2x, 2y, -2z)$; where does it vanish, and what is $c$ there?', '勾配は $(2x, 2y, -2z)$ です。どこで $0$ になり、そこで $c$ はいくつでしょうか。'],
        sol: [[`The gradient $(2x, 2y, -2z)$ is zero only at the origin.`, `勾配 $(2x, 2y, -2z)$ が $0$ になるのは原点だけです。`],
              [`The origin lies on the surface only if $0 = c$. For $c \\neq 0$ the surface (a hyperboloid) is smooth; for $c = 0$ it is a cone with its vertex singular.`, `原点が曲面上にあるのは $0 = c$ のときだけです。$c \\neq 0$ なら曲面（双曲面）はなめらかで、$c = 0$ なら頂点が特異な円錐です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x0 = r.pick([-3, -2, -1, 1, 2, 3]);
        return {
          q: [`A cubic $x^3 + ax + b$ has a double root at $x_0 = ${x0}$ and a simple root elsewhere. Find $(a, b)$.`, `3 次式 $x^3 + ax + b$ が $x_0 = ${x0}$ に二重根をもち、他に単根をもちます。$(a, b)$ を求めてください。`],
          a: { type: 'tuple', v: [-3 * x0 * x0, 2 * x0 ** 3], labels: ['$a$', '$b$'], tol: 1e-9 },
          hint: ['There is no $x^2$ term, so the three roots add up to $0$.', '$x^2$ の項がないので、3 つの根の和は $0$ です。'],
          sol: [[`Roots $${x0}, ${x0}, s$ with sum $0$: $s = ${-2 * x0}$.`, `根は $${x0}, ${x0}, s$ で和が $0$ なので $s = ${-2 * x0}$ です。`],
                [`$(x - ${x0})^2(x + ${2 * x0}) = x^3 - ${3 * x0 * x0}x + ${2 * x0 ** 3}$, so $a = ${-3 * x0 * x0}$ and $b = ${2 * x0 ** 3}$. Then $4a^3 + 27b^2 = 0$, as it must.`, `$(x - ${x0})^2(x + ${2 * x0}) = x^3 - ${3 * x0 * x0}x + ${2 * x0 ** 3}$ なので $a = ${-3 * x0 * x0}$、$b = ${2 * x0 ** 3}$ です。確かに $4a^3 + 27b^2 = 0$ になります。`]],
        };
      }
      if (form === 1) {
        const a = r.nz(-5, 5), b = r.nz(-5, 5);
        return {
          q: [`For $F(x,y) = y^2 - x^3 ${a < 0 ? '+' : '-'} ${Math.abs(a)}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$, write $\\dfrac{\\partial F}{\\partial x}$ as a formula in $x$.`, `$F(x,y) = y^2 - x^3 ${a < 0 ? '+' : '-'} ${Math.abs(a)}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$ について、$\\dfrac{\\partial F}{\\partial x}$ を $x$ の式で表してください。`],
          a: { type: 'expr', v: E(`-3*x^2 + ${-a}`), vars: ['x'], lhs: ['$F_x=$', '$F_x=$'] },
          hint: ['Differentiate term by term in $x$; the $y^2$ term drops out.', '項ごとに $x$ で微分します。$y^2$ の項は消えます。'],
          sol: [[`$F_x = -3x^2 ${-a < 0 ? '-' : '+'} ${Math.abs(a)}$.`, `$F_x = -3x^2 ${-a < 0 ? '-' : '+'} ${Math.abs(a)}$ です。`],
                [`With $F_y = 2y$, a singular point needs $y = 0$ and $3x^2 = ${-a}$ together with $F = 0$: that is exactly a double root of the cubic.`, `$F_y = 2y$ とあわせると、特異点には $y = 0$、$3x^2 = ${-a}$、$F = 0$ が同時に必要です。これは 3 次式の重解にほかなりません。`]],
        };
      }
      const k = r.int(2, 5);
      return {
        q: [`In $\\mathbb A^2$ the curve $x^${k} = y^${k}$ is a union of lines through the origin over $\\mathbb C$. How many lines is it? (Count distinct lines.)`, `$\\mathbb A^2$ の曲線 $x^${k} = y^${k}$ は、複素数の範囲で原点を通る直線の和集合です。何本の直線ですか（相異なる直線を数えてください）。`],
        a: { type: 'int', v: k },
        hint: ['Factor $x^k - y^k$ over $\\mathbb C$ using the $k$-th roots of unity.', '$k$ 乗根の 1 を使って、$\\mathbb C$ 上で $x^k - y^k$ を因数分解します。'],
        sol: [[`$x^${k} - y^${k} = \\prod_{j=0}^{${k - 1}}(x - \\zeta^j y)$ with $\\zeta = e^{2\\pi i/${k}}$.`, `$x^${k} - y^${k} = \\prod_{j=0}^{${k - 1}}(x - \\zeta^j y)$、ただし $\\zeta = e^{2\\pi i/${k}}$ です。`],
              [`The ${k} factors are distinct lines, all through the origin, which is therefore the singular point of the union (for $k \\ge 2$).`, `${k} 個の因数は相異なる直線で、すべて原点を通ります。したがって原点は和集合の特異点です（$k \\ge 2$）。`]],
      };
    },
  ];

  /* ---------- ideals, coordinate rings and the projective closure ---------- */
  Q['algebraic-varieties-introduction-ring'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const R = r.pick([5, 10, 13, 17]);
        const c = r.int(-R - 1, R + 1);
        const cnt = Math.abs(c) < R ? 2 : Math.abs(c) === R ? 1 : 0;
        return {
          q: [`How many real points does $V(x^2 + y^2 - ${R * R},\; y - ${c < 0 ? `(${c})` : c})$ have?`, `$V(x^2 + y^2 - ${R * R},\; y - ${c < 0 ? `(${c})` : c})$ の実数の点はいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Substitute $y = ' + c + '$ into the first equation.', '最初の式に $y = ' + c + '$ を代入します。'],
          sol: [[`With $y = ${c}$: $x^2 = ${R * R} - ${c * c} = ${R * R - c * c}$.`, `$y = ${c}$ を代入すると $x^2 = ${R * R} - ${c * c} = ${R * R - c * c}$ です。`],
                [cnt === 2 ? `Positive, so $x = \\pm\\sqrt{${R * R - c * c}}$: two points, the line cuts the circle twice.` : cnt === 1 ? 'Zero, so $x = 0$ only: one point, the line is tangent to the circle.' : 'Negative, so no real $x$: the line misses the circle (over $\\mathbb C$ there would be two points).', cnt === 2 ? `正なので $x = \\pm\\sqrt{${R * R - c * c}}$ の 2 点です。直線は円と 2 回交わります。` : cnt === 1 ? '$0$ なので $x = 0$ だけで 1 点です。直線は円に接します。' : '負なので実数の $x$ はありません。直線は円と交わりません（複素数まで広げれば 2 点です）。']],
        };
      }
      if (form === 1) {
        const nv = r.int(3, 5), k = r.int(1, nv - 1);
        const eqs = Array.from({ length: k }, (_, i) => `x_${i + 1} + x_${i + 2} - ${i + 1}`);
        return {
          q: [`In $\\mathbb A^${nv}$ with coordinates $x_1, \\dots, x_${nv}$, what is the dimension of $V(${eqs.join(',\; ')})$? (These equations are independent.)`, `座標 $x_1, \\dots, x_${nv}$ の $\\mathbb A^${nv}$ で、$V(${eqs.join(',\; ')})$ の次元はいくつですか（これらの方程式は独立です）。`],
          a: { type: 'int', v: nv - k },
          hint: ['Each independent equation removes one dimension.', '独立な方程式 1 本ごとに次元が 1 つ減ります。'],
          sol: [[`The ambient space has dimension ${nv} and there are ${k} independent equations.`, `全体の空間の次元は ${nv}、独立な方程式は ${k} 本です。`],
                [`Dimension $= ${nv} - ${k} = ${nv - k}$. These are linear, so $V$ is an affine subspace of that dimension.`, `次元は $${nv} - ${k} = ${nv - k}$ です。式は 1 次なので、$V$ はその次元のアフィン部分空間です。`]],
        };
      }
      let p, q;
      do { p = r.int(-3, 3); q = r.int(-3, 3); } while (p === q);
      const mult = r.int(2, 3);
      return {
        q: [`How many points does $V\\big((x - ${p})^${mult}(x - ${q})\\big) \\subset \\mathbb A^1$ have?`, `$V\\big((x - ${p})^${mult}(x - ${q})\\big) \\subset \\mathbb A^1$ の点はいくつありますか。`],
        a: { type: 'int', v: 2 },
        hint: ['$V(f)$ is a set of points; it does not record multiplicity.', '$V(f)$ は点の集合で、重複度は記録しません。'],
        sol: [[`The zeros are $x = ${p}$ (with multiplicity ${mult}) and $x = ${q}$.`, `零点は $x = ${p}$（重複度 ${mult}）と $x = ${q}$ です。`],
              [`As a set that is 2 points. The ideal $((x - ${p})^${mult}(x - ${q}))$ remembers the multiplicity, but $V$ forgets it.`, `集合としては 2 点です。イデアル $((x - ${p})^${mult}(x - ${q}))$ は重複度を覚えていますが、$V$ は忘れてしまいます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const a = r.int(-4, 4), b = r.int(-4, 4);
      const g = terms([[1, 'x^3'], [a, 'x'], [b, '']]);
      if (form === 0) {
        const sq = `(${g})^2`;
        return {
          q: [`In the coordinate ring of $y^2 = ${g}$, the relation $y^2 = ${g}$ holds. Write $y^4$ as a polynomial in $x$ alone.`, `曲線 $y^2 = ${g}$ の座標環では、関係式 $y^2 = ${g}$ が成り立ちます。$y^4$ を $x$ だけの多項式で表してください。`],
          a: { type: 'expr', v: E(`(x^3 + ${a}*x + ${b})^2`), vars: ['x'], dom: { x: [0.3, 1.5] }, lhs: ['$y^4=$', '$y^4=$'] },
          hint: ['$y^4 = (y^2)^2$.', '$y^4 = (y^2)^2$ です。'],
          sol: [[`$y^4 = (y^2)^2 = (${g})^2$.`, `$y^4 = (y^2)^2 = (${g})^2$ です。`],
                [`Every power of $y$ can be reduced this way, so each element of the coordinate ring is $p(x) + q(x)\\,y$.`, `$y$ のべきはすべてこのように簡約できるので、座標環の元はどれも $p(x) + q(x)\\,y$ の形に書けます。`]],
        };
      }
      if (form === 1) {
        return {
          q: [`In the coordinate ring of $y^2 = ${g}$, write $y^3$ in the form $p(x)\\,y$. Give $p(x)$.`, `曲線 $y^2 = ${g}$ の座標環で、$y^3$ を $p(x)\\,y$ の形に書いてください。$p(x)$ を答えます。`],
          a: { type: 'expr', v: E(`x^3 + ${a}*x + ${b}`), vars: ['x'], dom: { x: [0.3, 1.5] }, lhs: ['$p(x)=$', '$p(x)=$'] },
          hint: ['$y^3 = y \\cdot y^2$.', '$y^3 = y \\cdot y^2$ です。'],
          sol: [[`$y^3 = y \\cdot y^2 = (${g})\\,y$.`, `$y^3 = y \\cdot y^2 = (${g})\\,y$ です。`],
                [`So $p(x) = ${g}$. The relation lets us trade every $y^2$ for a polynomial in $x$.`, `よって $p(x) = ${g}$ です。この関係式で、$y^2$ はすべて $x$ の多項式に置き換えられます。`]],
        };
      }
      return {
        q: [`In the coordinate ring of $y^2 = ${g}$, write $(y + x)(y - x)$ as a polynomial in $x$ alone.`, `曲線 $y^2 = ${g}$ の座標環で、$(y + x)(y - x)$ を $x$ だけの多項式で表してください。`],
        a: { type: 'expr', v: E(`x^3 - x^2 + ${a}*x + ${b}`), vars: ['x'], dom: { x: [0.3, 1.5] }, lhs: ['$(y+x)(y-x)=$', '$(y+x)(y-x)=$'] },
        hint: ['Expand to $y^2 - x^2$ first.', 'まず $y^2 - x^2$ に展開します。'],
        sol: [[`$(y + x)(y - x) = y^2 - x^2$.`, `$(y + x)(y - x) = y^2 - x^2$ です。`],
              [`Replace $y^2$ by $${g}$: the result is $${terms([[1, 'x^3'], [-1, 'x^2'], [a, 'x'], [b, '']])}$.`, `$y^2$ を $${g}$ に置き換えて、結果は $${terms([[1, 'x^3'], [-1, 'x^2'], [a, 'x'], [b, '']])}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-4, 4), b = r.nz(-4, 4);
        return {
          q: [`Homogenize $y^2 - x^3 ${a < 0 ? '+' : '-'} ${Math.abs(a)}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$ with the new variable $z$ so that every term has degree $3$. Give the result.`, `$y^2 - x^3 ${a < 0 ? '+' : '-'} ${Math.abs(a)}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$ を新しい変数 $z$ で同次化し、すべての項が 3 次になるようにしてください。結果を答えます。`],
          a: { type: 'expr', v: E(`y^2*z - x^3 - ${a}*x*z^2 - ${b}*z^3`), vars: ['x', 'y', 'z'], lhs: ['$F(x,y,z)=$', '$F(x,y,z)=$'] },
          hint: ['Multiply each term by the power of $z$ that brings it to degree 3.', '各項に $z$ のべきを掛けて、3 次にそろえます。'],
          sol: [[`$y^2$ has degree 2, so it becomes $y^2z$; $x$ becomes $xz^2$; the constant becomes $z^3$.`, `$y^2$ は 2 次なので $y^2z$、$x$ は $xz^2$、定数項は $z^3$ になります。`],
                [`$F = y^2z - x^3 ${-a < 0 ? '-' : '+'} ${Math.abs(a)}xz^2 ${-b < 0 ? '-' : '+'} ${Math.abs(b)}z^3$. Setting $z = 1$ recovers the affine curve; setting $z = 0$ gives the points at infinity.`, `$F = y^2z - x^3 ${-a < 0 ? '-' : '+'} ${Math.abs(a)}xz^2 ${-b < 0 ? '-' : '+'} ${Math.abs(b)}z^3$ です。$z = 1$ とおくとアフィン曲線に戻り、$z = 0$ とおくと無限遠点が得られます。`]],
        };
      }
      if (form === 1) {
        const opts = [
          { c: 'y = x^2 + 1', k: 1, why: ['top-degree part $x^2$ vanishes only at $x = 0$: the single point $[0:1:0]$', '最高次の部分 $x^2$ は $x = 0$ でだけ $0$ になり、点 $[0:1:0]$ の 1 つだけです'] },
          { c: 'xy = 1', k: 2, why: ['top-degree part $xy$ vanishes at $[1:0:0]$ and $[0:1:0]$', '最高次の部分 $xy$ は $[1:0:0]$ と $[0:1:0]$ で $0$ になります'] },
          { c: 'x^2 - y^2 = 1', k: 2, why: ['top-degree part $x^2 - y^2$ vanishes at $[1:1:0]$ and $[1:-1:0]$', '最高次の部分 $x^2 - y^2$ は $[1:1:0]$ と $[1:-1:0]$ で $0$ になります'] },
          { c: 'x^2 + y^2 = 1', k: 2, why: ['top-degree part $x^2 + y^2$ vanishes at $[1:i:0]$ and $[1:-i:0]$ (complex points)', '最高次の部分 $x^2 + y^2$ は $[1:i:0]$ と $[1:-i:0]$（複素数の点）で $0$ になります'] },
          { c: 'y^2 = x^3 + x', k: 1, why: ['top-degree part $x^3$ vanishes only at $x = 0$: the point $[0:1:0]$', '最高次の部分 $x^3$ は $x = 0$ でだけ $0$ になり、点 $[0:1:0]$ です'] },
          { c: 'x^3 + y^3 = 1', k: 3, why: ['top-degree part $x^3 + y^3$ has three distinct roots in $x/y$', '最高次の部分 $x^3 + y^3$ は $x/y$ について相異なる 3 つの根をもちます'] },
        ];
        const o = r.pick(opts);
        return {
          q: [`How many points at infinity (over $\\mathbb C$) does the projective closure of $${o.c}$ have?`, `$${o.c}$ の射影閉包には、（複素数の範囲で）無限遠点がいくつありますか。`],
          a: { type: 'int', v: o.k },
          hint: ['Homogenize, set $z = 0$, and count the distinct solutions $[x:y:0]$ of the top-degree part.', '同次化して $z = 0$ とおき、最高次の部分の相異なる解 $[x:y:0]$ を数えます。'],
          sol: [[`At infinity $z = 0$ and only the top-degree part of the equation survives.`, `無限遠では $z = 0$ なので、方程式の最高次の部分だけが残ります。`],
                [`Here ${o.why[0]}, so there are ${o.k}. The closure adds exactly these points to the affine curve.`, `ここでは${o.why[1]}ので、${o.k} 個です。射影閉包は、アフィン曲線にちょうどこれらの点を加えます。`]],
        };
      }
      const d1 = r.int(1, 4), d2 = r.int(2, 4);
      return {
        q: [`A plane curve of degree ${d1} and another of degree ${d2} have no common component. Counting multiplicity and including complex points and points at infinity, how many points do they share?`, `次数 ${d1} と次数 ${d2} の平面曲線が、共通の成分をもたないとします。重複度を数え、複素数の点と無限遠点も含めると、共有する点はいくつですか。`],
        a: { type: 'int', v: d1 * d2 },
        hint: ['This is Bezout\'s theorem.', 'ベズーの定理です。'],
        sol: [[`In $\\mathbb P^2$ over $\\mathbb C$, two curves of degrees $d_1, d_2$ meet in exactly $d_1 d_2$ points counted with multiplicity.`, `$\\mathbb C$ 上の $\\mathbb P^2$ では、次数 $d_1, d_2$ の 2 つの曲線は重複度を数えてちょうど $d_1 d_2$ 点で交わります。`],
              [`Here ${d1} $\\times$ ${d2} = ${d1 * d2}. In the affine plane over $\\mathbb R$ you may see fewer: some intersections are complex, at infinity, or coincident.`, `ここでは ${d1} $\\times$ ${d2} = ${d1 * d2} です。実数のアフィン平面では、複素数の交点や無限遠の交点、重なった交点があるため、見える点はもっと少なくなることがあります。`]],
      };
    },
  ];
})();
