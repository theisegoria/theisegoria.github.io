'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const Phi = (z) => { const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x); const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e); };
  // inverse normal CDF by bisection on Phi (ample for two to four decimals)
  const probit = (p) => { let lo = -9, hi = 9; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  // Student t CDF through the regularized incomplete beta function
  const lgamma = (x) => { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let s = 1.000000000190015; for (const k of g) s += k / ++y; return -tmp + Math.log(2.5066282746310005 * s / x); };
  function betacf(a, b, x) { let c = 1, d = 1 - (a + b) * x / (a + 1); d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2)); d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; h *= d * c; aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1)); d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-30 ? 1e-30 : d); c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break; } return h; }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const tcdf = (t, nu) => { const x = nu / (nu + t * t), p = 0.5 * ibeta(x, nu / 2, 0.5); return t > 0 ? 1 - p : p; };
  const tquant = (p, nu) => { let lo = -60, hi = 60; for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (tcdf(m, nu) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  const pc = (x) => n(Math.round(x * 100));
  const an = (x) => (String(Math.round(x * 100))[0] === '8' ? 'an' : 'a');
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const LEVELS = [0.8, 0.85, 0.9, 0.95, 0.98, 0.99];

  /* ---------- 1. sampling distribution of the mean ---------- */
  Q.mean = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.int(4, 100), s = r.step(0.5, 3, 0.1), se = s / Math.sqrt(N);
        return {
          q: [`A population has standard deviation $\\sigma = ${n(s)}$. What is the standard error of the mean of a sample of $n = ${N}$? Three decimals.`, `母標準偏差が $\\sigma = ${n(s)}$ の母集団から大きさ $n = ${N}$ の標本をとります。標本平均の標準誤差を小数第3位まで求めてください。`],
          a: { type: 'num', v: se, tol: 6e-4 },
          hint: ['The variance of a mean of $n$ independent draws is $\\sigma^2/n$.', '独立な $n$ 個の平均の分散は $\\sigma^2/n$ です。'],
          sol: [[`$\\operatorname{SE} = \\sigma/\\sqrt n = ${n(s)}/\\sqrt{${N}} = ${n(s)}/${n(Math.sqrt(N), 4)} = ${n(se, 4)}$.`, `$\\operatorname{SE} = \\sigma/\\sqrt n = ${n(s)}/\\sqrt{${N}} = ${n(s)}/${n(Math.sqrt(N), 4)} = ${n(se, 4)}$ です。`], ['It is the width of the histogram of means in the lower panel, compared with the population curve above it.', 'これは下の図の平均のヒストグラムの幅で、上の母集団の曲線の幅と比べられます。']],
          set: { n: N, sigma: s },
        };
      }
      if (kind === 1) {
        const k = r.int(2, 6);
        return {
          q: [`By what factor must the sample size grow to make the standard error of the mean ${k} times smaller?`, `標本平均の標準誤差を ${k} 分の1にするには、標本サイズを何倍にする必要がありますか。`],
          a: { type: 'int', v: k * k },
          hint: ['The standard error is proportional to $1/\\sqrt n$.', '標準誤差は $1/\\sqrt n$ に比例します。'],
          sol: [[`$\\sigma/\\sqrt{cn} = \\sigma/(k\\sqrt n)$ needs $\\sqrt c = ${k}$.`, `$\\sigma/\\sqrt{cn} = \\sigma/(k\\sqrt n)$ となるには $\\sqrt c = ${k}$ が必要です。`], [`So $c = ${k}^2 = ${k * k}$: precision is expensive, each extra digit costs a hundredfold more data.`, `したがって $c = ${k}^2 = ${k * k}$ です。精度は高くつき、1桁上げるには100倍のデータが要ります。`]],
          set: { n: Math.min(100, 4 * k * k) },
        };
      }
      const [N0, N] = r.pick([[4, 16], [9, 36], [16, 64], [25, 100], [5, 20], [10, 40], [20, 80]]), s = r.step(1, 3, 0.5);
      return {
        q: [`Samples of size $n$ are drawn from a population with $\\sigma = ${n(s)}$. If $n$ goes from ${N0} to ${N}, what happens?`, `$\\sigma = ${n(s)}$ の母集団から大きさ $n$ の標本を引きます。$n$ を ${N0} から ${N} に増やすとどうなりますか。`],
        a: { type: 'choice', opts: [['The sample means spread less; the population and each sample keep the same spread.', '標本平均のばらつきが小さくなります。母集団や各標本のばらつきは変わりません。'], ['The population becomes less spread out.', '母集団のばらつきが小さくなります。'], ['Each individual observation becomes closer to the mean.', '個々の観測値が平均に近づきます。'], ['Nothing changes, because $\\sigma$ is fixed.', '$\\sigma$ が固定なので何も変わりません。']], v: 0 },
        hint: ['Which of the two panels does $n$ act on?', '$n$ が影響するのは2つの図のどちらでしょうか。'],
        sol: [[`$\\sigma = ${n(s)}$ describes the population and does not depend on $n$.`, `$\\sigma = ${n(s)}$ は母集団の性質で、$n$ によりません。`], [`The spread of $\\bar X$ is $\\sigma/\\sqrt n$, which goes from $${n(s / Math.sqrt(N0), 4)}$ to $${n(s / Math.sqrt(N), 4)}$.`, `$\\bar X$ のばらつきは $\\sigma/\\sqrt n$ で、$${n(s / Math.sqrt(N0), 4)}$ から $${n(s / Math.sqrt(N), 4)}$ になります。`]],
        set: { n: N, sigma: s },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.int(9, 100), s = r.step(0.5, 3, 0.1), se = s / Math.sqrt(N), d = Number((r.real(0.6, 2.2) * se).toFixed(2)), z = d / se, v = 2 * Phi(z) - 1;
        return {
          q: [`A normal population has $\\sigma = ${n(s)}$. For a sample of $n = ${N}$, what is the probability that $\\bar X$ lands within $${n(d)}$ of the true mean? Three decimals.`, `$\\sigma = ${n(s)}$ の正規母集団から $n = ${N}$ の標本をとります。$\\bar X$ が真の平均から $${n(d)}$ 以内に入る確率を小数第3位まで求めてください。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['Standardize the distance by the standard error, not by $\\sigma$.', '距離は $\\sigma$ ではなく標準誤差で標準化します。'],
          sol: [[`$\\operatorname{SE} = ${n(s)}/\\sqrt{${N}} = ${n(se, 4)}$, so the window is $\\pm${n(z, 3)}$ standard errors.`, `$\\operatorname{SE} = ${n(s)}/\\sqrt{${N}} = ${n(se, 4)}$ なので、範囲は標準誤差の $\\pm${n(z, 3)}$ 倍です。`], [`$P(|Z| \\le ${n(z, 3)}) = 2\\Phi(${n(z, 3)}) - 1 = ${n(v, 4)}$.`, `$P(|Z| \\le ${n(z, 3)}) = 2\\Phi(${n(z, 3)}) - 1 = ${n(v, 4)}$ です。`], [`A single draw lands that close only with probability $${n(2 * Phi(d / s) - 1, 3)}$: averaging is what concentrates the estimate.`, `1回の観測でそこまで近づく確率は $${n(2 * Phi(d / s) - 1, 3)}$ にすぎません。平均することで推定値が集中するのです。`]],
          set: { n: N, sigma: s, shape: 0 },
        };
      }
      if (kind === 1) {
        const Lw = r.pick([1, 6, 10, 12, 2, 4]), N = r.int(4, 100), s = Lw / Math.sqrt(12), se = s / Math.sqrt(N);
        return {
          q: [`A value is uniform on $[0, ${Lw}]$. What is the standard error of the mean of $n = ${N}$ such values? Three decimals.`, `ある値が $[0, ${Lw}]$ 上の一様分布に従います。そのような値 $n = ${N}$ 個の平均の標準誤差を小数第3位まで求めてください。`],
          a: { type: 'num', v: se, tol: 6e-4 },
          hint: ['First find $\\sigma$ for a uniform distribution on an interval of length $L$: $\\sigma = L/\\sqrt{12}$.', 'まず長さ $L$ の区間上の一様分布の $\\sigma = L/\\sqrt{12}$ を求めます。'],
          sol: [[`$\\sigma = ${Lw}/\\sqrt{12} = ${n(s, 4)}$.`, `$\\sigma = ${Lw}/\\sqrt{12} = ${n(s, 4)}$ です。`], [`$\\operatorname{SE} = ${n(s, 4)}/\\sqrt{${N}} = ${n(se, 4)}$.`, `$\\operatorname{SE} = ${n(s, 4)}/\\sqrt{${N}} = ${n(se, 4)}$ です。`], ['The flat population does not matter for the standard error: only its variance does.', '標準誤差には母集団が平らな形であることは関係なく、分散だけが効きます。']],
          set: Lw / Math.sqrt(12) >= 0.5 && Lw / Math.sqrt(12) <= 3 ? { n: N, shape: 2, sigma: Math.round(Lw / Math.sqrt(12) * 10) / 10 } : { n: N, shape: 2 },
        };
      }
      const m = r.pick([1, 1.5, 2, 2.5, 3]), N = r.int(30, 100), d = r.pick([0.1, 0.15, 0.2, 0.25]) * m, se = m / Math.sqrt(N), z = d / se, v = 1 - Phi(z);
      return {
        q: [`Waiting times at a help desk are exponential with mean ${n(m)} minutes (so $\\sigma = ${n(m)}$ too). Using the central limit theorem, estimate the probability that the average of ${N} waits exceeds ${n(m + d)} minutes. Three decimals.`, `窓口の待ち時間は平均 ${n(m)} 分の指数分布に従います（$\\sigma$ も ${n(m)}）。中心極限定理を使い、${N} 回の待ち時間の平均が ${n(m + d)} 分を超える確率を小数第3位まで求めてください。`],
        a: { type: 'num', v, tol: 0.0015 },
        hint: ['For an exponential distribution the standard deviation equals the mean.', '指数分布では標準偏差と平均が等しくなります。'],
        sol: [[`$\\operatorname{SE} = ${n(m)}/\\sqrt{${N}} = ${n(se, 4)}$.`, `$\\operatorname{SE} = ${n(m)}/\\sqrt{${N}} = ${n(se, 4)}$ です。`], [`$z = ${n(d)}/${n(se, 4)} = ${n(z, 3)}$, so $P(\\bar X > ${n(m + d)}) \\approx 1 - \\Phi(${n(z, 3)}) = ${n(v, 4)}$.`, `$z = ${n(d)}/${n(se, 4)} = ${n(z, 3)}$ なので $P(\\bar X > ${n(m + d)}) \\approx 1 - \\Phi(${n(z, 3)}) = ${n(v, 4)}$ です。`], ['The population is strongly skewed, but at this sample size the mean is close to normal; a slight right skew remains.', '母集団は大きく歪んでいますが、この標本サイズでは平均はほぼ正規分布です。わずかな右への歪みは残ります。']],
        set: { n: N, shape: 1, sigma: m },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const s = r.step(0.5, 3, 0.1), target = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.5]), need = Math.ceil((s / target) ** 2 - 1e-9);
        return {
          q: [`With $\\sigma = ${n(s)}$, what is the smallest sample size that makes the standard error of the mean at most $${n(target)}$?`, `$\\sigma = ${n(s)}$ のとき、標本平均の標準誤差を $${n(target)}$ 以下にする最小の標本サイズはいくつですか。`],
          a: { type: 'int', v: need },
          hint: ['Solve $\\sigma/\\sqrt n \\le$ target for $n$, then round up.', '$\\sigma/\\sqrt n \\le$ 目標値 を $n$ について解き、切り上げます。'],
          sol: [[`$n \\ge (\\sigma/\\text{SE})^2 = (${n(s)}/${n(target)})^2 = ${n((s / target) ** 2, 3)}$.`, `$n \\ge (\\sigma/\\text{SE})^2 = (${n(s)}/${n(target)})^2 = ${n((s / target) ** 2, 3)}$ です。`], [`So $n = ${need}$. The required size grows with the square of the precision asked for.`, `したがって $n = ${need}$ です。必要な大きさは、求める精度の2乗で増えます。`]],
          set: need <= 100 && need >= 4 ? { n: need, sigma: s } : { sigma: s },
        };
      }
      if (kind === 1) {
        const Lw = r.pick([1, 2, 3, 4, 6, 10]);
        return {
          q: [`Write the variance of the mean of $n$ independent values uniform on $[0, ${Lw}]$ as a function of $n$.`, `$[0, ${Lw}]$ 上の一様分布に従う独立な $n$ 個の値の平均の分散を、$n$ の式で表してください。`],
          a: { type: 'expr', v: `${Lw * Lw}/(12n)`, vars: ['n'], dom: { n: [1, 100] }, lhs: ['$\\operatorname{Var}(\\bar X) =$', '$\\operatorname{Var}(\\bar X) =$'] },
          hint: ['Find the variance of one value, then use $\\operatorname{Var}(\\bar X) = \\sigma^2/n$.', '1個の値の分散を求め、$\\operatorname{Var}(\\bar X) = \\sigma^2/n$ を使います。'],
          sol: [[`$\\operatorname{Var}(X) = \\int_0^{${Lw}} x^2\\,\\tfrac{dx}{${Lw}} - (${Lw}/2)^2 = ${frac(Lw * Lw, 3)} - ${frac(Lw * Lw, 4)} = ${frac(Lw * Lw, 12)}$.`, `$\\operatorname{Var}(X) = \\int_0^{${Lw}} x^2\\,\\tfrac{dx}{${Lw}} - (${Lw}/2)^2 = ${frac(Lw * Lw, 3)} - ${frac(Lw * Lw, 4)} = ${frac(Lw * Lw, 12)}$ です。`], [`$\\operatorname{Var}(\\bar X) = \\dfrac{${Lw * Lw}}{12n}$, which goes to zero: the mean converges to $${n(Lw / 2)}$ (the law of large numbers).`, `$\\operatorname{Var}(\\bar X) = \\dfrac{${Lw * Lw}}{12n}$ で、0 に近づきます。平均は $${n(Lw / 2)}$ に収束します（大数の法則）。`]],
          set: { shape: 2 },
        };
      }
      const s0 = r.pick([0.2, 0.25, 0.4, 0.5, 0.3]), need = Math.ceil((2 / s0) ** 2 - 1e-9);
      return {
        q: [`The mean of $n$ independent exponential values has skewness $2/\\sqrt n$. How large must $n$ be for that skewness to be at most $${n(s0)}$?`, `独立な指数分布の値 $n$ 個の平均の歪度は $2/\\sqrt n$ です。この歪度を $${n(s0)}$ 以下にするには、$n$ はいくつ以上必要ですか。`],
        a: { type: 'int', v: need },
        hint: ['Solve $2/\\sqrt n \\le s$ for $n$.', '$2/\\sqrt n \\le s$ を $n$ について解きます。'],
        sol: [[`$\\sqrt n \\ge 2/${n(s0)} = ${n(2 / s0)}$, so $n \\ge ${n((2 / s0) ** 2)}$.`, `$\\sqrt n \\ge 2/${n(s0)} = ${n(2 / s0)}$ なので $n \\ge ${n((2 / s0) ** 2)}$ です。`], [`So $n = ${need}$. The central limit theorem removes skewness only slowly, like $1/\\sqrt n$: that is the leftover asymmetry visible with the skewed shape and small $n$.`, `したがって $n = ${need}$ です。中心極限定理は歪みを $1/\\sqrt n$ のようにゆっくりとしか消しません。歪んだ形で $n$ が小さいときに見える非対称性がそれです。`]],
        set: { shape: 1, n: Math.max(4, Math.min(100, need)) },
      };
    },
  ];

  /* ---------- 2. confidence intervals ---------- */
  Q.interval = [
    (r) => {
      const kind = r.int(0, 2), L = r.step(0.8, 0.99, 0.01), z = probit(1 - (1 - L) / 2);
      if (kind === 0) {
        return {
          q: [`What critical value $z_{\\alpha/2}$ gives ${an(L)} ${pc(L)}% confidence interval $\\bar x \\pm z_{\\alpha/2}\\,\\sigma/\\sqrt n$? Two decimals.`, `${pc(L)}% 信頼区間 $\\bar x \\pm z_{\\alpha/2}\\,\\sigma/\\sqrt n$ の臨界値 $z_{\\alpha/2}$ はいくつですか（小数第2位まで）。`],
          a: { type: 'num', v: z, tol: 0.006 },
          hint: ['Leave half of the remaining probability in each tail.', '残りの確率を両側の裾に半分ずつ残します。'],
          sol: [[`$\\alpha = ${n(1 - L)}$, so each tail holds $${n((1 - L) / 2, 4)}$ and $\\Phi(z) = ${n(1 - (1 - L) / 2, 4)}$.`, `$\\alpha = ${n(1 - L)}$ なので各裾は $${n((1 - L) / 2, 4)}$ で、$\\Phi(z) = ${n(1 - (1 - L) / 2, 4)}$ です。`], [`$z_{\\alpha/2} = ${n(z, 3)}$. A higher level needs a larger $z$, so a wider interval.`, `$z_{\\alpha/2} = ${n(z, 3)}$ です。水準を上げると $z$ が大きくなり、区間が広がります。`]],
          set: { level: L },
        };
      }
      if (kind === 1) {
        return {
          q: [`Fifty independent ${pc(L)}% confidence intervals are computed from fifty samples. How many are expected to miss the true mean?`, `50個の独立な標本から ${pc(L)}% 信頼区間を50個作ります。真の平均を外すと期待される区間はいくつですか。`],
          a: { type: 'num', v: 50 * (1 - L) },
          hint: ['Each interval misses with probability $\\alpha = 1 - \\text{level}$.', '各区間が外れる確率は $\\alpha = 1 - \\text{水準}$ です。'],
          sol: [[`Each interval misses with probability $${n(1 - L)}$.`, `各区間が外れる確率は $${n(1 - L)}$ です。`], [`Expected misses: $50 \\times ${n(1 - L)} = ${n(50 * (1 - L))}$. The actual count in the figure scatters around this, binomially.`, `期待される外れの数は $50 \\times ${n(1 - L)} = ${n(50 * (1 - L))}$ です。図の実際の数はこのまわりに二項分布でばらつきます。`]],
          set: { level: L },
        };
      }
      const L2 = r.pick([0.9, 0.95, 0.99]), z2 = probit(1 - (1 - L2) / 2), N = r.int(4, 100), half = z2 * 2 / Math.sqrt(N);
      return {
        q: [`With $\\sigma = 2$ and $n = ${N}$, what is the half-width of the ${pc(L2)}% interval $\\bar x \\pm z\\sigma/\\sqrt n$? Three decimals.`, `$\\sigma = 2$、$n = ${N}$ のとき、${pc(L2)}% 区間 $\\bar x \\pm z\\sigma/\\sqrt n$ の半幅を小数第3位まで求めてください。`],
        a: { type: 'num', v: half, tol: 0.0015 },
        hint: [`The critical value for ${pc(L2)}% is $${n(z2, 3)}$.`, `${pc(L2)}% の臨界値は $${n(z2, 3)}$ です。`],
        sol: [[`$\\sigma/\\sqrt n = 2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$.`, `$\\sigma/\\sqrt n = 2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$ です。`], [`Half-width $= ${n(z2, 3)} \\times ${n(2 / Math.sqrt(N), 4)} = ${n(half, 4)}$: the readout's "half-width z·SE".`, `半幅は $${n(z2, 3)} \\times ${n(2 / Math.sqrt(N), 4)} = ${n(half, 4)}$ で、読み取り欄の「半幅 z·SE」です。`]],
        set: { n: N, level: L2 },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const L = r.pick(LEVELS), z = probit(1 - (1 - L) / 2), ctx = r.pick([[500, 4, 'mL', 'bottles filled by a machine', '機械で充填したボトル', 'mL'], [250, 3, 'g', 'cereal boxes', 'シリアルの箱', 'g'], [72, 8, 'beats per minute', 'resting heart rates', '安静時心拍数', '拍/分'], [170, 7, 'cm', 'adult heights', '成人の身長', 'cm']]);
        const [mu0, s, unitEn, what, whatJa, unitJa] = ctx, N = r.int(10, 100), xb = Number((mu0 + r.real(-1, 1) * s / 2).toFixed(1)), half = z * s / Math.sqrt(N);
        return {
          q: [`The mean of ${N} ${what} is ${n(xb)} ${unitEn}, and $\\sigma = ${s}$ ${unitEn} is known from long experience. Give the ${pc(L)}% confidence interval for the true mean, to two decimals.`, `${whatJa} ${N} 個の平均は ${n(xb)} ${unitJa} で、長年の経験から $\\sigma = ${s}$ ${unitJa} がわかっています。真の平均の ${pc(L)}% 信頼区間を小数第2位まで求めてください。`],
          a: { type: 'tuple', v: [xb - half, xb + half], labels: [['lower', '下限'], ['upper', '上限']], tol: 0.006 },
          hint: [`$z = ${n(z, 3)}$ for ${pc(L)}%; the standard error is $\\sigma/\\sqrt n$.`, `${pc(L)}% では $z = ${n(z, 3)}$ で、標準誤差は $\\sigma/\\sqrt n$ です。`],
          sol: [[`$\\operatorname{SE} = ${s}/\\sqrt{${N}} = ${n(s / Math.sqrt(N), 4)}$ and the half-width is $${n(z, 3)} \\times ${n(s / Math.sqrt(N), 4)} = ${n(half, 4)}$.`, `$\\operatorname{SE} = ${s}/\\sqrt{${N}} = ${n(s / Math.sqrt(N), 4)}$ で、半幅は $${n(z, 3)} \\times ${n(s / Math.sqrt(N), 4)} = ${n(half, 4)}$ です。`], [`Interval: $${n(xb)} \\pm ${n(half, 3)} = [${n(xb - half, 3)}, ${n(xb + half, 3)}]$. In repeated sampling, ${pc(L)}% of intervals built this way cover the true mean.`, `区間は $${n(xb)} \\pm ${n(half, 3)} = [${n(xb - half, 3)}, ${n(xb + half, 3)}]$ です。標本を繰り返せば、この方法で作った区間の ${pc(L)}% が真の平均を含みます。`]],
          set: N <= 100 ? { n: N, level: L } : { level: L },
        };
      }
      if (kind === 1) {
        const N = r.int(5, 25), L = r.pick([0.9, 0.95, 0.99]), tq = tquant(1 - (1 - L) / 2, N - 1), xb = r.real(10, 60, 1), s = r.real(1, 8, 1), half = tq * s / Math.sqrt(N);
        return {
          q: [`A sample of $n = ${N}$ from a normal population has $\\bar x = ${n(xb)}$ and sample standard deviation $s = ${n(s)}$ ($\\sigma$ unknown). Give the ${pc(L)}% $t$ interval for the mean, to two decimals.`, `正規母集団からの大きさ $n = ${N}$ の標本で $\\bar x = ${n(xb)}$、標本標準偏差 $s = ${n(s)}$ でした（$\\sigma$ は未知）。平均の ${pc(L)}% $t$ 区間を小数第2位まで求めてください。`],
          a: { type: 'tuple', v: [xb - half, xb + half], labels: [['lower', '下限'], ['upper', '上限']], tol: 0.006 },
          hint: [`Use $t_{${n((1 - L) / 2, 3)}}$ with $n - 1 = ${N - 1}$ degrees of freedom in place of $z$.`, `$z$ の代わりに自由度 $n - 1 = ${N - 1}$ の $t_{${n((1 - L) / 2, 3)}}$ を使います。`],
          sol: [[`$t_{${N - 1}} = ${n(tq, 3)}$ (the normal value would be $${n(probit(1 - (1 - L) / 2), 3)}$).`, `$t_{${N - 1}} = ${n(tq, 3)}$ です（正規分布なら $${n(probit(1 - (1 - L) / 2), 3)}$）。`], [`Half-width $${n(tq, 3)} \\times ${n(s)}/\\sqrt{${N}} = ${n(half, 4)}$, interval $[${n(xb - half, 3)}, ${n(xb + half, 3)}]$.`, `半幅は $${n(tq, 3)} \\times ${n(s)}/\\sqrt{${N}} = ${n(half, 4)}$ で、区間は $[${n(xb - half, 3)}, ${n(xb + half, 3)}]$ です。`], ['The extra width pays for estimating $\\sigma$ from the same small sample.', '幅が増える分は、同じ小さな標本から $\\sigma$ を推定する代償です。']],
        };
      }
      const mu0 = r.pick([100, 50, 20, 75]), s = r.pick([10, 5, 4, 15, 12]), N = r.pick([16, 25, 36, 49, 64, 100]), z0 = r.real(0.6, 3.2, 2) * r.sign(), xb = Number((mu0 + z0 * s / Math.sqrt(N)).toFixed(2));
      const z = (xb - mu0) / (s / Math.sqrt(N)), pv = 2 * (1 - Phi(Math.abs(z)));
      return {
        q: [`$H_0: \\mu = ${mu0}$, with $\\sigma = ${s}$ known. A sample of $n = ${N}$ gives $\\bar x = ${n(xb)}$. Find the two-sided $p$-value, to three decimals.`, `$H_0: \\mu = ${mu0}$、$\\sigma = ${s}$ は既知です。$n = ${N}$ の標本で $\\bar x = ${n(xb)}$ でした。両側 $p$ 値を小数第3位まで求めてください。`],
        a: { type: 'num', v: pv, tol: 0.0015 },
        hint: ['Compute $z = (\\bar x - \\mu_0)/(\\sigma/\\sqrt n)$, then double the tail beyond $|z|$.', '$z = (\\bar x - \\mu_0)/(\\sigma/\\sqrt n)$ を求め、$|z|$ より外側の裾の確率を2倍します。'],
        sol: [[`$z = (${n(xb)} - ${mu0})/(${s}/\\sqrt{${N}}) = ${n(xb - mu0, 4)}/${n(s / Math.sqrt(N), 4)} = ${n(z, 3)}$.`, `$z = (${n(xb)} - ${mu0})/(${s}/\\sqrt{${N}}) = ${n(xb - mu0, 4)}/${n(s / Math.sqrt(N), 4)} = ${n(z, 3)}$ です。`], [`$p = 2(1 - \\Phi(${n(Math.abs(z), 3)})) = ${n(pv, 4)}$.`, `$p = 2(1 - \\Phi(${n(Math.abs(z), 3)})) = ${n(pv, 4)}$ です。`], [pv < 0.05 ? `Below 0.05: the 95% interval around $\\bar x$ would exclude ${mu0}.` : `Above 0.05: the 95% interval around $\\bar x$ would contain ${mu0}.`, pv < 0.05 ? `0.05 未満なので、$\\bar x$ を中心とする95%区間は ${mu0} を含みません。` : `0.05 以上なので、$\\bar x$ を中心とする95%区間は ${mu0} を含みます。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const L = r.pick(LEVELS), z = probit(1 - (1 - L) / 2), s = r.pick([2, 3, 5, 10, 15]), E = r.pick([0.5, 1, 2, 0.25, 1.5]) * s / 5, need = Math.ceil((z * s / E) ** 2 - 1e-9);
        return {
          q: [`With $\\sigma = ${s}$, how large a sample makes the ${pc(L)}% interval's half-width at most $${n(E)}$?`, `$\\sigma = ${s}$ のとき、${pc(L)}% 区間の半幅を $${n(E)}$ 以下にするには、標本はいくつ必要ですか。`],
          a: { type: 'int', v: need },
          hint: ['Solve $z\\sigma/\\sqrt n \\le E$ for $n$ and round up.', '$z\\sigma/\\sqrt n \\le E$ を $n$ について解き、切り上げます。'],
          sol: [[`$z = ${n(z, 4)}$, so $n \\ge (z\\sigma/E)^2 = (${n(z, 4)}\\cdot${s}/${n(E)})^2 = ${n((z * s / E) ** 2, 2)}$.`, `$z = ${n(z, 4)}$ なので $n \\ge (z\\sigma/E)^2 = (${n(z, 4)}\\cdot${s}/${n(E)})^2 = ${n((z * s / E) ** 2, 2)}$ です。`], [`So $n = ${need}$. Higher confidence and a tighter margin both cost data quadratically.`, `したがって $n = ${need}$ です。信頼水準を上げることも誤差幅を絞ることも、データ量を2乗で要求します。`]],
          set: s === 2 && need <= 100 ? { n: need, level: L } : { level: L },
        };
      }
      if (kind === 1) {
        const L = r.step(0.8, 0.99, 0.01), z = probit(1 - (1 - L) / 2), N = r.int(4, 100), half = Number((z * 2 / Math.sqrt(N)).toFixed(3)), xb = r.real(9, 11, 2);
        const zz = half / (2 / Math.sqrt(N)), lev = 2 * Phi(zz) - 1;
        return {
          q: [`From $n = ${N}$ observations with known $\\sigma = 2$, someone reports the interval $[${n(xb - half, 3)}, ${n(xb + half, 3)}]$ for the mean. What confidence level did they use? Give a percentage to the nearest whole number.`, `既知の $\\sigma = 2$ で $n = ${N}$ 個の観測から、平均の区間 $[${n(xb - half, 3)}, ${n(xb + half, 3)}]$ が報告されました。使われた信頼水準は何%ですか（整数の%で）。`],
          a: { type: 'num', v: lev * 100, tol: 0.6, unit: ['%', '%'] },
          hint: ['Half the width divided by the standard error gives $z$; the level is the area between $-z$ and $z$.', '幅の半分を標準誤差で割ると $z$ になり、水準は $-z$ から $z$ までの面積です。'],
          sol: [[`Half-width $${n(half, 3)}$, standard error $2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$, so $z = ${n(zz, 3)}$.`, `半幅は $${n(half, 3)}$、標準誤差は $2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$ なので $z = ${n(zz, 3)}$ です。`], [`Level $= 2\\Phi(${n(zz, 3)}) - 1 = ${n(lev, 4)}$, about ${pc(lev)}%.`, `水準は $2\\Phi(${n(zz, 3)}) - 1 = ${n(lev, 4)}$、約 ${pc(lev)}% です。`]],
          set: { n: N, level: L },
        };
      }
      if (kind === 2) {
        const lo = r.real(9, 10, 2), hi = Number((lo + r.real(0.6, 1.6, 2)).toFixed(2));
        return {
          q: [`A 95% confidence interval for a mean is computed as $[${n(lo)}, ${n(hi)}]$. Which statement is correct?`, `平均の95%信頼区間が $[${n(lo)}, ${n(hi)}]$ と計算されました。正しい記述はどれですか。`],
          a: { type: 'choice', opts: [['The procedure that produced it covers the true mean in 95% of repeated samples.', 'この区間を作った手続きは、標本を繰り返すと95%の割合で真の平均を含みます。'], [`There is a 95% probability that the true mean lies in $[${n(lo)}, ${n(hi)}]$.`, `真の平均が $[${n(lo)}, ${n(hi)}]$ に入る確率は95%です。`], ['95% of the observations lie in this interval.', '観測値の95%がこの区間に入ります。'], [`95% of future sample means will fall in $[${n(lo)}, ${n(hi)}]$.`, `今後の標本平均の95%が $[${n(lo)}, ${n(hi)}]$ に入ります。`]], v: 0 },
          hint: ['In the figure, which things move from sample to sample: the intervals or $\\mu$?', '図で標本ごとに動くのは区間でしょうか、それとも $\\mu$ でしょうか。'],
          sol: [['The true mean is fixed; the interval is random. Once computed, this interval either covers $\\mu$ or it does not.', '真の平均は固定で、区間のほうが確率的です。いったん計算した区間は $\\mu$ を含むか含まないかのどちらかです。'], ['The 95% is the long-run hit rate of the method, which is what the fifty intervals in the figure illustrate. Observations spread $\\sqrt n$ times wider than this interval.', '95%はこの方法の長期的な的中率で、図の50本の区間が示しているのはそれです。観測値自体はこの区間の $\\sqrt n$ 倍広く散らばります。']],
          set: { level: 0.95 },
        };
      }
      const N = r.int(4, 30), L = r.pick([0.9, 0.95, 0.99]), tq = tquant(1 - (1 - L) / 2, N - 1), z = probit(1 - (1 - L) / 2);
      return {
        q: [`For $n = ${N}$ and ${pc(L)}% confidence, how many times wider is the $t$ interval than the $z$ interval with the same standard deviation? Three decimals.`, `$n = ${N}$、信頼水準 ${pc(L)}% のとき、同じ標準偏差なら $t$ 区間は $z$ 区間の何倍の幅になりますか（小数第3位まで）。`],
        a: { type: 'num', v: tq / z, tol: 0.0015 },
        hint: [`Compare the two critical values, $t_{${N - 1}}$ and $z$.`, `2つの臨界値 $t_{${N - 1}}$ と $z$ を比べます。`],
        sol: [[`$t_{${N - 1}} = ${n(tq, 4)}$ and $z = ${n(z, 4)}$.`, `$t_{${N - 1}} = ${n(tq, 4)}$、$z = ${n(z, 4)}$ です。`], [`Ratio $${n(tq, 4)}/${n(z, 4)} = ${n(tq / z, 4)}$. It tends to 1 as $n$ grows, when $s$ becomes a reliable stand-in for $\\sigma$.`, `比は $${n(tq, 4)}/${n(z, 4)} = ${n(tq / z, 4)}$ です。$n$ が大きくなると $s$ が $\\sigma$ の確かな代わりになり、比は 1 に近づきます。`]],
        set: { n: N, level: L },
      };
    },
  ];

  /* ---------- 3. least squares ---------- */
  const fitXY = (xs, ys) => {
    const N = xs.length, xb = xs.reduce((a, b) => a + b, 0) / N, yb = ys.reduce((a, b) => a + b, 0) / N;
    let Sxx = 0, Sxy = 0, Syy = 0; xs.forEach((x, i) => { Sxx += (x - xb) ** 2; Sxy += (x - xb) * (ys[i] - yb); Syy += (ys[i] - yb) ** 2; });
    return { xb, yb, Sxx, Sxy, Syy, b1: Sxy / Sxx, b0: yb - Sxy / Sxx * xb };
  };
  Q.regression = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const b1 = r.step(-0.5, 2, 0.05), x = r.step(0.2, 2, 0.1), y = 1 + b1 * x;
        return {
          q: [`A fitted line is $\\hat y = 1 ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}x$. What does it predict at $x = ${n(x)}$?`, `回帰直線が $\\hat y = 1 ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}x$ です。$x = ${n(x)}$ での予測値はいくつですか。`],
          a: { type: 'num', v: y },
          sol: [[`$\\hat y = 1 ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}\\cdot${n(x)} = ${n(y, 4)}$.`, `$\\hat y = 1 ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}\\cdot${n(x)} = ${n(y, 4)}$ です。`], ['It estimates the mean of $y$ at that $x$, not any single observation.', 'これはその $x$ での $y$ の平均の推定値で、個々の観測値ではありません。']],
          set: { slope: b1, noise: 0 },
        };
      }
      if (kind === 1) {
        const b0 = r.real(-2, 3, 1), b1 = r.real(-2, 3, 1) || 0.5, x = r.int(1, 9), y = Number((b0 + b1 * x + r.real(-2, 2, 1)).toFixed(1)), e = y - (b0 + b1 * x);
        return {
          q: [`The least-squares line is $\\hat y = ${n(b0)} ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}x$. What is the residual of the observation $(${x}, ${n(y)})$?`, `最小二乗直線は $\\hat y = ${n(b0)} ${b1 < 0 ? '-' : '+'} ${n(Math.abs(b1))}x$ です。観測値 $(${x}, ${n(y)})$ の残差はいくつですか。`],
          a: { type: 'num', v: e, tol: 1e-6 },
          hint: ['Residual = observed minus fitted, $y - \\hat y$.', '残差は観測値から当てはめ値を引いた $y - \\hat y$ です。'],
          sol: [[`$\\hat y(${x}) = ${n(b0 + b1 * x, 4)}$.`, `$\\hat y(${x}) = ${n(b0 + b1 * x, 4)}$ です。`], [`$e = ${n(y)} - ${n(b0 + b1 * x, 4)} = ${n(e, 4)}$: the point lies ${e >= 0 ? 'above' : 'below'} the line, like the orange segments in the figure.`, `$e = ${n(y)} - ${n(b0 + b1 * x, 4)} = ${n(e, 4)}$ で、点は直線の${e >= 0 ? '上' : '下'}にあります。図の橙の線分にあたります。`]],
        };
      }
      const SST = r.int(20, 200), SSR = Number((SST * r.real(0.05, 0.7)).toFixed(1));
      return {
        q: [`A regression has total sum of squares $\\sum(y_i - \\bar y)^2 = ${SST}$ and residual sum of squares $${n(SSR)}$. What is $R^2$?`, `ある回帰で全平方和 $\\sum(y_i - \\bar y)^2 = ${SST}$、残差平方和 $${n(SSR)}$ でした。$R^2$ はいくつですか。`],
        a: { type: 'num', v: 1 - SSR / SST, rel: 0.002 },
        hint: ['$R^2$ is the share of the variation in $y$ that the line accounts for.', '$R^2$ は $y$ の変動のうち直線で説明される割合です。'],
        sol: [[`$R^2 = 1 - \\text{SSR}/\\text{SST} = 1 - ${n(SSR)}/${SST} = ${n(1 - SSR / SST, 4)}$.`, `$R^2 = 1 - \\text{SSR}/\\text{SST} = 1 - ${n(SSR)}/${SST} = ${n(1 - SSR / SST, 4)}$ です。`], [`So ${n(100 * (1 - SSR / SST), 1)}% of the variance of $y$ is explained by $x$; the rest is residual scatter.`, `$y$ の分散の ${n(100 * (1 - SSR / SST), 1)}% が $x$ で説明され、残りは残差のばらつきです。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.pick([4, 5]), xs = L_seq(N, (i) => i + 1), b = r.int(-2, 3), a0 = r.int(-3, 5);
        const ys = xs.map((x) => a0 + b * x + r.int(-2, 2));
        const f = fitXY(xs, ys);
        return {
          q: [`Fit the least-squares line $\\hat y = \\hat\\beta_0 + \\hat\\beta_1 x$ to the points ${xs.map((x, i) => `$(${x}, ${ys[i]})$`).join(', ')}.`, `点 ${xs.map((x, i) => `$(${x}, ${ys[i]})$`).join('、')} に最小二乗直線 $\\hat y = \\hat\\beta_0 + \\hat\\beta_1 x$ を当てはめてください。`],
          a: { type: 'tuple', v: [f.b0, f.b1], labels: ['$\\hat\\beta_0$', '$\\hat\\beta_1$'], tol: 0.002 },
          hint: ['Centre the data: $\\hat\\beta_1 = S_{xy}/S_{xx}$, then the line passes through $(\\bar x, \\bar y)$.', 'データを中心化します。$\\hat\\beta_1 = S_{xy}/S_{xx}$ で、直線は $(\\bar x, \\bar y)$ を通ります。'],
          sol: [[`$\\bar x = ${n(f.xb)}$, $\\bar y = ${n(f.yb, 4)}$, $S_{xx} = ${n(f.Sxx)}$, $S_{xy} = ${n(f.Sxy, 4)}$.`, `$\\bar x = ${n(f.xb)}$、$\\bar y = ${n(f.yb, 4)}$、$S_{xx} = ${n(f.Sxx)}$、$S_{xy} = ${n(f.Sxy, 4)}$ です。`], [`$\\hat\\beta_1 = ${n(f.Sxy, 4)}/${n(f.Sxx)} = ${n(f.b1, 4)}$ and $\\hat\\beta_0 = ${n(f.yb, 4)} - ${pn(f.b1)}\\cdot${n(f.xb)} = ${n(f.b0, 4)}$.`, `$\\hat\\beta_1 = ${n(f.Sxy, 4)}/${n(f.Sxx)} = ${n(f.b1, 4)}$、$\\hat\\beta_0 = ${n(f.yb, 4)} - ${pn(f.b1)}\\cdot${n(f.xb)} = ${n(f.b0, 4)}$ です。`], ['The residuals of this line sum to zero, and no other line has a smaller sum of squared residuals.', 'この直線の残差の和は 0 で、残差平方和がこれより小さい直線はありません。']],
        };
      }
      if (kind === 1) {
        const N = r.int(10, 60), xb = r.real(2, 20, 1), yb = r.real(10, 80, 1), Sxx = r.int(20, 400), b1t = r.real(-3, 4, 2) || 1.25, Sxy = Number((b1t * Sxx).toFixed(1)), b1 = Sxy / Sxx, b0 = yb - b1 * xb;
        return {
          q: [`From $n = ${N}$ pairs: $\\bar x = ${n(xb)}$, $\\bar y = ${n(yb)}$, $S_{xx} = ${Sxx}$, $S_{xy} = ${n(Sxy)}$. Find the least-squares intercept and slope.`, `$n = ${N}$ 組のデータで $\\bar x = ${n(xb)}$、$\\bar y = ${n(yb)}$、$S_{xx} = ${Sxx}$、$S_{xy} = ${n(Sxy)}$ でした。最小二乗法の切片と傾きを求めてください。`],
          a: { type: 'tuple', v: [b0, b1], labels: ['$\\hat\\beta_0$', '$\\hat\\beta_1$'], tol: 0.003 },
          hint: ['Slope first, then use that the line passes through the point of means.', 'まず傾きを求め、直線が平均の点を通ることを使います。'],
          sol: [[`$\\hat\\beta_1 = S_{xy}/S_{xx} = ${n(Sxy)}/${Sxx} = ${n(b1, 4)}$.`, `$\\hat\\beta_1 = S_{xy}/S_{xx} = ${n(Sxy)}/${Sxx} = ${n(b1, 4)}$ です。`], [`$\\hat\\beta_0 = \\bar y - \\hat\\beta_1\\bar x = ${n(yb)} - ${pn(b1)}\\cdot${n(xb)} = ${n(b0, 4)}$.`, `$\\hat\\beta_0 = \\bar y - \\hat\\beta_1\\bar x = ${n(yb)} - ${pn(b1)}\\cdot${n(xb)} = ${n(b0, 4)}$ です。`], ['These summaries are all the line needs: least squares only sees the first and second moments of the data.', '直線に必要なのはこれらの要約量だけです。最小二乗法はデータの1次と2次のモーメントしか見ません。']],
        };
      }
      const Sxx = r.int(10, 100), Syy = r.int(10, 200), rr = r.real(-0.95, 0.95, 2) || 0.5, Sxy = Number((rr * Math.sqrt(Sxx * Syy)).toFixed(2)), rc = Sxy / Math.sqrt(Sxx * Syy);
      return {
        q: [`A data set has $S_{xx} = ${Sxx}$, $S_{yy} = ${Syy}$ and $S_{xy} = ${n(Sxy)}$. What is $R^2$ for the least-squares line? Three decimals.`, `あるデータで $S_{xx} = ${Sxx}$、$S_{yy} = ${Syy}$、$S_{xy} = ${n(Sxy)}$ でした。最小二乗直線の $R^2$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: rc * rc, tol: 6e-4 },
        hint: ['For a straight-line fit, $R^2$ is the square of the correlation $r = S_{xy}/\\sqrt{S_{xx}S_{yy}}$.', '直線の当てはめでは、$R^2$ は相関係数 $r = S_{xy}/\\sqrt{S_{xx}S_{yy}}$ の2乗です。'],
        sol: [[`$r = ${n(Sxy)}/\\sqrt{${Sxx}\\cdot${Syy}} = ${n(rc, 4)}$.`, `$r = ${n(Sxy)}/\\sqrt{${Sxx}\\cdot${Syy}} = ${n(rc, 4)}$ です。`], [`$R^2 = r^2 = ${n(rc * rc, 4)}$. The sign of $r$ is the sign of the slope; $R^2$ forgets it.`, `$R^2 = r^2 = ${n(rc * rc, 4)}$ です。$r$ の符号は傾きの符号ですが、$R^2$ では消えます。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const N = r.int(8, 40), Sxx = r.int(10, 200), s = r.real(0.3, 3, 2), b1 = r.real(-2, 2, 3) || 0.4, se = s / Math.sqrt(Sxx), t = b1 / se, tc = tquant(0.975, N - 2);
        return {
          q: [`A regression on $n = ${N}$ points gives $\\hat\\beta_1 = ${n(b1)}$, residual standard deviation $s = ${n(s)}$ and $S_{xx} = ${Sxx}$. Compute the $t$ statistic for $H_0: \\beta_1 = 0$, to two decimals.`, `$n = ${N}$ 点の回帰で $\\hat\\beta_1 = ${n(b1)}$、残差標準偏差 $s = ${n(s)}$、$S_{xx} = ${Sxx}$ でした。$H_0: \\beta_1 = 0$ の $t$ 統計量を小数第2位まで求めてください。`],
          a: { type: 'num', v: t, tol: 0.006 },
          hint: ['The standard error of the slope is $s/\\sqrt{S_{xx}}$.', '傾きの標準誤差は $s/\\sqrt{S_{xx}}$ です。'],
          sol: [[`$\\operatorname{SE}(\\hat\\beta_1) = ${n(s)}/\\sqrt{${Sxx}} = ${n(se, 4)}$.`, `$\\operatorname{SE}(\\hat\\beta_1) = ${n(s)}/\\sqrt{${Sxx}} = ${n(se, 4)}$ です。`], [`$t = ${n(b1)}/${n(se, 4)} = ${n(t, 3)}$, against the 5% critical value $t_{${N - 2}} = ${n(tc, 3)}$.`, `$t = ${n(b1)}/${n(se, 4)} = ${n(t, 3)}$ で、5%の臨界値は $t_{${N - 2}} = ${n(tc, 3)}$ です。`], [Math.abs(t) > tc ? 'The slope is significantly different from zero at the 5% level.' : 'The data are consistent with no linear relationship at the 5% level.', Math.abs(t) > tc ? '5%水準で傾きは 0 と有意に異なります。' : '5%水準では、線形の関係がないこととも矛盾しません。']],
        };
      }
      if (kind === 1) {
        const xs = [1, 2, 3, 4, 5, 6, 7].slice(0, r.int(5, 7)), k = r.int(0, xs.length - 1), d = r.pick([1, 2, -1, -2, 3, 0.5]);
        const xb = xs.reduce((a, b) => a + b, 0) / xs.length, Sxx = xs.reduce((a, x) => a + (x - xb) ** 2, 0), db = d * (xs[k] - xb) / Sxx;
        return {
          q: [`The $x$ values are ${xs.join(', ')}. If the $y$ value at $x = ${xs[k]}$ is raised by $${n(d)}$, leaving everything else unchanged, by how much does the least-squares slope change?`, `$x$ の値は ${xs.join('、')} です。$x = ${xs[k]}$ の $y$ の値だけを $${n(d)}$ 増やすと、最小二乗法の傾きはどれだけ変わりますか。`],
          a: { type: 'num', v: db, tol: 1e-4 },
          hint: ['$\\hat\\beta_1 = \\sum (x_i - \\bar x) y_i / S_{xx}$ is linear in each $y_i$.', '$\\hat\\beta_1 = \\sum (x_i - \\bar x) y_i / S_{xx}$ は各 $y_i$ について線形です。'],
          sol: [[`$\\bar x = ${n(xb)}$ and $S_{xx} = ${n(Sxx)}$.`, `$\\bar x = ${n(xb)}$、$S_{xx} = ${n(Sxx)}$ です。`], [`$\\Delta\\hat\\beta_1 = ${n(d)}\\cdot(${xs[k]} - ${n(xb)})/${n(Sxx)} = ${n(db, 4)}$.`, `$\\Delta\\hat\\beta_1 = ${n(d)}\\cdot(${xs[k]} - ${n(xb)})/${n(Sxx)} = ${n(db, 4)}$ です。`], [xs[k] === xb ? 'A point at $\\bar x$ moves the line up without tilting it at all.' : 'The lever arm is $x - \\bar x$: points far from the centre pull the slope hardest, as dragging shows in the figure.', xs[k] === xb ? '$\\bar x$ にある点は直線を傾けず、上下に動かすだけです。' : 'てこの腕は $x - \\bar x$ です。中心から遠い点ほど傾きを強く引っぱることは、図でドラッグすると確かめられます。']],
        };
      }
      if (kind === 2) {
        const rr = r.pick([0.3, 0.5, 0.6, 0.8, -0.4, -0.7, 0.9]), sx = r.int(2, 10), sy = r.int(2, 20), bxy = rr * sx / sy, byx = rr * sy / sx;
        return {
          q: [`Two variables have correlation $r = ${n(rr)}$, $s_x = ${sx}$ and $s_y = ${sy}$. The regression of $y$ on $x$ has slope $${n(byx, 4)}$. What is the slope of the regression of $x$ on $y$?`, `2つの変数の相関が $r = ${n(rr)}$、$s_x = ${sx}$、$s_y = ${sy}$ です。$x$ に対する $y$ の回帰の傾きは $${n(byx, 4)}$ です。$y$ に対する $x$ の回帰の傾きはいくつですか。`],
          a: { type: 'num', v: bxy, rel: 0.002 },
          hint: ['Each regression slope is $r$ times the ratio of the standard deviations, response over predictor.', 'どちらの回帰の傾きも、$r$ に「応答の標準偏差 ÷ 説明変数の標準偏差」を掛けたものです。'],
          sol: [[`$b_{x\\mid y} = r\\,s_x/s_y = ${n(rr)}\\cdot${sx}/${sy} = ${n(bxy, 4)}$.`, `$b_{x\\mid y} = r\\,s_x/s_y = ${n(rr)}\\cdot${sx}/${sy} = ${n(bxy, 4)}$ です。`], [`It is not $1/${n(byx, 4)} = ${n(1 / byx, 4)}$: the product of the two slopes is $r^2 = ${n(rr * rr)}$, so the lines coincide only when $|r| = 1$. Each one minimizes vertical errors in its own response, which is regression toward the mean.`, `$1/${n(byx, 4)} = ${n(1 / byx, 4)}$ ではありません。2つの傾きの積は $r^2 = ${n(rr * rr)}$ で、$|r| = 1$ のときだけ2本の直線は一致します。それぞれが自分の応答の誤差を最小にするためで、これが平均への回帰です。`]],
        };
      }
      const N = r.int(2, 3), xs = [1, 2, 3].slice(0, N), ys = xs.map(() => r.int(1, 6));
      const Sxy = xs.reduce((a, x, i) => a + x * ys[i], 0), Sxx = xs.reduce((a, x) => a + x * x, 0);
      const exprV = xs.map((x, i) => `(${ys[i]}-${x === 1 ? '' : x}b)^2`).join('+');
      return {
        q: [`Fit a line through the origin, $\\hat y = bx$, to the points ${xs.map((x, i) => `$(${x}, ${ys[i]})$`).join(', ')}. Write the sum of squared residuals $S(b)$ as a function of $b$.`, `原点を通る直線 $\\hat y = bx$ を点 ${xs.map((x, i) => `$(${x}, ${ys[i]})$`).join('、')} に当てはめます。残差平方和 $S(b)$ を $b$ の式で表してください。`],
        a: { type: 'expr', v: exprV, vars: ['b'], dom: { b: [-2, 4] }, lhs: ['$S(b) =$', '$S(b) =$'] },
        hint: ['Each point contributes $(y_i - b x_i)^2$.', '各点の寄与は $(y_i - b x_i)^2$ です。'],
        sol: [[`$S(b) = ${xs.map((x, i) => `(${ys[i]} - ${x === 1 ? '' : x}b)^2`).join(' + ')} = ${n(Sxx)}b^2 - ${n(2 * Sxy)}b + ${ys.reduce((a, y) => a + y * y, 0)}$.`, `$S(b) = ${xs.map((x, i) => `(${ys[i]} - ${x === 1 ? '' : x}b)^2`).join(' + ')} = ${n(Sxx)}b^2 - ${n(2 * Sxy)}b + ${ys.reduce((a, y) => a + y * y, 0)}$ です。`], [`$S'(b) = 0$ gives $b = \\sum x_iy_i/\\sum x_i^2 = ${frac(Sxy, Sxx)}$: least squares is minimizing a parabola, which is why the answer is unique.`, `$S'(b) = 0$ より $b = \\sum x_iy_i/\\sum x_i^2 = ${frac(Sxy, Sxx)}$ です。最小二乗法は放物線の最小化なので、答えはただ一つに決まります。`]],
      };
    },
  ];
  function L_seq(k, f) { return Array.from({ length: k }, (_, i) => f(i)); }
})();
