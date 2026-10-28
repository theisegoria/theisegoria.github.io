'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;

  // silicon, as in the figures: energies in eV, densities in cm^-3
  const KB = 8.617333262e-5, QE = 1.602176634e-19, EPS = 11.7 * 8.8541878128e-14;
  const Eg = (T) => 1.17 - 4.73e-4 * T * T / (T + 636);
  const Nc = (T) => 2.86e19 * Math.pow(T / 300, 1.5), Nv = (T) => 3.10e19 * Math.pow(T / 300, 1.5);
  const ni = (T) => Math.sqrt(Nc(T) * Nv(T)) * Math.exp(-Eg(T) / (2 * KB * T));
  const NI = ni(300), VT = KB * 300;
  const e10 = (x) => sig(x, 3);
  const dop = (r) => r.pick([13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18]);
  const pow10 = (e) => (Number.isInteger(e) ? `10^{${e}}` : `${n(10 ** (e - Math.floor(e)), 3)} \\times 10^{${Math.floor(e)}}`);

  /* ---------- 1. carrier statistics ---------- */
  Q['carrier-statistics'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const e = dop(r), N = 10 ** e, pType = r.chance(0.4);
        const minority = NI * NI / N;
        return {
          q: [`Silicon at 300 K ($n_i = ${e10(NI)}\\ \\text{cm}^{-3}$) is doped with $${pow10(e)}\\ \\text{cm}^{-3}$ ${pType ? 'boron' : 'phosphorus'}, all ionised. What is the ${pType ? 'electron' : 'hole'} density?`, `300 K のシリコン（$n_i = ${e10(NI)}\\ \\text{cm}^{-3}$）に${pType ? 'ホウ素' : 'リン'}を $${pow10(e)}\\ \\text{cm}^{-3}$ ドープし、すべて電離しているとします。${pType ? '電子' : '正孔'}の密度はいくらですか。`],
          a: { type: 'num', v: minority, rel: 0.01, unit: ['cm⁻³', 'cm⁻³'] },
          hint: ['The product $np = n_i^2$ does not depend on doping.', '積 $np = n_i^2$ はドーピングによりません。'],
          sol: [[`The majority density is the doping: ${pType ? '$p' : '$n'} \\approx ${pow10(e)}$.`, `多数キャリアの密度はドーピング量で ${pType ? '$p' : '$n'} \\approx ${pow10(e)}$ です。`], [`${pType ? '$n' : '$p'} = n_i^2/${pow10(e)} = ${e10(minority)}\\ \\text{cm}^{-3}$.`, `${pType ? '$n' : '$p'} = n_i^2/${pow10(e)} = ${e10(minority)}\\ \\text{cm}^{-3}$ です。`], ['Doping raises one carrier and suppresses the other by the same factor: the minority carriers are what a diode\'s reverse current is made of.', 'ドーピングは一方のキャリアを増やし、他方を同じ割合だけ減らします。ダイオードの逆方向電流をつくるのはこの少数キャリアです。']],
          set: { type: pType ? 1 : 0, ldop: e, T: 300 },
        };
      }
      if (form === 1) {
        const d = r.pick([['phosphorus', 'リン', 0], ['arsenic', 'ヒ素', 0], ['antimony', 'アンチモン', 0], ['boron', 'ホウ素', 1], ['gallium', 'ガリウム', 1], ['aluminium', 'アルミニウム', 1]]);
        return {
          q: [`Silicon doped with ${d[0]} is which type?`, `${d[1]}をドープしたシリコンはどちらの型ですか。`],
          a: { type: 'choice', opts: [['n-type: the dopant donates an electron', 'n 型：ドーパントが電子を与える'], ['p-type: the dopant accepts an electron, leaving a hole', 'p 型：ドーパントが電子を受け取り、正孔を残す']], v: d[2], fixed: true },
          hint: ['Silicon is in group 14. Count the dopant\'s valence electrons.', 'シリコンは 14 族です。ドーパントの価電子を数えてください。'],
          sol: [[d[2] ? `${d[0][0].toUpperCase() + d[0].slice(1)} is in group 13: three valence electrons, one short of the four bonds.` : `${d[0][0].toUpperCase() + d[0].slice(1)} is in group 15: five valence electrons, one more than the four bonds need.`, d[2] ? `${d[1]}は 13 族で価電子は 3 個、四つの結合には 1 個足りません。` : `${d[1]}は 15 族で価電子は 5 個、四つの結合に必要な数より 1 個多くなります。`], [d[2] ? 'It grabs an electron from a neighbouring bond, leaving a mobile hole: p-type.' : 'The spare electron is bound by only about 45 meV and is freed at room temperature: n-type.', d[2] ? '隣の結合から電子を奪い、動ける正孔を残すので p 型です。' : '余分な電子は約 45 meV でしか束縛されず、室温で自由になるので n 型です。']],
          set: { type: d[2] },
        };
      }
      const T = r.pick([77, 150, 250, 300, 400, 500, 600, 800]);
      return {
        q: [`What is the thermal energy $kT$ at $${T}$ K, in meV?`, `$${T}$ K での熱エネルギー $kT$ は何 meV ですか。`],
        a: { type: 'num', v: KB * T * 1000, rel: 0.003, unit: ['meV', 'meV'] },
        sol: [[`$kT = 8.617 \\times 10^{-5} \\times ${T} = ${n(KB * T * 1000, 4)}$ meV.`, `$kT = 8.617 \\times 10^{-5} \\times ${T} = ${n(KB * T * 1000, 4)}$ meV です。`], [`The gap is ${n(Eg(T) / (KB * T), 3)} times larger, which is why intrinsic carriers are so rare: they need $e^{-E_g/2kT} \\approx ${e10(Math.exp(-Eg(T) / (2 * KB * T)))}$.`, `ギャップはその ${n(Eg(T) / (KB * T), 3)} 倍もあるので、真性キャリアはごくわずかです。$e^{-E_g/2kT} \\approx ${e10(Math.exp(-Eg(T) / (2 * KB * T)))}$ 程度になります。`]],
        set: T >= 20 && T <= 800 && T % 5 === 0 ? { T } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0 || form === 1) {
        const pType = form === 1, e = dop(r), N = 10 ** e;
        const d = KB * 300 * Math.log((pType ? Nv(300) : Nc(300)) / N);
        return {
          q: [pType ? `Silicon at 300 K with $${pow10(e)}\\ \\text{cm}^{-3}$ boron, fully ionised: how far above the valence band edge is the Fermi level? ($N_v = 3.10 \\times 10^{19}\\ \\text{cm}^{-3}$.)` : `Silicon at 300 K with $${pow10(e)}\\ \\text{cm}^{-3}$ phosphorus, fully ionised: how far below the conduction band edge is the Fermi level? ($N_c = 2.86 \\times 10^{19}\\ \\text{cm}^{-3}$.)`, pType ? `ホウ素 $${pow10(e)}\\ \\text{cm}^{-3}$ をドープして完全に電離した 300 K のシリコンで、フェルミ準位は価電子帯の端からどれだけ上にありますか（$N_v = 3.10 \\times 10^{19}\\ \\text{cm}^{-3}$）。` : `リン $${pow10(e)}\\ \\text{cm}^{-3}$ をドープして完全に電離した 300 K のシリコンで、フェルミ準位は伝導帯の端からどれだけ下にありますか（$N_c = 2.86 \\times 10^{19}\\ \\text{cm}^{-3}$）。`],
          a: { type: 'num', v: d, tol: 0.002, unit: ['eV', 'eV'] },
          hint: [pType ? 'Invert $p = N_v e^{-(E_F - E_v)/kT}$.' : 'Invert $n = N_c e^{-(E_c - E_F)/kT}$.', pType ? '$p = N_v e^{-(E_F - E_v)/kT}$ を逆に解いてください。' : '$n = N_c e^{-(E_c - E_F)/kT}$ を逆に解いてください。'],
          sol: [[`${pType ? '$E_F - E_v' : '$E_c - E_F'} = kT\\ln(${pType ? 'N_v/p' : 'N_c/n'}) = 0.02585 \\times \\ln(${e10((pType ? Nv(300) : Nc(300)) / N)})$.`, `${pType ? '$E_F - E_v' : '$E_c - E_F'} = kT\\ln(${pType ? 'N_v/p' : 'N_c/n'}) = 0.02585 \\times \\ln(${e10((pType ? Nv(300) : Nc(300)) / N)})$ です。`], [`$= ${n(d, 4)}$ eV.`, `$= ${n(d, 4)}$ eV です。`], [`Each tenfold increase in doping moves $E_F$ by $kT\\ln 10 = 59.5$ meV towards the band edge${e >= 18 ? '; at this doping the Boltzmann approximation is getting shaky, since $E_F$ is within a few $kT$ of the band' : ''}.`, `ドーピングが 10 倍になるごとに $E_F$ はバンド端に向かって $kT\\ln 10 = 59.5$ meV 動きます${e >= 18 ? '。このドーピングでは $E_F$ がバンドから数 $kT$ 以内にあり、ボルツマン近似が怪しくなります' : ''}。`]],
          set: { type: pType ? 1 : 0, ldop: e, T: 300 },
        };
      }
      const T = r.pick([250, 300, 350, 400, 450, 500]), g = Eg(T), v = ni(T);
      return {
        q: [`At $${T}$ K silicon has $E_g = ${n(g, 4)}$ eV, $N_c = ${e10(Nc(T))}$ and $N_v = ${e10(Nv(T))}\\ \\text{cm}^{-3}$. Find the intrinsic density $n_i$.`, `$${T}$ K のシリコンは $E_g = ${n(g, 4)}$ eV、$N_c = ${e10(Nc(T))}$、$N_v = ${e10(Nv(T))}\\ \\text{cm}^{-3}$ です。真性キャリア密度 $n_i$ を求めてください。`],
        a: { type: 'num', v, rel: 0.01, unit: ['cm⁻³', 'cm⁻³'] },
        hint: ['$n_i = \\sqrt{N_cN_v}\\,e^{-E_g/2kT}$.', '$n_i = \\sqrt{N_cN_v}\\,e^{-E_g/2kT}$ です。'],
        sol: [[`$\\sqrt{N_cN_v} = ${e10(Math.sqrt(Nc(T) * Nv(T)))}$ and $E_g/2kT = ${n(g / (2 * KB * T), 4)}$.`, `$\\sqrt{N_cN_v} = ${e10(Math.sqrt(Nc(T) * Nv(T)))}$、$E_g/2kT = ${n(g / (2 * KB * T), 4)}$ です。`], [`$n_i = ${e10(Math.sqrt(Nc(T) * Nv(T)))} \\times e^{-${n(g / (2 * KB * T), 3)}} = ${e10(v)}\\ \\text{cm}^{-3}$.`, `$n_i = ${e10(Math.sqrt(Nc(T) * Nv(T)))} \\times e^{-${n(g / (2 * KB * T), 3)}} = ${e10(v)}\\ \\text{cm}^{-3}$ です。`], ['Out of about $5 \\times 10^{22}$ silicon atoms per cm³: intrinsic silicon is a very poor conductor, and the exponential makes $n_i$ climb steeply with temperature.', 'シリコン原子は 1 cm³ あたり約 $5 \\times 10^{22}$ 個あるので、真性シリコンは非常に悪い導体です。指数関数のために $n_i$ は温度とともに急に増えます。']],
        set: { T },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const e = r.pick([13, 14, 15, 16, 17]), N = 10 ** e;
        let lo = 200, hi = 2000; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (ni(m) < N) lo = m; else hi = m; }
        const Ti = (lo + hi) / 2, Ts = Math.round(Ti / 5) * 5;
        return {
          q: [`At what temperature does the intrinsic density of silicon reach $${pow10(e)}\\ \\text{cm}^{-3}$, so that a sample doped at that level stops behaving as doped? Use the lab's $n_i(T)$, with $N_{c,v} \\propto T^{3/2}$ and $E_g(T) = 1.17 - \\dfrac{4.73\\times10^{-4}T^2}{T + 636}$ eV. Give kelvin to the nearest 5.`, `シリコンの真性キャリア密度が $${pow10(e)}\\ \\text{cm}^{-3}$ に達し、その量をドープした試料がドープされた半導体としてふるまわなくなる温度は何 K ですか。この実験の $n_i(T)$（$N_{c,v} \\propto T^{3/2}$、$E_g(T) = 1.17 - \\dfrac{4.73\\times10^{-4}T^2}{T + 636}$ eV）を使い、5 K 単位で答えてください。`],
          a: { type: 'num', v: Ti, tol: 3, unit: ['K', 'K'] },
          hint: ['Solve $n_i(T) = N_D$ numerically: the exponential dominates, so try values and bisect.', '$n_i(T) = N_D$ を数値的に解いてください。指数関数が支配的なので、値を試して二分法で絞り込みます。'],
          sol: [[`$n_i(${Ts - 50}) = ${e10(ni(Ts - 50))}$ and $n_i(${Ts + 50}) = ${e10(ni(Ts + 50))}$ bracket the target.`, `$n_i(${Ts - 50}) = ${e10(ni(Ts - 50))}$ と $n_i(${Ts + 50}) = ${e10(ni(Ts + 50))}$ が目標をはさみます。`], [`Bisecting gives $T \\approx ${n(Ti, 4)}$ K.`, `二分法で $T \\approx ${n(Ti, 4)}$ K を得ます。`], [`${Ti > 600 ? 'Heavily doped silicon stays extrinsic far above room temperature, which is why silicon chips tolerate heat.' : 'Lightly doped silicon turns intrinsic not far above room temperature: power devices that must run hot use wider-gap materials.'}`, `${Ti > 600 ? '高濃度にドープしたシリコンは室温よりはるかに高い温度まで外因性のままで、シリコンのチップが熱に強いのはこのためです。' : '低濃度ドープのシリコンは室温より少し高い温度で真性になります。高温で動かすパワー素子にギャップの広い材料が使われるのはこのためです。'}`]],
          set: Ts <= 800 ? { type: 0, ldop: e, T: Ts } : { type: 0, ldop: e, T: 800 },
        };
      }
      if (form === 1) {
        const T = r.pick([500, 550, 600, 650, 700]), e = r.pick([14, 14.5, 15, 15.5, 16]), N = 10 ** e, v = ni(T);
        const nn = N / 2 + Math.sqrt(N * N / 4 + v * v);
        return {
          q: [`At $${T}$ K silicon has $n_i = ${e10(v)}\\ \\text{cm}^{-3}$. With $N_D = ${pow10(e)}\\ \\text{cm}^{-3}$ donors, all ionised, what is the electron density?`, `$${T}$ K のシリコンは $n_i = ${e10(v)}\\ \\text{cm}^{-3}$ です。ドナー $N_D = ${pow10(e)}\\ \\text{cm}^{-3}$ がすべて電離しているとき、電子密度はいくらですか。`],
          a: { type: 'num', v: nn, rel: 0.01, unit: ['cm⁻³', 'cm⁻³'] },
          hint: ['Combine $n = p + N_D$ with $np = n_i^2$: a quadratic in $n$.', '$n = p + N_D$ と $np = n_i^2$ を組み合わせると $n$ の二次方程式になります。'],
          sol: [['$n^2 - N_Dn - n_i^2 = 0$, so $n = \\tfrac12N_D + \\sqrt{\\tfrac14N_D^2 + n_i^2}$.', '$n^2 - N_Dn - n_i^2 = 0$ なので $n = \\tfrac12N_D + \\sqrt{\\tfrac14N_D^2 + n_i^2}$ です。'], [`$n = ${e10(N / 2)} + ${e10(Math.sqrt(N * N / 4 + v * v))} = ${e10(nn)}\\ \\text{cm}^{-3}$.`, `$n = ${e10(N / 2)} + ${e10(Math.sqrt(N * N / 4 + v * v))} = ${e10(nn)}\\ \\text{cm}^{-3}$ です。`], [v > N ? 'Above $N_D$: thermally generated pairs swamp the doping, and the sample is effectively intrinsic.' : `${n(nn / N, 3)} times the doping: the intrinsic pairs are starting to matter.`, v > N ? '$N_D$ を上回り、熱で生じた対がドーピングを圧倒しています。試料は実質的に真性です。' : `ドーピングの ${n(nn / N, 3)} 倍で、真性の対が効き始めています。`]],
          set: { type: 0, ldop: e, T },
        };
      }
      return {
        q: ['A donor-doped sample has all donors ionised. Write $n/N_D$ as a function of $r = n_i/N_D$.', 'ドナーをドープした試料で、ドナーはすべて電離しています。$n/N_D$ を $r = n_i/N_D$ の式で表してください。'],
        a: { type: 'expr', v: '1/2+sqrt(1/4+r^2)', vars: ['r'], dom: { r: [0.02, 3] }, lhs: ['$n/N_D =$', '$n/N_D =$'] },
        hint: ['Neutrality $n = p + N_D$ and $np = n_i^2$; divide through by $N_D^2$.', '中性条件 $n = p + N_D$ と $np = n_i^2$ を使い、$N_D^2$ で割ってください。'],
        sol: [['With $x = n/N_D$: $x^2 - x - r^2 = 0$.', '$x = n/N_D$ とおくと $x^2 - x - r^2 = 0$ です。'], ['$x = \\tfrac12 + \\sqrt{\\tfrac14 + r^2}$ (the positive root).', '正の根をとって $x = \\tfrac12 + \\sqrt{\\tfrac14 + r^2}$ です。'], ['For $r \\ll 1$ this is 1 (extrinsic: $n = N_D$); for $r \\gg 1$ it is about $r$ (intrinsic: $n = n_i$). The crossover at $r \\approx 1$ is the plateau\'s end in the figure.', '$r \\ll 1$ では 1（外因性、$n = N_D$）、$r \\gg 1$ ではほぼ $r$（真性、$n = n_i$）です。$r \\approx 1$ での移り変わりが、図の平坦部の終わりです。']],
      };
    },
  ];

  /* ---------- 2. the p-n junction ---------- */
  const junction = (Na, Nd, V) => {
    const Vbi = VT * Math.log(Na * Nd / (NI * NI)), Vj = Math.max(Vbi - V, 1e-4);
    const W = Math.sqrt(2 * EPS * Vj / QE * (1 / Na + 1 / Nd)), xn = W * Na / (Na + Nd), xp = W * Nd / (Na + Nd);
    return { Vbi, Vj, W, xn, xp, Emax: QE * Nd * xn / EPS, C: EPS / W };
  };
  const pickNN = (r) => [r.pick([15, 15.5, 16, 16.5, 17, 17.5, 18]), r.pick([14, 14.5, 15, 15.5, 16, 16.5, 17])];
  const um = (cm) => cm * 1e4;
  Q['pn-junction'] = [
    (r) => {
      const form = r.int(0, 2);
      const [la, ld] = pickNN(r), Na = 10 ** la, Nd = 10 ** ld, J = junction(Na, Nd, 0);
      if (form === 0) {
        return {
          q: [`A silicon junction at 300 K has $N_A = ${pow10(la)}$ and $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$. With $n_i = ${e10(NI)}\\ \\text{cm}^{-3}$ and $kT/q = 25.85$ mV, find the built-in voltage.`, `300 K のシリコンの接合で $N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ です。$n_i = ${e10(NI)}\\ \\text{cm}^{-3}$、$kT/q = 25.85$ mV として、内蔵電位を求めてください。`],
          a: { type: 'num', v: J.Vbi, tol: 0.002, unit: ['V', 'V'] },
          hint: ['$V_{bi} = \\dfrac{kT}{q}\\ln\\dfrac{N_AN_D}{n_i^2}$.', '$V_{bi} = \\dfrac{kT}{q}\\ln\\dfrac{N_AN_D}{n_i^2}$ です。'],
          sol: [[`$N_AN_D/n_i^2 = ${e10(Na * Nd / NI / NI)}$, whose logarithm is $${n(Math.log(Na * Nd / NI / NI), 4)}$.`, `$N_AN_D/n_i^2 = ${e10(Na * Nd / NI / NI)}$ で、その対数は $${n(Math.log(Na * Nd / NI / NI), 4)}$ です。`], [`$V_{bi} = 0.02585 \\times ${n(Math.log(Na * Nd / NI / NI), 4)} = ${n(J.Vbi, 4)}$ V.`, `$V_{bi} = 0.02585 \\times ${n(Math.log(Na * Nd / NI / NI), 4)} = ${n(J.Vbi, 4)}$ V です。`], ['It is the difference between the two sides\' Fermi levels before contact; a voltmeter cannot measure it, because contact potentials cancel it out.', 'これは接触前の両側のフェルミ準位の差です。接触電位が打ち消すので、電圧計では測れません。']],
          set: { lna: la, lnd: ld, V: 0 },
        };
      }
      if (form === 1) {
        const xn = r.pick([0.05, 0.1, 0.2, 0.3, 0.5]);
        return {
          q: [`In a junction with $N_A = ${pow10(la)}$ and $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ the depletion region reaches $x_n = ${xn}\\ \\mu\\text{m}$ into the n side. How far does it reach into the p side?`, `$N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ の接合で、空乏層は n 側に $x_n = ${xn}\\ \\mu\\text{m}$ 広がっています。p 側にはどれだけ広がっていますか。`],
          a: { type: 'num', v: xn * Nd / Na, rel: 0.005, unit: ['μm', 'μm'] },
          hint: ['The total charge on the two sides must cancel.', '両側の全電荷は打ち消し合わなければなりません。'],
          sol: [['$N_Ax_p = N_Dx_n$: the negative charge of the ionised acceptors balances the positive charge of the ionised donors.', '$N_Ax_p = N_Dx_n$ です。電離したアクセプターの負電荷が、電離したドナーの正電荷とつり合います。'], [`$x_p = ${xn} \\times ${e10(Nd / Na)} = ${n(xn * Nd / Na, 4)}\\ \\mu\\text{m}$.`, `$x_p = ${xn} \\times ${e10(Nd / Na)} = ${n(xn * Nd / Na, 4)}\\ \\mu\\text{m}$ です。`], ['The depletion region extends furthest into the more lightly doped side.', '空乏層はドーピングの薄い側に最も深く広がります。']],
          set: { lna: la, lnd: ld },
        };
      }
      const opts = [['At the metallurgical junction $x = 0$', '冶金学的接合 $x = 0$'], ['At the edge of the depletion region on the lightly doped side', '低濃度側の空乏層の端'], ['Uniform across the depletion region', '空乏層全体で一様'], ['Outside the depletion region, in the neutral bulk', '空乏層の外の中性領域']];
      return {
        q: [`In the depletion approximation, where is the electric field of a p-n junction strongest?`, `空乏近似で、p-n 接合の電場が最も強いのはどこですか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Gauss\'s law: the field grows linearly through each slab of fixed charge.', 'ガウスの法則により、一定の電荷の層の中では電場は直線的に増えます。'],
        sol: [['The field starts at zero at $x = -x_p$, rises linearly through the negative acceptor charge, and falls linearly through the positive donor charge back to zero at $x_n$.', '電場は $x = -x_p$ で 0 から始まり、負のアクセプター電荷の中で直線的に増え、正のドナー電荷の中で直線的に減って $x_n$ で 0 に戻ります。'], ['So the triangle peaks at $x = 0$, where all the charge on one side is enclosed: $\\mathcal E_{\\max} = qN_Dx_n/\\varepsilon$. Breakdown starts there.', 'よって三角形は片側の電荷をすべて囲む $x = 0$ で最大となり、$\\mathcal E_{\\max} = qN_Dx_n/\\varepsilon$ です。降伏はここから始まります。']],
        set: { lna: la, lnd: ld },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const [la, ld] = pickNN(r), Na = 10 ** la, Nd = 10 ** ld, V = r.pick([0, 0, -1, -2, -3, 0.3, -0.5]), J = junction(Na, Nd, V);
      if (form === 0) {
        return {
          q: [`Silicon junction ($\\varepsilon = 11.7\\varepsilon_0$), $N_A = ${pow10(la)}$, $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$, $V_{bi} = ${n(J.Vbi, 4)}$ V, bias $V = ${V}$ V. How wide is the depletion region, in μm?`, `シリコンの接合（$\\varepsilon = 11.7\\varepsilon_0$）で $N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$、$V_{bi} = ${n(J.Vbi, 4)}$ V、バイアス $V = ${V}$ V です。空乏層の幅は何 μm ですか。`],
          a: { type: 'num', v: um(J.W), rel: 0.01, unit: ['μm', 'μm'] },
          hint: ['$W = \\sqrt{\\dfrac{2\\varepsilon(V_{bi} - V)}{q}\\left(\\dfrac1{N_A} + \\dfrac1{N_D}\\right)}$, in cm when $N$ is in $\\text{cm}^{-3}$ and $\\varepsilon$ in F/cm.', '$W = \\sqrt{\\dfrac{2\\varepsilon(V_{bi} - V)}{q}\\left(\\dfrac1{N_A} + \\dfrac1{N_D}\\right)}$ で、$N$ を $\\text{cm}^{-3}$、$\\varepsilon$ を F/cm にすると cm で得られます。'],
          sol: [[`$\\varepsilon = 1.036 \\times 10^{-12}$ F/cm and $V_{bi} - V = ${n(J.Vj, 4)}$ V.`, `$\\varepsilon = 1.036 \\times 10^{-12}$ F/cm、$V_{bi} - V = ${n(J.Vj, 4)}$ V です。`], [`$W = \\sqrt{${e10(2 * EPS * J.Vj / QE)} \\times ${e10(1 / Na + 1 / Nd)}} = ${e10(J.W)}$ cm $= ${n(um(J.W), 4)}\\ \\mu\\text{m}$.`, `$W = \\sqrt{${e10(2 * EPS * J.Vj / QE)} \\times ${e10(1 / Na + 1 / Nd)}} = ${e10(J.W)}$ cm $= ${n(um(J.W), 4)}\\ \\mu\\text{m}$ です。`], [V < 0 ? 'Reverse bias adds to the built-in voltage and widens the region.' : V > 0 ? 'Forward bias lowers the barrier and narrows the region.' : 'At zero bias only the built-in voltage holds the region open.', V < 0 ? '逆バイアスは内蔵電位に加わって空乏層を広げます。' : V > 0 ? '順バイアスは障壁を下げて空乏層を狭めます。' : 'バイアスがなければ、内蔵電位だけが空乏層を保っています。']],
          set: { lna: la, lnd: ld, V },
        };
      }
      if (form === 1) {
        return {
          q: [`For $N_A = ${pow10(la)}$, $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ at bias $${V}$ V, the n-side depletion depth is $x_n = ${n(um(J.xn), 4)}\\ \\mu\\text{m}$. Find the peak field $\\mathcal E_{\\max}$ in kV/cm.`, `$N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$、バイアス $${V}$ V で、n 側の空乏層の深さは $x_n = ${n(um(J.xn), 4)}\\ \\mu\\text{m}$ です。最大電場 $\\mathcal E_{\\max}$ を kV/cm で求めてください。`],
          a: { type: 'num', v: J.Emax / 1000, rel: 0.01, unit: ['kV/cm', 'kV/cm'] },
          hint: ['Gauss: $\\mathcal E_{\\max} = qN_Dx_n/\\varepsilon$ with $\\varepsilon = 1.036 \\times 10^{-12}$ F/cm.', 'ガウスの法則より $\\mathcal E_{\\max} = qN_Dx_n/\\varepsilon$、$\\varepsilon = 1.036 \\times 10^{-12}$ F/cm です。'],
          sol: [[`$qN_Dx_n = 1.602\\times10^{-19} \\times ${e10(Nd)} \\times ${e10(J.xn)}\\ \\text{cm} = ${e10(QE * Nd * J.xn)}\\ \\text{C/cm}^2$.`, `$qN_Dx_n = 1.602\\times10^{-19} \\times ${e10(Nd)} \\times ${e10(J.xn)}\\ \\text{cm} = ${e10(QE * Nd * J.xn)}\\ \\text{C/cm}^2$ です。`], [`$\\mathcal E_{\\max} = ${e10(J.Emax)}$ V/cm $= ${n(J.Emax / 1000, 4)}$ kV/cm.`, `$\\mathcal E_{\\max} = ${e10(J.Emax)}$ V/cm $= ${n(J.Emax / 1000, 4)}$ kV/cm です。`], ['Silicon breaks down by avalanche at a few hundred kV/cm, which sets a junction\'s maximum reverse voltage.', 'シリコンは数百 kV/cm でなだれ降伏を起こし、これが接合の最大逆電圧を決めます。']],
          set: { lna: la, lnd: ld, V },
        };
      }
      return {
        q: [`What is the depletion capacitance per unit area, in nF/cm², of the junction with $N_A = ${pow10(la)}$, $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ at bias $${V}$ V, where $W = ${n(um(J.W), 4)}\\ \\mu\\text{m}$?`, `$N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$、バイアス $${V}$ V で $W = ${n(um(J.W), 4)}\\ \\mu\\text{m}$ の接合の、単位面積あたりの空乏容量は何 nF/cm² ですか。`],
        a: { type: 'num', v: J.C * 1e9, rel: 0.01, unit: ['nF/cm²', 'nF/cm²'] },
        hint: ['The depletion region acts as a parallel-plate capacitor of thickness $W$.', '空乏層は厚さ $W$ の平行平板コンデンサーとしてはたらきます。'],
        sol: [[`$C = \\varepsilon/W = 1.036\\times10^{-12}/${e10(J.W)} = ${e10(J.C)}\\ \\text{F/cm}^2$.`, `$C = \\varepsilon/W = 1.036\\times10^{-12}/${e10(J.W)} = ${e10(J.C)}\\ \\text{F/cm}^2$ です。`], [`$= ${n(J.C * 1e9, 4)}$ nF/cm². Reverse bias widens $W$ and lowers $C$: varactor diodes tune radio circuits this way.`, `$= ${n(J.C * 1e9, 4)}$ nF/cm² です。逆バイアスは $W$ を広げて $C$ を下げます。可変容量ダイオードはこうしてラジオの回路を同調させます。`]],
        set: { lna: la, lnd: ld, V },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const [la, ld] = pickNN(r), Na = 10 ** la, Nd = 10 ** ld, J0 = junction(Na, Nd, 0);
      if (form === 0) {
        const k = r.pick([2, 1.5, 3]);
        const V = J0.Vbi * (1 - k * k);
        return {
          q: [`A junction has $V_{bi} = ${n(J0.Vbi, 4)}$ V. What bias makes its depletion region ${k === 2 ? 'twice' : k === 3 ? 'three times' : '1.5 times'} as wide as at zero bias?`, `内蔵電位 $V_{bi} = ${n(J0.Vbi, 4)}$ V の接合があります。空乏層の幅をバイアスなしの ${k} 倍にするバイアスはいくらですか。`],
          a: { type: 'num', v: V, tol: 0.003, unit: ['V', 'V'] },
          hint: ['$W \\propto \\sqrt{V_{bi} - V}$.', '$W \\propto \\sqrt{V_{bi} - V}$ です。'],
          sol: [[`$W$ scales by ${k} when $V_{bi} - V$ scales by $${k * k}$.`, `$V_{bi} - V$ が $${k * k}$ 倍になると $W$ は ${k} 倍になります。`], [`$V = V_{bi}(1 - ${k * k}) = ${n(V, 4)}$ V: a reverse bias.`, `$V = V_{bi}(1 - ${k * k}) = ${n(V, 4)}$ V で、逆バイアスです。`], ['The square root means diminishing returns: each further doubling of $W$ costs four times the voltage.', '平方根なので効果は逓減し、$W$ をさらに2倍にするたびに4倍の電圧が要ります。']],
          set: V >= -3 ? { lna: la, lnd: ld, V: Math.round(V * 100) / 100 } : { lna: la, lnd: ld },
        };
      }
      if (form === 1) {
        const Wt = r.pick([0.5, 1, 1.5, 2, 3]), Vb = r.pick([0.7, 0.75, 0.8]);
        const NdT = 2 * EPS * Vb / QE / (Wt * 1e-4) ** 2;
        return {
          q: [`A one-sided $p^+$-n junction ($N_A \\gg N_D$) has $V_{bi} \\approx ${Vb}$ V. What donor density gives a zero-bias depletion width of $${Wt}\\ \\mu\\text{m}$?`, `片側の $p^+$-n 接合（$N_A \\gg N_D$）で $V_{bi} \\approx ${Vb}$ V です。バイアスなしの空乏層の幅を $${Wt}\\ \\mu\\text{m}$ にするドナー密度はいくらですか。`],
          a: { type: 'num', v: NdT, rel: 0.02, unit: ['cm⁻³', 'cm⁻³'] },
          hint: ['With $1/N_A$ negligible, $W^2 = 2\\varepsilon V_{bi}/(qN_D)$.', '$1/N_A$ が無視できるので $W^2 = 2\\varepsilon V_{bi}/(qN_D)$ です。'],
          sol: [[`$N_D = \\dfrac{2\\varepsilon V_{bi}}{qW^2} = \\dfrac{2 \\times 1.036\\times10^{-12} \\times ${Vb}}{1.602\\times10^{-19} \\times (${Wt}\\times10^{-4})^2}$.`, `$N_D = \\dfrac{2\\varepsilon V_{bi}}{qW^2} = \\dfrac{2 \\times 1.036\\times10^{-12} \\times ${Vb}}{1.602\\times10^{-19} \\times (${Wt}\\times10^{-4})^2}$ です。`], [`$N_D = ${e10(NdT)}\\ \\text{cm}^{-3}$.`, `$N_D = ${e10(NdT)}\\ \\text{cm}^{-3}$ です。`], ['Almost all of the depletion lies on the lightly doped side, so that side alone sets $W$, the capacitance and the breakdown voltage.', '空乏層のほとんどは低濃度側にあるので、その側だけで $W$、容量、降伏電圧が決まります。']],
        };
      }
      const W0 = um(J0.W);
      return {
        q: [`The junction with $N_A = ${pow10(la)}$, $N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ has $V_{bi} = ${n(J0.Vbi, 4)}$ V and $W = ${n(W0, 4)}\\ \\mu\\text{m}$ at zero bias. Write $W(V)$ in μm as a function of the bias $V$ in volts.`, `$N_A = ${pow10(la)}$、$N_D = ${pow10(ld)}\\ \\text{cm}^{-3}$ の接合は、バイアスなしで $V_{bi} = ${n(J0.Vbi, 4)}$ V、$W = ${n(W0, 4)}\\ \\mu\\text{m}$ です。$W(V)$（μm）をバイアス $V$（V）の式で表してください。`],
        a: { type: 'expr', v: `${n(W0, 8)}*sqrt(1-V/${n(J0.Vbi, 8)})`, vars: ['V'], dom: { V: [-3, 0.5] }, lhs: ['$W(V) =$', '$W(V) =$'] },
        hint: ['Only the factor $V_{bi} - V$ changes with bias.', 'バイアスで変わるのは因子 $V_{bi} - V$ だけです。'],
        sol: [['$W \\propto \\sqrt{V_{bi} - V}$, so $W(V) = W(0)\\sqrt{1 - V/V_{bi}}$.', '$W \\propto \\sqrt{V_{bi} - V}$ なので $W(V) = W(0)\\sqrt{1 - V/V_{bi}}$ です。'], [`$W(V) = ${n(W0, 4)}\\sqrt{1 - V/${n(J0.Vbi, 4)}}\\ \\mu\\text{m}$.`, `$W(V) = ${n(W0, 4)}\\sqrt{1 - V/${n(J0.Vbi, 4)}}\\ \\mu\\text{m}$ です。`], ['It would vanish at $V = V_{bi}$, but long before that the depletion approximation fails and a large forward current flows.', '$V = V_{bi}$ で 0 になるはずですが、そのずっと前に空乏近似は破れ、大きな順方向電流が流れます。']],
        set: { lna: la, lnd: ld },
      };
    },
  ];

  /* ---------- 3. the diode and the solar cell ---------- */
  const IS300 = 1e-12;
  const Is = (T) => IS300 * Math.pow(T / 300, 3) * Math.exp(Eg(300) / (KB * 300) - Eg(T) / (KB * T));
  const diodeI = (V, T, nid, Iph) => Is(T) * Math.expm1(V / (nid * KB * T)) - Iph;
  const voc = (T, nid, Iph) => nid * KB * T * Math.log1p(Iph / Is(T));
  function maxPower(T, nid, Iph) { let lo = 0, hi = voc(T, nid, Iph); for (let k = 0; k < 120; k++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (-a * diodeI(a, T, nid, Iph) < -b * diodeI(b, T, nid, Iph)) lo = a; else hi = b; } const V = (lo + hi) / 2; return { V, I: -diodeI(V, T, nid, Iph), P: -V * diodeI(V, T, nid, Iph) }; }
  const vKey = (v) => { const x = Number((Math.round(v / 0.005) * 0.005).toFixed(3)); return x >= -0.4 && x <= 0.8 ? { V: x } : {}; };
  Q['diode-iv'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.pick([0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65]), I = IS300 * Math.expm1(V / VT);
        return {
          q: [`An ideal silicon diode at 300 K has $I_s = 10^{-12}$ A. What current flows at $V = ${V}$ V forward bias, in mA? ($kT/q = 25.85$ mV.)`, `300 K の理想的なシリコンダイオードで $I_s = 10^{-12}$ A です。順バイアス $V = ${V}$ V で流れる電流は何 mA ですか（$kT/q = 25.85$ mV）。`],
          a: { type: 'num', v: I * 1000, rel: 0.01, unit: ['mA', 'mA'] },
          sol: [[`$V/(kT/q) = ${n(V / VT, 4)}$, $e^{${n(V / VT, 3)}} = ${e10(Math.exp(V / VT))}$.`, `$V/(kT/q) = ${n(V / VT, 4)}$、$e^{${n(V / VT, 3)}} = ${e10(Math.exp(V / VT))}$ です。`], [`$I = 10^{-12}(e^{${n(V / VT, 3)}} - 1) = ${e10(I * 1000)}$ mA.`, `$I = 10^{-12}(e^{${n(V / VT, 3)}} - 1) = ${e10(I * 1000)}$ mA です。`], ['Every extra 60 mV multiplies the current by about ten: the "0.6 V drop" of a silicon diode is just where the current becomes useful.', '60 mV 増えるごとに電流はおよそ10倍になります。シリコンダイオードの「0.6 V の電圧降下」は電流が実用的な大きさになる所にすぎません。']],
          set: { T: 300, nid: 1, Iph: 0, V },
        };
      }
      if (form === 1) {
        const V = r.pick([-0.1, -0.2, -0.3, -0.4]), I = IS300 * Math.expm1(V / VT);
        return {
          q: [`The same diode ($I_s = 10^{-12}$ A, 300 K, no light) is reverse biased at $V = ${V}$ V. What current flows, in pA?`, `同じダイオード（$I_s = 10^{-12}$ A、300 K、光なし）に $V = ${V}$ V の逆バイアスをかけます。流れる電流は何 pA ですか。`],
          a: { type: 'num', v: I * 1e12, rel: 0.005, unit: ['pA', 'pA'] },
          hint: ['The exponential is already tiny at a few tenths of a volt reverse.', '逆方向に零点数ボルトもかければ、指数関数はすでにごく小さくなります。'],
          sol: [[`$e^{${n(V / VT, 3)}} = ${e10(Math.exp(V / VT))}$, so $I = 10^{-12}(${e10(Math.exp(V / VT))} - 1) \\approx ${n(I * 1e12, 5)}$ pA.`, `$e^{${n(V / VT, 3)}} = ${e10(Math.exp(V / VT))}$ なので $I = 10^{-12}(${e10(Math.exp(V / VT))} - 1) \\approx ${n(I * 1e12, 5)}$ pA です。`], ['Essentially $-I_s$, whatever the reverse voltage: only the minority carriers that wander to the junction are swept across.', '逆電圧によらずほぼ $-I_s$ です。接合までさまよってきた少数キャリアだけが押し流されるからです。']],
          set: { T: 300, nid: 1, Iph: 0, V },
        };
      }
      const Iph = r.pick([5, 10, 20, 25, 30, 40, 50]);
      return {
        q: [`A solar cell under light generates $I_{ph} = ${Iph}$ mA. What current flows when its terminals are shorted ($V = 0$)?`, `光を受けた太陽電池が $I_{ph} = ${Iph}$ mA を生みます。端子を短絡した（$V = 0$）ときに流れる電流はいくらですか。`],
        a: { type: 'num', v: -Iph, rel: 0.002, unit: ['mA', 'mA'] },
        hint: ['At $V = 0$ the diode term $I_s(e^0 - 1)$ vanishes.', '$V = 0$ ではダイオードの項 $I_s(e^0 - 1)$ が 0 になります。'],
        sol: [[`$I = I_s(e^0 - 1) - I_{ph} = -${Iph}$ mA.`, `$I = I_s(e^0 - 1) - I_{ph} = -${Iph}$ mA です。`], ['The minus sign means current flows out of the cell into the circuit: the cell is a source, the I-V curve has moved into the fourth quadrant.', '負の符号は電流が電池から回路へ流れ出ることを意味します。電池は電源となり、I-V 曲線は第4象限に移ります。']],
        set: { Iph, V: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Iph = r.pick([10, 20, 25, 30, 40, 50]), nid = r.pick([1, 1, 1.2, 1.5]), T = 300;
        const v = voc(T, nid, Iph * 1e-3);
        return {
          q: [`A cell at 300 K with $I_s = 10^{-12}$ A and ideality $n = ${nid}$ makes $I_{ph} = ${Iph}$ mA. What is its open-circuit voltage?`, `300 K で $I_s = 10^{-12}$ A、理想係数 $n = ${nid}$ の電池が $I_{ph} = ${Iph}$ mA を生みます。開放電圧はいくらですか。`],
          a: { type: 'num', v, tol: 0.002, unit: ['V', 'V'] },
          hint: ['Set $I = 0$ in the Shockley equation with the photocurrent.', '光電流を含むショックレーの式で $I = 0$ とおいてください。'],
          sol: [[`$V_{oc} = n\\frac{kT}{q}\\ln(1 + I_{ph}/I_s) = ${nid} \\times 0.02585 \\times \\ln(1 + ${e10(Iph * 1e-3 / 1e-12)})$.`, `$V_{oc} = n\\frac{kT}{q}\\ln(1 + I_{ph}/I_s) = ${nid} \\times 0.02585 \\times \\ln(1 + ${e10(Iph * 1e-3 / 1e-12)})$ です。`], [`$V_{oc} = ${n(v, 4)}$ V.`, `$V_{oc} = ${n(v, 4)}$ V です。`], ['Only logarithmic in the light: doubling the illumination adds just $nkT\\ln2/q \\approx ' + n(nid * VT * Math.LN2 * 1000, 3) + '$ mV.', '光に対して対数的にしか増えません。照度を2倍にしても $nkT\\ln2/q \\approx ' + n(nid * VT * Math.LN2 * 1000, 3) + '$ mV しか増えません。']],
          set: { T, nid, Iph, ...vKey(v) },
        };
      }
      if (form === 1) {
        const I = r.pick([0.1, 1, 5, 10, 50, 100]), nid = r.pick([1, 1.5, 2]), V = nid * VT * Math.log1p(I * 1e-3 / 1e-12);
        return {
          q: [`At 300 K, what forward voltage drives $${I}$ mA through a diode with $I_s = 10^{-12}$ A and ideality $n = ${nid}$?`, `300 K で、$I_s = 10^{-12}$ A、理想係数 $n = ${nid}$ のダイオードに $${I}$ mA を流す順電圧はいくらですか。`],
          a: { type: 'num', v: V, tol: 0.002, unit: ['V', 'V'] },
          hint: ['Invert $I = I_s(e^{qV/nkT} - 1)$.', '$I = I_s(e^{qV/nkT} - 1)$ を逆に解いてください。'],
          sol: [[`$V = n\\frac{kT}{q}\\ln(1 + I/I_s) = ${nid} \\times 0.02585 \\times \\ln(1 + ${e10(I * 1e9)})$.`, `$V = n\\frac{kT}{q}\\ln(1 + I/I_s) = ${nid} \\times 0.02585 \\times \\ln(1 + ${e10(I * 1e9)})$ です。`], [`$V = ${n(V, 4)}$ V.`, `$V = ${n(V, 4)}$ V です。`], [nid > 1 ? 'An ideality above 1, from recombination in the depletion region, makes the diode need more voltage for the same current.' : 'A thousandfold range of current spans only about 0.18 V: a forward-biased diode is almost a fixed voltage source.', nid > 1 ? '空乏層内の再結合による 1 より大きい理想係数のために、同じ電流により高い電圧が必要になります。' : '電流が千倍変わっても電圧は約 0.18 V しか変わりません。順バイアスのダイオードはほぼ定電圧源です。']],
          set: { T: 300, nid, Iph: 0, ...vKey(V) },
        };
      }
      const T = r.pick([250, 300, 350, 400]), nid = r.pick([1, 1.2, 1.5, 2]), dv = nid * KB * T * Math.LN10;
      return {
        q: [`At $${T}$ K, how much must the forward voltage rise to multiply the current of a diode with ideality $n = ${nid}$ by ten? Give millivolts.`, `$${T}$ K で、理想係数 $n = ${nid}$ のダイオードの電流を10倍にするには順電圧をどれだけ上げればよいですか（mV で）。`],
        a: { type: 'num', v: dv * 1000, rel: 0.003, unit: ['mV', 'mV'] },
        hint: ['Well above $kT/q$, $I \\propto e^{qV/nkT}$.', '$kT/q$ より十分大きい電圧では $I \\propto e^{qV/nkT}$ です。'],
        sol: [[`$\\Delta V = n\\frac{kT}{q}\\ln 10 = ${nid} \\times ${n(KB * T * 1000, 4)} \\times 2.3026$ mV.`, `$\\Delta V = n\\frac{kT}{q}\\ln 10 = ${nid} \\times ${n(KB * T * 1000, 4)} \\times 2.3026$ mV です。`], [`$\\Delta V = ${n(dv * 1000, 4)}$ mV per decade: the slope of the straight line on the logarithmic plot.`, `1桁あたり $\\Delta V = ${n(dv * 1000, 4)}$ mV で、対数目盛の図の直線の傾きです。`]],
        set: { T, nid, scale: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const T = r.pick([250, 275, 325, 350, 375, 400]), ratio = Is(T) / IS300;
        return {
          q: [`$I_s \\propto T^3e^{-E_g/kT}$. Silicon has $E_g = ${n(Eg(300), 4)}$ eV at 300 K and $${n(Eg(T), 4)}$ eV at $${T}$ K. By what factor does $I_s$ change from 300 K to $${T}$ K?`, `$I_s \\propto T^3e^{-E_g/kT}$ です。シリコンの $E_g$ は 300 K で $${n(Eg(300), 4)}$ eV、$${T}$ K で $${n(Eg(T), 4)}$ eV です。300 K から $${T}$ K で $I_s$ は何倍になりますか。`],
          a: { type: 'num', v: ratio, rel: 0.02 },
          hint: ['Take the ratio and keep each $E_g$ with its own temperature.', '比をとり、それぞれの $E_g$ をその温度と組にしてください。'],
          sol: [[`$(T/300)^3 = ${n((T / 300) ** 3, 4)}$.`, `$(T/300)^3 = ${n((T / 300) ** 3, 4)}$ です。`], [`$\\exp\\left(\\dfrac{${n(Eg(300), 4)}}{kT_{300}} - \\dfrac{${n(Eg(T), 4)}}{kT}\\right) = e^{${n(Eg(300) / (KB * 300) - Eg(T) / (KB * T), 4)}} = ${e10(Math.exp(Eg(300) / (KB * 300) - Eg(T) / (KB * T)))}$.`, `$\\exp\\left(\\dfrac{${n(Eg(300), 4)}}{kT_{300}} - \\dfrac{${n(Eg(T), 4)}}{kT}\\right) = e^{${n(Eg(300) / (KB * 300) - Eg(T) / (KB * T), 4)}} = ${e10(Math.exp(Eg(300) / (KB * 300) - Eg(T) / (KB * T)))}$ です。`], [`Factor $${e10(ratio)}$. ${T > 300 ? 'The leakage roughly doubles every 5 to 6 K, which is why hot solar panels lose voltage.' : 'Cooling suppresses it just as steeply.'}`, `$${e10(ratio)}$ 倍です。${T > 300 ? '漏れ電流はおよそ 5 から 6 K ごとに2倍になります。熱くなった太陽電池パネルの電圧が下がるのはこのためです。' : '冷やすと同じくらい急激に抑えられます。'}`]],
          set: { T, Iph: 0, scale: 1 },
        };
      }
      if (form === 1) {
        const T = r.pick([275, 300, 325, 350]), nid = r.pick([1, 1.2, 1.5]), Iph = r.pick([20, 30, 40, 50]);
        const m = maxPower(T, nid, Iph * 1e-3), Vo = voc(T, nid, Iph * 1e-3), FF = m.P / (Vo * Iph * 1e-3);
        return {
          q: [`A cell at $${T}$ K with ideality $n = ${nid}$ and $I_{ph} = ${Iph}$ mA has $V_{oc} = ${n(Vo, 4)}$ V. Find its maximum output power in mW.`, `$${T}$ K、理想係数 $n = ${nid}$、$I_{ph} = ${Iph}$ mA の電池の開放電圧は $V_{oc} = ${n(Vo, 4)}$ V です。最大出力を mW で求めてください。`],
          a: { type: 'num', v: m.P * 1000, rel: 0.01, unit: ['mW', 'mW'] },
          hint: ['Maximise $P = V\\left(I_{ph} - I_s(e^{qV/nkT} - 1)\\right)$; the optimum sits a few $nkT/q$ below $V_{oc}$, so try values there.', '$P = V\\left(I_{ph} - I_s(e^{qV/nkT} - 1)\\right)$ を最大にします。最適点は $V_{oc}$ より $nkT/q$ の数倍だけ低い所にあるので、そのあたりの値を試してください。'],
          sol: [[`$dP/dV = 0$ gives $V_m = ${n(m.V, 4)}$ V, where the cell still delivers $I_m = ${n(m.I * 1000, 4)}$ mA.`, `$dP/dV = 0$ より $V_m = ${n(m.V, 4)}$ V で、そのとき電池はまだ $I_m = ${n(m.I * 1000, 4)}$ mA を供給します。`], [`$P_{\\max} = V_mI_m = ${n(m.P * 1000, 4)}$ mW.`, `$P_{\\max} = V_mI_m = ${n(m.P * 1000, 4)}$ mW です。`], [`Fill factor $P_{\\max}/(V_{oc}I_{sc}) = ${n(FF, 3)}$: the squarer the knee of the curve, the closer to 1.`, `曲線因子は $P_{\\max}/(V_{oc}I_{sc}) = ${n(FF, 3)}$ で、曲線の肩が角ばっているほど 1 に近づきます。`]],
          set: { T, nid, Iph, ...vKey(m.V), scale: 0 },
        };
      }
      const Iph = r.pick([10, 20, 30, 40]), nid = r.pick([1, 1.5]), vt = nid * VT;
      return {
        q: [`Write the current $I(V)$ in mA of a cell at 300 K with $I_s = 10^{-12}$ A, ideality $n = ${nid}$ and $I_{ph} = ${Iph}$ mA, with $V$ in volts ($kT/q = 0.025852$ V).`, `300 K で $I_s = 10^{-12}$ A、理想係数 $n = ${nid}$、$I_{ph} = ${Iph}$ mA の電池の電流 $I(V)$（mA）を、ボルト単位の $V$ の式で表してください（$kT/q = 0.025852$ V）。`],
        a: { type: 'expr', v: `1e-9*(exp(V/${n(vt, 8)})-1)-${Iph}`, vars: ['V'], dom: { V: [0, 0.75] }, lhs: ['$I(V) =$', '$I(V) =$'] },
        hint: ['Convert $I_s$ to mA first.', 'まず $I_s$ を mA に直してください。'],
        sol: [[`$I_s = 10^{-12}$ A $= 10^{-9}$ mA and $nkT/q = ${n(vt, 5)}$ V.`, `$I_s = 10^{-12}$ A $= 10^{-9}$ mA、$nkT/q = ${n(vt, 5)}$ V です。`], [`$I(V) = 10^{-9}\\left(e^{V/${n(vt, 5)}} - 1\\right) - ${Iph}$ mA.`, `$I(V) = 10^{-9}\\left(e^{V/${n(vt, 5)}} - 1\\right) - ${Iph}$ mA です。`], [`It crosses zero at $V_{oc} = ${n(voc(300, nid, Iph * 1e-3), 4)}$ V; between 0 and $V_{oc}$ the current is negative and the cell delivers power.`, `$V_{oc} = ${n(voc(300, nid, Iph * 1e-3), 4)}$ V で 0 を横切ります。0 と $V_{oc}$ の間では電流は負で、電池が電力を供給します。`]],
        set: { T: 300, nid, Iph, scale: 0 },
      };
    },
  ];
})();
