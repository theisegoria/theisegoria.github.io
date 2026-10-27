'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, mat, gcd } = P.util;
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const tw = (x) => Math.round(x * 20);                 // p on the 0.05 grid, as twentieths
  const piA = (p, q) => q / (p + q);

  /* ---------- 1. transition dynamics ---------- */
  Q.transition = [
    (r) => {
      const kind = r.int(0, 2), p = r.step(0.05, 0.9, 0.05), q = r.step(0.05, 0.9, 0.05);
      if (kind === 0) {
        const a = r.pick([0.5, 0.5, 1, 0, 0.3, 0.8]), a1 = a * (1 - p) + (1 - a) * q;
        return {
          q: [`A two-state chain moves $A \\to B$ with probability $p = ${n(p)}$ and $B \\to A$ with $q = ${n(q)}$. It starts with $P(X_0 = A) = ${n(a)}$. Find $P(X_1 = A)$.`, `2状態の連鎖が $A \\to B$ に確率 $p = ${n(p)}$、$B \\to A$ に確率 $q = ${n(q)}$ で移ります。$P(X_0 = A) = ${n(a)}$ から始めるとき、$P(X_1 = A)$ を求めてください。`],
          a: { type: 'num', v: a1 },
          hint: ['Mass in $A$ next step = mass that stays in $A$ plus mass that arrives from $B$.', '次のステップで $A$ にある確率は、$A$ にとどまる分と $B$ から来る分の和です。'],
          sol: [[`$P(X_1 = A) = P(X_0 = A)(1 - p) + P(X_0 = B)\\,q = ${n(a)}\\cdot${n(1 - p)} + ${n(1 - a)}\\cdot${n(q)}$.`, `$P(X_1 = A) = P(X_0 = A)(1 - p) + P(X_0 = B)\\,q = ${n(a)}\\cdot${n(1 - p)} + ${n(1 - a)}\\cdot${n(q)}$ です。`], [`$= ${n(a1, 4)}$: one multiplication of the row vector by $P$.`, `$= ${n(a1, 4)}$ で、行ベクトルに $P$ を1回掛けたものです。`]],
          set: a === 0.5 ? { p, q, steps: 1 } : { p, q },
        };
      }
      if (kind === 1) {
        const which = r.int(0, 1);
        return {
          q: [which ? `For $P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$, what is the probability of going from $A$ to $B$ and straight back to $A$ in two steps?` : `For $P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$, what is the second eigenvalue $\\lambda_2$?`, which ? `$P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$ のとき、2ステップで $A$ から $B$ へ行き、すぐ $A$ に戻る確率はいくつですか。` : `$P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$ の第2固有値 $\\lambda_2$ はいくつですか。`],
          a: { type: 'num', v: which ? p * q : 1 - p - q },
          hint: [which ? 'Multiply the probabilities of the two moves; the chain is memoryless.' : 'One eigenvalue is always 1; the trace is the sum of the eigenvalues.', which ? '2回の移動の確率を掛けます。連鎖には記憶がありません。' : '固有値の1つは常に 1 で、跡は固有値の和です。'],
          sol: which ? [[`$P(A \\to B) = ${n(p)}$, then $P(B \\to A) = ${n(q)}$.`, `$P(A \\to B) = ${n(p)}$、続いて $P(B \\to A) = ${n(q)}$ です。`], [`$${n(p)}\\cdot${n(q)} = ${n(p * q, 4)}$. It is one of the two paths that make up $(P^2)_{AA}$.`, `$${n(p)}\\cdot${n(q)} = ${n(p * q, 4)}$ で、$(P^2)_{AA}$ を作る2つの経路の一方です。`]] : [[`The trace is $${n(1 - p)} + ${n(1 - q)} = ${n(2 - p - q)}$ and one eigenvalue is 1 (rows sum to 1).`, `跡は $${n(1 - p)} + ${n(1 - q)} = ${n(2 - p - q)}$ で、行の和が 1 なので固有値の1つは 1 です。`], [`$\\lambda_2 = ${n(2 - p - q)} - 1 = ${n(1 - p - q)}$; it is the factor by which the distance to equilibrium shrinks each step.`, `$\\lambda_2 = ${n(2 - p - q)} - 1 = ${n(1 - p - q)}$ で、平衡までの距離が毎ステップ縮む倍率です。`]],
          set: { p, q },
        };
      }
      const k = r.int(0, 1), stay = k ? 1 - q : 1 - p;
      return {
        q: [`In the chain with $p = ${n(p)}$ and $q = ${n(q)}$, what is the probability that a walker in ${k ? 'B' : 'A'} is still in ${k ? 'B' : 'A'} after one step?`, `$p = ${n(p)}$、$q = ${n(q)}$ の連鎖で、${k ? 'B' : 'A'} にいる者が1ステップ後も ${k ? 'B' : 'A'} にいる確率はいくつですか。`],
        a: { type: 'num', v: stay },
        hint: ['Each row of the transition matrix sums to 1.', '遷移行列の各行の和は 1 です。'],
        sol: [[`From ${k ? 'B' : 'A'} the only other move has probability $${n(k ? q : p)}$.`, `${k ? 'B' : 'A'} からの別の移動の確率は $${n(k ? q : p)}$ だけです。`], [`So it stays with probability $1 - ${n(k ? q : p)} = ${n(stay)}$: the self-loop in the diagram.`, `したがってとどまる確率は $1 - ${n(k ? q : p)} = ${n(stay)}$ で、図の自己ループにあたります。`]],
        set: { p, q },
      };
    },
    (r) => {
      const kind = r.int(0, 2), p = r.step(0.05, 0.9, 0.05), q = r.step(0.05, 0.9, 0.05), lam = 1 - p - q, pi = piA(p, q);
      if (kind === 0) {
        const v = (1 - p) ** 2 + p * q;
        return {
          q: [`With $p = ${n(p)}$ and $q = ${n(q)}$, find $P(X_2 = A \\mid X_0 = A)$.`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、$P(X_2 = A \\mid X_0 = A)$ を求めてください。`],
          a: { type: 'num', v },
          hint: ['Two routes: stay, stay; or leave and come back.', '経路は2つです。とどまってとどまるか、出て戻るかです。'],
          sol: [[`$A \\to A \\to A$: $(1 - p)^2 = ${n((1 - p) ** 2, 4)}$. $A \\to B \\to A$: $pq = ${n(p * q, 4)}$.`, `$A \\to A \\to A$：$(1 - p)^2 = ${n((1 - p) ** 2, 4)}$、$A \\to B \\to A$：$pq = ${n(p * q, 4)}$ です。`], [`$(P^2)_{AA} = ${n(v, 4)}$: summing over the intermediate state is matrix multiplication.`, `$(P^2)_{AA} = ${n(v, 4)}$ です。中間の状態について和をとることが行列の積です。`]],
          set: { p, q, steps: 2 },
        };
      }
      if (kind === 1) {
        const N = r.int(2, 30), v = pi + (0.5 - pi) * lam ** N;
        return {
          q: [`Start with probability $\\tfrac12$ in each state, $p = ${n(p)}$, $q = ${n(q)}$. Find $P(X_{${N}} = A)$ to four decimals.`, `各状態に $\\tfrac12$ ずつ置いて始め、$p = ${n(p)}$、$q = ${n(q)}$ とします。$P(X_{${N}} = A)$ を小数第4位まで求めてください。`],
          a: { type: 'num', v, tol: 6e-5 },
          hint: ['The distance to $\\pi(A) = q/(p+q)$ is multiplied by $\\lambda_2 = 1 - p - q$ each step.', '$\\pi(A) = q/(p+q)$ までの距離は、毎ステップ $\\lambda_2 = 1 - p - q$ 倍になります。'],
          sol: [[`$\\pi(A) = ${n(q)}/${n(p + q)} = ${n(pi, 5)}$ and $\\lambda_2 = ${n(lam)}$.`, `$\\pi(A) = ${n(q)}/${n(p + q)} = ${n(pi, 5)}$、$\\lambda_2 = ${n(lam)}$ です。`], [`$P(X_{${N}} = A) = \\pi(A) + (\\tfrac12 - \\pi(A))\\lambda_2^{${N}} = ${n(pi, 5)} + (${n(0.5 - pi, 5)})(${n(lam)})^{${N}} = ${n(v, 5)}$.`, `$P(X_{${N}} = A) = \\pi(A) + (\\tfrac12 - \\pi(A))\\lambda_2^{${N}} = ${n(pi, 5)} + (${n(0.5 - pi, 5)})(${n(lam)})^{${N}} = ${n(v, 5)}$ です。`], [Math.abs(lam) ** N < 1e-3 ? 'The start is essentially forgotten.' : 'Some memory of the start remains: the bar has not yet reached the dashed line.', Math.abs(lam) ** N < 1e-3 ? '初期分布はほぼ忘れられています。' : '初期分布の記憶がまだ残っており、棒は点線に届いていません。']],
          set: { p, q, steps: N },
        };
      }
      const P2 = [[(1 - p) ** 2 + p * q, p * (1 - p) + p * (1 - q)], [q * (1 - p) + (1 - q) * q, q * p + (1 - q) ** 2]];
      const row = r.int(0, 1);
      return {
        q: [`Compute row ${row ? 'B' : 'A'} of $P^2$ for $P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$.`, `$P = ${mat([[n(1 - p), n(p)], [n(q), n(1 - q)]], 'bmatrix')}$ について、$P^2$ の ${row ? 'B' : 'A'} 行を求めてください。`],
        a: { type: 'tuple', v: P2[row], labels: [`$(P^2)_{${row ? 'B' : 'A'}A}$`, `$(P^2)_{${row ? 'B' : 'A'}B}$`] },
        hint: ['Entry $(i, j)$ of $P^2$ is row $i$ of $P$ dotted with column $j$.', '$P^2$ の $(i, j)$ 成分は、$P$ の $i$ 行と $j$ 列の内積です。'],
        sol: [[`$(P^2)_{${row ? 'B' : 'A'}A} = ${row ? `${n(q)}\\cdot${n(1 - p)} + ${n(1 - q)}\\cdot${n(q)}` : `${n(1 - p)}^2 + ${n(p)}\\cdot${n(q)}`} = ${n(P2[row][0], 4)}$.`, `$(P^2)_{${row ? 'B' : 'A'}A} = ${row ? `${n(q)}\\cdot${n(1 - p)} + ${n(1 - q)}\\cdot${n(q)}` : `${n(1 - p)}^2 + ${n(p)}\\cdot${n(q)}`} = ${n(P2[row][0], 4)}$ です。`], [`$(P^2)_{${row ? 'B' : 'A'}B} = 1 - ${n(P2[row][0], 4)} = ${n(P2[row][1], 4)}$, since every row of a power of $P$ still sums to 1.`, `$P$ の累乗の各行も和が 1 なので、$(P^2)_{${row ? 'B' : 'A'}B} = 1 - ${n(P2[row][0], 4)} = ${n(P2[row][1], 4)}$ です。`]],
        set: { p, q, steps: 2 },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let p, q; do { p = r.step(0.05, 0.6, 0.05); q = r.step(0.05, 0.6, 0.05); } while (p + q > 0.9);
        const lam = 1 - p - q, s = tw(p) + tw(q);
        return {
          q: [`With $p = ${n(p)}$ and $q = ${n(q)}$, write $P(X_n = A \\mid X_0 = A)$ as a function of $n$.`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、$P(X_n = A \\mid X_0 = A)$ を $n$ の式で表してください。`],
          a: { type: 'expr', v: `${tw(q)}/${s}+${tw(p)}/${s}*(${n(lam)})^n`, vars: ['n'], dom: { n: [0, 12] }, lhs: ['$P(X_n = A \\mid X_0 = A) =$', '$P(X_n = A \\mid X_0 = A) =$'] },
          hint: ['Write the start as $\\pi$ plus a deviation; only the deviation is multiplied by $\\lambda_2$ each step.', '初期分布を $\\pi$ とずれの和に分けます。毎ステップ $\\lambda_2$ 倍になるのはずれだけです。'],
          sol: [[`$\\pi(A) = ${frac(tw(q), s)}$ and the starting deviation is $1 - \\pi(A) = ${frac(tw(p), s)}$.`, `$\\pi(A) = ${frac(tw(q), s)}$ で、初期のずれは $1 - \\pi(A) = ${frac(tw(p), s)}$ です。`], [`$P(X_n = A) = ${frac(tw(q), s)} + ${frac(tw(p), s)}\\,(${n(lam)})^n$.`, `$P(X_n = A) = ${frac(tw(q), s)} + ${frac(tw(p), s)}\\,(${n(lam)})^n$ です。`], ['Check: $n = 0$ gives 1, $n = 1$ gives $1 - p$, and $n \\to \\infty$ gives the stationary share.', '確認：$n = 0$ で 1、$n = 1$ で $1 - p$、$n \\to \\infty$ で定常確率になります。']],
          set: { p, q, steps: 10 },
        };
      }
      if (kind === 1) {
        const p = r.step(0.05, 0.6, 0.05), q = r.step(0.05, 0.6, 0.05), lam = 1 - p - q, pi = piA(p, q), eps = r.pick([0.01, 0.001, 0.05, 0.005]);
        const need = Math.abs(lam) < 1e-9 ? 1 : Math.max(0, Math.ceil(Math.log(eps / (1 - pi)) / Math.log(Math.abs(lam)) - 1e-9));
        const ok = (1 - pi) * Math.abs(lam) ** need < eps;
        const nn = ok ? need : need + 1;
        return {
          q: [`Start in $A$ with $p = ${n(p)}$, $q = ${n(q)}$. After how many steps is $|P(X_n = A) - \\pi(A)|$ first below $${n(eps)}$?`, `$A$ から始め、$p = ${n(p)}$、$q = ${n(q)}$ とします。$|P(X_n = A) - \\pi(A)|$ が初めて $${n(eps)}$ を下回るのは何ステップ後ですか。`],
          a: { type: 'int', v: nn },
          hint: ['The gap is $(1 - \\pi(A))\\,|\\lambda_2|^n$; take logarithms.', '差は $(1 - \\pi(A))\\,|\\lambda_2|^n$ です。対数をとります。'],
          sol: [[`$\\pi(A) = ${n(pi, 4)}$, $|\\lambda_2| = ${n(Math.abs(lam))}$, so the gap is $${n(1 - pi, 4)}\\cdot${n(Math.abs(lam))}^n$.`, `$\\pi(A) = ${n(pi, 4)}$、$|\\lambda_2| = ${n(Math.abs(lam))}$ なので、差は $${n(1 - pi, 4)}\\cdot${n(Math.abs(lam))}^n$ です。`], [`$n > \\ln(${n(eps)}/${n(1 - pi, 4)})/\\ln ${n(Math.abs(lam))} = ${n(Math.log(eps / (1 - pi)) / Math.log(Math.abs(lam)), 3)}$, so $n = ${nn}$.`, `$n > \\ln(${n(eps)}/${n(1 - pi, 4)})/\\ln ${n(Math.abs(lam))} = ${n(Math.log(eps / (1 - pi)) / Math.log(Math.abs(lam)), 3)}$ なので $n = ${nn}$ です。`], ['The mixing time grows like $1/|\\ln|\\lambda_2||$: chains with $\\lambda_2$ near 1 are slow.', '混合時間は $1/|\\ln|\\lambda_2||$ のように増えます。$\\lambda_2$ が 1 に近い連鎖は遅いのです。']],
          set: nn <= 30 ? { p, q, steps: nn } : { p, q },
        };
      }
      let p, q; do { p = r.step(0.1, 0.9, 0.05); q = r.step(0.1, 0.9, 0.05); } while (Math.abs(p + q - 1) < 1e-9);
      const lam = 1 - p - q;
      return {
        q: [`For $p = ${n(p)}$ and $q = ${n(q)}$, how does $P(X_n = A)$ approach its limit?`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、$P(X_n = A)$ は極限にどのように近づきますか。`],
        a: { type: 'choice', opts: [['Monotonically, from one side.', '片側から単調に近づきます。'], ['Oscillating, overshooting on alternate steps.', '1ステップおきに行き過ぎながら、振動して近づきます。'], ['It does not converge.', '収束しません。']], v: lam > 0 ? 0 : 1, fixed: true },
        hint: ['Look at the sign of $\\lambda_2 = 1 - p - q$.', '$\\lambda_2 = 1 - p - q$ の符号を見てください。'],
        sol: [[`$\\lambda_2 = 1 - ${n(p)} - ${n(q)} = ${n(lam)}$, and $|\\lambda_2| < 1$ so it converges.`, `$\\lambda_2 = 1 - ${n(p)} - ${n(q)} = ${n(lam)}$ で、$|\\lambda_2| < 1$ なので収束します。`], [lam > 0 ? 'A positive $\\lambda_2$ keeps the sign of the deviation: a monotone approach.' : 'A negative $\\lambda_2$ flips the sign of the deviation each step: the mass sloshes back and forth because leaving is more likely than staying.', lam > 0 ? '$\\lambda_2$ が正ならずれの符号は保たれ、単調に近づきます。' : '$\\lambda_2$ が負ならずれの符号が毎ステップ反転します。とどまるより出ていくほうが起こりやすいため、確率が行ったり来たりするのです。']],
        set: { p, q, steps: 12 },
      };
    },
  ];

  /* ---------- 2. stationary distribution ---------- */
  // three-state chain with entries in tenths; stationary vector by the Markov chain tree theorem
  function chain3(r) {
    for (;;) {
      const rows = [0, 1, 2].map(() => { const a = r.int(0, 8), b = r.int(0, 10 - a); return [a, b, 10 - a - b]; });
      const M = rows.map((row, i) => { const rr = row.slice(); const own = rr.splice(0, 1)[0]; const out = [0, 0, 0]; out[i] = own; const others = [0, 1, 2].filter((j) => j !== i); out[others[0]] = rr[0]; out[others[1]] = rr[1]; return out; });
      const [A, B, C] = [0, 1, 2], m = (i, j) => M[i][j];
      const w = [m(B, A) * m(C, A) + m(B, C) * m(C, A) + m(C, B) * m(B, A), m(A, B) * m(C, B) + m(A, C) * m(C, B) + m(C, A) * m(A, B), m(A, C) * m(B, C) + m(A, B) * m(B, C) + m(B, A) * m(A, C)];
      const tot = w[0] + w[1] + w[2];
      if (tot > 0 && w.every((x) => x > 0) && M.every((row, i) => row[i] < 10)) return { M, w, tot };
    }
  }
  Q.stationary = [
    (r) => {
      const kind = r.int(0, 2), p = r.step(0.05, 0.95, 0.05), q = r.step(0.05, 0.95, 0.05), pi = piA(p, q);
      if (kind === 0) {
        return {
          q: [`A two-state chain has $p = P(A \\to B) = ${n(p)}$ and $q = P(B \\to A) = ${n(q)}$. What is the stationary probability $\\pi(A)$?`, `2状態の連鎖で $p = P(A \\to B) = ${n(p)}$、$q = P(B \\to A) = ${n(q)}$ です。定常確率 $\\pi(A)$ はいくつですか。`],
          a: { type: 'num', v: pi, show: frac(tw(q), tw(p) + tw(q)) },
          hint: ['In equilibrium the flow $A \\to B$ balances the flow $B \\to A$.', '平衡では $A \\to B$ の流れと $B \\to A$ の流れがつり合います。'],
          sol: [[`Balance: $\\pi(A)\\,p = \\pi(B)\\,q$ with $\\pi(A) + \\pi(B) = 1$.`, `つり合いの式 $\\pi(A)\\,p = \\pi(B)\\,q$ と $\\pi(A) + \\pi(B) = 1$ を使います。`], [`$\\pi(A) = \\dfrac{q}{p + q} = \\dfrac{${n(q)}}{${n(p + q)}} = ${frac(tw(q), tw(p) + tw(q))}$: the dashed line every start converges to.`, `$\\pi(A) = \\dfrac{q}{p + q} = \\dfrac{${n(q)}}{${n(p + q)}} = ${frac(tw(q), tw(p) + tw(q))}$ で、どの初期分布もこの点線に収束します。`]],
          set: { p, q },
        };
      }
      if (kind === 1) {
        return {
          q: [`With $p = ${n(p)}$ and $q = ${n(q)}$, what is the expected number of steps between successive visits to $A$, in the long run?`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、長期的に見て $A$ を訪れてから次に訪れるまでの平均ステップ数はいくつですか。`],
          a: { type: 'num', v: 1 / pi, show: frac(tw(p) + tw(q), tw(q)) },
          hint: ['The mean return time to a state is $1/\\pi$ of that state (Kac\'s lemma).', '状態への平均再帰時間は、その状態の $1/\\pi$ です（カッツの補題）。'],
          sol: [[`$\\pi(A) = ${n(q)}/${n(p + q)} = ${n(pi, 4)}$.`, `$\\pi(A) = ${n(q)}/${n(p + q)} = ${n(pi, 4)}$ です。`], [`Mean return time $1/\\pi(A) = ${n(1 / pi, 4)}$ steps: a state visited a fraction $\\pi$ of the time is revisited every $1/\\pi$ steps on average.`, `平均再帰時間は $1/\\pi(A) = ${n(1 / pi, 4)}$ ステップです。時間の割合 $\\pi$ で訪れる状態には、平均 $1/\\pi$ ステップごとに戻ってきます。`]],
          set: { p, q },
        };
      }
      const N = r.int(1, 30), lam = 1 - p - q, g = Math.abs(lam) ** N;
      return {
        q: [`With $p = ${n(p)}$ and $q = ${n(q)}$, by what factor has the distance to equilibrium shrunk after $n = ${N}$ steps?`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、$n = ${N}$ ステップ後に平衡までの距離は何倍に縮んでいますか。`],
        a: { type: 'num', v: g, rel: 0.003 },
        hint: ['Each step multiplies the deviation from $\\pi$ by $\\lambda_2 = 1 - p - q$.', '各ステップで $\\pi$ からのずれが $\\lambda_2 = 1 - p - q$ 倍になります。'],
        sol: [[`$\\lambda_2 = ${n(lam)}$.`, `$\\lambda_2 = ${n(lam)}$ です。`], [`$|\\lambda_2|^{${N}} = ${n(g, 4)}$, whatever the starting distribution: that is the envelope in the figure.`, `初期分布によらず $|\\lambda_2|^{${N}} = ${n(g, 4)}$ です。これが図の包絡線です。`]],
        set: { p, q, steps: N },
      };
    },
    (r) => {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const { M, w, tot } = chain3(r), g = w.reduce(gcd);
        const T = M.map((row) => row.map((x) => n(x / 10)));
        return {
          q: [`Find the stationary distribution of the three-state chain with transition matrix $P = ${mat(T, 'bmatrix')}$.`, `遷移行列 $P = ${mat(T, 'bmatrix')}$ の3状態の連鎖の定常分布を求めてください。`],
          a: { type: 'tuple', v: w.map((x) => x / tot), labels: ['$\\pi_1$', '$\\pi_2$', '$\\pi_3$'], tol: 6e-4 },
          hint: ['Solve $\\pi P = \\pi$ with $\\pi_1 + \\pi_2 + \\pi_3 = 1$; one balance equation is redundant.', '$\\pi P = \\pi$ と $\\pi_1 + \\pi_2 + \\pi_3 = 1$ を解きます。つり合いの式の1つは余分です。'],
          sol: [[`The equations $\\pi P = \\pi$ have the solution proportional to $(${w.map((x) => x / g).join(', ')})$ (check, for example, the first column: $${n(M[0][0] / 10)}\\pi_1 + ${n(M[1][0] / 10)}\\pi_2 + ${n(M[2][0] / 10)}\\pi_3 = \\pi_1$).`, `$\\pi P = \\pi$ の解は $(${w.map((x) => x / g).join(', ')})$ に比例します（たとえば第1列で $${n(M[0][0] / 10)}\\pi_1 + ${n(M[1][0] / 10)}\\pi_2 + ${n(M[2][0] / 10)}\\pi_3 = \\pi_1$ を確かめられます）。`], [`Normalizing: $\\pi = (${w.map((x) => frac(x, tot)).join(', ')}) \\approx (${w.map((x) => n(x / tot, 4)).join(', ')})$.`, `規格化すると $\\pi = (${w.map((x) => frac(x, tot)).join(', ')}) \\approx (${w.map((x) => n(x / tot, 4)).join(', ')})$ です。`], ['This is the long-run share of time spent in each state, whatever the start.', 'これは初期状態によらない、各状態に滞在する時間の長期的な割合です。']],
        };
      }
      let p, q, lam; do { p = r.step(0.05, 0.95, 0.05); q = r.step(0.05, 0.95, 0.05); lam = Math.abs(1 - p - q); } while (lam < 0.05);
      const hl = Math.LN2 / Math.abs(Math.log(lam));
      return {
        q: [`With $p = ${n(p)}$ and $q = ${n(q)}$, how many steps does it take for the distance to equilibrium to halve? Two decimals.`, `$p = ${n(p)}$、$q = ${n(q)}$ のとき、平衡までの距離が半分になるのに何ステップかかりますか（小数第2位まで）。`],
        a: { type: 'num', v: hl, tol: 0.006 },
        hint: ['Solve $|\\lambda_2|^h = \\tfrac12$.', '$|\\lambda_2|^h = \\tfrac12$ を解きます。'],
        sol: [[`$|\\lambda_2| = |1 - ${n(p)} - ${n(q)}| = ${n(lam)}$.`, `$|\\lambda_2| = |1 - ${n(p)} - ${n(q)}| = ${n(lam)}$ です。`], [`$h = \\ln 2/|\\ln ${n(lam)}| = ${n(hl, 4)}$ steps, matching the readout's half-life.`, `$h = \\ln 2/|\\ln ${n(lam)}| = ${n(hl, 4)}$ ステップで、読み取り欄の半減期と一致します。`]],
        set: { p, q },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const pis = [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8], lams = [0.5, 0.6, 0.2, 0.4, 0, -0.2, 0.8];
        let pi, lam, p, q; do { pi = r.pick(pis); lam = r.pick(lams); q = pi * (1 - lam); p = (1 - pi) * (1 - lam); } while (p < 0.05 - 1e-9 || q < 0.05 - 1e-9 || p > 0.95 + 1e-9 || q > 0.95 + 1e-9);
        const grid = [p, q].every((x) => Math.abs(x * 20 - Math.round(x * 20)) < 1e-9);
        return {
          q: [`Design a two-state chain whose stationary distribution has $\\pi(A) = ${n(pi)}$ and whose second eigenvalue is $\\lambda_2 = ${n(lam)}$. Find $p$ and $q$.`, `定常分布が $\\pi(A) = ${n(pi)}$ で、第2固有値が $\\lambda_2 = ${n(lam)}$ の2状態の連鎖を作ります。$p$ と $q$ を求めてください。`],
          a: { type: 'tuple', v: [p, q], labels: ['$p$', '$q$'], tol: 1e-6 },
          hint: ['$\\lambda_2$ fixes $p + q$, and $\\pi(A)$ fixes how that total is split.', '$\\lambda_2$ が $p + q$ を決め、$\\pi(A)$ がその分け方を決めます。'],
          sol: [[`$p + q = 1 - \\lambda_2 = ${n(1 - lam)}$.`, `$p + q = 1 - \\lambda_2 = ${n(1 - lam)}$ です。`], [`$q = \\pi(A)(p + q) = ${n(q, 4)}$ and $p = ${n(p, 4)}$.`, `$q = \\pi(A)(p + q) = ${n(q, 4)}$、$p = ${n(p, 4)}$ です。`], ['Where the chain settles and how fast it gets there are independent dials.', '連鎖がどこに落ち着くかと、どれだけ速く落ち着くかは、別々に調整できます。']],
          set: grid ? { p: Math.round(p * 20) / 20, q: Math.round(q * 20) / 20 } : undefined,
        };
      }
      if (kind === 1) {
        const u = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]), d = r.pick([0.2, 0.3, 0.4, 0.5, 0.6].filter((x) => x !== u && x + u <= 1));
        const rho = u / d, w = [1, rho, rho * rho, rho ** 3], tot = w.reduce((a, b) => a + b, 0);
        return {
          q: [`A walker on states $0, 1, 2, 3$ steps up with probability $${n(u)}$ and down with probability $${n(d)}$, otherwise stays put (moves off the ends are replaced by staying). Find the stationary distribution.`, `状態 $0, 1, 2, 3$ 上の歩行者が、確率 $${n(u)}$ で1つ上に、確率 $${n(d)}$ で1つ下に移り、それ以外はとどまります（端からはみ出す移動はとどまるに置き換えます）。定常分布を求めてください。`],
          a: { type: 'tuple', v: w.map((x) => x / tot), labels: ['$\\pi_0$', '$\\pi_1$', '$\\pi_2$', '$\\pi_3$'], tol: 6e-4 },
          hint: ['Detailed balance across each edge: $\\pi_k\\,u = \\pi_{k+1}\\,d$.', '各辺での詳細つり合い $\\pi_k\\,u = \\pi_{k+1}\\,d$ を使います。'],
          sol: [[`$\\pi_{k+1} = (${n(u)}/${n(d)})\\,\\pi_k$, so $\\pi \\propto (1, ${n(rho, 4)}, ${n(rho * rho, 4)}, ${n(rho ** 3, 4)})$.`, `$\\pi_{k+1} = (${n(u)}/${n(d)})\\,\\pi_k$ なので $\\pi \\propto (1, ${n(rho, 4)}, ${n(rho * rho, 4)}, ${n(rho ** 3, 4)})$ です。`], [`Dividing by $${n(tot, 4)}$: $\\pi = (${w.map((x) => n(x / tot, 4)).join(', ')})$.`, `$${n(tot, 4)}$ で割ると $\\pi = (${w.map((x) => n(x / tot, 4)).join(', ')})$ です。`], [rho > 1 ? 'An upward drift piles probability geometrically at the top.' : 'A downward drift piles probability geometrically at the bottom.', rho > 1 ? '上向きの偏りで、確率は上端に幾何級数的に集まります。' : '下向きの偏りで、確率は下端に幾何級数的に集まります。']],
        };
      }
      // a doubly stochastic matrix: columns also sum to 1
      for (;;) {
        const a = r.int(1, 6), b = r.int(1, 6), c = 10 - a - b;
        if (c < 1) continue;
        const perm = r.pick([[[a, b, c], [c, a, b], [b, c, a]], [[a, c, b], [b, a, c], [c, b, a]]]);
        const T = perm.map((row) => row.map((x) => n(x / 10)));
        return {
          q: [`Find the stationary distribution of $P = ${mat(T, 'bmatrix')}$.`, `$P = ${mat(T, 'bmatrix')}$ の定常分布を求めてください。`],
          a: { type: 'tuple', v: [1 / 3, 1 / 3, 1 / 3], labels: ['$\\pi_1$', '$\\pi_2$', '$\\pi_3$'], tol: 6e-4 },
          hint: ['Add up each column before solving anything.', '何かを解く前に、各列の和を計算してみてください。'],
          sol: [['Every column of $P$ also sums to 1: the matrix is doubly stochastic.', '$P$ の各列の和も 1 で、この行列は二重確率行列です。'], ['Then $(\\tfrac13, \\tfrac13, \\tfrac13)P$ has entries $\\tfrac13 \\times (\\text{column sum}) = \\tfrac13$, so the uniform distribution is stationary, and it is the only one because the chain is irreducible.', 'すると $(\\tfrac13, \\tfrac13, \\tfrac13)P$ の成分は $\\tfrac13 \\times (\\text{列和}) = \\tfrac13$ なので一様分布が定常で、連鎖が既約なのでそれが唯一の定常分布です。']],
        };
      }
    },
  ];

  /* ---------- 3. gambler's ruin ---------- */
  const hWin = (a, i, N) => (Math.abs(a - 0.5) < 1e-12 ? i / N : (1 - ((1 - a) / a) ** i) / (1 - ((1 - a) / a) ** N));
  Q.absorbing = [
    (r) => {
      const kind = r.int(0, 2), N = r.int(4, 12), i = r.int(1, Math.min(9, N - 1));
      if (kind === 0) {
        return {
          q: [`In a fair game ($\\alpha = \\tfrac12$) you start with ${i} units and stop on reaching ${N} or 0. What is the probability of reaching ${N}?`, `公平なゲーム（$\\alpha = \\tfrac12$）で ${i} 単位から始め、${N} か 0 に達したら終わります。${N} に達する確率はいくつですか。`],
          a: { type: 'num', v: i / N, show: frac(i, N) },
          hint: ['In a fair game $h_i$ is linear in $i$, with $h_0 = 0$ and $h_N = 1$.', '公平なゲームでは $h_i$ は $i$ の1次式で、$h_0 = 0$、$h_N = 1$ です。'],
          sol: [[`$h_i = \\tfrac12 h_{i+1} + \\tfrac12 h_{i-1}$ forces equal steps, so $h_i = i/N$.`, `$h_i = \\tfrac12 h_{i+1} + \\tfrac12 h_{i-1}$ から刻みは等しく、$h_i = i/N$ です。`], [`$h_{${i}} = ${frac(i, N)}$. Your fortune is a fair bet, so its expected final value $${N}\\,h_{${i}}$ must equal the ${i} you started with.`, `$h_{${i}} = ${frac(i, N)}$ です。資産は公平な賭けなので、最終値の期待値 $${N}\\,h_{${i}}$ は最初の ${i} に等しくなります。`]],
          set: { alpha: 0.5, fortune: i, goal: N },
        };
      }
      if (kind === 1) {
        return {
          q: [`In a fair game starting from ${i} with goal ${N}, what is the expected number of rounds until the game ends?`, `${i} から始めて目標 ${N} の公平なゲームで、終わるまでの平均ラウンド数はいくつですか。`],
          a: { type: 'int', v: i * (N - i) },
          hint: ['For the fair game the expected duration is $i(N - i)$.', '公平なゲームでの平均継続時間は $i(N - i)$ です。'],
          sol: [[`$D_i = 1 + \\tfrac12 D_{i+1} + \\tfrac12 D_{i-1}$ with $D_0 = D_N = 0$ is solved by $D_i = i(N - i)$.`, `$D_i = 1 + \\tfrac12 D_{i+1} + \\tfrac12 D_{i-1}$、$D_0 = D_N = 0$ の解は $D_i = i(N - i)$ です。`], [`$D_{${i}} = ${i}\\cdot${N - i} = ${i * (N - i)}$: games last longest when you start in the middle.`, `$D_{${i}} = ${i}\\cdot${N - i} = ${i * (N - i)}$ です。真ん中から始めるとゲームは最も長く続きます。`]],
          set: { alpha: 0.5, fortune: i, goal: N },
        };
      }
      return {
        q: [`A fair game starts at ${i} with goal ${N}. What is the probability of ruin (hitting 0 first)?`, `公平なゲームを ${i} から目標 ${N} で始めます。破産する（先に 0 に達する）確率はいくつですか。`],
        a: { type: 'num', v: 1 - i / N, show: frac(N - i, N) },
        hint: ['The game ends with probability 1, so ruin and success are complementary.', 'ゲームは確率 1 で終わるので、破産と成功は余事象の関係です。'],
        sol: [[`$h_{${i}} = ${frac(i, N)}$.`, `$h_{${i}} = ${frac(i, N)}$ です。`], [`Ruin: $1 - ${frac(i, N)} = ${frac(N - i, N)}$, the distance to the goal over the total width.`, `破産：$1 - ${frac(i, N)} = ${frac(N - i, N)}$ で、目標までの距離を全体の幅で割ったものです。`]],
        set: { alpha: 0.5, fortune: i, goal: N },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 2) {
        const a = 18 / 38, i = r.pick([5, 10, 20, 50]), N = 2 * i, rr = (1 - a) / a, h = hWin(a, i, N);
        return {
          q: [`Betting one unit on red in American roulette wins with probability $\\tfrac{18}{38}$. Starting with ${i} units and stopping at ${N} or 0, what is the probability of doubling your money? Four decimals.`, `アメリカン・ルーレットで赤に1単位賭けると、確率 $\\tfrac{18}{38}$ で勝ちます。${i} 単位から始め、${N} か 0 でやめるとき、資金を倍にできる確率を小数第4位まで求めてください。`],
          a: { type: 'num', v: h, tol: 6e-5 },
          hint: ['Use $h_i = (1 - r^i)/(1 - r^N)$ with $r = (1 - \\alpha)/\\alpha = 20/18$.', '$r = (1 - \\alpha)/\\alpha = 20/18$ として $h_i = (1 - r^i)/(1 - r^N)$ を使います。'],
          sol: [[`$r = 20/18 = ${n(rr, 5)}$.`, `$r = 20/18 = ${n(rr, 5)}$ です。`], [`$h_{${i}} = \\dfrac{1 - r^{${i}}}{1 - r^{${N}}} = \\dfrac{1 - ${n(rr ** i, 5)}}{1 - ${n(rr ** N, 5)}} = ${n(h, 5)}$.`, `$h_{${i}} = \\dfrac{1 - r^{${i}}}{1 - r^{${N}}} = \\dfrac{1 - ${n(rr ** i, 5)}}{1 - ${n(rr ** N, 5)}} = ${n(h, 5)}$ です。`], [`A house edge of about 5% per bet compounds: the more rounds the game needs, the worse your chance, which is why bold play beats timid play in an unfair game.`, `1回あたり約5%の控除が積み重なります。必要なラウンドが多いほど勝つ確率は下がるので、不利なゲームでは少しずつ賭けるより大きく賭けるほうがましなのです。`]],
        };
      }
      let a; do { a = r.step(0.3, 0.7, 0.05); } while (Math.abs(a - 0.5) < 1e-9);
      const N = r.int(4, 12), i = r.int(1, Math.min(9, N - 1)), rr = (1 - a) / a, h = hWin(a, i, N);
      if (kind === 0) {
        return {
          q: [`Each round wins one unit with probability $\\alpha = ${n(a)}$. Starting from $i = ${i}$ with goal $N = ${N}$, find the probability of reaching $N$ before 0, to four decimals.`, `各ラウンドで確率 $\\alpha = ${n(a)}$ で1単位勝ちます。$i = ${i}$ から始めて目標 $N = ${N}$ のとき、0 より先に $N$ に達する確率を小数第4位まで求めてください。`],
          a: { type: 'num', v: h, tol: 6e-5 },
          hint: ['Try $h_i = A + B r^i$ in the recursion, with $r = (1 - \\alpha)/\\alpha$.', '漸化式に $h_i = A + B r^i$（$r = (1 - \\alpha)/\\alpha$）を代入してみてください。'],
          sol: [[`$r = ${n(1 - a)}/${n(a)} = ${n(rr, 5)}$; the boundary conditions give $h_i = (1 - r^i)/(1 - r^N)$.`, `$r = ${n(1 - a)}/${n(a)} = ${n(rr, 5)}$ で、境界条件から $h_i = (1 - r^i)/(1 - r^N)$ です。`], [`$h_{${i}} = \\dfrac{1 - ${n(rr ** i, 5)}}{1 - ${n(rr ** N, 5)}} = ${n(h, 5)}$.`, `$h_{${i}} = \\dfrac{1 - ${n(rr ** i, 5)}}{1 - ${n(rr ** N, 5)}} = ${n(h, 5)}$ です。`], [`Compare the fair-game value $${frac(i, N)} = ${n(i / N, 4)}$: a small edge per round becomes a large edge per game.`, `公平なゲームの値 $${frac(i, N)} = ${n(i / N, 4)}$ と比べると、1回ごとの小さな有利不利が、ゲーム全体では大きな差になります。`]],
          set: { alpha: a, fortune: i, goal: N },
        };
      }
      const pW = a, qL = 1 - a, D = i / (qL - pW) - N / (qL - pW) * (1 - rr ** i) / (1 - rr ** N);
      return {
        q: [`With win probability $\\alpha = ${n(a)}$, start $i = ${i}$ and goal $N = ${N}$, what is the expected number of rounds until the game ends? Two decimals.`, `勝率 $\\alpha = ${n(a)}$、初期資産 $i = ${i}$、目標 $N = ${N}$ のとき、ゲームが終わるまでの平均ラウンド数を小数第2位まで求めてください。`],
        a: { type: 'num', v: D, tol: 0.006 },
        hint: ['$D_i = \\dfrac{i}{q - p} - \\dfrac{N}{q - p}\\cdot\\dfrac{1 - r^i}{1 - r^N}$, with $p = \\alpha$, $q = 1 - \\alpha$, $r = q/p$.', '$p = \\alpha$、$q = 1 - \\alpha$、$r = q/p$ として $D_i = \\dfrac{i}{q - p} - \\dfrac{N}{q - p}\\cdot\\dfrac{1 - r^i}{1 - r^N}$ です。'],
        sol: [[`$q - p = ${n(qL - pW)}$ and $h_{${i}} = (1 - r^{${i}})/(1 - r^{${N}}) = ${n(h, 5)}$.`, `$q - p = ${n(qL - pW)}$、$h_{${i}} = (1 - r^{${i}})/(1 - r^{${N}}) = ${n(h, 5)}$ です。`], [`$D_{${i}} = (${i} - ${N}\\cdot${n(h, 5)})/${pn(qL - pW)} = ${n(D, 4)}$.`, `$D_{${i}} = (${i} - ${N}\\cdot${n(h, 5)})/${pn(qL - pW)} = ${n(D, 4)}$ です。`], [`This is Wald's identity: the expected final fortune minus the start equals the drift $(p - q)$ times the expected number of rounds. The fair game would last $${i * (N - i)}$ rounds.`, `これはワルドの等式です。最終資産の期待値と初期資産の差は、ドリフト $(p - q)$ と平均ラウンド数の積に等しくなります。公平なゲームなら $${i * (N - i)}$ ラウンド続きます。`]],
        set: { alpha: a, fortune: i, goal: N },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.pick([3, 4]);
        const v = N === 3 ? 'a^2/(1-a+a^2)' : 'a^2/(a^2+(1-a)^2)', i = N === 3 ? 1 : 2;
        return {
          q: [`Goal $N = ${N}$, start $i = ${i}$. Write the probability of reaching $N$ before 0 as a function of the win probability $a$.`, `目標 $N = ${N}$、初期資産 $i = ${i}$ です。0 より先に $N$ に達する確率を、勝率 $a$ の式で表してください。`],
          a: { type: 'expr', v, vars: ['a'], dom: { a: [0.1, 0.9] }, lhs: [`$h_${i}(a) =$`, `$h_${i}(a) =$`] },
          hint: ['Simplify $(1 - r^i)/(1 - r^N)$ with $r = (1 - a)/a$, or set up first-step equations directly.', '$r = (1 - a)/a$ として $(1 - r^i)/(1 - r^N)$ を簡単にするか、1ステップ目で場合分けした方程式を直接立てます。'],
          sol: N === 3 ? [['First-step analysis: $h_1 = a h_2$ and $h_2 = a + (1 - a) h_1$.', '1ステップ目で場合分けすると $h_1 = a h_2$、$h_2 = a + (1 - a) h_1$ です。'], ['$h_1 = a^2 + a(1 - a)h_1$, so $h_1 = \\dfrac{a^2}{1 - a + a^2}$.', '$h_1 = a^2 + a(1 - a)h_1$ より $h_1 = \\dfrac{a^2}{1 - a + a^2}$ です。'], ['At $a = \\tfrac12$ this is $\\tfrac13 = i/N$, as the fair formula says.', '$a = \\tfrac12$ では $\\tfrac13 = i/N$ となり、公平なゲームの式と一致します。']] : [['$(1 - r^2)/(1 - r^4) = 1/(1 + r^2)$ with $r = (1 - a)/a$.', '$r = (1 - a)/a$ として $(1 - r^2)/(1 - r^4) = 1/(1 + r^2)$ です。'], ['$h_2 = \\dfrac{a^2}{a^2 + (1 - a)^2}$.', '$h_2 = \\dfrac{a^2}{a^2 + (1 - a)^2}$ です。'], ['Starting in the middle, the odds of winning are $a^2 : (1 - a)^2$: you must win two rounds net before losing two.', '真ん中から始めると、勝つオッズは $a^2 : (1 - a)^2$ です。2回負け越す前に2回勝ち越す必要があるからです。']],
          set: N >= 4 ? { goal: N, fortune: i } : undefined,
        };
      }
      if (kind === 1) {
        const a = r.step(0.55, 0.8, 0.05), i = r.int(1, 9), rr = (1 - a) / a;
        return {
          q: [`You play against an infinitely rich opponent, winning each round with probability $\\alpha = ${n(a)}$. Starting with ${i} units, what is the probability you are ever ruined? Four decimals.`, `無限の資金を持つ相手と勝負し、各ラウンドに確率 $\\alpha = ${n(a)}$ で勝ちます。${i} 単位から始めるとき、いつか破産する確率を小数第4位まで求めてください。`],
          a: { type: 'num', v: rr ** i, tol: 6e-5 },
          hint: ['Let $N \\to \\infty$ in $1 - h_i = (r^i - r^N)/(1 - r^N)$; here $r < 1$.', '$1 - h_i = (r^i - r^N)/(1 - r^N)$ で $N \\to \\infty$ とします。ここでは $r < 1$ です。'],
          sol: [[`$r = ${n(1 - a)}/${n(a)} = ${n(rr, 5)} < 1$, so $r^N \\to 0$.`, `$r = ${n(1 - a)}/${n(a)} = ${n(rr, 5)} < 1$ なので $r^N \\to 0$ です。`], [`Ruin probability $r^{${i}} = ${n(rr ** i, 5)}$.`, `破産確率は $r^{${i}} = ${n(rr ** i, 5)}$ です。`], ['With a favourable edge you survive forever with positive probability; with a fair or unfavourable game ruin would be certain.', '有利なら確率は正のまま永遠に生き残れます。公平か不利なら破産は確実です。']],
          set: { alpha: a, fortune: i, goal: 12 },
        };
      }
      let a, N, target, i;
      do {
        do { a = r.step(0.35, 0.65, 0.05); } while (Math.abs(a - 0.5) < 1e-9);
        N = r.int(6, 12); target = r.pick([0.5, 0.75, 0.9, 0.25]);
        i = 1; while (i < N && hWin(a, i, N) < target) i++;
      } while (i >= N || i > 9 || i < 2);
      return {
        q: [`Win probability $\\alpha = ${n(a)}$, goal $N = ${N}$. What is the smallest starting fortune $i$ that gives at least a ${n(target * 100)}% chance of reaching $N$ before 0?`, `勝率 $\\alpha = ${n(a)}$、目標 $N = ${N}$ です。0 より先に $N$ に達する確率を ${n(target * 100)}% 以上にする最小の初期資産 $i$ はいくつですか。`],
        a: { type: 'int', v: i },
        hint: ['$h_i$ increases with $i$; evaluate it near where you expect the crossing.', '$h_i$ は $i$ について増加します。交差しそうなあたりで値を計算してください。'],
        sol: [[`With $r = ${n((1 - a) / a, 4)}$: $h_{${i - 1}} = ${n(hWin(a, i - 1, N), 4)}$ and $h_{${i}} = ${n(hWin(a, i, N), 4)}$.`, `$r = ${n((1 - a) / a, 4)}$ で $h_{${i - 1}} = ${n(hWin(a, i - 1, N), 4)}$、$h_{${i}} = ${n(hWin(a, i, N), 4)}$ です。`], [`So $i = ${i}$. ${a < 0.5 ? `Against the odds you need to start well past the midpoint ${N / 2}.` : `With the odds in your favour you can start below the midpoint ${N / 2}.`}`, `したがって $i = ${i}$ です。${a < 0.5 ? `不利なゲームでは中点 ${N / 2} よりかなり上から始める必要があります。` : `有利なゲームでは中点 ${N / 2} より下から始めても届きます。`}`]],
        set: { alpha: a, fortune: i, goal: N },
      };
    },
  ];
})();
