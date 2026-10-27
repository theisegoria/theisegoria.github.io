'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { gcd, mat } = P.util;
  const sgnT = (s) => (s > 0 ? '+' : '-');
  const signed = (x) => (x > 0 ? `+${x}` : `${x}`);

  // integer polynomials, low degree first
  const pmul = (a, b) => { const c = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { c[i + j] += x * y; })); return c; };
  const pdiv = (a, b) => { const r = a.slice(), q = new Array(Math.max(1, a.length - b.length + 1)).fill(0), db = b.length - 1; for (let i = a.length - 1; i >= db; i--) { const c = r[i] / b[db]; q[i - db] = c; for (let j = 0; j <= db; j++) r[i - db + j] -= c * b[j]; } return q.map((x) => Math.round(x)); };
  const tn1 = (k) => { const a = new Array(k + 1).fill(0); a[0] = -1; a[k] = 1; return a; };
  const alexander = (p, q) => pdiv(pdiv(pmul(tn1(p * q), tn1(1)), tn1(p)), tn1(q)); // knots only: gcd(p, q) = 1
  const polyTeX = (c) => { let s = ''; for (let i = c.length - 1; i >= 0; i--) { const v = c[i]; if (!v) continue; const body = i === 0 ? String(Math.abs(v)) : (Math.abs(v) === 1 ? '' : Math.abs(v)) + (i === 1 ? 't' : `t^{${i}}`); s += v < 0 ? (s ? ' - ' : '-') + body : (s ? ' + ' : '') + body; } return s || '0'; };
  const polyExpr = (c) => c.map((v, i) => (v ? `${v >= 0 ? '+' : '-'}${Math.abs(v)}*t^${i}` : '')).join('').replace(/^\+/, '');
  const evalPoly = (c, t) => c.reduce((s, v, i) => s + v * t ** i, 0);
  const crossingNumber = (p, q) => Math.min(p * (q - 1), q * (p - 1));
  const coprime = (r, pr = [2, 7], qr = [2, 9]) => { let p, q; do { p = r.int(pr[0], pr[1]); q = r.int(qr[0], qr[1]); } while (gcd(p, q) !== 1 || p === q); return [p, q]; };
  const smallestFactor = (D) => { for (let k = 3; k <= D; k++) if (D % k === 0) return k; return null; };

  /* ---------- 1. Reidemeister moves ---------- */
  const MOVES = [['R1 (a kink)', 'R1（ねじり）'], ['R2 (a poke)', 'R2（差し込み）'], ['R3 (a slide)', 'R3（滑らせる）']];
  Q.reidemeister = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const want = r.int(0, 2), change = [1, 2, 0][want];
        return {
          q: [`Which Reidemeister move changes the number of crossings in a diagram by exactly ${['one', 'two', 'zero'][want]}?`, `図の交点の数をちょうど ${['1', '2', '0'][want]} だけ変える（${want === 2 ? '変えない' : '増やすか減らす'}）ライデマイスター移動はどれですか。`],
          a: { type: 'choice', opts: MOVES, v: want, fixed: true },
          hint: ['Picture each move: a loop twisted into a strand, two strands pushed over each other, a strand slid across a crossing.', 'それぞれの移動を思い浮かべてください。ひもにできる輪、重なり合う二本のひも、交点を越えて滑るひもです。'],
          sol: [['R1 adds or removes one kink (one crossing), R2 adds or removes two crossings of opposite sign, and R3 keeps all three crossings and only rearranges them.', 'R1 はねじり一つ（交点一つ）を増減し、R2 は符号が逆の交点二つを増減し、R3 は三つの交点を保ったまま並べ替えるだけです。'], [`So the change by exactly ${change} is ${MOVES[want][0]}.`, `したがって、ちょうど ${change} 変えるのは ${MOVES[want][1]} です。`]],
          set: { move: want },
        };
      }
      if (form === 1) {
        const w = r.int(-4, 6), s = r.sign();
        return {
          q: [`A diagram has writhe $${w}$. An R1 move adds a kink whose crossing has sign $${sgnT(s)}1$. What is the new writhe?`, `ライズが $${w}$ の図に、R1 移動で符号 $${sgnT(s)}1$ の交点をもつねじりを加えます。新しいライズはいくつですか。`],
          a: { type: 'int', v: w + s },
          hint: ['The writhe is the sum of the crossing signs.', 'ライズは交点の符号の和です。'],
          sol: [[`The other crossings are untouched, so the writhe becomes $${w} ${s > 0 ? '+' : '-'} 1 = ${w + s}$.`, `ほかの交点は変わらないので、ライズは $${w} ${s > 0 ? '+' : '-'} 1 = ${w + s}$ になります。`], ['The knot is the same, but the writhe moved: writhe is a property of the diagram, not an invariant of the knot.', '結び目は同じなのにライズは変わりました。ライズは結び目の不変量ではなく、図の性質です。']],
          set: { move: 0 },
        };
      }
      const k = r.int(4, 8), signs = Array.from({ length: k }, () => r.sign());
      const w = signs.reduce((a, b) => a + b, 0);
      return {
        q: [`A knot diagram has crossings with signs $${signs.map(sgnT).join(',\\ ')}$. What is its writhe?`, `結び目の図の交点の符号が $${signs.map(sgnT).join(',\\ ')}$ です。ライズはいくつですか。`],
        a: { type: 'int', v: w },
        hint: ['Add the signs: each positive crossing counts $+1$, each negative $-1$.', '符号を足します。正の交点は $+1$、負の交点は $-1$ です。'],
        sol: [[`${signs.filter((s) => s > 0).length} positive and ${signs.filter((s) => s < 0).length} negative crossings give $w = ${w}$.`, `正の交点 ${signs.filter((s) => s > 0).length} 個と負の交点 ${signs.filter((s) => s < 0).length} 個で $w = ${w}$ です。`], ['A crossing\'s sign does not depend on which way you look at the diagram, only on the orientation of the two strands, so $w$ is well defined for an oriented diagram.', '交点の符号は図の見方によらず二本のひもの向きだけで決まるので、向きのついた図に対して $w$ はきちんと定まります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const n0 = r.int(3, 8), w0 = r.int(-n0, n0), a = r.int(0, 3), b = r.int(0, 2), c = r.int(0, 3), m = r.int(0, a);
        const kinks = a, pos = a - m, n1 = n0 + kinks + 2 * b, w1 = w0 + pos - m;
        return {
          q: [`A diagram has ${n0} crossings and writhe $${w0}$. You perform ${kinks} R1 moves that each add a kink (${pos} positive, ${m} negative), ${b} R2 moves that each add two crossings, and ${c} R3 moves. Give the new crossing count and writhe.`, `交点 ${n0} 個、ライズ $${w0}$ の図に、ねじりを加える R1 移動を ${kinks} 回（正 ${pos} 回、負 ${m} 回）、交点を二つ加える R2 移動を ${b} 回、R3 移動を ${c} 回行います。新しい交点の数とライズを答えてください。`],
          a: { type: 'tuple', v: [n1, w1], labels: [['crossings', '交点の数'], ['writhe', 'ライズ']], tol: 0 },
          hint: ['Track the two moves separately: R2 adds one crossing of each sign; R3 changes nothing you are counting.', '移動ごとに追ってください。R2 は符号の違う交点を一つずつ加え、R3 は数えているものを何も変えません。'],
          sol: [[`Crossings: $${n0} + ${kinks} + 2\\cdot${b} = ${n1}$.`, `交点の数：$${n0} + ${kinks} + 2\\cdot${b} = ${n1}$ です。`], [`Writhe: the R2 pairs cancel, so $${w0} + ${pos} - ${m} = ${w1}$.`, `ライズ：R2 の対は打ち消し合うので $${w0} + ${pos} - ${m} = ${w1}$ です。`], ['Only R1 moves the writhe, which is why the Jones polynomial corrects the bracket by a power of $-A^3$ for each unit of writhe.', 'ライズを動かすのは R1 だけです。ジョーンズ多項式が、ライズ1につき $-A^3$ のべきでブラケットを補正するのはこのためです。']],
        };
      }
      if (form === 1) {
        const sh = Array.from({ length: r.int(2, 7) }, () => (r.chance(0.7) ? 1 : -1) * (r.chance(0.5) ? 1 : -1));
        if (sh.reduce((a, b) => a + b, 0) % 2) sh.push(r.sign());
        const tot2 = sh.reduce((a, b) => a + b, 0), self = Array.from({ length: r.int(1, 3) }, () => r.sign());
        return {
          q: [`A two-component link diagram has crossings between the two components with signs $${sh.map(sgnT).join(',\\ ')}$, and self-crossings of one component with signs $${self.map(sgnT).join(',\\ ')}$. What is the linking number?`, `二成分の絡み目の図で、二つの成分の間の交点の符号が $${sh.map(sgnT).join(',\\ ')}$、一方の成分の自己交点の符号が $${self.map(sgnT).join(',\\ ')}$ です。絡み数はいくつですか。`],
          a: { type: 'int', v: tot2 / 2 },
          hint: ['Use only the crossings between different components, and halve their sum.', '異なる成分どうしの交点だけを使い、その和を半分にします。'],
          sol: [[`The inter-component signs add to $${tot2}$; self-crossings are ignored.`, `成分間の符号の和は $${tot2}$ で、自己交点は使いません。`], [`$\\operatorname{lk} = ${tot2}/2 = ${tot2 / 2}$. Each Reidemeister move changes the inter-component sum by $0$ (R2 adds a $+$ and a $-$, R1 involves one component only), so this is an invariant of the link.`, `$\\operatorname{lk} = ${tot2}/2 = ${tot2 / 2}$ です。どのライデマイスター移動でも成分間の和は変わらない（R2 は $+$ と $-$ を一つずつ加え、R1 は一つの成分だけに関わる）ので、これは絡み目の不変量です。`]],
        };
      }
      const move = r.int(0, 2);
      const opts = [['the number of crossings and the writhe', '交点の数とライズ'], ['the number of crossings only', '交点の数だけ'], ['nothing that is counted here', 'ここで数えているものは何も変わらない'], ['the determinant', '行列式']];
      const v = [0, 1, 2][move];
      return {
        q: [`Under ${MOVES[move][0]}, which of these can change: the crossing count, the writhe, the determinant, the number of tricolourings?`, `${MOVES[move][1]} で変わりうるのはどれですか。交点の数、ライズ、行列式、三彩色の数のうちから選んでください。`],
        a: { type: 'choice', opts, v },
        hint: ['The determinant and the colouring count are knot invariants; the other two are read off the diagram.', '行列式と彩色の数は結び目の不変量です。他の二つは図から読み取る量です。'],
        sol: [[['R1 adds one crossing of sign $\\pm1$: both the count and the writhe move.', 'R2 adds a $+$ and a $-$ crossing: the count rises by two, the writhe stays.', 'R3 keeps every crossing and its sign.'][move], ['R1 は符号 $\\pm1$ の交点を一つ加えるので、数とライズの両方が動きます。', 'R2 は $+$ と $-$ の交点を一つずつ加えるので、数は 2 増え、ライズは変わりません。', 'R3 はすべての交点とその符号を保ちます。'][move]], ['The determinant and the tricolourings never change under any move; that is what makes them invariants, and the readout shows them flat throughout.', '行列式と三彩色の数はどの移動でも変わりません。それが不変量であるということで、読み取り欄でも移動の間ずっと一定です。']],
        set: { move },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 4), m = r.int(0, 4); if (k === m) return Q.reidemeister[2](r);
        const e = k - m;
        return {
          q: [`Kauffman's bracket satisfies $\\langle D'\\rangle = (-A^3)^{\\pm1}\\langle D\\rangle$ when $D'$ is $D$ with one extra kink of writhe $\\pm1$, and is unchanged by R2 and R3. After adding ${k} positive and ${m} negative kinks, $\\langle D\\rangle$ is multiplied by what factor?`, `カウフマンのブラケットは、$D'$ が $D$ にライズ $\\pm1$ のねじりを一つ加えた図のとき $\\langle D'\\rangle = (-A^3)^{\\pm1}\\langle D\\rangle$ を満たし、R2 と R3 では変わりません。正のねじりを ${k} 個、負のねじりを ${m} 個加えると、$\\langle D\\rangle$ は何倍になりますか。`],
          a: { type: 'expr', v: `(-A^3)^(${e})`, vars: ['A'], dom: { A: [0.5, 1.5] }, lhs: ['factor $=$', '倍率 $=$'] },
          hint: ['Each kink contributes its own factor, and the factors multiply.', 'ねじりごとに因子がかかり、それらが掛け合わされます。'],
          sol: [[`The factor is $(-A^3)^{${k}}(-A^3)^{-${m}} = (-A^3)^{${e}} = ${e % 2 ? '-' : ''}A^{${3 * e}}$.`, `倍率は $(-A^3)^{${k}}(-A^3)^{-${m}} = (-A^3)^{${e}} = ${e % 2 ? '-' : ''}A^{${3 * e}}$ です。`], [`The writhe changed by exactly $${e}$ too, so $(-A^3)^{-w(D)}\\langle D\\rangle$ is unchanged: two quantities that are not invariants fail in step, and their combination is the Jones polynomial (with $t = A^{-4}$).`, `ライズもちょうど $${e}$ 変わるので、$(-A^3)^{-w(D)}\\langle D\\rangle$ は変わりません。不変量でない二つの量が同じように崩れ、その組み合わせがジョーンズ多項式（$t = A^{-4}$）になります。`]],
          set: { move: 0 },
        };
      }
      if (form === 1) {
        const w = r.nz(-7, 7);
        return {
          q: [`A diagram of the unknot has writhe $${w}$. What is the smallest number of crossings it can have?`, `自明な結び目の図でライズが $${w}$ のものがあります。その交点の数は最小でいくつですか。`],
          a: { type: 'int', v: Math.abs(w) },
          hint: ['Each crossing contributes at most $1$ to $|w|$. Can you reach that bound?', '各交点が $|w|$ に寄与するのは高々 $1$ です。その限界に届くでしょうか。'],
          sol: [[`$|w| \\le n$ because $w$ is a sum of $n$ terms $\\pm1$, so at least $${Math.abs(w)}$ crossings are needed.`, `$w$ は $n$ 個の $\\pm1$ の和なので $|w| \\le n$ で、少なくとも $${Math.abs(w)}$ 個の交点が必要です。`], [`A round circle with $${Math.abs(w)}$ R1 kinks of sign ${w > 0 ? '$+$' : '$-$'} achieves it. The writhe can be anything at all on the unknot, which is the clearest proof that it is not an invariant.`, `円に符号 ${w > 0 ? '$+$' : '$-$'} の R1 のねじりを $${Math.abs(w)}$ 個つければ達成できます。自明な結び目でもライズはどんな値にもなりうるので、ライズが不変量でないことがはっきりわかります。`]],
        };
      }
      const k = r.int(1, 2), tri = k === 1 ? 9 : 3;
      return {
        q: [`A diagram of ${k === 1 ? 'the trefoil' : 'the figure-eight knot'} has ${tri} tricolourings. You apply an R1 move, then an R2 move. How many tricolourings does the new diagram have?`, `${k === 1 ? '三葉結び目' : '8の字結び目'}の図は三彩色を ${tri} 通りもちます。R1 移動、続いて R2 移動を行うと、新しい図の三彩色は何通りですか。`],
        a: { type: 'int', v: tri },
        hint: ['R1 creates one new arc. At the kink\'s crossing the over-arc and one under-arc are the same arc; what does the rule force on the other?', 'R1 は新しい弧を一つ作ります。ねじりの交点では上側の弧と下側の弧の一方が同じ弧です。規則はもう一方に何を強いるでしょうか。'],
        sol: [['At the R1 crossing, $2a \\equiv a + b$ forces the new arc $b$ to have the colour $a$: each old colouring extends in exactly one way.', 'R1 の交点では $2a \\equiv a + b$ から新しい弧 $b$ の色は $a$ に決まり、古い彩色はちょうど一通りに延びます。'], [`For R2 the two new crossings force the middle arc's colour in the same way, so the count stays ${tri}. The number of colourings is an invariant, which is how tricolourability tells the trefoil (9) from the unknot (3).`, `R2 でも二つの新しい交点が真ん中の弧の色を同様に決めるので、数は ${tri} のままです。彩色の数は不変量で、三葉結び目（9）と自明な結び目（3）を区別できるのはこのためです。`]],
        set: { move: 0 },
      };
    },
  ];

  /* ---------- 2. colouring a knot ---------- */
  const KN = [['the unknot', '自明な結び目', 1], ['the trefoil $3_1$', '三葉結び目 $3_1$', 3], ['the figure-eight $4_1$', '8の字結び目 $4_1$', 5], ['the cinquefoil $5_1$', '五つ葉結び目 $5_1$', 5], ['the stevedore $6_1$', 'ステベドア結び目 $6_1$', 9]];
  Q.tricolour = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 4), m = r.int(3, 7), [en, ja, D] = KN[k], g = gcd(m, D);
        return {
          q: [`${en[0].toUpperCase() + en.slice(1)} has determinant $${D}$. Is it nontrivially $${m}$-colourable?`, `${ja}の行列式は $${D}$ です。非自明に $${m}$-彩色できますか。`],
          a: { type: 'choice', opts: [['yes', 'はい'], ['no', 'いいえ']], v: g > 1 ? 0 : 1, fixed: true },
          hint: ['A knot is nontrivially $n$-colourable exactly when $\\gcd(n, \\det K) > 1$.', '結び目が非自明に $n$-彩色できるのは、ちょうど $\\gcd(n, \\det K) > 1$ のときです。'],
          sol: [[`$\\gcd(${m}, ${D}) = ${g}$.`, `$\\gcd(${m}, ${D}) = ${g}$ です。`], [g > 1 ? `Since it exceeds $1$, the colouring equations mod $${m}$ have solutions beyond the constants.` : `Since it is $1$, the colouring matrix is invertible mod $${m}$ after removing one row and column, and only the constant colourings survive.`, g > 1 ? `$1$ より大きいので、mod $${m}$ の彩色方程式には定数以外の解があります。` : `$1$ なので、行と列を一つずつ除いた彩色行列は mod $${m}$ で可逆になり、定数の彩色しか残りません。`]],
          set: { knot: k, n: m },
        };
      }
      if (form === 1) {
        const k = r.int(0, 4), [en, ja, D] = KN[k], t = 3 * gcd(3, D);
        return {
          q: [`How many tricolourings, trivial ones included, does ${en} have?`, `${ja}の三彩色は、自明なものも含めて何通りありますか。`],
          a: { type: 'int', v: t },
          hint: [`Its determinant is $${D}$; is it divisible by $3$?`, `行列式は $${D}$ です。$3$ で割り切れますか。`],
          sol: [['There are always the $3$ constant colourings.', '定数の彩色がいつも $3$ 通りあります。'], [D % 3 === 0 ? `Since $3 \\mid ${D}$, there are nontrivial ones too, and the total is $3 \\cdot 3 = 9$.` : `Since $3 \\nmid ${D}$, those are all: $3$ in total.`, D % 3 === 0 ? `$3 \\mid ${D}$ なので非自明なものもあり、合計は $3 \\cdot 3 = 9$ です。` : `$3 \\nmid ${D}$ なのでそれで全部で、合計 $3$ 通りです。`]],
          set: { knot: k, n: 3 },
        };
      }
      const m = r.int(3, 7), a = r.int(0, m - 1), b = r.int(0, m - 1), c = (((2 * a - b) % m) + m) % m;
      return {
        q: [`In a colouring with $${m}$ colours (mod $${m}$), a crossing has over-arc colour $${a}$ and incoming under-arc colour $${b}$. What colour, from $0$ to $${m - 1}$, must the outgoing under-arc have?`, `$${m}$-彩色で、ある交点の上側の弧の色が $${a}$、入ってくる下側の弧の色が $${b}$ です。出ていく下側の弧の色は（$0$ から $${m - 1}$ のうち）何でなければなりませんか。`],
        a: { type: 'int', v: c },
        hint: ['The rule at each crossing is $2 \\cdot \\text{over} \\equiv \\text{in} + \\text{out} \\pmod n$.', '各交点の規則は $2 \\cdot \\text{上} \\equiv \\text{入} + \\text{出} \\pmod n$ です。'],
        sol: [[`$\\text{out} \\equiv 2\\cdot${a} - ${b} = ${2 * a - b} \\equiv ${c} \\pmod{${m}}$.`, `$\\text{出} \\equiv 2\\cdot${a} - ${b} = ${2 * a - b} \\equiv ${c} \\pmod{${m}}$ です。`], [m === 3 ? 'For $n = 3$ this is the familiar rule: all three colours equal, or all three different.' : 'The over-arc colour is the average of the two under-arc colours, mod $n$: the colours are reflected through it.', m === 3 ? '$n = 3$ では、三色がすべて同じかすべて異なるというおなじみの規則になります。' : '上側の弧の色は、mod $n$ で二本の下側の弧の色の平均です。色がそこを中心に反転されます。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 4), m = r.int(3, 7), [en, ja, D] = KN[k], g = gcd(m, D), cnt = m * g;
        return {
          q: [`${en[0].toUpperCase() + en.slice(1)} is a two-bridge knot with determinant $${D}$, so its colourings mod $n$ number $n\\cdot\\gcd(n, \\det K)$. How many $${m}$-colourings does it have, trivial ones included?`, `${ja}は行列式 $${D}$ の2橋結び目なので、mod $n$ の彩色の数は $n\\cdot\\gcd(n, \\det K)$ です。$${m}$-彩色は、自明なものも含めて何通りありますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Count the constant colourings first, then multiply by how many solutions one free arc has.', 'まず定数の彩色を数え、自由な弧一本の解の個数を掛けます。'],
          sol: [[`$\\gcd(${m}, ${D}) = ${g}$.`, `$\\gcd(${m}, ${D}) = ${g}$ です。`], [`$${m} \\cdot ${g} = ${cnt}$: the $${m}$ constant colourings${g > 1 ? `, each with $${g}$ ways to fill in the rest` : ', and nothing else'}. The readout's brute-force count agrees.`, `$${m} \\cdot ${g} = ${cnt}$ で、定数の彩色 $${m}$ 通り${g > 1 ? `のそれぞれに残りの埋め方が $${g}$ 通りあります` : 'だけです'}。読み取り欄の総当たりの数と一致します。`]],
          set: { knot: k, n: m },
        };
      }
      if (form === 1) {
        const q = r.pick([3, 5, 7, 9]), sz = q - 1;
        const M = Array.from({ length: sz }, (_, i) => Array.from({ length: sz }, (_, j) => (i === j ? 2 : Math.abs(i - j) === 1 ? -1 : 0)));
        return {
          q: [`Deleting a row and a column from the colouring matrix of the $(2, ${q})$ torus knot leaves $${mat(M)}$. What is the determinant of the knot?`, `$(2, ${q})$ トーラス結び目の彩色行列から行と列を一つずつ除くと $${mat(M)}$ になります。この結び目の行列式はいくつですか。`],
          a: { type: 'int', v: q },
          hint: ['Expand along the first row: $D_m = 2D_{m-1} - D_{m-2}$ with $D_1 = 2$, $D_2 = 3$.', '第1行で展開すると $D_m = 2D_{m-1} - D_{m-2}$、$D_1 = 2$、$D_2 = 3$ です。'],
          sol: [[`The recurrence gives $D_m = m + 1$, so this $${sz}\\times${sz}$ matrix has determinant $${q}$.`, `漸化式から $D_m = m + 1$ となり、この $${sz}\\times${sz}$ 行列の行列式は $${q}$ です。`], [`$\\det T(2, ${q}) = ${q}$. Its prime factors $p$ are exactly the $p$ for which it is $p$-colourable${q === 9 ? ': here only $3$' : ''}.`, `$\\det T(2, ${q}) = ${q}$ です。その素因数 $p$ が、ちょうど $p$-彩色できる $p$ です${q === 9 ? '（ここでは $3$ だけ）' : ''}。`]],
          set: q === 3 ? { knot: 1 } : q === 5 ? { knot: 3 } : undefined,
        };
      }
      const nt = r.int(1, 6), D = 2 * nt + 1, p = smallestFactor(D);
      const names = ['', 'the trefoil', 'the figure-eight', '$5_2$', 'the stevedore $6_1$', '$7_2$', '$8_1$'], namesJ = ['', '三葉結び目', '8の字結び目', '$5_2$', 'ステベドア結び目 $6_1$', '$7_2$', '$8_1$'];
      return {
        q: [`The twist knot with ${nt} half-twist${nt > 1 ? 's' : ''} (${names[nt]}) has determinant $2n + 1$, where $n$ is the number of half-twists. What is the smallest $m \\ge 3$ for which it is nontrivially $m$-colourable?`, `半ひねり ${nt} 回のツイスト結び目（${namesJ[nt]}）の行列式は、半ひねりの回数を $n$ として $2n + 1$ です。非自明に $m$-彩色できる最小の $m \\ge 3$ はいくつですか。`],
        a: { type: 'int', v: p },
        hint: ['You need $\\gcd(m, \\det K) > 1$.', '$\\gcd(m, \\det K) > 1$ が必要です。'],
        sol: [[`$\\det K = 2\\cdot${nt} + 1 = ${D}$.`, `$\\det K = 2\\cdot${nt} + 1 = ${D}$ です。`], [`The smallest $m \\ge 3$ sharing a factor with $${D}$ is $${p}$.${D === 5 ? ' So the figure-eight, invisible to tricolouring, is caught by five colours.' : ''}`, `$${D}$ と共通の因数をもつ最小の $m \\ge 3$ は $${p}$ です。${D === 5 ? '三彩色では見分けられない8の字結び目も、5色なら捉えられます。' : ''}`]],
        set: nt === 2 ? { knot: 2, n: p } : nt === 4 ? { knot: 4, n: p } : nt === 1 ? { knot: 1, n: p } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(1, 4), b = r.int(1, 4), A = KN[a], B = KN[b];
        const tri = 3 * gcd(3, A[2]) * gcd(3, B[2]);
        return {
          q: [`The connected sum of ${A[0]} and ${B[0]}: its determinant is the product of theirs, and its colourings come from colouring the two pieces with a matching colour where they join. How many tricolourings does it have?`, `${A[1]}と${B[1]}の連結和の行列式は二つの積で、彩色は二つの部分をつなぎ目で色が合うように塗ることで得られます。この連結和の三彩色は何通りありますか。`],
          a: { type: 'int', v: tri },
          hint: ['Fix the colour of the joining arc; each piece then has $\\gcd(3, \\det)$ ways to finish.', 'つなぎ目の弧の色を固定すると、各部分には仕上げ方が $\\gcd(3, \\det)$ 通りあります。'],
          sol: [[`The joining arc has $3$ colours; given it, ${A[0]} can be finished in $\\gcd(3, ${A[2]}) = ${gcd(3, A[2])}$ ways and ${B[0]} in $${gcd(3, B[2])}$.`, `つなぎ目の弧の色は $3$ 通りで、それを決めると${A[1]}の仕上げ方は $\\gcd(3, ${A[2]}) = ${gcd(3, A[2])}$ 通り、${B[1]}は $${gcd(3, B[2])}$ 通りです。`], [`Total $3\\cdot${gcd(3, A[2])}\\cdot${gcd(3, B[2])} = ${tri}$, with determinant $${A[2] * B[2]}$. ${tri === 27 ? 'Twenty-seven tricolourings prove the sum is not the trefoil, which has nine.' : 'The count multiplies, so knotting adds up visibly.'}`, `合計 $3\\cdot${gcd(3, A[2])}\\cdot${gcd(3, B[2])} = ${tri}$ 通りで、行列式は $${A[2] * B[2]}$ です。${tri === 27 ? '三彩色が 27 通りあるので、9 通りの三葉結び目とは違うことがわかります。' : '数が掛け算で増えるので、結び目の複雑さが目に見えて積み上がります。'}`]],
        };
      }
      if (form === 1) {
        const opts = [['the number of tricolourings: $9$ against $3$', '三彩色の数（$9$ と $3$）'], ['the determinant: $3$ against $5$', '行列式（$3$ と $5$）'], ['the number of crossings in the drawings', '図の交点の数'], ['the writhe of the drawings', '図のライズ']];
        const pair = r.int(0, 1);
        return {
          q: [pair ? 'Which quantity proves that the figure-eight knot is different from the trefoil?' : 'Which quantity proves that the figure-eight knot is not the unknot?', pair ? '8の字結び目が三葉結び目と異なることを証明できる量はどれですか。' : '8の字結び目が自明な結び目でないことを証明できる量はどれですか。'],
          a: pair ? { type: 'choice', opts: [opts[1], opts[0], opts[2], opts[3]], v: 0 } : { type: 'choice', opts: [['the determinant: $5$ against $1$', '行列式（$5$ と $1$）'], opts[0], opts[2], opts[3]], v: 0 },
          hint: ['Only invariants prove anything; a diagram quantity can differ between two pictures of the same knot.', '証明になるのは不変量だけです。図の量は同じ結び目の二つの絵で異なりえます。'],
          sol: [[pair ? 'Both determinants are invariants and $3 \\ne 5$, so the knots differ. Tricolourings alone would not do for the unknot question, but here $9 \\ne 3$ also separates them.' : 'The figure-eight has only the $3$ trivial tricolourings, the same as the unknot, so tricolouring cannot see it; its determinant $5 \\ne 1$ can.', pair ? '行列式はどちらも不変量で $3 \\ne 5$ なので、二つの結び目は異なります。' : '8の字結び目の三彩色は自明な 3 通りだけで自明な結び目と同じなので、三彩色では見分けられません。行列式 $5 \\ne 1$ なら見分けられます。'], ['Crossing counts and writhes of particular drawings change under Reidemeister moves, so a difference in them proves nothing.', '個々の図の交点の数やライズはライデマイスター移動で変わるので、それらの違いは何も証明しません。']],
          set: pair ? { knot: 2, n: 5 } : { knot: 2, n: 5 },
        };
      }
      const L = [['$5_2$', 7], ['$6_2$', 11], ['$6_3$', 13], ['$7_1$', 7], ['$7_4$', 15], ['$8_{19}$', 3], ['$4_1 \\# 4_1$', 25], ['$3_1 \\# 4_1$', 15], ['$9_1$', 9], ['$8_{18}$', 45]];
      const [nm, D] = r.pick(L), p = smallestFactor(D);
      return {
        q: [`The knot ${nm} has determinant $${D}$. What is the smallest $n \\ge 3$ for which it has a nontrivial $n$-colouring?`, `結び目 ${nm} の行列式は $${D}$ です。非自明な $n$-彩色をもつ最小の $n \\ge 3$ はいくつですか。`],
        a: { type: 'int', v: p },
        hint: ['Look for the smallest factor of the determinant; knot determinants are always odd.', '行列式の最小の因数を探してください。結び目の行列式はいつも奇数です。'],
        sol: [[`Nontrivial $n$-colourings exist exactly when $\\gcd(n, ${D}) > 1$.`, `非自明な $n$-彩色が存在するのは、ちょうど $\\gcd(n, ${D}) > 1$ のときです。`], [`The smallest such $n$ is $${p}$${p === D ? `, since $${D}$ is prime` : ''}. ${p === 3 ? 'So it is tricolourable.' : 'So tricolourability alone cannot tell it from the unknot.'}`, `そのような最小の $n$ は $${p}$ です${p === D ? `（$${D}$ は素数）` : ''}。${p === 3 ? 'したがって三彩色できます。' : 'したがって三彩色だけでは自明な結び目と区別できません。'}`]],
      };
    },
  ];

  /* ---------- 3. torus knots ---------- */
  Q['torus-knots'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.int(2, 7), q = r.int(1, 9), d = gcd(p, q);
        return {
          q: [`How many components does the torus link $T(${p}, ${q})$ have?`, `トーラス絡み目 $T(${p}, ${q})$ の成分はいくつですか。`],
          a: { type: 'int', v: d },
          hint: ['Follow the line of slope $q/p$ on the flat torus: when does it close up?', '平らなトーラス上の傾き $q/p$ の直線をたどり、いつ閉じるかを考えてください。'],
          sol: [[`$\\gcd(${p}, ${q}) = ${d}$.`, `$\\gcd(${p}, ${q}) = ${d}$ です。`], [d === 1 ? 'One component: a knot. The line closes only after visiting every part of the torus.' : `${d} components, each the torus knot $T(${p / d}, ${q / d})$, drawn as ${d} parallel lines on the flat torus.`, d === 1 ? '成分は一つで、結び目です。直線はトーラスの各部分をめぐってから初めて閉じます。' : `成分は ${d} 個で、それぞれがトーラス結び目 $T(${p / d}, ${q / d})$ です。平らなトーラスでは ${d} 本の平行線になります。`]],
          set: { p, q },
        };
      }
      const [p, q] = coprime(r);
      if (form === 1) {
        const c = crossingNumber(p, q);
        return {
          q: [`What is the crossing number of the torus knot $T(${p}, ${q})$?`, `トーラス結び目 $T(${p}, ${q})$ の交点数はいくつですか。`],
          a: { type: 'int', v: c },
          hint: ['$c(T(p, q)) = \\min(p(q - 1),\\ q(p - 1))$.', '$c(T(p, q)) = \\min(p(q - 1),\\ q(p - 1))$ です。'],
          sol: [[`$${p}(${q} - 1) = ${p * (q - 1)}$ and $${q}(${p} - 1) = ${q * (p - 1)}$.`, `$${p}(${q} - 1) = ${p * (q - 1)}$、$${q}(${p} - 1) = ${q * (p - 1)}$ です。`], [`The crossing number is the smaller, $${c}$: draw the knot as a braid on the fewer strands. No diagram of it has fewer crossings.`, `交点数は小さいほうの $${c}$ です。少ないほうのひもの本数で組みひもとして描けばよく、それより交点の少ない図はありません。`]],
          set: { p, q },
        };
      }
      const g = (p - 1) * (q - 1) / 2;
      return {
        q: [`What is the genus of the torus knot $T(${p}, ${q})$?`, `トーラス結び目 $T(${p}, ${q})$ の種数はいくつですか。`],
        a: { type: 'int', v: g },
        hint: ['$g = (p - 1)(q - 1)/2$.', '$g = (p - 1)(q - 1)/2$ です。'],
        sol: [[`$g = (${p} - 1)(${q} - 1)/2 = ${g}$.`, `$g = (${p} - 1)(${q} - 1)/2 = ${g}$ です。`], [`The knot bounds an orientable surface (its fibre) with ${g} handle${g === 1 ? '' : 's'}, and no surface with fewer. For torus knots the unknotting number is the same, $${g}$.`, `この結び目はハンドル ${g} 個の向き付け可能な曲面（ファイバー）の境界になり、それより少ない曲面はありません。トーラス結び目では結び目解消数も同じ $${g}$ です。`]],
        set: { p, q },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const q = r.pick([3, 5, 7, 9]), c = alexander(2, q);
        return {
          q: [`Find the Alexander polynomial of $T(2, ${q})$, normalised so that its lowest term is a constant.`, `$T(2, ${q})$ のアレクサンダー多項式を、最低次の項が定数になるように正規化して求めてください。`],
          a: { type: 'expr', v: polyExpr(c), vars: ['t'], dom: { t: [0.4, 1.8] }, lhs: ['$\\Delta(t) =$', '$\\Delta(t) =$'] },
          hint: ['$\\Delta_{T(p,q)}(t) = \\dfrac{(t^{pq} - 1)(t - 1)}{(t^p - 1)(t^q - 1)}$.', '$\\Delta_{T(p,q)}(t) = \\dfrac{(t^{pq} - 1)(t - 1)}{(t^p - 1)(t^q - 1)}$ です。'],
          sol: [[`With $p = 2$: $\\dfrac{(t^{${2 * q}} - 1)(t - 1)}{(t^2 - 1)(t^{${q}} - 1)} = \\dfrac{t^{${q}} + 1}{t + 1}$.`, `$p = 2$ では $\\dfrac{(t^{${2 * q}} - 1)(t - 1)}{(t^2 - 1)(t^{${q}} - 1)} = \\dfrac{t^{${q}} + 1}{t + 1}$ です。`], [`$\\Delta(t) = ${polyTeX(c)}$: alternating signs, degree $${q - 1} = 2g$, and $\\Delta(1) = 1$ as for every knot.`, `$\\Delta(t) = ${polyTeX(c)}$ です。符号が交互に並び、次数は $${q - 1} = 2g$ で、どの結び目とも同じく $\\Delta(1) = 1$ です。`]],
          set: { p: 2, q },
        };
      }
      if (form === 1) {
        const [p, q] = coprime(r, [2, 5], [3, 7]), c = alexander(p, q), det = Math.abs(evalPoly(c, -1));
        return {
          q: [`The Alexander polynomial of $T(${p}, ${q})$ is $${polyTeX(c)}$. What is the knot's determinant?`, `$T(${p}, ${q})$ のアレクサンダー多項式は $${polyTeX(c)}$ です。この結び目の行列式はいくつですか。`],
          a: { type: 'int', v: det },
          hint: ['$\\det K = |\\Delta(-1)|$.', '$\\det K = |\\Delta(-1)|$ です。'],
          sol: [[`Substitute $t = -1$: $\\Delta(-1) = ${evalPoly(c, -1)}$.`, `$t = -1$ を代入すると $\\Delta(-1) = ${evalPoly(c, -1)}$ です。`], [`$\\det = ${det}$. ${det === 1 ? 'Determinant $1$: no colouring argument can tell this knot from the unknot, though the Alexander polynomial itself can.' : `It is nontrivially $n$-colourable exactly for the $n$ sharing a factor with $${det}$.`}`, `$\\det = ${det}$ です。${det === 1 ? '行列式が $1$ なので彩色ではこの結び目を自明な結び目と区別できませんが、アレクサンダー多項式そのものなら区別できます。' : `非自明に $n$-彩色できるのは、$${det}$ と共通の因数をもつ $n$ のときです。`}`]],
          set: { p, q },
        };
      }
      const [p, q] = coprime(r), drawn = q * (p - 1), c = crossingNumber(p, q), braid = p === 2 ? `\\sigma_1^{${q}}` : `(\\sigma_1${p > 3 ? '\\cdots' : ''}\\sigma_{${p - 1}})^{${q}}`;
      return {
        q: [`$T(${p}, ${q})$ is drawn as the closure of the braid $${braid}$ on ${p} strands. How many crossings does that drawing have, and what is the crossing number of the knot?`, `$T(${p}, ${q})$ を ${p} 本のひもの組みひも $${braid}$ の閉包として描きます。その図の交点の数と、結び目の交点数を答えてください。`],
        a: { type: 'tuple', v: [drawn, c], labels: [['crossings drawn', '図の交点'], ['$c(K)$', '$c(K)$']], tol: 0 },
        hint: ['Each factor $\\sigma_1\\cdots\\sigma_{p-1}$ contributes $p - 1$ crossings. Then compare with the braid on $q$ strands.', '各因子 $\\sigma_1\\cdots\\sigma_{p-1}$ が交点を $p - 1$ 個与えます。次に $q$ 本のひもの組みひもと比べてください。'],
        sol: [[`$${q}\\times(${p} - 1) = ${drawn}$ crossings in this drawing.`, `この図の交点は $${q}\\times(${p} - 1) = ${drawn}$ 個です。`], [`Since $T(${p}, ${q}) = T(${q}, ${p})$, it is also a braid on ${q} strands with $${p * (q - 1)}$ crossings. The crossing number is the smaller, $${c}$${drawn > c ? ': this drawing is not minimal' : ': this drawing is already minimal'}.`, `$T(${p}, ${q}) = T(${q}, ${p})$ なので、${q} 本のひもで交点 $${p * (q - 1)}$ 個の組みひもとしても描けます。交点数は小さいほうの $${c}$ で、${drawn > c ? 'この図は最小ではありません' : 'この図はすでに最小です'}。`]],
        set: { p, q },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [p, q] = r.pick([[3, 4], [3, 5], [2, 7], [2, 9], [3, 7], [4, 5]]), c = alexander(p, q);
        return {
          q: [`Find the Alexander polynomial of $T(${p}, ${q})$, normalised so that its lowest term is a constant.`, `$T(${p}, ${q})$ のアレクサンダー多項式を、最低次の項が定数になるように正規化して求めてください。`],
          a: { type: 'expr', v: polyExpr(c), vars: ['t'], dom: { t: [0.4, 1.8] }, lhs: ['$\\Delta(t) =$', '$\\Delta(t) =$'] },
          hint: ['Divide $(t^{pq} - 1)(t - 1)$ by $(t^p - 1)(t^q - 1)$; the roots of $\\Delta$ are the $pq$-th roots of unity that are neither $p$-th nor $q$-th roots.', '$(t^{pq} - 1)(t - 1)$ を $(t^p - 1)(t^q - 1)$ で割ります。$\\Delta$ の根は、$p$ 乗根でも $q$ 乗根でもない $1$ の $pq$ 乗根です。'],
          sol: [[`$\\Delta(t) = \\dfrac{(t^{${p * q}} - 1)(t - 1)}{(t^{${p}} - 1)(t^{${q}} - 1)}$, a polynomial of degree $${p * q} + 1 - ${p} - ${q} = ${(p - 1) * (q - 1)}$.`, `$\\Delta(t) = \\dfrac{(t^{${p * q}} - 1)(t - 1)}{(t^{${p}} - 1)(t^{${q}} - 1)}$ は次数 $${p * q} + 1 - ${p} - ${q} = ${(p - 1) * (q - 1)}$ の多項式です。`], [`Carrying out the division: $\\Delta(t) = ${polyTeX(c)}$.`, `割り算を実行すると $\\Delta(t) = ${polyTeX(c)}$ です。`], [`Its degree $${(p - 1) * (q - 1)}$ is twice the genus, and its coefficients are all $0$ or $\\pm1$: torus knots are fibred, so $\\Delta$ is monic.`, `次数 $${(p - 1) * (q - 1)}$ は種数の2倍で、係数はすべて $0$ か $\\pm1$ です。トーラス結び目はファイバー結び目なので $\\Delta$ はモニックです。`]],
          set: { p, q },
        };
      }
      if (form === 1) {
        const which = r.int(0, 1);
        if (which === 0) {
          const g = r.int(1, 4), q = 2 * g + 1;
          return {
            q: [`The torus knot $T(2, q)$ has genus $${g}$. Find $q$.`, `トーラス結び目 $T(2, q)$ の種数が $${g}$ です。$q$ を求めてください。`],
            a: { type: 'int', v: q },
            hint: ['$g = (p - 1)(q - 1)/2$ with $p = 2$.', '$p = 2$ として $g = (p - 1)(q - 1)/2$ を使います。'],
            sol: [[`$(2 - 1)(q - 1)/2 = ${g}$ gives $q = ${q}$.`, `$(2 - 1)(q - 1)/2 = ${g}$ より $q = ${q}$ です。`], [`$T(2, ${q})$ is ${q === 3 ? 'the trefoil' : q === 5 ? 'the cinquefoil $5_1$' : q === 7 ? 'the knot $7_1$' : 'the knot $9_1$'}, with ${q} crossings: for $T(2, q)$, crossing number, determinant and $2g + 1$ all equal $q$.`, `$T(2, ${q})$ は${q === 3 ? '三葉結び目' : q === 5 ? '五つ葉結び目 $5_1$' : q === 7 ? '結び目 $7_1$' : '結び目 $9_1$'}で、交点は ${q} 個です。$T(2, q)$ では交点数、行列式、$2g + 1$ がすべて $q$ に等しくなります。`]],
            set: { p: 2, q },
          };
        }
        let q; do { q = r.int(4, 9); } while (gcd(3, q) !== 1);
        const c = crossingNumber(3, q);
        return {
          q: [`A torus knot $T(3, q)$ with $q > 3$ has crossing number $${c}$. Find $q$.`, `$q > 3$ のトーラス結び目 $T(3, q)$ の交点数が $${c}$ です。$q$ を求めてください。`],
          a: { type: 'int', v: q },
          hint: ['Which of $3(q - 1)$ and $2q$ is smaller when $q > 3$?', '$q > 3$ のとき、$3(q - 1)$ と $2q$ のどちらが小さいでしょうか。'],
          sol: [[`For $q > 3$, $2q < 3(q - 1)$, so $c = 2q$: the three-strand braid is the efficient drawing.`, `$q > 3$ では $2q < 3(q - 1)$ なので $c = 2q$ で、3本のひもの組みひもが効率のよい描き方です。`], [`$2q = ${c}$ gives $q = ${q}$.`, `$2q = ${c}$ より $q = ${q}$ です。`]],
          set: { p: 3, q },
        };
      }
      let p, q, d; do { p = r.int(2, 7); q = r.int(2, 9); d = gcd(p, q); } while (d < 2);
      const lk = p * q / (d * d);
      return {
        q: [`$T(${p}, ${q})$ is a link of ${d} components. What is the linking number between any two of them?`, `$T(${p}, ${q})$ は ${d} 成分の絡み目です。どの二つの成分の間の絡み数もいくつですか。`],
        a: { type: 'int', v: lk },
        hint: [`Each component is $T(${p / d}, ${q / d})$. Count how often one winds around the core of the other's torus, and through its hole.`, `各成分は $T(${p / d}, ${q / d})$ です。一方が他方のトーラスの芯のまわりと穴を何回まわるかを数えてください。`],
        sol: [[`Each component is a $T(${p / d}, ${q / d})$ curve; two of them lie side by side on the same torus.`, `各成分は $T(${p / d}, ${q / d})$ 曲線で、二つが同じトーラス上に並んでいます。`], [`Their linking number is $${p / d}\\cdot${q / d} = ${lk}$, which is $pq/d^2$.${p === 2 && q === 2 ? ' For the Hopf link this is the familiar $1$.' : ''}`, `絡み数は $${p / d}\\cdot${q / d} = ${lk}$ で、$pq/d^2$ に等しくなります。${p === 2 && q === 2 ? 'ホップ絡み目ではおなじみの $1$ です。' : ''}`], ['On the flat torus this is the intersection number of two parallel lines of slope $q/p$ pushed apart, counted with sign.', '平らなトーラスでは、傾き $q/p$ の平行な二本の直線を少しずらしたときの、符号つきの交点数にあたります。']],
        set: { p, q },
      };
    },
  ];
})();
