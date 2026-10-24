'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;
  const D1 = 0.5, L2 = 0.6, L3 = 0.5;

  Q['arm-ik'] = [
    (r) => {
      if (r.chance(0.55)) {
        const l1 = r.pick([1, 2, 0.6, 0.8]), l2 = r.pick([1, 0.5, 0.4, 1.5]);
        const t1 = r.step(0, 90, 15), t2 = r.pick([-90, -60, -45, -30, 30, 45, 60, 90]);
        const x = l1 * Math.cos(rad(t1)) + l2 * Math.cos(rad(t1 + t2)), y = l1 * Math.sin(rad(t1)) + l2 * Math.sin(rad(t1 + t2));
        return {
          q: [`A planar two-link arm has $l_1 = ${n(l1)}$ and $l_2 = ${n(l2)}$. With $\\theta_1 = ${t1}^\\circ$ from the $x$ axis and $\\theta_2 = ${t2}^\\circ$ relative to the first link, where is the tip?`, `平面二リンクの腕で $l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$ です。$x$ 軸から $\\theta_1 = ${t1}^\\circ$、第一リンクに対して $\\theta_2 = ${t2}^\\circ$ のとき、先端はどこにありますか。`],
          a: { type: 'tuple', v: [x, y], labels: ['$x$', '$y$'], tol: 0.002 },
          hint: ['Add the two link vectors; the second points at the absolute angle $\\theta_1 + \\theta_2$.', '二本のリンクのベクトルを足します。二本目は絶対角 $\\theta_1 + \\theta_2$ の向きです。'],
          sol: [[`Elbow at $(${n(l1)}\\cos ${t1}^\\circ,\\ ${n(l1)}\\sin ${t1}^\\circ) = (${n(l1 * Math.cos(rad(t1)), 4)},\\ ${n(l1 * Math.sin(rad(t1)), 4)})$.`, `肘は $(${n(l1)}\\cos ${t1}^\\circ,\\ ${n(l1)}\\sin ${t1}^\\circ) = (${n(l1 * Math.cos(rad(t1)), 4)},\\ ${n(l1 * Math.sin(rad(t1)), 4)})$ にあります。`], [`Add $${n(l2)}(\\cos ${t1 + t2}^\\circ,\\ \\sin ${t1 + t2}^\\circ)$: the tip is at $(${n(x, 4)},\\ ${n(y, 4)})$.`, `$${n(l2)}(\\cos ${t1 + t2}^\\circ,\\ \\sin ${t1 + t2}^\\circ)$ を足すと、先端は $(${n(x, 4)},\\ ${n(y, 4)})$ です。`]],
        };
      }
      const l1 = r.pick([0.6, 1, 1.2, 2]), l2 = r.pick([0.4, 0.5, 0.8, 1.5].filter((x) => x !== l1));
      return {
        q: [`A two-link arm has links of length $${n(l1)}$ and $${n(l2)}$, with free joints. What are the inner and outer radii of the region its tip can reach?`, `長さ $${n(l1)}$ と $${n(l2)}$ のリンクをもつ二リンクの腕の関節は自由に回ります。先端が届く領域の内側と外側の半径はいくつですか。`],
        a: { type: 'tuple', v: [Math.abs(l1 - l2), l1 + l2], labels: [['inner', '内側'], ['outer', '外側']], tol: 1e-6 },
        hint: ['Fold the arm completely, then stretch it out.', '腕を完全に折りたたんだときと、伸ばしきったときを考えます。'],
        sol: [[`Fully folded the tip is $|l_1 - l_2| = ${n(Math.abs(l1 - l2))}$ from the base; fully stretched it is $l_1 + l_2 = ${n(l1 + l2)}$.`, `完全に折りたたむと先端は基部から $|l_1 - l_2| = ${n(Math.abs(l1 - l2))}$、伸ばしきると $l_1 + l_2 = ${n(l1 + l2)}$ です。`], ['Every distance in between is reached by some elbow angle, so the workspace is an annulus (in 3D, the shell between two spheres). Equal links reach all the way in to the base.', 'その間の距離はどれもある肘の角で実現できるので、作業領域は円環（3D では二つの球の間の殻）です。リンクが等しければ基部まで届きます。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const l1 = r.pick([1, 0.8, 1.2]), l2 = r.pick([1, 0.6, 0.9]);
        let x, y, d;
        do { x = r.step(-1.5, 2, 0.1); y = r.step(0, 2, 0.1); d = Math.hypot(x, y); } while (d > l1 + l2 - 0.05 || d < Math.abs(l1 - l2) + 0.05 || d < 0.2);
        const c2 = (d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2), t2 = deg(Math.acos(c2));
        return {
          q: [`A planar arm with $l_1 = ${n(l1)}$, $l_2 = ${n(l2)}$ must put its tip at $(${n(x)},\\ ${n(y)})$. Find the elbow angle $\\theta_2$ of the elbow-down solution ($0^\\circ < \\theta_2 < 180^\\circ$).`, `$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$ の平面の腕で、先端を $(${n(x)},\\ ${n(y)})$ に置きます。肘を下げた解（$0^\\circ < \\theta_2 < 180^\\circ$）の肘の角 $\\theta_2$ を求めてください。`],
          a: { type: 'num', v: t2, tol: 0.1, unit: ['°', '°'] },
          hint: ['The law of cosines in the triangle base, elbow, tip: $d^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$.', '基部、肘、先端の三角形で余弦定理を使います。$d^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$ です。'],
          sol: [[`$d^2 = ${n(x)}^2 + ${n(y)}^2 = ${n(d * d, 4)}$.`, `$d^2 = ${n(x)}^2 + ${n(y)}^2 = ${n(d * d, 4)}$ です。`], [`$\\cos\\theta_2 = \\dfrac{${n(d * d, 4)} - ${n(l1 * l1)} - ${n(l2 * l2)}}{2 \\cdot ${n(l1)} \\cdot ${n(l2)}} = ${n(c2, 4)}$, so $\\theta_2 = ${n(t2, 2)}^\\circ$.`, `$\\cos\\theta_2 = \\dfrac{${n(d * d, 4)} - ${n(l1 * l1)} - ${n(l2 * l2)}}{2 \\cdot ${n(l1)} \\cdot ${n(l2)}} = ${n(c2, 4)}$ より $\\theta_2 = ${n(t2, 2)}^\\circ$ です。`], [`The elbow-up solution is the mirror image, $\\theta_2 = -${n(t2, 2)}^\\circ$, with a different shoulder angle.`, `肘を上げた解は鏡像で $\\theta_2 = -${n(t2, 2)}^\\circ$ となり、肩の角は異なります。`]],
        };
      }
      const l1 = r.pick([1, 0.6, 1.5]), l2 = r.pick([0.5, 1, 0.8]);
      const cases = [[l1 + l2 + 0.3, 0], [l1 + l2, 1], [(l1 + l2 + Math.abs(l1 - l2)) / 2, 2], [Math.abs(l1 - l2), Math.abs(l1 - l2) < 1e-9 ? -1 : 1], [Math.abs(l1 - l2) / 2, Math.abs(l1 - l2) < 1e-9 ? -1 : 0]].filter((c) => c[1] >= 0);
      const [d, k] = r.pick(cases);
      return {
        q: [`A planar arm has $l_1 = ${n(l1)}$ and $l_2 = ${n(l2)}$. How many joint configurations put the tip at a point $${n(d)}$ from the base?`, `$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$ の平面の腕で、先端を基部から $${n(d)}$ の点に置く関節の配置はいくつありますか。`],
        a: { type: 'int', v: k },
        hint: ['The elbow lies on a circle of radius $l_1$ round the base and a circle of radius $l_2$ round the target. Count their intersections.', '肘は基部を中心とする半径 $l_1$ の円と、目標を中心とする半径 $l_2$ の円の上にあります。交点を数えます。'],
        sol: [[`Two circles with centres $${n(d)}$ apart meet twice if $|l_1 - l_2| < d < l_1 + l_2$, i.e. $${n(Math.abs(l1 - l2))} < d < ${n(l1 + l2)}$; once if $d$ equals either bound; otherwise not at all.`, `中心間の距離が $${n(d)}$ の二つの円は、$|l_1 - l_2| < d < l_1 + l_2$、すなわち $${n(Math.abs(l1 - l2))} < d < ${n(l1 + l2)}$ なら二回、どちらかの端に等しければ一回交わり、それ以外は交わりません。`], [k === 2 ? 'Here $d$ is strictly inside, so there are two: elbow up and elbow down.' : k === 1 ? 'Here $d$ is on the boundary, so the two solutions merge: the arm is fully stretched or folded, a singular configuration.' : 'Here $d$ is outside the annulus, so no configuration reaches it.', k === 2 ? 'ここでは $d$ は内部にあるので、肘を上げた解と下げた解の二つです。' : k === 1 ? 'ここでは $d$ は境界上にあるので、二つの解が一つに重なります。腕は伸びきるか折りたたまれた特異配置です。' : 'ここでは $d$ は円環の外にあるので、届く配置はありません。']],
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const l1 = r.pick([1, 2]), l2 = r.pick([1, 2, 3]);
        const dom = { x: [0.2, 0.6], y: [0.2, 0.6] };
        return {
          q: [`For a planar arm with $l_1 = ${l1}$ and $l_2 = ${l2}$, write $\\cos\\theta_2$ as a function of the tip position $(x, y)$.`, `$l_1 = ${l1}$、$l_2 = ${l2}$ の平面の腕について、$\\cos\\theta_2$ を先端の位置 $(x, y)$ の関数として書いてください。`],
          a: { type: 'expr', v: `(x^2+y^2-${l1 * l1}-${l2 * l2})/(${2 * l1 * l2})`, vars: ['x', 'y'], dom, lhs: ['$\\cos\\theta_2 =$', '$\\cos\\theta_2 =$'] },
          hint: ['Square the forward-kinematics equations and add them: the shoulder angle drops out.', '順運動学の式を二乗して足すと、肩の角が消えます。'],
          sol: [['$x^2 + y^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$, because the cross terms combine into $\\cos(\\theta_1 + \\theta_2 - \\theta_1)$.', '交差項が $\\cos(\\theta_1 + \\theta_2 - \\theta_1)$ にまとまるので、$x^2 + y^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$ です。'], [`$\\cos\\theta_2 = \\dfrac{x^2 + y^2 - ${l1 * l1 + l2 * l2}}{${2 * l1 * l2}}$. The target is reachable exactly when this lies in $[-1, 1]$.`, `$\\cos\\theta_2 = \\dfrac{x^2 + y^2 - ${l1 * l1 + l2 * l2}}{${2 * l1 * l2}}$ です。これが $[-1, 1]$ にあるときに限り目標に届きます。`]],
        };
      }
      let x, y, z, s;
      do { x = r.step(-0.8, 0.9, 0.1); y = r.step(-0.8, 0.8, 0.1); z = r.step(0.2, 1.3, 0.1); s = Math.hypot(Math.hypot(x, y), z - D1); } while (s > L2 + L3 - 0.05 || s < L2 - L3 + 0.1 || Math.hypot(x, y) < 0.15);
      const q1 = deg(Math.atan2(y, x)), c3 = (s * s - L2 * L2 - L3 * L3) / (2 * L2 * L3), q3 = deg(Math.acos(c3));
      return {
        q: [`The arm in the figure has $D_1 = 0.5$, $L_2 = 0.6$, $L_3 = 0.5$ m. For the target $(${n(x)},\\ ${n(y)},\\ ${n(z)})$, find the base angle $q_1$ and the size of the elbow angle $|q_3|$, in degrees.`, `図の腕は $D_1 = 0.5$、$L_2 = 0.6$、$L_3 = 0.5$ m です。目標 $(${n(x)},\\ ${n(y)},\\ ${n(z)})$ に対する基部の角 $q_1$ と肘の角の大きさ $|q_3|$ を度で求めてください。`],
        a: { type: 'tuple', v: [q1, q3], labels: ['$q_1$', '$|q_3|$'], tol: 0.15 },
        hint: ['$q_1 = \\operatorname{atan2}(y, x)$; then the shoulder-to-target distance $d$ with $r = \\sqrt{x^2 + y^2}$ and $s = z - D_1$ gives $\\cos q_3$.', '$q_1 = \\operatorname{atan2}(y, x)$ です。次に $r = \\sqrt{x^2 + y^2}$、$s = z - D_1$ から肩と目標の距離 $d$ を求めると $\\cos q_3$ が出ます。'],
        sol: [[`$q_1 = \\operatorname{atan2}(${n(y)}, ${n(x)}) = ${n(q1, 2)}^\\circ$.`, `$q_1 = \\operatorname{atan2}(${n(y)}, ${n(x)}) = ${n(q1, 2)}^\\circ$ です。`], [`$d^2 = r^2 + s^2 = ${n(x * x + y * y, 4)} + ${n((z - D1) ** 2, 4)} = ${n(s * s, 4)}$, so $\\cos q_3 = (${n(s * s, 4)} - 0.36 - 0.25)/0.6 = ${n(c3, 4)}$.`, `$d^2 = r^2 + s^2 = ${n(x * x + y * y, 4)} + ${n((z - D1) ** 2, 4)} = ${n(s * s, 4)}$ より $\\cos q_3 = (${n(s * s, 4)} - 0.36 - 0.25)/0.6 = ${n(c3, 4)}$ です。`], [`$|q_3| = ${n(q3, 2)}^\\circ$; elbow up takes $q_3 = -${n(q3, 2)}^\\circ$, elbow down $+${n(q3, 2)}^\\circ$.`, `$|q_3| = ${n(q3, 2)}^\\circ$ で、肘を上げた解は $q_3 = -${n(q3, 2)}^\\circ$、下げた解は $+${n(q3, 2)}^\\circ$ です。`]],
        set: { x, y, z },
      };
    },
  ];

  Q.manipulability = [
    (r) => {
      if (r.chance(0.5)) {
        const l1 = r.pick([1, 0.8, 0.5, 2]), l2 = r.pick([1, 0.6, 0.4, 1.5]), t2 = r.pick([30, 45, 60, 90, 120, 150, -45, -90]);
        const d = l1 * l2 * Math.sin(rad(t2));
        return {
          q: [`For a planar two-link arm, $\\det J = l_1 l_2 \\sin\\theta_2$. Evaluate it for $l_1 = ${n(l1)}$, $l_2 = ${n(l2)}$, $\\theta_2 = ${t2}^\\circ$.`, `平面二リンクの腕では $\\det J = l_1 l_2 \\sin\\theta_2$ です。$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$、$\\theta_2 = ${t2}^\\circ$ で求めてください。`],
          a: { type: 'num', v: d, tol: 5e-4 },
          sol: [[`$\\det J = ${n(l1)} \\times ${n(l2)} \\times \\sin ${t2}^\\circ = ${n(d, 4)}$.`, `$\\det J = ${n(l1)} \\times ${n(l2)} \\times \\sin ${t2}^\\circ = ${n(d, 4)}$ です。`], ['It is largest in magnitude at a right-angled elbow and zero when the arm is straight or folded, whatever the shoulder angle.', '大きさは肘が直角のとき最大で、腕がまっすぐか折りたたまれると肩の角によらず 0 です。']],
        };
      }
      return {
        q: ['Which configuration of a three-joint arm like the one in the figure is singular?', '図のような三関節の腕で、特異配置はどれですか。'],
        a: { type: 'choice', v: 0, opts: [['The gripper directly above the base axis', 'グリッパーが基部の軸の真上にある'], ['The elbow bent at a right angle', '肘が直角に曲がっている'], ['The shoulder horizontal', '肩が水平'], ['The base turned to $90^\\circ$', '基部が $90^\\circ$ 回っている']] },
        hint: ['$\\det J = -L_2L_3\\,r\\sin q_3$, where $r$ is the gripper\'s distance from the base axis.', '$\\det J = -L_2L_3\\,r\\sin q_3$ で、$r$ はグリッパーの基部の軸からの距離です。'],
        sol: [['The determinant vanishes when $r = 0$ or $\\sin q_3 = 0$.', '行列式は $r = 0$ または $\\sin q_3 = 0$ のとき 0 になります。'], ['With the gripper on the axis, turning the base no longer moves it at all, so one column of $J$ is zero. A right-angled elbow is the best-conditioned case, not a singular one.', 'グリッパーが軸上にあると基部を回してもまったく動かないので、$J$ の一つの列が 0 になります。直角の肘はむしろ条件が最もよい場合です。']],
        set: { q2: 90, q3: 0 },
      };
    },
    (r) => {
      const l1 = r.pick([1, 0.8]), l2 = r.pick([1, 0.6, 0.5]), t1 = r.step(0, 90, 15), t2 = r.pick([30, 45, 60, 90, 120]);
      const w1 = r.pick([0.5, 1, -0.5, 2]), w2 = r.pick([1, -1, 0.5, 1.5]);
      const s1 = Math.sin(rad(t1)), c1 = Math.cos(rad(t1)), s12 = Math.sin(rad(t1 + t2)), c12 = Math.cos(rad(t1 + t2));
      const J = [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]];
      const vx = J[0][0] * w1 + J[0][1] * w2, vy = J[1][0] * w1 + J[1][1] * w2;
      return {
        q: [`A planar arm ($l_1 = ${n(l1)}$, $l_2 = ${n(l2)}$) sits at $\\theta_1 = ${t1}^\\circ$, $\\theta_2 = ${t2}^\\circ$ with joint speeds $\\dot\\theta_1 = ${n(w1)}$, $\\dot\\theta_2 = ${n(w2)}$ rad/s. Find the tip velocity.`, `平面の腕（$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$）が $\\theta_1 = ${t1}^\\circ$、$\\theta_2 = ${t2}^\\circ$ にあり、関節速度は $\\dot\\theta_1 = ${n(w1)}$、$\\dot\\theta_2 = ${n(w2)}$ rad/s です。先端の速度を求めてください。`],
        a: { type: 'tuple', v: [vx, vy], labels: ['$v_x$', '$v_y$'], tol: 0.003 },
        hint: ['$J = \\begin{pmatrix} -l_1 s_1 - l_2 s_{12} & -l_2 s_{12} \\\\ l_1 c_1 + l_2 c_{12} & l_2 c_{12} \\end{pmatrix}$ with $s_{12} = \\sin(\\theta_1 + \\theta_2)$.', '$J = \\begin{pmatrix} -l_1 s_1 - l_2 s_{12} & -l_2 s_{12} \\\\ l_1 c_1 + l_2 c_{12} & l_2 c_{12} \\end{pmatrix}$（$s_{12} = \\sin(\\theta_1 + \\theta_2)$）です。'],
        sol: [[`$J = ${P.util.mat(J, 'pmatrix', 4)}$.`, `$J = ${P.util.mat(J, 'pmatrix', 4)}$ です。`], [`$\\mathbf v = J\\dot{\\boldsymbol\\theta} = (${n(vx, 4)},\\ ${n(vy, 4)})$ per second.`, `$\\mathbf v = J\\dot{\\boldsymbol\\theta} = (${n(vx, 4)},\\ ${n(vy, 4)})$（毎秒）です。`], ['Each column of $J$ is the tip velocity produced by one joint alone; the answer is their weighted sum.', '$J$ の各列は一つの関節だけを動かしたときの先端の速度で、答えはその重み付きの和です。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const l1 = r.pick([1, 0.8, 1.2]), l2 = r.pick([1, 0.5, 0.7]), t2 = r.pick([30, 45, 60, 90, 120, 135]);
        const vx = r.pick([0, 0.2, -0.2, 0.3]), vy = r.pick([0.2, 0.4, -0.3, 0.5]);
        const s2 = Math.sin(rad(t2)), c2 = Math.cos(rad(t2));
        // theta1 = 0: J = [[-l2 s2, -l2 s2], [l1 + l2 c2, l2 c2]]
        const J = [[-l2 * s2, -l2 * s2], [l1 + l2 * c2, l2 * c2]], det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
        const w1 = (J[1][1] * vx - J[0][1] * vy) / det, w2 = (-J[1][0] * vx + J[0][0] * vy) / det;
        return {
          q: [`A planar arm ($l_1 = ${n(l1)}$, $l_2 = ${n(l2)}$) is at $\\theta_1 = 0^\\circ$, $\\theta_2 = ${t2}^\\circ$. What joint speeds give the tip the velocity $(${n(vx)},\\ ${n(vy)})$ m/s?`, `平面の腕（$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$）が $\\theta_1 = 0^\\circ$、$\\theta_2 = ${t2}^\\circ$ にあります。先端の速度を $(${n(vx)},\\ ${n(vy)})$ m/s にする関節速度を求めてください。`],
          a: { type: 'tuple', v: [w1, w2], labels: ['$\\dot\\theta_1$', '$\\dot\\theta_2$'], tol: 0.004, unit: ['rad/s', 'rad/s'] },
          hint: ['Build $J$ at this configuration and solve $J\\dot{\\boldsymbol\\theta} = \\mathbf v$; $\\det J = l_1 l_2\\sin\\theta_2$.', 'この配置で $J$ を作り、$J\\dot{\\boldsymbol\\theta} = \\mathbf v$ を解きます。$\\det J = l_1 l_2\\sin\\theta_2$ です。'],
          sol: [[`$J = ${P.util.mat(J, 'pmatrix', 4)}$, $\\det J = ${n(det, 4)}$.`, `$J = ${P.util.mat(J, 'pmatrix', 4)}$、$\\det J = ${n(det, 4)}$ です。`], [`$\\dot{\\boldsymbol\\theta} = J^{-1}\\mathbf v = (${n(w1, 4)},\\ ${n(w2, 4)})$ rad/s.`, `$\\dot{\\boldsymbol\\theta} = J^{-1}\\mathbf v = (${n(w1, 4)},\\ ${n(w2, 4)})$ rad/s です。`], ['As $\\theta_2$ approaches 0 or $180^\\circ$ the determinant shrinks and the same tip velocity needs ever larger joint speeds.', '$\\theta_2$ が 0 や $180^\\circ$ に近づくと行列式が小さくなり、同じ先端速度にどんどん大きな関節速度が必要になります。']],
        };
      }
      const l1 = r.pick([1, 2, 0.5]), l2 = r.pick([1, 0.5, 3]);
      return {
        q: [`For a planar arm with $l_1 = ${n(l1)}$ and $l_2 = ${n(l2)}$, the manipulability is $w = \\sqrt{\\det(JJ^{\\mathsf T})} = |\\det J|$. Write $w$ as a function of the elbow angle $\\theta_2$ for $0 < \\theta_2 < \\pi$ (type t for $\\theta_2$).`, `$l_1 = ${n(l1)}$、$l_2 = ${n(l2)}$ の平面の腕の可操作度は $w = \\sqrt{\\det(JJ^{\\mathsf T})} = |\\det J|$ です。$0 < \\theta_2 < \\pi$ で $w$ を肘の角 $\\theta_2$ の関数として書いてください（$\\theta_2$ は t と入力）。`],
        a: { type: 'expr', v: `${l1 * l2}*sin(t)`, vars: ['t'], dom: { t: [0.2, 2.9] }, lhs: ['$w(\\theta_2) =$', '$w(\\theta_2) =$'] },
        hint: ['Expand $\\det J$ for the planar arm; the shoulder angle cancels.', '平面の腕の $\\det J$ を展開すると、肩の角は消えます。'],
        sol: [['$\\det J = (-l_1 s_1 - l_2 s_{12})\\,l_2 c_{12} + l_2 s_{12}(l_1 c_1 + l_2 c_{12}) = l_1 l_2(s_{12}c_1 - c_{12}s_1) = l_1 l_2 \\sin\\theta_2$.', '$\\det J = (-l_1 s_1 - l_2 s_{12})\\,l_2 c_{12} + l_2 s_{12}(l_1 c_1 + l_2 c_{12}) = l_1 l_2(s_{12}c_1 - c_{12}s_1) = l_1 l_2 \\sin\\theta_2$ です。'], [`$w = ${n(l1 * l2)}\\sin\\theta_2$, best at a right-angled elbow, independent of where the arm points.`, `$w = ${n(l1 * l2)}\\sin\\theta_2$ で、腕がどこを向いていても肘が直角のとき最良です。`]],
      };
    },
  ];

  Q['arm-trajectory'] = [
    (r) => {
      const t = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.75, 0.8, 0.9]);
      const s = 3 * t * t - 2 * t ** 3;
      return {
        q: [`With the rest-to-rest cubic time scaling $s(t) = 3t^2 - 2t^3$ (time as a fraction of the move), what fraction of the way has the arm gone at $t = ${n(t)}$?`, `静止から静止への三次の時間スケーリング $s(t) = 3t^2 - 2t^3$（時間は動作全体に対する割合）で、$t = ${n(t)}$ のとき腕は道のりの何割を進んでいますか。`],
        a: { type: 'num', v: s, tol: 5e-4 },
        sol: [[`$s(${n(t)}) = 3 \\times ${n(t * t, 4)} - 2 \\times ${n(t ** 3, 4)} = ${n(s, 4)}$.`, `$s(${n(t)}) = 3 \\times ${n(t * t, 4)} - 2 \\times ${n(t ** 3, 4)} = ${n(s, 4)}$ です。`], ['The profile is symmetric, $s(1 - t) = 1 - s(t)$: it starts slowly, is fastest at the middle and settles gently.', 'この曲線は $s(1 - t) = 1 - s(t)$ の対称性をもちます。ゆっくり始まり、中央で最も速く、静かに止まります。']],
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const T0 = r.pick([1, 2, 4, 0.5, 3]), dq = r.pick([30, 60, 90, 120, 45]);
        const peak = 1.5 * rad(dq) / T0;
        return {
          q: [`A joint turns through $${dq}^\\circ$ in $${n(T0)}$ s with the cubic profile $q(t) = q_0 + \\Delta q\\,s(t/T)$, $s(u) = 3u^2 - 2u^3$. What is its peak speed in rad/s?`, `ある関節が三次の曲線 $q(t) = q_0 + \\Delta q\\,s(t/T)$、$s(u) = 3u^2 - 2u^3$ で $${n(T0)}$ s かけて $${dq}^\\circ$ 回ります。最大の角速度は何 rad/s ですか。`],
          a: { type: 'num', v: peak, rel: 0.003, unit: ['rad/s', 'rad/s'] },
          hint: ['$s\'(u) = 6u(1 - u)$ is largest at $u = 1/2$.', '$s\'(u) = 6u(1 - u)$ は $u = 1/2$ で最大です。'],
          sol: [['The peak of $s\'$ is $s\'(1/2) = 1.5$, so the peak speed is $1.5\\,\\Delta q/T$.', '$s\'$ の最大値は $s\'(1/2) = 1.5$ なので、最大の角速度は $1.5\\,\\Delta q/T$ です。'], [`$1.5 \\times ${n(rad(dq), 4)}/${n(T0)} = ${n(peak, 4)}$ rad/s, fifty percent above the average speed.`, `$1.5 \\times ${n(rad(dq), 4)}/${n(T0)} = ${n(peak, 4)}$ rad/s で、平均の速さより 5 割大きくなります。`]],
        };
      }
      const l1 = 1, l2 = 1;
      const a = r.pick([[0, 90], [30, 60], [0, 120], [45, 90]]), b = r.pick([[90, 90], [90, 30], [60, 120], [120, 60]]);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const pf = (t) => [l1 * Math.cos(rad(t[0])) + l2 * Math.cos(rad(t[0] + t[1])), l1 * Math.sin(rad(t[0])) + l2 * Math.sin(rad(t[0] + t[1]))];
      const pa = pf(a), pb = pf(b), pm = pf(mid), straight = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      const gap = Math.hypot(pm[0] - straight[0], pm[1] - straight[1]);
      return {
        q: [`A planar arm with $l_1 = l_2 = 1$ moves from $(\\theta_1, \\theta_2) = (${a[0]}^\\circ, ${a[1]}^\\circ)$ to $(${b[0]}^\\circ, ${b[1]}^\\circ)$ by interpolating the joint angles. Halfway through, how far is the tip from the midpoint of the straight line between the two end positions?`, `$l_1 = l_2 = 1$ の平面の腕が、関節角を補間して $(\\theta_1, \\theta_2) = (${a[0]}^\\circ, ${a[1]}^\\circ)$ から $(${b[0]}^\\circ, ${b[1]}^\\circ)$ へ動きます。半分進んだとき、先端は両端の位置を結ぶ線分の中点からどれだけ離れていますか。`],
          a: { type: 'num', v: gap, tol: 0.002 },
          hint: ['Halfway in joint space means the average angles. Compare the tip there with the average of the two tip positions.', '関節空間で半分とは角の平均のことです。そこでの先端と、両端の先端位置の平均を比べます。'],
          sol: [[`Tips: $A = (${n(pa[0], 4)}, ${n(pa[1], 4)})$, $B = (${n(pb[0], 4)}, ${n(pb[1], 4)})$, so the straight-line midpoint is $(${n(straight[0], 4)}, ${n(straight[1], 4)})$.`, `先端は $A = (${n(pa[0], 4)}, ${n(pa[1], 4)})$、$B = (${n(pb[0], 4)}, ${n(pb[1], 4)})$ なので、線分の中点は $(${n(straight[0], 4)}, ${n(straight[1], 4)})$ です。`], [`At the mean angles $(${n(mid[0])}^\\circ, ${n(mid[1])}^\\circ)$ the tip is at $(${n(pm[0], 4)}, ${n(pm[1], 4)})$.`, `平均の角 $(${n(mid[0])}^\\circ, ${n(mid[1])}^\\circ)$ では先端は $(${n(pm[0], 4)}, ${n(pm[1], 4)})$ にあります。`], [`The gap is $${n(gap, 4)}$: forward kinematics is nonlinear, so a straight line in joint space is a curve in space.`, `差は $${n(gap, 4)}$ です。順運動学は非線形なので、関節空間の直線は空間では曲線になります。`]],
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const v = r.pick([0.2, 0.5, 1, 0.3]), d = r.pick([0.5, 0.2, 0.1, 0.05, 0.02]);
        return {
          q: [`The gripper moves in a straight horizontal line at $${n(v)}$ m/s, passing $${n(d)}$ m from the vertical base axis. At the closest point, how fast must the base rotate (rad/s)?`, `グリッパーが水平な直線上を $${n(v)}$ m/s で動き、鉛直な基部の軸から $${n(d)}$ m のところを通ります。最も近づいた点で、基部は何 rad/s で回らなければなりませんか。`],
          a: { type: 'num', v: v / d, rel: 0.003, unit: ['rad/s', 'rad/s'] },
          hint: ['At the closest point the velocity is perpendicular to the radius, and $v = r\\dot q_1$.', '最も近い点では速度は半径と直交し、$v = r\\dot q_1$ です。'],
          sol: [[`$\\dot q_1 = v/r = ${n(v)}/${n(d)} = ${n(v / d, 4)}$ rad/s.`, `$\\dot q_1 = v/r = ${n(v)}/${n(d)} = ${n(v / d, 4)}$ rad/s です。`], ['As the line approaches the axis this grows without bound: the base-axis singularity of the Jacobian, which the straight-line plan in the figure runs close to.', '直線が軸に近づくとこれは際限なく大きくなります。図の直線の計画が近くを通る、ヤコビ行列の基部の軸の特異点です。']],
          set: { path: 1, mode: 1 },
        };
      }
      const T0 = r.pick([2, 3, 4, 5]);
      return {
        q: [`Write the cubic rest-to-rest scaling for a move lasting $T = ${T0}$ s, as a function of time $t$ in seconds, so that $s(0) = 0$, $s(${T0}) = 1$ and the speed is zero at both ends.`, `動作時間 $T = ${T0}$ s の、静止から静止への三次のスケーリングを秒単位の時間 $t$ の関数として書いてください。$s(0) = 0$、$s(${T0}) = 1$ で、両端で速度が 0 とします。`],
        a: { type: 'expr', v: `3(t/${T0})^2-2(t/${T0})^3`, vars: ['t'], dom: { t: [0, T0] }, lhs: ['$s(t) =$', '$s(t) =$'] },
        hint: ['Take $s(u) = 3u^2 - 2u^3$ on $[0, 1]$ and substitute $u = t/T$.', '$[0, 1]$ 上の $s(u) = 3u^2 - 2u^3$ に $u = t/T$ を代入します。'],
        sol: [['A cubic $a u^2 + b u^3$ already satisfies $s(0) = 0$ and $s\'(0) = 0$; $s(1) = 1$ and $s\'(1) = 0$ give $a + b = 1$, $2a + 3b = 0$, so $a = 3$, $b = -2$.', '三次式 $a u^2 + b u^3$ はすでに $s(0) = 0$、$s\'(0) = 0$ を満たし、$s(1) = 1$、$s\'(1) = 0$ から $a + b = 1$、$2a + 3b = 0$、すなわち $a = 3$、$b = -2$ です。'], [`With $u = t/${T0}$: $s(t) = 3(t/${T0})^2 - 2(t/${T0})^3$.`, `$u = t/${T0}$ とすると $s(t) = 3(t/${T0})^2 - 2(t/${T0})^3$ です。`]],
      };
    },
  ];
})();
