'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, frac } = P.util;
  const PI = Math.PI;
  const GIBBS = 1.1789797444721672;
  const SN = (x, N) => { let s = 0; for (let k = 0; k < N; k++) s += Math.sin((2 * k + 1) * x) / (2 * k + 1); return 4 * s / PI; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- 1. square wave from odd harmonics ---------- */
  Q.harmonics = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.int(1, 15), odd = k % 2 === 1;
        return {
          q: [`The square wave equal to $-1$ on $(-\\pi, 0)$ and $1$ on $(0, \\pi)$ has sine coefficients $b_k$. What is $b_{${k}}$?`, `$(-\\pi, 0)$ で $-1$、$(0, \\pi)$ で $1$ の矩形波の正弦係数を $b_k$ とします。$b_{${k}}$ はいくつですか。`],
          a: { type: 'num', v: odd ? 4 / (PI * k) : 0, tol: odd ? undefined : 1e-9, show: odd ? `\\tfrac{4}{${k === 1 ? '' : k}\\pi}` : '0' },
          hint: ['$b_k = \\tfrac1\\pi\\int_{-\\pi}^{\\pi} f(x)\\sin kx\\,dx = \\tfrac{2}{\\pi k}(1 - \\cos k\\pi)$.', '$b_k = \\tfrac1\\pi\\int_{-\\pi}^{\\pi} f(x)\\sin kx\\,dx = \\tfrac{2}{\\pi k}(1 - \\cos k\\pi)$ です。'],
          sol: [[`$1 - \\cos ${k}\\pi = ${odd ? 2 : 0}$, so $b_{${k}} = ${odd ? `\\tfrac{4}{${k === 1 ? '' : k}\\pi} = ${n(4 / (PI * k), 4)}` : '0'}$.`, `$1 - \\cos ${k}\\pi = ${odd ? 2 : 0}$ なので $b_{${k}} = ${odd ? `\\tfrac{4}{${k === 1 ? '' : k}\\pi} = ${n(4 / (PI * k), 4)}` : '0'}$ です。`], [odd ? 'Only odd harmonics occur, and they decay like $1/k$: slowly, because the wave has jumps.' : 'Even harmonics vanish: the wave is odd and symmetric about $x = \\pi/2$, which every even harmonic is not.', odd ? '奇数次の調和波だけが現れ、$1/k$ のように減衰します。波に跳躍があるので減衰は遅いのです。' : '偶数次は消えます。波は奇関数で $x = \\pi/2$ について対称ですが、偶数次の調和波はそうではありません。']],
          set: odd ? { n: (k + 1) / 2 } : undefined,
        };
      }
      if (r.chance(0.5)) {
        const N = r.int(1, 30);
        return {
          q: [`The partial sum $S_N$ uses the first $N$ odd harmonics. Which is the highest harmonic $k$ in $S_{${N}}$?`, `部分和 $S_N$ は最初の $N$ 個の奇数次の調和波を使います。$S_{${N}}$ に含まれる最高次の $k$ はいくつですか。`],
          a: { type: 'int', v: 2 * N - 1 },
          hint: ['The odd harmonics are $1, 3, 5, \\dots$', '奇数次の調和波は $1, 3, 5, \\dots$ です。'],
          sol: [[`The $N$-th odd number is $2N - 1 = ${2 * N - 1}$.`, `$N$ 番目の奇数は $2N - 1 = ${2 * N - 1}$ です。`], [`So $S_{${N}}$ oscillates up to frequency $${2 * N - 1}$, and its ripples near the jump have width about $\\pi/(2N) = ${n(PI / (2 * N), 3)}$.`, `したがって $S_{${N}}$ は次数 $${2 * N - 1}$ まで振動し、跳躍の近くの波打ちの幅はおよそ $\\pi/(2N) = ${n(PI / (2 * N), 3)}$ です。`]],
          set: { n: N },
        };
      }
      const k = 2 * r.int(0, 29) + 1;
      return {
        q: [`How many odd harmonics must the partial sum contain for its highest term to be $\\sin ${k}x$?`, `部分和の最高次の項が $\\sin ${k}x$ となるには、奇数次の調和波をいくつ含める必要がありますか。`],
        a: { type: 'int', v: (k + 1) / 2 },
        hint: ['Count $1, 3, \\dots, k$.', '$1, 3, \\dots, k$ を数えます。'],
        sol: [[`The odd numbers $1, 3, \\dots, ${k}$ number $(${k} + 1)/2 = ${(k + 1) / 2}$.`, `奇数 $1, 3, \\dots, ${k}$ の個数は $(${k} + 1)/2 = ${(k + 1) / 2}$ です。`], ['Setting the slider to this value draws that last term in orange.', 'スライダーをこの値にすると、最後の項が橙色で描かれます。']],
        set: { n: (k + 1) / 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const wave = r.int(0, 2), k = r.int(1, 7);
        if (wave === 0) {
          const v = 2 * (k % 2 ? 1 : -1) / k;
          return {
            q: [`Find the sine coefficient $b_{${k}}$ of the sawtooth $f(x) = x$ on $(-\\pi, \\pi)$.`, `$(-\\pi, \\pi)$ 上ののこぎり波 $f(x) = x$ の正弦係数 $b_{${k}}$ を求めてください。`],
            a: { type: 'num', v, show: frac(2 * (k % 2 ? 1 : -1), k) },
            hint: ['Integrate $\\tfrac1\\pi\\int_{-\\pi}^{\\pi} x\\sin kx\\,dx$ by parts.', '$\\tfrac1\\pi\\int_{-\\pi}^{\\pi} x\\sin kx\\,dx$ を部分積分します。'],
            sol: [[`By parts, $\\int_{-\\pi}^{\\pi} x\\sin kx\\,dx = -\\tfrac{2\\pi\\cos k\\pi}{k}$, so $b_k = \\tfrac{2(-1)^{k+1}}{k}$.`, `部分積分より $\\int_{-\\pi}^{\\pi} x\\sin kx\\,dx = -\\tfrac{2\\pi\\cos k\\pi}{k}$ なので $b_k = \\tfrac{2(-1)^{k+1}}{k}$ です。`], [`$b_{${k}} = ${frac(2 * (k % 2 ? 1 : -1), k)}$. Like the square wave the sawtooth jumps (at $\\pm\\pi$), so its coefficients decay only like $1/k$.`, `$b_{${k}} = ${frac(2 * (k % 2 ? 1 : -1), k)}$ です。矩形波と同じくのこぎり波も（$\\pm\\pi$ で）跳躍するので、係数は $1/k$ のようにしか減衰しません。`]],
          };
        }
        if (wave === 1) {
          const odd = k % 2 === 1, v = odd ? -4 / (PI * k * k) : 0;
          return {
            q: [`Find the cosine coefficient $a_{${k}}$ of the triangle wave $f(x) = |x|$ on $(-\\pi, \\pi)$.`, `$(-\\pi, \\pi)$ 上の三角波 $f(x) = |x|$ の余弦係数 $a_{${k}}$ を求めてください。`],
            a: { type: 'num', v, tol: odd ? undefined : 1e-9, show: odd ? `-\\tfrac{4}{${k * k === 1 ? '' : k * k}\\pi}` : '0' },
            hint: ['$a_k = \\tfrac2\\pi\\int_0^{\\pi} x\\cos kx\\,dx$; integrate by parts.', '$a_k = \\tfrac2\\pi\\int_0^{\\pi} x\\cos kx\\,dx$ を部分積分します。'],
            sol: [[`$\\tfrac2\\pi\\int_0^\\pi x\\cos kx\\,dx = \\tfrac{2}{\\pi k^2}(\\cos k\\pi - 1)$.`, `$\\tfrac2\\pi\\int_0^\\pi x\\cos kx\\,dx = \\tfrac{2}{\\pi k^2}(\\cos k\\pi - 1)$ です。`], [`For $k = ${k}$ this is $${odd ? `-\\tfrac{4}{${k * k === 1 ? '' : k * k}\\pi} = ${n(v, 4)}` : '0'}$. The triangle wave is continuous, so its coefficients decay like $1/k^2$, faster than the square wave's $1/k$, and there is no Gibbs overshoot.`, `$k = ${k}$ では $${odd ? `-\\tfrac{4}{${k * k === 1 ? '' : k * k}\\pi} = ${n(v, 4)}` : '0'}$ です。三角波は連続なので係数は $1/k^2$ のように減衰し、矩形波の $1/k$ より速く、ギブスの行き過ぎもありません。`]],
          };
        }
        const A = r.pick([0.5, 2, 3, 5, 1.5]), kk = 2 * r.int(0, 3) + 1;
        return {
          q: [`A square wave swings between $-${n(A)}$ and $${n(A)}$ (positive on $(0, \\pi)$). What is the amplitude $b_{${kk}}$ of its harmonic $\\sin ${kk}x$?`, `$-${n(A)}$ と $${n(A)}$ の間を振れる矩形波（$(0, \\pi)$ で正）があります。調和波 $\\sin ${kk}x$ の振幅 $b_{${kk}}$ はいくつですか。`],
          a: { type: 'num', v: 4 * A / (PI * kk), show: `\\tfrac{${n(4 * A)}}{${kk === 1 ? '' : kk}\\pi}` },
          hint: ['Coefficients are linear: scale the unit square wave\'s $4/(\\pi k)$.', '係数は線形です。単位矩形波の $4/(\\pi k)$ を拡大します。'],
          sol: [[`$b_{${kk}} = ${n(A)}\\cdot\\tfrac{4}{${kk === 1 ? '' : kk}\\pi} = ${n(4 * A / (PI * kk), 4)}$.`, `$b_{${kk}} = ${n(A)}\\cdot\\tfrac{4}{${kk === 1 ? '' : kk}\\pi} = ${n(4 * A / (PI * kk), 4)}$ です。`], [`${kk === 1 ? 'The fundamental is $4/\\pi \\approx 1.27$ times taller than the wave itself, the first hint of the overshoot to come.' : 'Each harmonic scales with the wave; the shape of the spectrum is the same.'}`, `${kk === 1 ? '基本波は波そのものより $4/\\pi \\approx 1.27$ 倍高く、後に現れる行き過ぎの最初の兆しです。' : 'どの調和波も波と同じ比率で拡大され、スペクトルの形は変わりません。'}`]],
        };
      }
      if (form === 1) {
        const N = r.int(1, 4);
        let s = 0; for (let j = 0; j < N; j++) s += 1 / (2 * j + 1) ** 2;
        const e = Math.sqrt(1 - 8 * s / (PI * PI));
        return {
          q: [`Using Parseval, find the relative $L^2$ error $\\|f - S_{${N}}\\|_2/\\|f\\|_2$ of the square-wave partial sum $S_{${N}}$. Give three decimals.`, `パーセバルの等式を使って、矩形波の部分和 $S_{${N}}$ の相対 $L^2$ 誤差 $\\|f - S_{${N}}\\|_2/\\|f\\|_2$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: e, tol: 6e-4 },
          hint: ['$\\tfrac1\\pi\\int_{-\\pi}^{\\pi}|f|^2 = \\sum b_k^2 = 2$; the error energy is what the missing coefficients carry.', '$\\tfrac1\\pi\\int_{-\\pi}^{\\pi}|f|^2 = \\sum b_k^2 = 2$ です。誤差のエネルギーは含まれていない係数が担う分です。'],
          sol: [[`The kept energy is $\\sum_{j<${N}} b_{2j+1}^2 = \\tfrac{16}{\\pi^2}\\sum_{j<${N}}\\tfrac1{(2j+1)^2} = ${n(16 * s / (PI * PI), 4)}$ out of $2$.`, `残したエネルギーは $\\sum_{j<${N}} b_{2j+1}^2 = \\tfrac{16}{\\pi^2}\\sum_{j<${N}}\\tfrac1{(2j+1)^2} = ${n(16 * s / (PI * PI), 4)}$ で、全体は $2$ です。`], [`Relative error $= \\sqrt{1 - ${n(8 * s / (PI * PI), 4)}} = ${n(e, 4)}$, the readout's value. It tends to $0$ while the overshoot does not: convergence in $L^2$ is not uniform convergence.`, `相対誤差は $\\sqrt{1 - ${n(8 * s / (PI * PI), 4)}} = ${n(e, 4)}$ で、読み取り欄の値です。これは 0 に近づきますが行き過ぎは消えません。$L^2$ 収束は一様収束ではありません。`]],
          set: { n: N },
        };
      }
      const N = r.int(1, 6);
      let s = 0; for (let k = 0; k < N; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1);
      return {
        q: [`Evaluate the partial sum $S_{${N}}(\\pi/2)$ of the square wave. Give four decimals.`, `矩形波の部分和 $S_{${N}}(\\pi/2)$ を求めてください（小数第4位まで）。`],
        a: { type: 'num', v: 4 * s / PI, tol: 6e-5 },
        hint: ['$\\sin((2k+1)\\pi/2) = (-1)^k$.', '$\\sin((2k+1)\\pi/2) = (-1)^k$ です。'],
        sol: [[`$S_{${N}}(\\pi/2) = \\tfrac4\\pi\\left(1 - \\tfrac13 + \\tfrac15 - \\dots\\right)$ with ${N} term${N > 1 ? 's' : ''}, $= \\tfrac4\\pi\\cdot ${n(s, 5)}$.`, `$S_{${N}}(\\pi/2) = \\tfrac4\\pi\\left(1 - \\tfrac13 + \\tfrac15 - \\dots\\right)$（${N} 項）$= \\tfrac4\\pi\\cdot ${n(s, 5)}$ です。`], [`$= ${n(4 * s / PI, 5)}$. Far from the jump the partial sums converge to $1$; that limit is Leibniz's series $1 - \\tfrac13 + \\tfrac15 - \\dots = \\tfrac\\pi4$.`, `$= ${n(4 * s / PI, 5)}$ です。跳躍から離れた点では部分和は $1$ に収束し、それはライプニッツの級数 $1 - \\tfrac13 + \\tfrac15 - \\dots = \\tfrac\\pi4$ にほかなりません。`]],
        set: { n: N },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        if (r.chance(0.6)) {
          const [aT, aV, aJ] = r.pick([['\\pi/2', 'pi/2', 'π/2'], ['\\pi/3', 'pi/3', 'π/3'], ['\\pi/4', 'pi/4', 'π/4'], ['1', '1', '1']]);
          return {
            q: [`Let $f = 1$ for $|x| < ${aT}$ and $f = 0$ elsewhere on $(-\\pi, \\pi)$. Write its cosine coefficient $a_k$ ($k \\ge 1$) as a formula in $k$.`, `$(-\\pi, \\pi)$ 上で $|x| < ${aT}$ なら $f = 1$、それ以外で $f = 0$ とします。余弦係数 $a_k$（$k \\ge 1$）を $k$ の式で書いてください。`],
            a: { type: 'expr', v: `2*sin(k*${aV})/(pi*k)`, vars: ['k'], dom: { k: [0.5, 6] }, lhs: ['$a_k =$', '$a_k =$'] },
            hint: ['$a_k = \\tfrac1\\pi\\int_{-a}^{a}\\cos kx\\,dx$.', '$a_k = \\tfrac1\\pi\\int_{-a}^{a}\\cos kx\\,dx$ です。'],
            sol: [[`$\\tfrac1\\pi\\int_{-a}^{a}\\cos kx\\,dx = \\tfrac{2\\sin ka}{\\pi k}$ with $a = ${aT}$.`, `$a = ${aT}$ として $\\tfrac1\\pi\\int_{-a}^{a}\\cos kx\\,dx = \\tfrac{2\\sin ka}{\\pi k}$ です。`], [`$a_k = \\dfrac{2\\sin(${aT === '1' ? 'k' : `${aT.replace('\\pi', 'k\\pi')}`})}{\\pi k}$: a sampled sinc. A narrower pulse spreads its energy over more harmonics, the uncertainty principle in its simplest form.`, `$a_k = \\dfrac{2\\sin(${aT === '1' ? 'k' : `${aT.replace('\\pi', 'k\\pi')}`})}{\\pi k}$ で、標本化された sinc 関数です。パルスが細いほどエネルギーは多くの調和波に広がります。不確定性原理の最も簡単な形です。`]],
          };
        }
        const a = r.pick([1, 2, 3, 0.5]);
        return {
          q: [`Write the Fourier transform $F(k) = \\int_{-\\infty}^{\\infty} e^{-${a === 1 ? '' : n(a)}|t|}e^{-ikt}\\,dt$ as a formula in $k$.`, `フーリエ変換 $F(k) = \\int_{-\\infty}^{\\infty} e^{-${a === 1 ? '' : n(a)}|t|}e^{-ikt}\\,dt$ を $k$ の式で書いてください。`],
          a: { type: 'expr', v: `${2 * a}/(${a * a}+k^2)`, vars: ['k'], dom: { k: [-3, 3] }, lhs: ['$F(k) =$', '$F(k) =$'] },
          hint: ['Split at $t = 0$: each half is $\\int_0^\\infty e^{-(a \\pm ik)t}\\,dt = \\tfrac1{a \\pm ik}$.', '$t = 0$ で分けます。それぞれ $\\int_0^\\infty e^{-(a \\pm ik)t}\\,dt = \\tfrac1{a \\pm ik}$ です。'],
          sol: [[`$F(k) = \\tfrac1{${n(a)} + ik} + \\tfrac1{${n(a)} - ik} = \\tfrac{${n(2 * a)}}{${n(a * a)} + k^2}$.`, `$F(k) = \\tfrac1{${n(a)} + ik} + \\tfrac1{${n(a)} - ik} = \\tfrac{${n(2 * a)}}{${n(a * a)} + k^2}$ です。`], ['A Lorentzian of half-width $a$: the faster the decay in time, the wider the spectrum. The kink at $t = 0$ is why it decays only like $1/k^2$.', '半値半幅 $a$ のローレンツ関数です。時間での減衰が速いほどスペクトルは広くなります。$t = 0$ での折れ目のため $1/k^2$ のようにしか減衰しません。']],
        };
      }
      if (form === 1) {
        if (r.chance(0.5)) {
          const A = r.pick([1, 2, 5, 0.5, 3.3, 12]);
          return {
            q: [`A square wave jumps between $-${n(A)}$ and $${n(A)}$. As $N \\to \\infty$, what height does the first peak of $S_N$ next to the jump approach?`, `$-${n(A)}$ と $${n(A)}$ の間を跳ぶ矩形波があります。$N \\to \\infty$ で、跳躍の隣にある $S_N$ の最初の山の高さはどこに近づきますか。`],
            a: { type: 'num', v: GIBBS * A, rel: 0.002 },
            hint: ['The limiting peak of the unit wave is $\\tfrac2\\pi\\operatorname{Si}(\\pi) \\approx 1.1790$; everything is linear.', '単位の波の極限の山は $\\tfrac2\\pi\\operatorname{Si}(\\pi) \\approx 1.1790$ で、すべて線形です。'],
            sol: [['For the unit wave the peak sits at $x = \\pi/(2N)$ and tends to $\\tfrac2\\pi\\operatorname{Si}(\\pi) = 1.1790$.', '単位の波では山は $x = \\pi/(2N)$ にあり、$\\tfrac2\\pi\\operatorname{Si}(\\pi) = 1.1790$ に近づきます。'], [`Scaling by $${n(A)}$: the peak tends to $${n(GIBBS * A, 4)}$, an overshoot of $${n((GIBBS - 1) * A, 4)}$, which is $8.95\\%$ of the jump $${n(2 * A)}$. More terms never remove it.`, `$${n(A)}$ 倍すると山は $${n(GIBBS * A, 4)}$ に近づき、行き過ぎは $${n((GIBBS - 1) * A, 4)}$ で、跳躍幅 $${n(2 * A)}$ の $8.95\\%$ です。項を増やしても消えません。`]],
            set: A === 1 ? { n: 30 } : undefined,
          };
        }
        const eps = r.pick([0.2, 0.1, 0.05, 0.3, 0.15]);
        let N = 1; while (PI / (2 * N) >= eps) N++;
        return {
          q: [`The first peak of $S_N$ beside the jump is at $x = \\pi/(2N)$. What is the least $N$ for which it lies closer to the jump than $x = ${n(eps)}$?`, `跳躍の隣にある $S_N$ の最初の山は $x = \\pi/(2N)$ にあります。それが $x = ${n(eps)}$ より跳躍に近くなる最小の $N$ はいくつですか。`],
          a: { type: 'int', v: N },
          hint: ['Solve $\\pi/(2N) < \\varepsilon$ for $N$.', '$\\pi/(2N) < \\varepsilon$ を $N$ について解きます。'],
          sol: [[`$\\pi/(2N) < ${n(eps)}$ means $N > \\pi/${n(2 * eps)} = ${n(PI / (2 * eps), 4)}$.`, `$\\pi/(2N) < ${n(eps)}$ は $N > \\pi/${n(2 * eps)} = ${n(PI / (2 * eps), 4)}$ と同値です。`], [`$N = ${N}$. The overshoot gets squeezed toward the jump but keeps its height: in the zoom panel the peak moves left, not down.`, `$N = ${N}$ です。行き過ぎは跳躍の方へ押し込まれますが高さは変わりません。拡大図では山は下ではなく左へ動きます。`]],
          set: N <= 30 ? { n: N } : undefined,
        };
      }
      const which = r.int(0, 2);
      const data = [
        ['\\sum_{k \\text{ odd}} \\tfrac1{k^2}', 'the square wave', '矩形波', PI * PI / 8, '\\tfrac{\\pi^2}{8}', '$\\tfrac1\\pi\\int|f|^2 = 2 = \\tfrac{16}{\\pi^2}\\sum_{k\\text{ odd}}\\tfrac1{k^2}$'],
        ['\\sum_{k \\ge 1} \\tfrac1{k^2}', 'the sawtooth $f(x) = x$', 'のこぎり波 $f(x) = x$', PI * PI / 6, '\\tfrac{\\pi^2}{6}', '$\\tfrac1\\pi\\int_{-\\pi}^{\\pi} x^2\\,dx = \\tfrac{2\\pi^2}{3} = \\sum \\tfrac4{k^2}$'],
        ['\\sum_{k \\ge 1} \\tfrac1{k^4}', '$f(x) = x^2$, with $a_0/2 = \\pi^2/3$ and $a_k = 4(-1)^k/k^2$', '$f(x) = x^2$（$a_0/2 = \\pi^2/3$、$a_k = 4(-1)^k/k^2$）', PI ** 4 / 90, '\\tfrac{\\pi^4}{90}', '$\\tfrac1\\pi\\int_{-\\pi}^{\\pi} x^4\\,dx = \\tfrac{2\\pi^4}{5} = 2\\left(\\tfrac{\\pi^2}3\\right)^2 + \\sum\\tfrac{16}{k^4}$'],
      ][which];
      return {
        q: [`Apply Parseval's identity $\\tfrac1\\pi\\int_{-\\pi}^{\\pi}|f|^2 = \\tfrac{a_0^2}{2} + \\sum (a_k^2 + b_k^2)$ to ${data[1]} on $(-\\pi, \\pi)$ to evaluate $${data[0]}$.`, `パーセバルの等式 $\\tfrac1\\pi\\int_{-\\pi}^{\\pi}|f|^2 = \\tfrac{a_0^2}{2} + \\sum (a_k^2 + b_k^2)$ を $(-\\pi, \\pi)$ 上の${data[2]}に使って、$${data[0]}$ を求めてください。`],
        a: { type: 'num', v: data[3], show: data[4] },
        hint: ['Compute the left side directly and write the right side with the known coefficients; one unknown sum remains.', '左辺を直接計算し、右辺を既知の係数で書きます。未知の和が一つ残ります。'],
        sol: [[`${data[5]}.`, `${data[5]} です。`], [`Solving gives $${data[0]} = ${data[4]} \\approx ${n(data[3], 5)}$.`, `解くと $${data[0]} = ${data[4]} \\approx ${n(data[3], 5)}$ です。`], ['Energy in the function equals energy in its coefficients, so a known integral pins down a sum that is hard to attack directly.', '関数のエネルギーは係数のエネルギーに等しいので、既知の積分から、直接は求めにくい和が決まります。']],
      };
    },
  ];

  /* ---------- 2. convolution ---------- */
  const G = [(s) => clamp(s + 0.5, 0, 1), (s) => clamp(s, 0, 1) ** 2, (s) => (s > 0 ? 1 - Math.exp(-s) : 0)];
  const conv = (shape, t) => G[shape](t + 0.5) - G[shape](t - 0.5);
  Q.convolution = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.step(-1.5, 1.5, 0.05), v = Math.max(0, 1 - Math.abs(t));
        return {
          q: [`$f = g = \\mathbf 1_{[-1/2,\\ 1/2]}$. What is $(f * g)(${n(t)})$?`, `$f = g = \\mathbf 1_{[-1/2,\\ 1/2]}$ のとき、$(f * g)(${n(t)})$ はいくつですか。`],
          a: { type: 'num', v, tol: 1e-6 },
          hint: ['It is the length of the overlap of $[-\\tfrac12, \\tfrac12]$ and $[t - \\tfrac12, t + \\tfrac12]$.', '$[-\\tfrac12, \\tfrac12]$ と $[t - \\tfrac12, t + \\tfrac12]$ の重なりの長さです。'],
          sol: [[`The two unit intervals are shifted by $|t| = ${n(Math.abs(t))}$, so they overlap in length $\\max(0, 1 - ${n(Math.abs(t))})$.`, `二つの単位区間は $|t| = ${n(Math.abs(t))}$ ずれているので、重なりの長さは $\\max(0, 1 - ${n(Math.abs(t))})$ です。`], [`$(f * g)(${n(t)}) = ${n(v)}$, a point on the triangle $\\max(0, 1 - |t|)$.`, `$(f * g)(${n(t)}) = ${n(v)}$ で、三角形 $\\max(0, 1 - |t|)$ 上の点です。`]],
          set: { t, shape: 0 },
        };
      }
      if (form === 1) {
        const a = r.int(-3, 1), b = a + r.int(1, 4), c = r.int(-2, 2), d = c + r.int(1, 3);
        return {
          q: [`$f$ vanishes outside $[${a}, ${b}]$ and $g$ outside $[${c}, ${d}]$. On which interval can $f * g$ be non-zero?`, `$f$ は $[${a}, ${b}]$ の外で、$g$ は $[${c}, ${d}]$ の外で 0 です。$f * g$ が 0 でないことがありうるのはどの区間ですか。`],
          a: { type: 'tuple', v: [a + c, b + d], labels: [['left end', '左端'], ['right end', '右端']], tol: 1e-9 },
          hint: ['$f(\\tau)g(t - \\tau) \\ne 0$ needs $\\tau$ in the first interval and $t - \\tau$ in the second.', '$f(\\tau)g(t - \\tau) \\ne 0$ には、$\\tau$ が一つ目の区間に、$t - \\tau$ が二つ目の区間に入る必要があります。'],
          sol: [[`Then $t = \\tau + (t - \\tau)$ ranges over $[${a} + ${c < 0 ? `(${c})` : c},\\ ${b} + ${d}]$.`, `すると $t = \\tau + (t - \\tau)$ は $[${a} + ${c < 0 ? `(${c})` : c},\\ ${b} + ${d}]$ を動きます。`], [`Support $[${a + c}, ${b + d}]$, of width $${b - a} + ${d - c} = ${b - a + d - c}$: convolution adds supports, so it always smears.`, `台は $[${a + c}, ${b + d}]$ で幅は $${b - a} + ${d - c} = ${b - a + d - c}$ です。畳み込みは台を足し合わせるので、必ずぼかします。`]],
        };
      }
      const A = r.pick([1, 2, 0.5, 3]), B = r.pick([1, 2, 0.5, 4, 1.5]);
      return {
        q: [`$\\int f = ${n(A)}$ and $\\int g = ${n(B)}$. What is $\\int (f * g)$?`, `$\\int f = ${n(A)}$、$\\int g = ${n(B)}$ のとき、$\\int (f * g)$ はいくつですか。`],
        a: { type: 'num', v: A * B },
        hint: ['Swap the order of integration (Fubini).', '積分の順序を入れ替えます（フビニの定理）。'],
        sol: [['$\\int\\!\\int f(\\tau)g(t - \\tau)\\,d\\tau\\,dt = \\int f(\\tau)\\left(\\int g(t - \\tau)\\,dt\\right)d\\tau = \\int f\\cdot\\int g$.', '$\\int\\!\\int f(\\tau)g(t - \\tau)\\,d\\tau\\,dt = \\int f(\\tau)\\left(\\int g(t - \\tau)\\,dt\\right)d\\tau = \\int f\\cdot\\int g$ です。'], [`$= ${n(A)}\\cdot ${n(B)} = ${n(A * B)}$. A blur with a kernel of total weight $1$ moves mass around but never creates or destroys it.`, `$= ${n(A)}\\cdot ${n(B)} = ${n(A * B)}$ です。総重み $1$ の核でぼかしても、質量は移動するだけで増えも減りもしません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.step(-0.45, 1.45, 0.05), v = conv(1, t);
        const lo = clamp(t - 0.5, 0, 1), hi = clamp(t + 0.5, 0, 1);
        return {
          q: [`$f$ is the unit pulse on $[-\\tfrac12, \\tfrac12]$ and $g(s) = 2s$ on $[0, 1]$ (zero elsewhere). Compute $(f * g)(${n(t)})$.`, `$f$ は $[-\\tfrac12, \\tfrac12]$ 上の単位パルス、$g(s) = 2s$（$[0, 1]$ 上、他では 0）です。$(f * g)(${n(t)})$ を計算してください。`],
          a: { type: 'num', v, tol: 1e-4 },
          hint: ['$(f * g)(t) = \\int_{t-1/2}^{t+1/2} g(s)\\,ds$: integrate $g$ over a window of width $1$ centred at $t$.', '$(f * g)(t) = \\int_{t-1/2}^{t+1/2} g(s)\\,ds$ で、$t$ を中心とする幅 $1$ の窓で $g$ を積分します。'],
          sol: [[`The window $[${n(t - 0.5)}, ${n(t + 0.5)}]$ meets $[0, 1]$ in $[${n(lo)}, ${n(hi)}]$.`, `窓 $[${n(t - 0.5)}, ${n(t + 0.5)}]$ と $[0, 1]$ の共通部分は $[${n(lo)}, ${n(hi)}]$ です。`], [`$\\int_{${n(lo)}}^{${n(hi)}} 2s\\,ds = ${n(hi)}^2 - ${n(lo)}^2 = ${n(v, 5)}$.`, `$\\int_{${n(lo)}}^{${n(hi)}} 2s\\,ds = ${n(hi)}^2 - ${n(lo)}^2 = ${n(v, 5)}$ です。`], ['Sliding the window is the same as sliding the reflected ramp across the pulse: the shaded area in the figure.', '窓を動かすことは、反転した傾斜をパルスの上で動かすことと同じで、図の塗られた面積です。']],
          set: { t, shape: 1 },
        };
      }
      if (form === 1) {
        const t = r.step(-0.45, 2.5, 0.05), v = conv(2, t);
        return {
          q: [`$f$ is the unit pulse on $[-\\tfrac12, \\tfrac12]$ and $g(s) = e^{-s}$ for $s \\ge 0$ (zero for $s < 0$). Compute $(f * g)(${n(t)})$. Give four decimals.`, `$f$ は $[-\\tfrac12, \\tfrac12]$ 上の単位パルス、$g(s) = e^{-s}$（$s \\ge 0$、$s < 0$ では 0）です。$(f * g)(${n(t)})$ を計算してください（小数第4位まで）。`],
          a: { type: 'num', v, tol: 6e-5 },
          hint: ['$(f * g)(t) = \\int_{\\max(0,\\,t - 1/2)}^{t + 1/2} e^{-s}\\,ds$.', '$(f * g)(t) = \\int_{\\max(0,\\,t - 1/2)}^{t + 1/2} e^{-s}\\,ds$ です。'],
          sol: [[t <= 0.5 ? `The window starts before $0$, so $(f * g)(t) = \\int_0^{${n(t + 0.5)}} e^{-s}\\,ds = 1 - e^{-${n(t + 0.5)}}$.` : `The whole window is in $s \\ge 0$: $\\int_{${n(t - 0.5)}}^{${n(t + 0.5)}} e^{-s}\\,ds = e^{-${n(t - 0.5)}} - e^{-${n(t + 0.5)}}$.`, t <= 0.5 ? `窓は 0 より前から始まるので $(f * g)(t) = \\int_0^{${n(t + 0.5)}} e^{-s}\\,ds = 1 - e^{-${n(t + 0.5)}}$ です。` : `窓全体が $s \\ge 0$ にあるので $\\int_{${n(t - 0.5)}}^{${n(t + 0.5)}} e^{-s}\\,ds = e^{-${n(t - 0.5)}} - e^{-${n(t + 0.5)}}$ です。`], [`$= ${n(v, 5)}$. ${t <= 0.5 ? 'The output is still rising: the pulse is being absorbed.' : 'The output decays: after the pulse ends only the memory of the kernel remains.'}`, `$= ${n(v, 5)}$ です。${t <= 0.5 ? '出力はまだ増えています。パルスを取り込んでいる途中です。' : '出力は減衰します。パルスが終わった後は核の記憶だけが残ります。'}`]],
          set: { t, shape: 2 },
        };
      }
      const pair = r.pick([[3, 4], [6, 8], [5, 12], [0.6, 0.8], [1.5, 2], [9, 12], [8, 15]]);
      const s = Math.hypot(...pair), ctx = r.int(0, 1);
      return {
        q: [ctx ? `A camera lens blurs with a Gaussian of standard deviation $${n(pair[0])}$ pixels, and the sensor adds a Gaussian blur of $${n(pair[1])}$ pixels. What is the standard deviation of the combined blur?` : `Two independent timing jitters, Gaussian with standard deviations $${n(pair[0])}$ ns and $${n(pair[1])}$ ns, add up. The density of the total is the convolution. What is its standard deviation?`, ctx ? `カメラのレンズが標準偏差 $${n(pair[0])}$ 画素のガウスぼけを生じ、センサーがさらに $${n(pair[1])}$ 画素のガウスぼけを加えます。合成したぼけの標準偏差はいくつですか。` : `標準偏差 $${n(pair[0])}$ ns と $${n(pair[1])}$ ns の独立なガウス型の時間揺らぎが足し合わされます。合計の密度は畳み込みです。その標準偏差はいくつですか。`],
        a: { type: 'num', v: s, unit: ctx ? ['px', '画素'] : ['ns', 'ns'] },
        hint: ['Under convolution, variances add (the Fourier transforms multiply, and the exponents add).', '畳み込みでは分散が足されます（フーリエ変換が掛け合わされ、指数が足されるためです）。'],
        sol: [[`$\\sigma^2 = ${n(pair[0])}^2 + ${n(pair[1])}^2 = ${n(s * s)}$.`, `$\\sigma^2 = ${n(pair[0])}^2 + ${n(pair[1])}^2 = ${n(s * s)}$ です。`], [`$\\sigma = ${n(s)}$, not $${n(pair[0] + pair[1])}$: widths add in quadrature, so the larger blur dominates.`, `$\\sigma = ${n(s)}$ で、$${n(pair[0] + pair[1])}$ ではありません。幅は二乗和で合成されるので、大きい方のぼけが支配的です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2);
        const spec = [
          ['$g(s) = 2s$ on $[0, 1]$', '$[0, 1]$ 上の $g(s) = 2s$', '\\tfrac12 \\le t \\le \\tfrac32', '1-(t-1/2)^2', [0.55, 1.45], 1, 'The window covers $[t - \\tfrac12, 1]$, so $\\int_{t-1/2}^{1} 2s\\,ds = 1 - (t - \\tfrac12)^2$.', '窓は $[t - \\tfrac12, 1]$ を覆うので $\\int_{t-1/2}^{1} 2s\\,ds = 1 - (t - \\tfrac12)^2$ です。'],
          ['$g(s) = 2s$ on $[0, 1]$', '$[0, 1]$ 上の $g(s) = 2s$', '-\\tfrac12 \\le t \\le \\tfrac12', '(t+1/2)^2', [-0.45, 0.45], 1, 'The window covers $[0, t + \\tfrac12]$, so $\\int_0^{t+1/2} 2s\\,ds = (t + \\tfrac12)^2$.', '窓は $[0, t + \\tfrac12]$ を覆うので $\\int_0^{t+1/2} 2s\\,ds = (t + \\tfrac12)^2$ です。'],
          ['$g(s) = e^{-s}$ for $s \\ge 0$', '$s \\ge 0$ で $g(s) = e^{-s}$', 't \\ge \\tfrac12', 'exp(-(t-1/2))-exp(-(t+1/2))', [0.55, 2.4], 2, 'The window lies in $s \\ge 0$: $\\int_{t-1/2}^{t+1/2} e^{-s}\\,ds = e^{-(t-1/2)} - e^{-(t+1/2)} = 2\\sinh(\\tfrac12)\\,e^{-t}$.', '窓は $s \\ge 0$ にあるので $\\int_{t-1/2}^{t+1/2} e^{-s}\\,ds = e^{-(t-1/2)} - e^{-(t+1/2)} = 2\\sinh(\\tfrac12)\\,e^{-t}$ です。'],
        ][kind];
        return {
          q: [`$f$ is the unit pulse on $[-\\tfrac12, \\tfrac12]$ and ${spec[0]}. Write $(f * g)(t)$ for $${spec[2]}$.`, `$f$ は $[-\\tfrac12, \\tfrac12]$ 上の単位パルス、$g$ は${spec[1]}です。$${spec[2]}$ での $(f * g)(t)$ を書いてください。`],
          a: { type: 'expr', v: spec[3], vars: ['t'], dom: { t: spec[4] }, lhs: ['$(f * g)(t) =$', '$(f * g)(t) =$'] },
          hint: ['$(f * g)(t) = \\int_{t-1/2}^{t+1/2} g(s)\\,ds$; find which part of the window meets the support of $g$.', '$(f * g)(t) = \\int_{t-1/2}^{t+1/2} g(s)\\,ds$ です。窓のどの部分が $g$ の台と重なるかを調べます。'],
          sol: [[spec[6], spec[7]], [kind === 2 ? 'A pure exponential tail: once the input is over, the output decays at the kernel\'s own rate.' : kind === 0 ? 'A downward parabola: the window is sliding off the steep end of the ramp.' : 'An upward parabola: the window is sliding onto the ramp\'s gentle end.', kind === 2 ? '純粋な指数関数の尾です。入力が終わると、出力は核自身の速さで減衰します。' : kind === 0 ? '上に凸の放物線です。窓が傾斜の急な端から外れていく段階です。' : '下に凸の放物線です。窓が傾斜のゆるやかな端に乗っていく段階です。']],
          set: { t: kind === 1 ? 0 : 1, shape: spec[5] },
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 0.5, 3, 1.5]);
        const peak = 1 - Math.exp(-a);
        return {
          q: [`$f$ is the unit pulse on $[-\\tfrac12, \\tfrac12]$ and $g(s) = ${a === 1 ? '' : n(a)}e^{-${a === 1 ? '' : n(a)}s}$ for $s \\ge 0$. Where is $f * g$ largest, and what is its maximum value?`, `$f$ は $[-\\tfrac12, \\tfrac12]$ 上の単位パルス、$s \\ge 0$ で $g(s) = ${a === 1 ? '' : n(a)}e^{-${a === 1 ? '' : n(a)}s}$ です。$f * g$ が最大になる位置と最大値を求めてください。`],
          a: { type: 'tuple', v: [0.5, peak], labels: ['$t^*$', '$\\max$'], tol: 2e-4 },
          hint: ['Before the pulse ends the window still collects new input; after it, it only loses.', 'パルスが終わるまでは窓は新しい入力を取り込み、その後は失うだけです。'],
          sol: [[`For $-\\tfrac12 \\le t \\le \\tfrac12$: $(f * g)(t) = 1 - e^{-${n(a)}(t + 1/2)}$, increasing.`, `$-\\tfrac12 \\le t \\le \\tfrac12$ では $(f * g)(t) = 1 - e^{-${n(a)}(t + 1/2)}$ で、増加します。`], [`For $t \\ge \\tfrac12$: $e^{-${n(a)}(t - 1/2)} - e^{-${n(a)}(t + 1/2)} = (1 - e^{-${n(a)}})e^{-${n(a)}(t - 1/2)}$, decreasing.`, `$t \\ge \\tfrac12$ では $e^{-${n(a)}(t - 1/2)} - e^{-${n(a)}(t + 1/2)} = (1 - e^{-${n(a)}})e^{-${n(a)}(t - 1/2)}$ で、減少します。`], [`So the peak is at $t^* = \\tfrac12$, the end of the pulse, with value $1 - e^{-${n(a)}} = ${n(peak, 4)}$. A slow kernel (small rate) responds late and weakly: low-pass filtering.`, `したがって山はパルスの終わり $t^* = \\tfrac12$ にあり、値は $1 - e^{-${n(a)}} = ${n(peak, 4)}$ です。遅い核（小さい率）は遅れて弱く反応します。低域通過フィルタです。`]],
          set: a === 1 ? { t: 0.5, shape: 2 } : undefined,
        };
      }
      const xi = r.pick([0.25, 0.5, 0.75, 1.5, 1.25, 2, 1]);
      const s = Math.sin(PI * xi) / (PI * xi), v = s * s;
      return {
        q: [`With $\\hat h(\\xi) = \\int h(t)e^{-2\\pi i\\xi t}\\,dt$, the unit pulse has $\\hat f(\\xi) = \\dfrac{\\sin\\pi\\xi}{\\pi\\xi}$. What is the transform of the triangle $f * f = \\max(0, 1 - |t|)$ at $\\xi = ${n(xi)}$?`, `$\\hat h(\\xi) = \\int h(t)e^{-2\\pi i\\xi t}\\,dt$ とすると、単位パルスは $\\hat f(\\xi) = \\dfrac{\\sin\\pi\\xi}{\\pi\\xi}$ です。三角形 $f * f = \\max(0, 1 - |t|)$ の変換の $\\xi = ${n(xi)}$ での値はいくつですか。`],
        a: { type: 'num', v, tol: Number.isInteger(xi) ? 1e-9 : undefined },
        hint: ['The convolution theorem: $\\widehat{f * g} = \\hat f\\,\\hat g$.', '畳み込み定理 $\\widehat{f * g} = \\hat f\\,\\hat g$ を使います。'],
        sol: [[`$\\widehat{f * f}(\\xi) = \\hat f(\\xi)^2 = \\left(\\dfrac{\\sin ${n(xi)}\\pi}{${n(xi)}\\pi}\\right)^2$.`, `$\\widehat{f * f}(\\xi) = \\hat f(\\xi)^2 = \\left(\\dfrac{\\sin ${n(xi)}\\pi}{${n(xi)}\\pi}\\right)^2$ です。`], [`$= ${n(v, 5)}$. ${Number.isInteger(xi) ? 'At integer $\\xi$ it vanishes: the triangle has no energy at those frequencies.' : 'Squaring makes it non-negative and decay like $1/\\xi^2$: the triangle is smoother than the pulse, so its spectrum dies faster.'}`, `$= ${n(v, 5)}$ です。${Number.isInteger(xi) ? '整数の $\\xi$ では 0 になり、三角形はその周波数にエネルギーをもちません。' : '2乗により非負になり、$1/\\xi^2$ のように減衰します。三角形はパルスより滑らかなので、スペクトルが速く消えます。'}`]],
      };
    },
  ];

  /* ---------- 3. sampling and aliasing ---------- */
  const alias = (f, fs) => Math.abs((((f + fs / 2) % fs) + fs) % fs - fs / 2);
  Q.sampling = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const cases = [['human hearing, up to', '人間の可聴域の上限', 20, 'kHz'], ['telephone speech, up to', '電話音声の上限', 3.4, 'kHz'], ['an ECG, up to', '心電図の上限', 150, 'Hz'], ['ultrasound imaging at', '超音波画像の', 5, 'MHz'], ['a signal at', '信号の周波数', null, 'Hz']];
        const c = r.pick(cases);
        const B = c[2] ?? r.step(1, 12, 0.5);
        return {
          q: [`A signal is band-limited to ${c[0]} $${n(B)}$ ${c[3]}. What is the Nyquist rate, the sampling rate the theorem requires you to exceed?`, `${c[1]} $${n(B)}$ ${c[3]} に帯域制限された信号があります。ナイキスト・レート（定理が上回ることを要求する標本化周波数）はいくつですか。`],
          a: { type: 'num', v: 2 * B, unit: [c[3], c[3]] },
          hint: ['Twice the highest frequency present.', '含まれる最高周波数の2倍です。'],
          sol: [[`$2 \\times ${n(B)} = ${n(2 * B)}$ ${c[3]}.`, `$2 \\times ${n(B)} = ${n(2 * B)}$ ${c[3]} です。`], [`Sampling strictly faster than $${n(2 * B)}$ ${c[3]} determines the signal; in practice a margin is left for the anti-aliasing filter (CD audio uses 44.1 kHz for 20 kHz).`, `$${n(2 * B)}$ ${c[3]} より真に速く標本化すれば信号は決まります。実際には折り返し防止フィルタのために余裕をとります（CD は 20 kHz に対して 44.1 kHz です）。`]],
          set: c[2] === null && 2 * B + 1 <= 30 ? { f: B, fs: 2 * B + 1 } : undefined,
        };
      }
      const cases = [[44.1, 'kHz', 'CD audio', 'CD の音声'], [48, 'kHz', 'professional video sound', '業務用の映像音声'], [8, 'kHz', 'telephony', '電話'], [96, 'kHz', 'high-resolution audio', 'ハイレゾ音声'], [null, 'Hz', 'the lab', 'この実験']];
      const c = r.pick(cases);
      const fs = c[0] ?? r.int(2, 30);
      return {
        q: [`${c[2] === 'the lab' ? 'In the lab' : `In ${c[2]}`} the sampling rate is $${n(fs)}$ ${c[1]}. What is the Nyquist frequency, the highest frequency that is represented without folding?`, `${c[3]}の標本化周波数は $${n(fs)}$ ${c[1]} です。ナイキスト周波数（折り返さずに表せる最高周波数）はいくつですか。`],
        a: { type: 'num', v: fs / 2, unit: [c[1], c[1]] },
        hint: ['Half the sampling rate.', '標本化周波数の半分です。'],
        sol: [[`$f_s/2 = ${n(fs)}/2 = ${n(fs / 2)}$ ${c[1]}.`, `$f_s/2 = ${n(fs)}/2 = ${n(fs / 2)}$ ${c[1]} です。`], ['Anything above it folds back into $[0, f_s/2]$ and is indistinguishable from a lower frequency.', 'これを超える成分は $[0, f_s/2]$ に折り返され、低い周波数と区別できません。']],
        set: c[0] === null ? { fs, f: Math.min(12, Math.max(1, Math.round(fs / 2))) } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let f, fs; do { f = r.step(1, 12, 0.5); fs = r.int(3, 20); } while (f <= fs / 2 || Math.abs(f - fs / 2) < 1e-9);
        const a = alias(f, fs);
        return {
          q: [`A $${n(f)}$ Hz cosine is sampled at $${fs}$ Hz. At what frequency in $[0, f_s/2]$ does it appear?`, `$${n(f)}$ Hz の余弦波を $${fs}$ Hz で標本化します。$[0, f_s/2]$ のどの周波数に見えますか。`],
          a: { type: 'num', v: a, tol: 1e-6, unit: ['Hz', 'Hz'] },
          hint: ['Subtract the nearest multiple of $f_s$ and take the absolute value.', '最も近い $f_s$ の倍数を引き、絶対値をとります。'],
          sol: [[`The nearest multiple of $${fs}$ to $${n(f)}$ is $${Math.round(f / fs) * fs}$.`, `$${n(f)}$ に最も近い $${fs}$ の倍数は $${Math.round(f / fs) * fs}$ です。`], [`$|${n(f)} - ${Math.round(f / fs) * fs}| = ${n(a)}$ Hz: the samples of the two cosines agree exactly, because $\\cos(2\\pi f n/f_s)$ only depends on $f$ modulo $f_s$ and on its sign.`, `$|${n(f)} - ${Math.round(f / fs) * fs}| = ${n(a)}$ Hz です。$\\cos(2\\pi f n/f_s)$ は $f$ を $f_s$ で割った余りと符号にしかよらないので、二つの余弦波の標本は完全に一致します。`]],
          set: { f, fs },
        };
      }
      if (form === 1) {
        const c = r.pick([[48, 30, 'kHz'], [44.1, 25, 'kHz'], [60, 50, 'Hz'], [8, 5, 'kHz'], [24, 25, 'Hz'], [1000, 1150, 'Hz'], [96, 70, 'kHz']]);
        const a = alias(c[1], c[0]);
        return {
          q: [`A $${n(c[1])}$ ${c[2]} tone reaches a converter sampling at $${n(c[0])}$ ${c[2]} with no anti-aliasing filter. At what frequency does it show up?`, `折り返し防止フィルタのない、$${n(c[0])}$ ${c[2]} で標本化する変換器に $${n(c[1])}$ ${c[2]} の音が入ります。どの周波数に現れますか。`],
          a: { type: 'num', v: a, unit: [c[2], c[2]] },
          hint: ['Fold the frequency into $[0, f_s/2]$.', '周波数を $[0, f_s/2]$ に折り返します。'],
          sol: [[`$f_s/2 = ${n(c[0] / 2)}$ ${c[2]}, and $${n(c[1])}$ ${c[2]} is above it.`, `$f_s/2 = ${n(c[0] / 2)}$ ${c[2]} で、$${n(c[1])}$ ${c[2]} はそれより上です。`], [`$|${n(c[1])} - ${n(Math.round(c[1] / c[0]) * c[0])}| = ${n(a)}$ ${c[2]}. The alias is a genuine tone in the recording; no later processing can tell it from a real one, which is why the filter must come before the sampler.`, `$|${n(c[1])} - ${n(Math.round(c[1] / c[0]) * c[0])}| = ${n(a)}$ ${c[2]} です。エイリアスは録音の中では本物の音であり、後の処理では区別できません。だからフィルタは標本化の前に置く必要があります。`]],
        };
      }
      const f = r.step(1, 12, 0.5), fs = r.int(2, 30), k = r.int(1, 6);
      const x = Math.cos(2 * PI * f * k / fs);
      return {
        q: [`Sample $\\cos(2\\pi f t)$ with $f = ${n(f)}$ Hz at $f_s = ${fs}$ Hz. What is the sample $x_{${k}} = \\cos(2\\pi f\\cdot ${k}/f_s)$? Give three decimals.`, `$f = ${n(f)}$ Hz の $\\cos(2\\pi f t)$ を $f_s = ${fs}$ Hz で標本化します。標本 $x_{${k}} = \\cos(2\\pi f\\cdot ${k}/f_s)$ はいくつですか（小数第3位まで）。`],
        a: { type: 'num', v: x, tol: 6e-4 },
        hint: ['The phase advances by $2\\pi f/f_s$ per sample.', '標本ごとに位相は $2\\pi f/f_s$ ずつ進みます。'],
        sol: [[`Phase per sample $2\\pi\\cdot ${n(f)}/${fs}$, so $x_{${k}} = \\cos(2\\pi\\cdot ${n(f * k / fs, 4)})$.`, `標本ごとの位相は $2\\pi\\cdot ${n(f)}/${fs}$ なので $x_{${k}} = \\cos(2\\pi\\cdot ${n(f * k / fs, 4)})$ です。`], [`$x_{${k}} = ${n(x, 4)}$. Only the fractional part of $${n(f * k / fs, 4)}$ matters: that is why frequencies differing by $f_s$ give identical samples.`, `$x_{${k}} = ${n(x, 4)}$ です。効くのは $${n(f * k / fs, 4)}$ の小数部分だけです。$f_s$ だけ異なる周波数が同じ標本を与えるのはこのためです。`]],
        set: { f, fs },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let f, fs; do { f = r.step(3, 12, 0.5); fs = r.int(Math.floor(f) + 1, Math.ceil(2 * f) - 1); } while (!(fs > f && fs < 2 * f) || fs > 30);
        const a = fs - f;
        return {
          q: [`A $${n(f)}$ Hz cosine is sampled at an unknown rate between $${n(f)}$ and $${n(2 * f)}$ Hz, and the samples look like a $${n(a)}$ Hz cosine. What is the sampling rate?`, `$${n(f)}$ Hz の余弦波を $${n(f)}$ から $${n(2 * f)}$ Hz の間の未知の周波数で標本化したところ、標本は $${n(a)}$ Hz の余弦波に見えました。標本化周波数はいくつですか。`],
          a: { type: 'num', v: fs, tol: 1e-6, unit: ['Hz', 'Hz'] },
          hint: ['With $f_s/2 < f < f_s$ the nearest copy is $f_s - f$.', '$f_s/2 < f < f_s$ では最も近い複製は $f_s - f$ です。'],
          sol: [[`In this range $f$ lies between $f_s/2$ and $f_s$, so it folds to $f_s - f$.`, `この範囲では $f$ は $f_s/2$ と $f_s$ の間にあるので、$f_s - f$ に折り返されます。`], [`$f_s - ${n(f)} = ${n(a)}$ gives $f_s = ${fs}$ Hz. Without the range there would be other answers, such as $f_s = ${n(f + a)}/k$ or $(${n(f)} - ${n(a)})/k$ for other $k$: one alias does not identify the rate.`, `$f_s - ${n(f)} = ${n(a)}$ より $f_s = ${fs}$ Hz です。範囲の条件がなければ、別の $k$ に対する $f_s = ${n(f + a)}/k$ や $(${n(f)} - ${n(a)})/k$ のような答えもあります。エイリアス一つでは標本化周波数は決まりません。`]],
          set: { f, fs },
        };
      }
      if (form === 1) {
        const fs = r.int(4, 12), f2 = r.int(1, fs - 1), F = r.pick([20, 30, 40, 50]);
        const f = f2 === fs / 2 ? f2 + 0.5 : f2 / 1;
        const set = new Set();
        for (let k = 0; k * fs <= F + f; k++) for (const s of [-1, 1]) { const x = k * fs + s * f; if (x > 1e-9 && x <= F + 1e-9) set.add(Math.round(x * 2)); }
        const list = [...set].sort((a, b) => a - b).map((x) => x / 2);
        return {
          q: [`Sampling at $${fs}$ Hz, how many cosine frequencies in $(0, ${F}]$ Hz (including $${n(f)}$ Hz itself) give exactly the same samples as a $${n(f)}$ Hz cosine?`, `$${fs}$ Hz で標本化するとき、$(0, ${F}]$ Hz の余弦波の周波数のうち、$${n(f)}$ Hz の余弦波とまったく同じ標本を与えるものは（$${n(f)}$ Hz 自身を含めて）いくつありますか。`],
          a: { type: 'int', v: list.length },
          hint: ['The copies sit at $k f_s \\pm f$ for every integer $k \\ge 0$.', '複製はすべての整数 $k \\ge 0$ について $k f_s \\pm f$ にあります。'],
          sol: [[`List $k\\cdot ${fs} \\pm ${n(f)}$ in $(0, ${F}]$: $${list.map((x) => n(x)).join(',\\ ')}$.`, `$(0, ${F}]$ 内の $k\\cdot ${fs} \\pm ${n(f)}$ を並べると $${list.map((x) => n(x)).join(',\\ ')}$ です。`], [`That is $${list.length}$ frequencies, all indistinguishable after sampling. The lower panel draws exactly these copies; only one of them lies in the visible band.`, `全部で $${list.length}$ 個で、標本化の後はどれも区別できません。下の図はちょうどこれらの複製を描いており、見える帯域に入るのはそのうち一つだけです。`]],
          set: f <= 12 ? { f, fs } : undefined,
        };
      }
      const f = r.step(1, 12, 0.5), phi = r.pick([0, 30, 45, 60, 90, 20]);
      const amp = Math.abs(Math.sin(phi * PI / 180));
      return {
        q: [`$\\sin(2\\pi f t + ${phi}^\\circ)$ with $f = ${n(f)}$ Hz is sampled at exactly $f_s = 2f = ${n(2 * f)}$ Hz, starting at $t = 0$. What amplitude do the samples show?`, `$f = ${n(f)}$ Hz の $\\sin(2\\pi f t + ${phi}^\\circ)$ を、ちょうど $f_s = 2f = ${n(2 * f)}$ Hz で $t = 0$ から標本化します。標本に現れる振幅はいくつですか。`],
        a: { type: 'num', v: amp, tol: 6e-4 },
        hint: ['At $t = n/(2f)$ the phase is $\\pi n + \\varphi$.', '$t = n/(2f)$ では位相は $\\pi n + \\varphi$ です。'],
        sol: [[`$x_n = \\sin(\\pi n + ${phi}^\\circ) = (-1)^n\\sin ${phi}^\\circ$.`, `$x_n = \\sin(\\pi n + ${phi}^\\circ) = (-1)^n\\sin ${phi}^\\circ$ です。`], [`The samples alternate $\\pm${n(amp, 4)}$, so the apparent amplitude is $${n(amp, 4)}$ instead of $1$${phi === 0 ? ': the samples are all zero and the signal vanishes' : ''}.`, `標本は $\\pm${n(amp, 4)}$ を交互にとるので、見かけの振幅は $1$ ではなく $${n(amp, 4)}$ です${phi === 0 ? '。標本はすべて 0 で、信号は消えてしまいます' : ''}。`], ['Amplitude and phase cannot be separated at exactly $f_s = 2f$, which is why the sampling theorem needs a strict inequality.', 'ちょうど $f_s = 2f$ では振幅と位相を分けられません。標本化定理が真の不等号を必要とするのはこのためです。']],
        set: { f, fs: 2 * f },
      };
    },
  ];
})();
