'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180;
  const sgn = (x) => (x < 0 ? '-' : '+');
  // y = m x + b written for the prompt
  const lineEq = (m, b) => `y = ${m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`}${b === 0 ? (m === 0 ? '0' : '') : `${m === 0 ? (b < 0 ? '-' : '') : (b < 0 ? ' - ' : ' + ')}${Math.abs(b)}`}`;
  const tri = (v) => `(${v.join(', ')})`;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // cross-ratio (a,b;c,d) as an exact fraction [num, den]
  const crQ = (a, b, c, d) => [(c - a) * (d - b), (c - b) * (d - a)];
  const crV = (a, b, c, d) => ((c - a) * (d - b)) / ((c - b) * (d - a));
  const dist4 = (r, lo, hi) => { let s; do { s = r.sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), 4); } while (new Set(s).size < 4); return s; };

  /* ---------------- 1. the projective plane ---------------- */
  Q['projective-plane'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const c = r.pick([2, 3, 4, 5]), a = r.nz(-9, 9), b = r.nz(-9, 9);
        return {
          q: [`A line through the origin $O$ has direction $(${a}, ${b}, ${c})$. At which point $(x, y)$ of the plane $z = 1$ does it cross that plane?`, `原点 $O$ を通る直線の方向が $(${a}, ${b}, ${c})$ です。この直線は平面 $z = 1$ のどの点 $(x, y)$ を貫きますか。`],
          a: { type: 'tuple', v: [a / c, b / c], labels: ['$x$', '$y$'], tol: 0.01 },
          hint: ['Scale the direction vector until its third coordinate is $1$.', '方向ベクトルを定数倍して、第三成分を $1$ にします。'],
          sol: [[`Scale by $1/${c}$: $(${a}, ${b}, ${c}) \\to (${frac(a, c)}, ${frac(b, c)}, 1)$.`, `$1/${c}$ 倍すると $(${a}, ${b}, ${c}) \\to (${frac(a, c)}, ${frac(b, c)}, 1)$ です。`], ['The first two coordinates are the point of the chart. This is the map $[X:Y:Z] \\mapsto (X/Z, Y/Z)$.', '最初の二成分がチャートの点です。これが写像 $[X:Y:Z] \\mapsto (X/Z, Y/Z)$ です。']],
        };
      }
      if (form === 1) {
        const z = r.pick([2, 3, 4, -2, -3]), x = r.nz(-9, 9), y = r.nz(-9, 9);
        return {
          q: [`The point $[${x} : ${y} : ${z}]$ of the projective plane lies in the chart $Z \\neq 0$. What are its chart coordinates $(x, y) = (X/Z,\\, Y/Z)$?`, `射影平面の点 $[${x} : ${y} : ${z}]$ はチャート $Z \\neq 0$ にあります。チャート座標 $(x, y) = (X/Z,\\, Y/Z)$ を求めてください。`],
          a: { type: 'tuple', v: [x / z, y / z], labels: ['$x$', '$y$'], tol: 0.01 },
          hint: ['Divide the first two coordinates by the third. A negative $Z$ is fine: $[X:Y:Z]$ and $[-X:-Y:-Z]$ are the same point.', '第三成分で最初の二成分を割ります。$Z$ が負でも構いません。$[X:Y:Z]$ と $[-X:-Y:-Z]$ は同じ点です。'],
          sol: [[`$(${x}/${z},\\ ${y}/${z}) = (${frac(x, z)},\\ ${frac(y, z)})$.`, `$(${x}/${z},\\ ${y}/${z}) = (${frac(x, z)},\\ ${frac(y, z)})$ です。`], ['Dividing by $Z$ is the same as scaling the line through $O$ until it hits the plane $z = 1$.', '$Z$ で割ることは、$O$ を通る直線を平面 $z = 1$ に当たるまで拡大縮小することと同じです。']],
        };
      }
      if (form === 2) {
        return {
          q: ['In homogeneous coordinates $[X : Y : Z]$, which coordinate is $0$ exactly for the points at infinity?', '斉次座標 $[X : Y : Z]$ で、無限遠点でちょうど $0$ になる座標はどれですか。'],
          a: { type: 'choice', v: 2, fixed: true, opts: [['$X$', '$X$'], ['$Y$', '$Y$'], ['$Z$', '$Z$'], ['None: the points at infinity have no coordinates', 'なし：無限遠点には座標がない']] },
          hint: ['A point at infinity is a horizontal line through $O$. What is its height?', '無限遠点は $O$ を通る水平な直線です。その高さはいくつでしょう。'],
          sol: [['A horizontal direction is $(X, Y, 0)$: it never rises to the plane $z = 1$, so the chart formula $X/Z$ breaks down.', '水平な方向は $(X, Y, 0)$ で、平面 $z = 1$ まで上がりません。そのため、チャートの式 $X/Z$ が使えなくなります。'], ['Each direction $(X, Y)$ in the plane gives one such point, which is why the line at infinity is itself a circle of points.', '平面内の各方向 $(X, Y)$ がそれぞれ一つの無限遠点を与えるので、無限遠直線は点の作る円です。']],
        };
      }
      return {
        q: ['Two distinct lines of the projective plane that look parallel in the chart $z = 1$ meet in how many points?', 'チャート $z = 1$ で平行に見える、射影平面の相異なる二直線は、何個の点で交わりますか。'],
        a: { type: 'int', v: 1 },
        hint: ['The two planes through $O$ always meet in a line through $O$.', '$O$ を通る二つの平面は必ず $O$ を通る直線で交わります。'],
        sol: [['Their planes meet in a horizontal line through $O$. That is one point, the common point at infinity.', '二つの平面は $O$ を通る水平な直線で交わります。これが一点、共通の無限遠点です。'], ['In the projective plane any two distinct lines meet in exactly one point, parallel or not.', '射影平面では、平行かどうかにかかわらず、相異なる二直線はちょうど一点で交わります。']],
        set: { rel: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x0 = r.int(-3, 3), y0 = r.int(-3, 3), m1 = r.int(-3, 3);
        let m2; do { m2 = r.int(-3, 3); } while (m2 === m1);
        const b1 = y0 - m1 * x0, b2 = y0 - m2 * x0;
        const l1 = [m1, -1, b1], l2 = [m2, -1, b2], P = cross(l1, l2);
        return {
          q: [`Use homogeneous coordinates to find where the lines $${lineEq(m1, b1)}$ and $${lineEq(m2, b2)}$ meet. Give the point $(x, y)$.`, `斉次座標を使って、直線 $${lineEq(m1, b1)}$ と $${lineEq(m2, b2)}$ の交点 $(x, y)$ を求めてください。`],
          a: { type: 'tuple', v: [x0, y0], labels: ['$x$', '$y$'], tol: 1e-6 },
          hint: ['Write $y = mx + b$ as $mX - Y + bZ = 0$, i.e. the line $(m, -1, b)$, and take the cross product.', '$y = mx + b$ を $mX - Y + bZ = 0$、つまり直線 $(m, -1, b)$ と書き、外積をとります。'],
          sol: [[`The lines are $${tri(l1)}$ and $${tri(l2)}$, and their cross product is $${tri(P)}$.`, `直線は $${tri(l1)}$ と $${tri(l2)}$ で、外積は $${tri(P)}$ です。`], [`Dividing by $Z = ${P[2]}$: $(x, y) = (${frac(P[0], P[2])}, ${frac(P[1], P[2])}) = (${x0}, ${y0})$.`, `$Z = ${P[2]}$ で割ると $(x, y) = (${frac(P[0], P[2])}, ${frac(P[1], P[2])}) = (${x0}, ${y0})$ です。`]],
        };
      }
      if (form === 1) {
        const m = r.int(-4, 4), b1 = r.int(-4, 4);
        let b2; do { b2 = r.int(-4, 4); } while (b2 === b1);
        return {
          q: [`The parallel lines $${lineEq(m, b1)}$ and $${lineEq(m, b2)}$ meet at the point at infinity $[1 : s : 0]$. Find $s$.`, `平行な直線 $${lineEq(m, b1)}$ と $${lineEq(m, b2)}$ は、無限遠点 $[1 : s : 0]$ で交わります。$s$ を求めてください。`],
          a: { type: 'num', v: m, tol: 1e-6 },
          hint: ['Cross the two lines $(m, -1, b_1)$ and $(m, -1, b_2)$; the third entry should vanish.', '二直線 $(m, -1, b_1)$ と $(m, -1, b_2)$ の外積をとります。第三成分は $0$ になるはずです。'],
          sol: [[`$(${m}, -1, ${b1}) \\times (${m}, -1, ${b2}) = ${tri(cross([m, -1, b1], [m, -1, b2]))}$, which has $Z = 0$.`, `$(${m}, -1, ${b1}) \\times (${m}, -1, ${b2}) = ${tri(cross([m, -1, b1], [m, -1, b2]))}$ で、$Z = 0$ です。`], [`It is proportional to $[1 : ${m} : 0]$: the point at infinity in the direction of slope $${m}$. So $s = ${m}$, the common slope.`, `これは $[1 : ${m} : 0]$ に比例します。傾き $${m}$ の方向の無限遠点です。したがって $s = ${m}$、共通の傾きです。`]],
          set: { rel: 0 },
        };
      }
      const x1 = r.int(-4, 3), y1 = r.int(-4, 4);
      let x2; do { x2 = r.int(-4, 4); } while (x2 === x1);
      const y2 = r.int(-4, 4), l = cross([x1, y1, 1], [x2, y2, 1]), at = cross(l, [0, 0, 1]);
      return {
        q: [`The line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$ meets the line at infinity $Z = 0$ at the point $[1 : s : 0]$. Find $s$.`, `$(${x1}, ${y1})$ と $(${x2}, ${y2})$ を通る直線は、無限遠直線 $Z = 0$ と点 $[1 : s : 0]$ で交わります。$s$ を求めてください。`],
        a: { type: 'num', v: (y2 - y1) / (x2 - x1), tol: 1e-6, show: frac(y2 - y1, x2 - x1) },
        hint: ['Join the two points by a cross product, then cross the result with the line at infinity $(0, 0, 1)$.', '二点を外積で結び、その結果と無限遠直線 $(0, 0, 1)$ の外積をとります。'],
        sol: [[`The line is $(${x1}, ${y1}, 1) \\times (${x2}, ${y2}, 1) = ${tri(l)}$.`, `直線は $(${x1}, ${y1}, 1) \\times (${x2}, ${y2}, 1) = ${tri(l)}$ です。`], [`Crossing with $(0, 0, 1)$ gives $${tri(at)}$, which is $[1 : ${frac(y2 - y1, x2 - x1)} : 0]$. So $s$ is the slope $\\dfrac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1 < 0 ? `(${x1})` : x1}}$: the point at infinity records the line's direction.`, `$(0, 0, 1)$ との外積は $${tri(at)}$、すなわち $[1 : ${frac(y2 - y1, x2 - x1)} : 0]$ です。したがって $s$ は傾き $\\dfrac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1 < 0 ? `(${x1})` : x1}}$ で、無限遠点は直線の方向を記録しています。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(-3, 3), p = r.int(-3, 3);
        let q; do { q = r.int(-4, 4); } while (q === p);
        const kk = k === 0 ? 't' : k > 0 ? `t - ${k}` : `t + ${-k}`, eqT = `y = tx${p === 0 ? '' : ` ${sgn(p)} ${Math.abs(p)}`}`;
        return {
          q: [`The lines $${eqT}$ and $${lineEq(k, q)}$ meet at a point whose $x$-coordinate depends on the slope $t$. Write $x$ as a function of $t$.`, `直線 $${eqT}$ と $${lineEq(k, q)}$ の交点の $x$ 座標は、傾き $t$ に依存します。$x$ を $t$ の関数として表してください。`],
          a: { type: 'expr', v: `${q - p}/(${kk})`, vars: ['t'], dom: { t: [k + 1, k + 5] }, lhs: ['$x =$', '$x =$'] },
          hint: ['Set the two right-hand sides equal and solve for $x$. Then ask what happens as $t$ approaches the slope of the other line.', '右辺どうしを等しいとおいて $x$ について解きます。そのうえで、$t$ がもう一方の直線の傾きに近づくとどうなるかを考えます。'],
          sol: [[`Setting $tx + ${p} = ${k}x + ${q}$ gives $(${kk})\\,x = ${q - p}$, so $x = \\dfrac{${q - p}}{${kk}}$.`, `$tx + ${p} = ${k}x + ${q}$ とおくと $(${kk})\\,x = ${q - p}$ で、$x = \\dfrac{${q - p}}{${kk}}$ です。`], [`As $t \\to ${k}$ the lines become parallel and $x \\to \\pm\\infty$: the meeting point runs off along the line and arrives at the point at infinity $[1 : ${k} : 0]$, from the other side. In homogeneous coordinates nothing breaks.`, `$t \\to ${k}$ で二直線は平行になり、$x \\to \\pm\\infty$ です。交点は直線に沿って走り去り、反対側から無限遠点 $[1 : ${k} : 0]$ に到達します。斉次座標では何も壊れません。`]],
        };
      }
      if (form === 1) {
        const a1 = r.int(1, 5), b1 = r.pick([-3, -2, -1, 1, 2, 3]), a2 = r.int(1, 5) + 6, b2 = r.pick([-3, -2, -1, 1, 2, 3]);
        return {
          q: [`Which line of the projective plane contains both points at infinity $[${a1} : ${b1} : 0]$ and $[${a2} : ${b2} : 0]$?`, `射影平面のどの直線が、無限遠点 $[${a1} : ${b1} : 0]$ と $[${a2} : ${b2} : 0]$ の両方を含みますか。`],
          a: { type: 'choice', v: 0, opts: [['The line at infinity, $Z = 0$', '無限遠直線 $Z = 0$'], [`The line $y = ${frac(b1, a1)}x$ through the origin`, `原点を通る直線 $y = ${frac(b1, a1)}x$`], ['There is none: the two directions are different, so the points are not joined', 'ない：二つの方向は異なるので、二点は結べない'], ['The line through $O$ and the chart point $(1, 1)$', '$O$ とチャートの点 $(1, 1)$ を通る直線']] },
          hint: ['Two points always determine a line. Cross them.', '二点は必ず一本の直線を定めます。外積をとってみましょう。'],
          sol: [[`$(${a1}, ${b1}, 0) \\times (${a2}, ${b2}, 0) = ${tri(cross([a1, b1, 0], [a2, b2, 0]))}$, which is proportional to $(0, 0, 1)$.`, `$(${a1}, ${b1}, 0) \\times (${a2}, ${b2}, 0) = ${tri(cross([a1, b1, 0], [a2, b2, 0]))}$ で、$(0, 0, 1)$ に比例します。`], ['That is the line $Z = 0$: every point at infinity lies on it. The points at infinity form a line, as the horizon does in a drawing.', 'これは直線 $Z = 0$ で、すべての無限遠点がその上にあります。無限遠点は、絵の中の地平線のように一本の直線をなします。']],
        };
      }
      const x1 = r.int(-3, 1), x2 = x1 + r.int(1, 3), x3 = x2 + r.int(1, 3), y1 = r.int(-3, 3), s = r.int(-3, 3), y2 = y1 + s * (x2 - x1), k = y1 + s * (x3 - x1);
      const det = [[x1, y1, 1], [x2, y2, 1], [x3, k, 1]];
      return {
        q: [`The points $[${x1} : ${y1} : 1]$, $[${x2} : ${y2} : 1]$ and $[${x3} : k : 1]$ lie on one line of the projective plane. Find $k$.`, `点 $[${x1} : ${y1} : 1]$、$[${x2} : ${y2} : 1]$、$[${x3} : k : 1]$ は射影平面の一本の直線上にあります。$k$ を求めてください。`],
        a: { type: 'num', v: k, tol: 1e-6 },
        hint: ['Three points are collinear exactly when the determinant of their homogeneous coordinates vanishes, i.e. when the third lies on the line joining the first two.', '三点が共線であることは、斉次座標の行列式が $0$ になること、つまり三点目が最初の二点を結ぶ直線上にあることと同値です。'],
        sol: [[`The line through the first two points has slope $\\dfrac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1 < 0 ? `(${x1})` : x1}} = ${s}$.`, `最初の二点を通る直線の傾きは $\\dfrac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1 < 0 ? `(${x1})` : x1}} = ${s}$ です。`], [`At $x = ${x3}$ it has $y = ${y1} + ${s}(${x3} - ${x1 < 0 ? `(${x1})` : x1}) = ${k}$, and then the determinant of the three rows $${det.map((row) => tri(row)).join(', ')}$ is $0$. So $k = ${k}$.`, `$x = ${x3}$ では $y = ${y1} + ${s}(${x3} - ${x1 < 0 ? `(${x1})` : x1}) = ${k}$ で、三つの行 $${det.map((row) => tri(row)).join(', ')}$ の行列式は $0$ になります。したがって $k = ${k}$ です。`]],
      };
    },
  ];

  /* ---------------- 2. cross-ratio ---------------- */
  const nm = (a, b, c, d) => crQ(a, b, c, d);
  Q['cross-ratio'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b, c, d] = dist4(r, -4, 8), [num, den] = nm(a, b, c, d);
        return {
          q: [`Four points $A, B, C, D$ lie on a line at positions $${a}, ${b}, ${c}, ${d}$. Compute the cross-ratio $(A,B;C,D) = \\dfrac{AC \\cdot BD}{BC \\cdot AD}$ (signed lengths, e.g. $AC = c - a$).`, `直線上の四点 $A, B, C, D$ が位置 $${a}, ${b}, ${c}, ${d}$ にあります。複比 $(A,B;C,D) = \\dfrac{AC \\cdot BD}{BC \\cdot AD}$ を計算してください（符号つきの長さで、たとえば $AC = c - a$）。`],
          a: { type: 'num', v: num / den, tol: 1e-6, show: frac(num, den, true) },
          hint: ['Write the four signed differences first: $c - a$, $d - b$, $c - b$, $d - a$.', 'まず四つの符号つきの差 $c - a$、$d - b$、$c - b$、$d - a$ を書きます。'],
          sol: [[`$AC = ${c - a}$, $BD = ${d - b}$, $BC = ${c - b}$, $AD = ${d - a}$.`, `$AC = ${c - a}$、$BD = ${d - b}$、$BC = ${c - b}$、$AD = ${d - a}$ です。`], [`$(A,B;C,D) = \\dfrac{${c - a} \\cdot ${d - b < 0 ? `(${d - b})` : d - b}}{${c - b < 0 ? `(${c - b})` : c - b} \\cdot ${d - a < 0 ? `(${d - a})` : d - a}} = ${frac(num, den, true)}$.`, `$(A,B;C,D) = \\dfrac{${c - a} \\cdot ${d - b < 0 ? `(${d - b})` : d - b}}{${c - b < 0 ? `(${c - b})` : c - b} \\cdot ${d - a < 0 ? `(${d - a})` : d - a}} = ${frac(num, den, true)}$ です。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['Which of these is the same for four points on a line and for their images under any projection from a point onto another line?', '直線上の四点と、ある点から別の直線への任意の投影によるその像とで、同じ値になるのは次のうちどれですか。'],
          a: { type: 'choice', v: 0, opts: [['The cross-ratio $(A,B;C,D)$', '複比 $(A,B;C,D)$'], ['The length $AB$', '長さ $AB$'], ['The ratio $AC/BC$', '比 $AC/BC$'], ['Whether $C$ is the midpoint of $AB$', '$C$ が $AB$ の中点かどうか']] },
          hint: ['Move the screen in the experiment and watch which readout stays still.', '実験でスクリーンを動かして、どの読み出しが動かないかを見ます。'],
          sol: [['Lengths change, and so does the single ratio $AC/BC$: midpoints are not preserved, because a projection foreshortens the far side.', '長さは変わり、単比 $AC/BC$ も変わります。投影は奥側を縮めるので、中点も保たれません。'], ['Only the ratio of two such ratios, the cross-ratio, survives. It is read from the sines of the angles at the centre of projection.', '残るのはそのような二つの比の比、複比だけです。これは投影の中心での角の正弦から読み取れます。']],
        };
      }
      const [a, b, c, d] = dist4(r, -3, 7), [num, den] = nm(a, b, c, d), lam = num / den;
      return {
        q: [`Four points on a line have cross-ratio $(A,B;C,D) = ${frac(num, den)}$. A lamp projects them onto a screen, and one image happens to land at infinity. What is the cross-ratio of the four image points?`, `直線上の四点の複比が $(A,B;C,D) = ${frac(num, den)}$ です。ランプがそれらをスクリーンに投影し、像の一つがたまたま無限遠に落ちました。四つの像の複比はいくつですか。`],
        a: { type: 'num', v: lam, tol: 1e-6, show: frac(num, den, true) },
        hint: ['The cross-ratio is a projective invariant. It does not care that one point went to infinity.', '複比は射影不変量です。一点が無限遠に行っても関係ありません。'],
        sol: [['Projection preserves the cross-ratio, including when one image goes to infinity: the lengths involving that point cancel in the ratio.', '投影は、像が一つ無限遠に行く場合も含めて複比を保ちます。その点に関わる長さは比の中で打ち消し合います。'], [`So the images have the same cross-ratio, $${frac(num, den, true)}$.`, `したがって像の複比も同じ $${frac(num, den, true)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const [a, b, c, d] = dist4(r, -4, 8), [num, den] = nm(a, b, c, d);
        const dd = (c - a) * b - (num / den) * (c - b) * a, ee = (c - a) - (num / den) * (c - b);
        return {
          q: [`Points $A, B, C$ are at $${a}, ${b}, ${c}$ and $(A,B;C,D) = ${frac(num, den)}$. Find the position of $D$.`, `点 $A, B, C$ が $${a}, ${b}, ${c}$ にあり、$(A,B;C,D) = ${frac(num, den)}$ です。$D$ の位置を求めてください。`],
          a: { type: 'num', v: dd / ee, tol: 1e-6 },
          hint: ['Write the cross-ratio as an equation in $d$ and solve the linear equation.', '複比を $d$ の方程式として書き、一次方程式を解きます。'],
          sol: [[`$\\dfrac{(${c} - ${a < 0 ? `(${a})` : a})(d - ${b < 0 ? `(${b})` : b})}{(${c} - ${b < 0 ? `(${b})` : b})(d - ${a < 0 ? `(${a})` : a})} = ${frac(num, den)}$, a linear equation in $d$ after clearing denominators.`, `$\\dfrac{(${c} - ${a < 0 ? `(${a})` : a})(d - ${b < 0 ? `(${b})` : b})}{(${c} - ${b < 0 ? `(${b})` : b})(d - ${a < 0 ? `(${a})` : a})} = ${frac(num, den)}$ で、分母を払うと $d$ の一次方程式です。`], [`Solving gives $d = ${d}$.`, `解くと $d = ${d}$ です。`]],
        };
      }
      if (form === 1) {
        let a, b, c;
        do { [a, b, c] = r.sample([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 3); } while (2 * c === a + b);
        const d = ((c - a) * b + (c - b) * a) / (2 * c - a - b), nu = (c - a) * b + (c - b) * a, de = 2 * c - a - b;
        return {
          q: [`$A$, $B$, $C$ are at $${a}, ${b}, ${c}$. Where must $D$ be so that $(A,B;C,D) = -1$ (harmonic position)?`, `$A$、$B$、$C$ が $${a}, ${b}, ${c}$ にあります。$(A,B;C,D) = -1$（調和位置）となるには $D$ をどこに置けばよいですか。`],
          a: { type: 'num', v: d, tol: 1e-6, show: frac(nu, de, true) },
          hint: ['Set $\\dfrac{(c-a)(d-b)}{(c-b)(d-a)} = -1$ and solve for $d$.', '$\\dfrac{(c-a)(d-b)}{(c-b)(d-a)} = -1$ とおいて $d$ を解きます。'],
          sol: [[`$(c-a)(d-b) = -(c-b)(d-a)$ gives $d\\,[(c-a) + (c-b)] = (c-a)b + (c-b)a$.`, `$(c-a)(d-b) = -(c-b)(d-a)$ より $d\\,[(c-a) + (c-b)] = (c-a)b + (c-b)a$ です。`], [`So $d = \\dfrac{${nu}}{${de}} = ${frac(nu, de, true)}$. This $D$ is the harmonic conjugate of $C$, and it stays harmonic on every screen.`, `したがって $d = \\dfrac{${nu}}{${de}} = ${frac(nu, de, true)}$ です。この $D$ は $C$ の調和共役で、どのスクリーンでも調和なままです。`]],
          set: { mode: 1 },
        };
      }
      if (form === 2) {
        const [a, b, c, d] = dist4(r, -3, 7), [num, den] = nm(a, b, c, d), lam = num / den;
        const pick = r.int(0, 2);
        const T3 = [['(B,A;C,D)', '1/\\lambda', 1 / lam, crV(b, a, c, d), 'swapping $A$ and $B$ inverts it', '$A$ と $B$ を入れ替えると逆数になる'], ['(A,C;B,D)', '1-\\lambda', 1 - lam, crV(a, c, b, d), 'swapping $B$ and $C$ sends it to $1-\\lambda$', '$B$ と $C$ を入れ替えると $1-\\lambda$ になる'], ['(A,B;D,C)', '1/\\lambda', 1 / lam, crV(a, b, d, c), 'swapping $C$ and $D$ inverts it', '$C$ と $D$ を入れ替えると逆数になる']][pick];
        return {
          q: [`Four collinear points have $(A,B;C,D) = ${frac(num, den)}$. What is $${T3[0]}$?`, `共線な四点について $(A,B;C,D) = ${frac(num, den)}$ です。$${T3[0]}$ はいくつですか。`],
          a: { type: 'num', v: T3[3], tol: 1e-6, show: frac(...(pick === 1 ? [den - num, den] : [den, num]), true) },
          hint: ['Permuting the points moves the value among six numbers built from $\\lambda$: $\\lambda, 1/\\lambda, 1-\\lambda, \\dots$', '点を入れ替えると、値は $\\lambda$ から作られる六つの数 $\\lambda, 1/\\lambda, 1-\\lambda, \\dots$ のあいだを動きます。'],
          sol: [[`Here ${T3[4]}: $${T3[0]} = ${T3[1]}$.`, `ここでは${T3[5]}ので、$${T3[0]} = ${T3[1]}$ です。`], [`With $\\lambda = ${frac(num, den)}$ this is $${n(T3[3], 4)}$.`, `$\\lambda = ${frac(num, den)}$ なので、値は $${n(T3[3], 4)}$ です。`]],
        };
      }
      const [a, b, c] = r.sample([-3, -2, -1, 0, 1, 2, 3, 4, 5], 3);
      return {
        q: [`$A$, $B$, $C$ are at $${a}, ${b}, ${c}$ and $D$ is the point at infinity. Compute $(A,B;C,D)$.`, `$A$、$B$、$C$ が $${a}, ${b}, ${c}$ にあり、$D$ は無限遠点です。$(A,B;C,D)$ を計算してください。`],
        a: { type: 'num', v: (c - a) / (c - b), tol: 1e-6, show: frac(c - a, c - b, true) },
        hint: ['Let $d \\to \\infty$: the factors $d - b$ and $d - a$ cancel.', '$d \\to \\infty$ とすると、因子 $d - b$ と $d - a$ は打ち消し合います。'],
        sol: [['As $d \\to \\infty$, $\\dfrac{d - b}{d - a} \\to 1$, so $(A,B;C,\\infty) = \\dfrac{AC}{BC}$.', '$d \\to \\infty$ で $\\dfrac{d - b}{d - a} \\to 1$ なので、$(A,B;C,\\infty) = \\dfrac{AC}{BC}$ です。'], [`$= \\dfrac{${c - a}}{${c - b}} = ${frac(c - a, c - b, true)}$.`, `$= \\dfrac{${c - a}}{${c - b}} = ${frac(c - a, c - b, true)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const T5 = [['0,\\ 1,\\ x,\\ \\infty', 'x/(x-1)', 'x/(x-1)', 'With $d \\to \\infty$ the formula reduces to $\\dfrac{c-a}{c-b} = \\dfrac{x-0}{x-1}$.', '$d \\to \\infty$ で式は $\\dfrac{c-a}{c-b} = \\dfrac{x-0}{x-1}$ になります。'], ['0,\\ 1,\\ \\infty,\\ x', '(x-1)/x', '(x-1)/x', 'With $c \\to \\infty$ it reduces to $\\dfrac{d-b}{d-a} = \\dfrac{x-1}{x-0}$.', '$c \\to \\infty$ で式は $\\dfrac{d-b}{d-a} = \\dfrac{x-1}{x-0}$ になります。'], ['\\infty,\\ 0,\\ 1,\\ x', 'x', 'x', 'With $a \\to \\infty$ it reduces to $\\dfrac{d-b}{c-b} = \\dfrac{x-0}{1-0}$.', '$a \\to \\infty$ で式は $\\dfrac{d-b}{c-b} = \\dfrac{x-0}{1-0}$ になります。'], ['0,\\ x,\\ 1,\\ \\infty', '1/(1-x)', '1/(1-x)', 'With $d \\to \\infty$ it reduces to $\\dfrac{c-a}{c-b} = \\dfrac{1-0}{1-x}$.', '$d \\to \\infty$ で式は $\\dfrac{c-a}{c-b} = \\dfrac{1-0}{1-x}$ になります。'], ['x,\\ 0,\\ 1,\\ \\infty', '1-x', '1-x', 'With $d \\to \\infty$ it reduces to $\\dfrac{c-a}{c-b} = \\dfrac{1-x}{1-0}$.', '$d \\to \\infty$ で式は $\\dfrac{c-a}{c-b} = \\dfrac{1-x}{1-0}$ になります。']];
        const t = r.pick(T5);
        return {
          q: [`Four points $A, B, C, D$ lie at $${t[0]}$ (one of them is the point at infinity). Write $(A,B;C,D)$ as a function of $x$.`, `四点 $A, B, C, D$ が $${t[0]}$ にあります（一つは無限遠点です）。$(A,B;C,D)$ を $x$ の関数で表してください。`],
          a: { type: 'expr', v: t[1], vars: ['x'], dom: { x: [2, 5] }, lhs: ['$(A,B;C,D) =$', '$(A,B;C,D) =$'] },
          hint: ['Take the limit in the cross-ratio formula where the point goes to infinity: the two factors involving it cancel.', '無限遠に行く点について複比の式の極限をとると、その点に関わる二つの因子が打ち消し合います。'],
          sol: [[t[3], t[4]], ['Replacing a point by $\\infty$ is legitimate because the cross-ratio is defined on the projective line, where $\\infty$ is a point like any other.', '点を $\\infty$ に置き換えてよいのは、複比が射影直線の上で定義されていて、そこでは $\\infty$ も他と同じ点だからです。']],
        };
      }
      if (form === 1) {
        const lam = r.pick([-1, 2, 3, -2, 4, 5, 3 / 2, -3]), fr = lam === 3 / 2 ? [3, 2] : [lam, 1];
        return {
          q: [`$(A,B;C,D) = ${frac(...fr)}$. A projection sends $D$ to infinity. In the image, what is the signed ratio $\\overline{A'C'}\\,/\\,\\overline{C'B'}$?`, `$(A,B;C,D) = ${frac(...fr)}$ です。投影で $D$ が無限遠に移ります。像における符号つきの比 $\\overline{A'C'}\\,/\\,\\overline{C'B'}$ はいくつですか。`],
          a: { type: 'num', v: -lam, tol: 1e-6, show: frac(-fr[0], fr[1], true) },
          hint: ['With $D$ at infinity, $(A,B;C,D)$ reduces to $\\overline{AC}/\\overline{BC}$. Then $\\overline{CB} = -\\overline{BC}$.', '$D$ が無限遠にあると $(A,B;C,D)$ は $\\overline{AC}/\\overline{BC}$ になります。$\\overline{CB} = -\\overline{BC}$ に注意します。'],
          sol: [[`The cross-ratio is preserved, so $\\overline{A'C'}/\\overline{B'C'} = ${frac(...fr)}$.`, `複比は保たれるので $\\overline{A'C'}/\\overline{B'C'} = ${frac(...fr)}$ です。`], [`Hence $\\overline{A'C'}/\\overline{C'B'} = ${frac(-fr[0], fr[1], true)}$.${lam === -1 ? ' With $\\lambda = -1$ this is $1$: $C\'$ is the midpoint of $A\'B\'$, the harmonic case.' : ''}`, `したがって $\\overline{A'C'}/\\overline{C'B'} = ${frac(-fr[0], fr[1], true)}$ です。${lam === -1 ? '$\\lambda = -1$ なら値は $1$ で、$C\'$ は $A\'B\'$ の中点、つまり調和の場合です。' : ''}`]],
          set: lam === -1 ? { mode: 1 } : undefined,
        };
      }
      const [a, b, c, d] = dist4(r, -3, 6);
      let a2, b2, c2;
      let nu, de, Dn, N, den2, num2, ok = false, tries = 0;
      do {
        [a2, b2, c2] = r.sample([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 3);
        [N, Dn] = nm(a, b, c, d);
        num2 = (c2 - a2) * b2 * Dn - N * (c2 - b2) * a2; den2 = (c2 - a2) * Dn - N * (c2 - b2);
        ok = den2 !== 0; tries++;
      } while (!ok && tries < 50);
      const dp = num2 / den2;
      return {
        q: [`A projection sends $A, B, C$ at $${a}, ${b}, ${c}$ to $A', B', C'$ at $${a2}, ${b2}, ${c2}$ on another line. It sends $D$ at $${d}$ to $D'$. Find the position of $D'$.`, `ある投影が、$A, B, C$（位置 $${a}, ${b}, ${c}$）を別の直線上の $A', B', C'$（位置 $${a2}, ${b2}, ${c2}$）に移します。位置 $${d}$ の $D$ は $D'$ に移ります。$D'$ の位置を求めてください。`],
        a: { type: 'num', v: dp, tol: 1e-5, show: frac(num2, den2, true) },
        hint: ['Three points fix a projection of a line; the fourth follows because the cross-ratio is preserved. Compute $(A,B;C,D)$, then solve $(A^{\\prime},B^{\\prime};C^{\\prime},D^{\\prime}) =$ that value.', '三点で直線の射影は決まり、四点目は複比が保たれることから決まります。まず $(A,B;C,D)$ を計算し、次に $(A^{\\prime},B^{\\prime};C^{\\prime},D^{\\prime})$ がその値に等しくなるよう解きます。'],
        sol: [[`$(A,B;C,D) = ${frac(N, Dn)}$.`, `$(A,B;C,D) = ${frac(N, Dn)}$ です。`], [`Solving $(A',B';C',D') = ${frac(N, Dn)}$ for $d'$ with $a' = ${a2}$, $b' = ${b2}$, $c' = ${c2}$ gives $d' = ${frac(num2, den2, true)} \\approx ${n(dp, 4)}$.`, `$a' = ${a2}$、$b' = ${b2}$、$c' = ${c2}$ として $(A',B';C',D') = ${frac(N, Dn)}$ を $d'$ について解くと $d' = ${frac(num2, den2, true)} \\approx ${n(dp, 4)}$ です。`]],
      };
    },
  ];

  /* ---------------- 3. conics and Pascal ---------------- */
  const eOf = (t) => Math.SQRT2 * Math.sin(rad(t));
  const KIND_OPTS = [['Circle', '円'], ['Ellipse (not a circle)', '楕円（円ではない）'], ['Parabola', '放物線'], ['Hyperbola', '双曲線']];
  const kindOf = (t) => (t === 0 ? 0 : t < 45 ? 1 : t === 45 ? 2 : 3);
  const KN = [['circle', '円'], ['ellipse', '楕円'], ['parabola', '放物線'], ['hyperbola', '双曲線']];
  Q['conic-pascal'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick([10, 15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70]);
        return {
          q: [`A plane tilted by $\\tau = ${t}^\\circ$ from the horizontal cuts a cone of half-angle $45^\\circ$. What is the eccentricity $e = \\sqrt2\\,\\sin\\tau$ of the section?`, `水平から $\\tau = ${t}^\\circ$ 傾いた平面が、半頂角 $45^\\circ$ の円錐を切ります。切り口の離心率 $e = \\sqrt2\\,\\sin\\tau$ はいくつですか。`],
          a: { type: 'num', v: eOf(t), tol: 0.005, show: `\\sqrt2\\sin ${t}^\\circ` },
          hint: ['Just evaluate $\\sqrt2 \\sin\\tau$.', '$\\sqrt2 \\sin\\tau$ を計算するだけです。'],
          sol: [[`$e = \\sqrt2\\,\\sin ${t}^\\circ = ${n(eOf(t), 4)}$.`, `$e = \\sqrt2\\,\\sin ${t}^\\circ = ${n(eOf(t), 4)}$ です。`], [`${eOf(t) < 1 ? '$e < 1$: an ellipse.' : '$e > 1$: a hyperbola.'}`, `${eOf(t) < 1 ? '$e < 1$ なので楕円です。' : '$e > 1$ なので双曲線です。'}`]],
          set: { tilt: t },
        };
      }
      const t = r.pick([0, 10, 20, 30, 40, 45, 50, 60, 70]);
      if (form === 1) {
        return {
          q: [`The cutting plane is tilted by $${t}^\\circ$ from the horizontal; the cone has half-angle $45^\\circ$ and the plane misses the apex. What is the section?`, `切断面は水平から $${t}^\\circ$ 傾いていて、円錐の半頂角は $45^\\circ$、平面は頂点を通りません。切り口は何ですか。`],
          a: { type: 'choice', fixed: true, v: kindOf(t), opts: KIND_OPTS },
          hint: ['Compare the tilt with $45^\\circ$, the angle of the cone’s generators: a horizontal plane gives a circle, and the plane is parallel to a generator exactly when the tilt equals $45^\\circ$.', '傾きを円錐の母線の角 $45^\\circ$ と比べます。水平なら円で、平面が母線と平行になるのは傾きがちょうど $45^\\circ$ のときです。'],
          sol: [[`The plane is parallel to a generator of the cone exactly when $\\tau = 45^\\circ$ (the generators make $45^\\circ$ with the axis).`, `平面が円錐の母線と平行になるのはちょうど $\\tau = 45^\\circ$ のときです（母線は軸と $45^\\circ$ をなします）。`], [`Here $\\tau = ${t}^\\circ$: ${t === 0 ? 'the plane is horizontal, so a circle' : t < 45 ? 'below $45^\\circ$ the plane cuts every generator on one nappe, so an ellipse' : t === 45 ? 'exactly the parallel case, so a parabola' : 'above $45^\\circ$ it cuts both nappes, so a hyperbola'}.`, `ここでは $\\tau = ${t}^\\circ$ で、${t === 0 ? '平面は水平なので円です' : t < 45 ? '$45^\\circ$ より小さいと片側の円錐面のすべての母線と交わるので楕円です' : t === 45 ? 'ちょうど平行の場合なので放物線です' : '$45^\\circ$ より大きいと円錐面の両側と交わるので双曲線です'}。`]],
          set: { tilt: t },
        };
      }
      const k = t < 45 ? 0 : t === 45 ? 1 : 2;
      return {
        q: [`With the plane tilted by $${t}^\\circ$ from the horizontal (cone half-angle $45^\\circ$), how many points of the section lie at infinity?`, `平面を水平から $${t}^\\circ$ 傾けたとき（円錐の半頂角は $45^\\circ$）、切り口の何個の点が無限遠にありますか。`],
        a: { type: 'int', v: k },
        hint: ['A point of the section is at infinity when the ray from the apex is parallel to the plane. Count the generators parallel to the plane.', '頂点からの光線が平面と平行になるとき、その点は無限遠にあります。平面と平行な母線の数を数えます。'],
        sol: [[`The generators make $45^\\circ$ with the axis. A generator is parallel to the plane when the plane’s tilt reaches it: none below $45^\\circ$, one at exactly $45^\\circ$, two above.`, `母線は軸と $45^\\circ$ をなします。平面と平行な母線は、傾きが $45^\\circ$ 未満なら $0$ 本、ちょうど $45^\\circ$ なら $1$ 本、それより大きければ $2$ 本です。`], [`So ${k} point${k === 1 ? '' : 's'} at infinity: ${KN[kindOf(t)][0]}.`, `したがって無限遠点は ${k} 個で、${KN[kindOf(t)][1]}です。`]],
        set: { tilt: t },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const t = r.pick([8, 12, 17, 22, 28, 33, 38, 41, 52, 58, 63, 68]), e = Math.round(eOf(t) * 1000) / 1000;
        return {
          q: [`The section of a $45^\\circ$ cone has eccentricity $e = ${n(e, 3)}$. Find the tilt $\\tau$ of the plane from the horizontal, in degrees (between $0$ and $90$).`, `半頂角 $45^\\circ$ の円錐の切り口の離心率が $e = ${n(e, 3)}$ です。平面の水平からの傾き $\\tau$ を度で求めてください（$0$ から $90$ の間）。`],
          a: { type: 'num', v: t, tol: 0.6, unit: ['°', '°'] },
          hint: ['Invert $e = \\sqrt2\\sin\\tau$.', '$e = \\sqrt2\\sin\\tau$ を逆に解きます。'],
          sol: [[`$\\sin\\tau = e/\\sqrt2 = ${n(e / Math.SQRT2, 4)}$.`, `$\\sin\\tau = e/\\sqrt2 = ${n(e / Math.SQRT2, 4)}$ です。`], [`$\\tau = ${n(Math.asin(e / Math.SQRT2) * 180 / PI, 2)}^\\circ$, so about $${t}^\\circ$. ${e < 1 ? 'It is below $45^\\circ$ since $e < 1$.' : 'It is above $45^\\circ$ since $e > 1$.'}`, `$\\tau = ${n(Math.asin(e / Math.SQRT2) * 180 / PI, 2)}^\\circ$、約 $${t}^\\circ$ です。${e < 1 ? '$e < 1$ なので $45^\\circ$ より小さくなります。' : '$e > 1$ なので $45^\\circ$ より大きくなります。'}`]],
          set: { tilt: t },
        };
      }
      if (form === 1) {
        const t = r.pick([5, 10, 15, 20, 25, 30, 35, 40]), a = 1 / Math.cos(rad(2 * t)), b = 1 / Math.sqrt(Math.cos(rad(2 * t)));
        return {
          q: [`For a plane at distance $1$ from the apex of the $45^\\circ$ cone, tilted by $\\tau = ${t}^\\circ$, the section is an ellipse with semi-axes $a = 1/\\cos2\\tau$ and $b = 1/\\sqrt{\\cos2\\tau}$. Find $a$ and $b$.`, `半頂角 $45^\\circ$ の円錐の頂点から距離 $1$ にある、$\\tau = ${t}^\\circ$ 傾いた平面の切り口は、半軸が $a = 1/\\cos2\\tau$、$b = 1/\\sqrt{\\cos2\\tau}$ の楕円です。$a$ と $b$ を求めてください。`],
          a: { type: 'tuple', v: [a, b], labels: ['$a$', '$b$'], tol: 0.01 },
          hint: ['Evaluate at $2\\tau$: the double angle enters because the cone’s half-angle is $45^\\circ$.', '$2\\tau$ で計算します。円錐の半頂角が $45^\\circ$ なので倍角が現れます。'],
          sol: [[`$\\cos ${2 * t}^\\circ = ${n(Math.cos(rad(2 * t)), 4)}$.`, `$\\cos ${2 * t}^\\circ = ${n(Math.cos(rad(2 * t)), 4)}$ です。`], [`$a = 1/${n(Math.cos(rad(2 * t)), 4)} = ${n(a, 3)}$ and $b = 1/\\sqrt{${n(Math.cos(rad(2 * t)), 4)}} = ${n(b, 3)}$. Check: $\\sqrt{1 - b^2/a^2} = ${n(Math.sqrt(1 - b * b / (a * a)), 3)} = e$.`, `$a = 1/${n(Math.cos(rad(2 * t)), 4)} = ${n(a, 3)}$、$b = 1/\\sqrt{${n(Math.cos(rad(2 * t)), 4)}} = ${n(b, 3)}$ です。確認：$\\sqrt{1 - b^2/a^2} = ${n(Math.sqrt(1 - b * b / (a * a)), 3)} = e$。`]],
          set: { tilt: t },
        };
      }
      if (form === 2) {
        const phi = r.pick([25, 30, 35, 40, 50, 55, 60, 70, 75, 80]), e = Math.SQRT2 * Math.cos(rad(phi));
        return {
          q: [`A plane makes an angle of $${phi}^\\circ$ with the axis of a $45^\\circ$ cone. Using $e = \\cos\\varphi / \\cos45^\\circ$, find the eccentricity of the section.`, `平面が半頂角 $45^\\circ$ の円錐の軸と $${phi}^\\circ$ の角をなします。$e = \\cos\\varphi / \\cos45^\\circ$ を使って切り口の離心率を求めてください。`],
          a: { type: 'num', v: e, tol: 0.005, show: `\\sqrt2\\cos ${phi}^\\circ` },
          hint: ['Here $\\varphi$ is the angle between the plane and the axis, so $\\varphi = 90^\\circ - \\tau$.', 'ここで $\\varphi$ は平面と軸のなす角で、$\\varphi = 90^\\circ - \\tau$ です。'],
          sol: [[`$e = \\cos ${phi}^\\circ / \\cos 45^\\circ = \\sqrt2\\cos ${phi}^\\circ = ${n(e, 4)}$.`, `$e = \\cos ${phi}^\\circ / \\cos 45^\\circ = \\sqrt2\\cos ${phi}^\\circ = ${n(e, 4)}$ です。`], [`${e < 1 ? 'The plane is steeper than the cone’s side ($\\varphi > 45^\\circ$), so $e < 1$: an ellipse.' : 'The plane is flatter than the cone’s side ($\\varphi < 45^\\circ$), so $e > 1$: a hyperbola.'}`, `${e < 1 ? '平面は円錐の側面より立っている（$\\varphi > 45^\\circ$）ので $e < 1$ で、楕円です。' : '平面は円錐の側面より寝ている（$\\varphi < 45^\\circ$）ので $e > 1$ で、双曲線です。'}`]],
          set: { tilt: 90 - phi },
        };
      }
      const t = r.pick([10, 15, 20, 25, 30, 35]), c = -Math.tan(rad(2 * t));
      return {
        q: [`The ellipse cut at tilt $\\tau = ${t}^\\circ$ is $\\cos2\\tau\\,u^2 + v^2 + 2\\sin2\\tau\\,u - \\cos2\\tau = 0$ in the plane’s own coordinates $(u, v)$. At what $u$ is its centre?`, `傾き $\\tau = ${t}^\\circ$ で切った楕円は、平面上の座標 $(u, v)$ で $\\cos2\\tau\\,u^2 + v^2 + 2\\sin2\\tau\\,u - \\cos2\\tau = 0$ です。その中心の $u$ はいくつですか。`],
        a: { type: 'num', v: c, tol: 0.01, show: `-\\tan ${2 * t}^\\circ` },
        hint: ['Complete the square in $u$.', '$u$ について平方完成します。'],
        sol: [[`$\\cos2\\tau\\,(u + \\tan2\\tau)^2 + v^2 = \\dfrac{1}{\\cos2\\tau}$ after completing the square.`, `平方完成すると $\\cos2\\tau\\,(u + \\tan2\\tau)^2 + v^2 = \\dfrac{1}{\\cos2\\tau}$ です。`], [`The centre is at $u = -\\tan 2\\tau = -\\tan ${2 * t}^\\circ = ${n(c, 4)}$.`, `中心は $u = -\\tan 2\\tau = -\\tan ${2 * t}^\\circ = ${n(c, 4)}$ です。`]],
        set: { tilt: t },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        // Pascal numerically on the unit circle: where do sides 12 and 45 cross?
        let angs, l, m, Q1, tries = 0;
        const pt = (a) => [Math.cos(rad(a)), Math.sin(rad(a)), 1];
        do {
          angs = r.sample([10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340], 6).sort((x, y) => x - y);
          l = cross(pt(angs[0]), pt(angs[1])); m = cross(pt(angs[3]), pt(angs[4])); Q1 = cross(l, m); tries++;
        } while ((Math.abs(Q1[2]) < 0.25 || Math.hypot(Q1[0] / Q1[2], Q1[1] / Q1[2]) > 6) && tries < 200);
        const q = [Q1[0] / Q1[2], Q1[1] / Q1[2]];
        return {
          q: [`Six points sit on the unit circle at angles $${angs.join('^\\circ, ')}^\\circ$ (numbered $1$ to $6$ in that order). The sides $12$ and $45$ of the hexagon, extended, cross at $Q_1$. Find $Q_1 = (x, y)$.`, `単位円周上の六点が角 $${angs.join('^\\circ, ')}^\\circ$ にあります（この順に $1$ から $6$ と番号を付けます）。六角形の辺 $12$ と $45$ を延長すると $Q_1$ で交わります。$Q_1 = (x, y)$ を求めてください。`],
          a: { type: 'tuple', v: q, labels: ['$x$', '$y$'], tol: 0.02 },
          hint: ['Join points $1, 2$ and points $4, 5$ by cross products of $(\\cos\\theta, \\sin\\theta, 1)$, then cross the two lines.', '点 $1, 2$ と点 $4, 5$ を $(\\cos\\theta, \\sin\\theta, 1)$ の外積で結び、得た二直線の外積をとります。'],
          sol: [[`Line $12$: $${tri(l.map((x) => (Math.round(x * 1000) / 1000 + 0)))}$; line $45$: $${tri(m.map((x) => (Math.round(x * 1000) / 1000 + 0)))}$.`, `直線 $12$：$${tri(l.map((x) => (Math.round(x * 1000) / 1000 + 0)))}$、直線 $45$：$${tri(m.map((x) => (Math.round(x * 1000) / 1000 + 0)))}$ です。`], [`Their cross product, divided by its last entry, is $Q_1 = (${n(q[0], 3)}, ${n(q[1], 3)})$. Pascal says $Q_2$ and $Q_3$ lie on one line with it, whatever the other sides do.`, `外積を最後の成分で割ると $Q_1 = (${n(q[0], 3)}, ${n(q[1], 3)})$ です。パスカルの定理は、ほかの辺がどうであれ、$Q_2$ と $Q_3$ がこれと一直線上にあると主張します。`]],
          set: { order: 0 },
        };
      }
      if (form === 1) {
        const s0 = r.pick([0, 15, 30, 45]);
        return {
          q: [`A hexagon is inscribed in a circle with vertices at angles $${s0}^\\circ, ${s0 + 60}^\\circ, ${s0 + 120}^\\circ, \\dots$ (a regular hexagon). Where is its Pascal line?`, `角 $${s0}^\\circ, ${s0 + 60}^\\circ, ${s0 + 120}^\\circ, \\dots$ に頂点をもつ正六角形が円に内接しています。そのパスカル線はどこですか。`],
          a: { type: 'choice', v: 0, opts: [['The line at infinity', '無限遠直線'], ['A diameter of the circle', '円の直径'], ['The tangent at vertex $1$', '頂点 $1$ での接線'], ['There is none: the opposite sides do not cross', 'ない：向かい合う辺は交わらない']] },
          hint: ['Opposite sides of a regular hexagon are parallel. Where do parallel lines meet?', '正六角形の向かい合う辺は平行です。平行線はどこで交わるでしょう。'],
          sol: [['All three pairs of opposite sides are parallel, so all three crossings $Q_1, Q_2, Q_3$ are points at infinity.', '向かい合う三組の辺はすべて平行なので、三つの交点 $Q_1, Q_2, Q_3$ はすべて無限遠点です。'], ['Three points at infinity lie on the line at infinity: Pascal’s theorem holds, and the "Pascal line" is the horizon. Tilting the plane to a conic moves it to a finite line.', '無限遠の三点は無限遠直線の上にあります。パスカルの定理は成り立ち、「パスカル線」は地平線です。平面を傾けて円錐曲線にすると、それは有限の直線に移ります。']],
        };
      }
      if (form === 2) {
        const t = r.pick([46, 48, 50, 53, 56, 60, 64, 67, 70]), e = Math.round(eOf(t) * 1000) / 1000;
        return {
          q: [`A section of a $45^\\circ$ cone is a hyperbola of eccentricity $e = ${n(e, 3)}$. How far is the plane tilted from the horizontal, in degrees?`, `半頂角 $45^\\circ$ の円錐の切り口は離心率 $e = ${n(e, 3)}$ の双曲線です。平面は水平から何度傾いていますか。`],
          a: { type: 'num', v: t, tol: 0.6, unit: ['°', '°'] },
          hint: ['$e = \\sqrt2\\sin\\tau$, and $e > 1$ means $\\tau > 45^\\circ$.', '$e = \\sqrt2\\sin\\tau$ で、$e > 1$ は $\\tau > 45^\\circ$ を意味します。'],
          sol: [[`$\\sin\\tau = ${n(e, 3)}/\\sqrt2 = ${n(e / Math.SQRT2, 4)}$.`, `$\\sin\\tau = ${n(e, 3)}/\\sqrt2 = ${n(e / Math.SQRT2, 4)}$ です。`], [`$\\tau = ${n(Math.asin(e / Math.SQRT2) * 180 / PI, 2)}^\\circ$, about $${t}^\\circ$: steeper than $45^\\circ$, so the plane cuts both nappes and the section has two branches.`, `$\\tau = ${n(Math.asin(e / Math.SQRT2) * 180 / PI, 2)}^\\circ$、約 $${t}^\\circ$ です。$45^\\circ$ より大きいので、平面は円錐面の両側を切り、切り口には二つの枝があります。`]],
          set: { tilt: t },
        };
      }
      const V = r.int(0, 2);
      const E = [['e as a function of the tilt $t$ (in radians)', 'e を傾き $t$（ラジアン）の関数として', 'sqrt(2)*sin(t)', '$e = \\sqrt2\\sin t$', 'from $e = \\cos\\varphi/\\cos45^\\circ$ with $\\varphi = \\pi/2 - t$.', '$e = \\cos\\varphi/\\cos45^\\circ$ に $\\varphi = \\pi/2 - t$ を代入して得ます。', '$e =$'], ['the major semi-axis $a$ of the ellipse as a function of the tilt $t$ (in radians), for a plane at distance $1$ from the apex', '頂点から距離 $1$ の平面の切り口の楕円の長半軸 $a$ を傾き $t$（ラジアン）の関数として', '1/cos(2*t)', '$a = 1/\\cos2t$', 'by completing the square in $\\cos2t\\,u^2 + v^2 + 2\\sin2t\\,u - \\cos2t = 0$.', '$\\cos2t\\,u^2 + v^2 + 2\\sin2t\\,u - \\cos2t = 0$ を平方完成して得ます。', '$a =$'], ['the $u$-coordinate of the centre of that ellipse, as a function of the tilt $t$ (in radians)', 'その楕円の中心の $u$ 座標を傾き $t$（ラジアン）の関数として', '-sin(2*t)/cos(2*t)', '$u_0 = -\\tan2t$', 'by completing the square in $u$.', '$u$ について平方完成して得ます。', '$u_0 =$']][V];
      return {
        q: [`Write ${E[0]}.`, `${E[1]}表してください。`],
        a: { type: 'expr', v: E[2], vars: ['t'], dom: { t: [0.15, 0.7] }, lhs: [E[6], E[6]] },
        hint: ['Use the closed forms for the $45^\\circ$ cone: $e = \\sqrt2\\sin t$ and the section $\\cos2t\\,u^2 + v^2 + 2\\sin2t\\,u - \\cos2t = 0$.', '半頂角 $45^\\circ$ の円錐の閉じた式 $e = \\sqrt2\\sin t$ と、切り口 $\\cos2t\\,u^2 + v^2 + 2\\sin2t\\,u - \\cos2t = 0$ を使います。'],
        sol: [[`${E[3]}, ${E[4]}`, `${E[3]}、${E[5]}`], ['As $t \\to 0$ this is a circle ($e = 0$, $a = 1$, centre at $0$); as $t \\to \\pi/4$ both $a$ and the centre run off to infinity and the ellipse opens into the parabola.', '$t \\to 0$ では円（$e = 0$、$a = 1$、中心は $0$）です。$t \\to \\pi/4$ では $a$ も中心も無限遠へ飛び、楕円は開いて放物線になります。']],
      };
    },
  ];
})();
