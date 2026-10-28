'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, sig } = P.util;
  const PI = Math.PI, rad = (d) => (d * PI) / 180;
  const E = (s) => s.replace(/\+ -/g, '- ').replace(/- -/g, '+ ');
  const piFrac = (p, q) => { const f = frac(p, q); return f === '1' ? '\\pi' : f === '-1' ? '-\\pi' : /tfrac/.test(f) ? f.replace(/^(-?)\\tfrac\{(\d+)\}\{(\d+)\}$/, (m, s, a, b) => `${s}\\tfrac{${a === '1' ? '' : a}\\pi}{${b}}`) : `${f}\\pi`; };

  /* ---------- plane figures: triangle, Pythagoras, sector ---------- */
  Q['explore-geometry-mensuration-plane'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const b = r.int(2, 10), h = r.int(1, 8), x = r.step(-3, 12, 0.5);
        return {
          q: [`A triangle has base ${b} and perpendicular height ${h}. The apex is at horizontal position $x = ${n(x)}$. What is its area?`, `底辺が ${b}、垂直な高さが ${h} の三角形があります。頂点の水平位置は $x = ${n(x)}$ です。面積はいくつですか。`],
          a: { type: 'num', v: (b * h) / 2, tol: 1e-6 },
          hint: ['Does the apex position change the base or the perpendicular height?', '頂点の位置は、底辺や垂直な高さを変えるでしょうか。'],
          sol: [[`$A = \\tfrac12 bh = \\tfrac12 \\cdot ${b} \\cdot ${h} = ${n((b * h) / 2)}$.`, `$A = \\tfrac12 bh = \\tfrac12 \\cdot ${b} \\cdot ${h} = ${n((b * h) / 2)}$ です。`],
                [`The sideways position $x$ does not enter, because the perpendicular height is unchanged: sliding the apex along a line parallel to the base keeps the area fixed.`, `横方向の位置 $x$ は式に入りません。垂直な高さが変わらないので、頂点を底辺と平行に動かしても面積は一定です。`]],
          set: { exp: 'triangle', b, h, x },
        };
      }
      if (form === 1) {
        const tri = r.pick([[3, 4], [5, 12], [8, 15], [6, 8], [2, 3], [1, 2], [4, 7]]);
        const sw = r.chance(0.5) ? tri : [tri[1], tri[0]];
        const [a, b] = sw;
        if (a > 8 || b > 8) return Q['explore-geometry-mensuration-plane'][0](r);
        const c = Math.hypot(a, b);
        return {
          q: [`The two legs of a right triangle are ${a} and ${b}. How long is the hypotenuse?`, `直角三角形の直角をはさむ 2 辺が ${a} と ${b} です。斜辺の長さはいくつですか。`],
          a: { type: 'num', v: c, tol: 0.0006 },
          hint: ['Add the squares on the legs.', '2 辺の正方形の面積を足します。'],
          sol: [[`$c^2 = a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$.`, `$c^2 = a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$ です。`],
                [`So $c = \\sqrt{${a * a + b * b}} = ${n(c, 4)}$: the square on the hypotenuse has exactly the area of the other two squares together.`, `よって $c = \\sqrt{${a * a + b * b}} = ${n(c, 4)}$ です。斜辺上の正方形の面積は、他の 2 つの正方形の面積の和にちょうど等しくなります。`]],
          set: { exp: 'pythagoras', a, b },
        };
      }
      if (form === 2) {
        const rr = r.int(2, 8), th = r.pick([30, 45, 60, 90, 120, 150, 180]);
        const L = (rr * PI * th) / 180;
        return {
          q: [`A circle of radius ${rr} has a sector with central angle ${th}°. How long is the arc?`, `半径 ${rr} の円で、中心角 ${th}° の扇形があります。弧の長さはいくつですか。`],
          a: { type: 'num', v: L, tol: 0.0006, show: `${piFrac(rr * th, 180)}` },
          hint: ['Convert the angle to radians, then use $L = r\\theta$.', '角度をラジアンに直して $L = r\\theta$ を使います。'],
          sol: [[`$\\theta = ${th} \\cdot \\pi/180 = ${piFrac(th, 180)}$ rad.`, `$\\theta = ${th} \\cdot \\pi/180 = ${piFrac(th, 180)}$ ラジアンです。`],
                [`$L = r\\theta = ${rr} \\cdot ${piFrac(th, 180)} = ${n(L, 4)}$. The arc is the fraction ${th}/360 of the full circumference $2\\pi r$.`, `$L = r\\theta = ${rr} \\cdot ${piFrac(th, 180)} = ${n(L, 4)}$ です。弧は円周 $2\\pi r$ の ${th}/360 にあたります。`]],
          set: { exp: 'circle', r: rr, angle: th },
        };
      }
      const b = r.int(2, 10), h = r.int(1, 8), x = r.step(-3, 12, 1);
      const x2 = x + r.pick([-2, -1, 1, 2]);
      return {
        q: [`A triangle has base ${b} and height ${h}. When the apex slides sideways from $x = ${n(x)}$ to $x = ${n(x2)}$, how does the area change?`, `底辺 ${b}、高さ ${h} の三角形で、頂点を $x = ${n(x)}$ から $x = ${n(x2)}$ へ横にずらします。面積はどう変わりますか。`],
        a: { type: 'choice', fixed: true, v: 1, opts: [['It grows', '増える'], ['It stays the same', '変わらない'], ['It shrinks', '減る']] },
        hint: ['Which two lengths does the area formula use?', '面積の公式が使う 2 つの長さはどれでしょう。'],
        sol: [[`The area is $\\tfrac12 bh = ${n((b * h) / 2)}$ before and after.`, `面積は前後どちらでも $\\tfrac12 bh = ${n((b * h) / 2)}$ です。`],
              [`The perimeter changes, but the area depends only on the base and the perpendicular height, and both stayed fixed.`, `周の長さは変わりますが、面積は底辺と垂直な高さだけで決まり、どちらも変わっていません。`]],
        set: { exp: 'triangle', b, h, x },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const b = r.int(3, 10), h = r.int(1, 8), x = r.step(-2, 11, 1);
        const left = Math.hypot(x, h), right = Math.hypot(b - x, h), Pp = b + left + right;
        return {
          q: [`A triangle has base ${b} (from $0$ to ${b} on the axis), height ${h}, and its apex above $x = ${n(x)}$. Find its perimeter.`, `底辺 ${b}（軸上の $0$ から ${b}）、高さ ${h} で、頂点が $x = ${n(x)}$ の真上にある三角形の周の長さを求めてください。`],
          a: { type: 'num', v: Pp, tol: 0.0051 },
          hint: ['The two slanted sides are hypotenuses of right triangles with legs $x, h$ and $b - x, h$.', '斜めの 2 辺は、辺 $x, h$ と $b - x, h$ の直角三角形の斜辺です。'],
          sol: [[`Left side: $\\sqrt{${n(x)}^2 + ${h}^2} = ${n(left, 4)}$.`, `左の辺：$\\sqrt{${n(x)}^2 + ${h}^2} = ${n(left, 4)}$ です。`],
                [`Right side: $\\sqrt{(${b} - ${n(x)})^2 + ${h}^2} = ${n(right, 4)}$.`, `右の辺：$\\sqrt{(${b} - ${n(x)})^2 + ${h}^2} = ${n(right, 4)}$ です。`],
                [`$P = ${b} + ${n(left, 4)} + ${n(right, 4)} = ${n(Pp, 3)}$. The area stays $${n((b * h) / 2)}$ wherever the apex goes, but the perimeter does not.`, `$P = ${b} + ${n(left, 4)} + ${n(right, 4)} = ${n(Pp, 3)}$ です。頂点がどこにあっても面積は $${n((b * h) / 2)}$ のままですが、周の長さは変わります。`]],
          set: { exp: 'triangle', b, h, x },
        };
      }
      if (form === 1) {
        const tri = r.pick([[3, 5], [5, 13], [8, 17], [6, 10], [2, 7], [4, 9]]);
        const c = tri[1], a = tri[0];
        const b = Math.sqrt(c * c - a * a);
        return {
          q: [`The hypotenuse of a right triangle is ${c} and one leg is ${a}. How long is the other leg?`, `直角三角形の斜辺が ${c}、1 辺が ${a} です。もう 1 辺の長さはいくつですか。`],
          a: { type: 'num', v: b, tol: 0.0006 },
          hint: ['Subtract: $b^2 = c^2 - a^2$.', '引き算をします：$b^2 = c^2 - a^2$。'],
          sol: [[`$b^2 = ${c * c} - ${a * a} = ${c * c - a * a}$.`, `$b^2 = ${c * c} - ${a * a} = ${c * c - a * a}$ です。`],
                [`$b = ${n(b, 4)}$. The square on the missing leg is what is left of the hypotenuse square after removing the known leg square.`, `$b = ${n(b, 4)}$ です。知っている辺の正方形を斜辺の正方形から取り除いた残りが、求める辺の正方形です。`]],
          set: a <= 8 && b <= 8 ? { exp: 'pythagoras', a, b: Math.round(b * 10) / 10 } : undefined,
        };
      }
      if (form === 2) {
        const rr = r.int(2, 8), th = r.pick([30, 45, 60, 90, 120, 150, 180]);
        const A = 0.5 * rr * rr * rad(th);
        return {
          q: [`Find the area of the sector of radius ${rr} and central angle ${th}°.`, `半径 ${rr}、中心角 ${th}° の扇形の面積を求めてください。`],
          a: { type: 'num', v: A, tol: 0.0006, show: piFrac(rr * rr * th, 360) },
          hint: ['$A = \\tfrac12 r^2\\theta$ with $\\theta$ in radians, or the fraction $\\theta/360$ of $\\pi r^2$.', '$\\theta$ をラジアンにして $A = \\tfrac12 r^2\\theta$、または $\\pi r^2$ の $\\theta/360$ 倍です。'],
          sol: [[`The sector is $${th}/360$ of the disc of area $\\pi r^2 = ${n(PI * rr * rr, 4)}$.`, `扇形は面積 $\\pi r^2 = ${n(PI * rr * rr, 4)}$ の円の $${th}/360$ です。`],
                [`$A = ${piFrac(rr * rr * th, 360)} = ${n(A, 4)}$. Doubling the angle would double this, but doubling the radius would quadruple it.`, `$A = ${piFrac(rr * rr * th, 360)} = ${n(A, 4)}$ です。角を 2 倍にすれば面積も 2 倍ですが、半径を 2 倍にすると 4 倍になります。`]],
          set: { exp: 'circle', r: rr, angle: th },
        };
      }
      const rr = r.int(2, 8), th = r.pick([30, 45, 60, 90, 120, 150]);
      const perim = rr * rad(th) + 2 * rr;
      return {
        q: [`What is the full perimeter (arc plus the two radii) of the sector with radius ${rr} and angle ${th}°?`, `半径 ${rr}、中心角 ${th}° の扇形の周全体（弧と 2 本の半径）の長さはいくつですか。`],
        a: { type: 'num', v: perim, tol: 0.0051 },
        hint: ['The arc length is not the whole boundary.', '弧の長さだけでは境界全体になりません。'],
        sol: [[`Arc: $L = r\\theta = ${rr} \\cdot ${n(rad(th), 5)} = ${n(rr * rad(th), 4)}$.`, `弧：$L = r\\theta = ${rr} \\cdot ${n(rad(th), 5)} = ${n(rr * rad(th), 4)}$ です。`],
              [`Add the two radii: $P = L + 2r = ${n(rr * rad(th), 4)} + ${2 * rr} = ${n(perim, 3)}$. The straight chord is not part of the boundary.`, `2 本の半径を足して $P = L + 2r = ${n(rr * rad(th), 4)} + ${2 * rr} = ${n(perim, 3)}$ です。弦は境界に含まれません。`]],
        set: { exp: 'circle', r: rr, angle: th },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const b = r.pick([2, 4, 6, 8, 10]), h = r.int(1, 8);
        const Pm = b + 2 * Math.hypot(b / 2, h);
        return {
          q: [`The base is ${b} and the height ${h}. Over all positions of the apex, what is the smallest possible perimeter?`, `底辺が ${b}、高さが ${h} です。頂点の位置をすべて動かしたとき、周の長さの最小値はいくつですか。`],
          a: { type: 'num', v: Pm, tol: 0.0051 },
          hint: ['By symmetry the best apex is above the midpoint of the base.', '対称性から、最適な頂点は底辺の中点の真上です。'],
          sol: [[`The sum of the two slanted sides $\\sqrt{x^2 + h^2} + \\sqrt{(b - x)^2 + h^2}$ is smallest when $x = b/2$ (reflect one side across the height line: a straight path is shortest).`, `斜めの 2 辺の和 $\\sqrt{x^2 + h^2} + \\sqrt{(b - x)^2 + h^2}$ は $x = b/2$ のとき最小です（一方の辺を高さの線で折り返すと、直線が最短になります）。`],
                [`$P_{\\min} = ${b} + 2\\sqrt{${b / 2}^2 + ${h}^2} = ${n(Pm, 3)}$, attained by the isosceles triangle. The area is $${(b * h) / 2}$ for every position, so this is the least boundary around that area.`, `$P_{\\min} = ${b} + 2\\sqrt{${b / 2}^2 + ${h}^2} = ${n(Pm, 3)}$ で、二等辺三角形のときです。面積はどの位置でも $${(b * h) / 2}$ なので、この面積を囲む最短の周になります。`]],
          set: { exp: 'triangle', b, h, x: b / 2 },
        };
      }
      if (form === 1) {
        const rr = r.int(2, 8), th = r.pick([30, 45, 60, 90, 120, 150]);
        const A = 0.5 * rr * rr * rad(th), L = rr * rad(th);
        return {
          q: [`A sector has arc length $L = ${n(L, 4)}$ and area $A = ${n(A, 4)}$. Find its radius and its central angle in degrees. Enter the radius first.`, `扇形の弧の長さが $L = ${n(L, 4)}$、面積が $A = ${n(A, 4)}$ です。半径と中心角（度）を求めてください。半径から先に入力します。`],
          a: { type: 'tuple', v: [rr, th], labels: ['$r$', '$\\theta$ (°)'], tol: 0.01 },
          hint: ['Divide: $A / L = \\tfrac12 r$.', '割り算をします：$A / L = \\tfrac12 r$。'],
          sol: [[`$A = \\tfrac12 rL$, so $r = 2A/L = ${n((2 * A) / L, 3)}$.`, `$A = \\tfrac12 rL$ なので $r = 2A/L = ${n((2 * A) / L, 3)}$ です。`],
                [`$\\theta = L/r = ${n(L / rr, 4)}$ rad $= ${n(th, 3)}^\\circ$.`, `$\\theta = L/r = ${n(L / rr, 4)}$ ラジアン $= ${n(th, 3)}^\\circ$ です。`],
                [`Two measurements of a sector (arc and area) are enough to recover both its size and its opening.`, `扇形の 2 つの測定値（弧と面積）から、大きさと開きの両方が決まります。`]],
          set: { exp: 'circle', r: rr, angle: th },
        };
      }
      if (form === 2) {
        const rr = r.int(2, 8), th = r.pick([60, 90, 120, 150, 180]);
        const c = 2 * rr * Math.sin(rad(th) / 2);
        return {
          q: [`In a circle of radius ${rr} a chord has length ${n(c, 4)}. What central angle (in degrees, at most $180^\\circ$) does it subtend?`, `半径 ${rr} の円で、長さ ${n(c, 4)} の弦があります。この弦に対する中心角（度、$180^\\circ$ 以下）を求めてください。`],
          a: { type: 'num', v: th, tol: 0.05, unit: ['°', '°'] },
          hint: ['$c = 2r\\sin(\\theta/2)$; solve for $\\theta$.', '$c = 2r\\sin(\\theta/2)$ を $\\theta$ について解きます。'],
          sol: [[`$\\sin(\\theta/2) = c/(2r) = ${n(c, 4)}/${2 * rr} = ${n(c / (2 * rr), 4)}$.`, `$\\sin(\\theta/2) = c/(2r) = ${n(c, 4)}/${2 * rr} = ${n(c / (2 * rr), 4)}$ です。`],
                [`So $\\theta/2 = ${n(th / 2, 3)}^\\circ$ and $\\theta = ${th}^\\circ$. A chord equal to the radius gives $60^\\circ$, and the diameter gives $180^\\circ$.`, `よって $\\theta/2 = ${n(th / 2, 3)}^\\circ$、$\\theta = ${th}^\\circ$ です。半径に等しい弦は $60^\\circ$、直径は $180^\\circ$ にあたります。`]],
          set: { exp: 'circle', r: rr, angle: th },
        };
      }
      const b = r.int(2, 7);
      return {
        q: [`A right triangle has one leg fixed at ${b}. Write its hypotenuse $c$ as a function of the other leg $a$.`, `直角三角形の 1 辺が ${b} に固定されています。斜辺 $c$ をもう 1 辺 $a$ の関数として表してください。`],
        a: { type: 'expr', v: `sqrt(a^2+${b * b})`, vars: ['a'], lhs: ['$c(a)=$', '$c(a)=$'] },
        hint: ['Use $c^2 = a^2 + b^2$ with $b$ fixed.', '$b$ を固定して $c^2 = a^2 + b^2$ を使います。'],
        sol: [[`$c^2 = a^2 + ${b * b}$, so $c = \\sqrt{a^2 + ${b * b}}$.`, `$c^2 = a^2 + ${b * b}$ なので $c = \\sqrt{a^2 + ${b * b}}$ です。`],
              [`For large $a$ this is almost $a$, and at $a \\to 0$ it tends to ${b}: the hypotenuse is never shorter than either leg.`, `$a$ が大きいと $c$ はほぼ $a$ に等しく、$a \\to 0$ では ${b} に近づきます。斜辺はどちらの辺よりも短くなりません。`]],
        set: undefined,
      };
    },
  ];

  /* ---------- regular polygons ---------- */
  Q['explore-geometry-mensuration-polygon'] = [
    (r) => {
      const form = r.int(0, 2);
      const R = r.int(2, 8);
      if (form === 0) {
        const nn = r.pick([3, 4, 6, 8, 12]);
        const a = 2 * R * Math.sin(PI / nn);
        return {
          q: [`A regular ${nn}-gon is inscribed in a circle of radius ${R}. How long is each side?`, `半径 ${R} の円に内接する正 ${nn} 角形があります。1 辺の長さはいくつですか。`],
          a: { type: 'num', v: a, tol: 0.0006 },
          hint: ['Each side subtends $2\\pi/n$ at the centre; use $a = 2R\\sin(\\pi/n)$.', '1 辺は中心で $2\\pi/n$ の角をなします。$a = 2R\\sin(\\pi/n)$ を使います。'],
          sol: [[`$a = 2R\\sin(\\pi/n) = 2 \\cdot ${R}\\cdot\\sin(${n(180 / nn, 3)}^\\circ)$.`, `$a = 2R\\sin(\\pi/n) = 2 \\cdot ${R}\\cdot\\sin(${n(180 / nn, 3)}^\\circ)$ です。`],
                [`$a = ${n(a, 4)}$. For $n = 6$ this equals $R$, because the six central triangles are equilateral.`, `$a = ${n(a, 4)}$ です。$n = 6$ のときは $a = R$ で、6 つの中心三角形が正三角形になるためです。`]],
          set: { exp: 'polygon', n: nn, r: R },
        };
      }
      if (form === 1) {
        const nn = r.int(3, 12);
        const q = R * Math.cos(PI / nn);
        return {
          q: [`A regular ${nn}-gon has circumradius ${R}. What is its apothem (the distance from the centre to the middle of a side)?`, `外接円の半径が ${R} の正 ${nn} 角形があります。その辺心距離（中心から辺の中点までの距離）を求めてください。`],
          a: { type: 'num', v: q, tol: 0.0006 },
          hint: ['The apothem, half a side and the circumradius form a right triangle.', '辺心距離、辺の半分、外接円の半径は直角三角形をつくります。'],
          sol: [[`The angle at the centre in that right triangle is $\\pi/n = ${n(180 / nn, 3)}^\\circ$.`, `その直角三角形の中心での角は $\\pi/n = ${n(180 / nn, 3)}^\\circ$ です。`],
                [`$q = R\\cos(\\pi/n) = ${n(q, 4)}$. As $n$ grows, $q \\to R$: the sides move out to touch the circle.`, `$q = R\\cos(\\pi/n) = ${n(q, 4)}$ です。$n$ が大きくなると $q \\to R$ となり、辺は円に近づきます。`]],
          set: { exp: 'polygon', n: nn, r: R },
        };
      }
      const nn = r.int(3, 12);
      const Pp = 2 * nn * R * Math.sin(PI / nn);
      return {
        q: [`Find the perimeter of the regular ${nn}-gon inscribed in a circle of radius ${R}.`, `半径 ${R} の円に内接する正 ${nn} 角形の周の長さを求めてください。`],
        a: { type: 'num', v: Pp, tol: 0.0051 },
        hint: ['$P = n a$, with $a = 2R\\sin(\\pi/n)$.', '$P = n a$ で、$a = 2R\\sin(\\pi/n)$ です。'],
        sol: [[`$a = 2 \\cdot ${R} \\sin(\\pi/${nn}) = ${n(2 * R * Math.sin(PI / nn), 4)}$.`, `$a = 2 \\cdot ${R} \\sin(\\pi/${nn}) = ${n(2 * R * Math.sin(PI / nn), 4)}$ です。`],
              [`$P = ${nn}a = ${n(Pp, 3)}$, a little below the circle's circumference $2\\pi R = ${n(2 * PI * R, 3)}$.`, `$P = ${nn}a = ${n(Pp, 3)}$ で、円周 $2\\pi R = ${n(2 * PI * R, 3)}$ より少し小さい値です。`]],
        set: { exp: 'polygon', n: nn, r: R },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const R = r.int(2, 8);
      if (form === 0) {
        const nn = r.int(3, 16);
        const A = 0.5 * nn * R * R * Math.sin((2 * PI) / nn);
        return {
          q: [`Find the area of the regular ${nn}-gon with circumradius ${R}.`, `外接円の半径が ${R} の正 ${nn} 角形の面積を求めてください。`],
          a: { type: 'num', v: A, tol: 0.0051 },
          hint: ['Cut it into $n$ triangles at the centre, each with area $\\tfrac12 R^2\\sin(2\\pi/n)$.', '中心で $n$ 個の三角形に分けます。1 つの面積は $\\tfrac12 R^2\\sin(2\\pi/n)$ です。'],
          sol: [[`Each central triangle has two sides $R$ and angle $2\\pi/${nn}$: area $\\tfrac12 R^2\\sin(2\\pi/${nn}) = ${n(A / nn, 4)}$.`, `各中心三角形は 2 辺が $R$、はさむ角が $2\\pi/${nn}$ で、面積は $\\tfrac12 R^2\\sin(2\\pi/${nn}) = ${n(A / nn, 4)}$ です。`],
                [`Total: $A = ${nn} \\cdot ${n(A / nn, 4)} = ${n(A, 3)}$, about ${n((100 * A) / (PI * R * R), 3)}% of the circle's area $\\pi R^2$.`, `合計は $A = ${nn} \\cdot ${n(A / nn, 4)} = ${n(A, 3)}$ で、円の面積 $\\pi R^2$ の約 ${n((100 * A) / (PI * R * R), 3)}% です。`]],
          set: { exp: 'polygon', n: nn, r: R },
        };
      }
      if (form === 1) {
        const nn = r.pick([5, 6, 8, 10, 12, 16]);
        const frc = (nn * Math.sin((2 * PI) / nn)) / (2 * PI);
        return {
          q: [`What percentage of the circumscribed circle's area does a regular ${nn}-gon fill?`, `正 ${nn} 角形は、外接円の面積の何パーセントを占めますか。`],
          a: { type: 'num', v: 100 * frc, tol: 0.06, unit: ['%', '%'] },
          hint: ['Compare $\\tfrac12 nR^2\\sin(2\\pi/n)$ with $\\pi R^2$; the radius cancels.', '$\\tfrac12 nR^2\\sin(2\\pi/n)$ と $\\pi R^2$ を比べます。半径は約分されます。'],
          sol: [[`The ratio is $\\dfrac{n\\sin(2\\pi/n)}{2\\pi} = \\dfrac{${nn}\\sin(${n(360 / nn, 3)}^\\circ)}{2\\pi}$.`, `比は $\\dfrac{n\\sin(2\\pi/n)}{2\\pi} = \\dfrac{${nn}\\sin(${n(360 / nn, 3)}^\\circ)}{2\\pi}$ です。`],
                [`That is ${n(frc, 5)}, or ${n(100 * frc, 3)}%. It does not depend on $R$: all regular ${nn}-gons are similar.`, `これは ${n(frc, 5)}、つまり ${n(100 * frc, 3)}% です。$R$ には依存しません。正 ${nn} 角形はすべて相似だからです。`]],
          set: { exp: 'polygon', n: nn, r: R },
        };
      }
      const nn = r.int(3, 16), A = 0.5 * nn * R * R * Math.sin((2 * PI) / nn);
      return {
        q: [`A regular ${nn}-gon has area ${n(A, 4)}. What is its circumradius?`, `正 ${nn} 角形の面積が ${n(A, 4)} です。外接円の半径を求めてください。`],
        a: { type: 'num', v: R, tol: 0.002 },
        hint: ['Solve $A = \\tfrac12 nR^2\\sin(2\\pi/n)$ for $R$.', '$A = \\tfrac12 nR^2\\sin(2\\pi/n)$ を $R$ について解きます。'],
        sol: [[`$R^2 = \\dfrac{2A}{n\\sin(2\\pi/n)} = \\dfrac{${n(2 * A, 4)}}{${n(nn * Math.sin((2 * PI) / nn), 5)}} = ${n(R * R, 4)}$.`, `$R^2 = \\dfrac{2A}{n\\sin(2\\pi/n)} = \\dfrac{${n(2 * A, 4)}}{${n(nn * Math.sin((2 * PI) / nn), 5)}} = ${n(R * R, 4)}$ です。`],
              [`$R = ${R}$. Area scales as $R^2$, so the radius comes from a square root.`, `$R = ${R}$ です。面積は $R^2$ に比例するので、半径は平方根で求まります。`]],
        set: { exp: 'polygon', n: nn, r: R },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pick = r.pick([[3, '3*sqrt(3)/4*R^2', '\\tfrac{3\\sqrt3}{4}R^2'], [4, '2*R^2', '2R^2'], [6, '3*sqrt(3)/2*R^2', '\\tfrac{3\\sqrt3}{2}R^2'], [8, '2*sqrt(2)*R^2', '2\\sqrt2\\,R^2'], [12, '3*R^2', '3R^2']]);
        const [nn, ans, tex] = pick;
        return {
          q: [`Write the area of the regular ${nn}-gon inscribed in a circle of radius $R$ as a formula in $R$.`, `半径 $R$ の円に内接する正 ${nn} 角形の面積を、$R$ の式で表してください。`],
          a: { type: 'expr', v: ans, vars: ['R'], lhs: ['$A(R)=$', '$A(R)=$'] },
          hint: ['Use $A = \\tfrac12 nR^2\\sin(2\\pi/n)$ and an exact sine.', '$A = \\tfrac12 nR^2\\sin(2\\pi/n)$ に正確な正弦の値を代入します。'],
          sol: [[`$A = \\tfrac12 \\cdot ${nn} \\cdot R^2 \\sin(2\\pi/${nn}) = \\tfrac{${nn}}{2}R^2\\sin(${n(360 / nn, 3)}^\\circ)$.`, `$A = \\tfrac12 \\cdot ${nn} \\cdot R^2 \\sin(2\\pi/${nn}) = \\tfrac{${nn}}{2}R^2\\sin(${n(360 / nn, 3)}^\\circ)$ です。`],
                [`With the exact sine this is $${tex}$, about ${n(eval0(ans), 4)} times $R^2$, compared with $\\pi \\approx 3.1416$ for the circle.`, `正弦の正確な値を使うと $${tex}$ で、$R^2$ の約 ${n(eval0(ans), 4)} 倍です。円の $\\pi \\approx 3.1416$ と比べられます。`]],
          set: undefined,
        };
      }
      if (form === 1) {
        const target = r.pick([0.9, 0.95, 0.98, 0.99]);
        let nn = 3;
        while ((nn * Math.sin((2 * PI) / nn)) / (2 * PI) < target) nn++;
        return {
          q: [`What is the smallest number of sides $n$ for which an inscribed regular $n$-gon fills at least ${n(target * 100)}% of the circle's area?`, `内接する正 $n$ 角形が円の面積の ${n(target * 100)}% 以上を占める、最小の辺の数 $n$ を求めてください。`],
          a: { type: 'int', v: nn },
          hint: ['The filled fraction is $\\dfrac{n\\sin(2\\pi/n)}{2\\pi}$; try increasing $n$.', '占める割合は $\\dfrac{n\\sin(2\\pi/n)}{2\\pi}$ です。$n$ を増やして試します。'],
          sol: [[`For $n = ${nn - 1}$ the fraction is ${n(((nn - 1) * Math.sin((2 * PI) / (nn - 1))) / (2 * PI), 5)}, which is below ${n(target)}.`, `$n = ${nn - 1}$ では割合は ${n(((nn - 1) * Math.sin((2 * PI) / (nn - 1))) / (2 * PI), 5)} で、${n(target)} に届きません。`],
                [`For $n = ${nn}$ it is ${n((nn * Math.sin((2 * PI) / nn)) / (2 * PI), 5)}, which reaches it. The shortfall shrinks like $1/n^2$, so each extra side helps less.`, `$n = ${nn}$ では ${n((nn * Math.sin((2 * PI) / nn)) / (2 * PI), 5)} となり、届きます。不足分は $1/n^2$ のように小さくなるので、辺を増やすほど効果は小さくなります。`]],
          set: { exp: 'polygon', n: Math.min(16, nn), r: 4 },
        };
      }
      const nn = r.pick([6, 8, 12, 16]);
      const R = r.int(2, 8);
      const gap = 1 - (nn * Math.sin(PI / nn)) / PI;
      return {
        q: [`By what percentage is the perimeter of the inscribed regular ${nn}-gon shorter than the circle's circumference?`, `内接する正 ${nn} 角形の周は、円周より何パーセント短いですか。`],
        a: { type: 'num', v: gap * 100, tol: 0.03, unit: ['%', '%'] },
        hint: ['Compare $2nR\\sin(\\pi/n)$ with $2\\pi R$; $R$ cancels.', '$2nR\\sin(\\pi/n)$ と $2\\pi R$ を比べます。$R$ は約分されます。'],
        sol: [[`The ratio of perimeters is $\\dfrac{n\\sin(\\pi/n)}{\\pi} = ${n((nn * Math.sin(PI / nn)) / PI, 5)}$.`, `周の比は $\\dfrac{n\\sin(\\pi/n)}{\\pi} = ${n((nn * Math.sin(PI / nn)) / PI, 5)}$ です。`],
              [`So the polygon is ${n(gap * 100, 3)}% shorter. Archimedes squeezed $\\pi$ between inscribed and circumscribed polygons in just this way.`, `したがって多角形は ${n(gap * 100, 3)}% 短くなります。アルキメデスは、まさにこの方法で内接・外接多角形から $\\pi$ をはさみました。`]],
        set: { exp: 'polygon', n: nn, r: R },
      };
    },
  ];
  function eval0(s) { const m = P.parse(s, ['R']); return P.evaluate(m, { R: 1 }); }

  /* ---------- solids: cone, cylinder, sphere ---------- */
  Q['explore-geometry-mensuration-solids'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const tri = r.pick([[3, 4], [6, 8], [5, 12], [2, 5], [4, 3], [3, 7]]);
        const [rr, h] = tri;
        const l = Math.hypot(rr, h);
        return {
          q: [`A cone has base radius ${rr} and perpendicular height ${h}. What is its slant height?`, `底面の半径が ${rr}、垂直な高さが ${h} の円錐があります。母線の長さ（斜めの高さ）はいくつですか。`],
          a: { type: 'num', v: l, tol: 0.0006 },
          hint: ['Radius, height and slant height form a right triangle.', '半径、高さ、母線は直角三角形をつくります。'],
          sol: [[`$\\ell = \\sqrt{r^2 + h^2} = \\sqrt{${rr * rr} + ${h * h}} = \\sqrt{${rr * rr + h * h}}$.`, `$\\ell = \\sqrt{r^2 + h^2} = \\sqrt{${rr * rr} + ${h * h}} = \\sqrt{${rr * rr + h * h}}$ です。`],
                [`$\\ell = ${n(l, 4)}$, longer than $h$: the slant height is the hypotenuse, so it is never equal to the perpendicular height.`, `$\\ell = ${n(l, 4)}$ で、$h$ より長くなります。母線は斜辺なので、垂直な高さと等しくなることはありません。`]],
          set: rr <= 6 && h <= 10 ? { exp: 'cone', r: rr, h } : undefined,
        };
      }
      if (form === 1) {
        const rr = r.int(1, 6), h = r.int(1, 10);
        const V = (PI * rr * rr * h) / 3;
        return {
          q: [`Find the volume of a cone with base radius ${rr} and height ${h}.`, `底面の半径が ${rr}、高さが ${h} の円錐の体積を求めてください。`],
          a: { type: 'num', v: V, tol: 0.0051, show: piFrac(rr * rr * h, 3) },
          hint: ['A cone is one third of the cylinder with the same base and height.', '円錐は、同じ底面と高さをもつ円柱の 3 分の 1 です。'],
          sol: [[`$V = \\tfrac13\\pi r^2 h = \\tfrac13\\pi \\cdot ${rr * rr}\\cdot ${h}$.`, `$V = \\tfrac13\\pi r^2 h = \\tfrac13\\pi \\cdot ${rr * rr}\\cdot ${h}$ です。`],
                [`$V = ${n(V, 3)}$, one third of the cylinder volume $${n(PI * rr * rr * h, 3)}$.`, `$V = ${n(V, 3)}$ で、円柱の体積 $${n(PI * rr * rr * h, 3)}$ のちょうど 3 分の 1 です。`]],
          set: { exp: 'cone', r: rr, h },
        };
      }
      if (form === 2) {
        const rr = r.int(1, 6), h = r.int(1, 12);
        const V = PI * rr * rr * h;
        return {
          q: [`A closed cylinder has radius ${rr} and height ${h}. What is its volume?`, `半径 ${rr}、高さ ${h} の円柱の体積はいくつですか。`],
          a: { type: 'num', v: V, tol: 0.0051, show: piFrac(rr * rr * h, 1) },
          hint: ['Base area times height.', '底面積に高さを掛けます。'],
          sol: [[`$V = \\pi r^2 h = \\pi \\cdot ${rr * rr} \\cdot ${h}$.`, `$V = \\pi r^2 h = \\pi \\cdot ${rr * rr} \\cdot ${h}$ です。`],
                [`$V = ${n(V, 3)}$. Doubling the height doubles it; doubling the radius quadruples it.`, `$V = ${n(V, 3)}$ です。高さを 2 倍にすれば 2 倍、半径を 2 倍にすれば 4 倍になります。`]],
          set: { exp: 'solids', r: rr, h },
        };
      }
      const rr = r.int(1, 6);
      const V = (4 * PI * rr ** 3) / 3;
      return {
        q: [`What is the volume of a sphere of radius ${rr}?`, `半径 ${rr} の球の体積はいくつですか。`],
        a: { type: 'num', v: V, tol: 0.0051, show: piFrac(4 * rr ** 3, 3) },
        hint: ['$V = \\tfrac43\\pi r^3$.', '$V = \\tfrac43\\pi r^3$ です。'],
        sol: [[`$V = \\tfrac43\\pi \\cdot ${rr ** 3} = ${n(V, 3)}$.`, `$V = \\tfrac43\\pi \\cdot ${rr ** 3} = ${n(V, 3)}$ です。`],
              [`Volume grows as $r^3$: a sphere twice as wide holds eight times as much.`, `体積は $r^3$ で増えます。幅が 2 倍の球には 8 倍入ります。`]],
        set: { exp: 'solids', r: rr, h: 2 * rr },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const rr = r.int(2, 6), h = r.int(2, 10);
        const l = Math.hypot(rr, h), S = PI * rr * l;
        return {
          q: [`Find the curved surface area of the cone with radius ${rr} and height ${h} (the base disc is not included).`, `半径 ${rr}、高さ ${h} の円錐の側面積を求めてください（底面の円は含みません）。`],
          a: { type: 'num', v: S, tol: 0.0051 },
          hint: ['Use the slant height: $L = \\pi r \\ell$.', '母線を使います：$L = \\pi r \\ell$。'],
          sol: [[`$\\ell = \\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$.`, `$\\ell = \\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$ です。`],
                [`$L = \\pi r\\ell = \\pi \\cdot ${rr} \\cdot ${n(l, 4)} = ${n(S, 3)}$. Using $h$ instead of $\\ell$ would give a wrong, smaller number.`, `$L = \\pi r\\ell = \\pi \\cdot ${rr} \\cdot ${n(l, 4)} = ${n(S, 3)}$ です。$\\ell$ の代わりに $h$ を使うと、小さすぎる誤った値になります。`]],
          set: { exp: 'cone', r: rr, h },
        };
      }
      if (form === 1) {
        const rr = r.int(2, 6), h = r.int(2, 10);
        const l = Math.hypot(rr, h), T = PI * rr * (l + rr);
        return {
          q: [`Find the total surface area (curved surface plus base) of the cone with radius ${rr} and height ${h}.`, `半径 ${rr}、高さ ${h} の円錐の表面積（側面と底面の合計）を求めてください。`],
          a: { type: 'num', v: T, tol: 0.0051 },
          hint: ['Add the base disc $\\pi r^2$ to $\\pi r\\ell$.', '$\\pi r\\ell$ に底面の円 $\\pi r^2$ を足します。'],
          sol: [[`Curved part: $\\pi r\\ell = ${n(PI * rr * l, 3)}$. Base: $\\pi r^2 = ${n(PI * rr * rr, 3)}$.`, `側面：$\\pi r\\ell = ${n(PI * rr * l, 3)}$。底面：$\\pi r^2 = ${n(PI * rr * rr, 3)}$ です。`],
                [`Total $S = \\pi r(\\ell + r) = ${n(T, 3)}$.`, `合計は $S = \\pi r(\\ell + r) = ${n(T, 3)}$ です。`]],
          set: { exp: 'cone', r: rr, h },
        };
      }
      if (form === 2) {
        const rr = r.int(1, 6), h = r.pick([rr, 2 * rr, 3 * rr, 4, 6, 10, 12].filter((v) => v <= 12));
        const ratio = (4 * rr) / (3 * h);
        return {
          q: [`A sphere and a closed cylinder share radius ${rr}; the cylinder has height ${h}. What is the ratio (sphere volume) / (cylinder volume)?`, `球と円柱の半径は共通で ${rr}、円柱の高さは ${h} です。（球の体積）/（円柱の体積）はいくつですか。`],
          a: { type: 'num', v: ratio, tol: 0.0006, show: frac(4 * rr, 3 * h) },
          hint: ['Divide $\\tfrac43\\pi r^3$ by $\\pi r^2 h$.', '$\\tfrac43\\pi r^3$ を $\\pi r^2 h$ で割ります。'],
          sol: [[`$\\dfrac{\\frac43\\pi r^3}{\\pi r^2 h} = \\dfrac{4r}{3h} = \\dfrac{${4 * rr}}{${3 * h}}$.`, `$\\dfrac{\\frac43\\pi r^3}{\\pi r^2 h} = \\dfrac{4r}{3h} = \\dfrac{${4 * rr}}{${3 * h}}$ です。`],
                [`That is ${n(ratio, 4)}. When $h = 2r$ the sphere just fits and the ratio is exactly $2/3$.`, `値は ${n(ratio, 4)} です。$h = 2r$ のとき球はちょうど収まり、比は $2/3$ になります。`]],
          set: { exp: 'solids', r: rr, h },
        };
      }
      const rr = r.int(2, 6);
      const c = r.pick([0.5, 0.75, 0.25]);
      const hh = (4 * rr) / (3 * c);
      return {
        q: [`With radius ${rr}, for what cylinder height $h$ is the sphere's volume exactly ${n(c)} of the cylinder's?`, `半径 ${rr} のとき、球の体積が円柱の体積のちょうど ${n(c)} 倍になる円柱の高さ $h$ はいくつですか。`],
        a: { type: 'num', v: hh, tol: 0.006 },
        hint: ['Set $\\dfrac{4r}{3h} = ' + n(c) + '$ and solve for $h$.', '$\\dfrac{4r}{3h} = ' + n(c) + '$ を $h$ について解きます。'],
        sol: [[`$\\dfrac{4\\cdot ${rr}}{3h} = ${n(c)}$ gives $h = \\dfrac{${4 * rr}}{${n(3 * c)}} = ${n(hh, 4)}$.`, `$\\dfrac{4\\cdot ${rr}}{3h} = ${n(c)}$ より $h = \\dfrac{${4 * rr}}{${n(3 * c)}} = ${n(hh, 4)}$ です。`],
              [`Compare with the tight fit $h = 2r = ${2 * rr}$: ${hh > 2 * rr ? 'this cylinder is taller than the one that just contains the sphere' : 'this cylinder is shorter than the one that just contains the sphere, so the sphere would stick out'}.`, `ちょうど収まる $h = 2r = ${2 * rr}$ と比べると、${hh > 2 * rr ? 'この円柱は球がちょうど収まるものより高い' : 'この円柱は球がちょうど収まるものより低く、球がはみ出す'}ことになります。`]],
        set: hh <= 12 ? { exp: 'solids', r: rr, h: Math.round(hh * 10) / 10 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        return {
          q: [`For a cone of radius $r$ and height $h$, write the curved surface area $\\pi r\\ell$ as a formula in $r$ and $h$.`, `半径 $r$、高さ $h$ の円錐について、側面積 $\\pi r\\ell$ を $r$ と $h$ の式で表してください。`],
          a: { type: 'expr', v: 'pi*r*sqrt(r^2+h^2)', vars: ['r', 'h'], lhs: ['$L(r,h)=$', '$L(r,h)=$'] },
          hint: ['Replace $\\ell$ using the right triangle.', '直角三角形を使って $\\ell$ を置き換えます。'],
          sol: [[`$\\ell = \\sqrt{r^2 + h^2}$.`, `$\\ell = \\sqrt{r^2 + h^2}$ です。`],
                [`$L = \\pi r\\sqrt{r^2 + h^2}$. It is not linear in $h$: for large $h$ it grows like $\\pi r h$, but near $h = 0$ it is close to $\\pi r^2$, the area of the flat disc.`, `$L = \\pi r\\sqrt{r^2 + h^2}$ です。$h$ の一次式ではありません。$h$ が大きいと $\\pi r h$ のように増え、$h = 0$ の近くでは平らな円の面積 $\\pi r^2$ に近くなります。`]],
        };
      }
      if (form === 1) {
        const rr = r.pick([4, 5, 6]);
        const hh = (3 * rr) / Math.sqrt(rr * rr - 9);
        return {
          q: [`A cone has radius ${rr}. For what height $h$ is its volume numerically equal to its curved surface area?`, `円錐の半径は ${rr} です。体積が側面積と数値として等しくなる高さ $h$ はいくつですか。`],
          a: { type: 'num', v: hh, tol: 0.006 },
          hint: ['Set $\\tfrac13\\pi r^2 h = \\pi r\\sqrt{r^2 + h^2}$ and square both sides.', '$\\tfrac13\\pi r^2 h = \\pi r\\sqrt{r^2 + h^2}$ とおいて両辺を 2 乗します。'],
          sol: [[`Cancel $\\pi r$: $\\tfrac13 rh = \\sqrt{r^2 + h^2}$. Squaring, $\\tfrac19 r^2h^2 = r^2 + h^2$.`, `$\\pi r$ を約分して $\\tfrac13 rh = \\sqrt{r^2 + h^2}$ です。2 乗すると $\\tfrac19 r^2h^2 = r^2 + h^2$ となります。`],
                [`Then $h^2(r^2 - 9) = 9r^2$, so $h = \\dfrac{3r}{\\sqrt{r^2 - 9}} = \\dfrac{${3 * rr}}{\\sqrt{${rr * rr - 9}}} = ${n(hh, 4)}$.`, `すると $h^2(r^2 - 9) = 9r^2$ なので $h = \\dfrac{3r}{\\sqrt{r^2 - 9}} = \\dfrac{${3 * rr}}{\\sqrt{${rr * rr - 9}}} = ${n(hh, 4)}$ です。`],
                [`This only works for $r > 3$: for a narrower cone the volume stays below the curved area at every height. (A volume and an area have different units; the equality is a coincidence of the numbers.)`, `これは $r > 3$ のときだけ成り立ちます。それより細い円錐では、どの高さでも体積は側面積を下回ります（体積と面積は単位が異なるので、この等式は数値の偶然の一致です）。`]],
          set: hh <= 10 ? { exp: 'cone', r: rr, h: Math.round(hh * 10) / 10 } : undefined,
        };
      }
      if (form === 2) {
        const rr = r.int(1, 5);
        return {
          q: [`A cone, a sphere and a cylinder all have radius ${rr}, and the cylinder (and the cone) has height $h = ${2 * rr}$. Write the ratio of the volumes cone : sphere : cylinder as three whole numbers, and enter the cone's share when the cylinder counts as 3.`, `円錐、球、円柱の半径はすべて ${rr} で、円柱と円錐の高さは $h = ${2 * rr}$ です。体積比 円錐 : 球 : 円柱 を整数で表し、円柱を 3 とするときの円錐の値を入力してください。`],
          a: { type: 'int', v: 1 },
          hint: ['Compute each volume in units of $\\pi r^3$.', '各体積を $\\pi r^3$ を単位にして計算します。'],
          sol: [[`With $h = 2r$: cone $\\tfrac13\\pi r^2 \\cdot 2r = \\tfrac23\\pi r^3$, sphere $\\tfrac43\\pi r^3$, cylinder $2\\pi r^3$.`, `$h = 2r$ のとき、円錐は $\\tfrac13\\pi r^2 \\cdot 2r = \\tfrac23\\pi r^3$、球は $\\tfrac43\\pi r^3$、円柱は $2\\pi r^3$ です。`],
                [`Multiplying by $3/(2\\pi r^3)$ gives $1 : 2 : 3$, so the cone's share is 1. This is Archimedes' result, which he wished carved on his tomb.`, `$3/(2\\pi r^3)$ を掛けると $1 : 2 : 3$ なので、円錐の値は 1 です。これはアルキメデスの結果で、彼は墓に刻むことを望みました。`]],
          set: { exp: 'cone', r: rr, h: 2 * rr },
        };
      }
      const rr = r.int(2, 6), h = r.int(2, 10), k = r.pick([2, 3]);
      const l1 = Math.hypot(rr, h), l2 = Math.hypot(rr, k * h);
      const f = l2 / l1;
      return {
        q: [`A cone has radius ${rr} and height ${h}. If its height is multiplied by ${k} (the radius unchanged), by what factor does the curved surface area change?`, `円錐の半径は ${rr}、高さは ${h} です。半径を変えずに高さを ${k} 倍にすると、側面積は何倍になりますか。`],
        a: { type: 'num', v: f, tol: 0.0006 },
        hint: ['Volume scales with $h$, but the curved area scales with $\\ell$, not $h$.', '体積は $h$ に比例しますが、側面積は $h$ ではなく $\\ell$ に比例します。'],
        sol: [[`The old slant height is $\\sqrt{${rr * rr} + ${h * h}} = ${n(l1, 4)}$; the new one is $\\sqrt{${rr * rr} + ${k * k * h * h}} = ${n(l2, 4)}$.`, `もとの母線は $\\sqrt{${rr * rr} + ${h * h}} = ${n(l1, 4)}$、新しい母線は $\\sqrt{${rr * rr} + ${k * k * h * h}} = ${n(l2, 4)}$ です。`],
              [`The area is proportional to $\\ell$, so the factor is $${n(l2, 4)}/${n(l1, 4)} = ${n(f, 4)}$, less than ${k}: the volume doubles when the height doubles, the curved area does not.`, `面積は $\\ell$ に比例するので倍率は $${n(l2, 4)}/${n(l1, 4)} = ${n(f, 4)}$ で、${k} より小さくなります。高さを 2 倍にすると体積は 2 倍ですが、側面積はそうなりません。`]],
        set: h * k <= 10 ? { exp: 'cone', r: rr, h: h * k } : { exp: 'cone', r: rr, h },
      };
    },
  ];

  /* ---------- scaling: lengths, areas, volumes ---------- */
  Q['explore-geometry-mensuration-scale'] = [
    (r) => {
      const form = r.int(0, 2);
      const k = r.pick([0.5, 1.5, 2, 2.5, 3]);
      if (form === 0) {
        return {
          q: [`Every length of a shape is multiplied by ${n(k)}. By what factor does its area change?`, `図形のすべての長さを ${n(k)} 倍にします。面積は何倍になりますか。`],
          a: { type: 'num', v: k * k, tol: 1e-6 },
          hint: ['Area is length times length.', '面積は長さ掛ける長さです。'],
          sol: [[`Area scales as the square of the length factor: $${n(k)}^2 = ${n(k * k)}$.`, `面積は長さの倍率の 2 乗で変わります：$${n(k)}^2 = ${n(k * k)}$。`],
                [`Doubling lengths gives 4 times the area, not 2 times.`, `長さを 2 倍にすると、面積は 2 倍ではなく 4 倍になります。`]],
          set: { exp: 'scale', k },
        };
      }
      if (form === 1) {
        return {
          q: [`Every length of a solid is multiplied by ${n(k)}. By what factor does its volume change?`, `立体のすべての長さを ${n(k)} 倍にします。体積は何倍になりますか。`],
          a: { type: 'num', v: k ** 3, tol: 1e-6 },
          hint: ['Volume is length times length times length.', '体積は長さを 3 回掛けたものです。'],
          sol: [[`Volume scales as the cube of the length factor: $${n(k)}^3 = ${n(k ** 3)}$.`, `体積は長さの倍率の 3 乗で変わります：$${n(k)}^3 = ${n(k ** 3)}$。`],
                [`Halving every length leaves only one eighth of the volume.`, `すべての長さを半分にすると、体積は 8 分の 1 になります。`]],
          set: { exp: 'scale', k },
        };
      }
      const A = r.int(2, 20);
      return {
        q: [`A figure has area ${A}. A similar figure scaled by ${n(k)} has what area?`, `面積 ${A} の図形があります。${n(k)} 倍に拡大・縮小した相似な図形の面積はいくつですか。`],
        a: { type: 'num', v: A * k * k, tol: 0.0006 },
        hint: ['Multiply the old area by $k^2$.', 'もとの面積に $k^2$ を掛けます。'],
        sol: [[`New area $= k^2 A = ${n(k * k)} \\cdot ${A} = ${n(A * k * k, 4)}$.`, `新しい面積は $k^2 A = ${n(k * k)} \\cdot ${A} = ${n(A * k * k, 4)}$ です。`],
              [`This only holds for similar figures, where every length is multiplied by the same $k$.`, `これは、すべての長さに同じ $k$ を掛ける相似な図形でのみ成り立ちます。`]],
        set: { exp: 'scale', k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([0.5, 1.5, 2, 2.5, 3]);
        const V = r.int(2, 30);
        return {
          q: [`A tank holds ${V} litres. A similar tank is built with every length multiplied by ${n(k)}. How many litres does it hold?`, `容量 ${V} リットルのタンクがあります。すべての長さを ${n(k)} 倍にした相似なタンクの容量は何リットルですか。`],
          a: { type: 'num', v: V * k ** 3, tol: 0.006 },
          hint: ['Capacity is a volume.', '容量は体積です。'],
          sol: [[`Volume factor $k^3 = ${n(k ** 3)}$.`, `体積の倍率は $k^3 = ${n(k ** 3)}$ です。`],
                [`${V} $\\times ${n(k ** 3)} = ${n(V * k ** 3, 4)}$ litres.`, `${V} $\\times ${n(k ** 3)} = ${n(V * k ** 3, 4)}$ リットルです。`]],
          set: { exp: 'scale', k },
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 1.5, 2.5, 0.5]);
        const fa = k * k;
        return {
          q: [`Scaling a shape changes its area by a factor of ${n(fa)}. By what factor were its lengths multiplied? (Positive answer.)`, `図形を拡大・縮小したところ、面積が ${n(fa)} 倍になりました。長さは何倍にしたのですか（正の値）。`],
          a: { type: 'num', v: k, tol: 1e-6 },
          hint: ['Take a square root.', '平方根をとります。'],
          sol: [[`$k^2 = ${n(fa)}$, so $k = \\sqrt{${n(fa)}} = ${n(k)}$.`, `$k^2 = ${n(fa)}$ なので $k = \\sqrt{${n(fa)}} = ${n(k)}$ です。`],
                [`The volume of that scaling would change by $k^3 = ${n(k ** 3)}$.`, `この拡大・縮小で体積は $k^3 = ${n(k ** 3)}$ 倍になります。`]],
          set: { exp: 'scale', k },
        };
      }
      const k = r.pick([2, 3, 1.5, 2.5, 0.5, 0.8]);
      const fv = k ** 3;
      return {
        q: [`A solid's volume is multiplied by ${n(fv, 4)} under scaling. By what factor are its surface areas multiplied?`, `拡大・縮小によって立体の体積が ${n(fv, 4)} 倍になりました。表面積は何倍になりますか。`],
        a: { type: 'num', v: k * k, tol: 0.0006 },
        hint: ['First recover $k$ from the volume factor $k^3$.', 'まず体積の倍率 $k^3$ から $k$ を求めます。'],
        sol: [[`$k = ${n(fv, 4)}^{1/3} = ${n(k)}$.`, `$k = ${n(fv, 4)}^{1/3} = ${n(k)}$ です。`],
              [`Areas scale as $k^2 = ${n(k * k, 4)}$. In general area factor = (volume factor)$^{2/3}$.`, `面積は $k^2 = ${n(k * k, 4)}$ 倍です。一般に、面積の倍率 =（体積の倍率）$^{2/3}$ です。`]],
        set: { exp: 'scale', k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: [`A sphere has surface area $A = 4\\pi r^2$ and volume $V = \\tfrac43\\pi r^3$. Write $V$ as a function of $A$ alone.`, `球の表面積は $A = 4\\pi r^2$、体積は $V = \\tfrac43\\pi r^3$ です。$V$ を $A$ だけの関数として表してください。`],
          a: { type: 'expr', v: 'A^(3/2)/(6*sqrt(pi))', vars: ['A'], lhs: ['$V(A)=$', '$V(A)=$'] },
          hint: ['Solve $A = 4\\pi r^2$ for $r$ and substitute.', '$A = 4\\pi r^2$ を $r$ について解いて代入します。'],
          sol: [[`$r = \\sqrt{A/(4\\pi)}$, so $r^3 = A^{3/2}/(8\\pi^{3/2})$.`, `$r = \\sqrt{A/(4\\pi)}$ なので $r^3 = A^{3/2}/(8\\pi^{3/2})$ です。`],
                [`$V = \\tfrac43\\pi r^3 = \\dfrac{A^{3/2}}{6\\sqrt\\pi}$. Volume goes as area to the power $3/2$: the square-cube law in one formula.`, `$V = \\tfrac43\\pi r^3 = \\dfrac{A^{3/2}}{6\\sqrt\\pi}$ です。体積は面積の $3/2$ 乗に比例します。2 乗・3 乗の法則を 1 つの式にしたものです。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 4, 5, 10]);
        return {
          q: [`The ratio (surface area) / (volume) of a solid is $S/V$. If every length is multiplied by ${k}, by what factor is $S/V$ multiplied? (Enter a decimal or fraction.)`, `立体の（表面積）/（体積）の比を $S/V$ とします。すべての長さを ${k} 倍にすると、$S/V$ は何倍になりますか（小数または分数で入力）。`],
          a: { type: 'num', v: 1 / k, tol: 1e-6, show: frac(1, k) },
          hint: ['Area scales as $k^2$, volume as $k^3$.', '面積は $k^2$、体積は $k^3$ で変わります。'],
          sol: [[`$S/V$ is multiplied by $k^2/k^3 = 1/k = 1/${k}$.`, `$S/V$ は $k^2/k^3 = 1/k = 1/${k}$ 倍になります。`],
                [`Big objects have relatively less surface for their volume, which is why a large animal loses heat more slowly than a small one.`, `大きな物体は体積に対して表面が相対的に少なくなります。大きな動物が小さな動物より熱を失いにくいのはそのためです。`]],
          set: { exp: 'scale', k: Math.min(3, k) },
        };
      }
      const k = r.pick([2, 3, 4]);
      const m = r.int(1, 9);
      return {
        q: [`A solid statue of mass ${m} kg is replaced by a similar statue of the same material, ${k} times as tall. Its surface needs paint in proportion to its area. Compare the mass per unit of painted area, new over old.`, `質量 ${m} kg の中実の像を、同じ材料で ${k} 倍の高さの相似な像に置き換えます。塗装が必要な面積は表面積に比例します。塗装面積あたりの質量について、新しい像と古い像の比（新/旧）を求めてください。`],
        a: { type: 'num', v: k, tol: 1e-6 },
        hint: ['Mass scales as volume ($k^3$), paint as area ($k^2$).', '質量は体積（$k^3$）、塗料は面積（$k^2$）に比例します。'],
        sol: [[`New mass $= ${k}^3 m$ and new area $= ${k}^2 A$.`, `新しい質量は $${k}^3 m$、新しい面積は $${k}^2 A$ です。`],
              [`Mass per area is multiplied by $${k}^3/${k}^2 = ${k}$. The bigger statue carries ${k} times more material behind each patch of surface.`, `面積あたりの質量は $${k}^3/${k}^2 = ${k}$ 倍になります。大きい像では、表面の同じ面積の裏側に ${k} 倍の材料があります。`]],
        set: { exp: 'scale', k: Math.min(3, k) },
      };
    },
  ];
})();
