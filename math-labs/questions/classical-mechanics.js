'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;
  const g = 9.8; // the lab's gravity

  /* ---------- 1. projectile ---------- */
  Q.projectile = [
    (r) => {
      const th = r.int(15, 75), v = r.int(8, 30), form = r.int(0, 2), t = rad(th);
      const R = v * v * Math.sin(2 * t) / g, Tf = 2 * v * Math.sin(t) / g, H = (v * Math.sin(t)) ** 2 / (2 * g);
      const what = [['range $R$', '飛距離 $R$', R, 'm', 'm'], ['flight time $T$', '飛行時間 $T$', Tf, 's', '秒'], ['peak height $H$', '最高点の高さ $H$', H, 'm', 'm']][form];
      const sols = [
        [[`$R = \\dfrac{v_0^2\\sin 2\\theta}{g} = \\dfrac{${v}^2\\sin ${2 * th}^\\circ}{9.8} = ${n(R, 3)}$ m.`, `$R = \\dfrac{v_0^2\\sin 2\\theta}{g} = \\dfrac{${v}^2\\sin ${2 * th}^\\circ}{9.8} = ${n(R, 3)}$ m です。`], [`The complementary angle $${90 - th}^\\circ$ lands at the same spot, because $\\sin 2\\theta$ is the same for both.`, `余角 $${90 - th}^\\circ$ でも $\\sin 2\\theta$ が同じなので、同じ地点に着地します。`]],
        [[`The vertical velocity $v_0\\sin\\theta = ${n(v * Math.sin(t), 3)}$ m/s reverses under gravity, which takes $2v_0\\sin\\theta/g$.`, `鉛直速度 $v_0\\sin\\theta = ${n(v * Math.sin(t), 3)}$ m/s が重力で反転するのに $2v_0\\sin\\theta/g$ かかります。`], [`$T = 2\\times ${n(v * Math.sin(t), 4)}/9.8 = ${n(Tf, 3)}$ s. The horizontal motion plays no part in it.`, `$T = 2\\times ${n(v * Math.sin(t), 4)}/9.8 = ${n(Tf, 3)}$ 秒です。水平方向の運動はまったく関係しません。`]],
        [[`At the top the vertical velocity is zero, so $v_0^2\\sin^2\\theta = 2gH$.`, `最高点では鉛直速度が 0 なので $v_0^2\\sin^2\\theta = 2gH$ です。`], [`$H = \\dfrac{(${n(v * Math.sin(t), 4)})^2}{2\\times 9.8} = ${n(H, 3)}$ m.`, `$H = \\dfrac{(${n(v * Math.sin(t), 4)})^2}{2\\times 9.8} = ${n(H, 3)}$ m です。`]],
      ][form];
      return {
        q: [`A ball is launched at $${v}$ m/s and $${th}^\\circ$ above level ground, with no air resistance ($g = 9.8$ m/s²). Find its ${what[0]}.`, `水平な地面から、ボールを $${v}$ m/s、仰角 $${th}^\\circ$ で投げ上げます。空気抵抗はなく $g = 9.8$ m/s² とします。${what[1]}を求めてください。`],
        a: { type: 'num', v: what[2], unit: [what[3], what[4]] },
        hint: [['$R = v_0^2\\sin 2\\theta/g$.', 'Find when $y = v_0\\sin\\theta\\,t - \\tfrac12 gt^2$ returns to zero.', 'The vertical speed at the top is zero.'][form], ['$R = v_0^2\\sin 2\\theta/g$ です。', '$y = v_0\\sin\\theta\\,t - \\tfrac12 gt^2$ が 0 に戻る時刻を求めます。', '最高点では鉛直方向の速さが 0 です。'][form]],
        sol: sols,
        set: { angle: th, speed: v, drag: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const v = r.int(12, 30), th1 = r.int(15, 40), R = Math.round(v * v * Math.sin(2 * rad(th1)) / g * 10) / 10;
        const a = deg(Math.asin(g * R / (v * v))) / 2;
        return {
          q: [`A ball launched at $${v}$ m/s must land $${n(R)}$ m away on level ground (no drag, $g = 9.8$ m/s²). Find both launch angles $\\theta_1 < \\theta_2$, in degrees.`, `$${v}$ m/s で投げたボールを、水平な地面の $${n(R)}$ m 先に着地させます（空気抵抗なし、$g = 9.8$ m/s²）。二つの発射角 $\\theta_1 < \\theta_2$ を度で求めてください。`],
          a: { type: 'tuple', v: [a, 90 - a], labels: ['$\\theta_1$', '$\\theta_2$'], tol: 0.05 },
          hint: ['Solve $\\sin 2\\theta = gR/v_0^2$; the sine takes each value twice between $0^\\circ$ and $180^\\circ$.', '$\\sin 2\\theta = gR/v_0^2$ を解きます。正弦は $0^\\circ$ から $180^\\circ$ の間で同じ値を二回とります。'],
          sol: [[`$\\sin 2\\theta = \\dfrac{9.8\\times ${n(R)}}{${v * v}} = ${n(g * R / (v * v), 4)}$.`, `$\\sin 2\\theta = \\dfrac{9.8\\times ${n(R)}}{${v * v}} = ${n(g * R / (v * v), 4)}$ です。`], [`$2\\theta = ${n(2 * a, 3)}^\\circ$ or $${n(180 - 2 * a, 3)}^\\circ$, so $\\theta_1 = ${n(a, 2)}^\\circ$ and $\\theta_2 = ${n(90 - a, 2)}^\\circ$.`, `$2\\theta = ${n(2 * a, 3)}^\\circ$ または $${n(180 - 2 * a, 3)}^\\circ$ なので、$\\theta_1 = ${n(a, 2)}^\\circ$、$\\theta_2 = ${n(90 - a, 2)}^\\circ$ です。`], ['The two angles add up to $90^\\circ$: the low shot arrives sooner, the high lob stays up longer, and both land together only in a vacuum.', '二つの角の和は $90^\\circ$ です。低い弾道は早く着き、高い弾道は長く空中にいます。同じ地点に着くのは真空中だけです。']],
          set: { angle: th1, speed: v, drag: 0 },
        };
      }
      if (form === 1) {
        const v = r.int(12, 30), th = r.pick([30, 35, 40, 45, 50, 55, 60]), t = rad(th), R = v * v * Math.sin(2 * t) / g;
        const x = Math.max(1, Math.round(R * r.pick([0.2, 0.3, 0.4, 0.6, 0.75]))), y = x * Math.tan(t) - g * x * x / (2 * v * v * Math.cos(t) ** 2);
        return {
          q: [`A ball is launched at $${v}$ m/s and $${th}^\\circ$ (no drag, $g = 9.8$ m/s²). How high is it when it is $${x}$ m downrange?`, `ボールを $${v}$ m/s、仰角 $${th}^\\circ$ で投げます（空気抵抗なし、$g = 9.8$ m/s²）。水平に $${x}$ m 進んだときの高さはいくつですか。`],
          a: { type: 'num', v: y, unit: ['m', 'm'] },
          hint: ['Eliminate time: $t = x/(v_0\\cos\\theta)$.', '時間を消去します：$t = x/(v_0\\cos\\theta)$。'],
          sol: [[`$y = x\\tan\\theta - \\dfrac{g x^2}{2v_0^2\\cos^2\\theta}$.`, `$y = x\\tan\\theta - \\dfrac{g x^2}{2v_0^2\\cos^2\\theta}$ です。`], [`$y = ${x}\\times ${n(Math.tan(t), 4)} - \\dfrac{9.8\\times ${x * x}}{2\\times ${v * v}\\times ${n(Math.cos(t) ** 2, 4)}} = ${n(y, 3)}$ m.`, `$y = ${x}\\times ${n(Math.tan(t), 4)} - \\dfrac{9.8\\times ${x * x}}{2\\times ${v * v}\\times ${n(Math.cos(t) ** 2, 4)}} = ${n(y, 3)}$ m です。`], ['The path is a parabola in $x$: the straight-line climb $x\\tan\\theta$ minus a drop that grows with the square of the distance.', '軌道は $x$ の放物線です。直線的な上昇 $x\\tan\\theta$ から、距離の二乗で増える落下を引いたものです。']],
          set: { angle: th, speed: v, drag: 0 },
        };
      }
      const th = r.pick([20, 30, 40, 45, 50, 60, 70]), R = r.pick([20, 25, 30, 40, 50, 60]), v = Math.sqrt(g * R / Math.sin(2 * rad(th)));
      return {
        q: [`What launch speed puts a ball $${R}$ m away on level ground if it leaves at $${th}^\\circ$? (No drag, $g = 9.8$ m/s².)`, `仰角 $${th}^\\circ$ で投げたボールを水平な地面の $${R}$ m 先に届かせるには、初速はいくつ必要ですか（空気抵抗なし、$g = 9.8$ m/s²）。`],
        a: { type: 'num', v, unit: ['m/s', 'm/s'] },
        hint: ['Invert $R = v_0^2\\sin 2\\theta/g$.', '$R = v_0^2\\sin 2\\theta/g$ を逆に解きます。'],
        sol: [[`$v_0 = \\sqrt{gR/\\sin 2\\theta} = \\sqrt{9.8\\times ${R}/\\sin ${2 * th}^\\circ}$.`, `$v_0 = \\sqrt{gR/\\sin 2\\theta} = \\sqrt{9.8\\times ${R}/\\sin ${2 * th}^\\circ}$ です。`], [`$v_0 = ${n(v, 3)}$ m/s.${th === 45 ? ' At $45^\\circ$ this is the least speed that can reach the target at all.' : ''}`, `$v_0 = ${n(v, 3)}$ m/s です。${th === 45 ? '$45^\\circ$ では、これがそもそも的に届く最小の速さです。' : ''}`]],
        set: v <= 30 ? { angle: th, speed: Math.round(v), drag: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([30, 45, 60]), v = r.int(8, 25), t = rad(th), tn = Math.tan(t), c = g / (2 * v * v * Math.cos(t) ** 2);
        const tTeX = th === 45 ? '' : th === 30 ? '\\tfrac{1}{\\sqrt3}' : '\\sqrt3';
        return {
          q: [`Write the height $y(x)$ of a ball launched from the origin at $${v}$ m/s and $${th}^\\circ$ as a function of the horizontal distance $x$ (no drag, $g = 9.8$ m/s²).`, `原点から $${v}$ m/s、仰角 $${th}^\\circ$ で投げたボールの高さ $y(x)$ を、水平距離 $x$ の関数で表してください（空気抵抗なし、$g = 9.8$ m/s²）。`],
          a: { type: 'expr', v: `${tn}*x - ${c}*x^2`, vars: ['x'], lhs: ['$y(x) =$', '$y(x) =$'] },
          hint: ['Use $x = v_0\\cos\\theta\\,t$ to replace $t$ in $y = v_0\\sin\\theta\\,t - \\tfrac12 gt^2$.', '$x = v_0\\cos\\theta\\,t$ を使って $y = v_0\\sin\\theta\\,t - \\tfrac12 gt^2$ の $t$ を置き換えます。'],
          sol: [[`$t = x/(v_0\\cos\\theta)$, so $y = x\\tan\\theta - \\dfrac{g}{2v_0^2\\cos^2\\theta}x^2$.`, `$t = x/(v_0\\cos\\theta)$ より $y = x\\tan\\theta - \\dfrac{g}{2v_0^2\\cos^2\\theta}x^2$ です。`], [`With $\\tan ${th}^\\circ = ${th === 45 ? '1' : tTeX}$ and $\\cos^2 ${th}^\\circ = ${th === 45 ? '\\tfrac12' : th === 30 ? '\\tfrac34' : '\\tfrac14'}$: $y = ${th === 45 ? '' : tTeX}x - ${n(c, 5)}x^2$.`, `$\\tan ${th}^\\circ = ${th === 45 ? '1' : tTeX}$、$\\cos^2 ${th}^\\circ = ${th === 45 ? '\\tfrac12' : th === 30 ? '\\tfrac34' : '\\tfrac14'}$ より $y = ${th === 45 ? '' : tTeX}x - ${n(c, 5)}x^2$ です。`], [`Its roots are $x = 0$ and $x = \\tan\\theta/${n(c, 5)} = ${n(tn / c, 3)}$ m, the range.`, `根は $x = 0$ と $x = \\tan\\theta/${n(c, 5)} = ${n(tn / c, 3)}$ m で、後者が飛距離です。`]],
          set: { angle: th, speed: v, drag: 0 },
        };
      }
      if (form === 1) {
        const balls = [['baseball', '野球のボール', 0.145, 7.4, 0.35], ['football (soccer ball)', 'サッカーボール', 0.43, 22, 0.25], ['golf ball', 'ゴルフボール', 0.046, 4.27, 0.25], ['table-tennis ball', '卓球のボール', 0.0027, 4, 0.5], ['tennis ball', 'テニスボール', 0.058, 6.7, 0.55]];
        const [en, ja, m, d, cd] = r.pick(balls), A = PI * (d / 200) ** 2, k = 1.2 * cd * A / (2 * m), vt = Math.sqrt(g / k);
        return {
          q: [`Quadratic drag gives $\\dot{\\mathbf v} = \\mathbf g - k|\\mathbf v|\\mathbf v$ with $k = \\rho C_d A/(2m)$. For a ${en} ($m = ${m}$ kg, diameter ${d} cm, $C_d = ${cd}$, air $\\rho = 1.2$ kg/m³, $g = 9.8$ m/s²), find the terminal speed.`, `二乗抵抗では $\\dot{\\mathbf v} = \\mathbf g - k|\\mathbf v|\\mathbf v$、$k = \\rho C_d A/(2m)$ です。${ja}（$m = ${m}$ kg、直径 ${d} cm、$C_d = ${cd}$、空気 $\\rho = 1.2$ kg/m³、$g = 9.8$ m/s²）の終端速度を求めてください。`],
          a: { type: 'num', v: vt, unit: ['m/s', 'm/s'] },
          hint: ['At terminal speed falling straight down, drag balances gravity: $k v_t^2 = g$.', '終端速度でまっすぐ落ちるとき、抵抗が重力と釣り合います：$k v_t^2 = g$。'],
          sol: [[`$A = \\pi(${n(d / 200, 5)})^2 = ${sig(A, 3)}$ m², so $k = \\dfrac{1.2\\times ${cd}\\times ${sig(A, 3)}}{2\\times ${m}} = ${sig(k, 3)}$ m⁻¹.`, `$A = \\pi(${n(d / 200, 5)})^2 = ${sig(A, 3)}$ m² なので、$k = \\dfrac{1.2\\times ${cd}\\times ${sig(A, 3)}}{2\\times ${m}} = ${sig(k, 3)}$ m⁻¹ です。`], [`$v_t = \\sqrt{g/k} = \\sqrt{9.8/${sig(k, 3)}} = ${sig(vt, 3)}$ m/s.`, `$v_t = \\sqrt{g/k} = \\sqrt{9.8/${sig(k, 3)}} = ${sig(vt, 3)}$ m/s です。`], [`Drag matters once the speed is a sizeable fraction of $v_t$. The lab uses $k = 0.006$ m⁻¹, close to a baseball, so at 30 m/s drag is already about half of gravity.`, `速さが $v_t$ のかなりの割合になると抵抗が効いてきます。この実験は野球のボールに近い $k = 0.006$ m⁻¹ を使っているので、30 m/s では抵抗がすでに重力の半分ほどになります。`]],
          set: { drag: 1, speed: 30, angle: 45 },
        };
      }
      const which = r.int(0, 1);
      if (which === 0) {
        return {
          q: ['With quadratic air drag, which launch angle gives the longest range at a fixed speed?', '二乗の空気抵抗があるとき、一定の初速で飛距離が最大になる発射角はどれですか。'],
          a: { type: 'choice', opts: [['Less than $45^\\circ$', '$45^\\circ$ より小さい'], ['Exactly $45^\\circ$, as in a vacuum', '真空中と同じくちょうど $45^\\circ$'], ['More than $45^\\circ$, to make up for the steep fall', '急な落下を補うため $45^\\circ$ より大きい'], ['It depends only on the ball\'s mass', 'ボールの質量だけで決まる']], v: 0, fixed: true },
          hint: ['Drag punishes time in the air: a high lob spends longer losing horizontal speed.', '抵抗は空中にいる時間を罰します。高い弾道ほど長く水平速度を失い続けます。'],
          sol: [['In a vacuum the range $v_0^2\\sin 2\\theta/g$ peaks at $45^\\circ$ because height and distance trade off symmetrically.', '真空中では高さと距離の交換が対称なので、飛距離 $v_0^2\\sin 2\\theta/g$ は $45^\\circ$ で最大です。'], ['Drag removes horizontal speed in proportion to time aloft, which grows with the angle, so lowering the angle pays. Try it in the lab with drag on: at 30 m/s the best angle is about $43^\\circ$, and it falls further for faster or lighter balls, to around $35^\\circ$ for a hard-hit baseball.', '抵抗は空中にいる時間に比例して水平速度を奪い、その時間は角度とともに増えるので、角度を下げたほうが得です。抵抗ありで試すと、30 m/s では最適な角度は約 $43^\\circ$ で、速いボールや軽いボールではさらに下がり、強く打った野球のボールでは $35^\\circ$ 前後になります。']],
          set: { drag: 1, speed: 30, angle: 43 },
        };
      }
      return {
        q: ['With air drag, how does the time a ball takes to fall from its peak compare with the time it took to climb there?', '空気抵抗があるとき、ボールが最高点から落ちる時間は、そこまで上る時間と比べてどうですか。'],
        a: { type: 'choice', opts: [['The fall takes longer', '落下のほうが長い'], ['They are equal, as in a vacuum', '真空中と同じく等しい'], ['The fall is quicker, because gravity and drag both point down', '重力と抵抗がどちらも下向きなので落下のほうが速い']], v: 0, fixed: true },
        hint: ['Compare the net vertical acceleration on the way up and on the way down.', '上りと下りで、鉛直方向の正味の加速度を比べてください。'],
        sol: [['On the way up drag and gravity both slow the ball, so it decelerates faster than $g$ and the climb is short.', '上りでは抵抗と重力がどちらもボールを減速させるので、減速は $g$ より大きく、上りは短くなります。'], ['On the way down drag opposes gravity, so it speeds up more slowly than $g$ and covers the same height in more time. That is why the descent in the lab is steeper and longer: the path is no longer a symmetric parabola.', '下りでは抵抗が重力に逆らうので加速は $g$ より小さく、同じ高さを落ちるのに時間がかかります。実験で下りが急で長いのはこのためで、軌道はもう対称な放物線ではありません。']],
        set: { drag: 1, speed: 30, angle: 60 },
      };
    },
  ];

  /* ---------- 2. damped oscillator, m = 1 in the lab ---------- */
  const regimeName = (c, k) => { const d = c * c - 4 * k; return Math.abs(d) < 1e-9 ? 1 : d < 0 ? 0 : 2; };
  Q.oscillator = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([0.2, 0.25, 0.5, 1, 2, 4]), k = r.pick([20, 50, 80, 100, 200, 400]), T = TAU * Math.sqrt(m / k);
        return {
          q: [`A ${m} kg mass hangs on a spring of stiffness ${k} N/m. What is the period of its undamped oscillation?`, `質量 ${m} kg のおもりが剛性 ${k} N/m のばねに吊るされています。減衰のない振動の周期はいくつですか。`],
          a: { type: 'num', v: T, unit: ['s', '秒'] },
          hint: ['$\\omega_0 = \\sqrt{k/m}$ and $T = 2\\pi/\\omega_0$.', '$\\omega_0 = \\sqrt{k/m}$、$T = 2\\pi/\\omega_0$ です。'],
          sol: [[`$\\omega_0 = \\sqrt{${k}/${m}} = ${n(Math.sqrt(k / m), 4)}$ rad/s.`, `$\\omega_0 = \\sqrt{${k}/${m}} = ${n(Math.sqrt(k / m), 4)}$ rad/s です。`], [`$T = 2\\pi/\\omega_0 = ${n(T, 4)}$ s. Gravity only shifts the equilibrium; it does not change the period.`, `$T = 2\\pi/\\omega_0 = ${n(T, 4)}$ 秒です。重力はつり合いの位置をずらすだけで、周期は変えません。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([1, 4, 9, 2, 3, 5, 6, 7, 8, 2.5, 6.5]), cc = 2 * Math.sqrt(k), exact = Math.abs(cc * 10 - Math.round(cc * 10)) < 1e-9;
        return {
          q: [`In the lab ($m = 1$) the stiffness is $k = ${n(k)}$. What damping $c$ makes the oscillator critically damped?`, `この実験（$m = 1$）で剛性が $k = ${n(k)}$ です。臨界減衰になる減衰 $c$ はいくつですか。`],
          a: { type: 'num', v: cc, show: exact ? undefined : `2\\sqrt{${n(k)}}` },
          hint: ['Critical damping is where the characteristic roots of $ms^2 + cs + k = 0$ merge.', '臨界減衰は特性方程式 $ms^2 + cs + k = 0$ の根が重なるところです。'],
          sol: [['The discriminant $c^2 - 4mk$ vanishes, so $c = 2\\sqrt{mk}$.', '判別式 $c^2 - 4mk$ が 0 になるので $c = 2\\sqrt{mk}$ です。'], [`$c = 2\\sqrt{${n(k)}} = ${n(cc, 4)}$. Any less and it overshoots; any more and it creeps back more slowly.`, `$c = 2\\sqrt{${n(k)}} = ${n(cc, 4)}$ です。これより小さいと行き過ぎ、大きいとよりゆっくり戻ります。`]],
          set: exact ? { stiffness: k, damping: cc } : { stiffness: k },
        };
      }
      let c, k, reg;
      do { k = r.step(1, 9, 0.5); c = r.step(0, 8, 0.5); reg = regimeName(c, k); } while (reg !== 1 && Math.abs(c - 2 * Math.sqrt(k)) < 0.4 || (reg === 1 && r.chance(0.5)));
      return {
        q: [`In the lab ($m = 1$), with $c = ${n(c)}$ and $k = ${n(k)}$, how does the released mass return to rest?`, `この実験（$m = 1$）で $c = ${n(c)}$、$k = ${n(k)}$ のとき、放したおもりはどのように静止に戻りますか。`],
        a: { type: 'choice', opts: [['Underdamped: it oscillates with a decaying envelope', '減衰不足：減衰する包絡線の中で振動する'], ['Critically damped: the fastest return with no overshoot', '臨界減衰：行き過ぎずに最も速く戻る'], ['Overdamped: it creeps back without oscillating', '過減衰：振動せずにゆっくり戻る']], v: reg, fixed: true },
        hint: ['Compare $c$ with $2\\sqrt{mk}$, or look at the sign of $c^2 - 4mk$.', '$c$ と $2\\sqrt{mk}$ を比べるか、$c^2 - 4mk$ の符号を見てください。'],
        sol: [[`$c^2 - 4mk = ${n(c * c)} - ${n(4 * k)} = ${n(c * c - 4 * k)}$.`, `$c^2 - 4mk = ${n(c * c)} - ${n(4 * k)} = ${n(c * c - 4 * k)}$ です。`], [['Negative: the roots are a complex pair, so the motion oscillates.', 'Zero: a double real root, critical damping.', 'Positive: two real negative roots, so it decays without oscillating.'][reg], ['負なので根は複素共役の対で、運動は振動します。', '0 なので実数の重根で、臨界減衰です。', '正なので負の実根が二つあり、振動せずに減衰します。'][reg]]],
        set: { damping: c, stiffness: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let c, k; do { k = r.step(2, 9, 0.5); c = r.step(0.2, 4, 0.1); } while (c * c >= 4 * k - 0.5);
        const wd = Math.sqrt(k - c * c / 4);
        return {
          q: [`In the lab ($m = 1$), $c = ${n(c)}$ and $k = ${n(k)}$. Find the damped angular frequency $\\omega_d$.`, `この実験（$m = 1$）で $c = ${n(c)}$、$k = ${n(k)}$ です。減衰振動の角振動数 $\\omega_d$ を求めてください。`],
          a: { type: 'num', v: wd },
          hint: ['The roots are $s = -c/2m \\pm i\\omega_d$.', '根は $s = -c/2m \\pm i\\omega_d$ です。'],
          sol: [[`$\\omega_d = \\sqrt{k/m - c^2/4m^2} = \\sqrt{${n(k)} - ${n(c * c / 4, 4)}} = ${n(wd, 4)}$.`, `$\\omega_d = \\sqrt{k/m - c^2/4m^2} = \\sqrt{${n(k)} - ${n(c * c / 4, 4)}} = ${n(wd, 4)}$ です。`], [`Compare $\\omega_0 = \\sqrt{${n(k)}} = ${n(Math.sqrt(k), 4)}$: damping slows the oscillation slightly as well as making it die away.`, `$\\omega_0 = \\sqrt{${n(k)}} = ${n(Math.sqrt(k), 4)}$ と比べると、減衰は振動を消すだけでなく、わずかに遅くもします。`]],
          set: { damping: c, stiffness: k },
        };
      }
      if (form === 1) {
        let c, k; do { k = r.step(1, 6, 0.5); c = r.step(1, 8, 0.5); } while (c * c - 4 * k < 1);
        const d = Math.sqrt(c * c - 4 * k), s1 = (-c + d) / 2, s2 = (-c - d) / 2;
        return {
          q: [`In the lab ($m = 1$), $c = ${n(c)}$ and $k = ${n(k)}$. Find the characteristic roots $s_1 > s_2$.`, `この実験（$m = 1$）で $c = ${n(c)}$、$k = ${n(k)}$ です。特性根 $s_1 > s_2$ を求めてください。`],
          a: { type: 'tuple', v: [s1, s2], labels: ['$s_1$', '$s_2$'], tol: 0.002 },
          hint: ['Solve $s^2 + cs + k = 0$.', '$s^2 + cs + k = 0$ を解いてください。'],
          sol: [[`$s = \\dfrac{-${n(c)} \\pm \\sqrt{${n(c * c)} - ${n(4 * k)}}}{2} = \\dfrac{-${n(c)} \\pm ${n(d, 4)}}{2}$.`, `$s = \\dfrac{-${n(c)} \\pm \\sqrt{${n(c * c)} - ${n(4 * k)}}}{2} = \\dfrac{-${n(c)} \\pm ${n(d, 4)}}{2}$ です。`], [`$s_1 = ${n(s1, 4)}$, $s_2 = ${n(s2, 4)}$.`, `$s_1 = ${n(s1, 4)}$、$s_2 = ${n(s2, 4)}$ です。`], [`The slow root $s_1$ governs the return, decaying like $e^{${n(s1, 3)}t}$: more damping pushes it toward 0 and makes the return slower, not faster.`, `戻り方を決めるのは遅いほうの根 $s_1$ で、$e^{${n(s1, 3)}t}$ のように減衰します。減衰を増やすとこの根は 0 に近づき、戻りは速くなるどころか遅くなります。`]],
          set: { damping: c, stiffness: k },
        };
      }
      let c, k; do { k = r.step(2, 9, 0.5); c = r.step(0.2, 2.5, 0.1); } while (c * c >= 4 * k);
      const th = 2 * Math.LN2 / c, wd = Math.sqrt(k - c * c / 4);
      return {
        q: [`In the lab ($m = 1$), $c = ${n(c)}$ and $k = ${n(k)}$. How long does the envelope of the oscillation take to halve?`, `この実験（$m = 1$）で $c = ${n(c)}$、$k = ${n(k)}$ です。振動の包絡線が半分になるのにかかる時間はいくつですか。`],
        a: { type: 'num', v: th },
        hint: ['The envelope is $e^{-ct/2m}$, whatever $k$ is.', '包絡線は $k$ によらず $e^{-ct/2m}$ です。'],
        sol: [[`Solve $e^{-ct/2} = \\tfrac12$: $t = 2\\ln 2/c$.`, `$e^{-ct/2} = \\tfrac12$ を解くと $t = 2\\ln 2/c$ です。`], [`$t = 2\\times 0.6931/${n(c)} = ${n(th, 4)}$, which is ${n(th * wd / TAU, 2)} oscillation periods.`, `$t = 2\\times 0.6931/${n(c)} = ${n(th, 4)}$ で、これは振動の ${n(th * wd / TAU, 2)} 周期ぶんです。`], ['The stiffness sets how fast it swings; only the damping sets how fast the swings die.', '剛性はどれだけ速く揺れるかを決め、揺れがどれだけ速く消えるかを決めるのは減衰だけです。']],
        set: { damping: c, stiffness: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w = r.pick([1, 2, 3]);
        return {
          q: [`In the lab ($m = 1$), $k = ${w * w}$ and $c = ${2 * w}$, critical damping. Released from $x = 1$ at rest, what is $x(t)$?`, `この実験（$m = 1$）で $k = ${w * w}$、$c = ${2 * w}$ の臨界減衰です。$x = 1$ から静かに放したとき、$x(t)$ を求めてください。`],
          a: { type: 'expr', v: `(1+${w}t)exp(-${w}t)`, vars: ['t'], dom: { t: [0, 3] }, lhs: ['$x(t) =$', '$x(t) =$'] },
          hint: ['A double root $s = -\\omega_0$ gives $x = (A + Bt)e^{-\\omega_0 t}$.', '重根 $s = -\\omega_0$ では $x = (A + Bt)e^{-\\omega_0 t}$ です。'],
          sol: [[`The double root is $s = -${w}$, so $x = (A + Bt)e^{-${w}t}$.`, `重根は $s = -${w}$ なので $x = (A + Bt)e^{-${w}t}$ です。`], [`$x(0) = A = 1$; $\\dot x(0) = B - ${w}A = 0$, so $B = ${w}$.`, `$x(0) = A = 1$、$\\dot x(0) = B - ${w}A = 0$ より $B = ${w}$ です。`], [`$x(t) = (1 + ${w === 1 ? '' : w}t)e^{-${w === 1 ? '' : w}t}$: it never crosses zero, and it is the fastest return that does not overshoot.`, `$x(t) = (1 + ${w === 1 ? '' : w}t)e^{-${w === 1 ? '' : w}t}$ です。0 を横切ることはなく、行き過ぎない戻り方のなかで最も速いものです。`]],
          set: { stiffness: w * w, damping: 2 * w },
        };
      }
      if (form === 1) {
        const [c, k, wd] = r.pick([[2, 2, 1], [2, 5, 2], [4, 5, 1], [4, 8, 2], [0, 4, 2], [0, 9, 3], [0, 1, 1]]);
        const a = c / 2, B = a / wd;
        const v = a === 0 ? `cos(${wd}t)` : `exp(-${a}t)*(cos(${wd}t) + ${B}*sin(${wd}t))`;
        return {
          q: [`In the lab ($m = 1$), $c = ${c}$ and $k = ${k}$. Released from $x = 1$ at rest, what is $x(t)$?`, `この実験（$m = 1$）で $c = ${c}$、$k = ${k}$ です。$x = 1$ から静かに放したとき、$x(t)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['t'], dom: { t: [0, 3] }, lhs: ['$x(t) =$', '$x(t) =$'] },
          hint: ['Roots $s = -c/2 \\pm i\\omega_d$ give $x = e^{-ct/2}(A\\cos\\omega_d t + B\\sin\\omega_d t)$.', '根 $s = -c/2 \\pm i\\omega_d$ から $x = e^{-ct/2}(A\\cos\\omega_d t + B\\sin\\omega_d t)$ です。'],
          sol: [[`$s^2 + ${c}s + ${k} = 0$ gives $s = ${a === 0 ? '' : `-${a}`} \\pm ${wd}i$.`, `$s^2 + ${c}s + ${k} = 0$ より $s = ${a === 0 ? '' : `-${a}`} \\pm ${wd}i$ です。`], [`$x(0) = A = 1$ and $\\dot x(0) = -${a}A + ${wd}B = 0$, so $B = ${n(B)}$.`, `$x(0) = A = 1$、$\\dot x(0) = -${a}A + ${wd}B = 0$ より $B = ${n(B)}$ です。`], [a === 0 ? `$x(t) = \\cos ${wd}t$: with no damping it swings for ever at $\\omega_0 = ${wd}$.` : `$x(t) = e^{-${a === 1 ? '' : a}t}\\left(\\cos ${wd}t + ${n(B)}\\sin ${wd}t\\right)$. The sine term is what makes the velocity start at zero.`, a === 0 ? `$x(t) = \\cos ${wd}t$ です。減衰がなければ $\\omega_0 = ${wd}$ でいつまでも揺れます。` : `$x(t) = e^{-${a === 1 ? '' : a}t}\\left(\\cos ${wd}t + ${n(B)}\\sin ${wd}t\\right)$ です。正弦の項が、速度を 0 から始めるために必要な部分です。`]],
          set: { damping: c, stiffness: k },
        };
      }
      const k = r.step(2, 9, 0.5), ratio = r.pick([1.5, 2, 3, 4, 5, 10]), dl = Math.log(ratio), c = dl * Math.sqrt(k) / Math.sqrt(PI * PI + dl * dl / 4);
      return {
        q: [`In the lab ($m = 1$, $k = ${n(k)}$), each maximum of $x(t)$ is $${ratio}$ times the next. What is the damping $c$?`, `この実験（$m = 1$、$k = ${n(k)}$）で、$x(t)$ の各極大は次の極大の $${ratio}$ 倍です。減衰 $c$ はいくつですか。`],
        a: { type: 'num', v: c, rel: 0.003 },
        hint: ['Successive maxima are one damped period $2\\pi/\\omega_d$ apart, so their ratio is $e^{c\\pi/\\omega_d}$ (with $m = 1$).', '隣り合う極大は減衰振動の一周期 $2\\pi/\\omega_d$ 離れているので、比は $e^{c\\pi/\\omega_d}$ です（$m = 1$）。'],
        sol: [[`The logarithmic decrement is $\\delta = \\ln ${ratio} = ${n(dl, 4)} = c\\pi/\\omega_d$ with $\\omega_d = \\sqrt{k - c^2/4}$.`, `対数減衰率は $\\delta = \\ln ${ratio} = ${n(dl, 4)} = c\\pi/\\omega_d$、$\\omega_d = \\sqrt{k - c^2/4}$ です。`], [`Squaring, $\\delta^2(k - c^2/4) = \\pi^2c^2$, so $c = \\dfrac{\\delta\\sqrt k}{\\sqrt{\\pi^2 + \\delta^2/4}} = ${n(c, 4)}$.`, `二乗すると $\\delta^2(k - c^2/4) = \\pi^2c^2$ なので、$c = \\dfrac{\\delta\\sqrt k}{\\sqrt{\\pi^2 + \\delta^2/4}} = ${n(c, 4)}$ です。`], [`That is $\\zeta = c/2\\sqrt k = ${n(c / (2 * Math.sqrt(k)), 3)}$ of critical: this is how damping is measured in practice, by watching successive swings.`, `臨界減衰に対する比は $\\zeta = c/2\\sqrt k = ${n(c / (2 * Math.sqrt(k)), 3)}$ です。実際の減衰はこうして、続く揺れを観察して測ります。`]],
        set: { stiffness: k, damping: Math.round(c * 10) / 10 },
      };
    },
  ];

  /* ---------- 3. orbits: the lab launches tangentially from r = 1 ---------- */
  const MU_E = 3.986e14, RE = 6.371e6;
  const BODIES = [['Earth', '地球', 3.986e14, 6371], ['the Moon', '月', 4.905e12, 1737], ['Mars', '火星', 4.283e13, 3390]];
  Q['mechanics-orbit'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.pick([200, 300, 400, 420, 550, 800, 1000, 2000]), v = Math.sqrt(MU_E / (RE + h * 1e3)) / 1e3;
        return {
          q: [`How fast must a satellite move for a circular orbit ${h} km above the Earth? ($GM = 3.986\\times 10^{14}$ m³/s², $R_\\oplus = 6371$ km.) Give km/s.`, `地球の上空 ${h} km の円軌道を回る衛星の速さは何 km/s ですか（$GM = 3.986\\times 10^{14}$ m³/s²、$R_\\oplus = 6371$ km）。`],
          a: { type: 'num', v, unit: ['km/s', 'km/s'] },
          hint: ['Gravity supplies the centripetal force: $v^2/r = GM/r^2$, with $r$ measured from the centre.', '重力が向心力になります：$v^2/r = GM/r^2$。$r$ は中心から測ります。'],
          sol: [[`$r = 6371 + ${h} = ${6371 + h}$ km.`, `$r = 6371 + ${h} = ${6371 + h}$ km です。`], [`$v = \\sqrt{GM/r} = \\sqrt{3.986\\times 10^{14}/${sig((RE + h * 1e3), 4)}} = ${n(v, 3)}$ km/s.`, `$v = \\sqrt{GM/r} = \\sqrt{3.986\\times 10^{14}/${sig((RE + h * 1e3), 4)}} = ${n(v, 3)}$ km/s です。`], ['Higher orbits are slower: speed falls as $1/\\sqrt r$.', '高い軌道ほど遅く、速さは $1/\\sqrt r$ で減ります。']],
        };
      }
      if (form === 1) {
        const [en, ja, mu, R] = r.pick(BODIES), v = Math.sqrt(2 * mu / (R * 1e3)) / 1e3;
        return {
          q: [`What is the escape speed from the surface of ${en} ($GM = ${sig(mu, 4)}$ m³/s², radius ${R} km)? Give km/s.`, `${ja}の表面からの脱出速度は何 km/s ですか（$GM = ${sig(mu, 4)}$ m³/s²、半径 ${R} km）。`],
          a: { type: 'num', v, unit: ['km/s', 'km/s'] },
          hint: ['Escape means zero total energy: $\\tfrac12 v^2 - GM/r = 0$.', '脱出とは全エネルギーが 0 になることです：$\\tfrac12 v^2 - GM/r = 0$。'],
          sol: [[`$v_{\\rm esc} = \\sqrt{2GM/R} = \\sqrt{2\\times ${sig(mu, 4)}/${sig(R * 1e3, 4)}}$.`, `$v_{\\rm esc} = \\sqrt{2GM/R} = \\sqrt{2\\times ${sig(mu, 4)}/${sig(R * 1e3, 4)}}$ です。`], [`$v_{\\rm esc} = ${n(v, 3)}$ km/s, exactly $\\sqrt2$ times the circular speed at the same radius, as the lab's two quoted speeds show.`, `$v_{\\rm esc} = ${n(v, 3)}$ km/s で、同じ半径での円軌道速度のちょうど $\\sqrt2$ 倍です。実験の注記に出る二つの速さもこの関係です。`]],
        };
      }
      const v = r.step(0.5, 2, 0.05), mu = r.step(0.5, 2, 0.05), e = Math.abs(v * v / mu - 1);
      const kind = e < 1e-9 ? 0 : e < 1 - 1e-9 ? 1 : e < 1 + 1e-9 ? 2 : 3;
      return {
        q: [`In the lab a body is launched tangentially at $r_0 = 1$ with $v_0 = ${n(v)}$ about a centre with $\\mu = ${n(mu)}$. What is the eccentricity $e$ of its orbit?`, `この実験で、$\\mu = ${n(mu)}$ の中心のまわりに $r_0 = 1$ から接線方向に $v_0 = ${n(v)}$ で物体を打ち出します。軌道の離心率 $e$ はいくつですか。`],
        a: { type: 'num', v: e, tol: 5e-4 },
        hint: ['For a tangential launch, $e = |v_0^2 r_0/\\mu - 1|$.', '接線方向の発射では $e = |v_0^2 r_0/\\mu - 1|$ です。'],
        sol: [[`$v_0^2 r_0/\\mu = ${n(v * v, 4)}/${n(mu)} = ${n(v * v / mu, 4)}$, so $e = ${n(e, 4)}$.`, `$v_0^2 r_0/\\mu = ${n(v * v, 4)}/${n(mu)} = ${n(v * v / mu, 4)}$ より $e = ${n(e, 4)}$ です。`], [[`$e = 0$: a circle.`, `$e = ${n(e, 3)} < 1$: an ellipse, with the launch point at ${v * v > mu ? 'periapsis' : 'apoapsis'}.`, '$e = 1$: a parabola, the boundary of escape.', `$e = ${n(e, 3)} > 1$: a hyperbola, and the body escapes.`][kind], [`$e = 0$ なので円です。`, `$e = ${n(e, 3)} < 1$ なので楕円で、発射点は${v * v > mu ? '近点' : '遠点'}です。`, '$e = 1$ なので放物線で、脱出のちょうど境目です。', `$e = ${n(e, 3)} > 1$ なので双曲線で、物体は脱出します。`][kind]]],
        set: { speed: v, mu },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let v, mu; do { v = r.step(0.5, 2, 0.05); mu = r.step(0.5, 2, 0.05); } while (v * v > 1.8 * mu);
        const a = 1 / (2 - v * v / mu), T = TAU * Math.sqrt(a ** 3 / mu);
        return {
          q: [`In the lab, launch tangentially at $r_0 = 1$ with $v_0 = ${n(v)}$ and $\\mu = ${n(mu)}$. Find the period of the orbit.`, `この実験で、$\\mu = ${n(mu)}$ のもと $r_0 = 1$ から接線方向に $v_0 = ${n(v)}$ で打ち出します。軌道の周期を求めてください。`],
          a: { type: 'num', v: T, rel: 0.003 },
          hint: ['Vis-viva, $v^2 = \\mu(2/r - 1/a)$, gives the semi-major axis; then $T = 2\\pi\\sqrt{a^3/\\mu}$.', '活力の式 $v^2 = \\mu(2/r - 1/a)$ から長半径を求め、$T = 2\\pi\\sqrt{a^3/\\mu}$ を使います。'],
          sol: [[`$\\dfrac1a = \\dfrac{2}{r_0} - \\dfrac{v_0^2}{\\mu} = 2 - ${n(v * v / mu, 4)}$, so $a = ${n(a, 4)}$.`, `$\\dfrac1a = \\dfrac{2}{r_0} - \\dfrac{v_0^2}{\\mu} = 2 - ${n(v * v / mu, 4)}$ より $a = ${n(a, 4)}$ です。`], [`$T = 2\\pi\\sqrt{${n(a, 4)}^3/${n(mu)}} = ${n(T, 4)}$.`, `$T = 2\\pi\\sqrt{${n(a, 4)}^3/${n(mu)}} = ${n(T, 4)}$ です。`], ['The period depends only on the energy (through $a$), not on how elongated the ellipse is.', '周期はエネルギー（$a$ を通して）だけで決まり、楕円の細長さにはよりません。']],
          set: { speed: v, mu },
        };
      }
      if (form === 1) {
        if (r.chance(0.5)) {
          const h = r.pick([400, 420, 550, 700, 20200, 35786]), a = RE + h * 1e3, T = TAU * Math.sqrt(a ** 3 / MU_E);
          return {
            q: [`What is the period of a circular orbit ${h} km above the Earth? ($GM = 3.986\\times 10^{14}$ m³/s², $R_\\oplus = 6371$ km.) Give minutes.`, `地球の上空 ${h} km の円軌道の周期は何分ですか（$GM = 3.986\\times 10^{14}$ m³/s²、$R_\\oplus = 6371$ km）。`],
            a: { type: 'num', v: T / 60, unit: ['min', '分'] },
            hint: ['Kepler\'s third law: $T = 2\\pi\\sqrt{a^3/GM}$ with $a$ from the centre.', 'ケプラーの第三法則：$T = 2\\pi\\sqrt{a^3/GM}$。$a$ は中心から測ります。'],
            sol: [[`$a = ${6371 + h}$ km $= ${sig(a, 5)}$ m.`, `$a = ${6371 + h}$ km $= ${sig(a, 5)}$ m です。`], [`$T = 2\\pi\\sqrt{(${sig(a, 5)})^3/3.986\\times 10^{14}} = ${n(T, 0)}$ s $= ${n(T / 60, 1)}$ min.`, `$T = 2\\pi\\sqrt{(${sig(a, 5)})^3/3.986\\times 10^{14}} = ${n(T, 0)}$ 秒 $= ${n(T / 60, 1)}$ 分です。`], [h > 30000 ? 'This is one sidereal day: the geostationary orbit, where a satellite hangs over one spot.' : h > 10000 ? 'This is the GPS orbit: two revolutions per sidereal day.' : 'Low orbits all take about an hour and a half, which is why the ISS sees sixteen sunrises a day.', h > 30000 ? 'これは一恒星日で、衛星が一地点の上に留まって見える静止軌道です。' : h > 10000 ? 'これは GPS の軌道で、一恒星日に二周します。' : '低軌道はどれもおよそ一時間半で一周するので、ISS は一日に十六回日の出を迎えます。']],
          };
        }
        const T = r.pick([[86164, 'one sidereal day', '一恒星日'], [43082, 'half a sidereal day', '半恒星日'], [7200, 'two hours', '二時間']]), a = Math.cbrt(MU_E * (T[0] / TAU) ** 2);
        return {
          q: [`At what distance from the Earth's centre does a circular orbit take ${T[1]} (${T[0]} s)? ($GM = 3.986\\times 10^{14}$ m³/s².) Give km.`, `地球の中心からどれだけの距離で、円軌道の周期が${T[2]}（${T[0]} 秒）になりますか（$GM = 3.986\\times 10^{14}$ m³/s²）。km で答えてください。`],
          a: { type: 'num', v: a / 1e3, unit: ['km', 'km'] },
          hint: ['Invert Kepler\'s third law: $a^3 = GM\\,T^2/4\\pi^2$.', 'ケプラーの第三法則を逆に解きます：$a^3 = GM\\,T^2/4\\pi^2$。'],
          sol: [[`$a^3 = 3.986\\times 10^{14}\\times (${T[0]}/2\\pi)^2 = ${sig(a ** 3, 4)}$ m³.`, `$a^3 = 3.986\\times 10^{14}\\times (${T[0]}/2\\pi)^2 = ${sig(a ** 3, 4)}$ m³ です。`], [`$a = ${n(a / 1e3, 0)}$ km, that is ${n(a / 1e3 - 6371, 0)} km above the surface.`, `$a = ${n(a / 1e3, 0)}$ km で、地表から ${n(a / 1e3 - 6371, 0)} km の高さです。`]],
        };
      }
      let v, mu; do { v = r.step(0.5, 2, 0.05); mu = r.step(0.5, 2, 0.05); } while (v * v > 1.8 * mu || Math.abs(v * v - mu) < 0.02);
      const p = v * v / mu, e = Math.abs(p - 1), peri = v * v > mu, other = peri ? p / (1 - e) : p / (1 + e);
      return {
        q: [`In the lab, launch tangentially at $r_0 = 1$ with $v_0 = ${n(v)}$ and $\\mu = ${n(mu)}$. How far from the centre is the other end of the major axis?`, `この実験で、$\\mu = ${n(mu)}$ のもと $r_0 = 1$ から接線方向に $v_0 = ${n(v)}$ で打ち出します。長軸のもう一方の端は中心からどれだけ離れていますか。`],
        a: { type: 'num', v: other, rel: 0.002 },
        hint: ['Angular momentum $h = r_0v_0$ fixes the semi-latus rectum $p = h^2/\\mu$; the apsides are at $p/(1 \\pm e)$.', '角運動量 $h = r_0v_0$ から半直弦 $p = h^2/\\mu$ が決まり、近点と遠点は $p/(1 \\pm e)$ にあります。'],
        sol: [[`$p = v_0^2/\\mu = ${n(p, 4)}$ and $e = |p - 1| = ${n(e, 4)}$.`, `$p = v_0^2/\\mu = ${n(p, 4)}$、$e = |p - 1| = ${n(e, 4)}$ です。`], [peri ? `The launch is faster than circular, so it is periapsis; apoapsis is at $p/(1 - e) = ${n(other, 4)}$.` : `The launch is slower than circular, so it is apoapsis; periapsis is at $p/(1 + e) = ${n(other, 4)}$.`, peri ? `円軌道より速いので発射点は近点で、遠点は $p/(1 - e) = ${n(other, 4)}$ です。` : `円軌道より遅いので発射点は遠点で、近点は $p/(1 + e) = ${n(other, 4)}$ です。`], [`Check: the two apsides average to $a = ${n((1 + other) / 2, 4)} = 1/(2 - v_0^2/\\mu)$.`, `確認：二つの端の平均は $a = ${n((1 + other) / 2, 4)} = 1/(2 - v_0^2/\\mu)$ です。`]],
        set: { speed: v, mu },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const cases = [['a circular orbit 300 km above the Earth', '高度 300 km の円軌道', 'geostationary orbit (42164 km from the centre)', '静止軌道（中心から 42164 km）', MU_E, 6671e3, 42164e3], ['a circular orbit 400 km above the Earth', '高度 400 km の円軌道', 'geostationary orbit (42164 km from the centre)', '静止軌道（中心から 42164 km）', MU_E, 6771e3, 42164e3], ['Earth\'s orbit round the Sun (1 AU, taken as circular)', '太陽をまわる地球の軌道（1 AU、円とみなします）', 'Mars\'s orbit (1.524 AU)', '火星の軌道（1.524 AU）', 1.327e20, 1.496e11, 1.524 * 1.496e11], ['a circular orbit 300 km above the Earth', '高度 300 km の円軌道', 'a circular orbit at the Moon\'s distance (384400 km)', '月の距離（384400 km）の円軌道', MU_E, 6671e3, 3.844e8]];
        const [fe, fj, te, tj, mu, r1, r2] = r.pick(cases);
        const at = (r1 + r2) / 2, v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2), vp = Math.sqrt(mu * (2 / r1 - 1 / at)), va = Math.sqrt(mu * (2 / r2 - 1 / at));
        const dv = (vp - v1 + v2 - va) / 1e3;
        return {
          q: [`A Hohmann transfer takes a craft from ${fe} to ${te}, with $GM = ${sig(mu, 4)}$ m³/s². What is the total $\\Delta v$ of the two burns, in km/s?`, `ホーマン遷移で、宇宙機を${fj}から${tj}へ移します（$GM = ${sig(mu, 4)}$ m³/s²）。二回の噴射の $\\Delta v$ の合計は何 km/s ですか。`],
          a: { type: 'num', v: dv, rel: 0.005, unit: ['km/s', 'km/s'] },
          hint: ['The transfer ellipse touches both circles: $a_t = (r_1 + r_2)/2$. Use vis-viva at each end and compare with the circular speeds.', '遷移楕円は二つの円に接するので $a_t = (r_1 + r_2)/2$ です。両端で活力の式を使い、円軌道速度と比べます。'],
          sol: [[`Circular speeds: $${n(v1 / 1e3, 3)}$ and $${n(v2 / 1e3, 3)}$ km/s. On the transfer ellipse: $${n(vp / 1e3, 3)}$ km/s at $r_1$ and $${n(va / 1e3, 3)}$ km/s at $r_2$.`, `円軌道速度は $${n(v1 / 1e3, 3)}$ km/s と $${n(v2 / 1e3, 3)}$ km/s、遷移楕円上では $r_1$ で $${n(vp / 1e3, 3)}$ km/s、$r_2$ で $${n(va / 1e3, 3)}$ km/s です。`], [`$\\Delta v = (${n(vp / 1e3, 3)} - ${n(v1 / 1e3, 3)}) + (${n(v2 / 1e3, 3)} - ${n(va / 1e3, 3)}) = ${n(dv, 3)}$ km/s.`, `$\\Delta v = (${n(vp / 1e3, 3)} - ${n(v1 / 1e3, 3)}) + (${n(v2 / 1e3, 3)} - ${n(va / 1e3, 3)}) = ${n(dv, 3)}$ km/s です。`], ['Both burns speed the craft up, yet it ends up slower than it started: climbing out of the well trades kinetic energy for potential.', '二回とも加速の噴射なのに、最後は最初より遅くなります。重力の井戸を登るとき、運動エネルギーが位置エネルギーに変わるからです。']],
        };
      }
      if (form === 1) {
        let v, mu, rp, ra;
        do { rp = ra = undefined; v = r.step(0.6, 1.8, 0.05); mu = r.step(0.5, 2, 0.05); const p = v * v / mu, e = Math.abs(p - 1); if (e >= 0.95) continue; rp = Math.min(1, p / (1 + e)); ra = Math.max(1, p / (1 - e)); } while (!rp || ra / rp > 6 || Math.abs(v * v - mu) < 0.02);
        const C = 2 * mu - v * v, lo = rp + 0.08 * (ra - rp), hi = ra - 0.08 * (ra - rp);
        return {
          q: [`In the lab, launch tangentially at $r_0 = 1$ with $v_0 = ${n(v)}$ and $\\mu = ${n(mu)}$. Write the speed $v(r)$ at any distance $r$ along the orbit.`, `この実験で、$\\mu = ${n(mu)}$ のもと $r_0 = 1$ から接線方向に $v_0 = ${n(v)}$ で打ち出します。軌道上の距離 $r$ での速さ $v(r)$ を式で表してください。`],
          a: { type: 'expr', v: `sqrt(${2 * mu}/r - ${C})`, vars: ['r'], dom: { r: [lo, hi] }, lhs: ['$v(r) =$', '$v(r) =$'] },
          hint: ['The energy $\\tfrac12 v^2 - \\mu/r$ is the same everywhere on the orbit.', 'エネルギー $\\tfrac12 v^2 - \\mu/r$ は軌道上のどこでも同じです。'],
          sol: [[`At launch the energy is $\\tfrac12(${n(v * v, 4)}) - ${n(mu)} = ${n(v * v / 2 - mu, 4)}$.`, `発射時のエネルギーは $\\tfrac12(${n(v * v, 4)}) - ${n(mu)} = ${n(v * v / 2 - mu, 4)}$ です。`], [`So $v^2 = 2\\mu/r + 2E$, giving $v(r) = \\sqrt{${n(2 * mu)}/r - ${n(C, 4)}}$.`, `よって $v^2 = 2\\mu/r + 2E$ で、$v(r) = \\sqrt{${n(2 * mu)}/r - ${n(C, 4)}}$ です。`], [`This is vis-viva, $v^2 = \\mu(2/r - 1/a)$ with $a = ${n(mu / C, 4)}$: the speed is fastest at periapsis $r = ${n(rp, 3)}$ and slowest at apoapsis $r = ${n(ra, 3)}$.`, `これは活力の式 $v^2 = \\mu(2/r - 1/a)$（$a = ${n(mu / C, 4)}$）です。速さは近点 $r = ${n(rp, 3)}$ で最大、遠点 $r = ${n(ra, 3)}$ で最小です。`]],
          set: { speed: v, mu },
        };
      }
      let mu, ra, v; do { mu = r.step(0.5, 2, 0.05); ra = r.pick([1.5, 2, 2.5, 3, 4, 5]); v = Math.sqrt(2 * mu * ra / (1 + ra)); } while (v > 2);
      return {
        q: [`In the lab ($\\mu = ${n(mu)}$, tangential launch at $r_0 = 1$), what launch speed sends the body out to a farthest distance $r_a = ${ra}$?`, `この実験（$\\mu = ${n(mu)}$、$r_0 = 1$ から接線方向に発射）で、最も遠い距離が $r_a = ${ra}$ になる初速はいくつですか。`],
        a: { type: 'num', v, rel: 0.002 },
        hint: ['The launch point is periapsis and $a = (1 + r_a)/2$; then use vis-viva.', '発射点が近点で $a = (1 + r_a)/2$ です。あとは活力の式を使います。'],
        sol: [[`$a = (1 + ${ra})/2 = ${n((1 + ra) / 2)}$.`, `$a = (1 + ${ra})/2 = ${n((1 + ra) / 2)}$ です。`], [`$v_0^2 = \\mu(2 - 1/a) = \\dfrac{2\\mu r_a}{1 + r_a} = ${n(v * v, 4)}$, so $v_0 = ${n(v, 4)}$.`, `$v_0^2 = \\mu(2 - 1/a) = \\dfrac{2\\mu r_a}{1 + r_a} = ${n(v * v, 4)}$ より $v_0 = ${n(v, 4)}$ です。`], [`As $r_a \\to \\infty$ this tends to the escape speed $\\sqrt{2\\mu} = ${n(Math.sqrt(2 * mu), 4)}$: going twice as far needs much less than twice the extra speed.`, `$r_a \\to \\infty$ でこれは脱出速度 $\\sqrt{2\\mu} = ${n(Math.sqrt(2 * mu), 4)}$ に近づきます。二倍遠くへ行くのに、追加の速さは二倍よりずっと少なくて済みます。`]],
        set: { speed: Math.round(v * 20) / 20, mu },
      };
    },
  ];
})();
