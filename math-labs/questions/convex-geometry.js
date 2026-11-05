'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, DEG = PI / 180, S3 = Math.sqrt(3);
  // the Gamma function (Lanczos), written out again here (generators do not load the topic module)
  const gam = (x) => {
    if (x < 0.5) return PI / (Math.sin(PI * x) * gam(1 - x));
    x -= 1;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    let a = c[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return Math.sqrt(2 * PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
  };
  const vol = (s) => (8 * Math.pow(gam(1 + s), 3)) / gam(1 + 3 * s);                      // volume of the unit l_p ball in R^3, s = 1/p
  const tf = (a, b) => (b === 1 ? `${a}` : `\\frac{${a}}{${b}}`);                         // a/b as TeX
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const clampStep = (x, lo, hi, st) => Math.min(hi, Math.max(lo, Math.round(x / st) * st));

  /* ---------------- convex-polar ---------------- */
  Q['convex-polar'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const [pa, pb] = r.pick([[4, 1], [5, 1], [10, 1], [20, 1], [5, 4], [5, 3], [5, 2], [10, 9], [4, 3]]), p = pa / pb, qa = pa, qb = pa - pb, g = gcd(qa, qb), q = pa / (pa - pb);
        return {
          q: [`The unit ball of the $\\ell^p$ norm in $\\mathbb{R}^3$ has the unit ball of the $\\ell^q$ norm as its polar, where $1/p + 1/q = 1$. For $p = ${tf(pa, pb)}$, what is $q$?`, `$\\mathbb{R}^3$ における $\\ell^p$ ノルムの単位球の極は、$1/p + 1/q = 1$ を満たす $\\ell^q$ ノルムの単位球です。$p = ${tf(pa, pb)}$ のとき、$q$ はいくつですか。`],
          a: { type: 'num', v: q, rel: 0.003, show: tf(qa / g, qb / g) },
          hint: ['Solve $1/q = 1 - 1/p$.', '$1/q = 1 - 1/p$ を解きます。'],
          sol: [[`$1/q = 1 - 1/p = 1 - ${n(1 / p, 4)} = ${n(1 - 1 / p, 4)}$.`, `$1/q = 1 - 1/p = 1 - ${n(1 / p, 4)} = ${n(1 - 1 / p, 4)}$ です。`], [`So $q = ${n(q, 4)}$. A ball with a large exponent is boxy; its polar has an exponent near 1 and is pointy.`, `よって $q = ${n(q, 4)}$ です。指数の大きい球は角ばっていて、その極は指数が 1 に近く、とがっています。`]],
          set: { s: Math.round(100 / p) / 100 },
        };
      }
      if (form === 1) {
        const [nm, nmJ, V, E, F] = r.pick([['cube', '立方体', 8, 12, 6], ['regular octahedron', '正八面体', 6, 12, 8], ['regular tetrahedron', '正四面体', 4, 6, 4], ['triangular prism', '三角柱', 6, 9, 5], ['square pyramid', '四角錐', 5, 8, 5], ['regular dodecahedron', '正十二面体', 20, 30, 12], ['regular icosahedron', '正二十面体', 12, 30, 20], ['pentagonal prism', '五角柱', 10, 15, 7]]), what = r.int(0, 2);
        const ans = [F, V, E][what], nameE = ['vertices', 'faces', 'edges'][what], nameJ = ['頂点', '面', '辺'][what];
        return {
          q: [`A ${nm} has $${V}$ vertices, $${E}$ edges and $${F}$ faces. How many ${nameE} does its polar polytope have?`, `${nmJ}には頂点が $${V}$ 個、辺が $${E}$ 本、面が $${F}$ 枚あります。その極多面体の${nameJ}はいくつありますか。`],
          a: { type: 'int', v: ans },
          hint: ['Each face of $K$ lies in a plane $\\langle x,y\\rangle = 1$, which is one vertex $y$ of the polar; each vertex of $K$ gives one face of the polar.', '$K$ の各面は平面 $\\langle x,y\\rangle = 1$ にあり、これが極の一つの頂点 $y$ です。$K$ の各頂点は極の一つの面を与えます。'],
          sol: [[`Polarity swaps vertices and faces and keeps edges: $(V,E,F) \\to (F,E,V)$.`, `極をとると頂点と面が入れ替わり、辺は保たれます。$(V,E,F) \\to (F,E,V)$ です。`], [`The polar therefore has $${F}$ vertices, $${E}$ edges and $${V}$ faces, and $${F} - ${E} + ${V} = 2$ still holds. The answer is $${ans}$.`, `したがって極には頂点が $${F}$ 個、辺が $${E}$ 本、面が $${V}$ 枚あり、$${F} - ${E} + ${V} = 2$ も成り立ちます。答えは $${ans}$ です。`]],
          set: nm === 'cube' ? { s: 0 } : undefined,
        };
      }
      if (form === 2) {
        const c = r.step(0.5, 4, 0.5);
        return {
          q: [`The point $y = (0, 0, ${n(c, 1)})$ lies on the boundary of the polar $K^\\circ$. It stands for the plane $\\langle x, y\\rangle = 1$. At what height $z$ does that plane cut the vertical axis?`, `点 $y = (0, 0, ${n(c, 1)})$ は極 $K^\\circ$ の境界上にあります。これは平面 $\\langle x, y\\rangle = 1$ を表します。この平面が鉛直軸と交わる高さ $z$ はいくつですか。`],
          a: { type: 'num', v: 1 / c, rel: 0.003, show: `\\frac{1}{${n(c, 1)}}` },
          hint: ['Put $x = (0,0,z)$ in $\\langle x,y\\rangle = 1$.', '$x = (0,0,z)$ を $\\langle x,y\\rangle = 1$ に代入します。'],
          sol: [[`$\\langle (0,0,z), (0,0,${n(c, 1)})\\rangle = ${n(c, 1)}\\,z = 1$, so $z = ${n(1 / c, 4)}$.`, `$\\langle (0,0,z), (0,0,${n(c, 1)})\\rangle = ${n(c, 1)}\\,z = 1$ なので $z = ${n(1 / c, 4)}$ です。`], ['The farther the point $y$ is from the origin, the closer its plane is to the origin: polarity inverts distances.', '点 $y$ が原点から遠いほど、その平面は原点に近くなります。極をとると距離は逆数になります。']],
        };
      }
      const [nm, nmJ, ans, ch] = r.pick([['regular dodecahedron', '正十二面体', 'regular icosahedron', 0], ['regular icosahedron', '正二十面体', 'regular dodecahedron', 0], ['regular octahedron', '正八面体', 'cube', 0], ['cube', '立方体', 'regular octahedron', 0], ['regular tetrahedron', '正四面体', 'regular tetrahedron', 0]]);
      const all = [['regular tetrahedron', '正四面体'], ['cube', '立方体'], ['regular octahedron', '正八面体'], ['regular dodecahedron', '正十二面体'], ['regular icosahedron', '正二十面体']];
      const opts = all.filter((o) => o[0] !== ans).slice(0, 3).concat([all.find((o) => o[0] === ans)]).map((o) => [`the ${o[0]}`, o[1]]);
      return {
        q: [`Take the regular ${nm.replace('regular ', '')} centred at the origin. Which Platonic solid is its polar?`, `原点を中心とする${nmJ}を考えます。その極はどの正多面体ですか。`],
        a: { type: 'choice', opts, v: opts.length - 1 },
        hint: ['Count: the polar swaps the number of vertices with the number of faces.', '数えます。極をとると頂点の数と面の数が入れ替わります。'],
        sol: [[`A ${nm.replace('regular ', '')} has the counts $(V,F)$ that the polar must exchange, and the Platonic solid with exactly those swapped counts is the ${ans.replace('regular ', '')}.`, `${nmJ}の頂点の数と面の数を入れ替えたものを持つ正多面体を探すと、それは${all.find((o) => o[0] === ans)[1]}です。`], ['The tetrahedron is its own polar, and the other four solids pair off: cube with octahedron, dodecahedron with icosahedron.', '正四面体は自分自身の極で、残りの四つは、立方体と正八面体、正十二面体と正二十面体のように組になります。']],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.step(0.5, 3, 0.5), polarVol = 4 / 3 / (a * a * a), prod = r.chance(0.5);
        return prod ? {
          q: [`The cube $[-${n(a, 1)}, ${n(a, 1)}]^3$ has as its polar the octahedron $|y_1| + |y_2| + |y_3| \\le 1/${n(a, 1)}$. What is the product of the volume of the cube and the volume of its polar?`, `立方体 $[-${n(a, 1)}, ${n(a, 1)}]^3$ の極は正八面体 $|y_1| + |y_2| + |y_3| \\le 1/${n(a, 1)}$ です。立方体の体積とその極の体積の積はいくつですか。`],
          a: { type: 'num', v: 32 / 3, rel: 0.003, show: '\\frac{32}{3}' },
          hint: ['Scaling $K$ by $c$ scales $K^\\circ$ by $1/c$, so the volumes change by $c^3$ and $c^{-3}$.', '$K$ を $c$ 倍すると $K^\\circ$ は $1/c$ 倍になるので、体積は $c^3$ 倍と $c^{-3}$ 倍になります。'],
          sol: [[`Cube volume $(2\\cdot${n(a, 1)})^3 = ${n(8 * a ** 3, 4)}$. The octahedron $|y_1|+|y_2|+|y_3| \\le \\rho$ has volume $\\frac43\\rho^3$, here $\\frac43 ${n(a, 1)}^{-3} = ${n(polarVol, 4)}$.`, `立方体の体積は $(2\\cdot${n(a, 1)})^3 = ${n(8 * a ** 3, 4)}$ です。正八面体 $|y_1|+|y_2|+|y_3| \\le \\rho$ の体積は $\\frac43\\rho^3$ で、ここでは $\\frac43 ${n(a, 1)}^{-3} = ${n(polarVol, 4)}$ です。`], [`The product is $${n(8 * a ** 3, 4)} \\times ${n(polarVol, 4)} = \\frac{32}{3} = 10.667$, for every $a$: it depends on the shape only.`, `積は $${n(8 * a ** 3, 4)} \\times ${n(polarVol, 4)} = \\frac{32}{3} = 10.667$ で、$a$ によりません。形だけで決まります。`]],
          set: { s: 0 },
        } : {
          q: [`The cube $[-${n(a, 1)}, ${n(a, 1)}]^3$ has as its polar the octahedron $|y_1| + |y_2| + |y_3| \\le 1/${n(a, 1)}$. What is the volume of this octahedron?`, `立方体 $[-${n(a, 1)}, ${n(a, 1)}]^3$ の極は正八面体 $|y_1| + |y_2| + |y_3| \\le 1/${n(a, 1)}$ です。この正八面体の体積はいくつですか。`],
          a: { type: 'num', v: polarVol, rel: 0.004, show: `\\frac{4}{3\\cdot ${n(a, 1)}^3}` },
          hint: ['The octahedron $|y_1|+|y_2|+|y_3| \\le \\rho$ has volume $\\frac43\\rho^3$.', '正八面体 $|y_1|+|y_2|+|y_3| \\le \\rho$ の体積は $\\frac43\\rho^3$ です。'],
          sol: [[`With $\\rho = 1/${n(a, 1)}$, the volume is $\\frac43 \\rho^3 = \\frac43 \\cdot ${n(1 / a ** 3, 4)}$.`, `$\\rho = 1/${n(a, 1)}$ なので、体積は $\\frac43 \\rho^3 = \\frac43 \\cdot ${n(1 / a ** 3, 4)}$ です。`], [`That is $${n(polarVol, 4)}$. A bigger cube has a smaller polar, since the cube’s volume $${n(8 * a ** 3, 3)}$ times this stays at $32/3$.`, `つまり $${n(polarVol, 4)}$ です。大きい立方体ほど極は小さくなり、立方体の体積 $${n(8 * a ** 3, 3)}$ との積は $32/3$ に保たれます。`]],
          set: { s: 0 },
        };
      }
      if (form === 1) {
        const rr = r.step(0.5, 3, 0.5), V = (8 * 1) / 1 / (rr ** 3);
        return {
          q: [`The octahedron $|x_1| + |x_2| + |x_3| \\le ${n(rr, 1)}$ has the cube as its polar. What is the volume of the polar cube $[-1/${n(rr, 1)}, 1/${n(rr, 1)}]^3$?`, `正八面体 $|x_1| + |x_2| + |x_3| \\le ${n(rr, 1)}$ の極は立方体です。極の立方体 $[-1/${n(rr, 1)}, 1/${n(rr, 1)}]^3$ の体積はいくつですか。`],
          a: { type: 'num', v: V, rel: 0.004, show: `\\frac{8}{${n(rr, 1)}^3}` },
          hint: ['A cube of half-side $a$ has volume $(2a)^3$.', '半辺 $a$ の立方体の体積は $(2a)^3$ です。'],
          sol: [[`The half-side is $a = 1/${n(rr, 1)}$, so the volume is $(2a)^3 = 8a^3 = 8/${n(rr, 1)}^3$.`, `半辺は $a = 1/${n(rr, 1)}$ なので、体積は $(2a)^3 = 8a^3 = 8/${n(rr, 1)}^3$ です。`], [`That is $${n(V, 4)}$. The octahedron’s volume is $\\frac43 ${n(rr, 1)}^3$, and the product is again $32/3$.`, `つまり $${n(V, 4)}$ です。正八面体の体積は $\\frac43 ${n(rr, 1)}^3$ で、積はやはり $32/3$ です。`]],
        };
      }
      if (form === 2) {
        const [pe, qe, sv] = r.pick([[3, '3/2', 0], [4, '4/3', 0.25], [5, '5/4', 0.2]]), qn = pe / (pe - 1), ys = [r.int(1, 4), r.int(1, 4), r.int(1, 4)].map((t) => t * r.sign()), h = Math.pow(ys.reduce((a, t) => a + Math.pow(Math.abs(t), qn), 0), 1 / qn);
        return {
          q: [`Let $K$ be the unit ball of the $\\ell^{${pe}}$ norm in $\\mathbb{R}^3$. What is its support function $h_K(y) = \\max_{x\\in K}\\langle x, y\\rangle$ at $y = (${ys.join(', ')})$?`, `$K$ を $\\mathbb{R}^3$ における $\\ell^{${pe}}$ ノルムの単位球とします。$y = (${ys.join(', ')})$ での支持関数 $h_K(y) = \\max_{x\\in K}\\langle x, y\\rangle$ はいくつですか。`],
          a: { type: 'num', v: h, rel: 0.004 },
          hint: [`The support function of an $\\ell^p$ ball is the $\\ell^q$ norm, $q = ${qe}$.`, `$\\ell^p$ 球の支持関数は $\\ell^q$ ノルムで、$q = ${qe}$ です。`],
          sol: [[`$h_K(y) = \\|y\\|_q$ with $q = ${qe}$, so $h_K(y) = (${ys.map((t) => `${Math.abs(t)}^{${qe}}`).join(' + ')})^{1/q}$.`, `$h_K(y) = \\|y\\|_q$（$q = ${qe}$）なので、$h_K(y) = (${ys.map((t) => `${Math.abs(t)}^{${qe}}`).join(' + ')})^{1/q}$ です。`], [`The sum is $${n(Math.pow(h, qn), 4)}$ and its power $1/q$ is $${n(h, 4)}$. This is the largest value of $\\langle x, y\\rangle$ over $K$.`, `和は $${n(Math.pow(h, qn), 4)}$、その $1/q$ 乗は $${n(h, 4)}$ です。これが $K$ 上での $\\langle x, y\\rangle$ の最大値です。`]],
          set: sv ? { s: sv } : undefined,
        };
      }
      const a = r.int(1, 3), b = r.int(1, 3), c = r.int(1, 3), nn = Math.pow(a ** 4 + b ** 4 + c ** 4, 0.25);
      return {
        q: [`Let $K$ be the unit ball of the $\\ell^4$ norm. The point $y = (${a ** 3}, ${b ** 3}, ${c ** 3})$ of the polar stands for a tangent plane of $K$. Where does that plane touch $K$? Give $x^* = (x_1, x_2, x_3)$.`, `$K$ を $\\ell^4$ ノルムの単位球とします。極の点 $y = (${a ** 3}, ${b ** 3}, ${c ** 3})$ は $K$ の接平面を表します。その平面は $K$ のどこで接しますか。$x^* = (x_1, x_2, x_3)$ を答えてください。`],
        a: { type: 'tuple', v: [a / nn, b / nn, c / nn], labels: ['$x_1$', '$x_2$', '$x_3$'], rel: 0.005 },
        hint: ['Maximise $\\langle x,y\\rangle$ on $\\sum x_i^4 = 1$: the gradient condition gives $x_i^3 \\propto y_i$.', '$\\sum x_i^4 = 1$ のもとで $\\langle x,y\\rangle$ を最大にします。勾配の条件から $x_i^3 \\propto y_i$ です。'],
        sol: [[`Lagrange: $y_i = 4\\lambda x_i^3$, so $x \\propto (y_1^{1/3}, y_2^{1/3}, y_3^{1/3}) = (${a}, ${b}, ${c})$.`, `ラグランジュ乗数法から $y_i = 4\\lambda x_i^3$ なので、$x \\propto (y_1^{1/3}, y_2^{1/3}, y_3^{1/3}) = (${a}, ${b}, ${c})$ です。`], [`Scale so that $\\sum x_i^4 = 1$: divide by $(${a ** 4} + ${b ** 4} + ${c ** 4})^{1/4} = ${n(nn, 4)}$. So $x^* = (${n(a / nn, 4)}, ${n(b / nn, 4)}, ${n(c / nn, 4)})$.`, `$\\sum x_i^4 = 1$ になるように $(${a ** 4} + ${b ** 4} + ${c ** 4})^{1/4} = ${n(nn, 4)}$ で割ります。よって $x^* = (${n(a / nn, 4)}, ${n(b / nn, 4)}, ${n(c / nn, 4)})$ です。`]],
        set: { s: 0.25 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const pv = r.pick([4, 3]), s = 1 / pv, V1 = vol(s), V2 = vol(1 - s), g1 = gam(1 + s), g2 = gam(2 - s), g3 = pv === 4 ? gam(1 + 3 * s) : 1, qp = pv / (pv - 1);
        const need = pv === 4 ? [['\\Gamma(5/4)', g1], ['\\Gamma(7/4)', gam(1.75)], ['\\Gamma(13/4)', gam(3.25)]] : [['\\Gamma(4/3)', g1], ['\\Gamma(5/3)', g2], ['\\Gamma(3)', 2]];
        const given = need.map(([nm, v]) => `$${nm} = ${n(v, 5)}$`).join(', ');
        return {
          q: [`The unit ball of $\\ell^p$ in $\\mathbb{R}^3$ has volume $8\\,\\Gamma(1+1/p)^3 / \\Gamma(1+3/p)$. Use ${given} to find the product of the volumes of the $\\ell^{${pv}}$ ball and its polar, the $\\ell^{${pv === 4 ? '4/3' : '3/2'}}$ ball.`, `$\\mathbb{R}^3$ における $\\ell^p$ の単位球の体積は $8\\,\\Gamma(1+1/p)^3 / \\Gamma(1+3/p)$ です。${given} を使って、$\\ell^{${pv}}$ 球とその極である $\\ell^{${pv === 4 ? '4/3' : '3/2'}}$ 球の体積の積を求めてください。`],
          a: { type: 'num', v: V1 * V2, rel: 0.006 },
          hint: ['Evaluate the formula at $p$ and at $q$, then multiply. In terms of $s = 1/p$ the polar has $1 - s$.', '公式を $p$ と $q$ で評価して掛けます。$s = 1/p$ とすると、極は $1 - s$ です。'],
          sol: [[`For $p = ${pv}$: $8\\,\\Gamma(${pv === 4 ? '5/4' : '4/3'})^3/\\Gamma(${pv === 4 ? '7/4' : '2'}) = ${n(V1, 4)}$.`, `$p = ${pv}$ のとき $8\\,\\Gamma(${pv === 4 ? '5/4' : '4/3'})^3/\\Gamma(${pv === 4 ? '7/4' : '2'}) = ${n(V1, 4)}$ です。`], [`For $q = ${qp === 4 / 3 ? '4/3' : '3/2'}$: $8\\,\\Gamma(${pv === 4 ? '7/4' : '5/3'})^3/\\Gamma(${pv === 4 ? '13/4' : '3'}) = ${n(V2, 4)}$.`, `$q = ${qp === 4 / 3 ? '4/3' : '3/2'}$ のとき $8\\,\\Gamma(${pv === 4 ? '7/4' : '5/3'})^3/\\Gamma(${pv === 4 ? '13/4' : '3'}) = ${n(V2, 4)}$ です。`], [`Product: $${n(V1, 4)} \\times ${n(V2, 4)} = ${n(V1 * V2, 4)}$, between $32/3 = 10.67$ and $(4\\pi/3)^2 = 17.55$ as it must be.`, `積は $${n(V1, 4)} \\times ${n(V2, 4)} = ${n(V1 * V2, 4)}$ で、$32/3 = 10.67$ と $(4\\pi/3)^2 = 17.55$ の間に入っています。`]],
          set: pv === 4 ? { s: 0.25 } : undefined,
        };
      }
      if (form === 1) {
        const cands = [10.9, 11.5, 12.8, 13.9, 14.7, 15.6, 16.4, 17.1], inside = r.sample(cands, 3).map((x) => x), bad = r.pick([[8.3, 'below 32/3 = 10.67, the smallest possible'], [9.6, 'below 32/3 = 10.67, the smallest possible'], [18.4, 'above (4π/3)² = 17.55, the largest possible'], [19.6, 'above (4π/3)² = 17.55, the largest possible']]);
        const opts = inside.concat([bad[0]]), idx = opts.length - 1, low = bad[0] < 10;
        return {
          q: [`In $\\mathbb{R}^3$ every centrally symmetric convex body $K$ has $\\mathrm{vol}K \\cdot \\mathrm{vol}K^\\circ$ between $32/3$ and $(4\\pi/3)^2$. One of these four numbers cannot be that product for any such body. Which?`, `$\\mathbb{R}^3$ では、点対称な凸体 $K$ の $\\mathrm{vol}K \\cdot \\mathrm{vol}K^\\circ$ は $32/3$ と $(4\\pi/3)^2$ の間にあります。次の四つの数のうち、そのような物体の積としてありえないものはどれですか。`],
          a: { type: 'choice', opts: opts.map((x) => [`$${x}$`, `$${x}$`]), v: idx },
          hint: ['Compare each number with $32/3 \\approx 10.67$ and $(4\\pi/3)^2 \\approx 17.55$.', '各数を $32/3 \\approx 10.67$ と $(4\\pi/3)^2 \\approx 17.55$ と比べます。'],
          sol: [[`The lower bound $32/3 = 10.67$ is attained by the cube and the octahedron, and the upper bound $(4\\pi/3)^2 = 17.55$ by the ball and every ellipsoid.`, `下限 $32/3 = 10.67$ は立方体と正八面体で、上限 $(4\\pi/3)^2 = 17.55$ は球とすべての楕円体で達成されます。`], [`Only $${bad[0]}$ lies ${low ? 'below the smallest possible value' : 'above the largest possible value'}; the other three are inside the range and occur along the family from cube to ball.`, `$${bad[0]}$ だけが${low ? '最小値より小さく' : '最大値より大きく'}、ほかの三つは範囲の内側にあって、立方体から球への族の途中で実際に現れます。`]],
          set: undefined,
        };
      }
      if (form === 2) {
        const [pe, sv] = r.pick([[3, 0], [4, 0.25], [5, 0.2]]), qs = pe === 3 ? '3/2' : pe === 4 ? '4/3' : '5/4';
        return {
          q: [`Let $K$ be the unit ball of the $\\ell^{${pe}}$ norm in $\\mathbb{R}^3$. For $y = (u, v, w)$ with $u, v, w > 0$, give the support function $h_K(y)$ as a formula.`, `$K$ を $\\mathbb{R}^3$ における $\\ell^{${pe}}$ ノルムの単位球とします。$u, v, w > 0$ として、$y = (u, v, w)$ での支持関数 $h_K(y)$ を式で答えてください。`],
          a: { type: 'expr', v: `(u^(${qs})+v^(${qs})+w^(${qs}))^(1/(${qs}))`, vars: ['u', 'v', 'w'], lhs: ['$h_K(y) =$', '$h_K(y) =$'] },
          hint: ['The support function of the unit ball of a norm is the dual norm.', 'ノルムの単位球の支持関数は双対ノルムです。'],
          sol: [[`By Hölder’s inequality $\\langle x, y\\rangle \\le \\|x\\|_${pe}\\|y\\|_q \\le \\|y\\|_q$ on $K$, with equality at a suitable $x$.`, `ヘルダーの不等式から $K$ 上で $\\langle x, y\\rangle \\le \\|x\\|_${pe}\\|y\\|_q \\le \\|y\\|_q$ で、適当な $x$ で等号が成り立ちます。`], [`The conjugate exponent is $q = ${qs}$, so $h_K(y) = (u^{${qs}} + v^{${qs}} + w^{${qs}})^{1/q}$.`, `共役な指数は $q = ${qs}$ なので、$h_K(y) = (u^{${qs}} + v^{${qs}} + w^{${qs}})^{1/q}$ です。`]],
          set: sv ? { s: sv } : undefined,
        };
      }
      const Vt = r.step(0.5, 6, 0.5), a = Math.cbrt(4 / (3 * Vt));
      return {
        q: [`A cube $[-a, a]^3$ is scaled so that its polar octahedron has volume $${n(Vt, 1)}$. What is the half-side $a$ of the cube?`, `立方体 $[-a, a]^3$ の大きさを、その極である正八面体の体積が $${n(Vt, 1)}$ になるように決めます。立方体の半辺 $a$ はいくつですか。`],
        a: { type: 'num', v: a, rel: 0.004 },
        hint: ['The polar of $[-a,a]^3$ is $|y_1|+|y_2|+|y_3| \\le 1/a$, of volume $\\frac43 a^{-3}$.', '$[-a,a]^3$ の極は $|y_1|+|y_2|+|y_3| \\le 1/a$ で、体積は $\\frac43 a^{-3}$ です。'],
        sol: [[`$\\frac43 a^{-3} = ${n(Vt, 1)}$, so $a^3 = \\frac{4}{3 \\cdot ${n(Vt, 1)}} = ${n(4 / (3 * Vt), 4)}$.`, `$\\frac43 a^{-3} = ${n(Vt, 1)}$ なので $a^3 = \\frac{4}{3 \\cdot ${n(Vt, 1)}} = ${n(4 / (3 * Vt), 4)}$ です。`], [`Taking the cube root, $a = ${n(a, 4)}$. The cube then has volume $8a^3 = ${n(8 * a ** 3, 3)}$, and $${n(8 * a ** 3, 3)} \\times ${n(Vt, 1)} = 32/3$.`, `立方根をとって $a = ${n(a, 4)}$ です。立方体の体積は $8a^3 = ${n(8 * a ** 3, 3)}$ で、$${n(8 * a ** 3, 3)} \\times ${n(Vt, 1)} = 32/3$ になります。`]],
        set: { s: 0 },
      };
    },
  ];

  /* ---------------- convex-minkowski ---------------- */
  // constants of the shapes of A (scaled by a): [name en, name ja, area/a^2, perimeter/a]
  const SHP = [['square', '正方形', 4, 8], ['equilateral triangle', '正三角形', 3 * S3 / 4, 3 * S3], ['regular hexagon', '正六角形', 3 * S3 / 2, 6], ['rectangle', '長方形', 3.92, 8.4]];
  const shapeDesc = (k, a) => [[`the square $[-${n(a, 2)}, ${n(a, 2)}]^2$`, `正方形 $[-${n(a, 2)}, ${n(a, 2)}]^2$`], [`the equilateral triangle with circumradius ${n(a, 2)}`, `外接円の半径が ${n(a, 2)} の正三角形`], [`the regular hexagon with circumradius ${n(a, 2)}`, `外接円の半径が ${n(a, 2)} の正六角形`], [`the rectangle $[-${n(1.4 * a, 3)}, ${n(1.4 * a, 3)}] \\times [-${n(0.7 * a, 3)}, ${n(0.7 * a, 3)}]$`, `長方形 $[-${n(1.4 * a, 3)}, ${n(1.4 * a, 3)}] \\times [-${n(0.7 * a, 3)}, ${n(0.7 * a, 3)}]$`]][k];
  Q['convex-minkowski'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05);
        return {
          q: [`$A$ is the square $[-${n(a, 2)}, ${n(a, 2)}]^2$ and $tB$ is a disc of radius $${n(t, 2)}$, both centred at the origin. How far does $A + tB$ reach in the direction $\\theta = 0$ (to the right)?`, `$A$ は正方形 $[-${n(a, 2)}, ${n(a, 2)}]^2$、$tB$ は半径 $${n(t, 2)}$ の円板で、どちらも原点が中心です。$A + tB$ は方向 $\\theta = 0$（右向き）にどこまで届きますか。`],
          a: { type: 'num', v: a + t, rel: 0.003 },
          hint: ['Support functions add: $h_{A+tB} = h_A + h_{tB}$.', '支持関数は足し算になります。$h_{A+tB} = h_A + h_{tB}$ です。'],
          sol: [[`$h_A(0) = ${n(a, 2)}$ and the disc reaches $h_{tB}(0) = ${n(t, 2)}$ in every direction.`, `$h_A(0) = ${n(a, 2)}$ で、円板はどの方向にも $h_{tB}(0) = ${n(t, 2)}$ だけ届きます。`], [`So $h_{A+tB}(0) = ${n(a, 2)} + ${n(t, 2)} = ${n(a + t, 3)}$.`, `したがって $h_{A+tB}(0) = ${n(a, 2)} + ${n(t, 2)} = ${n(a + t, 3)}$ です。`]],
          set: { ka: 0, a, kb: 0, t, th: 0 },
        };
      }
      if (form === 1) {
        const a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05);
        return {
          q: [`Two squares with parallel sides, $A = [-${n(a, 2)}, ${n(a, 2)}]^2$ and $tB = [-${n(t, 2)}, ${n(t, 2)}]^2$, are added as Minkowski sums. What is the area of $A + tB$?`, `辺が平行な二つの正方形 $A = [-${n(a, 2)}, ${n(a, 2)}]^2$ と $tB = [-${n(t, 2)}, ${n(t, 2)}]^2$ をミンコフスキー和で足し合わせます。$A + tB$ の面積はいくつですか。`],
          a: { type: 'num', v: 4 * (a + t) ** 2, rel: 0.003 },
          hint: ['Half-sides add.', '半辺は足し算になります。'],
          sol: [[`The sum is the square with half-side $${n(a, 2)} + ${n(t, 2)} = ${n(a + t, 3)}$, because the supports in all four axis directions add.`, `四つの軸方向の支持関数がそれぞれ足し算になるので、和は半辺 $${n(a, 2)} + ${n(t, 2)} = ${n(a + t, 3)}$ の正方形です。`], [`Its area is $(2 \\cdot ${n(a + t, 3)})^2 = ${n(4 * (a + t) ** 2, 4)}$, which exceeds $4a^2 + 4t^2 = ${n(4 * a * a + 4 * t * t, 4)}$ by the mixed term $8at = ${n(8 * a * t, 4)}$.`, `面積は $(2 \\cdot ${n(a + t, 3)})^2 = ${n(4 * (a + t) ** 2, 4)}$ で、$4a^2 + 4t^2 = ${n(4 * a * a + 4 * t * t, 4)}$ より混合項 $8at = ${n(8 * a * t, 4)}$ だけ大きくなります。`]],
          set: { ka: 0, a, kb: 3, t, rot: 0 },
        };
      }
      if (form === 2) {
        const a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05), A = 4 * 1.4 * 0.7 * a * a;
        return {
          q: [`$A$ is the rectangle $[-${n(1.4 * a, 3)}, ${n(1.4 * a, 3)}] \\times [-${n(0.7 * a, 3)}, ${n(0.7 * a, 3)}]$ and $tB$ is the horizontal segment from $(-${n(t, 2)}, 0)$ to $(${n(t, 2)}, 0)$. What is the area of $A + tB$?`, `$A$ は長方形 $[-${n(1.4 * a, 3)}, ${n(1.4 * a, 3)}] \\times [-${n(0.7 * a, 3)}, ${n(0.7 * a, 3)}]$、$tB$ は $(-${n(t, 2)}, 0)$ から $(${n(t, 2)}, 0)$ までの水平な線分です。$A + tB$ の面積はいくつですか。`],
          a: { type: 'num', v: (2.8 * a + 2 * t) * 1.4 * a, rel: 0.003 },
          hint: ['Sliding a horizontal segment along a rectangle only lengthens it.', '長方形の上で水平な線分を滑らせると、横に長くなるだけです。'],
          sol: [[`The sum is a rectangle of width $2(${n(1.4 * a, 3)} + ${n(t, 2)}) = ${n(2.8 * a + 2 * t, 3)}$ and the same height $${n(1.4 * a, 3)}$.`, `和は幅 $2(${n(1.4 * a, 3)} + ${n(t, 2)}) = ${n(2.8 * a + 2 * t, 3)}$、高さは変わらず $${n(1.4 * a, 3)}$ の長方形です。`], [`Its area is $${n((2.8 * a + 2 * t) * 1.4 * a, 4)}$, which is $|A| = ${n(A, 4)}$ plus $2t \\times ${n(1.4 * a, 3)} = ${n(2 * t * 1.4 * a, 4)}$ for the segment’s sweep.`, `面積は $${n((2.8 * a + 2 * t) * 1.4 * a, 4)}$ で、$|A| = ${n(A, 4)}$ に線分が掃く $2t \\times ${n(1.4 * a, 3)} = ${n(2 * t * 1.4 * a, 4)}$ を加えたものです。`]],
          set: { ka: 3, a, kb: 1, t, rot: 0 },
        };
      }
      const [m, k] = r.pick([[5, 3], [4, 3], [5, 4], [6, 3], [7, 5]]);
      return {
        q: [`A convex $${m}$-gon and a convex $${k}$-gon have no two parallel sides. How many sides does their Minkowski sum have?`, `凸 $${m}$ 角形と凸 $${k}$ 角形があり、平行な辺の組はありません。それらのミンコフスキー和は何角形ですか。`],
        a: { type: 'int', v: m + k },
        hint: ['The sides of the sum are the sides of the two bodies, sorted by direction.', '和の辺は、二つの物体の辺を向きで並べ替えたものです。'],
        sol: [[`Each side of $A + B$ is a translate of a side of $A$ or of $B$ with the same outward normal, and with no two normals equal nothing merges.`, `$A + B$ の各辺は、$A$ か $B$ の辺を同じ外向き法線のまま平行移動したもので、法線が等しい組がなければ何も合流しません。`], [`The count is $${m} + ${k} = ${m + k}$. When normals do coincide, the sides merge and the count drops: a square plus a triangle with a horizontal side has $6$ sides, not $7$.`, `辺の数は $${m} + ${k} = ${m + k}$ です。法線が一致するときは辺が合流して数が減り、正方形と水平な辺を持つ三角形の和は $7$ 角形ではなく $6$ 角形になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const k = r.int(0, 3), a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05), [nm, nmJ, ac, pc] = SHP[k], A = ac * a * a, Pm = pc * a, area = A + Pm * t + PI * t * t, [dE, dJ] = shapeDesc(k, a);
        return {
          q: [`Take $A$ to be ${dE}, and $tD$ a disc of radius $t = ${n(t, 2)}$. Use Steiner’s formula to find the area of $A + tD$.`, `$A$ を${dJ}、$tD$ を半径 $t = ${n(t, 2)}$ の円板とします。シュタイナーの公式で $A + tD$ の面積を求めてください。`],
          a: { type: 'num', v: area, rel: 0.004 },
          hint: ['$|A + tD| = |A| + t\\,P(A) + \\pi t^2$.', '$|A + tD| = |A| + t\\,P(A) + \\pi t^2$ です。'],
          sol: [[`For this body $|A| = ${n(A, 4)}$ and the perimeter is $P(A) = ${n(Pm, 4)}$.`, `この物体では $|A| = ${n(A, 4)}$、周長は $P(A) = ${n(Pm, 4)}$ です。`], [`Area $= ${n(A, 4)} + ${n(Pm, 4)} \\cdot ${n(t, 2)} + \\pi \\cdot ${n(t, 2)}^2 = ${n(area, 4)}$: the body, a strip of width $t$ along every edge, and wedges at the corners that together make one disc.`, `面積は $${n(A, 4)} + ${n(Pm, 4)} \\cdot ${n(t, 2)} + \\pi \\cdot ${n(t, 2)}^2 = ${n(area, 4)}$ で、物体そのもの、各辺に沿った幅 $t$ の帯、そして合わせて一つの円板になる頂点の扇形です。`]],
          set: { ka: k, a, kb: 0, t },
        };
      }
      if (form === 1) {
        const k = r.int(0, 3), a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05), [, , , pc] = SHP[k], Pm = pc * a, [dE, dJ] = shapeDesc(k, a);
        return {
          q: [`Take $A$ to be ${dE}, and $tD$ a disc of radius $t = ${n(t, 2)}$. What is the perimeter of $A + tD$?`, `$A$ を${dJ}、$tD$ を半径 $t = ${n(t, 2)}$ の円板とします。$A + tD$ の周長はいくつですか。`],
          a: { type: 'num', v: Pm + 2 * PI * t, rel: 0.004 },
          hint: ['Perimeter is additive under Minkowski sums, $P(A + B) = P(A) + P(B)$.', '周長はミンコフスキー和について加法的で、$P(A + B) = P(A) + P(B)$ です。'],
          sol: [[`$P(A) = ${n(Pm, 4)}$ and the disc has perimeter $2\\pi t = ${n(2 * PI * t, 4)}$.`, `$P(A) = ${n(Pm, 4)}$ で、円板の周長は $2\\pi t = ${n(2 * PI * t, 4)}$ です。`], [`They add: $${n(Pm, 4)} + ${n(2 * PI * t, 4)} = ${n(Pm + 2 * PI * t, 4)}$. (Cauchy’s formula $P = \\int_0^{2\\pi} h\\,d\\theta$ is linear in $h$, and $h$ adds.)`, `足し合わせて $${n(Pm, 4)} + ${n(2 * PI * t, 4)} = ${n(Pm + 2 * PI * t, 4)}$ です。（コーシーの公式 $P = \\int_0^{2\\pi} h\\,d\\theta$ は $h$ について線形で、$h$ は足し算になります。）`]],
          set: { ka: k, a, kb: 0, t },
        };
      }
      if (form === 2) {
        const a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05);
        return {
          q: [`The mixed area $V(A, B)$ is defined by $|A + B| = |A| + 2V(A, B) + |B|$. For the squares $A = [-${n(a, 2)}, ${n(a, 2)}]^2$ and $B = [-${n(t, 2)}, ${n(t, 2)}]^2$ with parallel sides, find $V(A, B)$.`, `混合面積 $V(A, B)$ は $|A + B| = |A| + 2V(A, B) + |B|$ で定義されます。辺が平行な正方形 $A = [-${n(a, 2)}, ${n(a, 2)}]^2$ と $B = [-${n(t, 2)}, ${n(t, 2)}]^2$ について $V(A, B)$ を求めてください。`],
          a: { type: 'num', v: 4 * a * t, rel: 0.003 },
          hint: ['Find $|A + B|$ first: the sum is a square.', 'まず $|A + B|$ を求めます。和は正方形です。'],
          sol: [[`$A + B$ is the square of half-side $${n(a, 2)} + ${n(t, 2)}$, so $|A + B| = 4(${n(a, 2)} + ${n(t, 2)})^2 = ${n(4 * (a + t) ** 2, 4)}$.`, `$A + B$ は半辺 $${n(a, 2)} + ${n(t, 2)}$ の正方形なので、$|A + B| = 4(${n(a, 2)} + ${n(t, 2)})^2 = ${n(4 * (a + t) ** 2, 4)}$ です。`], [`$2V = ${n(4 * (a + t) ** 2, 4)} - ${n(4 * a * a, 4)} - ${n(4 * t * t, 4)} = ${n(8 * a * t, 4)}$, so $V(A, B) = 4at = ${n(4 * a * t, 4)}$.`, `$2V = ${n(4 * (a + t) ** 2, 4)} - ${n(4 * a * a, 4)} - ${n(4 * t * t, 4)} = ${n(8 * a * t, 4)}$ なので、$V(A, B) = 4at = ${n(4 * a * t, 4)}$ です。`]],
          set: { ka: 0, a, kb: 3, t, rot: 0 },
        };
      }
      const a = r.step(0.5, 1.6, 0.05), t = r.step(0.2, 1.6, 0.05), th = r.pick([0, 30, 60, 90, 120, 150]), hA = th % 60 === 0 ? a : (S3 / 2) * a;
      return {
        q: [`$A$ is the regular hexagon with circumradius ${n(a, 2)} and a vertex at angle $0^\\circ$, and $tD$ is a disc of radius $${n(t, 2)}$. How far does $A + tD$ reach in the direction $\\theta = ${th}^\\circ$?`, `$A$ は外接円の半径が ${n(a, 2)} で、角度 $0^\\circ$ に頂点がある正六角形、$tD$ は半径 $${n(t, 2)}$ の円板です。$A + tD$ は方向 $\\theta = ${th}^\\circ$ にどこまで届きますか。`],
        a: { type: 'num', v: hA + t, rel: 0.003 },
        hint: ['The hexagon has vertices every $60^\\circ$. In a direction midway between two vertices it reaches only the apothem $\\frac{\\sqrt3}{2}a$.', '六角形の頂点は $60^\\circ$ おきにあります。二つの頂点の中間の方向では、辺心距離 $\\frac{\\sqrt3}{2}a$ までしか届きません。'],
        sol: [[th % 60 === 0 ? `At $\\theta = ${th}^\\circ$ a vertex points that way, so $h_A = a = ${n(a, 2)}$.` : `At $\\theta = ${th}^\\circ$ the direction is midway between two vertices, so $h_A = a\\cos 30^\\circ = ${n(hA, 4)}$.`, th % 60 === 0 ? `$\\theta = ${th}^\\circ$ では頂点がその向きを向いているので $h_A = a = ${n(a, 2)}$ です。` : `$\\theta = ${th}^\\circ$ は二つの頂点の中間の方向なので $h_A = a\\cos 30^\\circ = ${n(hA, 4)}$ です。`], [`Add the disc: $h_{A+tD} = ${n(hA, 4)} + ${n(t, 2)} = ${n(hA + t, 4)}$.`, `円板を足して $h_{A+tD} = ${n(hA, 4)} + ${n(t, 2)} = ${n(hA + t, 4)}$ です。`]],
        set: { ka: 2, a, kb: 0, t, th },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a1 = r.pick([4, 9, 16, 25, 36]), b1 = r.pick([1, 4, 9, 16, 25]);
        return {
          q: [`Two convex bodies in the plane have areas $${a1}$ and $${b1}$. What is the smallest area that their Minkowski sum $A + B$ can have?`, `平面上の二つの凸体の面積が $${a1}$ と $${b1}$ です。ミンコフスキー和 $A + B$ の面積が取りうる最小値はいくつですか。`],
          a: { type: 'num', v: (Math.sqrt(a1) + Math.sqrt(b1)) ** 2 },
          hint: ['Brunn–Minkowski: $\\sqrt{|A+B|} \\ge \\sqrt{|A|} + \\sqrt{|B|}$, with equality for homothetic bodies.', 'ブルン・ミンコフスキー：$\\sqrt{|A+B|} \\ge \\sqrt{|A|} + \\sqrt{|B|}$ で、相似の位置にある物体では等号です。'],
          sol: [[`$\\sqrt{|A + B|} \\ge \\sqrt{${a1}} + \\sqrt{${b1}} = ${Math.sqrt(a1)} + ${Math.sqrt(b1)} = ${Math.sqrt(a1) + Math.sqrt(b1)}$.`, `$\\sqrt{|A + B|} \\ge \\sqrt{${a1}} + \\sqrt{${b1}} = ${Math.sqrt(a1)} + ${Math.sqrt(b1)} = ${Math.sqrt(a1) + Math.sqrt(b1)}$ です。`], [`Squaring gives $|A + B| \\ge ${(Math.sqrt(a1) + Math.sqrt(b1)) ** 2}$, reached when $B$ is a scaled copy of $A$ (for example two aligned squares). Other pairs of these areas have larger sums.`, `二乗して $|A + B| \\ge ${(Math.sqrt(a1) + Math.sqrt(b1)) ** 2}$ で、$B$ が $A$ の拡大縮小コピー（たとえば向きの揃った二つの正方形）のときに達成されます。この面積のほかの組では和はもっと大きくなります。`]],
          set: { ka: 0, kb: 3, rot: 0 },
        };
      }
      if (form === 1) {
        const a = r.step(0.5, 1.6, 0.05), kk = r.pick([2, 3, 4]), A = 4 * a * a, Pm = 8 * a, t = (-Pm + Math.sqrt(Pm * Pm + 4 * PI * A * (kk - 1))) / (2 * PI);
        return {
          q: [`$A$ is the square $[-${n(a, 2)}, ${n(a, 2)}]^2$. For what radius $t$ does the parallel body $A + tD$ have exactly $${kk}$ times the area of $A$?`, `$A$ は正方形 $[-${n(a, 2)}, ${n(a, 2)}]^2$ です。平行体 $A + tD$ の面積がちょうど $A$ の $${kk}$ 倍になる半径 $t$ はいくつですか。`],
          a: { type: 'num', v: t, rel: 0.005 },
          hint: ['Steiner: $|A| + P t + \\pi t^2 = k|A|$ is a quadratic in $t$.', 'シュタイナー：$|A| + P t + \\pi t^2 = k|A|$ は $t$ の二次方程式です。'],
          sol: [[`With $|A| = ${n(A, 4)}$ and $P = ${n(Pm, 4)}$: $\\pi t^2 + ${n(Pm, 4)}\\,t - ${kk - 1}\\cdot ${n(A, 4)} = 0$.`, `$|A| = ${n(A, 4)}$、$P = ${n(Pm, 4)}$ なので $\\pi t^2 + ${n(Pm, 4)}\\,t - ${kk - 1}\\cdot ${n(A, 4)} = 0$ です。`], [`The positive root is $t = \\dfrac{-${n(Pm, 4)} + \\sqrt{${n(Pm * Pm, 4)} + 4\\pi \\cdot ${kk - 1} \\cdot ${n(A, 4)}}}{2\\pi} = ${n(t, 4)}$.`, `正の解は $t = \\dfrac{-${n(Pm, 4)} + \\sqrt{${n(Pm * Pm, 4)} + 4\\pi \\cdot ${kk - 1} \\cdot ${n(A, 4)}}}{2\\pi} = ${n(t, 4)}$ です。`]],
          set: { ka: 0, a, kb: 0 },
        };
      }
      if (form === 2) {
        const a = r.step(0.5, 1.6, 0.05), A = (3 * S3 / 4) * a * a, bool = r.chance(0.5);
        return bool ? {
          q: [`$A$ is an equilateral triangle of area $${n(A, 4)}$ and $-A$ is its half-turn (the triangle pointing the other way). What is the area of $A + (-A)$?`, `$A$ は面積 $${n(A, 4)}$ の正三角形で、$-A$ はその半回転（逆向きの三角形）です。$A + (-A)$ の面積はいくつですか。`],
          a: { type: 'num', v: 6 * A, rel: 0.004 },
          hint: ['The sum is a regular hexagon built from triangles of the same size as $A$.', '和は、$A$ と同じ大きさの三角形で組み立てられる正六角形です。'],
          sol: [[`$A + (-A)$ is the “difference body” of the triangle: a regular hexagon whose six sides are the three sides of $A$ and the three sides of $-A$, each as long as a side of $A$.`, `$A + (-A)$ は三角形の「差集合体」で、$A$ の三辺と $-A$ の三辺を六つの辺とする正六角形です。各辺の長さは $A$ の辺と同じです。`], [`Its area is $6|A| = 6 \\cdot ${n(A, 4)} = ${n(6 * A, 4)}$, so the Brunn–Minkowski ratio is $\\sqrt{6}/2 = 1.2247 > 1$: the two triangles are not homothetic.`, `面積は $6|A| = 6 \\cdot ${n(A, 4)} = ${n(6 * A, 4)}$ で、ブルン・ミンコフスキー比は $\\sqrt{6}/2 = 1.2247 > 1$ です。二つの三角形は相似の位置にありません。`]],
          set: { ka: 1, a, kb: 2, t: a, rot: 180 },
        } : {
          q: [`$A$ is an equilateral triangle and $-A$ its half-turn. What is the Brunn–Minkowski ratio $\\sqrt{|A + (-A)|}\\,/\\,(\\sqrt{|A|} + \\sqrt{|-A|})$?`, `$A$ は正三角形で、$-A$ はその半回転です。ブルン・ミンコフスキー比 $\\sqrt{|A + (-A)|}\\,/\\,(\\sqrt{|A|} + \\sqrt{|-A|})$ はいくつですか。`],
          a: { type: 'num', v: Math.sqrt(6) / 2, rel: 0.004, show: '\\frac{\\sqrt{6}}{2}' },
          hint: ['Use $|A + (-A)| = 6|A|$ for a triangle.', '三角形では $|A + (-A)| = 6|A|$ を使います。'],
          sol: [[`$|A + (-A)| = 6|A|$ and $|-A| = |A|$, so the ratio is $\\sqrt{6|A|}\\,/\\,(2\\sqrt{|A|})$.`, `$|A + (-A)| = 6|A|$ かつ $|-A| = |A|$ なので、比は $\\sqrt{6|A|}\\,/\\,(2\\sqrt{|A|})$ です。`], [`That is $\\sqrt6/2 = 1.2247$, independent of the size. It exceeds $1$ because $A$ and $-A$ are not homothetic.`, `これは大きさによらず $\\sqrt6/2 = 1.2247$ です。$A$ と $-A$ は相似の位置にないので 1 を超えます。`]],
          set: { ka: 1, a, kb: 2, t: a, rot: 180 },
        };
      }
      const form2 = r.int(0, 1);
      return form2 === 0 ? {
        q: [`$A$ is the square $[-a, a]^2$ and $D$ the unit disc. Give the area of $A + tD$ as a formula in $a$ and $t$.`, `$A$ は正方形 $[-a, a]^2$、$D$ は単位円板です。$A + tD$ の面積を $a$ と $t$ の式で答えてください。`],
        a: { type: 'expr', v: '4*a^2+8*a*t+pi*t^2', vars: ['a', 't'], lhs: ['$|A + tD| =$', '$|A + tD| =$'] },
        hint: ['Steiner’s formula with $|A| = 4a^2$ and $P(A) = 8a$.', '$|A| = 4a^2$、$P(A) = 8a$ としてシュタイナーの公式を使います。'],
        sol: [[`$|A + tD| = |A| + t\\,P(A) + \\pi t^2$ with $|A| = (2a)^2 = 4a^2$ and $P(A) = 8a$.`, `$|A + tD| = |A| + t\\,P(A) + \\pi t^2$ で、$|A| = (2a)^2 = 4a^2$、$P(A) = 8a$ です。`], [`So $|A + tD| = 4a^2 + 8at + \\pi t^2$: the square, four strips of area $2a \\cdot t$, and four quarter-discs.`, `したがって $|A + tD| = 4a^2 + 8at + \\pi t^2$ で、正方形、面積 $2a \\cdot t$ の帯 4 つ、四分円 4 つです。`]],
        set: { ka: 0, kb: 0 },
      } : {
        q: [`$A$ is the regular hexagon with circumradius $a$, and $D$ the unit disc. Give the area of $A + tD$ as a formula in $a$ and $t$.`, `$A$ は外接円の半径が $a$ の正六角形、$D$ は単位円板です。$A + tD$ の面積を $a$ と $t$ の式で答えてください。`],
        a: { type: 'expr', v: '3*sqrt(3)/2*a^2+6*a*t+pi*t^2', vars: ['a', 't'], lhs: ['$|A + tD| =$', '$|A + tD| =$'] },
        hint: ['The hexagon has area $\\frac{3\\sqrt3}{2}a^2$ and six sides of length $a$.', '六角形の面積は $\\frac{3\\sqrt3}{2}a^2$ で、長さ $a$ の辺が六つあります。'],
        sol: [[`$|A| = \\frac{3\\sqrt3}{2}a^2$ and $P(A) = 6a$.`, `$|A| = \\frac{3\\sqrt3}{2}a^2$、$P(A) = 6a$ です。`], [`Steiner: $|A + tD| = \\frac{3\\sqrt3}{2}a^2 + 6at + \\pi t^2$.`, `シュタイナーの公式から $|A + tD| = \\frac{3\\sqrt3}{2}a^2 + 6at + \\pi t^2$ です。`]],
        set: { ka: 2, kb: 0 },
      };
    },
  ];

  /* ---------------- convex-separation ---------------- */
  Q['convex-separation'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const [nm, nmJ, V, F, ka] = r.pick([['cube', '立方体', 8, 6, 0], ['octahedron', '正八面体', 6, 8, 1], ['tetrahedron', '正四面体', 4, 4, 2], ['triangular prism', '三角柱', 6, 5, 3], ['square pyramid', '四角錐', 5, 5, -1], ['pentagonal prism', '五角柱', 10, 7, -1], ['cuboctahedron', '立方八面体', 12, 14, -1], ['dodecahedron', '正十二面体', 20, 12, -1]]);
        return {
          q: [`A convex ${nm} has $${V}$ vertices and $${F}$ faces. Use Euler’s formula to find the number of edges.`, `凸な${nmJ}には頂点が $${V}$ 個、面が $${F}$ 枚あります。オイラーの公式で辺の数を求めてください。`],
          a: { type: 'int', v: V + F - 2 },
          hint: ['$V - E + F = 2$.', '$V - E + F = 2$ です。'],
          sol: [[`$E = V + F - 2 = ${V} + ${F} - 2 = ${V + F - 2}$.`, `$E = V + F - 2 = ${V} + ${F} - 2 = ${V + F - 2}$ です。`], ['Euler’s relation holds for every convex polyhedron, so counting vertices and faces fixes the edges.', 'オイラーの関係はどの凸多面体でも成り立つので、頂点と面を数えれば辺の数が決まります。']],
          set: ka >= 0 ? { ka } : undefined,
        };
      }
      if (form === 1) {
        const c = r.step(2.2, 5, 0.1);
        return {
          q: [`The cube $A = [-1, 1]^3$ and a copy $B$ moved by $(${n(c, 1)}, 0, 0)$ do not touch. What is the distance between them?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(c, 1)}, 0, 0)$ だけ動かしたコピー $B$ は接していません。二つの距離はいくつですか。`],
          a: { type: 'num', v: c - 2, rel: 0.005, tol: 0.0006 },
          hint: ['Face meets face: look along the $x$ axis.', '面と面が向き合っています。$x$ 軸に沿って見ます。'],
          sol: [[`$A$ ends at $x = 1$ and $B$ starts at $x = ${n(c, 1)} - 1 = ${n(c - 1, 1)}$.`, `$A$ は $x = 1$ で終わり、$B$ は $x = ${n(c, 1)} - 1 = ${n(c - 1, 1)}$ から始まります。`], [`The distance is $${n(c - 1, 1)} - 1 = ${n(c - 2, 1)}$, and the closest points can be any facing pair on the two faces.`, `距離は $${n(c - 1, 1)} - 1 = ${n(c - 2, 1)}$ で、最近点は二つの面の向き合う任意の組です。`]],
          set: { ka: 0, kb: 0, bx: c, by: 0, bz: 0, rz: 0 },
        };
      }
      if (form === 2) {
        const N = r.int(10, 30), Vh = r.int(5, 9);
        return {
          q: [`A set of $${N}$ points in space has a convex hull with $${Vh}$ vertices. Assuming no other point is a vertex, how many of the points lie inside the hull or on its faces, without being a vertex?`, `空間内の $${N}$ 個の点の凸包の頂点は $${Vh}$ 個です。ほかの点は頂点ではないとして、頂点にならずに凸包の内部または面の上にある点はいくつありますか。`],
          a: { type: 'int', v: N - Vh },
          hint: ['Only vertices of the hull are corners; the rest are swallowed.', '凸包の角になるのは頂点だけで、残りは飲み込まれます。'],
          sol: [[`Points of the set that are not vertices of its hull are convex combinations of the others.`, `凸包の頂点でない点は、ほかの点の凸結合です。`], [`There are $${N} - ${Vh} = ${N - Vh}$ of them. In the cloud of the experiment, $12 - 9 = 3$ are drawn hollow.`, `その数は $${N} - ${Vh} = ${N - Vh}$ 個です。実験の点群では $12 - 9 = 3$ 個が白抜きで描かれています。`]],
          set: undefined,
        };
      }
      const c = r.step(2.4, 5, 0.2);
      return {
        q: [`The cube $A = [-1, 1]^3$ and its copy $B$ moved by $(${n(c, 1)}, 0, 0)$ are separated by a plane perpendicular to the $x$ axis halfway between them. At what $x$ does that plane cut the axis?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(c, 1)}, 0, 0)$ だけ動かしたコピー $B$ を、$x$ 軸に垂直で二つの真ん中にある平面で分離します。この平面は $x$ 軸のどこで交わりますか。`],
        a: { type: 'num', v: c / 2, rel: 0.004 },
        hint: ['The plane passes through the midpoint of the closest points.', '平面は最近点の中点を通ります。'],
        sol: [[`The closest points are $(1, y, z)$ on $A$ and $(${n(c - 1, 1)}, y, z)$ on $B$.`, `最近点は $A$ 上の $(1, y, z)$ と $B$ 上の $(${n(c - 1, 1)}, y, z)$ です。`], [`The midpoint has $x = (1 + ${n(c - 1, 1)})/2 = ${n(c / 2, 2)}$, and the margin on each side is $d/2 = ${n((c - 2) / 2, 2)}$.`, `中点の $x$ 座標は $(1 + ${n(c - 1, 1)})/2 = ${n(c / 2, 2)}$ で、両側の余白は $d/2 = ${n((c - 2) / 2, 2)}$ です。`]],
        set: { ka: 0, kb: 0, bx: c, by: 0, bz: 0, rz: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.step(2.2, 4, 0.1), b = r.step(2.2, 4, 0.1), d = Math.hypot(a - 2, b - 2);
        return {
          q: [`The cube $A = [-1, 1]^3$ and its copy $B$ moved by $(${n(a, 1)}, ${n(b, 1)}, 0)$ face each other along parallel vertical edges. What is the distance between the bodies?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(a, 1)}, ${n(b, 1)}, 0)$ だけ動かしたコピー $B$ は、平行な鉛直の辺で向き合っています。二つの物体の距離はいくつですか。`],
          a: { type: 'num', v: d, rel: 0.004 },
          hint: ['Measure the gap along $x$ and along $y$ separately, then combine them.', '$x$ と $y$ に沿った隙間を別々に測って、組み合わせます。'],
          sol: [[`The gap along $x$ is $${n(a, 1)} - 2 = ${n(a - 2, 1)}$ and along $y$ it is $${n(b, 1)} - 2 = ${n(b - 2, 1)}$.`, `$x$ に沿った隙間は $${n(a, 1)} - 2 = ${n(a - 2, 1)}$、$y$ に沿った隙間は $${n(b, 1)} - 2 = ${n(b - 2, 1)}$ です。`], [`The closest points are on the two facing vertical edges, so $d = \\sqrt{${n(a - 2, 1)}^2 + ${n(b - 2, 1)}^2} = ${n(d, 4)}$.`, `最近点は向き合う二本の鉛直な辺の上にあるので、$d = \\sqrt{${n(a - 2, 1)}^2 + ${n(b - 2, 1)}^2} = ${n(d, 4)}$ です。`]],
          set: { ka: 0, kb: 0, bx: a, by: b, bz: 0, rz: 0 },
        };
      }
      if (form === 1) {
        const c = r.step(3.2, 5, 0.1), [kb, m, nm, nmJ] = r.pick([[1, 1.4, 'octahedron with corners $(\\pm1.4, 0, 0)$, $(0, \\pm1.4, 0)$, $(0, 0, \\pm1.4)$ relative to its centre', '中心から見て頂点が $(\\pm1.4, 0, 0)$、$(0, \\pm1.4, 0)$、$(0, 0, \\pm1.4)$ にある正八面体'], [2, 0.9, 'tetrahedron with corners $(0.9, 0.9, 0.9)$, $(0.9, -0.9, -0.9)$, $(-0.9, 0.9, -0.9)$, $(-0.9, -0.9, 0.9)$', '頂点が $(0.9, 0.9, 0.9)$、$(0.9, -0.9, -0.9)$、$(-0.9, 0.9, -0.9)$、$(-0.9, -0.9, 0.9)$ の正四面体']]);
        return {
          q: [`The cube $[-1, 1]^3$ is at the origin and a ${nm} is centred at $(${n(c, 1)}, 0, 0)$, and not rotated. What is the distance between the bodies?`, `立方体 $[-1, 1]^3$ が原点にあり、${nmJ}が回転させずに $(${n(c, 1)}, 0, 0)$ を中心として置かれています。二つの物体の距離はいくつですか。`],
          a: { type: 'num', v: c - m - 1, rel: 0.005, tol: 0.0006 },
          hint: ['Find the point of the second body nearest the cube along the $x$ axis.', '二つ目の物体で、立方体に $x$ 軸方向で最も近い点を探します。'],
          sol: [[`The second body reaches back to $x = ${n(c, 1)} - ${m} = ${n(c - m, 2)}$, and the cube’s face is at $x = 1$.`, `二つ目の物体は $x = ${n(c, 1)} - ${m} = ${n(c - m, 2)}$ まで手前に伸びていて、立方体の面は $x = 1$ にあります。`], [`The facing parts lie within the face, so the distance is $${n(c - m, 2)} - 1 = ${n(c - m - 1, 2)}$.`, `向き合う部分は面の範囲内にあるので、距離は $${n(c - m, 2)} - 1 = ${n(c - m - 1, 2)}$ です。`]],
          set: { ka: 0, kb, bx: c, by: 0, bz: 0, rz: 0 },
        };
      }
      if (form === 2) {
        const a = r.step(2.4, 4, 0.1);
        return {
          q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(${n(a, 1)}, ${n(a, 1)}, 0)$. The gap measured along the $x$ axis alone is $${n(a, 1)} - 2$. By what factor is the true distance larger than this axis gap?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(a, 1)}, ${n(a, 1)}, 0)$ だけ動かしたコピーがあります。$x$ 軸だけで測った隙間は $${n(a, 1)} - 2$ です。本当の距離はこの軸方向の隙間の何倍ですか。`],
          a: { type: 'num', v: Math.SQRT2, rel: 0.004, show: '\\sqrt{2}' },
          hint: ['The true distance is the diagonal of the two axis gaps.', '本当の距離は、二つの軸方向の隙間の対角線の長さです。'],
          sol: [[`The gaps along $x$ and $y$ are both $${n(a, 1)} - 2 = ${n(a - 2, 1)}$, and the true distance is $d = \\sqrt{2}\\,(${n(a - 2, 1)}) = ${n(Math.SQRT2 * (a - 2), 4)}$.`, `$x$ と $y$ に沿った隙間はどちらも $${n(a, 1)} - 2 = ${n(a - 2, 1)}$ で、本当の距離は $d = \\sqrt{2}\\,(${n(a - 2, 1)}) = ${n(Math.SQRT2 * (a - 2), 4)}$ です。`], ['So the ratio is $\\sqrt2 = 1.414$ for every offset: the best direction $(1,1,0)/\\sqrt2$ is tilted $45^\\circ$ from the axis and gains the factor $1/\\cos 45^\\circ$.', 'したがって比はどのずれでも $\\sqrt2 = 1.414$ です。最良の方向 $(1,1,0)/\\sqrt2$ は軸から $45^\\circ$ 傾いていて、$1/\\cos 45^\\circ$ 倍だけ得をします。']],
          set: { ka: 0, kb: 0, bx: a, by: a, bz: 0, rz: 0 },
        };
      }
      const c = r.step(2.2, 3, 0.1), d = S3 * (c - 2);
      return {
        q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(${n(c, 1)}, ${n(c, 1)}, ${n(c, 1)})$ meet corner to corner. A plane through the midpoint of the closest points, perpendicular to the segment joining them, is the best separating plane. How wide is the margin on each side of it?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(c, 1)}, ${n(c, 1)}, ${n(c, 1)})$ だけ動かしたコピーが、角と角で向き合っています。最近点を結ぶ線分に垂直で、その中点を通る平面が最良の分離平面です。その両側の余白の幅はいくつですか。`],
        a: { type: 'num', v: d / 2, rel: 0.004 },
        hint: ['The closest points are two facing corners; half their distance is the margin.', '最近点は向き合う二つの角で、その距離の半分が余白です。'],
        sol: [[`The corners are $(1,1,1)$ and $(${n(c - 1, 1)}, ${n(c - 1, 1)}, ${n(c - 1, 1)})$, so $d = \\sqrt3\\,(${n(c - 2, 1)}) = ${n(d, 4)}$.`, `角は $(1,1,1)$ と $(${n(c - 1, 1)}, ${n(c - 1, 1)}, ${n(c - 1, 1)})$ なので、$d = \\sqrt3\\,(${n(c - 2, 1)}) = ${n(d, 4)}$ です。`], [`The plane through the midpoint leaves $d/2 = ${n(d / 2, 4)}$ on each side: the largest slab that fits between the cubes.`, `中点を通る平面は両側に $d/2 = ${n(d / 2, 4)}$ を残します。これが二つの立方体の間に入る最も広い帯です。`]],
        set: { ka: 0, kb: 0, bx: c, by: c, bz: c, rz: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.step(2.4, 4, 0.2), b = r.step(2.4, 4, 0.2), d = Math.hypot(a - 2, b - 2), nx = (a - 2) / d, ny = (b - 2) / d;
        return {
          q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(${n(a, 1)}, ${n(b, 1)}, 0)$. The best separating direction is $n^* = (n_x, n_y, 0)$, along the shortest segment between them. Give $n_x$ and $n_y$.`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(a, 1)}, ${n(b, 1)}, 0)$ だけ動かしたコピーがあります。最良の分離方向 $n^* = (n_x, n_y, 0)$ は二つの間の最短の線分の向きです。$n_x$ と $n_y$ を答えてください。`],
          a: { type: 'tuple', v: [nx, ny], labels: ['$n_x$', '$n_y$'], rel: 0.005 },
          hint: ['The shortest segment joins the edge $(1,1,z)$ of $A$ to the edge $(' + n(a - 1, 1) + ',' + n(b - 1, 1) + ',z)$ of $B$.', '最短の線分は、$A$ の辺 $(1,1,z)$ と $B$ の辺をつなぎます。'],
          sol: [[`The segment runs from $(1, 1, z)$ to $(${n(a - 1, 1)}, ${n(b - 1, 1)}, z)$, direction $(${n(a - 2, 1)}, ${n(b - 2, 1)}, 0)$ and length $d = ${n(d, 4)}$.`, `線分は $(1, 1, z)$ から $(${n(a - 1, 1)}, ${n(b - 1, 1)}, z)$ へ向かい、方向は $(${n(a - 2, 1)}, ${n(b - 2, 1)}, 0)$、長さは $d = ${n(d, 4)}$ です。`], [`Dividing by the length, $n^* = (${n(nx, 4)}, ${n(ny, 4)}, 0)$. Along any other direction the gap is smaller than $d$.`, `長さで割って $n^* = (${n(nx, 4)}, ${n(ny, 4)}, 0)$ です。ほかのどの方向でも隙間は $d$ より小さくなります。`]],
          set: { ka: 0, kb: 0, bx: a, by: b, bz: 0, rz: 0, psi: 0 },
        };
      }
      if (form === 1) {
        const c = r.step(3.4, 5, 0.2), psi = r.pick([10, 15, 20, 25, 30]), g = c * Math.cos(psi * DEG) - 2 * (Math.cos(psi * DEG) + Math.sin(psi * DEG));
        return {
          q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(${n(c, 1)}, 0, 0)$. Tilt the direction from the $x$ axis by $\\psi = ${psi}^\\circ$ towards $z$, so $n = (\\cos\\psi, 0, \\sin\\psi)$. What is the gap along $n$?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(c, 1)}, 0, 0)$ だけ動かしたコピーがあります。方向を $x$ 軸から $z$ のほうへ $\\psi = ${psi}^\\circ$ だけ傾け、$n = (\\cos\\psi, 0, \\sin\\psi)$ とします。$n$ に沿った隙間はいくつですか。`],
          a: { type: 'num', v: g, rel: 0.005, tol: 0.0015 },
          hint: ['Each cube’s shadow on $n$ has half-width $|\\cos\\psi| + |\\sin\\psi|$; the centres are $c\\cos\\psi$ apart.', 'それぞれの立方体の $n$ 上の影の半幅は $|\\cos\\psi| + |\\sin\\psi|$ で、中心の間隔は $c\\cos\\psi$ です。'],
          sol: [[`The shadow of $[-1,1]^3$ on $n$ is $[-w, w]$ with $w = \\cos${psi}^\\circ + \\sin${psi}^\\circ = ${n(Math.cos(psi * DEG) + Math.sin(psi * DEG), 4)}$.`, `$[-1,1]^3$ の $n$ 上の影は $[-w, w]$（$w = \\cos${psi}^\\circ + \\sin${psi}^\\circ = ${n(Math.cos(psi * DEG) + Math.sin(psi * DEG), 4)}$）です。`], [`The centres are $${n(c, 1)}\\cos${psi}^\\circ = ${n(c * Math.cos(psi * DEG), 4)}$ apart, so the gap is $${n(c * Math.cos(psi * DEG), 4)} - 2 \\cdot ${n(Math.cos(psi * DEG) + Math.sin(psi * DEG), 4)} = ${n(g, 4)}$, less than the true distance $${n(c - 2, 1)}$ at $\\psi = 0$.`, `中心の間隔は $${n(c, 1)}\\cos${psi}^\\circ = ${n(c * Math.cos(psi * DEG), 4)}$ なので、隙間は $${n(c * Math.cos(psi * DEG), 4)} - 2 \\cdot ${n(Math.cos(psi * DEG) + Math.sin(psi * DEG), 4)} = ${n(g, 4)}$ で、$\\psi = 0$ での本当の距離 $${n(c - 2, 1)}$ より小さくなります。`]],
          set: { ka: 0, kb: 0, bx: c, by: 0, bz: 0, rz: 0, psi },
        };
      }
      if (form === 2) {
        const c = r.step(2.6, 4, 0.2), opts = [['$(1, 1, 0)$: along the shortest segment between the facing edges', '$(1, 1, 0)$：向き合う辺の間の最短の線分に沿う向き'], ['$(1, 0, 0)$: along the $x$ axis, since the cubes are displaced mostly in $x$', '$(1, 0, 0)$：立方体は主に $x$ 方向にずれているので $x$ 軸に沿う向き'], ['$(1, 1, 1)$: along the main diagonal of the cube', '$(1, 1, 1)$：立方体の主対角線に沿う向き'], ['$(0, 0, 1)$: the cubes are level, so separate them vertically', '$(0, 0, 1)$：立方体は同じ高さにあるので鉛直方向に分ける']];
        return {
          q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(${n(c, 1)}, ${n(c, 1)}, 0)$. Which normal direction gives the separating plane with the widest margin?`, `立方体 $A = [-1, 1]^3$ と、それを $(${n(c, 1)}, ${n(c, 1)}, 0)$ だけ動かしたコピーがあります。余白が最も広い分離平面の法線の向きはどれですか。`],
          a: { type: 'choice', opts, v: 0 },
          hint: ['The best direction is the one along the shortest segment between the bodies.', '最良の方向は、二つの物体の間の最短の線分に沿う向きです。'],
          sol: [[`The facing parts are two vertical edges, at $x = y = 1$ on $A$ and $x = y = ${n(c - 1, 1)}$ on $B$.`, `向き合っているのは二本の鉛直な辺で、$A$ では $x = y = 1$、$B$ では $x = y = ${n(c - 1, 1)}$ にあります。`], [`The segment between them points along $(1, 1, 0)$ with length $\\sqrt2\\,(${n(c - 2, 1)}) = ${n(Math.SQRT2 * (c - 2), 3)}$, while the gap along the $x$ axis is only $${n(c - 2, 1)}$, so $(1,1,0)$ wins.`, `二つの間の線分は $(1, 1, 0)$ の向きで長さは $\\sqrt2\\,(${n(c - 2, 1)}) = ${n(Math.SQRT2 * (c - 2), 3)}$ です。$x$ 軸に沿った隙間は $${n(c - 2, 1)}$ にすぎないので、$(1,1,0)$ が勝ちます。`]],
          set: { ka: 0, kb: 0, bx: c, by: c, bz: 0, rz: 0 },
        };
      }
      const dd = r.step(1, 4, 0.5);
      return r.chance(0.5) ? {
        q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(c, c, 0)$, with $c > 2$. Give the distance between them as a formula in $c$.`, `立方体 $A = [-1, 1]^3$ と、それを $(c, c, 0)$（$c > 2$）だけ動かしたコピーがあります。二つの距離を $c$ の式で答えてください。`],
        a: { type: 'expr', v: 'sqrt(2)*(c-2)', vars: ['c'], dom: { c: [2.1, 4] }, lhs: ['$d(c) =$', '$d(c) =$'] },
        hint: ['The gap along each axis is $c - 2$.', '各軸方向の隙間は $c - 2$ です。'],
        sol: [[`The facing parts are vertical edges, so the horizontal offsets are $c - 2$ along $x$ and along $y$.`, `向き合うのは鉛直な辺なので、水平方向のずれは $x$ と $y$ のどちらも $c - 2$ です。`], [`The distance is $\\sqrt{(c-2)^2 + (c-2)^2} = \\sqrt2\\,(c - 2)$.`, `距離は $\\sqrt{(c-2)^2 + (c-2)^2} = \\sqrt2\\,(c - 2)$ です。`]],
        set: { ka: 0, kb: 0 },
      } : {
        q: [`The cube $A = [-1, 1]^3$ and its copy moved by $(c, c, 0)$ with $c > 2$ are $${n(dd, 1)}$ apart. Find $c$.`, `立方体 $A = [-1, 1]^3$ と、それを $(c, c, 0)$（$c > 2$）だけ動かしたコピーの距離が $${n(dd, 1)}$ です。$c$ を求めてください。`],
        a: { type: 'num', v: 2 + dd / Math.SQRT2, rel: 0.004 },
        hint: ['Use $d = \\sqrt2\\,(c - 2)$.', '$d = \\sqrt2\\,(c - 2)$ を使います。'],
        sol: [[`The distance is $d = \\sqrt2\\,(c - 2)$, the diagonal of two equal axis gaps.`, `距離は $d = \\sqrt2\\,(c - 2)$ で、等しい二つの軸方向の隙間の対角線です。`], [`Solving, $c = 2 + d/\\sqrt2 = 2 + ${n(dd, 1)}/\\sqrt2 = ${n(2 + dd / Math.SQRT2, 4)}$.`, `解くと $c = 2 + d/\\sqrt2 = 2 + ${n(dd, 1)}/\\sqrt2 = ${n(2 + dd / Math.SQRT2, 4)}$ です。`]],
      };
    },
  ];
})();
