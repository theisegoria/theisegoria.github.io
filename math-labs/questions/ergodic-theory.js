'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, mat } = P.util;
  const fr = (x) => x - Math.floor(x);
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const dist = (x) => Math.min(fr(x), 1 - fr(x));
  // the figure's rotations, by the index of the segmented control
  const AL = [[(Math.sqrt(5) - 1) / 2, '(\\sqrt5 - 1)/2'], [Math.SQRT2 - 1, '\\sqrt2 - 1'], [Math.PI - 3, '\\pi - 3'], [Math.E - 2, 'e - 2'], [3 / 8, '3/8']];

  /* ---------------- 1. irrational rotation ---------------- */
  Q['irrational-rotation'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const q = r.pick([5, 7, 8, 9, 11, 12]); let p; do { p = r.int(1, q - 1); } while (gcd(p, q) !== 1);
        const k = r.int(3, 30), x = (k * p) % q;
        return {
          q: [`Rotate the circle $[0, 1)$ by $\\alpha = ${frac(p, q)}$, starting at $x_0 = 0$. What is $x_{${k}}$?`, `円 $[0, 1)$ を $\\alpha = ${frac(p, q)}$ だけ回し、$x_0 = 0$ から始めます。$x_{${k}}$ はいくつですか。`],
          a: { type: 'num', v: x / q, show: frac(x, q) },
          sol: [[`$x_{${k}} = ${k}\\cdot${frac(p, q)} \\bmod 1 = ${frac(k * p, q)} \\bmod 1$.`, `$x_{${k}} = ${k}\\cdot${frac(p, q)} \\bmod 1 = ${frac(k * p, q)} \\bmod 1$ です。`], [`$${k * p} = ${Math.floor(k * p / q)}\\cdot${q} + ${x}$, so $x_{${k}} = ${frac(x, q)}$: the orbit only ever visits multiples of $1/${q}$.`, `$${k * p} = ${Math.floor(k * p / q)}\\cdot${q} + ${x}$ より $x_{${k}} = ${frac(x, q)}$ です。軌道は $1/${q}$ の倍数しか訪れません。`]],
          set: p === 3 && q === 8 ? { al: 4, n: Math.min(400, k + 1) } : undefined,
        };
      }
      if (form === 1) {
        const q = r.pick([6, 8, 10, 12, 15, 16, 20]); let p; do { p = r.int(1, q - 1); } while (gcd(p, q) === 1 && r.chance(0.6));
        const per = q / gcd(p, q);
        return {
          q: [`Under rotation by $\\alpha = ${p}/${q}$, how many distinct points does the orbit of $0$ visit?`, `$\\alpha = ${p}/${q}$ の回転で、$0$ の軌道はいくつの異なる点を訪れますか。`],
          a: { type: 'int', v: per },
          hint: ['Reduce the fraction first.', 'まず分数を約分してください。'],
          sol: [[`$${p}/${q} = ${frac(p, q)}$ in lowest terms.`, `既約分数にすると $${p}/${q} = ${frac(p, q)}$ です。`], [`$n\\alpha$ is an integer first at $n = ${per}$, so the orbit closes after ${per} steps and visits ${per} points${per !== q ? `, not ${q}` : ''}.`, `$n\\alpha$ が初めて整数になるのは $n = ${per}$ なので、軌道は ${per} 歩で閉じ、${per} 点を訪れます${per !== q ? `（${q} 点ではありません）` : ''}。`]],
          set: p * 8 === 3 * q ? { al: 4, n: 60 } : undefined,
        };
      }
      const al = r.int(0, 3), len = r.step(0.05, 0.5, 0.01);
      return {
        q: [`For the rotation by $\\alpha = ${AL[al][1]}$, what fraction of the points $x_0, \\dots, x_{N-1}$ lie in an arc of length $${n(len)}$, as $N \\to \\infty$?`, `$\\alpha = ${AL[al][1]}$ の回転で、点 $x_0, \\dots, x_{N-1}$ のうち長さ $${n(len)}$ の弧に入るものの割合は、$N \\to \\infty$ でいくつになりますか。`],
        a: { type: 'num', v: len },
        hint: ['$\\alpha$ is irrational. Think of Weyl\'s theorem.', '$\\alpha$ は無理数です。ワイルの定理を思い出してください。'],
        sol: [['For irrational $\\alpha$ the orbit is uniformly distributed (Weyl), so every arc gets its share in proportion to its length.', '無理数の $\\alpha$ では軌道は一様分布します（ワイル）。そのため、どの弧も長さに比例した割合の点を得ます。'], [`The limit is the length, $${n(len)}$, wherever the arc sits. Set $n = 400$ and compare the readout.`, `極限は弧がどこにあってもその長さ $${n(len)}$ です。$n = 400$ にして読み取り欄と比べてください。`]],
        set: { al, len, n: 400 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const al = r.int(0, 3), N = r.int(4, 40);
        const pts = []; for (let i = 0; i < N; i++) pts.push(fr(i * AL[al][0]));
        const s = pts.slice().sort((a, b) => a - b), g = s.map((x, i) => (i + 1 < N ? s[i + 1] - x : 1 - x + s[0]));
        const d = []; g.slice().sort((a, b) => a - b).forEach((x) => { if (!d.length || x - d[d.length - 1] > 1e-9) d.push(x); });
        if (d.length === 3) {
          return {
            q: [`The first ${N} points of the rotation by $${AL[al][1]}$ cut the circle into gaps of three lengths. The two shorter ones are $${n(d[0], 5)}$ and $${n(d[1], 5)}$. How long is the third?`, `$${AL[al][1]}$ の回転の最初の ${N} 点は、円を3種類の長さのすきまに分けます。短い2つが $${n(d[0], 5)}$ と $${n(d[1], 5)}$ のとき、3つ目の長さはいくつですか。`],
            a: { type: 'num', v: d[0] + d[1], tol: 2e-5 },
            hint: ['The three-gap theorem relates the three lengths.', '三間隙定理が3つの長さの関係を与えます。'],
            sol: [['By the three-gap theorem, when there are three gap lengths the longest is the sum of the other two.', '三間隙定理により、すきまの長さが3種類のとき、最長のものは他の2つの和です。'], [`$${n(d[0], 5)} + ${n(d[1], 5)} = ${n(d[0] + d[1], 5)}$, which the readout lists for $n = ${N}$.`, `$${n(d[0], 5)} + ${n(d[1], 5)} = ${n(d[0] + d[1], 5)}$ で、$n = ${N}$ の読み取り欄に出ています。`]],
            set: { al, n: N },
          };
        }
        return {
          q: [`How many different gap lengths do the first ${N} points of the rotation by $${AL[al][1]}$ leave on the circle?`, `$${AL[al][1]}$ の回転の最初の ${N} 点は、円の上に何種類の長さのすきまを残しますか。`],
          a: { type: 'int', v: d.length },
          hint: ['It is never more than three; when is it fewer?', '3種類を超えることはありません。少なくなるのはどんなときでしょうか。'],
          sol: [[`Sorting the ${N} points and taking differences gives lengths ${d.map((x) => '$' + n(x, 5) + '$').join(', ')}.`, `${N} 点を並べて差をとると、長さは ${d.map((x) => '$' + n(x, 5) + '$').join('、')} です。`], [`So there are ${d.length}. Only two lengths occur at special $N$, just as a new shortest gap is about to appear.`, `したがって ${d.length} 種類です。2種類になるのは特別な $N$、すなわち新しい最短のすきまが現れる直前だけです。`]],
          set: { al, n: N },
        };
      }
      if (form === 1) {
        const al = r.int(0, 3), k = r.int(5, 60);
        const x = fr(k * AL[al][0]);
        return {
          q: [`Rotation by $\\alpha = ${AL[al][1]}$ from $x_0 = 0$. Find $x_{${k}}$ to four decimals.`, `$x_0 = 0$ から $\\alpha = ${AL[al][1]}$ で回します。$x_{${k}}$ を小数第4位まで求めてください。`],
          a: { type: 'num', v: x, tol: 6e-5 },
          sol: [[`$${k}\\alpha = ${n(k * AL[al][0], 6)}$.`, `$${k}\\alpha = ${n(k * AL[al][0], 6)}$ です。`], [`Dropping the integer part, $x_{${k}} = ${n(x, 4)}$. It is the newest gold point when $n = ${k + 1}$.`, `整数部分を捨てて $x_{${k}} = ${n(x, 4)}$ です。$n = ${k + 1}$ のとき金色の最新の点がこれです。`]],
          set: { al, n: k + 1 },
        };
      }
      const al = r.int(0, 3), eps = r.pick([0.1, 0.05, 0.03, 0.02, 0.01]);
      let m = 1; while (dist(m * AL[al][0]) >= eps) m++;
      return {
        q: [`Rotation by $\\alpha = ${AL[al][1]}$ from $x_0 = 0$. What is the first $n \\ge 1$ at which the orbit comes back within $${n(eps)}$ of $0$ (on either side)?`, `$x_0 = 0$ から $\\alpha = ${AL[al][1]}$ で回します。軌道が（どちら側でも）$0$ から $${n(eps)}$ 以内に初めて戻ってくる $n \\ge 1$ はいくつですか。`],
        a: { type: 'int', v: m },
        hint: ['You need $n\\alpha$ within $\\varepsilon$ of an integer. Check the convergents of $\\alpha$.', '$n\\alpha$ が整数から $\\varepsilon$ 以内にあればよいのです。$\\alpha$ の近似分数を調べてください。'],
        sol: [[`We need $\\|n\\alpha\\| < ${n(eps)}$, where $\\|\\cdot\\|$ is the distance to the nearest integer.`, `$\\|n\\alpha\\| < ${n(eps)}$ が必要です。ここで $\\|\\cdot\\|$ は最も近い整数までの距離です。`], [`Checking $n = 1, 2, \\dots$: the first success is $n = ${m}$, with $${m}\\alpha = ${n(m * AL[al][0], 5)}$, off by $${n(dist(m * AL[al][0]), 5)}$.`, `$n = 1, 2, \\dots$ と調べると、初めて成り立つのは $n = ${m}$ で、$${m}\\alpha = ${n(m * AL[al][0], 5)}$、ずれは $${n(dist(m * AL[al][0]), 5)}$ です。`], ['Close returns happen at denominators of the continued-fraction convergents: the better $\\alpha$ is approximated by fractions, the sooner it comes back.', '近い回帰は連分数の近似分数の分母で起こります。$\\alpha$ が分数でよく近似できるほど早く戻ってきます。']],
        set: { al, n: Math.min(400, m + 1) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const len = r.pick([0.05, 0.1, 0.2, 0.25, 0.4, 0.5]);
        return {
          q: [`Starting in an arc $A$ of length $${n(len)}$, the orbit of an irrational rotation leaves and later returns to $A$. On average over starting points in $A$, how many steps does the first return take?`, `長さ $${n(len)}$ の弧 $A$ から出発すると、無理数回転の軌道は $A$ を離れ、やがて戻ってきます。$A$ 内の出発点について平均すると、最初の回帰には何歩かかりますか。`],
          a: { type: 'num', v: 1 / len },
          hint: ['Kac\'s lemma, for an ergodic measure-preserving map.', 'エルゴード的な測度を保つ写像に対するカッツの補題です。'],
          sol: [['Kac\'s lemma: for an ergodic map preserving a probability measure, the mean return time to a set $A$ is $1/\\mu(A)$.', 'カッツの補題：確率測度を保つエルゴード的な写像では、集合 $A$ への平均回帰時間は $1/\\mu(A)$ です。'], [`Here $1/${n(len)} = ${n(1 / len)}$ steps. Small sets are rarely visited, so you wait long for them, exactly in proportion.`, `ここでは $1/${n(len)} = ${n(1 / len)}$ 歩です。小さな集合はめったに訪れられないので、待ち時間はちょうど反比例して長くなります。`]],
          set: { al: 0, len, n: 400 },
        };
      }
      if (form === 1) {
        const cases = [
          ['\\sqrt8 - 2', ['$\\sqrt8 = 2\\sqrt2$ is irrational, so $\\alpha$ is irrational.', '$\\sqrt8 = 2\\sqrt2$ は無理数なので $\\alpha$ も無理数です。'], true],
          ['\\sqrt9 - 2.5', ['$\\sqrt9 = 3$, so $\\alpha = 1/2$: rational.', '$\\sqrt9 = 3$ なので $\\alpha = 1/2$ で、有理数です。'], false],
          ['\\log_{10} 2', ['If $10^{p/q} = 2$ then $10^p = 2^q$, impossible since $5$ divides one side only.', '$10^{p/q} = 2$ なら $10^p = 2^q$ ですが、5 は片方しか割り切らないので不可能です。'], true],
          ['\\log_{4} 8', ['$4^{3/2} = 8$, so $\\alpha = 3/2$, and the rotation by $3/2$ is the rotation by $1/2$.', '$4^{3/2} = 8$ より $\\alpha = 3/2$ で、$3/2$ の回転は $1/2$ の回転と同じです。'], false],
          ['0.142857142857\\ldots', ['A repeating decimal is rational: this one is $1/7$.', '循環小数は有理数で、これは $1/7$ です。'], false],
          ['\\pi/4', ['$\\pi$ is irrational, so is $\\pi/4$.', '$\\pi$ は無理数なので $\\pi/4$ も無理数です。'], true],
          ['(1 + \\sqrt5)/2', ['$\\sqrt5$ is irrational; the golden ratio and the golden mean differ by 1, the same rotation.', '$\\sqrt5$ は無理数です。黄金比と黄金平均は 1 だけ違い、同じ回転です。'], true],
        ];
        const c = r.pick(cases);
        return {
          q: [`Is the rotation of the circle by $\\alpha = ${c[0]}$ ergodic for length?`, `円を $\\alpha = ${c[0]}$ だけ回す回転は、長さに関してエルゴード的ですか。`],
          a: { type: 'choice', opts: [['Yes: $\\alpha$ is irrational, so every invariant set has length 0 or 1', 'はい。$\\alpha$ は無理数なので、不変集合の長さは 0 か 1 です'], ['No: $\\alpha$ is rational, so finite orbits form invariant sets of intermediate length', 'いいえ。$\\alpha$ は有理数なので、有限軌道から中間の長さの不変集合が作れます'], ['Yes: every rotation preserves length, so it is ergodic', 'はい。回転はすべて長さを保つのでエルゴード的です']], v: c[2] ? 0 : 1, fixed: true },
          hint: ['Preserving length is not enough. Decide whether $\\alpha$ is rational.', '長さを保つだけでは足りません。$\\alpha$ が有理数かどうかを判定してください。'],
          sol: [c[1], c[2] ? ['An irrational rotation is ergodic: every orbit is dense and equidistributed.', '無理数回転はエルゴード的です。どの軌道も稠密で一様分布します。'] : ['For $\\alpha = p/q$ the union of small arcs around one orbit is invariant and has any length you like, so the rotation is not ergodic.', '$\\alpha = p/q$ のとき、1つの軌道のまわりの小さな弧の和集合は不変で、その長さは自由に選べます。したがってエルゴード的ではありません。']],
        };
      }
      const al = r.int(0, 3), d = r.pick([0.05, 0.02, 0.01, 0.005, 0.002]);
      let q = 1; while (dist(q * AL[al][0]) >= d) q++;
      const p = Math.round(q * AL[al][0]);
      return {
        q: [`Find the smallest denominator $q$ for which some fraction $p/q$ satisfies $|${AL[al][1]} - p/q| < ${n(d)}/q$.`, `ある分数 $p/q$ が $|${AL[al][1]} - p/q| < ${n(d)}/q$ を満たすような最小の分母 $q$ を求めてください。`],
        a: { type: 'int', v: q },
        hint: ['Multiply through by $q$: you need $q\\alpha$ within the given distance of an integer.', '両辺に $q$ を掛けると、$q\\alpha$ が整数から指定の距離以内にあればよいことがわかります。'],
        sol: [[`The condition is $\\|q\\alpha\\| < ${n(d)}$: the orbit point $x_q$ returns that close to $0$.`, `条件は $\\|q\\alpha\\| < ${n(d)}$ で、軌道の点 $x_q$ が $0$ にそこまで近く戻ることです。`], [`The first $q$ that works is $${q}$, with $p = ${p}$: $${q}\\alpha = ${n(q * AL[al][0], 6)}$.`, `初めて成り立つ $q$ は $${q}$ で、$p = ${p}$ です。$${q}\\alpha = ${n(q * AL[al][0], 6)}$ です。`], [`So $${p}/${q}$ is a continued-fraction convergent of $\\alpha$. The rotation's close returns and the best rational approximations are the same thing.`, `したがって $${p}/${q}$ は $\\alpha$ の連分数の近似分数です。回転の近い回帰と最良有理近似は同じものです。`]],
        set: { al, n: Math.min(400, q + 1) },
      };
    },
  ];

  /* ---------------- 2. mixing maps ---------------- */
  const cat = (x, y) => [fr(2 * x + y), fr(x + y)];
  const baker = (x, y) => (x < 0.5 ? [2 * x, y / 2] : [2 * x - 1, (y + 1) / 2]);
  const MATS = [[[2, 1], [1, 1]], [[1, 1], [1, 2]], [[3, 1], [2, 1]], [[3, 2], [1, 1]], [[2, 3], [1, 2]], [[5, 2], [2, 1]], [[1, 2], [1, 3]], [[4, 3], [1, 1]]];
  Q['mixing-maps'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.int(0, 9) / 10, y = r.int(0, 9) / 10, [a, b] = cat(x, y);
        return {
          q: [`Apply the cat map $(x, y) \\mapsto (2x + y,\\ x + y) \\bmod 1$ to $(${n(x)}, ${n(y)})$.`, `猫写像 $(x, y) \\mapsto (2x + y,\\ x + y) \\bmod 1$ を $(${n(x)}, ${n(y)})$ に施してください。`],
          a: { type: 'tuple', v: [a, b], labels: ['$x\'$', '$y\'$'], tol: 1e-6 },
          sol: [[`$2x + y = ${n(2 * x + y)}$ and $x + y = ${n(x + y)}$.`, `$2x + y = ${n(2 * x + y)}$、$x + y = ${n(x + y)}$ です。`], [`Reducing mod 1: $(${n(a)}, ${n(b)})$. Points with coordinates in tenths stay in tenths, which is why the map on a pixel grid is a permutation.`, `mod 1 で簡約すると $(${n(a)}, ${n(b)})$ です。座標が 10 分の 1 単位の点は 10 分の 1 単位のままなので、画素格子の上では写像は置換になります。`]],
          set: { map: 0, k: 1 },
        };
      }
      if (form === 1) {
        const x = r.int(0, 15) / 16, y = r.int(0, 15) / 16, [a, b] = baker(x, y);
        return {
          q: [`Apply the baker's map to $(${n(x)}, ${n(y)})$: for $x < \\tfrac12$, $(2x, y/2)$; otherwise $(2x - 1, (y + 1)/2)$.`, `パン屋の写像を $(${n(x)}, ${n(y)})$ に施してください。$x < \\tfrac12$ なら $(2x, y/2)$、そうでなければ $(2x - 1, (y + 1)/2)$ です。`],
          a: { type: 'tuple', v: [a, b], labels: ['$x\'$', '$y\'$'], tol: 1e-6 },
          sol: [[`$x = ${n(x)}$ is ${x < 0.5 ? 'in the left half' : 'in the right half'}, so ${x < 0.5 ? '$(2x, y/2)$' : '$(2x - 1, (y + 1)/2)$'} applies.`, `$x = ${n(x)}$ は${x < 0.5 ? '左半分' : '右半分'}にあるので ${x < 0.5 ? '$(2x, y/2)$' : '$(2x - 1, (y + 1)/2)$'} を使います。`], [`The image is $(${n(a)}, ${n(b)})$: stretched sideways, squashed vertically, and the right half stacked on top.`, `像は $(${n(a)}, ${n(b)})$ です。横に伸ばされ、縦に押しつぶされ、右半分が上に積まれます。`]],
          set: { map: 1, k: 1 },
        };
      }
      const M = r.pick(MATS);
      const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
      return {
        q: [`Does the map $\\mathbf x \\mapsto ${mat(M)}\\mathbf x \\bmod 1$ preserve area on the torus?`, `写像 $\\mathbf x \\mapsto ${mat(M)}\\mathbf x \\bmod 1$ はトーラス上で面積を保ちますか。`],
        a: { type: 'choice', opts: [[`Yes: its determinant is ${det}, and as an integer matrix it maps the torus to itself one-to-one`, `はい。行列式は ${det} で、整数行列としてトーラスを自分自身に1対1に写します`], ['No: it stretches one direction, so areas grow', 'いいえ。ある方向に伸ばすので面積は増えます'], ['Only for $k$ even', '$k$ が偶数のときだけ']], v: 0 },
        hint: ['Area scales by $|\\det|$.', '面積は $|\\det|$ 倍になります。'],
        sol: [[`$\\det = ${M[0][0]}\\cdot${M[1][1]} - ${M[0][1]}\\cdot${M[1][0]} = ${det}$.`, `$\\det = ${M[0][0]}\\cdot${M[1][1]} - ${M[0][1]}\\cdot${M[1][0]} = ${det}$ です。`], ['Area scales by $|\\det| = 1$; integer entries with determinant $\\pm1$ also make the inverse an integer matrix, so the map is a bijection of the torus. It stretches one way and squeezes another by the same factor.', '面積は $|\\det| = 1$ 倍です。成分が整数で行列式が $\\pm1$ なら逆行列も整数行列なので、写像はトーラスの全単射です。ある方向に伸ばし、別の方向に同じ比で縮めます。']],
        set: { map: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M = r.pick(MATS), tr = M[0][0] + M[1][1], lam = (tr + Math.sqrt(tr * tr - 4)) / 2;
        return {
          q: [`Find the Lyapunov exponent of the torus map $\\mathbf x \\mapsto ${mat(M)}\\mathbf x \\bmod 1$.`, `トーラスの写像 $\\mathbf x \\mapsto ${mat(M)}\\mathbf x \\bmod 1$ のリャプノフ指数を求めてください。`],
          a: { type: 'num', v: Math.log(lam), tol: 6e-4, show: `\\ln\\frac{${tr} + \\sqrt{${tr * tr - 4}}}{2}` },
          hint: ['The Jacobian is the same matrix everywhere; the exponent is the log of its larger eigenvalue.', 'ヤコビ行列はどこでも同じ行列で、指数はその大きいほうの固有値の対数です。'],
          sol: [[`Trace $${tr}$, determinant $1$: $\\lambda^2 - ${tr}\\lambda + 1 = 0$, so $\\lambda = \\dfrac{${tr} \\pm \\sqrt{${tr * tr - 4}}}{2}$.`, `跡は $${tr}$、行列式は $1$ なので $\\lambda^2 - ${tr}\\lambda + 1 = 0$、$\\lambda = \\dfrac{${tr} \\pm \\sqrt{${tr * tr - 4}}}{2}$ です。`], [`The larger is $${n(lam, 5)}$, so the exponent is $\\ln ${n(lam, 5)} = ${n(Math.log(lam), 4)}$.`, `大きいほうは $${n(lam, 5)}$ なので、指数は $\\ln ${n(lam, 5)} = ${n(Math.log(lam), 4)}$ です。`], ['Nearby points separate like $e^{' + n(Math.log(lam), 3) + 'k}$ along the expanding direction, and the other eigenvalue $1/\\lambda$ squeezes them together the other way, keeping area fixed.', '近い点は伸びる方向に $e^{' + n(Math.log(lam), 3) + 'k}$ のように離れ、もう一つの固有値 $1/\\lambda$ が別の方向に縮めるので面積は変わりません。']],
          set: tr === 3 && M[0][0] === 2 ? { map: 0 } : undefined,
        };
      }
      if (form === 1) {
        const s = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]), rad = r.pick([0.1, 0.15, 0.17, 0.2]);
        return {
          q: [`A disc of radius $${n(rad)}$ is pushed forward by the cat map. What fraction of it lies in a fixed square of side $${n(s)}$ after many steps?`, `半径 $${n(rad)}$ の円板を猫写像で押し進めます。多くの歩数の後、一辺 $${n(s)}$ の固定した正方形に入っている割合はいくつですか。`],
          a: { type: 'num', v: s * s },
          hint: ['Mixing: $\\mu(T^{k}D \\cap S)/\\mu(D) \\to \\mu(S)$.', '混合：$\\mu(T^{k}D \\cap S)/\\mu(D) \\to \\mu(S)$ です。'],
          sol: [['The cat map is mixing: the image of any set spreads evenly, so the fraction in $S$ tends to the area of $S$.', '猫写像は混合的です。どんな集合の像も一様に広がるので、$S$ に入る割合は $S$ の面積に近づきます。'], [`That is $${n(s)}^2 = ${n(s * s)}$, whatever the disc's size or place.`, `それは $${n(s)}^2 = ${n(s * s)}$ で、円板の大きさや位置によりません。`]],
          set: { map: 0, k: 20 },
        };
      }
      const which = r.int(0, 1), d0 = r.pick([1e-3, 1e-4, 1e-6, 1e-8, 1e-10]), target = r.pick([0.1, 0.5]);
      const g = which ? Math.log(2) : Math.log((3 + Math.sqrt(5)) / 2);
      const k = Math.ceil(Math.log(target / d0) / g - 1e-9);
      return {
        q: [`Two points start $${n(d0)}$ apart along the stretching direction of the ${which ? 'baker\'s map' : 'cat map'}. After how many steps is their separation first at least $${n(target)}$?`, `${which ? 'パン屋の写像' : '猫写像'}の伸びる方向に $${n(d0)}$ 離れた2点から始めます。距離が初めて $${n(target)}$ 以上になるのは何歩後ですか。`],
        a: { type: 'int', v: k },
        hint: [`Each step multiplies the separation by ${which ? '$2$' : '$\\varphi^2 \\approx 2.618$'}.`, `1歩ごとに距離は ${which ? '$2$' : '$\\varphi^2 \\approx 2.618$'} 倍になります。`],
        sol: [[`We need $${which ? '2' : '(\\varphi^2)'}^k \\cdot ${n(d0)} \\ge ${n(target)}$, that is $k \\ge \\ln(${n(target / d0)})/${n(g, 4)} = ${n(Math.log(target / d0) / g, 3)}$.`, `$${which ? '2' : '(\\varphi^2)'}^k \\cdot ${n(d0)} \\ge ${n(target)}$、すなわち $k \\ge \\ln(${n(target / d0)})/${n(g, 4)} = ${n(Math.log(target / d0) / g, 3)}$ が必要です。`], [`So $k = ${k}$. An initial uncertainty of $${n(d0)}$ becomes macroscopic in a couple of dozen steps at most: this is why individual orbits are unpredictable while averages are not.`, `したがって $k = ${k}$ です。$${n(d0)}$ の初期の不確かさは、多くても数十歩で目に見える大きさになります。個々の軌道は予測できないのに平均は予測できるのはこのためです。`]],
        set: { map: which, k: Math.min(20, k) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 20, 25]);
        let a = 1, b = 0, c = 0, d = 1, k = 0;
        do { [a, b, c, d] = [(2 * a + c) % N, (2 * b + d) % N, (a + c) % N, (b + d) % N]; k++; } while (!(a === 1 && b === 0 && c === 0 && d === 1));
        return {
          q: [`On the $${N} \\times ${N}$ grid of points $(i/${N}, j/${N})$ the cat map is a permutation. After how many steps does every point first return to where it started?`, `点 $(i/${N}, j/${N})$ からなる $${N} \\times ${N}$ の格子の上では、猫写像は置換です。すべての点が初めて元の位置に戻るのは何歩後ですか。`],
          a: { type: 'int', v: k },
          hint: ['Find the least $k$ with $A^k \\equiv I \\pmod{' + N + '}$, where $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$.', '$A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}$ として、$A^k \\equiv I \\pmod{' + N + '}$ となる最小の $k$ を求めてください。'],
          sol: [['$A^k = \\begin{pmatrix} F_{2k+1} & F_{2k} \\\\ F_{2k} & F_{2k-1} \\end{pmatrix}$ with Fibonacci numbers, so we need $F_{2k} \\equiv 0$ and $F_{2k+1} \\equiv 1 \\pmod{' + N + '}$.', 'フィボナッチ数を使うと $A^k = \\begin{pmatrix} F_{2k+1} & F_{2k} \\\\ F_{2k} & F_{2k-1} \\end{pmatrix}$ なので、$F_{2k} \\equiv 0$ かつ $F_{2k+1} \\equiv 1 \\pmod{' + N + '}$ が必要です。'], [`Iterating $A$ mod ${N} gives the identity first at $k = ${k}$.`, `$A$ を mod ${N} で繰り返し掛けると、初めて単位行列になるのは $k = ${k}$ です。`], ['This recurrence is an artefact of the finite grid. On the true torus the map is mixing, and a picture made of exact grid pixels returning is no contradiction: almost every point of the torus never returns exactly.', 'この回帰は有限の格子のせいです。本当のトーラス上では写像は混合的で、格子の画素でできた絵が戻ることと矛盾しません。トーラスのほとんどすべての点は正確には戻りません。']],
        };
      }
      if (form === 1) {
        const k = r.int(1, 6);
        let a = 1, b = 0, c = 0, d = 1; for (let i = 0; i < k; i++) [a, b, c, d] = [2 * a + c, 2 * b + d, a + c, b + d];
        const tr = a + d, cnt = Math.abs(tr - 2);
        return {
          q: [`How many points of the torus satisfy $T^{${k}}\\mathbf x = \\mathbf x$ for the cat map $T$?`, `猫写像 $T$ について、$T^{${k}}\\mathbf x = \\mathbf x$ を満たすトーラスの点はいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Count solutions of $(A^k - I)\\mathbf x \\in \\mathbb Z^2$: it is $|\\det(A^k - I)|$.', '$(A^k - I)\\mathbf x \\in \\mathbb Z^2$ の解の個数は $|\\det(A^k - I)|$ です。'],
          sol: [[`$A^{${k}} = ${mat([[a, b], [c, d]])}$, with trace $${tr}$.`, `$A^{${k}} = ${mat([[a, b], [c, d]])}$ で、跡は $${tr}$ です。`], [`$\\det(A^{${k}} - I) = \\det A^{${k}} - \\operatorname{tr}A^{${k}} + 1 = 2 - ${tr}$, so there are $|${2 - tr}| = ${cnt}$ such points.`, `$\\det(A^{${k}} - I) = \\det A^{${k}} - \\operatorname{tr}A^{${k}} + 1 = 2 - ${tr}$ なので、そのような点は $|${2 - tr}| = ${cnt}$ 個です。`], ['Periodic points grow like $\\lambda^k$, at the rate set by the Lyapunov exponent, and they are dense: chaos with a rich skeleton of cycles.', '周期点は $\\lambda^k$ のように、リャプノフ指数で決まる率で増え、しかも稠密です。カオスの中に周期軌道の豊かな骨組みがあるのです。']],
        };
      }
      const pick = r.int(0, 2);
      return {
        q: [['Which of the figure\'s three maps is ergodic but not mixing?', 'Which of the figure\'s maps has Lyapunov exponent $\\ln 2$?', 'For which of the figure\'s maps does the fraction of $D$ in $S$ keep jumping, never settling?'][pick], ['図の3つの写像のうち、エルゴード的だが混合的でないのはどれですか。', '図の写像のうち、リャプノフ指数が $\\ln 2$ なのはどれですか。', '図の写像のうち、S に入る D の割合が跳ね続けて落ち着かないのはどれですか。'][pick]],
        a: { type: 'choice', opts: [['The cat map', '猫写像'], ['The baker\'s map', 'パン屋の写像'], ['The irrational rotation of the torus', 'トーラスの無理数回転']], v: [2, 1, 2][pick], fixed: true },
        hint: ['A rotation moves sets rigidly; stretching is what spreads them.', '回転は集合を形を変えずに動かします。集合を広げるのは引き伸ばしです。'],
        sol: [pick === 1 ? ['The baker\'s map doubles horizontal distances at every step, so its exponent is $\\ln 2$; the cat map\'s is $\\ln\\varphi^2 \\approx 0.962$ and the rotation\'s is $0$.', 'パン屋の写像は毎歩横の距離を2倍にするので指数は $\\ln 2$ です。猫写像は $\\ln\\varphi^2 \\approx 0.962$、回転は $0$ です。'] : ['The rotation by $(\\alpha, \\beta)$ with $1, \\alpha, \\beta$ rationally independent is ergodic: almost every orbit is equidistributed.', '$1, \\alpha, \\beta$ が有理数上独立な $(\\alpha, \\beta)$ による回転はエルゴード的で、ほとんどすべての軌道が一様分布します。'], pick === 1 ? ['Both stretching maps are mixing; the rotation stretches nothing and is not.', '引き伸ばす2つの写像はどちらも混合的で、何も伸ばさない回転は混合的ではありません。'] : ['But it moves the disc rigidly: $\\mu(T^kD \\cap S)$ is 0 whenever the disc misses $S$, at arbitrarily late times, so it cannot converge to $\\mu(D)\\mu(S)$.', 'しかし円板を形を変えずに動かすだけなので、いくら後の時刻でも円板が $S$ を外れれば $\\mu(T^kD \\cap S) = 0$ となり、$\\mu(D)\\mu(S)$ には収束しません。']],
        set: { map: [2, 1, 2][pick], k: 20 },
      };
    },
  ];

  /* ---------------- 3. Birkhoff averages ---------------- */
  const benf = (d) => Math.log10(1 + 1 / d);
  const lead = (b, k) => Math.floor(10 ** fr(k * Math.log10(b)));
  Q['birkhoff-averages'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.int(1, 6), xp = p === 1 ? 'x_k' : `x_k^{${p}}`, xq = p === 1 ? 'x' : `x^{${p}}`;
        return {
          q: [`For almost every $x_0$, what does the time average $\\frac1N\\sum_{k<N} ${xp}$ along the doubling map $x \\mapsto 2x \\bmod 1$ converge to?`, `ほとんどすべての $x_0$ について、倍写像 $x \\mapsto 2x \\bmod 1$ に沿った時間平均 $\\frac1N\\sum_{k<N} ${xp}$ は何に収束しますか。`],
          a: { type: 'num', v: 1 / (p + 1), show: frac(1, p + 1) },
          hint: ['The doubling map preserves length and is ergodic.', '倍写像は長さを保ち、エルゴード的です。'],
          sol: [['By Birkhoff\'s theorem the time average equals the space average against the invariant measure, here plain length on $[0, 1)$.', 'バーコフの定理により、時間平均は不変測度に対する空間平均に等しく、ここでは $[0, 1)$ 上の普通の長さです。'], [`$\\int_0^1 ${xq}\\,dx = ${frac(1, p + 1)}$.`, `$\\int_0^1 ${xq}\\,dx = ${frac(1, p + 1)}$ です。`]],
          set: p === 2 ? { sys: 0, lgN: 5 } : undefined,
        };
      }
      if (form === 1) {
        const q = r.pick([3, 5, 7, 9, 11, 13, 15, 17]); let p; do { p = r.int(1, q - 1); } while (gcd(p, q) !== 1);
        let x = p, k = 0; do { x = (2 * x) % q; k++; } while (x !== p);
        return {
          q: [`Under the doubling map, the point $x_0 = ${frac(p, q)}$ is periodic. What is its period?`, `倍写像のもとで点 $x_0 = ${frac(p, q)}$ は周期的です。その周期はいくつですか。`],
          a: { type: 'int', v: k },
          hint: ['Track the numerators: $p \\mapsto 2p \\bmod q$.', '分子を追ってください：$p \\mapsto 2p \\bmod q$ です。'],
          sol: [[`The orbit is ${(() => { const o = []; let y = p; do { o.push(frac(y, q)); y = (2 * y) % q; } while (y !== p && o.length < 20); return '$' + o.join(' \\to ') + ' \\to ' + frac(p, q) + '$'; })()}.`, `軌道は ${(() => { const o = []; let y = p; do { o.push(frac(y, q)); y = (2 * y) % q; } while (y !== p && o.length < 20); return '$' + o.join(' \\to ') + ' \\to ' + frac(p, q) + '$'; })()} です。`], [`Period $${k}$: the order of 2 modulo ${q}. Such points are exceptions to Birkhoff's theorem, a set of measure zero: their time averages are averages over a finite cycle.`, `周期は $${k}$ で、${q} を法とした 2 の位数です。このような点はバーコフの定理の例外で、測度 0 の集合です。時間平均は有限の周期軌道上の平均になります。`]],
        };
      }
      const d = r.int(1, 9);
      return {
        q: [`By Benford's law, what fraction of the powers $2^n$ begin with the digit ${d}?`, `ベンフォードの法則によると、べき $2^n$ のうち数字 ${d} で始まるものの割合はいくつですか。`],
        a: { type: 'num', v: benf(d), tol: 6e-4, show: `\\log_{10}${frac(d + 1, d)}` },
        sol: [[`$2^n$ starts with ${d} when $n\\log_{10}2 \\bmod 1$ lies in $[\\log_{10}${d}, \\log_{10}${d + 1})$.`, `$2^n$ が ${d} で始まるのは、$n\\log_{10}2 \\bmod 1$ が $[\\log_{10}${d}, \\log_{10}${d + 1})$ に入るときです。`], [`That rotation is equidistributed, so the frequency is the interval's length $\\log_{10}(1 + 1/${d}) = ${n(benf(d), 4)}$.`, `この回転は一様分布するので、頻度は区間の長さ $\\log_{10}(1 + 1/${d}) = ${n(benf(d), 4)}$ です。`]],
        set: { sys: 2, lgN: 4 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(1, 4), C = [1, 2, 6, 20, 70][m], v = C / 4 ** m, xm = m === 1 ? 'x' : `x^{${m}}`;
        return {
          q: [`For the logistic map $x \\mapsto 4x(1 - x)$, find the space average $\\int ${xm}\\,d\\mu$ against its invariant density $\\dfrac{1}{\\pi\\sqrt{x(1 - x)}}$.`, `ロジスティック写像 $x \\mapsto 4x(1 - x)$ の不変密度 $\\dfrac{1}{\\pi\\sqrt{x(1 - x)}}$ に対する空間平均 $\\int ${xm}\\,d\\mu$ を求めてください。`],
          a: { type: 'num', v, show: frac(C, 4 ** m) },
          hint: ['Substitute $x = \\sin^2\\theta$; the density becomes $d\\theta/(\\pi/2)$ on $[0, \\pi/2]$.', '$x = \\sin^2\\theta$ と置換すると、密度は $[0, \\pi/2]$ 上の $d\\theta/(\\pi/2)$ になります。'],
          sol: [[`With $x = \\sin^2\\theta$: $\\int ${xm}\\,d\\mu = \\frac{2}{\\pi}\\int_0^{\\pi/2}\\sin^{${2 * m}}\\theta\\,d\\theta$.`, `$x = \\sin^2\\theta$ とおくと $\\int ${xm}\\,d\\mu = \\frac{2}{\\pi}\\int_0^{\\pi/2}\\sin^{${2 * m}}\\theta\\,d\\theta$ です。`], [`By Wallis this is $\\binom{${2 * m}}{${m}}/4^{${m}} = ${frac(C, 4 ** m)} = ${n(v, 5)}$.`, `ウォリスの公式により、これは $\\binom{${2 * m}}{${m}}/4^{${m}} = ${frac(C, 4 ** m)} = ${n(v, 5)}$ です。`], [`${m === 2 ? 'This is the 3/8 the figure\'s time averages approach.' : 'Time averages of $x^' + m + '$ along almost every orbit converge to it.'} It exceeds the uniform value $1/${m + 1}$ because orbits linger near the ends.`, `${m === 2 ? '図の時間平均が近づく 3/8 がこれです。' : 'ほとんどすべての軌道に沿った $x^' + m + '$ の時間平均はこれに収束します。'}軌道が両端の近くに長く留まるので、一様分布の値 $1/${m + 1}$ より大きくなります。`]],
          set: m === 2 ? { sys: 1, lgN: 5 } : undefined,
        };
      }
      if (form === 1) {
        const d1 = r.int(1, 8), d2 = r.int(d1, 9);
        const v = Math.log10((d2 + 1) / d1);
        return {
          q: [d1 === d2 ? `What fraction of the powers $3^n$ begin with the digit ${d1}?` : `What fraction of the powers $3^n$ begin with a digit from ${d1} to ${d2}?`, d1 === d2 ? `べき $3^n$ のうち数字 ${d1} で始まるものの割合はいくつですか。` : `べき $3^n$ のうち ${d1} から ${d2} までの数字で始まるものの割合はいくつですか。`],
          a: { type: 'num', v, tol: 6e-4, show: `\\log_{10}${frac(d2 + 1, d1)}` },
          hint: ['Add the Benford probabilities; the sum telescopes.', 'ベンフォードの確率を足すと、和は打ち消し合って簡単になります。'],
          sol: [[`$\\log_{10}3$ is irrational, so $n\\log_{10}3 \\bmod 1$ is equidistributed and Benford's law holds for $3^n$.`, `$\\log_{10}3$ は無理数なので $n\\log_{10}3 \\bmod 1$ は一様分布し、$3^n$ にもベンフォードの法則が成り立ちます。`], [`$\\sum_{d=${d1}}^{${d2}}\\log_{10}\\frac{d + 1}{d} = \\log_{10}\\frac{${d2 + 1}}{${d1}} = ${n(v, 4)}$.`, `$\\sum_{d=${d1}}^{${d2}}\\log_{10}\\frac{d + 1}{d} = \\log_{10}\\frac{${d2 + 1}}{${d1}} = ${n(v, 4)}$ です。`]],
          set: { sys: 2, lgN: 5 },
        };
      }
      const b = r.pick([2, 3, 7]), k = r.int(10, 80);
      const dd = lead(b, k);
      return {
        q: [`What is the leading digit of $${b}^{${k}}$? Use $\\log_{10}${b} \\approx ${n(Math.log10(b), 6)}$.`, `$${b}^{${k}}$ の最上位の数字は何ですか。$\\log_{10}${b} \\approx ${n(Math.log10(b), 6)}$ を使ってください。`],
        a: { type: 'int', v: dd },
        hint: ['Only the fractional part of $k\\log_{10}b$ matters.', '$k\\log_{10}b$ の小数部分だけが効きます。'],
        sol: [[`$${k}\\log_{10}${b} = ${n(k * Math.log10(b), 5)}$, with fractional part $${n(fr(k * Math.log10(b)), 5)}$.`, `$${k}\\log_{10}${b} = ${n(k * Math.log10(b), 5)}$ で、小数部分は $${n(fr(k * Math.log10(b)), 5)}$ です。`], [`$10^{${n(fr(k * Math.log10(b)), 5)}} = ${n(10 ** fr(k * Math.log10(b)), 4)}$, so $${b}^{${k}}$ starts with ${dd}.`, `$10^{${n(fr(k * Math.log10(b)), 5)}} = ${n(10 ** fr(k * Math.log10(b)), 4)}$ なので、$${b}^{${k}}$ は ${dd} で始まります。`], ['Each step adds $\\log_{10}' + b + '$ to the exponent: the leading digits are read off an irrational rotation of the circle.', '1歩ごとに指数に $\\log_{10}' + b + '$ が加わります。最上位の数字は円の無理数回転から読み取れるのです。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([2, 3, 7]), N = r.pick([50, 100, 200]), d = r.pick([1, 1, 2, 9]);
        let c = 0; for (let k = 1; k <= N; k++) if (lead(b, k) === d) c++;
        return {
          q: [`How many of $${b}^1, ${b}^2, \\dots, ${b}^{${N}}$ begin with the digit ${d}?`, `$${b}^1, ${b}^2, \\dots, ${b}^{${N}}$ のうち、数字 ${d} で始まるものはいくつありますか。`],
          a: { type: 'int', v: c },
          hint: ['Count $k$ with $k\\log_{10}' + b + ' \\bmod 1 \\in [\\log_{10}' + d + ', \\log_{10}' + (d + 1) + ')$. Benford predicts about $' + n(N * benf(d), 3) + '$.', '$k\\log_{10}' + b + ' \\bmod 1 \\in [\\log_{10}' + d + ', \\log_{10}' + (d + 1) + ')$ となる $k$ を数えます。ベンフォードの予測は約 $' + n(N * benf(d), 3) + '$ です。'],
          sol: [[`Count the $k \\le ${N}$ with $\\{k\\log_{10}${b}\\} \\in [${n(Math.log10(d), 4)}, ${n(Math.log10(d + 1), 4)})$: there are ${c}.`, `$\\{k\\log_{10}${b}\\} \\in [${n(Math.log10(d), 4)}, ${n(Math.log10(d + 1), 4)})$ となる $k \\le ${N}$ を数えると ${c} 個です。`], [`Benford predicts $${N}\\log_{10}(1 + 1/${d}) = ${n(N * benf(d), 3)}$. The error is at most a few, far below the $\\sqrt N$ of random digits, because an irrational rotation is much more regular than coin tossing.`, `ベンフォードの予測は $${N}\\log_{10}(1 + 1/${d}) = ${n(N * benf(d), 3)}$ です。誤差はせいぜい数個で、でたらめな数字の場合の $\\sqrt N$ よりずっと小さくなります。無理数回転は硬貨投げよりはるかに規則的だからです。`]],
          set: b === 2 && d === 1 && N >= 100 ? { sys: 2, lgN: N === 100 ? 2 : 2.3 } : undefined,
        };
      }
      if (form === 1) {
        const a = r.pick([[0.25, '\\tfrac14'], [0.5, '\\tfrac12'], [0.75, '\\tfrac34'], [0.1, '0.1'], [0.9, '0.9'], [(2 - Math.sqrt(2)) / 4, '\\tfrac{2 - \\sqrt2}{4}']]);
        const v = (2 / Math.PI) * Math.asin(Math.sqrt(a[0]));
        return {
          q: [`Along a typical orbit of the logistic map $x \\mapsto 4x(1 - x)$, what fraction of the time is $x_k < ${a[1]}$?`, `ロジスティック写像 $x \\mapsto 4x(1 - x)$ の典型的な軌道で、$x_k < ${a[1]}$ となっている時間の割合はいくつですか。`],
          a: { type: 'num', v, tol: 6e-4 },
          hint: ['Integrate the invariant density $1/(\\pi\\sqrt{x(1 - x)})$ from 0.', '不変密度 $1/(\\pi\\sqrt{x(1 - x)})$ を 0 から積分してください。'],
          sol: [['By Birkhoff\'s theorem applied to the indicator of $[0, a)$, the fraction of time equals $\\mu([0, a))$.', '$[0, a)$ の指示関数にバーコフの定理を当てはめると、時間の割合は $\\mu([0, a))$ に等しくなります。'], [`$\\mu([0, a)) = \\frac{2}{\\pi}\\arcsin\\sqrt a = ${n(v, 4)}$.`, `$\\mu([0, a)) = \\frac{2}{\\pi}\\arcsin\\sqrt a = ${n(v, 4)}$ です。`], [`Compare the length $${n(a[0], 4)}$: ${v > a[0] ? 'the orbit spends more time in this end interval than its length suggests' : 'the middle is visited less than its length suggests'}, as the histogram's U shape shows.`, `長さ $${n(a[0], 4)}$ と比べてください。ヒストグラムの U 字形が示すとおり、${v > a[0] ? '軌道はこの端の区間に長さ以上の時間を過ごします' : '中央部は長さほどは訪れられません'}。`]],
          set: { sys: 1, lgN: 5 },
        };
      }
      const k = r.int(2, 9), which = r.int(0, 1);
      const v = which ? `ln(${k})` : '1/(pi*sqrt(x*(1-x)))';
      if (which) {
        return {
          q: [`What is the Lyapunov exponent of $x \\mapsto ${k}x \\bmod 1$, the average of $\\ln|f'(x_k)|$ along a typical orbit?`, `$x \\mapsto ${k}x \\bmod 1$ のリャプノフ指数、すなわち典型的な軌道に沿った $\\ln|f'(x_k)|$ の平均はいくつですか。`],
          a: { type: 'num', v: Math.log(k), show: `\\ln ${k}` },
          sol: [[`$f'(x) = ${k}$ everywhere, so every term of the average is $\\ln ${k}$.`, `$f'(x) = ${k}$ がどこでも成り立つので、平均のすべての項が $\\ln ${k}$ です。`], [`The exponent is $\\ln ${k} \\approx ${n(Math.log(k), 4)}$: each step multiplies small errors by ${k}, and reveals one more base-${k} digit of $x_0$.`, `指数は $\\ln ${k} \\approx ${n(Math.log(k), 4)}$ です。1歩ごとに小さな誤差は ${k} 倍になり、$x_0$ の ${k} 進法の桁が1つずつ現れます。`]],
          set: k === 2 ? { sys: 0 } : undefined,
        };
      }
      return {
        q: ['For the logistic map $x \\mapsto 4x(1 - x)$ the long-run fraction of time spent in $[0, x]$ is $F(x) = \\frac{2}{\\pi}\\arcsin\\sqrt x$. Find the invariant density $\\rho(x)$.', 'ロジスティック写像 $x \\mapsto 4x(1 - x)$ で、$[0, x]$ で過ごす時間の長期的な割合は $F(x) = \\frac{2}{\\pi}\\arcsin\\sqrt x$ です。不変密度 $\\rho(x)$ を求めてください。'],
        a: { type: 'expr', v, vars: ['x'], dom: { x: [0.05, 0.95] }, lhs: ['$\\rho(x) =$', '$\\rho(x) =$'] },
        hint: ['Differentiate $F$; use the chain rule through $\\sqrt x$.', '$F$ を微分します。$\\sqrt x$ を通した連鎖律を使ってください。'],
        sol: [['$\\frac{d}{dx}\\arcsin\\sqrt x = \\frac{1}{\\sqrt{1 - x}}\\cdot\\frac{1}{2\\sqrt x}$.', '$\\frac{d}{dx}\\arcsin\\sqrt x = \\frac{1}{\\sqrt{1 - x}}\\cdot\\frac{1}{2\\sqrt x}$ です。'], ['So $\\rho = F\' = \\dfrac{1}{\\pi\\sqrt{x(1 - x)}}$, the orange curve in the figure.', 'よって $\\rho = F\' = \\dfrac{1}{\\pi\\sqrt{x(1 - x)}}$ で、図のオレンジの曲線です。'], ['It blows up at both ends but stays integrable: the map is flat near $x = \\tfrac12$, so points from there pile up near 1 and then near 0.', '両端で発散しますが積分は有限です。写像は $x = \\tfrac12$ の近くで平らなので、そこからの点は 1 の近くに、次いで 0 の近くに集まります。']],
        set: { sys: 1, lgN: 5 },
      };
    },
  ];
})();
