'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const PI = Math.PI, deg = (x) => x * 180 / PI;
  const snap = (x, s) => Number((Math.round(x / s) * s).toFixed(6));
  const pole = (s, w) => `${n(s)} \\pm ${w === 1 ? "" : n(w)}i`;

  /* ---------- 1. poles and the second-order step response ---------- */
  Q.poles = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [s, w] = r.pick([[-3, 4], [-0.6, 0.8], [-1.2, 1.6], [-1, 1], [-0.5, 1.2], [-2.4, 1], [-0.8, 1.5]]), wn = Math.hypot(s, w);
        return {
          q: [`A second-order system has poles $${pole(s, w)}$. What is its damping ratio $\\zeta$?`, `二次系の極が $${pole(s, w)}$ です。減衰比 $\\zeta$ はいくつですか。`],
          a: { type: 'num', v: -s / wn },
          hint: ['$\\zeta = -\\sigma/|s|$: the cosine of the angle between the pole and the negative real axis.', '$\\zeta = -\\sigma/|s|$ で、極と負の実軸のなす角の余弦です。'],
          sol: [[`$\\omega_n = |s| = \\sqrt{${n(s * s)} + ${n(w * w)}} = ${n(wn, 4)}$.`, `$\\omega_n = |s| = \\sqrt{${n(s * s)} + ${n(w * w)}} = ${n(wn, 4)}$ です。`], [`$\\zeta = ${n(-s)}/${n(wn, 4)} = ${n(-s / wn, 4)}$. Poles on the same ray from the origin share this value, and so share the overshoot.`, `$\\zeta = ${n(-s)}/${n(wn, 4)} = ${n(-s / wn, 4)}$ です。原点から同じ半直線上にある極はこの値が同じで、オーバーシュートも同じです。`]],
          set: { sigma: s, omega: w },
        };
      }
      if (form === 1) {
        const s = r.pick([-0.4, -0.5, -0.8, -1, -1.6, -2, -2.5]), w = r.step(0.5, 5, 0.5);
        return {
          q: [`The poles are $${pole(s, w)}$. Estimate the 2% settling time with the rule $t_s \\approx 4/|\\sigma|$.`, `極は $${pole(s, w)}$ です。$t_s \\approx 4/|\\sigma|$ の規則で 2% 整定時間を見積もってください。`],
          a: { type: 'num', v: 4 / -s },
          hint: ['The envelope of the oscillation is $e^{\\sigma t}$, and $e^{-4} \\approx 0.018$.', '振動の包絡線は $e^{\\sigma t}$ で、$e^{-4} \\approx 0.018$ です。'],
          sol: [[`$t_s \\approx 4/${n(-s)} = ${n(4 / -s)}$.`, `$t_s \\approx 4/${n(-s)} = ${n(4 / -s)}$ です。`], ['Only the real part matters: moving the poles up or down changes how fast the response rings, not how fast it settles.', '効くのは実部だけです。極を上下に動かすと振動の速さは変わりますが、落ち着く速さは変わりません。']],
          set: { sigma: s, omega: w },
        };
      }
      const s = r.pick([-2, -1, -0.5, 0, 0, 0.3, 0.6, -0.2]), w = r.step(0.5, 4, 0.5);
      const v = s < 0 ? 0 : s === 0 ? 1 : 2;
      return {
        q: [`A system has poles $${pole(s, w)}$. How does its step response behave?`, `系の極が $${pole(s, w)}$ です。ステップ応答はどうなりますか。`],
        a: { type: 'choice', opts: [['It settles to its final value', '最終値に落ち着く'], ['It oscillates for ever without settling or growing', '落ち着きも増大もせず永遠に振動する'], ['It grows without bound', '限りなく大きくなる']], v, fixed: true },
        hint: ['Only the sign of the real part decides stability.', '安定性を決めるのは実部の符号だけです。'],
        sol: [[`The real part is $\\sigma = ${n(s)}$, and every term of the response carries the factor $e^{\\sigma t}$${w ? ` times $\\cos ${n(w)}t$ or $\\sin ${n(w)}t$` : ''}.`, `実部は $\\sigma = ${n(s)}$ で、応答のどの項にも因子 $e^{\\sigma t}$${w ? ` と $\\cos ${n(w)}t$ または $\\sin ${n(w)}t$` : ''} がかかります。`], [s < 0 ? 'Negative: every transient decays, the system is stable.' : s > 0 ? 'Positive: the transients grow exponentially, the system is unstable.' : 'Zero: the oscillation neither grows nor decays, a marginally stable system that rings for ever.', s < 0 ? '負なのですべての過渡成分は減衰し、系は安定です。' : s > 0 ? '正なので過渡成分は指数的に増え、系は不安定です。' : '0 なので振動は増えも減りもせず、永遠に鳴り続ける安定限界の系です。']],
        set: { sigma: s, omega: w },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.step(-2, -0.2, 0.1), w = r.step(1, 5, 0.25), os = Math.exp(PI * s / w);
        return {
          q: [`Poles at $${pole(s, w)}$. What is the percentage overshoot of the unit step response?`, `極は $${pole(s, w)}$ です。単位ステップ応答のオーバーシュートは何パーセントですか。`],
          a: { type: 'num', v: 100 * os, tol: 0.05, unit: ['%', '%'] },
          hint: ['The first peak is at $t = \\pi/\\omega$, and there $y = 1 + e^{\\sigma\\pi/\\omega}$.', '最初のピークは $t = \\pi/\\omega$ にあり、そこで $y = 1 + e^{\\sigma\\pi/\\omega}$ です。'],
          sol: [[`At $t_p = \\pi/\\omega = ${n(PI / w, 4)}$, $\\cos\\omega t = -1$ and $\\sin\\omega t = 0$, so $y(t_p) = 1 + e^{\\sigma t_p}$.`, `$t_p = \\pi/\\omega = ${n(PI / w, 4)}$ では $\\cos\\omega t = -1$、$\\sin\\omega t = 0$ なので $y(t_p) = 1 + e^{\\sigma t_p}$ です。`], [`Overshoot $= e^{\\pi\\sigma/\\omega} = e^{${n(PI * s / w, 4)}} = ${n(os, 4)}$, that is $${n(100 * os, 3)}\\%$.`, `オーバーシュート $= e^{\\pi\\sigma/\\omega} = e^{${n(PI * s / w, 4)}} = ${n(os, 4)}$、すなわち $${n(100 * os, 3)}\\%$ です。`], ['It depends only on the ratio $\\sigma/\\omega$, that is on the angle of the pole: the dashed ray in the figure.', 'これは比 $\\sigma/\\omega$、すなわち極の角度だけで決まります。図の破線の半直線です。']],
          set: { sigma: s, omega: w },
        };
      }
      if (form === 1) {
        const z = r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.707, 0.8]), wn = r.pick([1, 2, 2.5, 3, 4, 5]);
        const s = -z * wn, w = wn * Math.sqrt(1 - z * z);
        return {
          q: [`A design calls for damping ratio $\\zeta = ${n(z)}$ and natural frequency $\\omega_n = ${n(wn)}$. Where are the poles $\\sigma \\pm i\\omega$?`, `減衰比 $\\zeta = ${n(z)}$、固有振動数 $\\omega_n = ${n(wn)}$ の設計です。極 $\\sigma \\pm i\\omega$ はどこにありますか。`],
          a: { type: 'tuple', v: [s, w], labels: ['$\\sigma$', '$\\omega$'], tol: 2e-3 },
          hint: ['The pole has modulus $\\omega_n$ and makes angle $\\arccos\\zeta$ with the negative real axis.', '極の絶対値は $\\omega_n$ で、負の実軸と角 $\\arccos\\zeta$ をなします。'],
          sol: [[`$\\sigma = -\\zeta\\omega_n = ${n(s, 4)}$.`, `$\\sigma = -\\zeta\\omega_n = ${n(s, 4)}$ です。`], [`$\\omega = \\omega_n\\sqrt{1 - \\zeta^2} = ${n(w, 4)}$.`, `$\\omega = \\omega_n\\sqrt{1 - \\zeta^2} = ${n(w, 4)}$ です。`], [`Expect overshoot $${n(100 * Math.exp(PI * s / w), 3)}\\%$ and settling in about $${n(4 / -s, 3)}$.`, `オーバーシュートは $${n(100 * Math.exp(PI * s / w), 3)}\\%$、整定時間はおよそ $${n(4 / -s, 3)}$ と見込めます。`]],
          set: s >= -3 ? { sigma: snap(s, 0.05), omega: snap(w, 0.05) } : undefined,
        };
      }
      const s = r.step(-2, -0.2, 0.2), w = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      return {
        q: [`Poles at $${pole(s, w)}$. At what time does the step response reach its first peak?`, `極は $${pole(s, w)}$ です。ステップ応答が最初のピークに達する時刻はいつですか。`],
        a: { type: 'num', v: PI / w, show: w === 1 ? '\\pi' : `\\pi/${n(w)}` },
        hint: ['Differentiate $y(t)$: the derivative is proportional to $e^{\\sigma t}\\sin\\omega t$.', '$y(t)$ を微分すると、$e^{\\sigma t}\\sin\\omega t$ に比例します。'],
        sol: [[`$y'(t) = \\dfrac{\\sigma^2 + \\omega^2}{\\omega}e^{\\sigma t}\\sin\\omega t$, which first vanishes at $\\omega t = \\pi$.`, `$y'(t) = \\dfrac{\\sigma^2 + \\omega^2}{\\omega}e^{\\sigma t}\\sin\\omega t$ で、最初に 0 になるのは $\\omega t = \\pi$ のときです。`], [`$t_p = \\pi/${n(w)} = ${n(PI / w, 4)}$: set by the imaginary part alone, so raising the pole speeds up the rise.`, `$t_p = \\pi/${n(w)} = ${n(PI / w, 4)}$ で、虚部だけで決まります。極を上げると立ち上がりが速くなります。`]],
        set: { sigma: s, omega: w },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.pick([2, 5, 10, 16.3, 20, 25, 30, 4.3]), lm = Math.log(M / 100), z = -lm / Math.sqrt(PI * PI + lm * lm);
        return {
          q: [`A step response may overshoot by at most $${n(M)}\\%$. What is the smallest damping ratio $\\zeta$ that meets this?`, `ステップ応答のオーバーシュートを $${n(M)}\\%$ 以下にしたいとします。これを満たす最小の減衰比 $\\zeta$ はいくつですか。`],
          a: { type: 'num', v: z, tol: 1e-3 },
          hint: ['Overshoot $= e^{-\\pi\\zeta/\\sqrt{1 - \\zeta^2}}$; take logarithms and solve for $\\zeta$.', 'オーバーシュート $= e^{-\\pi\\zeta/\\sqrt{1 - \\zeta^2}}$ です。対数をとって $\\zeta$ について解きます。'],
          sol: [[`$\\ln ${n(M / 100)} = ${n(lm, 4)} = -\\pi\\zeta/\\sqrt{1 - \\zeta^2}$.`, `$\\ln ${n(M / 100)} = ${n(lm, 4)} = -\\pi\\zeta/\\sqrt{1 - \\zeta^2}$ です。`], [`Squaring and solving: $\\zeta = \\dfrac{-\\ln M}{\\sqrt{\\pi^2 + \\ln^2 M}} = ${n(z, 4)}$.`, `2乗して解くと $\\zeta = \\dfrac{-\\ln M}{\\sqrt{\\pi^2 + \\ln^2 M}} = ${n(z, 4)}$ です。`], [`The poles must lie within $${n(deg(Math.acos(z)), 3)}^\\circ$ of the negative real axis: a wedge in the s-plane, not a region near any particular point.`, `極は負の実軸から $${n(deg(Math.acos(z)), 3)}^\\circ$ 以内になければなりません。s 平面の特定の点の近くではなく、くさび形の領域です。`]],
        };
      }
      if (form === 1) {
        const M = r.pick([5, 10, 20, 2]), ts = r.pick([2, 4, 5, 8, 10]), s = -4 / ts, w = PI * s / Math.log(M / 100);
        return {
          q: [`Place the poles $\\sigma \\pm i\\omega$ so that the step response settles in $t_s = ${ts}$ (rule $4/|\\sigma|$) and overshoots by exactly $${M}\\%$.`, `ステップ応答が $t_s = ${ts}$（規則 $4/|\\sigma|$）で整定し、ちょうど $${M}\\%$ オーバーシュートするように極 $\\sigma \\pm i\\omega$ を置いてください。`],
          a: { type: 'tuple', v: [s, w], labels: ['$\\sigma$', '$\\omega$'], tol: 2e-3 },
          hint: ['Settling fixes $\\sigma$; overshoot fixes the ratio $\\sigma/\\omega$.', '整定時間が $\\sigma$ を、オーバーシュートが比 $\\sigma/\\omega$ を決めます。'],
          sol: [[`$\\sigma = -4/${ts} = ${n(s, 4)}$.`, `$\\sigma = -4/${ts} = ${n(s, 4)}$ です。`], [`$e^{\\pi\\sigma/\\omega} = ${n(M / 100)}$ gives $\\omega = \\pi\\sigma/\\ln ${n(M / 100)} = ${n(w, 4)}$.`, `$e^{\\pi\\sigma/\\omega} = ${n(M / 100)}$ より $\\omega = \\pi\\sigma/\\ln ${n(M / 100)} = ${n(w, 4)}$ です。`], ['Two specifications, two coordinates: a vertical line for the settling time and a ray for the overshoot, and the pole sits where they cross.', '二つの仕様で二つの座標が決まります。整定時間の垂直線とオーバーシュートの半直線の交点に極が来ます。']],
          set: { sigma: snap(s, 0.05), omega: Math.min(6, snap(w, 0.05)) },
        };
      }
      const [s, w] = r.pick([[-1, 2], [-2, 1], [-1, 1], [-0.5, 1], [-2, 2], [-1, 3]]);
      const k = s / w;
      return {
        q: [`Write the unit step response $y(t)$ of $H(s) = \\dfrac{${s * s + w * w}}{(s ${s < 0 ? '+' : '-'} ${n(Math.abs(s))})^2 + ${w * w}}$.`, `$H(s) = \\dfrac{${s * s + w * w}}{(s ${s < 0 ? '+' : '-'} ${n(Math.abs(s))})^2 + ${w * w}}$ の単位ステップ応答 $y(t)$ を書いてください。`],
        a: { type: 'expr', v: `1-exp(${n(s)}*t)*(cos(${n(w)}*t)-(${n(k, 8)})*sin(${n(w)}*t))`, vars: ['t'], dom: { t: [0.1, 3] }, lhs: ['$y(t) =$', '$y(t) =$'] },
        hint: ['$Y(s) = H(s)/s$; split into $1/s$ and a term with the poles $\\sigma \\pm i\\omega$, and invert.', '$Y(s) = H(s)/s$ を $1/s$ と極 $\\sigma \\pm i\\omega$ の項に分けて逆変換します。'],
        sol: [[`The poles are $${pole(s, w)}$ and $H(0) = 1$, so $y(t) \\to 1$.`, `極は $${pole(s, w)}$ で $H(0) = 1$ なので $y(t) \\to 1$ です。`], [`$Y(s) = \\dfrac1s - \\dfrac{s + ${n(-2 * s)}}{(s + ${n(-s)})^2 + ${n(w * w)}}$ by partial fractions, so $y(t) = 1 - e^{${n(s)}t}\\left(\\cos ${n(w)}t ${k < 0 ? '+' : '-'} ${n(Math.abs(k))}\\sin ${n(w)}t\\right)$.`, `部分分数分解すると $Y(s) = \\dfrac1s - \\dfrac{s + ${n(-2 * s)}}{(s + ${n(-s)})^2 + ${n(w * w)}}$ なので $y(t) = 1 - e^{${n(s)}t}\\left(\\cos ${n(w)}t ${k < 0 ? '+' : '-'} ${n(Math.abs(k))}\\sin ${n(w)}t\\right)$ です。`], ['Check: $y(0) = 0$ and $y\'(0) = 0$, as a second-order system with no zeros must start.', '確認：$y(0) = 0$、$y\'(0) = 0$ で、零点のない二次系の出だしとして正しい形です。']],
        set: { sigma: s, omega: w },
      };
    },
  ];

  /* ---------- 2. PID on G = 1/(s + 1)^3 ---------- */
  const D0 = -0.5;
  Q.pid = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kp = r.step(0.5, 6, 0.5), kd = r.step(0, 2, 0.5);
        return {
          q: [`Proportional-derivative control ($K_p = ${n(kp)}$, $K_d = ${n(kd)}$, $K_i = 0$) of $G(s) = 1/(s + 1)^3$. What steady-state error remains after a unit step in the set-point (before any disturbance)?`, `$G(s) = 1/(s + 1)^3$ を比例微分制御（$K_p = ${n(kp)}$、$K_d = ${n(kd)}$、$K_i = 0$）します。目標値の単位ステップの後（外乱の前）に残る定常偏差はいくつですか。`],
          a: { type: 'num', v: 1 / (1 + kp), show: frac(2, 2 + 2 * kp) },
          hint: ['In steady state $\\dot y = 0$, so the derivative term is silent, and $G(0) = 1$.', '定常状態では $\\dot y = 0$ なので微分項は働かず、$G(0) = 1$ です。'],
          sol: [[`At rest $y = G(0)u = K_p(1 - y)$, so $y = K_p/(1 + K_p)$.`, `静止状態では $y = G(0)u = K_p(1 - y)$ なので $y = K_p/(1 + K_p)$ です。`], [`$e = 1 - y = 1/(1 + ${n(kp)}) = ${n(1 / (1 + kp), 4)}$: proportional action needs an error to produce any effort at all, so some error must remain.`, `$e = 1 - y = 1/(1 + ${n(kp)}) = ${n(1 / (1 + kp), 4)}$ です。比例動作は偏差がなければ操作量を出せないので、偏差が残らざるを得ません。`]],
          set: { kp, ki: 0, kd },
        };
      }
      if (form === 1) {
        const kp = r.step(0, 6, 0.5), ki = r.step(0, 3, 0.25), kd = r.step(0, 4, 0.5), which = r.int(0, 2);
        const lbl = ['s^2', 's', 's^0'], val = [3 + kd, 1 + kp, ki][which];
        return {
          q: [`With $K_p = ${n(kp)}$, $K_i = ${n(ki)}$, $K_d = ${n(kd)}$ on $G(s) = 1/(s + 1)^3$, what is the coefficient of $${lbl[which]}$ in the closed-loop characteristic polynomial?`, `$G(s) = 1/(s + 1)^3$ に $K_p = ${n(kp)}$、$K_i = ${n(ki)}$、$K_d = ${n(kd)}$ を用いるとき、閉ループ特性多項式の $${lbl[which]}$ の係数はいくつですか。`],
          a: { type: 'num', v: val, tol: 1e-9 },
          hint: ['The polynomial is $s^4 + 3s^3 + (3 + K_d)s^2 + (1 + K_p)s + K_i$.', '多項式は $s^4 + 3s^3 + (3 + K_d)s^2 + (1 + K_p)s + K_i$ です。'],
          sol: [[`$s\\,(s + 1)^3 + K_ds^2 + K_ps + K_i = s^4 + 3s^3 + ${n(3 + kd)}s^2 + ${n(1 + kp)}s + ${n(ki)}$.`, `$s\\,(s + 1)^3 + K_ds^2 + K_ps + K_i = s^4 + 3s^3 + ${n(3 + kd)}s^2 + ${n(1 + kp)}s + ${n(ki)}$ です。`], [`Each gain enters one coefficient: $K_d$ the $s^2$ term (damping), $K_p$ the $s$ term (stiffness), $K_i$ the constant (the integrator).`, `各ゲインは一つの係数に入ります。$K_d$ は $s^2$ の項（減衰）、$K_p$ は $s$ の項（剛性）、$K_i$ は定数項（積分器）です。`]],
          set: { kp, ki, kd },
        };
      }
      const kp = r.step(0.5, 6, 0.5);
      return {
        q: [`Proportional control only, $K_p = ${n(kp)}$, on $G = 1/(s + 1)^3$. After a constant load disturbance $d = ${D0}$ enters at the plant input, what is the final output $y$ (set-point $r = 1$)?`, `比例制御のみ（$K_p = ${n(kp)}$）で $G = 1/(s + 1)^3$ を制御します。プラントの入力に一定の負荷外乱 $d = ${D0}$ が加わった後の最終的な出力 $y$ はいくつですか（目標値 $r = 1$）。`],
        a: { type: 'num', v: (kp + D0) / (1 + kp) },
        hint: ['At rest $y = G(0)\\,(K_p(1 - y) + d)$.', '静止状態では $y = G(0)\\,(K_p(1 - y) + d)$ です。'],
        sol: [[`$y = ${n(kp)}(1 - y) ${D0 < 0 ? '-' : '+'} ${n(Math.abs(D0))}$, so $(1 + ${n(kp)})y = ${n(kp + D0)}$.`, `$y = ${n(kp)}(1 - y) ${D0 < 0 ? '-' : '+'} ${n(Math.abs(D0))}$ より $(1 + ${n(kp)})y = ${n(kp + D0)}$ です。`], [`$y = ${n((kp + D0) / (1 + kp), 4)}$, an error of $${n((1 - D0) / (1 + kp), 4)}$. Only a factor $1/(1 + K_p)$ of the disturbance is rejected; integral action is needed to remove it entirely.`, `$y = ${n((kp + D0) / (1 + kp), 4)}$ で、偏差は $${n((1 - D0) / (1 + kp), 4)}$ です。外乱は $1/(1 + K_p)$ 倍に抑えられるだけで、完全に取り除くには積分動作が必要です。`]],
        set: { kp, ki: 0, kd: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kd = r.step(0, 4, 0.5);
        return {
          q: [`With $K_i = 0$ and $K_d = ${n(kd)}$, the loop on $G = 1/(s + 1)^3$ has characteristic polynomial $s^3 + 3s^2 + (3 + K_d)s + (1 + K_p)$. Up to what $K_p$ is it stable?`, `$K_i = 0$、$K_d = ${n(kd)}$ のとき、$G = 1/(s + 1)^3$ のループの特性多項式は $s^3 + 3s^2 + (3 + K_d)s + (1 + K_p)$ です。$K_p$ がいくつまでなら安定ですか。`],
          a: { type: 'num', v: 8 + 3 * kd },
          hint: ['A cubic $s^3 + a_2s^2 + a_1s + a_0$ with positive coefficients is stable exactly when $a_2a_1 > a_0$.', '正の係数の三次式 $s^3 + a_2s^2 + a_1s + a_0$ が安定なのは、ちょうど $a_2a_1 > a_0$ のときです。'],
          sol: [[`Routh–Hurwitz: $3\\,(3 + ${n(kd)}) > 1 + K_p$.`, `ラウス・フルビッツ：$3\\,(3 + ${n(kd)}) > 1 + K_p$ です。`], [`$K_p < ${n(8 + 3 * kd)}$. ${kd ? `Derivative action buys $3K_d = ${n(3 * kd)}$ of extra gain by adding damping.` : 'This is the $K < 8$ of the Nyquist experiment: the same loop, the same limit.'}`, `$K_p < ${n(8 + 3 * kd)}$ です。${kd ? `微分動作は減衰を加えることで、$3K_d = ${n(3 * kd)}$ だけゲインの余地を広げます。` : 'これはナイキストの実験の $K < 8$ と同じです。同じループ、同じ限界です。'}`]],
          set: { kp: 6, ki: 0, kd },
        };
      }
      if (form === 1) {
        const kp = r.step(0.5, 6, 0.5), kd = r.step(0, 3, 0.5);
        return {
          q: [`With $K_p = ${n(kp)}$, $K_d = ${n(kd)}$ and a load disturbance $d = ${D0}$ at the plant input, what offset $1 - y$ remains at the end if $K_i = 0$? And if $K_i > 0$ and the loop is stable?`, `$K_p = ${n(kp)}$、$K_d = ${n(kd)}$ で、プラントの入力に負荷外乱 $d = ${D0}$ があるとき、$K_i = 0$ なら最後に残るずれ $1 - y$ はいくつですか。また $K_i > 0$ でループが安定ならどうなりますか。`],
          a: { type: 'tuple', v: [(1 - D0) / (1 + kp), 0], labels: [['$K_i = 0$', '$K_i = 0$'], ['$K_i > 0$', '$K_i > 0$']], tol: 1e-4 },
          hint: ['An integrator can only be at rest if its input, the error, is zero.', '積分器が静止できるのは、その入力である偏差が 0 のときだけです。'],
          sol: [[`Without integral action: $(1 + K_p)y = K_p + d$, so $1 - y = (1 - d)/(1 + K_p) = ${n((1 - D0) / (1 + kp), 4)}$.`, `積分動作がなければ $(1 + K_p)y = K_p + d$ なので $1 - y = (1 - d)/(1 + K_p) = ${n((1 - D0) / (1 + kp), 4)}$ です。`], ['With integral action the state $\\int e\\,dt$ keeps changing until $e = 0$, so in a stable loop the offset is exactly $0$, whatever the disturbance and whatever $K_p$.', '積分動作があると、状態 $\\int e\\,dt$ は $e = 0$ になるまで変わり続けます。安定なループでは、外乱や $K_p$ によらずずれはちょうど $0$ です。']],
          set: { kp, ki: 0, kd },
        };
      }
      const kp = r.pick([1, 2, 3, 4, 5, 6]), c = Math.cbrt(kp), re = -1 + c / 2, im = c * Math.sqrt(3) / 2;
      return {
        q: [`Proportional control alone ($K_d = K_i = 0$), $K_p = ${kp}$, on $1/(s + 1)^3$: the poles solve $(s + 1)^3 = -${kp}$. Find the complex pair $\\sigma \\pm i\\omega$.`, `比例制御のみ（$K_d = K_i = 0$）、$K_p = ${kp}$ で $1/(s + 1)^3$ を制御します。極は $(s + 1)^3 = -${kp}$ の解です。複素共役の対 $\\sigma \\pm i\\omega$ を求めてください。`],
        a: { type: 'tuple', v: [re, im], labels: ['$\\sigma$', '$\\omega$'], tol: 2e-3 },
        hint: ['The cube roots of $-K_p$ are $K_p^{1/3}e^{i\\pi/3}$, $-K_p^{1/3}$ and $K_p^{1/3}e^{-i\\pi/3}$.', '$-K_p$ の三乗根は $K_p^{1/3}e^{i\\pi/3}$、$-K_p^{1/3}$、$K_p^{1/3}e^{-i\\pi/3}$ です。'],
        sol: [[`$s + 1 = ${n(c, 4)}\\,e^{\\pm i\\pi/3} = ${n(c / 2, 4)} \\pm ${n(im, 4)}i$.`, `$s + 1 = ${n(c, 4)}\\,e^{\\pm i\\pi/3} = ${n(c / 2, 4)} \\pm ${n(im, 4)}i$ です。`], [`$s = ${n(re, 4)} \\pm ${n(im, 4)}i$ (the third pole is real, at $${n(-1 - c, 4)}$).`, `$s = ${n(re, 4)} \\pm ${n(im, 4)}i$ です（三つ目の極は実数で $${n(-1 - c, 4)}$ にあります）。`], ['As $K_p$ grows the pair moves out along rays at $\\pm 60^\\circ$ from $-1$ and crosses the imaginary axis at $K_p = 8$: more gain, more ringing, then instability.', '$K_p$ が増えると、この対は $-1$ から $\\pm 60^\\circ$ の半直線に沿って外へ動き、$K_p = 8$ で虚軸を横切ります。ゲインを上げると振動が増え、やがて不安定になります。']],
        set: { kp, ki: 0, kd: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kp = r.step(0.5, 5, 0.5), kd = r.step(0, 2, 0.5), a1 = 1 + kp, a2 = 3 + kd, kmax = a1 * (3 * a2 - a1) / 9;
        return {
          q: [`$K_p = ${n(kp)}$, $K_d = ${n(kd)}$ on $1/(s + 1)^3$. How large can the integral gain $K_i$ be before the loop goes unstable?`, `$1/(s + 1)^3$ に $K_p = ${n(kp)}$、$K_d = ${n(kd)}$ を用います。ループが不安定になる前に、積分ゲイン $K_i$ はどこまで大きくできますか。`],
          a: { type: 'num', v: kmax, tol: 2e-3 },
          hint: ['Build the Routh array of $s^4 + 3s^3 + a_2s^2 + a_1s + K_i$; the $s^1$ row gives the limit.', '$s^4 + 3s^3 + a_2s^2 + a_1s + K_i$ のラウス表を作ります。$s^1$ の行が限界を与えます。'],
          sol: [[`$a_2 = ${n(a2)}$, $a_1 = ${n(a1)}$. Routh rows: $s^2$: $b_1 = (3a_2 - a_1)/3 = ${n((3 * a2 - a1) / 3, 4)}$, $K_i$; $s^1$: $a_1 - 3K_i/b_1$.`, `$a_2 = ${n(a2)}$、$a_1 = ${n(a1)}$ です。ラウス表の $s^2$ の行は $b_1 = (3a_2 - a_1)/3 = ${n((3 * a2 - a1) / 3, 4)}$ と $K_i$、$s^1$ の行は $a_1 - 3K_i/b_1$ です。`], [`$a_1 - 3K_i/b_1 > 0$ gives $K_i < a_1(3a_2 - a_1)/9 = ${n(kmax, 4)}$.`, `$a_1 - 3K_i/b_1 > 0$ より $K_i < a_1(3a_2 - a_1)/9 = ${n(kmax, 4)}$ です。`], ['Past this a pair of poles crosses the imaginary axis: the integrator, which removes offsets, also adds phase lag, and too much of it makes the loop ring and grow.', 'これを超えると一対の極が虚軸を横切ります。ずれを取り除く積分器は位相遅れも加え、強すぎるとループが振動して発散します。']],
          set: { kp, kd, ki: Math.min(3, snap(kmax + 0.1, 0.05)) },
        };
      }
      if (form === 1) {
        const kp = r.step(0.5, 6, 0.5), ki = r.step(0.25, 2, 0.25), kd = r.step(0, 3, 0.5);
        return {
          q: [`For $u = K_pe + K_i\\int e\\,dt - K_d\\dot y$ with $K_p = ${n(kp)}$, $K_i = ${n(ki)}$, $K_d = ${n(kd)}$ around $G(s) = 1/(s + 1)^3$, write the closed-loop characteristic polynomial $p(s)$.`, `$G(s) = 1/(s + 1)^3$ のまわりに $u = K_pe + K_i\\int e\\,dt - K_d\\dot y$（$K_p = ${n(kp)}$、$K_i = ${n(ki)}$、$K_d = ${n(kd)}$）を組みます。閉ループ特性多項式 $p(s)$ を書いてください。`],
          a: { type: 'expr', v: `s^4+3*s^3+${n(3 + kd)}*s^2+${n(1 + kp)}*s+${n(ki)}`, vars: ['s'], dom: { s: [-2, 2] }, lhs: ['$p(s) =$', '$p(s) =$'] },
          hint: ['In the Laplace domain $Y = G\\,U$ with $U = (K_p + K_i/s)(R - Y) - K_dsY$; clear denominators.', 'ラプラス領域で $Y = G\\,U$、$U = (K_p + K_i/s)(R - Y) - K_dsY$ です。分母を払います。'],
          sol: [[`$(s + 1)^3 Y = (K_p + K_i/s)(R - Y) - K_dsY$; multiply by $s$: $\\big(s(s + 1)^3 + K_ds^2 + K_ps + K_i\\big)Y = (K_ps + K_i)R$.`, `$(s + 1)^3 Y = (K_p + K_i/s)(R - Y) - K_dsY$ の両辺に $s$ を掛けると $\\big(s(s + 1)^3 + K_ds^2 + K_ps + K_i\\big)Y = (K_ps + K_i)R$ です。`], [`$p(s) = s^4 + 3s^3 + ${n(3 + kd)}s^2 + ${n(1 + kp)}s + ${n(ki)}$.`, `$p(s) = s^4 + 3s^3 + ${n(3 + kd)}s^2 + ${n(1 + kp)}s + ${n(ki)}$ です。`], ['Its roots are the crosses in the pole plot. The derivative acts on $y$, not on $e$, so it shapes the poles without adding a zero that would kick at the set-point step.', 'その根が極の図の × 印です。微分は $e$ ではなく $y$ に作用するので、目標値のステップで操作量を蹴り上げる零点を加えずに極の形を整えます。']],
          set: { kp, ki, kd },
        };
      }
      const kd = r.step(0, 2, 0.5), kp = r.step(1, 6, 0.5), a1 = 1 + kp, a2 = 3 + kd, kmax = a1 * (3 * a2 - a1) / 9;
      if (kmax > 3 || kmax <= 0.1) return Q.pid[2](r);
      const ki = Math.min(3, snap(kmax * r.pick([0.5, 0.8, 1.2, 1.5]), 0.05)), stable = ki < kmax;
      return {
        q: [`$K_p = ${n(kp)}$, $K_i = ${n(ki)}$, $K_d = ${n(kd)}$ on $1/(s + 1)^3$. Is the closed loop stable?`, `$1/(s + 1)^3$ に $K_p = ${n(kp)}$、$K_i = ${n(ki)}$、$K_d = ${n(kd)}$ を用います。閉ループは安定ですか。`],
        a: { type: 'choice', opts: [['Stable', '安定'], ['Unstable', '不安定']], v: stable ? 0 : 1, fixed: true },
        hint: ['Use the Routh condition $K_i < (1 + K_p)(3(3 + K_d) - 1 - K_p)/9$.', 'ラウスの条件 $K_i < (1 + K_p)(3(3 + K_d) - 1 - K_p)/9$ を使います。'],
        sol: [[`The limit is $(${n(a1)})(${n(3 * a2)} - ${n(a1)})/9 = ${n(kmax, 4)}$.`, `限界は $(${n(a1)})(${n(3 * a2)} - ${n(a1)})/9 = ${n(kmax, 4)}$ です。`], [stable ? `$K_i = ${n(ki)}$ is below it: stable, and the integrator will remove the offset.` : `$K_i = ${n(ki)}$ is above it: a pair of poles is in the right half-plane and the response grows in oscillation.`, stable ? `$K_i = ${n(ki)}$ はそれより小さいので安定で、積分器がずれを取り除きます。` : `$K_i = ${n(ki)}$ はそれより大きいので一対の極が右半平面にあり、応答は振動しながら増大します。`]],
        set: { kp, ki, kd },
      };
    },
  ];

  /* ---------- 3. Bode and Nyquist for L = K e^{-i w tau}/(1 + i w)^3 ---------- */
  const mag = (K, w) => K / Math.pow(1 + w * w, 1.5);
  const phase = (w, tau) => -3 * Math.atan(w) - w * tau;
  function w180(tau) { let lo = 0, hi = 50; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (3 * Math.atan(m) + m * tau > PI) hi = m; else lo = m; } return (lo + hi) / 2; }
  Q['bode-nyquist'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const K = r.pick([1, 2, 4, 5, 8, 10]), w = r.pick([0.5, 1, 2, 3]), m = mag(K, w);
        return {
          q: [`For $L(i\\omega) = K e^{-i\\omega\\tau}/(1 + i\\omega)^3$ with $K = ${K}$, what is $|L|$ in decibels at $\\omega = ${n(w)}$?`, `$L(i\\omega) = K e^{-i\\omega\\tau}/(1 + i\\omega)^3$、$K = ${K}$ のとき、$\\omega = ${n(w)}$ での $|L|$ はデシベルでいくつですか。`],
          a: { type: 'num', v: 20 * Math.log10(m), tol: 0.02, unit: ['dB', 'dB'] },
          hint: ['$|1 + i\\omega| = \\sqrt{1 + \\omega^2}$ and the delay has modulus 1.', '$|1 + i\\omega| = \\sqrt{1 + \\omega^2}$ で、遅れの絶対値は 1 です。'],
          sol: [[`$|L| = ${K}/(1 + ${n(w * w)})^{3/2} = ${n(m, 4)}$.`, `$|L| = ${K}/(1 + ${n(w * w)})^{3/2} = ${n(m, 4)}$ です。`], [`$20\\log_{10}${n(m, 4)} = ${n(20 * Math.log10(m), 3)}$ dB. Delay never changes this number, only the phase.`, `$20\\log_{10}${n(m, 4)} = ${n(20 * Math.log10(m), 3)}$ dB です。遅れはこの値を変えず、位相だけを変えます。`]],
          set: { gain: K, delay: 0 },
        };
      }
      if (form === 1) {
        const w = r.pick([0.5, 1, 1.5, 2, 3]), tau = r.step(0, 1, 0.25), ph = deg(phase(w, tau));
        return {
          q: [`What is the phase of $L(i\\omega) = K e^{-i\\omega\\tau}/(1 + i\\omega)^3$ at $\\omega = ${n(w)}$ with delay $\\tau = ${n(tau)}$? Give degrees.`, `遅れ $\\tau = ${n(tau)}$ のとき、$\\omega = ${n(w)}$ での $L(i\\omega) = K e^{-i\\omega\\tau}/(1 + i\\omega)^3$ の位相は何度ですか。`],
          a: { type: 'num', v: ph, tol: 0.1, unit: ['°', '°'] },
          hint: ['Each factor $1/(1 + i\\omega)$ contributes $-\\arctan\\omega$; the delay contributes $-\\omega\\tau$ radians.', '各因子 $1/(1 + i\\omega)$ は $-\\arctan\\omega$、遅れは $-\\omega\\tau$ ラジアンを加えます。'],
          sol: [[`$-3\\arctan ${n(w)} = ${n(deg(-3 * Math.atan(w)), 4)}^\\circ$; the delay adds $-${n(w * tau)}\\ \\text{rad} = ${n(-deg(w * tau), 4)}^\\circ$.`, `$-3\\arctan ${n(w)} = ${n(deg(-3 * Math.atan(w)), 4)}^\\circ$ で、遅れが $-${n(w * tau)}\\ \\text{rad} = ${n(-deg(w * tau), 4)}^\\circ$ を加えます。`], [`Total $${n(ph, 4)}^\\circ$. The lag phase is what drags the Nyquist curve round towards $-1$.`, `合計 $${n(ph, 4)}^\\circ$ です。この位相遅れがナイキスト曲線を $-1$ の方へ回り込ませます。`]],
          set: { delay: tau },
        };
      }
      const K = r.pick([1, 2, 2.5, 4, 5, 6.4, 10, 12]);
      return {
        q: [`Without delay, the phase of $K/(1 + i\\omega)^3$ reaches $-180^\\circ$ at $\\omega = \\sqrt3$. What is the gain margin (as a factor) when $K = ${n(K)}$?`, `遅れがないとき、$K/(1 + i\\omega)^3$ の位相は $\\omega = \\sqrt3$ で $-180^\\circ$ に達します。$K = ${n(K)}$ のときのゲイン余裕（倍率）はいくつですか。`],
        a: { type: 'num', v: 8 / K, show: frac(80, 10 * K) },
        hint: ['Gain margin $= 1/|L(i\\omega_{180})|$.', 'ゲイン余裕 $= 1/|L(i\\omega_{180})|$ です。'],
        sol: [[`$|L(i\\sqrt3)| = ${n(K)}/(1 + 3)^{3/2} = ${n(K)}/8$.`, `$|L(i\\sqrt3)| = ${n(K)}/(1 + 3)^{3/2} = ${n(K)}/8$ です。`], [`Gain margin $= 8/${n(K)} = ${n(8 / K, 4)}$${K > 8 ? ': below 1, so the loop is already unstable.' : K === 8 ? '' : `: the gain could be raised by this factor before instability.`}`, `ゲイン余裕 $= 8/${n(K)} = ${n(8 / K, 4)}$ です${K > 8 ? '。1 より小さいので、ループはすでに不安定です。' : `。不安定になるまで、ゲインをこの倍率まで上げられます。`}`]],
        set: { gain: K, delay: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let K, tau, wc, pm;
        do { K = r.step(1.5, 7, 0.5); tau = r.step(0, 0.6, 0.1); wc = Math.sqrt(Math.pow(K, 2 / 3) - 1); pm = 180 + deg(phase(wc, tau)); } while (pm < -40);
        return {
          q: [`Loop $L = ${n(K)}\\,e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$. Find the gain crossover frequency $\\omega_c$ and the phase margin in degrees.`, `ループ $L = ${n(K)}\\,e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$ のゲイン交差周波数 $\\omega_c$ と位相余裕（度）を求めてください。`],
          a: { type: 'tuple', v: [wc, pm], labels: ['$\\omega_c$', ['PM (°)', '位相余裕（°）']], tol: 0.05 },
          hint: ['At $\\omega_c$, $|L| = 1$; the phase margin is $180^\\circ$ plus the phase there.', '$\\omega_c$ では $|L| = 1$ で、位相余裕は $180^\\circ$ にそこでの位相を足したものです。'],
          sol: [[`$${n(K)}/(1 + \\omega_c^2)^{3/2} = 1$ gives $\\omega_c = \\sqrt{${n(K)}^{2/3} - 1} = ${n(wc, 4)}$.`, `$${n(K)}/(1 + \\omega_c^2)^{3/2} = 1$ より $\\omega_c = \\sqrt{${n(K)}^{2/3} - 1} = ${n(wc, 4)}$ です。`], [`Phase there: $-3\\arctan ${n(wc, 4)} - ${n(wc * tau, 4)}\\ \\text{rad} = ${n(deg(phase(wc, tau)), 4)}^\\circ$, so PM $= ${n(pm, 4)}^\\circ$.`, `そこでの位相は $-3\\arctan ${n(wc, 4)} - ${n(wc * tau, 4)}\\ \\text{rad} = ${n(deg(phase(wc, tau)), 4)}^\\circ$ なので、位相余裕は $${n(pm, 4)}^\\circ$ です。`], [pm > 0 ? 'Positive: the curve passes $-1$ on the safe side. A margin of $30^\\circ$ to $60^\\circ$ is the usual target for a well-damped loop.' : 'Negative: the curve has wrapped round $-1$, and the closed loop is unstable.', pm > 0 ? '正なので曲線は $-1$ の安全な側を通ります。よく減衰したループでは $30^\\circ$ から $60^\\circ$ がふつうの目標です。' : '負なので曲線は $-1$ を回り込んでおり、閉ループは不安定です。']],
          set: { gain: K, delay: tau },
        };
      }
      if (form === 1) {
        const K = r.pick([0.5, 1, 2, 3, 4, 6, 10, 12]), gm = 20 * Math.log10(8 / K);
        return {
          q: [`No delay, $K = ${n(K)}$. What is the gain margin of $K/(1 + i\\omega)^3$ in decibels?`, `遅れなし、$K = ${n(K)}$ のとき、$K/(1 + i\\omega)^3$ のゲイン余裕はデシベルでいくつですか。`],
          a: { type: 'num', v: gm, tol: 0.02, unit: ['dB', 'dB'] },
          hint: ['Find $|L|$ where the phase is $-180^\\circ$, i.e. at $\\omega = \\sqrt3$.', '位相が $-180^\\circ$ になる $\\omega = \\sqrt3$ での $|L|$ を求めます。'],
          sol: [[`$|L(i\\sqrt3)| = ${n(K)}/8$, so the margin is $8/${n(K)} = ${n(8 / K, 4)}$.`, `$|L(i\\sqrt3)| = ${n(K)}/8$ なので余裕は $8/${n(K)} = ${n(8 / K, 4)}$ です。`], [`In decibels $20\\log_{10}${n(8 / K, 4)} = ${n(gm, 3)}$ dB, the gap between the gain curve and 0 dB on the Bode plot at the phase crossover.${gm < 0 ? ' Negative: unstable.' : ''}`, `デシベルでは $20\\log_{10}${n(8 / K, 4)} = ${n(gm, 3)}$ dB で、位相交差でのボード線図のゲイン曲線と 0 dB の差です。${gm < 0 ? '負なので不安定です。' : ''}`]],
          set: { gain: K, delay: 0 },
        };
      }
      let K, tau, wp, m;
      do { K = r.step(1, 12, 0.5); tau = r.step(0, 1.5, 0.25); wp = w180(tau); m = mag(K, wp); } while (Math.abs(m - 1) < 0.08);
      return {
        q: [`$L = ${n(K)}\\,e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$. Is the closed loop stable?`, `$L = ${n(K)}\\,e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$ の閉ループは安定ですか。`],
        a: { type: 'choice', opts: [['Stable: $|L| < 1$ when the phase reaches $-180^\\circ$', '安定：位相が $-180^\\circ$ に達するとき $|L| < 1$'], ['Unstable: $|L| > 1$ when the phase reaches $-180^\\circ$', '不安定：位相が $-180^\\circ$ に達するとき $|L| > 1$']], v: m < 1 ? 0 : 1, fixed: true },
        hint: ['Find the phase crossover $\\omega_{180}$ from $3\\arctan\\omega + \\omega\\tau = \\pi$, then compare $|L|$ there with 1.', '$3\\arctan\\omega + \\omega\\tau = \\pi$ から位相交差 $\\omega_{180}$ を求め、そこでの $|L|$ を 1 と比べます。'],
        sol: [[`Solving $3\\arctan\\omega + ${n(tau)}\\omega = \\pi$ numerically gives $\\omega_{180} = ${n(wp, 4)}$.`, `$3\\arctan\\omega + ${n(tau)}\\omega = \\pi$ を数値的に解くと $\\omega_{180} = ${n(wp, 4)}$ です。`], [`$|L(i\\omega_{180})| = ${n(K)}/(1 + ${n(wp * wp, 4)})^{3/2} = ${n(m, 4)}$ ${m < 1 ? '< 1' : '> 1'}.`, `$|L(i\\omega_{180})| = ${n(K)}/(1 + ${n(wp * wp, 4)})^{3/2} = ${n(m, 4)}$ ${m < 1 ? '< 1' : '> 1'} です。`], [m < 1 ? 'The Nyquist curve crosses the negative real axis inside $-1$: no encirclement, stable.' : 'The curve crosses the negative real axis beyond $-1$ and encircles it: unstable.', m < 1 ? 'ナイキスト曲線は $-1$ より内側で負の実軸を横切るので、囲まず安定です。' : '曲線は $-1$ より外側で負の実軸を横切って囲むので、不安定です。']],
        set: { gain: K, delay: tau },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const K = r.pick([1.5, 2, 3, 4, 5, 6]), wc = Math.sqrt(Math.pow(K, 2 / 3) - 1), pm = PI - 3 * Math.atan(wc), tmax = pm / wc;
        return {
          q: [`$L = ${n(K)}\\,e^{-i\\omega\\tau}/(1 + i\\omega)^3$. What is the largest delay $\\tau$ the loop tolerates before going unstable (the delay margin)?`, `$L = ${n(K)}\\,e^{-i\\omega\\tau}/(1 + i\\omega)^3$ のループが不安定になる前に許容できる最大の遅れ $\\tau$（遅れ余裕）はいくつですか。`],
          a: { type: 'num', v: tmax, tol: 2e-3 },
          hint: ['A delay rotates every point of the Nyquist curve by $-\\omega\\tau$ without changing its length. It must not rotate the point with $|L| = 1$ onto $-1$.', '遅れはナイキスト曲線の各点を長さを変えずに $-\\omega\\tau$ だけ回します。$|L| = 1$ の点を $-1$ まで回してはいけません。'],
          sol: [[`$\\omega_c = \\sqrt{${n(K)}^{2/3} - 1} = ${n(wc, 4)}$, and without delay the phase margin is $\\pi - 3\\arctan\\omega_c = ${n(pm, 4)}$ rad.`, `$\\omega_c = \\sqrt{${n(K)}^{2/3} - 1} = ${n(wc, 4)}$ で、遅れがないときの位相余裕は $\\pi - 3\\arctan\\omega_c = ${n(pm, 4)}$ rad です。`], [`The delay eats $\\omega_c\\tau$ of it, so $\\tau_{\\max} = ${n(pm, 4)}/${n(wc, 4)} = ${n(tmax, 4)}$.`, `遅れはそのうち $\\omega_c\\tau$ を食うので $\\tau_{\\max} = ${n(pm, 4)}/${n(wc, 4)} = ${n(tmax, 4)}$ です。`], ['Higher gain means a higher crossover frequency, so the same delay costs more phase: fast loops are the most delay-sensitive.', 'ゲインが高いほど交差周波数が高くなり、同じ遅れでも位相を多く失います。速いループほど遅れに敏感です。']],
          set: { gain: K, delay: Math.min(2, snap(tmax, 0.02)) },
        };
      }
      if (form === 1) {
        const pmT = r.pick([30, 40, 45, 50, 60]), wc = Math.tan((180 - pmT) / 3 * PI / 180), K = Math.pow(1 + wc * wc, 1.5);
        return {
          q: [`Without delay, which gain $K$ gives $L = K/(1 + i\\omega)^3$ a phase margin of exactly $${pmT}^\\circ$?`, `遅れがないとき、$L = K/(1 + i\\omega)^3$ の位相余裕をちょうど $${pmT}^\\circ$ にするゲイン $K$ はいくつですか。`],
          a: { type: 'num', v: K, tol: 2e-3 },
          hint: ['First find where the phase is $-(180 - ' + pmT + ')^\\circ$; then choose $K$ so that $|L| = 1$ there.', 'まず位相が $-(180 - ' + pmT + ')^\\circ$ になる所を求め、そこで $|L| = 1$ となるように $K$ を選びます。'],
          sol: [[`$3\\arctan\\omega_c = ${180 - pmT}^\\circ$, so $\\omega_c = \\tan ${n((180 - pmT) / 3)}^\\circ = ${n(wc, 4)}$.`, `$3\\arctan\\omega_c = ${180 - pmT}^\\circ$ より $\\omega_c = \\tan ${n((180 - pmT) / 3)}^\\circ = ${n(wc, 4)}$ です。`], [`$K = (1 + \\omega_c^2)^{3/2} = ${n(K, 4)}$.`, `$K = (1 + \\omega_c^2)^{3/2} = ${n(K, 4)}$ です。`], [`The gain margin is then $8/${n(K, 4)} = ${n(8 / K, 3)}$: specifying one margin fixes the other for this plant.`, `このときゲイン余裕は $8/${n(K, 4)} = ${n(8 / K, 3)}$ です。このプラントでは一方の余裕を決めるともう一方も決まります。`]],
          set: { gain: snap(K, 0.1), delay: 0 },
        };
      }
      const tau = r.pick([0, 0.5, 1, 2]);
      return {
        q: [`Write the phase $\\varphi(\\omega)$ of $L(i\\omega) = K e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$, in radians, as a function of $\\omega$.`, `$L(i\\omega) = K e^{-i\\omega\\,${n(tau)}}/(1 + i\\omega)^3$ の位相 $\\varphi(\\omega)$ を、ラジアンで $\\omega$ の式として書いてください。`],
        a: { type: 'expr', v: `-3*atan(omega)${tau ? `-${n(tau)}*omega` : ''}`, vars: ['omega'], dom: { omega: [0.1, 3] }, lhs: ['$\\varphi(\\omega) =$', '$\\varphi(\\omega) =$'] },
        hint: ['Phases of a product add; $\\arg(1 + i\\omega) = \\arctan\\omega$ and $\\arg e^{-i\\omega\\tau} = -\\omega\\tau$.', '積の位相は足し算です。$\\arg(1 + i\\omega) = \\arctan\\omega$、$\\arg e^{-i\\omega\\tau} = -\\omega\\tau$ です。'],
        sol: [[`$\\varphi(\\omega) = -3\\arctan\\omega${tau ? ` - ${n(tau)}\\omega` : ''}$.`, `$\\varphi(\\omega) = -3\\arctan\\omega${tau ? ` - ${n(tau)}\\omega` : ''}$ です。`], [tau ? 'The lag of the three poles saturates at $-270^\\circ$, but the delay term grows without bound: that is why the Nyquist curve of a delayed loop spirals into the origin.' : 'Without delay the phase tends to $-270^\\circ$, so the Nyquist curve crosses the negative real axis exactly once, at $\\omega = \\sqrt3$.', tau ? '三つの極による遅れは $-270^\\circ$ で頭打ちになりますが、遅れの項は限りなく増えます。遅れのあるループのナイキスト曲線が原点へ渦を巻いて入るのはこのためです。' : '遅れがなければ位相は $-270^\\circ$ に近づくので、ナイキスト曲線は負の実軸を $\\omega = \\sqrt3$ でちょうど一回横切ります。']],
        set: { delay: tau },
      };
    },
  ];
})();
