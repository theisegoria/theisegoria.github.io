'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const LN2 = Math.LN2;

  // the lab's semi-empirical mass formula (MeV)
  const AV = 15.75, AS = 17.8, AC = 0.711, AA = 23.7, AP = 11.18, BHE4 = 28.2957;
  const pairT = (A, Z) => { const N = A - Z; return Z % 2 === 0 && N % 2 === 0 ? AP / Math.sqrt(A) : Z % 2 === 1 && N % 2 === 1 ? -AP / Math.sqrt(A) : 0; };
  const terms = (A, Z) => ({ vol: AV * A, surf: AS * Math.cbrt(A * A), coul: AC * Z * (Z - 1) / Math.cbrt(A), asym: AA * (A - 2 * Z) ** 2 / A, pair: pairT(A, Z) });
  const B = (A, Z) => { const t = terms(A, Z); return t.vol - t.surf - t.coul - t.asym + t.pair; };
  const SYM = 'n H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds'.split(' ');
  const nuc = (A, Z) => `{}^{${A}}\\mathrm{${SYM[Z]}}`;
  // well-known nuclei [A, Z]
  const NUCS = [[12, 6], [16, 8], [27, 13], [40, 20], [56, 26], [58, 28], [62, 28], [90, 40], [107, 47], [120, 50], [138, 56], [197, 79], [208, 82], [232, 90], [235, 92], [238, 92], [24, 12], [64, 30], [88, 38], [132, 54]];
  const setNZ = (A, Z) => (Z <= 110 && A - Z <= 165 ? { Z, N: A - Z } : undefined);

  /* ---------- 1. binding energy ---------- */
  Q['binding-energy'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [A, Z] = r.pick(NUCS), askN = r.chance(0.6);
        return {
          q: [askN ? `How many neutrons are in $${nuc(A, Z)}$ (atomic number $${Z}$)?` : `How many nucleons are in $${nuc(A, Z)}$?`, askN ? `$${nuc(A, Z)}$（原子番号 $${Z}$）には中性子がいくつありますか。` : `$${nuc(A, Z)}$ には核子がいくつありますか。`],
          a: { type: 'int', v: askN ? A - Z : A },
          hint: ['The superscript is the mass number $A = Z + N$.', '左上の数は質量数 $A = Z + N$ です。'],
          sol: askN ? [[`$N = A - Z = ${A} - ${Z} = ${A - Z}$.`, `$N = A - Z = ${A} - ${Z} = ${A - Z}$ です。`], [A - Z > Z ? `More neutrons than protons: heavier nuclei need the extra neutrons to dilute the protons' Coulomb repulsion.` : 'Light nuclei sit near $N = Z$, where the asymmetry term vanishes.', A - Z > Z ? '陽子より中性子が多いのは、重い原子核では余分な中性子で陽子のクーロン反発を薄める必要があるからです。' : '軽い原子核は非対称項が 0 になる $N = Z$ の近くにあります。']] : [[`$A = ${A}$: ${Z} protons and ${A - Z} neutrons.`, `$A = ${A}$ で、陽子 ${Z} 個と中性子 ${A - Z} 個です。`], ['The volume term of the binding energy is proportional to this number.', '結合エネルギーの体積項はこの数に比例します。']],
          set: setNZ(A, Z),
        };
      }
      if (form === 1) {
        const [A, Z] = r.pick(NUCS), which = r.int(0, 1);
        const v = which ? AS * Math.cbrt(A * A) : AV * A;
        return {
          q: [which ? `What is the surface term $a_S A^{2/3}$ of the binding energy of $${nuc(A, Z)}$, with $a_S = 17.8$ MeV?` : `What is the volume term $a_V A$ of the binding energy of $${nuc(A, Z)}$, with $a_V = 15.75$ MeV?`, which ? `$a_S = 17.8$ MeV として、$${nuc(A, Z)}$ の結合エネルギーの表面項 $a_S A^{2/3}$ はいくらですか。` : `$a_V = 15.75$ MeV として、$${nuc(A, Z)}$ の結合エネルギーの体積項 $a_V A$ はいくらですか。`],
          a: { type: 'num', v, rel: 0.003, unit: ['MeV', 'MeV'] },
          sol: which ? [[`$A^{2/3} = ${A}^{2/3} = ${n(Math.cbrt(A * A), 4)}$, so $17.8 \\times ${n(Math.cbrt(A * A), 4)} = ${n(v, 4)}$ MeV.`, `$A^{2/3} = ${A}^{2/3} = ${n(Math.cbrt(A * A), 4)}$ なので $17.8 \\times ${n(Math.cbrt(A * A), 4)} = ${n(v, 4)}$ MeV です。`], ['The surface area of a drop of radius $R \\propto A^{1/3}$ grows like $A^{2/3}$; nucleons there have fewer neighbours, so this is subtracted.', '半径 $R \\propto A^{1/3}$ の液滴の表面積は $A^{2/3}$ に比例します。そこにある核子は隣が少ないので、この分が差し引かれます。']] : [[`$15.75 \\times ${A} = ${n(v, 4)}$ MeV.`, `$15.75 \\times ${A} = ${n(v, 4)}$ MeV です。`], ['Each nucleon binds only to its near neighbours, so this leading term grows in proportion to $A$, like the energy of a liquid.', '各核子は近くの隣とだけ結びつくので、主要項は液体のエネルギーのように $A$ に比例して増えます。']],
          set: setNZ(A, Z),
        };
      }
      const [A, Z] = r.pick(NUCS.concat([[14, 7], [10, 5], [59, 27], [9, 4], [55, 25], [50, 23]])), N = A - Z;
      const v = Z % 2 === 0 && N % 2 === 0 ? 0 : Z % 2 === 1 && N % 2 === 1 ? 2 : 1;
      return {
        q: [`What sign does the pairing term take for $${nuc(A, Z)}$ ($Z = ${Z}$, $N = ${N}$)?`, `$${nuc(A, Z)}$（$Z = ${Z}$、$N = ${N}$）では対項の符号はどうなりますか。`],
        a: { type: 'choice', opts: [['$+a_P/\\sqrt A$: extra binding', '$+a_P/\\sqrt A$：結合が増える'], ['zero', '0'], ['$-a_P/\\sqrt A$: less binding', '$-a_P/\\sqrt A$：結合が減る']], v: v === 0 ? 0 : v === 1 ? 1 : 2, fixed: true },
        hint: ['Like nucleons pair up: look at whether $Z$ and $N$ are even or odd.', '同種の核子は対をつくります。$Z$ と $N$ の偶奇を見てください。'],
        sol: [[`$Z = ${Z}$ is ${Z % 2 ? 'odd' : 'even'} and $N = ${N}$ is ${N % 2 ? 'odd' : 'even'}.`, `$Z = ${Z}$ は${Z % 2 ? '奇数' : '偶数'}、$N = ${N}$ は${N % 2 ? '奇数' : '偶数'}です。`], [v === 0 ? 'Even-even: every nucleon is paired, the most tightly bound case.' : v === 2 ? 'Odd-odd: one unpaired proton and one unpaired neutron, the least bound case. Only four stable odd-odd nuclei exist.' : 'Odd $A$: one unpaired nucleon, no correction.', v === 0 ? '偶偶核で、すべての核子が対になっており、最も強く結合します。' : v === 2 ? '奇奇核で、対にならない陽子と中性子が一つずつあり、最も結合が弱くなります。安定な奇奇核は四つしかありません。' : '$A$ が奇数なので、対にならない核子が一つあり、補正はありません。']],
        set: setNZ(A, Z),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const [A, Z] = r.pick(NUCS), t = terms(A, Z), b = B(A, Z);
      if (form === 0 || form === 1) {
        const perA = form === 1;
        return {
          q: [perA ? `Use the liquid-drop formula to find the binding energy per nucleon $B/A$ of $${nuc(A, Z)}$.` : `Use the liquid-drop formula to find the total binding energy $B$ of $${nuc(A, Z)}$.`, perA ? `液滴の式を使って $${nuc(A, Z)}$ の核子あたりの結合エネルギー $B/A$ を求めてください。` : `液滴の式を使って $${nuc(A, Z)}$ の全結合エネルギー $B$ を求めてください。`],
          a: { type: 'num', v: perA ? b / A : b, rel: perA ? 0.002 : 0.002, unit: ['MeV', 'MeV'] },
          hint: ['Evaluate all five terms with $a_V = 15.75$, $a_S = 17.8$, $a_C = 0.711$, $a_A = 23.7$, $a_P = 11.18$ MeV.', '$a_V = 15.75$、$a_S = 17.8$、$a_C = 0.711$、$a_A = 23.7$、$a_P = 11.18$ MeV で五つの項をすべて計算してください。'],
          sol: [[`Volume $${n(t.vol, 1)}$, surface $-${n(t.surf, 1)}$, Coulomb $-${n(t.coul, 1)}$, asymmetry $-${n(t.asym, 2)}$, pairing $${t.pair >= 0 ? '+' : '-'}${n(Math.abs(t.pair), 2)}$ MeV.`, `体積 $${n(t.vol, 1)}$、表面 $-${n(t.surf, 1)}$、クーロン $-${n(t.coul, 1)}$、非対称 $-${n(t.asym, 2)}$、対 $${t.pair >= 0 ? '+' : '-'}${n(Math.abs(t.pair), 2)}$ MeV です。`], [`$B = ${n(b, 4)}$ MeV${perA ? `, so $B/A = ${n(b, 4)}/${A} = ${n(b / A, 4)}$ MeV` : ''}.`, `$B = ${n(b, 4)}$ MeV${perA ? ` なので $B/A = ${n(b, 4)}/${A} = ${n(b / A, 4)}$ MeV` : ''} です。`], [`${A >= 50 && A <= 70 ? 'Near the top of the curve: iron and nickel are the most tightly bound nuclei.' : A < 50 ? 'Below the peak: the surface term still costs a lot, so fusing light nuclei releases energy.' : 'Past the peak: the Coulomb term grows, so splitting heavy nuclei releases energy.'}`, `${A >= 50 && A <= 70 ? '曲線の頂上付近で、鉄とニッケルが最も強く結合した原子核です。' : A < 50 ? '頂上より手前で、表面項がまだ大きいので、軽い原子核の融合はエネルギーを放出します。' : '頂上を越えるとクーロン項が増えるので、重い原子核の分裂はエネルギーを放出します。'}`]],
          set: setNZ(A, Z),
        };
      }
      const which = r.int(0, 1);
      return {
        q: [which ? `Find the asymmetry term $a_A (N - Z)^2/A$ for $${nuc(A, Z)}$ ($a_A = 23.7$ MeV).` : `Find the Coulomb term $a_C Z(Z - 1)/A^{1/3}$ for $${nuc(A, Z)}$ ($a_C = 0.711$ MeV).`, which ? `$${nuc(A, Z)}$ の非対称項 $a_A (N - Z)^2/A$ を求めてください（$a_A = 23.7$ MeV）。` : `$${nuc(A, Z)}$ のクーロン項 $a_C Z(Z - 1)/A^{1/3}$ を求めてください（$a_C = 0.711$ MeV）。`],
        a: { type: 'num', v: which ? t.asym : t.coul, rel: 0.003, tol: which ? 0.01 : undefined, unit: ['MeV', 'MeV'] },
        sol: which ? [[`$N - Z = ${A - 2 * Z}$, so $23.7 \\times ${(A - 2 * Z) ** 2}/${A} = ${n(t.asym, 4)}$ MeV.`, `$N - Z = ${A - 2 * Z}$ なので $23.7 \\times ${(A - 2 * Z) ** 2}/${A} = ${n(t.asym, 4)}$ MeV です。`], ['The Pauli principle fills proton and neutron levels separately, so an excess of either costs kinetic energy.', 'パウリの原理により陽子と中性子の準位は別々に埋まるので、どちらかが多すぎると運動エネルギーが余分にかかります。']]
          : [[`$Z(Z - 1) = ${Z * (Z - 1)}$ and $A^{1/3} = ${n(Math.cbrt(A), 4)}$.`, `$Z(Z - 1) = ${Z * (Z - 1)}$、$A^{1/3} = ${n(Math.cbrt(A), 4)}$ です。`], [`$0.711 \\times ${Z * (Z - 1)}/${n(Math.cbrt(A), 4)} = ${n(t.coul, 4)}$ MeV.`, `$0.711 \\times ${Z * (Z - 1)}/${n(Math.cbrt(A), 4)} = ${n(t.coul, 4)}$ MeV です。`], [`Every pair of protons repels, so this grows almost like $Z^2$: ${n(100 * t.coul / t.vol, 1)}% of the volume term here.`, `陽子のすべての組が反発し合うので、ほぼ $Z^2$ に比例して増えます。ここでは体積項の ${n(100 * t.coul / t.vol, 1)}% です。`]],
        set: setNZ(A, Z),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const A = r.pick([27, 40, 56, 80, 100, 125, 150, 180, 208, 238]);
        const c = Math.cbrt(A), z0 = (4 * AA + AC / c) / (2 * AC / c + 8 * AA / A);
        const zi = Math.round(z0);
        return {
          q: [`For mass number $A = ${A}$, which $Z$ maximises the liquid-drop binding energy (ignoring pairing)? Give $Z_0$ to one decimal.`, `質量数 $A = ${A}$ で、液滴の結合エネルギーを最大にする $Z$ はいくつですか（対項は無視）。$Z_0$ を小数第1位まで答えてください。`],
          a: { type: 'num', v: z0, tol: 0.06 },
          hint: ['Set $\\partial B/\\partial Z = 0$: only the Coulomb and asymmetry terms depend on $Z$.', '$\\partial B/\\partial Z = 0$ とおきます。$Z$ に依存するのはクーロン項と非対称項だけです。'],
          sol: [['$\\partial B/\\partial Z = -a_C(2Z - 1)/A^{1/3} + 4a_A(A - 2Z)/A = 0$.', '$\\partial B/\\partial Z = -a_C(2Z - 1)/A^{1/3} + 4a_A(A - 2Z)/A = 0$ です。'], [`$Z_0 = \\dfrac{4a_A + a_C A^{-1/3}}{2a_C A^{-1/3} + 8a_A/A} = ${n(z0, 3)}$.`, `$Z_0 = \\dfrac{4a_A + a_C A^{-1/3}}{2a_C A^{-1/3} + 8a_A/A} = ${n(z0, 3)}$ です。`], [`So the most stable isobar has $Z = ${zi}$ (${SYM[zi]}), with ${A - zi} neutrons: ${A - zi > zi ? `$N/Z = ${n((A - zi) / zi, 3)}$, the neutron excess that bends the valley away from $N = Z$` : 'close to $N = Z$'}.`, `よって最も安定な同重体は $Z = ${zi}$（${SYM[zi]}）で、中性子は ${A - zi} 個です。${A - zi > zi ? `$N/Z = ${n((A - zi) / zi, 3)}$ で、この中性子過剰が谷を $N = Z$ から曲げています。` : '$N = Z$ に近い値です。'}`]],
          set: setNZ(A, zi),
        };
      }
      if (form === 1) {
        const [A, Z] = r.pick([[210, 84], [226, 88], [232, 90], [238, 92], [222, 86], [212, 84], [244, 94], [252, 98]]);
        const q = B(A - 4, Z - 2) + BHE4 - B(A, Z);
        return {
          q: [`Using the liquid-drop formula for both nuclei and $B({}^4\\mathrm{He}) = 28.30$ MeV, estimate $Q_\\alpha$ for $${nuc(A, Z)} \\to ${nuc(A - 4, Z - 2)} + \\alpha$.`, `両方の原子核に液滴の式を使い、$B({}^4\\mathrm{He}) = 28.30$ MeV として、$${nuc(A, Z)} \\to ${nuc(A - 4, Z - 2)} + \\alpha$ の $Q_\\alpha$ を見積もってください。`],
          a: { type: 'num', v: q, tol: 0.03, unit: ['MeV', 'MeV'] },
          hint: ['$Q_\\alpha = B(\\text{daughter}) + B(\\alpha) - B(\\text{parent})$: the energy gained by rearranging the same nucleons.', '$Q_\\alpha = B(\\text{娘}) + B(\\alpha) - B(\\text{親})$ で、同じ核子を組み替えて得られるエネルギーです。'],
          sol: [[`$B(${nuc(A, Z)}) = ${n(B(A, Z), 5)}$ MeV and $B(${nuc(A - 4, Z - 2)}) = ${n(B(A - 4, Z - 2), 5)}$ MeV.`, `$B(${nuc(A, Z)}) = ${n(B(A, Z), 5)}$ MeV、$B(${nuc(A - 4, Z - 2)}) = ${n(B(A - 4, Z - 2), 5)}$ MeV です。`], [`$Q_\\alpha = ${n(B(A - 4, Z - 2), 5)} + 28.30 - ${n(B(A, Z), 5)} = ${n(q, 3)}$ MeV.`, `$Q_\\alpha = ${n(B(A - 4, Z - 2), 5)} + 28.30 - ${n(B(A, Z), 5)} = ${n(q, 3)}$ MeV です。`], ['Positive, so the decay is allowed; the formula is only good to a few MeV here (for several of these nuclei the measured value is 1 to 2.6 MeV higher), and the half-life depends on $Q$ exponentially, so real predictions use measured masses.', '正なので崩壊は許されます。ただしこの式の精度はここでは数 MeV 程度で（いくつかの原子核では測定値のほうが 1 から 2.6 MeV 高くなります）、半減期は $Q$ に指数関数的に依存するので、実際の予測には測定された質量を使います。']],
          set: setNZ(A, Z),
        };
      }
      const [A, Z] = r.pick([[236, 92], [240, 94], [252, 98], [200, 80], [180, 72], [120, 50], [100, 44]]);
      const q = 2 * B(A / 2, Z / 2) - B(A, Z);
      return {
        q: [`Estimate the energy released if $${nuc(A, Z)}$ split into two identical halves $${nuc(A / 2, Z / 2)}$, using the liquid-drop formula.`, `液滴の式を使って、$${nuc(A, Z)}$ が二つの同じ半分 $${nuc(A / 2, Z / 2)}$ に分裂するときに放出されるエネルギーを見積もってください。`],
        a: { type: 'num', v: q, tol: 0.05, rel: 0.003, unit: ['MeV', 'MeV'] },
        hint: ['$Q = 2B(A/2, Z/2) - B(A, Z)$.', '$Q = 2B(A/2, Z/2) - B(A, Z)$ です。'],
        sol: [[`$B(${nuc(A, Z)}) = ${n(B(A, Z), 5)}$ MeV, $B(${nuc(A / 2, Z / 2)}) = ${n(B(A / 2, Z / 2), 5)}$ MeV.`, `$B(${nuc(A, Z)}) = ${n(B(A, Z), 5)}$ MeV、$B(${nuc(A / 2, Z / 2)}) = ${n(B(A / 2, Z / 2), 5)}$ MeV です。`], [`$Q = 2 \\times ${n(B(A / 2, Z / 2), 5)} - ${n(B(A, Z), 5)} = ${n(q, 4)}$ MeV.`, `$Q = 2 \\times ${n(B(A / 2, Z / 2), 5)} - ${n(B(A, Z), 5)} = ${n(q, 4)}$ MeV です。`], [q > 0 ? `Positive: splitting gains Coulomb energy faster than it loses surface energy. ${A > 220 ? 'About 200 MeV per fission is a million times a chemical bond, which is the whole case for nuclear power.' : 'Yet the barrier against it is far too high for this to happen spontaneously at this mass.'}` : 'Negative: at this mass the extra surface outweighs the Coulomb gain, so the nucleus would have to be given energy to split.', q > 0 ? `正です。分裂では表面エネルギーの損失よりもクーロンエネルギーの得のほうが大きいのです。${A > 220 ? '1回の分裂でおよそ 200 MeV は化学結合の百万倍で、これが原子力の根拠です。' : 'ただしこの質量では障壁が高すぎて、自発的には起こりません。'}` : '負です。この質量では表面の増加がクーロンの得を上回るので、分裂させるにはエネルギーを与えなければなりません。']],
        set: setNZ(A, Z),
      };
    },
  ];

  /* ---------- 2. decay chains ---------- */
  // realistic parent/daughter pairs, half-lives in hours
  const PAIRS = [['{}^{99}\\mathrm{Mo}', '{}^{99m}\\mathrm{Tc}', 65.94, 6.0067], ['{}^{132}\\mathrm{Te}', '{}^{132}\\mathrm{I}', 76.9, 2.295], ['{}^{140}\\mathrm{Ba}', '{}^{140}\\mathrm{La}', 306.0, 40.29], ['{}^{90}\\mathrm{Sr}', '{}^{90}\\mathrm{Y}', 28.79 * 8766, 64.05], ['{}^{68}\\mathrm{Ge}', '{}^{68}\\mathrm{Ga}', 270.95 * 24, 1.1285], ['{}^{210}\\mathrm{Bi}', '{}^{210}\\mathrm{Po}', 5.012 * 24, 138.376 * 24]];
  const lg = (t) => Math.round(Math.log10(t) * 100) / 100;
  const setPair = (ta, tb) => { const a = lg(ta), b = lg(tb); return a >= -1 && a <= 4 && b >= -1 && b <= 4 ? { lA: a, lB: b } : undefined; };
  const timeStr = (h) => (h < 48 ? [`${n(h, 4)}\\ \\text{h}`, `${n(h, 4)}\\ \\text{h}`] : h < 24 * 365 ? [`${n(h / 24, 4)}\\ \\text{d}`, `${n(h / 24, 4)}\\ \\text{d}`] : [`${n(h / 8766, 4)}\\ \\text{y}`, `${n(h / 8766, 4)}\\ \\text{y}`]);
  Q['decay-chain'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick([0.5, 2, 6, 8.02 * 24, 12.3, 66, 100, 1000]);
        return {
          q: [`A nuclide has half-life $${n(t)}$ h. What is its decay constant $\\lambda$, in $\\text{h}^{-1}$?`, `半減期 $${n(t)}$ h の核種の崩壊定数 $\\lambda$ は何 $\\text{h}^{-1}$ ですか。`],
          a: { type: 'num', v: LN2 / t, unit: ['h⁻¹', 'h⁻¹'] },
          hint: ['$N = N_0e^{-\\lambda t}$ halves when $\\lambda t_{1/2} = \\ln 2$.', '$N = N_0e^{-\\lambda t}$ が半分になるのは $\\lambda t_{1/2} = \\ln 2$ のときです。'],
          sol: [[`$\\lambda = \\ln 2/t_{1/2} = 0.6931/${n(t)} = ${sig(LN2 / t, 4)}\\ \\text{h}^{-1}$.`, `$\\lambda = \\ln 2/t_{1/2} = 0.6931/${n(t)} = ${sig(LN2 / t, 4)}\\ \\text{h}^{-1}$ です。`], ['It is the probability per hour that any one nucleus decays, the same at every age.', 'これは一つの原子核が1時間あたりに崩壊する確率で、年齢によらず同じです。']],
          set: t >= 0.1 && t <= 1e4 ? { lA: lg(t) } : undefined,
        };
      }
      if (form === 1) {
        const k = r.int(1, 6), frac = r.chance(0.5);
        return {
          q: [frac ? `What fraction of a radioactive sample remains after ${k} half-lives?` : `What percentage of a sample has decayed after ${k} half-lives?`, frac ? `放射性試料は半減期の ${k} 倍の時間の後、どれだけの割合が残っていますか。` : `半減期の ${k} 倍の時間の後、試料の何パーセントが崩壊していますか。`],
          a: { type: 'num', v: frac ? 0.5 ** k : 100 * (1 - 0.5 ** k), unit: frac ? undefined : ['%', '%'], show: frac ? `1/${2 ** k}` : undefined },
          sol: [[`Each half-life halves what is left: $(1/2)^{${k}} = 1/${2 ** k}$ remains.`, `半減期ごとに残りが半分になるので $(1/2)^{${k}} = 1/${2 ** k}$ が残ります。`], frac ? ['The curve never reaches zero: a fixed fraction goes in each half-life, not a fixed amount.', '曲線は 0 になりません。半減期ごとに減るのは一定の量ではなく一定の割合だからです。'] : [`So $1 - 1/${2 ** k} = ${n(100 * (1 - 0.5 ** k), 3)}\\%$ has decayed.`, `よって $1 - 1/${2 ** k} = ${n(100 * (1 - 0.5 ** k), 3)}\\%$ が崩壊しています。`]],
        };
      }
      const t = r.pick([6.0067, 8.02 * 24, 66, 30.17 * 8766, 5730 * 8766, 1.28e9 * 8766]);
      const tau = t / LN2, [ten, tja] = timeStr(tau);
      const [hen] = timeStr(t);
      return {
        q: [`A nuclide has half-life $${hen}$. What is its mean lifetime $\\tau = 1/\\lambda$? Give it in the same unit.`, `半減期 $${hen}$ の核種の平均寿命 $\\tau = 1/\\lambda$ はいくらですか。同じ単位で答えてください。`],
        a: { type: 'num', v: t < 48 ? tau : t < 24 * 365 ? tau / 24 : tau / 8766, rel: 0.003 },
        hint: ['$\\tau = t_{1/2}/\\ln 2$.', '$\\tau = t_{1/2}/\\ln 2$ です。'],
        sol: [[`$\\tau = t_{1/2}/\\ln 2 = ${ten}$.`, `$\\tau = t_{1/2}/\\ln 2 = ${tja}$ です。`], ['It is longer than the half-life by $1/\\ln 2 \\approx 1.44$: after one mean life a fraction $1/e \\approx 37\\%$ remains.', '半減期より $1/\\ln 2 \\approx 1.44$ 倍長く、平均寿命の後には $1/e \\approx 37\\%$ が残ります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [pa, da, ta, tb] = r.pick(PAIRS.filter((p) => p[3] < p[2] && p[2] < 1e4));
        const la = LN2 / ta, lb = LN2 / tb, tm = Math.log(lb / la) / (lb - la);
        return {
          q: [`Pure $${pa}$ ($t_{1/2} = ${n(ta)}$ h) decays to $${da}$ ($t_{1/2} = ${n(tb)}$ h). After how many hours is the amount of $${da}$ largest?`, `純粋な $${pa}$（$t_{1/2} = ${n(ta)}$ h）が $${da}$（$t_{1/2} = ${n(tb)}$ h）に崩壊します。$${da}$ の量が最大になるのは何時間後ですか。`],
          a: { type: 'num', v: tm, rel: 0.003, unit: ['h', 'h'] },
          hint: ['At the peak $dN_B/dt = 0$, so $\\lambda_A N_A = \\lambda_B N_B$; differentiate Bateman\'s solution.', '最大では $dN_B/dt = 0$、つまり $\\lambda_A N_A = \\lambda_B N_B$ です。ベイトマンの解を微分してください。'],
          sol: [[`$\\lambda_A = ${sig(la, 4)}$, $\\lambda_B = ${sig(lb, 4)}\\ \\text{h}^{-1}$.`, `$\\lambda_A = ${sig(la, 4)}$、$\\lambda_B = ${sig(lb, 4)}\\ \\text{h}^{-1}$ です。`], [`$t_{\\max} = \\dfrac{\\ln(\\lambda_B/\\lambda_A)}{\\lambda_B - \\lambda_A} = \\dfrac{${n(Math.log(lb / la), 4)}}{${sig(lb - la, 4)}} = ${n(tm, 4)}$ h.`, `$t_{\\max} = \\dfrac{\\ln(\\lambda_B/\\lambda_A)}{\\lambda_B - \\lambda_A} = \\dfrac{${n(Math.log(lb / la), 4)}}{${sig(lb - la, 4)}} = ${n(tm, 4)}$ h です。`], [pa.includes('99') ? 'This is why hospitals "milk" a molybdenum generator about once a day: the technetium has nearly grown back by then.' : 'At that moment the daughter is being made exactly as fast as it decays, and its activity equals the parent\'s.', pa.includes('99') ? '病院がモリブデンのジェネレーターからほぼ1日に1回テクネチウムを取り出すのはこのためで、そのころにはほぼ元の量に戻っています。' : 'その瞬間、娘は崩壊するのとちょうど同じ速さで作られ、その放射能は親の放射能と等しくなります。']],
          set: setPair(ta, tb),
        };
      }
      if (form === 1) {
        const ta = r.pick([4, 6, 8, 10, 12, 20]), tb = r.pick([1, 2, 3, 0.5].filter((x) => x < ta)), t = r.pick([1, 2, 3, 4, 5, 6, 8]);
        const la = LN2 / ta, lb = LN2 / tb, NB = la / (lb - la) * (Math.exp(-la * t) - Math.exp(-lb * t));
        return {
          q: [`A pure parent ($t_{1/2} = ${ta}$ h) feeds a daughter ($t_{1/2} = ${tb}$ h). What fraction $N_B/N_A(0)$ of the original atoms is daughter after $${t}$ h? Give three decimals.`, `純粋な親（$t_{1/2} = ${ta}$ h）が娘（$t_{1/2} = ${tb}$ h）をつくります。$${t}$ h 後、もとの原子のうち娘である割合 $N_B/N_A(0)$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: NB, tol: 0.0015 },
          hint: ['Bateman: $N_B = \\dfrac{\\lambda_A}{\\lambda_B - \\lambda_A}\\left(e^{-\\lambda_At} - e^{-\\lambda_Bt}\\right)N_A(0)$.', 'ベイトマンの式 $N_B = \\dfrac{\\lambda_A}{\\lambda_B - \\lambda_A}\\left(e^{-\\lambda_At} - e^{-\\lambda_Bt}\\right)N_A(0)$ を使います。'],
          sol: [[`$\\lambda_A = \\ln2/${ta} = ${n(la, 5)}$, $\\lambda_B = \\ln2/${tb} = ${n(lb, 5)}\\ \\text{h}^{-1}$.`, `$\\lambda_A = \\ln2/${ta} = ${n(la, 5)}$、$\\lambda_B = \\ln2/${tb} = ${n(lb, 5)}\\ \\text{h}^{-1}$ です。`], [`$N_B = ${n(la / (lb - la), 4)}\\,(${n(Math.exp(-la * t), 4)} - ${n(Math.exp(-lb * t), 4)}) = ${n(NB, 4)}$.`, `$N_B = ${n(la / (lb - la), 4)}\\,(${n(Math.exp(-la * t), 4)} - ${n(Math.exp(-lb * t), 4)}) = ${n(NB, 4)}$ です。`], ['The daughter never holds more than a modest share: it is short-lived, so it decays almost as soon as it is made.', '娘の割合はそれほど大きくなりません。寿命が短いので、作られるとすぐに崩壊するからです。']],
          set: setPair(ta, tb),
        };
      }
      const iso = r.pick([['{}^{131}\\mathrm{I}', 131, 8.0252 * 24], ['{}^{60}\\mathrm{Co}', 60, 5.2714 * 8766], ['{}^{137}\\mathrm{Cs}', 137, 30.08 * 8766], ['{}^{99m}\\mathrm{Tc}', 99, 6.0067], ['{}^{226}\\mathrm{Ra}', 226, 1600 * 8766]]);
      const m = r.pick([1, 2, 5, 10]), Nat = m * 1e-6 / iso[1] * 6.02214076e23, la = LN2 / (iso[2] * 3600), Act = la * Nat;
      return {
        q: [`What is the activity, in becquerels, of $${m}\\ \\mu\\text{g}$ of $${iso[0]}$ (half-life ${iso[2] < 48 ? n(iso[2], 4) + ' h' : iso[2] < 8766 ? n(iso[2] / 24, 4) + ' days' : n(iso[2] / 8766, 4) + ' years'})?`, `$${iso[0]}$（半減期 ${iso[2] < 48 ? n(iso[2], 4) + ' 時間' : iso[2] < 8766 ? n(iso[2] / 24, 4) + ' 日' : n(iso[2] / 8766, 4) + ' 年'}）$${m}\\ \\mu\\text{g}$ の放射能は何ベクレルですか。`],
        a: { type: 'num', v: Act, rel: 0.01, unit: ['Bq', 'Bq'] },
        hint: ['Count the atoms with Avogadro\'s number, then $A = \\lambda N$ with $\\lambda$ in $\\text{s}^{-1}$.', 'アボガドロ数で原子の数を数え、$\\lambda$ を $\\text{s}^{-1}$ にして $A = \\lambda N$ とします。'],
        sol: [[`$N = ${m}\\times10^{-6}/${iso[1]} \\times 6.022\\times10^{23} = ${sig(Nat, 4)}$ atoms.`, `$N = ${m}\\times10^{-6}/${iso[1]} \\times 6.022\\times10^{23} = ${sig(Nat, 4)}$ 個です。`], [`$\\lambda = \\ln2/t_{1/2} = ${sig(la, 4)}\\ \\text{s}^{-1}$, so $A = \\lambda N = ${sig(Act, 3)}$ Bq.`, `$\\lambda = \\ln2/t_{1/2} = ${sig(la, 4)}\\ \\text{s}^{-1}$ なので $A = \\lambda N = ${sig(Act, 3)}$ Bq です。`], ['A microgram is invisible, yet short half-lives make it intensely radioactive: activity is inversely proportional to half-life at fixed mass.', '1マイクログラムは目に見えませんが、半減期が短いと強い放射能を持ちます。質量が同じなら放射能は半減期に反比例します。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [pa, da, ta, tb] = r.pick(PAIRS.filter((p) => p[3] < p[2]));
        const la = LN2 / ta, lb = LN2 / tb, ratio = lb / (lb - la);
        return {
          q: [`Long after it is prepared, a sample of $${pa}$ ($t_{1/2} = ${timeStr(ta)[0]}$) is in equilibrium with its daughter $${da}$ ($t_{1/2} = ${timeStr(tb)[0]}$). What is the ratio of daughter to parent activity?`, `作ってから十分に時間がたった $${pa}$（$t_{1/2} = ${timeStr(ta)[1]}$）の試料は、娘 $${da}$（$t_{1/2} = ${timeStr(tb)[1]}$）と平衡にあります。娘と親の放射能の比はいくつですか。`],
          a: { type: 'num', v: ratio, rel: 0.001 },
          hint: ['At late times the $e^{-\\lambda_Bt}$ term has died out, leaving $N_B/N_A = \\lambda_A/(\\lambda_B - \\lambda_A)$.', '遅い時刻では $e^{-\\lambda_Bt}$ の項が消え、$N_B/N_A = \\lambda_A/(\\lambda_B - \\lambda_A)$ が残ります。'],
          sol: [['Activity ratio $\\dfrac{\\lambda_BN_B}{\\lambda_AN_A} = \\dfrac{\\lambda_B}{\\lambda_B - \\lambda_A} = \\dfrac{t_A}{t_A - t_B}$.', '放射能の比は $\\dfrac{\\lambda_BN_B}{\\lambda_AN_A} = \\dfrac{\\lambda_B}{\\lambda_B - \\lambda_A} = \\dfrac{t_A}{t_A - t_B}$ です。'], [`$= ${n(ratio, 5)}$.`, `$= ${n(ratio, 5)}$ です。`], [ratio < 1.01 ? 'Essentially 1: secular equilibrium, because the parent barely decays on the daughter\'s timescale.' : 'Slightly above 1: transient equilibrium, the daughter\'s activity running a fixed factor above the parent\'s.', ratio < 1.01 ? 'ほぼ 1 で永続平衡です。娘の時間尺度では親はほとんど崩壊しないからです。' : '1 より少し大きく、過渡平衡です。娘の放射能は親より一定の割合だけ大きく推移します。']],
          set: setPair(ta, tb),
        };
      }
      if (form === 1) {
        const [ta, tb] = r.pick([[4, 1], [2, 1], [6, 2], [3, 1], [8, 2], [9, 3]]);
        const c = (1 / ta) / (1 / tb - 1 / ta);
        return {
          q: [`A pure parent with $t_{1/2} = ${ta}$ h feeds a daughter with $t_{1/2} = ${tb}$ h. Write $N_B(t)/N_A(0)$ as a function of $t$ in hours (powers of 2 are fine).`, `$t_{1/2} = ${ta}$ h の純粋な親が $t_{1/2} = ${tb}$ h の娘をつくります。$N_B(t)/N_A(0)$ を時間 $t$（h）の式で表してください（2 のべき乗を使ってかまいません）。`],
          a: { type: 'expr', v: `${n(c, 8)}*(2^(-t/${ta})-2^(-t/${tb}))`, vars: ['t'], dom: { t: [0.3, 10] }, lhs: ['$N_B/N_A(0) =$', '$N_B/N_A(0) =$'] },
          hint: ['$e^{-\\lambda t} = 2^{-t/t_{1/2}}$, and the prefactor $\\lambda_A/(\\lambda_B - \\lambda_A)$ only needs the ratio of half-lives.', '$e^{-\\lambda t} = 2^{-t/t_{1/2}}$ で、係数 $\\lambda_A/(\\lambda_B - \\lambda_A)$ には半減期の比だけが要ります。'],
          sol: [[`$\\dfrac{\\lambda_A}{\\lambda_B - \\lambda_A} = \\dfrac{1/${ta}}{1/${tb} - 1/${ta}} = ${n(c, 4)}$.`, `$\\dfrac{\\lambda_A}{\\lambda_B - \\lambda_A} = \\dfrac{1/${ta}}{1/${tb} - 1/${ta}} = ${n(c, 4)}$ です。`], [`$N_B/N_A(0) = ${n(c, 4)}\\left(2^{-t/${ta}} - 2^{-t/${tb}}\\right)$.`, `$N_B/N_A(0) = ${n(c, 4)}\\left(2^{-t/${ta}} - 2^{-t/${tb}}\\right)$ です。`], ['It starts at zero, rises while the fast term dies, then follows the parent down: the orange curve in the plot.', '0 から始まり、速い項が消える間に増え、その後は親に沿って減っていきます。図の橙色の曲線です。']],
          set: setPair(ta, tb),
        };
      }
      const f = r.pick([0.8, 0.6, 0.5, 0.35, 0.25, 0.12, 0.05]);
      const age = -5730 * Math.log(f) / LN2;
      return {
        q: [`A wooden artefact has ${n(100 * f)}% of the carbon-14 activity of living wood. Taking $t_{1/2} = 5730$ years, how old is it?`, `ある木製品の炭素14の放射能は、生きている木の ${n(100 * f)}% です。$t_{1/2} = 5730$ 年として、何年前のものですか。`],
        a: { type: 'num', v: age, rel: 0.003, unit: ['years', '年'] },
        hint: ['Invert $f = 2^{-t/t_{1/2}}$.', '$f = 2^{-t/t_{1/2}}$ を逆に解いてください。'],
        sol: [[`$t = -t_{1/2}\\log_2 f = 5730 \\times ${n(-Math.log2(f), 4)}$.`, `$t = -t_{1/2}\\log_2 f = 5730 \\times ${n(-Math.log2(f), 4)}$ です。`], [`$t \\approx ${n(age, 4)}$ years.`, `$t \\approx ${n(age, 4)}$ 年です。`], [`${f < 0.1 ? 'With so little left, a small error in the measured activity becomes a large error in age; past about ten half-lives the method gives out.' : 'Each halving of the activity adds 5730 years, which is what makes the clock usable for the last fifty thousand years.'}`, `${f < 0.1 ? 'これほど少ないと、放射能の小さな測定誤差が年代の大きな誤差になります。半減期の約10倍を超えるとこの方法は使えません。' : '放射能が半分になるごとに 5730 年が加わります。そのため過去5万年ほどの時計として使えます。'}`]],
      };
    },
  ];

  /* ---------- 3. alpha decay by tunnelling ---------- */
  const HC = 197.327, KE = 1.439964, MALPHA = 3727.379, UMEV = 931.494, R0 = 1.2, CFM = 2.99792458e23;
  const ELS = [['Po', 84, 214], ['Rn', 86, 222], ['Ra', 88, 226], ['Th', 90, 230], ['U', 92, 236]];
  function alpha(Z, A, Qv) {
    const Zd = Z - 2, Ad = A - 4, Md = Ad * UMEV, mu = MALPHA * Md / (MALPHA + Md), R = R0 * (Math.cbrt(Ad) + Math.cbrt(4)), b = 2 * Zd * KE / Qv, x = Math.min(1, R / b);
    const G = 2 * Math.sqrt(2 * mu * Qv) / HC * b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
    const f = Math.sqrt(2 * Qv / mu) * CFM / (2 * R);
    return { Zd, Ad, mu, R, b, x, G, f, VR: 2 * Zd * KE / R, thalf: LN2 / (f * Math.exp(-G)) };
  }
  const pickEl = (r) => { const i = r.int(0, 4); return [i, ...ELS[i]]; };
  Q['alpha-tunnelling'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [A, Z] = r.pick([[238, 92], [226, 88], [222, 86], [210, 84], [232, 90], [241, 95], [239, 94], [212, 83]]);
        return {
          q: [`$${nuc(A, Z)}$ emits an alpha particle. Give the atomic number and mass number of the daughter.`, `$${nuc(A, Z)}$ がアルファ粒子を出します。娘核の原子番号と質量数を答えてください。`],
          a: { type: 'tuple', v: [Z - 2, A - 4], labels: ['$Z$', '$A$'], tol: 0.01 },
          hint: ['An alpha particle is a helium-4 nucleus: two protons and two neutrons.', 'アルファ粒子はヘリウム4の原子核で、陽子2個と中性子2個です。'],
          sol: [[`$Z = ${Z} - 2 = ${Z - 2}$ and $A = ${A} - 4 = ${A - 4}$: $${nuc(A - 4, Z - 2)}$.`, `$Z = ${Z} - 2 = ${Z - 2}$、$A = ${A} - 4 = ${A - 4}$ で、$${nuc(A - 4, Z - 2)}$ です。`], ['The alpha leaves against the Coulomb field of this daughter, with charge $' + (Z - 2) + 'e$: that field forms the barrier.', `アルファ粒子はこの娘核の電荷 $${Z - 2}e$ のクーロン場に逆らって出ていきます。この場が障壁をつくります。`]],
        };
      }
      if (form === 1) {
        const [i, sym, Z, A] = pickEl(r), rr = r.pick([10, 15, 20, 30, 40, 50]);
        const V = 2 * (Z - 2) * KE / rr;
        return {
          q: [`What is the Coulomb potential energy of an alpha particle at $r = ${rr}$ fm from the centre of the daughter of ${sym} ($Z_d = ${Z - 2}$)? Use $e^2/4\\pi\\varepsilon_0 = 1.44$ MeV fm.`, `${sym} の娘核（$Z_d = ${Z - 2}$）の中心から $r = ${rr}$ fm にあるアルファ粒子のクーロン位置エネルギーはいくらですか。$e^2/4\\pi\\varepsilon_0 = 1.44$ MeV fm を使ってください。`],
          a: { type: 'num', v: V, rel: 0.003, unit: ['MeV', 'MeV'] },
          sol: [[`$V = \\dfrac{2Z_de^2}{4\\pi\\varepsilon_0 r} = \\dfrac{2 \\times ${Z - 2} \\times 1.44}{${rr}} = ${n(V, 4)}$ MeV.`, `$V = \\dfrac{2Z_de^2}{4\\pi\\varepsilon_0 r} = \\dfrac{2 \\times ${Z - 2} \\times 1.44}{${rr}} = ${n(V, 4)}$ MeV です。`], [V > 9.2 ? 'Higher than any alpha energy in the figure: at this distance the particle is still inside the forbidden region.' : 'Comparable to alpha energies: around here the barrier ends and the particle emerges.', V > 9.2 ? '図のどのアルファのエネルギーよりも高く、この距離ではまだ禁止領域の中にいます。' : 'アルファのエネルギーと同程度で、このあたりで障壁が終わり粒子が外に出ます。']],
          set: { el: i },
        };
      }
      const [i, sym, Z] = pickEl(r), Qv = r.pick([4.27, 4.77, 4.87, 5.49, 5.59, 6.0, 7.69, 8.78]);
      const b = 2 * (Z - 2) * KE / Qv;
      return {
        q: [`An alpha of energy $Q = ${Qv}$ MeV leaves ${sym} ($Z_d = ${Z - 2}$). At what distance $b$ does it emerge from the Coulomb barrier, where $V(b) = Q$?`, `エネルギー $Q = ${Qv}$ MeV のアルファ粒子が ${sym}（$Z_d = ${Z - 2}$）から出ます。$V(b) = Q$ となる、クーロン障壁から抜け出る距離 $b$ はいくらですか。`],
        a: { type: 'num', v: b, rel: 0.003, unit: ['fm', 'fm'] },
        hint: ['Solve $2Z_d \\times 1.44\\ \\text{MeV fm}/b = Q$.', '$2Z_d \\times 1.44\\ \\text{MeV fm}/b = Q$ を解いてください。'],
        sol: [[`$b = 2 \\times ${Z - 2} \\times 1.44/${Qv} = ${n(b, 4)}$ fm.`, `$b = 2 \\times ${Z - 2} \\times 1.44/${Qv} = ${n(b, 4)}$ fm です。`], [`The nucleus has radius about 9 fm, so the alpha must cross some ${n(b - 9, 2)} fm of classically forbidden ground.`, `原子核の半径は約 9 fm なので、アルファ粒子は古典的に禁止された約 ${n(b - 9, 2)} fm を越えなければなりません。`]],
        set: Qv >= 3.8 && Qv <= 9.2 ? { el: i, Q: Qv } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [i, sym, Z, A] = pickEl(r), a = alpha(Z, A, 5);
        return {
          q: [`For ${sym} ($Z_d = ${Z - 2}$, $A_d = ${A - 4}$), take the touching radius $R = 1.2(A_d^{1/3} + 4^{1/3})$ fm. How high is the Coulomb barrier $V(R)$?`, `${sym}（$Z_d = ${Z - 2}$、$A_d = ${A - 4}$）について、接触半径を $R = 1.2(A_d^{1/3} + 4^{1/3})$ fm とします。クーロン障壁の高さ $V(R)$ はいくらですか。`],
          a: { type: 'num', v: a.VR, rel: 0.004, unit: ['MeV', 'MeV'] },
          hint: ['First $R$, then $V = 2Z_d \\times 1.44/R$.', 'まず $R$ を求め、次に $V = 2Z_d \\times 1.44/R$ です。'],
          sol: [[`$R = 1.2(${n(Math.cbrt(A - 4), 4)} + ${n(Math.cbrt(4), 4)}) = ${n(a.R, 4)}$ fm.`, `$R = 1.2(${n(Math.cbrt(A - 4), 4)} + ${n(Math.cbrt(4), 4)}) = ${n(a.R, 4)}$ fm です。`], [`$V(R) = 2 \\times ${Z - 2} \\times 1.44/${n(a.R, 4)} = ${n(a.VR, 4)}$ MeV.`, `$V(R) = 2 \\times ${Z - 2} \\times 1.44/${n(a.R, 4)} = ${n(a.VR, 4)}$ MeV です。`], ['Five to seven times the 4 to 9 MeV the alpha actually carries: classically it could never get out.', 'アルファ粒子が実際に持つ 4 から 9 MeV の5から7倍で、古典的には決して出られません。']],
          set: { el: i },
        };
      }
      if (form === 1) {
        const G = r.pick([60, 70, 75, 80, 85, 90, 95]), f = r.pick([1e21, 1.5e21, 2e21]);
        const th = LN2 / (f * Math.exp(-G));
        const lgT = Math.log10(th);
        return {
          q: [`An alpha hits the barrier $f = ${sig(f, 2)}$ times per second, and each time escapes with probability $e^{-G}$, $G = ${G}$. What is $\\log_{10}$ of the half-life in seconds?`, `アルファ粒子は毎秒 $f = ${sig(f, 2)}$ 回障壁に当たり、そのたびに確率 $e^{-G}$（$G = ${G}$）で抜け出します。半減期（秒）の $\\log_{10}$ はいくつですか。`],
          a: { type: 'num', v: lgT, tol: 0.02 },
          hint: ['$\\lambda = fe^{-G}$ and $t_{1/2} = \\ln 2/\\lambda$; work with logarithms.', '$\\lambda = fe^{-G}$、$t_{1/2} = \\ln 2/\\lambda$ です。対数で計算してください。'],
          sol: [[`$\\log_{10}t_{1/2} = \\log_{10}\\ln 2 - \\log_{10}f + G\\log_{10}e = ${n(Math.log10(LN2), 4)} - ${n(Math.log10(f), 4)} + ${n(G * Math.LOG10E, 4)}$.`, `$\\log_{10}t_{1/2} = \\log_{10}\\ln 2 - \\log_{10}f + G\\log_{10}e = ${n(Math.log10(LN2), 4)} - ${n(Math.log10(f), 4)} + ${n(G * Math.LOG10E, 4)}$ です。`], [`$= ${n(lgT, 3)}$, a half-life of $${sig(th, 3)}$ s${th > 3.156e7 ? ` (about ${sig(th / 3.15576e7, 2)} years)` : ''}.`, `$= ${n(lgT, 3)}$ で、半減期は $${sig(th, 3)}$ s${th > 3.156e7 ? `（約 ${sig(th / 3.15576e7, 2)} 年）` : ''} です。`], ['Each unit of $G$ multiplies the half-life by $e$: that is why small changes in $Q$ move half-lives by many powers of ten.', '$G$ が 1 増えるごとに半減期は $e$ 倍になります。$Q$ のわずかな変化で半減期が何桁も変わるのはこのためです。']],
        };
      }
      const G = r.pick([40, 55, 70, 85, 100]);
      return {
        q: [`If the Gamow factor is $G = ${G}$, what is $\\log_{10}$ of the escape probability $e^{-G}$ per attempt?`, `ガモフ因子が $G = ${G}$ のとき、1回あたりの脱出確率 $e^{-G}$ の $\\log_{10}$ はいくつですか。`],
        a: { type: 'num', v: -G * Math.LOG10E, tol: 0.01 },
        sol: [[`$\\log_{10}e^{-G} = -G\\log_{10}e = -${G} \\times 0.4343 = ${n(-G * Math.LOG10E, 4)}$.`, `$\\log_{10}e^{-G} = -G\\log_{10}e = -${G} \\times 0.4343 = ${n(-G * Math.LOG10E, 4)}$ です。`], ['A probability like $10^{' + Math.round(-G * Math.LOG10E) + '}$ per knock is made up for by the $10^{21}$ knocks per second.', `1回あたり $10^{${Math.round(-G * Math.LOG10E)}}$ 程度の確率を、毎秒 $10^{21}$ 回の衝突が補います。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [i, sym, Z, A] = pickEl(r), Qv = r.pick([4.2, 4.5, 4.8, 5.2, 5.6, 6.1, 6.9, 7.8]);
        const a = alpha(Z, A, Qv);
        return {
          q: [`For ${sym} ($Z_d = ${Z - 2}$) with $Q = ${Qv}$ MeV, the reduced mass is $\\mu c^2 = ${n(a.mu, 5)}$ MeV and $R = ${n(a.R, 4)}$ fm. Compute the Gamow factor $G = \\frac{2\\sqrt{2\\mu Q}}{\\hbar c}\\,b\\left[\\arccos\\sqrt{x} - \\sqrt{x(1 - x)}\\right]$, $x = R/b$, with $\\hbar c = 197.33$ MeV fm.`, `${sym}（$Z_d = ${Z - 2}$）で $Q = ${Qv}$ MeV、換算質量 $\\mu c^2 = ${n(a.mu, 5)}$ MeV、$R = ${n(a.R, 4)}$ fm とします。$\\hbar c = 197.33$ MeV fm として、ガモフ因子 $G = \\frac{2\\sqrt{2\\mu Q}}{\\hbar c}\\,b\\left[\\arccos\\sqrt{x} - \\sqrt{x(1 - x)}\\right]$（$x = R/b$）を計算してください。`],
          a: { type: 'num', v: a.G, rel: 0.004 },
          hint: ['Start with $b = 2Z_d \\times 1.44/Q$; the bracket is the thick-barrier value $\\pi/2$ reduced by the finite radius.', 'まず $b = 2Z_d \\times 1.44/Q$ を求めます。括弧の中は厚い障壁の値 $\\pi/2$ が有限の半径の分だけ減ったものです。'],
          sol: [[`$b = ${n(a.b, 4)}$ fm, $x = R/b = ${n(a.x, 4)}$, and the bracket is $${n(Math.acos(Math.sqrt(a.x)) - Math.sqrt(a.x * (1 - a.x)), 4)}$.`, `$b = ${n(a.b, 4)}$ fm、$x = R/b = ${n(a.x, 4)}$ で、括弧の中は $${n(Math.acos(Math.sqrt(a.x)) - Math.sqrt(a.x * (1 - a.x)), 4)}$ です。`], [`$\\frac{2\\sqrt{2\\mu Q}}{\\hbar c} = ${n(2 * Math.sqrt(2 * a.mu * Qv) / HC, 4)}\\ \\text{fm}^{-1}$, so $G = ${n(a.G, 4)}$.`, `$\\frac{2\\sqrt{2\\mu Q}}{\\hbar c} = ${n(2 * Math.sqrt(2 * a.mu * Qv) / HC, 4)}\\ \\text{fm}^{-1}$ なので $G = ${n(a.G, 4)}$ です。`], [`The escape probability $e^{-G} \\approx 10^{${n(-a.G * Math.LOG10E, 1)}}$: this is the readout's Gamow factor.`, `脱出確率は $e^{-G} \\approx 10^{${n(-a.G * Math.LOG10E, 1)}}$ で、読み取り欄のガモフ因子がこれです。`]],
          set: { el: i, Q: Qv },
        };
      }
      if (form === 1) {
        const [i, sym, Z, A] = pickEl(r), Q1 = r.pick([4.5, 5, 5.5, 6, 6.5]), Q2 = Q1 + r.pick([0.5, 1]);
        const a1 = alpha(Z, A, Q1), a2 = alpha(Z, A, Q2), d = Math.log10(a1.thalf / a2.thalf);
        return {
          q: [`In the tunnelling model for ${sym}, by how many powers of ten does the half-life drop when $Q$ rises from $${Q1}$ to $${Q2}$ MeV? ($G = ${n(a1.G, 2)}$ at $${Q1}$ MeV and $${n(a2.G, 2)}$ at $${Q2}$ MeV; the knock rate changes by the factor $\\sqrt{${Q2}/${Q1}}$.)`, `${sym} のトンネル効果のモデルで、$Q$ を $${Q1}$ から $${Q2}$ MeV に上げると、半減期は何桁短くなりますか（$G$ は $${Q1}$ MeV で $${n(a1.G, 2)}$、$${Q2}$ MeV で $${n(a2.G, 2)}$。衝突の頻度は $\\sqrt{${Q2}/${Q1}}$ 倍になります）。`],
          a: { type: 'num', v: d, tol: 0.02 },
          hint: ['$t_{1/2} \\propto e^{G}/f$, so $\\log_{10}$ of the ratio is $(G_1 - G_2)\\log_{10}e + \\log_{10}(f_2/f_1)$.', '$t_{1/2} \\propto e^{G}/f$ なので、比の $\\log_{10}$ は $(G_1 - G_2)\\log_{10}e + \\log_{10}(f_2/f_1)$ です。'],
          sol: [[`$(G_1 - G_2)\\log_{10}e = ${n(a1.G - a2.G, 4)} \\times 0.4343 = ${n((a1.G - a2.G) * Math.LOG10E, 4)}$.`, `$(G_1 - G_2)\\log_{10}e = ${n(a1.G - a2.G, 4)} \\times 0.4343 = ${n((a1.G - a2.G) * Math.LOG10E, 4)}$ です。`], [`Plus $\\log_{10}\\sqrt{${Q2}/${Q1}} = ${n(Math.log10(Math.sqrt(Q2 / Q1)), 4)}$, total $${n(d, 3)}$.`, `これに $\\log_{10}\\sqrt{${Q2}/${Q1}} = ${n(Math.log10(Math.sqrt(Q2 / Q1)), 4)}$ を加えて、合計 $${n(d, 3)}$ です。`], [`A ${n(100 * (Q2 - Q1) / Q1, 0)}% change in energy shortens the half-life ${sig(10 ** d, 2)}-fold: the Geiger-Nuttall law, and almost all of it comes from the exponent.`, `エネルギーの ${n(100 * (Q2 - Q1) / Q1, 0)}% の変化で半減期は ${sig(10 ** d, 2)} 分の一になります。これがガイガー・ヌッタルの法則で、その大部分は指数から来ています。`]],
          set: { el: i, Q: Q2 },
        };
      }
      const [i, sym, Z, A] = pickEl(r), a = alpha(Z, A, 5), c = Math.PI * 2 * (Z - 2) * KE * Math.sqrt(2 * a.mu) / HC;
      return {
        q: [`For a very thick barrier ($b \\gg R$) the bracket tends to $\\pi/2$. Write the Gamow factor of ${sym} ($Z_d = ${Z - 2}$, $\\mu c^2 = ${n(a.mu, 5)}$ MeV) as a function of $Q$ in MeV.`, `障壁がとても厚い（$b \\gg R$）と括弧の中は $\\pi/2$ に近づきます。${sym}（$Z_d = ${Z - 2}$、$\\mu c^2 = ${n(a.mu, 5)}$ MeV）のガモフ因子を MeV 単位の $Q$ の式で表してください。`],
        a: { type: 'expr', v: `${n(c, 7)}/sqrt(Q)`, vars: ['Q'], dom: { Q: [4, 9] }, lhs: ['$G(Q) \\approx$', '$G(Q) \\approx$'] },
        hint: ['Substitute $b = 2Z_d \\times 1.44/Q$ into $\\frac{2\\sqrt{2\\mu Q}}{\\hbar c}\\,b\\,\\frac{\\pi}{2}$.', '$\\frac{2\\sqrt{2\\mu Q}}{\\hbar c}\\,b\\,\\frac{\\pi}{2}$ に $b = 2Z_d \\times 1.44/Q$ を代入してください。'],
        sol: [[`$G = \\dfrac{\\pi\\sqrt{2\\mu c^2 Q}}{\\hbar c}\\cdot\\dfrac{2 \\times ${Z - 2} \\times 1.44}{Q} = \\dfrac{\\pi \\times ${2 * (Z - 2)} \\times 1.44 \\times \\sqrt{2\\mu c^2}}{197.33\\sqrt Q}$.`, `$G = \\dfrac{\\pi\\sqrt{2\\mu c^2 Q}}{\\hbar c}\\cdot\\dfrac{2 \\times ${Z - 2} \\times 1.44}{Q} = \\dfrac{\\pi \\times ${2 * (Z - 2)} \\times 1.44 \\times \\sqrt{2\\mu c^2}}{197.33\\sqrt Q}$ です。`], [`$G(Q) \\approx ${n(c, 4)}/\\sqrt Q$.`, `$G(Q) \\approx ${n(c, 4)}/\\sqrt Q$ です。`], ['So $\\log t_{1/2}$ is linear in $1/\\sqrt Q$: the Geiger-Nuttall law. The finite radius lowers $G$ by a few tens, which the full formula keeps.', 'よって $\\log t_{1/2}$ は $1/\\sqrt Q$ の一次式で、これがガイガー・ヌッタルの法則です。有限の半径のために $G$ は数十ほど小さくなり、完全な式ではそれも含まれます。']],
        set: { el: i },
      };
    },
  ];
})();
