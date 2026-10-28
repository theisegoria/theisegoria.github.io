'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI;
  const K = 8.9875517923e9, EPS0 = 8.8541878128e-12, QE = 1.602176634e-19, ME = 9.1093837015e-31, MP = 1.67262192369e-27, AMU = 1.66053906660e-27;
  const s3 = (x) => sig(x, 3);
  const sgn = (x) => (x < 0 ? `-${Math.abs(x)}` : `${x}`);
  // scale a pair of charges so the larger magnitude is 2, and keep it only if both land exactly on the 0.1 steps
  const fitPair = (a, b) => {
    const s = 2 / Math.max(Math.abs(a), Math.abs(b)), x = a * s, y = b * s;
    const ok = (z) => Math.abs(z * 10 - Math.round(z * 10)) < 1e-9;
    return ok(x) && ok(y) ? { q1: Math.round(x * 10) / 10, q2: Math.round(y * 10) / 10 } : undefined;
  };

  /* ---------------- 1. electric field of point charges ---------------- */
  Q['electric-field'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const q1 = r.pick([1, 2, 3, 4, 5, -2, -3]), q2 = r.pick([1, 2, 4, -1, -2, -5]), d = r.pick([2, 3, 5, 10, 20]);
        const F = K * Math.abs(q1 * q2) * 1e-12 / (d / 100) ** 2, att = q1 * q2 < 0;
        return {
          q: [`Charges of $${sgn(q1)}\\ \\mu\\text{C}$ and $${sgn(q2)}\\ \\mu\\text{C}$ sit $${d}$ cm apart. What is the magnitude of the force between them?`, `$${sgn(q1)}\\ \\mu\\text{C}$ と $${sgn(q2)}\\ \\mu\\text{C}$ の電荷が $${d}$ cm 離れて置かれています。互いにはたらく力の大きさはいくらですか。`],
          a: { type: 'num', v: F, rel: 0.01, unit: ['N', 'N'] },
          hint: ['Coulomb: $F = k|q_1q_2|/r^2$ with $k = 8.99\\times10^9\\ \\text{N m}^2/\\text{C}^2$, and every length in metres.', 'クーロンの法則 $F = k|q_1q_2|/r^2$ を使います。$k = 8.99\\times10^9\\ \\text{N m}^2/\\text{C}^2$ で、長さはすべてメートルにします。'],
          sol: [[`$F = 8.99\\times10^9 \\times \\dfrac{${Math.abs(q1 * q2)}\\times10^{-12}}{(${n(d / 100)})^2} = ${s3(F)}$ N.`, `$F = 8.99\\times10^9 \\times \\dfrac{${Math.abs(q1 * q2)}\\times10^{-12}}{(${n(d / 100)})^2} = ${s3(F)}$ N です。`], [att ? 'The charges have opposite signs, so the force is attractive and pulls them together along the line joining them.' : 'The charges have the same sign, so the force is repulsive and pushes them apart along the line joining them.', att ? '符号が逆なので引力で、二つを結ぶ直線に沿って引き寄せ合います。' : '符号が同じなので斥力で、二つを結ぶ直線に沿って押し離し合います。']],
        };
      }
      if (form === 1) {
        const q = r.pick([1, 2, 3, 5, 10, 20]), d = r.pick([5, 10, 20, 30, 50]);
        const E = K * q * 1e-9 / (d / 100) ** 2;
        return {
          q: [`How strong is the electric field $${d}$ cm from a point charge of $${q}$ nC?`, `$${q}$ nC の点電荷から $${d}$ cm 離れた点の電場の強さはいくらですか。`],
          a: { type: 'num', v: E, rel: 0.01, unit: ['N/C', 'N/C'] },
          hint: ['$E = kq/r^2$: the field is the force per unit test charge.', '$E = kq/r^2$ です。電場は試験電荷1クーロンあたりの力です。'],
          sol: [[`$E = 8.99\\times10^9 \\times ${q}\\times10^{-9} / (${n(d / 100)})^2 = ${s3(E)}$ N/C.`, `$E = 8.99\\times10^9 \\times ${q}\\times10^{-9} / (${n(d / 100)})^2 = ${s3(E)}$ N/C です。`], ['Doubling the distance quarters the field: the same field lines spread over four times the area.', '距離を2倍にすると電場は4分の1になります。同じ本数の力線が4倍の面積に広がるからです。']],
        };
      }
      const q1 = r.step(-2, 2, 0.5) || 1, q2 = r.step(-2, 2, 0.5) || -1, F = q1 * q2 / 1.6 ** 2;
      return {
        q: [`In the figure's units ($1/4\\pi\\varepsilon_0 = 1$) the charges start $1.6$ apart. With $q_1 = ${n(q1)}$ and $q_2 = ${n(q2)}$, what is the magnitude of the force between them?`, `図の単位（$1/4\\pi\\varepsilon_0 = 1$）では、二つの電荷は最初 $1.6$ 離れています。$q_1 = ${n(q1)}$、$q_2 = ${n(q2)}$ のとき、互いの力の大きさはいくらですか。`],
        a: { type: 'num', v: Math.abs(F) },
        hint: ['In these units Coulomb\'s law is just $F = q_1q_2/r^2$.', 'この単位ではクーロンの法則は単に $F = q_1q_2/r^2$ です。'],
        sol: [[`$|F| = |${n(q1)}\\times${n(q2)}|/1.6^2 = ${n(Math.abs(q1 * q2))}/2.56 = ${n(Math.abs(F), 4)}$.`, `$|F| = |${n(q1)}\\times${n(q2)}|/1.6^2 = ${n(Math.abs(q1 * q2))}/2.56 = ${n(Math.abs(F), 4)}$ です。`], [F < 0 ? 'The product is negative, so the charges attract; the readout says the same.' : 'The product is positive, so the charges repel; the readout says the same.', F < 0 ? '積が負なので引き合います。読み取り欄も同じことを示します。' : '積が正なので反発し合います。読み取り欄も同じことを示します。']],
        set: { q1, q2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let q1, q2; do { q1 = r.pick([1, 2, 3, 4, -1, -2, -3]); q2 = r.pick([1, 2, 3, 5, -1, -2, -4]); } while (q1 === q2);
        const d = r.pick([4, 6, 10, 20]), half = d / 200, Ex = K * (q1 - q2) * 1e-9 / half ** 2;
        return {
          q: [`Charge $q_1 = ${sgn(q1)}$ nC is at the left and $q_2 = ${sgn(q2)}$ nC is $${d}$ cm to its right. Find the magnitude of the electric field halfway between them.`, `左に $q_1 = ${sgn(q1)}$ nC、その $${d}$ cm 右に $q_2 = ${sgn(q2)}$ nC があります。二つの中点での電場の大きさを求めてください。`],
          a: { type: 'num', v: Math.abs(Ex), rel: 0.01, unit: ['N/C', 'N/C'] },
          hint: ['Each charge alone gives $kq/(d/2)^2$ at the midpoint. Work out which way each one points before adding.', '中点ではそれぞれの電荷が単独で $kq/(d/2)^2$ の電場をつくります。足す前に、それぞれの向きを確かめてください。'],
          sol: [[`Take $+x$ to the right. $q_1$ gives $E_x = kq_1/(d/2)^2$ (away from a positive charge), and $q_2$ gives $E_x = -kq_2/(d/2)^2$.`, `右向きを $+x$ とします。$q_1$ による寄与は $E_x = kq_1/(d/2)^2$（正電荷から遠ざかる向き）、$q_2$ による寄与は $E_x = -kq_2/(d/2)^2$ です。`], [`$E_x = k(q_1 - q_2)/(d/2)^2 = 8.99\\times10^9 \\times (${n(q1 - q2)}\\times10^{-9})/(${n(half)})^2 = ${s3(Ex)}$ N/C.`, `$E_x = k(q_1 - q_2)/(d/2)^2 = 8.99\\times10^9 \\times (${n(q1 - q2)}\\times10^{-9})/(${n(half)})^2 = ${s3(Ex)}$ N/C です。`], [q1 * q2 < 0 ? 'Opposite charges reinforce each other between them: both fields point from the positive charge towards the negative one.' : 'Like charges partly cancel between them; the field points away from the larger one.', q1 * q2 < 0 ? '異符号の電荷では、間の電場は強め合います。どちらも正電荷から負電荷へ向かうからです。' : '同符号の電荷では間の電場は一部打ち消し合い、大きい方の電荷から遠ざかる向きになります。']],
          set: fitPair(q1, q2),
        };
      }
      if (form === 1) {
        const q1 = r.pick([1, 2, 3, 5, -1, -2, -4]), q2 = r.pick([1, 2, 4, -1, -2, -3, -5]), d = r.pick([2, 4, 10, 20]);
        const V = K * (q1 + q2) * 1e-9 / (d / 200);
        return {
          q: [`Charges $${sgn(q1)}$ nC and $${sgn(q2)}$ nC are $${d}$ cm apart. What is the electric potential at the midpoint (zero at infinity)? Give the sign.`, `$${sgn(q1)}$ nC と $${sgn(q2)}$ nC の電荷が $${d}$ cm 離れています。中点の電位（無限遠を 0 とする）はいくらですか。符号もつけてください。`],
          a: { type: 'num', v: V, rel: 0.01, tol: 0.5, unit: ['V', 'V'] },
          hint: ['Potential is a scalar: add $kq/r$ for each charge, with its sign, and no directions at all.', '電位はスカラーです。向きは考えず、各電荷の $kq/r$ を符号ごと足します。'],
          sol: [[`Each charge is $${n(d / 200)}$ m from the midpoint, so $V = k(q_1 + q_2)/(d/2)$.`, `各電荷は中点から $${n(d / 200)}$ m の距離にあるので $V = k(q_1 + q_2)/(d/2)$ です。`], [`$V = 8.99\\times10^9 \\times ${n(q1 + q2)}\\times10^{-9}/${n(d / 200)} = ${Math.abs(V) < 0.5 ? '0' : s3(V)}$ V.`, `$V = 8.99\\times10^9 \\times ${n(q1 + q2)}\\times10^{-9}/${n(d / 200)} = ${Math.abs(V) < 0.5 ? '0' : s3(V)}$ V です。`], [q1 + q2 === 0 ? 'The potential vanishes but the field does not: for equal and opposite charges the midpoint is on the zero equipotential, which the field lines cross at right angles.' : 'Unlike the field, the potential at the midpoint depends only on the total charge, not on how it is split.', q1 + q2 === 0 ? '電位は 0 ですが電場は 0 ではありません。大きさが等しく符号が逆の電荷では、中点は電位 0 の等電位線上にあり、力線はそこを直角に横切ります。' : '電場と違って、中点の電位は総電荷だけで決まり、その分け方にはよりません。']],
        };
      }
      const [a, b] = r.pick([[1, 4], [4, 1], [1, 9], [9, 4], [4, 9], [2, 8], [8, 2], [9, 1], [1, 1]]), d = r.pick([10, 12, 20, 30, 60]), sg = r.chance(0.3) ? -1 : 1;
      const x = d * Math.sqrt(a) / (Math.sqrt(a) + Math.sqrt(b));
      return {
        q: [`Charges $${sg * a}$ µC and $${sg * b}$ µC are $${d}$ cm apart. How far from the first charge, on the line between them, is the electric field zero?`, `$${sg * a}$ µC と $${sg * b}$ µC の電荷が $${d}$ cm 離れています。二つを結ぶ線分上で電場が 0 になる点は、最初の電荷から何 cm の所ですか。`],
        a: { type: 'num', v: x, rel: 0.005, unit: ['cm', 'cm'] },
        hint: ['At the null point the two fields have equal size and opposite directions: $q_1/x^2 = q_2/(d - x)^2$.', '電場が 0 の点では二つの電場が同じ大きさで逆向きです。$q_1/x^2 = q_2/(d - x)^2$ となります。'],
        sol: [[`$\\dfrac{${a}}{x^2} = \\dfrac{${b}}{(${d} - x)^2}$, so $\\dfrac{${d} - x}{x} = \\sqrt{${b}/${a}}$.`, `$\\dfrac{${a}}{x^2} = \\dfrac{${b}}{(${d} - x)^2}$ より $\\dfrac{${d} - x}{x} = \\sqrt{${b}/${a}}$ です。`], [`$x = \\dfrac{${d}\\sqrt{${a}}}{\\sqrt{${a}} + \\sqrt{${b}}} = ${n(x, 3)}$ cm.`, `$x = \\dfrac{${d}\\sqrt{${a}}}{\\sqrt{${a}} + \\sqrt{${b}}} = ${n(x, 3)}$ cm です。`], ['The null point sits closer to the smaller charge, where its weaker field is still strong enough to cancel the larger one\'s. In the figure it is where field lines from the two charges meet head on.', '電場が 0 の点は小さい方の電荷に近い側にあります。弱い電場でも、そこならまだ大きい電荷の電場を打ち消せるからです。図では二つの電荷からの力線が正面からぶつかる点です。']],
        set: fitPair(sg * a, sg * b),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b] = r.pick([[4, 1], [9, 1], [9, 4], [16, 9], [16, 1], [25, 4]]), d = r.pick([5, 10, 20, 30]);
        const x = d * Math.sqrt(b) / (Math.sqrt(a) - Math.sqrt(b));
        return {
          q: [`A charge $+${a}$ µC and a charge $-${b}$ µC are $${d}$ cm apart. The electric field vanishes at one point on the line through them, not between them. How far beyond the $-${b}$ µC charge is it?`, `$+${a}$ µC と $-${b}$ µC の電荷が $${d}$ cm 離れています。二つを通る直線上で、両者の間ではない一点で電場が 0 になります。それは $-${b}$ µC の電荷の外側、何 cm の所ですか。`],
          a: { type: 'num', v: x, rel: 0.005, unit: ['cm', 'cm'] },
          hint: ['Between opposite charges the fields add, so look outside, on the side of the smaller charge: $a/(d + x)^2 = b/x^2$.', '異符号の電荷の間では電場は強め合うので、外側の小さい電荷の側を探します。$a/(d + x)^2 = b/x^2$ です。'],
          sol: [['Between the charges both fields point the same way, and beyond the larger charge its field always wins, so the null point is beyond the smaller one.', '電荷の間では二つの電場は同じ向きで、大きい電荷の外側ではその電場が常に勝つので、0 になる点は小さい電荷の外側にあります。'], [`$\\dfrac{${a}}{(${d} + x)^2} = \\dfrac{${b}}{x^2}$ gives $\\dfrac{${d} + x}{x} = \\sqrt{${a}/${b}} = ${n(Math.sqrt(a / b), 4)}$.`, `$\\dfrac{${a}}{(${d} + x)^2} = \\dfrac{${b}}{x^2}$ から $\\dfrac{${d} + x}{x} = \\sqrt{${a}/${b}} = ${n(Math.sqrt(a / b), 4)}$ です。`], [`$x = \\dfrac{${d}}{${n(Math.sqrt(a / b), 4)} - 1} = ${n(x, 3)}$ cm. There the closer, smaller charge balances the farther, larger one; it is the saddle point where field lines turn back.`, `$x = \\dfrac{${d}}{${n(Math.sqrt(a / b), 4)} - 1} = ${n(x, 3)}$ cm です。そこでは近くの小さな電荷が遠くの大きな電荷とつり合っており、力線が折り返す鞍点になっています。`]],
          set: fitPair(a, -b),
        };
      }
      if (form === 1) {
        const q = r.pick([1, 2, 3]), h = r.pick([0.5, 1, 1.5]);
        return {
          q: [`In units with $1/4\\pi\\varepsilon_0 = 1$, a charge $+${q}$ sits at $x = -${n(h)}$ and $-${q}$ at $x = ${n(h)}$. Write the field $E_x(x)$ on the axis for $x > ${n(h)}$.`, `$1/4\\pi\\varepsilon_0 = 1$ の単位で、$x = -${n(h)}$ に $+${q}$、$x = ${n(h)}$ に $-${q}$ の電荷があります。$x > ${n(h)}$ の軸上の電場 $E_x(x)$ を式で書いてください。`],
          a: { type: 'expr', v: `${q}/(x+${h})^2 - ${q}/(x-${h})^2`, vars: ['x'], dom: { x: [h + 0.6, h + 4] }, lhs: ['$E_x(x) =$', '$E_x(x) =$'] },
          hint: ['The positive charge pushes a test charge in $+x$, the negative one pulls it back towards $-x$.', '正電荷は試験電荷を $+x$ 向きに押し、負電荷は $-x$ 向きに引き戻します。'],
          sol: [[`From $+${q}$: $+${q}/(x + ${n(h)})^2$. From $-${q}$: $-${q}/(x - ${n(h)})^2$, which is larger because it is closer.`, `$+${q}$ からは $+${q}/(x + ${n(h)})^2$、$-${q}$ からは $-${q}/(x - ${n(h)})^2$ で、近い分だけ後者が大きくなります。`], [`$E_x = \\dfrac{${q}}{(x + ${n(h)})^2} - \\dfrac{${q}}{(x - ${n(h)})^2}$, negative: the field points back towards the dipole.`, `$E_x = \\dfrac{${q}}{(x + ${n(h)})^2} - \\dfrac{${q}}{(x - ${n(h)})^2}$ で、負です。電場は双極子の方を向きます。`], [`Far away this is about $-${n(4 * q * h)}/x^3 = -2p/x^3$ with dipole moment $p = ${n(2 * q * h)}$: a dipole's field falls as $1/r^3$, one power faster than a single charge's.`, `遠方では双極子モーメント $p = ${n(2 * q * h)}$ を用いて約 $-${n(4 * q * h)}/x^3 = -2p/x^3$ です。双極子の場は $1/r^3$ で減り、単独の電荷より一段速く弱まります。`]],
          set: q <= 2 ? { q1: q, q2: -q } : undefined,
        };
      }
      const q1 = r.pick([2, 3, 5, 8, -4]), q2 = r.pick([-2, -3, -5, 1, 4]), both = r.chance(0.6);
      const Qenc = (both ? q1 + q2 : q1) * 1e-9, flux = Qenc / EPS0;
      return {
        q: [both ? `A closed surface surrounds both a $${sgn(q1)}$ nC charge and a $${sgn(q2)}$ nC charge. What is the electric flux out of it?` : `A closed surface surrounds a $${sgn(q1)}$ nC charge, while a $${sgn(q2)}$ nC charge sits just outside it. What is the electric flux out of the surface?`, both ? `閉曲面が $${sgn(q1)}$ nC と $${sgn(q2)}$ nC の二つの電荷を囲んでいます。この面から出ていく電束はいくらですか。` : `閉曲面が $${sgn(q1)}$ nC の電荷を囲み、そのすぐ外に $${sgn(q2)}$ nC の電荷があります。この面から出ていく電束はいくらですか。`],
        a: { type: 'num', v: flux, rel: 0.01, tol: 0.5, unit: ['N m²/C', 'N m²/C'] },
        hint: ['Gauss\'s law: only the enclosed charge counts, $\\Phi_E = Q_{\\text{enc}}/\\varepsilon_0$.', 'ガウスの法則では囲まれた電荷だけが効きます。$\\Phi_E = Q_{\\text{enc}}/\\varepsilon_0$ です。'],
        sol: [[both ? `$Q_{\\text{enc}} = ${sgn(q1)} + ${sgn(q2)} = ${n(q1 + q2)}$ nC.` : `Only the inside charge counts: $Q_{\\text{enc}} = ${sgn(q1)}$ nC. Every field line from the outside charge that enters the surface also leaves it.`, both ? `$Q_{\\text{enc}} = ${sgn(q1)} + ${sgn(q2)} = ${n(q1 + q2)}$ nC です。` : `内側の電荷だけが効き、$Q_{\\text{enc}} = ${sgn(q1)}$ nC です。外の電荷からの力線は、面に入ったものがすべてまた出ていきます。`], [`$\\Phi_E = ${n(Qenc * 1e9)}\\times10^{-9}/8.85\\times10^{-12} = ${s3(flux)}$ N m²/C.`, `$\\Phi_E = ${n(Qenc * 1e9)}\\times10^{-9}/8.85\\times10^{-12} = ${s3(flux)}$ N m²/C です。`], ['This is why line counts mean something in 3D: the number of field lines leaving a surface is proportional to the charge inside, whatever its shape.', 'これが 3 次元で力線の本数に意味がある理由です。面から出る力線の本数は、面の形によらず内側の電荷に比例します。']],
      };
    },
  ];

  /* ---------------- 2. Lorentz force ---------------- */
  Q.lorentz = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.step(0.2, 2, 0.1);
        return {
          q: [`In the figure's units ($q = m = v_\\perp = 1$), what is the radius of the circle when $B = ${n(b)}$?`, `図の単位（$q = m = v_\\perp = 1$）で、$B = ${n(b)}$ のときの円の半径はいくらですか。`],
          a: { type: 'num', v: 1 / b },
          hint: ['The magnetic force $qv_\\perp B$ supplies the centripetal force $mv_\\perp^2/r$.', '磁気力 $qv_\\perp B$ が向心力 $mv_\\perp^2/r$ になります。'],
          sol: [['$qv_\\perp B = mv_\\perp^2/r$ gives $r = mv_\\perp/(qB)$.', '$qv_\\perp B = mv_\\perp^2/r$ から $r = mv_\\perp/(qB)$ です。'], [`$r = 1/${n(b)} = ${n(1 / b, 4)}$: a stronger field bends the path into a tighter circle.`, `$r = 1/${n(b)} = ${n(1 / b, 4)}$ です。磁場が強いほど軌道はきつい円に曲がります。`]],
          set: { b },
        };
      }
      if (form === 1) {
        const e = r.chance(0.5), B = e ? r.pick([1, 2, 5, 10, 50]) * 1e-3 : r.pick([0.5, 1, 1.5, 2, 3]);
        const f = QE * B / (2 * PI * (e ? ME : MP));
        return {
          q: [`What is the cyclotron frequency $f = qB/2\\pi m$ of ${e ? 'an electron' : 'a proton'} in a field of ${e ? `$${n(B * 1e3)}$ mT` : `$${n(B)}$ T`}?`, `${e ? `$${n(B * 1e3)}$ mT` : `$${n(B)}$ T`} の磁場中での${e ? '電子' : '陽子'}のサイクロトロン周波数 $f = qB/2\\pi m$ はいくらですか。`],
          a: { type: 'num', v: f / 1e6, rel: 0.01, unit: ['MHz', 'MHz'] },
          hint: [`$m_${e ? 'e' : 'p'} = ${e ? '9.11\\times10^{-31}' : '1.673\\times10^{-27}'}$ kg and $e = 1.602\\times10^{-19}$ C.`, `$m_${e ? 'e' : 'p'} = ${e ? '9.11\\times10^{-31}' : '1.673\\times10^{-27}'}$ kg、$e = 1.602\\times10^{-19}$ C です。`],
          sol: [[`$f = \\dfrac{1.602\\times10^{-19}\\times${s3(B)}}{2\\pi\\times${e ? '9.11\\times10^{-31}' : '1.673\\times10^{-27}'}} = ${s3(f)}$ Hz $= ${s3(f / 1e6)}$ MHz.`, `$f = \\dfrac{1.602\\times10^{-19}\\times${s3(B)}}{2\\pi\\times${e ? '9.11\\times10^{-31}' : '1.673\\times10^{-27}'}} = ${s3(f)}$ Hz $= ${s3(f / 1e6)}$ MHz です。`], ['The frequency does not depend on the speed: faster particles move on larger circles in the same time. That is what lets a cyclotron use one fixed radio frequency.', '周波数は速さによりません。速い粒子ほど大きな円を同じ時間で回るからです。サイクロトロンが一定の高周波で加速できるのはこのためです。']],
        };
      }
      const which = r.int(0, 1);
      return {
        q: [which ? 'A charged particle circles in a uniform magnetic field. If the field is made stronger, what happens to the radius and the period of the circle?' : 'A charged particle circles in a uniform magnetic field. If its speed is doubled, what happens to the radius and the period?', which ? '一様な磁場中で荷電粒子が円運動しています。磁場を強くすると、円の半径と周期はどうなりますか。' : '一様な磁場中で荷電粒子が円運動しています。速さを2倍にすると、半径と周期はどうなりますか。'],
        a: { type: 'choice', v: which ? 0 : 1, opts: [['Both shrink, in proportion to $1/B$', 'どちらも $1/B$ に比例して小さくなる'], ['The radius doubles and the period stays the same', '半径は2倍になり、周期は変わらない'], ['The radius changes but the period is fixed by the charge alone', '半径は変わるが、周期は電荷だけで決まり変わらない'], ['Both double', 'どちらも2倍になる']] },
        hint: ['$r = mv_\\perp/qB$ and $T = 2\\pi r/v_\\perp = 2\\pi m/qB$.', '$r = mv_\\perp/qB$、$T = 2\\pi r/v_\\perp = 2\\pi m/qB$ です。'],
        sol: [['$r = mv_\\perp/(qB)$ grows with speed and shrinks with field.', '$r = mv_\\perp/(qB)$ は速さとともに大きく、磁場とともに小さくなります。'], ['$T = 2\\pi m/(qB)$ contains no speed at all, so only the field changes it.', '$T = 2\\pi m/(qB)$ には速さが含まれないので、周期を変えるのは磁場だけです。'], [which ? 'A stronger field gives a tighter and faster circle, as the slider shows.' : 'Twice the speed covers twice the circumference in the same time.', which ? 'スライダーで確かめられるように、磁場が強いほど円は小さく速くなります。' : '2倍の速さで2倍の円周を同じ時間で回ります。']],
        set: which ? { b: 2 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const e = r.chance(0.5), v = e ? r.pick([2, 3, 5, 8]) * 1e6 : r.pick([1, 2, 4, 5]) * 1e5, B = e ? r.pick([1, 2, 5]) * 1e-3 : r.pick([0.1, 0.2, 0.5]), al = r.pick([30, 45, 60, 90]);
        const m = e ? ME : MP, rad = m * v * Math.sin(al * PI / 180) / (QE * B);
        return {
          q: [`${e ? 'An electron' : 'A proton'} moves at $${s3(v)}$ m/s at $${al}^\\circ$ to a magnetic field of ${e ? `$${n(B * 1e3)}$ mT` : `$${n(B)}$ T`}. What is the radius of its helix?`, `${e ? '電子' : '陽子'}が $${s3(v)}$ m/s で、${e ? `$${n(B * 1e3)}$ mT` : `$${n(B)}$ T`} の磁場と $${al}^\\circ$ の角をなして進みます。らせんの半径はいくらですか。`],
          a: { type: 'num', v: rad * 1000, rel: 0.01, unit: ['mm', 'mm'] },
          hint: ['Only the velocity component perpendicular to $B$ bends: $v_\\perp = v\\sin\\alpha$.', '曲げられるのは $B$ に垂直な速度成分だけです。$v_\\perp = v\\sin\\alpha$ です。'],
          sol: [[`$v_\\perp = ${s3(v)}\\sin ${al}^\\circ = ${s3(v * Math.sin(al * PI / 180))}$ m/s.`, `$v_\\perp = ${s3(v)}\\sin ${al}^\\circ = ${s3(v * Math.sin(al * PI / 180))}$ m/s です。`], [`$r = \\dfrac{mv_\\perp}{eB} = ${s3(rad)}$ m $= ${s3(rad * 1000)}$ mm.`, `$r = \\dfrac{mv_\\perp}{eB} = ${s3(rad)}$ m $= ${s3(rad * 1000)}$ mm です。`], [al === 90 ? 'With the velocity perpendicular to the field the helix closes into a circle.' : 'The parallel component carries the circle along the field, stretching it into a helix.', al === 90 ? '速度が磁場に垂直なので、らせんは閉じた円になります。' : '平行成分が円を磁場の方向へ運び、らせんに引き伸ばします。']],
        };
      }
      if (form === 1) {
        const b = r.step(0.2, 2, 0.1), vz = r.step(-1, 1, 0.1) || 0.5;
        const R = 1 / b, pitch = 2 * PI * Math.abs(vz) / b;
        return {
          q: [`In the figure's units ($q = m = v_\\perp = 1$), take $B = ${n(b)}$ and parallel velocity $v_\\parallel = ${n(vz)}$. Find the radius and the pitch of the helix.`, `図の単位（$q = m = v_\\perp = 1$）で、$B = ${n(b)}$、平行速度 $v_\\parallel = ${n(vz)}$ とします。らせんの半径とピッチを求めてください。`],
          a: { type: 'tuple', v: [R, pitch], labels: ['$r$', ['pitch', 'ピッチ']], rel: 0.005 },
          hint: ['The pitch is how far the particle drifts along $B$ in one period $T = 2\\pi/B$.', 'ピッチは、粒子が一周期 $T = 2\\pi/B$ の間に $B$ 方向へ進む距離です。'],
          sol: [[`$r = 1/B = ${n(R, 4)}$ and $T = 2\\pi/B = ${n(2 * PI / b, 4)}$.`, `$r = 1/B = ${n(R, 4)}$、$T = 2\\pi/B = ${n(2 * PI / b, 4)}$ です。`], [`Pitch $= |v_\\parallel|\\,T = ${n(Math.abs(vz))}\\times${n(2 * PI / b, 4)} = ${n(pitch, 4)}$.`, `ピッチ $= |v_\\parallel|\\,T = ${n(Math.abs(vz))}\\times${n(2 * PI / b, 4)} = ${n(pitch, 4)}$ です。`], ['Both numbers match the readout. The magnetic force never touches $v_\\parallel$, so the coils are evenly spaced.', 'どちらも読み取り欄と一致します。磁気力は $v_\\parallel$ に触れないので、巻きは等間隔です。']],
          set: { b, vz },
        };
      }
      if (r.chance(0.5)) {
        const b = r.step(0.5, 2, 0.1), e = r.step(0.1, 0.5, 0.1);
        return {
          q: [`In the figure's units, an electric field $E = ${n(e)}$ along $y$ is added to $B = ${n(b)}$ along $z$. How fast do the circles drift, and in which direction?`, `図の単位で、$z$ 方向の $B = ${n(b)}$ に $y$ 方向の電場 $E = ${n(e)}$ を加えます。円はどれだけの速さで、どちらへ流れますか。`],
          a: { type: 'num', v: e / b, unit: ['(along +x)', '（+x 方向）'] },
          hint: ['In a frame moving at $\\mathbf v_d = \\mathbf E\\times\\mathbf B/B^2$ the electric field disappears.', '速度 $\\mathbf v_d = \\mathbf E\\times\\mathbf B/B^2$ で動く系では電場が消えます。'],
          sol: [[`$\\mathbf E\\times\\mathbf B = E B\\,(\\hat y\\times\\hat z) = EB\\,\\hat x$, so $\\mathbf v_d = (E/B)\\,\\hat x$.`, `$\\mathbf E\\times\\mathbf B = E B\\,(\\hat y\\times\\hat z) = EB\\,\\hat x$ なので $\\mathbf v_d = (E/B)\\,\\hat x$ です。`], [`$v_d = ${n(e)}/${n(b)} = ${n(e / b, 4)}$ along $+x$, perpendicular to both fields.`, `$v_d = ${n(e)}/${n(b)} = ${n(e / b, 4)}$ で、両方の場に垂直な $+x$ 方向です。`], ['The particle speeds up on the half of the circle where $E$ pushes it and slows on the other half, so the circle is wider on one side and the orbit walks sideways.', '粒子は円の半分では $E$ に押されて速くなり、残りの半分では遅くなるので、円の片側が広がって軌道が横へずれていきます。']],
          set: { b, e },
        };
      }
      const E = r.pick([1, 2, 5, 10, 50]) * 1e3, B = r.pick([0.01, 0.02, 0.05, 0.1, 0.5]);
      return {
        q: [`Crossed fields $E = ${s3(E)}$ V/m and $B = ${n(B)}$ T act on a beam of ions. What is the drift speed $E/B$, which a velocity filter lets through undeflected?`, `直交する場 $E = ${s3(E)}$ V/m と $B = ${n(B)}$ T がイオンのビームにはたらきます。速度フィルターがまっすぐ通す速さ、すなわちドリフト速度 $E/B$ はいくらですか。`],
        a: { type: 'num', v: E / B, unit: ['m/s', 'm/s'] },
        hint: ['Undeflected means $qE = qvB$.', 'まっすぐ進むとは $qE = qvB$ ということです。'],
        sol: [[`$qE = qvB$ gives $v = E/B = ${s3(E)}/${n(B)} = ${s3(E / B)}$ m/s.`, `$qE = qvB$ から $v = E/B = ${s3(E)}/${n(B)} = ${s3(E / B)}$ m/s です。`], ['The charge and mass cancel: every ion at this speed passes, whatever it is, which is why the filter selects speed and not species.', '電荷と質量は打ち消し合うので、この速さのイオンは種類によらずすべて通ります。フィルターが選ぶのは速さで、種類ではありません。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([1, 2, 3, 0.5]), useDiam = r.chance(0.5), b = r.step(0.5, 1.5, 0.1);
        const vz = useDiam ? k / PI : k / (2 * PI);
        return {
          q: [`In the figure's units ($q = m = v_\\perp = 1$), what parallel velocity makes the pitch of the helix equal to ${k === 1 ? '' : `$${n(k)}$ times `}its ${useDiam ? 'diameter' : 'radius'}? Does the answer depend on $B$?`, `図の単位（$q = m = v_\\perp = 1$）で、らせんのピッチがその${useDiam ? '直径' : '半径'}${k === 1 ? 'に等しく' : `の $${n(k)}$ 倍に`}なる平行速度はいくらですか。答えは $B$ によりますか。`],
          a: { type: 'num', v: vz, rel: 0.005 },
          hint: ['Write both lengths in terms of $B$: $r = 1/B$ and pitch $= 2\\pi v_\\parallel/B$.', '二つの長さを $B$ で表します。$r = 1/B$、ピッチ $= 2\\pi v_\\parallel/B$ です。'],
          sol: [[`Pitch/${useDiam ? 'diameter' : 'radius'} $= \\dfrac{2\\pi v_\\parallel/B}{${useDiam ? '2' : '1'}/B} = ${useDiam ? '\\pi' : '2\\pi'} v_\\parallel$.`, `ピッチ/${useDiam ? '直径' : '半径'} $= \\dfrac{2\\pi v_\\parallel/B}{${useDiam ? '2' : '1'}/B} = ${useDiam ? '\\pi' : '2\\pi'} v_\\parallel$ です。`], [`Setting this to $${n(k)}$: $v_\\parallel = ${n(k)}/${useDiam ? '\\pi' : '2\\pi'} = ${n(vz, 4)}$.`, `これを $${n(k)}$ とおくと $v_\\parallel = ${n(k)}/${useDiam ? '\\pi' : '2\\pi'} = ${n(vz, 4)}$ です。`], ['$B$ cancels: changing the field rescales the whole helix without changing its shape, which only depends on the pitch angle $\\tan^{-1}(v_\\perp/v_\\parallel)$.', '$B$ は打ち消し合います。磁場を変えるとらせん全体が拡大縮小されるだけで、形はピッチ角 $\\tan^{-1}(v_\\perp/v_\\parallel)$ だけで決まります。']],
          set: { b, vz: Math.round(vz * 10) / 10 },
        };
      }
      if (form === 1) {
        const [m1, m2, el, el2] = r.pick([[35, 37, 'Cl', '塩素'], [12, 13, 'C', '炭素'], [20, 22, 'Ne', 'ネオン'], [6, 7, 'Li', 'リチウム'], [10, 11, 'B', 'ホウ素'], [63, 65, 'Cu', '銅']]);
        const V = r.pick([1, 2, 3, 5]) * 1e3, B = r.pick([0.2, 0.3, 0.4, 0.5]);
        const rad = (m) => Math.sqrt(2 * m * AMU * V / QE) / B, dx = 2 * (rad(m2) - rad(m1));
        return {
          q: [`Singly charged ions of $^{${m1}}\\text{${el}}$ and $^{${m2}}\\text{${el}}$ are accelerated through $${n(V / 1e3)}$ kV and enter a $${n(B)}$ T field at right angles. After half a circle they hit a plate. How far apart are the two spots?`, `1価の $^{${m1}}\\text{${el}}$ と $^{${m2}}\\text{${el}}$（${el2}）のイオンを $${n(V / 1e3)}$ kV で加速し、$${n(B)}$ T の磁場に垂直に入れます。半円を描いた後に板に当たるとき、二つの当たる点はどれだけ離れていますか。`],
          a: { type: 'num', v: dx * 1000, rel: 0.02, unit: ['mm', 'mm'] },
          hint: ['Energy gives the speed, $\\tfrac12mv^2 = eV$; then $r = mv/eB = \\sqrt{2mV/e}/B$. The spot is a diameter from the entrance.', 'エネルギーから速さが決まり、$\\tfrac12mv^2 = eV$、そこから $r = mv/eB = \\sqrt{2mV/e}/B$ です。当たる点は入口から直径の距離です。'],
          sol: [[`$r_{${m1}} = \\sqrt{2\\times${m1}u\\times${n(V)}/e}\\,/\\,${n(B)} = ${s3(rad(m1))}$ m.`, `$r_{${m1}} = \\sqrt{2\\times${m1}u\\times${n(V)}/e}\\,/\\,${n(B)} = ${s3(rad(m1))}$ m です。`], [`$r_{${m2}} = r_{${m1}}\\sqrt{${m2}/${m1}} = ${s3(rad(m2))}$ m.`, `$r_{${m2}} = r_{${m1}}\\sqrt{${m2}/${m1}} = ${s3(rad(m2))}$ m です。`], [`The spots are $2(r_{${m2}} - r_{${m1}}) = ${s3(dx * 1000)}$ mm apart. Since $r \\propto \\sqrt m$, heavier isotopes land farther out, which is how a mass spectrometer sorts them.`, `二点の距離は $2(r_{${m2}} - r_{${m1}}) = ${s3(dx * 1000)}$ mm です。$r \\propto \\sqrt m$ なので重い同位体ほど外側に当たります。質量分析計はこうして同位体を分けます。`]],
        };
      }
      const E = r.pick([0.5, 1, 2, 3, 5]) * 1e3, B = r.pick([0.5, 1, 2, 3]) * 1e-3;
      const d = 2 * PI * ME * E / (QE * B * B);
      return {
        q: [`An electron starts at rest in crossed fields $E = ${n(E / 1e3)}$ kV/m and $B = ${n(B * 1e3)}$ mT. Its path is a cycloid. How far does it move along the drift direction in one cyclotron period?`, `電子が直交する場 $E = ${n(E / 1e3)}$ kV/m、$B = ${n(B * 1e3)}$ mT の中で静止状態から動き出します。軌道はサイクロイドになります。1サイクロトロン周期の間にドリフト方向へどれだけ進みますか。`],
        a: { type: 'num', v: d * 100, rel: 0.01, unit: ['cm', 'cm'] },
        hint: ['In the frame drifting at $E/B$ the electron starts with speed $E/B$ and simply circles. In the lab, the guiding centre moves $E/B$ times one period.', '速さ $E/B$ でドリフトする系では、電子は速さ $E/B$ で出発して円を描くだけです。実験室系では、案内中心が $E/B$ と一周期の積だけ進みます。'],
        sol: [[`Drift speed $v_d = E/B = ${s3(E / B)}$ m/s; period $T = 2\\pi m/(eB) = ${s3(2 * PI * ME / (QE * B))}$ s.`, `ドリフト速度は $v_d = E/B = ${s3(E / B)}$ m/s、周期は $T = 2\\pi m/(eB) = ${s3(2 * PI * ME / (QE * B))}$ s です。`], [`Distance $= v_dT = 2\\pi mE/(eB^2) = ${s3(d)}$ m $= ${s3(d * 100)}$ cm.`, `距離は $v_dT = 2\\pi mE/(eB^2) = ${s3(d)}$ m $= ${s3(d * 100)}$ cm です。`], [`It starts and stops at the cusps, where it is momentarily at rest, and reaches $2E/B = ${s3(2 * E / B)}$ m/s at the top of each arch: the cycloid of a point on a rolling wheel.`, `電子は尖点で瞬間的に止まり、各アーチの頂点で $2E/B = ${s3(2 * E / B)}$ m/s に達します。転がる車輪上の一点が描くサイクロイドです。`]],
      };
    },
  ];

  /* ---------------- 3. Faraday induction ---------------- */
  const flux = (x) => 1 / (1 + x * x) ** 1.5;
  const emf = (x, v) => 3 * x * v / (1 + x * x) ** 2.5;
  Q.induction = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([1, 10, 20, 50, 100, 200]), rc = r.pick([2, 3, 5, 10]), B1 = r.pick([0, 0.1, 0.2]), B2 = r.pick([0.3, 0.5, 0.8, 1]), dt = r.pick([10, 20, 50, 100]);
        const A = PI * (rc / 100) ** 2, E = N * A * (B2 - B1) / (dt / 1000);
        return {
          q: [`A coil of $${N}$ turn${N > 1 ? 's' : ''}, radius $${rc}$ cm, sits in a uniform field along its axis that rises steadily from $${n(B1)}$ T to $${n(B2)}$ T in $${dt}$ ms. What emf is induced?`, `半径 $${rc}$ cm、$${N}$ 巻きのコイルが、軸方向の一様な磁場の中にあります。磁場は $${dt}$ ms で $${n(B1)}$ T から $${n(B2)}$ T まで一定の割合で増えます。誘導起電力の大きさはいくらですか。`],
          a: { type: 'num', v: E, rel: 0.01, unit: ['V', 'V'] },
          hint: ['$|\\mathcal E| = N\\,\\Delta\\Phi/\\Delta t$ with $\\Phi = BA$.', '$|\\mathcal E| = N\\,\\Delta\\Phi/\\Delta t$、$\\Phi = BA$ です。'],
          sol: [[`$A = \\pi(${n(rc / 100)})^2 = ${s3(A)}$ m², so $\\Delta\\Phi = ${s3(A * (B2 - B1))}$ Wb per turn.`, `$A = \\pi(${n(rc / 100)})^2 = ${s3(A)}$ m² なので、1巻きあたり $\\Delta\\Phi = ${s3(A * (B2 - B1))}$ Wb です。`], [`$|\\mathcal E| = ${N}\\times${s3(A * (B2 - B1))}/${n(dt / 1000)} = ${s3(E)}$ V, constant while the field ramps.`, `$|\\mathcal E| = ${N}\\times${s3(A * (B2 - B1))}/${n(dt / 1000)} = ${s3(E)}$ V で、磁場が増えている間は一定です。`]],
        };
      }
      if (form === 1) {
        const x = r.step(-2, 2, 0.1);
        return {
          q: [`In the figure the flux through the loop is $\\Phi(x) = 1/(1 + x^2)^{3/2}$, where $x$ is the magnet's position. What is $\\Phi$ when $x = ${n(x)}$? Give three decimals.`, `図ではループを貫く磁束は $\\Phi(x) = 1/(1 + x^2)^{3/2}$ で、$x$ は磁石の位置です。$x = ${n(x)}$ のときの $\\Phi$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: flux(x), tol: 0.0006 },
          hint: ['This is the flux of a small magnet (a dipole) through a loop of radius 1 on its axis.', 'これは軸上にある小さな磁石（双極子）の磁束が半径 1 のループを貫く量です。'],
          sol: [[`$\\Phi = (1 + ${n(x * x)})^{-3/2} = ${n(flux(x), 4)}$.`, `$\\Phi = (1 + ${n(x * x)})^{-3/2} = ${n(flux(x), 4)}$ です。`], ['The flux is largest with the magnet in the plane of the loop and falls off as $1/|x|^3$ far away, like any dipole field.', '磁束は磁石がループの面にあるとき最大で、遠くでは双極子の場と同じく $1/|x|^3$ で減ります。']],
          set: { position: x },
        };
      }
      const sc = r.int(0, 2);
      const scen = [['The north pole of a bar magnet is pushed towards a closed loop.', '棒磁石の N 極を閉じたループに近づけます。'], ['The north pole of a bar magnet is pulled away from a closed loop.', '棒磁石の N 極を閉じたループから遠ざけます。'], ['The south pole of a bar magnet is pushed towards a closed loop.', '棒磁石の S 極を閉じたループに近づけます。']][sc];
      return {
        q: [`${scen[0]} What does the induced current do to the magnet?`, `${scen[1]}誘導電流は磁石に何をしますか。`],
        a: { type: 'choice', v: 0, opts: [['It opposes the motion: it pushes back on an approaching magnet and pulls on a leaving one', '動きに逆らう。近づく磁石は押し返し、離れる磁石は引き戻す'], ['It helps the motion along, pulling the magnet the way it is already going', '動きを助け、磁石を進む向きに引っぱる'], ['Nothing: a current flows only while the magnet is inside the loop', '何もしない。電流は磁石がループの中にある間だけ流れる'], ['It always attracts the north pole, whichever way the magnet moves', '動く向きによらず、常に N 極を引きつける']] },
        hint: ['Lenz\'s law: the induced current makes a field that opposes the change of flux.', 'レンツの法則：誘導電流は磁束の変化を妨げる向きの磁場をつくります。'],
        sol: [[sc === 1 ? 'The flux through the loop is falling, so the induced current makes its own flux in the same direction, turning the near face into a south pole that attracts the leaving north pole.' : sc === 0 ? 'The flux through the loop is rising, so the induced current makes opposing flux, turning the near face into a north pole that repels the approaching north pole.' : 'The flux (now in the other direction) is rising, so the loop\'s near face becomes a south pole and repels the approaching south pole.', sc === 1 ? 'ループを貫く磁束が減るので、誘導電流は同じ向きの磁束をつくり、近い面が S 極になって離れていく N 極を引きつけます。' : sc === 0 ? 'ループを貫く磁束が増えるので、誘導電流は逆向きの磁束をつくり、近い面が N 極になって近づく N 極を押し返します。' : '（逆向きの）磁束が増えるので、ループの近い面が S 極になり、近づく S 極を押し返します。'], ['Either way you must do work to move the magnet, and that work becomes the energy dissipated by the current. A current that helped would create energy from nothing.', 'どの場合も磁石を動かすには仕事が必要で、その仕事が電流によって消費されるエネルギーになります。動きを助ける電流なら、無からエネルギーが生まれてしまいます。']],
        set: { position: sc === 1 ? 0.5 : -0.8 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let x; do { x = r.step(-2, 2, 0.1); } while (Math.abs(x) < 0.05);
        const v = r.step(0.2, 2, 0.1), e = emf(x, v);
        return {
          q: [`In the figure $\\Phi(x) = (1 + x^2)^{-3/2}$ and the magnet moves at speed $v = ${n(v)}$ in $+x$. Find the emf $\\mathcal E = -d\\Phi/dt$ when the magnet is at $x = ${n(x)}$. Give three decimals.`, `図では $\\Phi(x) = (1 + x^2)^{-3/2}$ で、磁石は速さ $v = ${n(v)}$ で $+x$ 向きに動きます。磁石が $x = ${n(x)}$ にあるときの起電力 $\\mathcal E = -d\\Phi/dt$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: e, tol: 0.0006 },
          hint: ['Chain rule: $d\\Phi/dt = (d\\Phi/dx)(dx/dt) = v\\,\\Phi\'(x)$.', '連鎖律で $d\\Phi/dt = (d\\Phi/dx)(dx/dt) = v\\,\\Phi\'(x)$ です。'],
          sol: [[`$\\Phi'(x) = -3x(1 + x^2)^{-5/2}$, so $\\mathcal E = 3vx/(1 + x^2)^{5/2}$.`, `$\\Phi'(x) = -3x(1 + x^2)^{-5/2}$ なので $\\mathcal E = 3vx/(1 + x^2)^{5/2}$ です。`], [`$\\mathcal E = 3\\times${n(v)}\\times${n(x)}/(1 + ${n(x * x)})^{5/2} = ${n(e, 4)}$.`, `$\\mathcal E = 3\\times${n(v)}\\times${n(x)}/(1 + ${n(x * x)})^{5/2} = ${n(e, 4)}$ です。`], [x < 0 ? 'The magnet is still approaching, the flux is rising, and the emf is negative.' : 'The magnet has passed the loop, the flux is falling, and the emf is positive: the current has reversed.', x < 0 ? '磁石はまだ近づいており、磁束は増えているので起電力は負です。' : '磁石はループを通り過ぎ、磁束は減っているので起電力は正です。電流の向きが逆転しています。']],
          set: { position: x, speed: v },
        };
      }
      if (form === 1) {
        const B = r.pick([0.2, 0.4, 0.5, 0.8, 1.2]), Lr = r.pick([10, 20, 25, 50]), v = r.pick([1, 2, 3, 5, 8]), R = r.pick([0.5, 1, 2, 4, 10]);
        const E = B * (Lr / 100) * v, I = E / R;
        return {
          q: [`A metal rod $${Lr}$ cm long slides at $${v}$ m/s along rails in a $${n(B)}$ T field perpendicular to the circuit. The circuit's resistance is $${n(R)}\\ \\Omega$. What current flows?`, `長さ $${Lr}$ cm の金属棒が、回路に垂直な $${n(B)}$ T の磁場中のレールの上を $${v}$ m/s で滑ります。回路の抵抗は $${n(R)}\\ \\Omega$ です。流れる電流はいくらですか。`],
          a: { type: 'num', v: I * 1000, rel: 0.005, unit: ['mA', 'mA'] },
          hint: ['The area of the circuit grows at $Lv$, so $\\mathcal E = BLv$.', '回路の面積は毎秒 $Lv$ ずつ増えるので $\\mathcal E = BLv$ です。'],
          sol: [[`$\\mathcal E = BLv = ${n(B)}\\times${n(Lr / 100)}\\times${v} = ${n(E, 4)}$ V.`, `$\\mathcal E = BLv = ${n(B)}\\times${n(Lr / 100)}\\times${v} = ${n(E, 4)}$ V です。`], [`$I = \\mathcal E/R = ${n(E, 4)}/${n(R)} = ${s3(I)}$ A $= ${s3(I * 1000)}$ mA.`, `$I = \\mathcal E/R = ${n(E, 4)}/${n(R)} = ${s3(I)}$ A $= ${s3(I * 1000)}$ mA です。`], [`The field pushes back on the current in the rod with $F = BIL = ${s3(B * I * Lr / 100)}$ N, so keeping it moving takes power $Fv = ${s3(B * I * Lr / 100 * v)}$ W, exactly the $I^2R$ heating.`, `磁場は棒の電流を $F = BIL = ${s3(B * I * Lr / 100)}$ N で押し返すので、動かし続けるには $Fv = ${s3(B * I * Lr / 100 * v)}$ W の仕事率が要り、それはちょうど $I^2R$ の発熱に等しくなります。`]],
        };
      }
      const N = r.pick([50, 100, 200, 500]), A = r.pick([20, 50, 100, 200]), B = r.pick([0.05, 0.1, 0.2, 0.5]), rpm = r.pick([600, 1200, 1500, 3000, 3600]);
      const w = 2 * PI * rpm / 60, E0 = N * B * A * 1e-4 * w;
      return {
        q: [`A generator coil of $${N}$ turns and area $${A}$ cm² spins at $${rpm}$ rpm in a $${n(B)}$ T field. What is the peak emf?`, `$${N}$ 巻き、面積 $${A}$ cm² の発電機のコイルが、$${n(B)}$ T の磁場中で毎分 $${rpm}$ 回転しています。起電力の最大値はいくらですか。`],
        a: { type: 'num', v: E0, rel: 0.01, unit: ['V', 'V'] },
        hint: ['$\\Phi = NBA\\cos\\omega t$, so $\\mathcal E = NBA\\omega\\sin\\omega t$.', '$\\Phi = NBA\\cos\\omega t$ なので $\\mathcal E = NBA\\omega\\sin\\omega t$ です。'],
        sol: [[`$\\omega = 2\\pi\\times${rpm}/60 = ${n(w, 2)}$ rad/s.`, `$\\omega = 2\\pi\\times${rpm}/60 = ${n(w, 2)}$ rad/s です。`], [`$\\mathcal E_0 = NBA\\omega = ${N}\\times${n(B)}\\times${n(A * 1e-4)}\\times${n(w, 2)} = ${s3(E0)}$ V.`, `$\\mathcal E_0 = NBA\\omega = ${N}\\times${n(B)}\\times${n(A * 1e-4)}\\times${n(w, 2)} = ${s3(E0)}$ V です。`], ['The peak comes when the coil\'s plane is parallel to the field: the flux is zero there but changing fastest.', '最大になるのはコイルの面が磁場と平行なときです。そこで磁束は 0 ですが、最も速く変化しています。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([2, 4, 5, 6, 10, 15, 20]), askE = r.chance(0.4);
        if (askE) {
          const v = r.step(0.2, 2, 0.1), Em = 3 * 0.5 * v / 1.25 ** 2.5;
          return {
            q: [`In the figure ($\\Phi = (1 + x^2)^{-3/2}$, magnet speed $v = ${n(v)}$), what is the largest emf the loop ever sees? Give three decimals.`, `図（$\\Phi = (1 + x^2)^{-3/2}$、磁石の速さ $v = ${n(v)}$）で、ループに生じる起電力の最大値はいくらですか。小数第3位まで求めてください。`],
            a: { type: 'num', v: Em, tol: 0.0006 },
            hint: ['Maximise $x/(1 + x^2)^{5/2}$: set its derivative to zero.', '$x/(1 + x^2)^{5/2}$ を最大にします。導関数を 0 とおいてください。'],
            sol: [['$\\dfrac{d}{dx}\\dfrac{x}{(1 + x^2)^{5/2}} = \\dfrac{1 - 4x^2}{(1 + x^2)^{7/2}} = 0$ at $x = \\pm\\tfrac12$.', '$\\dfrac{d}{dx}\\dfrac{x}{(1 + x^2)^{5/2}} = \\dfrac{1 - 4x^2}{(1 + x^2)^{7/2}}$ は $x = \\pm\\tfrac12$ で 0 になります。'], [`$\\mathcal E_{\\max} = 3v\\cdot\\tfrac12/(1.25)^{5/2} = ${n(0.5 * 3 / 1.25 ** 2.5, 4)}\\,v = ${n(Em, 4)}$.`, `$\\mathcal E_{\\max} = 3v\\cdot\\tfrac12/(1.25)^{5/2} = ${n(0.5 * 3 / 1.25 ** 2.5, 4)}\\,v = ${n(Em, 4)}$ です。`], ['The peak emf is proportional to the speed, but it is reached half a radius before and after the loop, not in its plane.', '最大起電力は速さに比例しますが、それはループの面ではなく、その前後半径の半分の位置で生じます。']],
            set: { position: -0.5, speed: v },
          };
        }
        return {
          q: [`A small magnet moves at constant speed along the axis of a loop of radius $${a}$ cm. At what distance from the plane of the loop is the induced emf largest?`, `小さな磁石が半径 $${a}$ cm のループの軸に沿って一定の速さで動きます。誘導起電力が最大になるのは、ループの面からどれだけ離れた位置ですか。`],
          a: { type: 'num', v: a / 2, unit: ['cm', 'cm'] },
          hint: ['The flux of a dipole through the loop is $\\Phi \\propto a^2/(a^2 + x^2)^{3/2}$; the emf is proportional to $|d\\Phi/dx|$.', '双極子がループを貫く磁束は $\\Phi \\propto a^2/(a^2 + x^2)^{3/2}$ で、起電力は $|d\\Phi/dx|$ に比例します。'],
          sol: [['$d\\Phi/dx \\propto -3x/(a^2 + x^2)^{5/2}$, whose derivative is proportional to $a^2 - 4x^2$.', '$d\\Phi/dx \\propto -3x/(a^2 + x^2)^{5/2}$ で、その導関数は $a^2 - 4x^2$ に比例します。'], [`It vanishes at $x = a/2 = ${n(a / 2)}$ cm, on either side.`, `それは両側の $x = a/2 = ${n(a / 2)}$ cm で 0 になります。`], ['At the plane itself the flux is at its peak, so it is momentarily not changing and the emf is zero: largest flux and largest emf happen at different places.', 'ループの面そのものでは磁束が最大で、瞬間的に変化しないので起電力は 0 です。最大の磁束と最大の起電力は別の場所で起こります。']],
          set: { position: -0.5 },
        };
      }
      if (form === 1) {
        const k = r.pick([1, 2, 3, 0.5]), v = r.pick([1, 2, 0.5, 1.5, 3]);
        return {
          q: [`The flux through a loop is $\\Phi(x) = ${k === 1 ? '' : n(k)}(1 + x^2)^{-3/2}$ where $x$ is the position of a magnet moving at constant speed $${n(v)}$ in $+x$. Write the emf $\\mathcal E = -d\\Phi/dt$ as a function of $x$.`, `ループを貫く磁束は $\\Phi(x) = ${k === 1 ? '' : n(k)}(1 + x^2)^{-3/2}$ で、$x$ は $+x$ 向きに一定の速さ $${n(v)}$ で動く磁石の位置です。起電力 $\\mathcal E = -d\\Phi/dt$ を $x$ の関数として書いてください。`],
          a: { type: 'expr', v: `${3 * k * v}*x/(1+x^2)^(5/2)`, vars: ['x'], dom: { x: [-2, 2] }, lhs: ['$\\mathcal E(x) =$', '$\\mathcal E(x) =$'] },
          hint: ['$d\\Phi/dt = (d\\Phi/dx)\\,(dx/dt)$, and $dx/dt$ is the speed.', '$d\\Phi/dt = (d\\Phi/dx)\\,(dx/dt)$ で、$dx/dt$ は速さです。'],
          sol: [[`$\\Phi'(x) = -${n(3 * k)}x(1 + x^2)^{-5/2}$.`, `$\\Phi'(x) = -${n(3 * k)}x(1 + x^2)^{-5/2}$ です。`], [`$\\mathcal E = -${n(v)}\\,\\Phi'(x) = \\dfrac{${n(3 * k * v)}x}{(1 + x^2)^{5/2}}$.`, `$\\mathcal E = -${n(v)}\\,\\Phi'(x) = \\dfrac{${n(3 * k * v)}x}{(1 + x^2)^{5/2}}$ です。`], ['It is odd in $x$: the same pulse of emf on the way in and the way out, with opposite signs, and the current reverses as the magnet crosses the loop.', '$x$ について奇関数です。入るときと出るときに同じ形で符号が逆の起電力が生じ、磁石がループを横切る瞬間に電流が反転します。']],
          set: k === 1 && v <= 2 ? { speed: v } : undefined,
        };
      }
      const N = r.pick([10, 50, 100, 200]), phi = r.pick([0.2, 0.5, 1, 2]), R = r.pick([2, 5, 10, 20]), through = r.chance(0.35);
      const q = through ? 0 : N * phi * 1e-3 / R;
      return {
        q: [through ? `A magnet is thrown right through a coil of $${N}$ turns and resistance $${R}\\ \\Omega$, from far on one side to far on the other. The peak flux per turn is $${n(phi)}$ mWb. What net charge flows round the coil?` : `A magnet is pushed from far away to the centre of a coil of $${N}$ turns and resistance $${R}\\ \\Omega$, where the flux per turn is $${n(phi)}$ mWb. What total charge flows? Does it depend on how fast the magnet moves?`, through ? `磁石を、$${N}$ 巻きで抵抗 $${R}\\ \\Omega$ のコイルの遠い片側から反対側の遠くまで通り抜けさせます。1巻きあたりの磁束の最大値は $${n(phi)}$ mWb です。コイルを回る正味の電荷はいくらですか。` : `磁石を遠くから $${N}$ 巻きで抵抗 $${R}\\ \\Omega$ のコイルの中心まで押し込みます。中心での1巻きあたりの磁束は $${n(phi)}$ mWb です。流れる電荷の総量はいくらですか。磁石を動かす速さによりますか。`],
        a: { type: 'num', v: q * 1e6, unit: ['µC', 'µC'] },
        hint: ['$I = \\mathcal E/R = -(N/R)\\,d\\Phi/dt$, so the charge is $\\int I\\,dt = -N\\Delta\\Phi/R$.', '$I = \\mathcal E/R = -(N/R)\\,d\\Phi/dt$ なので、電荷は $\\int I\\,dt = -N\\Delta\\Phi/R$ です。'],
        sol: [['Integrating the current over time removes the time completely: $Q = N|\\Delta\\Phi|/R$.', '電流を時間で積分すると時間がすっかり消え、$Q = N|\\Delta\\Phi|/R$ となります。'], [through ? 'The flux starts and ends at zero, so $\\Delta\\Phi = 0$: the charge that flows one way on approach flows back on departure, and the net charge is $0$.' : `$Q = ${N}\\times${n(phi)}\\times10^{-3}/${R} = ${s3(q)}$ C $= ${s3(q * 1e6)}$ µC.`, through ? '磁束は 0 から始まり 0 で終わるので $\\Delta\\Phi = 0$ です。近づくときに一方向へ流れた電荷が離れるときに戻り、正味の電荷は $0$ です。' : `$Q = ${N}\\times${n(phi)}\\times10^{-3}/${R} = ${s3(q)}$ C $= ${s3(q * 1e6)}$ µC です。`], ['The speed changes how big and how brief the current pulse is, but not its area. In the figure the emf curve has the same area for every sweep speed.', '速さは電流パルスの高さと短さを変えますが、その面積は変えません。図でも、起電力の曲線の面積はどの移動速度でも同じです。']],
      };
    },
  ];
})();
