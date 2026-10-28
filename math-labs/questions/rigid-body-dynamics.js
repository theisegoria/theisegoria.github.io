'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;
  const G = 9.81;

  /* ---------- 1. tennis-racket theorem: the lab's box is 3 x 2 x 0.6 with unit mass ---------- */
  const boxI = (a, b, c, M = 1) => [M * (b * b + c * c) / 12, M * (a * a + c * c) / 12, M * (a * a + b * b) / 12];
  const IB = boxI(3, 2, 0.6);
  // linearised rate about axis j: x > 0 wobble at w*sqrt(x), x < 0 grows at w*sqrt(-x)
  const lin = (I, j) => { const [a, b] = [0, 1, 2].filter((k) => k !== j); return (I[a] - I[j]) * (I[b] - I[j]) / (I[a] * I[b]); };
  const lamB = Math.sqrt(-lin(IB, 1));
  const AX = [['long', '長軸'], ['middle', '中間の軸'], ['short', '短軸']];

  Q['tennis-racket'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.pick([14, 15, 16, 18]), b = r.pick([6, 7, 7.5, 8]), c = r.pick([0.8, 0.9, 1, 1.2]), M = r.pick([0.15, 0.17, 0.2, 0.24]);
        const ax = r.int(0, 2), sides = [a, b, c], names = [['length', '長さ'], ['width', '幅'], ['thickness', '厚さ']];
        const others = sides.filter((_, k) => k !== ax).map((s) => s / 100), I = M * (others[0] ** 2 + others[1] ** 2) / 12;
        return {
          q: [`A phone is roughly a uniform box ${a} cm long, ${b} cm wide and ${c} cm thick, of mass ${M} kg. What is its moment of inertia about the axis through its centre along its ${names[ax][0]}? Give it in kg·m².`, `スマートフォンを長さ ${a} cm、幅 ${b} cm、厚さ ${c} cm、質量 ${M} kg の一様な箱とみなします。中心を通り${names[ax][1]}の方向に沿う軸のまわりの慣性モーメントを kg·m² で求めてください。`],
          a: { type: 'num', v: I, unit: ['kg·m²', 'kg·m²'] },
          hint: ['For a uniform box the moment about an axis uses the two sides perpendicular to it: $M(b^2 + c^2)/12$.', '一様な箱では、軸に垂直な二辺を使って $M(b^2 + c^2)/12$ となります。'],
          sol: [[`The sides perpendicular to the axis are $${n(others[0], 4)}$ m and $${n(others[1], 4)}$ m.`, `軸に垂直な辺は $${n(others[0], 4)}$ m と $${n(others[1], 4)}$ m です。`], [`$I = ${M}\\,(${n(others[0], 4)}^2 + ${n(others[1], 4)}^2)/12 = ${sig(I, 3)}$ kg·m².`, `$I = ${M}\\,(${n(others[0], 4)}^2 + ${n(others[1], 4)}^2)/12 = ${sig(I, 3)}$ kg·m² です。`], [ax === 0 ? 'The long axis has the smallest moment, because the mass lies close to it.' : ax === 2 ? 'The axis through the face has the largest moment, because the mass lies far from it in two directions.' : 'This is the middle moment: the phone tumbles if you toss it spinning about this axis.', ax === 0 ? '長軸のまわりは質量が軸の近くにあるので、慣性モーメントが最小です。' : ax === 2 ? '面を貫く軸のまわりは、質量が二方向に軸から遠いので最大です。' : 'これは中間の慣性モーメントで、この軸のまわりに回して投げるとスマートフォンは宙返りします。']],
        };
      }
      let s; do { s = r.sample([2, 3, 4, 5, 6, 8, 10], 3); } while (new Set(s).size < 3);
      const I = boxI(...s), order = [0, 1, 2].sort((x, y) => I[x] - I[y]), mid = order[1];
      const lab = ['a', 'b', 'c'];
      return {
        q: [`A uniform box has sides $a = ${s[0]}$, $b = ${s[1]}$, $c = ${s[2]}$. Thrown spinning about an axis through its centre along one of its sides, about which axis is the spin unstable?`, `一様な箱の辺が $a = ${s[0]}$、$b = ${s[1]}$、$c = ${s[2]}$ です。中心を通り一つの辺に沿う軸のまわりに回して投げるとき、回転が不安定になるのはどの軸ですか。`],
        a: { type: 'choice', opts: [0, 1, 2].map((k) => [`The axis along side $${lab[k]}$`, `辺 $${lab[k]}$ に沿う軸`]).concat([['None: with no torque every spin is stable', 'どれでもない。トルクがなければどの回転も安定']]), v: mid, fixed: true },
        hint: ['Only the axis with the middle moment of inertia is unstable. The side along the axis does not enter its moment.', '不安定なのは慣性モーメントが中間の軸だけです。軸に沿う辺はその軸の慣性モーメントに入りません。'],
        sol: [[`The moments are $(b^2 + c^2)/12 = ${n(I[0], 3)}$, $(a^2 + c^2)/12 = ${n(I[1], 3)}$ and $(a^2 + b^2)/12 = ${n(I[2], 3)}$ (per unit mass).`, `慣性モーメントは（単位質量あたり）$(b^2 + c^2)/12 = ${n(I[0], 3)}$、$(a^2 + c^2)/12 = ${n(I[1], 3)}$、$(a^2 + b^2)/12 = ${n(I[2], 3)}$ です。`], [`The middle one belongs to the axis along side $${lab[mid]}$, the side of middle length.`, `中間の値は辺 $${lab[mid]}$ に沿う軸のもので、これは長さが中間の辺です。`], ['No torque is needed for the flip: energy and angular momentum are both conserved, and they force the tumbling.', '反転にトルクは要りません。エネルギーと角運動量がどちらも保存されることが、宙返りを強いるのです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let s; do { s = [r.int(3, 12), r.int(2, 9), r.int(1, 4)]; } while (!(s[0] > s[1] && s[1] > s[2]));
        const w = r.pick([2, 3, 4, 5, 6, 8, 10]), I = boxI(...s), lam = w * Math.sqrt(-lin(I, 1));
        return {
          q: [`A uniform box with sides ${s[0]}, ${s[1]} and ${s[2]} (any units) spins at $\\omega = ${w}$ rad/s about the axis along its middle side. At what rate $\\lambda$ does a small wobble grow?`, `辺が ${s[0]}、${s[1]}、${s[2]}（単位は任意）の一様な箱が、中間の長さの辺に沿う軸のまわりに $\\omega = ${w}$ rad/s で回っています。小さなぐらつきはどんな割合 $\\lambda$ で成長しますか。`],
          a: { type: 'num', v: lam, unit: ['s⁻¹', 's⁻¹'] },
          hint: ['Linearise Euler\'s equations: $\\lambda = \\omega\\sqrt{(I_2 - I_1)(I_3 - I_2)/(I_1 I_3)}$ with $I_1 < I_2 < I_3$. The box\'s mass cancels.', 'オイラーの方程式を線形化すると $\\lambda = \\omega\\sqrt{(I_2 - I_1)(I_3 - I_2)/(I_1 I_3)}$（$I_1 < I_2 < I_3$）です。質量は打ち消し合います。'],
          sol: [[`Per unit mass: $I_1 = (${s[1]}^2 + ${s[2]}^2)/12 = ${n(I[0], 4)}$, $I_2 = (${s[0]}^2 + ${s[2]}^2)/12 = ${n(I[1], 4)}$, $I_3 = (${s[0]}^2 + ${s[1]}^2)/12 = ${n(I[2], 4)}$.`, `単位質量あたり $I_1 = (${s[1]}^2 + ${s[2]}^2)/12 = ${n(I[0], 4)}$、$I_2 = (${s[0]}^2 + ${s[2]}^2)/12 = ${n(I[1], 4)}$、$I_3 = (${s[0]}^2 + ${s[1]}^2)/12 = ${n(I[2], 4)}$ です。`], [`$\\lambda = ${w}\\sqrt{(${n(I[1] - I[0], 4)})(${n(I[2] - I[1], 4)})/(${n(I[0] * I[2], 4)})} = ${n(lam, 4)}$ s⁻¹.`, `$\\lambda = ${w}\\sqrt{(${n(I[1] - I[0], 4)})(${n(I[2] - I[1], 4)})/(${n(I[0] * I[2], 4)})} = ${n(lam, 4)}$ s⁻¹ です。`], [`A nudge is multiplied by $e$ every $1/\\lambda = ${n(1 / lam, 3)}$ s, so within a few of those times the box flips over.`, `ずれは $1/\\lambda = ${n(1 / lam, 3)}$ s ごとに $e$ 倍になるので、その数倍の時間で箱は裏返ります。`]],
        };
      }
      if (form === 1) {
        const j = r.pick([0, 2]), x = lin(IB, j), Om = Math.sqrt(x);
        return {
          q: [`In the lab ($I_1 : I_2 : I_3 = ${n(IB[0], 4)} : ${n(IB[1], 4)} : ${n(IB[2], 4)}$, $\\omega = 1$), the box spins about its ${AX[j][0]} axis with a small nudge. What is the period $2\\pi/\\Omega$ of its wobble?`, `この実験の箱（$I_1 : I_2 : I_3 = ${n(IB[0], 4)} : ${n(IB[1], 4)} : ${n(IB[2], 4)}$、$\\omega = 1$）を、わずかなずれを加えて${AX[j][1]}のまわりに回します。ぐらつきの周期 $2\\pi/\\Omega$ はいくつですか。`],
          a: { type: 'num', v: TAU / Om },
          hint: ['About a stable axis $j$ the two other components oscillate at $\\Omega = \\omega\\sqrt{(I_a - I_j)(I_b - I_j)/(I_a I_b)}$.', '安定な軸 $j$ のまわりでは、残り二つの成分が $\\Omega = \\omega\\sqrt{(I_a - I_j)(I_b - I_j)/(I_a I_b)}$ で振動します。'],
          sol: [[`The other two moments are $${n(IB[[0, 1, 2].filter((k) => k !== j)[0]], 4)}$ and $${n(IB[[0, 1, 2].filter((k) => k !== j)[1]], 4)}$; both differences from $I_${j + 1} = ${n(IB[j], 4)}$ have the same sign, so the product is positive.`, `残り二つの慣性モーメントは $${n(IB[[0, 1, 2].filter((k) => k !== j)[0]], 4)}$ と $${n(IB[[0, 1, 2].filter((k) => k !== j)[1]], 4)}$ で、$I_${j + 1} = ${n(IB[j], 4)}$ との差はどちらも同符号なので積は正です。`], [`$\\Omega = \\sqrt{${n(x, 4)}} = ${n(Om, 4)}$, so the period is $2\\pi/${n(Om, 4)} = ${n(TAU / Om, 3)}$.`, `$\\Omega = \\sqrt{${n(x, 4)}} = ${n(Om, 4)}$ なので、周期は $2\\pi/${n(Om, 4)} = ${n(TAU / Om, 3)}$ です。`], ['The readout quotes the same number: a stable axis turns a nudge into a steady oscillation, never into growth.', '読み取り欄にも同じ値が出ます。安定な軸ではずれは一定の振動になるだけで、成長しません。']],
          set: { axis: j },
        };
      }
      const eps = r.pick([0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]), t = Math.log(1 / eps) / lamB;
      return {
        q: [`In the lab ($\\lambda = ${n(lamB, 4)}$ at $\\omega = 1$), the box spins about its middle axis with a nudge $\\varepsilon = ${eps}$. Estimate the time for the nudge to grow to order one, $t \\approx \\ln(1/\\varepsilon)/\\lambda$.`, `この実験（$\\omega = 1$ で $\\lambda = ${n(lamB, 4)}$）で、ずれ $\\varepsilon = ${eps}$ を加えて中間の軸のまわりに回します。ずれが 1 程度まで育つ時間 $t \\approx \\ln(1/\\varepsilon)/\\lambda$ を見積もってください。`],
        a: { type: 'num', v: t, rel: 0.01 },
        hint: ['Exponential growth: $\\varepsilon e^{\\lambda t} \\approx 1$.', '指数関数的な成長なので $\\varepsilon e^{\\lambda t} \\approx 1$ です。'],
        sol: [[`$\\ln(1/${eps}) = ${n(Math.log(1 / eps), 4)}$.`, `$\\ln(1/${eps}) = ${n(Math.log(1 / eps), 4)}$ です。`], [`$t \\approx ${n(Math.log(1 / eps), 4)}/${n(lamB, 4)} = ${n(t, 3)}$.`, `$t \\approx ${n(Math.log(1 / eps), 4)}/${n(lamB, 4)} = ${n(t, 3)}$ です。`], ['The flip time grows only logarithmically as the nudge shrinks: making the throw ten times cleaner buys just $\\ln 10/\\lambda \\approx 4$ more time units, which is why the flip is so hard to avoid.', '反転までの時間は、ずれを小さくしても対数的にしか延びません。投げ方を十倍きれいにしても延びるのは $\\ln 10/\\lambda \\approx 4$ だけで、だから反転は避けにくいのです。']],
        set: { axis: 1, eps, time: 60 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['A thin rectangular plate has sides $a > b$ and ratio $\\rho = a/b$. Spun at rate $\\omega$ about the axis along side $b$ (its middle axis), a wobble grows like $e^{\\lambda t}$. Write $\\lambda/\\omega$ as a function of $\\rho$.', '薄い長方形の板の辺が $a > b$ で、比が $\\rho = a/b$ です。辺 $b$ に沿う軸（中間の軸）のまわりに角速度 $\\omega$ で回すと、ぐらつきは $e^{\\lambda t}$ のように成長します。$\\lambda/\\omega$ を $\\rho$ の関数で表してください。'],
          a: { type: 'expr', v: 'sqrt((rho^2-1)/(rho^2+1))', vars: ['rho'], dom: { rho: [1.1, 4] }, lhs: ['$\\lambda/\\omega =$', '$\\lambda/\\omega =$'] },
          hint: ['For a thin plate $I_1 = Mb^2/12$, $I_2 = Ma^2/12$ and $I_3 = I_1 + I_2$ (perpendicular axes).', '薄い板では $I_1 = Mb^2/12$、$I_2 = Ma^2/12$ で、垂直軸の定理より $I_3 = I_1 + I_2$ です。'],
          sol: [['$I_2 - I_1 = M(a^2 - b^2)/12$ and $I_3 - I_2 = I_1 = Mb^2/12$.', '$I_2 - I_1 = M(a^2 - b^2)/12$、$I_3 - I_2 = I_1 = Mb^2/12$ です。'], ['$\\lambda^2/\\omega^2 = \\dfrac{(I_2 - I_1)(I_3 - I_2)}{I_1 I_3} = \\dfrac{(a^2 - b^2)\\,b^2}{b^2(a^2 + b^2)} = \\dfrac{\\rho^2 - 1}{\\rho^2 + 1}$.', '$\\lambda^2/\\omega^2 = \\dfrac{(I_2 - I_1)(I_3 - I_2)}{I_1 I_3} = \\dfrac{(a^2 - b^2)\\,b^2}{b^2(a^2 + b^2)} = \\dfrac{\\rho^2 - 1}{\\rho^2 + 1}$ です。'], ['A square plate ($\\rho = 1$) has two equal moments and no instability; a long plate approaches $\\lambda = \\omega$, flipping within about one radian of turn.', '正方形の板（$\\rho = 1$）では二つの慣性モーメントが等しく不安定性はありません。細長い板では $\\lambda \\to \\omega$ となり、およそ 1 ラジアン回るうちに裏返ります。']],
        };
      }
      if (form === 1) {
        let w, Lsq, E2, D;
        do { w = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; Lsq = w.reduce((s, x, k) => s + (IB[k] * x) ** 2, 0); E2 = w.reduce((s, x, k) => s + IB[k] * x * x, 0); D = E2 ? Lsq / E2 : 0; } while (!E2 || Math.abs(D - IB[1]) < 0.05 || w.filter((x) => x).length < 2);
        const v = D < IB[1] ? 0 : 1;
        return {
          q: [`The lab's box ($I_1, I_2, I_3 = ${n(IB[0], 4)}, ${n(IB[1], 4)}, ${n(IB[2], 4)}$) starts with body angular velocity $\\boldsymbol\\omega = (${w.join(', ')})$. Which body axis does its angular momentum circle for ever?`, `この実験の箱（$I_1, I_2, I_3 = ${n(IB[0], 4)}, ${n(IB[1], 4)}, ${n(IB[2], 4)}$）が物体座標の角速度 $\\boldsymbol\\omega = (${w.join(', ')})$ で動き始めます。角運動量がいつまでも回り続けるのは、物体のどの軸のまわりですか。`],
          a: { type: 'choice', opts: [['The long axis (smallest moment $I_1$)', '長軸（最小の慣性モーメント $I_1$）'], ['The short axis (largest moment $I_3$)', '短軸（最大の慣性モーメント $I_3$）'], ['The middle axis, which it never leaves', '中間の軸（そこから離れない）']], v, fixed: true },
          hint: ['Compare $L^2/2E$ with $I_2$: the separatrix is the energy $L^2/2I_2$.', '$L^2/2E$ と $I_2$ を比べてください。セパラトリクスはエネルギー $L^2/2I_2$ の等高線です。'],
          sol: [[`$L^2 = \\sum (I_k\\omega_k)^2 = ${n(Lsq, 4)}$ and $2E = \\sum I_k\\omega_k^2 = ${n(E2, 4)}$, so $L^2/2E = ${n(D, 4)}$.`, `$L^2 = \\sum (I_k\\omega_k)^2 = ${n(Lsq, 4)}$、$2E = \\sum I_k\\omega_k^2 = ${n(E2, 4)}$ なので $L^2/2E = ${n(D, 4)}$ です。`], [`This is ${v === 0 ? 'less' : 'more'} than $I_2 = ${n(IB[1], 4)}$: for its size of $L$ the body has ${v === 0 ? 'more' : 'less'} energy than on the separatrix.`, `これは $I_2 = ${n(IB[1], 4)}$ より${v === 0 ? '小さい' : '大きい'}ので、この大きさの $L$ に対してエネルギーはセパラトリクスより${v === 0 ? '大きく' : '小さく'}なっています。`], [`Energy and $|\\mathbf L|$ are conserved, so the polhode is a closed loop round the ${v === 0 ? 'long' : 'short'} axis, and the motion can never cross the separatrix to the other side.`, `エネルギーと $|\\mathbf L|$ が保存されるので、ポールホードは${v === 0 ? '長軸' : '短軸'}を囲む閉曲線で、運動がセパラトリクスを越えて反対側へ行くことはありません。`]],
        };
      }
      let T, eps; do { T = r.pick([5, 6, 7, 8, 9, 10, 11, 12]); eps = Math.exp(-lamB * T); } while (eps < 0.001);
      const e3 = Math.round(eps * 1000) / 1000;
      return {
        q: [`In the lab ($\\lambda = ${n(lamB, 4)}$ at $\\omega = 1$), what nudge $\\varepsilon$ about the middle axis makes the growth $\\varepsilon e^{\\lambda t}$ reach 1 at $t = ${T}$?`, `この実験（$\\omega = 1$ で $\\lambda = ${n(lamB, 4)}$）で、中間の軸のまわりの成長 $\\varepsilon e^{\\lambda t}$ が $t = ${T}$ でちょうど 1 になるずれ $\\varepsilon$ はいくつですか。`],
        a: { type: 'num', v: eps, rel: 0.01 },
        hint: ['Solve $\\varepsilon e^{\\lambda T} = 1$ for $\\varepsilon$.', '$\\varepsilon e^{\\lambda T} = 1$ を $\\varepsilon$ について解いてください。'],
        sol: [[`$\\varepsilon = e^{-\\lambda T} = e^{-${n(lamB, 4)}\\times ${T}} = e^{-${n(lamB * T, 4)}}$.`, `$\\varepsilon = e^{-\\lambda T} = e^{-${n(lamB, 4)}\\times ${T}} = e^{-${n(lamB * T, 4)}}$ です。`], [`$\\varepsilon = ${sig(eps, 3)}$.`, `$\\varepsilon = ${sig(eps, 3)}$ です。`], ['Show it in the figure: the first flip of $\\omega_2$ comes a little after this estimate, because order one is reached before the sign actually changes and the nudge is shared between two components.', '図で確かめてください。$\\omega_2$ の最初の反転はこの見積もりより少し後に来ます。1 程度に育ってから符号が変わるまで時間がかかり、ずれも二つの成分に分かれているからです。']],
        set: { axis: 1, eps: Math.max(0.001, e3), time: 60 },
      };
    },
  ];

  /* ---------- 2. heavy top: the lab uses I1 = 1, I3 = 0.8, mgl = 4 ---------- */
  const I1 = 1, I3 = 0.8, MGL = 4;
  const slow = (w, th) => { const b = I3 * w, d = b * b - 4 * I1 * MGL * Math.cos(th); return d < 0 ? null : 2 * MGL / (b + Math.sqrt(d)); };
  Q.gyroscope = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w = r.step(8, 30, 0.5), Om = MGL / (I3 * w);
        return {
          q: [`In the lab ($I_3 = 0.8$, $mgl = 4$) the wheel spins at $\\omega_3 = ${n(w)}$. Use the fast-top formula to estimate the precession rate $\\Omega$.`, `この実験（$I_3 = 0.8$、$mgl = 4$）で車輪が $\\omega_3 = ${n(w)}$ で回っています。速いこまの公式で歳差の角速度 $\\Omega$ を見積もってください。`],
          a: { type: 'num', v: Om },
          hint: ['Gravity\'s torque $mgl\\sin\\theta$ turns $\\mathbf L$, of size $I_3\\omega_3$, sideways at rate $\\Omega$: $mgl\\sin\\theta = \\Omega\\, I_3\\omega_3\\sin\\theta$.', '重力のトルク $mgl\\sin\\theta$ が大きさ $I_3\\omega_3$ の $\\mathbf L$ を横向きに $\\Omega$ で回します。$mgl\\sin\\theta = \\Omega\\, I_3\\omega_3\\sin\\theta$ です。'],
          sol: [[`$\\Omega \\approx \\dfrac{mgl}{I_3\\omega_3} = \\dfrac{4}{0.8\\times ${n(w)}} = ${n(Om, 4)}$.`, `$\\Omega \\approx \\dfrac{mgl}{I_3\\omega_3} = \\dfrac{4}{0.8\\times ${n(w)}} = ${n(Om, 4)}$ です。`], ['The tilt cancels: a fast top precesses at the same rate whatever its angle, and the readout\'s mean rate approaches this value as the spin grows.', '傾きは打ち消し合います。速いこまはどの角度でも同じ割合で歳差し、自転が速いほど読み取り欄の平均値はこの値に近づきます。']],
          set: { spin: w, start: 1 },
        };
      }
      if (form === 1) {
        const m = r.pick([0.1, 0.12, 0.15, 0.2]), R = r.pick([2.5, 3, 3.5, 4]), l = r.pick([3, 4, 5]), rpm = r.pick([3000, 4000, 5000, 6000]);
        const I = 0.5 * m * (R / 100) ** 2, w = rpm * TAU / 60, Om = m * G * (l / 100) / (I * w), Tp = TAU / Om;
        return {
          q: [`A toy gyroscope's rotor is a uniform disc of mass ${m} kg and radius ${R} cm, spinning at ${rpm} rpm, with its centre ${l} cm from the pivot. Estimate the time for one full precession, in seconds ($g = 9.81$ m/s²).`, `おもちゃのジャイロの回転子は質量 ${m} kg、半径 ${R} cm の一様な円板で、${rpm} rpm で回り、その中心は支点から ${l} cm 離れています。歳差の一周にかかる時間を秒で見積もってください（$g = 9.81$ m/s²）。`],
          a: { type: 'num', v: Tp, unit: ['s', '秒'] },
          hint: ['Use $\\Omega = mgl/(I_3\\omega_3)$ with $I_3 = \\tfrac12 mR^2$ and $\\omega_3$ in rad/s.', '$I_3 = \\tfrac12 mR^2$、$\\omega_3$ を rad/s にして $\\Omega = mgl/(I_3\\omega_3)$ を使ってください。'],
          sol: [[`$I_3 = \\tfrac12 \\times ${m}\\times ${n(R / 100)}^2 = ${sig(I, 3)}$ kg·m², and $\\omega_3 = ${rpm}\\times 2\\pi/60 = ${n(w, 1)}$ rad/s.`, `$I_3 = \\tfrac12 \\times ${m}\\times ${n(R / 100)}^2 = ${sig(I, 3)}$ kg·m²、$\\omega_3 = ${rpm}\\times 2\\pi/60 = ${n(w, 1)}$ rad/s です。`], [`$\\Omega = \\dfrac{${m}\\times 9.81\\times ${n(l / 100)}}{${sig(I, 3)}\\times ${n(w, 1)}} = ${sig(Om, 3)}$ rad/s.`, `$\\Omega = \\dfrac{${m}\\times 9.81\\times ${n(l / 100)}}{${sig(I, 3)}\\times ${n(w, 1)}} = ${sig(Om, 3)}$ rad/s です。`], [`One revolution takes $2\\pi/\\Omega = ${sig(Tp, 3)}$ s: slow and stately, because the spin angular momentum is large compared with the torque.`, `一周には $2\\pi/\\Omega = ${sig(Tp, 3)}$ 秒かかります。トルクに比べて自転の角運動量が大きいので、ゆっくりと堂々と回ります。`]],
        };
      }
      const k = r.pick([2, 3, 0.5]);
      const ans = k === 2 ? 0 : k === 3 ? 1 : 2;
      const opts = [['It halves', '半分になる'], ['It falls to a third', '三分の一になる'], ['It doubles', '二倍になる'], ['It does not change', '変わらない'], ['It grows by the same factor', '同じ倍率で増える']];
      const pick = k === 2 ? [0, 2, 3] : k === 3 ? [1, 4, 3] : [2, 0, 3];
      return {
        q: [`A fast gyroscope precesses steadily. If its spin $\\omega_3$ is multiplied by ${k === 0.5 ? '$\\tfrac12$' : k}, what happens to the precession rate?`, `速いジャイロが一定の割合で歳差しています。自転 $\\omega_3$ を ${k === 0.5 ? '$\\tfrac12$' : k} 倍にすると、歳差の角速度はどうなりますか。`],
        a: { type: 'choice', opts: pick.map((i) => opts[i]), v: 0 },
        hint: ['$\\Omega \\approx mgl/(I_3\\omega_3)$: the same torque turns a bigger angular momentum more slowly.', '$\\Omega \\approx mgl/(I_3\\omega_3)$ です。同じトルクなら、大きな角運動量ほどゆっくり向きを変えます。'],
        sol: [['The torque $mgl\\sin\\theta$ does not depend on the spin; it must equal the rate of turning of $\\mathbf L$, which is $\\Omega I_3\\omega_3\\sin\\theta$.', 'トルク $mgl\\sin\\theta$ は自転によりません。それが $\\mathbf L$ の向きの変化率 $\\Omega I_3\\omega_3\\sin\\theta$ と等しくなければなりません。'], [`So $\\Omega \\propto 1/\\omega_3$, and multiplying $\\omega_3$ by ${k === 0.5 ? '$\\tfrac12$' : k} multiplies $\\Omega$ by ${k === 0.5 ? '2' : `$\\tfrac1${k}$`}. This is why a spinning-down top precesses faster and faster before it falls.`, `よって $\\Omega \\propto 1/\\omega_3$ で、$\\omega_3$ を ${k === 0.5 ? '$\\tfrac12$' : k} 倍にすると $\\Omega$ は ${k === 0.5 ? '2' : `$\\tfrac1${k}$`} 倍になります。回転が落ちてきたこまが倒れる前にどんどん速く歳差するのはこのためです。`]],
        set: { spin: k === 0.5 ? 20 : 10, start: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let w, tilt, Om;
        do { w = r.step(6, 20, 0.5); tilt = r.step(20, 85, 5); Om = slow(w, rad(tilt)); } while (Om === null);
        const fast = MGL / (I3 * w);
        return {
          q: [`In the lab ($I_1 = 1$, $I_3 = 0.8$, $mgl = 4$), find the exact slow steady precession rate at spin $\\omega_3 = ${n(w)}$ and tilt $\\theta = ${tilt}^\\circ$. Give four decimals.`, `この実験（$I_1 = 1$、$I_3 = 0.8$、$mgl = 4$）で、自転 $\\omega_3 = ${n(w)}$、傾き $\\theta = ${tilt}^\\circ$ のときの遅い定常歳差の厳密な角速度を求めてください（小数第4位まで）。`],
          a: { type: 'num', v: Om, tol: 6e-5 },
          hint: ['Steady precession ($\\ddot\\theta = 0$) needs $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$; take the smaller root.', '定常歳差（$\\ddot\\theta = 0$）には $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$ が必要です。小さいほうの根をとります。'],
          sol: [[`$b = I_3\\omega_3 = ${n(I3 * w)}$ and $b^2 - 4I_1 mgl\\cos\\theta = ${n((I3 * w) ** 2 - 16 * Math.cos(rad(tilt)), 4)}$.`, `$b = I_3\\omega_3 = ${n(I3 * w)}$、$b^2 - 4I_1 mgl\\cos\\theta = ${n((I3 * w) ** 2 - 16 * Math.cos(rad(tilt)), 4)}$ です。`], [`$\\Omega = \\dfrac{2\\,mgl}{b + \\sqrt{b^2 - 4I_1 mgl\\cos\\theta}} = ${n(Om, 5)}$ (the stable form of the smaller root).`, `$\\Omega = \\dfrac{2\\,mgl}{b + \\sqrt{b^2 - 4I_1 mgl\\cos\\theta}} = ${n(Om, 5)}$ です（小さい根を桁落ちしない形で書いたもの）。`], [`The fast-top estimate $mgl/(I_3\\omega_3) = ${n(fast, 4)}$ is ${Math.abs(Om / fast - 1) < 0.01 ? 'within 1%' : `${n(100 * (Om / fast - 1), 2)}% off`}: the correction comes from the wheel's own precession angular momentum, which grows with $\\Omega$.`, `速いこまの近似 $mgl/(I_3\\omega_3) = ${n(fast, 4)}$ との差は ${Math.abs(Om / fast - 1) < 0.01 ? '1% 未満' : `${n(100 * (Om / fast - 1), 2)}%`}です。補正は歳差そのものがもつ角運動量から来るもので、$\\Omega$ とともに大きくなります。`]],
          set: { spin: w, tilt, start: 1 },
        };
      }
      if (form === 1) {
        const m = r.pick([1.5, 2, 2.5, 3]), R = r.pick([0.3, 0.32, 0.34]), l = r.pick([0.1, 0.15, 0.2]), f = r.pick([3, 4, 5, 6]);
        const I = m * R * R, w = TAU * f, Om = m * G * l / (I * w);
        return {
          q: [`A bicycle wheel (mass ${m} kg, almost all in a rim of radius ${R} m) spins at ${f} revolutions per second on an axle held horizontally by one end, ${l} m from the wheel. How fast does it precess, in rad/s?`, `自転車の車輪（質量 ${m} kg、ほぼすべてが半径 ${R} m のリムにあります）が毎秒 ${f} 回転で回っています。車輪から ${l} m 離れた車軸の一端を持って軸を水平に保つと、歳差の角速度は何 rad/s ですか。`],
          a: { type: 'num', v: Om, unit: ['rad/s', 'rad/s'] },
          hint: ['A rim has $I_3 = mR^2$. With the axle horizontal, $\\Omega = mgl/(I_3\\omega_3)$ is exact for steady precession.', 'リムでは $I_3 = mR^2$ です。軸が水平なら、定常歳差では $\\Omega = mgl/(I_3\\omega_3)$ が厳密に成り立ちます。'],
          sol: [[`$I_3 = ${m}\\times ${R}^2 = ${n(I, 4)}$ kg·m² and $\\omega_3 = 2\\pi\\times ${f} = ${n(w, 2)}$ rad/s, so $L = ${n(I * w, 3)}$ kg·m²/s.`, `$I_3 = ${m}\\times ${R}^2 = ${n(I, 4)}$ kg·m²、$\\omega_3 = 2\\pi\\times ${f} = ${n(w, 2)}$ rad/s なので $L = ${n(I * w, 3)}$ kg·m²/s です。`], [`The torque is $mgl = ${m}\\times 9.81\\times ${l} = ${n(m * G * l, 3)}$ N·m, so $\\Omega = ${n(m * G * l, 3)}/${n(I * w, 3)} = ${n(Om, 3)}$ rad/s.`, `トルクは $mgl = ${m}\\times 9.81\\times ${l} = ${n(m * G * l, 3)}$ N·m なので、$\\Omega = ${n(m * G * l, 3)}/${n(I * w, 3)} = ${n(Om, 3)}$ rad/s です。`], [`One turn takes $${n(TAU / Om, 2)}$ s. The wheel does not fall; it swings round, which is the classic lecture demonstration.`, `一周には $${n(TAU / Om, 2)}$ 秒かかります。車輪は落ちずに横へ回り込みます。講義でおなじみの実演です。`]],
        };
      }
      const w = r.step(8, 22, 0.5), N = (I3 * w) ** 2 / (I1 * MGL), Tp = TAU * I3 * w / MGL;
      return {
        q: [`In the lab, released from rest at spin $\\omega_3 = ${n(w)}$, the tip nods at the nutation frequency $\\approx I_3\\omega_3/I_1$ while it precesses at $\\approx mgl/(I_3\\omega_3)$. About how many cusps does it draw in one full precession?`, `この実験で自転 $\\omega_3 = ${n(w)}$ の車輪を静止から放すと、先端は章動の角振動数 $\\approx I_3\\omega_3/I_1$ でうなずきながら、$\\approx mgl/(I_3\\omega_3)$ で歳差します。歳差の一周のあいだにカスプはおよそいくつ描かれますか。`],
        a: { type: 'num', v: N, rel: 0.05 },
        hint: ['Divide the nutation frequency by the precession rate.', '章動の角振動数を歳差の角速度で割ってください。'],
        sol: [[`Nutation: $I_3\\omega_3/I_1 = ${n(I3 * w, 3)}$. Precession: $mgl/(I_3\\omega_3) = ${n(MGL / (I3 * w), 4)}$.`, `章動は $I_3\\omega_3/I_1 = ${n(I3 * w, 3)}$、歳差は $mgl/(I_3\\omega_3) = ${n(MGL / (I3 * w), 4)}$ です。`], [`The ratio is $(I_3\\omega_3)^2/(I_1 mgl) = ${n(N, 3)}$ cusps per revolution.`, `比は $(I_3\\omega_3)^2/(I_1 mgl) = ${n(N, 3)}$ で、これが一周あたりのカスプの数です。`], ['It grows as the square of the spin: a fast top nods so quickly and so slightly that the cusps blur into what looks like smooth precession.', 'これは自転の二乗で増えます。速いこまはとても速く小さくうなずくので、カスプがぼやけて滑らかな歳差に見えるのです。']],
        set: { spin: w, start: 0, tilt: 60, time: Math.min(30, Math.ceil(2 * (Tp + 0.3)) / 2) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const tilt = r.step(20, 85, 5), wmin = 2 * Math.sqrt(I1 * MGL * Math.cos(rad(tilt))) / I3;
        return {
          q: [`In the lab ($I_1 = 1$, $I_3 = 0.8$, $mgl = 4$), what is the smallest spin $\\omega_3$ for which steady precession is possible at tilt $\\theta = ${tilt}^\\circ$?`, `この実験（$I_1 = 1$、$I_3 = 0.8$、$mgl = 4$）で、傾き $\\theta = ${tilt}^\\circ$ の定常歳差が可能になる最小の自転 $\\omega_3$ はいくつですか。`],
          a: { type: 'num', v: wmin, tol: 0.003 },
          hint: ['The steady-precession quadratic $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$ needs a real root.', '定常歳差の二次方程式 $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$ が実数解をもつ必要があります。'],
          sol: [['A real root needs $(I_3\\omega_3)^2 \\ge 4 I_1\\, mgl\\cos\\theta$.', '実数解には $(I_3\\omega_3)^2 \\ge 4 I_1\\, mgl\\cos\\theta$ が必要です。'], [`$\\omega_3 \\ge \\dfrac{2\\sqrt{I_1\\,mgl\\cos\\theta}}{I_3} = \\dfrac{2\\sqrt{4\\cos ${tilt}^\\circ}}{0.8} = ${n(wmin, 4)}$.`, `$\\omega_3 \\ge \\dfrac{2\\sqrt{I_1\\,mgl\\cos\\theta}}{I_3} = \\dfrac{2\\sqrt{4\\cos ${tilt}^\\circ}}{0.8} = ${n(wmin, 4)}$ です。`], ['Below this spin the lab reports that no steady precession exists and releases the wheel from rest instead. Tilted below the horizontal ($\\theta > 90^\\circ$) any spin will do.', 'この自転より遅いと、実験は定常歳差が存在しないと表示し、代わりに静止から放します。水平より下に傾けた場合（$\\theta > 90^\\circ$）はどんな自転でもかまいません。']],
          set: { tilt, spin: Math.max(4, Math.ceil(wmin * 2) / 2), start: 1 },
        };
      }
      if (form === 1) {
        return {
          q: ['With the axle exactly horizontal ($\\theta = 90^\\circ$), how good is the steady precession rate $\\Omega = mgl/(I_3\\omega_3)$?', '軸がちょうど水平（$\\theta = 90^\\circ$）のとき、定常歳差の角速度 $\\Omega = mgl/(I_3\\omega_3)$ はどの程度正確ですか。'],
          a: { type: 'choice', opts: [['Exact at any spin: the $\\cos\\theta$ term vanishes', 'どんな自転でも厳密に正しい。$\\cos\\theta$ の項が消えるから'], ['Only approximate, valid for a fast top', '近似にすぎず、速いこまでだけ成り立つ'], ['Wrong: a horizontal axle cannot precess steadily', '誤り。水平な軸は定常歳差できない'], ['Exact, but only if the wheel is a thin ring', '車輪が細いリングのときだけ厳密']], v: 0, fixed: true },
          hint: ['Put $\\theta = 90^\\circ$ into $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$.', '$I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$ に $\\theta = 90^\\circ$ を代入してください。'],
          sol: [['At $\\theta = 90^\\circ$ the quadratic loses its $\\Omega^2$ term and becomes linear: $I_3\\omega_3\\Omega = mgl$.', '$\\theta = 90^\\circ$ では $\\Omega^2$ の項が消えて一次方程式 $I_3\\omega_3\\Omega = mgl$ になります。'], ['So $\\Omega = mgl/(I_3\\omega_3)$ exactly, for any spin and any wheel shape; the other root has gone off to infinity. At other tilts the formula is only the slow root\'s fast-top limit.', 'よって自転の速さにも車輪の形にもよらず $\\Omega = mgl/(I_3\\omega_3)$ が厳密に成り立ち、もう一方の根は無限大へ去っています。他の傾きでは、この式は遅い根の速いこまの極限にすぎません。']],
          set: { tilt: 90, start: 1 },
        };
      }
      let w, tilt, d;
      do { w = r.step(6, 20, 0.5); tilt = r.step(20, 80, 5); d = (I3 * w) ** 2 - 4 * MGL * Math.cos(rad(tilt)); } while (d < 0);
      const c = Math.cos(rad(tilt)), fastR = (I3 * w + Math.sqrt(d)) / (2 * I1 * c), slowR = slow(w, rad(tilt));
      return {
        q: [`In the lab ($I_1 = 1$, $I_3 = 0.8$, $mgl = 4$) at $\\omega_3 = ${n(w)}$ and $\\theta = ${tilt}^\\circ$, steady precession has a second, fast solution. Find its rate.`, `この実験（$I_1 = 1$、$I_3 = 0.8$、$mgl = 4$）で $\\omega_3 = ${n(w)}$、$\\theta = ${tilt}^\\circ$ のとき、定常歳差にはもう一つの速い解があります。その角速度を求めてください。`],
        a: { type: 'num', v: fastR, rel: 0.002 },
        hint: ['It is the larger root of $I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$; the product of the roots is $mgl/(I_1\\cos\\theta)$.', '$I_1\\cos\\theta\\,\\Omega^2 - I_3\\omega_3\\Omega + mgl = 0$ の大きいほうの根です。根の積は $mgl/(I_1\\cos\\theta)$ です。'],
        sol: [[`$\\Omega_\\pm = \\dfrac{I_3\\omega_3 \\pm \\sqrt{(I_3\\omega_3)^2 - 4I_1\\,mgl\\cos\\theta}}{2I_1\\cos\\theta}$ with $I_3\\omega_3 = ${n(I3 * w)}$, $\\cos\\theta = ${n(c, 4)}$.`, `$\\Omega_\\pm = \\dfrac{I_3\\omega_3 \\pm \\sqrt{(I_3\\omega_3)^2 - 4I_1\\,mgl\\cos\\theta}}{2I_1\\cos\\theta}$ で、$I_3\\omega_3 = ${n(I3 * w)}$、$\\cos\\theta = ${n(c, 4)}$ です。`], [`$\\Omega_+ = ${n(fastR, 4)}$; check: $\\Omega_+\\Omega_- = ${n(fastR, 4)}\\times ${n(slowR, 4)} = ${n(fastR * slowR, 4)} = mgl/(I_1\\cos\\theta)$.`, `$\\Omega_+ = ${n(fastR, 4)}$ です。確認：$\\Omega_+\\Omega_- = ${n(fastR, 4)}\\times ${n(slowR, 4)} = ${n(fastR * slowR, 4)} = mgl/(I_1\\cos\\theta)$。`], ['The fast root is close to $I_3\\omega_3/(I_1\\cos\\theta)$, the nutation frequency: there the precession itself carries the angular momentum, and gravity hardly matters. Setting a top going that fast sideways takes a hard push, so the slow root is the one seen.', '速い根は章動の角振動数に近い $I_3\\omega_3/(I_1\\cos\\theta)$ のあたりにあります。そこでは歳差そのものが角運動量を担い、重力はほとんど効きません。こまをそれほど速く横に回すには強く押す必要があるので、ふだん見えるのは遅い根です。']],
      };
    },
  ];

  /* ---------- 3. inertia tensor of point masses in a plane ---------- */
  function masses(r, k = 3) {
    const out = [];
    while (out.length < k) {
      const p = [r.step(-2, 2, 0.5), r.step(-2, 2, 0.5), r.pick([1, 1, 2, 3, 0.5])];
      if ((p[0] || p[1]) && !out.some((q) => q[0] === p[0] && q[1] === p[1])) out.push(p);
    }
    return out;
  }
  const tensor = (ms) => { let xx = 0, yy = 0, xy = 0; ms.forEach(([x, y, m]) => { xx += m * y * y; yy += m * x * x; xy -= m * x * y; }); return { xx, yy, xy }; };
  const Itheta = (I, a) => I.xx * Math.cos(a) ** 2 + I.yy * Math.sin(a) ** 2 + 2 * I.xy * Math.sin(a) * Math.cos(a);
  const list = (ms) => ms.map(([x, y, m]) => `mass $${n(m)}$ at $(${n(x)}, ${n(y)})$`).join(', ');
  const listJ = (ms) => ms.map(([x, y, m]) => `$(${n(x)}, ${n(y)})$ に質量 $${n(m)}$`).join('、');

  Q['inertia-tensor'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const ms = masses(r), I = tensor(ms), ax = r.int(0, 1), v = ax ? I.yy : I.xx;
        return {
          q: [`Point masses ${list(ms)} lie in the plane. What is their moment of inertia about the ${ax ? 'y' : 'x'}-axis?`, `平面上に質点が ${listJ(ms)} あります。${ax ? 'y' : 'x'} 軸のまわりの慣性モーメントはいくつですか。`],
          a: { type: 'num', v },
          hint: [`The distance of $(x, y)$ from the ${ax ? 'y' : 'x'}-axis is $|${ax ? 'x' : 'y'}|$.`, `点 $(x, y)$ から ${ax ? 'y' : 'x'} 軸までの距離は $|${ax ? 'x' : 'y'}|$ です。`],
          sol: [[`$I = \\sum m\\,${ax ? 'x' : 'y'}^2 = ${ms.map(([x, y, m]) => `${n(m)}\\cdot ${n((ax ? x : y) ** 2)}`).join(' + ')} = ${n(v)}$.`, `$I = \\sum m\\,${ax ? 'x' : 'y'}^2 = ${ms.map(([x, y, m]) => `${n(m)}\\cdot ${n((ax ? x : y) ** 2)}`).join(' + ')} = ${n(v)}$ です。`], ['Only the perpendicular distance to the axis counts; sliding a mass along the axis changes nothing.', '軸までの垂直距離だけが効きます。質点を軸に沿って動かしても何も変わりません。']],
        };
      }
      if (form === 1) {
        const a = r.int(2, 12), b = r.int(1, 10);
        return {
          q: [`A flat plate in the $xy$-plane has $I_{xx} = ${a}$ and $I_{yy} = ${b}$ (kg·m²). What is its moment about the $z$-axis, through the same origin and perpendicular to the plate?`, `$xy$ 平面上の平らな板の $I_{xx} = ${a}$、$I_{yy} = ${b}$（kg·m²）です。同じ原点を通り板に垂直な $z$ 軸のまわりの慣性モーメントはいくつですか。`],
          a: { type: 'num', v: a + b, unit: ['kg·m²', 'kg·m²'] },
          hint: ['Each mass is at distance $\\sqrt{x^2 + y^2}$ from the $z$-axis.', '各質点は $z$ 軸から距離 $\\sqrt{x^2 + y^2}$ にあります。'],
          sol: [['$I_z = \\sum m(x^2 + y^2) = \\sum m y^2 + \\sum m x^2 = I_{xx} + I_{yy}$.', '$I_z = \\sum m(x^2 + y^2) = \\sum m y^2 + \\sum m x^2 = I_{xx} + I_{yy}$ です。'], [`$I_z = ${a} + ${b} = ${a + b}$ kg·m². This perpendicular-axis rule needs a flat body: a thick one has mass off the plane, which adds to $I_{xx}$ and $I_{yy}$ but not to $I_z$.`, `$I_z = ${a} + ${b} = ${a + b}$ kg·m² です。この垂直軸の定理は平らな物体でしか使えません。厚みがあると面の外の質量が $I_{xx}$ と $I_{yy}$ には加わりますが、$I_z$ には加わらないからです。`]],
        };
      }
      const M = r.pick([2, 3, 4, 5]), Icm = r.pick([0.5, 1.2, 2, 3.5]), d = r.pick([0.5, 1, 1.5, 2]);
      return {
        q: [`A body of mass ${M} kg has moment $${Icm}$ kg·m² about an axis through its centre of mass. What is its moment about a parallel axis ${d} m away?`, `質量 ${M} kg の物体の、重心を通る軸のまわりの慣性モーメントは $${Icm}$ kg·m² です。そこから ${d} m 離れた平行な軸のまわりの慣性モーメントはいくつですか。`],
        a: { type: 'num', v: Icm + M * d * d, unit: ['kg·m²', 'kg·m²'] },
        hint: ['Parallel-axis theorem: $I = I_{\\rm cm} + Md^2$.', '平行軸の定理：$I = I_{\\rm cm} + Md^2$ です。'],
        sol: [[`$I = ${Icm} + ${M}\\times ${d}^2 = ${n(Icm + M * d * d)}$ kg·m².`, `$I = ${Icm} + ${M}\\times ${d}^2 = ${n(Icm + M * d * d)}$ kg·m² です。`], ['The cross term vanishes because the centre of mass is where the first moment $\\sum m\\mathbf r$ is zero, so the centre of mass always gives the smallest moment among parallel axes.', '重心では一次モーメント $\\sum m\\mathbf r$ が 0 なので交差項が消えます。だから平行な軸のなかで重心を通る軸の慣性モーメントがいつも最小です。']],
        set: { about: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const xx = r.int(2, 9), yy = r.int(2, 9), xy = r.nz(-3, 3), th = r.pick([30, 45, 60, 120, 135, 150, 20, 75]);
        const I = { xx, yy, xy }, v = Itheta(I, rad(th));
        return {
          q: [`A plane body has $I_{xx} = ${xx}$, $I_{yy} = ${yy}$, $I_{xy} = ${xy}$ about a point. Find its moment about the axis through that point at angle $\\theta = ${th}^\\circ$ to the $x$-axis. Give three decimals.`, `平面の物体のある点まわりの値が $I_{xx} = ${xx}$、$I_{yy} = ${yy}$、$I_{xy} = ${xy}$ です。その点を通り $x$ 軸と角 $\\theta = ${th}^\\circ$ をなす軸のまわりの慣性モーメントを求めてください（小数第3位まで）。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['$I(\\theta) = \\mathbf u^{\\mathsf T}\\mathbf I\\,\\mathbf u$ with $\\mathbf u = (\\cos\\theta, \\sin\\theta)$.', '$\\mathbf u = (\\cos\\theta, \\sin\\theta)$ として $I(\\theta) = \\mathbf u^{\\mathsf T}\\mathbf I\\,\\mathbf u$ です。'],
          sol: [[`$I(\\theta) = I_{xx}\\cos^2\\theta + I_{yy}\\sin^2\\theta + 2I_{xy}\\sin\\theta\\cos\\theta$.`, `$I(\\theta) = I_{xx}\\cos^2\\theta + I_{yy}\\sin^2\\theta + 2I_{xy}\\sin\\theta\\cos\\theta$ です。`], [`$= ${xx}(${n(Math.cos(rad(th)) ** 2, 4)}) + ${yy}(${n(Math.sin(rad(th)) ** 2, 4)}) + 2(${xy})(${n(Math.sin(rad(th)) * Math.cos(rad(th)), 4)}) = ${n(v, 4)}$.`, `$= ${xx}(${n(Math.cos(rad(th)) ** 2, 4)}) + ${yy}(${n(Math.sin(rad(th)) ** 2, 4)}) + 2(${xy})(${n(Math.sin(rad(th)) * Math.cos(rad(th)), 4)}) = ${n(v, 4)}$ です。`], ['Three numbers fix the moment about every axis in the plane: that is what it means for inertia to be a tensor.', '三つの数で平面内のあらゆる軸のまわりの慣性モーメントが決まります。これが慣性がテンソルであるということです。']],
          set: { angle: th },
        };
      }
      if (form === 1) {
        const xx = r.int(2, 10), yy = r.int(2, 10), xy = r.int(-4, 4);
        const m = (xx + yy) / 2, rr = Math.hypot((xx - yy) / 2, xy);
        return {
          q: [`A plane body has $I_{xx} = ${xx}$, $I_{yy} = ${yy}$, $I_{xy} = ${xy}$. Find its principal moments $I_{\\max} \\ge I_{\\min}$.`, `平面の物体の値が $I_{xx} = ${xx}$、$I_{yy} = ${yy}$、$I_{xy} = ${xy}$ です。主慣性モーメント $I_{\\max} \\ge I_{\\min}$ を求めてください。`],
          a: { type: 'tuple', v: [m + rr, m - rr], labels: ['$I_{\\max}$', '$I_{\\min}$'], tol: 0.002 },
          hint: ['They are the eigenvalues of the symmetric matrix $\\begin{pmatrix} I_{xx} & I_{xy} \\\\ I_{xy} & I_{yy}\\end{pmatrix}$.', '対称行列 $\\begin{pmatrix} I_{xx} & I_{xy} \\\\ I_{xy} & I_{yy}\\end{pmatrix}$ の固有値です。'],
          sol: [[`Mean $\\tfrac12(I_{xx} + I_{yy}) = ${n(m)}$, radius $\\sqrt{(\\tfrac12(I_{xx} - I_{yy}))^2 + I_{xy}^2} = ${n(rr, 4)}$.`, `平均 $\\tfrac12(I_{xx} + I_{yy}) = ${n(m)}$、半径 $\\sqrt{(\\tfrac12(I_{xx} - I_{yy}))^2 + I_{xy}^2} = ${n(rr, 4)}$ です。`], [`$I_{\\max} = ${n(m + rr, 4)}$, $I_{\\min} = ${n(m - rr, 4)}$.`, `$I_{\\max} = ${n(m + rr, 4)}$、$I_{\\min} = ${n(m - rr, 4)}$ です。`], [xy === 0 ? 'With $I_{xy} = 0$ the coordinate axes are already principal.' : 'Their sum equals $I_{xx} + I_{yy}$, the trace, which is the same in every rotated frame.', xy === 0 ? '$I_{xy} = 0$ なので、座標軸がすでに主軸です。' : 'その和はどの回転した座標系でも変わらない跡 $I_{xx} + I_{yy}$ に等しくなります。']],
        };
      }
      const ms = masses(r), I = tensor(ms);
      return {
        q: [`Point masses ${list(ms)}. Find the product of inertia $I_{xy} = -\\sum m\\,xy$ about the origin.`, `質点が ${listJ(ms)} あります。原点まわりの慣性乗積 $I_{xy} = -\\sum m\\,xy$ を求めてください。`],
        a: { type: 'num', v: I.xy },
        hint: ['Masses in the first and third quadrants make $I_{xy}$ negative; those in the second and fourth make it positive.', '第1・第3象限の質点は $I_{xy}$ を負に、第2・第4象限の質点は正にします。'],
        sol: [[`$I_{xy} = -(${ms.map(([x, y, m]) => `${n(m)}\\cdot(${n(x)})(${n(y)})`).join(' + ')}) = ${n(I.xy)}$.`, `$I_{xy} = -(${ms.map(([x, y, m]) => `${n(m)}\\cdot(${n(x)})(${n(y)})`).join(' + ')}) = ${n(I.xy)}$ です。`], [I.xy === 0 ? 'It is zero: the axes are principal, and spinning about either needs no sideways torque.' : 'A non-zero $I_{xy}$ means the axes are not principal: spinning about the $x$-axis would need a torque to keep the axis fixed, which is what makes an unbalanced wheel shake.', I.xy === 0 ? '0 なので座標軸が主軸で、どちらの軸のまわりに回しても横向きのトルクは要りません。' : '$I_{xy}$ が 0 でないので座標軸は主軸ではありません。$x$ 軸のまわりに回し続けるには軸を押さえるトルクが必要で、釣り合っていない車輪が揺れるのはこのためです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let xx, yy, xy; do { xx = r.int(2, 10); yy = r.int(2, 10); xy = r.int(-4, 4); } while (xy === 0 && xx === yy);
        const a = 0.5 * Math.atan2(2 * xy, xx - yy), d = ((deg(a) % 180) + 180) % 180;
        return {
          q: [`A plane body has $I_{xx} = ${xx}$, $I_{yy} = ${yy}$, $I_{xy} = ${xy}$. At what angle $\\theta$ in $[0^\\circ, 180^\\circ)$ from the $x$-axis is the axis of greatest moment?`, `平面の物体の値が $I_{xx} = ${xx}$、$I_{yy} = ${yy}$、$I_{xy} = ${xy}$ です。慣性モーメントが最大になる軸は、$x$ 軸から角 $\\theta$（$[0^\\circ, 180^\\circ)$ の範囲）がいくつの方向ですか。`],
          a: { type: 'num', v: d, tol: 0.1, unit: ['°', '°'] },
          hint: ['$I(\\theta) = \\tfrac12(I_{xx} + I_{yy}) + \\tfrac12(I_{xx} - I_{yy})\\cos 2\\theta + I_{xy}\\sin 2\\theta$ is a sinusoid in $2\\theta$.', '$I(\\theta) = \\tfrac12(I_{xx} + I_{yy}) + \\tfrac12(I_{xx} - I_{yy})\\cos 2\\theta + I_{xy}\\sin 2\\theta$ は $2\\theta$ の正弦波です。'],
          sol: [[`The maximum is where $2\\theta$ points along $(\\tfrac12(I_{xx} - I_{yy}), I_{xy}) = (${n((xx - yy) / 2)}, ${xy})$.`, `最大は $2\\theta$ が $(\\tfrac12(I_{xx} - I_{yy}), I_{xy}) = (${n((xx - yy) / 2)}, ${xy})$ の向きのときです。`], [`$2\\theta = \\operatorname{atan2}(${2 * xy}, ${xx - yy}) = ${n(2 * deg(a), 3)}^\\circ$, so $\\theta = ${n(d, 2)}^\\circ$.`, `$2\\theta = \\operatorname{atan2}(${2 * xy}, ${xx - yy}) = ${n(2 * deg(a), 3)}^\\circ$ より $\\theta = ${n(d, 2)}^\\circ$ です。`], [`The least-moment axis is at $${n((d + 90) % 180, 2)}^\\circ$, exactly perpendicular, as it must be for the eigenvectors of a symmetric matrix.`, `最小の軸は $${n((d + 90) % 180, 2)}^\\circ$ で、ちょうど垂直です。対称行列の固有ベクトルなので必ずそうなります。`]],
        };
      }
      if (form === 1) {
        const ms = masses(r), I = tensor(ms);
        return {
          q: [`Point masses ${list(ms)}. Write their moment of inertia $I(\\theta)$ about the axis through the origin at angle $\\theta$ to the $x$-axis.`, `質点が ${listJ(ms)} あります。原点を通り $x$ 軸と角 $\\theta$ をなす軸のまわりの慣性モーメント $I(\\theta)$ を式で表してください。`],
          a: { type: 'expr', v: `${I.xx}*cos(theta)^2 + ${I.yy}*sin(theta)^2 + ${2 * I.xy}*sin(theta)*cos(theta)`, vars: ['theta'], dom: { theta: [0, 3.1] }, lhs: ['$I(\\theta) =$', '$I(\\theta) =$'] },
          hint: ['The distance of $(x, y)$ from the line through the origin in direction $(\\cos\\theta, \\sin\\theta)$ is $|x\\sin\\theta - y\\cos\\theta|$.', '点 $(x, y)$ から、原点を通り向き $(\\cos\\theta, \\sin\\theta)$ の直線までの距離は $|x\\sin\\theta - y\\cos\\theta|$ です。'],
          sol: [[`$I_{xx} = \\sum m y^2 = ${n(I.xx)}$, $I_{yy} = \\sum m x^2 = ${n(I.yy)}$, $I_{xy} = -\\sum m xy = ${n(I.xy)}$.`, `$I_{xx} = \\sum m y^2 = ${n(I.xx)}$、$I_{yy} = \\sum m x^2 = ${n(I.yy)}$、$I_{xy} = -\\sum m xy = ${n(I.xy)}$ です。`], [`$I(\\theta) = ${n(I.xx)}\\cos^2\\theta + ${n(I.yy)}\\sin^2\\theta ${I.xy < 0 ? '-' : '+'} ${n(Math.abs(2 * I.xy))}\\sin\\theta\\cos\\theta$.`, `$I(\\theta) = ${n(I.xx)}\\cos^2\\theta + ${n(I.yy)}\\sin^2\\theta ${I.xy < 0 ? '-' : '+'} ${n(Math.abs(2 * I.xy))}\\sin\\theta\\cos\\theta$ です。`], ['Expanding $\\sum m(x\\sin\\theta - y\\cos\\theta)^2$ gives exactly this, so however the masses are placed, the curve in the right-hand graph has this form.', '$\\sum m(x\\sin\\theta - y\\cos\\theta)^2$ を展開するとちょうどこの形になります。質点をどう置いても、右のグラフの曲線はこの形です。']],
        };
      }
      const ms = masses(r), M = ms.reduce((s, x) => s + x[2], 0), cx = ms.reduce((s, x) => s + x[0] * x[2], 0) / M, cy = ms.reduce((s, x) => s + x[1] * x[2], 0) / M;
      const th = r.pick([0, 30, 45, 60, 90, 120, 135]), a = rad(th), IO = Itheta(tensor(ms), a), dd = cx * Math.sin(a) - cy * Math.cos(a), Icm = IO - M * dd * dd;
      return {
        q: [`Point masses ${list(ms)}: total mass $${n(M)}$, centre of mass $(${n(cx, 4)}, ${n(cy, 4)})$. About the axis through the origin at $\\theta = ${th}^\\circ$ the moment is $${n(IO, 4)}$. What is the moment about the parallel axis through the centre of mass? Give three decimals.`, `質点が ${listJ(ms)} あります。全質量は $${n(M)}$、重心は $(${n(cx, 4)}, ${n(cy, 4)})$ です。原点を通り $\\theta = ${th}^\\circ$ の軸のまわりの慣性モーメントは $${n(IO, 4)}$ です。重心を通る平行な軸のまわりの慣性モーメントを求めてください（小数第3位まで）。`],
        a: { type: 'num', v: Icm, tol: 6e-4 },
        hint: ['Run the parallel-axis theorem backwards; $d$ is the distance from the centre of mass to the axis through the origin.', '平行軸の定理を逆に使います。$d$ は重心から原点を通る軸までの距離です。'],
        sol: [[`$d = |c_x\\sin\\theta - c_y\\cos\\theta| = ${n(Math.abs(dd), 4)}$.`, `$d = |c_x\\sin\\theta - c_y\\cos\\theta| = ${n(Math.abs(dd), 4)}$ です。`], [`$I_{\\rm cm} = I_O - Md^2 = ${n(IO, 4)} - ${n(M)}\\times ${n(dd * dd, 4)} = ${n(Icm, 4)}$.`, `$I_{\\rm cm} = I_O - Md^2 = ${n(IO, 4)} - ${n(M)}\\times ${n(dd * dd, 4)} = ${n(Icm, 4)}$ です。`], [Math.abs(dd) < 1e-9 ? 'Here the axis already passes through the centre of mass, so nothing changes.' : 'Subtracting is safe because the centre-of-mass value is the smallest of all parallel axes; the lab\'s readout checks the same identity live when the reference is the origin.', Math.abs(dd) < 1e-9 ? 'ここでは軸がすでに重心を通っているので、何も変わりません。' : '重心の値は平行な軸のなかで最小なので、引き算して問題ありません。基準点を原点にすると、読み取り欄が同じ関係をその場で確かめています。']],
      };
    },
  ];
})();
