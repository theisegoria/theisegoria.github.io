'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;

  /* ---------- shared models (pure, same conventions as the figures) ---------- */
  function partitionsOf(N, ok = () => true, distinct = false) {
    const out = [], cur = [];
    const rec = (rem, mx) => {
      if (rem === 0) { out.push(cur.slice()); return; }
      for (let k = Math.min(rem, mx); k >= 1; k--) { if (!ok(k)) continue; cur.push(k); rec(rem - k, distinct ? k - 1 : k); cur.pop(); }
    };
    rec(N, N);
    return out;
  }
  const oddParts = (N) => partitionsOf(N, (k) => k % 2 === 1);
  const distinctParts = (N) => partitionsOf(N, () => true, true);
  function restricted(N, ok, maxMult = Infinity) {
    const a = new Array(N + 1).fill(0); a[0] = 1;
    for (let k = 1; k <= N; k++) {
      if (!ok(k)) continue;
      const b = a.slice();
      for (let m = 0; m <= N; m++) { if (!a[m]) continue; for (let j = 1; j <= maxMult && m + j * k <= N; j++) b[m + j * k] += a[m]; }
      for (let m = 0; m <= N; m++) a[m] = b[m];
    }
    return a;
  }
  const pCounts = (N) => restricted(N, () => true);
  const oddCore = (k) => { while (k % 2 === 0) k /= 2; return k; };
  const multiset = (ps) => { const m = new Map(); ps.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return m; };
  const desc = (a) => a.slice().sort((x, y) => y - x);
  const glaisher = (ps) => { const out = []; multiset(ps).forEach((m, o) => { for (let j = 0; m >> j; j++) if ((m >> j) & 1) out.push(o << j); }); return desc(out); };
  const glaisherInv = (ps) => { const out = []; ps.forEach((d) => { const o = oddCore(d); for (let i = 0; i < d / o; i++) out.push(o); }); return desc(out); };
  const pairsOnce = (ps) => { const out = []; multiset(ps).forEach((m, o) => { for (let i = 0; i < Math.floor(m / 2); i++) out.push(2 * o); if (m % 2) out.push(o); }); return desc(out); };
  const lumped = (ps) => { const out = []; multiset(ps).forEach((m, o) => out.push(m * o)); return desc(out); };
  const pstr = (ps) => ps.join(' + ');
  const same = (a, b) => a.join(',') === b.join(',');
  const binom = (N, k) => { if (k < 0 || k > N) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (N - k + i)) / i; return Math.round(r); };
  const catalan = (k) => binom(2 * k, k) / (k + 1);
  function dyckWords(N) {
    const out = [], w = [];
    const rec = (u, d) => { if (u === N && d === N) { out.push(w.join('')); return; } if (u < N) { w.push('U'); rec(u + 1, d); w.pop(); } if (d < u) { w.push('D'); rec(u, d + 1); w.pop(); } };
    rec(0, 0); return out;
  }
  const firstReturn = (w) => { let h = 0; for (let j = 0; j < w.length; j++) { h += w[j] === 'U' ? 1 : -1; if (h === 0) return j; } return -1; };
  const pl = (k, one, many) => `${k === 1 ? one : many}`;

  /* ---------- 1. partitions: odd parts and distinct parts ---------- */
  Q['partitions-glaisher'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(3, 9), odd = oddParts(N), kind = r.int(0, 1), list = kind ? distinctParts(N) : odd;
        return {
          q: [kind ? `How many partitions of $${N}$ into distinct parts are there?` : `How many partitions of $${N}$ into odd parts are there?`, kind ? `$${N}$ の相異なる部分への分割はいくつありますか。` : `$${N}$ の奇数の部分への分割はいくつありますか。`],
          a: { type: 'int', v: list.length },
          hint: [kind ? 'List them from the largest first part down, never repeating a part.' : 'List them from the largest first part down, using only 1, 3, 5, ...', kind ? '最初の部分が大きいものから順に、部分を繰り返さずに書き出します。' : '最初の部分が大きいものから順に、1, 3, 5, ... だけを使って書き出します。'],
          sol: [[`They are ${list.map((p) => `$${pstr(p)}$`).join(', ')}.`, `それらは ${list.map((p) => `$${pstr(p)}$`).join('、')} です。`], [`That is $${list.length}$, and Euler's theorem says the ${kind ? 'odd-part' : 'distinct-part'} count is the same; the count chart in the figure shows the two agreeing for every $n$.`, `$${list.length}$ 個です。オイラーの定理により、${kind ? '奇数の部分' : '相異なる部分'}への分割の数も同じで、図の個数のグラフはどの $n$ でも二つが一致することを示しています。`]],
          set: { n: N, k: 1 },
        };
      }
      if (form === 1) {
        const o = r.pick([1, 3, 5, 7]), m = r.pick([5, 6, 7]), start = new Array(m).fill(o);
        const good = glaisher(start), cands = [good, lumped(start), pairsOnce(start)];
        return {
          q: [`Glaisher's map merges equal parts two at a time until all parts are distinct. What does it turn $${pstr(start)}$ (${m} copies of ${o}) into?`, `グレイシャーの写像は、等しい部分を二つずつ合わせ、すべての部分が相異なるまで続けます。$${pstr(start)}$（${o} が ${m} 個）は何に移りますか。`],
          a: { type: 'choice', opts: cands.map((p) => [`$${pstr(p)}$`, `$${pstr(p)}$`]), v: 0 },
          hint: [`Write the multiplicity ${m} in binary.`, `個数 ${m} を二進法で書きます。`],
          sol: [[`$${m} = ${m.toString(2).split('').map((b, i, a) => (b === '1' ? 2 ** (a.length - 1 - i) : 0)).filter(Boolean).join(' + ')}$ in powers of two.`, `2 のべきで $${m} = ${m.toString(2).split('').map((b, i, a) => (b === '1' ? 2 ** (a.length - 1 - i) : 0)).filter(Boolean).join(' + ')}$ です。`], [`Each power $2^j$ of copies of ${o} merges into one part $${o}\\cdot2^j$, giving $${pstr(good)}$.`, `${o} の $2^j$ 個の写しはそれぞれ一つの部分 $${o}\\cdot2^j$ にまとまり、$${pstr(good)}$ になります。`], [`Lumping all ${m} into $${o * m}$ is not what the merges do, and stopping after one round of pairing leaves $${pstr(pairsOnce(start))}$, which still repeats a part.`, `${m} 個すべてを $${o * m}$ にまとめるのは合併の結果ではなく、一回組にしただけで止めると $${pstr(pairsOnce(start))}$ となって、まだ部分が重複します。`]],
        };
      }
      const o = r.pick([1, 3, 5, 7, 9, 11]), j = r.int(1, 4), d = o * 2 ** j;
      return {
        q: [`Running Glaisher's map backwards, the distinct part $${d}$ splits into equal odd parts. How many parts, and of what size?`, `グレイシャーの写像を逆にたどると、相異なる部分 $${d}$ は等しい奇数の部分に分かれます。部分はいくつで、大きさはいくつですか。`],
        a: { type: 'tuple', v: [2 ** j, o], labels: [['how many', '個数'], ['size', '大きさ']] },
        hint: ['Divide by 2 until the number is odd.', '奇数になるまで 2 で割ります。'],
        sol: [[`$${d} = ${o}\\cdot2^{${j}}$, with ${o} odd.`, `$${d} = ${o}\\cdot2^{${j}}$ で、${o} は奇数です。`], [`So it splits into $2^{${j}} = ${2 ** j}$ parts equal to $${o}$. The factorization into an odd number times a power of two is unique, which is why the inverse map is well defined.`, `したがって $${o}$ に等しい $2^{${j}} = ${2 ** j}$ 個の部分に分かれます。奇数と 2 のべきの積への分解は一通りなので、逆写像がきちんと定まります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(10, 24), q = restricted(N, () => true, 1)[N], p = pCounts(N)[N];
        return {
          q: [`There are $${q}$ partitions of $${N}$ into odd parts. How many partitions of $${N}$ have no part repeated? And what fraction of all $p(${N}) = ${p}$ partitions is that?`, `$${N}$ の奇数の部分への分割は $${q}$ 個です。部分が重複しない $${N}$ の分割はいくつありますか。また、それは $p(${N}) = ${p}$ 個のすべての分割のうちどれだけの割合ですか。`],
          a: { type: 'tuple', v: [q, q / p], labels: [['count', '個数'], ['fraction', '割合']], tol: 6e-4 },
          hint: ['Euler: odd parts and distinct parts are equinumerous for every $n$.', 'オイラー：奇数の部分と相異なる部分の分割は、どの $n$ でも同数です。'],
          sol: [['$\\prod_k (1 + x^k) = \\prod_k \\frac{1 - x^{2k}}{1 - x^k} = \\prod_k \\frac{1}{1 - x^{2k-1}}$: the even factors cancel, so the two generating functions are equal.', '$\\prod_k (1 + x^k) = \\prod_k \\frac{1 - x^{2k}}{1 - x^k} = \\prod_k \\frac{1}{1 - x^{2k-1}}$ で、偶数の因子が打ち消し合うので、二つの母関数は等しくなります。'], [`So there are $${q}$ distinct-part partitions, a fraction $${q}/${p} = ${n(q / p, 4)}$ of all partitions of $${N}$.`, `したがって相異なる部分への分割は $${q}$ 個で、$${N}$ のすべての分割のうち $${q}/${p} = ${n(q / p, 4)}$ の割合です。`], ['That fraction keeps shrinking as $n$ grows, which the widening gap to the dashed $p(n)$ curve in the figure shows.', 'この割合は $n$ が大きくなると小さくなり続けます。図の破線 $p(n)$ との差が広がっていくのがそれです。']],
          set: { n: N },
        };
      }
      if (form === 1) {
        let N, odd, idx, start, guard = 0;
        do { N = r.int(8, 16); odd = oddParts(N); idx = r.int(0, odd.length - 1); start = odd[idx]; } while (guard++ < 120 && new Set([glaisher(start), lumped(start), pairsOnce(start)].map(String)).size < 3);
        const good = glaisher(start), cands = [good, lumped(start), pairsOnce(start)].filter((p, i, a) => a.findIndex((x) => same(x, p)) === i);
        if (cands.length < 2) cands.push(desc(start));
        const lines = []; multiset(start).forEach((m, o) => { if (m > 1) lines.push([m, o]); });
        return {
          q: [`Apply Glaisher's map to the odd partition $${pstr(start)}$ of $${N}$. Which partition into distinct parts do you get?`, `$${N}$ の奇数の部分への分割 $${pstr(start)}$ にグレイシャーの写像を施します。どの相異なる部分への分割が得られますか。`],
          a: { type: 'choice', opts: cands.map((p) => [`$${pstr(p)}$`, `$${pstr(p)}$`]), v: 0 },
          hint: ['Handle each odd value separately: write its multiplicity in binary.', '奇数の値ごとに別々に扱い、その個数を二進法で書きます。'],
          sol: [[`Multiplicities: ${[...multiset(start)].map(([o, m]) => `${o} appears ${m} time${m > 1 ? 's' : ''}`).join(', ')}.`, `個数は ${[...multiset(start)].map(([o, m]) => `${o} が ${m} 個`).join('、')} です。`], [`In binary each $m = \\sum 2^j$ gives the parts $o\\cdot2^j$: ${lines.map(([m, o]) => `$${m}\\times${o} \\to ${pstr(glaisher(new Array(m).fill(o)))}$`).join(', ')}.`, `二進法で $m = \\sum 2^j$ と書くと部分 $o\\cdot2^j$ が得られます。${lines.map(([m, o]) => `$${m}\\times${o} \\to ${pstr(glaisher(new Array(m).fill(o)))}$`).join('、')}。`], [`The result is $${pstr(good)}$: same sum $${N}$, no part repeated. Step through the figure to watch the merges.`, `結果は $${pstr(good)}$ で、和は同じ $${N}$、部分の重複はありません。図で合併を順に見てください。`]],
          set: odd.length <= 150 ? { n: N, k: idx + 1 } : { n: N },
        };
      }
      const N = r.int(5, 13), p = pCounts(N);
      const terms = []; for (let k = 1; ; k++) { const g1 = k * (3 * k - 1) / 2, g2 = k * (3 * k + 1) / 2, sg = k % 2 ? '+' : '-'; if (g1 > N) break; terms.push([sg, N - g1]); if (g2 <= N) terms.push([sg, N - g2]); }
      const expr = terms.map(([s, m], i) => `${i === 0 ? '' : ` ${s} `}p(${m})`).join(''), vals = terms.map(([s, m], i) => `${i === 0 ? '' : ` ${s} `}${p[m]}`).join('');
      return {
        q: [`Given $p(0), \\dots, p(${N - 1}) = ${p.slice(0, N).join(', ')}$, use Euler's pentagonal recurrence to find $p(${N})$.`, `$p(0), \\dots, p(${N - 1}) = ${p.slice(0, N).join(', ')}$ が与えられています。オイラーの五角数の漸化式で $p(${N})$ を求めてください。`],
        a: { type: 'int', v: p[N] },
        hint: ['$p(n) = p(n-1) + p(n-2) - p(n-5) - p(n-7) + p(n-12) + p(n-15) - \\cdots$, the offsets being the pentagonal numbers $k(3k \\mp 1)/2$.', '$p(n) = p(n-1) + p(n-2) - p(n-5) - p(n-7) + p(n-12) + p(n-15) - \\cdots$ で、ずらす量は五角数 $k(3k \\mp 1)/2$ です。'],
        sol: [[`$p(${N}) = ${expr}$.`, `$p(${N}) = ${expr}$ です。`], [`$= ${vals} = ${p[N]}$.`, `$= ${vals} = ${p[N]}$ です。`], ['The signs come in pairs, $++--$, because $\\prod(1 - x^k) = \\sum_k (-1)^k x^{k(3k-1)/2}$: almost everything cancels except at the pentagonal numbers.', '符号が $++--$ と二つずつ並ぶのは $\\prod(1 - x^k) = \\sum_k (-1)^k x^{k(3k-1)/2}$ だからで、五角数以外ではほとんどすべてが打ち消し合います。']],
        set: { n: Math.max(3, N) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let N, dist, d, guard = 0;
        do { N = r.int(10, 24); dist = distinctParts(N); d = r.pick(dist); } while (guard++ < 120 && (d.length < 3 || d.every((x) => x % 2) || glaisherInv(d).length > 12));
        const back = glaisherInv(d), odd = oddParts(N), idx = odd.findIndex((x) => same(x, back));
        return {
          q: [`Under Glaisher's bijection, the partition into distinct parts $${pstr(d)}$ comes from a partition of $${N}$ into odd parts. How many parts does that odd partition have?`, `グレイシャーの全単射で、相異なる部分への分割 $${pstr(d)}$ は $${N}$ の奇数の部分へのある分割から来ます。その奇数の分割の部分はいくつですか。`],
          a: { type: 'int', v: back.length },
          hint: ['Each part $o\\cdot2^j$ came from $2^j$ copies of $o$.', '各部分 $o\\cdot2^j$ は $o$ の $2^j$ 個の写しから来ています。'],
          sol: [[`Factor each part: ${d.map((x) => { const o = oddCore(x); return x === o ? `$${x}$` : `$${x} = ${o}\\cdot${x / o}$`; }).join(', ')}.`, `各部分を分解します。${d.map((x) => { const o = oddCore(x); return x === o ? `$${x}$` : `$${x} = ${o}\\cdot${x / o}$`; }).join('、')}。`], [`Splitting gives $${pstr(back)}$, with $${d.map((x) => x / oddCore(x)).join(' + ')} = ${back.length}$ parts.`, `分けると $${pstr(back)}$ となり、部分の数は $${d.map((x) => x / oddCore(x)).join(' + ')} = ${back.length}$ です。`], ['The bijection preserves the sum but not the number of parts: each part $o\\cdot2^j$ becomes $2^j$ parts, so odd partitions usually have more parts.', 'この全単射は和を保ちますが部分の数は保ちません。部分 $o\\cdot2^j$ は $2^j$ 個の部分になるので、奇数の分割の方がふつう部分が多くなります。']],
          set: idx >= 0 && idx < 150 ? { n: N, k: idx + 1 } : { n: N },
        };
      }
      if (form === 1) {
        const dd = r.pick([3, 4]), N = r.int(6, 13);
        const a = restricted(N, (k) => k % dd !== 0)[N], b = restricted(N, () => true, dd - 1)[N];
        const ex = partitionsOf(N, (k) => k % dd !== 0).slice(0, 3);
        return {
          q: [`How many partitions of $${N}$ have no part repeated ${dd} or more times?`, `どの部分も ${dd} 回以上は現れない $${N}$ の分割はいくつありますか。`],
          a: { type: 'int', v: b },
          hint: [`Glaisher's theorem generalizes Euler's: count instead the partitions with no part divisible by ${dd}. Use $\\frac{1 - x^{${dd}k}}{1 - x^k}$.`, `グレイシャーの定理はオイラーの定理を一般化します。代わりに ${dd} で割り切れる部分をもたない分割を数えます。$\\frac{1 - x^{${dd}k}}{1 - x^k}$ を使います。`],
          sol: [[`A part used at most ${dd - 1} times contributes $1 + x^k + \\cdots + x^{${dd - 1}k} = \\frac{1 - x^{${dd}k}}{1 - x^k}$.`, `高々 ${dd - 1} 回使う部分は $1 + x^k + \\cdots + x^{${dd - 1}k} = \\frac{1 - x^{${dd}k}}{1 - x^k}$ を与えます。`], [`In the product over $k$ the numerators cancel every denominator with $k$ divisible by ${dd}, leaving $\\prod_{${dd} \\nmid k} \\frac{1}{1 - x^k}$: partitions with no part divisible by ${dd}, such as ${ex.map((p) => `$${pstr(p)}$`).join(', ')}.`, `$k$ についての積では、分子が ${dd} で割り切れる $k$ の分母をすべて打ち消し、$\\prod_{${dd} \\nmid k} \\frac{1}{1 - x^k}$ が残ります。これは ${dd} で割り切れる部分をもたない分割で、たとえば ${ex.map((p) => `$${pstr(p)}$`).join('、')} です。`], [`Counting either kind gives $${b}$${a === b ? '' : ' (check)'}. With ${dd} replaced by 2 this is exactly Euler's odd-equals-distinct theorem.`, `どちらを数えても $${b}$ です。${dd} を 2 にすると、ちょうどオイラーの「奇数 = 相異」の定理になります。`]],
        };
      }
      const N = r.int(6, 30), c = restricted(N, (k) => k <= 3)[N], f = Math.round((N + 3) ** 2 / 12);
      return {
        q: [`How many partitions of $${N}$ have at most three parts?`, `部分が高々三つの $${N}$ の分割はいくつありますか。`],
        a: { type: 'int', v: c },
        hint: ['Conjugate (transpose the Young diagram): at most three parts becomes parts of size at most 3, with generating function $\\frac{1}{(1-x)(1-x^2)(1-x^3)}$.', '共役（ヤング図形の転置）をとると、部分が高々三つの分割は大きさ 3 以下の部分への分割になり、母関数は $\\frac{1}{(1-x)(1-x^2)(1-x^3)}$ です。'],
        sol: [['Transposing the Young diagram swaps "at most three rows" with "rows of length at most three", so we count partitions into parts 1, 2, 3.', 'ヤング図形を転置すると「行が高々三つ」と「行の長さが高々三」が入れ替わるので、部分 1, 2, 3 への分割を数えます。'], [`Partial fractions of $\\frac{1}{(1-x)(1-x^2)(1-x^3)}$ give the closed form: the count is the integer nearest $(n+3)^2/12$, here $(${N + 3})^2/12 = ${n((N + 3) ** 2 / 12, 3)}$.`, `$\\frac{1}{(1-x)(1-x^2)(1-x^3)}$ を部分分数に分けると閉じた式が得られ、個数は $(n+3)^2/12$ に最も近い整数で、ここでは $(${N + 3})^2/12 = ${n((N + 3) ** 2 / 12, 3)}$ です。`], [`So there are $${f}$ such partitions${f === c ? '' : ''}. The triple pole at $x = 1$ is what makes the count grow like $n^2/12$.`, `したがってそうした分割は $${f}$ 個です。$x = 1$ の三重極が、個数を $n^2/12$ のように増やしています。`]],
      };
    },
  ];

  /* ---------- 2. Catalan objects ---------- */
  const DY = Array.from({ length: 8 }, (_, k) => dyckWords(k));
  Q['catalan-objects'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(2, 10), C = catalan(N);
        return {
          q: [`Compute the Catalan number $C_{${N}} = \\frac{1}{n+1}\\binom{2n}{n}$.`, `カタラン数 $C_{${N}} = \\frac{1}{n+1}\\binom{2n}{n}$ を計算してください。`],
          a: { type: 'int', v: C },
          hint: ['Find $\\binom{2n}{n}$ first, then divide by $n + 1$.', 'まず $\\binom{2n}{n}$ を求め、$n + 1$ で割ります。'],
          sol: [[`$\\binom{${2 * N}}{${N}} = ${binom(2 * N, N)}$.`, `$\\binom{${2 * N}}{${N}} = ${binom(2 * N, N)}$ です。`], [`$C_{${N}} = ${binom(2 * N, N)}/${N + 1} = ${C}$: the number of Dyck paths with ${N} up steps, of binary trees with ${N} nodes, and of triangulations of a ${N + 2}-gon.`, `$C_{${N}} = ${binom(2 * N, N)}/${N + 1} = ${C}$ で、上りが ${N} 回のディック経路、節点が ${N} 個の二分木、${N + 2} 角形の三角形分割の個数です。`]],
          set: N <= 7 ? { n: N } : undefined,
        };
      }
      if (form === 1) {
        const kind = r.int(0, 2), N = r.int(3, 9), C = catalan(N);
        const Qs = [
          [`In how many ways can a convex ${N + 2}-gon be cut into triangles by non-crossing diagonals?`, `凸 ${N + 2} 角形を交わらない対角線で三角形に分ける方法は何通りありますか。`],
          [`How many binary trees (each node has a left and a right subtree, either possibly empty) have exactly ${N} nodes?`, `節点がちょうど ${N} 個の二分木（各節点は左と右の部分木をもち、どちらも空でもよい）はいくつありますか。`],
          [`In how many ways can the product $x_0 x_1 \\cdots x_{${N}}$ of ${N + 1} factors be fully parenthesized?`, `${N + 1} 個の因子の積 $x_0 x_1 \\cdots x_{${N}}$ に完全に括弧を付ける方法は何通りありますか。`],
        ];
        return {
          q: Qs[kind],
          a: { type: 'int', v: C },
          hint: ['Each of these families splits into two smaller members of the same family, so it is counted by the Catalan numbers. Find the right index.', 'どの族も同じ族の二つの小さな対象に分かれるので、カタラン数で数えられます。正しい添字を見つけてください。'],
          sol: [[[`A triangulation of an $(n+2)$-gon has $n$ triangles, here $n = ${N}$.`, `A binary tree with $n$ nodes corresponds to a Dyck path with $n$ up steps, here $n = ${N}$.`, `A full parenthesization of $n + 1$ factors performs $n$ multiplications, one per node of a binary tree, here $n = ${N}$.`][kind], [`$(n+2)$ 角形の三角形分割は $n$ 個の三角形をもち、ここでは $n = ${N}$ です。`, `節点が $n$ 個の二分木は上りが $n$ 回のディック経路に対応し、ここでは $n = ${N}$ です。`, `$n + 1$ 個の因子の完全な括弧付けは $n$ 回の掛け算を行い、それが二分木の節点一つずつに当たります。ここでは $n = ${N}$ です。`][kind]], [`So the count is $C_{${N}} = ${C}$.`, `したがって個数は $C_{${N}} = ${C}$ です。`]],
          set: N <= 7 ? { n: N } : undefined,
        };
      }
      const N = r.int(3, 6), words = DY[N], k = r.int(0, words.length - 1), w = words[k], j = firstReturn(w);
      return {
        q: [`The Dyck path ${w} (U up, D down). At which step does it first return to the axis?`, `ディック経路 ${w}（U は上り、D は下り）が初めて軸に戻るのは何歩目ですか。`],
        a: { type: 'int', v: j + 1 },
        hint: ['Track the height step by step: $+1$ for U, $-1$ for D.', '高さを一歩ずつ追います。U で $+1$、D で $-1$ です。'],
        sol: [[`Heights after each step: ${(() => { let h = 0; return w.split('').map((s) => (h += s === 'U' ? 1 : -1)).join(', '); })()}.`, `各歩の後の高さは ${(() => { let h = 0; return w.split('').map((s) => (h += s === 'U' ? 1 : -1)).join(', '); })()} です。`], [`The first zero is after step $${j + 1}$, so $w = $ U A D B with A = ${w.slice(1, j) || 'empty'} and B = ${w.slice(j + 1) || 'empty'}: those are the left and right subtrees of the root.`, `最初の 0 は $${j + 1}$ 歩目の後なので、$w = $ U A D B で、A = ${w.slice(1, j) || '空'}、B = ${w.slice(j + 1) || '空'} です。これが根の左と右の部分木です。`]],
        set: { n: N, k: k + 1, sel: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(2, 9), bad = binom(2 * N, N + 1);
        return {
          q: [`Of the $\\binom{${2 * N}}{${N}}$ paths with ${N} up steps and ${N} down steps, how many dip below the axis somewhere?`, `上り ${N} 回と下り ${N} 回の $\\binom{${2 * N}}{${N}}$ 本の経路のうち、どこかで軸の下へはみ出すものは何本ですか。`],
          a: { type: 'int', v: bad },
          hint: ['Reflect the part of a bad path after it first touches height $-1$.', '悪い経路の、初めて高さ $-1$ に触れた後の部分を折り返します。'],
          sol: [['Reflecting everything after the first touch of $-1$ swaps ups and downs there, so the path ends at $-2$: it now has $n - 1$ ups and $n + 1$ downs, and every such path arises exactly once.', '初めて $-1$ に触れた後をすべて折り返すとそこの上りと下りが入れ替わり、経路は $-2$ で終わります。上りは $n - 1$ 回、下りは $n + 1$ 回となり、そうした経路はどれもちょうど一回ずつ現れます。'], [`So the bad paths number $\\binom{${2 * N}}{${N + 1}} = ${bad}$.`, `したがって悪い経路は $\\binom{${2 * N}}{${N + 1}} = ${bad}$ 本です。`], [`The good ones, the Dyck paths, number $${binom(2 * N, N)} - ${bad} = ${catalan(N)} = C_{${N}}$.`, `良い経路、すなわちディック経路は $${binom(2 * N, N)} - ${bad} = ${catalan(N)} = C_{${N}}$ 本です。`]],
          set: N <= 7 ? { n: N } : undefined,
        };
      }
      if (form === 1) {
        const N = r.int(3, 6), words = DY[N], k = r.int(0, words.length - 1), w = words[k], j = firstReturn(w), m = (j + 1) / 2;
        return {
          q: [`In the figure's bijection, the Dyck path ${w} becomes a triangulation of the ${N + 2}-gon with vertices $0, \\dots, ${N + 1}$, whose root triangle stands on the side $(0, ${N + 1})$. Which vertex is the apex of the root triangle?`, `図の全単射で、ディック経路 ${w} は頂点 $0, \\dots, ${N + 1}$ の ${N + 2} 角形の三角形分割になり、根の三角形は辺 $(0, ${N + 1})$ の上に立ちます。根の三角形の頂点はどれですか。`],
          a: { type: 'int', v: m },
          hint: ['Split the word at its first return, U A D B. The left subtree A has to fit into the polygon to the left of the root triangle.', '語を最初の帰還で U A D B と分けます。左部分木 A は根の三角形の左側の多角形に収まらねばなりません。'],
          sol: [[`The first return is at step $${j + 1}$, so A = ${w.slice(1, j) || 'empty'} has $${m - 1}$ ${pl(m - 1, 'up step', 'up steps')} and B has $${N - m}$.`, `最初の帰還は $${j + 1}$ 歩目なので、A = ${w.slice(1, j) || '空'} は上りが $${m - 1}$ 回、B は $${N - m}$ 回です。`], [`A triangulation with $${m - 1}$ ${pl(m - 1, 'triangle', 'triangles')} needs a polygon with $${m + 1}$ vertices, $0, \\dots, ${m}$, so the apex is $${m}$.`, `三角形が $${m - 1}$ 個の三角形分割には頂点が $${m + 1}$ 個の多角形 $0, \\dots, ${m}$ が必要なので、頂点は $${m}$ です。`], [`The right part, vertices $${m}, \\dots, ${N + 1}$, holds B's ${N - m} triangle${N - m === 1 ? '' : 's'}. The gold triangle in the figure is $(0, ${m}, ${N + 1})$.`, `右側の頂点 $${m}, \\dots, ${N + 1}$ には B の ${N - m} 個の三角形が入ります。図の金色の三角形は $(0, ${m}, ${N + 1})$ です。`]],
          set: { n: N, k: k + 1, sel: 1 },
        };
      }
      const N = r.int(3, 9), Cs = Array.from({ length: N + 1 }, (_, i) => catalan(i)), C1 = catalan(N + 1);
      return {
        q: [`Given $C_0, \\dots, C_{${N}} = ${Cs.join(', ')}$, use the recurrence $C_{n+1} = \\sum_{k=0}^{n} C_k C_{n-k}$ to find $C_{${N + 1}}$.`, `$C_0, \\dots, C_{${N}} = ${Cs.join(', ')}$ が与えられています。漸化式 $C_{n+1} = \\sum_{k=0}^{n} C_k C_{n-k}$ で $C_{${N + 1}}$ を求めてください。`],
        a: { type: 'int', v: C1 },
        hint: ['Pair the list with itself reversed and add the products.', '列とその逆順を組にして、積を足します。'],
        sol: [[`$C_{${N + 1}} = ${Cs.map((c, k) => `${c}\\cdot${Cs[N - k]}`).join(' + ')}$.`, `$C_{${N + 1}} = ${Cs.map((c, k) => `${c}\\cdot${Cs[N - k]}`).join(' + ')}$ です。`], [`$= ${Cs.map((c, k) => c * Cs[N - k]).join(' + ')} = ${C1}$.`, `$= ${Cs.map((c, k) => c * Cs[N - k]).join(' + ')} = ${C1}$ です。`], ['The term $C_kC_{n-k}$ counts the paths whose first return comes after $2(k+1)$ steps: $C_k$ choices inside, $C_{n-k}$ after.', '項 $C_kC_{n-k}$ は、最初の帰還が $2(k+1)$ 歩目の経路を数えます。内側に $C_k$ 通り、その後に $C_{n-k}$ 通りです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2);
        const F = [
          { v: '2*(2n-1)/(n+1)', lhs: '$C_n/C_{n-1} =$', en: 'the ratio $C_n / C_{n-1}$ of consecutive Catalan numbers', ja: '隣り合うカタラン数の比 $C_n / C_{n-1}$',
            s1: '$\\dfrac{C_n}{C_{n-1}} = \\dfrac{(2n)!}{n!\\,(n+1)!}\\cdot\\dfrac{(n-1)!\\,n!}{(2n-2)!} = \\dfrac{(2n)(2n-1)}{n(n+1)} = \\dfrac{2(2n-1)}{n+1}$',
            s2: ['It tends to $4$, so the Catalan numbers grow like $4^n$; the shortfall $4 - 6/(n+1)$ is what multiplies up to the $n^{-3/2}$ factor.', 'これは $4$ に近づくので、カタラン数は $4^n$ のように増えます。$4 - 6/(n+1)$ の不足分が積み重なって $n^{-3/2}$ の因子になります。'] },
          { v: '2*(2n-1)/n', lhs: '$\\binom{2n}{n}\\big/\\binom{2n-2}{n-1} =$', en: 'the ratio $\\binom{2n}{n}\\big/\\binom{2n-2}{n-1}$ of consecutive central binomial coefficients', ja: '隣り合う中心二項係数の比 $\\binom{2n}{n}\\big/\\binom{2n-2}{n-1}$',
            s1: '$\\dfrac{(2n)!}{n!\\,n!}\\cdot\\dfrac{(n-1)!\\,(n-1)!}{(2n-2)!} = \\dfrac{(2n)(2n-1)}{n^2} = \\dfrac{2(2n-1)}{n}$',
            s2: ['It is $4 - 2/n$, closer to 4 than the Catalan ratio $4 - 6/(n+1)$: the central binomials grow like $4^n/\\sqrt{\\pi n}$, one power of $n$ faster than $C_n$, because $C_n = \\binom{2n}{n}/(n+1)$.', 'これは $4 - 2/n$ で、カタラン数の比 $4 - 6/(n+1)$ より 4 に近いです。$C_n = \\binom{2n}{n}/(n+1)$ なので、中心二項係数は $4^n/\\sqrt{\\pi n}$ のように、$C_n$ より $n$ の一乗分速く増えます。'] },
          { v: 'n/(n+1)', lhs: '$\\binom{2n}{n+1}\\big/\\binom{2n}{n} =$', en: 'the fraction $\\binom{2n}{n+1}\\big/\\binom{2n}{n}$ of paths with $n$ ups and $n$ downs that dip below the axis', ja: '上り $n$ 回と下り $n$ 回の経路のうち軸の下へはみ出すものの割合 $\\binom{2n}{n+1}\\big/\\binom{2n}{n}$',
            s1: '$\\dfrac{(2n)!}{(n+1)!\\,(n-1)!}\\cdot\\dfrac{n!\\,n!}{(2n)!} = \\dfrac{n}{n+1}$',
            s2: ['So a fraction $1/(n+1)$ of all paths are Dyck paths, which is $C_n = \\binom{2n}{n}/(n+1)$ again, and almost every long path dips below the axis.', 'したがってディック経路は全経路の $1/(n+1)$ で、これも $C_n = \\binom{2n}{n}/(n+1)$ です。長い経路のほとんどは軸の下へはみ出します。'] },
        ][kind];
        return {
          q: [`Write ${F.en} as a function of $n$.`, `${F.ja}を $n$ の式で表してください。`],
          a: { type: 'expr', v: F.v, vars: ['n'], dom: { n: [1, 9] }, lhs: [F.lhs, F.lhs] },
          hint: ['Write each term with factorials and cancel.', '各項を階乗で書いて約分します。'],
          sol: [[`${F.s1}.`, `${F.s1} です。`], F.s2],
          set: kind === 2 ? { n: 4 } : undefined,
        };
      }
      if (form === 1) {
        const a = r.int(3, 8), b = r.int(1, a - 1), cnt = binom(a + b, b) - binom(a + b, b - 1);
        return {
          q: [`How many paths of ${a} up steps and ${b} down steps never go below their starting height?`, `上り ${a} 回と下り ${b} 回からなり、出発点の高さより下へ決して行かない経路はいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Subtract the bad paths. Reflecting a bad path before its first touch of $-1$ turns it into a path starting at $-2$.', '悪い経路を引きます。悪い経路の、初めて $-1$ に触れるまでの部分を折り返すと、$-2$ から出発する経路になります。'],
          sol: [[`All paths: $\\binom{${a + b}}{${b}} = ${binom(a + b, b)}$.`, `経路全体は $\\binom{${a + b}}{${b}} = ${binom(a + b, b)}$ 本です。`], [`A bad path touches $-1$. Reflecting its first stretch up to that touch gives a path from $-2$ to $${a - b}$, with $${a + 1}$ ups and $${b - 1}$ ${pl(b - 1, 'down', 'downs')}; there are $\\binom{${a + b}}{${b - 1}} = ${binom(a + b, b - 1)}$ of those.`, `悪い経路は $-1$ に触れます。そこまでの最初の部分を折り返すと $-2$ から $${a - b}$ への経路になり、上りが $${a + 1}$ 回、下りが $${b - 1}$ 回です。そうした経路は $\\binom{${a + b}}{${b - 1}} = ${binom(a + b, b - 1)}$ 本です。`], [`So $${binom(a + b, b)} - ${binom(a + b, b - 1)} = ${cnt}$. This is the ballot problem; with $a = b = n$ it gives $C_n$.`, `したがって $${binom(a + b, b)} - ${binom(a + b, b - 1)} = ${cnt}$ です。これは投票問題で、$a = b = n$ とすると $C_n$ になります。`]],
        };
      }
      const N = r.int(3, 7), m = r.int(1, N), cnt = catalan(m - 1) * catalan(N - m);
      const k = DY[N].findIndex((w) => (firstReturn(w) + 1) / 2 === m);
      return {
        q: [`How many triangulations of the ${N + 2}-gon with vertices $0, 1, \\dots, ${N + 1}$ contain the triangle $(0, ${m}, ${N + 1})$?`, `頂点 $0, 1, \\dots, ${N + 1}$ の ${N + 2} 角形の三角形分割のうち、三角形 $(0, ${m}, ${N + 1})$ を含むものはいくつありますか。`],
        a: { type: 'int', v: cnt },
        hint: ['The triangle cuts the polygon into two smaller polygons, which are triangulated independently.', 'その三角形は多角形を二つの小さな多角形に分け、それぞれ独立に三角形分割されます。'],
        sol: [[`Left of the triangle is the polygon $0, \\dots, ${m}$ with $${m + 1}$ vertices: $C_{${m - 1}} = ${catalan(m - 1)}$ triangulations${m === 1 ? ' (just an edge)' : ''}.`, `三角形の左は頂点 $${m + 1}$ 個の多角形 $0, \\dots, ${m}$ で、三角形分割は $C_{${m - 1}} = ${catalan(m - 1)}$ 通りです${m === 1 ? '（辺だけ）' : ''}。`], [`Right of it is the polygon $${m}, \\dots, ${N + 1}$ with $${N + 2 - m}$ vertices: $C_{${N - m}} = ${catalan(N - m)}$ triangulations.`, `右は頂点 $${N + 2 - m}$ 個の多角形 $${m}, \\dots, ${N + 1}$ で、三角形分割は $C_{${N - m}} = ${catalan(N - m)}$ 通りです。`], [`So $${catalan(m - 1)}\\cdot${catalan(N - m)} = ${cnt}$. Summing over the apex $m = 1, \\dots, ${N}$ gives $C_{${N}} = ${catalan(N)}$: the Catalan recurrence, read off the polygon.`, `したがって $${catalan(m - 1)}\\cdot${catalan(N - m)} = ${cnt}$ です。頂点 $m = 1, \\dots, ${N}$ について足すと $C_{${N}} = ${catalan(N)}$ となり、カタラン数の漸化式を多角形から読み取ったことになります。`]],
        set: { n: N, k: k + 1, sel: 1 },
      };
    },
  ];

  /* ---------- 3. generating functions and growth ---------- */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const catRatio = (N) => { let c = 1; for (let k = 1; k <= N; k++) c = c * (4 * k - 2) / (k + 1); return c / (4 ** N / (Math.sqrt(Math.PI) * N ** 1.5)); };
  const motz = (N) => { let a = 1, b = 1; if (N === 0) return 1; for (let k = 2; k <= N; k++) [a, b] = [b, ((2 * k + 1) * b + (3 * k - 3) * a) / (k + 2)]; return b; };
  const motRatio = (N) => motz(N) / (Math.sqrt(27 / (4 * Math.PI)) * 3 ** N / N ** 1.5);
  const derange = (N) => { let a = 1, b = 0; if (N === 0) return 1; for (let k = 2; k <= N; k++) [a, b] = [b, (k - 1) * (a + b)]; return b; };
  const fact = (N) => { let f = 1; for (let k = 2; k <= N; k++) f *= k; return f; };
  const cOf = { 0.5: ['\\tfrac{1}{\\sqrt\\pi}', 1 / Math.sqrt(Math.PI)], 1.5: ['\\tfrac{2}{\\sqrt\\pi}', 2 / Math.sqrt(Math.PI)], '-0.5': ['-\\tfrac{1}{2\\sqrt\\pi}', -0.5 / Math.sqrt(Math.PI)], 2: ['1', 1], 3: ['\\tfrac12', 0.5] };

  Q['gf-asymptotics'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([2, 3, 4, 5, 6]), b = r.pick([-3, -2, 1, 2, 3].filter((x) => Math.abs(x) !== a)), mx = Math.max(a, Math.abs(b));
        return {
          q: [`What is the radius of convergence of $\\dfrac{1}{(1 - ${a}z)(1 ${b < 0 ? '+' : '-'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}z)}$?`, `$\\dfrac{1}{(1 - ${a}z)(1 ${b < 0 ? '+' : '-'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}z)}$ の収束半径はいくつですか。`],
          a: { type: 'num', v: 1 / mx, show: frac(1, mx) },
          hint: ['The series converges out to the nearest singularity of the function.', '級数は関数の最も近い特異点まで収束します。'],
          sol: [[`The poles are at $z = ${frac(1, a)}$ and $z = ${frac(1, b)}$.`, `極は $z = ${frac(1, a)}$ と $z = ${frac(1, b)}$ にあります。`], [`The nearer one is at distance $${frac(1, mx)}$, so $\\rho = ${frac(1, mx)}$ and the coefficients grow like $${mx}^n$.`, `近い方までの距離は $${frac(1, mx)}$ なので $\\rho = ${frac(1, mx)}$ で、係数は $${mx}^n$ のように増えます。`]],
        };
      }
      if (form === 1) {
        const s = r.int(0, 2), names = [['Fibonacci numbers', 'フィボナッチ数'], ['Catalan numbers', 'カタラン数'], ['Motzkin numbers', 'モツキン数']][s];
        const v = [PHI, 4, 3][s], rho = ['\\tfrac{1}{\\varphi} = \\tfrac{\\sqrt5 - 1}{2}', '\\tfrac14', '\\tfrac13'][s];
        const why = [['$1 - z - z^2 = 0$ at $z = 1/\\varphi \\approx 0.618$, a simple pole.', '$1 - z - z^2 = 0$ となるのは $z = 1/\\varphi \\approx 0.618$ で、単純極です。'], ['$\\sqrt{1 - 4z}$ branches at $z = 1/4$.', '$\\sqrt{1 - 4z}$ は $z = 1/4$ で分岐します。'], ['$1 - 2z - 3z^2 = (1 - 3z)(1 + z)$ vanishes at $z = 1/3$ and $z = -1$; the nearer is $1/3$.', '$1 - 2z - 3z^2 = (1 - 3z)(1 + z)$ は $z = 1/3$ と $z = -1$ で 0 になり、近いのは $1/3$ です。']][s];
        return {
          q: [`The ${names[0]} grow like $K^n$ times a power of $n$. What is $K$?`, `${names[1]}は $K^n$ に $n$ のべきを掛けたように増えます。$K$ はいくつですか。`],
          a: { type: 'num', v, show: s === 0 ? '\\varphi = \\tfrac{1+\\sqrt5}{2}' : String(v) },
          hint: ['$K = 1/\\rho$, where $\\rho$ is the distance from 0 to the nearest singularity of the generating function.', '$K = 1/\\rho$ で、$\\rho$ は 0 から母関数の最も近い特異点までの距離です。'],
          sol: [why, [`So $\\rho = ${rho}$ and $K = 1/\\rho = ${s === 0 ? '\\varphi \\approx 1.618' : v}$, the value of "growth 1/ρ" in the readout.`, `したがって $\\rho = ${rho}$、$K = 1/\\rho = ${s === 0 ? '\\varphi \\approx 1.618' : v}$ で、読み取り欄の「増大率 1/ρ」の値です。`]],
          set: { seq: s },
        };
      }
      const a = r.pick([2, 3, 5, -2, -3]), N = r.int(2, 6), sq = r.chance(0.5);
      const v = sq ? (N + 1) * a ** N : a ** N;
      const fn = `${a < 0 ? `1 + ${-a}z` : `1 - ${a}z`}`;
      return {
        q: [`What is the coefficient of $z^{${N}}$ in $\\dfrac{1}{(${fn})${sq ? '^2' : ''}}$?`, `$\\dfrac{1}{(${fn})${sq ? '^2' : ''}}$ の $z^{${N}}$ の係数はいくつですか。`],
        a: { type: 'int', v },
        hint: [sq ? 'Differentiate the geometric series: $\\frac{1}{(1-x)^2} = \\sum (n+1)x^n$.' : 'Geometric series: $\\frac{1}{1-x} = \\sum x^n$.', sq ? '等比級数を微分します。$\\frac{1}{(1-x)^2} = \\sum (n+1)x^n$ です。' : '等比級数 $\\frac{1}{1-x} = \\sum x^n$ を使います。'],
        sol: [[`With $x = ${a}z$, the coefficient of $z^n$ is $${sq ? '(n+1)' : ''}(${a})^n$.`, `$x = ${a}z$ とすると、$z^n$ の係数は $${sq ? '(n+1)' : ''}(${a})^n$ です。`], [`At $n = ${N}$: $${sq ? `${N + 1}\\cdot` : ''}(${a})^{${N}} = ${v}$. ${sq ? 'The double pole adds the factor $n + 1$: a pole of order $k$ gives a polynomial factor of degree $k - 1$.' : 'A simple pole gives pure geometric growth.'}`, `$n = ${N}$ では $${sq ? `${N + 1}\\cdot` : ''}(${a})^{${N}} = ${v}$ です。${sq ? '二重極が因子 $n + 1$ を加えます。$k$ 位の極は $k - 1$ 次の多項式の因子を与えます。' : '単純極は純粋な幾何級数的増大を与えます。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 1);
        if (kind === 0) {
          let a, b; do { a = r.int(1, 5); b = r.int(1, 5); } while (a === b);
          return {
            q: [`Find a closed form for the coefficient $a_n$ of $z^n$ in $\\dfrac{1}{(1 - ${a === 1 ? '' : a}z)(1 - ${b === 1 ? '' : b}z)}$.`, `$\\dfrac{1}{(1 - ${a === 1 ? '' : a}z)(1 - ${b === 1 ? '' : b}z)}$ の $z^n$ の係数 $a_n$ の閉じた式を求めてください。`],
            a: { type: 'expr', v: `(${a}^(n+1)-${b}^(n+1))/(${a - b})`, vars: ['n'], dom: { n: [0, 6] }, lhs: ['$a_n =$', '$a_n =$'] },
            hint: ['Partial fractions: $\\frac{1}{(1-az)(1-bz)} = \\frac{A}{1-az} + \\frac{B}{1-bz}$.', '部分分数に分けます。$\\frac{1}{(1-az)(1-bz)} = \\frac{A}{1-az} + \\frac{B}{1-bz}$ です。'],
            sol: [[`$A = \\frac{${a}}{${a} - ${b}}$ and $B = \\frac{${b}}{${b} - ${a}}$ (cover up each pole).`, `各極を隠す方法で $A = \\frac{${a}}{${a} - ${b}}$、$B = \\frac{${b}}{${b} - ${a}}$ です。`], [`$a_n = A\\cdot${a}^n + B\\cdot${b}^n = \\dfrac{${a}^{n+1} - ${b}^{n+1}}{${a - b}}$.`, `$a_n = A\\cdot${a}^n + B\\cdot${b}^n = \\dfrac{${a}^{n+1} - ${b}^{n+1}}{${a - b}}$ です。`], [`Check: $a_0 = 1$, $a_1 = ${a + b}$. For large $n$ the larger root ${Math.max(a, b)} dominates, as singularity analysis predicts from the nearer pole $z = ${frac(1, Math.max(a, b))}$.`, `確認：$a_0 = 1$、$a_1 = ${a + b}$ です。$n$ が大きいと大きい方の ${Math.max(a, b)} が支配し、これは近い方の極 $z = ${frac(1, Math.max(a, b))}$ から特異点解析が予言するとおりです。`]],
          };
        }
        const a = r.int(2, 5), k = r.int(2, 3);
        const v = k === 2 ? `(n+1)*${a}^n` : `(n+1)*(n+2)/2*${a}^n`;
        return {
          q: [`Find a closed form for the coefficient $a_n$ of $z^n$ in $\\dfrac{1}{(1 - ${a}z)^{${k}}}$.`, `$\\dfrac{1}{(1 - ${a}z)^{${k}}}$ の $z^n$ の係数 $a_n$ の閉じた式を求めてください。`],
          a: { type: 'expr', v, vars: ['n'], dom: { n: [0, 6] }, lhs: ['$a_n =$', '$a_n =$'] },
          hint: ['$\\frac{1}{(1-x)^k} = \\sum_n \\binom{n+k-1}{k-1} x^n$.', '$\\frac{1}{(1-x)^k} = \\sum_n \\binom{n+k-1}{k-1} x^n$ です。'],
          sol: [[`With $x = ${a}z$: $a_n = \\binom{n+${k - 1}}{${k - 1}}${a}^n$.`, `$x = ${a}z$ とすると $a_n = \\binom{n+${k - 1}}{${k - 1}}${a}^n$ です。`], [`$= ${k === 2 ? '(n+1)' : '\\tfrac{(n+1)(n+2)}{2}'}\\,${a}^n$: a pole of order ${k} multiplies the geometric growth by a polynomial of degree ${k - 1}, the $n^{\\alpha - 1}$ of the transfer theorem with $\\alpha = ${k}$.`, `$= ${k === 2 ? '(n+1)' : '\\tfrac{(n+1)(n+2)}{2}'}\\,${a}^n$ です。${k} 位の極は幾何級数的増大に ${k - 1} 次の多項式を掛け、これは移行定理で $\\alpha = ${k}$ としたときの $n^{\\alpha - 1}$ です。`]],
        };
      }
      if (form === 1) {
        const s = r.pick([1, 2]), N = r.pick([5, 10, 15, 20, 30, 40, 50]);
        const ratio = s === 1 ? catRatio(N) : motRatio(N), exact = s === 1 ? catalan(N) : motz(N);
        const pred = exact / ratio;
        return {
          q: [s === 1 ? `Singularity analysis predicts $C_n \\approx \\dfrac{4^n}{\\sqrt\\pi\\,n^{3/2}}$. At $n = ${N}$, where $C_{${N}} = ${n(exact, 6)}$, what is the ratio of the true value to the prediction? Give three decimals.` : `Singularity analysis predicts $M_n \\approx \\sqrt{\\tfrac{27}{4\\pi}}\\,\\dfrac{3^n}{n^{3/2}}$ for the Motzkin numbers. At $n = ${N}$, where $M_{${N}} = ${n(exact, 6)}$, what is the ratio of the true value to the prediction? Give three decimals.`, s === 1 ? `特異点解析は $C_n \\approx \\dfrac{4^n}{\\sqrt\\pi\\,n^{3/2}}$ と予言します。$C_{${N}} = ${n(exact, 6)}$ である $n = ${N}$ で、本当の値と予言の比はいくつですか（小数第3位まで）。` : `特異点解析はモツキン数について $M_n \\approx \\sqrt{\\tfrac{27}{4\\pi}}\\,\\dfrac{3^n}{n^{3/2}}$ と予言します。$M_{${N}} = ${n(exact, 6)}$ である $n = ${N}$ で、本当の値と予言の比はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: ratio, tol: 6e-4 },
          hint: ['Evaluate the prediction with logarithms if the powers are large, then divide.', 'べきが大きければ対数を使って予言を計算し、割ります。'],
          sol: [[`The prediction at $n = ${N}$ is $${n(pred, 6)}$.`, `$n = ${N}$ での予言は $${n(pred, 6)}$ です。`], [`Ratio: $${n(exact, 6)}/${n(pred, 6)} = ${n(ratio, 4)}$.`, `比は $${n(exact, 6)}/${n(pred, 6)} = ${n(ratio, 4)}$ です。`], [s === 1 ? `The ratio creeps up to 1 like $1 - 9/(8n)$ (here $${n(1 - 9 / (8 * N), 4)}$): a square-root singularity leaves corrections in powers of $1/n$, not exponentially small ones.` : 'The ratio approaches 1 only like $1 - c/n$: the square-root singularity at $1/3$ leaves corrections in powers of $1/n$.', s === 1 ? `比は $1 - 9/(8n)$（ここでは $${n(1 - 9 / (8 * N), 4)}$）のようにゆっくり 1 に近づきます。平方根型の特異点は指数的に小さな補正ではなく、$1/n$ のべきの補正を残します。` : '比は $1 - c/n$ のようにしか 1 に近づきません。$1/3$ の平方根型特異点が $1/n$ のべきの補正を残すからです。']],
          set: { seq: s, n: N },
        };
      }
      const N = r.int(4, 10), D = derange(N), F = fact(N);
      return {
        q: [`How many permutations of ${N} objects have no fixed point? (Derangements, $D_n = (n-1)(D_{n-1} + D_{n-2})$ with $D_0 = 1$, $D_1 = 0$.)`, `${N} 個の対象の置換のうち、固定点をもたないものはいくつありますか（完全順列、$D_n = (n-1)(D_{n-1} + D_{n-2})$、$D_0 = 1$、$D_1 = 0$）。`],
        a: { type: 'int', v: D },
        hint: ['Run the recurrence up from $D_2 = 1$, or round $n!/e$.', '$D_2 = 1$ から漸化式を進めるか、$n!/e$ を丸めます。'],
        sol: [[`$D_2, \\dots, D_{${N}} = ${Array.from({ length: N - 1 }, (_, i) => derange(i + 2)).join(', ')}$.`, `$D_2, \\dots, D_{${N}} = ${Array.from({ length: N - 1 }, (_, i) => derange(i + 2)).join(', ')}$ です。`], [`So $D_{${N}} = ${D}$, and $D_{${N}}/${N}! = ${n(D / F, 7)}$ against $1/e = ${n(Math.exp(-1), 7)}$.`, `したがって $D_{${N}} = ${D}$ で、$D_{${N}}/${N}! = ${n(D / F, 7)}$ を $1/e = ${n(Math.exp(-1), 7)}$ と比べます。`], ['The generating function $e^{-z}/(1 - z)$ has a single simple pole at $1$ and is otherwise entire, so the fraction converges to $1/e$ faster than any power of $n$.', '母関数 $e^{-z}/(1 - z)$ は $1$ に単純極を一つもつだけで、ほかでは正則なので、割合はどんな $n$ のべきよりも速く $1/e$ に収束します。']],
        set: { seq: 3, n: N },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const al = r.pick([0.5, 1.5, -0.5, 2, 3]), K = r.pick([2, 3, 4, 5]), beta = al - 1;
        const alTex = { 0.5: '\\tfrac12', 1.5: '\\tfrac32', '-0.5': '-\\tfrac12', 2: '2', 3: '3' }[al];
        const fTex = al === 0.5 ? `\\dfrac{1}{\\sqrt{1 - ${K}z}}` : al === -0.5 ? `\\sqrt{1 - ${K}z}` : al === 1.5 ? `(1 - ${K}z)^{-3/2}` : `\\dfrac{1}{(1 - ${K}z)^{${al}}}`;
        const g = cOf[al];
        return {
          q: [`The coefficients of $${fTex}$ behave like $a_n \\sim c\\,K^n n^{\\beta}$. Find $K$ and $\\beta$.`, `$${fTex}$ の係数は $a_n \\sim c\\,K^n n^{\\beta}$ のようにふるまいます。$K$ と $\\beta$ を求めてください。`],
          a: { type: 'tuple', v: [K, beta], labels: ['$K$', '$\\beta$'] },
          hint: ['Transfer theorem: $(1 - z/\\rho)^{-\\alpha}$ has coefficients $\\sim n^{\\alpha - 1}\\rho^{-n}/\\Gamma(\\alpha)$.', '移行定理：$(1 - z/\\rho)^{-\\alpha}$ の係数は $\\sim n^{\\alpha - 1}\\rho^{-n}/\\Gamma(\\alpha)$ です。'],
          sol: [[`The singularity is at $\\rho = ${frac(1, K)}$, so $K = 1/\\rho = ${K}$, and the function is $(1 - z/\\rho)^{-\\alpha}$ with $\\alpha = ${alTex}$.`, `特異点は $\\rho = ${frac(1, K)}$ にあるので $K = 1/\\rho = ${K}$ で、関数は $\\alpha = ${alTex}$ の $(1 - z/\\rho)^{-\\alpha}$ です。`], [`$\\beta = \\alpha - 1 = ${n(beta)}$, with constant $c = 1/\\Gamma(${alTex}) = ${g[0]}${Number.isInteger(g[1] * 2) ? '' : ` \\approx ${n(g[1], 4)}`}$.`, `$\\beta = \\alpha - 1 = ${n(beta)}$ で、定数は $c = 1/\\Gamma(${alTex}) = ${g[0]}${Number.isInteger(g[1] * 2) ? '' : ` \\approx ${n(g[1], 4)}`}$ です。`], [al === -0.5 ? `A square root that vanishes at $\\rho$ gives $n^{-3/2}$: this is the Catalan case, where the constant is negative and $C(z) = (1 - \\sqrt{1-4z})/2z$ flips its sign.` : al > 1 && Number.isInteger(al) ? 'An integer $\\alpha$ is a pole of that order, and the power of $n$ is exact up to lower-order terms.' : 'A singularity that blows up like an inverse square root weakens the growth by $n^{-1/2}$, as for the central binomial coefficients $\\binom{2n}{n} \\sim 4^n/\\sqrt{\\pi n}$.', al === -0.5 ? '$\\rho$ で 0 になる平方根は $n^{-3/2}$ を与えます。これはカタラン数の場合で、定数は負になり、$C(z) = (1 - \\sqrt{1-4z})/2z$ がその符号を反転させます。' : al > 1 && Number.isInteger(al) ? '整数の $\\alpha$ はその位数の極で、$n$ のべきは低次の項を除いて正確です。' : '逆平方根のように発散する特異点は増大を $n^{-1/2}$ だけ弱めます。中心二項係数 $\\binom{2n}{n} \\sim 4^n/\\sqrt{\\pi n}$ がその例です。']],
        };
      }
      if (form === 1) {
        // A(z) built from sqrt(1 - p z + q z^2): growth rate 1/(smallest |root|)
        const opts = [[6, 1, 'large Schröder numbers', '大シュレーダー数'], [2, -3, 'Motzkin numbers', 'モツキン数'], [4, 0, 'Catalan numbers', 'カタラン数'], [3, -4, '', ''], [5, 4, '', ''], [6, 5, '', ''], [8, 12, '', ''], [7, 10, '', ''], [5, -6, '', '']];
        const [p, q, nm, nmJ] = r.pick(opts);
        let roots;
        if (q === 0) roots = [1 / p];
        else { const d = Math.sqrt(p * p - 4 * q); roots = [(p - d) / (2 * q), (p + d) / (2 * q)]; }
        const rho = Math.min(...roots.map(Math.abs)), K = 1 / rho;
        const poly = `1 - ${p}z${q > 0 ? ` + ${q === 1 ? '' : q}z^2` : q < 0 ? ` - ${-q}z^2` : ''}`;
        const exactK = Number.isInteger(Math.round(K * 1e9) / 1e9) ? String(Math.round(K)) : `${n(K, 5)}`;
        const named = { '6,1': '\\dfrac{1 - z - \\sqrt{1 - 6z + z^2}}{2z}', '2,-3': '\\dfrac{1 - z - \\sqrt{1 - 2z - 3z^2}}{2z^2}', '4,0': '\\dfrac{1 - \\sqrt{1 - 4z}}{2z}' }[p + ',' + q];
        return {
          q: named
            ? [`The ${nm} have the generating function $${named}$. At what exponential rate $K$ do they grow?`, `${nmJ}の母関数は $${named}$ です。これはどんな指数的な割合 $K$ で増えますか。`]
            : [`The coefficients of $\\sqrt{${poly}}$ grow in size like $c\\,K^n n^{-3/2}$. Find $K$.`, `$\\sqrt{${poly}}$ の係数の大きさは $c\\,K^n n^{-3/2}$ のように増えます。$K$ を求めてください。`],
          a: { type: 'num', v: K, show: p === 6 && q === 1 ? '3 + 2\\sqrt2' : undefined },
          hint: ['The only singularities are where the square root branches, at the roots of the quadratic. The nearest root to 0 sets the radius.', '特異点は平方根が分岐する所、つまり二次式の根だけです。0 に最も近い根が半径を決めます。'],
          sol: [[q === 0 ? `$1 - ${p}z = 0$ at $z = ${frac(1, p)}$.` : `$${poly} = 0$ at $z = ${n(roots[0], 5)}$ and $z = ${n(roots[1], 5)}$.`, q === 0 ? `$1 - ${p}z = 0$ となるのは $z = ${frac(1, p)}$ です。` : `$${poly} = 0$ となるのは $z = ${n(roots[0], 5)}$ と $z = ${n(roots[1], 5)}$ です。`], [`The nearer is at distance $\\rho = ${n(rho, 5)}$, so $K = 1/\\rho = ${p === 6 && q === 1 ? '3 + 2\\sqrt2 \\approx 5.828' : exactK}$.`, `近い方までの距離は $\\rho = ${n(rho, 5)}$ なので $K = 1/\\rho = ${p === 6 && q === 1 ? '3 + 2\\sqrt2 \\approx 5.828' : exactK}$ です。`], ['Being a square-root branch point, it also fixes the correction: $a_n \\sim c\\,K^n n^{-3/2}$, the same shape as the Catalan and Motzkin numbers in the figure.', '平方根型の分岐点なので補正も決まり、$a_n \\sim c\\,K^n n^{-3/2}$ となります。図のカタラン数やモツキン数と同じ形です。']],
          set: p === 2 && q === -3 ? { seq: 2 } : p === 4 && q === 0 ? { seq: 1 } : undefined,
        };
      }
      const s = r.pick([1, 2]), th = r.pick(s === 1 ? [0.9, 0.95, 0.97, 0.98] : [0.9, 0.95, 0.97]);
      const f = s === 1 ? catRatio : motRatio;
      let N = 1; while (f(N) < th) N++;
      return {
        q: [`In the figure (${s === 1 ? 'Catalan' : 'Motzkin'} numbers), the ratio of $a_n$ to its singularity prediction rises towards 1. What is the smallest $n$ at which it reaches ${th}?`, `図（${s === 1 ? 'カタラン数' : 'モツキン数'}）で、$a_n$ と特異点からの予言の比は 1 に向かって増えます。比が ${th} に達する最小の $n$ はいくつですか。`],
        a: { type: 'int', v: N },
        hint: [s === 1 ? 'The ratio is about $1 - 9/(8n)$; use that to estimate, then check neighbouring $n$ exactly.' : 'Estimate with a $1 - c/n$ law from two values, then check neighbouring $n$; or drag the gold point.', s === 1 ? '比はおよそ $1 - 9/(8n)$ です。これで見積もってから、近くの $n$ を正確に調べます。' : '二つの値から $1 - c/n$ の法則で見積もり、近くの $n$ を調べます。金色の点をドラッグしても構いません。'],
        sol: [[s === 1 ? `$1 - 9/(8n) = ${th}$ gives $n \\approx ${n(9 / (8 * (1 - th)), 3)}$ as a first estimate.` : `The ratio behaves like $1 - c/n$ for large $n$, so it needs $n$ of order $c/(1 - ${th})$.`, s === 1 ? `$1 - 9/(8n) = ${th}$ から最初の見積もりは $n \\approx ${n(9 / (8 * (1 - th)), 3)}$ です。` : `比は $n$ が大きいとき $1 - c/n$ のようにふるまうので、$n$ は $c/(1 - ${th})$ 程度必要です。`], [`Exactly: the ratio is $${n(f(N - 1), 5)}$ at $n = ${N - 1}$ and $${n(f(N), 5)}$ at $n = ${N}$.`, `正確には、比は $n = ${N - 1}$ で $${n(f(N - 1), 5)}$、$n = ${N}$ で $${n(f(N), 5)}$ です。`], [`So $n = ${N}$. Reaching ${th} takes that long because the corrections from a square-root singularity shrink only like $1/n$.`, `したがって $n = ${N}$ です。${th} に達するのにこれだけかかるのは、平方根型の特異点からの補正が $1/n$ のようにしか縮まないからです。`]],
        set: { seq: s, n: N },
      };
    },
  ];
})();
