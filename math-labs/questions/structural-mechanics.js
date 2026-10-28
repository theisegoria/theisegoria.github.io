'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, SPAN = 24, BL = 6;
  const KAP = [PI, PI / 2, 2 * PI, 4.493409457909064];                 // kappa_1 for pinned-pinned, fixed-free, fixed-fixed, fixed-pinned
  const KF = KAP.map((k) => PI / k);                                   // effective length factors 1, 2, 0.5, 0.699
  const BCN = [['pinned at both ends', '両端ピン'], ['fixed at the base and free at the top', '下端固定で上端自由'], ['fixed at both ends', '両端固定'], ['fixed at the base and pinned at the top', '下端固定で上端ピン']];
  const EI_TUBE = 55.5, R_TUBE = 19.85e-3, E_STEEL = 200e9, SY = 250e6;   // kN m^2, m, Pa, Pa

  /* ---------------- truss-bridge ---------------- */
  Q['truss-bridge'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const j = r.int(5, 16), m = 2 * j - 3;
        return {
          q: [`A pin-jointed truss on one pin and one roller support has $${j}$ joints. How many bars does it need to be exactly statically determinate?`, `ピンとローラーの二つの支点をもつピン接合のトラスに、節点が $${j}$ 個あります。ちょうど静定になるには、棒が何本必要ですか。`],
          a: { type: 'int', v: m },
          hint: ['Count unknowns (bars plus three reactions) against equations (two per joint).', '未知数（棒と三つの反力）と方程式（節点ごとに二つ）を数えます。'],
          sol: [[`Each joint gives two equations, so there are $2j = ${2 * j}$ equations. The unknowns are the $m$ bar forces and three reactions.`, `節点ごとに方程式が二つなので、方程式は $2j = ${2 * j}$ 個です。未知数は $m$ 本の棒の力と三つの反力です。`], [`Setting $m + 3 = ${2 * j}$ gives $m = ${m}$. Fewer bars is a mechanism that can fold up; more is statically indeterminate.`, `$m + 3 = ${2 * j}$ より $m = ${m}$ です。これより少ないと折りたためる機構になり、多いと不静定になります。`]],
        };
      }
      if (form === 1) {
        const Pl = r.pick([20, 40, 60, 80, 100, 120, 160]), a = r.pick([2, 4, 6, 8, 10, 14, 16, 18, 20, 22]);
        const RA = Pl * (SPAN - a) / SPAN, RB = Pl * a / SPAN;
        return {
          q: [`A $${SPAN}$ m truss bridge on a pin at the left and a roller at the right carries a downward load of $${Pl}$ kN at a distance $x = ${a}$ m from the left support. Find the two reactions.`, `ピンとローラーで支えられた支間 $${SPAN}$ m のトラス橋が、左の支点から $x = ${a}$ m の位置で下向きに $${Pl}$ kN の荷重を受けています。二つの反力を求めてください。`],
          a: { type: 'tuple', v: [RA, RB], labels: [['left', '左'], ['right', '右']], tol: 0.02, unit: ['kN', 'kN'] },
          hint: ['Take moments about one support.', '一方の支点まわりのモーメントをとります。'],
          sol: [[`Moments about the left support: $R_B \\times ${SPAN} = ${Pl} \\times ${a}$, so $R_B = ${n(RB, 4)}$ kN.`, `左の支点まわりのモーメント：$R_B \\times ${SPAN} = ${Pl} \\times ${a}$ より $R_B = ${n(RB, 4)}$ kN です。`], [`The vertical forces add to zero: $R_A = ${Pl} - ${n(RB, 4)} = ${n(RA, 4)}$ kN. The nearer support carries more.`, `鉛直方向の力の和はゼロなので $R_A = ${Pl} - ${n(RB, 4)} = ${n(RA, 4)}$ kN です。近い方の支点がより多く受け持ちます。`]],
          set: { P: Pl, x: a },
        };
      }
      return {
        q: ['A bar in a truss is in tension. What does it do to the joint at one of its ends?', 'トラスの棒が引張を受けています。その棒は端の節点に何をしますか。'],
        a: { type: 'choice', fixed: true, v: 0, opts: [['It pulls the joint toward the bar', '節点を棒の方へ引く'], ['It pushes the joint away from the bar', '節点を棒から遠ざける向きに押す'], ['It pushes the joint sideways, across the bar', '節点を棒と直角の横向きに押す'], ['Nothing; only the supports exert forces on joints', '何もしない。節点に力を及ぼすのは支点だけ']] },
        hint: ['A stretched bar tries to shorten.', '引き伸ばされた棒は縮もうとします。'],
        sol: [['A bar in tension is being stretched, so it pulls inward on both of its end joints, along its own line.', '引張を受ける棒は引き伸ばされているので、両端の節点を自分の線に沿って内側へ引きます。'], ['A bar in compression does the opposite and pushes its joints outward. This is the sign convention behind the blue and orange bars.', '圧縮を受ける棒はその逆で、節点を外へ押します。青い棒と橙の棒の区別はこの符号の約束によります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Pl = r.pick([20, 40, 60, 80, 100, 120]), a = r.pick([4, 8, 12, 16, 20]), h = r.pick([3, 4, 5, 6]);
        const M = Pl * a * (SPAN - a) / SPAN, F = M / h;
        return {
          q: [`A Pratt truss of six $4$ m panels is $${h}$ m high. A load of $${Pl}$ kN acts on the joint $${a}$ m from the left support. Using the truss as a beam, what is the largest force in any chord (top or bottom)?`, `六つの 4 m パネルからなる高さ $${h}$ m のプラットトラスです。左の支点から $${a}$ m の節点に $${Pl}$ kN の荷重がかかっています。トラスをはりとみなすと、上弦材と下弦材のうち最大の力はいくらですか。`],
          a: { type: 'num', v: F, rel: 0.01, unit: ['kN', 'kN'] },
          hint: ['The chords carry the bending moment as a couple: $F = M/h$, and $M$ is largest under the load.', '弦材はモーメントを偶力として受けるので $F = M/h$ で、$M$ は荷重の真下で最大です。'],
          sol: [[`The reactions are $R_A = ${n(Pl * (SPAN - a) / SPAN, 4)}$ kN and $R_B = ${n(Pl * a / SPAN, 4)}$ kN, so under the load $M = R_A \\times ${a} = ${n(M, 4)}$ kN·m.`, `反力は $R_A = ${n(Pl * (SPAN - a) / SPAN, 4)}$ kN、$R_B = ${n(Pl * a / SPAN, 4)}$ kN なので、荷重の真下では $M = R_A \\times ${a} = ${n(M, 4)}$ kN·m です。`], [`$F = M/h = ${n(M, 4)}/${h} = ${n(F, 4)}$ kN, tension in the bottom chord and compression in the top chord.`, `$F = M/h = ${n(M, 4)}/${h} = ${n(F, 4)}$ kN で、下弦材は引張、上弦材は圧縮です。`]],
          set: { type: 0, n: 6, h, P: Pl, x: a },
        };
      }
      if (form === 1) {
        const nn = r.pick([4, 6, 8]), s = SPAN / nn, h = r.pick([3, 4, 5, 6]), Pl = r.pick([40, 80, 120, 160]);
        const sin = h / Math.hypot(s, h), V = Pl / 2, F = V / sin;
        return {
          q: [`A Pratt truss with ${nn} panels of $${n(s)}$ m, height $${h}$ m, carries $${Pl}$ kN on its middle joint. Find the force in a diagonal in the left half of the truss.`, `パネルが ${nn} 個（各 $${n(s)}$ m）、高さ $${h}$ m のプラットトラスの中央の節点に $${Pl}$ kN がかかっています。左半分の斜材の力を求めてください。`],
          a: { type: 'num', v: F, rel: 0.01, unit: ['kN', 'kN'] },
          hint: ['The shear in every panel of the left half is the left reaction; the diagonal carries it along its slope.', '左半分のどのパネルのせん断力も左の反力に等しく、斜材はそれを自分の傾きに沿って受け持ちます。'],
          sol: [[`By symmetry $R_A = ${Pl}/2 = ${n(V)}$ kN, so the shear is $V = ${n(V)}$ kN in every left panel.`, `対称性から $R_A = ${Pl}/2 = ${n(V)}$ kN で、左のどのパネルのせん断力も $V = ${n(V)}$ kN です。`], [`The diagonal spans $${n(s)}$ m across and $${h}$ m up, so $\\sin\\theta = ${h}/\\sqrt{${n(s)}^2 + ${h}^2} = ${n(sin, 4)}$.`, `斜材は水平に $${n(s)}$ m、鉛直に $${h}$ m 進むので $\\sin\\theta = ${h}/\\sqrt{${n(s)}^2 + ${h}^2} = ${n(sin, 4)}$ です。`], [`$F = V/\\sin\\theta = ${n(F, 4)}$ kN, in tension.`, `$F = V/\\sin\\theta = ${n(F, 4)}$ kN で、引張です。`]],
          set: { type: 0, n: nn, h, P: Pl, x: 12 },
        };
      }
      const nn = r.pick([4, 6, 8]), s = SPAN / nn, h = r.pick([3, 4, 5, 6]), Pl = r.pick([40, 60, 100, 120, 200]);
      const sin = h / Math.hypot(s / 2, h), F = Pl / (2 * sin);
      return {
        q: [`A Warren truss of ${nn} panels of $${n(s)}$ m and height $${h}$ m carries $${Pl}$ kN on the bottom joint at mid-span. The two diagonals meeting at that joint carry the same force. What is it?`, `パネルが ${nn} 個（各 $${n(s)}$ m）、高さ $${h}$ m のワーレントラスの、中央の下側の節点に $${Pl}$ kN がかかっています。その節点に集まる二本の斜材は同じ力を受け持ちます。その力はいくらですか。`],
        a: { type: 'num', v: F, rel: 0.01, unit: ['kN', 'kN'] },
        hint: ['At the loaded joint the vertical forces must balance. The chords are horizontal, so only the diagonals can carry the load.', '荷重のかかる節点では鉛直方向の力がつり合わなければなりません。弦材は水平なので、荷重を受けられるのは斜材だけです。'],
        sol: [[`Each diagonal runs $${n(s / 2)}$ m across and $${h}$ m up, so $\\sin\\theta = ${n(sin, 4)}$.`, `斜材は水平に $${n(s / 2)}$ m、鉛直に $${h}$ m 進むので $\\sin\\theta = ${n(sin, 4)}$ です。`], [`Vertical balance at the joint: $2F\\sin\\theta = ${Pl}$, so $F = ${Pl}/(2 \\times ${n(sin, 4)}) = ${n(F, 4)}$ kN.`, `節点での鉛直方向のつり合い：$2F\\sin\\theta = ${Pl}$ より $F = ${Pl}/(2 \\times ${n(sin, 4)}) = ${n(F, 4)}$ kN です。`], ['Both diagonals pull up on the joint, so they are in tension; the horizontal components cancel.', '二本の斜材は節点を上へ引くので引張で、水平方向の成分は打ち消し合います。']],
        set: { type: 2, n: nn, h, P: Pl, x: 12 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Pl = r.pick([20, 40, 60, 100, 120]), h = r.pick([3, 4, 5, 6, 8]);
        return {
          q: [`A truss of height $${h}$ m and span $${SPAN}$ m carries a load of $${Pl}$ kN that stands a distance $x$ from the left support, with $x \\le 12$ m. Write the chord force at the section through the middle joint, in kN, as a function of $x$ (the beam moment divided by the height).`, `高さ $${h}$ m、支間 $${SPAN}$ m のトラスが、左の支点から距離 $x$（$x \\le 12$ m）の位置で $${Pl}$ kN の荷重を受けています。中央の節点を通る断面の弦材の力（kN）を $x$ の関数として書いてください（はりのモーメントを高さで割ったもの）。`],
          a: { type: 'expr', v: `${Pl}*x/${2 * h}`, vars: ['x'], dom: { x: [1, 11] }, lhs: ['$F(x) =$', '$F(x) =$'] },
          hint: ['The load is left of the middle, so the right support carries $R_B = Px/L$. Take moments of the right-hand part about the middle.', '荷重は中央より左にあるので、右の支点は $R_B = Px/L$ を受けます。中央まわりで右側の部分のモーメントをとります。'],
          sol: [[`$R_B = ${Pl}\\,x/${SPAN}$, so the moment at mid-span is $M = R_B \\times 12 = ${n(Pl / 2)}\\,x$ (kN·m).`, `$R_B = ${Pl}\\,x/${SPAN}$ なので、中央のモーメントは $M = R_B \\times 12 = ${n(Pl / 2)}\\,x$（kN·m）です。`], [`$F = M/h = ${n(Pl / 2)}\\,x/${h} = ${Pl}\\,x/${2 * h}$.`, `$F = M/h = ${n(Pl / 2)}\\,x/${h} = ${Pl}\\,x/${2 * h}$ です。`], ['The chord force grows linearly as the load moves toward the middle and peaks there: the worst position of a moving load for the chords is mid-span.', '荷重が中央に近づくにつれ弦材の力は直線的に増え、中央で最大になります。弦材にとって移動荷重の最悪の位置は中央です。']],
          set: { P: Pl, h },
        };
      }
      if (form === 1) {
        const howe = r.chance(0.5);
        return {
          q: [`A ${howe ? 'Howe' : 'Pratt'} truss carries a downward load at mid-span. In the panels next to the supports, are the diagonals in tension or compression?`, `${howe ? 'ハウ' : 'プラット'}トラスの中央に下向きの荷重がかかっています。支点に近いパネルの斜材は引張ですか、圧縮ですか。`],
          a: { type: 'choice', fixed: true, v: howe ? 1 : 0, opts: [['Tension', '引張'], ['Compression', '圧縮']] },
          hint: ['A Pratt diagonal runs down toward the centre; a Howe diagonal runs up toward the centre. Which way must a bar slope to carry the shear by stretching?', 'プラットの斜材は中央に向かって下がり、ハウの斜材は中央に向かって上がります。引張でせん断力を受けるには、どちらへ傾く必要がありますか。'],
          sol: [['Near the left support the shear is up and equal to the reaction. Cut the panel and the diagonal must push or pull on the left part to balance the reaction.', '左の支点の近くではせん断力は上向きで、反力に等しくなります。パネルを切ると、斜材は反力とつり合うよう、左の部分を押すか引くかしなければなりません。'], [howe ? 'A Howe diagonal rises toward the centre, so to lift the left part it must push: compression. The verticals of a Howe truss are the ties.' : 'A Pratt diagonal falls toward the centre, so to lift the left part it must pull: tension. That is why long Pratt diagonals could be thin rods or cables.', howe ? 'ハウの斜材は中央に向かって上がるので、左の部分を持ち上げるには押さなければならず、圧縮です。ハウの垂直材が引張材になります。' : 'プラットの斜材は中央に向かって下がるので、左の部分を持ち上げるには引かなければならず、引張です。だから長いプラットの斜材は細い棒やケーブルにできました。']],
          set: { type: howe ? 1 : 0, n: 6, P: 100, x: 12 },
        };
      }
      const j = r.int(6, 14), rr = r.pick([3, 3, 4]), extra = r.int(0, 3), m = 2 * j - rr + extra;
      return {
        q: [`A truss has $${j}$ joints and $${m}$ bars, and its supports supply $${rr}$ reaction components in all. What is its degree of static indeterminacy $m + r - 2j$?`, `トラスに節点が $${j}$ 個、棒が $${m}$ 本あり、支点が与える反力成分は合わせて $${rr}$ 個です。静的不静定次数 $m + r - 2j$ はいくつですか。`],
        a: { type: 'int', v: m + rr - 2 * j },
        hint: ['Compare the number of unknowns $m + r$ with the number of equilibrium equations $2j$.', '未知数の数 $m + r$ とつり合いの方程式の数 $2j$ を比べます。'],
        sol: [[`$m + r - 2j = ${m} + ${rr} - ${2 * j} = ${m + rr - 2 * j}$.`, `$m + r - 2j = ${m} + ${rr} - ${2 * j} = ${m + rr - 2 * j}$ です。`], [m + rr - 2 * j === 0 ? 'Zero means determinate: the member forces follow from equilibrium alone.' : 'A positive number means that many bars are redundant: equilibrium alone cannot give the forces, and the bars\' stiffness must be used as well.', m + rr - 2 * j === 0 ? 'ゼロは静定を意味し、棒の力はつり合いだけから決まります。' : '正の数は、その数だけ余分な棒があることを意味します。つり合いだけでは力が決まらず、棒の剛性も使う必要があります。']],
      };
    },
  ];

  /* ---------------- beam-diagrams ---------------- */
  Q['beam-diagrams'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const w = r.pick([2, 4, 5, 8, 10, 12, 20]);
        const M = w * BL * BL / 8;
        return {
          q: [`A simply supported beam of span $${BL}$ m carries a uniform load of $${w}$ kN/m. What is the largest bending moment?`, `支間 $${BL}$ m の単純支持のはりが、等分布荷重 $${w}$ kN/m を受けています。最大の曲げモーメントはいくらですか。`],
          a: { type: 'num', v: M, rel: 0.005, unit: ['kN·m', 'kN·m'] },
          hint: ['By symmetry each support carries half the load, and the moment peaks where the shear is zero.', '対称なので各支点が荷重の半分を受け持ち、モーメントはせん断力がゼロの位置で最大になります。'],
          sol: [[`Each reaction is $wL/2 = ${n(w * BL / 2)}$ kN, and the shear $V = wL/2 - wx$ vanishes at mid-span.`, `反力は各 $wL/2 = ${n(w * BL / 2)}$ kN で、せん断力 $V = wL/2 - wx$ は中央でゼロになります。`], [`$M_{\\max} = wL^2/8 = ${w} \\times ${BL * BL}/8 = ${n(M)}$ kN·m.`, `$M_{\\max} = wL^2/8 = ${w} \\times ${BL * BL}/8 = ${n(M)}$ kN·m です。`]],
          set: { sup: 1, P: 0, w },
        };
      }
      if (form === 1) {
        const Pl = r.pick([10, 20, 30, 40, 60, 80]);
        const M = Pl * BL / 4;
        return {
          q: [`A simply supported beam of span $${BL}$ m carries a single load of $${Pl}$ kN at mid-span. Find the support reaction and the largest bending moment.`, `支間 $${BL}$ m の単純支持のはりの中央に、$${Pl}$ kN の荷重が一つかかっています。支点の反力と最大の曲げモーメントを求めてください。`],
          a: { type: 'tuple', v: [Pl / 2, M], labels: [['reaction (kN)', '反力（kN）'], ['$M_{\\max}$ (kN·m)', '$M_{\\max}$（kN·m）']], tol: 0.02 },
          hint: ['Symmetry halves the load; then the moment at mid-span is the reaction times the lever arm.', '対称性で荷重が半分ずつになり、中央のモーメントは反力に腕の長さをかけたものです。'],
          sol: [[`$R = ${Pl}/2 = ${n(Pl / 2)}$ kN at each end.`, `各端の反力は $R = ${Pl}/2 = ${n(Pl / 2)}$ kN です。`], [`$M_{\\max} = R \\times ${BL / 2} = PL/4 = ${n(M)}$ kN·m, at the load.`, `$M_{\\max} = R \\times ${BL / 2} = PL/4 = ${n(M)}$ kN·m で、荷重の位置です。`]],
          set: { sup: 1, P: Pl, a: 3, w: 0 },
        };
      }
      if (form === 2) {
        const Pl = r.pick([5, 10, 15, 20, 25, 40]);
        return {
          q: [`A cantilever of length $${BL}$ m carries a tip load of $${Pl}$ kN. What is the magnitude of the bending moment at the wall?`, `長さ $${BL}$ m の片持ちはりの先端に $${Pl}$ kN の荷重がかかっています。固定端の曲げモーメントの大きさはいくらですか。`],
          a: { type: 'num', v: Pl * BL, rel: 0.005, unit: ['kN·m', 'kN·m'] },
          hint: ['Moment is force times lever arm, with the arm measured from the wall to the load.', 'モーメントは力に腕の長さをかけたもので、腕は固定端から荷重までです。'],
          sol: [[`$M = P L = ${Pl} \\times ${BL} = ${n(Pl * BL)}$ kN·m.`, `$M = P L = ${Pl} \\times ${BL} = ${n(Pl * BL)}$ kN·m です。`], ['The beam bends hogging (convex up) all along its length; the moment falls linearly to zero at the free tip, where nothing holds it.', 'はりは全長にわたって上に凸に曲がります（負のモーメント）。モーメントは直線的に減り、何も支えのない自由端でゼロになります。']],
          set: { sup: 0, P: Pl, a: 6, w: 0 },
        };
      }
      return {
        q: ['A single point load acts on a beam. What happens to the shear force and the bending moment diagrams at the load?', 'はりに集中荷重が一つかかっています。荷重の位置で、せん断力図と曲げモーメント図はどうなりますか。'],
        a: { type: 'choice', fixed: true, v: 0, opts: [['Shear jumps by the load; moment has a kink but no jump', 'せん断力は荷重の大きさだけ跳び、モーメントは折れ曲がるが跳ばない'], ['Moment jumps by the load; shear has a kink', 'モーメントが荷重の大きさだけ跳び、せん断力は折れ曲がる'], ['Both jump', 'どちらも跳ぶ'], ['Neither changes', 'どちらも変わらない']] },
        hint: ['$dM/dx = V$ and $dV/dx = -w$: a point load is an infinite $w$ over zero length.', '$dM/dx = V$、$dV/dx = -w$ です。集中荷重は長さゼロに無限大の $w$ がかかったものです。'],
        sol: [['Integrating $dV/dx = -w$ across a point load of size $P$ gives a drop $\\Delta V = -P$: the shear jumps.', '大きさ $P$ の集中荷重をはさんで $dV/dx = -w$ を積分すると $\\Delta V = -P$ の低下になり、せん断力が跳びます。'], ['$M$ is the integral of $V$, so it stays continuous but its slope changes from $V_{\\rm left}$ to $V_{\\rm right}$: a kink.', '$M$ は $V$ の積分なので連続のままで、傾きだけが $V_{\\rm left}$ から $V_{\\rm right}$ に変わります。折れ曲がりです。']],
        set: { sup: 1, P: 40, a: 2, w: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const b = 0.15, E = 200e6;
      if (form === 0) {
        const Pl = r.pick([10, 20, 30, 40, 60]), h = r.pick([200, 250, 300, 350, 400, 500]);
        const I = b * (h / 1000) ** 3 / 12, d = Pl * BL ** 3 / (48 * E * I) * 1000;
        return {
          q: [`A steel beam ($E = 200$ GPa) of span $${BL}$ m, width $150$ mm and depth $${h}$ mm is simply supported and carries $${Pl}$ kN at mid-span. Find the mid-span deflection.`, `鋼のはり（$E = 200$ GPa）の支間は $${BL}$ m、幅 $150$ mm、高さ $${h}$ mm で、単純支持され、中央に $${Pl}$ kN がかかっています。中央のたわみを求めてください。`],
          a: { type: 'num', v: d, rel: 0.01, unit: ['mm', 'mm'] },
          hint: ['First $I = bh^3/12$ in m⁴, then $\\delta = PL^3/(48EI)$ with $P$ in kN and $EI$ in kN·m².', 'まず $I = bh^3/12$ を m⁴ で求め、$P$ を kN、$EI$ を kN·m² として $\\delta = PL^3/(48EI)$ を使います。'],
          sol: [[`$I = 0.15 \\times ${n(h / 1000, 4)}^3/12 = ${n(I * 1e4, 4)}\\times10^{-4}$ m⁴, so $EI = ${n(E * I, 5)}$ kN·m².`, `$I = 0.15 \\times ${n(h / 1000, 4)}^3/12 = ${n(I * 1e4, 4)}\\times10^{-4}$ m⁴ なので $EI = ${n(E * I, 5)}$ kN·m² です。`], [`$\\delta = ${Pl} \\times ${BL ** 3}/(48 \\times ${n(E * I, 5)}) = ${n(d / 1000, 4)}$ m $= ${n(d, 4)}$ mm.`, `$\\delta = ${Pl} \\times ${BL ** 3}/(48 \\times ${n(E * I, 5)}) = ${n(d / 1000, 4)}$ m $= ${n(d, 4)}$ mm です。`]],
          set: { sup: 1, P: Pl, a: 3, w: 0, h },
        };
      }
      if (form === 1) {
        const Pl = r.pick([10, 20, 30, 40, 50]), h = r.pick([200, 250, 300, 400, 500]);
        const M = Pl * BL, s = 6 * M / (b * (h / 1000) ** 2) / 1000;
        return {
          q: [`A cantilever of length $${BL}$ m, width $150$ mm and depth $${h}$ mm carries a tip load of $${Pl}$ kN. What is the largest bending stress, at the wall?`, `長さ $${BL}$ m、幅 $150$ mm、高さ $${h}$ mm の片持ちはりの先端に $${Pl}$ kN がかかっています。固定端での最大の曲げ応力はいくらですか。`],
          a: { type: 'num', v: s, rel: 0.01, unit: ['MPa', 'MPa'] },
          hint: ['$\\sigma_{\\max} = M c/I = 6M/(bh^2)$ with the moment at the wall.', '固定端のモーメントを用いて $\\sigma_{\\max} = M c/I = 6M/(bh^2)$ です。'],
          sol: [[`$M = PL = ${Pl} \\times ${BL} = ${n(M)}$ kN·m.`, `$M = PL = ${Pl} \\times ${BL} = ${n(M)}$ kN·m です。`], [`$\\sigma = 6 \\times ${n(M * 1000)}/(0.15 \\times ${n(h / 1000, 4)}^2) = ${n(s * 1e6, 5)}$ Pa $= ${n(s, 4)}$ MPa.`, `$\\sigma = 6 \\times ${n(M * 1000)}/(0.15 \\times ${n(h / 1000, 4)}^2) = ${n(s * 1e6, 5)}$ Pa $= ${n(s, 4)}$ MPa です。`], ['It is tension on the top face and compression on the bottom face of a cantilever, since it hogs.', '片持ちはりは上に凸に曲がるので、上面が引張、下面が圧縮です。']],
          set: { sup: 0, P: Pl, a: 6, w: 0, h },
        };
      }
      const Pl = r.pick([20, 30, 40, 60]), a = r.step(1, 5, 0.5), x = r.pick([0.5, 1, 1.5, 2, 3, 4, 5].filter((q) => Math.abs(q - a) > 0.3));
      const RA = Pl * (BL - a) / BL, V = x < a ? RA : RA - Pl;
      return {
        q: [`A simply supported beam of span $${BL}$ m carries $${Pl}$ kN at $${n(a)}$ m from the left end. What is the shear force $V$ at a section $${n(x)}$ m from the left end (positive when the left part is pushed up)?`, `支間 $${BL}$ m の単純支持のはりの、左端から $${n(a)}$ m に $${Pl}$ kN がかかっています。左端から $${n(x)}$ m の断面のせん断力 $V$（左の部分が上に押されるとき正）はいくらですか。`],
        a: { type: 'num', v: V, tol: 0.02, unit: ['kN', 'kN'] },
        hint: ['$V$ is the left reaction minus the loads to the left of the section.', '$V$ は左の反力から、断面より左にある荷重を引いたものです。'],
        sol: [[`$R_A = ${Pl} \\times (${BL} - ${n(a)})/${BL} = ${n(RA, 4)}$ kN.`, `$R_A = ${Pl} \\times (${BL} - ${n(a)})/${BL} = ${n(RA, 4)}$ kN です。`], [x < a ? `The section is left of the load, so $V = R_A = ${n(V, 4)}$ kN.` : `The load is left of the section, so $V = R_A - ${Pl} = ${n(V, 4)}$ kN.`, x < a ? `断面は荷重より左にあるので $V = R_A = ${n(V, 4)}$ kN です。` : `荷重は断面より左にあるので $V = R_A - ${Pl} = ${n(V, 4)}$ kN です。`]],
        set: { sup: 1, P: Pl, a, w: 0, cut: x },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const w = r.pick([2, 4, 6, 8, 10, 12]);
        return {
          q: [`A simply supported beam of span $${BL}$ m carries a uniform load of $${w}$ kN/m. Write the bending moment $M(x)$ (kN·m) at distance $x$ from the left end.`, `支間 $${BL}$ m の単純支持のはりが等分布荷重 $${w}$ kN/m を受けています。左端から距離 $x$ の曲げモーメント $M(x)$（kN·m）を書いてください。`],
          a: { type: 'expr', v: `${w}*x*(${BL}-x)/2`, vars: ['x'], dom: { x: [0.3, 5.7] }, lhs: ['$M(x) =$', '$M(x) =$'] },
          hint: ['$M(x) = R x - w x^2/2$ with $R = wL/2$.', '$R = wL/2$ として $M(x) = R x - w x^2/2$ です。'],
          sol: [[`$R = ${w} \\times ${BL}/2 = ${n(w * BL / 2)}$ kN.`, `$R = ${w} \\times ${BL}/2 = ${n(w * BL / 2)}$ kN です。`], [`$M(x) = ${n(w * BL / 2)}\\,x - ${n(w / 2)}\\,x^2 = ${w}\\,x(${BL} - x)/2$.`, `$M(x) = ${n(w * BL / 2)}\\,x - ${n(w / 2)}\\,x^2 = ${w}\\,x(${BL} - x)/2$ です。`], ['It is a parabola, zero at the supports and largest where the shear is zero, at mid-span.', '放物線で、支点でゼロ、せん断力がゼロになる中央で最大です。']],
          set: { sup: 1, P: 0, w },
        };
      }
      if (form === 1) {
        const k = r.pick([1.5, 2, 2.5, 3]), what = r.int(0, 1);
        return {
          q: [what ? `A beam is replaced by one of the same width and material but ${n(k)} times as deep, under the same load. By what factor does the largest bending stress fall?` : `A beam is replaced by one of the same width and material but ${n(k)} times as deep, under the same load. By what factor does the deflection fall?`, what ? `はりを、同じ幅と材料で高さが ${n(k)} 倍のものに替え、荷重は同じとします。最大の曲げ応力は何分の一になりますか。` : `はりを、同じ幅と材料で高さが ${n(k)} 倍のものに替え、荷重は同じとします。たわみは何分の一になりますか。`],
          a: { type: 'num', v: what ? k * k : k ** 3, rel: 0.005 },
          hint: [what ? 'Stress goes as $M/(bh^2)$.' : 'Deflection goes as $1/I$, and $I = bh^3/12$.', what ? '応力は $M/(bh^2)$ に比例します。' : 'たわみは $1/I$ に比例し、$I = bh^3/12$ です。'],
          sol: [[what ? `$\\sigma = 6M/(bh^2)$ scales as $1/h^2$.` : `$\\delta \\propto 1/(EI)$ and $I = bh^3/12$ scales as $h^3$.`, what ? `$\\sigma = 6M/(bh^2)$ は $1/h^2$ に比例します。` : `$\\delta \\propto 1/(EI)$ で、$I = bh^3/12$ は $h^3$ に比例します。`], [what ? `Factor $${n(k)}^2 = ${n(k * k)}$.` : `Factor $${n(k)}^3 = ${n(k ** 3)}$.`, what ? `倍率は $${n(k)}^2 = ${n(k * k)}$ です。` : `倍率は $${n(k)}^3 = ${n(k ** 3)}$ です。`], ['Depth is the cheapest stiffness there is, which is why beams are deep and why I-beams put their material far from the neutral axis.', '高さは最も安上がりな剛性の源です。はりが背高なのも、I 形鋼が材料を中立軸から遠くに置くのもそのためです。']],
        };
      }
      if (form === 2) {
        const w = r.pick([4, 6, 8, 10, 12, 16]);
        const Rp = 3 * w * BL / 8, Mf = w * BL * BL / 8;
        return {
          q: [`A beam of span $${BL}$ m is fixed at the left end and simply supported at the right, and carries a uniform load of $${w}$ kN/m. Find the reaction at the simple support and the magnitude of the moment at the fixed end.`, `支間 $${BL}$ m のはりが左端で固定、右端で単純支持され、等分布荷重 $${w}$ kN/m を受けています。単純支持の反力と、固定端のモーメントの大きさを求めてください。`],
          a: { type: 'tuple', v: [Rp, Mf], labels: [['$R$ (kN)', '$R$（kN）'], ['$M_{\\rm fixed}$ (kN·m)', '$M_{\\rm fixed}$（kN·m）']], tol: 0.03 },
          hint: ['Statics alone is not enough. Use compatibility: the tip deflection of the cantilever under the load must be cancelled by the prop force.', 'つり合いだけでは足りません。適合条件を使います。片持ちとしての荷重による先端のたわみを、支点の反力が打ち消さなければなりません。'],
          sol: [['Remove the prop: the cantilever sags $wL^4/(8EI)$ at the tip. A prop force $R$ lifts it by $RL^3/(3EI)$.', '支点を外すと、片持ちの先端は $wL^4/(8EI)$ だけ下がります。支点の力 $R$ はそれを $RL^3/(3EI)$ だけ持ち上げます。'], [`Setting them equal, $R = 3wL/8 = ${n(Rp, 4)}$ kN.`, `両者を等しくおくと $R = 3wL/8 = ${n(Rp, 4)}$ kN です。`], [`Moment at the wall: $wL^2/2 - RL = wL^2/8 = ${n(Mf, 4)}$ kN·m (hogging).`, `固定端のモーメント：$wL^2/2 - RL = wL^2/8 = ${n(Mf, 4)}$ kN·m（負のモーメント）です。`]],
          set: { sup: 3, P: 0, w },
        };
      }
      const udl = r.chance(0.5);
      return {
        q: [udl ? 'A beam carries a uniform load. By what factor does the mid-span deflection fall when the ends are clamped (fixed–fixed) instead of simply supported?' : 'A beam carries a single load at mid-span. By what factor does the mid-span deflection fall when the ends are clamped (fixed–fixed) instead of simply supported?', udl ? 'はりが等分布荷重を受けています。単純支持から両端固定に変えると、中央のたわみは何分の一になりますか。' : 'はりの中央に集中荷重が一つかかっています。単純支持から両端固定に変えると、中央のたわみは何分の一になりますか。'],
        a: { type: 'int', v: udl ? 5 : 4 },
        hint: [udl ? 'Compare $5wL^4/(384EI)$ with $wL^4/(384EI)$.' : 'Compare $PL^3/(48EI)$ with $PL^3/(192EI)$.', udl ? '$5wL^4/(384EI)$ と $wL^4/(384EI)$ を比べます。' : '$PL^3/(48EI)$ と $PL^3/(192EI)$ を比べます。'],
        sol: [[udl ? 'Simply supported: $\\delta = 5wL^4/(384EI)$. Fixed–fixed: $\\delta = wL^4/(384EI)$.' : 'Simply supported: $\\delta = PL^3/(48EI)$. Fixed–fixed: $\\delta = PL^3/(192EI)$.', udl ? '単純支持：$\\delta = 5wL^4/(384EI)$。両端固定：$\\delta = wL^4/(384EI)$。' : '単純支持：$\\delta = PL^3/(48EI)$。両端固定：$\\delta = PL^3/(192EI)$。'], [udl ? 'The ratio is 5.' : 'The ratio is 4.', udl ? '比は 5 です。' : '比は 4 です。'], ['The clamps put hogging moments at the ends, which bend the beam the other way and flatten the middle.', '固定端には負のモーメントが生じ、はりを逆向きに曲げて中央を平らにします。']],
        set: { sup: 2, P: udl ? 0 : 40, a: 3, w: udl ? 10 : 0 },
      };
    },
  ];

  /* ---------------- column-modes ---------------- */
  Q['column-modes'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const bc = r.int(0, 3);
        return {
          q: [`A column is ${BCN[bc][0]}. What is its effective length factor $K$ for the first buckling mode, so that $P_{\\rm cr} = \\pi^2EI/(KL)^2$?`, `柱は${BCN[bc][1]}です。第一の座屈モードの有効長さ係数 $K$ はいくつですか。$P_{\\rm cr} = \\pi^2EI/(KL)^2$ とします。`],
          a: { type: 'num', v: KF[bc], tol: bc === 3 ? 0.005 : 1e-6 },
          hint: ['$K = \\pi/\\kappa_1$, where $\\kappa_1$ is $\\pi$, $\\pi/2$, $2\\pi$ or $4.4934$.', '$K = \\pi/\\kappa_1$ で、$\\kappa_1$ は $\\pi$、$\\pi/2$、$2\\pi$、$4.4934$ のいずれかです。'],
          sol: [[`For this support $\\kappa_1 = ${n(KAP[bc], 5)}$.`, `この支持では $\\kappa_1 = ${n(KAP[bc], 5)}$ です。`], [`$K = \\pi/\\kappa_1 = ${n(KF[bc], 4)}$: the column buckles like a pinned column of length ${n(KF[bc], 3)} times its own.`, `$K = \\pi/\\kappa_1 = ${n(KF[bc], 4)}$ で、柱は自分の長さの ${n(KF[bc], 3)} 倍の長さの両端ピンの柱のように座屈します。`]],
          set: { bc, brace: 0, mode: 1 },
        };
      }
      if (form === 1) {
        const L = r.step(1.5, 5, 0.5), Pc = Math.PI ** 2 * EI_TUBE / (L * L);
        return {
          q: [`The steel tube in the figure has $EI = 55.5$ kN·m². Pinned at both ends and $${n(L)}$ m long, at what axial load does it buckle?`, `図の鋼管は $EI = 55.5$ kN·m² です。両端ピンで長さが $${n(L)}$ m のとき、軸方向のどの荷重で座屈しますか。`],
          a: { type: 'num', v: Pc, rel: 0.01, unit: ['kN', 'kN'] },
          hint: ['$P_{\\rm cr} = \\pi^2EI/L^2$ for a pinned–pinned column.', '両端ピンの柱では $P_{\\rm cr} = \\pi^2EI/L^2$ です。'],
          sol: [[`$P_{\\rm cr} = \\pi^2 \\times 55.5/${n(L)}^2 = ${n(Pc, 4)}$ kN.`, `$P_{\\rm cr} = \\pi^2 \\times 55.5/${n(L)}^2 = ${n(Pc, 4)}$ kN です。`], ['Doubling the length would cut it to a quarter.', '長さを二倍にすると四分の一になります。']],
          set: { bc: 0, brace: 0, mode: 1, len: L },
        };
      }
      return {
        q: ['The length of a pinned–pinned column is doubled, with the same section and material. What happens to its Euler buckling load?', '断面と材料が同じ両端ピンの柱の長さを二倍にしました。オイラー座屈荷重はどうなりますか。'],
        a: { type: 'choice', fixed: true, v: 1, opts: [['It halves', '半分になる'], ['It falls to a quarter', '四分の一になる'], ['It falls to an eighth', '八分の一になる'], ['It does not change', '変わらない']] },
        hint: ['$P_{\\rm cr} \\propto 1/L^2$.', '$P_{\\rm cr} \\propto 1/L^2$ です。'],
        sol: [['$P_{\\rm cr} = \\pi^2EI/L^2$, so with $L \\to 2L$ it becomes $\\pi^2EI/(4L^2)$.', '$P_{\\rm cr} = \\pi^2EI/L^2$ なので、$L \\to 2L$ では $\\pi^2EI/(4L^2)$ になります。'], ['This steep fall with length is why slender columns are so sensitive: halving the length of a column multiplies its buckling load by four.', '長さによるこの急な低下が、細長い柱が敏感な理由です。柱の長さを半分にすると座屈荷重は四倍になります。']],
        set: { bc: 0, brace: 0, mode: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const bc = r.int(0, 3), L = r.step(1.5, 5, 0.5);
        const Pc = KAP[bc] ** 2 * EI_TUBE / (L * L);
        return {
          q: [`The steel tube in the figure ($EI = 55.5$ kN·m²) is ${n(L)} m long and ${BCN[bc][0]}. Find its first Euler buckling load.`, `図の鋼管（$EI = 55.5$ kN·m²）は長さ ${n(L)} m で、${BCN[bc][1]}です。最初のオイラー座屈荷重を求めてください。`],
          a: { type: 'num', v: Pc, rel: 0.01, unit: ['kN', 'kN'] },
          hint: ['$P = \\kappa^2EI/L^2$ with $\\kappa = \\pi$, $\\pi/2$, $2\\pi$ or $4.4934$ for the four supports.', '四つの支持について $\\kappa = \\pi$、$\\pi/2$、$2\\pi$、$4.4934$ として $P = \\kappa^2EI/L^2$ です。'],
          sol: [[`For this support $\\kappa_1 = ${n(KAP[bc], 5)}$, equivalent to $K = ${n(KF[bc], 4)}$.`, `この支持では $\\kappa_1 = ${n(KAP[bc], 5)}$ で、$K = ${n(KF[bc], 4)}$ に相当します。`], [`$P = ${n(KAP[bc] ** 2, 5)} \\times 55.5/${n(L * L)} = ${n(Pc, 4)}$ kN.`, `$P = ${n(KAP[bc] ** 2, 5)} \\times 55.5/${n(L * L)} = ${n(Pc, 4)}$ kN です。`]],
          set: { bc, brace: 0, mode: 1, len: L },
        };
      }
      if (form === 1) {
        const L = r.step(1.5, 5, 0.5), K = 1;
        const lam = K * L / R_TUBE, sig = Math.PI ** 2 * E_STEEL / (lam * lam) / 1e6;
        return {
          q: [`A pinned–pinned steel tube ($E = 200$ GPa, radius of gyration $r = 19.85$ mm) is ${n(L)} m long. Find its slenderness ratio $KL/r$ and the stress at which it buckles, $\\sigma_{\\rm cr} = \\pi^2E/(KL/r)^2$.`, `両端ピンの鋼管（$E = 200$ GPa、断面二次半径 $r = 19.85$ mm）の長さは ${n(L)} m です。細長比 $KL/r$ と、座屈する応力 $\\sigma_{\\rm cr} = \\pi^2E/(KL/r)^2$ を求めてください。`],
          a: { type: 'tuple', v: [lam, sig], labels: [['$KL/r$', '$KL/r$'], ['$\\sigma_{\\rm cr}$ (MPa)', '$\\sigma_{\\rm cr}$（MPa）']], tol: 0.02 },
          hint: ['For pinned ends $K = 1$.', '両端ピンでは $K = 1$ です。'],
          sol: [[`$KL/r = ${n(L)}/0.01985 = ${n(lam, 4)}$.`, `$KL/r = ${n(L)}/0.01985 = ${n(lam, 4)}$ です。`], [`$\\sigma_{\\rm cr} = \\pi^2 \\times 200\\,000/${n(lam * lam, 5)} = ${n(sig, 4)}$ MPa.`, `$\\sigma_{\\rm cr} = \\pi^2 \\times 200\\,000/${n(lam * lam, 5)} = ${n(sig, 4)}$ MPa です。`], [sig < 250 ? 'This is below the 250 MPa yield stress, so the tube buckles elastically and Euler\'s formula applies.' : 'This exceeds the 250 MPa yield stress, so the tube would yield first and Euler\'s formula does not apply.', sig < 250 ? 'これは降伏応力 250 MPa より低いので、管は弾性座屈し、オイラーの式が当てはまります。' : 'これは降伏応力 250 MPa を超えるので、管は先に降伏し、オイラーの式は当てはまりません。']],
          set: { bc: 0, brace: 0, mode: 1, len: L },
        };
      }
      const f = r.int(0, 2);
      if (f === 0) {
        return {
          q: ['A pinned–pinned column is given a rigid lateral brace at mid-height. By what factor does its critical load rise?', '両端ピンの柱の中央に、剛な横の支えを付けました。限界荷重は何倍になりますか。'],
          a: { type: 'int', v: 4 },
          hint: ['The brace forces a node at mid-height, so the column buckles in the shape of its second mode: two half-waves.', '支えが中央に節を作るので、柱は第二モード、すなわち二つの半波の形で座屈します。'],
          sol: [['Each half is a pinned–pinned column of length $L/2$, and $P \\propto 1/L^2$.', '各半分は長さ $L/2$ の両端ピンの柱で、$P \\propto 1/L^2$ です。'], ['So the load is $\\pi^2EI/(L/2)^2 = 4\\pi^2EI/L^2$: four times, the same as the second mode of the unbraced column.', 'したがって荷重は $\\pi^2EI/(L/2)^2 = 4\\pi^2EI/L^2$ で、四倍です。支えのない柱の第二モードと同じ値です。']],
          set: { bc: 0, brace: 1, bh: 0.5, mode: 1 },
        };
      }
      if (f === 1) {
        const nn = r.pick([2, 3]);
        const L = r.step(2, 5, 0.5), Pc = nn * nn * Math.PI ** 2 * EI_TUBE / (L * L);
        return {
          q: [`The steel tube in the figure ($EI = 55.5$ kN·m²) is ${n(L)} m long and pinned at both ends. At what load would it buckle in mode ${nn}, with ${nn} half-waves, if it were held straight at the nodes?`, `図の鋼管（$EI = 55.5$ kN·m²）は長さ ${n(L)} m で、両端ピンです。節の位置で横に支えて真っすぐに保つとすると、半波が ${nn} 個のモード ${nn} で座屈する荷重はいくらですか。`],
          a: { type: 'num', v: Pc, rel: 0.01, unit: ['kN', 'kN'] },
          hint: ['For pinned ends $\\kappa_n = n\\pi$, so $P_n = n^2P_1$.', '両端ピンでは $\\kappa_n = n\\pi$ なので $P_n = n^2P_1$ です。'],
          sol: [[`$P_1 = \\pi^2 \\times 55.5/${n(L * L)} = ${n(Pc / (nn * nn), 4)}$ kN.`, `$P_1 = \\pi^2 \\times 55.5/${n(L * L)} = ${n(Pc / (nn * nn), 4)}$ kN です。`], [`$P_${nn} = ${nn * nn}\\,P_1 = ${n(Pc, 4)}$ kN.`, `$P_${nn} = ${nn * nn}\\,P_1 = ${n(Pc, 4)}$ kN です。`], ['Without lateral restraint the column never reaches this load: it buckles at $P_1$ first.', '横の拘束がなければ、柱はこの荷重に達することはなく、先に $P_1$ で座屈します。']],
          set: { bc: 0, brace: 0, mode: nn, len: L },
        };
      }
      return {
        q: ['A pinned–pinned column is braced at mid-height. What effective length factor $K$ does its first mode have, measured against the full length $L$?', '両端ピンの柱の中央に支えがあります。全長 $L$ に対する第一モードの有効長さ係数 $K$ はいくつですか。'],
        a: { type: 'num', v: 0.5, tol: 1e-6 },
        hint: ['$P = 4\\pi^2EI/L^2 = \\pi^2EI/(KL)^2$.', '$P = 4\\pi^2EI/L^2 = \\pi^2EI/(KL)^2$ です。'],
        sol: [['With the brace $P_1 = 4\\pi^2EI/L^2$, so $(KL)^2 = L^2/4$.', '支えがあると $P_1 = 4\\pi^2EI/L^2$ なので $(KL)^2 = L^2/4$ です。'], ['$K = 0.5$: the same as a column clamped at both ends.', '$K = 0.5$ で、両端固定の柱と同じです。']],
        set: { bc: 0, brace: 1, bh: 0.5, mode: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const bc = r.pick([0, 1, 2]);
        const lamC = Math.PI * Math.sqrt(E_STEEL / SY), Lc = lamC * R_TUBE / KF[bc];
        return {
          q: [`The steel tube in the figure ($E = 200$ GPa, yield stress $250$ MPa, $r = 19.85$ mm) is ${BCN[bc][0]}. Below what length does it yield before it buckles? That is where $\\sigma_{\\rm cr} = \\pi^2E/(KL/r)^2$ equals the yield stress.`, `図の鋼管（$E = 200$ GPa、降伏応力 $250$ MPa、$r = 19.85$ mm）は${BCN[bc][1]}です。何 m より短いと、座屈する前に降伏しますか。$\\sigma_{\\rm cr} = \\pi^2E/(KL/r)^2$ が降伏応力に等しくなる長さです。`],
          a: { type: 'num', v: Lc, rel: 0.01, unit: ['m', 'm'] },
          hint: ['Solve $\\pi^2E/\\lambda^2 = \\sigma_y$ for the slenderness $\\lambda = KL/r$, then convert to a length.', '$\\pi^2E/\\lambda^2 = \\sigma_y$ を細長比 $\\lambda = KL/r$ について解き、長さに直します。'],
          sol: [[`$\\lambda_c = \\pi\\sqrt{E/\\sigma_y} = \\pi\\sqrt{200\\,000/250} = ${n(lamC, 4)}$.`, `$\\lambda_c = \\pi\\sqrt{E/\\sigma_y} = \\pi\\sqrt{200\\,000/250} = ${n(lamC, 4)}$ です。`], [`$L_c = \\lambda_c\\,r/K = ${n(lamC, 4)} \\times 0.01985/${n(KF[bc], 4)} = ${n(Lc, 4)}$ m.`, `$L_c = \\lambda_c\\,r/K = ${n(lamC, 4)} \\times 0.01985/${n(KF[bc], 4)} = ${n(Lc, 4)}$ m です。`], ['Shorter than this the failure is crushing, longer it is elastic buckling; near the boundary real columns do something in between, which design codes handle with empirical curves.', 'これより短いと破壊は圧壊、長いと弾性座屈です。境界の近くでは実際の柱はその中間のふるまいをし、設計基準は経験的な曲線でそれを扱います。']],
          set: { bc, brace: 0, mode: 1 },
        };
      }
      if (form === 1) {
        const bc = r.pick([0, 1, 2]);
        return {
          q: [`The steel tube in the figure ($EI = 55.5$ kN·m²) is ${BCN[bc][0]}. Write its first buckling load $P(L)$ in kN as a function of the length $L$ in metres.`, `図の鋼管（$EI = 55.5$ kN·m²）は${BCN[bc][1]}です。最初の座屈荷重 $P(L)$（kN）を、長さ $L$（m）の関数として書いてください。`],
          a: { type: 'expr', v: `pi^2*55.5/(${KF[bc]}*L)^2`, vars: ['L'], dom: { L: [1, 6] }, lhs: ['$P(L) =$', '$P(L) =$'] },
          hint: ['$P = \\pi^2EI/(KL)^2$ with the $K$ of this support.', 'この支持の $K$ を使って $P = \\pi^2EI/(KL)^2$ です。'],
          sol: [[`For this support $K = ${n(KF[bc], 3)}$.`, `この支持では $K = ${n(KF[bc], 3)}$ です。`], [`$P(L) = \\pi^2 \\times 55.5/(${n(KF[bc], 3)}\\,L)^2$.`, `$P(L) = \\pi^2 \\times 55.5/(${n(KF[bc], 3)}\\,L)^2$ です。`], ['The $1/L^2$ law: a column is much weaker when long, and the end conditions only move the whole curve up or down by $1/K^2$.', '$1/L^2$ の法則です。柱は長いとずっと弱くなり、端の条件は曲線全体を $1/K^2$ だけ上下させるだけです。']],
          set: { bc, brace: 0, mode: 1 },
        };
      }
      const f = r.int(0, 1);
      if (f === 0) {
        const k = KAP[3] / PI;
        return {
          q: ['The first buckling load of a column fixed at the base and pinned at the top is the smallest root of $\\tan\\kappa = \\kappa$ (about $4.4934$). Compared with a pinned–pinned column of the same length, by what factor is the load larger?', '下端固定で上端ピンの柱の最初の座屈荷重は $\\tan\\kappa = \\kappa$ の最小の正の根（約 $4.4934$）で決まります。同じ長さの両端ピンの柱に比べて、荷重は何倍ですか。'],
          a: { type: 'num', v: k * k, rel: 0.003 },
          hint: ['The load goes as $\\kappa^2$, and the pinned–pinned value is $\\kappa = \\pi$.', '荷重は $\\kappa^2$ に比例し、両端ピンでは $\\kappa = \\pi$ です。'],
          sol: [[`$(\\kappa/\\pi)^2 = (${n(KAP[3], 5)}/${n(PI, 5)})^2 = ${n(k * k, 4)}$.`, `$(\\kappa/\\pi)^2 = (${n(KAP[3], 5)}/${n(PI, 5)})^2 = ${n(k * k, 4)}$ です。`], ['A clamped end is worth a bit more than doubling the load, but less than the factor 4 of clamping both ends.', '一端を固定すると荷重は二倍をわずかに超え、両端を固定したときの 4 倍には届きません。']],
          set: { bc: 3, brace: 0, mode: 1 },
        };
      }
      return {
        q: ['A pinned–pinned column can be given a mid-height brace, or its two ends can be clamped instead. Compared with doing nothing, which gives the larger first buckling load?', '両端ピンの柱に、中央の支えを付けることも、両端を固定に替えることもできます。どちらが、何もしないときに比べて最初の座屈荷重を大きくしますか。'],
        a: { type: 'choice', fixed: true, v: 2, opts: [['The mid-height brace', '中央の支え'], ['Clamping both ends', '両端の固定'], ['They give the same load, four times as much', '同じ荷重になり、どちらも 4 倍'], ['Neither changes the load', 'どちらも荷重を変えない']] },
        hint: ['Find the effective length factor $K$ of each and compare.', 'それぞれの有効長さ係数 $K$ を求めて比べます。'],
        sol: [['With the brace the column bows in two half-waves of length $L/2$: $K = 0.5$.', '支えがあると柱は長さ $L/2$ の二つの半波に反り、$K = 0.5$ です。'], ['Clamped at both ends, the middle half bows as a pinned column of length $L/2$ between the two inflection points: also $K = 0.5$.', '両端固定では、二つの変曲点にはさまれた中央の半分が長さ $L/2$ の両端ピンの柱として反り、これも $K = 0.5$ です。'], ['Both give $4\\pi^2EI/L^2$, four times the unbraced load.', 'どちらも $4\\pi^2EI/L^2$ となり、支えなしの 4 倍です。']],
        set: { bc: 0, brace: 1, bh: 0.5, mode: 1 },
      };
    },
  ];
})();
