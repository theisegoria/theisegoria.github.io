'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const Phi = (z) => { const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x); const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e); };
  const probit = (p) => { let lo = -9, hi = 9; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const sgn = (x) => (x < 0 ? '-' : '+');
  const ct = (c, v) => (Math.abs(c - 1) < 1e-12 ? v : `${n(c)}${v}`);

  /* ---------- 1. scaling limit of random walks ---------- */
  Q.scaling = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const t = r.pick([0.25, 0.5, 2, 3, 4, 9, 0.01, 0.09, 16, 1.44]);
        return {
          q: [`What is the standard deviation of Brownian motion $B(t)$ at time $t = ${n(t)}$?`, `時刻 $t = ${n(t)}$ でのブラウン運動 $B(t)$ の標準偏差はいくつですか。`],
          a: { type: 'num', v: Math.sqrt(t) },
          hint: ['$B(t) \\sim N(0, t)$: the variance grows linearly in time.', '$B(t) \\sim N(0, t)$ で、分散は時間に比例して増えます。'],
          sol: [[`$\\operatorname{Var} B(t) = t = ${n(t)}$, so the standard deviation is $\\sqrt{${n(t)}} = ${n(Math.sqrt(t), 4)}$.`, `$\\operatorname{Var} B(t) = t = ${n(t)}$ なので、標準偏差は $\\sqrt{${n(t)}} = ${n(Math.sqrt(t), 4)}$ です。`], ['Spread like $\\sqrt t$ is the signature of diffusion: the shaded $\\pm\\sqrt t$ band in the figure.', '$\\sqrt t$ のような広がりは拡散の特徴で、図の網掛けの $\\pm\\sqrt t$ の帯にあたります。']],
          set: t <= 1 && [0.25, 0.0625, 1 / 64].includes(t) ? { zoom: Math.round(-Math.log(t) / Math.log(4)) } : undefined,
        };
      }
      if (kind === 1) {
        const z = r.int(1, 5);
        return {
          q: [`Brownian motion is self-similar: $B(ct) \\overset{d}{=} \\sqrt c\\,B(t)$. If you zoom in by a factor of $${4 ** z}$ in time, by what factor must you zoom in space for the picture to look statistically the same?`, `ブラウン運動は自己相似で $B(ct) \\overset{d}{=} \\sqrt c\\,B(t)$ です。時間を $${4 ** z}$ 倍に拡大したとき、統計的に同じ姿に見えるには空間を何倍に拡大する必要がありますか。`],
          a: { type: 'int', v: 2 ** z },
          hint: ['Space scales like the square root of time.', '空間は時間の平方根で伸び縮みします。'],
          sol: [[`$\\sqrt{${4 ** z}} = ${2 ** z}$.`, `$\\sqrt{${4 ** z}} = ${2 ** z}$ です。`], ['That is why each zoom level in the figure is 4 times in time but only 2 times in space.', 'そのため、図の拡大は1段階ごとに時間が4倍、空間は2倍だけになっています。']],
          set: z <= 3 ? { zoom: z, k: 12 } : undefined,
        };
      }
      const k = r.int(2, 12), N = 2 ** k;
      return {
        q: [`The rescaled walk $W_n$ uses $n = 2^{${k}}$ coin-flip steps on $[0, 1]$. How tall is each step?`, `縮尺を変えた歩み $W_n$ は $[0, 1]$ 上で $n = 2^{${k}}$ 回のコイン投げの歩幅を使います。1歩の高さはいくつですか。`],
        a: { type: 'num', v: 1 / Math.sqrt(N), show: k % 2 ? `2^{-${k}/2}` : frac(1, 2 ** (k / 2)) },
        hint: ['Each step is $\\pm 1/\\sqrt n$, so that $n$ of them have total variance 1.', '各歩は $\\pm 1/\\sqrt n$ で、$n$ 歩の分散の合計が 1 になります。'],
        sol: [[`$1/\\sqrt{${N}} = ${n(1 / Math.sqrt(N), 5)}$, while each step lasts $1/${N}$ in time.`, `$1/\\sqrt{${N}} = ${n(1 / Math.sqrt(N), 5)}$ で、1歩の時間は $1/${N}$ です。`], ['Steps shrink, but more slowly than their duration: the slope of each step, $\\sqrt n$, blows up, which is why the limit is nowhere differentiable.', '歩幅は縮みますが、時間幅ほど速くは縮みません。各歩の傾き $\\sqrt n$ は発散し、そのため極限はどこでも微分できません。']],
        set: { k },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const t = r.pick([0.25, 0.5, 1, 2, 4]), a = r.real(0.2, 2.5, 1) * Math.sqrt(t), aa = Number(a.toFixed(2)), v = 1 - Phi(aa / Math.sqrt(t));
        return {
          q: [`Find $P(B(${n(t)}) > ${n(aa)})$ for standard Brownian motion, to three decimals.`, `標準ブラウン運動について $P(B(${n(t)}) > ${n(aa)})$ を小数第3位まで求めてください。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['Standardize by $\\sqrt t$, the standard deviation at time $t$.', '時刻 $t$ の標準偏差 $\\sqrt t$ で標準化します。'],
          sol: [[`$B(${n(t)}) \\sim N(0, ${n(t)})$, so $z = ${n(aa)}/\\sqrt{${n(t)}} = ${n(aa / Math.sqrt(t), 3)}$.`, `$B(${n(t)}) \\sim N(0, ${n(t)})$ なので $z = ${n(aa)}/\\sqrt{${n(t)}} = ${n(aa / Math.sqrt(t), 3)}$ です。`], [`$P = 1 - \\Phi(${n(aa / Math.sqrt(t), 3)}) = ${n(v, 4)}$.`, `$P = 1 - \\Phi(${n(aa / Math.sqrt(t), 3)}) = ${n(v, 4)}$ です。`]],
        };
      }
      if (kind === 1) {
        const t = r.pick([0.25, 0.5, 1, 2, 4]), a = Number((r.real(0.3, 2) * Math.sqrt(t)).toFixed(2)), v = 2 * Phi(a / Math.sqrt(t)) - 1;
        return {
          q: [`What is the probability that $|B(${n(t)})| < ${n(a)}$? Three decimals.`, `$|B(${n(t)})| < ${n(a)}$ となる確率はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['The law is symmetric: $P(|Z| < z) = 2\\Phi(z) - 1$.', '分布は対称なので $P(|Z| < z) = 2\\Phi(z) - 1$ です。'],
          sol: [[`$z = ${n(a)}/\\sqrt{${n(t)}} = ${n(a / Math.sqrt(t), 3)}$.`, `$z = ${n(a)}/\\sqrt{${n(t)}} = ${n(a / Math.sqrt(t), 3)}$ です。`], [`$2\\Phi(${n(a / Math.sqrt(t), 3)}) - 1 = ${n(v, 4)}$.`, `$2\\Phi(${n(a / Math.sqrt(t), 3)}) - 1 = ${n(v, 4)}$ です。`]],
        };
      }
      if (kind === 2) {
        const s = r.pick([0.2, 0.25, 0.5, 1, 1.5]), t = s + r.pick([0.25, 0.5, 0.75, 1, 2]), which = r.int(0, 1);
        return {
          q: [which ? `Find $\\operatorname{Cov}(B(${n(s)}), B(${n(t)}))$.` : `Find $\\operatorname{Var}(B(${n(t)}) - B(${n(s)}))$.`, which ? `$\\operatorname{Cov}(B(${n(s)}), B(${n(t)}))$ を求めてください。` : `$\\operatorname{Var}(B(${n(t)}) - B(${n(s)}))$ を求めてください。`],
          a: { type: 'num', v: which ? s : t - s },
          hint: ['Write $B(t) = B(s) + (B(t) - B(s))$; the increment is independent of $B(s)$ and has variance $t - s$.', '$B(t) = B(s) + (B(t) - B(s))$ と書きます。増分は $B(s)$ と独立で、分散は $t - s$ です。'],
          sol: which ? [[`$\\operatorname{Cov}(B(s), B(t)) = \\operatorname{Var} B(s) + \\operatorname{Cov}(B(s), B(t) - B(s)) = s + 0$.`, `$\\operatorname{Cov}(B(s), B(t)) = \\operatorname{Var} B(s) + \\operatorname{Cov}(B(s), B(t) - B(s)) = s + 0$ です。`], [`$= \\min(${n(s)}, ${n(t)}) = ${n(s)}$: the shared past is what correlates the two times.`, `$= \\min(${n(s)}, ${n(t)}) = ${n(s)}$ です。共有している過去が2つの時刻を相関させます。`]] : [[`The increment over $[${n(s)}, ${n(t)}]$ is $N(0, t - s)$.`, `$[${n(s)}, ${n(t)}]$ での増分は $N(0, t - s)$ です。`], [`Variance $${n(t)} - ${n(s)} = ${n(t - s)}$: independent increments add their variances.`, `分散は $${n(t)} - ${n(s)} = ${n(t - s)}$ です。独立な増分の分散は足し合わされます。`]],
        };
      }
      const k = r.int(2, 12), N = 2 ** k;
      return {
        q: [`$W_n(1)$ is the endpoint of the rescaled walk with $n = ${N}$ steps. How many different values can it take?`, `$W_n(1)$ は歩数 $n = ${N}$ の縮尺を変えた歩みの終点です。何通りの値をとり得ますか。`],
        a: { type: 'int', v: N + 1 },
        hint: ['The endpoint is $(2h - n)/\\sqrt n$, where $h$ is the number of up-steps.', '終点は $(2h - n)/\\sqrt n$ で、$h$ は上向きの歩数です。'],
        sol: [[`$h$ ranges over $0, 1, \\dots, ${N}$, giving ${N + 1} values spaced $2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$ apart.`, `$h$ は $0, 1, \\dots, ${N}$ をとり、間隔 $2/\\sqrt{${N}} = ${n(2 / Math.sqrt(N), 4)}$ の ${N + 1} 通りの値になります。`], [k <= 4 ? 'With so few steps the histogram is visibly a lattice, not yet the normal curve.' : 'The lattice gets finer than the histogram bins, and the normal density appears.', k <= 4 ? 'この歩数ではヒストグラムは明らかに格子状で、まだ正規曲線ではありません。' : '格子はヒストグラムの区間より細かくなり、正規密度が現れます。']],
        set: { k, zoom: 0 },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const t = r.pick([0.25, 0.5, 1, 2, 4]), a = Number((r.real(0.4, 2.5) * Math.sqrt(t)).toFixed(2)), v = 2 * (1 - Phi(a / Math.sqrt(t)));
        return {
          q: [`What is the probability that Brownian motion reaches the level $${n(a)}$ at some time before $t = ${n(t)}$? Three decimals.`, `ブラウン運動が時刻 $t = ${n(t)}$ までのどこかで水準 $${n(a)}$ に達する確率はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['Reflection principle: a path that hits $a$ is as likely to end above $a$ as below it.', '鏡像原理：$a$ に達した経路は、その後 $a$ より上で終わるのも下で終わるのも同じ確率です。'],
          sol: [[`$P(\\max_{s \\le t} B(s) \\ge a) = 2P(B(t) \\ge a)$.`, `$P(\\max_{s \\le t} B(s) \\ge a) = 2P(B(t) \\ge a)$ です。`], [`$= 2(1 - \\Phi(${n(a)}/\\sqrt{${n(t)}})) = 2(1 - \\Phi(${n(a / Math.sqrt(t), 3)})) = ${n(v, 4)}$.`, `$= 2(1 - \\Phi(${n(a)}/\\sqrt{${n(t)}})) = 2(1 - \\Phi(${n(a / Math.sqrt(t), 3)})) = ${n(v, 4)}$ です。`], ['Exactly twice the chance of being above $a$ at the end: many paths touch the level and come back down.', '終点で $a$ より上にいる確率のちょうど2倍です。多くの経路は水準に触れてから戻ってきます。']],
        };
      }
      if (kind === 1) {
        const a = r.pick([1, 2, 3, -1, -2]), b = r.pick([1, 2, -1, 3, -3]), c = r.pick([2, 3, 4, 9]);
        const coef = a * a + 2 * a * b + b * b * c;
        return {
          q: [`Write $\\operatorname{Var}\\bigl(${a === 1 ? '' : a === -1 ? '-' : a}B(t) ${sgn(b)} ${Math.abs(b) === 1 ? '' : Math.abs(b)}B(${c}t)\\bigr)$ as a function of $t$.`, `$\\operatorname{Var}\\bigl(${a === 1 ? '' : a === -1 ? '-' : a}B(t) ${sgn(b)} ${Math.abs(b) === 1 ? '' : Math.abs(b)}B(${c}t)\\bigr)$ を $t$ の式で表してください。`],
          a: { type: 'expr', v: `${coef}t`, vars: ['t'], dom: { t: [0.1, 4] }, lhs: ['$\\operatorname{Var} =$', '$\\operatorname{Var} =$'] },
          hint: ['Use $\\operatorname{Cov}(B(s), B(u)) = \\min(s, u)$.', '$\\operatorname{Cov}(B(s), B(u)) = \\min(s, u)$ を使います。'],
          sol: [[`$${a}^2\\,t + ${pn(b)}^2\\cdot${c}t + 2\\cdot${pn(a)}\\cdot${pn(b)}\\min(t, ${c}t)$.`, `$${a}^2\\,t + ${pn(b)}^2\\cdot${c}t + 2\\cdot${pn(a)}\\cdot${pn(b)}\\min(t, ${c}t)$ です。`], [`$= (${a * a} + ${b * b * c} ${sgn(2 * a * b)} ${Math.abs(2 * a * b)})\\,t = ${coef}t$.`, `$= (${a * a} + ${b * b * c} ${sgn(2 * a * b)} ${Math.abs(2 * a * b)})\\,t = ${coef}t$ です。`], ['Linear in $t$, as scaling demands: replacing $t$ by $ct$ multiplies every variance by $c$.', 'スケーリングから当然 $t$ に比例します。$t$ を $ct$ に置き換えると、あらゆる分散が $c$ 倍になります。']],
        };
      }
      if (kind === 2) {
        const a = r.pick([0.5, 1, 1.5, 2]), p = r.pick([0.05, 0.1, 0.2, 0.25, 0.3]), z = probit(1 - p), t = (a / z) ** 2;
        return {
          q: [`At what time $t$ is $P(B(t) > ${n(a)}) = ${n(p)}$? Three decimals.`, `$P(B(t) > ${n(a)}) = ${n(p)}$ となる時刻 $t$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: t, rel: 0.002 },
          hint: ['Find the $z$ with $1 - \\Phi(z) = p$, then solve $a/\\sqrt t = z$.', '$1 - \\Phi(z) = p$ となる $z$ を求め、$a/\\sqrt t = z$ を解きます。'],
          sol: [[`$1 - \\Phi(z) = ${n(p)}$ gives $z = ${n(z, 4)}$.`, `$1 - \\Phi(z) = ${n(p)}$ より $z = ${n(z, 4)}$ です。`], [`$t = (${n(a)}/${n(z, 4)})^2 = ${n(t, 4)}$. Doubling the level would take four times as long, by scaling.`, `$t = (${n(a)}/${n(z, 4)})^2 = ${n(t, 4)}$ です。スケーリングにより、水準を2倍にすると4倍の時間がかかります。`]],
        };
      }
      const z = r.int(0, 3), m = r.pick([16, 32, 64, 128]), k = Math.max(2, Math.log2(m) + 2 * z);
      return {
        q: [`At zoom level $z$ the window shows the first $4^{-z}$ of $[0, 1]$. With $n = 2^k$ steps, what is the smallest $k$ that puts at least ${m} steps in the window at zoom level ${z}?`, `拡大段階 $z$ では $[0, 1]$ の最初の $4^{-z}$ が表示されます。歩数 $n = 2^k$ のとき、拡大段階 ${z} で窓の中に少なくとも ${m} 歩が入る最小の $k$ はいくつですか。`],
        a: { type: 'int', v: k },
        hint: ['Steps in view $= 2^k\\cdot 4^{-z} = 2^{k - 2z}$.', '表示される歩数は $2^k\\cdot 4^{-z} = 2^{k - 2z}$ です。'],
        sol: [[`$2^{k - 2z} \\ge ${m} = 2^{${Math.log2(m)}}$ needs $k \\ge ${Math.log2(m)} + 2\\cdot${z} = ${Math.log2(m) + 2 * z}$.`, `$2^{k - 2z} \\ge ${m} = 2^{${Math.log2(m)}}$ には $k \\ge ${Math.log2(m)} + 2\\cdot${z} = ${Math.log2(m) + 2 * z}$ が必要です。`], ['Each zoom level costs two more doublings of $n$: the scaling limit must outrun the magnification.', '拡大1段階ごとに $n$ を2回倍にする必要があります。スケーリング極限は拡大より速く進まなければなりません。']],
        set: k <= 12 ? { k, zoom: z } : undefined,
      };
    },
  ];

  /* ---------- 2. quadratic variation ---------- */
  Q['quadratic-variation'] = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const m = r.int(1, 14);
        return {
          q: [`$[0, 1]$ is cut into $2^{${m}}$ equal pieces. What is $E[(\\Delta B)^2]$ for one piece?`, `$[0, 1]$ を $2^{${m}}$ 等分します。1つの区間での $E[(\\Delta B)^2]$ はいくつですか。`],
          a: { type: 'num', v: 2 ** -m, show: `2^{-${m}}` },
          hint: ['An increment over time $h$ is $N(0, h)$.', '時間 $h$ の増分は $N(0, h)$ に従います。'],
          sol: [[`Each piece has length $h = 2^{-${m}} = ${n(2 ** -m, 6)}$, and $E[(\\Delta B)^2] = \\operatorname{Var}(\\Delta B) = h$.`, `各区間の長さは $h = 2^{-${m}} = ${n(2 ** -m, 6)}$ で、$E[(\\Delta B)^2] = \\operatorname{Var}(\\Delta B) = h$ です。`], [`Adding $2^{${m}}$ of them gives exactly 1 in expectation, for every $m$: $(dB)^2 = dt$.`, `$2^{${m}}$ 個を足すと、どの $m$ でも期待値はちょうど 1 で、$(dB)^2 = dt$ です。`]],
          set: { m },
        };
      }
      if (kind === 1) {
        const B = r.real(-2, 2, 2), t = r.pick([1, 1, 2, 0.5, 4]), v = (B * B - t) / 2;
        return {
          q: [`A Brownian path has $B_{${n(t)}} = ${n(B)}$. What is the Itô integral $\\int_0^{${n(t)}} B\\,dB$ along it?`, `あるブラウン経路で $B_{${n(t)}} = ${n(B)}$ です。この経路に沿った伊藤積分 $\\int_0^{${n(t)}} B\\,dB$ はいくつですか。`],
          a: { type: 'num', v, tol: 1e-4 },
          hint: ['The Itô formula gives $\\int_0^t B\\,dB = \\tfrac12 B_t^2 - \\tfrac12 t$.', '伊藤の公式から $\\int_0^t B\\,dB = \\tfrac12 B_t^2 - \\tfrac12 t$ です。'],
          sol: [[`$\\tfrac12(${pn(B)})^2 - \\tfrac12\\cdot${n(t)} = ${n(B * B / 2, 4)} - ${n(t / 2)} = ${n(v, 4)}$.`, `$\\tfrac12(${pn(B)})^2 - \\tfrac12\\cdot${n(t)} = ${n(B * B / 2, 4)} - ${n(t / 2)} = ${n(v, 4)}$ です。`], ['Ordinary calculus would say $\\tfrac12 B_t^2$; the $-\\tfrac12 t$ is the quadratic variation the left-point sums cannot see.', '通常の微積分なら $\\tfrac12 B_t^2$ です。$-\\tfrac12 t$ は、左端点の和が拾えない二次変分の寄与です。']],
          set: t === 1 ? { m: 14 } : undefined,
        };
      }
      const t = r.pick([1, 2, 0.5, 3, 4, 0.25]);
      return {
        q: [`On $[0, ${n(t)}]$, by how much does the Stratonovich integral $\\int B \\circ dB$ exceed the Itô integral $\\int B\\,dB$?`, `$[0, ${n(t)}]$ で、ストラトノヴィッチ積分 $\\int B \\circ dB$ は伊藤積分 $\\int B\\,dB$ よりどれだけ大きいですか。`],
        a: { type: 'num', v: t / 2 },
        hint: ['Midpoint minus left point, summed: $\\sum \\tfrac12(\\Delta B)^2$.', '中点と左端点の差を足すと $\\sum \\tfrac12(\\Delta B)^2$ になります。'],
        sol: [['Term by term, $\\tfrac12(B_k + B_{k+1})\\Delta B - B_k\\Delta B = \\tfrac12(\\Delta B)^2$.', '各項で $\\tfrac12(B_k + B_{k+1})\\Delta B - B_k\\Delta B = \\tfrac12(\\Delta B)^2$ です。'], [`Summed, this tends to half the quadratic variation: $\\tfrac12\\cdot${n(t)} = ${n(t / 2)}$, path by path, not just on average.`, `和をとると二次変分の半分 $\\tfrac12\\cdot${n(t)} = ${n(t / 2)}$ に近づきます。平均だけでなく経路ごとにそうなります。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const m = r.int(1, 14), v = Math.sqrt(2 ** m * 2 / Math.PI);
        return {
          q: [`With $2^{${m}}$ pieces of $[0, 1]$, what is the expected total variation $E\\sum|\\Delta B|$? Three decimals.`, `$[0, 1]$ を $2^{${m}}$ 個に分けるとき、全変動の期待値 $E\\sum|\\Delta B|$ を小数第3位まで求めてください。`],
          a: { type: 'num', v, tol: 0.0015 },
          hint: ['For $Z \\sim N(0, h)$, $E|Z| = \\sqrt{2h/\\pi}$.', '$Z \\sim N(0, h)$ のとき $E|Z| = \\sqrt{2h/\\pi}$ です。'],
          sol: [[`Each piece contributes $\\sqrt{2\\cdot 2^{-${m}}/\\pi}$.`, `各区間の寄与は $\\sqrt{2\\cdot 2^{-${m}}/\\pi}$ です。`], [`Times $2^{${m}}$ pieces: $\\sqrt{2^{${m}}\\cdot 2/\\pi} = ${n(v, 4)}$.`, `$2^{${m}}$ 個分で $\\sqrt{2^{${m}}\\cdot 2/\\pi} = ${n(v, 4)}$ です。`], ['It grows like $2^{m/2}$ without bound: a Brownian path has infinite length.', 'これは $2^{m/2}$ のように限りなく増えます。ブラウン経路の長さは無限大です。']],
          set: { m },
        };
      }
      if (kind === 1) {
        const m = r.int(1, 14), v = Math.sqrt(2 / 2 ** m);
        return {
          q: [`The sum of squared increments over $2^{${m}}$ pieces of $[0, 1]$ has mean 1. What is its standard deviation? Four decimals.`, `$[0, 1]$ の $2^{${m}}$ 個の区間での増分の2乗和の平均は 1 です。その標準偏差を小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 6e-5 },
          hint: ['For $Z \\sim N(0, h)$, $\\operatorname{Var}(Z^2) = 2h^2$; the pieces are independent.', '$Z \\sim N(0, h)$ のとき $\\operatorname{Var}(Z^2) = 2h^2$ で、各区間は独立です。'],
          sol: [[`$\\operatorname{Var} = 2^{${m}}\\cdot 2\\,(2^{-${m}})^2 = 2\\cdot 2^{-${m}}$.`, `$\\operatorname{Var} = 2^{${m}}\\cdot 2\\,(2^{-${m}})^2 = 2\\cdot 2^{-${m}}$ です。`], [`Standard deviation $\\sqrt{2^{1 - ${m}}} = ${n(v, 5)}$, which goes to zero: the sum converges to exactly 1, which is why the teal curve flattens onto the line.`, `標準偏差は $\\sqrt{2^{1 - ${m}}} = ${n(v, 5)}$ で 0 に近づきます。和はちょうど 1 に収束し、そのため青緑の曲線は直線の上で平らになります。`]],
          set: { m },
        };
      }
      const B = r.real(-2, 2, 2), t = r.pick([1, 2, 0.5, 4]), which = r.int(0, 1), v = which ? B * B / 2 : (B * B - t) / 2;
      return {
        q: [which ? `Along a path with $B_{${n(t)}} = ${n(B)}$, what does the midpoint (Stratonovich) sum $\\sum \\tfrac12(B_k + B_{k+1})\\Delta B$ converge to on $[0, ${n(t)}]$?` : `Along a path with $B_{${n(t)}} = ${n(B)}$, what does the left-point (Itô) sum $\\sum B_k\\,\\Delta B$ converge to on $[0, ${n(t)}]$?`, which ? `$B_{${n(t)}} = ${n(B)}$ の経路で、$[0, ${n(t)}]$ 上の中点（ストラトノヴィッチ）和 $\\sum \\tfrac12(B_k + B_{k+1})\\Delta B$ は何に収束しますか。` : `$B_{${n(t)}} = ${n(B)}$ の経路で、$[0, ${n(t)}]$ 上の左端点（伊藤）和 $\\sum B_k\\,\\Delta B$ は何に収束しますか。`],
        a: { type: 'num', v, tol: 1e-4 },
        hint: [which ? 'The midpoint sum telescopes: $\\tfrac12(B_k + B_{k+1})(B_{k+1} - B_k) = \\tfrac12(B_{k+1}^2 - B_k^2)$.' : 'Write $B_k\\Delta B = \\tfrac12(B_{k+1}^2 - B_k^2) - \\tfrac12(\\Delta B)^2$.', which ? '中点の和は打ち消し合います。$\\tfrac12(B_k + B_{k+1})(B_{k+1} - B_k) = \\tfrac12(B_{k+1}^2 - B_k^2)$ です。' : '$B_k\\Delta B = \\tfrac12(B_{k+1}^2 - B_k^2) - \\tfrac12(\\Delta B)^2$ と書きます。'],
        sol: [[which ? `The sum telescopes exactly to $\\tfrac12 B_{${n(t)}}^2 = \\tfrac12(${pn(B)})^2$.` : `It equals $\\tfrac12 B_{${n(t)}}^2 - \\tfrac12\\sum(\\Delta B)^2 \\to \\tfrac12 B_{${n(t)}}^2 - \\tfrac12\\cdot${n(t)}$.`, which ? `和はちょうど $\\tfrac12 B_{${n(t)}}^2 = \\tfrac12(${pn(B)})^2$ に打ち消し合います。` : `これは $\\tfrac12 B_{${n(t)}}^2 - \\tfrac12\\sum(\\Delta B)^2 \\to \\tfrac12 B_{${n(t)}}^2 - \\tfrac12\\cdot${n(t)}$ です。`], [`$= ${n(v, 4)}$. ${which ? 'The midpoint rule obeys the ordinary chain rule.' : 'The left-point rule loses half the quadratic variation, but in exchange has mean zero.'}`, `$= ${n(v, 4)}$ です。${which ? '中点則は通常の連鎖律に従います。' : '左端点則は二次変分の半分を失いますが、その代わり平均が 0 になります。'}`]],
        set: t === 1 ? { m: 14 } : undefined,
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const fs = [
          { f: 'x^3', fe: 'x^3', d: '3x', tex: 'B^3', f1: '3B^2', f2: '6B' },
          { f: 'x^4', fe: 'x^4', d: '6x^2', tex: 'B^4', f1: '4B^3', f2: '12B^2' },
          { f: 'e^{2x}', fe: 'exp(2x)', d: '2exp(2x)', tex: 'e^{2B}', f1: '2e^{2B}', f2: '4e^{2B}' },
          { f: 'e^{-x}', fe: 'exp(-x)', d: '0.5exp(-x)', tex: 'e^{-B}', f1: '-e^{-B}', f2: 'e^{-B}' },
          { f: '\\sin x', fe: 'sin(x)', d: '-0.5sin(x)', tex: '\\sin B', f1: '\\cos B', f2: '-\\sin B' },
          { f: 'x^2', fe: 'x^2', d: '1', tex: 'B^2', f1: '2B', f2: '2' },
        ];
        let F; do { F = r.pick(fs); } while (F.d === '1' && r.chance(0.8));
        return {
          q: [`By Itô's formula, $d\\,${F.tex}_t = f'(B_t)\\,dB_t + g(B_t)\\,dt$ for $f(x) = ${F.f}$. Write the drift coefficient $g(x)$.`, `伊藤の公式により、$f(x) = ${F.f}$ について $d\\,${F.tex}_t = f'(B_t)\\,dB_t + g(B_t)\\,dt$ です。ドリフト係数 $g(x)$ を答えてください。`],
          a: { type: 'expr', v: F.d, vars: ['x'], dom: { x: [-1.5, 1.5] }, lhs: ['$g(x) =$', '$g(x) =$'] },
          hint: ['Expand $f$ to second order and replace $(dB)^2$ by $dt$.', '$f$ を2次まで展開し、$(dB)^2$ を $dt$ に置き換えます。'],
          sol: [[`$df = f'(B)\\,dB + \\tfrac12 f''(B)(dB)^2$ with $f' \\to ${F.f1}$, $f'' \\to ${F.f2}$.`, `$df = f'(B)\\,dB + \\tfrac12 f''(B)(dB)^2$ で、$f' \\to ${F.f1}$、$f'' \\to ${F.f2}$ です。`], [`With $(dB)^2 = dt$, $g = \\tfrac12 f''$, that is $g(x) = ${P.toTeX(P.parse(F.d, ['x']))}$.`, `$(dB)^2 = dt$ より $g = \\tfrac12 f''$、すなわち $g(x) = ${P.toTeX(P.parse(F.d, ['x']))}$ です。`], ['The extra $dt$ term is the quadratic variation of the experiment made into calculus.', 'この余分な $dt$ の項は、実験で見た二次変分を微積分の規則にしたものです。']],
        };
      }
      if (kind === 1) {
        const which = r.int(0, 1);
        return {
          q: [which ? 'Using the Itô isometry, write $E\\Bigl[\\bigl(\\int_0^t B\\,dB\\bigr)^2\\Bigr]$ as a function of $t$.' : 'Write $E[B_t^4]$ as a function of $t$.', which ? '伊藤等長性を使い、$E\\Bigl[\\bigl(\\int_0^t B\\,dB\\bigr)^2\\Bigr]$ を $t$ の式で表してください。' : '$E[B_t^4]$ を $t$ の式で表してください。'],
          a: { type: 'expr', v: which ? 't^2/2' : '3t^2', vars: ['t'], dom: { t: [0.1, 4] } },
          hint: [which ? '$E[(\\int_0^t H\\,dB)^2] = \\int_0^t E[H_s^2]\\,ds$.' : '$B_t = \\sqrt t\\,Z$ with $E[Z^4] = 3$.', which ? '$E[(\\int_0^t H\\,dB)^2] = \\int_0^t E[H_s^2]\\,ds$ です。' : '$B_t = \\sqrt t\\,Z$ で、$E[Z^4] = 3$ です。'],
          sol: which ? [['$\\int_0^t E[B_s^2]\\,ds = \\int_0^t s\\,ds = \\tfrac12 t^2$.', '$\\int_0^t E[B_s^2]\\,ds = \\int_0^t s\\,ds = \\tfrac12 t^2$ です。'], ['Check with the closed form: $\\operatorname{Var}(\\tfrac12 B_t^2 - \\tfrac12 t) = \\tfrac14\\operatorname{Var}(B_t^2) = \\tfrac14\\cdot 2t^2$, the same.', '閉じた形でも確かめられます。$\\operatorname{Var}(\\tfrac12 B_t^2 - \\tfrac12 t) = \\tfrac14\\operatorname{Var}(B_t^2) = \\tfrac14\\cdot 2t^2$ で一致します。']] : [['$E[B_t^4] = t^2 E[Z^4] = 3t^2$.', '$E[B_t^4] = t^2 E[Z^4] = 3t^2$ です。'], ['Hence $\\operatorname{Var}(B_t^2) = 3t^2 - t^2 = 2t^2$, the fact behind the shrinking spread of the quadratic-variation sum.', 'したがって $\\operatorname{Var}(B_t^2) = 3t^2 - t^2 = 2t^2$ で、二次変分の和のばらつきが縮む理由になっています。']],
        };
      }
      if (kind === 2) {
        const Lv = r.pick([10, 20, 50, 100, 30]);
        let m = 1; while (Math.sqrt(2 ** m * 2 / Math.PI) < Lv) m++;
        return {
          q: [`At what partition level $m$ does the expected total variation $E\\sum|\\Delta B|$ over $[0, 1]$ first exceed ${Lv}?`, `$[0, 1]$ での全変動の期待値 $E\\sum|\\Delta B|$ が初めて ${Lv} を超える分割段階 $m$ はいくつですか。`],
          a: { type: 'int', v: m },
          hint: ['$E\\sum|\\Delta B| = \\sqrt{2^{m+1}/\\pi}$.', '$E\\sum|\\Delta B| = \\sqrt{2^{m+1}/\\pi}$ です。'],
          sol: [[`Need $2^{m+1} > \\pi\\cdot${Lv}^2 = ${n(Math.PI * Lv * Lv, 1)}$.`, `$2^{m+1} > \\pi\\cdot${Lv}^2 = ${n(Math.PI * Lv * Lv, 1)}$ が必要です。`], [`$m = ${m}$ gives $${n(Math.sqrt(2 ** m * 2 / Math.PI), 2)}$ while $m = ${m - 1}$ gives $${n(Math.sqrt(2 ** (m - 1) * 2 / Math.PI), 2)}$. Each level multiplies the length by $\\sqrt 2$: there is no finite length to converge to.`, `$m = ${m}$ で $${n(Math.sqrt(2 ** m * 2 / Math.PI), 2)}$、$m = ${m - 1}$ で $${n(Math.sqrt(2 ** (m - 1) * 2 / Math.PI), 2)}$ です。1段階ごとに長さは $\\sqrt 2$ 倍になり、収束すべき有限の長さはありません。`]],
          set: m <= 14 ? { m } : undefined,
        };
      }
      return {
        q: ['Which Riemann-type sum for $\\int_0^1 B\\,dB$ has expected value zero for every partition?', '$\\int_0^1 B\\,dB$ のリーマン型の和のうち、どの分割でも期待値が 0 になるのはどれですか。'],
        a: { type: 'choice', opts: [['The left-point sum $\\sum B_{t_k}\\Delta B$ (Itô).', '左端点の和 $\\sum B_{t_k}\\Delta B$（伊藤）。'], ['The midpoint average $\\sum \\tfrac12(B_{t_k} + B_{t_{k+1}})\\Delta B$ (Stratonovich).', '中点平均の和 $\\sum \\tfrac12(B_{t_k} + B_{t_{k+1}})\\Delta B$（ストラトノヴィッチ）。'], ['The right-point sum $\\sum B_{t_{k+1}}\\Delta B$.', '右端点の和 $\\sum B_{t_{k+1}}\\Delta B$。'], ['All of them, since they share a limit.', '極限が同じなので、すべてです。']], v: 0 },
        hint: ['Which choice of evaluation point is independent of the increment it multiplies?', 'どの評価点が、掛け合わせる増分と独立でしょうか。'],
        sol: [['$B_{t_k}$ is independent of $\\Delta B = B_{t_{k+1}} - B_{t_k}$, so each left-point term has mean $0$.', '$B_{t_k}$ は $\\Delta B = B_{t_{k+1}} - B_{t_k}$ と独立なので、左端点の各項の平均は $0$ です。'], ['The midpoint sum has mean $\\tfrac12$ and the right-point sum mean $1$: the three limits differ by multiples of the quadratic variation, so they do not share a limit.', '中点の和の平均は $\\tfrac12$、右端点の和の平均は $1$ です。3つの極限は二次変分の倍数だけ異なり、同じ極限にはなりません。']],
      };
    },
  ];

  /* ---------- 3. Ornstein-Uhlenbeck and Fokker-Planck ---------- */
  const ouV = (s, th, t) => (th < 1e-12 ? s * s * t : s * s / (2 * th) * (1 - Math.exp(-2 * th * t)));
  Q['fokker-planck'] = [
    (r) => {
      const kind = r.int(0, 2), th = r.step(0.25, 3, 0.25), s = r.step(0.2, 2, 0.1), x0 = r.step(-2, 2, 0.5) || 1.5, t = r.step(0.25, 4, 0.25);
      if (kind === 0) {
        const m = x0 * Math.exp(-th * t);
        return {
          q: [`An Ornstein–Uhlenbeck process $dX = -\\theta X\\,dt + \\sigma\\,dW$ starts at $x_0 = ${n(x0)}$ with $\\theta = ${n(th)}$. What is $E[X_t]$ at $t = ${n(t)}$? Four decimals.`, `オルンシュタイン・ウーレンベック過程 $dX = -\\theta X\\,dt + \\sigma\\,dW$ が $x_0 = ${n(x0)}$、$\\theta = ${n(th)}$ で出発します。$t = ${n(t)}$ での $E[X_t]$ を小数第4位まで求めてください。`],
          a: { type: 'num', v: m, tol: 6e-5 },
          hint: ['Take expectations: the noise has mean zero, so $m\' = -\\theta m$.', '期待値をとると雑音の平均は 0 なので $m\' = -\\theta m$ です。'],
          sol: [[`$m(t) = x_0 e^{-\\theta t} = ${n(x0)}\\,e^{-${n(th * t)}}$.`, `$m(t) = x_0 e^{-\\theta t} = ${n(x0)}\\,e^{-${n(th * t)}}$ です。`], [`$= ${n(m, 5)}$, the dashed curve in the figure. It does not depend on $\\sigma$.`, `$= ${n(m, 5)}$ で、図の破線の曲線です。$\\sigma$ にはよりません。`]],
          set: { theta: th, sigma: s, x0, t },
        };
      }
      if (kind === 1) {
        return {
          q: [`With $\\theta = ${n(th)}$ and $\\sigma = ${n(s)}$, what is the long-run variance of the Ornstein–Uhlenbeck process? Four decimals.`, `$\\theta = ${n(th)}$、$\\sigma = ${n(s)}$ のとき、オルンシュタイン・ウーレンベック過程の長時間後の分散を小数第4位まで求めてください。`],
          a: { type: 'num', v: s * s / (2 * th), tol: 6e-5 },
          hint: ['In equilibrium, noise injects variance at rate $\\sigma^2$ and the drift removes it at rate $2\\theta v$.', '平衡では、雑音が分散を速さ $\\sigma^2$ で注ぎ、ドリフトが速さ $2\\theta v$ で取り除きます。'],
          sol: [[`Setting $\\sigma^2 = 2\\theta v$: $v_\\infty = \\sigma^2/(2\\theta) = ${n(s * s, 4)}/${n(2 * th)}$.`, `$\\sigma^2 = 2\\theta v$ とおくと $v_\\infty = \\sigma^2/(2\\theta) = ${n(s * s, 4)}/${n(2 * th)}$ です。`], [`$v_\\infty = ${n(s * s / (2 * th), 5)}$, whatever the start $x_0$.`, `$v_\\infty = ${n(s * s / (2 * th), 5)}$ で、出発点 $x_0$ にはよりません。`]],
          set: { theta: th, sigma: s },
        };
      }
      return {
        q: [`With no mean reversion ($\\theta = 0$) and $\\sigma = ${n(s)}$, what is $\\operatorname{Var}(X_t)$ at $t = ${n(t)}$?`, `平均回帰がなく（$\\theta = 0$）、$\\sigma = ${n(s)}$ のとき、$t = ${n(t)}$ での $\\operatorname{Var}(X_t)$ はいくつですか。`],
        a: { type: 'num', v: s * s * t },
        hint: ['With $\\theta = 0$ the process is $x_0 + \\sigma W_t$.', '$\\theta = 0$ では過程は $x_0 + \\sigma W_t$ です。'],
        sol: [[`$\\operatorname{Var}(\\sigma W_t) = \\sigma^2 t = ${n(s * s, 4)}\\cdot${n(t)}$.`, `$\\operatorname{Var}(\\sigma W_t) = \\sigma^2 t = ${n(s * s, 4)}\\cdot${n(t)}$ です。`], [`$= ${n(s * s * t, 4)}$, growing without limit: pure diffusion.`, `$= ${n(s * s * t, 4)}$ で、限りなく増えます。純粋な拡散です。`]],
        set: { theta: 0, sigma: s, t },
      };
    },
    (r) => {
      const kind = r.int(0, 2), th = r.step(0.25, 3, 0.25), s = r.step(0.2, 2, 0.1), x0 = r.step(-2, 2, 0.5) || -1, t = r.step(0.25, 4, 0.25), v = ouV(s, th, t), m = x0 * Math.exp(-th * t);
      if (kind === 0) {
        return {
          q: [`$\\theta = ${n(th)}$, $\\sigma = ${n(s)}$. Find $\\operatorname{Var}(X_t)$ at $t = ${n(t)}$, to four decimals.`, `$\\theta = ${n(th)}$、$\\sigma = ${n(s)}$ のとき、$t = ${n(t)}$ での $\\operatorname{Var}(X_t)$ を小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 6e-5 },
          hint: ['$v\' = \\sigma^2 - 2\\theta v$ with $v(0) = 0$.', '$v\' = \\sigma^2 - 2\\theta v$、$v(0) = 0$ です。'],
          sol: [[`$v(t) = \\dfrac{\\sigma^2}{2\\theta}\\bigl(1 - e^{-2\\theta t}\\bigr) = ${n(s * s / (2 * th), 5)}\\bigl(1 - e^{-${n(2 * th * t)}}\\bigr)$.`, `$v(t) = \\dfrac{\\sigma^2}{2\\theta}\\bigl(1 - e^{-2\\theta t}\\bigr) = ${n(s * s / (2 * th), 5)}\\bigl(1 - e^{-${n(2 * th * t)}}\\bigr)$ です。`], [`$= ${n(v, 5)}$, ${n(100 * v / (s * s / (2 * th)), 1)}% of the way to equilibrium. The histogram at the slice has this variance.`, `$= ${n(v, 5)}$ で、平衡の ${n(100 * v / (s * s / (2 * th)), 1)}% まで来ています。断面のヒストグラムはこの分散を持ちます。`]],
          set: { theta: th, sigma: s, x0, t },
        };
      }
      if (kind === 1) {
        const pz = Phi(m / Math.sqrt(v));
        return {
          q: [`$x_0 = ${n(x0)}$, $\\theta = ${n(th)}$, $\\sigma = ${n(s)}$. What is $P(X_t > 0)$ at $t = ${n(t)}$? Three decimals.`, `$x_0 = ${n(x0)}$、$\\theta = ${n(th)}$、$\\sigma = ${n(s)}$ のとき、$t = ${n(t)}$ での $P(X_t > 0)$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: pz, tol: 0.0015 },
          hint: ['$X_t$ is exactly normal: find its mean and variance, then standardize 0.', '$X_t$ は正確に正規分布です。平均と分散を求め、0 を標準化します。'],
          sol: [[`$m = ${n(x0)}e^{-${n(th * t)}} = ${n(m, 4)}$ and $v = ${n(v, 4)}$.`, `$m = ${n(x0)}e^{-${n(th * t)}} = ${n(m, 4)}$、$v = ${n(v, 4)}$ です。`], [`$P(X_t > 0) = \\Phi(m/\\sqrt v) = \\Phi(${n(m / Math.sqrt(v), 3)}) = ${n(pz, 4)}$.`, `$P(X_t > 0) = \\Phi(m/\\sqrt v) = \\Phi(${n(m / Math.sqrt(v), 3)}) = ${n(pz, 4)}$ です。`], ['As $t$ grows this tends to $\\tfrac12$: the process forgets which side it started on.', '$t$ が大きくなるとこれは $\\tfrac12$ に近づきます。過程はどちら側から出発したかを忘れます。']],
          set: { theta: th, sigma: s, x0, t },
        };
      }
      const hl = Math.LN2 / th;
      return {
        q: [`With $\\theta = ${n(th)}$, how long does it take for the mean $E[X_t]$ to fall to half its starting value? Three decimals.`, `$\\theta = ${n(th)}$ のとき、平均 $E[X_t]$ が初期値の半分になるまでの時間を小数第3位まで求めてください。`],
        a: { type: 'num', v: hl, tol: 6e-4 },
        hint: ['Solve $e^{-\\theta t} = \\tfrac12$.', '$e^{-\\theta t} = \\tfrac12$ を解きます。'],
        sol: [[`$t_{1/2} = \\ln 2/\\theta = 0.6931/${n(th)} = ${n(hl, 4)}$.`, `$t_{1/2} = \\ln 2/\\theta = 0.6931/${n(th)} = ${n(hl, 4)}$ です。`], ['The variance relaxes twice as fast, with rate $2\\theta$.', '分散はその2倍の速さ $2\\theta$ で緩和します。']],
        set: { theta: th, x0: 2, t: Math.min(4, Math.max(0.05, Math.round(hl * 20) / 20)) },
      };
    },
    (r) => {
      const kind = r.int(0, 2), th = r.pick([0.5, 1, 1.5, 2, 0.25, 3]), s = r.pick([0.5, 1, 1.5, 2, 0.8]);
      if (kind === 0) {
        const c = s * s / (2 * th);
        return {
          q: [`For $\\theta = ${n(th)}$ and $\\sigma = ${n(s)}$, write $\\operatorname{Var}(X_t)$ as a function of $t$.`, `$\\theta = ${n(th)}$、$\\sigma = ${n(s)}$ のとき、$\\operatorname{Var}(X_t)$ を $t$ の式で表してください。`],
          a: { type: 'expr', v: `${n(c, 8)}*(1-exp(-${n(2 * th)}t))`, show: `${n(c, 5)}\\bigl(1 - e^{-${ct(2 * th, 't')}}\\bigr)`, vars: ['t'], dom: { t: [0.05, 4] }, lhs: ['$\\operatorname{Var}(X_t) =$', '$\\operatorname{Var}(X_t) =$'] },
          hint: ['Itô on $X^2$ gives $\\tfrac{d}{dt}E[X^2] = -2\\theta E[X^2] + \\sigma^2$; subtract the squared mean.', '$X^2$ に伊藤の公式を使うと $\\tfrac{d}{dt}E[X^2] = -2\\theta E[X^2] + \\sigma^2$ で、平均の2乗を引きます。'],
          sol: [[`The variance obeys $v' = ${n(s * s, 4)} - ${n(2 * th)}v$, $v(0) = 0$.`, `分散は $v' = ${n(s * s, 4)} - ${n(2 * th)}v$、$v(0) = 0$ に従います。`], [`$v(t) = ${n(c, 5)}\\bigl(1 - e^{-${ct(2 * th, 't')}}\\bigr)$: it rises like $\\sigma^2 t$ at first and saturates at $${n(c, 5)}$.`, `$v(t) = ${n(c, 5)}\\bigl(1 - e^{-${ct(2 * th, 't')}}\\bigr)$ です。最初は $\\sigma^2 t$ のように増え、$${n(c, 5)}$ で飽和します。`]],
          set: { theta: th, sigma: s },
        };
      }
      if (kind === 1) {
        const f = r.pick([0.5, 0.75, 0.9, 0.95, 0.99]), t = -Math.log(1 - f) / (2 * th), ts = Math.round(t * 20) / 20;
        return {
          q: [`With $\\theta = ${n(th)}$, starting from a point, how long until the variance reaches ${n(100 * f)}% of its long-run value? Three decimals.`, `$\\theta = ${n(th)}$ で1点から出発するとき、分散が長時間後の値の ${n(100 * f)}% に達するまでの時間を小数第3位まで求めてください。`],
          a: { type: 'num', v: t, tol: 6e-4 },
          hint: ['The ratio $v(t)/v_\\infty = 1 - e^{-2\\theta t}$ does not involve $\\sigma$.', '比 $v(t)/v_\\infty = 1 - e^{-2\\theta t}$ には $\\sigma$ が含まれません。'],
          sol: [[`$1 - e^{-${ct(2 * th, 't')}} = ${n(f)}$ gives $e^{-${ct(2 * th, 't')}} = ${n(1 - f)}$.`, `$1 - e^{-${ct(2 * th, 't')}} = ${n(f)}$ より $e^{-${ct(2 * th, 't')}} = ${n(1 - f)}$ です。`], [`$t = -\\ln(${n(1 - f)})/${n(2 * th)} = ${n(t, 4)}$. The noise strength sets the size of the cloud, the drift alone sets how fast it forms.`, `$t = -\\ln(${n(1 - f)})/${n(2 * th)} = ${n(t, 4)}$ です。雑音の強さは広がりの大きさを決め、その広がりが形成される速さはドリフトだけで決まります。`]],
          set: ts >= 0.05 && ts <= 4 ? { theta: th, sigma: s, t: ts } : { theta: th, sigma: s },
        };
      }
      const k = th / (s * s);
      return {
        q: [`Find the stationary solution $p_\\infty(x)$ of $\\partial_t p = \\partial_x(\\theta x p) + \\tfrac{\\sigma^2}{2}\\partial_x^2 p$ for $\\theta = ${n(th)}$, $\\sigma = ${n(s)}$.`, `$\\theta = ${n(th)}$、$\\sigma = ${n(s)}$ のとき、$\\partial_t p = \\partial_x(\\theta x p) + \\tfrac{\\sigma^2}{2}\\partial_x^2 p$ の定常解 $p_\\infty(x)$ を求めてください。`],
        a: { type: 'expr', v: `sqrt(${n(k, 8)}/pi)*exp(-${n(k, 8)}x^2)`, show: `\\sqrt{${n(k, 5)}/\\pi}\\,e^{-${ct(k, 'x^2')}}`, vars: ['x'], dom: { x: [-2, 2] }, lhs: ['$p_\\infty(x) =$', '$p_\\infty(x) =$'] },
        hint: ['Zero flux: $\\theta x p + \\tfrac{\\sigma^2}{2}p\' = 0$. Then normalize.', '流束が 0：$\\theta x p + \\tfrac{\\sigma^2}{2}p\' = 0$ とし、規格化します。'],
        sol: [[`$p'/p = -2\\theta x/\\sigma^2$, so $p \\propto e^{-\\theta x^2/\\sigma^2} = e^{-${ct(k, 'x^2')}}$.`, `$p'/p = -2\\theta x/\\sigma^2$ より $p \\propto e^{-\\theta x^2/\\sigma^2} = e^{-${ct(k, 'x^2')}}$ です。`], [`Normalized: $p_\\infty(x) = \\sqrt{${n(k, 4)}/\\pi}\\,e^{-${ct(k, 'x^2')}}$, the normal law $N(0, \\sigma^2/2\\theta) = N(0, ${n(s * s / (2 * th), 4)})$.`, `規格化すると $p_\\infty(x) = \\sqrt{${n(k, 4)}/\\pi}\\,e^{-${ct(k, 'x^2')}}$ で、正規分布 $N(0, \\sigma^2/2\\theta) = N(0, ${n(s * s / (2 * th), 4)})$ です。`], ['It is the ridge the density surface flattens into on the right of the figure.', '図の右側で密度の曲面が落ち着く尾根がこれです。']],
        set: { theta: th, sigma: s, t: 4 },
      };
    },
  ];
})();
