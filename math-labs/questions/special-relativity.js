'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const gam = (v) => 1 / Math.sqrt(1 - v * v);
  const C = 299792458;
  // speeds with rational gamma: v = a/c, gamma = c/b for Pythagorean triples
  const CLEAN = [[0.6, 1.25, '\\tfrac54'], [0.8, 5 / 3, '\\tfrac53'], [0.28, 25 / 24, '\\tfrac{25}{24}'], [0.96, 25 / 7, '\\tfrac{25}{7}']];
  const snap = (x, step, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / step) * step));

  /* ---------- 1. Lorentz diagrams ---------- */
  Q['relativity-lorentz'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [v, g, gs] = r.pick(CLEAN.slice(0, 2).concat([[0.5, gam(0.5), null], [0.3, gam(0.3), null], [0.7, gam(0.7), null]]));
        const sv = r.sign() * v;
        return {
          q: [`Frame $S'$ moves at $v = ${n(sv)}c$ relative to $S$. What is its Lorentz factor $\\gamma$?`, `系 $S'$ は $S$ に対して $v = ${n(sv)}c$ で動いています。ローレンツ因子 $\\gamma$ はいくつですか。`],
          a: { type: 'num', v: g, show: gs || undefined },
          hint: ['$\\gamma = 1/\\sqrt{1 - v^2/c^2}$; the sign of $v$ does not matter.', '$\\gamma = 1/\\sqrt{1 - v^2/c^2}$ です。$v$ の符号は関係ありません。'],
          sol: [[`$1 - v^2/c^2 = 1 - ${n(v * v)} = ${n(1 - v * v)}$, so $\\gamma = 1/\\sqrt{${n(1 - v * v)}} = ${n(g, 4)}$.`, `$1 - v^2/c^2 = 1 - ${n(v * v)} = ${n(1 - v * v)}$ なので $\\gamma = 1/\\sqrt{${n(1 - v * v)}} = ${n(g, 4)}$ です。`], [`On the diagram the unit tick of the $ct'$ axis sits at $(x, ct) = (\\gamma v, \\gamma) = (${n(g * sv, 3)}, ${n(g, 3)})$, on the hyperbola $(ct)^2 - x^2 = 1$.`, `図では $ct'$ 軸の単位目盛りは $(x, ct) = (\\gamma v, \\gamma) = (${n(g * sv, 3)}, ${n(g, 3)})$ にあり、双曲線 $(ct)^2 - x^2 = 1$ の上に乗っています。`]],
          set: { v: sv },
        };
      }
      const x = r.step(-2.5, 2.5, 0.5), t = r.step(-2.5, 2.5, 0.5);
      const s2 = t * t - x * x;
      if (form === 1) {
        return {
          q: [`An event has $(x, ct) = (${n(x)}, ${n(t)})$ relative to the origin. What is the invariant interval $s^2 = (ct)^2 - x^2$?`, `原点から見た事象の座標が $(x, ct) = (${n(x)}, ${n(t)})$ です。不変間隔 $s^2 = (ct)^2 - x^2$ はいくつですか。`],
          a: { type: 'num', v: s2, tol: 1e-6 },
          hint: ['Square each coordinate and subtract, with time first.', '各座標を2乗して、時間の方から引きます。'],
          sol: [[`$s^2 = ${n(t)}^2 - ${n(x)}^2 = ${n(t * t)} - ${n(x * x)} = ${n(s2)}$.`, `$s^2 = ${n(t)}^2 - ${n(x)}^2 = ${n(t * t)} - ${n(x * x)} = ${n(s2)}$ です。`], [s2 > 0 ? 'It is positive, so the separation is timelike: every inertial observer agrees on this number and on the order of the two events.' : s2 < 0 ? 'It is negative, so the separation is spacelike: every observer agrees on this number, though not on which event happens first.' : 'It is zero: the two events lie on one light ray.', s2 > 0 ? '正なので時間的な隔たりです。どの慣性系の観測者もこの値と2つの事象の順序に同意します。' : s2 < 0 ? '負なので空間的な隔たりです。どの観測者もこの値には同意しますが、どちらが先に起こるかには同意しません。' : '0 なので、2つの事象は1本の光線の上にあります。']],
        };
      }
      const kind = Math.abs(s2) < 1e-9 ? 2 : s2 > 0 ? 0 : 1;
      return {
        q: [`Classify the separation of the event $(x, ct) = (${n(x)}, ${n(t)})$ from the origin.`, `事象 $(x, ct) = (${n(x)}, ${n(t)})$ と原点との隔たりを分類してください。`],
        a: { type: 'choice', opts: [['timelike: some frame sees both at the same place', '時間的：両方が同じ場所で起こる系がある'], ['spacelike: some frame sees both at the same time', '空間的：両方が同時に起こる系がある'], ['lightlike: a light ray joins them', '光的：1本の光線で結ばれる']], v: kind, fixed: true },
        hint: ['Compare $|ct|$ with $|x|$: is the event inside the light cone, outside it, or on it?', '$|ct|$ と $|x|$ を比べます。事象は光円錐の内側、外側、上のどれですか。'],
        sol: [[`$|ct| = ${n(Math.abs(t))}$ and $|x| = ${n(Math.abs(x))}$, so $s^2 = ${n(s2)}$.`, `$|ct| = ${n(Math.abs(t))}$、$|x| = ${n(Math.abs(x))}$ なので $s^2 = ${n(s2)}$ です。`], [kind === 0 ? `Inside the cone. A frame moving at $v = x/t = ${n(x / t, 3)}c$ puts both events at the same place.` : kind === 1 ? `Outside the cone. A frame moving at $v = ct/x = ${n(t / x, 3)}c$ makes them simultaneous.` : 'On the cone: only a light signal can connect them, and every frame agrees.', kind === 0 ? `光円錐の内側です。速さ $v = x/t = ${n(x / t, 3)}c$ で動く系では両方が同じ場所で起こります。` : kind === 1 ? `光円錐の外側です。速さ $v = ct/x = ${n(t / x, 3)}c$ で動く系では同時になります。` : '光円錐の上です。光の信号でしか結べず、どの系でもそうなります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const v = r.pick([-0.6, 0.6, 0.8, -0.8, 0.5, -0.5, 0.25]), g = gam(v);
        const x = r.step(-2.5, 2.5, 0.5), t = r.step(-2.5, 2.5, 0.5);
        const xp = g * (x - v * t), tp = g * (t - v * x);
        return {
          q: [`Frame $S'$ moves at $v = ${n(v)}c$. An event has $(x, ct) = (${n(x)}, ${n(t)})$ in $S$. Find its coordinates $(x', ct')$ in $S'$.`, `系 $S'$ は $v = ${n(v)}c$ で動いています。$S$ で $(x, ct) = (${n(x)}, ${n(t)})$ の事象の、$S'$ での座標 $(x', ct')$ を求めてください。`],
          a: { type: 'tuple', v: [xp, tp], labels: ["$x'$", "$ct'$"], tol: 0.003 },
          hint: ["With $c = 1$: $x' = \\gamma(x - vt)$, $t' = \\gamma(t - vx)$.", "$c = 1$ では $x' = \\gamma(x - vt)$、$t' = \\gamma(t - vx)$ です。"],
          sol: [[`$\\gamma = ${n(g, 4)}$.`, `$\\gamma = ${n(g, 4)}$ です。`], [`$x' = ${n(g, 4)}(${n(x)} - (${n(v)})(${n(t)})) = ${n(xp, 4)}$ and $ct' = ${n(g, 4)}(${n(t)} - (${n(v)})(${n(x)})) = ${n(tp, 4)}$.`, `$x' = ${n(g, 4)}(${n(x)} - (${n(v)})(${n(t)})) = ${n(xp, 4)}$、$ct' = ${n(g, 4)}(${n(t)} - (${n(v)})(${n(x)})) = ${n(tp, 4)}$ です。`], [`Check: $(ct')^2 - x'^2 = ${n(tp * tp - xp * xp, 3)} = (ct)^2 - x^2$. The coordinates change; the interval does not.`, `確認：$(ct')^2 - x'^2 = ${n(tp * tp - xp * xp, 3)} = (ct)^2 - x^2$。座標は変わりますが、時空間隔は変わりません。`]],
          set: { v },
        };
      }
      if (form === 1) {
        const L0 = r.pick([1, 2, 5, 10, 100]), [v, g] = r.pick(CLEAN.concat([[0.99, gam(0.99)], [0.9, gam(0.9)]]));
        return {
          q: [`A rod of rest length $${L0}$ m flies along its length at $${n(v)}c$. How long is it in the frame where it moves?`, `静止長 $${L0}$ m の棒が、長さの方向に $${n(v)}c$ で飛んでいます。棒が動いて見える系での長さはいくつですか。`],
          a: { type: 'num', v: L0 / g, unit: ['m', 'm'] },
          hint: ['Both ends must be marked at the same time in the moving observer\'s frame; the result is the rest length divided by $\\gamma$.', '観測者の系で両端を同時に記録します。結果は静止長を $\\gamma$ で割ったものです。'],
          sol: [[`$\\gamma = 1/\\sqrt{1 - ${n(v * v)}} = ${n(g, 4)}$.`, `$\\gamma = 1/\\sqrt{1 - ${n(v * v)}} = ${n(g, 4)}$ です。`], [`$L = L_0/\\gamma = ${L0}/${n(g, 4)} = ${n(L0 / g, 4)}$ m.`, `$L = L_0/\\gamma = ${L0}/${n(g, 4)} = ${n(L0 / g, 4)}$ m です。`], ['The contraction comes from the relativity of simultaneity: the two frames disagree about which pair of end-events happen at the same time.', '収縮は同時性の相対性から生じます。2つの系は、どの端の事象の組が同時かについて意見が一致しません。']],
          set: v <= 0.8 ? { v } : undefined,
        };
      }
      const u = r.pick([0.5, 0.6, 0.8, 0.9]), w = r.pick([0.5, 0.6, 0.8, 0.9]);
      const sum = (u + w) / (1 + u * w);
      return {
        q: [`A ship moves at $${n(u)}c$ relative to a station and fires a probe forward at $${n(w)}c$ relative to the ship. How fast is the probe relative to the station, in units of $c$?`, `宇宙船が基地に対して $${n(u)}c$ で動き、船に対して $${n(w)}c$ で前方に探査機を放ちます。基地から見た探査機の速さは $c$ を単位としていくつですか。`],
        a: { type: 'num', v: sum, tol: 5e-4 },
        hint: ['Velocities do not simply add: $u = (u\' + v)/(1 + u\'v/c^2)$.', '速度は単純には足し合わされません。$u = (u\' + v)/(1 + u\'v/c^2)$ です。'],
        sol: [[`$u = \\dfrac{${n(u)} + ${n(w)}}{1 + ${n(u)}\\cdot${n(w)}} = \\dfrac{${n(u + w)}}{${n(1 + u * w)}} = ${n(sum, 4)}$.`, `$u = \\dfrac{${n(u)} + ${n(w)}}{1 + ${n(u)}\\cdot${n(w)}} = \\dfrac{${n(u + w)}}{${n(1 + u * w)}} = ${n(sum, 4)}$ です。`], [`Galilean addition would give $${n(u + w)}c$${u + w > 1 ? ', faster than light' : ''}; the denominator keeps every combination below $c$.`, `ガリレイ的な足し算なら $${n(u + w)}c$${u + w > 1 ? ' となり光より速くなります' : ' です'}。分母のおかげで、どの組み合わせも $c$ を超えません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let x, t;
        do { x = r.step(-2.5, 2.5, 0.5); t = r.step(-2, 2, 0.5); } while (Math.abs(t) >= Math.abs(x) * 0.8 || t === 0 || Math.abs(t / x) > 0.8 || Math.abs((t / x) / 0.05 - Math.round(t / x / 0.05)) > 1e-9);
        const v = t / x;
        return {
          q: [`Event $A$ is at the origin and event $B$ at $(x, ct) = (${n(x)}, ${n(t)})$. At what velocity $v/c$ must a frame move for $A$ and $B$ to be simultaneous in it?`, `事象 $A$ は原点に、事象 $B$ は $(x, ct) = (${n(x)}, ${n(t)})$ にあります。$A$ と $B$ が同時になるには、系はどんな速度 $v/c$ で動けばよいですか。`],
          a: { type: 'num', v, tol: 1e-3 },
          hint: ["Set $t' = \\gamma(t - vx/c^2) = 0$.", "$t' = \\gamma(t - vx/c^2) = 0$ とおきます。"],
          sol: [[`$t' = 0$ requires $ct = (v/c)\\,x$, so $v/c = ct/x = ${n(t)}/${n(x)} = ${n(v, 4)}$.`, `$t' = 0$ には $ct = (v/c)\\,x$ が必要なので、$v/c = ct/x = ${n(t)}/${n(x)} = ${n(v, 4)}$ です。`], [`This is below 1 because $|ct| < |x|$: the separation is spacelike. On the diagram, the $x'$ axis of that frame passes through $B$.`, `$|ct| < |x|$ なので 1 より小さく、隔たりは空間的です。図では、その系の $x'$ 軸が $B$ を通ります。`]],
          set: { v: snap(v, 0.05, -0.8, 0.8) },
        };
      }
      if (form === 1) {
        const x0 = r.pick([1, 1.5, 2, 2.5, -1, -2]), t0 = r.pick([1, 2, 0.5, 1.5, -1]);
        return {
          q: [`The event $(x, ct) = (${n(x0)}, ${n(t0)})$ is seen from a frame moving at velocity $v$ (in units of $c$). Write its coordinate $x'$ as a function of $v$.`, `事象 $(x, ct) = (${n(x0)}, ${n(t0)})$ を速度 $v$（$c$ 単位）で動く系から見ます。座標 $x'$ を $v$ の関数として書いてください。`],
          a: { type: 'expr', v: `(${x0}-(${t0})*v)/sqrt(1-v^2)`, vars: ['v'], dom: { v: [-0.8, 0.8] }, lhs: ["$x'(v) =$", "$x'(v) =$"] },
          hint: ["$x' = \\gamma(x - vt)$ with $\\gamma = 1/\\sqrt{1 - v^2}$ when $c = 1$.", "$c = 1$ では $x' = \\gamma(x - vt)$、$\\gamma = 1/\\sqrt{1 - v^2}$ です。"],
          sol: [[`$x'(v) = \\dfrac{${n(x0)} - (${n(t0)})v}{\\sqrt{1 - v^2}}$.`, `$x'(v) = \\dfrac{${n(x0)} - (${n(t0)})v}{\\sqrt{1 - v^2}}$ です。`], [`It vanishes at $v = ${n(x0 / t0, 3)}$${Math.abs(x0 / t0) < 1 ? ', a frame in which the event happens at its origin, possible because the event is timelike' : ', which is not below $c$: the event is spacelike, so no frame puts it at the origin'}.`, `$v = ${n(x0 / t0, 3)}$ で 0 になります。${Math.abs(x0 / t0) < 1 ? '事象が時間的なので、その事象が原点で起こる系が存在します。' : 'これは $c$ 未満ではありません。事象は空間的なので、原点に置く系は存在しません。'}`], ['As $v \\to \\pm c$ the factor $\\gamma$ blows up and $x\'$ grows without bound.', '$v \\to \\pm c$ では $\\gamma$ が発散し、$x\'$ は限りなく大きくなります。']],
        };
      }
      const x = r.step(0.5, 2.5, 0.5), t = r.step(0.5, 2.5, 0.5);
      const time = t > x;
      return {
        q: [`Event $B$ at $(x, ct) = (${n(x)}, ${n(t)})$ happens after event $A$ at the origin in frame $S$. Is there an inertial frame in which $B$ happens before $A$?`, `系 $S$ では、$(x, ct) = (${n(x)}, ${n(t)})$ の事象 $B$ は原点の事象 $A$ より後に起こります。$B$ が $A$ より先に起こる慣性系はありますか。`],
        a: { type: 'choice', opts: [['No: the separation is timelike or lightlike, so every frame keeps the order.', 'いいえ。隔たりが時間的か光的なので、どの系でも順序は保たれます。'], ['Yes: the separation is spacelike, so a fast enough frame reverses the order.', 'はい。隔たりが空間的なので、十分速い系では順序が逆転します。'], ['Yes: any frame moving faster than $0.5c$ reverses any order.', 'はい。$0.5c$ より速く動く系なら、どんな順序でも逆転します。']], v: time || t === x ? 0 : 1 },
        hint: ["$ct' = \\gamma(ct - vx/c)$ is negative only if $v/c > ct/x$. Can that be below 1?", "$ct' = \\gamma(ct - vx/c)$ が負になるのは $v/c > ct/x$ のときだけです。それは 1 未満になりえますか。"],
        sol: [[`$ct' < 0$ needs $v/c > ct/x = ${n(t / x, 3)}$.`, `$ct' < 0$ には $v/c > ct/x = ${n(t / x, 3)}$ が必要です。`], [time || t === x ? 'That is not below 1, so no inertial frame reverses the order. A cause can always precede its effect in every frame.' : 'That is below 1, so frames moving faster than this see $B$ first. Such events cannot be cause and effect, since no signal can join them.', time || t === x ? 'これは 1 未満ではないので、順序を逆転させる慣性系はありません。原因はどの系でも結果より先です。' : 'これは 1 未満なので、それより速く動く系では $B$ が先に見えます。こうした事象は信号で結べないので、原因と結果の関係にはなりえません。']],
      };
    },
  ];

  /* ---------- 2. Proper time ---------- */
  Q.spacetime = [
    (r) => {
      const [v, g, gs] = r.pick(CLEAN), Dt = r.pick([2, 3, 4, 5, 6, 7.5, 8, 10]);
      if (r.chance(0.6)) {
        return {
          q: [`A clock moves at $${n(v)}c$ while the resting clock advances $\\Delta t = ${n(Dt)}$. How much does the moving clock advance?`, `時計が $${n(v)}c$ で動く間に、静止した時計は $\\Delta t = ${n(Dt)}$ 進みます。運動する時計はどれだけ進みますか。`],
          a: { type: 'num', v: Dt / g },
          hint: ['$\\Delta\\tau = \\Delta t\\sqrt{1 - v^2/c^2}$.', '$\\Delta\\tau = \\Delta t\\sqrt{1 - v^2/c^2}$ です。'],
          sol: [[`$\\sqrt{1 - ${n(v * v)}} = ${n(1 / g, 4)}$, i.e. $\\gamma = ${gs}$.`, `$\\sqrt{1 - ${n(v * v)}} = ${n(1 / g, 4)}$、つまり $\\gamma = ${gs}$ です。`], [`$\\Delta\\tau = ${n(Dt)} \\times ${n(1 / g, 4)} = ${n(Dt / g, 4)}$: the moving clock's worldline is shorter in spacetime.`, `$\\Delta\\tau = ${n(Dt)} \\times ${n(1 / g, 4)} = ${n(Dt / g, 4)}$ です。運動する時計の世界線は時空の中で短いのです。`]],
          set: { v, time: Dt },
        };
      }
      return {
        q: [`A clock moves at $${n(v)}c$. By what factor $\\gamma$ does it run slow compared with clocks at rest?`, `時計が $${n(v)}c$ で動いています。静止した時計と比べて何倍（$\\gamma$）遅れますか。`],
        a: { type: 'num', v: g, show: gs },
        hint: ['$\\gamma = 1/\\sqrt{1 - v^2/c^2}$. These speeds come from Pythagorean triples.', '$\\gamma = 1/\\sqrt{1 - v^2/c^2}$ です。これらの速さはピタゴラス数から来ています。'],
        sol: [[`$1 - ${n(v * v)} = ${n(1 - v * v)} = (${n(1 / g)})^2$.`, `$1 - ${n(v * v)} = ${n(1 - v * v)} = (${n(1 / g)})^2$ です。`], [`So $\\gamma = 1/${n(1 / g)} = ${gs}$: for every $${n(g, 4)}$ units on the resting clock, the moving one ticks once.`, `したがって $\\gamma = 1/${n(1 / g)} = ${gs}$ で、静止した時計が $${n(g, 4)}$ 進むごとに、運動する時計は1だけ進みます。`]],
        set: { v },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const v = r.pick([0.99, 0.995, 0.998, 0.999]), tau0 = 2.197e-6, g = gam(v), d = g * v * C * tau0;
        return {
          q: [`A muon (mean lifetime $2.197\\ \\mu$s at rest) is made in the upper atmosphere moving at $${n(v)}c$. How far does it travel, on average, in the ground frame before it decays? Answer in km.`, `ミューオン（静止時の平均寿命 $2.197\\ \\mu$s）が上層大気で $${n(v)}c$ の速さで作られます。崩壊するまでに地上の系で平均どれだけ進みますか。km で答えてください。`],
          a: { type: 'num', v: d / 1000, rel: 0.01, unit: ['km', 'km'] },
          hint: ['In the ground frame its lifetime is stretched by $\\gamma$; distance is speed times that lifetime.', '地上の系では寿命が $\\gamma$ 倍に延びます。距離は速さとその寿命の積です。'],
          sol: [[`$\\gamma = 1/\\sqrt{1 - ${n(v)}^2} = ${n(g, 4)}$, so the lifetime in the ground frame is $${n(g, 4)} \\times 2.197\\ \\mu\\text{s} = ${sig(g * tau0 * 1e6, 4)}\\ \\mu$s.`, `$\\gamma = 1/\\sqrt{1 - ${n(v)}^2} = ${n(g, 4)}$ なので、地上の系での寿命は $${n(g, 4)} \\times 2.197\\ \\mu\\text{s} = ${sig(g * tau0 * 1e6, 4)}\\ \\mu$s です。`], [`$d = v\\gamma\\tau_0 = ${n(v)} \\times 3.00\\times10^{8} \\times ${sig(g * tau0, 4)} \\approx ${sig(d / 1000, 3)}$ km.`, `$d = v\\gamma\\tau_0 = ${n(v)} \\times 3.00\\times10^{8} \\times ${sig(g * tau0, 4)} \\approx ${sig(d / 1000, 3)}$ km です。`], [`Without time dilation it would go only $${sig(v * C * tau0 / 1000, 3)}$ km, too little to reach the ground from 15 km; this is why muons are detected at sea level.`, `時間の遅れがなければ $${sig(v * C * tau0 / 1000, 3)}$ km しか進まず、高度 15 km から地上には届きません。海面でミューオンが検出されるのはこのためです。`]],
        };
      }
      if (form === 1) {
        const ratio = r.pick([0.6, 0.8, 0.5, 0.28, 0.96, 0.9]), Dt = r.pick([4, 5, 8, 10]);
        const v = Math.sqrt(1 - ratio * ratio);
        return {
          q: [`While the resting clock advances $${Dt}$, a moving clock advances $${n(ratio * Dt)}$. How fast is it moving, as a fraction of $c$?`, `静止した時計が $${Dt}$ 進む間に、運動する時計は $${n(ratio * Dt)}$ 進みます。速さは $c$ の何倍ですか。`],
          a: { type: 'num', v, tol: 5e-4 },
          hint: ['$\\Delta\\tau/\\Delta t = \\sqrt{1 - v^2/c^2}$; solve for $v$.', '$\\Delta\\tau/\\Delta t = \\sqrt{1 - v^2/c^2}$ を $v$ について解きます。'],
          sol: [[`$\\Delta\\tau/\\Delta t = ${n(ratio)}$, so $1 - v^2/c^2 = ${n(ratio * ratio)}$.`, `$\\Delta\\tau/\\Delta t = ${n(ratio)}$ なので $1 - v^2/c^2 = ${n(ratio * ratio)}$ です。`], [`$v/c = \\sqrt{${n(1 - ratio * ratio)}} = ${n(v, 4)}$.`, `$v/c = \\sqrt{${n(1 - ratio * ratio)}} = ${n(v, 4)}$ です。`], ['Halving the clock rate takes $0.866c$; the effect is tiny at everyday speeds and grows steeply near $c$.', '時計の進みを半分にするには $0.866c$ が必要です。日常の速さではごくわずかで、$c$ に近づくと急激に大きくなります。']],
          set: { v: snap(v, 0.01, 0, 0.99), time: Dt },
        };
      }
      const x = r.pick([3, 5, 6, 8, 1.2, 2.4]), t = { 3: 5, 5: 13, 6: 10, 8: 10, 1.2: 2, 2.4: 2.6 }[x];
      const tau = Math.sqrt(t * t - x * x);
      return {
        q: [`A clock leaves the origin and moves uniformly to the event $(x, ct) = (${n(x)}, ${n(t)})$ (units with $c = 1$). How much proper time does it record?`, `時計が原点から等速で事象 $(x, ct) = (${n(x)}, ${n(t)})$ まで移動します（$c = 1$ の単位）。時計が記録する固有時はいくつですか。`],
        a: { type: 'num', v: tau },
        hint: ['The proper time along a straight worldline is the square root of the interval.', 'まっすぐな世界線に沿った固有時は、時空間隔の平方根です。'],
        sol: [[`$\\tau = \\sqrt{(ct)^2 - x^2} = \\sqrt{${n(t * t)} - ${n(x * x)}} = ${n(tau, 4)}$.`, `$\\tau = \\sqrt{(ct)^2 - x^2} = \\sqrt{${n(t * t)} - ${n(x * x)}} = ${n(tau, 4)}$ です。`], [`Its speed was $${n(x / t, 3)}c$, and indeed $${n(t)}/\\gamma = ${n(tau, 4)}$: both routes give the same number because a clock measures the length of its worldline.`, `速さは $${n(x / t, 3)}c$ で、確かに $${n(t)}/\\gamma = ${n(tau, 4)}$ です。時計は世界線の長さを測るので、どちらの計算でも同じ値になります。`]],
        set: t <= 10 ? { v: Math.round(x / t * 100) / 100, time: t } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const T = r.pick([2, 3, 4, 5, 10]);
        return {
          q: [`A clock moves at speed $v$ (in units of $c$) while the resting clock advances $${T}$. Write the moving clock's reading $\\tau$ as a function of $v$.`, `静止した時計が $${T}$ 進む間、時計が速さ $v$（$c$ 単位）で動きます。運動する時計の読み $\\tau$ を $v$ の関数として書いてください。`],
          a: { type: 'expr', v: `${T}*sqrt(1-v^2)`, vars: ['v'], dom: { v: [0, 0.95] }, lhs: ['$\\tau(v) =$', '$\\tau(v) =$'] },
          hint: ['Divide by $\\gamma$.', '$\\gamma$ で割ります。'],
          sol: [[`$\\tau = ${T}/\\gamma = ${T}\\sqrt{1 - v^2}$.`, `$\\tau = ${T}/\\gamma = ${T}\\sqrt{1 - v^2}$ です。`], [`For small $v$, $\\tau \\approx ${T}(1 - v^2/2)$: the loss is quadratic in speed. As $v \\to 1$, $\\tau \\to 0$: a light ray records no time at all.`, `$v$ が小さいとき $\\tau \\approx ${T}(1 - v^2/2)$ で、遅れは速さの2乗に比例します。$v \\to 1$ で $\\tau \\to 0$ となり、光線は時間をまったく記録しません。`]],
        };
      }
      if (form === 1) {
        const [name, nameJ, v] = r.pick([['an airliner', '旅客機', 250], ['the International Space Station', '国際宇宙ステーション', 7660], ['a rifle bullet', 'ライフルの弾丸', 900], ['a high-speed train', '高速鉄道', 90]]);
        const loss = 0.5 * (v / C) ** 2 * 86400 * 1e9;
        return {
          q: [`Ignoring gravity, how many nanoseconds does a clock on ${name}, moving at $${v}$ m/s, lose per day of ground time? (Use $\\Delta \\approx \\tfrac12 (v/c)^2 \\Delta t$.)`, `重力を無視すると、$${v}$ m/s で動く${nameJ}の時計は、地上の1日あたり何ナノ秒遅れますか（$\\Delta \\approx \\tfrac12 (v/c)^2 \\Delta t$ を使います）。`],
          a: { type: 'num', v: loss, rel: 0.01, unit: ['ns', 'ns'] },
          hint: ['Expand $1 - \\sqrt{1 - \\beta^2} \\approx \\beta^2/2$ and multiply by 86 400 s.', '$1 - \\sqrt{1 - \\beta^2} \\approx \\beta^2/2$ と展開し、86 400 s を掛けます。'],
          sol: [[`$\\beta = ${v}/2.998\\times10^{8} = ${sig(v / C, 3)}$, so $\\beta^2/2 = ${sig(0.5 * (v / C) ** 2, 3)}$.`, `$\\beta = ${v}/2.998\\times10^{8} = ${sig(v / C, 3)}$ なので $\\beta^2/2 = ${sig(0.5 * (v / C) ** 2, 3)}$ です。`], [`Per day: $${sig(0.5 * (v / C) ** 2, 3)} \\times 86\\,400\\ \\text{s} = ${sig(loss, 3)}$ ns.`, `1日あたり $${sig(0.5 * (v / C) ** 2, 3)} \\times 86\\,400\\ \\text{s} = ${sig(loss, 3)}$ ns です。`], ['Small but measurable: atomic clocks flown on airliners in 1971 (Hafele and Keating) confirmed effects of this size.', '小さいですが測定できます。1971年に旅客機に載せた原子時計（ハーフェルとキーティング）がこの大きさの効果を確かめました。']],
        };
      }
      const t1 = r.pick([4, 5, 6, 8]), v1 = r.pick([0.6, 0.8]), v2 = r.pick([0.28, 0.6, 0.96].filter((x) => x !== v1));
      const a = t1 / gam(v1), b = t1 / gam(v2);
      return {
        q: [`Two clocks leave a station together. One flies at $${n(v1)}c$ and the other at $${n(v2)}c$, both in straight lines. After $${t1}$ units of station time, what is the difference of their readings (first minus second)?`, `2つの時計が基地を同時に出発します。一方は $${n(v1)}c$、もう一方は $${n(v2)}c$ でまっすぐ飛びます。基地の時間で $${t1}$ 経ったとき、読みの差（前者から後者を引いた値）はいくつですか。`],
        a: { type: 'num', v: a - b, tol: 1e-3 },
        hint: ['Compute each reading as $\\Delta t/\\gamma$ separately, in the station frame.', '基地の系で、それぞれの読みを $\\Delta t/\\gamma$ として別々に計算します。'],
        sol: [[`First: $${t1}\\sqrt{1 - ${n(v1 * v1)}} = ${n(a, 4)}$. Second: $${t1}\\sqrt{1 - ${n(v2 * v2)}} = ${n(b, 4)}$.`, `前者：$${t1}\\sqrt{1 - ${n(v1 * v1)}} = ${n(a, 4)}$。後者：$${t1}\\sqrt{1 - ${n(v2 * v2)}} = ${n(b, 4)}$ です。`], [`Difference $${n(a - b, 4)}$. The faster clock reads less, though each sees the other running slow: the comparison is made in one chosen frame, the station's.`, `差は $${n(a - b, 4)}$ です。速い方の時計の読みが小さくなります。互いに相手が遅れて見えますが、ここでは基地という1つの系で比べています。`]],
        set: { v: v1, time: t1 },
      };
    },
  ];

  /* ---------- 3. Twin paradox ---------- */
  Q.twin = [
    (r) => {
      const [v, g, gs] = r.pick(CLEAN.slice(0, 3)), T = r.pick([4, 5, 6, 8, 10, 12, 15, 20]);
      if (r.chance(0.5)) {
        return {
          q: [`A twin flies out at $${n(v)}c$ and straight back; the trip takes $${T}$ years on Earth. How many years does the traveller age?`, `双子の一方が $${n(v)}c$ で出発してまっすぐ戻ってきます。地球では旅に $${T}$ 年かかります。旅行者は何年年を取りますか。`],
          a: { type: 'num', v: T / g, unit: ['yr', '年'] },
          hint: ['Both legs are at the same speed, so the whole trip is dilated by one factor $\\gamma$.', '往路も復路も同じ速さなので、旅全体が同じ $\\gamma$ で遅れます。'],
          sol: [[`$\\gamma = ${gs}$.`, `$\\gamma = ${gs}$ です。`], [`$\\tau = T/\\gamma = ${T}/${n(g, 4)} = ${n(T / g, 4)}$ years, younger than the home twin by $${n(T - T / g, 4)}$ years.`, `$\\tau = T/\\gamma = ${T}/${n(g, 4)} = ${n(T / g, 4)}$ 年で、地球側より $${n(T - T / g, 4)}$ 年若くなります。`]],
          set: { v, time: T },
        };
      }
      return {
        q: [`A round trip at $${n(v)}c$ lasts $${T}$ years in the home frame. How far away, in light years, is the turnaround?`, `$${n(v)}c$ の往復旅行が地球の系で $${T}$ 年かかります。折り返し点は何光年先ですか。`],
        a: { type: 'num', v: v * T / 2, unit: ['ly', '光年'] },
        hint: ['The outbound leg takes half the home time.', '往路は地球の時間の半分かかります。'],
        sol: [[`Outbound time $T/2 = ${n(T / 2)}$ years at $${n(v)}$ light years per year.`, `往路は $T/2 = ${n(T / 2)}$ 年で、1年に $${n(v)}$ 光年進みます。`], [`Distance $${n(v)} \\times ${n(T / 2)} = ${n(v * T / 2)}$ ly. In the traveller's frame this distance is contracted to $${n(v * T / 2 / g, 4)}$ ly, which is how the traveller covers it in less time.`, `距離は $${n(v)} \\times ${n(T / 2)} = ${n(v * T / 2)}$ 光年です。旅行者の系ではこの距離が $${n(v * T / 2 / g, 4)}$ 光年に縮むので、旅行者はより短い時間で到達します。`]],
        set: { v, time: T },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const v = r.pick([0.6, 0.8, 0.5, 0.9, 0.3]), T = r.pick([4, 6, 8, 10, 12, 16, 20]), g = gam(v);
      if (form === 0) {
        return {
          q: [`Trip at $${n(v)}c$, $T = ${T}$ years in the home frame. At the turnaround the traveller switches frames. How many years of the home clock does the traveller's line of "now" skip?`, `$${n(v)}c$ の旅行で、地球の系での全行程は $T = ${T}$ 年です。折り返しで旅行者は慣性系を乗り換えます。旅行者の「今」の線は地球の時計の何年分を飛び越えますか。`],
          a: { type: 'num', v: v * v * T, unit: ['yr', '年'] },
          hint: ['Just before turning, the traveller\'s "now" meets home at $t_1 = \\tfrac{T}{2}(1 - v^2)$; just after, at $t_2 = \\tfrac{T}{2}(1 + v^2)$.', '折り返す直前、旅行者の「今」は地球の $t_1 = \\tfrac{T}{2}(1 - v^2)$ を通り、直後には $t_2 = \\tfrac{T}{2}(1 + v^2)$ を通ります。'],
          sol: [[`$t_1 = ${n(T / 2)}(1 - ${n(v * v)}) = ${n(T / 2 * (1 - v * v), 4)}$ and $t_2 = ${n(T / 2)}(1 + ${n(v * v)}) = ${n(T / 2 * (1 + v * v), 4)}$.`, `$t_1 = ${n(T / 2)}(1 - ${n(v * v)}) = ${n(T / 2 * (1 - v * v), 4)}$、$t_2 = ${n(T / 2)}(1 + ${n(v * v)}) = ${n(T / 2 * (1 + v * v), 4)}$ です。`], [`The jump is $t_2 - t_1 = v^2T = ${n(v * v * T, 4)}$ years.`, `飛びは $t_2 - t_1 = v^2T = ${n(v * v * T, 4)}$ 年です。`], [`Bookkeeping: $${n(T / 2 * (1 - v * v), 3)} + ${n(v * v * T, 3)} + ${n(T / 2 * (1 - v * v), 3)} = ${T}$. The slow-running home clock on each leg is made up by this jump.`, `収支：$${n(T / 2 * (1 - v * v), 3)} + ${n(v * v * T, 3)} + ${n(T / 2 * (1 - v * v), 3)} = ${T}$。各行程で遅れて見えた地球の時計の分が、この飛びで埋め合わされます。`]],
          set: { v, time: T },
        };
      }
      if (form === 1) {
        const [star, starJ, D] = r.pick([['Proxima Centauri', 'プロキシマ・ケンタウリ', 4.24], ['Sirius', 'シリウス', 8.6], ['Tau Ceti', 'くじら座タウ星', 11.9], ['Vega', 'ベガ', 25]]);
        const vv = r.pick([0.6, 0.8, 0.9, 0.95, 0.99]), tau = 2 * D / vv / gam(vv);
        return {
          q: [`A ship flies to ${star}, $${D}$ light years away, at $${n(vv)}c$ and returns at once at the same speed. How many years pass on board?`, `宇宙船が $${D}$ 光年離れた${starJ}まで $${n(vv)}c$ で飛び、すぐに同じ速さで戻ります。船内では何年経ちますか。`],
          a: { type: 'num', v: tau, rel: 0.005, unit: ['yr', '年'] },
          hint: ['First find the home-frame duration $2D/v$, then divide by $\\gamma$.', 'まず地球の系での所要時間 $2D/v$ を求め、$\\gamma$ で割ります。'],
          sol: [[`Home time $T = 2 \\times ${D}/${n(vv)} = ${n(2 * D / vv, 4)}$ years.`, `地球の時間は $T = 2 \\times ${D}/${n(vv)} = ${n(2 * D / vv, 4)}$ 年です。`], [`$\\gamma = ${n(gam(vv), 4)}$, so on board $\\tau = ${n(2 * D / vv, 4)}/${n(gam(vv), 4)} = ${n(tau, 4)}$ years.`, `$\\gamma = ${n(gam(vv), 4)}$ なので、船内では $\\tau = ${n(2 * D / vv, 4)}/${n(gam(vv), 4)} = ${n(tau, 4)}$ 年です。`], ['Going faster shortens the home time only slightly near $c$, but shortens the crew\'s time without limit.', '$c$ の近くでは速くしても地球の時間はわずかしか縮みませんが、乗組員の時間は限りなく短くなります。']],
          set: 2 * D / vv <= 20 && vv <= 0.95 ? { v: vv, time: Math.round(2 * D / vv * 2) / 2 } : undefined,
        };
      }
      return {
        q: [`Trip at $${n(v)}c$, $T = ${T}$ years at home. On the outbound leg the traveller reckons the home clock runs slow. Just before turning, what does the traveller say the home clock reads?`, `$${n(v)}c$ で全行程 $T = ${T}$ 年の旅行です。往路の旅行者には地球の時計が遅れて見えます。折り返す直前、旅行者は地球の時計がいくつを示していると考えますか。`],
        a: { type: 'num', v: T / 2 * (1 - v * v), unit: ['yr', '年'] },
        hint: ['The traveller has aged $T/(2\\gamma)$ by then, and sees the home clock slow by another factor $\\gamma$.', 'その時点で旅行者は $T/(2\\gamma)$ だけ年を取り、地球の時計はさらに $\\gamma$ 倍遅れて見えます。'],
        sol: [[`Traveller's time at the turnaround: $${n(T / 2)}/${n(g, 4)} = ${n(T / 2 / g, 4)}$ years.`, `折り返しでの旅行者の時間：$${n(T / 2)}/${n(g, 4)} = ${n(T / 2 / g, 4)}$ 年です。`], [`Home clock in the traveller's frame: $${n(T / 2 / g, 4)}/${n(g, 4)} = \\tfrac{T}{2}(1 - v^2) = ${n(T / 2 * (1 - v * v), 4)}$ years.`, `旅行者の系での地球の時計：$${n(T / 2 / g, 4)}/${n(g, 4)} = \\tfrac{T}{2}(1 - v^2) = ${n(T / 2 * (1 - v * v), 4)}$ 年です。`], ['This is where the orange line of "now" meets the home worldline in the figure; it is less than half the trip.', '図で橙の「今」の線が地球の世界線と交わる点がこれで、全行程の半分より小さくなります。']],
        set: { v, time: T },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([0.6, 0.8, 0.28, 0.5, 0.2]), v = Math.sqrt(1 - f * f);
        return {
          q: [`At what speed must the traveller fly (out and back) to return having aged only $${n(f * 100)}\\%$ as much as the home twin? Give $v/c$.`, `往復して戻ったときに地球側の $${n(f * 100)}\\%$ しか年を取っていないためには、旅行者はどんな速さで飛べばよいですか。$v/c$ で答えてください。`],
          a: { type: 'num', v, tol: 5e-4 },
          hint: ['The ratio of ages is $1/\\gamma = \\sqrt{1 - v^2/c^2}$.', '年齢の比は $1/\\gamma = \\sqrt{1 - v^2/c^2}$ です。'],
          sol: [[`$\\sqrt{1 - v^2} = ${n(f)}$, so $v^2 = 1 - ${n(f * f)} = ${n(1 - f * f)}$.`, `$\\sqrt{1 - v^2} = ${n(f)}$ より $v^2 = 1 - ${n(f * f)} = ${n(1 - f * f)}$ です。`], [`$v = ${n(v, 4)}c$. The answer does not depend on how long the trip is, only on the ratio.`, `$v = ${n(v, 4)}c$ です。答えは旅の長さに依らず、比だけで決まります。`]],
          set: v <= 0.95 ? { v: snap(v, 0.01, 0.1, 0.95) } : undefined,
        };
      }
      if (form === 1) {
        const D = r.pick([3, 4, 5, 6, 8]), tau = r.pick([6, 8, 10, 4]);
        const v = 2 * D / Math.sqrt(tau * tau + 4 * D * D), T = 2 * D / v;
        return {
          q: [`A traveller wants to reach a beacon $${D}$ light years away and come straight back, ageing exactly $${tau}$ years. At what constant speed $v/c$ must the ship fly?`, `旅行者が $${D}$ 光年先の標識まで行ってすぐ戻り、ちょうど $${tau}$ 年だけ年を取りたいと考えています。船は一定のどんな速さ $v/c$ で飛べばよいですか。`],
          a: { type: 'num', v, tol: 5e-4 },
          hint: ['Proper time is $\\tau = (2D/v)\\sqrt{1 - v^2}$. Square it and solve for $v$.', '固有時は $\\tau = (2D/v)\\sqrt{1 - v^2}$ です。2乗して $v$ について解きます。'],
          sol: [[`$\\tau^2 v^2 = 4D^2(1 - v^2)$ gives $v = \\dfrac{2D}{\\sqrt{\\tau^2 + 4D^2}}$.`, `$\\tau^2 v^2 = 4D^2(1 - v^2)$ から $v = \\dfrac{2D}{\\sqrt{\\tau^2 + 4D^2}}$ です。`], [`$v = \\dfrac{${2 * D}}{\\sqrt{${tau * tau} + ${4 * D * D}}} = ${n(v, 4)}c$; home time is then $${n(T, 4)}$ years.`, `$v = \\dfrac{${2 * D}}{\\sqrt{${tau * tau} + ${4 * D * D}}} = ${n(v, 4)}c$ で、地球の時間は $${n(T, 4)}$ 年になります。`], ['Geometrically, $\\tau^2 = T^2 - (2D)^2$ is the Minkowski length of the bent worldline: two legs, each a hyperbolic hypotenuse.', '幾何学的には $\\tau^2 = T^2 - (2D)^2$ は折れ曲がった世界線のミンコフスキー長さで、2本の辺がそれぞれ双曲的な斜辺になっています。']],
          set: T <= 20 ? { v: snap(v, 0.01, 0.1, 0.95), time: snap(T, 0.5, 2, 20) } : undefined,
        };
      }
      const v = r.pick([0.6, 0.8]), T = r.pick([10, 20, 5]), g = gam(v);
      const kOut = Math.sqrt((1 - v) / (1 + v)), tauLeg = T / 2 / g, rec = tauLeg * kOut + tauLeg / kOut;
      return {
        q: [`Trip at $${n(v)}c$, $T = ${T}$ years at home. The home twin sends a radio greeting on every birthday. How many greetings does the traveller receive during the whole trip, counting the reunion?`, `$${n(v)}c$ で全行程 $T = ${T}$ 年の旅行です。地球側は誕生日ごとに電波で挨拶を送ります。旅行者が旅の間に受け取る挨拶は、再会時の分も含めていくつですか。`],
        a: { type: 'num', v: rec, tol: 0.01 },
        hint: ['Use the Doppler factor $k = \\sqrt{(1 - v)/(1 + v)}$ for the rate received going away, and $1/k$ coming back, applied to the traveller\'s own time on each leg.', '遠ざかるときの受信率はドップラー因子 $k = \\sqrt{(1 - v)/(1 + v)}$、近づくときは $1/k$ です。各行程の旅行者自身の時間に掛けます。'],
        sol: [[`Each leg lasts $${n(T / 2)}/\\gamma = ${n(tauLeg, 4)}$ years of traveller time; $k = ${n(kOut, 4)}$.`, `各行程は旅行者の時間で $${n(T / 2)}/\\gamma = ${n(tauLeg, 4)}$ 年で、$k = ${n(kOut, 4)}$ です。`], [`Received: $${n(tauLeg, 4)} \\times ${n(kOut, 4)} + ${n(tauLeg, 4)} / ${n(kOut, 4)} = ${n(tauLeg * kOut, 4)} + ${n(tauLeg / kOut, 4)} = ${n(rec, 4)}$.`, `受信数：$${n(tauLeg, 4)} \\times ${n(kOut, 4)} + ${n(tauLeg, 4)} / ${n(kOut, 4)} = ${n(tauLeg * kOut, 4)} + ${n(tauLeg / kOut, 4)} = ${n(rec, 4)}$ です。`], [`Exactly $T = ${T}$: every greeting sent is received, with no jump and no frame-switching argument needed. The asymmetry shows up as the traveller hearing the fast rate only after turning, at the halfway point of the traveller's own trip.`, `ちょうど $T = ${T}$ で、送った挨拶はすべて届きます。飛びや慣性系の乗り換えの議論は要りません。非対称性は、旅行者が自分の旅の中間で折り返して初めて速い受信率を聞く、という形で現れます。`]],
        set: { v, time: T },
      };
    },
  ];
})();
