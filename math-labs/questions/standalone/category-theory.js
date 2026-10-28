'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { terms, gcd } = P.util;

  const lin = (a, b) => terms([[a, 'x'], [b, '']]);
  const ex = (a, b) => `${a}*x${b < 0 ? '-' : '+'}${Math.abs(b)}`;
  const co = (b) => (b === 1 ? '' : b === -1 ? '-' : `${b}*`);
  const els = (n) => `${n} element${n === 1 ? '' : 's'}`;
  const chainTeX = (n) => (n <= 3 ? Array.from({ length: n }, (_, i) => i).join(' \\le ') : `0 \\le 1 \\le \\dots \\le ${n - 1}`);
  const choose = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); };
  const perms = (n) => { const out = []; const rec = (cur, used) => { if (cur.length === n) { out.push(cur.slice()); return; } for (let i = 0; i < n; i++) if (!used[i]) { used[i] = true; cur.push(i); rec(cur, used); cur.pop(); used[i] = false; } }; rec([], []); return out; };

  /* ---------- composition, identities, associativity ---------- */
  const MAPS = [
    ['x + 1', 'x+1', (x) => x + 1, 'add one', '1 を加える'],
    ['2x', '2x', (x) => 2 * x, 'double', '2 倍する'],
    ['x^2', 'x^2', (x) => x * x, 'square', '2 乗する'],
    ['x - 3', 'x-3', (x) => x - 3, 'subtract three', '3 を引く'],
    ['3x', '3x', (x) => 3 * x, 'triple', '3 倍する'],
  ];

  Q['category-theory-composition'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [f, g] = r.sample(MAPS, 2), x0 = r.int(-3, 4), gf = r.chance(0.5);
        const first = gf ? f : g, second = gf ? g : f;
        const v = second[2](first[2](x0));
        return {
          q: [`Let $f(x) = ${f[0]}$ and $g(x) = ${g[0]}$. Compute $(${gf ? 'g \\circ f' : 'f \\circ g'})(${x0})$.`, `$f(x) = ${f[0]}$、$g(x) = ${g[0]}$ とします。$(${gf ? 'g \\circ f' : 'f \\circ g'})(${x0})$ を求めてください。`],
          a: { type: 'int', v },
          hint: [`Read ${gf ? '$g \\circ f$' : '$f \\circ g$'} from right to left: apply ${gf ? '$f$' : '$g$'} first.`, `${gf ? '$g \\circ f$' : '$f \\circ g$'} は右から左へ読みます。先に ${gf ? '$f$' : '$g$'} を適用します。`],
          sol: [[`${gf ? '$f' : '$g'}(${x0}) = ${first[2](x0)}$.`, `${gf ? '$f' : '$g'}(${x0}) = ${first[2](x0)}$ です。`], [`${gf ? '$g' : '$f'}(${first[2](x0)}) = ${v}$, so the composite gives ${v}. The other order generally gives a different number: composition is not commutative.`, `${gf ? '$g' : '$f'}(${first[2](x0)}) = ${v}$ なので、合成の値は ${v} です。順序を逆にすると一般に別の値になります。合成は可換ではありません。`]],
        };
      }
      if (form === 1) {
        const objs = ['A', 'B', 'C', 'D'];
        const arrows = [];
        const k = r.int(4, 6);
        const names = ['f', 'g', 'h', 'k', 'm', 'n'];
        const seen = new Set();
        while (arrows.length < k) {
          const s = r.pick(objs), t = r.pick(objs);
          const key = s + t;
          if (seen.has(key)) continue; seen.add(key);
          arrows.push({ n: names[arrows.length], s, t });
        }
        let cnt = 0; const comps = [];
        for (const u of arrows) for (const v of arrows) if (u.t === v.s) { cnt++; comps.push(`${v.n} \\circ ${u.n}`); }
        return {
          q: [`A category has non-identity arrows ${arrows.map((a) => `$${a.n} : ${a.s} \\to ${a.t}$`).join(', ')}. For how many ordered pairs $(u, v)$ of these arrows (the two may be the same arrow) is the composite $v \\circ u$ defined?`, `ある圏の恒等射以外の射が ${arrows.map((a) => `$${a.n} : ${a.s} \\to ${a.t}$`).join('、')} です。これらの射の順序つきの組 $(u, v)$（同じ射でもかまいません）のうち、合成 $v \\circ u$ が定義できるものはいくつですか。`],
          a: { type: 'int', v: cnt },
          hint: ['$v \\circ u$ is defined exactly when the target of $u$ equals the source of $v$.', '$v \\circ u$ が定義できるのは、$u$ の終域と $v$ の始域が等しいときだけです。'],
          sol: [[`Check each pair for target of $u$ = source of $v$. The defined composites are ${comps.length ? comps.map((c) => `$${c}$`).join(', ') : 'none'}.`, `各組について、$u$ の終域が $v$ の始域に等しいかを調べます。定義できる合成は ${comps.length ? comps.map((c) => `$${c}$`).join('、') : 'ありません'}。`], [`That is ${cnt} pair${cnt === 1 ? '' : 's'}. Composition is a partial operation: it only exists when the types match, which is what separates a category from a monoid.`, `${cnt} 組です。合成は型が合うときだけ存在する部分的な演算で、そこが圏とモノイドの違いです。`]],
        };
      }
      const [f, g, h] = r.sample(MAPS, 3), x0 = r.int(-2, 3);
      const left = h[2](g[2](f[2](x0)));
      return {
        q: [`With $f(x) = ${f[0]}$, $g(x) = ${g[0]}$ and $h(x) = ${h[0]}$, compute $(h \\circ (g \\circ f))(${x0})$.`, `$f(x) = ${f[0]}$、$g(x) = ${g[0]}$、$h(x) = ${h[0]}$ のとき、$(h \\circ (g \\circ f))(${x0})$ を求めてください。`],
        a: { type: 'int', v: left },
        hint: ['Do the innermost function first: $f$, then $g$, then $h$.', '一番内側から順に、$f$、$g$、$h$ を適用します。'],
        sol: [[`$f(${x0}) = ${f[2](x0)}$, then $g(${f[2](x0)}) = ${g[2](f[2](x0))}$, then $h(${g[2](f[2](x0))}) = ${left}$.`, `$f(${x0}) = ${f[2](x0)}$、次に $g(${f[2](x0)}) = ${g[2](f[2](x0))}$、次に $h(${g[2](f[2](x0))}) = ${left}$ です。`], [`The other grouping, $((h \\circ g) \\circ f)(${x0})$, uses the same three steps in the same order, so it also gives ${left}: associativity changes the brackets, never the order.`, `もう一方の括弧づけ $((h \\circ g) \\circ f)(${x0})$ も同じ 3 段階を同じ順序で行うので、やはり ${left} です。結合律が変えるのは括弧であって、順序ではありません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 4), b = r.int(-4, 5), c = r.nz(-3, 4), d = r.int(-4, 5), gf = r.chance(0.5);
        const [F, G] = gf ? [[a, b], [c, d]] : [[c, d], [a, b]];
        // result is G(F(x)): coefficient
        const A = G[0] * F[0], B = G[0] * F[1] + G[1];
        return {
          q: [`Let $f(x) = ${lin(a, b)}$ and $g(x) = ${lin(c, d)}$. Find the formula for $${gf ? 'g \\circ f' : 'f \\circ g'}$.`, `$f(x) = ${lin(a, b)}$、$g(x) = ${lin(c, d)}$ とします。$${gf ? 'g \\circ f' : 'f \\circ g'}$ の式を求めてください。`],
          a: { type: 'expr', v: ex(A, B), vars: ['x'], dom: { x: [-2, 3] }, lhs: [`$(${gf ? 'g \\circ f' : 'f \\circ g'})(x) =$`, `$(${gf ? 'g \\circ f' : 'f \\circ g'})(x) =$`] },
          hint: [`Substitute the formula for ${gf ? '$f$' : '$g$'} into ${gf ? '$g$' : '$f$'}.`, `${gf ? '$f$' : '$g$'} の式を ${gf ? '$g$' : '$f$'} に代入します。`],
          sol: [[`${gf ? '$g(f(x))' : '$f(g(x))'} = ${gf ? lin(c, d).replace(/x/g, `(${lin(a, b)})`) : lin(a, b).replace(/x/g, `(${lin(c, d)})`)}$.`, `${gf ? '$g(f(x))' : '$f(g(x))'} = ${gf ? lin(c, d).replace(/x/g, `(${lin(a, b)})`) : lin(a, b).replace(/x/g, `(${lin(c, d)})`)}$ です。`], [`Expanding gives $${lin(A, B)}$. Composing two linear maps multiplies the slopes and carries the shift through the outer slope.`, `展開すると $${lin(A, B)}$ です。1 次関数を合成すると傾きは掛け合わされ、ずれは外側の傾きを通って運ばれます。`]],
        };
      }
      if (form === 1) {
        const a = r.int(1, 4), b = r.nz(-3, 4), c = r.int(-4, 5), kind = r.int(0, 1);
        // h(g(f(x))) with f = x + a, g = x^2, h = b x + c
        const v = `${co(b)}(x+${a})^2${c < 0 ? '-' : '+'}${Math.abs(c)}`;
        return {
          q: [`Let $f(x) = x + ${a}$, $g(x) = x^2$ and $h(x) = ${lin(b, c)}$. Find the formula for $h \\circ g \\circ f$.`, `$f(x) = x + ${a}$、$g(x) = x^2$、$h(x) = ${lin(b, c)}$ とします。$h \\circ g \\circ f$ の式を求めてください。`],
          a: { type: 'expr', v, vars: ['x'], dom: { x: [-2, 3] }, lhs: ['$(h \\circ g \\circ f)(x) =$', '$(h \\circ g \\circ f)(x) =$'] },
          hint: ['Work from the inside: $f$ first, then $g$, then $h$.', '内側から順に、$f$、$g$、$h$ です。'],
          sol: [[`$g(f(x)) = (x + ${a})^2$, then $h$ of that is $${b === 1 ? '' : b === -1 ? '-' : b}(x + ${a})^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$.`, `$g(f(x)) = (x + ${a})^2$ で、その $h$ は $${b === 1 ? '' : b === -1 ? '-' : b}(x + ${a})^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$ です。`], ['Regrouping as $(h \\circ g) \\circ f$ or $h \\circ (g \\circ f)$ gives the same function, but the order $f, g, h$ cannot change: squaring before shifting would give a different formula.', '$(h \\circ g) \\circ f$ と $h \\circ (g \\circ f)$ のどちらの括弧づけでも同じ関数ですが、$f, g, h$ の順序は変えられません。平方をずらす前に行えば別の式になります。']],
        };
      }
      const V = r.int(3, 5), edges = [];
      const pairs = []; for (let i = 0; i < V; i++) for (let j = i + 1; j < V; j++) pairs.push([i, j]);
      const chosen = r.sample(pairs, r.int(V - 1, Math.min(pairs.length, V + 1)));
      const adj = Array.from({ length: V }, () => Array(V).fill(0));
      chosen.forEach(([i, j]) => { adj[i][j] = 1; });
      const count = () => { let total = V; const num = Array(V).fill(0); for (let s = 0; s < V; s++) { const cnt = Array(V).fill(0); cnt[s] = 1; for (let j = s; j < V; j++) for (let k = j + 1; k < V; k++) if (adj[j][k]) cnt[k] += cnt[j]; for (let j = s + 1; j < V; j++) total += cnt[j]; } return total; };
      const total = count();
      const lab = 'ABCDE';
      return {
        q: [`A directed graph has vertices ${lab.slice(0, V).split('').map((c) => `$${c}$`).join(', ')} and edges ${chosen.sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(([i, j]) => `$${lab[i]} \\to ${lab[j]}$`).join(', ')}. The free category it generates has a path of any length as an arrow, including a length-0 path (identity) at each vertex. How many arrows does it have?`, `有向グラフの頂点は ${lab.slice(0, V).split('').map((c) => `$${c}$`).join('、')}、辺は ${chosen.map(([i, j]) => `$${lab[i]} \\to ${lab[j]}$`).join('、')} です。このグラフが生成する自由圏では、任意の長さの道が射で、各頂点の長さ 0 の道が恒等射です。射は全部でいくつありますか。`],
        a: { type: 'int', v: total },
        hint: ['Count paths by their source. Each path of length 0 is an identity; longer paths are chains of edges.', '始点ごとに道を数えます。長さ 0 の道は恒等射で、それより長い道は辺の連なりです。'],
        sol: [[`There are ${V} identities. The longer paths, counted by source and target, add ${total - V} more (the graph has no cycles, so every path is finite and there are finitely many).`, `恒等射は ${V} 個です。始点と終点ごとに数えると、長い道がさらに ${total - V} 本あります（グラフに閉路がないので、道は有限で本数も有限です）。`], [`In total ${total} arrows. A graph is not yet a category: the free category adds the identities and all composites, and associativity holds automatically because joining paths is concatenation.`, `合わせて射は ${total} 個です。グラフはそのままでは圏ではありません。自由圏は恒等射とすべての合成を加えたもので、道の連結は結合的なので結合律は自動的に成り立ちます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(2, 4), c = r.int(2, 4), t = r.int(-3, 3);
        const b = (a - 1) * t, d = (c - 1) * t;
        // f = a x + b, g = c x + d' ; commute iff d'(a-1) = b(c-1). choose b random multiple; solve d'
        const b2 = (a - 1) * r.nz(-3, 3);
        const dsol = b2 * (c - 1) / (a - 1);
        return {
          q: [`Let $f(x) = ${lin(a, b2)}$ and $g(x) = ${c}x + d$. For which value of $d$ do $f \\circ g$ and $g \\circ f$ agree, so that $f$ and $g$ commute?`, `$f(x) = ${lin(a, b2)}$、$g(x) = ${c}x + d$ とします。$f \\circ g$ と $g \\circ f$ が一致して $f$ と $g$ が可換になるのは、$d$ がいくつのときですか。`],
          a: { type: 'num', v: dsol, tol: 1e-9 },
          hint: ['Compute both composites as linear functions and compare the constant terms (the slopes agree automatically).', '2 つの合成を 1 次関数として計算し、定数項を比べます（傾きは自動的に一致します）。'],
          sol: [[`$f(g(x)) = ${a}(${c}x + d) ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)} = ${a * c}x + ${a}d ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}$ and $g(f(x)) = ${c}(${lin(a, b2)}) + d = ${a * c}x + ${c * b2} + d$.`, `$f(g(x)) = ${a}(${c}x + d) ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)} = ${a * c}x + ${a}d ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}$、$g(f(x)) = ${c}(${lin(a, b2)}) + d = ${a * c}x + ${c * b2} + d$ です。`], [`Equal constants: $${a}d + (${b2}) = ${c * b2} + d$, so $${a - 1}\\,d = ${c * b2 - b2}$ and $d = ${dsol}$.`, `定数項が等しいので $${a}d + (${b2}) = ${c * b2} + d$ から $${a - 1}\\,d = ${c * b2 - b2}$、よって $d = ${dsol}$ です。`], ['Commuting is a special coincidence, not the rule. In general $d(a - 1) = b(c - 1)$ is the condition for these two affine maps.', '可換になるのは例外的な偶然で、一般的な性質ではありません。この 2 つのアフィン写像の条件は $d(a - 1) = b(c - 1)$ です。']],
        };
      }
      if (form === 1) {
        const k = r.int(0, 3), m = k + r.int(1, 4);
        return {
          q: [`A category has one object and one non-identity arrow $f : * \\to *$ generating everything, subject only to the law $f^{${m}} = f^{${k}}$ (where $f^0 = \\mathrm{id}$). How many distinct arrows does it have?`, `ある圏には対象が 1 つあり、恒等射以外の射 $f : * \\to *$ がすべてを生成します。法則は $f^{${m}} = f^{${k}}$ だけです（$f^0 = \\mathrm{id}$）。異なる射は全部でいくつありますか。`],
          a: { type: 'int', v: m },
          hint: ['List $f^0, f^1, f^2, \\dots$ and see where the law forces a repeat.', '$f^0, f^1, f^2, \\dots$ を並べて、法則がどこで重複を強いるかを見ます。'],
          sol: [[`The arrows are $f^0, f^1, \\dots$, and the law says $f^{${m}} = f^{${k}}$, so everything from $f^{${m}}$ on repeats an earlier arrow.`, `射は $f^0, f^1, \\dots$ で、法則 $f^{${m}} = f^{${k}}$ により $f^{${m}}$ 以降はすべて前の射の繰り返しです。`], [`The distinct arrows are $f^0, \\dots, f^{${m - 1}}$: ${m} of them. ${k === 0 ? 'Here $f$ is invertible, so this is a cyclic group.' : 'Here $f$ is not invertible, so this is a monoid but not a group.'} A one-object category is exactly a monoid.`, `異なる射は $f^0, \\dots, f^{${m - 1}}$ の ${m} 個です。${k === 0 ? 'この $f$ は可逆なので、巡回群です。' : 'この $f$ は可逆ではないので、モノイドですが群ではありません。'}対象が 1 つの圏はちょうどモノイドです。`]],
        };
      }
      const n = 3;
      const mode = r.int(0, 2);
      let tab = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
      if (mode === 1) tab = [[0, 0, 0], [0, 1, 1], [0, 1, 2]].map((row, i) => row.map((v, j) => Math.max(i, j)));
      if (mode === 2) tab = Array.from({ length: n }, () => Array.from({ length: n }, () => r.int(0, n - 1)));
      if (mode === 0 && r.chance(0.6)) { const i = r.int(0, 2), j = r.int(0, 2); tab[i][j] = (tab[i][j] + r.int(1, 2)) % 3; }
      let bad = 0; const eg = [];
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) if (tab[tab[x][y]][z] !== tab[x][tab[y][z]]) { bad++; if (eg.length < 1) eg.push([x, y, z]); }
      const L = 'abc';
      const arr = `\\begin{array}{c|ccc} * & a & b & c \\\\ \\hline ${tab.map((row, i) => `${L[i]} & ${row.map((v) => L[v]).join(' & ')}`).join(' \\\\ ')} \\end{array}`;
      return {
        q: [`A composition rule on three arrows is given by $${arr}$ (the entry in row $x$, column $y$ is $x * y$). For how many of the 27 triples $(x, y, z)$ does $(x * y) * z$ differ from $x * (y * z)$?`, `3 つの射の合成の規則が $${arr}$ で与えられています（行 $x$、列 $y$ の値が $x * y$）。27 通りの $(x, y, z)$ のうち、$(x * y) * z$ と $x * (y * z)$ が異なるものはいくつですか。`],
        a: { type: 'int', v: bad },
        hint: ['Check triples one at a time; stop being surprised if the count is zero, since some tables are associative.', '組を 1 つずつ調べます。結合的な表もあるので、答えが 0 でも驚く必要はありません。'],
        sol: [[bad ? `For example $(${L[eg[0][0]]} * ${L[eg[0][1]]}) * ${L[eg[0][2]]} = ${L[tab[tab[eg[0][0]][eg[0][1]]][eg[0][2]]]}$ but $${L[eg[0][0]]} * (${L[eg[0][1]]} * ${L[eg[0][2]]}) = ${L[tab[eg[0][0]][tab[eg[0][1]][eg[0][2]]]]}$.` : 'Every one of the 27 triples gives the same result both ways.', bad ? `たとえば $(${L[eg[0][0]]} * ${L[eg[0][1]]}) * ${L[eg[0][2]]} = ${L[tab[tab[eg[0][0]][eg[0][1]]][eg[0][2]]]}$ ですが、$${L[eg[0][0]]} * (${L[eg[0][1]]} * ${L[eg[0][2]]}) = ${L[tab[eg[0][0]][tab[eg[0][1]][eg[0][2]]]]}$ です。` : '27 通りの組すべてで、どちらの括弧づけでも同じ結果になります。'], [bad ? `In all, ${bad} triple${bad === 1 ? '' : 's'} fail, so this rule is not associative and cannot be the composition of a category.` : 'The rule is associative, so it satisfies the first law of a category (it still needs identities for the second).', bad ? `合計 ${bad} 組で失敗するので、この規則は結合的ではなく、圏の合成にはなれません。` : 'この規則は結合的なので圏の第 1 の法則を満たします（第 2 の法則には恒等射が別に必要です）。']],
      };
    },
  ];

  /* ---------- functors between posets, monoids ---------- */
  const monoMaps = (srcN, rel, tgtN, strict) => {
    let cnt = 0; const total = Math.pow(tgtN, srcN);
    for (let code = 0; code < total; code++) {
      const f = []; let c = code; for (let i = 0; i < srcN; i++) { f.push(c % tgtN); c = Math.floor(c / tgtN); }
      if (rel.every(([a, b]) => (strict ? f[a] < f[b] : f[a] <= f[b]))) cnt++;
    }
    return cnt;
  };
  const chainRel = (m) => { const rel = []; for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) rel.push([i, j]); return rel; };
  const POSETS = [
    { n: 3, rel: [[0, 2], [1, 2]], en: 'the poset on $a, b, c$ with $a \\le c$ and $b \\le c$ (and nothing else besides identities)', ja: '$a \\le c$ と $b \\le c$ だけ（恒等射を除く）が成り立つ $a, b, c$ 上の半順序集合' },
    { n: 3, rel: [[2, 0], [2, 1]], en: 'the poset on $a, b, c$ with $c \\le a$ and $c \\le b$ (and nothing else besides identities)', ja: '$c \\le a$ と $c \\le b$ だけ（恒等射を除く）が成り立つ $a, b, c$ 上の半順序集合' },
    { n: 4, rel: [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3]], en: 'the diamond poset on $a, b, c, d$ with $a \\le b \\le d$ and $a \\le c \\le d$ ($b$ and $c$ incomparable)', ja: '$a \\le b \\le d$ と $a \\le c \\le d$ をもつ（$b$ と $c$ は比較できない）菱形の半順序集合' },
    { n: 4, rel: [[0, 2], [1, 2], [1, 3]], en: 'the zigzag poset on $a, b, c, d$ with $a \\le c$, $b \\le c$ and $b \\le d$ (and nothing else besides identities)', ja: '$a \\le c$、$b \\le c$、$b \\le d$ だけ（恒等射を除く）が成り立つ $a, b, c, d$ 上のジグザグの半順序集合' },
    { n: 2, rel: [], en: 'the poset on $a, b$ with $a$ and $b$ incomparable', ja: '$a$ と $b$ が比較できない $a, b$ 上の半順序集合' },
  ];

  Q['category-theory-functors'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const n = r.int(3, 5);
        const F = [r.int(0, n), r.int(0, n), r.int(0, n)];
        const ok = F[0] <= F[1] && F[1] <= F[2];
        const bad = F[0] > F[1] ? [0, 1] : [1, 2];
        return {
          q: [`Between the poset categories $0 \\le 1 \\le 2$ and $${chainTeX(n + 1)}$, the assignment $F(0) = ${F[0]}$, $F(1) = ${F[1]}$, $F(2) = ${F[2]}$ is proposed. Can it be extended to a functor?`, `半順序集合の圏 $0 \\le 1 \\le 2$ から $${chainTeX(n + 1)}$ への対応 $F(0) = ${F[0]}$、$F(1) = ${F[1]}$、$F(2) = ${F[2]}$ が提案されました。これは関手に拡張できますか。`],
          a: { type: 'choice', fixed: true, v: ok ? 0 : 1, opts: [['Yes, it is monotone', 'はい、単調です'], ['No, it reverses an order relation', 'いいえ、順序関係を逆にします']] },
          hint: ['A functor must send every arrow $a \\to b$ (that is, $a \\le b$) to an arrow $F(a) \\to F(b)$.', '関手は、すべての射 $a \\to b$（つまり $a \\le b$）を射 $F(a) \\to F(b)$ に移さなければなりません。'],
          sol: [[ok ? `$${F[0]} \\le ${F[1]} \\le ${F[2]}$, so each arrow $a \\le b$ goes to an arrow $F(a) \\le F(b)$.` : `The arrow $${bad[0]} \\to ${bad[1]}$ would go to $${F[bad[0]]} \\to ${F[bad[1]]}$, but the target has no such arrow because $${F[bad[0]]} > ${F[bad[1]]}$.`, ok ? `$${F[0]} \\le ${F[1]} \\le ${F[2]}$ なので、各射 $a \\le b$ は射 $F(a) \\le F(b)$ に移ります。` : `射 $${bad[0]} \\to ${bad[1]}$ は $${F[bad[0]]} \\to ${F[bad[1]]}$ に移るはずですが、$${F[bad[0]]} > ${F[bad[1]]}$ なので終域にその射はありません。`], [ok ? 'Composites and identities are preserved automatically, because between posets there is at most one arrow in each hom-set. So a functor between posets is exactly a monotone map.' : 'So no functor has these values on objects. A functor between posets is exactly a monotone map.', ok ? '半順序集合の間では射の集合が高々 1 個なので、合成と恒等射は自動的に保たれます。したがって半順序集合の間の関手は、ちょうど単調写像です。' : '以上より、この対象の対応をもつ関手はありません。半順序集合の間の関手は、ちょうど単調写像です。']],
        };
      }
      if (form === 1) {
        const mode = r.int(0, 1);
        if (mode === 0) {
          const n = r.int(3, 9);
          return {
            q: [`The chain $${chainTeX(n)}$ is a category with one arrow $a \\to b$ whenever $a \\le b$. How many arrows does it have in total, counting identities?`, `鎖 $${chainTeX(n)}$ は、$a \\le b$ のたびに射 $a \\to b$ が 1 本ある圏です。恒等射を含めて、射は全部でいくつありますか。`],
            a: { type: 'int', v: n * (n + 1) / 2 },
            hint: ['Count pairs $(a, b)$ with $a \\le b$.', '$a \\le b$ となる組 $(a, b)$ を数えます。'],
            sol: [[`There are ${n} identities and $\\binom{${n}}{2} = ${n * (n - 1) / 2}$ arrows with $a < b$.`, `恒等射が ${n} 本、$a < b$ の射が $\\binom{${n}}{2} = ${n * (n - 1) / 2}$ 本あります。`], [`The total is $${n}(${n}+1)/2 = ${n * (n + 1) / 2}$. Every non-identity arrow is a composite of the ${n - 1} generating ones.`, `合計は $${n}(${n}+1)/2 = ${n * (n + 1) / 2}$ 本です。恒等射以外の射はすべて、${n - 1} 本の生成射の合成です。`]],
          };
        }
        const N = r.pick([12, 18, 20, 24, 30, 36, 45]);
        const ds = []; for (let d = 1; d <= N; d++) if (N % d === 0) ds.push(d);
        let cnt = 0; for (const a of ds) for (const b of ds) if (b % a === 0) cnt++;
        return {
          q: [`Let $D_{${N}}$ be the divisors of ${N}, with one arrow $a \\to b$ whenever $a$ divides $b$. How many arrows does this category have, counting identities?`, `${N} の約数全体 $D_{${N}}$ を、$a$ が $b$ を割り切るとき射 $a \\to b$ が 1 本ある圏とみなします。恒等射を含めて、射は全部でいくつありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Count the pairs $(a, b)$ of divisors with $a \\mid b$.', '約数の組 $(a, b)$ で $a \\mid b$ となるものを数えます。'],
          sol: [[`The divisors are ${ds.join(', ')} (${ds.length} objects).`, `約数は ${ds.join('、')} の ${ds.length} 個です。`], [`Counting pairs with $a \\mid b$ gives ${cnt}, of which ${ds.length} are identities. Divisibility is reflexive, antisymmetric and transitive, so this is a poset and hence a category.`, `$a \\mid b$ となる組は ${cnt} 個で、そのうち ${ds.length} 個が恒等射です。整除は反射的・反対称的・推移的なので半順序集合であり、したがって圏です。`]],
        };
      }
      const k = r.int(2, 4), m = r.int(2, 4), a = r.int(0, m - 1), b = a + r.int(1, 3);
      return {
        q: [`The functor $F$ from the chain $${chainTeX(m + 1)}$ to the chain $${chainTeX(m * k + 1)}$ is given by $F(i) = ${k}i$. Which arrow does $F$ send the arrow $${a} \\to ${b > m ? m : b}$ to? Give the source and target of $F$ of that arrow.`, `鎖 $${chainTeX(m + 1)}$ から鎖 $${chainTeX(m * k + 1)}$ への関手 $F$ を $F(i) = ${k}i$ で定めます。$F$ は射 $${a} \\to ${b > m ? m : b}$ をどの射に移しますか。移した射の始域と終域を答えてください。`],
        a: { type: 'tuple', v: [k * a, k * Math.min(b, m)], labels: [['source', '始域'], ['target', '終域']] },
        hint: ['A functor sends the arrow $a \\to b$ to the arrow $F(a) \\to F(b)$.', '関手は射 $a \\to b$ を射 $F(a) \\to F(b)$ に移します。'],
        sol: [[`$F(${a}) = ${k * a}$ and $F(${Math.min(b, m)}) = ${k * Math.min(b, m)}$.`, `$F(${a}) = ${k * a}$、$F(${Math.min(b, m)}) = ${k * Math.min(b, m)}$ です。`], [`So the arrow goes to $${k * a} \\to ${k * Math.min(b, m)}$, which exists because $${k * a} \\le ${k * Math.min(b, m)}$. A functor acts on arrows as well as on objects.`, `したがって射は $${k * a} \\to ${k * Math.min(b, m)}$ に移ります。$${k * a} \\le ${k * Math.min(b, m)}$ なのでこの射が存在します。関手は対象だけでなく射にも作用します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(2, 4), n = r.int(2, 6);
        const v = monoMaps(m, chainRel(m), n, false);
        return {
          q: [`How many functors are there from the chain $${chainTeX(m)}$ (${m} objects) to the chain $${chainTeX(n)}$ (${n} objects)?`, `鎖 $${chainTeX(m)}$（対象 ${m} 個）から鎖 $${chainTeX(n)}$（対象 ${n} 個）への関手はいくつありますか。`],
          a: { type: 'int', v },
          hint: ['Functors between posets are monotone maps. Count non-decreasing sequences $F(0) \\le F(1) \\le \\dots$.', '半順序集合の間の関手は単調写像です。非減少列 $F(0) \\le F(1) \\le \\dots$ を数えます。'],
          sol: [[`A functor is a non-decreasing sequence of ${m} values in $\\{0, \\dots, ${n - 1}\\}$.`, `関手は、$\\{0, \\dots, ${n - 1}\\}$ の値をとる長さ ${m} の非減少列です。`], [`Choosing a multiset of size ${m} from ${n} values gives $\\binom{${n + m - 1}}{${m}} = ${v}$. Collapsing several objects to one is allowed, so these include non-injective functors.`, `${n} 個の値から重複を許して ${m} 個選ぶ方法の数は $\\binom{${n + m - 1}}{${m}} = ${v}$ です。複数の対象を 1 つに潰してもよいので、単射でない関手も含まれます。`]],
        };
      }
      if (form === 1) {
        const n = r.int(3, 8), a = r.int(0, n - 1), b = r.int(0, n - 1);
        const v = b >= a ? b - a + 1 : 0;
        return {
          q: [`A functor $F$ from $0 \\le 1 \\le 2$ to $${chainTeX(n)}$ has $F(0) = ${a}$ and $F(2) = ${b}$. How many choices are there for $F(1)$?`, `関手 $F$ : $0 \\le 1 \\le 2$ → $${chainTeX(n)}$ について、$F(0) = ${a}$、$F(2) = ${b}$ です。$F(1)$ の選び方は何通りですか。`],
          a: { type: 'int', v },
          hint: ['The arrows $0 \\to 1$ and $1 \\to 2$ force $F(0) \\le F(1) \\le F(2)$.', '射 $0 \\to 1$ と $1 \\to 2$ から $F(0) \\le F(1) \\le F(2)$ が従います。'],
          sol: [[`We need $${a} \\le F(1) \\le ${b}$.`, `$${a} \\le F(1) \\le ${b}$ が必要です。`], [v ? `The integers from ${a} to ${b} give ${v} choice${v === 1 ? '' : 's'}.` : `Since $${a} > ${b}$, no value fits: the composite $0 \\to 2$ would have to go to a backwards arrow, so no such functor exists.`, v ? `${a} から ${b} までの整数が ${v} 通りです。` : `$${a} > ${b}$ なので値がありません。合成 $0 \\to 2$ が逆向きの射に移ることになり、そのような関手は存在しません。`]],
        };
      }
      const m = r.int(2, 4), n = r.int(m, 7);
      const v = choose(n, m);
      return {
        q: [`How many functors from the chain with ${m} objects to the chain with ${n} objects are injective on objects?`, `対象が ${m} 個の鎖から対象が ${n} 個の鎖への関手のうち、対象について単射なものはいくつありますか。`],
        a: { type: 'int', v },
        hint: ['An injective monotone map is strictly increasing. Choose which ones are hit.', '単射な単調写像は狭義単調増加です。どの対象が像になるかを選びます。'],
        sol: [[`A strictly increasing map is determined by its set of ${m} values, chosen from ${n}.`, `狭義単調増加な写像は、${n} 個から選んだ ${m} 個の値の集合で決まります。`], [`That is $\\binom{${n}}{${m}} = ${v}$, since the order then fixes which value goes to which object.`, `順序によってどの値がどの対象に対応するかが決まるので、$\\binom{${n}}{${m}} = ${v}$ 通りです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const po = r.pick(POSETS), n = r.int(2, 4);
        const v = monoMaps(po.n, po.rel, n, false);
        return {
          q: [`Take ${po.en}, viewed as a category. How many functors are there from it to the chain $${chainTeX(n)}$?`, `${po.ja}を圏とみなします。そこから鎖 $${chainTeX(n)}$ への関手はいくつありますか。`],
          a: { type: 'int', v },
          hint: ['Functors are monotone maps. Count assignments of values to elements that respect every relation.', '関手は単調写像です。すべての関係を保つように、各要素に値を割り当てる方法を数えます。'],
          sol: [[`Enumerating all $${n}^{${po.n}} = ${Math.pow(n, po.n)}$ assignments and keeping those with $F(x) \\le F(y)$ whenever $x \\le y$ leaves ${v}.`, `$${n}^{${po.n}} = ${Math.pow(n, po.n)}$ 通りの割り当てをすべて調べ、$x \\le y$ のとき $F(x) \\le F(y)$ となるものを残すと ${v} 通りです。`], [`So there are ${v} functors. The more relations the source has, the fewer functors it admits: the discrete two-point category admits all $${n}^2$.`, `したがって関手は ${v} 個です。始域の関係が多いほど関手は少なくなり、離散的な 2 点の圏ではすべての $${n}^2$ 通りが関手になります。`]],
        };
      }
      const m = r.int(2, 12), n = r.int(2, 12);
      let cnt = 0; for (let x = 0; x < n; x++) if ((m * x) % n === 0) cnt++;
      return {
        q: [`The cyclic group $\\mathbb Z/${m}$ is a category with one object and ${m} arrows (all invertible). How many functors are there from $\\mathbb Z/${m}$ to $\\mathbb Z/${n}$ (that is, group homomorphisms)?`, `巡回群 $\\mathbb Z/${m}$ は、対象が 1 つで射が ${m} 本（すべて可逆）の圏です。$\\mathbb Z/${m}$ から $\\mathbb Z/${n}$ への関手（つまり群準同型）はいくつありますか。`],
        a: { type: 'int', v: cnt },
        hint: ['A functor is determined by where it sends the generator $1$. Which targets $x$ are allowed?', '関手は生成元 $1$ の行き先で決まります。行き先 $x$ として許されるのはどれでしょうか。'],
        sol: [[`The generator must go to some $x \\in \\mathbb Z/${n}$ with $${m}x = 0$, since $1$ added ${m} times is the identity.`, `生成元の行き先 $x \\in \\mathbb Z/${n}$ は、$1$ を ${m} 回合成すると恒等射になるので、$${m}x = 0$ を満たす必要があります。`], [`Counting such $x$ gives ${cnt}, which equals $\\gcd(${m}, ${n}) = ${gcd(m, n)}$. Functors out of a one-object category remember only where the generators go and which relations they keep.`, `そのような $x$ は ${cnt} 個で、$\\gcd(${m}, ${n}) = ${gcd(m, n)}$ に等しくなります。対象が 1 つの圏からの関手は、生成元の行き先と、関係が保たれるかどうかだけで決まります。`]],
      };
    },
  ];

  /* ---------- universal properties ---------- */
  Q['category-theory-universal'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(2, 6), b = r.int(2, 6), t = r.int(0, 1);
        return {
          q: t === 0 ? [`In the category of sets, $A$ has ${a} elements and $B$ has ${b}. How many elements does the product $A \\times B$ have?`, `集合の圏で、$A$ の要素は ${a} 個、$B$ の要素は ${b} 個です。積 $A \\times B$ の要素は何個ですか。`] : [`$A$ has ${a} elements and $B$ has ${b}. For a fixed $a_0 \\in A$, how many elements $(a, b)$ of $A \\times B$ satisfy $\\pi_A(a, b) = a_0$?`, `$A$ の要素は ${a} 個、$B$ の要素は ${b} 個です。$A$ の固定した要素 $a_0$ に対し、$\\pi_A(a, b) = a_0$ を満たす $A \\times B$ の要素 $(a, b)$ はいくつですか。`],
          a: { type: 'int', v: t === 0 ? a * b : b },
          hint: t === 0 ? ['Elements of the product are pairs.', '積の要素は順序対です。'] : ['The first coordinate is pinned to $a_0$; the second is free.', '第 1 成分は $a_0$ に固定され、第 2 成分は自由です。'],
          sol: t === 0 ? [[`A pair picks one element of each: $${a} \\cdot ${b} = ${a * b}$.`, `組は各集合から要素を 1 つずつ選んだものなので、$${a} \\cdot ${b} = ${a * b}$ です。`], ['The projections $\\pi_A$ and $\\pi_B$ read off the two coordinates.', '射影 $\\pi_A$、$\\pi_B$ は 2 つの成分を読み取ります。']] : [[`The elements are $(a_0, b)$ with $b$ any of the ${b} elements of $B$.`, `要素は $(a_0, b)$ の形で、$b$ は $B$ の ${b} 個のどれでもよいです。`], [`So the fibre of $\\pi_A$ over each point has ${b} elements, and ${a} fibres of size ${b} make up the ${a * b} elements of the product.`, `したがって $\\pi_A$ の各点の上のファイバーは ${b} 個の要素をもち、大きさ ${b} のファイバーが ${a} 個で積の ${a * b} 個の要素になります。`]],
        };
      }
      if (form === 1) {
        const al = r.int(-3, 4), be = r.int(1, 3), x0 = r.int(-3, 3);
        return {
          q: [`Let $p(x) = x + ${al < 0 ? '(' + al + ')' : al}$ and $q(x) = ${be === 1 ? '' : be}x^2$ be functions $\\mathbb R \\to \\mathbb R$. The pairing $\\langle p, q \\rangle : \\mathbb R \\to \\mathbb R \\times \\mathbb R$ is the unique map with $\\pi_1 \\circ \\langle p, q \\rangle = p$ and $\\pi_2 \\circ \\langle p, q \\rangle = q$. Find $\\langle p, q \\rangle(${x0})$.`, `$p(x) = x + ${al < 0 ? '(' + al + ')' : al}$、$q(x) = ${be === 1 ? '' : be}x^2$ を $\\mathbb R \\to \\mathbb R$ の関数とします。対 $\\langle p, q \\rangle : \\mathbb R \\to \\mathbb R \\times \\mathbb R$ は、$\\pi_1 \\circ \\langle p, q \\rangle = p$ と $\\pi_2 \\circ \\langle p, q \\rangle = q$ を満たす唯一の写像です。$\\langle p, q \\rangle(${x0})$ を求めてください。`],
          a: { type: 'tuple', v: [x0 + al, be * x0 * x0], labels: [['first coordinate', '第 1 成分'], ['second coordinate', '第 2 成分']] },
          hint: ['The two projections must return $p$ and $q$, which leaves no freedom in the two coordinates.', '2 つの射影が $p$ と $q$ を返さなければならないので、2 つの成分に自由度はありません。'],
          sol: [[`The first coordinate is $p(${x0}) = ${x0 + al}$, and the second is $q(${x0}) = ${be * x0 * x0}$.`, `第 1 成分は $p(${x0}) = ${x0 + al}$、第 2 成分は $q(${x0}) = ${be * x0 * x0}$ です。`], [`So $\\langle p, q \\rangle(${x0}) = (${x0 + al}, ${be * x0 * x0})$. In Set the map is forced to be $x \\mapsto (p(x), q(x))$, which is the "exactly one" in the universal property.`, `したがって $\\langle p, q \\rangle(${x0}) = (${x0 + al}, ${be * x0 * x0})$ です。Set ではこの写像は $x \\mapsto (p(x), q(x))$ に決まってしまい、これが普遍性の「ただ 1 つ」にあたります。`]],
        };
      }
      const n = r.int(0, 5), dir = r.int(0, 1);
      return {
        q: dir === 0 ? [`In the category of sets, how many arrows are there from a set with ${els(n)} to a one-point set $1$?`, `集合の圏で、要素が ${n} 個の集合から 1 点集合 $1$ への射はいくつありますか。`] : [`In the category of sets, how many arrows are there from a one-point set $1$ to a set with ${els(n)}?`, `集合の圏で、1 点集合 $1$ から要素が ${n} 個の集合への射はいくつありますか。`],
        a: { type: 'int', v: dir === 0 ? 1 : n },
        hint: dir === 0 ? ['Each element must go to the single point.', '各要素は唯一の点に移るしかありません。'] : ['The image of the single point is a choice of one element.', '1 点の行き先は、要素を 1 つ選ぶことです。'],
        sol: dir === 0 ? [['Every element is sent to the one point, so there is exactly one such function, even when the set is empty.', 'すべての要素が唯一の点に移るので、そのような関数はちょうど 1 つです。集合が空でも同じです。'], ['That is what "terminal object" means: exactly one arrow from every object.', 'これが「終対象」の意味です。どの対象からもちょうど 1 本の射が出ます。']] : [[`An arrow $1 \\to X$ picks the image of the one point, an element of $X$: ${n} choices.`, `射 $1 \\to X$ は 1 点の行き先、つまり $X$ の要素を選ぶことなので、${n} 通りです。`], ['Elements of a set are the same thing as arrows out of the one-point set. This is how category theory recovers "elements" from arrows.', '集合の要素は、1 点集合から出る射と同じものです。圏論はこうして射から「要素」を取り戻します。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.int(1, 4), a = r.int(2, 3), b = r.int(2, 3), kind = r.int(0, 2);
        const v = kind === 0 ? Math.pow(a * b, x) : kind === 1 ? Math.pow(b, x) : 1;
        return {
          q: [`Let $|X| = ${x}$, $|A| = ${a}$ and $|B| = ${b}$. ${kind === 0 ? 'How many functions $h : X \\to A \\times B$ are there?' : kind === 1 ? 'Fix a function $p : X \\to A$. How many functions $h : X \\to A \\times B$ satisfy $\\pi_A \\circ h = p$?' : 'Fix functions $p : X \\to A$ and $q : X \\to B$. How many functions $h : X \\to A \\times B$ satisfy both $\\pi_A \\circ h = p$ and $\\pi_B \\circ h = q$?'}`, `$|X| = ${x}$、$|A| = ${a}$、$|B| = ${b}$ とします。${kind === 0 ? '関数 $h : X \\to A \\times B$ はいくつありますか。' : kind === 1 ? '関数 $p : X \\to A$ を固定します。$\\pi_A \\circ h = p$ を満たす関数 $h : X \\to A \\times B$ はいくつありますか。' : '関数 $p : X \\to A$ と $q : X \\to B$ を固定します。$\\pi_A \\circ h = p$ と $\\pi_B \\circ h = q$ をともに満たす関数 $h : X \\to A \\times B$ はいくつありますか。'}`],
          a: { type: 'int', v },
          hint: ['A function $h$ into $A \\times B$ chooses a pair for every element of $X$. Which parts of each pair are already forced?', '$A \\times B$ への関数 $h$ は、$X$ の各要素に対して組を 1 つ選びます。各組のどの部分がすでに決まっているでしょうか。'],
          sol: kind === 0
            ? [[`Each of the ${x} inputs chooses one of $${a} \\cdot ${b} = ${a * b}$ pairs: $${a * b}^{${x}}$.`, `${x} 個の入力それぞれが $${a} \\cdot ${b} = ${a * b}$ 個の組から 1 つを選ぶので $${a * b}^{${x}}$ です。`], [`That is ${v}, which equals $|A|^{${x}} \\cdot |B|^{${x}}$: a map into the product is a pair of maps $(p, q)$, one into each factor.`, `${v} 個で、これは $|A|^{${x}} \\cdot |B|^{${x}}$ に等しくなります。積への写像は、各因子への写像の組 $(p, q)$ です。`]]
            : kind === 1
              ? [[`The first coordinate of each $h(x)$ is forced to be $p(x)$. Only the second coordinate is free: ${b} choices for each of the ${x} inputs.`, `各 $h(x)$ の第 1 成分は $p(x)$ に決まります。自由なのは第 2 成分だけで、${x} 個の入力それぞれに ${b} 通りです。`], [`So there are $${b}^{${x}} = ${v}$ such maps, one for each possible $q : X \\to B$.`, `したがってそのような写像は $${b}^{${x}} = ${v}$ 個で、$q : X \\to B$ の選び方 1 つにつき 1 個です。`]]
              : [[`Both coordinates of every $h(x)$ are forced: $h(x) = (p(x), q(x))$.`, `すべての $h(x)$ の両方の成分が決まり、$h(x) = (p(x), q(x))$ です。`], ['So there is exactly one such map, $\\langle p, q \\rangle$. This is the universal property of the product: existence and uniqueness.', 'したがってそのような写像は $\\langle p, q \\rangle$ ただ 1 つです。これが積の普遍性、つまり存在と一意性です。']],
        };
      }
      if (form === 1) {
        const a = r.int(2, 4), b = r.int(-2, 3), x0 = r.int(-3, 3), shift = r.chance(0.5);
        const f = (x) => a * x + b;
        const route1 = shift ? [f(x0), f(x0 + 1)] : [f(x0), f(x0)];
        const route2 = shift ? [f(x0), f(x0) + 1] : [f(x0), f(x0)];
        return {
          q: shift
            ? [`Let $f(x) = ${lin(a, b)}$ and $\\eta(x) = (x, x + 1)$ (a candidate natural transformation from the identity to the "squaring" functor $D(X) = X \\times X$, $D(f) = f \\times f$). Compute both routes at $x = ${x0}$: first apply $\\eta$ then $D(f)$, and first apply $f$ then $\\eta$. Give the second coordinates of the two results.`, `$f(x) = ${lin(a, b)}$、$\\eta(x) = (x, x + 1)$ とします（恒等関手から $D(X) = X \\times X$、$D(f) = f \\times f$ で定まる関手への自然変換の候補です）。$x = ${x0}$ で 2 つの道を計算します。$\\eta$ のあとに $D(f)$ を適用する道と、$f$ のあとに $\\eta$ を適用する道です。2 つの結果の第 2 成分を答えてください。`]
            : [`Let $f(x) = ${lin(a, b)}$ and $\\Delta(x) = (x, x)$. Compute both routes at $x = ${x0}$: first $\\Delta$ then $f \\times f$, and first $f$ then $\\Delta$. Give the second coordinates of the two results.`, `$f(x) = ${lin(a, b)}$、$\\Delta(x) = (x, x)$ とします。$x = ${x0}$ で 2 つの道を計算します。$\\Delta$ のあとに $f \\times f$ を適用する道と、$f$ のあとに $\\Delta$ を適用する道です。2 つの結果の第 2 成分を答えてください。`],
          a: { type: 'tuple', v: [route1[1], route2[1]], labels: [['route 1 (copy first)', '道 1（先に複製）'], ['route 2 (map first)', '道 2（先に写像）']] },
          hint: shift ? ['Route 1 gives $(f(x), f(x+1))$. Route 2 gives $(f(x), f(x) + 1)$.', '道 1 は $(f(x), f(x+1))$、道 2 は $(f(x), f(x) + 1)$ です。'] : ['In both routes you are just copying the value $f(x)$.', 'どちらの道も、値 $f(x)$ を複製するだけです。'],
          sol: shift
            ? [[`Route 1: $\\eta(${x0}) = (${x0}, ${x0 + 1})$, then $f \\times f$ gives $(${f(x0)}, ${f(x0 + 1)})$. Route 2: $f(${x0}) = ${f(x0)}$, then $\\eta$ gives $(${f(x0)}, ${f(x0) + 1})$.`, `道 1：$\\eta(${x0}) = (${x0}, ${x0 + 1})$ に $f \\times f$ を適用して $(${f(x0)}, ${f(x0 + 1)})$。道 2：$f(${x0}) = ${f(x0)}$ に $\\eta$ を適用して $(${f(x0)}, ${f(x0) + 1})$。`], [`The second coordinates are ${route1[1]} and ${route2[1]}${route1[1] === route2[1] ? ', which happen to agree here. Naturality needs agreement for every $f$ and every $x$, and this $\\eta$ fails already for $f(x) = 2x$.' : ', which differ, so naturality fails. One disagreement is enough to reject a natural transformation.'}`, `第 2 成分は ${route1[1]} と ${route2[1]} で${route1[1] === route2[1] ? '、ここでは偶然一致します。自然性はすべての $f$ とすべての $x$ で一致することを要求し、この $\\eta$ は $f(x) = 2x$ ですでに失敗します。' : '、一致しないので自然性は成り立ちません。反例が 1 つあれば自然変換でないと言えます。'}`]]
            : [[`Route 1: $(${x0}, ${x0}) \\mapsto (${f(x0)}, ${f(x0)})$. Route 2: $${f(x0)} \\mapsto (${f(x0)}, ${f(x0)})$.`, `道 1：$(${x0}, ${x0}) \\mapsto (${f(x0)}, ${f(x0)})$。道 2：$${f(x0)} \\mapsto (${f(x0)}, ${f(x0)})$ です。`], [`Both second coordinates are ${f(x0)}. For the diagonal this happens for every $f$ and every $x$, because both routes compute $(f(x), f(x))$: that is naturality of $\\Delta$.`, `どちらの第 2 成分も ${f(x0)} です。対角写像では、どの $f$、どの $x$ でも両方の道が $(f(x), f(x))$ を計算するので一致します。これが $\\Delta$ の自然性です。`]],
        };
      }
      const A = r.int(1, 3), B = r.int(1, 3), X = r.int(2, 3);
      return {
        q: [`The coproduct (disjoint union) $A + B$ of sets with ${A} and ${B} elements has ${A + B} elements. How many functions $A + B \\to X$ are there when $|X| = ${X}$?`, `要素が ${A} 個と ${B} 個の集合 $A$、$B$ の余積（非交和）$A + B$ は ${A + B} 個の要素をもちます。$|X| = ${X}$ のとき、関数 $A + B \\to X$ はいくつありますか。`],
        a: { type: 'int', v: Math.pow(X, A + B) },
        hint: ['Each element of the disjoint union picks an output independently.', '非交和の各要素が、独立に出力を選びます。'],
        sol: [[`There are ${A + B} elements, each with ${X} possible outputs: $${X}^{${A + B}}$.`, `要素は ${A + B} 個で、それぞれ出力が ${X} 通りあるので $${X}^{${A + B}}$ です。`], [`That is ${Math.pow(X, A + B)} $= ${X}^{${A}} \\cdot ${X}^{${B}}$, the number of pairs (a map out of $A$, a map out of $B$). This is the universal property of the coproduct: arrows out of $A + B$ are pairs of arrows.`, `${Math.pow(X, A + B)} $= ${X}^{${A}} \\cdot ${X}^{${B}}$ で、($A$ からの写像, $B$ からの写像) の組の個数に等しくなります。これが余積の普遍性で、$A + B$ から出る射は射の組です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3]), b = r.pick([1, 2, 3].filter((x) => a * x <= 6)), which = r.int(0, 2);
        const n = a * b;
        const Pel = []; for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) Pel.push([i, j]);
        const Qel = []; for (let j = 0; j < b; j++) for (let i = 0; i < a; i++) Qel.push([j, i]);
        let cnt = 0;
        for (const pm of perms(n)) {
          let ok = true;
          for (let k = 0; k < n && ok; k++) {
            const [i, j] = Pel[k], [qj, qi] = Qel[pm[k]];
            if (which === 0 && qi !== i) ok = false;
            if (which === 1 && qj !== j) ok = false;
            if (which === 2 && (qi !== i || qj !== j)) ok = false;
          }
          if (ok) cnt++;
        }
        return {
          q: [`The products $A \\times B$ and $B \\times A$ (with $|A| = ${a}$, $|B| = ${b}$) are isomorphic. Among all ${n}! bijections $\\varphi : A \\times B \\to B \\times A$, how many ${which === 0 ? 'satisfy $\\pi_A \\circ \\varphi = \\pi_A$ (the $A$-coordinate is preserved)' : which === 1 ? 'satisfy $\\pi_B \\circ \\varphi = \\pi_B$ (the $B$-coordinate is preserved)' : 'preserve both coordinates'}?`, `積 $A \\times B$ と $B \\times A$（$|A| = ${a}$、$|B| = ${b}$）は同型です。${n}! 個の全単射 $\\varphi : A \\times B \\to B \\times A$ のうち、${which === 0 ? '$\\pi_A \\circ \\varphi = \\pi_A$（$A$ 成分を保つ）を満たすもの' : which === 1 ? '$\\pi_B \\circ \\varphi = \\pi_B$（$B$ 成分を保つ）を満たすもの' : '両方の成分を保つもの'}はいくつですか。`],
          a: { type: 'int', v: cnt },
          hint: ['Count the bijections that keep the named coordinate fixed: elements with the same coordinate value can be permuted among themselves.', '指定した成分を保つ全単射を数えます。その成分の値が同じ要素どうしは、互いに入れ替えられます。'],
          sol: [[which === 2 ? 'Preserving both coordinates leaves no freedom: $\\varphi(i, j) = (j, i)$ is forced.' : `Keeping one coordinate fixed splits the ${n} elements into ${which === 0 ? a : b} groups of ${which === 0 ? b : a}, and each group may be permuted freely: $(${which === 0 ? b : a}!)^{${which === 0 ? a : b}}$.`, which === 2 ? '両方の成分を保つと自由度はなく、$\\varphi(i, j) = (j, i)$ に決まります。' : `片方の成分を保つと、${n} 個の要素は大きさ ${which === 0 ? b : a} のグループ ${which === 0 ? a : b} 個に分かれ、各グループ内は自由に並べ替えられます。$(${which === 0 ? b : a}!)^{${which === 0 ? a : b}}$ です。`], [`The count is ${cnt}. Only the single bijection compatible with both projections is "the" isomorphism of the universal property: a product is unique up to a unique isomorphism commuting with the projections.`, `個数は ${cnt} です。両方の射影と両立する全単射はただ 1 つで、それが普遍性の同型です。積は、射影と可換な唯一の同型を除いて一意に定まります。`]],
        };
      }
      if (form === 1) {
        const a = r.nz(-2, 3), b = r.int(-2, 3);
        return {
          q: [`Let $f(x) = ${terms([[a, 'x^2'], [b, 'x']])}$ and $\\eta(x) = (x, x + 1)$. Along the two routes of the naturality square, the second coordinates are $f(x + 1)$ and $f(x) + 1$. Find their difference $f(x + 1) - f(x) - 1$ as a function of $x$.`, `$f(x) = ${terms([[a, 'x^2'], [b, 'x']])}$、$\\eta(x) = (x, x + 1)$ とします。自然性の四角形の 2 つの道の第 2 成分は $f(x + 1)$ と $f(x) + 1$ です。差 $f(x + 1) - f(x) - 1$ を $x$ の関数として求めてください。`],
          a: { type: 'expr', v: ex(2 * a, a + b - 1), vars: ['x'], dom: { x: [-3, 3] }, lhs: ['$f(x + 1) - f(x) - 1 =$', '$f(x + 1) - f(x) - 1 =$'] },
          hint: ['Expand $f(x + 1)$ and subtract.', '$f(x + 1)$ を展開して引きます。'],
          sol: [[`$f(x + 1) = ${terms([[a, '(x + 1)^2'], [b, '(x + 1)']])} = ${terms([[a, 'x^2'], [2 * a + b, 'x'], [a + b, '']])}$.`, `$f(x + 1) = ${terms([[a, '(x + 1)^2'], [b, '(x + 1)']])} = ${terms([[a, 'x^2'], [2 * a + b, 'x'], [a + b, '']])}$ です。`], [`Subtracting $f(x) + 1$ leaves $${terms([[2 * a, 'x'], [a + b - 1, '']])}$. It is not identically zero (the diagonal-like rule would need it to be), so $\\eta$ is not natural.`, `$f(x) + 1$ を引くと $${terms([[2 * a, 'x'], [a + b - 1, '']])}$ が残ります。これは恒等的には 0 でない（自然変換なら 0 でなければならない）ので、$\\eta$ は自然ではありません。`]],
        };
      }
      const A = r.int(1, 3), B = r.int(1, 3), Xs = r.int(2, 3);
      const left = Math.pow(Xs, A) * Math.pow(Xs, B);
      return {
        q: [`Let $|A| = ${A}$, $|B| = ${B}$ and $|X| = ${Xs}$. The "exponential" $X^A$ is the set of all functions $A \\to X$. How many elements does $X^A \\times X^B$ have?`, `$|A| = ${A}$、$|B| = ${B}$、$|X| = ${Xs}$ とします。「指数」$X^A$ は、関数 $A \\to X$ の集合です。$X^A \\times X^B$ の要素は何個ですか。`],
        a: { type: 'int', v: left },
        hint: ['Count $X^A$ and $X^B$ separately, then use the product rule.', '$X^A$ と $X^B$ を別々に数え、積の法則を使います。'],
        sol: [[`$|X^A| = ${Xs}^{${A}} = ${Math.pow(Xs, A)}$ and $|X^B| = ${Xs}^{${B}} = ${Math.pow(Xs, B)}$.`, `$|X^A| = ${Xs}^{${A}} = ${Math.pow(Xs, A)}$、$|X^B| = ${Xs}^{${B}} = ${Math.pow(Xs, B)}$ です。`], [`The product has ${left} elements, which is also $|X^{A + B}| = ${Xs}^{${A + B}}$: functions out of a disjoint union are pairs of functions. In category language, $X^A \\times X^B \\cong X^{A + B}$.`, `積の要素は ${left} 個で、これは $|X^{A + B}| = ${Xs}^{${A + B}}$ とも一致します。非交和から出る関数は関数の組です。圏の言葉では $X^A \\times X^B \\cong X^{A + B}$ です。`]],
      };
    },
  ];
})();
