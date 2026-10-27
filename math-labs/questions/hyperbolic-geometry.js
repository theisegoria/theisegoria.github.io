'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, gcd } = P.util;
  const PI = Math.PI, DEG = 180 / PI;
  const pt = (z) => `(${n(z[0])}, ${n(z[1])})`;
  const r2 = (z) => z[0] * z[0] + z[1] * z[1];
  // cosh d = 1 + 2|z - w|^2 / ((1 - |z|^2)(1 - |w|^2)) in the Poincare disc
  const coshD = (z, w) => 1 + 2 * ((z[0] - w[0]) ** 2 + (z[1] - w[1]) ** 2) / ((1 - r2(z)) * (1 - r2(w)));
  const distD = (z, w) => Math.acosh(coshD(z, w));
  const piFrac = (num, den) => { const g = gcd(num, den) || 1; const a = num / g, b = den / g; if (b === 1) return a === 1 ? '\\pi' : `${a}\\pi`; return `\\tfrac{${a === 1 ? '' : a}\\pi}{${b}}`; };

  /* ---------- 1. distance, lines and the angle of parallelism ---------- */
  Q['poincare-distance'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [x, ratio] = r.pick([[0.2, '3/2'], [0.5, '3'], [0.6, '4'], [0.75, '7'], [0.8, '9'], [0.9, '19']]);
        const d = Math.log((1 + x) / (1 - x)), sgn = r.sign(), axis = r.int(0, 1);
        const Qp = axis ? [0, sgn * x] : [sgn * x, 0];
        return {
          q: [`In the Poincaré disc, how far is the point $${pt(Qp)}$ from the centre $0$, in hyperbolic length?`, `ポアンカレ円板で、点 $${pt(Qp)}$ は中心 $0$ から双曲的な長さでどれだけ離れていますか。`],
          a: { type: 'num', v: d, show: `\\ln ${ratio.includes('/') ? '\\tfrac32' : ratio}` },
          hint: ['Along a diameter, $ds = 2\\,dr/(1 - r^2)$; integrate from $0$.', '直径に沿っては $ds = 2\\,dr/(1 - r^2)$ です。$0$ から積分してください。'],
          sol: [[`$d = \\int_0^{${n(x)}} \\dfrac{2\\,dr}{1 - r^2} = \\ln\\dfrac{1 + ${n(x)}}{1 - ${n(x)}} = \\ln ${ratio.includes('/') ? '\\tfrac32' : ratio} = ${n(d, 4)}$.`, `$d = \\int_0^{${n(x)}} \\dfrac{2\\,dr}{1 - r^2} = \\ln\\dfrac{1 + ${n(x)}}{1 - ${n(x)}} = \\ln ${ratio.includes('/') ? '\\tfrac32' : ratio} = ${n(d, 4)}$ です。`], [`The Euclidean radius is only ${n(x)}, but the hyperbolic distance is ${n(d / x, 3)} times larger: lengths near the rim are drawn ever smaller.`, `ユークリッド的な半径は ${n(x)} にすぎませんが、双曲距離はその ${n(d / x, 3)} 倍です。縁に近いほど長さが小さく描かれるからです。`]],
          set: { px: 0, py: 0, qx: Qp[0], qy: Qp[1] },
        };
      }
      if (form === 1) {
        const d = r.pick([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5]);
        const Pi = 2 * Math.atan(Math.exp(-d)) * DEG;
        const y = Math.tanh(d / 2), ys = Math.round(y * 100) / 100;
        return {
          q: [`A point $R$ is at hyperbolic distance $d = ${n(d)}$ from a line. Find the angle of parallelism $\\Pi(d)$ in degrees, to two decimals.`, `点 $R$ が直線から双曲距離 $d = ${n(d)}$ のところにあります。平行角 $\\Pi(d)$ を度で、小数第2位まで求めてください。`],
          a: { type: 'num', v: Pi, tol: 0.006, unit: ['°', '°'] },
          hint: ['Lobachevsky\'s formula: $\\Pi(d) = 2\\arctan e^{-d}$.', 'ロバチェフスキーの公式 $\\Pi(d) = 2\\arctan e^{-d}$ を使います。'],
          sol: [[`$e^{-${n(d)}} = ${n(Math.exp(-d), 5)}$, so $\\Pi = 2\\arctan ${n(Math.exp(-d), 5)} = ${n(Pi, 3)}^\\circ$.`, `$e^{-${n(d)}} = ${n(Math.exp(-d), 5)}$ なので $\\Pi = 2\\arctan ${n(Math.exp(-d), 5)} = ${n(Pi, 3)}^\\circ$ です。`], [`In Euclidean geometry the answer would be $90^\\circ$ at every distance; here the limiting parallels lean in by $${n(90 - Pi, 2)}^\\circ$.`, `ユークリッド幾何なら距離によらず $90^\\circ$ ですが、ここでは極限平行線が $${n(90 - Pi, 2)}^\\circ$ 内側に傾きます。`]],
          set: { px: -0.6, py: 0, qx: 0.6, qy: 0, rx: 0, ry: ys },
        };
      }
      const [d, show, x] = r.pick([[Math.log(3), '\\ln 3', 0.5], [Math.log(9), '\\ln 9', 0.8], [Math.log(4), '\\ln 4', 0.6], [Math.log(19), '\\ln 19', 0.9], [1, '1', Math.tanh(0.5)], [2, '2', Math.tanh(1)]]);
      return {
        q: [`At what Euclidean distance from the centre of the Poincaré disc is a point whose hyperbolic distance from the centre is $${show}$? Give three decimals.`, `ポアンカレ円板の中心からの双曲距離が $${show}$ である点は、中心からユークリッド距離でどれだけのところにありますか。小数第3位まで答えてください。`],
        a: { type: 'num', v: x, tol: 6e-4 },
        hint: ['Invert $d = 2\\,\\operatorname{artanh} r$.', '$d = 2\\,\\operatorname{artanh} r$ を逆に解きます。'],
        sol: [[`$r = \\tanh(d/2) = \\dfrac{e^d - 1}{e^d + 1}$.`, `$r = \\tanh(d/2) = \\dfrac{e^d - 1}{e^d + 1}$ です。`], [`With $d = ${show}$: $r = ${n(x, 4)}$. However large $d$ grows, $r$ stays below $1$: the rim is infinitely far away.`, `$d = ${show}$ では $r = ${n(x, 4)}$ です。$d$ をいくら大きくしても $r$ は $1$ 未満で、縁は無限に遠くにあります。`]],
        set: Math.abs(x * 100 - Math.round(x * 100)) < 1e-9 ? { px: 0, py: 0, qx: x, qy: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let A, B;
        do {
          A = [r.step(-0.7, 0.7, 0.1), r.step(-0.7, 0.7, 0.1)];
          B = [r.step(-0.7, 0.7, 0.1), r.step(-0.7, 0.7, 0.1)];
        } while (r2(A) > 0.64 || r2(B) > 0.64 || Math.hypot(A[0] - B[0], A[1] - B[1]) < 0.35);
        const c = coshD(A, B), d = Math.acosh(c), e2 = (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2;
        return {
          q: [`Find the hyperbolic distance between $P = ${pt(A)}$ and $Q = ${pt(B)}$ in the Poincaré disc. Give three decimals.`, `ポアンカレ円板の $P = ${pt(A)}$ と $Q = ${pt(B)}$ の双曲距離を、小数第3位まで求めてください。`],
          a: { type: 'num', v: d, tol: 0.0015 },
          hint: ['$\\cosh d = 1 + \\dfrac{2|P - Q|^2}{(1 - |P|^2)(1 - |Q|^2)}$.', '$\\cosh d = 1 + \\dfrac{2|P - Q|^2}{(1 - |P|^2)(1 - |Q|^2)}$ を使います。'],
          sol: [[`$|P - Q|^2 = ${n(e2)}$, $1 - |P|^2 = ${n(1 - r2(A))}$, $1 - |Q|^2 = ${n(1 - r2(B))}$.`, `$|P - Q|^2 = ${n(e2)}$、$1 - |P|^2 = ${n(1 - r2(A))}$、$1 - |Q|^2 = ${n(1 - r2(B))}$ です。`], [`$\\cosh d = 1 + \\dfrac{2 \\cdot ${n(e2)}}{${n(1 - r2(A))} \\cdot ${n(1 - r2(B))}} = ${n(c, 5)}$, so $d = \\operatorname{arcosh} ${n(c, 5)} = ${n(d, 4)}$.`, `$\\cosh d = 1 + \\dfrac{2 \\cdot ${n(e2)}}{${n(1 - r2(A))} \\cdot ${n(1 - r2(B))}} = ${n(c, 5)}$ より $d = \\operatorname{arcosh} ${n(c, 5)} = ${n(d, 4)}$ です。`], [`The Euclidean gap is ${n(Math.sqrt(e2), 3)}; the hyperbolic one is ${n(d / Math.sqrt(e2), 2)} times as long, which is the readout's ratio.`, `ユークリッド距離は ${n(Math.sqrt(e2), 3)} で、双曲距離はその ${n(d / Math.sqrt(e2), 2)} 倍です。読み取り欄の比がこれです。`]],
          set: { px: A[0], py: A[1], qx: B[0], qy: B[1] },
        };
      }
      if (form === 1) {
        const [a, ratio] = r.pick([[0.2, '3/2'], [0.5, '3'], [0.6, '4'], [0.8, '9'], [0.75, '7']]);
        const vert = r.chance(0.5), d = 2 * Math.log((1 + a) / (1 - a));
        const A = vert ? [0, -a] : [-a, 0], B = vert ? [0, a] : [a, 0];
        const lr = ratio === '3/2' ? '\\tfrac32' : ratio;
        return {
          q: [`Find the hyperbolic distance between $${pt(A)}$ and $${pt(B)}$. Give an exact value or four decimals.`, `$${pt(A)}$ と $${pt(B)}$ の双曲距離を求めてください。厳密値か小数第4位までの値で答えてください。`],
          a: { type: 'num', v: d, tol: 6e-5, show: `2\\ln ${lr}` },
          hint: ['Both points lie on a diameter, symmetric about the centre: add the two distances from $0$.', '二点は中心に関して対称に直径上にあります。$0$ からの距離を足してください。'],
          sol: [[`Each point is at distance $\\ln\\dfrac{1 + ${n(a)}}{1 - ${n(a)}} = \\ln ${lr}$ from $0$, and the diameter is a geodesic through $0$.`, `どちらの点も $0$ から距離 $\\ln\\dfrac{1 + ${n(a)}}{1 - ${n(a)}} = \\ln ${lr}$ にあり、直径は $0$ を通る測地線です。`], [`$d = 2\\ln ${lr} = ${n(d, 4)}$, against a Euclidean distance of ${n(2 * a)}.`, `$d = 2\\ln ${lr} = ${n(d, 4)}$ で、ユークリッド距離 ${n(2 * a)} に対する値です。`]],
          set: { px: A[0], py: A[1], qx: B[0], qy: B[1] },
        };
      }
      const y = r.step(0.1, 0.85, 0.05), d = Math.log((1 + y) / (1 - y)), Pi = 2 * Math.atan((1 - y) / (1 + y)) * DEG;
      return {
        q: [`The line is the horizontal diameter and $R = (0, ${n(y)})$. Find the angle of parallelism at $R$ in degrees, to two decimals.`, `直線は水平な直径で、$R = (0, ${n(y)})$ です。$R$ における平行角を度で、小数第2位まで求めてください。`],
        a: { type: 'num', v: Pi, tol: 0.006, unit: ['°', '°'] },
        hint: ['First find the hyperbolic distance from $R$ to the diameter; the perpendicular is the vertical diameter.', 'まず $R$ から直径までの双曲距離を求めます。垂線は垂直な直径です。'],
        sol: [[`$d = \\ln\\dfrac{1 + ${n(y)}}{1 - ${n(y)}} = ${n(d, 5)}$.`, `$d = \\ln\\dfrac{1 + ${n(y)}}{1 - ${n(y)}} = ${n(d, 5)}$ です。`], [`$\\Pi = 2\\arctan e^{-d} = 2\\arctan\\dfrac{1 - ${n(y)}}{1 + ${n(y)}} = ${n(Pi, 3)}^\\circ$.`, `$\\Pi = 2\\arctan e^{-d} = 2\\arctan\\dfrac{1 - ${n(y)}}{1 + ${n(y)}} = ${n(Pi, 3)}^\\circ$ です。`], ['Every line through $R$ leaving within $\\Pi$ of the perpendicular meets the diameter; the rest of the fan never does.', '$R$ を通り垂線から $\\Pi$ 以内の向きに出る直線は直径と交わり、残りの扇の直線はけっして交わりません。']],
        set: { px: -0.6, py: 0, qx: 0.6, qy: 0, rx: 0, ry: y },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([20, 30, 40, 45, 50, 60, 70, 75, 80]);
        const d = -Math.log(Math.tan(th / 2 / DEG)), y = Math.tanh(d / 2);
        return {
          q: [`How far from a line must a point be for its angle of parallelism to be $${th}^\\circ$? Give the hyperbolic distance to three decimals.`, `平行角が $${th}^\\circ$ になるのは、直線からどれだけ離れた点ですか。双曲距離を小数第3位まで答えてください。`],
          a: { type: 'num', v: d, tol: 6e-4 },
          hint: ['Solve $2\\arctan e^{-d} = \\Pi$ for $d$.', '$2\\arctan e^{-d} = \\Pi$ を $d$ について解きます。'],
          sol: [[`$e^{-d} = \\tan(\\Pi/2) = \\tan ${n(th / 2)}^\\circ = ${n(Math.tan(th / 2 / DEG), 5)}$.`, `$e^{-d} = \\tan(\\Pi/2) = \\tan ${n(th / 2)}^\\circ = ${n(Math.tan(th / 2 / DEG), 5)}$ です。`], [`$d = -\\ln ${n(Math.tan(th / 2 / DEG), 5)} = ${n(d, 4)}$.`, `$d = -\\ln ${n(Math.tan(th / 2 / DEG), 5)} = ${n(d, 4)}$ です。`], [`With the horizontal diameter as the line, that is $R = (0, ${n(y, 3)})$. Distance and angle determine each other: hyperbolic geometry has an absolute unit of length.`, `水平な直径を直線とすると $R = (0, ${n(y, 3)})$ です。距離と角が互いを決めるので、双曲幾何には絶対的な長さの単位があります。`]],
          set: { px: -0.6, py: 0, qx: 0.6, qy: 0, rx: 0, ry: Math.round(y * 100) / 100 },
        };
      }
      if (form === 1) {
        const H = [[0, 0, 1], [2, 2, 3], [2, -2, 3], [-2, 2, 3], [-2, -2, 3], [4, 8, 9], [8, 4, 9], [-4, 8, 9], [8, -4, 9], [6, 18, 19], [-18, 6, 19]];
        let a, b; do { [a, b] = r.sample(H, 2); } while (a[2] * b[2] - a[0] * b[0] - a[1] * b[1] <= 1);
        const c = a[2] * b[2] - a[0] * b[0] - a[1] * b[1], d = Math.acosh(c);
        const disc = (h) => [h[0] / (1 + h[2]), h[1] / (1 + h[2])];
        const A = disc(a), B = disc(b);
        const onGrid = (z) => z.every((x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9 && Math.abs(x) <= 0.9);
        return {
          q: [`On the hyperboloid $t^2 - x^2 - y^2 = 1$, $t > 0$, find the hyperbolic distance between $(x, y, t) = (${a.join(', ')})$ and $(${b.join(', ')})$. Give three decimals.`, `双曲面 $t^2 - x^2 - y^2 = 1$、$t > 0$ の上で、$(x, y, t) = (${a.join(', ')})$ と $(${b.join(', ')})$ の双曲距離を小数第3位まで求めてください。`],
          a: { type: 'num', v: d, tol: 6e-4, show: `\\operatorname{arcosh} ${c}` },
          hint: ['On the hyperboloid, $\\cosh d = t_1t_2 - x_1x_2 - y_1y_2$, the Minkowski product with its sign reversed.', '双曲面上では $\\cosh d = t_1t_2 - x_1x_2 - y_1y_2$ で、符号を反転したミンコフスキー内積です。'],
          sol: [[`$\\cosh d = ${a[2]}\\cdot${b[2]} - (${a[0]})(${b[0]}) - (${a[1]})(${b[1]}) = ${c}$.`, `$\\cosh d = ${a[2]}\\cdot${b[2]} - (${a[0]})(${b[0]}) - (${a[1]})(${b[1]}) = ${c}$ です。`], [`$d = \\operatorname{arcosh} ${c} = \\ln(${c} + \\sqrt{${c * c - 1}}) = ${n(d, 4)}$.`, `$d = \\operatorname{arcosh} ${c} = \\ln(${c} + \\sqrt{${c * c - 1}}) = ${n(d, 4)}$ です。`], [`Projecting from $(0, 0, -1)$, $(x, y, t) \\mapsto (x, y)/(1 + t)$, sends the points to $${pt(A)}$ and $${pt(B)}$ in the disc, where the disc formula gives the same distance.`, `$(0, 0, -1)$ から射影する $(x, y, t) \\mapsto (x, y)/(1 + t)$ により、二点は円板の $${pt(A)}$ と $${pt(B)}$ に写り、円板の公式でも同じ距離になります。`]],
          set: onGrid(A) && onGrid(B) ? { px: A[0], py: A[1], qx: B[0], qy: B[1] } : undefined,
        };
      }
      const k = r.int(0, 2);
      if (k === 0) {
        return {
          q: ['Write the hyperbolic distance $d(r)$ from the centre of the Poincaré disc to a point at Euclidean radius $r$.', 'ポアンカレ円板の中心から、ユークリッド半径 $r$ の点までの双曲距離 $d(r)$ を式で表してください。'],
          a: { type: 'expr', v: 'ln((1+r)/(1-r))', vars: ['r'], dom: { r: [0.05, 0.9] }, lhs: ['$d(r) =$', '$d(r) =$'] },
          hint: ['Integrate the metric $2\\,dr/(1 - r^2)$ along the radius.', '計量 $2\\,dr/(1 - r^2)$ を半径に沿って積分します。'],
          sol: [['Partial fractions: $\\dfrac{2}{1 - r^2} = \\dfrac{1}{1 - r} + \\dfrac{1}{1 + r}$.', '部分分数分解すると $\\dfrac{2}{1 - r^2} = \\dfrac{1}{1 - r} + \\dfrac{1}{1 + r}$ です。'], ['$d(r) = \\ln\\dfrac{1 + r}{1 - r} = 2\\,\\operatorname{artanh} r$, which diverges as $r \\to 1$: the boundary circle is at infinite distance.', '$d(r) = \\ln\\dfrac{1 + r}{1 - r} = 2\\,\\operatorname{artanh} r$ で、$r \\to 1$ で発散します。境界の円は無限に遠いのです。']],
          set: { px: 0, py: 0 },
        };
      }
      if (k === 1) {
        return {
          q: ['The line is the horizontal diameter and $R = (0, y)$ with $0 < y < 1$. Write the angle of parallelism at $R$, in radians, as a function of $y$.', '直線は水平な直径で、$R = (0, y)$（$0 < y < 1$）です。$R$ における平行角をラジアンで、$y$ の式で表してください。'],
          a: { type: 'expr', v: 'pi/2 - 2*arctan(y)', vars: ['y'], dom: { y: [0.05, 0.9] }, lhs: ['$\\Pi(y) =$', '$\\Pi(y) =$'] },
          hint: ['Combine $d = \\ln\\frac{1 + y}{1 - y}$ with $\\Pi = 2\\arctan e^{-d}$, then simplify.', '$d = \\ln\\frac{1 + y}{1 - y}$ と $\\Pi = 2\\arctan e^{-d}$ を組み合わせて簡単にします。'],
          sol: [['$e^{-d} = \\dfrac{1 - y}{1 + y}$, so $\\Pi = 2\\arctan\\dfrac{1 - y}{1 + y}$.', '$e^{-d} = \\dfrac{1 - y}{1 + y}$ なので $\\Pi = 2\\arctan\\dfrac{1 - y}{1 + y}$ です。'], ['Since $\\dfrac{1 - y}{1 + y} = \\tan(\\pi/4 - \\arctan y)$, $\\Pi = \\dfrac{\\pi}{2} - 2\\arctan y$.', '$\\dfrac{1 - y}{1 + y} = \\tan(\\pi/4 - \\arctan y)$ なので $\\Pi = \\dfrac{\\pi}{2} - 2\\arctan y$ です。'], ['In the picture: the limiting parallels through $R$ make the angle $2\\arctan y$ with the horizontal, and they meet the diameter at its ideal ends.', '図では、$R$ を通る極限平行線は水平線と $2\\arctan y$ の角をなし、直径の理想端点で直径に出会います。']],
          set: { px: -0.6, py: 0, qx: 0.6, qy: 0, rx: 0, ry: 0.5 },
        };
      }
      return {
        q: ['Near the point at Euclidean radius $r$, a short Euclidean segment of length $\\varepsilon$ has hyperbolic length $\\lambda(r)\\,\\varepsilon$. Find the scale factor $\\lambda(r)$.', 'ユークリッド半径 $r$ の点の近くで、長さ $\\varepsilon$ の短いユークリッド線分の双曲的な長さは $\\lambda(r)\\,\\varepsilon$ です。倍率 $\\lambda(r)$ を求めてください。'],
        a: { type: 'expr', v: '2/(1-r^2)', vars: ['r'], dom: { r: [0.05, 0.9] }, lhs: ['$\\lambda(r) =$', '$\\lambda(r) =$'] },
        hint: ['Differentiate $d(r) = \\ln\\frac{1 + r}{1 - r}$, and remember the model is conformal, so the factor is the same in every direction.', '$d(r) = \\ln\\frac{1 + r}{1 - r}$ を微分します。このモデルは等角なので倍率はどの方向にも同じです。'],
        sol: [['$\\dfrac{d}{dr}\\ln\\dfrac{1 + r}{1 - r} = \\dfrac{1}{1 + r} + \\dfrac{1}{1 - r} = \\dfrac{2}{1 - r^2}$.', '$\\dfrac{d}{dr}\\ln\\dfrac{1 + r}{1 - r} = \\dfrac{1}{1 + r} + \\dfrac{1}{1 - r} = \\dfrac{2}{1 - r^2}$ です。'], ['Because the metric $ds = 2|dz|/(1 - |z|^2)$ is a multiple of the Euclidean one, the factor $\\lambda = 2/(1 - r^2)$ holds in every direction. It is $2$ at the centre and grows without bound at the rim, which is why the 0.5 tick marks crowd together there.', '計量 $ds = 2|dz|/(1 - |z|^2)$ はユークリッド計量の定数倍なので、倍率 $\\lambda = 2/(1 - r^2)$ はどの方向にも成り立ちます。中心で $2$、縁で限りなく大きくなるので、0.5 ごとの目盛りが縁で詰まって見えます。']],
      };
    },
  ];

  /* ---------- 2. triangles: Gauss-Bonnet ---------- */
  const DEGS = [10, 15, 20, 25, 30, 36, 40, 45, 50, 60, 72, 75, 80, 90];
  Q['hyperbolic-triangle'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a; do { a = r.sample(DEGS, 3); } while (a[0] + a[1] + a[2] >= 175);
        const s = a[0] + a[1] + a[2], area = PI - s / DEG;
        return {
          q: [`A hyperbolic triangle (curvature $-1$) has angles $${a[0]}^\\circ$, $${a[1]}^\\circ$ and $${a[2]}^\\circ$. What is its area?`, `双曲三角形（曲率 $-1$）の角が $${a[0]}^\\circ$、$${a[1]}^\\circ$、$${a[2]}^\\circ$ です。面積はいくつですか。`],
          a: { type: 'num', v: area, show: piFrac(180 - s, 180) },
          hint: ['Gauss-Bonnet: area $= \\pi - (\\alpha + \\beta + \\gamma)$.', 'ガウス・ボンネの定理により、面積 $= \\pi - (\\alpha + \\beta + \\gamma)$ です。'],
          sol: [[`The angle sum is $${s}^\\circ$, short of $180^\\circ$ by $${180 - s}^\\circ$.`, `角の和は $${s}^\\circ$ で、$180^\\circ$ に $${180 - s}^\\circ$ 足りません。`], [`In radians: area $= ${piFrac(180 - s, 180)} = ${n(area, 4)}$. The defect is the area.`, `ラジアンでは、面積 $= ${piFrac(180 - s, 180)} = ${n(area, 4)}$ です。欠損がそのまま面積です。`]],
        };
      }
      if (form === 1) {
        const ideal = r.int(1, 2);
        let a; do { a = r.sample(DEGS, 3 - ideal); } while (a.reduce((x, y) => x + y, 0) >= 175);
        const s = a.reduce((x, y) => x + y, 0), area = PI - s / DEG;
        const list = a.map((x) => `$${x}^\\circ$`).join(ideal === 1 ? ' and ' : ''), listJ = a.map((x) => `$${x}^\\circ$`).join(ideal === 1 ? 'と' : '');
        return {
          q: [ideal === 1 ? `A triangle has one vertex on the boundary circle (an ideal vertex) and angles ${list} at the other two. What is its area?` : `A triangle has two ideal vertices on the boundary circle and the angle ${list} at the third. What is its area?`, ideal === 1 ? `一つの頂点が境界の円上（理想頂点）にあり、他の二つの頂点の角が ${listJ} の三角形の面積はいくつですか。` : `二つの頂点が境界の円上の理想頂点で、残りの頂点の角が ${listJ} の三角形の面積はいくつですか。`],
          a: { type: 'num', v: area, show: piFrac(180 - s, 180) },
          hint: ['Two sides meeting at an ideal vertex are asymptotically parallel: the angle there is $0$.', '理想頂点で出会う二辺は漸近的に平行なので、そこでの角は $0$ です。'],
          sol: [[`The ideal angle${ideal > 1 ? 's are' : ' is'} $0$, so the angle sum is $${s}^\\circ$.`, `理想頂点の角は $0$ なので、角の和は $${s}^\\circ$ です。`], [`Area $= \\pi - ${piFrac(s, 180)} = ${piFrac(180 - s, 180)} = ${n(area, 4)}$: finite, although the triangle reaches infinity.`, `面積 $= \\pi - ${piFrac(s, 180)} = ${piFrac(180 - s, 180)} = ${n(area, 4)}$ です。三角形は無限遠まで届くのに、面積は有限です。`]],
        };
      }
      const ok = r.sample(DEGS.filter((x) => x <= 60), 3); while (ok[0] + ok[1] + ok[2] >= 180) ok[2] = 10;
      const sum180 = r.pick([[60, 60, 60], [90, 45, 45], [30, 60, 90], [50, 60, 70], [40, 60, 80]]);
      const over = r.pick([[90, 90, 30], [80, 70, 60], [100, 50, 45], [90, 60, 45]]);
      const neg = r.pick([[0, 0, 0], [90, 90, 0]]);
      const fmtT = (t) => `$${t[0]}^\\circ, ${t[1]}^\\circ, ${t[2]}^\\circ$`;
      return {
        q: ['Which of these angle triples can belong to a triangle in the hyperbolic plane (with all three vertices in the plane)?', '次の角の組のうち、双曲平面の三角形（三つの頂点がすべて平面内にあるもの）の角になりうるのはどれですか。'],
        a: { type: 'choice', opts: [[fmtT(ok), fmtT(ok)], [fmtT(sum180), fmtT(sum180)], [fmtT(over), fmtT(over)], [fmtT(neg), fmtT(neg)]], v: 0 },
        hint: ['The area is $\\pi$ minus the angle sum and must be positive; a vertex inside the plane has a positive angle.', '面積は $\\pi$ から角の和を引いたもので、正でなければなりません。平面内の頂点の角は正です。'],
        sol: [[`${fmtT(ok)} sums to $${ok[0] + ok[1] + ok[2]}^\\circ < 180^\\circ$, so the area $\\pi - (\\alpha + \\beta + \\gamma)$ is positive.`, `${fmtT(ok)} の和は $${ok[0] + ok[1] + ok[2]}^\\circ < 180^\\circ$ なので、面積 $\\pi - (\\alpha + \\beta + \\gamma)$ は正です。`], ['A sum of exactly $180^\\circ$ is a Euclidean triangle, and a sum above $180^\\circ$ belongs on a sphere. Zero angles occur only at ideal vertices on the boundary circle.', '和がちょうど $180^\\circ$ ならユークリッドの三角形、$180^\\circ$ を超えるなら球面の三角形です。角 $0$ は境界の円上の理想頂点でしか起こりません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.step(0.3, 0.8, 0.1), c = r.step(0.3, 0.8, 0.1);
        const lb = 2 * Math.atanh(b), lc = 2 * Math.atanh(c);
        const B = Math.atan(Math.tanh(lc) / Math.sinh(lb)), C = Math.atan(Math.tanh(lb) / Math.sinh(lc));
        const area = PI / 2 - B - C;
        return {
          q: [`The triangle has vertices $A = (0, 0)$, $B = (${n(b)}, 0)$, $C = (0, ${n(c)})$ in the Poincaré disc. Find its area to three decimals.`, `ポアンカレ円板の三角形の頂点が $A = (0, 0)$、$B = (${n(b)}, 0)$、$C = (0, ${n(c)})$ です。面積を小数第3位まで求めてください。`],
          a: { type: 'num', v: area, tol: 6e-4 },
          hint: ['The angle at the centre is a Euclidean right angle. For a hyperbolic right triangle, $\\tan B = \\tanh(\\text{opposite leg})/\\sinh(\\text{adjacent leg})$.', '中心での角はユークリッド的にも直角です。双曲直角三角形では $\\tan B = \\tanh(\\text{対辺})/\\sinh(\\text{隣辺})$ です。'],
          sol: [[`Legs: $|AB| = 2\\,\\operatorname{artanh} ${n(b)} = ${n(lb, 4)}$ and $|AC| = 2\\,\\operatorname{artanh} ${n(c)} = ${n(lc, 4)}$; the angle at $A$ is $90^\\circ$.`, `脚の長さは $|AB| = 2\\,\\operatorname{artanh} ${n(b)} = ${n(lb, 4)}$、$|AC| = 2\\,\\operatorname{artanh} ${n(c)} = ${n(lc, 4)}$ で、$A$ の角は $90^\\circ$ です。`], [`$\\tan B = \\tanh ${n(lc, 4)}/\\sinh ${n(lb, 4)}$ gives $B = ${n(B * DEG, 3)}^\\circ$; likewise $C = ${n(C * DEG, 3)}^\\circ$.`, `$\\tan B = \\tanh ${n(lc, 4)}/\\sinh ${n(lb, 4)}$ より $B = ${n(B * DEG, 3)}^\\circ$、同様に $C = ${n(C * DEG, 3)}^\\circ$ です。`], [`Area $= \\pi - \\tfrac{\\pi}{2} - B - C = ${n(area, 4)}$, which the readout's integral confirms.`, `面積 $= \\pi - \\tfrac{\\pi}{2} - B - C = ${n(area, 4)}$ で、読み取り欄の積分でも確かめられます。`]],
          set: { ax: 0, ay: 0, bx: b, by: 0, cx: 0, cy: c },
        };
      }
      if (form === 1) {
        const C = r.pick([1.5, 2, 2.5, 3, 4, 5]);
        const al = Math.acos(C / (1 + C)), area = PI - 3 * al;
        return {
          q: [`An equilateral hyperbolic triangle has sides of length $a$ with $\\cosh a = ${n(C)}$. Find its area to three decimals.`, `一辺の長さ $a$ が $\\cosh a = ${n(C)}$ を満たす正三角形（双曲的）の面積を、小数第3位まで求めてください。`],
          a: { type: 'num', v: area, tol: 6e-4 },
          hint: ['Use the hyperbolic law of cosines with all three sides equal.', '三辺が等しい場合の双曲余弦定理を使います。'],
          sol: [['$\\cos\\alpha = \\dfrac{\\cosh^2 a - \\cosh a}{\\sinh^2 a} = \\dfrac{\\cosh a}{\\cosh a + 1}$.', '$\\cos\\alpha = \\dfrac{\\cosh^2 a - \\cosh a}{\\sinh^2 a} = \\dfrac{\\cosh a}{\\cosh a + 1}$ です。'], [`$\\cos\\alpha = ${n(C)}/${n(C + 1)}$, so $\\alpha = ${n(al * DEG, 3)}^\\circ$.`, `$\\cos\\alpha = ${n(C)}/${n(C + 1)}$ より $\\alpha = ${n(al * DEG, 3)}^\\circ$ です。`], [`Area $= \\pi - 3\\alpha = ${n(area, 4)}$. Bigger triangles have smaller angles, the reverse of a sphere.`, `面積 $= \\pi - 3\\alpha = ${n(area, 4)}$ です。大きな三角形ほど角が小さく、球面とは逆です。`]],
        };
      }
      let p, q, s; do { [p, q, s] = [r.pick([2, 2, 3]), r.int(3, 6), r.int(4, 10)]; } while (1 / p + 1 / q + 1 / s >= 1);
      const num = p * q * s - q * s - p * s - p * q, den = p * q * s;
      return {
        q: [`A hyperbolic triangle has angles $\\pi/${p}$, $\\pi/${q}$, $\\pi/${s}$. What is its area?`, `角が $\\pi/${p}$、$\\pi/${q}$、$\\pi/${s}$ の双曲三角形の面積はいくつですか。`],
        a: { type: 'num', v: PI * num / den, show: piFrac(num, den) },
        hint: ['Area $= \\pi(1 - 1/p - 1/q - 1/r)$.', '面積 $= \\pi(1 - 1/p - 1/q - 1/r)$ です。'],
        sol: [[`$1 - \\tfrac1{${p}} - \\tfrac1{${q}} - \\tfrac1{${s}} = ${frac(num, den)}$.`, `$1 - \\tfrac1{${p}} - \\tfrac1{${q}} - \\tfrac1{${s}} = ${frac(num, den)}$ です。`], [`Area $= ${piFrac(num, den)} = ${n(PI * num / den, 4)}$. Reflections in the sides of this triangle tile the whole plane, and ${p === 2 && q === 3 && s === 7 ? 'with $(2, 3, 7)$ this is the smallest area any such triangle can have' : 'every copy has exactly this area'}.`, `この三角形の辺での鏡映を繰り返すと平面全体が敷き詰められ、${p === 2 && q === 3 && s === 7 ? '$(2, 3, 7)$ はそのような三角形のなかで面積が最小のものです' : 'どの複製もちょうどこの面積をもちます'}。面積 $= ${piFrac(num, den)} = ${n(PI * num / den, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['The triangle with vertices $0$, $(r, 0)$ and $(0, r)$ in the Poincaré disc: write its area as a function of $r$.', 'ポアンカレ円板で頂点が $0$、$(r, 0)$、$(0, r)$ の三角形の面積を、$r$ の式で表してください。'],
          a: { type: 'expr', v: 'pi/2 - 2*arctan((1-r^2)/(1+r^2))', vars: ['r'], dom: { r: [0.1, 0.9] }, lhs: ['$\\text{Area}(r) =$', '$\\text{Area}(r) =$'] },
          hint: ['Both legs have length $\\ell = 2\\,\\operatorname{artanh} r$, so $\\tanh\\ell = 2r/(1 + r^2)$ and $\\sinh\\ell = 2r/(1 - r^2)$.', '両脚の長さは $\\ell = 2\\,\\operatorname{artanh} r$ なので、$\\tanh\\ell = 2r/(1 + r^2)$、$\\sinh\\ell = 2r/(1 - r^2)$ です。'],
          sol: [['The right angle is at $0$; each base angle $B$ satisfies $\\tan B = \\tanh\\ell/\\sinh\\ell = (1 - r^2)/(1 + r^2)$.', '直角は $0$ にあり、底角 $B$ は $\\tan B = \\tanh\\ell/\\sinh\\ell = (1 - r^2)/(1 + r^2)$ を満たします。'], ['Area $= \\pi - \\tfrac{\\pi}{2} - 2B = \\tfrac{\\pi}{2} - 2\\arctan\\dfrac{1 - r^2}{1 + r^2}$.', '面積 $= \\pi - \\tfrac{\\pi}{2} - 2B = \\tfrac{\\pi}{2} - 2\\arctan\\dfrac{1 - r^2}{1 + r^2}$ です。'], ['As $r \\to 0$ the area vanishes like $2r^2$, four times the Euclidean $r^2/2$ because the metric is doubled at the centre; as $r \\to 1$ the base angles close to $0$ and the area tends to $\\pi/2$.', '$r \\to 0$ では面積は $2r^2$ のように消えます。中心で計量が2倍なのでユークリッドの $r^2/2$ の4倍です。$r \\to 1$ では底角が $0$ に閉じ、面積は $\\pi/2$ に近づきます。']],
          set: { ax: 0, ay: 0, bx: 0.6, by: 0, cx: 0, cy: 0.6 },
        };
      }
      if (form === 1) {
        const th = r.pick([20, 30, 36, 40, 45, 50, 54]);
        const c = Math.cos(th / DEG), C = c / (1 - c), a = Math.acosh(C);
        return {
          q: [`How long must the sides of an equilateral hyperbolic triangle be for each angle to equal $${th}^\\circ$? Give the side length to three decimals.`, `双曲的な正三角形の各角が $${th}^\\circ$ になるには、辺の長さはいくつでなければなりませんか。小数第3位まで答えてください。`],
          a: { type: 'num', v: a, tol: 6e-4 },
          hint: ['Invert $\\cos\\alpha = \\cosh a/(\\cosh a + 1)$.', '$\\cos\\alpha = \\cosh a/(\\cosh a + 1)$ を逆に解きます。'],
          sol: [[`$\\cosh a = \\dfrac{\\cos\\alpha}{1 - \\cos\\alpha} = \\dfrac{${n(c, 5)}}{${n(1 - c, 5)}} = ${n(C, 5)}$.`, `$\\cosh a = \\dfrac{\\cos\\alpha}{1 - \\cos\\alpha} = \\dfrac{${n(c, 5)}}{${n(1 - c, 5)}} = ${n(C, 5)}$ です。`], [`$a = \\operatorname{arcosh} ${n(C, 5)} = ${n(a, 4)}$, and the area is $\\pi - 3\\cdot${th}^\\circ = ${n(PI - 3 * th / DEG, 4)}$.`, `$a = \\operatorname{arcosh} ${n(C, 5)} = ${n(a, 4)}$ で、面積は $\\pi - 3\\cdot${th}^\\circ = ${n(PI - 3 * th / DEG, 4)}$ です。`], ['The angle fixes the size: there is no smaller or larger copy with the same angles, unlike in the Euclidean plane.', '角が大きさを決めます。ユークリッド平面と違い、同じ角をもつ大きさの違う複製はありません。']],
        };
      }
      const k = r.pick([1, 4, 9, 0.25]);
      const s = r.sample([30, 40, 45, 50, 60], 3); const sum = s[0] + s[1] + s[2], area = (PI - sum / DEG) / k;
      return {
        q: [`On a surface of constant curvature $K = -${n(k)}$, a geodesic triangle has angles $${s[0]}^\\circ$, $${s[1]}^\\circ$, $${s[2]}^\\circ$. What is its area?`, `一定の曲率 $K = -${n(k)}$ の曲面上で、測地三角形の角が $${s[0]}^\\circ$、$${s[1]}^\\circ$、$${s[2]}^\\circ$ です。面積はいくつですか。`],
        a: { type: 'num', v: area, show: k >= 1 ? piFrac(180 - sum, 180 * k) : piFrac((180 - sum) * Math.round(1 / k), 180) },
        hint: ['Gauss-Bonnet for a geodesic triangle: $\\iint K\\,dA = \\alpha + \\beta + \\gamma - \\pi$.', '測地三角形のガウス・ボンネの定理は $\\iint K\\,dA = \\alpha + \\beta + \\gamma - \\pi$ です。'],
        sol: [[`$K \\cdot \\text{Area} = ${piFrac(sum, 180)} - \\pi = -${piFrac(180 - sum, 180)}$.`, `$K \\cdot \\text{面積} = ${piFrac(sum, 180)} - \\pi = -${piFrac(180 - sum, 180)}$ です。`], [`Area $= ${piFrac(180 - sum, 180)}/${n(k)} = ${n(area, 4)}$. Stronger curvature packs the same angle defect into a smaller triangle; the disc picture is the case $K = -1$.`, `面積 $= ${piFrac(180 - sum, 180)}/${n(k)} = ${n(area, 4)}$ です。曲率が強いほど、同じ角の不足がより小さな三角形に収まります。円板の図は $K = -1$ の場合です。`]],
      };
    },
  ];

  /* ---------- 3. regular tilings {p, q} ---------- */
  const hyp = (p, q) => (p - 2) * (q - 2) > 4;
  const pickHyp = (r, pr = [3, 10], qr = [3, 10]) => { let p, q; do { p = r.int(pr[0], pr[1]); q = r.int(qr[0], qr[1]); } while (!hyp(p, q)); return [p, q]; };
  Q['hyperbolic-tiling'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2);
        const [p, q] = kind === 0 ? r.pick([[3, 3], [3, 4], [4, 3], [3, 5], [5, 3]]) : kind === 1 ? r.pick([[4, 4], [3, 6], [6, 3]]) : pickHyp(r);
        const v = (p - 2) * (q - 2) < 4 ? 0 : (p - 2) * (q - 2) === 4 ? 1 : 2;
        return {
          q: [`Regular $${p}$-gons, $${q}$ at each corner: does $\\{${p}, ${q}\\}$ tile the sphere, the flat plane or the hyperbolic plane?`, `正 $${p}$ 角形を各頂点に $${q}$ 枚ずつ集めた $\\{${p}, ${q}\\}$ は、球面・平面・双曲平面のどれを敷き詰めますか。`],
          a: { type: 'choice', opts: [['the sphere', '球面'], ['the flat plane', '平面'], ['the hyperbolic plane', '双曲平面']], v, fixed: true },
          hint: ['Compare $1/p + 1/q$ with $1/2$.', '$1/p + 1/q$ と $1/2$ を比べてください。'],
          sol: [[`$1/${p} + 1/${q} = ${frac(p + q, p * q)}$, which is ${['more than', 'exactly', 'less than'][v]} $1/2$.`, `$1/${p} + 1/${q} = ${frac(p + q, p * q)}$ は $1/2$ ${['より大きい', 'にちょうど等しい', 'より小さい'][v]}です。`], [['Flat $p$-gons have corners too small to fill $360^\\circ$, so the corners bend outward into a polyhedron on the sphere.', 'Flat corners fit exactly: $q$ corners of $(p-2)180^\\circ/p$ make $360^\\circ$.', 'Flat corners are too wide for $q$ of them to fit; only a negatively curved plane lets the polygon shrink its corners to $360^\\circ/q$.'][v], ['平面の正多角形の角は小さすぎて $360^\\circ$ を埋められないので、角が外に曲がって球面上の多面体になります。', '平面の角がちょうど収まります。$(p-2)180^\\circ/p$ の角 $q$ 個で $360^\\circ$ になります。', '平面の角は広すぎて $q$ 個収まりません。負に曲がった平面でだけ、多角形の角を $360^\\circ/q$ まで小さくできます。'][v]]],
          set: { p, q },
        };
      }
      if (form === 1) {
        const [p, q] = pickHyp(r);
        const flat = (p - 2) * 180 / p, hypA = 360 / q;
        return {
          q: [`In the hyperbolic tiling $\\{${p}, ${q}\\}$, what is each corner angle of a tile, in degrees? And how does it compare with a flat regular $${p}$-gon?`, `双曲タイリング $\\{${p}, ${q}\\}$ で、タイルの各頂点の角は何度ですか。平面の正 $${p}$ 角形の角とも比べてください。`],
          a: { type: 'num', v: hypA, tol: 0.01, unit: ['°', '°'] },
          hint: ['$q$ equal corners share the $360^\\circ$ around a vertex.', '頂点のまわりの $360^\\circ$ を $q$ 個の等しい角で分け合います。'],
          sol: [[`$360^\\circ/${q} = ${n(hypA, 3)}^\\circ$.`, `$360^\\circ/${q} = ${n(hypA, 3)}^\\circ$ です。`], [`A flat regular $${p}$-gon has corners of $${n(flat, 3)}^\\circ$. The hyperbolic tile is ${n(flat - hypA, 3)}° narrower at each corner, and that shortfall is paid for by its area.`, `平面の正 $${p}$ 角形の角は $${n(flat, 3)}^\\circ$ です。双曲タイルは各頂点で ${n(flat - hypA, 3)}° 狭く、その不足分が面積として現れます。`]],
          set: { p, q },
        };
      }
      const p = r.int(3, 10), qmin = Math.floor(2 * p / (p - 2)) + 1;
      return {
        q: [`For $p = ${p}$, what is the smallest $q$ for which $\\{${p}, q\\}$ tiles the hyperbolic plane?`, `$p = ${p}$ のとき、$\\{${p}, q\\}$ が双曲平面を敷き詰める最小の $q$ はいくつですか。`],
        a: { type: 'int', v: qmin },
        hint: ['You need $(p - 2)(q - 2) > 4$.', '$(p - 2)(q - 2) > 4$ が必要です。'],
        sol: [[`$(${p} - 2)(q - 2) > 4$ means $q > 2 + ${frac(4, p - 2)}$.`, `$(${p} - 2)(q - 2) > 4$ は $q > 2 + ${frac(4, p - 2)}$ を意味します。`], [`The smallest integer is $q = ${qmin}$${(p - 2) * (qmin - 3) === 4 ? `; $q = ${qmin - 1}$ would tile the flat plane` : ''}.`, `最小の整数は $q = ${qmin}$ です${(p - 2) * (qmin - 3) === 4 ? `。$q = ${qmin - 1}$ では平面を敷き詰めます` : ''}。`]],
        set: { p, q: qmin },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const [p, q] = pickHyp(r);
      if (form === 0) {
        const num = (p - 2) * q - 2 * p, area = PI * num / q;
        return {
          q: [`What is the area of one tile of the regular tiling $\\{${p}, ${q}\\}$ (curvature $-1$)? Give an exact value or four decimals.`, `正則タイリング $\\{${p}, ${q}\\}$（曲率 $-1$）のタイル一枚の面積はいくつですか。厳密値か小数第4位までの値で答えてください。`],
          a: { type: 'num', v: area, tol: 6e-5, show: piFrac(num, q) },
          hint: ['Gauss-Bonnet for a polygon: area $= (p - 2)\\pi - (\\text{sum of the angles})$.', '多角形のガウス・ボンネ：面積 $= (p - 2)\\pi - (\\text{角の和})$ です。'],
          sol: [[`Each of the $${p}$ corners is $2\\pi/${q}$, so the angles add up to $${piFrac(2 * p, q)}$.`, `$${p}$ 個の頂点の角はどれも $2\\pi/${q}$ なので、角の和は $${piFrac(2 * p, q)}$ です。`], [`Area $= ${p - 2}\\pi - ${piFrac(2 * p, q)} = ${piFrac(num, q)} = ${n(area, 4)}$, the readout's tile area. Every tile has exactly this area, however small it looks near the rim.`, `面積 $= ${p - 2}\\pi - ${piFrac(2 * p, q)} = ${piFrac(num, q)} = ${n(area, 4)}$ で、読み取り欄のタイルの面積です。縁の近くでどれほど小さく見えても、どのタイルもちょうどこの面積です。`]],
          set: { p, q },
        };
      }
      if (form === 1) {
        const c = 1 / (Math.tan(PI / p) * Math.tan(PI / q)), R = Math.acosh(c);
        return {
          q: [`Find the hyperbolic distance from the centre of a tile of $\\{${p}, ${q}\\}$ to one of its corners. Give three decimals.`, `$\\{${p}, ${q}\\}$ のタイルの中心から頂点までの双曲距離を、小数第3位まで求めてください。`],
          a: { type: 'num', v: R, tol: 6e-4 },
          hint: ['Split the tile into $2p$ right triangles with angles $\\pi/p$ at the centre and $\\pi/q$ at the corner; for a right triangle, $\\cosh(\\text{hypotenuse}) = \\cot A \\cot B$.', 'タイルを、中心の角 $\\pi/p$、頂点の角 $\\pi/q$ の直角三角形 $2p$ 個に分けます。直角三角形では $\\cosh(\\text{斜辺}) = \\cot A \\cot B$ です。'],
          sol: [[`$\\cosh R = \\cot(\\pi/${p})\\cot(\\pi/${q}) = ${n(1 / Math.tan(PI / p), 5)} \\times ${n(1 / Math.tan(PI / q), 5)} = ${n(c, 5)}$.`, `$\\cosh R = \\cot(\\pi/${p})\\cot(\\pi/${q}) = ${n(1 / Math.tan(PI / p), 5)} \\times ${n(1 / Math.tan(PI / q), 5)} = ${n(c, 5)}$ です。`], [`$R = \\operatorname{arcosh} ${n(c, 5)} = ${n(R, 4)}$, the readout's centre-to-corner distance. In the disc picture the corner sits at Euclidean radius $\\tanh(R/2) = ${n(Math.tanh(R / 2), 4)}$.`, `$R = \\operatorname{arcosh} ${n(c, 5)} = ${n(R, 4)}$ で、読み取り欄の「中心から頂点まで」の値です。円板の図では頂点はユークリッド半径 $\\tanh(R/2) = ${n(Math.tanh(R / 2), 4)}$ にあります。`]],
          set: { p, q },
        };
      }
      const num = p * q - 2 * p - 2 * q, den = 2 * p * q;
      return {
        q: [`Each tile of $\\{${p}, ${q}\\}$ is cut into $2p$ congruent triangles with angles $\\pi/${p}$, $\\pi/${q}$, $\\pi/2$. What is the area of one of them?`, `$\\{${p}, ${q}\\}$ のタイルは、角が $\\pi/${p}$、$\\pi/${q}$、$\\pi/2$ の合同な三角形 $2p$ 個に分かれます。その一つの面積はいくつですか。`],
        a: { type: 'num', v: PI * num / den, tol: 1e-5, show: piFrac(num, den) },
        hint: ['Apply area $= \\pi - (\\alpha + \\beta + \\gamma)$ to the small triangle.', '小さな三角形に、面積 $= \\pi - (\\alpha + \\beta + \\gamma)$ を当てはめます。'],
        sol: [[`$\\pi - \\tfrac{\\pi}{${p}} - \\tfrac{\\pi}{${q}} - \\tfrac{\\pi}{2} = ${piFrac(num, den)} = ${n(PI * num / den, 5)}$.`, `$\\pi - \\tfrac{\\pi}{${p}} - \\tfrac{\\pi}{${q}} - \\tfrac{\\pi}{2} = ${piFrac(num, den)} = ${n(PI * num / den, 5)}$ です。`], [`Check: $${2 * p}$ of them make $${piFrac(2 * p * num, den)}$, the area of a tile. The two shades in the figure are these triangles and their mirror images.`, `確認：$${2 * p}$ 個で $${piFrac(2 * p * num, den)}$ となり、タイルの面積に一致します。図の二つの濃淡がこの三角形とその鏡像です。`]],
        set: { p, q },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [p, q] = pickHyp(r);
        const num = (p - 2) * q - 2 * p;
        return {
          q: [`A regular tiling with $${p}$-gons has tiles of area $${piFrac(num, q)}$. How many tiles meet at each corner?`, `正 $${p}$ 角形による正則タイリングのタイルの面積が $${piFrac(num, q)}$ です。各頂点に何枚のタイルが集まりますか。`],
          a: { type: 'int', v: q },
          hint: ['Set $(p - 2)\\pi - 2\\pi p/q$ equal to the area and solve for $q$.', '$(p - 2)\\pi - 2\\pi p/q$ を面積と等しいとおき、$q$ について解きます。'],
          sol: [[`$${p - 2}\\pi - \\dfrac{${2 * p}\\pi}{q} = ${piFrac(num, q)}$, so $\\dfrac{${2 * p}}{q} = ${p - 2} - ${frac(num, q)} = ${frac(2 * p, q)}$.`, `$${p - 2}\\pi - \\dfrac{${2 * p}\\pi}{q} = ${piFrac(num, q)}$ より $\\dfrac{${2 * p}}{q} = ${p - 2} - ${frac(num, q)} = ${frac(2 * p, q)}$ です。`], [`$q = ${q}$: the area alone determines the tiling, because in the hyperbolic plane a regular polygon's size and its angles fix each other.`, `$q = ${q}$ です。双曲平面では正多角形の大きさと角が互いを決めるので、面積だけでタイリングが決まります。`]],
          set: { p, q },
        };
      }
      if (form === 1) {
        const [p, q] = pickHyp(r);
        const c = Math.cos(PI / p) / Math.sin(PI / q), e = 2 * Math.acosh(c);
        return {
          q: [`Find the hyperbolic length of one edge of a tile in $\\{${p}, ${q}\\}$. Give three decimals.`, `$\\{${p}, ${q}\\}$ のタイルの辺一本の双曲的な長さを、小数第3位まで求めてください。`],
          a: { type: 'num', v: e, tol: 6e-4 },
          hint: ['In the right triangle with angles $\\pi/p$ (centre), $\\pi/q$ (corner), $\\pi/2$ (edge midpoint), $\\cos A = \\cosh a \\sin B$ for the side $a$ opposite $A$.', '角が $\\pi/p$（中心）、$\\pi/q$（頂点）、$\\pi/2$（辺の中点）の直角三角形で、角 $A$ の対辺 $a$ について $\\cos A = \\cosh a \\sin B$ が成り立ちます。'],
          sol: [[`The half-edge lies opposite the centre angle $\\pi/${p}$: $\\cosh\\tfrac{e}{2} = \\dfrac{\\cos(\\pi/${p})}{\\sin(\\pi/${q})} = ${n(c, 5)}$.`, `辺の半分は中心の角 $\\pi/${p}$ の対辺なので $\\cosh\\tfrac{e}{2} = \\dfrac{\\cos(\\pi/${p})}{\\sin(\\pi/${q})} = ${n(c, 5)}$ です。`], [`$e = 2\\operatorname{arcosh} ${n(c, 5)} = ${n(e, 4)}$. Unlike in the plane, the edge length cannot be chosen: it is forced by $p$ and $q$.`, `$e = 2\\operatorname{arcosh} ${n(c, 5)} = ${n(e, 4)}$ です。平面と違い、辺の長さは自由に選べず、$p$ と $q$ で決まります。`]],
          set: { p, q },
        };
      }
      const p = r.int(3, 8);
      return {
        q: [`Keep $p = ${p}$ fixed and let $q$ vary over the values that give hyperbolic tilings. Write the tile area as a function of $q$, and think about its limit as $q \\to \\infty$.`, `$p = ${p}$ を固定し、双曲タイリングになる範囲で $q$ を動かします。タイルの面積を $q$ の式で表し、$q \\to \\infty$ の極限も考えてください。`],
        a: { type: 'expr', v: `${p - 2}*pi - ${2 * p}*pi/q`, vars: ['q'], dom: { q: [7, 20] }, lhs: ['$A(q) =$', '$A(q) =$'] },
        hint: ['The $p$ corners each have angle $2\\pi/q$.', '$p$ 個の頂点の角はどれも $2\\pi/q$ です。'],
        sol: [[`$A(q) = (${p} - 2)\\pi - ${p}\\cdot\\dfrac{2\\pi}{q} = ${p - 2}\\pi - \\dfrac{${2 * p}\\pi}{q}$.`, `$A(q) = (${p} - 2)\\pi - ${p}\\cdot\\dfrac{2\\pi}{q} = ${p - 2}\\pi - \\dfrac{${2 * p}\\pi}{q}$ です。`], [`As $q \\to \\infty$ the corners close to angle $0$ and run out to the boundary circle: the tile becomes an ideal $${p}$-gon of area $${p - 2}\\pi$, the largest a $${p}$-gon can have.`, `$q \\to \\infty$ では頂点の角が $0$ に閉じて境界の円まで伸び、タイルは面積 $${p - 2}\\pi$ の理想 $${p}$ 角形になります。これは $${p}$ 角形がとりうる最大の面積です。`]],
        set: { p, q: 10 },
      };
    },
  ];
})();
