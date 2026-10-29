'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PR = 13;
  const md = (a) => ((a % PR) + PR) % PR;
  const inv = (a) => { for (let x = 1; x < PR; x++) if (md(a * x) === 1) return x; return 0; };
  const pc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const bin = (x, w) => x.toString(2).padStart(w, '0');
  const binom = (a, b) => { if (b < 0 || b > a) return 0; let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); };
  const vol = (nn, t) => { let s = 0; for (let i = 0; i <= t; i++) s += binom(nn, i); return s; };
  const H2 = (x) => (x <= 0 || x >= 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x));
  // positional Hamming(7,4): parity at 1, 2, 4; data at 3, 5, 6, 7
  function enc(m) {
    const w = new Array(8).fill(0);
    [3, 5, 6, 7].forEach((p, i) => { w[p] = (m >> (3 - i)) & 1; });
    for (const pb of [1, 2, 4]) { let s = 0; for (let p = 1; p <= 7; p++) if (p !== pb && (p & pb)) s ^= w[p]; w[pb] = s; }
    return w;
  }
  const syn = (w) => { let s = 0; for (let p = 1; p <= 7; p++) if (w[p]) s ^= p; return s; };
  const word = (w) => w.slice(1).join('');

  /* ---------------- hamming-74 ---------------- */
  Q['hamming-74'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(0, 15), e = r.int(1, 7), w = enc(m), x = w.slice(); x[e] ^= 1;
        return {
          q: [`In the positional Hamming(7,4) code the syndrome is the XOR of the positions (1 to 7) holding a 1. The word $${word(x)}$ is received. What is its syndrome, as a number?`, `位置で表したハミング (7,4) 符号では、シンドロームは 1 が入っている位置（1 から 7）の XOR です。受信語 $${word(x)}$ のシンドロームを数で答えてください。`],
          a: { type: 'int', v: e },
          hint: ['List the positions holding a 1 and XOR them, one bit at a time.', '1 が入っている位置を書き出し、一ビットずつ XOR をとります。'],
          sol: [[`The 1s are at positions ${[1, 2, 3, 4, 5, 6, 7].filter((p) => x[p]).join(', ') || 'none'}.`, `1 は位置 ${[1, 2, 3, 4, 5, 6, 7].filter((p) => x[p]).join('、') || 'なし'} にあります。`], [`Their XOR is ${e} (binary $${bin(e, 3)}$), so the decoder flips bit ${e}.`, `その XOR は ${e}（二進数で $${bin(e, 3)}$）なので、復号器はビット ${e} を反転します。`]],
          set: { m },
        };
      }
      if (form === 1) {
        const rr = r.int(3, 6), N = 2 ** rr - 1, k = N - rr, askK = r.chance(0.5);
        return {
          q: [`A Hamming code uses $${rr}$ parity checks, and its columns are all the nonzero binary numbers with $${rr}$ digits. ${askK ? `How many message bits does each codeword carry?` : `How long is each codeword?`}`, `ハミング符号が $${rr}$ 個のパリティ検査を使い、その列は $${rr}$ 桁の 0 でない二進数すべてです。${askK ? '各符号語はメッセージのビットをいくつ運びますか。' : '各符号語の長さはいくらですか。'}`],
          a: { type: 'int', v: askK ? k : N },
          hint: ['There are $2^r - 1$ nonzero numbers with $r$ binary digits, one per position.', '$r$ 桁の 0 でない二進数は $2^r - 1$ 個あり、位置ごとに一つです。'],
          sol: [[`The length is $n = 2^{${rr}} - 1 = ${N}$.`, `長さは $n = 2^{${rr}} - 1 = ${N}$ です。`], [`${rr} positions are parity bits, so $k = ${N} - ${rr} = ${k}$ carry the message, a rate of $${k}/${N}$.`, `${rr} 個の位置がパリティビットなので、メッセージを運ぶのは $k = ${N} - ${rr} = ${k}$ 個で、レートは $${k}/${N}$ です。`]],
        };
      }
      return {
        q: ['A Hamming(7,4) word arrives with zero syndrome. What can the decoder conclude?', 'ハミング (7,4) の受信語のシンドロームがゼロでした。復号器は何を結論できますか。'],
        a: { type: 'choice', fixed: true, v: 1, opts: [['No bit was flipped', 'どのビットも反転していない'], ['It is a codeword: either nothing flipped, or at least three bits did', '符号語である。何も反転していないか、少なくとも三つのビットが反転した'], ['Exactly two bits were flipped', 'ちょうど二つのビットが反転した'], ['The parity bits are wrong but the data bits are right', 'パリティビットは誤りだが、データビットは正しい']] },
        hint: ['The minimum distance is 3.', '最小距離は 3 です。'],
        sol: [['Zero syndrome means the received word satisfies every check, so it is a codeword.', 'シンドロームがゼロということは、受信語がすべての検査を満たす、つまり符号語だということです。'], ['Codewords are at least 3 apart, so it is the sent word unless three or more bits flipped. The decoder accepts it; it cannot see the difference.', '符号語どうしは少なくとも 3 離れているので、三つ以上反転していない限り送った語そのものです。復号器はそれを受け入れます。違いは見えません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(1, 15), w = enc(m);
        return {
          q: [`Encode the message $${bin(m, 4)}$ in the positional Hamming(7,4) code: the data bits go to positions 3, 5, 6, 7 and each parity bit at 1, 2, 4 makes its check even. Give the parity bits at positions 1, 2 and 4.`, `メッセージ $${bin(m, 4)}$ を位置で表したハミング (7,4) 符号で符号化してください。データビットは位置 3、5、6、7 に入り、位置 1、2、4 のパリティビットはそれぞれの検査を偶数にします。位置 1、2、4 のパリティビットを答えてください。`],
          a: { type: 'tuple', v: [w[1], w[2], w[4]], labels: ['$b_1$', '$b_2$', '$b_4$'], tol: 0 },
          hint: ['Check 1 covers 1, 3, 5, 7; check 2 covers 2, 3, 6, 7; check 4 covers 4, 5, 6, 7.', '検査 1 は 1、3、5、7、検査 2 は 2、3、6、7、検査 4 は 4、5、6、7 を含みます。'],
          sol: [[`Data: $b_3 = ${w[3]}$, $b_5 = ${w[5]}$, $b_6 = ${w[6]}$, $b_7 = ${w[7]}$.`, `データ：$b_3 = ${w[3]}$、$b_5 = ${w[5]}$、$b_6 = ${w[6]}$、$b_7 = ${w[7]}$ です。`], [`$b_1 = b_3 \\oplus b_5 \\oplus b_7 = ${w[1]}$, $b_2 = b_3 \\oplus b_6 \\oplus b_7 = ${w[2]}$, $b_4 = b_5 \\oplus b_6 \\oplus b_7 = ${w[4]}$.`, `$b_1 = b_3 \\oplus b_5 \\oplus b_7 = ${w[1]}$、$b_2 = b_3 \\oplus b_6 \\oplus b_7 = ${w[2]}$、$b_4 = b_5 \\oplus b_6 \\oplus b_7 = ${w[4]}$ です。`], [`The codeword is $${word(w)}$.`, `符号語は $${word(w)}$ です。`]],
          set: { m },
        };
      }
      if (form === 1) {
        const m = r.int(0, 15), e = r.int(1, 7), w = enc(m), x = w.slice(); x[e] ^= 1;
        let dm = 0; const c = x.slice(); c[e] ^= 1; [3, 5, 6, 7].forEach((p, i) => { dm |= c[p] << (3 - i); });
        return {
          q: [`The Hamming(7,4) word $${word(x)}$ (bits 1 to 7) has one error. Correct it and give the 4-bit message (bits 3, 5, 6, 7) as a number from 0 to 15.`, `ハミング (7,4) の語 $${word(x)}$（ビット 1 から 7）に誤りが一つあります。訂正して、4 ビットのメッセージ（ビット 3、5、6、7）を 0 から 15 の数で答えてください。`],
          a: { type: 'int', v: dm },
          hint: ['Find the syndrome first; it names the bad position.', 'まずシンドロームを求めます。それが誤った位置を表します。'],
          sol: [[`The syndrome is ${e}, so bit ${e} is flipped back: $${word(c)}$.`, `シンドロームは ${e} なので、ビット ${e} を戻すと $${word(c)}$ です。`], [`Bits 3, 5, 6, 7 read $${bin(dm, 4)}$, which is ${dm}.`, `ビット 3、5、6、7 は $${bin(dm, 4)}$ で、${dm} です。`]],
          set: { m: dm },
        };
      }
      const p = r.pick([0.001, 0.002, 0.005, 0.01, 0.02, 0.05]);
      const f = 1 - (1 - p) ** 7 - 7 * p * (1 - p) ** 6;
      return {
        q: [`Each bit is flipped independently with probability $p = ${p}$. What is the probability that a Hamming(7,4) word is decoded to the wrong message? Give it to two significant figures.`, `各ビットが独立に確率 $p = ${p}$ で反転します。ハミング (7,4) の語が誤ったメッセージに復号される確率を有効数字二桁で答えてください。`],
        a: { type: 'num', v: f, rel: 0.02 },
        hint: ['Decoding fails exactly when two or more of the seven bits flip.', '復号が失敗するのは、七つのビットのうち二つ以上が反転したときちょうどです。'],
        sol: [[`P(no flip) $= (1-p)^7 = ${n((1 - p) ** 7, 6)}$; P(exactly one) $= 7p(1-p)^6 = ${n(7 * p * (1 - p) ** 6, 6)}$.`, `反転なしの確率は $(1-p)^7 = ${n((1 - p) ** 7, 6)}$、ちょうど一つは $7p(1-p)^6 = ${n(7 * p * (1 - p) ** 6, 6)}$ です。`], [`Failure $= 1 - ${n((1 - p) ** 7, 6)} - ${n(7 * p * (1 - p) ** 6, 6)} = ${n(f, 3)}$, about $21p^2$ for small $p$, against $${n(1 - (1 - p) ** 4, 3)}$ for four raw bits.`, `失敗の確率は $1 - ${n((1 - p) ** 7, 6)} - ${n(7 * p * (1 - p) ** 6, 6)} = ${n(f, 3)}$ で、小さい $p$ ではおよそ $21p^2$ です。四ビットをそのまま送ると $${n(1 - (1 - p) ** 4, 3)}$ です。`]],
        set: { p },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 6), b = r.int(a + 1, 7), s = a ^ b;
        return {
          q: [`Bits $${a}$ and $${b}$ of a Hamming(7,4) codeword both flip. What syndrome does the decoder compute, and how many of the seven bits are wrong after it acts? Give both.`, `ハミング (7,4) の符号語のビット $${a}$ と $${b}$ が両方反転しました。復号器が計算するシンドロームと、復号器が動いたあと七つのビットのうちいくつが誤っているかを答えてください。`],
          a: { type: 'tuple', v: [s, 3], labels: [['syndrome', 'シンドローム'], ['wrong bits', '誤ったビット数']], tol: 0 },
          hint: ['The syndrome of a sum of errors is the XOR of their syndromes.', '誤りの和のシンドロームは、それぞれのシンドロームの XOR です。'],
          sol: [[`The syndrome is $${a} \\oplus ${b} = ${s}$, which is neither ${a} nor ${b}.`, `シンドロームは $${a} \\oplus ${b} = ${s}$ で、${a} でも ${b} でもありません。`], [`The decoder flips bit ${s}, adding a third error. The result is the codeword at distance 3 from the one sent: the code is perfect, so every word lies in some codeword's ball, the wrong one here.`, `復号器はビット ${s} を反転し、三つ目の誤りを加えます。結果は送った符号語から距離 3 の符号語です。この符号は完全符号なので、どの語もどれかの符号語の球に入り、ここでは誤った球に入ります。`]],
        };
      }
      if (form === 1) {
        const rr = r.pick([4, 5]), N = 2 ** rr - 1, p = r.pick([0.001, 0.002, 0.005, 0.01]);
        const f = 1 - (1 - p) ** N - N * p * (1 - p) ** (N - 1);
        return {
          q: [`The Hamming code of length $${N}$ corrects one error per word. With independent bit flips at $p = ${p}$, what is the probability that a word is decoded wrongly? Two significant figures.`, `長さ $${N}$ のハミング符号は一語につき一つの誤りを訂正します。各ビットが独立に $p = ${p}$ で反転するとき、語が誤って復号される確率を有効数字二桁で答えてください。`],
          a: { type: 'num', v: f, rel: 0.02 },
          hint: ['Same reasoning as for length 7: failure means two or more flips.', '長さ 7 と同じ考え方です。失敗は二つ以上の反転を意味します。'],
          sol: [[`$1 - (1-p)^{${N}} - ${N}p(1-p)^{${N - 1}} = ${n(f, 3)}$.`, `$1 - (1-p)^{${N}} - ${N}p(1-p)^{${N - 1}} = ${n(f, 3)}$ です。`], [`For small $p$ this is about $\\binom{${N}}{2}p^2 = ${N * (N - 1) / 2}p^2$: longer Hamming codes have higher rate, $${N - rr}/${N}$, but more chances for a second error.`, `小さい $p$ ではおよそ $\\binom{${N}}{2}p^2 = ${N * (N - 1) / 2}p^2$ です。長いハミング符号はレートが高く $${N - rr}/${N}$ ですが、二つ目の誤りの機会も増えます。`]],
        };
      }
      const target = r.pick([0.001, 0.002, 0.005, 0.01]);
      let lo = 1e-6, hi = 0.3; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (1 - (1 - mid) ** 7 - 7 * mid * (1 - mid) ** 6 < target) lo = mid; else hi = mid; }
      const p = (lo + hi) / 2;
      return {
        q: [`What bit-flip probability $p$ makes a Hamming(7,4) word fail to decode with probability $${target}$? Give $p$ to two significant figures.`, `ハミング (7,4) の語の復号失敗確率が $${target}$ になるビット反転確率 $p$ はいくらですか。有効数字二桁で答えてください。`],
        a: { type: 'num', v: p, rel: 0.02 },
        hint: ['For small $p$ the failure is about $21p^2$; refine from there.', '小さい $p$ では失敗の確率はおよそ $21p^2$ です。そこから詰めます。'],
        sol: [[`First guess: $21p^2 = ${target}$ gives $p \\approx ${n(Math.sqrt(target / 21), 3)}$.`, `最初の見積もり：$21p^2 = ${target}$ より $p \\approx ${n(Math.sqrt(target / 21), 3)}$ です。`], [`Solving $1-(1-p)^7-7p(1-p)^6 = ${target}$ exactly gives $p = ${n(p, 3)}$; the quadratic estimate is close because higher terms are tiny.`, `$1-(1-p)^7-7p(1-p)^6 = ${target}$ を正確に解くと $p = ${n(p, 3)}$ です。高次の項が小さいので、二次の見積もりはよく合います。`]],
        set: { p: Math.round(p * 10000) / 10000 },
      };
    },
  ];

  /* ---------------- hamming-space ---------------- */
  Q['hamming-space'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.int(5, 9), a = r.int(0, 2 ** L - 1); let b = r.int(0, 2 ** L - 1); if (b === a) b ^= 1;
        const d = pc(a ^ b);
        return {
          q: [`What is the Hamming distance between $${bin(a, L)}$ and $${bin(b, L)}$?`, `$${bin(a, L)}$ と $${bin(b, L)}$ のハミング距離はいくらですか。`],
          a: { type: 'int', v: d },
          hint: ['Count the positions where they differ.', '異なる位置の数を数えます。'],
          sol: [[`XOR: $${bin(a ^ b, L)}$.`, `XOR は $${bin(a ^ b, L)}$ です。`], [`It has ${d} ones, so the distance is ${d}: the number of single-bit steps from one to the other.`, `1 が ${d} 個あるので距離は ${d} で、一方から他方への一ビットずつの歩数です。`]],
        };
      }
      if (form === 1) {
        const d = r.int(2, 12), t = Math.floor((d - 1) / 2);
        return {
          q: [`A code has minimum distance $d = ${d}$. How many errors can it always correct?`, `最小距離 $d = ${d}$ の符号は、いつでも何個の誤りを訂正できますか。`],
          a: { type: 'int', v: t },
          hint: ['The balls of radius $t$ around codewords must not overlap.', '符号語のまわりの半径 $t$ の球が重なってはいけません。'],
          sol: [[`Disjoint balls need $2t + 1 \\le d$, so $t = \\lfloor(${d}-1)/2\\rfloor = ${t}$.`, `球が重ならないには $2t + 1 \\le d$ が必要なので $t = \\lfloor(${d}-1)/2\\rfloor = ${t}$ です。`], [`It can also detect up to $d - 1 = ${d - 1}$ errors if it does not try to correct.`, `訂正しようとしなければ、$d - 1 = ${d - 1}$ 個までの誤りを検出できます。`]],
        };
      }
      const nn = r.int(3, 12);
      return {
        q: [`How many binary words of length $${nn}$ lie within Hamming distance 1 of a given word (the word itself included)?`, `長さ $${nn}$ のある二元の語から、ハミング距離 1 以内にある語（その語自身を含む）はいくつありますか。`],
        a: { type: 'int', v: nn + 1 },
        hint: ['Either change nothing, or change one of the positions.', '何も変えないか、位置を一つ変えるかです。'],
        sol: [[`The word itself, plus one word for each of the ${nn} positions you can flip.`, `その語自身と、反転できる ${nn} 個の位置それぞれに一語ずつです。`], [`$V(${nn}, 1) = 1 + ${nn} = ${nn + 1}$.`, `$V(${nn}, 1) = 1 + ${nn} = ${nn + 1}$ です。`]],
        ...(nn === 3 ? { set: { code: 0 } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(5, 15), t = r.int(1, 3), V = vol(nn, t);
        return {
          q: [`How many binary words of length $${nn}$ lie within distance $${t}$ of a given word? This is the volume $V(${nn}, ${t})$ of a Hamming ball.`, `長さ $${nn}$ のある語から距離 $${t}$ 以内にある二元の語はいくつありますか。これはハミング球の体積 $V(${nn}, ${t})$ です。`],
          a: { type: 'int', v: V },
          hint: ['Sum the binomial coefficients $\\binom{n}{i}$ for $i = 0, \\dots, t$.', '$i = 0, \\dots, t$ について二項係数 $\\binom{n}{i}$ を足します。'],
          sol: [[`${Array.from({ length: t + 1 }, (_, i) => `$\\binom{${nn}}{${i}} = ${binom(nn, i)}$`).join(', ')}.`, `${Array.from({ length: t + 1 }, (_, i) => `$\\binom{${nn}}{${i}} = ${binom(nn, i)}$`).join('、')} です。`], [`The total is $V(${nn}, ${t}) = ${V}$.`, `合計は $V(${nn}, ${t}) = ${V}$ です。`]],
        };
      }
      if (form === 1) {
        const nn = r.int(5, 14), t = r.int(1, 2), V = vol(nn, t), Mx = Math.floor(2 ** nn / V);
        return {
          q: [`By the Hamming bound, what is the largest number of codewords a binary code of length $${nn}$ that corrects $${t}$ error${t > 1 ? 's' : ''} could possibly have?`, `ハミング限界によると、長さ $${nn}$ で $${t}$ 個の誤りを訂正する二元符号の符号語の数は、最大でいくつになりえますか。`],
          a: { type: 'int', v: Mx },
          hint: ['The $M$ balls of radius $t$ are disjoint and fit inside the $2^n$ words.', '半径 $t$ の $M$ 個の球は重ならず、$2^n$ 個の語の中に収まります。'],
          sol: [[`$V(${nn}, ${t}) = ${V}$ and $2^{${nn}} = ${2 ** nn}$.`, `$V(${nn}, ${t}) = ${V}$、$2^{${nn}} = ${2 ** nn}$ です。`], [`$M \\le ${2 ** nn}/${V}$, so at most $${Mx}$ codewords${2 ** nn % V === 0 ? ', with equality only for a perfect code' : ''}. The bound says nothing about whether this many can be reached.`, `$M \\le ${2 ** nn}/${V}$ なので、符号語は多くても $${Mx}$ 個です${2 ** nn % V === 0 ? '。等号は完全符号のときだけです' : ''}。この限界は、その数が実際に達成できるかについては何も言いません。`]],
        };
      }
      const L = r.int(5, 7), k = 3, ws = new Set([0]); while (ws.size < k + 1) ws.add(r.int(1, 2 ** L - 1));
      const arr = [...ws]; let d = Infinity; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) d = Math.min(d, pc(arr[i] ^ arr[j]));
      return {
        q: [`What is the minimum distance of the code $\\{${arr.map((x) => bin(x, L)).join(',\\ ')}\\}$?`, `符号 $\\{${arr.map((x) => bin(x, L)).join(',\\ ')}\\}$ の最小距離はいくらですか。`],
        a: { type: 'int', v: d },
        hint: ['Check all six pairs.', '六つの組をすべて調べます。'],
        sol: [[`The pairwise distances are ${(() => { const o = []; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) o.push(pc(arr[i] ^ arr[j])); return o.join(', '); })()}.`, `組ごとの距離は ${(() => { const o = []; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) o.push(pc(arr[i] ^ arr[j])); return o.join('、'); })()} です。`], [`The smallest is $d = ${d}$, so the code corrects ${Math.floor((d - 1) / 2)} error${Math.floor((d - 1) / 2) === 1 ? '' : 's'} and detects ${d - 1}.`, `最小は $d = ${d}$ なので、この符号は ${Math.floor((d - 1) / 2)} 個の誤りを訂正し、${d - 1} 個を検出します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const cases = [[7, 16, 3, true], [23, 4096, 7, true], [15, 2048, 3, true], [8, 16, 3, false], [10, 64, 3, false], [5, 2, 5, true], [6, 2, 6, false], [11, 32, 5, false]];
        const [nn, M, d, perf] = r.pick(cases), t = Math.floor((d - 1) / 2), V = vol(nn, t);
        return {
          q: [`A binary code has length $n = ${nn}$, $M = ${M}$ codewords and minimum distance $d = ${d}$. Is it perfect?`, `長さ $n = ${nn}$、符号語 $M = ${M}$ 個、最小距離 $d = ${d}$ の二元符号があります。これは完全符号ですか。`],
          a: { type: 'choice', fixed: true, v: perf ? 0 : 1, opts: [['Yes: M V(n, t) = 2ⁿ', 'はい：M V(n, t) = 2ⁿ'], ['No: M V(n, t) < 2ⁿ', 'いいえ：M V(n, t) < 2ⁿ']] },
          hint: ['Compute $t$, then $V(n, t)$, then compare $M\\,V(n,t)$ with $2^n$.', '$t$、次に $V(n, t)$ を求め、$M\\,V(n,t)$ と $2^n$ を比べます。'],
          sol: [[`$t = \\lfloor(${d}-1)/2\\rfloor = ${t}$ and $V(${nn}, ${t}) = ${V}$.`, `$t = \\lfloor(${d}-1)/2\\rfloor = ${t}$、$V(${nn}, ${t}) = ${V}$ です。`], [`$M\\,V = ${M * V}$ against $2^{${nn}} = ${2 ** nn}$: ${perf ? 'equal, so the balls fill the space exactly' : 'smaller, so some words lie in no ball'}.`, `$M\\,V = ${M * V}$ と $2^{${nn}} = ${2 ** nn}$ は${perf ? '等しいので、球は空間をちょうど埋めます' : '前者が小さいので、どの球にも入らない語があります'}。`]],
        };
      }
      if (form === 1) {
        const dl = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.4]), R = 1 - H2(dl / 2);
        return {
          q: [`For long binary codes with relative distance $\\delta = d/n = ${dl}$, what is the largest rate the Hamming bound allows? Three decimals.`, `相対距離 $\\delta = d/n = ${dl}$ の長い二元符号について、ハミング限界が許す最大のレートはいくらですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: R, tol: 0.0006 },
          hint: ['$R \\le 1 - H_2(\\delta/2)$, with $H_2(x) = -x\\log_2 x - (1-x)\\log_2(1-x)$.', '$R \\le 1 - H_2(\\delta/2)$ で、$H_2(x) = -x\\log_2 x - (1-x)\\log_2(1-x)$ です。'],
          sol: [[`$H_2(${dl / 2}) = ${n(H2(dl / 2), 4)}$.`, `$H_2(${dl / 2}) = ${n(H2(dl / 2), 4)}$ です。`], [`$R \\le 1 - ${n(H2(dl / 2), 4)} = ${n(R, 4)}$: a ball of radius $\\delta n/2$ holds about $2^{nH_2(\\delta/2)}$ words, so at most $2^{n(1-H_2(\\delta/2))}$ balls fit.`, `$R \\le 1 - ${n(H2(dl / 2), 4)} = ${n(R, 4)}$ です。半径 $\\delta n/2$ の球にはおよそ $2^{nH_2(\\delta/2)}$ 個の語が入るので、入る球は多くても $2^{n(1-H_2(\\delta/2))}$ 個です。`]],
        };
      }
      const dl = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3]), R = 1 - H2(dl);
      return {
        q: [`The Gilbert–Varshamov bound guarantees long binary codes with relative distance $\\delta = ${dl}$ and rate at least $1 - H_2(\\delta)$. What rate is that? Three decimals.`, `ギルバート・ヴァルシャモフ限界は、相対距離 $\\delta = ${dl}$ でレートが少なくとも $1 - H_2(\\delta)$ の長い二元符号の存在を保証します。そのレートはいくらですか。小数第三位まで答えてください。`],
        a: { type: 'num', v: R, tol: 0.0006 },
        hint: ['Greedy construction: keep adding any word at distance at least $d$ from all chosen ones.', '貪欲な構成：選んだすべての語から距離 $d$ 以上離れた語を、次々に加えていきます。'],
        sol: [[`$H_2(${dl}) = ${n(H2(dl), 4)}$, so the guaranteed rate is $${n(R, 4)}$.`, `$H_2(${dl}) = ${n(H2(dl), 4)}$ なので、保証されるレートは $${n(R, 4)}$ です。`], [`The greedy code stops only when balls of radius $d$ around its words cover everything, which forces $M \\ge 2^n/V(n, d)$, about $2^{n(1-H_2(\\delta))}$.`, `貪欲な符号が止まるのは、その語のまわりの半径 $d$ の球がすべてを覆ったときだけで、そのとき $M \\ge 2^n/V(n, d)$、およそ $2^{n(1-H_2(\\delta))}$ となります。`]],
      };
    },
  ];

  /* ---------------- reed-solomon ---------------- */
  const pe = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = md(s * x + c[i]); return s; };
  const ptex = (c) => c.map((q, i) => (q ? (i === 0 ? `${q}` : `${q === 1 ? '' : q}x${i > 1 ? `^{${i}}` : ''}`) : '')).filter(Boolean).join(' + ') || '0';
  Q['reed-solomon'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(2, 6), nn = r.int(k + 2, 12), askT = r.chance(0.5), d = nn - k + 1, t = Math.floor((nn - k) / 2);
        return {
          q: [`A Reed–Solomon code over GF(13) has length $n = ${nn}$ and $k = ${k}$ message symbols. ${askT ? 'How many symbol errors can it always correct?' : 'What is its minimum distance?'}`, `GF(13) 上のリード・ソロモン符号の長さが $n = ${nn}$、メッセージの記号が $k = ${k}$ 個です。${askT ? 'いつでも訂正できる記号の誤りはいくつですか。' : '最小距離はいくらですか。'}`],
          a: { type: 'int', v: askT ? t : d },
          hint: ['Two distinct polynomials of degree below $k$ agree in at most $k-1$ points.', '次数 $k$ 未満の異なる二つの多項式は、高々 $k-1$ 点でしか一致しません。'],
          sol: [[`$d = n - k + 1 = ${nn} - ${k} + 1 = ${d}$.`, `$d = n - k + 1 = ${nn} - ${k} + 1 = ${d}$ です。`], [`It corrects $t = \\lfloor(d-1)/2\\rfloor = ${t}$ errors.`, `訂正できる誤りは $t = \\lfloor(d-1)/2\\rfloor = ${t}$ 個です。`]],
          set: { k, n: nn },
        };
      }
      if (form === 1) {
        const a = r.int(2, 12), x = inv(a);
        return {
          q: [`In GF(13), what is the inverse of $${a}$, the number $x$ with $${a}x \\equiv 1 \\pmod{13}$?`, `GF(13) で $${a}$ の逆数、つまり $${a}x \\equiv 1 \\pmod{13}$ となる数 $x$ はいくらですか。`],
          a: { type: 'int', v: x },
          hint: ['Try multiples of the number until one is one more than a multiple of 13.', 'その数の倍数を、13 の倍数より 1 大きくなるまで試します。'],
          sol: [[`$${a} \\times ${x} = ${a * x} = ${Math.floor(a * x / 13)} \\times 13 + 1$.`, `$${a} \\times ${x} = ${a * x} = ${Math.floor(a * x / 13)} \\times 13 + 1$ です。`], [`So $${a}^{-1} = ${x}$ in GF(13). Every nonzero element has an inverse because 13 is prime, which is what lets the decoder divide.`, `したがって GF(13) では $${a}^{-1} = ${x}$ です。13 が素数なので 0 でないどの元にも逆数があり、それが復号器の割り算を可能にします。`]],
        };
      }
      const c = [r.int(0, 12), r.int(1, 12)], x = r.int(1, 12), y = pe(c, x);
      return {
        q: [`Over GF(13), evaluate $P(x) = ${ptex(c)}$ at $x = ${x}$.`, `GF(13) 上で $P(x) = ${ptex(c)}$ を $x = ${x}$ で評価してください。`],
        a: { type: 'int', v: y },
        hint: ['Compute as usual, then reduce mod 13.', 'ふつうに計算してから、13 で割った余りをとります。'],
        sol: [[`$${c[0]} + ${c[1]} \\times ${x} = ${c[0] + c[1] * x}$.`, `$${c[0]} + ${c[1]} \\times ${x} = ${c[0] + c[1] * x}$ です。`], [`$${c[0] + c[1] * x} \\bmod 13 = ${y}$.`, `$${c[0] + c[1] * x} \\bmod 13 = ${y}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = [r.int(0, 12), r.int(0, 12), r.int(1, 12)], x = r.int(2, 12), y = pe(c, x);
        return {
          q: [`A Reed–Solomon codeword over GF(13) carries $P(x) = ${ptex(c)}$. What symbol is sent at $x = ${x}$?`, `GF(13) 上のリード・ソロモン符号語が $P(x) = ${ptex(c)}$ を運びます。$x = ${x}$ で送られる記号は何ですか。`],
          a: { type: 'int', v: y },
          hint: ['Evaluate and reduce mod 13; reducing after each step keeps numbers small.', '評価して 13 で割った余りをとります。各段階で余りをとると数が小さく保てます。'],
          sol: [[`$${c[0]} + ${c[1]}\\cdot${x} + ${c[2]}\\cdot${x * x} = ${c[0] + c[1] * x + c[2] * x * x}$.`, `$${c[0]} + ${c[1]}\\cdot${x} + ${c[2]}\\cdot${x * x} = ${c[0] + c[1] * x + c[2] * x * x}$ です。`], [`Mod 13 this is ${y}.`, `13 で割った余りは ${y} です。`]],
        };
      }
      if (form === 1) {
        const k = r.int(2, 5), nn = r.int(k + 3, 12), s = r.int(0, nn - k), e = Math.floor((nn - k - s) / 2);
        return {
          q: [`A Reed–Solomon code has $n = ${nn}$, $k = ${k}$. If $${s}$ symbols are erased (their positions known), how many errors can still be corrected among the rest?`, `$n = ${nn}$、$k = ${k}$ のリード・ソロモン符号で、$${s}$ 個の記号が消失しました（位置は分かっています）。残りの中で、まだいくつの誤りを訂正できますか。`],
          a: { type: 'int', v: e },
          hint: ['Each erasure costs 1, each error 2, out of a budget of $n - k$.', '予算 $n - k$ のうち、消失は一つにつき 1、誤りは 2 かかります。'],
          sol: [[`The budget is $n - k = ${nn - k}$; the erasures use ${s}.`, `予算は $n - k = ${nn - k}$ で、消失が ${s} 使います。`], [`$2e \\le ${nn - k - s}$, so $e = ${e}$.`, `$2e \\le ${nn - k - s}$ より $e = ${e}$ です。`]],
          set: { k, n: nn },
        };
      }
      const k = r.int(2, 5), nn = r.int(k + 2, 12), e = r.int(0, 4), s = r.int(0, 5), okay = 2 * e + s <= nn - k;
      return {
        q: [`A Reed–Solomon code with $n = ${nn}$, $k = ${k}$ receives a word with $${e}$ errors and $${s}$ erasures. Is correct decoding guaranteed?`, `$n = ${nn}$、$k = ${k}$ のリード・ソロモン符号が、誤り $${e}$ 個と消失 $${s}$ 個を含む語を受け取りました。正しい復号は保証されますか。`],
        a: { type: 'choice', fixed: true, v: okay ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['Compare $2e + s$ with $n - k$.', '$2e + s$ と $n - k$ を比べます。'],
        sol: [[`$2e + s = ${2 * e + s}$ and $n - k = ${nn - k}$.`, `$2e + s = ${2 * e + s}$、$n - k = ${nn - k}$ です。`], okay ? ['The budget covers it, so the decoder always recovers the message.', '予算の範囲内なので、復号器は必ずメッセージを復元します。'] : ['It exceeds the budget: the decoder may fail, or worse, return a different codeword.', '予算を超えています。復号器は失敗するか、さらに悪いことに別の符号語を返すことがあります。']],
        set: { k, n: nn },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 6), b = r.int(a + 1, 12), e1 = md(-(a + b)), e0 = md(a * b);
        return {
          q: [`Over GF(13), the errors sit at $x = ${a}$ and $x = ${b}$. Write the monic error locator $E(x) = x^2 + e_1x + e_0$ and give $e_1$ and $e_0$ in $\\{0, \\dots, 12\\}$.`, `GF(13) 上で、誤りは $x = ${a}$ と $x = ${b}$ にあります。モニックな誤り位置多項式 $E(x) = x^2 + e_1x + e_0$ を書き、$e_1$ と $e_0$ を $\\{0, \\dots, 12\\}$ の範囲で答えてください。`],
          a: { type: 'tuple', v: [e1, e0], labels: ['$e_1$', '$e_0$'], tol: 0 },
          hint: ['$E(x) = (x - a)(x - b)$; reduce the coefficients mod 13.', '$E(x) = (x - a)(x - b)$ で、係数を 13 で割った余りにします。'],
          sol: [[`$(x - ${a})(x - ${b}) = x^2 - ${a + b}x + ${a * b}$.`, `$(x - ${a})(x - ${b}) = x^2 - ${a + b}x + ${a * b}$ です。`], [`Mod 13: $e_1 = ${e1}$, $e_0 = ${e0}$. The decoder finds this $E$ by solving $Q(x_i) = y_iE(x_i)$, and its roots tell it where the damage is.`, `13 で割った余りで $e_1 = ${e1}$、$e_0 = ${e0}$ です。復号器は $Q(x_i) = y_iE(x_i)$ を解いてこの $E$ を見つけ、その根から損傷の位置が分かります。`]],
        };
      }
      if (form === 1) {
        const x1 = r.int(1, 5), x2 = r.int(x1 + 1, 10), y1 = r.int(0, 12), y2 = r.int(0, 12), x0 = r.int(1, 12);
        const slope = md((y2 - y1) * inv(x2 - x1)), c0 = md(y1 - slope * x1), y0 = md(c0 + slope * x0);
        return {
          q: [`A Reed–Solomon code over GF(13) with $k = 2$ carries a line $P(x) = c_0 + c_1x$. Two symbols survive: $P(${x1}) = ${y1}$ and $P(${x2}) = ${y2}$. What is $P(${x0})$?`, `$k = 2$ の GF(13) 上のリード・ソロモン符号が直線 $P(x) = c_0 + c_1x$ を運びます。二つの記号 $P(${x1}) = ${y1}$ と $P(${x2}) = ${y2}$ が残りました。$P(${x0})$ はいくらですか。`],
          a: { type: 'int', v: y0 },
          hint: ['Find the slope by dividing in GF(13), using an inverse.', 'GF(13) で逆数を使って割り算し、傾きを求めます。'],
          sol: [[`$c_1 = (${y2} - ${y1})/(${x2} - ${x1}) = ${md(y2 - y1)} \\times ${inv(x2 - x1)} = ${slope}$ in GF(13).`, `GF(13) で $c_1 = (${y2} - ${y1})/(${x2} - ${x1}) = ${md(y2 - y1)} \\times ${inv(x2 - x1)} = ${slope}$ です。`], [`$c_0 = ${y1} - ${slope}\\cdot${x1} \\equiv ${c0}$, so $P(${x0}) = ${c0} + ${slope}\\cdot${x0} \\equiv ${y0}$.`, `$c_0 = ${y1} - ${slope}\\cdot${x1} \\equiv ${c0}$ なので $P(${x0}) = ${c0} + ${slope}\\cdot${x0} \\equiv ${y0}$ です。`], ['Any two points recover the whole codeword, which is why a k = 2 code survives the loss of all other symbols.', 'どの二点からでも符号語全体が復元できるので、k = 2 の符号は他の記号をすべて失っても耐えられます。']],
        };
      }
      const e = r.int(4, 16), s = r.int(0, 10), k = 255 - 2 * e - s;
      return {
        q: [`A storage system uses Reed–Solomon codes over GF(256) of length $n = 255$ bytes. It must survive $${e}$ byte errors together with $${s}$ known-bad (erased) bytes per block. What is the largest number of message bytes $k$ per block?`, `ある記憶装置は、GF(256) 上の長さ $n = 255$ バイトのリード・ソロモン符号を使います。ブロックごとに $${e}$ バイトの誤りと $${s}$ バイトの既知の不良（消失）に同時に耐えなければなりません。ブロックあたりのメッセージのバイト数 $k$ は最大いくつですか。`],
        a: { type: 'int', v: k },
        hint: ['The budget $n - k$ must be at least $2e + s$.', '予算 $n - k$ が $2e + s$ 以上でなければなりません。'],
        sol: [[`Need $n - k \\ge 2 \\times ${e} + ${s} = ${2 * e + s}$.`, `$n - k \\ge 2 \\times ${e} + ${s} = ${2 * e + s}$ が必要です。`], [`So $k = 255 - ${2 * e + s} = ${k}$, a rate of $${n(k / 255, 3)}$: ${2 * e + s} bytes of redundancy buy exactly this protection, the most any code of this length can.`, `したがって $k = 255 - ${2 * e + s} = ${k}$ で、レートは $${n(k / 255, 3)}$ です。${2 * e + s} バイトの冗長性でちょうどこの保護が得られ、これはこの長さのどの符号にもできる最大です。`]],
      };
    },
  ];
})();
