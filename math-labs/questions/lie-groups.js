'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, mat, sig } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, dg = (r) => r * 180 / PI;

  /* small linear algebra, from first principles */
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const l = len(a); return a.map((x) => x / l); };
  const mm = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const mv = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const hat = (w) => [[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]];
  // Rodrigues: R v = v cos t + (n x v) sin t + n (n . v)(1 - cos t)
  const rodv = (nn, t, v) => { const c = Math.cos(t), s = Math.sin(t), nv = cross(nn, v), d = dot(nn, v); return [0, 1, 2].map((i) => v[i] * c + nv[i] * s + nn[i] * d * (1 - c)); };
  const rot = (nn, t) => { const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => rodv(nn, t, e)); return [0, 1, 2].map((i) => [0, 1, 2].map((j) => cols[j][i])); };
  const cl = (x) => (Math.abs(x) < 5e-13 ? 0 : x);
  const vec = (v, d = 3) => `(${v.map((x) => n(cl(x), d)).join(',\\ ')})`;
  const AX = [
    { v: [1, 0, 0], tex: '\\mathbf e_x', en: 'the $x$ axis', ja: '$x$ 軸' },
    { v: [0, 1, 0], tex: '\\mathbf e_y', en: 'the $y$ axis', ja: '$y$ 軸' },
    { v: [0, 0, 1], tex: '\\mathbf e_z', en: 'the $z$ axis', ja: '$z$ 軸' },
  ];
  const DIAG = [
    { v: unit([1, 1, 0]), tex: '\\tfrac{1}{\\sqrt2}(1, 1, 0)', en: 'the axis $\\tfrac{1}{\\sqrt2}(1, 1, 0)$', ja: '軸 $\\tfrac{1}{\\sqrt2}(1, 1, 0)$' },
    { v: unit([1, 1, 1]), tex: '\\tfrac{1}{\\sqrt3}(1, 1, 1)', en: 'the axis $\\tfrac{1}{\\sqrt3}(1, 1, 1)$', ja: '軸 $\\tfrac{1}{\\sqrt3}(1, 1, 1)$' },
  ];
  const TRACE_TEX = { 0: '3', 30: '1 + \\sqrt3', 45: '1 + \\sqrt2', 60: '2', 90: '1', 120: '0', 135: '1 - \\sqrt2', 150: '1 - \\sqrt3', 180: '-1' };
  const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };

  /* ---------- 1. the exponential map ---------- */
  Q['exp-map'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([30, 45, 60, 90, 100, 120, 135, 150, 180, 210, 240, 300, 330]);
        const tr = 1 + 2 * Math.cos(rad(th));
        return {
          q: [`A rotation $R = e^{\\theta K}$ turns space by $\\theta = ${th}^\\circ$ about a unit axis. What is its trace $\\operatorname{tr} R$? Give three decimals.`, `回転 $R = e^{\\theta K}$ は単位軸のまわりに $\\theta = ${th}^\\circ$ 回します。トレース $\\operatorname{tr} R$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: tr, tol: 0.002 },
          hint: ['In a basis with the axis as the third vector, $R$ is a $2\\times2$ rotation block and a $1$.', '軸を第3基底にとると、$R$ は $2\\times2$ の回転ブロックと $1$ からなります。'],
          sol: [[`The axis is fixed (eigenvalue $1$) and the plane across it turns by $\\theta$ (diagonal entries $\\cos\\theta$, $\\cos\\theta$), so $\\operatorname{tr} R = 1 + 2\\cos\\theta$.`, `軸は動かず（固有値 $1$）、それに垂直な平面が $\\theta$ だけ回る（対角成分 $\\cos\\theta$ が2つ）ので、$\\operatorname{tr} R = 1 + 2\\cos\\theta$ です。`], [`$1 + 2\\cos ${th}^\\circ = ${n(tr, 4)}$. The trace does not depend on the axis, only on the angle.`, `$1 + 2\\cos ${th}^\\circ = ${n(tr, 4)}$ です。トレースは軸によらず、角度だけで決まります。`]],
          set: { theta: th },
        };
      }
      if (form === 1) {
        const th = r.pick([30, 45, 60, 90, 120, 135, 150, 180]);
        return {
          q: [`A rotation matrix has $\\operatorname{tr} R = ${TRACE_TEX[th]}$. What is its rotation angle $\\theta \\in [0^\\circ, 180^\\circ]$, in degrees?`, `回転行列のトレースが $\\operatorname{tr} R = ${TRACE_TEX[th]}$ です。回転角 $\\theta \\in [0^\\circ, 180^\\circ]$ を度で答えてください。`],
          a: { type: 'num', v: th, tol: 0.5, unit: ['°', '°'] },
          hint: ['Solve $1 + 2\\cos\\theta = \\operatorname{tr} R$ for $\\cos\\theta$.', '$1 + 2\\cos\\theta = \\operatorname{tr} R$ を $\\cos\\theta$ について解きます。'],
          sol: [[`$\\cos\\theta = (\\operatorname{tr} R - 1)/2 = ${n(Math.cos(rad(th)), 4)}$.`, `$\\cos\\theta = (\\operatorname{tr} R - 1)/2 = ${n(Math.cos(rad(th)), 4)}$ です。`], [`So $\\theta = ${th}^\\circ$. The trace fixes the angle up to sign; the sign is the sense of turning about the chosen axis direction, which the trace cannot see.`, `よって $\\theta = ${th}^\\circ$ です。トレースは角度を符号を除いて決めます。符号は軸の向きに対する回る向きで、トレースからは分かりません。`]],
          set: { theta: th },
        };
      }
      const ax = r.pick(AX), v = [r.nz(-3, 3), r.int(-3, 3), r.nz(-3, 3)], Kv = cross(ax.v, v);
      return {
        q: [`$K = \\hat{\\mathbf n}$ is the skew matrix of the unit axis $\\mathbf n = ${ax.tex}$. For $\\mathbf v = ${vec(v)}$, compute $K\\mathbf v$.`, `$K = \\hat{\\mathbf n}$ は単位軸 $\\mathbf n = ${ax.tex}$ の反対称行列です。$\\mathbf v = ${vec(v)}$ に対して $K\\mathbf v$ を計算してください。`],
        a: { type: 'tuple', v: Kv, labels: ['$x$', '$y$', '$z$'], tol: 1e-6 },
        hint: ['The skew matrix of $\\mathbf n$ is built so that $K\\mathbf v = \\mathbf n \\times \\mathbf v$.', '$\\mathbf n$ の反対称行列は $K\\mathbf v = \\mathbf n \\times \\mathbf v$ となるように作られています。'],
        sol: [[`$K = ${mat(hat(ax.v), 'pmatrix', 0)}$, and $K\\mathbf v = \\mathbf n \\times \\mathbf v$.`, `$K = ${mat(hat(ax.v), 'pmatrix', 0)}$ で、$K\\mathbf v = \\mathbf n \\times \\mathbf v$ です。`], [`$${ax.tex} \\times ${vec(v)} = ${vec(Kv)}$: the velocity of the point $\\mathbf v$ when space turns about $\\mathbf n$ at unit rate. It is perpendicular to both.`, `$${ax.tex} \\times ${vec(v)} = ${vec(Kv)}$ です。これは空間が $\\mathbf n$ のまわりに単位の速さで回るときの点 $\\mathbf v$ の速度で、両方に垂直です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const ax = r.chance(0.6) ? r.pick(AX) : r.pick(DIAG), th = r.pick([30, 45, 60, 90, 120, 135, 150, 180, 240, 270]);
        let v; do { v = [r.int(-2, 3), r.int(-2, 3), r.int(-2, 3)]; } while (len(cross(ax.v, v)) < 0.5);
        const Rv = rodv(ax.v, rad(th), v), nv = cross(ax.v, v), d = dot(ax.v, v);
        return {
          q: [`Rotate $\\mathbf v = ${vec(v)}$ by $\\theta = ${th}^\\circ$ about ${ax.en} (right-hand rule). Give $R\\mathbf v$ to three decimals.`, `$\\mathbf v = ${vec(v)}$ を ${ax.ja}のまわりに $\\theta = ${th}^\\circ$ 回転させます（右ねじの向き）。$R\\mathbf v$ を小数第3位まで求めてください。`],
          a: { type: 'tuple', v: Rv, labels: ['$x$', '$y$', '$z$'], tol: 0.002 },
          hint: ['Rodrigues: $R\\mathbf v = \\mathbf v\\cos\\theta + (\\mathbf n\\times\\mathbf v)\\sin\\theta + \\mathbf n(\\mathbf n\\cdot\\mathbf v)(1 - \\cos\\theta)$.', 'ロドリゲスの公式 $R\\mathbf v = \\mathbf v\\cos\\theta + (\\mathbf n\\times\\mathbf v)\\sin\\theta + \\mathbf n(\\mathbf n\\cdot\\mathbf v)(1 - \\cos\\theta)$ を使います。'],
          sol: [[`$\\mathbf n \\times \\mathbf v = ${vec(nv)}$ and $\\mathbf n \\cdot \\mathbf v = ${n(d, 4)}$.`, `$\\mathbf n \\times \\mathbf v = ${vec(nv)}$、$\\mathbf n \\cdot \\mathbf v = ${n(d, 4)}$ です。`], [`With $\\cos\\theta = ${n(Math.cos(rad(th)), 4)}$ and $\\sin\\theta = ${n(Math.sin(rad(th)), 4)}$, $R\\mathbf v = ${vec(Rv)}$.`, `$\\cos\\theta = ${n(Math.cos(rad(th)), 4)}$、$\\sin\\theta = ${n(Math.sin(rad(th)), 4)}$ より $R\\mathbf v = ${vec(Rv)}$ です。`], [`Check: $|R\\mathbf v| = ${n(len(Rv), 4)} = |\\mathbf v|$, and the component along the axis, $${n(d, 4)}$, is unchanged. This closed form is the whole series $e^{\\theta K}$ summed.`, `確認：$|R\\mathbf v| = ${n(len(Rv), 4)} = |\\mathbf v|$ で、軸方向の成分 $${n(d, 4)}$ は変わりません。この閉じた式は級数 $e^{\\theta K}$ の和そのものです。`]],
        };
      }
      if (form === 1) {
        const base = r.pick([[0, 0, 1], [1, 2, 2], [2, 3, 6], [0, 3, 4], [2, 1, 2], [1, 4, 8]]), s = r.pick([0.25, 0.5, 1, 1.5]);
        const w = r.shuffle(base).map((x) => x * r.sign() * s), th = len(w);
        return {
          q: [`Let $A = ${mat(hat(w), 'pmatrix', 3)}$. The exponential $e^{A}$ is a rotation. What is its angle, in radians?`, `$A = ${mat(hat(w), 'pmatrix', 3)}$ とします。指数関数 $e^{A}$ は回転です。その回転角をラジアンで答えてください。`],
          a: { type: 'num', v: th, tol: 0.002 },
          hint: ['Read off the vector $\\boldsymbol\\omega$ with $A = \\hat{\\boldsymbol\\omega}$, then write $A = \\theta K$ with $K$ the skew matrix of a unit vector.', '$A = \\hat{\\boldsymbol\\omega}$ となるベクトル $\\boldsymbol\\omega$ を読み取り、単位ベクトルの反対称行列 $K$ を使って $A = \\theta K$ と書きます。'],
          sol: [[`$A = \\hat{\\boldsymbol\\omega}$ with $\\boldsymbol\\omega = (A_{32}, A_{13}, A_{21}) = ${vec(w)}$.`, `$A = \\hat{\\boldsymbol\\omega}$ で、$\\boldsymbol\\omega = (A_{32}, A_{13}, A_{21}) = ${vec(w)}$ です。`], [`$A = \\theta K$ with $\\theta = |\\boldsymbol\\omega| = ${n(th, 4)}$ and $K$ the skew matrix of $\\boldsymbol\\omega/|\\boldsymbol\\omega|$.`, `$\\theta = |\\boldsymbol\\omega| = ${n(th, 4)}$、$K$ を $\\boldsymbol\\omega/|\\boldsymbol\\omega|$ の反対称行列として $A = \\theta K$ です。`], [`So $e^{A}$ turns by $${n(th, 4)}$ rad $= ${n(dg(th), 2)}^\\circ$ about $\\boldsymbol\\omega$: the Lie algebra element is an axis times an angle.`, `よって $e^{A}$ は $\\boldsymbol\\omega$ のまわりに $${n(th, 4)}$ rad $= ${n(dg(th), 2)}^\\circ$ 回ります。リー代数の元は「軸 × 角度」なのです。`]],
        };
      }
      let th, k, t, N;
      do { th = r.pick([60, 90, 120, 150, 180, 240, 300, 360]); k = r.pick([3, 4, 6, 8]); t = rad(th); N = 0; while (t ** N / fact(N) >= 10 ** -k) N++; } while (N > 16);
      return {
        q: [`The partial sum $S_N = \\sum_{m=0}^{N-1} (\\theta K)^m/m!$ uses $N$ terms. For $\\theta = ${th}^\\circ$, what is the smallest $N$ for which the first omitted term has norm $\\theta^N/N! < 10^{-${k}}$? (For a unit axis, $\\|K\\| = 1$.)`, `部分和 $S_N = \\sum_{m=0}^{N-1} (\\theta K)^m/m!$ は $N$ 項を使います。$\\theta = ${th}^\\circ$ のとき、最初に省いた項のノルム $\\theta^N/N!$ が $10^{-${k}}$ 未満になる最小の $N$ はいくつですか（単位軸では $\\|K\\| = 1$）。`],
        a: { type: 'int', v: N },
        hint: ['Convert $\\theta$ to radians and tabulate $\\theta^N/N!$; each term is the previous one times $\\theta/N$.', '$\\theta$ をラジアンに直して $\\theta^N/N!$ を順に計算します。各項は前の項に $\\theta/N$ を掛けたものです。'],
        sol: [[`$\\theta = ${n(t, 4)}$ rad.`, `$\\theta = ${n(t, 4)}$ rad です。`], [`$\\theta^{${N - 1}}/${N - 1}! = ${sig(t ** (N - 1) / fact(N - 1), 3)}$ is still too big, while $\\theta^{${N}}/${N}! = ${sig(t ** N / fact(N), 3)} < 10^{-${k}}$.`, `$\\theta^{${N - 1}}/${N - 1}! = ${sig(t ** (N - 1) / fact(N - 1), 3)}$ ではまだ大きく、$\\theta^{${N}}/${N}! = ${sig(t ** N / fact(N), 3)} < 10^{-${k}}$ です。`], [`So $N = ${N}$. The terms first grow while $m < \\theta$ and only then fall factorially, which is why larger angles need more terms.`, `よって $N = ${N}$ です。項は $m < \\theta$ の間は大きくなり、その後で階乗的に小さくなります。角度が大きいほど多くの項が必要なのはこのためです。`]],
        set: { theta: th, terms: N },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([2, 3]), th = r.pick([30, 45, 60, 90, 120, 150, 180]), t = rad(th);
        const val = N === 2 ? Math.sqrt(1 + 0.75 * t * t) : Math.sqrt(0.25 + 0.75 * ((1 - t * t / 2) ** 2 + t * t));
        return {
          q: [`In the figure the point $\\mathbf v$ is a unit vector at $60^\\circ$ to the axis, so $|\\mathbf n \\times \\mathbf v| = \\tfrac{\\sqrt3}{2}$. With only $N = ${N}$ terms of the series and $\\theta = ${th}^\\circ$, how long is $S_${N}\\mathbf v$? Give three decimals.`, `図の点 $\\mathbf v$ は軸と $60^\\circ$ をなす単位ベクトルで、$|\\mathbf n \\times \\mathbf v| = \\tfrac{\\sqrt3}{2}$ です。級数を $N = ${N}$ 項だけ使い $\\theta = ${th}^\\circ$ とするとき、$S_${N}\\mathbf v$ の長さはいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: val, tol: 0.002 },
          hint: [N === 2 ? '$S_2\\mathbf v = \\mathbf v + \\theta\\,\\mathbf n\\times\\mathbf v$, and the two pieces are perpendicular.' : 'Split $\\mathbf v$ into its parts along and across the axis; $K^2$ acts as $-1$ on the part across it.', N === 2 ? '$S_2\\mathbf v = \\mathbf v + \\theta\\,\\mathbf n\\times\\mathbf v$ で、2つの部分は直交します。' : '$\\mathbf v$ を軸方向と軸に垂直な成分に分けます。$K^2$ は垂直な成分に $-1$ として働きます。'],
          sol: N === 2
            ? [[`$S_2 = I + \\theta K$, so $S_2\\mathbf v = \\mathbf v + \\theta\\,(\\mathbf n \\times \\mathbf v)$, a sum of perpendicular vectors.`, `$S_2 = I + \\theta K$ なので $S_2\\mathbf v = \\mathbf v + \\theta\\,(\\mathbf n \\times \\mathbf v)$ で、直交するベクトルの和です。`], [`$|S_2\\mathbf v|^2 = 1 + \\theta^2\\cdot\\tfrac34$ with $\\theta = ${n(t, 4)}$, so $|S_2\\mathbf v| = ${n(val, 4)}$.`, `$\\theta = ${n(t, 4)}$ として $|S_2\\mathbf v|^2 = 1 + \\theta^2\\cdot\\tfrac34$、よって $|S_2\\mathbf v| = ${n(val, 4)}$ です。`], ['A true rotation keeps length $1$; the truncated series always stretches, so it is not in the group.', '本当の回転なら長さは $1$ のままです。打ち切った級数は必ず伸ばすので、群の元ではありません。']]
            : [[`Write $\\mathbf v = \\mathbf v_\\parallel + \\mathbf v_\\perp$ with $|\\mathbf v_\\parallel|^2 = \\tfrac14$, $|\\mathbf v_\\perp|^2 = \\tfrac34$. Then $K\\mathbf v_\\perp = \\mathbf n\\times\\mathbf v_\\perp$ and $K^2\\mathbf v_\\perp = -\\mathbf v_\\perp$, while $K\\mathbf v_\\parallel = 0$.`, `$\\mathbf v = \\mathbf v_\\parallel + \\mathbf v_\\perp$ と分けると $|\\mathbf v_\\parallel|^2 = \\tfrac14$、$|\\mathbf v_\\perp|^2 = \\tfrac34$ です。$K\\mathbf v_\\perp = \\mathbf n\\times\\mathbf v_\\perp$、$K^2\\mathbf v_\\perp = -\\mathbf v_\\perp$、$K\\mathbf v_\\parallel = 0$ です。`], [`$S_3\\mathbf v = \\mathbf v_\\parallel + (1 - \\theta^2/2)\\mathbf v_\\perp + \\theta\\,\\mathbf n\\times\\mathbf v_\\perp$, so $|S_3\\mathbf v|^2 = \\tfrac14 + \\tfrac34\\big((1 - \\theta^2/2)^2 + \\theta^2\\big)$.`, `$S_3\\mathbf v = \\mathbf v_\\parallel + (1 - \\theta^2/2)\\mathbf v_\\perp + \\theta\\,\\mathbf n\\times\\mathbf v_\\perp$ なので $|S_3\\mathbf v|^2 = \\tfrac14 + \\tfrac34\\big((1 - \\theta^2/2)^2 + \\theta^2\\big)$ です。`], [`With $\\theta = ${n(t, 4)}$: $|S_3\\mathbf v| = ${n(val, 4)}$. The bracket is $1 + \\theta^4/4$, so the stretch is now fourth order in $\\theta$: each extra term pushes the error further out.`, `$\\theta = ${n(t, 4)}$ で $|S_3\\mathbf v| = ${n(val, 4)}$ です。括弧の中は $1 + \\theta^4/4$ なので伸びは $\\theta$ の4次になり、項を足すごとに誤差が高次へ押しやられます。`]],
          set: { theta: th, terms: N },
        };
      }
      if (form === 1) {
        const N = r.pick([4, 5, 6, 7]), entry = r.int(0, 1);
        // axis z: K e_x = e_y, so the (1,1) entry is the series of cos and the (2,1) entry the series of sin
        const parts = [];
        for (let m = 0; m < N; m++) {
          if (entry === 0 && m % 2 === 0) parts.push(`${(m / 2) % 2 ? '-' : '+'}theta^${m}/${fact(m)}`);
          if (entry === 1 && m % 2 === 1) parts.push(`${((m - 1) / 2) % 2 ? '-' : '+'}theta^${m}/${fact(m)}`);
        }
        const ans = parts.join('').replace(/^\+/, '').replace('theta^0/1', '1').replace('theta^1/1', 'theta');
        const name = entry === 0 ? '(1,1)' : '(2,1)', fn = entry === 0 ? '\\cos\\theta' : '\\sin\\theta';
        return {
          q: [`Take the axis $\\mathbf n = \\mathbf e_z$. Write the ${name} entry of the partial sum $S_${N} = \\sum_{m=0}^{${N - 1}} (\\theta K)^m/m!$ as a polynomial in $\\theta$.`, `軸を $\\mathbf n = \\mathbf e_z$ とします。部分和 $S_${N} = \\sum_{m=0}^{${N - 1}} (\\theta K)^m/m!$ の ${name} 成分を $\\theta$ の多項式で表してください。`],
          a: { type: 'expr', v: ans, vars: ['theta'], dom: { theta: [-2, 2] }, lhs: [`$(S_${N})_{${name.slice(1, -1)}} =$`, `$(S_${N})_{${name.slice(1, -1)}} =$`] },
          hint: ['Follow $\\mathbf e_x$: $K\\mathbf e_x = \\mathbf e_y$ and $K\\mathbf e_y = -\\mathbf e_x$, so the powers of $K$ cycle with period four.', '$\\mathbf e_x$ を追いかけます。$K\\mathbf e_x = \\mathbf e_y$、$K\\mathbf e_y = -\\mathbf e_x$ なので、$K$ のべきは周期4で循環します。'],
          sol: [['$K\\mathbf e_x = \\mathbf e_y$, $K^2\\mathbf e_x = -\\mathbf e_x$, $K^3\\mathbf e_x = -\\mathbf e_y$, $K^4\\mathbf e_x = \\mathbf e_x$.', '$K\\mathbf e_x = \\mathbf e_y$、$K^2\\mathbf e_x = -\\mathbf e_x$、$K^3\\mathbf e_x = -\\mathbf e_y$、$K^4\\mathbf e_x = \\mathbf e_x$ です。'], [`So the ${entry === 0 ? '$x$' : '$y$'} component of $S_${N}\\mathbf e_x$ collects the ${entry === 0 ? 'even' : 'odd'} powers below $${N}$ with alternating signs: $${P.toTeX(P.parse(ans, ['theta']))}$.`, `よって $S_${N}\\mathbf e_x$ の ${entry === 0 ? '$x$' : '$y$'} 成分は、$${N}$ 未満の${entry === 0 ? '偶数' : '奇数'}次のべきを交互の符号で集めたもので、$${P.toTeX(P.parse(ans, ['theta']))}$ です。`], [`This is the Taylor polynomial of $${fn}$: summing all terms gives the exact rotation, which is Rodrigues' formula.`, `これは $${fn}$ のテイラー多項式です。すべての項を足すと厳密な回転、つまりロドリゲスの公式になります。`]],
          set: { terms: N, tilt: 0 },
        };
      }
      const ax = r.chance(0.5) ? r.pick(AX) : r.pick(DIAG), th = r.pick(ax === DIAG[1] ? [60, 120, 90, 180] : [60, 90, 120, 135, 150, 180]);
      const R = rot(ax.v, rad(th)), tr = R[0][0] + R[1][1] + R[2][2];
      const angle = dg(Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))));
      const sk = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]];
      return {
        q: [`The matrix $R = ${mat(R.map((row) => row.map(cl)), 'pmatrix', 3)}$ is a rotation. Find its angle $\\theta \\in [0^\\circ, 180^\\circ]$ in degrees.`, `行列 $R = ${mat(R.map((row) => row.map(cl)), 'pmatrix', 3)}$ は回転です。回転角 $\\theta \\in [0^\\circ, 180^\\circ]$ を度で求めてください。`],
        a: { type: 'num', v: angle, tol: 0.5, unit: ['°', '°'] },
        hint: ['The trace gives the angle; the antisymmetric part $R - R^{\\mathsf T}$ gives the axis.', 'トレースから角度が、反対称部分 $R - R^{\\mathsf T}$ から軸が分かります。'],
        sol: [[`$\\operatorname{tr} R = ${n(tr, 4)} = 1 + 2\\cos\\theta$, so $\\cos\\theta = ${n((tr - 1) / 2, 4)}$ and $\\theta = ${n(angle, 2)}^\\circ$.`, `$\\operatorname{tr} R = ${n(tr, 4)} = 1 + 2\\cos\\theta$ より $\\cos\\theta = ${n((tr - 1) / 2, 4)}$、$\\theta = ${n(angle, 2)}^\\circ$ です。`], [th === 180 ? `At $180^\\circ$ the antisymmetric part vanishes and the axis is read from $R + I$ instead: its columns are multiples of $${ax.tex}$.` : `$R - R^{\\mathsf T} = 2\\sin\\theta\\,K$ gives $(R_{32} - R_{23}, R_{13} - R_{31}, R_{21} - R_{12}) = ${vec(sk)}$, a multiple of $${ax.tex}$.`, th === 180 ? `$180^\\circ$ では反対称部分が 0 になるので、代わりに $R + I$ から軸を読みます。その列は $${ax.tex}$ の定数倍です。` : `$R - R^{\\mathsf T} = 2\\sin\\theta\\,K$ より $(R_{32} - R_{23}, R_{13} - R_{31}, R_{21} - R_{12}) = ${vec(sk)}$ で、これは $${ax.tex}$ の定数倍です。`], ['So the logarithm of $R$ is $\\theta K$ with that axis: every rotation is the exponential of a skew matrix.', 'よって $R$ の対数は、その軸についての $\\theta K$ です。どの回転も反対称行列の指数関数なのです。']],
        set: { theta: th },
      };
    },
  ];

  /* ---------- 2. the double cover ---------- */
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const quat = (nn, t) => [Math.cos(t / 2), ...nn.map((x) => Math.sin(t / 2) * x)];
  const qtex = (q) => {
    const parts = [[q[0], ''], [q[1], '\\mathbf i'], [q[2], '\\mathbf j'], [q[3], '\\mathbf k']].filter(([c]) => Math.abs(c) > 1e-12);
    if (!parts.length) return '0';
    return parts.map(([c, u], i) => { const s = c < 0 ? '-' : i ? '+' : ''; const m = Math.abs(c); return `${i ? ' ' : ''}${s}${i && s ? ' ' : ''}${u && Math.abs(m - 1) < 1e-12 ? '' : n(m, 4)}${u}`; }).join('');
  };
  Q['double-cover'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const th = r.pick([60, 90, 120, 180, 240, 270, 300, 360, 420, 480, 540, 600, 630, 720]), w = Math.cos(rad(th) / 2);
        return {
          q: [`The block has turned through $\\theta = ${th}^\\circ$ about a fixed axis. What is the real part $\\cos(\\theta/2)$ of the unit quaternion $q(\\theta)$ that the path has reached? Give three decimals.`, `ブロックが固定軸のまわりに $\\theta = ${th}^\\circ$ 回りました。経路が到達した単位四元数 $q(\\theta)$ の実部 $\\cos(\\theta/2)$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: w, tol: 0.002 },
          hint: ['The quaternion turns at half the rate of the block.', '四元数はブロックの半分の速さで回ります。'],
          sol: [[`$\\theta/2 = ${th / 2}^\\circ$, so $\\cos(\\theta/2) = ${n(w, 4)}$.`, `$\\theta/2 = ${th / 2}^\\circ$ なので $\\cos(\\theta/2) = ${n(w, 4)}$ です。`], [th % 360 === 0 ? `The block is back where it started, but the quaternion is at $${n(w)}$: ${w < 0 ? 'the opposite sheet of the double cover.' : 'home on both levels.'}` : `The block's orientation repeats every $360^\\circ$, but this number repeats only every $720^\\circ$.`, th % 360 === 0 ? `ブロックは元の姿勢に戻っていますが、四元数は $${n(w)}$ にあります。${w < 0 ? '二重被覆のもう一方の層です。' : 'どちらの層でも出発点です。'}` : 'ブロックの姿勢は $360^\\circ$ ごとに繰り返しますが、この数は $720^\\circ$ ごとにしか繰り返しません。']],
          set: { angle: th },
        };
      }
      const th = r.pick([180, 360, 540, 720]), opts = [['$q = +1$', '$q = +1$'], ['$q = -1$', '$q = -1$'], ['$q = \\mathbf i$', '$q = \\mathbf i$'], ['$q = -\\mathbf i$', '$q = -\\mathbf i$']];
      const ans = { 180: 2, 360: 1, 540: 3, 720: 0 }[th];
      return {
        q: [`Rotating about the $x$ axis, the lifted path is $q(\\theta) = \\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf i$. Where is it at $\\theta = ${th}^\\circ$?`, `$x$ 軸まわりの回転では、持ち上げた経路は $q(\\theta) = \\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf i$ です。$\\theta = ${th}^\\circ$ ではどこにありますか。`],
        a: { type: 'choice', opts, v: ans, fixed: true },
        hint: ['Halve the angle first.', 'まず角度を半分にします。'],
        sol: [[`$\\theta/2 = ${th / 2}^\\circ$: $\\cos = ${n(cl(Math.cos(rad(th / 2))))}$, $\\sin = ${n(cl(Math.sin(rad(th / 2))))}$.`, `$\\theta/2 = ${th / 2}^\\circ$ で、$\\cos = ${n(cl(Math.cos(rad(th / 2))))}$、$\\sin = ${n(cl(Math.sin(rad(th / 2))))}$ です。`], [`So $${opts[ans][0].slice(1, -1)}$. ${th % 360 === 0 ? (th === 360 ? 'Both $\\pm1$ give the identity rotation, yet the path has not closed in $SU(2)$.' : 'Only now has the path closed in $SU(2)$.') : 'Both $\\pm\\mathbf i$ give the same half turn of the block.'}`, `よって $${opts[ans][0].slice(1, -1)}$ です。${th % 360 === 0 ? (th === 360 ? '$\\pm1$ はどちらも恒等回転を与えますが、経路は $SU(2)$ で閉じていません。' : 'ここで初めて経路が $SU(2)$ で閉じます。') : '$\\pm\\mathbf i$ はどちらもブロックの同じ半回転を与えます。'}`]],
        set: { angle: th },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.pick([60, 90, 120, 180]), b = r.pick([60, 90, 120, 180]);
        const qx = quat([1, 0, 0], rad(a)), qy = quat([0, 1, 0], rad(b)), q = qmul(qy, qx);
        const ang = 2 * dg(Math.acos(Math.min(1, Math.abs(q[0]))));
        return {
          q: [`Turn by $${a}^\\circ$ about the $x$ axis, then by $${b}^\\circ$ about the $y$ axis. The result is a single rotation; what is its angle in $[0^\\circ, 180^\\circ]$?`, `$x$ 軸まわりに $${a}^\\circ$ 回し、次に $y$ 軸まわりに $${b}^\\circ$ 回します。結果は1つの回転です。その角度を $[0^\\circ, 180^\\circ]$ で答えてください。`],
          a: { type: 'num', v: ang, tol: 0.3, unit: ['°', '°'] },
          hint: ['Multiply the quaternions $q_y q_x$; only the real part is needed, and $\\mathbf j\\mathbf i$ has no real part.', '四元数の積 $q_y q_x$ を計算します。必要なのは実部だけで、$\\mathbf j\\mathbf i$ には実部がありません。'],
          sol: [[`$q_x = \\cos ${a / 2}^\\circ + \\sin ${a / 2}^\\circ\\,\\mathbf i$ and $q_y = \\cos ${b / 2}^\\circ + \\sin ${b / 2}^\\circ\\,\\mathbf j$.`, `$q_x = \\cos ${a / 2}^\\circ + \\sin ${a / 2}^\\circ\\,\\mathbf i$、$q_y = \\cos ${b / 2}^\\circ + \\sin ${b / 2}^\\circ\\,\\mathbf j$ です。`], [`$q_y q_x = ${qtex(q)}$, with real part $\\cos ${a / 2}^\\circ\\cos ${b / 2}^\\circ = ${n(q[0], 4)}$.`, `$q_y q_x = ${qtex(q)}$ で、実部は $\\cos ${a / 2}^\\circ\\cos ${b / 2}^\\circ = ${n(q[0], 4)}$ です。`], [`The angle is $2\\arccos|${n(q[0], 4)}| = ${n(ang, 2)}^\\circ$, not $${a}^\\circ + ${b}^\\circ$: rotations about different axes do not add.`, `角度は $2\\arccos|${n(q[0], 4)}| = ${n(ang, 2)}^\\circ$ で、$${a}^\\circ + ${b}^\\circ$ ではありません。異なる軸のまわりの回転は足し算になりません。`]],
        };
      }
      const th = r.pick([60, 120, 240, 300, 420, 480, 600, 660, 90, 270, 450, 630]), q = quat([1, 0, 0], rad(th));
      return {
        q: [`A path that turns the block steadily about the $x$ axis, starting at $q = 1$, ends at $q = ${qtex(q)}$. Through what angle $\\theta \\in [0^\\circ, 720^\\circ)$ has the block turned?`, `ブロックを $x$ 軸まわりに一定の向きに回す経路が $q = 1$ から出発して $q = ${qtex(q)}$ で終わりました。ブロックが回った角度 $\\theta \\in [0^\\circ, 720^\\circ)$ はいくつですか。`],
        a: { type: 'num', v: th, tol: 0.5, unit: ['°', '°'] },
        hint: ['Find the half angle $\\theta/2$ from both the real part and the sign of the $\\mathbf i$ part.', '実部と $\\mathbf i$ 成分の符号の両方から半角 $\\theta/2$ を求めます。'],
        sol: [[`$\\cos(\\theta/2) = ${n(q[0], 4)}$ and $\\sin(\\theta/2) = ${n(q[1], 4)}$, so $\\theta/2 = ${th / 2}^\\circ$.`, `$\\cos(\\theta/2) = ${n(q[0], 4)}$、$\\sin(\\theta/2) = ${n(q[1], 4)}$ より $\\theta/2 = ${th / 2}^\\circ$ です。`], [`$\\theta = ${th}^\\circ$. The block alone could not tell $${th}^\\circ$ from $${(th + 360) % 720}^\\circ$; the quaternion can, because $q$ and $-q$ are different points of $SU(2)$.`, `$\\theta = ${th}^\\circ$ です。ブロックだけでは $${th}^\\circ$ と $${(th + 360) % 720}^\\circ$ を区別できませんが、四元数は区別できます。$q$ と $-q$ は $SU(2)$ の別の点だからです。`]],
        set: { angle: th },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(1, 6), m = r.chance(0.5) ? r.int(1, 3) : 0, tot = k + m, ok = tot % 2 === 0;
        const qtxt = m ? [`a loop that turns the block $${k}$ full turn${k > 1 ? 's' : ''} about the $x$ axis and then $${m}$ full turn${m > 1 ? 's' : ''} about the $z$ axis`, `ブロックを $x$ 軸まわりに $${k}$ 回転させ、続けて $z$ 軸まわりに $${m}$ 回転させるループ`] : [`the loop in $SO(3)$ that turns the block through $${k}$ full turn${k > 1 ? 's' : ''} about one axis`, `ブロックを1つの軸のまわりに $${k}$ 回転させる $SO(3)$ のループ`];
        return {
          q: [`Can ${qtxt[0]} be shrunk to the constant loop (the ribbon untangled with the block held still)?`, `${qtxt[1]}は、定値ループに縮められますか（ブロックを止めたままリボンをほどけますか）。`],
          a: { type: 'choice', opts: [['Yes: the lift to $SU(2)$ closes at $+1$.', 'はい。$SU(2)$ への持ち上げが $+1$ で閉じます。'], ['No: the lift to $SU(2)$ ends at $-1$.', 'いいえ。$SU(2)$ への持ち上げが $-1$ で終わります。']], v: ok ? 0 : 1, fixed: true },
          hint: ['Each full turn, about any axis, multiplies the lifted endpoint by $-1$.', 'どの軸のまわりでも、1回転ごとに持ち上げの終点に $-1$ が掛かります。'],
          sol: [[`A full turn lifts to a path from $q$ to $-q$. After ${m ? `$${k} + ${m} = ${tot}$` : `$${k}$`} turn${tot > 1 ? 's' : ''} the endpoint is $(-1)^{${tot}} = ${ok ? '+1' : '-1'}$.`, `1回転は $q$ から $-q$ への経路に持ち上がります。${m ? `$${k} + ${m} = ${tot}$` : `$${k}$`} 回転後の終点は $(-1)^{${tot}} = ${ok ? '+1' : '-1'}$ です。`], [`$SU(2)$ is a 3-sphere, which is simply connected, so a loop in $SO(3)$ shrinks exactly when its lift closes. Hence $\\pi_1(SO(3)) = \\mathbb Z/2$: only the parity of the number of turns matters, ${ok ? 'and it is even here.' : 'and it is odd here.'}`, `$SU(2)$ は単連結な3次元球面なので、$SO(3)$ のループは持ち上げが閉じるときにちょうど縮められます。よって $\\pi_1(SO(3)) = \\mathbb Z/2$ で、回転数の偶奇だけが意味をもちます。ここでは${ok ? '偶数です。' : '奇数です。'}`]],
          set: !m && k <= 2 ? { angle: 360 * k } : undefined,
        };
      }
      if (form === 1) {
        return {
          q: ['Turn by $\\theta$ about the $x$ axis, then by $\\theta$ about the $y$ axis. The composite is a single rotation by $\\varphi$. Write $\\cos(\\varphi/2)$ as a function of $\\theta$.', '$x$ 軸まわりに $\\theta$、続けて $y$ 軸まわりに $\\theta$ 回します。合成は角度 $\\varphi$ の1つの回転です。$\\cos(\\varphi/2)$ を $\\theta$ の関数で表してください。'],
          a: { type: 'expr', v: 'cos(theta/2)^2', vars: ['theta'], dom: { theta: [0.1, 3] }, lhs: ['$\\cos(\\varphi/2) =$', '$\\cos(\\varphi/2) =$'] },
          hint: ['The real part of a product of unit quaternions is $w_1w_2 - \\mathbf v_1\\cdot\\mathbf v_2$.', '単位四元数の積の実部は $w_1w_2 - \\mathbf v_1\\cdot\\mathbf v_2$ です。'],
          sol: [['$q_y q_x = (\\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf j)(\\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf i)$, and $\\mathbf j\\cdot\\mathbf i = 0$ as vectors.', '$q_y q_x = (\\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf j)(\\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf i)$ で、ベクトルとして $\\mathbf j\\cdot\\mathbf i = 0$ です。'], ['So the real part is $\\cos^2(\\theta/2)$, and that is $\\cos(\\varphi/2)$ for the composite.', 'よって実部は $\\cos^2(\\theta/2)$ で、これが合成の $\\cos(\\varphi/2)$ です。'], ['For small $\\theta$, $\\varphi \\approx \\sqrt2\\,\\theta$: two perpendicular small turns add like vectors, as the Lie algebra predicts. For larger $\\theta$ they do not.', '小さな $\\theta$ では $\\varphi \\approx \\sqrt2\\,\\theta$ で、直交する2つの小さな回転はリー代数の予測どおりベクトルのように足されます。大きな $\\theta$ ではそうなりません。']],
        };
      }
      const g = r.pick([20, 30, 40, 45, 60, 75, 90]);
      const q = qmul(quat([Math.cos(rad(g)), Math.sin(rad(g)), 0], PI), quat([1, 0, 0], PI));
      const ang = 2 * dg(Math.acos(Math.min(1, Math.abs(q[0]))));
      return {
        q: [`Two half turns ($180^\\circ$) are made in succession, about two axes in the $xy$ plane that meet at $${g}^\\circ$. What single rotation angle in $[0^\\circ, 180^\\circ]$ results?`, `$xy$ 平面内で $${g}^\\circ$ で交わる2本の軸のまわりに、続けて半回転（$180^\\circ$）ずつ回します。結果は角度いくつの1つの回転ですか（$[0^\\circ, 180^\\circ]$）。`],
        a: { type: 'num', v: ang, tol: 0.3, unit: ['°', '°'] },
        hint: ['A half turn about the unit axis $\\mathbf n$ lifts to the pure quaternion $\\mathbf n$. Multiply two of them.', '単位軸 $\\mathbf n$ のまわりの半回転は純虚四元数 $\\mathbf n$ に持ち上がります。2つを掛けてください。'],
        sol: [['For pure unit quaternions, $\\mathbf n_2\\mathbf n_1 = -\\mathbf n_2\\cdot\\mathbf n_1 + \\mathbf n_2\\times\\mathbf n_1$.', '純虚単位四元数では $\\mathbf n_2\\mathbf n_1 = -\\mathbf n_2\\cdot\\mathbf n_1 + \\mathbf n_2\\times\\mathbf n_1$ です。'], [`The real part is $-\\cos ${g}^\\circ = ${n(q[0], 4)}$, and the vector part points along $\\mathbf e_z$.`, `実部は $-\\cos ${g}^\\circ = ${n(q[0], 4)}$ で、ベクトル部分は $\\mathbf e_z$ の向きです。`], [`So the composite turns by $2\\arccos|\\cos ${g}^\\circ| = ${n(ang, 2)}^\\circ$ about the $z$ axis: twice the angle between the axes, as two reflections make a rotation by twice their angle.`, `よって合成は $z$ 軸まわりに $2\\arccos|\\cos ${g}^\\circ| = ${n(ang, 2)}^\\circ$ 回ります。2つの鏡映がその角度の2倍の回転になるのと同じく、軸のなす角の2倍です。`]],
      };
    },
  ];

  /* ---------- 3. the commutator ---------- */
  const NAME = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
  const V0 = unit([0.62, 0.48, 0.62]), zV0 = len(cross([0, 0, 1], V0));
  const commV = (e, A, B, v) => { const R = mm(rot(B, -e), mm(rot(A, -e), mm(rot(B, e), rot(A, e)))); return mv(R, v); };
  Q.commutator = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let a, b; do { a = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; b = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; } while (len(cross(a, b)) < 0.5);
        const c = cross(a, b);
        return {
          q: [`In $\\mathfrak{so}(3)$, identify $\\hat{\\mathbf a}$ with $\\mathbf a \\in \\mathbb R^3$. For $\\mathbf a = ${vec(a, 0)}$ and $\\mathbf b = ${vec(b, 0)}$, which vector corresponds to $[\\hat{\\mathbf a}, \\hat{\\mathbf b}]$?`, `$\\mathfrak{so}(3)$ で $\\hat{\\mathbf a}$ を $\\mathbf a \\in \\mathbb R^3$ と同一視します。$\\mathbf a = ${vec(a, 0)}$、$\\mathbf b = ${vec(b, 0)}$ のとき、$[\\hat{\\mathbf a}, \\hat{\\mathbf b}]$ に対応するベクトルはどれですか。`],
          a: { type: 'tuple', v: c, labels: ['$x$', '$y$', '$z$'], tol: 1e-6 },
          hint: ['The bracket of skew matrices is the skew matrix of the cross product.', '反対称行列の括弧積は外積の反対称行列です。'],
          sol: [['$[\\hat{\\mathbf a}, \\hat{\\mathbf b}] = \\widehat{\\mathbf a \\times \\mathbf b}$, which follows from the Jacobi identity for the cross product.', '$[\\hat{\\mathbf a}, \\hat{\\mathbf b}] = \\widehat{\\mathbf a \\times \\mathbf b}$ で、これは外積のヤコビ恒等式から従います。'], [`$\\mathbf a \\times \\mathbf b = ${vec(c, 0)}$: the Lie algebra of rotations is $\\mathbb R^3$ with the cross product.`, `$\\mathbf a \\times \\mathbf b = ${vec(c, 0)}$ です。回転のリー代数は外積を備えた $\\mathbb R^3$ です。`]],
        };
      }
      if (form === 1) {
        const pairs = [['X', 'Y', 'Z', 1], ['Y', 'Z', 'X', 1], ['Z', 'X', 'Y', 1], ['Y', 'X', 'Z', -1], ['Z', 'Y', 'X', -1], ['X', 'Z', 'Y', -1]];
        const [A, B, C, s] = r.pick(pairs), other = ['X', 'Y', 'Z'].find((x) => x !== C && x !== A) || A;
        const opts = [[`$${s > 0 ? '' : '-'}${C}$`, `$${s > 0 ? '' : '-'}${C}$`], [`$${s > 0 ? '-' : ''}${C}$`, `$${s > 0 ? '-' : ''}${C}$`], ['$0$', '$0$'], [`$${other}$`, `$${other}$`]];
        return {
          q: [`$X, Y, Z$ generate rotations about the $x, y, z$ axes, with $[X, Y] = Z$. What is $[${A}, ${B}]$?`, `$X, Y, Z$ は $x, y, z$ 軸まわりの回転の生成子で、$[X, Y] = Z$ です。$[${A}, ${B}]$ はどれですか。`],
          a: { type: 'choice', opts, v: 0 },
          hint: ['Use the cross product of the unit vectors, and remember the bracket is antisymmetric.', '単位ベクトルの外積を使い、括弧積が反対称であることを思い出してください。'],
          sol: [[`$[${A}, ${B}]$ corresponds to $\\mathbf e_${A.toLowerCase()} \\times \\mathbf e_${B.toLowerCase()} = ${s > 0 ? '' : '-'}\\mathbf e_${C.toLowerCase()}$.`, `$[${A}, ${B}]$ は $\\mathbf e_${A.toLowerCase()} \\times \\mathbf e_${B.toLowerCase()} = ${s > 0 ? '' : '-'}\\mathbf e_${C.toLowerCase()}$ に対応します。`], [`So $[${A}, ${B}] = ${s > 0 ? '' : '-'}${C}$. It is not zero: rotations about different axes do not commute, even infinitesimally.`, `よって $[${A}, ${B}] = ${s > 0 ? '' : '-'}${C}$ です。0 ではありません。異なる軸のまわりの回転は、無限小でも可換ではないのです。`]],
        };
      }
      const e = r.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1]), k = r.pick([2, 4, 5, 10]);
      return {
        q: [`At step size $\\varepsilon = ${e}$ the commutator loop leaves a gap $g$. To leading order, by what factor does the gap shrink if $\\varepsilon$ is divided by $${k}$?`, `刻み $\\varepsilon = ${e}$ では交換子のループが隙間 $g$ を残します。最低次の近似で、$\\varepsilon$ を $${k}$ で割ると隙間は何分の1になりますか。`],
        a: { type: 'num', v: k * k },
        hint: ['The first-order terms cancel; what is the first power of $\\varepsilon$ that survives?', '一次の項は打ち消し合います。生き残る最初の $\\varepsilon$ のべきは何でしょうか。'],
        sol: [['The leftover rotation is $e^{\\varepsilon^2[Y, X] + O(\\varepsilon^3)}$, so the gap is proportional to $\\varepsilon^2$.', '残る回転は $e^{\\varepsilon^2[Y, X] + O(\\varepsilon^3)}$ なので、隙間は $\\varepsilon^2$ に比例します。'], [`Dividing $\\varepsilon$ by $${k}$ divides the gap by $${k}^2 = ${k * k}$: a slope of $2$ on the log–log plot.`, `$\\varepsilon$ を $${k}$ で割ると隙間は $${k}^2 = ${k * k}$ 分の1になります。両対数グラフで傾き $2$ です。`]],
        set: { eps: Number((e / k).toFixed(2)) >= 0.05 ? Number((e / k).toFixed(2)) : e },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const e = r.step(0.05, 0.4, 0.01), useLab = r.chance(0.5);
        const v = useLab ? V0 : unit([r.nz(-3, 3), r.int(-3, 3), r.nz(-3, 3)]), zp = len(cross([0, 0, 1], v)), g = e * e * zp;
        const vt = useLab ? 'the figure\'s start point $\\mathbf v = (0.62, 0.48, 0.62)/|\\cdot|$' : `$\\mathbf v = ${vec(v, 3)}$`;
        const vtj = useLab ? '図の出発点 $\\mathbf v = (0.62, 0.48, 0.62)/|\\cdot|$' : `$\\mathbf v = ${vec(v, 3)}$`;
        return {
          q: [`Rotate ${vt} by $\\varepsilon = ${e}$ about $x$, then $y$, then undo $x$, then undo $y$. To leading order, how big is the gap between where it ends and where it began? Give four decimals.`, `${vtj}を $x$ 軸まわりに $\\varepsilon = ${e}$、次に $y$ 軸まわり、それから $x$、$y$ の順に戻します。最低次の近似で、終点と出発点の隙間はどれだけですか（小数第4位まで）。`],
          a: { type: 'num', v: g, tol: 6e-5 },
          hint: ['The loop is a rotation by $\\varepsilon^2$ about $-\\mathbf e_z$; a small rotation by $\\alpha$ moves $\\mathbf v$ by about $\\alpha|\\mathbf e_z \\times \\mathbf v|$.', 'このループは $-\\mathbf e_z$ のまわりの $\\varepsilon^2$ の回転です。小さな角 $\\alpha$ の回転は $\\mathbf v$ をおよそ $\\alpha|\\mathbf e_z \\times \\mathbf v|$ だけ動かします。'],
          sol: [[`$|\\mathbf e_z \\times \\mathbf v| = \\sqrt{v_x^2 + v_y^2} = ${n(zp, 4)}$.`, `$|\\mathbf e_z \\times \\mathbf v| = \\sqrt{v_x^2 + v_y^2} = ${n(zp, 4)}$ です。`], [`Gap $\\approx \\varepsilon^2 \\cdot ${n(zp, 4)} = ${n(e * e, 4)} \\cdot ${n(zp, 4)} = ${n(g, 5)}$.`, `隙間 $\\approx \\varepsilon^2 \\cdot ${n(zp, 4)} = ${n(e * e, 4)} \\cdot ${n(zp, 4)} = ${n(g, 5)}$ です。`], [`The exact gap here is $${n(len(commV(e, NAME.X, NAME.Y, v).map((x, i) => x - v[i])), 5)}$; the difference is the $O(\\varepsilon^3)$ correction.`, `この場合の厳密な隙間は $${n(len(commV(e, NAME.X, NAME.Y, v).map((x, i) => x - v[i])), 5)}$ で、差は $O(\\varepsilon^3)$ の補正です。`]],
          set: useLab ? { eps: e } : undefined,
        };
      }
      if (form === 1) {
        const A = [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]];
        let B; do { B = [[r.int(-2, 2), r.int(-2, 2)], [r.int(-2, 2), r.int(-2, 2)]]; } while (Math.abs(A[0][1] * B[1][0] - B[0][1] * A[1][0]) + Math.abs(A[0][1] * (B[0][0] - B[1][1]) - B[0][1] * (A[0][0] - A[1][1])) === 0);
        const m2 = (X, Y) => [[X[0][0] * Y[0][0] + X[0][1] * Y[1][0], X[0][0] * Y[0][1] + X[0][1] * Y[1][1]], [X[1][0] * Y[0][0] + X[1][1] * Y[1][0], X[1][0] * Y[0][1] + X[1][1] * Y[1][1]]];
        const AB = m2(A, B), BA = m2(B, A), C = [[AB[0][0] - BA[0][0], AB[0][1] - BA[0][1]], [AB[1][0] - BA[1][0], AB[1][1] - BA[1][1]]];
        return {
          q: [`For $A = ${mat(A, 'pmatrix', 0)}$ and $B = ${mat(B, 'pmatrix', 0)}$, $e^{\\varepsilon A}e^{\\varepsilon B}e^{-\\varepsilon A}e^{-\\varepsilon B} = I + \\varepsilon^2 C + O(\\varepsilon^3)$. Find $C$, entry by entry.`, `$A = ${mat(A, 'pmatrix', 0)}$、$B = ${mat(B, 'pmatrix', 0)}$ について $e^{\\varepsilon A}e^{\\varepsilon B}e^{-\\varepsilon A}e^{-\\varepsilon B} = I + \\varepsilon^2 C + O(\\varepsilon^3)$ です。$C$ を成分ごとに求めてください。`],
          a: { type: 'tuple', v: [C[0][0], C[0][1], C[1][0], C[1][1]], labels: ['$C_{11}$', '$C_{12}$', '$C_{21}$', '$C_{22}$'], tol: 1e-6 },
          hint: ['Expand each exponential to second order; every term that is not a product of $A$ and $B$ cancels.', '各指数関数を2次まで展開します。$A$ と $B$ の積でない項はすべて打ち消し合います。'],
          sol: [['Multiplying out to order $\\varepsilon^2$, the squares cancel and the cross terms leave $AB - BA$, so $C = [A, B]$.', '$\\varepsilon^2$ の次数まで掛け合わせると、2乗の項は消え、交差項から $AB - BA$ が残るので $C = [A, B]$ です。'], [`$AB = ${mat(AB, 'pmatrix', 0)}$ and $BA = ${mat(BA, 'pmatrix', 0)}$, so $C = ${mat(C, 'pmatrix', 0)}$.`, `$AB = ${mat(AB, 'pmatrix', 0)}$、$BA = ${mat(BA, 'pmatrix', 0)}$ なので $C = ${mat(C, 'pmatrix', 0)}$ です。`], [`$\\operatorname{tr} C = 0$, as for every commutator: the loop's leftover is volume preserving to this order.`, `どの交換子とも同じく $\\operatorname{tr} C = 0$ です。この次数ではループの残りは体積を保ちます。`]],
        };
      }
      const e = r.step(0.05, 0.5, 0.05);
      return {
        q: [`After the loop $x, y, -x, -y$ with step $\\varepsilon = ${n(e)}$, what is the angle of the leftover rotation to leading order, in radians? Think also about its axis.`, `刻み $\\varepsilon = ${n(e)}$ で $x, y, -x, -y$ のループを回った後、残る回転の角度は最低次でいくつですか（ラジアン）。その軸も考えてください。`],
        a: { type: 'num', v: e * e },
        hint: ['$[Y, X] = -Z$, and the product is $e^{\\varepsilon^2[Y, X]}$ to leading order.', '$[Y, X] = -Z$ で、積は最低次で $e^{\\varepsilon^2[Y, X]}$ です。'],
        sol: [['$e^{-\\varepsilon Y}e^{-\\varepsilon X}e^{\\varepsilon Y}e^{\\varepsilon X} = e^{\\varepsilon^2[Y, X] + O(\\varepsilon^3)} = e^{-\\varepsilon^2 Z + O(\\varepsilon^3)}$.', '$e^{-\\varepsilon Y}e^{-\\varepsilon X}e^{\\varepsilon Y}e^{\\varepsilon X} = e^{\\varepsilon^2[Y, X] + O(\\varepsilon^3)} = e^{-\\varepsilon^2 Z + O(\\varepsilon^3)}$ です。'], [`So the leftover is a turn by $\\varepsilon^2 = ${n(e * e, 4)}$ rad about $-\\mathbf e_z$, clockwise seen from above. The readout's exact angle agrees to $O(\\varepsilon^3)$.`, `よって残りは $-\\mathbf e_z$ のまわりの $\\varepsilon^2 = ${n(e * e, 4)}$ rad の回転で、上から見て時計回りです。読み取り欄の厳密な角度とは $O(\\varepsilon^3)$ まで一致します。`]],
        set: { eps: e },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const g = r.pick([30, 45, 60, 90, 120, 150]), e = r.pick([0.05, 0.1, 0.2]), ans = e * e * Math.sin(rad(g));
        return {
          q: [`Replace the $x$ and $y$ axes by two unit axes $\\mathbf a$ and $\\mathbf b$ at $${g}^\\circ$ to each other, and run the loop $\\mathbf a, \\mathbf b, -\\mathbf a, -\\mathbf b$ with step $\\varepsilon = ${e}$. To leading order, what is the leftover rotation angle (radians)?`, `$x$ 軸と $y$ 軸を、互いに $${g}^\\circ$ をなす単位軸 $\\mathbf a$、$\\mathbf b$ に取り替え、刻み $\\varepsilon = ${e}$ で $\\mathbf a, \\mathbf b, -\\mathbf a, -\\mathbf b$ のループを回ります。最低次の近似で、残る回転の角度は何ラジアンですか。`],
          a: { type: 'num', v: ans, tol: ans * 0.005 },
          hint: ['The leftover is $e^{\\varepsilon^2[\\hat{\\mathbf b}, \\hat{\\mathbf a}]}$; the bracket is the cross product.', '残りは $e^{\\varepsilon^2[\\hat{\\mathbf b}, \\hat{\\mathbf a}]}$ で、括弧積は外積です。'],
          sol: [['$[\\hat{\\mathbf b}, \\hat{\\mathbf a}] = \\widehat{\\mathbf b \\times \\mathbf a}$, and $|\\mathbf b \\times \\mathbf a| = \\sin\\gamma$ for unit axes at angle $\\gamma$.', '$[\\hat{\\mathbf b}, \\hat{\\mathbf a}] = \\widehat{\\mathbf b \\times \\mathbf a}$ で、角 $\\gamma$ をなす単位軸では $|\\mathbf b \\times \\mathbf a| = \\sin\\gamma$ です。'], [`Angle $\\approx \\varepsilon^2\\sin ${g}^\\circ = ${n(e * e, 4)} \\cdot ${n(Math.sin(rad(g)), 4)} = ${n(ans, 5)}$, about the axis $\\mathbf b \\times \\mathbf a$.`, `角度 $\\approx \\varepsilon^2\\sin ${g}^\\circ = ${n(e * e, 4)} \\cdot ${n(Math.sin(rad(g)), 4)} = ${n(ans, 5)}$ で、軸は $\\mathbf b \\times \\mathbf a$ です。`], ['Parallel axes ($\\gamma = 0$) commute and leave nothing; perpendicular ones leave the most.', '平行な軸（$\\gamma = 0$）は可換で何も残さず、直交する軸が最も多く残します。']],
        };
      }
      if (form === 1) {
        const g = r.pick([0.005, 0.01, 0.02, 0.04, 0.05, 0.08, 0.1]), e = Math.sqrt(g / zV0);
        return {
          q: [`For the figure's start point $\\mathbf v$, $|\\mathbf e_z \\times \\mathbf v| = ${n(zV0, 4)}$. Which step size $\\varepsilon$ makes the leading-order gap equal to $${g}$?`, `図の出発点 $\\mathbf v$ では $|\\mathbf e_z \\times \\mathbf v| = ${n(zV0, 4)}$ です。最低次の隙間が $${g}$ になる刻み $\\varepsilon$ はいくつですか。`],
          a: { type: 'num', v: e, tol: 0.002 },
          hint: ['Invert gap $\\approx \\varepsilon^2|\\mathbf e_z \\times \\mathbf v|$.', '隙間 $\\approx \\varepsilon^2|\\mathbf e_z \\times \\mathbf v|$ を逆に解きます。'],
          sol: [[`$\\varepsilon^2 = ${g}/${n(zV0, 4)} = ${n(g / zV0, 5)}$, so $\\varepsilon = ${n(e, 4)}$.`, `$\\varepsilon^2 = ${g}/${n(zV0, 4)} = ${n(g / zV0, 5)}$ より $\\varepsilon = ${n(e, 4)}$ です。`], [`Set $\\varepsilon = ${n(e, 2)}$ in the figure: the readout's gap is close to $${g}$, ${e > 0.3 ? 'though at this size the third-order terms are already visible.' : 'and closer still for smaller targets, where the $\\varepsilon^2$ law is more accurate.'}`, `図で $\\varepsilon = ${n(e, 2)}$ にすると、読み取り欄の隙間は $${g}$ に近くなります。${e > 0.3 ? 'ただしこの大きさでは三次の項がすでに見えます。' : '目標が小さいほど $\\varepsilon^2$ の法則は正確になり、さらに近くなります。'}`]],
          set: { eps: Math.round(e * 100) / 100 },
        };
      }
      let v; do { v = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (v[0] * v[0] + v[2] * v[2] === 0 || v[0] * v[0] + v[2] * v[2] === 1 && r.chance(0.5));
      const s2 = v[0] * v[0] + v[2] * v[2], rt = Math.sqrt(s2), isSq = Number.isInteger(rt);
      return {
        q: [`Now run the loop with the $z$ axis in place of $y$: $x$ by $\\varepsilon$, $z$ by $\\varepsilon$, then undo $x$, then undo $z$. For $\\mathbf v = ${vec(v, 0)}$, write the leading-order gap as a function of $\\varepsilon$.`, `今度は $y$ の代わりに $z$ 軸を使います。$x$ 軸まわりに $\\varepsilon$、$z$ 軸まわりに $\\varepsilon$、それから $x$、$z$ の順に戻します。$\\mathbf v = ${vec(v, 0)}$ について、最低次の隙間を $\\varepsilon$ の関数で表してください。`],
        a: { type: 'expr', v: `${isSq ? rt : `sqrt(${s2})`}*epsilon^2`, vars: ['epsilon'], dom: { epsilon: [0.05, 1] }, lhs: ['gap $\\approx$', '隙間 $\\approx$'] },
        hint: ['Find the bracket $[Z, X]$ from the cross product, then the speed of $\\mathbf v$ under that rotation.', '外積から括弧積 $[Z, X]$ を求め、その回転のもとでの $\\mathbf v$ の速さを考えます。'],
        sol: [['The leftover is $e^{\\varepsilon^2[Z, X]}$, and $[Z, X] \\leftrightarrow \\mathbf e_z \\times \\mathbf e_x = \\mathbf e_y$: a turn by $\\varepsilon^2$ about $+\\mathbf e_y$.', '残りは $e^{\\varepsilon^2[Z, X]}$ で、$[Z, X] \\leftrightarrow \\mathbf e_z \\times \\mathbf e_x = \\mathbf e_y$ なので、$+\\mathbf e_y$ のまわりの $\\varepsilon^2$ の回転です。'], [`$|\\mathbf e_y \\times \\mathbf v| = \\sqrt{v_x^2 + v_z^2} = ${isSq ? rt : `\\sqrt{${s2}}`}$.`, `$|\\mathbf e_y \\times \\mathbf v| = \\sqrt{v_x^2 + v_z^2} = ${isSq ? rt : `\\sqrt{${s2}}`}$ です。`], [`Gap $\\approx ${isSq ? rt : `\\sqrt{${s2}}`}\\,\\varepsilon^2$. The $y$ component of $\\mathbf v$ does not matter: it lies on the leftover axis.`, `隙間 $\\approx ${isSq ? rt : `\\sqrt{${s2}}`}\\,\\varepsilon^2$ です。$\\mathbf v$ の $y$ 成分は関係ありません。残りの回転の軸上にあるからです。`]],
      };
    },
  ];
})();
