'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const V = ['V', 'V（ボルト）'], W = ['W', 'W（ワット）'], MIN = ['min', '分'], AH = ['Ah', 'Ah（アンペア時）'], MO = ['mΩ', 'mΩ（ミリオーム）'], MMU = ['mm', 'mm（ミリメートル）'];

  Q['liion-discharge'] = [
    (r) => {
      const cap = r.pick([2.0, 2.5, 3.0, 3.5, 4.0, 5.0]), c = r.pick([0.2, 0.5, 1, 2, 3, 5]), form = r.int(0, 1);
      if (form === 0) return {
        q: [`A $${n(cap, 1)}$ Ah cell is discharged at a rate of $${n(c, 1)}$C. What is the current, in amperes?`, `$${n(cap, 1)}$ Ah のセルを $${n(c, 1)}$C の放電率で放電します。電流は何アンペアですか。`],
        a: { type: 'num', v: cap * c, rel: 0.01, unit: ['A', 'A（アンペア）'] }, hint: ['1C is the current that would empty the cell in one hour.', '1C は、セルを 1 時間で空にする電流です。'],
        sol: [[`1C for this cell is $${n(cap, 1)}$ A.`, `このセルの 1C は $${n(cap, 1)}$ A です。`], [`$${n(c, 1)}\\times${n(cap, 1)} = ${n(cap * c, 2)}$ A, which would last about $${n(60 / c, 0)}$ minutes.`, `$${n(c, 1)}\\times${n(cap, 1)} = ${n(cap * c, 2)}$ A で、約 $${n(60 / c, 0)}$ 分もちます。`]], set: { cr: c },
      };
      const v = r.pick([3.6, 3.65, 3.7]);
      return {
        q: [`A cell holds $${n(cap, 1)}$ Ah at an average of $${n(v, 2)}$ V. How much energy is that, in watt-hours?`, `あるセルは、平均 $${n(v, 2)}$ V で $${n(cap, 1)}$ Ah を蓄えます。エネルギーは何ワット時ですか。`],
        a: { type: 'num', v: cap * v, rel: 0.01, unit: ['Wh', 'Wh（ワット時）'] }, hint: ['Energy is charge times voltage.', 'エネルギーは電荷掛ける電圧です。'],
        sol: [[`$${n(cap, 1)}\\ \\mathrm{Ah}\\times${n(v, 2)}\\ \\mathrm{V}$.`, `$${n(cap, 1)}\\ \\mathrm{Ah}\\times${n(v, 2)}\\ \\mathrm{V}$ を計算します。`], [`$${n(cap * v, 2)}$ Wh, or $${n(cap * v * 3.6, 1)}$ kJ.`, `$${n(cap * v, 2)}$ Wh、すなわち $${n(cap * v * 3.6, 1)}$ kJ です。`]],
      };
    },
    (r) => {
      const R = r.step(15, 80, 5), I = r.step(1, 15, 1), ocv = r.step(3.5, 4.1, 0.05), form = r.int(0, 1);
      return form === 0 ? {
        q: [`A cell has an open-circuit voltage of $${n(ocv, 2)}$ V and an internal resistance of $${R}$ mΩ. What is its terminal voltage while delivering $${I}$ A?`, `あるセルの開回路電圧は $${n(ocv, 2)}$ V、内部抵抗は $${R}$ mΩ です。$${I}$ A を流しているときの端子電圧は何ボルトですか。`],
        a: { type: 'num', v: ocv - (I * R) / 1000, abs: 0.006, unit: V }, hint: ['$V = V_{\\rm oc} - IR$.', '$V = V_{\\rm oc} - IR$ です。'],
        sol: [[`Drop: $${I}\\times${n(R / 1000, 3)} = ${n((I * R) / 1000, 3)}$ V.`, `電圧降下は $${I}\\times${n(R / 1000, 3)} = ${n((I * R) / 1000, 3)}$ V です。`], [`$V = ${n(ocv, 2)} - ${n((I * R) / 1000, 3)} = ${n(ocv - (I * R) / 1000, 3)}$ V.`, `$V = ${n(ocv, 2)} - ${n((I * R) / 1000, 3)} = ${n(ocv - (I * R) / 1000, 3)}$ V です。`]],
      } : {
        q: [`A cell with an internal resistance of $${R}$ mΩ delivers $${I}$ A. How much heat is produced inside it, in watts?`, `内部抵抗 $${R}$ mΩ のセルが $${I}$ A を流しています。セルの中で発生する熱は何ワットですか。`],
        a: { type: 'num', v: (I * I * R) / 1000, rel: 0.01, unit: W }, hint: ['$P = I^2R$.', '$P = I^2R$ です。'],
        sol: [[`$${I}^2\\times${n(R / 1000, 3)}$.`, `$${I}^2\\times${n(R / 1000, 3)}$ を計算します。`], [`$${n((I * I * R) / 1000, 2)}$ W. Doubling the current quadruples it.`, `$${n((I * I * R) / 1000, 2)}$ W です。電流を 2 倍にすると 4 倍になります。`]],
      };
    },
    (r) => {
      const Tc = r.pick([-20, -10, -5, 0, 5, 10, 40, 45]), Ea = r.pick([15, 20, 25, 30]), R25 = r.pick([20, 30, 35, 50]), R = R25 * Math.exp(((Ea * 1000) / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15));
      return {
        q: [`A cell's resistance is $${R25}$ mΩ at $25$ °C and follows $R = R_{25}\\exp[(E_a/R_g)(1/T - 1/298.15)]$ with $E_a = ${Ea}$ kJ/mol and $R_g = 8.314$ J/(mol K). What is it at $${Tc}$ °C?`, `あるセルの抵抗は $25$ °C で $${R25}$ mΩ で、$R = R_{25}\\exp[(E_a/R_g)(1/T - 1/298.15)]$ に従います。$E_a = ${Ea}$ kJ/mol、$R_g = 8.314$ J/(mol K) です。$${Tc}$ °C での抵抗は何 mΩ ですか。`],
        a: { type: 'num', v: R, rel: 0.02, unit: MO }, hint: ['Use kelvin: $T = t + 273.15$.', 'ケルビンを使います。$T = t + 273.15$ です。'],
        sol: [[`$T = ${n(Tc + 273.15, 2)}$ K, so $1/T - 1/298.15 = ${n((1 / (Tc + 273.15) - 1 / 298.15) * 1e4, 3)}\\times10^{-4}$ K$^{-1}$ and the exponent is $${n(((Ea * 1000) / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15), 3)}$.`, `$T = ${n(Tc + 273.15, 2)}$ K なので、$1/T - 1/298.15 = ${n((1 / (Tc + 273.15) - 1 / 298.15) * 1e4, 3)}\\times10^{-4}$ K$^{-1}$、指数は $${n(((Ea * 1000) / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15), 3)}$ です。`], [`$R = ${R25}\\times e^{${n(((Ea * 1000) / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15), 3)}} = ${n(R, 1)}$ mΩ.`, `$R = ${R25}\\times e^{${n(((Ea * 1000) / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15), 3)}} = ${n(R, 1)}$ mΩ です。`]], set: { T: Math.max(-10, Tc) },
      };
    },
  ];

  Q['cc-cv-charging'] = [
    (r) => {
      const cap = r.pick([2.0, 2.5, 3.0, 4.0, 5.0]), c = r.pick([0.5, 1, 1.5, 2, 3]), a = r.pick([10, 20, 30]), b = r.pick([60, 70, 80]);
      return {
        q: [`A $${n(cap, 1)}$ Ah cell is charged at a constant $${n(c, 1)}$C. How many minutes does it take to go from $${a}$ % to $${b}$ %?`, `$${n(cap, 1)}$ Ah のセルを一定の $${n(c, 1)}$C で充電します。$${a}$ % から $${b}$ % まで何分かかりますか。`],
        a: { type: 'num', v: (60 * (b - a)) / 100 / c, rel: 0.01, unit: MIN }, hint: ['At 1C, one per cent takes 0.6 minutes.', '1C では、1 % に 0.6 分かかります。'],
        sol: [[`The current is $${n(cap * c, 2)}$ A and the charge needed is $${n((cap * (b - a)) / 100, 2)}$ Ah.`, `電流は $${n(cap * c, 2)}$ A、必要な電荷は $${n((cap * (b - a)) / 100, 2)}$ Ah です。`], [`$${n((cap * (b - a)) / 100, 2)}/${n(cap * c, 2)}$ h $= ${n((60 * (b - a)) / 100 / c, 1)}$ min. The capacity cancels: only the C-rate matters.`, `$${n((cap * (b - a)) / 100, 2)}/${n(cap * c, 2)}$ h $= ${n((60 * (b - a)) / 100 / c, 1)}$ 分です。容量は打ち消し合い、C レートだけで決まります。`]], set: { c },
      };
    },
    (r) => {
      const R = r.step(20, 70, 5), I = r.step(1, 9, 0.5), v = 4.2 - (I * R) / 1000;
      return {
        q: [`A charger limited to $4.20$ V pushes $${n(I, 1)}$ A into a cell whose internal resistance is $${R}$ mΩ. At what open-circuit voltage of the cell does the charger have to start reducing the current?`, `上限が $4.20$ V の充電器が、内部抵抗 $${R}$ mΩ のセルに $${n(I, 1)}$ A を流しています。セルの開回路電圧がいくつになったとき、充電器は電流を減らし始めなければなりませんか。`],
        a: { type: 'num', v, abs: 0.006, unit: V }, hint: ['The terminal voltage is $V_{\\rm oc} + IR$.', '端子電圧は $V_{\\rm oc} + IR$ です。'],
        sol: [[`$IR = ${n(I, 1)}\\times${n(R / 1000, 3)} = ${n((I * R) / 1000, 3)}$ V.`, `$IR = ${n(I, 1)}\\times${n(R / 1000, 3)} = ${n((I * R) / 1000, 3)}$ V です。`], [`$V_{\\rm oc} = 4.20 - ${n((I * R) / 1000, 3)} = ${n(v, 3)}$ V: the larger the current, the emptier the cell still is when the taper begins.`, `$V_{\\rm oc} = 4.20 - ${n((I * R) / 1000, 3)} = ${n(v, 3)}$ V です。電流が大きいほど、電流が減り始める時点でのセルの残りの空きは大きくなります。`]], set: { c: Math.min(3, Math.round((I / 3) * 20) / 20) },
      };
    },
    (r) => {
      const R = r.step(25, 60, 5), k = r.pick([0.4, 0.5, 0.6, 0.7, 0.8]), cap = r.pick([2.5, 3.0, 4.0, 5.0]), I0 = r.step(2, 8, 1), tau = ((R / 1000) * cap) / k, t = tau * Math.log(I0 / (cap / 20)) * 60;
      return {
        q: [`In the constant-voltage stage, suppose the cell's open-circuit voltage rises by $${n(k, 1)}$ V for each unit of state of charge, the capacity is $${n(cap, 1)}$ Ah and the resistance $${R}$ mΩ. The current then decays as $I_0e^{-t/\\tau}$ with $\\tau = RQ/k$. Starting from $${I0}$ A, how many minutes until it falls to $Q/20$ per hour?`, `定電圧の段階で、セルの開回路電圧が充電状態 1 あたり $${n(k, 1)}$ V 上がり、容量が $${n(cap, 1)}$ Ah、抵抗が $${R}$ mΩ だとします。このとき電流は $I_0e^{-t/\\tau}$、$\\tau = RQ/k$ で減衰します。$${I0}$ A から始めて、$Q/20$ 毎時まで下がるのに何分かかりますか。`],
        a: { type: 'num', v: t, rel: 0.03, unit: MIN }, hint: ['Find $\\tau$ in hours, then $t = \\tau\\ln(I_0/I_{\\rm end})$.', '$\\tau$ を時間の単位で求め、$t = \\tau\\ln(I_0/I_{\\rm end})$ を使います。'],
        sol: [[`$\\tau = ${n(R / 1000, 3)}\\times${n(cap, 1)}/${n(k, 1)} = ${n(tau, 4)}$ h $= ${n(tau * 60, 1)}$ min, and $I_{\\rm end} = ${n(cap / 20, 3)}$ A.`, `$\\tau = ${n(R / 1000, 3)}\\times${n(cap, 1)}/${n(k, 1)} = ${n(tau, 4)}$ h $= ${n(tau * 60, 1)}$ 分、$I_{\\rm end} = ${n(cap / 20, 3)}$ A です。`], [`$t = ${n(tau * 60, 1)}\\times\\ln(${I0}/${n(cap / 20, 3)}) = ${n(t, 1)}$ min. A cell with more resistance tapers more slowly.`, `$t = ${n(tau * 60, 1)}\\times\\ln(${I0}/${n(cap / 20, 3)}) = ${n(t, 1)}$ 分です。抵抗の大きいセルほど、電流の減衰はゆっくりです。`]],
      };
    },
  ];

  Q['cell-jelly-roll'] = [
    (r) => {
      const tc = r.step(40, 110, 10), ta = Math.round(1.1 * tc), p = 2 * tc + 15 + 2 * ta + 10 + 32;
      return {
        q: [`One turn of a jelly roll contains an aluminium foil ($15$ µm) coated on both sides with $${tc}$ µm of cathode, a copper foil ($10$ µm) coated on both sides with $${ta}$ µm of graphite, and two separators of $16$ µm. How thick is one turn, in millimetres?`, `巻回体の 1 周分は、両面に $${tc}$ µm の正極材を塗ったアルミニウム箔（$15$ µm）、両面に $${ta}$ µm の黒鉛を塗った銅箔（$10$ µm）、$16$ µm のセパレーター 2 枚からなります。1 周分の厚さは何ミリメートルですか。`],
        a: { type: 'num', v: p / 1000, rel: 0.005, unit: MMU }, hint: ['Each coating appears twice, and so does the separator.', '塗布はそれぞれ 2 回、セパレーターも 2 回現れます。'],
        sol: [[`$2\\times${tc} + 15 + 2\\times${ta} + 10 + 2\\times16 = ${p}$ µm.`, `$2\\times${tc} + 15 + 2\\times${ta} + 10 + 2\\times16 = ${p}$ µm です。`], [`That is $${n(p / 1000, 3)}$ mm, of which only $${2 * tc + 2 * ta}$ µm stores energy.`, `これは $${n(p / 1000, 3)}$ mm で、そのうちエネルギーを蓄えるのは $${2 * tc + 2 * ta}$ µm だけです。`]], set: { tc },
      };
    },
    (r) => {
      const p = r.step(0.2, 0.55, 0.01), ro = r.pick([8.6, 10.0, 12.5, 22.0]), ri = r.pick([1.5, 2.0, 2.5]), len = (Math.PI * (ro * ro - ri * ri)) / p;
      return {
        q: [`A strip $${n(p, 2)}$ mm thick is wound into a spiral from an inner radius of $${n(ri, 1)}$ mm to an outer radius of $${n(ro, 1)}$ mm. How long is the strip, in millimetres?`, `厚さ $${n(p, 2)}$ mm の帯を、内側の半径 $${n(ri, 1)}$ mm から外側の半径 $${n(ro, 1)}$ mm まで渦巻き状に巻きます。帯の長さは何ミリメートルですか。`],
        a: { type: 'num', v: len, rel: 0.01, unit: MMU }, hint: ['The strip, seen end on, fills the ring: length times thickness equals the ring’s area.', '帯を端から見ると輪を埋めています。長さ掛ける厚さが、輪の面積に等しくなります。'],
        sol: [[`Area of the ring: $\\pi(${n(ro, 1)}^2 - ${n(ri, 1)}^2) = ${n(Math.PI * (ro * ro - ri * ri), 1)}$ mm².`, `輪の面積は $\\pi(${n(ro, 1)}^2 - ${n(ri, 1)}^2) = ${n(Math.PI * (ro * ro - ri * ri), 1)}$ mm² です。`], [`$\\ell = ${n(Math.PI * (ro * ro - ri * ri), 1)}/${n(p, 2)} = ${n(len, 0)}$ mm, in $${n((ro - ri) / p, 1)}$ turns.`, `$\\ell = ${n(Math.PI * (ro * ro - ri * ri), 1)}/${n(p, 2)} = ${n(len, 0)}$ mm で、$${n((ro - ri) / p, 1)}$ 周です。`]],
      };
    },
    (r) => {
      const tc = r.step(40, 110, 10), len = r.step(400, 1000, 50), w = r.pick([58, 60, 65]), cv = r.pick([550, 587, 620]), cap = (2 * (len / 10) * (w / 10) * tc * 1e-4 * cv) / 1000;
      return {
        q: [`A cathode strip $${len}$ mm long and $${w}$ mm wide is coated on both sides to a thickness of $${tc}$ µm with a material that stores $${cv}$ mAh per cubic centimetre of coating. What is the capacity of the cell, in ampere-hours?`, `長さ $${len}$ mm、幅 $${w}$ mm の正極の帯の両面に、塗布層 1 立方センチメートルあたり $${cv}$ mAh を蓄える材料を $${tc}$ µm の厚さで塗ります。セルの容量は何アンペア時ですか。`],
        a: { type: 'num', v: cap, rel: 0.02, unit: AH }, hint: ['Work in centimetres: volume of coating $= 2\\,\\ell\\,w\\,t$.', 'センチメートルで計算します。塗布層の体積は $2\\,\\ell\\,w\\,t$ です。'],
        sol: [[`Coated area: $2\\times${n(len / 10, 1)}\\times${n(w / 10, 1)} = ${n(2 * (len / 10) * (w / 10), 0)}$ cm²; volume: $\\times\\,${n(tc * 1e-4, 4)}$ cm $= ${n(2 * (len / 10) * (w / 10) * tc * 1e-4, 2)}$ cm³.`, `塗布面積は $2\\times${n(len / 10, 1)}\\times${n(w / 10, 1)} = ${n(2 * (len / 10) * (w / 10), 0)}$ cm²、体積はこれに $${n(tc * 1e-4, 4)}$ cm を掛けて $${n(2 * (len / 10) * (w / 10) * tc * 1e-4, 2)}$ cm³ です。`], [`$${n(2 * (len / 10) * (w / 10) * tc * 1e-4, 2)}\\times${cv} = ${n(cap * 1000, 0)}$ mAh $= ${n(cap, 2)}$ Ah.`, `$${n(2 * (len / 10) * (w / 10) * tc * 1e-4, 2)}\\times${cv} = ${n(cap * 1000, 0)}$ mAh $= ${n(cap, 2)}$ Ah です。`]], set: { tc },
      };
    },
  ];
})();
