'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms, mat } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180;
  const vec = (v, d = 4) => `(${v.map((x) => n(x, d)).join(', ')})`;
  const pn = (x, d) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const r1 = (x) => Math.round(x * 10) / 10;
  const inRange = (x, lo, hi) => x >= lo - 1e-9 && x <= hi + 1e-9;
  const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  function rank3(M) {
    const A = M.map((r) => r.slice());
    let rk = 0;
    for (let c = 0; c < 3 && rk < 3; c++) {
      let piv = rk; for (let i = rk; i < 3; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i;
      if (Math.abs(A[piv][c]) < 1e-9) continue;
      [A[rk], A[piv]] = [A[piv], A[rk]];
      for (let i = rk + 1; i < 3; i++) { const f = A[i][c] / A[rk][c]; for (let j = c; j < 3; j++) A[i][j] -= f * A[rk][j]; }
      rk++;
    }
    return rk;
  }

  // ---------- 1. basis and coordinates ----------
  Q.basis = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let b1, b2;
        do { b1 = [r.int(-2, 2), r.int(-2, 2)]; b2 = [r.int(-2, 2), r.int(-2, 2)]; } while (det2([[b1[0], b2[0]], [b1[1], b2[1]]]) === 0);
        const al = r.nz(-3, 3), be = r.nz(-3, 3), v = [al * b1[0] + be * b2[0], al * b1[1] + be * b2[1]];
        return {
          q: [`The basis $b_1 = ${vec(b1)}$, $b_2 = ${vec(b2)}$. A vector has coordinates $[v]_B = (${al}, ${be})$. What is $v$ in standard coordinates?`, `基底 $b_1 = ${vec(b1)}$、$b_2 = ${vec(b2)}$ に関する座標が $[v]_B = (${al}, ${be})$ のベクトル $v$ を、標準座標で求めてください。`],
          a: { type: 'tuple', v, labels: ['$v_x$', '$v_y$'] },
          hint: ['Coordinates are the weights: $v = \\alpha b_1 + \\beta b_2$.', '座標は重みです。$v = \\alpha b_1 + \\beta b_2$ です。'],
          sol: [[`$v = ${al}\\,${vec(b1)} ${be < 0 ? '-' : '+'} ${Math.abs(be)}\\,${vec(b2)}$.`, `$v = ${al}\\,${vec(b1)} ${be < 0 ? '-' : '+'} ${Math.abs(be)}\\,${vec(b2)}$ です。`], [`$v = ${vec(v)}$. Going from coordinates to the vector is just multiplying by $B$, whose columns are $b_1$ and $b_2$.`, `$v = ${vec(v)}$ です。座標からベクトルへ戻るのは、列が $b_1, b_2$ の行列 $B$ を掛けるだけです。`]],
          set: { a: b1[0], b: b1[1], c: b2[0], d: b2[1] },
        };
      }
      if (form === 1) {
        const p = r.pick([0.5, 2, -1, 1.5, -2, 0.4, 1.6]), q = r.pick([0.5, 2, -1, 1.5, -0.5, 1.2, 0.8]);
        return {
          q: [`The basis $b_1 = (${n(p)}, 0)$, $b_2 = (0, ${n(q)})$ stretches the axes. What are the coordinates of $v = (1, 1)$ in this basis?`, `基底 $b_1 = (${n(p)}, 0)$、$b_2 = (0, ${n(q)})$ は軸を伸び縮みさせます。この基底での $v = (1, 1)$ の座標を求めてください。`],
          a: { type: 'tuple', v: [1 / p, 1 / q], labels: ['$\\alpha$', '$\\beta$'] },
          hint: ['Solve $\\alpha b_1 + \\beta b_2 = (1, 1)$ one axis at a time.', '$\\alpha b_1 + \\beta b_2 = (1, 1)$ を軸ごとに解いてください。'],
          sol: [[`$\\alpha\\cdot ${pn(p)} = 1$ and $\\beta\\cdot ${pn(q)} = 1$.`, `$\\alpha\\cdot ${pn(p)} = 1$、$\\beta\\cdot ${pn(q)} = 1$ です。`], [`$[v]_B = (${n(1 / p)}, ${n(1 / q)})$: a longer basis vector needs a smaller coordinate, which is why coordinates transform inversely to the basis.`, `$[v]_B = (${n(1 / p)}, ${n(1 / q)})$ です。基底ベクトルが長いほど座標は小さくなります。座標が基底と逆向きに変換されるのはこのためです。`]],
          set: { a: p, b: 0, c: 0, d: q },
        };
      }
      const b1 = [r.int(-2, 2), r.int(-2, 2)], k = r.pick([-2, -1, 2, 1, 0.5]), par = r.chance(0.5);
      let b2 = par ? [k * b1[0], k * b1[1]] : [r.int(-2, 2), r.int(-2, 2)];
      if (!par && det2([[b1[0], b2[0]], [b1[1], b2[1]]]) === 0) b2 = [b2[0] + 1, b2[1]];
      if (b1[0] === 0 && b1[1] === 0) b1[0] = 1;
      const D = det2([[b1[0], b2[0]], [b1[1], b2[1]]]), ok = Math.abs(D) > 1e-9;
      return {
        q: [`Do $b_1 = ${vec(b1)}$ and $b_2 = ${vec(b2)}$ form a basis of $\\mathbb R^2$?`, `$b_1 = ${vec(b1)}$ と $b_2 = ${vec(b2)}$ は $\\mathbb R^2$ の基底になりますか。`],
        a: { type: 'choice', opts: [[`Yes: $\\det B = ${n(D)} \\ne 0$`, `はい。$\\det B = ${n(D)} \\ne 0$ です`], ['No: $\\det B = 0$, the two vectors are parallel', 'いいえ。$\\det B = 0$ で二つのベクトルは平行です'], ['Yes: any two non-zero vectors form a basis', 'はい。零でない二つのベクトルなら必ず基底になります']], v: ok ? 0 : 1, fixed: true },
        hint: ['Two vectors in the plane are a basis exactly when they are not parallel.', '平面の二つのベクトルが基底になるのは、平行でないときに限ります。'],
        sol: [[`$\\det B = ${n(b1[0])}\\cdot ${pn(b2[1])} - ${pn(b2[0])}\\cdot ${pn(b1[1])} = ${n(D)}$.`, `$\\det B = ${n(b1[0])}\\cdot ${pn(b2[1])} - ${pn(b2[0])}\\cdot ${pn(b1[1])} = ${n(D)}$ です。`], [ok ? 'Non-zero, so every vector has exactly one pair of coordinates.' : 'Zero: both vectors lie on one line, so the grid collapses and most vectors have no coordinates at all.', ok ? '0 でないので、どのベクトルにもちょうど一組の座標があります。' : '0 なので二つのベクトルは同じ直線上にあり、格子が潰れて、ほとんどのベクトルには座標がありません。']],
        set: [...b1, ...b2].every((x) => inRange(x, -2, 2)) ? { a: b1[0], b: b1[1], c: b2[0], d: b2[1] } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 1);
      let B, D;
      do { B = [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]]; D = det2(B); } while (D === 0 || (form === 1 && Math.abs(D) !== 1));
      const w = form === 0 ? [1, 1] : [r.int(-3, 3), r.int(-3, 3)];
      const al = (B[1][1] * w[0] - B[0][1] * w[1]) / D, be = (-B[1][0] * w[0] + B[0][0] * w[1]) / D;
      const fr = (p) => frac(p, D);
      return {
        q: [`$B = ${mat(B)}$ has columns $b_1, b_2$. Find the coordinates $[w]_B$ of $w = ${vec(w)}$.`, `$B = ${mat(B)}$ の列を $b_1, b_2$ とします。$w = ${vec(w)}$ の座標 $[w]_B$ を求めてください。`],
        a: { type: 'tuple', v: [al, be], labels: ['$\\alpha$', '$\\beta$'], show: `\\left(${fr(B[1][1] * w[0] - B[0][1] * w[1])},\\ ${fr(-B[1][0] * w[0] + B[0][0] * w[1])}\\right)` },
        hint: ['$[w]_B = B^{-1}w$, and for a $2\\times 2$ matrix the inverse swaps the diagonal, negates the off-diagonal and divides by $\\det B$.', '$[w]_B = B^{-1}w$ です。$2\\times 2$ 行列の逆行列は、対角を入れ替え、非対角の符号を変え、$\\det B$ で割ったものです。'],
        sol: [[`$\\det B = ${D}$ and $B^{-1} = ${D === 1 ? '' : D === -1 ? '-' : `\\dfrac{1}{${D}}`}${mat([[B[1][1], -B[0][1]], [-B[1][0], B[0][0]]])}$.`, `$\\det B = ${D}$、$B^{-1} = ${D === 1 ? '' : D === -1 ? '-' : `\\dfrac{1}{${D}}`}${mat([[B[1][1], -B[0][1]], [-B[1][0], B[0][0]]])}$ です。`], [`$[w]_B = B^{-1}w = (${fr(B[1][1] * w[0] - B[0][1] * w[1])}, ${fr(-B[1][0] * w[0] + B[0][0] * w[1])})$.`, `$[w]_B = B^{-1}w = (${fr(B[1][1] * w[0] - B[0][1] * w[1])}, ${fr(-B[1][0] * w[0] + B[0][0] * w[1])})$ です。`], [`Check: $${fr(B[1][1] * w[0] - B[0][1] * w[1])}\\,b_1 ${be < 0 ? '-' : '+'} ${fr(Math.abs(-B[1][0] * w[0] + B[0][0] * w[1]) * Math.sign(D))}\\,b_2 = ${vec(w)}$.${Math.abs(D) === 1 ? ' With $\\det B = \\pm 1$ integer vectors keep integer coordinates: the new grid has the same cells as the old one.' : ''}`, `確認：$${fr(B[1][1] * w[0] - B[0][1] * w[1])}\\,b_1 ${be < 0 ? '-' : '+'} ${fr(Math.abs(-B[1][0] * w[0] + B[0][0] * w[1]) * Math.sign(D))}\\,b_2 = ${vec(w)}$ です。${Math.abs(D) === 1 ? '$\\det B = \\pm 1$ なので整数ベクトルの座標は整数のままです。新しい格子のマスは古い格子と同じ面積です。' : ''}`]],
        set: form === 0 ? { a: B[0][0], b: B[1][0], c: B[0][1], d: B[1][1] } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 1);
      let p, q; do { p = r.pick([1, 2, -1, 2, 1.5]); q = r.pick([1, -1, 2, 0.5, -2]); } while (Math.abs(p - q) < 1e-9);
      if (form === 0) {
        const ts = p / q, dom = ts > 0 ? [-1.6, Math.min(-0.2, ts - 0.4)] : [Math.max(0.2, ts + 0.4), 1.6];
        return {
          q: [`Take $b_1 = (${n(p)}, ${n(q)})$ and $b_2 = (t, 1)$. Write the first coordinate $\\alpha(t)$ of $v = (1, 1)$ in this basis as a function of $t$.`, `$b_1 = (${n(p)}, ${n(q)})$、$b_2 = (t, 1)$ とします。この基底での $v = (1, 1)$ の第1座標 $\\alpha(t)$ を $t$ の式で表してください。`],
          a: { type: 'expr', v: `(1-t)/(${p}-${q}*t)`.replace('--', '+'), vars: ['t'], dom: { t: dom }, lhs: ['$\\alpha(t) =$', '$\\alpha(t) =$'] },
          hint: ['Solve $\\alpha b_1 + \\beta b_2 = (1, 1)$ by Cramer\'s rule; the denominator is $\\det B$.', '$\\alpha b_1 + \\beta b_2 = (1, 1)$ をクラメルの公式で解きます。分母は $\\det B$ です。'],
          sol: [[`$\\det B = ${n(p)}\\cdot 1 - t\\cdot ${pn(q)} = ${terms([[p, ''], [-q, 't']])}$.`, `$\\det B = ${n(p)}\\cdot 1 - t\\cdot ${pn(q)} = ${terms([[p, ''], [-q, 't']])}$ です。`], [`Cramer: replace the first column by $v$: $\\alpha = \\dfrac{1\\cdot 1 - t\\cdot 1}{${terms([[p, ''], [-q, 't']])}} = \\dfrac{1 - t}{${terms([[p, ''], [-q, 't']])}}$.`, `クラメルの公式で第1列を $v$ に置き換えると $\\alpha = \\dfrac{1\\cdot 1 - t\\cdot 1}{${terms([[p, ''], [-q, 't']])}} = \\dfrac{1 - t}{${terms([[p, ''], [-q, 't']])}}$ です。`], [`It blows up at $t = ${n(ts)}$, where $b_2$ becomes parallel to $b_1$ and the coordinates stop existing; at $t = 1$ it vanishes because then $v = b_2$.`, `$t = ${n(ts)}$ で $b_2$ が $b_1$ と平行になり、座標が存在しなくなるので発散します。$t = 1$ では $v = b_2$ なので 0 になります。`]],
        };
      }
      if (q === -1) q = 1;
      let t = 1 - p + q;
      if (Math.abs(p - q * t) < 1e-9) { p = p === 2 ? 1.5 : 2; t = 1 - p + q; }
      return {
        q: [`With $b_1 = (${n(p)}, ${n(q)})$ and $b_2 = (t, 1)$, for which $t$ are the two coordinates of $v = (1, 1)$ equal?`, `$b_1 = (${n(p)}, ${n(q)})$、$b_2 = (t, 1)$ のとき、$v = (1, 1)$ の二つの座標が等しくなる $t$ を求めてください。`],
        a: { type: 'num', v: t },
        hint: ['Equal coordinates mean $v = \\alpha(b_1 + b_2)$, so $b_1 + b_2$ must point along $(1, 1)$.', '座標が等しいことは $v = \\alpha(b_1 + b_2)$ を意味するので、$b_1 + b_2$ は $(1, 1)$ の向きでなければなりません。'],
        sol: [[`$b_1 + b_2 = (${n(p)} + t, ${n(q + 1)})$ must be a multiple of $(1, 1)$, so its two entries agree.`, `$b_1 + b_2 = (${n(p)} + t, ${n(q + 1)})$ は $(1, 1)$ の定数倍なので、二つの成分が等しくなります。`], [`$${n(p)} + t = ${n(q + 1)}$ gives $t = ${n(t)}$.`, `$${n(p)} + t = ${n(q + 1)}$ より $t = ${n(t)}$ です。`], [`Then $\\alpha = \\beta = 1/${n(q + 1)} = ${n(1 / (q + 1))}$, as long as the basis is not degenerate there.`, `このとき、基底が退化していなければ $\\alpha = \\beta = 1/${n(q + 1)} = ${n(1 / (q + 1))}$ です。`]],
        set: inRange(t, -2, 2) ? { a: p, b: q, c: t, d: 1 } : undefined,
      };
    },
  ];

  // ---------- 2. determinant, volume and rank ----------
  const triTeX = (a, c, p, d, q, k) => mat([[a, c, p], [0, d, q], [0, 0, k]]);
  Q.det = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, -1, 1.5, 0.5, -2]), d = r.pick([1, 2, 0.5, -1, 1.5]), k = r.pick([1, 2, -1, 0.5, 1.5, -2]);
        const c = r1(r.real(-2, 2)), p = r1(r.real(-1.5, 1.5)), q = r1(r.real(-1.5, 1.5));
        return {
          q: [`What is $\\det A$ for $A = ${triTeX(a, c, p, d, q, k)}$?`, `$A = ${triTeX(a, c, p, d, q, k)}$ の $\\det A$ を求めてください。`],
          a: { type: 'num', v: a * d * k },
          hint: ['The matrix is upper triangular.', 'この行列は上三角行列です。'],
          sol: [[`For a triangular matrix the determinant is the product of the diagonal: $${n(a)}\\cdot ${pn(d)}\\cdot ${pn(k)} = ${n(a * d * k)}$.`, `三角行列の行列式は対角成分の積なので $${n(a)}\\cdot ${pn(d)}\\cdot ${pn(k)} = ${n(a * d * k)}$ です。`], ['Geometrically: base area $|ad|$ times height $|k|$; the entries above the diagonal only shear the solid.', '図形的には底面積 $|ad|$ と高さ $|k|$ の積です。対角より上の成分は立体をせん断するだけです。']],
          set: { a, d, c, p, q, k },
        };
      }
      let M; do { M = [[r.int(-3, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 3)]]; } while (det2(M) === 0);
      const D = det2(M);
      if (form === 1) return {
        q: [`The unit square is mapped by $${mat(M)}$. What is the area of its image?`, `単位正方形を $${mat(M)}$ で写します。像の面積はいくつですか。`],
        a: { type: 'int', v: Math.abs(D) },
        hint: ['Area scales by $|\\det|$.', '面積は $|\\det|$ 倍になります。'],
        sol: [[`$\\det = ${M[0][0]}\\cdot ${pn(M[1][1])} - ${pn(M[0][1])}\\cdot ${pn(M[1][0])} = ${D}$.`, `$\\det = ${M[0][0]}\\cdot ${pn(M[1][1])} - ${pn(M[0][1])}\\cdot ${pn(M[1][0])} = ${D}$ です。`], [`The area is $|${D}| = ${Math.abs(D)}$${D < 0 ? ', and the negative sign says the square has also been flipped over.' : '.'}`, `面積は $|${D}| = ${Math.abs(D)}$ です${D < 0 ? '。符号が負なので、正方形は裏返されてもいます' : ''}。`]],
        set: M[1][0] === 0 && [M[0][0], M[0][1], M[1][1]].every((x) => inRange(x, -2, 2)) ? { a: M[0][0], d: M[1][1], c: M[0][1], k: 1, p: 0, q: 0 } : undefined,
      };
      return {
        q: [`Does $${mat(M)}$ preserve or reverse orientation (the order anticlockwise of $e_1$, $e_2$)?`, `$${mat(M)}$ は向き（$e_1$, $e_2$ の反時計回りの順序）を保ちますか、反転させますか。`],
        a: { type: 'choice', opts: [['Preserves it', '保つ'], ['Reverses it', '反転させる'], ['Neither: it collapses the plane', 'どちらでもない。平面を潰す']], v: D > 0 ? 0 : 1, fixed: true },
        hint: ['Look at the sign of the determinant.', '行列式の符号を見てください。'],
        sol: [[`$\\det = ${D}$.`, `$\\det = ${D}$ です。`], [D > 0 ? 'Positive: $Ae_2$ is still anticlockwise from $Ae_1$.' : 'Negative: $Ae_2$ now lies clockwise from $Ae_1$, as in a mirror image.', D > 0 ? '正なので、$Ae_2$ は $Ae_1$ から見て反時計回りのままです。' : '負なので、$Ae_2$ は $Ae_1$ から見て時計回りにあり、鏡像のようになっています。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let M; do { M = L_seq3(() => r.int(-3, 3)); } while (det3(M) === 0 && r.chance(0.8));
        const D = det3(M), c1 = M[1][1] * M[2][2] - M[1][2] * M[2][1], c2 = M[1][0] * M[2][2] - M[1][2] * M[2][0], c3 = M[1][0] * M[2][1] - M[1][1] * M[2][0];
        const asVol = r.chance(0.5);
        return {
          q: asVol ? [`Find the volume of the parallelepiped spanned by the rows $${vec(M[0])}$, $${vec(M[1])}$, $${vec(M[2])}$.`, `$${vec(M[0])}$、$${vec(M[1])}$、$${vec(M[2])}$ が張る平行六面体の体積を求めてください。`] : [`Compute $\\det ${mat(M)}$.`, `$\\det ${mat(M)}$ を計算してください。`],
          a: { type: 'int', v: asVol ? Math.abs(D) : D },
          hint: ['Expand along the first row: $a_{11}C_{11} - a_{12}C_{12} + a_{13}C_{13}$ with $2\\times 2$ minors.', '第1行で展開します。$2\\times 2$ の小行列式を使って $a_{11}C_{11} - a_{12}C_{12} + a_{13}C_{13}$ です。'],
          sol: [[`Minors: $${c1}$, $${c2}$, $${c3}$.`, `小行列式は $${c1}$、$${c2}$、$${c3}$ です。`], [`$\\det = ${M[0][0]}\\cdot(${c1}) - (${M[0][1]})\\cdot(${c2}) + (${M[0][2]})\\cdot(${c3}) = ${D}$.`, `$\\det = ${M[0][0]}\\cdot(${c1}) - (${M[0][1]})\\cdot(${c2}) + (${M[0][2]})\\cdot(${c3}) = ${D}$ です。`], [asVol ? `The volume is $|${D}| = ${Math.abs(D)}$.${D === 0 ? ' The three vectors lie in one plane.' : ''}` : (D === 0 ? 'Zero: the rows are dependent and the matrix has rank below 3.' : `Non-zero, so the matrix is invertible and the three vectors span all of $\\mathbb R^3$.`), asVol ? `体積は $|${D}| = ${Math.abs(D)}$ です。${D === 0 ? '三つのベクトルは一つの平面に入っています。' : ''}` : (D === 0 ? '0 なので行は一次従属で、階数は 3 未満です。' : '0 でないので行列は正則で、三つのベクトルは $\\mathbb R^3$ 全体を張ります。')]],
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, -1, 1.5, 0.5]), d = r.pick([1, 2, 0.5, -1.5]), k = r.pick([1, 2, -1, 0.5, 1.5]);
        const c = r1(r.real(-2, 2)), p = r1(r.real(-1.5, 1.5)), q = r1(r.real(-1.5, 1.5));
        const box = r.pick([[2, 1, 3], [1, 2, 2], [3, 1, 1], [2, 2, 2], [1, 1, 4]]), V = box[0] * box[1] * box[2];
        return {
          q: [`The box $[0, ${box[0]}]\\times[0, ${box[1]}]\\times[0, ${box[2]}]$ is mapped by $A = ${triTeX(a, c, p, d, q, k)}$. What is the volume of its image?`, `直方体 $[0, ${box[0]}]\\times[0, ${box[1]}]\\times[0, ${box[2]}]$ を $A = ${triTeX(a, c, p, d, q, k)}$ で写します。像の体積を求めてください。`],
          a: { type: 'num', v: Math.abs(a * d * k) * V },
          hint: ['Every volume is multiplied by the same factor $|\\det A|$.', 'すべての体積が同じ倍率 $|\\det A|$ 倍になります。'],
          sol: [[`The box has volume $${box.join('\\cdot')} = ${V}$.`, `直方体の体積は $${box.join('\\cdot')} = ${V}$ です。`], [`$\\det A = ${n(a)}\\cdot ${pn(d)}\\cdot ${pn(k)} = ${n(a * d * k)}$, so the image has volume $${n(Math.abs(a * d * k))}\\cdot ${V} = ${n(Math.abs(a * d * k) * V)}$.`, `$\\det A = ${n(a)}\\cdot ${pn(d)}\\cdot ${pn(k)} = ${n(a * d * k)}$ なので、像の体積は $${n(Math.abs(a * d * k))}\\cdot ${V} = ${n(Math.abs(a * d * k) * V)}$ です。`], ['The shear entries $c$, $p$, $q$ tilt the box but cannot change its volume.', 'せん断の成分 $c$, $p$, $q$ は直方体を傾けますが、体積は変えません。']],
          set: { a, d, c, p, q, k },
        };
      }
      const D = r.nz(-5, 5), s = r.pick([-2, 2, 3, -3, 4]), kind = r.int(0, 2);
      const v = kind === 0 ? s ** 3 * D : kind === 1 ? 1 / D : D * D;
      const what = kind === 0 ? [`\\det(${s}A)`, ''] : kind === 1 ? ['\\det(A^{-1})', ''] : ['\\det(A^{T}A)', ''];
      return {
        q: [`$A$ is $3\\times 3$ with $\\det A = ${D}$. What is $${what[0]}$?`, `$A$ は $3\\times 3$ 行列で $\\det A = ${D}$ です。$${what[0]}$ を求めてください。`],
        a: kind === 1 ? { type: 'num', v, show: frac(1, D) } : { type: 'int', v },
        hint: [kind === 0 ? 'Scaling the matrix scales each of the three columns.' : 'The determinant is multiplicative: $\\det(AB) = \\det A\\det B$.', kind === 0 ? '行列を定数倍すると、三つの列がそれぞれ定数倍されます。' : '行列式は乗法的です。$\\det(AB) = \\det A\\det B$ です。'],
        sol: kind === 0 ? [[`Each of the three columns is multiplied by $${s}$, so $\\det(${s}A) = (${s})^3\\det A = ${s ** 3}\\cdot ${pn(D)} = ${v}$.`, `三つの列がそれぞれ $${s}$ 倍されるので $\\det(${s}A) = (${s})^3\\det A = ${s ** 3}\\cdot ${pn(D)} = ${v}$ です。`], ['A common mistake is $' + s + '\\det A$: volume scales by the cube of a length factor.', 'よくある誤りは $' + s + '\\det A$ です。長さを定数倍すると、体積はその3乗倍になります。']]
          : kind === 1 ? [[`$AA^{-1} = I$ gives $\\det A\\cdot\\det A^{-1} = 1$.`, `$AA^{-1} = I$ より $\\det A\\cdot\\det A^{-1} = 1$ です。`], [`So $\\det A^{-1} = ${frac(1, D)}$: undoing a map divides volumes by what the map multiplied them by.`, `よって $\\det A^{-1} = ${frac(1, D)}$ です。写像を元に戻すと、体積は掛けた倍率で割られます。`]]
            : [[`$\\det A^{T} = \\det A$, so $\\det(A^{T}A) = (\\det A)^2 = ${v}$.`, `$\\det A^{T} = \\det A$ なので $\\det(A^{T}A) = (\\det A)^2 = ${v}$ です。`], ['It is never negative: $A^{T}A$ is the Gram matrix of the columns, and its determinant is the squared volume they span.', '負にはなりません。$A^{T}A$ は列のグラム行列で、その行列式は列の張る体積の2乗です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-2, 2), b = r.nz(-2, 2), c = r.nz(-2, 2), d = r.nz(-2, 2), s = a * b + c * d;
        return {
          q: [`Write $\\det ${mat([['x', a, 0], [b, 'x', c], [0, d, 'x']])}$ as a polynomial in $x$.`, `$\\det ${mat([['x', a, 0], [b, 'x', c], [0, d, 'x']])}$ を $x$ の多項式で表してください。`],
          a: { type: 'expr', v: s === 0 ? 'x^3' : `x^3${s > 0 ? '-' : '+'}${Math.abs(s)}*x`, vars: ['x'], dom: { x: [-2, 2] }, lhs: ['$\\det =$', '$\\det =$'] },
          hint: ['Expand along the first row; two of the three terms survive.', '第1行で展開します。三つの項のうち二つが残ります。'],
          sol: [[`$x\\,(x\\cdot x - ${pn(c)}\\cdot ${pn(d)}) - ${pn(a)}\\,(${n(b)}\\,x - ${pn(c)}\\cdot 0) + 0$.`, `$x\\,(x\\cdot x - ${pn(c)}\\cdot ${pn(d)}) - ${pn(a)}\\,(${n(b)}\\,x - ${pn(c)}\\cdot 0) + 0$ です。`], [`$= ${terms([[1, 'x^3'], [-s, 'x']])}$.`, `$= ${terms([[1, 'x^3'], [-s, 'x']])}$ です。`], [s > 0 ? `It vanishes at $x = 0$ and $x = \\pm\\sqrt{${s}}$: at those three values the matrix is singular.` : s < 0 ? 'It vanishes only at $x = 0$ among the reals, so for every other real $x$ the matrix is invertible.' : 'It is $x^3$, so the matrix is singular only at $x = 0$.', s > 0 ? `$x = 0$ と $x = \\pm\\sqrt{${s}}$ で 0 になり、これら三つの値で行列は特異になります。` : s < 0 ? '実数の範囲では $x = 0$ でのみ 0 になるので、それ以外の実数 $x$ では行列は正則です。' : '$x^3$ なので、行列が特異になるのは $x = 0$ のときだけです。']],
        };
      }
      if (form === 1) {
        let M, C2, rest;
        do {
          M = [[r.int(-2, 3), r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 3), r.int(-2, 2)], [r.int(-2, 2), 0, r.int(-2, 2)]];
          C2 = -(M[0][0] * M[1][2] - M[0][2] * M[1][0]);
          rest = M[2][0] * (M[0][1] * M[1][2] - M[0][2] * M[1][1]) + M[2][2] * (M[0][0] * M[1][1] - M[0][1] * M[1][0]);
        } while (C2 === 0);
        const k = -rest / C2, show = [[M[0][0], M[0][1], M[0][2]], [M[1][0], M[1][1], M[1][2]], [M[2][0], 'k', M[2][2]]];
        return {
          q: [`For which $k$ is $${mat(show)}$ singular?`, `$${mat(show)}$ が特異になる $k$ を求めてください。`],
          a: { type: 'num', v: k, show: frac(-rest, C2) },
          hint: ['Expand along the third row: the determinant is linear in $k$.', '第3行で展開すると、行列式は $k$ の一次式になります。'],
          sol: [[`Along the third row: $\\det = ${M[2][0]}\\,C_{31} + k\\,C_{32} ${M[2][2] < 0 ? '-' : '+'} ${Math.abs(M[2][2])}\\,C_{33} = ${terms([[C2, 'k'], [rest, '']])}$.`, `第3行で展開すると $\\det = ${M[2][0]}\\,C_{31} + k\\,C_{32} ${M[2][2] < 0 ? '-' : '+'} ${Math.abs(M[2][2])}\\,C_{33} = ${terms([[C2, 'k'], [rest, '']])}$ です。`], [`Setting it to zero gives $k = ${frac(-rest, C2)}$.`, `これを 0 とおくと $k = ${frac(-rest, C2)}$ です。`], ['For that $k$ the third row is a combination of the first two: the rows span only a plane and the rank is 2.', 'この $k$ では第3行が最初の二つの行の一次結合になり、行は平面しか張らず、階数は 2 です。']],
        };
      }
      const zero = r.sample(['a', 'd', 'k'], r.int(1, 2)), val = { a: 1, d: 1, k: 1, c: 0, p: 0, q: 0 };
      ['a', 'd', 'k'].forEach((key) => { val[key] = zero.includes(key) ? 0 : r.pick([1, 2, -1, 1.5, 0.5]); });
      ['c', 'p', 'q'].forEach((key) => { val[key] = r.chance(0.35) ? 0 : r.pick([1, -1, 0.5, 1.5, -0.5]); });
      const M = [[val.a, val.c, val.p], [0, val.d, val.q], [0, 0, val.k]], rk = rank3(M);
      return {
        q: [`What is the rank of $A = ${triTeX(val.a, val.c, val.p, val.d, val.q, val.k)}$?`, `$A = ${triTeX(val.a, val.c, val.p, val.d, val.q, val.k)}$ の階数を求めてください。`],
        a: { type: 'int', v: rk },
        hint: ['$\\det A = 0$ tells you the rank is below 3, but not how far below: count independent columns.', '$\\det A = 0$ から階数が 3 未満だとはわかりますが、いくつ下がるかはわかりません。独立な列を数えてください。'],
        sol: [[`$\\det A = ${n(val.a)}\\cdot ${pn(val.d)}\\cdot ${pn(val.k)} = 0$, so the rank is at most 2.`, `$\\det A = ${n(val.a)}\\cdot ${pn(val.d)}\\cdot ${pn(val.k)} = 0$ なので、階数は 2 以下です。`], [`The columns are $${vec(M.map((x) => x[0]))}$, $${vec(M.map((x) => x[1]))}$, $${vec(M.map((x) => x[2]))}$; row reduction leaves ${rk} non-zero row${rk === 1 ? '' : 's'}.`, `列は $${vec(M.map((x) => x[0]))}$、$${vec(M.map((x) => x[1]))}$、$${vec(M.map((x) => x[2]))}$ で、行基本変形のあとに残る零でない行は ${rk} 本です。`], [`Rank ${rk}: the cube is flattened onto ${rk === 2 ? 'a plane' : rk === 1 ? 'a line' : 'the origin'}.`, `階数は ${rk} で、立方体は${rk === 2 ? '平面' : rk === 1 ? '直線' : '原点'}に押し潰されます。`]],
        set: val,
      };
    },
  ];
  function L_seq3(f) { return [0, 1, 2].map(() => [0, 1, 2].map(f)); }

  // ---------- 3. eigenvectors and iteration ----------
  // The lab's A = R(θ) diag(λ1, λ2) R(θ)ᵀ.
  const pickL = (r, avoid) => { let l; do { l = r.step(-0.9, 1.4, 0.1); } while (avoid !== undefined && Math.abs(l - avoid) < 0.15); return l; };
  Q.eigen = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.int(-3, 4), d = r.int(-3, 4), b = r.nz(-3, 3), low = r.chance(0.5);
        const M = low ? [[a, 0], [b, d]] : [[a, b], [0, d]];
        return {
          q: [`What are the eigenvalues of $${mat(M)}$? Give the larger first.`, `$${mat(M)}$ の固有値を求めてください（大きい方から）。`],
          a: { type: 'tuple', v: [Math.max(a, d), Math.min(a, d)], labels: ['$\\lambda_1$', '$\\lambda_2$'] },
          hint: ['$\\det(A - \\lambda I)$ of a triangular matrix is the product of its diagonal entries.', '三角行列の $\\det(A - \\lambda I)$ は対角成分の積です。'],
          sol: [[`$\\det(A - \\lambda I) = (${a} - \\lambda)(${d} - \\lambda)$; the off-diagonal $${b}$ does not enter.`, `$\\det(A - \\lambda I) = (${a} - \\lambda)(${d} - \\lambda)$ で、非対角の $${b}$ は入りません。`], [`So $\\lambda = ${Math.max(a, d)}, ${Math.min(a, d)}$: the diagonal of a triangular matrix lists its eigenvalues.`, `よって $\\lambda = ${Math.max(a, d)}, ${Math.min(a, d)}$ です。三角行列の対角成分がそのまま固有値です。`]],
        };
      }
      if (form === 1) {
        const a = r.int(-2, 3), b = r.nz(-2, 2), v = r.pick([[1, 1], [1, -1], [2, 2], [1, 0], [1, 2], [-1, 1], [3, -3], [0, 1]]);
        const Av = [a * v[0] + b * v[1], b * v[0] + a * v[1]];
        const isEig = Av[0] * v[1] - Av[1] * v[0] === 0, lam = isEig ? (v[0] ? Av[0] / v[0] : Av[1] / v[1]) : null;
        return {
          q: [`Is $v = ${vec(v)}$ an eigenvector of $A = ${mat([[a, b], [b, a]])}$?`, `$v = ${vec(v)}$ は $A = ${mat([[a, b], [b, a]])}$ の固有ベクトルですか。`],
          a: { type: 'choice', opts: [[isEig ? `Yes, with eigenvalue $${lam}$` : 'Yes', isEig ? `はい。固有値は $${lam}$ です` : 'はい'], ['No: $Av$ is not a multiple of $v$', 'いいえ。$Av$ は $v$ の定数倍ではありません']], v: isEig ? 0 : 1, fixed: true },
          hint: ['Compute $Av$ and compare its direction with $v$.', '$Av$ を計算して、向きを $v$ と比べてください。'],
          sol: [[`$Av = ${vec(Av)}$.`, `$Av = ${vec(Av)}$ です。`], [isEig ? `$Av = ${lam}\\,v$, so $v$ only gets scaled: it lies on an invariant line.` : `$${vec(Av)}$ is not parallel to $${vec(v)}$, so $A$ turns $v$ off its line. For this matrix the eigenvectors lie along $(1, 1)$ and $(1, -1)$.`, isEig ? `$Av = ${lam}\\,v$ なので $v$ は伸縮されるだけで、不変な直線上にあります。` : `$${vec(Av)}$ は $${vec(v)}$ と平行でないので、$A$ は $v$ を直線から外します。この行列の固有ベクトルは $(1, 1)$ と $(1, -1)$ の向きです。`]],
        };
      }
      const l1 = pickL(r), th = r.step(0, 180, 5), k = r.int(2, 8), c = r.pick([1, 2, 0.5, -1, 3]);
      const v = l1 ** k * c;
      return {
        q: [`$u$ is a unit eigenvector of $A$ with eigenvalue $${n(l1)}$. What is $A^{${k}}(${n(c)}\\,u)$ as a multiple of $u$?`, `$u$ は固有値 $${n(l1)}$ の $A$ の単位固有ベクトルです。$A^{${k}}(${n(c)}\\,u)$ を $u$ の何倍かで答えてください。`],
        a: { type: 'num', v, tol: Math.max(1e-4, Math.abs(v) * 0.005) },
        hint: ['Each application multiplies an eigenvector by its eigenvalue.', '一回作用するごとに、固有ベクトルは固有値倍されます。'],
        sol: [[`$A^{${k}}u = (${n(l1)})^{${k}}u$, so $A^{${k}}(${n(c)}\\,u) = ${n(c)}\\cdot(${n(l1)})^{${k}}\\,u$.`, `$A^{${k}}u = (${n(l1)})^{${k}}u$ なので $A^{${k}}(${n(c)}\\,u) = ${n(c)}\\cdot(${n(l1)})^{${k}}\\,u$ です。`], [`$= ${n(v, 5)}\\,u$. ${Math.abs(l1) < 1 ? 'Since $|\\lambda| < 1$ it shrinks towards the origin' : Math.abs(l1) > 1 ? 'Since $|\\lambda| > 1$ it grows' : 'Since $|\\lambda| = 1$ its length stays the same'}${l1 < 0 ? ', flipping sides at every step.' : '.'}`, `$= ${n(v, 5)}\\,u$ です。${Math.abs(l1) < 1 ? '$|\\lambda| < 1$ なので原点に向かって縮みます' : Math.abs(l1) > 1 ? '$|\\lambda| > 1$ なので大きくなります' : '$|\\lambda| = 1$ なので長さは変わりません'}${l1 < 0 ? '。毎回反対側へ移ります。' : '。'}`]],
        set: { l1, angle: th, n: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, b, c, d, l1, l2;
        do { l1 = r.int(-3, 5); l2 = r.int(-3, 5); a = r.int(-3, 5); d = l1 + l2 - a; const bc = a * d - l1 * l2; b = r.pick([1, -1, 2, -2, 3]); c = bc / b; } while (l1 === l2 || !Number.isInteger(c) || Math.abs(c) > 6 || (b === 0 && c === 0) || Math.abs(d) > 6);
        const M = [[a, b], [c, d]], tr = a + d, D = a * d - b * c;
        return {
          q: [`Find the eigenvalues of $${mat(M)}$, larger first.`, `$${mat(M)}$ の固有値を大きい方から求めてください。`],
          a: { type: 'tuple', v: [Math.max(l1, l2), Math.min(l1, l2)], labels: ['$\\lambda_1$', '$\\lambda_2$'] },
          hint: ['$\\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = 0$.', '$\\lambda^2 - (\\operatorname{tr}A)\\lambda + \\det A = 0$ です。'],
          sol: [[`$\\operatorname{tr}A = ${tr}$, $\\det A = ${D}$, so $${terms([[1, '\\lambda^2'], [-tr, '\\lambda'], [D, '']])} = 0$.`, `$\\operatorname{tr}A = ${tr}$、$\\det A = ${D}$ なので $${terms([[1, '\\lambda^2'], [-tr, '\\lambda'], [D, '']])} = 0$ です。`], [`It factors as $(\\lambda ${l1 < 0 ? '+' : '-'} ${Math.abs(l1)})(\\lambda ${l2 < 0 ? '+' : '-'} ${Math.abs(l2)})$, so $\\lambda = ${Math.max(l1, l2)}, ${Math.min(l1, l2)}$.`, `$(\\lambda ${l1 < 0 ? '+' : '-'} ${Math.abs(l1)})(\\lambda ${l2 < 0 ? '+' : '-'} ${Math.abs(l2)})$ と因数分解できるので $\\lambda = ${Math.max(l1, l2)}, ${Math.min(l1, l2)}$ です。`], ['Check: the eigenvalues add to the trace and multiply to the determinant.', '確認：固有値の和は跡、積は行列式に等しくなっています。']],
        };
      }
      if (form === 1) {
        let M; do { M = [[r.int(-3, 4), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 4)]]; } while (M[0][1] === 0 && M[1][0] === 0);
        const tr = M[0][0] + M[1][1], D = det2(M);
        return {
          q: [`Write the characteristic polynomial $\\det(A - \\lambda I)$ of $A = ${mat(M)}$.`, `$A = ${mat(M)}$ の特性多項式 $\\det(A - \\lambda I)$ を書いてください。`],
          a: { type: 'expr', v: `lambda^2${tr === 0 ? '' : (tr > 0 ? '-' : '+') + Math.abs(tr) + '*lambda'}${D === 0 ? '' : (D > 0 ? '+' : '-') + Math.abs(D)}`, vars: ['lambda'], dom: { lambda: [-3, 3] }, lhs: ['$p(\\lambda) =$', '$p(\\lambda) =$'] },
          hint: ['Expand $(a - \\lambda)(d - \\lambda) - bc$.', '$(a - \\lambda)(d - \\lambda) - bc$ を展開してください。'],
          sol: [[`$(${M[0][0]} - \\lambda)(${M[1][1]} - \\lambda) - (${M[0][1]})(${M[1][0]})$.`, `$(${M[0][0]} - \\lambda)(${M[1][1]} - \\lambda) - (${M[0][1]})(${M[1][0]})$ です。`], [`$= ${terms([[1, '\\lambda^2'], [-tr, '\\lambda'], [D, '']])}$: the coefficients are minus the trace and the determinant.`, `$= ${terms([[1, '\\lambda^2'], [-tr, '\\lambda'], [D, '']])}$ で、係数は跡の符号を変えたものと行列式です。`], [tr * tr - 4 * D < 0 ? `Its discriminant $${tr * tr - 4 * D}$ is negative: no real eigenvalues, so no real invariant line, and $A$ involves a rotation.` : `Its discriminant is $${tr * tr - 4 * D}$ ${tr * tr - 4 * D === 0 ? '= 0: a repeated eigenvalue.' : '> 0: two real eigenvalues and two invariant lines.'}`, tr * tr - 4 * D < 0 ? `判別式 $${tr * tr - 4 * D}$ が負なので実固有値はなく、実の不変直線もありません。$A$ には回転が含まれます。` : `判別式は $${tr * tr - 4 * D}$ で、${tr * tr - 4 * D === 0 ? '0 なので固有値は重解です。' : '正なので二つの実固有値と二本の不変直線があります。'}`]],
        };
      }
      const l1 = pickL(r), l2 = pickL(r, l1), th = r.step(0, 180, 5), k = r.int(1, 8), al = r.pick([1, 2, -1, 0.5]), be = r.pick([1, 2, -1, 0.5, -2]);
      return {
        q: [`$A$ has eigenvalue $${n(l1)}$ along the unit vector $u_1$ and $${n(l2)}$ along $u_2 \\perp u_1$. If $v = ${n(al)}\\,u_1 ${be < 0 ? '-' : '+'} ${n(Math.abs(be))}\\,u_2$, find the coordinates of $A^{${k}}v$ along $u_1$ and $u_2$.`, `$A$ は単位ベクトル $u_1$ の向きに固有値 $${n(l1)}$、$u_2 \\perp u_1$ の向きに固有値 $${n(l2)}$ をもちます。$v = ${n(al)}\\,u_1 ${be < 0 ? '-' : '+'} ${n(Math.abs(be))}\\,u_2$ のとき、$A^{${k}}v$ の $u_1$、$u_2$ 方向の座標を求めてください。`],
        a: { type: 'tuple', v: [al * l1 ** k, be * l2 ** k], labels: ['$u_1$', '$u_2$'], tol: 6e-4 },
        hint: ['In the eigenbasis $A$ is diagonal, so each coordinate is multiplied by its own eigenvalue at every step.', '固有基底では $A$ は対角なので、各座標は毎回それぞれの固有値倍になります。'],
        sol: [[`$A^{${k}}v = ${n(al)}(${n(l1)})^{${k}}u_1 + ${n(be)}(${n(l2)})^{${k}}u_2$.`, `$A^{${k}}v = ${n(al)}(${n(l1)})^{${k}}u_1 + ${n(be)}(${n(l2)})^{${k}}u_2$ です。`], [`$= ${n(al * l1 ** k, 4)}\\,u_1 + ${n(be * l2 ** k, 4)}\\,u_2$.`, `$= ${n(al * l1 ** k, 4)}\\,u_1 + ${n(be * l2 ** k, 4)}\\,u_2$ です。`], [`The coordinate with the larger $|\\lambda|$ (here $u_${Math.abs(l1) >= Math.abs(l2) ? 1 : 2}$) comes to dominate, which is why the orbit in the figure lines up with that eigendirection.`, `$|\\lambda|$ の大きい方（ここでは $u_${Math.abs(l1) >= Math.abs(l2) ? 1 : 2}$）の座標がしだいに支配的になります。図の軌道がその固有方向にそろっていくのはこのためです。`]],
        set: { l1, l2, angle: th, n: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b] = r.pick([[2, 1], [3, 1], [3, 2], [4, 1], [4, 3], [5, 2]]), l1 = a + b, l2 = a - b;
        return {
          q: [`$A = ${mat([[a, b], [b, a]])}$. Write the first entry of $A^{n}\\begin{pmatrix}1\\\\0\\end{pmatrix}$ as a function of $n$.`, `$A = ${mat([[a, b], [b, a]])}$ とします。$A^{n}\\begin{pmatrix}1\\\\0\\end{pmatrix}$ の第1成分を $n$ の式で表してください。`],
          a: { type: 'expr', v: l2 === 1 ? `(${l1}^n+1)/2` : `(${l1}^n+${l2}^n)/2`, vars: ['n'], dom: { n: [1, 5] }, lhs: ['$(A^{n}e_1)_1 =$', '$(A^{n}e_1)_1 =$'] },
          hint: ['Write $e_1 = \\tfrac12(1, 1) + \\tfrac12(1, -1)$ in eigenvectors.', '$e_1 = \\tfrac12(1, 1) + \\tfrac12(1, -1)$ と固有ベクトルで書いてください。'],
          sol: [[`$(1, 1)$ has eigenvalue $${l1}$ and $(1, -1)$ has eigenvalue $${l2}$.`, `$(1, 1)$ の固有値は $${l1}$、$(1, -1)$ の固有値は $${l2}$ です。`], [`$A^{n}e_1 = \\tfrac12\\,${l1}^{n}(1, 1) + \\tfrac12\\,${l2}^{n}(1, -1)$, whose first entry is $\\tfrac12(${l1}^{n} + ${l2 === 1 ? 1 : l2 + '^{n}'})$.`, `$A^{n}e_1 = \\tfrac12\\,${l1}^{n}(1, 1) + \\tfrac12\\,${l2}^{n}(1, -1)$ で、第1成分は $\\tfrac12(${l1}^{n} + ${l2 === 1 ? 1 : l2 + '^{n}'})$ です。`], [`For large $n$ the $${l1}^{n}$ term dominates: $A^{n}e_1$ turns towards the eigenvector $(1, 1)$.`, `$n$ が大きいと $${l1}^{n}$ の項が支配的になり、$A^{n}e_1$ は固有ベクトル $(1, 1)$ の向きに近づきます。`]],
        };
      }
      if (form === 1) {
        const cases = [[0.5, 0.8], [1.2, 0.5], [1, 0.5], [-0.9, 0.6], [1.3, -0.4], [0.9, -0.7], [1, -0.6], [0.7, 1.1], [-0.5, 1]];
        const [l1, l2] = r.pick(cases), th = r.step(0, 180, 5), mx = Math.max(Math.abs(l1), Math.abs(l2));
        const one = Math.abs(l1 - 1) < 1e-9 ? l1 : Math.abs(l2 - 1) < 1e-9 ? l2 : null;
        const v = mx < 1 ? 0 : mx > 1 ? 1 : 2;
        return {
          q: [`$A$ has eigenvalues $${n(l1)}$ and $${n(l2)}$ with perpendicular eigenvectors. Starting from a generic $v$ (with a component along both), what does $A^{n}v$ do as $n \\to \\infty$?`, `$A$ の固有値は $${n(l1)}$ と $${n(l2)}$ で、固有ベクトルは直交しています。両方向の成分をもつ一般の $v$ から始めると、$n \\to \\infty$ で $A^{n}v$ はどうなりますか。`],
          a: { type: 'choice', opts: [['It tends to the origin', '原点に近づく'], ['It grows without bound along the dominant eigendirection', '支配的な固有方向に沿って限りなく大きくなる'], ['It converges to a non-zero point on the eigenline of $\\lambda = 1$', '$\\lambda = 1$ の固有直線上の、零でない点に収束する'], ['It converges to the dominant eigenvector, keeping its length', '長さを保ったまま支配的な固有ベクトルに収束する']], v, fixed: true },
          hint: ['Follow each eigen-coordinate separately: it is multiplied by $\\lambda_i^{n}$.', '固有座標を別々に追ってください。それぞれ $\\lambda_i^{n}$ 倍されます。'],
          sol: [[`$A^{n}v = c_1(${n(l1)})^{n}u_1 + c_2(${n(l2)})^{n}u_2$ with $c_1, c_2 \\ne 0$.`, `$c_1, c_2 \\ne 0$ として $A^{n}v = c_1(${n(l1)})^{n}u_1 + c_2(${n(l2)})^{n}u_2$ です。`], [v === 0 ? 'Both $|\\lambda_i| < 1$, so both terms decay: the orbit falls into the origin.' : v === 1 ? `The largest $|\\lambda| = ${n(mx)} > 1$, so that term grows geometrically and the orbit runs off along its eigenline${(Math.abs(l1) > 1 ? l1 : l2) < 0 ? ', jumping from side to side' : ''}.` : `The $\\lambda = 1$ term stays fixed while the other decays, so $A^{n}v \\to c\\,u$ on the eigenline of $${n(one)}$: the projection of $v$ onto it along the other eigendirection.`, v === 0 ? '$|\\lambda_i| < 1$ が両方で成り立つので、どちらの項も減衰し、軌道は原点に落ちていきます。' : v === 1 ? `最大の $|\\lambda| = ${n(mx)} > 1$ なので、その項が等比的に増え、軌道は固有直線に沿って遠ざかります${(Math.abs(l1) > 1 ? l1 : l2) < 0 ? '（左右に跳びながら）' : ''}。` : `$\\lambda = 1$ の項は変わらず、もう一方は減衰するので、$A^{n}v$ は $${n(one)}$ の固有直線上の $c\\,u$ に収束します。これは $v$ をもう一方の固有方向に沿ってその直線へ射影した点です。`], ['The last option is the mistake of normalising: without dividing by $\\lambda_1^{n}$ the length changes too.', '最後の選択肢は正規化と混同した誤りです。$\\lambda_1^{n}$ で割らなければ長さも変わります。']],
          set: { l1, l2, angle: th, n: 8 },
        };
      }
      const l2 = r.pick([0.9, 0.8, 0.7, 0.6, 0.5, -0.8, -0.7, -0.6, 0.4]), pct = r.pick([1, 5, 10]), l1 = r.pick([1.2, 1.1, 1, 1.3]);
      const k = Math.ceil(Math.log(pct / 100) / Math.log(Math.abs(l2)));
      return {
        q: [`With eigenvalue $${n(l2)}$ along $u_2$, after how many applications of $A$ is the $u_2$ component of $v$ first below ${pct}% of its starting size?`, `$u_2$ の向きの固有値が $${n(l2)}$ のとき、$A$ を何回作用させると $v$ の $u_2$ 成分がはじめて最初の大きさの ${pct}% 未満になりますか。`],
        a: { type: 'int', v: k },
        hint: [`Solve $|${n(l2)}|^{n} < ${pct / 100}$ with logarithms, then round up.`, `$|${n(l2)}|^{n} < ${pct / 100}$ を対数で解き、切り上げてください。`],
        sol: [[`After $n$ steps the component is $|${n(l2)}|^{n}$ times its start.`, `$n$ 回後の成分は最初の $|${n(l2)}|^{n}$ 倍です。`], [`$n > \\dfrac{\\ln ${pct / 100}}{\\ln ${n(Math.abs(l2))}} = ${n(Math.log(pct / 100) / Math.log(Math.abs(l2)), 3)}$, so $n = ${k}$.`, `$n > \\dfrac{\\ln ${pct / 100}}{\\ln ${n(Math.abs(l2))}} = ${n(Math.log(pct / 100) / Math.log(Math.abs(l2)), 3)}$ なので $n = ${k}$ です。`], ['This is the convergence rate of the power method: the error along the second eigenvector shrinks by $|\\lambda_2/\\lambda_1|$ per step, so eigenvalues close in size converge slowly.', 'これはべき乗法の収束の速さです。第2固有ベクトル方向の誤差は1回ごとに $|\\lambda_2/\\lambda_1|$ 倍になるので、大きさの近い固有値では収束が遅くなります。']],
        set: k <= 8 ? { l1, l2, n: k } : { l1, l2 },
      };
    },
  ];

  // ---------- 4. least squares as projection ----------
  const lsq = (b) => { const s0 = b[0] + b[1] + b[2], s1 = b[1] + 2 * b[2]; const x0 = (5 * s0 - 3 * s1) / 6, x1 = (s1 - s0) / 2; const p = [x0, x0 + x1, x0 + 2 * x1]; return { s0, s1, x0, x1, p, e: b.map((y, i) => y - p[i]) }; };
  const ATEX = mat([[1, 0], [1, 1], [1, 2]]);
  Q.projection = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const dim = r.int(2, 3);
        let u, w; do { u = L_vec(r, dim, -2, 3); w = L_vec(r, dim, -3, 3); } while (u.every((x) => x === 0) || dot(u, w) === 0);
        const uu = dot(u, u), uw = dot(u, w), p = u.map((x) => x * uw / uu);
        return {
          q: [`Project $w = ${vec(w)}$ onto the line spanned by $u = ${vec(u)}$.`, `$w = ${vec(w)}$ を $u = ${vec(u)}$ の張る直線に射影してください。`],
          a: { type: 'tuple', v: p, show: `\\left(${u.map((x) => frac(x * uw, uu)).join(',\\ ')}\\right)`, labels: dim === 2 ? ['$p_1$', '$p_2$'] : ['$p_1$', '$p_2$', '$p_3$'] },
          hint: ['$p = \\dfrac{u\\cdot w}{u\\cdot u}\\,u$.', '$p = \\dfrac{u\\cdot w}{u\\cdot u}\\,u$ です。'],
          sol: [[`$u\\cdot w = ${uw}$, $u\\cdot u = ${uu}$.`, `$u\\cdot w = ${uw}$、$u\\cdot u = ${uu}$ です。`], [`$p = ${frac(uw, uu)}\\,${vec(u)} = ${vec(p)}$.`, `$p = ${frac(uw, uu)}\\,${vec(u)} = ${vec(p)}$ です。`], [`Check: $w - p$ is perpendicular to $u$, so $p$ is the closest point of the line to $w$.`, `確認：$w - p$ は $u$ に垂直なので、$p$ は直線上で $w$ に最も近い点です。`]],
        };
      }
      if (form === 1) {
        let b; do { b = [r.int(0, 3), r.int(0, 3), r.int(0, 3)]; } while (b.every((x) => x === 0));
        const F = lsq(b);
        return {
          q: [`For the data $b = ${vec(b)}$ at $t = 0, 1, 2$ and $A = ${ATEX}$, compute $A^{T}b$.`, `$t = 0, 1, 2$ でのデータ $b = ${vec(b)}$ と $A = ${ATEX}$ について、$A^{T}b$ を計算してください。`],
          a: { type: 'tuple', v: [F.s0, F.s1], labels: ['$(A^Tb)_1$', '$(A^Tb)_2$'] },
          hint: ['Each entry is a column of $A$ dotted with $b$.', '各成分は $A$ の列と $b$ の内積です。'],
          sol: [[`$(1, 1, 1)\\cdot b = ${F.s0}$ and $(0, 1, 2)\\cdot b = ${F.s1}$.`, `$(1, 1, 1)\\cdot b = ${F.s0}$、$(0, 1, 2)\\cdot b = ${F.s1}$ です。`], ['These are $\\sum y_i$ and $\\sum t_iy_i$, the right-hand side of the normal equations.', 'これらは $\\sum y_i$ と $\\sum t_iy_i$ で、正規方程式の右辺です。']],
          set: { b1: b[0], b2: b[1], b3: b[2] },
        };
      }
      const k = r.pick([1, -1, 2, -2, 3]), opts = [[`$(${k}, ${-2 * k}, ${k})$`, `$(${k}, ${-2 * k}, ${k})$`], [`$(${k}, ${k}, ${k})$`, `$(${k}, ${k}, ${k})$`], [`$(${k}, ${2 * k}, ${k})$`, `$(${k}, ${2 * k}, ${k})$`], [`$(${-k}, 0, ${k})$`, `$(${-k}, 0, ${k})$`]];
      return {
        q: [`$A = ${ATEX}$. Which vector is perpendicular to the column space of $A$, so could be a least-squares residual?`, `$A = ${ATEX}$ とします。$A$ の列空間に垂直で、最小二乗法の残差になりうるベクトルはどれですか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['It must have zero dot product with both columns $(1, 1, 1)$ and $(0, 1, 2)$.', '両方の列 $(1, 1, 1)$ と $(0, 1, 2)$ との内積が 0 でなければなりません。'],
        sol: [[`$(${k}, ${-2 * k}, ${k})\\cdot(1, 1, 1) = 0$ and $\\cdot(0, 1, 2) = ${-2 * k} + ${2 * k} = 0$.`, `$(${k}, ${-2 * k}, ${k})\\cdot(1, 1, 1) = 0$、$\\cdot(0, 1, 2) = ${-2 * k} + ${2 * k} = 0$ です。`], [`$(${k}, ${k}, ${k})$ is a column itself, and $(${-k}, 0, ${k}) = ${k}\\big((0, 1, 2) - (1, 1, 1)\\big)$ lies in the plane; $(${k}, ${2 * k}, ${k})$ fails both tests. Every residual is a multiple of $(1, -2, 1)$.`, `$(${k}, ${k}, ${k})$ は列そのもの、$(${-k}, 0, ${k}) = ${k}\\big((0, 1, 2) - (1, 1, 1)\\big)$ は平面内のベクトルで、$(${k}, ${2 * k}, ${k})$ はどちらの条件も満たしません。残差はすべて $(1, -2, 1)$ の定数倍です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let b, F; do { b = [r.int(0, 3), r.int(0, 3), r.int(0, 3)]; F = lsq(b); } while (F.e.every((x) => Math.abs(x) < 1e-9) && r.chance(0.8));
        return {
          q: [`Fit $y = x_0 + x_1t$ by least squares to the points $(0, ${b[0]})$, $(1, ${b[1]})$, $(2, ${b[2]})$. Find $\\hat x = (x_0, x_1)$.`, `点 $(0, ${b[0]})$、$(1, ${b[1]})$、$(2, ${b[2]})$ に最小二乗法で $y = x_0 + x_1t$ を当てはめ、$\\hat x = (x_0, x_1)$ を求めてください。`],
          a: { type: 'tuple', v: [F.x0, F.x1], labels: ['$x_0$', '$x_1$'], show: `\\left(${frac(5 * F.s0 - 3 * F.s1, 6)},\\ ${frac(F.s1 - F.s0, 2)}\\right)` },
          hint: ['Solve $A^{T}A\\hat x = A^{T}b$ with $A^{T}A = \\begin{pmatrix}3&3\\\\3&5\\end{pmatrix}$.', '$A^{T}A = \\begin{pmatrix}3&3\\\\3&5\\end{pmatrix}$ として $A^{T}A\\hat x = A^{T}b$ を解いてください。'],
          sol: [[`$A^{T}b = (${F.s0}, ${F.s1})$.`, `$A^{T}b = (${F.s0}, ${F.s1})$ です。`], [`$3x_0 + 3x_1 = ${F.s0}$ and $3x_0 + 5x_1 = ${F.s1}$; subtracting, $2x_1 = ${F.s1 - F.s0}$, so $x_1 = ${frac(F.s1 - F.s0, 2)}$ and $x_0 = ${frac(5 * F.s0 - 3 * F.s1, 6)}$.`, `$3x_0 + 3x_1 = ${F.s0}$、$3x_0 + 5x_1 = ${F.s1}$ の差をとると $2x_1 = ${F.s1 - F.s0}$ なので、$x_1 = ${frac(F.s1 - F.s0, 2)}$、$x_0 = ${frac(5 * F.s0 - 3 * F.s1, 6)}$ です。`], [`The fitted values are $p = ${vec(F.p, 3)}$ and the residual $e = ${vec(F.e, 3)}$ is perpendicular to both columns.`, `当てはめた値は $p = ${vec(F.p, 3)}$ で、残差 $e = ${vec(F.e, 3)}$ は両方の列に垂直です。`]],
          set: { b1: b[0], b2: b[1], b3: b[2] },
        };
      }
      if (form === 1) {
        const y = [r.int(-2, 4), r.int(-2, 4), r.int(-2, 4)], m = (y[0] + y[1] + y[2]) / 3, s = (y[2] - y[0]) / 2;
        return {
          q: [`Fit $y = c + mt$ by least squares to $(-1, ${y[0]})$, $(0, ${y[1]})$, $(1, ${y[2]})$. Find $(c, m)$.`, `$(-1, ${y[0]})$、$(0, ${y[1]})$、$(1, ${y[2]})$ に最小二乗法で $y = c + mt$ を当てはめ、$(c, m)$ を求めてください。`],
          a: { type: 'tuple', v: [m, s], labels: ['$c$', '$m$'], show: `\\left(${frac(y[0] + y[1] + y[2], 3)},\\ ${frac(y[2] - y[0], 2)}\\right)` },
          hint: ['Here the columns $(1, 1, 1)$ and $(-1, 0, 1)$ are perpendicular, so $A^{T}A$ is diagonal.', 'ここでは列 $(1, 1, 1)$ と $(-1, 0, 1)$ が直交するので、$A^{T}A$ は対角行列です。'],
          sol: [[`$A^{T}A = \\begin{pmatrix}3&0\\\\0&2\\end{pmatrix}$ and $A^{T}b = (${y[0] + y[1] + y[2]}, ${y[2] - y[0]})$.`, `$A^{T}A = \\begin{pmatrix}3&0\\\\0&2\\end{pmatrix}$、$A^{T}b = (${y[0] + y[1] + y[2]}, ${y[2] - y[0]})$ です。`], [`$c = ${frac(y[0] + y[1] + y[2], 3)}$ (the mean) and $m = ${frac(y[2] - y[0], 2)}$.`, `$c = ${frac(y[0] + y[1] + y[2], 3)}$（平均）、$m = ${frac(y[2] - y[0], 2)}$ です。`], ['With orthogonal columns the projection splits into two one-dimensional projections, which is why centring the data is the first step of every regression.', '列が直交していると、射影は二つの一次元の射影に分かれます。回帰でまずデータを中心化するのはこのためです。']],
        };
      }
      const b = [r.step(0, 3, 0.1), r.step(0, 3, 0.1), r.step(0, 3, 0.1)], dd = Math.round((b[0] - 2 * b[1] + b[2]) * 10) / 10, e2 = dd * dd / 6;
      return {
        q: [`For the data $b = ${vec(b)}$ at $t = 0, 1, 2$, find the squared residual $\\|b - A\\hat x\\|^2$ of the least-squares line.`, `$t = 0, 1, 2$ でのデータ $b = ${vec(b)}$ について、最小二乗直線の残差の2乗 $\\|b - A\\hat x\\|^2$ を求めてください。`],
        a: { type: 'num', v: e2, tol: Math.max(5e-4, e2 * 0.005) },
        hint: ['The residual is the part of $b$ along the normal $(1, -2, 1)$ of the column space.', '残差は、$b$ のうち列空間の法線 $(1, -2, 1)$ 方向の部分です。'],
        sol: [[`$n = (1, -2, 1)$ is perpendicular to both columns, so $e = \\dfrac{b\\cdot n}{n\\cdot n}\\,n$.`, `$n = (1, -2, 1)$ は両方の列に垂直なので $e = \\dfrac{b\\cdot n}{n\\cdot n}\\,n$ です。`], [`$b\\cdot n = ${n(b[0])} - ${pn(2 * b[1])} + ${n(b[2])} = ${n(dd)}$, so $\\|e\\|^2 = ${n(dd)}^2/6 = ${n(e2, 4)}$.`, `$b\\cdot n = ${n(b[0])} - ${pn(2 * b[1])} + ${n(b[2])} = ${n(dd)}$ なので $\\|e\\|^2 = ${n(dd)}^2/6 = ${n(e2, 4)}$ です。`], ['It is zero exactly when $b_1 - 2b_2 + b_3 = 0$, that is, when the three points are collinear.', 'これが 0 になるのは $b_1 - 2b_2 + b_3 = 0$、つまり三点が一直線上にあるときに限ります。']],
        set: { b1: b[0], b2: b[1], b3: b[2] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const i = r.int(1, 3), j = r.int(1, 3), nn = [1, -2, 1], v = (i === j ? 1 : 0) - nn[i - 1] * nn[j - 1] / 6;
        return {
          q: [`$P = A(A^{T}A)^{-1}A^{T}$ projects onto the column space of $A = ${ATEX}$. Find the entry $P_{${i}${j}}$.`, `$P = A(A^{T}A)^{-1}A^{T}$ は $A = ${ATEX}$ の列空間への射影です。成分 $P_{${i}${j}}$ を求めてください。`],
          a: { type: 'num', v, show: frac(Math.round(v * 6), 6) },
          hint: ['Projecting onto a plane is the identity minus projecting onto its normal: $P = I - \\dfrac{nn^{T}}{n^{T}n}$.', '平面への射影は、恒等写像から法線への射影を引いたものです。$P = I - \\dfrac{nn^{T}}{n^{T}n}$ です。'],
          sol: [[`The normal is $n = (1, -2, 1)$ with $n^{T}n = 6$.`, `法線は $n = (1, -2, 1)$ で $n^{T}n = 6$ です。`], [`$P_{${i}${j}} = ${i === j ? 1 : 0} - \\dfrac{(${nn[i - 1]})(${nn[j - 1]})}{6} = ${frac(Math.round(v * 6), 6)}$.`, `$P_{${i}${j}} = ${i === j ? 1 : 0} - \\dfrac{(${nn[i - 1]})(${nn[j - 1]})}{6} = ${frac(Math.round(v * 6), 6)}$ です。`], ['Check: the trace of $P$ is $5/6 + 1/3 + 5/6 = 2$, the dimension of the plane, and $P^2 = P$.', '確認：$P$ の跡は $5/6 + 1/3 + 5/6 = 2$ で平面の次元に等しく、$P^2 = P$ です。']],
        };
      }
      if (form === 1) {
        let b1, b2, b3; do { b1 = r.step(0, 3, 0.1); b2 = r.step(0, 3, 0.1); b3 = 2 * b2 - b1; } while (b3 < -0.001 || b3 > 3.001);
        b3 = Math.round(b3 * 10) / 10;
        return {
          q: [`The data at $t = 0, 1$ are $b_1 = ${n(b1)}$, $b_2 = ${n(b2)}$. Which value $b_3$ at $t = 2$ makes the least-squares residual zero?`, `$t = 0, 1$ でのデータが $b_1 = ${n(b1)}$、$b_2 = ${n(b2)}$ です。最小二乗法の残差を 0 にする $t = 2$ での値 $b_3$ を求めてください。`],
          a: { type: 'num', v: b3 },
          hint: ['Zero residual means $b$ lies in the column space: $b\\cdot(1, -2, 1) = 0$.', '残差が 0 とは $b$ が列空間にあること、すなわち $b\\cdot(1, -2, 1) = 0$ です。'],
          sol: [[`$b_1 - 2b_2 + b_3 = 0$ gives $b_3 = 2\\cdot ${pn(b2)} - ${pn(b1)} = ${n(b3)}$.`, `$b_1 - 2b_2 + b_3 = 0$ より $b_3 = 2\\cdot ${pn(b2)} - ${pn(b1)} = ${n(b3)}$ です。`], ['Then the three points are collinear: the line through the first two passes through the third, $b$ is its own projection and $e = 0$.', 'このとき三点は一直線上にあり、最初の二点を通る直線が三点目も通ります。$b$ はそれ自身の射影で、$e = 0$ です。']],
          set: { b1, b2, b3 },
        };
      }
      const b1 = r.int(0, 3), b2 = r.int(0, 3), slope = r.chance(0.5);
      return slope ? {
        q: [`Fit $y = x_0 + x_1t$ to $(0, ${b1})$, $(1, ${b2})$, $(2, y)$. Write the least-squares slope $\\hat x_1$ as a function of $y$.`, `$(0, ${b1})$、$(1, ${b2})$、$(2, y)$ に $y = x_0 + x_1t$ を当てはめます。最小二乗の傾き $\\hat x_1$ を $y$ の式で表してください。`],
        a: { type: 'expr', v: `(y-${b1})/2`, vars: ['y'], dom: { y: [-2, 4] }, lhs: ['$\\hat x_1 =$', '$\\hat x_1 =$'] },
        hint: ['From the normal equations, $2\\hat x_1 = \\sum t_iy_i - \\sum y_i$.', '正規方程式から $2\\hat x_1 = \\sum t_iy_i - \\sum y_i$ です。'],
        sol: [[`$\\sum y_i = ${b1 + b2} + y$ and $\\sum t_iy_i = ${b2} + 2y$.`, `$\\sum y_i = ${b1 + b2} + y$、$\\sum t_iy_i = ${b2} + 2y$ です。`], [`$2\\hat x_1 = (${b2} + 2y) - (${b1 + b2} + y) = y - ${b1}$, so $\\hat x_1 = (y - ${b1})/2$.`, `$2\\hat x_1 = (${b2} + 2y) - (${b1 + b2} + y) = y - ${b1}$ なので $\\hat x_1 = (y - ${b1})/2$ です。`], [`The middle value $${b2}$ has dropped out: with equally spaced $t$, the slope depends only on the two end points, while the middle point moves only the intercept.`, `中央の値 $${b2}$ は消えました。$t$ が等間隔なら傾きは両端の点だけで決まり、中央の点は切片だけを動かします。`]],
      } : {
        q: [`Fit $y = x_0 + x_1t$ to $(0, ${b1})$, $(1, ${b2})$, $(2, y)$. Write the least-squares intercept $\\hat x_0$ as a function of $y$.`, `$(0, ${b1})$、$(1, ${b2})$、$(2, y)$ に $y = x_0 + x_1t$ を当てはめます。最小二乗の切片 $\\hat x_0$ を $y$ の式で表してください。`],
        a: { type: 'expr', v: `(${5 * b1 + 2 * b2}-y)/6`, vars: ['y'], dom: { y: [-2, 4] }, lhs: ['$\\hat x_0 =$', '$\\hat x_0 =$'] },
        hint: ['Invert $A^{T}A = \\begin{pmatrix}3&3\\\\3&5\\end{pmatrix}$: $(A^{T}A)^{-1} = \\tfrac16\\begin{pmatrix}5&-3\\\\-3&3\\end{pmatrix}$.', '$A^{T}A = \\begin{pmatrix}3&3\\\\3&5\\end{pmatrix}$ の逆行列は $\\tfrac16\\begin{pmatrix}5&-3\\\\-3&3\\end{pmatrix}$ です。'],
        sol: [[`$A^{T}b = (${b1 + b2} + y,\\ ${b2} + 2y)$.`, `$A^{T}b = (${b1 + b2} + y,\\ ${b2} + 2y)$ です。`], [`$\\hat x_0 = \\tfrac16\\big(5(${b1 + b2} + y) - 3(${b2} + 2y)\\big) = \\dfrac{${5 * b1 + 2 * b2} - y}{6}$.`, `$\\hat x_0 = \\tfrac16\\big(5(${b1 + b2} + y) - 3(${b2} + 2y)\\big) = \\dfrac{${5 * b1 + 2 * b2} - y}{6}$ です。`], ['Raising the last point lowers the intercept: the line pivots, steepening on the right and dropping on the left.', '最後の点を上げると切片は下がります。直線が回転して右側で急になり、左側で下がるからです。']],
      };
    },
  ];
  function dot(u, w) { return u.reduce((s, x, i) => s + x * w[i], 0); }
  function L_vec(r, dim, lo, hi) { return Array.from({ length: dim }, () => r.int(lo, hi)); }

  // ---------- 5. singular values ----------
  // The lab's A = R(angle) diag(s1, s2) R(input)ᵀ.
  const svd2 = (M) => {
    const a = M[0][0] ** 2 + M[1][0] ** 2, c = M[0][1] ** 2 + M[1][1] ** 2, b = M[0][0] * M[0][1] + M[1][0] * M[1][1];
    const tr = a + c, dt = a * c - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - dt));
    return { ata: [[a, b], [b, c]], tr, dt, s1: Math.sqrt(tr / 2 + disc), s2: Math.sqrt(Math.max(0, tr / 2 - disc)), th: 0.5 * Math.atan2(2 * b, a - c) };
  };
  Q.svd = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.nz(-4, 4), q = r.nz(-4, 4);
        return {
          q: [`What are the singular values of $${mat([[p, 0], [0, q]])}$, larger first?`, `$${mat([[p, 0], [0, q]])}$ の特異値を大きい方から求めてください。`],
          a: { type: 'tuple', v: [Math.max(Math.abs(p), Math.abs(q)), Math.min(Math.abs(p), Math.abs(q))], labels: ['$\\sigma_1$', '$\\sigma_2$'] },
          hint: ['Singular values are lengths of stretches, so they are never negative.', '特異値は伸びの長さなので、負になることはありません。'],
          sol: [[`The matrix stretches the axes by $${p}$ and $${q}$; a minus sign is a reflection, which goes into $U$ or $V$, not into $\\Sigma$.`, `この行列は軸を $${p}$ 倍と $${q}$ 倍にします。負の符号は鏡映で、$\\Sigma$ ではなく $U$ か $V$ に入ります。`], [`So $\\sigma = ${Math.max(Math.abs(p), Math.abs(q))}, ${Math.min(Math.abs(p), Math.abs(q))}$, sorted in decreasing order.`, `よって $\\sigma = ${Math.max(Math.abs(p), Math.abs(q))}, ${Math.min(Math.abs(p), Math.abs(q))}$ で、大きい順に並べます。`]],
        };
      }
      const s1 = r.step(1, 3, 0.1), s2 = r.step(0.05, 1, 0.05), a = r.step(0, 180, 5), b = r.step(0, 180, 5);
      if (form === 1) return {
        q: [`$A = U\\Sigma V^{T}$ with $\\sigma_1 = ${n(s1)}$, $\\sigma_2 = ${n(s2)}$. What is the area of the ellipse $A$ makes from the unit disc?`, `$A = U\\Sigma V^{T}$ で $\\sigma_1 = ${n(s1)}$、$\\sigma_2 = ${n(s2)}$ です。$A$ が単位円板から作る楕円の面積を求めてください。`],
        a: { type: 'num', v: PI * s1 * s2 },
        hint: ['An ellipse with semi-axes $\\sigma_1$, $\\sigma_2$ has area $\\pi\\sigma_1\\sigma_2$.', '半軸が $\\sigma_1$, $\\sigma_2$ の楕円の面積は $\\pi\\sigma_1\\sigma_2$ です。'],
        sol: [[`The rotations $U$ and $V^{T}$ keep areas; $\\Sigma$ multiplies them by $\\sigma_1\\sigma_2 = ${n(s1 * s2)}$.`, `回転 $U$ と $V^{T}$ は面積を変えず、$\\Sigma$ が面積を $\\sigma_1\\sigma_2 = ${n(s1 * s2)}$ 倍にします。`], [`Area $= \\pi\\cdot ${pn(s1 * s2)} = ${n(PI * s1 * s2, 4)}$; equivalently $|\\det A| = \\sigma_1\\sigma_2$.`, `面積は $\\pi\\cdot ${pn(s1 * s2)} = ${n(PI * s1 * s2, 4)}$ です。言い換えると $|\\det A| = \\sigma_1\\sigma_2$ です。`]],
        set: { s1, s2, angle: a, input: b, rank: 2 },
      };
      return {
        q: [`$A$ has singular values $${n(s1)}$ and $${n(s2)}$. How far is $A$ from the nearest rank-one matrix, in the operator norm $\\|\\cdot\\|_2$?`, `$A$ の特異値は $${n(s1)}$ と $${n(s2)}$ です。作用素ノルム $\\|\\cdot\\|_2$ で、$A$ から最も近い階数1の行列までの距離はいくつですか。`],
        a: { type: 'num', v: s2 },
        hint: ['Drop the smallest singular value (Eckart and Young).', '最小の特異値を捨てます（エッカート・ヤングの定理）。'],
        sol: [[`The best rank-one approximation is $A_1 = \\sigma_1u_1v_1^{T}$, and $A - A_1 = \\sigma_2u_2v_2^{T}$.`, `最良の階数1近似は $A_1 = \\sigma_1u_1v_1^{T}$ で、$A - A_1 = \\sigma_2u_2v_2^{T}$ です。`], [`Its largest stretch is $\\sigma_2 = ${n(s2)}$: the error is exactly the stretch that was thrown away.`, `その最大の伸びは $\\sigma_2 = ${n(s2)}$ で、誤差はちょうど捨てた伸びに等しくなります。`]],
        set: { s1, s2, angle: a, input: b, rank: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let M, S; do { M = [[r.int(-3, 4), r.int(-3, 4)], [r.int(-3, 4), r.int(-3, 4)]]; S = svd2(M); } while (S.s1 < 1e-9 || Math.abs(M[0][1] * M[1][0]) + Math.abs(M[0][0] * M[1][1]) === 0);
        return {
          q: [`Find the singular values of $A = ${mat(M)}$ (three decimals), larger first.`, `$A = ${mat(M)}$ の特異値を大きい方から求めてください（小数第3位まで）。`],
          a: { type: 'tuple', v: [S.s1, S.s2], labels: ['$\\sigma_1$', '$\\sigma_2$'], tol: 6e-4 },
          hint: ['$\\sigma_i^2$ are the eigenvalues of $A^{T}A$.', '$\\sigma_i^2$ は $A^{T}A$ の固有値です。'],
          sol: [[`$A^{T}A = ${mat(S.ata)}$, with trace $${S.tr}$ and determinant $${S.dt}$.`, `$A^{T}A = ${mat(S.ata)}$ で、跡は $${S.tr}$、行列式は $${S.dt}$ です。`], [`$\\sigma^2 = \\tfrac12\\left(${S.tr} \\pm \\sqrt{${S.tr * S.tr - 4 * S.dt}}\\right) = ${n(S.s1 ** 2, 4)}, ${n(S.s2 ** 2, 4)}$.`, `$\\sigma^2 = \\tfrac12\\left(${S.tr} \\pm \\sqrt{${S.tr * S.tr - 4 * S.dt}}\\right) = ${n(S.s1 ** 2, 4)}, ${n(S.s2 ** 2, 4)}$ です。`], [`$\\sigma_1 = ${n(S.s1, 4)}$, $\\sigma_2 = ${n(S.s2, 4)}$. Check: $\\sigma_1\\sigma_2 = |\\det A| = ${Math.abs(det2(M))}$.`, `$\\sigma_1 = ${n(S.s1, 4)}$、$\\sigma_2 = ${n(S.s2, 4)}$ です。確認：$\\sigma_1\\sigma_2 = |\\det A| = ${Math.abs(det2(M))}$ です。`]],
        };
      }
      if (form === 1) {
        const s1 = r.step(1, 3, 0.5), s2 = r.pick([0, 0.25, 0.5, 0.75, 1]), a = r.pick([0, 90, 180, 45, 135]), b = r.pick([0, 90, 180]);
        const cl = (x) => (Math.abs(x) < 1e-12 ? 0 : x), ca = cl(Math.cos(rad(a))), sa = cl(Math.sin(rad(a))), cb = cl(Math.cos(rad(b))), sb = cl(Math.sin(rad(b)));
        const A = [[s1 * ca * cb + s2 * sa * sb, s1 * ca * sb - s2 * sa * cb], [s1 * sa * cb - s2 * ca * sb, s1 * sa * sb + s2 * ca * cb]];
        const z = (x) => (Math.abs(x) < 1e-12 ? 0 : x);
        return {
          q: [`$U$ rotates by $${a}^\\circ$, $V$ rotates by $${b}^\\circ$, and $\\Sigma = \\operatorname{diag}(${n(s1)}, ${n(s2)})$. Find the entries of $A = U\\Sigma V^{T}$ (three decimals).`, `$U$ は $${a}^\\circ$ の回転、$V$ は $${b}^\\circ$ の回転、$\\Sigma = \\operatorname{diag}(${n(s1)}, ${n(s2)})$ です。$A = U\\Sigma V^{T}$ の成分を求めてください（小数第3位まで）。`],
          a: { type: 'tuple', v: [z(A[0][0]), z(A[0][1]), z(A[1][0]), z(A[1][1])], labels: ['$a_{11}$', '$a_{12}$', '$a_{21}$', '$a_{22}$'], tol: 6e-4 },
          hint: ['$A = \\sigma_1u_1v_1^{T} + \\sigma_2u_2v_2^{T}$, with $u_1, v_1$ the first columns of $U$, $V$.', '$A = \\sigma_1u_1v_1^{T} + \\sigma_2u_2v_2^{T}$ で、$u_1, v_1$ は $U$, $V$ の第1列です。'],
          sol: [[`$u_1 = (${n(ca, 3)}, ${n(sa, 3)})$, $u_2 = (${n(-sa, 3)}, ${n(ca, 3)})$, $v_1 = (${n(cb, 3)}, ${n(sb, 3)})$, $v_2 = (${n(-sb, 3)}, ${n(cb, 3)})$.`, `$u_1 = (${n(ca, 3)}, ${n(sa, 3)})$、$u_2 = (${n(-sa, 3)}, ${n(ca, 3)})$、$v_1 = (${n(cb, 3)}, ${n(sb, 3)})$、$v_2 = (${n(-sb, 3)}, ${n(cb, 3)})$ です。`], [`$A = ${n(s1)}\\,u_1v_1^{T} + ${n(s2)}\\,u_2v_2^{T} = ${mat(A.map((row) => row.map(z)), 'pmatrix', 3)}$.`, `$A = ${n(s1)}\\,u_1v_1^{T} + ${n(s2)}\\,u_2v_2^{T} = ${mat(A.map((row) => row.map(z)), 'pmatrix', 3)}$ です。`], ['Every real $2\\times 2$ matrix arises this way, from two rotations (possibly with a reflection) and two stretches.', '実の $2\\times 2$ 行列はすべてこのように、二つの回転（鏡映を含むこともあります）と二つの伸縮から作られます。']],
          set: { s1, s2, angle: a, input: b, rank: 2 },
        };
      }
      let M; do { M = [[r.int(-3, 4), r.int(-3, 4)], [r.int(-3, 4), r.int(-3, 4)]]; } while (M.flat().every((x) => x === 0));
      const F2 = M.flat().reduce((s, x) => s + x * x, 0);
      return {
        q: [`Compute $\\sigma_1^2 + \\sigma_2^2$ for $A = ${mat(M)}$.`, `$A = ${mat(M)}$ について $\\sigma_1^2 + \\sigma_2^2$ を求めてください。`],
        a: { type: 'int', v: F2 },
        hint: ['No eigenvalues needed: $\\sigma_1^2 + \\sigma_2^2 = \\operatorname{tr}(A^{T}A)$.', '固有値は不要です。$\\sigma_1^2 + \\sigma_2^2 = \\operatorname{tr}(A^{T}A)$ です。'],
        sol: [[`$\\operatorname{tr}(A^{T}A)$ is the sum of the squares of all entries.`, `$\\operatorname{tr}(A^{T}A)$ はすべての成分の2乗の和です。`], [`$${M.flat().map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join(' + ')} = ${F2}$.`, `$${M.flat().map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join(' + ')} = ${F2}$ です。`], ['This is the squared Frobenius norm: rotations do not change it, so it equals the sum of the squared stretches.', 'これはフロベニウスノルムの2乗です。回転では変わらないので、伸びの2乗の和に等しくなります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let M, S; do { M = [[r.int(-2, 4), r.int(-2, 4)], [r.int(-2, 4), r.int(-2, 4)]]; S = svd2(M); } while (Math.abs(S.ata[0][1]) < 1e-9 || S.s1 - S.s2 < 0.3);
        let deg = S.th * 180 / PI; if (deg < 0) deg += 180;
        return {
          q: [`For $A = ${mat(M)}$, which input direction (angle from the $x$-axis, between $0^\\circ$ and $180^\\circ$) is stretched the most?`, `$A = ${mat(M)}$ で最も大きく引き伸ばされる入力方向（$x$ 軸からの角度、$0^\\circ$ から $180^\\circ$）を求めてください。`],
          a: { type: 'num', v: deg, tol: 0.3, unit: ['°', '°'] },
          hint: ['It is the top eigenvector $v_1$ of $A^{T}A$; for a symmetric $2\\times 2$ matrix $\\tan 2\\theta = 2b/(a - c)$.', '$A^{T}A$ の最大固有値の固有ベクトル $v_1$ です。対称な $2\\times 2$ 行列では $\\tan 2\\theta = 2b/(a - c)$ です。'],
          sol: [[`$A^{T}A = ${mat(S.ata)}$.`, `$A^{T}A = ${mat(S.ata)}$ です。`], [`$2\\theta = \\operatorname{atan2}(${2 * S.ata[0][1]}, ${S.ata[0][0] - S.ata[1][1]})$, so $\\theta = ${n(deg, 2)}^\\circ$.`, `$2\\theta = \\operatorname{atan2}(${2 * S.ata[0][1]}, ${S.ata[0][0] - S.ata[1][1]})$ より $\\theta = ${n(deg, 2)}^\\circ$ です。`], [`Along $v_1$ the stretch is $\\sigma_1 = ${n(S.s1, 4)}$; perpendicular to it, the least, $\\sigma_2 = ${n(S.s2, 4)}$. In the figure this is the input rotation.`, `$v_1$ の方向の伸びは $\\sigma_1 = ${n(S.s1, 4)}$、それに垂直な方向で最小の $\\sigma_2 = ${n(S.s2, 4)}$ です。図では入力の回転にあたります。`]],
        };
      }
      if (form === 1) {
        const s1 = r.step(1.5, 3, 0.5), s2 = r.pick([0.25, 0.5, 0.75]), area = PI * s1 * s2, k = r.pick([2, 3, 4]);
        return {
          q: [`The unit disc goes to an ellipse of area $${n(area / PI)}\\pi$ whose longest semi-axis is $${n(s1)}$. What is the condition number $\\sigma_1/\\sigma_2$?`, `単位円板が面積 $${n(area / PI)}\\pi$、最長の半軸 $${n(s1)}$ の楕円に写ります。条件数 $\\sigma_1/\\sigma_2$ を求めてください。`],
          a: { type: 'num', v: s1 / s2 },
          hint: ['Area $= \\pi\\sigma_1\\sigma_2$ gives $\\sigma_2$.', '面積 $= \\pi\\sigma_1\\sigma_2$ から $\\sigma_2$ がわかります。'],
          sol: [[`$\\sigma_2 = ${n(area / PI)}/${n(s1)} = ${n(s2)}$.`, `$\\sigma_2 = ${n(area / PI)}/${n(s1)} = ${n(s2)}$ です。`], [`$\\kappa = ${n(s1)}/${n(s2)} = ${n(s1 / s2)}$.`, `$\\kappa = ${n(s1)}/${n(s2)} = ${n(s1 / s2)}$ です。`], [`Solving $Ax = b$ can multiply a relative error in $b$ by up to $${n(s1 / s2)}$; with $10^{-${k}}$ relative noise in $b$ you may lose about $\\log_{10}${n(s1 / s2)} \\approx ${n(Math.log10(s1 / s2), 2)}$ digits.`, `$Ax = b$ を解くと、$b$ の相対誤差は最大で $${n(s1 / s2)}$ 倍になります。$b$ に $10^{-${k}}$ の相対雑音があれば、およそ $\\log_{10}${n(s1 / s2)} \\approx ${n(Math.log10(s1 / s2), 2)}$ 桁を失います。`]],
          set: { s1, s2, rank: 2 },
        };
      }
      const s1 = r.step(1, 3, 0.5), s2 = r.pick([0.5, 0.25, 0.75, 1]), a = r.pick([0, 90, 45, 135]), b = r.pick([0, 90, 45]);
      const cl = (x) => (Math.abs(x) < 1e-12 ? 0 : x), ca = cl(Math.cos(rad(a))), sa = cl(Math.sin(rad(a))), cb = cl(Math.cos(rad(b))), sb = cl(Math.sin(rad(b)));
      const A1 = [[s1 * ca * cb, s1 * ca * sb], [s1 * sa * cb, s1 * sa * sb]].map((row) => row.map((x) => (Math.abs(x) < 1e-12 ? 0 : x)));
      return {
        q: [`$A = U\\Sigma V^{T}$ with $U$ a rotation by $${a}^\\circ$, $V$ a rotation by $${b}^\\circ$, $\\sigma_1 = ${n(s1)}$, $\\sigma_2 = ${n(s2)}$. Find the best rank-one approximation $A_1$ (three decimals).`, `$A = U\\Sigma V^{T}$ で、$U$ は $${a}^\\circ$ の回転、$V$ は $${b}^\\circ$ の回転、$\\sigma_1 = ${n(s1)}$、$\\sigma_2 = ${n(s2)}$ です。最良の階数1近似 $A_1$ を求めてください（小数第3位まで）。`],
        a: { type: 'tuple', v: A1.flat(), labels: ['$a_{11}$', '$a_{12}$', '$a_{21}$', '$a_{22}$'], tol: 6e-4 },
        hint: ['Keep only the first term: $A_1 = \\sigma_1u_1v_1^{T}$.', '最初の項だけを残します。$A_1 = \\sigma_1u_1v_1^{T}$ です。'],
        sol: [[`$u_1 = (${n(ca, 3)}, ${n(sa, 3)})$ and $v_1 = (${n(cb, 3)}, ${n(sb, 3)})$.`, `$u_1 = (${n(ca, 3)}, ${n(sa, 3)})$、$v_1 = (${n(cb, 3)}, ${n(sb, 3)})$ です。`], [`$A_1 = ${n(s1)}\\,u_1v_1^{T} = ${mat(A1, 'pmatrix', 3)}$.`, `$A_1 = ${n(s1)}\\,u_1v_1^{T} = ${mat(A1, 'pmatrix', 3)}$ です。`], [`It sends the whole plane onto the line through $u_1$, and the error $\\|A - A_1\\|_2 = \\sigma_2 = ${n(s2)}$ is the smallest any rank-one matrix can achieve.`, `$A_1$ は平面全体を $u_1$ を通る直線に写します。誤差 $\\|A - A_1\\|_2 = \\sigma_2 = ${n(s2)}$ は、階数1の行列で達成できる最小値です。`]],
        set: { s1, s2, angle: a, input: b, rank: 1 },
      };
    },
  ];
})();
