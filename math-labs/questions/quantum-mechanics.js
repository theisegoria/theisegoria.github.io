'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (x) => x * 180 / PI;
  const HBAR = 1.054571817e-34, ME = 9.1093837e-31, EV = 1.602176634e-19, HC = 1239.84198; // eV nm
  const E1eV = (L) => (2 * PI * HBAR) ** 2 / (8 * ME * (L * 1e-9) ** 2) / EV; // electron, L in nm
  const simpson = (f, lo, hi, k = 600) => { const h = (hi - lo) / k; let s = f(lo) + f(hi); for (let i = 1; i < k; i++) s += (i % 2 ? 4 : 2) * f(lo + i * h); return s * h / 3; };
  const Pbox = (k, a, b) => (b - a) - (Math.sin(2 * k * PI * b) - Math.sin(2 * k * PI * a)) / (2 * k * PI);

  /* ---------- 1. Particle in a box ---------- */
  Q.wavefunction = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(2, 6), m = r.int(1, k - 1);
        return {
          q: [`In an infinite square well, how many times larger is $E_{${k}}$ than $E_{${m}}$?`, `無限に深い井戸型ポテンシャルで、$E_{${k}}$ は $E_{${m}}$ の何倍ですか。`],
          a: { type: 'num', v: (k * k) / (m * m), show: m === 1 ? String(k * k) : `\\tfrac{${k * k}}{${m * m}}` },
          hint: ['$E_n \\propto n^2$.', '$E_n \\propto n^2$ です。'],
          sol: [[`$E_{${k}}/E_{${m}} = ${k}^2/${m}^2 = ${k * k}/${m * m}$.`, `$E_{${k}}/E_{${m}} = ${k}^2/${m}^2 = ${k * k}/${m * m}$ です。`], ['The levels spread apart as $n$ grows: the gap $E_{n+1} - E_n = (2n + 1)E_1$ increases, unlike a harmonic oscillator.', '$n$ が大きいほど準位の間隔 $E_{n+1} - E_n = (2n + 1)E_1$ は広がります。調和振動子とは違います。']],
          set: { n: k, mode: 0 },
        };
      }
      if (form === 1) {
        const k = r.int(1, 6);
        return {
          q: [`How many nodes (points inside the box where $|\\psi|^2 = 0$) does the eigenstate $\\psi_{${k}}$ have?`, `固有状態 $\\psi_{${k}}$ には節（箱の内部で $|\\psi|^2 = 0$ となる点）がいくつありますか。`],
          a: { type: 'int', v: k - 1 },
          hint: ['$\\sin(n\\pi x/L)$ vanishes at $x = jL/n$.', '$\\sin(n\\pi x/L)$ は $x = jL/n$ で 0 になります。'],
          sol: [[`$\\sin(${k}\\pi x/L) = 0$ at $x = jL/${k}$, $j = 0, \\dots, ${k}$; the ends are the walls.`, `$\\sin(${k}\\pi x/L) = 0$ となるのは $x = jL/${k}$（$j = 0, \\dots, ${k}$）で、両端は壁です。`], [`That leaves $${k - 1}$ interior nodes. Each extra node adds curvature to $\\psi$, and curvature is kinetic energy.`, `内部の節は $${k - 1}$ 個です。節が1つ増えるごとに $\\psi$ の曲がりが増え、その曲がりが運動エネルギーです。`]],
          set: { n: k, mode: 0 },
        };
      }
      const L = r.pick([0.5, 1, 2, 0.3, 5]), e = E1eV(L);
      return {
        q: [`An electron is confined to a box $L = ${L}$ nm wide. What is its ground-state energy $E_1 = h^2/(8mL^2)$ in eV?`, `電子が幅 $L = ${L}$ nm の箱に閉じ込められています。基底状態のエネルギー $E_1 = h^2/(8mL^2)$ は何 eV ですか。`],
        a: { type: 'num', v: e, rel: 0.01, unit: ['eV', 'eV'] },
        hint: ['For an electron, $h^2/(8m) = 0.376$ eV nm².', '電子では $h^2/(8m) = 0.376$ eV nm² です。'],
        sol: [[`$E_1 = 0.376/${L}^2 = ${sig(e, 3)}$ eV.`, `$E_1 = 0.376/${L}^2 = ${sig(e, 3)}$ eV です。`], [L <= 1 ? 'Comparable to chemical and visible-light energies, which is why quantum dots of a few nm glow in colours set by their size.' : 'Smaller than visible-photon energies; widening the box lowers the levels as $1/L^2$.', L <= 1 ? '化学や可視光のエネルギーと同程度です。数 nm の量子ドットが大きさで決まる色に光るのはこのためです。' : '可視光の光子のエネルギーより小さくなります。箱を広げると準位は $1/L^2$ で下がります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 4), [a, b] = r.pick([[0, 0.25], [0.4, 0.6], [0, 0.5], [0.25, 0.75], [0.2, 0.4], [0, 0.1], [0.45, 0.55]]);
        const p = Pbox(k, a, b);
        return {
          q: [`A particle is in the eigenstate $\\psi_{${k}}$ of a box of width $L$. What is the probability of finding it between $x = ${n(a)}L$ and $x = ${n(b)}L$? Give three decimals.`, `粒子が幅 $L$ の箱の固有状態 $\\psi_{${k}}$ にあります。$x = ${n(a)}L$ と $x = ${n(b)}L$ の間に見つかる確率を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: p, tol: 1.5e-3 },
          hint: ['$\\int 2\\sin^2(n\\pi x)\\,dx = x - \\sin(2n\\pi x)/(2n\\pi)$ with $L = 1$.', '$L = 1$ として $\\int 2\\sin^2(n\\pi x)\\,dx = x - \\sin(2n\\pi x)/(2n\\pi)$ です。'],
          sol: [[`$P = \\Big[x - \\dfrac{\\sin(${2 * k}\\pi x)}{${2 * k}\\pi}\\Big]_{${n(a)}}^{${n(b)}} = ${n(b - a)} - \\dfrac{${n(Math.sin(2 * k * PI * b), 4)} - (${n(Math.sin(2 * k * PI * a), 4)})}{${2 * k}\\pi}$.`, `$P = \\Big[x - \\dfrac{\\sin(${2 * k}\\pi x)}{${2 * k}\\pi}\\Big]_{${n(a)}}^{${n(b)}} = ${n(b - a)} - \\dfrac{${n(Math.sin(2 * k * PI * b), 4)} - (${n(Math.sin(2 * k * PI * a), 4)})}{${2 * k}\\pi}$ です。`], [`$P = ${n(p, 4)}$, against $${n(b - a)}$ for a classical particle bouncing at constant speed.`, `$P = ${n(p, 4)}$ で、一定の速さで跳ね返る古典的な粒子なら $${n(b - a)}$ です。`]],
          set: { n: k, mode: 0 },
        };
      }
      if (form === 1) {
        const L = r.pick([0.5, 0.8, 1, 1.2]), [hi, lo] = r.pick([[2, 1], [3, 2], [3, 1], [4, 3]]);
        const dE = (hi * hi - lo * lo) * E1eV(L), lam = HC / dE;
        return {
          q: [`An electron in a box $L = ${L}$ nm wide drops from $n = ${hi}$ to $n = ${lo}$. What wavelength of light does it emit, in nm?`, `幅 $L = ${L}$ nm の箱の中の電子が $n = ${hi}$ から $n = ${lo}$ に落ちます。放出される光の波長は何 nm ですか。`],
          a: { type: 'num', v: lam, rel: 0.01, unit: ['nm', 'nm'] },
          hint: ['$\\Delta E = (n_i^2 - n_f^2)E_1$, and $\\lambda = hc/\\Delta E$ with $hc = 1240$ eV nm.', '$\\Delta E = (n_i^2 - n_f^2)E_1$、$\\lambda = hc/\\Delta E$ で $hc = 1240$ eV nm です。'],
          sol: [[`$E_1 = 0.376/${L}^2 = ${n(E1eV(L), 4)}$ eV, so $\\Delta E = ${hi * hi - lo * lo} \\times ${n(E1eV(L), 4)} = ${n(dE, 4)}$ eV.`, `$E_1 = 0.376/${L}^2 = ${n(E1eV(L), 4)}$ eV なので $\\Delta E = ${hi * hi - lo * lo} \\times ${n(E1eV(L), 4)} = ${n(dE, 4)}$ eV です。`], [`$\\lambda = 1240/${n(dE, 4)} = ${n(lam, 4)}$ nm${lam > 380 && lam < 750 ? ', visible light' : lam <= 380 ? ', ultraviolet' : ', infrared'}.`, `$\\lambda = 1240/${n(dE, 4)} = ${n(lam, 4)}$ nm で、${lam > 380 && lam < 750 ? '可視光' : lam <= 380 ? '紫外線' : '赤外線'}です。`]],
          set: { n: lo, mode: hi === lo + 1 ? 1 : 0 },
        };
      }
      const k = r.int(1, 5), T = 4 / ((2 * k + 1) * PI);
      return {
        q: [`For the superposition $(\\psi_{${k}} + \\psi_{${k + 1}})/\\sqrt2$, with $E_n = n^2\\pi^2\\hbar^2/(2mL^2)$, how long does the density take to slosh back and forth once? Give the period in units of $mL^2/\\hbar$.`, `重ね合わせ $(\\psi_{${k}} + \\psi_{${k + 1}})/\\sqrt2$ で $E_n = n^2\\pi^2\\hbar^2/(2mL^2)$ のとき、密度が1往復揺れる周期を $mL^2/\\hbar$ を単位として求めてください。`],
        a: { type: 'num', v: T, rel: 0.003, show: `\\tfrac{4}{${2 * k + 1}\\pi}` },
        hint: ['The cross term in $|\\Psi|^2$ oscillates at $(E_{n+1} - E_n)/\\hbar$.', '$|\\Psi|^2$ の交差項は $(E_{n+1} - E_n)/\\hbar$ で振動します。'],
        sol: [[`$E_{${k + 1}} - E_{${k}} = (${(k + 1) ** 2} - ${k * k})\\dfrac{\\pi^2\\hbar^2}{2mL^2} = \\dfrac{${2 * k + 1}\\pi^2\\hbar^2}{2mL^2}$.`, `$E_{${k + 1}} - E_{${k}} = (${(k + 1) ** 2} - ${k * k})\\dfrac{\\pi^2\\hbar^2}{2mL^2} = \\dfrac{${2 * k + 1}\\pi^2\\hbar^2}{2mL^2}$ です。`], [`$T = \\dfrac{2\\pi\\hbar}{\\Delta E} = \\dfrac{4}{${2 * k + 1}\\pi}\\dfrac{mL^2}{\\hbar} = ${n(T, 4)}\\,mL^2/\\hbar$.`, `$T = \\dfrac{2\\pi\\hbar}{\\Delta E} = \\dfrac{4}{${2 * k + 1}\\pi}\\dfrac{mL^2}{\\hbar} = ${n(T, 4)}\\,mL^2/\\hbar$ です。`], ['Only energy differences are observable: the overall phases of the two components cancel in $|\\Psi|^2$, and only the beat survives.', '観測できるのはエネルギーの差だけです。2成分の全体の位相は $|\\Psi|^2$ で打ち消し合い、うなりだけが残ります。']],
        set: { n: k, mode: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 5);
        const X = simpson((x) => 2 * x * Math.sin(k * PI * x) * Math.sin((k + 1) * PI * x), 0, 1);
        return {
          q: [`In the superposition $(\\psi_{${k}} + \\psi_{${k + 1}})/\\sqrt2$ the mean position oscillates, $\\langle x\\rangle(t) = \\tfrac L2 + A\\cos(\\omega t)$. Find the amplitude $|A|$ in units of $L$.`, `重ね合わせ $(\\psi_{${k}} + \\psi_{${k + 1}})/\\sqrt2$ では平均位置が $\\langle x\\rangle(t) = \\tfrac L2 + A\\cos(\\omega t)$ と振動します。振幅 $|A|$ を $L$ を単位として求めてください。`],
          a: { type: 'num', v: Math.abs(X), tol: 5e-4 },
          hint: ['$A = \\int_0^L x\\,\\psi_n\\psi_{n+1}\\,dx$ (two cross terms, each with weight $\\tfrac12$). Use $2\\sin a\\sin b = \\cos(a - b) - \\cos(a + b)$.', '$A = \\int_0^L x\\,\\psi_n\\psi_{n+1}\\,dx$ です（交差項が2つ、それぞれ重み $\\tfrac12$）。$2\\sin a\\sin b = \\cos(a - b) - \\cos(a + b)$ を使います。'],
          sol: [['$\\int_0^1 2x\\sin(n\\pi x)\\sin((n+1)\\pi x)\\,dx = \\int_0^1 x\\big(\\cos\\pi x - \\cos(2n+1)\\pi x\\big)\\,dx$, and $\\int_0^1 x\\cos(m\\pi x)\\,dx = -2/(m\\pi)^2$ for odd $m$.', '$\\int_0^1 2x\\sin(n\\pi x)\\sin((n+1)\\pi x)\\,dx = \\int_0^1 x\\big(\\cos\\pi x - \\cos(2n+1)\\pi x\\big)\\,dx$ で、奇数 $m$ では $\\int_0^1 x\\cos(m\\pi x)\\,dx = -2/(m\\pi)^2$ です。'], [`$A = -\\dfrac{2}{\\pi^2}\\Big(1 - \\dfrac{1}{${(2 * k + 1) ** 2}}\\Big) = -\\dfrac{8\\cdot${k}\\cdot${k + 1}}{\\pi^2\\cdot${(2 * k + 1) ** 2}} = ${n(X, 4)}$.`, `$A = -\\dfrac{2}{\\pi^2}\\Big(1 - \\dfrac{1}{${(2 * k + 1) ** 2}}\\Big) = -\\dfrac{8\\cdot${k}\\cdot${k + 1}}{\\pi^2\\cdot${(2 * k + 1) ** 2}} = ${n(X, 4)}$ です。`], [`So $\\langle x\\rangle$ swings between $${n(0.5 - Math.abs(X), 3)}L$ and $${n(0.5 + Math.abs(X), 3)}L$, the gold line in the figure. For large $n$ the amplitude tends to $2/\\pi^2 \\approx 0.203$.`, `したがって $\\langle x\\rangle$ は $${n(0.5 - Math.abs(X), 3)}L$ と $${n(0.5 + Math.abs(X), 3)}L$ の間を揺れ、これが図の金色の線です。$n$ が大きいと振幅は $2/\\pi^2 \\approx 0.203$ に近づきます。`]],
          set: { n: k, mode: 1 },
        };
      }
      if (form === 1) {
        const k = r.int(1, 6);
        return {
          q: [`For the eigenstate $\\psi_{${k}}$ in a box with $L = 1$, write the probability $P(a)$ of finding the particle in $0 < x < a$ as a function of $a$.`, `$L = 1$ の箱の固有状態 $\\psi_{${k}}$ について、粒子が $0 < x < a$ に見つかる確率 $P(a)$ を $a$ の関数として書いてください。`],
          a: { type: 'expr', v: `a - sin(${2 * k}*pi*a)/(${2 * k}*pi)`, vars: ['a'], dom: { a: [0.05, 0.95] }, lhs: ['$P(a) =$', '$P(a) =$'] },
          hint: ['Integrate $2\\sin^2(n\\pi x) = 1 - \\cos(2n\\pi x)$.', '$2\\sin^2(n\\pi x) = 1 - \\cos(2n\\pi x)$ を積分します。'],
          sol: [[`$P(a) = \\int_0^a \\big(1 - \\cos(${2 * k}\\pi x)\\big)\\,dx = a - \\dfrac{\\sin(${2 * k}\\pi a)}{${2 * k}\\pi}$.`, `$P(a) = \\int_0^a \\big(1 - \\cos(${2 * k}\\pi x)\\big)\\,dx = a - \\dfrac{\\sin(${2 * k}\\pi a)}{${2 * k}\\pi}$ です。`], [`The correction to the classical answer $a$ is at most $1/(${2 * k}\\pi) = ${n(1 / (2 * k * PI), 3)}$: as $n$ grows, quantum probabilities approach the classical uniform ones (the correspondence principle).`, `古典的な答え $a$ からのずれは最大でも $1/(${2 * k}\\pi) = ${n(1 / (2 * k * PI), 3)}$ です。$n$ が大きくなると量子的な確率は古典的な一様分布に近づきます（対応原理）。`]],
          set: { n: k, mode: 0 },
        };
      }
      const lam = r.pick([400, 500, 600, 700, 1000, 250]);
      const L0 = Math.sqrt(3 * E1eV(1) * lam / HC);
      return {
        q: [`How wide must a box be (in nm) for an electron's $n = 1 \\to 2$ transition to absorb light of wavelength $${lam}$ nm?`, `電子の $n = 1 \\to 2$ 遷移が波長 $${lam}$ nm の光を吸収するには、箱の幅は何 nm であればよいですか。`],
        a: { type: 'num', v: L0, rel: 0.01, unit: ['nm', 'nm'] },
        hint: ['$\\Delta E = 3E_1 = 3h^2/(8mL^2) = hc/\\lambda$; solve for $L$.', '$\\Delta E = 3E_1 = 3h^2/(8mL^2) = hc/\\lambda$ を $L$ について解きます。'],
        sol: [[`$hc/\\lambda = 1240/${lam} = ${n(HC / lam, 4)}$ eV, so $E_1 = ${n(HC / lam / 3, 4)}$ eV.`, `$hc/\\lambda = 1240/${lam} = ${n(HC / lam, 4)}$ eV なので $E_1 = ${n(HC / lam / 3, 4)}$ eV です。`], [`$L = \\sqrt{0.376/${n(HC / lam / 3, 4)}} = ${n(L0, 3)}$ nm.`, `$L = \\sqrt{0.376/${n(HC / lam / 3, 4)}} = ${n(L0, 3)}$ nm です。`], [`Longer wavelengths need wider boxes, $L \\propto \\sqrt\\lambda$: this is how the colour of conjugated dye molecules is tuned by their chain length.`, `波長が長いほど広い箱が必要で、$L \\propto \\sqrt\\lambda$ です。共役系の色素分子の色が鎖の長さで調整されるのはこの仕組みです。`]],
      };
    },
  ];

  /* ---------- 2. Uncertainty ---------- */
  Q.uncertainty = [
    (r) => {
      if (r.chance(0.55)) {
        const s = r.step(0.2, 2, 0.05);
        return {
          q: [`A Gaussian packet has position width $\\Delta x = ${n(s)}$ (units with $\\hbar = 1$). What is its momentum width $\\Delta p$ at $t = 0$?`, `ガウス波束の位置の幅が $\\Delta x = ${n(s)}$ です（$\\hbar = 1$ の単位）。$t = 0$ での運動量の幅 $\\Delta p$ はいくつですか。`],
          a: { type: 'num', v: 1 / (2 * s) },
          hint: ['An unchirped Gaussian saturates $\\Delta x\\,\\Delta p = \\hbar/2$.', '位相の傾きのないガウス波束は $\\Delta x\\,\\Delta p = \\hbar/2$ をちょうど満たします。'],
          sol: [[`$\\Delta p = \\hbar/(2\\Delta x) = 1/(2 \\times ${n(s)}) = ${n(1 / (2 * s), 4)}$.`, `$\\Delta p = \\hbar/(2\\Delta x) = 1/(2 \\times ${n(s)}) = ${n(1 / (2 * s), 4)}$ です。`], ['Halve the position width and the momentum width doubles: the two densities are Fourier partners.', '位置の幅を半分にすると運動量の幅は2倍になります。2つの密度はフーリエ変換で結ばれています。']],
          set: { width: s },
        };
      }
      const [what, whatJ, dx, m] = r.pick([['an electron in an atom', '原子内の電子', 1e-10, ME], ['an electron in a 1 nm quantum dot', '1 nm の量子ドット内の電子', 1e-9, ME], ['a proton in a nucleus', '原子核内の陽子', 1e-15, 1.6726e-27], ['a 1 µg grain of dust', '1 µg の塵', 1e-6, 1e-9]]);
      const dv = HBAR / (2 * dx) / m;
      return {
        q: [`What is the smallest possible velocity spread $\\Delta v$ of ${what}, localised to $\\Delta x = ${sig(dx, 1)}$ m?`, `$\\Delta x = ${sig(dx, 1)}$ m に局在した${whatJ}の速度の広がり $\\Delta v$ の最小値はいくつですか。`],
        a: { type: 'num', v: dv, rel: 0.01, unit: ['m/s', 'm/s'] },
        hint: ['$\\Delta p \\ge \\hbar/(2\\Delta x)$ and $\\Delta v = \\Delta p/m$.', '$\\Delta p \\ge \\hbar/(2\\Delta x)$、$\\Delta v = \\Delta p/m$ です。'],
        sol: [[`$\\Delta p = 1.055\\times10^{-34}/(2 \\times ${sig(dx, 1)}) = ${sig(HBAR / (2 * dx), 3)}$ kg m/s.`, `$\\Delta p = 1.055\\times10^{-34}/(2 \\times ${sig(dx, 1)}) = ${sig(HBAR / (2 * dx), 3)}$ kg m/s です。`], [`$\\Delta v = \\Delta p/m = ${sig(dv, 3)}$ m/s. ${dv > 1e3 ? 'Enormous: confinement alone gives the particle a large kinetic energy.' : 'Utterly negligible: for everyday objects the bound never matters.'}`, `$\\Delta v = \\Delta p/m = ${sig(dv, 3)}$ m/s です。${dv > 1e3 ? '非常に大きく、閉じ込めるだけで粒子は大きな運動エネルギーをもちます。' : 'まったく無視できます。日常の物体ではこの下限は問題になりません。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 2) {
        const [what, whatJ, m, dx, unit, k] = r.pick([['an electron', '電子', ME, 1e-9, ['fs', 'fs'], 1e15], ['an electron', '電子', ME, 1e-10, ['fs', 'fs'], 1e15], ['a hydrogen atom', '水素原子', 1.6735e-27, 1e-9, ['ns', 'ns'], 1e9], ['a 1 µg grain', '1 µg の粒', 1e-9, 1e-6, ['years', '年'], 1 / 3.156e7]]);
        const t = 2 * Math.sqrt(3) * m * dx * dx / HBAR * k;
        return {
          q: [`A free Gaussian packet for ${what} starts with $\\Delta x_0 = ${sig(dx, 1)}$ m. How long until its width has doubled? ($\\Delta x(t) = \\Delta x_0\\sqrt{1 + (\\hbar t/2m\\Delta x_0^2)^2}$.)`, `${whatJ}の自由なガウス波束が $\\Delta x_0 = ${sig(dx, 1)}$ m から出発します。幅が2倍になるまでどれだけかかりますか（$\\Delta x(t) = \\Delta x_0\\sqrt{1 + (\\hbar t/2m\\Delta x_0^2)^2}$）。`],
          a: { type: 'num', v: t, rel: 0.01, unit },
          hint: ['Doubling needs $\\hbar t/(2m\\Delta x_0^2) = \\sqrt3$.', '2倍になるには $\\hbar t/(2m\\Delta x_0^2) = \\sqrt3$ が必要です。'],
          sol: [[`$t = 2\\sqrt3\\,m\\Delta x_0^2/\\hbar = 2\\sqrt3 \\times ${sig(m, 4)} \\times ${sig(dx * dx, 1)}/1.055\\times10^{-34}$.`, `$t = 2\\sqrt3\\,m\\Delta x_0^2/\\hbar = 2\\sqrt3 \\times ${sig(m, 4)} \\times ${sig(dx * dx, 1)}/1.055\\times10^{-34}$ です。`], [`$t = ${sig(t, 3)}$ ${unit[0]}. ${k < 1 ? 'Far longer than the age of the universe: macroscopic objects stay put.' : 'Very fast: microscopic packets blur almost at once unless something keeps them localised.'}`, `$t = ${sig(t, 3)}$ ${unit[1]}です。${k < 1 ? '宇宙の年齢よりはるかに長く、巨視的な物体は広がりません。' : '非常に速く、何かが局在を保たない限り、微視的な波束はほとんど瞬時にぼやけます。'}`]],
        };
      }
      const s = r.pick([0.3, 0.5, 0.7, 1, 1.5, 0.4]), t = r.pick([0.5, 1, 2, 3, 4 * s * s]);
      const g = Math.sqrt(1 + (t / (2 * s * s)) ** 2);
      if (form === 0) {
        return {
          q: [`With $\\hbar = m = 1$, a free Gaussian starts with $\\Delta x_0 = ${n(s)}$. What is its width at $t = ${n(t)}$?`, `$\\hbar = m = 1$ で、自由なガウス波束が $\\Delta x_0 = ${n(s)}$ から出発します。$t = ${n(t)}$ での幅はいくつですか。`],
          a: { type: 'num', v: s * g },
          hint: ['$\\Delta x(t) = \\Delta x_0\\sqrt{1 + (t/2\\Delta x_0^2)^2}$.', '$\\Delta x(t) = \\Delta x_0\\sqrt{1 + (t/2\\Delta x_0^2)^2}$ です。'],
          sol: [[`$t/(2\\Delta x_0^2) = ${n(t)}/${n(2 * s * s)} = ${n(t / (2 * s * s), 4)}$.`, `$t/(2\\Delta x_0^2) = ${n(t)}/${n(2 * s * s)} = ${n(t / (2 * s * s), 4)}$ です。`], [`$\\Delta x = ${n(s)}\\sqrt{1 + ${n((t / (2 * s * s)) ** 2, 4)}} = ${n(s * g, 4)}$; $\\Delta p$ is still $${n(1 / (2 * s), 4)}$, since free motion does not change the momentum density.`, `$\\Delta x = ${n(s)}\\sqrt{1 + ${n((t / (2 * s * s)) ** 2, 4)}} = ${n(s * g, 4)}$ です。自由運動は運動量の密度を変えないので、$\\Delta p$ は $${n(1 / (2 * s), 4)}$ のままです。`]],
          set: { width: s },
        };
      }
      return {
        q: [`With $\\hbar = m = 1$, a free Gaussian starts with $\\Delta x_0 = ${n(s)}$. What is the product $\\Delta x\\,\\Delta p$ at $t = ${n(t)}$, in units of $\\hbar$?`, `$\\hbar = m = 1$ で、自由なガウス波束が $\\Delta x_0 = ${n(s)}$ から出発します。$t = ${n(t)}$ での積 $\\Delta x\\,\\Delta p$ は $\\hbar$ の何倍ですか。`],
        a: { type: 'num', v: 0.5 * g },
        hint: ['$\\Delta p$ stays $1/(2\\Delta x_0)$; only $\\Delta x$ grows.', '$\\Delta p$ は $1/(2\\Delta x_0)$ のままで、$\\Delta x$ だけが増えます。'],
        sol: [[`$\\Delta x\\,\\Delta p = \\tfrac12\\sqrt{1 + (t/2\\Delta x_0^2)^2} = \\tfrac12\\sqrt{1 + ${n((t / (2 * s * s)) ** 2, 4)}}$.`, `$\\Delta x\\,\\Delta p = \\tfrac12\\sqrt{1 + (t/2\\Delta x_0^2)^2} = \\tfrac12\\sqrt{1 + ${n((t / (2 * s * s)) ** 2, 4)}}$ です。`], [`$= ${n(0.5 * g, 4)}$. The spread packet is no longer minimal: it has developed a position-dependent phase (faster parts ahead), which the bound counts.`, `$= ${n(0.5 * g, 4)}$ です。広がった波束はもはや最小ではありません。位置に依存する位相（速い成分が前に出る）が生じ、下限はそれも数えるからです。`]],
        set: { width: s },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.pick([0.5, 1, 0.8, 1.5, 2, 0.4]);
        return {
          q: [`With $\\hbar = m = 1$, write the width $\\Delta x(t)$ of a free Gaussian packet that starts with $\\Delta x_0 = ${n(s)}$.`, `$\\hbar = m = 1$ で、$\\Delta x_0 = ${n(s)}$ から出発する自由なガウス波束の幅 $\\Delta x(t)$ を書いてください。`],
          a: { type: 'expr', v: `${s}*sqrt(1+(t/${2 * s * s})^2)`, vars: ['t'], dom: { t: [0, 4] }, lhs: ['$\\Delta x(t) =$', '$\\Delta x(t) =$'] },
          hint: ['The variance grows as $\\Delta x_0^2 + (\\Delta p\\,t/m)^2$ with $\\Delta p = 1/(2\\Delta x_0)$.', '分散は $\\Delta x_0^2 + (\\Delta p\\,t/m)^2$ で増え、$\\Delta p = 1/(2\\Delta x_0)$ です。'],
          sol: [[`$\\Delta x^2 = ${n(s * s)} + (t/${n(2 * s)})^2$.`, `$\\Delta x^2 = ${n(s * s)} + (t/${n(2 * s)})^2$ です。`], [`$\\Delta x(t) = ${n(s)}\\sqrt{1 + (t/${n(2 * s * s)})^2}$. At late times $\\Delta x \\approx \\Delta p\\,t$: the packet spreads like a cloud of classical particles with that velocity spread.`, `$\\Delta x(t) = ${n(s)}\\sqrt{1 + (t/${n(2 * s * s)})^2}$ です。十分時間が経つと $\\Delta x \\approx \\Delta p\\,t$ となり、その速度の広がりをもつ古典的な粒子の雲のように広がります。`]],
          set: { width: s },
        };
      }
      if (form === 1) {
        const s = r.pick([0.5, 0.75, 1, 1.25, 1.5, 2]), T = 2 * s * s;
        return {
          q: [`You want a free Gaussian packet ($\\hbar = m = 1$) to be as narrow as possible at time $T = ${n(T)}$. What initial width $\\Delta x_0$ should you choose?`, `自由なガウス波束（$\\hbar = m = 1$）を時刻 $T = ${n(T)}$ でできるだけ狭くしたいとします。初めの幅 $\\Delta x_0$ をいくつに選べばよいですか。`],
          a: { type: 'num', v: s, tol: 2e-3 },
          hint: ['Minimise $\\Delta x(T)^2 = \\Delta x_0^2 + T^2/(4\\Delta x_0^2)$ over $\\Delta x_0$.', '$\\Delta x(T)^2 = \\Delta x_0^2 + T^2/(4\\Delta x_0^2)$ を $\\Delta x_0$ について最小化します。'],
          sol: [['Setting the derivative in $u = \\Delta x_0^2$ to zero: $1 - T^2/(4u^2) = 0$, so $u = T/2$.', '$u = \\Delta x_0^2$ で微分して 0 とおくと $1 - T^2/(4u^2) = 0$ より $u = T/2$ です。'], [`$\\Delta x_0 = \\sqrt{T/2} = ${n(s, 4)}$, giving $\\Delta x(T) = \\sqrt T = ${n(Math.sqrt(T), 4)}$, exactly $\\sqrt2$ times wider than at the start.`, `$\\Delta x_0 = \\sqrt{T/2} = ${n(s, 4)}$ で、$\\Delta x(T) = \\sqrt T = ${n(Math.sqrt(T), 4)}$ となり、最初のちょうど $\\sqrt2$ 倍です。`], ['Too narrow and the large $\\Delta p$ spreads it; too wide and it starts wide. This trade-off sets the standard quantum limit for repeated position measurements.', '狭すぎると大きな $\\Delta p$ で広がり、広すぎると最初から広いのです。このトレードオフが、繰り返し位置測定の標準量子限界を決めます。']],
          set: { width: s },
        };
      }
      const Z = r.int(1, 5), a0 = 0.0529177, Ry = 13.6057;
      const ask = r.int(0, 1);
      return {
        q: [`Estimate the ground state of a hydrogen-like ion with nuclear charge $Z = ${Z}$: take $p \\approx \\hbar/r$ and minimise $E(r) = \\dfrac{\\hbar^2}{2mr^2} - \\dfrac{Zke^2}{r}$. What ${ask ? 'energy (in eV)' : 'radius (in nm)'} does this give? ($a_0 = 0.0529$ nm, $13.6$ eV.)`, `核電荷 $Z = ${Z}$ の水素様イオンの基底状態を見積もります。$p \\approx \\hbar/r$ として $E(r) = \\dfrac{\\hbar^2}{2mr^2} - \\dfrac{Zke^2}{r}$ を最小化すると、${ask ? 'エネルギー（eV）' : '半径（nm）'}はいくつになりますか（$a_0 = 0.0529$ nm、$13.6$ eV）。`],
        a: ask ? { type: 'num', v: -Ry * Z * Z, rel: 0.005, unit: ['eV', 'eV'] } : { type: 'num', v: a0 / Z, rel: 0.005, unit: ['nm', 'nm'] },
        hint: ['$dE/dr = 0$ gives $r = \\hbar^2/(Zmke^2) = a_0/Z$.', '$dE/dr = 0$ から $r = \\hbar^2/(Zmke^2) = a_0/Z$ です。'],
        sol: [[`$-\\hbar^2/(mr^3) + Zke^2/r^2 = 0$, so $r = a_0/Z = ${n(a0 / Z, 4)}$ nm.`, `$-\\hbar^2/(mr^3) + Zke^2/r^2 = 0$ より $r = a_0/Z = ${n(a0 / Z, 4)}$ nm です。`], [`Then $E = -Z^2\\,\\dfrac{mk^2e^4}{2\\hbar^2} = -13.6\\,Z^2 = ${n(-Ry * Z * Z, 4)}$ eV.`, `このとき $E = -Z^2\\,\\dfrac{mk^2e^4}{2\\hbar^2} = -13.6\\,Z^2 = ${n(-Ry * Z * Z, 4)}$ eV です。`], ['The crude estimate happens to give the exact answer. The point stands regardless: the uncertainty principle is what stops the electron falling into the nucleus.', 'この大まかな見積もりは偶然にも厳密な答えと一致します。いずれにせよ要点は、電子が原子核に落ち込まないのは不確定性原理のおかげだということです。']],
      };
    },
  ];

  /* ---------- 3. Bloch sphere ---------- */
  const NAMED = [[0, 0, '|0\\rangle'], [180, 0, '|1\\rangle'], [90, 0, '|+\\rangle'], [90, 180, '|-\\rangle'], [90, 90, '|{+i}\\rangle'], [90, -90, '|{-i}\\rangle']];
  Q.bloch = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([0, 30, 60, 90, 120, 150, 180, 45, 135]), ph = r.step(-180, 180, 45);
        const p = Math.cos(rad(th / 2)) ** 2;
        return {
          q: [`A qubit sits at $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$ on the Bloch sphere. What is the probability of measuring $0$ along $z$?`, `量子ビットがブロッホ球上の $\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ にあります。$z$ 方向に測定して $0$ が出る確率はいくつですか。`],
          a: { type: 'num', v: p, tol: 1e-3 },
          hint: ['$P(0) = |\\alpha|^2 = \\cos^2(\\theta/2)$; $\\varphi$ plays no part.', '$P(0) = |\\alpha|^2 = \\cos^2(\\theta/2)$ で、$\\varphi$ は関係しません。'],
          sol: [[`$P(0) = \\cos^2(${th / 2}^\\circ) = ${n(p, 4)}$.`, `$P(0) = \\cos^2(${th / 2}^\\circ) = ${n(p, 4)}$ です。`], ['Equivalently $P(0) = (1 + z)/2$, where $z = \\cos\\theta$ is the height of the Bloch vector.', '同じことですが、ブロッホベクトルの高さ $z = \\cos\\theta$ を使うと $P(0) = (1 + z)/2$ です。']],
          set: { theta: th, phi: ph },
        };
      }
      if (form === 1) {
        const k = r.int(0, 5), [th, ph, ket] = NAMED[k];
        const opts = NAMED.map((x) => [`$${x[2]}$`, `$${x[2]}$`]);
        return {
          q: [`Which state is at $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$ on the Bloch sphere?`, `ブロッホ球上の $\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ にある状態はどれですか。`],
          a: { type: 'choice', opts, v: k },
          hint: ['$|\\psi\\rangle = \\cos\\tfrac\\theta2|0\\rangle + e^{i\\varphi}\\sin\\tfrac\\theta2|1\\rangle$.', '$|\\psi\\rangle = \\cos\\tfrac\\theta2|0\\rangle + e^{i\\varphi}\\sin\\tfrac\\theta2|1\\rangle$ です。'],
          sol: [[`$\\cos(${th / 2}^\\circ)|0\\rangle + e^{i\\,${ph}^\\circ}\\sin(${th / 2}^\\circ)|1\\rangle = ${ket}$.`, `$\\cos(${th / 2}^\\circ)|0\\rangle + e^{i\\,${ph}^\\circ}\\sin(${th / 2}^\\circ)|1\\rangle = ${ket}$ です。`], ['The six cardinal points are the eigenstates of $\\sigma_z$ (poles), $\\sigma_x$ and $\\sigma_y$ (equator); opposite points are orthogonal.', '6つの基本点は $\\sigma_z$（極）、$\\sigma_x$ と $\\sigma_y$（赤道）の固有状態で、向かい合う点どうしは直交します。']],
          set: { theta: th, phi: ph },
        };
      }
      const th = r.pick([30, 60, 90, 120, 45, 150]), ph = r.pick([0, 45, 90, 135, 180, -90, -45, 60]);
      const s = [Math.sin(rad(th)) * Math.cos(rad(ph)), Math.sin(rad(th)) * Math.sin(rad(ph)), Math.cos(rad(th))];
      return {
        q: [`Find the Bloch vector $(\\langle\\sigma_x\\rangle, \\langle\\sigma_y\\rangle, \\langle\\sigma_z\\rangle)$ of the state with $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$.`, `$\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ の状態のブロッホベクトル $(\\langle\\sigma_x\\rangle, \\langle\\sigma_y\\rangle, \\langle\\sigma_z\\rangle)$ を求めてください。`],
        a: { type: 'tuple', v: s, labels: ['$x$', '$y$', '$z$'], tol: 2e-3 },
        hint: ['Spherical coordinates on the unit sphere.', '単位球面上の球座標です。'],
        sol: [[`$(\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta) = (${n(s[0], 4)}, ${n(s[1], 4)}, ${n(s[2], 4)})$.`, `$(\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta) = (${n(s[0], 4)}, ${n(s[1], 4)}, ${n(s[2], 4)})$ です。`], ['Each component is an expectation value: measuring along that axis gives $+1$ with probability $(1 + \\text{component})/2$.', '各成分は期待値です。その軸に沿って測定すると、確率 $(1 + \\text{成分})/2$ で $+1$ が出ます。']],
        set: { theta: th, phi: ph },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([60, 90, 120, 45, 135, 30, 150]), ph = r.pick([0, 30, 45, 60, 90, 120, 135, -45, -90, 180]);
        const a = Math.cos(rad(th / 2)), b = Math.sin(rad(th / 2));
        return {
          q: [`A qubit is $|\\psi\\rangle = ${n(a, 4)}|0\\rangle + ${n(b, 4)}\\,e^{i\\,${ph}^\\circ}|1\\rangle$. Find its Bloch angles $(\\theta, \\varphi)$ in degrees.`, `量子ビットが $|\\psi\\rangle = ${n(a, 4)}|0\\rangle + ${n(b, 4)}\\,e^{i\\,${ph}^\\circ}|1\\rangle$ です。ブロッホ角 $(\\theta, \\varphi)$ を度で求めてください。`],
          a: { type: 'tuple', v: [th, ph], labels: ['$\\theta$', '$\\varphi$'], tol: 0.3 },
          hint: ['$\\cos(\\theta/2) = |\\alpha|$, and $\\varphi$ is the phase of $\\beta$ relative to $\\alpha$.', '$\\cos(\\theta/2) = |\\alpha|$ で、$\\varphi$ は $\\alpha$ に対する $\\beta$ の位相です。'],
          sol: [[`$\\theta = 2\\arccos(${n(a, 4)}) = ${th}^\\circ$.`, `$\\theta = 2\\arccos(${n(a, 4)}) = ${th}^\\circ$ です。`], [`$\\varphi = ${ph}^\\circ$, read off the phase of the $|1\\rangle$ amplitude. The angle is halved because opposite points of the sphere are orthogonal states.`, `$\\varphi = ${ph}^\\circ$ は $|1\\rangle$ の振幅の位相から読み取れます。角度が半分になるのは、球の向かい合う点が直交する状態だからです。`]],
          set: { theta: th, phi: ph },
        };
      }
      const th = r.pick([30, 60, 90, 120, 150, 45]), ph = r.pick([0, 45, 60, 90, 120, 180, -60, -135]);
      const ax = form === 1 ? 'x' : 'y';
      const comp = ax === 'x' ? Math.sin(rad(th)) * Math.cos(rad(ph)) : Math.sin(rad(th)) * Math.sin(rad(ph));
      const p = (1 + comp) / 2;
      return {
        q: [`The qubit at $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$ is measured along $${ax}$. What is the probability of the outcome $${ax === 'x' ? '|+\\rangle' : '|{+i}\\rangle'}$?`, `$\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ の量子ビットを $${ax}$ 方向に測定します。結果が $${ax === 'x' ? '|+\\rangle' : '|{+i}\\rangle'}$ となる確率はいくつですか。`],
        a: { type: 'num', v: p, tol: 1e-3 },
        hint: [`The probability is $(1 + ${ax}_{\\text{Bloch}})/2$, the same rule as for $z$ with the axis turned.`, `確率は $(1 + ${ax}_{\\text{Bloch}})/2$ で、軸を回しただけで $z$ と同じ規則です。`],
        sol: [[`$${ax} = \\sin\\theta\\,${ax === 'x' ? '\\cos' : '\\sin'}\\varphi = \\sin ${th}^\\circ\\,${ax === 'x' ? '\\cos' : '\\sin'}(${ph}^\\circ) = ${n(comp, 4)}$.`, `$${ax} = \\sin\\theta\\,${ax === 'x' ? '\\cos' : '\\sin'}\\varphi = \\sin ${th}^\\circ\\,${ax === 'x' ? '\\cos' : '\\sin'}(${ph}^\\circ) = ${n(comp, 4)}$ です。`], [`$P = (1 + ${n(comp, 4)})/2 = ${n(p, 4)}$. Unlike $P(0)$, this depends on $\\varphi$: the relative phase is invisible along $z$ but decides the outcome along the equator.`, `$P = (1 + ${n(comp, 4)})/2 = ${n(p, 4)}$ です。$P(0)$ と違い、これは $\\varphi$ に依存します。相対位相は $z$ 方向では見えませんが、赤道方向の結果を決めます。`]],
        set: { theta: th, phi: ph },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const B = r.pick([1.5, 3, 7, 0.5, 1]), f = 42.577 * B, k = r.pick([1, 2, 3, 4, 6]), t = k / (8 * f) * 1e3; // ns
        const ang = 45 * k, p = (1 + Math.cos(rad(ang))) / 2;
        return {
          q: [`A proton spin starts as $|+\\rangle$ ($\\theta = 90^\\circ$, $\\varphi = 0$) in a field of $${B}$ T along $z$, where it precesses at $f = 42.58$ MHz/T $\\times B$. After $${n(t, 4)}$ ns, what is the probability of measuring $|+\\rangle$ again?`, `陽子のスピンが $|+\\rangle$（$\\theta = 90^\\circ$、$\\varphi = 0$）から、$z$ 方向の $${B}$ T の磁場の中で出発し、$f = 42.58$ MHz/T $\\times B$ で歳差運動します。$${n(t, 4)}$ ns 後に再び $|+\\rangle$ が測定される確率はいくつですか。`],
          a: { type: 'num', v: p, tol: 2e-3 },
          hint: ['Precession changes $\\varphi$ at $2\\pi f$ and leaves $\\theta$ alone; then use $P(+) = (1 + \\sin\\theta\\cos\\varphi)/2$.', '歳差運動は $\\varphi$ を $2\\pi f$ で変え、$\\theta$ は変えません。そのうえで $P(+) = (1 + \\sin\\theta\\cos\\varphi)/2$ を使います。'],
          sol: [[`$f = 42.58 \\times ${B} = ${n(f, 4)}$ MHz, so in $${n(t, 4)}$ ns the spin turns through $360^\\circ \\times ${n(f, 4)}\\times10^{6} \\times ${n(t, 4)}\\times10^{-9} = ${ang}^\\circ$.`, `$f = 42.58 \\times ${B} = ${n(f, 4)}$ MHz なので、$${n(t, 4)}$ ns でスピンは $360^\\circ \\times ${n(f, 4)}\\times10^{6} \\times ${n(t, 4)}\\times10^{-9} = ${ang}^\\circ$ 回ります。`], [`$P(+) = (1 + \\cos ${ang}^\\circ)/2 = ${n(p, 4)}$. ${B === 1.5 || B === 3 ? 'This precession, at ' + n(f, 4) + ' MHz, is the radio signal an MRI scanner listens to.' : 'Measuring $P(+)$ against time traces the precession, as in magnetic resonance.'}`, `$P(+) = (1 + \\cos ${ang}^\\circ)/2 = ${n(p, 4)}$ です。${B === 1.5 || B === 3 ? 'この ' + n(f, 4) + ' MHz の歳差運動が、MRI 装置が受信する電波信号です。' : '$P(+)$ を時間に対して測ると、磁気共鳴と同じく歳差運動をたどれます。'}`]],
          set: { theta: 90, phi: ((540 - ang) % 360) - 180 },
        };
      }
      if (form === 1) {
        const th = r.pick([30, 60, 90, 120, 45]);
        return {
          q: [`A spin with polar angle $\\theta_0 = ${th}^\\circ$ and $\\varphi = 0$ at $t = 0$ precesses about $z$ at angular frequency $\\omega = 1$. Write $P(+x)$ as a function of $t$.`, `極角 $\\theta_0 = ${th}^\\circ$、$t = 0$ で $\\varphi = 0$ のスピンが、$z$ 軸のまわりを角振動数 $\\omega = 1$ で歳差運動します。$P(+x)$ を $t$ の関数として書いてください。`],
          a: { type: 'expr', v: `(1+${Math.sin(rad(th))}*cos(t))/2`, vars: ['t'], dom: { t: [0, 6] }, lhs: ['$P(+x) =$', '$P(+x) =$'] },
          hint: ['Precession about $z$ keeps $\\theta$ and advances $\\varphi$ uniformly; the sign of the rotation does not affect $\\cos\\varphi$.', '$z$ 軸のまわりの歳差運動は $\\theta$ を保ち、$\\varphi$ を一様に進めます。回転の向きは $\\cos\\varphi$ に影響しません。'],
          sol: [['$\\varphi(t) = \\pm t$ and $\\theta$ stays fixed.', '$\\varphi(t) = \\pm t$ で、$\\theta$ は一定です。'], [`$P(+x) = \\tfrac12\\big(1 + \\sin ${th}^\\circ\\cos t\\big) = \\tfrac12\\big(1 + ${n(Math.sin(rad(th)), 4)}\\cos t\\big)$.`, `$P(+x) = \\tfrac12\\big(1 + \\sin ${th}^\\circ\\cos t\\big) = \\tfrac12\\big(1 + ${n(Math.sin(rad(th)), 4)}\\cos t\\big)$ です。`], [`The contrast of the oscillation is $\\sin\\theta_0$: largest on the equator, zero at the poles, where precession changes nothing.`, `振動の振れ幅は $\\sin\\theta_0$ で、赤道で最大、極では 0 です。極では歳差運動しても何も変わりません。`]],
          set: { theta: th, phi: 0 },
        };
      }
      const p = r.pick([0.25, 0.75, 0.1, 0.5, 0.9, 0.3]), th = 2 * deg(Math.asin(Math.sqrt(p)));
      return {
        q: [`At what polar angle $\\theta$ (degrees) does a qubit give $1$ along $z$ with probability $${n(p)}$?`, `$z$ 方向の測定で確率 $${n(p)}$ で $1$ が出る量子ビットの極角 $\\theta$（度）はいくつですか。`],
        a: { type: 'num', v: th, tol: 0.1, unit: ['°', '°'] },
        hint: ['$P(1) = \\sin^2(\\theta/2)$.', '$P(1) = \\sin^2(\\theta/2)$ です。'],
        sol: [[`$\\sin(\\theta/2) = \\sqrt{${n(p)}} = ${n(Math.sqrt(p), 4)}$.`, `$\\sin(\\theta/2) = \\sqrt{${n(p)}} = ${n(Math.sqrt(p), 4)}$ です。`], [`$\\theta = 2\\arcsin(${n(Math.sqrt(p), 4)}) = ${n(th, 3)}^\\circ$. Every $\\varphi$ works: the whole circle of latitude has the same $z$ statistics.`, `$\\theta = 2\\arcsin(${n(Math.sqrt(p), 4)}) = ${n(th, 3)}^\\circ$ です。$\\varphi$ は何でもかまいません。緯線全体が同じ $z$ の統計をもちます。`]],
        set: { theta: Math.round(th) },
      };
    },
  ];
})();
