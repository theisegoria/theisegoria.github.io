'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, mat, terms } = P.util;
  const PI = Math.PI;
  const r2 = (x) => Math.round(x * 100) / 100;

  /* ---------------- 1. the linear spiral  x' = ax - y, y' = x + ay ---------------- */
  const TYPES = [['stable spiral', '安定渦状点'], ['unstable spiral', '不安定渦状点'], ['centre', '中心'], ['saddle', '鞍点'], ['stable node', '安定結節点'], ['unstable node', '不安定結節点']];
  function classify(tr, det) {
    if (det < 0) return 3;
    const disc = tr * tr - 4 * det;
    if (Math.abs(tr) < 1e-12) return 2;
    if (disc < 0) return tr < 0 ? 0 : 1;
    return tr < 0 ? 4 : 5;
  }
  Q.phase = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.step(-0.5, 0.5, 0.05);
        const k = Math.abs(a) < 1e-9 ? 2 : a < 0 ? 0 : 1;
        return {
          q: [`For $\\dot x = ${n(a)}x - y$, $\\dot y = x + ${n(a)}y$, what kind of equilibrium is the origin?`, `$\\dot x = ${n(a)}x - y$、$\\dot y = x + ${n(a)}y$ で、原点はどの種類の平衡点ですか。`.replace('+ -', '- ')].map((s) => s.replace(/\+ -/g, '- ')),
          a: { type: 'choice', v: k, opts: [TYPES[0], TYPES[1], TYPES[2], TYPES[3]] },
          hint: ['The eigenvalues of $\\begin{pmatrix} a & -1 \\\\ 1 & a \\end{pmatrix}$ are $a \\pm i$. Look at the real part.', '$\\begin{pmatrix} a & -1 \\\\ 1 & a \\end{pmatrix}$ の固有値は $a \\pm i$ です。実部を見てください。'],
          sol: [[`The eigenvalues are $${n(a)} \\pm i$: the imaginary part makes trajectories turn, the real part $${n(a)}$ makes them ${a < 0 ? 'shrink' : a > 0 ? 'grow' : 'keep their radius'}.`, `固有値は $${n(a)} \\pm i$ です。虚部が軌道を回転させ、実部 $${n(a)}$ が軌道を${a < 0 ? '縮め' : a > 0 ? '広げ' : 'そのままの半径に保ち'}ます。`], [`So the origin is a${k === 2 ? '' : 'n'} ${TYPES[k][0]}${k === 2 ? ': every orbit is a closed circle' : ''}.`, `したがって原点は${TYPES[k][1]}です${k === 2 ? '。どの軌道も閉じた円になります' : ''}。`]],
          set: { a },
        };
      }
      if (form === 1) {
        const a = r.step(-0.5, 0.5, 0.05), f = Math.exp(2 * PI * a);
        return {
          q: [`With growth rate $a = ${n(a)}$, by what factor does the distance from the origin change during one full turn?`, `増大率 $a = ${n(a)}$ のとき、1周する間に原点からの距離は何倍になりますか。`],
          a: { type: 'num', v: f, tol: 5e-4 * Math.max(1, f) },
          hint: ['$z(t) = e^{(a + i)t}z(0)$, and one turn takes $t = 2\\pi$.', '$z(t) = e^{(a + i)t}z(0)$ で、1周には $t = 2\\pi$ かかります。'],
          sol: [['$|z(t)| = e^{at}|z(0)|$: the rotation $e^{it}$ has modulus $1$.', '$|z(t)| = e^{at}|z(0)|$ です。回転 $e^{it}$ の絶対値は $1$ だからです。'], [`After $t = 2\\pi$: $e^{2\\pi\\cdot ${n(a)}} = ${n(f, 4)}$. ${a < 0 ? 'Below 1, so the spiral winds in.' : a > 0 ? 'Above 1, so the spiral winds out.' : 'Exactly 1: a closed orbit.'}`, `$t = 2\\pi$ 後は $e^{2\\pi\\cdot ${n(a)}} = ${n(f, 4)}$ です。${a < 0 ? '1 より小さいので、らせんは内側へ巻き込みます。' : a > 0 ? '1 より大きいので、らせんは外側へ広がります。' : 'ちょうど 1 なので閉じた軌道です。'}`]],
          set: { a },
        };
      }
      const a = r.step(-0.5, 0.5, 0.05), t = r.pick([1, 2, 3, PI]);
      let x0, y0; do { x0 = r.step(-2, 2, 0.5); y0 = r.step(-2, 2, 0.5); } while (x0 === 0 && y0 === 0);
      const r0 = Math.hypot(x0, y0);
      const tT = t === PI ? '\\pi' : String(t), rt = r0 * Math.exp(a * t);
      return {
        q: [`Start at $(${n(x0)}, ${n(y0)})$ with $a = ${n(a)}$. How far from the origin is the solution at $t = ${tT}$?`, `$a = ${n(a)}$ で $(${n(x0)}, ${n(y0)})$ から出発します。$t = ${tT}$ での解の原点からの距離はいくつですか。`],
        a: { type: 'num', v: rt, tol: 2e-3 * Math.max(1, rt) },
        hint: ['The radius obeys $\\dot r = ar$, whatever the angle does.', '角度がどうであれ、半径は $\\dot r = ar$ に従います。'],
        sol: [[`$|z(0)| = \\sqrt{${n(x0 * x0 + y0 * y0)}} = ${n(r0, 4)}$.`, `$|z(0)| = \\sqrt{${n(x0 * x0 + y0 * y0)}} = ${n(r0, 4)}$ です。`], [`$|z(${tT})| = ${n(r0, 4)}\\,e^{${n(a)}\\cdot ${tT}} = ${n(rt, 4)}$: the envelope $\\pm|z(0)|e^{at}$ in the right panel.`, `$|z(${tT})| = ${n(r0, 4)}\\,e^{${n(a)}\\cdot ${tT}} = ${n(rt, 4)}$ で、右の図の包絡線 $\\pm|z(0)|e^{at}$ の値です。`]],
        set: { a, x: x0, y: y0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let A, tr, det, k; do { A = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)]; tr = A[0] + A[3]; det = A[0] * A[3] - A[1] * A[2]; k = classify(tr, det); } while (det === 0 || (tr * tr - 4 * det === 0) || (k === 2 && r.chance(0.6)));
        const disc = tr * tr - 4 * det;
        const opts = TYPES.slice();
        return {
          q: [`Classify the origin for $\\dot{\\mathbf x} = ${mat([[A[0], A[1]], [A[2], A[3]]])}\\mathbf x$.`, `$\\dot{\\mathbf x} = ${mat([[A[0], A[1]], [A[2], A[3]]])}\\mathbf x$ の原点を分類してください。`],
          a: { type: 'choice', v: k, opts },
          hint: ['Use the trace $\\tau$, the determinant $\\Delta$ and the discriminant $\\tau^2 - 4\\Delta$.', '跡 $\\tau$、行列式 $\\Delta$、判別式 $\\tau^2 - 4\\Delta$ を使ってください。'],
          sol: [[`$\\tau = ${tr}$, $\\Delta = ${det}$, $\\tau^2 - 4\\Delta = ${disc}$.`, `$\\tau = ${tr}$、$\\Delta = ${det}$、$\\tau^2 - 4\\Delta = ${disc}$ です。`], [det < 0 ? 'A negative determinant means real eigenvalues of opposite signs: a saddle.' : disc < 0 ? `Complex eigenvalues $${n(tr / 2)} \\pm ${n(Math.sqrt(-disc) / 2, 4)}i$; ${tr === 0 ? 'zero real part gives a centre.' : tr < 0 ? 'negative real part gives a stable spiral.' : 'positive real part gives an unstable spiral.'}` : `Real eigenvalues of the same sign as $\\tau$: a${tr < 0 ? ' stable' : 'n unstable'} node.`, det < 0 ? '行列式が負なので、固有値は異符号の実数で、鞍点です。' : disc < 0 ? `固有値は複素数 $${n(tr / 2)} \\pm ${n(Math.sqrt(-disc) / 2, 4)}i$ で、${tr === 0 ? '実部が 0 なので中心です。' : tr < 0 ? '実部が負なので安定渦状点です。' : '実部が正なので不安定渦状点です。'}` : `固有値は $\\tau$ と同符号の実数なので、${tr < 0 ? '安定' : '不安定'}結節点です。`]],
        };
      }
      if (form === 1) {
        let a; do { a = r.step(-0.5, 0.5, 0.05); } while (Math.abs(a) < 0.04);
        const t = Math.LN2 / Math.abs(a);
        return {
          q: [`With $a = ${n(a)}$, how long does it take the distance from the origin to ${a < 0 ? 'halve' : 'double'}?`, `$a = ${n(a)}$ のとき、原点からの距離が${a < 0 ? '半分' : '2倍'}になるまでの時間はいくらですか。`],
          a: { type: 'num', v: t, tol: 2e-3 * t, show: `\\tfrac{\\ln 2}{${n(Math.abs(a))}}` },
          hint: ['$|z(t)| = |z(0)|e^{at}$. Set the factor equal to ' + (a < 0 ? '$1/2$' : '$2$') + '.', '$|z(t)| = |z(0)|e^{at}$ です。倍率を ' + (a < 0 ? '$1/2$' : '$2$') + ' とおいてください。'],
          sol: [[`$e^{${n(a)}t} = ${a < 0 ? '1/2' : '2'}$ gives $t = \\ln 2/${n(Math.abs(a))} = ${n(t, 4)}$.`, `$e^{${n(a)}t} = ${a < 0 ? '1/2' : '2'}$ より $t = \\ln 2/${n(Math.abs(a))} = ${n(t, 4)}$ です。`], [`That is $${n(t / (2 * PI), 3)}$ turns, since one turn takes $2\\pi$. It does not depend on where the solution starts.`, `1周に $2\\pi$ かかるので、これは $${n(t / (2 * PI), 3)}$ 周です。出発点にはよりません。`]],
          set: { a },
        };
      }
      let A, tr, det, disc; do { A = [r.int(-4, 4), r.int(-5, 5), r.int(-5, 5), r.int(-4, 4)]; tr = A[0] + A[3]; det = A[0] * A[3] - A[1] * A[2]; disc = tr * tr - 4 * det; } while (disc >= 0);
      const re = tr / 2, im = Math.sqrt(-disc) / 2;
      return {
        q: [`Find the eigenvalues $\\lambda = \\alpha \\pm i\\beta$ ($\\beta > 0$) of $${mat([[A[0], A[1]], [A[2], A[3]]])}$.`, `$${mat([[A[0], A[1]], [A[2], A[3]]])}$ の固有値 $\\lambda = \\alpha \\pm i\\beta$（$\\beta > 0$）を求めてください。`],
        a: { type: 'tuple', v: [re, im], labels: ['$\\alpha$', '$\\beta$'], tol: 2e-3 },
        hint: ['$\\lambda^2 - \\tau\\lambda + \\Delta = 0$ with $\\tau$ the trace and $\\Delta$ the determinant.', '$\\tau$ を跡、$\\Delta$ を行列式として $\\lambda^2 - \\tau\\lambda + \\Delta = 0$ です。'],
        sol: [[`$\\tau = ${tr}$, $\\Delta = ${det}$, so $\\lambda = \\tfrac12\\left(${tr} \\pm \\sqrt{${disc}}\\right)$.`, `$\\tau = ${tr}$、$\\Delta = ${det}$ なので $\\lambda = \\tfrac12\\left(${tr} \\pm \\sqrt{${disc}}\\right)$ です。`], [`$\\alpha = ${n(re)}$, $\\beta = \\sqrt{${-disc}}/2 = ${n(im, 4)}$: trajectories turn with angular speed $${n(im, 4)}$ and their size changes like $e^{${n(re)}t}$, ${re < 0 ? 'a stable' : re > 0 ? 'an unstable' : 'a neutral'} spiral${re === 0 ? ' (a centre)' : ''}.`, `$\\alpha = ${n(re)}$、$\\beta = \\sqrt{${-disc}}/2 = ${n(im, 4)}$ です。軌道は角速度 $${n(im, 4)}$ で回り、大きさは $e^{${n(re)}t}$ のように変わります。${re < 0 ? '安定渦状点' : re > 0 ? '不安定渦状点' : '中心'}です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.step(-0.5, 0.5, 0.05), comp = r.int(0, 1);
        let x0, y0; do { x0 = r.step(-2, 2, 0.5); y0 = r.step(-2, 2, 0.5); } while (x0 === 0 && y0 === 0);
        const v = comp === 0 ? `exp(${a}*t)*(${x0}*cos(t)-(${y0})*sin(t))` : `exp(${a}*t)*(${x0}*sin(t)+(${y0})*cos(t))`;
        const tex = comp === 0 ? `e^{${n(a)}t}\\left(${terms([[x0, '\\cos t'], [-y0, '\\sin t']])}\\right)` : `e^{${n(a)}t}\\left(${terms([[x0, '\\sin t'], [y0, '\\cos t']])}\\right)`;
        return {
          q: [`Solve $\\dot x = ${n(a)}x - y$, $\\dot y = x + ${n(a)}y$ with $x(0) = ${n(x0)}$, $y(0) = ${n(y0)}$. Give $${comp ? 'y' : 'x'}(t)$.`.replace(/\+ -/g, '- '), `$\\dot x = ${n(a)}x - y$、$\\dot y = x + ${n(a)}y$ を $x(0) = ${n(x0)}$、$y(0) = ${n(y0)}$ で解き、$${comp ? 'y' : 'x'}(t)$ を答えてください。`.replace(/\+ -/g, '- ')],
          a: { type: 'expr', v, vars: ['t'], dom: { t: [0, 3] }, lhs: [`$${comp ? 'y' : 'x'}(t) =$`, `$${comp ? 'y' : 'x'}(t) =$`] },
          hint: ['Put $z = x + iy$: the system is $\\dot z = (a + i)z$, so $z(t) = e^{at}e^{it}z(0)$. Take the real or imaginary part.', '$z = x + iy$ とおくと系は $\\dot z = (a + i)z$ で、$z(t) = e^{at}e^{it}z(0)$ です。実部か虚部をとってください。'],
          sol: [[`$z(t) = e^{${n(a)}t}(\\cos t + i\\sin t)(${n(x0)} ${y0 < 0 ? '-' : '+'} ${n(Math.abs(y0))}i)$.`, `$z(t) = e^{${n(a)}t}(\\cos t + i\\sin t)(${n(x0)} ${y0 < 0 ? '-' : '+'} ${n(Math.abs(y0))}i)$ です。`], [`${comp ? 'Imaginary' : 'Real'} part: $${comp ? 'y' : 'x'}(t) = ${tex}$.`, `${comp ? '虚部' : '実部'}をとると $${comp ? 'y' : 'x'}(t) = ${tex}$ です。`], ['A rotation at unit angular speed inside the envelope $\\pm|z(0)|e^{at}$, which is exactly the right panel of the figure.', '包絡線 $\\pm|z(0)|e^{at}$ の中での角速度 1 の回転で、図の右のパネルそのものです。']],
          set: { a, x: x0, y: y0 },
        };
      }
      if (form === 1) {
        const r0 = r.pick([1, 2, 1.5, 0.5]), ratio = r.pick([0.5, 0.25, 0.1, 2, 3, 0.8, 1.5]);
        const a = Math.log(ratio) / (2 * PI);
        const aSet = Math.round(a * 20) / 20;
        return {
          q: [`A solution of $\\dot x = ax - y$, $\\dot y = x + ay$ starts at distance $${n(r0)}$ from the origin and is at distance $${n(r0 * ratio)}$ after one full turn. Find $a$.`, `$\\dot x = ax - y$、$\\dot y = x + ay$ の解が原点から距離 $${n(r0)}$ で出発し、1周後に距離 $${n(r0 * ratio)}$ にあります。$a$ を求めてください。`],
          a: { type: 'num', v: a, tol: 5e-4, show: `\\tfrac{\\ln ${n(ratio)}}{2\\pi}` },
          hint: ['One turn takes time $2\\pi$ whatever $a$ is, and the radius is multiplied by $e^{2\\pi a}$.', '$a$ によらず1周には時間 $2\\pi$ かかり、半径は $e^{2\\pi a}$ 倍になります。'],
          sol: [[`$e^{2\\pi a} = ${n(r0 * ratio)}/${n(r0)} = ${n(ratio)}$.`, `$e^{2\\pi a} = ${n(r0 * ratio)}/${n(r0)} = ${n(ratio)}$ です。`], [`$a = \\ln(${n(ratio)})/(2\\pi) = ${n(a, 4)}$. The starting radius drops out: only the ratio matters, because the system is linear.`, `$a = \\ln(${n(ratio)})/(2\\pi) = ${n(a, 4)}$ です。系が線形なので出発時の半径は消え、比だけが効きます。`]],
          set: Math.abs(aSet) <= 0.5 ? { a: aSet } : undefined,
        };
      }
      const w = r.pick([1, 2, 3]), c = r.pick([0.5, 1, 2, 3, 4, 5, 6, 0]), at = r.int(0, 1);
      const disc = c * c - 4 * w * w;
      const k = at === 1 ? 3 : (c === 0 ? 2 : disc < 0 ? 0 : 4);
      return {
        q: [`The damped pendulum $\\dot\\theta = \\omega$, $\\dot\\omega = -${w * w}\\sin\\theta - ${n(c)}\\omega$ has equilibria at $(0, 0)$ and $(\\pi, 0)$. Classify ${at ? '$(\\pi, 0)$, the inverted position' : '$(0, 0)$, the hanging position'} by linearising.`.replace('- 0\\omega', ''), `減衰振り子 $\\dot\\theta = \\omega$、$\\dot\\omega = -${w * w}\\sin\\theta - ${n(c)}\\omega$ は $(0, 0)$ と $(\\pi, 0)$ に平衡点をもちます。線形化して${at ? '倒立した位置 $(\\pi, 0)$' : '吊り下がった位置 $(0, 0)$'}を分類してください。`.replace('- 0\\omega', '')],
        a: { type: 'choice', v: { 0: 0, 2: 1, 3: 2, 4: 3 }[k], opts: [TYPES[0], TYPES[2], TYPES[3], TYPES[4], TYPES[1]] },
        hint: ['The Jacobian is $\\begin{pmatrix} 0 & 1 \\\\ -' + (w * w) + '\\cos\\theta & -' + n(c) + ' \\end{pmatrix}$; $\\cos\\pi = -1$ flips the sign of the determinant.', 'ヤコビ行列は $\\begin{pmatrix} 0 & 1 \\\\ -' + (w * w) + '\\cos\\theta & -' + n(c) + ' \\end{pmatrix}$ です。$\\cos\\pi = -1$ で行列式の符号が反転します。'],
        sol: [[`At ${at ? '$(\\pi, 0)$' : '$(0, 0)$'}: $\\tau = ${n(-c)}$, $\\Delta = ${at ? -w * w : w * w}$.`, `${at ? '$(\\pi, 0)$' : '$(0, 0)$'} では $\\tau = ${n(-c)}$、$\\Delta = ${at ? -w * w : w * w}$ です。`], [at ? 'A negative determinant: real eigenvalues of opposite signs, a saddle. The inverted pendulum falls away along the unstable direction, whatever the damping.' : c === 0 ? 'Zero trace and positive determinant: a centre, undamped oscillation. (For the nonlinear pendulum this survives because energy is conserved.)' : disc < 0 ? `$\\tau^2 - 4\\Delta = ${n(disc)} < 0$: decaying oscillation, a stable spiral.` : `$\\tau^2 - 4\\Delta = ${n(disc)} \\ge 0$: overdamped, a stable node, with no oscillation.`, at ? '行列式が負なので、固有値は異符号の実数で、鞍点です。減衰の大きさによらず、倒立振り子は不安定な方向に沿って倒れます。' : c === 0 ? '跡が 0 で行列式が正なので中心で、減衰しない振動です（非線形の振り子でもエネルギー保存によりこれが保たれます）。' : disc < 0 ? `$\\tau^2 - 4\\Delta = ${n(disc)} < 0$ なので、減衰振動する安定渦状点です。` : `$\\tau^2 - 4\\Delta = ${n(disc)} \\ge 0$ なので過減衰で、振動しない安定結節点です。`]],
      };
    },
  ];

  /* ---------------- 2. saddle-node  x' = mu - x^2 ---------------- */
  Q.bifurcation = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mu = r.pick([-1, -0.5, -0.25, 0, 0.25, 1, 1.5, 2, -0.75, 0.5]);
        const k = mu > 0 ? 2 : mu === 0 ? 1 : 0;
        return {
          q: [`How many equilibria does $\\dot x = ${n(mu)} - x^2$ have?`.replace('= 0 - x^2', '= -x^2'), `$\\dot x = ${n(mu)} - x^2$ の平衡点はいくつありますか。`.replace('= 0 - x^2', '= -x^2')],
          a: { type: 'int', v: k },
          hint: ['Equilibria solve $x^2 = \\mu$.', '平衡点は $x^2 = \\mu$ の解です。'],
          sol: [[mu > 0 ? `$x^2 = ${n(mu)}$ has two real roots $\\pm${n(Math.sqrt(mu), 4)}$.` : mu === 0 ? '$x^2 = 0$ has the single double root $0$.' : `$x^2 = ${n(mu)}$ has no real root.`, mu > 0 ? `$x^2 = ${n(mu)}$ は2つの実根 $\\pm${n(Math.sqrt(mu), 4)}$ をもちます。` : mu === 0 ? '$x^2 = 0$ は重根 $0$ を1つだけもちます。' : `$x^2 = ${n(mu)}$ は実根をもちません。`], [`So ${k} equilibri${k === 1 ? 'um' : 'a'}: ${mu > 0 ? 'the parabola crosses the axis twice' : mu === 0 ? 'the parabola just touches the axis, the fold' : 'the parabola stays below the axis'}.`, `したがって平衡点は ${k} 個です。${mu > 0 ? '放物線は軸と2回交わります。' : mu === 0 ? '放物線はちょうど軸に接し、これが折り返し点です。' : '放物線は軸の下にとどまります。'}`]],
          set: { mu },
        };
      }
      if (form === 1) {
        const mu = r.step(0.1, 2, 0.05);
        return {
          q: [`For $\\mu = ${n(mu)}$, where is the stable equilibrium of $\\dot x = \\mu - x^2$?`, `$\\mu = ${n(mu)}$ のとき、$\\dot x = \\mu - x^2$ の安定な平衡点はどこですか。`],
          a: { type: 'num', v: Math.sqrt(mu), tol: 1e-3, show: `\\sqrt{${n(mu)}}` },
          hint: ['Of $\\pm\\sqrt\\mu$, the stable one has $f\'(x_*) = -2x_* < 0$.', '$\\pm\\sqrt\\mu$ のうち安定なのは $f\'(x_*) = -2x_* < 0$ となる方です。'],
          sol: [[`The equilibria are $\\pm\\sqrt{${n(mu)}} = \\pm${n(Math.sqrt(mu), 4)}$.`, `平衡点は $\\pm\\sqrt{${n(mu)}} = \\pm${n(Math.sqrt(mu), 4)}$ です。`], [`$f'(x) = -2x$ is negative at $+${n(Math.sqrt(mu), 4)}$: nearby points flow towards it. The other one repels.`, `$f'(x) = -2x$ は $+${n(Math.sqrt(mu), 4)}$ で負なので、近くの点はそこへ流れ込みます。もう一方は反発します。`]],
          set: { mu },
        };
      }
      const mu = r.step(-1, 2, 0.25), x = r.step(-2, 2, 0.5);
      const f = mu - x * x, k = Math.abs(f) < 1e-12 ? 2 : f > 0 ? 0 : 1;
      return {
        q: [`For $\\dot x = \\mu - x^2$ with $\\mu = ${n(mu)}$, a point starts at $x = ${n(x)}$. Which way does it move?`, `$\\mu = ${n(mu)}$ の $\\dot x = \\mu - x^2$ で、点が $x = ${n(x)}$ から出発します。どちらへ動きますか。`],
        a: { type: 'choice', fixed: true, v: k, opts: [['Right (increasing)', '右（増加）'], ['Left (decreasing)', '左（減少）'], ['It stays: it is an equilibrium', '動かない（平衡点）']] },
        hint: ['Only the sign of $\\dot x$ at the starting point matters.', '出発点での $\\dot x$ の符号だけが問題です。'],
        sol: [[`$\\dot x = ${n(mu)} - ${n(x * x)} = ${n(f)}$.`, `$\\dot x = ${n(mu)} - ${n(x * x)} = ${n(f)}$ です。`], [k === 2 ? 'Zero: the point is an equilibrium.' : `${f > 0 ? 'Positive' : 'Negative'}, so $x$ ${f > 0 ? 'increases' : 'decreases'}, following the arrows on the phase line.`, k === 2 ? '0 なので、その点は平衡点です。' : `${f > 0 ? '正' : '負'}なので $x$ は${f > 0 ? '増加' : '減少'}し、相直線上の矢印に従います。`]],
        set: { mu },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mu = r.step(0.1, 2, 0.05), tau = 1 / (2 * Math.sqrt(mu));
        return {
          q: [`Near the stable equilibrium of $\\dot x = ${n(mu)} - x^2$, a small perturbation decays like $e^{-t/\\tau}$. Find $\\tau$.`, `$\\dot x = ${n(mu)} - x^2$ の安定な平衡点の近くで、小さな摂動は $e^{-t/\\tau}$ のように減衰します。$\\tau$ を求めてください。`],
          a: { type: 'num', v: tau, tol: 1e-3 * Math.max(1, tau), show: `\\tfrac{1}{2\\sqrt{${n(mu)}}}` },
          hint: ['Linearise: $\\dot\\xi = f\'(x_*)\\xi$ with $\\xi = x - x_*$.', '線形化します。$\\xi = x - x_*$ として $\\dot\\xi = f\'(x_*)\\xi$ です。'],
          sol: [[`$x_* = \\sqrt{${n(mu)}}$ and $f'(x_*) = -2\\sqrt{${n(mu)}} = ${n(-2 * Math.sqrt(mu), 4)}$.`, `$x_* = \\sqrt{${n(mu)}}$、$f'(x_*) = -2\\sqrt{${n(mu)}} = ${n(-2 * Math.sqrt(mu), 4)}$ です。`], [`$\\tau = 1/|f'(x_*)| = ${n(tau, 4)}$. As $\\mu \\to 0$ the time constant grows without bound: the approach to the fold is critical slowing down.`, `$\\tau = 1/|f'(x_*)| = ${n(tau, 4)}$ です。$\\mu \\to 0$ で時定数は限りなく大きくなります。折り返し点に近づくときの臨界減速です。`]],
          set: { mu },
        };
      }
      if (form === 1) {
        const kind = r.int(0, 1), mu = r.pick([-2, -1, -0.5, 0.5, 1, 2, 3, 4]);
        if (kind === 0) {
          const stable = mu > 0 ? 1 : 0;
          return {
            q: [`For the transcritical normal form $\\dot x = ${terms([[mu, 'x'], [-1, 'x^2']])}$, which equilibrium is stable?`, `トランスクリティカル分岐の標準形 $\\dot x = ${terms([[mu, 'x'], [-1, 'x^2']])}$ で、安定な平衡点はどれですか。`],
            a: { type: 'choice', v: stable, opts: [['$x = 0$', '$x = 0$'], [`$x = ${n(mu)}$`, `$x = ${n(mu)}$`], ['Both', '両方'], ['Neither', 'どちらでもない']] },
            hint: ['$f(x) = \\mu x - x^2$, $f\'(x) = \\mu - 2x$. Evaluate at each equilibrium.', '$f(x) = \\mu x - x^2$、$f\'(x) = \\mu - 2x$ です。それぞれの平衡点で評価してください。'],
            sol: [[`$f'(0) = ${n(mu)}$ and $f'(${n(mu)}) = ${n(-mu)}$.`, `$f'(0) = ${n(mu)}$、$f'(${n(mu)}) = ${n(-mu)}$ です。`], [`The negative one is stable: $x = ${stable ? n(mu) : '0'}$. The two equilibria pass through each other at $\\mu = 0$ and exchange stability, instead of being created or destroyed as in the saddle-node.`, `負の方が安定なので $x = ${stable ? n(mu) : '0'}$ です。2つの平衡点は $\\mu = 0$ ですれ違って安定性を交換します。サドルノード分岐のように生まれたり消えたりはしません。`]],
          };
        }
        const k = mu > 0 ? 3 : 1;
        return {
          q: [`How many equilibria does the pitchfork $\\dot x = ${terms([[mu, 'x'], [-1, 'x^3']])}$ have?`, `ピッチフォーク分岐 $\\dot x = ${terms([[mu, 'x'], [-1, 'x^3']])}$ の平衡点はいくつありますか。`],
          a: { type: 'int', v: k },
          hint: ['Factor: $x(\\mu - x^2) = 0$.', '因数分解すると $x(\\mu - x^2) = 0$ です。'],
          sol: [[`$x = 0$ always, and $x = \\pm\\sqrt{\\mu}$ when $\\mu > 0$.`, `$x = 0$ は常に解で、$\\mu > 0$ なら $x = \\pm\\sqrt{\\mu}$ も解です。`], [mu > 0 ? `With $\\mu = ${n(mu)}$: three equilibria, $0$ (now unstable, $f'(0) = ${n(mu)}$) and $\\pm${n(Math.sqrt(mu), 4)}$ (stable).` : `With $\\mu = ${n(mu)} < 0$: only $x = 0$, stable since $f'(0) = ${n(mu)} < 0$.`, mu > 0 ? `$\\mu = ${n(mu)}$ では平衡点は3つで、$0$（$f'(0) = ${n(mu)}$ なので不安定）と $\\pm${n(Math.sqrt(mu), 4)}$（安定）です。` : `$\\mu = ${n(mu)} < 0$ では $x = 0$ だけで、$f'(0) = ${n(mu)} < 0$ なので安定です。`]],
        };
      }
      const b = r.nz(-4, 4);
      const muC = -b * b / 4;
      return {
        q: [`For $\\dot x = \\mu ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x - x^2$, at what value of $\\mu$ do the two equilibria collide and disappear?`, `$\\dot x = \\mu ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x - x^2$ で、2つの平衡点が衝突して消えるのは $\\mu$ がいくつのときですか。`],
        a: { type: 'num', v: muC, tol: 1e-6 },
        hint: ['At a fold both $f = 0$ and $f\' = 0$. Or complete the square.', '折り返し点では $f = 0$ と $f\' = 0$ が同時に成り立ちます。平方完成でも求まります。'],
        sol: [[`$f'(x) = ${b} - 2x = 0$ gives $x = ${n(b / 2)}$.`, `$f'(x) = ${b} - 2x = 0$ より $x = ${n(b / 2)}$ です。`], [`$f(${n(b / 2)}) = \\mu + ${n(b * b / 4)} = 0$ gives $\\mu_c = ${n(muC)}$.`, `$f(${n(b / 2)}) = \\mu + ${n(b * b / 4)} = 0$ より $\\mu_c = ${n(muC)}$ です。`], [`Completing the square, $\\dot x = (\\mu + ${n(b * b / 4)}) - (x - ${n(b / 2)})^2$: the same saddle-node, shifted.`, `平方完成すると $\\dot x = (\\mu + ${n(b * b / 4)}) - (x - ${n(b / 2)})^2$ で、同じサドルノード分岐をずらしたものです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mu = r.pick([-0.01, -0.04, -0.25, -0.09, -0.16, -0.0025, -1, -0.5, -0.36, -0.64]);
        const Tb = PI / Math.sqrt(-mu);
        return {
          q: [`Just past the fold, $\\dot x = ${n(mu)} - x^2$ has no equilibrium, but solutions crawl through a bottleneck near $x = 0$. How long does a solution take to fall from $x = +\\infty$ to $x = -\\infty$? That is, find $T = \\int_{-\\infty}^{\\infty} dx/(x^2 + |\\mu|)$.`, `折り返し点を少し越えると、$\\dot x = ${n(mu)} - x^2$ には平衡点がありませんが、解は $x = 0$ の近くのボトルネックをゆっくり通り抜けます。解が $x = +\\infty$ から $x = -\\infty$ まで落ちるのにかかる時間 $T = \\int_{-\\infty}^{\\infty} dx/(x^2 + |\\mu|)$ を求めてください。`],
          a: { type: 'num', v: Tb, tol: 1e-3 * Tb, show: `\\tfrac{\\pi}{\\sqrt{${n(-mu)}}}` },
          hint: ['$dt = dx/\\dot x$, and $\\int dx/(x^2 + c^2) = \\tfrac1c\\arctan(x/c)$.', '$dt = dx/\\dot x$ で、$\\int dx/(x^2 + c^2) = \\tfrac1c\\arctan(x/c)$ です。'],
          sol: [[`$|\\mu| = ${n(-mu)}$, so $c = \\sqrt{${n(-mu)}} = ${n(Math.sqrt(-mu), 4)}$.`, `$|\\mu| = ${n(-mu)}$ なので $c = \\sqrt{${n(-mu)}} = ${n(Math.sqrt(-mu), 4)}$ です。`], [`$T = \\tfrac1c[\\arctan(x/c)]_{-\\infty}^{\\infty} = \\pi/c = ${n(Tb, 4)}$.`, `$T = \\tfrac1c[\\arctan(x/c)]_{-\\infty}^{\\infty} = \\pi/c = ${n(Tb, 4)}$ です。`], ['Almost all of it is spent near $x = 0$, where the ghost of the vanished equilibria still slows the flow. $T \\propto |\\mu|^{-1/2}$ is the signature of a saddle-node.', 'その時間のほとんどは $x = 0$ の近くで費やされます。消えた平衡点の名残りが流れを遅くするのです。$T \\propto |\\mu|^{-1/2}$ はサドルノード分岐の特徴です。']],
          set: mu >= -1 && Math.abs(mu * 20 - Math.round(mu * 20)) < 1e-9 ? { mu } : undefined,
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 0.5, 3]), b = r.pick([1, 2, 3, 0.5].filter((x) => x !== a));
        const xs = Math.log(b / a) / b, muC = a * xs + a / b;
        return {
          q: [`The system $\\dot x = \\mu - ${n(a)}x - e^{-${b === 1 ? '' : n(b)}x}$ has a saddle-node bifurcation. Find the critical $\\mu_c$.`.replace('- 1x', '- x'), `系 $\\dot x = \\mu - ${n(a)}x - e^{-${b === 1 ? '' : n(b)}x}$ はサドルノード分岐をもちます。臨界値 $\\mu_c$ を求めてください。`.replace('- 1x', '- x')],
          a: { type: 'num', v: muC, tol: 1e-4 },
          hint: ['Solve $f = 0$ and $f\' = 0$ together: the line $\\mu - ax$ must be tangent to the curve $e^{-bx}$.', '$f = 0$ と $f\' = 0$ を連立して解きます。直線 $\\mu - ax$ が曲線 $e^{-bx}$ に接する条件です。'],
          sol: [[`$f'(x) = -${n(a)} + ${n(b)}e^{-${n(b)}x} = 0$ gives $e^{-${n(b)}x_*} = ${n(a / b, 4)}$, $x_* = \\ln(${n(b / a, 4)})/${n(b)} = ${n(xs, 4)}$.`, `$f'(x) = -${n(a)} + ${n(b)}e^{-${n(b)}x} = 0$ より $e^{-${n(b)}x_*} = ${n(a / b, 4)}$、$x_* = \\ln(${n(b / a, 4)})/${n(b)} = ${n(xs, 4)}$ です。`], [`$f(x_*) = 0$: $\\mu_c = ${a === 1 ? '' : n(a)}x_* + e^{-${n(b)}x_*} = ${n(a * xs, 4)} + ${n(a / b, 4)} = ${n(muC, 4)}$.`, `$f(x_*) = 0$ より $\\mu_c = ${a === 1 ? '' : n(a)}x_* + e^{-${n(b)}x_*} = ${n(a * xs, 4)} + ${n(a / b, 4)} = ${n(muC, 4)}$ です。`], [`For $\\mu > \\mu_c$ the line cuts the exponential twice (two equilibria); below, it misses it. Near the fold $f \\approx (\\mu - \\mu_c) - c(x - x_*)^2$: the normal form of the figure.`, `$\\mu > \\mu_c$ では直線は指数関数と2回交わり（平衡点2つ）、それより下では交わりません。折り返し点の近くでは $f \\approx (\\mu - \\mu_c) - c(x - x_*)^2$ となり、図の標準形になります。`]],
        };
      }
      const mu = r.pick([1, 4, 0.25, 9, 2, 0.5]);
      const s = Math.sqrt(mu);
      const sT = Number.isInteger(s) || s === 0.5 ? n(s) : `\\sqrt{${n(mu)}}`;
      return {
        q: [`Solve $\\dot x = ${n(mu)} - x^2$ with $x(0) = 0$.`, `$\\dot x = ${n(mu)} - x^2$ を $x(0) = 0$ で解いてください。`],
        a: { type: 'expr', v: `${s}*tanh(${s}*t)`, vars: ['t'], dom: { t: [0, 2] }, lhs: ['$x(t) =$', '$x(t) =$'] },
        hint: ['Separate variables: $dx/(\\mu - x^2) = dt$, and $\\int dx/(c^2 - x^2) = \\tfrac1c\\operatorname{artanh}(x/c)$.', '変数分離します。$dx/(\\mu - x^2) = dt$ で、$\\int dx/(c^2 - x^2) = \\tfrac1c\\operatorname{artanh}(x/c)$ です。'],
        sol: [[`With $c = ${sT}$: $\\tfrac1c\\operatorname{artanh}(x/c) = t$.`, `$c = ${sT}$ とすると $\\tfrac1c\\operatorname{artanh}(x/c) = t$ です。`], [`$x(t) = ${sT}\\tanh(${sT}\\,t)$.`, `$x(t) = ${sT}\\tanh(${sT}\\,t)$ です。`], [`It rises from $0$ and settles on the stable equilibrium $${sT}$, approaching it like $e^{-2${sT === '1' ? '' : sT}t}$, as the linearisation predicts.`, `$0$ から上がって安定な平衡点 $${sT}$ に落ち着き、線形化の予言どおり $e^{-2${sT === '1' ? '' : sT}t}$ のように近づきます。`]],
        set: mu <= 2 ? { mu } : undefined,
      };
    },
  ];

  /* ---------------- 3. the logistic map ---------------- */
  const lg = (r, x) => r * x * (1 - x);
  Q.chaos = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rr = r.step(2, 4, 0.1), x = r.step(0.1, 0.9, 0.05);
        const y = lg(rr, x);
        return {
          q: [`For the logistic map with $r = ${n(rr)}$, what is $x_1$ when $x_0 = ${n(x)}$?`, `$r = ${n(rr)}$ のロジスティック写像で、$x_0 = ${n(x)}$ のとき $x_1$ はいくつですか。`],
          a: { type: 'num', v: y, tol: 1e-4 },
          sol: [[`$x_1 = ${n(rr)}\\cdot ${n(x)}\\cdot(1 - ${n(x)}) = ${n(rr)}\\cdot ${n(x)}\\cdot ${n(1 - x)}$.`, `$x_1 = ${n(rr)}\\cdot ${n(x)}\\cdot(1 - ${n(x)}) = ${n(rr)}\\cdot ${n(x)}\\cdot ${n(1 - x)}$ です。`], [`$x_1 = ${n(y, 4)}$: the first step of the cobweb, straight up from $x_0$ to the parabola.`, `$x_1 = ${n(y, 4)}$ です。クモの巣図の最初の一歩で、$x_0$ から放物線までまっすぐ上がります。`]],
          set: { r: rr, x },
        };
      }
      if (form === 1) {
        const rr = r.step(2, 4, 0.05), fp = 1 - 1 / rr;
        return {
          q: [`Find the non-zero fixed point of $x \\mapsto ${n(rr)}x(1 - x)$.`, `$x \\mapsto ${n(rr)}x(1 - x)$ の 0 でない不動点を求めてください。`],
          a: { type: 'num', v: fp, tol: 1e-4, show: `1 - \\tfrac{1}{${n(rr)}}` },
          hint: ['Solve $x = rx(1 - x)$ and divide by $x$.', '$x = rx(1 - x)$ を解き、$x$ で割ってください。'],
          sol: [[`$1 = ${n(rr)}(1 - x)$, so $x^* = 1 - 1/${n(rr)} = ${n(fp, 4)}$.`, `$1 = ${n(rr)}(1 - x)$ より $x^* = 1 - 1/${n(rr)} = ${n(fp, 4)}$ です。`], ['It is where the parabola crosses the diagonal, marked by the hollow circle in the cobweb.', 'これは放物線が対角線と交わる点で、クモの巣図の白抜きの丸で示されています。']],
          set: { r: rr },
        };
      }
      let rr; do { rr = r.step(2, 4, 0.05); } while (Math.abs(rr - 3) < 1e-9);
      const m = 2 - rr, st = Math.abs(m) < 1;
      return {
        q: [`Is the fixed point $x^* = 1 - 1/r$ of the logistic map stable at $r = ${n(rr)}$?`, `$r = ${n(rr)}$ のとき、ロジスティック写像の不動点 $x^* = 1 - 1/r$ は安定ですか。`],
        a: { type: 'choice', fixed: true, v: st ? 0 : 1, opts: [['Yes: $|f\'(x^*)| < 1$', 'はい。$|f\'(x^*)| < 1$'], ['No: $|f\'(x^*)| > 1$', 'いいえ。$|f\'(x^*)| > 1$']] },
        hint: ['$f\'(x) = r(1 - 2x)$; evaluate it at $x^* = 1 - 1/r$.', '$f\'(x) = r(1 - 2x)$ を $x^* = 1 - 1/r$ で評価してください。'],
        sol: [[`$f'(x^*) = r(1 - 2 + 2/r) = 2 - r = ${n(m)}$.`, `$f'(x^*) = r(1 - 2 + 2/r) = 2 - r = ${n(m)}$ です。`], [st ? 'Its size is below 1, so errors shrink each step: the orbit settles on the fixed point.' : 'Its size exceeds 1, so errors grow, alternating in sign: the orbit leaves the fixed point and, just past $r = 3$, settles on a 2-cycle.', st ? '大きさが 1 より小さいので誤差は毎回縮み、軌道は不動点に落ち着きます。' : '大きさが 1 を超えるので誤差は符号を変えながら大きくなり、軌道は不動点を離れます。$r = 3$ を少し越えたところでは周期2の軌道に落ち着きます。']],
        set: { r: rr },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rr = r.step(2.5, 4, 0.1), x = r.step(0.1, 0.9, 0.05);
        const x1 = lg(rr, x), x2 = lg(rr, x1);
        return {
          q: [`With $r = ${n(rr)}$ and $x_0 = ${n(x)}$, compute $x_2$. Give four decimals.`, `$r = ${n(rr)}$、$x_0 = ${n(x)}$ のとき $x_2$ を求めてください（小数第4位まで）。`],
          a: { type: 'num', v: x2, tol: 6e-5 },
          hint: ['Apply $x \\mapsto rx(1 - x)$ twice.', '$x \\mapsto rx(1 - x)$ を2回適用してください。'],
          sol: [[`$x_1 = ${n(rr)}\\cdot ${n(x)}\\cdot ${n(1 - x)} = ${n(x1, 6)}$.`, `$x_1 = ${n(rr)}\\cdot ${n(x)}\\cdot ${n(1 - x)} = ${n(x1, 6)}$ です。`], [`$x_2 = ${n(rr)}\\cdot ${n(x1, 6)}\\cdot ${n(1 - x1, 6)} = ${n(x2, 5)}$.`, `$x_2 = ${n(rr)}\\cdot ${n(x1, 6)}\\cdot ${n(1 - x1, 6)} = ${n(x2, 5)}$ です。`], ['Each step is one stair of the cobweb: up to the parabola, across to the diagonal.', '各ステップはクモの巣図の階段一段分で、放物線まで上がり、対角線まで横に移ります。']],
          set: { r: rr, x },
        };
      }
      if (form === 1) {
        const lam = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, Math.LN2]), eps = r.pick([1e-6, 1e-8, 1e-10, 1e-3]), D = r.pick([0.1, 0.5]);
        const nn = Math.log(D / eps) / lam;
        const lT = lam === Math.LN2 ? '\\ln 2' : n(lam);
        return {
          q: [`A chaotic map has Lyapunov exponent $\\lambda = ${lT}$. Two orbits start $${n(eps)}$ apart. Roughly after how many iterations are they $${n(D)}$ apart?`, `カオス的な写像のリャプノフ指数が $\\lambda = ${lT}$ です。2つの軌道が $${n(eps)}$ だけ離れて出発します。およそ何回の反復で $${n(D)}$ だけ離れますか。`],
          a: { type: 'num', v: nn, rel: 0.03 },
          hint: ['Small separations grow like $\\delta_n \\approx \\delta_0 e^{\\lambda n}$.', '小さな差は $\\delta_n \\approx \\delta_0 e^{\\lambda n}$ のように大きくなります。'],
          sol: [[`$${n(eps)}\\,e^{${lT}\\,n} = ${n(D)}$ gives $n = \\ln(${n(D / eps)})/${lT}$.`, `$${n(eps)}\\,e^{${lT}\\,n} = ${n(D)}$ より $n = \\ln(${n(D / eps)})/${lT}$ です。`], [`$n \\approx ${n(nn, 3)}$. Each factor of 10 in initial precision buys only $\\ln 10/\\lambda = ${n(Math.LN10 / lam, 3)}$ more steps of prediction: that is why chaos defeats long-range forecasting.`, `$n \\approx ${n(nn, 3)}$ です。初期精度を10倍にしても、予測できる回数は $\\ln 10/\\lambda = ${n(Math.LN10 / lam, 3)}$ 回しか増えません。カオスが長期予測を不可能にするのはこのためです。`]],
        };
      }
      const rr = r.step(2, 4, 0.05);
      const m = 2 - rr;
      return {
        q: [`At $r = ${n(rr)}$, what is the multiplier $f'(x^*)$ of the non-zero fixed point of the logistic map?`, `$r = ${n(rr)}$ のとき、ロジスティック写像の 0 でない不動点の乗数 $f'(x^*)$ はいくつですか。`],
        a: { type: 'num', v: m, tol: 1e-6 },
        hint: ['$x^* = 1 - 1/r$ and $f\'(x) = r(1 - 2x)$.', '$x^* = 1 - 1/r$、$f\'(x) = r(1 - 2x)$ です。'],
        sol: [[`$f'(x^*) = r\\left(1 - 2 + \\tfrac2r\\right) = 2 - r = ${n(m)}$.`, `$f'(x^*) = r\\left(1 - 2 + \\tfrac2r\\right) = 2 - r = ${n(m)}$ です。`], [Math.abs(m) < 1 ? `$|${n(m)}| < 1$: nearby orbits converge${m < 0 ? ', overshooting alternately (the cobweb spirals in)' : ' monotonically (a staircase)'}.` : `$|${n(m)}| > 1$: the fixed point repels, and since the multiplier is below $-1$ the orbit flips from side to side.`, Math.abs(m) < 1 ? `$|${n(m)}| < 1$ なので近くの軌道は収束します${m < 0 ? '。交互に行き過ぎながら近づきます（クモの巣が渦を巻いて入る）' : '。単調に近づきます（階段状）'}。` : `$|${n(m)}| > 1$ なので不動点は反発し、乗数が $-1$ より小さいので軌道は左右に跳び移ります。`]],
        set: { r: rr },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rr = r.step(3.05, 3.4, 0.05);
        const s = Math.sqrt((rr - 3) * (rr + 1)), p = (rr + 1 + s) / (2 * rr), q = (rr + 1 - s) / (2 * rr);
        return {
          q: [`At $r = ${n(rr)}$ the logistic map has an attracting 2-cycle $\\{p, q\\}$. Find $p > q$. Give four decimals.`, `$r = ${n(rr)}$ のロジスティック写像は吸引的な周期2軌道 $\\{p, q\\}$ をもちます。$p > q$ を求めてください（小数第4位まで）。`],
          a: { type: 'tuple', v: [p, q], labels: ['$p$', '$q$'], tol: 1e-4 },
          hint: ['Solve $f(f(x)) = x$; after removing the fixed points $0$ and $1 - 1/r$, a quadratic is left: $r^2x^2 - r(r + 1)x + (r + 1) = 0$.', '$f(f(x)) = x$ を解きます。不動点 $0$ と $1 - 1/r$ を取り除くと、2次方程式 $r^2x^2 - r(r + 1)x + (r + 1) = 0$ が残ります。'],
          sol: [[`$x = \\dfrac{(r + 1) \\pm \\sqrt{(r - 3)(r + 1)}}{2r}$, real only for $r \\ge 3$.`, `$x = \\dfrac{(r + 1) \\pm \\sqrt{(r - 3)(r + 1)}}{2r}$ で、実数になるのは $r \\ge 3$ のときだけです。`], [`With $r = ${n(rr)}$: $\\sqrt{${n((rr - 3) * (rr + 1), 4)}} = ${n(s, 5)}$, so $p = ${n(p, 5)}$, $q = ${n(q, 5)}$.`, `$r = ${n(rr)}$ では $\\sqrt{${n((rr - 3) * (rr + 1), 4)}} = ${n(s, 5)}$ なので $p = ${n(p, 5)}$、$q = ${n(q, 5)}$ です。`], ['The cycle is born out of the fixed point at $r = 3$, where $p = q = 2/3$: the first period doubling of the orbit diagram.', 'この周期軌道は $r = 3$ で不動点から生まれ、そこでは $p = q = 2/3$ です。軌道図の最初の周期倍分岐です。']],
          set: { r: rr },
        };
      }
      if (form === 1) {
        if (r.chance(0.5)) {
          const rr = r.step(3.05, 3.55, 0.05), mult = 4 + 2 * rr - rr * rr;
          return {
            q: [`The multiplier of the logistic 2-cycle is $\\mu_2 = f'(p)f'(q) = 4 + 2r - r^2$. At $r = ${n(rr)}$, is the 2-cycle stable?`, `ロジスティック写像の周期2軌道の乗数は $\\mu_2 = f'(p)f'(q) = 4 + 2r - r^2$ です。$r = ${n(rr)}$ で周期2軌道は安定ですか。`],
            a: { type: 'choice', fixed: true, v: Math.abs(mult) < 1 ? 0 : 1, opts: [['Yes: $|\\mu_2| < 1$', 'はい。$|\\mu_2| < 1$'], ['No: $|\\mu_2| > 1$, so it gives way to a 4-cycle', 'いいえ。$|\\mu_2| > 1$ なので周期4に移る']] },
            hint: ['Evaluate $\\mu_2$ and compare its size with $1$.', '$\\mu_2$ を計算し、その大きさを $1$ と比べてください。'],
            sol: [[`$\\mu_2 = 4 + ${n(2 * rr)} - ${n(rr * rr, 4)} = ${n(mult, 4)}$.`, `$\\mu_2 = 4 + ${n(2 * rr)} - ${n(rr * rr, 4)} = ${n(mult, 4)}$ です。`], [`${Math.abs(mult) < 1 ? 'Stable.' : 'Unstable.'} $\\mu_2$ falls through $-1$ at $r = 1 + \\sqrt6 \\approx 3.449$, where the 2-cycle period-doubles into a 4-cycle.`, `${Math.abs(mult) < 1 ? '安定です。' : '不安定です。'}$\\mu_2$ は $r = 1 + \\sqrt6 \\approx 3.449$ で $-1$ を下回り、そこで周期2軌道が周期倍分岐して周期4になります。`]],
            set: { r: rr },
          };
        }
        return {
          q: ['The 2-cycle multiplier of the logistic map is $\\mu_2 = 4 + 2r - r^2$. At which $r$ does the 2-cycle lose stability by period doubling?', 'ロジスティック写像の周期2軌道の乗数は $\\mu_2 = 4 + 2r - r^2$ です。周期2軌道が周期倍分岐で安定性を失うのは $r$ がいくつのときですか。'],
          a: { type: 'num', v: 1 + Math.sqrt(6), tol: 1e-4, show: '1 + \\sqrt6' },
          hint: ['Period doubling happens when the multiplier passes through $-1$.', '周期倍分岐は乗数が $-1$ を通過するときに起こります。'],
          sol: [['$4 + 2r - r^2 = -1$ gives $r^2 - 2r - 5 = 0$.', '$4 + 2r - r^2 = -1$ より $r^2 - 2r - 5 = 0$ です。'], ['$r = 1 + \\sqrt6 \\approx 3.4495$ (the positive root above 3). The next doublings come ever faster, their spacing shrinking by Feigenbaum\'s factor $4.669\\ldots$, and accumulate at $r \\approx 3.5699$, where chaos begins.', '$r = 1 + \\sqrt6 \\approx 3.4495$（3 より大きい正の根）です。次の倍分岐はどんどん速く起こり、間隔はファイゲンバウム定数 $4.669\\ldots$ の比で縮んで $r \\approx 3.5699$ に集積し、そこでカオスが始まります。']],
          set: { r: 3.45 },
        };
      }
      const m = r.pick([5, 7, 9, 11, 13]), k = r.int(1, 4);
      const x0 = Math.sin(PI / m) ** 2, xk = Math.sin((2 ** k) * PI / m) ** 2;
      return {
        q: [`At $r = 4$ the substitution $x = \\sin^2\\theta$ turns the logistic map into $\\theta \\mapsto 2\\theta$. Starting from $x_0 = \\sin^2(\\pi/${m})$, find $x_${k}$. Give five decimals.`, `$r = 4$ では置換 $x = \\sin^2\\theta$ によりロジスティック写像は $\\theta \\mapsto 2\\theta$ になります。$x_0 = \\sin^2(\\pi/${m})$ から始めて $x_${k}$ を求めてください（小数第5位まで）。`],
        a: { type: 'num', v: xk, tol: 6e-6 },
        hint: ['$4\\sin^2\\theta(1 - \\sin^2\\theta) = (2\\sin\\theta\\cos\\theta)^2 = \\sin^2 2\\theta$.', '$4\\sin^2\\theta(1 - \\sin^2\\theta) = (2\\sin\\theta\\cos\\theta)^2 = \\sin^2 2\\theta$ です。'],
        sol: [[`Each step doubles the angle, so $x_${k} = \\sin^2(${2 ** k}\\pi/${m})$.`, `各ステップで角度が2倍になるので $x_${k} = \\sin^2(${2 ** k}\\pi/${m})$ です。`], [`$x_${k} = ${n(xk, 6)}$.`, `$x_${k} = ${n(xk, 6)}$ です。`], [`Doubling an angle doubles any error in it, so $\\lambda = \\ln 2$ at $r = 4$. Because $2^j\\pi/${m}$ eventually repeats modulo $\\pi$, this particular orbit is periodic, but an error of $10^{-6}$ in $x_0$ would destroy it within about $20$ steps.`, `角度を2倍にすると誤差も2倍になるので、$r = 4$ では $\\lambda = \\ln 2$ です。$2^j\\pi/${m}$ は $\\pi$ を法としていずれ繰り返すので、この軌道は周期的ですが、$x_0$ に $10^{-6}$ の誤差があれば約 $20$ ステップで崩れます。`]],
        set: { r: 4, x: Math.min(0.9, Math.max(0.05, Math.round(x0 * 100) / 100)) },
      };
    },
  ];
})();
