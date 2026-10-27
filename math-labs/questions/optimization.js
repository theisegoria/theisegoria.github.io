'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const onGrid = (x, lo, hi, step) => x >= lo - 1e-9 && x <= hi + 1e-9 && Math.abs((x - lo) / step - Math.round((x - lo) / step)) < 1e-6;
  const ETAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

  /* ---------- 1. gradient descent on f = (x^2 + kappa y^2)/2 ---------- */
  Q.descent = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(2, 6), eta = r.pick(ETAS.filter((e) => e * k < 2)), x0 = r.pick([2, 3, -2, 1, 4]), y0 = r.pick([1, -1, 2, 0.5]);
        const x1 = (1 - eta) * x0, y1 = (1 - eta * k) * y0;
        return {
          q: [`Take one gradient step with $\\eta = ${n(eta)}$ on $f = \\tfrac12(x^2 + ${k}y^2)$ from $(${n(x0)}, ${n(y0)})$. Where do you land?`, `$f = \\tfrac12(x^2 + ${k}y^2)$ 上で、$(${n(x0)}, ${n(y0)})$ から $\\eta = ${n(eta)}$ の勾配ステップを一回とります。どこに着きますか。`],
          a: { type: 'tuple', v: [x1, y1], labels: ['$x_1$', '$y_1$'], tol: 1e-6 },
          hint: ['$\\nabla f = (x, \\kappa y)$, and the step is $x_{n+1} = x_n - \\eta\\nabla f(x_n)$.', '$\\nabla f = (x, \\kappa y)$ で、ステップは $x_{n+1} = x_n - \\eta\\nabla f(x_n)$ です。'],
          sol: [[`$\\nabla f(${n(x0)}, ${n(y0)}) = (${n(x0)}, ${n(k * y0)})$.`, `$\\nabla f(${n(x0)}, ${n(y0)}) = (${n(x0)}, ${n(k * y0)})$ です。`], [`$x_1 = ${n(x0)} - ${n(eta)}\\cdot ${n(x0)} = ${n(x1)}$ and $y_1 = ${n(y0)} - ${n(eta)}\\cdot ${n(k * y0)} = ${n(y1)}$.`, `$x_1 = ${n(x0)} - ${n(eta)}\\cdot ${n(x0)} = ${n(x1)}$、$y_1 = ${n(y0)} - ${n(eta)}\\cdot ${n(k * y0)} = ${n(y1)}$ です。`], [`Each coordinate is simply multiplied: $x$ by $1 - \\eta = ${n(1 - eta)}$, $y$ by $1 - \\eta\\kappa = ${n(1 - eta * k)}$.${1 - eta * k < 0 ? ' The negative factor makes $y$ jump across the valley floor.' : ''}`, `各座標は単に掛けられるだけです。$x$ は $1 - \\eta = ${n(1 - eta)}$ 倍、$y$ は $1 - \\eta\\kappa = ${n(1 - eta * k)}$ 倍です。${1 - eta * k < 0 ? '倍率が負なので、$y$ は谷底を飛び越えます。' : ''}`]],
          set: { k, eta },
        };
      }
      if (form === 1) {
        const k = r.int(2, 10);
        return {
          q: [`For $f = \\tfrac12(x^2 + ${k}y^2)$, what is the largest constant step size $\\eta$ for which gradient descent still converges from every start?`, `$f = \\tfrac12(x^2 + ${k}y^2)$ について、どの始点からでも勾配降下法が収束する一定の刻み幅 $\\eta$ の上限はいくつですか。`],
          a: { type: 'num', v: 2 / k, show: frac(2, k) },
          hint: ['Both multipliers $1 - \\eta$ and $1 - \\eta\\kappa$ must have magnitude below 1.', '二つの倍率 $1 - \\eta$ と $1 - \\eta\\kappa$ の絶対値がどちらも 1 未満でなければなりません。'],
          sol: [[`$|1 - \\eta${k}| < 1$ means $0 < \\eta < 2/${k}$; $|1 - \\eta| < 1$ only needs $\\eta < 2$.`, `$|1 - ${k}\\eta| < 1$ は $0 < \\eta < 2/${k}$ を意味し、$|1 - \\eta| < 1$ は $\\eta < 2$ を求めるだけです。`], [`So $\\eta < ${frac(2, k)}$: the steepest direction, curvature $${k}$, sets the limit for the whole problem.`, `したがって $\\eta < ${frac(2, k)}$ です。曲率 $${k}$ の最も急な方向が、問題全体の上限を決めます。`]],
          set: onGrid(2 / k - 0.02, 0.02, 0.8, 0.02) ? { k, eta: Number((2 / k - 0.02).toFixed(2)) } : { k },
        };
      }
      const k = r.int(2, 10), eta = r.pick(ETAS), m = 1 - eta * k;
      return {
        q: [`On $f = \\tfrac12(x^2 + ${k}y^2)$ with step $\\eta = ${n(eta)}$, by what factor is the $y$ coordinate multiplied each step?`, `$f = \\tfrac12(x^2 + ${k}y^2)$ 上で刻み幅 $\\eta = ${n(eta)}$ のとき、$y$ 座標は毎ステップ何倍されますか。`],
        a: { type: 'num', v: m, tol: 1e-9 },
        hint: ['$\\partial f/\\partial y = \\kappa y$.', '$\\partial f/\\partial y = \\kappa y$ です。'],
        sol: [[`$y_{n+1} = y_n - \\eta\\kappa y_n = (1 - ${n(eta)}\\cdot ${k})y_n = ${n(m)}\\,y_n$.`, `$y_{n+1} = y_n - \\eta\\kappa y_n = (1 - ${n(eta)}\\cdot ${k})y_n = ${n(m)}\\,y_n$ です。`], [Math.abs(m) >= 1 ? `$|${n(m)}| \\ge 1$: the $y$ coordinate ${Math.abs(m) > 1 ? 'grows' : 'never shrinks'}, so the iteration does not converge.` : m < 0 ? `The factor is negative but smaller than 1 in size: $y$ zigzags across the valley while shrinking.` : 'The factor is in $(0, 1)$: $y$ shrinks steadily without overshooting.', Math.abs(m) >= 1 ? `$|${n(m)}| \\ge 1$ なので $y$ 座標は${Math.abs(m) > 1 ? '増大し' : '縮まず'}、反復は収束しません。` : m < 0 ? '倍率は負ですが絶対値は 1 より小さいので、$y$ は谷を横切ってジグザグしながら縮みます。' : '倍率は $(0, 1)$ にあるので、$y$ は行き過ぎずに着実に縮みます。']],
        set: { k, eta },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let k, eta, rho, N;
        do { k = r.int(2, 10); eta = r.step(0.04, 0.5, 0.02); rho = Math.max(Math.abs(1 - eta), Math.abs(1 - eta * k)); N = Math.log(1e-6) / (2 * Math.log(rho)); } while (rho >= 0.97 || rho < 0.2 || Math.abs(N - Math.round(N)) < 1e-3);
        const ans = Math.ceil(N);
        return {
          q: [`Gradient descent on $f = \\tfrac12(x^2 + ${k}y^2)$ with $\\eta = ${n(eta)}$. Using $f(x_n) \\le \\rho^{2n} f(x_0)$, what is the smallest $n$ that guarantees $f(x_n) \\le 10^{-6} f(x_0)$?`, `$f = \\tfrac12(x^2 + ${k}y^2)$ 上で $\\eta = ${n(eta)}$ の勾配降下法を行います。$f(x_n) \\le \\rho^{2n} f(x_0)$ を使い、$f(x_n) \\le 10^{-6} f(x_0)$ を保証する最小の $n$ を求めてください。`],
          a: { type: 'int', v: ans },
          hint: ['First find $\\rho = \\max(|1 - \\eta|, |1 - \\eta\\kappa|)$, then solve $\\rho^{2n} \\le 10^{-6}$.', 'まず $\\rho = \\max(|1 - \\eta|, |1 - \\eta\\kappa|)$ を求め、$\\rho^{2n} \\le 10^{-6}$ を解きます。'],
          sol: [[`$|1 - \\eta| = ${n(Math.abs(1 - eta))}$ and $|1 - \\eta\\kappa| = ${n(Math.abs(1 - eta * k))}$, so $\\rho = ${n(rho)}$.`, `$|1 - \\eta| = ${n(Math.abs(1 - eta))}$、$|1 - \\eta\\kappa| = ${n(Math.abs(1 - eta * k))}$ なので $\\rho = ${n(rho)}$ です。`], [`$n \\ge \\dfrac{\\ln 10^{-6}}{2\\ln ${n(rho)}} = ${n(N, 3)}$, so $n = ${ans}$.`, `$n \\ge \\dfrac{\\ln 10^{-6}}{2\\ln ${n(rho)}} = ${n(N, 3)}$ なので $n = ${ans}$ です。`], ['On the log plot this is where the dashed rate line crosses six decades below the start: the slower coordinate dictates the count.', '対数グラフでは、破線の速さの直線が出発点から 6 桁下を横切る所です。遅い方の座標が回数を決めます。']],
          set: { k, eta },
        };
      }
      if (form === 1) {
        const k = r.int(2, 10), eta = 2 / (1 + k), rho = (k - 1) / (k + 1);
        return {
          q: [`For $f = \\tfrac12(x^2 + ${k}y^2)$, find the fixed step $\\eta^*$ that makes gradient descent fastest, and the resulting rate $\\rho^*$.`, `$f = \\tfrac12(x^2 + ${k}y^2)$ で、勾配降下法を最も速くする一定の刻み幅 $\\eta^*$ と、そのときの速さ $\\rho^*$ を求めてください。`],
          a: { type: 'tuple', v: [eta, rho], labels: ['$\\eta^*$', '$\\rho^*$'] },
          hint: ['$\\rho(\\eta) = \\max(|1 - \\eta|, |1 - \\eta\\kappa|)$ is smallest where the two magnitudes are equal.', '$\\rho(\\eta) = \\max(|1 - \\eta|, |1 - \\eta\\kappa|)$ は二つの絶対値が等しい所で最小です。'],
          sol: [[`Increasing $\\eta$ shrinks $|1 - \\eta|$ but eventually grows $|1 - ${k}\\eta|$ (once $${k}\\eta > 1$). The best balance is $1 - \\eta = ${k}\\eta - 1$.`, `$\\eta$ を大きくすると $|1 - \\eta|$ は減りますが、$${k}\\eta > 1$ になると $|1 - ${k}\\eta|$ は増えます。最良の釣り合いは $1 - \\eta = ${k}\\eta - 1$ です。`], [`$\\eta^* = 2/(1 + ${k}) = ${frac(2, 1 + k)}$ and $\\rho^* = 1 - \\eta^* = ${frac(k - 1, k + 1)}$.`, `$\\eta^* = 2/(1 + ${k}) = ${frac(2, 1 + k)}$、$\\rho^* = 1 - \\eta^* = ${frac(k - 1, k + 1)}$ です。`], ['Both coordinates now shrink at the same rate, one of them with alternating sign. The rate depends only on the condition number.', 'これで二つの座標は同じ速さで縮み、一方は符号を交互に変えます。速さは条件数だけで決まります。']],
          set: onGrid(eta, 0.02, 0.8, 0.02) ? { k, eta } : { k },
        };
      }
      const k = r.int(2, 5), x = r.pick([1, 2, 3]), y = r.pick([1, -1, 2]);
      const num = x * x + k * k * y * y, den = x * x + k ** 3 * y * y;
      return {
        q: [`Steepest descent with exact line search on $f = \\tfrac12(x^2 + ${k}y^2)$, at $(${x}, ${y})$: which step $\\alpha$ minimizes $f$ along $-\\nabla f$?`, `$f = \\tfrac12(x^2 + ${k}y^2)$ で厳密な直線探索つきの最急降下法を行います。$(${x}, ${y})$ で $-\\nabla f$ に沿って $f$ を最小にする刻み $\\alpha$ はいくつですか。`],
        a: { type: 'num', v: num / den, show: frac(num, den) },
        hint: ['For $f = \\tfrac12 x^{\\top}Ax$ the best step along $-g$ is $\\alpha = g^{\\top}g / g^{\\top}Ag$.', '$f = \\tfrac12 x^{\\top}Ax$ では、$-g$ に沿った最良の刻みは $\\alpha = g^{\\top}g / g^{\\top}Ag$ です。'],
        sol: [[`$g = \\nabla f = (${x}, ${k * y})$, so $g^{\\top}g = ${num}$ and $g^{\\top}Ag = ${x * x} + ${k}\\cdot ${k * k * y * y} = ${den}$.`, `$g = \\nabla f = (${x}, ${k * y})$ なので $g^{\\top}g = ${num}$、$g^{\\top}Ag = ${x * x} + ${k}\\cdot ${k * k * y * y} = ${den}$ です。`], [`$\\alpha = ${frac(num, den)} \\approx ${n(num / den, 4)}$, found by setting $\\frac{d}{d\\alpha}f(x - \\alpha g) = 0$.`, `$\\frac{d}{d\\alpha}f(x - \\alpha g) = 0$ とおいて $\\alpha = ${frac(num, den)} \\approx ${n(num / den, 4)}$ です。`], ['It lies between $1/\\kappa$ and $1$, and the new gradient is orthogonal to the old one, which is why exact line search also zigzags.', 'この値は $1/\\kappa$ と $1$ の間にあり、新しい勾配は古い勾配と直交します。厳密な直線探索でもジグザグになるのはこのためです。']],
        set: { k },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        let k, eta;
        do { k = r.int(3, 10); eta = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]); } while (eta * k <= 1.05 || Math.abs(1 - eta * k) > 2.5);
        const m = 1 - eta * k;
        return {
          q: [`Gradient descent with $\\eta = ${n(eta)}$ on $f = \\tfrac12(x^2 + \\kappa y^2)$: the $y$ coordinate flips sign every step and its size is multiplied by $${n(Math.abs(m))}$. What is $\\kappa$?`, `$f = \\tfrac12(x^2 + \\kappa y^2)$ 上で $\\eta = ${n(eta)}$ の勾配降下法を行うと、$y$ 座標は毎ステップ符号を変え、大きさは $${n(Math.abs(m))}$ 倍になります。$\\kappa$ はいくつですか。`],
          a: { type: 'num', v: k },
          hint: ['A sign flip means the multiplier $1 - \\eta\\kappa$ is negative.', '符号が変わるのは倍率 $1 - \\eta\\kappa$ が負だからです。'],
          sol: [[`$1 - ${n(eta)}\\kappa = -${n(Math.abs(m))}$.`, `$1 - ${n(eta)}\\kappa = -${n(Math.abs(m))}$ です。`], [`$\\kappa = (1 + ${n(Math.abs(m))})/${n(eta)} = ${k}$.`, `$\\kappa = (1 + ${n(Math.abs(m))})/${n(eta)} = ${k}$ です。`], [Math.abs(m) < 1 ? 'The zigzag still shrinks, so the run converges, but more slowly than the best step would.' : 'The zigzag grows: the step is past the stability limit $2/\\kappa$ for this curvature.', Math.abs(m) < 1 ? 'ジグザグは縮むので収束しますが、最良の刻みより遅くなります。' : 'ジグザグは大きくなります。この曲率に対する安定限界 $2/\\kappa$ を超えた刻みです。']],
          set: { k, eta },
        };
      }
      if (form === 1) {
        return {
          q: ['With the best fixed step, gradient descent on $f = \\tfrac12(x^2 + \\kappa y^2)$ converges at rate $\\rho^*(\\kappa)$. Write $\\rho^*$ as a function of $\\kappa$.', '最良の一定刻みを使うと、$f = \\tfrac12(x^2 + \\kappa y^2)$ 上の勾配降下法は速さ $\\rho^*(\\kappa)$ で収束します。$\\rho^*$ を $\\kappa$ の式で書いてください。'],
          a: { type: 'expr', v: '(kappa-1)/(kappa+1)', vars: ['kappa'], dom: { kappa: [1.2, 12] }, lhs: ['$\\rho^*(\\kappa) =$', '$\\rho^*(\\kappa) =$'] },
          hint: ['Equalize $|1 - \\eta|$ and $|1 - \\eta\\kappa|$.', '$|1 - \\eta|$ と $|1 - \\eta\\kappa|$ を等しくします。'],
          sol: [['$1 - \\eta = \\eta\\kappa - 1$ gives $\\eta^* = 2/(1 + \\kappa)$.', '$1 - \\eta = \\eta\\kappa - 1$ より $\\eta^* = 2/(1 + \\kappa)$ です。'], ['$\\rho^* = 1 - \\eta^* = \\dfrac{\\kappa - 1}{\\kappa + 1}$.', '$\\rho^* = 1 - \\eta^* = \\dfrac{\\kappa - 1}{\\kappa + 1}$ です。'], ['For large $\\kappa$, $\\rho^* \\approx 1 - 2/\\kappa$: the number of steps grows in proportion to the condition number, the basic reason preconditioning matters.', '$\\kappa$ が大きいと $\\rho^* \\approx 1 - 2/\\kappa$ となり、必要な回数は条件数に比例して増えます。前処理が重要になる根本的な理由です。']],
          set: { k: r.int(2, 10) },
        };
      }
      if (form === 2) {
        const k = r.pick([4, 9, 19, 49, 99]), rho = (k - 1) / (k + 1), N = Math.log(1e-6) / (2 * Math.log(rho)), ans = Math.ceil(N - 1e-9);
        return {
          q: [`With the best fixed step on $f = \\tfrac12(x^2 + ${k}y^2)$, how many iterations guarantee $f(x_n) \\le 10^{-6}f(x_0)$? (Newton's method needs one.)`, `$f = \\tfrac12(x^2 + ${k}y^2)$ で最良の一定刻みを使うとき、$f(x_n) \\le 10^{-6}f(x_0)$ を保証する反復回数はいくつですか（ニュートン法なら1回です）。`],
          a: { type: 'int', v: ans },
          hint: ['Use $\\rho^* = (\\kappa - 1)/(\\kappa + 1)$ and $f(x_n) \\le \\rho^{*2n} f(x_0)$.', '$\\rho^* = (\\kappa - 1)/(\\kappa + 1)$ と $f(x_n) \\le \\rho^{*2n} f(x_0)$ を使います。'],
          sol: [[`$\\rho^* = ${frac(k - 1, k + 1)} = ${n(rho, 5)}$.`, `$\\rho^* = ${frac(k - 1, k + 1)} = ${n(rho, 5)}$ です。`], [`$n \\ge \\dfrac{\\ln 10^{-6}}{2\\ln ${n(rho, 5)}} = ${n(N, 3)}$, so $n = ${ans}$.`, `$n \\ge \\dfrac{\\ln 10^{-6}}{2\\ln ${n(rho, 5)}} = ${n(N, 3)}$ なので $n = ${ans}$ です。`], [`Roughly $\\tfrac{\\kappa}{4}\\ln 10^{6} \\approx ${n(k / 4 * Math.log(1e6), 3)}$: the cost of ignoring curvature grows linearly with $\\kappa$, while Newton's step, which rescales by the Hessian, is blind to it.`, `おおよそ $\\tfrac{\\kappa}{4}\\ln 10^{6} \\approx ${n(k / 4 * Math.log(1e6), 3)}$ です。曲率を無視する代償は $\\kappa$ に比例して増え、ヘッセ行列で尺度を直すニュートン法はそれに左右されません。`]],
          set: k <= 9 ? { k, eta: Number((2 / (1 + k)).toFixed(2)) } : undefined,
        };
      }
      const k = r.int(2, 10), eta = r.step(0.06, 0.8, 0.02), mx = 1 - eta, my = 1 - eta * k;
      const cls = Math.max(Math.abs(mx), Math.abs(my)) >= 1 ? 3 : my < 0 && mx < 0 ? 2 : my < 0 ? 1 : 0;
      const opts = [['Converges without oscillating', '振動せずに収束する'], ['Converges, zigzagging in $y$', '$y$ 方向にジグザグしながら収束する'], ['Converges, zigzagging in both coordinates', '両方の座標でジグザグしながら収束する'], ['Diverges', '発散する']];
      return {
        q: [`Classify gradient descent on $f = \\tfrac12(x^2 + ${k}y^2)$ with $\\eta = ${n(eta)}$.`, `$f = \\tfrac12(x^2 + ${k}y^2)$ 上の $\\eta = ${n(eta)}$ の勾配降下法を分類してください。`],
        a: { type: 'choice', opts, v: cls, fixed: true },
        hint: ['Look at the sign and the size of each multiplier, $1 - \\eta$ and $1 - \\eta\\kappa$.', '二つの倍率 $1 - \\eta$ と $1 - \\eta\\kappa$ の符号と大きさを見ます。'],
        sol: [[`The multipliers are $1 - \\eta = ${n(mx)}$ and $1 - \\eta\\kappa = ${n(my)}$.`, `倍率は $1 - \\eta = ${n(mx)}$ と $1 - \\eta\\kappa = ${n(my)}$ です。`], [cls === 3 ? `$|${n(Math.abs(mx) >= 1 ? mx : my)}| \\ge 1$, so that coordinate does not shrink: the run diverges (or stalls).` : `Both have magnitude below 1, so the run converges; a negative multiplier means that coordinate changes sign every step.`, cls === 3 ? `$|${n(Math.abs(mx) >= 1 ? mx : my)}| \\ge 1$ なのでその座標は縮まず、反復は発散（または停滞）します。` : '絶対値はどちらも 1 未満なので収束します。倍率が負の座標は毎ステップ符号を変えます。'], [`The stability limit here is $\\eta < 2/${k} = ${n(2 / k, 3)}$, and the zigzag in $y$ starts at $\\eta > 1/${k} = ${n(1 / k, 3)}$.`, `ここでの安定限界は $\\eta < 2/${k} = ${n(2 / k, 3)}$ で、$y$ のジグザグは $\\eta > 1/${k} = ${n(1 / k, 3)}$ で始まります。`]],
        set: { k, eta },
      };
    },
  ];

  /* ---------- 2. constrained minimum: min x^2 + y^2 on x + y = b ---------- */
  const B = () => [-2.4, -1.6, -1.2, -0.8, 0.6, 1, 1.4, 2, 2.6, 3];
  Q.constraint = [
    (r) => {
      const form = r.int(0, 2), b = r.pick(B());
      if (form === 0) return {
        q: [`Minimize $x^2 + y^2$ subject to $x + y = ${n(b)}$. Where is the minimizer?`, `$x + y = ${n(b)}$ のもとで $x^2 + y^2$ を最小にします。最小点はどこですか。`],
        a: { type: 'tuple', v: [b / 2, b / 2], labels: ['$x^*$', '$y^*$'], tol: 1e-6 },
        hint: ['By symmetry, or: the circle touching the line touches it at the foot of the perpendicular from the origin.', '対称性から、あるいは、直線に接する円は原点から下ろした垂線の足で接します。'],
        sol: [[`Substitute $y = ${n(b)} - x$: $f = x^2 + (${n(b)} - x)^2$, and $f'(x) = 4x - ${n(2 * b)} = 0$ gives $x = ${n(b / 2)}$.`, `$y = ${n(b)} - x$ を代入すると $f = x^2 + (${n(b)} - x)^2$ で、$f'(x) = 4x - ${n(2 * b)} = 0$ より $x = ${n(b / 2)}$ です。`], [`So $(x^*, y^*) = (${n(b / 2)}, ${n(b / 2)})$: the point of the line closest to the origin.`, `したがって $(x^*, y^*) = (${n(b / 2)}, ${n(b / 2)})$ で、直線上で原点に最も近い点です。`]],
        set: { b, kind: 0 },
      };
      if (form === 1) return {
        q: [`What is the minimum value of $x^2 + y^2$ on the line $x + y = ${n(b)}$?`, `直線 $x + y = ${n(b)}$ 上での $x^2 + y^2$ の最小値はいくつですか。`],
        a: { type: 'num', v: b * b / 2 },
        hint: ['$x^2 + y^2 = \\tfrac12(x + y)^2 + \\tfrac12(x - y)^2$.', '$x^2 + y^2 = \\tfrac12(x + y)^2 + \\tfrac12(x - y)^2$ です。'],
        sol: [[`On the line the first term is fixed at $\\tfrac12\\cdot ${n(b)}^2 = ${n(b * b / 2)}$, and the second is smallest, zero, at $x = y$.`, `直線上では第1項は $\\tfrac12\\cdot ${n(b)}^2 = ${n(b * b / 2)}$ に固定され、第2項は $x = y$ で最小の 0 になります。`], [`$f^* = ${n(b * b / 2)}$: the square of the distance $${n(Math.abs(b))}/\\sqrt2$ from the origin to the line.`, `$f^* = ${n(b * b / 2)}$ で、原点から直線までの距離 $${n(Math.abs(b))}/\\sqrt2$ の2乗です。`]],
        set: { b, kind: 0 },
      };
      return {
        q: [`At the minimizer of $x^2 + y^2$ on $x + y = ${n(b)}$, $\\nabla f = \\lambda\\nabla(x + y)$. What is $\\lambda$?`, `$x + y = ${n(b)}$ 上の $x^2 + y^2$ の最小点では $\\nabla f = \\lambda\\nabla(x + y)$ です。$\\lambda$ はいくつですか。`],
        a: { type: 'num', v: b },
        hint: ['$\\nabla f = (2x, 2y)$ and $\\nabla(x + y) = (1, 1)$.', '$\\nabla f = (2x, 2y)$、$\\nabla(x + y) = (1, 1)$ です。'],
        sol: [[`$2x = \\lambda$ and $2y = \\lambda$, so $x = y = \\lambda/2$; then $x + y = \\lambda = ${n(b)}$.`, `$2x = \\lambda$、$2y = \\lambda$ より $x = y = \\lambda/2$ で、$x + y = \\lambda = ${n(b)}$ です。`], [`$\\lambda = ${n(b)}$: the gradient of $f$ is a multiple of the line's normal, so the contour is tangent to the line there.`, `$\\lambda = ${n(b)}$ です。$f$ の勾配が直線の法線の定数倍なので、そこで等高線が直線に接します。`]],
        set: { b, kind: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let p, q, c; do { p = r.nz(-3, 3); q = r.nz(-3, 3); c = r.nz(-6, 6); } while (p === q && r.chance(0.7));
        const s = p * p + q * q;
        return {
          q: [`Minimize $x^2 + y^2$ subject to $${terms([[p, 'x'], [q, 'y']])} = ${c}$. Find the minimizer.`, `$${terms([[p, 'x'], [q, 'y']])} = ${c}$ のもとで $x^2 + y^2$ を最小にします。最小点を求めてください。`],
          a: { type: 'tuple', v: [c * p / s, c * q / s], labels: ['$x^*$', '$y^*$'], tol: 1e-4 },
          hint: ['Lagrange: $(2x, 2y) = \\lambda(a, b)$, so the minimizer is a multiple of the normal $(a, b)$.', 'ラグランジュ条件 $(2x, 2y) = \\lambda(a, b)$ より、最小点は法線 $(a, b)$ の定数倍です。'],
          sol: [[`$(x, y) = \\tfrac{\\lambda}{2}(${p}, ${q})$. Put it into the constraint: $\\tfrac{\\lambda}{2}\\cdot ${s} = ${c}$, so $\\lambda = ${frac(2 * c, s)}$.`, `$(x, y) = \\tfrac{\\lambda}{2}(${p}, ${q})$ を制約に代入すると $\\tfrac{\\lambda}{2}\\cdot ${s} = ${c}$ なので $\\lambda = ${frac(2 * c, s)}$ です。`], [`$(x^*, y^*) = (${frac(c * p, s)}, ${frac(c * q, s)})$, at squared distance $f^* = ${frac(c * c, s)}$ from the origin.`, `$(x^*, y^*) = (${frac(c * p, s)}, ${frac(c * q, s)})$ で、原点からの距離の2乗は $f^* = ${frac(c * c, s)}$ です。`]],
        };
      }
      if (form === 1) {
        const m = r.pick([2, 3, 4, 0.5]), b = r.pick([1, 2, 3, -2, 6]);
        const v = m * b * b / (1 + m);
        return {
          q: [`Minimize $x^2 + ${n(m)}y^2$ subject to $x + y = ${b}$. What is the minimum value?`, `$x + y = ${b}$ のもとで $x^2 + ${n(m)}y^2$ を最小にします。最小値はいくつですか。`],
          a: { type: 'num', v, show: m === 0.5 ? frac(b * b, 3) : frac(m * b * b, 1 + m) },
          hint: ['Lagrange: $2x = \\lambda$, $2my = \\lambda$, so $x = my$.', 'ラグランジュ条件 $2x = \\lambda$、$2my = \\lambda$ より $x = my$ です。'],
          sol: [[`$x = ${n(m)}y$ and $x + y = ${b}$ give $y^* = ${n(b / (1 + m), 4)}$, $x^* = ${n(m * b / (1 + m), 4)}$.`, `$x = ${n(m)}y$ と $x + y = ${b}$ より $y^* = ${n(b / (1 + m), 4)}$、$x^* = ${n(m * b / (1 + m), 4)}$ です。`], [`$f^* = ${n(m * b / (1 + m), 4)}^2 + ${n(m)}\\cdot ${n(b / (1 + m), 4)}^2 = ${n(v, 4)}$.`, `$f^* = ${n(m * b / (1 + m), 4)}^2 + ${n(m)}\\cdot ${n(b / (1 + m), 4)}^2 = ${n(v, 4)}$ です。`], ['The more expensive coordinate takes the smaller share: the optimum leans away from the steep direction of the contours.', 'コストの高い座標ほど取り分は小さくなります。最適点は等高線の急な方向から離れる側に寄ります。']],
        };
      }
      const b = r.pick([-2.5, -1.5, -0.5, 0.5, 1.2, 2, 2.8]), act = b > 0;
      return {
        q: [`Minimize $x^2 + y^2$ subject to the inequality $x + y \\ge ${n(b)}$. Give the minimum value $f^*$ and the multiplier $\\lambda^* \\ge 0$.`, `不等式 $x + y \\ge ${n(b)}$ のもとで $x^2 + y^2$ を最小にします。最小値 $f^*$ と乗数 $\\lambda^* \\ge 0$ を求めてください。`],
        a: { type: 'tuple', v: [act ? b * b / 2 : 0, act ? b : 0], labels: ['$f^*$', '$\\lambda^*$'], tol: 1e-6 },
        hint: ['First check whether the unconstrained minimum, the origin, is feasible.', 'まず制約なしの最小点である原点が実行可能かどうかを確かめます。'],
        sol: [[act ? `The origin has $x + y = 0 < ${n(b)}$, so it is infeasible: the constraint must be active, $x + y = ${n(b)}$.` : `The origin has $x + y = 0 \\ge ${n(b)}$, so it is feasible and the constraint is inactive.`, act ? `原点では $x + y = 0 < ${n(b)}$ なので実行不能で、制約は効いており $x + y = ${n(b)}$ です。` : `原点では $x + y = 0 \\ge ${n(b)}$ なので実行可能で、制約は効いていません。`], [act ? `Then as for the equality, $f^* = ${n(b)}^2/2 = ${n(b * b / 2)}$ and $\\lambda^* = ${n(b)} > 0$.` : 'So $f^* = 0$, and complementary slackness, $\\lambda^*(x + y - b) = 0$ with $x + y - b > 0$, forces $\\lambda^* = 0$.', act ? `したがって等式の場合と同じく $f^* = ${n(b)}^2/2 = ${n(b * b / 2)}$、$\\lambda^* = ${n(b)} > 0$ です。` : 'したがって $f^* = 0$ で、相補性条件 $\\lambda^*(x + y - b) = 0$ と $x + y - b > 0$ から $\\lambda^* = 0$ です。'], ['A multiplier is a price: it is zero when loosening the constraint would not change the optimum.', '乗数は価格です。制約を緩めても最適値が変わらないとき、それは 0 です。']],
        set: { b, kind: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([2, 3, 4, 5, 9]);
        return {
          q: [`Write the optimal value $f^*(b)$ of $\\min\\,(x^2 + ${m}y^2)$ subject to $x + y = b$ as a function of $b$.`, `$x + y = b$ のもとでの $\\min\\,(x^2 + ${m}y^2)$ の最適値 $f^*(b)$ を $b$ の式で書いてください。`],
          a: { type: 'expr', v: `${m}*b^2/${m + 1}`, vars: ['b'], dom: { b: [-3, 3] }, lhs: ['$f^*(b) =$', '$f^*(b) =$'] },
          hint: ['Lagrange gives $x = ' + m + 'y$; substitute.', 'ラグランジュ条件から $x = ' + m + 'y$ です。代入します。'],
          sol: [[`$2x = \\lambda = ${2 * m}y$, so $x = ${m}y$; with $x + y = b$, $y = b/${m + 1}$ and $x = ${m}b/${m + 1}$.`, `$2x = \\lambda = ${2 * m}y$ より $x = ${m}y$ で、$x + y = b$ から $y = b/${m + 1}$、$x = ${m}b/${m + 1}$ です。`], [`$f^*(b) = \\dfrac{${m * m}b^2 + ${m}b^2}{${(m + 1) * (m + 1)}} = \\dfrac{${m}}{${m + 1}}b^2$.`, `$f^*(b) = \\dfrac{${m * m}b^2 + ${m}b^2}{${(m + 1) * (m + 1)}} = \\dfrac{${m}}{${m + 1}}b^2$ です。`], [`Check: $\\dfrac{df^*}{db} = \\dfrac{${2 * m}}{${m + 1}}b = 2x^* = \\lambda^*$. The multiplier is the slope of the optimal value, as in experiment 3.`, `確認：$\\dfrac{df^*}{db} = \\dfrac{${2 * m}}{${m + 1}}b = 2x^* = \\lambda^*$ です。実験 3 と同じく、乗数は最適値の傾きです。`]],
        };
      }
      if (form === 1) {
        const p = r.int(-2, 2), q = r.int(-2, 2), b = r.int(-2, 4), lam = Math.max(0, b - p - q);
        return {
          q: [`Project the point $(${p}, ${q})$ onto the half-plane $x + y \\ge ${b}$: minimize $(x - ${p})^2 + (y - ${q})^2$ subject to it. Give $x^*$, $y^*$ and the multiplier $\\lambda^*$.`, `点 $(${p}, ${q})$ を半平面 $x + y \\ge ${b}$ へ射影します。すなわちその条件のもとで $(x - ${p})^2 + (y - ${q})^2$ を最小にします。$x^*$、$y^*$ と乗数 $\\lambda^*$ を求めてください。`],
          a: { type: 'tuple', v: [p + lam / 2, q + lam / 2, lam], labels: ['$x^*$', '$y^*$', '$\\lambda^*$'], tol: 1e-6 },
          hint: ['KKT: $2(x - p, y - q) = \\lambda(1, 1)$ with $\\lambda \\ge 0$, and $\\lambda = 0$ unless the constraint is tight.', 'KKT 条件：$2(x - p, y - q) = \\lambda(1, 1)$、$\\lambda \\ge 0$ で、制約がきつくない限り $\\lambda = 0$ です。'],
          sol: [[`The point itself has $x + y = ${p + q}$${p + q >= b ? ` $\\ge ${b}$: it is already feasible, so it is its own projection and $\\lambda^* = 0$.` : ` $< ${b}$: infeasible, so the constraint is active.`}`, `点自身は $x + y = ${p + q}$${p + q >= b ? ` $\\ge ${b}$ なのですでに実行可能で、それ自身が射影であり $\\lambda^* = 0$ です。` : ` $< ${b}$ で実行不能なので、制約は効いています。`}`], p + q >= b ? ['The answer is $(' + p + ', ' + q + ', 0)$.', '答えは $(' + p + ', ' + q + ', 0)$ です。'] : [`$x = ${p} + \\lambda/2$, $y = ${q} + \\lambda/2$ and $x + y = ${b}$ give $\\lambda^* = ${b} - ${p + q < 0 ? '(' + (p + q) + ')' : p + q} = ${lam}$, so $(x^*, y^*) = (${n(p + lam / 2)}, ${n(q + lam / 2)})$.`, `$x = ${p} + \\lambda/2$、$y = ${q} + \\lambda/2$ と $x + y = ${b}$ より $\\lambda^* = ${b} - ${p + q < 0 ? '(' + (p + q) + ')' : p + q} = ${lam}$ で、$(x^*, y^*) = (${n(p + lam / 2)}, ${n(q + lam / 2)})$ です。`], ['The projection moves along the normal $(1, 1)$, and the multiplier measures how far the constraint had to push.', '射影は法線 $(1, 1)$ に沿って動き、乗数は制約がどれだけ押し戻したかを測ります。']],
        };
      }
      const k = r.pick([3, 4, 5, 6, 10]), b = r.pick([1, 2, 3, 6, 12]);
      return {
        q: [`Minimize $x_1^2 + \\cdots + x_{${k}}^2$ subject to $x_1 + \\cdots + x_{${k}} = ${b}$. Give the minimum value $f^*$ and the multiplier $\\lambda^*$ (with $\\nabla f = \\lambda\\nabla g$).`, `$x_1 + \\cdots + x_{${k}} = ${b}$ のもとで $x_1^2 + \\cdots + x_{${k}}^2$ を最小にします。最小値 $f^*$ と乗数 $\\lambda^*$（$\\nabla f = \\lambda\\nabla g$）を求めてください。`],
        a: { type: 'tuple', v: [b * b / k, 2 * b / k], labels: ['$f^*$', '$\\lambda^*$'] },
        hint: ['Every coordinate satisfies the same equation $2x_i = \\lambda$.', 'どの座標も同じ式 $2x_i = \\lambda$ を満たします。'],
        sol: [[`$2x_i = \\lambda$ for every $i$, so all $x_i$ are equal: $x_i = ${frac(b, k)}$.`, `すべての $i$ で $2x_i = \\lambda$ なので $x_i$ はすべて等しく、$x_i = ${frac(b, k)}$ です。`], [`$f^* = ${k}\\cdot(${frac(b, k)})^2 = ${frac(b * b, k)}$ and $\\lambda^* = 2\\cdot ${frac(b, k)} = ${frac(2 * b, k)}$.`, `$f^* = ${k}\\cdot(${frac(b, k)})^2 = ${frac(b * b, k)}$、$\\lambda^* = 2\\cdot ${frac(b, k)} = ${frac(2 * b, k)}$ です。`], [`Again $\\lambda^* = df^*/db = 2b/${k}$. Spreading a fixed total evenly minimizes the sum of squares, the same fact behind $x = y$ in the figure.`, `ここでも $\\lambda^* = df^*/db = 2b/${k}$ です。一定の合計を均等に分けると二乗和が最小になります。図で $x = y$ となるのと同じ事実です。`]],
      };
    },
  ];

  /* ---------- 3. Lagrangian duality: g(lambda) = lambda b - lambda^2/2 ---------- */
  Q.duality = [
    (r) => {
      const form = r.int(0, 2), b = r.pick([-2, -1, 1, 1.5, 2, 2.5, 3]), lam = r.pick([-2, -1, 0, 0.5, 1, 2, 3].filter((x) => x !== b));
      if (form === 0) return {
        q: [`For $\\min\\,x^2 + y^2$ subject to $x + y = ${n(b)}$, the dual function is $g(\\lambda) = \\lambda b - \\lambda^2/2$. Evaluate $g(${n(lam)})$.`, `$x + y = ${n(b)}$ のもとでの $\\min\\,x^2 + y^2$ の双対関数は $g(\\lambda) = \\lambda b - \\lambda^2/2$ です。$g(${n(lam)})$ を求めてください。`],
        a: { type: 'num', v: lam * b - lam * lam / 2, tol: 1e-9 },
        sol: [[`$g(${n(lam)}) = ${n(lam)}\\cdot ${n(b)} - ${n(lam)}^2/2 = ${n(lam * b)} - ${n(lam * lam / 2)} = ${n(lam * b - lam * lam / 2)}$.`, `$g(${n(lam)}) = ${n(lam)}\\cdot ${n(b)} - ${n(lam)}^2/2 = ${n(lam * b)} - ${n(lam * lam / 2)} = ${n(lam * b - lam * lam / 2)}$ です。`], [`It is below $f^* = ${n(b * b / 2)}$, as weak duality promises for every $\\lambda$.`, `弱双対性が保証するとおり、どの $\\lambda$ でも $f^* = ${n(b * b / 2)}$ 以下です。`]],
        set: { b, lambda: lam },
      };
      if (form === 1) return {
        q: [`With $b = ${n(b)}$ and trial multiplier $\\lambda = ${n(lam)}$, what is the duality gap $f^* - g(\\lambda)$?`, `$b = ${n(b)}$ で試す乗数が $\\lambda = ${n(lam)}$ のとき、双対ギャップ $f^* - g(\\lambda)$ はいくつですか。`],
        a: { type: 'num', v: (b - lam) ** 2 / 2, tol: 1e-9 },
        hint: ['$f^* - g(\\lambda) = b^2/2 - \\lambda b + \\lambda^2/2$ is a perfect square.', '$f^* - g(\\lambda) = b^2/2 - \\lambda b + \\lambda^2/2$ は完全平方です。'],
        sol: [[`$f^* - g(\\lambda) = \\tfrac12(b - \\lambda)^2 = \\tfrac12(${n(b - lam)})^2 = ${n((b - lam) ** 2 / 2)}$.`, `$f^* - g(\\lambda) = \\tfrac12(b - \\lambda)^2 = \\tfrac12(${n(b - lam)})^2 = ${n((b - lam) ** 2 / 2)}$ です。`], ['The gap is never negative and vanishes only at $\\lambda = b$: there the dual bound is exact.', 'ギャップは負にならず、$\\lambda = b$ でのみ 0 になります。そこで双対の下界は厳密になります。']],
        set: { b, lambda: lam },
      };
      return {
        q: [`For a fixed $\\lambda = ${n(lam)}$, minimize the Lagrangian $L = x^2 + y^2 + \\lambda(b - x - y)$ over $x, y$. Where is its minimum?`, `$\\lambda = ${n(lam)}$ を固定し、ラグランジアン $L = x^2 + y^2 + \\lambda(b - x - y)$ を $x, y$ について最小化します。最小点はどこですか。`],
        a: { type: 'tuple', v: [lam / 2, lam / 2], labels: ['$x$', '$y$'], tol: 1e-6 },
        hint: ['Set $\\partial L/\\partial x = \\partial L/\\partial y = 0$.', '$\\partial L/\\partial x = \\partial L/\\partial y = 0$ とおきます。'],
        sol: [[`$2x - \\lambda = 0$ and $2y - \\lambda = 0$, so $x = y = ${n(lam / 2)}$.`, `$2x - \\lambda = 0$、$2y - \\lambda = 0$ より $x = y = ${n(lam / 2)}$ です。`], [`Then $x + y = ${n(lam)}$, which misses the constraint $x + y = ${n(b)}$ by $${n(b - lam)}$. The violation is the slope of $g$ at this $\\lambda$.`, `このとき $x + y = ${n(lam)}$ で、制約 $x + y = ${n(b)}$ を $${n(b - lam)}$ だけ外します。この違反量が、この $\\lambda$ での $g$ の傾きです。`]],
        set: { b, lambda: lam },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([1, 1.5, 2, 2.5, -1, -2, 3]), d = r.pick([0.1, 0.2, -0.1, 0.05, -0.2]);
        const est = b * d, exact = (b + d) ** 2 / 2 - b * b / 2;
        return {
          q: [`The optimum of $\\min\\,x^2 + y^2$, $x + y = b$ is $f^*(b) = b^2/2$ with $\\lambda^* = b$. At $b = ${n(b)}$, use the multiplier to estimate how $f^*$ changes when $b$ becomes $${n(b + d)}$.`, `$x + y = b$ のもとの $\\min\\,x^2 + y^2$ の最適値は $f^*(b) = b^2/2$、乗数は $\\lambda^* = b$ です。$b = ${n(b)}$ で、$b$ が $${n(b + d)}$ になるときの $f^*$ の変化を乗数を使って見積もってください。`],
          a: { type: 'num', v: est, tol: 1e-6 },
          hint: ['Sensitivity: $\\Delta f^* \\approx \\lambda^*\\,\\Delta b$.', '感度の式：$\\Delta f^* \\approx \\lambda^*\\,\\Delta b$ です。'],
          sol: [[`$\\Delta f^* \\approx \\lambda^*\\Delta b = ${n(b)}\\cdot(${n(d)}) = ${n(est)}$.`, `$\\Delta f^* \\approx \\lambda^*\\Delta b = ${n(b)}\\cdot(${n(d)}) = ${n(est)}$ です。`], [`The exact change is $${n(b + d)}^2/2 - ${n(b)}^2/2 = ${n(exact, 5)}$; the difference $\\Delta b^2/2 = ${n(d * d / 2, 5)}$ is second order. This is why the multiplier is called a shadow price.`, `厳密な変化は $${n(b + d)}^2/2 - ${n(b)}^2/2 = ${n(exact, 5)}$ で、差 $\\Delta b^2/2 = ${n(d * d / 2, 5)}$ は2次の量です。乗数が影の価格と呼ばれるのはこのためです。`]],
          set: { b, lambda: b },
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 3]), c = r.pick([1, 2, 3, 6].filter((x) => x !== a)), b = r.pick([1, 2, 3, -2]);
        const s = (1 / a + 1 / c), lam = 2 * b / s, d = b * b / s;
        return {
          q: [`Dualize $\\min\\,${a === 1 ? '' : a}x^2 + ${c === 1 ? '' : c}y^2$ subject to $x + y = ${b}$ with $L = ${a === 1 ? '' : a}x^2 + ${c === 1 ? '' : c}y^2 + \\lambda(${b} - x - y)$. Find the maximizer $\\lambda^*$ of the dual function and the dual optimum $d^* = g(\\lambda^*)$.`, `$L = ${a === 1 ? '' : a}x^2 + ${c === 1 ? '' : c}y^2 + \\lambda(${b} - x - y)$ として、$x + y = ${b}$ のもとの $\\min\\,${a === 1 ? '' : a}x^2 + ${c === 1 ? '' : c}y^2$ の双対をとります。双対関数の最大点 $\\lambda^*$ と双対最適値 $d^* = g(\\lambda^*)$ を求めてください。`],
          a: { type: 'tuple', v: [lam, d], labels: ['$\\lambda^*$', '$d^*$'] },
          hint: ['Minimize $L$ for fixed $\\lambda$: $x = \\lambda/(2a)$, $y = \\lambda/(2c)$.', '$\\lambda$ を固定して $L$ を最小化すると $x = \\lambda/(2a)$、$y = \\lambda/(2c)$ です。'],
          sol: [[`$x = \\lambda/${2 * a}$, $y = \\lambda/${2 * c}$, so $g(\\lambda) = ${b}\\lambda - \\tfrac{\\lambda^2}{4}\\left(\\tfrac1{${a}} + \\tfrac1{${c}}\\right) = ${b}\\lambda - ${n(s / 4, 4)}\\lambda^2$.`, `$x = \\lambda/${2 * a}$、$y = \\lambda/${2 * c}$ なので $g(\\lambda) = ${b}\\lambda - \\tfrac{\\lambda^2}{4}\\left(\\tfrac1{${a}} + \\tfrac1{${c}}\\right) = ${b}\\lambda - ${n(s / 4, 4)}\\lambda^2$ です。`], [`$g'(\\lambda) = 0$ gives $\\lambda^* = ${n(lam, 4)}$ and $d^* = ${n(d, 4)}$.`, `$g'(\\lambda) = 0$ より $\\lambda^* = ${n(lam, 4)}$、$d^* = ${n(d, 4)}$ です。`], ['The primal minimum is the same number: for a convex problem with a linear constraint the gap closes, so the dual solves the primal.', '主問題の最小値も同じ値です。線形制約の凸問題ではギャップが閉じるので、双対を解けば主問題が解けます。']],
        };
      }
      const b = r.pick([-2, -1, 1, 2, 3, 1.5]), lam = r.pick([-3, -1, 0, 0.5, 1, 2.5, 4].filter((x) => x !== b));
      return {
        q: [`At $b = ${n(b)}$, $\\lambda = ${n(lam)}$: give the dual value $g(\\lambda)$ and its slope $g'(\\lambda)$.`, `$b = ${n(b)}$、$\\lambda = ${n(lam)}$ で、双対値 $g(\\lambda)$ とその傾き $g'(\\lambda)$ を求めてください。`],
        a: { type: 'tuple', v: [lam * b - lam * lam / 2, b - lam], labels: ['$g$', "$g'$"], tol: 1e-6 },
        hint: ['$g(\\lambda) = \\lambda b - \\lambda^2/2$; differentiate.', '$g(\\lambda) = \\lambda b - \\lambda^2/2$ を微分します。'],
        sol: [[`$g = ${n(lam)}\\cdot ${n(b)} - ${n(lam * lam / 2)} = ${n(lam * b - lam * lam / 2)}$ and $g' = b - \\lambda = ${n(b - lam)}$.`, `$g = ${n(lam)}\\cdot ${n(b)} - ${n(lam * lam / 2)} = ${n(lam * b - lam * lam / 2)}$、$g' = b - \\lambda = ${n(b - lam)}$ です。`], [`$g' = b - (x + y)$ at the Lagrangian minimizer: ${b - lam > 0 ? 'positive, so raising $\\lambda$ improves the bound' : 'negative, so lowering $\\lambda$ improves the bound'}. Dual ascent is exactly this rule.`, `$g'$ はラグランジアンの最小点での $b - (x + y)$ です。${b - lam > 0 ? '正なので $\\lambda$ を上げると下界が良くなります' : '負なので $\\lambda$ を下げると下界が良くなります'}。双対上昇法はまさにこの規則です。`]],
        set: { b, lambda: lam },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([1, 2, 3, 4]), b = r.pick([1, 2, 3, -1, -2]);
        const c = (1 + 1 / m) / 4;
        return {
          q: [`Write the dual function $g(\\lambda)$ of $\\min\\,x^2 + ${m === 1 ? '' : m}y^2$ subject to $x + y = ${b}$, using $L = x^2 + ${m === 1 ? '' : m}y^2 + \\lambda(${b} - x - y)$.`, `$L = x^2 + ${m === 1 ? '' : m}y^2 + \\lambda(${b} - x - y)$ を使って、$x + y = ${b}$ のもとの $\\min\\,x^2 + ${m === 1 ? '' : m}y^2$ の双対関数 $g(\\lambda)$ を書いてください。`],
          a: { type: 'expr', v: `${b}*lambda - ${n(c, 8)}*lambda^2`, vars: ['lambda'], dom: { lambda: [-3, 3] }, lhs: ['$g(\\lambda) =$', '$g(\\lambda) =$'] },
          hint: ['Minimize $L$ over $x$ and $y$ separately, then substitute back.', '$L$ を $x$ と $y$ について別々に最小化し、代入し直します。'],
          sol: [[`$\\partial_x L = 2x - \\lambda = 0$ and $\\partial_y L = ${2 * m}y - \\lambda = 0$: $x = \\lambda/2$, $y = \\lambda/${2 * m}$.`, `$\\partial_x L = 2x - \\lambda = 0$、$\\partial_y L = ${2 * m}y - \\lambda = 0$ より $x = \\lambda/2$、$y = \\lambda/${2 * m}$ です。`], [`$g(\\lambda) = \\tfrac{\\lambda^2}{4} + \\tfrac{\\lambda^2}{${4 * m}} + ${b}\\lambda - \\tfrac{\\lambda^2}{2} - \\tfrac{\\lambda^2}{${2 * m}} = ${b}\\lambda - ${frac(m + 1, 4 * m)}\\lambda^2$.`, `$g(\\lambda) = \\tfrac{\\lambda^2}{4} + \\tfrac{\\lambda^2}{${4 * m}} + ${b}\\lambda - \\tfrac{\\lambda^2}{2} - \\tfrac{\\lambda^2}{${2 * m}} = ${b}\\lambda - ${frac(m + 1, 4 * m)}\\lambda^2$ です。`], ['A concave parabola whatever the primal looks like: the dual function is always concave, being a minimum of functions linear in $\\lambda$.', '主問題がどうであれ、上に凸な放物線です。双対関数は $\\lambda$ について線形な関数の最小値なので、常に凹関数です。']],
          set: m === 1 && Math.abs(b) <= 3 ? { b } : undefined,
        };
      }
      if (form === 1) {
        let b, G, lo, hi;
        do { b = r.step(-2, 2, 0.5); G = r.pick([0.5, 2, 4.5, 0.125, 1.125]); lo = b - Math.sqrt(2 * G); hi = b + Math.sqrt(2 * G); } while (b === 0);
        const inr = [hi, lo].find((x) => x >= -4 && x <= 4);
        return {
          q: [`At $b = ${n(b)}$ a trial multiplier leaves a duality gap of $${n(G)}$. Which two values of $\\lambda$ could it have been?`, `$b = ${n(b)}$ で、ある試行乗数による双対ギャップが $${n(G)}$ でした。$\\lambda$ としてありうる二つの値を求めてください。`],
          a: { type: 'tuple', v: [hi, lo], labels: [['larger', '大きい方'], ['smaller', '小さい方']], tol: 1e-6 },
          hint: ['The gap is $\\tfrac12(b - \\lambda)^2$.', 'ギャップは $\\tfrac12(b - \\lambda)^2$ です。'],
          sol: [[`$\\tfrac12(b - \\lambda)^2 = ${n(G)}$ gives $|b - \\lambda| = \\sqrt{${n(2 * G)}} = ${n(Math.sqrt(2 * G))}$.`, `$\\tfrac12(b - \\lambda)^2 = ${n(G)}$ より $|b - \\lambda| = \\sqrt{${n(2 * G)}} = ${n(Math.sqrt(2 * G))}$ です。`], [`$\\lambda = ${n(b)} \\pm ${n(Math.sqrt(2 * G))}$, that is $${n(hi)}$ or $${n(lo)}$: the dual function is symmetric about its peak at $\\lambda = b$, so the gap alone cannot tell which side you are on.`, `$\\lambda = ${n(b)} \\pm ${n(Math.sqrt(2 * G))}$、すなわち $${n(hi)}$ または $${n(lo)}$ です。双対関数は頂点 $\\lambda = b$ について対称なので、ギャップだけではどちら側かは分かりません。`]],
          set: inr === undefined ? { b } : { b, lambda: inr },
        };
      }
      const b = r.pick([-2.5, -1.5, -0.5, 0.5, 1, 2, 3]);
      return {
        q: [`For the inequality version, $\\min\\,x^2 + y^2$ subject to $x + y \\ge ${n(b)}$, the dual is $\\max_{\\lambda \\ge 0}\\,(\\lambda b - \\lambda^2/2)$. What is the optimal multiplier $\\lambda^*$?`, `不等式版 $x + y \\ge ${n(b)}$ のもとの $\\min\\,x^2 + y^2$ の双対は $\\max_{\\lambda \\ge 0}\\,(\\lambda b - \\lambda^2/2)$ です。最適な乗数 $\\lambda^*$ はいくつですか。`],
        a: { type: 'num', v: Math.max(0, b), tol: 1e-9 },
        hint: ['Maximize the parabola, but only over $\\lambda \\ge 0$.', '放物線を最大化しますが、$\\lambda \\ge 0$ の範囲だけで考えます。'],
        sol: [[`Unconstrained, the peak is at $\\lambda = b = ${n(b)}$.`, `制約がなければ頂点は $\\lambda = b = ${n(b)}$ です。`], [b > 0 ? `That is allowed, so $\\lambda^* = ${n(b)}$ and $d^* = ${n(b * b / 2)} = f^*$.` : `That is negative, and a concave parabola restricted to $\\lambda \\ge 0$ peaks at the endpoint: $\\lambda^* = 0$, $d^* = 0 = f^*$.`, b > 0 ? `これは許されるので $\\lambda^* = ${n(b)}$、$d^* = ${n(b * b / 2)} = f^*$ です。` : `これは負で、$\\lambda \\ge 0$ に制限した凹な放物線は端点で最大になります。$\\lambda^* = 0$、$d^* = 0 = f^*$ です。`], ['The sign restriction on the multiplier is what makes an inequality constraint switch off: a zero price means the constraint does not bind.', '乗数の符号制約こそが不等式制約を「無効」にする仕組みです。価格が 0 なら制約は効いていません。']],
        set: { b, lambda: Math.max(0, b) },
      };
    },
  ];
})();
