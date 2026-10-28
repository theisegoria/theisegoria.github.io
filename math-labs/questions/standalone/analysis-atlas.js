'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI;
  const YN = (en, ja) => [en, ja];

  /* ---------- 1. topology ---------- */
  const setName = (m) => (m === 0 ? '\\varnothing' : m === 7 ? 'X' : '\\{' + ['a', 'b', 'c'].filter((_, i) => m & (1 << i)).join(',') + '\\}');
  const pop = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1);
  const TOPS = [
    [0, 1, 3, 7], [0, 1, 2, 3, 4, 5, 6, 7], [0, 7], [0, 1, 6, 7], [0, 2, 7], [0, 1, 2, 3, 7], [0, 3, 7], [0, 1, 3, 5, 7],
  ];
  const tauTeX = (o) => `\\tau = \\{${o.map(setName).join(', ')}\\}`;
  const interior = (o, A) => o.filter((U) => (U & A) === U).reduce((v, U) => v | U, 0);
  const closure = (o, A) => o.map((U) => 7 ^ U).filter((F) => (F & A) === A).reduce((v, F) => v & F, 7);

  const SETS = [
    { t: '(a, b)', k: 0, why: ['every point has a small interval around it inside the set, but the endpoints are missing from it, so it is not closed', 'どの点のまわりにも集合に収まる小さな区間がありますが、端点を含まないので閉集合ではありません'] },
    { t: '[a, b]', k: 1, why: ['its complement $(-\\infty, a) \\cup (b, \\infty)$ is open, but the endpoints have no interval around them that fits inside', '補集合 $(-\\infty, a) \\cup (b, \\infty)$ が開集合なので閉集合ですが、端点のまわりには集合に収まる区間がありません'] },
    { t: '[a, b)', k: 3, why: ['the point $a$ has no neighborhood inside the set, and the complement is missing $b$, so neither condition holds', '点 $a$ のまわりに集合に収まる近傍がなく、補集合も $b$ のまわりが収まらないので、どちらでもありません'] },
    { t: '\\mathbb{R}', k: 2, why: ['the whole space and the empty set are always both open and closed', '全体空間と空集合は、いつでも開集合かつ閉集合です'] },
    { t: '\\mathbb{Z}', k: 1, why: ['its complement is a union of open intervals, so it is closed, but no interval around an integer fits inside $\\mathbb{Z}$', '補集合は開区間の和集合なので閉集合ですが、整数のまわりに $\\mathbb{Z}$ に収まる区間はありません'] },
    { t: '\\mathbb{Q}', k: 3, why: ['every interval contains both rationals and irrationals, so $\\mathbb{Q}$ has no interior and its complement has none either', 'どの区間にも有理数と無理数が両方含まれるので、$\\mathbb{Q}$ もその補集合も内点を持ちません'] },
    { t: '[a, \\infty)', k: 1, why: ['its complement $(-\\infty, a)$ is open; the point $a$ has no neighborhood inside the set', '補集合 $(-\\infty, a)$ が開集合なので閉集合です。点 $a$ のまわりに集合に収まる近傍はありません'] },
    { t: '(a, \\infty)', k: 0, why: ['every point has room around it inside the set, while $a$, a limit of its points, is not in it', 'どの点にも集合に収まる余地がありますが、集合の点の極限である $a$ は含まれません'] },
    { t: '\\varnothing', k: 2, why: ['the empty set and the whole space are always both open and closed', '空集合と全体空間は、いつでも開集合かつ閉集合です'] },
  ];
  const OPTS_OC = [YN('Open but not closed', '開集合だが閉集合ではない'), YN('Closed but not open', '閉集合だが開集合ではない'), YN('Both open and closed', '開集合かつ閉集合'), YN('Neither open nor closed', 'どちらでもない')];

  Q['analysis-atlas-topology'] = [
    (r) => {
      if (r.chance(0.5)) {
        const s = r.pick(SETS);
        return {
          q: [`In $\\mathbb{R}$ with its usual topology, classify the set $${s.t}$ (take $a < b$).`, `通常の位相を持つ $\\mathbb{R}$ で、集合 $${s.t}$ を分類してください（$a < b$ とします）。`],
          a: { type: 'choice', opts: OPTS_OC, v: s.k, fixed: true },
          hint: ['Ask two questions: does every point have room around it inside the set, and is the complement open?', '二つを確かめます。どの点にも集合に収まる余地があるか、補集合は開集合か。'],
          sol: [[`The set $${s.t}$: ${s.why[0]}.`, `集合 $${s.t}$ については、${s.why[1]}。`], ['Open means every point has a neighborhood inside; closed means the complement is open. The two properties are independent.', '開集合とは各点に集合内の近傍があること、閉集合とは補集合が開集合であることです。この二つは独立した性質です。']],
        };
      }
      const a = r.int(-3, 2), b = a + r.int(2, 5), x = a + r.int(1, b - a - 1) + r.pick([0, 0.5]);
      const rr = Math.min(x - a, b - x);
      return {
        q: [`The set is $(${a}, ${b})$ and the point is $x = ${n(x)}$. What is the largest $r$ for which the interval $(x - r, x + r)$ stays inside the set?`, `集合は $(${a}, ${b})$、点は $x = ${n(x)}$ です。区間 $(x - r, x + r)$ が集合に収まる最大の $r$ を求めてください。`],
        a: { type: 'num', v: rr },
        hint: ['The neighborhood is stopped by the nearer endpoint.', '近いほうの端点で近傍の大きさが決まります。'],
        sol: [[`The distances to the endpoints are $${n(x)} - ${sg(a)} = ${n(x - a)}$ and $${b} - ${sg(x)} = ${n(b - x)}$.`, `端点までの距離は $${n(x)} - ${sg(a)} = ${n(x - a)}$ と $${b} - ${sg(x)} = ${n(b - x)}$ です。`], [`The largest radius is the smaller one, $r = ${n(rr)}$.`, `最大の半径は小さいほうの $r = ${n(rr)}$ です。`], ['This is the quantity $\\min(x - a, b - x)$ that the first experiment compares with the slider $r$.', 'これが最初の実験でスライダー $r$ と比べている量 $\\min(x - a, b - x)$ です。']],
      };
    },
    (r) => {
      const o = r.pick(TOPS), A = r.int(1, 6), form = r.int(0, 2);
      const I = interior(o, A), C = closure(o, A), B = C & ~I;
      const base = [`Take $X = \\{a, b, c\\}$ with the topology $${tauTeX(o)}$ and the subset $A = ${setName(A)}$. `, `$X = \\{a, b, c\\}$ に位相 $${tauTeX(o)}$ を与え、部分集合 $A = ${setName(A)}$ を考えます。`];
      const inside = o.filter((U) => (U & A) === U);
      const closedSets = o.map((U) => 7 ^ U);
      const common = [[`The open sets contained in $A$ are $${inside.map(setName).join(', ')}$, and their union is $\\operatorname{int} A = ${setName(I)}$.`, `$A$ に含まれる開集合は $${inside.map(setName).join(', ')}$ で、その和集合が内部 $\\operatorname{int} A = ${setName(I)}$ です。`], [`The closed sets (complements of open sets) are $${closedSets.map(setName).join(', ')}$; those containing $A$ intersect to $\\overline{A} = ${setName(C)}$.`, `閉集合（開集合の補集合）は $${closedSets.map(setName).join(', ')}$ で、$A$ を含むものの共通部分が閉包 $\\overline{A} = ${setName(C)}$ です。`]];
      if (form === 0) return { q: [base[0] + 'How many points does the interior of $A$ have?', base[1] + '$A$ の内部には何個の点がありますか。'], a: { type: 'int', v: pop(I) }, hint: ['The interior is the largest open set inside $A$: the union of every open set contained in $A$.', '内部は $A$ に含まれる最大の開集合、つまり $A$ に含まれる開集合すべての和集合です。'], sol: [common[0], [`So the interior has ${pop(I)} point${pop(I) === 1 ? '' : 's'}; an empty interior means no open set fits in $A$.`, `したがって内部の点は ${pop(I)} 個です。内部が空なら、$A$ に収まる開集合がないことを意味します。`]] };
      if (form === 1) return { q: [base[0] + 'How many points does the closure of $A$ have?', base[1] + '$A$ の閉包には何個の点がありますか。'], a: { type: 'int', v: pop(C) }, hint: ['The closure is the smallest closed set containing $A$; closed sets are complements of open sets.', '閉包は $A$ を含む最小の閉集合です。閉集合は開集合の補集合です。'], sol: [common[1], [`So the closure has ${pop(C)} point${pop(C) === 1 ? '' : 's'}; a point outside $A$ can still belong to it.`, `したがって閉包の点は ${pop(C)} 個です。$A$ に属さない点が閉包に入ることもあります。`]] };
      return { q: [base[0] + 'How many points does the boundary $\\partial A$ have?', base[1] + '境界 $\\partial A$ には何個の点がありますか。'], a: { type: 'int', v: pop(B) }, hint: ['The boundary is the closure minus the interior.', '境界は閉包から内部を除いた集合です。'], sol: [...common, [`$\\partial A = ${setName(C)} \\setminus ${setName(I)} = ${setName(B)}$, which has ${pop(B)} point${pop(B) === 1 ? '' : 's'}.`, `$\\partial A = ${setName(C)} \\setminus ${setName(I)} = ${setName(B)}$ で、点は ${pop(B)} 個です。`]] };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const o = r.pick(TOPS), cl = o.filter((U) => o.includes(7 ^ U));
        return {
          q: [`On $X = \\{a, b, c\\}$ the topology is $${tauTeX(o)}$. How many subsets of $X$ are both open and closed?`, `$X = \\{a, b, c\\}$ の位相は $${tauTeX(o)}$ です。開集合かつ閉集合である部分集合は何個ありますか。`],
          a: { type: 'int', v: cl.length },
          hint: ['A set is closed exactly when its complement is open, so test each open set.', '補集合が開集合であるとき、その集合は閉集合です。開集合を一つずつ調べます。'],
          sol: [[`An open set $U$ is also closed exactly when $X \\setminus U$ is open. Checking each: the clopen sets are $${cl.map(setName).join(', ')}$.`, `開集合 $U$ が閉集合でもあるのは、$X \\setminus U$ が開集合のときです。調べると、開かつ閉な集合は $${cl.map(setName).join(', ')}$ です。`], [`That is ${cl.length}. If only $\\varnothing$ and $X$ appear, the space is connected; more clopen sets mean it splits into separated pieces.`, `つまり ${cl.length} 個です。$\\varnothing$ と $X$ だけなら空間は連結で、それ以外にもあれば空間は分離した部分に分かれます。`]],
        };
      }
      if (form === 1) {
        const o = r.pick(TOPS);
        return {
          q: [`Let $S = \\{0, 1\\}$ carry the Sierpinski topology, whose open sets are $\\varnothing$, $\\{1\\}$ and $S$. How many continuous maps are there from $(X, \\tau)$ to $S$, where $X = \\{a, b, c\\}$ and $${tauTeX(o)}$?`, `$S = \\{0, 1\\}$ にシェルピンスキー位相（開集合は $\\varnothing$、$\\{1\\}$、$S$）を与えます。$X = \\{a, b, c\\}$、$${tauTeX(o)}$ から $S$ への連続写像は何個ありますか。`],
          a: { type: 'int', v: o.length },
          hint: ['Continuity only asks that the preimage of the one nonempty proper open set $\\{1\\}$ be open in $X$.', '連続であるためには、$S$ の自明でない開集合 $\\{1\\}$ の逆像が $X$ で開いていればよいのです。'],
          sol: [['A map $f: X \\to S$ is continuous exactly when $f^{-1}(\\{1\\})$ is open in $X$ (the preimages of $\\varnothing$ and $S$ are automatically open).', '写像 $f: X \\to S$ が連続であるのは $f^{-1}(\\{1\\})$ が $X$ で開いているときです（$\\varnothing$ と $S$ の逆像は自動的に開集合です）。'], [`Each open set $U$ gives exactly one such map, the indicator of $U$, so the count equals the number of open sets, ${o.length}.`, `各開集合 $U$ に対して指示関数がちょうど一つ対応するので、個数は開集合の数 ${o.length} と一致します。`], ['Open sets of $X$ are the same thing as continuous maps into the Sierpinski space.', '$X$ の開集合は、シェルピンスキー空間への連続写像と同じものです。']],
        };
      }
      const a = r.int(-4, 0), b = a + r.int(2, 5), c = b + r.int(2, 4);
      const items = [
        { t: `[${a}, ${b}]`, k: 0, w: ['it is closed and bounded', '閉かつ有界です'] },
        { t: `[${a}, ${b}] \\cup \\{${c}\\}`, k: 0, w: ['a closed bounded set with one extra point is still closed and bounded', '閉かつ有界な集合に一点を加えても、閉かつ有界です'] },
        { t: `(${a}, ${b}]`, k: 1, w: ['it is not closed, because the endpoint it approaches is missing', '近づく端点を含まないので閉集合ではありません'] },
        { t: `[${a}, \\infty)`, k: 1, w: ['it is closed but not bounded', '閉集合ですが有界ではありません'] },
        { t: `\\mathbb{Q} \\cap [${a}, ${b}]`, k: 1, w: ['it is bounded but not closed, because irrational limits are missing', '有界ですが、無理数の極限を含まないので閉集合ではありません'] },
        { t: '\\mathbb{Z}', k: 1, w: ['it is closed but not bounded', '閉集合ですが有界ではありません'] },
      ];
      const it = r.pick(items);
      return {
        q: [`Is the set $${it.t}$ compact as a subset of $\\mathbb{R}$?`, `集合 $${it.t}$ は $\\mathbb{R}$ の部分集合としてコンパクトですか。`],
        a: { type: 'choice', opts: [YN('Yes', 'はい'), YN('No', 'いいえ')], v: it.k, fixed: true },
        hint: ['In $\\mathbb{R}^n$, compact means closed and bounded.', '$\\mathbb{R}^n$ では、コンパクトは閉かつ有界と同値です。'],
        sol: [[`By Heine-Borel, a subset of $\\mathbb{R}$ is compact exactly when it is closed and bounded. Here ${it.w[0]}.`, `ハイネ・ボレルの定理により、$\\mathbb{R}$ の部分集合がコンパクトであることは閉かつ有界であることと同値です。この集合は、${it.w[1]}。`], ['Compactness is really about every open cover having a finite subcover; closed and bounded is its description in Euclidean space only.', 'コンパクト性の本質は「どの開被覆にも有限部分被覆がある」ことです。閉かつ有界という言い換えはユークリッド空間でのみ成り立ちます。']],
      };
    },
  ];

  /* ---------- 2. metric spaces ---------- */
  const NORM = { 1: (x, y) => Math.abs(x) + Math.abs(y), 2: (x, y) => Math.hypot(x, y), inf: (x, y) => Math.max(Math.abs(x), Math.abs(y)) };
  const PNAME = { 1: ['taxicab ($\\ell^1$)', 'マンハッタン距離（$\\ell^1$）'], 2: ['Euclidean ($\\ell^2$)', 'ユークリッド距離（$\\ell^2$）'], inf: ['maximum ($\\ell^\\infty$)', '最大値距離（$\\ell^\\infty$）'] };
  const PFORM = { 1: '|x| + |y|', 2: '\\sqrt{x^2 + y^2}', inf: '\\max(|x|, |y|)' };

  Q['analysis-atlas-metric'] = [
    (r) => {
      const p = r.pick([1, 2, 'inf']);
      if (r.chance(0.5)) {
        const [dx, dy] = p === 2 ? r.pick([[3, 4], [6, 8], [5, 12], [8, 15], [4, 3]]) : [r.int(1, 7), r.int(1, 7)];
        const x1 = r.int(-3, 3), y1 = r.int(-3, 3), sx = r.sign(), sy = r.sign();
        const x2 = x1 + sx * dx, y2 = y1 + sy * dy, d = NORM[p](dx, dy);
        return {
          q: [`Use the ${PNAME[p][0]} distance in the plane. How far apart are $(${x1}, ${y1})$ and $(${x2}, ${y2})$?`, `平面で${PNAME[p][1]}を使います。$(${x1}, ${y1})$ と $(${x2}, ${y2})$ の距離はいくらですか。`],
          a: { type: 'num', v: d },
          hint: [`Subtract coordinates first: the distance is $${PFORM[p]}$ applied to the differences.`, `まず座標の差を取り、その差に $${PFORM[p]}$ を適用します。`],
          sol: [[`The differences are $${n(x2 - x1)}$ and $${n(y2 - y1)}$.`, `差は $${n(x2 - x1)}$ と $${n(y2 - y1)}$ です。`], [`With $${PFORM[p]}$ the distance is $${n(d)}$.`, `$${PFORM[p]}$ を適用すると距離は $${n(d)}$ です。`], ['The same two points are at different distances in different metrics, which is why the three balls in the first experiment have different shapes.', '同じ二点でも距離の入れ方で値が変わります。実験で三つの球の形が違うのはそのためです。']],
        };
      }
      const R = r.pick([1, 2, 3, 4, 5, 6]);
      const area = p === 1 ? 2 * R * R : p === 2 ? PI * R * R : 4 * R * R;
      const shape = p === 1 ? ['a diamond with vertices at distance $R$ on the axes', '軸上の距離 $R$ に頂点をもつひし形'] : p === 2 ? ['a disc of radius $R$', '半径 $R$ の円板'] : ['an axis-aligned square of side $2R$', '一辺 $2R$ の軸に平行な正方形'];
      return {
        q: [`What is the area of the open ball of radius $${R}$ about the origin in the ${PNAME[p][0]} metric?`, `${PNAME[p][1]}で、原点を中心とする半径 $${R}$ の開球の面積はいくらですか。`],
        a: { type: 'num', v: area, show: p === 2 ? `${R * R}\\pi` : undefined },
        hint: ['Sketch the set of points at distance less than $R$ from the origin.', '原点からの距離が $R$ 未満の点の集合を描いてみてください。'],
        sol: [[`The ball is ${shape[0]}.`, `この球は${shape[1]}です。`], [`Its area is $${p === 1 ? '2R^2' : p === 2 ? '\\pi R^2' : '4R^2'} = ${p === 2 ? `${R * R}\\pi \\approx ${n(area)}` : n(area)}$.`, `面積は $${p === 1 ? '2R^2' : p === 2 ? '\\pi R^2' : '4R^2'} = ${p === 2 ? `${R * R}\\pi \\approx ${n(area)}` : n(area)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([1, 2, 'inf']), Rr = r.pick([1, 1.5, 2, 2.5, 5]);
        let x, y;
        if (p === 2) [x, y] = r.pick([[3, 4], [0.6, 0.8], [1.5, 2], [1, 1], [0.5, 0.5], [2, 1], [1.2, 0.9]]);
        else { x = r.step(-3, 3, 0.5); y = r.step(-3, 3, 0.5); }
        const d = NORM[p](x, y), eps = 1e-9, k = d < Rr - eps ? 0 : Math.abs(d - Rr) < eps ? 1 : 2;
        return {
          q: [`In the ${PNAME[p][0]} metric, where is the point $q = (${n(x)}, ${n(y)})$ relative to the open ball of radius $${n(Rr)}$ centered at the origin?`, `${PNAME[p][1]}で、点 $q = (${n(x)}, ${n(y)})$ は原点を中心とする半径 $${n(Rr)}$ の開球に対してどこにありますか。`],
          a: { type: 'choice', opts: [YN('Inside the ball', '球の内部'), YN('On the boundary, so not in the open ball', '境界上で、開球には含まれない'), YN('Outside the ball', '球の外部')], v: k, fixed: true },
          hint: ['Compute $d(0, q)$ and compare it with the radius; an open ball uses a strict inequality.', '$d(0, q)$ を求めて半径と比べます。開球では不等号は厳密です。'],
          sol: [[`Evaluating $${PFORM[p]}$ at the point gives $d(0, q) = ${n(d, 4)}$.`, `点で $${PFORM[p]}$ を計算すると $d(0, q) = ${n(d, 4)}$ です。`], [`Compare with $r = ${n(Rr)}$: ${k === 0 ? 'the distance is smaller' : k === 1 ? 'the distance equals the radius' : 'the distance is larger'}.`, `$r = ${n(Rr)}$ と比べると、距離は${k === 0 ? '半径より小さい' : k === 1 ? '半径と等しい' : '半径より大きい'}です。`], ['Boundary points are the ones an open ball leaves out; that is exactly the difference between open and closed balls.', '開球が除外するのが境界上の点で、これが開球と閉球の違いです。']],
        };
      }
      if (form === 1) {
        const a = r.int(2, 9), b = r.int(1, a - 1), big = r.chance(0.5);
        return {
          q: [`In a metric space, $d(x, y) = ${a}$ and $d(y, z) = ${b}$. What is the ${big ? 'largest' : 'smallest'} possible value of $d(x, z)$?`, `距離空間で $d(x, y) = ${a}$、$d(y, z) = ${b}$ です。$d(x, z)$ がとりうる${big ? '最大' : '最小'}の値はいくらですか。`],
          a: { type: 'int', v: big ? a + b : a - b },
          hint: [big ? 'Apply the triangle inequality to the route $x \\to y \\to z$.' : 'Apply the triangle inequality to $d(x, y) \\le d(x, z) + d(z, y)$.', big ? '経路 $x \\to y \\to z$ に三角不等式を使います。' : '$d(x, y) \\le d(x, z) + d(z, y)$ に三角不等式を使います。'],
          sol: [big ? [`$d(x, z) \\le d(x, y) + d(y, z) = ${a} + ${b} = ${a + b}$.`, `$d(x, z) \\le d(x, y) + d(y, z) = ${a} + ${b} = ${a + b}$ です。`] : [`$${a} = d(x, y) \\le d(x, z) + d(z, y) = d(x, z) + ${b}$, so $d(x, z) \\ge ${a - b}$.`, `$${a} = d(x, y) \\le d(x, z) + d(z, y) = d(x, z) + ${b}$ より $d(x, z) \\ge ${a - b}$ です。`], [`Both bounds are reached on a line, so the ${big ? 'maximum' : 'minimum'} is ${big ? a + b : a - b}.`, `どちらの境界も数直線上で達成されるので、${big ? '最大' : '最小'}は ${big ? a + b : a - b} です。`]],
        };
      }
      const m = r.pick([5, 8, 10, 12, 15, 20, 25]), N = Math.ceil(100 / m);
      return {
        q: [`The sequence is $x_k = 1/k$ in $\\mathbb{R}$. What is the smallest $N$ such that $|x_i - x_j| < ${n(m / 100)}$ for all $i, j \\ge N$?`, `数列 $x_k = 1/k$ を $\\mathbb{R}$ で考えます。すべての $i, j \\ge N$ に対して $|x_i - x_j| < ${n(m / 100)}$ となる最小の $N$ を求めてください。`],
        a: { type: 'int', v: N },
        hint: ['Over the tail $k \\ge N$ the largest gap approaches $1/N$ but never reaches it.', '$k \\ge N$ の範囲で最大のずれは $1/N$ に近づきますが、$1/N$ には届きません。'],
        sol: [['For $i, j \\ge N$ we have $|1/i - 1/j| < 1/N$, and the gap gets arbitrarily close to $1/N$ (take $j \\to \\infty$).', '$i, j \\ge N$ では $|1/i - 1/j| < 1/N$ で、$j \\to \\infty$ とすると $1/N$ にいくらでも近づきます。'], [`So the condition holds exactly when $1/N \\le ${n(m / 100)}$, that is $N \\ge ${n(100 / m)}$, and the smallest such integer is $${N}$.`, `したがって条件が成り立つのは $1/N \\le ${n(m / 100)}$、つまり $N \\ge ${n(100 / m)}$ のときで、最小の整数は $${N}$ です。`], ['This is the Cauchy property, checked with an explicit $\\varepsilon$ and without ever naming the limit.', 'これは極限を持ち出さずに、具体的な $\\varepsilon$ でコーシー性を確かめたことになります。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const comp = [['$\\mathbb{R}$', '$\\mathbb{R}$'], ['$[0, 1]$', '$[0, 1]$'], ['$\\mathbb{R}^2$', '$\\mathbb{R}^2$'], ['$\\mathbb{Z}$', '$\\mathbb{Z}$'], ['$[2, \\infty)$', '$[2, \\infty)$']];
        const inc = [{ s: ['$\\mathbb{Q}$', '$\\mathbb{Q}$'], w: ['decimal approximations of $\\sqrt{2}$ are Cauchy in $\\mathbb{Q}$ but the limit is irrational', '$\\sqrt{2}$ の小数近似は $\\mathbb{Q}$ でコーシー列ですが、極限は無理数です'] }, { s: ['$(0, 1]$', '$(0, 1]$'], w: ['$1/k$ is Cauchy but its limit $0$ is missing', '$1/k$ はコーシー列ですが、極限 $0$ が欠けています'] }, { s: ['$(0, \\infty)$', '$(0, \\infty)$'], w: ['$1/k$ is Cauchy but its limit $0$ is missing', '$1/k$ はコーシー列ですが、極限 $0$ が欠けています'] }, { s: ['the open unit disc $\\{|z| < 1\\}$', '開単位円板 $\\{|z| < 1\\}$'], w: ['$1 - 1/k$ is Cauchy but its limit $1$ is outside the disc', '$1 - 1/k$ はコーシー列ですが、極限 $1$ は円板の外にあります'] }];
        const bad = r.pick(inc), good = r.sample(comp, 3), opts = r.shuffle([bad.s, ...good]);
        return {
          q: ['Each space has the usual distance. Which one is not complete?', 'どの空間も通常の距離を持ちます。完備でないのはどれですか。'],
          a: { type: 'choice', opts, v: opts.indexOf(bad.s), fixed: true },
          hint: ['A complete space has no missing limits: look for a Cauchy sequence that converges to a point that is not in the space.', '完備な空間には欠けた極限がありません。空間に属さない点へ向かうコーシー列を探します。'],
          sol: [[`${bad.s[0]} is not complete: ${bad.w[0]}.`, `${bad.s[1]}は完備ではありません。${bad.w[1]}。`], ['The others are closed subsets of a complete space (or the space itself), so every Cauchy sequence in them has its limit inside.', '残りは完備な空間そのもの、またはその閉部分集合なので、どのコーシー列の極限も空間内にあります。'], ['Completeness is a property of the space, not of the sequence: the same sequence can converge in one space and merely be Cauchy in another.', '完備性は数列ではなく空間の性質です。同じ数列でも、ある空間では収束し、別の空間ではコーシー列にとどまります。']],
        };
      }
      const ρ = r.pick([1, 2, 3, 4, 5]);
      const forms = [
        { q: [`What is the radius of the smallest Euclidean ($\\ell^2$) ball centered at the origin that contains the whole maximum-metric ($\\ell^\\infty$) ball of radius $${ρ}$?`, `原点を中心とする最小のユークリッド（$\\ell^2$）球で、半径 $${ρ}$ の最大値距離（$\\ell^\\infty$）球全体を含むものの半径はいくらですか。`], v: ρ * Math.SQRT2, show: `${ρ === 1 ? '' : ρ}\\sqrt{2}`, s: [`The $\\ell^\\infty$ ball is the square $|x|, |y| < ${ρ}$. Its farthest points are the corners, at Euclidean distance $\\sqrt{${ρ}^2 + ${ρ}^2} = ${ρ}\\sqrt{2}$.`, `$\\ell^\\infty$ 球は正方形 $|x|, |y| < ${ρ}$ で、最も遠い点は角です。その距離は $\\sqrt{${ρ}^2 + ${ρ}^2} = ${ρ}\\sqrt{2}$ です。`] },
        { q: [`What is the radius of the largest Euclidean ($\\ell^2$) ball centered at the origin that fits inside the taxicab ($\\ell^1$) ball of radius $${ρ}$?`, `原点を中心とする最大のユークリッド（$\\ell^2$）球で、半径 $${ρ}$ のマンハッタン距離（$\\ell^1$）球に収まるものの半径はいくらですか。`], v: ρ / Math.SQRT2, show: `\\dfrac{${ρ}}{\\sqrt{2}}`, s: [`The diamond $|x| + |y| < ${ρ}$ is closest to the origin along its edges, at the points $(${ρ}/2, ${ρ}/2)$, whose Euclidean distance is $${ρ}/\\sqrt{2}$.`, `ひし形 $|x| + |y| < ${ρ}$ は辺の中点 $(${ρ}/2, ${ρ}/2)$ で原点に最も近く、そのユークリッド距離は $${ρ}/\\sqrt{2}$ です。`] },
        { q: [`What is the radius of the smallest taxicab ($\\ell^1$) ball centered at the origin that contains the Euclidean ($\\ell^2$) ball of radius $${ρ}$?`, `原点を中心とする最小のマンハッタン距離（$\\ell^1$）球で、半径 $${ρ}$ のユークリッド（$\\ell^2$）球を含むものの半径はいくらですか。`], v: ρ * Math.SQRT2, show: `${ρ === 1 ? '' : ρ}\\sqrt{2}`, s: [`On the circle of radius $${ρ}$ the quantity $|x| + |y|$ is largest at $(${ρ}/\\sqrt{2}, ${ρ}/\\sqrt{2})$, where it equals $${ρ}\\sqrt{2}$.`, `半径 $${ρ}$ の円周上で $|x| + |y|$ が最大になるのは $(${ρ}/\\sqrt{2}, ${ρ}/\\sqrt{2})$ で、値は $${ρ}\\sqrt{2}$ です。`] },
      ];
      const f = r.pick(forms);
      return {
        q: f.q, a: { type: 'num', v: f.v, show: f.show },
        hint: ['Draw both shapes and find the point of one that is farthest from (or nearest to) the origin.', '二つの図形を描き、原点から最も遠い（近い）点を探します。'],
        sol: [f.s, ['Balls of different metrics nest inside one another with constant factors, which is why the three metrics define the same open sets.', '異なる距離の球は定数倍の範囲で互いに入れ子になります。三つの距離が同じ開集合を定めるのはそのためです。']],
      };
    },
  ];

  /* ---------- 3. real analysis ---------- */
  Q['analysis-atlas-real'] = [
    (r) => {
      if (r.chance(0.5)) {
        const a = r.pick([0.5, 1, 1.5, 2, -1, -2, 3]), d = r.pick([0.1, 0.2, 0.3, 0.5, 1]);
        const v = 2 * Math.abs(a) * d + d * d;
        return {
          q: [`For $f(x) = x^2$ near $a = ${n(a)}$, what is the largest value of $|x^2 - a^2|$ when $|x - a| < \\delta = ${n(d)}$? (The supremum.)`, `$f(x) = x^2$ を $a = ${n(a)}$ の近くで考えます。$|x - a| < \\delta = ${n(d)}$ のとき $|x^2 - a^2|$ がとりうる最大値（上限）はいくらですか。`],
          a: { type: 'num', v, tol: 1e-4 },
          hint: ['Factor: $x^2 - a^2 = (x - a)(x + a)$, and the worst case is at the end of the interval farthest from zero.', '$x^2 - a^2 = (x - a)(x + a)$ と因数分解します。最悪なのは、0 から遠い側の区間の端です。'],
          sol: [[`$|x^2 - a^2| = |x - a|\\,|x + a|$ is largest when $x = a \\pm \\delta$ on the side away from zero.`, `$|x^2 - a^2| = |x - a|\\,|x + a|$ は、0 から遠い側の $x = a \\pm \\delta$ で最大になります。`], [`The supremum is $2|a|\\delta + \\delta^2 = 2(${n(Math.abs(a))})(${n(d)}) + ${n(d * d)} = ${n(v)}$.`, `上限は $2|a|\\delta + \\delta^2 = 2(${n(Math.abs(a))})(${n(d)}) + ${n(d * d)} = ${n(v)}$ です。`], ['The $\\varepsilon$-$\\delta$ promise holds exactly when this number is at most $\\varepsilon$.', '$\\varepsilon$-$\\delta$ の約束が成り立つのは、この値が $\\varepsilon$ 以下のときです。']],
        };
      }
      const m = r.pick([2, 3, 4, 5, -2, -4, 0.5]), c = r.int(-3, 3), e = r.pick([0.1, 0.2, 0.5, 1, 2]);
      return {
        q: [`For $f(x) = ${lin(m, c)}$, what is the largest $\\delta$ such that $|x - a| < \\delta$ forces $|f(x) - f(a)| < \\varepsilon$ when $\\varepsilon = ${n(e)}$?`, `$f(x) = ${lin(m, c)}$ について、$\\varepsilon = ${n(e)}$ のとき $|x - a| < \\delta$ ならば $|f(x) - f(a)| < \\varepsilon$ となる最大の $\\delta$ を求めてください。`],
        a: { type: 'num', v: e / Math.abs(m) },
        hint: ['For a line, $|f(x) - f(a)| = |m|\\,|x - a|$.', '直線では $|f(x) - f(a)| = |m|\\,|x - a|$ です。'],
        sol: [[`$|f(x) - f(a)| = ${n(Math.abs(m))}\\,|x - a|$, which is below $${n(e)}$ exactly when $|x - a| < ${n(e)}/${n(Math.abs(m))}$.`, `$|f(x) - f(a)| = ${n(Math.abs(m))}\\,|x - a|$ は、$|x - a| < ${n(e)}/${n(Math.abs(m))}$ のときちょうど $${n(e)}$ 未満になります。`], [`So $\\delta = ${n(e / Math.abs(m))}$, independent of $a$.`, `したがって $\\delta = ${n(e / Math.abs(m))}$ で、$a$ によりません。`], ['A steeper line needs a smaller $\\delta$; the same $\\delta$ works everywhere, which is uniform continuity.', '傾きが急なほど $\\delta$ は小さくなります。どの点でも同じ $\\delta$ で済むのが一様連続性です。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const b = r.pick([0.5, 0.6, 0.8, 1, 1.5, 2]), N = r.int(2, 12);
        return {
          q: [`Let $f_n(x) = x/n$ on $[0, ${n(b)}]$. What is $\\sup_x |f_n(x) - 0|$ for $n = ${N}$? Give four decimals.`, `$[0, ${n(b)}]$ 上で $f_n(x) = x/n$ とします。$n = ${N}$ のときの $\\sup_x |f_n(x) - 0|$ を小数第4位まで求めてください。`],
          a: { type: 'num', v: b / N, tol: 6e-5 },
          hint: ['The function is increasing, so the supremum is at the right endpoint.', '関数は増加するので、上限は右端でとられます。'],
          sol: [[`The pointwise limit is $f = 0$. On $[0, ${n(b)}]$ the largest value of $x/n$ is at $x = ${n(b)}$.`, `各点での極限は $f = 0$ です。$[0, ${n(b)}]$ で $x/n$ が最大になるのは $x = ${n(b)}$ のときです。`], [`So $\\|f_n - f\\|_\\infty = ${n(b)}/${N} = ${n(b / N, 4)}$.`, `したがって $\\|f_n - f\\|_\\infty = ${n(b)}/${N} = ${n(b / N, 4)}$ です。`], ['This tends to 0 as $n \\to \\infty$, so the convergence is uniform on this interval.', 'これは $n \\to \\infty$ で 0 に収束するので、この区間では一様収束です。']],
        };
      }
      const b = r.pick([0.5, 0.6, 0.7, 0.8, 0.9]), eps = r.pick([0.1, 0.05, 0.01, 0.001]);
      let N = 1; while (b ** N >= eps) N++;
      return {
        q: [`For $f_n(x) = x^n$ on $[0, ${n(b)}]$, find the smallest $n$ with $\\sup_x |f_n(x)| < ${n(eps)}$.`, `$[0, ${n(b)}]$ 上の $f_n(x) = x^n$ について、$\\sup_x |f_n(x)| < ${n(eps)}$ となる最小の $n$ を求めてください。`],
        a: { type: 'int', v: N },
        hint: ['The supremum of $x^n$ on $[0, b]$ is $b^n$, at the right endpoint.', '$[0, b]$ での $x^n$ の上限は、右端での値 $b^n$ です。'],
        sol: [[`$\\sup_{[0, ${n(b)}]} x^n = ${n(b)}^n$.`, `$[0, ${n(b)}]$ での $x^n$ の上限は $${n(b)}^n$ です。`], [`$${n(b)}^{${N - 1}} = ${n(b ** (N - 1), 4)} \\ge ${n(eps)}$ while $${n(b)}^{${N}} = ${n(b ** N, 4)} < ${n(eps)}$, so $n = ${N}$.`, `$${n(b)}^{${N - 1}} = ${n(b ** (N - 1), 4)} \\ge ${n(eps)}$、$${n(b)}^{${N}} = ${n(b ** N, 4)} < ${n(eps)}$ なので $n = ${N}$ です。`], ['A single $n$ works for every $x$ in the interval at once, which is what uniform convergence means.', '区間のすべての $x$ に対して同じ $n$ が使えます。これが一様収束の意味です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3, 0.5, 4]);
        return {
          q: [`For $f(x) = x^2$ at the point $a = ${n(a)}$, write the largest admissible $\\delta$ as a function of $t = \\varepsilon$, so that $|x - a| < \\delta$ implies $|x^2 - a^2| < t$.`, `$f(x) = x^2$ を点 $a = ${n(a)}$ で考えます。$|x - a| < \\delta$ ならば $|x^2 - a^2| < t$ となる最大の $\\delta$ を、$t = \\varepsilon$ の式で表してください。`],
          a: { type: 'expr', v: `sqrt(${a * a}+t)-${a}`, vars: ['t'], dom: { t: [0.3, 3] }, lhs: ['$\\delta_{\\max}(t) =$', '$\\delta_{\\max}(t) =$'] },
          hint: ['The worst case is $x = a + \\delta$, where $x^2 - a^2 = 2a\\delta + \\delta^2$. Set it equal to $t$ and solve the quadratic.', '最悪なのは $x = a + \\delta$ で、$x^2 - a^2 = 2a\\delta + \\delta^2$ です。これを $t$ とおいて二次方程式を解きます。'],
          sol: [[`Need $2a\\delta + \\delta^2 \\le t$ with $a = ${n(a)}$: $\\delta^2 + ${n(2 * a)}\\delta - t = 0$.`, `$a = ${n(a)}$ のとき $2a\\delta + \\delta^2 \\le t$、つまり $\\delta^2 + ${n(2 * a)}\\delta - t = 0$ を解きます。`], [`The positive root is $\\delta = -${n(a)} + \\sqrt{${n(a * a)} + t}$.`, `正の解は $\\delta = -${n(a)} + \\sqrt{${n(a * a)} + t}$ です。`], ['Compare the textbook choice $\\min(1, \\varepsilon/(2|a| + 1))$: it is smaller, a safe sufficient value rather than the exact largest one.', '教科書的な選び方 $\\min(1, \\varepsilon/(2|a| + 1))$ はこれより小さく、最大値ではなく安全側の十分条件です。']],
        };
      }
      if (form === 1) {
        const N = r.int(3, 12), eps = r.pick([0.1, 0.05, 0.01]);
        const b = eps ** (1 / N);
        return {
          q: [`For $f_n(x) = x^n$ on $[0, b]$ with $n = ${N}$, what is the largest endpoint $b < 1$ for which $\\sup |f_n| \\le ${n(eps)}$? Give three decimals.`, `$[0, b]$ 上の $f_n(x) = x^n$ で $n = ${N}$ とします。$\\sup |f_n| \\le ${n(eps)}$ となる $b < 1$ の最大値を小数第3位まで求めてください。`],
          a: { type: 'num', v: b, tol: 6e-4 },
          hint: ['The supremum is $b^n$; solve $b^n = \\varepsilon$ for $b$.', '上限は $b^n$ です。$b^n = \\varepsilon$ を $b$ について解きます。'],
          sol: [[`$b^{${N}} = ${n(eps)}$ gives $b = ${n(eps)}^{1/${N}} = ${n(b, 4)}$.`, `$b^{${N}} = ${n(eps)}$ より $b = ${n(eps)}^{1/${N}} = ${n(b, 4)}$ です。`], [`As $n$ grows this threshold creeps up toward $1$: for any fixed $n$ a wide enough interval below $1$ already fails.`, `$n$ が増えるとこの限界は 1 に近づきますが、$n$ を固定すれば 1 に十分近い $b$ では条件を満たしません。`], ['That drift toward 1 is why the convergence cannot be uniform on all of $[0, 1)$.', 'この 1 への近づき方が、$[0, 1)$ 全体で一様収束にならない理由です。']],
        };
      }
      const cases = [
        { t: 'f_n(x) = x^n \\text{ on } [0, 1]', k: 1, w: ['the limit is $0$ for $x < 1$ but $1$ at $x = 1$, a discontinuous limit of continuous functions, so the convergence cannot be uniform', '極限は $x < 1$ で $0$、$x = 1$ で $1$ となり、連続関数の極限が不連続になるので一様収束ではありません'] },
        { t: 'f_n(x) = x^n \\text{ on } [0, 0.9]', k: 0, w: ['$\\sup |f_n| = 0.9^n \\to 0$', '$\\sup |f_n| = 0.9^n \\to 0$'] },
        { t: 'f_n(x) = x/n \\text{ on } [0, 5]', k: 0, w: ['$\\sup |f_n| = 5/n \\to 0$', '$\\sup |f_n| = 5/n \\to 0$'] },
        { t: 'f_n(x) = x/n \\text{ on } \\mathbb{R}', k: 1, w: ['$\\sup |f_n| = \\infty$ for every $n$, so the distance to the limit $0$ never shrinks', 'すべての $n$ で $\\sup |f_n| = \\infty$ なので、極限 $0$ との距離は縮みません'] },
        { t: 'f_n(x) = x^n \\text{ on } [0, 1)', k: 1, w: ['$\\sup_{[0,1)} x^n = 1$ for every $n$ (approached, not attained)', 'すべての $n$ で $\\sup_{[0,1)} x^n = 1$ です（到達はしませんが近づきます）'] },
      ];
      const c = r.pick(cases);
      return {
        q: [`Does $${c.t}$ converge to its pointwise limit uniformly?`, `$${c.t}$ は各点での極限に一様収束しますか。`],
        a: { type: 'choice', opts: [YN('Yes, uniformly', 'はい、一様収束します'), YN('No, only pointwise', 'いいえ、各点収束にとどまります')], v: c.k, fixed: true },
        hint: ['Compute $\\sup_x |f_n(x) - f(x)|$ and ask whether it tends to $0$.', '$\\sup_x |f_n(x) - f(x)|$ を求め、0 に収束するか調べます。'],
        sol: [[`Looking at the supremum of $|f_n - f|$: ${c.w[0]}.`, `$|f_n - f|$ の上限を調べると、${c.w[1]}。`], ['Uniform convergence is a statement about the supremum, not about each point separately.', '一様収束は各点ごとではなく、上限についての主張です。']],
      };
    },
  ];

  /* ---------- 4. complex analysis ---------- */
  const ci = (v) => (Math.abs(v) === 1 ? '' : n(Math.abs(v)));
  const cx = (re, im) => `${re === 0 ? '' : n(re) + ' '}${im < 0 ? '-' : re === 0 ? '' : '+'} ${ci(im)}i`.replace(/^ /, '').replace(/^- /, '-');
  const lin = (m, c) => `${m === 1 ? '' : m === -1 ? '-' : n(m)}x${c === 0 ? '' : (c < 0 ? ' - ' : ' + ') + Math.abs(c)}`;
  const sg = (v) => (v < 0 ? `(${n(v)})` : n(v));
  Q['analysis-atlas-complex'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.int(-3, 3), y = r.nz(-3, 3);
        return {
          q: [`Compute $z^2$ for $z = ${cx(x, y)}$. Enter the real part and the imaginary part.`, `$z = ${cx(x, y)}$ のとき $z^2$ を計算し、実部と虚部を答えてください。`],
          a: { type: 'tuple', v: [x * x - y * y, 2 * x * y], labels: ['$\\operatorname{Re}$', '$\\operatorname{Im}$'] },
          hint: ['Expand $(x + iy)^2$ and use $i^2 = -1$.', '$(x + iy)^2$ を展開し、$i^2 = -1$ を使います。'],
          sol: [[`$(x + iy)^2 = x^2 - y^2 + 2xyi$ with $x = ${x}$, $y = ${y}$.`, `$(x + iy)^2 = x^2 - y^2 + 2xyi$ に $x = ${x}$、$y = ${y}$ を代入します。`], [`$z^2 = ${cx(x * x - y * y, 2 * x * y)}$.`, `$z^2 = ${cx(x * x - y * y, 2 * x * y)}$ です。`], ['The map doubles the argument and squares the modulus, which is why a quarter-plane opens out to a half-plane.', 'この写像は偏角を 2 倍し絶対値を 2 乗するので、第一象限が上半平面に広がります。']],
        };
      }
      if (form === 1) {
        const x = r.pick([0, 0.5, 1, -1, 2, -0.5, 1.5]), y = r.pick([1, 2, 3, -2]);
        return {
          q: [`What is $|e^{z}|$ for $z = ${cx(x, y)}$?`, `$z = ${cx(x, y)}$ のとき $|e^{z}|$ はいくらですか。`],
          a: { type: 'num', v: Math.exp(x), show: x === 0 ? '1' : `e^{${n(x)}}` },
          hint: ['Write $e^{x + iy} = e^x e^{iy}$ and recall $|e^{iy}| = 1$.', '$e^{x + iy} = e^x e^{iy}$ と書き、$|e^{iy}| = 1$ を思い出します。'],
          sol: [['$e^{x + iy} = e^x(\\cos y + i\\sin y)$, and the bracket has modulus $1$.', '$e^{x + iy} = e^x(\\cos y + i\\sin y)$ で、括弧内の絶対値は $1$ です。'], [`So $|e^z| = e^{${n(x)}} = ${n(Math.exp(x), 4)}$, whatever the value of $y$.`, `したがって $y$ によらず $|e^z| = e^{${n(x)}} = ${n(Math.exp(x), 4)}$ です。`], ['Vertical lines in the input plane become circles, and the imaginary part only spins the output around.', '入力平面の鉛直線は円に移り、虚部は出力を回転させるだけです。']],
        };
      }
      const th = r.pick([10, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80]);
      return {
        q: [`A point $z$ has argument $${th}^\\circ$. What is the argument of $z^2$, in degrees?`, `点 $z$ の偏角が $${th}^\\circ$ です。$z^2$ の偏角は何度ですか。`],
        a: { type: 'num', v: 2 * th },
        hint: ['Write $z = re^{i\\theta}$ and square it.', '$z = re^{i\\theta}$ と書いて 2 乗します。'],
        sol: [['$z^2 = r^2 e^{2i\\theta}$: the modulus is squared and the argument doubled.', '$z^2 = r^2 e^{2i\\theta}$ なので、絶対値は 2 乗され偏角は 2 倍になります。'], [`The argument is $2 \\times ${th}^\\circ = ${2 * th}^\\circ$.`, `偏角は $2 \\times ${th}^\\circ = ${2 * th}^\\circ$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const R = r.pick([0.5, 1, 1.5, 2]), a = r.step(-2, 2, 0.25), c = r.pick([1, 2, 3, -1, 0.5]), cw = r.chance(0.4);
        if (Math.abs(Math.abs(a) - R) < 1e-9) return Q['analysis-atlas-complex'][1](r);
        const inside = Math.abs(a) < R, v = inside ? (cw ? -1 : 1) * 2 * PI * c : 0;
        return {
          q: [`Let $C$ be the circle $|z| = ${n(R)}$ traversed ${cw ? 'clockwise' : 'counterclockwise'}. The integral $\\displaystyle\\oint_C \\frac{${n(c)}}{z - (${n(a)})}\\,dz$ equals $ki$ for a real number $k$. Find $k$.`, `$C$ を円 $|z| = ${n(R)}$ とし、${cw ? '時計回り' : '反時計回り'}に一周します。積分 $\\displaystyle\\oint_C \\frac{${n(c)}}{z - (${n(a)})}\\,dz$ は実数 $k$ を用いて $ki$ と書けます。$k$ を求めてください。`],
          a: { type: 'num', v, tol: 1e-6, show: inside ? `${cw ? '-' : ''}${n(2 * c)}\\pi` : '0' },
          hint: ['Is the pole $a$ inside the circle? The counterclockwise integral of $1/(z - a)$ around a pole is $2\\pi i$.', '極 $a$ は円の内側にありますか。極を反時計回りに囲む $1/(z - a)$ の積分は $2\\pi i$ です。'],
          sol: [[`The pole is at $z = ${n(a)}$, and $|${n(a)}| ${inside ? '<' : '>'} ${n(R)}$, so it is ${inside ? 'inside' : 'outside'} the contour.`, `極は $z = ${n(a)}$ にあり、$|${n(a)}| ${inside ? '<' : '>'} ${n(R)}$ なので、積分路の${inside ? '内側' : '外側'}にあります。`], inside ? [`The integral is $${cw ? '-' : ''}2\\pi i \\cdot ${n(c)}$, so $k = ${n(v, 4)}$.`, `積分は $${cw ? '-' : ''}2\\pi i \\cdot ${n(c)}$ なので $k = ${n(v, 4)}$ です。`] : ['With no enclosed pole the integrand is holomorphic inside, so Cauchy gives $0$.', '内側に極がなければ被積分関数は内部で正則なので、コーシーの定理より $0$ です。'], ['Reversing the orientation flips the sign; only enclosed singularities contribute.', '向きを逆にすると符号が反転し、内部の特異点だけが寄与します。']],
        };
      }
      if (form === 1) {
        const R = r.pick([1, 1.5, 2, 3]), p1 = r.step(-2.5, 2.5, 0.5), p2 = r.step(-2.5, 2.5, 0.5), c1 = r.pick([1, 2, 3]), c2 = r.pick([1, -1, 2]);
        if (Math.abs(Math.abs(p1) - R) < 1e-9 || Math.abs(Math.abs(p2) - R) < 1e-9 || p1 === p2) return Q['analysis-atlas-complex'][1](r);
        const i1 = Math.abs(p1) < R, i2 = Math.abs(p2) < R, k = 2 * PI * ((i1 ? c1 : 0) + (i2 ? c2 : 0));
        return {
          q: [`Around the circle $|z| = ${n(R)}$ counterclockwise, $\\displaystyle\\oint \\left(\\frac{${c1}}{z - (${n(p1)})} + \\frac{${n(c2)}}{z - (${n(p2)})}\\right) dz = ki$. Find $k$ to three decimals.`, `円 $|z| = ${n(R)}$ を反時計回りに一周するとき、$\\displaystyle\\oint \\left(\\frac{${c1}}{z - (${n(p1)})} + \\frac{${n(c2)}}{z - (${n(p2)})}\\right) dz = ki$ です。$k$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: k, tol: 2e-3 },
          hint: ['Each simple pole inside contributes $2\\pi i$ times its coefficient; poles outside contribute nothing.', '内側の単純極はそれぞれ係数の $2\\pi i$ 倍を寄与し、外側の極は何も寄与しません。'],
          sol: [[`The pole at $${n(p1)}$ is ${i1 ? 'inside' : 'outside'} and the pole at $${n(p2)}$ is ${i2 ? 'inside' : 'outside'}.`, `$${n(p1)}$ の極は${i1 ? '内側' : '外側'}、$${n(p2)}$ の極は${i2 ? '内側' : '外側'}にあります。`], [`Sum the enclosed coefficients: $${i1 ? c1 : 0} + ${i2 ? n(c2) : 0}$, then multiply by $2\\pi$: $k = ${n(k, 4)}$.`, `内側の係数を足すと $${i1 ? c1 : 0} + ${i2 ? n(c2) : 0}$、これに $2\\pi$ を掛けて $k = ${n(k, 4)}$ です。`], ['This is the residue theorem in its simplest form: the integral counts the enclosed charge.', 'これが留数定理の最も簡単な形で、積分は内部の「電荷」の総和を数えています。']],
        };
      }
      const k = r.pick([2, 3]), c = r.pick([1, 2, -1, -2]);
      const re = k === 2 ? `x^2-y^2+(${c})*x` : `x^3-3*x*y^2+(${c})*x`;
      return {
        q: [`Write the real part $u(x, y)$ of $f(z) = z^${k} ${c < 0 ? '-' : '+'} ${ci(c)}z$, where $z = x + iy$.`, `$z = x + iy$ として、$f(z) = z^${k} ${c < 0 ? '-' : '+'} ${ci(c)}z$ の実部 $u(x, y)$ を書いてください。`],
        a: { type: 'expr', v: re, vars: ['x', 'y'], lhs: ['$u(x, y) =$', '$u(x, y) =$'] },
        hint: [k === 2 ? 'Expand $(x + iy)^2$ and collect the terms without $i$.' : 'Expand $(x + iy)^3$ with the binomial theorem and collect the terms without $i$.', k === 2 ? '$(x + iy)^2$ を展開し、$i$ を含まない項を集めます。' : '$(x + iy)^3$ を二項定理で展開し、$i$ を含まない項を集めます。'],
        sol: [[k === 2 ? '$(x + iy)^2 = x^2 - y^2 + 2xyi$.' : '$(x + iy)^3 = x^3 - 3xy^2 + (3x^2y - y^3)i$.', k === 2 ? '$(x + iy)^2 = x^2 - y^2 + 2xyi$ です。' : '$(x + iy)^3 = x^3 - 3xy^2 + (3x^2y - y^3)i$ です。'], [`Adding $${c < 0 ? '-' : ''}${ci(c)}(x + iy)$, the real part is $u = ${k === 2 ? 'x^2 - y^2' : 'x^3 - 3xy^2'} ${c < 0 ? '-' : '+'} ${ci(c)}x$.`, `$${c < 0 ? '-' : ''}${ci(c)}(x + iy)$ を加えると、実部は $u = ${k === 2 ? 'x^2 - y^2' : 'x^3 - 3xy^2'} ${c < 0 ? '-' : '+'} ${ci(c)}x$ です。`], ['Real and imaginary parts of a holomorphic function are tied together by the Cauchy-Riemann equations.', '正則関数の実部と虚部は、コーシー・リーマンの方程式で結びついています。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3, 0.5, -1, -2]);
        return {
          q: [`For which constant $c$ is $f(x + iy) = ${a === 1 ? '' : a === -1 ? '-' : n(a)}(x^2 - y^2) + c\\,xy\\,i$ holomorphic?`, `定数 $c$ がいくつのとき $f(x + iy) = ${a === 1 ? '' : a === -1 ? '-' : n(a)}(x^2 - y^2) + c\\,xy\\,i$ は正則ですか。`],
          a: { type: 'num', v: 2 * a },
          hint: ['Write $u = ${n(a)}(x^2 - y^2)$ and $v = cxy$, then impose $u_x = v_y$ and $u_y = -v_x$.'.replace('${n(a)}', n(a)), '$u$ と $v$ を書き、$u_x = v_y$ と $u_y = -v_x$ を課します。'],
          sol: [[`$u_x = ${n(2 * a)}x$ and $v_y = cx$, so $c = ${n(2 * a)}$.`, `$u_x = ${n(2 * a)}x$、$v_y = cx$ より $c = ${n(2 * a)}$ です。`], [`Check the other equation: $u_y = ${n(-2 * a)}y$ and $-v_x = -cy = ${n(-2 * a)}y$. It holds.`, `もう一方を確認すると、$u_y = ${n(-2 * a)}y$、$-v_x = -cy = ${n(-2 * a)}y$ で成り立ちます。`], [`So $f = ${a === 1 ? '' : a === -1 ? '-' : n(a)}z^2$, a constant multiple of the squaring map.`, `したがって $f = ${a === 1 ? '' : a === -1 ? '-' : n(a)}z^2$ で、2 乗写像の定数倍です。`]],
        };
      }
      if (form === 1) {
        const k = r.int(2, 5), conj = r.chance(0.4);
        return {
          q: [`As $z$ traverses the unit circle once counterclockwise, how many times, counted with sign, does $${conj ? `\\overline{z}^{\\,${k}}` : `z^{${k}}`}$ wind around the origin? Counterclockwise turns count as positive.`, `$z$ が単位円を反時計回りに一周するとき、$${conj ? `\\overline{z}^{\\,${k}}` : `z^{${k}}`}$ は原点のまわりを符号付きで何回まわりますか（反時計回りを正とします）。`],
          a: { type: 'int', v: conj ? -k : k },
          hint: ['Put $z = e^{i\\theta}$ and see how the argument of the image grows with $\\theta$.', '$z = e^{i\\theta}$ とおき、像の偏角が $\\theta$ とともにどう増えるかを見ます。'],
          sol: [[conj ? `With $z = e^{i\\theta}$ we get $\\overline{z}^{\\,${k}} = e^{-${k}i\\theta}$.` : `With $z = e^{i\\theta}$ we get $z^{${k}} = e^{${k}i\\theta}$.`, conj ? `$z = e^{i\\theta}$ とすると $\\overline{z}^{\\,${k}} = e^{-${k}i\\theta}$ です。` : `$z = e^{i\\theta}$ とすると $z^{${k}} = e^{${k}i\\theta}$ です。`], [`The argument changes by ${conj ? '-' : ''}${k} \\cdot 2\\pi as $\\theta$ runs from $0$ to $2\\pi$, so the winding number is ${conj ? -k : k}.`.replace('\\cdot', '$\\cdot$'), `$\\theta$ が $0$ から $2\\pi$ まで動くと偏角は ${conj ? '-' : ''}${k} $\\cdot$ $2\\pi$ だけ変化するので、回転数は ${conj ? -k : k} です。`], [conj ? 'Conjugation reverses orientation, so the loop runs the other way around.' : 'This is why $z^k$ is a $k$-to-one map near the origin.', conj ? '共役は向きを反転するので、像は逆向きにまわります。' : 'これが、原点付近で $z^k$ が $k$ 対 1 の写像になる理由です。']],
        };
      }
      const c = r.pick([-2, -1, 0.5, 1, 2, 3]);
      return {
        q: [`The map $w = e^z$ sends the vertical line $\\operatorname{Re} z = ${n(c)}$ onto a circle centered at the origin. What is its radius? Give three decimals.`, `写像 $w = e^z$ は鉛直線 $\\operatorname{Re} z = ${n(c)}$ を原点中心の円に移します。その半径はいくらですか（小数第3位まで）。`],
        a: { type: 'num', v: Math.exp(c), tol: 1e-3, show: `e^{${n(c)}}` },
        hint: ['On that line $z = c + iy$, so $e^z = e^c e^{iy}$.', 'その直線上では $z = c + iy$ なので $e^z = e^c e^{iy}$ です。'],
        sol: [[`$e^{${n(c)} + iy} = e^{${n(c)}}e^{iy}$, whose modulus is constant.`, `$e^{${n(c)} + iy} = e^{${n(c)}}e^{iy}$ で、絶対値は一定です。`], [`The radius is $e^{${n(c)}} = ${n(Math.exp(c), 4)}$, and the circle is traced once for every $2\\pi$ of $y$.`, `半径は $e^{${n(c)}} = ${n(Math.exp(c), 4)}$ で、$y$ が $2\\pi$ 増えるごとに円を一周します。`], ['So the exponential wraps every horizontal strip of height $2\\pi$ around the plane once.', 'このように指数関数は、高さ $2\\pi$ の水平な帯ごとに平面を一周します。']],
      };
    },
  ];

  /* ---------- 5. functional analysis ---------- */
  const sq = (N) => Array.from({ length: N }, (_, i) => 1 / ((i + 1) * (i + 1))).reduce((a, v) => a + v, 0);
  const errNorm = (N) => Math.sqrt(Math.max(0, 2 * PI ** 3 / 3 - 4 * PI * sq(N)));
  Q['analysis-atlas-functional'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 8);
        return {
          q: [`On $(-\\pi, \\pi)$, $x = \\sum_{k \\ge 1} b_k \\sin(kx)$ in $L^2$. What is $b_${k}$?`, `$(-\\pi, \\pi)$ 上で $L^2$ の意味で $x = \\sum_{k \\ge 1} b_k \\sin(kx)$ と展開します。$b_${k}$ はいくらですか。`],
          a: { type: 'num', v: 2 * (k % 2 ? 1 : -1) / k, show: frac(2 * (k % 2 ? 1 : -1), k) },
          hint: ['$b_k = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} x \\sin(kx)\\,dx$; integrate by parts once.', '$b_k = \\frac{1}{\\pi}\\int_{-\\pi}^{\\pi} x \\sin(kx)\\,dx$ です。部分積分を一度行います。'],
          sol: [['By parts, $\\int_{-\\pi}^{\\pi} x\\sin(kx)\\,dx = \\left[-\\frac{x\\cos kx}{k}\\right]_{-\\pi}^{\\pi} + \\frac1k\\int \\cos kx\\,dx = -\\frac{2\\pi(-1)^k}{k}$.', '部分積分により $\\int_{-\\pi}^{\\pi} x\\sin(kx)\\,dx = \\left[-\\frac{x\\cos kx}{k}\\right]_{-\\pi}^{\\pi} + \\frac1k\\int \\cos kx\\,dx = -\\frac{2\\pi(-1)^k}{k}$ です。'], [`Dividing by $\\pi$: $b_k = 2(-1)^{k+1}/k$, so $b_${k} = ${frac(2 * (k % 2 ? 1 : -1), k)}$.`, `$\\pi$ で割ると $b_k = 2(-1)^{k+1}/k$ なので $b_${k} = ${frac(2 * (k % 2 ? 1 : -1), k)}$ です。`], ['The coefficients shrink only like $1/k$, which is why the partial sums in the experiment converge slowly.', '係数は $1/k$ の速さでしか小さくならないので、実験の部分和はゆっくり収束します。']],
        };
      }
      if (form === 1) {
        const N = r.int(1, 12);
        return {
          q: [`On $(-\\pi, \\pi)$, what is the $L^2$ norm of $f_n(x) = \\sin(nx)/n$ for $n = ${N}$? Give three decimals.`, `$(-\\pi, \\pi)$ 上で、$n = ${N}$ のときの $f_n(x) = \\sin(nx)/n$ の $L^2$ ノルムはいくらですか（小数第3位まで）。`],
          a: { type: 'num', v: Math.sqrt(PI) / N, tol: 6e-4, show: `\\dfrac{\\sqrt{\\pi}}{${N}}` },
          hint: ['$\\int_{-\\pi}^{\\pi}\\sin^2(nx)\\,dx = \\pi$ for every $n \\ge 1$.', 'すべての $n \\ge 1$ で $\\int_{-\\pi}^{\\pi}\\sin^2(nx)\\,dx = \\pi$ です。'],
          sol: [[`$\\|f_n\\|_2^2 = \\frac{1}{${N * N}}\\int_{-\\pi}^{\\pi}\\sin^2(${N}x)\\,dx = \\frac{\\pi}{${N * N}}$.`, `$\\|f_n\\|_2^2 = \\frac{1}{${N * N}}\\int_{-\\pi}^{\\pi}\\sin^2(${N}x)\\,dx = \\frac{\\pi}{${N * N}}$ です。`], [`So $\\|f_n\\|_2 = \\sqrt{\\pi}/${N} = ${n(Math.sqrt(PI) / N, 4)}$.`, `したがって $\\|f_n\\|_2 = \\sqrt{\\pi}/${N} = ${n(Math.sqrt(PI) / N, 4)}$ です。`], ['These inputs shrink to zero in norm as $n$ grows; the second experiment asks what an operator does to them.', 'これらの入力は $n$ とともにノルムが 0 に縮みます。第二の実験は、作用素がそれにどう作用するかを問います。']],
        };
      }
      const m = r.int(1, 6), k = r.chance(0.5) ? m : m + r.int(1, 4);
      return {
        q: [`Compute the inner product $\\langle \\sin(${m}x), \\sin(${k}x) \\rangle = \\int_{-\\pi}^{\\pi}\\sin(${m}x)\\sin(${k}x)\\,dx$.`, `内積 $\\langle \\sin(${m}x), \\sin(${k}x) \\rangle = \\int_{-\\pi}^{\\pi}\\sin(${m}x)\\sin(${k}x)\\,dx$ を計算してください。`],
        a: { type: 'num', v: m === k ? PI : 0, tol: 1e-6, show: m === k ? '\\pi' : '0' },
        hint: ['Use $\\sin A\\sin B = \\tfrac12[\\cos(A - B) - \\cos(A + B)]$.', '$\\sin A\\sin B = \\tfrac12[\\cos(A - B) - \\cos(A + B)]$ を使います。'],
        sol: [m === k ? [`The integrand equals $\\tfrac12[1 - \\cos(${2 * m}x)]$.`, `被積分関数は $\\tfrac12[1 - \\cos(${2 * m}x)]$ です。`] : [`The integrand equals $\\tfrac12[\\cos(${Math.abs(m - k) === 1 ? '' : Math.abs(m - k)}x) - \\cos(${m + k}x)]$.`, `被積分関数は $\\tfrac12[\\cos(${Math.abs(m - k) === 1 ? '' : Math.abs(m - k)}x) - \\cos(${m + k}x)]$ です。`], [m === k ? `The first term is the constant $\\tfrac12$, which integrates to $\\pi$; the second integrates to $0$.` : `Both cosines have nonzero frequency and integrate to $0$ over a full period.`, m === k ? '第一項は定数 $\\tfrac12$ で積分は $\\pi$、第二項の積分は $0$ です。' : 'どちらの余弦も周波数が 0 でなく、一周期分の積分は $0$ です。'], [m === k ? 'The value is $\\pi$, the squared norm of a single sine.' : 'Different sines are orthogonal, which is what makes projection onto them a coefficient-by-coefficient recipe.', m === k ? '値は $\\pi$ で、一つの正弦波の二乗ノルムです。' : '異なる正弦波は直交しており、そのおかげで射影を係数ごとに計算できます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(1, 8), e = errNorm(N);
        return {
          q: [`Approximate $f(x) = x$ on $(-\\pi, \\pi)$ by the sum of its first $N = ${N}$ sine terms. Using $\\|f\\|_2^2 = 2\\pi^3/3$ and $\\|P_N f\\|_2^2 = 4\\pi\\sum_{k \\le N} 1/k^2$, find $\\|f - P_N f\\|_2$ to three decimals.`, `$(-\\pi, \\pi)$ 上の $f(x) = x$ を最初の $N = ${N}$ 項の正弦波の和で近似します。$\\|f\\|_2^2 = 2\\pi^3/3$、$\\|P_N f\\|_2^2 = 4\\pi\\sum_{k \\le N} 1/k^2$ を使って $\\|f - P_N f\\|_2$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: e, tol: 2e-3 },
          hint: ['Pythagoras: $\\|f - P_N f\\|^2 = \\|f\\|^2 - \\|P_N f\\|^2$ because the error is orthogonal to the subspace.', 'ピタゴラスの定理により $\\|f - P_N f\\|^2 = \\|f\\|^2 - \\|P_N f\\|^2$ です。誤差は部分空間に直交しています。'],
          sol: [[`$\\sum_{k \\le ${N}} 1/k^2 = ${n(sq(N), 5)}$, so $\\|P_N f\\|_2^2 = 4\\pi \\cdot ${n(sq(N), 5)} = ${n(4 * PI * sq(N), 4)}$.`, `$\\sum_{k \\le ${N}} 1/k^2 = ${n(sq(N), 5)}$ なので $\\|P_N f\\|_2^2 = 4\\pi \\cdot ${n(sq(N), 5)} = ${n(4 * PI * sq(N), 4)}$ です。`], [`$\\|f\\|_2^2 = 2\\pi^3/3 = ${n(2 * PI ** 3 / 3, 4)}$, so $\\|f - P_N f\\|_2 = \\sqrt{${n(2 * PI ** 3 / 3 - 4 * PI * sq(N), 4)}} = ${n(e, 4)}$.`, `$\\|f\\|_2^2 = 2\\pi^3/3 = ${n(2 * PI ** 3 / 3, 4)}$ なので $\\|f - P_N f\\|_2 = \\sqrt{${n(2 * PI ** 3 / 3 - 4 * PI * sq(N), 4)}} = ${n(e, 4)}$ です。`], ['This is the number the first experiment of the functional-analysis lesson prints for the chosen $N$.', 'これは関数解析のレッスンの第一の実験が、選んだ $N$ に対して表示する値です。']],
        };
      }
      if (form === 1) {
        const M = r.int(3, 40);
        return {
          q: [`For $T = d/dx$ and $f_n(x) = \\sin(nx)/n$, the ratio $\\|Tf_n\\|_2 / \\|f_n\\|_2$ equals $n$. What is the smallest $n$ for which this ratio exceeds ${M}?`, `$T = d/dx$、$f_n(x) = \\sin(nx)/n$ のとき、比 $\\|Tf_n\\|_2 / \\|f_n\\|_2$ は $n$ に等しくなります。この比が ${M} を超える最小の $n$ はいくつですか。`],
          a: { type: 'int', v: M + 1 },
          hint: ['Differentiate: $f_n\' = \\cos(nx)$, so compare its norm with that of $f_n$.', '微分すると $f_n\' = \\cos(nx)$ です。そのノルムを $f_n$ のノルムと比べます。'],
          sol: [['$\\|Tf_n\\|_2 = \\|\\cos nx\\|_2 = \\sqrt{\\pi}$ and $\\|f_n\\|_2 = \\sqrt{\\pi}/n$, so the ratio is exactly $n$.', '$\\|Tf_n\\|_2 = \\|\\cos nx\\|_2 = \\sqrt{\\pi}$、$\\|f_n\\|_2 = \\sqrt{\\pi}/n$ なので、比はちょうど $n$ です。'], [`The ratio exceeds ${M} first at $n = ${M + 1}$.`, `比が ${M} を超える最初の $n$ は $n = ${M + 1}$ です。`], ['No constant bounds the ratio for all $n$, so differentiation is unbounded on $L^2$: tiny wiggles in the input can become large outputs.', 'すべての $n$ に対して比を抑える定数はないので、微分は $L^2$ 上で非有界です。入力のごく小さな揺れが出力では大きくなりえます。']],
        };
      }
      const N = r.pick([1, 3, 5, 7, 9]);
      let s = 0; for (let k = 1; k <= N; k++) s += (2 * (k % 2 ? 1 : -1) / k) * Math.sin(k * PI / 2);
      return {
        q: [`Evaluate the $N = ${N}$ term sine approximation $\\sum_{k=1}^{${N}} \\frac{2(-1)^{k+1}}{k}\\sin(kx)$ of $f(x) = x$ at $x = \\pi/2$. Give three decimals.`, `$f(x) = x$ の $N = ${N}$ 項の正弦近似 $\\sum_{k=1}^{${N}} \\frac{2(-1)^{k+1}}{k}\\sin(kx)$ を $x = \\pi/2$ で評価してください（小数第3位まで）。`],
        a: { type: 'num', v: s, tol: 1.2e-3 },
        hint: ['$\\sin(k\\pi/2)$ is $0$ for even $k$ and alternates $1, -1$ over odd $k$.', '$\\sin(k\\pi/2)$ は偶数 $k$ で $0$、奇数 $k$ では $1, -1$ と交互になります。'],
        sol: [['Only odd $k$ survive, and for them $(-1)^{k+1} = 1$, so the sum is $2\\sum (-1)^{(k-1)/2}/k$ over odd $k \\le N$.', '奇数 $k$ だけが残り、そのとき $(-1)^{k+1} = 1$ なので、和は奇数 $k \\le N$ にわたる $2\\sum (-1)^{(k-1)/2}/k$ です。'], [`Adding the ${(N + 1) / 2} nonzero term${N === 1 ? '' : 's'} gives ${n(s, 4)}.`, `${(N + 1) / 2} 個の非ゼロ項を足すと ${n(s, 4)} です。`], [`The target is $f(\\pi/2) = \\pi/2 \\approx ${n(PI / 2, 4)}$; the partial sums oscillate around it and close in slowly.`, `目標値は $f(\\pi/2) = \\pi/2 \\approx ${n(PI / 2, 4)}$ で、部分和はそのまわりを振動しながらゆっくり近づきます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const eps = r.pick([1, 0.8, 0.6, 0.5, 0.4, 0.3]);
        let N = 0; while (errNorm(N) >= eps) N++;
        return {
          q: [`How many sine terms $N$ are needed so that the $L^2$ error of approximating $f(x) = x$ on $(-\\pi, \\pi)$ drops below ${n(eps)}? Use $\\|f - P_N f\\|_2^2 = 2\\pi^3/3 - 4\\pi\\sum_{k \\le N} 1/k^2$.`, `$(-\\pi, \\pi)$ 上の $f(x) = x$ の近似の $L^2$ 誤差を ${n(eps)} 未満にするには、正弦波の項が何個 $N$ 必要ですか。$\\|f - P_N f\\|_2^2 = 2\\pi^3/3 - 4\\pi\\sum_{k \\le N} 1/k^2$ を使ってください。`],
          a: { type: 'int', v: N },
          hint: ['The error decreases as $N$ increases; find the first $N$ whose error is below the target.', '誤差は $N$ とともに減ります。目標を下回る最初の $N$ を探します。'],
          sol: [[`At $N = ${N - 1}$ the error is $${n(errNorm(N - 1), 4)} \\ge ${n(eps)}$.`, `$N = ${N - 1}$ では誤差は $${n(errNorm(N - 1), 4)} \\ge ${n(eps)}$ です。`], [`At $N = ${N}$ it is $${n(errNorm(N), 4)} < ${n(eps)}$, so $N = ${N}$.`, `$N = ${N}$ では $${n(errNorm(N), 4)} < ${n(eps)}$ なので $N = ${N}$ です。`], ['The error behaves like $\\sqrt{4\\pi/N}$, so halving it costs about four times as many terms.', '誤差はおよそ $\\sqrt{4\\pi/N}$ のように減るので、半分にするには項数がおよそ 4 倍必要です。']],
        };
      }
      if (form === 1) {
        const c = r.pick([1, 2, 3, 0.5, 4]);
        return {
          q: [`The function $f(x) = ${n(c)}x$ has sine coefficients $b_k$ on $(-\\pi, \\pi)$. Use Parseval, $\\|f\\|_2^2 = \\pi\\sum b_k^2$, to find $\\sum_{k \\ge 1} b_k^2$ exactly. Enter a decimal or an exact value.`, `関数 $f(x) = ${n(c)}x$ の $(-\\pi, \\pi)$ における正弦係数を $b_k$ とします。パーセバルの等式 $\\|f\\|_2^2 = \\pi\\sum b_k^2$ を使って $\\sum_{k \\ge 1} b_k^2$ を求めてください。小数でも厳密値でも構いません。`],
          a: { type: 'num', v: 2 * PI * PI * c * c / 3, show: `\\dfrac{${n(2 * c * c)}\\pi^2}{3}` },
          hint: ['Compute $\\|f\\|_2^2 = \\int_{-\\pi}^{\\pi} c^2x^2\\,dx$ and divide by $\\pi$.', '$\\|f\\|_2^2 = \\int_{-\\pi}^{\\pi} c^2x^2\\,dx$ を計算し、$\\pi$ で割ります。'],
          sol: [[`$\\|f\\|_2^2 = ${n(c * c)}\\cdot \\dfrac{2\\pi^3}{3}$.`, `$\\|f\\|_2^2 = ${n(c * c)}\\cdot \\dfrac{2\\pi^3}{3}$ です。`], [`Dividing by $\\pi$ gives $\\sum b_k^2 = \\dfrac{${n(2 * c * c)}\\pi^2}{3} \\approx ${n(2 * PI * PI * c * c / 3, 4)}$.`, `$\\pi$ で割ると $\\sum b_k^2 = \\dfrac{${n(2 * c * c)}\\pi^2}{3} \\approx ${n(2 * PI * PI * c * c / 3, 4)}$ です。`], ['Since $b_k = 2c(-1)^{k+1}/k$, this is the same as the identity $\\sum 1/k^2 = \\pi^2/6$: no energy is lost between the function and its coefficients.', '$b_k = 2c(-1)^{k+1}/k$ なので、これは $\\sum 1/k^2 = \\pi^2/6$ と同じ内容です。関数と係数の間でエネルギーは失われません。']],
        };
      }
      const ops = [
        { t: 'T f = \\sin(x)\\,f(x)', k: 0, w: ['$|\\sin x| \\le 1$, so $\\|Tf\\|_2 \\le \\|f\\|_2$', '$|\\sin x| \\le 1$ なので $\\|Tf\\|_2 \\le \\|f\\|_2$'] },
        { t: 'T f = f\'', k: 1, w: ['$T(\\sin nx) = n\\cos nx$ has norm $n$ times that of the input', '$T(\\sin nx) = n\\cos nx$ のノルムは入力の $n$ 倍'] },
        { t: 'T f = 5f', k: 0, w: ['$\\|Tf\\|_2 = 5\\|f\\|_2$', '$\\|Tf\\|_2 = 5\\|f\\|_2$'] },
        { t: 'T f(x) = \\int_{0}^{x} f(s)\\,ds \\text{ on } L^2(0, \\pi)', k: 0, w: ['by Cauchy-Schwarz $|Tf(x)| \\le \\sqrt{\\pi}\\,\\|f\\|_2$, so the norm is at most $\\pi\\|f\\|_2$', 'コーシー・シュワルツにより $|Tf(x)| \\le \\sqrt{\\pi}\\,\\|f\\|_2$ なので、ノルムは高々 $\\pi\\|f\\|_2$'] },
        { t: 'T f = f\'\' \\text{ on smooth periodic } f', k: 1, w: ['$T(\\sin nx) = -n^2\\sin nx$ amplifies by $n^2$', '$T(\\sin nx) = -n^2\\sin nx$ は $n^2$ 倍に増幅'] },
      ];
      const o = r.pick(ops);
      return {
        q: [`Is the operator $${o.t}$ bounded on $L^2$ (is there a constant $C$ with $\\|Tf\\|_2 \\le C\\|f\\|_2$ for all $f$)?`, `作用素 $${o.t}$ は $L^2$ 上で有界ですか（すべての $f$ に対して $\\|Tf\\|_2 \\le C\\|f\\|_2$ となる定数 $C$ がありますか）。`],
        a: { type: 'choice', opts: [YN('Yes, bounded', 'はい、有界です'), YN('No, unbounded', 'いいえ、有界ではありません')], v: o.k, fixed: true },
        hint: ['Test it on the family $\\sin(nx)$ and watch how the ratio of norms behaves as $n$ grows.', '族 $\\sin(nx)$ に作用させ、$n$ が大きくなるときノルム比がどうなるか見ます。'],
        sol: [[`${o.k === 0 ? 'Bounded' : 'Unbounded'}: ${o.w[0]}.`, `${o.k === 0 ? '有界' : '非有界'}です。${o.w[1]}。`], ['An unbounded operator can turn a small error in the input into a large error in the output, which is why such problems are ill-conditioned.', '非有界な作用素は入力の小さな誤差を出力で大きな誤差に変えることがあり、そのため問題が悪条件になります。']],
      };
    },
  ];
})();
