'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180;

  // 1. curvature of a plane curve
  Q.curvature = [
    (r) => {
      const R = r.pick([0.5, 2, 4, 5, 8, 10, 0.25]);
      return {
        q: [`A circle has radius $${n(R)}$. What is its curvature $\\kappa$?`, `半径 $${n(R)}$ の円の曲率 $\\kappa$ はいくつですか。`],
        a: { type: 'num', v: 1 / R },
        hint: ['The osculating circle of a circle is the circle itself.', '円の接触円は、その円自身です。'],
        sol: [[`A circle turns through $2\\pi$ in arc length $2\\pi R$, so its tangent turns at rate $1/R$.`, `円は弧長 $2\\pi R$ で接線が $2\\pi$ 回るので、接線の回転率は $1/R$ です。`], [`$\\kappa = 1/${n(R)} = ${n(1 / R)}$.`, `$\\kappa = 1/${n(R)} = ${n(1 / R)}$ です。`]],
      };
    },
    (r) => {
      const a = r.pick([0.5, 1, 1.5, 2, -1, -0.5, 3]), x0 = r.pick([0, 0.5, 1, -1, 2, -0.5]);
      const s = 2 * a * x0, k = 2 * a / (1 + s * s) ** 1.5;
      return {
        q: [`Find the signed curvature of $y = ${terms([[a, 'x^2']])}$ at $x = ${n(x0)}$. Give three decimals.`, `$y = ${terms([[a, 'x^2']])}$ の $x = ${n(x0)}$ における符号付き曲率を求めてください（小数第3位まで）。`],
        a: { type: 'num', v: k, tol: 6e-4 },
        hint: ['For a graph, $\\kappa = y\'\'/(1 + y\'^2)^{3/2}$.', 'グラフでは $\\kappa = y\'\'/(1 + y\'^2)^{3/2}$ です。'],
        sol: [[`$y' = ${n(2 * a)}x$, so $y'(${n(x0)}) = ${n(s)}$; $y'' = ${n(2 * a)}$.`, `$y' = ${n(2 * a)}x$ より $y'(${n(x0)}) = ${n(s)}$、$y'' = ${n(2 * a)}$ です。`], [`$\\kappa = \\dfrac{${n(2 * a)}}{(1 + ${n(s * s)})^{3/2}} = ${n(k, 4)}$.`, `$\\kappa = \\dfrac{${n(2 * a)}}{(1 + ${n(s * s)})^{3/2}} = ${n(k, 4)}$ です。`], ['The curvature is largest at the vertex, where the slope is zero, and decays as the parabola straightens.', '曲率は傾きが 0 の頂点で最大で、放物線がまっすぐになるにつれて小さくなります。']],
      };
    },
    (r) => {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const a = r.pick([1, 2, 3, 0.5, -1, -2]);
        return {
          q: [`Write the signed curvature $\\kappa(x)$ of the graph $y = ${terms([[a, 'x^3']])}$ as a function of $x$.`, `グラフ $y = ${terms([[a, 'x^3']])}$ の符号付き曲率 $\\kappa(x)$ を $x$ の式で表してください。`],
          a: { type: 'expr', v: `${6 * a}x/(1+(${3 * a}x^2)^2)^(3/2)`, vars: ['x'], dom: { x: [-1.5, 1.5] }, lhs: ['$\\kappa(x) =$', '$\\kappa(x) =$'] },
          hint: ['Use $\\kappa = y\'\'/(1 + y\'^2)^{3/2}$, then look at where it changes sign.', '$\\kappa = y\'\'/(1 + y\'^2)^{3/2}$ を使い、符号が変わる点にも注目してください。'],
          sol: [[`$y' = ${n(3 * a)}x^2$ and $y'' = ${n(6 * a)}x$.`, `$y' = ${n(3 * a)}x^2$、$y'' = ${n(6 * a)}x$ です。`], [`$\\kappa(x) = \\dfrac{${n(6 * a)}x}{\\left(1 + ${n(9 * a * a)}x^4\\right)^{3/2}}$.`, `$\\kappa(x) = \\dfrac{${n(6 * a)}x}{\\left(1 + ${n(9 * a * a)}x^4\\right)^{3/2}}$ です。`], ['It vanishes at $x = 0$, the inflection point, where the curve switches from bending one way to the other.', '$x = 0$ は変曲点で $\\kappa = 0$ となり、曲がる向きが入れ替わります。']],
        };
      }
      const a = r.pick([2, 3, 4, 5]), b = r.pick([1, 2, 3].filter((x) => x !== a));
      const kmax = Math.max(a / (b * b), b / (a * a)), kmin = Math.min(a / (b * b), b / (a * a));
      return {
        q: [`The ellipse $x = ${a}\\cos t,\\ y = ${b}\\sin t$. What is the ratio of its largest to its smallest curvature?`, `楕円 $x = ${a}\\cos t,\\ y = ${b}\\sin t$ の曲率の最大値と最小値の比を求めてください。`],
        a: { type: 'num', v: kmax / kmin, show: frac(Math.max(a, b) ** 3, Math.min(a, b) ** 3) },
        hint: ['$\\kappa = |x\'y\'\' - y\'x\'\'|/(x\'^2 + y\'^2)^{3/2}$; check the ends of each axis.', '$\\kappa = |x\'y\'\' - y\'x\'\'|/(x\'^2 + y\'^2)^{3/2}$ を各軸の端で調べてください。'],
        sol: [[`$x'y'' - y'x'' = ${a * b}$, so $\\kappa(t) = ${a * b}/(${a * a}\\sin^2 t + ${b * b}\\cos^2 t)^{3/2}$.`, `$x'y'' - y'x'' = ${a * b}$ なので $\\kappa(t) = ${a * b}/(${a * a}\\sin^2 t + ${b * b}\\cos^2 t)^{3/2}$ です。`], [`At $t = 0$: $\\kappa = ${a}/${b * b}$. At $t = \\pi/2$: $\\kappa = ${b}/${a * a}$.`, `$t = 0$ で $\\kappa = ${a}/${b * b}$、$t = \\pi/2$ で $\\kappa = ${b}/${a * a}$ です。`], [`The ratio is $(${Math.max(a, b)}/${Math.min(a, b)})^3 = ${frac(Math.max(a, b) ** 3, Math.min(a, b) ** 3)}$: the ends of the long axis bend hardest.`, `比は $(${Math.max(a, b)}/${Math.min(a, b)})^3 = ${frac(Math.max(a, b) ** 3, Math.min(a, b) ** 3)}$ で、長軸の端がいちばん強く曲がります。`]],
      };
    },
  ];

  // 2. geodesics on a torus, R = 2, r = 0.8
  const TR = 2, Tr = 0.8, rho = (v) => TR + Tr * Math.cos(v);
  Q['geodesic-surface'] = [
    (r) => {
      const v = r.pick([0, 30, 45, 60, 90, 120, 135, 150, 180, -60, -90]);
      return {
        q: [`On the torus with $R = 2$, $r = 0.8$, how far from the axis is the point at tube angle $v = ${v}^\\circ$? ($\\rho = R + r\\cos v$.)`, `$R = 2$、$r = 0.8$ のトーラスで、管の角度 $v = ${v}^\\circ$ の点は軸からどれだけ離れていますか（$\\rho = R + r\\cos v$）。`],
        a: { type: 'num', v: rho(rad(v)), tol: 0.002 },
        sol: [[`$\\rho = 2 + 0.8\\cos ${v}^\\circ = 2 + ${n(0.8 * Math.cos(rad(v)), 4)} = ${n(rho(rad(v)), 4)}$.`, `$\\rho = 2 + 0.8\\cos ${v}^\\circ = 2 + ${n(0.8 * Math.cos(rad(v)), 4)} = ${n(rho(rad(v)), 4)}$ です。`], ['The outer equator ($v = 0$) is farthest from the axis, at $2.8$; the inner equator ($v = 180^\\circ$) nearest, at $1.2$.', '外側の赤道 ($v = 0$) が最も遠く $2.8$、内側の赤道 ($v = 180^\\circ$) が最も近く $1.2$ です。']],
        set: { latitude: Math.max(-170, Math.min(170, v)) },
      };
    },
    (r) => {
      const v = r.step(-150, 150, 15), psi = r.step(-75, 75, 15);
      const c = rho(rad(v)) * Math.cos(rad(psi));
      return {
        q: [`A geodesic leaves the tube angle $v_0 = ${v}^\\circ$ at heading $\\psi = ${psi}^\\circ$ to the parallel. Find its Clairaut constant $c = \\rho\\cos\\psi$ ($R = 2$, $r = 0.8$).`, `測地線が管の角度 $v_0 = ${v}^\\circ$ から緯線と $\\psi = ${psi}^\\circ$ の向きで出発します。クレロー定数 $c = \\rho\\cos\\psi$ を求めてください（$R = 2$、$r = 0.8$）。`],
        a: { type: 'num', v: c, tol: 0.003 },
        hint: ['First find $\\rho(v_0) = R + r\\cos v_0$.', 'まず $\\rho(v_0) = R + r\\cos v_0$ を求めます。'],
        sol: [[`$\\rho(v_0) = 2 + 0.8\\cos ${v}^\\circ = ${n(rho(rad(v)), 4)}$.`, `$\\rho(v_0) = 2 + 0.8\\cos ${v}^\\circ = ${n(rho(rad(v)), 4)}$ です。`], [`$c = ${n(rho(rad(v)), 4)}\\cos ${psi}^\\circ = ${n(c, 4)}$.`, `$c = ${n(rho(rad(v)), 4)}\\cos ${psi}^\\circ = ${n(c, 4)}$ です。`], ['Clairaut: on a surface of revolution this product stays constant along every geodesic, which is what the readout\'s drift checks.', 'クレローの定理により、回転面上ではこの積がどの測地線に沿っても一定です。読み取り欄のずれはこれを確かめています。']],
        set: { latitude: v, heading: psi },
      };
    },
    (r) => {
      let v, psi, c;
      do { v = r.step(-60, 60, 15); psi = r.step(15, 60, 15); c = rho(rad(v)) * Math.cos(rad(psi)); } while (Math.abs(Math.abs(c) - (TR - Tr)) < 0.08);
      const trapped = Math.abs(c) > TR - Tr;
      const vb = trapped ? Math.acos((Math.abs(c) - TR) / Tr) * 180 / PI : null;
      if (trapped && r.chance(0.6)) {
        return {
          q: [`Start at $v_0 = ${v}^\\circ$ with heading $\\psi = ${psi}^\\circ$ ($R = 2$, $r = 0.8$). The geodesic cannot reach the inner equator. Between which tube angles $\\pm v_b$ does it oscillate? Give $v_b$ in degrees.`, `$v_0 = ${v}^\\circ$、$\\psi = ${psi}^\\circ$ で出発します（$R = 2$、$r = 0.8$）。この測地線は内側の赤道に届きません。管の角度 $\\pm v_b$ の間を振動するとき、$v_b$ を度で答えてください。`],
          a: { type: 'num', v: vb, tol: 0.15, unit: ['°', '°'] },
          hint: ['At the turning latitude the geodesic runs along the parallel, so $\\cos\\psi = \\pm 1$ there and $\\rho(v_b) = |c|$.', '折り返す緯度では測地線は緯線に沿うので $\\cos\\psi = \\pm 1$、すなわち $\\rho(v_b) = |c|$ です。'],
          sol: [[`$c = \\rho(v_0)\\cos\\psi = ${n(rho(rad(v)), 4)}\\cdot\\cos ${psi}^\\circ = ${n(c, 4)}$, and $|c| > R - r = 1.2$.`, `$c = \\rho(v_0)\\cos\\psi = ${n(rho(rad(v)), 4)}\\cdot\\cos ${psi}^\\circ = ${n(c, 4)}$ で、$|c| > R - r = 1.2$ です。`], [`Solve $2 + 0.8\\cos v_b = ${n(Math.abs(c), 4)}$: $\\cos v_b = ${n((Math.abs(c) - TR) / Tr, 4)}$.`, `$2 + 0.8\\cos v_b = ${n(Math.abs(c), 4)}$ を解くと $\\cos v_b = ${n((Math.abs(c) - TR) / Tr, 4)}$ です。`], [`$v_b = ${n(vb, 2)}^\\circ$. The geodesic is trapped in the band $|v| \\le v_b$ on the outer side.`, `$v_b = ${n(vb, 2)}^\\circ$ で、測地線は外側の帯 $|v| \\le v_b$ に閉じ込められます。`]],
          set: { latitude: v, heading: psi, arc: 1 },
        };
      }
      return {
        q: [`Start at $v_0 = ${v}^\\circ$ with heading $\\psi = ${psi}^\\circ$ on the torus $R = 2$, $r = 0.8$. Does the geodesic pass through the hole (reach the inner equator)?`, `トーラス $R = 2$、$r = 0.8$ 上で $v_0 = ${v}^\\circ$、$\\psi = ${psi}^\\circ$ で出発します。測地線は穴をくぐります（内側の赤道に届きます）か。`],
        a: { type: 'choice', opts: [['Yes: $|c| < R - r$, so it winds through the hole.', 'はい。$|c| < R - r$ なので穴をくぐります。'], ['No: $|c| > R - r$, so it stays on the outer side.', 'いいえ。$|c| > R - r$ なので外側にとどまります。']], v: trapped ? 1 : 0, fixed: true },
        hint: ['Compare the Clairaut constant $|c|$ with the inner radius $R - r = 1.2$.', 'クレロー定数 $|c|$ と内側の半径 $R - r = 1.2$ を比べてください。'],
        sol: [[`$c = \\rho(v_0)\\cos\\psi = ${n(rho(rad(v)), 4)}\\cos ${psi}^\\circ = ${n(c, 4)}$.`, `$c = \\rho(v_0)\\cos\\psi = ${n(rho(rad(v)), 4)}\\cos ${psi}^\\circ = ${n(c, 4)}$ です。`], ['Along the geodesic $\\rho\\cos\\psi = c$ and $|\\cos\\psi| \\le 1$, so it can only visit latitudes where $\\rho \\ge |c|$.', '測地線に沿って $\\rho\\cos\\psi = c$ で $|\\cos\\psi| \\le 1$ なので、$\\rho \\ge |c|$ の緯度にしか行けません。'], [trapped ? `$|c| = ${n(Math.abs(c), 3)} > 1.2$, so the inner equator ($\\rho = 1.2$) is out of reach.` : `$|c| = ${n(Math.abs(c), 3)} < 1.2$, so every latitude is allowed and the geodesic winds through the hole.`, trapped ? `$|c| = ${n(Math.abs(c), 3)} > 1.2$ なので、内側の赤道 ($\\rho = 1.2$) には届きません。` : `$|c| = ${n(Math.abs(c), 3)} < 1.2$ なのですべての緯度に行け、測地線は穴をくぐります。`]],
        set: { latitude: v, heading: psi, arc: 1 },
      };
    },
  ];

  // 3. Gaussian curvature of a graph
  Q.gaussian = [
    (r) => {
      const a = r.pick([1, 2, -1, 3, 0.5]), b = r.pick([1, -1, 2, -2, 0, 0.5, -3]);
      const K = a * b;
      return {
        q: [`What is the Gaussian curvature at the origin of $z = \\tfrac12(${terms([[a, 'x^2'], [b, 'y^2']])})$?`, `$z = \\tfrac12(${terms([[a, 'x^2'], [b, 'y^2']])})$ の原点におけるガウス曲率はいくつですか。`],
        a: { type: 'num', v: K },
        hint: ['At a critical point of a graph, $K = f_{xx}f_{yy} - f_{xy}^2$.', 'グラフの臨界点では $K = f_{xx}f_{yy} - f_{xy}^2$ です。'],
        sol: [[`At the origin the gradient vanishes, so $E = G = 1$, $F = 0$ and $L, M, N$ are the second derivatives.`, `原点では勾配が 0 なので $E = G = 1$、$F = 0$ で、$L, M, N$ は2階導関数そのものです。`], [`$f_{xx} = ${n(a)}$, $f_{yy} = ${n(b)}$, $f_{xy} = 0$, so $K = ${n(K)}$: ${K > 0 ? 'a bowl' : K < 0 ? 'a saddle' : 'flat in one direction'}.`, `$f_{xx} = ${n(a)}$、$f_{yy} = ${n(b)}$、$f_{xy} = 0$ より $K = ${n(K)}$ で、${K > 0 ? '鉢型' : K < 0 ? '鞍型' : '一方向に平ら'}です。`]],
        set: a === 1 && Math.abs(b) <= 1 ? { saddle: -b } : undefined,
      };
    },
    (r) => {
      let b = 0; while (b === 0) b = r.step(-1, 1, 0.25);
      const x = r.step(-1, 1, 0.25), y = r.step(-1, 1, 0.25);
      const K = b / (1 + x * x + b * b * y * y) ** 2;
      return {
        q: [`On $z = \\tfrac12(${terms([[1, 'x^2'], [b, 'y^2']])})$, find $K$ at $(x, y) = (${n(x)}, ${n(y)})$. Give four decimals.`, `$z = \\tfrac12(${terms([[1, 'x^2'], [b, 'y^2']])})$ 上の点 $(x, y) = (${n(x)}, ${n(y)})$ における $K$ を求めてください（小数第4位まで）。`],
        a: { type: 'num', v: K, tol: 6e-5 },
        hint: ['For a graph $z = f(x, y)$, $K = (f_{xx}f_{yy} - f_{xy}^2)/(1 + f_x^2 + f_y^2)^2$.', 'グラフ $z = f(x, y)$ では $K = (f_{xx}f_{yy} - f_{xy}^2)/(1 + f_x^2 + f_y^2)^2$ です。'],
        sol: [[`$f_x = x = ${n(x)}$, $f_y = ${n(b)}y = ${n(b * y)}$, $f_{xx}f_{yy} - f_{xy}^2 = ${n(b)}$.`, `$f_x = x = ${n(x)}$、$f_y = ${n(b)}y = ${n(b * y)}$、$f_{xx}f_{yy} - f_{xy}^2 = ${n(b)}$ です。`], [`$K = \\dfrac{${n(b)}}{(1 + ${n(x * x)} + ${n(b * b * y * y)})^2} = ${n(K, 5)}$.`, `$K = \\dfrac{${n(b)}}{(1 + ${n(x * x)} + ${n(b * b * y * y)})^2} = ${n(K, 5)}$ です。`], ['Away from the origin the surface tilts and $K$ shrinks toward zero, but its sign is the sign of $b$ everywhere.', '原点から離れると曲面が傾いて $K$ は 0 に近づきますが、符号は至るところ $b$ の符号です。']],
        set: Math.abs(b) <= 1 ? { saddle: -b } : undefined,
      };
    },
    (r) => {
      let a, b, c;
      do { a = r.int(-3, 3); b = r.int(-3, 3); c = r.int(-2, 2); } while (c === 0 && r.chance(0.7) || (a === 0 && b === 0));
      const tr = a + b, det = a * b - c * c, disc = Math.sqrt(tr * tr - 4 * det);
      const k1 = (tr + disc) / 2, k2 = (tr - disc) / 2;
      const f = terms([[a / 2 === Math.round(a / 2) ? a / 2 : a / 2, 'x^2'], [c, 'xy'], [b / 2, 'y^2']]);
      return {
        q: [`For $z = ${f}$, find the principal curvatures $\\kappa_1 \\ge \\kappa_2$ at the origin.`, `$z = ${f}$ の原点における主曲率 $\\kappa_1 \\ge \\kappa_2$ を求めてください。`],
        a: { type: 'tuple', v: [k1, k2], labels: ['$\\kappa_1$', '$\\kappa_2$'], tol: 0.002 },
        hint: ['At the origin the shape operator is the Hessian; its eigenvalues are the principal curvatures.', '原点では形作用素はヘッセ行列そのもので、その固有値が主曲率です。'],
        sol: [[`The Hessian is $\\begin{pmatrix} ${a} & ${c} \\\\ ${c} & ${b} \\end{pmatrix}$, with trace $${tr}$ and determinant $${det}$.`, `ヘッセ行列は $\\begin{pmatrix} ${a} & ${c} \\\\ ${c} & ${b} \\end{pmatrix}$ で、跡は $${tr}$、行列式は $${det}$ です。`], [`$\\kappa = \\tfrac12\\left(${tr} \\pm \\sqrt{${tr * tr} - 4\\cdot(${det})}\\right)$, so $\\kappa_1 = ${n(k1, 4)}$, $\\kappa_2 = ${n(k2, 4)}$.`, `$\\kappa = \\tfrac12\\left(${tr} \\pm \\sqrt{${tr * tr} - 4\\cdot(${det})}\\right)$ より $\\kappa_1 = ${n(k1, 4)}$、$\\kappa_2 = ${n(k2, 4)}$ です。`], [`Check: $K = \\kappa_1\\kappa_2 = ${det}$ and $H = (\\kappa_1 + \\kappa_2)/2 = ${n(tr / 2)}$. ${det > 0 ? 'Same signs: an elliptic point.' : det < 0 ? 'Opposite signs: a hyperbolic (saddle) point.' : 'One is zero: a parabolic point.'}`, `確認：$K = \\kappa_1\\kappa_2 = ${det}$、$H = (\\kappa_1 + \\kappa_2)/2 = ${n(tr / 2)}$。${det > 0 ? '同符号なので楕円点です。' : det < 0 ? '異符号なので双曲点（鞍点）です。' : '一方が 0 なので放物点です。'}`]],
      };
    },
  ];
})();
