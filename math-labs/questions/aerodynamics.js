'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, DEG = PI / 180, RHO = 1.225;

  /* ---------------- joukowski-aerofoil ---------------- */
  Q['joukowski-aerofoil'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const al = r.pick([2, 3, 4, 5, 6, 8, 10]), cl = 2 * PI * Math.sin(al * DEG);
        return {
          q: [`Ideal flow past a flat plate at $${al}^\\circ$ angle of attack, with the Kutta condition at its trailing edge, gives $C_L = 2\\pi\\sin\\alpha$. What is $C_L$? Three decimals.`, `迎角 $${al}^\\circ$ の平板を過ぎる理想流で、後縁にクッタ条件を課すと $C_L = 2\\pi\\sin\\alpha$ です。$C_L$ を小数第三位まで求めてください。`],
          a: { type: 'num', v: cl, tol: 0.0006 },
          hint: ['Convert the angle to radians or use $\\sin$ in degrees.', '角度をラジアンに直すか、度のまま $\\sin$ を計算します。'],
          sol: [[`$\\sin ${al}^\\circ = ${n(Math.sin(al * DEG), 5)}$.`, `$\\sin ${al}^\\circ = ${n(Math.sin(al * DEG), 5)}$ です。`], [`$C_L = 2\\pi \\times ${n(Math.sin(al * DEG), 5)} = ${n(cl, 4)}$, about $0.11$ per degree: the classic thin-aerofoil lift slope.`, `$C_L = 2\\pi \\times ${n(Math.sin(al * DEG), 5)} = ${n(cl, 4)}$ で、1 度あたりおよそ $0.11$ です。古典的な薄翼の揚力傾斜です。`]],
          set: { alpha: al, mx: 0, my: 0 },
        };
      }
      if (form === 1) {
        const G = r.pick([2, 4, 6, 10, 15]), U = r.pick([20, 30, 40, 60]), c = r.pick([0.8, 1, 1.5, 2]), cl = 2 * G / (U * c);
        return {
          q: [`A wing section of chord $${c}$ m in a $${U}$ m/s stream carries circulation $\\Gamma = ${G}$ m²/s. What is its lift coefficient?`, `翼弦 $${c}$ m の翼断面が $${U}$ m/s の流れの中で循環 $\\Gamma = ${G}$ m²/s をもっています。揚力係数はいくらですか。`],
          a: { type: 'num', v: cl, rel: 0.005 },
          hint: ['Lift per span is $\\rho U\\Gamma$, and $C_L = L^\\prime/(\\tfrac12\\rho U^2c)$.', '翼幅あたりの揚力は $\\rho U\\Gamma$ で、$C_L = L^\\prime/(\\tfrac12\\rho U^2c)$ です。'],
          sol: [[`$C_L = \\dfrac{\\rho U\\Gamma}{\\tfrac12\\rho U^2c} = \\dfrac{2\\Gamma}{Uc}$; the density cancels.`, `$C_L = \\dfrac{\\rho U\\Gamma}{\\tfrac12\\rho U^2c} = \\dfrac{2\\Gamma}{Uc}$ で、密度は消えます。`], [`$C_L = 2 \\times ${G}/(${U} \\times ${c}) = ${n(cl, 4)}$.`, `$C_L = 2 \\times ${G}/(${U} \\times ${c}) = ${n(cl, 4)}$ です。`]],
        };
      }
      const G = r.pick([5, 8, 12, 20, 30]), U = r.pick([25, 40, 60, 80]), Lp = RHO * U * G;
      return {
        q: [`By the Kutta–Joukowski theorem, what lift per metre of span does a section with circulation $${G}$ m²/s produce in a $${U}$ m/s stream of sea-level air ($\\rho = 1.225$ kg/m³)? In N/m.`, `クッタ・ジューコフスキーの定理によると、循環 $${G}$ m²/s の断面は、$${U}$ m/s の海面高度の空気（$\\rho = 1.225$ kg/m³）の流れの中で、翼幅 1 メートルあたりどれだけの揚力を生みますか。N/m で答えてください。`],
        a: { type: 'num', v: Lp, rel: 0.005, unit: ['N/m', 'N/m'] },
        hint: ['$L^\\prime = \\rho U\\Gamma$.', '$L^\\prime = \\rho U\\Gamma$ です。'],
        sol: [[`$L^\\prime = 1.225 \\times ${U} \\times ${G}$.`, `$L^\\prime = 1.225 \\times ${U} \\times ${G}$ です。`], [`$= ${n(Lp, 4)}$ N/m. The lift depends only on the circulation, not on the shape that produced it.`, `$= ${n(Lp, 4)}$ N/m です。揚力は循環だけで決まり、それを作った形にはよりません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mx = -r.pick([0.05, 0.08, 0.1]), my = r.pick([0.04, 0.06, 0.08, 0.1]), al = r.pick([2, 4, 6]), a = Math.hypot(1 - mx, my), be = Math.asin(my / a), G = 4 * PI * a * Math.sin(al * DEG + be);
        return {
          q: [`A Joukowski circle has centre $\\mu = ${mx} + ${my}i$ and passes through $\\zeta = 1$. With $U = 1$ and $\\alpha = ${al}^\\circ$, find the Kutta circulation $\\Gamma = 4\\pi a\\sin(\\alpha + \\beta)$, where $a = |1 - \\mu|$ and $\\sin\\beta = \\operatorname{Im}\\mu/a$. Three decimals.`, `ジューコフスキーの円の中心は $\\mu = ${mx} + ${my}i$ で、$\\zeta = 1$ を通ります。$U = 1$、$\\alpha = ${al}^\\circ$ のとき、クッタ条件の循環 $\\Gamma = 4\\pi a\\sin(\\alpha + \\beta)$ を求めてください。$a = |1 - \\mu|$、$\\sin\\beta = \\operatorname{Im}\\mu/a$ です。小数第三位まで答えてください。`],
          a: { type: 'num', v: G, tol: 0.0006 },
          hint: ['First $a$, then $\\beta$, then add the angles.', 'まず $a$、次に $\\beta$ を求めてから角度を足します。'],
          sol: [[`$a = \\sqrt{${n(1 - mx, 3)}^2 + ${my}^2} = ${n(a, 5)}$ and $\\beta = \\arcsin(${my}/${n(a, 5)}) = ${n(be / DEG, 4)}^\\circ$.`, `$a = \\sqrt{${n(1 - mx, 3)}^2 + ${my}^2} = ${n(a, 5)}$、$\\beta = \\arcsin(${my}/${n(a, 5)}) = ${n(be / DEG, 4)}^\\circ$ です。`], [`$\\Gamma = 4\\pi \\times ${n(a, 5)} \\times \\sin ${n(al + be / DEG, 4)}^\\circ = ${n(G, 5)}$. Camber adds $\\beta$ to the effective angle of attack.`, `$\\Gamma = 4\\pi \\times ${n(a, 5)} \\times \\sin ${n(al + be / DEG, 4)}^\\circ = ${n(G, 5)}$ です。反りは有効迎角に $\\beta$ を加えます。`]],
          set: { alpha: al, mx, my },
        };
      }
      if (form === 1) {
        const mx = -r.pick([0.04, 0.06, 0.1, 0.15]), my = r.pick([0.02, 0.05, 0.08, 0.12, 0.15]), a = Math.hypot(1 - mx, my), z0 = -Math.asin(my / a) / DEG;
        return {
          q: [`At what angle of attack does the Joukowski aerofoil from the circle centred at $\\mu = ${mx} + ${my}i$ give zero lift? In degrees, two decimals.`, `中心 $\\mu = ${mx} + ${my}i$ の円から作ったジューコフスキー翼型は、迎角がいくらのとき揚力ゼロになりますか。度で、小数第二位まで答えてください。`],
          a: { type: 'num', v: z0, tol: 0.006, unit: ['°', '°'] },
          hint: ['Lift vanishes when $\\sin(\\alpha + \\beta) = 0$.', '揚力は $\\sin(\\alpha + \\beta) = 0$ のときに消えます。'],
          sol: [[`$a = |1 - \\mu| = ${n(a, 5)}$, so $\\beta = \\arcsin(${my}/${n(a, 5)}) = ${n(-z0, 4)}^\\circ$.`, `$a = |1 - \\mu| = ${n(a, 5)}$ なので $\\beta = \\arcsin(${my}/${n(a, 5)}) = ${n(-z0, 4)}^\\circ$ です。`], [`$\\alpha_{L=0} = -\\beta = ${n(z0, 4)}^\\circ$: camber, not thickness, sets the zero-lift angle.`, `$\\alpha_{L=0} = -\\beta = ${n(z0, 4)}^\\circ$ です。揚力ゼロの迎角を決めるのは厚さではなく反りです。`]],
          set: { alpha: Math.round(z0 * 2) / 2, mx, my },
        };
      }
      const al = r.pick([2, 3, 4, 6, 8]), a0 = r.pick([-1, -2, -3, -4]), cl = 2 * PI * (al - a0) * DEG;
      return {
        q: [`Thin-aerofoil theory gives $C_L = 2\\pi(\\alpha - \\alpha_{L=0})$. A cambered section has $\\alpha_{L=0} = ${a0}^\\circ$. What is $C_L$ at $\\alpha = ${al}^\\circ$? Three decimals.`, `薄翼理論は $C_L = 2\\pi(\\alpha - \\alpha_{L=0})$ を与えます。反りのある断面の $\\alpha_{L=0} = ${a0}^\\circ$ です。$\\alpha = ${al}^\\circ$ での $C_L$ を小数第三位まで求めてください。`],
        a: { type: 'num', v: cl, tol: 0.0006 },
        hint: ['Use radians: $1^\\circ = \\pi/180$.', 'ラジアンを使います：$1^\\circ = \\pi/180$ です。'],
        sol: [[`$\\alpha - \\alpha_{L=0} = ${al - a0}^\\circ = ${n((al - a0) * DEG, 5)}$ rad.`, `$\\alpha - \\alpha_{L=0} = ${al - a0}^\\circ = ${n((al - a0) * DEG, 5)}$ rad です。`], [`$C_L = 2\\pi \\times ${n((al - a0) * DEG, 5)} = ${n(cl, 4)}$.`, `$C_L = 2\\pi \\times ${n((al - a0) * DEG, 5)} = ${n(cl, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([0.05, 0.08, 0.1, 0.12, 0.15]);
        return {
          q: [`A symmetric Joukowski aerofoil comes from the circle centred at $\\mu = -${m}$ through $\\zeta = 1$. With $U = 1$, write the Kutta circulation as a function of the angle of attack $\\alpha$ (in radians).`, `対称なジューコフスキー翼型は、$\\zeta = 1$ を通り中心が $\\mu = -${m}$ の円から作られます。$U = 1$ のとき、クッタ条件の循環を迎角 $\\alpha$（ラジアン）の関数として書いてください。`],
          a: { type: 'expr', v: `4*pi*${1 + m}*sin(alpha)`, vars: ['alpha'], dom: { alpha: [-0.2, 0.3] }, lhs: ['$\\Gamma(\\alpha) =$', '$\\Gamma(\\alpha) =$'] },
          hint: ['For a centre on the real axis, $\\beta = 0$.', '中心が実軸上なら $\\beta = 0$ です。'],
          sol: [[`$a = |1 - (-${m})| = ${n(1 + m, 3)}$ and $\\beta = 0$.`, `$a = |1 - (-${m})| = ${n(1 + m, 3)}$、$\\beta = 0$ です。`], [`$\\Gamma = 4\\pi a\\sin\\alpha = ${n(4 * (1 + m), 4)}\\pi\\sin\\alpha$. The thicker section has a larger circle and so a little more lift than the flat plate's $4\\pi\\sin\\alpha$.`, `$\\Gamma = 4\\pi a\\sin\\alpha = ${n(4 * (1 + m), 4)}\\pi\\sin\\alpha$ です。厚い断面は円が大きく、平板の $4\\pi\\sin\\alpha$ より少し揚力が大きくなります。`]],
          set: { alpha: 5, mx: -m, my: 0 },
        };
      }
      if (form === 1) {
        const x = r.pick([1.2, 1.5, 2, -1.5, 0.5]), y = r.pick([0.5, 1, -0.8, 1.5]), d = x * x + y * y, zx = x + x / d, zy = y - y / d;
        return {
          q: [`Map the point $\\zeta = ${x} ${y < 0 ? '-' : '+'} ${Math.abs(y)}i$ by $z = \\zeta + 1/\\zeta$. Give the real and imaginary parts of $z$ to four decimals.`, `点 $\\zeta = ${x} ${y < 0 ? '-' : '+'} ${Math.abs(y)}i$ を $z = \\zeta + 1/\\zeta$ で写してください。$z$ の実部と虚部を小数第四位まで答えてください。`],
          a: { type: 'tuple', v: [zx, zy], labels: ['$\\operatorname{Re} z$', '$\\operatorname{Im} z$'], tol: 0.00006 },
          hint: ['$1/\\zeta = \\bar\\zeta/|\\zeta|^2$.', '$1/\\zeta = \\bar\\zeta/|\\zeta|^2$ です。'],
          sol: [[`$|\\zeta|^2 = ${n(d, 4)}$, so $1/\\zeta = (${x} ${y < 0 ? '+' : '-'} ${Math.abs(y)}i)/${n(d, 4)} = ${n(x / d, 5)} ${y < 0 ? '+' : '-'} ${n(Math.abs(y) / d, 5)}i$.`, `$|\\zeta|^2 = ${n(d, 4)}$ なので $1/\\zeta = (${x} ${y < 0 ? '+' : '-'} ${Math.abs(y)}i)/${n(d, 4)} = ${n(x / d, 5)} ${y < 0 ? '+' : '-'} ${n(Math.abs(y) / d, 5)}i$ です。`], [`$z = ${n(zx, 5)} ${zy < 0 ? '-' : '+'} ${n(Math.abs(zy), 5)}i$. Points far out barely move; points on the unit circle collapse onto the segment $[-2, 2]$.`, `$z = ${n(zx, 5)} ${zy < 0 ? '-' : '+'} ${n(Math.abs(zy), 5)}i$ です。遠くの点はほとんど動かず、単位円上の点は線分 $[-2, 2]$ につぶれます。`]],
        };
      }
      const cl = r.pick([0.3, 0.5, 0.8, 1.0, 1.2]), al = Math.asin(cl / (2 * PI)) / DEG;
      return {
        q: [`What angle of attack gives a flat plate in ideal flow a lift coefficient of $${cl}$? In degrees, two decimals.`, `理想流の中の平板が揚力係数 $${cl}$ をもつ迎角はいくらですか。度で、小数第二位まで答えてください。`],
        a: { type: 'num', v: al, tol: 0.006, unit: ['°', '°'] },
        hint: ['Invert $C_L = 2\\pi\\sin\\alpha$.', '$C_L = 2\\pi\\sin\\alpha$ を逆に解きます。'],
        sol: [[`$\\sin\\alpha = ${cl}/(2\\pi) = ${n(cl / (2 * PI), 5)}$.`, `$\\sin\\alpha = ${cl}/(2\\pi) = ${n(cl / (2 * PI), 5)}$ です。`], [`$\\alpha = ${n(al, 4)}^\\circ$. ${cl >= 1 ? 'A real thin plate would already have separated near its sharp leading edge well before this.' : 'Small angles suffice because the lift slope is large.'}`, `$\\alpha = ${n(al, 4)}^\\circ$ です。${cl >= 1 ? '実際の薄い平板は、それよりずっと前に鋭い前縁の近くではく離しています。' : '揚力傾斜が大きいので、小さな角度で足ります。'}`]],
        ...(al <= 16 ? { set: { alpha: Math.round(al * 2) / 2, mx: 0, my: 0 } } : {}),
      };
    },
  ];

  /* ---------------- finite-wing ---------------- */
  Q['finite-wing'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([10, 15, 18, 34, 60, 80]), S = r.pick([10, 12, 16, 30, 120, 360, 845]), AR = b * b / S;
        return {
          q: [`A wing has span $${b}$ m and area $${S}$ m². What is its aspect ratio?`, `翼幅 $${b}$ m、面積 $${S}$ m² の翼のアスペクト比はいくらですか。`],
          a: { type: 'num', v: AR, rel: 0.005 },
          hint: ['$AR = b^2/S$, which is span divided by mean chord.', '$AR = b^2/S$ で、翼幅を平均翼弦で割ったものです。'],
          sol: [[`$AR = ${b}^2/${S}$.`, `$AR = ${b}^2/${S}$ です。`], [`$= ${n(AR, 4)}$.`, `$= ${n(AR, 4)}$ です。`]],
        };
      }
      if (form === 1) {
        const CL = r.pick([0.4, 0.5, 0.8, 1.0, 1.2]), AR = r.pick([6, 8, 10, 20]), e = r.pick([0.8, 0.85, 0.9, 1]), CDi = CL * CL / (PI * e * AR);
        return {
          q: [`A wing with $AR = ${AR}$ and span efficiency $e = ${e}$ flies at $C_L = ${CL}$. What is its induced drag coefficient? Four significant figures.`, `$AR = ${AR}$、翼幅効率 $e = ${e}$ の翼が $C_L = ${CL}$ で飛んでいます。誘導抗力係数を有効数字四桁で求めてください。`],
          a: { type: 'num', v: CDi, rel: 0.002 },
          hint: ['$C_{D_i} = C_L^2/(\\pi e\\,AR)$.', '$C_{D_i} = C_L^2/(\\pi e\\,AR)$ です。'],
          sol: [[`$C_L^2 = ${n(CL * CL, 4)}$ and $\\pi e\\,AR = ${n(PI * e * AR, 5)}$.`, `$C_L^2 = ${n(CL * CL, 4)}$、$\\pi e\\,AR = ${n(PI * e * AR, 5)}$ です。`], [`$C_{D_i} = ${n(CDi, 5)}$: it grows with the square of the lift, so it dominates at low speed.`, `$C_{D_i} = ${n(CDi, 5)}$ です。揚力の二乗で増えるので、低速で支配的になります。`]],
        };
      }
      return {
        q: ['Which untwisted planform gives an elliptic lift distribution, uniform downwash and the least induced drag for a given span and lift?', 'ねじりのない平面形のうち、与えられた翼幅と揚力で楕円の揚力分布、一様な吹き下ろし、最小の誘導抗力を与えるのはどれですか。'],
        a: { type: 'choice', v: 2, opts: [['Rectangular', '矩形'], ['Tapered to a pointed tip', '先がとがるまでテーパーをつけた翼'], ['Elliptic', '楕円'], ['Swept back', '後退翼']] },
        hint: ['With the same section everywhere, the loading follows the chord.', 'どこでも同じ断面なら、荷重は翼弦に従います。'],
        sol: [['For an untwisted wing with the same aerofoil everywhere, a chord proportional to $\\sqrt{1 - (2y/b)^2}$ gives exactly that circulation shape.', 'どこでも同じ翼型でねじりのない翼では、翼弦を $\\sqrt{1 - (2y/b)^2}$ に比例させると、ちょうどその形の循環になります。'], ['Then only $A_1$ is nonzero, the downwash is constant along the span and $e = 1$, as on the Spitfire. A pointed taper overloads the tips in the other direction.', 'そのとき $A_1$ だけが 0 でなく、吹き下ろしは翼幅に沿って一定で $e = 1$ です。スピットファイアがその例です。先がとがるテーパーは逆の方向に翼端の荷重を偏らせます。']],
        set: { plan: 2, twist: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const AR = r.pick([4, 6, 8, 10, 12, 20]), al = r.pick([2, 3, 4, 5, 6]), a = 2 * PI / (1 + 2 / AR), CL = a * al * DEG;
        return {
          q: [`An untwisted elliptic wing of aspect ratio $${AR}$ uses a symmetric section with lift slope $2\\pi$ per radian. What is $C_L$ at $\\alpha = ${al}^\\circ$? Three decimals.`, `アスペクト比 $${AR}$ のねじりのない楕円翼が、揚力傾斜 $2\\pi$（1/rad）の対称断面を使っています。$\\alpha = ${al}^\\circ$ での $C_L$ を小数第三位まで求めてください。`],
          a: { type: 'num', v: CL, tol: 0.0006 },
          hint: ['Finite-wing slope: $a = a_0/(1 + a_0/(\\pi AR))$.', '有限翼の傾斜：$a = a_0/(1 + a_0/(\\pi AR))$ です。'],
          sol: [[`$a = 2\\pi/(1 + 2/${AR}) = ${n(a, 5)}$ per radian.`, `$a = 2\\pi/(1 + 2/${AR}) = ${n(a, 5)}$（1/rad）です。`], [`$C_L = ${n(a, 5)} \\times ${n(al * DEG, 5)} = ${n(CL, 4)}$, below the $${n(2 * PI * al * DEG, 4)}$ of the aerofoil because the downwash lowers the effective angle.`, `$C_L = ${n(a, 5)} \\times ${n(al * DEG, 5)} = ${n(CL, 4)}$ で、翼型の $${n(2 * PI * al * DEG, 4)}$ より小さくなります。吹き下ろしが有効迎角を下げるからです。`]],
          set: { plan: 2, ar: AR, alpha: al, twist: 0 },
        };
      }
      if (form === 1) {
        const CL = r.pick([0.4, 0.6, 0.8, 1.0]), AR = r.pick([5, 6, 8, 10]), ai = CL / (PI * AR) / DEG;
        return {
          q: [`An elliptically loaded wing of aspect ratio $${AR}$ flies at $C_L = ${CL}$. Its induced angle is $\\alpha_i = C_L/(\\pi AR)$. What is it in degrees? Three significant figures.`, `アスペクト比 $${AR}$ の楕円荷重の翼が $C_L = ${CL}$ で飛んでいます。誘導迎角は $\\alpha_i = C_L/(\\pi AR)$ です。度で、有効数字三桁で求めてください。`],
          a: { type: 'num', v: ai, rel: 0.005, unit: ['°', '°'] },
          hint: ['The formula gives radians.', '式はラジアンを与えます。'],
          sol: [[`$\\alpha_i = ${CL}/(\\pi \\times ${AR}) = ${n(CL / (PI * AR), 5)}$ rad.`, `$\\alpha_i = ${CL}/(\\pi \\times ${AR}) = ${n(CL / (PI * AR), 5)}$ rad です。`], [`$= ${n(ai, 4)}^\\circ$. The lift is tilted back by this angle, so $C_{D_i} = C_L\\alpha_i$.`, `$= ${n(ai, 4)}^\\circ$ です。揚力はこの角度だけ後ろへ傾くので $C_{D_i} = C_L\\alpha_i$ です。`]],
        };
      }
      const A1 = r.pick([6, 8, 10]), A2 = r.pick([12, 16, 20, 25]), ratio = A1 / A2;
      return {
        q: [`A designer stretches the wing from aspect ratio $${A1}$ to $${A2}$, keeping the lift coefficient and span efficiency. By what factor does the induced drag coefficient change?`, `設計者が翼のアスペクト比を $${A1}$ から $${A2}$ に伸ばし、揚力係数と翼幅効率はそのままにします。誘導抗力係数は何倍になりますか。`],
        a: { type: 'num', v: ratio, rel: 0.005 },
        hint: ['$C_{D_i} \\propto 1/AR$ at fixed $C_L$ and $e$.', '$C_L$ と $e$ が一定なら $C_{D_i} \\propto 1/AR$ です。'],
        sol: [[`$C_{D_i,2}/C_{D_i,1} = AR_1/AR_2 = ${A1}/${A2}$.`, `$C_{D_i,2}/C_{D_i,1} = AR_1/AR_2 = ${A1}/${A2}$ です。`], [`$= ${n(ratio, 4)}$. The longer wing is heavier and bends more, which is the trade every designer makes.`, `$= ${n(ratio, 4)}$ です。長い翼は重く、よくたわみます。それがどの設計者も迫られる取引です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const AR = r.pick([6, 8, 10, 12, 16]);
        return {
          q: [`For an untwisted elliptic wing of aspect ratio $${AR}$ with section lift slope $2\\pi$, write $C_L$ as a function of the angle of attack $\\alpha$ in radians.`, `断面の揚力傾斜が $2\\pi$ の、アスペクト比 $${AR}$ のねじりのない楕円翼について、$C_L$ を迎角 $\\alpha$（ラジアン）の関数として書いてください。`],
          a: { type: 'expr', v: `2*pi*alpha/(1+2/${AR})`, vars: ['alpha'], dom: { alpha: [-0.1, 0.25] }, lhs: ['$C_L(\\alpha) =$', '$C_L(\\alpha) =$'] },
          hint: ['The downwash angle is $C_L/(\\pi AR)$; the section sees $\\alpha$ minus it.', '吹き下ろし角は $C_L/(\\pi AR)$ で、断面が受けるのは $\\alpha$ からそれを引いた角度です。'],
          sol: [[`$C_L = 2\\pi(\\alpha - C_L/(\\pi\\,${AR}))$, so $C_L(1 + 2/${AR}) = 2\\pi\\alpha$.`, `$C_L = 2\\pi(\\alpha - C_L/(\\pi\\,${AR}))$ より $C_L(1 + 2/${AR}) = 2\\pi\\alpha$ です。`], [`$C_L = 2\\pi\\alpha/(1 + 2/${AR}) = ${n(2 * PI / (1 + 2 / AR), 4)}\\,\\alpha$.`, `$C_L = 2\\pi\\alpha/(1 + 2/${AR}) = ${n(2 * PI / (1 + 2 / AR), 4)}\\,\\alpha$ です。`]],
          set: { plan: 2, ar: AR, twist: 0 },
        };
      }
      if (form === 1) {
        const W = r.pick([5000, 8000, 12000, 50000]), V = r.pick([30, 40, 60, 80]), b = r.pick([10, 12, 15, 20]), e = r.pick([0.8, 0.9]), Di = W * W / (0.5 * RHO * V * V * PI * e * b * b);
        return {
          q: [`An aircraft weighing $${W}$ N flies level at $${V}$ m/s in sea-level air with span $${b}$ m and $e = ${e}$. What is its induced drag, in N? Three significant figures.`, `重さ $${W}$ N の機体が、海面高度の空気中を $${V}$ m/s で水平飛行しています。翼幅は $${b}$ m、$e = ${e}$ です。誘導抗力を N で、有効数字三桁で求めてください。`],
          a: { type: 'num', v: Di, rel: 0.005, unit: ['N', 'N'] },
          hint: ['Substitute $C_L = W/(qS)$ into $D_i = qS\\,C_L^2/(\\pi e\\,AR)$, with $AR = b^2/S$: the area cancels.', '$C_L = W/(qS)$ を $D_i = qS\\,C_L^2/(\\pi e\\,AR)$ に代入し $AR = b^2/S$ を使うと、面積が消えます。'],
          sol: [[`$D_i = \\dfrac{W^2}{q\\,\\pi e\\,b^2}$ with $q = \\tfrac12\\rho V^2 = ${n(0.5 * RHO * V * V, 5)}$ Pa.`, `$q = \\tfrac12\\rho V^2 = ${n(0.5 * RHO * V * V, 5)}$ Pa として $D_i = \\dfrac{W^2}{q\\,\\pi e\\,b^2}$ です。`], [`$D_i = ${W}^2/(${n(0.5 * RHO * V * V, 5)} \\times \\pi \\times ${e} \\times ${b}^2) = ${n(Di, 4)}$ N. Only span, not area, sets the induced drag: it falls as $1/V^2$.`, `$D_i = ${W}^2/(${n(0.5 * RHO * V * V, 5)} \\times \\pi \\times ${e} \\times ${b}^2) = ${n(Di, 4)}$ N です。誘導抗力を決めるのは面積ではなく翼幅で、$1/V^2$ で下がります。`]],
        };
      }
      const CL = r.pick([0.5, 0.8, 1.0, 1.2]), e = r.pick([0.85, 0.9, 0.95]), tgt = r.pick([0.01, 0.015, 0.02, 0.03]), AR = CL * CL / (PI * e * tgt);
      return {
        q: [`What aspect ratio keeps the induced drag coefficient down to $${tgt}$ at $C_L = ${CL}$ with $e = ${e}$? Three significant figures.`, `$e = ${e}$ で $C_L = ${CL}$ のとき、誘導抗力係数を $${tgt}$ に抑えるアスペクト比はいくらですか。有効数字三桁で答えてください。`],
        a: { type: 'num', v: AR, rel: 0.005 },
        hint: ['Solve $C_L^2/(\\pi e\\,AR) = C_{D_i}$ for $AR$.', '$C_L^2/(\\pi e\\,AR) = C_{D_i}$ を $AR$ について解きます。'],
        sol: [[`$AR = C_L^2/(\\pi e\\,C_{D_i}) = ${n(CL * CL, 4)}/(\\pi \\times ${e} \\times ${tgt})$.`, `$AR = C_L^2/(\\pi e\\,C_{D_i}) = ${n(CL * CL, 4)}/(\\pi \\times ${e} \\times ${tgt})$ です。`], [`$AR = ${n(AR, 4)}$.`, `$AR = ${n(AR, 4)}$ です。`]],
      };
    },
  ];

  /* ---------------- glide-polar ---------------- */
  const pol = (AR, e, cd0) => { const K = 1 / (PI * e * AR); return { K, LD: 1 / (2 * Math.sqrt(K * cd0)), CLbg: Math.sqrt(cd0 / K), CLms: Math.sqrt(3 * cd0 / K) }; };
  Q['glide-polar'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const LD = r.pick([10, 15, 30, 40, 50]), h = r.pick([500, 1000, 1500, 2000]), d = LD * h / 1000;
        return {
          q: [`An aircraft with glide ratio $${LD}$ loses its engine at $${h}$ m above flat ground in still air. How far can it glide, in km?`, `滑空比 $${LD}$ の機体が、静かな空気の中、平らな地面から $${h}$ m の高さでエンジンを失いました。何 km 滑空できますか。`],
          a: { type: 'num', v: d, rel: 0.005, unit: ['km', 'km'] },
          hint: ['In a steady glide, distance over height equals L/D.', '定常滑空では、距離と高さの比が L/D に等しくなります。'],
          sol: [[`Distance $= (L/D) \\times h = ${LD} \\times ${h}$ m.`, `距離 $= (L/D) \\times h = ${LD} \\times ${h}$ m です。`], [`$= ${n(d, 4)}$ km, provided it flies at its best-glide speed.`, `最良滑空速度で飛べば $= ${n(d, 4)}$ km です。`]],
        };
      }
      if (form === 1) {
        const AR = r.pick([6, 8, 10, 15, 18, 25]), e = r.pick([0.75, 0.8, 0.85, 0.9, 0.95]), K = 1 / (PI * e * AR);
        return {
          q: [`What is the induced drag factor $K = 1/(\\pi e\\,AR)$ for $AR = ${AR}$ and $e = ${e}$? Four significant figures.`, `$AR = ${AR}$、$e = ${e}$ のときの誘導抗力の係数 $K = 1/(\\pi e\\,AR)$ を、有効数字四桁で求めてください。`],
          a: { type: 'num', v: K, rel: 0.002 },
          hint: ['Multiply the three numbers in the denominator first.', 'まず分母の三つの数をかけます。'],
          sol: [[`$\\pi e\\,AR = ${n(PI * e * AR, 5)}$.`, `$\\pi e\\,AR = ${n(PI * e * AR, 5)}$ です。`], [`$K = ${n(K, 5)}$; then $C_D = C_{D0} + K C_L^2$.`, `$K = ${n(K, 5)}$ で、$C_D = C_{D0} + K C_L^2$ となります。`]],
          set: { ar: AR, e },
        };
      }
      const V = r.pick([20, 25, 30, 40, 50]), LD = r.pick([20, 25, 30, 35, 40]), w = V / LD;
      return {
        q: [`A glider flies at $${V}$ m/s with a lift-to-drag ratio of $${LD}$. What is its sink rate, in m/s?`, `グライダーが揚抗比 $${LD}$ で $${V}$ m/s で飛んでいます。沈下率は何 m/s ですか。`],
        a: { type: 'num', v: w, rel: 0.005, unit: ['m/s', 'm/s'] },
        hint: ['The glide path is so shallow that sink rate is speed divided by L/D.', '滑空経路は浅いので、沈下率は速度を L/D で割ったものです。'],
        sol: [[`$w = V/(L/D) = ${V}/${LD}$.`, `$w = V/(L/D) = ${V}/${LD}$ です。`], [`$= ${n(w, 4)}$ m/s. A thermal rising faster than this lets the glider climb.`, `$= ${n(w, 4)}$ m/s です。これより速く上昇するサーマルの中なら、グライダーは上昇できます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const AR = r.pick([8, 10, 15, 18, 25]), e = r.pick([0.8, 0.85, 0.9]), cd0 = r.pick([0.01, 0.012, 0.015, 0.02, 0.025]), p = pol(AR, e, cd0);
        return {
          q: [`With $AR = ${AR}$, $e = ${e}$ and $C_{D0} = ${cd0}$, what is the best lift-to-drag ratio? Three significant figures.`, `$AR = ${AR}$、$e = ${e}$、$C_{D0} = ${cd0}$ のとき、最良の揚抗比はいくらですか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: p.LD, rel: 0.005 },
          hint: ['$(L/D)_{\\max} = 1/(2\\sqrt{K C_{D0}})$.', '$(L/D)_{\\max} = 1/(2\\sqrt{K C_{D0}})$ です。'],
          sol: [[`$K = 1/(\\pi \\times ${e} \\times ${AR}) = ${n(p.K, 5)}$.`, `$K = 1/(\\pi \\times ${e} \\times ${AR}) = ${n(p.K, 5)}$ です。`], [`$(L/D)_{\\max} = 1/(2\\sqrt{${n(p.K, 5)} \\times ${cd0}}) = ${n(p.LD, 4)}$, reached at $C_L = ${n(p.CLbg, 4)}$, where induced and parasite drag are equal.`, `$(L/D)_{\\max} = 1/(2\\sqrt{${n(p.K, 5)} \\times ${cd0}}) = ${n(p.LD, 4)}$ で、誘導抗力と有害抗力が等しくなる $C_L = ${n(p.CLbg, 4)}$ で達成されます。`]],
          set: { ar: AR, e, cd0 },
        };
      }
      if (form === 1) {
        const AR = r.pick([8, 10, 15, 20]), e = r.pick([0.8, 0.9]), cd0 = r.pick([0.01, 0.015, 0.02]), p = pol(AR, e, cd0);
        return {
          q: [`At what lift coefficient does a wing with $AR = ${AR}$, $e = ${e}$, $C_{D0} = ${cd0}$ reach its best lift-to-drag ratio? Three decimals.`, `$AR = ${AR}$、$e = ${e}$、$C_{D0} = ${cd0}$ の翼は、揚力係数がいくらのとき最良の揚抗比になりますか。小数第三位まで答えてください。`],
          a: { type: 'num', v: p.CLbg, tol: 0.0006 },
          hint: ['Minimise $C_D/C_L = C_{D0}/C_L + KC_L$.', '$C_D/C_L = C_{D0}/C_L + KC_L$ を最小にします。'],
          sol: [[`$\\frac{d}{dC_L}(C_{D0}/C_L + KC_L) = 0$ gives $C_L = \\sqrt{C_{D0}/K}$.`, `$\\frac{d}{dC_L}(C_{D0}/C_L + KC_L) = 0$ より $C_L = \\sqrt{C_{D0}/K}$ です。`], [`$K = ${n(p.K, 5)}$, so $C_L = \\sqrt{${cd0}/${n(p.K, 5)}} = ${n(p.CLbg, 4)}$.`, `$K = ${n(p.K, 5)}$ なので $C_L = \\sqrt{${cd0}/${n(p.K, 5)}} = ${n(p.CLbg, 4)}$ です。`]],
          set: { ar: AR, e, cd0 },
        };
      }
      const ws = r.pick([250, 300, 350, 400, 500]), CL = r.pick([0.5, 0.7, 0.9, 1.1]), V = Math.sqrt(2 * ws / (RHO * CL));
      return {
        q: [`A glider with wing loading $${ws}$ N/m² flies at $C_L = ${CL}$ at sea level. What is its airspeed, in m/s? Three significant figures.`, `翼面荷重 $${ws}$ N/m² のグライダーが、海面高度で $C_L = ${CL}$ で飛んでいます。対気速度を m/s で、有効数字三桁で求めてください。`],
        a: { type: 'num', v: V, rel: 0.005, unit: ['m/s', 'm/s'] },
        hint: ['Lift equals weight: $\\tfrac12\\rho V^2C_L = W/S$.', '揚力は重さに等しいので $\\tfrac12\\rho V^2C_L = W/S$ です。'],
        sol: [[`$V = \\sqrt{2(W/S)/(\\rho C_L)} = \\sqrt{2 \\times ${ws}/(1.225 \\times ${CL})}$.`, `$V = \\sqrt{2(W/S)/(\\rho C_L)} = \\sqrt{2 \\times ${ws}/(1.225 \\times ${CL})}$ です。`], [`$V = ${n(V, 4)}$ m/s.`, `$V = ${n(V, 4)}$ m/s です。`]],
        set: { ws },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const AR = r.pick([15, 18, 20, 25]), e = r.pick([0.85, 0.9, 0.95]), cd0 = r.pick([0.01, 0.012, 0.015]), ws = r.pick([300, 350, 400]), p = pol(AR, e, cd0);
        const cl = Math.min(p.CLms, 1.4), V = Math.sqrt(2 * ws / (RHO * cl)), w = V * (cd0 + p.K * cl * cl) / cl;
        return {
          q: [`A glider has $AR = ${AR}$, $e = ${e}$, $C_{D0} = ${cd0}$ and $W/S = ${ws}$ N/m². What is its minimum sink rate at sea level, in m/s? Three significant figures (assume $C_{L,\\max}$ is not reached).`, `$AR = ${AR}$、$e = ${e}$、$C_{D0} = ${cd0}$、$W/S = ${ws}$ N/m² のグライダーの、海面高度での最小沈下率を m/s で、有効数字三桁で求めてください（$C_{L,\\max}$ には達しないとします）。`],
          a: { type: 'num', v: w, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['Minimum sink is at $C_L = \\sqrt{3C_{D0}/K}$, where $C_D = 4C_{D0}$.', '最小沈下は $C_L = \\sqrt{3C_{D0}/K}$ で起こり、そこでは $C_D = 4C_{D0}$ です。'],
          sol: [[`$K = ${n(p.K, 5)}$, $C_L = \\sqrt{3 \\times ${cd0}/${n(p.K, 5)}} = ${n(cl, 4)}$, $C_D = ${n(4 * cd0, 4)}$.`, `$K = ${n(p.K, 5)}$、$C_L = \\sqrt{3 \\times ${cd0}/${n(p.K, 5)}} = ${n(cl, 4)}$、$C_D = ${n(4 * cd0, 4)}$ です。`], [`$V = \\sqrt{2 \\times ${ws}/(1.225 \\times ${n(cl, 4)})} = ${n(V, 4)}$ m/s.`, `$V = \\sqrt{2 \\times ${ws}/(1.225 \\times ${n(cl, 4)})} = ${n(V, 4)}$ m/s です。`], [`Sink $= V C_D/C_L = ${n(w, 4)}$ m/s, slower than at best glide but over a shorter distance.`, `沈下率 $= V C_D/C_L = ${n(w, 4)}$ m/s で、最良滑空より遅い沈下ですが、進む距離は短くなります。`]],
          set: { ar: AR, e, cd0, ws },
        };
      }
      if (form === 1) {
        const V0 = r.pick([25, 27, 30, 32]), k = r.pick([1.2, 1.4, 1.5, 2]), V1 = V0 * Math.sqrt(k);
        return {
          q: [`A glider's best-glide speed is $${V0}$ m/s. Water ballast raises its weight by a factor of $${k}$. What is the new best-glide speed? Three significant figures.`, `あるグライダーの最良滑空速度は $${V0}$ m/s です。水バラストで重さが $${k}$ 倍になります。新しい最良滑空速度はいくらですか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: V1, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['The best-glide $C_L$ does not depend on weight; $V \\propto \\sqrt{W/S}$.', '最良滑空の $C_L$ は重さによりません。$V \\propto \\sqrt{W/S}$ です。'],
          sol: [[`At the same $C_L$, $V$ scales with $\\sqrt{W}$: the factor is $\\sqrt{${k}} = ${n(Math.sqrt(k), 4)}$.`, `同じ $C_L$ では $V$ は $\\sqrt{W}$ に比例するので、倍率は $\\sqrt{${k}} = ${n(Math.sqrt(k), 4)}$ です。`], [`$V = ${n(V1, 4)}$ m/s, with the same glide ratio: the glider covers ground faster between thermals.`, `$V = ${n(V1, 4)}$ m/s で、滑空比は同じです。グライダーはサーマルの間をより速く進みます。`]],
        };
      }
      const AR = r.pick([15, 18, 22, 26]), e = r.pick([0.85, 0.9, 0.95]), LD = r.pick([30, 35, 40, 45, 50]), K = 1 / (PI * e * AR), cd0 = 1 / (4 * K * LD * LD);
      return {
        q: [`A designer wants a best glide ratio of $${LD}$ with $AR = ${AR}$ and $e = ${e}$. What parasite drag coefficient $C_{D0}$ is allowed? Three significant figures.`, `設計者が $AR = ${AR}$、$e = ${e}$ で最良滑空比 $${LD}$ を目指しています。許される有害抗力係数 $C_{D0}$ はいくらですか。有効数字三桁で答えてください。`],
        a: { type: 'num', v: cd0, rel: 0.005 },
        hint: ['Invert $(L/D)_{\\max} = 1/(2\\sqrt{KC_{D0}})$.', '$(L/D)_{\\max} = 1/(2\\sqrt{KC_{D0}})$ を逆に解きます。'],
        sol: [[`$C_{D0} = 1/(4K(L/D)^2)$ with $K = ${n(K, 5)}$.`, `$K = ${n(K, 5)}$ として $C_{D0} = 1/(4K(L/D)^2)$ です。`], [`$C_{D0} = ${n(cd0, 4)}$. Every unit of glide ratio above 40 demands a cleaner airframe, which is why gliders are polished and sealed.`, `$C_{D0} = ${n(cd0, 4)}$ です。滑空比を 40 から一つ上げるごとに、より滑らかな機体が要ります。グライダーが磨かれ、すき間をふさがれるのはそのためです。`]],
        ...(cd0 >= 0.005 && cd0 <= 0.05 ? { set: { ar: AR, e, cd0: Math.round(cd0 * 1000) / 1000 } } : {}),
      };
    },
  ];
})();
