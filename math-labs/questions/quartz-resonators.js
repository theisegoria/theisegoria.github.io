'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const TAU = 2 * Math.PI, DAY = 86400;
  // quartz beam constants (the same as the figure)
  const E = 78.7e9, RHO = 2649, B1 = 1.8751040687;
  const VB = Math.sqrt(E / (12 * RHO));              // m/s
  const KF = B1 * B1 / TAU * VB;                       // f = KF t / L^2 in SI
  const fOf = (Lmm, tmm) => KF * tmm * 1e-3 / (Lmm * 1e-3) ** 2;
  const LFor = (f, tmm) => Math.sqrt(KF * tmm * 1e-3 / f) * 1e3;
  const sgn = (x, d = 3) => (x >= 0 ? '+' : '-') + n(Math.abs(x), d);
  const snap = (x, s, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / s) * s));
  const r4 = (x) => Number(x.toFixed(4));

  /* ---------- 1. the tuning fork ---------- */
  Q['tuning-fork'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const k = r.int(10, 22), f = 2 ** k;
        return {
          q: [`A crystal oscillates at $${f.toLocaleString('en').replace(/,/g, '{,}')}$ Hz $= 2^{${k}}$ Hz. How many divide-by-two flip-flops turn it into one pulse per second?`, `水晶が $${f.toLocaleString('en').replace(/,/g, '{,}')}$ Hz $= 2^{${k}}$ Hz で振動しています。毎秒一パルスにするには、二分周のフリップフロップがいくつ必要ですか。`],
          a: { type: 'int', v: k },
          hint: ['Each flip-flop halves the frequency.', 'フリップフロップ一つごとに周波数が半分になります。'],
          sol: [[`After $m$ stages the frequency is $2^{${k}}/2^m$ Hz, which is 1 Hz when $m = ${k}$.`, `$m$ 段のあとの周波数は $2^{${k}}/2^m$ Hz で、$m = ${k}$ のとき 1 Hz になります。`], [`A power of two is chosen precisely so that a chain of identical halvings lands exactly on one second, with no remainder to correct.`, `二のべき乗を選ぶのはまさに、同じ半分割りを並べるだけで余りなくちょうど一秒になるようにするためです。`]],
        };
      }
      if (form === 1) {
        const [kn, kd] = r.pick([[2, 1], [1, 2], [3, 2], [4, 5], [5, 4], [3, 1], [2, 3], [9, 10], [11, 10]]), k = kn / kd;
        const wid = r.chance(0.5), m = wid ? r.pick([2, 3, 0.5, 1.5]) : 1;
        const ratio = m / (k * k);
        return {
          q: wid
            ? [`A tuning-fork tine is made $${n(k, 3)}$ times as long and $${n(m)}$ times as wide in the bending direction. By what factor does its first bending frequency change?`, `音叉の歯を長さ $${n(k, 3)}$ 倍、曲げ方向の幅 $${n(m)}$ 倍にします。一次の曲げ振動数は何倍になりますか。`]
            : [`A tuning-fork tine is made $${n(k, 3)}$ times as long, with the same width. By what factor does its first bending frequency change?`, `音叉の歯を、幅はそのままで長さを $${n(k, 3)}$ 倍にします。一次の曲げ振動数は何倍になりますか。`],
          a: { type: 'num', v: ratio, rel: 0.002 },
          hint: ['$f_1 \\propto t/L^2$.', '$f_1 \\propto t/L^2$ です。'],
          sol: [[`$f_1 \\propto t/L^2$, so the factor is $${n(m)}/${n(k, 3)}^2 = ${n(ratio, 4)}$.`, `$f_1 \\propto t/L^2$ なので、倍率は $${n(m)}/${n(k, 3)}^2 = ${n(ratio, 4)}$ です。`], ['Length enters squared, so it is the dimension that has to be cut most precisely.', '長さは二乗で効くので、最も精密に加工しなければならない寸法です。']],
        };
      }
      const ppm = r.pick([1, 2, 5, 10, 20, 11.6, 50, 100, -3, -8, -25]);
      const s = ppm * 1e-6 * DAY;
      return {
        q: [`A watch's crystal runs $${n(Math.abs(ppm))}$ ppm ${ppm > 0 ? 'fast' : 'slow'}. How many seconds a day does the watch ${ppm > 0 ? 'gain' : 'lose'}?`, `時計の水晶が $${n(Math.abs(ppm))}$ ppm ${ppm > 0 ? '速く' : '遅く'}動いています。時計は一日に何秒${ppm > 0 ? '進み' : '遅れ'}ますか。`],
        a: { type: 'num', v: Math.abs(s), unit: ['s', '秒'] },
        hint: ['A day has 86,400 seconds; 1 ppm is one part in a million of them.', '一日は 86,400 秒で、1 ppm はその百万分の一です。'],
        sol: [[`$${n(Math.abs(ppm))} \\times 10^{-6} \\times 86{,}400 = ${n(Math.abs(s), 4)}$ s.`, `$${n(Math.abs(ppm))} \\times 10^{-6} \\times 86{,}400 = ${n(Math.abs(s), 4)}$ 秒です。`], ['So 1 ppm is 0.0864 s a day, about 2.6 s a month: the scale on which quartz watches are specified.', 'つまり 1 ppm は一日 0.0864 秒、月におよそ 2.6 秒で、クォーツ時計の精度はこの尺度で規定されます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.step(0.1, 0.3, 0.005), L = r.step(1.9, 2.9, 0.01), f = fOf(L, t);
        return {
          q: [`A quartz tine ($E = 78.7$ GPa, $\\rho = 2649\\ \\mathrm{kg/m^3}$) is $L = ${n(L)}$ mm long and $t = ${n(t, 3)}$ mm wide in the bending direction. Find its first bending frequency, in kHz, from $f_1 = \\dfrac{1.8751^2}{2\\pi}\\dfrac{t}{L^2}\\sqrt{E/12\\rho}$.`, `水晶の歯（$E = 78.7$ GPa、$\\rho = 2649\\ \\mathrm{kg/m^3}$）の長さが $L = ${n(L)}$ mm、曲げ方向の幅が $t = ${n(t, 3)}$ mm です。$f_1 = \\dfrac{1.8751^2}{2\\pi}\\dfrac{t}{L^2}\\sqrt{E/12\\rho}$ から一次の曲げ振動数を kHz で求めてください。`],
          a: { type: 'num', v: f / 1000, rel: 0.004, unit: ['kHz', 'kHz'] },
          hint: ['Work in metres. $\\sqrt{E/12\\rho}$ is a speed, about 1.57 km/s.', 'メートル単位で計算します。$\\sqrt{E/12\\rho}$ は速さの次元で、およそ 1.57 km/s です。'],
          sol: [[`$\\sqrt{E/12\\rho} = \\sqrt{78.7\\times10^9/(12\\times2649)} = ${n(VB, 1)}$ m/s, and $1.8751^2/2\\pi = 0.5596$, so $f_1 = ${n(KF, 1)}\\,t/L^2$ in SI units.`, `$\\sqrt{E/12\\rho} = \\sqrt{78.7\\times10^9/(12\\times2649)} = ${n(VB, 1)}$ m/s、$1.8751^2/2\\pi = 0.5596$ なので、SI 単位で $f_1 = ${n(KF, 1)}\\,t/L^2$ です。`], [`$f_1 = ${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/(${sig(L * 1e-3, 3)})^2 = ${n(f, 0)}$ Hz $= ${n(f / 1000, 3)}$ kHz.`, `$f_1 = ${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/(${sig(L * 1e-3, 3)})^2 = ${n(f, 0)}$ Hz $= ${n(f / 1000, 3)}$ kHz です。`], [`That is ${f > 32768 ? 'above' : 'below'} the 32.768 kHz target by ${n(Math.abs(f / 32768 - 1) * 1e6, 0)} ppm.`, `目標の 32.768 kHz より ${n(Math.abs(f / 32768 - 1) * 1e6, 0)} ppm ${f > 32768 ? '高い' : '低い'}値です。`]],
          set: { L, t },
        };
      }
      if (form === 2) {
        const t = r.step(0.12, 0.3, 0.01), L = LFor(32768, t);
        return {
          q: [`With $f_1 = ${n(KF, 1)}\\,t/L^2$ (SI units) for a quartz tine, how long must a tine $${n(t)}$ mm wide be to vibrate at exactly 32,768 Hz? Give mm.`, `水晶の歯について SI 単位で $f_1 = ${n(KF, 1)}\\,t/L^2$ とします。幅 $${n(t)}$ mm の歯がちょうど 32,768 Hz で振動するには、長さは何 mm でなければなりませんか。`],
          a: { type: 'num', v: L, tol: 0.002, unit: ['mm', 'mm'] },
          hint: ['Solve for $L$: $L = \\sqrt{K t / f}$.', '$L$ について解くと $L = \\sqrt{K t / f}$ です。'],
          sol: [[`$L = \\sqrt{${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/32768} = ${sig(L * 1e-3, 4)}$ m.`, `$L = \\sqrt{${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/32768} = ${sig(L * 1e-3, 4)}$ m です。`], [`That is $${n(L, 4)}$ mm: wider tines are stiffer and need to be longer for the same note.`, `つまり $${n(L, 4)}$ mm です。幅の広い歯は硬いので、同じ音にするにはより長くなければなりません。`]],
          set: L >= 1.8 && L <= 3 ? { t, L: r4(L) } : undefined,
        };
      }
      const dL = r.pick([0.5, 1, 2, 3, 5]), L = r.pick([2.1, 2.2, 2.32, 2.4, 2.5]), longer = r.chance(0.35);
      const ppm = (longer ? -2 : 2) * dL * 1e-3 / L * 1e6, s = ppm * 1e-6 * DAY;
      return {
        q: [`A fork is tuned to 32,768 Hz with tines $${n(L)}$ mm long. If the tines came out $${n(dL)}$ µm ${longer ? 'longer' : 'shorter'}, by how many seconds a day would the watch ${longer ? 'lose' : 'gain'} (to first order)?`, `歯の長さ $${n(L)}$ mm で 32,768 Hz に調律した音叉があります。歯が $${n(dL)}$ µm ${longer ? '長く' : '短く'}できてしまうと、時計は一日に何秒${longer ? '遅れ' : '進み'}ますか（一次の近似で）。`],
        a: { type: 'num', v: Math.abs(s), rel: 0.01, unit: ['s', '秒'] },
        hint: ['$f \\propto L^{-2}$, so $\\Delta f/f \\approx -2\\,\\Delta L/L$.', '$f \\propto L^{-2}$ なので $\\Delta f/f \\approx -2\\,\\Delta L/L$ です。'],
        sol: [[`$\\Delta f/f \\approx -2 \\times (${longer ? '' : '-'}${n(dL * 1e-3, 4)})/${n(L)} = ${sgn(ppm * 1e-6 * 1e6, 0)}$ ppm.`, `$\\Delta f/f \\approx -2 \\times (${longer ? '' : '-'}${n(dL * 1e-3, 4)})/${n(L)} = ${sgn(ppm, 0)}$ ppm です。`], [`$${n(Math.abs(ppm), 1)} \\times 10^{-6} \\times 86{,}400 = ${n(Math.abs(s), 1)}$ s a day.`, `$${n(Math.abs(ppm), 1)} \\times 10^{-6} \\times 86{,}400 = ${n(Math.abs(s), 1)}$ 秒/日です。`], ['Micrometre errors cost tens of seconds a day, which is why each fork is trimmed with a laser while its frequency is measured.', 'マイクロメートルの誤差が一日数十秒になるので、各音叉は周波数を測りながらレーザーで調整されます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['A beam tine obeys $f = K t/L^2$ with $K$ a material constant. Write the length $L$ that gives frequency $f$, in terms of $K$, $t$ and $f$.', 'はりの歯は材料定数 $K$ を使って $f = K t/L^2$ に従います。周波数 $f$ を与える長さ $L$ を、$K$、$t$、$f$ で表してください。'],
          a: { type: 'expr', v: 'sqrt(K*t/f)', vars: ['K', 't', 'f'], lhs: ['$L =$', '$L =$'] },
          hint: ['Multiply through by $L^2$ and divide by $f$.', '両辺に $L^2$ を掛けて $f$ で割ります。'],
          sol: [['$L^2 = K t / f$, so $L = \\sqrt{K t/f}$.', '$L^2 = K t / f$ なので $L = \\sqrt{K t/f}$ です。'], ['Halving the target frequency lengthens the tine only by $\\sqrt2$, which is why a 32 kHz fork is only about 2 mm long.', '目標の周波数を半分にしても歯は $\\sqrt2$ 倍しか長くならないので、32 kHz の音叉は 2 mm ほどの長さで済みます。']],
        };
      }
      if (form === 1) {
        const t = r.pick([0.15, 0.2, 0.25]), g = r.pick([-30, -12, -6, 5, 10, 20, 40]) * (r.chance(0.5) ? 1 : 1.5);
        const f = 32768 * (1 + g / DAY), L = LFor(f, t);
        return {
          q: [`A watch whose fork has tines $${n(t)}$ mm wide ${g > 0 ? 'gains' : 'loses'} $${n(Math.abs(g))}$ s a day. Using $f_1 = ${n(KF, 1)}\\,t/L^2$ (SI), how long are its tines? Give mm to four decimals.`, `歯の幅が $${n(t)}$ mm の音叉をもつ時計が一日に $${n(Math.abs(g))}$ 秒${g > 0 ? '進み' : '遅れ'}ます。$f_1 = ${n(KF, 1)}\\,t/L^2$（SI）を使うと、歯の長さは何 mm ですか。小数第4位まで答えてください。`],
          a: { type: 'num', v: L, tol: 0.0002, unit: ['mm', 'mm'] },
          hint: ['First turn the daily error into the actual frequency, then solve for $L$.', 'まず一日の誤差を実際の周波数に直し、それから $L$ について解きます。'],
          sol: [[`The rate is $${sgn(g, 1)}/86{,}400 = ${sgn(g / DAY * 1e6, 1)}$ ppm, so $f = 32768 \\times (1 ${g > 0 ? '+' : '-'} ${sig(Math.abs(g) / DAY, 3)}) = ${n(f, 3)}$ Hz.`, `歩度は $${sgn(g, 1)}/86{,}400 = ${sgn(g / DAY * 1e6, 1)}$ ppm なので、$f = 32768 \\times (1 ${g > 0 ? '+' : '-'} ${sig(Math.abs(g) / DAY, 3)}) = ${n(f, 3)}$ Hz です。`], [`$L = \\sqrt{${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/${n(f, 3)}} = ${n(L, 4)}$ mm, against $${n(LFor(32768, t), 4)}$ mm for a perfect fork.`, `$L = \\sqrt{${n(KF, 1)} \\times ${sig(t * 1e-3, 3)}/${n(f, 3)}} = ${n(L, 4)}$ mm で、完全な音叉の $${n(LFor(32768, t), 4)}$ mm と比べられます。`], [`The difference is ${n(Math.abs(L - LFor(32768, t)) * 1e3, 2)} µm: a ${g > 0 ? 'fast' : 'slow'} watch has tines that are ${g > 0 ? 'too short' : 'too long'} by well under the width of a hair.`, `差は ${n(Math.abs(L - LFor(32768, t)) * 1e3, 2)} µm です。${g > 0 ? '進む' : '遅れる'}時計の歯は、髪の毛の太さよりずっと小さい量だけ${g > 0 ? '短すぎる' : '長すぎる'}のです。`]],
          set: L >= 1.8 && L <= 3 ? { t, L: r4(L) } : undefined,
        };
      }
      const opts = [
        ['16,384 Hz is audible, so a fork tuned there would whine; 32,768 Hz is the lowest power of two safely above hearing.', '16,384 Hz は耳に聞こえるので、その音叉は鳴いてしまいます。32,768 Hz は可聴域を十分に超える最小の二のべき乗です。'],
        ['A higher frequency always gives a more accurate watch, so the highest practical power of two was chosen.', '周波数が高いほど時計は常に正確になるので、実用的に最も高い二のべき乗が選ばれました。'],
        ['32,768 is divisible by 60, so minutes come out exactly.', '32,768 は 60 で割り切れるので、分がちょうど得られます。'],
        ['Quartz can only vibrate at powers of two.', '水晶は二のべき乗の周波数でしか振動できません。'],
      ];
      return {
        q: ['Watch crystals run at $2^{15} = 32{,}768$ Hz rather than $2^{14} = 16{,}384$ Hz, which would need one flip-flop fewer and draw less power. Why?', '時計の水晶は、フリップフロップが一つ少なく電力も小さくて済む $2^{14} = 16{,}384$ Hz ではなく、$2^{15} = 32{,}768$ Hz で動きます。なぜですか。'],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Think about what a person near the watch could hear.', '時計のそばにいる人に何が聞こえるかを考えます。'],
        sol: [['The divider power grows with frequency, so the lowest workable frequency is best; the floor is set by hearing, which reaches about 16 to 20 kHz in young ears.', '分周器の電力は周波数とともに増えるので、使える最も低い周波数が最善です。その下限を決めるのは聴覚で、若い人の耳は 16〜20 kHz ほどまで聞こえます。'], ['$2^{15}$ is the first power of two clear of that, and a larger fork for a lower frequency would also be bulkier and more shock-sensitive. 32,768 is not divisible by 60, and accuracy comes from the stability of the resonance, not from its frequency.', '$2^{15}$ はそれを超える最初の二のべき乗です。より低い周波数のための大きな音叉はかさばり、衝撃にも弱くなります。32,768 は 60 で割り切れず、精度は周波数の高さではなく共振の安定性から来ます。']],
      };
    },
  ];

  /* ---------- 2. the BVD circuit ---------- */
  const C1Q = 2.0e-15, CL_D = 12.5e-12;
  const loadOff = (C1, C0, CL) => C1 / (2 * (C0 + CL));
  Q['bvd-circuit'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [fs, C1, unitL] = r.pick([[32768, r.pick([1.5, 2, 2.5, 3]) * 1e-15, 'kH'], [32768, 2.2e-15, 'kH'], [r.pick([4, 8, 10, 16, 20]) * 1e6, r.pick([10, 15, 20, 25]) * 1e-15, 'mH']]);
        const L1 = 1 / ((TAU * fs) ** 2 * C1), scale = unitL === 'kH' ? 1e-3 : 1e3;
        return {
          q: [`A crystal has series resonance $f_s = ${fs >= 1e6 ? n(fs / 1e6) + '\\ \\mathrm{MHz}' : '32{,}768\\ \\mathrm{Hz}'}$ and motional capacitance $C_1 = ${n(C1 * 1e15)}$ fF. What is its motional inductance $L_1$, in ${unitL}?`, `直列共振が $f_s = ${fs >= 1e6 ? n(fs / 1e6) + '\\ \\mathrm{MHz}' : '32{,}768\\ \\mathrm{Hz}'}$、動的容量が $C_1 = ${n(C1 * 1e15)}$ fF の水晶があります。動的インダクタンス $L_1$ は何 ${unitL} ですか。`],
          a: { type: 'num', v: L1 * scale, unit: [unitL, unitL] },
          hint: ['At series resonance $(2\\pi f_s)^2 L_1 C_1 = 1$.', '直列共振では $(2\\pi f_s)^2 L_1 C_1 = 1$ です。'],
          sol: [[`$L_1 = 1/((2\\pi f_s)^2 C_1) = 1/((${sig(TAU * fs, 4)})^2 \\times ${sig(C1, 2)}) = ${sig(L1, 3)}$ H.`, `$L_1 = 1/((2\\pi f_s)^2 C_1) = 1/((${sig(TAU * fs, 4)})^2 \\times ${sig(C1, 2)}) = ${sig(L1, 3)}$ H です。`], [`That is $${n(L1 * scale, 3)}$ ${unitL}: an enormous inductance, because the piezoelectric coupling is weak and a small moving mass looks huge through it.`, `つまり $${n(L1 * scale, 3)}$ ${unitL} です。圧電結合が弱いので、小さな可動質量が巨大なインダクタンスに見えるのです。`]],
        };
      }
      if (form === 1) {
        const R1 = r.step(10, 80, 5), fs = 32768, C1 = r.pick([1.8, 2, 2.4]) * 1e-15, L1 = 1 / ((TAU * fs) ** 2 * C1), Qv = TAU * fs * L1 / (R1 * 1e3);
        return {
          q: [`A 32,768 Hz crystal has $L_1 = ${n(L1 / 1000, 2)}$ kH and motional resistance $R_1 = ${R1}$ kΩ. What is its quality factor $Q = 2\\pi f_s L_1/R_1$?`, `32,768 Hz の水晶の $L_1 = ${n(L1 / 1000, 2)}$ kH、動的抵抗 $R_1 = ${R1}$ kΩ です。品質係数 $Q = 2\\pi f_s L_1/R_1$ はいくつですか。`],
          a: { type: 'num', v: TAU * fs * Number((L1 / 1000).toFixed(2)) * 1000 / (R1 * 1e3), rel: 0.005 },
          hint: ['Remember the kilo prefixes on both $L_1$ and $R_1$.', '$L_1$ と $R_1$ の両方にキロの接頭辞があることに注意します。'],
          sol: [[`$Q = 2\\pi \\times 32768 \\times ${n(L1 / 1000, 2)}\\times10^3 / (${R1}\\times10^3) = ${n(TAU * fs * Number((L1 / 1000).toFixed(2)) / R1, 0)}$.`, `$Q = 2\\pi \\times 32768 \\times ${n(L1 / 1000, 2)}\\times10^3 / (${R1}\\times10^3) = ${n(TAU * fs * Number((L1 / 1000).toFixed(2)) / R1, 0)}$ です。`], [`The resonance is about $f_s/Q = ${n(fs / Qv, 2)}$ Hz wide, roughly ${n(1e6 / Qv, 0)} ppm: far sharper than any LC circuit.`, `共振の幅はおよそ $f_s/Q = ${n(fs / Qv, 2)}$ Hz、約 ${n(1e6 / Qv, 0)} ppm で、どんな LC 回路よりもはるかに鋭いのです。`]],
          set: { R1 },
        };
      }
      const C0 = r.step(0.8, 2.5, 0.05), p = C1Q / (2 * C0 * 1e-12) * 1e6;
      return {
        q: [`A watch crystal has $C_1 = 2.0$ fF and shunt capacitance $C_0 = ${n(C0)}$ pF. To first order, how many ppm above $f_s$ is the parallel resonance $f_p$?`, `時計用水晶の $C_1 = 2.0$ fF、並列容量 $C_0 = ${n(C0)}$ pF です。一次の近似で、並列共振 $f_p$ は $f_s$ より何 ppm 高いですか。`],
        a: { type: 'num', v: p, rel: 0.003, unit: ['ppm', 'ppm'] },
        hint: ['$f_p = f_s\\sqrt{1 + C_1/C_0} \\approx f_s(1 + C_1/2C_0)$.', '$f_p = f_s\\sqrt{1 + C_1/C_0} \\approx f_s(1 + C_1/2C_0)$ です。'],
        sol: [[`$C_1/2C_0 = 2.0\\times10^{-15}/(2\\times${n(C0)}\\times10^{-12}) = ${sig(p * 1e-6, 4)}$.`, `$C_1/2C_0 = 2.0\\times10^{-15}/(2\\times${n(C0)}\\times10^{-12}) = ${sig(p * 1e-6, 4)}$ です。`], [`That is $${n(p, 1)}$ ppm: the whole inductive region, where the oscillator can run, is less than a thousandth wide.`, `つまり $${n(p, 1)}$ ppm です。発振器が動ける誘導性の領域全体が、千分の一にも満たない幅しかありません。`]],
        set: { C0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const C0 = r.step(0.9, 2.2, 0.05), CL = r.step(6, 20, 0.5), p = loadOff(C1Q, C0 * 1e-12, CL * 1e-12) * 1e6;
        return {
          q: [`A crystal with $C_1 = 2.0$ fF and $C_0 = ${n(C0)}$ pF runs with load capacitance $C_L = ${n(CL)}$ pF. How many ppm above $f_s$ does it oscillate?`, `$C_1 = 2.0$ fF、$C_0 = ${n(C0)}$ pF の水晶を負荷容量 $C_L = ${n(CL)}$ pF で動かします。$f_s$ より何 ppm 高い周波数で発振しますか。`],
          a: { type: 'num', v: p, rel: 0.003, unit: ['ppm', 'ppm'] },
          hint: ['$f_L \\approx f_s(1 + C_1/(2(C_0 + C_L)))$.', '$f_L \\approx f_s(1 + C_1/(2(C_0 + C_L)))$ です。'],
          sol: [[`$C_1/(2(C_0 + C_L)) = 2.0\\times10^{-15}/(2\\times${n(C0 + CL, 3)}\\times10^{-12}) = ${sig(p * 1e-6, 4)}$.`, `$C_1/(2(C_0 + C_L)) = 2.0\\times10^{-15}/(2\\times${n(C0 + CL, 3)}\\times10^{-12}) = ${sig(p * 1e-6, 4)}$ です。`], [`So the oscillator runs $${n(p, 2)}$ ppm above $f_s$, between $f_s$ and $f_p$ where the crystal is inductive and resonates with $C_L$.`, `したがって発振器は $f_s$ より $${n(p, 2)}$ ppm 高く動きます。水晶が誘導性で $C_L$ と共振する、$f_s$ と $f_p$ の間です。`]],
          set: { C0, CL },
        };
      }
      if (form === 1) {
        const C0 = r.step(1, 2, 0.05), a = r.step(8, 18, 0.5);
        let b = r.step(6, 20, 0.5); if (Math.abs(b - a) < 1) b = a < 13 ? a + 3 : a - 3;
        const pa = loadOff(C1Q, C0 * 1e-12, a * 1e-12) * 1e6, pb = loadOff(C1Q, C0 * 1e-12, b * 1e-12) * 1e6, d = pb - pa, s = d * 1e-6 * DAY;
        return {
          q: [`A watch crystal ($C_1 = 2.0$ fF, $C_0 = ${n(C0)}$ pF) keeps perfect time with $C_L = ${n(a)}$ pF. If the load becomes $${n(b)}$ pF, how many seconds a day does the watch gain? (Negative means it loses.)`, `時計用水晶（$C_1 = 2.0$ fF、$C_0 = ${n(C0)}$ pF）は $C_L = ${n(a)}$ pF で正確に時を刻みます。負荷が $${n(b)}$ pF になると、時計は一日に何秒進みますか（遅れる場合は負の値）。`],
          a: { type: 'num', v: s, rel: 0.01, tol: 0.003, unit: ['s/day', '秒/日'] },
          hint: ['Find the offset from $f_s$ at each load and subtract.', 'それぞれの負荷での $f_s$ からのずれを求めて引き算します。'],
          sol: [[`At $${n(a)}$ pF: $C_1/(2(C_0 + C_L)) = ${n(pa, 3)}$ ppm; at $${n(b)}$ pF: $${n(pb, 3)}$ ppm.`, `$${n(a)}$ pF では $C_1/(2(C_0 + C_L)) = ${n(pa, 3)}$ ppm、$${n(b)}$ pF では $${n(pb, 3)}$ ppm です。`], [`The change is $${sgn(d, 3)}$ ppm, which is $${sgn(s, 3)}$ s a day.`, `変化は $${sgn(d, 3)}$ ppm で、一日 $${sgn(s, 3)}$ 秒です。`], [`${b > a ? 'More' : 'Less'} load capacitance pulls the frequency ${b > a ? 'down toward $f_s$' : 'up toward $f_p$'}; this pulling is how watches were once regulated with a trimmer capacitor.`, `負荷容量を${b > a ? '増やすと周波数は下がって $f_s$ に' : '減らすと周波数は上がって $f_p$ に'}近づきます。かつて時計をトリマーコンデンサーで調整していたのはこの引き込みです。`]],
          set: { C0, CL: b },
        };
      }
      const R1 = r.step(10, 80, 5), C1 = 2e-15, fs = 32768, Qv = 1 / (TAU * fs * C1 * R1 * 1e3), bw = fs / Qv;
      return {
        q: [`A 32,768 Hz crystal has $C_1 = 2.0$ fF and $R_1 = ${R1}$ kΩ. Find its $Q$, using $Q = 1/(2\\pi f_s C_1 R_1)$, and the resonance width $f_s/Q$ in Hz.`, `32,768 Hz の水晶の $C_1 = 2.0$ fF、$R_1 = ${R1}$ kΩ です。$Q = 1/(2\\pi f_s C_1 R_1)$ を使って $Q$ と、共振の幅 $f_s/Q$（Hz）を求めてください。`],
        a: { type: 'tuple', v: [Qv, bw], labels: ['$Q$', ['$f_s/Q$ (Hz)', '$f_s/Q$（Hz）']], rel: 0.005 },
        hint: ['At resonance $2\\pi f_s L_1 = 1/(2\\pi f_s C_1)$, so either form of $Q$ works.', '共振では $2\\pi f_s L_1 = 1/(2\\pi f_s C_1)$ なので、どちらの形の $Q$ でも使えます。'],
        sol: [[`$Q = 1/(2\\pi \\times 32768 \\times 2.0\\times10^{-15} \\times ${R1}\\times10^3) = ${n(Qv, 0)}$.`, `$Q = 1/(2\\pi \\times 32768 \\times 2.0\\times10^{-15} \\times ${R1}\\times10^3) = ${n(Qv, 0)}$ です。`], [`$f_s/Q = 32768/${n(Qv, 0)} = ${n(bw, 3)}$ Hz, or $${n(1e6 / Qv, 1)}$ ppm.`, `$f_s/Q = 32768/${n(Qv, 0)} = ${n(bw, 3)}$ Hz、つまり $${n(1e6 / Qv, 1)}$ ppm です。`], ['A smaller $R_1$ means a sharper resonance and an oscillator that needs less drive; the readout quotes the same numbers.', '$R_1$ が小さいほど共振は鋭く、発振器に必要な駆動も小さくなります。読み取り欄にも同じ数値が出ます。']],
        set: { R1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const C0 = r.step(1, 2, 0.05), CLt = r.step(7, 19, 0.1);
        const target = loadOff(C1Q, C0 * 1e-12, CLt * 1e-12) - loadOff(C1Q, C0 * 1e-12, CL_D);
        const rate = Number((target * DAY).toPrecision(3)), back = rate / DAY + loadOff(C1Q, C0 * 1e-12, CL_D), CL = (C1Q / (2 * back) - C0 * 1e-12) * 1e12;
        return {
          q: [`A crystal ($C_1 = 2.0$ fF, $C_0 = ${n(C0)}$ pF) is cut to keep perfect time at $C_L = 12.5$ pF. What load capacitance makes the watch ${rate >= 0 ? 'gain' : 'lose'} $${n(Math.abs(rate), 4)}$ s a day? Give pF.`, `水晶（$C_1 = 2.0$ fF、$C_0 = ${n(C0)}$ pF）は $C_L = 12.5$ pF で正確になるように切られています。時計が一日に $${n(Math.abs(rate), 4)}$ 秒${rate >= 0 ? '進む' : '遅れる'}のは、負荷容量が何 pF のときですか。`],
          a: { type: 'num', v: CL, rel: 0.004, unit: ['pF', 'pF'] },
          hint: ['Turn the rate into ppm, add the design offset $C_1/(2(C_0 + 12.5\\ \\mathrm{pF}))$, then solve $C_1/(2(C_0 + C_L))$ for $C_L$.', '歩度を ppm に直し、設計時のずれ $C_1/(2(C_0 + 12.5\\ \\mathrm{pF}))$ を足してから、$C_1/(2(C_0 + C_L))$ を $C_L$ について解きます。'],
          sol: [[`The rate is $${sgn(rate / DAY * 1e6, 3)}$ ppm; the design offset is $${n(loadOff(C1Q, C0 * 1e-12, CL_D) * 1e6, 3)}$ ppm, so the new offset is $${n(back * 1e6, 3)}$ ppm.`, `歩度は $${sgn(rate / DAY * 1e6, 3)}$ ppm、設計時のずれは $${n(loadOff(C1Q, C0 * 1e-12, CL_D) * 1e6, 3)}$ ppm なので、新しいずれは $${n(back * 1e6, 3)}$ ppm です。`], [`$C_0 + C_L = C_1/(2 \\times ${sig(back, 4)}) = ${n((C1Q / (2 * back)) * 1e12, 3)}$ pF, so $C_L = ${n(CL, 2)}$ pF.`, `$C_0 + C_L = C_1/(2 \\times ${sig(back, 4)}) = ${n((C1Q / (2 * back)) * 1e12, 3)}$ pF なので $C_L = ${n(CL, 2)}$ pF です。`], [`${rate >= 0 ? 'Gaining needs less load capacitance' : 'Losing needs more load capacitance'}; move the handle on the rate curve to that value to see it.`, `${rate >= 0 ? '進ませるには負荷容量を減らし' : '遅らせるには負荷容量を増やし'}ます。歩度の曲線のハンドルをその値に動かすと確かめられます。`]],
          set: { C0, CL: CLt },
        };
      }
      if (form === 1) {
        const C0 = r.step(0.8, 2.5, 0.05), CL = r.step(6, 20, 0.5), sens = C1Q / (2 * ((C0 + CL) * 1e-12) ** 2) * 1e-12 * 1e6;
        return {
          q: [`For $C_1 = 2.0$ fF, $C_0 = ${n(C0)}$ pF and $C_L = ${n(CL)}$ pF, how many ppm does the frequency fall per extra picofarad of load (the size of $d(\\Delta f/f)/dC_L$)?`, `$C_1 = 2.0$ fF、$C_0 = ${n(C0)}$ pF、$C_L = ${n(CL)}$ pF のとき、負荷を 1 ピコファラッド増やすごとに周波数は何 ppm 下がりますか（$d(\\Delta f/f)/dC_L$ の大きさ）。`],
          a: { type: 'num', v: sens, rel: 0.005, unit: ['ppm/pF', 'ppm/pF'] },
          hint: ['Differentiate $C_1/(2(C_0 + C_L))$ with respect to $C_L$.', '$C_1/(2(C_0 + C_L))$ を $C_L$ で微分します。'],
          sol: [['$\\dfrac{d}{dC_L}\\dfrac{C_1}{2(C_0 + C_L)} = -\\dfrac{C_1}{2(C_0 + C_L)^2}$.', '$\\dfrac{d}{dC_L}\\dfrac{C_1}{2(C_0 + C_L)} = -\\dfrac{C_1}{2(C_0 + C_L)^2}$ です。'], [`$2.0\\times10^{-15}/(2 \\times (${n(C0 + CL, 3)}\\times10^{-12})^2) = ${sig(sens * 1e6, 3)}$ per farad, that is $${n(sens, 3)}$ ppm per pF.`, `$2.0\\times10^{-15}/(2 \\times (${n(C0 + CL, 3)}\\times10^{-12})^2) = ${sig(sens * 1e6, 3)}$（1 ファラッドあたり）、つまり 1 pF あたり $${n(sens, 3)}$ ppm です。`], ['The sensitivity falls as the square of the total capacitance, so a small load is easy to trim but also easily disturbed by stray capacitance.', '感度は全容量の二乗で小さくなります。小さな負荷は調整しやすい反面、浮遊容量にも乱されやすいのです。']],
          set: { C0, CL },
        };
      }
      if (r.chance(0.5)) {
        return {
          q: ['In the Butterworth–Van Dyke model, write $f_p/f_s$ exactly as a function of the capacitance ratio $x = C_1/C_0$.', 'バターワース・ヴァン・ダイクのモデルで、$f_p/f_s$ を容量比 $x = C_1/C_0$ の関数として厳密に書いてください。'],
          a: { type: 'expr', v: 'sqrt(1+x)', vars: ['x'], dom: { x: [0.0001, 0.5] }, lhs: ['$f_p/f_s =$', '$f_p/f_s =$'] },
          hint: ['At $f_p$ the motional arm, inductive above $f_s$, resonates with $C_0$: the arm and $C_0$ are in series around the loop, so their capacitances combine in series.', '$f_p$ では、$f_s$ より上で誘導性になる動的アームが $C_0$ と共振します。ループを一周するとアームと $C_0$ は直列なので、容量は直列に合成されます。'],
          sol: [['Around the loop $L_1$ sees $C_1$ and $C_0$ in series, $C_1C_0/(C_1 + C_0)$, so $f_p = 1/(2\\pi\\sqrt{L_1 C_1 C_0/(C_1 + C_0)})$.', 'ループを一周すると $L_1$ には $C_1$ と $C_0$ の直列 $C_1C_0/(C_1 + C_0)$ がつながるので、$f_p = 1/(2\\pi\\sqrt{L_1 C_1 C_0/(C_1 + C_0)})$ です。'], ['Dividing by $f_s = 1/(2\\pi\\sqrt{L_1C_1})$ gives $f_p/f_s = \\sqrt{(C_0 + C_1)/C_0} = \\sqrt{1 + x}$.', '$f_s = 1/(2\\pi\\sqrt{L_1C_1})$ で割ると $f_p/f_s = \\sqrt{(C_0 + C_1)/C_0} = \\sqrt{1 + x}$ です。'], ['For a watch crystal $x \\approx 0.0015$, so $f_p$ is only about $x/2 \\approx 770$ ppm above $f_s$.', '時計用水晶では $x \\approx 0.0015$ なので、$f_p$ は $f_s$ よりわずか $x/2 \\approx 770$ ppm 高いだけです。']],
        };
      }
      const opts = [
        ['Between $f_s$ and $f_p$', '$f_s$ と $f_p$ の間'],
        ['Below $f_s$', '$f_s$ より下'],
        ['Above $f_p$', '$f_p$ より上'],
        ['Exactly at $f_s$', 'ちょうど $f_s$'],
      ];
      return {
        q: ['In a Pierce oscillator the crystal must behave as an inductor that resonates with the load capacitance. In which frequency range is a quartz crystal inductive?', 'ピアース発振器では、水晶は負荷容量と共振するインダクタとしてふるまわなければなりません。水晶が誘導性になるのはどの周波数範囲ですか。'],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Look at the phase plot: positive phase means the voltage leads the current.', '位相のグラフを見ます。位相が正なら電圧が電流より進んでいます。'],
        sol: [['Below $f_s$ the motional arm is capacitive, and $C_0$ is capacitive too, so the crystal is capacitive. At $f_s$ the arm is purely resistive.', '$f_s$ より下では動的アームは容量性で $C_0$ も容量性なので、水晶は容量性です。$f_s$ ではアームは純抵抗です。'], ['Just above $f_s$ the arm turns inductive and dominates until it resonates with $C_0$ at $f_p$; above $f_p$ the crystal is capacitive again. So the inductive window is between $f_s$ and $f_p$, under a thousandth wide, which is why the oscillator frequency is pinned so tightly.', '$f_s$ を少し超えるとアームは誘導性になり、$f_p$ で $C_0$ と共振するまで支配的です。$f_p$ より上で水晶は再び容量性です。したがって誘導性の窓は $f_s$ と $f_p$ の間で、その幅は千分の一に満たず、発振周波数がそれほど強く固定される理由になっています。']],
      };
    },
  ];

  /* ---------- 3. temperature ---------- */
  const BT = 0.034, T0 = 25, CUT = 10, STEP = 1e6 / (32768 * 60);
  const tOff = (T) => -BT * (T - T0) ** 2;
  Q['quartz-temperature'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const T = r.pick([5, 10, 15, 18, 20, 30, 31, 32, 35, 37, 40, 0, -5]), o = tOff(T);
        return {
          q: [`A tuning-fork crystal has turnover temperature 25 °C and parabolic coefficient $\\beta = 0.034$ ppm/°C². What is its frequency offset at $${T}$ °C, in ppm?`, `頂点温度 25 °C、放物線の係数 $\\beta = 0.034$ ppm/°C² の音叉型水晶があります。$${T}$ °C での周波数のずれは何 ppm ですか。`],
          a: { type: 'num', v: o, tol: 0.002, unit: ['ppm', 'ppm'] },
          hint: ['$\\Delta f/f = -\\beta(T - T_0)^2$.', '$\\Delta f/f = -\\beta(T - T_0)^2$ です。'],
          sol: [[`$-0.034 \\times (${T} - 25)^2 = -0.034 \\times ${(T - 25) ** 2} = ${n(o, 3)}$ ppm.`, `$-0.034 \\times (${T} - 25)^2 = -0.034 \\times ${(T - 25) ** 2} = ${n(o, 3)}$ ppm です。`], [`That is ${n(Math.abs(o) * 0.0864, 3)} s a day slow. The sign is negative whether it is hotter or colder than 25 °C: the turnover is a maximum.`, `一日 ${n(Math.abs(o) * 0.0864, 3)} 秒の遅れです。25 °C より暑くても寒くても符号は負で、頂点は最大値なのです。`]],
          set: T >= 20 && T <= 37 ? { Twrist: T } : undefined,
        };
      }
      if (form === 1) {
        const k = r.int(1, 40), ppm = k * STEP;
        return {
          q: [`The divider of a 32,768 Hz watch removes $${k}$ pulse${k > 1 ? 's' : ''} every minute (inhibition). By how many ppm does this slow the watch?`, `32,768 Hz の時計の分周器が毎分 $${k}$ パルスを取り除きます（インヒビション）。これで時計は何 ppm 遅くなりますか。`],
          a: { type: 'num', v: ppm, rel: 0.003, unit: ['ppm', 'ppm'] },
          hint: ['Count the pulses in a minute.', '一分間のパルスの数を数えます。'],
          sol: [[`A minute holds $32768 \\times 60 = 1{,}966{,}080$ pulses, so removing ${k} is a fraction $${k}/1966080$.`, `一分間には $32768 \\times 60 = 1{,}966{,}080$ パルスあるので、${k} 個を取り除くのは $${k}/1966080$ の割合です。`], [`That is $${n(ppm, 3)}$ ppm, or $${n(ppm * 0.0864, 3)}$ s a day. Each pulse is a step of 0.509 ppm, the resolution of this digital trim.`, `つまり $${n(ppm, 3)}$ ppm、一日 $${n(ppm * 0.0864, 3)}$ 秒です。一パルスが 0.509 ppm の刻みで、このデジタル調整の分解能です。`]],
          set: { n: k },
        };
      }
      const d = r.pick([4, 5, 6, 8, 10]), hot = 25 + d + r.pick([0, 2]), cold = 25 - d;
      const opts = [
        [`Equal losses at ${25 + d} °C and ${25 - d} °C; ${hot > 25 + d ? `at ${hot} °C it loses more` : 'the parabola is symmetric'}`, `${25 + d} °C と ${25 - d} °C では同じ遅れ。${hot > 25 + d ? `${hot} °C ではより多く遅れる` : '放物線は対称'}`],
        ['It gains when hot and loses when cold', '暑いと進み、寒いと遅れる'],
        ['It loses when hot and gains when cold', '暑いと遅れ、寒いと進む'],
        ['Temperature has no effect on a quartz watch', '温度はクォーツ時計に影響しない'],
      ];
      return {
        q: [`A quartz watch with turnover at 25 °C spends one day at ${cold} °C and another at ${hot} °C. Which statement is right?`, `頂点温度 25 °C のクォーツ時計が、一日を ${cold} °C で、別の一日を ${hot} °C で過ごします。正しいのはどれですか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['The offset depends on $(T - 25)^2$.', 'ずれは $(T - 25)^2$ で決まります。'],
        sol: [[`The offset is $-\\beta(T - 25)^2$, always negative: at ${cold} °C it is $${n(tOff(cold), 3)}$ ppm and at ${hot} °C $${n(tOff(hot), 3)}$ ppm.`, `ずれは $-\\beta(T - 25)^2$ で常に負です。${cold} °C では $${n(tOff(cold), 3)}$ ppm、${hot} °C では $${n(tOff(hot), 3)}$ ppm です。`], ['Both days lose time; only the distance from the turnover matters, not its direction.', 'どちらの日も遅れます。効くのは頂点からの距離だけで、その向きではありません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Tw = r.step(28, 34, 0.5), To = r.step(15, 23, 0.5), h = r.int(8, 20);
        const avg = (h * tOff(Tw) + (24 - h) * tOff(To)) / 24, month = avg * 0.0864 * 30;
        return {
          q: [`A watch ($\\beta = 0.034$ ppm/°C², turnover 25 °C) is worn $${h}$ h a day at $${n(Tw)}$ °C and left the rest of the day at $${n(To)}$ °C. What does the temperature term alone cost over a 30-day month, in seconds?`, `時計（$\\beta = 0.034$ ppm/°C²、頂点 25 °C）を一日 $${h}$ 時間 $${n(Tw)}$ °C で着け、残りの時間は $${n(To)}$ °C に置きます。温度の項だけで 30 日の一か月に何秒の誤差になりますか。`],
          a: { type: 'num', v: month, rel: 0.01, unit: ['s', '秒'] },
          hint: ['Average the two offsets weighted by hours, then convert ppm to seconds: 1 ppm = 0.0864 s/day.', '二つのずれを時間で重みづけして平均し、ppm を秒に直します。1 ppm = 0.0864 秒/日です。'],
          sol: [[`Offsets: $${n(tOff(Tw), 4)}$ ppm on the wrist, $${n(tOff(To), 4)}$ ppm off it.`, `ずれは腕の上で $${n(tOff(Tw), 4)}$ ppm、外している間は $${n(tOff(To), 4)}$ ppm です。`], [`Daily average: $(${h} \\times ${n(tOff(Tw), 4)} + ${24 - h} \\times ${n(tOff(To), 4)})/24 = ${n(avg, 4)}$ ppm.`, `一日の平均は $(${h} \\times ${n(tOff(Tw), 4)} + ${24 - h} \\times ${n(tOff(To), 4)})/24 = ${n(avg, 4)}$ ppm です。`], [`Over 30 days: $${n(avg, 4)} \\times 0.0864 \\times 30 = ${n(month, 2)}$ s. This loss is what the fast cut and the inhibition trim are set to cancel on average.`, `30 日では $${n(avg, 4)} \\times 0.0864 \\times 30 = ${n(month, 2)}$ 秒です。速めの切断とインヒビションの調整は、平均としてこの遅れを打ち消すように設定されます。`]],
          set: { Twrist: Tw, Toff: To, hours: h, tc: 0 },
        };
      }
      if (form === 1) {
        const k = r.int(10, 30), o = CUT - k * STEP, s = o * 0.0864;
        return {
          q: [`A crystal is cut $+10$ ppm fast, and the divider removes $${k}$ pulses a minute. At 25 °C, what is the net rate in seconds per day?`, `水晶は $+10$ ppm 速く切られ、分周器が毎分 $${k}$ パルスを取り除きます。25 °C での正味の歩度は一日何秒ですか。`],
          a: { type: 'num', v: s, tol: 0.0015, unit: ['s/day', '秒/日'] },
          hint: ['Each removed pulse per minute is $10^6/(32768 \\times 60) = 0.509$ ppm; at the turnover the temperature term is zero.', '毎分一パルスを取り除くごとに $10^6/(32768 \\times 60) = 0.509$ ppm です。頂点温度では温度の項は 0 です。'],
          sol: [[`$10 - ${k} \\times 0.5086 = ${n(o, 3)}$ ppm.`, `$10 - ${k} \\times 0.5086 = ${n(o, 3)}$ ppm です。`], [`$${n(o, 3)} \\times 0.0864 = ${n(s, 4)}$ s a day, ${s >= 0 ? 'fast' : 'slow'}. The trim is chosen per watch so that, once the temperature loss is included, the average comes out near zero.`, `$${n(o, 3)} \\times 0.0864 = ${n(s, 4)}$ 秒/日の${s >= 0 ? '進み' : '遅れ'}です。調整は時計ごとに選ばれ、温度による遅れを含めた平均がほぼ 0 になるようにします。`]],
          set: { n: k },
        };
      }
      const avg = r.pick([-1.1, -0.77, -0.5, 0.33, 0.8, -2.0, 1.4, -0.17]), per = r.pick([['month', '一か月', 30], ['year', '一年', 365], ['week', '一週間', 7]]);
      const s = avg * 0.0864 * per[2];
      return {
        q: [`A quartz watch's rate, averaged over its daily temperature cycle, is $${sgn(avg, 2)}$ ppm. How many seconds does it ${avg > 0 ? 'gain' : 'lose'} in a ${per[0]} (${per[2]} days)?`, `一日の温度の周期で平均したクォーツ時計の歩度が $${sgn(avg, 2)}$ ppm です。${per[1]}（${per[2]} 日）で何秒${avg > 0 ? '進み' : '遅れ'}ますか。`],
        a: { type: 'num', v: Math.abs(s), rel: 0.005, unit: ['s', '秒'] },
        hint: ['1 ppm is 0.0864 s a day.', '1 ppm は一日 0.0864 秒です。'],
        sol: [[`$${n(Math.abs(avg), 2)} \\times 0.0864 = ${n(Math.abs(avg) * 0.0864, 4)}$ s a day.`, `$${n(Math.abs(avg), 2)} \\times 0.0864 = ${n(Math.abs(avg) * 0.0864, 4)}$ 秒/日です。`], [`Over ${per[2]} days: $${n(Math.abs(s), 2)}$ s. Ordinary quartz is specified at about 15 s a month, so this is ${Math.abs(avg * 0.0864 * 30) < 15 ? 'well within' : 'outside'} that.`, `${per[2]} 日では $${n(Math.abs(s), 2)}$ 秒です。普通のクォーツの仕様は月におよそ 15 秒なので、これはその${Math.abs(avg * 0.0864 * 30) < 15 ? '範囲内に十分収まります' : '範囲外です'}。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.pick([4, 5, 6, 7, 8, 9, 10, 11, 12]), loss = BT * d * d, s = loss * 0.0864;
        return {
          q: [`A watch ($\\beta = 0.034$ ppm/°C², turnover 25 °C) spends 12 h a day at $${25 + d}$ °C and 12 h at $${25 - d}$ °C. Its average temperature is exactly the turnover. How many seconds a day does the temperature still cost?`, `時計（$\\beta = 0.034$ ppm/°C²、頂点 25 °C）が一日のうち 12 時間を $${25 + d}$ °C、12 時間を $${25 - d}$ °C で過ごします。平均温度はちょうど頂点温度です。それでも温度のせいで一日何秒遅れますか。`],
          a: { type: 'num', v: s, rel: 0.005, unit: ['s/day', '秒/日'] },
          hint: ['Average the offset, not the temperature: $\\overline{(T - T_0)^2} = (\\bar T - T_0)^2 + \\operatorname{Var}(T)$.', '温度ではなくずれを平均します。$\\overline{(T - T_0)^2} = (\\bar T - T_0)^2 + \\operatorname{Var}(T)$ です。'],
          sol: [[`Both halves of the day sit ${d} °C from the turnover, so the offset is $-0.034 \\times ${d * d} = ${n(-loss, 3)}$ ppm all day.`, `一日のどちらの半分も頂点から ${d} °C 離れているので、ずれは一日中 $-0.034 \\times ${d * d} = ${n(-loss, 3)}$ ppm です。`], [`$${n(loss, 3)} \\times 0.0864 = ${n(s, 4)}$ s a day lost. The mean temperature is perfect, yet the variance $${d * d}$ °C² costs $\\beta \\operatorname{Var}(T)$: a parabola punishes spread.`, `一日 $${n(loss, 3)} \\times 0.0864 = ${n(s, 4)}$ 秒の遅れです。平均温度は完璧でも、分散 $${d * d}$ °C² が $\\beta \\operatorname{Var}(T)$ の損失になります。放物線は広がりを罰するのです。`]],
          set: { Twrist: 25 + d, Toff: 25 - d, hours: 12, tc: 0 },
        };
      }
      if (form === 1) {
        let Tw, To, h, avgT, k;
        do { Tw = r.step(28, 35, 0.5); To = r.step(12, 24, 0.5); h = r.int(6, 22); avgT = (h * tOff(Tw) + (24 - h) * tOff(To)) / 24; k = Math.round((CUT + avgT) / STEP); } while (k < 0 || k > 40);
        const res = CUT + avgT - k * STEP;
        return {
          q: [`A crystal cut $+10$ ppm fast is worn $${h}$ h a day at $${n(Tw)}$ °C and kept at $${n(To)}$ °C otherwise ($\\beta = 0.034$ ppm/°C², turnover 25 °C). Each pulse removed per minute slows it by 0.5086 ppm. How many pulses per minute should the watchmaker remove to make the average rate as close to zero as possible?`, `$+10$ ppm 速く切った水晶の時計を一日 $${h}$ 時間 $${n(Tw)}$ °C で着け、それ以外は $${n(To)}$ °C に置きます（$\\beta = 0.034$ ppm/°C²、頂点 25 °C）。毎分一パルス取り除くごとに 0.5086 ppm 遅くなります。平均の歩度をできるだけ 0 に近づけるには、毎分何パルス取り除けばよいですか。`],
          a: { type: 'int', v: k },
          hint: ['Find the daily-average temperature offset first; the trim must cancel $10$ ppm plus that (negative) offset.', 'まず一日平均の温度によるずれを求めます。調整が打ち消すべきなのは 10 ppm とその（負の）ずれの和です。'],
          sol: [[`Temperature term: $-0.034 \\times (${h} \\times ${n((Tw - 25) ** 2, 2)} + ${24 - h} \\times ${n((To - 25) ** 2, 2)})/24 = ${n(avgT, 3)}$ ppm.`, `温度の項は $-0.034 \\times (${h} \\times ${n((Tw - 25) ** 2, 2)} + ${24 - h} \\times ${n((To - 25) ** 2, 2)})/24 = ${n(avgT, 3)}$ ppm です。`], [`The trim must remove $10 ${avgT < 0 ? '-' : '+'} ${n(Math.abs(avgT), 3)} = ${n(CUT + avgT, 3)}$ ppm, which is $${n(CUT + avgT, 3)}/0.5086 = ${n((CUT + avgT) / STEP, 2)}$ pulses: round to $${k}$.`, `調整で取り除くべきは $10 ${avgT < 0 ? '-' : '+'} ${n(Math.abs(avgT), 3)} = ${n(CUT + avgT, 3)}$ ppm で、$${n(CUT + avgT, 3)}/0.5086 = ${n((CUT + avgT) / STEP, 2)}$ パルスです。丸めて $${k}$ です。`], [`The residual is $${sgn(res, 3)}$ ppm, $${sgn(res * 0.0864 * 30, 2)}$ s a month: the 0.5 ppm step size limits how well a single trim can do.`, `残りは $${sgn(res, 3)}$ ppm、月に $${sgn(res * 0.0864 * 30, 2)}$ 秒です。0.5 ppm の刻みが、一回の調整で達成できる精度の限界です。`]],
          set: { Twrist: Tw, Toff: To, hours: h, n: k, tc: 0 },
        };
      }
      const a = r.pick([4, 5, 6, 7]), b = r.pick([3, 4, 5, 6, 8]);
      const A = a * a, B = b * b;
      return {
        q: [`A watch ($\\beta = 0.034$ ppm/°C², turnover 25 °C) is worn $h$ hours a day at $${25 + a}$ °C and spends the rest at $${25 - b}$ °C. Write its daily-average temperature offset, in ppm, as a function of $h$.`, `時計（$\\beta = 0.034$ ppm/°C²、頂点 25 °C）を一日 $h$ 時間 $${25 + a}$ °C で着け、残りを $${25 - b}$ °C で過ごします。一日平均の温度によるずれ（ppm）を $h$ の関数として書いてください。`],
        a: { type: 'expr', v: `-0.034*(${A}*h+${B}*(24-h))/24`, vars: ['h'], dom: { h: [0, 24] }, lhs: ['$\\overline{\\Delta f/f} =$', '$\\overline{\\Delta f/f} =$'] },
        hint: ['Weight each offset by the fraction of the day it lasts.', 'それぞれのずれを、一日のうちそれが続く割合で重みづけします。'],
        sol: [[`On the wrist the offset is $-0.034 \\times ${A}$, off it $-0.034 \\times ${B}$ ppm.`, `腕の上ではずれは $-0.034 \\times ${A}$、外している間は $-0.034 \\times ${B}$ ppm です。`], [`Average: $-0.034\\,(${A}h + ${B}(24 - h))/24$ ppm, a straight line in $h$ ${A > B ? 'falling' : A < B ? 'rising' : 'that is flat'} as the watch is worn longer.`, `平均は $-0.034\\,(${A}h + ${B}(24 - h))/24$ ppm で、着ける時間が長くなるほど${A > B ? '下がる' : A < B ? '上がる' : '変わらない'} $h$ の一次関数です。`], ['Because the cost is linear in hours but quadratic in temperature, a cool bedside table can be worse for the rate than a warm wrist.', '損失は時間には一次、温度には二次で効くので、涼しいベッドサイドの方が温かい腕より歩度に悪いこともあります。']],
        set: { Twrist: 25 + a, Toff: 25 - b, tc: 0 },
      };
    },
  ];
})();
