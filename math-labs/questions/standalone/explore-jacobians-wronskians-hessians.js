'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const K = 'explore-jacobians-wronskians-hessians-';
  const YY = (p, q) => terms([[1, "y''"], [p, "y'"], [q, 'y']]);
  const sg = (c) => (c < 0 ? `- ${n(-c)}` : `+ ${n(c)}`);

  /* ---------- Jacobian ---------- */
  // F(x,y) = (a x^2 + b y, c x y + d y^2),  DF = [[2ax, b], [cy, cx + 2dy]]
  const Fstr = (a, b, c, d) => `(${terms([[a, 'x^2'], [b, 'y']])},\\ ${terms([[c, 'xy'], [d, 'y^2']])})`;
  const DF = (a, b, c, d, x, y) => [[2 * a * x, b], [c * y, c * x + 2 * d * y]];
  const det2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];

  Q[K + 'jacobian'] = [
    (r) => {
      if (r.chance(0.5)) {
        const m = [[r.nz(-4, 4), r.int(-4, 4)], [r.int(-4, 4), r.nz(-4, 4)]], d = det2(m);
        return {
          q: [`A linear map has matrix $${P.util.mat(m)}$. By what factor does it scale areas, and with which sign? Give the signed area scale $\\det$.`, `線形写像の行列が $${P.util.mat(m)}$ です。符号付きの面積倍率 $\\det$ を求めてください。`],
          a: { type: 'int', v: d },
          hint: ['The unit square is sent to the parallelogram spanned by the two columns.', '単位正方形は、二つの列ベクトルが張る平行四辺形に写ります。'],
          sol: [[`$\\det = (${m[0][0]})(${m[1][1]}) - (${m[0][1]})(${m[1][0]}) = ${d}$.`, `$\\det = (${m[0][0]})(${m[1][1]}) - (${m[0][1]})(${m[1][0]}) = ${d}$ です。`], [d === 0 ? 'The determinant is zero, so the square is flattened onto a line.' : d > 0 ? `Areas are multiplied by ${d} and orientation is kept.` : `Areas are multiplied by ${-d} and orientation is reversed.`, d === 0 ? '行列式が 0 なので、正方形は線分につぶれます。' : d > 0 ? `面積は ${d} 倍になり、向きは保たれます。` : `面積は ${-d} 倍になり、向きは反転します。`]],
        };
      }
      const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-2, 2), x = r.int(-2, 2), y = r.int(-2, 2);
      const row = r.int(0, 1), col = r.int(0, 1), m = DF(a, b, c, d, x, y);
      return {
        q: [`For $F(x,y) = ${Fstr(a, b, c, d)}$, what is the entry in row ${row + 1}, column ${col + 1} of $DF$ at $(${x}, ${y})$?`, `$F(x,y) = ${Fstr(a, b, c, d)}$ について、点 $(${x}, ${y})$ での $DF$ の ${row + 1} 行 ${col + 1} 列の成分を求めてください。`],
        a: { type: 'int', v: m[row][col] },
        hint: ['Rows are outputs, columns are inputs: the entry is $\\partial F_{\\text{row}}/\\partial x_{\\text{column}}$.', '行が出力、列が入力です。成分は $\\partial F_{\\text{行}}/\\partial x_{\\text{列}}$ です。'],
        sol: [[`$DF = ${P.util.mat([[`${n(2 * a)}x`, n(b)], [`${n(c)}y`, `${n(c)}x ${sg(2 * d)}y`]])}$.`, `$DF = ${P.util.mat([[`${n(2 * a)}x`, n(b)], [`${n(c)}y`, `${n(c)}x ${sg(2 * d)}y`]])}$ です。`], [`At $(${x}, ${y})$ the matrix is $${P.util.mat(m)}$, so the entry is $${m[row][col]}$.`, `$(${x}, ${y})$ では $${P.util.mat(m)}$ なので、答えは $${m[row][col]}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-2, 2), x = r.int(-2, 2), y = r.int(-2, 2);
        const m = DF(a, b, c, d, x, y), dt = det2(m);
        return {
          q: [`For $F(x,y) = ${Fstr(a, b, c, d)}$, find $\\det DF(${x}, ${y})$.`, `$F(x,y) = ${Fstr(a, b, c, d)}$ について $\\det DF(${x}, ${y})$ を求めてください。`],
          a: { type: 'int', v: dt },
          hint: ['Differentiate each output with respect to each input, then take the determinant.', '各出力を各入力で微分し、その行列式を取ります。'],
          sol: [[`$DF(${x}, ${y}) = ${P.util.mat(m)}$.`, `$DF(${x}, ${y}) = ${P.util.mat(m)}$ です。`], [`$\\det = (${m[0][0]})(${m[1][1]}) - (${m[0][1]})(${m[1][0]}) = ${dt}$.`, `$\\det = (${m[0][0]})(${m[1][1]}) - (${m[0][1]})(${m[1][0]}) = ${dt}$ です。`], [dt === 0 ? 'The map is singular here: some direction is crushed.' : `A tiny square near this point is sent to a parallelogram with ${Math.abs(dt)} times the area${dt < 0 ? ', with the orientation reversed' : ''}.`, dt === 0 ? 'この点では写像が特異で、ある方向がつぶれます。' : `この点の近くの小さな正方形は、面積が ${Math.abs(dt)} 倍の平行四辺形に写ります${dt < 0 ? '（向きは反転）' : ''}。`]],
        };
      }
      if (form === 1) {
        const dt = r.nz(-4, 4), h = r.pick([0.1, 0.01, 0.2, 0.05]);
        return {
          q: [`$\\det DF(p) = ${dt}$. A small square of side $${h}$ around $p$ is sent by $F$ to a region of what area, to first order?`, `$\\det DF(p) = ${dt}$ です。$p$ のまわりの一辺 $${h}$ の小さな正方形は、$F$ によって一次近似でどれだけの面積の領域に写りますか。`],
          a: { type: 'num', v: Math.abs(dt) * h * h, tol: 1e-9, rel: 0.005 },
          hint: ['The area scales by $|\\det DF|$, and the square has area $h^2$.', '面積は $|\\det DF|$ 倍され、正方形の面積は $h^2$ です。'],
          sol: [[`The input area is $${h}^2 = ${n(h * h, 6)}$.`, `入力の面積は $${h}^2 = ${n(h * h, 6)}$ です。`], [`Multiply by $|\\det DF| = ${Math.abs(dt)}$ to get $${n(Math.abs(dt) * h * h, 6)}$.`, `$|\\det DF| = ${Math.abs(dt)}$ を掛けて $${n(Math.abs(dt) * h * h, 6)}$ です。`]],
        };
      }
      const g = r.nz(-3, 3), f = r.nz(-3, 3);
      return {
        q: [`$\\det DF(p) = ${g}$ and $G$ has $\\det DG(F(p)) = ${f}$. Find $\\det D(G\\circ F)(p)$.`, `$\\det DF(p) = ${g}$ で、$\\det DG(F(p)) = ${f}$ です。$\\det D(G\\circ F)(p)$ を求めてください。`],
        a: { type: 'int', v: g * f },
        hint: ['Chain rule: $D(G\\circ F) = DG\\,DF$, and determinants multiply.', '連鎖律 $D(G\\circ F) = DG\\,DF$ で、行列式は積になります。'],
        sol: [[`$D(G\\circ F)(p) = DG(F(p))\\,DF(p)$.`, `$D(G\\circ F)(p) = DG(F(p))\\,DF(p)$ です。`], [`So $\\det = (${f})(${g}) = ${f * g}$.`, `したがって $\\det = (${f})(${g}) = ${f * g}$ です。`], ['Area scale factors compose by multiplication, and orientation reversals cancel in pairs.', '面積倍率は掛け算で合成され、向きの反転は二回で打ち消されます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-2, 2);
        // det = 2a x (c x + 2 d y) - b c y = 2ac x^2 + 4ad xy - bc y
        return {
          q: [`For $F(x,y) = ${Fstr(a, b, c, d)}$, write $\\det DF(x,y)$ as a function of $x$ and $y$.`, `$F(x,y) = ${Fstr(a, b, c, d)}$ について、$\\det DF(x,y)$ を $x, y$ の式で表してください。`],
          a: { type: 'expr', v: `${2 * a * c}x^2+${4 * a * d}x*y-${b * c}y`, vars: ['x', 'y'], dom: { x: [-1.5, 1.5], y: [-1.5, 1.5] }, lhs: ['$\\det DF =$', '$\\det DF =$'] },
          hint: ['$DF = \\begin{pmatrix} 2ax & b \\\\ cy & cx + 2dy \\end{pmatrix}$ with your constants.', '定数を代入して $DF = \\begin{pmatrix} 2ax & b \\\\ cy & cx + 2dy \\end{pmatrix}$ を作ります。'],
          sol: [[`$DF = ${P.util.mat([[`${n(2 * a)}x`, n(b)], [`${n(c)}y`, `${n(c)}x ${sg(2 * d)}y`]])}$.`, `$DF = ${P.util.mat([[`${n(2 * a)}x`, n(b)], [`${n(c)}y`, `${n(c)}x ${sg(2 * d)}y`]])}$ です。`], [`$\\det DF = ${n(2 * a)}x(${n(c)}x ${sg(2 * d)}y) - (${n(b)})(${n(c)}y) = ${terms([[2 * a * c, 'x^2'], [4 * a * d, 'xy'], [-b * c, 'y']])}$.`, `$\\det DF = ${n(2 * a)}x(${n(c)}x ${sg(2 * d)}y) - (${n(b)})(${n(c)}y) = ${terms([[2 * a * c, 'x^2'], [4 * a * d, 'xy'], [-b * c, 'y']])}$ です。`], ['The curve where this vanishes is where the map folds: nearby points are squeezed onto a line.', 'これが 0 になる曲線は写像が折れ返す場所で、近くの点が一本の線につぶれます。']],
        };
      }
      if (form === 1) {
        const A = r.pick([2, 3, 4, 5]), Bk = r.pick([1, 2, 3]).valueOf();
        const a = r.pick([1, 2, 3]), b = r.pick([1, 2, 3, 4]);
        return {
          q: [`Polar-style coordinates $(x, y) = (${a}\\rho\\cos\\varphi,\\ ${b}\\rho\\sin\\varphi)$. Find the Jacobian determinant $\\partial(x,y)/\\partial(\\rho,\\varphi)$ as a function of $\\rho$.`, `座標 $(x, y) = (${a}\\rho\\cos\\varphi,\\ ${b}\\rho\\sin\\varphi)$ について、ヤコビ行列式 $\\partial(x,y)/\\partial(\\rho,\\varphi)$ を $\\rho$ の式で求めてください。`],
          a: { type: 'expr', v: `${a * b}*rho`, vars: ['rho'], lhs: ['$\\det =$', '$\\det =$'] },
          hint: ['Rows are $x, y$; columns are $\\rho, \\varphi$. Use $\\cos^2 + \\sin^2 = 1$.', '行は $x, y$、列は $\\rho, \\varphi$ です。$\\cos^2 + \\sin^2 = 1$ を使います。'],
          sol: [[`$\\begin{vmatrix} ${a}\\cos\\varphi & -${a}\\rho\\sin\\varphi \\\\ ${b}\\sin\\varphi & ${b}\\rho\\cos\\varphi \\end{vmatrix} = ${a * b}\\rho(\\cos^2\\varphi + \\sin^2\\varphi)$.`, `$\\begin{vmatrix} ${a}\\cos\\varphi & -${a}\\rho\\sin\\varphi \\\\ ${b}\\sin\\varphi & ${b}\\rho\\cos\\varphi \\end{vmatrix} = ${a * b}\\rho(\\cos^2\\varphi + \\sin^2\\varphi)$ です。`], [`So $dx\\,dy = ${a * b}\\rho\\,d\\rho\\,d\\varphi$: the area element of the elliptical coordinates, which is the $\\rho$ of the circle case times the stretch $${a}\\cdot${b}$.`, `したがって $dx\\,dy = ${a * b}\\rho\\,d\\rho\\,d\\varphi$ です。円の場合の $\\rho$ に、引き伸ばし $${a}\\cdot${b}$ が掛かった面積要素です。`]],
        };
      }
      const a = r.int(1, 3), b = r.int(1, 3), k = r.int(1, 4);
      // F = (x^2 + a y, b x + y): det = 2x - ab = 0 at x = ab/2
      return {
        q: [`$F(x,y) = (x^2 + ${a}y,\\ ${b}x + y)$. At which $x$ does $\\det DF = 0$ (the fold line)?`, `$F(x,y) = (x^2 + ${a}y,\\ ${b}x + y)$ について、$\\det DF = 0$ となる（折れ目の）$x$ を求めてください。`],
        a: { type: 'num', v: a * b / 2, show: frac(a * b, 2) },
        hint: ['$DF = \\begin{pmatrix} 2x & a \\\\ b & 1 \\end{pmatrix}$.', '$DF = \\begin{pmatrix} 2x & a \\\\ b & 1 \\end{pmatrix}$ です。'],
        sol: [[`$DF = ${P.util.mat([['2x', n(a)], [n(b), '1']])}$, so $\\det DF = 2x - ${a * b}$.`, `$DF = ${P.util.mat([['2x', n(a)], [n(b), '1']])}$ なので $\\det DF = 2x - ${a * b}$ です。`], [`It vanishes at $x = ${frac(a * b, 2)}$, a whole vertical line, independent of $y$.`, `$x = ${frac(a * b, 2)}$ で 0 になります。$y$ によらない鉛直線全体です。`], ['On that line $F$ stops being locally invertible: the image folds over itself.', 'この線上では $F$ は局所的に可逆でなくなり、像が自分自身に折れ重なります。']],
      };
    },
  ];

  /* ---------- Wronskian ---------- */
  Q[K + 'wronskian'] = [
    (r) => {
      if (r.chance(0.5)) {
        const k = r.pick([1, 2, 3, 4, 0.5]);
        return {
          q: [`Find the Wronskian $W(\\cos ${n(k)}t,\\ \\sin ${n(k)}t)$.`, `ロンスキアン $W(\\cos ${n(k)}t,\\ \\sin ${n(k)}t)$ を求めてください。`],
          a: { type: 'num', v: k },
          hint: ['$W = y_1 y_2\' - y_2 y_1\'$.', '$W = y_1 y_2\' - y_2 y_1\'$ です。'],
          sol: [[`$W = \\cos(${n(k)}t)\\cdot ${n(k)}\\cos(${n(k)}t) - \\sin(${n(k)}t)\\cdot(-${n(k)}\\sin(${n(k)}t))$.`, `$W = \\cos(${n(k)}t)\\cdot ${n(k)}\\cos(${n(k)}t) - \\sin(${n(k)}t)\\cdot(-${n(k)}\\sin(${n(k)}t))$ です。`], [`$= ${n(k)}(\\cos^2 + \\sin^2) = ${n(k)}$, never zero, so the two are independent everywhere.`, `$= ${n(k)}(\\cos^2 + \\sin^2) = ${n(k)}$ で、どこでも 0 にならないので、二つは独立です。`]],
        };
      }
      const t0 = r.pick([0, 1, 2, -1]), sgn = r.pick([1, -1]), c = r.int(1, 4);
      const area = r.nz(-3, 3) * c;
      return {
        q: [`At $t = ${t0}$ the state vectors of two solutions are $(y_1, y_1') = (${c}, 0)$ and $(y_2, y_2') = (0, ${area / c})$. What is the signed area they span, i.e. $W(${t0})$?`, `$t = ${t0}$ で二つの解の状態ベクトルが $(y_1, y_1') = (${c}, 0)$、$(y_2, y_2') = (0, ${area / c})$ です。二つが張る符号付き面積 $W(${t0})$ を求めてください。`],
        a: { type: 'int', v: area },
        sol: [[`$W = y_1 y_2' - y_2 y_1' = (${c})(${area / c}) - (0)(0) = ${area}$.`, `$W = y_1 y_2' - y_2 y_1' = (${c})(${area / c}) - (0)(0) = ${area}$ です。`], [`The vectors lie along the two axes, so the parallelogram is a rectangle of area $${Math.abs(area)}$.`, `ベクトルは二つの軸に沿っているので、平行四辺形は面積 $${Math.abs(area)}$ の長方形です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(-2, 2), b = r.int(-2, 3).valueOf(), t0 = r.pick([0, 0.5, 1]);
        const bb = a === b ? b + 1 : b;
        const w = (bb - a) * Math.exp((a + bb) * t0);
        return {
          q: [`Compute $W(e^{${a}t},\\ e^{${bb}t})$ at $t = ${n(t0)}$. Give three decimals.`, `$t = ${n(t0)}$ での $W(e^{${a}t},\\ e^{${bb}t})$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: w, tol: 6e-4 },
          hint: ['In general $W(e^{at}, e^{bt}) = (b - a)e^{(a+b)t}$.', '一般に $W(e^{at}, e^{bt}) = (b - a)e^{(a+b)t}$ です。'],
          sol: [[`$W = e^{${a}t}\\cdot ${bb}e^{${bb}t} - e^{${bb}t}\\cdot ${a}e^{${a}t} = ${bb - a}e^{${a + bb}t}$.`, `$W = e^{${a}t}\\cdot ${bb}e^{${bb}t} - e^{${bb}t}\\cdot ${a}e^{${a}t} = ${bb - a}e^{${a + bb}t}$ です。`], [`At $t = ${n(t0)}$: $${bb - a}e^{${n((a + bb) * t0)}} = ${n(w, 4)}$.`, `$t = ${n(t0)}$ では $${bb - a}e^{${n((a + bb) * t0)}} = ${n(w, 4)}$ です。`], [`It is nonzero for every $t$ because $${a} \\ne ${bb}$: the two exponentials are independent.`, `$${a} \\ne ${bb}$ なので、どの $t$ でも 0 でなく、二つの指数関数は独立です。`]],
        };
      }
      if (form === 1) {
        const p = r.int(-4, 4), q = r.int(-4, 4), w0 = r.nz(-3, 3), t1 = r.pick([0.5, 1, 2]);
        const w = w0 * Math.exp(-p * t1);
        return {
          q: [`Two solutions of $${YY(p, q)} = 0$ have $W(0) = ${w0}$. Use Abel's identity to find $W(${n(t1)})$. Give three decimals.`, `$${YY(p, q)} = 0$ の二つの解について $W(0) = ${w0}$ です。アーベルの恒等式で $W(${n(t1)})$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: w, tol: 6e-4 },
          hint: ['Abel: $W(t) = W(0)\\exp\\left(-\\int_0^t p\\,ds\\right)$ for $y\'\' + p y\' + q y = 0$.', 'アーベル：$y\'\' + p y\' + q y = 0$ では $W(t) = W(0)\\exp\\left(-\\int_0^t p\\,ds\\right)$ です。'],
          sol: [[`Here the coefficient of $y'$ is $${p}$, so $W' = -${p}W$ and $W(t) = ${w0}e^{${-p}t}$.`, `$y'$ の係数は $${p}$ なので $W' = -${p}W$、よって $W(t) = ${w0}e^{${-p}t}$ です。`], [`$W(${n(t1)}) = ${w0}e^{${n(-p * t1)}} = ${n(w, 4)}$.`, `$W(${n(t1)}) = ${w0}e^{${n(-p * t1)}} = ${n(w, 4)}$ です。`], ['The $q$ term never enters: only the damping decides whether the state-space area grows or shrinks.', '$q$ は現れません。状態空間の面積が増えるか縮むかを決めるのは減衰項だけです。']],
        };
      }
      const m = r.int(1, 4), k = r.int(m + 1, m + 3);
      return {
        q: [`Find $W(x^{${m}},\\ x^{${k}})$ for $x > 0$ as a function of $x$.`, `$x > 0$ で $W(x^{${m}},\\ x^{${k}})$ を $x$ の式で求めてください。`],
        a: { type: 'expr', v: `${k - m}*x^${m + k - 1}`, vars: ['x'], lhs: ['$W =$', '$W =$'] },
        sol: [[`$W = x^{${m}}\\cdot ${k}x^{${k - 1}} - x^{${k}}\\cdot ${m}x^{${m - 1}}$.`, `$W = x^{${m}}\\cdot ${k}x^{${k - 1}} - x^{${k}}\\cdot ${m}x^{${m - 1}}$ です。`], [`$= (${k} - ${m})x^{${m + k - 1}} = ${k - m}x^{${m + k - 1}}$.`, `$= (${k} - ${m})x^{${m + k - 1}} = ${k - m}x^{${m + k - 1}}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3, -1, -2]);
        return {
          q: [`Find $W(e^{${a}x},\\ x e^{${a}x})$ as a function of $x$ (the repeated-root pair).`, `重解の組 $e^{${a}x},\\ x e^{${a}x}$ のロンスキアン $W$ を $x$ の式で求めてください。`],
          a: { type: 'expr', v: `exp(${2 * a}*x)`, vars: ['x'], dom: { x: [-0.8, 0.8] }, lhs: ['$W =$', '$W =$'] },
          hint: ['The $x e^{ax}$ term cancels in the determinant.', '行列式では $x e^{ax}$ の項が打ち消し合います。'],
          sol: [[`$y_1 = e^{${a}x}$, $y_1' = ${a}e^{${a}x}$, $y_2 = xe^{${a}x}$, $y_2' = (1 + ${a}x)e^{${a}x}$.`, `$y_1 = e^{${a}x}$、$y_1' = ${a}e^{${a}x}$、$y_2 = xe^{${a}x}$、$y_2' = (1 + ${a}x)e^{${a}x}$ です。`], [`$W = (1 + ${a}x)e^{${2 * a}x} - ${a}x\\,e^{${2 * a}x} = e^{${2 * a}x}$.`, `$W = (1 + ${a}x)e^{${2 * a}x} - ${a}x\\,e^{${2 * a}x} = e^{${2 * a}x}$ です。`], [`It agrees with Abel: the equation is $y'' - ${2 * a}y' + ${a * a}y = 0$, so $W = W(0)e^{${2 * a}x}$ with $W(0) = 1$.`, `アーベルとも一致します。方程式は $y'' - ${2 * a}y' + ${a * a}y = 0$ で、$W = W(0)e^{${2 * a}x}$、$W(0) = 1$ です。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['Take $f = x^2$ and $g = x|x|$ on the whole real line. Their Wronskian is $0$ for every $x$. Are $f, g$ linearly dependent on $\\mathbb{R}$?', '実数全体で $f = x^2$、$g = x|x|$ とします。ロンスキアンはすべての $x$ で $0$ です。$f, g$ は $\\mathbb{R}$ 上で一次従属ですか。'],
          a: { type: 'choice', fixed: true, opts: [['No: $W \\equiv 0$ does not imply dependence here', 'いいえ：ここでは $W \\equiv 0$ でも従属とは限りません'], ['Yes: $W \\equiv 0$ always means dependent', 'はい：$W \\equiv 0$ なら必ず従属です'], ['Yes: because both are even functions', 'はい：どちらも偶関数だからです']], v: 0 },
          hint: ['Compare $g$ with $f$ separately for $x > 0$ and $x < 0$.', '$x > 0$ と $x < 0$ に分けて $g$ と $f$ を比べます。'],
          sol: [[`For $x > 0$, $g = f$. For $x < 0$, $g = -f$. So $W = 0$ on each side.`, `$x > 0$ では $g = f$、$x < 0$ では $g = -f$ なので、どちら側でも $W = 0$ です。`], [`A single relation $c_1 f + c_2 g = 0$ would need $c_1 + c_2 = 0$ and $c_1 - c_2 = 0$, forcing $c_1 = c_2 = 0$.`, `一つの関係 $c_1 f + c_2 g = 0$ は、$c_1 + c_2 = 0$ と $c_1 - c_2 = 0$ を同時に要求し、$c_1 = c_2 = 0$ になります。`], ['So they are independent although $W \\equiv 0$. The converse holds for solutions of one regular linear ODE, not for arbitrary differentiable functions.', 'したがって $W \\equiv 0$ でも独立です。逆が成り立つのは、同じ正則な線形常微分方程式の解の場合だけで、一般の微分可能関数では成り立ちません。']],
        };
      }
      const p = r.int(1, 3), q = r.int(1, 3);
      return {
        q: [`Solutions $y_1, y_2$ of $${YY(p, q)} = 0$ have $W(0) = 2$. Write $W(t)$.`, `$${YY(p, q)} = 0$ の解 $y_1, y_2$ について $W(0) = 2$ です。$W(t)$ を式で表してください。`],
        a: { type: 'expr', v: `2*exp(-${p}*t)`, vars: ['t'], dom: { t: [-1, 1.5] }, lhs: ['$W(t) =$', '$W(t) =$'] },
        hint: ['Differentiate $W = y_1 y_2\' - y_2 y_1\'$ and substitute the equation.', '$W = y_1 y_2\' - y_2 y_1\'$ を微分して、方程式を代入します。'],
        sol: [[`$W' = y_1 y_2'' - y_2 y_1'' = -${p}(y_1 y_2' - y_2 y_1') = -${p}W$.`, `$W' = y_1 y_2'' - y_2 y_1'' = -${p}(y_1 y_2' - y_2 y_1') = -${p}W$ です。`], [`So $W(t) = 2e^{-${p}t}$.`, `よって $W(t) = 2e^{-${p}t}$ です。`], ['It never reaches zero: independent at one instant means independent for all time.', '0 にはなりません。ある瞬間に独立なら、常に独立です。']],
      };
    },
  ];

  /* ---------- Hessian ---------- */
  const Hmat = (a, b, c) => P.util.mat([[n(a), n(b)], [n(b), n(c)]]);
  const classify = (a, b, c) => { const d = a * c - b * b; if (d > 1e-9) return a > 0 ? 0 : 1; if (d < -1e-9) return 2; return 3; };
  const KINDS = [['local minimum', '局所最小'], ['local maximum', '局所最大'], ['saddle point', '鞍点'], ['inconclusive (second-derivative test fails)', '判定不能（二階微分判定では決まらない）']];

  Q[K + 'hessian'] = [
    (r) => {
      if (r.chance(0.5)) {
        const a = r.nz(-3, 3), b = r.int(-3, 3), c = r.nz(-3, 3);
        return {
          q: [`For $f(x,y) = ${terms([[a, 'x^2'], [2 * b, 'xy'], [c, 'y^2']])}$, find $f_{xy}$ (the off-diagonal entry of the Hessian).`, `$f(x,y) = ${terms([[a, 'x^2'], [2 * b, 'xy'], [c, 'y^2']])}$ について、ヘッセ行列の非対角成分 $f_{xy}$ を求めてください。`],
          a: { type: 'int', v: 2 * b },
          sol: [[`$f_x = ${terms([[2 * a, 'x'], [2 * b, 'y']])}$.`, `$f_x = ${terms([[2 * a, 'x'], [2 * b, 'y']])}$ です。`], [`$f_{xy} = ${2 * b}$, and $f_{yx}$ gives the same, as it must for a $C^2$ function.`, `$f_{xy} = ${2 * b}$ で、$C^2$ 級なので $f_{yx}$ も同じ値です。`]],
        };
      }
      const a = r.nz(-3, 3), b = r.int(-3, 3), c = r.nz(-3, 3), k = classify(a, b, c);
      return {
        q: [`At a critical point the Hessian is $${Hmat(a, b, c)}$. What does the second-derivative test say?`, `臨界点でヘッセ行列が $${Hmat(a, b, c)}$ です。二階微分判定は何を示しますか。`],
        a: { type: 'choice', fixed: true, opts: KINDS, v: k },
        hint: ['Look at $\\det H = ac - b^2$, and the sign of $a$ when it is positive.', '$\\det H = ac - b^2$ と、それが正のときの $a$ の符号を見ます。'],
        sol: [[`$\\det H = (${a})(${c}) - (${b})^2 = ${a * c - b * b}$.`, `$\\det H = (${a})(${c}) - (${b})^2 = ${a * c - b * b}$ です。`], [`${k === 2 ? 'Negative determinant: the eigenvalues have opposite signs.' : k === 3 ? 'Zero determinant: one eigenvalue is zero.' : `Positive determinant: both eigenvalues share the sign of $a = ${a}$.`}`, `${k === 2 ? '行列式が負なので、固有値の符号は逆です。' : k === 3 ? '行列式が 0 なので、固有値の一つが 0 です。' : `行列式が正なので、固有値は二つとも $a = ${a}$ と同じ符号です。`}`], [`So it is a ${KINDS[k][0]}.`, `したがって ${KINDS[k][1]} です。`]],
        set: { a, b, c },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), b = r.int(-3, 3), c = r.nz(-3, 3), th = r.pick([0, 30, 45, 60, 90, 120, 135, 150]);
        const t = th * Math.PI / 180, v = a * Math.cos(t) ** 2 + 2 * b * Math.sin(t) * Math.cos(t) + c * Math.sin(t) ** 2;
        return {
          q: [`With $H = ${Hmat(a, b, c)}$, find the second directional derivative $u^{\\mathsf T}Hu$ along $u = (\\cos ${th}^\\circ, \\sin ${th}^\\circ)$. Give three decimals.`, `$H = ${Hmat(a, b, c)}$ のとき、$u = (\\cos ${th}^\\circ, \\sin ${th}^\\circ)$ 方向の二階方向微分 $u^{\\mathsf T}Hu$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['$u^{\\mathsf T}Hu = a\\cos^2\\theta + 2b\\sin\\theta\\cos\\theta + c\\sin^2\\theta$.', '$u^{\\mathsf T}Hu = a\\cos^2\\theta + 2b\\sin\\theta\\cos\\theta + c\\sin^2\\theta$ です。'],
          sol: [[`$\\cos ${th}^\\circ = ${n(Math.cos(t), 4)}$ and $\\sin ${th}^\\circ = ${n(Math.sin(t), 4)}$.`, `$\\cos ${th}^\\circ = ${n(Math.cos(t), 4)}$、$\\sin ${th}^\\circ = ${n(Math.sin(t), 4)}$ です。`], [`$u^{\\mathsf T}Hu = ${a}(${n(Math.cos(t) ** 2, 4)}) + ${2 * b}(${n(Math.sin(t) * Math.cos(t), 4)}) + ${c}(${n(Math.sin(t) ** 2, 4)}) = ${n(v, 4)}$.`, `$u^{\\mathsf T}Hu = ${a}(${n(Math.cos(t) ** 2, 4)}) + ${2 * b}(${n(Math.sin(t) * Math.cos(t), 4)}) + ${c}(${n(Math.sin(t) ** 2, 4)}) = ${n(v, 4)}$ です。`], [`${v > 0 ? 'Positive: the surface curves upward along this direction.' : v < 0 ? 'Negative: the surface curves downward along this direction.' : 'Zero: the surface is momentarily straight along this direction.'}`, `${v > 0 ? '正なので、この方向では曲面は上向きに曲がります。' : v < 0 ? '負なので、この方向では曲面は下向きに曲がります。' : '0 なので、この方向では曲面は一瞬まっすぐです。'}`]],
          set: { a, b, c, theta: th },
        };
      }
      if (form === 1) {
        const l1 = r.int(-3, 3), l2 = r.int(-3, 3), s = r.pick([[3, 4], [5, 12], [4, 3]]);
        // build H with eigenvalues l1,l2 and eigenvector (cos,sin)=(3/5,4/5) etc.
        const h = Math.hypot(s[0], s[1]), cx = s[0] / h, sx = s[1] / h;
        const a = l1 * cx * cx + l2 * sx * sx, b = (l1 - l2) * cx * sx, c = l1 * sx * sx + l2 * cx * cx;
        const big = Math.max(l1, l2), small = Math.min(l1, l2);
        return {
          q: [`$H = ${Hmat(a, b, c)}$. Find its largest eigenvalue $\\lambda_{\\max}$, the greatest curvature over all directions.`, `$H = ${Hmat(a, b, c)}$ です。最大固有値 $\\lambda_{\\max}$（すべての方向のうち最大の曲率）を求めてください。`],
          a: { type: 'num', v: big, tol: 0.01 },
          hint: ['Eigenvalues solve $\\lambda^2 - (a + c)\\lambda + (ac - b^2) = 0$.', '固有値は $\\lambda^2 - (a + c)\\lambda + (ac - b^2) = 0$ の解です。'],
          sol: [[`Trace $= ${n(a + c, 4)}$, determinant $= ${n(a * c - b * b, 4)}$.`, `トレースは $${n(a + c, 4)}$、行列式は $${n(a * c - b * b, 4)}$ です。`], [`$\\lambda = \\tfrac{1}{2}\\left(${n(a + c, 4)} \\pm \\sqrt{${n((a + c) ** 2 - 4 * (a * c - b * b), 4)}}\\right)$, giving $${big}$ and $${small}$.`, `$\\lambda = \\tfrac{1}{2}\\left(${n(a + c, 4)} \\pm \\sqrt{${n((a + c) ** 2 - 4 * (a * c - b * b), 4)}}\\right)$ より $${big}$ と $${small}$ です。`], [`The curvature along any unit direction lies between $${small}$ and $${big}$.`, `任意の単位方向の曲率は $${small}$ と $${big}$ の間にあります。`]],
        };
      }
      const m = r.int(2, 4), k = r.int(2, 4);
      return {
        q: [`For $f(x,y) = x^{${m}}y^{${k}}$, find the mixed derivative $f_{xy}$ as a function of $x$ and $y$.`, `$f(x,y) = x^{${m}}y^{${k}}$ について、混合微分 $f_{xy}$ を $x, y$ の式で求めてください。`],
        a: { type: 'expr', v: `${m * k}*x^${m - 1}*y^${k - 1}`, vars: ['x', 'y'], lhs: ['$f_{xy} =$', '$f_{xy} =$'] },
        sol: [[`$f_x = ${m}x^{${m - 1}}y^{${k}}$.`, `$f_x = ${m}x^{${m - 1}}y^{${k}}$ です。`], [`$f_{xy} = ${m * k}x^{${m - 1}}y^{${k - 1}}$, and differentiating in the other order gives the same.`, `$f_{xy} = ${m * k}x^{${m - 1}}y^{${k - 1}}$ で、微分の順序を逆にしても同じです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3]), b = r.pick([1, 2, 3]);
        // f = a x^2 + 2 b x y + c y^2 ; critical origin; not a minimum iff c <= b^2/a ; threshold c = b^2/a
        return {
          q: [`$f(x,y) = ${a}x^2 + ${2 * b}xy + c\\,y^2$ has a critical point at the origin. For $c$ above what value is it a local minimum?`, `$f(x,y) = ${a}x^2 + ${2 * b}xy + c\\,y^2$ は原点で臨界点をもちます。$c$ がいくつを超えると局所最小になりますか。`],
          a: { type: 'num', v: b * b / a, show: frac(b * b, a) },
          hint: ['$H = \\begin{pmatrix} 2a & 2b \\\\ 2b & 2c \\end{pmatrix}$ and the test needs $\\det H > 0$ and $f_{xx} > 0$.', 'ヘッセ行列は $\\begin{pmatrix} 2a & 2b \\\\ 2b & 2c \\end{pmatrix}$ で、$\\det H > 0$ かつ $f_{xx} > 0$ が必要です。'],
          sol: [[`$H = ${P.util.mat([[n(2 * a), n(2 * b)], [n(2 * b), '2c']])}$, so $\\det H = ${4 * a}c - ${4 * b * b}$.`, `$H = ${P.util.mat([[n(2 * a), n(2 * b)], [n(2 * b), '2c']])}$ なので $\\det H = ${4 * a}c - ${4 * b * b}$ です。`], [`$f_{xx} = ${2 * a} > 0$, so a minimum needs $\\det H > 0$, that is $c > ${frac(b * b, a)}$.`, `$f_{xx} = ${2 * a} > 0$ なので、最小には $\\det H > 0$、すなわち $c > ${frac(b * b, a)}$ が必要です。`], [`At $c = ${frac(b * b, a)}$ the test is inconclusive (a flat valley), and below it the origin is a saddle.`, `$c = ${frac(b * b, a)}$ では判定不能（平らな谷）で、それより小さいと鞍点です。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([1, 2, 3, 4, 6]);
        // f = x^3 - 3k x + y^2 : critical points (+-sqrt k, 0); at +sqrt(k): H=diag(6 sqrt k, 2) min; at -sqrt k: saddle
        const s = Math.sqrt(k);
        return {
          q: [`$f(x,y) = x^3 - ${3 * k}x + y^2$ has two critical points. What is the value of $f$ at its local minimum?`, `$f(x,y) = x^3 - ${3 * k}x + y^2$ には臨界点が二つあります。局所最小点での $f$ の値を求めてください。`],
          a: { type: 'num', v: s ** 3 - 3 * k * s, show: k === 1 || k === 4 ? undefined : `-2\\cdot ${k}\\sqrt{${k}}` },
          hint: ['Solve $f_x = f_y = 0$, then compare the Hessian at each solution.', '$f_x = f_y = 0$ を解き、各解でヘッセ行列を比べます。'],
          sol: [[`$f_x = 3x^2 - ${3 * k} = 0$ gives $x = \\pm\\sqrt{${k}}$, and $f_y = 2y = 0$ gives $y = 0$.`, `$f_x = 3x^2 - ${3 * k} = 0$ より $x = \\pm\\sqrt{${k}}$、$f_y = 2y = 0$ より $y = 0$ です。`], [`$H = \\mathrm{diag}(6x, 2)$: positive definite at $x = +\\sqrt{${k}}$, indefinite at $x = -\\sqrt{${k}}$ (a saddle).`, `$H = \\mathrm{diag}(6x, 2)$ で、$x = +\\sqrt{${k}}$ では正定値、$x = -\\sqrt{${k}}$ では不定値（鞍点）です。`], [`The minimum value is $f(\\sqrt{${k}}, 0) = ${k}\\sqrt{${k}} - ${3 * k}\\sqrt{${k}} = ${n(s ** 3 - 3 * k * s, 4)}$.`, `最小値は $f(\\sqrt{${k}}, 0) = ${k}\\sqrt{${k}} - ${3 * k}\\sqrt{${k}} = ${n(s ** 3 - 3 * k * s, 4)}$ です。`]],
        };
      }
      const a = r.pick([1, 2, 3, 4]), c = r.pick([1, 2, 3, 4, 9]);
      const bq = Math.sqrt(a * c);
      return {
        q: [`$H = \\begin{pmatrix} ${a} & b \\\\ b & ${c} \\end{pmatrix}$. For which positive $b$ does the second-derivative test become inconclusive? Give three decimals.`, `$H = \\begin{pmatrix} ${a} & b \\\\ b & ${c} \\end{pmatrix}$ です。二階微分判定が判定不能になる正の $b$ を求めてください（小数第3位まで）。`],
        a: { type: 'num', v: bq, tol: 6e-4, show: Number.isInteger(bq) ? undefined : `\\sqrt{${a * c}}` },
        hint: ['Inconclusive means a zero eigenvalue, that is $\\det H = 0$.', '判定不能は固有値の一つが 0、つまり $\\det H = 0$ のときです。'],
        sol: [[`$\\det H = ${a * c} - b^2 = 0$.`, `$\\det H = ${a * c} - b^2 = 0$ です。`], [`So $b = \\sqrt{${a * c}} = ${n(bq, 4)}$.`, `よって $b = \\sqrt{${a * c}} = ${n(bq, 4)}$ です。`], ['At that coupling the surface has a flat valley direction, and the quadratic part alone cannot tell whether the point is a minimum.', 'その結合の強さでは曲面に平らな谷の方向ができ、二次の項だけでは最小かどうか決まりません。']],
      };
    },
  ];
})();
