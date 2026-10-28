'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const kB = 8.617e-5; // eV/K
  const p1 = (D, T) => 1 / (Math.exp(D / T) + 1);
  const Cx = (x) => x * x * Math.exp(x) / (1 + Math.exp(x)) ** 2;

  // ---------- 1. Boltzmann weights of a two-level system (k = 1) ----------
  Q.boltzmann = [
    (r) => {
      const k = r.int(0, 2), D = r.step(0.5, 3, 0.1), T = r.step(0.3, 5, 0.1);
      if (k === 0) return {
        q: [`A two-level system has energies $0$ and $\\Delta E = ${n(D)}$ (units with $k_B = 1$). At $T = ${n(T)}$, what fraction $p_1$ of particles is in the upper level? Give three decimals.`, `エネルギー $0$ と $\\Delta E = ${n(D)}$ の二準位系です（$k_B = 1$ の単位）。$T = ${n(T)}$ で上の準位にある粒子の割合 $p_1$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: p1(D, T), tol: 6e-4 },
        hint: ['$p_1 = e^{-\\Delta E/T}/Z$ with $Z = 1 + e^{-\\Delta E/T}$.', '$p_1 = e^{-\\Delta E/T}/Z$、$Z = 1 + e^{-\\Delta E/T}$ です。'],
        sol: [[`$e^{-\\Delta E/T} = e^{-${n(D / T, 4)}} = ${n(Math.exp(-D / T), 4)}$.`, `$e^{-\\Delta E/T} = e^{-${n(D / T, 4)}} = ${n(Math.exp(-D / T), 4)}$ です。`], [`$p_1 = ${n(Math.exp(-D / T), 4)}/(1 + ${n(Math.exp(-D / T), 4)}) = ${n(p1(D, T), 4)}$, below one half as it must be at any positive temperature.`, `$p_1 = ${n(Math.exp(-D / T), 4)}/(1 + ${n(Math.exp(-D / T), 4)}) = ${n(p1(D, T), 4)}$ で、正の温度では必ず ½ より小さくなります。`]],
        set: { gap: D, temperature: T },
      };
      if (k === 1) return {
        q: [`For $\\Delta E = ${n(D)}$ and $T = ${n(T)}$ ($k_B = 1$), what is the population ratio $p_1/p_0$?`, `$\\Delta E = ${n(D)}$、$T = ${n(T)}$（$k_B = 1$）のとき、占有数の比 $p_1/p_0$ はいくつですか。`],
        a: { type: 'num', v: Math.exp(-D / T), tol: 6e-4 },
        hint: ['The partition function cancels in a ratio.', '比をとると分配関数は打ち消し合います。'],
        sol: [[`$p_1/p_0 = e^{-\\Delta E/T} = e^{-${n(D)}/${n(T)}}$.`, `$p_1/p_0 = e^{-\\Delta E/T} = e^{-${n(D)}/${n(T)}}$ です。`], [`$= ${n(Math.exp(-D / T), 4)}$: only the energy difference in units of $T$ matters.`, `$= ${n(Math.exp(-D / T), 4)}$ です。効くのは $T$ を単位としたエネルギー差だけです。`]],
        set: { gap: D, temperature: T },
      };
      const hot = r.chance(0.5);
      return {
        q: [hot ? 'As $T \\to \\infty$, what does the excited share $p_1$ of a two-level system approach?' : 'As $T \\to 0$, what does the excited share $p_1$ of a two-level system approach?', hot ? '$T \\to \\infty$ のとき、二準位系の励起の割合 $p_1$ は何に近づきますか。' : '$T \\to 0$ のとき、二準位系の励起の割合 $p_1$ は何に近づきますか。'],
        a: { type: 'choice', opts: [['$0$', '$0$'], ['$\\tfrac12$', '$\\tfrac12$'], ['$1$', '$1$'], ['$e^{-1} \\approx 0.37$', '$e^{-1} \\approx 0.37$']], v: hot ? 1 : 0, fixed: true },
        hint: ['Look at $e^{-\\Delta E/T}$ in each limit.', 'それぞれの極限で $e^{-\\Delta E/T}$ を調べてください。'],
        sol: hot ? [['As $T \\to \\infty$, $e^{-\\Delta E/T} \\to 1$, so both levels get equal weight and $p_1 \\to \\tfrac12$.', '$T \\to \\infty$ で $e^{-\\Delta E/T} \\to 1$ となり、2つの準位の重みが等しくなるので $p_1 \\to \\tfrac12$ です。'], ['Heating alone can never push more than half the particles up: a population inversion, as in a laser, needs pumping, not temperature.', '加熱だけでは半分より多くの粒子を上げることはできません。レーザーのような反転分布には温度ではなく励起（ポンピング）が必要です。']]
          : [['As $T \\to 0$, $e^{-\\Delta E/T} \\to 0$ faster than any power of $T$, so $p_1 \\to 0$.', '$T \\to 0$ で $e^{-\\Delta E/T}$ は $T$ のどんなべきよりも速く 0 に近づくので $p_1 \\to 0$ です。'], ['Every particle settles in the ground state; the gap $\\Delta E$ freezes the excitation out.', 'すべての粒子が基底状態に落ち着きます。エネルギー差 $\\Delta E$ が励起を凍結させるのです。']],
        set: { temperature: hot ? 5 : 0.2 },
      };
    },
    (r) => {
      const k = r.int(0, 3), D = r.step(0.5, 3, 0.1), T = r.step(0.3, 5, 0.1);
      if (k === 0) return {
        q: [`Find the mean energy $\\langle E\\rangle$ of a two-level system with $\\Delta E = ${n(D)}$ at $T = ${n(T)}$ ($k_B = 1$). Give three decimals.`, `$\\Delta E = ${n(D)}$ の二準位系の、$T = ${n(T)}$ での平均エネルギー $\\langle E\\rangle$ を小数第3位まで求めてください（$k_B = 1$）。`],
        a: { type: 'num', v: D * p1(D, T), tol: 6e-4 },
        hint: ['$\\langle E\\rangle = 0\\cdot p_0 + \\Delta E\\cdot p_1$.', '$\\langle E\\rangle = 0\\cdot p_0 + \\Delta E\\cdot p_1$ です。'],
        sol: [[`$p_1 = 1/(e^{${n(D / T, 4)}} + 1) = ${n(p1(D, T), 4)}$.`, `$p_1 = 1/(e^{${n(D / T, 4)}} + 1) = ${n(p1(D, T), 4)}$ です。`], [`$\\langle E\\rangle = ${n(D)}\\times ${n(p1(D, T), 4)} = ${n(D * p1(D, T), 4)}$, which can never exceed $\\Delta E/2 = ${n(D / 2)}$.`, `$\\langle E\\rangle = ${n(D)}\\times ${n(p1(D, T), 4)} = ${n(D * p1(D, T), 4)}$ で、$\\Delta E/2 = ${n(D / 2)}$ を超えることはありません。`]],
        set: { gap: D, temperature: T },
      };
      if (k === 1) {
        const pp = p1(D, T), shown = Number(pp.toFixed(4));
        return {
          q: [`A two-level system with $\\Delta E = ${n(D)}$ has $p_1 = ${shown}$. What is the temperature ($k_B = 1$)?`, `$\\Delta E = ${n(D)}$ の二準位系で $p_1 = ${shown}$ です。温度はいくつですか（$k_B = 1$）。`],
          a: { type: 'num', v: D / Math.log(1 / shown - 1), rel: 0.01 },
          hint: ['Solve $p_1 = 1/(e^{\\Delta E/T} + 1)$ for $T$.', '$p_1 = 1/(e^{\\Delta E/T} + 1)$ を $T$ について解きます。'],
          sol: [[`$e^{\\Delta E/T} = 1/p_1 - 1 = ${n(1 / shown - 1, 4)}$, so $\\Delta E/T = ${n(Math.log(1 / shown - 1), 4)}$.`, `$e^{\\Delta E/T} = 1/p_1 - 1 = ${n(1 / shown - 1, 4)}$ なので $\\Delta E/T = ${n(Math.log(1 / shown - 1), 4)}$ です。`], [`$T = ${n(D)}/${n(Math.log(1 / shown - 1), 4)} = ${n(D / Math.log(1 / shown - 1), 3)}$. Measuring a population ratio is a way of reading a thermometer, which is how the temperature of stellar atmospheres is found.`, `$T = ${n(D)}/${n(Math.log(1 / shown - 1), 4)} = ${n(D / Math.log(1 / shown - 1), 3)}$ です。占有数の比を測ることは温度計を読むことと同じで、恒星大気の温度もこうして求めます。`]],
          set: { gap: D, temperature: T },
        };
      }
      if (k === 2) {
        const x = D / T;
        return {
          q: [`The heat capacity per particle of a two-level system is $C/k_B = x^2e^x/(1 + e^x)^2$ with $x = \\Delta E/k_BT$. Evaluate it for $\\Delta E = ${n(D)}$, $T = ${n(T)}$. Give three decimals.`, `二準位系の1粒子あたりの熱容量は $C/k_B = x^2e^x/(1 + e^x)^2$、$x = \\Delta E/k_BT$ です。$\\Delta E = ${n(D)}$、$T = ${n(T)}$ で値を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: Cx(x), tol: 6e-4 },
          hint: ['First compute $x$, then substitute.', 'まず $x$ を計算してから代入します。'],
          sol: [[`$x = ${n(D)}/${n(T)} = ${n(x, 4)}$, $e^x = ${n(Math.exp(x), 4)}$.`, `$x = ${n(D)}/${n(T)} = ${n(x, 4)}$、$e^x = ${n(Math.exp(x), 4)}$ です。`], [`$C/k_B = ${n(x * x, 4)}\\times ${n(Math.exp(x), 4)}/${n((1 + Math.exp(x)) ** 2, 4)} = ${n(Cx(x), 4)}$. ${x > 2.4 ? 'Here $x$ is large: few particles can be excited, so the heat capacity is small.' : 'At small $x$ the levels are almost equally full already, so extra heat changes little and $C$ falls again.'}`, `$C/k_B = ${n(x * x, 4)}\\times ${n(Math.exp(x), 4)}/${n((1 + Math.exp(x)) ** 2, 4)} = ${n(Cx(x), 4)}$ です。${x > 2.4 ? 'ここでは $x$ が大きく、励起できる粒子が少ないので熱容量は小さくなります。' : '$x$ が小さいと2つの準位はすでにほぼ等しく埋まっているので、熱を加えても変化が少なく $C$ は再び小さくなります。'}`]],
          set: { gap: D, temperature: T },
        };
      }
      const sys = r.pick([[5, 77], [10, 77], [10, 300], [25, 300], [2, 4.2], [50, 1000], [1, 20]]), dE = sys[0] * 1e-3, Tk = sys[1], x = dE / (kB * Tk);
      return {
        q: [`An impurity in a crystal has two levels $${sys[0]}$ meV apart. At $${Tk}$ K, what fraction of impurities is in the upper level? ($k_B = 8.617\\times 10^{-5}$ eV/K.)`, `結晶中の不純物が $${sys[0]}$ meV 離れた2つの準位をもちます。$${Tk}$ K で上の準位にある不純物の割合はいくつですか（$k_B = 8.617\\times 10^{-5}$ eV/K）。`],
        a: { type: 'num', v: 1 / (Math.exp(x) + 1), rel: 0.01 },
        hint: ['Convert $k_BT$ to meV first and compare it with the gap.', 'まず $k_BT$ を meV に直して、準位差と比べてください。'],
        sol: [[`$k_BT = 8.617\\times 10^{-5}\\times ${Tk} = ${sig(kB * Tk * 1000, 4)}$ meV, so $x = \\Delta E/k_BT = ${sig(x, 4)}$.`, `$k_BT = 8.617\\times 10^{-5}\\times ${Tk} = ${sig(kB * Tk * 1000, 4)}$ meV なので $x = \\Delta E/k_BT = ${sig(x, 4)}$ です。`], [`$p_1 = 1/(e^{${sig(x, 4)}} + 1) = ${sig(1 / (Math.exp(x) + 1), 4)}$. ${x > 3 ? 'The gap is several $k_BT$, so the upper level is nearly empty.' : 'The gap is comparable to $k_BT$, so a sizeable share is excited.'}`, `$p_1 = 1/(e^{${sig(x, 4)}} + 1) = ${sig(1 / (Math.exp(x) + 1), 4)}$ です。${x > 3 ? '準位差が $k_BT$ の数倍あるので、上の準位はほとんど空です。' : '準位差が $k_BT$ と同程度なので、かなりの割合が励起されています。'}`]],
      };
    },
    (r) => {
      const k = r.int(0, 3), D = r.step(0.5, 3, 0.1);
      if (k === 0 || k === 1) {
        const mean = k === 1;
        return {
          q: [mean ? `Write the mean energy $\\langle E\\rangle$ of a two-level system with $\\Delta E = ${n(D)}$ as a function of $T$ ($k_B = 1$).` : `Write the excited share $p_1$ of a two-level system with $\\Delta E = ${n(D)}$ as a function of $T$ ($k_B = 1$).`, mean ? `$\\Delta E = ${n(D)}$ の二準位系の平均エネルギー $\\langle E\\rangle$ を $T$ の式で表してください（$k_B = 1$）。` : `$\\Delta E = ${n(D)}$ の二準位系の励起の割合 $p_1$ を $T$ の式で表してください（$k_B = 1$）。`],
          a: { type: 'expr', v: mean ? `${D}/(exp(${D}/T)+1)` : `1/(exp(${D}/T)+1)`, vars: ['T'], dom: { T: [0.3, 5] }, lhs: [mean ? '$\\langle E\\rangle =$' : '$p_1 =$', mean ? '$\\langle E\\rangle =$' : '$p_1 =$'] },
          hint: ['Divide the Boltzmann weight of the upper level by $Z = 1 + e^{-\\Delta E/T}$, then simplify.', '上の準位のボルツマン重みを $Z = 1 + e^{-\\Delta E/T}$ で割り、整理してください。'],
          sol: [[`$p_1 = \\dfrac{e^{-${n(D)}/T}}{1 + e^{-${n(D)}/T}} = \\dfrac{1}{e^{${n(D)}/T} + 1}$.`, `$p_1 = \\dfrac{e^{-${n(D)}/T}}{1 + e^{-${n(D)}/T}} = \\dfrac{1}{e^{${n(D)}/T} + 1}$ です。`], [mean ? `$\\langle E\\rangle = \\Delta E\\,p_1 = \\dfrac{${n(D)}}{e^{${n(D)}/T} + 1}$, rising from $0$ to $\\Delta E/2$.` : 'This is the Fermi function with the chemical potential at zero: it climbs from $0$ to $\\tfrac12$, like the orange curve in the figure.', mean ? `$\\langle E\\rangle = \\Delta E\\,p_1 = \\dfrac{${n(D)}}{e^{${n(D)}/T} + 1}$ で、$0$ から $\\Delta E/2$ まで増えます。` : 'これは化学ポテンシャルが 0 のフェルミ分布関数で、図の橙の曲線のように $0$ から $\\tfrac12$ まで増えます。']],
          set: { gap: D },
        };
      }
      if (k === 2) {
        let x = 2.4; for (let i = 0; i < 50; i++) { const f = x * Math.tanh(x / 2) - 2, d = Math.tanh(x / 2) + x / 2 / Math.cosh(x / 2) ** 2; x -= f / d; }
        return {
          q: [`At what temperature is the heat capacity of a two-level system with $\\Delta E = ${n(D)}$ largest ($k_B = 1$)? Give two decimals.`, `$\\Delta E = ${n(D)}$ の二準位系の熱容量が最大になる温度を小数第2位まで求めてください（$k_B = 1$）。`],
          a: { type: 'num', v: D / x, tol: 0.006 },
          hint: ['Maximise $x^2e^x/(1 + e^x)^2$ over $x = \\Delta E/T$; the condition reduces to $x\\tanh(x/2) = 2$, which you can solve numerically.', '$x = \\Delta E/T$ について $x^2e^x/(1 + e^x)^2$ を最大化します。条件は $x\\tanh(x/2) = 2$ に帰着し、数値的に解けます。'],
          sol: [['Write $C = (x/2)^2/\\cosh^2(x/2)$; setting $dC/dx = 0$ gives $x\\tanh(x/2) = 2$.', '$C = (x/2)^2/\\cosh^2(x/2)$ と書けます。$dC/dx = 0$ とおくと $x\\tanh(x/2) = 2$ です。'], [`Newton's method gives $x^* = ${n(x, 4)}$, so $T^* = \\Delta E/x^* = ${n(D / x, 4)}$, about $0.417\\,\\Delta E$.`, `ニュートン法で $x^* = ${n(x, 4)}$ となり、$T^* = \\Delta E/x^* = ${n(D / x, 4)}$、およそ $0.417\\,\\Delta E$ です。`], ['This Schottky peak is how a hidden pair of levels shows up in a calorimeter: its position measures $\\Delta E$.', 'これがショットキー・ピークで、隠れた2準位の組は熱量計でこのように現れます。ピークの位置から $\\Delta E$ がわかります。']],
          set: { gap: D, temperature: Math.max(0.2, Math.min(5, Math.round(D / x * 10) / 10)) },
        };
      }
      const T = r.step(0.3, 5, 0.1), w = Math.exp(-D / T), Z = 1 + w, S = Math.log(Z) + D * w / Z / T;
      return {
        q: [`Find the entropy $S/k_B$ of a two-level system with $\\Delta E = ${n(D)}$ at $T = ${n(T)}$. Give three decimals.`, `$\\Delta E = ${n(D)}$ の二準位系の、$T = ${n(T)}$ でのエントロピー $S/k_B$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: S, tol: 6e-4 },
        hint: ['Use $S = (\\langle E\\rangle - F)/T$ with $F = -T\\ln Z$, or $S = -\\sum p_i\\ln p_i$.', '$F = -T\\ln Z$ として $S = (\\langle E\\rangle - F)/T$、または $S = -\\sum p_i\\ln p_i$ を使います。'],
        sol: [[`$Z = 1 + e^{-${n(D / T, 4)}} = ${n(Z, 4)}$, $\\langle E\\rangle = ${n(D * w / Z, 4)}$.`, `$Z = 1 + e^{-${n(D / T, 4)}} = ${n(Z, 4)}$、$\\langle E\\rangle = ${n(D * w / Z, 4)}$ です。`], [`$S = \\ln Z + \\langle E\\rangle/T = ${n(Math.log(Z), 4)} + ${n(D * w / Z / T, 4)} = ${n(S, 4)}$.`, `$S = \\ln Z + \\langle E\\rangle/T = ${n(Math.log(Z), 4)} + ${n(D * w / Z / T, 4)} = ${n(S, 4)}$ です。`], [`It lies between $0$ (all in the ground state) and $\\ln 2 = 0.693$ (both levels equally likely), the most a two-state system can hold.`, `値は $0$（すべて基底状態）と $\\ln 2 = 0.693$（2準位が等確率）の間にあり、後者が2状態系のもちうる最大値です。`]],
        set: { gap: D, temperature: T },
      };
    },
  ];

  // ---------- 2. Partition function of a ladder E_i = i (ε = k = 1) ----------
  const stats = (m, T) => { let Z = 0, U = 0; for (let i = 0; i < m; i++) { const w = Math.exp(-i / T); Z += w; U += i * w; } U /= Z; const F = -T * Math.log(Z); return { Z, U, F, S: (U - F) / T }; };
  Q.partition = [
    (r) => {
      const k = r.int(0, 2), m = r.int(2, 4), T = r.step(0.5, 3, 0.1), s = stats(m, T);
      const terms = Array.from({ length: m }, (_, i) => (i === 0 ? '1' : `e^{-${i}/${n(T)}}`)).join(' + ');
      if (k === 0) return {
        q: [`Levels $E_i = i\\varepsilon$, $i = 0, \\dots, ${m - 1}$, at $k_BT = ${n(T)}\\varepsilon$. Compute the partition function $Z$. Give three decimals.`, `準位 $E_i = i\\varepsilon$（$i = 0, \\dots, ${m - 1}$）、$k_BT = ${n(T)}\\varepsilon$ です。分配関数 $Z$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: s.Z, tol: 6e-4 },
        hint: ['$Z$ is the sum of the Boltzmann weights $e^{-E_i/k_BT}$.', '$Z$ はボルツマン重み $e^{-E_i/k_BT}$ の和です。'],
        sol: [[`$Z = ${terms}$.`, `$Z = ${terms}$ です。`], [`$Z = ${n(s.Z, 4)}$: roughly the number of levels that are thermally accessible.`, `$Z = ${n(s.Z, 4)}$ で、熱的に到達できる準位のおおよその数を表します。`]],
        set: { states: m, temperature: T },
      };
      if (k === 1) return {
        q: [`Same ladder with $${m}$ levels at $k_BT = ${n(T)}\\varepsilon$. What is the probability $p_0$ of the ground state? Give three decimals.`, `同じ梯子で準位が $${m}$ 個、$k_BT = ${n(T)}\\varepsilon$ です。基底状態の確率 $p_0$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: 1 / s.Z, tol: 6e-4 },
        hint: ['The ground state has weight $1$, so $p_0 = 1/Z$.', '基底状態の重みは $1$ なので $p_0 = 1/Z$ です。'],
        sol: [[`$Z = ${terms} = ${n(s.Z, 4)}$.`, `$Z = ${terms} = ${n(s.Z, 4)}$ です。`], [`$p_0 = 1/Z = ${n(1 / s.Z, 4)}$, the longest bar in the figure.`, `$p_0 = 1/Z = ${n(1 / s.Z, 4)}$ で、図で最も長い棒です。`]],
        set: { states: m, temperature: T },
      };
      const i = r.int(1, 4), j = r.int(0, i - 1);
      return {
        q: [`At $k_BT = ${n(T)}\\varepsilon$, what is the ratio $p_${i}/p_${j}$ for the levels $E_i = i\\varepsilon$?`, `$k_BT = ${n(T)}\\varepsilon$ で、準位 $E_i = i\\varepsilon$ の確率の比 $p_${i}/p_${j}$ はいくつですか。`],
        a: { type: 'num', v: Math.exp(-(i - j) / T), tol: 6e-4 },
        hint: ['$Z$ cancels; only the energy difference matters.', '$Z$ は打ち消し合い、エネルギー差だけが効きます。'],
        sol: [[`$p_${i}/p_${j} = e^{-(${i} - ${j})/${n(T)}} = e^{-${n((i - j) / T, 4)}}$.`, `$p_${i}/p_${j} = e^{-(${i} - ${j})/${n(T)}} = e^{-${n((i - j) / T, 4)}}$ です。`], [`$= ${n(Math.exp(-(i - j) / T), 4)}$, and the same ratio holds between any two levels ${i - j} apart: the bars fall off geometrically.`, `$= ${n(Math.exp(-(i - j) / T), 4)}$ で、${i - j} 段離れたどの2準位の間でも同じ比になります。棒は等比的に短くなります。`]],
        set: { states: Math.max(i + 1, 5), temperature: T },
      };
    },
    (r) => {
      const k = r.int(0, 2), m = r.int(2, 20), T = r.step(0.3, 5, 0.1), s = stats(m, T), x = Math.exp(-1 / T);
      if (k === 0) return {
        q: [`An evenly spaced ladder with $n = ${m}$ levels at $k_BT = ${n(T)}\\varepsilon$. Find the free energy $F/\\varepsilon$. Give three decimals.`, `等間隔の梯子で準位が $n = ${m}$ 個、$k_BT = ${n(T)}\\varepsilon$ です。自由エネルギー $F/\\varepsilon$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: s.F, tol: 6e-4 },
        hint: ['Sum the geometric series: $Z = (1 - q^n)/(1 - q)$ with $q = e^{-\\varepsilon/k_BT}$.', '等比級数を足します。$q = e^{-\\varepsilon/k_BT}$ として $Z = (1 - q^n)/(1 - q)$ です。'],
        sol: [[`$q = e^{-1/${n(T)}} = ${n(x, 4)}$, so $Z = (1 - ${n(x, 4)}^{${m}})/(1 - ${n(x, 4)}) = ${n(s.Z, 4)}$.`, `$q = e^{-1/${n(T)}} = ${n(x, 4)}$ なので $Z = (1 - ${n(x, 4)}^{${m}})/(1 - ${n(x, 4)}) = ${n(s.Z, 4)}$ です。`], [`$F = -k_BT\\ln Z = -${n(T)}\\ln ${n(s.Z, 4)} = ${n(s.F, 4)}\\,\\varepsilon$: the gold point in the right panel.`, `$F = -k_BT\\ln Z = -${n(T)}\\ln ${n(s.Z, 4)} = ${n(s.F, 4)}\\,\\varepsilon$ で、右図の金色の点です。`]],
        set: { states: m, temperature: T },
      };
      if (k === 1) {
        const mm = r.int(2, 4), t = stats(mm, T);
        return {
          q: [`Find the mean energy $\\langle E\\rangle/\\varepsilon$ of a ladder with $${mm}$ levels ($E_i = i\\varepsilon$) at $k_BT = ${n(T)}\\varepsilon$. Give three decimals.`, `準位が $${mm}$ 個（$E_i = i\\varepsilon$）の梯子の、$k_BT = ${n(T)}\\varepsilon$ での平均エネルギー $\\langle E\\rangle/\\varepsilon$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: t.U, tol: 6e-4 },
          hint: ['$\\langle E\\rangle = \\sum_i E_i\\,e^{-E_i/k_BT}/Z$.', '$\\langle E\\rangle = \\sum_i E_i\\,e^{-E_i/k_BT}/Z$ です。'],
          sol: [[`Weights: $${Array.from({ length: mm }, (_, i) => n(Math.exp(-i / T), 4)).join(',\\ ')}$, with sum $Z = ${n(t.Z, 4)}$.`, `重みは $${Array.from({ length: mm }, (_, i) => n(Math.exp(-i / T), 4)).join(',\\ ')}$、和は $Z = ${n(t.Z, 4)}$ です。`], [`$\\langle E\\rangle = (${Array.from({ length: mm }, (_, i) => `${i}\\cdot ${n(Math.exp(-i / T), 4)}`).join(' + ')})/${n(t.Z, 4)} = ${n(t.U, 4)}$: the dashed line in the figure.`, `$\\langle E\\rangle = (${Array.from({ length: mm }, (_, i) => `${i}\\cdot ${n(Math.exp(-i / T), 4)}`).join(' + ')})/${n(t.Z, 4)} = ${n(t.U, 4)}$ で、図の破線です。`]],
          set: { states: mm, temperature: T },
        };
      }
      return {
        q: [`A ladder with $n = ${m}$ levels at $k_BT = ${n(T)}\\varepsilon$ has $\\langle E\\rangle = ${n(s.U, 4)}\\,\\varepsilon$ and $F = ${n(s.F, 4)}\\,\\varepsilon$. What is its entropy $S/k_B$?`, `準位 $n = ${m}$ 個の梯子が $k_BT = ${n(T)}\\varepsilon$ で $\\langle E\\rangle = ${n(s.U, 4)}\\,\\varepsilon$、$F = ${n(s.F, 4)}\\,\\varepsilon$ をもちます。エントロピー $S/k_B$ はいくつですか。`],
        a: { type: 'num', v: (Number(s.U.toFixed(4)) - Number(s.F.toFixed(4))) / T, tol: 0.002 },
        hint: ['$F = \\langle E\\rangle - TS$.', '$F = \\langle E\\rangle - TS$ です。'],
        sol: [[`$S/k_B = (\\langle E\\rangle - F)/k_BT = (${n(s.U, 4)} + ${n(-s.F, 4)})/${n(T)}$.`, `$S/k_B = (\\langle E\\rangle - F)/k_BT = (${n(s.U, 4)} + ${n(-s.F, 4)})/${n(T)}$ です。`], [`$= ${n(s.S, 4)}$, less than $\\ln ${m} = ${n(Math.log(m), 4)}$, the value if all ${m} levels were equally likely.`, `$= ${n(s.S, 4)}$ で、${m} 個の準位がすべて等確率の場合の $\\ln ${m} = ${n(Math.log(m), 4)}$ より小さくなります。`]],
        set: { states: m, temperature: T },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0 || k === 1) {
        const mean = k === 1;
        return {
          q: [mean ? 'For the infinite ladder $E_i = i\\varepsilon$, $i = 0, 1, 2, \\dots$, write $\\langle E\\rangle/\\varepsilon$ as a function of $T$, in units with $k_B = \\varepsilon = 1$.' : 'For the infinite ladder $E_i = i\\varepsilon$, $i = 0, 1, 2, \\dots$, write $Z$ as a function of $T$, in units with $k_B = \\varepsilon = 1$.', mean ? '無限の梯子 $E_i = i\\varepsilon$（$i = 0, 1, 2, \\dots$）について、$\\langle E\\rangle/\\varepsilon$ を $T$ の式で表してください（$k_B = \\varepsilon = 1$）。' : '無限の梯子 $E_i = i\\varepsilon$（$i = 0, 1, 2, \\dots$）について、$Z$ を $T$ の式で表してください（$k_B = \\varepsilon = 1$）。'],
          a: { type: 'expr', v: mean ? '1/(exp(1/T)-1)' : '1/(1-exp(-1/T))', vars: ['T'], dom: { T: [0.3, 5] }, lhs: [mean ? '$\\langle E\\rangle =$' : '$Z =$', mean ? '$\\langle E\\rangle =$' : '$Z =$'] },
          hint: [mean ? 'Find $Z$ first, then use $\\langle E\\rangle = T^2\\,d(\\ln Z)/dT$.' : 'It is a geometric series in $q = e^{-1/T}$.', mean ? 'まず $Z$ を求め、$\\langle E\\rangle = T^2\\,d(\\ln Z)/dT$ を使います。' : '$q = e^{-1/T}$ の等比級数です。'],
          sol: [['$Z = \\sum_{i \\ge 0} e^{-i/T} = \\dfrac{1}{1 - e^{-1/T}}$.', '$Z = \\sum_{i \\ge 0} e^{-i/T} = \\dfrac{1}{1 - e^{-1/T}}$ です。'], mean ? ['$\\ln Z = -\\ln(1 - e^{-1/T})$, so $\\langle E\\rangle = T^2\\dfrac{d\\ln Z}{dT} = \\dfrac{1}{e^{1/T} - 1}$.', '$\\ln Z = -\\ln(1 - e^{-1/T})$ なので $\\langle E\\rangle = T^2\\dfrac{d\\ln Z}{dT} = \\dfrac{1}{e^{1/T} - 1}$ です。'] : ['At high $T$ it grows like $T$: about $T/\\varepsilon$ levels are accessible.', '高温では $T$ に比例して大きくなり、およそ $T/\\varepsilon$ 個の準位に手が届きます。'], [mean ? 'This is the Planck occupation number of a harmonic mode (measured from the zero-point energy): $\\approx T - \\tfrac12$ at high $T$, exponentially small at low $T$.' : 'The right panel\u2019s dashed line is $F = -T\\ln Z$ for this $Z$, the limit the truncated ladders approach.', mean ? 'これは調和振動子のモードのプランク占有数（零点エネルギーから測ったもの）で、高温では $\\approx T - \\tfrac12$、低温では指数関数的に小さくなります。' : '右図の破線はこの $Z$ による $F = -T\\ln Z$ で、打ち切った梯子が近づく極限です。']],
        };
      }
      if (k === 2) {
        const T = r.step(0.5, 4.3, 0.1), need = Math.ceil(T * Math.log(100) - 1e-12);
        return {
          q: [`At $k_BT = ${n(T)}\\varepsilon$, what is the smallest number of levels $n$ for which the truncated ladder's $Z$ is within 1 % of the infinite ladder's?`, `$k_BT = ${n(T)}\\varepsilon$ で、打ち切った梯子の $Z$ が無限の梯子の $Z$ との差 1 % 以内に入る最小の準位数 $n$ はいくつですか。`],
          a: { type: 'int', v: need },
          hint: ['$Z_n/Z_\\infty = 1 - e^{-n\\varepsilon/k_BT}$.', '$Z_n/Z_\\infty = 1 - e^{-n\\varepsilon/k_BT}$ です。'],
          sol: [['The missing tail is a fraction $e^{-n/T}$ of $Z_\\infty$, so we need $e^{-n/T} \\le 0.01$.', '欠けている裾は $Z_\\infty$ の $e^{-n/T}$ の割合なので、$e^{-n/T} \\le 0.01$ が必要です。'], [`$n \\ge T\\ln 100 = ${n(T)}\\times 4.605 = ${n(T * Math.log(100), 4)}$, so $n = ${need}$.`, `$n \\ge T\\ln 100 = ${n(T)}\\times 4.605 = ${n(T * Math.log(100), 4)}$ なので $n = ${need}$ です。`], ['The number of levels that matter grows in proportion to the temperature; levels many $k_BT$ up are irrelevant.', '効いてくる準位の数は温度に比例して増え、$k_BT$ の何倍も上の準位は無関係になります。']],
          set: need <= 20 ? { states: need, temperature: T } : { temperature: T },
        };
      }
      const mol = r.pick([['N₂', 'N₂', 0.2889], ['O₂', 'O₂', 0.1959], ['CO', 'CO', 0.2690], ['H₂', 'H₂', 0.5160], ['Cl₂', 'Cl₂', 0.0694]]), Tk = r.pick([300, 500, 1000, 2000]);
      const x = mol[2] / (kB * Tk), frac = Math.exp(-x);
      return {
        q: [`The vibration of ${mol[0]} is an evenly spaced ladder with spacing $${mol[2]}$ eV. At $${Tk}$ K, what fraction of molecules is in an excited vibrational state? ($k_B = 8.617\\times 10^{-5}$ eV/K.)`, `${mol[1]} の振動は間隔 $${mol[2]}$ eV の等間隔の梯子です。$${Tk}$ K で振動の励起状態にある分子の割合はいくつですか（$k_B = 8.617\\times 10^{-5}$ eV/K）。`],
        a: { type: 'num', v: frac, rel: 0.01 },
        hint: ['The fraction not in the ground state is $1 - p_0 = 1 - 1/Z$ for the infinite ladder.', '無限の梯子では、基底状態にない割合は $1 - p_0 = 1 - 1/Z$ です。'],
        sol: [[`$x = \\varepsilon/k_BT = ${mol[2]}/(8.617\\times 10^{-5}\\times ${Tk}) = ${sig(x, 4)}$.`, `$x = \\varepsilon/k_BT = ${mol[2]}/(8.617\\times 10^{-5}\\times ${Tk}) = ${sig(x, 4)}$ です。`], [`$p_0 = 1/Z = 1 - e^{-x}$, so the excited fraction is $e^{-x} = ${sig(frac, 3)}$.`, `$p_0 = 1/Z = 1 - e^{-x}$ なので、励起されている割合は $e^{-x} = ${sig(frac, 3)}$ です。`], [frac < 0.05 ? 'Almost every molecule sits in its vibrational ground state: vibrations are frozen out, which is why such gases have $C_V \\approx \\tfrac52R$ rather than $\\tfrac72R$.' : 'A noticeable share is excited, so vibrations start to contribute to the heat capacity.', frac < 0.05 ? 'ほとんどの分子は振動の基底状態にあり、振動は凍結しています。このためこうした気体では $C_V$ が $\\tfrac72R$ ではなく $\\approx \\tfrac52R$ になります。' : 'かなりの割合が励起されているので、振動が熱容量に寄与し始めます。']],
      };
    },
  ];

  // ---------- 3. Random walk and diffusion ----------
  const binom = (N, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (N - k + i) / i; return c; };
  Q['random-walk'] = [
    (r) => {
      const k = r.int(0, 2), N = r.int(10, 200), b = r.step(-0.9, 0.9, 0.05);
      if (k === 0) return {
        q: [`A walk takes $N = ${N}$ unit steps, each right with probability $(1 + b)/2$, with bias $b = ${n(b)}$. What is the mean position $\\langle x\\rangle$?`, `1単位の歩を $N = ${N}$ 回、各歩で確率 $(1 + b)/2$ で右へ進むウォーク（バイアス $b = ${n(b)}$）です。平均位置 $\\langle x\\rangle$ はいくつですか。`],
        a: { type: 'num', v: N * b, tol: 0.01 },
        hint: ['One step has mean $(+1)\\tfrac{1+b}{2} + (-1)\\tfrac{1-b}{2}$.', '1歩の平均は $(+1)\\tfrac{1+b}{2} + (-1)\\tfrac{1-b}{2}$ です。'],
        sol: [[`One step averages $b = ${n(b)}$, and means add.`, `1歩の平均は $b = ${n(b)}$ で、平均は足し合わせられます。`], [`$\\langle x\\rangle = Nb = ${N}\\times ${n(b)} = ${n(N * b)}$: the dashed line in the figure.`, `$\\langle x\\rangle = Nb = ${N}\\times ${n(b)} = ${n(N * b)}$ で、図の破線です。`]],
        set: { steps: N, bias: b },
      };
      if (k === 1) {
        const NN = r.pick([16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196]);
        return {
          q: [`An unbiased walk takes $N = ${NN}$ unit steps. What is its root-mean-square displacement $\\sqrt{\\langle x^2\\rangle}$?`, `偏りのないウォークが1単位の歩を $N = ${NN}$ 回進みます。二乗平均平方根変位 $\\sqrt{\\langle x^2\\rangle}$ はいくつですか。`],
          a: { type: 'num', v: Math.sqrt(NN) },
          hint: ['For independent unit steps with mean zero, the variances add.', '平均 0 の独立な1単位の歩では、分散が足し合わせられます。'],
          sol: [[`Each step has $\\langle s^2\\rangle = 1$, so $\\langle x^2\\rangle = N = ${NN}$.`, `各歩は $\\langle s^2\\rangle = 1$ なので $\\langle x^2\\rangle = N = ${NN}$ です。`], [`$\\sqrt{${NN}} = ${Math.sqrt(NN)}$: after ${NN} steps the typical distance is only ${Math.sqrt(NN)}, because steps in opposite directions cancel.`, `$\\sqrt{${NN}} = ${Math.sqrt(NN)}$ です。${NN} 歩進んでも典型的な距離は ${Math.sqrt(NN)} にすぎません。逆向きの歩が打ち消し合うからです。`]],
          set: { steps: NN, bias: 0 },
        };
      }
      return {
        q: ['For an unbiased random walk of $N$ steps, which quantity grows in proportion to $N$?', '$N$ 歩の偏りのないランダムウォークで、$N$ に比例して増える量はどれですか。'],
        a: { type: 'choice', opts: [['The mean-square displacement $\\langle x^2\\rangle$', '平均二乗変位 $\\langle x^2\\rangle$'], ['The mean displacement $\\langle x\\rangle$', '平均変位 $\\langle x\\rangle$'], ['The root-mean-square displacement', '二乗平均平方根変位'], ['The probability of being back at the start', '出発点に戻っている確率']], v: 0 },
        hint: ['Which of these is a sum of $N$ equal, independent contributions?', 'このうち、$N$ 個の等しい独立な寄与の和になっているのはどれでしょう。'],
        sol: [['$\\langle x\\rangle = 0$ for every $N$, and the rms displacement grows like $\\sqrt N$; the return probability shrinks like $1/\\sqrt N$.', '$\\langle x\\rangle$ はどの $N$ でも 0、二乗平均平方根変位は $\\sqrt N$ のように増え、戻る確率は $1/\\sqrt N$ のように減ります。'], ['$\\langle x^2\\rangle = \\sum_i\\langle s_i^2\\rangle = N$, because the cross terms $\\langle s_is_j\\rangle$ vanish: this linear growth is the signature of diffusion.', '交差項 $\\langle s_is_j\\rangle$ が 0 なので $\\langle x^2\\rangle = \\sum_i\\langle s_i^2\\rangle = N$ です。この線形の増加が拡散の特徴です。']],
        set: { bias: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const N = r.int(10, 200), b = r.step(-0.8, 0.8, 0.05), ex2 = N * (1 - b * b) + (N * b) ** 2;
        return {
          q: [`A walk of $N = ${N}$ unit steps has bias $b = ${n(b)}$. Find $\\langle x^2\\rangle$.`, `$N = ${N}$ 歩、バイアス $b = ${n(b)}$ のウォークです。$\\langle x^2\\rangle$ を求めてください。`],
          a: { type: 'num', v: ex2, rel: 0.002 },
          hint: ['$\\langle x^2\\rangle = \\operatorname{Var}x + \\langle x\\rangle^2$.', '$\\langle x^2\\rangle = \\operatorname{Var}x + \\langle x\\rangle^2$ です。'],
          sol: [[`$\\operatorname{Var}x = N(1 - b^2) = ${N}\\times ${n(1 - b * b)} = ${n(N * (1 - b * b), 4)}$; $\\langle x\\rangle^2 = (${n(N * b)})^2 = ${n((N * b) ** 2, 4)}$.`, `$\\operatorname{Var}x = N(1 - b^2) = ${N}\\times ${n(1 - b * b)} = ${n(N * (1 - b * b), 4)}$、$\\langle x\\rangle^2 = (${n(N * b)})^2 = ${n((N * b) ** 2, 4)}$ です。`], [`$\\langle x^2\\rangle = ${n(ex2, 5)}$, as in the readout. ${Math.abs(N * b) > Math.sqrt(N * (1 - b * b)) ? 'The drift term dominates: the walk behaves mostly like steady motion.' : 'The spread term dominates: the walk is still mostly diffusive.'}`, `$\\langle x^2\\rangle = ${n(ex2, 5)}$ で、読み取り欄と一致します。${Math.abs(N * b) > Math.sqrt(N * (1 - b * b)) ? '移動の項が支配的で、ウォークはほぼ一定の運動のようにふるまいます。' : '広がりの項が支配的で、ウォークはまだほぼ拡散的です。'}`]],
          set: { steps: N, bias: b },
        };
      }
      if (k === 1) {
        const N = r.pick([10, 12, 14, 16, 20]), pr = binom(N, N / 2) / 2 ** N;
        return {
          q: [`An unbiased walk takes $N = ${N}$ steps. What is the exact probability that it ends where it started? Give four decimals.`, `偏りのないウォークが $N = ${N}$ 歩進みます。出発点で終わる厳密な確率を小数第4位まで求めてください。`],
          a: { type: 'num', v: pr, tol: 6e-5 },
          hint: ['Ending at $0$ needs exactly $N/2$ steps to the right; count those sequences.', '$0$ で終わるには、右への歩がちょうど $N/2$ 回必要です。その並び方を数えます。'],
          sol: [[`There are $\\binom{${N}}{${N / 2}} = ${binom(N, N / 2)}$ such sequences out of $2^{${N}} = ${2 ** N}$.`, `そのような並びは $2^{${N}} = ${2 ** N}$ 通りのうち $\\binom{${N}}{${N / 2}} = ${binom(N, N / 2)}$ 通りです。`], [`$P = ${binom(N, N / 2)}/${2 ** N} = ${n(pr, 5)}$, close to $\\sqrt{2/(\\pi N)} = ${n(Math.sqrt(2 / (Math.PI * N)), 4)}$, the peak of the normal curve times the spacing $2$.`, `$P = ${binom(N, N / 2)}/${2 ** N} = ${n(pr, 5)}$ で、正規曲線の山の高さに間隔 $2$ を掛けた $\\sqrt{2/(\\pi N)} = ${n(Math.sqrt(2 / (Math.PI * N)), 4)}$ に近い値です。`]],
          set: { steps: N, bias: 0 },
        };
      }
      const d = r.int(4, 14);
      return {
        q: [`How many unit steps does an unbiased walk need for its rms displacement to reach $${d}$?`, `偏りのないウォークの二乗平均平方根変位が $${d}$ に達するには、1単位の歩が何回必要ですか。`],
        a: { type: 'int', v: d * d },
        hint: ['$\\sqrt{\\langle x^2\\rangle} = \\sqrt N$.', '$\\sqrt{\\langle x^2\\rangle} = \\sqrt N$ です。'],
        sol: [[`$\\sqrt N = ${d}$ gives $N = ${d * d}$.`, `$\\sqrt N = ${d}$ より $N = ${d * d}$ です。`], [`Doubling the distance costs four times as many steps: diffusion is fast over short distances and hopelessly slow over long ones.`, `距離を2倍にするには4倍の歩数が要ります。拡散は短い距離では速く、長い距離では絶望的に遅いのです。`]],
        set: { steps: d * d, bias: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const b = r.pick([0.1, 0.2, 0.25, 0.3, 0.5, -0.2, -0.5, 0.4]);
        return {
          q: [`Write $\\langle x^2\\rangle$ as a function of the number of steps $N$ for a walk with bias $b = ${n(b)}$.`, `バイアス $b = ${n(b)}$ のウォークについて、$\\langle x^2\\rangle$ を歩数 $N$ の式で表してください。`],
          a: { type: 'expr', v: `${1 - b * b}*N + ${b * b}*N^2`, vars: ['N'], dom: { N: [1, 50] }, lhs: ['$\\langle x^2\\rangle =$', '$\\langle x^2\\rangle =$'] },
          hint: ['Add the variance $N(1 - b^2)$ and the squared mean $(Nb)^2$.', '分散 $N(1 - b^2)$ と平均の2乗 $(Nb)^2$ を足します。'],
          sol: [[`$\\langle x^2\\rangle = N(1 - b^2) + N^2b^2 = ${n(1 - b * b)}N + ${n(b * b)}N^2$.`, `$\\langle x^2\\rangle = N(1 - b^2) + N^2b^2 = ${n(1 - b * b)}N + ${n(b * b)}N^2$ です。`], [`The linear (diffusive) term wins for small $N$ and the quadratic (ballistic) term for large $N$; they are equal at $N = (1 - b^2)/b^2 = ${n((1 - b * b) / (b * b), 4)}$.`, `$N$ が小さいと一次の（拡散的な）項が、大きいと二次の（弾道的な）項が勝ちます。両者は $N = (1 - b^2)/b^2 = ${n((1 - b * b) / (b * b), 4)}$ で等しくなります。`]],
          set: { bias: b },
        };
      }
      if (k === 1) {
        const b = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]), Ns = (1 - b * b) / (b * b);
        return {
          q: [`With bias $b = ${n(b)}$, after how many steps does the drift $\\langle x\\rangle$ equal the spread $\\sigma = \\sqrt{\\operatorname{Var}x}$?`, `バイアス $b = ${n(b)}$ のとき、何歩後に移動 $\\langle x\\rangle$ が広がり $\\sigma = \\sqrt{\\operatorname{Var}x}$ に等しくなりますか。`],
          a: { type: 'num', v: Ns, rel: 0.005 },
          hint: ['Set $Nb = \\sqrt{N(1 - b^2)}$ and solve for $N$.', '$Nb = \\sqrt{N(1 - b^2)}$ とおいて $N$ について解きます。'],
          sol: [['Squaring, $N^2b^2 = N(1 - b^2)$, so $N^* = (1 - b^2)/b^2$.', '2乗すると $N^2b^2 = N(1 - b^2)$ なので $N^* = (1 - b^2)/b^2$ です。'], [`$N^* = ${n(1 - b * b)}/${n(b * b)} = ${n(Ns, 4)}$.`, `$N^* = ${n(1 - b * b)}/${n(b * b)} = ${n(Ns, 4)}$ です。`], ['Before $N^*$ a small bias is hidden in the noise; after it, the drift grows like $N$ and the spread only like $\\sqrt N$, so the bias becomes unmistakable. This is why weak signals need long averaging.', '$N^*$ より前は小さなバイアスは雑音に埋もれていますが、その後は移動が $N$ に比例し、広がりは $\\sqrt N$ でしか増えないので、バイアスがはっきり見えてきます。弱い信号に長い平均化が必要なのはこのためです。']],
          set: Ns <= 200 ? { steps: Math.max(10, Math.round(Ns)), bias: b } : { steps: 200, bias: b },
        };
      }
      if (k === 2) {
        const N = r.int(20, 200), b = r.step(0.05, 0.6, 0.05) * r.sign(), z = N * b / Math.sqrt(N * (1 - b * b));
        return {
          q: [`After $N = ${N}$ steps with bias $b = ${n(b)}$, how many standard deviations from the origin is the mean position?`, `バイアス $b = ${n(b)}$ で $N = ${N}$ 歩進んだ後、平均位置は原点から標準偏差の何倍離れていますか。`],
          a: { type: 'num', v: Math.abs(z), rel: 0.005 },
          hint: ['Divide $|\\langle x\\rangle| = N|b|$ by $\\sigma = \\sqrt{N(1 - b^2)}$.', '$|\\langle x\\rangle| = N|b|$ を $\\sigma = \\sqrt{N(1 - b^2)}$ で割ります。'],
          sol: [[`$|\\langle x\\rangle| = ${n(Math.abs(N * b))}$ and $\\sigma = \\sqrt{${N}\\times ${n(1 - b * b)}} = ${n(Math.sqrt(N * (1 - b * b)), 4)}$.`, `$|\\langle x\\rangle| = ${n(Math.abs(N * b))}$、$\\sigma = \\sqrt{${N}\\times ${n(1 - b * b)}} = ${n(Math.sqrt(N * (1 - b * b)), 4)}$ です。`], [`The ratio is $${n(Math.abs(z), 4)} = |b|\\sqrt{N/(1 - b^2)}$. ${Math.abs(z) > 2 ? 'The origin lies outside the ±2σ band: almost no walk is back near the start.' : 'The origin is still inside the ±2σ band: many walks end near the start despite the bias.'}`, `比は $${n(Math.abs(z), 4)} = |b|\\sqrt{N/(1 - b^2)}$ です。${Math.abs(z) > 2 ? '原点は ±2σ の帯の外にあり、出発点近くに戻っているウォークはほとんどありません。' : '原点はまだ ±2σ の帯の内側にあり、バイアスがあっても多くのウォークが出発点近くで終わります。'}`]],
          set: { steps: N, bias: b },
        };
      }
      const mol = r.pick([['oxygen', '酸素', 2.0e-9], ['glucose', 'グルコース', 6.7e-10], ['a typical protein', '典型的なタンパク質', 1e-10], ['sodium ions', 'ナトリウムイオン', 1.33e-9]]), dist = r.pick([[10e-6, '10 μm'], [1e-3, '1 mm'], [100e-6, '100 μm'], [1e-2, '1 cm']]);
      const t = dist[0] ** 2 / (6 * mol[2]);
      return {
        q: [`In water, ${mol[0]} diffuses with $D = ${sig(mol[2], 2)}$ m²/s. Roughly how long does it take to spread an rms distance of ${dist[1]} in three dimensions, in seconds?`, `水中で${mol[1]}は拡散係数 $D = ${sig(mol[2], 2)}$ m²/s で拡散します。三次元で二乗平均平方根距離 ${dist[1]} まで広がるのに何秒ほどかかりますか。`],
        a: { type: 'num', v: t, rel: 0.02, unit: ['s', 's'] },
        hint: ['In three dimensions $\\langle r^2\\rangle = 6Dt$: each axis contributes $2Dt$.', '三次元では $\\langle r^2\\rangle = 6Dt$ で、各軸が $2Dt$ ずつ寄与します。'],
        sol: [[`$t = \\langle r^2\\rangle/(6D) = (${sig(dist[0], 2)})^2/(6\\times ${sig(mol[2], 2)})$.`, `$t = \\langle r^2\\rangle/(6D) = (${sig(dist[0], 2)})^2/(6\\times ${sig(mol[2], 2)})$ です。`], [`$t = ${sig(t, 3)}$ s${t > 3600 ? `, about $${sig(t / 3600, 2)}$ hours` : ''}. ${t < 1 ? 'Across a cell diffusion is quick, which is why cells can rely on it.' : 'Over larger distances diffusion is far too slow, which is why bodies need circulation.'}`, `$t = ${sig(t, 3)}$ s${t > 3600 ? `、およそ $${sig(t / 3600, 2)}$ 時間` : ''}です。${t < 1 ? '細胞の大きさなら拡散は速く、細胞が拡散に頼れるのはこのためです。' : 'これより長い距離では拡散は遅すぎるので、からだには循環が必要です。'}`]],
      };
    },
  ];
})();
