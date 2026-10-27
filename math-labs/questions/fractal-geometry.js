'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const ln = Math.log, deg = Math.PI / 180;
  const moranRoot = (rs) => { let lo = 0, hi = 1; const f = (d) => rs.reduce((s, r) => s + r ** d, 0); while (f(hi) > 1) hi *= 2; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) > 1) lo = m; else hi = m; } return (lo + hi) / 2; };
  const cx = (z) => (z[1] === 0 ? n(z[0], 4) : `${n(z[0], 4)} ${z[1] < 0 ? '-' : '+'} ${n(Math.abs(z[1]), 4)}i`);

  /* ---------------- 1. iterated function systems ---------------- */
  const SETS = [
    ['the Sierpinski triangle', 'シェルピンスキーの三角形', 3, 2], ['the Koch curve', 'コッホ曲線', 4, 3], ['the middle-thirds Cantor set', '三進カントール集合', 2, 3],
    ['the Sierpinski carpet', 'シェルピンスキーのカーペット', 8, 3], ['the Vicsek fractal', 'ヴィチェック・フラクタル', 5, 3], ['the Menger sponge', 'メンガーのスポンジ', 20, 3], ['the Cantor dust (Cantor set squared)', 'カントール塵（カントール集合の直積）', 4, 3],
  ];
  Q['ifs-chaos-game'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.int(0, SETS.length - 1), [en, ja, m, s] = SETS[k];
        const set = k === 0 ? { sys: 0 } : k === 1 ? { sys: 2 } : undefined;
        return {
          q: [`${en[0].toUpperCase() + en.slice(1)} is made of ${m} copies of itself, each scaled by $1/${s}$. What is its similarity dimension?`, `${ja}は自分自身を $1/${s}$ に縮めた写し ${m} 個からできています。相似次元はいくつですか。`],
          a: { type: 'num', v: ln(m) / ln(s), tol: 6e-4, show: `\\dfrac{\\log ${m}}{\\log ${s}}` },
          hint: ['$m$ copies of ratio $r$: $m r^d = 1$.', '比 $r$ の写しが $m$ 個なら $m r^d = 1$ です。'],
          sol: [[`$${m}\\cdot(1/${s})^d = 1$ gives $d = \\log ${m}/\\log ${s}$.`, `$${m}\\cdot(1/${s})^d = 1$ より $d = \\log ${m}/\\log ${s}$ です。`], [`$d = ${n(ln(m) / ln(s), 4)}$: ${ln(m) / ln(s) > 2 ? 'between a surface and a solid' : ln(m) / ln(s) > 1 ? 'more than a curve, less than a region' : 'less than a line: a dust of points'}.`, `$d = ${n(ln(m) / ln(s), 4)}$ で、${ln(m) / ln(s) > 2 ? '面と立体の間' : ln(m) / ln(s) > 1 ? '曲線より大きく領域より小さい' : '直線より小さく、点の塵'}です。`]],
          set,
        };
      }
      const rr = r.step(0.3, 0.5, 0.01);
      return {
        q: [`In the custom system, three similarities each have ratio $r = ${n(rr)}$. What is the similarity dimension of the attractor?`, `カスタム系で、3つの相似変換の比がどれも $r = ${n(rr)}$ です。吸引集合の相似次元はいくつですか。`],
        a: { type: 'num', v: ln(3) / ln(1 / rr), tol: 6e-4 },
        sol: [[`$3r^d = 1$, so $d = \\dfrac{\\log 3}{\\log(1/${n(rr)})}$.`, `$3r^d = 1$ より $d = \\dfrac{\\log 3}{\\log(1/${n(rr)})}$ です。`], [`$d = ${n(ln(3) / ln(1 / rr), 4)}$, the point where the Moran curve crosses 1. Smaller pieces leave more gaps and a smaller dimension.`, `$d = ${n(ln(3) / ln(1 / rr), 4)}$ で、モランの曲線が 1 を横切る点です。部分が小さいほどすき間が増え、次元は小さくなります。`]],
        set: { sys: 3, r: rr },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const opts = [[[1 / 2, 1 / 4], '\\tfrac12, \\tfrac14'], [[1 / 2, 1 / 4, 1 / 4], '\\tfrac12, \\tfrac14, \\tfrac14'], [[1 / 2, 1 / 3], '\\tfrac12, \\tfrac13'], [[1 / 3, 1 / 3, 1 / 2], '\\tfrac13, \\tfrac13, \\tfrac12'], [[1 / 2, 1 / 2, 1 / 4], '\\tfrac12, \\tfrac12, \\tfrac14'], [[1 / 4, 1 / 4, 1 / 4, 1 / 2], '\\tfrac14, \\tfrac14, \\tfrac14, \\tfrac12'], [[0.6, 0.3], '0.6, 0.3'], [[1 / 3, 1 / 9, 1 / 3], '\\tfrac13, \\tfrac19, \\tfrac13']];
        const [rs, tx] = r.pick(opts), d = moranRoot(rs);
        return {
          q: [`A self-similar set is made of non-overlapping copies with ratios $${tx}$. Solve the Moran equation for its dimension (three decimals).`, `重ならない写しからなる自己相似集合の比が $${tx}$ です。モランの方程式を解いて次元を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: d, tol: 6e-4 },
          hint: ['Find $d$ with $\\sum r_i^d = 1$; the left side decreases in $d$, so bisection works.', '$\\sum r_i^d = 1$ となる $d$ を求めます。左辺は $d$ について減少するので二分法が使えます。'],
          sol: [[`$${rs.map((x) => `(${n(x, 4)})^d`).join(' + ')} = 1$.`, `$${rs.map((x) => `(${n(x, 4)})^d`).join(' + ')} = 1$ です。`], [`The sum is ${rs.length} at $d = 0$ and falls through 1 at $d = ${n(d, 4)}$.`, `和は $d = 0$ で ${rs.length} で、$d = ${n(d, 4)}$ で 1 を下回ります。`], ['Bigger pieces count for more: the dimension sits between what the smallest and the largest ratio alone would give.', '大きい部分ほど重みが大きく、次元は最小の比だけ、最大の比だけで決めた値の間に入ります。']],
        };
      }
      if (form === 1) {
        const k = r.int(1, 8), which = r.int(0, 1);
        const v = which ? (3 / 4) ** k : (4 / 3) ** k;
        return {
          q: [which ? `Start from a solid triangle of area 1 and apply the Sierpinski step ${k} times. What area is left?` : `Start from a segment of length 1 and apply the Koch step ${k} times. How long is the curve?`, which ? `面積 1 の塗りつぶした三角形から始め、シェルピンスキーの操作を ${k} 回施します。残る面積はいくらですか。` : `長さ 1 の線分から始め、コッホの操作を ${k} 回施します。曲線の長さはいくらですか。`],
          a: { type: 'num', v, tol: 1e-4 * Math.max(1, v), show: which ? `(3/4)^{${k}}` : `(4/3)^{${k}}` },
          sol: [[which ? 'Each step keeps 3 of 4 half-size triangles, multiplying the area by $3/4$.' : 'Each step replaces every segment by 4 segments a third as long, multiplying the length by $4/3$.', which ? '1回の操作で半分の大きさの三角形4つのうち3つを残すので、面積は $3/4$ 倍になります。' : '1回の操作で各線分を長さ $1/3$ の線分4本に置き換えるので、長さは $4/3$ 倍になります。'], [`After ${k} steps: $${which ? '(3/4)' : '(4/3)'}^{${k}} = ${n(v, 4)}$.`, `${k} 回後は $${which ? '(3/4)' : '(4/3)'}^{${k}} = ${n(v, 4)}$ です。`], [which ? 'The area tends to 0 and the edge length to infinity: the triangle is too thin to be two-dimensional, and its dimension $\\log 3/\\log 2 \\approx 1.585$ says so.' : 'The length tends to infinity while the curve stays in a bounded region: length is the wrong measure, and dimension $\\log 4/\\log 3$ is the right one.', which ? '面積は 0 に、辺の長さは無限大に近づきます。三角形は2次元であるには細すぎ、次元 $\\log 3/\\log 2 \\approx 1.585$ がそれを示しています。' : '曲線は有界な領域にとどまるのに、長さは無限大に近づきます。長さは適切な尺度ではなく、次元 $\\log 4/\\log 3$ が適切な尺度です。']],
          set: { sys: which ? 0 : 2 },
        };
      }
      const maps = [[0.85, 0.04, -0.04, 0.85, 'the large frond map', '大きな葉の写像'], [0.2, -0.26, 0.23, 0.22, 'the left leaflet map', '左の小葉の写像'], [-0.15, 0.28, 0.26, 0.24, 'the right leaflet map', '右の小葉の写像']];
      const [a, b, c, d, en, ja] = r.pick(maps), det = Math.abs(a * d - b * c);
      return {
        q: [`In Barnsley's fern, ${en} has linear part $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$. By what factor does it scale areas?`, `バーンズリーのシダで、${ja}の線形部分は $\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$ です。面積を何倍にしますか。`],
        a: { type: 'num', v: det, tol: 2e-4 },
        sol: [[`An affine map scales area by $|\\det| = |${a}\\cdot${d} - (${b})(${c})| = ${n(det, 4)}$.`, `アフィン写像は面積を $|\\det| = |${a}\\cdot${d} - (${b})(${c})| = ${n(det, 4)}$ 倍にします。`], ['The fern\'s maps are not similarities, so no single ratio describes them and the Moran equation does not apply; the chaos game still draws the attractor.', 'シダの写像は相似変換ではないので、一つの比では表せず、モランの方程式は使えません。それでもカオスゲームは吸引集合を描きます。']],
        set: { sys: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([2, 3, 4, 5, 8]), d = r.pick([0.5, 0.75, 1, 1.2, 1.5, 1.8, 1.585]);
        const rr = m ** (-1 / d);
        const ok = m === 3 && rr >= 0.3 && rr <= 0.7;
        return {
          q: [`What common ratio $r$ must ${m} non-overlapping similar copies have for the attractor to have dimension $${n(d)}$?`, `重ならない ${m} 個の相似な写しの共通の比 $r$ がいくつなら、吸引集合の次元が $${n(d)}$ になりますか。`],
          a: { type: 'num', v: rr, tol: 6e-4 },
          hint: ['Solve $m r^d = 1$ for $r$.', '$m r^d = 1$ を $r$ について解いてください。'],
          sol: [[`$r = ${m}^{-1/${n(d)}} = ${n(rr, 4)}$.`, `$r = ${m}^{-1/${n(d)}} = ${n(rr, 4)}$ です。`], [`Check: $${m}\\cdot ${n(rr, 4)}^{${n(d)}} = 1$.${m === 3 && rr > 0.5 ? ' But $r > 1/2$ makes three copies of a triangle overlap, so the open set condition fails and this value would only be an upper bound.' : ''}`, `確認：$${m}\\cdot ${n(rr, 4)}^{${n(d)}} = 1$ です。${m === 3 && rr > 0.5 ? 'ただし $r > 1/2$ では三角形の3つの写しが重なるので開集合条件が破れ、この値は上界にすぎません。' : ''}`]],
          set: ok ? { sys: 3, r: Math.round(rr * 100) / 100 } : undefined,
        };
      }
      if (form === 1) {
        const rr = r.step(0.55, 0.7, 0.01), d = ln(3) / ln(1 / rr);
        return {
          q: [`Set the custom ratio to $r = ${n(rr)}$. The Moran equation $3r^d = 1$ gives $d = ${n(d, 3)}$. Is that the dimension of the attractor?`, `カスタム系の比を $r = ${n(rr)}$ にします。モランの方程式 $3r^d = 1$ は $d = ${n(d, 3)}$ を与えます。これは吸引集合の次元ですか。`],
          a: { type: 'choice', opts: [['No: the three images overlap, so Moran\'s root is only an upper bound', 'いいえ。3つの像が重なるので、モランの根は上界にすぎません'], ['Yes: Moran\'s equation always gives the dimension of a self-similar set', 'はい。モランの方程式は自己相似集合の次元を常に与えます'], ['No: the dimension is $\\log 3/\\log 2$ whatever $r$ is', 'いいえ。次元は $r$ によらず $\\log 3/\\log 2$ です']], v: 0 },
          hint: ['For $r > 1/2$, three copies of a triangle each more than half its size cannot sit side by side.', '$r > 1/2$ では、半分より大きい3つの三角形は並んで置けません。'],
          sol: [['Moran\'s formula needs the open set condition: the pieces may touch but not overlap. For $r > 1/2$ the scaled triangles overlap.', 'モランの公式には開集合条件、すなわち部分どうしは接してもよいが重なってはいけないという条件が必要です。$r > 1/2$ では縮小した三角形が重なります。'], [`Overlap means fewer distinct points than the count assumes, so the true dimension is at most $${n(d, 3)}$${d > 2 ? ', and in the plane it cannot exceed 2 anyway' : ''}.`, `重なると、数え方が仮定するより異なる点が少なくなるので、真の次元は $${n(d, 3)}$ 以下です${d > 2 ? '。そもそも平面では 2 を超えられません' : ''}。`]],
          set: { sys: 3, r: rr },
        };
      }
      const a = r.int(1, 3), b = a + r.int(1, 3);
      const v = `ln((1+sqrt(5))/2)/ln(1/r)`;
      const isGolden = b === 2 * a;
      if (isGolden) {
        return {
          q: [`A self-similar set has one piece of ratio $r$ and one of ratio $r^2$, not overlapping. Find its dimension $d(r)$.`, `重ならない、比 $r$ の部分1つと比 $r^2$ の部分1つからなる自己相似集合の次元 $d(r)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['r'], dom: { r: [0.1, 0.6] }, lhs: ['$d(r) =$', '$d(r) =$'] },
          hint: ['Moran: $r^d + r^{2d} = 1$. Solve the quadratic in $y = r^d$.', 'モランの方程式 $r^d + r^{2d} = 1$ を $y = r^d$ の2次方程式として解いてください。'],
          sol: [['With $y = r^d$: $y^2 + y - 1 = 0$, so $y = (\\sqrt5 - 1)/2 = 1/\\varphi$.', '$y = r^d$ とおくと $y^2 + y - 1 = 0$ で、$y = (\\sqrt5 - 1)/2 = 1/\\varphi$ です。'], ['$r^d = 1/\\varphi$ gives $d = \\dfrac{\\ln\\varphi}{\\ln(1/r)}$ with $\\varphi = (1 + \\sqrt5)/2$.', '$r^d = 1/\\varphi$ より $d = \\dfrac{\\ln\\varphi}{\\ln(1/r)}$、ただし $\\varphi = (1 + \\sqrt5)/2$ です。'], ['At $r = 1/2$ this is $\\log_2\\varphi \\approx 0.694$: the golden ratio shows up because the piece sizes follow the Fibonacci recursion.', '$r = 1/2$ では $\\log_2\\varphi \\approx 0.694$ です。部分の大きさがフィボナッチの漸化式に従うので黄金比が現れます。']],
        };
      }
      const m = r.pick([2, 3, 4, 5]);
      return {
        q: [`An attractor is made of ${m} non-overlapping similar copies of ratio $r$. Write its dimension as a function of $r$.`, `吸引集合が比 $r$ の重ならない相似な写し ${m} 個からなります。次元を $r$ の関数として書いてください。`],
        a: { type: 'expr', v: `ln(${m})/ln(1/r)`, vars: ['r'], dom: { r: [0.1, 0.45] }, lhs: ['$d(r) =$', '$d(r) =$'] },
        sol: [[`$${m}r^d = 1$, so $d\\ln r = -\\ln ${m}$.`, `$${m}r^d = 1$ より $d\\ln r = -\\ln ${m}$ です。`], [`$d(r) = \\dfrac{\\ln ${m}}{\\ln(1/r)}$, which grows as $r$ grows: bigger copies fill more.${m === 3 ? ' This is the Moran curve\'s root as the slider moves.' : ''}`, `$d(r) = \\dfrac{\\ln ${m}}{\\ln(1/r)}$ で、$r$ が大きいほど大きくなります。写しが大きいほど多くを埋めるからです。${m === 3 ? 'スライダーを動かしたときのモランの曲線の根がこれです。' : ''}`]],
        set: m === 3 ? { sys: 3, r: 0.4 } : undefined,
      };
    },
  ];

  /* ---------------- 2. box counting ---------------- */
  const KD = ln(4) / ln(3);
  Q['box-counting'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.pick([1, 1.26, 1.5, 1.585, 2, 0.631]), f = r.pick([2, 3, 4]);
        return {
          q: [`A set has $N(\\varepsilon) \\approx C\\varepsilon^{-${n(d)}}$. By what factor does the box count grow when the boxes are made ${f} times smaller?`, `ある集合で $N(\\varepsilon) \\approx C\\varepsilon^{-${n(d)}}$ です。箱を ${f} 分の 1 の大きさにすると、箱の数は何倍になりますか。`],
          a: { type: 'num', v: f ** d, rel: 0.003 },
          sol: [[`$N(\\varepsilon/${f})/N(\\varepsilon) = ${f}^{${n(d)}}$.`, `$N(\\varepsilon/${f})/N(\\varepsilon) = ${f}^{${n(d)}}$ です。`], [`$= ${n(f ** d, 4)}$. A curve would give ${f}, a filled region ${f * f}; the dimension is the exponent that interpolates.`, `$= ${n(f ** d, 4)}$ です。曲線なら ${f} 倍、塗りつぶした領域なら ${f * f} 倍で、次元はその間を補う指数です。`]],
        };
      }
      if (form === 1) {
        const k1 = r.int(2, 4), k2 = k1 + r.int(1, 3), d = r.pick([1.26, 1.5, 1.585, 1.2]), C = r.pick([0.8, 1, 1.5, 2]);
        const N1 = Math.round(C * 2 ** (k1 * d)), N2 = Math.round(C * 2 ** (k2 * d));
        const s = Math.log2(N2 / N1) / (k2 - k1);
        return {
          q: [`Boxes of side $2^{-${k1}}$ give $N = ${N1}$; boxes of side $2^{-${k2}}$ give $N = ${N2}$. Estimate the box dimension from these two scales.`, `一辺 $2^{-${k1}}$ の箱で $N = ${N1}$、一辺 $2^{-${k2}}$ の箱で $N = ${N2}$ です。この2つのスケールから箱数え次元を見積もってください。`],
          a: { type: 'num', v: s, tol: 0.002 },
          sol: [[`The slope of $\\log_2 N$ against $k = \\log_2(1/\\varepsilon)$ is $\\dfrac{\\log_2 ${N2} - \\log_2 ${N1}}{${k2} - ${k1}}$.`, `$k = \\log_2(1/\\varepsilon)$ に対する $\\log_2 N$ の傾きは $\\dfrac{\\log_2 ${N2} - \\log_2 ${N1}}{${k2} - ${k1}}$ です。`], [`$= \\log_2(${n(N2 / N1, 4)})/${k2 - k1} = ${n(s, 4)}$.`, `$= \\log_2(${n(N2 / N1, 4)})/${k2 - k1} = ${n(s, 4)}$ です。`]],
        };
      }
      const k = r.int(1, 7), cases = [[1, 'a smooth closed curve', '滑らかな閉曲線', 1], [2, 'a filled disc', '塗りつぶした円板', 2], [0, 'a finite set of 50 points', '50 点からなる有限集合', 0]];
      const [d, en, ja] = r.pick(cases);
      return {
        q: [`For ${en}, what does the slope of $\\log N(\\varepsilon)$ against $\\log(1/\\varepsilon)$ approach as $\\varepsilon \\to 0$?`, `${ja}について、$\\log(1/\\varepsilon)$ に対する $\\log N(\\varepsilon)$ の傾きは $\\varepsilon \\to 0$ でいくつに近づきますか。`],
        a: { type: 'num', v: d, tol: 1e-6 },
        sol: [[d === 1 ? 'A smooth curve of length $\\ell$ meets about $\\ell/\\varepsilon$ boxes.' : d === 2 ? 'A region of area $A$ meets about $A/\\varepsilon^2$ boxes.' : 'Once the boxes are smaller than the gaps between the points, $N = 50$ for every smaller $\\varepsilon$.', d === 1 ? '長さ $\\ell$ の滑らかな曲線は約 $\\ell/\\varepsilon$ 個の箱に触れます。' : d === 2 ? '面積 $A$ の領域は約 $A/\\varepsilon^2$ 個の箱に触れます。' : '箱が点どうしの間隔より小さくなると、それ以下のどの $\\varepsilon$ でも $N = 50$ です。'], [`So the slope tends to ${d}${d === 1 ? ': the circle in the figure is the control that checks the method.' : '.'}`, `したがって傾きは ${d} に近づきます${d === 1 ? '。図の円は方法を確かめるための対照です。' : '。'}`]],
        set: d === 1 ? { set: 3, k } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const H = r.pick([0.5, 0.3, 0.7, 0.25, 0.8]);
        return {
          q: [`The graph of a function with Hölder exponent $H = ${n(H)}$ (and no better), like a fractional Brownian path, has box dimension $2 - H$. What is it here?`, `ヘルダー指数がちょうど $H = ${n(H)}$ の関数のグラフ（非整数ブラウン運動の道のようなもの）の箱数え次元は $2 - H$ です。ここではいくつですか。`],
          a: { type: 'num', v: 2 - H },
          hint: ['Over a column of width $\\varepsilon$ the graph rises about $\\varepsilon^H$.', '幅 $\\varepsilon$ の列の中でグラフは約 $\\varepsilon^H$ だけ上下します。'],
          sol: [['There are $1/\\varepsilon$ columns, and each needs about $\\varepsilon^H/\\varepsilon$ boxes to cover the graph\'s oscillation.', '列は $1/\\varepsilon$ 本あり、それぞれグラフの振れを覆うのに約 $\\varepsilon^H/\\varepsilon$ 個の箱が要ります。'], [`$N \\approx \\varepsilon^{H - 2}$, so $d = 2 - ${n(H)} = ${n(2 - H)}$.${H === 0.5 ? ' For Brownian motion this is the $3/2$ the figure\'s Brownian graph approaches.' : ''}`, `$N \\approx \\varepsilon^{H - 2}$ なので $d = 2 - ${n(H)} = ${n(2 - H)}$ です。${H === 0.5 ? 'ブラウン運動ではこれが図のブラウン運動のグラフが近づく $3/2$ です。' : ''}`]],
          set: H === 0.5 ? { set: 2, k: 7, fit: 1 } : undefined,
        };
      }
      if (form === 1) {
        const k = r.int(1, 6), kk = k + r.int(1, 4);
        const which = r.int(0, 1), N0 = which ? 3 ** k : 4 ** k, ratio = which ? 3 : 4;
        return {
          q: [which ? `For the Sierpinski triangle, idealised boxes of side $2^{-${k}}$ number $3^{${k}} = ${N0}$. How many boxes of side $2^{-${kk}}$?` : `For the Koch curve, idealised boxes of side $3^{-${k}}$ number $4^{${k}} = ${N0}$. How many boxes of side $3^{-${kk}}$?`, which ? `シェルピンスキーの三角形で、理想化した一辺 $2^{-${k}}$ の箱の数は $3^{${k}} = ${N0}$ です。一辺 $2^{-${kk}}$ の箱はいくつですか。` : `コッホ曲線で、理想化した一辺 $3^{-${k}}$ の箱の数は $4^{${k}} = ${N0}$ です。一辺 $3^{-${kk}}$ の箱はいくつですか。`],
          a: { type: 'int', v: ratio ** kk },
          sol: [[`Each finer level replaces every piece by ${ratio} copies at ${which ? 'half' : 'a third of'} the size, so the count multiplies by ${ratio} per level.`, `1段細かくするごとに各部分が${which ? '半分' : '3分の1'}の大きさの写し ${ratio} 個に置き換わるので、箱の数は1段ごとに ${ratio} 倍になります。`], [`$N = ${ratio}^{${kk}} = ${ratio ** kk}$, and $\\log N/\\log(1/\\varepsilon) = \\log ${ratio}/\\log ${which ? 2 : 3}$ exactly.`, `$N = ${ratio}^{${kk}} = ${ratio ** kk}$ で、$\\log N/\\log(1/\\varepsilon) = \\log ${ratio}/\\log ${which ? 2 : 3}$ がちょうど成り立ちます。`]],
          set: which ? { set: 1, k: Math.min(7, kk) } : undefined,
        };
      }
      const A = r.pick([[1, 0, 'an interval', '区間'], [ln(2) / ln(3), 0, 'the Cantor set', 'カントール集合'], [ln(2) / ln(3), ln(2) / ln(3), 'the Cantor set', 'カントール集合'], [KD, 0, 'the Koch curve', 'コッホ曲線']]);
      const B = r.pick([[1, 'an interval', '区間'], [ln(2) / ln(3), 'the Cantor set', 'カントール集合']]);
      const v = A[0] + B[0];
      return {
        q: [`What is the box dimension of the product of ${A[2]} and ${B[1]}?`, `${A[3]}と${B[2]}の直積の箱数え次元はいくつですか。`],
        a: { type: 'num', v, tol: 6e-4 },
        hint: ['A box in the product is a box in each factor: the counts multiply.', '直積の箱は各因子の箱の組です。箱の数は掛け算になります。'],
        sol: [['$N_{A\\times B}(\\varepsilon) = N_A(\\varepsilon)N_B(\\varepsilon) \\approx \\varepsilon^{-d_A}\\varepsilon^{-d_B}$ for these regular sets.', 'これらの規則的な集合では $N_{A\\times B}(\\varepsilon) = N_A(\\varepsilon)N_B(\\varepsilon) \\approx \\varepsilon^{-d_A}\\varepsilon^{-d_B}$ です。'], [`So the dimensions add: $${n(A[0], 4)} + ${n(B[0], 4)} = ${n(v, 4)}$.`, `したがって次元は足し算になり、$${n(A[0], 4)} + ${n(B[0], 4)} = ${n(v, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.pick([1.26, 1.5, 1.585, 1.3]), ks = [r.int(2, 3), 0, 0]; ks[1] = ks[0] + 1; ks[2] = ks[0] + 2;
        const Ns = ks.map((k) => Math.round(1.3 * 2 ** (k * d) * (1 + (r.int(-4, 4)) / 100)));
        const pts = ks.map((k, i) => [k, Math.log2(Ns[i])]), mx = (ks[0] + ks[1] + ks[2]) / 3;
        const my = pts.reduce((s, p) => s + p[1], 0) / 3, slope = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
        return {
          q: [`Box counts at $\\varepsilon = 2^{-${ks[0]}}, 2^{-${ks[1]}}, 2^{-${ks[2]}}$ are $${Ns.join(',\\ ')}$. Find the least-squares slope of $\\log_2 N$ against $k$.`, `$\\varepsilon = 2^{-${ks[0]}}, 2^{-${ks[1]}}, 2^{-${ks[2]}}$ での箱の数は $${Ns.join(',\\ ')}$ です。$k$ に対する $\\log_2 N$ の最小二乗の傾きを求めてください。`],
          a: { type: 'num', v: slope, tol: 0.002 },
          hint: ['For three equally spaced $k$, the least-squares slope is (last − first)/2: the middle point does not affect it.', '等間隔の3点 $k$ では、最小二乗の傾きは（最後 − 最初）/2 で、中央の点は影響しません。'],
          sol: [[`$\\log_2 N = ${pts.map((p) => n(p[1], 4)).join(',\\ ')}$.`, `$\\log_2 N = ${pts.map((p) => n(p[1], 4)).join(',\\ ')}$ です。`], [`With $k$ centred at ${ks[1]}, the slope is $\\dfrac{\\sum (k - ${ks[1]})\\log_2 N}{\\sum (k - ${ks[1]})^2} = \\dfrac{${n(pts[2][1], 4)} - ${n(pts[0][1], 4)}}{2} = ${n(slope, 4)}$.`, `$k$ の中心は ${ks[1]} なので、傾きは $\\dfrac{\\sum (k - ${ks[1]})\\log_2 N}{\\sum (k - ${ks[1]})^2} = \\dfrac{${n(pts[2][1], 4)} - ${n(pts[0][1], 4)}}{2} = ${n(slope, 4)}$ です。`], ['Box dimension is a limit, so real estimates come from a fitted slope over a range of scales, and the choice of range matters, as the fit toggle shows.', '箱数え次元は極限なので、実際の推定はあるスケールの範囲で当てはめた傾きから得ます。フィット範囲の切り替えが示すように、範囲の選び方が結果を左右します。']],
        };
      }
      if (form === 1) {
        const p = r.pick([1, 2, 3]), eps = r.pick([0.01, 0.001, 1e-4]);
        // {1/n^p}: points closer than eps beyond n ~ eps^(-1/(p+1)), so N ~ eps^(-1/(p+1))
        const v = 1 / (p + 1);
        return {
          q: [`What is the box dimension of the countable set $\\{1, 2^{-${p}}, 3^{-${p}}, 4^{-${p}}, \\dots\\}$, the numbers $1/n^{${p}}$?`, `可算集合 $\\{1, 2^{-${p}}, 3^{-${p}}, 4^{-${p}}, \\dots\\}$、すなわち数 $1/n^{${p}}$ の箱数え次元はいくつですか。`],
          a: { type: 'num', v, show: frac(1, p + 1) },
          hint: ['Find the $n$ beyond which consecutive points are closer than $\\varepsilon$; count separately before and after.', '隣り合う点の間隔が $\\varepsilon$ より小さくなる $n$ を求め、その前と後で別々に数えます。'],
          sol: [[`Gaps $1/n^{${p}} - 1/(n + 1)^{${p}} \\approx ${p}/n^{${p + 1}}$ drop below $\\varepsilon$ at $n_* \\approx \\varepsilon^{-1/${p + 1}}$.`, `間隔 $1/n^{${p}} - 1/(n + 1)^{${p}} \\approx ${p}/n^{${p + 1}}$ は $n_* \\approx \\varepsilon^{-1/${p + 1}}$ で $\\varepsilon$ を下回ります。`], [`The first $n_*$ points need one box each; the rest lie in $[0, n_*^{-${p}}]$, which takes $n_*^{-${p}}/\\varepsilon \\approx \\varepsilon^{-1/${p + 1}}$ boxes.`, `最初の $n_*$ 点はそれぞれ箱1つずつ、残りは $[0, n_*^{-${p}}]$ に入り、$n_*^{-${p}}/\\varepsilon \\approx \\varepsilon^{-1/${p + 1}}$ 個の箱が要ります。`], [`So $N(\\varepsilon) \\approx \\varepsilon^{-1/${p + 1}}$ and the box dimension is $${frac(1, p + 1)}$, although the set is countable and its Hausdorff dimension is 0. At $\\varepsilon = ${n(eps)}$ that is about $${n(2 * eps ** (-v), 3)}$ boxes.`, `したがって $N(\\varepsilon) \\approx \\varepsilon^{-1/${p + 1}}$ で、箱数え次元は $${frac(1, p + 1)}$ です。集合は可算でハウスドルフ次元は 0 なのにです。$\\varepsilon = ${n(eps)}$ では約 $${n(2 * eps ** (-v), 3)}$ 個の箱です。`]],
        };
      }
      const which = r.int(0, 2);
      const OPTS = [
        [['Coarse boxes see the curve\'s overall extent, not its self-similar detail; the power law holds only as $\\varepsilon \\to 0$', '粗い箱は曲線の自己相似な細部ではなく全体の広がりを見ます。べき乗則は $\\varepsilon \\to 0$ でしか成り立ちません'], ['The Koch curve is not self-similar at coarse scales', '粗いスケールではコッホ曲線は自己相似でないから'], ['The finest boxes are too small to be counted accurately', '最も細かい箱は小さすぎて正確に数えられないから']],
        [['It is drawn by finitely many random points, so a few of the finest boxes are missed by chance', '有限個のランダムな点で描いているので、最も細かい箱のいくつかが偶然に取りこぼされるから'], ['The triangle has a smaller dimension at fine scales', '細かいスケールでは三角形の次元が小さいから'], ['The true count of an aligned Sierpinski triangle is less than $3^k$', '格子にそろったシェルピンスキーの三角形の本当の数は $3^k$ より少ないから']],
        [['No: box dimension can exceed Hausdorff dimension; $\\{1/n\\}$ has box dimension $1/2$ and Hausdorff dimension $0$', 'いいえ。箱数え次元はハウスドルフ次元より大きくなりえます。$\\{1/n\\}$ は箱数え次元 $1/2$、ハウスドルフ次元 $0$ です'], ['Yes: the two dimensions always agree', 'はい。2つの次元は常に一致します'], ['Yes, as long as both sets are bounded', 'はい。どちらの集合も有界でありさえすれば']],
      ];
      return {
        q: [['On the figure\'s Koch curve the fit over all scales gives a slope noticeably different from $\\log 4/\\log 3$, and the fine-scale fit is closer. Why?', 'For the figure\'s Sierpinski triangle the count at the finest scale $k = 7$ can fall slightly below $3^7$. Why?', 'Two sets have the same box dimension. Must they have the same Hausdorff dimension?'][which], ['図のコッホ曲線で、全スケールでフィットした傾きは $\\log 4/\\log 3$ とはっきり違い、細かいスケールのフィットのほうが近くなります。なぜですか。', '図のシェルピンスキーの三角形で、最も細かい $k = 7$ の箱の数が $3^7$ をわずかに下回ることがあります。なぜですか。', '2つの集合の箱数え次元が同じです。ハウスドルフ次元も同じでなければなりませんか。'][which]],
        a: { type: 'choice', opts: OPTS[which], v: 0 },
        sol: [[['$N(\\varepsilon) \\sim C\\varepsilon^{-d}$ is an asymptotic statement; at $\\varepsilon = 1/2$ or $1/4$ the count reflects the curve\'s bounding box, which bends the line.', 'The chaos game samples the attractor with 40,000 points; a box of side $2^{-7}$ that meets the set can still contain none of the sampled points.', 'Only $\\dim_H \\le \\underline{\\dim}_B$ holds in general.'][which], ['$N(\\varepsilon) \\sim C\\varepsilon^{-d}$ は漸近的な主張です。$\\varepsilon = 1/2$ や $1/4$ では数は曲線を囲む箱の大きさを反映し、直線を曲げます。', 'カオスゲームは吸引集合を 40,000 点で標本化します。集合に触れる一辺 $2^{-7}$ の箱が、標本の点を一つも含まないことがあります。', '一般に成り立つのは $\\dim_H \\le \\underline{\\dim}_B$ だけです。'][which]], [['Fitting only fine scales removes most of that bias.', 'More points would fill those boxes; the true count is exactly $3^7$ for an aligned triangle.', 'For self-similar sets satisfying the open set condition they agree; for sets like $\\{1/n\\}$ they differ.'][which], ['細かいスケールだけでフィットすれば、そのゆがみの大部分が取り除かれます。', '点を増やせばそれらの箱も埋まります。格子にそろった三角形なら本当の数はちょうど $3^7$ です。', '開集合条件を満たす自己相似集合では一致しますが、$\\{1/n\\}$ のような集合では異なります。'][which]]],
        set: which === 0 ? { set: 0, fit: 1, k: 7 } : which === 1 ? { set: 1, k: 7 } : undefined,
      };
    },
  ];

  /* ---------------- 3. Julia and Mandelbrot ---------------- */
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const step = (z, c) => { const s = mul(z, z); return [s[0] + c[0], s[1] + c[1]]; };
  const escapeN = (c, max = 200) => { let z = [0, 0]; for (let k = 1; k <= max; k++) { z = step(z, c); if (z[0] ** 2 + z[1] ** 2 > 4) return k; } return 0; };
  Q['julia-mandelbrot'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const c = r.pick([[0, 1], [-1, 0], [1, 0], [0, -1], [-2, 0], [0.5, 0], [-1, 1], [1, 1], [0, 2], [-0.5, 0.5]]);
        const z1 = step([0, 0], c), z2 = step(z1, c), z3 = step(z2, c);
        return {
          q: [`Iterate $z \\mapsto z^2 + c$ from $z_0 = 0$ with $c = ${cx(c)}$. What is $z_3$?`, `$c = ${cx(c)}$ として $z_0 = 0$ から $z \\mapsto z^2 + c$ を反復します。$z_3$ はいくつですか。`],
          a: { type: 'tuple', v: z3, labels: ['$\\operatorname{Re} z_3$', '$\\operatorname{Im} z_3$'], tol: 1e-6 },
          sol: [[`$z_1 = c = ${cx(z1)}$, $z_2 = z_1^2 + c = ${cx(z2)}$.`, `$z_1 = c = ${cx(z1)}$、$z_2 = z_1^2 + c = ${cx(z2)}$ です。`], [`$z_3 = z_2^2 + c = ${cx(z3)}$. ${Math.hypot(...z3) > 2 ? 'Already $|z_3| > 2$, so the orbit escapes and $c \\notin M$.' : 'The orbit is still within $|z| \\le 2$.'}`, `$z_3 = z_2^2 + c = ${cx(z3)}$ です。${Math.hypot(...z3) > 2 ? 'すでに $|z_3| > 2$ なので軌道は発散し、$c \\notin M$ です。' : '軌道はまだ $|z| \\le 2$ の中にあります。'}`]],
          set: c[0] >= -2.1 && c[0] <= 0.7 && Math.abs(c[1]) <= 1.2 ? { preset: 0, cr: c[0], ci: c[1] } : undefined,
        };
      }
      const cases = [[[0, 0], true, '$0$ is a fixed point.', '$0$ は不動点です。'], [[-1, 0], true, '$0 \\to -1 \\to 0$: a 2-cycle.', '$0 \\to -1 \\to 0$ と周期2で回ります。'], [[-2, 0], true, '$0 \\to -2 \\to 2 \\to 2 \\to \\dots$: bounded, at the tip of $M$.', '$0 \\to -2 \\to 2 \\to 2 \\to \\dots$ と有界で、$M$ の先端にあります。'], [[0, 1], true, '$0 \\to i \\to -1 + i \\to -i \\to -1 + i \\to \\dots$: bounded.', '$0 \\to i \\to -1 + i \\to -i \\to -1 + i \\to \\dots$ と有界です。'], [[1, 0], false, '$0 \\to 1 \\to 2 \\to 5$: past 2, so it escapes.', '$0 \\to 1 \\to 2 \\to 5$ と 2 を超えるので発散します。'], [[0.25, 0], true, '$c = 1/4$ is the cusp: the orbit creeps up to $1/2$ and never passes it.', '$c = 1/4$ は尖点で、軌道は $1/2$ に向かって増えますが決して越えません。'], [[0.3, 0], false, 'For real $c > 1/4$, $z^2 + c > z$ always, and the orbit climbs past 2.', '実数 $c > 1/4$ では常に $z^2 + c > z$ で、軌道は 2 を越えて増えます。'], [[0, 2], false, '$0 \\to 2i \\to -4 + 2i$: past 2.', '$0 \\to 2i \\to -4 + 2i$ と 2 を超えます。'], [[-2.1, 0], false, '$0 \\to -2.1$: already $|z| > 2$.', '$0 \\to -2.1$ ですでに $|z| > 2$ です。'], [[0.4, 0.4], false, 'The orbit leaves the disc $|z| \\le 2$ after a few steps: this is the Cantor-dust preset.', '軌道は数歩で円板 $|z| \\le 2$ を出ます。カントール塵の既定値がこれです。']];
      const [c, inM, en, ja] = r.pick(cases);
      return {
        q: [`Is $c = ${cx(c)}$ in the Mandelbrot set?`, `$c = ${cx(c)}$ はマンデルブロ集合に入りますか。`],
        a: { type: 'choice', opts: [['Yes: the orbit of 0 stays bounded, so $K(c)$ is connected', 'はい。0 の軌道は有界なので $K(c)$ は連結です'], ['No: the orbit of 0 escapes, so $K(c)$ is a Cantor dust', 'いいえ。0 の軌道は発散するので $K(c)$ はカントール塵です']], v: inM ? 0 : 1, fixed: true },
        hint: ['Iterate from $z_0 = 0$; once $|z| > 2$ the orbit is gone.', '$z_0 = 0$ から反復します。$|z| > 2$ になったら軌道は発散します。'],
        sol: [[en, ja], [inM ? 'Bounded critical orbit: $c \\in M$.' : 'Escaping critical orbit: $c \\notin M$.', inM ? '臨界軌道が有界なので $c \\in M$ です。' : '臨界軌道が発散するので $c \\notin M$ です。']],
        set: c[0] >= -2.1 && c[0] <= 0.7 && Math.abs(c[1]) <= 1.2 ? { preset: 0, cr: c[0], ci: c[1] } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([0, -0.5, -0.7, 0.2, -0.25, 0.1875, -0.3, 0.24, -0.6]);
        const disc = Math.sqrt(1 - 4 * c), za = (1 - disc) / 2, zr = (1 + disc) / 2;
        return {
          q: [`For real $c = ${n(c)}$, find the fixed points of $z \\mapsto z^2 + c$ and say which attracts: give the attracting one and its multiplier $|f'(z)| = |2z|$.`, `実数 $c = ${n(c)}$ について $z \\mapsto z^2 + c$ の不動点を求め、吸引的なものとその乗数 $|f'(z)| = |2z|$ を答えてください。`],
          a: { type: 'tuple', v: [za, Math.abs(2 * za)], labels: ['$z^*$', '$|2z^*|$'], tol: 6e-4 },
          hint: ['Solve $z^2 - z + c = 0$; a fixed point attracts when $|2z| < 1$.', '$z^2 - z + c = 0$ を解きます。不動点は $|2z| < 1$ のとき吸引的です。'],
          sol: [[`$z = \\dfrac{1 \\pm \\sqrt{1 - 4c}}{2} = \\dfrac{1 \\pm ${n(disc, 4)}}{2}$, giving $${n(za, 4)}$ and $${n(zr, 4)}$.`, `$z = \\dfrac{1 \\pm \\sqrt{1 - 4c}}{2} = \\dfrac{1 \\pm ${n(disc, 4)}}{2}$ より $${n(za, 4)}$ と $${n(zr, 4)}$ です。`], [`$|2z|$ is $${n(Math.abs(2 * za), 4)}$ and $${n(2 * zr, 4)}$; the first is below 1, so $z^* = ${n(za, 4)}$ attracts${Math.abs(2 * za) > 0.999 ? ' (just barely)' : ''} and the orbit of 0 falls into it.`, `$|2z|$ は $${n(Math.abs(2 * za), 4)}$ と $${n(2 * zr, 4)}$ で、前者が 1 未満なので $z^* = ${n(za, 4)}$ が吸引的${Math.abs(2 * za) > 0.999 ? '（ぎりぎり）' : ''}で、0 の軌道はそこに落ち込みます。`], ['$c$ lies in the main cardioid of $M$, the set of $c$ with an attracting fixed point.', '$c$ は $M$ の主心臓形、すなわち吸引的不動点をもつ $c$ の集合に入っています。']],
          set: { preset: 0, cr: c, ci: 0 },
        };
      }
      if (form === 1) {
        const c = r.pick([-0.8, -0.9, -1, -1.1, -1.2, -0.85, -1.15, -1.24]);
        const lam = 4 * (c + 1);
        return {
          q: [`For $c = ${n(c)}$ the map $z \\mapsto z^2 + c$ has a 2-cycle $\\{z_1, z_2\\}$ with $z_1 + z_2 = -1$ and $z_1z_2 = c + 1$. What is its multiplier $\\lambda = f'(z_1)f'(z_2)$?`, `$c = ${n(c)}$ のとき写像 $z \\mapsto z^2 + c$ は $z_1 + z_2 = -1$、$z_1z_2 = c + 1$ を満たす周期2の軌道 $\\{z_1, z_2\\}$ をもちます。その乗数 $\\lambda = f'(z_1)f'(z_2)$ はいくつですか。`],
          a: { type: 'num', v: lam, tol: 1e-6 },
          sol: [[`$\\lambda = 2z_1\\cdot 2z_2 = 4z_1z_2 = 4(c + 1) = ${n(lam)}$.`, `$\\lambda = 2z_1\\cdot 2z_2 = 4z_1z_2 = 4(c + 1) = ${n(lam)}$ です。`], [`$|\\lambda| ${Math.abs(lam) < 1 ? '< 1' : '\\ge 1'}$, so the cycle ${Math.abs(lam) < 1 ? 'attracts: $c$ is inside the period-2 bulb $|c + 1| < 1/4$' : 'does not attract: $c$ is outside the period-2 bulb $|c + 1| < 1/4$'}.`, `$|\\lambda| ${Math.abs(lam) < 1 ? '< 1' : '\\ge 1'}$ なので周期軌道は${Math.abs(lam) < 1 ? '吸引的で、$c$ は周期2の球根 $|c + 1| < 1/4$ の中にあります' : '吸引的ではなく、$c$ は周期2の球根 $|c + 1| < 1/4$ の外にあります'}。`]],
          set: { preset: 0, cr: c, ci: 0 },
        };
      }
      let c, k; do { c = [r.int(-21, 7) / 10, r.int(-12, 12) / 10]; k = escapeN(c); } while (k < 2 || k > 9);
      return {
        q: [`For $c = ${cx(c)}$, after how many steps does the orbit of 0 first satisfy $|z_k| > 2$?`, `$c = ${cx(c)}$ のとき、0 の軌道が初めて $|z_k| > 2$ となるのは何歩目ですか。`],
        a: { type: 'int', v: k },
        hint: ['Iterate and check $|z|^2 > 4$ after each step.', '1歩ごとに $|z|^2 > 4$ かどうかを確かめながら反復してください。'],
        sol: [[`The orbit: ${(() => { const o = []; let z = [0, 0]; for (let i = 1; i <= k; i++) { z = step(z, c); o.push(`$z_${i} = ${cx(z)}$`); } return o.join(', '); })()}.`, `軌道は ${(() => { const o = []; let z = [0, 0]; for (let i = 1; i <= k; i++) { z = step(z, c); o.push(`$z_${i} = ${cx(z)}$`); } return o.join('、'); })()} です。`], [`$|z_${k}| > 2$ for the first time at $k = ${k}$, so $c \\notin M$. The escape time is what shades the outside of $M$ in the figure.`, `$k = ${k}$ で初めて $|z_${k}| > 2$ となるので $c \\notin M$ です。図で $M$ の外側を塗り分けているのはこの脱出時間です。`]],
        set: { preset: 0, cr: c[0], ci: c[1] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['For real $c < 1/4$, write the multiplier $f\'(z^*) = 2z^*$ of the attracting fixed point $z^* = \\tfrac12(1 - \\sqrt{1 - 4c})$ of $z \\mapsto z^2 + c$ as a function of $c$.', '実数 $c < 1/4$ について、$z \\mapsto z^2 + c$ の吸引的不動点 $z^* = \\tfrac12(1 - \\sqrt{1 - 4c})$ の乗数 $f\'(z^*) = 2z^*$ を $c$ の関数として書いてください。'],
          a: { type: 'expr', v: '1 - sqrt(1 - 4*c)', vars: ['c'], dom: { c: [-0.7, 0.2] }, lhs: ['$\\lambda(c) =$', '$\\lambda(c) =$'] },
          sol: [['$\\lambda = 2z^* = 1 - \\sqrt{1 - 4c}$.', '$\\lambda = 2z^* = 1 - \\sqrt{1 - 4c}$ です。'], ['$\\lambda = -1$ at $c = -3/4$: there the fixed point stops attracting and a 2-cycle is born, which is where the period-2 bulb is attached to the cardioid.', '$c = -3/4$ で $\\lambda = -1$ となり、不動点は吸引的でなくなって周期2の軌道が生まれます。周期2の球根が心臓形に付く点がここです。']],
          set: { preset: 0, cr: -0.75, ci: 0 },
        };
      }
      if (form === 1) {
        const lam = r.pick([0.5, -0.5, 0.8, -0.8, 0.2, -0.2, 0.9, -0.6]);
        const c = lam / 2 - lam * lam / 4;
        return {
          q: [`Find the real $c$ for which $z \\mapsto z^2 + c$ has a fixed point with multiplier $\\lambda = ${n(lam)}$.`, `$z \\mapsto z^2 + c$ が乗数 $\\lambda = ${n(lam)}$ の不動点をもつような実数 $c$ を求めてください。`],
          a: { type: 'num', v: c, tol: 1e-5 },
          hint: ['The fixed point is $z^* = \\lambda/2$, and it satisfies $z^{*2} + c = z^*$.', '不動点は $z^* = \\lambda/2$ で、$z^{*2} + c = z^*$ を満たします。'],
          sol: [[`$z^* = \\lambda/2 = ${n(lam / 2)}$.`, `$z^* = \\lambda/2 = ${n(lam / 2)}$ です。`], [`$c = z^* - z^{*2} = \\lambda/2 - \\lambda^2/4 = ${n(c, 5)}$.`, `$c = z^* - z^{*2} = \\lambda/2 - \\lambda^2/4 = ${n(c, 5)}$ です。`], ['Letting $\\lambda = e^{i\\theta}$ run round the unit circle traces exactly the boundary of the main cardioid: $c = e^{i\\theta}/2 - e^{2i\\theta}/4$.', '$\\lambda = e^{i\\theta}$ を単位円上で一周させると、ちょうど主心臓形の境界 $c = e^{i\\theta}/2 - e^{2i\\theta}/4$ を描きます。']],
          set: { preset: 0, cr: Math.round(c * 1000) / 1000, ci: 0 },
        };
      }
      return {
        q: ['Write the multiplier of the 2-cycle of $z \\mapsto z^2 + c$ as a function of $c$ (real $c$ near $-1$).', '$z \\mapsto z^2 + c$ の周期2の軌道の乗数を $c$ の関数として書いてください（$-1$ に近い実数 $c$）。'],
        a: { type: 'expr', v: '4*(c + 1)', vars: ['c'], dom: { c: [-1.2, -0.8] }, lhs: ['$\\lambda(c) =$', '$\\lambda(c) =$'] },
        hint: ['Divide $f(f(z)) - z$ by $z^2 - z + c$ to find the 2-cycle, then use Vieta.', '$f(f(z)) - z$ を $z^2 - z + c$ で割って周期2の軌道を求め、解と係数の関係を使ってください。'],
        sol: [['$f(f(z)) - z = (z^2 - z + c)(z^2 + z + c + 1)$, so the 2-cycle solves $z^2 + z + c + 1 = 0$: $z_1z_2 = c + 1$.', '$f(f(z)) - z = (z^2 - z + c)(z^2 + z + c + 1)$ なので、周期2の軌道は $z^2 + z + c + 1 = 0$ の解で、$z_1z_2 = c + 1$ です。'], ['$\\lambda = 2z_1\\cdot2z_2 = 4(c + 1)$. It attracts for $|c + 1| < 1/4$, a disc of radius $1/4$ about $-1$: the period-2 bulb is an exact circle.', '$\\lambda = 2z_1\\cdot2z_2 = 4(c + 1)$ です。$|c + 1| < 1/4$ で吸引的なので、周期2の球根は $-1$ を中心とする半径 $1/4$ のちょうど円です。']],
        set: { preset: 2 },
      };
    },
  ];

  /* ---------------- 4. L-systems ---------------- */
  // Koch: F -> F+F--F+F. F count 4^n; other symbols 4 per rewritten F
  const kochLen = (k) => (7 * 4 ** k - 4) / 3;
  Q['l-systems'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 7);
        return {
          q: [`The Koch L-system $F \\to F{+}F{-}{-}F{+}F$ starts from the axiom $F$. How many $F$s (unit steps) are there after ${k} rewriting step${k > 1 ? 's' : ''}?`, `コッホの L システム $F \\to F{+}F{-}{-}F{+}F$ を公理 $F$ から始めます。書き換えを ${k} 回行うと、$F$（単位ステップ）はいくつありますか。`],
          a: { type: 'int', v: 4 ** k },
          sol: [['Each $F$ becomes four $F$s, and the turn symbols produce none.', '各 $F$ は4つの $F$ になり、回転の記号は $F$ を生みません。'], [`$4^{${k}} = ${4 ** k}$, the readout's segment count.`, `$4^{${k}} = ${4 ** k}$ で、読み取り欄の線分の数です。`]],
          set: { sys: 0, level: k, angle: 60 },
        };
      }
      if (form === 1) {
        const lev = r.int(1, 8), k = Math.min(12, Math.round(1.5 * lev));
        return {
          q: [`The dragon L-system $X \\to X{+}YF{+},\\ Y \\to {-}FX{-}Y$ starts from $FX$. How many unit steps $F$ does it have after ${k} rewriting steps?`, `ドラゴン曲線の L システム $X \\to X{+}YF{+},\\ Y \\to {-}FX{-}Y$ を $FX$ から始めます。書き換えを ${k} 回行うと、単位ステップ $F$ はいくつありますか。`],
          a: { type: 'int', v: 2 ** k },
          hint: ['Count how many $F$s each $X$ and each $Y$ eventually produce.', '各 $X$ と各 $Y$ が最終的に生む $F$ の数を数えてください。'],
          sol: [['Let $a_k$ be the number of $F$s. Each rewrite of $X$ and of $Y$ adds one $F$, and the number of $X$s and $Y$s doubles, so $a_{k+1} = 2a_k$.', '$F$ の数を $a_k$ とします。$X$ と $Y$ の書き換えのたびに $F$ が1つ加わり、$X$ と $Y$ の数は2倍になるので $a_{k+1} = 2a_k$ です。'], [`$a_0 = 1$, so $a_{${k}} = 2^{${k}} = ${2 ** k}$: the paper strip folded ${k} times has ${2 ** k} segments.`, `$a_0 = 1$ なので $a_{${k}} = 2^{${k}} = ${2 ** k}$ です。${k} 回折った紙の帯には ${2 ** k} 個の区間があります。`]],
          set: { sys: 1, level: lev, angle: 90 },
        };
      }
      const k = r.int(1, 7), which = r.int(0, 1);
      return {
        q: [which ? `How far apart are the two ends of the Sierpinski arrowhead curve after ${k} rewriting steps, in unit steps?` : `How far apart are the two ends of the Koch L-system drawing after ${k} rewriting steps, in unit steps?`, which ? `シェルピンスキーのアローヘッド曲線で、書き換え ${k} 回後の両端の距離は何単位ですか。` : `コッホの L システムの描画で、書き換え ${k} 回後の両端の距離は何単位ですか。`],
        a: { type: 'int', v: which ? 2 ** k : 3 ** k },
        sol: [[which ? 'Each level is three copies of the previous one, joined so that the span doubles.' : 'The generator $F{+}F{-}{-}F{+}F$ with $60^\\circ$ turns spans $1 + \\tfrac12 + \\tfrac12 + 1 = 3$ unit steps, so each level triples the span.', which ? '各レベルは前のレベルの写し3つを、両端の距離が2倍になるようにつないだものです。' : '$60^\\circ$ で回る生成子 $F{+}F{-}{-}F{+}F$ の両端の距離は $1 + \\tfrac12 + \\tfrac12 + 1 = 3$ 単位なので、レベルごとに距離は3倍になります。'], [`Span $= ${which ? 2 : 3}^{${k}} = ${which ? 2 ** k : 3 ** k}$, while the number of steps is $${which ? 3 : 4}^{${k}}$.`, `距離は $${which ? 2 : 3}^{${k}} = ${which ? 2 ** k : 3 ** k}$ で、ステップの数は $${which ? 3 : 4}^{${k}}$ です。`]],
        set: which ? { sys: 2, level: k, angle: 60 } : { sys: 0, level: k, angle: 60 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 7);
        return {
          q: [`How many symbols does the Koch string ($F \\to F{+}F{-}{-}F{+}F$, axiom $F$) have after ${k} rewriting steps?`, `コッホの文字列（$F \\to F{+}F{-}{-}F{+}F$、公理 $F$）は書き換え ${k} 回後に何文字ありますか。`],
          a: { type: 'int', v: kochLen(k) },
          hint: ['Track the $F$s and the turn symbols separately: turns are copied, and every rewritten $F$ adds four of them.', '$F$ と回転の記号を別々に数えます。回転はそのまま写され、書き換えられる $F$ ごとに4つ加わります。'],
          sol: [[`There are $4^{${k}} = ${4 ** k}$ $F$s. Each rewrite of an $F$ adds 4 turn symbols, so there are $4(1 + 4 + \\dots + 4^{${k - 1}}) = ${4 * (4 ** k - 1) / 3}$ turns.`, `$F$ は $4^{${k}} = ${4 ** k}$ 個です。$F$ を1つ書き換えるごとに回転記号が4つ加わるので、回転記号は $4(1 + 4 + \\dots + 4^{${k - 1}}) = ${4 * (4 ** k - 1) / 3}$ 個です。`], [`Total $${4 ** k} + ${4 * (4 ** k - 1) / 3} = ${kochLen(k)}$, as the caption above the figure says.`, `合計は $${4 ** k} + ${4 * (4 ** k - 1) / 3} = ${kochLen(k)}$ で、図の上の説明文のとおりです。`]],
          set: { sys: 0, level: k, angle: 60 },
        };
      }
      if (form === 1) {
        const cases = [[4, 3, 'Koch', 'コッホ曲線', 0], [2, Math.SQRT2, 'dragon', 'ドラゴン曲線', 1], [3, 2, 'Sierpinski arrowhead', 'シェルピンスキーのアローヘッド', 2]];
        const [c, s, en, ja, sys] = r.pick(cases);
        return {
          q: [`The ${en} curve is ${c} copies of itself, each scaled by $1/${s === Math.SQRT2 ? '\\sqrt2' : s}$. What is its similarity dimension?`, `${ja}は自分自身を $1/${s === Math.SQRT2 ? '\\sqrt2' : s}$ に縮めた写し ${c} 個です。相似次元はいくつですか。`],
          a: { type: 'num', v: ln(c) / ln(s), tol: 6e-4 },
          sol: [[`$d = \\log ${c}/\\log ${s === Math.SQRT2 ? '\\sqrt2' : s} = ${n(ln(c) / ln(s), 4)}$.`, `$d = \\log ${c}/\\log ${s === Math.SQRT2 ? '\\sqrt2' : s} = ${n(ln(c) / ln(s), 4)}$ です。`], [sys === 1 ? 'Dimension 2: the dragon curve fills a region of the plane with positive area, though it is made of straight steps.' : 'The readout\'s log(segments)/log(span) gives the same number at every level.', sys === 1 ? '次元は 2 です。ドラゴン曲線は直線のステップからできているのに、平面の正の面積をもつ領域を埋め尽くします。' : '読み取り欄の log(線分の数)/log(距離) はどのレベルでも同じ値を与えます。']],
          set: { sys, level: 4, angle: [60, 90, 60][sys] },
        };
      }
      const a = r.int(2, 9) * 10;
      const s = 2 + 2 * Math.cos(a * deg), d = ln(4) / ln(s);
      return {
        q: [`Keep the Koch rule $F \\to F{+}F{-}{-}F{+}F$ but turn by $\\delta = ${a}^\\circ$. The generator then spans $2 + 2\\cos\\delta$ unit steps. What is the dimension of the limit curve?`, `コッホの規則 $F \\to F{+}F{-}{-}F{+}F$ のまま、回転角を $\\delta = ${a}^\\circ$ にします。生成子の両端の距離は $2 + 2\\cos\\delta$ 単位になります。極限の曲線の次元はいくつですか。`],
        a: { type: 'num', v: d, tol: 6e-4 },
        hint: ['Four copies, each scaled by $1/(2 + 2\\cos\\delta)$.', '写しは4つで、それぞれ $1/(2 + 2\\cos\\delta)$ 倍です。'],
        sol: [[`Scale $s = 2 + 2\\cos ${a}^\\circ = ${n(s, 4)}$.`, `縮尺は $s = 2 + 2\\cos ${a}^\\circ = ${n(s, 4)}$ です。`], [`$d = \\log 4/\\log ${n(s, 4)} = ${n(d, 4)}$. ${a < 60 ? 'Flatter bumps give a curve closer to a line.' : a > 60 ? 'Taller bumps crowd the curve toward filling area.' : 'This is the classical Koch curve.'}`, `$d = \\log 4/\\log ${n(s, 4)} = ${n(d, 4)}$ です。${a < 60 ? '山が低いほど曲線は直線に近づきます。' : a > 60 ? '山が高いほど曲線は面を埋める方向に詰まります。' : 'これは古典的なコッホ曲線です。'}`]],
        set: { sys: 0, level: 5, angle: a },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.pick([1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.05]);
        const cosd = (4 ** (1 / d) - 2) / 2, a = Math.acos(cosd) / deg;
        return {
          q: [`At what turning angle $\\delta$ (degrees) does the Koch rule $F \\to F{+}F{-}{-}F{+}F$ give a curve of dimension $${n(d)}$?`, `コッホの規則 $F \\to F{+}F{-}{-}F{+}F$ が次元 $${n(d)}$ の曲線を与える回転角 $\\delta$（度）はいくつですか。`],
          a: { type: 'num', v: a, tol: 0.05, unit: ['°', '°'] },
          hint: ['Solve $4 = (2 + 2\\cos\\delta)^d$.', '$4 = (2 + 2\\cos\\delta)^d$ を解いてください。'],
          sol: [[`$2 + 2\\cos\\delta = 4^{1/${n(d)}} = ${n(4 ** (1 / d), 5)}$.`, `$2 + 2\\cos\\delta = 4^{1/${n(d)}} = ${n(4 ** (1 / d), 5)}$ です。`], [`$\\cos\\delta = ${n(cosd, 5)}$, so $\\delta = ${n(a, 3)}^\\circ$.`, `$\\cos\\delta = ${n(cosd, 5)}$ より $\\delta = ${n(a, 3)}^\\circ$ です。`], ['The dimension rises continuously from 1 at $\\delta = 0$ to 2 at $\\delta = 90^\\circ$, where the copies start to touch.', '次元は $\\delta = 0$ での 1 から、写しどうしが接し始める $\\delta = 90^\\circ$ での 2 まで連続的に増えます。']],
          set: { sys: 0, level: 5, angle: Math.round(a) },
        };
      }
      if (form === 1) {
        return {
          q: ['Write the number of symbols in the Koch string ($F \\to F{+}F{-}{-}F{+}F$, axiom $F$) after $n$ rewriting steps as a formula in $n$.', 'コッホの文字列（$F \\to F{+}F{-}{-}F{+}F$、公理 $F$）の書き換え $n$ 回後の文字数を $n$ の式で書いてください。'],
          a: { type: 'expr', v: '(7*4^n - 4)/3', vars: ['n'], dom: { n: [1, 6] }, lhs: ['$L_n =$', '$L_n =$'] },
          hint: ['Each of the $4^n$ $F$s turns into 8 symbols at the next step.', '$4^n$ 個の $F$ はそれぞれ次の段階で8文字になります。'],
          sol: [['$L_0 = 1$. Rewriting one $F$ (1 symbol) as $F{+}F{-}{-}F{+}F$ (8 symbols) adds 7, and there are $4^n$ $F$s to rewrite, so $L_{n+1} = L_n + 7\\cdot 4^n$.', '$L_0 = 1$ です。$F$ 1つ（1文字）を $F{+}F{-}{-}F{+}F$（8文字）に書き換えると7文字増え、書き換える $F$ は $4^n$ 個あるので $L_{n+1} = L_n + 7\\cdot 4^n$ です。'], ['So $L_n = 1 + 7(1 + 4 + \\dots + 4^{n-1}) = 1 + \\tfrac73(4^n - 1) = \\dfrac{7\\cdot 4^n - 4}{3}$.', 'よって $L_n = 1 + 7(1 + 4 + \\dots + 4^{n-1}) = 1 + \\tfrac73(4^n - 1) = \\dfrac{7\\cdot 4^n - 4}{3}$ です。'], ['The string grows like $4^n$, at the same rate as the number of steps: written out, a fractal\'s description is as long as the fractal, which is why an L-system stores only the rule.', '文字列はステップの数と同じく $4^n$ のように伸びます。書き下したフラクタルの記述はフラクタルと同じ長さになるので、L システムは規則だけを保存するのです。']],
          set: { sys: 0, level: 4, angle: 60 },
        };
      }
      const k = r.int(2, 6);
      // plant: X -> F+[[X]-X]-F[-FX]+X, F -> FF. F count a_k: a_{k+1} = 2 a_k + 3 x_k, x_{k+1} = 4 x_k
      let x = 1, f = 0; for (let i = 0; i < k; i++) { f = 2 * f + 3 * x; x = 4 * x; }
      return {
        q: [`The plant L-system has $X \\to F{+}[[X]{-}X]{-}F[{-}FX]{+}X$ and $F \\to FF$, axiom $X$. How many $F$s (segments) does it have after ${k} rewriting steps?`, `植物の L システムは $X \\to F{+}[[X]{-}X]{-}F[{-}FX]{+}X$、$F \\to FF$、公理 $X$ です。書き換え ${k} 回後に $F$（線分）はいくつありますか。`],
        a: { type: 'int', v: f },
        hint: ['Let $x_k$ count $X$s and $f_k$ count $F$s: $x_{k+1} = 4x_k$ and $f_{k+1} = 2f_k + 3x_k$.', '$X$ の数を $x_k$、$F$ の数を $f_k$ とすると $x_{k+1} = 4x_k$、$f_{k+1} = 2f_k + 3x_k$ です。'],
        sol: [['Each $X$ makes 4 new $X$s and 3 new $F$s; each old $F$ doubles.', '各 $X$ は新しい $X$ を4つ、新しい $F$ を3つ生み、古い $F$ はそれぞれ2倍になります。'], [`From $x_0 = 1$, $f_0 = 0$: $f_{${k}} = 3(4^{${k}} - 2^{${k}})/2 = ${f}$.`, `$x_0 = 1$、$f_0 = 0$ から $f_{${k}} = 3(4^{${k}} - 2^{${k}})/2 = ${f}$ です。`], ['The new growth ($4^k$) soon dominates the stretching of old branches ($2^k$), but the old trunk is what gets long: here the $F \\to FF$ rule is the plant\'s secondary growth.', '新しい成長 ($4^k$) がすぐに古い枝の伸び ($2^k$) を上回りますが、長くなるのは古い幹です。$F \\to FF$ の規則は植物の二次成長にあたります。']],
        set: { sys: 3, level: k, angle: 25 },
      };
    },
  ];

  /* ---------------- 5. Newton's method ---------------- */
  const cdiv = (a, b) => { const d = b[0] ** 2 + b[1] ** 2; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const newton3 = (z) => { const z2 = mul(z, z), z3 = mul(z2, z); const q = cdiv([z3[0] - 1, z3[1]], [3 * z2[0], 3 * z2[1]]); return [z[0] - q[0], z[1] - q[1]]; };
  Q['newton-fractal'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([2, 3, 5, 7, 10]), x0 = r.pick([1, 2, 3]);
        const x1 = (x0 + a / x0) / 2;
        return {
          q: [`One step of Newton's method for $p(x) = x^2 - ${a}$ from $x_0 = ${x0}$: what is $x_1$?`, `$p(x) = x^2 - ${a}$ に対するニュートン法を $x_0 = ${x0}$ から1歩進めます。$x_1$ はいくつですか。`],
          a: { type: 'num', v: x1, show: frac(x0 * x0 + a, 2 * x0) },
          sol: [[`$x_1 = x_0 - \\dfrac{x_0^2 - ${a}}{2x_0} = \\dfrac{x_0 + ${a}/x_0}{2}$.`, `$x_1 = x_0 - \\dfrac{x_0^2 - ${a}}{2x_0} = \\dfrac{x_0 + ${a}/x_0}{2}$ です。`], [`$= ${frac(x0 * x0 + a, 2 * x0)} = ${n(x1, 5)}$, against $\\sqrt{${a}} = ${n(Math.sqrt(a), 5)}$: the Babylonian square-root rule is Newton's method.`, `$= ${frac(x0 * x0 + a, 2 * x0)} = ${n(x1, 5)}$ で、$\\sqrt{${a}} = ${n(Math.sqrt(a), 5)}$ と比べてください。バビロニアの平方根の求め方はニュートン法そのものです。`]],
        };
      }
      if (form === 1) {
        const x0 = r.pick([2, -2, 0.5, 3, -1, 1.5, -0.5]);
        const x1 = (2 * x0 ** 3 + 1) / (3 * x0 * x0);
        return {
          q: [`For $p(z) = z^3 - 1$, one Newton step from the real point $z_0 = ${n(x0)}$ gives $z_1 = ?$`, `$p(z) = z^3 - 1$ について、実数の点 $z_0 = ${n(x0)}$ からニュートン法を1歩進めた $z_1$ はいくつですか。`],
          a: { type: 'num', v: x1, tol: 6e-5 },
          sol: [['$N(z) = z - \\dfrac{z^3 - 1}{3z^2} = \\dfrac{2z^3 + 1}{3z^2}$.', '$N(z) = z - \\dfrac{z^3 - 1}{3z^2} = \\dfrac{2z^3 + 1}{3z^2}$ です。'], [`$N(${n(x0)}) = \\dfrac{${n(2 * x0 ** 3 + 1)}}{${n(3 * x0 * x0)}} = ${n(x1, 5)}$.`, `$N(${n(x0)}) = \\dfrac{${n(2 * x0 ** 3 + 1)}}{${n(3 * x0 * x0)}} = ${n(x1, 5)}$ です。`], [x0 < 0 ? 'A negative real start jumps across: on the real line Newton\'s map for $z^3 - 1$ sends every real start except $0$ (where $N$ has a pole) and its preimages to the root $1$.' : 'Real starts stay real, and every positive start converges to the root $1$.', x0 < 0 ? '負の実数から始めると反対側へ跳びます。実軸上では、$z^3 - 1$ のニュートン写像は $0$（定義されない点）とその逆像を除くすべての実数の出発点を根 $1$ に送ります。' : '実数から始めれば実数のままで、正の出発点はすべて根 $1$ に収束します。']],
          set: Math.abs(x0) <= 2 ? { preset: 0, x0, y0: 0 } : { preset: 0 },
        };
      }
      return {
        q: ['Write Newton\'s map $N(z) = z - p(z)/p\'(z)$ for $p(z) = z^3 - 1$ as a single fraction.', '$p(z) = z^3 - 1$ に対するニュートン写像 $N(z) = z - p(z)/p\'(z)$ を一つの分数で書いてください。'],
        a: { type: 'expr', v: '(2*z^3 + 1)/(3*z^2)', vars: ['z'], dom: { z: [0.3, 2] }, lhs: ['$N(z) =$', '$N(z) =$'] },
        sol: [['$p\'(z) = 3z^2$, so $N(z) = \\dfrac{3z^3 - (z^3 - 1)}{3z^2}$.', '$p\'(z) = 3z^2$ なので $N(z) = \\dfrac{3z^3 - (z^3 - 1)}{3z^2}$ です。'], ['$N(z) = \\dfrac{2z^3 + 1}{3z^2}$: a rational map of degree 3, whose Julia set is the boundary drawn in the figure.', '$N(z) = \\dfrac{2z^3 + 1}{3z^2}$ は次数3の有理写像で、そのジュリア集合が図に描かれた境界です。']],
        set: { preset: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let z0; do { z0 = [r.int(-15, 15) / 10, r.int(-15, 15) / 10]; } while (Math.hypot(z0[0], z0[1]) < 0.8);
        const z1 = newton3(z0), z2 = newton3(z1);
        return {
          q: [`Take two Newton steps for $z^3 - 1$ from $z_0 = ${cx(z0)}$. What is $z_2$?`, `$z^3 - 1$ に対するニュートン法を $z_0 = ${cx(z0)}$ から2歩進めます。$z_2$ はいくつですか。`],
          a: { type: 'tuple', v: z2, labels: ['$\\operatorname{Re} z_2$', '$\\operatorname{Im} z_2$'], tol: 6e-4 },
          hint: ['Use $N(z) = \\dfrac{2z^3 + 1}{3z^2}$ with complex arithmetic.', '複素数の計算で $N(z) = \\dfrac{2z^3 + 1}{3z^2}$ を使ってください。'],
          sol: [[`$z_1 = N(z_0) = ${cx(z1)}$.`, `$z_1 = N(z_0) = ${cx(z1)}$ です。`], [`$z_2 = N(z_1) = ${cx(z2)}$. Drag the start point to $z_0$ and follow the orbit's polyline.`, `$z_2 = N(z_1) = ${cx(z2)}$ です。出発点を $z_0$ に動かし、軌道の折れ線をたどってください。`]],
          set: { preset: 0, x0: z0[0], y0: z0[1] },
        };
      }
      if (form === 1) {
        let x0, k; do { x0 = r.int(-20, 20) / 10; let z = [x0, 0]; k = 0; while (Math.hypot(z[0] - 1, z[1]) >= 1e-6 && k < 80) { z = newton3(z); k++; if (!Number.isFinite(z[0])) { k = 99; break; } } } while (x0 === 0 || k > 40 || k < 2);
        return {
          q: [`Newton's method for $z^3 - 1$ from the real point $z_0 = ${n(x0)}$: after how many steps is $|z_k - 1| < 10^{-6}$ for the first time?`, `$z^3 - 1$ に対するニュートン法を実数の点 $z_0 = ${n(x0)}$ から始めます。初めて $|z_k - 1| < 10^{-6}$ となるのは何歩目ですか。`],
          a: { type: 'int', v: k },
          hint: ['Iterate $x \\mapsto (2x^3 + 1)/(3x^2)$. Far from the root it moves slowly; near it the error squares each step.', '$x \\mapsto (2x^3 + 1)/(3x^2)$ を反復します。根から遠いとゆっくり、近づくと誤差は毎歩2乗になります。'],
          sol: [[`The iterates: ${(() => { let z = x0; const o = []; for (let i = 1; i <= k; i++) { z = (2 * z ** 3 + 1) / (3 * z * z); o.push(n(z, 7)); } return '$' + o.join(',\\ ') + '$'; })()}.`, `反復の値は ${(() => { let z = x0; const o = []; for (let i = 1; i <= k; i++) { z = (2 * z ** 3 + 1) / (3 * z * z); o.push(n(z, 7)); } return '$' + o.join(',\\ ') + '$'; })()} です。`], [`So $k = ${k}$, which the readout reports when $z_0 = ${n(x0)}$. The last few steps each roughly double the number of correct digits.`, `したがって $k = ${k}$ で、$z_0 = ${n(x0)}$ のとき読み取り欄にこの値が出ます。最後の数歩では、正しい桁数がほぼ毎歩2倍になります。`]],
          set: { preset: 0, x0, y0: 0 },
        };
      }
      const e = r.pick([1e-2, 1e-3, 5e-3, 2e-4]);
      const e1 = e * e, e2 = e1 * e1;
      return {
        q: [`Near the root $1$ of $z^3 - 1$, Newton's error obeys $e_{k+1} \\approx \\dfrac{p''(1)}{2p'(1)}e_k^2$. If $e_k = ${n(e)}$, estimate $e_{k+2}$.`, `$z^3 - 1$ の根 $1$ の近くで、ニュートン法の誤差は $e_{k+1} \\approx \\dfrac{p''(1)}{2p'(1)}e_k^2$ に従います。$e_k = ${n(e)}$ のとき $e_{k+2}$ を見積もってください。`],
        a: { type: 'num', v: e2, rel: 0.01 },
        sol: [['$p\'(1) = 3$ and $p\'\'(1) = 6$, so the constant is $6/6 = 1$ and $e_{k+1} \\approx e_k^2$.', '$p\'(1) = 3$、$p\'\'(1) = 6$ なので定数は $6/6 = 1$ で、$e_{k+1} \\approx e_k^2$ です。'], [`$e_{k+1} \\approx ${n(e1)}$ and $e_{k+2} \\approx ${n(e2)}$.`, `$e_{k+1} \\approx ${n(e1)}$、$e_{k+2} \\approx ${n(e2)}$ です。`], ['Quadratic convergence: the number of correct digits doubles every step, which is why the basins look flat-coloured deep inside.', '2次収束では、正しい桁数が毎歩2倍になります。吸引域の奥深くがほぼ一色に見えるのはこのためです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pick = r.int(0, 2);
        const qs = [['For $p(z) = z^3 - 2z + 2$, compute $N(0)$ and $N(1)$.', '$p(z) = z^3 - 2z + 2$ について $N(0)$ と $N(1)$ を計算してください。'], ['For $p(z) = z^3 - 2z + 2$, what is the multiplier $N\'(0)N\'(1)$ of the Newton cycle $0 \\to 1 \\to 0$?', '$p(z) = z^3 - 2z + 2$ について、ニュートン法の周期軌道 $0 \\to 1 \\to 0$ の乗数 $N\'(0)N\'(1)$ はいくつですか。'], ['For $p(z) = z^3 - 2z + 2$, Newton\'s method started at $z_0 = 0.01$ converges to what?', '$p(z) = z^3 - 2z + 2$ について、$z_0 = 0.01$ から始めたニュートン法は何に収束しますか。']];
        let a;
        if (pick === 0) a = { type: 'tuple', v: [1, 0], labels: ['$N(0)$', '$N(1)$'], tol: 1e-6 };
        else if (pick === 1) a = { type: 'num', v: 0, tol: 1e-6 };
        else a = { type: 'choice', opts: [['To the cycle $0 \\leftrightarrow 1$, never to a root', '周期軌道 $0 \\leftrightarrow 1$ に収束し、どの根にも収束しない'], ['To the real root $\\approx -1.769$', '実根 $\\approx -1.769$'], ['To one of the complex roots', '複素数の根のどれか']], v: 0 };
        return {
          q: qs[pick],
          a,
          hint: ['$N(z) = z - p(z)/p\'(z)$ and $N\'(z) = p(z)p\'\'(z)/p\'(z)^2$.', '$N(z) = z - p(z)/p\'(z)$、$N\'(z) = p(z)p\'\'(z)/p\'(z)^2$ です。'],
          sol: [['$p(0) = 2$, $p\'(0) = -2$: $N(0) = 0 - 2/(-2) = 1$. $p(1) = 1$, $p\'(1) = 1$: $N(1) = 1 - 1 = 0$.', '$p(0) = 2$、$p\'(0) = -2$ より $N(0) = 0 - 2/(-2) = 1$。$p(1) = 1$、$p\'(1) = 1$ より $N(1) = 1 - 1 = 0$ です。'], ['$p\'\'(0) = 0$, so $N\'(0) = 0$ and the multiplier $N\'(0)N\'(1) = 0$: the cycle is superattracting.', '$p\'\'(0) = 0$ なので $N\'(0) = 0$ で、乗数 $N\'(0)N\'(1) = 0$ です。周期軌道は超吸引的です。'], ['Every start close enough to 0 or 1 is captured by the cycle and never finds a root: these are the black islands of the second preset.', '0 または 1 に十分近い出発点はすべて周期軌道に捕らえられ、根を見つけません。2番目の既定値の黒い島がそれです。']],
          set: { preset: 1, x0: pick === 2 ? 0.01 : 0, y0: 0 },
        };
      }
      if (form === 1) {
        const m = r.int(3, 6);
        return {
          q: [`Write Newton's map for $p(x) = x^{${m}} - 1$ as a single fraction in $x$.`, `$p(x) = x^{${m}} - 1$ に対するニュートン写像を $x$ の一つの分数で書いてください。`],
          a: { type: 'expr', v: `(${m === 2 ? '' : (m - 1) + '*'}x^${m} + 1)/(${m}*x${m === 2 ? '' : '^' + (m - 1)})`, vars: ['x'], dom: { x: [0.4, 2] }, lhs: ['$N(x) =$', '$N(x) =$'] },
          sol: [[`$N(x) = x - \\dfrac{x^{${m}} - 1}{${m}x^{${m - 1}}} = \\dfrac{${m}x^{${m}} - x^{${m}} + 1}{${m}x^{${m - 1}}}$.`, `$N(x) = x - \\dfrac{x^{${m}} - 1}{${m}x^{${m - 1}}} = \\dfrac{${m}x^{${m}} - x^{${m}} + 1}{${m}x^{${m - 1}}}$ です。`], [`$N(x) = \\dfrac{${m - 1}x^{${m}} + 1}{${m}x^{${m - 1}}}$. In the complex plane its basins are ${m} rotated copies of one another, meeting along a fractal boundary${m === 2 ? ', except for $m = 2$, where the boundary is simply the imaginary axis' : ''}.`, `$N(x) = \\dfrac{${m - 1}x^{${m}} + 1}{${m}x^{${m - 1}}}$ です。複素平面では吸引域は互いに回転した ${m} 個の写しで、フラクタルな境界で接します${m === 2 ? '。ただし $m = 2$ では境界は単に虚軸です' : ''}。`]],
        };
      }
      const e0 = r.pick([0.1, 0.2, 0.05]), tol = r.pick([1e-6, 1e-4, 1e-8]);
      const k = Math.ceil(Math.log(e0 / tol) / Math.log(2) - 1e-9);
      return {
        q: [`Newton's method for $p(z) = (z - 1)^2(z + 2)$ starts with error $${n(e0)}$ from the double root $1$. Near a double root $e_{k+1} \\approx e_k/2$. About how many steps until the error is below $${n(tol)}$?`, `$p(z) = (z - 1)^2(z + 2)$ に対するニュートン法を、重根 $1$ からの誤差 $${n(e0)}$ で始めます。重根の近くでは $e_{k+1} \\approx e_k/2$ です。誤差が $${n(tol)}$ を下回るまで約何歩かかりますか。`],
        a: { type: 'int', v: k },
        hint: ['Solve $e_0/2^k < \\varepsilon$.', '$e_0/2^k < \\varepsilon$ を解いてください。'],
        sol: [['At a root of multiplicity $m$, $N\'(r) = 1 - 1/m$; for a double root that is $1/2$, so convergence is only linear.', '重複度 $m$ の根では $N\'(r) = 1 - 1/m$ で、重根では $1/2$ なので収束は1次にすぎません。'], [`$k \\ge \\log_2(${n(e0)}/${n(tol)}) = ${n(Math.log2(e0 / tol), 3)}$, so about $${k}$ steps, against three or four for a simple root.`, `$k \\ge \\log_2(${n(e0)}/${n(tol)}) = ${n(Math.log2(e0 / tol), 3)}$ なので約 $${k}$ 歩で、単根なら3〜4歩です。`], ['Merging two roots slows Newton\'s method dramatically: in the figure, drag two roots together and watch the step count of the orbit grow.', '2つの根が合わさるとニュートン法は大きく遅くなります。図で2つの根を近づけ、軌道の歩数が増える様子を見てください。']],
        set: { preset: 2 },
      };
    },
  ];
})();
