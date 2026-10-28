'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, terms } = P.util;
  const PI = Math.PI, TAU = 2 * PI;
  const H = (q, p) => p * p / 2 - Math.cos(q);

  /* ---------- 1. Liouville: phase flow of the pendulum H = p^2/2 - cos q ---------- */
  Q['phase-flow'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rad = r.step(0.1, 0.6, 0.01), t = r.step(1, 16, 0.5), q0 = r.step(-2, 2, 0.05), p0 = r.step(-1.5, 1.5, 0.05);
        return {
          q: [`A disc of initial states of radius $${n(rad)}$ in the pendulum's phase plane is carried by the flow for a time $t = ${n(t)}$. What is the area of the set it becomes?`, `振り子の相平面で、半径 $${n(rad)}$ の初期状態の円板を流れに乗せて時間 $t = ${n(t)}$ だけ運びます。運ばれた集合の面積はいくつですか。`],
          a: { type: 'num', v: PI * rad * rad, show: `\\pi\\cdot ${n(rad)}^2` },
          hint: ['Hamiltonian flow preserves phase-space area, however much it distorts the shape.', 'ハミルトン流は、形をどれほどゆがめても相空間の面積を保ちます。'],
          sol: [[`At $t = 0$ the area is $\\pi r^2 = ${n(PI * rad * rad, 4)}$.`, `$t = 0$ での面積は $\\pi r^2 = ${n(PI * rad * rad, 4)}$ です。`], ['Liouville\'s theorem: the velocity field $(\\partial_p H, -\\partial_q H)$ has zero divergence, so the area never changes. The disc only shears into a filament of the same area, as the readout\'s ratio shows.', 'リウヴィルの定理：速度場 $(\\partial_p H, -\\partial_q H)$ の発散は 0 なので面積は変わりません。円板は同じ面積の糸へとせん断されるだけで、読み取り欄の比がそれを示しています。']],
          set: { radius: rad, t, q0, p0 },
        };
      }
      if (form === 1) {
        const q0 = r.step(-3, 3, 0.05), p0 = r.step(-2.5, 2.5, 0.05), E = H(q0, p0);
        return {
          q: [`For the pendulum $H = \\tfrac12 p^2 - \\cos q$, what is the energy of the state $q = ${n(q0)}$, $p = ${n(p0)}$? Give three decimals.`, `振り子 $H = \\tfrac12 p^2 - \\cos q$ で、状態 $q = ${n(q0)}$、$p = ${n(p0)}$ のエネルギーはいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: E, tol: 6e-4 },
          sol: [[`$H = \\tfrac12(${n(p0)})^2 - \\cos(${n(q0)}) = ${n(p0 * p0 / 2, 4)} - (${n(Math.cos(q0), 4)}) = ${n(E, 4)}$.`, `$H = \\tfrac12(${n(p0)})^2 - \\cos(${n(q0)}) = ${n(p0 * p0 / 2, 4)} - (${n(Math.cos(q0), 4)}) = ${n(E, 4)}$ です。`], [E < 1 ? 'Below the separatrix value $H = 1$, so this state swings back and forth.' : 'Above the separatrix value $H = 1$, so this state goes over the top.', E < 1 ? 'セパラトリクスの値 $H = 1$ より小さいので、この状態は行ったり来たり揺れます。' : 'セパラトリクスの値 $H = 1$ より大きいので、この状態は頂点を越えて回ります。']],
          set: { q0, p0 },
        };
      }
      const kind = r.int(0, 2), a = r.pick([2, 3, 5, 0.5]), m = r.pick([1, 2, 4]);
      const V = [[`${n(a)}q^4`, `${4 * a}q^3`, `-${4 * a}q^3`], [`${n(a / 2)}q^2`, `${a}q`, `-${a}q`], [`${n(a)}\\cos q`, `-${a}sin(q)`, `${a}sin(q)`]][kind];
      const vTeX = [`-${n(4 * a)}q^3`, `-${n(a)}q`, `${n(a)}\\sin q`][kind];
      return {
        q: [`For $H = \\dfrac{p^2}{${2 * m}} + ${V[0]}$, write Hamilton's equation for $\\dot p$ as a function of $q$.`, `$H = \\dfrac{p^2}{${2 * m}} + ${V[0]}$ について、$\\dot p$ に対するハミルトンの方程式を $q$ の関数で書いてください。`],
        a: { type: 'expr', v: V[2], vars: ['q'], dom: { q: [-2, 2] }, lhs: ['$\\dot p =$', '$\\dot p =$'] },
        hint: ['$\\dot p = -\\partial H/\\partial q$; the kinetic term does not depend on $q$.', '$\\dot p = -\\partial H/\\partial q$ です。運動エネルギーの項は $q$ によりません。'],
        sol: [[`$\\partial H/\\partial q$ comes only from the potential: $${V[1].replace('sin(q)', '\\sin q')}$.`, `$\\partial H/\\partial q$ はポテンシャルからだけ来て、$${V[1].replace('sin(q)', '\\sin q')}$ です。`], [`$\\dot p = ${vTeX}$, the force; the other equation is $\\dot q = \\partial H/\\partial p = p/${m}$.`, `$\\dot p = ${vTeX}$ で、これは力です。もう一方の式は $\\dot q = \\partial H/\\partial p = p/${m}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let q0, p0, E; do { q0 = r.step(-3, 3, 0.05); p0 = r.step(-2.5, 2.5, 0.05); E = H(q0, p0); } while (Math.abs(E - 1) < 0.08);
        const v = E < 1 ? 0 : 1;
        return {
          q: [`The pendulum $H = \\tfrac12 p^2 - \\cos q$ starts at $q = ${n(q0)}$, $p = ${n(p0)}$. What does it do?`, `振り子 $H = \\tfrac12 p^2 - \\cos q$ が $q = ${n(q0)}$、$p = ${n(p0)}$ から動き始めます。どう動きますか。`],
          a: { type: 'choice', opts: [['It swings back and forth (libration)', '行ったり来たり揺れる（秤動）'], ['It goes over the top for ever (rotation)', '頂点を越えていつまでも回る（回転）'], ['It comes to rest at the bottom', '最下点で止まる']], v, fixed: true },
          hint: ['Compare the energy with the separatrix value $H = 1$, the energy of balancing upside down.', 'エネルギーを、逆立ちで釣り合う状態のエネルギーであるセパラトリクスの値 $H = 1$ と比べてください。'],
          sol: [[`$H = ${n(p0 * p0 / 2, 4)} - (${n(Math.cos(q0), 4)}) = ${n(E, 4)}$.`, `$H = ${n(p0 * p0 / 2, 4)} - (${n(Math.cos(q0), 4)}) = ${n(E, 4)}$ です。`], [E < 1 ? '$H < 1$: the pendulum cannot reach the top, where $H \\ge 1$, so it turns back. Energy is conserved and there is no friction, so it never stops.' : '$H > 1$: even at the top $p^2 = 2(H - 1) > 0$, so it never stops and keeps rotating.', E < 1 ? '$H < 1$ なので、$H \\ge 1$ が必要な頂点には届かずに折り返します。エネルギーは保存され摩擦もないので、止まることはありません。' : '$H > 1$ なので頂点でも $p^2 = 2(H - 1) > 0$ で、止まることなく回り続けます。']],
          set: { q0, p0 },
        };
      }
      if (form === 1) {
        const g = r.pick([0.05, 0.1, 0.2, 0.3]), t = r.pick([2, 4, 5, 8, 10]), rad = r.step(0.2, 0.6, 0.05), A0 = PI * rad * rad, A = A0 * Math.exp(-g * t);
        return {
          q: [`Add friction to the pendulum: $\\dot q = p$, $\\dot p = -\\sin q - ${g}\\,p$. A disc of initial states of radius $${n(rad)}$ is carried for a time $t = ${t}$. What is its area now?`, `振り子に摩擦を加えます：$\\dot q = p$、$\\dot p = -\\sin q - ${g}\\,p$。半径 $${n(rad)}$ の初期状態の円板を時間 $t = ${t}$ だけ運ぶと、面積はいくつになりますか。`],
          a: { type: 'num', v: A },
          hint: ['The rate of change of area is the area times the divergence of the velocity field.', '面積の変化率は、面積に速度場の発散をかけたものです。'],
          sol: [[`$\\nabla\\cdot(\\dot q, \\dot p) = \\partial_q(p) + \\partial_p(-\\sin q - ${g}p) = -${g}$, the same everywhere.`, `$\\nabla\\cdot(\\dot q, \\dot p) = \\partial_q(p) + \\partial_p(-\\sin q - ${g}p) = -${g}$ で、至るところ同じです。`], [`So $A(t) = A_0e^{-${g}t} = ${n(A0, 4)}\\times e^{-${n(g * t)}} = ${n(A, 4)}$.`, `よって $A(t) = A_0e^{-${g}t} = ${n(A0, 4)}\\times e^{-${n(g * t)}} = ${n(A, 4)}$ です。`], ['Friction is not Hamiltonian: it squeezes phase space, and every state ends up at the bottom. Without it the lab\'s ratio stays at 1.', '摩擦はハミルトン系ではありません。相空間を押し縮め、すべての状態は最下点に集まります。摩擦がなければ実験の比は 1 のままです。']],
        };
      }
      let q0, p0, E; do { q0 = r.step(-2, 2, 0.05); p0 = r.step(-1.5, 1.5, 0.05); E = H(q0, p0); } while (E > 0.9 || E < -0.95);
      const qm = Math.acos(-E);
      return {
        q: [`The pendulum $H = \\tfrac12 p^2 - \\cos q$ starts at $q = ${n(q0)}$, $p = ${n(p0)}$. What is the amplitude $q_{\\max}$ of its swing, in radians?`, `振り子 $H = \\tfrac12 p^2 - \\cos q$ が $q = ${n(q0)}$、$p = ${n(p0)}$ から動き始めます。振れの振幅 $q_{\\max}$ をラジアンで求めてください。`],
        a: { type: 'num', v: qm, tol: 0.002 },
        hint: ['At the turning point $p = 0$, so $-\\cos q_{\\max} = H$.', '折り返し点では $p = 0$ なので $-\\cos q_{\\max} = H$ です。'],
        sol: [[`$H = ${n(E, 4)}$.`, `$H = ${n(E, 4)}$ です。`], [`$\\cos q_{\\max} = -H = ${n(-E, 4)}$, so $q_{\\max} = ${n(qm, 4)}$ rad $= ${n(qm * 180 / PI, 1)}^\\circ$.`, `$\\cos q_{\\max} = -H = ${n(-E, 4)}$ より $q_{\\max} = ${n(qm, 4)}$ rad $= ${n(qm * 180 / PI, 1)}^\\circ$ です。`], ['In the phase plane this is where the energy contour through the start meets the $q$-axis.', '相平面では、出発点を通るエネルギーの等高線が $q$ 軸と交わる点です。']],
        set: { q0, p0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rad = r.pick([0.1, 0.05, 0.2, 0.01]), t = r.pick([1, 2, 3, 4, 5]), big = rad * Math.exp(t);
        return {
          q: [`Near the upside-down equilibrium the pendulum is $H \\approx \\tfrac12 p^2 - \\tfrac12 q^2$ (measuring $q$ from the top, up to a constant). A small disc of states of radius $${rad}$ centred there is carried for a time $t = ${t}$. What is the longest semi-axis of the ellipse it becomes?`, `逆立ちの釣り合いの近くでは、振り子は $H \\approx \\tfrac12 p^2 - \\tfrac12 q^2$ です（$q$ は頂点から測り、定数は省きます）。そこを中心とする半径 $${rad}$ の小さな状態の円板を時間 $t = ${t}$ だけ運ぶと、できる楕円の長い半軸の長さはいくつですか。`],
          a: { type: 'num', v: big },
          hint: ['In the variables $u = (q + p)/\\sqrt2$, $w = (q - p)/\\sqrt2$ the equations decouple: $\\dot u = u$, $\\dot w = -w$.', '$u = (q + p)/\\sqrt2$、$w = (q - p)/\\sqrt2$ とおくと方程式は分離して $\\dot u = u$、$\\dot w = -w$ になります。'],
          sol: [['$\\dot q = p$ and $\\dot p = q$, so along the diagonal $u$ states grow like $e^{t}$ and along $w$ they shrink like $e^{-t}$.', '$\\dot q = p$、$\\dot p = q$ なので、対角線 $u$ の方向には $e^{t}$ で伸び、$w$ の方向には $e^{-t}$ で縮みます。'], [`The disc becomes an ellipse with semi-axes $${rad}e^{${t}} = ${n(big, 4)}$ and $${rad}e^{-${t}} = ${n(rad * Math.exp(-t), 5)}$.`, `円板は半軸 $${rad}e^{${t}} = ${n(big, 4)}$ と $${rad}e^{-${t}} = ${n(rad * Math.exp(-t), 5)}$ の楕円になります。`], ['Their product, and so the area, is unchanged: this saddle is exactly where the lab\'s blob is drawn out into a long filament along the separatrix.', '二つの積、つまり面積は変わりません。実験で塊がセパラトリクスに沿って長い糸へ引き伸ばされるのは、まさにこの鞍点のところです。']],
        };
      }
      if (form === 1) {
        return {
          q: ['For $H = \\tfrac12 p^2 - \\cos q$, write the upper branch of the separatrix as $p(q)$ for $-\\pi < q < \\pi$.', '$H = \\tfrac12 p^2 - \\cos q$ について、$-\\pi < q < \\pi$ でのセパラトリクスの上の枝を $p(q)$ の形で書いてください。'],
          a: { type: 'expr', v: '2cos(q/2)', vars: ['q'], dom: { q: [-3, 3] }, lhs: ['$p(q) =$', '$p(q) =$'] },
          hint: ['The separatrix is the energy level through the upside-down equilibrium $(\\pm\\pi, 0)$.', 'セパラトリクスは、逆立ちの釣り合い $(\\pm\\pi, 0)$ を通るエネルギー準位です。'],
          sol: [['At $(\\pi, 0)$, $H = 1$. So $\\tfrac12 p^2 = 1 + \\cos q$.', '$(\\pi, 0)$ では $H = 1$ なので $\\tfrac12 p^2 = 1 + \\cos q$ です。'], ['With $1 + \\cos q = 2\\cos^2(q/2)$, $p = 2\\cos(q/2)$ on the upper branch.', '$1 + \\cos q = 2\\cos^2(q/2)$ より、上の枝では $p = 2\\cos(q/2)$ です。'], ['It reaches $p = 2$ at the bottom and $0$ at $q = \\pm\\pi$, which a state on it approaches but takes infinitely long to reach.', '最下点で $p = 2$、$q = \\pm\\pi$ で 0 になります。この曲線上の状態はそこへ近づきますが、到達するには無限の時間がかかります。']],
          set: { q0: 0, p0: 2 },
        };
      }
      let a, b, c, d; do { a = r.int(-2, 2); b = r.int(-3, 3); c = r.int(-3, 3); d = r.int(-2, 2); } while ((b === 0 && c === 0) || (a + d !== 0 && r.chance(0.35)));
      const A0 = r.pick([1, 2, 0.5, 3]), t = r.pick([0.5, 1, 2]), div = a + d, A = A0 * Math.exp(div * t);
      return {
        q: [`The linear flow $\\dot q = ${terms([[a, 'q'], [b, 'p']])}$, $\\dot p = ${terms([[c, 'q'], [d, 'p']])}$ carries a region of area $${A0}$ for a time $t = ${t}$. What is its area then?`, `線形の流れ $\\dot q = ${terms([[a, 'q'], [b, 'p']])}$、$\\dot p = ${terms([[c, 'q'], [d, 'p']])}$ が面積 $${A0}$ の領域を時間 $t = ${t}$ だけ運びます。そのときの面積はいくつですか。`],
        a: { type: 'num', v: A },
        hint: ['Area grows at the rate given by the divergence, the trace of the matrix.', '面積は発散、つまり行列の跡で決まる割合で増えます。'],
        sol: [[`$\\nabla\\cdot(\\dot q, \\dot p) = ${a} + (${d}) = ${div}$.`, `$\\nabla\\cdot(\\dot q, \\dot p) = ${a} + (${d}) = ${div}$ です。`], [`$A = ${A0}\\,e^{${div}\\times ${t}} = ${n(A, 4)}$.`, `$A = ${A0}\\,e^{${div}\\times ${t}} = ${n(A, 4)}$ です。`], [div === 0 ? `The trace is zero, so the flow is Hamiltonian, with $H = ${terms([[b / 2, 'p^2'], [-a, 'qp'], [-c / 2, 'q^2']])}$, and area is preserved.` : 'A non-zero trace means no Hamiltonian generates this flow: Liouville\'s theorem is exactly the statement that Hamiltonian flows have zero divergence.', div === 0 ? `跡が 0 なので、この流れは $H = ${terms([[b / 2, 'p^2'], [-a, 'qp'], [-c / 2, 'q^2']])}$ によるハミルトン流で、面積は保たれます。` : '跡が 0 でないので、この流れを生み出すハミルトニアンはありません。リウヴィルの定理とは、ハミルトン流の発散が 0 だということそのものです。']],
      };
    },
  ];

  /* ---------- 2. symplectic integrators ---------- */
  Q.symplectic = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const e = r.step(0, 0.8, 0.05), v = Math.sqrt((1 + e) / (1 - e));
        return {
          q: [`The lab's orbit has $GM = 1$, semi-major axis $a = 1$ and eccentricity $e = ${n(e)}$, starting at periapsis $r = 1 - e$. What is the starting speed?`, `この実験の軌道は $GM = 1$、長半径 $a = 1$、離心率 $e = ${n(e)}$ で、近点 $r = 1 - e$ から出発します。出発時の速さはいくつですか。`],
          a: { type: 'num', v, show: `\\sqrt{${n(1 + e)}/${n(1 - e)}}` },
          hint: ['Use vis-viva, $v^2 = GM(2/r - 1/a)$.', '活力の式 $v^2 = GM(2/r - 1/a)$ を使ってください。'],
          sol: [[`$v^2 = \\dfrac{2}{1 - e} - 1 = \\dfrac{1 + e}{1 - e} = \\dfrac{${n(1 + e)}}{${n(1 - e)}}$.`, `$v^2 = \\dfrac{2}{1 - e} - 1 = \\dfrac{1 + e}{1 - e} = \\dfrac{${n(1 + e)}}{${n(1 - e)}}$ です。`], [`$v = ${n(v, 4)}$. Every one of these orbits has energy $-\\tfrac12$ and period $2\\pi$; only the shape changes.`, `$v = ${n(v, 4)}$ です。どの軌道もエネルギーは $-\\tfrac12$、周期は $2\\pi$ で、変わるのは形だけです。`]],
          set: { ecc: e },
        };
      }
      if (form === 1) {
        const h = r.pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.3]), q0 = r.pick([1, 0, 0.6, 0.8, 2]), p0 = q0 === 0 ? 1 : r.pick([0, 0.8, 0.6, 1]);
        const E0 = (q0 * q0 + p0 * p0) / 2, E1 = E0 * (1 + h * h);
        return {
          q: [`One explicit Euler step of size $h = ${h}$ for $H = \\tfrac12(p^2 + q^2)$, $q_1 = q_0 + hp_0$, $p_1 = p_0 - hq_0$, starts at $(q_0, p_0) = (${q0}, ${p0})$. What is the energy after the step?`, `$H = \\tfrac12(p^2 + q^2)$ について、刻み $h = ${h}$ の陽的オイラー法 $q_1 = q_0 + hp_0$、$p_1 = p_0 - hq_0$ を $(q_0, p_0) = (${q0}, ${p0})$ から一歩進めます。その後のエネルギーはいくつですか。`],
          a: { type: 'num', v: E1, rel: 1e-4 },
          hint: ['Expand $(q_0 + hp_0)^2 + (p_0 - hq_0)^2$: the cross terms cancel.', '$(q_0 + hp_0)^2 + (p_0 - hq_0)^2$ を展開すると交差項が消えます。'],
          sol: [[`$(q_1, p_1) = (${n(q0 + h * p0)}, ${n(p0 - h * q0)})$.`, `$(q_1, p_1) = (${n(q0 + h * p0)}, ${n(p0 - h * q0)})$ です。`], [`$E_1 = \\tfrac12(q_1^2 + p_1^2) = (1 + h^2)E_0 = ${n(1 + h * h, 5)}\\times ${n(E0)} = ${n(E1, 6)}$.`, `$E_1 = \\tfrac12(q_1^2 + p_1^2) = (1 + h^2)E_0 = ${n(1 + h * h, 5)}\\times ${n(E0)} = ${n(E1, 6)}$ です。`], ['Every step multiplies the energy by the same $1 + h^2$: Euler always spirals outward, the orange trail in the lab.', '一歩ごとにエネルギーは同じ $1 + h^2$ 倍になります。オイラー法はいつも外へ渦を巻き、実験の橙の軌跡がそれです。']],
        };
      }
      const h = r.step(0.01, 0.3, 0.01), N = Math.round(TAU / h);
      return {
        q: [`The lab's orbits all have period $2\\pi$. With time step $h = ${n(h)}$, about how many steps does one orbit take? Give the nearest whole number.`, `この実験の軌道の周期はどれも $2\\pi$ です。時間刻み $h = ${n(h)}$ では、一周におよそ何歩かかりますか。最も近い整数で答えてください。`],
        a: { type: 'int', v: N },
        sol: [[`$2\\pi/${n(h)} = ${n(TAU / h, 3)}$, so about $${N}$ steps.`, `$2\\pi/${n(h)} = ${n(TAU / h, 3)}$ なので、およそ $${N}$ 歩です。`], ['Near periapsis of an eccentric orbit the body moves fastest, so a fixed step resolves that part worst, which is where the errors are made.', '離心率の大きな軌道では近点付近で最も速く動くので、一定の刻みではそこが最も粗くなり、誤差はそこで生まれます。']],
        set: { h },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.pick([0.01, 0.02, 0.05, 0.1, 0.2]), N = TAU / h, f = (1 + h * h) ** N;
        return {
          q: [`Explicit Euler multiplies the energy of $H = \\tfrac12(p^2 + q^2)$ by $1 + h^2$ every step. By what factor has the energy grown after one period ($t = 2\\pi$) with $h = ${h}$?`, `陽的オイラー法は $H = \\tfrac12(p^2 + q^2)$ のエネルギーを一歩ごとに $1 + h^2$ 倍にします。$h = ${h}$ で一周期（$t = 2\\pi$）進めると、エネルギーは何倍になりますか。`],
          a: { type: 'num', v: f, rel: 0.002 },
          hint: ['One period is $2\\pi/h$ steps.', '一周期は $2\\pi/h$ 歩です。'],
          sol: [[`$(1 + h^2)^{2\\pi/h} = ${n(1 + h * h, 5)}^{${n(N, 2)}}$.`, `$(1 + h^2)^{2\\pi/h} = ${n(1 + h * h, 5)}^{${n(N, 2)}}$ です。`], [`$= ${n(f, 4)}$, close to $e^{2\\pi h} = ${n(Math.exp(TAU * h), 4)}$.`, `$= ${n(f, 4)}$ で、$e^{2\\pi h} = ${n(Math.exp(TAU * h), 4)}$ に近い値です。`], ['The error per period is first order in $h$ and compounds: halving $h$ only halves the growth rate, and over many periods the orbit always escapes.', '一周期あたりの誤差は $h$ の一次で、しかも複利で増えます。$h$ を半分にしても成長率が半分になるだけで、多くの周期を経れば軌道は必ず逃げていきます。']],
        };
      }
      if (form === 1) {
        const h = r.pick([0.1, 0.2, 0.5, 0.25, 0.4]), q0 = r.pick([1, 0, 2, 0.5]), p0 = q0 === 0 ? 1 : r.pick([0, 1, -1]);
        const ph = p0 - h / 2 * q0, q1 = q0 + h * ph, p1 = ph - h / 2 * q1;
        return {
          q: [`One leapfrog step of size $h = ${h}$ for $H = \\tfrac12(p^2 + q^2)$: half kick, drift, half kick. Start at $(q_0, p_0) = (${q0}, ${p0})$ and find $(q_1, p_1)$.`, `$H = \\tfrac12(p^2 + q^2)$ について、刻み $h = ${h}$ のリープフロッグ法（半分のキック、ドリフト、半分のキック）を一歩進めます。$(q_0, p_0) = (${q0}, ${p0})$ から $(q_1, p_1)$ を求めてください。`],
          a: { type: 'tuple', v: [q1, p1], labels: ['$q_1$', '$p_1$'], tol: 1e-4 },
          hint: ['The force is $-q$: $p_{1/2} = p_0 - \\tfrac h2 q_0$, $q_1 = q_0 + hp_{1/2}$, $p_1 = p_{1/2} - \\tfrac h2 q_1$.', '力は $-q$ です。$p_{1/2} = p_0 - \\tfrac h2 q_0$、$q_1 = q_0 + hp_{1/2}$、$p_1 = p_{1/2} - \\tfrac h2 q_1$ です。'],
          sol: [[`$p_{1/2} = ${p0} - ${n(h / 2)}\\times ${q0} = ${n(ph, 6)}$; $q_1 = ${q0} + ${h}\\times ${n(ph, 6)} = ${n(q1, 6)}$.`, `$p_{1/2} = ${p0} - ${n(h / 2)}\\times ${q0} = ${n(ph, 6)}$、$q_1 = ${q0} + ${h}\\times ${n(ph, 6)} = ${n(q1, 6)}$ です。`], [`$p_1 = ${n(ph, 6)} - ${n(h / 2)}\\times ${n(q1, 6)} = ${n(p1, 6)}$.`, `$p_1 = ${n(ph, 6)} - ${n(h / 2)}\\times ${n(q1, 6)} = ${n(p1, 6)}$ です。`], [`The energy went from $${n((q0 * q0 + p0 * p0) / 2, 5)}$ to $${n((q1 * q1 + p1 * p1) / 2, 6)}$: not exactly conserved, but each of the three sub-steps is a shear, so the map keeps area exactly.`, `エネルギーは $${n((q0 * q0 + p0 * p0) / 2, 5)}$ から $${n((q1 * q1 + p1 * p1) / 2, 6)}$ になりました。厳密には保存されませんが、三つの小さな段階はどれもせん断なので、写像は面積を厳密に保ちます。`]],
        };
      }
      const h = r.pick([0.05, 0.1, 0.2, 0.3, 0.5]), which = r.int(0, 1);
      const det = which === 0 ? 1 + h * h : 1;
      return {
        q: [which === 0 ? `For $H = \\tfrac12(p^2 + q^2)$ explicit Euler is the linear map $(q, p) \\mapsto (q + hp,\\ p - hq)$. With $h = ${h}$, by what factor does it multiply areas?` : `For $H = \\tfrac12(p^2 + q^2)$ symplectic Euler is $p_1 = p - hq$, then $q_1 = q + hp_1$. With $h = ${h}$, by what factor does it multiply areas?`, which === 0 ? `$H = \\tfrac12(p^2 + q^2)$ に対する陽的オイラー法は線形写像 $(q, p) \\mapsto (q + hp,\\ p - hq)$ です。$h = ${h}$ のとき、面積は何倍になりますか。` : `$H = \\tfrac12(p^2 + q^2)$ に対するシンプレクティック・オイラー法は、$p_1 = p - hq$ の後に $q_1 = q + hp_1$ とします。$h = ${h}$ のとき、面積は何倍になりますか。`],
        a: { type: 'num', v: det },
        hint: ['A linear map multiplies areas by the absolute value of its determinant.', '線形写像は面積を行列式の絶対値倍にします。'],
        sol: which === 0 ? [[`The matrix is $\\begin{pmatrix} 1 & ${h} \\\\ -${h} & 1 \\end{pmatrix}$, with determinant $1 + h^2 = ${n(det)}$.`, `行列は $\\begin{pmatrix} 1 & ${h} \\\\ -${h} & 1 \\end{pmatrix}$ で、行列式は $1 + h^2 = ${n(det)}$ です。`], ['Every step inflates phase space a little, which is the same thing as the energy growing: Euler is not symplectic.', '一歩ごとに相空間が少しずつ膨らみます。これはエネルギーが増えることと同じで、オイラー法はシンプレクティックではありません。']] : [[`Substituting, $q_1 = (1 - h^2)q + hp$, so the matrix is $\\begin{pmatrix} ${n(1 - h * h)} & ${h} \\\\ -${h} & 1 \\end{pmatrix}$.`, `代入すると $q_1 = (1 - h^2)q + hp$ なので、行列は $\\begin{pmatrix} ${n(1 - h * h)} & ${h} \\\\ -${h} & 1 \\end{pmatrix}$ です。`], [`Its determinant is $(1 - h^2) + h^2 = 1$ for every $h$: updating $p$ first and then using the new $p$ makes each half a shear, and shears keep area.`, `行列式はどんな $h$ でも $(1 - h^2) + h^2 = 1$ です。$p$ を先に更新して新しい $p$ を使うと各段がせん断になり、せん断は面積を保ちます。`]],
        set: h <= 0.3 ? { h } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.step(0.05, 0.5, 0.05), pm = Math.sqrt(1 - h * h / 4);
        return {
          q: [`Leapfrog with step $h = ${n(h)}$ on $\\ddot q = -q$ conserves $\\tilde H = \\tfrac12 p^2 + \\tfrac12(1 - h^2/4)q^2$ exactly. Starting from $q = 1$, $p = 0$, what is the largest $|p|$ it ever reaches?`, `刻み $h = ${n(h)}$ のリープフロッグ法は $\\ddot q = -q$ に対して $\\tilde H = \\tfrac12 p^2 + \\tfrac12(1 - h^2/4)q^2$ を厳密に保存します。$q = 1$、$p = 0$ から始めると、$|p|$ の最大値はいくつですか。`],
          a: { type: 'num', v: pm, tol: 1e-4 },
          hint: ['$\\tilde H$ is the same at the start and where $q = 0$.', '$\\tilde H$ は出発点と $q = 0$ の点で等しくなります。'],
          sol: [[`At the start $\\tilde H = \\tfrac12(1 - h^2/4) = ${n((1 - h * h / 4) / 2, 6)}$.`, `出発点では $\\tilde H = \\tfrac12(1 - h^2/4) = ${n((1 - h * h / 4) / 2, 6)}$ です。`], [`At $q = 0$, $\\tfrac12p^2 = \\tilde H$, so $|p|_{\\max} = \\sqrt{1 - h^2/4} = ${n(pm, 5)}$.`, `$q = 0$ では $\\tfrac12p^2 = \\tilde H$ なので $|p|_{\\max} = \\sqrt{1 - h^2/4} = ${n(pm, 5)}$ です。`], [`The true energy there is $${n(pm * pm / 2, 5)}$ instead of $0.5$, a relative error of $h^2/4 = ${n(h * h / 4, 5)}$, and it never gets worse: the error oscillates in a fixed band rather than drifting.`, `そこでの本当のエネルギーは $0.5$ ではなく $${n(pm * pm / 2, 5)}$ で、相対誤差は $h^2/4 = ${n(h * h / 4, 5)}$ です。しかもこれ以上悪くなりません。誤差はずれていかず、決まった幅の中で振動します。`]],
        };
      }
      if (form === 1) {
        const [en, ja, w] = r.pick([['a stiff spring with $\\omega = 50$ rad/s', '$\\omega = 50$ rad/s の硬いばね', 50], ['a molecular bond vibrating at $\\omega = 2\\times 10^{14}$ rad/s', '$\\omega = 2\\times 10^{14}$ rad/s で振動する分子の結合', 2e14], ['a pendulum with $\\omega = 3$ rad/s', '$\\omega = 3$ rad/s の振り子', 3], ['a guitar string mode with $\\omega = 2000$ rad/s', '$\\omega = 2000$ rad/s のギターの弦のモード', 2000]]);
        return {
          q: [`Leapfrog on $\\ddot q = -\\omega^2 q$ is stable only if the step is small enough. What is the largest stable step for ${en}?`, `$\\ddot q = -\\omega^2 q$ に対するリープフロッグ法は、刻みが十分小さいときだけ安定です。${ja}では、安定な最大の刻みはいくつですか。`],
          a: { type: 'num', v: 2 / w, unit: ['s', '秒'] },
          hint: ['One step is a linear map with determinant 1 and trace $2 - h^2\\omega^2$; its eigenvalues stay on the unit circle only while $|\\text{trace}| \\le 2$.', '一歩は行列式 1、跡 $2 - h^2\\omega^2$ の線形写像です。固有値が単位円上にとどまるのは $|\\text{跡}| \\le 2$ のときだけです。'],
          sol: [['$|2 - h^2\\omega^2| \\le 2$ requires $h\\omega \\le 2$.', '$|2 - h^2\\omega^2| \\le 2$ には $h\\omega \\le 2$ が必要です。'], [`$h_{\\max} = 2/\\omega = ${n(2 / w, 4)}$ s.`, `$h_{\\max} = 2/\\omega = ${n(2 / w, 4)}$ 秒です。`], ['Beyond it the eigenvalues leave the unit circle and the solution grows exponentially. The fastest vibration in a system sets the step for everything, which is why molecular dynamics needs femtosecond steps.', 'それを超えると固有値が単位円から外れ、解は指数関数的に増大します。系のなかで最も速い振動が全体の刻みを決めるので、分子動力学ではフェムト秒の刻みが必要になります。']],
        };
      }
      const h = r.pick([0.05, 0.1, 0.2, 0.3]), E0 = r.pick([0.5, 1, 2, 0.25]);
      return {
        q: [`Explicit Euler with step $h = ${h}$ is applied to $H = \\tfrac12(p^2 + q^2)$, starting with energy $E_0 = ${E0}$. Write the energy $E_n$ after $n$ steps.`, `刻み $h = ${h}$ の陽的オイラー法を、エネルギー $E_0 = ${E0}$ から $H = \\tfrac12(p^2 + q^2)$ に適用します。$n$ 歩後のエネルギー $E_n$ を式で表してください。`],
        a: { type: 'expr', v: `${E0}*(${1 + h * h})^n`, vars: ['n'], dom: { n: [1, 40] }, lhs: ['$E_n =$', '$E_n =$'] },
        hint: ['Each step multiplies the energy by the same factor, whatever the state.', '一歩ごとに、状態によらず同じ倍率でエネルギーが掛けられます。'],
        sol: [[`One step gives $q_1^2 + p_1^2 = (1 + h^2)(q_0^2 + p_0^2)$, a factor $${n(1 + h * h)}$.`, `一歩で $q_1^2 + p_1^2 = (1 + h^2)(q_0^2 + p_0^2)$ となり、倍率は $${n(1 + h * h)}$ です。`], [`$E_n = ${E0}\\cdot ${n(1 + h * h)}^n$: exponential growth, which doubles the energy after $\\ln 2/\\ln(1 + h^2) \\approx ${n(Math.log(2) / Math.log(1 + h * h), 0)}$ steps.`, `$E_n = ${E0}\\cdot ${n(1 + h * h)}^n$ で指数関数的に増え、$\\ln 2/\\ln(1 + h^2) \\approx ${n(Math.log(2) / Math.log(1 + h * h), 0)}$ 歩でエネルギーは二倍になります。`]],
        set: { h },
      };
    },
  ];

  /* ---------- 3. Noether: V = r^4/4 (1 + eps cos n phi), start (1, 0), p = (0.3, 0.75) ---------- */
  function turning(E, L) { // roots in u = r^2 of u^3/4 - E u + L^2/2 = 0, i.e. L^2/2r^2 + r^4/4 = E
    const f = (u) => u * u * u / 4 - E * u + L * L / 2, umin = Math.sqrt(4 * E / 3);
    const bis = (a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
    return [Math.sqrt(bis(1e-9, umin)), Math.sqrt(bis(umin, 10 * umin + 10))];
  }
  Q.noether = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.step(-2, 2, 0.5), y = r.step(-2, 2, 0.5), px = r.step(-1, 1, 0.25), py = r.step(-1, 1, 0.25), Lz = x * py - y * px;
        return {
          q: [`A particle in the plane is at $(x, y) = (${n(x)}, ${n(y)})$ with momentum $(p_x, p_y) = (${n(px)}, ${n(py)})$. What is its angular momentum $L = xp_y - yp_x$?`, `平面上の粒子が $(x, y) = (${n(x)}, ${n(y)})$ にあり、運動量は $(p_x, p_y) = (${n(px)}, ${n(py)})$ です。角運動量 $L = xp_y - yp_x$ はいくつですか。`],
          a: { type: 'num', v: Lz },
          sol: [[`$L = (${n(x)})(${n(py)}) - (${n(y)})(${n(px)}) = ${n(Lz)}$.`, `$L = (${n(x)})(${n(py)}) - (${n(y)})(${n(px)}) = ${n(Lz)}$ です。`], [Lz > 0 ? 'Positive: the particle circulates anticlockwise about the origin.' : Lz < 0 ? 'Negative: it circulates clockwise about the origin.' : 'Zero: it is heading straight toward or away from the origin.', Lz > 0 ? '正なので、粒子は原点のまわりを反時計回りに回っています。' : Lz < 0 ? '負なので、原点のまわりを時計回りに回っています。' : '0 なので、原点にまっすぐ向かうか、まっすぐ離れています。']],
        };
      }
      if (form === 1) {
        const k = r.int(0, 2), sym = [['translation in time (the laws do not change from moment to moment)', '時間の平行移動（法則が時刻によらない）'], ['rotation about an axis', '軸のまわりの回転'], ['translation in space along a direction', 'ある方向への空間の平行移動']][k];
        return {
          q: [`By Noether's theorem, which quantity is conserved when the Lagrangian is unchanged by ${sym[0]}?`, `ネーターの定理によると、ラグランジアンが${sym[1]}で変わらないとき、どの量が保存されますか。`],
          a: { type: 'choice', opts: [['Energy', 'エネルギー'], ['Angular momentum about that axis', 'その軸まわりの角運動量'], ['Linear momentum along that direction', 'その方向の運動量']], v: k, fixed: true },
          hint: ['The conserved quantity is the momentum conjugate to the coordinate that the symmetry shifts.', '保存されるのは、対称性がずらす座標に共役な運動量です。'],
          sol: [[['Shifting $t$ leaves the Lagrangian unchanged when it has no explicit time dependence; the conserved quantity is $H$, the energy.', 'Rotating shifts the angle $\\phi$; if $\\partial L/\\partial\\phi = 0$ then $p_\\phi$, the angular momentum, is constant.', 'Translating shifts a Cartesian coordinate $x$; if $\\partial L/\\partial x = 0$ then $p_x$ is constant.'][k], ['ラグランジアンが時間をあらわに含まなければ $t$ をずらしても変わらず、保存量は $H$ すなわちエネルギーです。', '回転は角度 $\\phi$ をずらします。$\\partial L/\\partial\\phi = 0$ なら $p_\\phi$、すなわち角運動量が一定です。', '平行移動は直交座標 $x$ をずらします。$\\partial L/\\partial x = 0$ なら $p_x$ が一定です。'][k]], ['In this lab the ripple breaks rotation but not time translation, so energy survives and angular momentum does not.', 'この実験では、うねりが回転対称性を壊しますが時間の平行移動は壊さないので、エネルギーは保存され、角運動量は保存されません。']],
        };
      }
      const nn = r.int(1, 6), eps = r.step(0.05, 0.5, 0.05);
      return {
        q: [`The potential $V = \\tfrac14 r^4(1 + ${n(eps)}\\cos ${nn === 1 ? '' : nn}\\phi)$ is unchanged by some rotations. What is the smallest positive angle, in degrees?`, `ポテンシャル $V = \\tfrac14 r^4(1 + ${n(eps)}\\cos ${nn === 1 ? '' : nn}\\phi)$ を変えない回転があります。そのうち最小の正の角は何度ですか。`],
        a: { type: 'num', v: 360 / nn, unit: ['°', '°'] },
        hint: ['$\\cos n\\phi$ repeats when $n\\phi$ advances by $2\\pi$.', '$\\cos n\\phi$ は $n\\phi$ が $2\\pi$ 進むと元に戻ります。'],
        sol: [[`$\\cos ${nn}(\\phi + \\alpha) = \\cos ${nn}\\phi$ for all $\\phi$ needs $${nn}\\alpha = 2\\pi$, so $\\alpha = ${n(360 / nn)}^\\circ$.`, `すべての $\\phi$ で $\\cos ${nn}(\\phi + \\alpha) = \\cos ${nn}\\phi$ となるには $${nn}\\alpha = 2\\pi$ が必要で、$\\alpha = ${n(360 / nn)}^\\circ$ です。`], ['A discrete symmetry like this gives no conservation law: Noether needs a continuous family of symmetries, so $L$ wanders.', 'このような離散的な対称性からは保存則は生まれません。ネーターの定理には連続な対称性の族が必要なので、$L$ はさまよいます。']],
        set: { n: nn, eps },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const eps = r.step(0, 0.5, 0.01), E = (0.09 + 0.5625) / 2 + 0.25 * (1 + eps);
        return {
          q: [`The lab's particle starts at $(x, y) = (1, 0)$ with $(p_x, p_y) = (0.3, 0.75)$ in $V = \\tfrac14 r^4(1 + \\varepsilon\\cos n\\phi)$, with $\\varepsilon = ${n(eps)}$. What is its energy? Give four decimals.`, `この実験の粒子は $V = \\tfrac14 r^4(1 + \\varepsilon\\cos n\\phi)$（$\\varepsilon = ${n(eps)}$）の中で、$(x, y) = (1, 0)$ から $(p_x, p_y) = (0.3, 0.75)$ で出発します。エネルギーはいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: E, tol: 6e-5 },
          hint: ['At $(1, 0)$, $r = 1$ and $\\phi = 0$, so $\\cos n\\phi = 1$ for every $n$.', '$(1, 0)$ では $r = 1$、$\\phi = 0$ なので、どの $n$ でも $\\cos n\\phi = 1$ です。'],
          sol: [['Kinetic: $\\tfrac12(0.3^2 + 0.75^2) = 0.32625$.', '運動エネルギーは $\\tfrac12(0.3^2 + 0.75^2) = 0.32625$ です。'], [`Potential: $\\tfrac14(1 + ${n(eps)}) = ${n(0.25 * (1 + eps), 5)}$, so $E = ${n(E, 5)}$.`, `位置エネルギーは $\\tfrac14(1 + ${n(eps)}) = ${n(0.25 * (1 + eps), 5)}$ なので、$E = ${n(E, 5)}$ です。`], ['The readout\'s E range stays pinned at this value for the whole run, whatever the ripple does to $L$.', 'うねりが $L$ をどう変えても、読み取り欄の E の範囲は全体を通してこの値に張りついたままです。']],
          set: { eps },
        };
      }
      if (form === 1) {
        const eps = r.step(0.05, 0.5, 0.05), nn = r.int(1, 6), R = r.pick([0.8, 1, 1.2, 0.9, 1.1]), ph = r.pick([10, 15, 20, 30, 45, 60, 100, 135]);
        const tau = 0.25 * eps * nn * R ** 4 * Math.sin(nn * ph * PI / 180);
        return {
          q: [`In $V = \\tfrac14 r^4(1 + \\varepsilon\\cos n\\phi)$ with $\\varepsilon = ${n(eps)}$ and $n = ${nn}$, what torque $dL/dt$ acts on a particle at $r = ${R}$, $\\phi = ${ph}^\\circ$? Give four decimals.`, `$V = \\tfrac14 r^4(1 + \\varepsilon\\cos n\\phi)$（$\\varepsilon = ${n(eps)}$、$n = ${nn}$）で、$r = ${R}$、$\\phi = ${ph}^\\circ$ にある粒子にはたらくトルク $dL/dt$ はいくつですか（小数第4位まで）。`],
          a: { type: 'num', v: tau, tol: 6e-5 },
          hint: ['$dL/dt = -\\partial V/\\partial\\phi$.', '$dL/dt = -\\partial V/\\partial\\phi$ です。'],
          sol: [[`$-\\partial V/\\partial\\phi = \\tfrac14\\varepsilon n\\,r^4\\sin n\\phi$.`, `$-\\partial V/\\partial\\phi = \\tfrac14\\varepsilon n\\,r^4\\sin n\\phi$ です。`], [`$= \\tfrac14\\times ${n(eps)}\\times ${nn}\\times ${n(R ** 4, 4)}\\times\\sin ${nn * ph}^\\circ = ${n(tau, 5)}$.`, `$= \\tfrac14\\times ${n(eps)}\\times ${nn}\\times ${n(R ** 4, 4)}\\times\\sin ${nn * ph}^\\circ = ${n(tau, 5)}$ です。`], ['Only the angular part of the potential can twist the particle: a round potential pulls straight toward the centre and exerts no torque.', '粒子をねじることができるのはポテンシャルの角度依存の部分だけです。丸いポテンシャルはまっすぐ中心へ引くので、トルクを及ぼしません。']],
          set: { eps, n: nn },
        };
      }
      const R = r.pick([0.5, 0.8, 1, 1.2, 1.5]), ask = r.int(0, 1);
      return {
        q: [ask ? `In the round potential $V = \\tfrac14 r^4$ ($\\varepsilon = 0$, unit mass), what is the period of a circular orbit of radius $${R}$?` : `In the round potential $V = \\tfrac14 r^4$ ($\\varepsilon = 0$, unit mass), what angular momentum does a circular orbit of radius $${R}$ have?`, ask ? `丸いポテンシャル $V = \\tfrac14 r^4$（$\\varepsilon = 0$、質量 1）で、半径 $${R}$ の円軌道の周期はいくつですか。` : `丸いポテンシャル $V = \\tfrac14 r^4$（$\\varepsilon = 0$、質量 1）で、半径 $${R}$ の円軌道の角運動量はいくつですか。`],
        a: { type: 'num', v: ask ? TAU / R : R ** 3 },
        hint: ['The inward force $V\'(r) = r^3$ supplies the centripetal force $v^2/r$.', '内向きの力 $V\'(r) = r^3$ が向心力 $v^2/r$ になります。'],
        sol: [[`$v^2/r = r^3$ gives $v = r^2 = ${n(R * R)}$.`, `$v^2/r = r^3$ より $v = r^2 = ${n(R * R)}$ です。`], [ask ? `$T = 2\\pi r/v = 2\\pi/r = ${n(TAU / R, 4)}$.` : `$L = rv = r^3 = ${n(R ** 3, 4)}$.`, ask ? `$T = 2\\pi r/v = 2\\pi/r = ${n(TAU / R, 4)}$ です。` : `$L = rv = r^3 = ${n(R ** 3, 4)}$ です。`], ['Unlike gravity, bigger orbits here are faster and shorter: the force grows with distance.', '重力と違い、ここでは大きな軌道ほど速く、周期が短くなります。力が距離とともに強くなるからです。']],
        set: { eps: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2);
        const sc = [['$V = \\tfrac14 r^4(1 + 0.2\\cos 3\\phi)$, fixed in time', '$V = \\tfrac14 r^4(1 + 0.2\\cos 3\\phi)$（時間によらない）'], ['$V = \\tfrac14 s(t)\\,r^4$, a round potential whose strength $s$ is slowly turned up', '$V = \\tfrac14 s(t)\\,r^4$（強さ $s$ をゆっくり上げていく丸いポテンシャル）'], ['$V = \\tfrac14 r^4\\bigl(1 + 0.2\\cos 3(\\phi - \\Omega t)\\bigr)$, a ripple pattern turning steadily at rate $\\Omega$', '$V = \\tfrac14 r^4\\bigl(1 + 0.2\\cos 3(\\phi - \\Omega t)\\bigr)$（一定の角速度 $\\Omega$ で回るうねり）']][k];
        return {
          q: [`A particle moves in ${sc[0]}. Which quantities are conserved?`, `粒子が ${sc[1]} の中を動きます。保存される量はどれですか。`],
          a: { type: 'choice', opts: [['Energy only', 'エネルギーだけ'], ['Angular momentum only', '角運動量だけ'], ['Neither $E$ nor $L$, but the combination $E - \\Omega L$', '$E$ も $L$ も保存されないが、組み合わせ $E - \\Omega L$ は保存される'], ['Both energy and angular momentum', 'エネルギーと角運動量の両方']], v: k, fixed: true },
          hint: ['Ask which shifts leave the Lagrangian unchanged: $t \\to t + c$, $\\phi \\to \\phi + c$, or a combination of both.', 'ラグランジアンを変えないずらしを考えてください。$t \\to t + c$、$\\phi \\to \\phi + c$、あるいは両方の組み合わせです。'],
          sol: [[['The potential depends on $\\phi$ but not on $t$: time translation survives, rotation does not.', 'The potential depends on $t$ but not on $\\phi$: rotation survives, time translation does not.', 'Neither $t \\to t + c$ nor $\\phi \\to \\phi + c$ alone leaves $V$ unchanged, but shifting both together, $\\phi \\to \\phi + \\Omega c$, $t \\to t + c$, does.'][k], ['ポテンシャルは $\\phi$ に依存しますが $t$ には依存しません。時間の平行移動の対称性は残り、回転の対称性は失われます。', 'ポテンシャルは $t$ に依存しますが $\\phi$ には依存しません。回転の対称性は残り、時間の平行移動の対称性は失われます。', '$t \\to t + c$ だけでも $\\phi \\to \\phi + c$ だけでも $V$ は変わりますが、両方を同時に $\\phi \\to \\phi + \\Omega c$、$t \\to t + c$ とずらすと変わりません。'][k]], [['So $E$ is conserved and $L$ is not: this is the lab with $\\varepsilon > 0$.', 'So $L$ is conserved, but the particle gains energy as the walls tighten.', 'That combined symmetry conserves the Jacobi integral $E - \\Omega L$, the energy measured in the rotating frame, used for stars in a rotating galactic bar.'][k], ['よって $E$ は保存され $L$ は保存されません。$\\varepsilon > 0$ のこの実験がこれです。', 'よって $L$ は保存されますが、壁が狭まるにつれて粒子はエネルギーを得ます。', 'その組み合わせの対称性からヤコビ積分 $E - \\Omega L$ が保存されます。回転座標系で測ったエネルギーで、回転する銀河の棒の中の星を扱うときに使われます。'][k]]],
          set: k === 0 ? { eps: 0.2, n: 3 } : undefined,
        };
      }
      if (form === 1) {
        const eps = r.step(0.05, 0.5, 0.05), nn = r.int(1, 6), R = r.pick([0.8, 1, 1.2]), c = 0.25 * eps * nn * R ** 4;
        return {
          q: [`In $V = \\tfrac14 r^4(1 + ${n(eps)}\\cos ${nn === 1 ? '' : nn}\\phi)$, write the torque $\\tau = dL/dt$ felt on the circle $r = ${R}$ as a function of the angle $\\phi$.`, `$V = \\tfrac14 r^4(1 + ${n(eps)}\\cos ${nn === 1 ? '' : nn}\\phi)$ で、円 $r = ${R}$ 上で受けるトルク $\\tau = dL/dt$ を角度 $\\phi$ の関数で表してください。`],
          a: { type: 'expr', v: `${c}*sin(${nn}*phi)`, vars: ['phi'], dom: { phi: [0, 3] }, lhs: ['$\\tau(\\phi) =$', '$\\tau(\\phi) =$'] },
          hint: ['Differentiate $V$ with respect to $\\phi$ at fixed $r$, and change the sign.', '$r$ を固定して $V$ を $\\phi$ で微分し、符号を変えてください。'],
          sol: [[`$\\partial V/\\partial\\phi = -\\tfrac14 r^4\\cdot ${n(eps)}\\cdot ${nn}\\sin ${nn === 1 ? '' : nn}\\phi$.`, `$\\partial V/\\partial\\phi = -\\tfrac14 r^4\\cdot ${n(eps)}\\cdot ${nn}\\sin ${nn === 1 ? '' : nn}\\phi$ です。`], [`$\\tau = ${n(c, 5)}\\sin ${nn === 1 ? '' : nn}\\phi$ at $r = ${R}$.`, `$r = ${R}$ では $\\tau = ${n(c, 5)}\\sin ${nn === 1 ? '' : nn}\\phi$ です。`], [`It averages to zero round the circle, so $L$ swings back and forth instead of drifting away: it is pushed one way approaching each of the ${nn} hills and back again leaving it.`, `円を一周すると平均は 0 なので、$L$ はずれていかずに行き来します。${nn} 個の山のそれぞれに近づくときに一方へ押され、離れるときに押し戻されるのです。`]],
          set: { eps, n: nn },
        };
      }
      const lab = r.chance(0.35);
      const pr = lab ? 0.3 : r.pick([0, 0.2, 0.4, -0.3, 0.5]), pt = lab ? 0.75 : r.pick([0.5, 0.6, 0.9, 1, 1.2].filter((x) => !(pr === 0 && Math.abs(x - 1) < 1e-9)));
      const E = (pr * pr + pt * pt) / 2 + 0.25, Lz = pt, [r1, r2] = turning(E, Lz);
      return {
        q: [`In the round potential $V = \\tfrac14 r^4$ ($\\varepsilon = 0$), a particle starts at $r = 1$ with radial momentum $${n(pr)}$ and tangential momentum $${n(pt)}$. Its orbit is a rosette between two circles. Find their radii $r_{\\min} < r_{\\max}$.`, `丸いポテンシャル $V = \\tfrac14 r^4$（$\\varepsilon = 0$）で、粒子が $r = 1$ から動径方向の運動量 $${n(pr)}$、接線方向の運動量 $${n(pt)}$ で出発します。軌道は二つの円の間のロゼットになります。その半径 $r_{\\min} < r_{\\max}$ を求めてください。`],
        a: { type: 'tuple', v: [r1, r2], labels: ['$r_{\\min}$', '$r_{\\max}$'], tol: 0.002 },
        hint: ['With $L$ conserved the radial motion has energy $E = \\tfrac12\\dot r^2 + L^2/2r^2 + r^4/4$; the circles are where $\\dot r = 0$.', '$L$ が保存されるので、動径方向の運動はエネルギー $E = \\tfrac12\\dot r^2 + L^2/2r^2 + r^4/4$ をもちます。二つの円は $\\dot r = 0$ となるところです。'],
        sol: [[`$L = ${n(Lz)}$ and $E = \\tfrac12(${n(pr * pr, 4)} + ${n(pt * pt, 4)}) + \\tfrac14 = ${n(E, 5)}$.`, `$L = ${n(Lz)}$、$E = \\tfrac12(${n(pr * pr, 4)} + ${n(pt * pt, 4)}) + \\tfrac14 = ${n(E, 5)}$ です。`], [`With $u = r^2$, $\\dot r = 0$ means $u^3/4 - Eu + L^2/2 = 0$; its positive roots are $u = ${n(r1 * r1, 4)}$ and $${n(r2 * r2, 4)}$.`, `$u = r^2$ とおくと $\\dot r = 0$ は $u^3/4 - Eu + L^2/2 = 0$ で、正の根は $u = ${n(r1 * r1, 4)}$ と $${n(r2 * r2, 4)}$ です。`], [`So $r_{\\min} = ${n(r1, 4)}$, $r_{\\max} = ${n(r2, 4)}$. Conservation of $L$ is what keeps the particle off the centre${lab ? '; these are the circles that bound the lab\'s rosette at $\\varepsilon = 0$' : ''}.`, `よって $r_{\\min} = ${n(r1, 4)}$、$r_{\\max} = ${n(r2, 4)}$ です。粒子が中心に落ちないのは $L$ の保存のおかげです${lab ? '。これが $\\varepsilon = 0$ の実験のロゼットを挟む二つの円です' : ''}。`]],
        set: lab ? { eps: 0 } : undefined,
      };
    },
  ];
})();
