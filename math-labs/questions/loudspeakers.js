'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, RHO = 1.18, C = 343, RE = 6, SD = 0.0133;
  const s3 = (x) => sig(x, 3);
  const deg = (x) => x * 180 / PI, rad = (d) => d * PI / 180;
  const snap = (x, step, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / step) * step));
  const r2 = (x) => Math.round(x * 100) / 100;
  const lfOf = (f, lo, hi) => Math.min(hi, Math.max(lo, r2(Math.log10(f))));
  const db = (x) => 20 * Math.log10(x);

  /* Thiele-Small parameters from the lab's units: Bl (T m), M (g), Cm (mm/N), R (kg/s) */
  function ts(Bl, Mg, Cmm, Rms = 1, Sd = SD) {
    const M = Mg / 1000, Cm = Cmm / 1000, fs = 1 / (TAU * Math.sqrt(M * Cm));
    const Qms = TAU * fs * M / Rms, Qes = TAU * fs * M * RE / (Bl * Bl);
    const eta = RHO * Bl * Bl * Sd * Sd / (TAU * C * RE * M * M);
    return { fs, Qms, Qes, Qts: Qms * Qes / (Qms + Qes), Vas: RHO * C * C * Sd * Sd * Cm, eta, spl: 112.1 + 10 * Math.log10(eta), Zmax: RE + Bl * Bl / Rms };
  }
  const DRV = ts(7.5, 15, 1.0, 1.0);

  /* ---------------- 1. driver impedance ---------------- */
  Q['driver-impedance'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.pick([8, 10, 12, 15, 20, 25, 30, 35]), Cm = r.pick([0.5, 0.6, 0.8, 1, 1.2, 1.5, 2]);
        const fs = 1 / (TAU * Math.sqrt(M * Cm * 1e-6));
        return {
          q: [`A woofer has moving mass $M_{ms} = ${M}$ g and suspension compliance $C_{ms} = ${n(Cm)}$ mm/N. What is its free-air resonance $f_s$?`, `可動質量 $M_{ms} = ${M}$ g、サスペンションのコンプライアンス $C_{ms} = ${n(Cm)}$ mm/N のウーファーがあります。自由空間での共振周波数 $f_s$ はいくらですか。`],
          a: { type: 'num', v: fs, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['A mass on a spring: $f_s = 1/(2\\pi\\sqrt{M_{ms}C_{ms}})$, in kilograms and metres per newton.', 'ばねにつながった質量です。$f_s = 1/(2\\pi\\sqrt{M_{ms}C_{ms}})$ を、キログラムとメートル毎ニュートンで計算します。'],
          sol: [[`$M_{ms}C_{ms} = ${n(M / 1000)}\\times${n(Cm / 1000)} = ${n(M * Cm * 1e-6)}\\ \\mathrm{s^2}$.`, `$M_{ms}C_{ms} = ${n(M / 1000)}\\times${n(Cm / 1000)} = ${n(M * Cm * 1e-6)}\\ \\mathrm{s^2}$ です。`], [`$f_s = 1/(2\\pi\\sqrt{${n(M * Cm * 1e-6)}}) = ${s3(fs)}$ Hz.`, `$f_s = 1/(2\\pi\\sqrt{${n(M * Cm * 1e-6)}}) = ${s3(fs)}$ Hz です。`], ['A heavier cone or a softer suspension lowers the resonance; this is where the impedance curve peaks.', 'コーンが重いほど、またサスペンションが柔らかいほど共振は下がります。インピーダンス曲線がピークになるのはここです。']],
          set: { Mms: M, Cms: Cm },
        };
      }
      if (form === 1) {
        const Bl = r.pick([5, 6, 7.5, 8, 9, 10]), R = r.pick([0.5, 0.8, 1, 1.5, 2, 2.5]);
        const Z = RE + Bl * Bl / R;
        return {
          q: [`A driver has $R_e = 6\\ \\Omega$, $Bl = ${n(Bl)}$ T·m and mechanical resistance $R_{ms} = ${n(R)}$ kg/s. How high is the impedance peak at $f_s$?`, `$R_e = 6\\ \\Omega$、$Bl = ${n(Bl)}$ T·m、機械抵抗 $R_{ms} = ${n(R)}$ kg/s のドライバーがあります。$f_s$ でのインピーダンスのピークはいくらですか。`],
          a: { type: 'num', v: Z, unit: ['Ω', 'Ω'] },
          hint: ['At resonance the mass and spring cancel, so only $R_{ms}$ is left in the mechanical branch, and the coil sees it as $(Bl)^2/R_{ms}$.', '共振では質量とばねが打ち消し合い、機械側には $R_{ms}$ だけが残ります。コイルからはそれが $(Bl)^2/R_{ms}$ に見えます。'],
          sol: [[`The motional impedance at $f_s$ is $(Bl)^2/R_{ms} = ${n(Bl * Bl)}/${n(R)} = ${n(Bl * Bl / R, 3)}\\ \\Omega$.`, `$f_s$ での動インピーダンスは $(Bl)^2/R_{ms} = ${n(Bl * Bl)}/${n(R)} = ${n(Bl * Bl / R, 3)}\\ \\Omega$ です。`], [`Add the coil resistance: $Z_{\\max} = 6 + ${n(Bl * Bl / R, 3)} = ${n(Z, 3)}\\ \\Omega$ (ignoring $L_e$, which matters only at higher frequencies).`, `コイルの抵抗を足して $Z_{\\max} = 6 + ${n(Bl * Bl / R, 3)} = ${n(Z, 3)}\\ \\Omega$ です（$L_e$ は高い周波数でしか効かないので無視します）。`], ['The less mechanical loss, the taller the peak: the impedance curve is a mirror of how freely the cone moves.', '機械的な損失が小さいほどピークは高くなります。インピーダンス曲線は、コーンがどれだけ自由に動くかを映しています。']],
          set: { Bl, Rms: R, Mms: 15, Cms: 1, fsel: lfOf(DRV.fs, 1, 4.3) },
        };
      }
      const Qms = r.pick([2, 3, 4, 5, 8]), Qes = r.pick([0.3, 0.35, 0.4, 0.5, 0.6, 0.8]), Qts = Qms * Qes / (Qms + Qes);
      return {
        q: [`A driver has $Q_{ms} = ${n(Qms)}$ and $Q_{es} = ${n(Qes)}$. What is its total $Q_{ts}$? Give three decimals.`, `$Q_{ms} = ${n(Qms)}$、$Q_{es} = ${n(Qes)}$ のドライバーの全体の $Q_{ts}$ はいくらですか。小数第3位まで求めてください。`],
        a: { type: 'num', v: Qts, tol: 0.0006 },
        hint: ['The two dampings act together, so their inverse Q values add: $1/Q_{ts} = 1/Q_{ms} + 1/Q_{es}$.', '二つの制動は同時に働くので、Q の逆数が足し合わされます。$1/Q_{ts} = 1/Q_{ms} + 1/Q_{es}$ です。'],
        sol: [[`$Q_{ts} = \\dfrac{Q_{ms}Q_{es}}{Q_{ms} + Q_{es}} = \\dfrac{${n(Qms * Qes)}}{${n(Qms + Qes)}} = ${n(Qts, 4)}$.`, `$Q_{ts} = \\dfrac{Q_{ms}Q_{es}}{Q_{ms} + Q_{es}} = \\dfrac{${n(Qms * Qes)}}{${n(Qms + Qes)}} = ${n(Qts, 4)}$ です。`], ['It is below the smaller of the two: in most drivers the electrical damping through the amplifier dominates, and $Q_{ts}$ is close to $Q_{es}$.', '値は二つのうち小さいほうよりさらに小さくなります。多くのドライバーではアンプを通した電気的な制動が支配的で、$Q_{ts}$ は $Q_{es}$ に近くなります。']],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const Bl = r.pick([5, 6, 7.5, 8, 9, 10, 11]), M = r.pick([10, 12, 15, 20, 25]), Cm = r.pick([0.6, 0.8, 1, 1.2, 1.5]);
        const T = ts(Bl, M, Cm);
        return {
          q: [`Find $Q_{es}$ for a driver with $R_e = 6\\ \\Omega$, $Bl = ${n(Bl)}$ T·m, $M_{ms} = ${M}$ g, $C_{ms} = ${n(Cm)}$ mm/N. Give three decimals.`, `$R_e = 6\\ \\Omega$、$Bl = ${n(Bl)}$ T·m、$M_{ms} = ${M}$ g、$C_{ms} = ${n(Cm)}$ mm/N のドライバーの $Q_{es}$ を求めてください。小数第3位までです。`],
          a: { type: 'num', v: T.Qes, tol: 0.0008 },
          hint: ['First find $f_s$; then $Q_{es} = 2\\pi f_s M_{ms}R_e/(Bl)^2$.', 'まず $f_s$ を求め、次に $Q_{es} = 2\\pi f_s M_{ms}R_e/(Bl)^2$ を使います。'],
          sol: [[`$f_s = 1/(2\\pi\\sqrt{${n(M / 1000)}\\times${n(Cm / 1000)}}) = ${s3(T.fs)}$ Hz.`, `$f_s = 1/(2\\pi\\sqrt{${n(M / 1000)}\\times${n(Cm / 1000)}}) = ${s3(T.fs)}$ Hz です。`], [`$Q_{es} = \\dfrac{2\\pi\\times${s3(T.fs)}\\times${n(M / 1000)}\\times 6}{${n(Bl * Bl)}} = ${n(T.Qes, 4)}$.`, `$Q_{es} = \\dfrac{2\\pi\\times${s3(T.fs)}\\times${n(M / 1000)}\\times 6}{${n(Bl * Bl)}} = ${n(T.Qes, 4)}$ です。`], ['$Q_{es}$ falls as $(Bl)^2$ grows: a stronger motor turns cone velocity into back voltage, and the amplifier\'s low output impedance brakes it.', '$Q_{es}$ は $(Bl)^2$ が大きいほど小さくなります。強い磁気回路はコーンの速度を逆起電力に変え、アンプの低い出力インピーダンスがそれにブレーキをかけます。']],
          set: { Bl, Mms: M, Cms: Cm },
        };
      }
      if (form === 1) {
        const [size, sd] = r.pick([['5', 85], ['6.5', 133], ['8', 220], ['10', 330], ['12', 530]]), Cm = r.pick([0.4, 0.6, 0.8, 1, 1.2, 1.5, 2]);
        const Vas = RHO * C * C * (sd * 1e-4) ** 2 * Cm * 1e-3 * 1000;
        return {
          q: [`A ${size}-inch woofer has cone area $S_d = ${sd}\\ \\mathrm{cm^2}$ and $C_{ms} = ${n(Cm)}$ mm/N. What is its equivalent air volume $V_{as}$ ($\\rho = 1.18\\ \\mathrm{kg/m^3}$, $c = 343$ m/s)?`, `${size} インチのウーファーのコーン面積は $S_d = ${sd}\\ \\mathrm{cm^2}$、$C_{ms} = ${n(Cm)}$ mm/N です。等価空気容積 $V_{as}$ はいくらですか（$\\rho = 1.18\\ \\mathrm{kg/m^3}$、$c = 343$ m/s）。`],
          a: { type: 'num', v: Vas, rel: 0.01, unit: ['litres', 'リットル'] },
          hint: ['$V_{as} = \\rho c^2 S_d^2 C_{ms}$ is the volume of air whose compliance, through the cone area, equals the suspension\'s.', '$V_{as} = \\rho c^2 S_d^2 C_{ms}$ は、コーン面積を通して見たコンプライアンスがサスペンションと等しくなる空気の体積です。'],
          sol: [[`$S_d = ${n(sd * 1e-4)}\\ \\mathrm{m^2}$, $C_{ms} = ${n(Cm * 1e-3)}$ m/N.`, `$S_d = ${n(sd * 1e-4)}\\ \\mathrm{m^2}$、$C_{ms} = ${n(Cm * 1e-3)}$ m/N です。`], [`$V_{as} = 1.18\\times 343^2\\times ${n(sd * 1e-4)}^2\\times${n(Cm * 1e-3)} = ${sig(Vas / 1000, 3)}\\ \\mathrm{m^3} = ${s3(Vas)}$ L.`, `$V_{as} = 1.18\\times 343^2\\times ${n(sd * 1e-4)}^2\\times${n(Cm * 1e-3)} = ${sig(Vas / 1000, 3)}\\ \\mathrm{m^3} = ${s3(Vas)}$ L です。`], ['A box much smaller than $V_{as}$ is stiffer than the suspension and takes over as the restoring spring.', '$V_{as}$ よりずっと小さな箱はサスペンションより硬く、復元ばねの役を引き継ぎます。']],
          set: { Cms: Cm },
        };
      }
      if (form === 2) {
        const Bl = r.pick([5, 6, 7.5, 8, 10]), Cm = r.pick([0.5, 0.8, 1, 1.2, 1.5, 2]), V = 2.83;
        const x = Bl * V / RE * Cm;
        return {
          q: [`Well below resonance, how far does the cone move for a peak drive of $2.83$ V? The driver has $R_e = 6\\ \\Omega$, $Bl = ${n(Bl)}$ T·m, $C_{ms} = ${n(Cm)}$ mm/N.`, `共振よりずっと低い周波数で、ピーク $2.83$ V の駆動に対しコーンはどれだけ動きますか。ドライバーは $R_e = 6\\ \\Omega$、$Bl = ${n(Bl)}$ T·m、$C_{ms} = ${n(Cm)}$ mm/N です。`],
          a: { type: 'num', v: x, rel: 0.01, unit: ['mm', 'mm'] },
          hint: ['Far below $f_s$ the cone barely moves, so there is no back voltage: the current is $V/R_e$, and the spring alone holds the force.', '$f_s$ よりずっと下ではコーンはゆっくりしか動かず逆起電力はありません。電流は $V/R_e$ で、その力をばねだけが受け止めます。'],
          sol: [[`$I = 2.83/6 = ${n(V / RE, 4)}$ A, so the force is $F = BlI = ${n(Bl * V / RE, 4)}$ N.`, `$I = 2.83/6 = ${n(V / RE, 4)}$ A なので、力は $F = BlI = ${n(Bl * V / RE, 4)}$ N です。`], [`The suspension gives $x = C_{ms}F = ${n(Cm)}\\times${n(Bl * V / RE, 4)} = ${n(x, 3)}$ mm.`, `サスペンションにより $x = C_{ms}F = ${n(Cm)}\\times${n(Bl * V / RE, 4)} = ${n(x, 3)}$ mm です。`], ['This is the flat part of the excursion curve; above $f_s$ the mass takes over and the excursion falls as $1/f^2$.', 'これが振幅の曲線の平らな部分です。$f_s$ より上では質量が支配し、振幅は $1/f^2$ で下がります。']],
          set: { Bl, Cms: Cm, fsel: 1 },
        };
      }
      const Bl = r.pick([5, 6, 7, 7.5, 8, 9, 10]), M = r.pick([10, 12, 15, 18, 20, 25]);
      const T = ts(Bl, M, 1);
      return {
        q: [`Estimate the sensitivity (dB at 1 W, 1 m) of a driver with $R_e = 6\\ \\Omega$, $Bl = ${n(Bl)}$ T·m, $M_{ms} = ${M}$ g and $S_d = 133\\ \\mathrm{cm^2}$. Use $\\eta_0 = \\rho(Bl)^2S_d^2/(2\\pi cR_eM_{ms}^2)$ and $L = 112.1 + 10\\log_{10}\\eta_0$. Give one decimal.`, `$R_e = 6\\ \\Omega$、$Bl = ${n(Bl)}$ T·m、$M_{ms} = ${M}$ g、$S_d = 133\\ \\mathrm{cm^2}$ のドライバーの感度（1 W、1 m での dB）を見積もってください。$\\eta_0 = \\rho(Bl)^2S_d^2/(2\\pi cR_eM_{ms}^2)$、$L = 112.1 + 10\\log_{10}\\eta_0$ を使い、小数第1位まで答えてください。`],
        a: { type: 'num', v: T.spl, tol: 0.06, unit: ['dB', 'dB'] },
        hint: ['Compute the efficiency first; it is a small fraction, so expect a negative logarithm.', 'まず効率を計算します。小さな割合なので、対数は負になります。'],
        sol: [[`$\\eta_0 = \\dfrac{1.18\\times${n(Bl * Bl)}\\times 0.0133^2}{2\\pi\\times343\\times6\\times${n(M / 1000)}^2} = ${sig(T.eta, 3)}$, that is ${n(T.eta * 100, 3)} %.`, `$\\eta_0 = \\dfrac{1.18\\times${n(Bl * Bl)}\\times 0.0133^2}{2\\pi\\times343\\times6\\times${n(M / 1000)}^2} = ${sig(T.eta, 3)}$、すなわち ${n(T.eta * 100, 3)} % です。`], [`$L = 112.1 + 10\\log_{10}(${sig(T.eta, 3)}) = ${n(T.spl, 2)}$ dB.`, `$L = 112.1 + 10\\log_{10}(${sig(T.eta, 3)}) = ${n(T.spl, 2)}$ dB です。`], ['Less than one percent of the electrical power becomes sound: a woofer is mostly a heater for its voice coil.', '電力の 1 % 未満しか音になりません。ウーファーはほとんどボイスコイルの発熱器なのです。']],
        set: { Bl, Mms: M, Cms: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let M, Cm, Qt, Bl, T;
        do { M = r.pick([8, 10, 12, 15, 20, 25, 30]); Cm = r.pick([0.5, 0.6, 0.8, 1, 1.2, 1.5]); Qt = r.pick([0.3, 0.35, 0.4, 0.45, 0.5, 0.6]); T = ts(1, M, Cm); Bl = Math.sqrt(TAU * T.fs * M / 1000 * RE / Qt); } while (Bl < 3 || Bl > 12);
        return {
          q: [`A cone with $M_{ms} = ${M}$ g on a suspension of $C_{ms} = ${n(Cm)}$ mm/N, coil $R_e = 6\\ \\Omega$. What force factor $Bl$ gives $Q_{es} = ${n(Qt)}$?`, `$M_{ms} = ${M}$ g のコーンが $C_{ms} = ${n(Cm)}$ mm/N のサスペンションに支えられ、コイルは $R_e = 6\\ \\Omega$ です。$Q_{es} = ${n(Qt)}$ にする力係数 $Bl$ はいくらですか。`],
          a: { type: 'num', v: Bl, rel: 0.01, unit: ['T·m', 'T·m'] },
          hint: ['Turn $Q_{es} = 2\\pi f_s M_{ms}R_e/(Bl)^2$ round; $f_s$ does not depend on $Bl$.', '$Q_{es} = 2\\pi f_s M_{ms}R_e/(Bl)^2$ を逆に解きます。$f_s$ は $Bl$ によりません。'],
          sol: [[`$f_s = 1/(2\\pi\\sqrt{${n(M / 1000)}\\times${n(Cm / 1000)}}) = ${s3(T.fs)}$ Hz.`, `$f_s = 1/(2\\pi\\sqrt{${n(M / 1000)}\\times${n(Cm / 1000)}}) = ${s3(T.fs)}$ Hz です。`], [`$(Bl)^2 = 2\\pi f_sM_{ms}R_e/Q_{es} = ${n(TAU * T.fs * M / 1000 * RE, 4)}/${n(Qt)} = ${n(Bl * Bl, 3)}$, so $Bl = ${n(Bl, 3)}$ T·m.`, `$(Bl)^2 = 2\\pi f_sM_{ms}R_e/Q_{es} = ${n(TAU * T.fs * M / 1000 * RE, 4)}/${n(Qt)} = ${n(Bl * Bl, 3)}$ なので $Bl = ${n(Bl, 3)}$ T·m です。`], ['A lower target Q needs a stronger motor, and because $Q_{es} \\propto 1/(Bl)^2$, halving it takes $\\sqrt2$ times the force factor: more magnet, more copper, more cost.', '目標の Q を下げるにはより強い磁気回路が要ります。$Q_{es} \\propto 1/(Bl)^2$ なので、半分にするには力係数が $\\sqrt2$ 倍必要で、磁石も銅も費用も増えます。']],
          set: { Bl: snap(Bl, 0.1, 3, 12), Mms: M, Cms: Cm },
        };
      }
      if (form === 1) {
        const k = r.int(0, 1);
        if (k === 0) {
          const opts = [
            ['$f_s$ falls by $\\sqrt2$, $Q_{es}$ rises by $\\sqrt2$, sensitivity falls by 6 dB', '$f_s$ は $1/\\sqrt2$ 倍、$Q_{es}$ は $\\sqrt2$ 倍、感度は 6 dB 下がる'],
            ['$f_s$ halves, $Q_{es}$ doubles, sensitivity falls by 3 dB', '$f_s$ は半分、$Q_{es}$ は 2 倍、感度は 3 dB 下がる'],
            ['$f_s$ falls by $\\sqrt2$, $Q_{es}$ falls by $\\sqrt2$, sensitivity unchanged', '$f_s$ は $1/\\sqrt2$ 倍、$Q_{es}$ は $1/\\sqrt2$ 倍、感度は変わらない'],
            ['$f_s$ falls by $\\sqrt2$, $Q_{es}$ unchanged, sensitivity rises by 3 dB', '$f_s$ は $1/\\sqrt2$ 倍、$Q_{es}$ は変わらず、感度は 3 dB 上がる'],
          ];
          return {
            q: ['A designer doubles the moving mass $M_{ms}$ of a woofer to lower its resonance, keeping $Bl$, $C_{ms}$ and $S_d$. What happens?', '設計者が共振を下げるためにウーファーの可動質量 $M_{ms}$ を 2 倍にします。$Bl$、$C_{ms}$、$S_d$ はそのままです。どうなりますか。'],
            a: { type: 'choice', opts, v: 0 },
            hint: ['Write each quantity as a power of $M_{ms}$: $f_s \\propto M^{-1/2}$, $Q_{es} \\propto f_sM$, $\\eta_0 \\propto 1/M^2$.', 'それぞれを $M_{ms}$ のべきで表してください。$f_s \\propto M^{-1/2}$、$Q_{es} \\propto f_sM$、$\\eta_0 \\propto 1/M^2$ です。'],
            sol: [['$f_s \\propto 1/\\sqrt{M_{ms}}$ falls by $\\sqrt2$; $Q_{es} \\propto f_sM_{ms} \\propto \\sqrt{M_{ms}}$ rises by $\\sqrt2$.', '$f_s \\propto 1/\\sqrt{M_{ms}}$ は $1/\\sqrt2$ 倍、$Q_{es} \\propto f_sM_{ms} \\propto \\sqrt{M_{ms}}$ は $\\sqrt2$ 倍になります。'], ['$\\eta_0 \\propto 1/M_{ms}^2$ falls to a quarter, $10\\log_{10}(1/4) = -6$ dB.', '$\\eta_0 \\propto 1/M_{ms}^2$ は 4 分の 1 になり、$10\\log_{10}(1/4) = -6$ dB です。'], ['Deeper bass from mass alone is paid for twice: in sensitivity, and in a higher Q that makes the resonance ring.', '質量だけで低音を伸ばすと二重の代償を払います。感度が下がり、Q が上がって共振が響くようになります。']],
            set: { Mms: 30, Cms: 1, Bl: 7.5 },
          };
        }
        const m1 = r.pick([10, 12, 15, 20]), m2 = r.pick([15, 20, 25, 30, 40].filter((x) => x > m1));
        const dL = 20 * Math.log10(m1 / m2);
        return {
          q: [`Two drivers are identical except for moving mass: $${m1}$ g and $${m2}$ g. How many dB less sensitive is the heavier one, in its mass-controlled band? Give one decimal.`, `可動質量だけが違う二つのドライバーがあります。$${m1}$ g と $${m2}$ g です。質量制御の帯域で、重いほうは何 dB 感度が低いですか。小数第1位まで答えてください。`],
          a: { type: 'num', v: -dL, tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['Above $f_s$ the cone acceleration is $BlI/M_{ms}$ and the radiated power goes as its square.', '$f_s$ より上ではコーンの加速度は $BlI/M_{ms}$ で、放射パワーはその二乗に比例します。'],
          sol: [[`$\\eta_0 \\propto 1/M_{ms}^2$, so the ratio of efficiencies is $(${m1}/${m2})^2 = ${n((m1 / m2) ** 2, 4)}$.`, `$\\eta_0 \\propto 1/M_{ms}^2$ なので効率の比は $(${m1}/${m2})^2 = ${n((m1 / m2) ** 2, 4)}$ です。`], [`$10\\log_{10}${n((m1 / m2) ** 2, 4)} = 20\\log_{10}(${m1}/${m2}) = ${n(dL, 3)}$ dB: the heavier driver is ${n(-dL, 2)} dB quieter for the same voltage.`, `$10\\log_{10}${n((m1 / m2) ** 2, 4)} = 20\\log_{10}(${m1}/${m2}) = ${n(dL, 3)}$ dB で、同じ電圧に対して重いほうは ${n(-dL, 2)} dB 小さくなります。`]],
          set: { Mms: m2 },
        };
      }
      const Cm = r.pick([0.5, 0.8, 1, 1.2, 1.5, 2]);
      return {
        q: [`For a suspension of $C_{ms} = ${n(Cm)}$ mm/N, write the resonance $f_s$ in hertz as a function of the moving mass $m$ in grams.`, `$C_{ms} = ${n(Cm)}$ mm/N のサスペンションについて、共振周波数 $f_s$（Hz）を可動質量 $m$（グラム）の関数として書いてください。`],
        a: { type: 'expr', v: `1000/(2*pi*sqrt(${Cm}*m))`, vars: ['m'], dom: { m: [5, 40] }, lhs: ['$f_s(m) =$', '$f_s(m) =$'] },
        hint: ['Convert units inside the formula: $m$ grams is $m/1000$ kg, $C_{ms}$ is $' + n(Cm) + '/1000$ m/N.', '式の中で単位を直します。$m$ グラムは $m/1000$ kg、$C_{ms}$ は $' + n(Cm) + '/1000$ m/N です。'],
        sol: [[`$M_{ms}C_{ms} = \\dfrac{m}{1000}\\cdot\\dfrac{${n(Cm)}}{1000} = ${n(Cm)}m\\times10^{-6}$.`, `$M_{ms}C_{ms} = \\dfrac{m}{1000}\\cdot\\dfrac{${n(Cm)}}{1000} = ${n(Cm)}m\\times10^{-6}$ です。`], [`$f_s = \\dfrac{1}{2\\pi\\sqrt{${n(Cm)}m\\times10^{-6}}} = \\dfrac{1000}{2\\pi\\sqrt{${n(Cm)}m}}$.`, `$f_s = \\dfrac{1}{2\\pi\\sqrt{${n(Cm)}m\\times10^{-6}}} = \\dfrac{1000}{2\\pi\\sqrt{${n(Cm)}m}}$ です。`], ['Four times the mass halves the resonance: the inverse square root is why moving a bass resonance down an octave is so costly.', '質量を 4 倍にすると共振は半分になります。この逆平方根のために、低音の共振を 1 オクターブ下げるのは高くつくのです。']],
        set: { Cms: Cm },
      };
    },
  ];

  /* ---------------- 2. box alignment (the lab's driver: fs 41.1 Hz, Qts 0.373, Vas 24.6 L) ---------------- */
  const dfs = DRV.fs, dQ = DRV.Qts, dV = DRV.Vas * 1000;
  const f3sealed = (fc, Q) => { const b = 2 - 1 / (Q * Q); return fc * Math.sqrt((-b + Math.sqrt(b * b + 4)) / 2); };
  const drvTxt = [`the lab's woofer ($f_s = ${n(dfs, 1)}$ Hz, $Q_{ts} = ${n(dQ, 3)}$, $V_{as} = ${n(dV, 1)}$ L)`, `この実験のウーファー（$f_s = ${n(dfs, 1)}$ Hz、$Q_{ts} = ${n(dQ, 3)}$、$V_{as} = ${n(dV, 1)}$ L）`];
  Q['box-alignment'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Vb = r.step(5, 60, 0.5), al = dV / Vb;
        return {
          q: [`Put ${drvTxt[0]} in a sealed box of $${n(Vb)}$ L. What is the compliance ratio $\\alpha = V_{as}/V_b$?`, `${drvTxt[1]}を $${n(Vb)}$ L の密閉箱に入れます。コンプライアンス比 $\\alpha = V_{as}/V_b$ はいくらですか。`],
          a: { type: 'num', v: al },
          hint: ['The ratio compares the stiffness of the box air with that of the suspension.', 'この比は、箱の空気の硬さをサスペンションの硬さと比べたものです。'],
          sol: [[`$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$.`, `$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$ です。`], [al > 1 ? 'Above 1: the trapped air is stiffer than the suspension and sets the resonance.' : 'Below 1: the box is large, and the suspension still does most of the restoring.', al > 1 ? '1 を超えるので、閉じ込めた空気のほうがサスペンションより硬く、共振を決めます。' : '1 未満なので箱は大きく、復元はまだ主にサスペンションが担います。']],
          set: { type: 0, Vb },
        };
      }
      if (form === 1) {
        const fs = r.pick([25, 30, 35, 40, 45, 50]), al = r.pick([0.5, 1, 1.5, 2, 3, 4, 8]);
        const fc = fs * Math.sqrt(1 + al);
        return {
          q: [`A driver with $f_s = ${fs}$ Hz goes into a sealed box with $\\alpha = ${n(al)}$. At what frequency $f_c$ does the system resonate?`, `$f_s = ${fs}$ Hz のドライバーを $\\alpha = ${n(al)}$ の密閉箱に入れます。系の共振周波数 $f_c$ はいくらですか。`],
          a: { type: 'num', v: fc, unit: ['Hz', 'Hz'] },
          hint: ['The box air adds stiffness in parallel with the suspension: $1/C$ grows by the factor $1 + \\alpha$.', '箱の空気はサスペンションと並列に硬さを加えます。$1/C$ が $1 + \\alpha$ 倍になります。'],
          sol: [[`The total stiffness is $(1 + \\alpha) = ${n(1 + al)}$ times the suspension's, and the mass is unchanged.`, `全体の硬さはサスペンションの $(1 + \\alpha) = ${n(1 + al)}$ 倍で、質量は変わりません。`], [`$f_c = f_s\\sqrt{1 + \\alpha} = ${fs}\\times\\sqrt{${n(1 + al)}} = ${s3(fc)}$ Hz.`, `$f_c = f_s\\sqrt{1 + \\alpha} = ${fs}\\times\\sqrt{${n(1 + al)}} = ${s3(fc)}$ Hz です。`], ['The smaller the box, the higher the bass cut-off: you cannot shrink a sealed box for free.', '箱が小さいほど低音の下限は上がります。密閉箱はただでは小さくできません。']],
        };
      }
      const vented = r.chance(0.5);
      const opts = [['6 dB per octave', 'オクターブあたり 6 dB'], ['12 dB per octave', 'オクターブあたり 12 dB'], ['18 dB per octave', 'オクターブあたり 18 dB'], ['24 dB per octave', 'オクターブあたり 24 dB']];
      return {
        q: [`Far below its cut-off, how fast does the response of a ${vented ? 'vented (bass-reflex)' : 'sealed'} box fall?`, `遮断周波数よりずっと下で、${vented ? 'バスレフ型' : '密閉型'}の箱の応答はどれだけの速さで下がりますか。`],
        a: { type: 'choice', opts, v: vented ? 3 : 1, fixed: true },
        hint: ['Count the order of the high-pass: each order is 6 dB per octave.', 'ハイパスの次数を数えてください。一次ごとにオクターブあたり 6 dB です。'],
        sol: [[vented ? 'The cone, the box air and the port air make two coupled resonators: a fourth-order high-pass, $s^4$ in the numerator.' : 'Mass on a spring (suspension plus box air) is a second-order high-pass, $s^2$ in the numerator.', vented ? 'コーン、箱の空気、ポートの空気が二つの結合した共振器を作り、分子が $s^4$ の四次のハイパスになります。' : 'ばね（サスペンションと箱の空気）につながった質量は、分子が $s^2$ の二次のハイパスです。'], [vented ? 'Below $f_b$ the port and cone move in antiphase and cancel: $4\\times 6 = 24$ dB per octave.' : '$2\\times 6 = 12$ dB per octave; the gentler slope is part of why sealed boxes sound tight in a room.', vented ? '$f_b$ より下ではポートとコーンが逆相で動いて打ち消し合い、$4\\times 6 = 24$ dB/オクターブになります。' : '$2\\times 6 = 12$ dB/オクターブです。この緩やかな傾きが、密閉箱が部屋で引き締まって聞こえる理由の一つです。']],
        set: { type: vented ? 1 : 0, Vb: vented ? 30 : 9.5, fb: 41 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const own = r.chance(0.5);
        const Qtc = r.pick([0.577, 0.707, 0.8, 0.9]);
        const fs = own ? dfs : r.pick([25, 30, 35, 45]), Qts = own ? dQ : r.pick([0.3, 0.33, 0.35, 0.4, 0.45]), Vas = own ? dV : r.pick([20, 30, 40, 60, 80]);
        const al = (Qtc / Qts) ** 2 - 1, Vb = Vas / al;
        const name = { 0.577: ['Bessel-like', 'ベッセル型に近い'], 0.707: ['Butterworth, maximally flat', 'バターワース、最大平坦'], 0.8: ['slightly underdamped', 'やや制動不足'], 0.9: ['underdamped', '制動不足'] }[Qtc];
        const dtxt = own ? drvTxt : [`a woofer with $Q_{ts} = ${n(Qts)}$, $V_{as} = ${Vas}$ L`, `$Q_{ts} = ${n(Qts)}$、$V_{as} = ${Vas}$ L のウーファー`];
        const vs = snap(Vb, 0.5, 4, 80);
        return {
          q: [`What sealed-box volume gives ${dtxt[0]} a total $Q_{tc} = ${Qtc}$ (${name[0]})?`, `${dtxt[1]}の全体の $Q_{tc}$ を $${Qtc}$（${name[1]}）にする密閉箱の容積はいくらですか。`],
          a: { type: 'num', v: Vb, rel: 0.01, unit: ['litres', 'リットル'] },
          hint: ['$Q_{tc} = Q_{ts}\\sqrt{1 + \\alpha}$: solve for $\\alpha$, then $V_b = V_{as}/\\alpha$.', '$Q_{tc} = Q_{ts}\\sqrt{1 + \\alpha}$ を $\\alpha$ について解き、$V_b = V_{as}/\\alpha$ とします。'],
          sol: [[`$1 + \\alpha = (Q_{tc}/Q_{ts})^2 = (${Qtc}/${n(Qts, 3)})^2 = ${n(1 + al, 4)}$, so $\\alpha = ${n(al, 4)}$.`, `$1 + \\alpha = (Q_{tc}/Q_{ts})^2 = (${Qtc}/${n(Qts, 3)})^2 = ${n(1 + al, 4)}$ なので $\\alpha = ${n(al, 4)}$ です。`], [`$V_b = ${n(Vas, 3)}/${n(al, 4)} = ${s3(Vb)}$ L.`, `$V_b = ${n(Vas, 3)}/${n(al, 4)} = ${s3(Vb)}$ L です。`], ['A higher target Q means a smaller box and a higher, peakier cut-off; a lower one means a larger box and an earlier, gentler roll-off.', '目標の Q が高いほど箱は小さく、遮断は高くピークをもちます。低いほど箱は大きく、早めになだらかに下がります。']],
          set: own && vs >= 4 ? { type: 0, Vb: vs } : undefined,
        };
      }
      if (form === 1) {
        const Vb = r.pick([5, 6, 8, 9.5, 12, 15, 20, 30, 40]);
        const al = dV / Vb, fc = dfs * Math.sqrt(1 + al), Qc = dQ * Math.sqrt(1 + al), f3 = f3sealed(fc, Qc);
        return {
          q: [`${drvTxt[0][0].toUpperCase() + drvTxt[0].slice(1)} is in a sealed box of $${n(Vb)}$ L. Find the $-3$ dB frequency $f_3$.`, `${drvTxt[1]}が $${n(Vb)}$ L の密閉箱に入っています。$-3$ dB となる周波数 $f_3$ を求めてください。`],
          a: { type: 'num', v: f3, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Find $f_c$ and $Q_{tc}$, then solve $|G|^2 = \\tfrac12$ for the second-order high-pass; with $y = (f/f_c)^2$ it is a quadratic.', '$f_c$ と $Q_{tc}$ を求め、二次のハイパスで $|G|^2 = \\tfrac12$ を解きます。$y = (f/f_c)^2$ とおくと二次方程式になります。'],
          sol: [[`$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$, $f_c = ${n(dfs, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(fc, 3)}$ Hz, $Q_{tc} = ${n(dQ, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(Qc, 3)}$.`, `$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$、$f_c = ${n(dfs, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(fc, 3)}$ Hz、$Q_{tc} = ${n(dQ, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(Qc, 3)}$ です。`], [`$\\dfrac{y^2}{(1-y)^2 + y/Q^2} = \\tfrac12$ gives $y^2 + (2 - 1/Q^2)y - 1 = 0$, so $y = ${n((f3 / fc) ** 2, 4)}$.`, `$\\dfrac{y^2}{(1-y)^2 + y/Q^2} = \\tfrac12$ から $y^2 + (2 - 1/Q^2)y - 1 = 0$ となり、$y = ${n((f3 / fc) ** 2, 4)}$ です。`], [`$f_3 = f_c\\sqrt{y} = ${s3(f3)}$ Hz. ${Math.abs(Qc - 0.707) < 0.01 ? 'At $Q_{tc} = 0.707$ this is exactly $f_c$.' : Qc > 0.707 ? 'With $Q_{tc} > 0.707$ the hump pushes $f_3$ below $f_c$.' : 'With $Q_{tc} < 0.707$ the droop starts early and $f_3$ lies above $f_c$.'}`, `$f_3 = f_c\\sqrt{y} = ${s3(f3)}$ Hz です。${Math.abs(Qc - 0.707) < 0.01 ? '$Q_{tc} = 0.707$ ではちょうど $f_c$ になります。' : Qc > 0.707 ? '$Q_{tc} > 0.707$ なので、盛り上がりが $f_3$ を $f_c$ より下に押し下げます。' : '$Q_{tc} < 0.707$ なので早めに下がり始め、$f_3$ は $f_c$ より上になります。'}`]],
          set: { type: 0, Vb },
        };
      }
      const fs = r.pick([28, 32, 35, 40, 45, 50]), Vas = r.pick([20, 30, 40, 50, 70, 100]);
      const Vb = Vas / Math.SQRT2;
      return {
        q: [`A woofer with $Q_{ts} = 0.383$, $f_s = ${fs}$ Hz and $V_{as} = ${Vas}$ L is ideal for the fourth-order Butterworth (B4) vented alignment, which needs $\\alpha = \\sqrt2$ and $h = f_b/f_s = 1$. Find the box volume and the port tuning.`, `$Q_{ts} = 0.383$、$f_s = ${fs}$ Hz、$V_{as} = ${Vas}$ L のウーファーは、四次バターワース（B4）のバスレフ整合にぴったりです。この整合は $\\alpha = \\sqrt2$、$h = f_b/f_s = 1$ を必要とします。箱の容積とポートの同調周波数を求めてください。`],
        a: { type: 'tuple', v: [Vb, fs], labels: ['$V_b$ (L)', '$f_b$ (Hz)'], tol: 0.2 },
        hint: ['Both conditions are ratios: invert each one.', 'どちらの条件も比なので、それぞれを逆に解きます。'],
        sol: [[`$V_b = V_{as}/\\alpha = ${Vas}/\\sqrt2 = ${n(Vb, 3)}$ L.`, `$V_b = V_{as}/\\alpha = ${Vas}/\\sqrt2 = ${n(Vb, 3)}$ L です。`], [`$f_b = h f_s = ${fs}$ Hz, and for B4 the $-3$ dB point is also $f_s$.`, `$f_b = h f_s = ${fs}$ Hz で、B4 では $-3$ dB の点も $f_s$ になります。`], ['B4 is the vented box with the flattest passband: the response falls straight into a 24 dB per octave skirt with no hump.', 'B4 は通過域が最も平らなバスレフで、盛り上がりなしにオクターブあたり 24 dB の裾へまっすぐ下がります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let fc, al, Vb;
        do { fc = r.pick([55, 60, 65, 70, 75, 80, 90]); al = (fc / dfs) ** 2 - 1; Vb = dV / al; } while (Vb < 4 || Vb > 80);
        const Qc = dQ * fc / dfs;
        return {
          q: [`What sealed-box volume puts the system resonance of ${drvTxt[0]} at $f_c = ${fc}$ Hz? What $Q_{tc}$ results?`, `${drvTxt[1]}の系の共振を $f_c = ${fc}$ Hz にする密閉箱の容積はいくらですか。そのときの $Q_{tc}$ も求めてください。`],
          a: { type: 'tuple', v: [Vb, Qc], labels: ['$V_b$ (L)', '$Q_{tc}$'], tol: 0.02 },
          hint: ['$f_c/f_s = Q_{tc}/Q_{ts} = \\sqrt{1 + \\alpha}$: both scale by the same factor.', '$f_c/f_s = Q_{tc}/Q_{ts} = \\sqrt{1 + \\alpha}$ で、どちらも同じ倍率で変わります。'],
          sol: [[`$1 + \\alpha = (${fc}/${n(dfs, 3)})^2 = ${n(1 + al, 4)}$, so $V_b = ${n(dV, 3)}/${n(al, 4)} = ${n(Vb, 3)}$ L.`, `$1 + \\alpha = (${fc}/${n(dfs, 3)})^2 = ${n(1 + al, 4)}$ なので $V_b = ${n(dV, 3)}/${n(al, 4)} = ${n(Vb, 3)}$ L です。`], [`$Q_{tc} = ${n(dQ, 3)}\\times${fc}/${n(dfs, 3)} = ${n(Qc, 3)}$.`, `$Q_{tc} = ${n(dQ, 3)}\\times${fc}/${n(dfs, 3)} = ${n(Qc, 3)}$ です。`], [Qc > 0.75 ? 'Raising $f_c$ raised the Q above 0.707: the box is small enough that the response now peaks before it falls.' : 'The Q stays near or below 0.707, so the response rolls off without a peak.', Qc > 0.75 ? '$f_c$ を上げたので Q が 0.707 を超えました。箱が小さく、応答は下がる前にピークをもちます。' : 'Q は 0.707 付近かそれ以下なので、応答はピークなしに下がります。']],
          set: { type: 0, Vb: snap(Vb, 0.5, 4, 80) },
        };
      }
      if (form === 1) {
        const Vb = r.pick([4, 4.5, 5, 5.5, 6, 7]);
        const al = dV / Vb, Qc = dQ * Math.sqrt(1 + al), pk = Qc / Math.sqrt(1 - 1 / (4 * Qc * Qc)), pdB = db(pk);
        return {
          q: [`${drvTxt[0][0].toUpperCase() + drvTxt[0].slice(1)} is squeezed into a $${n(Vb)}$ L sealed box. How high is the peak in its response, in dB above the passband? Give one decimal.`, `${drvTxt[1]}を $${n(Vb)}$ L の密閉箱に押し込みます。応答のピークは通過域より何 dB 高いですか。小数第1位まで答えてください。`],
          a: { type: 'num', v: pdB, tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['A second-order high-pass with $Q > 1/\\sqrt2$ peaks at $|G|_{\\max} = Q/\\sqrt{1 - 1/(4Q^2)}$.', '$Q > 1/\\sqrt2$ の二次のハイパスは $|G|_{\\max} = Q/\\sqrt{1 - 1/(4Q^2)}$ のピークをもちます。'],
          sol: [[`$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$, $Q_{tc} = ${n(dQ, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(Qc, 3)}$.`, `$\\alpha = ${n(dV, 3)}/${n(Vb)} = ${n(al, 3)}$、$Q_{tc} = ${n(dQ, 3)}\\sqrt{${n(1 + al, 3)}} = ${n(Qc, 3)}$ です。`], [`$|G|_{\\max} = ${n(Qc, 3)}/\\sqrt{1 - 1/(4\\times${n(Qc * Qc, 3)})} = ${n(pk, 4)}$, that is $20\\log_{10}${n(pk, 4)} = ${n(pdB, 3)}$ dB.`, `$|G|_{\\max} = ${n(Qc, 3)}/\\sqrt{1 - 1/(4\\times${n(Qc * Qc, 3)})} = ${n(pk, 4)}$、すなわち $20\\log_{10}${n(pk, 4)} = ${n(pdB, 3)}$ dB です。`], ['The ear hears this as boom: one bass note louder than its neighbours, ringing on after it stops.', '耳にはこれがこもりとして聞こえます。ある低音だけが周りより大きく、止んだ後も鳴り続けます。']],
          set: { type: 0, Vb },
        };
      }
      const Qts = r.pick([0.3, 0.35, 0.4, 0.45, 0.5]), Vas = r.pick([20, 25, 30, 40, 50]);
      return {
        q: [`For a woofer with $Q_{ts} = ${n(Qts)}$ and $V_{as} = ${Vas}$ L, write the sealed-box $Q_{tc}$ as a function of the box volume $V$ in litres.`, `$Q_{ts} = ${n(Qts)}$、$V_{as} = ${Vas}$ L のウーファーについて、密閉箱の $Q_{tc}$ を箱の容積 $V$（リットル）の関数として書いてください。`],
        a: { type: 'expr', v: `${Qts}*sqrt(1+${Vas}/V)`, vars: ['V'], dom: { V: [4, 80] }, lhs: ['$Q_{tc}(V) =$', '$Q_{tc}(V) =$'] },
        hint: ['$Q_{tc} = Q_{ts}\\sqrt{1 + \\alpha}$ with $\\alpha = V_{as}/V$.', '$\\alpha = V_{as}/V$ として $Q_{tc} = Q_{ts}\\sqrt{1 + \\alpha}$ です。'],
        sol: [[`The box air stiffens the suspension by $1 + V_{as}/V$; the mass is unchanged, so the Q rises with the square root.`, `箱の空気はサスペンションを $1 + V_{as}/V$ 倍硬くします。質量は変わらないので、Q はその平方根で上がります。`], [`$Q_{tc}(V) = ${n(Qts)}\\sqrt{1 + ${Vas}/V}$.`, `$Q_{tc}(V) = ${n(Qts)}\\sqrt{1 + ${Vas}/V}$ です。`], [`As $V \\to \\infty$ it falls to $Q_{ts}$, the driver in free air; the Butterworth value 0.707 needs $V = ${n(Vas / ((0.707 / Qts) ** 2 - 1), 3)}$ L.`, `$V \\to \\infty$ で自由空間のドライバーの $Q_{ts}$ に下がります。バターワースの 0.707 には $V = ${n(Vas / ((0.707 / Qts) ** 2 - 1), 3)}$ L が必要です。`]],
      };
    },
  ];

  /* ---------------- 3. piston directivity ---------------- */
  function J1(x) { if (Math.abs(x) > 25) { const t = x - 3 * PI / 4; return Math.sqrt(2 / (PI * x)) * Math.cos(t); } let s = 0, t = x / 2; for (let k = 0; k < 90; k++) { s += t; t *= -(x * x / 4) / ((k + 1) * (k + 2)); } return s; }
  const D = (x) => (Math.abs(x) < 1e-9 ? 1 : 2 * J1(x) / x);
  const X6 = (() => { let lo = 1, hi = 3; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (D(m) > 0.5) lo = m; else hi = m; } return (lo + hi) / 2; })();
  const Z1 = 3.8317;
  const kaOf = (a, f) => TAU * f * a / C;
  Q['piston-directivity'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([2.5, 5, 6.5, 8, 10, 12.5]), f = r.pick([500, 1000, 2000, 3000, 5000]), ka = kaOf(a / 100, f);
        return {
          q: [`A piston of radius $a = ${n(a)}$ cm plays $${f}$ Hz. What is $ka$ ($c = 343$ m/s)?`, `半径 $a = ${n(a)}$ cm のピストンが $${f}$ Hz を鳴らします。$ka$ はいくらですか（$c = 343$ m/s）。`],
          a: { type: 'num', v: ka },
          hint: ['$k = 2\\pi f/c$ is the wavenumber; $ka$ is the circumference in wavelengths.', '$k = 2\\pi f/c$ は波数で、$ka$ は円周が何波長ぶんかを表します。'],
          sol: [[`$k = 2\\pi\\times${f}/343 = ${n(TAU * f / C, 4)}\\ \\mathrm{m^{-1}}$.`, `$k = 2\\pi\\times${f}/343 = ${n(TAU * f / C, 4)}\\ \\mathrm{m^{-1}}$ です。`], [`$ka = ${n(TAU * f / C, 4)}\\times${n(a / 100)} = ${n(ka, 3)}$. ${ka < 1 ? 'Below 1, the piston radiates almost evenly into the front half-space.' : ka < Z1 ? 'Between 1 and 3.83 the sound narrows into a beam.' : 'Above 3.83 nulls and side lobes appear.'}`, `$ka = ${n(TAU * f / C, 4)}\\times${n(a / 100)} = ${n(ka, 3)}$ です。${ka < 1 ? '1 未満なので、ピストンは前方の半空間にほぼ一様に放射します。' : ka < Z1 ? '1 と 3.83 の間では音はビームに細まります。' : '3.83 を超えると零点と副ローブが現れます。'}`]],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      if (form === 1) {
        const a = r.pick([1.25, 2.5, 5, 6.5, 8, 10, 12.5, 15]), f = C / (TAU * a / 100);
        return {
          q: [`At what frequency does a piston of radius $${n(a)}$ cm reach $ka = 1$?`, `半径 $${n(a)}$ cm のピストンが $ka = 1$ になる周波数はいくらですか。`],
          a: { type: 'num', v: f, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Solve $2\\pi f a/c = 1$.', '$2\\pi f a/c = 1$ を解きます。'],
          sol: [[`$f = c/(2\\pi a) = 343/(2\\pi\\times${n(a / 100)}) = ${s3(f)}$ Hz.`, `$f = c/(2\\pi a) = 343/(2\\pi\\times${n(a / 100)}) = ${s3(f)}$ Hz です。`], ['There the wavelength equals the circumference; above it the driver starts to beam, so a bigger cone has to hand over at a lower frequency.', 'そこでは波長が円周に等しくなります。それより上でドライバーはビームを作り始めるので、大きなコーンほど低い周波数で受け渡す必要があります。']],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      const a = r.pick([2.5, 5, 6.5, 10, 12.5]), f = r.pick([150, 300, 600, 2000, 4000, 8000]), ka = kaOf(a / 100, f), cls = ka < 1 ? 0 : ka < Z1 ? 1 : 2;
      return {
        q: [`A piston of radius $${n(a)}$ cm in a wall plays $${f}$ Hz. Which describes its radiation in front?`, `壁にはめた半径 $${n(a)}$ cm のピストンが $${f}$ Hz を鳴らします。前方への放射を正しく表すのはどれですか。`],
        a: { type: 'choice', opts: [['nearly even over the front half-space ($ka < 1$)', '前方の半空間にほぼ一様（$ka < 1$）'], ['a single beam narrowing around the axis ($1 < ka < 3.83$)', '軸のまわりに細まる一本のビーム（$1 < ka < 3.83$）'], ['a beam with nulls and side lobes ($ka > 3.83$)', '零点と副ローブをもつビーム（$ka > 3.83$）']], v: cls, fixed: true },
        hint: ['Compute $ka$ and compare it with 1 and with the first zero of $J_1$, 3.83.', '$ka$ を計算し、1 および $J_1$ の最初の零点 3.83 と比べてください。'],
        sol: [[`$ka = 2\\pi\\times${f}\\times${n(a / 100)}/343 = ${n(ka, 3)}$.`, `$ka = 2\\pi\\times${f}\\times${n(a / 100)}/343 = ${n(ka, 3)}$ です。`], ['The pattern $2J_1(ka\\sin\\theta)/(ka\\sin\\theta)$ first reaches zero at $ka\\sin\\theta = 3.83$, which needs $ka > 3.83$ inside the front half-space.', 'パターン $2J_1(ka\\sin\\theta)/(ka\\sin\\theta)$ が初めて 0 になるのは $ka\\sin\\theta = 3.83$ のときで、前方の半空間でこれが起こるには $ka > 3.83$ が必要です。']],
        set: { a, lf: lfOf(f, 2, 4.3) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, f, ka;
        do { a = r.pick([2.5, 5, 6.5, 8, 10, 12.5, 15]); f = r.pick([2000, 3000, 4000, 5000, 6000, 8000, 10000]); ka = kaOf(a / 100, f); } while (ka < 4.2 || ka > 25);
        const th = deg(Math.asin(Z1 / ka));
        return {
          q: [`A piston of radius $${n(a)}$ cm plays $${n(f / 1000)}$ kHz. At what angle off axis is the first null? Give one decimal in degrees.`, `半径 $${n(a)}$ cm のピストンが $${n(f / 1000)}$ kHz を鳴らします。最初の零点は軸から何度ですか。度で小数第1位まで答えてください。`],
          a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
          hint: ['The pattern vanishes where $ka\\sin\\theta$ equals the first zero of $J_1$, $3.8317$.', 'パターンは $ka\\sin\\theta$ が $J_1$ の最初の零点 $3.8317$ に等しいところで 0 になります。'],
          sol: [[`$ka = 2\\pi\\times${f}\\times${n(a / 100)}/343 = ${n(ka, 4)}$.`, `$ka = 2\\pi\\times${f}\\times${n(a / 100)}/343 = ${n(ka, 4)}$ です。`], [`$\\sin\\theta_1 = 3.8317/${n(ka, 4)} = ${n(Z1 / ka, 4)}$, so $\\theta_1 = ${n(th, 2)}^\\circ$.`, `$\\sin\\theta_1 = 3.8317/${n(ka, 4)} = ${n(Z1 / ka, 4)}$ なので $\\theta_1 = ${n(th, 2)}^\\circ$ です。`], ['A listener at that angle hears the waves from the two halves of the cone cancel exactly; the higher the frequency, the narrower the cone of sound.', 'その角度の聴き手には、コーンの二つの部分からの波がちょうど打ち消し合って聞こえます。周波数が高いほど音の円錐は細くなります。']],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      if (form === 1) {
        let a, f, th, x;
        do { a = r.pick([2.5, 5, 6.5, 8, 10, 12.5]); f = r.pick([1000, 1500, 2000, 3000, 4000, 5000]); th = r.pick([30, 45, 60, 90]); x = kaOf(a / 100, f) * Math.sin(rad(th)); } while (x < 0.6 || x > 3.5);
        const L = db(Math.abs(D(x)));
        return {
          q: [`A piston of radius $${n(a)}$ cm plays $${n(f / 1000)}$ kHz. How many dB below the on-axis level is a listener $${th}^\\circ$ off axis? Give one decimal (as a negative number).`, `半径 $${n(a)}$ cm のピストンが $${n(f / 1000)}$ kHz を鳴らします。軸から $${th}^\\circ$ の聴き手は軸上より何 dB 低いですか。小数第1位まで、負の数で答えてください。`],
          a: { type: 'num', v: L, tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['Evaluate $D = 2J_1(x)/x$ at $x = ka\\sin\\theta$, then take $20\\log_{10}|D|$.', '$x = ka\\sin\\theta$ で $D = 2J_1(x)/x$ を求め、$20\\log_{10}|D|$ をとります。'],
          sol: [[`$x = ka\\sin\\theta = ${n(kaOf(a / 100, f), 4)}\\times\\sin ${th}^\\circ = ${n(x, 4)}$.`, `$x = ka\\sin\\theta = ${n(kaOf(a / 100, f), 4)}\\times\\sin ${th}^\\circ = ${n(x, 4)}$ です。`], [`$J_1(${n(x, 3)}) = ${n(J1(x), 4)}$, so $D = ${n(D(x), 4)}$ and the level is $${n(L, 3)}$ dB.`, `$J_1(${n(x, 3)}) = ${n(J1(x), 4)}$ なので $D = ${n(D(x), 4)}$、レベルは $${n(L, 3)}$ dB です。`], ['This is the reading of the coloured curve for that angle on the right-hand graph at this frequency.', 'これは、右のグラフでその角度の曲線をこの周波数で読んだ値です。']],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      let a, f, ka;
      do { a = r.pick([2.5, 5, 6.5, 8, 10, 12.5]); f = r.pick([1000, 2000, 3000, 4000, 5000, 8000]); ka = kaOf(a / 100, f); } while (ka < 2.4 || ka > 20);
      const th = deg(Math.asin(X6 / ka));
      return {
        q: [`A piston of radius $${n(a)}$ cm plays $${n(f / 1000)}$ kHz. What is its $-6$ dB half-angle, the angle at which the level has fallen to half the on-axis pressure? Give one decimal in degrees.`, `半径 $${n(a)}$ cm のピストンが $${n(f / 1000)}$ kHz を鳴らします。$-6$ dB 半角、すなわち音圧が軸上の半分になる角度はいくらですか。度で小数第1位まで答えてください。`],
        a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
        hint: [`$2J_1(x)/x = \\tfrac12$ at $x = ${n(X6, 4)}$.`, `$2J_1(x)/x = \\tfrac12$ となるのは $x = ${n(X6, 4)}$ のときです。`],
        sol: [[`$ka = ${n(ka, 4)}$, and the half-pressure point needs $ka\\sin\\theta = ${n(X6, 4)}$.`, `$ka = ${n(ka, 4)}$ で、音圧が半分になる点では $ka\\sin\\theta = ${n(X6, 4)}$ です。`], [`$\\sin\\theta = ${n(X6 / ka, 4)}$, $\\theta = ${n(th, 2)}^\\circ$: the coverage is $\\pm${n(th, 1)}^\\circ$.`, `$\\sin\\theta = ${n(X6 / ka, 4)}$、$\\theta = ${n(th, 2)}^\\circ$ で、カバー範囲は $\\pm${n(th, 1)}^\\circ$ です。`]],
        set: { a, lf: lfOf(f, 2, 4.3) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, th, f;
        do { a = r.pick([2.5, 5, 6.5, 8, 10, 12.5, 15]); th = r.pick([30, 45, 60]); f = X6 * C / (TAU * a / 100 * Math.sin(rad(th))); } while (f < 120 || f > 19000);
        return {
          q: [`A loudspeaker should keep listeners within $\\pm${th}^\\circ$ of the axis inside its $-6$ dB beam. Up to what frequency can a piston of radius $${n(a)}$ cm do that?`, `スピーカーが軸から $\\pm${th}^\\circ$ の範囲の聴き手を $-6$ dB のビームの内側に収めたいとします。半径 $${n(a)}$ cm のピストンでそれができるのは何 Hz までですか。`],
          a: { type: 'num', v: f, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: [`The edge of the $-6$ dB beam is at $ka\\sin\\theta = ${n(X6, 3)}$; solve for $f$.`, `$-6$ dB のビームの縁は $ka\\sin\\theta = ${n(X6, 3)}$ にあります。$f$ について解きます。`],
          sol: [[`$\\dfrac{2\\pi f a}{c}\\sin ${th}^\\circ = ${n(X6, 4)}$.`, `$\\dfrac{2\\pi f a}{c}\\sin ${th}^\\circ = ${n(X6, 4)}$ です。`], [`$f = \\dfrac{${n(X6, 4)}\\times343}{2\\pi\\times${n(a / 100)}\\times${n(Math.sin(rad(th)), 4)}} = ${s3(f)}$ Hz.`, `$f = \\dfrac{${n(X6, 4)}\\times343}{2\\pi\\times${n(a / 100)}\\times${n(Math.sin(rad(th)), 4)}} = ${s3(f)}$ Hz です。`], ['Above this the driver beams too narrowly, so a two-way design should cross over to a smaller driver at or below it.', 'これより上ではビームが細くなりすぎるので、2 ウェイではこの周波数かそれより下で小さなドライバーに受け渡すべきです。']],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      if (form === 1) {
        if (r.chance(0.35)) {
          return {
            q: ['As $ka \\to 0$, what does the directivity index $\\mathrm{DI} = 10\\log_{10}\\dfrac{(ka)^2}{1 - J_1(2ka)/(ka)}$ of a piston in an infinite wall tend to?', '$ka \\to 0$ のとき、無限の壁にはめたピストンの指向性指数 $\\mathrm{DI} = 10\\log_{10}\\dfrac{(ka)^2}{1 - J_1(2ka)/(ka)}$ は何に近づきますか。'],
            a: { type: 'choice', opts: [['$3$ dB: all the power goes into half of space', '$3$ dB：全パワーが空間の半分に向かう'], ['$0$ dB: a small source is omnidirectional', '$0$ dB：小さな音源は無指向性'], ['$6$ dB: the wall doubles the pressure', '$6$ dB：壁が音圧を 2 倍にする'], ['$-\\infty$: a small piston radiates nothing', '$-\\infty$：小さなピストンは何も放射しない']], v: 0 },
            hint: ['Expand $J_1(2ka) \\approx ka - (ka)^3/2$ for small arguments.', '小さな引数では $J_1(2ka) \\approx ka - (ka)^3/2$ と展開できます。'],
            sol: [['$1 - J_1(2ka)/(ka) \\approx (ka)^2/2$, so the ratio tends to 2.', '$1 - J_1(2ka)/(ka) \\approx (ka)^2/2$ なので、比は 2 に近づきます。'], ['$10\\log_{10}2 = 3.01$ dB: the source is even in every direction, but the wall confines it to a hemisphere, which doubles the intensity on axis compared with the average over a full sphere.', '$10\\log_{10}2 = 3.01$ dB です。音源はどの向きにも一様ですが、壁が半球に閉じ込めるので、軸上の強さは全球の平均の 2 倍になります。']],
            set: { a: 2.5, lf: 2 },
          };
        }
        let a, f, ka;
        do { a = r.pick([2.5, 5, 6.5, 10, 12.5]); f = r.pick([500, 1000, 2000, 3000, 5000, 8000]); ka = kaOf(a / 100, f); } while (ka < 0.5 || ka > 8);
        const den = 1 - J1(2 * ka) / ka, DI = 10 * Math.log10(ka * ka / den);
        return {
          q: [`Find the directivity index of a piston of radius $${n(a)}$ cm at $${n(f / 1000)}$ kHz, using $\\mathrm{DI} = 10\\log_{10}\\dfrac{(ka)^2}{1 - J_1(2ka)/(ka)}$. Give one decimal.`, `半径 $${n(a)}$ cm のピストンの $${n(f / 1000)}$ kHz での指向性指数を $\\mathrm{DI} = 10\\log_{10}\\dfrac{(ka)^2}{1 - J_1(2ka)/(ka)}$ で求めてください。小数第1位までです。`],
          a: { type: 'num', v: DI, tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['Compute $ka$, then $J_1(2ka)$; the denominator is the total radiated power, the numerator the on-axis intensity.', '$ka$、次に $J_1(2ka)$ を計算します。分母は全放射パワー、分子は軸上の強さに対応します。'],
          sol: [[`$ka = ${n(ka, 4)}$ and $J_1(${n(2 * ka, 3)}) = ${n(J1(2 * ka), 4)}$.`, `$ka = ${n(ka, 4)}$、$J_1(${n(2 * ka, 3)}) = ${n(J1(2 * ka), 4)}$ です。`], [`$1 - J_1(2ka)/ka = ${n(den, 4)}$, so $\\mathrm{DI} = 10\\log_{10}(${n(ka * ka, 4)}/${n(den, 4)}) = ${n(DI, 3)}$ dB.`, `$1 - J_1(2ka)/ka = ${n(den, 4)}$ なので $\\mathrm{DI} = 10\\log_{10}(${n(ka * ka, 4)}/${n(den, 4)}) = ${n(DI, 3)}$ dB です。`], ['The on-axis level is that many dB above what the same power would give spread evenly over a sphere; it rises roughly as $20\\log_{10}ka$ once the piston beams.', '軸上のレベルは、同じパワーを全球に一様に広げた場合よりこれだけ高くなります。ピストンがビームを作り始めると、およそ $20\\log_{10}ka$ で増えます。']],
          set: { a, lf: lfOf(f, 2, 4.3) },
        };
      }
      const a = r.pick([2.5, 5, 6.5, 8, 10, 12.5]), K = Z1 * C / (TAU * a / 100);
      return {
        q: [`For a piston of radius $${n(a)}$ cm, write $\\sin\\theta_1$, the sine of the first-null angle, as a function of the frequency $f$ in hertz (valid once a null exists).`, `半径 $${n(a)}$ cm のピストンについて、最初の零点の角度の正弦 $\\sin\\theta_1$ を周波数 $f$（Hz）の関数として書いてください（零点が存在する範囲で）。`],
        a: { type: 'expr', v: `${Z1}*343/(2*pi*${a / 100}*f)`, vars: ['f'], dom: { f: [K * 1.05, K * 4] }, lhs: ['$\\sin\\theta_1(f) =$', '$\\sin\\theta_1(f) =$'] },
        hint: ['The first null is at $ka\\sin\\theta = 3.8317$ with $k = 2\\pi f/c$.', '最初の零点は $k = 2\\pi f/c$ として $ka\\sin\\theta = 3.8317$ にあります。'],
        sol: [[`$\\dfrac{2\\pi f\\times${n(a / 100)}}{343}\\sin\\theta_1 = 3.8317$.`, `$\\dfrac{2\\pi f\\times${n(a / 100)}}{343}\\sin\\theta_1 = 3.8317$ です。`], [`$\\sin\\theta_1 = \\dfrac{3.8317\\times343}{2\\pi\\times${n(a / 100)}f}$, which is below 1 only for $f > ${s3(K)}$ Hz.`, `$\\sin\\theta_1 = \\dfrac{3.8317\\times343}{2\\pi\\times${n(a / 100)}f}$ で、1 を下回るのは $f > ${s3(K)}$ Hz のときだけです。`], ['The null swings in from $90^\\circ$ as $1/f$: doubling the frequency halves $\\sin\\theta_1$.', '零点は $1/f$ に従って $90^\\circ$ から内側へ入ってきます。周波数を 2 倍にすると $\\sin\\theta_1$ は半分になります。']],
        set: { a, lf: lfOf(K * 1.6, 2, 4.3) },
      };
    },
  ];
})();
