'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI;
  const E = 1.602e-19, ME = 9.109e-31, MP = 1.673e-27, EPS0 = 8.854e-12;
  const PLASMAS = [
    { en: 'the ionosphere (F layer)', ja: '電離層（F 層）', n: 1e12, T: 0.1 },
    { en: 'the solar wind near Earth', ja: '地球近くの太陽風', n: 5e6, T: 10 },
    { en: 'a tokamak core', ja: 'トカマクの中心部', n: 1e20, T: 1e4 },
    { en: 'a fluorescent-lamp glow discharge', ja: '蛍光灯のグロー放電', n: 1e16, T: 2 },
    { en: 'the warm interstellar medium', ja: '暖かい星間物質', n: 1e5, T: 1 },
  ];
  const lamD = (ne, Te) => Math.sqrt(EPS0 * Te / (ne * E)); // Te in eV
  const encl = (x) => (1 + x) * Math.exp(-x);

  // ---------- 1. Debye screening ----------
  Q.debye = [
    (r) => {
      const k = r.int(0, 2), lam = r.step(0.2, 2, 0.05);
      if (k === 0) {
        const m = r.pick([0.5, 1, 2, 3, 4]);
        return {
          q: [`How much weaker is the screened potential than the bare Coulomb potential at $r = ${n(m)}\\lambda_D$? Give the ratio $\\phi/\\phi_{\\text{bare}}$ to three decimals.`, `$r = ${n(m)}\\lambda_D$ で、遮蔽されたポテンシャルは裸のクーロンポテンシャルの何倍ですか。比 $\\phi/\\phi_{\\text{bare}}$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: Math.exp(-m), tol: 6e-4 },
          hint: ['The two differ only by the factor $e^{-r/\\lambda_D}$.', '2つは因子 $e^{-r/\\lambda_D}$ だけ違います。'],
          sol: [[`$\\phi/\\phi_{\\text{bare}} = e^{-r/\\lambda_D} = e^{-${n(m)}} = ${n(Math.exp(-m), 4)}$.`, `$\\phi/\\phi_{\\text{bare}} = e^{-r/\\lambda_D} = e^{-${n(m)}} = ${n(Math.exp(-m), 4)}$ です。`], ['A few Debye lengths away the charge is effectively invisible: this is what makes a plasma quasi-neutral on large scales.', 'デバイ長の数倍離れると電荷は実質的に見えなくなります。これがプラズマを大きなスケールで準中性にしているのです。']],
          set: { length: lam },
        };
      }
      if (k === 1) {
        const q0 = r.step(0.5, 2, 0.1), rr = r.step(0.5, 3, 0.25), phi = q0 * Math.exp(-rr / lam) / rr;
        return {
          q: [`With $\\phi_0 = ${n(q0)}$ and $\\lambda_D = ${n(lam)}$, find the screened potential $\\phi(r) = \\phi_0e^{-r/\\lambda_D}/r$ at $r = ${n(rr)}$. Give three decimals.`, `$\\phi_0 = ${n(q0)}$、$\\lambda_D = ${n(lam)}$ のとき、遮蔽されたポテンシャル $\\phi(r) = \\phi_0e^{-r/\\lambda_D}/r$ を $r = ${n(rr)}$ で小数第3位まで求めてください。`],
          a: { type: 'num', v: phi, tol: 6e-4 },
          hint: ['Compute the bare value $\\phi_0/r$ and the screening factor separately.', '裸の値 $\\phi_0/r$ と遮蔽因子を別々に計算してください。'],
          sol: [[`Bare: $${n(q0)}/${n(rr)} = ${n(q0 / rr, 4)}$. Factor: $e^{-${n(rr)}/${n(lam)}} = ${n(Math.exp(-rr / lam), 4)}$.`, `裸の値：$${n(q0)}/${n(rr)} = ${n(q0 / rr, 4)}$。因子：$e^{-${n(rr)}/${n(lam)}} = ${n(Math.exp(-rr / lam), 4)}$ です。`], [`$\\phi = ${n(phi, 4)}$: drag the probe to $r = ${n(rr)}$ to read it off the blue curve.`, `$\\phi = ${n(phi, 4)}$ です。調べる球面を $r = ${n(rr)}$ までドラッグすると青い曲線で読み取れます。`]],
          set: { length: lam, charge: q0 },
        };
      }
      return {
        q: ['A plasma is heated at fixed density. What happens to its Debye length?', '密度を一定にしてプラズマを加熱します。デバイ長はどうなりますか。'],
        a: { type: 'choice', opts: [['It grows like $\\sqrt{T}$: hotter electrons resist being pulled into the cloud', '$\\sqrt{T}$ に比例して長くなる。熱い電子は雲に引き込まれにくい'], ['It shrinks like $1/\\sqrt{T}$: faster electrons screen more quickly', '$1/\\sqrt{T}$ に比例して短くなる。速い電子ほど素早く遮蔽する'], ['It does not change; only the density matters', '変わらない。密度だけで決まる'], ['It grows like $T$', '$T$ に比例して長くなる']], v: 0 },
        hint: ['$\\lambda_D = \\sqrt{\\varepsilon_0k_BT_e/(n_ee^2)}$: screening is a balance between attraction and thermal motion.', '$\\lambda_D = \\sqrt{\\varepsilon_0k_BT_e/(n_ee^2)}$ です。遮蔽は引力と熱運動の釣り合いで決まります。'],
        sol: [['The cloud forms where the electrostatic energy $e\\phi$ competes with $k_BT$; hotter electrons need a larger region before enough of them are gathered.', '雲は静電エネルギー $e\\phi$ が $k_BT$ と競り合う所にできます。電子が熱いほど、十分な数が集まるまでに広い領域が必要です。'], ['$\\lambda_D \\propto \\sqrt{T_e/n_e}$, so quadrupling $T$ doubles it; denser plasmas screen over shorter distances.', '$\\lambda_D \\propto \\sqrt{T_e/n_e}$ なので、$T$ を4倍にすると2倍になります。密度が高いプラズマほど短い距離で遮蔽します。']],
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const p = r.pick(PLASMAS), L = lamD(p.n, p.T);
        return {
          q: [`Estimate the Debye length in ${p.en}: $n_e \\approx ${sig(p.n, 1)}$ m⁻³ and $k_BT_e \\approx ${sig(p.T, 2)}$ eV. Give it in metres. ($\\varepsilon_0 = 8.854\\times 10^{-12}$ F/m, $e = 1.602\\times 10^{-19}$ C.)`, `${p.ja}のデバイ長を見積もってください。$n_e \\approx ${sig(p.n, 1)}$ m⁻³、$k_BT_e \\approx ${sig(p.T, 2)}$ eV です。メートルで答えてください（$\\varepsilon_0 = 8.854\\times 10^{-12}$ F/m、$e = 1.602\\times 10^{-19}$ C）。`],
          a: { type: 'num', v: L, rel: 0.01, unit: ['m', 'm'] },
          hint: ['With $T_e$ in eV, $k_BT_e = eT_e$ joules, so $\\lambda_D = \\sqrt{\\varepsilon_0T_e/(n_ee)}$ $\\approx 7430\\sqrt{T_e/n_e}$ m.', '$T_e$ を eV で表すと $k_BT_e = eT_e$ J なので、$\\lambda_D = \\sqrt{\\varepsilon_0T_e/(n_ee)}$ $\\approx 7430\\sqrt{T_e/n_e}$ m です。'],
          sol: [[`$\\lambda_D = \\sqrt{8.854\\times 10^{-12}\\times ${sig(p.T, 2)}/(${sig(p.n, 1)}\\times 1.602\\times 10^{-19})}$.`, `$\\lambda_D = \\sqrt{8.854\\times 10^{-12}\\times ${sig(p.T, 2)}/(${sig(p.n, 1)}\\times 1.602\\times 10^{-19})}$ です。`], [`$\\lambda_D \\approx ${sig(L, 3)}$ m. ${L > 1 ? 'Metres: in such a thin plasma, any object much smaller than this barely disturbs it.' : 'Small compared with the plasma itself, so on the scale of the whole device the plasma is neutral.'}`, `$\\lambda_D \\approx ${sig(L, 3)}$ m です。${L > 1 ? 'メートル単位で、このように希薄なプラズマでは、これよりずっと小さな物体はほとんど影響を与えません。' : 'プラズマ全体と比べて小さいので、装置全体のスケールではプラズマは中性です。'}`]],
        };
      }
      if (k === 1) {
        const lam = r.step(0.2, 2, 0.05), m = r.pick([0.5, 1, 1.5, 2, 3]);
        return {
          q: [`What fraction of the test charge is still unscreened inside a sphere of radius $r = ${n(m)}\\lambda_D$? Give three decimals.`, `半径 $r = ${n(m)}\\lambda_D$ の球の内側で、試験電荷のうちまだ遮蔽されていない割合はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: encl(m), tol: 6e-4 },
          hint: ['Gauss: the enclosed charge is $-4\\pi\\varepsilon_0r^2\\,d\\phi/dr$.', 'ガウスの法則より、内側の電荷は $-4\\pi\\varepsilon_0r^2\\,d\\phi/dr$ です。'],
          sol: [['Differentiating $\\phi \\propto e^{-r/\\lambda_D}/r$ gives $Q(r)/q = (1 + r/\\lambda_D)e^{-r/\\lambda_D}$.', '$\\phi \\propto e^{-r/\\lambda_D}/r$ を微分すると $Q(r)/q = (1 + r/\\lambda_D)e^{-r/\\lambda_D}$ です。'], [`$(1 + ${n(m)})e^{-${n(m)}} = ${n(encl(m), 4)}$: the cloud inside cancels $${n(100 * (1 - encl(m)), 3)}$ % of the charge.`, `$(1 + ${n(m)})e^{-${n(m)}} = ${n(encl(m), 4)}$ で、内側の雲が電荷の $${n(100 * (1 - encl(m)), 3)}$ % を打ち消しています。`]],
          set: { length: lam },
        };
      }
      const p = r.pick(PLASMAS), L = lamD(p.n, p.T), ND = 4 / 3 * PI * p.n * L ** 3;
      return {
        q: [`How many electrons are inside one Debye sphere, $N_D = \\tfrac43\\pi n_e\\lambda_D^3$, in ${p.en} ($n_e = ${sig(p.n, 1)}$ m⁻³, $k_BT_e = ${sig(p.T, 2)}$ eV)?`, `${p.ja}（$n_e = ${sig(p.n, 1)}$ m⁻³、$k_BT_e = ${sig(p.T, 2)}$ eV）で、1つのデバイ球の中にある電子の数 $N_D = \\tfrac43\\pi n_e\\lambda_D^3$ はいくつですか。`],
        a: { type: 'num', v: ND, rel: 0.02 },
        hint: ['First find $\\lambda_D = \\sqrt{\\varepsilon_0T_e/(n_ee)}$ with $T_e$ in eV.', 'まず $T_e$ を eV として $\\lambda_D = \\sqrt{\\varepsilon_0T_e/(n_ee)}$ を求めます。'],
        sol: [[`$\\lambda_D = ${sig(L, 3)}$ m.`, `$\\lambda_D = ${sig(L, 3)}$ m です。`], [`$N_D = \\tfrac43\\pi(${sig(p.n, 1)})(${sig(L, 3)})^3 = ${sig(ND, 3)}$.`, `$N_D = \\tfrac43\\pi(${sig(p.n, 1)})(${sig(L, 3)})^3 = ${sig(ND, 3)}$ です。`], ['$N_D \\gg 1$ is what the smooth screening cloud of the figure assumes: the potential comes from many particles, not a few.', '$N_D \\gg 1$ は図のなめらかな遮蔽雲の前提で、ポテンシャルは少数ではなく多数の粒子からつくられます。']],
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const f = r.pick([0.5, 0.25, 0.1, 0.05, 0.75]), lam = r.step(0.2, 2, 0.05);
        let x = 1; for (let i = 0; i < 60; i++) { const g = encl(x) - f, d = -x * Math.exp(-x); x -= g / d; }
        return {
          q: [`With $\\lambda_D = ${n(lam)}$, at what radius is only ${n(100 * f)} % of the test charge left unscreened? Give three decimals.`, `$\\lambda_D = ${n(lam)}$ のとき、試験電荷のうち遮蔽されていない割合が ${n(100 * f)} % だけになる半径はいくらですか（小数第3位まで）。`],
          a: { type: 'num', v: x * lam, tol: 0.002 },
          hint: ['Solve $(1 + x)e^{-x} = f$ for $x = r/\\lambda_D$ numerically (Newton works well), then scale.', '$x = r/\\lambda_D$ について $(1 + x)e^{-x} = f$ を数値的に解き（ニュートン法が便利です）、それから倍率を掛けます。'],
          sol: [[`The derivative of $(1 + x)e^{-x}$ is $-xe^{-x}$, so Newton\u2019s method converges to $x = ${n(x, 4)}$.`, `$(1 + x)e^{-x}$ の導関数は $-xe^{-x}$ なので、ニュートン法は $x = ${n(x, 4)}$ に収束します。`], [`$r = x\\lambda_D = ${n(x, 4)}\\times ${n(lam)} = ${n(x * lam, 4)}$. Drag the probe there: the teal curve reads ${n(f)}.`, `$r = x\\lambda_D = ${n(x, 4)}\\times ${n(lam)} = ${n(x * lam, 4)}$ です。調べる球面をそこまでドラッグすると、青緑の曲線が ${n(f)} を示します。`]],
          set: { length: lam },
        };
      }
      if (k === 1) {
        const a = r.pick([4, 2, 9, 0.25, 100]), b = r.pick([2, 4, 0.5, 9, 1]);
        return {
          q: [`A plasma\u2019s electron density is multiplied by $${n(a)}$ and its electron temperature by $${n(b)}$. By what factor does $\\lambda_D$ change?`, `プラズマの電子密度を $${n(a)}$ 倍、電子温度を $${n(b)}$ 倍にします。$\\lambda_D$ は何倍になりますか。`],
          a: { type: 'num', v: Math.sqrt(b / a) },
          hint: ['$\\lambda_D \\propto \\sqrt{T_e/n_e}$.', '$\\lambda_D \\propto \\sqrt{T_e/n_e}$ です。'],
          sol: [[`$\\lambda_D' /\\lambda_D = \\sqrt{${n(b)}/${n(a)}} = ${n(Math.sqrt(b / a), 4)}$.`, `$\\lambda_D' /\\lambda_D = \\sqrt{${n(b)}/${n(a)}} = ${n(Math.sqrt(b / a), 4)}$ です。`], ['Density helps screening (more electrons available), temperature hinders it (they are harder to hold): the square root reflects the balance $n_ee^2\\phi/\\varepsilon_0 \\sim \\phi\\,k_BT/\\lambda^2$.', '密度は遮蔽を助け（使える電子が多い）、温度は妨げます（電子をとどめにくい）。平方根は釣り合い $n_ee^2\\phi/\\varepsilon_0 \\sim \\phi\\,k_BT/\\lambda^2$ から来ています。']],
        };
      }
      const lam = r.step(0.3, 2, 0.1);
      return {
        q: [`With $\\lambda_D = ${n(lam)}$, write the fraction $Q(r)/q$ of the test charge enclosed by a sphere of radius $r$.`, `$\\lambda_D = ${n(lam)}$ のとき、半径 $r$ の球が囲む試験電荷の割合 $Q(r)/q$ を式で書いてください。`],
        a: { type: 'expr', v: `(1 + r/${lam})*exp(-r/${lam})`, vars: ['r'], dom: { r: [0.1, 4] }, lhs: ['$Q(r)/q =$', '$Q(r)/q =$'] },
        hint: ['Use Gauss\u2019s law on $\\phi = \\phi_0e^{-r/\\lambda_D}/r$: $Q(r) \\propto -r^2\\,d\\phi/dr$.', '$\\phi = \\phi_0e^{-r/\\lambda_D}/r$ にガウスの法則を使います。$Q(r) \\propto -r^2\\,d\\phi/dr$ です。'],
        sol: [['$-r^2\\dfrac{d}{dr}\\dfrac{e^{-r/\\lambda}}{r} = \\left(1 + \\dfrac{r}{\\lambda}\\right)e^{-r/\\lambda}$, normalised to $1$ at $r = 0$.', '$-r^2\\dfrac{d}{dr}\\dfrac{e^{-r/\\lambda}}{r} = \\left(1 + \\dfrac{r}{\\lambda}\\right)e^{-r/\\lambda}$ で、$r = 0$ で $1$ に規格化されています。'], [`$Q(r)/q = \\left(1 + \\dfrac{r}{${n(lam)}}\\right)e^{-r/${n(lam)}}$: it falls from $1$ to $0$, so the cloud carries exactly $-q$ in total.`, `$Q(r)/q = \\left(1 + \\dfrac{r}{${n(lam)}}\\right)e^{-r/${n(lam)}}$ です。$1$ から $0$ まで減るので、雲は全体でちょうど $-q$ をもちます。`]],
        set: { length: lam },
      };
    },
  ];

  // ---------- 2. cyclotron motion (B = 1 in the figure) ----------
  Q.cyclotron = [
    (r) => {
      const k = r.int(0, 2), w = r.step(0.25, 2, 0.05) * r.sign(), v = r.step(0.2, 2, 0.05);
      if (k === 0) return {
        q: [`With $B = 1$, $q/m = ${n(w)}$ and $v_\\perp = ${n(v)}$, what is the Larmor radius?`, `$B = 1$、$q/m = ${n(w)}$、$v_\\perp = ${n(v)}$ のとき、ラーマー半径はいくらですか。`],
        a: { type: 'num', v: v / Math.abs(w), tol: 6e-4 },
        hint: ['The magnetic force $|q|v_\\perp B$ supplies the centripetal force $mv_\\perp^2/r$.', '磁気力 $|q|v_\\perp B$ が向心力 $mv_\\perp^2/r$ を与えます。'],
        sol: [[`$r_L = \\dfrac{mv_\\perp}{|q|B} = \\dfrac{${n(v)}}{${n(Math.abs(w))}}$.`, `$r_L = \\dfrac{mv_\\perp}{|q|B} = \\dfrac{${n(v)}}{${n(Math.abs(w))}}$ です。`], [`$r_L = ${n(v / Math.abs(w), 4)}$: the sign of $q$ only decides which way round it goes.`, `$r_L = ${n(v / Math.abs(w), 4)}$ です。$q$ の符号は回る向きを決めるだけです。`]],
        set: { ratio: w, speed: v },
      };
      if (k === 1) return {
        q: [`With $B = 1$ and $q/m = ${n(w)}$, what is the period of the gyration? Give three decimals.`, `$B = 1$、$q/m = ${n(w)}$ のとき、旋回の周期はいくらですか（小数第3位まで）。`],
        a: { type: 'num', v: 2 * PI / Math.abs(w), tol: 6e-4 },
        hint: ['The angular frequency is $|q|B/m$.', '角振動数は $|q|B/m$ です。'],
        sol: [[`$T = 2\\pi/|\\omega_c| = 2\\pi/${n(Math.abs(w))} = ${n(2 * PI / Math.abs(w), 4)}$.`, `$T = 2\\pi/|\\omega_c| = 2\\pi/${n(Math.abs(w))} = ${n(2 * PI / Math.abs(w), 4)}$ です。`], ['It does not depend on the speed: faster particles move on bigger circles in the same time. That is why a cyclotron can keep accelerating particles with a fixed-frequency voltage.', '周期は速さによりません。速い粒子は大きな円を同じ時間で回ります。サイクロトロンが一定周波数の電圧で粒子を加速し続けられるのはこのためです。']],
        set: { ratio: w, speed: v },
      };
      const ion = r.chance(0.5);
      return {
        q: [`Looking along $\\mathbf B$ from its tip (so $\\mathbf B$ points at you), which way does ${ion ? 'a positive ion' : 'an electron'} gyrate?`, `$\\mathbf B$ の先端の側から（$\\mathbf B$ が自分の方を向くように）見ると、${ion ? '正イオン' : '電子'}はどちら向きに旋回しますか。`],
        a: { type: 'choice', opts: [['Clockwise', '時計回り'], ['Counterclockwise', '反時計回り'], ['It does not gyrate', '旋回しない']], v: ion ? 0 : 1, fixed: true },
        hint: ['Take $\\mathbf v = v\\hat x$, $\\mathbf B = B\\hat z$ and work out the direction of $q\\mathbf v\\times\\mathbf B$.', '$\\mathbf v = v\\hat x$、$\\mathbf B = B\\hat z$ として $q\\mathbf v\\times\\mathbf B$ の向きを求めてください。'],
        sol: [['$\\hat x\\times\\hat z = -\\hat y$, so a positive charge moving in $+x$ is pushed toward $-y$: it turns right, clockwise seen from $+z$.', '$\\hat x\\times\\hat z = -\\hat y$ なので、$+x$ 向きに動く正電荷は $-y$ 向きに押され、右に曲がります。$+z$ から見ると時計回りです。'], [ion ? 'So the ion goes clockwise. Its own circulating current then makes a field opposing $\\mathbf B$: plasmas are diamagnetic.' : 'The electron, with the opposite charge, goes counterclockwise; but its current, like the ion\u2019s, opposes $\\mathbf B$: plasmas are diamagnetic.', ion ? 'したがってイオンは時計回りです。その回転電流がつくる磁場は $\\mathbf B$ を打ち消す向きで、プラズマは反磁性です。' : '電荷が逆の電子は反時計回りです。ただしその電流はイオンの場合と同じく $\\mathbf B$ を打ち消す向きで、プラズマは反磁性です。']],
        set: { ratio: ion ? 1 : -1 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const B = r.pick([0.1, 0.5, 1, 3, 5.3, 0.0875]), electron = r.chance(0.6), m = electron ? ME : MP, f = E * B / (2 * PI * m);
        return {
          q: [`What is the cyclotron frequency $f = qB/(2\\pi m)$ of ${electron ? 'an electron' : 'a proton'} in a field of $${B}$ T? ($e = 1.602\\times 10^{-19}$ C, $m_${electron ? 'e' : 'p'} = ${electron ? '9.109\\times 10^{-31}' : '1.673\\times 10^{-27}'}$ kg.)`, `$${B}$ T の磁場中の${electron ? '電子' : '陽子'}のサイクロトロン周波数 $f = qB/(2\\pi m)$ はいくらですか（$e = 1.602\\times 10^{-19}$ C、$m_${electron ? 'e' : 'p'} = ${electron ? '9.109\\times 10^{-31}' : '1.673\\times 10^{-27}'}$ kg）。`],
          a: { type: 'num', v: f, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Remember to divide the angular frequency by $2\\pi$.', '角振動数を $2\\pi$ で割るのを忘れないでください。'],
          sol: [[`$\\omega_c = eB/m = ${sig(E * B / m, 4)}$ rad/s.`, `$\\omega_c = eB/m = ${sig(E * B / m, 4)}$ rad/s です。`], [`$f = \\omega_c/2\\pi = ${sig(f, 3)}$ Hz. ${electron ? 'About 28 GHz per tesla: microwaves, which is how fusion plasmas are heated (electron cyclotron resonance heating).' : 'About 15 MHz per tesla: radio frequencies, nearly 2000 times lower than for electrons because the proton is that much heavier.'}`, `$f = \\omega_c/2\\pi = ${sig(f, 3)}$ Hz です。${electron ? '1 T あたり約 28 GHz のマイクロ波で、核融合プラズマはこの周波数で加熱されます（電子サイクロトロン共鳴加熱）。' : '1 T あたり約 15 MHz の電波で、陽子は電子の約2000倍重いので、電子の場合より約2000倍低くなります。'}`]],
        };
      }
      if (k === 1) {
        const Ek = r.pick([1, 10, 100, 1000]), B = r.pick([0.5, 1, 2, 5]), v = Math.sqrt(2 * Ek * E / MP), rL = MP * v / (E * B);
        return {
          q: [`A $${Ek}$ eV proton moves perpendicular to a $${B}$ T field. What is its Larmor radius, in metres?`, `$${Ek}$ eV の陽子が $${B}$ T の磁場に垂直に動いています。ラーマー半径は何 m ですか。`],
          a: { type: 'num', v: rL, rel: 0.01, unit: ['m', 'm'] },
          hint: ['Find the speed from $\\tfrac12mv^2 = E_k$, then $r_L = mv/(eB)$.', '$\\tfrac12mv^2 = E_k$ から速さを求め、$r_L = mv/(eB)$ を使います。'],
          sol: [[`$v = \\sqrt{2\\times ${Ek}\\times 1.602\\times 10^{-19}/1.673\\times 10^{-27}} = ${sig(v, 3)}$ m/s.`, `$v = \\sqrt{2\\times ${Ek}\\times 1.602\\times 10^{-19}/1.673\\times 10^{-27}} = ${sig(v, 3)}$ m/s です。`], [`$r_L = mv/(eB) = ${sig(rL, 3)}$ m. Even keV ions in a tokamak circle within millimetres of a field line, which is why a magnetic field can hold a plasma.`, `$r_L = mv/(eB) = ${sig(rL, 3)}$ m です。トカマクの keV のイオンでさえ磁力線から数ミリ以内を回ります。磁場がプラズマを閉じ込められるのはこのためです。`]],
        };
      }
      const w = r.step(0.25, 2, 0.05) * r.sign(), vp = r.step(0.2, 2, 0.05), vpar = r.step(0.1, 1.5, 0.05), pitch = 2 * PI * vpar / Math.abs(w);
      return {
        q: [`A particle with $q/m = ${n(w)}$ in $B = 1$ has $v_\\perp = ${n(vp)}$ and $v_\\parallel = ${n(vpar)}$. How far does it advance along $\\mathbf B$ in one turn of its helix? Give three decimals.`, `$B = 1$ の中で $q/m = ${n(w)}$ の粒子が $v_\\perp = ${n(vp)}$、$v_\\parallel = ${n(vpar)}$ をもちます。らせん1周の間に $\\mathbf B$ に沿って進む距離（ピッチ）はいくらですか（小数第3位まで）。`],
        a: { type: 'num', v: pitch, tol: 6e-4 },
        hint: ['The motion along $\\mathbf B$ is unaffected by the field; one turn takes $2\\pi/|\\omega_c|$.', '$\\mathbf B$ に沿った運動は磁場の影響を受けません。1周には $2\\pi/|\\omega_c|$ かかります。'],
        sol: [[`One period is $2\\pi/${n(Math.abs(w))} = ${n(2 * PI / Math.abs(w), 4)}$.`, `1周期は $2\\pi/${n(Math.abs(w))} = ${n(2 * PI / Math.abs(w), 4)}$ です。`], [`Pitch $= v_\\parallel\\times 2\\pi/|\\omega_c| = ${n(vpar)}\\times ${n(2 * PI / Math.abs(w), 4)} = ${n(pitch, 4)}$, independent of $v_\\perp$, which only sets the radius ($${n(vp / Math.abs(w), 4)}$).`, `ピッチ $= v_\\parallel\\times 2\\pi/|\\omega_c| = ${n(vpar)}\\times ${n(2 * PI / Math.abs(w), 4)} = ${n(pitch, 4)}$ で、$v_\\perp$ にはよりません。$v_\\perp$ は半径（$${n(vp / Math.abs(w), 4)}$）を決めるだけです。`]],
        set: { ratio: w, speed: vp, parallel: vpar },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const f = r.pick([[2.45e9, '2.45 GHz (a microwave oven magnetron)', '2.45 GHz（電子レンジのマグネトロン）'], [28e9, '28 GHz', '28 GHz'], [170e9, '170 GHz (the ITER gyrotrons)', '170 GHz（ITER のジャイロトロン）'], [140e9, '140 GHz', '140 GHz']]), B = 2 * PI * f[0] * ME / E;
        return {
          q: [`Electron cyclotron resonance heating uses microwaves at ${f[1]}. What magnetic field puts the electrons in resonance, in tesla?`, `電子サイクロトロン共鳴加熱では ${f[2]} のマイクロ波を使います。電子を共鳴させる磁場は何 T ですか。`],
          a: { type: 'num', v: B, rel: 0.01, unit: ['T', 'T'] },
          hint: ['Resonance means $f = eB/(2\\pi m_e)$; solve for $B$.', '共鳴は $f = eB/(2\\pi m_e)$ のときです。$B$ について解きます。'],
          sol: [[`$B = 2\\pi fm_e/e = 2\\pi\\times ${sig(f[0], 3)}\\times 9.109\\times 10^{-31}/1.602\\times 10^{-19}$.`, `$B = 2\\pi fm_e/e = 2\\pi\\times ${sig(f[0], 3)}\\times 9.109\\times 10^{-31}/1.602\\times 10^{-19}$ です。`], [`$B = ${sig(B, 3)}$ T. The microwave power is absorbed only where the field has this value, so the heating can be placed precisely by shaping $B$.`, `$B = ${sig(B, 3)}$ T です。マイクロ波の電力は磁場がこの値になる場所でだけ吸収されるので、$B$ の形を調整して加熱の位置を正確に決められます。`]],
        };
      }
      if (k === 1) {
        const a = r.pick([2, 4, 9, 3, 0.25]);
        return {
          q: [`A charged particle\u2019s kinetic energy is multiplied by $${n(a)}$, with $B$ and the direction of motion unchanged. By what factor does its Larmor radius change, and its period?`, `$B$ と運動の向きを変えずに、荷電粒子の運動エネルギーを $${n(a)}$ 倍にします。ラーマー半径と周期はそれぞれ何倍になりますか。`],
          a: { type: 'tuple', v: [Math.sqrt(a), 1], labels: ['$r_L$', '$T$'], tol: 0.002 },
          hint: ['$r_L = mv_\\perp/(|q|B)$ and $T = 2\\pi m/(|q|B)$; speed goes like the square root of energy.', '$r_L = mv_\\perp/(|q|B)$、$T = 2\\pi m/(|q|B)$ で、速さはエネルギーの平方根に比例します。'],
          sol: [[`$v \\propto \\sqrt{E_k}$, so $v$ and $r_L$ change by $\\sqrt{${n(a)}} = ${n(Math.sqrt(a), 4)}$.`, `$v \\propto \\sqrt{E_k}$ なので、$v$ と $r_L$ は $\\sqrt{${n(a)}} = ${n(Math.sqrt(a), 4)}$ 倍になります。`], ['The period does not involve the speed at all, so it is unchanged (factor 1), as long as the motion stays non-relativistic.', '周期には速さがまったく入らないので、運動が非相対論的である限り変わりません（1倍）。']],
        };
      }
      if (k === 2) {
        const w = r.step(0.25, 2, 0.05);
        return {
          q: [`Write the Larmor radius $r_L$ as a function of the perpendicular speed $v$ for $q/m = ${n(w)}$, $B = 1$.`, `$q/m = ${n(w)}$、$B = 1$ のとき、ラーマー半径 $r_L$ を垂直速度 $v$ の式で書いてください。`],
          a: { type: 'expr', v: `v/${w}`, vars: ['v'], dom: { v: [0.2, 2] }, lhs: ['$r_L =$', '$r_L =$'] },
          hint: ['Balance $|q|vB$ against $mv^2/r$.', '$|q|vB$ と $mv^2/r$ を釣り合わせます。'],
          sol: [[`$r_L = \\dfrac{v}{(q/m)B} = \\dfrac{v}{${n(w)}}$.`, `$r_L = \\dfrac{v}{(q/m)B} = \\dfrac{v}{${n(w)}}$ です。`], [`Linear in $v$, so the time $2\\pi r_L/v = 2\\pi/${n(w)} = ${n(2 * PI / w, 4)}$ for one turn is the same for every speed: drag $v_\\perp$ in the figure and the period in the readout stays put.`, `$v$ に比例するので、1周の時間 $2\\pi r_L/v = 2\\pi/${n(w)} = ${n(2 * PI / w, 4)}$ はどの速さでも同じです。図で $v_\\perp$ を動かしても読み取り欄の周期は変わりません。`]],
          set: { ratio: w },
        };
      }
      const sp = r.pick([['an alpha particle (He²⁺)', 'α 粒子（He²⁺）', 4, 2], ['a deuteron', '重陽子', 2, 1], ['an O⁺ ion', 'O⁺ イオン', 16, 1], ['a C⁶⁺ ion', 'C⁶⁺ イオン', 12, 6]]);
      const ratio = sp[2] / sp[3];
      return {
        q: [`A proton and ${sp[0]} move with the same speed perpendicular to the same field. What is the ratio of their Larmor radii, $r_{\\text{ion}}/r_p$? (Take masses as whole multiples of the proton mass.)`, `陽子と${sp[1]}が同じ磁場に垂直に、同じ速さで動いています。ラーマー半径の比 $r_{\\text{ion}}/r_p$ はいくつですか（質量は陽子質量の整数倍とします）。`],
        a: { type: 'num', v: ratio },
        hint: ['$r_L \\propto (m/q)\\,v$.', '$r_L \\propto (m/q)\\,v$ です。'],
        sol: [[`The ion has $m = ${sp[2]}m_p$ and $q = ${sp[3]}e$, so $m/q$ is $${n(ratio)}$ times the proton\u2019s.`, `イオンは $m = ${sp[2]}m_p$、$q = ${sp[3]}e$ なので、$m/q$ は陽子の $${n(ratio)}$ 倍です。`], [`$r_{\\text{ion}}/r_p = ${n(ratio)}$. A mass spectrometer separates ions exactly this way: by $m/q$, not by mass alone.`, `$r_{\\text{ion}}/r_p = ${n(ratio)}$ です。質量分析計はまさにこの方法で、質量そのものではなく $m/q$ によってイオンを分けます。`]],
      };
    },
  ];

  // ---------- 3. dispersion ω² = ωp² + c²k² ----------
  Q.dispersion = [
    (r) => {
      const k = r.int(0, 2), wp = r.step(0.2, 2, 0.05), c = r.step(0.5, 2, 0.05), kk = r.step(0.5, 4, 0.05), w = Math.sqrt(wp * wp + c * c * kk * kk);
      if (k === 0) return {
        q: [`With $\\omega_p = ${n(wp)}$, $c = ${n(c)}$ and $k = ${n(kk)}$, what is $\\omega$ on the branch $\\omega^2 = \\omega_p^2 + c^2k^2$? Give three decimals.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$、$k = ${n(kk)}$ のとき、分枝 $\\omega^2 = \\omega_p^2 + c^2k^2$ 上の $\\omega$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: w, tol: 6e-4 },
        hint: ['Add the squares, then take the square root.', '2乗を足してから平方根をとります。'],
        sol: [[`$\\omega^2 = ${n(wp * wp, 4)} + ${n(c * c * kk * kk, 4)} = ${n(w * w, 4)}$.`, `$\\omega^2 = ${n(wp * wp, 4)} + ${n(c * c * kk * kk, 4)} = ${n(w * w, 4)}$ です。`], [`$\\omega = ${n(w, 4)}$, always above both $\\omega_p$ and $ck = ${n(c * kk, 4)}$.`, `$\\omega = ${n(w, 4)}$ で、常に $\\omega_p$ と $ck = ${n(c * kk, 4)}$ の両方より大きくなります。`]],
        set: { frequency: wp, speed: c, k: kk },
      };
      if (k === 1) return {
        q: [`With $\\omega_p = ${n(wp)}$, $c = ${n(c)}$ and $k = ${n(kk)}$, what is the phase velocity $\\omega/k$? Give three decimals.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$、$k = ${n(kk)}$ のとき、位相速度 $\\omega/k$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: w / kk, tol: 6e-4 },
        hint: ['Compute $\\omega$ from the dispersion relation first.', 'まず分散関係から $\\omega$ を求めます。'],
        sol: [[`$\\omega = \\sqrt{${n(wp * wp, 4)} + ${n(c * c * kk * kk, 4)}} = ${n(w, 4)}$.`, `$\\omega = \\sqrt{${n(wp * wp, 4)} + ${n(c * c * kk * kk, 4)}} = ${n(w, 4)}$ です。`], [`$v_\\varphi = ${n(w, 4)}/${n(kk)} = ${n(w / kk, 4)}$, faster than $c = ${n(c)}$. No information travels at this speed, so relativity is not violated.`, `$v_\\varphi = ${n(w, 4)}/${n(kk)} = ${n(w / kk, 4)}$ で、$c = ${n(c)}$ より速くなります。この速さで情報が伝わるわけではないので、相対論には反しません。`]],
        set: { frequency: wp, speed: c, k: kk },
      };
      return {
        q: ['What does the dispersion relation $\\omega^2 = \\omega_p^2 + c^2k^2$ say happens at $k = 0$?', '分散関係 $\\omega^2 = \\omega_p^2 + c^2k^2$ によると、$k = 0$ では何が起こりますか。'],
        a: { type: 'choice', opts: [['The whole electron population oscillates in step at $\\omega_p$, with zero group velocity', '電子全体が $\\omega_p$ でそろって振動し、群速度は 0'], ['Nothing oscillates: $\\omega = 0$', '何も振動しない：$\\omega = 0$'], ['The wave travels at exactly $c$', '波はちょうど $c$ で進む'], ['The frequency becomes infinite', '周波数が無限大になる']], v: 0 },
        hint: ['Set $k = 0$ and look at both $\\omega$ and $d\\omega/dk$.', '$k = 0$ とおき、$\\omega$ と $d\\omega/dk$ の両方を調べてください。'],
        sol: [['At $k = 0$, $\\omega = \\omega_p$: a spatially uniform oscillation, the electrons sloshing back and forth against the ions together.', '$k = 0$ では $\\omega = \\omega_p$ で、空間的に一様な振動です。電子がイオンに対してそろって前後に揺れます。'], ['$d\\omega/dk = c^2k/\\omega = 0$ there, so this oscillation carries no energy anywhere: it is the cutoff below which waves cannot propagate.', 'そこでは $d\\omega/dk = c^2k/\\omega = 0$ なので、この振動はエネルギーをどこにも運びません。これより低い周波数では波が伝播できないカットオフです。']],
        set: { k: 0.5 },
      };
    },
    (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const wp = r.step(0.2, 2, 0.05), c = r.step(0.5, 2, 0.05), kk = r.step(0.5, 4, 0.05), w = Math.sqrt(wp * wp + c * c * kk * kk), vg = c * c * kk / w;
        return {
          q: [`With $\\omega_p = ${n(wp)}$, $c = ${n(c)}$ and $k = ${n(kk)}$, find the group velocity $d\\omega/dk$. Give three decimals.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$、$k = ${n(kk)}$ のとき、群速度 $d\\omega/dk$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: vg, tol: 6e-4 },
          hint: ['Differentiate $\\omega^2 = \\omega_p^2 + c^2k^2$ implicitly: $2\\omega\\,d\\omega = 2c^2k\\,dk$.', '$\\omega^2 = \\omega_p^2 + c^2k^2$ を陰に微分します。$2\\omega\\,d\\omega = 2c^2k\\,dk$ です。'],
          sol: [[`$\\omega = ${n(w, 4)}$, so $v_g = c^2k/\\omega = ${n(c * c * kk, 4)}/${n(w, 4)} = ${n(vg, 4)}$.`, `$\\omega = ${n(w, 4)}$ なので $v_g = c^2k/\\omega = ${n(c * c * kk, 4)}/${n(w, 4)} = ${n(vg, 4)}$ です。`], [`Slower than $c$, and $v_\\varphi v_g = ${n(w / kk, 4)}\\times ${n(vg, 4)} = ${n(c * c, 4)} = c^2$ exactly.`, `$c$ より遅く、$v_\\varphi v_g = ${n(w / kk, 4)}\\times ${n(vg, 4)} = ${n(c * c, 4)} = c^2$ がちょうど成り立ちます。`]],
          set: { frequency: wp, speed: c, k: kk },
        };
      }
      if (k === 1) {
        const pl = r.pick([['the daytime ionosphere F layer', '昼間の電離層 F 層', 1e12], ['the night-time ionosphere', '夜間の電離層', 1e11], ['the solar wind', '太陽風', 5e6], ['a laboratory plasma', '実験室プラズマ', 1e18], ['a metal\u2019s conduction electrons', '金属の伝導電子', 8.5e28]]), fp = Math.sqrt(pl[2] * E * E / (EPS0 * ME)) / (2 * PI);
        return {
          q: [`What is the plasma frequency $f_p = \\omega_p/2\\pi$ of ${pl[0]}, with $n_e \\approx ${sig(pl[2], 2)}$ m⁻³? ($\\omega_p^2 = n_ee^2/(\\varepsilon_0m_e)$.)`, `${pl[1]}（$n_e \\approx ${sig(pl[2], 2)}$ m⁻³）のプラズマ周波数 $f_p = \\omega_p/2\\pi$ はいくらですか（$\\omega_p^2 = n_ee^2/(\\varepsilon_0m_e)$）。`],
          a: { type: 'num', v: fp, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['A handy form is $f_p \\approx 8.98\\sqrt{n_e}$ Hz with $n_e$ in m⁻³.', '$n_e$ を m⁻³ で表すと $f_p \\approx 8.98\\sqrt{n_e}$ Hz と書けて便利です。'],
          sol: [[`$f_p = 8.98\\sqrt{${sig(pl[2], 2)}}$ Hz.`, `$f_p = 8.98\\sqrt{${sig(pl[2], 2)}}$ Hz です。`], [`$f_p \\approx ${sig(fp, 3)}$ Hz. ${pl[2] > 1e27 ? 'Ultraviolet: visible light is below the cutoff and is reflected, which is why metals shine.' : pl[2] >= 1e11 && pl[2] <= 1e12 ? 'Megahertz: shortwave radio below this is reflected back to Earth, which is how it travels beyond the horizon.' : 'Waves below this frequency cannot enter the plasma.'}`, `$f_p \\approx ${sig(fp, 3)}$ Hz です。${pl[2] > 1e27 ? '紫外線の領域で、可視光はカットオフより下なので反射されます。金属に光沢があるのはこのためです。' : pl[2] >= 1e11 && pl[2] <= 1e12 ? 'メガヘルツ帯で、これより低い短波は地上に反射して戻り、地平線の向こうまで届きます。' : 'これより低い周波数の波はプラズマに入れません。'}`]],
        };
      }
      const wp = r.step(0.2, 2, 0.05), c = r.step(0.5, 2, 0.05), kk = r.step(0.5, 4, 0.05), w = Math.sqrt(wp * wp + c * c * kk * kk), ni = c * kk / w;
      return {
        q: [`For $\\omega_p = ${n(wp)}$, $c = ${n(c)}$ and $k = ${n(kk)}$, find the refractive index $n = ck/\\omega$. Give three decimals.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$、$k = ${n(kk)}$ のとき、屈折率 $n = ck/\\omega$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: ni, tol: 6e-4 },
        hint: ['Equivalently $n = \\sqrt{1 - \\omega_p^2/\\omega^2}$.', '同じことですが $n = \\sqrt{1 - \\omega_p^2/\\omega^2}$ です。'],
        sol: [[`$\\omega = ${n(w, 4)}$, so $n = ${n(c * kk, 4)}/${n(w, 4)} = ${n(ni, 4)}$.`, `$\\omega = ${n(w, 4)}$ なので $n = ${n(c * kk, 4)}/${n(w, 4)} = ${n(ni, 4)}$ です。`], ['A plasma has $n < 1$: the opposite of glass. It tends to $1$ at high frequency and to $0$ at the cutoff $\\omega_p$, where waves are reflected.', 'プラズマでは $n < 1$ で、ガラスとは逆です。高周波では $1$ に近づき、波が反射されるカットオフ $\\omega_p$ では $0$ になります。']],
        set: { frequency: wp, speed: c, k: kk },
      };
    },
    (r) => {
      const k = r.int(0, 3);
      if (k === 0) {
        const f = r.pick([0.5, 0.6, 0.8, 0.25]), wp = r.step(0.4, 2, 0.05), c = r.step(0.5, 2, 0.05), kk = f * wp / (c * Math.sqrt(1 - f * f));
        return {
          q: [`With $\\omega_p = ${n(wp)}$ and $c = ${n(c)}$, at what wave number is the group velocity exactly $${n(f)}c$? Give three decimals.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$ のとき、群速度がちょうど $${n(f)}c$ になる波数はいくらですか（小数第3位まで）。`],
          a: { type: 'num', v: kk, tol: 6e-4 },
          hint: ['Set $c^2k/\\sqrt{\\omega_p^2 + c^2k^2} = fc$ and square.', '$c^2k/\\sqrt{\\omega_p^2 + c^2k^2} = fc$ とおいて2乗します。'],
          sol: [['$c^2k^2 = f^2(\\omega_p^2 + c^2k^2)$, so $k = \\dfrac{f\\,\\omega_p}{c\\sqrt{1 - f^2}}$.', '$c^2k^2 = f^2(\\omega_p^2 + c^2k^2)$ より $k = \\dfrac{f\\,\\omega_p}{c\\sqrt{1 - f^2}}$ です。'], [`$k = ${n(f)}\\times ${n(wp)}/(${n(c)}\\sqrt{${n(1 - f * f, 4)}}) = ${n(kk, 4)}$.`, `$k = ${n(f)}\\times ${n(wp)}/(${n(c)}\\sqrt{${n(1 - f * f, 4)}}) = ${n(kk, 4)}$ です。`], ['Long waves near the cutoff crawl; short waves approach $c$, where the plasma hardly matters.', 'カットオフ近くの長い波はゆっくり進み、短い波は $c$ に近づいて、プラズマの影響はほとんどなくなります。']],
          set: kk >= 0.5 && kk <= 4 ? { frequency: wp, speed: c, k: Math.round(kk * 20) / 20 } : { frequency: wp, speed: c },
        };
      }
      if (k === 1) {
        const wp = r.step(0.2, 2, 0.05), c = r.step(0.5, 2, 0.05);
        return {
          q: [`Write the group velocity $v_g(k)$ for $\\omega_p = ${n(wp)}$ and $c = ${n(c)}$.`, `$\\omega_p = ${n(wp)}$、$c = ${n(c)}$ のときの群速度 $v_g(k)$ を式で書いてください。`],
          a: { type: 'expr', v: `${c * c}*k/sqrt(${wp * wp}+${c * c}*k^2)`, vars: ['k'], dom: { k: [0.2, 4] }, lhs: ['$v_g(k) =$', '$v_g(k) =$'] },
          hint: ['$v_g = d\\omega/dk$ with $\\omega = \\sqrt{\\omega_p^2 + c^2k^2}$.', '$\\omega = \\sqrt{\\omega_p^2 + c^2k^2}$ として $v_g = d\\omega/dk$ です。'],
          sol: [[`$v_g = \\dfrac{c^2k}{\\sqrt{\\omega_p^2 + c^2k^2}} = \\dfrac{${n(c * c, 4)}k}{\\sqrt{${n(wp * wp, 4)} + ${n(c * c, 4)}k^2}}$.`, `$v_g = \\dfrac{c^2k}{\\sqrt{\\omega_p^2 + c^2k^2}} = \\dfrac{${n(c * c, 4)}k}{\\sqrt{${n(wp * wp, 4)} + ${n(c * c, 4)}k^2}}$ です。`], ['It rises from $0$ at $k = 0$ toward $c$ as $k \\to \\infty$ and never reaches it: the slope of the tangent in the left panel.', '$k = 0$ で $0$ から始まり、$k \\to \\infty$ で $c$ に近づきますが、到達はしません。左図の接線の傾きです。']],
          set: { frequency: wp, speed: c },
        };
      }
      if (k === 2) {
        const fMHz = r.pick([3, 5, 7, 9, 10, 15]), nc = (fMHz * 1e6) ** 2 * 4 * PI * PI * EPS0 * ME / (E * E);
        return {
          q: [`Above what electron density, in m⁻³, does the ionosphere reflect a $${fMHz}$ MHz radio wave arriving vertically?`, `電離層は、真上に向かう $${fMHz}$ MHz の電波を、電子密度が何 m⁻³ を超えると反射しますか。`],
          a: { type: 'num', v: nc, rel: 0.01, unit: ['m⁻³', 'm⁻³'] },
          hint: ['Reflection happens where the wave frequency equals the local plasma frequency.', '反射は、波の周波数がその場所のプラズマ周波数に等しくなる所で起こります。'],
          sol: [['Set $\\omega = \\omega_p$: $n_c = \\varepsilon_0m_e(2\\pi f)^2/e^2$.', '$\\omega = \\omega_p$ とおくと $n_c = \\varepsilon_0m_e(2\\pi f)^2/e^2$ です。'], [`$n_c = ${sig(nc, 3)}$ m⁻³. The F layer peaks around $10^{12}$ m⁻³ by day, so waves below about $9$ MHz bounce back; higher frequencies pass through to space.`, `$n_c = ${sig(nc, 3)}$ m⁻³ です。F 層の電子密度は昼間の最大で約 $10^{12}$ m⁻³ なので、約 $9$ MHz より低い電波は跳ね返り、それより高い周波数は宇宙へ抜けます。`]],
        };
      }
      const wp = r.step(0.5, 2, 0.05), c = r.step(0.5, 2, 0.05), f = r.pick([0.25, 0.5, 0.6, 0.8]), d = c / (wp * Math.sqrt(1 - f * f));
      return {
        q: [`A wave of frequency $\\omega = ${n(f)}\\,\\omega_p$ hits a plasma with $\\omega_p = ${n(wp)}$, $c = ${n(c)}$. It cannot propagate, but penetrates a little. Over what distance does its amplitude fall by $e$? Give three decimals.`, `周波数 $\\omega = ${n(f)}\\,\\omega_p$ の波が $\\omega_p = ${n(wp)}$、$c = ${n(c)}$ のプラズマに当たります。伝播はできませんが、少し入り込みます。振幅が $1/e$ になる距離はいくらですか（小数第3位まで）。`],
        a: { type: 'num', v: d, tol: 6e-4 },
        hint: ['Below the cutoff $k$ is imaginary: $c^2k^2 = \\omega^2 - \\omega_p^2 < 0$, so $k = i\\kappa$.', 'カットオフより下では $k$ は虚数です。$c^2k^2 = \\omega^2 - \\omega_p^2 < 0$ なので $k = i\\kappa$ とおきます。'],
        sol: [['$\\kappa = \\sqrt{\\omega_p^2 - \\omega^2}/c$ and the field decays like $e^{-\\kappa x}$, so the depth is $\\delta = c/\\sqrt{\\omega_p^2 - \\omega^2}$.', '$\\kappa = \\sqrt{\\omega_p^2 - \\omega^2}/c$ で、場は $e^{-\\kappa x}$ のように減衰するので、侵入長は $\\delta = c/\\sqrt{\\omega_p^2 - \\omega^2}$ です。'], [`$\\delta = ${n(c)}/(${n(wp)}\\sqrt{1 - ${n(f * f, 4)}}) = ${n(d, 4)}$. In a metal the same formula gives a few tens of nanometres for visible light: the skin depth.`, `$\\delta = ${n(c)}/(${n(wp)}\\sqrt{1 - ${n(f * f, 4)}}) = ${n(d, 4)}$ です。金属では同じ式から可視光に対して数十ナノメートルが得られます。これが表皮厚さです。`]],
        set: { frequency: wp, speed: c },
      };
    },
  ];
})();
