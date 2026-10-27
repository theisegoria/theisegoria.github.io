'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum, frac } = P.util;
  const n = (x, d) => fmtNum(Math.abs(x) < 1e-9 ? 0 : x, d);
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (x) => x * 180 / PI;
  const GAMMAS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  /* ---------- 1. Kuramoto ---------- */
  Q.kuramoto = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = r.pick(GAMMAS);
        return {
          q: [`Natural frequencies follow a Lorentzian of half-width $\\gamma = ${n(g)}$. Above what coupling $K_c$ does a synchronized cluster appear (for $N \\to \\infty$)?`, `自然振動数が半値幅 $\\gamma = ${n(g)}$ のローレンツ分布に従います。どの結合 $K_c$ を超えると同期したクラスターが現れますか（$N \\to \\infty$）。`],
          a: { type: 'num', v: 2 * g },
          hint: ['For the Lorentzian, Kuramoto’s threshold is $K_c = 2/(\\pi g(0))$ with $g(0) = 1/(\\pi\\gamma)$.', 'ローレンツ分布では蔵本の閾値は $K_c = 2/(\\pi g(0))$、$g(0) = 1/(\\pi\\gamma)$ です。'],
          sol: [[`$K_c = 2/(\\pi g(0)) = 2\\gamma = ${n(2 * g)}$.`, `$K_c = 2/(\\pi g(0)) = 2\\gamma = ${n(2 * g)}$ です。`], ['A wider spread of frequencies needs proportionally stronger coupling before any group can lock together.', '振動数の広がりが大きいほど、何らかの群がそろうには比例して強い結合が必要です。']],
          set: { gamma: g, K: Math.min(6, 2 * g + 0.5) },
        };
      }
      if (form === 1) {
        const k = r.pick([2, 3, 4, 6]), base = r.step(0, 90, 15), ang = Array.from({ length: k }, (_, i) => base + i * r.pick([20, 30, 40, 45, 60]));
        const c = ang.reduce((a, x) => a + Math.cos(rad(x)), 0) / k, s = ang.reduce((a, x) => a + Math.sin(rad(x)), 0) / k, R = Math.hypot(c, s);
        return {
          q: [`${k} oscillators sit at phases $${ang.map((x) => x + '^\\circ').join(', ')}$. What is the order parameter $r = \\left|\\tfrac1N\\sum_j e^{i\\theta_j}\\right|$?`, `${k} 個の振動子が位相 $${ang.map((x) => x + '^\\circ').join(', ')}$ にあります。秩序変数 $r = \\left|\\tfrac1N\\sum_j e^{i\\theta_j}\\right|$ はいくつですか。`],
          a: { type: 'num', v: R, tol: 2e-3 },
          hint: ['Average the unit vectors $(\\cos\\theta_j, \\sin\\theta_j)$ and take the length.', '単位ベクトル $(\\cos\\theta_j, \\sin\\theta_j)$ を平均して長さをとります。'],
          sol: [[`Mean of the cosines $${n(c, 4)}$, of the sines $${n(s, 4)}$.`, `余弦の平均は $${n(c, 4)}$、正弦の平均は $${n(s, 4)}$ です。`], [`$r = \\sqrt{${n(c, 4)}^2 + ${n(s, 4)}^2} = ${n(R, 4)}$, at angle $\\psi = ${n(deg(Math.atan2(s, c)), 3)}^\\circ$: the mean field arrow in the figure.`, `$r = \\sqrt{${n(c, 4)}^2 + ${n(s, 4)}^2} = ${n(R, 4)}$ で、角度は $\\psi = ${n(deg(Math.atan2(s, c)), 3)}^\\circ$ です。図の平均場の矢印にあたります。`]],
        };
      }
      const g = r.pick([0.5, 1, 1.5]), K = r.step(2 * g + 0.5, 6, 0.5), rr = Math.sqrt(1 - 2 * g / K), w = r.step(0.25, 3, 0.25);
      if (Math.abs(Math.abs(w) - K * rr) < 0.05) return Q.kuramoto[0](r);
      const locked = w <= K * rr;
      return {
        q: [`With $K = ${n(K)}$ and $\\gamma = ${n(g)}$ the order parameter settles at $r = \\sqrt{1 - 2\\gamma/K}$. Does an oscillator with natural frequency $\\omega = ${n(w)}$ lock to the mean field?`, `$K = ${n(K)}$、$\\gamma = ${n(g)}$ では秩序変数は $r = \\sqrt{1 - 2\\gamma/K}$ に落ち着きます。自然振動数 $\\omega = ${n(w)}$ の振動子は平均場にロックしますか。`],
        a: { type: 'choice', opts: [['Yes, it locks', 'はい、ロックします'], ['No, it drifts', 'いいえ、ドリフトします']], v: locked ? 0 : 1, fixed: true },
        hint: ['In the frame of the mean field $\\dot\\phi = \\omega - Kr\\sin\\phi$; a fixed point needs $|\\omega| \\le Kr$.', '平均場の座標系では $\\dot\\phi = \\omega - Kr\\sin\\phi$ で、固定点があるには $|\\omega| \\le Kr$ が必要です。'],
        sol: [[`$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$, so $Kr = ${n(K * rr, 4)}$.`, `$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$ なので $Kr = ${n(K * rr, 4)}$ です。`], [locked ? `$${n(w)} \\le ${n(K * rr, 4)}$: the pull of the mean field beats the oscillator's own drift, and it settles at a fixed phase offset $\\arcsin(\\omega/Kr) = ${n(deg(Math.asin(w / (K * rr))), 3)}^\\circ$.` : `$${n(w)} > ${n(K * rr, 4)}$: the pull is too weak, so it slips round the circle relative to the cluster.`, locked ? `$${n(w)} \\le ${n(K * rr, 4)}$ なので平均場の引きが振動子自身のずれに勝ち、一定の位相差 $\\arcsin(\\omega/Kr) = ${n(deg(Math.asin(w / (K * rr))), 3)}^\\circ$ に落ち着きます。` : `$${n(w)} > ${n(K * rr, 4)}$ なので引きが弱すぎ、クラスターに対して円周を滑っていきます。`]],
        set: { K, gamma: g },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = r.pick([0.25, 0.5, 0.75, 1, 1.25]), K = r.step(2 * g + 0.2, 6, 0.1), rr = Math.sqrt(1 - 2 * g / K);
        return {
          q: [`Kuramoto model, Lorentzian frequencies with $\\gamma = ${n(g)}$, coupling $K = ${n(K)}$. What is the steady order parameter $r$ for large $N$?`, `ローレンツ分布（$\\gamma = ${n(g)}$）の振動数をもつ蔵本模型で、結合は $K = ${n(K)}$ です。$N$ が大きいときの定常な秩序変数 $r$ はいくつですか。`],
          a: { type: 'num', v: rr, tol: 2e-3 },
          hint: ['$r = \\sqrt{1 - K_c/K}$ above $K_c = 2\\gamma$.', '$K_c = 2\\gamma$ より上では $r = \\sqrt{1 - K_c/K}$ です。'],
          sol: [[`$K_c = ${n(2 * g)} < K$, so a cluster exists.`, `$K_c = ${n(2 * g)} < K$ なのでクラスターが存在します。`], [`$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$. Compare the readout's time average, which differs by finite-$N$ fluctuations of order $1/\\sqrt N$.`, `$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$ です。読み取り欄の時間平均と比べてください。違いは $1/\\sqrt N$ 程度の有限サイズの揺らぎです。`]],
          set: { K, gamma: g },
        };
      }
      if (form === 1) {
        const g = r.pick([0.25, 0.5, 0.75, 1]), K = r.step(2 * g + 0.5, 6, 0.5), rr = Math.sqrt(1 - 2 * g / K), f = (2 / PI) * Math.atan(K * rr / g);
        return {
          q: [`With $\\gamma = ${n(g)}$ and $K = ${n(K)}$, what fraction of the oscillators is locked to the mean field ($|\\omega_i| \\le Kr$)?`, `$\\gamma = ${n(g)}$、$K = ${n(K)}$ のとき、平均場にロックしている（$|\\omega_i| \\le Kr$）振動子の割合はいくつですか。`],
          a: { type: 'num', v: f, tol: 2e-3 },
          hint: ['For a Lorentzian, $P(|\\omega| \\le a) = \\tfrac2\\pi\\arctan(a/\\gamma)$.', 'ローレンツ分布では $P(|\\omega| \\le a) = \\tfrac2\\pi\\arctan(a/\\gamma)$ です。'],
          sol: [[`$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$, so the locking band is $|\\omega| \\le Kr = ${n(K * rr, 4)}$.`, `$r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(rr, 4)}$ なので、ロックする範囲は $|\\omega| \\le Kr = ${n(K * rr, 4)}$ です。`], [`Fraction $= \\tfrac2\\pi\\arctan(${n(K * rr, 4)}/${n(g)}) = ${n(f, 4)}$.`, `割合 $= \\tfrac2\\pi\\arctan(${n(K * rr, 4)}/${n(g)}) = ${n(f, 4)}$ です。`], ['The rest drift; because the Lorentzian has heavy tails, some oscillators drift at any finite coupling.', '残りはドリフトします。ローレンツ分布は裾が重いので、どんな有限の結合でもドリフトする振動子が残ります。']],
          set: { K, gamma: g },
        };
      }
      const g = r.pick(GAMMAS), K = r.step(0.2, 6, 0.2);
      if (Math.abs(K - 2 * g) < 0.15) return Q.kuramoto[1](r);
      const sync = K > 2 * g;
      return {
        q: [`$K = ${n(K)}$, $\\gamma = ${n(g)}$. In the limit $N \\to \\infty$, what is the long-run order parameter?`, `$K = ${n(K)}$、$\\gamma = ${n(g)}$ です。$N \\to \\infty$ の極限で、長時間の秩序変数はいくつですか。`],
        a: { type: 'num', v: sync ? Math.sqrt(1 - 2 * g / K) : 0, tol: 2e-3 },
        hint: ['Compare $K$ with $K_c = 2\\gamma$ first.', 'まず $K$ を $K_c = 2\\gamma$ と比べます。'],
        sol: [[`$K_c = ${n(2 * g)}$, which is ${sync ? 'below' : 'above'} $K = ${n(K)}$.`, `$K_c = ${n(2 * g)}$ で、$K = ${n(K)}$ より${sync ? '小さい' : '大きい'}です。`], [sync ? `So $r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(Math.sqrt(1 - 2 * g / K), 4)}$.` : 'Below threshold the incoherent state is stable and $r \\to 0$; at finite $N$ it fluctuates at size about $1/\\sqrt N$.', sync ? `したがって $r = \\sqrt{1 - ${n(2 * g)}/${n(K)}} = ${n(Math.sqrt(1 - 2 * g / K), 4)}$ です。` : '閾値より下では非同期状態が安定で $r \\to 0$ です。有限の $N$ では $1/\\sqrt N$ 程度で揺らぎます。']],
        set: { K, gamma: g },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = r.pick([0.25, 0.5, 0.75, 1, 1.25]), rt = r.pick([0.3, 0.5, 0.6, 0.8, 0.9]), K = 2 * g / (1 - rt * rt);
        return {
          q: [`With $\\gamma = ${n(g)}$, what coupling $K$ makes the order parameter $r = ${n(rt)}$?`, `$\\gamma = ${n(g)}$ のとき、秩序変数を $r = ${n(rt)}$ にする結合 $K$ はいくつですか。`],
          a: { type: 'num', v: K, tol: 2e-3 },
          hint: ['Invert $r^2 = 1 - 2\\gamma/K$.', '$r^2 = 1 - 2\\gamma/K$ を逆に解きます。'],
          sol: [[`$K = \\dfrac{2\\gamma}{1 - r^2} = \\dfrac{${n(2 * g)}}{1 - ${n(rt * rt)}} = ${n(K, 4)}$.`, `$K = \\dfrac{2\\gamma}{1 - r^2} = \\dfrac{${n(2 * g)}}{1 - ${n(rt * rt)}} = ${n(K, 4)}$ です。`], [`That is $${n(K / (2 * g), 3)}$ times the threshold: near-perfect synchrony costs a lot, because $r \\to 1$ only as $K \\to \\infty$.`, `閾値の $${n(K / (2 * g), 3)}$ 倍です。$r \\to 1$ となるのは $K \\to \\infty$ のときだけなので、ほぼ完全な同期には大きな代償がかかります。`]],
          set: K <= 6 ? { K: Math.round(K * 10) / 10, gamma: g } : { gamma: g },
        };
      }
      if (form === 1) {
        const g = r.pick([0.5, 1, 1.5]);
        return {
          q: [`For $\\gamma = ${n(g)}$, write the steady order parameter $r(K)$ above threshold as a function of $K$.`, `$\\gamma = ${n(g)}$ のとき、閾値より上での定常な秩序変数 $r(K)$ を $K$ の式で書いてください。`],
          a: { type: 'expr', v: `sqrt(1-${n(2 * g)}/K)`, vars: ['K'], dom: { K: [2 * g + 0.2, 8] }, lhs: ['$r(K) =$', '$r(K) =$'] },
          hint: ['Kuramoto’s self-consistency for a Lorentzian gives $r^2 = 1 - K_c/K$.', 'ローレンツ分布に対する蔵本の自己無撞着条件は $r^2 = 1 - K_c/K$ を与えます。'],
          sol: [[`$K_c = 2\\gamma = ${n(2 * g)}$, so $r(K) = \\sqrt{1 - ${n(2 * g)}/K}$.`, `$K_c = 2\\gamma = ${n(2 * g)}$ なので $r(K) = \\sqrt{1 - ${n(2 * g)}/K}$ です。`], [`Just above threshold $r \\approx \\sqrt{(K - K_c)/K_c}$: a square-root onset, the signature of a continuous (second-order) phase transition with exponent $\\beta = \\tfrac12$.`, `閾値のすぐ上では $r \\approx \\sqrt{(K - K_c)/K_c}$ です。平方根での立ち上がりは、指数 $\\beta = \\tfrac12$ の連続（二次）相転移の特徴です。`]],
          set: { gamma: g },
        };
      }
      const g = r.pick([0.25, 0.5, 0.75, 1, 1.5]), Kc = 2 * g;
      return {
        q: [`Just above threshold, $r \\approx c\\sqrt{K - K_c}$. Find $c$ for $\\gamma = ${n(g)}$.`, `閾値のすぐ上では $r \\approx c\\sqrt{K - K_c}$ です。$\\gamma = ${n(g)}$ のときの $c$ を求めてください。`],
        a: { type: 'num', v: 1 / Math.sqrt(Kc), tol: 2e-3 },
        hint: ['Write $1 - K_c/K = (K - K_c)/K$ and set $K \\approx K_c$ in the denominator.', '$1 - K_c/K = (K - K_c)/K$ と書き、分母では $K \\approx K_c$ とおきます。'],
        sol: [[`$r = \\sqrt{(K - K_c)/K} \\approx \\sqrt{K - K_c}/\\sqrt{K_c}$.`, `$r = \\sqrt{(K - K_c)/K} \\approx \\sqrt{K - K_c}/\\sqrt{K_c}$ です。`], [`$c = 1/\\sqrt{${n(Kc)}} = ${n(1 / Math.sqrt(Kc), 4)}$. The infinite slope at $K_c$ is why the arrow in the figure seems to spring out of nothing as you cross the threshold.`, `$c = 1/\\sqrt{${n(Kc)}} = ${n(1 / Math.sqrt(Kc), 4)}$ です。$K_c$ での傾きが無限大なので、閾値を越えると図の矢印が無から飛び出すように見えます。`]],
        set: { gamma: g, K: Math.round((Kc + 0.3) * 10) / 10 },
      };
    },
  ];

  /* ---------- 2. abelian sandpile ---------- */
  function topple(z, Ls, i, j) {
    z = z.slice(); z[i * Ls + j]++; let topples = 0, lost = 0;
    const st = []; if (z[i * Ls + j] >= 4) st.push(i * Ls + j);
    while (st.length) {
      const k = st.pop(); if (z[k] < 4) continue;
      z[k] -= 4; topples++; const a = Math.floor(k / Ls), b = k % Ls;
      for (const [da, db] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = a + da, y = b + db; if (x < 0 || y < 0 || x >= Ls || y >= Ls) { lost++; continue; } z[x * Ls + y]++; if (z[x * Ls + y] >= 4) st.push(x * Ls + y); }
      if (z[k] >= 4) st.push(k);
    }
    return { z, topples, lost };
  }
  const grid = (z, Ls) => `\\begin{matrix} ${Array.from({ length: Ls }, (_, i) => z.slice(i * Ls, i * Ls + Ls).join(' & ')).join(' \\\\ ')} \\end{matrix}`;
  const gridB = (z, Ls) => `\\left[${grid(z, Ls)}\\right]`;
  Q.sandpile = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const where = r.int(0, 2), names = [['in the interior', '内部'], ['on an edge (not a corner)', '辺の上（角以外）'], ['in a corner', '角']];
        return {
          q: [`A cell ${names[where][0]} of the grid topples once. How many grains leave the pile over the boundary?`, `格子の${names[where][1]}のセルが一回崩れます。境界を越えて砂山から失われる砂粒はいくつですか。`],
          a: { type: 'int', v: where },
          hint: ['A toppling sends one grain to each of the four neighbours; missing neighbours mean grains lost.', '崩れると四つの隣に一粒ずつ送ります。隣がなければその粒は失われます。'],
          sol: [[`The cell loses 4 grains and has ${4 - where} neighbours on the grid.`, `セルは 4 粒を失い、格子上の隣は ${4 - where} 個です。`], [`So ${where} grain${where === 1 ? '' : 's'} fall off. Only the boundary dissipates: without it the pile could never settle.`, `したがって ${where} 粒が落ちます。散逸は境界でしか起きず、境界がなければ砂山は決して落ち着けません。`]],
        };
      }
      if (form === 1) {
        const Ls = r.pick([64, 96, 128]), h = 2.125;
        return {
          q: [`In the critical state of a $${Ls} \\times ${Ls}$ sandpile fed at random sites, the mean height per cell is close to $17/8$. Roughly how many grains does the pile hold?`, `ランダムな場所に砂を落とす $${Ls} \\times ${Ls}$ の砂山の臨界状態では、セルあたりの平均の高さは $17/8$ に近くなります。砂山はおよそ何粒の砂を保持していますか。`],
          a: { type: 'num', v: h * Ls * Ls, rel: 0.01 },
          hint: ['Multiply the mean height by the number of cells.', '平均の高さにセルの数を掛けます。'],
          sol: [[`$\\tfrac{17}{8}\\cdot ${Ls}^2 = ${n(h * Ls * Ls)}$.`, `$\\tfrac{17}{8}\\cdot ${Ls}^2 = ${n(h * Ls * Ls)}$ です。`], ['The maximum a stable pile can hold is $3$ per cell; the critical state sits well below that but at a definite density, which the pile finds by itself.', '安定な砂山が保持できる最大値はセルあたり $3$ です。臨界状態はそれよりかなり下の決まった密度にあり、砂山はそこへ自分でたどり着きます。']],
          set: { mode: 1, n: 20000 },
        };
      }
      const Ls = 3, z = Array.from({ length: 9 }, () => r.int(0, 3)), i = r.int(0, 2), j = r.int(0, 2);
      const res = topple(z, Ls, i, j);
      return {
        q: [`Heights on a $3 \\times 3$ grid are $${gridB(z, Ls)}$. A grain lands on row ${i + 1}, column ${j + 1}. Does anything topple?`, `$3 \\times 3$ の格子の高さが $${gridB(z, Ls)}$ です。第 ${i + 1} 行、第 ${j + 1} 列に一粒落ちます。何か崩れますか。`],
        a: { type: 'choice', opts: [['No: the cell is still below 4', 'いいえ：セルはまだ 4 未満です'], ['Yes: an avalanche starts', 'はい：雪崩が始まります']], v: res.topples > 0 ? 1 : 0, fixed: true },
        hint: ['A cell topples when it holds 4 or more grains.', 'セルは 4 粒以上になると崩れます。'],
        sol: [[`That cell goes from $${z[i * Ls + j]}$ to $${z[i * Ls + j] + 1}$.`, `そのセルは $${z[i * Ls + j]}$ から $${z[i * Ls + j] + 1}$ になります。`], [res.topples ? `It reaches 4 and topples, starting an avalanche of ${res.topples} toppling${res.topples > 1 ? 's' : ''}.` : 'Below 4, so the pile is still stable and nothing moves.', res.topples ? `4 に達して崩れ、${res.topples} 回の崩壊からなる雪崩が始まります。` : '4 未満なので砂山は安定なままで、何も動きません。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      let z, i, j, res, Ls = 3;
      do { z = Array.from({ length: 9 }, () => r.int(1, 3)); i = r.int(0, 2); j = r.int(0, 2); z[i * Ls + j] = 3; res = topple(z, Ls, i, j); } while (res.topples < 2 || res.topples > 12);
      if (form === 0) return {
        q: [`Heights on a $3 \\times 3$ grid with open boundaries: $${gridB(z, Ls)}$. A grain lands on row ${i + 1}, column ${j + 1}. How many topplings does the avalanche contain?`, `開いた境界をもつ $3 \\times 3$ の格子の高さは $${gridB(z, Ls)}$ です。第 ${i + 1} 行、第 ${j + 1} 列に一粒落ちます。雪崩には何回の崩壊が含まれますか。`],
        a: { type: 'int', v: res.topples },
        hint: ['Topple any cell with 4 or more, one grain to each neighbour, and repeat until every cell is below 4. The order does not matter.', '4 以上のセルを崩して隣に一粒ずつ配り、すべてのセルが 4 未満になるまで繰り返します。順序は関係ありません。'],
        sol: [[`After the avalanche the heights are $${gridB(res.z, Ls)}$.`, `雪崩の後の高さは $${gridB(res.z, Ls)}$ です。`], [`Topplings: ${res.topples}; grains lost over the edge: ${res.lost}.`, `崩壊は ${res.topples} 回、端から失われた砂粒は ${res.lost} 粒です。`], ['Check: grains before $+1$ $=$ grains after $+$ grains lost. The abelian property guarantees the same count whatever order you topple in.', '確認：前の砂粒 $+1$ $=$ 後の砂粒 $+$ 失われた砂粒です。アーベル性により、どの順で崩しても回数は同じです。']],
      };
      return {
        q: [`Heights on a $3 \\times 3$ grid with open boundaries: $${gridB(z, Ls)}$. A grain lands on row ${i + 1}, column ${j + 1}. How many grains fall off the edge in the avalanche?`, `開いた境界をもつ $3 \\times 3$ の格子の高さは $${gridB(z, Ls)}$ です。第 ${i + 1} 行、第 ${j + 1} 列に一粒落ちます。雪崩で端から落ちる砂粒はいくつですか。`],
        a: { type: 'int', v: res.lost },
        hint: ['Run the avalanche to the end and count, or use conservation: lost = grains before + 1 − grains after.', '雪崩を最後まで進めて数えるか、保存則を使います：失われた数 = 前の粒数 + 1 − 後の粒数です。'],
        sol: [[`Final heights $${gridB(res.z, Ls)}$ after ${res.topples} topplings.`, `${res.topples} 回の崩壊の後、高さは $${gridB(res.z, Ls)}$ です。`], [`Grains: $${z.reduce((a, b) => a + b, 0)} + 1 = ${res.z.reduce((a, b) => a + b, 0)} + ${res.lost}$, so ${res.lost} fall off.`, `砂粒は $${z.reduce((a, b) => a + b, 0)} + 1 = ${res.z.reduce((a, b) => a + b, 0)} + ${res.lost}$ なので、${res.lost} 粒が落ちます。`], ['In a large pile most avalanches never reach the edge; the rare big ones carry the grains out, which is how the pile stays at its critical density.', '大きな砂山ではほとんどの雪崩は端に届きません。まれな大きな雪崩が砂粒を運び出し、それによって砂山は臨界密度にとどまります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const tau = r.pick([1.1, 1.2, 1.3]), s1 = r.pick([1, 10, 2, 5]), f = r.pick([10, 100, 1000]), ratio = Math.pow(f, tau);
        return {
          q: [`Avalanche sizes follow $P(s) \\propto s^{-\\tau}$ with $\\tau = ${n(tau)}$. How many times more likely is an avalanche of size $${s1}$ than one of size $${s1 * f}$?`, `雪崩の大きさは $\\tau = ${n(tau)}$ の $P(s) \\propto s^{-\\tau}$ に従います。大きさ $${s1}$ の雪崩は、大きさ $${s1 * f}$ の雪崩の何倍起こりやすいですか。`],
          a: { type: 'num', v: ratio, rel: 0.01 },
          hint: ['Only the ratio of sizes matters for a power law.', 'べき則では大きさの比だけが効きます。'],
          sol: [[`$P(${s1})/P(${s1 * f}) = ${f}^{${n(tau)}} = ${n(ratio, 4)}$.`, `$P(${s1})/P(${s1 * f}) = ${f}^{${n(tau)}} = ${n(ratio, 4)}$ です。`], ['A power law has no typical size: the same ratio holds for any pair of sizes a factor ' + f + ' apart, which is what a straight line on the log-log histogram means.', 'べき則には典型的な大きさがありません。' + f + ' 倍離れたどの大きさの組でも同じ比になります。両対数のヒストグラムが直線になるのはこのことです。']],
          set: { mode: 1, n: 20000 },
        };
      }
      if (form === 1) {
        const Ls = 4, z = Array(16).fill(3), i = r.int(0, 3), j = r.int(0, 3), res = topple(z, Ls, i, j);
        const k = r.int(0, 1);
        return {
          q: [`Every cell of a $4 \\times 4$ grid holds 3 grains. One grain lands on row ${i + 1}, column ${j + 1}. ${k ? 'How many grains fall off the edge?' : 'How many topplings follow?'}`, `$4 \\times 4$ の格子のすべてのセルに 3 粒あります。第 ${i + 1} 行、第 ${j + 1} 列に一粒落ちます。${k ? '端から落ちる砂粒はいくつですか。' : '何回の崩壊が続きますか。'}`],
          a: { type: 'int', v: k ? res.lost : res.topples },
          hint: ['Every cell is at the brink, so the first toppling sets off its neighbours, and so on. Count carefully, or use symmetry.', 'どのセルも崩れる寸前なので、最初の崩壊が隣を崩し、それが続きます。注意深く数えるか、対称性を使います。'],
          sol: [[`The avalanche ends with heights $${gridB(res.z, Ls)}$.`, `雪崩は高さ $${gridB(res.z, Ls)}$ で終わります。`], [`${res.topples} topplings and ${res.lost} grains lost; check $48 + 1 = ${res.z.reduce((a, b) => a + b, 0)} + ${res.lost}$.`, `崩壊は ${res.topples} 回、失われた砂粒は ${res.lost} 粒です。$48 + 1 = ${res.z.reduce((a, b) => a + b, 0)} + ${res.lost}$ で確かめられます。`], ['The all-3 pile is the most loaded stable state, and a single grain sweeps the whole grid: every cell topples.', 'すべて 3 の砂山は最も重い安定状態で、一粒の砂が格子全体を掃き、すべてのセルが崩れます。']],
        };
      }
      const Ls = 3; let z, a, b, A, B2;
      do { z = Array.from({ length: 9 }, () => r.int(2, 3)); a = [r.int(0, 2), r.int(0, 2)]; b = [r.int(0, 2), r.int(0, 2)]; } while (a[0] === b[0] && a[1] === b[1]);
      A = topple(topple(z, Ls, ...a).z, Ls, ...b); B2 = topple(topple(z, Ls, ...b).z, Ls, ...a);
      const same = A.z.join() === B2.z.join();
      return {
        q: [`From $${gridB(z, Ls)}$, add a grain at (row ${a[0] + 1}, column ${a[1] + 1}) and relax, then at (row ${b[0] + 1}, column ${b[1] + 1}) and relax. Does doing it in the other order give the same final pile?`, `$${gridB(z, Ls)}$ から、（第 ${a[0] + 1} 行, 第 ${a[1] + 1} 列）に一粒加えて安定化し、次に（第 ${b[0] + 1} 行, 第 ${b[1] + 1} 列）に加えて安定化します。順序を逆にしても最終的な砂山は同じですか。`],
        a: { type: 'choice', opts: [['Yes, always: the sandpile is abelian', 'はい、常に同じです。砂山はアーベル的です'], ['Not always: it depends on the heights', '常にではなく、高さによります']], v: same ? 0 : 1, fixed: true },
        hint: ['Toppling rules commute: whichever unstable cell you topple first, the others remain unstable and will topple anyway.', '崩壊の規則は可換です。どの不安定なセルを先に崩しても、他のセルは不安定なままで、いずれ崩れます。'],
        sol: [[`Either order ends at $${gridB(A.z, Ls)}$.`, `どちらの順でも $${gridB(A.z, Ls)}$ で終わります。`], ['Dhar proved it in general: adding grains and relaxing are commuting operators, the reason the model is called abelian and why its stable states form a group.', 'ダールが一般に証明しました。砂粒を加えて安定化する操作は互いに可換な作用素で、この模型がアーベル的と呼ばれ、その安定状態が群をなす理由です。']],
      };
    },
  ];

  /* ---------- 3. site percolation ---------- */
  const PC = 0.592746;
  Q.percolation = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const p = r.step(0.2, 0.9, 0.05), L = r.int(0, 1), Ls = L ? 48 : 24;
        return {
          q: [`Each site of a $${Ls} \\times ${Ls}$ lattice is open with probability $p = ${n(p)}$. How many open sites do you expect?`, `$${Ls} \\times ${Ls}$ の格子の各サイトが確率 $p = ${n(p)}$ で開きます。開いたサイトの数の期待値はいくつですか。`],
          a: { type: 'num', v: p * Ls * Ls, tol: 0.6 },
          hint: ['Linearity of expectation: add $p$ over all sites.', '期待値の線形性により、すべてのサイトについて $p$ を足します。'],
          sol: [[`$p\\,L^2 = ${n(p)}\\cdot ${Ls * Ls} = ${n(p * Ls * Ls)}$.`, `$p\\,L^2 = ${n(p)}\\cdot ${Ls * Ls} = ${n(p * Ls * Ls)}$ です。`], [`The standard deviation is $\\sqrt{L^2p(1 - p)} = ${n(Math.sqrt(Ls * Ls * p * (1 - p)), 3)}$, so the readout's count should be within a few of that of the mean.`, `標準偏差は $\\sqrt{L^2p(1 - p)} = ${n(Math.sqrt(Ls * Ls * p * (1 - p)), 3)}$ なので、読み取り欄の数はその数倍以内で平均に近いはずです。`]],
          set: { p, L },
        };
      }
      const p = r.pick([0.3, 0.45, 0.5, 0.55, 0.65, 0.7, 0.8]);
      return {
        q: [`Site percolation on the infinite square lattice at $p = ${n(p)}$: is there an infinite open cluster?`, `無限の正方格子のサイトパーコレーションで $p = ${n(p)}$ のとき、無限に大きな開いたクラスターはありますか。`],
        a: { type: 'choice', opts: [['Yes, with probability 1', 'はい、確率 1 であります'], ['No, with probability 1', 'いいえ、確率 1 でありません']], v: p > PC ? 0 : 1, fixed: true },
        hint: ['Compare with $p_c \\approx 0.5927$.', '$p_c \\approx 0.5927$ と比べます。'],
        sol: [[`$p_c \\approx 0.5927$, and $p = ${n(p)}$ is ${p > PC ? 'above' : 'below'} it.`, `$p_c \\approx 0.5927$ で、$p = ${n(p)}$ はそれより${p > PC ? '上' : '下'}です。`], [p > PC ? 'Above $p_c$ there is exactly one infinite cluster almost surely.' : 'Below $p_c$ every cluster is finite almost surely, even though half or more of the sites may be open.', p > PC ? '$p_c$ より上ではほとんど確実に無限クラスターがちょうど一つあります。' : '$p_c$ より下では、半分以上のサイトが開いていても、ほとんど確実にすべてのクラスターが有限です。']],
        set: { p },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.step(0.1, 0.9, 0.05), v = p * (1 - p) ** 4;
        return {
          q: [`At $p = ${n(p)}$, what is the probability that a given interior site forms a cluster on its own (open, with all four neighbours closed)?`, `$p = ${n(p)}$ のとき、ある内部のサイトが単独でクラスターをなす（開いていて、四つの隣がすべて閉じている）確率はいくつですか。`],
          a: { type: 'num', v, tol: 5e-5 },
          hint: ['Five independent sites, each with its own state.', '独立な五つのサイトがそれぞれの状態をとります。'],
          sol: [[`$p(1 - p)^4 = ${n(p)}\\cdot ${n(1 - p)}^4 = ${n(v, 5)}$.`, `$p(1 - p)^4 = ${n(p)}\\cdot ${n(1 - p)}^4 = ${n(v, 5)}$ です。`], [`Multiplied by $L^2$ it predicts the number of isolated sites. It peaks at $p = 1/5$ and is tiny near $p_c$, where clusters have merged.`, `$L^2$ を掛けると孤立サイトの数の予測になります。$p = 1/5$ で最大となり、クラスターが合体した $p_c$ 付近ではごく小さくなります。`]],
          set: { p },
        };
      }
      if (form === 1) {
        const p = r.pick([0.9, 0.95, 0.99, 0.8]), L = r.pick([10, 24, 48, 100]), v = p ** L;
        return {
          q: [`One-dimensional percolation: a row of $${L}$ sites, each open with probability $p = ${n(p)}$. What is the probability that the row is open from end to end?`, `一次元パーコレーション：$${L}$ 個のサイトの列で、各サイトは確率 $p = ${n(p)}$ で開きます。列が端から端まで開いている確率はいくつですか。`],
          a: { type: 'num', v, rel: 0.005 },
          hint: ['In one dimension a single closed site breaks the connection.', '一次元では閉じたサイトが一つあれば接続が切れます。'],
          sol: [[`All $${L}$ sites must be open: $p^{${L}} = ${n(p)}^{${L}} = ${n(v, 4)}$.`, `$${L}$ 個すべてが開いている必要があり、$p^{${L}} = ${n(p)}^{${L}} = ${n(v, 4)}$ です。`], ['As $L \\to \\infty$ this tends to $0$ for every $p < 1$: in one dimension $p_c = 1$. Two dimensions allow paths round obstacles, which is why $p_c$ drops to $0.5927$.', '$L \\to \\infty$ でどの $p < 1$ でも $0$ に近づくので、一次元では $p_c = 1$ です。二次元では障害物を回り込む経路があるので $p_c$ は $0.5927$ まで下がります。']],
        };
      }
      const z = r.pick([3, 4, 5, 6]);
      return {
        q: [`On a tree in which every site has $z = ${z}$ neighbours (a Bethe lattice), what is the site percolation threshold $p_c$?`, `どのサイトも $z = ${z}$ 個の隣をもつ木（ベーテ格子）で、サイトパーコレーションの閾値 $p_c$ はいくつですか。`],
        a: { type: 'num', v: 1 / (z - 1), show: frac(1, z - 1) },
        hint: ['Follow a path outward: each new site offers $z - 1$ fresh branches. The cluster is infinite if the expected number of open children exceeds 1.', '外へ向かう経路をたどると、新しいサイトごとに $z - 1$ 本の新しい枝があります。開いた子の期待数が 1 を超えればクラスターは無限です。'],
        sol: [[`Expected open branches per step: $(z - 1)p$. A branching process survives when this exceeds $1$.`, `一段あたりの開いた枝の期待数は $(z - 1)p$ です。分岐過程はこれが $1$ を超えると生き残ります。`], [`$p_c = 1/(z - 1) = ${frac(1, z - 1)}$. The square lattice also has $z = 4$, but its loops waste connections, so its $p_c = 0.5927$ is higher than the tree's $\\tfrac13$.`, `$p_c = 1/(z - 1) = ${frac(1, z - 1)}$ です。正方格子も $z = 4$ ですが、ループが接続を無駄にするので、$p_c = 0.5927$ は木の $\\tfrac13$ より大きくなります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([2, 3, 4, 10]);
        return {
          q: [`Below $p_c$ the correlation length grows as $\\xi \\propto (p_c - p)^{-4/3}$. If $p_c - p$ is divided by $${f}$, by what factor does $\\xi$ grow?`, `$p_c$ より下では相関長は $\\xi \\propto (p_c - p)^{-4/3}$ のように増えます。$p_c - p$ を $${f}$ 分の 1 にすると、$\\xi$ は何倍になりますか。`],
          a: { type: 'num', v: Math.pow(f, 4 / 3), show: `${f}^{4/3}` },
          hint: ['Only the ratio matters in a power law.', 'べき則では比だけが効きます。'],
          sol: [[`$\\xi_2/\\xi_1 = (1/${f})^{-4/3} = ${f}^{4/3} = ${n(Math.pow(f, 4 / 3), 4)}$.`, `$\\xi_2/\\xi_1 = (1/${f})^{-4/3} = ${f}^{4/3} = ${n(Math.pow(f, 4 / 3), 4)}$ です。`], ['The exponent $\\nu = 4/3$ is exact in two dimensions and the same for every 2D lattice, site or bond: universality.', '指数 $\\nu = 4/3$ は二次元で厳密であり、サイトでもボンドでも、どの二次元格子でも同じです。これが普遍性です。']],
        };
      }
      if (form === 1) {
        const L1 = r.pick([24, 16, 32]), m = r.pick([2, 4, 8]), L2 = L1 * m;
        return {
          q: [`The window of $p$ in which a finite lattice of side $L$ may or may not span has width $\\propto L^{-1/\\nu}$ with $\\nu = 4/3$. How much narrower is it for $L = ${L2}$ than for $L = ${L1}$?`, `一辺 $L$ の有限格子が張り渡すかどうか定まらない $p$ の窓の幅は $L^{-1/\\nu}$（$\\nu = 4/3$）に比例します。$L = ${L2}$ では $L = ${L1}$ に比べて何分の 1 になりますか。`],
          a: { type: 'num', v: Math.pow(m, 0.75), show: `${m}^{3/4}` },
          hint: ['The width ratio is $(L_2/L_1)^{-3/4}$; give the factor by which it shrinks.', '幅の比は $(L_2/L_1)^{-3/4}$ です。縮む倍率を答えます。'],
          sol: [[`$(L_2/L_1)^{3/4} = ${m}^{3/4} = ${n(Math.pow(m, 0.75), 4)}$.`, `$(L_2/L_1)^{3/4} = ${m}^{3/4} = ${n(Math.pow(m, 0.75), 4)}$ です。`], ['A lattice spans once its size exceeds the correlation length, $L > \\xi \\propto |p - p_c|^{-\\nu}$, so the uncertain window is $|p - p_c| \\lesssim L^{-1/\\nu}$. This is why the spanning curves in the figure steepen as $L$ grows.', '格子は大きさが相関長を超えると張り渡すので、$L > \\xi \\propto |p - p_c|^{-\\nu}$ から、不確かな窓は $|p - p_c| \\lesssim L^{-1/\\nu}$ です。図の張り渡し確率の曲線が $L$ とともに急になるのはこのためです。']],
          set: { L: 1, p: 0.59 },
        };
      }
      const a = r.pick([0.01, 0.02, 0.05]), b = r.pick([0.1, 0.2, 0.3]), ratio = Math.pow(b / a, 5 / 36);
      return {
        q: [`Above threshold the probability of belonging to the infinite cluster grows as $\\theta \\propto (p - p_c)^{5/36}$. Compare $p - p_c = ${n(b)}$ with $p - p_c = ${n(a)}$: what is $\\theta(${n(b)})/\\theta(${n(a)})$?`, `閾値より上では、無限クラスターに属する確率は $\\theta \\propto (p - p_c)^{5/36}$ のように増えます。$p - p_c = ${n(b)}$ と $p - p_c = ${n(a)}$ を比べたとき、$\\theta(${n(b)})/\\theta(${n(a)})$ はいくつですか。`],
        a: { type: 'num', v: ratio, rel: 0.003 },
        hint: ['$(b/a)^{5/36}$, with a very small exponent.', '$(b/a)^{5/36}$ で、指数はとても小さいです。'],
        sol: [[`$(${n(b)}/${n(a)})^{5/36} = ${n(b / a)}^{0.1389} = ${n(ratio, 4)}$.`, `$(${n(b)}/${n(a)})^{5/36} = ${n(b / a)}^{0.1389} = ${n(ratio, 4)}$ です。`], ['A tenfold change in distance from $p_c$ barely changes $\\theta$: the giant cluster appears almost abruptly, with a nearly vertical but continuous onset.', '$p_c$ からの距離が十倍変わっても $\\theta$ はほとんど変わりません。巨大クラスターはほぼ突然、ほとんど垂直だが連続的に現れます。']],
      };
    },
  ];

  /* ---------- 4. Vicsek flocking, N = 300 ---------- */
  const VN = 300;
  Q.vicsek = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rho = r.step(0.5, 4, 0.5), Lb = Math.sqrt(VN / rho);
        return {
          q: [`$${VN}$ particles at density $\\rho = ${n(rho)}$ (particles per unit area) fill a square box. How long is its side?`, `$${VN}$ 個の粒子が密度 $\\rho = ${n(rho)}$（単位面積あたりの粒子数）で正方形の箱を満たします。箱の一辺の長さはいくつですか。`],
          a: { type: 'num', v: Lb, tol: 0.01 },
          sol: [[`$L = \\sqrt{N/\\rho} = \\sqrt{${VN}/${n(rho)}} = ${n(Lb, 4)}$.`, `$L = \\sqrt{N/\\rho} = \\sqrt{${VN}/${n(rho)}} = ${n(Lb, 4)}$ です。`], ['The caption of the figure quotes the same side length.', '図の説明にも同じ一辺の長さが書かれています。']],
          set: { rho },
        };
      }
      if (form === 1) {
        const rho = r.step(0.5, 4, 0.5);
        return {
          q: [`At density $\\rho = ${n(rho)}$, how many other particles do you expect within the interaction radius $R = 1$ of a given particle, if positions are uniform?`, `密度 $\\rho = ${n(rho)}$ で位置が一様なとき、ある粒子の相互作用半径 $R = 1$ 以内にいる他の粒子の数の期待値はいくつですか。`],
          a: { type: 'num', v: PI * rho, tol: 0.01 },
          hint: ['Density times the area of the disc.', '密度に円板の面積を掛けます。'],
          sol: [[`$\\rho\\,\\pi R^2 = ${n(rho)}\\pi = ${n(PI * rho, 4)}$.`, `$\\rho\\,\\pi R^2 = ${n(rho)}\\pi = ${n(PI * rho, 4)}$ です。`], ['More neighbours means each heading averages more information, so noise is suppressed better: that is why density helps the flock to order.', '隣が多いほど各向きはより多くの情報を平均するので、ノイズをよく抑えられます。密度が群れの秩序を助けるのはこのためです。']],
          set: { rho },
        };
      }
      const k = r.pick([3, 4, 5]), ang = Array.from({ length: k }, () => r.step(-60, 120, 15));
      const c = ang.reduce((a, x) => a + Math.cos(rad(x)), 0), s = ang.reduce((a, x) => a + Math.sin(rad(x)), 0), phi = Math.hypot(c, s) / k;
      return {
        q: [`${k} particles move at equal speed with headings $${ang.map((x) => x + '^\\circ').join(', ')}$. What is their polarization $\\varphi = \\tfrac1N\\left|\\sum_j e^{i\\theta_j}\\right|$?`, `${k} 個の粒子が同じ速さで向き $${ang.map((x) => x + '^\\circ').join(', ')}$ に進みます。分極 $\\varphi = \\tfrac1N\\left|\\sum_j e^{i\\theta_j}\\right|$ はいくつですか。`],
        a: { type: 'num', v: phi, tol: 2e-3 },
        hint: ['Add the unit vectors of the headings and divide the length by $N$.', '向きの単位ベクトルを足し、その長さを $N$ で割ります。'],
        sol: [[`$\\sum\\cos\\theta_j = ${n(c, 4)}$, $\\sum\\sin\\theta_j = ${n(s, 4)}$.`, `$\\sum\\cos\\theta_j = ${n(c, 4)}$、$\\sum\\sin\\theta_j = ${n(s, 4)}$ です。`], [`$\\varphi = \\sqrt{${n(c, 4)}^2 + ${n(s, 4)}^2}/${k} = ${n(phi, 4)}$: the length of the mean velocity in units of the speed.`, `$\\varphi = \\sqrt{${n(c, 4)}^2 + ${n(s, 4)}^2}/${k} = ${n(phi, 4)}$ で、速さを単位とした平均速度の長さです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const eta = r.step(0.5, 6, 0.5), m = 2 * Math.sin(eta / 2) / eta;
        return {
          q: [`The noise adds an angle drawn uniformly from $[-\\eta/2, \\eta/2]$ with $\\eta = ${n(eta)}$. A perfectly aligned flock takes one step: by what factor does its polarization shrink on average?`, `ノイズは $[-\\eta/2, \\eta/2]$ から一様に選んだ角度を加えます（$\\eta = ${n(eta)}$）。完全にそろった群れが一ステップ進むと、分極は平均して何倍になりますか。`],
          a: { type: 'num', v: m, tol: 2e-3 },
          hint: ['Each heading becomes $\\theta + \\xi$; the mean velocity shrinks by $\\langle\\cos\\xi\\rangle$.', '各向きは $\\theta + \\xi$ になり、平均速度は $\\langle\\cos\\xi\\rangle$ 倍に縮みます。'],
          sol: [[`$\\langle\\cos\\xi\\rangle = \\dfrac1\\eta\\displaystyle\\int_{-\\eta/2}^{\\eta/2}\\cos\\xi\\,d\\xi = \\dfrac{2\\sin(\\eta/2)}{\\eta}$.`, `$\\langle\\cos\\xi\\rangle = \\dfrac1\\eta\\displaystyle\\int_{-\\eta/2}^{\\eta/2}\\cos\\xi\\,d\\xi = \\dfrac{2\\sin(\\eta/2)}{\\eta}$ です。`], [`$= 2\\sin(${n(eta / 2)})/${n(eta)} = ${n(m, 4)}$. Alignment restores order each step; whether it wins depends on how many neighbours are averaged against this loss.`, `$= 2\\sin(${n(eta / 2)})/${n(eta)} = ${n(m, 4)}$ です。整列は毎ステップ秩序を回復します。それが勝つかどうかは、この損失に対して何個の隣を平均するかによります。`]],
          set: { eta },
        };
      }
      if (form === 1) {
        const ang = Array.from({ length: 3 }, () => r.step(-90, 90, 10)), c = ang.reduce((a, x) => a + Math.cos(rad(x)), 0), s = ang.reduce((a, x) => a + Math.sin(rad(x)), 0), th = deg(Math.atan2(s, c));
        return {
          q: [`With no noise, a particle and its two neighbours have headings $${ang.map((x) => x + '^\\circ').join(', ')}$. What is the particle's new heading after one Vicsek update, in degrees?`, `ノイズがないとき、ある粒子とその二つの隣の向きは $${ang.map((x) => x + '^\\circ').join(', ')}$ です。ヴィチェックの一回の更新の後の粒子の向きは何度ですか。`],
          a: { type: 'num', v: th, tol: 0.1, unit: ['°', '°'] },
          hint: ['The update takes the direction of the vector sum, not the arithmetic mean of the angles.', '更新はベクトル和の向きをとります。角度の算術平均ではありません。'],
          sol: [[`$\\sum\\cos = ${n(c, 4)}$, $\\sum\\sin = ${n(s, 4)}$.`, `$\\sum\\cos = ${n(c, 4)}$、$\\sum\\sin = ${n(s, 4)}$ です。`], [`$\\theta' = \\operatorname{atan2}(${n(s, 4)}, ${n(c, 4)}) = ${n(th, 3)}^\\circ$, close to but not equal to the plain average $${n((ang[0] + ang[1] + ang[2]) / 3, 4)}^\\circ$.`, `$\\theta' = \\operatorname{atan2}(${n(s, 4)}, ${n(c, 4)}) = ${n(th, 3)}^\\circ$ で、単純な平均 $${n((ang[0] + ang[1] + ang[2]) / 3, 4)}^\\circ$ に近いですが等しくはありません。`]],
        };
      }
      return {
        q: [`With maximal noise every heading is random. For $N = ${VN}$ independent random headings, what is the root-mean-square polarization $\\sqrt{\\langle\\varphi^2\\rangle}$?`, `ノイズが最大のとき、どの向きもランダムです。$N = ${VN}$ 個の独立なランダムな向きについて、分極の二乗平均平方根 $\\sqrt{\\langle\\varphi^2\\rangle}$ はいくつですか。`],
        a: { type: 'num', v: 1 / Math.sqrt(VN), tol: 2e-4 },
        hint: ['$\\langle|\\sum_j e^{i\\theta_j}|^2\\rangle = \\sum_{j,k}\\langle e^{i(\\theta_j - \\theta_k)}\\rangle$, and only $j = k$ survives.', '$\\langle|\\sum_j e^{i\\theta_j}|^2\\rangle = \\sum_{j,k}\\langle e^{i(\\theta_j - \\theta_k)}\\rangle$ で、残るのは $j = k$ の項だけです。'],
        sol: [[`$\\langle|\\sum_j e^{i\\theta_j}|^2\\rangle = N$, so $\\langle\\varphi^2\\rangle = N/N^2 = 1/N$.`, `$\\langle|\\sum_j e^{i\\theta_j}|^2\\rangle = N$ なので $\\langle\\varphi^2\\rangle = N/N^2 = 1/N$ です。`], [`$\\sqrt{1/${VN}} = ${n(1 / Math.sqrt(VN), 4)}$: the floor the measured curve sinks to at high noise. A flock is only "ordered" if $\\varphi$ is well above this.`, `$\\sqrt{1/${VN}} = ${n(1 / Math.sqrt(VN), 4)}$ で、ノイズが大きいとき測定した曲線が沈む底です。$\\varphi$ がこれを十分に上回るときだけ群れは「秩序がある」と言えます。`]],
        set: { eta: 6.3 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['Write the mean factor $\\langle\\cos\\xi\\rangle$ by which uniform noise $\\xi \\in [-\\eta/2, \\eta/2]$ shrinks the polarization, as a function of $\\eta$.', '一様なノイズ $\\xi \\in [-\\eta/2, \\eta/2]$ が分極を縮める平均の倍率 $\\langle\\cos\\xi\\rangle$ を、$\\eta$ の式で書いてください。'],
        a: { type: 'expr', v: '2*sin(eta/2)/eta', vars: ['eta'], dom: { eta: [0.3, 6] }, lhs: ['$\\langle\\cos\\xi\\rangle =$', '$\\langle\\cos\\xi\\rangle =$'] },
        hint: ['Average $\\cos\\xi$ over the interval: integrate and divide by its length.', '区間上で $\\cos\\xi$ を平均します。積分して長さで割ります。'],
        sol: [['$\\dfrac1\\eta\\left[\\sin\\xi\\right]_{-\\eta/2}^{\\eta/2} = \\dfrac{2\\sin(\\eta/2)}{\\eta}$.', '$\\dfrac1\\eta\\left[\\sin\\xi\\right]_{-\\eta/2}^{\\eta/2} = \\dfrac{2\\sin(\\eta/2)}{\\eta}$ です。'], ['It is $1$ at $\\eta = 0$ and falls to $0$ at $\\eta = 2\\pi$, where the new heading carries no memory of the old one.', '$\\eta = 0$ で $1$、$\\eta = 2\\pi$ で $0$ になり、そこでは新しい向きは古い向きの記憶をまったくもちません。']],
        set: { eta: r.step(0.5, 6, 0.5) },
      };
      if (form === 1) {
        const target = r.pick([0.9, 0.8, 0.5, 0.25]);
        let lo = 1e-6, hi = 2 * PI; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (2 * Math.sin(m / 2) / m > target) lo = m; else hi = m; }
        const eta = (lo + hi) / 2;
        return {
          q: [`For which noise amplitude $\\eta$ does one noisy step multiply the polarization of an aligned flock by $${n(target)}$ on average? Give three decimals.`, `どのノイズの大きさ $\\eta$ のとき、そろった群れの分極が一回のノイズのあるステップで平均 $${n(target)}$ 倍になりますか。小数第3位まで答えてください。`],
          a: { type: 'num', v: eta, tol: 2e-3 },
          hint: ['Solve $2\\sin(\\eta/2)/\\eta = c$ numerically; the left side decreases from 1 to 0 on $[0, 2\\pi]$.', '$2\\sin(\\eta/2)/\\eta = c$ を数値的に解きます。左辺は $[0, 2\\pi]$ で 1 から 0 へ減少します。'],
          sol: [[`The function $2\\sin(\\eta/2)/\\eta$ is decreasing on $[0, 2\\pi]$, so bisection finds a single root.`, `関数 $2\\sin(\\eta/2)/\\eta$ は $[0, 2\\pi]$ で減少するので、二分法で一つの根が求まります。`], [`$\\eta = ${n(eta, 4)}$ (check: $2\\sin(${n(eta / 2, 4)})/${n(eta, 4)} = ${n(2 * Math.sin(eta / 2) / eta, 4)}$).`, `$\\eta = ${n(eta, 4)}$ です（確認：$2\\sin(${n(eta / 2, 4)})/${n(eta, 4)} = ${n(2 * Math.sin(eta / 2) / eta, 4)}$）。`], ['Small-angle check: $\\langle\\cos\\xi\\rangle \\approx 1 - \\eta^2/24$, so the loss per step grows quadratically with the noise.', '小角度で確かめると $\\langle\\cos\\xi\\rangle \\approx 1 - \\eta^2/24$ で、ステップごとの損失はノイズの2乗で増えます。']],
          set: { eta: Math.round(eta * 10) / 10 },
        };
      }
      const nb = r.pick([3, 6, 9, 12]), rho = nb / PI, Lb = Math.sqrt(VN / rho);
      return {
        q: [`You want each particle to see on average $${nb}$ others within $R = 1$. For $N = ${VN}$, what box side $L$ do you need?`, `各粒子が $R = 1$ 以内に平均 $${nb}$ 個の他の粒子を見るようにしたいとします。$N = ${VN}$ のとき、箱の一辺 $L$ はいくつ必要ですか。`],
        a: { type: 'num', v: Lb, tol: 0.01 },
        hint: ['First the density from $\\pi\\rho R^2 = ' + nb + '$, then $L = \\sqrt{N/\\rho}$.', 'まず $\\pi\\rho R^2 = ' + nb + '$ から密度を求め、次に $L = \\sqrt{N/\\rho}$ です。'],
        sol: [[`$\\rho = ${nb}/\\pi = ${n(rho, 4)}$.`, `$\\rho = ${nb}/\\pi = ${n(rho, 4)}$ です。`], [`$L = \\sqrt{${VN}/${n(rho, 4)}} = ${n(Lb, 4)}$. Only the density enters the local rule, which is why the transition is described by $\\rho$ and $\\eta$ rather than by $N$ and $L$ separately.`, `$L = \\sqrt{${VN}/${n(rho, 4)}} = ${n(Lb, 4)}$ です。局所的な規則に入るのは密度だけなので、転移は $N$ と $L$ を別々にではなく $\\rho$ と $\\eta$ で記述されます。`]],
        set: rho <= 4 ? { rho: Math.max(0.5, Math.round(rho * 2) / 2) } : undefined,
      };
    },
  ];
})();
