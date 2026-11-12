'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, C = 0.299792458, MZ = 91.1876, AS = 0.118;
  const QK = { u: [0.5, 1 / 3, 2 / 3], d: [-0.5, 1 / 3, -1 / 3], s: [0, -2 / 3, -1 / 3] };
  const BARY = [['uud', 'p', 'p'], ['udd', 'n', 'n'], ['uus', '\\Sigma^+', 'Σ⁺'], ['dds', '\\Sigma^-', 'Σ⁻'], ['uss', '\\Xi^0', 'Ξ⁰'], ['dss', '\\Xi^-', 'Ξ⁻'], ['uuu', '\\Delta^{++}', 'Δ⁺⁺'], ['ddd', '\\Delta^-', 'Δ⁻'], ['sss', '\\Omega^-', 'Ω⁻']];
  const qIdx = { u: 0, d: 1, s: 2 };
  const sumW = (s) => s.split('').reduce((a, f) => [a[0] + QK[f][0], a[1] + QK[f][1], a[2] + QK[f][2]], [0, 0, 0]);

  /* ---------------- invariant-mass ---------------- */
  Q['invariant-mass'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const pT = r.pick([0.5, 1, 2, 3, 5, 10, 20, 45]), B = r.pick([1, 2, 3, 3.8, 4]), R = pT / (C * B);
        return {
          q: [`A singly charged particle has momentum $${n(pT, 1)}$ GeV across a magnetic field of $${n(B, 1)}$ T. What is the radius of its track, in metres?`, `電荷 1 の粒子が、$${n(B, 1)}$ T の磁場に垂直な運動量 $${n(pT, 1)}$ GeV をもっています。飛跡の半径は何メートルですか。`],
          a: { type: 'num', v: R, rel: 0.01, unit: ['m', 'm'] },
          hint: ['$R = p_T/(0.3\\,B)$ with GeV, tesla and metres.', 'GeV、テスラ、メートルで $R = p_T/(0.3\\,B)$ です。'],
          sol: [[`$R = ${n(pT, 1)}/(0.2998\\times${n(B, 1)})$.`, `$R = ${n(pT, 1)}/(0.2998\\times${n(B, 1)})$ です。`], [`$R = ${n(R, 3)}$ m: ${R > 5 ? 'much larger than a tracker about a metre across, so the track is only slightly bowed.' : 'comparable to the size of a tracker, so the track is strongly curved.'}`, `$R = ${n(R, 3)}$ m です。${R > 5 ? '差し渡し 1 メートルほどの飛跡検出器よりずっと大きいので、飛跡はわずかにしか曲がりません。' : '飛跡検出器の大きさと同じくらいなので、飛跡は大きく曲がります。'}`]],
          ...(B <= 4 && B >= 0.5 && B !== 3.8 ? { set: { B } } : {}),
        };
      }
      const M = r.pick([0.775, 3.097, 91.19]), p = r.pick([1, 3, 5, 10, 20, 40]), E = Math.hypot(p, M);
      return {
        q: [`A particle of mass $${n(M, 3)}$ GeV and momentum $${p}$ GeV decays into two particles. What is the sum of their energies, in GeV?`, `質量 $${n(M, 3)}$ GeV、運動量 $${p}$ GeV の粒子が二つの粒子に崩壊します。そのエネルギーの和は何 GeV ですか。`],
        a: { type: 'num', v: E, rel: 0.003, unit: ['GeV', 'GeV'] },
        hint: ['Energy is conserved: $E = \\sqrt{p^2 + M^2}$.', 'エネルギーは保存します。$E = \\sqrt{p^2 + M^2}$ です。'],
        sol: [['The daughters share the parent’s energy whatever the decay angle.', '娘粒子は、崩壊角によらず親粒子のエネルギーを分け合います。'], [`$E = \\sqrt{${p}^2 + ${n(M, 3)}^2} = ${n(E, 4)}$ GeV.`, `$E = \\sqrt{${p}^2 + ${n(M, 3)}^2} = ${n(E, 4)}$ GeV です。`]],
        set: { part: M < 1 ? 0 : M < 4 ? 2 : 3, p },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const E1 = r.int(5, 60), E2 = r.int(5, 60), th = r.pick([20, 30, 45, 60, 90, 120, 150, 180]), m = Math.sqrt(2 * E1 * E2 * (1 - Math.cos((th * PI) / 180)));
        return {
          q: [`Two photons of energies $${E1}$ GeV and $${E2}$ GeV are detected with an angle of $${th}^\\circ$ between them. What is their invariant mass, in GeV?`, `エネルギー $${E1}$ GeV と $${E2}$ GeV の二つの光子が、互いに $${th}^\\circ$ の角度で検出されました。その不変質量は何 GeV ですか。`],
          a: { type: 'num', v: m, rel: 0.004, unit: ['GeV', 'GeV'] },
          hint: ['For massless particles $m^2 = 2E_1E_2(1 - \\cos\\theta)$.', '質量のない粒子では $m^2 = 2E_1E_2(1 - \\cos\\theta)$ です。'],
          sol: [['$m^2 = (E_1+E_2)^2 - |\\mathbf p_1 + \\mathbf p_2|^2$ with $|\\mathbf p_i| = E_i$ gives $2E_1E_2(1-\\cos\\theta)$.', '$|\\mathbf p_i| = E_i$ として $m^2 = (E_1+E_2)^2 - |\\mathbf p_1 + \\mathbf p_2|^2$ を計算すると $2E_1E_2(1-\\cos\\theta)$ になります。'], [`$m^2 = 2\\times${E1}\\times${E2}\\times${n(1 - Math.cos((th * PI) / 180), 4)} = ${n(m * m, 2)}$ GeV².`, `$m^2 = 2\\times${E1}\\times${E2}\\times${n(1 - Math.cos((th * PI) / 180), 4)} = ${n(m * m, 2)}$ GeV² です。`], [`$m = ${n(m, 3)}$ GeV. This is how the Higgs boson appeared in its two-photon decay, as a peak at 125 GeV.`, `$m = ${n(m, 3)}$ GeV です。ヒッグス粒子は二光子への崩壊で、このようにして 125 GeV の山として現れました。`]],
        };
      }
      if (form === 1) {
        const p = r.step(1, 20, 0.5), L = (p / 0.497611) * 2.6844;
        return {
          q: [`A $K^0_S$ (mass 0.4976 GeV, $c\\tau = 2.684$ cm) has momentum $${n(p, 1)}$ GeV. How far does it travel on average before decaying, in cm?`, `$K^0_S$（質量 0.4976 GeV、$c\\tau = 2.684$ cm）の運動量が $${n(p, 1)}$ GeV です。崩壊するまでに平均で何 cm 進みますか。`],
          a: { type: 'num', v: L, rel: 0.005, unit: ['cm', 'cm'] },
          hint: ['$L = \\beta\\gamma c\\tau$ and $\\beta\\gamma = p/M$.', '$L = \\beta\\gamma c\\tau$、$\\beta\\gamma = p/M$ です。'],
          sol: [[`$\\beta\\gamma = ${n(p, 1)}/0.4976 = ${n(p / 0.497611, 3)}$.`, `$\\beta\\gamma = ${n(p, 1)}/0.4976 = ${n(p / 0.497611, 3)}$ です。`], [`$L = ${n(p / 0.497611, 3)}\\times2.684 = ${n(L, 3)}$ cm: time dilation stretches the lifetime, so the decay vertex stands clear of the collision point.`, `$L = ${n(p / 0.497611, 3)}\\times2.684 = ${n(L, 3)}$ cm です。時間の遅れで寿命が延びるので、崩壊点は衝突点からはっきり離れます。`]],
          set: { part: 1, p },
        };
      }
      const [M, m, name, part] = r.pick([[0.77526, 0.13957, '\\rho^0\\to\\pi^+\\pi^-', 0], [0.497611, 0.13957, 'K^0_S\\to\\pi^+\\pi^-', 1], [3.0969, 0.1056584, 'J/\\psi\\to\\mu^+\\mu^-', 2], [1.019461, 0.493677, '\\phi\\to K^+K^-', -1], [91.1876, 0.1056584, 'Z\\to\\mu^+\\mu^-', 3]]), ps = Math.sqrt((M * M) / 4 - m * m);
      return {
        q: [`In the decay $${name}$ (parent mass $${n(M, 4)}$ GeV, daughter mass $${n(m, 4)}$ GeV), what is the momentum of each daughter in the parent’s rest frame, in GeV?`, `崩壊 $${name}$（親粒子の質量 $${n(M, 4)}$ GeV、娘粒子の質量 $${n(m, 4)}$ GeV）で、親粒子の静止系での娘粒子の運動量は何 GeV ですか。`],
        a: { type: 'num', v: ps, rel: 0.004, unit: ['GeV', 'GeV'] },
        hint: ['Each daughter has energy $M/2$.', '娘粒子はそれぞれエネルギー $M/2$ をもちます。'],
        sol: [['In the rest frame the two daughters are back to back with equal energies $M/2$.', '静止系では二つの娘粒子は反対向きに出て、エネルギーは等しく $M/2$ です。'], [`$p^{*} = \\sqrt{(M/2)^2 - m^2} = \\sqrt{${n((M * M) / 4, 5)} - ${n(m * m, 5)}} = ${n(ps, 4)}$ GeV.`, `$p^{*} = \\sqrt{(M/2)^2 - m^2} = \\sqrt{${n((M * M) / 4, 5)} - ${n(m * m, 5)}} = ${n(ps, 4)}$ GeV です。`]],
        ...(part >= 0 ? { set: { part, p: 0 } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['A particle decays into two massless particles of equal energy $E$ with opening angle $t$ between them. Write its mass in terms of $E$ and $t$.', 'ある粒子が、等しいエネルギー $E$ をもつ質量のない二つの粒子に崩壊し、その間の開き角は $t$ です。この粒子の質量を $E$ と $t$ で表してください。'],
        a: { type: 'expr', v: '2*E*sin(t/2)', vars: ['E', 't'], dom: { E: [1, 50], t: [0.2, 3] }, lhs: ['$m =$', '$m =$'] },
        hint: ['$m^2 = 2E^2(1 - \\cos t)$ and $1 - \\cos t = 2\\sin^2(t/2)$.', '$m^2 = 2E^2(1 - \\cos t)$、$1 - \\cos t = 2\\sin^2(t/2)$ です。'],
        sol: [['$m^2 = 2E_1E_2(1-\\cos t) = 2E^2(1 - \\cos t)$.', '$m^2 = 2E_1E_2(1-\\cos t) = 2E^2(1 - \\cos t)$ です。'], ['With the half-angle identity, $m^2 = 4E^2\\sin^2(t/2)$, so $m = 2E\\sin(t/2)$.', '半角の公式から $m^2 = 4E^2\\sin^2(t/2)$ なので、$m = 2E\\sin(t/2)$ です。'], ['A fast parent (large $E$) therefore gives a small opening angle: the daughters are thrown forward together.', 'したがって速い親粒子（大きな $E$）では開き角が小さくなります。娘粒子はそろって前方へ投げ出されます。']],
      };
      if (form === 1) {
        const pT = r.pick([20, 45, 100, 200, 500, 1000]), Lc = r.pick([1, 1.1, 1.2]), s = r.pick([0.1, 0.2, 0.5, 1]), B = (8 * pT * s * 1e-3) / (C * Lc * Lc);
        return {
          q: [`A tracker measures a track along a chord of $L = ${n(Lc, 1)}$ m. What field is needed for a $${pT}$ GeV track to bow away from a straight line by a sagitta of $${n(s, 1)}$ mm? Use $s = 0.3BL^2/(8p_T)$ and answer in tesla.`, `飛跡検出器が長さ $L = ${n(Lc, 1)}$ m の弦に沿って飛跡を測ります。$${pT}$ GeV の飛跡が直線から矢高 $${n(s, 1)}$ mm だけふくらむには、どれだけの磁場が必要ですか。$s = 0.3BL^2/(8p_T)$ を使い、テスラで答えてください。`],
          a: { type: 'num', v: B, rel: 0.01, unit: ['T', 'T'] },
          hint: ['Solve for $B$ and keep the sagitta in metres.', '$B$ について解き、矢高はメートルで扱います。'],
          sol: [['$B = 8p_Ts/(0.3L^2)$.', '$B = 8p_Ts/(0.3L^2)$ です。'], [`$B = 8\\times${pT}\\times${n(s * 1e-3, 4)}/(0.2998\\times${n(Lc * Lc, 2)}) = ${n(B, 3)}$ T.`, `$B = 8\\times${pT}\\times${n(s * 1e-3, 4)}/(0.2998\\times${n(Lc * Lc, 2)}) = ${n(B, 3)}$ T です。`], [B > 8 ? 'No detector magnet reaches this: at such momenta the answer is a longer lever arm, since the sagitta grows with $L^2$.' : 'Fields of 2 to 4 T are what large solenoids provide, which is why momentum resolution worsens steadily as $p_T$ rises.', B > 8 ? '検出器の磁石でこの値に届くものはありません。このような運動量では、矢高が $L^2$ で大きくなることを利用して、測定する距離を長くします。' : '大型のソレノイドが出せるのは 2 から 4 T の磁場で、$p_T$ が上がるにつれて運動量の分解能が着実に悪くなるのはそのためです。']],
        };
      }
      const p = r.pick([20, 45, 100, 200, 400]), E = Math.hypot(p, MZ), th = 2 * Math.asin(MZ / E);
      return {
        q: [`A $Z$ boson ($M = 91.19$ GeV) of momentum $${p}$ GeV decays into two muons (treat them as massless). What is the smallest possible angle between the muons, in degrees?`, `運動量 $${p}$ GeV の $Z$ ボソン（$M = 91.19$ GeV）が二つのミューオンに崩壊します（質量は無視します）。ミューオンの間の角度の最小値は何度ですか。`],
        a: { type: 'num', v: (th * 180) / PI, rel: 0.005, unit: ['°', '°'] },
        hint: ['$M^2 = 2E_1E_2(1-\\cos\\theta)$ with $E_1 + E_2$ fixed: the angle is smallest when $E_1E_2$ is largest.', '$E_1 + E_2$ が一定のもとで $M^2 = 2E_1E_2(1-\\cos\\theta)$ です。$E_1E_2$ が最大のとき角度は最小です。'],
        sol: [[`The energies sum to $E = \\sqrt{${p}^2 + 91.19^2} = ${n(E, 2)}$ GeV; their product is largest when they are equal, $E/2$ each.`, `エネルギーの和は $E = \\sqrt{${p}^2 + 91.19^2} = ${n(E, 2)}$ GeV で、積が最大になるのは等しく $E/2$ ずつのときです。`], ['Then $M = 2(E/2)\\sin(\\theta/2)$, so $\\sin(\\theta_{\\min}/2) = M/E$.', 'このとき $M = 2(E/2)\\sin(\\theta/2)$ なので、$\\sin(\\theta_{\\min}/2) = M/E$ です。'], [`$\\theta_{\\min} = 2\\arcsin(${n(MZ / E, 4)}) = ${n((th * 180) / PI, 2)}^\\circ$. The symmetric decay, at $\\cos\\theta^{*} = 0$, gives the narrowest pair.`, `$\\theta_{\\min} = 2\\arcsin(${n(MZ / E, 4)}) = ${n((th * 180) / PI, 2)}^\\circ$ です。対称な崩壊、$\\cos\\theta^{*} = 0$ のときに対は最も狭くなります。`]],
        ...(p <= 40 ? { set: { part: 3, p, cth: 0 } } : {}),
      };
    },
  ];

  /* ---------------- quark-model ---------------- */
  Q['quark-model'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const [qs, tex] = r.pick(BARY), w = sumW(qs);
        return {
          q: [`What is the electric charge, in units of $e$, of a baryon with quark content $${qs}$?`, `クォーク組成が $${qs}$ のバリオンの電荷は、$e$ を単位としていくつですか。`],
          a: { type: 'int', v: Math.round(w[2]) },
          hint: ['$u$ has charge $+\\tfrac23$; $d$ and $s$ have $-\\tfrac13$.', '$u$ の電荷は $+\\tfrac23$、$d$ と $s$ は $-\\tfrac13$ です。'],
          sol: [[`Add the three charges: $${qs.split('').map((f) => (f === 'u' ? '\\tfrac23' : '-\\tfrac13')).join(' + ').replace(/\+ -/g, '- ')} = ${Math.round(w[2])}$.`, `三つの電荷を足します。$${qs.split('').map((f) => (f === 'u' ? '\\tfrac23' : '-\\tfrac13')).join(' + ').replace(/\+ -/g, '- ')} = ${Math.round(w[2])}$ です。`], [`This is the $${tex}$. Three quarks always give a whole number, which is why fractional charges are never seen on free particles.`, `これは $${tex}$ です。クォーク三つではいつも整数になるので、自由な粒子に分数の電荷が見られることはありません。`]],
          set: { mult: qs[0] === qs[1] && qs[1] === qs[2] ? 2 : 1, q1: qIdx[qs[0]], q2: qIdx[qs[1]], q3: qIdx[qs[2]] },
        };
      }
      const i3 = r.pick([-1, -0.5, 0, 0.5, 1]), y = r.pick(Math.abs(i3) === 0.5 ? [-1, 1] : [0]), Qc = i3 + y / 2;
      return {
        q: [`A hadron sits at $I_3 = ${n(i3, 1)}$, $Y = ${y}$ in the weight diagram. What is its charge?`, `ウェイト図で $I_3 = ${n(i3, 1)}$、$Y = ${y}$ にあるハドロンの電荷はいくつですか。`],
        a: { type: 'int', v: Qc },
        hint: ['Gell-Mann and Nishijima: $Q = I_3 + \\tfrac12Y$.', 'ゲルマン・西島の関係式：$Q = I_3 + \\tfrac12Y$ です。'],
        sol: [[`$Q = ${n(i3, 1)} + \\tfrac12\\times(${y}) = ${Qc}$.`, `$Q = ${n(i3, 1)} + \\tfrac12\\times(${y}) = ${Qc}$ です。`], ['States of equal charge lie along the slanted lines of the diagram.', '電荷が等しい状態は、図の斜めの線に沿って並びます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pick = r.sample(BARY, 4), [qs, tex] = pick[0];
        return {
          q: [`Which baryon has the quark content $${qs}$?`, `クォーク組成が $${qs}$ のバリオンはどれですか。`],
          a: { type: 'choice', opts: pick.map((b) => [`$${b[1]}$`, `$${b[1]}$`]), v: 0 },
          hint: ['Count the strange quarks for the row, then add the charges.', 'ストレンジクォークを数えて段を決め、次に電荷を足します。'],
          sol: [[`$${qs}$ has ${qs.split('').filter((f) => f === 's').length} strange quark(s) and charge $${Math.round(sumW(qs)[2])}$.`, `$${qs}$ はストレンジクォークが ${qs.split('').filter((f) => f === 's').length} 個で、電荷は $${Math.round(sumW(qs)[2])}$ です。`], [`That is the $${tex}$.`, `それは $${tex}$ です。`]],
          set: { mult: qs[0] === qs[1] && qs[1] === qs[2] ? 2 : 1, q1: qIdx[qs[0]], q2: qIdx[qs[1]], q3: qIdx[qs[2]] },
        };
      }
      if (form === 1) {
        const [q, aq, tex] = r.pick([['u', 'd', '\\pi^+'], ['d', 'u', '\\pi^-'], ['u', 's', 'K^+'], ['d', 's', 'K^0'], ['s', 'u', 'K^-'], ['s', 'd', '\\bar K^0']]);
        const i3 = QK[q][0] - QK[aq][0], y = QK[q][1] - QK[aq][1];
        return {
          q: [`The meson $${tex}$ is $${q}\\bar ${aq}$. Give its isospin component $I_3$ and hypercharge $Y$.`, `中間子 $${tex}$ は $${q}\\bar ${aq}$ です。アイソスピンの成分 $I_3$ とハイパーチャージ $Y$ を答えてください。`],
          a: { type: 'tuple', v: [i3, y], labels: ['$I_3$', '$Y$'], tol: 0.01 },
          hint: ['An antiquark carries the opposite of its quark’s $I_3$ and $Y$.', '反クォークは、もとのクォークと逆符号の $I_3$ と $Y$ をもちます。'],
          sol: [[`$${q}$: $(${n(QK[q][0], 1)}, ${n(QK[q][1], 3)})$; $\\bar ${aq}$: $(${n(-QK[aq][0], 1)}, ${n(-QK[aq][1], 3)})$.`, `$${q}$：$(${n(QK[q][0], 1)}, ${n(QK[q][1], 3)})$、$\\bar ${aq}$：$(${n(-QK[aq][0], 1)}, ${n(-QK[aq][1], 3)})$ です。`], [`Sum: $I_3 = ${n(i3, 1)}$, $Y = ${n(y, 0)}$, so $Q = ${n(i3 + y / 2, 0)}$.`, `和は $I_3 = ${n(i3, 1)}$、$Y = ${n(y, 0)}$ で、$Q = ${n(i3 + y / 2, 0)}$ です。`]],
          set: { mult: 0, q1: qIdx[q], q2: qIdx[aq] },
        };
      }
      const S = r.int(0, 3);
      return {
        q: [`How many members of the baryon decuplet contain exactly $${S}$ strange quark${S === 1 ? '' : 's'}?`, `バリオン十重項のうち、ストレンジクォークをちょうど $${S}$ 個含むものはいくつありますか。`],
        a: { type: 'int', v: 4 - S },
        hint: ['The remaining quarks are $u$ or $d$ in any combination.', '残りのクォークは $u$ か $d$ の任意の組み合わせです。'],
        sol: [[`The other $${3 - S}$ quark${3 - S === 1 ? '' : 's'} can hold $0, 1, \\dots, ${3 - S}$ up quarks: $${4 - S}$ combinations.`, `残りの $${3 - S}$ 個のクォークには、アップクォークが $0, 1, \\dots, ${3 - S}$ 個入れます。$${4 - S}$ 通りです。`], ['The rows of the triangle have 4, 3, 2, 1 members: 10 in all, every way of choosing three quarks from three flavours.', '三角形の各段には 4、3、2、1 個の粒子があり、合わせて 10 個です。三つのフレーバーからクォークを三つ選ぶすべての選び方に当たります。']],
        set: { mult: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = [1232, 1384.6, 1533.4, 1672.45], names = ['\\Delta', '\\Sigma^{*}', '\\Xi^{*}', '\\Omega^-'], k = r.int(2, 3), pred = 2 * d[k - 1] - d[k - 2];
        return {
          q: [`In the decuplet, $m(${names[k - 2]}) = ${n(d[k - 2], 1)}$ MeV and $m(${names[k - 1]}) = ${n(d[k - 1], 1)}$ MeV. Using the equal-spacing rule, predict the mass of the $${names[k]}$ in MeV.`, `十重項で $m(${names[k - 2]}) = ${n(d[k - 2], 1)}$ MeV、$m(${names[k - 1]}) = ${n(d[k - 1], 1)}$ MeV です。等間隔則を使って $${names[k]}$ の質量を MeV で予言してください。`],
          a: { type: 'num', v: pred, tol: 0.6, unit: ['MeV', 'MeV'] },
          hint: ['Each extra strange quark adds the same mass.', 'ストレンジクォークが 1 個増えるごとに同じ質量が加わります。'],
          sol: [[`The step is $${n(d[k - 1], 1)} - ${n(d[k - 2], 1)} = ${n(d[k - 1] - d[k - 2], 1)}$ MeV.`, `段の差は $${n(d[k - 1], 1)} - ${n(d[k - 2], 1)} = ${n(d[k - 1] - d[k - 2], 1)}$ MeV です。`], [`Adding it once more: $${n(pred, 1)}$ MeV, against the measured $${n(d[k], 1)}$ MeV, within ${n((Math.abs(pred - d[k]) / d[k]) * 100, 1)}%.`, `もう一度足すと $${n(pred, 1)}$ MeV で、測定値 $${n(d[k], 1)}$ MeV と ${n((Math.abs(pred - d[k]) / d[k]) * 100, 1)}% 以内で合います。`]],
          set: { mult: 2, q1: 2, q2: 2, q3: k === 3 ? 2 : 0 },
        };
      }
      if (form === 1) {
        const N = 938.9, Sg = 1193.2, Xi = 1318.3, Lam = 1115.7, which = r.int(0, 1);
        const v = which === 0 ? (2 * (N + Xi) - Sg) / 3 : 2 * (N + Xi) - 3 * Lam;
        return {
          q: [which === 0 ? `Use the Gell-Mann and Okubo relation $2(m_N + m_\\Xi) = 3m_\\Lambda + m_\\Sigma$ with $m_N = ${N}$, $m_\\Sigma = ${Sg}$, $m_\\Xi = ${Xi}$ MeV to predict $m_\\Lambda$.` : `Use the Gell-Mann and Okubo relation $2(m_N + m_\\Xi) = 3m_\\Lambda + m_\\Sigma$ with $m_N = ${N}$, $m_\\Lambda = ${Lam}$, $m_\\Xi = ${Xi}$ MeV to predict $m_\\Sigma$.`, which === 0 ? `ゲルマン・大久保の関係式 $2(m_N + m_\\Xi) = 3m_\\Lambda + m_\\Sigma$ と $m_N = ${N}$、$m_\\Sigma = ${Sg}$、$m_\\Xi = ${Xi}$ MeV を使って $m_\\Lambda$ を予言してください。` : `ゲルマン・大久保の関係式 $2(m_N + m_\\Xi) = 3m_\\Lambda + m_\\Sigma$ と $m_N = ${N}$、$m_\\Lambda = ${Lam}$、$m_\\Xi = ${Xi}$ MeV を使って $m_\\Sigma$ を予言してください。`],
          a: { type: 'num', v, tol: 0.6, unit: ['MeV', 'MeV'] },
          hint: ['Rearrange the relation for the unknown mass.', '未知の質量について式を整理します。'],
          sol: [[`$2(m_N + m_\\Xi) = ${n(2 * (N + Xi), 1)}$ MeV.`, `$2(m_N + m_\\Xi) = ${n(2 * (N + Xi), 1)}$ MeV です。`], [which === 0 ? `$m_\\Lambda = (${n(2 * (N + Xi), 1)} - ${Sg})/3 = ${n(v, 1)}$ MeV, against the measured 1115.7 MeV.` : `$m_\\Sigma = ${n(2 * (N + Xi), 1)} - 3\\times${Lam} = ${n(v, 1)}$ MeV, against the measured 1193.2 MeV.`, which === 0 ? `$m_\\Lambda = (${n(2 * (N + Xi), 1)} - ${Sg})/3 = ${n(v, 1)}$ MeV で、測定値は 1115.7 MeV です。` : `$m_\\Sigma = ${n(2 * (N + Xi), 1)} - 3\\times${Lam} = ${n(v, 1)}$ MeV で、測定値は 1193.2 MeV です。`], [which === 0 ? 'The relation holds to better than one percent.' : 'The prediction is 26 MeV low: the relation is good to about half a percent in the sum, and the error lands on whichever mass is solved for.', which === 0 ? 'この関係式は 1% より良い精度で成り立ちます。' : '予言は 26 MeV 低くなります。関係式は和について約 0.5% の精度で成り立ち、その誤差は解いた質量に集まります。']],
          set: { mult: 1, q1: 0, q2: 1, q3: 2 },
        };
      }
      return {
        q: ['With $n$ quark flavours, how many baryon states are fully symmetric in flavour (the generalisation of the decuplet)? Give a formula in $n$.', 'クォークのフレーバーが $n$ 種類あるとき、フレーバーについて完全対称なバリオンの状態（十重項の一般化）はいくつありますか。$n$ の式で答えてください。'],
        a: { type: 'expr', v: 'n*(n+1)*(n+2)/6', vars: ['n'], dom: { n: [1, 8] } },
        hint: ['Count multisets of size 3 chosen from $n$ flavours.', '$n$ 種類のフレーバーから重複を許して 3 個選ぶ選び方を数えます。'],
        sol: [['A symmetric state is fixed by how many quarks of each flavour it contains, that is by a multiset of size 3.', '対称な状態は、各フレーバーのクォークがいくつ入っているか、つまり大きさ 3 の重複組み合わせで決まります。'], ['Their number is $\\tfrac16n(n+1)(n+2)$: 4 for two flavours (the $\\Delta$), 10 for three, 20 with charm.', 'その個数は $\\tfrac16n(n+1)(n+2)$ です。2 フレーバーでは 4（$\\Delta$）、3 フレーバーでは 10、チャームを加えると 20 です。']],
        set: { mult: 2 },
      };
    },
  ];

  /* ---------------- running-couplings ---------------- */
  const b0 = (nf) => 11 - (2 * nf) / 3;
  Q['running-couplings'] = [
    (r) => {
      const form = r.int(0, 1), nf = r.int(0, 18);
      if (form === 0) return {
        q: [`What is the one-loop coefficient $b_0 = 11 - \\tfrac23n_f$ for $n_f = ${nf}$ quark flavours?`, `クォークのフレーバー数が $n_f = ${nf}$ のとき、1 ループの係数 $b_0 = 11 - \\tfrac23n_f$ はいくつですか。`],
        a: { type: 'num', v: b0(nf), tol: 0.005 },
        hint: ['Gluons contribute 11, each flavour subtracts two thirds.', 'グルーオンの寄与が 11 で、フレーバー 1 つごとに 3 分の 2 を引きます。'],
        sol: [[`$b_0 = 11 - \\tfrac23\\times${nf} = ${n(b0(nf), 3)}$.`, `$b_0 = 11 - \\tfrac23\\times${nf} = ${n(b0(nf), 3)}$ です。`], [b0(nf) > 0 ? 'It is positive, so the coupling falls as the energy rises.' : 'It is negative, so the coupling would grow with energy.', b0(nf) > 0 ? '正なので、エネルギーが上がると結合は弱くなります。' : '負なので、結合はエネルギーとともに強くなります。']],
        set: { nf },
      };
      return {
        q: [`With $n_f = ${nf}$ flavours, does the strong coupling at one loop grow or fall as the energy increases?`, `フレーバー数が $n_f = ${nf}$ のとき、1 ループの強い結合定数は、エネルギーが上がると強くなりますか、弱くなりますか。`],
        a: { type: 'choice', fixed: true, opts: [['It falls (asymptotic freedom)', '弱くなる（漸近的自由性）'], ['It grows', '強くなる']], v: b0(nf) > 0 ? 0 : 1 },
        hint: ['The sign of $11 - \\tfrac23n_f$ decides.', '$11 - \\tfrac23n_f$ の符号で決まります。'],
        sol: [[`$11 - \\tfrac23\\times${nf} = ${n(b0(nf), 3)}$.`, `$11 - \\tfrac23\\times${nf} = ${n(b0(nf), 3)}$ です。`], [b0(nf) > 0 ? 'Positive: anti-screening by gluons wins and the coupling falls. This holds for up to 16 flavours; nature has 6.' : 'Negative: with 17 or more flavours the screening by quark pairs wins and the coupling grows.', b0(nf) > 0 ? '正なので、グルーオンによる反遮蔽が勝ち、結合は弱くなります。これは 16 フレーバーまで成り立ち、自然界には 6 種類あります。' : '負なので、17 フレーバー以上ではクォーク対による遮蔽が勝ち、結合は強くなります。']],
        set: { nf },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const Qv = r.pick([2, 5, 10, 20, 50, 200, 500, 1000, 2000]), inv = 1 / AS + (b0(5) / (2 * PI)) * Math.log(Qv / MZ);
        return {
          q: [`Starting from $\\alpha_s(M_Z) = 0.118$ at $M_Z = 91.19$ GeV, with five flavours, find $\\alpha_s$ at $Q = ${Qv}$ GeV at one loop. Three decimals.`, `$M_Z = 91.19$ GeV での $\\alpha_s(M_Z) = 0.118$ から出発し、フレーバー数 5 として、$Q = ${Qv}$ GeV での $\\alpha_s$ を 1 ループで求めてください。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: 1 / inv, tol: 0.0012 },
          hint: ['$1/\\alpha_s(Q) = 1/\\alpha_s(M_Z) + \\tfrac{b_0}{2\\pi}\\ln(Q/M_Z)$ with $b_0 = 23/3$.', '$b_0 = 23/3$ として $1/\\alpha_s(Q) = 1/\\alpha_s(M_Z) + \\tfrac{b_0}{2\\pi}\\ln(Q/M_Z)$ です。'],
          sol: [[`$1/0.118 = 8.475$ and $\\tfrac{23}{6\\pi}\\ln(${Qv}/91.19) = ${n((b0(5) / (2 * PI)) * Math.log(Qv / MZ), 3)}$.`, `$1/0.118 = 8.475$、$\\tfrac{23}{6\\pi}\\ln(${Qv}/91.19) = ${n((b0(5) / (2 * PI)) * Math.log(Qv / MZ), 3)}$ です。`], [`$1/\\alpha_s = ${n(inv, 3)}$, so $\\alpha_s(${Qv}\\ \\mathrm{GeV}) = ${n(1 / inv, 4)}$.`, `$1/\\alpha_s = ${n(inv, 3)}$ なので、$\\alpha_s(${Qv}\\ \\mathrm{GeV}) = ${n(1 / inv, 4)}$ です。`]],
          set: { nf: 5, lq: Math.min(3.3, Math.round(Math.log10(Qv) * 50) / 50) },
        };
      }
      const i = r.int(0, 2), t = r.pick([4, 6, 8, 10, 12, 14, 16]), a0 = [59.02, 29.58, 8.475][i], b = [41 / 10, -19 / 6, -7][i], v = a0 - (b / (2 * PI)) * Math.log(10 ** t / MZ);
      const nm = ['1', '2', '3'][i], bt = ['\\tfrac{41}{10}', '-\\tfrac{19}{6}', '-7'][i];
      return {
        q: [`In the Standard Model $1/\\alpha_${nm}(M_Z) = ${a0}$ and $b_${nm} = ${bt}$. What is $1/\\alpha_${nm}$ at $\\mu = 10^{${t}}$ GeV at one loop? One decimal.`, `標準模型では $1/\\alpha_${nm}(M_Z) = ${a0}$、$b_${nm} = ${bt}$ です。$\\mu = 10^{${t}}$ GeV での $1/\\alpha_${nm}$ を 1 ループで求めてください。小数第 1 位まで答えてください。`],
        a: { type: 'num', v, tol: 0.12 },
        hint: ['$1/\\alpha_i(\\mu) = 1/\\alpha_i(M_Z) - \\tfrac{b_i}{2\\pi}\\ln(\\mu/M_Z)$.', '$1/\\alpha_i(\\mu) = 1/\\alpha_i(M_Z) - \\tfrac{b_i}{2\\pi}\\ln(\\mu/M_Z)$ です。'],
        sol: [[`$\\ln(10^{${t}}/91.19) = ${n(Math.log(10 ** t / MZ), 3)}$.`, `$\\ln(10^{${t}}/91.19) = ${n(Math.log(10 ** t / MZ), 3)}$ です。`], [`$1/\\alpha_${nm} = ${a0} - \\tfrac{${n(b, 3)}}{2\\pi}\\times${n(Math.log(10 ** t / MZ), 3)} = ${n(v, 2)}$: ${b > 0 ? 'this coupling grows stronger with energy.' : 'this coupling grows weaker with energy.'}`, `$1/\\alpha_${nm} = ${a0} - \\tfrac{${n(b, 3)}}{2\\pi}\\times${n(Math.log(10 ** t / MZ), 3)} = ${n(v, 2)}$ です。${b > 0 ? 'この結合はエネルギーとともに強くなります。' : 'この結合はエネルギーとともに弱くなります。'}`]],
        set: { model: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([0.15, 0.2, 0.25, 0.3, 0.1, 0.09]), Qv = MZ * Math.exp(((1 / a - 1 / AS) * 2 * PI) / b0(5));
        return {
          q: [`At what energy $Q$ does the one-loop strong coupling (five flavours, $\\alpha_s(91.19\\ \\mathrm{GeV}) = 0.118$) equal $${a}$? Answer in GeV.`, `1 ループの強い結合定数（フレーバー数 5、$\\alpha_s(91.19\\ \\mathrm{GeV}) = 0.118$）が $${a}$ になるエネルギー $Q$ は何 GeV ですか。`],
          a: { type: 'num', v: Qv, rel: 0.02, unit: ['GeV', 'GeV'] },
          hint: ['Solve $1/\\alpha = 1/0.118 + \\tfrac{23}{6\\pi}\\ln(Q/M_Z)$ for $Q$.', '$1/\\alpha = 1/0.118 + \\tfrac{23}{6\\pi}\\ln(Q/M_Z)$ を $Q$ について解きます。'],
          sol: [[`$1/${a} - 1/0.118 = ${n(1 / a - 1 / AS, 3)}$.`, `$1/${a} - 1/0.118 = ${n(1 / a - 1 / AS, 3)}$ です。`], [`$\\ln(Q/M_Z) = ${n(1 / a - 1 / AS, 3)}\\times\\tfrac{6\\pi}{23} = ${n(((1 / a - 1 / AS) * 2 * PI) / b0(5), 3)}$.`, `$\\ln(Q/M_Z) = ${n(1 / a - 1 / AS, 3)}\\times\\tfrac{6\\pi}{23} = ${n(((1 / a - 1 / AS) * 2 * PI) / b0(5), 3)}$ です。`], [`$Q = 91.19\\,e^{${n(((1 / a - 1 / AS) * 2 * PI) / b0(5), 3)}} = ${n(Qv, 3)}$ GeV. Because the running is logarithmic, a modest change in coupling takes a large change in energy.`, `$Q = 91.19\\,e^{${n(((1 / a - 1 / AS) * 2 * PI) / b0(5), 3)}} = ${n(Qv, 3)}$ GeV です。変化は対数的なので、結合を少し変えるにもエネルギーを大きく変えなければなりません。`]],
          ...(Qv >= 1 && Qv <= 1995 ? { set: { nf: 5, lq: Math.round(Math.log10(Qv) * 50) / 50 } } : {}),
        };
      }
      if (form === 1) {
        const Nc = r.int(2, 7), nmax = Math.ceil((11 * Nc) / 2 - 1e-9) - 1;
        return {
          q: [`For a gauge theory with $N_c = ${Nc}$ colours the coefficient is $b_0 = \\tfrac{11}{3}N_c - \\tfrac23n_f$. What is the largest number of quark flavours for which the theory is asymptotically free?`, `色の数が $N_c = ${Nc}$ のゲージ理論では、係数は $b_0 = \\tfrac{11}{3}N_c - \\tfrac23n_f$ です。理論が漸近的自由であるようなクォークのフレーバー数の最大値はいくつですか。`],
          a: { type: 'int', v: nmax },
          hint: ['Require $b_0 > 0$.', '$b_0 > 0$ を要求します。'],
          sol: [[`$b_0 > 0$ means $n_f < \\tfrac{11}{2}N_c = ${n((11 * Nc) / 2, 1)}$.`, `$b_0 > 0$ は $n_f < \\tfrac{11}{2}N_c = ${n((11 * Nc) / 2, 1)}$ を意味します。`], [`The largest integer below that is $${nmax}$. For the three colours of nature the limit is 16.`, `それより小さい最大の整数は $${nmax}$ です。自然界の 3 色では上限は 16 です。`]],
        };
      }
      const [i, j] = r.pick([[0, 1], [1, 2], [0, 2]]), a = [59.02, 29.58, 8.475], b = [41 / 10, -19 / 6, -7], ln = (2 * PI * (a[i] - a[j])) / (b[i] - b[j]), t = Math.log10(MZ) + ln / Math.LN10;
      return {
        q: [`In the Standard Model at one loop, $1/\\alpha_${i + 1}(M_Z) = ${a[i]}$ with $b_${i + 1} = ${n(b[i], 4)}$, and $1/\\alpha_${j + 1}(M_Z) = ${a[j]}$ with $b_${j + 1} = ${n(b[j], 4)}$. At what scale do the two couplings become equal? Give $\\log_{10}(\\mu/\\mathrm{GeV})$ to one decimal.`, `標準模型の 1 ループで、$1/\\alpha_${i + 1}(M_Z) = ${a[i]}$、$b_${i + 1} = ${n(b[i], 4)}$、また $1/\\alpha_${j + 1}(M_Z) = ${a[j]}$、$b_${j + 1} = ${n(b[j], 4)}$ です。二つの結合定数が等しくなるスケールを、$\\log_{10}(\\mu/\\mathrm{GeV})$ として小数第 1 位まで答えてください。`],
        a: { type: 'num', v: t, tol: 0.08 },
        hint: ['Set the two straight lines equal and solve for $\\ln(\\mu/M_Z)$.', '二本の直線を等しいと置き、$\\ln(\\mu/M_Z)$ について解きます。'],
        sol: [[`$${a[i]} - \\tfrac{${n(b[i], 3)}}{2\\pi}x = ${a[j]} - \\tfrac{${n(b[j], 3)}}{2\\pi}x$ with $x = \\ln(\\mu/M_Z)$ gives $x = 2\\pi\\times${n(a[i] - a[j], 3)}/${n(b[i] - b[j], 3)} = ${n(ln, 2)}$.`, `$x = \\ln(\\mu/M_Z)$ として $${a[i]} - \\tfrac{${n(b[i], 3)}}{2\\pi}x = ${a[j]} - \\tfrac{${n(b[j], 3)}}{2\\pi}x$ を解くと、$x = 2\\pi\\times${n(a[i] - a[j], 3)}/${n(b[i] - b[j], 3)} = ${n(ln, 2)}$ です。`], [`$\\log_{10}\\mu = \\log_{10}91.19 + ${n(ln, 2)}/2.3026 = ${n(t, 2)}$.`, `$\\log_{10}\\mu = \\log_{10}91.19 + ${n(ln, 2)}/2.3026 = ${n(t, 2)}$ です。`], ['The three pairs meet at three different scales, between $10^{13}$ and $10^{17}$ GeV: close, but not a single point.', '三組の交点は $10^{13}$ から $10^{17}$ GeV の間の三つの異なるスケールにあります。近いものの、一点ではありません。']],
        set: { model: 0 },
      };
    },
  ];
})();
