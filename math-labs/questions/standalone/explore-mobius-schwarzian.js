'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const K = 'explore-mobius-schwarzian-';
  const Tstr = (a, b, c, d, v = 'z') => `\\dfrac{${terms([[a, v], [b, '']])}}{${terms([[c, v], [d, '']])}}`;
  const sg = (c) => (c < 0 ? `- ${n(-c)}` : `+ ${n(c)}`);
  const randT = (r, lo = 1, hi = 4) => { let a, b, c, d; do { a = r.int(lo, hi); b = r.int(lo, hi); c = r.int(lo, hi); d = r.int(lo, hi); } while (a * d === b * c); return [a, b, c, d]; };

  /* ---------- Mo\u0308bius maps ---------- */
  Q[K + 'mobius'] = [
    (r) => {
      const form = r.int(0, 2);
      let a, b, c, d; do { a = r.nz(-4, 4); b = r.int(-4, 4); c = r.nz(-4, 4); d = r.nz(-4, 4); } while (a * d === b * c);
      if (form === 0) return {
        q: [`$T(z) = ${Tstr(a, b, c, d)}$. At which $z$ is $T$ not finite (the pole)?`, `$T(z) = ${Tstr(a, b, c, d)}$ です。$T$ が有限でなくなる点（極）はどこですか。`],
        a: { type: 'num', v: -d / c, show: frac(-d, c) },
        sol: [[`The denominator $${terms([[c, 'z'], [d, '']])}$ vanishes at $z = ${frac(-d, c)}$.`, `分母 $${terms([[c, 'z'], [d, '']])}$ が 0 になるのは $z = ${frac(-d, c)}$ のときです。`], ['That point is sent to $\\infty$ on the Riemann sphere, so it is not a hole but an ordinary point of the sphere.', 'この点はリーマン球面上で $\\infty$ に写るので、穴ではなく球面上の普通の点です。']],
      };
      if (form === 1) return {
        q: [`$T(z) = ${Tstr(a, b, c, d)}$. What finite value does $T$ approach as $z \\to \\infty$?`, `$T(z) = ${Tstr(a, b, c, d)}$ です。$z \\to \\infty$ のとき $T$ が近づく値を求めてください。`],
        a: { type: 'num', v: a / c, show: frac(a, c) },
        hint: ['Divide numerator and denominator by $z$.', '分子と分母を $z$ で割ります。'],
        sol: [[`$T(z) = \\dfrac{${n(a)} + ${n(b)}/z}{${n(c)} + ${n(d)}/z} \\to \\dfrac{${n(a)}}{${n(c)}}$.`, `$T(z) = \\dfrac{${n(a)} + ${n(b)}/z}{${n(c)} + ${n(d)}/z} \\to \\dfrac{${n(a)}}{${n(c)}}$ です。`], [`So $T(\\infty) = ${frac(a, c)}$.`, `したがって $T(\\infty) = ${frac(a, c)}$ です。`]],
      };
      return {
        q: [`$T(z) = ${Tstr(a, b, c, d)}$. Find $T(0)$.`, `$T(z) = ${Tstr(a, b, c, d)}$ です。$T(0)$ を求めてください。`],
        a: { type: 'num', v: b / d, show: frac(b, d) },
        sol: [[`$T(0) = ${n(b)}/${n(d)} = ${frac(b, d)}$.`, `$T(0) = ${n(b)}/${n(d)} = ${frac(b, d)}$ です。`], ['The constant terms alone decide the image of the origin.', '原点の像は定数項だけで決まります。']],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const [a, b, c, d] = randT(r, 1, 4), z0 = r.int(1, 5), v = (a * z0 + b) / (c * z0 + d);
        return {
          q: [`$T(z) = ${Tstr(a, b, c, d)}$. Evaluate $T(${z0})$.`, `$T(z) = ${Tstr(a, b, c, d)}$ です。$T(${z0})$ を求めてください。`],
          a: { type: 'num', v, show: frac(a * z0 + b, c * z0 + d) },
          sol: [[`$T(${z0}) = \\dfrac{${a * z0 + b}}{${c * z0 + d}} = ${frac(a * z0 + b, c * z0 + d)}$.`, `$T(${z0}) = \\dfrac{${a * z0 + b}}{${c * z0 + d}} = ${frac(a * z0 + b, c * z0 + d)}$ です。`]],
        };
      }
      if (form === 1) {
        const x = r.int(-3, 3), y = r.int(0, 3), re = x * x + (y - 1) ** 2, de = x * x + (y + 1) ** 2, v = Math.sqrt(re / de);
        return {
          q: [`Cayley map $T(z) = \\dfrac{z - i}{z + i}$. Find $|T(z_0)|$ for $z_0 = ${x} + ${y}i$. Give three decimals.`, `ケイリー写像 $T(z) = \\dfrac{z - i}{z + i}$ について、$z_0 = ${x} + ${y}i$ での $|T(z_0)|$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['$|T(z)|$ compares the distance from $z$ to $i$ with the distance from $z$ to $-i$.', '$|T(z)|$ は、$z$ から $i$ までの距離と $-i$ までの距離の比です。'],
          sol: [[`$|z_0 - i|^2 = ${x * x} + ${(y - 1) ** 2} = ${re}$ and $|z_0 + i|^2 = ${x * x} + ${(y + 1) ** 2} = ${de}$.`, `$|z_0 - i|^2 = ${x * x} + ${(y - 1) ** 2} = ${re}$、$|z_0 + i|^2 = ${x * x} + ${(y + 1) ** 2} = ${de}$ です。`], [`$|T(z_0)| = \\sqrt{${re}/${de}} = ${n(v, 4)}$.`, `$|T(z_0)| = \\sqrt{${re}/${de}} = ${n(v, 4)}$ です。`], [`${y > 0 ? 'It is below 1 because $z_0$ is in the upper half-plane: the Cayley map sends the upper half-plane into the unit disc.' : 'On the real axis the point is equidistant from $i$ and $-i$, so $|T| = 1$: the real line goes to the unit circle.'}`, `${y > 0 ? '$z_0$ が上半平面にあるので 1 より小さくなります。ケイリー写像は上半平面を単位円板に写します。' : '実軸上の点は $i$ と $-i$ から等距離なので $|T| = 1$ です。実軸は単位円に写ります。'}`]],
        };
      }
      if (form === 2) {
        const A = randT(r, 1, 3), B = randT(r, 1, 3), z0 = r.int(1, 3);
        const ap = (m, z) => (m[0] * z + m[1]) / (m[2] * z + m[3]);
        const v = ap(A, ap(B, z0));
        const M = [[A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3]], [A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]]];
        return {
          q: [`$T_1(z) = ${Tstr(...A)}$ and $T_2(z) = ${Tstr(...B)}$. Find $(T_1\\circ T_2)(${z0})$. Give three decimals.`, `$T_1(z) = ${Tstr(...A)}$、$T_2(z) = ${Tstr(...B)}$ です。$(T_1\\circ T_2)(${z0})$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4, show: frac(M[0][0] * z0 + M[0][1], M[1][0] * z0 + M[1][1]) },
          hint: ['Composition of Mo\u0308bius maps is the product of their matrices.', 'メビウス変換の合成は、行列の積に対応します。'],
          sol: [[`Multiply the matrices: $${P.util.mat([[n(A[0]), n(A[1])], [n(A[2]), n(A[3])]])}${P.util.mat([[n(B[0]), n(B[1])], [n(B[2]), n(B[3])]])} = ${P.util.mat(M)}$.`, `行列を掛けます。$${P.util.mat([[n(A[0]), n(A[1])], [n(A[2]), n(A[3])]])}${P.util.mat([[n(B[0]), n(B[1])], [n(B[2]), n(B[3])]])} = ${P.util.mat(M)}$ です。`], [`So $T_1\\circ T_2 = \\dfrac{${terms([[M[0][0], 'z'], [M[0][1], '']])}}{${terms([[M[1][0], 'z'], [M[1][1], '']])}}$, and at $z = ${z0}$ this is $${frac(M[0][0] * z0 + M[0][1], M[1][0] * z0 + M[1][1])} = ${n(v, 4)}$.`, `したがって $T_1\\circ T_2 = \\dfrac{${terms([[M[0][0], 'z'], [M[0][1], '']])}}{${terms([[M[1][0], 'z'], [M[1][1], '']])}}$ で、$z = ${z0}$ では $${frac(M[0][0] * z0 + M[0][1], M[1][0] * z0 + M[1][1])} = ${n(v, 4)}$ です。`]],
        };
      }
      const kk = r.pick([1, 2, 3, 4, 0.5]);
      return {
        q: [`Under $w = 1/z$, the vertical line $\\mathrm{Re}\\,z = ${n(kk)}$ becomes a circle. What is its radius?`, `$w = 1/z$ によって、鉛直線 $\\mathrm{Re}\\,z = ${n(kk)}$ は円になります。その半径を求めてください。`],
        a: { type: 'num', v: 1 / (2 * kk), show: frac(1, 2 * kk) },
        hint: ['Write $w = u + iv$ and use $z = 1/w$.', '$w = u + iv$ とおいて $z = 1/w$ を使います。'],
        sol: [[`$\\mathrm{Re}(1/w) = u/(u^2 + v^2) = ${n(kk)}$, so $u^2 + v^2 = u/${n(kk)}$.`, `$\\mathrm{Re}(1/w) = u/(u^2 + v^2) = ${n(kk)}$ より $u^2 + v^2 = u/${n(kk)}$ です。`], [`Completing the square: $(u - ${frac(1, 2 * kk)})^2 + v^2 = (${frac(1, 2 * kk)})^2$.`, `平方完成すると $(u - ${frac(1, 2 * kk)})^2 + v^2 = (${frac(1, 2 * kk)})^2$ です。`], [`Radius $${frac(1, 2 * kk)}$, passing through the origin: a line not through $0$ becomes a circle through $0$ (the image of $\\infty$).`, `半径は $${frac(1, 2 * kk)}$ で、原点を通ります。$0$ を通らない直線は、$\\infty$ の像である $0$ を通る円になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        let a, b, c, d; do { a = r.int(-3, 3); b = r.int(-3, 3); c = r.nz(-3, 3); d = r.nz(-3, 3); } while (a * d === b * c || c + d === 0);
        const t0 = b / d, t1 = (a + b) / (c + d), tinf = a / c;
        return {
          q: [`A Mo\u0308bius map $T$ sends $0 \\mapsto ${frac(b, d)}$, $1 \\mapsto ${frac(a + b, c + d)}$ and $\\infty \\mapsto ${frac(a, c)}$. Write $T(z)$.`, `メビウス変換 $T$ は $0 \\mapsto ${frac(b, d)}$、$1 \\mapsto ${frac(a + b, c + d)}$、$\\infty \\mapsto ${frac(a, c)}$ を満たします。$T(z)$ を求めてください。`],
          a: { type: 'expr', v: `(${a}*z+${b})/(${c}*z+${d})`, vars: ['z'], dom: { z: [0.3, 2.2] }, lhs: ['$T(z) =$', '$T(z) =$'] },
          hint: ['Three points determine a Mo\u0308bius map. Use $T(\\infty) = a/c$, $T(0) = b/d$, then fit $T(1)$.', '三点でメビウス変換は決まります。$T(\\infty) = a/c$、$T(0) = b/d$ を使い、$T(1)$ で合わせます。'],
          sol: [[`$T(\\infty) = a/c = ${frac(a, c)}$ and $T(0) = b/d = ${frac(b, d)}$ fix the ratios $a:c$ and $b:d$.`, `$T(\\infty) = a/c = ${frac(a, c)}$ と $T(0) = b/d = ${frac(b, d)}$ で、比 $a:c$ と $b:d$ が決まります。`], [`The remaining common scale comes from $T(1) = (a + b)/(c + d) = ${frac(a + b, c + d)}$.`, `残りの共通の倍率は $T(1) = (a + b)/(c + d) = ${frac(a + b, c + d)}$ から決まります。`], [`One solution is $T(z) = ${Tstr(a, b, c, d)}$; any nonzero multiple of all four coefficients is the same map.`, `一つの解は $T(z) = ${Tstr(a, b, c, d)}$ で、四つの係数を同じ非零倍したものも同じ写像です。`]],
        };
      }
      if (form === 1) {
        const p = r.int(-3, 3), q = r.int(-3, 3).valueOf(); const qq = q === p ? q + 2 : q;
        let a; do { a = r.int(-3, 3); } while (a * (a - p - qq) + p * qq === 0);
        const b = -p * qq, d = a - (p + qq);
        return {
          q: [`$T(z) = \\dfrac{${terms([[a, 'z'], [b, '']])}}{z ${sg(d)}}$ has two fixed points. What is the larger one?`, `$T(z) = \\dfrac{${terms([[a, 'z'], [b, '']])}}{z ${sg(d)}}$ には固定点が二つあります。大きい方を求めてください。`],
          a: { type: 'int', v: Math.max(p, qq) },
          hint: ['Fixed points solve $T(z) = z$, a quadratic after clearing the denominator.', '固定点は $T(z) = z$ の解で、分母を払うと二次方程式になります。'],
          sol: [[`$T(z) = z$ gives $z(z ${sg(d)}) = ${terms([[a, 'z'], [b, '']])}$, i.e. $z^2 ${sg(d - a)}z ${sg(-b)} = 0$.`, `$T(z) = z$ から $z(z ${sg(d)}) = ${terms([[a, 'z'], [b, '']])}$、すなわち $z^2 ${sg(d - a)}z ${sg(-b)} = 0$ です。`], [`Factor: $(z - ${p})(z - ${qq}) = 0$.`, `因数分解すると $(z - ${p})(z - ${qq}) = 0$ です。`], [`The fixed points are $${p}$ and $${qq}$. A non-identity Mo\u0308bius map has at most two, and these two are the invariant "axis" of the transformation.`, `固定点は $${p}$ と $${qq}$ です。恒等でないメビウス変換の固定点は高々二つで、この二点が変換の不変な「軸」です。`]],
        };
      }
      if (form === 2) {
        const p = r.int(1, 4), q = r.int(1, 4);
        return {
          q: [`For which $t$ does $T(z) = \\dfrac{z + ${p}}{${q}z + t}$ fail to be a Mo\u0308bius map (it collapses to a constant)?`, `$T(z) = \\dfrac{z + ${p}}{${q}z + t}$ がメビウス変換でなくなる（定数に退化する）$t$ を求めてください。`],
          a: { type: 'int', v: p * q },
          hint: ['A Mo\u0308bius map needs $ad - bc \\ne 0$.', 'メビウス変換には $ad - bc \\ne 0$ が必要です。'],
          sol: [[`$ad - bc = t - ${p}\\cdot ${q} = t - ${p * q}$.`, `$ad - bc = t - ${p}\\cdot ${q} = t - ${p * q}$ です。`], [`It vanishes at $t = ${p * q}$, where the numerator is a multiple of the denominator and $T \\equiv ${frac(1, q)}$.`, `$t = ${p * q}$ で 0 になり、このとき分子は分母の定数倍で $T \\equiv ${frac(1, q)}$ です。`]],
        };
      }
      const pts = r.sample([1, 2, 3, 4, 5, 6], 4), [z1, z2, z3, z4] = pts;
      const cr = ((z1 - z3) * (z2 - z4)) / ((z1 - z4) * (z2 - z3));
      const [a, b, c, d] = randT(r, 1, 3);
      return {
        q: [`$T(z) = ${Tstr(a, b, c, d)}$ sends the points $${z1}, ${z2}, ${z3}, ${z4}$ to four new points. What is the cross-ratio $\\dfrac{(w_1 - w_3)(w_2 - w_4)}{(w_1 - w_4)(w_2 - w_3)}$ of the images? Give three decimals.`, `$T(z) = ${Tstr(a, b, c, d)}$ は点 $${z1}, ${z2}, ${z3}, ${z4}$ を四つの新しい点に写します。像の複比 $\\dfrac{(w_1 - w_3)(w_2 - w_4)}{(w_1 - w_4)(w_2 - w_3)}$ を求めてください（小数第3位まで）。`],
        a: { type: 'num', v: cr, tol: 6e-4, show: frac((z1 - z3) * (z2 - z4), (z1 - z4) * (z2 - z3)) },
        hint: ['The cross-ratio is invariant under every Mo\u0308bius map, so you can compute it from the original points.', '複比はどのメビウス変換でも不変なので、元の点から計算できます。'],
        sol: [[`By invariance, the answer equals the cross-ratio of the original points.`, `不変性により、答えは元の点の複比に等しくなります。`], [`$\\dfrac{(${z1} - ${z3})(${z2} - ${z4})}{(${z1} - ${z4})(${z2} - ${z3})} = \\dfrac{${(z1 - z3) * (z2 - z4)}}{${(z1 - z4) * (z2 - z3)}} = ${n(cr, 4)}$.`, `$\\dfrac{(${z1} - ${z3})(${z2} - ${z4})}{(${z1} - ${z4})(${z2} - ${z3})} = \\dfrac{${(z1 - z3) * (z2 - z4)}}{${(z1 - z4) * (z2 - z3)}} = ${n(cr, 4)}$ です。`], ['This invariant is why a Mo\u0308bius map is determined by three points: the fourth is then forced by the cross-ratio.', 'この不変量のため、メビウス変換は三点で決まります。四点目は複比によって決まるからです。']],
      };
    },
  ];

  /* ---------- Schwarzian ---------- */
  const S3 = (f1, f2, f3) => f3 / f1 - 1.5 * (f2 / f1) ** 2;
  Q[K + 'schwarzian'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3, 4, 0.5, 1.5]);
        return {
          q: [`Find the Schwarzian $S(f)$ of $f(z) = e^{${n(a)}z}$.`, `$f(z) = e^{${n(a)}z}$ のシュワルツ微分 $S(f)$ を求めてください。`],
          a: { type: 'num', v: -a * a / 2, show: frac(-a * a * 4, 8) },
          hint: ['$f\' = a f$, $f\'\' = a^2 f$, $f\'\'\' = a^3 f$.', '$f\' = a f$、$f\'\' = a^2 f$、$f\'\'\' = a^3 f$ です。'],
          sol: [[`$f'''/f' = ${n(a * a)}$ and $f''/f' = ${n(a)}$.`, `$f\'\'\'/f\' = ${n(a * a)}$、$f\'\'/f\' = ${n(a)}$ です。`], [`$S(f) = ${n(a * a)} - \\tfrac{3}{2}(${n(a)})^2 = ${n(-a * a / 2)}$.`, `$S(f) = ${n(a * a)} - \\tfrac{3}{2}(${n(a)})^2 = ${n(-a * a / 2)}$ です。`], ['It is a nonzero constant, so $e^{az}$ is nowhere locally Mo\u0308bius (it is not a fractional-linear map in any neighborhood).', '0 でない定数なので、$e^{az}$ はどこでも局所的にメビウスではありません。']],
        };
      }
      if (form === 1) {
        const cand = [['\\dfrac{2z + 1}{3z - 4}', '\\dfrac{2z + 1}{3z - 4}'], ['\\dfrac{1}{z + 5}', '\\dfrac{1}{z + 5}'], ['\\dfrac{z - 3}{z + 2}', '\\dfrac{z - 3}{z + 2}']];
        const m = r.pick(cand), bad = ['z^3', 'e^{z}', '\\log z', 'z^2 + z'];
        const wrong = r.sample(bad, 3), pos = r.int(0, 3), opts = wrong.map((w) => [`$${w}$`, `$${w}$`]); opts.splice(pos, 0, [`$${m[0]}$`, `$${m[0]}$`]);
        return {
          q: ['Which of these functions has Schwarzian $S(f) \\equiv 0$?', '次の関数のうち、シュワルツ微分が恒等的に $0$ になるものはどれですか。'],
          a: { type: 'choice', fixed: true, opts, v: pos },
          hint: ['$S(f) = 0$ exactly for the fractional-linear maps.', '$S(f) = 0$ となるのは分数線形写像だけです。'],
          sol: [[`$S(f) = 0$ exactly when $f$ is locally Mo\u0308bius, $f = (az + b)/(cz + d)$.`, `$S(f) = 0$ となるのは、$f$ が局所的にメビウス変換 $f = (az + b)/(cz + d)$ であるときに限ります。`], [`Only $${m[0]}$ has that form. The others have nonzero $S$, for example $S(z^3) = -4/z^2$.`, `この形なのは $${m[0]}$ だけです。他は $S$ が 0 でなく、たとえば $S(z^3) = -4/z^2$ です。`]],
        };
      }
      const a = r.pick([1, 2, 3, 0.5]);
      return {
        q: [`Find $S(f)$ for $f(z) = \\tan(${n(a)}z)$.`, `$f(z) = \\tan(${n(a)}z)$ の $S(f)$ を求めてください。`],
        a: { type: 'num', v: 2 * a * a },
        hint: ['Use $f\' = a\\sec^2$ and note $S$ is constant here.', '$f\' = a\\sec^2$ を使います。$S$ は定数になります。'],
        sol: [[`With $\\tan$, $S(\\tan z) = 2$, and the scaling $z \\mapsto ${n(a)}z$ multiplies $S$ by $${n(a)}^2$.`, `$S(\\tan z) = 2$ で、$z \\mapsto ${n(a)}z$ の拡大は $S$ を $${n(a)}^2$ 倍します。`], [`So $S(f) = 2\\cdot ${n(a * a)} = ${n(2 * a * a)}$.`, `したがって $S(f) = 2\\cdot ${n(a * a)} = ${n(2 * a * a)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const nn = r.int(2, 6), z0 = r.pick([0.5, 1, 2, 3]), v = (1 - nn * nn) / (2 * z0 * z0);
        return {
          q: [`Evaluate $S(f)(${n(z0)})$ for $f(z) = z^{${nn}}$.`, `$f(z) = z^{${nn}}$ について $S(f)(${n(z0)})$ を求めてください。`],
          a: { type: 'num', v, show: frac(1 - nn * nn, 2 * z0 * z0) },
          hint: ['$S(z^n) = (1 - n^2)/(2z^2)$; or compute from $f\', f\'\', f\'\'\'$.', '$S(z^n) = (1 - n^2)/(2z^2)$ です。$f\', f\'\', f\'\'\'$ から計算してもかまいません。'],
          sol: [[`$S(z^n) = \\dfrac{1 - n^2}{2z^2}$, here $n = ${nn}$.`, `$S(z^n) = \\dfrac{1 - n^2}{2z^2}$ で、ここでは $n = ${nn}$ です。`], [`$S = \\dfrac{${1 - nn * nn}}{2(${n(z0)})^2} = ${n(v, 4)}$.`, `$S = \\dfrac{${1 - nn * nn}}{2(${n(z0)})^2} = ${n(v, 4)}$ です。`], [`It is negative and blows up at $0$: $z^n$ is far from Mo\u0308bius near its branch/critical point.`, `負で、$0$ で発散します。$z^n$ は臨界点の近くでメビウス変換から大きく離れます。`]],
        };
      }
      if (form === 1) {
        const f1 = r.nz(-3, 3), f2 = r.int(-4, 4), f3 = r.int(-6, 6), v = S3(f1, f2, f3);
        return {
          q: [`At a point, $f' = ${f1}$, $f'' = ${f2}$, $f''' = ${f3}$. Find $S(f)$ there.`, `ある点で $f' = ${f1}$、$f'' = ${f2}$、$f''' = ${f3}$ です。そこでの $S(f)$ を求めてください。`],
          a: { type: 'num', v, show: frac(2 * f3 * f1 - 3 * f2 * f2, 2 * f1 * f1) },
          sol: [[`$S = f'''/f' - \\tfrac{3}{2}(f''/f')^2 = \\dfrac{${f3}}{${f1}} - \\tfrac{3}{2}\\left(\\dfrac{${f2}}{${f1}}\\right)^2$.`, `$S = f\'\'\'/f\' - \\tfrac{3}{2}(f\'\'/f\')^2 = \\dfrac{${f3}}{${f1}} - \\tfrac{3}{2}\\left(\\dfrac{${f2}}{${f1}}\\right)^2$ です。`], [`$= ${n(v, 4)}$.`, `$= ${n(v, 4)}$ です。`], [`${Math.abs(v) < 1e-12 ? 'Zero: to third order this map agrees with a Mo\u0308bius map at the point.' : 'Nonzero: no Mo\u0308bius map matches $f$ through third order here.'}`, `${Math.abs(v) < 1e-12 ? '0 なので、この点では三階まで一致するメビウス変換があります。' : '0 でないので、この点で三階まで一致するメビウス変換はありません。'}`]],
        };
      }
      if (form === 2) {
        const z0 = r.pick([0.5, 1, 2, 4]);
        return {
          q: [`Evaluate $S(\\log z)$ at $z = ${n(z0)}$.`, `$z = ${n(z0)}$ での $S(\\log z)$ を求めてください。`],
          a: { type: 'num', v: 1 / (2 * z0 * z0), show: frac(1, 2 * z0 * z0) },
          sol: [[`$f' = 1/z$, $f'' = -1/z^2$, $f''' = 2/z^3$.`, `$f\' = 1/z$、$f\'\' = -1/z^2$、$f\'\'\' = 2/z^3$ です。`], [`$S = 2/z^2 - \\tfrac{3}{2}/z^2 = \\dfrac{1}{2z^2} = ${frac(1, 2 * z0 * z0)}$.`, `$S = 2/z^2 - \\tfrac{3}{2}/z^2 = \\dfrac{1}{2z^2} = ${frac(1, 2 * z0 * z0)}$ です。`]],
        };
      }
      const a = r.int(1, 3), nn = r.int(2, 5), k = r.int(1, 5);
      return {
        q: [`$S(f)$ is unchanged when $f$ is followed by a Mo\u0308bius map. For $f(z) = \\dfrac{1}{z^{${nn}} + ${k}}$, evaluate $S(f)$ at $z = 1$.`, `$S(f)$ は $f$ のあとにメビウス変換を合成しても変わりません。$f(z) = \\dfrac{1}{z^{${nn}} + ${k}}$ について $z = 1$ での $S(f)$ を求めてください。`],
        a: { type: 'num', v: (1 - nn * nn) / 2, show: frac(1 - nn * nn, 2) },
        hint: ['$f = T\\circ g$ with $T = 1/w$ and $g = z^n + k$; also adding a constant to $g$ does not change $S$.', '$f = T\\circ g$（$T = 1/w$、$g = z^n + k$）と見ます。$g$ に定数を足しても $S$ は変わりません。'],
        sol: [[`$S(T\\circ g) = S(g)$ because $S(T) = 0$ for a Mo\u0308bius $T$.`, `$T$ がメビウス変換なので $S(T) = 0$ となり、$S(T\\circ g) = S(g)$ です。`], [`$S(z^{${nn}} + ${k}) = S(z^{${nn}}) = \\dfrac{${1 - nn * nn}}{2z^2}$, which is $${frac(1 - nn * nn, 2)}$ at $z = 1$.`, `$S(z^{${nn}} + ${k}) = S(z^{${nn}}) = \\dfrac{${1 - nn * nn}}{2z^2}$ で、$z = 1$ では $${frac(1 - nn * nn, 2)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(2, 6);
        return {
          q: [`Write $S(z^{${nn}})$ as a function of $z$.`, `$S(z^{${nn}})$ を $z$ の式で表してください。`],
          a: { type: 'expr', v: `${1 - nn * nn}/(2*z^2)`, vars: ['z'], lhs: ['$S =$', '$S =$'] },
          sol: [[`$f' = ${nn}z^{${nn - 1}}$, $f'' = ${nn * (nn - 1)}z^{${nn - 2}}$, $f''' = ${nn * (nn - 1) * (nn - 2)}z^{${nn - 3}}$.`, `$f\' = ${nn}z^{${nn - 1}}$、$f\'\' = ${nn * (nn - 1)}z^{${nn - 2}}$、$f\'\'\' = ${nn * (nn - 1) * (nn - 2)}z^{${nn - 3}}$ です。`], [`$f'''/f' = ${(nn - 1) * (nn - 2)}/z^2$ and $f''/f' = ${nn - 1}/z$.`, `$f\'\'\'/f\' = ${(nn - 1) * (nn - 2)}/z^2$、$f\'\'/f\' = ${nn - 1}/z$ です。`], [`$S = \\dfrac{${(nn - 1) * (nn - 2)} - 1.5\\cdot ${(nn - 1) ** 2}}{z^2} = \\dfrac{${1 - nn * nn}}{2z^2}$. It vanishes only for $n = \\pm 1$ (and $n = 0$, a constant, is excluded): powers are Mo\u0308bius exactly when they are $z$ or $1/z$.`, `$S = \\dfrac{${(nn - 1) * (nn - 2)} - 1.5\\cdot ${(nn - 1) ** 2}}{z^2} = \\dfrac{${1 - nn * nn}}{2z^2}$ です。0 になるのは $n = \\pm 1$ のときだけ（$n = 0$ は定数で除きます）で、べき関数がメビウスなのは $z$ と $1/z$ に限ります。`]],
        };
      }
      const a = r.int(1, 3);
      if (form === 1) return {
        q: [`Use the chain rule $S(f\\circ g) = (S(f)\\circ g)\\,(g')^2 + S(g)$ to find $S(f)$ for $f(z) = e^{${a}z^2}$.`, `連鎖律 $S(f\\circ g) = (S(f)\\circ g)\\,(g')^2 + S(g)$ を使って、$f(z) = e^{${a}z^2}$ の $S(f)$ を求めてください。`],
        a: { type: 'expr', v: `-${2 * a * a}*z^2-3/(2*z^2)`, vars: ['z'], lhs: ['$S(f) =$', '$S(f) =$'] },
        hint: [`Take the outer map $e^{${a}w}$ and the inner map $g = z^2$.`, `外側を $e^{${a}w}$、内側を $g = z^2$ とします。`],
        sol: [[`Outer: $S(e^{${a}w}) = -${n(a * a / 2)}$. Inner: $g = z^2$, $g' = 2z$, $S(g) = -3/(2z^2)$.`, `外側は $S(e^{${a}w}) = -${n(a * a / 2)}$、内側は $g = z^2$、$g' = 2z$、$S(g) = -3/(2z^2)$ です。`], [`$S(f) = -${n(a * a / 2)}\\cdot 4z^2 - \\dfrac{3}{2z^2} = -${2 * a * a}z^2 - \\dfrac{3}{2z^2}$.`, `$S(f) = -${n(a * a / 2)}\\cdot 4z^2 - \\dfrac{3}{2z^2} = -${2 * a * a}z^2 - \\dfrac{3}{2z^2}$ です。`], ['The inner map contributes its own obstruction $S(g)$, and the outer one is weighted by $(g\')^2$, the weight of a quadratic differential.', '内側の写像は自分自身の障害 $S(g)$ を加え、外側の写像は二次微分の重み $(g\')^2$ で掛けられます。']],
      };
      return {
        q: [`Find $S(f)$ for $f(z) = \\tan(${a}z^2)$, using the chain rule with $g(z) = z^2$.`, `$g(z) = z^2$ として連鎖律を使い、$f(z) = \\tan(${a}z^2)$ の $S(f)$ を求めてください。`],
        a: { type: 'expr', v: `${8 * a * a}*z^2-3/(2*z^2)`, vars: ['z'], lhs: ['$S(f) =$', '$S(f) =$'] },
        hint: [`$S(\\tan ${a}w) = ${2 * a * a}$, and $g' = 2z$.`, `$S(\\tan ${a}w) = ${2 * a * a}$、$g' = 2z$ です。`],
        sol: [[`Outer: $S(\\tan ${a}w) = ${2 * a * a}$. Inner: $(g')^2 = 4z^2$ and $S(g) = -3/(2z^2)$.`, `外側は $S(\\tan ${a}w) = ${2 * a * a}$、内側は $(g')^2 = 4z^2$、$S(g) = -3/(2z^2)$ です。`], [`$S(f) = ${2 * a * a}\\cdot 4z^2 - \\dfrac{3}{2z^2} = ${8 * a * a}z^2 - \\dfrac{3}{2z^2}$.`, `$S(f) = ${2 * a * a}\\cdot 4z^2 - \\dfrac{3}{2z^2} = ${8 * a * a}z^2 - \\dfrac{3}{2z^2}$ です。`], ['The positive term comes from the tangent (periodic, projectively curved the other way), the negative one from the square.', '正の項は正接（周期的で、$e^{az}$ とは逆向きに射影的に曲がる）から、負の項は二乗から来ます。']],
      };
    },
  ];
})();
