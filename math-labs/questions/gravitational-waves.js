'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;
  const TSUN = 4.925490947e-6, C = 299792458;
  const chirp = (a, b) => Math.pow(a * b, 0.6) / Math.pow(a + b, 0.2);
  const fISCO = (M) => 1 / (Math.pow(6, 1.5) * PI * M * TSUN);
  const tauOfF = (f, Mc) => (5 / 256) * Math.pow(PI * f, -8 / 3) * Math.pow(Mc * TSUN, -5 / 3);
  const fdot = (f, Mc) => (96 / 5) * Math.pow(PI, 8 / 3) * Math.pow(Mc * TSUN, 5 / 3) * Math.pow(f, 11 / 3);
  const Fp = (th, ph, ps) => 0.5 * (1 + Math.cos(th) ** 2) * Math.cos(2 * ph) * Math.cos(2 * ps) - Math.cos(th) * Math.sin(2 * ph) * Math.sin(2 * ps);
  const Fx = (th, ph, ps) => 0.5 * (1 + Math.cos(th) ** 2) * Math.cos(2 * ph) * Math.sin(2 * ps) + Math.cos(th) * Math.sin(2 * ph) * Math.cos(2 * ps);
  const sci = (x, d = 2) => sig(x, d + 1);

  Q['gw-polarization'] = [
    (r) => {
      if (r.chance(0.5)) {
        const h = r.pick([1, 2, 3, 5, 8]) * 1e-22, Lkm = r.pick([4, 3, 0.6, 10, 40]);
        const dL = 0.5 * h * Lkm * 1000;
        return {
          q: [`A plus-polarised wave of strain $h_+ = ${sci(h)}$ arrives straight down onto a detector whose arms are $${n(Lkm)}$ km long. By how many metres does the $x$ arm lengthen at the wave's peak?`, `ひずみ $h_+ = ${sci(h)}$ のプラス偏光の波が、腕の長さ $${n(Lkm)}$ km の検出器に真上から届きます。波の山で $x$ 腕は何メートル伸びますか。`],
          a: { type: 'num', v: dL, rel: 0.02, unit: ['m', 'm'], show: sci(dL) },
          hint: ['Each arm changes by half the strain times its length.', '各腕の長さの変化はひずみの半分に長さをかけたものです。'],
          sol: [[`$\\Delta L_x = \\tfrac12 h_+ L = \\tfrac12 \\times ${sci(h)} \\times ${n(Lkm * 1000)}\\ \\text{m}$.`, `$\\Delta L_x = \\tfrac12 h_+ L = \\tfrac12 \\times ${sci(h)} \\times ${n(Lkm * 1000)}\\ \\text{m}$ です。`], [`$\\Delta L_x = ${sci(dL)}$ m, and the $y$ arm shortens by the same amount, so the measured difference is twice this.`, `$\\Delta L_x = ${sci(dL)}$ m で、$y$ 腕は同じだけ縮むので、測られる差はその二倍です。`]],
        };
      }
      const which = r.int(0, 1);
      return {
        q: [which ? 'At the moment $h_+ > 0$ and $h_\\times = 0$, how is a ring of free masses in the $xy$ plane deformed?' : 'At the moment $h_\\times > 0$ and $h_+ = 0$, how is a ring of free masses in the $xy$ plane deformed?', which ? '$h_+ > 0$、$h_\\times = 0$ の瞬間、$xy$ 平面にある自由質点の輪はどう変形していますか。' : '$h_\\times > 0$、$h_+ = 0$ の瞬間、$xy$ 平面にある自由質点の輪はどう変形していますか。'],
        a: { type: 'choice', v: which ? 0 : 1, opts: [['Stretched along $x$, squeezed along $y$', '$x$ 方向に伸び、$y$ 方向に縮む'], ['Stretched along the diagonal $y = x$, squeezed along $y = -x$', '対角線 $y = x$ に沿って伸び、$y = -x$ に沿って縮む'], ['Expanded equally in every direction', 'すべての方向に同じだけ広がる'], ['Stretched along $z$, the direction of travel', '進行方向の $z$ に沿って伸びる']] },
        hint: ['Apply $\\delta\\xi = \\tfrac12 h\\,\\xi$ to the points $(1, 0)$ and $(1, 1)/\\sqrt2$.', '点 $(1, 0)$ と $(1, 1)/\\sqrt2$ に $\\delta\\xi = \\tfrac12 h\\,\\xi$ を当てはめてください。'],
        sol: [[which ? 'With $h = \\begin{pmatrix} h_+ & 0 \\\\ 0 & -h_+ \\end{pmatrix}$, the point $(1, 0)$ moves outward by $h_+/2$ and $(0, 1)$ moves inward by the same.' : 'With $h = \\begin{pmatrix} 0 & h_\\times \\\\ h_\\times & 0 \\end{pmatrix}$, the point $(1,1)/\\sqrt2$ moves outward by $h_\\times/2$ and $(1,-1)/\\sqrt2$ moves inward.', which ? '$h = \\begin{pmatrix} h_+ & 0 \\\\ 0 & -h_+ \\end{pmatrix}$ では点 $(1, 0)$ は $h_+/2$ だけ外へ、$(0, 1)$ は同じだけ内へ動きます。' : '$h = \\begin{pmatrix} 0 & h_\\times \\\\ h_\\times & 0 \\end{pmatrix}$ では点 $(1,1)/\\sqrt2$ は $h_\\times/2$ だけ外へ、$(1,-1)/\\sqrt2$ は内へ動きます。'], ['The wave is transverse and traceless: nothing happens along $z$, and the ring never expands as a whole.', '波は横波でトレースがゼロなので、$z$ 方向には何も起こらず、輪が全体として広がることもありません。']],
        set: { pol: 0, psi: which ? 0 : 45 },
      };
    },
    (r) => {
      const psi = r.step(5, 85, 5), h = r.pick([0.2, 0.3, 0.4, 0.5, 1, 2]);
      if (r.chance(0.5)) {
        const hp = h * Math.cos(2 * rad(psi)), hx = h * Math.sin(2 * rad(psi));
        return {
          q: [`A linearly polarised wave has amplitude $h = ${n(h)}$ and polarisation angle $\\psi = ${psi}^\\circ$ relative to the $x$ axis. Find its plus and cross amplitudes.`, `振幅 $h = ${n(h)}$、$x$ 軸に対する偏光角 $\\psi = ${psi}^\\circ$ の直線偏光の波があります。プラスとクロスの振幅を求めてください。`],
          a: { type: 'tuple', v: [hp, hx], labels: ['$h_+$', '$h_\\times$'], tol: 0.002 },
          hint: ['Polarisation angles enter as $2\\psi$: turning the pattern by $90^\\circ$ reverses its sign, and by $180^\\circ$ brings it back.', '偏光角は $2\\psi$ の形で入ります。パターンは $90^\\circ$ 回すと符号が反転し、$180^\\circ$ で元に戻るからです。'],
          sol: [[`$h_+ = h\\cos 2\\psi = ${n(h)}\\cos ${2 * psi}^\\circ = ${n(hp, 4)}$.`, `$h_+ = h\\cos 2\\psi = ${n(h)}\\cos ${2 * psi}^\\circ = ${n(hp, 4)}$ です。`], [`$h_\\times = h\\sin 2\\psi = ${n(h)}\\sin ${2 * psi}^\\circ = ${n(hx, 4)}$.`, `$h_\\times = h\\sin 2\\psi = ${n(h)}\\sin ${2 * psi}^\\circ = ${n(hx, 4)}$ です。`], ['A tensor wave turns with twice the angle: at $\\psi = 45^\\circ$ it is pure cross, at $90^\\circ$ it is plus again with the opposite sign.', 'テンソルの波は二倍の角度で回ります。$\\psi = 45^\\circ$ で純粋なクロス、$90^\\circ$ で符号が逆のプラスに戻ります。']],
          set: h <= 0.6 ? { pol: 0, psi, h } : { pol: 0, psi },
        };
      }
      const hp = r.pick([0.1, 0.2, 0.3, 0.4]), hx = r.pick([0, 0.1, 0.2, 0.3]);
      const exact = (1 + hp / 2) * (1 - hp / 2) - hx * hx / 4 - 1;
      return {
        q: [`Under $h_+ = ${n(hp)}$ and $h_\\times = ${n(hx)}$ a unit circle of free masses becomes an ellipse. By what fraction does its area change?`, `$h_+ = ${n(hp)}$、$h_\\times = ${n(hx)}$ のもとで、自由質点の単位円は楕円になります。面積は何割変わりますか（比率で答えてください）。`],
        a: { type: 'num', v: exact, tol: 2e-5 },
        hint: ['The area scales by the determinant of $I + \\tfrac12 h$.', '面積は $I + \\tfrac12 h$ の行列式倍になります。'],
        sol: [[`$\\det\\begin{pmatrix} 1 + h_+/2 & h_\\times/2 \\\\ h_\\times/2 & 1 - h_+/2 \\end{pmatrix} = 1 - \\tfrac14(h_+^2 + h_\\times^2)$.`, `$\\det\\begin{pmatrix} 1 + h_+/2 & h_\\times/2 \\\\ h_\\times/2 & 1 - h_+/2 \\end{pmatrix} = 1 - \\tfrac14(h_+^2 + h_\\times^2)$ です。`], [`The fractional change is $-\\tfrac14(${n(hp * hp)} + ${n(hx * hx)}) = ${n(exact, 5)}$.`, `変化の割合は $-\\tfrac14(${n(hp * hp)} + ${n(hx * hx)}) = ${n(exact, 5)}$ です。`], ['There is no first-order term: the trace of $h$ is zero, so a gravitational wave changes shapes, not areas, at leading order.', '一次の項はありません。$h$ のトレースがゼロなので、重力波は最低次では面積ではなく形を変えます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['A plus wave of amplitude $h$ hits a detector whose arms are rotated by an angle $\\beta$ from the wave\'s $x$ axis. Write the differential signal $(\\Delta L_1 - \\Delta L_2)/L$ divided by $h$, as a function of $\\beta$ (type b for $\\beta$).', 'プラス偏光で振幅 $h$ の波が、腕を波の $x$ 軸から角 $\\beta$ だけ回した検出器に当たります。差の信号 $(\\Delta L_1 - \\Delta L_2)/L$ を $h$ で割ったものを $\\beta$ の関数で書いてください（$\\beta$ は b と入力）。'],
          a: { type: 'expr', v: 'cos(2b)', vars: ['b'], dom: { b: [-1.5, 1.5] }, lhs: ['$\\dfrac{\\Delta L_1 - \\Delta L_2}{hL} =$', '$\\dfrac{\\Delta L_1 - \\Delta L_2}{hL} =$'] },
          hint: ['In the detector\'s frame the wave has $h_+\' = h\\cos 2\\beta$ and $h_\\times\' = -h\\sin 2\\beta$; only $h_+\'$ changes the arm difference.', '検出器の座標系では波は $h_+\' = h\\cos 2\\beta$、$h_\\times\' = -h\\sin 2\\beta$ で、腕の差を変えるのは $h_+\'$ だけです。'],
          sol: [['Rotating the axes by $\\beta$ rotates the polarisation pattern by $2\\beta$ (it is a tensor, not a vector).', '軸を $\\beta$ 回すと偏光パターンは $2\\beta$ 回ります（ベクトルではなくテンソルだからです）。'], ['The arm difference measures the plus component in the detector frame: $(\\Delta L_1 - \\Delta L_2)/L = h\\cos 2\\beta$.', '腕の差は検出器の座標系でのプラス成分を測るので $(\\Delta L_1 - \\Delta L_2)/L = h\\cos 2\\beta$ です。'], ['At $\\beta = 45^\\circ$ the signal vanishes: the same wave is pure cross for that detector.', '$\\beta = 45^\\circ$ では信号が消えます。同じ波がその検出器にとっては純粋なクロスだからです。']],
        };
      }
      if (form === 1) {
        const f = r.pick([50, 100, 150, 250, 400]), dz = r.pick([100, 250, 500, 750, 1000]);
        const lam = C / f / 1000, dphi = (360 * dz / lam) % 360;
        return {
          q: [`A $${f}$ Hz gravitational wave travels along $z$. Two rings of free masses are $${dz}$ km apart along $z$. What is the phase lag of the far ring's deformation, in degrees between 0 and 360?`, `$${f}$ Hz の重力波が $z$ 方向に進んでいます。自由質点の輪が二つ、$z$ 方向に $${dz}$ km 離れています。遠い方の輪の変形の位相の遅れは何度ですか（0 以上 360 未満）。`],
          a: { type: 'num', v: dphi, tol: 0.5, unit: ['°', '°'] },
          hint: ['Gravitational waves travel at the speed of light, so $\\lambda = c/f$.', '重力波は光速で進むので $\\lambda = c/f$ です。'],
          sol: [[`$\\lambda = c/f = ${n(lam, 1)}$ km.`, `$\\lambda = c/f = ${n(lam, 1)}$ km です。`], [`Phase lag $= 360^\\circ \\times ${dz}/${n(lam, 1)} = ${n(360 * dz / lam, 2)}^\\circ$, which is $${n(dphi, 2)}^\\circ$ after removing whole turns.`, `位相の遅れは $360^\\circ \\times ${dz}/${n(lam, 1)} = ${n(360 * dz / lam, 2)}^\\circ$ で、整数回転を除くと $${n(dphi, 2)}^\\circ$ です。`], ['A detector a few kilometres long is tiny compared with these wavelengths, which is why its response can be treated as instantaneous.', '長さ数キロメートルの検出器はこれらの波長に比べてとても小さいので、応答を瞬時とみなせます。']],
        };
      }
      return {
        q: ['In a circularly polarised wave, $h_+ = h\\cos\\omega t$ and $h_\\times = h\\sin\\omega t$. At what angular rate does the direction of maximum stretch turn?', '円偏光の波では $h_+ = h\\cos\\omega t$、$h_\\times = h\\sin\\omega t$ です。最も伸びる方向はどんな角速度で回りますか。'],
        a: { type: 'choice', v: 0, opts: [['$\\omega/2$', '$\\omega/2$'], ['$\\omega$', '$\\omega$'], ['$2\\omega$', '$2\\omega$'], ['It does not turn; the ring pulses', '回らず、輪が脈動する']] },
        hint: ['The stretch axis sits at angle $\\alpha$ with $\\tan 2\\alpha = h_\\times/h_+$.', '伸びる軸の角 $\\alpha$ は $\\tan 2\\alpha = h_\\times/h_+$ を満たします。'],
        sol: [['$\\tan 2\\alpha = \\sin\\omega t/\\cos\\omega t$, so $2\\alpha = \\omega t$ and $\\alpha = \\omega t/2$.', '$\\tan 2\\alpha = \\sin\\omega t/\\cos\\omega t$ より $2\\alpha = \\omega t$、すなわち $\\alpha = \\omega t/2$ です。'], ['The ellipse keeps the same shape and turns at half the wave frequency, which is the orbital frequency of the binary that emitted it.', '楕円は形を保ったまま波の振動数の半分で回ります。これは波を出した連星の軌道周波数です。']],
        set: { pol: 1 },
      };
    },
  ];

  Q['gw-chirp'] = [
    (r) => {
      const eq = r.chance(0.35);
      const m1 = eq ? r.pick([1.4, 5, 10, 20, 30]) : r.step(5, 60, 0.5), m2 = eq ? m1 : r.step(2, 50, 0.5);
      const Mc = chirp(m1, m2);
      return {
        q: [`Find the chirp mass of a binary with $m_1 = ${n(m1)}\\,M_\\odot$ and $m_2 = ${n(m2)}\\,M_\\odot$.`, `$m_1 = ${n(m1)}\\,M_\\odot$、$m_2 = ${n(m2)}\\,M_\\odot$ の連星のチャープ質量を求めてください。`],
        a: { type: 'num', v: Mc, rel: 0.003, unit: ['$M_\\odot$', '$M_\\odot$'] },
        hint: ['$\\mathcal M = (m_1 m_2)^{3/5}/(m_1 + m_2)^{1/5}$.', '$\\mathcal M = (m_1 m_2)^{3/5}/(m_1 + m_2)^{1/5}$ です。'],
        sol: [[`$m_1 m_2 = ${n(m1 * m2, 3)}$ and $m_1 + m_2 = ${n(m1 + m2)}$.`, `$m_1 m_2 = ${n(m1 * m2, 3)}$、$m_1 + m_2 = ${n(m1 + m2)}$ です。`], [`$\\mathcal M = ${n(m1 * m2, 3)}^{3/5}/${n(m1 + m2)}^{1/5} = ${n(Mc, 3)}\\,M_\\odot$.`, `$\\mathcal M = ${n(m1 * m2, 3)}^{3/5}/${n(m1 + m2)}^{1/5} = ${n(Mc, 3)}\\,M_\\odot$ です。`], [eq ? `For equal masses $\\mathcal M = 2^{-1/5}m \\approx 0.87\\,m$.` : 'It is always a little less than the average mass, and it is the one combination the early inspiral measures well.', eq ? `等しい質量では $\\mathcal M = 2^{-1/5}m \\approx 0.87\\,m$ です。` : 'チャープ質量はいつも平均質量より少し小さく、インスパイラルの初期がよく測れる唯一の組み合わせです。']],
        set: m1 <= 80 && m2 <= 80 && m1 >= 1 && m2 >= 1 ? { m1, m2 } : undefined,
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const Mt = r.pick([2.8, 10, 20, 40, 65, 100, 150]);
        const f = fISCO(Mt);
        return {
          q: [`At what gravitational-wave frequency does a binary of total mass $${n(Mt)}\\,M_\\odot$ reach its innermost stable circular orbit? (Use $f_{\\rm GW} = c^3/(6^{3/2}\\pi G M)$, $GM_\\odot/c^3 = 4.925\\ \\mu$s.)`, `全質量 $${n(Mt)}\\,M_\\odot$ の連星が最内安定円軌道に達するときの重力波の周波数はいくらですか（$f_{\\rm GW} = c^3/(6^{3/2}\\pi G M)$、$GM_\\odot/c^3 = 4.925\\ \\mu$s）。`],
          a: { type: 'num', v: f, rel: 0.005, unit: ['Hz', 'Hz'] },
          hint: ['At the ISCO the orbital radius is $6GM/c^2$; Kepler gives the orbital frequency, and the wave frequency is twice that.', '最内安定円軌道の半径は $6GM/c^2$ で、ケプラーの法則から軌道周波数が出ます。波の周波数はその二倍です。'],
          sol: [[`$GM/c^3 = ${n(Mt)} \\times 4.925\\ \\mu\\text{s} = ${n(Mt * TSUN * 1e6, 3)}\\ \\mu$s.`, `$GM/c^3 = ${n(Mt)} \\times 4.925\\ \\mu\\text{s} = ${n(Mt * TSUN * 1e6, 3)}\\ \\mu$s です。`], [`$f = 1/(6^{3/2}\\pi \\times ${n(Mt * TSUN, 6)}\\ \\text{s}) = ${n(f, 1)}$ Hz.`, `$f = 1/(6^{3/2}\\pi \\times ${n(Mt * TSUN, 6)}\\ \\text{s}) = ${n(f, 1)}$ Hz です。`], [Mt < 5 ? 'Neutron-star binaries reach this only above a kilohertz, at the top of the detectors\' band.' : 'The heavier the binary, the lower the frequency at which its inspiral ends, which is why the heaviest systems give only a few cycles in band.', Mt < 5 ? '中性子星の連星がここに達するのは 1 kHz 以上で、検出器の帯域の上端です。' : '連星が重いほどインスパイラルが終わる周波数は低く、そのため最も重い系は帯域内で数周期しか見えません。']],
        };
      }
      const m1 = r.pick([1.4, 1.4, 10, 30, 36]), m2 = r.pick([1.2, 1.4, 8, 25, 29]);
      const Mc = chirp(m1, m2), f1 = r.pick([10, 20, 30]);
      const fe = fISCO(m1 + m2), t = tauOfF(f1, Mc) - tauOfF(fe, Mc);
      return {
        q: [`A binary with chirp mass $${n(Mc, 3)}\\,M_\\odot$ (total mass $${n(m1 + m2)}\\,M_\\odot$) is seen at $${f1}$ Hz. How long, at leading order, until it reaches the innermost stable orbit at $${n(fe, 1)}$ Hz?`, `チャープ質量 $${n(Mc, 3)}\\,M_\\odot$（全質量 $${n(m1 + m2)}\\,M_\\odot$）の連星が $${f1}$ Hz で観測されています。最低次の近似で、$${n(fe, 1)}$ Hz の最内安定軌道に達するまであと何秒ですか。`],
        a: { type: 'num', v: t, rel: 0.01, unit: ['s', 's'] },
        hint: ['$\\tau(f) = \\tfrac{5}{256}(\\pi f)^{-8/3}(G\\mathcal M/c^3)^{-5/3}$; subtract the two values.', '$\\tau(f) = \\tfrac{5}{256}(\\pi f)^{-8/3}(G\\mathcal M/c^3)^{-5/3}$ を二つの周波数で計算して引きます。'],
        sol: [[`$G\\mathcal M/c^3 = ${n(Mc * TSUN * 1e6, 3)}\\ \\mu$s, so $\\tau(${f1}\\ \\text{Hz}) = ${n(tauOfF(f1, Mc), 3)}$ s and $\\tau(${n(fe, 1)}\\ \\text{Hz}) = ${n(tauOfF(fe, Mc), 4)}$ s.`, `$G\\mathcal M/c^3 = ${n(Mc * TSUN * 1e6, 3)}\\ \\mu$s より $\\tau(${f1}\\ \\text{Hz}) = ${n(tauOfF(f1, Mc), 3)}$ s、$\\tau(${n(fe, 1)}\\ \\text{Hz}) = ${n(tauOfF(fe, Mc), 4)}$ s です。`], [`The difference is $${n(t, 3)}$ s.`, `差は $${n(t, 3)}$ s です。`], [t > 30 ? 'Light binaries linger: the steep $f^{-8/3}$ dependence means most of the time is spent at the lowest frequencies.' : 'Heavy binaries sweep through the band in a fraction of a second.', t > 30 ? '軽い連星は長くとどまります。$f^{-8/3}$ の急な依存のため、時間のほとんどは最も低い周波数で過ごします。' : '重い連星は一秒足らずで帯域を通り過ぎます。']],
        set: { m1, m2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Mc = r.pick([1.2, 8.7, 15, 28.1, 40]), f = r.pick([30, 50, 80, 120]);
        const fd = fdot(f, Mc);
        return {
          q: [`A chirp is measured at $f = ${f}$ Hz rising at $\\dot f = ${sig(fd, 3)}$ Hz/s. Using $\\dot f = \\tfrac{96}{5}\\pi^{8/3}(G\\mathcal M/c^3)^{5/3}f^{11/3}$, find the chirp mass in solar masses.`, `$f = ${f}$ Hz でチャープが $\\dot f = ${sig(fd, 3)}$ Hz/s の割合で上がっていると測られました。$\\dot f = \\tfrac{96}{5}\\pi^{8/3}(G\\mathcal M/c^3)^{5/3}f^{11/3}$ を使い、チャープ質量を太陽質量単位で求めてください。`],
          a: { type: 'num', v: Mc, rel: 0.01, unit: ['$M_\\odot$', '$M_\\odot$'] },
          hint: ['Solve for $(G\\mathcal M/c^3)^{5/3}$, raise to the $3/5$, divide by $4.925\\ \\mu$s.', '$(G\\mathcal M/c^3)^{5/3}$ について解き、$3/5$ 乗して $4.925\\ \\mu$s で割ります。'],
          sol: [[`$(G\\mathcal M/c^3)^{5/3} = \\dfrac{5\\dot f}{96\\pi^{8/3}f^{11/3}} = ${sig(Math.pow(Mc * TSUN, 5 / 3), 3)}\\ \\text{s}^{5/3}$.`, `$(G\\mathcal M/c^3)^{5/3} = \\dfrac{5\\dot f}{96\\pi^{8/3}f^{11/3}} = ${sig(Math.pow(Mc * TSUN, 5 / 3), 3)}\\ \\text{s}^{5/3}$ です。`], [`$G\\mathcal M/c^3 = ${sig(Mc * TSUN, 3)}$ s, so $\\mathcal M = ${n(Mc, 3)}\\,M_\\odot$.`, `$G\\mathcal M/c^3 = ${sig(Mc * TSUN, 3)}$ s なので $\\mathcal M = ${n(Mc, 3)}\\,M_\\odot$ です。`], ['This is how the first detection was weighed: frequency and its rate of change alone fix the chirp mass, before any modelling of the merger.', '最初の検出の質量もこうして求められました。合体のモデルを使う前に、周波数とその変化率だけでチャープ質量が決まります。']],
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 4, 1.5, 5]);
        return {
          q: [`At leading order, by what factor does the strain amplitude grow when the gravitational-wave frequency rises by a factor of $${n(k)}$ (same source, same distance)?`, `最低次の近似で、重力波の周波数が $${n(k)}$ 倍になると、ひずみの振幅は何倍になりますか（同じ波源、同じ距離）。`],
          a: { type: 'num', v: Math.pow(k, 2 / 3), rel: 0.003, show: `${n(k)}^{2/3}` },
          hint: ['$h \\propto (G\\mathcal M)^{5/3}(\\pi f)^{2/3}/D$.', '$h \\propto (G\\mathcal M)^{5/3}(\\pi f)^{2/3}/D$ です。'],
          sol: [[`$h \\propto f^{2/3}$, so the ratio is $${n(k)}^{2/3} = ${n(Math.pow(k, 2 / 3), 4)}$.`, `$h \\propto f^{2/3}$ なので比は $${n(k)}^{2/3} = ${n(Math.pow(k, 2 / 3), 4)}$ です。`], ['Frequency and amplitude rise together: that joint sweep is the chirp.', '周波数と振幅が一緒に上がります。この同時の上昇がチャープです。']],
        };
      }
      return {
        q: ['Write the time to coalescence $\\tau$ (in seconds) as a function of the gravitational-wave frequency $f$ for a binary with $G\\mathcal M/c^3 = 1.4\\times10^{-4}$ s. Use the leading-order result.', '$G\\mathcal M/c^3 = 1.4\\times10^{-4}$ s の連星について、合体までの時間 $\\tau$（秒）を重力波の周波数 $f$ の関数として書いてください。最低次の結果を使います。'],
        a: { type: 'expr', v: '(5/256)*(pi*f)^(-8/3)*(1.4e-4)^(-5/3)', vars: ['f'], dom: { f: [20, 200] }, lhs: ['$\\tau(f) =$', '$\\tau(f) =$'] },
        hint: ['Invert $f(\\tau) = \\tfrac1\\pi\\big(\\tfrac{5}{256\\tau}\\big)^{3/8}(G\\mathcal M/c^3)^{-5/8}$.', '$f(\\tau) = \\tfrac1\\pi\\big(\\tfrac{5}{256\\tau}\\big)^{3/8}(G\\mathcal M/c^3)^{-5/8}$ を逆に解きます。'],
        sol: [['Raise $\\pi f = (5/256\\tau)^{3/8}(G\\mathcal M/c^3)^{-5/8}$ to the power $8/3$: $(\\pi f)^{8/3} = \\dfrac{5}{256\\tau}(G\\mathcal M/c^3)^{-5/3}$.', '$\\pi f = (5/256\\tau)^{3/8}(G\\mathcal M/c^3)^{-5/8}$ を $8/3$ 乗すると $(\\pi f)^{8/3} = \\dfrac{5}{256\\tau}(G\\mathcal M/c^3)^{-5/3}$ です。'], ['$\\tau = \\tfrac{5}{256}(\\pi f)^{-8/3}(1.4\\times10^{-4})^{-5/3}$; at 20 Hz this is about 0.8 s.', '$\\tau = \\tfrac{5}{256}(\\pi f)^{-8/3}(1.4\\times10^{-4})^{-5/3}$ で、20 Hz ではおよそ 0.8 s です。']],
      };
    },
  ];

  Q['gw-antenna'] = [
    (r) => {
      if (r.chance(0.5)) {
        const th = r.step(0, 90, 10);
        const F = 0.5 * (1 + Math.cos(rad(th)) ** 2);
        return {
          q: [`A plus-polarised wave ($\\psi = 0$) arrives at an angle $\\theta = ${th}^\\circ$ from the zenith, in the vertical plane of the $x$ arm ($\\phi = 0$). Find $F_+$.`, `プラス偏光の波（$\\psi = 0$）が天頂から $${th}^\\circ$ の方向、$x$ 腕を含む鉛直面内（$\\phi = 0$）から届きます。$F_+$ を求めてください。`],
          a: { type: 'num', v: F, tol: 5e-4 },
          hint: ['With $\\phi = \\psi = 0$ only the first term of $F_+$ survives.', '$\\phi = \\psi = 0$ では $F_+$ の第一項だけが残ります。'],
          sol: [[`$F_+ = \\tfrac12(1 + \\cos^2 ${th}^\\circ) = \\tfrac12(1 + ${n(Math.cos(rad(th)) ** 2, 4)}) = ${n(F, 4)}$.`, `$F_+ = \\tfrac12(1 + \\cos^2 ${th}^\\circ) = \\tfrac12(1 + ${n(Math.cos(rad(th)) ** 2, 4)}) = ${n(F, 4)}$ です。`], ['Overhead the response is 1; even edge-on along an arm it is still one half.', '真上では応答は 1 で、腕に沿って真横から来ても 1/2 あります。']],
          set: { theta: th, phi: 0, psi: 0, mode: 0 },
        };
      }
      return {
        q: ['From which directions does an L-shaped detector (arms along $x$ and $y$) receive no signal at all, whatever the polarisation?', 'L 字型の検出器（腕は $x$ と $y$ に沿う）が、偏光によらずまったく信号を受けないのはどの方向から来た波ですか。'],
        a: { type: 'choice', v: 0, opts: [['In the plane of the arms, along the four bisectors between them ($\\theta = 90^\\circ$, $\\phi = 45^\\circ, 135^\\circ, \\dots$)', '腕の面内で、腕の間の四つの二等分線の方向（$\\theta = 90^\\circ$、$\\phi = 45^\\circ, 135^\\circ, \\dots$）'], ['Straight overhead and straight below', '真上と真下'], ['Along either arm', 'どちらかの腕に沿った方向'], ['There are no such directions', 'そのような方向はない']] },
        hint: ['Set $\\theta = 90^\\circ$ in $F_+^2 + F_\\times^2 = \\tfrac14(1 + \\cos^2\\theta)^2\\cos^2 2\\phi + \\cos^2\\theta\\sin^2 2\\phi$.', '$F_+^2 + F_\\times^2 = \\tfrac14(1 + \\cos^2\\theta)^2\\cos^2 2\\phi + \\cos^2\\theta\\sin^2 2\\phi$ に $\\theta = 90^\\circ$ を入れてください。'],
        sol: [['At $\\theta = 90^\\circ$ the second term vanishes and the first is $\\tfrac14\\cos^2 2\\phi$.', '$\\theta = 90^\\circ$ では第二項が消え、第一項は $\\tfrac14\\cos^2 2\\phi$ です。'], ['It is zero when $2\\phi = 90^\\circ, 270^\\circ, \\dots$, i.e. $\\phi = 45^\\circ, 135^\\circ, 225^\\circ, 315^\\circ$. Such a wave stretches both arms by the same amount.', '$2\\phi = 90^\\circ, 270^\\circ, \\dots$、つまり $\\phi = 45^\\circ, 135^\\circ, 225^\\circ, 315^\\circ$ でゼロになります。そのような波は二本の腕を同じだけ伸ばします。']],
        set: { theta: 90, phi: 45, mode: 2 },
      };
    },
    (r) => {
      const th = r.step(10, 170, 10), ph = r.step(0, 350, 10), ps = r.step(0, 90, 15);
      const fp = Fp(rad(th), rad(ph), rad(ps)), fx = Fx(rad(th), rad(ph), rad(ps));
      const c = Math.cos(rad(th));
      return {
        q: [`A wave arrives from $\\theta = ${th}^\\circ$, $\\phi = ${ph}^\\circ$ with polarisation angle $\\psi = ${ps}^\\circ$. Find $F_+$ and $F_\\times$.`, `波が $\\theta = ${th}^\\circ$、$\\phi = ${ph}^\\circ$ の方向から、偏光角 $\\psi = ${ps}^\\circ$ で届きます。$F_+$ と $F_\\times$ を求めてください。`],
        a: { type: 'tuple', v: [fp, fx], labels: ['$F_+$', '$F_\\times$'], tol: 0.002 },
        hint: ['Compute $A = \\tfrac12(1 + \\cos^2\\theta)\\cos 2\\phi$ and $B = \\cos\\theta\\sin 2\\phi$ first; then $F_+ = A\\cos 2\\psi - B\\sin 2\\psi$ and $F_\\times = A\\sin 2\\psi + B\\cos 2\\psi$.', 'まず $A = \\tfrac12(1 + \\cos^2\\theta)\\cos 2\\phi$、$B = \\cos\\theta\\sin 2\\phi$ を計算し、$F_+ = A\\cos 2\\psi - B\\sin 2\\psi$、$F_\\times = A\\sin 2\\psi + B\\cos 2\\psi$ とします。'],
        sol: [[`$A = \\tfrac12(1 + ${n(c * c, 4)})\\cos ${2 * ph}^\\circ = ${n(0.5 * (1 + c * c) * Math.cos(rad(2 * ph)), 4)}$, $B = ${n(c, 4)}\\sin ${2 * ph}^\\circ = ${n(c * Math.sin(rad(2 * ph)), 4)}$.`, `$A = \\tfrac12(1 + ${n(c * c, 4)})\\cos ${2 * ph}^\\circ = ${n(0.5 * (1 + c * c) * Math.cos(rad(2 * ph)), 4)}$、$B = ${n(c, 4)}\\sin ${2 * ph}^\\circ = ${n(c * Math.sin(rad(2 * ph)), 4)}$ です。`], [`$F_+ = ${n(fp, 4)}$, $F_\\times = ${n(fx, 4)}$.`, `$F_+ = ${n(fp, 4)}$、$F_\\times = ${n(fx, 4)}$ です。`], [`Changing $\\psi$ only rotates the pair $(F_+, F_\\times)$: its length $\\sqrt{A^2 + B^2} = ${n(Math.hypot(fp, fx), 4)}$ does not depend on the polarisation.`, `$\\psi$ を変えても組 $(F_+, F_\\times)$ が回るだけで、その長さ $\\sqrt{A^2 + B^2} = ${n(Math.hypot(fp, fx), 4)}$ は偏光によりません。`]],
        set: { theta: th, phi: ph, psi: ps, mode: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const F = r.pick([0.55, 0.6, 0.7, 0.75, 0.8, 0.9]);
        const th = deg(Math.acos(Math.sqrt(2 * F - 1)));
        return {
          q: [`In the vertical plane of the $x$ arm ($\\phi = 0$) and for $\\psi = 0$, at what angle $\\theta$ from the zenith (between $0^\\circ$ and $90^\\circ$) has the response fallen to $F_+ = ${n(F)}$?`, `$x$ 腕を含む鉛直面内（$\\phi = 0$）、$\\psi = 0$ で、応答が $F_+ = ${n(F)}$ に下がるのは天頂から何度（$0^\\circ$ から $90^\\circ$）の方向ですか。`],
          a: { type: 'num', v: th, tol: 0.1, unit: ['°', '°'] },
          hint: ['Solve $\\tfrac12(1 + \\cos^2\\theta) = F$ for $\\cos\\theta$.', '$\\tfrac12(1 + \\cos^2\\theta) = F$ を $\\cos\\theta$ について解きます。'],
          sol: [[`$\\cos^2\\theta = 2F - 1 = ${n(2 * F - 1)}$, so $\\cos\\theta = ${n(Math.sqrt(2 * F - 1), 4)}$.`, `$\\cos^2\\theta = 2F - 1 = ${n(2 * F - 1)}$ より $\\cos\\theta = ${n(Math.sqrt(2 * F - 1), 4)}$ です。`], [`$\\theta = ${n(th, 2)}^\\circ$. Below $F = 1/2$ there is no solution in this plane: along the arm the response never drops under one half.`, `$\\theta = ${n(th, 2)}^\\circ$ です。この面内では $F = 1/2$ 未満の解はなく、腕に沿った方向でも応答は 1/2 より下がりません。`]],
          set: { theta: Math.round(th), phi: 0, psi: 0, mode: 0 },
        };
      }
      return {
        q: ['For a source in the vertical plane of the $x$ arm ($\\phi = 0$), write the polarisation-averaged power response $F_+^2 + F_\\times^2$ as a function of the zenith angle $\\theta$ (type t for $\\theta$).', '$x$ 腕を含む鉛直面内（$\\phi = 0$）の波源について、偏光で平均した応答の二乗和 $F_+^2 + F_\\times^2$ を天頂角 $\\theta$ の関数で書いてください（$\\theta$ は t と入力）。'],
        a: { type: 'expr', v: '(1+cos(t)^2)^2/4', vars: ['t'], dom: { t: [0, 3] }, lhs: ['$F_+^2 + F_\\times^2 =$', '$F_+^2 + F_\\times^2 =$'] },
        hint: ['At $\\phi = 0$, $\\sin 2\\phi = 0$ and $\\cos 2\\phi = 1$.', '$\\phi = 0$ では $\\sin 2\\phi = 0$、$\\cos 2\\phi = 1$ です。'],
        sol: [['With $\\phi = 0$: $F_+ = \\tfrac12(1 + \\cos^2\\theta)\\cos 2\\psi$ and $F_\\times = \\tfrac12(1 + \\cos^2\\theta)\\sin 2\\psi$.', '$\\phi = 0$ では $F_+ = \\tfrac12(1 + \\cos^2\\theta)\\cos 2\\psi$、$F_\\times = \\tfrac12(1 + \\cos^2\\theta)\\sin 2\\psi$ です。'], ['Squaring and adding removes $\\psi$: $F_+^2 + F_\\times^2 = \\tfrac14(1 + \\cos^2\\theta)^2$, from 1 overhead to $1/4$ along the arm.', '二乗して足すと $\\psi$ が消え、$F_+^2 + F_\\times^2 = \\tfrac14(1 + \\cos^2\\theta)^2$ となります。真上で 1、腕の方向で $1/4$ です。']],
        set: { phi: 0, mode: 2 },
      };
    },
  ];
})();
