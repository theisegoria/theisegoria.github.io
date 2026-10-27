'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, gcd } = P.util;
  // standard normal CDF (Abramowitz and Stegun 7.1.26, error below 1.5e-7)
  const Phi = (z) => { const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x); const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e); };
  const binPmf = (N, p) => { const out = []; let pr = (1 - p) ** N; for (let k = 0; k <= N; k++) { if (k) pr *= (N - k + 1) / k * p / (1 - p); out.push(pr); } return out; };
  const pct = (x, d = 1) => n(100 * x, d);
  const ht = (h, t) => `${h} head${h === 1 ? '' : 's'} and ${t} tail${t === 1 ? '' : 's'}`;
  const onGrid = (x, lo, hi, s) => x >= lo - 1e-9 && x <= hi + 1e-9 && Math.abs(x / s - Math.round(x / s)) < 1e-7;

  /* ---------- 1. Bayesian updating of a coin ---------- */
  Q.bayes = [
    (r) => {
      const al = r.int(1, 8), be = r.int(1, 8), h = r.int(0, 20), t = r.int(0, 20), kind = r.int(0, 2);
      if (kind === 0) {
        return {
          q: [`The prior for a coin's heads probability is $\\operatorname{Beta}(${al}, ${be})$. You then see ${ht(h, t)}. What are the parameters of the posterior?`, `コインの表の確率の事前分布を $\\operatorname{Beta}(${al}, ${be})$ とします。表が ${h} 回、裏が ${t} 回出ました。事後分布のパラメータはいくつですか。`],
          a: { type: 'tuple', v: [al + h, be + t], labels: ["$\\alpha'$", "$\\beta'$"] },
          hint: ['The beta prior is conjugate to coin flips: each head adds one to $\\alpha$, each tail one to $\\beta$.', 'ベータ分布はコイン投げの共役事前分布です。表が1回出るごとに $\\alpha$ に1、裏が1回出るごとに $\\beta$ に1を足します。'],
          sol: [[`Prior times likelihood is $p^{${al - 1}}(1-p)^{${be - 1}}\\cdot p^{${h}}(1-p)^{${t}} = p^{${al + h - 1}}(1-p)^{${be + t - 1}}$.`, `事前分布と尤度の積は $p^{${al - 1}}(1-p)^{${be - 1}}\\cdot p^{${h}}(1-p)^{${t}} = p^{${al + h - 1}}(1-p)^{${be + t - 1}}$ です。`], [`That is the shape of $\\operatorname{Beta}(${al + h}, ${be + t})$: the data simply add to the prior counts.`, `これは $\\operatorname{Beta}(${al + h}, ${be + t})$ の形で、データは事前のカウントにそのまま加わります。`]],
          set: { alpha: al, beta: be, h, t },
        };
      }
      if (kind === 1) {
        const a = r.int(1, 30), b = r.int(1, 30);
        return {
          q: [`A posterior for a heads probability is $\\operatorname{Beta}(${a}, ${b})$. What is its mean?`, `表の確率の事後分布が $\\operatorname{Beta}(${a}, ${b})$ です。その平均はいくつですか。`],
          a: { type: 'num', v: a / (a + b), show: frac(a, a + b) },
          hint: ['The mean of $\\operatorname{Beta}(a, b)$ is the share of the total count that is heads.', '$\\operatorname{Beta}(a, b)$ の平均は、合計カウントに占める表のカウントの割合です。'],
          sol: [[`$E[p] = \\dfrac{a}{a+b} = \\dfrac{${a}}{${a + b}} = ${n(a / (a + b), 4)}$.`, `$E[p] = \\dfrac{a}{a+b} = \\dfrac{${a}}{${a + b}} = ${n(a / (a + b), 4)}$ です。`], [`It reads as ${a} effective heads out of ${a + b} effective flips.`, `実質的に ${a + b} 回中 ${a} 回が表、と読めます。`]],
        };
      }
      return {
        q: [`A prior $\\operatorname{Beta}(${al}, ${be})$ carries the same information as a flat prior $\\operatorname{Beta}(1, 1)$ plus how many imagined heads and tails?`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ は、一様な事前分布 $\\operatorname{Beta}(1, 1)$ に架空の表と裏を何回ずつ加えたものと同じ情報を持ちますか。`],
        a: { type: 'tuple', v: [al - 1, be - 1], labels: [['heads', '表'], ['tails', '裏']] },
        hint: ['Updating $\\operatorname{Beta}(1, 1)$ with $h$ heads and $t$ tails gives $\\operatorname{Beta}(1 + h, 1 + t)$.', '$\\operatorname{Beta}(1, 1)$ を表 $h$ 回、裏 $t$ 回で更新すると $\\operatorname{Beta}(1 + h, 1 + t)$ になります。'],
        sol: [[`Solve $1 + h = ${al}$ and $1 + t = ${be}$: $h = ${al - 1}$, $t = ${be - 1}$.`, `$1 + h = ${al}$、$1 + t = ${be}$ を解くと $h = ${al - 1}$、$t = ${be - 1}$ です。`], [`${al === 1 && be === 1 ? 'This is the flat prior itself: it adds nothing.' : 'A stronger prior is simply more imagined data, which real data must outweigh.'}`, `${al === 1 && be === 1 ? 'これは一様な事前分布そのもので、何も加えません。' : '強い事前分布とは架空のデータが多いということで、実際のデータがそれを上回る必要があります。'}`]],
        set: { alpha: al, beta: be, h: 0, t: 0 },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      const al = r.int(1, 8), be = r.int(1, 8);
      let h = r.int(0, 30), t = r.int(0, 30);
      if (kind === 1) { h = Math.max(h, 2 - al); t = Math.max(t, 2 - be); }
      const a = al + h, b = be + t;
      const sol0 = [`The posterior is $\\operatorname{Beta}(${al} + ${h}, ${be} + ${t}) = \\operatorname{Beta}(${a}, ${b})$.`, `事後分布は $\\operatorname{Beta}(${al} + ${h}, ${be} + ${t}) = \\operatorname{Beta}(${a}, ${b})$ です。`];
      if (kind === 0) {
        return {
          q: [`Prior $\\operatorname{Beta}(${al}, ${be})$; you observe ${ht(h, t)}. Find the posterior mean of the heads probability.`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとで、表 ${h} 回、裏 ${t} 回を観測しました。表の確率の事後平均を求めてください。`],
          a: { type: 'num', v: a / (a + b), show: frac(a, a + b) },
          hint: ['Update the counts first, then take the mean $a/(a+b)$.', 'まずカウントを更新し、それから平均 $a/(a+b)$ をとります。'],
          sol: [sol0, [`The mean is $${a}/${a + b} = ${n(a / (a + b), 4)}$.`, `平均は $${a}/${a + b} = ${n(a / (a + b), 4)}$ です。`], [h + t ? `The observed fraction is $${h}/${h + t} = ${n(h / (h + t), 4)}$; the posterior mean sits between it and the prior mean $${n(al / (al + be), 4)}$.` : 'With no data the posterior is the prior.', h + t ? `観測比率は $${h}/${h + t} = ${n(h / (h + t), 4)}$ で、事後平均はこれと事前平均 $${n(al / (al + be), 4)}$ の間にあります。` : 'データがなければ事後分布は事前分布のままです。']],
          set: { alpha: al, beta: be, h, t },
        };
      }
      if (kind === 1) {
        return {
          q: [`Prior $\\operatorname{Beta}(${al}, ${be})$; you observe ${ht(h, t)}. Find the posterior mode (the most probable heads probability).`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとで、表 ${h} 回、裏 ${t} 回を観測しました。事後分布の最頻値（最も確からしい表の確率）を求めてください。`],
          a: { type: 'num', v: (a - 1) / (a + b - 2), show: frac(a - 1, a + b - 2) },
          hint: ['For $a, b > 1$ the density $p^{a-1}(1-p)^{b-1}$ peaks where its logarithm has zero derivative.', '$a, b > 1$ のとき、密度 $p^{a-1}(1-p)^{b-1}$ は対数の導関数が 0 になる点で最大になります。'],
          sol: [sol0, [`$\\dfrac{a-1}{p} = \\dfrac{b-1}{1-p}$ gives $p = \\dfrac{a-1}{a+b-2} = \\dfrac{${a - 1}}{${a + b - 2}} = ${n((a - 1) / (a + b - 2), 4)}$.`, `$\\dfrac{a-1}{p} = \\dfrac{b-1}{1-p}$ より $p = \\dfrac{a-1}{a+b-2} = \\dfrac{${a - 1}}{${a + b - 2}} = ${n((a - 1) / (a + b - 2), 4)}$ です。`], ['With a flat prior the mode equals the observed fraction: it is the maximum-likelihood estimate.', '一様な事前分布では最頻値は観測比率に等しく、最尤推定値になります。']],
          set: { alpha: al, beta: be, h, t },
        };
      }
      const vr = a * b / ((a + b) ** 2 * (a + b + 1)), sd = Math.sqrt(vr);
      return {
        q: [`Prior $\\operatorname{Beta}(${al}, ${be})$; you observe ${ht(h, t)}. Find the posterior standard deviation of the heads probability, to three decimals.`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとで、表 ${h} 回、裏 ${t} 回を観測しました。表の確率の事後標準偏差を小数第3位まで求めてください。`],
        a: { type: 'num', v: sd, tol: 6e-4 },
        hint: ['$\\operatorname{Var}[p] = \\dfrac{ab}{(a+b)^2(a+b+1)}$ for $\\operatorname{Beta}(a, b)$.', '$\\operatorname{Beta}(a, b)$ の分散は $\\dfrac{ab}{(a+b)^2(a+b+1)}$ です。'],
        sol: [sol0, [`$\\operatorname{Var}[p] = \\dfrac{${a}\\cdot${b}}{${a + b}^2\\cdot${a + b + 1}} = ${n(vr, 5)}$, so the standard deviation is $${n(sd, 4)}$.`, `$\\operatorname{Var}[p] = \\dfrac{${a}\\cdot${b}}{${a + b}^2\\cdot${a + b + 1}} = ${n(vr, 5)}$ なので、標準偏差は $${n(sd, 4)}$ です。`], ['It shrinks roughly like $1/\\sqrt{a+b}$: four times the data halves the uncertainty.', 'これはおよそ $1/\\sqrt{a+b}$ のように縮みます。データを4倍にすると不確かさは半分になります。']],
        set: { alpha: al, beta: be, h, t },
      };
    },
    (r) => {
      const kind = r.int(0, 3), al = r.int(1, 8), be = r.int(1, 8);
      if (kind === 0) {
        const N = r.int(6, 30), h = r.int(0, N), a = al + h, tot = al + be + N, g = gcd(a, tot);
        return {
          q: [`With prior $\\operatorname{Beta}(${al}, ${be})$ you flip a coin ${N} times, and the posterior mean of its heads probability comes out as $${frac(a, tot)}$. How many heads did you see?`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとでコインを ${N} 回投げたところ、表の確率の事後平均が $${frac(a, tot)}$ になりました。表は何回出ましたか。`],
          a: { type: 'int', v: h },
          hint: ['After $N$ flips the posterior is $\\operatorname{Beta}(\\alpha + h, \\beta + N - h)$, whose total count is fixed.', '$N$ 回投げた後の事後分布は $\\operatorname{Beta}(\\alpha + h, \\beta + N - h)$ で、合計カウントは決まっています。'],
          sol: [[`The posterior mean is $\\dfrac{${al} + h}{${al} + ${be} + ${N}} = \\dfrac{${al} + h}{${tot}}$.`, `事後平均は $\\dfrac{${al} + h}{${al} + ${be} + ${N}} = \\dfrac{${al} + h}{${tot}}$ です。`], [`Setting it to $${frac(a, tot)}$ gives $${al} + h = ${tot}\\cdot${frac(a, tot)} = ${a}$${g > 1 ? ' (the fraction was reduced)' : ''}, so $h = ${h}$.`, `これを $${frac(a, tot)}$ とおくと $${al} + h = ${tot}\\cdot${frac(a, tot)} = ${a}$${g > 1 ? '（分数は約分されていました）' : ''} なので $h = ${h}$ です。`], ['Because the total count is known, a posterior mean pins down the data exactly.', '合計カウントがわかっているので、事後平均からデータが正確に決まります。']],
          set: { alpha: al, beta: be, h, t: N - h },
        };
      }
      if (kind === 1) {
        const N = r.int(2, 30), h = r.int(0, N), w = (al + be) / (al + be + N);
        return {
          q: [`Prior $\\operatorname{Beta}(${al}, ${be})$, then ${h} heads in ${N} flips. The posterior mean is a weighted average $w\\cdot(\\text{prior mean}) + (1 - w)\\cdot(\\text{observed fraction})$. Find the weight $w$ on the prior.`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ で ${N} 回中 ${h} 回が表でした。事後平均は加重平均 $w\\cdot(\\text{事前平均}) + (1 - w)\\cdot(\\text{観測比率})$ です。事前分布への重み $w$ を求めてください。`],
          a: { type: 'num', v: w, show: frac(al + be, al + be + N) },
          hint: ['Write $\\dfrac{\\alpha + h}{\\alpha + \\beta + N}$ as a combination of $\\dfrac{\\alpha}{\\alpha+\\beta}$ and $\\dfrac{h}{N}$.', '$\\dfrac{\\alpha + h}{\\alpha + \\beta + N}$ を $\\dfrac{\\alpha}{\\alpha+\\beta}$ と $\\dfrac{h}{N}$ の組み合わせとして書いてください。'],
          sol: [[`$\\dfrac{\\alpha + h}{\\alpha + \\beta + N} = \\dfrac{\\alpha + \\beta}{\\alpha + \\beta + N}\\cdot\\dfrac{\\alpha}{\\alpha + \\beta} + \\dfrac{N}{\\alpha + \\beta + N}\\cdot\\dfrac{h}{N}$.`, `$\\dfrac{\\alpha + h}{\\alpha + \\beta + N} = \\dfrac{\\alpha + \\beta}{\\alpha + \\beta + N}\\cdot\\dfrac{\\alpha}{\\alpha + \\beta} + \\dfrac{N}{\\alpha + \\beta + N}\\cdot\\dfrac{h}{N}$ です。`], [`So $w = \\dfrac{${al + be}}{${al + be + N}} = ${n(w, 4)}$.`, `したがって $w = \\dfrac{${al + be}}{${al + be + N}} = ${n(w, 4)}$ です。`], ['The weight depends only on how much data there is, not on what it says: the prior counts as $\\alpha + \\beta$ flips.', '重みはデータの中身ではなく量だけで決まります。事前分布は $\\alpha + \\beta$ 回分の試行として数えられます。']],
          set: { alpha: al, beta: be, h, t: N - h },
        };
      }
      if (kind === 2) {
        return {
          q: [`Prior $\\operatorname{Beta}(${al}, ${be})$. Every one of $n$ flips lands heads. Write the posterior mean of the heads probability as a function of $n$.`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとで、$n$ 回投げてすべて表でした。表の確率の事後平均を $n$ の式で表してください。`],
          a: { type: 'expr', v: `(${al}+n)/(${al + be}+n)`, vars: ['n'], dom: { n: [1, 30] }, lhs: ['$E[p \\mid n \\text{ heads}] =$', '$E[p \\mid \\text{表 } n \\text{ 回}] =$'] },
          hint: ['All heads means $h = n$ and $t = 0$.', 'すべて表なので $h = n$、$t = 0$ です。'],
          sol: [[`The posterior is $\\operatorname{Beta}(${al} + n, ${be})$.`, `事後分布は $\\operatorname{Beta}(${al} + n, ${be})$ です。`], [`Its mean is $\\dfrac{${al} + n}{${al + be} + n}$.`, `その平均は $\\dfrac{${al} + n}{${al + be} + n}$ です。`], [`It tends to 1 but never reaches it: after any finite run of heads, the prior's ${be} effective tail${be > 1 ? 's' : ''} keep tails possible.`, `1 に近づきますが到達はしません。表が何回続いても、事前分布の実質 ${be} 回分の裏が、裏の可能性を残し続けます。`]],
          set: { alpha: al, beta: be, h: r.int(1, 30), t: 0 },
        };
      }
      const h = r.int(0, 12), t = r.int(0, 12), a = al + h, b = be + t;
      return {
        q: [`Prior $\\operatorname{Beta}(${al}, ${be})$, then ${ht(h, t)}. What is the probability that the next two flips are both heads?`, `事前分布 $\\operatorname{Beta}(${al}, ${be})$ のもとで、表 ${h} 回、裏 ${t} 回を観測しました。次の2回がどちらも表になる確率はいくつですか。`],
        a: { type: 'num', v: a * (a + 1) / ((a + b) * (a + b + 1)), show: frac(a * (a + 1), (a + b) * (a + b + 1)) },
        hint: ['Predict the first flip, then update on it before predicting the second.', '1回目を予測し、その結果で更新してから2回目を予測します。'],
        sol: [[`The posterior is $\\operatorname{Beta}(${a}, ${b})$, so the first flip is heads with probability $${frac(a, a + b)}$.`, `事後分布は $\\operatorname{Beta}(${a}, ${b})$ なので、1回目が表になる確率は $${frac(a, a + b)}$ です。`], [`Given that, the posterior becomes $\\operatorname{Beta}(${a + 1}, ${b})$ and the second is heads with probability $${frac(a + 1, a + b + 1)}$.`, `その後、事後分布は $\\operatorname{Beta}(${a + 1}, ${b})$ になり、2回目が表になる確率は $${frac(a + 1, a + b + 1)}$ です。`], [`The product is $${frac(a * (a + 1), (a + b) * (a + b + 1))} \\approx ${n(a * (a + 1) / ((a + b) * (a + b + 1)), 4)}$, larger than $(${frac(a, a + b)})^2$: one head makes the next more likely because the bias is uncertain.`, `積は $${frac(a * (a + 1), (a + b) * (a + b + 1))} \\approx ${n(a * (a + 1) / ((a + b) * (a + b + 1)), 4)}$ で、$(${frac(a, a + b)})^2$ より大きくなります。偏りが不確かなので、表が1回出ると次も表らしくなるからです。`]],
        set: { alpha: al, beta: be, h, t },
      };
    },
  ];

  /* ---------- 2. standardized binomial sums ---------- */
  Q.clt = [
    (r) => {
      const N = r.int(4, 60), p = r.step(0.1, 0.9, 0.05), q = 1 - p, kind = r.int(0, 2);
      if (kind === 0) {
        return {
          q: [`$S_n$ counts successes in $n = ${N}$ independent trials with success probability $p = ${n(p)}$. Give its mean and variance.`, `$S_n$ は成功確率 $p = ${n(p)}$ の独立な試行 $n = ${N}$ 回での成功回数です。平均と分散を答えてください。`],
          a: { type: 'tuple', v: [N * p, N * p * q], labels: ['$E[S_n]$', '$\\operatorname{Var}(S_n)$'] },
          hint: ['Each trial has mean $p$ and variance $p(1-p)$; means and variances of independent terms add.', '各試行の平均は $p$、分散は $p(1-p)$ で、独立な項の平均と分散は足し合わされます。'],
          sol: [[`$E[S_n] = np = ${N}\\cdot${n(p)} = ${n(N * p)}$.`, `$E[S_n] = np = ${N}\\cdot${n(p)} = ${n(N * p)}$ です。`], [`$\\operatorname{Var}(S_n) = np(1-p) = ${n(N * p)}\\cdot${n(q)} = ${n(N * p * q)}$, so $\\sigma = ${n(Math.sqrt(N * p * q), 4)}$ is the unit the figure uses to standardize.`, `$\\operatorname{Var}(S_n) = np(1-p) = ${n(N * p)}\\cdot${n(q)} = ${n(N * p * q)}$ で、$\\sigma = ${n(Math.sqrt(N * p * q), 4)}$ が図で標準化に使う単位です。`]],
          set: { n: N, p },
        };
      }
      if (kind === 1) {
        const sd = Math.sqrt(N * p * q), k = Math.min(N, Math.max(0, Math.round(N * p + r.pick([-2, -1.5, -1, 1, 1.5, 2]) * sd)));
        const z = (k - N * p) / sd;
        return {
          q: [`For $n = ${N}$ trials with $p = ${n(p)}$, what is the standardized value $Z_n$ of the outcome $S_n = ${k}$? Give two decimals.`, `$n = ${N}$ 回、$p = ${n(p)}$ の試行で、結果 $S_n = ${k}$ を標準化した値 $Z_n$ はいくつですか（小数第2位まで）。`],
          a: { type: 'num', v: z, tol: 0.006 },
          hint: ['Subtract the mean $np$ and divide by $\\sqrt{np(1-p)}$.', '平均 $np$ を引き、$\\sqrt{np(1-p)}$ で割ります。'],
          sol: [[`$np = ${n(N * p)}$ and $\\sqrt{np(1-p)} = \\sqrt{${n(N * p * q)}} = ${n(sd, 4)}$.`, `$np = ${n(N * p)}$、$\\sqrt{np(1-p)} = \\sqrt{${n(N * p * q)}} = ${n(sd, 4)}$ です。`], [`$Z_n = (${k} - ${n(N * p)})/${n(sd, 4)} = ${n(z, 3)}$: the outcome lies ${n(Math.abs(z), 2)} standard deviations ${z >= 0 ? 'above' : 'below'} the mean.`, `$Z_n = (${k} - ${n(N * p)})/${n(sd, 4)} = ${n(z, 3)}$ で、平均より標準偏差 ${n(Math.abs(z), 2)} 個分${z >= 0 ? '上' : '下'}にあります。`]],
          set: { n: N, p },
        };
      }
      return {
        q: [`The central limit theorem says $Z_n = (S_n - np)/\\sqrt{np(1-p)}$ approaches $N(0, 1)$ for $n = ${N}$ and beyond. What exactly becomes approximately normal?`, `中心極限定理によれば、$n = ${N}$ 以上で $Z_n = (S_n - np)/\\sqrt{np(1-p)}$ は $N(0, 1)$ に近づきます。正確には何が近似的に正規分布になるのでしょうか。`],
        a: { type: 'choice', opts: [['The distribution of the standardized sum $Z_n$.', '標準化した和 $Z_n$ の分布。'], ['Each individual trial, which becomes a normal variable.', '個々の試行。それぞれが正規変数になります。'], ['The sample, whose histogram of 0s and 1s becomes bell-shaped.', '標本。0 と 1 のヒストグラムが釣鐘型になります。'], ['The success probability $p$, which becomes normally distributed.', '成功確率 $p$。それ自体が正規分布に従うようになります。']], v: 0 },
        hint: ['A single trial can only be 0 or 1, whatever $n$ is.', '試行1回の結果は、$n$ がいくつでも 0 か 1 だけです。'],
        sol: [['Each trial stays Bernoulli: its values are 0 and 1 for every $n$.', '各試行はベルヌーイ分布のままで、どの $n$ でも値は 0 と 1 です。'], ['What converges is the law of the sum after centring and scaling, which is what the bars in the figure show.', '収束するのは、中心化して尺度を合わせた和の分布で、図の棒が示しているのはそれです。']],
        set: { n: N, p },
      };
    },
    (r) => {
      const N = r.int(20, 60), p = r.step(0.2, 0.8, 0.05), q = 1 - p, sd = Math.sqrt(N * p * q), mu = N * p, pm = binPmf(N, p), kind = r.int(0, 2);
      const exact = (lo, hi) => { let s = 0; for (let k = Math.max(0, lo); k <= Math.min(N, hi); k++) s += pm[k]; return s; };
      if (kind === 0) {
        const k = Math.round(mu + r.real(-1.6, 1.6) * sd), z = (k + 0.5 - mu) / sd, v = Phi(z);
        return {
          q: [`$S_n$ is binomial with $n = ${N}$, $p = ${n(p)}$. Use the normal approximation with continuity correction to estimate $P(S_n \\le ${k})$, to three decimals.`, `$S_n$ は $n = ${N}$、$p = ${n(p)}$ の二項分布に従います。連続性補正つきの正規近似で $P(S_n \\le ${k})$ を小数第3位まで求めてください。`],
          a: { type: 'num', v, tol: 0.002 },
          hint: ['Replace the bars up to $k$ by the normal area up to $k + \\tfrac12$.', '$k$ までの棒を、$k + \\tfrac12$ までの正規分布の面積で置き換えます。'],
          sol: [[`$np = ${n(mu)}$, $\\sigma = \\sqrt{${n(N * p * q)}} = ${n(sd, 4)}$.`, `$np = ${n(mu)}$、$\\sigma = \\sqrt{${n(N * p * q)}} = ${n(sd, 4)}$ です。`], [`$z = (${k} + 0.5 - ${n(mu)})/${n(sd, 4)} = ${n(z, 3)}$, so $P \\approx \\Phi(${n(z, 3)}) = ${n(v, 4)}$.`, `$z = (${k} + 0.5 - ${n(mu)})/${n(sd, 4)} = ${n(z, 3)}$ なので $P \\approx \\Phi(${n(z, 3)}) = ${n(v, 4)}$ です。`], [`The exact binomial sum is $${n(exact(0, k), 4)}$; the gap is the kind of error the right-hand panel tracks.`, `厳密な二項確率の和は $${n(exact(0, k), 4)}$ で、この差が右の図で追っている誤差の一例です。`]],
          set: { n: N, p },
        };
      }
      if (kind === 1) {
        const k = Math.round(mu + r.real(-1, 2) * sd), z = (k - 0.5 - mu) / sd, v = 1 - Phi(z);
        return {
          q: [`A multiple-choice quiz has ${N} questions with ${p === 0.25 ? 'four options each' : `a ${n(p)} chance of guessing each one right`}. Estimate the probability of at least ${k} correct by pure guessing, using the normal approximation with continuity correction (three decimals).`, `${N} 問のテストで、各問を当て推量で正解する確率は ${n(p)} です。当て推量だけで ${k} 問以上正解する確率を、連続性補正つきの正規近似で小数第3位まで求めてください。`],
          a: { type: 'num', v, tol: 0.002 },
          hint: ['"At least $k$" starts at the bar for $k$, whose left edge is $k - \\tfrac12$.', '「$k$ 以上」は $k$ の棒から始まり、その左端は $k - \\tfrac12$ です。'],
          sol: [[`$S_n \\sim \\operatorname{Bin}(${N}, ${n(p)})$: mean $${n(mu)}$, $\\sigma = ${n(sd, 4)}$.`, `$S_n \\sim \\operatorname{Bin}(${N}, ${n(p)})$ で、平均 $${n(mu)}$、$\\sigma = ${n(sd, 4)}$ です。`], [`$z = (${k} - 0.5 - ${n(mu)})/${n(sd, 4)} = ${n(z, 3)}$ and $P \\approx 1 - \\Phi(${n(z, 3)}) = ${n(v, 4)}$.`, `$z = (${k} - 0.5 - ${n(mu)})/${n(sd, 4)} = ${n(z, 3)}$ で、$P \\approx 1 - \\Phi(${n(z, 3)}) = ${n(v, 4)}$ です。`], [`The exact value is $${n(exact(k, N), 4)}$.`, `厳密な値は $${n(exact(k, N), 4)}$ です。`]],
          set: { n: N, p },
        };
      }
      const a = Math.round(mu - r.real(0.3, 1.2) * sd), b = Math.round(mu + r.real(0.3, 1.2) * sd), za = (a - 0.5 - mu) / sd, zb = (b + 0.5 - mu) / sd, v = Phi(zb) - Phi(za);
      return {
        q: [`$S_n \\sim \\operatorname{Bin}(${N}, ${n(p)})$. Estimate $P(${a} \\le S_n \\le ${b})$ with the continuity-corrected normal approximation, to three decimals.`, `$S_n \\sim \\operatorname{Bin}(${N}, ${n(p)})$ のとき、$P(${a} \\le S_n \\le ${b})$ を連続性補正つきの正規近似で小数第3位まで求めてください。`],
        a: { type: 'num', v, tol: 0.002 },
        hint: ['The bars from $a$ to $b$ cover $[a - \\tfrac12, b + \\tfrac12]$.', '$a$ から $b$ までの棒は区間 $[a - \\tfrac12, b + \\tfrac12]$ を覆います。'],
        sol: [[`Mean $${n(mu)}$, $\\sigma = ${n(sd, 4)}$; the ends standardize to $${n(za, 3)}$ and $${n(zb, 3)}$.`, `平均 $${n(mu)}$、$\\sigma = ${n(sd, 4)}$ で、両端を標準化すると $${n(za, 3)}$ と $${n(zb, 3)}$ です。`], [`$\\Phi(${n(zb, 3)}) - \\Phi(${n(za, 3)}) = ${n(v, 4)}$.`, `$\\Phi(${n(zb, 3)}) - \\Phi(${n(za, 3)}) = ${n(v, 4)}$ です。`], [`Exactly, the binomial gives $${n(exact(a, b), 4)}$.`, `厳密には二項分布で $${n(exact(a, b), 4)}$ です。`]],
        set: { n: N, p },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const E = r.pick([0.02, 0.025, 0.03, 0.035, 0.04, 0.05]), p0 = r.pick([0.5, 0.5, 0.3, 0.2, 0.4]);
        const need = Math.ceil(1.96 * 1.96 * p0 * (1 - p0) / (E * E) - 1e-9);
        return {
          q: [`A poll estimates a proportion believed to be near $${n(p0)}$. How many respondents are needed for the 95% normal margin $1.96\\sqrt{p(1-p)/n}$ to be at most $${n(E)}$ (${n(E * 100)} percentage points)?`, `ある割合を世論調査で推定します。真の値は $${n(p0)}$ 付近と見込まれています。95% の正規近似の誤差幅 $1.96\\sqrt{p(1-p)/n}$ を $${n(E)}$（${n(E * 100)} ポイント）以下にするには、何人に聞く必要がありますか。`],
          a: { type: 'int', v: need },
          hint: ['Square both sides and solve for $n$, then round up.', '両辺を2乗して $n$ について解き、切り上げます。'],
          sol: [[`$n \\ge \\dfrac{1.96^2\\,p(1-p)}{E^2} = \\dfrac{3.8416\\cdot${n(p0 * (1 - p0))}}{${n(E * E)}} = ${n(1.96 * 1.96 * p0 * (1 - p0) / (E * E), 2)}$.`, `$n \\ge \\dfrac{1.96^2\\,p(1-p)}{E^2} = \\dfrac{3.8416\\cdot${n(p0 * (1 - p0))}}{${n(E * E)}} = ${n(1.96 * 1.96 * p0 * (1 - p0) / (E * E), 2)}$ です。`], [`Round up: $n = ${need}$. The margin falls like $1/\\sqrt n$, so halving it costs four times the sample.`, `切り上げて $n = ${need}$ です。誤差幅は $1/\\sqrt n$ のように減るので、半分にするには4倍の標本が必要です。`]],
        };
      }
      if (kind === 1) {
        const p = r.step(0.1, 0.9, 0.05), q = 1 - p, eps = r.pick([0.05, 0.04, 0.03, 0.1, 0.08]);
        const c = 0.4748 * (p * p + q * q) / Math.sqrt(p * q), need = Math.ceil((c / eps) ** 2 - 1e-9);
        return {
          q: [`For trials with $p = ${n(p)}$, the Berry–Esseen bound is $\\sup_z|F_n(z) - \\Phi(z)| \\le 0.4748\\,(p^2 + q^2)/\\sqrt{npq}$. What is the smallest $n$ for which this bound guarantees an error of at most $${n(eps)}$?`, `$p = ${n(p)}$ の試行について、ベリー・エッセンの上界は $\\sup_z|F_n(z) - \\Phi(z)| \\le 0.4748\\,(p^2 + q^2)/\\sqrt{npq}$ です。この上界で誤差 $${n(eps)}$ 以下が保証される最小の $n$ はいくつですか。`],
          a: { type: 'int', v: need },
          hint: ['The bound is a constant divided by $\\sqrt n$; solve for $n$ and round up.', '上界は定数を $\\sqrt n$ で割った形です。$n$ について解いて切り上げます。'],
          sol: [[`The constant is $0.4748\\cdot${n(p * p + q * q, 4)}/\\sqrt{${n(p * q, 4)}} = ${n(c, 4)}$.`, `定数は $0.4748\\cdot${n(p * p + q * q, 4)}/\\sqrt{${n(p * q, 4)}} = ${n(c, 4)}$ です。`], [`$${n(c, 4)}/\\sqrt n \\le ${n(eps)}$ needs $n \\ge (${n(c, 4)}/${n(eps)})^2 = ${n((c / eps) ** 2, 2)}$, so $n = ${need}$.`, `$${n(c, 4)}/\\sqrt n \\le ${n(eps)}$ には $n \\ge (${n(c, 4)}/${n(eps)})^2 = ${n((c / eps) ** 2, 2)}$ が必要なので $n = ${need}$ です。`], ['This is a guarantee, not the actual error: the dots in the right panel sit well below the bound.', 'これは保証であって実際の誤差ではありません。右の図の点は上界よりかなり下にあります。']],
          set: need <= 60 ? { n: need, p } : { p },
        };
      }
      if (kind === 2) {
        const p = r.pick([0.1, 0.15, 0.2, 0.8, 0.85, 0.9, 0.25, 0.75]), q = 1 - p, s = r.pick([0.5, 0.4, 0.3, 0.25, 0.2]);
        const need = Math.floor((q - p) ** 2 / (p * q * s * s)) + 1;
        return {
          q: [`The skewness of $S_n \\sim \\operatorname{Bin}(n, ${n(p)})$ is $(q - p)/\\sqrt{npq}$. How many trials are needed before the skewness is below $${n(s)}$ in size?`, `$S_n \\sim \\operatorname{Bin}(n, ${n(p)})$ の歪度は $(q - p)/\\sqrt{npq}$ です。歪度の大きさが $${n(s)}$ を下回るには、何回の試行が必要ですか。`],
          a: { type: 'int', v: need },
          hint: ['Square the inequality $|q - p|/\\sqrt{npq} < s$ and solve for $n$.', '不等式 $|q - p|/\\sqrt{npq} < s$ を2乗して $n$ について解きます。'],
          sol: [[`$|q - p| = ${n(Math.abs(q - p))}$ and $pq = ${n(p * q, 4)}$.`, `$|q - p| = ${n(Math.abs(q - p))}$、$pq = ${n(p * q, 4)}$ です。`], [`$n > \\dfrac{(q-p)^2}{pq\\,s^2} = \\dfrac{${n((q - p) ** 2, 4)}}{${n(p * q, 4)}\\cdot${n(s * s, 4)}} = ${n((q - p) ** 2 / (p * q * s * s), 3)}$, so $n = ${need}$.`, `$n > \\dfrac{(q-p)^2}{pq\\,s^2} = \\dfrac{${n((q - p) ** 2, 4)}}{${n(p * q, 4)}\\cdot${n(s * s, 4)}} = ${n((q - p) ** 2 / (p * q * s * s), 3)}$ なので $n = ${need}$ です。`], ['Lopsided coins need many more trials before their sums look symmetric, which is why the normal fit is slower there.', '偏ったコインほど和が対称に見えるまでに多くの試行が必要で、そのため正規近似の当てはまりが遅くなります。']],
          set: need <= 60 ? { n: need, p } : { p },
        };
      }
      const N = r.pick([20, 25, 40, 50, 60, 100, 400]);
      return {
        q: [`Write the standard deviation of the sample proportion $\\hat p = S_n/n$ for $n = ${N}$ trials as a function of the success probability $p$.`, `$n = ${N}$ 回の試行での標本比率 $\\hat p = S_n/n$ の標準偏差を、成功確率 $p$ の式で表してください。`],
        a: { type: 'expr', v: `sqrt(p*(1-p)/${N})`, vars: ['p'], dom: { p: [0.05, 0.95] }, lhs: ['$\\operatorname{sd}(\\hat p) =$', '$\\operatorname{sd}(\\hat p) =$'] },
        hint: ['Dividing a variable by $n$ divides its variance by $n^2$.', '変数を $n$ で割ると、分散は $n^2$ で割られます。'],
        sol: [[`$\\operatorname{Var}(S_n) = ${N}p(1-p)$, so $\\operatorname{Var}(\\hat p) = ${N}p(1-p)/${N}^2 = p(1-p)/${N}$.`, `$\\operatorname{Var}(S_n) = ${N}p(1-p)$ なので $\\operatorname{Var}(\\hat p) = ${N}p(1-p)/${N}^2 = p(1-p)/${N}$ です。`], [`$\\operatorname{sd}(\\hat p) = \\sqrt{p(1-p)/${N}}$, largest at $p = \\tfrac12$, where it equals $${n(0.5 / Math.sqrt(N), 4)}$: a fair coin is the hardest case to pin down.`, `$\\operatorname{sd}(\\hat p) = \\sqrt{p(1-p)/${N}}$ で、$p = \\tfrac12$ で最大の $${n(0.5 / Math.sqrt(N), 4)}$ になります。公平なコインが最も絞り込みにくい場合です。`]],
        set: N <= 60 ? { n: N } : undefined,
      };
    },
  ];

  /* ---------- 3. conditional probability and Bayes' theorem ---------- */
  Q.conditional = [
    (r) => {
      const b = r.step(0.1, 0.9, 0.05), a1 = r.step(0, 1, 0.05), a0 = r.step(0, 1, 0.05), kind = r.int(0, 2);
      if (kind === 0) {
        return {
          q: [`$P(B) = ${n(b)}$ and $P(A \\mid B) = ${n(a1)}$. What is $P(A \\cap B)$?`, `$P(B) = ${n(b)}$、$P(A \\mid B) = ${n(a1)}$ です。$P(A \\cap B)$ はいくつですか。`],
          a: { type: 'num', v: b * a1 },
          hint: ['In the square, $A \\cap B$ is a rectangle: width $P(B)$, height $P(A \\mid B)$.', '正方形の図で $A \\cap B$ は長方形で、幅が $P(B)$、高さが $P(A \\mid B)$ です。'],
          sol: [[`$P(A \\cap B) = P(A \\mid B)P(B) = ${n(a1)}\\cdot${n(b)} = ${n(a1 * b)}$.`, `$P(A \\cap B) = P(A \\mid B)P(B) = ${n(a1)}\\cdot${n(b)} = ${n(a1 * b)}$ です。`], ['This is the definition of conditional probability read backwards: the multiplication rule.', 'これは条件付き確率の定義を逆向きに読んだもので、乗法定理です。']],
          set: { b, inside: a1, outside: a0 },
        };
      }
      if (kind === 1) {
        const pA = b * a1 + (1 - b) * a0;
        return {
          q: [`$P(B) = ${n(b)}$, $P(A \\mid B) = ${n(a1)}$ and $P(A \\mid B^c) = ${n(a0)}$. Find $P(A)$.`, `$P(B) = ${n(b)}$、$P(A \\mid B) = ${n(a1)}$、$P(A \\mid B^c) = ${n(a0)}$ です。$P(A)$ を求めてください。`],
          a: { type: 'num', v: pA },
          hint: ['Split $A$ into the part inside $B$ and the part outside.', '$A$ を $B$ の内側と外側に分けます。'],
          sol: [[`$P(A) = P(A \\mid B)P(B) + P(A \\mid B^c)P(B^c) = ${n(a1)}\\cdot${n(b)} + ${n(a0)}\\cdot${n(1 - b)}$.`, `$P(A) = P(A \\mid B)P(B) + P(A \\mid B^c)P(B^c) = ${n(a1)}\\cdot${n(b)} + ${n(a0)}\\cdot${n(1 - b)}$ です。`], [`$= ${n(a1 * b, 4)} + ${n(a0 * (1 - b), 4)} = ${n(pA, 4)}$: the two coloured areas in the square.`, `$= ${n(a1 * b, 4)} + ${n(a0 * (1 - b), 4)} = ${n(pA, 4)}$ で、正方形の2つの色の面積の和です。`]],
          set: { b, inside: a1, outside: a0 },
        };
      }
      const same = r.chance(0.4), o = same ? a1 : Math.abs(a0 - a1) > 1e-9 ? a0 : Math.round((a1 >= 0.9 ? a1 - 0.1 : a1 + 0.1) * 20) / 20;
      return {
        q: [`$P(B) = ${n(b)}$, $P(A \\mid B) = ${n(a1)}$ and $P(A \\mid B^c) = ${n(o)}$. Are $A$ and $B$ independent?`, `$P(B) = ${n(b)}$、$P(A \\mid B) = ${n(a1)}$、$P(A \\mid B^c) = ${n(o)}$ です。$A$ と $B$ は独立ですか。`],
        a: { type: 'choice', opts: [['Yes: knowing $B$ does not change the probability of $A$.', 'はい。$B$ を知っても $A$ の確率は変わりません。'], ['No: the probability of $A$ depends on whether $B$ happened.', 'いいえ。$A$ の確率は $B$ が起きたかどうかで変わります。']], v: same ? 0 : 1, fixed: true },
        hint: ['Independence means $P(A \\mid B) = P(A)$; compare the two heights.', '独立とは $P(A \\mid B) = P(A)$ のことです。2つの高さを比べてください。'],
        sol: [[`$P(A) = ${n(a1)}\\cdot${n(b)} + ${n(o)}\\cdot${n(1 - b)} = ${n(a1 * b + o * (1 - b), 4)}$.`, `$P(A) = ${n(a1)}\\cdot${n(b)} + ${n(o)}\\cdot${n(1 - b)} = ${n(a1 * b + o * (1 - b), 4)}$ です。`], [same ? 'The heights inside and outside $B$ are equal, so $P(A \\mid B) = P(A)$: independent.' : 'The heights inside and outside $B$ differ, so $P(A \\mid B) \\ne P(A)$: dependent.', same ? '$B$ の内外で高さが等しいので $P(A \\mid B) = P(A)$ となり、独立です。' : '$B$ の内外で高さが異なるので $P(A \\mid B) \\ne P(A)$ となり、独立ではありません。']],
        set: { b, inside: a1, outside: o },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const b = r.step(0.1, 0.9, 0.05), a1 = r.step(0.05, 1, 0.05), a0 = r.step(0.05, 1, 0.05), pA = b * a1 + (1 - b) * a0;
        return {
          q: [`$P(B) = ${n(b)}$, $P(A \\mid B) = ${n(a1)}$ and $P(A \\mid B^c) = ${n(a0)}$. Find $P(B \\mid A)$, to three decimals.`, `$P(B) = ${n(b)}$、$P(A \\mid B) = ${n(a1)}$、$P(A \\mid B^c) = ${n(a0)}$ です。$P(B \\mid A)$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: b * a1 / pA, tol: 6e-4 },
          hint: ['Same numerator $P(A \\cap B)$, but divide by $P(A)$ this time.', '分子は同じ $P(A \\cap B)$ で、今度は $P(A)$ で割ります。'],
          sol: [[`$P(A \\cap B) = ${n(b * a1, 4)}$ and $P(A) = ${n(b * a1, 4)} + ${n((1 - b) * a0, 4)} = ${n(pA, 4)}$.`, `$P(A \\cap B) = ${n(b * a1, 4)}$、$P(A) = ${n(b * a1, 4)} + ${n((1 - b) * a0, 4)} = ${n(pA, 4)}$ です。`], [`$P(B \\mid A) = ${n(b * a1, 4)}/${n(pA, 4)} = ${n(b * a1 / pA, 4)}$, compared with $P(A \\mid B) = ${n(a1)}$: conditioning is not symmetric.`, `$P(B \\mid A) = ${n(b * a1, 4)}/${n(pA, 4)} = ${n(b * a1 / pA, 4)}$ で、$P(A \\mid B) = ${n(a1)}$ とは異なります。条件付けは対称ではありません。`]],
          set: { b, inside: a1, outside: a0 },
        };
      }
      const prev = r.step(0.1, 0.3, 0.05), sens = r.step(0.8, 0.95, 0.05), spec = r.step(0.8, 0.95, 0.05), fp = Math.round((1 - spec) * 100) / 100;
      const pos = prev * sens + (1 - prev) * fp;
      if (kind === 1) {
        const ppv = prev * sens / pos;
        return {
          q: [`In a clinic, ${pct(prev, 0)}% of patients tested have the condition. The test detects ${pct(sens, 0)}% of true cases (sensitivity) and correctly clears ${pct(spec, 0)}% of healthy patients (specificity). A patient tests positive. What is the probability they have the condition? Three decimals.`, `ある診療所で検査を受ける患者の ${pct(prev, 0)}% がその病気を持っています。検査は真の患者の ${pct(sens, 0)}% を検出し（感度）、健康な人の ${pct(spec, 0)}% を正しく陰性とします（特異度）。陽性と出た患者が実際に病気である確率を小数第3位まで求めてください。`],
          a: { type: 'num', v: ppv, tol: 6e-4 },
          hint: ['Let $B$ = has the condition and $A$ = tests positive. The false-positive rate is $1 - \\text{specificity}$.', '$B$ を「病気である」、$A$ を「陽性」とします。偽陽性率は $1 - \\text{特異度}$ です。'],
          sol: [[`$P(+) = ${n(sens)}\\cdot${n(prev)} + ${n(fp)}\\cdot${n(1 - prev)} = ${n(prev * sens, 4)} + ${n((1 - prev) * fp, 4)} = ${n(pos, 4)}$.`, `$P(+) = ${n(sens)}\\cdot${n(prev)} + ${n(fp)}\\cdot${n(1 - prev)} = ${n(prev * sens, 4)} + ${n((1 - prev) * fp, 4)} = ${n(pos, 4)}$ です。`], [`$P(\\text{condition} \\mid +) = ${n(prev * sens, 4)}/${n(pos, 4)} = ${n(ppv, 4)}$.`, `$P(\\text{病気} \\mid +) = ${n(prev * sens, 4)}/${n(pos, 4)} = ${n(ppv, 4)}$ です。`], [`Out of 1000 patients: ${n(1000 * prev * sens, 1)} true positives against ${n(1000 * (1 - prev) * fp, 1)} false ones. The positive predictive value is only ${pct(ppv)}% even though the test is ${pct(sens, 0)}% sensitive.`, `患者 1000 人あたり、真の陽性 ${n(1000 * prev * sens, 1)} 人に対して偽陽性が ${n(1000 * (1 - prev) * fp, 1)} 人です。感度が ${pct(sens, 0)}% でも、陽性的中率は ${pct(ppv)}% にとどまります。`]],
          set: { b: prev, inside: sens, outside: fp },
        };
      }
      const neg = 1 - pos, miss = prev * (1 - sens) / neg;
      return {
        q: [`Prevalence ${pct(prev, 0)}%, sensitivity ${pct(sens, 0)}%, specificity ${pct(spec, 0)}%. A patient tests negative. What is the probability they still have the condition? Three decimals.`, `有病率 ${pct(prev, 0)}%、感度 ${pct(sens, 0)}%、特異度 ${pct(spec, 0)}% の検査で、ある患者が陰性でした。それでも病気である確率を小数第3位まで求めてください。`],
        a: { type: 'num', v: miss, tol: 6e-4 },
        hint: ['Now condition on $A^c$: divide the missed cases by everyone who tests negative.', '今度は $A^c$ で条件付けます。見逃された患者数を、陰性と出た全員の数で割ります。'],
        sol: [[`Missed cases: $P(B \\cap A^c) = ${n(prev)}\\cdot${n(1 - sens)} = ${n(prev * (1 - sens), 4)}$.`, `見逃し：$P(B \\cap A^c) = ${n(prev)}\\cdot${n(1 - sens)} = ${n(prev * (1 - sens), 4)}$ です。`], [`$P(A^c) = 1 - P(A) = 1 - ${n(pos, 4)} = ${n(neg, 4)}$, so $P(B \\mid A^c) = ${n(prev * (1 - sens), 4)}/${n(neg, 4)} = ${n(miss, 4)}$.`, `$P(A^c) = 1 - P(A) = 1 - ${n(pos, 4)} = ${n(neg, 4)}$ なので $P(B \\mid A^c) = ${n(prev * (1 - sens), 4)}/${n(neg, 4)} = ${n(miss, 4)}$ です。`], [`A negative result lowers the risk from ${pct(prev, 0)}% to ${pct(miss)}%, but does not make it zero.`, `陰性の結果でリスクは ${pct(prev, 0)}% から ${pct(miss)}% に下がりますが、0 にはなりません。`]],
        set: { b: prev, inside: sens, outside: fp },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const prev = r.pick([0.001, 0.002, 0.005, 0.01, 0.02]), sens = r.pick([0.9, 0.95, 0.99]), spec = r.pick([0.95, 0.98, 0.99, 0.995]);
        const tp = prev * sens, fpos = (1 - prev) * (1 - spec), ppv = tp / (tp + fpos), N = 100000;
        return {
          q: [`A screening test for a rare condition with prevalence ${pct(prev, 1)}% has sensitivity ${pct(sens, 0)}% and specificity ${pct(spec, 1)}%. What fraction of positive results are true positives? Give three significant figures.`, `有病率 ${pct(prev, 1)}% のまれな病気のスクリーニング検査があり、感度は ${pct(sens, 0)}%、特異度は ${pct(spec, 1)}% です。陽性の結果のうち、真の陽性の割合はいくつですか（有効数字3桁）。`],
          a: { type: 'num', v: ppv, rel: 0.003 },
          hint: ['Imagine 100,000 people and count true and false positives separately.', '10万人を想定し、真の陽性と偽陽性を別々に数えてください。'],
          sol: [[`Of ${N.toLocaleString('en')} people, ${n(N * prev)} have the condition and ${n(N * tp, 1)} of them test positive.`, `10万人のうち ${n(N * prev)} 人が病気で、そのうち ${n(N * tp, 1)} 人が陽性になります。`], [`Of the ${n(N * (1 - prev))} healthy people, ${n(N * fpos, 1)} test positive falsely.`, `健康な ${n(N * (1 - prev))} 人のうち ${n(N * fpos, 1)} 人が誤って陽性になります。`], [`$P(\\text{condition} \\mid +) = ${n(N * tp, 1)}/(${n(N * tp, 1)} + ${n(N * fpos, 1)}) = ${n(ppv, 4)}$. When the condition is rare, false positives from the large healthy group can outnumber the true ones.`, `$P(\\text{病気} \\mid +) = ${n(N * tp, 1)}/(${n(N * tp, 1)} + ${n(N * fpos, 1)}) = ${n(ppv, 4)}$ です。病気がまれだと、大きな健康な集団からの偽陽性が真の陽性を上回ることがあります。`]],
        };
      }
      if (kind === 1) {
        const pairs = [[0.9, 0.1], [0.8, 0.2], [0.85, 0.15], [0.95, 0.05], [0.9, 0.3], [0.75, 0.25], [0.8, 0.1], [0.95, 0.15], [0.6, 0.2], [0.9, 0.15]];
        const [s, f] = r.pick(pairs), b = f / (s + f);
        const ok = onGrid(b, 0.1, 0.9, 0.05);
        return {
          q: [`A test has $P(+ \\mid \\text{condition}) = ${n(s)}$ and false-positive rate $P(+ \\mid \\text{healthy}) = ${n(f)}$. At what prevalence is a positive result exactly a coin flip, $P(\\text{condition} \\mid +) = \\tfrac12$?`, `ある検査で $P(+ \\mid \\text{病気}) = ${n(s)}$、偽陽性率 $P(+ \\mid \\text{健康}) = ${n(f)}$ です。陽性のときの病気の確率がちょうど $\\tfrac12$ になる有病率はいくつですか。`],
          a: { type: 'num', v: b, show: frac(Math.round(f * 100), Math.round((s + f) * 100)) },
          hint: ['$P(\\text{condition} \\mid +) = \\tfrac12$ means true positives and false positives are equally common.', '$\\tfrac12$ になるのは、真の陽性と偽陽性が同じ頻度のときです。'],
          sol: [[`Set $${n(s)}\\,b = ${n(f)}\\,(1 - b)$, the two areas of the square equal.`, `正方形の2つの面積を等しくおいて $${n(s)}\\,b = ${n(f)}\\,(1 - b)$ とします。`], [`$b = \\dfrac{${n(f)}}{${n(s)} + ${n(f)}} = ${n(b, 4)}$.`, `$b = \\dfrac{${n(f)}}{${n(s)} + ${n(f)}} = ${n(b, 4)}$ です。`], ['Below this prevalence most positives are false; above it most are true.', 'この有病率より低いと陽性の大半は偽陽性で、高いと大半が真の陽性です。']],
          set: ok ? { b, inside: s, outside: f } : { inside: s, outside: f },
        };
      }
      if (kind === 2) {
        const prev = r.pick([0.01, 0.02, 0.05, 0.1]), sens = r.pick([0.9, 0.95, 0.99]), spec = r.pick([0.9, 0.95, 0.98]);
        const LR = sens / (1 - spec), o0 = prev / (1 - prev), o2 = o0 * LR * LR, p2 = o2 / (1 + o2), p1 = o0 * LR / (1 + o0 * LR);
        return {
          q: [`Prevalence ${pct(prev, 0)}%, sensitivity ${pct(sens, 0)}%, specificity ${pct(spec, 0)}%. A patient tests positive twice, and the two results are independent given the patient's true status. What is the probability they have the condition now? Three decimals.`, `有病率 ${pct(prev, 0)}%、感度 ${pct(sens, 0)}%、特異度 ${pct(spec, 0)}% の検査で、ある患者が2回陽性になりました。2回の結果は真の状態を条件として独立とします。この患者が病気である確率を小数第3位まで求めてください。`],
          a: { type: 'num', v: p2, tol: 6e-4 },
          hint: ['In odds form each positive multiplies the odds by the likelihood ratio $\\text{sens}/(1 - \\text{spec})$.', 'オッズで考えると、陽性1回ごとにオッズが尤度比 $\\text{感度}/(1 - \\text{特異度})$ 倍になります。'],
          sol: [[`Prior odds $${n(prev)}/${n(1 - prev)} = ${n(o0, 4)}$; likelihood ratio $${n(sens)}/${n(1 - spec)} = ${n(LR, 4)}$.`, `事前オッズは $${n(prev)}/${n(1 - prev)} = ${n(o0, 4)}$、尤度比は $${n(sens)}/${n(1 - spec)} = ${n(LR, 4)}$ です。`], [`After two positives the odds are $${n(o0, 4)}\\cdot${n(LR, 4)}^2 = ${n(o2, 4)}$, so the probability is $${n(o2, 4)}/(1 + ${n(o2, 4)}) = ${n(p2, 4)}$.`, `2回陽性の後のオッズは $${n(o0, 4)}\\cdot${n(LR, 4)}^2 = ${n(o2, 4)}$ なので、確率は $${n(o2, 4)}/(1 + ${n(o2, 4)}) = ${n(p2, 4)}$ です。`], [`After one positive it was only $${n(p1, 4)}$: yesterday's posterior is today's prior, which is why confirmatory testing works.`, `1回目の陽性の後は $${n(p1, 4)}$ にすぎませんでした。前回の事後確率が次の事前確率になるので、確認検査が有効なのです。`]],
          set: prev >= 0.1 && onGrid(1 - spec, 0, 1, 0.05) ? { b: prev, inside: sens, outside: Math.round((1 - spec) * 20) / 20 } : undefined,
        };
      }
      const sens = r.pick([0.95, 0.99, 0.9]), prev = r.pick([0.001, 0.01, 0.005]), spec = sens;
      const ppv = prev * sens / (prev * sens + (1 - prev) * (1 - spec));
      return {
        q: [`A test is ${pct(sens, 0)}% sensitive and ${pct(spec, 0)}% specific, and ${pct(prev, 1)}% of the people tested have the condition. Someone says "a positive result means a ${pct(sens, 0)}% chance of having it." What is wrong?`, `感度 ${pct(sens, 0)}%、特異度 ${pct(spec, 0)}% の検査があり、受検者の ${pct(prev, 1)}% が病気です。ある人が「陽性なら ${pct(sens, 0)}% の確率で病気だ」と言いました。何が誤りでしょうか。`],
        a: { type: 'choice', opts: [[`It confuses $P(+ \\mid \\text{condition})$ with $P(\\text{condition} \\mid +)$; with this base rate the latter is about ${pct(ppv, 0)}%.`, `$P(+ \\mid \\text{病気})$ と $P(\\text{病気} \\mid +)$ を取り違えています。この有病率では後者は約 ${pct(ppv, 0)}% です。`], ['Nothing: sensitivity is by definition the chance a positive patient is ill.', '誤りはありません。感度は定義上、陽性の人が病気である確率です。'], [`It should use the specificity: the chance is ${pct(spec, 0)}% only for negatives.`, `特異度を使うべきで、${pct(spec, 0)}% が当てはまるのは陰性の場合だけです。`], [`It should be $1 - ${n(prev)}$, the chance of being healthy.`, `健康である確率 $1 - ${n(prev)}$ を使うべきです。`]], v: 0 },
        hint: ['Which way round is the conditioning in "sensitivity"?', '「感度」での条件付けはどちら向きでしょうか。'],
        sol: [['Sensitivity is $P(+ \\mid \\text{condition})$: the height of $A$ inside $B$, not a share of $A$.', '感度は $P(+ \\mid \\text{病気})$、つまり $B$ の内側での $A$ の高さで、$A$ に占める割合ではありません。'], [`Bayes gives $P(\\text{condition} \\mid +) = ${n(prev * sens, 5)}/(${n(prev * sens, 5)} + ${n((1 - prev) * (1 - spec), 5)}) = ${n(ppv, 4)}$. This mix-up is the base-rate fallacy.`, `ベイズの定理より $P(\\text{病気} \\mid +) = ${n(prev * sens, 5)}/(${n(prev * sens, 5)} + ${n((1 - prev) * (1 - spec), 5)}) = ${n(ppv, 4)}$ です。この取り違えは基準率の誤りと呼ばれます。`]],
      };
    },
  ];
})();
