'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const DB = ['dB', 'dB（デシベル）'], HZ = ['Hz', 'Hz（ヘルツ）'], DEG = ['°', '度'], MMU = ['mm', 'mm（ミリメートル）'];
  const f180 = (tau, f1 = 100) => { let a = 1, b = 1 / (2 * tau); for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.atan(m / f1) + 2 * Math.PI * m * tau < Math.PI) a = m; else b = m; } return (a + b) / 2; };

  Q['anti-noise'] = [
    (r) => {
      const form = r.int(0, 1), f = r.pick([50, 100, 200, 250, 400, 500, 800, 1000, 2000]), tau = r.pick([20, 25, 40, 50, 80, 100]);
      if (form === 0) return {
        q: [`Anti-noise arrives $${tau}$ µs late. What phase error, in degrees, is that for a $${f}$ Hz tone?`, `逆位相の音が $${tau}$ µs 遅れて届きます。$${f}$ Hz の音では、位相の誤差は何度ですか。`],
        a: { type: 'num', v: 360 * f * tau * 1e-6, rel: 0.01, unit: DEG }, hint: ['One period is $1/f$; the delay is that fraction of $360^\\circ$.', '1 周期は $1/f$ です。遅れがその何割かを求め、$360^\\circ$ を掛けます。'],
        sol: [[`The period is $1/${f}$ s $= ${n(1e6 / f, 0)}$ µs.`, `周期は $1/${f}$ s $= ${n(1e6 / f, 0)}$ µs です。`], [`$\\varphi = 360^\\circ\\times${tau}/${n(1e6 / f, 0)} = ${n(360 * f * tau * 1e-6, 2)}^\\circ$.`, `$\\varphi = 360^\\circ\\times${tau}/${n(1e6 / f, 0)} = ${n(360 * f * tau * 1e-6, 2)}^\\circ$ です。`]], set: { tau, lf: Math.log10(f) },
      };
      return {
        q: [`How far does sound travel in air ($343$ m/s) in $${tau}$ µs, in millimetres?`, `空気中の音（$343$ m/s）は、$${tau}$ µs の間に何ミリメートル進みますか。`],
        a: { type: 'num', v: 0.343 * tau, rel: 0.01, unit: MMU }, hint: ['Distance is speed times time.', '距離は速さ掛ける時間です。'],
        sol: [[`$343\\ \\mathrm{m/s}\\times${tau}\\times10^{-6}$ s.`, `$343\\ \\mathrm{m/s}\\times${tau}\\times10^{-6}$ s を計算します。`], [`$${n(0.343 * tau, 2)}$ mm: an earbud's electronics have about this long to react.`, `$${n(0.343 * tau, 2)}$ mm です。イヤホンの電子回路が反応に使える時間は、この程度しかありません。`]], set: { tau },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) { const e = r.step(0.2, 3, 0.1) * r.pick([-1, 1]), g = 10 ** (e / 20), A = -20 * Math.log10(Math.abs(1 - g)); return {
        q: [`The anti-noise is perfectly timed but $${n(Math.abs(e), 1)}$ dB too ${e > 0 ? 'strong' : 'weak'}. How many decibels of noise are removed?`, `逆位相の音は、時間は完全に合っていますが、$${n(Math.abs(e), 1)}$ dB ${e > 0 ? '強すぎ' : '弱すぎ'}ます。騒音は何デシベル消えますか。`],
        a: { type: 'num', v: A, abs: 0.3, unit: DB }, hint: ['Convert the error to a ratio $g = 10^{e/20}$; what is left is $|1-g|$.', '誤差を比 $g = 10^{e/20}$ に直します。残るのは $|1-g|$ です。'],
        sol: [[`$g = 10^{${n(e, 1)}/20} = ${n(g, 4)}$, so $|1-g| = ${n(Math.abs(1 - g), 4)}$ of the noise is left.`, `$g = 10^{${n(e, 1)}/20} = ${n(g, 4)}$ なので、騒音の $|1-g| = ${n(Math.abs(1 - g), 4)}$ が残ります。`], [`$-20\\log_{10}${n(Math.abs(1 - g), 4)} = ${n(A, 1)}$ dB.`, `$-20\\log_{10}${n(Math.abs(1 - g), 4)} = ${n(A, 1)}$ dB です。`]], set: { gdb: e, tau: 0 },
      }; }
      const f = r.pick([100, 200, 300, 500, 800, 1000, 1500, 2000]), tau = r.pick([20, 30, 40, 50, 60, 80, 100]), phi = 2 * Math.PI * f * tau * 1e-6, res = 2 * Math.sin(phi / 2), A = -20 * Math.log10(res);
      return {
        q: [`The anti-noise has exactly the right size but is $${tau}$ µs late. How many decibels of a $${f}$ Hz tone are removed?`, `逆位相の音は、大きさは正確ですが $${tau}$ µs 遅れています。$${f}$ Hz の音は何デシベル消えますか。`],
        a: { type: 'num', v: A, abs: 0.3, unit: DB }, hint: ['With $g=1$ the remainder is $\\sqrt{2-2\\cos\\varphi} = 2\\sin(\\varphi/2)$.', '$g=1$ のとき、残りは $\\sqrt{2-2\\cos\\varphi} = 2\\sin(\\varphi/2)$ です。'],
        sol: [[`$\\varphi = 2\\pi\\times${f}\\times${tau}\\times10^{-6} = ${n(phi, 4)}$ rad $= ${n((phi * 180) / Math.PI, 1)}^\\circ$.`, `$\\varphi = 2\\pi\\times${f}\\times${tau}\\times10^{-6} = ${n(phi, 4)}$ rad $= ${n((phi * 180) / Math.PI, 1)}^\\circ$ です。`], [`Left: $2\\sin(\\varphi/2) = ${n(res, 4)}$, so $${n(A, 1)}$ dB is removed.`, `残りは $2\\sin(\\varphi/2) = ${n(res, 4)}$ なので、$${n(A, 1)}$ dB 消えます。`]], set: { gdb: 0, tau, lf: Math.log10(f) },
      };
    },
    (r) => {
      const A = r.pick([10, 15, 20, 25, 30]), tau = r.pick([10, 20, 30, 40, 50, 60, 80, 100, 150]), f = Math.asin(10 ** (-A / 20) / 2) / (Math.PI * tau * 1e-6);
      return {
        q: [`An earbud's anti-noise has the right size but arrives $${tau}$ µs late. Up to what frequency can it remove at least $${A}$ dB?`, `あるイヤホンの逆位相の音は、大きさは正確ですが $${tau}$ µs 遅れて届きます。$${A}$ dB 以上消せるのは、どの周波数までですか。`],
        a: { type: 'num', v: f, rel: 0.02, unit: HZ }, hint: ['Solve $2\\sin(\\pi f\\tau) = 10^{-A/20}$ for $f$.', '$2\\sin(\\pi f\\tau) = 10^{-A/20}$ を $f$ について解きます。'],
        sol: [[`$10^{-${A}/20} = ${n(10 ** (-A / 20), 4)}$, so $\\sin(\\pi f\\tau) = ${n(10 ** (-A / 20) / 2, 4)}$ and $\\pi f\\tau = ${n(Math.asin(10 ** (-A / 20) / 2), 4)}$.`, `$10^{-${A}/20} = ${n(10 ** (-A / 20), 4)}$ なので、$\\sin(\\pi f\\tau) = ${n(10 ** (-A / 20) / 2, 4)}$、$\\pi f\\tau = ${n(Math.asin(10 ** (-A / 20) / 2), 4)}$ です。`], [`$f = ${n(Math.asin(10 ** (-A / 20) / 2), 4)}/(\\pi\\times${tau}\\times10^{-6}) = ${n(f, 0)}$ Hz. Halving the delay doubles it.`, `$f = ${n(Math.asin(10 ** (-A / 20) / 2), 4)}/(\\pi\\times${tau}\\times10^{-6}) = ${n(f, 0)}$ Hz です。遅れを半分にすると、この値は 2 倍になります。`]], set: { gdb: 0, tau: Math.min(300, tau), lf: Math.max(1.5, Math.min(4, Math.log10(f))) },
      };
    },
  ];

  Q['anc-feedback'] = [
    (r) => {
      const kdb = r.step(6, 36, 1), K = 10 ** (kdb / 20), A = 20 * Math.log10(1 + K);
      return {
        q: [`A feedback loop has a gain of $${kdb}$ dB at low frequency. By how many decibels does it reduce low-frequency noise at the ear?`, `あるフィードバックのループの低い周波数での利得は $${kdb}$ dB です。耳での低い周波数の騒音は何デシベル下がりますか。`],
        a: { type: 'num', v: A, abs: 0.2, unit: DB }, hint: ['The noise is divided by $1+K$, with $K = 10^{\\text{dB}/20}$.', '騒音は $1+K$ で割られます。$K = 10^{\\text{dB}/20}$ です。'],
        sol: [[`$K = 10^{${kdb}/20} = ${n(K, 2)}$.`, `$K = 10^{${kdb}/20} = ${n(K, 2)}$ です。`], [`$20\\log_{10}(1+${n(K, 2)}) = ${n(A, 1)}$ dB, a little more than the gain itself.`, `$20\\log_{10}(1+${n(K, 2)}) = ${n(A, 1)}$ dB で、利得そのものより少し大きい値です。`]], set: { kdb },
      };
    },
    (r) => {
      const tau = r.pick([20, 30, 40, 50, 60, 80, 100, 150, 200]), f = 1 / (4 * tau * 1e-6);
      return {
        q: [`Well above $f_1$ the speaker and ear contribute a phase lag of about $90^\\circ$. If the loop also has a pure delay of $${tau}$ µs, at about what frequency does the total lag reach $180^\\circ$?`, `$f_1$ より十分高い周波数では、スピーカーと耳による位相の遅れは約 $90^\\circ$ です。ループにさらに $${tau}$ µs の純粋な遅れがあるとき、遅れの合計が $180^\\circ$ に達するのはおよそどの周波数ですか。`],
        a: { type: 'num', v: f, rel: 0.03, unit: HZ }, hint: ['The delay must supply the other $90^\\circ$: a quarter of a period.', '遅れが残りの $90^\\circ$、つまり 4 分の 1 周期を受け持ちます。'],
        sol: [[`$2\\pi f\\tau = \\pi/2$ gives $f = 1/(4\\tau)$.`, `$2\\pi f\\tau = \\pi/2$ から $f = 1/(4\\tau)$ です。`], [`$f = 1/(4\\times${tau}\\times10^{-6}) = ${n(f, 0)}$ Hz (the exact value for $f_1 = 100$ Hz is $${n(f180(tau * 1e-6), 0)}$ Hz).`, `$f = 1/(4\\times${tau}\\times10^{-6}) = ${n(f, 0)}$ Hz です（$f_1 = 100$ Hz での正確な値は $${n(f180(tau * 1e-6), 0)}$ Hz）。`]], set: { tau },
      };
    },
    (r) => {
      const tau = r.pick([30, 40, 50, 60, 80, 100, 150, 200]), fx = f180(tau * 1e-6), km = Math.hypot(1, fx / 100), form = r.int(0, 1);
      if (form === 0) return {
        q: [`A loop $L = K e^{-i2\\pi f\\tau}/(1+if/f_1)$ has $f_1 = 100$ Hz and $\\tau = ${tau}$ µs; its phase reaches $-180^\\circ$ at $${n(fx, 0)}$ Hz. What is the largest gain $K$, in decibels, for which it is stable?`, `ループ $L = K e^{-i2\\pi f\\tau}/(1+if/f_1)$ で、$f_1 = 100$ Hz、$\\tau = ${tau}$ µs です。位相は $${n(fx, 0)}$ Hz で $-180^\\circ$ に達します。安定でいられる最大の利得 $K$ は何デシベルですか。`],
        a: { type: 'num', v: 20 * Math.log10(km), abs: 0.2, unit: DB }, hint: ['Stability needs $|L| < 1$ at that frequency.', 'その周波数で $|L| < 1$ であることが安定の条件です。'],
        sol: [[`$|L| = K/\\sqrt{1+(${n(fx, 0)}/100)^2} = K/${n(km, 2)}$.`, `$|L| = K/\\sqrt{1+(${n(fx, 0)}/100)^2} = K/${n(km, 2)}$ です。`], [`So $K < ${n(km, 2)}$, which is $${n(20 * Math.log10(km), 1)}$ dB.`, `したがって $K < ${n(km, 2)}$ で、これは $${n(20 * Math.log10(km), 1)}$ dB です。`]], set: { tau, kdb: Math.min(40, Math.round(40 * Math.log10(km)) / 2) },
      };
      const kdb = r.step(10, 24, 1), gm = 20 * Math.log10(km) - kdb;
      return {
        q: [`With $f_1 = 100$ Hz and $\\tau = ${tau}$ µs the loop's phase reaches $-180^\\circ$ at $${n(fx, 0)}$ Hz. The low-frequency gain is set to $${kdb}$ dB. What is the gain margin, in decibels?`, `$f_1 = 100$ Hz、$\\tau = ${tau}$ µs のとき、ループの位相は $${n(fx, 0)}$ Hz で $-180^\\circ$ に達します。低い周波数での利得を $${kdb}$ dB に設定します。ゲイン余裕は何デシベルですか。`],
        a: { type: 'num', v: gm, abs: 0.2, unit: DB }, hint: ['Find the gain of the roll-off at that frequency in decibels and compare.', 'その周波数での減衰を dB で求めて比べます。'],
        sol: [[`The roll-off there is $20\\log_{10}\\sqrt{1+(${n(fx, 0)}/100)^2} = ${n(20 * Math.log10(km), 1)}$ dB.`, `そこでの減衰は $20\\log_{10}\\sqrt{1+(${n(fx, 0)}/100)^2} = ${n(20 * Math.log10(km), 1)}$ dB です。`], [`Loop gain at that frequency: $${kdb} - ${n(20 * Math.log10(km), 1)} = ${n(-gm, 1)}$ dB, so the margin is $${n(gm, 1)}$ dB${gm < 0 ? ': the loop is unstable' : ''}.`, `その周波数でのループ利得は $${kdb} - ${n(20 * Math.log10(km), 1)} = ${n(-gm, 1)}$ dB なので、余裕は $${n(gm, 1)}$ dB です${gm < 0 ? '。ループは不安定です' : ''}。`]], set: { tau, kdb },
      };
    },
  ];

  Q['earbud-attenuation'] = [
    (r) => {
      const a = r.int(4, 14), b = r.int(8, 30), c = r.int(0, 10);
      return {
        q: [`At one frequency the ear tip removes $${a}$ dB, feed-forward cancelling $${b}$ dB and feedback cancelling $${c}$ dB. What fraction of the sound pressure reaches the eardrum, as a percentage?`, `ある周波数で、イヤーピースが $${a}$ dB、フィードフォワードが $${b}$ dB、フィードバックが $${c}$ dB の騒音を消します。鼓膜に届く音圧は、もとの何パーセントですか。`],
        a: { type: 'num', v: 100 * 10 ** (-(a + b + c) / 20), rel: 0.03, unit: ['%', '%（パーセント）'] }, hint: ['Decibels add; then pressure ratio is $10^{-A/20}$.', 'デシベルは足し算できます。音圧の比は $10^{-A/20}$ です。'],
        sol: [[`Total: $${a}+${b}+${c} = ${a + b + c}$ dB.`, `合計は $${a}+${b}+${c} = ${a + b + c}$ dB です。`], [`$10^{-${a + b + c}/20} = ${n(10 ** (-(a + b + c) / 20), 4)}$, that is $${n(100 * 10 ** (-(a + b + c) / 20), 2)}$ %.`, `$10^{-${a + b + c}/20} = ${n(10 ** (-(a + b + c) / 20), 4)}$ で、$${n(100 * 10 ** (-(a + b + c) / 20), 2)}$ % です。`]],
      };
    },
    (r) => {
      const L1 = r.int(60, 85), d = r.int(3, 20), L2 = L1 - d, tot = 10 * Math.log10(10 ** (L1 / 10) + 10 ** (L2 / 10));
      return {
        q: [`Inside the ear, low-frequency noise is at $${L1}$ dBA and the rest of the noise at $${L2}$ dBA. What is the total level?`, `耳の中で、低い周波数の騒音が $${L1}$ dBA、それ以外の騒音が $${L2}$ dBA です。合計のレベルは何 dBA ですか。`],
        a: { type: 'num', v: tot, abs: 0.15, unit: ['dBA', 'dBA（A 特性デシベル）'] }, hint: ['Add powers, not decibels: $10\\log_{10}(10^{L_1/10}+10^{L_2/10})$.', 'デシベルではなくパワーを足します。$10\\log_{10}(10^{L_1/10}+10^{L_2/10})$ です。'],
        sol: [[`$10^{${n(L1 / 10, 1)}} + 10^{${n(L2 / 10, 1)}} = 10^{${n(L1 / 10, 1)}}(1 + 10^{-${n(d / 10, 1)}})$.`, `$10^{${n(L1 / 10, 1)}} + 10^{${n(L2 / 10, 1)}} = 10^{${n(L1 / 10, 1)}}(1 + 10^{-${n(d / 10, 1)}})$ です。`], [`Total $= ${L1} + ${n(tot - L1, 2)} = ${n(tot, 1)}$ dBA: the louder part dominates, which is why removing only the low frequencies still helps so much.`, `合計は $${L1} + ${n(tot - L1, 2)} = ${n(tot, 1)}$ dBA です。大きいほうが支配的なので、低い周波数を消すだけでも大きな効果があります。`]],
      };
    },
    (r) => {
      const lo = r.int(72, 86), mid = lo - r.int(6, 14), aLo = r.int(22, 36), aMid = r.int(8, 16);
      const before = 10 * Math.log10(10 ** (lo / 10) + 10 ** (mid / 10)), after = 10 * Math.log10(10 ** ((lo - aLo) / 10) + 10 ** ((mid - aMid) / 10));
      return {
        q: [`Cabin noise has two parts: a low band at $${lo}$ dBA and a mid band at $${mid}$ dBA. An earbud removes $${aLo}$ dB of the low band and $${aMid}$ dB of the mid band. By how many decibels does the total level fall?`, `客室の騒音は二つの部分からなります。低い帯域が $${lo}$ dBA、中間の帯域が $${mid}$ dBA です。イヤホンは低い帯域を $${aLo}$ dB、中間の帯域を $${aMid}$ dB 消します。合計のレベルは何デシベル下がりますか。`],
        a: { type: 'num', v: before - after, abs: 0.2, unit: DB }, hint: ['Find the total before and after by adding powers.', 'パワーを足して、前後それぞれの合計を求めます。'],
        sol: [[`Before: $10\\log_{10}(10^{${n(lo / 10, 1)}}+10^{${n(mid / 10, 1)}}) = ${n(before, 1)}$ dBA.`, `前：$10\\log_{10}(10^{${n(lo / 10, 1)}}+10^{${n(mid / 10, 1)}}) = ${n(before, 1)}$ dBA です。`], [`After: bands at $${lo - aLo}$ and $${mid - aMid}$ dBA give $${n(after, 1)}$ dBA, a fall of $${n(before - after, 1)}$ dB. ${mid - aMid > lo - aLo ? 'The mid band now dominates: more low-frequency cancelling would hardly help.' : 'The low band still dominates.'}`, `後：帯域が $${lo - aLo}$ dBA と $${mid - aMid}$ dBA になり、合計は $${n(after, 1)}$ dBA で、$${n(before - after, 1)}$ dB 下がります。${mid - aMid > lo - aLo ? '今度は中間の帯域が支配的です。低い周波数をさらに消しても、ほとんど変わりません。' : 'まだ低い帯域が支配的です。'}`]],
      };
    },
  ];
})();
