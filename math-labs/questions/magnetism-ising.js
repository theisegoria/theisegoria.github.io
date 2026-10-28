'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const TC = 2 / Math.log(1 + Math.SQRT2);
  const mOns = (T) => (T >= TC ? 0 : Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8));
  const mf = (z, T, h = 0) => { let m = 1; for (let i = 0; i < 2000; i++) m = Math.tanh((z * m + h) / T); return m; };
  const atanh = (x) => 0.5 * Math.log((1 + x) / (1 - x));
  const NB = ['four', 'three', 'two', 'one', 'none'], NBJ = ['4個すべて', '3個', '2個', '1個', '0個'];

  // ---------- 1. the 2D Ising model and Metropolis ----------
  Q.metropolis = [
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const up = r.int(0, 4), s = r.pick([1, -1]), h = r.pick([0, 0, 0.1, 0.2, -0.2, 0.5, -0.3]), nb = 2 * up - 4, dE = 2 * s * (nb + h);
        return {
          q: [`A spin $s = ${s > 0 ? '+1' : '-1'}$ has ${NB[4 - up]} of its four neighbours up (the rest down), in a field $h = ${n(h)}$ ($J = 1$). What is the energy change $\\Delta E$ if it flips?`, `スピン $s = ${s > 0 ? '+1' : '-1'}$ の4つの隣のうち上向きは${NBJ[4 - up]}で、残りは下向きです。磁場は $h = ${n(h)}$（$J = 1$）です。このスピンが反転するときのエネルギー変化 $\\Delta E$ はいくつですか。`],
          a: { type: 'num', v: dE, tol: 1e-6 },
          hint: ['Only the bonds to this spin and its field term change: $\\Delta E = 2s(\\sum_{\\text{nb}} s_j + h)$.', '変わるのはこのスピンの結合と磁場の項だけで、$\\Delta E = 2s(\\sum_{\\text{nb}} s_j + h)$ です。'],
          sol: [[`The neighbour sum is $${up} - ${4 - up} = ${nb}$.`, `隣のスピンの和は $${up} - ${4 - up} = ${nb}$ です。`], [`$\\Delta E = 2(${s})(${nb} + ${n(h)}) = ${n(dE)}$. ${dE <= 0 ? 'It lowers the energy, so Metropolis always accepts it.' : `It costs energy, so Metropolis accepts it with probability $e^{-${n(dE)}/kT}$.`}`, `$\\Delta E = 2(${s})(${nb} + ${n(h)}) = ${n(dE)}$ です。${dE <= 0 ? 'エネルギーが下がるので、メトロポリス法は必ず受け入れます。' : `エネルギーが上がるので、メトロポリス法は確率 $e^{-${n(dE)}/kT}$ で受け入れます。`}`]],
          set: { h },
        };
      }
      if (k === 1) {
        const T = r.step(1, 5, 0.1), dE = r.pick([4, 8]);
        return {
          q: [`At $kT = ${n(T)}J$ and $h = 0$, a proposed flip would raise the energy by $${dE}J$. With what probability does the Metropolis rule accept it? Give three decimals.`, `$kT = ${n(T)}J$、$h = 0$ で、提案された反転がエネルギーを $${dE}J$ 上げます。メトロポリスの規則がそれを受け入れる確率を小数第3位まで求めてください。`],
          a: { type: 'num', v: Math.exp(-dE / T), tol: 6e-4 },
          hint: ['$P = \\min(1, e^{-\\Delta E/kT})$.', '$P = \\min(1, e^{-\\Delta E/kT})$ です。'],
          sol: [[`$P = e^{-${dE}/${n(T)}} = e^{-${n(dE / T, 4)}}$.`, `$P = e^{-${dE}/${n(T)}} = e^{-${n(dE / T, 4)}}$ です。`], [`$= ${n(Math.exp(-dE / T), 4)}$. ${dE === 8 ? 'A cost of $8J$ means flipping a spin whose four neighbours all agree with it: the move that breaks up a domain from inside.' : 'A cost of $4J$ is a spin with three agreeing neighbours, typically on the edge of a domain.'}`, `$= ${n(Math.exp(-dE / T), 4)}$ です。${dE === 8 ? '$8J$ の損失は4つの隣がすべて同じ向きのスピンの反転で、ドメインを内側から壊す動きです。' : '$4J$ の損失は3つの隣が同じ向きのスピンで、典型的にはドメインの縁にあります。'}`]],
          set: { T: Math.min(5, Math.max(0.8, T)), h: 0 },
        };
      }
      return {
        q: ['What is Onsager\u2019s critical temperature $kT_c/J$ of the square-lattice Ising model? Give three decimals.', 'オンサーガーによる正方格子イジング模型の臨界温度 $kT_c/J$ を小数第3位まで答えてください。'],
        a: { type: 'num', v: TC, tol: 6e-4 },
        hint: ['$kT_c = 2J/\\ln(1 + \\sqrt2)$.', '$kT_c = 2J/\\ln(1 + \\sqrt2)$ です。'],
        sol: [[`$\\ln(1 + \\sqrt2) = ${n(Math.log(1 + Math.SQRT2), 5)}$, so $kT_c = 2/${n(Math.log(1 + Math.SQRT2), 5)} = ${n(TC, 5)}\\,J$.`, `$\\ln(1 + \\sqrt2) = ${n(Math.log(1 + Math.SQRT2), 5)}$ なので $kT_c = 2/${n(Math.log(1 + Math.SQRT2), 5)} = ${n(TC, 5)}\\,J$ です。`], ['Below this temperature the lattice orders spontaneously, with no field to choose the direction.', 'この温度より下では、向きを選ぶ磁場がなくても格子は自発的に秩序化します。']],
        set: { T: 2.26, h: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const T = r.step(1, 2.24, 0.02), m = mOns(T);
        return {
          q: [`Using Onsager and Yang\u2019s exact result, find the spontaneous magnetisation of the square lattice at $kT = ${n(T)}J$. Give three decimals.`, `オンサーガーとヤンの厳密解を使って、$kT = ${n(T)}J$ における正方格子の自発磁化を小数第3位まで求めてください。`],
          a: { type: 'num', v: m, tol: 6e-4 },
          hint: ['$m = [1 - \\sinh^{-4}(2J/kT)]^{1/8}$ for $T < T_c$.', '$T < T_c$ では $m = [1 - \\sinh^{-4}(2J/kT)]^{1/8}$ です。'],
          sol: [[`$\\sinh(2/${n(T)}) = ${n(Math.sinh(2 / T), 5)}$, whose fourth power is $${n(Math.sinh(2 / T) ** 4, 5)}$.`, `$\\sinh(2/${n(T)}) = ${n(Math.sinh(2 / T), 5)}$ で、その4乗は $${n(Math.sinh(2 / T) ** 4, 5)}$ です。`], [`$m = (1 - 1/${n(Math.sinh(2 / T) ** 4, 5)})^{1/8} = ${n(m, 4)}$. ${T > 2.1 ? 'Even close to $T_c$ the magnetisation is large: the exponent $1/8$ makes the curve almost vertical at the transition.' : 'Well below $T_c$ the spins are nearly all aligned.'}`, `$m = (1 - 1/${n(Math.sinh(2 / T) ** 4, 5)})^{1/8} = ${n(m, 4)}$ です。${T > 2.1 ? '$T_c$ の近くでも磁化は大きく、指数 $1/8$ のために曲線は転移点でほぼ垂直になります。' : '$T_c$ より十分低いと、スピンはほぼすべてそろっています。'}`]],
          set: { T, h: 0 },
        };
      }
      if (k === 1) {
        const h = r.step(-0.5, 0.5, 0.05), up = h >= 0, E = -2 - Math.abs(h);
        return {
          q: [`In a field $h = ${n(h)}$ ($J = 1$), what is the energy per spin of the best fully aligned state of the square lattice?`, `磁場 $h = ${n(h)}$（$J = 1$）のもとで、正方格子の完全にそろった状態のうち最もエネルギーの低いもののスピンあたりのエネルギーはいくつですか。`],
          a: { type: 'num', v: E, tol: 1e-6 },
          hint: ['Each spin owns two of the bonds of the square lattice (right and up).', '正方格子では、各スピンは結合を2本ずつ（右と上）受け持ちます。'],
          sol: [['There are $2N$ bonds for $N$ spins, each contributing $-J$ when aligned: $-2J$ per spin.', '$N$ 個のスピンに対して結合は $2N$ 本あり、そろっていれば1本あたり $-J$ なので、スピンあたり $-2J$ です。'], [`Aligning ${up ? 'up' : 'down'} with the field adds $-|h| = ${n(-Math.abs(h))}$, so $E/N = ${n(E)}$, the lowest value the readout can show.`, `磁場に沿って${up ? '上' : '下'}向きにそろえると $-|h| = ${n(-Math.abs(h))}$ が加わり、$E/N = ${n(E)}$ です。読み取り欄に出る最低の値です。`]],
          set: { h, T: 0.8 },
        };
      }
      const T = r.step(1, 5, 0.1);
      return {
        q: [`At $kT = ${n(T)}J$, $h = 0$: how many times more often is a flip of a spin with three agreeing neighbours accepted than a flip of a spin with four agreeing neighbours?`, `$kT = ${n(T)}J$、$h = 0$ で、同じ向きの隣が3つのスピンの反転は、4つのスピンの反転より何倍受け入れられやすいですか。`],
        a: { type: 'num', v: Math.exp(4 / T), rel: 0.005 },
        hint: ['Work out $\\Delta E$ for each case first.', 'まずそれぞれの $\\Delta E$ を求めてください。'],
        sol: [['Three agreeing neighbours: $\\Delta E = 2(3 - 1) = 4J$. Four: $\\Delta E = 8J$.', '同じ向きの隣が3つなら $\\Delta E = 2(3 - 1) = 4J$、4つなら $\\Delta E = 8J$ です。'], [`The ratio is $e^{-4/${n(T)}}/e^{-8/${n(T)}} = e^{4/${n(T)}} = ${n(Math.exp(4 / T), 4)}$.`, `比は $e^{-4/${n(T)}}/e^{-8/${n(T)}} = e^{4/${n(T)}} = ${n(Math.exp(4 / T), 4)}$ です。`], ['At low temperature the edges of domains move while their interiors stay frozen, so domains grow by coarsening rather than by nucleating new ones.', '低温ではドメインの縁は動きますが内部は凍結しているので、ドメインは新しく生まれるのではなく、粗大化によって成長します。']],
        set: { T, h: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const f = r.pick([2, 1.5, 3, 1.2]), mfMode = r.chance(0.35), ex = mfMode ? 2 : 8;
        return {
          q: [mfMode ? `Mean field predicts $m \\propto (T_c - T)^{1/2}$. By what factor must $T_c - T$ shrink for $m$ to fall by a factor $${n(f)}$?` : `Near $T_c$ the exact solution gives $m \\propto (T_c - T)^{1/8}$. By what factor must $T_c - T$ shrink for $m$ to fall by a factor $${n(f)}$?`, mfMode ? `平均場は $m \\propto (T_c - T)^{1/2}$ を予測します。$m$ が $${n(f)}$ 分の1になるには、$T_c - T$ を何分の1にしなければなりませんか。` : `$T_c$ の近くで厳密解は $m \\propto (T_c - T)^{1/8}$ を与えます。$m$ が $${n(f)}$ 分の1になるには、$T_c - T$ を何分の1にしなければなりませんか。`],
          a: { type: 'num', v: f ** ex, rel: 0.005 },
          hint: ['If $m \\propto t^{\\beta}$, dividing $t$ by $F$ divides $m$ by $F^{\\beta}$.', '$m \\propto t^{\\beta}$ なら、$t$ を $F$ で割ると $m$ は $F^{\\beta}$ で割られます。'],
          sol: [[`We need $F^{1/${ex}} = ${n(f)}$, so $F = ${n(f)}^{${ex}} = ${n(f ** ex, 4)}$.`, `$F^{1/${ex}} = ${n(f)}$ が必要なので $F = ${n(f)}^{${ex}} = ${n(f ** ex, 4)}$ です。`], [mfMode ? 'With exponent $1/2$ the magnetisation grows smoothly out of zero.' : 'With exponent $1/8$ the magnetisation stays large until extremely close to $T_c$, then drops almost vertically: the reason the exact curve in the figure looks like a cliff.', mfMode ? '指数が $1/2$ なら、磁化は 0 から滑らかに立ち上がります。' : '指数が $1/8$ だと磁化は $T_c$ のごく近くまで大きいままで、そこでほぼ垂直に落ちます。図の厳密な曲線が崖のように見えるのはこのためです。']],
        };
      }
      if (k === 1) {
        const mat = r.pick([['K₂CoF₄', 107], ['Rb₂CoF₄', 101], ['K₂NiF₄ (as if it were Ising)', 97]]), J = 0.08617 * mat[1] * Math.log(1 + Math.SQRT2) / 2;
        return {
          q: [`The layered magnet ${mat[0]} behaves like a two-dimensional Ising model and orders at $T_c \\approx ${mat[1]}$ K. Estimate the coupling $J$ in meV. ($k_B = 0.08617$ meV/K.)`, `層状磁性体 ${mat[0]} は二次元イジング模型のようにふるまい、$T_c \\approx ${mat[1]}$ K で秩序化します。結合定数 $J$ を meV で見積もってください（$k_B = 0.08617$ meV/K）。`],
          a: { type: 'num', v: J, rel: 0.01, unit: ['meV', 'meV'] },
          hint: ['Invert Onsager\u2019s $kT_c = 2J/\\ln(1 + \\sqrt2)$.', 'オンサーガーの $kT_c = 2J/\\ln(1 + \\sqrt2)$ を逆に解きます。'],
          sol: [[`$k_BT_c = 0.08617\\times ${mat[1]} = ${n(0.08617 * mat[1], 4)}$ meV.`, `$k_BT_c = 0.08617\\times ${mat[1]} = ${n(0.08617 * mat[1], 4)}$ meV です。`], [`$J = k_BT_c\\ln(1 + \\sqrt2)/2 = ${n(J, 4)}$ meV. Mean field would have given $J = k_BT_c/4$, about $${n(0.08617 * mat[1] / 4, 3)}$ meV, an underestimate by the factor $1.76$.`, `$J = k_BT_c\\ln(1 + \\sqrt2)/2 = ${n(J, 4)}$ meV です。平均場なら $J = k_BT_c/4$、約 $${n(0.08617 * mat[1] / 4, 3)}$ meV となり、$1.76$ 倍の過小評価になります。`]],
        };
      }
      if (k === 2) return {
        q: ['Write Onsager and Yang\u2019s spontaneous magnetisation $m(T)$ of the square lattice for $T < T_c$, in units $J = k = 1$.', '正方格子のオンサーガーとヤンの自発磁化 $m(T)$（$T < T_c$）を、$J = k = 1$ の単位で書いてください。'],
        a: { type: 'expr', v: '(1 - sinh(2/T)^(-4))^(1/8)', vars: ['T'], dom: { T: [1, 2.2] }, lhs: ['$m(T) =$', '$m(T) =$'] },
        hint: ['It vanishes where $\\sinh(2J/kT) = 1$, which is exactly $T_c$.', '$\\sinh(2J/kT) = 1$ となる点で 0 になり、そこがちょうど $T_c$ です。'],
        sol: [['$m(T) = \\left[1 - \\sinh^{-4}(2/T)\\right]^{1/8}$.', '$m(T) = \\left[1 - \\sinh^{-4}(2/T)\\right]^{1/8}$ です。'], ['Setting $\\sinh(2/T_c) = 1$ gives $2/T_c = \\ln(1 + \\sqrt2)$, Onsager\u2019s $T_c = 2.269$; near it $1 - \\sinh^{-4}$ vanishes linearly, so $m \\propto (T_c - T)^{1/8}$.', '$\\sinh(2/T_c) = 1$ から $2/T_c = \\ln(1 + \\sqrt2)$、すなわちオンサーガーの $T_c = 2.269$ が出ます。その近くで $1 - \\sinh^{-4}$ は線形に 0 になるので $m \\propto (T_c - T)^{1/8}$ です。']],
        set: { h: 0 },
      };
      const T = r.step(1.2, 2.24, 0.02), m = Number(mOns(T).toFixed(4)), ans = 2 / Math.asinh(Math.pow(1 - m ** 8, -0.25));
      return {
        q: [`A simulation of the square lattice at $h = 0$ settles at $|m| = ${m}$, matching the exact curve. What is $kT/J$?`, `$h = 0$ の正方格子のシミュレーションが厳密な曲線どおり $|m| = ${m}$ に落ち着きました。$kT/J$ はいくつですか。`],
        a: { type: 'num', v: ans, tol: 0.006 },
        hint: ['Solve $m^8 = 1 - \\sinh^{-4}(2/T)$ for $T$.', '$m^8 = 1 - \\sinh^{-4}(2/T)$ を $T$ について解きます。'],
        sol: [[`$m^8 = ${n(m ** 8, 5)}$, so $\\sinh^{-4}(2/T) = ${n(1 - m ** 8, 5)}$ and $\\sinh(2/T) = ${n(Math.pow(1 - m ** 8, -0.25), 5)}$.`, `$m^8 = ${n(m ** 8, 5)}$ なので $\\sinh^{-4}(2/T) = ${n(1 - m ** 8, 5)}$、$\\sinh(2/T) = ${n(Math.pow(1 - m ** 8, -0.25), 5)}$ です。`], [`$T = 2/\\operatorname{arsinh}(${n(Math.pow(1 - m ** 8, -0.25), 5)}) = ${n(ans, 4)}$, that is $${n(ans / TC, 3)}\\,T_c$. Because $m$ is raised to the eighth power, a small error in $m$ hardly moves this estimate.`, `$T = 2/\\operatorname{arsinh}(${n(Math.pow(1 - m ** 8, -0.25), 5)}) = ${n(ans, 4)}$、すなわち $${n(ans / TC, 3)}\\,T_c$ です。$m$ を8乗するので、$m$ の小さな誤差はこの推定をほとんど動かしません。`]],
        set: { T, h: 0 },
      };
    },
  ];

  // ---------- 2. the Ising chain (transfer matrix) ----------
  const xi = (T) => -1 / Math.log(Math.tanh(1 / T));
  Q['ising-chain'] = [
    (r) => {
      const k = r.int(0, 1);
      if (k === 0) {
        const T = r.step(0.5, 4, 0.05), rr = r.int(1, 8), c = Math.tanh(1 / T) ** rr;
        return {
          q: [`In the Ising chain at $kT = ${n(T)}J$ and $h = 0$, what is the correlation $\\langle s_0 s_{${rr}}\\rangle$? Give three decimals.`, `$kT = ${n(T)}J$、$h = 0$ のイジング鎖で、相関 $\\langle s_0 s_{${rr}}\\rangle$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: c, tol: 6e-4 },
          hint: ['Each bond passes the correlation on with a factor $\\tanh(J/kT)$.', '結合を1本通るごとに、相関に $\\tanh(J/kT)$ が掛かります。'],
          sol: [[`$\\tanh(1/${n(T)}) = ${n(Math.tanh(1 / T), 5)}$.`, `$\\tanh(1/${n(T)}) = ${n(Math.tanh(1 / T), 5)}$ です。`], [`$\\langle s_0s_{${rr}}\\rangle = ${n(Math.tanh(1 / T), 5)}^{${rr}} = ${n(c, 4)}$: correlations die off geometrically along the chain.`, `$\\langle s_0s_{${rr}}\\rangle = ${n(Math.tanh(1 / T), 5)}^{${rr}} = ${n(c, 4)}$ で、相関は鎖に沿って等比的に減衰します。`]],
          set: { T, h: 0 },
        };
      }
      const w = r.int(1, 4);
      return {
        q: [`A fully aligned Ising chain ($h = 0$) is cut into ${w + 1} domains by ${w === 1 ? 'one domain wall' : `${w} domain walls`}. How much energy does this cost, in units of $J$?`, `完全にそろったイジング鎖（$h = 0$）を ${w} 個のドメイン壁で ${w + 1} 個のドメインに分けます。必要なエネルギーは $J$ を単位としていくつですか。`],
        a: { type: 'num', v: 2 * w, tol: 1e-6 },
        hint: ['A wall is a single broken bond: it changes $-J$ into $+J$.', '壁は1本の切れた結合で、$-J$ を $+J$ に変えます。'],
        sol: [['Each wall turns one satisfied bond ($-J$) into an unsatisfied one ($+J$), costing $2J$.', '壁1つは満たされた結合（$-J$）を満たされない結合（$+J$）に変え、$2J$ かかります。'], [`${w} walls cost $${2 * w}J$, independent of the chain length. Since a wall can be placed anywhere, its entropy grows with the length while its cost does not: the reason the chain never orders.`, `${w} 個の壁で $${2 * w}J$ で、鎖の長さによりません。壁はどこにでも置けるので、エントロピーは長さとともに増えますがエネルギーの損失は増えません。これが鎖が秩序化しない理由です。`]],
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const T = r.step(0.3, 3, 0.05), x = xi(T);
        return {
          q: [`Find the correlation length $\\xi$ of the Ising chain at $kT = ${n(T)}J$, $h = 0$, in lattice spacings.`, `$kT = ${n(T)}J$、$h = 0$ のイジング鎖の相関長 $\\xi$ を格子間隔を単位として求めてください。`],
          a: { type: 'num', v: x, rel: 0.005 },
          hint: ['Write $\\tanh^r(J/kT) = e^{-r/\\xi}$.', '$\\tanh^r(J/kT) = e^{-r/\\xi}$ と書きます。'],
          sol: [[`$\\tanh(1/${n(T)}) = ${n(Math.tanh(1 / T), 6)}$.`, `$\\tanh(1/${n(T)}) = ${n(Math.tanh(1 / T), 6)}$ です。`], [`$\\xi = -1/\\ln ${n(Math.tanh(1 / T), 6)} = ${sig(x, 4)}$. ${x > 50 ? 'Huge, but finite: order extends over long stretches, yet the average magnetisation is still zero.' : 'Domains are only a few spins long.'}`, `$\\xi = -1/\\ln ${n(Math.tanh(1 / T), 6)} = ${sig(x, 4)}$ です。${x > 50 ? '非常に大きいものの有限で、秩序は長い区間に及びますが平均の磁化はやはり 0 です。' : 'ドメインは数スピン程度の長さしかありません。'}`]],
          set: { T, h: 0 },
        };
      }
      if (k === 1) {
        const T = r.step(0.5, 4, 0.05);
        return {
          q: [`Find the two eigenvalues $\\lambda_+ \\ge \\lambda_-$ of the transfer matrix of the Ising chain at $kT = ${n(T)}J$, $h = 0$.`, `$kT = ${n(T)}J$、$h = 0$ のイジング鎖の転移行列の2つの固有値 $\\lambda_+ \\ge \\lambda_-$ を求めてください。`],
          a: { type: 'tuple', v: [2 * Math.cosh(1 / T), 2 * Math.sinh(1 / T)], labels: ['$\\lambda_+$', '$\\lambda_-$'], tol: 0.002 },
          hint: ['At $h = 0$, $V = \\begin{pmatrix} e^{K} & e^{-K} \\\\ e^{-K} & e^{K}\\end{pmatrix}$ with $K = J/kT$; its eigenvectors are $(1, \\pm1)$.', '$h = 0$ では $K = J/kT$ として $V = \\begin{pmatrix} e^{K} & e^{-K} \\\\ e^{-K} & e^{K}\\end{pmatrix}$ で、固有ベクトルは $(1, \\pm1)$ です。'],
          sol: [[`$\\lambda_\\pm = e^{K} \\pm e^{-K}$, i.e. $2\\cosh K$ and $2\\sinh K$ with $K = ${n(1 / T, 4)}$.`, `$\\lambda_\\pm = e^{K} \\pm e^{-K}$、すなわち $K = ${n(1 / T, 4)}$ として $2\\cosh K$ と $2\\sinh K$ です。`], [`$\\lambda_+ = ${n(2 * Math.cosh(1 / T), 4)}$, $\\lambda_- = ${n(2 * Math.sinh(1 / T), 4)}$. Their ratio $\\tanh K = ${n(Math.tanh(1 / T), 4)}$ is what sets the correlations, and since it stays below 1 for every $T > 0$, there is no transition.`, `$\\lambda_+ = ${n(2 * Math.cosh(1 / T), 4)}$、$\\lambda_- = ${n(2 * Math.sinh(1 / T), 4)}$ です。比 $\\tanh K = ${n(Math.tanh(1 / T), 4)}$ が相関を決め、どの $T > 0$ でも1より小さいので転移は起こりません。`]],
          set: { T, h: 0 },
        };
      }
      const T = r.step(0.5, 3, 0.05), h = r.step(0.05, 0.5, 0.05), sh = Math.sinh(h / T), m = sh / Math.sqrt(sh * sh + Math.exp(-4 / T));
      return {
        q: [`Find the exact magnetisation of the infinite Ising chain at $kT = ${n(T)}J$ in a field $h = ${n(h)}J$. Give three decimals.`, `$kT = ${n(T)}J$、磁場 $h = ${n(h)}J$ における無限イジング鎖の厳密な磁化を小数第3位まで求めてください。`],
        a: { type: 'num', v: m, tol: 6e-4 },
        hint: ['$m = \\sinh(h/kT)/\\sqrt{\\sinh^2(h/kT) + e^{-4J/kT}}$, from $\\partial\\ln\\lambda_+/\\partial h$.', '$\\partial\\ln\\lambda_+/\\partial h$ から $m = \\sinh(h/kT)/\\sqrt{\\sinh^2(h/kT) + e^{-4J/kT}}$ です。'],
        sol: [[`$\\sinh(${n(h)}/${n(T)}) = ${n(sh, 5)}$ and $e^{-4/${n(T)}} = ${n(Math.exp(-4 / T), 5)}$.`, `$\\sinh(${n(h)}/${n(T)}) = ${n(sh, 5)}$、$e^{-4/${n(T)}} = ${n(Math.exp(-4 / T), 5)}$ です。`], [`$m = ${n(sh, 5)}/\\sqrt{${n(sh * sh, 5)} + ${n(Math.exp(-4 / T), 5)}} = ${n(m, 4)}$.`, `$m = ${n(sh, 5)}/\\sqrt{${n(sh * sh, 5)} + ${n(Math.exp(-4 / T), 5)}} = ${n(m, 4)}$ です。`], ['As $h \\to 0$ it goes smoothly to zero at every positive temperature: no spontaneous magnetisation, though at low $T$ a tiny field is enough to align the chain.', '$h \\to 0$ ではどの正の温度でも滑らかに 0 になり、自発磁化はありません。ただし低温ではわずかな磁場で鎖がそろいます。']],
        set: { T, h },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const T = r.step(0.3, 2, 0.05), x = xi(T), shown = Number(x.toPrecision(4)), ans = 1 / atanh(Math.exp(-1 / shown));
        return {
          q: [`The correlation length of an Ising chain at $h = 0$ is measured as $\\xi = ${shown}$ spacings. What is $kT/J$?`, `$h = 0$ のイジング鎖の相関長が $\\xi = ${shown}$ 格子間隔と測定されました。$kT/J$ はいくつですか。`],
          a: { type: 'num', v: ans, rel: 0.005 },
          hint: ['$\\tanh(J/kT) = e^{-1/\\xi}$.', '$\\tanh(J/kT) = e^{-1/\\xi}$ です。'],
          sol: [[`$\\tanh(1/T) = e^{-1/${shown}} = ${n(Math.exp(-1 / shown), 6)}$.`, `$\\tanh(1/T) = e^{-1/${shown}} = ${n(Math.exp(-1 / shown), 6)}$ です。`], [`$T = 1/\\operatorname{artanh}(${n(Math.exp(-1 / shown), 6)}) = ${n(ans, 4)}$. At low $T$, $\\xi \\approx \\tfrac12 e^{2J/kT}$: the correlation length grows exponentially as $T \\to 0$ but only diverges at $T = 0$.`, `$T = 1/\\operatorname{artanh}(${n(Math.exp(-1 / shown), 6)}) = ${n(ans, 4)}$ です。低温では $\\xi \\approx \\tfrac12 e^{2J/kT}$ で、$T \\to 0$ で指数関数的に伸びますが、発散するのは $T = 0$ だけです。`]],
          set: { T, h: 0 },
        };
      }
      if (k === 1) {
        const T = r.step(0.3, 3, 0.05), w = (1 - Math.tanh(1 / T)) / 2;
        return {
          q: [`At $kT = ${n(T)}J$, $h = 0$, what fraction of the bonds of a long Ising chain are domain walls? Give four significant figures.`, `$kT = ${n(T)}J$、$h = 0$ で、長いイジング鎖の結合のうちドメイン壁になっている割合はいくつですか（有効数字4桁）。`],
          a: { type: 'num', v: w, rel: 0.002 },
          hint: ['A bond is a wall when $s_is_{i+1} = -1$; use $\\langle s_is_{i+1}\\rangle = \\tanh(J/kT)$.', '$s_is_{i+1} = -1$ の結合が壁です。$\\langle s_is_{i+1}\\rangle = \\tanh(J/kT)$ を使います。'],
          sol: [['The wall fraction is $(1 - \\langle s_is_{i+1}\\rangle)/2 = (1 - \\tanh(J/kT))/2$.', '壁の割合は $(1 - \\langle s_is_{i+1}\\rangle)/2 = (1 - \\tanh(J/kT))/2$ です。'], [`$= (1 - ${n(Math.tanh(1 / T), 6)})/2 = ${sig(w, 4)}$; at low $T$ it is $\\approx 1/(1 + e^{2J/kT})$, each bond independently broken with Boltzmann weight $e^{-2J/kT}$.`, `$= (1 - ${n(Math.tanh(1 / T), 6)})/2 = ${sig(w, 4)}$ です。低温では $\\approx 1/(1 + e^{2J/kT})$ で、各結合が独立にボルツマン重み $e^{-2J/kT}$ で切れていると考えられます。`], ['The readout\u2019s expected wall count is this fraction times the number of bonds in the ring.', '読み取り欄の壁の期待数は、この割合に輪の結合数を掛けたものです。']],
          set: { T, h: 0 },
        };
      }
      if (k === 2) return {
        q: ['Write the free energy per spin $f(T)$ of the infinite Ising chain at $h = 0$, in units $J = k = 1$.', '$h = 0$ の無限イジング鎖のスピンあたりの自由エネルギー $f(T)$ を、$J = k = 1$ の単位で書いてください。'],
        a: { type: 'expr', v: '-T*ln(2*cosh(1/T))', vars: ['T'], dom: { T: [0.3, 4] }, lhs: ['$f(T) =$', '$f(T) =$'] },
        hint: ['$Z = \\lambda_+^N + \\lambda_-^N \\approx \\lambda_+^N$ for large $N$, and $f = -T\\ln Z/N$.', '$N$ が大きいと $Z = \\lambda_+^N + \\lambda_-^N \\approx \\lambda_+^N$ で、$f = -T\\ln Z/N$ です。'],
        sol: [['At $h = 0$, $\\lambda_+ = 2\\cosh(1/T)$, so $f = -T\\ln(2\\cosh(1/T))$.', '$h = 0$ では $\\lambda_+ = 2\\cosh(1/T)$ なので $f = -T\\ln(2\\cosh(1/T))$ です。'], ['It is analytic for all $T > 0$: no kink, no jump in any derivative, hence no phase transition. Its limits are $-1$ (all bonds satisfied) as $T \\to 0$ and $-T\\ln 2$ (free spins) at high $T$.', 'これはすべての $T > 0$ で解析的で、折れ曲がりもどの導関数の跳びもないので相転移はありません。$T \\to 0$ では $-1$（すべての結合が満たされる）、高温では $-T\\ln 2$（自由なスピン）に近づきます。']],
        set: { h: 0 },
      };
      const T = r.pick([0.4, 0.5, 0.6, 0.7, 0.8, 1, 0.45, 0.55]), Nmin = Math.floor(Math.exp(2 / T)) + 1;
      return {
        q: [`Inserting one domain wall into an open chain of $N$ spins costs $2J$ but can be done in about $N$ places, so $\\Delta F \\approx 2J - kT\\ln N$. At $kT = ${n(T)}J$, what is the smallest $N$ for which $\\Delta F < 0$?`, `$N$ スピンの開いた鎖にドメイン壁を1つ入れるには $2J$ かかりますが、置き場所はおよそ $N$ 通りあるので $\\Delta F \\approx 2J - kT\\ln N$ です。$kT = ${n(T)}J$ で $\\Delta F < 0$ となる最小の $N$ を求めてください。`],
        a: { type: 'int', v: Nmin },
        hint: ['Solve $\\ln N > 2J/kT$.', '$\\ln N > 2J/kT$ を解きます。'],
        sol: [[`We need $N > e^{2/${n(T)}} = ${n(Math.exp(2 / T), 4)}$, so $N = ${Nmin}$.`, `$N > e^{2/${n(T)}} = ${n(Math.exp(2 / T), 4)}$ が必要なので $N = ${Nmin}$ です。`], ['Any longer chain lowers its free energy by breaking into domains, however low the temperature, so a macroscopic chain is always disordered. In two dimensions a wall costs energy in proportion to its length, and this argument fails: there order survives.', 'これより長い鎖は、どんなに低温でもドメインに分かれることで自由エネルギーを下げるので、巨視的な鎖は常に無秩序です。二次元では壁のエネルギーが長さに比例するのでこの議論は成り立たず、秩序が生き残ります。']],
        set: { T: Math.max(0.2, Math.round(T * 20) / 20), h: 0 },
      };
    },
  ];

  // ---------- 3. mean field ----------
  const ZS = [2, 4, 6];
  Q['mean-field'] = [
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const z = r.pick(ZS), lat = { 2: ['the chain', '鎖'], 4: ['the square lattice', '正方格子'], 6: ['the triangular lattice', '三角格子'] }[z];
        return {
          q: [`Mean-field theory for ${lat[0]} ($z = ${z}$ neighbours): at what $kT_c/J$ does it predict ordering?`, `${lat[1]}（隣の数 $z = ${z}$）の平均場理論は、どの $kT_c/J$ で秩序化を予測しますか。`],
          a: { type: 'num', v: z, tol: 1e-6 },
          hint: ['Linearise $m = \\tanh(zJm/kT)$ near $m = 0$: a nonzero solution appears when the slope at the origin exceeds 1.', '$m = \\tanh(zJm/kT)$ を $m = 0$ の近くで線形化します。原点での傾きが1を超えると 0 でない解が現れます。'],
          sol: [[`The slope of $\\tanh(zJm/kT)$ at $m = 0$ is $zJ/kT$, which exceeds 1 when $kT < zJ = ${z}J$.`, `$m = 0$ での $\\tanh(zJm/kT)$ の傾きは $zJ/kT$ で、$kT < zJ = ${z}J$ のとき1を超えます。`], [z === 2 ? 'For the chain the exact answer is no transition at all, so mean field is qualitatively wrong in one dimension.' : z === 4 ? 'The exact square-lattice value is $2.269$: mean field overestimates $T_c$ by $76$ %, because it ignores fluctuations that disorder the spins.' : 'The exact triangular-lattice value is $4/\\ln 3 = 3.641$: still an overestimate, but smaller, since more neighbours make the average a better guide.', z === 2 ? '鎖の厳密解では転移はまったくないので、平均場は一次元では定性的に誤っています。' : z === 4 ? '正方格子の厳密値は $2.269$ で、平均場はスピンを乱す揺らぎを無視するので $T_c$ を $76$ % 過大評価します。' : '三角格子の厳密値は $4/\\ln 3 = 3.641$ です。やはり過大評価ですが、隣が多いほど平均がよい目安になるので差は小さくなります。']],
          set: { z, T: z, h: 0 },
        };
      }
      if (k === 1) {
        const B = r.step(0.2, 3, 0.1), T = r.step(0.5, 4, 0.5);
        return {
          q: [`A single spin $\\pm1$ sits in an effective field $B = ${n(B)}J$ at $kT = ${n(T)}J$. What is its mean value $\\langle s\\rangle$? Give three decimals.`, `1つのスピン $\\pm1$ が有効磁場 $B = ${n(B)}J$ の中に $kT = ${n(T)}J$ で置かれています。平均値 $\\langle s\\rangle$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: Math.tanh(B / T), tol: 6e-4 },
          hint: ['The two states have energies $\\mp B$.', '2つの状態のエネルギーは $\\mp B$ です。'],
          sol: [[`$\\langle s\\rangle = \\dfrac{e^{B/kT} - e^{-B/kT}}{e^{B/kT} + e^{-B/kT}} = \\tanh(${n(B / T, 4)})$.`, `$\\langle s\\rangle = \\dfrac{e^{B/kT} - e^{-B/kT}}{e^{B/kT} + e^{-B/kT}} = \\tanh(${n(B / T, 4)})$ です。`], [`$= ${n(Math.tanh(B / T), 4)}$. Mean field makes $B = zJm + h$ and demands that this output equal the $m$ that went in.`, `$= ${n(Math.tanh(B / T), 4)}$ です。平均場では $B = zJm + h$ とおき、この出力が入力の $m$ に等しいことを要求します。`]],
        };
      }
      return {
        q: ['Mean-field theory predicts a phase transition for the Ising chain, which has none. What does the approximation leave out?', '平均場理論は、転移のないイジング鎖にも相転移を予測します。この近似は何を無視していますか。'],
        a: { type: 'choice', opts: [['Fluctuations: correlated flips of neighbouring spins, such as domain walls', '揺らぎ、つまりドメイン壁のような隣り合うスピンの相関した反転'], ['The external field $h$', '外部磁場 $h$'], ['The energy of each bond', '各結合のエネルギー'], ['The temperature dependence of $J$', '$J$ の温度依存性']], v: 0 },
        hint: ['Replacing each neighbour by the average $m$ treats the neighbours as independent of the spin they surround.', '各隣を平均 $m$ で置き換えると、隣のスピンが囲まれるスピンと独立であるかのように扱うことになります。'],
        sol: [['In reality a spin\u2019s neighbours are correlated with it and with each other; in one dimension cheap domain walls destroy order at any $T > 0$.', '実際には隣のスピンはそのスピンとも互いとも相関しており、一次元では安価なドメイン壁がどんな $T > 0$ でも秩序を壊します。'], ['Mean field ignores these fluctuations, so it always finds order below $zJ/k$. It improves as $z$ grows, and becomes exact in high enough dimension.', '平均場はこの揺らぎを無視するので、$zJ/k$ より下では必ず秩序を見いだします。$z$ が大きいほど良くなり、十分高い次元では厳密になります。']],
        set: { z: 2, T: 1.5, h: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const z = r.pick(ZS), T = r.step(0.3 * z, 0.95 * z, 0.05), m = mf(z, T);
        return {
          q: [`Solve the mean-field equation $m = \\tanh(zm/T)$ for its positive root with $z = ${z}$ and $T = ${n(T)}$ ($J = k = 1$, $h = 0$). Give three decimals.`, `$z = ${z}$、$T = ${n(T)}$（$J = k = 1$、$h = 0$）で平均場の方程式 $m = \\tanh(zm/T)$ の正の解を小数第3位まで求めてください。`],
          a: { type: 'num', v: m, tol: 6e-4 },
          hint: ['Iterate $m \\leftarrow \\tanh(zm/T)$ starting from $m = 1$; below $T_c = z$ it converges to the ordered root.', '$m = 1$ から $m \\leftarrow \\tanh(zm/T)$ を繰り返します。$T_c = z$ より下では秩序解に収束します。'],
          sol: [[`Iterating from $m = 1$: $\\tanh(${n(z / T, 4)}) = ${n(Math.tanh(z / T), 4)}$, then $\\tanh(${n(z / T, 4)}\\times ${n(Math.tanh(z / T), 4)}) = ${n(Math.tanh(z / T * Math.tanh(z / T)), 4)}$, and so on.`, `$m = 1$ から繰り返すと $\\tanh(${n(z / T, 4)}) = ${n(Math.tanh(z / T), 4)}$、次に $\\tanh(${n(z / T, 4)}\\times ${n(Math.tanh(z / T), 4)}) = ${n(Math.tanh(z / T * Math.tanh(z / T)), 4)}$ と続きます。`], [`It settles at $m = ${n(m, 4)}$: where the line $y = m$ meets the tanh curve on the right in the left panel.`, `$m = ${n(m, 4)}$ に落ち着きます。左図で直線 $y = m$ と tanh 曲線が右側で交わる点です。`]],
          set: { z, T, h: 0 },
        };
      }
      if (k === 1) {
        const z = r.pick(ZS), T = r.step(0.8 * z, 0.98 * z, 0.05), ap = Math.sqrt(3 * (1 - T / z)), ex = mf(z, T);
        return {
          q: [`Near $T_c$, mean field gives $m \\approx \\sqrt{3(1 - T/T_c)}$. Use it for $z = ${z}$ at $T = ${n(T)}$. Give three decimals.`, `$T_c$ の近くで平均場は $m \\approx \\sqrt{3(1 - T/T_c)}$ を与えます。$z = ${z}$、$T = ${n(T)}$ で使ってください（小数第3位まで）。`],
          a: { type: 'num', v: ap, tol: 6e-4 },
          hint: ['Expand $\\tanh x \\approx x - x^3/3$ in the mean-field equation; $T_c = z$.', '平均場の方程式で $\\tanh x \\approx x - x^3/3$ と展開します。$T_c = z$ です。'],
          sol: [[`$1 - T/T_c = 1 - ${n(T)}/${z} = ${n(1 - T / z, 4)}$.`, `$1 - T/T_c = 1 - ${n(T)}/${z} = ${n(1 - T / z, 4)}$ です。`], [`$m \\approx \\sqrt{3\\times ${n(1 - T / z, 4)}} = ${n(ap, 4)}$; the full solution is $${n(ex, 4)}$, so the approximation is ${Math.abs(ap - ex) < 0.02 ? 'already good' : 'only rough this far from $T_c$'}. The square root is the mean-field exponent $\\beta = 1/2$.`, `$m \\approx \\sqrt{3\\times ${n(1 - T / z, 4)}} = ${n(ap, 4)}$ です。方程式の解は $${n(ex, 4)}$ なので、近似は${Math.abs(ap - ex) < 0.02 ? 'すでに良好です' : '$T_c$ からこれだけ離れると粗くなります'}。平方根が平均場の指数 $\\beta = 1/2$ です。`]],
          set: { z, T, h: 0 },
        };
      }
      const z = r.pick([2, 4]), T = r.step(z + 0.5, 6, 0.05);
      return {
        q: [`Above the mean-field $T_c$, the susceptibility is $\\chi = 1/(k(T - T_c))$. Find $\\chi J$ for $z = ${z}$ at $kT = ${n(T)}J$.`, `平均場の $T_c$ より上では帯磁率は $\\chi = 1/(k(T - T_c))$ です。$z = ${z}$、$kT = ${n(T)}J$ で $\\chi J$ を求めてください。`],
        a: { type: 'num', v: 1 / (T - z), rel: 0.005 },
        hint: ['Linearise $m = \\tanh((zm + h)/T)$ in both $m$ and $h$.', '$m = \\tanh((zm + h)/T)$ を $m$ と $h$ の両方について線形化します。'],
        sol: [['For small $m$ and $h$, $m = (zm + h)/T$, so $m = h/(T - z)$ and $\\chi = \\partial m/\\partial h = 1/(T - z)$.', '$m$ と $h$ が小さいとき $m = (zm + h)/T$ なので $m = h/(T - z)$、$\\chi = \\partial m/\\partial h = 1/(T - z)$ です。'], [`$\\chi = 1/(${n(T)} - ${z}) = ${n(1 / (T - z), 4)}$: the Curie\u2013Weiss law, which diverges as $T \\to T_c$ from above.`, `$\\chi = 1/(${n(T)} - ${z}) = ${n(1 / (T - z), 4)}$ です。これがキュリー・ワイスの法則で、上から $T \\to T_c$ とすると発散します。`]],
        set: { z, T, h: 0 },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const z = r.pick(ZS), T = r.step(0.4 * z, 0.95 * z, 0.05), m = Number(mf(z, T).toFixed(4)), ans = z * m / atanh(m);
        return {
          q: [`In mean field with $z = ${z}$ and $h = 0$, at what temperature is the spontaneous magnetisation $m = ${m}$?`, `$z = ${z}$、$h = 0$ の平均場で、自発磁化が $m = ${m}$ になる温度はいくつですか。`],
          a: { type: 'num', v: ans, rel: 0.003 },
          hint: ['Do not iterate: solve $m = \\tanh(zm/T)$ for $T$ directly.', '反復は不要です。$m = \\tanh(zm/T)$ を $T$ について直接解いてください。'],
          sol: [['$\\operatorname{artanh} m = zm/T$, so $T = zm/\\operatorname{artanh} m$.', '$\\operatorname{artanh} m = zm/T$ なので $T = zm/\\operatorname{artanh} m$ です。'], [`$T = ${z}\\times ${m}/${n(atanh(m), 5)} = ${n(ans, 4)}$, that is $${n(ans / z, 3)}\\,T_c$.`, `$T = ${z}\\times ${m}/${n(atanh(m), 5)} = ${n(ans, 4)}$、すなわち $${n(ans / z, 3)}\\,T_c$ です。`], ['Inverting is easier than solving: every point of the mean-field curve $m(T)$ comes from this one formula.', '解くより逆に求めるほうが簡単で、平均場の曲線 $m(T)$ のすべての点はこの1つの式から得られます。']],
          set: { z, T, h: 0 },
        };
      }
      if (k === 1) {
        const z = r.pick([4, 6]), h = r.step(0.02, 0.1, 0.02), ap = Math.cbrt(3 * h / z);
        return {
          q: [`Exactly at the mean-field $T_c = z$ ($z = ${z}$), a small field $h = ${n(h)}$ is applied. To leading order, what magnetisation results? Give three decimals.`, `平均場の $T_c = z$（$z = ${z}$）ちょうどで、小さな磁場 $h = ${n(h)}$ をかけます。最低次でどれだけの磁化が生じますか（小数第3位まで）。`],
          a: { type: 'num', v: ap, tol: 6e-4 },
          hint: ['At $T = T_c$ the linear terms cancel, so keep the cubic term of $\\tanh$.', '$T = T_c$ では一次の項が打ち消し合うので、$\\tanh$ の三次の項を残します。'],
          sol: [['With $T = z$: $m = \\tanh(m + h/z) \\approx m + h/z - m^3/3$ to leading order.', '$T = z$ では最低次で $m = \\tanh(m + h/z) \\approx m + h/z - m^3/3$ です。'], [`So $m^3 = 3h/z$ and $m = (3\\times ${n(h)}/${z})^{1/3} = ${n(ap, 4)}$.`, `よって $m^3 = 3h/z$、$m = (3\\times ${n(h)}/${z})^{1/3} = ${n(ap, 4)}$ です。`], ['The response $m \\propto h^{1/3}$ (exponent $\\delta = 3$) is far stronger than linear: at the critical point the system is infinitely susceptible.', '応答 $m \\propto h^{1/3}$（指数 $\\delta = 3$）は線形よりはるかに強く、臨界点で系は無限に感受性が高くなります。']],
          set: { z, T: z, h },
        };
      }
      if (k === 2) {
        const z = r.pick(ZS);
        return {
          q: [`Write the leading behaviour of the mean-field magnetisation $m(T)$ just below $T_c$ for $z = ${z}$ ($J = k = 1$).`, `$z = ${z}$（$J = k = 1$）の平均場の磁化 $m(T)$ の、$T_c$ のすぐ下での主要な振る舞いを式で書いてください。`],
          a: { type: 'expr', v: `sqrt(3*(1-T/${z}))`, vars: ['T'], dom: { T: [0.5 * z, 0.99 * z] }, lhs: ['$m(T) \\approx$', '$m(T) \\approx$'] },
          hint: ['Expand $\\tanh x = x - x^3/3$ and divide out the trivial root $m = 0$.', '$\\tanh x = x - x^3/3$ と展開し、自明な解 $m = 0$ で割ります。'],
          sol: [[`$m = \\dfrac{${z}m}{T} - \\dfrac13\\left(\\dfrac{${z}m}{T}\\right)^3$; dividing by $m$ and using $T \\approx ${z}$ in the cubic term gives $m^2 = 3(1 - T/${z})$.`, `$m = \\dfrac{${z}m}{T} - \\dfrac13\\left(\\dfrac{${z}m}{T}\\right)^3$ を $m$ で割り、三次の項で $T \\approx ${z}$ とすると $m^2 = 3(1 - T/${z})$ です。`], [`$m \\approx \\sqrt{3(1 - T/${z})}$: exponent $1/2$, against the exact $1/8$ in two dimensions.`, `$m \\approx \\sqrt{3(1 - T/${z})}$ で、指数は $1/2$ です。二次元の厳密な値は $1/8$ です。`]],
          set: { z, h: 0 },
        };
      }
      return {
        q: ['Mean field and the exact solution both give $m \\propto (T_c - T)^{\\beta}$ for the square lattice. If $T_c - T$ is divided by 16, by what factor does $m$ fall in each?', '正方格子では平均場も厳密解も $m \\propto (T_c - T)^{\\beta}$ を与えます。$T_c - T$ を16分の1にすると、それぞれ $m$ は何分の1になりますか。'],
        a: { type: 'choice', opts: [['Mean field: 4; exact: $\\sqrt2 \\approx 1.41$', '平均場：4、厳密解：$\\sqrt2 \\approx 1.41$'], ['Mean field: 4; exact: 2', '平均場：4、厳密解：2'], ['Mean field: 16; exact: 16', '平均場：16、厳密解：16'], ['Mean field: 2; exact: 4', '平均場：2、厳密解：4']], v: 0 },
        hint: ['$\\beta = 1/2$ in mean field and $1/8$ exactly.', '平均場では $\\beta = 1/2$、厳密には $1/8$ です。'],
        sol: [['Mean field: $16^{1/2} = 4$. Exact: $16^{1/8} = 2^{1/2} \\approx 1.41$.', '平均場：$16^{1/2} = 4$。厳密解：$16^{1/8} = 2^{1/2} \\approx 1.41$ です。'], ['The real magnetisation clings to large values much closer to $T_c$, then collapses: compare the curves in the right panel.', '実際の磁化は $T_c$ のずっと近くまで大きな値を保ち、そこで急に崩れます。右図の曲線を比べてください。']],
        set: { z: 4, h: 0 },
      };
    },
  ];
})();
