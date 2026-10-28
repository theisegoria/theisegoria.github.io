'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const G = 5 / 3; // monatomic ideal gas, as in the figure
  const J = (barL) => 100 * barL; // 1 bar·L = 100 J

  // ---------- 1. PV diagrams and the Carnot cycle (V1 = 1 L, one mole, γ = 5/3) ----------
  Q.pv = [
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const p1 = r.step(1, 5, 0.5), v2 = r.step(1.5, 5, 0.5), W = J(p1 * (v2 - 1));
        return {
          q: [`The gas expands at a constant $P = ${n(p1)}$ bar from $V_1 = 1$ L to $V_2 = ${n(v2)}$ L. How much work does it do, in joules? ($1$ bar·L $= 100$ J.)`, `気体が一定の圧力 $P = ${n(p1)}$ bar のまま $V_1 = 1$ L から $V_2 = ${n(v2)}$ L へ膨張します。気体のする仕事は何 J ですか（$1$ bar·L $= 100$ J）。`],
          a: { type: 'num', v: W, unit: ['J', 'J'] },
          hint: ['At constant pressure the area under the path is a rectangle.', '圧力が一定なら、経路の下の面積は長方形です。'],
          sol: [[`$W = P\\,\\Delta V = ${n(p1)}\\ \\text{bar} \\times ${n(v2 - 1)}\\ \\text{L} = ${n(p1 * (v2 - 1))}$ bar·L.`, `$W = P\\,\\Delta V = ${n(p1)}\\ \\text{bar} \\times ${n(v2 - 1)}\\ \\text{L} = ${n(p1 * (v2 - 1))}$ bar·L です。`], [`That is $${n(W)}$ J: the shaded rectangle under the horizontal line in the figure.`, `これは $${n(W)}$ J で、図の水平線の下の長方形の面積です。`]],
          set: { process: 0, pressure: p1, volume: v2 },
        };
      }
      if (k === 1) {
        const rr = r.step(0.5, 0.9, 0.05), Th = r.pick([400, 500, 600, 800, 1000]), Tc = Math.round(rr * Th);
        return {
          q: [`A Carnot engine works between a hot reservoir at $${Th}$ K and a cold one at $${Tc}$ K. What is its efficiency $\\eta$, as a decimal?`, `カルノー機関が $${Th}$ K の高温熱源と $${Tc}$ K の低温熱源の間で働きます。効率 $\\eta$ を小数で答えてください。`],
          a: { type: 'num', v: 1 - Tc / Th, tol: 0.002 },
          hint: ['The Carnot efficiency depends only on the ratio of the two absolute temperatures.', 'カルノー効率は2つの絶対温度の比だけで決まります。'],
          sol: [[`$\\eta = 1 - T_c/T_h = 1 - ${Tc}/${Th} = ${n(1 - Tc / Th, 4)}$.`, `$\\eta = 1 - T_c/T_h = 1 - ${Tc}/${Th} = ${n(1 - Tc / Th, 4)}$ です。`], [`So ${n(100 * (1 - Tc / Th), 3)} % of the heat taken from the hot reservoir becomes work, and the rest must be dumped into the cold one. No engine between these temperatures can do better.`, `高温熱源から受け取った熱のうち ${n(100 * (1 - Tc / Th), 3)} % が仕事になり、残りは低温熱源に捨てなければなりません。この2つの温度の間で働くどの熱機関もこれを超えられません。`]],
          set: { process: 3, tc: rr },
        };
      }
      return {
        q: ['A gas is taken from state A to state B along two different paths. Which quantity must be the same for both paths?', '気体を状態 A から状態 B へ2つの異なる経路で移します。両方の経路で必ず等しくなる量はどれですか。'],
        a: { type: 'choice', opts: [['The change in internal energy $\\Delta U$', '内部エネルギーの変化 $\\Delta U$'], ['The work $W$ done by the gas', '気体のする仕事 $W$'], ['The heat $Q$ absorbed', '吸収する熱 $Q$'], ['The area under the path on the PV diagram', 'PV 図で経路の下の面積']], v: 0 },
        hint: ['Which of these is a function of the state alone?', 'このうち状態だけで決まる量はどれでしょう。'],
        sol: [['$U$ is a state function: for an ideal gas it depends only on $T$, which is fixed by the end states.', '$U$ は状態関数で、理想気体では $T$ だけで決まり、$T$ は始状態と終状態で決まります。'], ['$W$ is the area under the path, which differs between paths, and $Q = \\Delta U + W$ differs with it.', '$W$ は経路の下の面積なので経路ごとに違い、$Q = \\Delta U + W$ もそれに応じて違います。']],
        set: { process: r.int(0, 2) },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const p1 = r.step(1, 5, 0.5), v2 = r.pick([0.5, 1.5, 2, 2.5, 3, 4, 5]), W = J(p1 * Math.log(v2));
        return {
          q: [`One mole of ideal gas at $P_1 = ${n(p1)}$ bar, $V_1 = 1$ L is taken isothermally to $V_2 = ${n(v2)}$ L. Find the work done by the gas in joules.`, `$P_1 = ${n(p1)}$ bar、$V_1 = 1$ L の理想気体 1 mol を等温で $V_2 = ${n(v2)}$ L にします。気体のする仕事を J で求めてください。`],
          a: { type: 'num', v: W, unit: ['J', 'J'] },
          hint: ['On an isotherm $P = P_1V_1/V$; integrate $P\\,dV$.', '等温線上では $P = P_1V_1/V$ です。$P\\,dV$ を積分してください。'],
          sol: [[`$W = \\int P\\,dV = P_1V_1\\ln(V_2/V_1) = ${n(p1)}\\ln ${n(v2)}$ bar·L.`, `$W = \\int P\\,dV = P_1V_1\\ln(V_2/V_1) = ${n(p1)}\\ln ${n(v2)}$ bar·L です。`], [`$= ${n(p1 * Math.log(v2), 4)}$ bar·L $= ${n(W, 4)}$ J.`, `$= ${n(p1 * Math.log(v2), 4)}$ bar·L $= ${n(W, 4)}$ J です。`], [v2 > 1 ? 'Since $T$ is constant, $\\Delta U = 0$ and exactly this much heat flows in from the reservoir.' : 'The work is negative: the surroundings compress the gas, and since $\\Delta U = 0$ the same energy leaves as heat.', v2 > 1 ? '$T$ が一定なので $\\Delta U = 0$ で、ちょうどこの量の熱が熱源から流れ込みます。' : '仕事は負で、外部が気体を圧縮しています。$\\Delta U = 0$ なので同じエネルギーが熱として出ていきます。']],
          set: { process: 1, pressure: p1, volume: v2 },
        };
      }
      if (k === 1) {
        const p1 = r.step(1, 5, 0.5), v2 = r.pick([2, 3, 4, 5, 0.5]), P2 = p1 * v2 ** -G, W = J((p1 - P2 * v2) / (G - 1));
        const askT = r.chance(0.4);
        return {
          q: askT ? [`One mole of monatomic gas expands adiabatically and reversibly from $V_1 = 1$ L to $V_2 = ${n(v2)}$ L. What is $T_2/T_1$?`, `単原子気体 1 mol が $V_1 = 1$ L から $V_2 = ${n(v2)}$ L へ可逆断熱変化します。$T_2/T_1$ はいくつですか。`]
            : [`Monatomic gas at $P_1 = ${n(p1)}$ bar, $V_1 = 1$ L changes adiabatically and reversibly to $V_2 = ${n(v2)}$ L. Find the work done by the gas in joules ($\\gamma = 5/3$).`, `$P_1 = ${n(p1)}$ bar、$V_1 = 1$ L の単原子気体が可逆断熱変化で $V_2 = ${n(v2)}$ L になります。気体のする仕事を J で求めてください（$\\gamma = 5/3$）。`],
          a: askT ? { type: 'num', v: v2 ** (1 - G) } : { type: 'num', v: W, unit: ['J', 'J'] },
          hint: askT ? ['Along a reversible adiabat $TV^{\\gamma - 1}$ is constant.', '可逆断熱変化では $TV^{\\gamma - 1}$ が一定です。'] : ['First find $P_2$ from $PV^{\\gamma}$ = constant, then use $W = (P_1V_1 - P_2V_2)/(\\gamma - 1)$.', 'まず $PV^{\\gamma}$ = 一定 から $P_2$ を求め、$W = (P_1V_1 - P_2V_2)/(\\gamma - 1)$ を使います。'],
          sol: askT ? [[`$T_2/T_1 = (V_1/V_2)^{\\gamma - 1} = ${n(v2)}^{-2/3} = ${n(v2 ** (1 - G), 4)}$.`, `$T_2/T_1 = (V_1/V_2)^{\\gamma - 1} = ${n(v2)}^{-2/3} = ${n(v2 ** (1 - G), 4)}$ です。`], [v2 > 1 ? 'With no heat coming in, the work of expansion is paid for out of the internal energy, so the gas cools.' : 'Compression with no heat flow out stores the work as internal energy, so the gas heats up.', v2 > 1 ? '熱が入らないので膨張の仕事は内部エネルギーでまかなわれ、気体は冷えます。' : '熱が逃げない圧縮では仕事が内部エネルギーとして蓄えられ、気体は温まります。']]
            : [[`$P_2 = P_1(V_1/V_2)^{5/3} = ${n(p1)}\\times ${n(v2)}^{-5/3} = ${n(P2, 4)}$ bar.`, `$P_2 = P_1(V_1/V_2)^{5/3} = ${n(p1)}\\times ${n(v2)}^{-5/3} = ${n(P2, 4)}$ bar です。`], [`$W = \\tfrac32(P_1V_1 - P_2V_2) = \\tfrac32(${n(p1)} - ${n(P2 * v2, 4)})$ bar·L $= ${n(W, 4)}$ J.`, `$W = \\tfrac32(P_1V_1 - P_2V_2) = \\tfrac32(${n(p1)} - ${n(P2 * v2, 4)})$ bar·L $= ${n(W, 4)}$ J です。`], ['This equals $-\\Delta U$: with $Q = 0$, all the work comes out of the internal energy.', 'これは $-\\Delta U$ に等しく、$Q = 0$ なので仕事はすべて内部エネルギーから出ています。']],
          set: { process: 2, pressure: p1, volume: v2 },
        };
      }
      if (k === 2) {
        const v2 = r.step(2, 5, 0.5);
        return {
          q: [`The gas starts at the same state and expands from $1$ L to $${n(v2)}$ L by three reversible processes. Rank the work done, largest first.`, `同じ状態から出発して、3つの可逆過程で $1$ L から $${n(v2)}$ L まで膨張させます。仕事の大きい順に並べてください。`],
          a: { type: 'choice', opts: [['isobaric > isothermal > adiabatic', '定圧 > 等温 > 断熱'], ['adiabatic > isothermal > isobaric', '断熱 > 等温 > 定圧'], ['isothermal > isobaric > adiabatic', '等温 > 定圧 > 断熱'], ['All equal, since the volumes are the same', '体積が同じなのですべて等しい']], v: 0 },
          hint: ['Compare how fast the pressure falls along each path: the work is the area underneath.', '各経路で圧力がどれだけ速く下がるかを比べてください。仕事はその下の面積です。'],
          sol: [['At constant pressure $P$ does not fall at all; on the isotherm it falls like $1/V$; on the adiabat like $V^{-5/3}$, faster still.', '定圧では $P$ はまったく下がらず、等温線では $1/V$ で、断熱線では $V^{-5/3}$ でさらに速く下がります。'], [`From the same start the three curves are ordered top to bottom in that sequence, so the areas under them are too. Switch the process in the figure with $V_2 = ${n(v2)}$ L to see the three areas.`, `同じ始点から出発すると3本の曲線はこの順に上から並ぶので、下の面積も同じ順になります。図で $V_2 = ${n(v2)}$ L のまま過程を切り替えると3つの面積を比べられます。`]],
          set: { process: 0, volume: v2 },
        };
      }
      const p1 = r.step(1, 5, 0.5), v2 = r.step(1.5, 5, 0.5), Wb = p1 * (v2 - 1), Qh = J(2.5 * Wb);
      return {
        q: [`One mole of monatomic gas expands at constant $P = ${n(p1)}$ bar from $1$ L to $${n(v2)}$ L. How much heat must be supplied, in joules?`, `単原子気体 1 mol が一定の圧力 $P = ${n(p1)}$ bar で $1$ L から $${n(v2)}$ L へ膨張します。加える必要のある熱は何 J ですか。`],
        a: { type: 'num', v: Qh, unit: ['J', 'J'] },
        hint: ['Use the first law: $Q = \\Delta U + W$, with $U = \\tfrac32 PV$ for a monatomic ideal gas.', '第一法則 $Q = \\Delta U + W$ を使います。単原子理想気体では $U = \\tfrac32 PV$ です。'],
        sol: [[`$W = P\\Delta V = ${n(Wb)}$ bar·L $= ${n(J(Wb))}$ J.`, `$W = P\\Delta V = ${n(Wb)}$ bar·L $= ${n(J(Wb))}$ J です。`], [`$\\Delta U = \\tfrac32 P\\Delta V = ${n(J(1.5 * Wb))}$ J, so $Q = ${n(J(1.5 * Wb))} + ${n(J(Wb))} = ${n(Qh)}$ J.`, `$\\Delta U = \\tfrac32 P\\Delta V = ${n(J(1.5 * Wb))}$ J なので $Q = ${n(J(1.5 * Wb))} + ${n(J(Wb))} = ${n(Qh)}$ J です。`], ['Only 40 % of the heat becomes work; the rest raises the temperature, which is why $C_P = \\tfrac52R$ exceeds $C_V = \\tfrac32R$.', '熱のうち仕事になるのは 40 % だけで、残りは温度を上げます。これが $C_P = \\tfrac52R$ が $C_V = \\tfrac32R$ より大きい理由です。']],
        set: { process: 0, pressure: p1, volume: v2 },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const p1 = r.step(1, 5, 0.5), v2 = r.step(1.5, 5, 0.5), rr = r.step(0.5, 0.9, 0.05), Qh = J(p1 * Math.log(v2)), W = Qh * (1 - rr);
        return {
          q: [`A Carnot cycle uses one mole of monatomic gas. The hot isotherm runs from $P_1 = ${n(p1)}$ bar, $V_1 = 1$ L to $V_2 = ${n(v2)}$ L, and $T_c/T_h = ${n(rr)}$. Find the net work per cycle in joules.`, `単原子気体 1 mol のカルノーサイクルです。高温の等温過程は $P_1 = ${n(p1)}$ bar、$V_1 = 1$ L から $V_2 = ${n(v2)}$ L まで、$T_c/T_h = ${n(rr)}$ です。1サイクルの正味の仕事を J で求めてください。`],
          a: { type: 'num', v: W, unit: ['J', 'J'] },
          hint: ['Find the heat taken in on the hot isotherm, then multiply by the Carnot efficiency.', '高温の等温過程で吸収する熱を求め、カルノー効率を掛けてください。'],
          sol: [[`On the hot isotherm $Q_h = W_{12} = P_1V_1\\ln(V_2/V_1) = ${n(p1)}\\ln ${n(v2)}$ bar·L $= ${n(Qh, 4)}$ J.`, `高温の等温過程では $Q_h = W_{12} = P_1V_1\\ln(V_2/V_1) = ${n(p1)}\\ln ${n(v2)}$ bar·L $= ${n(Qh, 4)}$ J です。`], [`The two adiabats do equal and opposite work, and the cold isotherm returns $T_c/T_h$ of $Q_h$, so $W = Q_h(1 - T_c/T_h) = ${n(Qh, 4)}\\times ${n(1 - rr)} = ${n(W, 4)}$ J.`, `2本の断熱過程の仕事は打ち消し合い、低温の等温過程は $Q_h$ の $T_c/T_h$ 倍を返すので、$W = Q_h(1 - T_c/T_h) = ${n(Qh, 4)}\\times ${n(1 - rr)} = ${n(W, 4)}$ J です。`], ['This is the area enclosed by the loop in the figure, and it matches the readout.', 'これは図のループが囲む面積で、読み取り欄の値と一致します。']],
          set: { process: 3, pressure: p1, volume: v2, tc: rr },
        };
      }
      if (k === 1) {
        const p1 = r.step(1, 5, 0.5), v2 = r.step(1.5, 5, 0.1), W = Math.round(J(p1 * Math.log(v2))), ans = Math.exp(W / J(p1));
        return {
          q: [`Gas at $P_1 = ${n(p1)}$ bar, $V_1 = 1$ L expands isothermally and does $${W}$ J of work. What is its final volume, in litres?`, `$P_1 = ${n(p1)}$ bar、$V_1 = 1$ L の気体が等温膨張して $${W}$ J の仕事をします。終わりの体積は何 L ですか。`],
          a: { type: 'num', v: ans, tol: 0.01, unit: ['L', 'L'] },
          hint: ['Invert $W = P_1V_1\\ln(V_2/V_1)$.', '$W = P_1V_1\\ln(V_2/V_1)$ を逆に解きます。'],
          sol: [[`$P_1V_1 = ${n(p1)}$ bar·L $= ${n(J(p1))}$ J, so $\\ln(V_2/V_1) = ${W}/${n(J(p1))} = ${n(W / J(p1), 4)}$.`, `$P_1V_1 = ${n(p1)}$ bar·L $= ${n(J(p1))}$ J なので $\\ln(V_2/V_1) = ${W}/${n(J(p1))} = ${n(W / J(p1), 4)}$ です。`], [`$V_2 = e^{${n(W / J(p1), 4)}} = ${n(ans, 3)}$ L. Because the work grows only logarithmically, each extra joule costs an ever larger change of volume.`, `$V_2 = e^{${n(W / J(p1), 4)}} = ${n(ans, 3)}$ L です。仕事は体積の対数でしか増えないので、1 J 増やすごとに必要な体積の変化はどんどん大きくなります。`]],
          set: { process: 1, pressure: p1, volume: v2 },
        };
      }
      if (k === 2) {
        const p1 = r.step(1, 5, 0.5), askP = r.chance(0.5);
        return askP ? {
          q: [`Write the pressure $P(V)$ in bar along the reversible adiabat of a monatomic gas through $V = 1$ L, $P = ${n(p1)}$ bar, with $V$ in litres.`, `$V = 1$ L、$P = ${n(p1)}$ bar を通る単原子気体の可逆断熱線に沿った圧力 $P(V)$（bar、$V$ は L）を式で表してください。`],
          a: { type: 'expr', v: `${p1}*V^(-5/3)`, vars: ['V'], dom: { V: [0.5, 5] }, lhs: ['$P(V) =$', '$P(V) =$'] },
          hint: ['$PV^{\\gamma}$ is constant along the adiabat, with $\\gamma = 5/3$.', '断熱線に沿って $PV^{\\gamma}$ が一定で、$\\gamma = 5/3$ です。'],
          sol: [[`$PV^{5/3} = ${n(p1)}\\cdot 1^{5/3} = ${n(p1)}$, so $P(V) = ${n(p1)}\\,V^{-5/3}$.`, `$PV^{5/3} = ${n(p1)}\\cdot 1^{5/3} = ${n(p1)}$ なので $P(V) = ${n(p1)}\\,V^{-5/3}$ です。`], ['It falls faster than the isotherm $P = P_1/V$ through the same point, because the gas also cools as it expands.', '同じ点を通る等温線 $P = P_1/V$ より速く下がります。膨張しながら気体が冷えるからです。']],
          set: { process: 2, pressure: p1 },
        } : {
          q: ['For a monatomic ideal gas on a reversible adiabat starting at $V_1 = 1$ L, write $T(V)/T_1$ as a function of $V$ in litres.', '$V_1 = 1$ L から始まる単原子理想気体の可逆断熱変化について、$T(V)/T_1$ を $V$（L）の式で表してください。'],
          a: { type: 'expr', v: 'V^(-2/3)', vars: ['V'], dom: { V: [0.5, 5] }, lhs: ['$T/T_1 =$', '$T/T_1 =$'] },
          hint: ['Combine $PV^{\\gamma}$ = constant with $PV = nRT$.', '$PV^{\\gamma}$ = 一定 と $PV = nRT$ を組み合わせます。'],
          sol: [['$T \\propto PV = (PV^{\\gamma})V^{1 - \\gamma}$, and $PV^{\\gamma}$ is constant.', '$T \\propto PV = (PV^{\\gamma})V^{1 - \\gamma}$ で、$PV^{\\gamma}$ は一定です。'], ['So $T/T_1 = V^{1 - \\gamma} = V^{-2/3}$: halving the volume raises the temperature by $2^{2/3} \\approx 1.59$.', 'よって $T/T_1 = V^{1 - \\gamma} = V^{-2/3}$ です。体積を半分にすると温度は $2^{2/3} \\approx 1.59$ 倍になります。']],
          set: { process: 2 },
        };
      }
      const ratio = r.pick([8, 27, 64]), T1 = r.pick([250, 280, 300, 320]), f = Math.round(ratio ** (2 / 3)), gas = r.pick([['argon', 'アルゴン'], ['helium', 'ヘリウム'], ['neon', 'ネオン']]);
      return {
        q: [`A cylinder of ${gas[0]} at $${T1}$ K is compressed quickly (adiabatically and reversibly) to $1/${ratio}$ of its volume. What is the final temperature, in kelvin?`, `$${T1}$ K の${gas[1]}を、すばやく（可逆断熱的に）体積の $1/${ratio}$ まで圧縮します。終わりの温度は何 K ですか。`],
        a: { type: 'num', v: T1 * f, unit: ['K', 'K'] },
        hint: ['A noble gas is monatomic, so $\\gamma = 5/3$; use $TV^{\\gamma - 1}$ = constant.', '貴ガスは単原子なので $\\gamma = 5/3$ です。$TV^{\\gamma - 1}$ = 一定 を使います。'],
        sol: [[`$T_2 = T_1(V_1/V_2)^{2/3} = ${T1}\\times ${ratio}^{2/3} = ${T1}\\times ${f}$.`, `$T_2 = T_1(V_1/V_2)^{2/3} = ${T1}\\times ${ratio}^{2/3} = ${T1}\\times ${f}$ です。`], [`$T_2 = ${T1 * f}$ K. Rapid compression heats a gas strongly; a diesel engine ignites its fuel this way, though air, being diatomic, heats less ($\\gamma = 7/5$).`, `$T_2 = ${T1 * f}$ K です。急速な圧縮は気体を強く加熱します。ディーゼル機関はこの方法で燃料に点火しますが、空気は二原子分子なので（$\\gamma = 7/5$）加熱はこれより小さくなります。`]],
      };
    },
  ];

  // ---------- 2. Entropy: one jump or many small steps (C = 1 kJ/K) ----------
  const C = 1000;
  const Suniv = (lo, hi, N) => { const d = (hi - lo) / N; let s = C * Math.log(hi / lo); for (let k = 1; k <= N; k++) s -= C * d / (lo + k * d); return s; };
  const pair = (r, gap = 50) => { let c, h; do { c = r.step(200, 600, 10); h = r.step(300, 800, 10); } while (h - c < gap); return [c, h]; };
  Q['thermo-entropy'] = [
    (r) => {
      const k = r.int(0, 2), [c, h] = pair(r);
      if (k === 0) return {
        q: [`A body with heat capacity $C = 1$ kJ/K is heated from $${c}$ K to $${h}$ K. What is its entropy change, in J/K?`, `熱容量 $C = 1$ kJ/K の物体を $${c}$ K から $${h}$ K まで加熱します。物体のエントロピー変化は何 J/K ですか。`],
        a: { type: 'num', v: C * Math.log(h / c), unit: ['J/K', 'J/K'] },
        hint: ['Add up $dQ/T = C\\,dT/T$ along the way.', '途中の $dQ/T = C\\,dT/T$ を足し合わせます。'],
        sol: [[`$\\Delta S = \\int C\\,dT/T = C\\ln(T_h/T_c) = 1000\\ln(${h}/${c})$.`, `$\\Delta S = \\int C\\,dT/T = C\\ln(T_h/T_c) = 1000\\ln(${h}/${c})$ です。`], [`$= ${n(C * Math.log(h / c), 4)}$ J/K, whatever reservoirs are used: it depends only on the end states.`, `$= ${n(C * Math.log(h / c), 4)}$ J/K で、どの熱源を使っても同じです。始状態と終状態だけで決まります。`]],
        set: { hot: h, cold: c, steps: r.int(1, 6) },
      };
      if (k === 1) return {
        q: [`A body with $C = 1$ kJ/K is heated from $${c}$ K to $${h}$ K by touching a single reservoir at $${h}$ K. How much entropy does the reservoir lose, in J/K?`, `$C = 1$ kJ/K の物体を、$${h}$ K の熱源1つに触れさせて $${c}$ K から $${h}$ K まで加熱します。熱源が失うエントロピーは何 J/K ですか。`],
        a: { type: 'num', v: C * (h - c) / h, unit: ['J/K', 'J/K'] },
        hint: ['The reservoir stays at one temperature, so its entropy change is simply $-Q/T_h$.', '熱源の温度は一定なので、エントロピー変化は単に $-Q/T_h$ です。'],
        sol: [[`It gives up $Q = C(T_h - T_c) = ${C * (h - c)}$ J at $T_h = ${h}$ K.`, `熱源は $T_h = ${h}$ K で $Q = C(T_h - T_c) = ${C * (h - c)}$ J を放出します。`], [`It loses $Q/T_h = ${C * (h - c)}/${h} = ${n(C * (h - c) / h, 4)}$ J/K, less than the body gains, because the heat arrives at a temperature below $T_h$ on average.`, `失うエントロピーは $Q/T_h = ${C * (h - c)}/${h} = ${n(C * (h - c) / h, 4)}$ J/K で、物体の増加分より小さくなります。熱は平均して $T_h$ より低い温度で物体に入るからです。`]],
        set: { hot: h, cold: c, steps: 1 },
      };
      return {
        q: ['A cold body is heated by touching a much hotter reservoir. What can you say about the total entropy change of body plus reservoir?', '冷たい物体を、ずっと熱い熱源に触れさせて加熱します。物体と熱源を合わせたエントロピーの変化について正しいのはどれですか。'],
        a: { type: 'choice', opts: [['It is positive', '正である'], ['It is zero, because the heat lost equals the heat gained', '失った熱と得た熱が等しいので 0 である'], ['It is negative, because the reservoir loses entropy', '熱源がエントロピーを失うので負である'], ['Its sign depends on the heat capacity', '符号は熱容量による']], v: 0 },
        hint: ['Compare the temperature at which the heat leaves with the temperatures at which it arrives.', '熱が出ていく温度と、熱が入る温度を比べてください。'],
        sol: [['The same heat $Q$ leaves the reservoir at $T_h$ but enters the body at temperatures below $T_h$.', '同じ熱 $Q$ が、熱源からは $T_h$ で出ていき、物体には $T_h$ より低い温度で入ります。'], ['Since $dQ/T$ is larger at the lower temperature, the body gains more entropy than the reservoir loses: heat flow across a finite temperature difference is irreversible.', '$dQ/T$ は低い温度ほど大きいので、物体の得るエントロピーは熱源の失う分より大きくなります。有限の温度差を通る熱の流れは不可逆です。']],
        set: { steps: 1 },
      };
    },
    (r) => {
      const N = r.pick([1, 1, 2, 2, 3]), [c, h] = pair(r, 100), S = Suniv(c, h, N), d = (h - c) / N, Ts = Array.from({ length: N }, (_, i) => c + (i + 1) * d);
      return {
        q: [`A body with $C = 1$ kJ/K goes from $${c}$ K to $${h}$ K through ${N === 1 ? `one reservoir at $${h}$ K` : `${N} reservoirs at $${Ts.map((t) => n(t)).join(', ')}$ K in turn`}. Find $\\Delta S_{\\text{univ}}$ in J/K.`, `$C = 1$ kJ/K の物体を ${N === 1 ? `$${h}$ K の熱源1つ` : `$${Ts.map((t) => n(t)).join(',\\ ')}$ K の ${N} 個の熱源に順に`}触れさせて、$${c}$ K から $${h}$ K にします。$\\Delta S_{\\text{univ}}$ を J/K で求めてください。`],
        a: { type: 'num', v: S, rel: 0.01, unit: ['J/K', 'J/K'] },
        hint: ['The body gains $C\\ln(T_h/T_c)$; each reservoir at $T_k$ loses $C\\,\\Delta T/T_k$.', '物体は $C\\ln(T_h/T_c)$ を得て、温度 $T_k$ の各熱源は $C\\,\\Delta T/T_k$ を失います。'],
        sol: [[`Body: $1000\\ln(${h}/${c}) = ${n(C * Math.log(h / c), 4)}$ J/K.`, `物体：$1000\\ln(${h}/${c}) = ${n(C * Math.log(h / c), 4)}$ J/K です。`], [`Reservoirs: each supplies $${n(C * d)}$ J, losing $${Ts.map((t) => `${n(C * d)}/${n(t)}`).join(' + ')} = ${n(C * Math.log(h / c) - S, 4)}$ J/K in total.`, `熱源：それぞれ $${n(C * d)}$ J を供給し、合計で $${Ts.map((t) => `${n(C * d)}/${n(t)}`).join(' + ')} = ${n(C * Math.log(h / c) - S, 4)}$ J/K を失います。`], [`$\\Delta S_{\\text{univ}} = ${n(S, 4)}$ J/K $> 0$. ${N > 1 ? 'Using more, closer reservoirs makes it smaller.' : 'Splitting the heating among several reservoirs would make it smaller.'}`, `$\\Delta S_{\\text{univ}} = ${n(S, 4)}$ J/K $> 0$ です。${N > 1 ? '温度の近い熱源をさらに増やすと小さくなります。' : '加熱を複数の熱源に分ければ小さくなります。'}`]],
        set: { hot: h, cold: c, steps: N },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        for (let tries = 0; tries < 60; tries++) {
          const [c, h] = pair(r, 150), N0 = r.int(4, 30);
          const target = Number(((Suniv(c, h, N0) + Suniv(c, h, N0 - 1)) / 2).toFixed(1));
          let Nex = 1; while (Nex < 400 && Suniv(c, h, Nex) >= target) Nex++;
          const A = C * (h - c) ** 2 / (2 * c * h), Nest = Math.ceil(A / target);
          if (Nex !== N0 || Nest !== N0) continue;
          return {
            q: [`A body with $C = 1$ kJ/K is heated from $${c}$ K to $${h}$ K through $N$ evenly spaced reservoirs. What is the smallest $N$ that keeps $\\Delta S_{\\text{univ}}$ below $${n(target)}$ J/K?`, `$C = 1$ kJ/K の物体を、等間隔の温度の $N$ 個の熱源で $${c}$ K から $${h}$ K まで加熱します。$\\Delta S_{\\text{univ}}$ を $${n(target)}$ J/K 未満に抑える最小の $N$ を求めてください。`],
            a: { type: 'int', v: N0 },
            hint: ['For many reservoirs each step generates about $C\\,\\Delta T^2/(2T^2)$, so the total falls like $1/N$.', '熱源が多いとき各段階の生成はおよそ $C\\,\\Delta T^2/(2T^2)$ で、合計は $1/N$ のように減ります。'],
            sol: [[`Each sliver is a nearly triangular gap of width $C\\,\\Delta T$ and height $\\Delta T/T^2$; summing gives $\\Delta S_{\\text{univ}} \\approx \\dfrac{C(T_h - T_c)^2}{2N\\,T_cT_h} = ${n(A, 4)}/N$ J/K.`, `各細片は幅 $C\\,\\Delta T$、高さ $\\Delta T/T^2$ のほぼ三角形で、合計すると $\\Delta S_{\\text{univ}} \\approx \\dfrac{C(T_h - T_c)^2}{2N\\,T_cT_h} = ${n(A, 4)}/N$ J/K です。`], [`$N > ${n(A, 4)}/${n(target)} = ${n(A / target, 3)}$, so $N = ${N0}$.`, `$N > ${n(A, 4)}/${n(target)} = ${n(A / target, 3)}$ なので $N = ${N0}$ です。`], [`The exact sums agree: $${n(Suniv(c, h, N0 - 1), 4)}$ J/K at $N = ${N0 - 1}$, $${n(Suniv(c, h, N0), 4)}$ J/K at $N = ${N0}$. Reversibility is approached only in the limit of infinitely many steps.`, `厳密な和でも一致します。$N = ${N0 - 1}$ で $${n(Suniv(c, h, N0 - 1), 4)}$ J/K、$N = ${N0}$ で $${n(Suniv(c, h, N0), 4)}$ J/K です。可逆性に届くのは段階数が無限大の極限だけです。`]],
            set: { hot: h, cold: c, steps: N0 },
          };
        }
      }
      if (k === 1 || k === 0) {
        const h = r.step(400, 800, 10), c = r.step(200, h - 100, 10);
        return {
          q: ['A body is heated from $T_c$ to $T_h$ by a single reservoir at $T_h$. Writing $x = T_h/T_c$, give $\\Delta S_{\\text{univ}}/C$ as a function of $x$.', '物体を温度 $T_h$ の熱源1つで $T_c$ から $T_h$ まで加熱します。$x = T_h/T_c$ として、$\\Delta S_{\\text{univ}}/C$ を $x$ の式で表してください。'],
          a: { type: 'expr', v: 'ln(x) - 1 + 1/x', vars: ['x'], dom: { x: [1.05, 4] }, lhs: ['$\\Delta S_{\\text{univ}}/C =$', '$\\Delta S_{\\text{univ}}/C =$'] },
          hint: ['Body: $C\\ln(T_h/T_c)$. Reservoir: $-C(T_h - T_c)/T_h$. Divide through by $C$.', '物体は $C\\ln(T_h/T_c)$、熱源は $-C(T_h - T_c)/T_h$ です。$C$ で割ってください。'],
          sol: [['$\\Delta S_{\\text{univ}}/C = \\ln(T_h/T_c) - (T_h - T_c)/T_h = \\ln x - 1 + 1/x$.', '$\\Delta S_{\\text{univ}}/C = \\ln(T_h/T_c) - (T_h - T_c)/T_h = \\ln x - 1 + 1/x$ です。'], ['It vanishes at $x = 1$, and its derivative $1/x - 1/x^2$ is positive for $x > 1$, so it is positive for every real temperature jump: the second law, checked directly.', '$x = 1$ で 0 になり、導関数 $1/x - 1/x^2$ は $x > 1$ で正なので、温度の跳躍がある限り必ず正です。第二法則を直接確かめたことになります。'], [`For $T_c = ${c}$ K, $T_h = ${h}$ K it gives $${n(C * (Math.log(h / c) - 1 + c / h), 4)}$ J/K, the $N = 1$ value in the figure.`, `$T_c = ${c}$ K、$T_h = ${h}$ K では $${n(C * (Math.log(h / c) - 1 + c / h), 4)}$ J/K となり、図の $N = 1$ の値です。`]],
          set: { hot: h, cold: c, steps: 1 },
        };
      }
      const [c, h] = pair(r, 100), S = C * (Math.log(c / h) + (h - c) / c);
      return {
        q: [`Now run it the other way: the body ($C = 1$ kJ/K) at $${h}$ K is dropped into a single reservoir at $${c}$ K and cools to $${c}$ K. Find $\\Delta S_{\\text{univ}}$ in J/K.`, `今度は逆向きです。$${h}$ K の物体（$C = 1$ kJ/K）を $${c}$ K の熱源1つに入れ、$${c}$ K まで冷やします。$\\Delta S_{\\text{univ}}$ を J/K で求めてください。`],
        a: { type: 'num', v: S, rel: 0.01, unit: ['J/K', 'J/K'] },
        hint: ['The body loses $C\\ln(T_h/T_c)$; the cold reservoir gains $Q/T_c$.', '物体は $C\\ln(T_h/T_c)$ を失い、低温熱源は $Q/T_c$ を得ます。'],
        sol: [[`Body: $1000\\ln(${c}/${h}) = ${n(C * Math.log(c / h), 4)}$ J/K.`, `物体：$1000\\ln(${c}/${h}) = ${n(C * Math.log(c / h), 4)}$ J/K です。`], [`Reservoir: gains $${C * (h - c)}/${c} = ${n(C * (h - c) / c, 4)}$ J/K.`, `熱源：$${C * (h - c)}/${c} = ${n(C * (h - c) / c, 4)}$ J/K を得ます。`], [`$\\Delta S_{\\text{univ}} = ${n(S, 4)}$ J/K, again positive, and larger than for heating between the same temperatures, because now the heat is received at the lowest temperature of all.`, `$\\Delta S_{\\text{univ}} = ${n(S, 4)}$ J/K で、やはり正です。熱を最も低い温度で受け取るので、同じ温度間の加熱の場合より大きくなります。`]],
      };
    },
  ];

  // ---------- 3. Equation of state (ideal gas; van der Waals in the challenge) ----------
  const R = 8.314, RL = 0.08314; // J/(mol K); L bar/(mol K)
  const GASES = [
    { en: 'carbon dioxide', ja: '二酸化炭素', a: 3.640, b: 0.04267, Tc: 304.1 },
    { en: 'nitrogen', ja: '窒素', a: 1.370, b: 0.0387, Tc: 126.2 },
    { en: 'argon', ja: 'アルゴン', a: 1.355, b: 0.0320, Tc: 150.7 },
    { en: 'oxygen', ja: '酸素', a: 1.382, b: 0.03186, Tc: 154.6 },
    { en: 'water', ja: '水', a: 5.537, b: 0.0305, Tc: 647.1 },
    { en: 'helium', ja: 'ヘリウム', a: 0.0346, b: 0.0238, Tc: 5.2 },
  ];
  Q['equation-state'] = [
    (r) => {
      const k = r.int(0, 2);
      const nm = r.step(0.5, 3, 0.5), T = r.step(200, 800, 10), V = r.int(5, 50), Pk = nm * R * T / V;
      if (k === 0) return {
        q: [`$${n(nm)}$ mol of ideal gas at $${T}$ K fills $${V}$ L. What is its pressure in kPa? ($R = 8.314$ J/(mol·K).)`, `$${n(nm)}$ mol の理想気体が $${T}$ K で $${V}$ L を満たしています。圧力は何 kPa ですか（$R = 8.314$ J/(mol·K)）。`],
        a: { type: 'num', v: Pk, unit: ['kPa', 'kPa'] },
        hint: ['$P = nRT/V$; joules per litre are kilopascals.', '$P = nRT/V$ です。1 L あたりの J は kPa に等しくなります。'],
        sol: [[`$nRT = ${n(nm)}\\times 8.314\\times ${T} = ${n(nm * R * T, 5)}$ J.`, `$nRT = ${n(nm)}\\times 8.314\\times ${T} = ${n(nm * R * T, 5)}$ J です。`], [`$P = ${n(nm * R * T, 5)}\\ \\text{J}/${V}\\ \\text{L} = ${n(Pk, 4)}$ kPa, about $${n(Pk / 101.325, 3)}$ atm.`, `$P = ${n(nm * R * T, 5)}\\ \\text{J}/${V}\\ \\text{L} = ${n(Pk, 4)}$ kPa で、約 $${n(Pk / 101.325, 3)}$ 気圧です。`]],
        set: { n: nm, temperature: T, volume: V },
      };
      if (k === 1) {
        const a = r.pick([2, 3, 1.5, 0.5, 4]), b = r.pick([2, 0.5, 4, 3, 1.5].filter((x) => x !== a));
        return {
          q: [`A fixed amount of ideal gas has its absolute temperature multiplied by $${n(a)}$ and its volume multiplied by $${n(b)}$. By what factor does its pressure change?`, `一定量の理想気体の絶対温度を $${n(a)}$ 倍、体積を $${n(b)}$ 倍にします。圧力は何倍になりますか。`],
          a: { type: 'num', v: a / b },
          hint: ['At fixed $n$, $P \\propto T/V$.', '$n$ が一定なら $P \\propto T/V$ です。'],
          sol: [[`$P_2/P_1 = (T_2/T_1)(V_1/V_2) = ${n(a)}/${n(b)} = ${n(a / b, 4)}$.`, `$P_2/P_1 = (T_2/T_1)(V_1/V_2) = ${n(a)}/${n(b)} = ${n(a / b, 4)}$ です。`], ['Raising $T$ makes each molecule hit the walls harder and more often; a larger box spreads the same hits over more area and time.', '$T$ を上げると分子は壁により強く、より頻繁にぶつかり、箱を大きくすると同じ衝突がより広い面積と長い時間に分散します。']],
        };
      }
      const P0 = Number(Pk.toFixed(1));
      return {
        q: [`A ${V} L flask at $${T}$ K holds ideal gas at $${n(P0)}$ kPa. How many moles does it contain?`, `$${T}$ K の ${V} L のフラスコに、$${n(P0)}$ kPa の理想気体が入っています。物質量は何 mol ですか。`],
        a: { type: 'num', v: P0 * V / (R * T), unit: ['mol', 'mol'] },
        hint: ['Rearrange to $n = PV/RT$; kPa times L gives joules.', '$n = PV/RT$ と変形します。kPa × L は J です。'],
        sol: [[`$PV = ${n(P0)}\\times ${V} = ${n(P0 * V, 5)}$ J.`, `$PV = ${n(P0)}\\times ${V} = ${n(P0 * V, 5)}$ J です。`], [`$n = ${n(P0 * V, 5)}/(8.314\\times ${T}) = ${n(P0 * V / (R * T), 4)}$ mol.`, `$n = ${n(P0 * V, 5)}/(8.314\\times ${T}) = ${n(P0 * V / (R * T), 4)}$ mol です。`]],
        set: { n: nm, temperature: T, volume: V },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const V1 = r.int(5, 25), T1 = r.step(250, 400, 10), V2 = r.int(5, 50), T2 = r.step(200, 800, 10), P1 = r.pick([100, 101.3, 120, 150, 200]), P2 = P1 * V1 * T2 / (T1 * V2);
        return {
          q: [`A sealed balloon holds $${V1}$ L of gas at $${n(P1)}$ kPa and $${T1}$ K. It is moved to where it occupies $${V2}$ L at $${T2}$ K. What is the new pressure in kPa?`, `密閉した風船に $${n(P1)}$ kPa、$${T1}$ K の気体が $${V1}$ L 入っています。別の場所に移すと $${T2}$ K で $${V2}$ L になりました。新しい圧力は何 kPa ですか。`],
          a: { type: 'num', v: P2, unit: ['kPa', 'kPa'] },
          hint: ['With $n$ fixed, $PV/T$ is the same before and after.', '$n$ が一定なので、$PV/T$ は前後で等しくなります。'],
          sol: [[`$P_2 = P_1\\dfrac{V_1}{V_2}\\dfrac{T_2}{T_1} = ${n(P1)}\\times\\dfrac{${V1}}{${V2}}\\times\\dfrac{${T2}}{${T1}}$.`, `$P_2 = P_1\\dfrac{V_1}{V_2}\\dfrac{T_2}{T_1} = ${n(P1)}\\times\\dfrac{${V1}}{${V2}}\\times\\dfrac{${T2}}{${T1}}$ です。`], [`$P_2 = ${n(P2, 4)}$ kPa. Temperatures must be absolute: the ratio of Celsius values would be meaningless.`, `$P_2 = ${n(P2, 4)}$ kPa です。温度は絶対温度でなければなりません。セ氏の値の比には意味がありません。`]],
        };
      }
      if (k === 1) {
        const T = r.pick([273, 288, 293, 300, 310]), Pk = r.pick([101.3, 80, 50, 200, 26.5]), gas = r.pick([['air', '空気', 0.02897], ['helium', 'ヘリウム', 0.004003], ['carbon dioxide', '二酸化炭素', 0.04401], ['nitrogen', '窒素', 0.02801]]);
        const rho = Pk * 1000 * gas[2] / (R * T);
        return {
          q: [`Treat ${gas[0]} (molar mass $${n(gas[2] * 1000, 4)}$ g/mol) as an ideal gas. What is its density at $${n(Pk)}$ kPa and $${T}$ K, in kg/m³?`, `${gas[1]}（モル質量 $${n(gas[2] * 1000, 4)}$ g/mol）を理想気体とみなします。$${n(Pk)}$ kPa、$${T}$ K での密度は何 kg/m³ ですか。`],
          a: { type: 'num', v: rho, rel: 0.01, unit: ['kg/m³', 'kg/m³'] },
          hint: ['Mass per volume is $nM/V = PM/(RT)$; use SI units throughout.', '体積あたりの質量は $nM/V = PM/(RT)$ です。すべて SI 単位で計算してください。'],
          sol: [[`$n/V = P/(RT) = ${n(Pk * 1000)}/(8.314\\times ${T}) = ${n(Pk * 1000 / (R * T), 4)}$ mol/m³.`, `$n/V = P/(RT) = ${n(Pk * 1000)}/(8.314\\times ${T}) = ${n(Pk * 1000 / (R * T), 4)}$ mol/m³ です。`], [`$\\rho = (n/V)M = ${n(Pk * 1000 / (R * T), 4)}\\times ${gas[2]} = ${n(rho, 4)}$ kg/m³. At fixed $P$ and $T$ every ideal gas has the same molar density, so density is proportional to molar mass: that is why helium balloons rise.`, `$\\rho = (n/V)M = ${n(Pk * 1000 / (R * T), 4)}\\times ${gas[2]} = ${n(rho, 4)}$ kg/m³ です。同じ $P$、$T$ ではどの理想気体もモル密度が等しいので、密度はモル質量に比例します。ヘリウム風船が浮くのはこのためです。`]],
        };
      }
      return {
        q: ['Which list contains only intensive variables, ones that do not change if you join two identical copies of the system?', '同じ系を2つつなげても値が変わらない示強変数だけを並べたものはどれですか。'],
        a: { type: 'choice', opts: [['$P$, $T$ and the molar density $n/V$', '$P$、$T$、モル密度 $n/V$'], ['$P$, $V$ and $T$', '$P$、$V$、$T$'], ['$n$, $V$ and $U$', '$n$、$V$、$U$'], ['$P$, $T$ and $n$', '$P$、$T$、$n$']], v: 0 },
        hint: ['Double the system: which quantities double, and which stay put?', '系を2倍にしたとき、どの量が2倍になり、どの量が変わらないでしょう。'],
        sol: [['Joining two copies doubles $n$, $V$ and $U$: they are extensive.', '2つをつなげると $n$、$V$、$U$ は2倍になるので示量変数です。'], ['$P$, $T$ and ratios of extensive quantities such as $n/V$ are unchanged. That is why $P = (n/V)RT$ relates intensive quantities only.', '$P$、$T$ と、$n/V$ のような示量変数の比は変わりません。$P = (n/V)RT$ が示強変数どうしの関係になっているのはこのためです。']],
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const g = r.pick(GASES), which = r.int(0, 2);
        const Tc = 8 * g.a / (27 * RL * g.b), Pc = g.a / (27 * g.b * g.b), Vc = 3 * g.b;
        const ask = [[`the critical temperature $T_c$ in kelvin`, `臨界温度 $T_c$（K）`, Tc, ['K', 'K']], [`the critical pressure $P_c$ in bar`, `臨界圧力 $P_c$（bar）`, Pc, ['bar', 'bar']], [`the critical molar volume $V_c$ in L/mol`, `臨界モル体積 $V_c$（L/mol）`, Vc, ['L/mol', 'L/mol']]][which];
        return {
          q: [`For ${g.en} the van der Waals constants are $a = ${g.a}$ L²·bar/mol² and $b = ${g.b}$ L/mol. Find ${ask[0]} predicted by the van der Waals equation ($R = 0.08314$ L·bar/(mol·K)).`, `${g.ja}のファンデルワールス定数は $a = ${g.a}$ L²·bar/mol²、$b = ${g.b}$ L/mol です。ファンデルワールス方程式が予測する${ask[1]}を求めてください（$R = 0.08314$ L·bar/(mol·K)）。`],
          a: { type: 'num', v: ask[2], rel: 0.01, unit: ask[3] },
          hint: ['At the critical point the isotherm has an inflection with zero slope: $\\partial P/\\partial V = \\partial^2P/\\partial V^2 = 0$.', '臨界点では等温線が傾き 0 の変曲点をもちます。$\\partial P/\\partial V = \\partial^2P/\\partial V^2 = 0$ です。'],
          sol: [['Solving the two conditions with $P = RT/(V - b) - a/V^2$ gives $V_c = 3b$, $T_c = 8a/(27Rb)$, $P_c = a/(27b^2)$.', '$P = RT/(V - b) - a/V^2$ に2つの条件を課して解くと、$V_c = 3b$、$T_c = 8a/(27Rb)$、$P_c = a/(27b^2)$ です。'], [`Here ${['$T_c = 8(' + g.a + ')/(27\\times 0.08314\\times ' + g.b + ')', '$P_c = ' + g.a + '/(27\\times ' + g.b + '^2)', '$V_c = 3\\times ' + g.b][which]} = ${n(ask[2], 4)}$ ${ask[3][0]}.`, `ここでは ${['$T_c = 8(' + g.a + ')/(27\\times 0.08314\\times ' + g.b + ')', '$P_c = ' + g.a + '/(27\\times ' + g.b + '^2)', '$V_c = 3\\times ' + g.b][which]} = ${n(ask[2], 4)}$ ${ask[3][1]} です。`], [which === 0 ? `The measured value is about $${g.Tc}$ K. Above $T_c$ no pressure, however large, will liquefy ${g.en}.` : 'The constants $a$ and $b$ are usually fitted to the measured critical point, so this closes the loop: $a$ measures attraction, $b$ the molecules\u2019 own volume.', which === 0 ? `実測値は約 $${g.Tc}$ K です。$T_c$ より上では、どれだけ圧力を上げても${g.ja}は液化しません。` : '定数 $a$、$b$ はふつう実測の臨界点に合わせて決めるので、ここで話が一周します。$a$ は引力の強さ、$b$ は分子自身の体積を表します。']],
        };
      }
      if (k === 1) {
        const g = r.pick(GASES.slice(0, 5));
        return {
          q: [`Using the van der Waals critical constants of ${g.en} ($a = ${g.a}$, $b = ${g.b}$ in L, bar, mol units), compute the critical compressibility $Z_c = P_cV_c/(RT_c)$.`, `${g.ja}のファンデルワールス臨界定数（L、bar、mol 単位で $a = ${g.a}$、$b = ${g.b}$）を使って、臨界圧縮因子 $Z_c = P_cV_c/(RT_c)$ を計算してください。`],
          a: { type: 'num', v: 3 / 8, tol: 0.002, show: '3/8' },
          hint: ['Substitute the general formulas before putting in numbers.', '数値を入れる前に、一般の式を代入してください。'],
          sol: [['$Z_c = \\dfrac{a/(27b^2)\\cdot 3b}{R\\cdot 8a/(27Rb)} = \\dfrac{3}{8}$.', '$Z_c = \\dfrac{a/(27b^2)\\cdot 3b}{R\\cdot 8a/(27Rb)} = \\dfrac{3}{8}$ です。'], ['$a$ and $b$ cancel: every van der Waals gas has $Z_c = 0.375$, which is the law of corresponding states. Real gases give about $0.23$ to $0.31$ (carbon dioxide $0.27$), one measure of how rough the model is.', '$a$ と $b$ が消えるので、どのファンデルワールス気体でも $Z_c = 0.375$ です。これが対応状態の原理です。実在気体では約 $0.23$ から $0.31$（二酸化炭素は $0.27$）で、模型の粗さを示す目安になります。']],
        };
      }
      if (k === 2) {
        const Tr = r.pick([0.85, 0.9, 0.95, 1, 1.1, 1.2, 1.5]);
        return {
          q: [`In reduced variables $p = P/P_c$, $v = V/V_c$, $t = T/T_c$ the van der Waals equation is universal. Write the reduced isotherm $p(v)$ at $t = ${n(Tr)}$.`, `換算変数 $p = P/P_c$、$v = V/V_c$、$t = T/T_c$ を使うとファンデルワールス方程式は物質によらない形になります。$t = ${n(Tr)}$ の換算等温線 $p(v)$ を書いてください。`],
          a: { type: 'expr', v: `8*${Tr}/(3*v-1) - 3/v^2`, vars: ['v'], dom: { v: [0.6, 3] }, lhs: ['$p(v) =$', '$p(v) =$'] },
          hint: ['Substitute $P = pP_c$, $V = vV_c$, $T = tT_c$ with $V_c = 3b$, $T_c = 8a/(27Rb)$, $P_c = a/(27b^2)$.', '$P = pP_c$、$V = vV_c$、$T = tT_c$ を、$V_c = 3b$、$T_c = 8a/(27Rb)$、$P_c = a/(27b^2)$ とともに代入します。'],
          sol: [['The substitution gives $\\left(p + \\dfrac{3}{v^2}\\right)(3v - 1) = 8t$.', '代入すると $\\left(p + \\dfrac{3}{v^2}\\right)(3v - 1) = 8t$ となります。'], [`So $p(v) = \\dfrac{${n(8 * Tr)}}{3v - 1} - \\dfrac{3}{v^2}$.`, `よって $p(v) = \\dfrac{${n(8 * Tr)}}{3v - 1} - \\dfrac{3}{v^2}$ です。`], [Tr < 1 ? 'Below $t = 1$ this curve has a wiggle where $\\partial p/\\partial v > 0$, which is unstable: the real system splits into liquid and vapour there.' : Tr === 1 ? 'At $t = 1$ the curve has a flat inflection at $v = 1$, $p = 1$: the critical point.' : 'Above $t = 1$ it falls monotonically, like a distorted ideal-gas isotherm: no liquid can form.', Tr < 1 ? '$t = 1$ より下ではこの曲線に $\\partial p/\\partial v > 0$ となる波打ちがあり、そこは不安定です。実際の系はそこで液体と蒸気に分かれます。' : Tr === 1 ? '$t = 1$ では $v = 1$、$p = 1$ に水平な変曲点があり、これが臨界点です。' : '$t = 1$ より上では単調に減少し、ゆがんだ理想気体の等温線のようになります。液体はできません。']],
        };
      }
      const g = GASES[0], nm = r.step(1, 3, 0.5), V = r.int(5, 10), T = r.step(250, 400, 10);
      const Pid = nm * RL * T / V, Pvw = nm * RL * T / (V - nm * g.b) - g.a * nm * nm / (V * V), dev = 100 * (Pvw - Pid) / Pid;
      return {
        q: [`$${n(nm)}$ mol of carbon dioxide at $${T}$ K fills $${V}$ L. By what percentage does the van der Waals pressure differ from the ideal-gas pressure? ($a = 3.640$ L²·bar/mol², $b = 0.04267$ L/mol; give a signed percentage.)`, `二酸化炭素 $${n(nm)}$ mol が $${T}$ K で $${V}$ L を満たしています。ファンデルワールスの圧力は理想気体の圧力と何 % 違いますか（$a = 3.640$ L²·bar/mol²、$b = 0.04267$ L/mol。符号付きの百分率で答えてください）。`],
        a: { type: 'num', v: dev, tol: 0.05, unit: ['%', '%'] },
        hint: ['$P = nRT/(V - nb) - an^2/V^2$. The $b$ term raises the pressure, the $a$ term lowers it.', '$P = nRT/(V - nb) - an^2/V^2$ です。$b$ の項は圧力を上げ、$a$ の項は下げます。'],
        sol: [[`Ideal: $P = nRT/V = ${n(Pid, 5)}$ bar.`, `理想気体：$P = nRT/V = ${n(Pid, 5)}$ bar です。`], [`Van der Waals: $${n(nm * RL * T / (V - nm * g.b), 5)} - ${n(g.a * nm * nm / (V * V), 4)} = ${n(Pvw, 5)}$ bar.`, `ファンデルワールス：$${n(nm * RL * T / (V - nm * g.b), 5)} - ${n(g.a * nm * nm / (V * V), 4)} = ${n(Pvw, 5)}$ bar です。`], [`The difference is $${n(dev, 3)}$ %: attraction wins at this density, so the real gas presses less on the walls than an ideal one would. The figure shows the ideal value.`, `差は $${n(dev, 3)}$ % です。この密度では引力の効果が勝ち、実在気体は理想気体より弱く壁を押します。図には理想気体の値が出ています。`]],
        set: { n: nm, temperature: T, volume: V },
      };
    },
  ];
})();
