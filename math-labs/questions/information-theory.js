'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const lg = Math.log2, xlog = (x) => (x > 0 ? -x * lg(x) : 0), H2 = (p) => xlog(p) + xlog(1 - p);
  const H = (ps) => ps.reduce((s, p) => s + xlog(p), 0);
  const pw = (k) => (k === 1 ? '\\tfrac12' : `\\tfrac{1}{${2 ** k}}`);
  // a dyadic distribution: split a random cell in two until there are k cells; returns exponents
  function dyadic(r, k) { const e = [0]; while (e.length < k) { const i = r.int(0, e.length - 1); const x = e.splice(i, 1)[0]; e.push(x + 1, x + 1); } return e.sort((a, b) => a - b); }
  // Huffman code lengths
  function huffman(ps) {
    let nodes = ps.map((p, i) => ({ p, leaves: [i] })); const len = ps.map(() => 0);
    while (nodes.length > 1) { nodes.sort((a, b) => a.p - b.p); const [a, b] = nodes.splice(0, 2); [...a.leaves, ...b.leaves].forEach((i) => len[i]++); nodes.push({ p: a.p + b.p, leaves: [...a.leaves, ...b.leaves] }); }
    return len;
  }
  const bitsU = ['bits', 'ビット'];
  const bw = (v) => (Math.abs(v - 1) < 1e-12 ? 'bit' : 'bits');

  /* ---------- 1. entropy ---------- */
  Q.entropy = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const den = r.pick([2, 4, 8, 16, 32, 64, 1024, 3, 5, 10, 100]), v = lg(den);
        return {
          q: [`An outcome has probability $${frac(1, den)}$. How surprising is it, in bits?`, `確率 $${frac(1, den)}$ の結果の驚きは何ビットですか。`],
          a: { type: 'num', v, unit: bitsU, show: Number.isInteger(v) ? String(v) : `\\log_2 ${den}` },
          hint: ['Surprise is $-\\log_2 p$.', '驚きは $-\\log_2 p$ です。'],
          sol: [[`$-\\log_2 ${frac(1, den)} = \\log_2 ${den} = ${n(v, 4)}$ ${bw(v)}.`, `$-\\log_2 ${frac(1, den)} = \\log_2 ${den} = ${n(v, 4)}$ ビットです。`], [Number.isInteger(v) ? v === 1 ? 'It is as surprising as calling one fair coin flip correctly.' : `It is as surprising as ${v} fair coin flips all coming out as called.` : 'Halving a probability always adds exactly one bit of surprise.', Number.isInteger(v) ? `公平なコインを ${v} 回投げて、すべて予想どおりになるのと同じ驚きです。` : '確率が半分になるたびに、驚きはちょうど1ビット増えます。']],
          set: 100 % den === 0 ? { p: 1 / den } : undefined,
        };
      }
      if (kind === 1) {
        const M = r.pick([2, 4, 8, 6, 10, 26, 32, 3, 64]), v = lg(M);
        return {
          q: [`What is the entropy of a uniform choice among ${M} outcomes?`, `${M} 通りの結果から一様に選ぶときのエントロピーはいくつですか。`],
          a: { type: 'num', v, unit: bitsU, show: Number.isInteger(v) ? String(v) : `\\log_2 ${M}` },
          hint: ['Every outcome has the same surprise, so the average is that surprise.', 'どの結果も驚きが同じなので、平均はその驚きそのものです。'],
          sol: [[`$H = \\sum_x \\tfrac1{${M}}\\log_2 ${M} = \\log_2 ${M} = ${n(v, 4)}$ ${bw(v)}.`, `$H = \\sum_x \\tfrac1{${M}}\\log_2 ${M} = \\log_2 ${M} = ${n(v, 4)}$ ビットです。`], [`This is the most any distribution on ${M} outcomes can have${M === 26 ? ': a random letter carries about 4.7 bits' : ''}.`, `${M} 通りの結果上の分布として最大の値です${M === 26 ? '。でたらめなアルファベット1文字は約 4.7 ビットを運びます' : ''}。`]],
        };
      }
      const p = r.pick([0.5, 0.25, 0.75, 0.125, 0.875, 0.1, 0.9, 0.2, 0.8, 0.05, 0.01]), v = H2(p);
      return {
        q: [`A binary source emits 1 with probability $${n(p)}$. What is its entropy? Three decimals.`, `1 を確率 $${n(p)}$ で出す二値情報源のエントロピーはいくつですか（小数第3位まで）。`],
        a: { type: 'num', v, tol: 6e-4, unit: bitsU },
        hint: ['$H(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$.', '$H(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$ です。'],
        sol: [[`$H = ${n(p)}\\cdot${n(-lg(p), 4)} + ${n(1 - p)}\\cdot${n(-lg(1 - p), 4)}$.`, `$H = ${n(p)}\\cdot${n(-lg(p), 4)} + ${n(1 - p)}\\cdot${n(-lg(1 - p), 4)}$ です。`], [`$= ${n(v, 4)}$ bits: the total shaded area of the two blocks.`, `$= ${n(v, 4)}$ ビットで、2つのブロックの網掛けの面積の合計です。`]],
        set: Math.abs(p * 100 - Math.round(p * 100)) < 1e-9 ? { p } : undefined,
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const e = dyadic(r, r.int(3, 6)), v = e.reduce((s, k) => s + k / 2 ** k, 0);
        return {
          q: [`Find the entropy of the distribution $(${e.map(pw).join(', ')})$.`, `分布 $(${e.map(pw).join(', ')})$ のエントロピーを求めてください。`],
          a: { type: 'num', v, unit: bitsU },
          hint: ['An outcome of probability $2^{-k}$ has surprise exactly $k$ bits.', '確率 $2^{-k}$ の結果の驚きはちょうど $k$ ビットです。'],
          sol: [[`$H = \\sum 2^{-k}\\cdot k = ${e.map((k) => `${pw(k)}\\cdot ${k}`).join(' + ')}$.`, `$H = \\sum 2^{-k}\\cdot k = ${e.map((k) => `${pw(k)}\\cdot ${k}`).join(' + ')}$ です。`], [`$H = ${n(v, 4)}$ bits. Asking yes/no questions that halve the probability each time identifies the outcome in exactly this many questions on average.`, `$H = ${n(v, 4)}$ ビットです。毎回確率を半分に分ける「はい・いいえ」の質問をすれば、平均してちょうどこの回数で結果を特定できます。`]],
        };
      }
      if (kind === 1) {
        const p = r.step(0.02, 0.98, 0.01), v = H2(p);
        return {
          q: [`Find $H(p)$ for $p = ${n(p)}$, to four decimals.`, `$p = ${n(p)}$ のときの $H(p)$ を小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 6e-5, unit: bitsU },
          hint: ['Add the two surprise-times-probability terms.', '驚きと確率の積の2つの項を足します。'],
          sol: [[`Surprises: $-\\log_2 ${n(p)} = ${n(-lg(p), 4)}$ and $-\\log_2 ${n(1 - p)} = ${n(-lg(1 - p), 4)}$.`, `驚きは $-\\log_2 ${n(p)} = ${n(-lg(p), 4)}$ と $-\\log_2 ${n(1 - p)} = ${n(-lg(1 - p), 4)}$ です。`], [`$H = ${n(xlog(p), 4)} + ${n(xlog(1 - p), 4)} = ${n(v, 5)}$ bits, ${v > 0.9 ? 'close to the one-bit maximum' : 'well below one bit: the source is predictable'}.`, `$H = ${n(xlog(p), 4)} + ${n(xlog(1 - p), 4)} = ${n(v, 5)}$ ビットで、${v > 0.9 ? '最大値の1ビットに近い値です' : '1ビットを大きく下回り、予測しやすい情報源です'}。`]],
          set: { p },
        };
      }
      let ps; do { const a = r.int(1, 7), b = r.int(1, 9 - a); ps = [a, b, 10 - a - b].map((x) => x / 10); } while (ps.some((x) => x <= 0));
      const v = H(ps);
      return {
        q: [`A die-like source has three outcomes with probabilities $(${ps.map((x) => n(x)).join(', ')})$. Find its entropy to three decimals.`, `3通りの結果を確率 $(${ps.map((x) => n(x)).join(', ')})$ で出す情報源のエントロピーを小数第3位まで求めてください。`],
        a: { type: 'num', v, tol: 6e-4, unit: bitsU },
        hint: ['$H = -\\sum p\\log_2 p$ over all three outcomes.', '3つの結果すべてについて $H = -\\sum p\\log_2 p$ を計算します。'],
        sol: [[`$H = ${ps.map((x) => `${n(xlog(x), 4)}`).join(' + ')}$.`, `$H = ${ps.map((x) => `${n(xlog(x), 4)}`).join(' + ')}$ です。`], [`$= ${n(v, 4)}$ bits, against the maximum $\\log_2 3 = 1.585$ for three equally likely outcomes.`, `$= ${n(v, 4)}$ ビットで、3通りが等確率のときの最大値 $\\log_2 3 = 1.585$ と比べられます。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let ps; do { const k = r.int(4, 5), w = Array.from({ length: k }, () => r.int(1, 9)); const s = w.reduce((a, b) => a + b, 0); ps = w.map((x) => Math.round(100 * x / s) / 100); ps[0] = Number((1 - ps.slice(1).reduce((a, b) => a + b, 0)).toFixed(2)); } while (ps.some((x) => x <= 0));
        ps.sort((a, b) => b - a);
        const len = huffman(ps), L = ps.reduce((s, p, i) => s + p * len[i], 0), h = H(ps);
        return {
          q: [`Build a Huffman code for symbols with probabilities $(${ps.map((x) => n(x)).join(', ')})$. What is its expected length in bits per symbol?`, `確率 $(${ps.map((x) => n(x)).join(', ')})$ の記号にハフマン符号を作ります。1記号あたりの平均符号長は何ビットですか。`],
          a: { type: 'num', v: L, tol: 1e-6, unit: bitsU },
          hint: ['Repeatedly merge the two least likely nodes; each merge adds one bit to every symbol beneath it.', '確率が最小の2つの節点を繰り返しまとめます。まとめるたびに、その下のすべての記号に1ビットが加わります。'],
          sol: [[`Merging smallest pairs gives code lengths $(${len.join(', ')})$.`, `最小の組を順にまとめると、符号長は $(${len.join(', ')})$ になります。`], [`$L = ${ps.map((p, i) => `${n(p)}\\cdot${len[i]}`).join(' + ')} = ${n(L, 4)}$ bits.`, `$L = ${ps.map((p, i) => `${n(p)}\\cdot${len[i]}`).join(' + ')} = ${n(L, 4)}$ ビットです。`], [`The entropy is $${n(h, 4)}$: Huffman sits within one bit of it ($H \\le L < H + 1$), and no prefix code does better.`, `エントロピーは $${n(h, 4)}$ です。ハフマン符号はその1ビット以内（$H \\le L < H + 1$）にあり、これより良い語頭符号はありません。`]],
        };
      }
      if (kind === 1) {
        return {
          q: ['Write the derivative $\\dfrac{dH}{dp}$ of the binary entropy $H(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$.', '二値エントロピー $H(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$ の導関数 $\\dfrac{dH}{dp}$ を答えてください。'],
          a: { type: 'expr', v: 'log2((1-p)/p)', vars: ['p'], dom: { p: [0.05, 0.95] }, lhs: ["$H'(p) =$", "$H'(p) =$"] },
          hint: ['$\\dfrac{d}{dp}(p\\log_2 p) = \\log_2 p + \\dfrac{1}{\\ln 2}$.', '$\\dfrac{d}{dp}(p\\log_2 p) = \\log_2 p + \\dfrac{1}{\\ln 2}$ です。'],
          sol: [['$H\'(p) = -\\log_2 p - \\tfrac{1}{\\ln 2} + \\log_2(1 - p) + \\tfrac{1}{\\ln 2}$.', '$H\'(p) = -\\log_2 p - \\tfrac{1}{\\ln 2} + \\log_2(1 - p) + \\tfrac{1}{\\ln 2}$ です。'], ['$H\'(p) = \\log_2\\dfrac{1 - p}{p}$: zero only at $p = \\tfrac12$, the peak, and infinite at the ends, which is why the curve meets the axis vertically.', '$H\'(p) = \\log_2\\dfrac{1 - p}{p}$ で、0 になるのは頂点の $p = \\tfrac12$ だけです。両端では無限大になるため、曲線は軸に垂直に接します。']],
        };
      }
      const target = r.pick([0.5, 0.25, 0.75, 0.1, 0.9, 0.469, 0.2]), hi = r.chance(0.5);
      let lo = 1e-9, up = 0.5; for (let i = 0; i < 80; i++) { const m = (lo + up) / 2; if (H2(m) < target) lo = m; else up = m; }
      const p0 = (lo + up) / 2, p = hi ? 1 - p0 : p0;
      return {
        q: [`Find the probability $p ${hi ? '>' : '<'} \\tfrac12$ for which a binary source has entropy exactly $${n(target)}$ bits. Three decimals.`, `二値情報源のエントロピーがちょうど $${n(target)}$ ビットになる確率 $p ${hi ? '>' : '<'} \\tfrac12$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: p, tol: 0.0015 },
        hint: ['$H$ is increasing on $[0, \\tfrac12]$; bisect, and use the symmetry $H(p) = H(1 - p)$.', '$H$ は $[0, \\tfrac12]$ で増加します。二分法を使い、対称性 $H(p) = H(1 - p)$ も利用します。'],
        sol: [[`On $[0, \\tfrac12]$, bisection gives $p = ${n(p0, 4)}$ with $H(${n(p0, 4)}) = ${n(H2(p0), 4)}$.`, `$[0, \\tfrac12]$ で二分法を使うと $p = ${n(p0, 4)}$、$H(${n(p0, 4)}) = ${n(H2(p0), 4)}$ です。`], [hi ? `By symmetry the answer above $\\tfrac12$ is $1 - ${n(p0, 4)} = ${n(p, 4)}$.` : `So $p \\approx ${n(p, 4)}$.`, hi ? `対称性により、$\\tfrac12$ より大きい答えは $1 - ${n(p0, 4)} = ${n(p, 4)}$ です。` : `したがって $p \\approx ${n(p, 4)}$ です。`], [`${target <= 0.5 ? 'Even a heavily biased source keeps a surprising amount of uncertainty: the curve is steep near the ends.' : 'Near the top the curve is flat: quite unequal probabilities still give nearly a full bit.'}`, `${target <= 0.5 ? '大きく偏った情報源でも、不確かさは意外に残ります。曲線は端の近くで急だからです。' : '頂点の近くでは曲線は平らで、かなり不均等な確率でもほぼ1ビットになります。'}`]],
        set: { p: Math.min(0.99, Math.max(0.01, Math.round(p * 100) / 100)) },
      };
    },
  ];

  /* ---------- 2. binary symmetric channel ---------- */
  Q.channel = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const f = r.step(0.01, 0.5, 0.01), C = 1 - H2(f);
        return {
          q: [`A binary symmetric channel flips each bit with probability $f = ${n(f)}$. What is its capacity? Three decimals.`, `各ビットを確率 $f = ${n(f)}$ で反転する二値対称通信路の容量はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: C, tol: 6e-4, unit: ['bits per use', 'ビット/回'] },
          hint: ['$C = 1 - H(f)$, reached with a uniform input.', '$C = 1 - H(f)$ で、一様な入力で達成されます。'],
          sol: [[`$H(${n(f)}) = ${n(H2(f), 4)}$.`, `$H(${n(f)}) = ${n(H2(f), 4)}$ です。`], [`$C = 1 - ${n(H2(f), 4)} = ${n(C, 4)}$ bits per use: ${f >= 0.5 - 1e-9 ? 'a channel that flips half the bits carries nothing.' : 'the noise costs exactly the entropy of a flip.'}`, `$C = 1 - ${n(H2(f), 4)} = ${n(C, 4)}$ ビット/回です。${f >= 0.5 - 1e-9 ? '半分のビットを反転する通信路は何も伝えません。' : '雑音はちょうど反転のエントロピー分だけ損失を生みます。'}`]],
          set: { noise: f, input: 0.5 },
        };
      }
      if (kind === 1) {
        const e = r.pick([0.1, 0.2, 0.25, 0.3, 0.5, 0.05, 0.4]);
        return {
          q: [`A binary erasure channel loses each bit with probability $\\varepsilon = ${n(e)}$ (the receiver sees "?") and delivers the rest intact. What is its capacity?`, `二値消失通信路は各ビットを確率 $\\varepsilon = ${n(e)}$ で失い（受信側には「?」と見えます）、残りは正しく届けます。容量はいくつですか。`],
          a: { type: 'num', v: 1 - e, unit: ['bits per use', 'ビット/回'] },
          hint: ['The receiver knows which bits were lost.', '受信側は、どのビットが失われたかを知っています。'],
          sol: [[`An erasure is announced, so each delivered bit is fully informative and each erased one carries nothing.`, `消失は知らされるので、届いたビットは完全な情報を持ち、消えたビットは何も運びません。`], [`$C = 1 - \\varepsilon = ${n(1 - e)}$. Compare a symmetric channel with $f = ${n(e / 2)}$: it errs less often but has capacity $${n(1 - H2(e / 2), 3)}$, because silent errors are worse than announced ones.`, `$C = 1 - \\varepsilon = ${n(1 - e)}$ です。$f = ${n(e / 2)}$ の対称通信路は誤りが少ないのに容量は $${n(1 - H2(e / 2), 3)}$ です。知らされない誤りは、知らされる消失より悪いのです。`]],
        };
      }
      const f = r.step(0, 0.5, 0.01), pi = r.step(0.05, 0.95, 0.05), py = pi * (1 - f) + (1 - pi) * f;
      return {
        q: [`Inputs are 1 with probability $${n(pi)}$, and the channel flips bits with $f = ${n(f)}$. What is $P(Y = 1)$?`, `入力が 1 である確率は $${n(pi)}$ で、通信路は $f = ${n(f)}$ でビットを反転します。$P(Y = 1)$ はいくつですか。`],
        a: { type: 'num', v: py },
        hint: ['A 1 arrives either as a 1 that survived or as a 0 that flipped.', '1 が届くのは、生き残った 1 か、反転した 0 のどちらかです。'],
        sol: [[`$P(Y = 1) = ${n(pi)}\\cdot${n(1 - f)} + ${n(1 - pi)}\\cdot${n(f)}$.`, `$P(Y = 1) = ${n(pi)}\\cdot${n(1 - f)} + ${n(1 - pi)}\\cdot${n(f)}$ です。`], [`$= ${n(py, 4)}$: noise pulls the output toward $\\tfrac12$, which is why $H(Y)$ never drops below $H(f)$.`, `$= ${n(py, 4)}$ です。雑音は出力を $\\tfrac12$ に引き寄せるので、$H(Y)$ は $H(f)$ を下回りません。`]],
        set: { noise: f, input: pi },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const f = r.step(0.01, 0.4, 0.01), pi = r.step(0.05, 0.95, 0.05), py = pi * (1 - f) + (1 - pi) * f, I = H2(py) - H2(f);
        return {
          q: [`Input $P(X = 1) = ${n(pi)}$, flip probability $f = ${n(f)}$. Find the mutual information $I(X; Y)$, to three decimals.`, `入力 $P(X = 1) = ${n(pi)}$、反転確率 $f = ${n(f)}$ のとき、相互情報量 $I(X; Y)$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: I, tol: 6e-4, unit: bitsU },
          hint: ['$I = H(Y) - H(Y \\mid X)$, and $H(Y \\mid X) = H(f)$ whatever the input.', '$I = H(Y) - H(Y \\mid X)$ で、入力によらず $H(Y \\mid X) = H(f)$ です。'],
          sol: [[`$P(Y = 1) = ${n(py, 4)}$, so $H(Y) = ${n(H2(py), 4)}$.`, `$P(Y = 1) = ${n(py, 4)}$ なので $H(Y) = ${n(H2(py), 4)}$ です。`], [`$I = ${n(H2(py), 4)} - ${n(H2(f), 4)} = ${n(I, 4)}$ bits, the gold gap in the figure; capacity would be $${n(1 - H2(f), 4)}$.`, `$I = ${n(H2(py), 4)} - ${n(H2(f), 4)} = ${n(I, 4)}$ ビットで、図の金色の隙間です。容量は $${n(1 - H2(f), 4)}$ です。`]],
          set: { noise: f, input: pi },
        };
      }
      if (kind === 1) {
        const f = r.pick([0.01, 0.02, 0.05, 0.1, 0.11, 0.2]), N = r.pick([1000, 10000, 1e6]), C = 1 - H2(f);
        return {
          q: [`A link flips bits with probability $${n(f)}$ and is used ${N.toLocaleString('en')} times. At best, how many bits of real information can be sent reliably? Give the nearest whole number.`, `ビットを確率 $${n(f)}$ で反転する回線を ${N.toLocaleString('en')} 回使います。最大で何ビットの情報を確実に送れますか（整数に丸めて）。`],
          a: { type: 'num', v: N * C, tol: Math.max(1, N * 2e-5), unit: bitsU },
          hint: ['Shannon: reliable communication is possible at any rate below capacity, and impossible above it.', 'シャノンの定理：容量より低い速度なら確実な通信が可能で、容量を超えると不可能です。'],
          sol: [[`$C = 1 - H(${n(f)}) = ${n(C, 5)}$ bits per use.`, `$C = 1 - H(${n(f)}) = ${n(C, 5)}$ ビット/回です。`], [`$${N.toLocaleString('en')} \\times ${n(C, 5)} \\approx ${Math.round(N * C).toLocaleString('en')}$ bits, using long error-correcting codes. A ${n(100 * f)}% flip rate costs ${n(100 * (1 - C), 1)}% of the raw capacity.`, `長い誤り訂正符号を使えば $${N.toLocaleString('en')} \\times ${n(C, 5)} \\approx ${Math.round(N * C).toLocaleString('en')}$ ビットです。反転率 ${n(100 * f)}% で、生の容量の ${n(100 * (1 - C), 1)}% が失われます。`]],
          set: { noise: f, input: 0.5 },
        };
      }
      const f = r.step(0.01, 0.4, 0.01), pi = r.step(0.05, 0.95, 0.05), py = pi * (1 - f) + (1 - pi) * f, I = H2(py) - H2(f), eq = H2(pi) - I;
      return {
        q: [`Input $P(X = 1) = ${n(pi)}$, flip probability $f = ${n(f)}$. How much uncertainty about the input remains after seeing the output, $H(X \\mid Y)$? Three decimals.`, `入力 $P(X = 1) = ${n(pi)}$、反転確率 $f = ${n(f)}$ のとき、出力を見た後に入力について残る不確かさ $H(X \\mid Y)$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: eq, tol: 6e-4, unit: bitsU },
        hint: ['$H(X \\mid Y) = H(X) - I(X; Y)$, and $I$ is symmetric.', '$H(X \\mid Y) = H(X) - I(X; Y)$ で、$I$ は対称です。'],
        sol: [[`$H(X) = H(${n(pi)}) = ${n(H2(pi), 4)}$ and $I = H(Y) - H(f) = ${n(H2(py), 4)} - ${n(H2(f), 4)} = ${n(I, 4)}$.`, `$H(X) = H(${n(pi)}) = ${n(H2(pi), 4)}$、$I = H(Y) - H(f) = ${n(H2(py), 4)} - ${n(H2(f), 4)} = ${n(I, 4)}$ です。`], [`$H(X \\mid Y) = ${n(H2(pi), 4)} - ${n(I, 4)} = ${n(eq, 4)}$ bits: the part of the message the channel lost, which coding has to restore with redundancy.`, `$H(X \\mid Y) = ${n(H2(pi), 4)} - ${n(I, 4)} = ${n(eq, 4)}$ ビットです。通信路が失った部分で、符号化は冗長性でそれを取り戻す必要があります。`]],
        set: { noise: f, input: pi },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const c = r.pick([0.5, 0.25, 0.75, 0.9, 0.1, 0.6]);
        let lo = 0, up = 0.5; for (let i = 0; i < 80; i++) { const m = (lo + up) / 2; if (1 - H2(m) > c) lo = m; else up = m; }
        const f = (lo + up) / 2;
        return {
          q: [`What flip probability $f < \\tfrac12$ gives a binary symmetric channel a capacity of exactly $${n(c)}$ bits per use? Three decimals.`, `二値対称通信路の容量がちょうど $${n(c)}$ ビット/回になる反転確率 $f < \\tfrac12$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: f, tol: 0.0015 },
          hint: ['Solve $H(f) = 1 - C$ on $[0, \\tfrac12]$, where $H$ is increasing.', '$H$ が増加する $[0, \\tfrac12]$ で $H(f) = 1 - C$ を解きます。'],
          sol: [[`Need $H(f) = ${n(1 - c)}$.`, `$H(f) = ${n(1 - c)}$ が必要です。`], [`Bisection gives $f = ${n(f, 4)}$ (check: $H(${n(f, 4)}) = ${n(H2(f), 4)}$).`, `二分法で $f = ${n(f, 4)}$ を得ます（確認：$H(${n(f, 4)}) = ${n(H2(f), 4)}$）。`], [c === 0.5 ? 'Flipping only one bit in nine already halves the capacity.' : 'Capacity falls fastest for small $f$: the first errors are the most expensive.', c === 0.5 ? '9ビットに1ビット反転するだけで、容量はもう半分です。' : '容量は $f$ が小さいところで最も速く下がります。最初の誤りが最も高くつくのです。']],
          set: { noise: Math.round(f * 100) / 100, input: 0.5 },
        };
      }
      if (kind === 1) {
        const f = r.pick([0.9, 0.95, 0.8, 0.99, 0.7, 1]), C = 1 - H2(f);
        return {
          q: [`A faulty wire flips each bit with probability $f = ${n(f)}$. What is its capacity? Three decimals.`, `故障した配線が各ビットを確率 $f = ${n(f)}$ で反転します。容量はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: C, tol: 6e-4, unit: ['bits per use', 'ビット/回'] },
          hint: ['What happens if the receiver inverts every bit it gets?', '受信側が受け取ったビットをすべて反転したらどうなるでしょうか。'],
          sol: [[`Inverting the output turns it into a channel with flip probability $${n(1 - f)}$, and relabelling cannot change the information.`, `出力を反転すると反転確率 $${n(1 - f)}$ の通信路になり、ラベルの付け替えで情報量は変わりません。`], [`$C = 1 - H(${n(f)}) = 1 - H(${n(1 - f)}) = ${n(C, 4)}$. The worst channel is $f = \\tfrac12$, not $f = 1$${f === 1 ? ', which is a perfect channel' : ''}.`, `$C = 1 - H(${n(f)}) = 1 - H(${n(1 - f)}) = ${n(C, 4)}$ です。最悪の通信路は $f = 1$ ではなく $f = \\tfrac12$ です${f === 1 ? '。$f = 1$ は完全な通信路です' : ''}。`]],
          set: { noise: Math.round((1 - f) * 100) / 100, input: 0.5 },
        };
      }
      if (kind === 2) {
        const f = r.pick([0.05, 0.1, 0.2, 0.15, 0.3, 0.02]), g = 2 * f * (1 - f), C = 1 - H2(g);
        return {
          q: [`A signal passes through two independent binary symmetric channels in a row, each with $f = ${n(f)}$. What is the capacity of the combination? Three decimals.`, `信号が、それぞれ $f = ${n(f)}$ の独立な二値対称通信路を2つ続けて通ります。全体の容量はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: C, tol: 6e-4, unit: ['bits per use', 'ビット/回'] },
          hint: ['A bit arrives flipped if exactly one of the two stages flips it.', '2段のうちちょうど1段が反転させたとき、ビットは反転して届きます。'],
          sol: [[`Net flip probability $2f(1 - f) = 2\\cdot${n(f)}\\cdot${n(1 - f)} = ${n(g, 4)}$.`, `全体の反転確率は $2f(1 - f) = 2\\cdot${n(f)}\\cdot${n(1 - f)} = ${n(g, 4)}$ です。`], [`$C = 1 - H(${n(g, 4)}) = ${n(C, 4)}$, below the single stage's $${n(1 - H2(f), 4)}$: processing can never add information (the data-processing inequality).`, `$C = 1 - H(${n(g, 4)}) = ${n(C, 4)}$ で、1段だけの $${n(1 - H2(f), 4)}$ より小さくなります。処理によって情報が増えることはありません（データ処理不等式）。`]],
          set: Math.abs(g * 100 - Math.round(g * 100)) < 1e-9 ? { noise: Math.round(g * 100) / 100, input: 0.5 } : { input: 0.5 },
        };
      }
      const e = r.pick([0.1, 0.2, 0.25, 0.3, 0.5]);
      return {
        q: [`A binary erasure channel erases each bit with probability $${n(e)}$. Write $I(X; Y)$ as a function of the input probability $x = P(X = 1)$.`, `二値消失通信路が各ビットを確率 $${n(e)}$ で消失させます。$I(X; Y)$ を入力確率 $x = P(X = 1)$ の式で表してください。`],
        a: { type: 'expr', v: `${n(1 - e)}*(-x*log2(x)-(1-x)*log2(1-x))`, vars: ['x'], dom: { x: [0.05, 0.95] }, lhs: ['$I(x) =$', '$I(x) =$'] },
        hint: ['Given an erasure you learn nothing; otherwise you learn $X$ exactly.', '消失したら何もわからず、そうでなければ $X$ が正確にわかります。'],
        sol: [[`$H(X \\mid Y) = ${n(e)}\\,H(X)$, so $I = H(X) - ${n(e)}H(X) = ${n(1 - e)}\\,H(x)$.`, `$H(X \\mid Y) = ${n(e)}\\,H(X)$ なので $I = H(X) - ${n(e)}H(X) = ${n(1 - e)}\\,H(x)$ です。`], [`$I(x) = ${n(1 - e)}\\bigl(-x\\log_2 x - (1 - x)\\log_2(1 - x)\\bigr)$, maximal at $x = \\tfrac12$: capacity $${n(1 - e)}$.`, `$I(x) = ${n(1 - e)}\\bigl(-x\\log_2 x - (1 - x)\\log_2(1 - x)\\bigr)$ で、$x = \\tfrac12$ で最大となり、容量は $${n(1 - e)}$ です。`]],
      };
    },
  ];

  /* ---------- 3. Kullback-Leibler divergence ---------- */
  const dkl = (a, b) => a * lg(a / b) + (1 - a) * lg((1 - a) / (1 - b));
  Q.kl = [
    (r) => {
      const kind = r.int(0, 2), p = r.step(0.05, 0.95, 0.05), q = r.step(0.05, 0.95, 0.05);
      if (kind === 0) {
        const which = r.int(0, 1), a = which ? 1 - p : p, b = which ? 1 - q : q, t = a * lg(a / b);
        return {
          q: [`$P = (${n(p)}, ${n(1 - p)})$, $Q = (${n(q)}, ${n(1 - q)})$. What is the term of $D(P\\|Q)$ for the outcome $x = ${which ? 0 : 1}$, $P(x)\\log_2\\bigl(P(x)/Q(x)\\bigr)$? Three decimals.`, `$P = (${n(p)}, ${n(1 - p)})$、$Q = (${n(q)}, ${n(1 - q)})$ です。$D(P\\|Q)$ の結果 $x = ${which ? 0 : 1}$ の項 $P(x)\\log_2\\bigl(P(x)/Q(x)\\bigr)$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: t, tol: 6e-4 },
          hint: ['The term is negative when the model gives the outcome more probability than it really has.', 'モデルが実際より大きな確率を与える結果では、この項は負になります。'],
          sol: [[`$${n(a)}\\log_2(${n(a)}/${n(b)}) = ${n(a)}\\cdot${n(lg(a / b), 4)}$.`, `$${n(a)}\\log_2(${n(a)}/${n(b)}) = ${n(a)}\\cdot${n(lg(a / b), 4)}$ です。`], [`$= ${n(t, 4)}$${t < 0 ? ': negative, but the other term always outweighs it' : ''}.`, `$= ${n(t, 4)}$ です${t < 0 ? '。負ですが、もう一方の項が必ずそれを上回ります' : ''}。`]],
          set: { p, q },
        };
      }
      if (kind === 1) {
        const ce = -p * lg(q) - (1 - p) * lg(1 - q);
        return {
          q: [`Outcomes follow $P = (${n(p)}, ${n(1 - p)})$, but a code is designed for $Q = (${n(q)}, ${n(1 - q)})$, with lengths $-\\log_2 Q(x)$. What is the expected code length (the cross-entropy $H(P, Q)$)? Three decimals.`, `結果は $P = (${n(p)}, ${n(1 - p)})$ に従いますが、符号は $Q = (${n(q)}, ${n(1 - q)})$ に合わせて長さ $-\\log_2 Q(x)$ で作られています。平均符号長（交差エントロピー $H(P, Q)$）を小数第3位まで求めてください。`],
          a: { type: 'num', v: ce, tol: 6e-4, unit: bitsU },
          hint: ['Average the code lengths $-\\log_2 Q(x)$ using the true probabilities $P(x)$.', '符号長 $-\\log_2 Q(x)$ を、真の確率 $P(x)$ で平均します。'],
          sol: [[`$H(P, Q) = ${n(p)}\\cdot${n(-lg(q), 4)} + ${n(1 - p)}\\cdot${n(-lg(1 - q), 4)} = ${n(ce, 4)}$.`, `$H(P, Q) = ${n(p)}\\cdot${n(-lg(q), 4)} + ${n(1 - p)}\\cdot${n(-lg(1 - q), 4)} = ${n(ce, 4)}$ です。`], [`It exceeds $H(P) = ${n(H2(p), 4)}$ by $D(P\\|Q) = ${n(ce - H2(p), 4)}$: the price of the wrong model.`, `これは $H(P) = ${n(H2(p), 4)}$ より $D(P\\|Q) = ${n(ce - H2(p), 4)}$ だけ大きく、誤ったモデルの代償です。`]],
          set: { p, q },
        };
      }
      return {
        q: [`An event is certain under $P$ but has probability $${n(q)}$ under the model $Q$. What is $D(P\\|Q)$? Three decimals.`, `ある事象は $P$ のもとでは確実ですが、モデル $Q$ のもとでは確率 $${n(q)}$ です。$D(P\\|Q)$ はいくつですか（小数第3位まで）。`],
        a: { type: 'num', v: -lg(q), tol: 6e-4, unit: bitsU },
        hint: ['Only the outcome with $P(x) = 1$ contributes; $0\\log 0 = 0$.', '$P(x) = 1$ の結果だけが寄与し、$0\\log 0 = 0$ です。'],
        sol: [[`$D = 1\\cdot\\log_2(1/${n(q)})$.`, `$D = 1\\cdot\\log_2(1/${n(q)})$ です。`], [`$= ${n(-lg(q), 4)}$ bits, exactly the model's surprise at what always happens.`, `$= ${n(-lg(q), 4)}$ ビットで、いつも起きることに対するモデルの驚きそのものです。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind < 2) {
        let p, q; do { p = r.step(0.05, 0.95, 0.05); q = r.step(0.05, 0.95, 0.05); } while (Math.abs(p - q) < 1e-9);
        const rev = kind === 1, a = rev ? q : p, b = rev ? p : q, v = dkl(a, b);
        return {
          q: [`Observed $P = (${n(p)}, ${n(1 - p)})$, model $Q = (${n(q)}, ${n(1 - q)})$. Compute ${rev ? '$D(Q\\|P)$' : '$D(P\\|Q)$'} in bits, to four decimals.`, `観測 $P = (${n(p)}, ${n(1 - p)})$、モデル $Q = (${n(q)}, ${n(1 - q)})$ です。${rev ? '$D(Q\\|P)$' : '$D(P\\|Q)$'} をビット単位で小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 6e-5, unit: bitsU },
          hint: [rev ? 'Now the model plays the role of the true distribution: weight by $Q(x)$.' : 'Weight each log-ratio by $P(x)$.', rev ? '今度はモデルを真の分布として扱い、$Q(x)$ で重み付けします。' : '各対数比を $P(x)$ で重み付けします。'],
          sol: [[`$${n(a)}\\log_2\\frac{${n(a)}}{${n(b)}} + ${n(1 - a)}\\log_2\\frac{${n(1 - a)}}{${n(1 - b)}} = ${n(a * lg(a / b), 5)} ${(1 - a) * lg((1 - a) / (1 - b)) < 0 ? '-' : '+'} ${n(Math.abs((1 - a) * lg((1 - a) / (1 - b))), 5)}$.`, `$${n(a)}\\log_2\\frac{${n(a)}}{${n(b)}} + ${n(1 - a)}\\log_2\\frac{${n(1 - a)}}{${n(1 - b)}} = ${n(a * lg(a / b), 5)} ${(1 - a) * lg((1 - a) / (1 - b)) < 0 ? '-' : '+'} ${n(Math.abs((1 - a) * lg((1 - a) / (1 - b))), 5)}$ です。`], [`$= ${n(v, 5)}$ bits. ${rev ? `The other direction gives $${n(dkl(p, q), 4)}$.` : `The reverse direction gives $${n(dkl(q, p), 4)}$.`}`, `$= ${n(v, 5)}$ ビットです。${rev ? `逆向きは $${n(dkl(p, q), 4)}$ です。` : `逆向きは $${n(dkl(q, p), 4)}$ です。`}`]],
          set: { p, q },
        };
      }
      const e1 = dyadic(r, 3), e2 = r.shuffle(e1.slice());
      if (e2.every((x, i) => x === e1[i])) e2.reverse();
      const v = e1.reduce((s, k, i) => s + 2 ** -k * (e2[i] - k), 0);
      return {
        q: [`Find $D(P\\|Q)$ for $P = (${e1.map(pw).join(', ')})$ and $Q = (${e2.map(pw).join(', ')})$.`, `$P = (${e1.map(pw).join(', ')})$、$Q = (${e2.map(pw).join(', ')})$ のとき、$D(P\\|Q)$ を求めてください。`],
        a: { type: 'num', v, unit: bitsU },
        hint: ['With powers of two, $\\log_2(P/Q)$ is a whole number for every outcome.', '2の累乗どうしなので、どの結果でも $\\log_2(P/Q)$ は整数です。'],
        sol: [[`$\\log_2\\bigl(P(x)/Q(x)\\bigr) = (${e1.map((k, i) => e2[i] - k).join(', ')})$.`, `$\\log_2\\bigl(P(x)/Q(x)\\bigr) = (${e1.map((k, i) => e2[i] - k).join(', ')})$ です。`], [`$D = ${e1.map((k, i) => `${pw(k)}\\cdot(${e2[i] - k})`).join(' + ')} = ${n(v, 4)}$ bits: the extra bits per symbol paid by coding $P$ with a code built for $Q$.`, `$D = ${e1.map((k, i) => `${pw(k)}\\cdot(${e2[i] - k})`).join(' + ')} = ${n(v, 4)}$ ビットで、$Q$ 用の符号で $P$ を符号化したときに1記号あたり余分にかかるビット数です。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let p, q; do { p = r.step(0.05, 0.95, 0.05); q = r.step(0.05, 0.95, 0.05); } while (Math.abs(p - q) < 1e-9 || Math.abs(p + q - 1) < 1e-9);
        const d = dkl(p, q) - dkl(q, p);
        return {
          q: [`For $P = (${n(p)}, ${n(1 - p)})$ and $Q = (${n(q)}, ${n(1 - q)})$, find $D(P\\|Q) - D(Q\\|P)$, to four decimals.`, `$P = (${n(p)}, ${n(1 - p)})$、$Q = (${n(q)}, ${n(1 - q)})$ のとき、$D(P\\|Q) - D(Q\\|P)$ を小数第4位まで求めてください。`],
          a: { type: 'num', v: d, tol: 6e-5 },
          hint: ['Compute both directions separately; the divergence is not a distance.', '両方の向きを別々に計算します。ダイバージェンスは距離ではありません。'],
          sol: [[`$D(P\\|Q) = ${n(dkl(p, q), 5)}$ and $D(Q\\|P) = ${n(dkl(q, p), 5)}$.`, `$D(P\\|Q) = ${n(dkl(p, q), 5)}$、$D(Q\\|P) = ${n(dkl(q, p), 5)}$ です。`], [`Difference $${n(d, 5)}$. ${d > 0 ? 'Assuming $Q$ when $P$ is true costs more here' : 'Assuming $P$ when $Q$ is true costs more here'}: a model that underrates an outcome that really happens is punished hardest.`, `差は $${n(d, 5)}$ です。${d > 0 ? 'ここでは、$P$ が真なのに $Q$ を仮定するほうが代償が大きくなります' : 'ここでは、$Q$ が真なのに $P$ を仮定するほうが代償が大きくなります'}。実際に起きる結果を過小評価するモデルが、最も重く罰せられます。`]],
          set: { p, q },
        };
      }
      if (kind === 1) {
        const p = r.step(0.1, 0.9, 0.05);
        return {
          q: [`Fix the observed $P = (${n(p)}, ${n(1 - p)})$. Write $D(P\\|Q)$ as a function of the model probability $q$.`, `観測 $P = (${n(p)}, ${n(1 - p)})$ を固定します。$D(P\\|Q)$ をモデル確率 $q$ の式で表してください。`],
          a: { type: 'expr', v: `${n(p)}*log2(${n(p)}/q)+${n(1 - p)}*log2(${n(1 - p)}/(1-q))`, vars: ['q'], dom: { q: [0.05, 0.95] }, lhs: ['$D(q) =$', '$D(q) =$'] },
          hint: ['Substitute $Q = (q, 1 - q)$ into the definition.', '定義に $Q = (q, 1 - q)$ を代入します。'],
          sol: [[`$D(q) = ${n(p)}\\log_2\\dfrac{${n(p)}}{q} + ${n(1 - p)}\\log_2\\dfrac{${n(1 - p)}}{1 - q}$.`, `$D(q) = ${n(p)}\\log_2\\dfrac{${n(p)}}{q} + ${n(1 - p)}\\log_2\\dfrac{${n(1 - p)}}{1 - q}$ です。`], [`$D'(q) = \\dfrac{1}{\\ln 2}\\Bigl(\\dfrac{q - ${n(p)}}{q(1 - q)}\\Bigr)$ vanishes only at $q = ${n(p)}$, the minimum where $D = 0$; it blows up as $q \\to 0$ or $1$.`, `$D'(q) = \\dfrac{1}{\\ln 2}\\Bigl(\\dfrac{q - ${n(p)}}{q(1 - q)}\\Bigr)$ が 0 になるのは $q = ${n(p)}$ だけで、そこが $D = 0$ の最小点です。$q \\to 0$ や $1$ で発散します。`]],
          set: { p, q: Math.abs(p - 0.5) > 0.2 ? 0.5 : 0.2 },
        };
      }
      const s = r.pick([1, 2, 0.5, 3]), dm = r.pick([0.5, 1, 1.5, 2, 3]), nats = dm * dm / (2 * s * s);
      return {
        q: [`Two normal models share $\\sigma = ${n(s)}$ and have means $${n(dm)}$ apart. Their divergence is $(\\mu_1 - \\mu_2)^2/(2\\sigma^2)$ in nats. What is it in bits? Four decimals.`, `2つの正規モデルは $\\sigma = ${n(s)}$ が共通で、平均が $${n(dm)}$ 離れています。ダイバージェンスはナット単位で $(\\mu_1 - \\mu_2)^2/(2\\sigma^2)$ です。ビット単位ではいくつですか（小数第4位まで）。`],
        a: { type: 'num', v: nats / Math.LN2, tol: 6e-5, unit: bitsU },
        hint: ['One nat is $1/\\ln 2 \\approx 1.4427$ bits.', '1ナットは $1/\\ln 2 \\approx 1.4427$ ビットです。'],
        sol: [[`$${n(dm)}^2/(2\\cdot${n(s)}^2) = ${n(nats, 5)}$ nats.`, `$${n(dm)}^2/(2\\cdot${n(s)}^2) = ${n(nats, 5)}$ ナットです。`], [`$\\times 1.4427 = ${n(nats / Math.LN2, 5)}$ bits. Here the divergence is symmetric, because both models have the same spread; in general it is not.`, `$\\times 1.4427 = ${n(nats / Math.LN2, 5)}$ ビットです。ここでは2つのモデルの広がりが同じなので対称ですが、一般には対称ではありません。`]],
      };
    },
  ];
})();
