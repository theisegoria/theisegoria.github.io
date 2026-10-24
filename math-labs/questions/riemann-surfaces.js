'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, gcd, frac } = P.util;
  const PI = Math.PI;
  const cx = (re, im, d = 4) => (Math.abs(im) < 1e-12 ? n(re, d) : Math.abs(re) < 1e-12 ? `${n(im, d)}i` : `${n(re, d)} ${im < 0 ? '-' : '+'} ${n(Math.abs(im), d)}i`);

  Q['branch-sheets'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([4, 9, 16, 25, 2, 3]), k = r.int(1, 4);
        const w0 = Math.sqrt(a), w1 = (k % 2 ? -1 : 1) * w0;
        return {
          q: [`Start with $w = \\sqrt{${a}} = ${n(w0, 4)}$ at $z = ${a}$ and continue $\\sqrt z$ along a loop that goes ${k} time${k > 1 ? 's' : ''} round $0$ and returns to $z = ${a}$. What is $w$ at the end?`, `$z = ${a}$ で $w = \\sqrt{${a}} = ${n(w0, 4)}$ から始め、$0$ のまわりを ${k} 回まわって $z = ${a}$ に戻る輪に沿って $\\sqrt z$ を接続します。最後の $w$ はいくつですか。`],
          a: { type: 'num', v: w1, tol: 1e-6, show: k % 2 ? `-\\sqrt{${a}}` : `\\sqrt{${a}}` },
          hint: ['Each turn adds $2\\pi$ to the argument of $z$, so it adds $\\pi$ to the argument of $\\sqrt z$.', '一回まわるごとに $z$ の偏角は $2\\pi$ 増えるので、$\\sqrt z$ の偏角は $\\pi$ 増えます。'],
          sol: [[`After ${k} turn${k > 1 ? 's' : ''} $w$ has been multiplied by $e^{i\\pi \\cdot ${k}} = ${k % 2 ? -1 : 1}$.`, `${k} 回まわると $w$ は $e^{i\\pi \\cdot ${k}} = ${k % 2 ? -1 : 1}$ 倍になります。`], [k % 2 ? 'An odd number of turns lands on the other sheet.' : 'An even number of turns brings you back to the same sheet.', k % 2 ? '奇数回まわると別のシートに着きます。' : '偶数回まわると同じシートに戻ります。']],
          set: { func: 0, cx: 0, cy: 0, R: 1, turns: Math.min(3, k) },
        };
      }
      if (form === 1) {
        const k = r.int(1, 3), sgn = r.sign();
        return {
          q: [`A loop goes ${k} time${k > 1 ? 's' : ''} round $0$ ${sgn > 0 ? 'anticlockwise' : 'clockwise'}. By how much does the continued value of $\\log z$ change? Give the change in the imaginary part as a multiple of $\\pi$.`, `輪が $0$ のまわりを${sgn > 0 ? '反時計回り' : '時計回り'}に ${k} 回まわります。$\\log z$ の接続した値はいくら変わりますか。虚部の変化を $\\pi$ の何倍かで答えてください。`],
          a: { type: 'int', v: 2 * k * sgn, show: `${2 * k * sgn}` },
          hint: ['$\\log z = \\ln|z| + i\\arg z$; only the argument changes round a closed loop.', '$\\log z = \\ln|z| + i\\arg z$ で、閉じた輪を回って変わるのは偏角だけです。'],
          sol: [[`The argument changes by $${sgn > 0 ? '' : '-'}2\\pi \\times ${k}$, so $\\log z$ changes by $${2 * k * sgn}\\pi i$.`, `偏角は $${sgn > 0 ? '' : '-'}2\\pi \\times ${k}$ 変わるので、$\\log z$ は $${2 * k * sgn}\\pi i$ 変わります。`], ['The real part $\\ln|z|$ comes back unchanged, which is why the logarithm\'s sheets stack vertically and never close up.', '実部 $\\ln|z|$ は元に戻るので、対数のシートは縦に積み重なり、閉じることはありません。']],
          set: sgn > 0 ? { func: 2, cx: 0, cy: 0, R: 1, turns: k } : undefined,
        };
      }
      const m = r.pick([2, 3, 4, 5, 6]);
      return {
        q: [`How many sheets does the Riemann surface of $z^{1/${m}}$ have over the punctured plane?`, `$z^{1/${m}}$ のリーマン面は穴あき平面の上に何枚のシートをもちますか。`],
        a: { type: 'int', v: m },
        sol: [[`Each turn multiplies $z^{1/${m}}$ by $e^{2\\pi i/${m}}$, and it takes ${m} turns to return to the start.`, `一回まわるごとに $z^{1/${m}}$ は $e^{2\\pi i/${m}}$ 倍になり、元に戻るまで ${m} 回かかります。`], [`So there are ${m} values over each point, glued cyclically into ${m} sheets.`, `したがって各点の上に ${m} 個の値があり、巡回的に貼り合わされた ${m} 枚のシートになります。`]],
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        let p, q; do { p = r.int(1, 7); q = r.int(2, 9); } while (gcd(p, q) !== 1 || p >= 2 * q);
        const k = r.int(1, 4);
        const deg = ((360 * k * p / q) % 360 + 360) % 360;
        return {
          q: [`Continue $z^{${p}/${q}}$ ${k} time${k > 1 ? 's' : ''} round $0$. Its value is multiplied by $e^{i\\alpha}$; find $\\alpha$ in degrees, between $0$ and $360$.`, `$z^{${p}/${q}}$ を $0$ のまわりに ${k} 回接続します。値は $e^{i\\alpha}$ 倍になります。$\\alpha$ を $0$ 以上 $360$ 未満の度で答えてください。`],
          a: { type: 'num', v: deg, tol: 0.05, unit: ['°', '°'] },
          hint: [`Each turn adds $2\\pi \\cdot ${p}/${q}$ to the argument.`, `一回まわるごとに偏角は $2\\pi \\cdot ${p}/${q}$ 増えます。`],
          sol: [[`$\\alpha = 360^\\circ \\times ${k} \\times ${frac(p, q)} = ${n(360 * k * p / q, 3)}^\\circ$.`, `$\\alpha = 360^\\circ \\times ${k} \\times ${frac(p, q)} = ${n(360 * k * p / q, 3)}^\\circ$ です。`], [`Reduced mod $360^\\circ$: $${n(deg, 3)}^\\circ$. The value first returns after ${q} turns, so the surface has ${q} sheets.`, `$360^\\circ$ を法として $${n(deg, 3)}^\\circ$ です。値が初めて戻るのは ${q} 回後なので、曲面は ${q} 枚のシートをもちます。`]],
        };
      }
      const c = r.step(-1.5, 1.5, 0.1), R = r.step(0.3, 1.5, 0.1);
      const inside = Math.abs(c) < R - 1e-9;
      if (Math.abs(Math.abs(c) - R) < 0.05) return Q['branch-sheets'][1]({ ...r, chance: () => true });
      const a = c + R;
      return {
        q: [`Continue $\\sqrt z$ once round the circle with centre $${n(c)}$ and radius $${n(R)}$, starting at $z = ${n(a)}$ with ${a > 0 ? `$w = \\sqrt{${n(a)}}$` : `the principal value`}. Do you come back to the same value?`, `中心 $${n(c)}$、半径 $${n(R)}$ の円に沿って、$z = ${n(a)}$ から${a > 0 ? `$w = \\sqrt{${n(a)}}$` : '主値'}で始めて $\\sqrt z$ を一周接続します。同じ値に戻りますか。`],
        a: { type: 'choice', fixed: true, v: inside ? 1 : 0, opts: [['Yes: the loop does not enclose $0$', 'はい。輪は $0$ を囲まない'], ['No: it comes back as $-w$, because the loop encloses $0$', 'いいえ。輪が $0$ を囲むので $-w$ に戻る']] },
        hint: ['Only the winding number round the branch point $0$ matters. Is $0$ inside the circle?', '分岐点 $0$ のまわりの回転数だけが問題です。$0$ は円の内側にありますか。'],
        sol: [[`The distance from the centre to $0$ is $${n(Math.abs(c))}$, ${inside ? 'less' : 'more'} than the radius $${n(R)}$.`, `中心から $0$ までの距離は $${n(Math.abs(c))}$ で、半径 $${n(R)}$ より${inside ? '小さい' : '大きい'}です。`], [inside ? 'So the loop winds once round $0$ and $\\sqrt z$ changes sign.' : 'So the winding number is $0$ and the continuation returns to its starting value.', inside ? 'したがって輪は $0$ を一回まわり、$\\sqrt z$ は符号を変えます。' : 'したがって回転数は $0$ で、接続は出発時の値に戻ります。']],
        set: { func: 0, cx: c, cy: 0, R, turns: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const pick = r.pick([['z^3-z', '3z^2-1', 'z^3 - z', '3z^2 - 1'], ['z^3+1', '3z^2', 'z^3 + 1', '3z^2'], ['z^4-1', '4z^3', 'z^4 - 1', '4z^3'], ['z^2-4z', '2z-4', 'z^2 - 4z', '2z - 4'], ['z^5-z', '5z^4-1', 'z^5 - z', '5z^4 - 1']]);
        return {
          q: [`On the Riemann surface $w^2 = ${pick[2]}$, write $dw/dz$ in terms of $z$ and $w$.`, `リーマン面 $w^2 = ${pick[2]}$ の上で、$dw/dz$ を $z$ と $w$ で表してください。`],
          a: { type: 'expr', v: `(${pick[1]})/(2w)`, vars: ['z', 'w'], dom: { z: [0.4, 1.8], w: [0.5, 2] }, lhs: ['$\\dfrac{dw}{dz} =$', '$\\dfrac{dw}{dz} =$'] },
          hint: ['Differentiate both sides implicitly.', '両辺を陰関数として微分します。'],
          sol: [[`$2w\\,\\dfrac{dw}{dz} = ${pick[3]}$.`, `$2w\\,\\dfrac{dw}{dz} = ${pick[3]}$ です。`], [`So $\\dfrac{dw}{dz} = \\dfrac{${pick[3]}}{2w}$, which is single-valued on the surface: on the other sheet both $w$ and $dw/dz$ change sign together. It blows up only where $w = 0$, at the branch points.`, `したがって $\\dfrac{dw}{dz} = \\dfrac{${pick[3]}}{2w}$ です。これは曲面の上で一価で、もう一方のシートでは $w$ と $dw/dz$ が一緒に符号を変えます。発散するのは $w = 0$ となる分岐点だけです。`]],
        };
      }
      const k = r.int(1, 5), m = r.pick([2, 3, 4]);
      const back = (k % m) === 0;
      return {
        q: [`After how many turns round $0$ does the continuation of $z^{${k}/${m}}$ first return to its starting value? (The fraction may not be in lowest terms.)`, `$z^{${k}/${m}}$ の接続は、$0$ のまわりを何回まわると初めて出発時の値に戻りますか（分数は既約とは限りません）。`],
        a: { type: 'int', v: m / gcd(k, m) },
        hint: ['Reduce the exponent to lowest terms first.', 'まず指数を既約分数にします。'],
        sol: [[`$${k}/${m} = ${frac(k, m)}$.`, `$${k}/${m} = ${frac(k, m)}$ です。`], [back ? 'The exponent is an integer, so the function is single-valued and returns after every turn: answer 1.' : `Each turn multiplies by $e^{2\\pi i \\cdot ${frac(k, m)}}$, which first equals 1 after ${m / gcd(k, m)} turns.`, back ? '指数が整数なので関数は一価で、毎回もとに戻ります。答えは 1 です。' : `一回ごとに $e^{2\\pi i \\cdot ${frac(k, m)}}$ 倍になり、これが初めて 1 になるのは ${m / gcd(k, m)} 回後です。`]],
      };
    },
  ];

  Q['branch-genus'] = [
    (r) => {
      const deg = r.int(2, 9);
      const g = Math.floor((deg - 1) / 2);
      return {
        q: [`What is the genus of the Riemann surface of $w^2 = p(z)$, where $p$ has degree ${deg} and distinct roots?`, `$p$ が次数 ${deg} で相異なる根をもつとき、$w^2 = p(z)$ のリーマン面の種数はいくつですか。`],
        a: { type: 'int', v: g },
        hint: ['Count branch points, including $\\infty$ when the degree is odd, then use $g = (B - 2)/2$.', '分岐点を数え（次数が奇数なら $\\infty$ も含める）、$g = (B - 2)/2$ を使います。'],
        sol: [[`The ${deg} roots are branch points${deg % 2 ? ', and so is $\\infty$ because the degree is odd' : '; $\\infty$ is not, because the degree is even'}: $B = ${deg % 2 ? deg + 1 : deg}$.`, `${deg} 個の根が分岐点${deg % 2 ? 'で、次数が奇数なので $\\infty$ も分岐点' : 'で、次数が偶数なので $\\infty$ は分岐点ではありません'}。$B = ${deg % 2 ? deg + 1 : deg}$ です。`], [`$g = (${deg % 2 ? deg + 1 : deg} - 2)/2 = ${g}$${g === 0 ? ': a sphere.' : g === 1 ? ': a torus, an elliptic curve.' : '.'}`, `$g = (${deg % 2 ? deg + 1 : deg} - 2)/2 = ${g}$${g === 0 ? '、球面です。' : g === 1 ? '、トーラス、すなわち楕円曲線です。' : 'です。'}`]],
        set: deg <= 6 ? { n: deg } : undefined,
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        let m, k; do { m = r.int(2, 5); k = r.int(2, 7); } while (gcd(m, k) !== 1);
        const g = (m - 1) * (k - 1) / 2;
        return {
          q: [`Use Riemann–Hurwitz to find the genus of $w^{${m}} = p(z)$, where $p$ has degree ${k} with distinct roots (and $\\gcd(${m}, ${k}) = 1$).`, `リーマン・フルヴィッツの公式を使って、$p$ が相異なる根をもつ次数 ${k} の多項式のとき（$\\gcd(${m}, ${k}) = 1$）、$w^{${m}} = p(z)$ の種数を求めてください。`],
          a: { type: 'int', v: g },
          hint: [`The map $(z, w) \\mapsto z$ has degree ${m}; each root and $\\infty$ is a point of total ramification, contributing $${m} - 1$.`, `写像 $(z, w) \\mapsto z$ の次数は ${m} で、各根と $\\infty$ は完全分岐点で、それぞれ $${m} - 1$ を寄与します。`],
          sol: [[`There are ${k} + 1 totally ramified points (the roots and $\\infty$, since $${m} \\nmid ${k}$).`, `完全分岐点は ${k} + 1 個です（根と、$${m} \\nmid ${k}$ なので $\\infty$）。`], [`$2g - 2 = ${m}(0 - 2) + (${k} + 1)(${m} - 1) = ${2 * g - 2}$, so $g = ${g}$.`, `$2g - 2 = ${m}(0 - 2) + (${k} + 1)(${m} - 1) = ${2 * g - 2}$ より $g = ${g}$ です。`], ['For $m = 2$ this reduces to the hyperelliptic formula in the figure.', '$m = 2$ では図の超楕円曲線の公式になります。']],
        };
      }
      const deg = r.int(2, 8), g = Math.floor((deg - 1) / 2);
      return {
        q: [`What is the Euler characteristic of the compact Riemann surface of $w^2 = p(z)$ with $\\deg p = ${deg}$ and distinct roots?`, `$\\deg p = ${deg}$ で根が相異なるとき、$w^2 = p(z)$ のコンパクトなリーマン面のオイラー標数はいくつですか。`],
        a: { type: 'int', v: 2 - 2 * g },
        hint: ['Two spheres have $\\chi = 4$; each branch point glues two points into one, subtracting 1.', '二つの球面の $\\chi$ は 4 で、分岐点ごとに二点が一点に貼り合わされて 1 減ります。'],
        sol: [[`$B = ${deg % 2 ? deg + 1 : deg}$ branch points, so $\\chi = 2 \\cdot 2 - B = ${4 - (deg % 2 ? deg + 1 : deg)}$.`, `分岐点は $B = ${deg % 2 ? deg + 1 : deg}$ 個なので $\\chi = 2 \\cdot 2 - B = ${4 - (deg % 2 ? deg + 1 : deg)}$ です。`], [`Equivalently $g = ${g}$ and $\\chi = 2 - 2g$.`, `同じことですが $g = ${g}$、$\\chi = 2 - 2g$ です。`]],
        set: deg <= 6 ? { n: deg } : undefined,
      };
    },
    (r) => {
      const roots = r.sample([-3, -2, -1, 0, 1, 2, 3], r.int(3, 5)).sort((a, b) => a - b);
      const c = r.step(-2, 2, 0.5), R = r.pick([0.75, 1.25, 1.75, 2.25]);
      const kIn = roots.filter((a) => Math.abs(a - c) < R).length;
      if (roots.some((a) => Math.abs(Math.abs(a - c) - R) < 0.1)) return Q['branch-genus'][2]({ ...r });
      const poly = roots.map((a) => (a === 0 ? 'z' : `(z ${a < 0 ? '+' : '-'} ${Math.abs(a)})`)).join('');
      return {
        q: [`On $w^2 = ${poly}$, continue $w$ once round the circle with centre $${n(c)}$ and radius $${n(R)}$. Does it come back to the same sheet?`, `$w^2 = ${poly}$ の上で、中心 $${n(c)}$、半径 $${n(R)}$ の円に沿って $w$ を一周接続します。同じシートに戻りますか。`],
        a: { type: 'choice', fixed: true, v: kIn % 2 ? 1 : 0, opts: [['Yes, the same sheet', 'はい、同じシートに戻る'], ['No, the other sheet', 'いいえ、もう一方のシートに移る']] },
        hint: ['Each enclosed branch point contributes a factor $-1$.', '囲まれた分岐点はそれぞれ $-1$ 倍を寄与します。'],
        sol: [[`The branch points are ${roots.map((a) => `$${a}$`).join(', ')}; the circle encloses ${kIn} of them.`, `分岐点は ${roots.map((a) => `$${a}$`).join('、')} で、円はそのうち ${kIn} 個を囲みます。`], [`$w = \\prod\\sqrt{z - a_k}$ picks up $(-1)^{${kIn}} = ${kIn % 2 ? -1 : 1}$, so it ${kIn % 2 ? 'changes sheet' : 'returns to the same sheet'}.`, `$w = \\prod\\sqrt{z - a_k}$ は $(-1)^{${kIn}} = ${kIn % 2 ? -1 : 1}$ 倍になるので、${kIn % 2 ? 'シートが変わります' : '同じシートに戻ります'}。`]],
      };
    },
  ];

  Q['riemann-sphere'] = [
    (r) => {
      if (r.chance(0.5)) {
        const x = r.step(-2, 2, 0.5), y = r.step(-2, 2, 0.5), s = x * x + y * y;
        return {
          q: [`Under stereographic projection from the north pole onto the equatorial plane, which point of the unit sphere corresponds to $z = ${cx(x, y, 2)}$?`, `北極から赤道面への立体射影で、$z = ${cx(x, y, 2)}$ に対応する単位球面上の点はどこですか。`],
          a: { type: 'tuple', v: [2 * x / (1 + s), 2 * y / (1 + s), (s - 1) / (s + 1)], labels: ['$X$', '$Y$', '$Z$'], tol: 0.002 },
          hint: ['$(X, Y, Z) = \\left(\\dfrac{2x}{1 + |z|^2},\\ \\dfrac{2y}{1 + |z|^2},\\ \\dfrac{|z|^2 - 1}{|z|^2 + 1}\\right)$.', '$(X, Y, Z) = \\left(\\dfrac{2x}{1 + |z|^2},\\ \\dfrac{2y}{1 + |z|^2},\\ \\dfrac{|z|^2 - 1}{|z|^2 + 1}\\right)$ です。'],
          sol: [[`$|z|^2 = ${n(s)}$.`, `$|z|^2 = ${n(s)}$ です。`], [`$(X, Y, Z) = (${n(2 * x / (1 + s), 4)},\\ ${n(2 * y / (1 + s), 4)},\\ ${n((s - 1) / (s + 1), 4)})$. ${s < 1 ? 'Inside the unit circle means the southern hemisphere.' : s > 1 ? 'Outside the unit circle means the northern hemisphere.' : 'On the unit circle means on the equator.'}`, `$(X, Y, Z) = (${n(2 * x / (1 + s), 4)},\\ ${n(2 * y / (1 + s), 4)},\\ ${n((s - 1) / (s + 1), 4)})$ です。${s < 1 ? '単位円の内側は南半球です。' : s > 1 ? '単位円の外側は北半球です。' : '単位円上は赤道です。'}`]],
        };
      }
      const pick = r.pick([[0.6, 0, 0.8], [0, -0.6, 0.8], [0.8, 0, -0.6], [0, 0.6, -0.8], [0.48, 0.64, 0.6], [-0.48, 0.36, -0.8], [0.36, -0.48, 0.8]]);
      const z = [pick[0] / (1 - pick[2]), pick[1] / (1 - pick[2])];
      return {
        q: [`Project the point $(${pick.map((t) => n(t)).join(',\\ ')})$ of the unit sphere from the north pole onto the equatorial plane. Which complex number $z$ do you get?`, `単位球面上の点 $(${pick.map((t) => n(t)).join(',\\ ')})$ を北極から赤道面へ射影します。どんな複素数 $z$ が得られますか。`],
        a: { type: 'tuple', v: z, labels: ['$\\operatorname{Re} z$', '$\\operatorname{Im} z$'], tol: 0.002 },
        hint: ['$z = (X + iY)/(1 - Z)$.', '$z = (X + iY)/(1 - Z)$ です。'],
        sol: [[`$1 - Z = ${n(1 - pick[2])}$, so $z = (${n(pick[0])} + ${n(pick[1])}i)/${n(1 - pick[2])} = ${cx(z[0], z[1])}$.`, `$1 - Z = ${n(1 - pick[2])}$ より $z = (${n(pick[0])} + ${n(pick[1])}i)/${n(1 - pick[2])} = ${cx(z[0], z[1])}$ です。`], ['Points near the north pole land far out in the plane; the pole itself goes to $\\infty$.', '北極に近い点は平面の遠くに着き、北極そのものは $\\infty$ に行きます。']],
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        // real Moebius map with real fixed points: f(z) = (az + b)/(cz + d), fixed points solve c z^2 + (d - a) z - b = 0
        let p, q, k; do { p = r.int(-3, 3); q = r.int(-3, 4); k = r.pick([2, 3, 0.5, 4]); } while (p >= q || p * q === 0 || q * k === p);
        // conjugate z -> k z by h(z) = (z - p)/(z - q): f = h^-1(k h)
        // f(z) = ((q k - p) z + p q (1 - k)) / ((k - 1) z + (q - p k))
        const a = q * k - p, b = p * q * (1 - k), c = k - 1, d = q - p * k;
        const fz = `\\dfrac{${n(a)}z ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}}{${n(c)}z ${d < 0 ? '-' : '+'} ${n(Math.abs(d))}}`;
        return {
          q: [`Find the two fixed points of $f(z) = ${fz}$, smaller first.`, `$f(z) = ${fz}$ の二つの固定点を小さい順に求めてください。`],
          a: { type: 'tuple', v: [p, q], labels: ['$z_1$', '$z_2$'], tol: 1e-4 },
          hint: ['Solve $f(z) = z$: $cz^2 + (d - a)z - b = 0$.', '$f(z) = z$、すなわち $cz^2 + (d - a)z - b = 0$ を解きます。'],
          sol: [[`$${n(c)}z^2 + (${n(d - a)})z - (${n(b)}) = 0$.`, `$${n(c)}z^2 + (${n(d - a)})z - (${n(b)}) = 0$ です。`], [`Its roots are $z = ${p}$ and $z = ${q}$.`, `根は $z = ${p}$ と $z = ${q}$ です。`], [`The map is conjugate to $w \\mapsto ${n(k)}w$ with $w = (z - ${p})/(z - ${q})$, so it is hyperbolic: points flow from one fixed point to the other.`, `この写像は $w = (z - ${p})/(z - ${q})$ によって $w \\mapsto ${n(k)}w$ と共役なので双曲型で、点は一方の固定点からもう一方へ流れます。`]],
        };
      }
      const m = r.pick([[[1, 1], [0, 1], 'z + 1', 2], [[2, 0], [0, 1], '2z', 1], [[0, -1], [1, 0], '-1/z', 0], [[1, -1], [1, 1], '(z - 1)/(z + 1)', 0], [[3, 1], [-1, 1], '(3z + 1)/(-z + 1)', 2], [[1, 2], [1, 1], '(z + 2)/(z + 1)', 3], [[2, 1], [1, 1], '(2z + 1)/(z + 1)', 1]]);
      const [[a, b], [c, d], tex, type] = m;
      const det = a * d - b * c, tr2 = (a + d) ** 2 / det;
      return {
        q: [`Classify $f(z) = ${tex}$.`, `$f(z) = ${tex}$ の型を答えてください。`],
        a: { type: 'choice', fixed: true, v: type, opts: [['Elliptic', '楕円型'], ['Hyperbolic', '双曲型'], ['Parabolic', '放物型'], ['Loxodromic', '斜航型']] },
        hint: ['Compute $\\operatorname{tr}^2/\\det = (a + d)^2/(ad - bc)$ and compare with 4.', '$\\operatorname{tr}^2/\\det = (a + d)^2/(ad - bc)$ を計算し、4 と比べます。'],
        sol: [[`$a + d = ${a + d}$, $ad - bc = ${det}$, so $\\operatorname{tr}^2/\\det = ${n(tr2, 4)}$.`, `$a + d = ${a + d}$、$ad - bc = ${det}$ なので $\\operatorname{tr}^2/\\det = ${n(tr2, 4)}$ です。`], [['Real and in $[0, 4)$: elliptic, a rotation of the sphere about the axis through its two fixed points.', 'Real and above 4: hyperbolic, streaming from one fixed point to the other.', 'Exactly 4: parabolic, one double fixed point.', 'Real but negative, so outside both the elliptic range $[0, 4)$ and the hyperbolic range: loxodromic. The multiplier at each fixed point is a negative real number, a half-turn combined with a scaling.'][type], ['$[0, 4)$ の実数なので楕円型で、二つの固定点を通る軸のまわりの球面の回転です。', '4 より大きい実数なので双曲型で、一方の固定点からもう一方へ流れます。', 'ちょうど 4 なので放物型で、固定点は二重の一点です。', '負の実数なので、楕円型の範囲 $[0, 4)$ にも双曲型の範囲にも入らず、斜航型です。各固定点での乗数は負の実数で、半回転と拡大縮小の組み合わせです。'][type]]],
        set: { kind: type },
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const pick = r.pick([[2, 1, 1, 1], [1, 2, 0, 1], [3, 1, 1, 2], [1, -1, 1, 1], [2, 3, 1, 2], [1, 0, 2, 1]]);
        const [a, b, c, d] = pick;
        const fz = c === 0 ? `\\dfrac{${a}z + ${b}}{${d}}` : `\\dfrac{${a === 1 ? '' : a}z ${b < 0 ? '-' : '+'} ${Math.abs(b)}}{${c === 1 ? '' : c}z + ${d}}`;
        return {
          q: [`Find the inverse map $f^{-1}(z)$ of $f(z) = ${fz}$.`, `$f(z) = ${fz}$ の逆写像 $f^{-1}(z)$ を求めてください。`],
          a: { type: 'expr', v: `(${d}z-(${b}))/(-(${c})z+${a})`, vars: ['z'], dom: { z: [-0.4, 0.4] }, lhs: ['$f^{-1}(z) =$', '$f^{-1}(z) =$'] },
          hint: ['The inverse of the matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ is proportional to $\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$, and matrices compose like the maps.', '行列 $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ の逆は $\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$ に比例し、行列は写像と同じように合成されます。'],
          sol: [[`Solve $w = f(z)$ for $z$: $w(${c}z + ${d}) = ${a}z + ${b}$, so $z(${c}w - ${a}) = ${b} - ${d}w$.`, `$w = f(z)$ を $z$ について解くと、$w(${c}z + ${d}) = ${a}z + ${b}$ より $z(${c}w - ${a}) = ${b} - ${d}w$ です。`], [`$f^{-1}(z) = \\dfrac{${d}z - (${b})}{-${c}z + ${a}}$, the map of the adjugate matrix.`, `$f^{-1}(z) = \\dfrac{${d}z - (${b})}{-${c}z + ${a}}$ で、余因子行列に対応する写像です。`]],
        };
      }
      const amount = r.step(0.1, 1, 0.05), kind = r.int(0, 1);
      if (kind === 0) {
        const tr2 = 4 * Math.cos(amount * PI / 2) ** 2;
        return {
          q: [`The elliptic map $z \\mapsto e^{i\\alpha}z$ with $\\alpha = ${n(amount)}\\pi$ is written with a normalised matrix ($ad - bc = 1$). What is $\\operatorname{tr}^2$?`, `楕円型の写像 $z \\mapsto e^{i\\alpha}z$（$\\alpha = ${n(amount)}\\pi$）を正規化した行列（$ad - bc = 1$）で表します。$\\operatorname{tr}^2$ はいくつですか。`],
          a: { type: 'num', v: tr2, tol: 5e-4 },
          hint: ['Use $\\operatorname{diag}(e^{i\\alpha/2}, e^{-i\\alpha/2})$.', '$\\operatorname{diag}(e^{i\\alpha/2}, e^{-i\\alpha/2})$ を使います。'],
          sol: [[`$\\operatorname{tr} = e^{i\\alpha/2} + e^{-i\\alpha/2} = 2\\cos(\\alpha/2)$.`, `$\\operatorname{tr} = e^{i\\alpha/2} + e^{-i\\alpha/2} = 2\\cos(\\alpha/2)$ です。`], [`$\\operatorname{tr}^2 = 4\\cos^2(${n(amount / 2)}\\pi) = ${n(tr2, 4)}$, real and below 4 as an elliptic map's must be.`, `$\\operatorname{tr}^2 = 4\\cos^2(${n(amount / 2)}\\pi) = ${n(tr2, 4)}$ で、楕円型らしく 4 未満の実数です。`]],
          set: { kind: 0, amount },
        };
      }
      const k = Math.exp(2 * amount), tr2 = k + 2 + 1 / k;
      return {
        q: [`The hyperbolic map $z \\mapsto kz$ with $k = e^{${n(2 * amount)}}$ is written with a normalised matrix. What is $\\operatorname{tr}^2$?`, `双曲型の写像 $z \\mapsto kz$（$k = e^{${n(2 * amount)}}$）を正規化した行列で表します。$\\operatorname{tr}^2$ はいくつですか。`],
        a: { type: 'num', v: tr2, rel: 0.002 },
        hint: ['Use $\\operatorname{diag}(\\sqrt k, 1/\\sqrt k)$.', '$\\operatorname{diag}(\\sqrt k, 1/\\sqrt k)$ を使います。'],
        sol: [[`$\\operatorname{tr}^2 = (\\sqrt k + 1/\\sqrt k)^2 = k + 2 + 1/k$.`, `$\\operatorname{tr}^2 = (\\sqrt k + 1/\\sqrt k)^2 = k + 2 + 1/k$ です。`], [`$= ${n(k, 4)} + 2 + ${n(1 / k, 4)} = ${n(tr2, 4)} > 4$.`, `$= ${n(k, 4)} + 2 + ${n(1 / k, 4)} = ${n(tr2, 4)} > 4$ です。`]],
        set: { kind: 1, amount },
      };
    },
  ];
})();
