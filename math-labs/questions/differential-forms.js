'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const PI = Math.PI, TAU = 2 * PI;
  const CX = 0.35, CY = 0.2, C0 = Math.hypot(CX, CY); // the line-integral lab's starting centre
  const piTimes = (x) => `${n(x)}\\pi`;
  const turnsTxt = (t) => [`${n(t)} turn${t === 1 ? '' : 's'}`, `${n(t)} 周`];

  /* ---------- 1. line integrals ---------- */
  const radiusAway = (r, lo = 0.2, hi = 1.5) => { let x; do { x = r.step(lo, hi, 0.05); } while (Math.abs(x - C0) < 0.06); return x; };
  Q['line-integral'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rad = radiusAway(r), k = r.int(1, 2), enc = rad > C0, v = enc ? TAU * k : 0;
        return {
          q: [`Integrate $d\\theta = \\dfrac{-y\\,dx + x\\,dy}{x^2 + y^2}$ around the circle of radius $${n(rad)}$ centred at $(0.35, 0.2)$, ${k === 1 ? 'once' : 'twice'} anticlockwise.`, `$d\\theta = \\dfrac{-y\\,dx + x\\,dy}{x^2 + y^2}$ を、中心 $(0.35, 0.2)$、半径 $${n(rad)}$ の円に沿って反時計回りに ${k} 周積分してください。`],
          a: { type: 'num', v, tol: 1e-3, show: v ? `${2 * k}\\pi` : '0' },
          hint: ['Does the circle go around the origin? The centre is $\\sqrt{0.35^2 + 0.2^2} \\approx 0.403$ from it.', '円は原点のまわりを回るでしょうか。中心は原点から $\\sqrt{0.35^2 + 0.2^2} \\approx 0.403$ のところにあります。'],
          sol: [[enc ? `$${n(rad)} > 0.403$, so the origin is inside the circle.` : `$${n(rad)} < 0.403$, so the origin is outside the circle.`, enc ? `$${n(rad)} > 0.403$ なので、原点は円の内側にあります。` : `$${n(rad)} < 0.403$ なので、原点は円の外側にあります。`], [enc ? `Each turn the angle $\\theta$ increases by $2\\pi$: the integral is $${2 * k}\\pi$.` : 'The angle swings back and forth and returns to its start: the integral is $0$.', enc ? `1周ごとに角 $\\theta$ が $2\\pi$ 増えるので、積分は $${2 * k}\\pi$ です。` : '角は行ったり来たりして元に戻るので、積分は $0$ です。'], ['$d\\theta$ is closed, so only the winding number around the hole matters, not the radius or the shape.', '$d\\theta$ は閉形式なので、効くのは穴のまわりの回転数だけで、半径や形にはよりません。']],
          set: { field: 2, radius: rad, turns: k },
        };
      }
      if (form === 1) {
        const A = [r.int(-3, 3), r.int(-3, 3)]; let B; do { B = [r.int(-3, 3), r.int(-3, 3)]; } while (B[0] === A[0] && B[1] === A[1]);
        const v = B[0] * B[1] - A[0] * A[1];
        return {
          q: [`Find $\\int_\\gamma (y\\,dx + x\\,dy)$ along any path from $(${A.join(', ')})$ to $(${B.join(', ')})$.`, `$(${A.join(', ')})$ から $(${B.join(', ')})$ への任意の経路 $\\gamma$ に沿って $\\int_\\gamma (y\\,dx + x\\,dy)$ を求めてください。`],
          a: { type: 'int', v },
          hint: ['$y\\,dx + x\\,dy$ is the differential of a simple function.', '$y\\,dx + x\\,dy$ は簡単な関数の微分です。'],
          sol: [['$y\\,dx + x\\,dy = d(xy)$, so the integral is $xy$ at the end minus $xy$ at the start.', '$y\\,dx + x\\,dy = d(xy)$ なので、積分は終点の $xy$ から始点の $xy$ を引いたものです。'], [`$${B[0]}\\cdot(${B[1]}) - ${A[0]}\\cdot(${A[1]}) = ${v}$, whatever route the path takes.`, `経路の取り方によらず $${B[0]}\\cdot(${B[1]}) - ${A[0]}\\cdot(${A[1]}) = ${v}$ です。`]],
        };
      }
      const rad = r.step(0.2, 1.5, 0.1);
      return {
        q: [`Integrate $\\omega = -y\\,dx + x\\,dy$ once anticlockwise around a circle of radius $${n(rad)}$ (centred anywhere).`, `$\\omega = -y\\,dx + x\\,dy$ を、半径 $${n(rad)}$ の円（中心はどこでもよい）に沿って反時計回りに1周積分してください。`],
        a: { type: 'num', v: TAU * rad * rad, show: piTimes(2 * rad * rad) },
        hint: ['$d\\omega = 2\\,dx\\wedge dy$; use Stokes.', '$d\\omega = 2\\,dx\\wedge dy$ です。ストークスの定理を使います。'],
        sol: [['$d\\omega = (1 - (-1))\\,dx\\wedge dy = 2\\,dx\\wedge dy$.', '$d\\omega = (1 - (-1))\\,dx\\wedge dy = 2\\,dx\\wedge dy$ です。'], [`$\\oint\\omega = 2 \\times \\pi\\cdot${n(rad)}^2 = ${piTimes(2 * rad * rad)} = ${n(TAU * rad * rad, 4)}$: twice the enclosed area, wherever the circle is.`, `$\\oint\\omega = 2 \\times \\pi\\cdot${n(rad)}^2 = ${piTimes(2 * rad * rad)} = ${n(TAU * rad * rad, 4)}$ で、円がどこにあっても囲む面積の2倍です。`]],
        set: { field: 1, radius: rad, turns: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const rad = r.step(0.3, 1.5, 0.1), tau = r.pick([0.25, 0.5, 0.75, 1.25, 1.5]), Th = TAU * tau;
      const s0 = [CX + rad, CY], e = [CX + rad * Math.cos(Th), CY + rad * Math.sin(Th)];
      const intro = [`along the circle of radius $${n(rad)}$ centred at $(0.35, 0.2)$, starting at $(${n(s0[0])}, 0.2)$ and going ${turnsTxt(tau)[0]} anticlockwise`, `中心 $(0.35, 0.2)$、半径 $${n(rad)}$ の円に沿って、$(${n(s0[0])}, 0.2)$ から反時計回りに ${turnsTxt(tau)[1]}`];
      if (form === 0) {
        const v = rad * rad * Th + rad * (CY * (1 - Math.cos(Th)) + CX * Math.sin(Th));
        return {
          q: [`Integrate $\\omega = -y\\,dx + x\\,dy$ ${intro[0]}. Give three decimals.`, `$\\omega = -y\\,dx + x\\,dy$ を${intro[1]}積分してください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['Parametrise $x = 0.35 + r\\cos t$, $y = 0.2 + r\\sin t$ and pull $\\omega$ back to $dt$.', '$x = 0.35 + r\\cos t$、$y = 0.2 + r\\sin t$ とおき、$\\omega$ を $dt$ に引き戻します。'],
          sol: [[`$\\omega(\\dot\\gamma) = r^2 + r(0.35\\cos t + 0.2\\sin t)$ with $r = ${n(rad)}$.`, `$r = ${n(rad)}$ として $\\omega(\\dot\\gamma) = r^2 + r(0.35\\cos t + 0.2\\sin t)$ です。`], [`Integrate from $0$ to $\\Theta = ${n(Th, 4)}$: $r^2\\Theta + r\\big(0.35\\sin\\Theta + 0.2(1 - \\cos\\Theta)\\big) = ${n(v, 4)}$.`, `$0$ から $\\Theta = ${n(Th, 4)}$ まで積分すると $r^2\\Theta + r\\big(0.35\\sin\\Theta + 0.2(1 - \\cos\\Theta)\\big) = ${n(v, 4)}$ です。`], ['Over whole turns the centre terms cancel and only $2\\pi r^2$ per turn remains, as Stokes predicts.', '整数周では中心に由来する項が打ち消し合い、ストークスの定理どおり1周あたり $2\\pi r^2$ だけが残ります。']],
          set: { field: 1, radius: rad, turns: tau },
        };
      }
      if (form === 1) {
        const v = e[0] * e[1] - s0[0] * s0[1];
        return {
          q: [`Integrate $\\omega = d(xy)$ ${intro[0]}. Give three decimals.`, `$\\omega = d(xy)$ を${intro[1]}積分してください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['An exact form only cares about the end points. Where does the path end?', '完全形式で効くのは端点だけです。経路はどこで終わるでしょうか。'],
          sol: [[`The path ends at $(0.35 + ${n(rad)}\\cos ${n(Th, 4)},\\ 0.2 + ${n(rad)}\\sin ${n(Th, 4)}) = (${n(e[0], 4)}, ${n(e[1], 4)})$.`, `経路の終点は $(0.35 + ${n(rad)}\\cos ${n(Th, 4)},\\ 0.2 + ${n(rad)}\\sin ${n(Th, 4)}) = (${n(e[0], 4)}, ${n(e[1], 4)})$ です。`], [`$\\int d(xy) = ${n(e[0] * e[1], 4)} - ${n(s0[0] * s0[1], 4)} = ${n(v, 4)}$: the turns in between contribute nothing.`, `$\\int d(xy) = ${n(e[0] * e[1], 4)} - ${n(s0[0] * s0[1], 4)} = ${n(v, 4)}$ です。途中の周回は何も寄与しません。`]],
          set: { field: 0, radius: rad, turns: tau },
        };
      }
      let radd = rad; while (Math.abs(radd - C0) < 0.06) radd += 0.1;
      const s1 = [CX + radd, CY], N = 2000; let acc = 0, prev = Math.atan2(s1[1], s1[0]);
      for (let i = 1; i <= N; i++) { const t = Th * i / N, a = Math.atan2(CY + radd * Math.sin(t), CX + radd * Math.cos(t)); let d = a - prev; if (d > PI) d -= TAU; if (d < -PI) d += TAU; acc += d; prev = a; }
      const th0 = Math.atan2(s1[1], s1[0]), th1 = Math.atan2(CY + radd * Math.sin(Th), CX + radd * Math.cos(Th));
      return {
        q: [`Integrate $d\\theta$ along the circle of radius $${n(radd)}$ centred at $(0.35, 0.2)$, starting at $(${n(s1[0])}, 0.2)$ and going ${turnsTxt(tau)[0]} anticlockwise. Give three decimals.`, `$d\\theta$ を、中心 $(0.35, 0.2)$、半径 $${n(radd)}$ の円に沿って $(${n(s1[0])}, 0.2)$ から反時計回りに ${turnsTxt(tau)[1]}積分してください（小数第3位まで）。`],
        a: { type: 'num', v: acc, tol: 0.0015 },
        hint: ['The integral is the net change of the polar angle $\\theta$ along the path, followed continuously.', '積分は、経路に沿って連続的にたどった偏角 $\\theta$ の正味の変化です。'],
        sol: [[`At the start $\\theta = \\arctan(0.2/${n(s1[0])}) = ${n(th0, 4)}$; at the end the point has polar angle $${n(th1, 4)}$ up to multiples of $2\\pi$.`, `始点では $\\theta = \\arctan(0.2/${n(s1[0])}) = ${n(th0, 4)}$、終点の偏角は $2\\pi$ の倍数を除いて $${n(th1, 4)}$ です。`], [radd > C0 ? `The circle encloses the origin, so each complete turn adds $2\\pi$ on top of the change in angle: total $${n(acc, 4)}$.` : 'The circle does not enclose the origin, so $\\theta$ never completes a turn: the total is just the difference of the two angles, $' + n(acc, 4) + '$.', radd > C0 ? `円は原点を囲むので、角の変化に加えて1周ごとに $2\\pi$ が加わり、合計 $${n(acc, 4)}$ です。` : '円は原点を囲まないので $\\theta$ が1周することはなく、合計は二つの角の差 $' + n(acc, 4) + '$ だけです。']],
        set: { field: 2, radius: radd, turns: tau },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), b = r.int(-4, 4), c = r.nz(-3, 3);
        const P1 = terms([[2 * a, 'xy'], [b, '']]), Q1 = terms([[a, 'x^2'], [c, 'y']]);
        return {
          q: [`Show that $\\omega = (${P1})\\,dx + (${Q1})\\,dy$ is exact by finding $f$ with $df = \\omega$.`, `$\\omega = (${P1})\\,dx + (${Q1})\\,dy$ が完全形式であることを、$df = \\omega$ となる $f$ を求めて示してください。`],
          a: { type: 'expr', v: `${a}*x^2*y + ${b}*x + ${c / 2}*y^2`, vars: ['x', 'y'], dom: { x: [-1.5, 1.5], y: [-1.5, 1.5] }, const: true, lhs: ['$f(x, y) =$', '$f(x, y) =$'] },
          hint: ['Integrate the $dx$ coefficient in $x$, then fix the function of $y$ using the $dy$ coefficient.', '$dx$ の係数を $x$ で積分し、残る $y$ の関数を $dy$ の係数で決めます。'],
          sol: [[`First check $d\\omega = 0$: $\\partial_x(${Q1}) = ${2 * a}x = \\partial_y(${P1})$.`, `まず $d\\omega = 0$ を確かめます。$\\partial_x(${Q1}) = ${2 * a}x = \\partial_y(${P1})$ です。`], [`$f = \\int (${P1})\\,dx = ${terms([[a, 'x^2y'], [b, 'x']])} + g(y)$, and $f_y = ${terms([[a, 'x^2']])} + g'(y)$ must equal $${Q1}$, so $g' = ${terms([[c, 'y']])}$.`, `$f = \\int (${P1})\\,dx = ${terms([[a, 'x^2y'], [b, 'x']])} + g(y)$ で、$f_y = ${terms([[a, 'x^2']])} + g'(y)$ が $${Q1}$ に等しいので $g' = ${terms([[c, 'y']])}$ です。`], [`$f = ${terms([[a, 'x^2y'], [b, 'x'], [c === 2 || c === -2 ? c / 2 : frac(c, 2), 'y^2']])}$ plus any constant. Every line integral of $\\omega$ is now a difference of values of $f$.`, `$f = ${terms([[a, 'x^2y'], [b, 'x'], [c === 2 || c === -2 ? c / 2 : frac(c, 2), 'y^2']])}$（定数の差を除く）です。これで $\\omega$ の線積分はすべて $f$ の値の差になります。`]],
        };
      }
      if (form === 1) {
        const rad = r.step(0.3, 1.5, 0.1), V = 2 * rad * rad;
        return {
          q: [`One anticlockwise turn of a circle gives $\\oint(-y\\,dx + x\\,dy) = ${piTimes(V)}$. What is the radius?`, `円を反時計回りに1周すると $\\oint(-y\\,dx + x\\,dy) = ${piTimes(V)}$ になります。半径はいくつですか。`],
          a: { type: 'num', v: rad, tol: 1e-3 },
          hint: ['The integral is $2\\times$ the enclosed area.', '積分は囲む面積の2倍です。'],
          sol: [[`$2\\pi r^2 = ${piTimes(V)}$, so $r^2 = ${n(rad * rad)}$.`, `$2\\pi r^2 = ${piTimes(V)}$ より $r^2 = ${n(rad * rad)}$ です。`], [`$r = ${n(rad)}$. This is the planimeter principle: a line integral around a boundary measures the area inside.`, `$r = ${n(rad)}$ です。これは面積計の原理で、境界に沿った線積分が内側の面積を測ります。`]],
          set: { field: 1, radius: rad, turns: 1 },
        };
      }
      const al = r.int(-2, 2), be = r.nz(-2, 2), ga = r.nz(-2, 2), rad = radiusAway(r, 0.2, 1.2), k = r.int(1, 2), enc = rad > C0;
      const v = k * (TAU * be * rad * rad + (enc ? TAU * ga : 0));
      return {
        q: [`Let $\\omega = ${terms([[al, 'd(xy)'], [be, '(-y\\,dx + x\\,dy)'], [ga, 'd\\theta']])}$. Integrate it ${k === 1 ? 'once' : 'twice'} anticlockwise around the circle of radius $${n(rad)}$ centred at $(0.35, 0.2)$.`, `$\\omega = ${terms([[al, 'd(xy)'], [be, '(-y\\,dx + x\\,dy)'], [ga, 'd\\theta']])}$ を、中心 $(0.35, 0.2)$、半径 $${n(rad)}$ の円に沿って反時計回りに ${k} 周積分してください。`],
        a: { type: 'num', v, tol: 2e-3, show: `${n(2 * k * (be * rad * rad + (enc ? ga : 0)))}\\pi` },
        hint: ['Integrate the three pieces separately over whole turns: exact, constant $d\\omega$, and closed with a hole.', '三つの部分を整数周で別々に積分します。完全形式、$d\\omega$ が定数のもの、穴のある閉形式です。'],
        sol: [[`$d(xy)$ is exact: $0$ over whole turns. $-y\\,dx + x\\,dy$ gives $2\\pi r^2 = ${piTimes(2 * rad * rad)}$ per turn.`, `$d(xy)$ は完全形式なので整数周では $0$ です。$-y\\,dx + x\\,dy$ は1周あたり $2\\pi r^2 = ${piTimes(2 * rad * rad)}$ を与えます。`], [enc ? `The circle encloses the origin ($${n(rad)} > 0.403$), so $d\\theta$ gives $2\\pi$ per turn.` : `The circle misses the origin ($${n(rad)} < 0.403$), so $d\\theta$ gives $0$.`, enc ? `円は原点を囲む（$${n(rad)} > 0.403$）ので、$d\\theta$ は1周あたり $2\\pi$ を与えます。` : `円は原点を囲まない（$${n(rad)} < 0.403$）ので、$d\\theta$ は $0$ です。`], [`Total: $${k}\\times(${n(be)}\\cdot${piTimes(2 * rad * rad)}${enc ? ` + ${n(ga)}\\cdot 2\\pi` : ''}) = ${n(v, 4)}$. Only $d\\omega$ inside and the holes inside can contribute to a loop integral.`, `合計は $${k}\\times(${n(be)}\\cdot${piTimes(2 * rad * rad)}${enc ? ` + ${n(ga)}\\cdot 2\\pi` : ''}) = ${n(v, 4)}$ です。閉じた経路の積分に寄与できるのは、内側の $d\\omega$ と内側の穴だけです。`]],
      };
    },
  ];

  /* ---------- 2. Stokes / Green ---------- */
  const curl = (x, y) => 1 - x * x - y * y + 0.8 * x;
  const centred = (rad) => PI * rad * rad - PI * rad ** 4 / 2;
  Q.stokes = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(-4, 4), b = r.int(-4, 4); if (a === 0 && b === 0) return Q.stokes[0](r);
        return {
          q: [`For $\\omega = ${terms([[a, 'y\\,dx'], [b, 'x\\,dy']])}$, write $d\\omega = c\\,dx\\wedge dy$. What is $c$?`, `$\\omega = ${terms([[a, 'y\\,dx'], [b, 'x\\,dy']])}$ について $d\\omega = c\\,dx\\wedge dy$ と書きます。$c$ はいくつですか。`],
          a: { type: 'int', v: b - a },
          hint: ['$d(P\\,dx + Q\\,dy) = (\\partial_x Q - \\partial_y P)\\,dx\\wedge dy$, because $dy\\wedge dx = -dx\\wedge dy$.', '$dy\\wedge dx = -dx\\wedge dy$ なので $d(P\\,dx + Q\\,dy) = (\\partial_x Q - \\partial_y P)\\,dx\\wedge dy$ です。'],
          sol: [[`$\\partial_x Q = ${b}$ and $\\partial_y P = ${a}$.`, `$\\partial_x Q = ${b}$、$\\partial_y P = ${a}$ です。`], [`$c = ${b} - (${a}) = ${b - a}$. ${b === a ? 'Here $\\omega = d(' + a + 'xy)$ is exact, so $d\\omega = 0$.' : `Every anticlockwise loop integral of $\\omega$ is $${b - a}$ times the enclosed area.`}`, `$c = ${b} - (${a}) = ${b - a}$ です。${b === a ? 'このとき $\\omega = d(' + a + 'xy)$ は完全形式で $d\\omega = 0$ です。' : `$\\omega$ の反時計回りの周回積分は、どれも囲む面積の $${b - a}$ 倍になります。`}`]],
        };
      }
      if (form === 1) {
        const x = r.step(-1.5, 1.5, 0.5), y = r.step(-1.5, 1.5, 0.5), v = curl(x, y);
        return {
          q: [`For the lab's $\\omega = (-\\tfrac{y}{2} + \\tfrac{y^3}{3})\\,dx + (\\tfrac{x}{2} - \\tfrac{x^3}{3} + 0.4x^2)\\,dy$, find the coefficient of $d\\omega$ at $(${n(x)}, ${n(y)})$.`, `この実験の $\\omega = (-\\tfrac{y}{2} + \\tfrac{y^3}{3})\\,dx + (\\tfrac{x}{2} - \\tfrac{x^3}{3} + 0.4x^2)\\,dy$ について、$(${n(x)}, ${n(y)})$ における $d\\omega$ の係数を求めてください。`],
          a: { type: 'num', v, tol: 1e-6 },
          hint: ['Compute $\\partial_x Q - \\partial_y P$ first, then substitute.', 'まず $\\partial_x Q - \\partial_y P$ を計算してから代入します。'],
          sol: [['$\\partial_x Q = \\tfrac12 - x^2 + 0.8x$ and $\\partial_y P = -\\tfrac12 + y^2$, so $d\\omega = (1 - x^2 - y^2 + 0.8x)\\,dx\\wedge dy$.', '$\\partial_x Q = \\tfrac12 - x^2 + 0.8x$、$\\partial_y P = -\\tfrac12 + y^2$ なので $d\\omega = (1 - x^2 - y^2 + 0.8x)\\,dx\\wedge dy$ です。'], [`At $(${n(x)}, ${n(y)})$: $1 - ${n(x * x)} - ${n(y * y)} + ${n(0.8 * x)} = ${n(v)}$, ${v > 0 ? 'inside the warm region' : v < 0 ? 'in the cool region outside the dashed circle' : 'exactly on the dashed circle'}.`, `$(${n(x)}, ${n(y)})$ では $1 - ${n(x * x)} - ${n(y * y)} + ${n(0.8 * x)} = ${n(v)}$ で、${v > 0 ? '暖色の領域の中' : v < 0 ? '破線の円の外の寒色の領域' : 'ちょうど破線の円の上'}です。`]],
        };
      }
      const a = r.int(1, 5); let b; do { b = r.int(1, 4); } while (b === a);
      return {
        q: [`Use Green's theorem to find $\\oint x\\,dy$ anticlockwise around the ellipse $x^2/${a * a} + y^2/${b * b} = 1$.`, `グリーンの定理を使って、楕円 $x^2/${a * a} + y^2/${b * b} = 1$ に沿った反時計回りの $\\oint x\\,dy$ を求めてください。`],
        a: { type: 'num', v: PI * a * b, show: `${a * b === 1 ? '' : a * b}\\pi` },
        hint: ['$d(x\\,dy) = dx\\wedge dy$, the area form.', '$d(x\\,dy) = dx\\wedge dy$ は面積形式です。'],
        sol: [['$\\oint x\\,dy = \\iint dx\\wedge dy$, the enclosed area.', '$\\oint x\\,dy = \\iint dx\\wedge dy$ は囲まれた面積です。'], [`The ellipse with semi-axes $${a}$ and $${b}$ has area $${a * b === 1 ? '' : a * b}\\pi = ${n(PI * a * b, 4)}$.`, `半軸 $${a}$ と $${b}$ の楕円の面積は $${a * b === 1 ? '' : a * b}\\pi = ${n(PI * a * b, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rad = r.step(0.2, 1.5, 0.1), o = r.pick([1, -1]), v = o * centred(rad);
        return {
          q: [`Centre the disk at the origin with radius $${n(rad)}$ and ${o > 0 ? 'anticlockwise' : 'clockwise'} orientation. Find $\\oint_{\\partial S}\\omega$ for the lab's $\\omega$, to four decimals.`, `円板の中心を原点に、半径を $${n(rad)}$、向きを${o > 0 ? '反時計回り' : '時計回り'}にします。この実験の $\\omega$ について $\\oint_{\\partial S}\\omega$ を小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 1e-4 },
          hint: ['Use $\\iint d\\omega$ in polar coordinates; the $0.8x$ term averages to zero over a centred disk.', '$\\iint d\\omega$ を極座標で計算します。$0.8x$ の項は中心をもつ円板上で平均が 0 です。'],
          sol: [['$\\iint_S (1 - \\rho^2 + 0.8\\rho\\cos\\phi)\\,\\rho\\,d\\rho\\,d\\phi = 2\\pi\\left(\\tfrac{r^2}{2} - \\tfrac{r^4}{4}\\right) = \\pi r^2 - \\tfrac{\\pi}{2}r^4$.', '$\\iint_S (1 - \\rho^2 + 0.8\\rho\\cos\\phi)\\,\\rho\\,d\\rho\\,d\\phi = 2\\pi\\left(\\tfrac{r^2}{2} - \\tfrac{r^4}{4}\\right) = \\pi r^2 - \\tfrac{\\pi}{2}r^4$ です。'], [`At $r = ${n(rad)}$: $${n(centred(rad), 5)}$${o < 0 ? ', and the clockwise orientation flips the sign' : ''}: $${n(v, 5)}$.`, `$r = ${n(rad)}$ では $${n(centred(rad), 5)}$${o < 0 ? ' で、時計回りの向きで符号が反転し' : ' で'}、$${n(v, 5)}$ です。`], ['The readout shows the boundary integral and the area integral agreeing to many digits; the two are computed separately.', '読み取り欄では、別々に計算した境界の積分と面積の積分が何桁も一致します。']],
          set: { radius: rad, orientation: o },
        };
      }
      if (form === 1) {
        const a = r.int(-3, 3), b = r.int(-3, 3), R = r.step(0.5, 3, 0.5); if (a === b) return Q.stokes[1](r);
        return {
          q: [`Find $\\oint (${terms([[a, 'y\\,dx'], [b, 'x\\,dy']])})$ anticlockwise around the circle of radius $${n(R)}$ centred at $(2, -1)$.`, `中心 $(2, -1)$、半径 $${n(R)}$ の円に沿って、反時計回りに $\\oint (${terms([[a, 'y\\,dx'], [b, 'x\\,dy']])})$ を求めてください。`],
          a: { type: 'num', v: (b - a) * PI * R * R, show: `${n((b - a) * R * R)}\\pi` },
          hint: ['$d\\omega$ is constant here, so the centre does not matter.', 'ここでは $d\\omega$ が定数なので、中心の位置は関係ありません。'],
          sol: [[`$d\\omega = (${b} - (${a}))\\,dx\\wedge dy = ${b - a}\\,dx\\wedge dy$.`, `$d\\omega = (${b} - (${a}))\\,dx\\wedge dy = ${b - a}\\,dx\\wedge dy$ です。`], [`$\\oint\\omega = ${b - a}\\cdot\\pi\\cdot${n(R * R)} = ${n((b - a) * R * R)}\\pi = ${n((b - a) * PI * R * R, 4)}$, found without parametrising the circle at all.`, `円をパラメータ表示せずに $\\oint\\omega = ${b - a}\\cdot\\pi\\cdot${n(R * R)} = ${n((b - a) * R * R)}\\pi = ${n((b - a) * PI * R * R, 4)}$ が得られます。`]],
        };
      }
      const a = r.int(1, 3), b = r.int(1, 3), num = a * b ** 3 - a ** 3 * b;
      return {
        q: [`Let $\\omega = x^2y\\,dx + xy^2\\,dy$ and $S = [0, ${a}]\\times[0, ${b}]$. Find $\\oint_{\\partial S}\\omega$ (anticlockwise).`, `$\\omega = x^2y\\,dx + xy^2\\,dy$、$S = [0, ${a}]\\times[0, ${b}]$ とします。$\\oint_{\\partial S}\\omega$（反時計回り）を求めてください。`],
        a: { type: 'num', v: num / 3, show: frac(num, 3) },
        hint: ['Compute $d\\omega$ and integrate it over the rectangle.', '$d\\omega$ を計算し、長方形上で積分します。'],
        sol: [['$d\\omega = (\\partial_x(xy^2) - \\partial_y(x^2y))\\,dx\\wedge dy = (y^2 - x^2)\\,dx\\wedge dy$.', '$d\\omega = (\\partial_x(xy^2) - \\partial_y(x^2y))\\,dx\\wedge dy = (y^2 - x^2)\\,dx\\wedge dy$ です。'], [`$\\iint_S (y^2 - x^2) = ${a}\\cdot\\tfrac{${b ** 3}}{3} - \\tfrac{${a ** 3}}{3}\\cdot${b} = ${frac(num, 3)}$.`, `$\\iint_S (y^2 - x^2) = ${a}\\cdot\\tfrac{${b ** 3}}{3} - \\tfrac{${a ** 3}}{3}\\cdot${b} = ${frac(num, 3)}$ です。`], [a === b ? 'The square is symmetric under $x \\leftrightarrow y$, which swaps the two terms and makes the total $0$.' : 'One double integral replaces four line integrals, one along each side.', a === b ? '正方形は $x \\leftrightarrow y$ で対称で、二つの項が入れ替わって合計が $0$ になります。' : '四辺それぞれの線積分四つが、二重積分一つで済みます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        if (r.chance(0.5)) {
          return {
            q: ['With the disk centred at the origin, which radius makes the anticlockwise circulation of the lab\'s $\\omega$ as large as possible, and how large is it?', '円板の中心を原点にするとき、この実験の $\\omega$ の反時計回りの循環を最大にする半径はいくつで、そのときの値はいくつですか。'],
            a: { type: 'tuple', v: [1, PI / 2], labels: ['$r$', '$\\oint\\omega$'], tol: 2e-3 },
            hint: ['Differentiate the circulation with respect to $r$; by Stokes, the derivative is the integral of $d\\omega$ around the rim.', '循環を $r$ で微分します。ストークスの定理より、その導関数は縁の上での $d\\omega$ の積分です。'],
            sol: [['$C(r) = \\pi r^2 - \\tfrac{\\pi}{2}r^4$, so $C\'(r) = 2\\pi r(1 - r^2)$, zero at $r = 1$.', '$C(r) = \\pi r^2 - \\tfrac{\\pi}{2}r^4$ なので $C\'(r) = 2\\pi r(1 - r^2)$ で、$r = 1$ で 0 です。'], ['$C(1) = \\pi/2 \\approx 1.5708$. At $r = 1$ the average of $d\\omega$ on the rim is $1 - r^2 = 0$: growing further only adds negative $d\\omega$.', '$C(1) = \\pi/2 \\approx 1.5708$ です。$r = 1$ で縁の上の $d\\omega$ の平均 $1 - r^2$ が 0 になり、それ以上大きくすると負の $d\\omega$ を加えるだけです。']],
            set: { radius: 1, orientation: 1 },
          };
        }
        return {
          q: ['With the disk centred at the origin, at which radius $r > 0$ does the circulation of the lab\'s $\\omega$ return to zero? Give three decimals.', '円板の中心を原点にするとき、この実験の $\\omega$ の循環がふたたび 0 になる半径 $r > 0$ はいくつですか。小数第3位まで答えてください。'],
          a: { type: 'num', v: Math.SQRT2, tol: 6e-4, show: '\\sqrt2' },
          hint: ['Solve $\\pi r^2 - \\tfrac{\\pi}{2}r^4 = 0$.', '$\\pi r^2 - \\tfrac{\\pi}{2}r^4 = 0$ を解きます。'],
          sol: [['$\\pi r^2(1 - r^2/2) = 0$ gives $r^2 = 2$.', '$\\pi r^2(1 - r^2/2) = 0$ より $r^2 = 2$ です。'], ['$r = \\sqrt2 \\approx 1.414$: the positive $d\\omega$ in the middle is exactly cancelled by the negative ring outside the dashed circle, so the loop integral vanishes although $\\omega$ is nowhere zero on it.', '$r = \\sqrt2 \\approx 1.414$ です。中央の正の $d\\omega$ が破線の円の外の負の輪でちょうど打ち消され、$\\omega$ は経路上のどこでも 0 でないのに周回積分は 0 になります。']],
          set: { radius: 1.4, orientation: 1 },
        };
      }
      if (form === 1) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.int(-2, 2), d = r.nz(-2, 2);
        const Pt = terms([[1, 'x^2y'], [a, 'y^3'], [c, 'x']]), Qt = terms([[b, 'x^3'], [1, 'xy^2'], [d, 'y']]);
        return {
          q: [`Find the coefficient $g(x, y)$ in $d\\omega = g\\,dx\\wedge dy$ for $\\omega = (${Pt})\\,dx + (${Qt})\\,dy$.`, `$\\omega = (${Pt})\\,dx + (${Qt})\\,dy$ について、$d\\omega = g\\,dx\\wedge dy$ の係数 $g(x, y)$ を求めてください。`],
          a: { type: 'expr', v: `${3 * b - 1}*x^2 + (${1 - 3 * a})*y^2`, vars: ['x', 'y'], dom: { x: [-1.5, 1.5], y: [-1.5, 1.5] }, lhs: ['$g(x, y) =$', '$g(x, y) =$'] },
          hint: ['$g = \\partial_x Q - \\partial_y P$. Terms of $P$ without $y$ and of $Q$ without $x$ drop out.', '$g = \\partial_x Q - \\partial_y P$ です。$y$ を含まない $P$ の項や $x$ を含まない $Q$ の項は消えます。'],
          sol: [[`$\\partial_x Q = ${terms([[3 * b, 'x^2'], [1, 'y^2']])}$ and $\\partial_y P = ${terms([[1, 'x^2'], [3 * a, 'y^2']])}$.`, `$\\partial_x Q = ${terms([[3 * b, 'x^2'], [1, 'y^2']])}$、$\\partial_y P = ${terms([[1, 'x^2'], [3 * a, 'y^2']])}$ です。`], [`$g = ${terms([[3 * b - 1, 'x^2'], [1 - 3 * a, 'y^2']]) || '0'}$. The terms $${terms([[c, 'x']]) || '0'}$ and $${terms([[d, 'y']]) || '0'}$ are exact pieces and contribute nothing to any loop integral.`, `$g = ${terms([[3 * b - 1, 'x^2'], [1 - 3 * a, 'y^2']]) || '0'}$ です。$${terms([[c, 'x']]) || '0'}$ と $${terms([[d, 'y']]) || '0'}$ は完全形式の部分で、どの周回積分にも寄与しません。`]],
        };
      }
      const rad = r.step(0.3, 1.4, 0.1), h = r.pick([rad, 0.5, 1, 1.5].filter((x) => x <= 1.5));
      const hemi = Math.abs(h - rad) < 1e-9, v = centred(rad);
      return {
        q: [`Extend $\\omega$ to the vector field $\\mathbf F = (P, Q, 0)$ in space. Take the circle of radius $${n(rad)}$ about the origin in the plane $z = 0$ and ${hemi ? 'the upper hemisphere' : `the spherical cap of height $${n(h)}$`} bounded by it. Find the upward flux of $\\nabla\\times\\mathbf F$ through the cap, to four decimals.`, `$\\omega$ を空間のベクトル場 $\\mathbf F = (P, Q, 0)$ に拡張します。平面 $z = 0$ 上の原点を中心とする半径 $${n(rad)}$ の円と、それを縁とする${hemi ? '上半球面' : `高さ $${n(h)}$ の球冠`}を考えます。球冠を上向きに通る $\\nabla\\times\\mathbf F$ の流束を小数第4位まで求めてください。`],
        a: { type: 'num', v, tol: 1e-4 },
        hint: ['Stokes: the flux through any surface with this boundary equals the circulation around the circle.', 'ストークスの定理：この縁をもつどの曲面の流束も、円に沿った循環に等しくなります。'],
        sol: [['$\\nabla\\times\\mathbf F = (0, 0, \\partial_x Q - \\partial_y P)$, and $\\nabla\\cdot(\\nabla\\times\\mathbf F) = 0$, so every surface spanning the circle carries the same flux.', '$\\nabla\\times\\mathbf F = (0, 0, \\partial_x Q - \\partial_y P)$ で $\\nabla\\cdot(\\nabla\\times\\mathbf F) = 0$ なので、円を縁とするどの曲面にも同じ流束が流れます。'], [`It equals $\\oint\\omega = \\pi r^2 - \\tfrac{\\pi}{2}r^4 = ${n(v, 5)}$ for $r = ${n(rad)}$.`, `$r = ${n(rad)}$ ではそれは $\\oint\\omega = \\pi r^2 - \\tfrac{\\pi}{2}r^4 = ${n(v, 5)}$ に等しくなります。`], ['The cap tilts the area elements, but only their vertical component meets the vertical curl, and those vertical components add up to the flat disk.', '球冠は面積要素を傾けますが、鉛直なカールと出会うのは鉛直成分だけで、その鉛直成分を足し合わせると平らな円板になります。']],
        set: { radius: rad, orientation: 1, cap: h },
      };
    },
  ];

  /* ---------- 3. pullbacks ---------- */
  const lab = (s, k, c) => `\\phi(u, v) = (${terms([[s, 'u'], [k, 'v']])},\\ ${terms([[1, 'v'], [c, 'u^2']])})`;
  const pickLab = (r) => [r.step(0.5, 2, 0.05), r.step(-1, 1, 0.05), r.step(0, 1, 0.05)];
  Q.pullback = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [s, k, c] = pickLab(r), u = r.step(-1.2, 1.2, 0.1), v = r.step(-1, 1, 0.5), d = s - 2 * c * k * u;
        return {
          q: [`For $${lab(s, k, c)}$, find $\\det D\\phi$ at $(u, v) = (${n(u)}, ${n(v)})$.`, `$${lab(s, k, c)}$ について、$(u, v) = (${n(u)}, ${n(v)})$ における $\\det D\\phi$ を求めてください。`],
          a: { type: 'num', v: d, tol: 1e-6 },
          hint: ['$D\\phi = \\begin{pmatrix} s & k \\\\ 2cu & 1 \\end{pmatrix}$.', '$D\\phi = \\begin{pmatrix} s & k \\\\ 2cu & 1 \\end{pmatrix}$ です。'],
          sol: [[`$\\det D\\phi = s\\cdot 1 - k\\cdot 2cu = ${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\cdot${n(u)}$.`, `$\\det D\\phi = s\\cdot 1 - k\\cdot 2cu = ${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\cdot${n(u)}$ です。`], [`$= ${n(d)}$, independent of $v$. ${d > 0 ? 'Orientation is kept there.' : d < 0 ? 'Negative: the map reverses orientation there.' : 'Zero: the point lies on the fold line.'}`, `$= ${n(d)}$ で、$v$ によりません。${d > 0 ? 'そこでは向きが保たれます。' : d < 0 ? '負なので、そこでは写像が向きを反転します。' : '0 なので、その点は折り目の線上にあります。'}`]],
          set: { scale: s, shear: k, bend: c },
        };
      }
      if (form === 1) {
        const M = [[r.int(-3, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 3)]], d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
        return {
          q: [`The linear map $\\phi(u, v) = (${terms([[M[0][0], 'u'], [M[0][1], 'v']]) || '0'},\\ ${terms([[M[1][0], 'u'], [M[1][1], 'v']]) || '0'})$ pulls $dx\\wedge dy$ back to $c\\,du\\wedge dv$. Find $c$.`, `線形写像 $\\phi(u, v) = (${terms([[M[0][0], 'u'], [M[0][1], 'v']]) || '0'},\\ ${terms([[M[1][0], 'u'], [M[1][1], 'v']]) || '0'})$ は $dx\\wedge dy$ を $c\\,du\\wedge dv$ に引き戻します。$c$ を求めてください。`],
          a: { type: 'int', v: d },
          hint: ['$\\phi^*(dx\\wedge dy) = d(\\phi^*x)\\wedge d(\\phi^*y)$; expand with $du\\wedge du = 0$.', '$\\phi^*(dx\\wedge dy) = d(\\phi^*x)\\wedge d(\\phi^*y)$ です。$du\\wedge du = 0$ を使って展開します。'],
          sol: [[`$(${M[0][0]}\\,du + ${M[0][1]}\\,dv)\\wedge(${M[1][0]}\\,du + ${M[1][1]}\\,dv) = (${M[0][0]}\\cdot${M[1][1]} - ${M[0][1]}\\cdot${M[1][0]})\\,du\\wedge dv$.`, `$(${M[0][0]}\\,du + ${M[0][1]}\\,dv)\\wedge(${M[1][0]}\\,du + ${M[1][1]}\\,dv) = (${M[0][0]}\\cdot${M[1][1]} - ${M[0][1]}\\cdot${M[1][0]})\\,du\\wedge dv$ です。`], [`$c = ${d}$, the determinant: the wedge product computes it by itself. ${d === 0 ? 'Zero: the map squashes the plane onto a line.' : d < 0 ? 'Negative: the map reflects as well as stretches.' : ''}`, `$c = ${d}$ で、行列式そのものです。ウェッジ積がひとりでに行列式を計算します。${d === 0 ? '0 なので、写像は平面を直線につぶします。' : d < 0 ? '負なので、写像は伸縮に加えて裏返します。' : ''}`]],
        };
      }
      let s, k, c, u, d; do { [s, k, c] = pickLab(r); u = r.step(-1.2, 1.2, 0.1); d = s - 2 * c * k * u; } while (Math.abs(d) < 0.02 || (d > 0 && r.chance(0.5)));
      return {
        q: [`At $u = ${n(u)}$, does $${lab(s, k, c)}$ keep or reverse orientation?`, `$u = ${n(u)}$ で、$${lab(s, k, c)}$ は向きを保ちますか、反転しますか。`],
        a: { type: 'choice', opts: [['keeps it', '保つ'], ['reverses it', '反転する']], v: d > 0 ? 0 : 1, fixed: true },
        hint: ['Look at the sign of $\\det D\\phi = s - 2cku$.', '$\\det D\\phi = s - 2cku$ の符号を見てください。'],
        sol: [[`$\\det D\\phi = ${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\cdot${n(u)} = ${n(d)}$.`, `$\\det D\\phi = ${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\cdot${n(u)} = ${n(d)}$ です。`], [d > 0 ? 'Positive: a small anticlockwise loop maps to an anticlockwise loop.' : 'Negative: a small anticlockwise loop maps to a clockwise one, as on the far side of the fold line.', d > 0 ? '正なので、小さな反時計回りの輪は反時計回りの輪に写ります。' : '負なので、小さな反時計回りの輪は時計回りの輪に写ります。折り目の向こう側で起こることです。']],
        set: { scale: s, shear: k, bend: c },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let s, k, c, uf; do { [s, k, c] = pickLab(r); uf = s / (2 * c * k); } while (!(c > 0 && Math.abs(k) > 0 && Math.abs(uf) < 1.2));
        return {
          q: [`Where is the fold line of $${lab(s, k, c)}$? Give the value of $u$ to three decimals.`, `$${lab(s, k, c)}$ の折り目の線はどこにありますか。$u$ の値を小数第3位まで答えてください。`],
          a: { type: 'num', v: uf, tol: 6e-4 },
          hint: ['The fold is where $\\det D\\phi = 0$.', '折り目は $\\det D\\phi = 0$ となるところです。'],
          sol: [[`$${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\,u = 0$.`, `$${n(s)} - 2\\cdot${n(c)}\\cdot${n(k)}\\,u = 0$ です。`], [`$u = ${n(s)}/${n(2 * c * k)} = ${n(uf, 4)}$, inside the square $|u| \\le 1.2$, so the image folds over itself along the image of this line.`, `$u = ${n(s)}/${n(2 * c * k)} = ${n(uf, 4)}$ で、正方形 $|u| \\le 1.2$ の内側にあるので、像はこの直線の像に沿って折り重なります。`]],
          set: { scale: s, shear: k, bend: c },
        };
      }
      if (form === 1) {
        const [s, k, c] = pickLab(r), tot = s * 2.4 * 2.4;
        return {
          q: [`Find $\\iint_{[-1.2, 1.2]^2} \\phi^*(dx\\wedge dy)$ for $${lab(s, k, c)}$.`, `$${lab(s, k, c)}$ について $\\iint_{[-1.2, 1.2]^2} \\phi^*(dx\\wedge dy)$ を求めてください。`],
          a: { type: 'num', v: tot, tol: 1e-4 },
          hint: ['$\\phi^*(dx\\wedge dy) = (s - 2cku)\\,du\\wedge dv$; the $u$ term is odd.', '$\\phi^*(dx\\wedge dy) = (s - 2cku)\\,du\\wedge dv$ で、$u$ の項は奇関数です。'],
          sol: [[`The term $-2cku$ integrates to $0$ over the symmetric square.`, `$-2cku$ の項は対称な正方形上で積分すると $0$ です。`], [`$${n(s)}\\times 2.4^2 = ${n(tot, 4)}$, the readout's value: the signed area of the image, counted with multiplicity${Math.abs(s / (2 * c * k || 1e-9)) < 1.2 && c * k !== 0 ? '; here the fold makes the overlapping part count with both signs' : ''}.`, `$${n(s)}\\times 2.4^2 = ${n(tot, 4)}$ で、読み取り欄の値です。重複度を込めた像の符号付き面積です${Math.abs(s / (2 * c * k || 1e-9)) < 1.2 && c * k !== 0 ? '。ここでは折り目があるので、重なった部分が両方の符号で数えられます' : ''}。`]],
          set: { scale: s, shear: k, bend: c },
        };
      }
      const [s, k, c] = pickLab(r), u = r.step(-1, 1, 0.5), v = r.step(-1, 1, 0.5), x = s * u + k * v, d = s - 2 * c * k * u, val = x * d;
      return {
        q: [`For $${lab(s, k, c)}$, write $\\phi^*(x\\,dx\\wedge dy) = g\\,du\\wedge dv$ and find $g$ at $(u, v) = (${n(u)}, ${n(v)})$.`, `$${lab(s, k, c)}$ について $\\phi^*(x\\,dx\\wedge dy) = g\\,du\\wedge dv$ と書き、$(u, v) = (${n(u)}, ${n(v)})$ における $g$ を求めてください。`],
        a: { type: 'num', v: val, tol: 1e-4 },
        hint: ['Pull back the function and the area form separately: $\\phi^*(f\\,dx\\wedge dy) = (f\\circ\\phi)\\det D\\phi\\,du\\wedge dv$.', '関数と面積形式を別々に引き戻します。$\\phi^*(f\\,dx\\wedge dy) = (f\\circ\\phi)\\det D\\phi\\,du\\wedge dv$ です。'],
        sol: [[`$x\\circ\\phi = ${n(s)}\\cdot${n(u)} + ${n(k)}\\cdot${n(v)} = ${n(x)}$ and $\\det D\\phi = ${n(d)}$.`, `$x\\circ\\phi = ${n(s)}\\cdot${n(u)} + ${n(k)}\\cdot${n(v)} = ${n(x)}$、$\\det D\\phi = ${n(d)}$ です。`], [`$g = ${n(x)}\\times${n(d)} = ${n(val, 5)}$. This is the change-of-variables formula: integrating $g$ over $(u, v)$ is integrating $x$ over the image.`, `$g = ${n(x)}\\times${n(d)} = ${n(val, 5)}$ です。これが変数変換の公式で、$g$ を $(u, v)$ で積分することは $x$ を像の上で積分することです。`]],
        set: { scale: s, shear: k, bend: c },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3]);
        const fam = r.pick([
          [`(u^2 - v^2,\\ 2uv)`, '4*(u^2+v^2)', '4(u^2 + v^2)', 'the squaring map $z \\mapsto z^2$ stretches areas by $|2z|^2$'],
          [`(${a === 1 ? '' : a}u\\cos v,\\ ${a === 1 ? '' : a}u\\sin v)`, `${a * a}*u`, `${a * a === 1 ? '' : a * a}u`, 'polar coordinates: the area element is the familiar $r\\,dr\\,d\\theta$, scaled'],
          [`(e^u\\cos v,\\ e^u\\sin v)`, 'exp(2*u)', 'e^{2u}', 'the exponential map stretches areas by $|e^z|^2$'],
          [`(uv,\\ ${a === 1 ? '' : a}v)`, `${a}*v`, `${a === 1 ? '' : a}v`, 'the map collapses the line $v = 0$, where the factor vanishes'],
          [`(u + ${a}v^2,\\ v + ${a}u^2)`, `1 - ${4 * a * a}*u*v`, `1 - ${4 * a * a}uv`, `it folds along the hyperbola $uv = 1/${4 * a * a}$`],
        ]);
        return {
          q: [`Write $\\phi^*(dx\\wedge dy) = g(u, v)\\,du\\wedge dv$ for $\\phi(u, v) = ${fam[0]}$. Find $g$.`, `$\\phi(u, v) = ${fam[0]}$ について $\\phi^*(dx\\wedge dy) = g(u, v)\\,du\\wedge dv$ と書きます。$g$ を求めてください。`],
          a: { type: 'expr', v: fam[1], vars: ['u', 'v'], dom: { u: [0.2, 1.4], v: [-1.2, 1.2] }, lhs: ['$g(u, v) =$', '$g(u, v) =$'] },
          hint: ['$g = \\det D\\phi = x_u y_v - x_v y_u$.', '$g = \\det D\\phi = x_u y_v - x_v y_u$ です。'],
          sol: [['Compute the four partial derivatives and take $x_u y_v - x_v y_u$.', '四つの偏導関数を計算し、$x_u y_v - x_v y_u$ をとります。'], [`$g = ${fam[2]}$: ${fam[3]}.`, `$g = ${fam[2]}$ です。`]],
        };
      }
      if (form === 1) {
        const [s, k, c] = pickLab(r);
        return {
          q: [`For $${lab(s, k, c)}$, the pullback $\\phi^*(x\\,dy)$ is $A\\,du + B\\,dv$. Find $A(u, v)$.`, `$${lab(s, k, c)}$ について、引き戻し $\\phi^*(x\\,dy)$ は $A\\,du + B\\,dv$ の形です。$A(u, v)$ を求めてください。`],
          a: { type: 'expr', v: `(${s}*u + ${k}*v)*${2 * c}*u`, vars: ['u', 'v'], dom: { u: [-1.2, 1.2], v: [-1.2, 1.2] }, lhs: ['$A(u, v) =$', '$A(u, v) =$'] },
          hint: ['Substitute $x = \\phi^*x$ and $dy = d(\\phi^*y)$.', '$x = \\phi^*x$ と $dy = d(\\phi^*y)$ を代入します。'],
          sol: [[`$\\phi^*x = ${terms([[s, 'u'], [k, 'v']])}$ and $d(\\phi^*y) = ${terms([[2 * c, 'u\\,du'], [1, 'dv']])}$.`, `$\\phi^*x = ${terms([[s, 'u'], [k, 'v']])}$、$d(\\phi^*y) = ${terms([[2 * c, 'u\\,du'], [1, 'dv']])}$ です。`], [`$A = ${n(2 * c)}u\\,(${terms([[s, 'u'], [k, 'v']])})$ and $B = ${terms([[s, 'u'], [k, 'v']])}$. Check: $d(\\phi^*(x\\,dy)) = (\\partial_u B - \\partial_v A)\\,du\\wedge dv = (s - 2cku)\\,du\\wedge dv = \\phi^*(dx\\wedge dy)$, so pullback commutes with $d$.`, `$A = ${n(2 * c)}u\\,(${terms([[s, 'u'], [k, 'v']])})$、$B = ${terms([[s, 'u'], [k, 'v']])}$ です。確認：$d(\\phi^*(x\\,dy)) = (\\partial_u B - \\partial_v A)\\,du\\wedge dv = (s - 2cku)\\,du\\wedge dv = \\phi^*(dx\\wedge dy)$ で、引き戻しは $d$ と可換です。`]],
          set: { scale: s, shear: k, bend: c },
        };
      }
      let s, c, k, u0;
      do { c = r.pick([0.5, 1]); u0 = r.pick([-1, -0.8, -0.6, -0.5, 0.5, 0.6, 0.8, 1]); k = r.step(-1, 1, 0.05); s = 2 * c * k * u0; } while (!(s >= 0.5 - 1e-9 && s <= 2 + 1e-9) || Math.abs(s * 20 - Math.round(s * 20)) > 1e-9);
      s = Math.round(s * 20) / 20;
      return {
        q: [`With $s = ${n(s)}$ and $c = ${n(c)}$, what shear $k$ puts the fold line of $\\phi(u, v) = (su + kv,\\ v + cu^2)$ at $u = ${n(u0)}$?`, `$s = ${n(s)}$、$c = ${n(c)}$ のとき、$\\phi(u, v) = (su + kv,\\ v + cu^2)$ の折り目の線を $u = ${n(u0)}$ にするせん断 $k$ はいくつですか。`],
        a: { type: 'num', v: k, tol: 1e-3 },
        hint: ['Solve $s - 2cku_0 = 0$ for $k$.', '$s - 2cku_0 = 0$ を $k$ について解きます。'],
        sol: [[`$k = \\dfrac{s}{2cu_0} = \\dfrac{${n(s)}}{2\\cdot${n(c)}\\cdot${n(u0)}} = ${n(k)}$.`, `$k = \\dfrac{s}{2cu_0} = \\dfrac{${n(s)}}{2\\cdot${n(c)}\\cdot${n(u0)}} = ${n(k)}$ です。`], [`The sign of $k$ must match the sign of $u_0$ (as $s, c > 0$). For $|k|$ below $${n(Math.abs(k))}$ the fold moves out past $u = ${n(u0)}$ and, beyond $|u| = 1.2$, leaves the square.`, `$s, c > 0$ なので $k$ の符号は $u_0$ の符号と一致します。$|k|$ を $${n(Math.abs(k))}$ より小さくすると折り目は $u = ${n(u0)}$ より外へ動き、$|u| = 1.2$ を越えると正方形から出ていきます。`]],
        set: { scale: s, shear: k, bend: c },
      };
    },
  ];
})();
