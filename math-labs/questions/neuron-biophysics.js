'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const R = 8.314462618, F = 96485.33212, RTF = (Tc) => ((R * (Tc + 273.15)) / F) * 1000;
  const nern = (co, ci, z, Tc) => (RTF(Tc) / z) * Math.log(co / ci);

  /* ---------------- nernst-ghk ---------------- */
  Q['nernst-ghk'] = [
    (r) => {
      const form = r.int(0, 1), Tc = r.pick([20, 25, 37]);
      if (form === 0) {
        return {
          q: [`What is $RT/F$ at $${Tc}$ °C? In mV.`, `$${Tc}$ °C での $RT/F$ はいくらですか。mV で答えてください。`],
          a: { type: 'num', v: RTF(Tc), rel: 0.002, unit: ['mV', 'mV'] },
          hint: ['$R = 8.314$ J/(mol K), $F = 96\\,485$ C/mol, and $T$ in kelvin.', '$R = 8.314$ J/(mol K)、$F = 96\\,485$ C/mol、$T$ はケルビンです。'],
          sol: [[`$T = ${n(Tc + 273.15, 2)}$ K, so $RT/F = 8.314 \\times ${n(Tc + 273.15, 2)} / 96\\,485$ V.`, `$T = ${n(Tc + 273.15, 2)}$ K なので $RT/F = 8.314 \\times ${n(Tc + 273.15, 2)} / 96\\,485$ V です。`], [`$= ${n(RTF(Tc), 3)}$ mV, the thermal voltage that sets every Nernst potential's scale.`, `$= ${n(RTF(Tc), 3)}$ mV で、すべてのネルンスト電位の尺度を決める熱電圧です。`]],
          set: { temp: Tc },
        };
      }
      const z = r.pick([1, 2, -1]), ratio = r.pick([10, 100]), E = (RTF(37) / z) * Math.log(ratio);
      return {
        q: [`An ion of valence $z = ${z}$ is ${ratio} times more concentrated outside the cell than inside. What is its Nernst potential at 37 °C? In mV.`, `価数 $z = ${z}$ のイオンが、細胞の外で内の ${ratio} 倍の濃度になっています。37 °C でのネルンスト電位はいくらですか。mV で答えてください。`],
        a: { type: 'num', v: E, rel: 0.004, unit: ['mV', 'mV'] },
        hint: ['$E = \\frac{RT}{zF}\\ln\\frac{[\\text{out}]}{[\\text{in}]}$ and $\\frac{RT}{F}\\ln 10 = 61.5$ mV at 37 °C.', '$E = \\frac{RT}{zF}\\ln\\frac{[\\text{外}]}{[\\text{内}]}$、37 °C で $\\frac{RT}{F}\\ln 10 = 61.5$ mV です。'],
        sol: [[`$\\ln ${ratio} = ${n(Math.log(ratio), 4)}$ and $RT/F = 26.73$ mV.`, `$\\ln ${ratio} = ${n(Math.log(ratio), 4)}$、$RT/F = 26.73$ mV です。`], [`$E = 26.73 \\times ${n(Math.log(ratio), 4)} / (${z}) = ${n(E, 3)}$ mV.`, `$E = 26.73 \\times ${n(Math.log(ratio), 4)} / (${z}) = ${n(E, 3)}$ mV です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const ko = r.pick([2, 3, 4, 5, 7, 10, 15, 20]), ki = r.pick([120, 130, 140, 150]), Tc = 37, E = nern(ko, ki, 1, Tc);
        return {
          q: [`$[{\\rm K}^+]_o = ${ko}$ mM and $[{\\rm K}^+]_i = ${ki}$ mM at 37 °C. What is $E_{\\rm K}$? In mV.`, `37 °C で $[{\\rm K}^+]_o = ${ko}$ mM、$[{\\rm K}^+]_i = ${ki}$ mM です。$E_{\\rm K}$ はいくらですか。mV で答えてください。`],
          a: { type: 'num', v: E, rel: 0.004, unit: ['mV', 'mV'] },
          hint: ['Use the Nernst equation with $z = 1$.', '$z = 1$ としてネルンストの式を使います。'],
          sol: [[`$E_{\\rm K} = 26.73 \\ln(${ko}/${ki}) = 26.73 \\times ${n(Math.log(ko / ki), 4)}$.`, `$E_{\\rm K} = 26.73 \\ln(${ko}/${ki}) = 26.73 \\times ${n(Math.log(ko / ki), 4)}$ です。`], [`$E_{\\rm K} = ${n(E, 3)}$ mV, negative because potassium is concentrated inside.`, `$E_{\\rm K} = ${n(E, 3)}$ mV で、カリウムが内側に濃縮されているので負になります。`]],
          ...(ki === 140 ? { set: { ko, temp: 37 } } : {}),
        };
      }
      const pna = r.pick([0.01, 0.02, 0.04, 0.05, 0.1]), ko = 5, ki = 140, nao = 145, nai = 12, Vm = RTF(37) * Math.log((ko + pna * nao) / (ki + pna * nai));
      return {
        q: [`Ignoring chloride, with $P_{\\rm Na}/P_{\\rm K} = ${pna}$, $[{\\rm K}^+]_o = 5$, $[{\\rm K}^+]_i = 140$, $[{\\rm Na}^+]_o = 145$, $[{\\rm Na}^+]_i = 12$ mM at 37 °C, what is the GHK membrane potential? In mV.`, `塩化物を無視し、$P_{\\rm Na}/P_{\\rm K} = ${pna}$、$[{\\rm K}^+]_o = 5$、$[{\\rm K}^+]_i = 140$、$[{\\rm Na}^+]_o = 145$、$[{\\rm Na}^+]_i = 12$ mM、37 °C のとき、GHK の膜電位はいくらですか。mV で答えてください。`],
        a: { type: 'num', v: Vm, rel: 0.005, unit: ['mV', 'mV'] },
        hint: ['$V = \\frac{RT}{F}\\ln\\frac{[K]_o + p[Na]_o}{[K]_i + p[Na]_i}$.', '$V = \\frac{RT}{F}\\ln\\frac{[K]_o + p[Na]_o}{[K]_i + p[Na]_i}$ です。'],
        sol: [[`Numerator $5 + ${pna} \\times 145 = ${n(ko + pna * nao, 3)}$, denominator $140 + ${pna} \\times 12 = ${n(ki + pna * nai, 3)}$.`, `分子は $5 + ${pna} \\times 145 = ${n(ko + pna * nao, 3)}$、分母は $140 + ${pna} \\times 12 = ${n(ki + pna * nai, 3)}$ です。`], [`$V = 26.73 \\ln(${n((ko + pna * nao) / (ki + pna * nai), 4)}) = ${n(Vm, 3)}$ mV, pulled up from $E_{\\rm K} = -89$ mV by the sodium leak.`, `$V = 26.73 \\ln(${n((ko + pna * nao) / (ki + pna * nai), 4)}) = ${n(Vm, 3)}$ mV で、ナトリウムの漏れによって $E_{\\rm K} = -89$ mV から引き上げられています。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.pick([-80, -75, -70, -65, -60]), ko = 5, ki = 140, nao = 145, nai = 12, ex = Math.exp(V / RTF(37)), p = (ex * ki - ko) / (nao - ex * nai);
        return {
          q: [`Ignoring chloride, what ratio $P_{\\rm Na}/P_{\\rm K}$ gives a resting potential of $${V}$ mV with the standard concentrations (K 5/140, Na 145/12 mM) at 37 °C? Three significant figures.`, `塩化物を無視し、標準の濃度（K 5/140、Na 145/12 mM）、37 °C で静止電位が $${V}$ mV になる比 $P_{\\rm Na}/P_{\\rm K}$ はいくらですか。有効数字 3 桁で答えてください。`],
          a: { type: 'num', v: p, rel: 0.01 },
          hint: ['Set $e^{V/(RT/F)} = (5 + 145p)/(140 + 12p)$ and solve the linear equation for $p$.', '$e^{V/(RT/F)} = (5 + 145p)/(140 + 12p)$ とおき、$p$ の一次方程式を解きます。'],
          sol: [[`$e^{${V}/26.73} = ${n(ex, 4)}$, so $${n(ex, 4)}(140 + 12p) = 5 + 145p$.`, `$e^{${V}/26.73} = ${n(ex, 4)}$ なので $${n(ex, 4)}(140 + 12p) = 5 + 145p$ です。`], [`$p = (140 \\times ${n(ex, 4)} - 5)/(145 - 12 \\times ${n(ex, 4)}) = ${sig(p, 3)}$.`, `$p = (140 \\times ${n(ex, 4)} - 5)/(145 - 12 \\times ${n(ex, 4)}) = ${sig(p, 3)}$ です。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['With $[{\\rm K}^+]_i = 140$ mM, write the potassium Nernst potential in units of $RT/F$ as a function of $k = [{\\rm K}^+]_o$ (mM).', '$[{\\rm K}^+]_i = 140$ mM のとき、カリウムのネルンスト電位を $RT/F$ を単位として、$k = [{\\rm K}^+]_o$（mM）の関数で書いてください。'],
          a: { type: 'expr', v: 'ln(k/140)', vars: ['k'], dom: { k: [1, 20] }, lhs: ['$E_{\\rm K}/(RT/F) =$', '$E_{\\rm K}/(RT/F) =$'] },
          hint: ['$RT/F = 26.73$ mV at 37 °C.', '37 °C で $RT/F = 26.73$ mV です。'],
          sol: [['$E_{\\rm K} = \\frac{RT}{F}\\ln\\frac{k}{140}$ with $RT/F = 26.73$ mV.', '$E_{\\rm K} = \\frac{RT}{F}\\ln\\frac{k}{140}$、$RT/F = 26.73$ mV です。'], ['So $26.73\\ln(k/140)$: a straight line of slope 61.5 mV per decade of $k$.', 'したがって $26.73\\ln(k/140)$ で、$k$ の 10 倍ごとに傾き 61.5 mV の直線になります。']],
        };
      }
      const z = r.pick([2]), co = 2, ci = r.pick([1e-4, 5e-5, 2e-4]), E = nern(co, ci, z, 37);
      return {
        q: [`Calcium is $2$ mM outside and $${sig(ci * 1e6, 3)}$ nM inside. What is $E_{\\rm Ca}$ at 37 °C? In mV.`, `カルシウムは外で $2$ mM、内で $${sig(ci * 1e6, 3)}$ nM です。37 °C での $E_{\\rm Ca}$ はいくらですか。mV で答えてください。`],
        a: { type: 'num', v: E, rel: 0.005, unit: ['mV', 'mV'] },
        hint: ['Remember $z = 2$ and convert nM to mM.', '$z = 2$ を忘れずに、nM を mM に直します。'],
        sol: [[`Ratio $2/${sig(ci, 3)} = ${n(co / ci, 0)}$, $\\ln = ${n(Math.log(co / ci), 4)}$.`, `比は $2/${sig(ci, 3)} = ${n(co / ci, 0)}$、その対数は $${n(Math.log(co / ci), 4)}$ です。`], [`$E_{\\rm Ca} = (26.73/2) \\times ${n(Math.log(co / ci), 4)} = ${n(E, 3)}$ mV: a huge driving force, which is why calcium entry is such a strong signal.`, `$E_{\\rm Ca} = (26.73/2) \\times ${n(Math.log(co / ci), 4)} = ${n(E, 3)}$ mV で、非常に大きな駆動力です。カルシウムの流入が強い信号になるのはこのためです。`]],
      };
    },
  ];

  /* ---------------- hodgkin-huxley ---------------- */
  Q['hodgkin-huxley'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const m = r.pick([0.05, 0.2, 0.5, 0.8, 0.9]), h = r.pick([0.1, 0.3, 0.6]), g = 120 * m ** 3 * h;
        return {
          q: [`With $\\bar g_{\\rm Na} = 120$ mS/cm², $m = ${m}$ and $h = ${h}$, what is the sodium conductance? In mS/cm².`, `$\\bar g_{\\rm Na} = 120$ mS/cm²、$m = ${m}$、$h = ${h}$ のとき、ナトリウムのコンダクタンスはいくらですか。mS/cm² で答えてください。`],
          a: { type: 'num', v: g, rel: 0.004 },
          hint: ['$g_{\\rm Na} = \\bar g_{\\rm Na}m^3h$.', '$g_{\\rm Na} = \\bar g_{\\rm Na}m^3h$ です。'],
          sol: [[`$m^3 = ${n(m ** 3, 5)}$.`, `$m^3 = ${n(m ** 3, 5)}$ です。`], [`$g_{\\rm Na} = 120 \\times ${n(m ** 3, 5)} \\times ${h} = ${n(g, 4)}$ mS/cm²; the cube makes it rise steeply once $m$ moves.`, `$g_{\\rm Na} = 120 \\times ${n(m ** 3, 5)} \\times ${h} = ${n(g, 4)}$ mS/cm² です。3 乗のため、$m$ が動き出すと急に増えます。`]],
        };
      }
      const T1 = r.pick([6.3, 10, 16.3, 20, 26.3]), phi = Math.pow(3, (T1 - 6.3) / 10);
      return {
        q: [`By what factor $\\phi = 3^{(T - 6.3)/10}$ are the gate rates multiplied at $${T1}$ °C?`, `$${T1}$ °C では、ゲートの速度は $\\phi = 3^{(T - 6.3)/10}$ 倍になります。$\\phi$ はいくらですか。`],
        a: { type: 'num', v: phi, rel: 0.003 },
        hint: ['$Q_{10} = 3$: three times faster per 10 °C.', '$Q_{10} = 3$、10 °C ごとに 3 倍速くなります。'],
        sol: [[`$(T - 6.3)/10 = ${n((T1 - 6.3) / 10, 2)}$.`, `$(T - 6.3)/10 = ${n((T1 - 6.3) / 10, 2)}$ です。`], [`$\\phi = 3^{${n((T1 - 6.3) / 10, 2)}} = ${n(phi, 4)}$.`, `$\\phi = 3^{${n((T1 - 6.3) / 10, 2)}} = ${n(phi, 4)}$ です。`]],
        ...(T1 <= 25 ? { set: { temp: T1 } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const V = r.pick([-80, -65, -50, -40, -20, 0, 20]), m = 0.05 + 0.9 / (1 + Math.exp(-(V + 40) / 6)), h = r.pick([0.2, 0.4, 0.6]), I = 120 * m ** 3 * h * (V - 50);
        return {
          q: [`At $V = ${V}$ mV with $m = ${n(m, 3)}$ and $h = ${h}$, what is the sodium current density $I_{\\rm Na} = \\bar g_{\\rm Na}m^3h(V - E_{\\rm Na})$, with $E_{\\rm Na} = 50$ mV? In µA/cm² (inward negative).`, `$V = ${V}$ mV、$m = ${n(m, 3)}$、$h = ${h}$ のとき、ナトリウム電流密度 $I_{\\rm Na} = \\bar g_{\\rm Na}m^3h(V - E_{\\rm Na})$（$E_{\\rm Na} = 50$ mV）はいくらですか。µA/cm² で答えてください（内向きを負とします）。`],
          a: { type: 'num', v: I, rel: 0.006 },
          hint: ['mS/cm² times mV gives µA/cm².', 'mS/cm² と mV の積が µA/cm² になります。'],
          sol: [[`$g = 120 \\times ${n(m ** 3, 5)} \\times ${h} = ${n(120 * m ** 3 * h, 4)}$ mS/cm² and the driving force is $${V} - 50 = ${V - 50}$ mV.`, `$g = 120 \\times ${n(m ** 3, 5)} \\times ${h} = ${n(120 * m ** 3 * h, 4)}$ mS/cm²、駆動力は $${V} - 50 = ${V - 50}$ mV です。`], [`$I_{\\rm Na} = ${n(I, 4)}$ µA/cm², inward: it depolarises the membrane.`, `$I_{\\rm Na} = ${n(I, 4)}$ µA/cm² で内向きです。膜を脱分極させます。`]],
        };
      }
      const amp = r.step(4, 14, 0.5), thr = 6.91, fires = amp > thr;
      return {
        q: [`In the standard HH model at 6.3 °C the threshold for a 1 ms pulse is about 6.9 µA/cm². Does a single ${n(amp, 1)} µA/cm² pulse fire a spike?`, `6.3 °C の標準の HH モデルでは、1 ms パルスのしきい値は約 6.9 µA/cm² です。${n(amp, 1)} µA/cm² のパルス一つでスパイクは発火しますか。`],
        a: { type: 'choice', fixed: true, v: fires ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['Compare with the threshold; the response is all or nothing.', 'しきい値と比べます。反応は全か無かです。'],
        sol: [[`${n(amp, 1)} is ${fires ? 'above' : 'below'} 6.91 µA/cm².`, `${n(amp, 1)} は 6.91 µA/cm² より${fires ? '大きい' : '小さい'}です。`], [fires ? 'So the sodium feedback runs away and a full-sized spike fires.' : 'So the membrane relaxes back to rest without a spike.', fires ? 'したがってナトリウムの正帰還が暴走し、完全な大きさのスパイクが発火します。' : 'したがって膜はスパイクなしで静止値に戻ります。']],
        set: { amp, amp2: 0, temp: 6.3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.pick([-80, -70, -60, -50, -40]), x = (V + 40) / 10, am = Math.abs(x) < 1e-9 ? 1 : x / (1 - Math.exp(-x)), bm = 4 * Math.exp(-(V + 65) / 18), minf = am / (am + bm);
        return {
          q: [`With $\\alpha_m = \\frac{0.1(V + 40)}{1 - e^{-(V + 40)/10}}$ and $\\beta_m = 4e^{-(V + 65)/18}$ (ms$^{-1}$), what is the steady-state $m_\\infty$ at $V = ${V}$ mV? Three decimals.`, `$\\alpha_m = \\frac{0.1(V + 40)}{1 - e^{-(V + 40)/10}}$、$\\beta_m = 4e^{-(V + 65)/18}$（ms$^{-1}$）のとき、$V = ${V}$ mV での定常値 $m_\\infty$ はいくらですか。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: minf, tol: 0.0015 },
          hint: ['$m_\\infty = \\alpha_m/(\\alpha_m + \\beta_m)$; at $V = -40$ use the limit $\\alpha_m = 1$.', '$m_\\infty = \\alpha_m/(\\alpha_m + \\beta_m)$ です。$V = -40$ では極限 $\\alpha_m = 1$ を使います。'],
          sol: [[`$\\alpha_m = ${n(am, 4)}$, $\\beta_m = ${n(bm, 4)}$ ms$^{-1}$.`, `$\\alpha_m = ${n(am, 4)}$、$\\beta_m = ${n(bm, 4)}$ ms$^{-1}$ です。`], [`$m_\\infty = ${n(minf, 4)}$; it rises steeply between $-60$ and $-30$ mV, which is where threshold lies.`, `$m_\\infty = ${n(minf, 4)}$ です。$-60$ と $-30$ mV の間で急に上がり、そこにしきい値があります。`]],
        };
      }
      if (form === 1) {
        const C = 1, I = r.pick([5, 10, 20, 40]), t = r.pick([0.5, 1, 2]), dV = (I * t) / C;
        return {
          q: [`Before any channel responds, a current of $${I}$ µA/cm² charges a membrane of $1$ µF/cm² for $${t}$ ms. By how many mV does it depolarise?`, `どのチャネルも反応する前に、$${I}$ µA/cm² の電流が $1$ µF/cm² の膜を $${t}$ ms 充電します。何 mV 脱分極しますか。`],
          a: { type: 'num', v: dV, rel: 0.003, unit: ['mV', 'mV'] },
          hint: ['$\\Delta V = I\\,\\Delta t / C$; µA·ms/µF = mV.', '$\\Delta V = I\\,\\Delta t / C$ で、µA·ms/µF = mV です。'],
          sol: [[`$\\Delta V = ${I} \\times ${t} / 1$.`, `$\\Delta V = ${I} \\times ${t} / 1$ です。`], [`$${n(dV, 3)}$ mV, so a 1 ms pulse just above threshold lifts the membrane by about 7 mV, from $-65$ to about $-58$ mV.`, `$${n(dV, 3)}$ mV です。しきい値をわずかに上回る 1 ms のパルスは膜を約 7 mV、$-65$ から約 $-58$ mV まで持ち上げます。`]],
        };
      }
      return {
        q: ['Which gate must recover before a second action potential can fire, and is it fast or slow?', '2 回目の活動電位が発火できるようになる前に回復しなければならないのはどのゲートで、それは速いですか、遅いですか。'],
        a: { type: 'choice', v: 0, opts: [['the sodium inactivation gate $h$, slow', 'ナトリウムの不活性化ゲート $h$、遅い'], ['the sodium activation gate $m$, fast', 'ナトリウムの活性化ゲート $m$、速い'], ['the leak conductance, instantaneous', '漏れのコンダクタンス、瞬時']] },
        hint: ['Look at which trace is still far from its resting value 10 ms after the spike.', 'スパイクの 10 ms 後に、まだ静止値から遠いのはどの曲線かを見ます。'],
        sol: [['$m$ returns within a millisecond, but $h$ closed during the spike and reopens with a time constant of several ms.', '$m$ は 1 ms 以内に戻りますが、$h$ はスパイクの間に閉じ、数 ms の時定数で再び開きます。'], ['Until $h$ recovers, too few sodium channels are available: that is the refractory period.', '$h$ が回復するまでは使えるナトリウムチャネルが少なすぎます。これが不応期です。']],
        set: { amp: 10, amp2: 10, delay: 12, temp: 6.3 },
      };
    },
  ];

  /* ---------------- cable-equation ---------------- */
  const lam = (Rm, d, Ri = 100) => Math.sqrt((Rm * d * 1e-4) / (4 * Ri)) * 10;
  Q['cable-equation'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const Rm = r.pick([10000, 20000, 40000]), d = r.pick([1, 2, 4, 8]), l = lam(Rm, d);
        return {
          q: [`With $R_m = ${Rm}$ Ω cm², $R_i = 100$ Ω cm and $d = ${d}$ µm, what is the length constant $\\lambda = \\sqrt{R_m d/4R_i}$? In mm.`, `$R_m = ${Rm}$ Ω cm²、$R_i = 100$ Ω cm、$d = ${d}$ µm のとき、長さ定数 $\\lambda = \\sqrt{R_m d/4R_i}$ はいくらですか。mm で答えてください。`],
          a: { type: 'num', v: l, rel: 0.004, unit: ['mm', 'mm'] },
          hint: ['Put $d$ in cm: 1 µm = $10^{-4}$ cm.', '$d$ を cm に直します。1 µm = $10^{-4}$ cm です。'],
          sol: [[`$\\lambda^2 = ${Rm} \\times ${d}\\times10^{-4} / 400 = ${sig((Rm * d * 1e-4) / 400, 4)}$ cm².`, `$\\lambda^2 = ${Rm} \\times ${d}\\times10^{-4} / 400 = ${sig((Rm * d * 1e-4) / 400, 4)}$ cm² です。`], [`$\\lambda = ${n(l / 10, 4)}$ cm $= ${n(l, 3)}$ mm.`, `$\\lambda = ${n(l / 10, 4)}$ cm $= ${n(l, 3)}$ mm です。`]],
          set: { rm: Rm, d },
        };
      }
      const x = r.pick([0.5, 1, 1.5, 2, 3]), V = Math.exp(-x);
      return {
        q: [`On an infinite cable, what fraction of the injected voltage remains at a distance of $${n(x, 1)}\\lambda$?`, `無限ケーブルで、$${n(x, 1)}\\lambda$ 離れた点には注入した電圧のどれだけの割合が残りますか。`],
        a: { type: 'num', v: V, rel: 0.004, show: `e^{-${n(x, 1)}}` },
        hint: ['$V(x) = V_0 e^{-x/\\lambda}$.', '$V(x) = V_0 e^{-x/\\lambda}$ です。'],
        sol: [[`$e^{-${n(x, 1)}} = ${n(V, 4)}$.`, `$e^{-${n(x, 1)}} = ${n(V, 4)}$ です。`], ['Each length constant cuts the signal to 37% of its value.', '長さ定数一つごとに、信号は 37% に減ります。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const Lr = r.pick([0.5, 1, 1.5, 2, 3]), V = 1 / Math.cosh(Lr);
        return {
          q: [`Current is injected at one sealed end of a dendrite of electrotonic length $L/\\lambda = ${n(Lr, 1)}$. What fraction of the voltage reaches the other sealed end?`, `電気的長さ $L/\\lambda = ${n(Lr, 1)}$ の樹状突起の、閉じた一端から電流を注入します。もう一方の閉じた端には電圧のどれだけの割合が届きますか。`],
          a: { type: 'num', v: V, rel: 0.004, show: `1/\\cosh ${n(Lr, 1)}` },
          hint: ['$V(x) \\propto \\cosh((L - x)/\\lambda)$ for injection at $x = 0$.', '$x = 0$ で注入すると $V(x) \\propto \\cosh((L - x)/\\lambda)$ です。'],
          sol: [[`$V(L)/V(0) = \\cosh 0/\\cosh(${n(Lr, 1)}) = 1/${n(Math.cosh(Lr), 4)}$.`, `$V(L)/V(0) = \\cosh 0/\\cosh(${n(Lr, 1)}) = 1/${n(Math.cosh(Lr), 4)}$ です。`], [`$= ${n(V, 4)}$, more than the infinite-cable $e^{-${n(Lr, 1)}} = ${n(Math.exp(-Lr), 4)}$, because the sealed end reflects current.`, `$= ${n(V, 4)}$ で、無限ケーブルの $e^{-${n(Lr, 1)}} = ${n(Math.exp(-Lr), 4)}$ より大きくなります。閉じた端が電流を跳ね返すからです。`]],
          set: { d: 2, rm: 20000, len: Lr, x0: 0 },
        };
      }
      const d = r.pick([1, 2, 4, 5, 10, 12, 15]), vm = 6 * d, vu = Math.sqrt(d);
      return {
        q: [`Using $v \\approx 6$ m/s per µm for myelinated fibers and $v \\approx \\sqrt{d}$ m/s (d in µm) for bare ones, how many times faster is a myelinated fiber of $${d}$ µm?`, `有髄線維に 1 µm あたり $v \\approx 6$ m/s、むき出しの線維に $v \\approx \\sqrt{d}$ m/s（d は µm）を使うと、$${d}$ µm の有髄線維は何倍速いですか。`],
        a: { type: 'num', v: vm / vu, rel: 0.004 },
        hint: ['Divide $6d$ by $\\sqrt d$: the ratio is $6\\sqrt d$.', '$6d$ を $\\sqrt d$ で割ると、比は $6\\sqrt d$ です。'],
        sol: [[`Myelinated $${n(vm, 2)}$ m/s, bare $${n(vu, 3)}$ m/s.`, `有髄 $${n(vm, 2)}$ m/s、むき出し $${n(vu, 3)}$ m/s です。`], [`Ratio $6\\sqrt{${d}} = ${n(vm / vu, 3)}$, and it grows with diameter.`, `比は $6\\sqrt{${d}} = ${n(vm / vu, 3)}$ で、直径とともに大きくなります。`]],
        ...(d <= 10 ? { set: { d } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 4, 9, 16]);
        return {
          q: [`By what factor must the diameter grow to multiply the length constant by $${Math.sqrt(k)}$?`, `長さ定数を $${Math.sqrt(k)}$ 倍にするには、直径を何倍にしなければなりませんか。`],
          a: { type: 'num', v: k, rel: 0.002 },
          hint: ['$\\lambda \\propto \\sqrt d$.', '$\\lambda \\propto \\sqrt d$ です。'],
          sol: [['Since $\\lambda \\propto \\sqrt d$, scaling $\\lambda$ by $s$ needs $d$ scaled by $s^2$.', '$\\lambda \\propto \\sqrt d$ なので、$\\lambda$ を $s$ 倍にするには $d$ を $s^2$ 倍にします。'], [`So a factor of $${k}$ in diameter, and $${k * k}$ in cross-section: thick dendrites are an expensive way to reach far.`, `したがって直径は $${k}$ 倍、断面積は $${k * k}$ 倍です。太い樹状突起は遠くへ届くための高価な方法です。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['Solve $\\lambda^2V\'\' = V$ on $0 \\le x \\le L$ with sealed ends at $x = L$ ($V\'(L) = 0$) and $V(0) = 1$. Write $V(x)$ with $\\lambda = 1$ and $L = 2$.', '$0 \\le x \\le L$ で、$x = L$ が閉じた端（$V\'(L) = 0$）、$V(0) = 1$ として $\\lambda^2V\'\' = V$ を解いてください。$\\lambda = 1$、$L = 2$ として $V(x)$ を書いてください。'],
          a: { type: 'expr', v: 'cosh(2-x)/cosh(2)', vars: ['x'], dom: { x: [0, 2] }, lhs: ['$V(x) =$', '$V(x) =$'] },
          hint: ['Try $A\\cosh((L - x)/\\lambda)$: its derivative vanishes at $x = L$.', '$A\\cosh((L - x)/\\lambda)$ を試します。その導関数は $x = L$ でゼロです。'],
          sol: [['The general solution is $A\\cosh(L - x) + B\\sinh(L - x)$; $V\'(L) = 0$ kills the sinh term.', '一般解は $A\\cosh(L - x) + B\\sinh(L - x)$ で、$V\'(L) = 0$ から sinh の項が消えます。'], ['$V(0) = 1$ gives $A = 1/\\cosh 2$, so $V(x) = \\cosh(2 - x)/\\cosh 2$, which ends at $0.266$.', '$V(0) = 1$ から $A = 1/\\cosh 2$ なので $V(x) = \\cosh(2 - x)/\\cosh 2$ で、端では $0.266$ になります。']],
          set: { d: 2, rm: 20000, len: 2, x0: 0 },
        };
      }
      const target = r.pick([0.5, 0.6, 0.7, 0.8]), Lr = Math.acosh(1 / target);
      return {
        q: [`How long, in units of $\\lambda$, can a sealed dendrite be if a voltage injected at one end must still be at least ${n(100 * target, 0)}% at the other end?`, `一端から注入した電圧がもう一方の端で少なくとも ${n(100 * target, 0)}% 残っていなければならないとき、閉じた樹状突起は $\\lambda$ を単位として何倍まで長くできますか。`],
        a: { type: 'num', v: Lr, rel: 0.004, show: `\\cosh^{-1}(1/${target})` },
        hint: ['Solve $1/\\cosh(L/\\lambda) = $ target.', '$1/\\cosh(L/\\lambda) = $ 目標値 を解きます。'],
        sol: [[`$\\cosh(L/\\lambda) = ${n(1 / target, 4)}$.`, `$\\cosh(L/\\lambda) = ${n(1 / target, 4)}$ です。`], [`$L/\\lambda = \\cosh^{-1}(${n(1 / target, 4)}) = ${n(Lr, 4)}$: electrotonically compact dendrites must be shorter than about one length constant.`, `$L/\\lambda = \\cosh^{-1}(${n(1 / target, 4)}) = ${n(Lr, 4)}$ です。電気的にまとまった樹状突起は、長さ定数一つ分ほどより短くなければなりません。`]],
      };
    },
  ];
})();
