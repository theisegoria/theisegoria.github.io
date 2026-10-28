'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, mat } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;

  /* ---------- 1. deformation gradient (2 x 2) ---------- */
  const det = (F) => F[0][0] * F[1][1] - F[0][1] * F[1][0];
  const C = (F) => [[F[0][0] ** 2 + F[1][0] ** 2, F[0][0] * F[0][1] + F[1][0] * F[1][1]], [F[0][0] * F[0][1] + F[1][0] * F[1][1], F[0][1] ** 2 + F[1][1] ** 2]];
  const eig = (a, b, d) => { const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b); return [m + r, m - r]; };
  function randF(r, lo = -1.5, hi = 1.5) {
    let F; do { F = [[r.step(0.5, 2, 0.1), r.step(lo, hi, 0.1)], [r.step(lo, hi, 0.1), r.step(0.5, 2, 0.1)]]; } while (det(F) < 0.2);
    return F;
  }
  const setF = (F, rot = 0) => ({ f11: F[0][0], f12: F[0][1], f21: F[1][0], f22: F[1][1], rot });
  const Ftex = (F) => mat(F.map((row) => row.map((x) => Number(x.toFixed(2)))));

  Q['deformation-gradient'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let F; do { F = [[r.step(-1.5, 2, 0.1), r.step(-1.5, 1.5, 0.1)], [r.step(-1.5, 1.5, 0.1), r.step(-1.5, 2, 0.1)]]; } while (Math.abs(det(F)) < 0.05);
        const J = det(F);
        return {
          q: [`A homogeneous deformation has $F = ${Ftex(F)}$. By what factor does it change areas?`, `一様な変形の変形勾配が $F = ${Ftex(F)}$ です。面積は何倍になりますか。`],
          a: { type: 'num', v: J, tol: 1e-4 },
          hint: ['The area ratio is $J = \\det F$; its sign says whether the material is turned inside out.', '面積の比は $J = \\det F$ です。その符号は材料が裏返されたかどうかを表します。'],
          sol: [[`$J = (${n(F[0][0])})(${n(F[1][1])}) - (${n(F[0][1])})(${n(F[1][0])}) = ${n(J, 4)}$.`, `$J = (${n(F[0][0])})(${n(F[1][1])}) - (${n(F[0][1])})(${n(F[1][0])}) = ${n(J, 4)}$ です。`], [J > 0 ? `Areas are multiplied by $${n(J, 4)}$${Math.abs(J - 1) < 1e-9 ? ': the deformation keeps area exactly' : ''}.` : 'Negative: the square has been turned over, which no real material can do, so this $F$ is not admissible.', J > 0 ? `面積は $${n(J, 4)}$ 倍になります${Math.abs(J - 1) < 1e-9 ? '。この変形は面積を厳密に保ちます' : ''}。` : '負なので正方形が裏返されています。現実の材料にはできないことで、この $F$ は許されません。']],
          set: setF(F),
        };
      }
      if (form === 1) {
        const F = randF(r), which = r.int(0, 2), e = [F[0][0] - 1, (F[0][1] + F[1][0]) / 2, F[1][1] - 1][which], lab = ['\\varepsilon_{11}', '\\varepsilon_{12}', '\\varepsilon_{22}'][which];
        return {
          q: [`For $F = ${Ftex(F)}$, find the small-strain component $${lab}$ of $\\varepsilon = \\tfrac12(F + F^{\\mathsf T}) - I$.`, `$F = ${Ftex(F)}$ について、微小ひずみ $\\varepsilon = \\tfrac12(F + F^{\\mathsf T}) - I$ の成分 $${lab}$ を求めてください。`],
          a: { type: 'num', v: e, tol: 1e-4 },
          sol: [[which === 1 ? `$\\varepsilon_{12} = \\tfrac12(F_{12} + F_{21}) = \\tfrac12(${n(F[0][1])} + ${n(F[1][0])}) = ${n(e)}$.` : `$${lab} = F_{${which ? 22 : 11}} - 1 = ${n(e)}$.`, which === 1 ? `$\\varepsilon_{12} = \\tfrac12(F_{12} + F_{21}) = \\tfrac12(${n(F[0][1])} + ${n(F[1][0])}) = ${n(e)}$ です。` : `$${lab} = F_{${which ? 22 : 11}} - 1 = ${n(e)}$ です。`], ['This is only the linear part of the strain: it treats every displacement gradient as small, which is why it goes wrong under large rotations.', 'これはひずみの一次の部分にすぎません。変位勾配をすべて小さいとみなすので、大きな回転のもとでは誤ります。']],
          set: setF(F),
        };
      }
      const k = r.int(0, 2);
      let F;
      if (k === 0) { const g = r.step(-1, 1, 0.1) || 0.5; F = r.chance(0.5) ? [[1, g], [0, 1]] : [[1, 0], [g, 1]]; }
      else if (k === 1) F = [[r.pick([1.5, 2, 0.5, 1.2]), r.step(-0.5, 0.5, 0.1)], [0, r.pick([1.5, 2, 1.1])]];
      else { const a = r.step(0.5, 1.5, 0.1); F = [[a, r.step(0.5, 1.5, 0.1)], [r.step(0.5, 1.5, 0.1), -r.step(0.2, 1, 0.1)]]; }
      const J = det(F), v = J <= 1e-9 ? 2 : Math.abs(J - 1) < 1e-9 ? 0 : 1;
      return {
        q: [`What does $F = ${Ftex(F)}$ do to the material?`, `$F = ${Ftex(F)}$ は材料に何をしますか。`],
        a: { type: 'choice', opts: [['A real deformation that keeps every area ($J = 1$)', '面積をすべて保つ現実の変形（$J = 1$）'], ['A real deformation that changes areas ($J > 0$, $J \\ne 1$)', '面積を変える現実の変形（$J > 0$、$J \\ne 1$）'], ['Nothing real: it turns the material inside out ($J \\le 0$)', '現実にはありえない。材料を裏返す（$J \\le 0$）']], v, fixed: true },
        hint: ['Compute $J = \\det F$.', '$J = \\det F$ を計算してください。'],
        sol: [[`$J = ${n(J, 4)}$.`, `$J = ${n(J, 4)}$ です。`], [['$J = 1$: a shear like this changes shapes and lengths but not areas.', '$J > 0$: allowed, and areas are scaled by $J$.', '$J \\le 0$: two material lines have crossed through each other, which matter cannot do, so every deformation gradient must have $J > 0$.'][v], ['$J = 1$ なので、このようなせん断は形と長さを変えても面積は変えません。', '$J > 0$ なので許され、面積は $J$ 倍になります。', '$J \\le 0$ なので、二本の材料の線が互いをすり抜けています。物質にはできないことなので、変形勾配には必ず $J > 0$ が要求されます。'][v]]],
        set: setF(F),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const F = randF(r), c = C(F), E = [(c[0][0] - 1) / 2, c[0][1] / 2, (c[1][1] - 1) / 2];
        return {
          q: [`For $F = ${Ftex(F)}$, find the Green–Lagrange strain $E = \\tfrac12(F^{\\mathsf T}F - I)$: give $E_{11}$, $E_{12}$, $E_{22}$.`, `$F = ${Ftex(F)}$ について、グリーン・ラグランジュひずみ $E = \\tfrac12(F^{\\mathsf T}F - I)$ の $E_{11}$、$E_{12}$、$E_{22}$ を求めてください。`],
          a: { type: 'tuple', v: E, labels: ['$E_{11}$', '$E_{12}$', '$E_{22}$'], tol: 1e-4 },
          hint: ['$C = F^{\\mathsf T}F$ has the squared lengths of the two columns of $F$ on its diagonal and their dot product off it.', '$C = F^{\\mathsf T}F$ の対角には $F$ の二つの列の長さの二乗が、非対角にはそれらの内積が並びます。'],
          sol: [[`$C = F^{\\mathsf T}F = ${mat([[c[0][0], c[0][1]], [c[1][0], c[1][1]]])}$.`, `$C = F^{\\mathsf T}F = ${mat([[c[0][0], c[0][1]], [c[1][0], c[1][1]]])}$ です。`], [`$E = \\tfrac12(C - I)$: $E_{11} = ${n(E[0])}$, $E_{12} = ${n(E[1])}$, $E_{22} = ${n(E[2])}$.`, `$E = \\tfrac12(C - I)$ より $E_{11} = ${n(E[0])}$、$E_{12} = ${n(E[1])}$、$E_{22} = ${n(E[2])}$ です。`], ['$E_{11}$ says how a fibre along $x$ changed length, $\\tfrac12(\\ell^2 - 1)$, and $E_{12}$ how the right angle between the two fibres closed.', '$E_{11}$ は $x$ 方向の繊維の長さの変化 $\\tfrac12(\\ell^2 - 1)$ を、$E_{12}$ は二本の繊維の間の直角がどれだけ閉じたかを表します。']],
          set: setF(F),
        };
      }
      if (form === 1) {
        const F = randF(r), c = C(F), [a, b] = eig(c[0][0], c[0][1], c[1][1]);
        return {
          q: [`Find the principal stretches $\\lambda_1 \\ge \\lambda_2$ of $F = ${Ftex(F)}$.`, `$F = ${Ftex(F)}$ の主伸び $\\lambda_1 \\ge \\lambda_2$ を求めてください。`],
          a: { type: 'tuple', v: [Math.sqrt(a), Math.sqrt(b)], labels: ['$\\lambda_1$', '$\\lambda_2$'], tol: 0.001 },
          hint: ['They are the square roots of the eigenvalues of $C = F^{\\mathsf T}F$.', '$C = F^{\\mathsf T}F$ の固有値の平方根です。'],
          sol: [[`$C = ${mat([[c[0][0], c[0][1]], [c[1][0], c[1][1]]])}$, with eigenvalues $${n(a, 4)}$ and $${n(b, 4)}$.`, `$C = ${mat([[c[0][0], c[0][1]], [c[1][0], c[1][1]]])}$ の固有値は $${n(a, 4)}$ と $${n(b, 4)}$ です。`], [`$\\lambda_1 = ${n(Math.sqrt(a), 4)}$, $\\lambda_2 = ${n(Math.sqrt(b), 4)}$: the semi-axes of the gold strain ellipse, the image of a unit circle.`, `$\\lambda_1 = ${n(Math.sqrt(a), 4)}$、$\\lambda_2 = ${n(Math.sqrt(b), 4)}$ で、単位円の像である金色のひずみ楕円の半軸です。`], [`Check: $\\lambda_1\\lambda_2 = ${n(Math.sqrt(a * b), 4)} = J$.`, `確認：$\\lambda_1\\lambda_2 = ${n(Math.sqrt(a * b), 4)} = J$ です。`]],
          set: setF(F),
        };
      }
      const g = r.step(0.2, 2, 0.1), l1 = g / 2 + Math.sqrt(1 + g * g / 4);
      return {
        q: [`Simple shear $F = ${Ftex([[1, g], [0, 1]])}$ keeps area. What is its largest principal stretch $\\lambda_1$?`, `単純せん断 $F = ${Ftex([[1, g], [0, 1]])}$ は面積を保ちます。最大の主伸び $\\lambda_1$ はいくつですか。`],
        a: { type: 'num', v: l1, tol: 5e-4 },
        hint: ['$C = \\begin{pmatrix} 1 & \\gamma \\\\ \\gamma & 1 + \\gamma^2\\end{pmatrix}$ has determinant 1 and trace $2 + \\gamma^2$.', '$C = \\begin{pmatrix} 1 & \\gamma \\\\ \\gamma & 1 + \\gamma^2\\end{pmatrix}$ の行列式は 1、跡は $2 + \\gamma^2$ です。'],
        sol: [['$\\lambda_1\\lambda_2 = 1$ and $\\lambda_1^2 + \\lambda_2^2 = 2 + \\gamma^2$, so $(\\lambda_1 - \\lambda_2)^2 = \\gamma^2$ and $\\lambda_1 - 1/\\lambda_1 = \\gamma$.', '$\\lambda_1\\lambda_2 = 1$、$\\lambda_1^2 + \\lambda_2^2 = 2 + \\gamma^2$ なので $(\\lambda_1 - \\lambda_2)^2 = \\gamma^2$、すなわち $\\lambda_1 - 1/\\lambda_1 = \\gamma$ です。'], [`$\\lambda_1 = \\gamma/2 + \\sqrt{1 + \\gamma^2/4} = ${n(g / 2)} + ${n(Math.sqrt(1 + g * g / 4), 4)} = ${n(l1, 4)}$, and $\\lambda_2 = 1/\\lambda_1 = ${n(1 / l1, 4)}$.`, `$\\lambda_1 = \\gamma/2 + \\sqrt{1 + \\gamma^2/4} = ${n(g / 2)} + ${n(Math.sqrt(1 + g * g / 4), 4)} = ${n(l1, 4)}$、$\\lambda_2 = 1/\\lambda_1 = ${n(1 / l1, 4)}$ です。`], ['Shear is really stretching along one diagonal and squashing along the other, with the axes then turned.', 'せん断の正体は、一方の対角線方向に伸ばし、もう一方に縮めて、その軸を回したものです。']],
        set: setF([[1, g], [0, 1]]),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([5, 10, 15, 20, 30, 45, 60, 90]), e = Math.cos(rad(th)) - 1;
        return {
          q: [`A body is turned rigidly by $${th}^\\circ$ with no deformation at all. What normal strain $\\varepsilon_{11}$ does the small-strain tensor $\\varepsilon = \\tfrac12(F + F^{\\mathsf T}) - I$ report? Give four decimals.`, `物体を変形させずに剛体として $${th}^\\circ$ 回します。微小ひずみ $\\varepsilon = \\tfrac12(F + F^{\\mathsf T}) - I$ はどんな垂直ひずみ $\\varepsilon_{11}$ を示しますか（小数第4位まで）。`],
          a: { type: 'num', v: e, tol: 6e-5 },
          hint: ['$F$ is the rotation matrix; its symmetric part has $\\cos\\theta$ on the diagonal.', '$F$ は回転行列で、その対称部分の対角は $\\cos\\theta$ です。'],
          sol: [[`$F = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta\\end{pmatrix}$, so $\\varepsilon_{11} = \\cos\\theta - 1 = ${n(e, 5)}$.`, `$F = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta\\end{pmatrix}$ なので $\\varepsilon_{11} = \\cos\\theta - 1 = ${n(e, 5)}$ です。`], [`A pure rotation strains nothing, and $E = \\tfrac12(F^{\\mathsf T}F - I) = 0$ exactly; $\\varepsilon$ reports a fake ${n(-e * 100, 2)}% compression because it drops the term $\\tfrac12 H^{\\mathsf T}H$, which for a rotation is about $\\theta^2/2$.`, `純粋な回転は何もひずませず、$E = \\tfrac12(F^{\\mathsf T}F - I) = 0$ が厳密に成り立ちます。$\\varepsilon$ が ${n(-e * 100, 2)}% の見かけの圧縮を示すのは、回転ではおよそ $\\theta^2/2$ になる項 $\\tfrac12 H^{\\mathsf T}H$ を落としているからです。`]],
          set: { f11: 1, f12: 0, f21: 0, f22: 1, rot: th },
        };
      }
      if (form === 1) {
        const g = r.step(0.2, 2, 0.1), a = -deg(Math.atan(g / 2));
        return {
          q: [`Write simple shear $F = ${Ftex([[1, g], [0, 1]])}$ as $F = RU$. By what angle does $R$ rotate, in degrees (anticlockwise positive)?`, `単純せん断 $F = ${Ftex([[1, g], [0, 1]])}$ を $F = RU$ と分解します。$R$ の回転角は何度ですか（反時計回りを正とします）。`],
          a: { type: 'num', v: a, tol: 0.05, unit: ['°', '°'] },
          hint: ['In 2D, $F = RU$ with $U$ symmetric means $R^{\\mathsf T}F$ is symmetric: find the angle that makes the off-diagonal entries of $R^{\\mathsf T}F$ equal.', '2次元では、$U$ が対称なので $R^{\\mathsf T}F$ が対称になります。$R^{\\mathsf T}F$ の非対角成分が等しくなる角を求めてください。'],
          sol: [['With $R$ a rotation by $\\alpha$, $R^{\\mathsf T}F$ is symmetric when $\\tan\\alpha = (F_{21} - F_{12})/(F_{11} + F_{22})$.', '$R$ を角 $\\alpha$ の回転とすると、$\\tan\\alpha = (F_{21} - F_{12})/(F_{11} + F_{22})$ のとき $R^{\\mathsf T}F$ が対称になります。'], [`$\\tan\\alpha = -${n(g)}/2$, so $\\alpha = ${n(a, 2)}^\\circ$.`, `$\\tan\\alpha = -${n(g)}/2$ より $\\alpha = ${n(a, 2)}^\\circ$ です。`], ['Shearing to the right turns the principal directions clockwise; the lab\'s readout quotes this angle as the rotation in $R$.', '右へのせん断は主方向を時計回りに回します。実験の読み取り欄の「R の回転」がこの角です。']],
          set: setF([[1, g], [0, 1]]),
        };
      }
      return {
        q: ['For simple shear $F = \\begin{pmatrix} 1 & \\gamma \\\\ 0 & 1\\end{pmatrix}$, write the largest principal Green–Lagrange strain $E_1$ as a function of $\\gamma$.', '単純せん断 $F = \\begin{pmatrix} 1 & \\gamma \\\\ 0 & 1\\end{pmatrix}$ について、グリーン・ラグランジュひずみの最大の主値 $E_1$ を $\\gamma$ の関数で表してください。'],
        a: { type: 'expr', v: 'gamma^2/4 + (gamma/2)*sqrt(1+gamma^2/4)', vars: ['gamma'], dom: { gamma: [0.1, 2] }, lhs: ['$E_1 =$', '$E_1 =$'] },
        hint: ['$E_1 = \\tfrac12(\\lambda_1^2 - 1)$ with $\\lambda_1 = \\gamma/2 + \\sqrt{1 + \\gamma^2/4}$.', '$\\lambda_1 = \\gamma/2 + \\sqrt{1 + \\gamma^2/4}$ として $E_1 = \\tfrac12(\\lambda_1^2 - 1)$ です。'],
        sol: [['$\\lambda_1^2 = \\gamma^2/4 + \\gamma\\sqrt{1 + \\gamma^2/4} + 1 + \\gamma^2/4 = 1 + \\gamma^2/2 + \\gamma\\sqrt{1 + \\gamma^2/4}$.', '$\\lambda_1^2 = \\gamma^2/4 + \\gamma\\sqrt{1 + \\gamma^2/4} + 1 + \\gamma^2/4 = 1 + \\gamma^2/2 + \\gamma\\sqrt{1 + \\gamma^2/4}$ です。'], ['$E_1 = \\tfrac12(\\lambda_1^2 - 1) = \\dfrac{\\gamma^2}{4} + \\dfrac{\\gamma}{2}\\sqrt{1 + \\dfrac{\\gamma^2}{4}}$.', '$E_1 = \\tfrac12(\\lambda_1^2 - 1) = \\dfrac{\\gamma^2}{4} + \\dfrac{\\gamma}{2}\\sqrt{1 + \\dfrac{\\gamma^2}{4}}$ です。'], ['For small $\\gamma$ this is $\\gamma/2 + \\gamma^2/4 + \\dots$: the small-strain value $\\gamma/2$ is the first term, and at $\\gamma = 0.6$ it is already 25% too low.', '$\\gamma$ が小さければこれは $\\gamma/2 + \\gamma^2/4 + \\dots$ で、微小ひずみの値 $\\gamma/2$ は最初の項です。$\\gamma = 0.6$ ではすでに 25% 小さすぎます。']],
        set: setF([[1, 0.6], [0, 1]]),
      };
    },
  ];

  /* ---------- 2. beams: the lab's steel bar 40 x 60 mm, 1 m, E = 200 GPa ---------- */
  const E = 200e9, B = 0.04, Hh = 0.06, I = B * Hh ** 3 / 12, EI = E * I, Lb = 1;
  Q['beam-bending'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([20, 30, 40, 50, 60]), h = r.pick([40, 60, 80, 100, 120]), Iv = b * h ** 3 / 12;
        return {
          q: [`What is the second moment of area $I$ of a solid rectangular section ${b} mm wide and ${h} mm deep, bent about its horizontal axis? Give mm⁴.`, `幅 ${b} mm、高さ ${h} mm の中実の長方形断面を水平な軸のまわりに曲げるとき、断面二次モーメント $I$ はいくつですか。mm⁴ で答えてください。`],
          a: { type: 'num', v: Iv, unit: ['mm⁴', 'mm⁴'] },
          hint: ['$I = bh^3/12$, with $h$ the depth in the direction of bending.', '$I = bh^3/12$ で、$h$ は曲げる方向の高さです。'],
          sol: [[`$I = ${b}\\times ${h}^3/12 = ${sig(Iv, 4)}$ mm⁴.`, `$I = ${b}\\times ${h}^3/12 = ${sig(Iv, 4)}$ mm⁴ です。`], [h === b ? 'A square section is equally stiff either way up.' : `Turned on its side the same bar has $I = ${h}\\times ${b}^3/12 = ${sig(h * b ** 3 / 12, 4)}$ mm⁴, ${h > b ? `${n((h / b) ** 2, 3)} times less` : `${n((b / h) ** 2, 3)} times more`}: depth counts as the cube, width only linearly.`, h === b ? '正方形の断面は、どちら向きでも同じ剛さです。' : `同じ棒を横に寝かせると $I = ${h}\\times ${b}^3/12 = ${sig(h * b ** 3 / 12, 4)}$ mm⁴ で、${h > b ? `${n((h / b) ** 2, 3)} 分の一` : `${n((b / h) ** 2, 3)} 倍`}になります。高さは三乗で、幅は一乗でしか効きません。`]],
        };
      }
      if (form === 1) {
        const Pk = r.step(0.5, 10, 0.1), d = Pk * 1e3 * Lb ** 3 / (3 * EI) * 1e3;
        return {
          q: [`The lab's steel cantilever (1 m long, $EI = 144$ kN·m²) carries $P = ${n(Pk)}$ kN at its tip. How far does the tip deflect, in mm?`, `この実験の鋼の片持ちはり（長さ 1 m、$EI = 144$ kN·m²）の先端に $P = ${n(Pk)}$ kN をかけます。先端のたわみは何 mm ですか。`],
          a: { type: 'num', v: d, unit: ['mm', 'mm'] },
          hint: ['For a tip load, $\\delta = PL^3/3EI$.', '先端荷重では $\\delta = PL^3/3EI$ です。'],
          sol: [[`$\\delta = \\dfrac{${n(Pk)}\\times 1^3}{3\\times 144}$ m $= ${n(d / 1e3, 6)}$ m.`, `$\\delta = \\dfrac{${n(Pk)}\\times 1^3}{3\\times 144}$ m $= ${n(d / 1e3, 6)}$ m です。`], [`$\\delta = ${n(d, 3)}$ mm. It is linear in the load, so the readout doubles when $P$ does.`, `$\\delta = ${n(d, 3)}$ mm です。荷重に比例するので、$P$ を二倍にすると読み取り欄も二倍になります。`]],
          set: { sup: 0, P: Pk, a: 1, q: 0 },
        };
      }
      const k = r.int(0, 3);
      const ch = [['its depth is doubled', '高さを二倍にする', 0], ['its width is doubled', '幅を二倍にする', 1], ['its length is doubled (same load at the tip)', '長さを二倍にする（同じ荷重を先端に）', 2], ['it is made of aluminium ($E$ one third of steel)', 'アルミニウム（$E$ が鋼の三分の一）で作る', 3]][k];
      const opts = [['$\\tfrac18$ as much', '$\\tfrac18$ 倍'], ['$\\tfrac12$ as much', '$\\tfrac12$ 倍'], ['8 times as much', '8 倍'], ['3 times as much', '3 倍'], ['$\\tfrac14$ as much', '$\\tfrac14$ 倍'], ['2 times as much', '2 倍']];
      const ans = [0, 1, 2, 3][k], pick = [[0, 4, 1], [1, 0, 4], [2, 5, 4], [3, 1, 2]][k];
      return {
        q: [`A cantilever with a tip load deflects $\\delta = PL^3/(3EI)$ with $I = bh^3/12$. How does its deflection change if ${ch[0]}?`, `先端荷重を受ける片持ちはりのたわみは $\\delta = PL^3/(3EI)$、$I = bh^3/12$ です。${ch[1]}と、たわみはどうなりますか。`],
        a: { type: 'choice', opts: pick.map((i) => opts[i]), v: pick.indexOf(ans) },
        hint: ['Find how $L^3/(Ebh^3)$ changes.', '$L^3/(Ebh^3)$ がどう変わるかを考えてください。'],
        sol: [[['Doubling $h$ multiplies $I$ by $2^3 = 8$, so $\\delta$ falls to $\\tfrac18$.', 'Doubling $b$ doubles $I$, so $\\delta$ halves.', 'Doubling $L$ multiplies $L^3$ by 8, so $\\delta$ grows eightfold (and the root moment doubles).', 'A third of $E$ means three times the deflection; the stress for the same load is unchanged.'][k], ['$h$ を二倍にすると $I$ は $2^3 = 8$ 倍になり、$\\delta$ は $\\tfrac18$ になります。', '$b$ を二倍にすると $I$ は二倍になり、$\\delta$ は半分になります。', '$L$ を二倍にすると $L^3$ は 8 倍になり、$\\delta$ は八倍になります（根元のモーメントは二倍）。', '$E$ が三分の一ならたわみは三倍です。同じ荷重に対する応力は変わりません。'][k]], ['This is why beams are deep rather than wide: material far from the neutral axis does most of the work.', 'だからはりは幅よりも高さを大きくします。中立軸から遠い材料がほとんどの仕事をするのです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pt = r.chance(0.5);
        const Pk = r.step(1, 10, 0.5), qk = r.step(1, 10, 0.5);
        const d = pt ? Pk * 1e3 * Lb ** 3 / (48 * EI) * 1e3 : 5 * qk * 1e3 * Lb ** 4 / (384 * EI) * 1e3;
        return {
          q: [pt ? `The lab's steel bar ($EI = 144$ kN·m², 1 m) rests on simple supports with $P = ${n(Pk)}$ kN at mid-span. How far does the centre deflect, in mm?` : `The lab's steel bar ($EI = 144$ kN·m², 1 m) rests on simple supports under a uniform load $q = ${n(qk)}$ kN/m. How far does the centre deflect, in mm?`, pt ? `この実験の鋼の棒（$EI = 144$ kN·m²、1 m）を単純支持し、中央に $P = ${n(Pk)}$ kN をかけます。中央のたわみは何 mm ですか。` : `この実験の鋼の棒（$EI = 144$ kN·m²、1 m）を単純支持し、一様な分布荷重 $q = ${n(qk)}$ kN/m をかけます。中央のたわみは何 mm ですか。`],
          a: { type: 'num', v: d, unit: ['mm', 'mm'] },
          hint: [pt ? 'Central point load: $\\delta = PL^3/48EI$.' : 'Uniform load: $\\delta = 5qL^4/384EI$.', pt ? '中央の集中荷重では $\\delta = PL^3/48EI$ です。' : '一様な分布荷重では $\\delta = 5qL^4/384EI$ です。'],
          sol: [[pt ? `$\\delta = \\dfrac{${n(Pk)}}{48\\times 144}$ m $= ${n(d, 4)}$ mm.` : `$\\delta = \\dfrac{5\\times ${n(qk)}}{384\\times 144}$ m $= ${n(d, 4)}$ mm.`, pt ? `$\\delta = \\dfrac{${n(Pk)}}{48\\times 144}$ m $= ${n(d, 4)}$ mm です。` : `$\\delta = \\dfrac{5\\times ${n(qk)}}{384\\times 144}$ m $= ${n(d, 4)}$ mm です。`], [pt ? 'Sixteen times less than the same load at the tip of a cantilever of the same length: supporting both ends matters enormously.' : 'The same total load concentrated at the centre would give $PL^3/48EI$, 1.6 times as much: spreading a load helps.', pt ? '同じ長さの片持ちはりの先端に同じ荷重をかける場合の十六分の一です。両端を支えることの効果は絶大です。' : '同じ合計の荷重を中央に集中させると $PL^3/48EI$ で 1.6 倍になります。荷重を分散させると有利です。']],
          set: pt ? { sup: 1, P: Pk, a: 0.5, q: 0 } : { sup: 1, P: 0, q: qk },
        };
      }
      if (form === 1) {
        const Pk = r.step(0.5, 10, 0.5), a = r.step(0.2, 1, 0.05), M = Pk * 1e3 * a, s = M * (Hh / 2) / I / 1e6;
        return {
          q: [`The lab's cantilever (section 40 × 60 mm, $I = 7.2\\times 10^{-7}$ m⁴) carries $P = ${n(Pk)}$ kN at $a = ${n(a)}$ m from the wall. What is the largest bending stress, in MPa?`, `この実験の片持ちはり（断面 40 × 60 mm、$I = 7.2\\times 10^{-7}$ m⁴）の、壁から $a = ${n(a)}$ m の位置に $P = ${n(Pk)}$ kN をかけます。最大の曲げ応力は何 MPa ですか。`],
          a: { type: 'num', v: s, unit: ['MPa', 'MPa'] },
          hint: ['The moment is largest at the wall, $M = Pa$, and the stress is largest at the outer fibre, $c = h/2$.', 'モーメントは壁で最大で $M = Pa$、応力は最も外側の繊維 $c = h/2$ で最大です。'],
          sol: [[`$M = ${n(Pk)}\\times ${n(a)} = ${n(M / 1e3, 4)}$ kN·m.`, `$M = ${n(Pk)}\\times ${n(a)} = ${n(M / 1e3, 4)}$ kN·m です。`], [`$\\sigma = Mc/I = ${n(M, 5)}\\times 0.03/7.2\\times 10^{-7} = ${n(s, 4)}$ MPa.`, `$\\sigma = Mc/I = ${n(M, 5)}\\times 0.03/7.2\\times 10^{-7} = ${n(s, 4)}$ MPa です。`], [s > 250 ? 'That exceeds the 250 MPa yield stress: the bar would bend permanently.' : `That is ${n(250 / s, 3)} times below the 250 MPa yield stress: tension along the top at the wall, compression along the bottom.`, s > 250 ? '降伏応力 250 MPa を超えるので、棒は永久に曲がってしまいます。' : `降伏応力 250 MPa の ${n(250 / s, 3)} 分の一です。壁のところで上面が引張、下面が圧縮です。`]],
          set: { sup: 0, P: Pk, a, q: 0 },
        };
      }
      const Pk = r.step(1, 10, 0.5), a = r.step(0.2, 0.9, 0.05), d = Pk * 1e3 * a * a * (3 * Lb - a) / (6 * EI) * 1e3;
      return {
        q: [`The lab's cantilever ($EI = 144$ kN·m², $L = 1$ m) carries $P = ${n(Pk)}$ kN at $a = ${n(a)}$ m from the wall. How far does the free tip deflect, in mm?`, `この実験の片持ちはり（$EI = 144$ kN·m²、$L = 1$ m）の、壁から $a = ${n(a)}$ m に $P = ${n(Pk)}$ kN をかけます。自由端の先端のたわみは何 mm ですか。`],
        a: { type: 'num', v: d, unit: ['mm', 'mm'] },
        hint: ['Under the load the deflection is $Pa^3/3EI$ and the slope $Pa^2/2EI$; beyond the load the beam is straight.', '荷重点でのたわみは $Pa^3/3EI$、傾きは $Pa^2/2EI$ で、荷重点より先ははりはまっすぐです。'],
        sol: [[`Tip deflection $= \\dfrac{Pa^3}{3EI} + \\dfrac{Pa^2}{2EI}(L - a) = \\dfrac{Pa^2(3L - a)}{6EI}$.`, `先端のたわみは $\\dfrac{Pa^3}{3EI} + \\dfrac{Pa^2}{2EI}(L - a) = \\dfrac{Pa^2(3L - a)}{6EI}$ です。`], [`$= \\dfrac{${n(Pk)}\\times ${n(a * a, 4)}\\times ${n(3 - a)}}{6\\times 144}$ m $= ${n(d, 3)}$ mm.`, `$= \\dfrac{${n(Pk)}\\times ${n(a * a, 4)}\\times ${n(3 - a)}}{6\\times 144}$ m $= ${n(d, 3)}$ mm です。`], ['The unloaded end just rides along on the slope, which is why it stays straight in the drawing.', '荷重のない先端部分は傾きに乗って運ばれるだけなので、図でもまっすぐです。']],
        set: { sup: 0, P: Pk, a, q: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Pk = r.step(1, 10, 0.5), c = Pk / 0.864;
        return {
          q: [`The lab's cantilever ($EI = 144$ kN·m², $L = 1$ m) carries $P = ${n(Pk)}$ kN at its tip. Write the downward deflection $\\delta(x)$ in mm at distance $x$ m from the wall.`, `この実験の片持ちはり（$EI = 144$ kN·m²、$L = 1$ m）の先端に $P = ${n(Pk)}$ kN をかけます。壁から $x$ m の位置での下向きのたわみ $\\delta(x)$ を mm で表す式を書いてください。`],
          a: { type: 'expr', v: `${c}*x^2*(3-x)`, vars: ['x'], dom: { x: [0.1, 1] }, lhs: ['$\\delta(x) =$', '$\\delta(x) =$'] },
          hint: ['$EI\\,\\delta\'\' = M(x) = P(L - x)$ with $\\delta(0) = \\delta\'(0) = 0$ at the wall.', '壁で $\\delta(0) = \\delta\'(0) = 0$ として $EI\\,\\delta\'\' = M(x) = P(L - x)$ です。'],
          sol: [['Integrating twice with the clamped conditions: $\\delta(x) = \\dfrac{P x^2(3L - x)}{6EI}$.', '固定端の条件で二回積分すると $\\delta(x) = \\dfrac{P x^2(3L - x)}{6EI}$ です。'], [`In mm: $\\dfrac{1000\\times ${n(Pk)}}{6\\times 144}x^2(3 - x) = ${n(c, 4)}\\,x^2(3 - x)$.`, `mm にすると $\\dfrac{1000\\times ${n(Pk)}}{6\\times 144}x^2(3 - x) = ${n(c, 4)}\\,x^2(3 - x)$ です。`], [`At $x = 1$ it gives $${n(2 * c, 4)}$ mm $= PL^3/3EI$, the tip value.`, `$x = 1$ では $${n(2 * c, 4)}$ mm $= PL^3/3EI$ で、先端の値になります。`]],
          set: { sup: 0, P: Pk, a: 1, q: 0 },
        };
      }
      if (form === 1) {
        const sa = r.pick([100, 125, 150, 166.7]), k = r.int(0, 2), mf = [1, 0.25, 0.125][k], Pmax = sa * 1e6 * I / ((Hh / 2) * Lb * mf) / 1e3;
        const where = [['cantilever with the load at its tip', '先端に荷重をかける片持ちはり', 'M = PL', 'M = PL'], ['simply supported beam with the load at mid-span', '中央に荷重をかける単純支持はり', 'M = PL/4', 'M = PL/4'], ['beam fixed at both ends with the load at mid-span', '中央に荷重をかける両端固定はり', 'M = PL/8', 'M = PL/8']][k];
        return {
          q: [`The lab's bar ($I = 7.2\\times 10^{-7}$ m⁴, depth 60 mm, 1 m) is used as a ${where[0]}. What is the largest point load if the bending stress must stay below ${sa} MPa? Give kN.`, `この実験の棒（$I = 7.2\\times 10^{-7}$ m⁴、高さ 60 mm、1 m）を${where[1]}として使います。曲げ応力を ${sa} MPa 以下に保つとき、集中荷重の最大値は何 kN ですか。`],
          a: { type: 'num', v: Pmax, unit: ['kN', 'kN'] },
          hint: [`The largest moment is $${where[2]}$ (at the ${k === 0 ? 'wall' : k === 1 ? 'load' : 'supports and the load'}); set $Mc/I$ equal to the allowed stress.`, `最大のモーメントは $${where[3]}$（${k === 0 ? '壁' : k === 1 ? '荷重点' : '支点と荷重点'}）です。$Mc/I$ を許容応力に等しくおいてください。`],
          sol: [[`$M_{\\max} = \\sigma I/c = ${sa}\\times 10^6\\times 7.2\\times 10^{-7}/0.03 = ${n(sa * 1e6 * I / 0.03 / 1e3, 4)}$ kN·m.`, `$M_{\\max} = \\sigma I/c = ${sa}\\times 10^6\\times 7.2\\times 10^{-7}/0.03 = ${n(sa * 1e6 * I / 0.03 / 1e3, 4)}$ kN·m です。`], [`$${where[2]}$ gives $P = ${n(Pmax, 4)}$ kN.`, `$${where[3]}$ より $P = ${n(Pmax, 4)}$ kN です。`], ['The supports change the capacity by a factor of eight with the same steel: a fixed–fixed beam spreads the moment between its ends and its middle.', '同じ鋼でも支持の仕方で耐えられる荷重は八倍変わります。両端固定はりはモーメントを両端と中央に分け合うからです。']],
          set: Pmax <= 10 ? { sup: [0, 1, 2][k], P: Math.floor(Pmax * 10 + 1e-9) / 10, a: k === 0 ? 1 : 0.5, q: 0 } : undefined,
        };
      }
      const f = r.pick([2, 3, 4, 1.5, 10]), h2 = 60 * Math.cbrt(f);
      return {
        q: [`A 40 × 60 mm beam deflects too much. Keeping the width at 40 mm, how deep must it be to deflect ${f} times less under the same load? Give mm.`, `40 × 60 mm のはりのたわみが大きすぎます。幅を 40 mm のまま、同じ荷重でたわみを ${f} 分の一にするには、高さを何 mm にすればよいですか。`],
        a: { type: 'num', v: h2, unit: ['mm', 'mm'] },
        hint: ['Deflection is proportional to $1/I$ and $I \\propto h^3$.', 'たわみは $1/I$ に比例し、$I \\propto h^3$ です。'],
        sol: [[`We need $I$ ${f} times larger, so $h^3$ ${f} times larger: $h = 60\\sqrt[3]{${f}}$.`, `$I$ を ${f} 倍、つまり $h^3$ を ${f} 倍にする必要があるので $h = 60\\sqrt[3]{${f}}$ です。`], [`$h = ${n(h2, 3)}$ mm, using only ${n(h2 / 60, 3)} times the steel. Making it ${f} times wider instead would use ${f} times the steel.`, `$h = ${n(h2, 3)}$ mm で、鋼は ${n(h2 / 60, 3)} 倍しか使いません。代わりに幅を ${f} 倍にすると鋼も ${f} 倍必要です。`]],
      };
    },
  ];

  /* ---------- 3. buckling: 20 mm steel rod, E = 200 GPa, yield 250 MPa ---------- */
  const COL = { E: 200e9, d: 0.02, sy: 250e6 };
  COL.I = PI * COL.d ** 4 / 64; COL.A = PI * COL.d ** 2 / 4; COL.r = COL.d / 4;
  const BC = [{ K: 1, en: 'pinned at both ends', ja: '両端ピン' }, { K: 2, en: 'fixed at the base and free at the top', ja: '下端固定・上端自由' }, { K: 0.5, en: 'fixed at both ends', ja: '両端固定' }];
  const Pcr = (Lc, K) => PI ** 2 * COL.E * COL.I / (K * Lc) ** 2;
  const ellK = (p) => { let a = 1, b = Math.sqrt(1 - p * p); for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return PI / (2 * a); };

  Q.buckling = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2);
        return {
          q: [`A column is ${BC[k].en}. What is its effective-length factor $K$ in $P_{\\rm cr} = \\pi^2EI/(KL)^2$?`, `柱が${BC[k].ja}です。$P_{\\rm cr} = \\pi^2EI/(KL)^2$ の有効長さ係数 $K$ はいくつですか。`],
          a: { type: 'choice', opts: [['$K = 1$', '$K = 1$'], ['$K = 2$', '$K = 2$'], ['$K = 0.5$', '$K = 0.5$'], ['$K = 0.7$', '$K = 0.7$']], v: k, fixed: true },
          hint: ['$KL$ is the length of one half-sine of the buckled shape.', '$KL$ は座屈した形の正弦の半波一つ分の長さです。'],
          sol: [[['Pinned ends allow rotation, so the whole length is one half-sine: $K = 1$.', 'A flagpole buckles into a quarter-sine, half of a pinned column of length $2L$: $K = 2$.', 'Clamped ends force zero slope at both ends; the middle half of the column is one half-sine: $K = 0.5$.'][k], ['ピン端は回転できるので、全長が正弦の半波一つ分で $K = 1$ です。', '旗竿は正弦の四分の一波に座屈し、長さ $2L$ の両端ピンの柱の半分にあたるので $K = 2$ です。', '固定端では両端の傾きが 0 で、柱の中央の半分が正弦の半波一つ分になるので $K = 0.5$ です。'][k]], [`The buckling load scales as $1/K^2$, so ${['this is the reference case', 'it is four times weaker than pinned', 'it is four times stronger than pinned'][k]}. ($K = 0.7$ belongs to fixed–pinned.)`, `座屈荷重は $1/K^2$ に比例するので、${['これが基準の場合です', '両端ピンの四分の一の強さです', '両端ピンの四倍の強さです'][k]}（$K = 0.7$ は一端固定・他端ピンの値です）。`]],
          set: { bc: k },
        };
      }
      if (form === 1) {
        const k = r.int(0, 2), Lc = r.step(0.5, 3, 0.1), P = Pcr(Lc, BC[k].K) / 1e3;
        return {
          q: [`The lab's 20 mm steel rod ($E = 200$ GPa, $I = \\pi d^4/64 = 7.85\\times 10^{-9}$ m⁴) is $${n(Lc)}$ m long and ${BC[k].en}. What is its Euler buckling load, in kN?`, `この実験の直径 20 mm の鋼の棒（$E = 200$ GPa、$I = \\pi d^4/64 = 7.85\\times 10^{-9}$ m⁴）は長さ $${n(Lc)}$ m で${BC[k].ja}です。オイラーの座屈荷重は何 kN ですか。`],
          a: { type: 'num', v: P, unit: ['kN', 'kN'] },
          hint: [`$P_{\\rm cr} = \\pi^2EI/(KL)^2$ with $K = ${BC[k].K}$.`, `$K = ${BC[k].K}$ として $P_{\\rm cr} = \\pi^2EI/(KL)^2$ です。`],
          sol: [[`$EI = 200\\times 10^9\\times 7.854\\times 10^{-9} = ${n(COL.E * COL.I, 1)}$ N·m², and $KL = ${n(BC[k].K * Lc, 3)}$ m.`, `$EI = 200\\times 10^9\\times 7.854\\times 10^{-9} = ${n(COL.E * COL.I, 1)}$ N·m²、$KL = ${n(BC[k].K * Lc, 3)}$ m です。`], [`$P_{\\rm cr} = \\pi^2\\times ${n(COL.E * COL.I, 1)}/${n((BC[k].K * Lc) ** 2, 4)} = ${n(P, 3)}$ kN.`, `$P_{\\rm cr} = \\pi^2\\times ${n(COL.E * COL.I, 1)}/${n((BC[k].K * Lc) ** 2, 4)} = ${n(P, 3)}$ kN です。`], [P * 1e3 / COL.A > COL.sy ? `Careful: that is a stress of ${n(P * 1e3 / COL.A / 1e6, 0)} MPa, above yield, so this short rod would yield before it buckled.` : `That is a stress of only ${n(P * 1e3 / COL.A / 1e6, 0)} MPa: slender rods fail by buckling long before the steel itself gives way.`, P * 1e3 / COL.A > COL.sy ? `注意：これは ${n(P * 1e3 / COL.A / 1e6, 0)} MPa の応力で降伏応力を超えるので、この短い棒は座屈する前に降伏します。` : `これはわずか ${n(P * 1e3 / COL.A / 1e6, 0)} MPa の応力です。細長い棒は、鋼そのものが壊れるずっと前に座屈で壊れます。`]],
          set: { bc: k, len: Lc },
        };
      }
      const d0 = r.step(0.1, 1, 0.05), ld = r.pick([0.25, 0.5, 0.6, 0.75, 0.8, 0.9, 0.95]), dl = d0 / (1 - ld);
      return {
        q: [`A column with an initial bow of $${n(d0)}$% of its length carries $P = ${ld}\\,P_{\\rm cr}$. Using $\\delta = \\delta_0/(1 - P/P_{\\rm cr})$, how large is the bow now, as a percentage of the length?`, `長さの $${n(d0)}$% の初期の曲がりをもつ柱に $P = ${ld}\\,P_{\\rm cr}$ がかかっています。$\\delta = \\delta_0/(1 - P/P_{\\rm cr})$ を使うと、いまの曲がりは長さの何 % ですか。`],
        a: { type: 'num', v: dl, unit: ['%', '%'] },
        sol: [[`$\\delta = ${n(d0)}/(1 - ${ld}) = ${n(dl, 4)}$%.`, `$\\delta = ${n(d0)}/(1 - ${ld}) = ${n(dl, 4)}$% です。`], [`The bow is amplified ${n(1 / (1 - ld), 3)} times; the amplification blows up as $P \\to P_{\\rm cr}$, so crooked columns bend and yield before reaching the Euler load.`, `曲がりは ${n(1 / (1 - ld), 3)} 倍に増幅されます。増幅は $P \\to P_{\\rm cr}$ で発散するので、曲がった柱はオイラー荷重に達する前に曲がって降伏します。`]],
        set: { imp: d0, load: ld },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), Lc = r.step(0.5, 3, 0.1), lam = BC[k].K * Lc / COL.r, s = PI ** 2 * COL.E / lam ** 2 / 1e6;
        return {
          q: [`The lab's 20 mm steel rod (radius of gyration $r = 5$ mm, $E = 200$ GPa) is $${n(Lc)}$ m long and ${BC[k].en}. What is its Euler critical stress $\\pi^2E/(KL/r)^2$, in MPa?`, `この実験の直径 20 mm の鋼の棒（断面二次半径 $r = 5$ mm、$E = 200$ GPa）は長さ $${n(Lc)}$ m で${BC[k].ja}です。オイラーの限界応力 $\\pi^2E/(KL/r)^2$ は何 MPa ですか。`],
          a: { type: 'num', v: s, unit: ['MPa', 'MPa'] },
          hint: ['First the slenderness $KL/r$, then the formula.', 'まず細長比 $KL/r$ を求め、それから公式に入れます。'],
          sol: [[`$KL/r = ${BC[k].K}\\times ${n(Lc)}/0.005 = ${n(lam, 1)}$.`, `$KL/r = ${BC[k].K}\\times ${n(Lc)}/0.005 = ${n(lam, 1)}$ です。`], [`$\\sigma_{\\rm cr} = \\pi^2\\times 200\\,000/${n(lam, 1)}^2 = ${n(s, 3)}$ MPa.`, `$\\sigma_{\\rm cr} = \\pi^2\\times 200\\,000/${n(lam, 1)}^2 = ${n(s, 3)}$ MPa です。`], [s > 250 ? 'Above the 250 MPa yield stress: Euler\'s formula does not apply, and the Johnson curve gives the real limit.' : 'Below yield, so the rod buckles elastically at this stress; the gold point in the design chart sits on the blue Euler curve.', s > 250 ? '降伏応力 250 MPa を超えるのでオイラーの式は当てはまらず、ジョンソン曲線が本当の限界を与えます。' : '降伏応力より低いので、棒はこの応力で弾性座屈します。設計図の金色の点は青いオイラー曲線の上にあります。']],
          set: { bc: k, len: Lc },
        };
      }
      if (form === 1) {
        const secs = [['an aluminium tube ($E = 70$ GPa) with outer diameter 40 mm and inner diameter 34 mm', '外径 40 mm、内径 34 mm のアルミニウム管（$E = 70$ GPa）', 70e9, PI * (0.04 ** 4 - 0.034 ** 4) / 64], ['a pine dowel ($E = 10$ GPa) of diameter 25 mm', '直径 25 mm の松の丸棒（$E = 10$ GPa）', 10e9, PI * 0.025 ** 4 / 64], ['a 30 mm square steel bar ($E = 200$ GPa)', '一辺 30 mm の正方形断面の鋼の棒（$E = 200$ GPa）', 200e9, 0.03 ** 4 / 12], ['a steel tube ($E = 200$ GPa) with outer diameter 48 mm and wall 3 mm (scaffold pole)', '外径 48 mm、肉厚 3 mm の鋼管（$E = 200$ GPa、足場用）', 200e9, PI * (0.048 ** 4 - 0.042 ** 4) / 64]];
        const [en, ja, Em, Im] = r.pick(secs), Lc = r.pick([1, 1.5, 2, 2.5, 3]), P = PI ** 2 * Em * Im / Lc ** 2 / 1e3;
        return {
          q: [`A strut ${Lc} m long, pinned at both ends, is made of ${en}. What is its Euler buckling load, in kN?`, `両端ピンで長さ ${Lc} m の支柱を、${ja}で作ります。オイラーの座屈荷重は何 kN ですか。`],
          a: { type: 'num', v: P, unit: ['kN', 'kN'] },
          hint: ['Find $I$ for the section ($\\pi(D^4 - d^4)/64$ for a tube, $a^4/12$ for a square), then $\\pi^2EI/L^2$.', '断面の $I$（管なら $\\pi(D^4 - d^4)/64$、正方形なら $a^4/12$）を求め、$\\pi^2EI/L^2$ に入れます。'],
          sol: [[`$I = ${sig(Im, 4)}$ m⁴, so $EI = ${sig(Em * Im, 4)}$ N·m².`, `$I = ${sig(Im, 4)}$ m⁴ なので $EI = ${sig(Em * Im, 4)}$ N·m² です。`], [`$P_{\\rm cr} = \\pi^2\\times ${sig(Em * Im, 4)}/${Lc}^2 = ${n(P, 3)}$ kN.`, `$P_{\\rm cr} = \\pi^2\\times ${sig(Em * Im, 4)}/${Lc}^2 = ${n(P, 3)}$ kN です。`], ['Tubes are efficient columns for the same reason I-beams are efficient beams: the material sits far from the axis, where it adds most to $I$.', '管が効率のよい柱なのは、I 形鋼が効率のよいはりなのと同じ理由です。材料が軸から遠くにあり、そこでは $I$ に最も大きく寄与します。']],
        };
      }
      const k = r.int(0, 2), sy = r.pick([250, 350, 450]), lam = PI * Math.sqrt(COL.E / (sy * 1e6)), Lc = lam * COL.r / BC[k].K;
      return {
        q: [`For the lab's 20 mm steel rod ($r = 5$ mm, $E = 200$ GPa) ${BC[k].en}, at what length does the Euler stress equal a yield stress of ${sy} MPa? Give metres.`, `この実験の直径 20 mm の鋼の棒（$r = 5$ mm、$E = 200$ GPa）が${BC[k].ja}のとき、オイラー応力が降伏応力 ${sy} MPa に等しくなる長さは何 m ですか。`],
        a: { type: 'num', v: Lc, unit: ['m', 'm'] },
        hint: ['Set $\\pi^2E/(KL/r)^2 = \\sigma_y$ and solve for $L$.', '$\\pi^2E/(KL/r)^2 = \\sigma_y$ とおいて $L$ について解きます。'],
        sol: [[`$KL/r = \\pi\\sqrt{E/\\sigma_y} = \\pi\\sqrt{200\\,000/${sy}} = ${n(lam, 2)}$.`, `$KL/r = \\pi\\sqrt{E/\\sigma_y} = \\pi\\sqrt{200\\,000/${sy}} = ${n(lam, 2)}$ です。`], [`$L = ${n(lam, 2)}\\times 0.005/${BC[k].K} = ${n(Lc, 4)}$ m.`, `$L = ${n(lam, 2)}\\times 0.005/${BC[k].K} = ${n(Lc, 4)}$ m です。`], ['Shorter than this, the rod yields first; longer, it buckles first. In practice the Johnson parabola smooths the corner, because real rods are never perfectly straight.', 'これより短ければ棒は先に降伏し、長ければ先に座屈します。実際の棒は完全にまっすぐではないので、ジョンソンの放物線がこの角をなめらかにつなぎます。']],
        set: Lc >= 0.3 && Lc <= 3 ? { bc: k, len: Math.round(Lc * 20) / 20 } : { bc: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([2, 4, 5, 10, 20]), k = r.int(0, 2), Lc = r.step(0.8, 3, 0.1), Pc = Pcr(Lc, BC[k].K) / 1e3, P = (1 - 1 / N) * Pc;
        return {
          q: [`The lab's rod is $${n(Lc)}$ m long and ${BC[k].en} ($P_{\\rm cr} = ${n(Pc, 3)}$ kN). At what load is its initial bow amplified ${N} times? Give kN.`, `この実験の棒は長さ $${n(Lc)}$ m で${BC[k].ja}です（$P_{\\rm cr} = ${n(Pc, 3)}$ kN）。初期の曲がりが ${N} 倍に増幅される荷重は何 kN ですか。`],
          a: { type: 'num', v: P, unit: ['kN', 'kN'] },
          hint: ['The amplification is $1/(1 - P/P_{\\rm cr})$.', '増幅率は $1/(1 - P/P_{\\rm cr})$ です。'],
          sol: [[`$1/(1 - P/P_{\\rm cr}) = ${N}$ gives $P/P_{\\rm cr} = 1 - 1/${N} = ${n(1 - 1 / N)}$.`, `$1/(1 - P/P_{\\rm cr}) = ${N}$ より $P/P_{\\rm cr} = 1 - 1/${N} = ${n(1 - 1 / N)}$ です。`], [`$P = ${n(1 - 1 / N)}\\times ${n(Pc, 3)} = ${n(P, 3)}$ kN.`, `$P = ${n(1 - 1 / N)}\\times ${n(Pc, 3)} = ${n(P, 3)}$ kN です。`], ['Even at half the critical load the bow has doubled; designers keep working loads well below $P_{\\rm cr}$ for this reason.', '限界荷重の半分でも曲がりは二倍になります。だから設計では使用荷重を $P_{\\rm cr}$ よりずっと低く抑えます。']],
          set: { bc: k, len: Lc, load: 1 - 1 / N },
        };
      }
      if (form === 1) {
        let a, b; do { a = r.int(0, 2); b = r.int(0, 2); } while (a === b);
        const ratio = (BC[b].K / BC[a].K) ** 2;
        return {
          q: [`Two identical rods of the same length: one ${BC[a].en}, the other ${BC[b].en}. What is the ratio of the first one's buckling load to the second one's?`, `同じ長さの同じ棒が二本あります。一本は${BC[a].ja}、もう一本は${BC[b].ja}です。一本目の座屈荷重は二本目の何倍ですか。`],
          a: { type: 'num', v: ratio },
          hint: ['$P_{\\rm cr} \\propto 1/K^2$.', '$P_{\\rm cr} \\propto 1/K^2$ です。'],
          sol: [[`$K$ is ${BC[a].K} for the first and ${BC[b].K} for the second.`, `$K$ は一本目が ${BC[a].K}、二本目が ${BC[b].K} です。`], [`The ratio is $(${BC[b].K}/${BC[a].K})^2 = ${n(ratio, 4)}$. End conditions alone span a factor of 16, from a flagpole to a clamped strut, with the same rod.`, `比は $(${BC[b].K}/${BC[a].K})^2 = ${n(ratio, 4)}$ です。同じ棒でも、端の条件だけで旗竿から両端固定の支柱まで 16 倍の幅があります。`]],
        };
      }
      const al = r.pick([10, 16, 20, 30, 40, 50, 60, 90]), p = Math.sin(rad(al) / 2), K = ellK(p), ld = (2 * K / PI) ** 2, which = r.int(0, 1);
      return {
        q: [which ? `A perfect pinned elastica has end slope $\\alpha = ${al}^\\circ$. How far does its middle bow out, as a fraction $\\delta/L$ of the length? ($\\delta/L = p/K(p)$ with $p = \\sin(\\alpha/2)$.)` : `A perfect pinned column has buckled into an elastica with end slope $\\alpha = ${al}^\\circ$. What load $P/P_{\\rm cr}$ holds it there? ($P/P_{\\rm cr} = (2K(p)/\\pi)^2$ with $p = \\sin(\\alpha/2)$.)`, which ? `両端ピンの完全な棒のエラスティカの端の傾きが $\\alpha = ${al}^\\circ$ です。中央はどれだけ反っていますか。長さに対する比 $\\delta/L$ で答えてください（$p = \\sin(\\alpha/2)$ として $\\delta/L = p/K(p)$）。` : `両端ピンの完全な柱が、端の傾き $\\alpha = ${al}^\\circ$ のエラスティカに座屈しています。この形を保つ荷重 $P/P_{\\rm cr}$ はいくつですか（$p = \\sin(\\alpha/2)$ として $P/P_{\\rm cr} = (2K(p)/\\pi)^2$）。`],
        a: { type: 'num', v: which ? p / K : ld, tol: 1e-4 },
        hint: ['Compute $K(p)$ with the arithmetic–geometric mean: $K(p) = \\pi/(2\\,\\mathrm{AGM}(1, \\sqrt{1 - p^2}))$.', '算術幾何平均で $K(p) = \\pi/(2\\,\\mathrm{AGM}(1, \\sqrt{1 - p^2}))$ を計算します。'],
        sol: [[`$p = \\sin ${n(al / 2)}^\\circ = ${n(p, 5)}$, and $K(p) = ${n(K, 5)}$ (for comparison, $\\pi/2 = 1.5708$).`, `$p = \\sin ${n(al / 2)}^\\circ = ${n(p, 5)}$、$K(p) = ${n(K, 5)}$ です（比較のため $\\pi/2 = 1.5708$）。`], [which ? `$\\delta/L = ${n(p, 5)}/${n(K, 5)} = ${n(p / K, 4)}$, at a load of $P/P_{\\rm cr} = ${n(ld, 4)}$.` : `$P/P_{\\rm cr} = (2\\times ${n(K, 5)}/\\pi)^2 = ${n(ld, 4)}$.`, which ? `$\\delta/L = ${n(p, 5)}/${n(K, 5)} = ${n(p / K, 4)}$ で、そのときの荷重は $P/P_{\\rm cr} = ${n(ld, 4)}$ です。` : `$P/P_{\\rm cr} = (2\\times ${n(K, 5)}/\\pi)^2 = ${n(ld, 4)}$ です。`], [`Only ${n((ld - 1) * 100, 2)}% above the critical load buys a bow of ${n(100 * p / K, 1)}% of the length: past $P_{\\rm cr}$ the column has essentially no stiffness left.`, `限界荷重をわずか ${n((ld - 1) * 100, 2)}% 超えるだけで、長さの ${n(100 * p / K, 1)}% も反ります。$P_{\\rm cr}$ を超えた柱には、実質的に剛さが残っていません。`]],
        set: ld <= 1.6 ? { bc: 0, load: Math.round(ld * 100) / 100 } : undefined,
      };
    },
  ];
})();
