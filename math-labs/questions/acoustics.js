'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, deg = (x) => x * 180 / PI, rad = (d) => d * PI / 180;
  const s3 = (x) => sig(x, 3);
  const onStep = (x, step, lo, hi) => x >= lo - 1e-9 && x <= hi + 1e-9 && Math.abs(x / step - Math.round(x / step)) < 1e-6;
  const fixed = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

  /* ---------------- 1. string harmonics ---------------- */
  Q['string-harmonics'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.pick([0.65, 0.648, 0.328, 0.5, 1]), T = r.pick([50, 60, 70, 80, 100]), mu = r.pick([0.4, 0.6, 1.2, 2.5, 5]);
        const f1 = Math.sqrt(T / (mu * 1e-3)) / (2 * L);
        return {
          q: [`A string of vibrating length $${n(L)}$ m, tension $${T}$ N and mass $${n(mu)}$ g per metre. What is its fundamental frequency?`, `振動する長さ $${n(L)}$ m、張力 $${T}$ N、1メートルあたりの質量 $${n(mu)}$ g の弦があります。基本周波数はいくらですか。`],
          a: { type: 'num', v: f1, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Waves travel at $c = \\sqrt{T/\\mu}$, and the fundamental fits half a wavelength in $L$.', '波の速さは $c = \\sqrt{T/\\mu}$ で、基本振動では $L$ に半波長が入ります。'],
          sol: [[`$c = \\sqrt{${T}/${n(mu * 1e-3)}} = ${s3(Math.sqrt(T / (mu * 1e-3)))}$ m/s.`, `$c = \\sqrt{${T}/${n(mu * 1e-3)}} = ${s3(Math.sqrt(T / (mu * 1e-3)))}$ m/s です。`], [`$f_1 = c/2L = ${s3(f1)}$ Hz; the overtones are exactly $2f_1, 3f_1, \\dots$, which is why a string sounds a clear pitch.`, `$f_1 = c/2L = ${s3(f1)}$ Hz です。倍音はちょうど $2f_1, 3f_1, \\dots$ なので、弦ははっきりした音高を鳴らします。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([2, 4, 5, 10, 20, 25]), b = 1 / k;
        return {
          q: [`A string is plucked at $\\beta = ${n(b)}$ of its length. Which is the lowest harmonic that is completely missing?`, `弦を長さの $\\beta = ${n(b)}$ の位置で弾きます。完全に欠ける最も低い倍音は何番目ですか。`],
          a: { type: 'int', v: k },
          hint: ['Mode $n$ has nodes at $x/L = j/n$. It cannot be excited if it has a node where you pluck.', 'モード $n$ の節は $x/L = j/n$ にあります。弾いた点に節があるモードは励起されません。'],
          sol: [[`The amplitude of harmonic $n$ is proportional to $\\sin(n\\pi\\beta)/n^2$, which vanishes when $n\\beta$ is an integer.`, `倍音 $n$ の振幅は $\\sin(n\\pi\\beta)/n^2$ に比例し、$n\\beta$ が整数のとき 0 になります。`], [`With $\\beta = 1/${k}$ the first such $n$ is $${k}$, and every multiple of ${k} is missing too, as the crosses in the spectrum show.`, `$\\beta = 1/${k}$ ではそのような最初の $n$ は $${k}$ で、${k} の倍数もすべて欠けます。スペクトルの×印がそれです。`]],
          set: { mode: 0, beta: b },
        };
      }
      const L = r.pick([0.65, 1, 0.5, 2]), nn = r.int(1, 8);
      return {
        q: [`A string is $${n(L)}$ m long, fixed at both ends. What is the wavelength of its harmonic $n = ${nn}$ on the string?`, `両端を固定した長さ $${n(L)}$ m の弦があります。弦の上での第 $n = ${nn}$ 倍音の波長はいくらですか。`],
        a: { type: 'num', v: 2 * L / nn, unit: ['m', 'm'] },
        hint: ['Mode $n$ fits $n$ half-wavelengths between the ends.', 'モード $n$ では両端の間に半波長が $n$ 個入ります。'],
        sol: [[`$n\\lambda_n/2 = L$, so $\\lambda_n = 2L/n = 2\\times${n(L)}/${nn} = ${n(2 * L / nn, 4)}$ m.`, `$n\\lambda_n/2 = L$ より $\\lambda_n = 2L/n = 2\\times${n(L)}/${nn} = ${n(2 * L / nn, 4)}$ m です。`], [`It has ${nn - 1} node${nn - 1 === 1 ? '' : 's'} between the ends. Its frequency is $${nn}$ times the fundamental because the wave speed is the same for every mode.`, `両端の間に節が ${nn - 1} 個あります。波の速さはどのモードでも同じなので、周波数は基音の $${nn}$ 倍です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let b, nn, ratio; do { b = r.step(0.05, 0.5, 0.01); nn = r.int(2, 6); ratio = Math.abs(Math.sin(nn * PI * b)) / (nn * nn * Math.sin(PI * b)); } while (ratio < 1e-6);
        return {
          q: [`A string plucked at $\\beta = ${n(b)}$: what is the amplitude of harmonic ${nn} relative to the fundamental? Give three decimals.`, `$\\beta = ${n(b)}$ で弾いた弦で、第 ${nn} 倍音の振幅は基音の何倍ですか。小数第3位まで求めてください。`],
          a: { type: 'num', v: ratio, tol: 0.0006 },
          hint: ['Plucked amplitudes are proportional to $\\sin(n\\pi\\beta)/n^2$.', '弾いた弦の振幅は $\\sin(n\\pi\\beta)/n^2$ に比例します。'],
          sol: [[`$\\dfrac{|b_${nn}|}{b_1} = \\dfrac{|\\sin(${nn}\\pi\\times${n(b)})|}{${nn * nn}\\sin(\\pi\\times${n(b)})} = \\dfrac{${n(Math.abs(Math.sin(nn * PI * b)), 4)}}{${nn * nn}\\times${n(Math.sin(PI * b), 4)}}$.`, `$\\dfrac{|b_${nn}|}{b_1} = \\dfrac{|\\sin(${nn}\\pi\\times${n(b)})|}{${nn * nn}\\sin(\\pi\\times${n(b)})} = \\dfrac{${n(Math.abs(Math.sin(nn * PI * b)), 4)}}{${nn * nn}\\times${n(Math.sin(PI * b), 4)}}$ です。`], [`$= ${n(ratio, 4)}$, or $${n(20 * Math.log10(ratio), 3)}$ dB, the height of bar ${nn} in the spectrum.`, `$= ${n(ratio, 4)}$ で、$${n(20 * Math.log10(ratio), 3)}$ dB です。スペクトルの ${nn} 番目の棒の高さです。`]],
          set: { mode: 0, beta: b },
        };
      }
      if (form === 1) {
        const [note, f, fj] = r.pick([['A2', 110, 'A2'], ['E2', 82.41, 'E2'], ['D3', 146.8, 'D3'], ['G3', 196, 'G3'], ['A4', 440, 'A4'], ['E5', 659.3, 'E5']]);
        const L = r.pick([0.65, 0.328, 0.5]), mu = r.pick([0.4, 0.8, 1.5, 3, 6]);
        const T = mu * 1e-3 * (2 * L * f) ** 2;
        return {
          q: [`What tension tunes a string of length $${n(L)}$ m and $${n(mu)}$ g/m to ${note} ($${n(f)}$ Hz)?`, `長さ $${n(L)}$ m、$${n(mu)}$ g/m の弦を ${fj}（$${n(f)}$ Hz）に合わせるには、張力をいくらにすればよいですか。`],
          a: { type: 'num', v: T, rel: 0.01, unit: ['N', 'N'] },
          hint: ['Invert $f = \\dfrac{1}{2L}\\sqrt{T/\\mu}$.', '$f = \\dfrac{1}{2L}\\sqrt{T/\\mu}$ を逆に解きます。'],
          sol: [[`$T = \\mu(2Lf)^2 = ${n(mu * 1e-3)}\\times(2\\times${n(L)}\\times${n(f)})^2$.`, `$T = \\mu(2Lf)^2 = ${n(mu * 1e-3)}\\times(2\\times${n(L)}\\times${n(f)})^2$ です。`], [`$T = ${s3(T)}$ N. Tension goes as the square of the pitch, so raising a note by an octave takes four times the tension; heavier strings let low notes keep a playable tension.`, `$T = ${s3(T)}$ N です。張力は音高の二乗に比例するので、1オクターブ上げるには4倍の張力が要ります。低音に重い弦を使うのは、張力を弾ける範囲に保つためです。`]],
        };
      }
      let b, nn, ratio; do { b = r.step(0.05, 0.5, 0.01); nn = r.int(2, 6); ratio = Math.abs(Math.sin(nn * PI * b)) / (nn * Math.sin(PI * b)); } while (ratio < 1e-6);
      return {
        q: [`A narrow hammer strikes a string at $\\beta = ${n(b)}$. Relative to the fundamental, what is the displacement amplitude of harmonic ${nn}? Give three decimals.`, `細いハンマーが弦の $\\beta = ${n(b)}$ の位置を打ちます。第 ${nn} 倍音の変位の振幅は基音の何倍ですか。小数第3位まで求めてください。`],
        a: { type: 'num', v: ratio, tol: 0.0006 },
        hint: ['A narrow blow gives every mode velocity $\\propto \\sin(n\\pi\\beta)$; displacement is velocity divided by $\\omega_n \\propto n$.', '細い打撃はどのモードにも $\\sin(n\\pi\\beta)$ に比例する速度を与えます。変位は速度を $\\omega_n \\propto n$ で割ったものです。'],
        sol: [[`Amplitude $\\propto \\sin(n\\pi\\beta)/n$, so the ratio is $\\dfrac{|\\sin(${nn}\\pi\\times${n(b)})|}{${nn}\\sin(\\pi\\times${n(b)})}$.`, `振幅は $\\sin(n\\pi\\beta)/n$ に比例するので、比は $\\dfrac{|\\sin(${nn}\\pi\\times${n(b)})|}{${nn}\\sin(\\pi\\times${n(b)})}$ です。`], [`$= ${n(ratio, 4)}$, much more than a pluck gives (which falls as $1/n^2$): a hammer sounds brighter.`, `$= ${n(ratio, 4)}$ で、弾いた場合（$1/n^2$ で減る）よりずっと大きくなります。ハンマーの音が明るいのはこのためです。`]],
        set: { mode: 1, beta: b },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([0.5, 0.25, 0.2, 0.1, 0.33, 0.15, 0.4, 0.05]);
        const frac = 2 * Math.sin(PI * b) ** 2 / (PI * PI * b * (1 - b));
        return {
          q: [`A string is plucked at $\\beta = ${n(b)}$. What percentage of its vibrational energy is in the fundamental?`, `弦を $\\beta = ${n(b)}$ で弾きます。振動エネルギーの何パーセントが基音にありますか。`],
          a: { type: 'num', v: frac * 100, tol: 0.06, unit: ['%', '%'] },
          hint: ['Mode energy is proportional to $n^2b_n^2 \\propto \\sin^2(n\\pi\\beta)/n^2$, and $\\sum_n \\sin^2(n\\pi\\beta)/n^2 = \\tfrac{\\pi^2}2\\beta(1 - \\beta)$.', 'モードのエネルギーは $n^2b_n^2 \\propto \\sin^2(n\\pi\\beta)/n^2$ に比例し、$\\sum_n \\sin^2(n\\pi\\beta)/n^2 = \\tfrac{\\pi^2}2\\beta(1 - \\beta)$ です。'],
          sol: [['The fraction is $\\dfrac{\\sin^2\\pi\\beta}{\\tfrac{\\pi^2}2\\beta(1 - \\beta)} = \\dfrac{2\\sin^2\\pi\\beta}{\\pi^2\\beta(1 - \\beta)}$.', '割合は $\\dfrac{\\sin^2\\pi\\beta}{\\tfrac{\\pi^2}2\\beta(1 - \\beta)} = \\dfrac{2\\sin^2\\pi\\beta}{\\pi^2\\beta(1 - \\beta)}$ です。'], [`$= \\dfrac{2\\times${n(Math.sin(PI * b) ** 2, 4)}}{\\pi^2\\times${n(b * (1 - b), 4)}} = ${n(frac * 100, 3)}\\%$.`, `$= \\dfrac{2\\times${n(Math.sin(PI * b) ** 2, 4)}}{\\pi^2\\times${n(b * (1 - b), 4)}} = ${n(frac * 100, 3)}\\%$ です。`], [b === 0.5 ? 'Plucked in the middle, $8/\\pi^2 \\approx 81\\%$ is in the fundamental: the mellowest sound a string can make by plucking.' : 'The closer to the end you pluck, the less energy stays in the fundamental and the brighter the tone.', b === 0.5 ? '中央で弾くと $8/\\pi^2 \\approx 81\\%$ が基音にあります。弾いて出せる最も柔らかい音です。' : '端の近くで弾くほど基音に残るエネルギーは減り、音は明るくなります。']],
          set: { mode: 0, beta: b },
        };
      }
      if (form === 1) {
        const b = r.step(0.05, 0.5, 0.01);
        return {
          q: [`Ideal Helmholtz motion with the bow at $\\beta = ${n(b)}$: what fraction of each period does the string stick to the bow, and how many times faster than the bow does it slip back?`, `弓が $\\beta = ${n(b)}$ にある理想的なヘルムホルツ運動で、弦は各周期のどれだけの割合で弓に張り付き、滑り戻るときは弓の何倍の速さですか。`],
          a: { type: 'tuple', v: [1 - b, (1 - b) / b], labels: [['stick fraction', '張り付く割合'], ['slip speed / bow speed', '滑る速さ／弓の速さ']], rel: 0.005 },
          hint: ['The corner passes the bow twice per period; the string under the bow has no net motion over a period.', '角は一周期に二回弓を通過します。弓の下の弦は一周期で見ると正味では動きません。'],
          sol: [[`The corner travels from the bow to the bridge and back, a fraction $2\\beta L/2L = \\beta$ of the period: that is the slip. The rest, $1 - \\beta = ${n(1 - b)}$, is the stick.`, `角は弓から駒まで行って戻り、それは周期の $2\\beta L/2L = \\beta$ の割合で、これが滑りです。残りの $1 - \\beta = ${n(1 - b)}$ が張り付きです。`], [`No net motion: $v_{\\text{slip}}\\beta = v_{\\text{bow}}(1 - \\beta)$, so $v_{\\text{slip}}/v_{\\text{bow}} = (1 - \\beta)/\\beta = ${n((1 - b) / b, 4)}$.`, `正味で動かないので $v_{\\text{slip}}\\beta = v_{\\text{bow}}(1 - \\beta)$、よって $v_{\\text{slip}}/v_{\\text{bow}} = (1 - \\beta)/\\beta = ${n((1 - b) / b, 4)}$ です。`], ['Bowing nearer the bridge makes the slip shorter and faster, which takes more bow force to sustain.', '駒の近くで弾くほど滑りは短く速くなり、それを保つにはより大きな弓圧が要ります。']],
          set: { mode: 2, beta: b },
        };
      }
      const nn = r.pick([5, 7, 9, 11, 13]), near = r.pick([0.15, 0.3, 0.2, 0.4]);
      let best = 1, bd = 9; for (let k = 1; k < nn; k++) { const d = Math.abs(k / nn - near); if (k / nn <= 0.5 && d < bd) { bd = d; best = k; } }
      const b = best / nn;
      return {
        q: [`Where should a string be plucked, between the end and the middle and as close as possible to $\\beta = ${n(near)}$, so that harmonic ${nn} is silenced? Give $\\beta$ to three decimals.`, `第 ${nn} 倍音を消すには、端と中央の間で $\\beta = ${n(near)}$ にできるだけ近いどの位置で弾けばよいですか。$\\beta$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: b, tol: 0.0006 },
        hint: [`Harmonic ${nn} has nodes at $\\beta = k/${nn}$.`, `第 ${nn} 倍音の節は $\\beta = k/${nn}$ にあります。`],
        sol: [[`The candidates are $k/${nn}$ for $k = 1, 2, \\dots$ up to the middle.`, `候補は中央までの $k = 1, 2, \\dots$ に対する $k/${nn}$ です。`], [`The nearest to $${n(near)}$ is $${best}/${nn} = ${n(b, 4)}$.`, `$${n(near)}$ に最も近いのは $${best}/${nn} = ${n(b, 4)}$ です。`], [`Plucking there also silences harmonics $${2 * nn}, ${3 * nn}, \\dots$; piano makers place the hammer near such a point to weaken the dissonant 7th and 9th harmonics.`, `そこで弾くと第 $${2 * nn}, ${3 * nn}, \\dots$ 倍音も消えます。ピアノ製作者は、不協和な第7、第9倍音を弱めるためにハンマーをこうした点の近くに置きます。`]],
        set: { mode: 0, beta: fixed(b) },
      };
    },
  ];

  /* ---------------- 2. Chladni figures ---------------- */
  const modes = (lo, hi) => { const out = []; for (let m = 0; m <= 4; m++) for (let k = 0; k <= 4; k++) if (m + k > 0 && m + k >= lo && m * m + k * k <= hi) out.push([m, k]); return out; };
  Q.chladni = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [m, k] = r.pick(modes(1, 32));
        return {
          q: [`In the approximation $w \\approx \\cos m\\pi x\\cos n\\pi y \\pm \\cos n\\pi x\\cos m\\pi y$, how many times the frequency of mode $(1, 1)$ is the frequency of mode $(${m}, ${k})$?`, `近似 $w \\approx \\cos m\\pi x\\cos n\\pi y \\pm \\cos n\\pi x\\cos m\\pi y$ では、モード $(${m}, ${k})$ の周波数はモード $(1, 1)$ の何倍ですか。`],
          a: { type: 'num', v: (m * m + k * k) / 2 },
          hint: ['Bending waves have $\\omega \\propto k^2$, and here $k^2 = \\pi^2(m^2 + n^2)$.', '曲げ波では $\\omega \\propto k^2$ で、ここでは $k^2 = \\pi^2(m^2 + n^2)$ です。'],
          sol: [[`$f_{${m}${k}}/f_{11} = (${m}^2 + ${k}^2)/(1^2 + 1^2) = ${m * m + k * k}/2 = ${n((m * m + k * k) / 2)}$.`, `$f_{${m}${k}}/f_{11} = (${m}^2 + ${k}^2)/(1^2 + 1^2) = ${m * m + k * k}/2 = ${n((m * m + k * k) / 2)}$ です。`], ['Unlike a string, a plate\'s frequencies grow as the square of the mode numbers, so its overtones are not harmonic and it rings rather than sings.', '弦と違い、板の周波数はモード番号の二乗で増えるので倍音は整数倍にならず、板は歌うというより鳴り響きます。']],
          set: { m, n: k },
        };
      }
      if (form === 1) {
        const m = r.int(0, 5), k = r.int(m === 0 ? 1 : 0, 5);
        return {
          q: [`How many nodal lines does the single product $\\cos ${m}\\pi x\\cos ${k}\\pi y$ have on the unit square $0 \\le x, y \\le 1$?`, `単独の積 $\\cos ${m}\\pi x\\cos ${k}\\pi y$ は、単位正方形 $0 \\le x, y \\le 1$ の上に何本の節線をもちますか。`],
          a: { type: 'int', v: m + k },
          hint: [`$\\cos m\\pi x = 0$ at $x = \\tfrac{1}{2m}, \\tfrac{3}{2m}, \\dots$ inside $[0, 1]$.`, `$\\cos m\\pi x = 0$ となるのは $[0, 1]$ 内の $x = \\tfrac{1}{2m}, \\tfrac{3}{2m}, \\dots$ です。`],
          sol: [[`$\\cos ${m}\\pi x$ vanishes on ${m} vertical line${m === 1 ? '' : 's'} and $\\cos ${k}\\pi y$ on ${k} horizontal line${k === 1 ? '' : 's'}.`, `$\\cos ${m}\\pi x$ は ${m} 本の縦線上で、$\\cos ${k}\\pi y$ は ${k} 本の横線上で 0 になります。`], [`Total ${m + k}: a plain grid. Only the sum and difference of two such products bend the lines into the curves Chladni drew.`, `合計 ${m + k} 本で、単純な格子です。このような二つの積の和と差をとって初めて、クラドニが描いたような曲線になります。`]],
        };
      }
      const [m, k] = r.pick(modes(1, 32).filter(([a, b]) => a !== b));
      const opts = [[`$(${m}, ${k})$ with the other sign`, `$(${m}, ${k})$ の符号違い`], [`$(${m + 1}, ${k})$`, `$(${m + 1}, ${k})$`], [`$(${m + 1}, ${k + 1})$`, `$(${m + 1}, ${k + 1})$`], [`$(${m}, ${k + 1})$`, `$(${m}, ${k + 1})$`]];
      return {
        q: [`Which mode rings at the same frequency as $(${m}, ${k})$ with the $+$ sign, in this approximation?`, `この近似で、$+$ 符号の $(${m}, ${k})$ と同じ周波数で鳴るモードはどれですか。`],
        a: { type: 'choice', v: 0, opts },
        hint: ['The frequency depends only on $m^2 + n^2$.', '周波数は $m^2 + n^2$ だけで決まります。'],
        sol: [[`Both signs use the same two products, each with $k^2 = \\pi^2(${m * m + k * k})$, so they share the frequency.`, `どちらの符号も同じ二つの積を使い、どちらも $k^2 = \\pi^2(${m * m + k * k})$ なので周波数が同じです。`], [`The others have $m^2 + n^2 = ${(m + 1) ** 2 + k * k}$, $${(m + 1) ** 2 + (k + 1) ** 2}$ and $${m * m + (k + 1) ** 2}$, all different. The $\\pm$ pair draw different figures at one pitch, which the readout lists as the partner.`, `他の選択肢では $m^2 + n^2 = ${(m + 1) ** 2 + k * k}$、$${(m + 1) ** 2 + (k + 1) ** 2}$、$${m * m + (k + 1) ** 2}$ で、どれも異なります。$\\pm$ の組は同じ音高で別の図形を描き、読み取り欄ではそれを相手として示しています。`]],
        set: { m, n: k, sign: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f11 = r.pick([120, 150, 200, 250, 330]), [m, k] = r.pick(modes(2, 32));
        const f = f11 * (m * m + k * k) / 2;
        return {
          q: [`A square plate's mode $(1, 1)$ rings at $${f11}$ Hz. In this approximation, at what frequency does mode $(${m}, ${k})$ ring?`, `正方形の板のモード $(1, 1)$ は $${f11}$ Hz で鳴ります。この近似で、モード $(${m}, ${k})$ は何 Hz で鳴りますか。`],
          a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
          hint: ['$f \\propto m^2 + n^2$.', '$f \\propto m^2 + n^2$ です。'],
          sol: [[`$f = ${f11}\\times(${m * m + k * k})/2 = ${n(f)}$ Hz.`, `$f = ${f11}\\times(${m * m + k * k})/2 = ${n(f)}$ Hz です。`], ['Real free plates differ by up to some tens of percent from this estimate, because the free edges are only approximately satisfied, but the ordering of the modes is close.', '実際の自由端の板では、自由端の条件が近似的にしか満たされないので、この見積もりと数十パーセントほど違うことがあります。しかしモードの並び順はほぼ合っています。']],
          set: { m, n: k },
        };
      }
      if (form === 1) {
        const a = r.pick([0.5, 2, 1.5, 3]), h = r.pick([0.5, 2, 1, 3]), f0 = r.pick([200, 300, 440, 500]);
        const f = f0 * h / (a * a);
        return {
          q: [`A plate rings at $${f0}$ Hz in some mode. A plate of the same metal, ${h === 1 ? 'the same thickness' : `$${n(h)}$ times as thick`} and $${n(a)}$ times as wide, is bowed into the same mode. What is its frequency?`, `ある板があるモードで $${f0}$ Hz で鳴ります。同じ金属で、${h === 1 ? '厚さは同じ' : `厚さは $${n(h)}$ 倍`}、幅は $${n(a)}$ 倍の板を同じモードで鳴らすと、周波数はいくらですか。`],
          a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
          hint: ['$\\omega = \\sqrt{D/\\rho h}\\,k^2$ with $D \\propto h^3$, and $k \\propto 1/a$ for the same pattern.', '$\\omega = \\sqrt{D/\\rho h}\\,k^2$ で $D \\propto h^3$、同じ模様なら $k \\propto 1/a$ です。'],
          sol: [['$\\sqrt{D/\\rho h} \\propto \\sqrt{h^3/h} = h$, and $k^2 \\propto 1/a^2$, so $f \\propto h/a^2$.', '$\\sqrt{D/\\rho h} \\propto \\sqrt{h^3/h} = h$、$k^2 \\propto 1/a^2$ なので $f \\propto h/a^2$ です。'], [`$f = ${f0}\\times${n(h)}/${n(a)}^2 = ${n(f, 4)}$ Hz. Thicker plates ring higher, wider ones much lower.`, `$f = ${f0}\\times${n(h)}/${n(a)}^2 = ${n(f, 4)}$ Hz です。厚い板ほど高く、広い板ほどずっと低く鳴ります。`]],
        };
      }
      const [m, k] = r.pick(modes(1, 32).filter(([a, b]) => a !== b)), sg = r.int(0, 1);
      return {
        q: [`Is the diagonal $y = x$ a nodal line of mode $(${m}, ${k})$ with the ${sg ? '$-$' : '$+$'} sign?`, `${sg ? '$-$' : '$+$'} 符号のモード $(${m}, ${k})$ で、対角線 $y = x$ は節線ですか。`],
        a: { type: 'choice', v: sg ? 0 : 1, fixed: true, opts: [['Yes: swapping $x$ and $y$ flips the sign of $w$, so $w = 0$ wherever $x = y$', 'はい。$x$ と $y$ を入れ替えると $w$ の符号が反転するので、$x = y$ では $w = 0$ です'], ['No: $w$ is symmetric under swapping $x$ and $y$, so nothing forces it to vanish on the diagonal', 'いいえ。$w$ は $x$ と $y$ の入れ替えについて対称なので、対角線上で 0 になる理由はありません']] },
        hint: ['Compute $w(y, x)$ from the formula and compare with $w(x, y)$.', '式から $w(y, x)$ を計算し、$w(x, y)$ と比べてください。'],
        sol: [[`$w(y, x) = \\cos ${m}\\pi y\\cos ${k}\\pi x ${sg ? '-' : '+'} \\cos ${k}\\pi y\\cos ${m}\\pi x = ${sg ? '-' : ''}w(x, y)$.`, `$w(y, x) = \\cos ${m}\\pi y\\cos ${k}\\pi x ${sg ? '-' : '+'} \\cos ${k}\\pi y\\cos ${m}\\pi x = ${sg ? '-' : ''}w(x, y)$ です。`], [sg ? 'On the diagonal $w(x, x) = -w(x, x)$, so $w = 0$: every minus mode has the diagonal as a nodal line.' : `On the diagonal there is no constraint; here $w(x, x) = 2\\cos ${m}\\pi x\\cos ${k}\\pi x$, zero only at isolated points.`, sg ? '対角線上では $w(x, x) = -w(x, x)$ なので $w = 0$ です。マイナスのモードはすべて対角線を節線にもちます。' : `対角線上には制約がなく、$w(x, x) = 2\\cos ${m}\\pi x\\cos ${k}\\pi x$ は孤立した点でしか 0 になりません。`]],
        set: { m, n: k, sign: sg },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([25, 50, 65, 85, 100, 125, 13, 5, 10]);
        let count = 0; const list = [];
        for (let m = 0; m * m <= N; m++) { const k2 = N - m * m, k = Math.round(Math.sqrt(k2)); if (k * k === k2) { count++; list.push(`(${m}, ${k})`); } }
        return {
          q: [`How many ordered pairs $(m, n)$ of non-negative integers have $m^2 + n^2 = ${N}$, so that their modes all ring at the same frequency?`, `$m^2 + n^2 = ${N}$ となる非負整数の順序対 $(m, n)$ はいくつありますか。それらのモードはすべて同じ周波数で鳴ります。`],
          a: { type: 'int', v: count },
          hint: ['Try each $m$ from $0$ up to $\\sqrt N$ and check whether $N - m^2$ is a square.', '$m$ を $0$ から $\\sqrt N$ まで試し、$N - m^2$ が平方数かを調べてください。'],
          sol: [[`The pairs are ${list.join(', ')}.`, `組は ${list.join('、')} です。`], [`That is ${count}. Beyond the $(m, n)$, $(n, m)$ symmetry, numbers that are sums of two squares in more than one way (like $25 = 0^2 + 5^2 = 3^2 + 4^2$) give accidental degeneracies, where quite different patterns share one note.`, `${count} 組です。$(m, n)$ と $(n, m)$ の対称性に加え、二つの平方数の和に二通り以上で書ける数（$25 = 0^2 + 5^2 = 3^2 + 4^2$ など）では偶然の縮退が起こり、まったく違う模様が同じ音を共有します。`]],
        };
      }
      if (form === 1) {
        const h = r.pick([1, 1.5, 2]) * 1e-3, a = r.pick([0.2, 0.25, 0.3]), [m, k] = r.pick([[1, 1], [2, 0], [3, 1], [2, 2]]);
        const E = 200e9, nu = 0.3, rho = 7850, D = E * h ** 3 / (12 * (1 - nu * nu));
        const f = Math.sqrt(D / (rho * h)) * PI * PI * (m * m + k * k) / (a * a) / (2 * PI);
        return {
          q: [`A steel plate ($E = 200$ GPa, $\\nu = 0.3$, $\\rho = 7850\\ \\text{kg/m}^3$) is $${n(h * 1000)}$ mm thick and $${n(a * 100)}$ cm square. In the approximation $k^2 = \\pi^2(m^2 + n^2)/a^2$, at what frequency does mode $(${m}, ${k})$ ring?`, `鋼板（$E = 200$ GPa、$\\nu = 0.3$、$\\rho = 7850\\ \\text{kg/m}^3$）の厚さは $${n(h * 1000)}$ mm、一辺 $${n(a * 100)}$ cm の正方形です。近似 $k^2 = \\pi^2(m^2 + n^2)/a^2$ で、モード $(${m}, ${k})$ は何 Hz で鳴りますか。`],
          a: { type: 'num', v: f, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['Bending stiffness $D = Eh^3/12(1 - \\nu^2)$ and $\\omega = \\sqrt{D/\\rho h}\\,k^2$.', '曲げ剛性は $D = Eh^3/12(1 - \\nu^2)$、$\\omega = \\sqrt{D/\\rho h}\\,k^2$ です。'],
          sol: [[`$D = ${s3(D)}$ N m and $\\sqrt{D/\\rho h} = ${s3(Math.sqrt(D / (rho * h)))}\\ \\text{m}^2/\\text{s}$.`, `$D = ${s3(D)}$ N m、$\\sqrt{D/\\rho h} = ${s3(Math.sqrt(D / (rho * h)))}\\ \\text{m}^2/\\text{s}$ です。`], [`$k^2 = \\pi^2\\times${m * m + k * k}/${n(a)}^2 = ${s3(PI * PI * (m * m + k * k) / (a * a))}\\ \\text{m}^{-2}$, so $f = \\omega/2\\pi = ${s3(f)}$ Hz.`, `$k^2 = \\pi^2\\times${m * m + k * k}/${n(a)}^2 = ${s3(PI * PI * (m * m + k * k) / (a * a))}\\ \\text{m}^{-2}$ なので $f = \\omega/2\\pi = ${s3(f)}$ Hz です。`], ['Squarely in the audible range, which is why Chladni could hear each pattern as a note while the sand drew it.', 'ちょうど可聴域にあります。だからクラドニは、砂が模様を描くのと同時に、それぞれを一つの音として聞くことができました。']],
          set: { m, n: k },
        };
      }
      const [m, k] = r.pick(modes(1, 32));
      return {
        q: [`$w = \\cos ${m}\\pi x\\cos ${k}\\pi y + \\cos ${k}\\pi x\\cos ${m}\\pi y$ satisfies $\\nabla^2 w = -\\lambda w$. What is $\\lambda$?`, `$w = \\cos ${m}\\pi x\\cos ${k}\\pi y + \\cos ${k}\\pi x\\cos ${m}\\pi y$ は $\\nabla^2 w = -\\lambda w$ を満たします。$\\lambda$ はいくらですか。`],
        a: { type: 'num', v: PI * PI * (m * m + k * k), show: `${m * m + k * k}\\pi^2` },
        hint: ['Differentiate each product twice in $x$ and twice in $y$.', '各積を $x$ で2回、$y$ で2回微分します。'],
        sol: [[`$\\partial_x^2 + \\partial_y^2$ multiplies $\\cos ${m}\\pi x\\cos ${k}\\pi y$ by $-\\pi^2(${m}^2 + ${k}^2)$, and the swapped product by the same number.`, `$\\partial_x^2 + \\partial_y^2$ は $\\cos ${m}\\pi x\\cos ${k}\\pi y$ に $-\\pi^2(${m}^2 + ${k}^2)$ を掛け、入れ替えた積にも同じ数を掛けます。`], [`$\\lambda = ${m * m + k * k}\\pi^2 = ${n(PI * PI * (m * m + k * k), 4)}$. Then $\\nabla^4 w = \\lambda^2 w$, so the plate equation $D\\nabla^4 w = \\rho h\\omega^2 w$ gives $\\omega \\propto \\lambda$, the frequency rule used in the readout.`, `$\\lambda = ${m * m + k * k}\\pi^2 = ${n(PI * PI * (m * m + k * k), 4)}$ です。すると $\\nabla^4 w = \\lambda^2 w$ なので、板の方程式 $D\\nabla^4 w = \\rho h\\omega^2 w$ から $\\omega \\propto \\lambda$ となり、読み取り欄の周波数の規則が得られます。`]],
        set: { m, n: k, sign: 0 },
      };
    },
  ];

  /* ---------------- 3. Doppler effect and Mach cone ---------------- */
  const CS = 343;
  Q['doppler-mach'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.step(0.05, 0.6, 0.05), f = r.pick([300, 440, 500, 700, 1000]), away = r.chance(0.5);
        const fp = away ? f / (1 + M) : f / (1 - M);
        return {
          q: [`A ${f} Hz siren moves at Mach $${n(M)}$ (that is, $${n(M * CS, 3)}$ m/s in air at $343$ m/s) ${away ? 'directly away from' : 'straight towards'} a listener. What frequency does the listener hear?`, `$${f}$ Hz のサイレンがマッハ $${n(M)}$（音速 $343$ m/s の空気中で $${n(M * CS, 3)}$ m/s）で聴き手${away ? 'から真っすぐ遠ざかって' : 'に向かって真っすぐ近づいて'}います。聴き手に聞こえる周波数はいくらですか。`],
          a: { type: 'num', v: fp, unit: ['Hz', 'Hz'] },
          hint: ['Crests are emitted $1/f$ apart in time while the source moves $v_s/f$, so the wavelength ahead is $(c - v_s)/f$.', '山は時間 $1/f$ ごとに出され、その間に音源は $v_s/f$ 進むので、前方の波長は $(c - v_s)/f$ です。'],
          sol: [[away ? 'Behind a moving source the wavelength stretches to $(c + v_s)/f$, so $f\' = f/(1 + M)$.' : 'Ahead of a moving source the wavelength shrinks to $(c - v_s)/f$, so $f\' = f/(1 - M)$.', away ? '動く音源の後方では波長が $(c + v_s)/f$ に伸びるので $f\' = f/(1 + M)$ です。' : '動く音源の前方では波長が $(c - v_s)/f$ に縮むので $f\' = f/(1 - M)$ です。'], [`$f' = ${f}/${n(away ? 1 + M : 1 - M)} = ${n(fp, 4)}$ Hz.`, `$f' = ${f}/${n(away ? 1 + M : 1 - M)} = ${n(fp, 4)}$ Hz です。`]],
          set: { M },
        };
      }
      if (form === 1) {
        const v = r.pick([10, 20, 30, 40, 50]), f = r.pick([400, 500, 800, 1000]);
        const fa = f * CS / (CS - v), fr = f * CS / (CS + v);
        return {
          q: [`A car sounding a $${f}$ Hz horn passes you at $${v}$ m/s. Take $c = 343$ m/s. What frequencies do you hear as it approaches and after it has passed?`, `$${f}$ Hz の警笛を鳴らす車が $${v}$ m/s であなたの前を通り過ぎます。$c = 343$ m/s とします。近づくときと通り過ぎた後に聞こえる周波数はいくらですか。`],
          a: { type: 'tuple', v: [fa, fr], labels: [['approaching', '近づくとき'], ['receding', '遠ざかるとき']], rel: 0.003 },
          hint: ['$f\' = fc/(c \\mp v_s)$.', '$f\' = fc/(c \\mp v_s)$ です。'],
          sol: [[`Approaching: $${f}\\times343/${CS - v} = ${n(fa, 4)}$ Hz. Receding: $${f}\\times343/${CS + v} = ${n(fr, 4)}$ Hz.`, `近づくとき $${f}\\times343/${CS - v} = ${n(fa, 4)}$ Hz、遠ざかるとき $${f}\\times343/${CS + v} = ${n(fr, 4)}$ Hz です。`], [`The drop is a factor $${n(fa / fr, 4)}$, about ${n(12 * Math.log2(fa / fr), 2)} semitones: the familiar falling pitch as a car goes by.`, `下がり幅は $${n(fa / fr, 4)}$ 倍、約 ${n(12 * Math.log2(fa / fr), 2)} 半音で、車が通り過ぎるときのおなじみの音の下がり方です。`]],
          set: onStep(v / CS, 0.05, 0, 2.5) ? { M: v / CS } : { M: Math.round(v / CS * 20) / 20 },
        };
      }
      const M = r.step(1.05, 2.5, 0.05), mu = deg(Math.asin(1 / M));
      return {
        q: [`What is the half-angle of the Mach cone behind an object moving at Mach $${n(M)}$? Give one decimal.`, `マッハ $${n(M)}$ で動く物体の後ろにできるマッハ円錐の半頂角は何度ですか。小数第1位まで求めてください。`],
        a: { type: 'num', v: mu, tol: 0.06, unit: ['°', '°'] },
        hint: ['In time $t$ the object goes $Mct$ while its sound spreads to radius $ct$.', '時間 $t$ の間に物体は $Mct$ 進み、その音は半径 $ct$ まで広がります。'],
        sol: [[`$\\sin\\mu = ct/(Mct) = 1/${n(M)} = ${n(1 / M, 4)}$.`, `$\\sin\\mu = ct/(Mct) = 1/${n(M)} = ${n(1 / M, 4)}$ です。`], [`$\\mu = ${n(mu, 3)}^\\circ$. The faster the object, the narrower the cone; at $M = 1$ it opens out into a flat wall.`, `$\\mu = ${n(mu, 3)}^\\circ$ です。速いほど円錐は細くなり、$M = 1$ では平らな壁に開きます。`]],
        set: { M },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.step(0.1, 0.8, 0.1), th = r.pick([0, 30, 45, 60, 90, 120, 135, 150, 180]);
        const ratio = 1 / (1 - M * Math.cos(rad(th)));
        return {
          q: [`A source at Mach $${n(M)}$ emits a sound when the line to the listener makes $\\theta = ${th}^\\circ$ with its velocity. What is $f'/f$ for that sound? Give three decimals.`, `マッハ $${n(M)}$ の音源が、聴き手への線と速度のなす角が $\\theta = ${th}^\\circ$ のときに音を出します。その音の $f'/f$ はいくらですか。小数第3位まで求めてください。`],
          a: { type: 'num', v: ratio, tol: 0.0006 },
          hint: ['Only the velocity component along the line to the listener matters: $f\'/f = 1/(1 - M\\cos\\theta)$.', '効くのは聴き手への線に沿った速度成分だけで、$f\'/f = 1/(1 - M\\cos\\theta)$ です。'],
          sol: [[`$M\\cos\\theta = ${n(M)}\\cos ${th}^\\circ = ${n(M * Math.cos(rad(th)), 4)}$.`, `$M\\cos\\theta = ${n(M)}\\cos ${th}^\\circ = ${n(M * Math.cos(rad(th)), 4)}$ です。`], [`$f'/f = 1/(1 - ${n(M * Math.cos(rad(th)), 4)}) = ${n(ratio, 4)}$. ${th === 90 ? 'At $90^\\circ$ there is no shift at all, but the sound emitted then is heard later, after the source has moved on.' : 'The angle is the one at emission; by the time it is heard the source has moved.'}`, `$f'/f = 1/(1 - ${n(M * Math.cos(rad(th)), 4)}) = ${n(ratio, 4)}$ です。${th === 90 ? '$90^\\circ$ ではずれはまったくありませんが、そのとき出た音は音源が先へ進んだ後で聞こえます。' : '角度は音が出された時のものです。聞こえる時には音源は先へ進んでいます。'}`]],
          set: { M },
        };
      }
      if (form === 1) {
        const vs = r.pick([0, 10, 20, 30]), vo = r.pick([5, 10, 15, 25]), f = r.pick([500, 600, 1000]), opp = r.chance(0.5);
        const fp = opp ? f * (CS + vo) / (CS - vs) : f * (CS - vo) / (CS + vs);
        return {
          q: [opp ? `A source moving at $${vs}$ m/s and a listener moving at $${vo}$ m/s approach each other head on. The source emits $${f}$ Hz; $c = 343$ m/s. What does the listener hear?` : `A source moving at $${vs}$ m/s and a listener moving at $${vo}$ m/s move directly apart. The source emits $${f}$ Hz; $c = 343$ m/s. What does the listener hear?`, opp ? `$${vs}$ m/s で動く音源と $${vo}$ m/s で動く聴き手が正面から近づき合います。音源は $${f}$ Hz を出し、$c = 343$ m/s です。聴き手には何 Hz が聞こえますか。` : `$${vs}$ m/s で動く音源と $${vo}$ m/s で動く聴き手が真っすぐ離れていきます。音源は $${f}$ Hz を出し、$c = 343$ m/s です。聴き手には何 Hz が聞こえますか。`],
          a: { type: 'num', v: fp, rel: 0.002, unit: ['Hz', 'Hz'] },
          hint: ['The source sets the wavelength, the listener sets how fast crests are met: $f\' = f(c \\pm v_o)/(c \\mp v_s)$.', '音源は波長を決め、聴き手は山に出会う速さを決めます。$f\' = f(c \\pm v_o)/(c \\mp v_s)$ です。'],
          sol: [[opp ? `Wavelength ahead of the source: $(343 - ${vs})/${f}$ m; the listener meets crests at $343 + ${vo}$ m/s.` : `Wavelength behind the source: $(343 + ${vs})/${f}$ m; the listener meets crests at $343 - ${vo}$ m/s.`, opp ? `音源前方の波長は $(343 - ${vs})/${f}$ m で、聴き手は $343 + ${vo}$ m/s で山に出会います。` : `音源後方の波長は $(343 + ${vs})/${f}$ m で、聴き手は $343 - ${vo}$ m/s で山に出会います。`], [`$f' = ${f}\\times${opp ? CS + vo : CS - vo}/${opp ? CS - vs : CS + vs} = ${n(fp, 5)}$ Hz. A moving source and a moving listener are not equivalent: sound has a medium, and the formula is not symmetric in $v_s$ and $v_o$.`, `$f' = ${f}\\times${opp ? CS + vo : CS - vo}/${opp ? CS - vs : CS + vs} = ${n(fp, 5)}$ Hz です。音には媒質があるので、動く音源と動く聴き手は同等ではなく、式は $v_s$ と $v_o$ について対称ではありません。`]],
        };
      }
      const M = r.pick([1.2, 1.5, 2, 2.5, 1.4]), h = r.pick([3, 5, 8, 10, 12]);
      const t = h * 1000 * Math.sqrt(M * M - 1) / (M * CS);
      return {
        q: [`A jet flies level at Mach $${n(M)}$, $${h}$ km above you ($c = 343$ m/s). How long after it passes directly overhead do you hear the boom?`, `ジェット機がマッハ $${n(M)}$ で、あなたの真上 $${h}$ km を水平に飛びます（$c = 343$ m/s）。真上を通過してから何秒後にブームが聞こえますか。`],
        a: { type: 'num', v: t, rel: 0.005, unit: ['s', 's'] },
        hint: ['The cone reaches you when the jet is $h\\cot\\mu = h\\sqrt{M^2 - 1}$ past you.', '円錐が届くのは、ジェット機があなたを $h\\cot\\mu = h\\sqrt{M^2 - 1}$ だけ過ぎたときです。'],
        sol: [[`$\\cot\\mu = \\sqrt{M^2 - 1} = ${n(Math.sqrt(M * M - 1), 4)}$, so the jet is $${n(h * Math.sqrt(M * M - 1), 4)}$ km past you.`, `$\\cot\\mu = \\sqrt{M^2 - 1} = ${n(Math.sqrt(M * M - 1), 4)}$ なので、ジェット機はあなたを $${n(h * Math.sqrt(M * M - 1), 4)}$ km 過ぎています。`], [`$t = \\dfrac{h\\sqrt{M^2 - 1}}{Mc} = ${n(t, 4)}$ s. Until then you hear nothing at all, then the boom and two sounds at once, as the figure's listener does.`, `$t = \\dfrac{h\\sqrt{M^2 - 1}}{Mc} = ${n(t, 4)}$ s です。それまでは何も聞こえず、その後ブームと二つの音が同時に聞こえます。図の聴き手と同じです。`]],
        set: { M, ox: 0, oy: 3.3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]), k = (1 + M) / (1 - M);
        return {
          q: [`A passing source sounds $${n(k, 4)}$ times higher while approaching than after it has passed (heard head on in both cases). What is its Mach number?`, `通り過ぎる音源の音は、近づくとき遠ざかった後より $${n(k, 4)}$ 倍高く聞こえます（どちらも正面方向で聞いた場合）。マッハ数はいくらですか。`],
          a: { type: 'num', v: M, tol: 0.001 },
          hint: ['The ratio of $1/(1 - M)$ to $1/(1 + M)$ is $(1 + M)/(1 - M)$.', '$1/(1 - M)$ と $1/(1 + M)$ の比は $(1 + M)/(1 - M)$ です。'],
          sol: [[`$(1 + M)/(1 - M) = k$ gives $M = (k - 1)/(k + 1)$.`, `$(1 + M)/(1 - M) = k$ から $M = (k - 1)/(k + 1)$ です。`], [`$M = ${n(k - 1, 4)}/${n(k + 1, 4)} = ${n(M, 3)}$, or about $${n(M * CS, 3)}$ m/s in air. The source frequency is not needed: the ratio alone measures the speed.`, `$M = ${n(k - 1, 4)}/${n(k + 1, 4)} = ${n(M, 3)}$、空気中で約 $${n(M * CS, 3)}$ m/s です。音源の周波数は不要で、比だけで速さがわかります。`]],
          set: { M },
        };
      }
      if (form === 1) {
        const M = r.pick([0.3, 0.5, 0.6, 0.7]), X = r.pick([1, 2, 3]), Y = r.pick([1, 1.5, 2]);
        return {
          q: [`A source moves along the $x$ axis at Mach $${n(M)}$ with $c = 1$, at position $${n(M)}t$. A listener sits at $(${X}, ${n(Y)})$. Write the heard ratio $f'/f$ as a function of the emission time $t$.`, `音源が $c = 1$ の単位でマッハ $${n(M)}$ で $x$ 軸上を動き、位置は $${n(M)}t$ です。聴き手は $(${X}, ${n(Y)})$ にいます。聞こえる比 $f'/f$ を、音が出された時刻 $t$ の関数として書いてください。`],
          a: { type: 'expr', v: `1/(1 - ${M}*(${X}-${M}*t)/sqrt((${X}-${M}*t)^2+${Y * Y}))`, vars: ['t'], dom: { t: [-4, 8] }, lhs: ["$f'/f =$", "$f'/f =$"] },
          hint: ['$f\'/f = 1/(1 - M\\cos\\theta)$, with $\\cos\\theta$ the cosine of the angle between the velocity and the line from source to listener at time $t$.', '$f\'/f = 1/(1 - M\\cos\\theta)$ で、$\\cos\\theta$ は時刻 $t$ における速度と音源から聴き手への線のなす角の余弦です。'],
          sol: [[`At emission the source is at $(${n(M)}t, 0)$, so $\\cos\\theta = \\dfrac{${X} - ${n(M)}t}{\\sqrt{(${X} - ${n(M)}t)^2 + ${n(Y * Y)}}}$.`, `音を出す時、音源は $(${n(M)}t, 0)$ にあるので $\\cos\\theta = \\dfrac{${X} - ${n(M)}t}{\\sqrt{(${X} - ${n(M)}t)^2 + ${n(Y * Y)}}}$ です。`], [`$f'/f = 1\\Big/\\left(1 - ${n(M)}\\cos\\theta\\right)$, equivalently $(dt_{\\text{arr}}/dt)^{-1}$ with $t_{\\text{arr}} = t + r(t)$.`, `$f'/f = 1\\Big/\\left(1 - ${n(M)}\\cos\\theta\\right)$ で、$t_{\\text{arr}} = t + r(t)$ として $(dt_{\\text{arr}}/dt)^{-1}$ と同じです。`], [`It falls from $1/(1 - M) = ${n(1 / (1 - M), 4)}$ long before to $1/(1 + M) = ${n(1 / (1 + M), 4)}$ long after, steepest when the source passes closest.`, `ずっと前の $1/(1 - M) = ${n(1 / (1 - M), 4)}$ からずっと後の $1/(1 + M) = ${n(1 / (1 + M), 4)}$ へ下がり、音源が最も近くを通るとき最も急です。`]],
          set: { M, ox: X, oy: Y },
        };
      }
      const M = r.pick([1.2, 1.5, 2, 2.5, 3]), h = r.pick([1, 5, 10, 15]), d = h * Math.sqrt(M * M - 1);
      return {
        q: [`A plane at Mach $${n(M)}$ flies level $${h}$ km up. When you hear its boom, how far ahead of you (horizontally) is the plane?`, `マッハ $${n(M)}$ の飛行機が高さ $${h}$ km を水平に飛んでいます。ブームが聞こえたとき、飛行機はあなたから水平にどれだけ先にいますか。`],
        a: { type: 'num', v: d, rel: 0.005, unit: ['km', 'km'] },
        hint: ['You are on the cone, whose half-angle is $\\mu$ with $\\sin\\mu = 1/M$; draw the right triangle with height $h$.', 'あなたは円錐の上にいて、半頂角は $\\sin\\mu = 1/M$ を満たす $\\mu$ です。高さ $h$ の直角三角形を描いてください。'],
        sol: [[`$\\tan\\mu = h/d$, and $\\tan\\mu = 1/\\sqrt{M^2 - 1}$.`, `$\\tan\\mu = h/d$ で、$\\tan\\mu = 1/\\sqrt{M^2 - 1}$ です。`], [`$d = h\\sqrt{M^2 - 1} = ${h}\\times${n(Math.sqrt(M * M - 1), 4)} = ${n(d, 4)}$ km. You hear the plane well after it has passed, and the sound you hear first was emitted where the line to you met the path at $\\cos\\theta = 1/M$.`, `$d = h\\sqrt{M^2 - 1} = ${h}\\times${n(Math.sqrt(M * M - 1), 4)} = ${n(d, 4)}$ km です。飛行機が通り過ぎたずっと後に音が聞こえ、最初に聞こえる音は、あなたへの線が経路と $\\cos\\theta = 1/M$ をなす点で出されたものです。`]],
        set: M <= 2.5 ? { M } : undefined,
      };
    },
  ];
})();
