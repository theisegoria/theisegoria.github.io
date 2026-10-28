'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, C = 343, SQ2 = Math.SQRT2;
  const s3 = (x) => sig(x, 3);
  const deg = (x) => x * 180 / PI, rad = (d) => d * PI / 180;
  const snap = (x, step, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / step) * step));
  const lfOf = (f, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Math.log10(f) * 100) / 100));
  const db = (x) => 20 * Math.log10(x);
  const hzT = (f) => (f >= 1000 ? `${sig(f / 1000, 3)}\\ \\mathrm{kHz}` : `${sig(f, 3)}\\ \\mathrm{Hz}`);

  /* ---------------- 1. RC and RLC filters ---------------- */
  const TYPES = [['RC low-pass', 'RC ローパス'], ['RC high-pass', 'RC ハイパス'], ['series RLC low-pass (output across C)', '直列 RLC ローパス（C の両端から出力）'], ['series RLC band-pass (output across R)', '直列 RLC バンドパス（R の両端から出力）']];
  Q['rlc-filters'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const R = r.pick([4, 8, 10, 20, 47, 50, 100]), Cu = r.pick([1, 2, 4.5, 10, 22, 47]), hp = r.chance(0.5);
        const fc = 1 / (TAU * R * Cu * 1e-6);
        return {
          q: [`An ${TYPES[hp ? 1 : 0][0]} has $R = ${n(R)}\\ \\Omega$ and $C = ${n(Cu)}\\ \\mu\\mathrm{F}$. What is its corner frequency?`, `$R = ${n(R)}\\ \\Omega$、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の${TYPES[hp ? 1 : 0][1]}の遮断周波数はいくらですか。`],
          a: { type: 'num', v: fc, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['At the corner the resistance equals the capacitor\'s reactance: $R = 1/(\\omega C)$.', '遮断周波数では抵抗がコンデンサーのリアクタンスに等しくなります。$R = 1/(\\omega C)$ です。'],
          sol: [[`$RC = ${n(R)}\\times${n(Cu)}\\times10^{-6} = ${sig(R * Cu * 1e-6, 3)}$ s.`, `$RC = ${n(R)}\\times${n(Cu)}\\times10^{-6} = ${sig(R * Cu * 1e-6, 3)}$ s です。`], [`$f_c = 1/(2\\pi RC) = ${hzT(fc)}$, where the gain is $-3$ dB and the phase is $${hp ? '+' : '-'}45^\\circ$.`, `$f_c = 1/(2\\pi RC) = ${hzT(fc)}$ で、そこで利得は $-3$ dB、位相は $${hp ? '+' : '-'}45^\\circ$ です。`]],
          set: { type: hp ? 1 : 0, R, C: Cu },
        };
      }
      if (form === 1) {
        const Lm = r.pick([0.5, 1, 2, 3.3, 4.7, 6.8, 10]), Cu = r.pick([1, 2, 4.5, 6.5, 10, 22, 33]);
        const f0 = 1 / (TAU * Math.sqrt(Lm * 1e-3 * Cu * 1e-6));
        return {
          q: [`A series RLC circuit has $L = ${n(Lm)}$ mH and $C = ${n(Cu)}\\ \\mu\\mathrm{F}$. At what frequency $f_0$ does it resonate?`, `$L = ${n(Lm)}$ mH、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の直列 RLC 回路はどの周波数 $f_0$ で共振しますか。`],
          a: { type: 'num', v: f0, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Resonance is where the reactances cancel: $\\omega L = 1/(\\omega C)$.', '共振はリアクタンスが打ち消し合うところ、$\\omega L = 1/(\\omega C)$ です。'],
          sol: [[`$LC = ${n(Lm)}\\times10^{-3}\\times${n(Cu)}\\times10^{-6} = ${sig(Lm * Cu * 1e-9, 3)}\\ \\mathrm{s^2}$.`, `$LC = ${n(Lm)}\\times10^{-3}\\times${n(Cu)}\\times10^{-6} = ${sig(Lm * Cu * 1e-9, 3)}\\ \\mathrm{s^2}$ です。`], [`$f_0 = 1/(2\\pi\\sqrt{LC}) = ${hzT(f0)}$; $R$ does not move it, it only sets how sharp the resonance is.`, `$f_0 = 1/(2\\pi\\sqrt{LC}) = ${hzT(f0)}$ です。$R$ は共振の位置を変えず、鋭さだけを決めます。`]],
          set: { type: 2, L: Lm, C: Cu },
        };
      }
      const ord = r.int(1, 4), oct = r.chance(0.5);
      return {
        q: [`Far into its stop band, how many dB per ${oct ? 'octave (to the nearest whole number)' : 'decade'} does a filter of order ${ord} fall?`, `阻止域の奥で、${ord} 次のフィルターは${oct ? '1 オクターブあたり（整数に丸めて）' : '10 倍の周波数あたり'}何 dB 下がりますか。`],
        a: { type: 'int', v: oct ? 6 * ord : 20 * ord },
        hint: ['Each pole contributes a factor that falls as $1/f$.', '極一つごとに $1/f$ で下がる因子が加わります。'],
        sol: [[`${ord} pole${ord > 1 ? 's' : ''}: the gain falls as $1/f^{${ord}}$.`, `極が ${ord} 個なので、利得は $1/f^{${ord}}$ で下がります。`], [oct ? `A factor 2 in frequency costs $20\\log_{10}2^{${ord}} = ${n(ord * 6.0206, 3)}$ dB, about ${6 * ord} dB.` : `A factor 10 in frequency costs $20\\log_{10}10^{${ord}} = ${20 * ord}$ dB.`, oct ? `周波数が 2 倍で $20\\log_{10}2^{${ord}} = ${n(ord * 6.0206, 3)}$ dB、約 ${6 * ord} dB 下がります。` : `周波数が 10 倍で $20\\log_{10}10^{${ord}} = ${20 * ord}$ dB 下がります。`]],
        set: ord <= 2 ? { type: ord === 1 ? 0 : 2 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const R = r.pick([5, 8, 10, 20, 50]), Cu = r.pick([2, 4.5, 10, 22]), fc = 1 / (TAU * R * Cu * 1e-6), k = r.pick([0.5, 2, 3, 5, 10, 0.25]);
        const f = fc * k, g = -10 * Math.log10(1 + k * k), ph = -deg(Math.atan(k));
        return {
          q: [`An RC low-pass with $R = ${n(R)}\\ \\Omega$, $C = ${n(Cu)}\\ \\mu\\mathrm{F}$ is driven at $${hzT(f)}$. Find its gain (dB) and phase (degrees).`, `$R = ${n(R)}\\ \\Omega$、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の RC ローパスを $${hzT(f)}$ で駆動します。利得（dB）と位相（度）を求めてください。`],
          a: { type: 'tuple', v: [g, ph], labels: ['$G$ (dB)', '$\\varphi$ (°)'], tol: 0.15 },
          hint: ['$H = 1/(1 + jf/f_c)$: find $f/f_c$ first.', '$H = 1/(1 + jf/f_c)$ です。まず $f/f_c$ を求めます。'],
          sol: [[`$f_c = 1/(2\\pi RC) = ${hzT(fc)}$, so $f/f_c = ${n(k)}$.`, `$f_c = 1/(2\\pi RC) = ${hzT(fc)}$ なので $f/f_c = ${n(k)}$ です。`], [`$G = -10\\log_{10}(1 + ${n(k * k)}) = ${n(g, 3)}$ dB and $\\varphi = -\\arctan ${n(k)} = ${n(ph, 3)}^\\circ$.`, `$G = -10\\log_{10}(1 + ${n(k * k)}) = ${n(g, 3)}$ dB、$\\varphi = -\\arctan ${n(k)} = ${n(ph, 3)}^\\circ$ です。`], [k > 1 ? 'Above the corner the output shrinks and lags towards a quarter cycle: the capacitor no longer has time to charge.' : 'Below the corner the capacitor keeps up with the input: little loss, little lag.', k > 1 ? '遮断周波数より上では出力は小さくなり、遅れは 1/4 周期に近づきます。コンデンサーが充電しきれないのです。' : '遮断周波数より下ではコンデンサーが入力についていけるので、損失も遅れも小さくなります。']],
          set: { type: 0, R, C: Cu, lf: lfOf(f, 1.5, 4.3) },
        };
      }
      if (form === 1) {
        const R = r.pick([2, 4, 5, 8, 10, 20]), Lm = r.pick([0.5, 1, 2, 4.7]), Cu = r.pick([2, 4.5, 10, 22]);
        const Qv = Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)) / R, f0 = 1 / (TAU * Math.sqrt(Lm * Cu * 1e-9));
        return {
          q: [`A series RLC low-pass (output across $C$) has $R = ${n(R)}\\ \\Omega$, $L = ${n(Lm)}$ mH, $C = ${n(Cu)}\\ \\mu\\mathrm{F}$. Find its $Q$ and its gain at $f_0$ in dB.`, `$R = ${n(R)}\\ \\Omega$、$L = ${n(Lm)}$ mH、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の直列 RLC ローパス（C の両端から出力）があります。$Q$ と、$f_0$ での利得（dB）を求めてください。`],
          a: { type: 'tuple', v: [Qv, db(Qv)], labels: ['$Q$', '$G(f_0)$ (dB)'], tol: 0.02 },
          hint: ['At $f_0$ the denominator $1 - \\omega^2LC + j\\omega RC$ is purely imaginary.', '$f_0$ では分母 $1 - \\omega^2LC + j\\omega RC$ が純虚数になります。'],
          sol: [[`$Q = \\dfrac1R\\sqrt{L/C} = \\dfrac{1}{${n(R)}}\\sqrt{${n(Lm)}\\times10^{-3}/${n(Cu)}\\times10^{-6}} = ${n(Qv, 4)}$.`, `$Q = \\dfrac1R\\sqrt{L/C} = \\dfrac{1}{${n(R)}}\\sqrt{${n(Lm)}\\times10^{-3}/${n(Cu)}\\times10^{-6}} = ${n(Qv, 4)}$ です。`], [`At $f_0 = ${hzT(f0)}$, $|H| = 1/(\\omega_0RC) = Q$, so $G = 20\\log_{10}${n(Qv, 4)} = ${n(db(Qv), 3)}$ dB.`, `$f_0 = ${hzT(f0)}$ では $|H| = 1/(\\omega_0RC) = Q$ なので、$G = 20\\log_{10}${n(Qv, 4)} = ${n(db(Qv), 3)}$ dB です。`], [Qv > 1 ? 'The voltage across the capacitor is larger than the input: energy sloshes between $L$ and $C$ and only $R$ limits it.' : 'With $Q < 1$ there is no gain at $f_0$: the resistor damps the resonance away.', Qv > 1 ? 'コンデンサーの両端の電圧は入力より大きくなります。エネルギーが $L$ と $C$ の間を行き来し、それを制限するのは $R$ だけです。' : '$Q < 1$ では $f_0$ で利得はありません。抵抗が共振を制動してしまいます。']],
          set: { type: 2, R, L: Lm, C: Cu, lf: lfOf(f0, 1.5, 4.3) },
        };
      }
      const R = r.pick([2, 4, 8, 10, 20, 50]), Lm = r.pick([1, 2, 4.7, 10]), Cu = r.pick([2, 4.5, 10, 22]);
      const Qv = Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)) / R, f0 = 1 / (TAU * Math.sqrt(Lm * Cu * 1e-9)), bw = f0 / Qv;
      return {
        q: [`A series RLC band-pass (output across $R$) has $R = ${n(R)}\\ \\Omega$, $L = ${n(Lm)}$ mH, $C = ${n(Cu)}\\ \\mu\\mathrm{F}$. What is its $-3$ dB bandwidth?`, `$R = ${n(R)}\\ \\Omega$、$L = ${n(Lm)}$ mH、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の直列 RLC バンドパス（R の両端から出力）の $-3$ dB 帯域幅はいくらですか。`],
        a: { type: 'num', v: bw, rel: 0.01, unit: ['Hz', 'Hz'] },
        hint: ['The bandwidth is $f_0/Q$, which simplifies to $R/(2\\pi L)$.', '帯域幅は $f_0/Q$ で、整理すると $R/(2\\pi L)$ になります。'],
        sol: [[`$f_0 = ${hzT(f0)}$ and $Q = ${n(Qv, 4)}$.`, `$f_0 = ${hzT(f0)}$、$Q = ${n(Qv, 4)}$ です。`], [`$\\Delta f = f_0/Q = R/(2\\pi L) = ${n(R)}/(2\\pi\\times${n(Lm / 1000)}) = ${hzT(bw)}$.`, `$\\Delta f = f_0/Q = R/(2\\pi L) = ${n(R)}/(2\\pi\\times${n(Lm / 1000)}) = ${hzT(bw)}$ です。`], ['It does not depend on $C$ at all: the capacitor only decides where the band sits, the resistor and inductor how wide it is.', '帯域幅は $C$ にまったく依存しません。コンデンサーは帯域の位置だけを決め、幅は抵抗とインダクターが決めます。']],
        set: { type: 3, R, L: Lm, C: Cu, lf: lfOf(f0, 1.5, 4.3) },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        let Lm, Cu, Qt, R;
        do { Lm = r.pick([0.5, 1, 2, 3.3, 4.7, 10]); Cu = r.pick([1, 2, 4.5, 10, 22, 47]); Qt = r.pick([0.5, 0.707, 1, 2]); R = Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)) / Qt; } while (R < 1 || R > 100);
        return {
          q: [`With $L = ${n(Lm)}$ mH and $C = ${n(Cu)}\\ \\mu\\mathrm{F}$ in a series RLC low-pass, what resistance gives $Q = ${n(Qt)}$${Qt === 0.707 ? ', the flattest (Butterworth) response' : ''}?`, `直列 RLC ローパスで $L = ${n(Lm)}$ mH、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ のとき、$Q = ${n(Qt)}$${Qt === 0.707 ? '（最も平らなバターワースの応答）' : ''}にする抵抗はいくらですか。`],
          a: { type: 'num', v: R, rel: 0.01, unit: ['Ω', 'Ω'] },
          hint: ['Invert $Q = \\sqrt{L/C}/R$; $\\sqrt{L/C}$ is the characteristic impedance of the $LC$ pair.', '$Q = \\sqrt{L/C}/R$ を逆に解きます。$\\sqrt{L/C}$ は $LC$ の組の特性インピーダンスです。'],
          sol: [[`$\\sqrt{L/C} = \\sqrt{${n(Lm / 1000)}/${n(Cu * 1e-6)}} = ${n(Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)), 4)}\\ \\Omega$.`, `$\\sqrt{L/C} = \\sqrt{${n(Lm / 1000)}/${n(Cu * 1e-6)}} = ${n(Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)), 4)}\\ \\Omega$ です。`], [`$R = ${n(Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)), 4)}/${n(Qt)} = ${n(R, 3)}\\ \\Omega$.`, `$R = ${n(Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)), 4)}/${n(Qt)} = ${n(R, 3)}\\ \\Omega$ です。`], ['Less resistance means less damping and a taller resonant peak; in a passive loudspeaker crossover the driver itself plays the part of $R$.', '抵抗が小さいほど制動は弱く、共振のピークは高くなります。パッシブのスピーカー用クロスオーバーでは、ドライバー自体が $R$ の役を担います。']],
          set: { type: 2, R: snap(R, 0.5, 1, 100), L: Lm, C: Cu },
        };
      }
      if (form === 1) {
        const R = r.pick([4, 8, 10, 20, 50, 100]), Cu = r.pick([1, 2, 4.5, 10, 22]), RC = R * Cu * 1e-6;
        return {
          q: [`Write the gain magnitude $|H(f)|$ of an RC low-pass with $R = ${n(R)}\\ \\Omega$ and $C = ${n(Cu)}\\ \\mu\\mathrm{F}$ as a function of the frequency $f$ in hertz.`, `$R = ${n(R)}\\ \\Omega$、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の RC ローパスの利得の大きさ $|H(f)|$ を、周波数 $f$（Hz）の関数として書いてください。`],
          a: { type: 'expr', v: `1/sqrt(1+(2*pi*${RC}*f)^2)`, vars: ['f'], dom: { f: [20, 20000] }, lhs: ['$|H(f)| =$', '$|H(f)| =$'] },
          hint: ['$|1/(1 + j\\omega RC)| = 1/\\sqrt{1 + (\\omega RC)^2}$ with $\\omega = 2\\pi f$.', '$\\omega = 2\\pi f$ として $|1/(1 + j\\omega RC)| = 1/\\sqrt{1 + (\\omega RC)^2}$ です。'],
          sol: [[`$RC = ${sig(RC, 3)}$ s.`, `$RC = ${sig(RC, 3)}$ s です。`], [`$|H(f)| = \\dfrac{1}{\\sqrt{1 + (2\\pi\\times${sig(RC, 3)}f)^2}}$.`, `$|H(f)| = \\dfrac{1}{\\sqrt{1 + (2\\pi\\times${sig(RC, 3)}f)^2}}$ です。`], [`It equals $1/\\sqrt2$ at $f_c = ${hzT(1 / (TAU * RC))}$ and falls as $1/f$ above it, the 20 dB per decade asymptote.`, `$f_c = ${hzT(1 / (TAU * RC))}$ で $1/\\sqrt2$ になり、それより上では $1/f$ で下がります。これが 10 倍あたり 20 dB の漸近線です。`]],
          set: { type: 0, R, C: Cu },
        };
      }
      if (form === 2) {
        let R, Lm, Cu, Qv;
        do { R = r.pick([1, 2, 3, 4, 5]); Lm = r.pick([1, 2, 4.7, 10]); Cu = r.pick([2, 4.5, 10, 22]); Qv = Math.sqrt(Lm * 1e-3 / (Cu * 1e-6)) / R; } while (Qv < 1 || Qv > 30);
        const f0 = 1 / (TAU * Math.sqrt(Lm * Cu * 1e-9)), fp = f0 * Math.sqrt(1 - 1 / (2 * Qv * Qv));
        return {
          q: [`A series RLC low-pass with $R = ${n(R)}\\ \\Omega$, $L = ${n(Lm)}$ mH, $C = ${n(Cu)}\\ \\mu\\mathrm{F}$ has a resonant peak. At what frequency is the gain largest? (It is not quite $f_0$.)`, `$R = ${n(R)}\\ \\Omega$、$L = ${n(Lm)}$ mH、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の直列 RLC ローパスは共振のピークをもちます。利得が最大になる周波数はいくらですか（$f_0$ ちょうどではありません）。`],
          a: { type: 'num', v: fp, rel: 0.002, unit: ['Hz', 'Hz'] },
          hint: ['Minimise $(1 - x^2)^2 + x^2/Q^2$ over $x = f/f_0$.', '$x = f/f_0$ について $(1 - x^2)^2 + x^2/Q^2$ を最小にします。'],
          sol: [[`$f_0 = ${hzT(f0)}$, $Q = ${n(Qv, 4)}$.`, `$f_0 = ${hzT(f0)}$、$Q = ${n(Qv, 4)}$ です。`], [`Setting the derivative in $y = x^2$ to zero: $-2(1 - y) + 1/Q^2 = 0$, so $x^2 = 1 - 1/(2Q^2) = ${n(1 - 1 / (2 * Qv * Qv), 5)}$.`, `$y = x^2$ で微分して 0 とおくと $-2(1 - y) + 1/Q^2 = 0$ なので $x^2 = 1 - 1/(2Q^2) = ${n(1 - 1 / (2 * Qv * Qv), 5)}$ です。`], [`$f_{\\rm peak} = ${hzT(fp)}$, slightly below $f_0$. The higher the Q, the closer the two; for $Q \\le 0.707$ there is no peak at all.`, `$f_{\\rm peak} = ${hzT(fp)}$ で、$f_0$ より少し下です。Q が高いほど二つは近づき、$Q \\le 0.707$ ではピーク自体がありません。`]],
          set: { type: 2, R, L: Lm, C: Cu, lf: lfOf(fp, 1.5, 4.3) },
        };
      }
      const R = r.pick([5, 8, 10, 20, 50]), Cu = r.pick([2, 4.5, 10, 22]), th = r.pick([30, 60, 75, 80, 15]), fc = 1 / (TAU * R * Cu * 1e-6), f = fc * Math.tan(rad(th));
      return {
        q: [`At what frequency does an RC low-pass with $R = ${n(R)}\\ \\Omega$, $C = ${n(Cu)}\\ \\mu\\mathrm{F}$ make its output lag the input by $${th}^\\circ$?`, `$R = ${n(R)}\\ \\Omega$、$C = ${n(Cu)}\\ \\mu\\mathrm{F}$ の RC ローパスで、出力が入力より $${th}^\\circ$ 遅れる周波数はいくらですか。`],
        a: { type: 'num', v: f, rel: 0.01, unit: ['Hz', 'Hz'] },
        hint: ['The phase is $-\\arctan(f/f_c)$; invert it.', '位相は $-\\arctan(f/f_c)$ です。これを逆に解きます。'],
        sol: [[`$f_c = 1/(2\\pi RC) = ${hzT(fc)}$.`, `$f_c = 1/(2\\pi RC) = ${hzT(fc)}$ です。`], [`$f = f_c\\tan ${th}^\\circ = ${n(Math.tan(rad(th)), 4)}f_c = ${hzT(f)}$.`, `$f = f_c\\tan ${th}^\\circ = ${n(Math.tan(rad(th)), 4)}f_c = ${hzT(f)}$ です。`], [`${th > 45 ? 'Above' : 'Below'} the corner, as it must be: the lag passes $45^\\circ$ exactly at $f_c$ and approaches $90^\\circ$ only slowly.`, `当然ながら遮断周波数より${th > 45 ? '上' : '下'}です。遅れはちょうど $f_c$ で $45^\\circ$ を過ぎ、$90^\\circ$ にはゆっくりとしか近づきません。`]],
        set: { type: 0, R, C: Cu, lf: lfOf(f, 1.5, 4.3) },
      };
    },
  ];

  /* ---------------- 2. crossover sum ---------------- */
  const XN = [['first-order Butterworth crossover', '一次バターワース'], ['second-order Butterworth crossover', '二次バターワース'], ['second-order Butterworth crossover with the tweeter inverted', 'ツイーターを反転した二次バターワース'], ['LR2 crossover with the tweeter inverted', 'ツイーターを反転した LR2'], ['LR4 crossover', 'LR4']];
  const lr4 = (x) => ({ lp: -db(1 + x ** 4), hp: -db(1 + x ** -4) });
  const fcs = [500, 800, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
  Q['crossover-sum'] = [
    (r) => {
      const form = r.int(0, 2), t = r.int(0, 4), fc = r.pick(fcs);
      if (form === 0) {
        const L = t <= 2 ? -10 * Math.log10(2) : -db(2);
        return {
          q: [`Take a ${XN[t][0]}, set to $${hzT(fc)}$. What is the level of each half at the crossover frequency? Give two decimals in dB.`, `$${hzT(fc)}$ の${XN[t][1]}のクロスオーバーで、クロスオーバー周波数における各半分のレベルはいくらですか。dB で小数第2位まで答えてください。`],
          a: { type: 'num', v: L, tol: 0.02, unit: ['dB', 'dB'] },
          hint: [t <= 2 ? 'Butterworth halves are each half power at $f_c$.' : 'A Linkwitz-Riley half is a Butterworth filter squared.', t <= 2 ? 'バターワースの各半分は $f_c$ でパワーが半分です。' : 'リンクウィッツ・ライリーの半分は、バターワースを二乗したものです。'],
          sol: [[t <= 2 ? 'Butterworth: $|H|^2 = 1/(1 + x^{2n})$ is exactly $\\tfrac12$ at $x = 1$.' : 'Linkwitz-Riley: $|H| = 1/(1 + x^{2n})$ is exactly $\\tfrac12$ at $x = 1$.', t <= 2 ? 'バターワース：$|H|^2 = 1/(1 + x^{2n})$ は $x = 1$ でちょうど $\\tfrac12$ です。' : 'リンクウィッツ・ライリー：$|H| = 1/(1 + x^{2n})$ は $x = 1$ でちょうど $\\tfrac12$ です。'], [`${t <= 2 ? '$10\\log_{10}\\tfrac12$' : '$20\\log_{10}\\tfrac12$'} $= ${n(L, 3)}$ dB. ${t <= 2 ? 'Half power each, so the powers sum to one.' : 'Half amplitude each, so in phase they sum to one.'}`, `${t <= 2 ? '$10\\log_{10}\\tfrac12$' : '$20\\log_{10}\\tfrac12$'} $= ${n(L, 3)}$ dB です。${t <= 2 ? '各々パワーが半分なので、パワーの和が 1 になります。' : '各々振幅が半分なので、同位相なら和が 1 になります。'}`]],
          set: { type: t, fc, lf: lfOf(fc, 2, 4.3) },
        };
      }
      if (form === 1) {
        const sl = [6, 12, 12, 12, 24][t];
        return {
          q: [`How steeply (dB per octave, nearest whole number) does each half of a ${XN[t][0]} fall far from the crossover frequency?`, `${XN[t][1]}のクロスオーバーの各半分は、クロスオーバー周波数から遠く離れたところで 1 オクターブあたり何 dB 下がりますか（整数）。`],
          a: { type: 'int', v: sl },
          hint: ['Count the poles of each half.', '各半分の極の数を数えてください。'],
          sol: [[`Each half has ${sl / 6} pole${sl > 6 ? 's' : ''}${t === 3 ? ' (two first-order sections in cascade)' : t === 4 ? ' (two second-order Butterworth sections in cascade)' : ''}.`, `各半分の極は ${sl / 6} 個です${t === 3 ? '（一次の段を二つ縦続にしたもの）' : t === 4 ? '（二次バターワースの段を二つ縦続にしたもの）' : ''}。`], [`$${sl / 6}\\times 6 = ${sl}$ dB per octave. Polarity does not change the slope, only the phase.`, `$${sl / 6}\\times 6 = ${sl}$ dB/オクターブです。極性は傾きを変えず、位相だけを変えます。`]],
          set: { type: t, fc },
        };
      }
      const v = [1, 2, 0, 0, 0][t];
      return {
        q: [`In a ${XN[t][0]}, by how much does the tweeter's output lead the woofer's in phase, exactly at the crossover frequency?`, `${XN[t][1]}のクロスオーバーで、ちょうどクロスオーバー周波数において、ツイーターの出力はウーファーより位相がどれだけ進んでいますか。`],
        a: { type: 'choice', opts: [['$0^\\circ$: in phase', '$0^\\circ$：同位相'], ['$90^\\circ$', '$90^\\circ$'], ['$180^\\circ$: opposite', '$180^\\circ$：逆相']], v, fixed: true },
        hint: ['Evaluate both halves at $s = j$ and compare the arrows.', '両方の半分を $s = j$ で計算し、矢印を比べてください。'],
        sol: [[['$H_{\\rm lp} = 1/(1 + j)$, $H_{\\rm hp} = j/(1 + j)$: the ratio is $j$.', '$H_{\\rm lp} = -j/\\sqrt2$, $H_{\\rm hp} = s^2/(\\sqrt2 j) = +j/\\sqrt2$: the ratio is $-1$.', 'Normally $H_{\\rm hp} = -H_{\\rm lp}$ at $f_c$; inverting the tweeter flips it to $+H_{\\rm lp}$.', '$H_{\\rm lp} = 1/(1 + j)^2 = -j/2$, $H_{\\rm hp} = -s^2/(1 + s)^2 = -j/2$: equal.', '$H_{\\rm lp} = 1/(\\sqrt2 j)^2 = -\\tfrac12$ and $H_{\\rm hp} = s^4/(\\sqrt2 j)^2 = -\\tfrac12$: equal.'][t], ['$H_{\\rm lp} = 1/(1 + j)$、$H_{\\rm hp} = j/(1 + j)$ で、比は $j$ です。', '$H_{\\rm lp} = -j/\\sqrt2$、$H_{\\rm hp} = s^2/(\\sqrt2 j) = +j/\\sqrt2$ で、比は $-1$ です。', '通常は $f_c$ で $H_{\\rm hp} = -H_{\\rm lp}$ ですが、ツイーターを反転すると $+H_{\\rm lp}$ になります。', '$H_{\\rm lp} = 1/(1 + j)^2 = -j/2$、$H_{\\rm hp} = -s^2/(1 + s)^2 = -j/2$ で、等しくなります。', '$H_{\\rm lp} = 1/(\\sqrt2 j)^2 = -\\tfrac12$、$H_{\\rm hp} = s^4/(\\sqrt2 j)^2 = -\\tfrac12$ で、等しくなります。'][t]], [['A quarter cycle apart: the two arrows are at right angles, and their sum has magnitude 1.', 'Opposite: equal and opposite arrows cancel, leaving a notch.', 'In phase: the arrows add to $\\sqrt2$, a 3 dB bump.', 'In phase: two halves of $\\tfrac12$ add to exactly 1.', 'In phase: two halves of $\\tfrac12$ add to exactly 1.'][t], ['1/4 周期ずれて矢印は直角になり、和の大きさは 1 です。', '逆相です。等しく逆向きの矢印が打ち消し合い、落ち込みが残ります。', '同位相で、矢印は足して $\\sqrt2$、3 dB の盛り上がりになります。', '同位相で、$\\tfrac12$ の二つの半分の和はちょうど 1 です。', '同位相で、$\\tfrac12$ の二つの半分の和はちょうど 1 です。'][t]]],
        set: { type: t, fc, lf: lfOf(fc, 2, 4.3) },
      };
    },
    (r) => {
      const form = r.int(0, 2), fc = r.pick(fcs);
      if (form === 0) {
        const x = r.pick([0.25, 0.5, 0.7, 1.5, 2, 3, 4]), f = x * fc, L = lr4(x);
        return {
          q: [`An LR4 crossover is set to $${hzT(fc)}$. At $${hzT(f)}$, what are the levels of the woofer and the tweeter outputs in dB?`, `LR4 クロスオーバーを $${hzT(fc)}$ に設定します。$${hzT(f)}$ でのウーファーとツイーターの出力レベルはそれぞれ何 dB ですか。`],
          a: { type: 'tuple', v: [L.lp, L.hp], labels: [['woofer (dB)', 'ウーファー（dB）'], ['tweeter (dB)', 'ツイーター（dB）']], tol: 0.1 },
          hint: ['$|B_2(jx)|^2 = 1 + x^4$ for the Butterworth quadratic, and LR4 is its square.', 'バターワースの二次式では $|B_2(jx)|^2 = 1 + x^4$ で、LR4 はその二乗です。'],
          sol: [[`$x = f/f_c = ${n(x)}$, so $|H_{\\rm lp}| = 1/(1 + x^4) = 1/${n(1 + x ** 4, 4)}$ and $|H_{\\rm hp}| = x^4/(1 + x^4)$.`, `$x = f/f_c = ${n(x)}$ なので $|H_{\\rm lp}| = 1/(1 + x^4) = 1/${n(1 + x ** 4, 4)}$、$|H_{\\rm hp}| = x^4/(1 + x^4)$ です。`], [`Woofer $${n(L.lp, 3)}$ dB, tweeter $${n(L.hp, 3)}$ dB.`, `ウーファーは $${n(L.lp, 3)}$ dB、ツイーターは $${n(L.hp, 3)}$ dB です。`], [`${x < 1 ? 'Below' : 'Above'} $f_c$ the ${x < 1 ? 'woofer' : 'tweeter'} carries nearly everything, and the other half is already ${n(Math.abs(Math.min(L.lp, L.hp)), 1)} dB down.`, `$f_c$ より${x < 1 ? '下ではウーファー' : '上ではツイーター'}がほぼすべてを担い、もう一方はすでに ${n(Math.abs(Math.min(L.lp, L.hp)), 1)} dB 下がっています。`]],
          set: { type: 4, fc, lf: lfOf(f, 2, 4.3) },
        };
      }
      if (form === 1) {
        const x = r.pick([0.5, 1, 2, 0.25, 1.5, 3]), f = x * fc;
        const lr = r.chance(0.5);
        const ph = lr ? -2 * deg(Math.atan2(SQ2 * x, 1 - x * x)) : -2 * deg(Math.atan(x));
        return {
          q: [`The ${lr ? 'LR4' : 'LR2 (tweeter inverted)'} pair sums to an all-pass${lr ? ' $(s^2 - \\sqrt2 s + 1)/(s^2 + \\sqrt2 s + 1)$' : ' $(1 - s)/(1 + s)$'} with $s = jf/f_c$. With $f_c = ${hzT(fc)}$, what is the phase of the sum at $${hzT(f)}$, in degrees (between $-360^\\circ$ and $0^\\circ$)?`, `${lr ? 'LR4' : 'LR2（ツイーター反転）'}の組の和は、$s = jf/f_c$ としてオールパス${lr ? ' $(s^2 - \\sqrt2 s + 1)/(s^2 + \\sqrt2 s + 1)$' : ' $(1 - s)/(1 + s)$'} になります。$f_c = ${hzT(fc)}$ のとき、$${hzT(f)}$ での和の位相は何度ですか（$-360^\\circ$ から $0^\\circ$ の間）。`],
          a: { type: 'num', v: ph, tol: 0.3, unit: ['°', '°'] },
          hint: ['Numerator and denominator are complex conjugates on the $j\\omega$ axis, so the phase is minus twice the denominator\'s angle.', '$j\\omega$ 軸上では分子と分母は互いに複素共役なので、位相は分母の偏角の $-2$ 倍です。'],
          sol: [[lr ? `The denominator at $x = ${n(x)}$ is $${n(1 - x * x, 4)} + ${n(SQ2 * x, 4)}j$, with angle $${n(deg(Math.atan2(SQ2 * x, 1 - x * x)), 3)}^\\circ$.` : `The denominator at $x = ${n(x)}$ is $1 + ${n(x)}j$, with angle $\\arctan ${n(x)} = ${n(deg(Math.atan(x)), 3)}^\\circ$.`, lr ? `$x = ${n(x)}$ での分母は $${n(1 - x * x, 4)} + ${n(SQ2 * x, 4)}j$ で、偏角は $${n(deg(Math.atan2(SQ2 * x, 1 - x * x)), 3)}^\\circ$ です。` : `$x = ${n(x)}$ での分母は $1 + ${n(x)}j$ で、偏角は $\\arctan ${n(x)} = ${n(deg(Math.atan(x)), 3)}^\\circ$ です。`], [`The phase of the sum is $${n(ph, 3)}^\\circ$, while its magnitude stays exactly 1.`, `和の位相は $${n(ph, 3)}^\\circ$ で、大きさはちょうど 1 のままです。`], [lr ? 'LR4 turns through $-180^\\circ$ at $f_c$ and $-360^\\circ$ in all: flat in level, but not in time.' : 'LR2 turns through $-90^\\circ$ at $f_c$ and $-180^\\circ$ in all.', lr ? 'LR4 は $f_c$ で $-180^\\circ$、全体で $-360^\\circ$ 回ります。レベルは平らですが、時間的には平らではありません。' : 'LR2 は $f_c$ で $-90^\\circ$、全体で $-180^\\circ$ 回ります。']],
          set: { type: lr ? 4 : 3, fc, lf: lfOf(f, 2, 4.3) },
        };
      }
      const t = r.pick([0, 2, 3, 4]), sum = [1, SQ2, 1, 1, 1][t], L = db(sum);
      return {
        q: [`Take a ${XN[t][0]}. What is the level of its acoustic sum at exactly the crossover frequency, relative to the input? Give two decimals in dB.`, `${XN[t][1]}のクロスオーバーで、ちょうどクロスオーバー周波数における音響的な和のレベルは、入力に対して何 dB ですか。小数第2位まで答えてください。`],
        a: { type: 'num', v: L, tol: 0.02, unit: ['dB', 'dB'] },
        hint: ['Add the two halves as complex numbers at $s = j$.', '二つの半分を $s = j$ で複素数として足してください。'],
        sol: [[['$\\dfrac{1}{1 + j} + \\dfrac{j}{1 + j} = 1$.', '', '$-\\dfrac{j}{\\sqrt2} - \\dfrac{j}{\\sqrt2} = -\\sqrt2 j$, magnitude $\\sqrt2$.', '$-\\dfrac{j}{2} - \\dfrac{j}{2} = -j$, magnitude 1.', '$-\\tfrac12 - \\tfrac12 = -1$, magnitude 1.'][t], ['$\\dfrac{1}{1 + j} + \\dfrac{j}{1 + j} = 1$ です。', '', '$-\\dfrac{j}{\\sqrt2} - \\dfrac{j}{\\sqrt2} = -\\sqrt2 j$ で、大きさは $\\sqrt2$ です。', '$-\\dfrac{j}{2} - \\dfrac{j}{2} = -j$ で、大きさは 1 です。', '$-\\tfrac12 - \\tfrac12 = -1$ で、大きさは 1 です。'][t]], [`$20\\log_{10}${t === 2 ? '\\sqrt2' : '1'} = ${n(L, 3)}$ dB. ${t === 2 ? 'Butterworth halves sum flat in power, not in voltage, so the inverted pair bumps up 3 dB.' : 'The sum is flat at the crossover.'}`, `$20\\log_{10}${t === 2 ? '\\sqrt2' : '1'} = ${n(L, 3)}$ dB です。${t === 2 ? 'バターワースの半分はパワーでは平らに足し合わされますが電圧ではそうならないので、反転した組は 3 dB 盛り上がります。' : '和はクロスオーバーで平らです。'}`]],
        set: { type: t, fc, lf: lfOf(fc, 2, 4.3) },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const fc = r.pick(fcs), tau = SQ2 / (PI * fc);
        return {
          q: [`At frequencies well below an LR4 crossover at $${hzT(fc)}$, the summed output is delayed by a constant group delay. How long, in microseconds?`, `$${hzT(fc)}$ の LR4 クロスオーバーより十分低い周波数では、和の出力は一定の群遅延だけ遅れます。何マイクロ秒ですか。`],
          a: { type: 'num', v: tau * 1e6, rel: 0.01, unit: ['µs', 'µs'] },
          hint: ['The sum\'s phase is $-2\\arctan\\dfrac{\\sqrt2 x}{1 - x^2}$; for small $x$ it is linear in $\\omega$, and the group delay is minus its slope.', '和の位相は $-2\\arctan\\dfrac{\\sqrt2 x}{1 - x^2}$ で、$x$ が小さいときは $\\omega$ に比例します。群遅延はその傾きの符号を変えたものです。'],
          sol: [['For small $x = \\omega/\\omega_c$, $\\varphi \\approx -2\\sqrt2\\,x = -2\\sqrt2\\,\\omega/\\omega_c$.', '小さな $x = \\omega/\\omega_c$ では $\\varphi \\approx -2\\sqrt2\\,x = -2\\sqrt2\\,\\omega/\\omega_c$ です。'], [`$\\tau = -d\\varphi/d\\omega = 2\\sqrt2/\\omega_c = \\sqrt2/(\\pi f_c) = ${s3(tau * 1e6)}\\ \\mu\\mathrm{s}$.`, `$\\tau = -d\\varphi/d\\omega = 2\\sqrt2/\\omega_c = \\sqrt2/(\\pi f_c) = ${s3(tau * 1e6)}\\ \\mu\\mathrm{s}$ です。`], ['The bass arrives that much later than the treble would: a fraction of a millisecond, below what the ear notices on its own.', '低音は高音に比べてそれだけ遅れて届きます。1 ミリ秒に満たず、それだけでは耳に気づかれない程度です。']],
          set: { type: 4, fc },
        };
      }
      if (form === 1) {
        return {
          q: ['The LR2 pair with the tweeter inverted sums to $(1 - s)/(1 + s)$ with $s = jx$, $x = f/f_c$. Write the phase $\\varphi(x)$ of the sum in radians.', 'ツイーターを反転した LR2 の組の和は、$s = jx$、$x = f/f_c$ として $(1 - s)/(1 + s)$ です。和の位相 $\\varphi(x)$ をラジアンで書いてください。'],
          a: { type: 'expr', v: '-2*atan(x)', vars: ['x'], dom: { x: [0.1, 5] }, lhs: ['$\\varphi(x) =$', '$\\varphi(x) =$'] },
          hint: ['$1 - jx$ and $1 + jx$ have equal magnitude and opposite angles.', '$1 - jx$ と $1 + jx$ は大きさが等しく、偏角が逆です。'],
          sol: [['$H_{\\rm lp} - H_{\\rm hp} = \\dfrac{1 - s^2}{(1 + s)^2} = \\dfrac{1 - s}{1 + s}$.', '$H_{\\rm lp} - H_{\\rm hp} = \\dfrac{1 - s^2}{(1 + s)^2} = \\dfrac{1 - s}{1 + s}$ です。'], ['$\\arg(1 - jx) - \\arg(1 + jx) = -2\\arctan x$.', '$\\arg(1 - jx) - \\arg(1 + jx) = -2\\arctan x$ です。'], ['It passes $-\\pi/2$ at the crossover and tends to $-\\pi$: a first-order all-pass, the cheapest flat sum.', 'クロスオーバーで $-\\pi/2$ を通り、$-\\pi$ に近づきます。一次のオールパスで、最も安価に平らな和を得る方法です。']],
          set: { type: 3 },
        };
      }
      if (form === 2) {
        const opts = [['power sum 1, voltage sum 0', 'パワーの和 1、電圧の和 0'], ['power sum 1, voltage sum 1', 'パワーの和 1、電圧の和 1'], ['power sum $\\tfrac12$, voltage sum 0', 'パワーの和 $\\tfrac12$、電圧の和 0'], ['power sum 2, voltage sum $\\sqrt2$', 'パワーの和 2、電圧の和 $\\sqrt2$']];
        return {
          q: ['For a second-order Butterworth pair with normal polarity, what are $|H_{\\rm lp}|^2 + |H_{\\rm hp}|^2$ and $|H_{\\rm lp} + H_{\\rm hp}|$ at the crossover frequency?', '通常の極性の二次バターワースの組で、クロスオーバー周波数での $|H_{\\rm lp}|^2 + |H_{\\rm hp}|^2$ と $|H_{\\rm lp} + H_{\\rm hp}|$ はいくらですか。'],
          a: { type: 'choice', opts, v: 0 },
          hint: ['At $s = j$: $H_{\\rm lp} = -j/\\sqrt2$, $H_{\\rm hp} = +j/\\sqrt2$.', '$s = j$ で $H_{\\rm lp} = -j/\\sqrt2$、$H_{\\rm hp} = +j/\\sqrt2$ です。'],
          sol: [['Each has magnitude $1/\\sqrt2$, so the powers sum to $\\tfrac12 + \\tfrac12 = 1$.', '大きさはどちらも $1/\\sqrt2$ なので、パワーの和は $\\tfrac12 + \\tfrac12 = 1$ です。'], ['They point in opposite directions, so the voltages, which the air adds, cancel to zero: a deep notch, though the total power fed to the drivers is flat.', '向きが逆なので、空気が足し合わせる電圧は打ち消し合って 0 になります。ドライバーへ送られる全パワーは平らなのに、深い落ち込みができます。']],
          set: { type: 1, lf: lfOf(2500, 2, 4.3), fc: 2500 },
        };
      }
      let fc, x, L;
      do { fc = r.step(800, 4000, 50); x = r.pick([0.5, 0.6, 0.7, 0.8, 1.25, 1.5]); L = -db(1 + x ** 4); } while (fc * x < 120);
      const f = Math.round(fc * x / 10) * 10, Lr = -db(1 + (f / fc) ** 4), Lq = Math.round(Lr * 100) / 100;
      const fcs2 = f / Math.pow(Math.pow(10, -Lq / 20) - 1, 0.25);
      return {
        q: [`In an LR4 crossover, the woofer is measured at $${n(Lq)}$ dB at $${f}$ Hz. What is the crossover frequency?`, `LR4 クロスオーバーで、ウーファーは $${f}$ Hz で $${n(Lq)}$ dB と測定されました。クロスオーバー周波数はいくらですか。`],
        a: { type: 'num', v: fcs2, rel: 0.01, unit: ['Hz', 'Hz'] },
        hint: ['Solve $-20\\log_{10}(1 + x^4) = L$ for $x = f/f_c$.', '$x = f/f_c$ について $-20\\log_{10}(1 + x^4) = L$ を解きます。'],
        sol: [[`$1 + x^4 = 10^{${n(-Lq)}/20} = ${n(Math.pow(10, -Lq / 20), 5)}$, so $x = ${n(f / fcs2, 4)}$.`, `$1 + x^4 = 10^{${n(-Lq)}/20} = ${n(Math.pow(10, -Lq / 20), 5)}$ なので $x = ${n(f / fcs2, 4)}$ です。`], [`$f_c = ${f}/${n(f / fcs2, 4)} = ${s3(fcs2)}$ Hz. ${Lq > -6.02 ? 'The woofer is less than 6 dB down, so the measurement was below $f_c$.' : 'More than 6 dB down: the measurement was above $f_c$.'}`, `$f_c = ${f}/${n(f / fcs2, 4)} = ${s3(fcs2)}$ Hz です。${Lq > -6.02 ? 'ウーファーの低下は 6 dB 未満なので、測定は $f_c$ より下で行われました。' : '6 dB より大きく下がっているので、測定は $f_c$ より上です。'}`]],
        set: { type: 4, fc: snap(fcs2, 50, 500, 5000), lf: lfOf(f, 2, 4.3) },
      };
    },
  ];

  /* ---------------- 3. driver offset ---------------- */
  const H4 = (fc, dt) => Math.abs(Math.cos(PI * fc * dt)); // LR4 sum at fc with tweeter delay dt
  Q['driver-offset'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.pick([10, 12, 15, 18, 20, 25]), dz = r.pick([0, 0, 1, 2, 3, -1]), th = r.pick([-30, -20, -10, 10, 15, 20, 30, 45]);
        const d = dz * Math.cos(rad(th)) - h * Math.sin(rad(th));
        return {
          q: [`The tweeter is $${h}$ cm above the woofer${dz ? ` and $${n(Math.abs(dz))}$ cm ${dz > 0 ? 'behind' : 'in front of'} it` : ''}. For a distant listener $${th}^\\circ$ ${th > 0 ? 'above' : 'below'} the axis, how much longer is the path from the tweeter than from the woofer, in cm?`, `ツイーターはウーファーの $${h}$ cm 上${dz ? `、$${n(Math.abs(dz))}$ cm ${dz > 0 ? '奥' : '手前'}` : ''}にあります。軸から $${Math.abs(th)}^\\circ$ ${th > 0 ? '上' : '下'}の遠くの聴き手にとって、ツイーターからの経路はウーファーからよりどれだけ長いですか（cm）。`],
          a: { type: 'num', v: d, tol: 0.05, unit: ['cm', 'cm'] },
          hint: ['Project the offset between the drivers onto the direction of the listener: $\\Delta = d_z\\cos\\theta - h\\sin\\theta$.', 'ドライバー間のずれを聴き手の方向に射影します。$\\Delta = d_z\\cos\\theta - h\\sin\\theta$ です。'],
          sol: [[`$\\Delta = ${n(dz)}\\cos ${th}^\\circ - ${h}\\sin ${th}^\\circ = ${n(dz * Math.cos(rad(th)), 3)} - (${n(h * Math.sin(rad(th)), 3)})$.`, `$\\Delta = ${n(dz)}\\cos ${th}^\\circ - ${h}\\sin ${th}^\\circ = ${n(dz * Math.cos(rad(th)), 3)} - (${n(h * Math.sin(rad(th)), 3)})$ です。`], [`$\\Delta = ${n(d, 3)}$ cm. ${d < 0 ? 'Negative: the tweeter is nearer this listener, and its sound arrives first.' : 'Positive: the tweeter\'s sound arrives late.'}`, `$\\Delta = ${n(d, 3)}$ cm です。${d < 0 ? '負なので、この聴き手にはツイーターのほうが近く、その音が先に届きます。' : '正なので、ツイーターの音は遅れて届きます。'}`]],
          set: { h, dz, ang: th },
        };
      }
      if (form === 1) {
        const dz = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), us = dz / 100 / C * 1e6;
        return {
          q: [`The tweeter's acoustic centre is $${n(dz)}$ cm behind the woofer's. How many microseconds later does its sound reach a listener on the axis?`, `ツイーターの音響中心はウーファーより $${n(dz)}$ cm 奥にあります。軸上の聴き手に、その音は何マイクロ秒遅れて届きますか。`],
          a: { type: 'num', v: us, rel: 0.01, unit: ['µs', 'µs'] },
          hint: ['Divide the extra distance by the speed of sound, $343$ m/s.', '余分な距離を音速 $343$ m/s で割ります。'],
          sol: [[`$\\Delta t = ${n(dz / 100)}/343 = ${sig(dz / 100 / C, 3)}$ s.`, `$\\Delta t = ${n(dz / 100)}/343 = ${sig(dz / 100 / C, 3)}$ s です。`], [`That is $${s3(us)}\\ \\mu\\mathrm{s}$, about ${n(us * 2500 / 1e6 * 360, 2)} degrees of phase at 2.5 kHz.`, `これは $${s3(us)}\\ \\mu\\mathrm{s}$ で、2.5 kHz での位相にしておよそ ${n(us * 2500 / 1e6 * 360, 2)} 度です。`]],
          set: { h: 0, dz, ang: 0 },
        };
      }
      const fc = r.pick([1000, 1500, 2000, 2500, 3000, 4000]), lam = C / fc * 100, h = r.pick([10, 15, 20, 25]);
      return {
        q: [`What is the wavelength at a $${hzT(fc)}$ crossover? Compare it with a driver spacing of $${h}$ cm.`, `$${hzT(fc)}$ のクロスオーバーでの波長はいくらですか。ドライバー間隔 $${h}$ cm と比べてみてください。`],
        a: { type: 'num', v: lam, rel: 0.01, unit: ['cm', 'cm'] },
        hint: ['$\\lambda = c/f$.', '$\\lambda = c/f$ です。'],
        sol: [[`$\\lambda = 343/${fc} = ${n(lam / 100, 4)}$ m $= ${s3(lam)}$ cm.`, `$\\lambda = 343/${fc} = ${n(lam / 100, 4)}$ m $= ${s3(lam)}$ cm です。`], [h >= lam / 2 ? `The spacing is ${n(h / lam, 2)} wavelengths, more than half: a full half-wave path difference, and so a null, fits inside the front half-space.` : `The spacing is ${n(h / lam, 2)} wavelengths, less than half: no complete null can form in front, only a dip.`, h >= lam / 2 ? `間隔は ${n(h / lam, 2)} 波長で半波長より大きいので、半波長の経路差、つまり零点が前方の半空間に入ります。` : `間隔は ${n(h / lam, 2)} 波長で半波長より小さいので、前方には完全な零点はできず、くぼみだけになります。`]],
        set: { h, fc, dz: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let h, fc, q;
        do { h = r.pick([10, 12, 15, 18, 20, 25, 30]); fc = r.pick([1500, 2000, 2500, 3000, 3500, 4000]); q = C / (2 * fc * h / 100); } while (q > 0.95);
        const th = deg(Math.asin(q));
        return {
          q: [`Drivers $${h}$ cm apart vertically, in the same plane, with an LR4 crossover at $${hzT(fc)}$. At what angle above the axis is the first null at the crossover frequency? Give one decimal in degrees.`, `縦に $${h}$ cm 離れ、同じ面にあるドライバーを $${hzT(fc)}$ の LR4 でつなぎます。クロスオーバー周波数での最初の零点は軸から上へ何度ですか。度で小数第1位まで答えてください。`],
          a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
          hint: ['At $f_c$ the two LR4 halves are equal and in phase, so they cancel where the path difference is half a wavelength.', '$f_c$ では LR4 の二つの半分は等しく同位相なので、経路差が半波長のところで打ち消し合います。'],
          sol: [[`$h\\sin\\theta = \\lambda/2 = 343/(2\\times${fc}) = ${n(C / (2 * fc) * 100, 3)}$ cm.`, `$h\\sin\\theta = \\lambda/2 = 343/(2\\times${fc}) = ${n(C / (2 * fc) * 100, 3)}$ cm です。`], [`$\\sin\\theta = ${n(C / (2 * fc) * 100, 3)}/${h} = ${n(q, 4)}$, $\\theta = ${n(th, 2)}^\\circ$, and by symmetry the same angle below.`, `$\\sin\\theta = ${n(C / (2 * fc) * 100, 3)}/${h} = ${n(q, 4)}$ より $\\theta = ${n(th, 2)}^\\circ$ で、対称性から下側にも同じ角度があります。`], ['Every listener between these two angles gets a usable sum; outside them, the crossover region falls into a hole.', 'この二つの角度の間の聴き手は使える和を聞きますが、その外ではクロスオーバー付近が穴に落ちます。']],
          set: { h, dz: 0, fc, ang: Math.min(60, Math.round(th)) },
        };
      }
      if (form === 1) {
        let h, dz, fc, th, dt, g;
        do { h = r.pick([10, 15, 20]); dz = r.pick([0, 0, 1, 2, -1]); fc = r.pick([1500, 2000, 2500, 3000]); th = r.pick([-30, -20, -15, -10, 10, 15, 20, 30]); dt = (dz * Math.cos(rad(th)) - h * Math.sin(rad(th))) / 100 / C; g = H4(fc, dt); } while (g < 0.08);
        return {
          q: [`Tweeter $${h}$ cm above the woofer${dz ? `, $${n(Math.abs(dz))}$ cm ${dz > 0 ? 'behind' : 'in front'}` : ''}, LR4 at $${hzT(fc)}$. What level does a listener at $${th}^\\circ$ hear at the crossover frequency, relative to the on-axis sum of two coincident drivers? Give one decimal in dB.`, `ツイーターはウーファーの $${h}$ cm 上${dz ? `、$${n(Math.abs(dz))}$ cm ${dz > 0 ? '奥' : '手前'}` : ''}にあり、LR4 は $${hzT(fc)}$ です。$${th}^\\circ$ の聴き手はクロスオーバー周波数でどのレベルを聞きますか。一致した二つのドライバーの軸上の和を基準に、dB で小数第1位まで答えてください。`],
          a: { type: 'num', v: db(g), tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['At $f_c$ each LR4 half is $-\\tfrac12$, so the sum is $-\\tfrac12(1 + e^{-j2\\pi f_c\\Delta t})$, of magnitude $|\\cos(\\pi f_c\\Delta t)|$.', '$f_c$ では LR4 の各半分は $-\\tfrac12$ なので、和は $-\\tfrac12(1 + e^{-j2\\pi f_c\\Delta t})$ で、大きさは $|\\cos(\\pi f_c\\Delta t)|$ です。'],
          sol: [[`$\\Delta t = (${n(dz)}\\cos ${th}^\\circ - ${h}\\sin ${th}^\\circ)/(100\\times343) = ${s3(dt * 1e6)}\\ \\mu\\mathrm{s}$.`, `$\\Delta t = (${n(dz)}\\cos ${th}^\\circ - ${h}\\sin ${th}^\\circ)/(100\\times343) = ${s3(dt * 1e6)}\\ \\mu\\mathrm{s}$ です。`], [`$|\\cos(\\pi\\times${fc}\\times${sig(dt, 3)})| = ${n(g, 4)}$, that is $${n(db(g), 3)}$ dB.`, `$|\\cos(\\pi\\times${fc}\\times${sig(dt, 3)})| = ${n(g, 4)}$、すなわち $${n(db(g), 3)}$ dB です。`], ['This is the level-at-the-seat readout; it is also the radius of the $f_c$ pattern in that direction.', 'これは読み取り欄の「席での f_c のレベル」で、その方向での $f_c$ のパターンの半径でもあります。']],
          set: { h, dz, fc, ang: th },
        };
      }
      const h = r.pick([10, 12, 15, 20, 25]), dz = r.pick([1, 2, 3, 4, 5, -1, -2]), tilt = deg(Math.atan2(dz, h));
      return {
        q: [`The tweeter is $${h}$ cm above the woofer and its acoustic centre is $${n(Math.abs(dz))}$ cm ${dz > 0 ? 'behind' : 'in front of'} it. In which direction does the main lobe point at the crossover frequency? Give degrees above the axis (negative if below), one decimal.`, `ツイーターはウーファーの $${h}$ cm 上にあり、その音響中心は $${n(Math.abs(dz))}$ cm ${dz > 0 ? '奥' : '手前'}にあります。クロスオーバー周波数で主ローブはどの方向を向きますか。軸から上への角度（下なら負）を度で小数第1位まで答えてください。`],
        a: { type: 'num', v: tilt, tol: 0.06, unit: ['°', '°'] },
        hint: ['The main lobe is where the two paths are equal: $\\Delta = 0$.', '主ローブは二つの経路が等しい方向、$\\Delta = 0$ にあります。'],
        sol: [[`$d_z\\cos\\theta = h\\sin\\theta$ gives $\\tan\\theta = d_z/h = ${n(dz)}/${h}$.`, `$d_z\\cos\\theta = h\\sin\\theta$ より $\\tan\\theta = d_z/h = ${n(dz)}/${h}$ です。`], [`$\\theta = ${n(tilt, 2)}^\\circ$: the lobe tilts ${dz > 0 ? 'up, towards the recessed tweeter, where its shorter path makes up for the recess' : 'down, away from the tweeter, which now sits ahead'}, perpendicular to the line joining the two acoustic centres.`, `$\\theta = ${n(tilt, 2)}^\\circ$ です。ローブは${dz > 0 ? '奥まったツイーターの側、すなわち上に傾きます。そちらではツイーターまでの経路が短く、奥まった分を取り戻すからです' : '前に出たツイーターから離れる側、すなわち下に傾きます'}。向きは二つの音響中心を結ぶ線に垂直です。`]],
        set: { h, dz, ang: Math.round(tilt) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let fc, th, h;
        do { fc = r.pick([1500, 2000, 2500, 3000, 3500, 4000]); th = r.pick([20, 30, 40, 45]); h = C / (2 * fc * Math.sin(rad(th))) * 100; } while (h > 30);
        return {
          q: [`With an LR4 crossover at $${hzT(fc)}$, how far apart (vertically, in cm) can the drivers be if the first null at the crossover frequency must lie at least $${th}^\\circ$ off axis?`, `$${hzT(fc)}$ の LR4 クロスオーバーで、クロスオーバー周波数での最初の零点を軸から $${th}^\\circ$ 以上離したいとき、ドライバーの縦の間隔は最大何 cm にできますか。`],
          a: { type: 'num', v: h, rel: 0.01, unit: ['cm', 'cm'] },
          hint: ['Turn the null condition $h\\sin\\theta = \\lambda/2$ round, for $h$.', '零点の条件 $h\\sin\\theta = \\lambda/2$ を $h$ について解きます。'],
          sol: [[`$\\lambda/2 = 343/(2\\times${fc}) = ${n(C / (2 * fc) * 100, 3)}$ cm.`, `$\\lambda/2 = 343/(2\\times${fc}) = ${n(C / (2 * fc) * 100, 3)}$ cm です。`], [`$h = (\\lambda/2)/\\sin ${th}^\\circ = ${n(h, 3)}$ cm. Any closer and the null moves further out.`, `$h = (\\lambda/2)/\\sin ${th}^\\circ = ${n(h, 3)}$ cm です。これより近づけると零点はさらに外へ移ります。`], ['Halving the crossover frequency doubles the allowed spacing: that is why crossovers sit as low as the tweeter can bear.', 'クロスオーバー周波数を半分にすると許される間隔は 2 倍になります。クロスオーバーをツイーターが耐えられる限り低く置くのはこのためです。']],
          set: { h: snap(h, 0.5, 0, 30), dz: 0, fc, ang: th },
        };
      }
      if (form === 1) {
        const h = r.pick([10, 15, 20, 25]), fc = r.pick([1500, 2000, 2500, 3000]), K = PI * fc * h / 100 / C, tmax = Math.asin(Math.min(1, 0.5 / (fc * h / 100 / C)));
        return {
          q: [`Drivers $${h}$ cm apart, in one plane, LR4 at $${hzT(fc)}$. Write the magnitude of the summed response at the crossover frequency as a function of the angle $\\theta$ (radians) above the axis, between the first nulls.`, `同じ面で $${h}$ cm 離れたドライバーを $${hzT(fc)}$ の LR4 でつなぎます。クロスオーバー周波数での和の応答の大きさを、軸から上への角度 $\\theta$（ラジアン）の関数として、最初の零点の間の範囲で書いてください。`],
          a: { type: 'expr', v: `cos(${K}*sin(t))`, vars: ['t'], dom: { t: [-tmax * 0.9, tmax * 0.9] }, lhs: ['$|H(\\theta)| =$', '$|H(\\theta)| =$'] },
          hint: ['$|H| = |\\cos(\\pi f_c\\Delta t)|$ with $\\Delta t = -h\\sin\\theta/c$; inside the first nulls the cosine is positive.', '$\\Delta t = -h\\sin\\theta/c$ として $|H| = |\\cos(\\pi f_c\\Delta t)|$ です。最初の零点の内側では余弦は正です。'],
          sol: [[`$\\pi f_c h/c = \\pi\\times${fc}\\times${n(h / 100)}/343 = ${n(K, 4)}$.`, `$\\pi f_c h/c = \\pi\\times${fc}\\times${n(h / 100)}/343 = ${n(K, 4)}$ です。`], [`$|H(\\theta)| = \\cos(${n(K, 4)}\\sin\\theta)$.`, `$|H(\\theta)| = \\cos(${n(K, 4)}\\sin\\theta)$ です。`], ['It is an array factor: the same law as two slits in optics, here set by the driver spacing in half-wavelengths.', 'これはアレイ係数で、光学の二重スリットと同じ法則です。ここではドライバー間隔が半波長の何倍かで決まります。']],
          set: { h, dz: 0, fc },
        };
      }
      const dz = r.pick([1, 2, 3, 4, 5]), us = dz / 100 / C * 1e6;
      const opts = [[`delay the woofer by $${s3(us)}\\ \\mu\\mathrm{s}$: the depth offset is corrected for every listener near the axis`, `ウーファーを $${s3(us)}\\ \\mu\\mathrm{s}$ 遅らせる。軸の近くのすべての聴き手で奥行きのずれが補正される`], [`delay the tweeter by $${s3(us)}\\ \\mu\\mathrm{s}$: it is the one that arrives late`, `ツイーターを $${s3(us)}\\ \\mu\\mathrm{s}$ 遅らせる。遅れて届くのはツイーターだから`], ['no fixed delay helps, because the delay changes sign above and below the axis', '上下で遅延の符号が変わるので、固定した遅延は役に立たない'], ['invert the tweeter: polarity and delay are the same thing', 'ツイーターを反転する。極性と遅延は同じものだから']];
      return {
        q: [`The drivers are on one vertical line ($h = 0$) but the tweeter sits $${dz}$ cm behind the woofer. What fixes the sum?`, `ドライバーは同じ縦線上（$h = 0$）にありますが、ツイーターはウーファーより $${dz}$ cm 奥にあります。和を直すにはどうしますか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['With $h = 0$ the extra path is $d_z\\cos\\theta$: does it change much near the axis?', '$h = 0$ では余分な経路は $d_z\\cos\\theta$ です。軸の近くで大きく変わりますか。'],
        sol: [[`The tweeter's sound arrives $${dz}/343$ m/s $= ${s3(us)}\\ \\mu\\mathrm{s}$ late, and $\\cos\\theta$ stays near 1 for every listener in front.`, `ツイーターの音は $${dz}$ cm $/\\,343$ m/s $= ${s3(us)}\\ \\mu\\mathrm{s}$ 遅れて届き、前方のどの聴き手でも $\\cos\\theta$ は 1 に近いままです。`], ['So the earlier driver, the woofer, is delayed by the same amount; the vertical spacing, whose delay $-h\\sin\\theta/c$ flips sign across the axis, is the one no delay can fix.', 'そこで先に届くウーファーを同じだけ遅らせます。遅延 $-h\\sin\\theta/c$ が軸の上下で符号を変える縦の間隔こそ、どの遅延でも直せないものです。']],
        set: { h: 0, dz, ang: 0 },
      };
    },
  ];
})();
