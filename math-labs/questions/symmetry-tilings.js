'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, PHI = (1 + Math.sqrt(5)) / 2;
  // group number, symbol, point-group order, highest rotation, has reflections, has glides that are not mirrors, mirror count through a highest-order center
  const G = [
    [1, 'p1', 1, 1, false], [2, 'p2', 2, 2, false], [3, 'pm', 2, 1, true], [4, 'pg', 2, 1, true], [5, 'cm', 2, 1, true],
    [6, 'pmm', 4, 2, true], [7, 'pmg', 4, 2, true], [8, 'pgg', 4, 2, true], [9, 'cmm', 4, 2, true], [10, 'p4', 4, 4, false],
    [11, 'p4m', 8, 4, true], [12, 'p4g', 8, 4, true], [13, 'p3', 3, 3, false], [14, 'p3m1', 6, 3, true], [15, 'p31m', 6, 3, true],
    [16, 'p6', 6, 6, false], [17, 'p6m', 12, 6, true],
  ];
  // groups whose operations include an actual mirror (not only glides)
  const MIRROR = new Set(['pm', 'cm', 'pmm', 'pmg', 'cmm', 'p4m', 'p4g', 'p3m1', 'p31m', 'p6m']);

  /* ---------------- wallpaper ---------------- */
  Q['wallpaper'] = [
    (r) => {
      const form = r.int(0, 1), g = r.pick(G);
      if (form === 0) {
        return {
          q: [`What is the highest order of rotation in the wallpaper group ${g[1]} (number ${g[0]})?`, `壁紙群 ${g[1]}（番号 ${g[0]}）の回転の最大の次数はいくつですか。`],
          a: { type: 'int', v: g[3] },
          hint: ['The digit after p or c in the full symbol is the highest rotation order; 1 if none.', '記号の p や c の後の数字が最大の回転の次数です。なければ 1 です。'],
          sol: [[`In ${g[1]} the symbol ${g[3] > 1 ? `carries the digit ${g[3]}` : 'carries no rotation digit'}.`, `${g[1]} の記号には${g[3] > 1 ? `数字 ${g[3]} が入っています` : '回転の数字がありません'}。`], [`So the largest rotation is ${g[3] > 1 ? `by $360^\\circ/${g[3]} = ${n(360 / g[3], 0)}^\\circ$` : 'the identity'}; set the figure to group ${g[0]} and look at the largest rotation marks.`, `したがって最大の回転は${g[3] > 1 ? ` $360^\\circ/${g[3]} = ${n(360 / g[3], 0)}^\\circ$ です` : '恒等変換です'}。図を群 ${g[0]} にして、最大の回転の印を見てください。`]],
          set: { grp: g[0], show: 1 },
        };
      }
      return {
        q: [`Does the wallpaper group ${g[1]} (number ${g[0]}) contain reflections or glide reflections, so that mirror-image copies of the motif appear?`, `壁紙群 ${g[1]}（番号 ${g[0]}）は反射や映進を含み、図案の鏡像の複製が現れますか。`],
        a: { type: 'choice', fixed: true, v: g[4] ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
        hint: ['An m or a g in the symbol means a reflection or a glide.', '記号に m や g があれば、反射か映進を表します。'],
        sol: [[`The symbol ${g[1]} ${g[4] ? 'contains an m or a g' : 'has neither m nor g'}.`, `記号 ${g[1]} には${g[4] ? ' m か g が入っています' : ' m も g もありません'}。`], [g[4] ? 'So the pattern contains orange, mirror-image copies.' : 'So every copy has the same handedness: the pattern is chiral.', g[4] ? 'したがって模様には橙色の鏡像の複製が含まれます。' : 'したがってどの複製も同じ向きで、模様にはキラリティーがあります。']],
        set: { grp: g[0], show: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 1), g = r.pick(G);
      if (form === 0) {
        return {
          q: [`How many copies of the motif does the group ${g[1]} (number ${g[0]}) place in each primitive cell of its lattice?`, `群 ${g[1]}（番号 ${g[0]}）は、格子の基本単位胞ごとに図案の複製をいくつ置きますか。`],
          a: { type: 'int', v: g[2] },
          hint: ['It is the order of the point group: rotations (including the identity) plus reflections through a point.', '点群の位数です。（恒等変換を含む）回転の数と、一点を通る反射の数の和です。'],
          sol: [[`The point group of ${g[1]} has ${g[3]} rotation${g[3] > 1 ? 's' : ''}${g[4] ? ` and ${g[2] - g[3]} reflection-type element${g[2] - g[3] > 1 ? 's' : ''}` : ''}.`, `${g[1]} の点群には回転が ${g[3]} 個${g[4] ? `、反射型の要素が ${g[2] - g[3]} 個` : ''}あります。`], [`So ${g[2]} copies per primitive cell${['cm', 'cmm'].includes(g[1]) ? ', twice that in the drawn centered cell' : ''}.`, `したがって基本単位胞ごとに ${g[2]} 個です${['cm', 'cmm'].includes(g[1]) ? '。描いてある面心の単位胞ではその 2 倍です' : ''}。`]],
          set: { grp: g[0], show: 1 },
        };
      }
      const k = r.pick([2, 3, 4, 6]), gg = G.filter((x) => x[3] === k);
      return {
        q: [`How many of the seventeen wallpaper groups have ${k}-fold rotations as their highest rotation order?`, `十七の壁紙群のうち、最大の回転の次数が ${k} であるものはいくつありますか。`],
        a: { type: 'int', v: gg.length },
        hint: ['List the groups by lattice family: rectangular and oblique ones top out at 2, square at 4, hexagonal at 3 or 6.', '格子の族ごとに群を並べます。長方と斜方では最大 2、正方では 4、六方では 3 か 6 です。'],
        sol: [[`They are ${gg.map((x) => x[1]).join(', ')}.`, `それは ${gg.map((x) => x[1]).join('、')} です。`], [`${gg.length} groups. By highest rotation the seventeen split as 4 (none), 5 (twofold), 3 (threefold), 3 (fourfold) and 2 (sixfold).`, `${gg.length} 個です。最大の回転で分けると、十七の群は 4 個（回転なし）、5 個（2 回）、3 個（3 回）、3 個（4 回）、2 個（6 回）になります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const pr = r.pick([['p4m', 'p4g', 11, 12, 'In p4m the fourfold centers lie on mirrors; in p4g they do not.', 'p4m では 4 回中心が鏡の上にあり、p4g ではありません。'], ['p3m1', 'p31m', 14, 15, 'In p3m1 every threefold center is on a mirror; in p31m some are not.', 'p3m1 ではすべての 3 回中心が鏡の上にあり、p31m では一部がそうではありません。'], ['pmm', 'pmg', 6, 7, 'In pmm every twofold center is where two mirrors cross; in pmg the twofold centers lie between the mirrors, on glide lines.', 'pmm ではすべての 2 回中心で二本の鏡が交わります。pmg では 2 回中心は鏡の間、映進線の上にあります。']]);
        const pick = r.int(0, 1);
        const askEn = pick ? `In which of ${pr[0]} and ${pr[1]} do some rotation centers of the highest order lie off every mirror line?` : `Which of ${pr[0]} and ${pr[1]} has more mirror lines through its rotation centers of highest order?`;
        const askJa = pick ? `${pr[0]} と ${pr[1]} のうち、最大の次数の回転中心の一部がどの鏡映線の上にもないのはどちらですか。` : `${pr[0]} と ${pr[1]} のうち、最大の次数の回転中心を通る鏡映線が多いのはどちらですか。`;
        return {
          q: [askEn, askJa],
          a: { type: 'choice', fixed: true, v: pick ? 1 : 0, opts: [[pr[0], pr[0]], [pr[1], pr[1]]] },
          hint: ['Show the symmetry elements for both groups and compare where the centers sit.', '二つの群で対称要素を表示し、中心の位置を比べます。'],
          sol: [[pr[4], pr[5]], [pick ? `So the answer is ${pr[1]}.` : `So the answer is ${pr[0]}.`, pick ? `したがって答えは ${pr[1]} です。` : `したがって答えは ${pr[0]} です。`]],
          set: { grp: pick ? pr[3] : pr[2], show: 1 },
        };
      }
      if (form === 1) {
        const k = r.pick([3, 4, 6]);
        return {
          q: [`At a ${k}-fold rotation center that lies on a mirror line, how many mirror lines pass through the center?`, `鏡映線の上にある ${k} 回の回転中心には、何本の鏡映線が通りますか。`],
          a: { type: 'int', v: k },
          hint: ['Rotating a mirror by the rotation about the center gives another mirror.', '中心のまわりの回転で鏡を回すと、別の鏡が得られます。'],
          sol: [[`Conjugating the mirror by rotations through $360^\\circ/${k}$ gives mirrors at angles $180^\\circ/${k}$ apart.`, `$360^\\circ/${k}$ の回転で鏡を共役にとると、$180^\\circ/${k}$ ずつ離れた鏡が得られます。`], [`Over $180^\\circ$ that makes ${k} distinct lines, forming the dihedral group of order ${2 * k}.`, `$180^\\circ$ の範囲で ${k} 本の異なる線になり、位数 ${2 * k} の二面体群をなします。`]],
          set: { grp: k === 3 ? 14 : k === 4 ? 11 : 17, show: 1 },
        };
      }
      const g = r.pick(G.filter((x) => x[4]));
      const mir = MIRROR.has(g[1]);
      return {
        q: [`The group ${g[1]} contains orientation-reversing operations. Does it contain an actual mirror, or only glide reflections?`, `群 ${g[1]} は向きを反転させる操作を含みます。本物の鏡を含みますか、それとも映進だけですか。`],
        a: { type: 'choice', fixed: true, v: mir ? 0 : 1, opts: [['it has a mirror', '鏡を含む'], ['glides only', '映進だけ']] },
        hint: ['A glide reflection fixes no point. Look for a line of fixed points in the figure.', '映進はどの点も固定しません。図で固定点の線を探します。'],
        sol: [[mir ? `${g[1]} has mirror lines (solid in the figure); it may have glides as well.` : `${g[1]} has only glide lines (dashed): every orientation-reversing operation slides along its axis.`, mir ? `${g[1]} には鏡映線（図の実線）があり、映進もあるかもしれません。` : `${g[1]} には映進線（破線）しかありません。向きを反転させるどの操作も、軸に沿って滑ります。`], [mir ? 'So it has a mirror.' : 'So glides only: no point of the plane is fixed by a reflection.', mir ? 'したがって鏡を含みます。' : 'したがって映進だけで、平面のどの点も反射で固定されません。']],
        set: { grp: g[0], show: 1 },
      };
    },
  ];

  /* ---------------- crystal-restriction ---------------- */
  const ok = (k) => [1, 2, 3, 4, 6].includes(k);
  Q['crystal-restriction'] = [
    (r) => {
      const k = r.int(2, 12), t = 2 * Math.cos((2 * PI) / k);
      return {
        q: [`What is the trace $2\\cos(2\\pi/n)$ of a plane rotation by $2\\pi/n$ for $n = ${k}$? Give three decimals.`, `$n = ${k}$ のとき、$2\\pi/n$ の平面の回転のトレース $2\\cos(2\\pi/n)$ はいくらですか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: t, tol: 0.0015 },
        hint: ['$2\\cos$ of the angle $360^\\circ/n$.', '角 $360^\\circ/n$ の $2\\cos$ です。'],
        sol: [[`The angle is $${n(360 / k, 2)}^\\circ$ and $2\\cos(${n(360 / k, 2)}^\\circ) = ${n(t, 4)}$.`, `角は $${n(360 / k, 2)}^\\circ$ で、$2\\cos(${n(360 / k, 2)}^\\circ) = ${n(t, 4)}$ です。`], [ok(k) ? 'An integer: this order is allowed for a lattice.' : 'Not an integer: no lattice has this rotation.', ok(k) ? '整数です。格子にこの次数は許されます。' : '整数ではありません。この回転をもつ格子はありません。']],
        ...(k <= 8 ? { set: { n: k } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.int(2, 12);
        return {
          q: [`Can a three-dimensional crystal lattice have a rotation axis of order ${k}?`, `3 次元の結晶格子は ${k} 回の回転軸をもてますか。`],
          a: { type: 'choice', fixed: true, v: ok(k) ? 0 : 1, opts: [['Yes', 'はい'], ['No', 'いいえ']] },
          hint: ['In space the trace is $1 + 2\\cos(2\\pi/n)$ and must be an integer.', '空間ではトレースは $1 + 2\\cos(2\\pi/n)$ で、整数でなければなりません。'],
          sol: [[`$1 + 2\\cos(${n(360 / k, 2)}^\\circ) = ${n(1 + 2 * Math.cos((2 * PI) / k), 4)}$.`, `$1 + 2\\cos(${n(360 / k, 2)}^\\circ) = ${n(1 + 2 * Math.cos((2 * PI) / k), 4)}$ です。`], [ok(k) ? 'An integer, so the order is allowed.' : 'Not an integer, so no lattice can have it.', ok(k) ? '整数なので、この次数は許されます。' : '整数ではないので、どの格子もこの次数をもてません。']],
          ...(k <= 8 ? { set: { n: k } } : {}),
        };
      }
      const ax = r.pick([['[001]', 4, 0], ['[111]', 3, 1], ['[110]', 2, 2]]);
      return {
        q: [`What is the highest order of rotation symmetry of a simple cubic lattice about the axis ${ax[0]}?`, `単純立方格子の、軸 ${ax[0]} のまわりの回転対称の最大の次数はいくつですか。`],
        a: { type: 'int', v: ax[1] },
        hint: ['Look at the cube along that axis: an edge, a body diagonal or a face diagonal.', 'その軸に沿って立方体を見ます。辺、体対角線、面対角線のどれかです。'],
        sol: [[ax[1] === 4 ? 'Along an edge the cube looks like a square.' : ax[1] === 3 ? 'Along a body diagonal three edges meet symmetrically, and a $120^\\circ$ turn cycles them.' : 'Along a face diagonal only a half-turn swaps the two edges of that face.', ax[1] === 4 ? '辺に沿って見ると、立方体は正方形に見えます。' : ax[1] === 3 ? '体対角線に沿って見ると三本の辺が対称に集まり、$120^\\circ$ の回転がそれらを巡回させます。' : '面対角線に沿って見ると、その面の二本の辺を入れ替えるのは半回転だけです。'], [`So the order is ${ax[1]}.`, `したがって次数は ${ax[1]} です。`]],
        set: { lat: 0, axis: ax[2], n: ax[1] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([5, 7, 8, 10, 12]), t = 2 * Math.cos((2 * PI) / k);
        return {
          q: [`A rotation by $2\\pi/${k}$ would have trace $${n(t, 4)}$ in the plane. Between which two integers does it lie, showing that no plane lattice has this symmetry? Give the smaller one.`, `$2\\pi/${k}$ の回転の平面でのトレースは $${n(t, 4)}$ です。それはどの二つの整数の間にあり、平面格子がこの対称性をもたないことを示しますか。小さいほうの整数を答えてください。`],
          a: { type: 'int', v: Math.floor(t) },
          hint: ['Locate $2\\cos(2\\pi/n)$ between consecutive integers.', '$2\\cos(2\\pi/n)$ を連続する整数の間に位置づけます。'],
          sol: [[`$${n(t, 4)}$ lies strictly between ${Math.floor(t)} and ${Math.floor(t) + 1}.`, `$${n(t, 4)}$ は ${Math.floor(t)} と ${Math.floor(t) + 1} の間に厳密にあります。`], ['A lattice symmetry has an integer matrix in the lattice basis and therefore an integer trace, so this rotation cannot preserve any lattice.', '格子の対称操作は格子の基底で整数行列になるので、トレースも整数です。したがってこの回転はどんな格子も保てません。']],
        };
      }
      if (form === 1) {
        return {
          q: ['Write the trace of a rotation of three-dimensional space by angle $\\theta$ (write $t$ for $\\theta$).', '3 次元空間の角 $\\theta$ の回転のトレースを書いてください（$\\theta$ は $t$ と書きます）。'],
          a: { type: 'expr', v: '1+2*cos(t)', vars: ['t'], dom: { t: [0.2, 3] }, lhs: ['$\\operatorname{tr}R =$', '$\\operatorname{tr}R =$'] },
          hint: ['In a basis with the axis as one vector, $R$ is a plane rotation plus a 1 on the axis.', '軸を一つの基底ベクトルにとると、$R$ は平面の回転と軸上の 1 からなります。'],
          sol: [['In a basis adapted to the axis, $R = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta & 0\\\\ \\sin\\theta & \\cos\\theta & 0\\\\ 0 & 0 & 1\\end{pmatrix}$.', '軸に合わせた基底では $R = \\begin{pmatrix}\\cos\\theta & -\\sin\\theta & 0\\\\ \\sin\\theta & \\cos\\theta & 0\\\\ 0 & 0 & 1\\end{pmatrix}$ です。'], ['Its trace is $1 + 2\\cos\\theta$, the same in every basis; requiring it to be an integer gives the crystallographic restriction.', 'そのトレースは $1 + 2\\cos\\theta$ で、どの基底でも同じです。これが整数であることを要求すると結晶学的制約が得られます。']],
        };
      }
      const k = r.pick([5, 8, 10, 12]), phi = (m) => { let c = 0; for (let i = 1; i <= m; i++) { let a = i, b = m; while (b) [a, b] = [b, a % b]; if (a === 1) c++; } return c; }, d = phi(k);
      return {
        q: [`A lattice in $\\mathbb R^d$ can have a symmetry of order ${k} only if $d \\ge \\varphi(${k})$, Euler's totient (for ${k} not of the form 2 times an odd number). What is the smallest such $d$?`, `$\\mathbb R^d$ の格子が位数 ${k} の対称性をもてるのは $d \\ge \\varphi(${k})$（オイラーのトーシェント関数、${k} が奇数の 2 倍でないとき）のときだけです。そのような最小の $d$ はいくつですか。`],
        a: { type: 'int', v: d },
        hint: ['The rotation must contain all primitive $n$th roots of unity among its eigenvalues, and they are $\\varphi(n)$ in number.', '回転は固有値として 1 の原始 $n$ 乗根をすべて含まなければならず、その個数は $\\varphi(n)$ です。'],
        sol: [[`An integer matrix of order ${k} has a characteristic polynomial with integer coefficients, so it contains the whole cyclotomic polynomial $\\Phi_{${k}}$, of degree $\\varphi(${k}) = ${d}$.`, `位数 ${k} の整数行列の特性多項式は整数係数なので、次数 $\\varphi(${k}) = ${d}$ の円分多項式 $\\Phi_{${k}}$ を丸ごと含みます。`], [`So the smallest dimension is ${d}: ${k === 5 || k === 10 ? 'fivefold symmetry first becomes possible in four dimensions, where quasicrystals live as slices' : 'beyond the three dimensions of real crystals'}.`, `したがって最小の次元は ${d} です。${k === 5 || k === 10 ? '5 回対称は 4 次元で初めて可能になり、準結晶はその切り口として現れます' : '現実の結晶の 3 次元を越えます'}。`]],
      };
    },
  ];

  /* ---------------- penrose ---------------- */
  const counts = (s) => { let a = 10, b = 0; for (let i = 0; i < s; i++) [a, b] = [a + b, a + 2 * b]; return [a, b]; };
  Q['penrose'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 2) {
        const s = r.int(1, 6), [a, b] = counts(s);
        return {
          q: [`Starting from the wheel of 10 triangles, each deflation multiplies the number of triangles by roughly $\\varphi^2$. How many triangles are there after ${s} step${s > 1 ? 's' : ''}?`, `10 個の三角形の車輪から始めると、デフレーションのたびに三角形の数はおよそ $\\varphi^2$ 倍になります。${s} 回のあと、三角形はいくつありますか。`],
          a: { type: 'int', v: a + b },
          hint: ['A thin triangle becomes 2 triangles, a thick one 3.', '細い三角形は 2 個に、太い三角形は 3 個になります。'],
          sol: [[`Iterating $(a, b) \\mapsto (a + b, a + 2b)$ from $(10, 0)$ gives ${a} thin and ${b} thick.`, `$(10, 0)$ から $(a, b) \\mapsto (a + b, a + 2b)$ をくり返すと、細いもの ${a} 個、太いもの ${b} 個です。`], [`${a + b} triangles, about $10\\varphi^{${2 * s}}/\\sqrt5\\cdot\\varphi = ${n((10 * Math.pow(PHI, 2 * s + 1)) / Math.sqrt(5), 0)}$ for large steps.`, `${a + b} 個で、回数が多いとおよそ $10\\varphi^{${2 * s}}/\\sqrt5\\cdot\\varphi = ${n((10 * Math.pow(PHI, 2 * s + 1)) / Math.sqrt(5), 0)}$ です。`]],
          set: { steps: s },
        };
      }
      if (form === 3) {
        const k = r.int(2, 8); let F0 = 0, F1 = 1; for (let i = 1; i < k; i++) [F0, F1] = [F1, F0 + F1];
        return {
          q: [`Using $\\varphi^2 = \\varphi + 1$, write $\\varphi^{${k}} = a\\varphi + b$. What is $a$?`, `$\\varphi^2 = \\varphi + 1$ を使って $\\varphi^{${k}} = a\\varphi + b$ と書きます。$a$ はいくつですか。`],
          a: { type: 'int', v: F1 },
          hint: ['Multiply by $\\varphi$ repeatedly and reduce $\\varphi^2$ each time.', '$\\varphi$ を掛けるたびに $\\varphi^2$ を簡約します。'],
          sol: [[`The coefficients are Fibonacci numbers: $\\varphi^{n} = F_n\\varphi + F_{n-1}$.`, `係数はフィボナッチ数です：$\\varphi^{n} = F_n\\varphi + F_{n-1}$。`], [`So $\\varphi^{${k}} = ${F1}\\varphi + ${F0} = ${n(F1 * PHI + F0, 4)}$.`, `したがって $\\varphi^{${k}} = ${F1}\\varphi + ${F0} = ${n(F1 * PHI + F0, 4)}$ です。`]],
        };
      }
      if (form === 0) {
        const which = r.pick([[72, 108, 'thick', '太い'], [36, 144, 'thin', '細い']]);
        return {
          q: [`A ${which[2]} Penrose rhomb has an acute angle of $${which[0]}^\\circ$. What is its obtuse angle?`, `${which[3]}ペンローズの菱形の鋭角は $${which[0]}^\\circ$ です。鈍角はいくらですか。`],
          a: { type: 'num', v: which[1], tol: 0.5, unit: ['°', '°'] },
          hint: ['Adjacent angles of a rhomb add to $180^\\circ$.', '菱形の隣り合う角の和は $180^\\circ$ です。'],
          sol: [[`$180^\\circ - ${which[0]}^\\circ = ${which[1]}^\\circ$.`, `$180^\\circ - ${which[0]}^\\circ = ${which[1]}^\\circ$ です。`], ['All angles of both rhombs are multiples of $36^\\circ$, a tenth of a turn, which is where the fivefold symmetry comes from.', '二つの菱形の角はすべて $36^\\circ$（一回転の 10 分の 1）の倍数で、5 回対称はここから来ています。']],
        };
      }
      return {
        q: ['What is the golden ratio $\\varphi = (1 + \\sqrt5)/2$ to four decimals?', '黄金比 $\\varphi = (1 + \\sqrt5)/2$ を小数第 4 位まで答えてください。'],
        a: { type: 'num', v: PHI, tol: 0.00006, show: '\\tfrac{1+\\sqrt5}{2}' },
        hint: ['$\\sqrt5 = 2.23607$.', '$\\sqrt5 = 2.23607$ です。'],
        sol: [['$(1 + 2.23607)/2 = 1.61803$.', '$(1 + 2.23607)/2 = 1.61803$ です。'], ['It satisfies $\\varphi^2 = \\varphi + 1$, which is why it governs the substitution.', '$\\varphi^2 = \\varphi + 1$ を満たし、そのため置換を支配します。']],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.int(5, 40), b = r.int(5, 60), s = r.int(1, 3); let [x, y] = [a, b]; for (let i = 0; i < s; i++) [x, y] = [x + y, x + 2 * y];
        return {
          q: [`A patch has ${a} thin and ${b} thick Robinson triangles. Each deflation turns a thin one into one thin and one thick, and a thick one into one thin and two thick. How many thick triangles after ${s} deflation${s > 1 ? 's' : ''}?`, `ある部分に細いロビンソン三角形が ${a} 個、太いものが ${b} 個あります。デフレーションのたびに細いものは細いもの一つと太いもの一つに、太いものは細いもの一つと太いもの二つになります。${s} 回のデフレーションのあと、太い三角形はいくつですか。`],
          a: { type: 'int', v: y },
          hint: ['Apply $(N_{\\rm thin}, N_{\\rm thick}) \\mapsto (N_{\\rm thin} + N_{\\rm thick},\\ N_{\\rm thin} + 2N_{\\rm thick})$ repeatedly.', '$(N_{\\rm thin}, N_{\\rm thick}) \\mapsto (N_{\\rm thin} + N_{\\rm thick},\\ N_{\\rm thin} + 2N_{\\rm thick})$ をくり返し当てはめます。'],
          sol: [[`Step by step: (${a}, ${b})${(() => { let [p, q] = [a, b], t = ''; for (let i = 0; i < s; i++) { [p, q] = [p + q, p + 2 * q]; t += ` → (${p}, ${q})`; } return t; })()}.`, `一段ずつ：(${a}, ${b})${(() => { let [p, q] = [a, b], t = ''; for (let i = 0; i < s; i++) { [p, q] = [p + q, p + 2 * q]; t += ` → (${p}, ${q})`; } return t; })()} です。`], [`So ${y} thick triangles, and the ratio thick : thin is already ${n(y / x, 4)}, close to $\\varphi$.`, `したがって太い三角形は ${y} 個で、太い : 細い の比はすでに ${n(y / x, 4)} と $\\varphi$ に近くなっています。`]],
        };
      }
      const s = r.int(1, 6), [a, b] = counts(s);
      return {
        q: [`Starting from the wheel of 10 thin triangles, what is the ratio of thick to thin triangles after ${s} deflation${s > 1 ? 's' : ''}? Give four decimals.`, `10 個の細い三角形の車輪から始めて、${s} 回のデフレーションのあとの太い三角形と細い三角形の比はいくらですか。小数第 4 位まで答えてください。`],
        a: { type: 'num', v: b / a, tol: 0.00006 },
        hint: ['Iterate $(a, b) \\mapsto (a + b, a + 2b)$ from $(10, 0)$.', '$(10, 0)$ から $(a, b) \\mapsto (a + b, a + 2b)$ をくり返します。'],
        sol: [[`After ${s} step${s > 1 ? 's' : ''}: ${a} thin, ${b} thick.`, `${s} 回のあと：細いもの ${a} 個、太いもの ${b} 個です。`], [`Ratio $${b}/${a} = ${n(b / a, 4)}$, closing in on $\\varphi = 1.6180$ from alternate sides.`, `比は $${b}/${a} = ${n(b / a, 4)}$ で、交互に両側から $\\varphi = 1.6180$ に近づきます。`]],
        set: { steps: s },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['What is the largest eigenvalue of the substitution matrix $\\begin{pmatrix}1&1\\\\1&2\\end{pmatrix}$? Give four decimals.', '置換行列 $\\begin{pmatrix}1&1\\\\1&2\\end{pmatrix}$ の最大の固有値はいくらですか。小数第 4 位まで答えてください。'],
          a: { type: 'num', v: PHI * PHI, tol: 0.00006, show: '\\varphi^2 = \\tfrac{3+\\sqrt5}{2}' },
          hint: ['Trace 3, determinant 1.', 'トレースは 3、行列式は 1 です。'],
          sol: [['$\\lambda^2 - 3\\lambda + 1 = 0$ gives $\\lambda = (3 \\pm \\sqrt5)/2$.', '$\\lambda^2 - 3\\lambda + 1 = 0$ から $\\lambda = (3 \\pm \\sqrt5)/2$ です。'], ['The larger is $\\varphi^2 = 2.6180$: tiles multiply by $\\varphi^2$ per step while their area shrinks by $\\varphi^2$.', '大きいほうは $\\varphi^2 = 2.6180$ です。タイルは一回ごとに $\\varphi^2$ 倍に増え、面積は $\\varphi^2$ 分の 1 に縮みます。']],
        };
      }
      if (form === 1) {
        return {
          q: ['If the tiling were periodic with a period cell holding $a$ thin and $b$ thick tiles, the frequency ratio would be $b/a$. Why does that contradict the Penrose tiling?', 'タイリングが周期的で、周期の単位胞に細いタイルが $a$ 個、太いタイルが $b$ 個あるとすると、頻度の比は $b/a$ になります。それがペンローズ・タイリングと矛盾するのはなぜですか。'],
          a: { type: 'choice', v: 0, opts: [['$b/a$ is rational but the true ratio is the irrational $\\varphi$', '$b/a$ は有理数だが、真の比は無理数 $\\varphi$ である'], ['$b/a$ would have to be exactly 2', '$b/a$ はちょうど 2 でなければならない'], ['a period cell cannot contain both kinds of tile', '周期の単位胞は二種類のタイルを両方含めない']] },
          hint: ['Compare the ratio from deflation with any ratio of two integers.', 'デフレーションから得られる比と、二つの整数の比を比べます。'],
          sol: [['Deflation fixes the tile frequencies along the dominant eigenvector, giving thick : thin $= \\varphi$.', 'デフレーションはタイルの頻度を支配的な固有ベクトルの向きに定め、太い : 細い $= \\varphi$ を与えます。'], ['A periodic tiling would have a rational ratio $b/a$, and $\\varphi$ is irrational, so no period exists.', '周期的なタイリングなら比 $b/a$ は有理数ですが、$\\varphi$ は無理数なので、周期は存在しません。']],
        };
      }
      const s = r.int(1, 6), ratio = Math.pow(PHI, s);
      return {
        q: [`Each deflation shrinks the edge length by $\\varphi$. After ${s} step${s > 1 ? 's' : ''}, by what factor have the edges shrunk?`, `デフレーションのたびに辺の長さは $\\varphi$ 分の 1 になります。${s} 回のあと、辺は何分の 1 になりましたか。`],
        a: { type: 'num', v: ratio, rel: 0.002, show: `\\varphi^{${s}}` },
        hint: ['Multiply the factors.', '倍率を掛け合わせます。'],
        sol: [[`The factor is $\\varphi^{${s}}$.`, `倍率は $\\varphi^{${s}}$ です。`], [`$\\varphi^{${s}} = ${n(ratio, 4)}$, so the diffraction spots move out by the same factor in $k$-space.`, `$\\varphi^{${s}} = ${n(ratio, 4)}$ です。したがって回折点も $k$ 空間で同じ倍率だけ外へ移ります。`]],
        set: { steps: s },
      };
    },
  ];
})();
