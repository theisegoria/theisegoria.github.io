'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180;
  const rpmOf = (w) => w * 60 / TAU, wOf = (rpm) => rpm * TAU / 60;

  /* ---------- 1. the rotating field ---------- */
  // windings at 0°, 120°, 240°; phase c has amplitude u; forward and backward parts of B(t) = F e^{jωt} + B e^{-jωt}
  const AX = [0, TAU / 3, 2 * TAU / 3], PH = [0, -TAU / 3, TAU / 3];
  function seqs(A) {
    let fr = 0, fi = 0, br = 0, bi = 0;
    A.forEach((a, k) => { fr += a / 2 * Math.cos(PH[k] + AX[k]); fi += a / 2 * Math.sin(PH[k] + AX[k]); br += a / 2 * Math.cos(AX[k] - PH[k]); bi += a / 2 * Math.sin(AX[k] - PH[k]); });
    return { F: Math.hypot(fr, fi), B: Math.hypot(br, bi) };
  }
  const poles = (p) => [`${2 * p}`, `${2 * p}`];

  Q['rotating-field'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([50, 60, 25, 40, 30, 20]), p = r.int(1, 4), ns = 60 * f / p;
        return {
          q: [`A three-phase stator with $${2 * p}$ poles ($p = ${p}$ pole pairs) is fed at $${f}$ Hz. At what speed does its field turn, in rpm?`, `$${2 * p}$ 極（極対数 $p = ${p}$）の三相固定子に $${f}$ Hz を加えます。磁界は何 rpm で回りますか。`],
          a: { type: 'num', v: ns, rel: 0.001, unit: ['rpm', 'rpm'] },
          hint: ['The field advances one pole pair per electrical cycle.', '磁界は電気的な一周期ごとに一極対ぶん進みます。'],
          sol: [[`One electrical cycle moves the field by one pole pair, $1/${p}$ of a turn, so it makes $f/p = ${n(f / p, 3)}$ turns per second.`, `電気的な一周期で磁界は一極対ぶん、つまり $1/${p}$ 回転進むので、毎秒 $f/p = ${n(f / p, 3)}$ 回転します。`], [`$n_s = 60f/p = 60 \\times ${f}/${p} = ${n(ns, 1)}$ rpm. Every motor fed from this supply with this winding runs at or near this speed.`, `$n_s = 60f/p = 60 \\times ${f}/${p} = ${n(ns, 1)}$ rpm です。この巻線をこの電源で使う電動機は、どれもこの速さかその近くで回ります。`]],
          set: { mode: 0, pp: p, f },
        };
      }
      if (form === 1) {
        const f = r.pick([50, 60]), p = r.int(1, 4), ns = 60 * f / p, s = r.pick([0.02, 0.03, 0.04, 0.05]), nn = Math.round(ns * (1 - s) / 5) * 5;
        return {
          q: [`An induction motor on a $${f}$ Hz supply has a nameplate speed of $${nn}$ rpm. How many poles does it have?`, `$${f}$ Hz の電源で使う誘導電動機の銘板の速度は $${nn}$ rpm です。極数はいくつですか。`],
          a: { type: 'int', v: 2 * p },
          hint: ['An induction motor runs a few percent below the synchronous speed $60f/p$. Find the synchronous speed just above the nameplate figure.', '誘導電動機は同期速度 $60f/p$ より数パーセント遅く回ります。銘板の値のすぐ上にある同期速度を探します。'],
          sol: [[`At $${f}$ Hz the synchronous speeds are $${[1, 2, 3, 4].map((q) => 60 * f / q).join(',\\ ')}$ rpm for $p = 1, 2, 3, 4$.`, `$${f}$ Hz での同期速度は $p = 1, 2, 3, 4$ に対して $${[1, 2, 3, 4].map((q) => 60 * f / q).join(',\\ ')}$ rpm です。`], [`The nearest one above $${nn}$ is $${n(ns, 1)}$ rpm, so $p = ${p}$: ${poles(p)[0]} poles, running with a slip of about $${n(100 * (ns - nn) / ns, 2)}\\%$.`, `$${nn}$ のすぐ上は $${n(ns, 1)}$ rpm なので $p = ${p}$、すなわち ${poles(p)[1]} 極で、すべりは約 $${n(100 * (ns - nn) / ns, 2)}\\%$ です。`]],
          set: { mode: 0, pp: p, f },
        };
      }
      return {
        q: ['A three-phase motor turns the wrong way. What is the simplest correct fix?', '三相電動機が逆向きに回っています。最も簡単で正しい対処はどれですか。'],
        a: { type: 'choice', v: 0, opts: [['Swap any two of the three supply leads', '三本の電源線のうち任意の二本を入れ替える'], ['Swap all three leads round by one place', '三本の線を一つずつずらしてつなぎ替える'], ['Reverse the polarity of every lead', 'すべての線の極性を逆にする'], ['Lower the supply frequency', '電源周波数を下げる']] },
        hint: ['The direction is set by the phase sequence, the order in which the currents peak.', '向きを決めるのは相順、つまり電流が最大になる順番です。'],
        sol: [['Swapping two leads turns the sequence a, b, c into a, c, b, so the forward and backward parts of the field change places and the field turns the other way at the same speed.', '二本を入れ替えると相順 a, b, c が a, c, b になり、磁界の正転部分と逆転部分が入れ替わって、同じ速さで逆向きに回ります。'], ['Rotating all three leads keeps the cyclic order, an AC supply has no fixed polarity to reverse, and the frequency changes only the speed.', '三本を一つずつずらしても巡回の順は変わらず、交流電源には逆にする極性がなく、周波数は速さを変えるだけです。']],
        set: { mode: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const u = r.pick([0, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 1.2, 1.25, 1.5]), s = seqs([1, 1, u]);
        return {
          q: [`Phases a and b carry currents of peak 1 and phase c only $${n(u)}$, all still $120^\\circ$ apart. Split the field into a forward-turning part $F$ and a backward-turning part $B$: find their sizes.`, `a 相と b 相の電流の最大値は 1、c 相は $${n(u)}$ で、位相はどれも $120^\\circ$ ずつずれたままです。磁界を正転する部分 $F$ と逆転する部分 $B$ に分け、その大きさを求めてください。`],
          a: { type: 'tuple', v: [s.F, s.B], labels: ['$F$', '$B$'], tol: 0.002 },
          hint: ['Each phase contributes half its amplitude to each part. In the forward part all three halves point the same way; in the backward part they point $120^\\circ$ apart.', '各相は振幅の半分をそれぞれの部分に寄与します。正転部分では三つの半分は同じ向き、逆転部分では $120^\\circ$ ずつ違う向きです。'],
          sol: [[`Forward: $F = \\tfrac12(1 + 1 + ${n(u)}) = ${n(s.F, 4)}$.`, `正転：$F = \\tfrac12(1 + 1 + ${n(u)}) = ${n(s.F, 4)}$ です。`], [`Backward: the three halves are $120^\\circ$ apart, so the two equal ones cancel all but a half of size $\\tfrac12$ opposite to c's, leaving $B = \\tfrac12|1 - ${n(u)}| = ${n(s.B, 4)}$.`, `逆転：三つの半分は $120^\\circ$ ずつずれているので、等しい二つは c 相と逆向きの大きさ $\\tfrac12$ を残して打ち消し合い、$B = \\tfrac12|1 - ${n(u)}| = ${n(s.B, 4)}$ となります。`], [`The tip of the field traces an ellipse with semi-axes $F + B = ${n(s.F + s.B, 4)}$ and $|F - B| = ${n(Math.abs(s.F - s.B), 4)}$; the backward part drags on the rotor and heats it.`, `磁界の先端は半軸 $F + B = ${n(s.F + s.B, 4)}$ と $|F - B| = ${n(Math.abs(s.F - s.B), 4)}$ の楕円を描きます。逆転部分は回転子を引き戻し、発熱させます。`]],
          set: { mode: 1, ub: u },
        };
      }
      if (form === 1) {
        const th = r.pick([0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 210, 240, 300, 330]);
        const i = PH.map((p) => Math.cos(rad(th) + p));
        const bx = i.reduce((t, x, k) => t + x * Math.cos(AX[k]), 0), by = i.reduce((t, x, k) => t + x * Math.sin(AX[k]), 0);
        return {
          q: [`A balanced supply gives $i_a = \\cos\\omega t$, $i_b = \\cos(\\omega t - 120^\\circ)$, $i_c = \\cos(\\omega t + 120^\\circ)$ in windings whose axes point at $0^\\circ$, $120^\\circ$ and $240^\\circ$. At $\\omega t = ${th}^\\circ$, find the field vector $\\sum_k i_k \\hat{\\mathbf u}_k$.`, `平衡な電源が、軸が $0^\\circ$、$120^\\circ$、$240^\\circ$ を向く巻線に $i_a = \\cos\\omega t$、$i_b = \\cos(\\omega t - 120^\\circ)$、$i_c = \\cos(\\omega t + 120^\\circ)$ を流します。$\\omega t = ${th}^\\circ$ での磁界ベクトル $\\sum_k i_k \\hat{\\mathbf u}_k$ を求めてください。`],
          a: { type: 'tuple', v: [bx, by], labels: ['$B_x$', '$B_y$'], tol: 0.002 },
          hint: ['Evaluate the three currents, then add $i_k(\\cos\\alpha_k, \\sin\\alpha_k)$ for the three axis angles $\\alpha_k$.', '三つの電流を求め、三つの軸の角 $\\alpha_k$ について $i_k(\\cos\\alpha_k, \\sin\\alpha_k)$ を足します。'],
          sol: [[`The currents are $${n(i[0], 4)}$, $${n(i[1], 4)}$ and $${n(i[2], 4)}$.`, `電流は $${n(i[0], 4)}$、$${n(i[1], 4)}$、$${n(i[2], 4)}$ です。`], [`Adding them along their axes gives $(${n(bx, 4)},\\ ${n(by, 4)})$, which is $\\tfrac32(\\cos ${th}^\\circ,\\ \\sin ${th}^\\circ)$.`, `それぞれの軸に沿って足すと $(${n(bx, 4)},\\ ${n(by, 4)})$ で、これは $\\tfrac32(\\cos ${th}^\\circ,\\ \\sin ${th}^\\circ)$ です。`], ['Whatever the instant, the size is $1.5$ and the direction is $\\omega t$ itself: the field turns steadily with the supply.', 'どの瞬間でも大きさは $1.5$、向きは $\\omega t$ そのものです。磁界は電源と一緒に一定の速さで回ります。']],
          set: { mode: 0 },
        };
      }
      const f = r.pick([50, 60, 40, 30]), p = r.int(1, 4), ms = 1000 * p / f;
      return {
        q: [`A ${2 * p}-pole motor runs from $${f}$ Hz. How long does the stator field take to make one full mechanical turn, in milliseconds?`, `${2 * p} 極の電動機を $${f}$ Hz で運転します。固定子の磁界が機械的に一回転するのに何ミリ秒かかりますか。`],
          a: { type: 'num', v: ms, rel: 0.002, unit: ['ms', 'ms'] },
          hint: ['Each electrical cycle, $1/f$ long, advances the field by one pole pair.', '長さ $1/f$ の電気的な一周期ごとに、磁界は一極対ぶん進みます。'],
          sol: [[`One electrical cycle takes $1/${f}$ s $= ${n(1000 / f, 4)}$ ms and moves the field $360^\\circ/${p}$ mechanically.`, `電気的な一周期は $1/${f}$ s $= ${n(1000 / f, 4)}$ ms で、磁界を機械角で $360^\\circ/${p}$ 進めます。`], [`A full turn needs $${p}$ cycles: $${n(ms, 4)}$ ms, the same as $n_s = ${n(60 * f / p, 1)}$ rpm. More poles means a slower field from the same supply.`, `一回転には $${p}$ 周期が必要で $${n(ms, 4)}$ ms、これは $n_s = ${n(60 * f / p, 1)}$ rpm と同じです。極が多いほど、同じ電源から遅い磁界ができます。`]],
        set: { mode: 0, pp: p, f },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        return {
          q: ['With phase c at amplitude $u$ times the others ($0 < u < 1$), the field tip traces an ellipse. Write the ratio of the largest to the smallest field size over a cycle as a function of $u$.', 'c 相の振幅が他の相の $u$ 倍（$0 < u < 1$）のとき、磁界の先端は楕円を描きます。一周期の中での磁界の大きさの最大と最小の比を $u$ の関数として書いてください。'],
          a: { type: 'expr', v: '3/(1+2u)', vars: ['u'], dom: { u: [0.05, 0.95] }, lhs: ['$|B|_{\\max}/|B|_{\\min} =$', '$|B|_{\\max}/|B|_{\\min} =$'] },
          hint: ['Find the forward part $F$ and backward part $B$ as functions of $u$; the ellipse has semi-axes $F + B$ and $F - B$.', '正転部分 $F$ と逆転部分 $B$ を $u$ の関数として求めます。楕円の半軸は $F + B$ と $F - B$ です。'],
          sol: [['$F = \\tfrac12(2 + u) = 1 + \\tfrac u2$ and $B = \\tfrac12(1 - u)$.', '$F = \\tfrac12(2 + u) = 1 + \\tfrac u2$、$B = \\tfrac12(1 - u)$ です。'], ['$F + B = \\tfrac32$ whatever $u$ is, and $F - B = \\tfrac12 + u$.', '$F + B$ は $u$ によらず $\\tfrac32$ で、$F - B = \\tfrac12 + u$ です。'], ['The ratio is $\\dfrac{3/2}{1/2 + u} = \\dfrac{3}{1 + 2u}$: $1$ when balanced, $3$ with phase c open. The long axis never changes; only the short one shrinks.', '比は $\\dfrac{3/2}{1/2 + u} = \\dfrac{3}{1 + 2u}$ です。平衡なら $1$、c 相が開放なら $3$ です。長軸は変わらず、短軸だけが縮みます。']],
          set: { mode: 1 },
        };
      }
      if (form === 1) {
        let f, p, ns;
        do { p = r.int(1, 4); f = r.int(10, 60); ns = 60 * f / p; } while (!Number.isInteger(ns) || ns % 5);
        return {
          q: [`A variable-frequency drive feeds a ${2 * p}-pole motor. At what frequency must it run so that the stator field turns at $${ns}$ rpm?`, `可変周波数インバータが ${2 * p} 極の電動機に給電しています。固定子の磁界を $${ns}$ rpm で回すには、何 Hz で運転すればよいですか。`],
          a: { type: 'num', v: f, rel: 0.001, unit: ['Hz', 'Hz'] },
          hint: ['Invert $n_s = 60f/p$.', '$n_s = 60f/p$ を逆に解きます。'],
          sol: [[`$f = p\\,n_s/60 = ${p} \\times ${ns}/60 = ${f}$ Hz.`, `$f = p\\,n_s/60 = ${p} \\times ${ns}/60 = ${f}$ Hz です。`], ['This is how a drive sets the speed of an AC motor: not by changing anything in the motor, but by choosing how fast the field turns.', 'インバータはこうして交流電動機の速度を決めます。電動機の中を変えるのではなく、磁界を回す速さを選ぶのです。']],
          set: { mode: 0, pp: p, f },
        };
      }
      if (form === 2) {
        const u = r.pick([0, 0.25, 0.5, 1.25, 1.5]), s = seqs([1, 1, u]);
        return {
          q: [u === 0 ? 'A fuse in phase c blows, so only phases a and b carry current (peak 1, still $120^\\circ$ apart). Over a cycle, what are the largest and smallest sizes of the field?' : `Phase c carries $${n(u)}$ times the current of the other two (peak 1, all $120^\\circ$ apart). Over a cycle, what are the largest and smallest sizes of the field?`, u === 0 ? 'c 相のヒューズが切れ、a 相と b 相だけに電流（最大値 1、$120^\\circ$ ずれ）が流れています。一周期の中で磁界の大きさの最大と最小はいくつですか。' : `c 相に他の二相の $${n(u)}$ 倍の電流が流れています（最大値 1、どれも $120^\\circ$ ずれ）。一周期の中で磁界の大きさの最大と最小はいくつですか。`],
          a: { type: 'tuple', v: [s.F + s.B, Math.abs(s.F - s.B)], labels: [['largest', '最大'], ['smallest', '最小']], tol: 0.002 },
          hint: ['Split into forward and backward rotating parts. They line up twice a cycle and oppose twice a cycle.', '正転と逆転の部分に分けます。両者は一周期に二回そろい、二回逆向きになります。'],
          sol: [[`$F = \\tfrac12(2 + ${n(u)}) = ${n(s.F, 4)}$ and $B = \\tfrac12|1 - ${n(u)}| = ${n(s.B, 4)}$.`, `$F = \\tfrac12(2 + ${n(u)}) = ${n(s.F, 4)}$、$B = \\tfrac12|1 - ${n(u)}| = ${n(s.B, 4)}$ です。`], [`Aligned they give $F + B = ${n(s.F + s.B, 4)}$; opposed, $|F - B| = ${n(Math.abs(s.F - s.B), 4)}$.`, `そろうと $F + B = ${n(s.F + s.B, 4)}$、逆向きだと $|F - B| = ${n(Math.abs(s.F - s.B), 4)}$ です。`], [`The field still turns forward, but its size pulses at twice the supply frequency, so the torque does too: the motor hums and runs hot${u === 0 ? ', and a stopped motor in this state may not start at all under load' : ''}.`, `磁界はやはり正転しますが、大きさは電源周波数の二倍で脈動し、トルクも同じく脈動します。電動機はうなり、熱くなります${u === 0 ? '。この状態では、止まっている電動機は負荷があると始動できないこともあります' : ''}。`]],
          set: { mode: 1, ub: u },
        };
      }
      return {
        q: ['Why does a motor with a single winding on a single-phase supply produce no starting torque?', '単相電源に一つの巻線だけをつないだ電動機に、始動トルクがないのはなぜですか。'],
        a: { type: 'choice', v: 0, opts: [['Its pulsating field is two equal fields turning in opposite directions, whose torques on a stopped rotor cancel', '脈動する磁界は逆向きに回る二つの等しい磁界の和で、止まった回転子へのトルクが打ち消し合うから'], ['The field is too weak, being only one third of the three-phase field', '磁界が三相の三分の一しかなく弱すぎるから'], ['The current reverses each half cycle, so the field never exists long enough', '電流が半周期ごとに反転し、磁界が十分長く存在しないから'], ['The rotor needs a DC supply to be magnetised before it can turn', '回る前に回転子を直流で磁化する必要があるから']] },
        hint: ['Decompose $\\cos\\omega t\\,\\hat{\\mathbf x}$ into rotating vectors.', '$\\cos\\omega t\\,\\hat{\\mathbf x}$ を回転するベクトルに分解します。'],
        sol: [['$\\cos\\omega t\\,(1, 0) = \\tfrac12(\\cos\\omega t, \\sin\\omega t) + \\tfrac12(\\cos\\omega t, -\\sin\\omega t)$: two half-size fields turning opposite ways.', '$\\cos\\omega t\\,(1, 0) = \\tfrac12(\\cos\\omega t, \\sin\\omega t) + \\tfrac12(\\cos\\omega t, -\\sin\\omega t)$ で、逆向きに回る大きさ半分の二つの磁界です。'], ['At standstill both see the same slip and pull equally in opposite directions. Once spun either way, the forward one wins, which is why a second, phase-shifted winding (a capacitor or a shaded pole) is added to choose the direction.', '静止時は両者が同じすべりで逆向きに同じ強さで引くので打ち消します。どちらかに回し始めると正転側が勝つので、向きを決めるために位相をずらした第二の巻線（コンデンサやくま取りコイル）を加えます。']],
        set: { mode: 3 },
      };
    },
  ];

  /* ---------- 2. the DC motor (figure: k = 0.02 V·s/rad, friction 0.01 N·m) ---------- */
  const K = 0.02, TF = 0.01;
  function op(V, R, TL) { const I = (TL + TF) / K, w = (V - I * R) / K; return { I, w, eta: TL * w / (V * I), Pout: TL * w }; }
  // a figure case with the motor running (positive speed)
  function figCase(r, minRpm = 600) {
    for (;;) {
      const V = r.step(6, 24, 0.5), R = r.step(0.3, 2, 0.05), stall = K * V / R - TF;
      if (stall < 0.04) continue;
      const TL = Math.round(r.real(0.02, 0.85) * stall * 1000) / 1000, o = op(V, R, TL);
      if (rpmOf(o.w) >= minRpm) return { V, R, TL, stall, ...o };
    }
  }
  Q['dc-motor'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([0.02, 0.035, 0.05, 0.08, 0.1]), i = r.pick([1.5, 2, 3, 4, 5, 6.5, 8, 12]);
        return {
          q: [`A permanent-magnet DC motor has torque constant $k = ${n(k)}$ N·m/A. What torque does it produce with $${n(i)}$ A in its winding?`, `永久磁石形の直流電動機のトルク定数は $k = ${n(k)}$ N·m/A です。巻線に $${n(i)}$ A 流すと、トルクはいくつですか。`],
          a: { type: 'num', v: k * i, rel: 0.002, unit: ['N·m', 'N·m'] },
          hint: ['Torque is proportional to current.', 'トルクは電流に比例します。'],
          sol: [[`$T = k\\,i = ${n(k)} \\times ${n(i)} = ${n(k * i, 4)}$ N·m.`, `$T = k\\,i = ${n(k)} \\times ${n(i)} = ${n(k * i, 4)}$ N·m です。`], ['Part of this goes to overcoming the motor\'s own friction; the rest reaches the shaft.', 'その一部は電動機自身の摩擦に打ち勝つのに使われ、残りが軸に届きます。']],
        };
      }
      if (form === 1) {
        const k = r.pick([0.02, 0.035, 0.05, 0.08, 0.1]), rpm = r.step(1000, 6000, 500), w = wOf(rpm);
        return {
          q: [`The same constant $k = ${n(k)}$ V·s/rad sets the back EMF. What back EMF does the motor generate at $${rpm}$ rpm?`, `同じ定数 $k = ${n(k)}$ V·s/rad が逆起電力も決めます。$${rpm}$ rpm で電動機が生む逆起電力はいくつですか。`],
          a: { type: 'num', v: k * w, rel: 0.003, unit: ['V', 'V'] },
          hint: ['$e = k\\omega$ with $\\omega$ in rad/s.', '$\\omega$ を rad/s で表して $e = k\\omega$ です。'],
          sol: [[`$\\omega = ${rpm} \\times 2\\pi/60 = ${n(w, 4)}$ rad/s.`, `$\\omega = ${rpm} \\times 2\\pi/60 = ${n(w, 4)}$ rad/s です。`], [`$e = k\\omega = ${n(k)} \\times ${n(w, 4)} = ${n(k * w, 4)}$ V. The supply has to exceed this for current to flow forward, which is what limits the speed.`, `$e = k\\omega = ${n(k)} \\times ${n(w, 4)} = ${n(k * w, 4)}$ V です。電流が正の向きに流れるには電源電圧がこれを上回る必要があり、それが速度を制限します。`]],
        };
      }
      const k = r.pick([0.02, 0.025, 0.04, 0.05]), V = r.pick([6, 9, 12, 18, 24]);
      return {
        q: [`Ignoring friction, how fast does a motor with $k = ${n(k)}$ V·s/rad spin with no load on a $${V}$ V supply, in rpm?`, `摩擦を無視すると、$k = ${n(k)}$ V·s/rad の電動機は $${V}$ V の電源で無負荷のとき何 rpm で回りますか。`],
        a: { type: 'num', v: rpmOf(V / k), rel: 0.003, unit: ['rpm', 'rpm'] },
        hint: ['With no load and no friction no current is needed, so the back EMF rises until it equals the supply.', '負荷も摩擦もなければ電流は不要なので、逆起電力は電源電圧に等しくなるまで上がります。'],
        sol: [[`$k\\omega_0 = V$ gives $\\omega_0 = ${V}/${n(k)} = ${n(V / k, 4)}$ rad/s.`, `$k\\omega_0 = V$ より $\\omega_0 = ${V}/${n(k)} = ${n(V / k, 4)}$ rad/s です。`], [`That is $${n(rpmOf(V / k), 1)}$ rpm. No-load speed is proportional to voltage, which is why a DC motor's speed is controlled by its voltage.`, `これは $${n(rpmOf(V / k), 1)}$ rpm です。無負荷速度は電圧に比例するので、直流電動機の速度は電圧で制御します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2), c = figCase(r);
      const given = [`The motor in the figure has $k = 0.02$ V·s/rad and friction torque $T_f = 0.01$ N·m. On $${n(c.V)}$ V with winding resistance $R = ${n(c.R)}\\ \\Omega$`, `図の電動機は $k = 0.02$ V·s/rad、摩擦トルク $T_f = 0.01$ N·m です。$${n(c.V)}$ V、巻線抵抗 $R = ${n(c.R)}\\ \\Omega$`];
      const set = { V: c.V, R: c.R, TL: c.TL };
      if (form === 0) {
        return {
          q: [`${given[0]} and a load of $${n(c.TL)}$ N·m, what is its steady speed in rpm?`, `${given[1]}、負荷 $${n(c.TL)}$ N·m のとき、定常の回転速度は何 rpm ですか。`],
          a: { type: 'num', v: rpmOf(c.w), rel: 0.004, unit: ['rpm', 'rpm'] },
          hint: ['The torque balance fixes the current; the voltage balance then fixes the speed.', 'トルクの釣り合いが電流を決め、次に電圧の釣り合いが速度を決めます。'],
          sol: [[`Torque balance: $k i = T_{\\rm load} + T_f$, so $i = ${n(c.TL + TF, 4)}/0.02 = ${n(c.I, 4)}$ A.`, `トルクの釣り合い $k i = T_{\\rm load} + T_f$ より $i = ${n(c.TL + TF, 4)}/0.02 = ${n(c.I, 4)}$ A です。`], [`Voltage balance: $k\\omega = V - Ri = ${n(c.V)} - ${n(c.R * c.I, 4)} = ${n(c.V - c.R * c.I, 4)}$ V, so $\\omega = ${n(c.w, 4)}$ rad/s.`, `電圧の釣り合い $k\\omega = V - Ri = ${n(c.V)} - ${n(c.R * c.I, 4)} = ${n(c.V - c.R * c.I, 4)}$ V より $\\omega = ${n(c.w, 4)}$ rad/s です。`], [`That is $${n(rpmOf(c.w), 1)}$ rpm. Each extra newton-metre of load costs the same speed, $R/k^2$ rad/s per N·m: the straight line in the figure.`, `これは $${n(rpmOf(c.w), 1)}$ rpm です。負荷が 1 N·m 増えるごとに同じだけ、$R/k^2$ rad/s ずつ速度が下がります。図の直線です。`]],
          set,
        };
      }
      if (form === 1) {
        return {
          q: [`${given[0]} and a load of $${n(c.TL)}$ N·m, find the current and the efficiency (shaft power over electrical input).`, `${given[1]}、負荷 $${n(c.TL)}$ N·m のとき、電流と効率（軸出力 ÷ 電気入力）を求めてください。`],
          a: { type: 'tuple', v: [c.I, 100 * c.eta], labels: [['current (A)', '電流（A）'], ['efficiency (%)', '効率（%）']], rel: 0.005 },
          hint: ['Current from $k i = T_{\\rm load} + T_f$; output power is $T_{\\rm load}\\,\\omega$, input is $V i$.', '電流は $k i = T_{\\rm load} + T_f$ から求めます。出力は $T_{\\rm load}\\,\\omega$、入力は $V i$ です。'],
          sol: [[`$i = (${n(c.TL)} + 0.01)/0.02 = ${n(c.I, 4)}$ A and $\\omega = (V - Ri)/k = ${n(c.w, 4)}$ rad/s.`, `$i = (${n(c.TL)} + 0.01)/0.02 = ${n(c.I, 4)}$ A、$\\omega = (V - Ri)/k = ${n(c.w, 4)}$ rad/s です。`], [`Output $${n(c.TL)} \\times ${n(c.w, 4)} = ${n(c.Pout, 4)}$ W; input $${n(c.V)} \\times ${n(c.I, 4)} = ${n(c.V * c.I, 4)}$ W.`, `出力は $${n(c.TL)} \\times ${n(c.w, 4)} = ${n(c.Pout, 4)}$ W、入力は $${n(c.V)} \\times ${n(c.I, 4)} = ${n(c.V * c.I, 4)}$ W です。`], [`$\\eta = ${n(100 * c.eta, 3)}\\%$. The rest is lost as $i^2R$ heat in the winding and as friction.`, `$\\eta = ${n(100 * c.eta, 3)}\\%$ です。残りは巻線の $i^2R$ の熱と摩擦で失われます。`]],
          set,
        };
      }
      const w0 = (c.V - TF / K * c.R) / K, Pmax = c.stall * w0 / 4;
      return {
        q: [`${given[0]}, find the stall torque available at the shaft and the largest mechanical power the motor can deliver.`, `${given[1]}のとき、軸で得られる拘束トルクと、電動機が出せる最大の機械出力を求めてください。`],
        a: { type: 'tuple', v: [c.stall, Pmax], labels: [['stall torque (N·m)', '拘束トルク（N·m）'], ['max power (W)', '最大出力（W）']], rel: 0.005 },
        hint: ['At stall there is no back EMF, so $i = V/R$. Speed falls linearly with load, so power $T\\omega$ peaks halfway along the line.', '拘束時は逆起電力がないので $i = V/R$ です。速度は負荷に対して直線的に下がるので、出力 $T\\omega$ は直線の中央で最大です。'],
        sol: [[`Stall: $i = ${n(c.V)}/${n(c.R)} = ${n(c.V / c.R, 4)}$ A, so $T_{\\rm stall} = k i - T_f = ${n(c.stall, 4)}$ N·m.`, `拘束時は $i = ${n(c.V)}/${n(c.R)} = ${n(c.V / c.R, 4)}$ A なので $T_{\\rm stall} = k i - T_f = ${n(c.stall, 4)}$ N·m です。`], [`No-load speed (only friction): $\\omega_0 = (V - R\\,T_f/k)/k = ${n(w0, 4)}$ rad/s.`, `無負荷速度（摩擦だけ）は $\\omega_0 = (V - R\\,T_f/k)/k = ${n(w0, 4)}$ rad/s です。`], [`$P_{\\max} = T_{\\rm stall}\\,\\omega_0/4 = ${n(Pmax, 4)}$ W, reached at half the stall torque and half the no-load speed, where the efficiency is below 50%.`, `$P_{\\max} = T_{\\rm stall}\\,\\omega_0/4 = ${n(Pmax, 4)}$ W で、拘束トルクの半分、無負荷速度の半分で得られます。そこでの効率は 50% 未満です。`]],
        set: { V: c.V, R: c.R, TL: Math.round(c.stall / 2 * 1000) / 1000 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = figCase(r), I0 = TF / K, Is = c.V / c.R, eta = (1 - Math.sqrt(I0 / Is)) ** 2, Ib = Math.sqrt(I0 * Is), Tb = K * Ib - TF;
        return {
          q: [`For the figure's motor ($k = 0.02$, $T_f = 0.01$ N·m) on $${n(c.V)}$ V with $R = ${n(c.R)}\\ \\Omega$, find the best efficiency it can reach and the load torque at which it does.`, `図の電動機（$k = 0.02$、$T_f = 0.01$ N·m）を $${n(c.V)}$ V、$R = ${n(c.R)}\\ \\Omega$ で使うとき、到達できる最高効率と、そのときの負荷トルクを求めてください。`],
          a: { type: 'tuple', v: [100 * eta, Tb], labels: [['efficiency (%)', '効率（%）'], ['load (N·m)', '負荷（N·m）']], rel: 0.006 },
          hint: ['Efficiency peaks where the current is the geometric mean of the no-load current $T_f/k$ and the stall current $V/R$.', '効率は、電流が無負荷電流 $T_f/k$ と拘束電流 $V/R$ の幾何平均になるところで最大です。'],
          sol: [[`$I_0 = 0.01/0.02 = 0.5$ A and $I_{\\rm stall} = ${n(c.V)}/${n(c.R)} = ${n(Is, 4)}$ A.`, `$I_0 = 0.01/0.02 = 0.5$ A、$I_{\\rm stall} = ${n(c.V)}/${n(c.R)} = ${n(Is, 4)}$ A です。`], [`$\\eta_{\\max} = (1 - \\sqrt{I_0/I_{\\rm stall}})^2 = (1 - ${n(Math.sqrt(I0 / Is), 4)})^2 = ${n(100 * eta, 3)}\\%$ at $i = \\sqrt{I_0 I_{\\rm stall}} = ${n(Ib, 4)}$ A.`, `$\\eta_{\\max} = (1 - \\sqrt{I_0/I_{\\rm stall}})^2 = (1 - ${n(Math.sqrt(I0 / Is), 4)})^2 = ${n(100 * eta, 3)}\\%$ で、そのとき $i = \\sqrt{I_0 I_{\\rm stall}} = ${n(Ib, 4)}$ A です。`], [`The load is $k i - T_f = ${n(Tb, 4)}$ N·m, only $${n(100 * Tb / c.stall, 3)}\\%$ of the stall torque: a motor is most efficient when lightly loaded, far below its maximum power.`, `負荷は $k i - T_f = ${n(Tb, 4)}$ N·m で、拘束トルクの $${n(100 * Tb / c.stall, 3)}\\%$ にすぎません。電動機は最大出力よりずっと下の軽い負荷で最も効率がよいのです。`]],
          set: { V: c.V, R: c.R, TL: Math.round(Tb * 1000) / 1000 },
        };
      }
      if (form === 1) {
        let V, R, rpm, TL;
        do { V = r.step(6, 24, 0.5); R = r.step(0.3, 2, 0.05); rpm = r.step(500, 9000, 250); TL = K * (V - K * wOf(rpm)) / R - TF; } while (TL < 0.02 || TL > 2.3);
        return {
          q: [`The figure's motor ($k = 0.02$, $T_f = 0.01$ N·m) runs on $${n(V)}$ V with $R = ${n(R)}\\ \\Omega$. What load torque slows it to $${rpm}$ rpm?`, `図の電動機（$k = 0.02$、$T_f = 0.01$ N·m）を $${n(V)}$ V、$R = ${n(R)}\\ \\Omega$ で運転します。何 N·m の負荷で $${rpm}$ rpm まで遅くなりますか。`],
          a: { type: 'num', v: TL, rel: 0.004, unit: ['N·m', 'N·m'] },
          hint: ['The speed fixes the back EMF, the back EMF fixes the current, the current fixes the torque.', '速度が逆起電力を決め、逆起電力が電流を、電流がトルクを決めます。'],
          sol: [[`$\\omega = ${rpm} \\times 2\\pi/60 = ${n(wOf(rpm), 4)}$ rad/s, so $e = k\\omega = ${n(K * wOf(rpm), 4)}$ V.`, `$\\omega = ${rpm} \\times 2\\pi/60 = ${n(wOf(rpm), 4)}$ rad/s なので $e = k\\omega = ${n(K * wOf(rpm), 4)}$ V です。`], [`$i = (V - e)/R = ${n((V - K * wOf(rpm)) / R, 4)}$ A, giving motor torque $k i = ${n(TL + TF, 4)}$ N·m.`, `$i = (V - e)/R = ${n((V - K * wOf(rpm)) / R, 4)}$ A で、電動機のトルクは $k i = ${n(TL + TF, 4)}$ N·m です。`], [`Subtract friction: $T_{\\rm load} = ${n(TL, 4)}$ N·m. This is how a speed reading tells you the load on a DC motor.`, `摩擦を引くと $T_{\\rm load} = ${n(TL, 4)}$ N·m です。直流電動機では、速度を読めば負荷がわかります。`]],
          set: { V, R, TL: Math.round(TL * 1000) / 1000 },
        };
      }
      const V = r.int(6, 24), R = r.step(0.2, 2, 0.2), a0 = 50 * V - 25 * R, b = 2500 * R;
      return {
        q: [`For the figure's motor ($k = 0.02$ V·s/rad, $T_f = 0.01$ N·m) on $${V}$ V with $R = ${n(R)}\\ \\Omega$, write the steady speed $\\omega$ in rad/s as a function of the load torque $T$ in N·m.`, `図の電動機（$k = 0.02$ V·s/rad、$T_f = 0.01$ N·m）を $${V}$ V、$R = ${n(R)}\\ \\Omega$ で使うとき、定常の回転速度 $\\omega$（rad/s）を負荷トルク $T$（N·m）の関数として書いてください。`],
        a: { type: 'expr', v: `${n(a0, 6)}-${n(b, 6)}T`, vars: ['T'], dom: { T: [0, 0.3] }, lhs: ['$\\omega(T) =$', '$\\omega(T) =$'] },
        hint: ['Eliminate the current between $k i = T + T_f$ and $V = R i + k\\omega$.', '$k i = T + T_f$ と $V = R i + k\\omega$ から電流を消去します。'],
        sol: [['$\\omega = \\dfrac{V - R(T + T_f)/k}{k} = \\dfrac{V}{k} - \\dfrac{R}{k^2}(T + T_f)$.', '$\\omega = \\dfrac{V - R(T + T_f)/k}{k} = \\dfrac{V}{k} - \\dfrac{R}{k^2}(T + T_f)$ です。'], [`With the numbers, $V/k = ${50 * V}$ and $R/k^2 = ${n(b, 6)}$, so $\\omega = ${n(a0, 6)} - ${n(b, 6)}\\,T$.`, `数値を入れると $V/k = ${50 * V}$、$R/k^2 = ${n(b, 6)}$ なので $\\omega = ${n(a0, 6)} - ${n(b, 6)}\\,T$ です。`], ['A straight line whose slope $-R/k^2$ is the motor\'s whole speed regulation: a stronger magnet (larger $k$) or a thicker winding (smaller $R$) makes the speed stiffer against load.', '傾き $-R/k^2$ の直線で、これが電動機の速度変動のすべてです。磁石を強く（$k$ を大きく）するか巻線を太く（$R$ を小さく）すると、速度は負荷に対して硬くなります。']],
        set: { V, R },
      };
    },
  ];

  /* ---------- 3. the induction motor ---------- */
  Q['induction-torque'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([50, 60]), p = r.int(1, 4), ns = 60 * f / p, nn = Math.round(ns * (1 - r.real(0.015, 0.06, 3)));
        const s = (ns - nn) / ns;
        return {
          q: [`A ${2 * p}-pole induction motor on $${f}$ Hz runs at $${nn}$ rpm. What is its slip, in percent?`, `$${f}$ Hz で使う ${2 * p} 極の誘導電動機が $${nn}$ rpm で回っています。すべりは何パーセントですか。`],
          a: { type: 'num', v: 100 * s, tol: 0.01, unit: ['%', '%'] },
          hint: ['$s = (n_s - n)/n_s$ with $n_s = 60f/p$.', '$n_s = 60f/p$ として $s = (n_s - n)/n_s$ です。'],
          sol: [[`$n_s = 60 \\times ${f}/${p} = ${n(ns, 1)}$ rpm.`, `$n_s = 60 \\times ${f}/${p} = ${n(ns, 1)}$ rpm です。`], [`$s = (${n(ns, 1)} - ${nn})/${n(ns, 1)} = ${n(s, 5)} = ${n(100 * s, 3)}\\%$: the rotor falls behind the field by this fraction, which is what induces its currents.`, `$s = (${n(ns, 1)} - ${nn})/${n(ns, 1)} = ${n(s, 5)} = ${n(100 * s, 3)}\\%$ です。回転子はこの割合だけ磁界より遅れ、それが回転子の電流を誘導します。`]],
          set: { f: Math.min(60, f) },
        };
      }
      if (form === 1) {
        const f = r.pick([50, 60]), s = r.pick([0.01, 0.02, 0.025, 0.03, 0.04, 0.05, 1]);
        return {
          q: [s === 1 ? `At the moment of starting ($s = 1$), at what frequency do the currents in an induction motor's rotor bars alternate, on a $${f}$ Hz supply?` : `An induction motor on $${f}$ Hz runs with slip $${n(100 * s)}\\%$. At what frequency do the currents in its rotor bars alternate?`, s === 1 ? `始動の瞬間（$s = 1$）、$${f}$ Hz の電源で誘導電動機の回転子の導体の電流は何 Hz で交番しますか。` : `$${f}$ Hz の誘導電動機がすべり $${n(100 * s)}\\%$ で回っています。回転子の導体の電流は何 Hz で交番しますか。`],
          a: { type: 'num', v: s * f, rel: 0.002, unit: ['Hz', 'Hz'] },
          hint: ['The rotor sees the field slipping past it at the slip speed, so the induced frequency is $s f$.', '回転子から見ると磁界はすべりの速さで通り過ぎるので、誘導される周波数は $s f$ です。'],
          sol: [[`$f_r = s\\,f = ${n(s)} \\times ${f} = ${n(s * f, 3)}$ Hz.`, `$f_r = s\\,f = ${n(s)} \\times ${f} = ${n(s * f, 3)}$ Hz です。`], [s === 1 ? 'At standstill the rotor is a transformer secondary at full supply frequency, so its reactance is large: that is why starting current is high and starting torque comparatively low.' : 'Running, the rotor currents alternate only a few times a second, so the rotor reactance hardly matters and the rotor behaves almost like a pure resistance $R_2/s$.', s === 1 ? '静止時の回転子は電源周波数そのままの変圧器の二次側で、リアクタンスが大きくなります。そのため始動電流は大きく、始動トルクは比較的小さいのです。' : '運転中、回転子の電流は毎秒数回しか交番しないので、回転子のリアクタンスはほとんど効かず、回転子はほぼ純抵抗 $R_2/s$ として振る舞います。']],
        };
      }
      return {
        q: ['An induction motor is driven by its load at exactly synchronous speed. What torque does it produce?', '誘導電動機を負荷側からちょうど同期速度で回します。電動機のトルクはいくつですか。'],
        a: { type: 'choice', v: 0, opts: [['Zero: the rotor no longer cuts the field, so no current is induced', '0：回転子が磁界を切らなくなり、電流が誘導されない'], ['Its breakdown torque: the field and rotor are perfectly aligned', '停動トルク：磁界と回転子が完全にそろう'], ['Its rated torque, since the supply is unchanged', '電源が変わらないので定格トルク'], ['The same as its starting torque', '始動トルクと同じ']] },
        hint: ['Torque comes from currents induced by relative motion between field and rotor.', 'トルクは、磁界と回転子の相対運動で誘導される電流から生まれます。'],
        sol: [['At $s = 0$ the rotor turns with the field, the flux through each rotor loop is constant, and there is no induced EMF, no rotor current and no torque.', '$s = 0$ では回転子は磁界と一緒に回り、回転子の各ループを貫く磁束は一定なので、誘導起電力も回転子電流もトルクもありません。'], ['Push it faster still and the slip turns negative: the torque reverses and the machine becomes a generator, the shaded region on the right of the figure.', 'さらに速く回すとすべりは負になり、トルクが反転して発電機になります。図の右側の網掛けの領域です。']],
        set: { TL: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Pag = r.pick([2.2, 4, 5.5, 7.5, 11, 15, 22]), s = r.pick([0.02, 0.025, 0.03, 0.04, 0.05, 0.06]);
        return {
          q: [`The air-gap power of an induction motor (the power crossing to the rotor) is $${n(Pag)}$ kW at slip $${n(100 * s)}\\%$. How much is lost as heat in the rotor, and how much becomes mechanical power?`, `誘導電動機のエアギャップ電力（回転子へ渡る電力）がすべり $${n(100 * s)}\\%$ で $${n(Pag)}$ kW です。回転子で熱として失われる電力と、機械出力になる電力はそれぞれいくつですか。`],
          a: { type: 'tuple', v: [s * Pag, (1 - s) * Pag], labels: [['rotor loss (kW)', '回転子損（kW）'], ['mechanical (kW)', '機械出力（kW）']], rel: 0.004 },
          hint: ['The rotor resistor in the equivalent circuit is $R_2/s = R_2 + R_2(1 - s)/s$.', '等価回路の回転子の抵抗は $R_2/s = R_2 + R_2(1 - s)/s$ です。'],
          sol: [[`Of the air-gap power, the fraction $s$ heats the rotor: $${n(s)} \\times ${n(Pag)} = ${n(s * Pag, 4)}$ kW.`, `エアギャップ電力のうち割合 $s$ が回転子を熱します。$${n(s)} \\times ${n(Pag)} = ${n(s * Pag, 4)}$ kW です。`], [`The rest, $(1 - s)P_{\\rm ag} = ${n((1 - s) * Pag, 4)}$ kW, turns the shaft. So a motor run at high slip is necessarily inefficient: slip is lost power.`, `残りの $(1 - s)P_{\\rm ag} = ${n((1 - s) * Pag, 4)}$ kW が軸を回します。大きなすべりで運転する電動機は必ず効率が悪く、すべりはそのまま失われる電力です。`]],
        };
      }
      if (form === 1) {
        const f = r.pick([50, 60]), p = r.int(1, 3), Pag = r.pick([4, 5.5, 7.5, 11, 15, 18.5]), ws = TAU * f / p, T = 1000 * Pag / ws;
        return {
          q: [`A ${2 * p}-pole induction motor on $${f}$ Hz has $${n(Pag)}$ kW crossing its air gap. What torque does the rotor receive?`, `$${f}$ Hz の ${2 * p} 極の誘導電動機で、エアギャップを $${n(Pag)}$ kW が渡っています。回転子が受けるトルクはいくつですか。`],
          a: { type: 'num', v: T, rel: 0.004, unit: ['N·m', 'N·m'] },
          hint: ['The air-gap power is the torque times the speed of the field, not of the rotor.', 'エアギャップ電力は、トルクと回転子ではなく磁界の速さの積です。'],
          sol: [[`$\\omega_s = 2\\pi f/p = 2\\pi \\times ${f}/${p} = ${n(ws, 4)}$ rad/s.`, `$\\omega_s = 2\\pi f/p = 2\\pi \\times ${f}/${p} = ${n(ws, 4)}$ rad/s です。`], [`$T = P_{\\rm ag}/\\omega_s = ${n(1000 * Pag)}/${n(ws, 4)} = ${n(T, 4)}$ N·m. The field drags the rotor with this torque whatever the slip, which is why torque is measured in "synchronous watts".`, `$T = P_{\\rm ag}/\\omega_s = ${n(1000 * Pag)}/${n(ws, 4)} = ${n(T, 4)}$ N·m です。すべりによらず磁界はこのトルクで回転子を引くので、トルクは「同期ワット」で測られます。`]],
        };
      }
      const f = r.pick([50, 60]), p = r.pick([1, 2, 3]), ns = 60 * f / p, s1 = r.pick([0.02, 0.025, 0.03, 0.04]), T1 = r.pick([40, 50, 60, 75, 100]), k = r.pick([0.5, 0.6, 0.75, 1.2, 1.25, 1.5]);
      const T2 = T1 * k, s2 = s1 * k, n2 = ns * (1 - s2);
      return {
        q: [`A ${2 * p}-pole motor on $${f}$ Hz gives $${T1}$ N·m at $${n(100 * s1)}\\%$ slip. Near synchronous speed the torque is proportional to slip. At what speed does it carry $${n(T2)}$ N·m?`, `$${f}$ Hz の ${2 * p} 極の電動機は、すべり $${n(100 * s1)}\\%$ で $${T1}$ N·m を出します。同期速度の近くではトルクはすべりに比例します。$${n(T2)}$ N·m を負うときの回転速度はいくつですか。`],
        a: { type: 'num', v: n2, rel: 0.0008, unit: ['rpm', 'rpm'] },
        hint: ['Scale the slip in proportion to the torque, then convert to speed.', 'すべりをトルクに比例させてから速度に直します。'],
        sol: [[`$s_2 = s_1\\,T_2/T_1 = ${n(s1)} \\times ${n(k)} = ${n(s2, 5)}$.`, `$s_2 = s_1\\,T_2/T_1 = ${n(s1)} \\times ${n(k)} = ${n(s2, 5)}$ です。`], [`$n = n_s(1 - s_2) = ${n(ns, 1)} \\times ${n(1 - s2, 5)} = ${n(n2, 5)}$ rpm. The speed hardly moves with load: an induction motor is nearly a constant-speed machine.`, `$n = n_s(1 - s_2) = ${n(ns, 1)} \\times ${n(1 - s2, 5)} = ${n(n2, 5)}$ rpm です。負荷で速度はほとんど変わらず、誘導電動機はほぼ定速の機械です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const sm = r.pick([0.06, 0.08, 0.1, 0.12, 0.15]), k = r.pick([1.5, 2, 2.5, 3, 4]);
        return {
          q: [`A wound-rotor motor breaks down at $${n(100 * sm)}\\%$ slip. External resistors make the rotor resistance $${n(k)}$ times larger. Find the new breakdown slip and the ratio of the new to the old breakdown torque.`, `巻線形回転子の電動機は、すべり $${n(100 * sm)}\\%$ で停動トルクに達します。外部抵抗で回転子の抵抗を $${n(k)}$ 倍にします。新しい停動すべりと、新旧の停動トルクの比を求めてください。`],
          a: { type: 'tuple', v: [100 * sm * k, 1], labels: [['breakdown slip (%)', '停動すべり（%）'], ['torque ratio', 'トルク比']], rel: 0.004 },
          hint: ['Look at where $R_2$ appears in $s_{\\max}$ and in $T_{\\max}$.', '$s_{\\max}$ と $T_{\\max}$ のどこに $R_2$ が現れるかを見ます。'],
          sol: [['$s_{\\max} = R_2/\\sqrt{R_{\\rm th}^2 + (X_{\\rm th} + X_2)^2}$ is proportional to $R_2$, while $T_{\\max}$ does not contain $R_2$ at all.', '$s_{\\max} = R_2/\\sqrt{R_{\\rm th}^2 + (X_{\\rm th} + X_2)^2}$ は $R_2$ に比例し、$T_{\\max}$ には $R_2$ がまったく含まれません。'], [`So $s_{\\max}$ becomes $${n(100 * sm * k, 3)}\\%$ and the peak torque is unchanged (ratio $1$). The whole curve depends on $R_2/s$ only, so it stretches sideways.`, `したがって $s_{\\max}$ は $${n(100 * sm * k, 3)}\\%$ になり、最大トルクは変わりません（比は $1$）。曲線全体は $R_2/s$ だけで決まるので、横に引き伸ばされます。`], ['Moving the peak towards standstill raises the starting torque, which is exactly what heavy loads like crushers need, at the price of rotor heat while running.', '最大点を静止側へ動かすと始動トルクが上がります。破砕機のような重い負荷にはまさにこれが必要ですが、運転中の回転子の発熱が代償です。']],
          set: { rr: k, f: 50 },
        };
      }
      if (form === 1) {
        const p = 2, s1 = r.pick([0.02, 0.03, 0.04]), f2 = r.pick([20, 25, 30, 35, 40, 45]), ns1 = 1500, n1 = ns1 * (1 - s1), ns2 = 60 * f2 / p, n2 = ns2 - (ns1 - n1);
        return {
          q: [`A four-pole motor runs at $${n(n1)}$ rpm on $50$ Hz with a constant-torque load. A drive lowers the frequency to $${f2}$ Hz keeping $V/f$ constant. Neglecting stator resistance, what is the new speed?`, `四極の電動機が定トルク負荷で $50$ Hz、$${n(n1)}$ rpm で回っています。インバータが $V/f$ を一定に保って周波数を $${f2}$ Hz に下げます。固定子抵抗を無視すると、新しい速度はいくつですか。`],
          a: { type: 'num', v: n2, rel: 0.002, unit: ['rpm', 'rpm'] },
          hint: ['With $V/f$ fixed and stator resistance neglected, the torque depends on the slip speed $n_s - n$ only, so the curve slides sideways.', '$V/f$ 一定で固定子抵抗を無視すると、トルクはすべり速度 $n_s - n$ だけで決まるので、曲線は横にずれます。'],
          sol: [[`At $50$ Hz the slip speed is $1500 - ${n(n1)} = ${n(ns1 - n1)}$ rpm.`, `$50$ Hz でのすべり速度は $1500 - ${n(n1)} = ${n(ns1 - n1)}$ rpm です。`], [`At $${f2}$ Hz, $n_s = 60 \\times ${f2}/2 = ${n(ns2)}$ rpm, and the same torque needs the same slip speed, so $n = ${n(ns2)} - ${n(ns1 - n1)} = ${n(n2)}$ rpm.`, `$${f2}$ Hz では $n_s = 60 \\times ${f2}/2 = ${n(ns2)}$ rpm で、同じトルクには同じすべり速度が必要なので $n = ${n(ns2)} - ${n(ns1 - n1)} = ${n(n2)}$ rpm です。`], ['The slip as a fraction grows at low frequency, but the motor still holds its speed tightly: this is why a drive can set speed so precisely. In the figure the real stator resistance makes the shift slightly larger.', '低い周波数では割合としてのすべりは大きくなりますが、電動機はやはり速度をしっかり保ちます。だからインバータは速度を正確に決められるのです。図では実際の固定子抵抗のため、ずれが少し大きくなります。']],
          set: { f: f2, TL: 1, load: 0, rr: 1 },
        };
      }
      if (form === 2) {
        const sm = r.pick([0.1, 0.12, 0.15, 0.2, 0.25]);
        return {
          q: [`Neglecting stator resistance, the torque of an induction motor follows Kloss's formula. If it breaks down at slip $s_{\\max} = ${n(sm)}$, write $T/T_{\\max}$ as a function of the slip $s$.`, `固定子抵抗を無視すると、誘導電動機のトルクはクロスの式に従います。停動すべりが $s_{\\max} = ${n(sm)}$ のとき、$T/T_{\\max}$ をすべり $s$ の関数として書いてください。`],
          a: { type: 'expr', v: `2/(s/${sm}+${sm}/s)`, vars: ['s'], dom: { s: [0.01, 0.9] }, lhs: ['$T/T_{\\max} =$', '$T/T_{\\max} =$'] },
          hint: ['With $R_1 = 0$, $T \\propto \\dfrac{R_2/s}{(R_2/s)^2 + X^2}$. Divide by its value at $s = R_2/X$.', '$R_1 = 0$ なら $T \\propto \\dfrac{R_2/s}{(R_2/s)^2 + X^2}$ です。$s = R_2/X$ での値で割ります。'],
          sol: [['Writing $x = R_2/(sX) = s_{\\max}/s$, the torque is proportional to $x/(x^2 + 1)$, which peaks at $x = 1$ with value $\\tfrac12$.', '$x = R_2/(sX) = s_{\\max}/s$ とおくと、トルクは $x/(x^2 + 1)$ に比例し、$x = 1$ で最大値 $\\tfrac12$ をとります。'], [`So $T/T_{\\max} = \\dfrac{2x}{1 + x^2} = \\dfrac{2}{s/${n(sm)} + ${n(sm)}/s}$.`, `したがって $T/T_{\\max} = \\dfrac{2x}{1 + x^2} = \\dfrac{2}{s/${n(sm)} + ${n(sm)}/s}$ です。`], [`For small slip this is about $2s/${n(sm)}$, the straight running region; for large slip about $2 \\times ${n(sm)}/s$. At standstill it gives $${n(2 / (1 / sm + sm), 3)}$ of the peak as starting torque.`, `すべりが小さいとほぼ $2s/${n(sm)}$ で、まっすぐな運転領域です。すべりが大きいとほぼ $2 \\times ${n(sm)}/s$ です。静止時は最大値の $${n(2 / (1 / sm + sm), 3)}$ 倍が始動トルクになります。`]],
        };
      }
      const v = r.pick([0.8, 0.85, 0.9, 0.95, 1.05, 1.1]);
      return {
        q: [`The supply voltage of an induction motor changes to $${n(100 * v)}\\%$ of normal at the same frequency. By what percentage of its normal value is the breakdown torque now?`, `誘導電動機の電源電圧が、周波数は同じまま通常の $${n(100 * v)}\\%$ になります。停動トルクは通常の何パーセントになりますか。`],
        a: { type: 'num', v: 100 * v * v, tol: 0.05, unit: ['%', '%'] },
        hint: ['$T_{\\max} \\propto V_{\\rm th}^2$, and $V_{\\rm th}$ is proportional to the supply voltage.', '$T_{\\max} \\propto V_{\\rm th}^2$ で、$V_{\\rm th}$ は電源電圧に比例します。'],
        sol: [[`Every torque in the circuit scales as the square of the voltage: $${n(v)}^2 = ${n(v * v, 4)}$, so $T_{\\max}$ becomes $${n(100 * v * v, 3)}\\%$ of normal.`, `回路のトルクはすべて電圧の二乗に比例するので $${n(v)}^2 = ${n(v * v, 4)}$ となり、$T_{\\max}$ は通常の $${n(100 * v * v, 3)}\\%$ になります。`], [v < 1 ? 'The breakdown slip does not change, but a motor loaded close to its breakdown torque can stall during a voltage sag, which is why sags trip industrial plants.' : 'The breakdown slip does not change; the extra margin comes with higher magnetising current and iron loss.', v < 1 ? '停動すべりは変わりませんが、停動トルク近くまで負荷をかけた電動機は電圧低下の間に停止しうるので、電圧低下は工場を停止させます。' : '停動すべりは変わりません。余裕は増えますが、励磁電流と鉄損も大きくなります。']],
      };
    },
  ];
})();
