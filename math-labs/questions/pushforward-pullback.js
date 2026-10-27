'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, mat } = P.util;
  const PI = Math.PI, TAU = 2 * PI;
  const cr = (a, b) => a[0] * b[1] - a[1] * b[0];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const pt = (p) => `(${n(p[0], 3)}, ${n(p[1], 3)})`;

  /* ---------- 1. the area formula ---------- */
  // the figure's three draggable corners stay at these defaults; the gold corner P11 is the control
  const P00 = [0, 0], P10 = [1.6, 0.2], P01 = [0.2, 1.25];
  const bil = (P11) => { const B = sub(P10, P00), C = sub(P01, P00), E = [P00[0] - P10[0] - P01[0] + P11[0], P00[1] - P10[1] - P01[1] + P11[1]]; return { B, C, E, j0: cr(B, C), ju: cr(B, E), jv: cr(E, C) }; };
  const shoelace = (Q4) => { let s = 0; for (let i = 0; i < 4; i++) s += cr(Q4[i], Q4[(i + 1) % 4]); return s / 2; };
  const absInt = (j0, ju, jv, m = 240) => { let s = 0; for (let i = 0; i < m; i++) for (let k = 0; k < m; k++) s += Math.abs(j0 + ju * (i + 0.5) / m + jv * (k + 0.5) / m); return s / (m * m); };
  const P11S = [[1.9, 1.5], [2, 1.2], [1.5, 1.8], [2.2, 2], [1.2, 1], [0.9, 0.7], [0.7, 0.5], [0.6, 0.4], [1, 0.6], [1.4, 1.4], [2.4, 0.8]];
  Q['area-formula'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        let a, b, c, d; do { a = r.int(-3, 3); b = r.int(-3, 3); c = r.int(-3, 3); d = r.int(-3, 3); } while (a * d - b * c === 0);
        const det = a * d - b * c;
        return {
          q: [`The map $\\varphi(u, v) = (${a}u ${b < 0 ? '-' : '+'} ${Math.abs(b)}v,\\ ${c}u ${d < 0 ? '-' : '+'} ${Math.abs(d)}v)$ sends the unit square to a parallelogram. What is the parallelogram's area?`, `写像 $\\varphi(u, v) = (${a}u ${b < 0 ? '-' : '+'} ${Math.abs(b)}v,\\ ${c}u ${d < 0 ? '-' : '+'} ${Math.abs(d)}v)$ は単位正方形を平行四辺形に写します。その平行四辺形の面積はいくつですか。`],
          a: { type: 'num', v: Math.abs(det) },
          hint: ['For a linear map, $D\\varphi$ is the matrix itself and the area scales by $|\\det D\\varphi|$.', '線形写像では $D\\varphi$ は行列そのもので、面積は $|\\det D\\varphi|$ 倍になります。'],
          sol: [[`$\\det D\\varphi = \\det${mat([[a, b], [c, d]], 'pmatrix', 0)} = ${a}\\cdot${d < 0 ? `(${d})` : d} - ${b < 0 ? `(${b})` : b}\\cdot${c < 0 ? `(${c})` : c} = ${det}$.`, `$\\det D\\varphi = \\det${mat([[a, b], [c, d]], 'pmatrix', 0)} = ${a}\\cdot${d < 0 ? `(${d})` : d} - ${b < 0 ? `(${b})` : b}\\cdot${c < 0 ? `(${c})` : c} = ${det}$ です。`], [`Area $= \\int_{[0,1]^2}|\\det D\\varphi|\\,du\\,dv = ${Math.abs(det)}$.${det < 0 ? ' The negative sign means the map reverses orientation.' : ''}`, `面積は $\\int_{[0,1]^2}|\\det D\\varphi|\\,du\\,dv = ${Math.abs(det)}$ です。${det < 0 ? '負の符号は写像が向きを反転させることを意味します。' : ''}`]],
        };
      }
      const P11 = r.pick(P11S), { B, C, E } = bil(P11), d11 = cr([B[0] + E[0], B[1] + E[1]], [C[0] + E[0], C[1] + E[1]]);
      return {
        q: [`In the figure, $\\varphi(0,0) = (0, 0)$, $\\varphi(1,0) = (1.6, 0.2)$, $\\varphi(0,1) = (0.2, 1.25)$ and the gold corner is $\\varphi(1,1) = ${pt(P11)}$. What is $\\det D\\varphi$ at the corner $(1, 1)$?`, `図では $\\varphi(0,0) = (0, 0)$、$\\varphi(1,0) = (1.6, 0.2)$、$\\varphi(0,1) = (0.2, 1.25)$ で、金色の角は $\\varphi(1,1) = ${pt(P11)}$ です。角 $(1, 1)$ における $\\det D\\varphi$ はいくつですか。`],
        a: { type: 'num', v: d11, tol: 0.002 },
        hint: ['At $(1,1)$ the two columns of $D\\varphi$ are the edges $\\varphi(1,1) - \\varphi(0,1)$ and $\\varphi(1,1) - \\varphi(1,0)$.', '$(1,1)$ では $D\\varphi$ の2つの列は辺 $\\varphi(1,1) - \\varphi(0,1)$ と $\\varphi(1,1) - \\varphi(1,0)$ です。'],
        sol: [[`$\\partial_u\\varphi(1,1) = ${pt(sub(P11, P01))}$ and $\\partial_v\\varphi(1,1) = ${pt(sub(P11, P10))}$.`, `$\\partial_u\\varphi(1,1) = ${pt(sub(P11, P01))}$、$\\partial_v\\varphi(1,1) = ${pt(sub(P11, P10))}$ です。`], [`$\\det D\\varphi(1,1) = ${n(d11, 4)}$. ${d11 < 0 ? 'Negative: near this corner the map has flipped the square over.' : 'Positive: the map keeps orientation near this corner.'}`, `$\\det D\\varphi(1,1) = ${n(d11, 4)}$ です。${d11 < 0 ? '負なので、この角の近くでは写像が正方形を裏返しています。' : '正なので、この角の近くでは写像は向きを保ちます。'}`]],
        set: { x11: P11[0], y11: P11[1] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const P11 = r.pick(P11S.slice(0, 5).concat([[1.8, 1.6], [2.1, 1.4]])), Qd = [P00, P10, P11, P01], A = shoelace(Qd);
        return {
          q: [`With the figure's corners $(0, 0)$, $(1.6, 0.2)$, $${pt(P11)}$, $(0.2, 1.25)$ (in order around the square), what is the area of the image $\\varphi([0,1]^2)$?`, `図の角 $(0, 0)$、$(1.6, 0.2)$、$${pt(P11)}$、$(0.2, 1.25)$（正方形を一周する順）のとき、像 $\\varphi([0,1]^2)$ の面積はいくつですか。`],
          a: { type: 'num', v: A, tol: 0.002 },
          hint: ['The bilinear map sends each side to a straight segment, so the image is this quadrilateral: use the shoelace formula.', '双一次写像は各辺を線分に写すので、像はこの四角形です。靴ひも公式を使います。'],
          sol: [[`Shoelace: $\\tfrac12\\sum (x_i y_{i+1} - x_{i+1} y_i) = ${n(A, 4)}$.`, `靴ひも公式：$\\tfrac12\\sum (x_i y_{i+1} - x_{i+1} y_i) = ${n(A, 4)}$ です。`], [`The quadrilateral is convex, so $\\varphi$ is one-to-one and $\\int|\\det D\\varphi|\\,du\\,dv$ gives the same $${n(A, 3)}$: the readout's first line with $f = 1$.`, `四角形は凸なので $\\varphi$ は一対一で、$\\int|\\det D\\varphi|\\,du\\,dv$ も同じ $${n(A, 3)}$ になります。$f = 1$ のときの読み取り欄の1行目です。`]],
          set: { fn: 0, x11: P11[0], y11: P11[1] },
        };
      }
      if (form === 1) {
        const a = r.int(1, 4), b = r.int(0, 3), c = r.int(1, 3), fsel = r.int(0, 2), det = a * c;
        const val = fsel === 0 ? det : fsel === 1 ? det * (a + b) / 2 : det * c / 2;
        const fname = ['1', 'x', 'y'][fsel];
        return {
          q: [`Let $\\varphi(u, v) = (${a}u${b ? ` + ${b === 1 ? '' : b}v` : ''},\\ ${c === 1 ? '' : c}v)$ on the unit square. Compute $\\int_{\\varphi([0,1]^2)} ${fname}\\,dx\\,dy$ by pulling back.`, `単位正方形上で $\\varphi(u, v) = (${a}u${b ? ` + ${b === 1 ? '' : b}v` : ''},\\ ${c === 1 ? '' : c}v)$ とします。引き戻して $\\int_{\\varphi([0,1]^2)} ${fname}\\,dx\\,dy$ を計算してください。`],
          a: { type: 'num', v: val, show: fsel ? frac(fsel === 1 ? det * (a + b) : det * c, 2) : String(det) },
          hint: ['Replace $f$ by $f\\circ\\varphi$ and $dx\\,dy$ by $|\\det D\\varphi|\\,du\\,dv$.', '$f$ を $f\\circ\\varphi$ に、$dx\\,dy$ を $|\\det D\\varphi|\\,du\\,dv$ に置き換えます。'],
          sol: [[`$\\det D\\varphi = ${a}\\cdot${c} = ${det}$, constant.`, `$\\det D\\varphi = ${a}\\cdot${c} = ${det}$ で一定です。`], [fsel === 0 ? `$\\int ${det}\\,du\\,dv = ${det}$: the area.` : `$\\int_0^1\\!\\int_0^1 ${fsel === 1 ? `(${a}u${b ? ` + ${b}v` : ''})` : `${c}v`}\\cdot ${det}\\,du\\,dv = ${det}\\cdot ${frac(fsel === 1 ? a + b : c, 2)} = ${n(val, 4)}$.`, fsel === 0 ? `$\\int ${det}\\,du\\,dv = ${det}$ で、これは面積です。` : `$\\int_0^1\\!\\int_0^1 ${fsel === 1 ? `(${a}u${b ? ` + ${b}v` : ''})` : `${c}v`}\\cdot ${det}\\,du\\,dv = ${det}\\cdot ${frac(fsel === 1 ? a + b : c, 2)} = ${n(val, 4)}$ です。`], [fsel ? `Divided by the area $${det}$ this is $${n(val / det, 4)}$, the ${fname} coordinate of the parallelogram's centre.` : 'With $f = 1$ the pullback just measures area.', fsel ? `面積 $${det}$ で割ると $${n(val / det, 4)}$ で、平行四辺形の中心の ${fname} 座標です。` : '$f = 1$ では引き戻しは面積を測るだけです。']],
        };
      }
      const maps = [['uv', 'u + v', 'v - u', 'v-u'], ['u^2', 'v', '2u', '2*u'], ['u + v^2', 'v', '1', '1'], ['u\\cos v', 'u\\sin v', 'u', 'u'], ['e^u\\cos v', 'e^u\\sin v', 'e^{2u}', 'exp(2*u)'], ['u - v', 'uv', 'u + v', 'u+v']];
      const [X, Y, tex, ans] = r.pick(maps);
      return {
        q: [`Pull back the area form: for $\\varphi(u, v) = (${X},\\ ${Y})$, $\\varphi^*(dx\\wedge dy) = J(u, v)\\,du\\wedge dv$. Find $J$.`, `面積形式を引き戻します。$\\varphi(u, v) = (${X},\\ ${Y})$ について $\\varphi^*(dx\\wedge dy) = J(u, v)\\,du\\wedge dv$ です。$J$ を求めてください。`],
        a: { type: 'expr', v: ans, vars: ['u', 'v'], dom: { u: [0.3, 1.8], v: [0.2, 1.5] }, lhs: ['$J =$', '$J =$'] },
        hint: ['$dx = x_u\\,du + x_v\\,dv$, $dy = y_u\\,du + y_v\\,dv$, and $du\\wedge du = 0$, $dv\\wedge du = -du\\wedge dv$.', '$dx = x_u\\,du + x_v\\,dv$、$dy = y_u\\,du + y_v\\,dv$ で、$du\\wedge du = 0$、$dv\\wedge du = -du\\wedge dv$ です。'],
        sol: [['Wedging, $dx\\wedge dy = (x_u y_v - x_v y_u)\\,du\\wedge dv$: the Jacobian determinant appears by itself.', 'くさび積をとると $dx\\wedge dy = (x_u y_v - x_v y_u)\\,du\\wedge dv$ で、ヤコビ行列式がひとりでに現れます。'], [`Here $J = ${tex}$.${ans === 'v-u' ? ' It vanishes on the diagonal $u = v$: there the map folds.' : ans === '2*u' ? ' It changes sign at $u = 0$, where $u \\mapsto u^2$ folds.' : ''}`, `ここでは $J = ${tex}$ です。${ans === 'v-u' ? '対角線 $u = v$ 上で 0 になり、そこで写像は折れ曲がります。' : ans === '2*u' ? '$u = 0$ で符号が変わり、$u \\mapsto u^2$ はそこで折れます。' : ''}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const P11 = r.pick(P11S), { j0, ju, jv } = bil(P11), js = [j0, j0 + ju, j0 + jv, j0 + ju + jv];
        const ans = js.every((x) => x > 0) ? 0 : js.every((x) => x < 0) ? 2 : 1;
        return {
          q: [`With the figure's corners and the gold corner at $${pt(P11)}$, what does $\\varphi$ do?`, `図の角のもとで金色の角を $${pt(P11)}$ に置くと、$\\varphi$ はどうなりますか。`],
          a: { type: 'choice', opts: [['One-to-one and orientation-preserving', '一対一で向きを保つ'], ['It folds: part of the plane is covered twice', '折れ曲がる：平面の一部が二重に覆われる'], ['One-to-one but orientation-reversing', '一対一だが向きを反転させる']], v: ans, fixed: true },
          hint: ['$\\det D\\varphi$ is affine in $(u, v)$, so its sign on the square is decided at the four corners.', '$\\det D\\varphi$ は $(u, v)$ について1次なので、正方形上での符号は4つの角で決まります。'],
          sol: [[`$\\det D\\varphi$ at the corners $(0,0), (1,0), (0,1), (1,1)$: $${js.map((x) => n(x, 3)).join(', ')}$.`, `角 $(0,0), (1,0), (0,1), (1,1)$ での $\\det D\\varphi$ は $${js.map((x) => n(x, 3)).join(', ')}$ です。`], [ans === 1 ? 'The sign changes, so the straight fold line $\\det D\\varphi = 0$ crosses the square and the image overlaps itself: the gold corner lies inside the triangle of the other three.' : ans === 0 ? 'All positive: an affine function positive at the corners is positive everywhere, so the map is one-to-one and keeps orientation.' : 'All negative: one-to-one, but the square lands mirror-imaged.', ans === 1 ? '符号が変わるので、直線の折り目 $\\det D\\varphi = 0$ が正方形を横切り、像は自分自身と重なります。金色の角は他の3つの角の三角形の内側にあります。' : ans === 0 ? 'すべて正です。角で正の1次関数は至るところ正なので、写像は一対一で向きを保ちます。' : 'すべて負です。一対一ですが、正方形は鏡像になって写ります。']],
          set: { x11: P11[0], y11: P11[1] },
        };
      }
      if (form === 1) {
        const folds = (q) => { const { j0, ju, jv } = bil(q), js = [j0, j0 + ju, j0 + jv, j0 + ju + jv]; return Math.min(...js) < 0 && Math.max(...js) > 0; };
        const P11 = r.pick([[0.9, 0.5], [0.7, 0.5], [0.6, 0.4], [1, 0.4], [0.5, 0.6], [0.8, 0.3], [0.4, 0.3], [1.1, 0.4], [0.6, 0.7]].filter(folds)), { j0, ju, jv } = bil(P11);
        const absI = absInt(j0, ju, jv), sgn = shoelace([P00, P10, P11, P01]);
        return {
          q: [`Drag the gold corner to $${pt(P11)}$, inside the triangle of the other three, so that $\\varphi$ folds. Take $f = 1$. The signed integral $\\int\\det D\\varphi$ is the shoelace area $${n(sgn, 3)}$. What is $\\int|\\det D\\varphi|\\,du\\,dv$? Give three decimals.`, `金色の角を他の3つの角の三角形の内側 $${pt(P11)}$ に動かし、$\\varphi$ を折れ曲がらせます。$f = 1$ とします。符号付きの積分 $\\int\\det D\\varphi$ は靴ひも公式の面積 $${n(sgn, 3)}$ です。$\\int|\\det D\\varphi|\\,du\\,dv$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: absI, tol: 0.003 },
          hint: [`$\\det D\\varphi = ${n(j0, 3)} ${ju < 0 ? '-' : '+'} ${n(Math.abs(ju), 3)}u ${jv < 0 ? '-' : '+'} ${n(Math.abs(jv), 3)}v$; integrate its positive and negative parts separately.`, `$\\det D\\varphi = ${n(j0, 3)} ${ju < 0 ? '-' : '+'} ${n(Math.abs(ju), 3)}u ${jv < 0 ? '-' : '+'} ${n(Math.abs(jv), 3)}v$ です。正の部分と負の部分を別々に積分します。`],
          sol: [[`$\\det D\\varphi = (B + vE)\\times(C + uE) = ${n(j0, 3)} ${ju < 0 ? '-' : '+'} ${n(Math.abs(ju), 3)}u ${jv < 0 ? '-' : '+'} ${n(Math.abs(jv), 3)}v$, negative on a triangle near the corner $(1, 1)$.`, `$\\det D\\varphi = (B + vE)\\times(C + uE) = ${n(j0, 3)} ${ju < 0 ? '-' : '+'} ${n(Math.abs(ju), 3)}u ${jv < 0 ? '-' : '+'} ${n(Math.abs(jv), 3)}v$ で、角 $(1, 1)$ の近くの三角形で負になります。`], [`Integrating the absolute value gives $${n(absI, 4)}$; the negative part contributes $${n((absI - sgn) / 2, 4)}$, so $\\int|\\det| = ${n(sgn, 3)} + 2\\cdot${n((absI - sgn) / 2, 4)}$.`, `絶対値を積分すると $${n(absI, 4)}$ です。負の部分の寄与は $${n((absI - sgn) / 2, 4)}$ なので $\\int|\\det| = ${n(sgn, 3)} + 2\\cdot${n((absI - sgn) / 2, 4)}$ です。`], ['That is the area counted with multiplicity $\\#\\varphi^{-1}(y)$: the region covered twice counts twice here, while in the signed integral its two layers cancel.', 'これは重複度 $\\#\\varphi^{-1}(y)$ を込めて数えた面積です。二重に覆われた部分はここでは2回数えられ、符号付きの積分では2つの層が打ち消し合います。']],
          set: { fn: 0, x11: P11[0], y11: P11[1] },
        };
      }
      const k = r.int(0, 2), fs = [['x', 'r^2\\cos\\theta', 'r^2*cos(theta)'], ['x^2 + y^2', 'r^3', 'r^3'], ['e^{-(x^2 + y^2)}', 'r e^{-r^2}', 'r*exp(-r^2)']][k];
      return {
        q: [`With polar coordinates $\\varphi(r, \\theta) = (r\\cos\\theta, r\\sin\\theta)$, write the pulled-back integrand $(f\\circ\\varphi)\\det D\\varphi$ for $f = ${fs[0]}$.`, `極座標 $\\varphi(r, \\theta) = (r\\cos\\theta, r\\sin\\theta)$ について、$f = ${fs[0]}$ の引き戻した被積分関数 $(f\\circ\\varphi)\\det D\\varphi$ を書いてください。`],
        a: { type: 'expr', v: fs[2], vars: ['r', 'theta'], dom: { r: [0.2, 2], theta: [0, 3] }, lhs: ['$(f\\circ\\varphi)\\det D\\varphi =$', '$(f\\circ\\varphi)\\det D\\varphi =$'] },
        hint: ['$\\det D\\varphi = \\cos\\theta\\cdot r\\cos\\theta - (-r\\sin\\theta)\\sin\\theta$.', '$\\det D\\varphi = \\cos\\theta\\cdot r\\cos\\theta - (-r\\sin\\theta)\\sin\\theta$ です。'],
        sol: [['$\\det D\\varphi = r$, so $dx\\wedge dy$ pulls back to $r\\,dr\\wedge d\\theta$.', '$\\det D\\varphi = r$ なので、$dx\\wedge dy$ は $r\\,dr\\wedge d\\theta$ に引き戻されます。'], [`$f\\circ\\varphi = ${['r\\cos\\theta', 'r^2', 'e^{-r^2}'][k]}$, so the integrand is $${fs[1]}$.`, `$f\\circ\\varphi = ${['r\\cos\\theta', 'r^2', 'e^{-r^2}'][k]}$ なので、被積分関数は $${fs[1]}$ です。`], [k === 2 ? 'This is how $\\int e^{-(x^2+y^2)}\\,dx\\,dy = 2\\pi\\int_0^\\infty r e^{-r^2}dr = \\pi$ is computed: the factor $r$ makes it elementary.' : 'The extra factor $r$ is the Jacobian: thin rings far from the origin have more area.', k === 2 ? 'こうして $\\int e^{-(x^2+y^2)}\\,dx\\,dy = 2\\pi\\int_0^\\infty r e^{-r^2}dr = \\pi$ が計算できます。因子 $r$ のおかげで初等的になります。' : '余分な因子 $r$ がヤコビアンです。原点から遠い細い輪ほど面積が大きいのです。']],
      };
    },
  ];

  /* ---------- 2. pushing a measure forward ---------- */
  const Tm = (a) => (x) => x + a * Math.sin(TAU * x) / TAU, Tpm = (a) => (x) => 1 + a * Math.cos(TAU * x);
  const rootsOf = (f, y, m = 2000) => { const out = []; let xp = 0, gp = f(0) - y; if (gp === 0) out.push(0); for (let i = 1; i <= m; i++) { const x = i / m, g = f(x) - y; if (g === 0) out.push(x); else if (gp !== 0 && (g > 0) !== (gp > 0)) { let lo = xp, hi = x; for (let k = 0; k < 60; k++) { const c = (lo + hi) / 2; if ((f(c) - y > 0) === (gp > 0)) lo = c; else hi = c; } out.push((lo + hi) / 2); } xp = x; gp = g; } return out; };
  Q['pushforward-measure'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.step(0.1, 0.9, 0.05), [x0, xt] = r.pick([[0, '0'], [0.25, '\\tfrac14'], [0.5, '\\tfrac12'], [1 / 3, '\\tfrac13'], [1 / 6, '\\tfrac16']]), d = 1 / (1 + a * Math.cos(TAU * x0));
        return {
          q: [`$\\mu$ is uniform on $[0, 1]$ and $T(x) = x + a\\sin(2\\pi x)/(2\\pi)$ with $a = ${n(a)}$. What is the density of $T_\\#\\mu$ at the point $y = T(${xt})$?`, `$\\mu$ は $[0, 1]$ 上の一様分布で、$T(x) = x + a\\sin(2\\pi x)/(2\\pi)$、$a = ${n(a)}$ です。点 $y = T(${xt})$ における $T_\\#\\mu$ の密度はいくつですか。`],
          a: { type: 'num', v: d, tol: 0.002 },
          hint: ['With $a < 1$, $T$ is increasing, so there is one preimage and the density is $\\rho/T\'$ there.', '$a < 1$ では $T$ は増加関数なので逆像は1つで、そこでの密度は $\\rho/T\'$ です。'],
          sol: [[`$T'(x) = 1 + a\\cos 2\\pi x$, so $T'(${xt}) = ${n(1 + a * Math.cos(TAU * x0), 4)}$.`, `$T'(x) = 1 + a\\cos 2\\pi x$ なので $T'(${xt}) = ${n(1 + a * Math.cos(TAU * x0), 4)}$ です。`], [`Density $= 1/${n(1 + a * Math.cos(TAU * x0), 4)} = ${n(d, 4)}$: ${d > 1 ? 'thicker than uniform, because $T$ is flat here and squeezes mass together.' : d < 1 ? 'thinner than uniform, because $T$ is steep here and spreads mass out.' : 'exactly uniform here.'}`, `密度は $1/${n(1 + a * Math.cos(TAU * x0), 4)} = ${n(d, 4)}$ です。${d > 1 ? 'ここでは $T$ が平らで質量を押し縮めるので、一様より濃くなります。' : d < 1 ? 'ここでは $T$ が急で質量を引き伸ばすので、一様より薄くなります。' : 'ここではちょうど一様です。'}`]],
          set: { a, src: 0 },
        };
      }
      if (form === 1) {
        const k = r.int(0, 2), t = r.pick([0.04, 0.09, 0.16, 0.25, 0.36, 0.49, 0.64, 0.81, 0.125, 0.216, 0.343, 0.512].filter((x) => k === 1 ? Math.abs(Math.cbrt(x) - Math.round(Math.cbrt(x) * 10) / 10) < 1e-9 : Math.abs(Math.sqrt(x) - Math.round(Math.sqrt(x) * 10) / 10) < 1e-9));
        const [Tt, ans, inv] = [['x^2', Math.sqrt(t), `\\sqrt{${t}}`], ['x^3', Math.cbrt(t), `\\sqrt[3]{${t}}`], ['1 - \\sqrt{1 - x}', 1 - (1 - t) ** 2, `1 - (1 - ${t})^2`]][k];
        return {
          q: [`$\\mu$ is uniform on $[0, 1]$ and $T(x) = ${Tt}$. What is $T_\\#\\mu([0, ${t}])$?`, `$\\mu$ は $[0, 1]$ 上の一様分布で、$T(x) = ${Tt}$ です。$T_\\#\\mu([0, ${t}])$ はいくつですか。`],
          a: { type: 'num', v: ans, tol: 1e-4 },
          hint: ['By definition $T_\\#\\mu(B) = \\mu(T^{-1}(B))$: find which $x$ land in $B$.', '定義より $T_\\#\\mu(B) = \\mu(T^{-1}(B))$ です。$B$ に入る $x$ を求めます。'],
          sol: [[`$T$ is increasing on $[0, 1]$, so $T^{-1}([0, ${t}]) = [0, ${inv}]$.`, `$T$ は $[0, 1]$ で増加するので $T^{-1}([0, ${t}]) = [0, ${inv}]$ です。`], [`Its $\\mu$-measure is its length, $${n(ans, 4)}$. No density was needed: sets are pulled back, measures pushed forward.`, `その $\\mu$ 測度は長さ $${n(ans, 4)}$ です。密度は必要ありません。集合は引き戻され、測度は押し出されます。`]],
        };
      }
      const a = r.step(0, 2.5, 0.05);
      return {
        q: [`$\\mu$ is uniform on $[0, 1]$ and $T(x) = x + a\\sin(2\\pi x)/(2\\pi)$ with $a = ${n(a)}$. What is the mean $\\int y\\,d(T_\\#\\mu)(y)$?`, `$\\mu$ は $[0, 1]$ 上の一様分布で、$T(x) = x + a\\sin(2\\pi x)/(2\\pi)$、$a = ${n(a)}$ です。平均 $\\int y\\,d(T_\\#\\mu)(y)$ はいくつですか。`],
        a: { type: 'num', v: 0.5 },
        hint: ['Pull the function back instead of pushing the measure: $\\int g\\,d(T_\\#\\mu) = \\int (g\\circ T)\\,d\\mu$.', '測度を押し出す代わりに関数を引き戻します：$\\int g\\,d(T_\\#\\mu) = \\int (g\\circ T)\\,d\\mu$。'],
        sol: [['$\\int_0^1 T(x)\\,dx = \\int_0^1 x\\,dx + \\tfrac{a}{2\\pi}\\int_0^1\\sin 2\\pi x\\,dx = \\tfrac12 + 0$.', '$\\int_0^1 T(x)\\,dx = \\int_0^1 x\\,dx + \\tfrac{a}{2\\pi}\\int_0^1\\sin 2\\pi x\\,dx = \\tfrac12 + 0$ です。'], [`So the mean is $\\tfrac12$ for every $a$${a > 1 ? ', even with the fold' : ''}: computing it never required the density of $T_\\#\\mu$.`, `よって平均はどの $a$ でも $\\tfrac12$ です${a > 1 ? '（折り返しがあっても同じです）' : ''}。$T_\\#\\mu$ の密度はまったく必要ありませんでした。`]],
        set: { a, src: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.step(0.1, 0.95, 0.05), top = r.chance(0.5), d = top ? 1 / (1 - a) : 1 / (1 + a);
        return {
          q: [`For $\\mu$ uniform and $a = ${n(a)}$, what is the ${top ? 'largest' : 'smallest'} value of the push-forward density on $[0, 1]$?`, `$\\mu$ が一様で $a = ${n(a)}$ のとき、$[0, 1]$ 上の押し出しの密度の${top ? '最大値' : '最小値'}はいくつですか。`],
          a: { type: 'num', v: d, tol: 0.002 },
          hint: ['The density at $y = T(x)$ is $1/T\'(x)$; find where $T\'$ is smallest or largest.', '$y = T(x)$ での密度は $1/T\'(x)$ です。$T\'$ が最小または最大になる点を探します。'],
          sol: [[`$T'(x) = 1 + a\\cos 2\\pi x$ ranges over $[1 - a, 1 + a]$, ${top ? 'smallest at $x = \\tfrac12$' : 'largest at $x = 0$ and $1$'}.`, `$T'(x) = 1 + a\\cos 2\\pi x$ の値域は $[1 - a, 1 + a]$ で、${top ? '$x = \\tfrac12$ で最小' : '$x = 0$ と $1$ で最大'}です。`], [`So the ${top ? 'largest' : 'smallest'} density is $1/(1 ${top ? '-' : '+'} ${n(a)}) = ${n(d, 4)}$, at $y = ${top ? '\\tfrac12' : '0'}$${top ? '' : ' and $1$'}.${top ? ' As $a \\to 1$ it blows up: the flat spot becomes a fold.' : ''}`, `よって密度の${top ? '最大値' : '最小値'}は $y = ${top ? '\\tfrac12' : '0'}$${top ? '' : ' と $1$'} で $1/(1 ${top ? '-' : '+'} ${n(a)}) = ${n(d, 4)}$ です。${top ? '$a \\to 1$ で発散し、平らな点が折り目になります。' : ''}`]],
          set: { a, src: 0 },
        };
      }
      if (form === 1) {
        const a = r.step(0.5, 2.5, 0.25), m2 = 1 / 3 - a / (2 * PI * PI) + a * a / (8 * PI * PI);
        return {
          q: [`With $\\mu$ uniform on $[0, 1]$ and $a = ${n(a)}$, compute the second moment $\\int y^2\\,d(T_\\#\\mu)$. Give four decimals.`, `$\\mu$ が $[0, 1]$ 上の一様分布で $a = ${n(a)}$ のとき、2次モーメント $\\int y^2\\,d(T_\\#\\mu)$ を計算してください（小数第4位まで）。`],
          a: { type: 'num', v: m2, tol: 6e-5 },
          hint: ['Expand $\\int_0^1 T(x)^2\\,dx$; you need $\\int_0^1 x\\sin 2\\pi x\\,dx = -\\tfrac{1}{2\\pi}$ and $\\int_0^1\\sin^2 2\\pi x\\,dx = \\tfrac12$.', '$\\int_0^1 T(x)^2\\,dx$ を展開します。$\\int_0^1 x\\sin 2\\pi x\\,dx = -\\tfrac{1}{2\\pi}$ と $\\int_0^1\\sin^2 2\\pi x\\,dx = \\tfrac12$ が必要です。'],
          sol: [['$\\int_0^1 T^2\\,dx = \\int x^2 + \\tfrac{a}{\\pi}\\int x\\sin 2\\pi x + \\tfrac{a^2}{4\\pi^2}\\int\\sin^2 2\\pi x = \\tfrac13 - \\tfrac{a}{2\\pi^2} + \\tfrac{a^2}{8\\pi^2}$.', '$\\int_0^1 T^2\\,dx = \\int x^2 + \\tfrac{a}{\\pi}\\int x\\sin 2\\pi x + \\tfrac{a^2}{4\\pi^2}\\int\\sin^2 2\\pi x = \\tfrac13 - \\tfrac{a}{2\\pi^2} + \\tfrac{a^2}{8\\pi^2}$ です。'], [`With $a = ${n(a)}$: $${n(m2, 5)}$, so the variance is $${n(m2 - 0.25, 5)}$ against $\\tfrac1{12} = 0.08333$ for $\\mu$ itself${m2 - 0.25 < 1 / 12 ? ': the map has squeezed the mass toward the middle.' : '.'}`, `$a = ${n(a)}$ では $${n(m2, 5)}$ で、分散は $${n(m2 - 0.25, 5)}$ です。$\\mu$ 自身の $\\tfrac1{12} = 0.08333$ と比べてください${m2 - 0.25 < 1 / 12 ? '。写像が質量を中央へ押し寄せています。' : '。'}`]],
          set: { a, src: 0 },
        };
      }
      const a = r.step(1.1, 2.5, 0.05), xs = Math.acos(-1 / a) / TAU, ys = Tm(a)(xs);
      return {
        q: [`For $a = ${n(a)} > 1$ the graph of $T(x) = x + a\\sin(2\\pi x)/(2\\pi)$ folds back. At what height $y^*$ is the lower fold (the first point where $T' = 0$)? Give three decimals.`, `$a = ${n(a)} > 1$ では $T(x) = x + a\\sin(2\\pi x)/(2\\pi)$ のグラフが折り返します。下側の折り目（最初に $T' = 0$ となる点）の高さ $y^*$ はいくつですか（小数第3位まで）。`],
        a: { type: 'num', v: ys, tol: 0.002 },
        hint: ['Solve $1 + a\\cos 2\\pi x = 0$ for the smallest $x$, then evaluate $T$ there.', '$1 + a\\cos 2\\pi x = 0$ を最小の $x$ について解き、そこで $T$ を計算します。'],
        sol: [[`$\\cos 2\\pi x^* = -1/${n(a)}$ gives $x^* = \\arccos(-1/${n(a)})/(2\\pi) = ${n(xs, 4)}$.`, `$\\cos 2\\pi x^* = -1/${n(a)}$ より $x^* = \\arccos(-1/${n(a)})/(2\\pi) = ${n(xs, 4)}$ です。`], [`$y^* = T(x^*) = ${n(xs, 4)} + ${n(a)}\\cdot\\sin(2\\pi\\cdot${n(xs, 4)})/(2\\pi) = ${n(ys, 4)}$.`, `$y^* = T(x^*) = ${n(xs, 4)} + ${n(a)}\\cdot\\sin(2\\pi\\cdot${n(xs, 4)})/(2\\pi) = ${n(ys, 4)}$ です。`], ['At this height the push-forward density has an inverse square-root spike, yet the mass in any window around it stays finite.', 'この高さで押し出しの密度は逆平方根型に尖りますが、そのまわりのどの窓の質量も有限のままです。']],
        set: { a, src: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), V = [
          { T: '4x(1 - x)', mu: '$[0, 1]$', ans: '1/(2*sqrt(1-y))', tex: '\\dfrac{1}{2\\sqrt{1 - y}}', pre: 'x = \\tfrac12(1 \\pm \\sqrt{1 - y})', der: '|T\'| = 4\\sqrt{1 - y}', rho: '1', dom: [0.05, 0.95], where: 'at $y = 1$, the image of the turning point $x = \\tfrac12$' },
          { T: '\\sin\\pi x', mu: '$[0, 1]$', ans: '2/(pi*sqrt(1-y^2))', tex: '\\dfrac{2}{\\pi\\sqrt{1 - y^2}}', pre: 'x \\text{ and } 1 - x', der: '|T\'| = \\pi\\sqrt{1 - y^2}', rho: '1', dom: [0.05, 0.95], where: 'at $y = 1$, the top of the arch' },
          { T: 'x^2', mu: '$[-1, 1]$', ans: '1/(2*sqrt(y))', tex: '\\dfrac{1}{2\\sqrt y}', pre: 'x = \\pm\\sqrt y', der: '|T\'| = 2\\sqrt y', rho: '\\tfrac12', dom: [0.05, 0.95], where: 'at $y = 0$, the image of the critical point $x = 0$' },
        ][k];
        const whereJ = ['$y = 1$（折り返し点 $x = \\tfrac12$ の像）', '$y = 1$（山の頂上）', '$y = 0$（臨界点 $x = 0$ の像）'][k];
        return {
          q: [`$\\mu$ is uniform on ${V.mu} and $T(x) = ${V.T}$. Write the density of $T_\\#\\mu$ as a function of $y$ inside its range.`, `$\\mu$ は ${V.mu} 上の一様分布で、$T(x) = ${V.T}$ です。$T_\\#\\mu$ の密度を、値域の内部で $y$ の関数として表してください。`],
          a: { type: 'expr', v: V.ans, vars: ['y'], dom: { y: V.dom }, lhs: ['$\\rho_{T_\\#\\mu}(y) =$', '$\\rho_{T_\\#\\mu}(y) =$'] },
          hint: ['Every $y$ has two preimages; add $\\rho/|T\'|$ over both.', 'どの $y$ にも逆像が2つあります。両方について $\\rho/|T\'|$ を足します。'],
          sol: [[`The preimages are $${V.pre}$, and there $${V.der}$; the source density is $${V.rho}$.`, `逆像は $${V.pre}$ で、そこでは $${V.der}$ です。元の密度は $${V.rho}$ です。`], [`Adding the two equal contributions: $\\rho_{T_\\#\\mu}(y) = ${V.tex}$.`, `等しい2つの寄与を足して $\\rho_{T_\\#\\mu}(y) = ${V.tex}$ です。`], [`It blows up ${V.where}, like the fold heights in the figure, yet it integrates to $1$.`, `${whereJ}で発散します。図の折り目の高さと同じですが、積分は $1$ になります。`]],
        };
      }
      if (form === 1) {
        const a = r.step(0.2, 2.5, 0.1), y = r.pick([0.5, 0.3, 0.4, 0.6, 0.7]), cnt = rootsOf(Tm(a), y).length;
        return {
          q: [`With $a = ${n(a)}$, how many points $x \\in [0, 1]$ satisfy $T(x) = ${y}$, that is, how many pieces does $T^{-1}$ of a thin window around $${y}$ have?`, `$a = ${n(a)}$ のとき、$T(x) = ${y}$ を満たす $x \\in [0, 1]$ はいくつありますか。つまり、$${y}$ のまわりの細い窓の $T^{-1}$ はいくつの区間からなりますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Find the fold heights first; between them the graph crosses each level three times.', 'まず折り目の高さを求めます。その間では、グラフは各水準を3回横切ります。'],
          sol: [[a <= 1 ? `$a \\le 1$, so $T' \\ge 0$ and $T$ is increasing: one preimage.` : `$a > 1$: the folds are at heights $${rootsOf((x) => Tpm(a)(x), 0).map((x) => n(Tm(a)(x), 3)).join('$ and $')}$.`, a <= 1 ? '$a \\le 1$ なので $T\' \\ge 0$ で $T$ は増加し、逆像は1つです。' : `$a > 1$ で、折り目の高さは $${rootsOf((x) => Tpm(a)(x), 0).map((x) => n(Tm(a)(x), 3)).join('$ と $')}$ です。`], [`The level $${y}$ ${cnt === 3 ? 'lies between them, so it is hit three times' : 'is hit once'}: $${cnt}$ preimage${cnt > 1 ? 's' : ''}, and the readout's count of pieces agrees for a narrow window.`, `水準 $${y}$ は${cnt === 3 ? 'その間にあるので3回当たります' : '1回だけ当たります'}。逆像は $${cnt}$ 個で、窓を細くすると読み取り欄の区間の数と一致します。`]],
          set: { a, src: 0, w: 0.02, },
        };
      }
      const a = r.step(0.1, 0.9, 0.1), [x0, x1, t0, t1] = r.pick([[0.25, 0.5, '\\tfrac14', '\\tfrac12'], [0, 0.25, '0', '\\tfrac14'], [0.1, 0.4, '0.1', '0.4'], [0.5, 0.75, '\\tfrac12', '\\tfrac34'], [0.2, 0.9, '0.2', '0.9']]);
      return {
        q: [`$\\mu$ is uniform, $a = ${n(a)}$, and $B = [T(${t0}), T(${t1})] = [${n(Tm(a)(x0), 4)}, ${n(Tm(a)(x1), 4)}]$. What is $T_\\#\\mu(B)$?`, `$\\mu$ は一様で $a = ${n(a)}$、$B = [T(${t0}), T(${t1})] = [${n(Tm(a)(x0), 4)}, ${n(Tm(a)(x1), 4)}]$ です。$T_\\#\\mu(B)$ はいくつですか。`],
        a: { type: 'num', v: x1 - x0 },
        hint: ['Do not integrate the density: pull the set back.', '密度を積分する必要はありません。集合を引き戻します。'],
        sol: [[`$a < 1$, so $T$ is increasing and $T^{-1}(B) = [${t0}, ${t1}]$ exactly.`, `$a < 1$ なので $T$ は増加し、$T^{-1}(B) = [${t0}, ${t1}]$ がちょうど成り立ちます。`], [`$T_\\#\\mu(B) = ${n(x1 - x0)}$, whatever $a$ is, although $B$ itself has length $${n(Tm(a)(x1) - Tm(a)(x0), 4)}$: the measure moved with the points.`, `$a$ によらず $T_\\#\\mu(B) = ${n(x1 - x0)}$ です。$B$ 自身の長さは $${n(Tm(a)(x1) - Tm(a)(x0), 4)}$ ですが、測度は点と一緒に動いたのです。`]],
        set: { a, src: 0 },
      };
    },
  ];

  /* ---------- 3. integrating along the fibres ---------- */
  const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(TAU);
  Q['coarea-fibres'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), x = r.int(-3, 3), y = r.nz(-3, 3);
        const V = [['x + y', Math.SQRT2, '\\sqrt2', '(1, 1)'], ['\\sqrt{x^2 + y^2}', 1, '1', `\\tfrac{(x, y)}{\\sqrt{x^2 + y^2}}`], ['xy', Math.hypot(x, y), `\\sqrt{${x * x + y * y}}`, '(y, x)']][k];
        return {
          q: [`What is $|\\nabla F|$ for $F = ${V[0]}$ at the point $(${x}, ${y})$?`, `$F = ${V[0]}$ の点 $(${x}, ${y})$ における $|\\nabla F|$ はいくつですか。`],
          a: { type: 'num', v: V[1], show: V[2] },
          hint: ['Differentiate in $x$ and in $y$, then take the length.', '$x$ と $y$ で微分し、その長さをとります。'],
          sol: [[`$\\nabla F = ${V[3]}$${k === 2 ? ` $= (${y}, ${x})$` : ''}.`, `$\\nabla F = ${V[3]}$${k === 2 ? ` $= (${y}, ${x})$` : ''} です。`], [`$|\\nabla F| = ${V[2]}${k === 2 ? ` = ${n(V[1], 4)}` : ''}$. The shell between the fibres $F = c$ and $F = c + \\delta$ has width $\\delta/|\\nabla F|$ here.`, `$|\\nabla F| = ${V[2]}${k === 2 ? ` = ${n(V[1], 4)}` : ''}$ です。ここでファイバー $F = c$ と $F = c + \\delta$ にはさまれた殻の幅は $\\delta/|\\nabla F|$ です。`]],
          set: { map: [1, 2, 3][k] },
        };
      }
      if (form === 1) {
        const c = r.pick([0, 0.5, 1, 1.5, 2, -1, -0.5]);
        return {
          q: [`$p$ is the standard Gaussian on the plane and $F(x, y) = x$. Using the coarea formula, what is the density $q(${c})$? Give four decimals.`, `$p$ は平面上の標準ガウス分布で、$F(x, y) = x$ です。余面積公式を使うと、密度 $q(${c})$ はいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: phi(c), tol: 6e-5 },
          hint: ['The fibre $x = c$ is a vertical line with $|\\nabla F| = 1$; integrate $p$ along it.', 'ファイバー $x = c$ は $|\\nabla F| = 1$ の鉛直線です。それに沿って $p$ を積分します。'],
          sol: [[`$q(c) = \\int_{-\\infty}^{\\infty}\\tfrac{1}{2\\pi}e^{-(c^2 + y^2)/2}\\,dy = \\tfrac{1}{\\sqrt{2\\pi}}e^{-c^2/2}$.`, `$q(c) = \\int_{-\\infty}^{\\infty}\\tfrac{1}{2\\pi}e^{-(c^2 + y^2)/2}\\,dy = \\tfrac{1}{\\sqrt{2\\pi}}e^{-c^2/2}$ です。`], [`$q(${c}) = ${n(phi(c), 5)}$: the marginal of the plane density, the simplest case of integrating along fibres.`, `$q(${c}) = ${n(phi(c), 5)}$ です。平面の密度の周辺分布で、ファイバーに沿った積分の最も簡単な例です。`]],
          set: { map: 0, dist: 0, r: 0 },
        };
      }
      const c = r.pick([0.25, 0.5, 1, 1.5, 2, 2.5, 3]), q = c * Math.exp(-c * c / 2);
      return {
        q: [`For the standard Gaussian and $F = \\sqrt{x^2 + y^2}$, the fibre is a circle of length $2\\pi c$ on which $p = e^{-c^2/2}/2\\pi$. What is $q(${c})$? Give four decimals.`, `標準ガウス分布と $F = \\sqrt{x^2 + y^2}$ では、ファイバーは長さ $2\\pi c$ の円で、その上で $p = e^{-c^2/2}/2\\pi$ です。$q(${c})$ はいくつですか（小数第4位まで）。`],
        a: { type: 'num', v: q, tol: 6e-5 },
        hint: ['$|\\nabla F| = 1$, so $q(c)$ is $p$ times the length of the fibre.', '$|\\nabla F| = 1$ なので、$q(c)$ は $p$ にファイバーの長さを掛けたものです。'],
        sol: [[`$q(c) = 2\\pi c\\cdot\\tfrac{e^{-c^2/2}}{2\\pi} = c\\,e^{-c^2/2}$.`, `$q(c) = 2\\pi c\\cdot\\tfrac{e^{-c^2/2}}{2\\pi} = c\\,e^{-c^2/2}$ です。`], [`$q(${c}) = ${n(q, 5)}$, the Rayleigh density. It peaks at $c = 1$ and vanishes at $0$ although $p$ is largest there: the fibres near the origin are short.`, `$q(${c}) = ${n(q, 5)}$ で、レイリー分布の密度です。$c = 1$ で最大になり、$p$ が最大の $0$ では 0 になります。原点近くのファイバーは短いからです。`]],
        set: { map: 2, dist: 0, r: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([0, 0.25, 0.5, 1, 1.5, -0.5, -1, 1.75, -1.5]), q = (2 - Math.abs(c)) / 4;
        return {
          q: [`$X, Y$ are independent and uniform on $[-1, 1]$, so $p = \\tfrac14$ on the square. What is the density of $X + Y$ at $c = ${c}$?`, `$X, Y$ は独立で $[-1, 1]$ 上の一様分布なので、正方形上で $p = \\tfrac14$ です。$X + Y$ の $c = ${c}$ における密度はいくつですか。`],
          a: { type: 'num', v: q, show: frac(2 * 4 - Math.abs(c) * 4, 16) },
          hint: ['The fibre $x + y = c$ inside the square has length $\\sqrt2(2 - |c|)$, and $|\\nabla F| = \\sqrt2$.', '正方形の中のファイバー $x + y = c$ の長さは $\\sqrt2(2 - |c|)$ で、$|\\nabla F| = \\sqrt2$ です。'],
          sol: [[`$q(c) = \\tfrac14\\cdot\\sqrt2(2 - |c|)/\\sqrt2 = (2 - |c|)/4$: the two factors of $\\sqrt2$ cancel.`, `$q(c) = \\tfrac14\\cdot\\sqrt2(2 - |c|)/\\sqrt2 = (2 - |c|)/4$ で、2つの $\\sqrt2$ は打ち消し合います。`], [`$q(${c}) = ${n(q, 4)}$: the triangular density of a sum of two uniforms, a convolution.`, `$q(${c}) = ${n(q, 4)}$ です。2つの一様分布の和の三角形の密度で、畳み込みです。`]],
          set: { map: 1, dist: 1 },
        };
      }
      if (form === 1) {
        const rr = r.step(-0.9, 0.9, 0.05), c = r.pick([0, 0.5, 1, 1.5, 2]), v = 2 + 2 * rr, q = Math.exp(-c * c / (2 * v)) / Math.sqrt(TAU * v);
        return {
          q: [`$(X, Y)$ is a standard bivariate Gaussian with correlation $r = ${n(rr)}$. What is the density of $X + Y$ at $c = ${c}$? Give four decimals.`, `$(X, Y)$ は相関 $r = ${n(rr)}$ の標準2変量ガウス分布です。$X + Y$ の $c = ${c}$ における密度はいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: q, tol: 6e-5 },
          hint: ['$X + Y$ is Gaussian with variance $\\operatorname{Var}X + \\operatorname{Var}Y + 2\\operatorname{Cov}(X, Y)$.', '$X + Y$ は分散 $\\operatorname{Var}X + \\operatorname{Var}Y + 2\\operatorname{Cov}(X, Y)$ のガウス分布です。'],
          sol: [[`Variance $= 1 + 1 + 2\\cdot(${n(rr)}) = ${n(v, 4)}$.`, `分散は $1 + 1 + 2\\cdot(${n(rr)}) = ${n(v, 4)}$ です。`], [`$q(${c}) = e^{-${c}^2/(2\\cdot ${n(v, 4)})}/\\sqrt{2\\pi\\cdot ${n(v, 4)}} = ${n(q, 5)}$. ${rr < 0 ? 'Negative correlation makes the sum narrower: the fibres $x + y = c$ cut across the long axis of the ellipse.' : rr > 0 ? 'Positive correlation makes the sum wider: the fibres run across the narrow axis of the ellipse.' : ''}`, `$q(${c}) = e^{-${c}^2/(2\\cdot ${n(v, 4)})}/\\sqrt{2\\pi\\cdot ${n(v, 4)}} = ${n(q, 5)}$ です。${rr < 0 ? '負の相関では和の分布が狭くなります。ファイバー $x + y = c$ が楕円の長軸を横切るからです。' : rr > 0 ? '正の相関では和の分布が広くなります。ファイバーが楕円の短軸を横切るからです。' : ''}`]],
          set: { map: 1, dist: 0, r: rr },
        };
      }
      const c = r.pick([0.2, 0.4, 0.5, 0.6, 0.8, 1]), q = PI * c / 2;
      return {
        q: [`$p$ is uniform on the square $[-1, 1]^2$ (so $p = \\tfrac14$) and $F = \\sqrt{x^2 + y^2}$. What is $q(${c})$?`, `$p$ は正方形 $[-1, 1]^2$ 上の一様分布（$p = \\tfrac14$）で、$F = \\sqrt{x^2 + y^2}$ です。$q(${c})$ はいくつですか。`],
        a: { type: 'num', v: q, tol: 1e-4 },
        hint: ['For $c \\le 1$ the whole circle of radius $c$ lies in the square.', '$c \\le 1$ では半径 $c$ の円全体が正方形の中にあります。'],
        sol: [[`$q(c) = \\tfrac14\\cdot 2\\pi c/1 = \\tfrac{\\pi c}{2}$ for $c \\le 1$.`, `$c \\le 1$ では $q(c) = \\tfrac14\\cdot 2\\pi c/1 = \\tfrac{\\pi c}{2}$ です。`], [`$q(${c}) = ${n(q, 4)}$: the density of the distance from the centre grows linearly until the circle reaches the sides of the square.`, `$q(${c}) = ${n(q, 4)}$ です。中心からの距離の密度は、円が正方形の辺に届くまで直線的に増えます。`]],
        set: { map: 2, dist: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), V = [
          { d: 'the standard Gaussian', dj: '標準ガウス分布', F: '\\sqrt{x^2 + y^2}', v: 'c*exp(-c^2/2)', tex: 'c\\,e^{-c^2/2}', dom: [0.1, 3], st: { map: 2, dist: 0, r: 0 }, why: ['The fibre is a circle of length $2\\pi c$, $|\\nabla F| = 1$, and $p = e^{-c^2/2}/2\\pi$ on it.', 'ファイバーは長さ $2\\pi c$ の円で、$|\\nabla F| = 1$、その上で $p = e^{-c^2/2}/2\\pi$ です。'] },
          { d: 'the uniform density on $[-1, 1]^2$', dj: '$[-1, 1]^2$ 上の一様分布', F: 'x + y', v: '(2-c)/4', tex: '\\tfrac{2 - c}{4}', dom: [0.1, 1.9], st: { map: 1, dist: 1 }, why: ['The segment of $x + y = c$ in the square has length $\\sqrt2(2 - c)$ for $0 \\le c \\le 2$, and $|\\nabla F| = \\sqrt2$.', '正方形の中の $x + y = c$ の線分の長さは $0 \\le c \\le 2$ で $\\sqrt2(2 - c)$、$|\\nabla F| = \\sqrt2$ です。'] },
          { d: 'the uniform density on $[-1, 1]^2$', dj: '$[-1, 1]^2$ 上の一様分布', F: 'xy', v: '-ln(c)/2', tex: '-\\tfrac12\\ln c', dom: [0.05, 0.95], st: { map: 3, dist: 1 }, why: ['On the branch $x = e^s$, $y = c e^{-s}$ the weight $d\\ell/|\\nabla F|$ is exactly $ds$; inside the square $s$ runs over $[\\ln c, 0]$, and there are two branches.', '枝 $x = e^s$、$y = c e^{-s}$ 上では重み $d\\ell/|\\nabla F|$ はちょうど $ds$ です。正方形の中では $s$ は $[\\ln c, 0]$ を動き、枝は2本あります。'] },
        ][k];
        return {
          q: [`For ${V.d} and $F = ${V.F}$, write $q(c)$ for $0 < c < ${k === 0 ? '\\infty' : k === 1 ? '2' : '1'}$.`, `${V.dj}と $F = ${V.F}$ について、$0 < c < ${k === 0 ? '\\infty' : k === 1 ? '2' : '1'}$ での $q(c)$ を書いてください。`],
          a: { type: 'expr', v: V.v, vars: ['c'], dom: { c: V.dom }, lhs: ['$q(c) =$', '$q(c) =$'] },
          hint: ['$q(c) = \\int_{F = c} p/|\\nabla F|\\,d\\ell$: find the fibre, its length element and the gradient.', '$q(c) = \\int_{F = c} p/|\\nabla F|\\,d\\ell$ です。ファイバー、その長さの要素、勾配を求めます。'],
          sol: [V.why, [`So $q(c) = ${V.tex}$.${k === 2 ? ' It has a logarithmic spike at $c = 0$, where the fibre runs through the critical point of $F$, yet $\\int_0^1 -\\ln c\\,dc = 1$ is finite.' : ''}`, `よって $q(c) = ${V.tex}$ です。${k === 2 ? 'ファイバーが $F$ の臨界点を通る $c = 0$ で対数的に尖りますが、$\\int_0^1 -\\ln c\\,dc = 1$ は有限です。' : ''}`]],
          set: V.st,
        };
      }
      if (form === 1) {
        const c = r.pick([1.05, 1.1, 1.2, 1.25, 1.3, 1.35]), q = PI * c / 2 - 2 * c * Math.acos(1 / c);
        return {
          q: [`$p$ is uniform on $[-1, 1]^2$ and $F = \\sqrt{x^2 + y^2}$. For $1 < c < \\sqrt2$ only part of the circle of radius $c$ lies in the square. Find $q(${c})$ to three decimals.`, `$p$ は $[-1, 1]^2$ 上の一様分布で、$F = \\sqrt{x^2 + y^2}$ です。$1 < c < \\sqrt2$ では半径 $c$ の円の一部だけが正方形の中にあります。$q(${c})$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: q, tol: 0.002 },
          hint: ['In each quadrant the circle is outside the square for angles within $\\arccos(1/c)$ of either axis.', '各象限で、どちらかの軸から角度 $\\arccos(1/c)$ 以内では円は正方形の外にあります。'],
          sol: [[`Per quadrant the arc inside runs over an angle $\\tfrac\\pi2 - 2\\arccos(1/c)$; with $\\arccos(1/${c}) = ${n(Math.acos(1 / c), 4)}$ the total length is $4c\\big(\\tfrac\\pi2 - 2\\arccos(1/c)\\big) = ${n(4 * c * (PI / 2 - 2 * Math.acos(1 / c)), 4)}$.`, `各象限で正方形の中の弧は角度 $\\tfrac\\pi2 - 2\\arccos(1/c)$ にわたります。$\\arccos(1/${c}) = ${n(Math.acos(1 / c), 4)}$ なので、全長は $4c\\big(\\tfrac\\pi2 - 2\\arccos(1/c)\\big) = ${n(4 * c * (PI / 2 - 2 * Math.acos(1 / c)), 4)}$ です。`], [`$q(${c}) = \\tfrac14\\cdot ${n(4 * c * (PI / 2 - 2 * Math.acos(1 / c)), 4)} = ${n(q, 4)}$, falling to $0$ at the corners $c = \\sqrt2$. The plane-count bars in the figure follow the same kink at $c = 1$.`, `$q(${c}) = \\tfrac14\\cdot ${n(4 * c * (PI / 2 - 2 * Math.acos(1 / c)), 4)} = ${n(q, 4)}$ で、角 $c = \\sqrt2$ で $0$ になります。図の平面で数えた棒も $c = 1$ で同じように折れ曲がります。`]],
          set: { map: 2, dist: 1 },
        };
      }
      const k = r.int(0, 1);
      if (k === 0) {
        const rr = r.step(-0.9, 0.9, 0.05);
        return {
          q: [`$(X, Y)$ is a standard bivariate Gaussian with correlation $r = ${n(rr)}$. The coarea formula gives $q$ for $F = xy$. What is $\\int c\\,q(c)\\,dc$?`, `$(X, Y)$ は相関 $r = ${n(rr)}$ の標準2変量ガウス分布です。余面積公式で $F = xy$ の $q$ が得られます。$\\int c\\,q(c)\\,dc$ はいくつですか。`],
          a: { type: 'num', v: rr, tol: 1e-6 + Math.abs(rr) * 0.003 },
          hint: ['$\\int g(c)\\,q(c)\\,dc = \\int g(F)\\,p\\,dA$: you never need $q$ itself.', '$\\int g(c)\\,q(c)\\,dc = \\int g(F)\\,p\\,dA$ なので、$q$ そのものは必要ありません。'],
          sol: [['With $g(c) = c$: $\\int c\\,q(c)\\,dc = \\int xy\\,p\\,dA = E[XY]$.', '$g(c) = c$ とすると $\\int c\\,q(c)\\,dc = \\int xy\\,p\\,dA = E[XY]$ です。'], [`For standard variables $E[XY] = r = ${n(rr)}$: the mean of the product distribution is the correlation, even though $q$ has a logarithmic spike at $0$. The readout's last line checks this.`, `標準化された変数では $E[XY] = r = ${n(rr)}$ です。$q$ は $0$ で対数的に尖りますが、積の分布の平均は相関に等しくなります。読み取り欄の最後の行で確かめられます。`]],
          set: { map: 3, dist: 0, r: rr },
        };
      }
      return {
        q: ['For the standard Gaussian and $F = \\sqrt{x^2 + y^2}$, what is $\\int c\\,q(c)\\,dc$, the mean distance from the origin? Give four decimals.', '標準ガウス分布と $F = \\sqrt{x^2 + y^2}$ について、原点からの距離の平均 $\\int c\\,q(c)\\,dc$ はいくつですか（小数第4位まで）。'],
        a: { type: 'num', v: Math.sqrt(PI / 2), tol: 6e-5, show: '\\sqrt{\\pi/2}' },
        hint: ['$q(c) = c\\,e^{-c^2/2}$; integrate $c^2 e^{-c^2/2}$ over $(0, \\infty)$.', '$q(c) = c\\,e^{-c^2/2}$ です。$c^2 e^{-c^2/2}$ を $(0, \\infty)$ で積分します。'],
        sol: [['$\\int_0^\\infty c^2 e^{-c^2/2}\\,dc$ is half of $\\int_{-\\infty}^{\\infty} c^2 e^{-c^2/2}\\,dc = \\sqrt{2\\pi}$.', '$\\int_0^\\infty c^2 e^{-c^2/2}\\,dc$ は $\\int_{-\\infty}^{\\infty} c^2 e^{-c^2/2}\\,dc = \\sqrt{2\\pi}$ の半分です。'], [`So the mean is $\\sqrt{\\pi/2} = ${n(Math.sqrt(PI / 2), 5)}$, which the readout also gets from $\\int F\\,p\\,dA$ on the plane.`, `よって平均は $\\sqrt{\\pi/2} = ${n(Math.sqrt(PI / 2), 5)}$ で、読み取り欄でも平面上の $\\int F\\,p\\,dA$ から同じ値が得られます。`]],
        set: { map: 2, dist: 0, r: 0 },
      };
    },
  ];
})();
