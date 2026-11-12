'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const MMU = ['mm', 'mm（ミリメートル）'], PF = ['pF', 'pF（ピコファラド）'], FF = ['fF', 'fF（フェムトファラド）'], MS = ['ms', 'ms（ミリ秒）'];

  Q['touch-centroid'] = [
    (r) => {
      const x0 = r.int(2, 5) * 5 + 2.5, a = r.int(2, 9) / 10, b = r.int(2, 9) / 10, c = r.pick([1.0, 1.2, 1.5]) * Math.max(a, b), est = (a * (x0 - 5) + c * x0 + b * (x0 + 5)) / (a + b + c);
      return {
        q: [`Three neighbouring nodes at $x = ${n(x0 - 5, 1)}$, $${n(x0, 1)}$ and $${n(x0 + 5, 1)}$ mm read $${n(a, 1)}$, $${n(c, 2)}$ and $${n(b, 1)}$ (arbitrary units). Where does the centroid place the touch, in millimetres?`, `$x = ${n(x0 - 5, 1)}$、$${n(x0, 1)}$、$${n(x0 + 5, 1)}$ mm にある隣り合う三つのノードの読み取り値が、$${n(a, 1)}$、$${n(c, 2)}$、$${n(b, 1)}$（任意単位）です。重心はタッチの位置を何ミリメートルと求めますか。`],
        a: { type: 'num', v: est, abs: 0.03, unit: MMU }, hint: ['$\\hat x = \\sum w_kx_k/\\sum w_k$.', '$\\hat x = \\sum w_kx_k/\\sum w_k$ です。'],
        sol: [[`Sum of readings: $${n(a + b + c, 2)}$. Weighted sum: $${n(a, 1)}\\times${n(x0 - 5, 1)} + ${n(c, 2)}\\times${n(x0, 1)} + ${n(b, 1)}\\times${n(x0 + 5, 1)} = ${n(a * (x0 - 5) + c * x0 + b * (x0 + 5), 2)}$.`, `読み取り値の和は $${n(a + b + c, 2)}$、加重和は $${n(a, 1)}\\times${n(x0 - 5, 1)} + ${n(c, 2)}\\times${n(x0, 1)} + ${n(b, 1)}\\times${n(x0 + 5, 1)} = ${n(a * (x0 - 5) + c * x0 + b * (x0 + 5), 2)}$ です。`], [`$\\hat x = ${n(est, 2)}$ mm, ${Math.abs(est - x0) < 0.005 ? 'exactly on the middle node, since its neighbours read the same' : `$${n(Math.abs(est - x0), 2)}$ mm to the ${est > x0 ? 'right' : 'left'} of the middle node`}.`, `$\\hat x = ${n(est, 2)}$ mm です。${Math.abs(est - x0) < 0.005 ? '両隣の値が同じなので、ちょうど中央のノードの上です' : `中央のノードから${est > x0 ? '右' : '左'}へ $${n(Math.abs(est - x0), 2)}$ mm です`}。`]],
      };
    },
    (r) => {
      const pk = r.step(0.2, 0.42, 0.02), sg = r.step(2.5, 4.5, 0.25), d = r.pick([2.5, 5, 7.5, 10]), v = pk * Math.exp(-(d * d) / (2 * sg * sg));
      return {
        q: [`The fall in capacitance follows $\\Delta C = \\Delta C_{\\max}e^{-d^2/2\\sigma^2}$ with $\\Delta C_{\\max} = ${n(pk, 2)}$ pF and $\\sigma = ${n(sg, 2)}$ mm. What is the fall at a node $${n(d, 1)}$ mm from the centre of the contact?`, `静電容量の低下が $\\Delta C = \\Delta C_{\\max}e^{-d^2/2\\sigma^2}$ に従い、$\\Delta C_{\\max} = ${n(pk, 2)}$ pF、$\\sigma = ${n(sg, 2)}$ mm です。接触の中心から $${n(d, 1)}$ mm 離れたノードでの低下は何 pF ですか。`],
        a: { type: 'num', v, rel: 0.03, unit: PF }, hint: ['Compute the exponent $d^2/(2\\sigma^2)$ first.', 'まず指数 $d^2/(2\\sigma^2)$ を計算します。'],
        sol: [[`$d^2/(2\\sigma^2) = ${n(d * d, 2)}/${n(2 * sg * sg, 3)} = ${n((d * d) / (2 * sg * sg), 3)}$.`, `$d^2/(2\\sigma^2) = ${n(d * d, 2)}/${n(2 * sg * sg, 3)} = ${n((d * d) / (2 * sg * sg), 3)}$ です。`], [`$\\Delta C = ${n(pk, 2)}\\times e^{-${n((d * d) / (2 * sg * sg), 3)}} = ${n(v, 4)}$ pF.`, `$\\Delta C = ${n(pk, 2)}\\times e^{-${n((d * d) / (2 * sg * sg), 3)}} = ${n(v, 4)}$ pF です。`]],
      };
    },
    (r) => {
      const sg = r.step(2.5, 4.5, 0.5), off = r.pick([0.5, 1, 1.5, 2]), w = (x) => Math.exp(-((x - off) ** 2) / (2 * sg * sg)), a = w(-5), c = w(0), b = w(5), est = (-5 * a + 5 * b) / (a + b + c);
      return {
        q: [`A finger is centred $${n(off, 1)}$ mm to the right of a node. Nodes are $5$ mm apart and the response is $e^{-d^2/2\\sigma^2}$ with $\\sigma = ${n(sg, 1)}$ mm. Using that node and its two neighbours, how far to the right of the node does the centroid place the finger?`, `指の中心が、あるノードの $${n(off, 1)}$ mm 右にあります。ノードは $5$ mm 間隔で、応答は $e^{-d^2/2\\sigma^2}$、$\\sigma = ${n(sg, 1)}$ mm です。そのノードと両隣の二つを使うと、重心は指をノードの何ミリメートル右に求めますか。`],
        a: { type: 'num', v: est, abs: 0.03, unit: MMU }, hint: ['The three distances are $5+\\delta$, $\\delta$ and $5-\\delta$.', '三つの距離は $5+\\delta$、$\\delta$、$5-\\delta$ です。'],
        sol: [[`Readings: left $e^{-${n((5 + off) ** 2 / (2 * sg * sg), 3)}} = ${n(a, 4)}$, middle $${n(c, 4)}$, right $${n(b, 4)}$.`, `読み取り値は、左が $e^{-${n((5 + off) ** 2 / (2 * sg * sg), 3)}} = ${n(a, 4)}$、中央が $${n(c, 4)}$、右が $${n(b, 4)}$ です。`], [`$\\hat x = 5(${n(b, 4)} - ${n(a, 4)})/${n(a + b + c, 4)} = ${n(est, 2)}$ mm, against a true $${n(off, 1)}$ mm: three nodes ${Math.abs(est - off) < 0.15 ? 'are nearly enough' : 'underestimate the shift, which is why controllers use more nodes or a correction'}.`, `$\\hat x = 5(${n(b, 4)} - ${n(a, 4)})/${n(a + b + c, 4)} = ${n(est, 2)}$ mm で、真の値は $${n(off, 1)}$ mm です。${Math.abs(est - off) < 0.15 ? '三つのノードでほぼ足ります' : '三つのノードではずれを小さく見積もります。コントローラーがより多くのノードや補正を使うのはそのためです'}。`]],
      };
    },
  ];

  Q['charge-transfer'] = [
    (r) => {
      const cx = r.step(1, 5, 0.5), cs = r.pick([1, 2, 5, 10, 20]), vdd = r.pick([1.8, 3.3, 5]), v1 = (vdd * cx) / (cs * 1000 + cx) * 1000;
      return {
        q: [`A $${n(cx, 1)}$ pF capacitor charged to $${n(vdd, 1)}$ V is connected to an empty $${cs}$ nF capacitor. To what voltage does the large capacitor rise, in millivolts?`, `$${n(vdd, 1)}$ V に充電した $${n(cx, 1)}$ pF のコンデンサーを、空の $${cs}$ nF のコンデンサーにつなぎます。大きいコンデンサーの電圧は何ミリボルトまで上がりますか。`],
        a: { type: 'num', v: v1, rel: 0.02, unit: ['mV', 'mV（ミリボルト）'] }, hint: ['Charge is conserved: $C_xV_{dd} = (C_x+C_s)V$.', '電荷は保存されます。$C_xV_{dd} = (C_x+C_s)V$ です。'],
        sol: [[`$V = V_{dd}\\,C_x/(C_x+C_s) = ${n(vdd, 1)}\\times${n(cx, 1)}/(${n(cx, 1)}+${cs * 1000})$.`, `$V = V_{dd}\\,C_x/(C_x+C_s) = ${n(vdd, 1)}\\times${n(cx, 1)}/(${n(cx, 1)}+${cs * 1000})$ です。`], [`$V = ${n(v1, 3)}$ mV: far too small a step to measure once, which is why it is repeated.`, `$V = ${n(v1, 3)}$ mV です。1 回では小さすぎて測れないので、繰り返します。`]], set: { cx, cs },
      };
    },
    (r) => {
      const cx = r.step(1, 4, 0.5), cs = r.pick([1, 1.5, 2, 5, 10]), frac = r.pick([0.4, 0.5, 0.6]), N = Math.log(1 - frac) / Math.log((cs * 1000) / (cs * 1000 + cx));
      return {
        q: [`About how many transfers from a $${n(cx, 1)}$ pF capacitor does it take to raise a $${n(cs, 1)}$ nF capacitor to $${n(frac * 100, 0)}$ % of the supply voltage?`, `$${n(cx, 1)}$ pF のコンデンサーからの転送を、およそ何回行うと、$${n(cs, 1)}$ nF のコンデンサーの電圧が電源電圧の $${n(frac * 100, 0)}$ % に達しますか。`],
        a: { type: 'num', v: N, rel: 0.02 }, hint: ['$n \\approx (C_s/C_x)\\ln[1/(1-V_{\\rm th}/V_{dd})]$.', '$n \\approx (C_s/C_x)\\ln[1/(1-V_{\\rm th}/V_{dd})]$ です。'],
        sol: [[`$C_s/C_x = ${n((cs * 1000) / cx, 0)}$ and $\\ln[1/(1-${n(frac, 1)})] = ${n(-Math.log(1 - frac), 4)}$.`, `$C_s/C_x = ${n((cs * 1000) / cx, 0)}$、$\\ln[1/(1-${n(frac, 1)})] = ${n(-Math.log(1 - frac), 4)}$ です。`], [`$n \\approx ${n(N, 0)}$.`, `$n \\approx ${n(N, 0)}$ です。`]], set: { cx, cs: Math.max(1, cs) },
      };
    },
    (r) => {
      const cx = r.step(1.5, 3, 0.5), dc = r.step(0.1, 0.5, 0.05), want = r.pick([50, 100, 200, 400]), cs = (want / Math.log(2)) / (1 / (cx - dc) - 1 / cx) / 1000, form = r.int(0, 1), tread = ((cs * 1000) / (cx - dc)) * Math.log(2) * 2e-3;
      return form === 0 ? {
        q: [`A node of $${n(cx, 1)}$ pF falls by $${n(dc, 2)}$ pF when touched. With the threshold at half the supply, how large must the integrating capacitor be, in nanofarads, for the touch to change the count by $${want}$?`, `$${n(cx, 1)}$ pF のノードが、触れると $${n(dc, 2)}$ pF 下がります。しきい値を電源の半分とするとき、タッチで回数が $${want}$ 変わるようにするには、積分用のコンデンサーは何ナノファラド必要ですか。`],
        a: { type: 'num', v: cs, rel: 0.03, unit: ['nF', 'nF（ナノファラド）'] }, hint: ['$\\Delta n \\approx C_s\\ln2\\,(1/C_{\\rm touched} - 1/C_x)$.', '$\\Delta n \\approx C_s\\ln2\\,(1/C_{\\rm touched} - 1/C_x)$ です。'],
        sol: [[`$1/${n(cx - dc, 2)} - 1/${n(cx, 1)} = ${n(1 / (cx - dc) - 1 / cx, 4)}$ pF$^{-1}$.`, `$1/${n(cx - dc, 2)} - 1/${n(cx, 1)} = ${n(1 / (cx - dc) - 1 / cx, 4)}$ pF$^{-1}$ です。`], [`$C_s = ${want}/(\\ln2\\times${n(1 / (cx - dc) - 1 / cx, 4)}) = ${n(cs * 1000, 0)}$ pF $= ${n(cs, 2)}$ nF.`, `$C_s = ${want}/(\\ln2\\times${n(1 / (cx - dc) - 1 / cx, 4)}) = ${n(cs * 1000, 0)}$ pF $= ${n(cs, 2)}$ nF です。`]], set: { cx, dc, cs: Math.min(20, Math.max(1, Math.round(cs * 2) / 2)) },
      } : {
        q: [`A touched node of $${n(cx - dc, 2)}$ pF is read with a $${n(cs, 2)}$ nF integrating capacitor and a threshold at half the supply. Each transfer takes $2$ µs. How long does one reading take, in milliseconds?`, `触れられて $${n(cx - dc, 2)}$ pF になったノードを、$${n(cs, 2)}$ nF の積分用コンデンサーと、電源の半分のしきい値で読みます。1 回の転送に $2$ µs かかります。1 回の読み取りに何ミリ秒かかりますか。`],
        a: { type: 'num', v: tread, rel: 0.03, unit: MS }, hint: ['Transfers $\\approx (C_s/C_x)\\ln2$, then multiply by the time for each.', '転送回数は約 $(C_s/C_x)\\ln2$ です。それに 1 回の時間を掛けます。'],
        sol: [[`Transfers: $${n((cs * 1000) / (cx - dc), 0)}\\times0.693 = ${n(((cs * 1000) / (cx - dc)) * Math.log(2), 0)}$.`, `転送回数は $${n((cs * 1000) / (cx - dc), 0)}\\times0.693 = ${n(((cs * 1000) / (cx - dc)) * Math.log(2), 0)}$ です。`], [`Time: $${n(tread, 2)}$ ms.`, `時間は $${n(tread, 2)}$ ms です。`]],
      };
    },
  ];

  Q['touch-stack'] = [
    (r) => {
      const A = r.step(4, 25, 1), d = r.step(0.2, 1.5, 0.1), er = r.pick([1, 3.9, 7]), c = (8.854e-12 * er * A * 1e-6) / (d * 1e-3) * 1e12;
      return {
        q: [`Two flat electrodes of area $${A}$ mm² are $${n(d, 1)}$ mm apart with a material of relative permittivity $${n(er, 1)}$ between them. What is their capacitance, in picofarads? Use $\\varepsilon_0 = 8.854\\times10^{-12}$ F/m.`, `面積 $${A}$ mm² の平らな電極 2 枚が $${n(d, 1)}$ mm 離れていて、間に比誘電率 $${n(er, 1)}$ の材料があります。静電容量は何ピコファラドですか。$\\varepsilon_0 = 8.854\\times10^{-12}$ F/m を使ってください。`],
        a: { type: 'num', v: c, rel: 0.02, unit: PF }, hint: ['$C = \\varepsilon_0\\varepsilon_rA/d$ in SI units.', 'SI 単位で $C = \\varepsilon_0\\varepsilon_rA/d$ です。'],
        sol: [[`$A = ${A}\\times10^{-6}$ m², $d = ${n(d, 1)}\\times10^{-3}$ m.`, `$A = ${A}\\times10^{-6}$ m²、$d = ${n(d, 1)}\\times10^{-3}$ m です。`], [`$C = 8.854\\times10^{-12}\\times${n(er, 1)}\\times${A}\\times10^{-6}/(${n(d, 1)}\\times10^{-3}) = ${n(c, 3)}$ pF: the scale of everything a touchscreen measures.`, `$C = 8.854\\times10^{-12}\\times${n(er, 1)}\\times${A}\\times10^{-6}/(${n(d, 1)}\\times10^{-3}) = ${n(c, 3)}$ pF です。タッチスクリーンが測る量はすべてこの程度の大きさです。`]],
      };
    },
    (r) => {
      const a = r.step(2, 6, 0.5), t = r.step(0.4, 3, 0.1), pk = 0.42 * (a * a) / (a * a + 4 * t * t);
      return {
        q: [`In the model $\\Delta C_{\\max} = 0.42\\ \\mathrm{pF}\\times a^2/(a^2+4t^2)$, what is the largest fall in capacitance for a contact of radius $a = ${n(a, 1)}$ mm at a distance $t = ${n(t, 1)}$ mm from the electrodes?`, `モデル $\\Delta C_{\\max} = 0.42\\ \\mathrm{pF}\\times a^2/(a^2+4t^2)$ で、電極から $t = ${n(t, 1)}$ mm 離れた半径 $a = ${n(a, 1)}$ mm の接触による静電容量の最大の低下は何 pF ですか。`],
        a: { type: 'num', v: pk, rel: 0.02, unit: PF }, hint: ['Compute $a^2$ and $4t^2$ separately.', '$a^2$ と $4t^2$ を別々に計算します。'],
        sol: [[`$a^2 = ${n(a * a, 2)}$, $4t^2 = ${n(4 * t * t, 2)}$.`, `$a^2 = ${n(a * a, 2)}$、$4t^2 = ${n(4 * t * t, 2)}$ です。`], [`$\\Delta C_{\\max} = 0.42\\times${n(a * a, 2)}/${n(a * a + 4 * t * t, 2)} = ${n(pk, 3)}$ pF.`, `$\\Delta C_{\\max} = 0.42\\times${n(a * a, 2)}/${n(a * a + 4 * t * t, 2)} = ${n(pk, 3)}$ pF です。`]], set: { a, t: Math.min(2, t), gap: Math.max(0, Math.round((t - Math.min(2, t)) * 10) / 10) },
      };
    },
    (r) => {
      const a = r.step(2, 5, 0.5), noise = r.pick([0.01, 0.02, 0.03]), snr = r.pick([5, 8, 10]), t = Math.sqrt((a * a * (0.42 / (snr * noise) - 1)) / 4);
      return {
        q: [`With $\\Delta C_{\\max} = 0.42\\ \\mathrm{pF}\\times a^2/(a^2+4t^2)$, a contact of radius $${n(a, 1)}$ mm and noise of $${n(noise, 2)}$ pF, how far from the electrodes can the finger be, in millimetres, while the signal stays $${snr}$ times the noise?`, `$\\Delta C_{\\max} = 0.42\\ \\mathrm{pF}\\times a^2/(a^2+4t^2)$ とし、接触の半径が $${n(a, 1)}$ mm、ノイズが $${n(noise, 2)}$ pF のとき、信号がノイズの $${snr}$ 倍を保てるのは、指が電極から何ミリメートル離れたところまでですか。`],
        a: { type: 'num', v: t, rel: 0.03, unit: MMU }, hint: ['Set $\\Delta C_{\\max}$ equal to the required signal and solve for $t$.', '$\\Delta C_{\\max}$ を必要な信号の大きさと等しいと置いて、$t$ について解きます。'],
        sol: [[`Required signal: $${snr}\\times${n(noise, 2)} = ${n(snr * noise, 2)}$ pF, so $a^2/(a^2+4t^2) = ${n((snr * noise) / 0.42, 4)}$.`, `必要な信号は $${snr}\\times${n(noise, 2)} = ${n(snr * noise, 2)}$ pF なので、$a^2/(a^2+4t^2) = ${n((snr * noise) / 0.42, 4)}$ です。`], [`$4t^2 = a^2(1/${n((snr * noise) / 0.42, 4)} - 1) = ${n(a * a * (0.42 / (snr * noise) - 1), 2)}$, so $t = ${n(t, 2)}$ mm.`, `$4t^2 = a^2(1/${n((snr * noise) / 0.42, 4)} - 1) = ${n(a * a * (0.42 / (snr * noise) - 1), 2)}$ なので、$t = ${n(t, 2)}$ mm です。`]],
      };
    },
  ];
})();
