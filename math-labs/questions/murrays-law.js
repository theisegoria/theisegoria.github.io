'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, DEG = PI / 180;
  // the vessel model, written out again here (generators do not load the topic module)
  const rOpt = (Qv, mu, b) => Math.pow((16 * mu * Qv * Qv) / (PI * PI * b), 1 / 6);
  const murray = (r0, r1, r2) => [Math.acos((r0 ** 4 + r1 ** 4 - r2 ** 4) / (2 * r0 * r0 * r1 * r1)) / DEG, Math.acos((r0 ** 4 + r2 ** 4 - r1 ** 4) / (2 * r0 * r0 * r2 * r2)) / DEG];
  const cr = (x) => (Math.pow(x, -4) + 2 * x * x) / 3;
  const clampStep = (x, lo, hi, st) => Math.min(hi, Math.max(lo, Math.round(x / st) * st));

  /* ---------------- murray-cost ---------------- */
  Q['murray-cost'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const r1 = r.step(1, 3, 0.1), r2 = r.step(0.5, 2.5, 0.1), r0 = Math.cbrt(r1 ** 3 + r2 ** 3);
        return {
          q: [`A vessel splits into daughters of radii $${n(r1, 1)}$ mm and $${n(r2, 1)}$ mm. If the junction obeys Murray’s law, what is the parent’s radius? In mm.`, `血管が半径 $${n(r1, 1)}$ mm と $${n(r2, 1)}$ mm の娘の血管に分かれています。分岐点がマレーの法則に従うとき、親の血管の半径はいくらですか。mm で答えてください。`],
          a: { type: 'num', v: r0, rel: 0.004, unit: ['mm', 'mm'] },
          hint: ['Flow is conserved and each flow is proportional to its radius cubed.', '流量は保存され、それぞれの流量は半径の 3 乗に比例します。'],
          sol: [[`$Q_0 = Q_1 + Q_2$ and $Q \\propto r^3$, so $r_0^3 = r_1^3 + r_2^3 = ${n(r1 ** 3, 3)} + ${n(r2 ** 3, 3)} = ${n(r1 ** 3 + r2 ** 3, 3)}$.`, `$Q_0 = Q_1 + Q_2$ かつ $Q \\propto r^3$ なので、$r_0^3 = r_1^3 + r_2^3 = ${n(r1 ** 3, 3)} + ${n(r2 ** 3, 3)} = ${n(r1 ** 3 + r2 ** 3, 3)}$ です。`], [`$r_0 = ${n(r0, 3)}$ mm, only a little larger than the bigger daughter: cubes add, radii do not.`, `$r_0 = ${n(r0, 3)}$ mm で、太いほうの娘より少し大きいだけです。足し合わされるのは 3 乗で、半径ではありません。`]],
        };
      }
      if (form === 1) {
        const r0 = r.step(1, 6, 0.5), d = r0 * 2 ** (-1 / 3);
        return {
          q: [`A vessel of radius $${n(r0, 1)}$ mm splits into two equal daughters according to Murray’s law. What is each daughter’s radius? In mm.`, `半径 $${n(r0, 1)}$ mm の血管が、マレーの法則に従って二本の等しい娘の血管に分かれます。娘の血管の半径はそれぞれいくらですか。mm で答えてください。`],
          a: { type: 'num', v: d, rel: 0.004, unit: ['mm', 'mm'], show: `${n(r0, 1)}\\cdot 2^{-1/3}` },
          hint: ['$r_0^3 = 2r_1^3$.', '$r_0^3 = 2r_1^3$ です。'],
          sol: [[`Equal flows and $r_0^3 = r_1^3 + r_2^3 = 2r_1^3$ give $r_1 = 2^{-1/3}r_0 = 0.794\\,r_0$.`, `流量が等しく $r_0^3 = r_1^3 + r_2^3 = 2r_1^3$ なので、$r_1 = 2^{-1/3}r_0 = 0.794\\,r_0$ です。`], [`$r_1 = ${n(d, 3)}$ mm: halving the flow shrinks the radius by only about a fifth.`, `$r_1 = ${n(d, 3)}$ mm です。流量が半分になっても、半径は約五分の一しか縮みません。`]],
        };
      }
      const m = r.pick([2, 3, 4, 8, 27, 64, 125, 1000]), f = Math.cbrt(m);
      return {
        q: [`Under Murray’s law, by what factor must a vessel’s radius change to carry $${m}$ times the flow?`, `マレーの法則のもとで、流量を $${m}$ 倍にするには血管の半径を何倍にしなければなりませんか。`],
        a: { type: 'num', v: f, rel: 0.004, show: `\\sqrt[3]{${m}}` },
        hint: ['$Q \\propto r^3$.', '$Q \\propto r^3$ です。'],
        sol: [[`$Q \\propto r^3$, so $r \\propto Q^{1/3}$ and the factor is $\\sqrt[3]{${m}} = ${n(f, 4)}$.`, `$Q \\propto r^3$ なので $r \\propto Q^{1/3}$ で、倍率は $\\sqrt[3]{${m}} = ${n(f, 4)}$ です。`], ['A modest widening buys a large increase in flow, because the pumping cost falls as the fourth power of the radius.', '送り出しの費用が半径の 4 乗で下がるので、少し太くするだけで流量を大きく増やせます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Qm = r.step(0.2, 5, 0.1), mu = r.step(2.5, 4.5, 0.1), b = r.step(500, 4000, 100), rs = rOpt(Qm * 1e-6, mu * 1e-3, b) * 1e3;
        return {
          q: [`Blood with viscosity $\\mu = ${n(mu, 1)}$ mPa·s flows at $Q = ${n(Qm, 1)}$ mL/s, and its upkeep costs $b = ${b}$ W/m³. What vessel radius minimizes the total power? In mm.`, `粘性率 $\\mu = ${n(mu, 1)}$ mPa·s の血液が $Q = ${n(Qm, 1)}$ mL/s で流れ、その維持費は $b = ${b}$ W/m³ です。全電力を最小にする血管の半径はいくらですか。mm で答えてください。`],
          a: { type: 'num', v: rs, rel: 0.005, unit: ['mm', 'mm'] },
          hint: ['Minimize $8\\mu Q^2/(\\pi r^4) + b\\pi r^2$ per unit length.', '単位長さあたりの $8\\mu Q^2/(\\pi r^4) + b\\pi r^2$ を最小にします。'],
          sol: [[`Setting the derivative $-32\\mu Q^2/(\\pi r^5) + 2b\\pi r$ to zero gives $r^{*6} = 16\\mu Q^2/(\\pi^2 b)$.`, `導関数 $-32\\mu Q^2/(\\pi r^5) + 2b\\pi r$ をゼロとおくと $r^{*6} = 16\\mu Q^2/(\\pi^2 b)$ です。`], [`With $\\mu = ${n(mu * 1e-3, 4)}$ Pa·s, $Q = ${sig(Qm * 1e-6, 3)}$ m³/s and $b = ${b}$ W/m³, $r^* = ${sig(rs * 1e-3, 4)}$ m.`, `$\\mu = ${n(mu * 1e-3, 4)}$ Pa·s、$Q = ${sig(Qm * 1e-6, 3)}$ m³/s、$b = ${b}$ W/m³ を代入すると $r^* = ${sig(rs * 1e-3, 4)}$ m です。`], [`That is $${n(rs, 3)}$ mm; because of the sixth root, even large errors in $b$ move it little.`, `$${n(rs, 3)}$ mm です。6 乗根なので、$b$ に大きな誤差があってもほとんど動きません。`]],
          set: { Q: Qm, mu, b, r: clampStep(rs, 0.2, 4, 0.01) },
        };
      }
      if (form === 1) {
        const Qm = r.step(0.2, 5, 0.1), mu = r.step(2.5, 4.5, 0.1), rm = r.step(0.5, 3, 0.1), t = (4 * mu * 1e-3 * Qm * 1e-6) / (PI * (rm * 1e-3) ** 3);
        return {
          q: [`Blood ($\\mu = ${n(mu, 1)}$ mPa·s) flows at $${n(Qm, 1)}$ mL/s through a vessel of radius $${n(rm, 1)}$ mm. What is the wall shear stress in Poiseuille flow? In Pa.`, `血液（$\\mu = ${n(mu, 1)}$ mPa·s）が $${n(Qm, 1)}$ mL/s で半径 $${n(rm, 1)}$ mm の血管を流れています。ポアズイユ流での壁ずり応力はいくらですか。Pa で答えてください。`],
          a: { type: 'num', v: t, rel: 0.005, unit: ['Pa', 'Pa'] },
          hint: ['$\\tau_w = 4\\mu Q/(\\pi r^3)$.', '$\\tau_w = 4\\mu Q/(\\pi r^3)$ です。'],
          sol: [[`$\\tau_w = 4\\mu Q/(\\pi r^3) = 4(${n(mu * 1e-3, 4)})(${sig(Qm * 1e-6, 3)})/(\\pi(${sig(rm * 1e-3, 3)})^3)$.`, `$\\tau_w = 4\\mu Q/(\\pi r^3) = 4(${n(mu * 1e-3, 4)})(${sig(Qm * 1e-6, 3)})/(\\pi(${sig(rm * 1e-3, 3)})^3)$ です。`], [`$\\tau_w = ${sig(t, 4)}$ Pa; an optimal vessel would have $\\sqrt{b\\mu}$, a few pascals, whatever its size.`, `$\\tau_w = ${sig(t, 4)}$ Pa です。最適な血管なら、太さによらず $\\sqrt{b\\mu}$、数パスカルになります。`]],
          set: { Q: Qm, mu, r: rm },
        };
      }
      const Qm = r.step(0.5, 5, 0.5), mu = r.step(3, 4, 0.5), rm = r.step(0.8, 2.5, 0.1), Pp = (8 * mu * 1e-3 * (Qm * 1e-6) ** 2) / (PI * (rm * 1e-3) ** 4) * 1e3;
      return {
        q: [`What power per metre of vessel does it take to push $${n(Qm, 1)}$ mL/s of blood ($\\mu = ${n(mu, 1)}$ mPa·s) through a vessel of radius $${n(rm, 1)}$ mm? In mW/m.`, `血液（$\\mu = ${n(mu, 1)}$ mPa·s）$${n(Qm, 1)}$ mL/s を半径 $${n(rm, 1)}$ mm の血管に押し通すのに、血管 1 m あたりどれだけの電力が要りますか。mW/m で答えてください。`],
        a: { type: 'num', v: Pp, rel: 0.005, unit: ['mW/m', 'mW/m'] },
        hint: ['Power is pressure drop times flow, and Poiseuille gives $\\Delta p/l = 8\\mu Q/(\\pi r^4)$.', '電力は圧力降下と流量の積で、ポアズイユの法則から $\\Delta p/l = 8\\mu Q/(\\pi r^4)$ です。'],
        sol: [[`$P/l = 8\\mu Q^2/(\\pi r^4) = 8(${n(mu * 1e-3, 4)})(${sig(Qm * 1e-6, 3)})^2/(\\pi(${sig(rm * 1e-3, 3)})^4)$.`, `$P/l = 8\\mu Q^2/(\\pi r^4) = 8(${n(mu * 1e-3, 4)})(${sig(Qm * 1e-6, 3)})^2/(\\pi(${sig(rm * 1e-3, 3)})^4)$ です。`], [`$P/l = ${sig(Pp * 1e-3, 4)}$ W/m $= ${n(Pp, 3)}$ mW/m. Halve the radius and this grows sixteenfold.`, `$P/l = ${sig(Pp * 1e-3, 4)}$ W/m $= ${n(Pp, 3)}$ mW/m です。半径を半分にすると 16 倍になります。`]],
        set: { Q: Qm, mu, r: rm },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['Write the cost of a vessel of radius $r = x\\,r^*$ as a multiple of the cost at the optimum $r^*$, as a function of $x$.', '半径 $r = x\\,r^*$ の血管の費用を、最適値 $r^*$ での費用の何倍かとして、$x$ の関数で書いてください。'],
          a: { type: 'expr', v: '(x^(-4)+2*x^2)/3', vars: ['x'], dom: { x: [0.5, 2] }, lhs: ['$P(xr^*)/P(r^*) =$', '$P(xr^*)/P(r^*) =$'] },
          hint: ['At the optimum the pumping term is half the upkeep term.', '最適値では送り出しの項は維持の項の半分です。'],
          sol: [['At $r^*$ the pumping term is $\\frac12 b\\pi r^{*2}$ and the upkeep $b\\pi r^{*2}$, total $\\frac32 b\\pi r^{*2}$.', '$r^*$ では送り出しの項が $\\frac12 b\\pi r^{*2}$、維持の項が $b\\pi r^{*2}$ で、合計 $\\frac32 b\\pi r^{*2}$ です。'], ['At $xr^*$ the pumping term scales by $x^{-4}$ and the upkeep by $x^2$: $\\frac12 b\\pi r^{*2}(x^{-4} + 2x^2)$.', '$xr^*$ では送り出しの項は $x^{-4}$ 倍、維持の項は $x^2$ 倍になり、$\\frac12 b\\pi r^{*2}(x^{-4} + 2x^2)$ です。'], ['Dividing, $P/P^* = (x^{-4} + 2x^2)/3$: too narrow is punished as $x^{-4}$, too wide only as $x^2$.', '割ると $P/P^* = (x^{-4} + 2x^2)/3$ です。細すぎると $x^{-4}$ で、太すぎても $x^2$ でしか罰せられません。']],
        };
      }
      if (form === 1) {
        const t = r.step(1, 4, 0.1), mu = r.step(2.5, 4.5, 0.1), b = (t * t) / (mu * 1e-3);
        return {
          q: [`In arteries that obey Murray’s law the wall shear stress is measured at $${n(t, 1)}$ Pa, with blood viscosity $${n(mu, 1)}$ mPa·s. What upkeep cost $b$ of blood does that imply? In W/m³.`, `マレーの法則に従う動脈で、壁ずり応力が $${n(t, 1)}$ Pa、血液の粘性率が $${n(mu, 1)}$ mPa·s と測られました。そこから血液の維持費 $b$ はいくらと推定されますか。W/m³ で答えてください。`],
          a: { type: 'num', v: b, rel: 0.005, unit: ['W/m³', 'W/m³'] },
          hint: ['At the optimum $\\tau_w = \\sqrt{b\\mu}$.', '最適値では $\\tau_w = \\sqrt{b\\mu}$ です。'],
          sol: [[`Substituting $Q = \\frac{\\pi}{4}\\sqrt{b/\\mu}\\,r^3$ into $\\tau_w = 4\\mu Q/(\\pi r^3)$ gives $\\tau_w = \\sqrt{b\\mu}$, so $b = \\tau_w^2/\\mu$.`, `$Q = \\frac{\\pi}{4}\\sqrt{b/\\mu}\\,r^3$ を $\\tau_w = 4\\mu Q/(\\pi r^3)$ に代入すると $\\tau_w = \\sqrt{b\\mu}$ なので、$b = \\tau_w^2/\\mu$ です。`], [`$b = ${n(t, 1)}^2/${n(mu * 1e-3, 4)} = ${n(b, 0)}$ W/m³, the same order as Murray’s own estimate of 1930 W/m³.`, `$b = ${n(t, 1)}^2/${n(mu * 1e-3, 4)} = ${n(b, 0)}$ W/m³ で、マレー自身の見積もり 1930 W/m³ と同じ程度です。`]],
          set: { mu, b: clampStep(b, 200, 5000, 10) },
        };
      }
      const p = r.pick([10, 15, 20, 25, 30, 40]), up = r.chance(0.5), x = up ? 1 + p / 100 : 1 - p / 100, e = (cr(x) - 1) * 100;
      return {
        q: [`A vessel is $${p}\\%$ ${up ? 'wider' : 'narrower'} than its Murray optimum. By what percentage does its total cost exceed the minimum?`, `血管がマレーの最適値より $${p}\\%$ ${up ? '太い' : '細い'}とします。全費用は最小値を何パーセント上回りますか。`],
        a: { type: 'num', v: e, tol: 0.06, unit: ['%', '%'] },
        hint: ['$P(xr^*)/P(r^*) = (x^{-4} + 2x^2)/3$.', '$P(xr^*)/P(r^*) = (x^{-4} + 2x^2)/3$ です。'],
        sol: [[`$x = ${n(x, 2)}$, so $x^{-4} = ${n(x ** -4, 4)}$ and $2x^2 = ${n(2 * x * x, 4)}$.`, `$x = ${n(x, 2)}$ なので、$x^{-4} = ${n(x ** -4, 4)}$、$2x^2 = ${n(2 * x * x, 4)}$ です。`], [`$P/P^* = ${n(cr(x), 4)}$, an excess of $${n(e, 2)}\\%$. ${up ? 'The same error on the narrow side would cost' : 'The same error on the wide side would cost only'} $${n((cr(up ? 1 - p / 100 : 1 + p / 100) - 1) * 100, 2)}\\%$.`, `$P/P^* = ${n(cr(x), 4)}$ で、$${n(e, 2)}\\%$ の超過です。${up ? '同じだけ細い側に外れると' : '同じだけ太い側に外れると'} $${n((cr(up ? 1 - p / 100 : 1 + p / 100) - 1) * 100, 2)}\\%$ です。`]],
      };
    },
  ];

  /* ---------------- murray-bifurcation ---------------- */
  Q['murray-bifurcation'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const each = r.chance(0.5), th = Math.acos(2 ** (-1 / 3)) / DEG;
        return {
          q: [each ? 'A vessel splits symmetrically and every vessel has its Murray radius. At what angle does each daughter leave the parent’s direction? In degrees.' : 'A vessel splits symmetrically and every vessel has its Murray radius. What is the angle between the two daughters? In degrees.', each ? '血管が対称に分かれ、どの血管もマレーの半径をもちます。娘の血管はそれぞれ親の向きから何度の角で分かれますか。度で答えてください。' : '血管が対称に分かれ、どの血管もマレーの半径をもちます。二本の娘の血管の間の角は何度ですか。度で答えてください。'],
          a: { type: 'num', v: each ? th : 2 * th, tol: 0.1, unit: ['°', '°'] },
          hint: ['$\\cos\\theta = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$ with $r_1 = r_2 = 2^{-1/3}r_0$.', '$r_1 = r_2 = 2^{-1/3}r_0$ として $\\cos\\theta = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$ を使います。'],
          sol: [['With $r_1 = r_2$, $\\cos\\theta = r_0^2/(2r_1^2) = 2^{2/3}/2 = 2^{-1/3} = 0.7937$.', '$r_1 = r_2$ なので $\\cos\\theta = r_0^2/(2r_1^2) = 2^{2/3}/2 = 2^{-1/3} = 0.7937$ です。'], [`$\\theta = ${n(th, 2)}^\\circ$ for each daughter, $${n(2 * th, 2)}^\\circ$ between them.`, `娘はそれぞれ $\\theta = ${n(th, 2)}^\\circ$、二本の間は $${n(2 * th, 2)}^\\circ$ です。`]],
          set: { s: 0.5, k: 3 },
        };
      }
      if (form === 1) {
        const r0 = r.step(2, 6, 0.5), r1 = r.step(1, r0 - 0.5, 0.5), r2 = Math.cbrt(r0 ** 3 - r1 ** 3);
        return {
          q: [`A parent of radius $${n(r0, 1)}$ mm gives off a daughter of radius $${n(r1, 1)}$ mm. If Murray’s law holds, what is the radius of the other daughter? In mm.`, `半径 $${n(r0, 1)}$ mm の親の血管から半径 $${n(r1, 1)}$ mm の娘の血管が出ています。マレーの法則が成り立つとき、もう一本の娘の半径はいくらですか。mm で答えてください。`],
          a: { type: 'num', v: r2, rel: 0.004, unit: ['mm', 'mm'] },
          hint: ['$r_2^3 = r_0^3 - r_1^3$.', '$r_2^3 = r_0^3 - r_1^3$ です。'],
          sol: [[`$r_2^3 = ${n(r0 ** 3, 3)} - ${n(r1 ** 3, 3)} = ${n(r0 ** 3 - r1 ** 3, 3)}$.`, `$r_2^3 = ${n(r0 ** 3, 3)} - ${n(r1 ** 3, 3)} = ${n(r0 ** 3 - r1 ** 3, 3)}$ です。`], [`$r_2 = ${n(r2, 3)}$ mm.`, `$r_2 = ${n(r2, 3)}$ mm です。`]],
        };
      }
      const s = r.step(0.5, 0.9, 0.05), w = Math.pow(s, 2 / 3);
      return {
        q: [`Every vessel has its Murray radius, and daughter 1 takes a share $s = ${n(s, 2)}$ of the flow. How strongly does it pull on the junction, as a fraction $w_1/w_0$ of the parent’s pull?`, `どの血管もマレーの半径をもち、娘 1 は流量の割合 $s = ${n(s, 2)}$ を受け持ちます。娘 1 が分岐点を引く力は、親の引く力の何倍 $w_1/w_0$ ですか。`],
        a: { type: 'num', v: w, rel: 0.004, show: `${n(s, 2)}^{2/3}` },
        hint: ['An optimal vessel costs $\\frac32 b\\pi r^2$ per metre, and $r \\propto Q^{1/3}$.', '最適な血管の 1 m あたりの費用は $\\frac32 b\\pi r^2$ で、$r \\propto Q^{1/3}$ です。'],
        sol: [[`$w \\propto r^2$ and $r_1/r_0 = s^{1/3}$, so $w_1/w_0 = s^{2/3}$.`, `$w \\propto r^2$ で $r_1/r_0 = s^{1/3}$ なので、$w_1/w_0 = s^{2/3}$ です。`], [`$w_1/w_0 = ${n(s, 2)}^{2/3} = ${n(w, 4)}$. The two daughters together pull harder than the parent, which is why the junction needs an angle to balance them.`, `$w_1/w_0 = ${n(s, 2)}^{2/3} = ${n(w, 4)}$ です。二本の娘を合わせると親より強く引くので、釣り合うには角度が必要です。`]],
        set: { s, k: 3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.step(0.55, 0.9, 0.05), a = murray(1, Math.cbrt(s), Math.cbrt(1 - s));
        return {
          q: [`A vessel splits its flow $${n(s, 2)} : ${n(1 - s, 2)}$ and all three vessels have their Murray radii. At what angles $\\theta_1$, $\\theta_2$ do the daughters leave the parent’s direction? In degrees.`, `血管が流量を $${n(s, 2)} : ${n(1 - s, 2)}$ に分け、三本ともマレーの半径をもちます。娘はそれぞれ親の向きから何度の角 $\\theta_1$、$\\theta_2$ で分かれますか。度で答えてください。`],
          a: { type: 'tuple', v: a, labels: ['$\\theta_1$', '$\\theta_2$'], tol: 0.15 },
          hint: ['Find $r_1/r_0 = s^{1/3}$ and $r_2/r_0 = (1-s)^{1/3}$, then use Murray’s angle formula.', '$r_1/r_0 = s^{1/3}$、$r_2/r_0 = (1-s)^{1/3}$ を求め、マレーの角の式を使います。'],
          sol: [[`$r_1 = ${n(Math.cbrt(s), 4)}\\,r_0$, $r_2 = ${n(Math.cbrt(1 - s), 4)}\\,r_0$.`, `$r_1 = ${n(Math.cbrt(s), 4)}\\,r_0$、$r_2 = ${n(Math.cbrt(1 - s), 4)}\\,r_0$ です。`], [`$\\cos\\theta_1 = (1 + r_1^4 - r_2^4)/(2r_1^2) = ${n(Math.cos(a[0] * DEG), 4)}$ and $\\cos\\theta_2 = (1 + r_2^4 - r_1^4)/(2r_2^2) = ${n(Math.cos(a[1] * DEG), 4)}$.`, `$\\cos\\theta_1 = (1 + r_1^4 - r_2^4)/(2r_1^2) = ${n(Math.cos(a[0] * DEG), 4)}$、$\\cos\\theta_2 = (1 + r_2^4 - r_1^4)/(2r_2^2) = ${n(Math.cos(a[1] * DEG), 4)}$ です。`], [`$\\theta_1 = ${n(a[0], 2)}^\\circ$, $\\theta_2 = ${n(a[1], 2)}^\\circ$: the larger branch bends less.`, `$\\theta_1 = ${n(a[0], 2)}^\\circ$、$\\theta_2 = ${n(a[1], 2)}^\\circ$ で、太い枝ほど曲がりが小さくなります。`]],
          set: { s, k: 3 },
        };
      }
      if (form === 1) {
        const r1 = r.step(2, 4, 0.5), r2 = r.step(1, r1, 0.5), r0 = Math.cbrt(r1 ** 3 + r2 ** 3), a = murray(r0, r1, r2), c1 = Math.cos(a[0] * DEG);
        return {
          q: [`A Murray junction has daughters of radii $r_1 = ${n(r1, 1)}$ and $r_2 = ${n(r2, 1)}$ (so $r_0 = ${n(r0, 3)}$). At what angle $\\theta_1$ does the first daughter leave the parent’s direction? In degrees.`, `マレーの法則に従う分岐点で、娘の半径が $r_1 = ${n(r1, 1)}$、$r_2 = ${n(r2, 1)}$（したがって $r_0 = ${n(r0, 3)}$）です。一本目の娘は親の向きから何度の角 $\\theta_1$ で分かれますか。度で答えてください。`],
          a: { type: 'num', v: a[0], tol: 0.15, unit: ['°', '°'] },
          hint: ['$\\cos\\theta_1 = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$.', '$\\cos\\theta_1 = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$ です。'],
          sol: [[`$r_0^4 = ${n(r0 ** 4, 3)}$, $r_1^4 = ${n(r1 ** 4, 3)}$, $r_2^4 = ${n(r2 ** 4, 3)}$, $2r_0^2r_1^2 = ${n(2 * r0 * r0 * r1 * r1, 3)}$.`, `$r_0^4 = ${n(r0 ** 4, 3)}$、$r_1^4 = ${n(r1 ** 4, 3)}$、$r_2^4 = ${n(r2 ** 4, 3)}$、$2r_0^2r_1^2 = ${n(2 * r0 * r0 * r1 * r1, 3)}$ です。`], [`$\\cos\\theta_1 = ${n(c1, 4)}$, so $\\theta_1 = ${n(a[0], 2)}^\\circ$.`, `$\\cos\\theta_1 = ${n(c1, 4)}$ なので $\\theta_1 = ${n(a[0], 2)}^\\circ$ です。`]],
        };
      }
      const w1 = r.step(0.55, 0.9, 0.05), w2 = r.step(Math.max(0.35, Math.round((1.2 - w1) * 20) / 20), 0.8, 0.05), c = (1 - w1 * w1 - w2 * w2) / (2 * w1 * w2), ph = Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
      return {
        q: [`At a junction the parent pulls with $w_0 = 1$ and the daughters with $w_1 = ${n(w1, 2)}$ and $w_2 = ${n(w2, 2)}$. When the three pulls balance, what is the angle between the two daughters? In degrees.`, `分岐点で親は $w_0 = 1$、娘は $w_1 = ${n(w1, 2)}$ と $w_2 = ${n(w2, 2)}$ の力で引いています。三つの力が釣り合うとき、二本の娘の間の角は何度ですか。度で答えてください。`],
        a: { type: 'num', v: ph, tol: 0.15, unit: ['°', '°'] },
        hint: ['The two daughters’ pulls must add up to a vector of length $w_0$.', '二本の娘の力の和が、長さ $w_0$ のベクトルにならなければなりません。'],
        sol: [[`$|w_1\\hat u_1 + w_2\\hat u_2|^2 = w_1^2 + w_2^2 + 2w_1w_2\\cos\\varphi = w_0^2$.`, `$|w_1\\hat u_1 + w_2\\hat u_2|^2 = w_1^2 + w_2^2 + 2w_1w_2\\cos\\varphi = w_0^2$ です。`], [`$\\cos\\varphi = (1 - ${n(w1 * w1, 4)} - ${n(w2 * w2, 4)})/(2\\cdot${n(w1, 2)}\\cdot${n(w2, 2)}) = ${n(c, 4)}$, so $\\varphi = ${n(ph, 2)}^\\circ$.`, `$\\cos\\varphi = (1 - ${n(w1 * w1, 4)} - ${n(w2 * w2, 4)})/(2\\cdot${n(w1, 2)}\\cdot${n(w2, 2)}) = ${n(c, 4)}$ なので $\\varphi = ${n(ph, 2)}^\\circ$ です。`], ['Stronger daughter pulls force a wider angle, so that more of them cancels sideways.', '娘の力が強いほど、横向きにより多く打ち消し合うよう角は広がります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['At a Murray junction with $r_0 = 1$, write $\\cos\\theta_1$ as a function of the first daughter’s radius $x = r_1/r_0$ alone.', 'マレーの法則に従う分岐点で $r_0 = 1$ とします。$\\cos\\theta_1$ を一本目の娘の半径 $x = r_1/r_0$ だけの関数として書いてください。'],
          a: { type: 'expr', v: '(1+x^4-(1-x^3)^(4/3))/(2*x^2)', vars: ['x'], dom: { x: [0.45, 0.95] }, lhs: ['$\\cos\\theta_1 =$', '$\\cos\\theta_1 =$'] },
          hint: ['Eliminate $r_2$ with the cube law.', '三乗則で $r_2$ を消去します。'],
          sol: [['The cube law gives $r_2^3 = 1 - x^3$, so $r_2^4 = (1 - x^3)^{4/3}$.', '三乗則から $r_2^3 = 1 - x^3$ なので $r_2^4 = (1 - x^3)^{4/3}$ です。'], ['Substituting in $\\cos\\theta_1 = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$ gives $\\cos\\theta_1 = \\bigl(1 + x^4 - (1 - x^3)^{4/3}\\bigr)/(2x^2)$.', '$\\cos\\theta_1 = (r_0^4 + r_1^4 - r_2^4)/(2r_0^2r_1^2)$ に代入すると $\\cos\\theta_1 = \\bigl(1 + x^4 - (1 - x^3)^{4/3}\\bigr)/(2x^2)$ です。'], ['At $x = 2^{-1/3}$ it gives $2^{-1/3}$, the symmetric 37.5°, and as $x \\to 1$ it tends to 1: the trunk runs straight on.', '$x = 2^{-1/3}$ では $2^{-1/3}$ で対称な 37.5° になり、$x \\to 1$ では 1 に近づき、幹はまっすぐ続きます。']],
        };
      }
      if (form === 1) {
        return {
          q: ['In a Murray junction the side branch gets smaller and smaller ($r_2 \\to 0$). What angle does it approach?', 'マレーの法則に従う分岐点で、側枝がどんどん細くなる（$r_2 \\to 0$）とします。その分岐角はどこに近づきますか。'],
          a: { type: 'choice', opts: [['$90^\\circ$: its pull is tiny, so it points along what is left over once the parent and the trunk nearly cancel', '$90^\\circ$ です。引く力がとても小さいので、親と幹がほぼ打ち消し合った残りの向きを向きます'], ['$0^\\circ$: a thin branch follows the trunk', '$0^\\circ$ です。細い枝は幹に沿います'], ['$37.5^\\circ$: Murray’s angle does not depend on size', '$37.5^\\circ$ です。マレーの角は太さによりません'], ['$180^\\circ$: it turns back against the flow', '$180^\\circ$ です。流れに逆らって折り返します']], v: 0 },
          hint: ['Expand $\\cos\\theta_2$ for small $r_2$ using $r_1^3 = r_0^3 - r_2^3$.', '$r_1^3 = r_0^3 - r_2^3$ を使って、小さな $r_2$ について $\\cos\\theta_2$ を展開します。'],
          sol: [['With $r_0 = 1$, $r_1^4 = (1 - r_2^3)^{4/3} \\approx 1 - \\frac43 r_2^3$.', '$r_0 = 1$ とすると $r_1^4 = (1 - r_2^3)^{4/3} \\approx 1 - \\frac43 r_2^3$ です。'], ['Then $\\cos\\theta_2 = (1 + r_2^4 - r_1^4)/(2r_2^2) \\approx (\\frac43 r_2^3)/(2r_2^2) = \\frac23 r_2 \\to 0$.', 'すると $\\cos\\theta_2 = (1 + r_2^4 - r_1^4)/(2r_2^2) \\approx (\\frac43 r_2^3)/(2r_2^2) = \\frac23 r_2 \\to 0$ です。'], ['So $\\theta_2 \\to 90^\\circ$: small side branches leave almost perpendicular to the trunk, as seen in many arterial trees.', 'したがって $\\theta_2 \\to 90^\\circ$ です。多くの動脈の木で見られるように、細い側枝は幹からほぼ垂直に出ていきます。']],
          set: { s: 0.9, k: 3 },
        };
      }
      const s = r.step(0.55, 0.9, 0.05), a = murray(1, Math.cbrt(s), Math.cbrt(1 - s)), w1 = Math.sin(a[1] * DEG) / Math.sin((a[0] + a[1]) * DEG), x = Math.sqrt(w1);
      return {
        q: [`At an optimal junction of Murray vessels the daughters leave the parent’s direction at $\\theta_1 = ${n(a[0], 2)}^\\circ$ and $\\theta_2 = ${n(a[1], 2)}^\\circ$. What is $r_1/r_0$?`, `マレーの血管からなる最適な分岐点で、娘は親の向きから $\\theta_1 = ${n(a[0], 2)}^\\circ$、$\\theta_2 = ${n(a[1], 2)}^\\circ$ で分かれています。$r_1/r_0$ はいくらですか。`],
        a: { type: 'num', v: x, tol: 0.003 },
        hint: ['Balance the pulls across and along the parent, then use $w \\propto r^2$.', '親の向きとそれに垂直な向きで力の釣り合いをとり、$w \\propto r^2$ を使います。'],
        sol: [['Across the parent: $w_1\\sin\\theta_1 = w_2\\sin\\theta_2$; along it: $w_1\\cos\\theta_1 + w_2\\cos\\theta_2 = w_0$. Together $w_1/w_0 = \\sin\\theta_2/\\sin(\\theta_1 + \\theta_2)$.', '親に垂直な向きで $w_1\\sin\\theta_1 = w_2\\sin\\theta_2$、親の向きで $w_1\\cos\\theta_1 + w_2\\cos\\theta_2 = w_0$ です。合わせると $w_1/w_0 = \\sin\\theta_2/\\sin(\\theta_1 + \\theta_2)$ です。'], [`$w_1/w_0 = \\sin ${n(a[1], 2)}^\\circ/\\sin ${n(a[0] + a[1], 2)}^\\circ = ${n(w1, 4)}$.`, `$w_1/w_0 = \\sin ${n(a[1], 2)}^\\circ/\\sin ${n(a[0] + a[1], 2)}^\\circ = ${n(w1, 4)}$ です。`], [`Murray vessels pull in proportion to $r^2$, so $r_1/r_0 = \\sqrt{${n(w1, 4)}} = ${n(x, 4)}$, which carries a share $(r_1/r_0)^3 = ${n(x ** 3, 3)}$ of the flow.`, `マレーの血管は $r^2$ に比例して引くので、$r_1/r_0 = \\sqrt{${n(w1, 4)}} = ${n(x, 4)}$ で、流量の割合 $(r_1/r_0)^3 = ${n(x ** 3, 3)}$ を受け持ちます。`]],
        set: { s, k: 3 },
      };
    },
  ];

  /* ---------------- murray-tree ---------------- */
  Q['murray-tree'] = [
    (r) => {
      const form = r.int(0, 2), g = r.int(2, 9);
      if (form === 0) {
        const x = 2 ** (-g / 3);
        return {
          q: [`In a symmetric cube-law tree, what is the radius of a generation-$${g}$ vessel as a fraction of the root’s?`, `対称な三乗則の木で、第 $${g}$ 世代の血管の半径は根もとの何倍ですか。`],
          a: { type: 'num', v: x, rel: 0.004, show: `2^{-${g}/3}` },
          hint: ['Each symmetric split multiplies the radius by $2^{-1/3}$.', '対称な分岐のたびに半径は $2^{-1/3}$ 倍になります。'],
          sol: [[`$r_g/r_0 = (2^{-1/3})^{${g}} = 2^{-${g}/3}$.`, `$r_g/r_0 = (2^{-1/3})^{${g}} = 2^{-${g}/3}$ です。`], [`$= ${n(x, 4)}$: after $${g}$ halvings of the flow the radius has shrunk far less than the flow.`, `$= ${n(x, 4)}$ です。流量が $${g}$ 回半分になっても、半径は流量ほどには縮みません。`]],
          set: { gen: g, s: 0.5, k: 3 },
        };
      }
      if (form === 1) {
        return {
          q: [`How many vessels are there in generation $${g}$ of a binary tree (the root is generation 0)?`, `二分木の第 $${g}$ 世代には何本の血管がありますか（根もとを第 0 世代とします）。`],
          a: { type: 'int', v: 2 ** g },
          hint: ['Each vessel splits into two.', 'どの血管も二本に分かれます。'],
          sol: [[`Each generation doubles the count: $N_g = 2^{${g}} = ${2 ** g}$.`, `世代ごとに数は 2 倍になり、$N_g = 2^{${g}} = ${2 ** g}$ です。`], [`The whole tree down to generation $${g}$ has $2^{${g + 1}} - 1 = ${2 ** (g + 1) - 1}$ vessels.`, `第 $${g}$ 世代までの木全体には $2^{${g + 1}} - 1 = ${2 ** (g + 1) - 1}$ 本の血管があります。`]],
          set: { gen: g },
        };
      }
      const x = 2 ** (g / 3);
      return {
        q: [`In a symmetric cube-law tree, what is the total cross-sectional area of generation $${g}$ as a multiple of the root’s?`, `対称な三乗則の木で、第 $${g}$ 世代の全断面積は根もとの何倍ですか。`],
        a: { type: 'num', v: x, rel: 0.004, show: `2^{${g}/3}` },
        hint: ['There are $2^g$ vessels, each with area $\\pi r_g^2$.', '面積 $\\pi r_g^2$ の血管が $2^g$ 本あります。'],
        sol: [[`$N_g r_g^2/r_0^2 = 2^{${g}}\\cdot 2^{-2\\cdot${g}/3} = 2^{${g}/3}$.`, `$N_g r_g^2/r_0^2 = 2^{${g}}\\cdot 2^{-2\\cdot${g}/3} = 2^{${g}/3}$ です。`], [`$= ${n(x, 4)}$, so the mean speed has fallen to $1/${n(x, 4)}$ of the root’s.`, `$= ${n(x, 4)}$ なので、平均速度は根もとの $1/${n(x, 4)}$ に下がっています。`]],
        set: { gen: g, s: 0.5, k: 3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 2.5, 3.5, 4]), g = r.int(2, 9), t = Math.pow(0.5, g * (1 - 3 / k));
        return {
          q: [`A symmetric tree uses the rule $r \\propto Q^{1/${k}}$. What is the wall shear stress in generation $${g}$, as a multiple of the root’s?`, `対称な木が規則 $r \\propto Q^{1/${k}}$ に従っています。第 $${g}$ 世代の壁ずり応力は根もとの何倍ですか。`],
          a: { type: 'num', v: t, rel: 0.005 },
          hint: ['$\\tau \\propto Q/r^3 \\propto Q^{1 - 3/k}$, and $Q_g = 2^{-g}Q_0$.', '$\\tau \\propto Q/r^3 \\propto Q^{1 - 3/k}$ で、$Q_g = 2^{-g}Q_0$ です。'],
          sol: [[`$\\tau_g/\\tau_0 = (Q_g/Q_0)^{1 - 3/k} = 2^{-${g}(1 - 3/${k})} = 2^{${n(-g * (1 - 3 / k), 4)}}$.`, `$\\tau_g/\\tau_0 = (Q_g/Q_0)^{1 - 3/k} = 2^{-${g}(1 - 3/${k})} = 2^{${n(-g * (1 - 3 / k), 4)}}$ です。`], [`$= ${n(t, 4)}$: ${k < 3 ? 'the shear stress climbs towards the small vessels' : 'the shear stress falls towards the small vessels'}; only $k = 3$ keeps it constant.`, `$= ${n(t, 4)}$ です。${k < 3 ? '細い血管に向かってずり応力が上がります' : '細い血管に向かってずり応力が下がります'}。一定に保つのは $k = 3$ だけです。`]],
          set: { k, gen: g, s: 0.5, show: 0 },
        };
      }
      if (form === 1) {
        const r0 = r.pick([5, 10, 12.5, 15]), rcu = r.pick([3, 4, 5, 8, 10]), g = 3 * Math.log2(r0 / (rcu * 1e-3));
        return {
          q: [`How many symmetric cube-law generations take a vessel of radius $${n(r0, 1)}$ mm down to capillaries of radius $${rcu}$ µm?`, `半径 $${n(r0, 1)}$ mm の血管から半径 $${rcu}$ µm の毛細血管まで、対称な三乗則で何世代かかりますか。`],
          a: { type: 'num', v: g, tol: 0.06 },
          hint: ['$r_g = r_0\\,2^{-g/3}$; solve for $g$.', '$r_g = r_0\\,2^{-g/3}$ を $g$ について解きます。'],
          sol: [[`$2^{-g/3} = r_c/r_0 = ${sig(rcu * 1e-3 / r0, 3)}$, so $g = 3\\log_2(r_0/r_c)$.`, `$2^{-g/3} = r_c/r_0 = ${sig(rcu * 1e-3 / r0, 3)}$ なので $g = 3\\log_2(r_0/r_c)$ です。`], [`$g = 3\\log_2 ${n(r0 / (rcu * 1e-3), 1)} = ${n(g, 2)}$, giving $2^{${n(g, 1)}} \\approx ${sig(2 ** g, 2)}$ capillaries.`, `$g = 3\\log_2 ${n(r0 / (rcu * 1e-3), 1)} = ${n(g, 2)}$ で、毛細血管はおよそ $2^{${n(g, 1)}} \\approx ${sig(2 ** g, 2)}$ 本です。`]],
        };
      }
      const s = r.step(0.55, 0.8, 0.05), g = r.int(2, 9), u = Math.pow(s, g / 3);
      return {
        q: [`In a cube-law tree every vessel splits its flow $${n(s, 2)} : ${n(1 - s, 2)}$. Following the larger branch each time, what is the mean speed in generation $${g}$ as a fraction of the root’s?`, `三乗則の木で、どの血管も流量を $${n(s, 2)} : ${n(1 - s, 2)}$ に分けます。毎回太いほうの枝をたどるとき、第 $${g}$ 世代の平均速度は根もとの何倍ですか。`],
        a: { type: 'num', v: u, rel: 0.005 },
        hint: ['Under the cube law the mean speed is proportional to $r$, and $r \\propto Q^{1/3}$.', '三乗則のもとで平均速度は $r$ に比例し、$r \\propto Q^{1/3}$ です。'],
        sol: [[`$\\bar u = Q/(\\pi r^2) \\propto Q^{1/3}$, and along this path $Q_g = ${n(s, 2)}^{${g}}Q_0$.`, `$\\bar u = Q/(\\pi r^2) \\propto Q^{1/3}$ で、この経路では $Q_g = ${n(s, 2)}^{${g}}Q_0$ です。`], [`$\\bar u_g/\\bar u_0 = ${n(s, 2)}^{${g}/3} = ${n(u, 4)}$.`, `$\\bar u_g/\\bar u_0 = ${n(s, 2)}^{${g}/3} = ${n(u, 4)}$ です。`]],
        set: { s, gen: g, k: 3, show: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [k, e] = r.pick([[2, '1/2'], [4, '-1/4'], [2.5, '1/5'], [3.75, '-1/5']]);
        return {
          q: [`A symmetric tree follows $r \\propto Q^{1/${k}}$. Write the wall shear stress ratio $\\tau_g/\\tau_0$ as a function of the generation $g$.`, `対称な木が $r \\propto Q^{1/${k}}$ に従っています。壁ずり応力の比 $\\tau_g/\\tau_0$ を世代 $g$ の関数として書いてください。`],
          a: { type: 'expr', v: `2^(g*(${e}))`, vars: ['g'], dom: { g: [0.5, 6] }, lhs: ['$\\tau_g/\\tau_0 =$', '$\\tau_g/\\tau_0 =$'] },
          hint: ['$\\tau \\propto Q^{1 - 3/k}$ and $Q_g/Q_0 = 2^{-g}$.', '$\\tau \\propto Q^{1 - 3/k}$ で、$Q_g/Q_0 = 2^{-g}$ です。'],
          sol: [[`$\\tau_g/\\tau_0 = (2^{-g})^{1 - 3/${k}} = 2^{g(3/${k} - 1)}$.`, `$\\tau_g/\\tau_0 = (2^{-g})^{1 - 3/${k}} = 2^{g(3/${k} - 1)}$ です。`], [`$3/${k} - 1 = ${e}$, so $\\tau_g/\\tau_0 = 2^{(${e})g}$, which ${k < 3 ? 'grows' : 'decays'} geometrically; the cube law is the only exponent with no drift.`, `$3/${k} - 1 = ${e}$ なので $\\tau_g/\\tau_0 = 2^{(${e})g}$ で、等比数列的に${k < 3 ? '増えます' : '減ります'}。ずれが生じない指数は三乗則だけです。`]],
          set: { k, s: 0.5, show: 0 },
        };
      }
      if (form === 1) {
        const k = r.pick([2.25, 2.5, 3.5, 4]), g = r.int(4, 9), t = Math.pow(0.5, g * (1 - 3 / k));
        return {
          q: [`In a symmetric tree the wall shear stress in generation $${g}$ is measured at $${n(t, 4)}$ times the root’s. Assuming $r \\propto Q^{1/k}$, find $k$.`, `対称な木で、第 $${g}$ 世代の壁ずり応力が根もとの $${n(t, 4)}$ 倍と測られました。$r \\propto Q^{1/k}$ として $k$ を求めてください。`],
          a: { type: 'num', v: k, tol: 0.01 },
          hint: ['Take $\\log_2$ of $\\tau_g/\\tau_0 = 2^{g(3/k - 1)}$.', '$\\tau_g/\\tau_0 = 2^{g(3/k - 1)}$ の $\\log_2$ をとります。'],
          sol: [[`$\\log_2 ${n(t, 4)} = ${n(Math.log2(t), 4)} = ${g}(3/k - 1)$, so $3/k - 1 = ${n(Math.log2(t) / g, 4)}$.`, `$\\log_2 ${n(t, 4)} = ${n(Math.log2(t), 4)} = ${g}(3/k - 1)$ なので $3/k - 1 = ${n(Math.log2(t) / g, 4)}$ です。`], [`$k = 3/${n(1 + Math.log2(t) / g, 4)} = ${n(k, 3)}$: ${t > 1 ? 'the shear stress rising downstream means the small vessels are too narrow' : 'the shear stress falling downstream means the small vessels are too wide'}.`, `$k = 3/${n(1 + Math.log2(t) / g, 4)} = ${n(k, 3)}$ です。${t > 1 ? '下流でずり応力が上がるのは、細い血管が細すぎるからです' : '下流でずり応力が下がるのは、細い血管が太すぎるからです'}。`]],
          set: { k, gen: g, s: 0.5, show: 0 },
        };
      }
      return {
        q: ['Which radius rule $r \\propto Q^{1/k}$ keeps the mean blood speed the same in every generation of a tree?', '木のどの世代でも平均速度を同じに保つ半径の規則 $r \\propto Q^{1/k}$ はどれですか。'],
        a: { type: 'choice', opts: [['$k = 2$: area-preserving branching, since $\\bar u = Q/(\\pi r^2)$', '$k = 2$、断面積を保つ分岐です。$\\bar u = Q/(\\pi r^2)$ だからです'], ['$k = 3$: Murray’s law keeps everything constant', '$k = 3$、マレーの法則はすべてを一定に保ちます'], ['$k = 4$: speed goes as $r^4$ in Poiseuille flow', '$k = 4$、ポアズイユ流では速度は $r^4$ に比例します'], ['$k = 1$: speed is proportional to radius', '$k = 1$、速度は半径に比例します']], v: 0 },
        hint: ['Mean speed is flow divided by area.', '平均速度は流量を面積で割ったものです。'],
        sol: [['$\\bar u = Q/(\\pi r^2) \\propto Q^{1 - 2/k}$, which is constant only for $k = 2$.', '$\\bar u = Q/(\\pi r^2) \\propto Q^{1 - 2/k}$ で、これが一定になるのは $k = 2$ のときだけです。'], ['Murray’s $k = 3$ keeps the shear stress constant instead and lets the speed fall as $r$; area preservation costs about 30% more in a tree like the one in the figure.', 'マレーの $k = 3$ は代わりにずり応力を一定に保ち、速度は $r$ に比例して下がります。断面積を保つ分岐は、図のような木では約 30% 余分に費用がかかります。']],
        set: { k: 2, s: 0.5, show: 1 },
      };
    },
  ];
})();
