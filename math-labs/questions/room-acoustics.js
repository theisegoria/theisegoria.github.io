'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, C = 343, EAR = 1.2;
  const s3 = (x) => sig(x, 3);
  const snap = (x, step, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / step) * step));
  const lfOf = (f, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Math.log10(f) * 100) / 100));
  const db = (x) => 20 * Math.log10(x);

  /* ---------------- 1. room modes ---------------- */
  const fMode = (L, W, H, a, b, c) => (C / 2) * Math.hypot(a / L, b / W, c / H);
  const kind = (m) => m.filter((k) => k > 0).length; // 1 axial, 2 tangential, 3 oblique
  const KIND = [null, ['axial', '軸モード'], ['tangential', '接線モード'], ['oblique', '斜めモード']];
  const rooms = [[5, 4, 2.5], [4, 3, 2.5], [6, 4.5, 2.7], [7, 5, 3], [3.6, 2.9, 2.4], [5.5, 3.5, 2.6], [8, 6, 3.2], [4.5, 3.75, 2.4]];
  const dimTxt = (R) => `$${n(R[0])} \\times ${n(R[1])} \\times ${n(R[2])}$ m`;
  const mTxt = (m) => `(${m.join(', ')})`;
  Q['room-modes'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.step(3, 8, 0.05), f = C / (2 * L);
        return {
          q: [`A room is $${n(L)}$ m long. What is the frequency of its lowest axial mode along the length, $(1, 0, 0)$?`, `長さ $${n(L)}$ m の部屋があります。長さ方向の最も低い軸モード $(1, 0, 0)$ の周波数はいくらですか。`],
          a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
          hint: ['Half a wavelength fits between the two end walls.', '両端の壁の間に半波長が入ります。'],
          sol: [[`$\\lambda/2 = L$, so $f = c/(2L) = 343/(2\\times${n(L)})$.`, `$\\lambda/2 = L$ なので $f = c/(2L) = 343/(2\\times${n(L)})$ です。`], [`$f = ${s3(f)}$ Hz: pressure maxima at the end walls, a node across the middle of the room.`, `$f = ${s3(f)}$ Hz です。圧力の最大は両端の壁にあり、部屋の中央に節が横切ります。`]],
          set: { L, nx: 1, ny: 0, nz: 0 },
        };
      }
      if (form === 1) {
        const R = r.pick(rooms), ax = r.int(0, 2), k = r.int(1, ax === 2 ? 2 : 4), m = [0, 0, 0]; m[ax] = k;
        const f = fMode(...R, ...m), dn = [['length', '長さ'], ['width', '幅'], ['height', '高さ']][ax];
        return {
          q: [`In a room of ${dimTxt(R)}, what is the frequency of mode ${mTxt(m)}?`, `${dimTxt(R)} の部屋で、モード ${mTxt(m)} の周波数はいくらですか。`],
          a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
          hint: ['Only one index is non-zero, so only that dimension matters: $f = n c/(2D)$.', '番号は一つだけが 0 でないので、その寸法だけが効きます。$f = n c/(2D)$ です。'],
          sol: [[`It is an axial mode along the ${dn[0]}, $${n(R[ax])}$ m, with ${k} half-wavelength${k > 1 ? 's' : ''} across it.`, `${dn[1]}方向（$${n(R[ax])}$ m）の軸モードで、そこに半波長が ${k} 個入ります。`], [`$f = ${k}\\times343/(2\\times${n(R[ax])}) = ${s3(f)}$ Hz.`, `$f = ${k}\\times343/(2\\times${n(R[ax])}) = ${s3(f)}$ Hz です。`]],
          set: { L: R[0], W: R[1], H: R[2], nx: m[0], ny: m[1], nz: m[2] },
        };
      }
      let m; do { m = [r.int(0, 4), r.int(0, 4), r.int(0, 2)]; } while (!kind(m));
      const kk = kind(m);
      return {
        q: [`What kind of room mode is ${mTxt(m)}?`, `モード ${mTxt(m)} はどの種類のモードですか。`],
        a: { type: 'choice', opts: [['axial: between one pair of walls', '軸モード：一組の向かい合う面の間'], ['tangential: around four surfaces', '接線モード：四つの面をめぐる'], ['oblique: involving all six surfaces', '斜めモード：六面すべてが関わる']], v: kk - 1, fixed: true },
        hint: ['Count how many indices are non-zero.', '0 でない番号がいくつあるか数えてください。'],
        sol: [[`${kk} of the three indices ${kk === 1 ? 'is' : 'are'} non-zero.`, `三つの番号のうち ${kk} 個が 0 ではありません。`], [`So it is ${KIND[kk][0]}. ${['', 'Axial modes bounce between two parallel surfaces and are the strongest.', 'Tangential modes lose energy at four surfaces and are about 3 dB weaker than axial ones.', 'Oblique modes touch all six surfaces and are the weakest, but the most numerous.'][kk]}`, `したがって${KIND[kk][1]}です。${['', '軸モードは二つの平行な面の間で反射し、最も強いモードです。', '接線モードは四つの面でエネルギーを失い、軸モードより約 3 dB 弱くなります。', '斜めモードは六面すべてに触れて最も弱いですが、数は最も多くなります。'][kk]}`]],
        set: { nx: m[0], ny: m[1], nz: m[2] },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const R = r.pick(rooms); let m; do { m = [r.int(0, 3), r.int(0, 3), r.int(0, 1)]; } while (kind(m) < 2);
        const f = fMode(...R, ...m);
        return {
          q: [`Find the frequency of mode ${mTxt(m)} in a room of ${dimTxt(R)}.`, `${dimTxt(R)} の部屋で、モード ${mTxt(m)} の周波数を求めてください。`],
          a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
          hint: ['$f = \\dfrac c2\\sqrt{(n_x/L)^2 + (n_y/W)^2 + (n_z/H)^2}$: the wave vector adds like a vector.', '$f = \\dfrac c2\\sqrt{(n_x/L)^2 + (n_y/W)^2 + (n_z/H)^2}$ です。波数ベクトルはベクトルとして足し合わされます。'],
          sol: [[`$(${m[0]}/${n(R[0])})^2 + (${m[1]}/${n(R[1])})^2 + (${m[2]}/${n(R[2])})^2 = ${n((m[0] / R[0]) ** 2 + (m[1] / R[1]) ** 2 + (m[2] / R[2]) ** 2, 5)}\\ \\mathrm{m^{-2}}$.`, `$(${m[0]}/${n(R[0])})^2 + (${m[1]}/${n(R[1])})^2 + (${m[2]}/${n(R[2])})^2 = ${n((m[0] / R[0]) ** 2 + (m[1] / R[1]) ** 2 + (m[2] / R[2]) ** 2, 5)}\\ \\mathrm{m^{-2}}$ です。`], [`$f = 171.5\\times\\sqrt{${n((m[0] / R[0]) ** 2 + (m[1] / R[1]) ** 2 + (m[2] / R[2]) ** 2, 5)}} = ${s3(f)}$ Hz, a ${KIND[kind(m)][0]} mode.`, `$f = 171.5\\times\\sqrt{${n((m[0] / R[0]) ** 2 + (m[1] / R[1]) ** 2 + (m[2] / R[2]) ** 2, 5)}} = ${s3(f)}$ Hz で、${KIND[kind(m)][1]}です。`]],
          set: { L: R[0], W: R[1], H: R[2], nx: m[0], ny: m[1], nz: m[2] },
        };
      }
      if (form === 1) {
        const R = r.pick(rooms); let m, lx, ly, a;
        do { m = [r.int(0, 3), r.int(0, 3), r.int(0, 1)]; lx = r.step(0.1, 0.9, 0.05); ly = r.step(0.1, 0.9, 0.05); a = Math.abs(Math.cos(m[0] * PI * lx) * Math.cos(m[1] * PI * ly) * Math.cos(m[2] * PI * EAR / R[2])); } while (!kind(m) || a < 0.06 || a > 0.97);
        return {
          q: [`In a room of ${dimTxt(R)}, a listener sits at $${n(lx)}$ of the length, $${n(ly)}$ of the width, ears $1.2$ m high. How far below its maximum (dB) is mode ${mTxt(m)} there? Give one decimal, as a negative number.`, `${dimTxt(R)} の部屋で、聴き手が長さの $${n(lx)}$、幅の $${n(ly)}$ の位置に座り、耳の高さは $1.2$ m です。そこでのモード ${mTxt(m)} の振幅は最大より何 dB 低いですか。小数第1位まで、負の数で答えてください。`],
          a: { type: 'num', v: db(a), tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['The mode shape is $\\cos(n_x\\pi x/L)\\cos(n_y\\pi y/W)\\cos(n_z\\pi z/H)$; with fractions, $n_x\\pi x/L = n_x\\pi\\cdot(x/L)$.', 'モードの形は $\\cos(n_x\\pi x/L)\\cos(n_y\\pi y/W)\\cos(n_z\\pi z/H)$ です。割合で書けば $n_x\\pi x/L = n_x\\pi\\cdot(x/L)$ です。'],
          sol: [[`$\\cos(${m[0]}\\pi\\times${n(lx)}) = ${n(Math.cos(m[0] * PI * lx), 4)}$, $\\cos(${m[1]}\\pi\\times${n(ly)}) = ${n(Math.cos(m[1] * PI * ly), 4)}$, $\\cos(${m[2]}\\pi\\times 1.2/${n(R[2])}) = ${n(Math.cos(m[2] * PI * EAR / R[2]), 4)}$.`, `$\\cos(${m[0]}\\pi\\times${n(lx)}) = ${n(Math.cos(m[0] * PI * lx), 4)}$、$\\cos(${m[1]}\\pi\\times${n(ly)}) = ${n(Math.cos(m[1] * PI * ly), 4)}$、$\\cos(${m[2]}\\pi\\times 1.2/${n(R[2])}) = ${n(Math.cos(m[2] * PI * EAR / R[2]), 4)}$ です。`], [`The product has magnitude $${n(a, 4)}$, that is $${n(db(a), 3)}$ dB.`, `積の大きさは $${n(a, 4)}$、すなわち $${n(db(a), 3)}$ dB です。`], ['This is the readout "its amplitude at the listener": move a little and a mode can vanish, which is why bass changes from seat to seat.', 'これは読み取り欄の「聴き手でのその振幅」です。少し動くだけでモードが消えることもあり、席ごとに低音が変わるのはこのためです。']],
          set: { L: R[0], W: R[1], H: R[2], nx: m[0], ny: m[1], nz: m[2], lx, ly },
        };
      }
      if (form === 2) {
        const R = r.pick(rooms), T = r.pick([0.3, 0.4, 0.5, 0.6, 0.8]), V = R[0] * R[1] * R[2], fS = 2000 * Math.sqrt(T / V);
        return {
          q: [`A room of ${dimTxt(R)} has $T_{60} = ${n(T)}$ s. Estimate its Schroeder frequency.`, `${dimTxt(R)} の部屋の $T_{60}$ は $${n(T)}$ s です。シュレーダー周波数を見積もってください。`],
          a: { type: 'num', v: fS, rel: 0.01, unit: ['Hz', 'Hz'] },
          hint: ['$f_S \\approx 2000\\sqrt{T_{60}/V}$ with $V$ in cubic metres.', '$V$ を立方メートルとして $f_S \\approx 2000\\sqrt{T_{60}/V}$ です。'],
          sol: [[`$V = ${n(V, 4)}\\ \\mathrm{m^3}$.`, `$V = ${n(V, 4)}\\ \\mathrm{m^3}$ です。`], [`$f_S = 2000\\sqrt{${n(T)}/${n(V, 4)}} = ${s3(fS)}$ Hz.`, `$f_S = 2000\\sqrt{${n(T)}/${n(V, 4)}} = ${s3(fS)}$ Hz です。`], ['Below it, individual modes decide the bass and seat position matters most; above it, modes overlap and the room behaves statistically.', 'それより下では個々のモードが低音を決め、座る位置が最も重要です。それより上ではモードが重なり合い、部屋は統計的にふるまいます。']],
          set: T === 0.4 ? { L: R[0], W: R[1], H: R[2] } : undefined,
        };
      }
      const R = r.pick(rooms), ax = r.int(0, 1), f = r.pick([100, 120, 150, 200]), N = Math.floor(2 * f * R[ax] / C - 1e-12);
      return {
        q: [`How many axial modes along the ${['length', 'width'][ax]} ($${n(R[ax])}$ m) lie below $${f}$ Hz?`, `${['長さ', '幅'][ax]}方向（$${n(R[ax])}$ m）の軸モードは、$${f}$ Hz より下にいくつありますか。`],
        a: { type: 'int', v: N },
        hint: ['They are equally spaced at multiples of $c/(2D)$.', '軸モードは $c/(2D)$ の整数倍に等間隔で並びます。'],
        sol: [[`The spacing is $343/(2\\times${n(R[ax])}) = ${s3(C / (2 * R[ax]))}$ Hz.`, `間隔は $343/(2\\times${n(R[ax])}) = ${s3(C / (2 * R[ax]))}$ Hz です。`], [`$${f}/${s3(C / (2 * R[ax]))} = ${n(2 * f * R[ax] / C, 3)}$, so ${N} modes fit below $${f}$ Hz.`, `$${f}/${s3(C / (2 * R[ax]))} = ${n(2 * f * R[ax] / C, 3)}$ なので、$${f}$ Hz より下に ${N} 個あります。`], ['Axial modes thin out relative to the total: the total count grows as $f^3$, the axial ones only as $f$.', '全体に占める軸モードの割合は減っていきます。モードの総数は $f^3$ で増えますが、軸モードは $f$ でしか増えません。']],
        set: { L: R[0], W: R[1], H: R[2] },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const R = r.pick(rooms), f = r.pick([60, 70, 80, 90]);
        const list = [];
        for (let a = 0; a <= 6; a++) for (let b = 0; b <= 6; b++) for (let c = 0; c <= 4; c++) { if (!a && !b && !c) continue; const fm = fMode(...R, a, b, c); if (fm < f) list.push([a, b, c, fm]); }
        list.sort((x, y) => x[3] - y[3]);
        const show = list.slice(0, 6).map((m) => `${mTxt(m.slice(0, 3))}\\ ${n(m[3], 1)}`).join(',\\ ');
        return {
          q: [`Count all the modes (axial, tangential and oblique) below $${f}$ Hz in a room of ${dimTxt(R)}.`, `${dimTxt(R)} の部屋で、$${f}$ Hz より下にあるモード（軸、接線、斜めのすべて）を数えてください。`],
          a: { type: 'int', v: list.length },
          hint: ['Bound each index: $n_x < 2fL/c$, and so on. Then test the combinations.', 'まず各番号の上限を $n_x < 2fL/c$ などで押さえ、組み合わせを調べます。'],
          sol: [[`$n_x \\le ${Math.floor(2 * f * R[0] / C)}$, $n_y \\le ${Math.floor(2 * f * R[1] / C)}$, $n_z \\le ${Math.floor(2 * f * R[2] / C)}$.`, `$n_x \\le ${Math.floor(2 * f * R[0] / C)}$、$n_y \\le ${Math.floor(2 * f * R[1] / C)}$、$n_z \\le ${Math.floor(2 * f * R[2] / C)}$ です。`], [list.length ? `In order: $${show}$${list.length > 6 ? ',\\ \\dots' : ''}: ${list.length} in all.` : 'None qualifies.', list.length ? `低い順に $${show}$${list.length > 6 ? ',\\ \\dots' : ''} で、全部で ${list.length} 個です。` : '該当するものはありません。'], list.length <= 12 ? ['So few, so far apart: below about 100 Hz a small room has a handful of resonances rather than a smooth response, which is why its bass is uneven.', 'これほど少なく、間が空いています。小さな部屋は 100 Hz 程度より下では滑らかな応答ではなく、ひと握りの共振しかもたないので、低音がでこぼこになります。'] : ['A larger room packs its modes more densely, as $f^3V$: the gaps between resonances shrink, and the bass evens out sooner.', '大きな部屋ほどモードは $f^3V$ に従って密に並びます。共振の間隔が狭まり、低音は早く平らになります。']],
          set: { L: R[0], W: R[1], H: R[2] },
        };
      }
      if (form === 1) {
        let L, p, q, W;
        do { L = r.step(3, 8, 0.5); [p, q] = r.pick([[2, 1], [3, 2], [4, 3], [3, 1], [4, 2]]); W = q * L / p; } while (W < 2.5 || W > 6);
        const f = C * p / (2 * L);
        return {
          q: [`A room is $${n(L)}$ m long. Which width $W$ makes mode $(0, ${q}, 0)$ fall on exactly the same frequency as $(${p}, 0, 0)$?`, `長さ $${n(L)}$ m の部屋があります。モード $(0, ${q}, 0)$ がモード $(${p}, 0, 0)$ とちょうど同じ周波数になる幅 $W$ はいくらですか。`],
          a: { type: 'num', v: W, unit: ['m', 'm'] },
          hint: ['Set $q c/(2W) = p c/(2L)$.', '$q c/(2W) = p c/(2L)$ とおきます。'],
          sol: [[`$q/W = p/L$, so $W = qL/p = ${q}\\times${n(L)}/${p} = ${n(W, 4)}$ m.`, `$q/W = p/L$ なので $W = qL/p = ${q}\\times${n(L)}/${p} = ${n(W, 4)}$ m です。`], [`Both modes then sit at $${s3(f)}$ Hz. Two modes on one note make it boom, which is why rooms with simple ratios such as ${p}:${q} sound worse than ones with ratios like $1 : 1.4 : 1.9$.`, `二つのモードはどちらも $${s3(f)}$ Hz になります。一つの音に二つのモードが重なるとその音が響きすぎるので、${p}:${q} のような単純な比の部屋は $1 : 1.4 : 1.9$ のような比の部屋より音が悪くなります。`]],
          set: { L, W: snap(W, 0.05, 2.5, 6), nx: 0, ny: q, nz: 0 },
        };
      }
      if (form === 2) {
        const W = r.pick([3, 3.5, 4, 4.5, 5]), m = r.pick([[1, 1], [2, 1], [1, 2]]);
        return {
          q: [`A room is $${n(W)}$ m wide. Write the frequency of mode $(${m[0]}, ${m[1]}, 0)$ as a function of the length $L$ in metres ($c = 343$ m/s).`, `幅 $${n(W)}$ m の部屋があります。モード $(${m[0]}, ${m[1]}, 0)$ の周波数を、長さ $L$（メートル）の関数として書いてください（$c = 343$ m/s）。`],
          a: { type: 'expr', v: `171.5*sqrt((${m[0]}/L)^2+(${m[1]}/${W})^2)`, vars: ['L'], dom: { L: [3, 8] }, lhs: [`$f_{${m[0]}${m[1]}0}(L) =$`, `$f_{${m[0]}${m[1]}0}(L) =$`] },
          hint: ['Put $n_z = 0$ in the mode formula; the height drops out.', 'モードの式で $n_z = 0$ とおくと、高さは消えます。'],
          sol: [[`$f = \\dfrac{343}{2}\\sqrt{\\left(\\dfrac{${m[0]}}{L}\\right)^2 + \\left(\\dfrac{${m[1]}}{${n(W)}}\\right)^2}$.`, `$f = \\dfrac{343}{2}\\sqrt{\\left(\\dfrac{${m[0]}}{L}\\right)^2 + \\left(\\dfrac{${m[1]}}{${n(W)}}\\right)^2}$ です。`], [`As $L \\to \\infty$ it tends to the axial mode $(0, ${m[1]}, 0)$ at $${s3(C * m[1] / (2 * W))}$ Hz: a tangential mode is never lower than either of its axial parts.`, `$L \\to \\infty$ で軸モード $(0, ${m[1]}, 0)$ の $${s3(C * m[1] / (2 * W))}$ Hz に近づきます。接線モードは、それを構成するどちらの軸モードよりも低くなることはありません。`]],
          set: { W, nx: m[0], ny: m[1], nz: 0 },
        };
      }
      const opts = [['all three vanish at the centre: odd modes have a node there', '中央では三つとも消える。奇数のモードはそこに節をもつから'], ['$(1, 0, 0)$ and $(0, 1, 0)$ vanish, but $(2, 0, 0)$ is at full strength', '$(1, 0, 0)$ と $(0, 1, 0)$ は消えるが、$(2, 0, 0)$ は最大の強さになる'], ['none vanish: the centre is far from every wall, so every mode is weak there equally', 'どれも消えない。中央はどの壁からも遠いので、どのモードも同じように弱い'], ['only $(2, 0, 0)$ vanishes', '$(2, 0, 0)$ だけが消える']];
      return {
        q: ['A listener sits at the exact centre of the floor plan. What happens to modes $(1, 0, 0)$, $(0, 1, 0)$ and $(2, 0, 0)$ there?', '聴き手が平面図のちょうど中央に座ります。そこでモード $(1, 0, 0)$、$(0, 1, 0)$、$(2, 0, 0)$ はどうなりますか。'],
        a: { type: 'choice', opts, v: 1 },
        hint: ['Evaluate $\\cos(n\\pi/2)$ for $n = 1$ and $n = 2$.', '$n = 1$ と $n = 2$ について $\\cos(n\\pi/2)$ を計算してください。'],
        sol: [['At the centre $x/L = y/W = \\tfrac12$, and $\\cos(\\pi/2) = 0$ but $\\cos(\\pi) = -1$.', '中央では $x/L = y/W = \\tfrac12$ で、$\\cos(\\pi/2) = 0$ ですが $\\cos(\\pi) = -1$ です。'], ['So every mode with an odd index in that direction is silent and every even one is at full amplitude: the centre trades the lowest modes for a loud second harmonic.', 'そのため、その方向の番号が奇数のモードはすべて無音で、偶数のモードは最大振幅になります。中央は最も低いモードを消す代わりに、二倍のモードを大きくするのです。']],
        set: { nx: 2, ny: 0, nz: 0, lx: 0.5, ly: 0.5 },
      };
    },
  ];

  /* ---------------- 2. reverberation (the lab's rooms) ---------------- */
  const ROOMS = [{ dims: [5, 4, 2.5], full: 12, n: ['living room', '居間'] }, { dims: [9, 7, 3], full: 30, n: ['classroom', '教室'] }, { dims: [40, 24, 16], full: 1100, n: ['concert hall', 'コンサートホール'] }];
  const AF = [0.10, 0.30], AC = [0.05, 0.60], FL = [['bare wood', 'むき出しの木'], ['carpet', 'カーペット']], CE = [['plaster', '漆喰'], ['acoustic tiles', '吸音タイル']];
  function room(i, fl, ce, aw, furn) {
    const [a, b, h] = ROOMS[i].dims, V = a * b * h, Sf = a * b, Sw = 2 * (a + b) * h, S = 2 * Sf + Sw;
    const parts = { floor: Sf * AF[fl], ceil: Sf * AC[ce], walls: Sw * aw, furn: ROOMS[i].full * furn / 100 };
    const A = parts.floor + parts.ceil + parts.walls + parts.furn;
    return { V, S, Sf, Sw, A, parts, abar: A / S, dims: [a, b, h] };
  }
  const sab = (V, A) => 0.1611 * V / A;
  const roomTxt = (i, fl, ce, aw, furn) => [`the ${ROOMS[i].n[0]} ($${ROOMS[i].dims.join(' \\times ')}$ m) with a ${FL[fl][0]} floor ($\\alpha = ${AF[fl]}$), ${CE[ce][0]} ceiling ($\\alpha = ${AC[ce]}$), walls of $\\alpha = ${n(aw)}$, and furnishings and people adding $${n(ROOMS[i].full * furn / 100)}\\ \\mathrm{m^2}$ of absorption`, `${ROOMS[i].n[1]}（$${ROOMS[i].dims.join(' \\times ')}$ m）で、床は${FL[fl][1]}（$\\alpha = ${AF[fl]}$）、天井は${CE[ce][1]}（$\\alpha = ${AC[ce]}$）、壁は $\\alpha = ${n(aw)}$、家具と人が $${n(ROOMS[i].full * furn / 100)}\\ \\mathrm{m^2}$ の吸音量を加えます`];
  Q.reverberation = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.pick([50, 120, 200, 500, 2000, 15000]), A = r.pick([10, 20, 40, 80, 300, 1500].filter((x) => sab(V, x) > 0.2 && sab(V, x) < 4)), T = sab(V, A);
        return {
          q: [`A room of volume $${V}\\ \\mathrm{m^3}$ has $A = ${A}\\ \\mathrm{m^2}$ of absorption. What is its Sabine reverberation time?`, `体積 $${V}\\ \\mathrm{m^3}$ の部屋の吸音量は $A = ${A}\\ \\mathrm{m^2}$ です。セイビンの残響時間はいくらですか。`],
          a: { type: 'num', v: T, rel: 0.01, unit: ['s', 's'] },
          hint: ['$T_{60} = 0.161\\,V/A$, in seconds with SI units.', 'SI 単位で $T_{60} = 0.161\\,V/A$ 秒です。'],
          sol: [[`$T_{60} = 0.161\\times${V}/${A} = ${s3(T)}$ s.`, `$T_{60} = 0.161\\times${V}/${A} = ${s3(T)}$ s です。`], ['Twice the volume with the same absorption rings twice as long; twice the absorption halves it.', '吸音量が同じで体積が 2 倍なら 2 倍長く響き、吸音量を 2 倍にすれば半分になります。']],
        };
      }
      if (form === 1) {
        const Sf = r.pick([20, 30, 63]), Sw = r.pick([45, 60, 96]), af = r.pick([0.1, 0.3]), ac = r.pick([0.05, 0.6]), aw = r.pick([0.03, 0.05, 0.1, 0.2]);
        const A = Sf * af + Sf * ac + Sw * aw;
        return {
          q: [`A room has a floor and ceiling of $${Sf}\\ \\mathrm{m^2}$ each and $${Sw}\\ \\mathrm{m^2}$ of walls. The floor has $\\alpha = ${af}$, the ceiling $\\alpha = ${ac}$, the walls $\\alpha = ${aw}$. What is the total absorption $A$?`, `床と天井がそれぞれ $${Sf}\\ \\mathrm{m^2}$、壁が $${Sw}\\ \\mathrm{m^2}$ の部屋があります。床の $\\alpha$ は $${af}$、天井は $${ac}$、壁は $${aw}$ です。全体の吸音量 $A$ はいくらですか。`],
          a: { type: 'num', v: A, unit: ['m²', 'm²'] },
          hint: ['Each surface counts as its area times its absorption coefficient.', '各面は「面積 × 吸音率」として数えます。'],
          sol: [[`$A = ${Sf}\\times${af} + ${Sf}\\times${ac} + ${Sw}\\times${aw} = ${n(Sf * af, 3)} + ${n(Sf * ac, 3)} + ${n(Sw * aw, 3)}$.`, `$A = ${Sf}\\times${af} + ${Sf}\\times${ac} + ${Sw}\\times${aw} = ${n(Sf * af, 3)} + ${n(Sf * ac, 3)} + ${n(Sw * aw, 3)}$ です。`], [`$A = ${n(A, 3)}\\ \\mathrm{m^2}$: as much absorption as that area of open window.`, `$A = ${n(A, 3)}\\ \\mathrm{m^2}$ で、その面積の開いた窓と同じだけ音を吸います。`]],
        };
      }
      const i = r.int(0, 2), [a, b, h] = ROOMS[i].dims, V = a * b * h, S = 2 * (a * b + b * h + a * h), mfp = 4 * V / S;
      return {
        q: [`What is the mean free path $4V/S$ of the ${ROOMS[i].n[0]}, $${a} \\times ${b} \\times ${h}$ m?`, `${ROOMS[i].n[1]}（$${a} \\times ${b} \\times ${h}$ m）の平均自由行程 $4V/S$ はいくらですか。`],
        a: { type: 'num', v: mfp, unit: ['m', 'm'] },
        hint: ['Compute the volume and the total surface area of the box.', '箱の体積と表面積の合計を求めてください。'],
        sol: [[`$V = ${n(V)}\\ \\mathrm{m^3}$ and $S = 2(${a * b} + ${b * h} + ${a * h}) = ${n(S)}\\ \\mathrm{m^2}$.`, `$V = ${n(V)}\\ \\mathrm{m^3}$、$S = 2(${a * b} + ${b * h} + ${a * h}) = ${n(S)}\\ \\mathrm{m^2}$ です。`], [`$4V/S = ${n(mfp, 4)}$ m, so sound meets a surface about $343/${n(mfp, 3)} = ${s3(C / mfp)}$ times a second.`, `$4V/S = ${n(mfp, 4)}$ m なので、音は毎秒およそ $343/${n(mfp, 3)} = ${s3(C / mfp)}$ 回、面に当たります。`]],
        set: { room: i },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      const i = r.int(0, 2), fl = r.int(0, 1), ce = r.int(0, 1), aw = r.step(0.03, 0.4, 0.01), furn = r.step(0, 100, 10);
      const R = room(i, fl, ce, aw, furn), T = sab(R.V, R.A), set = { room: i, floor: fl, ceil: ce, aw, furn };
      const txt = roomTxt(i, fl, ce, aw, furn);
      if (form === 0) {
        return {
          q: [`Take ${txt[0]}. What is the Sabine $T_{60}$?`, `${txt[1]}。セイビンの $T_{60}$ はいくらですか。`],
          a: { type: 'num', v: T, rel: 0.01, unit: ['s', 's'] },
          hint: ['Floor and ceiling each have area $ab$; the four walls $2(a + b)h$.', '床と天井の面積はそれぞれ $ab$、四つの壁は $2(a + b)h$ です。'],
          sol: [[`$A = ${n(R.parts.floor, 3)} + ${n(R.parts.ceil, 3)} + ${n(R.parts.walls, 3)} + ${n(R.parts.furn, 3)} = ${n(R.A, 4)}\\ \\mathrm{m^2}$ (floor, ceiling, walls, contents).`, `$A = ${n(R.parts.floor, 3)} + ${n(R.parts.ceil, 3)} + ${n(R.parts.walls, 3)} + ${n(R.parts.furn, 3)} = ${n(R.A, 4)}\\ \\mathrm{m^2}$ です（床、天井、壁、中身の順）。`], [`$T_{60} = 0.161\\times${n(R.V)}/${n(R.A, 4)} = ${s3(T)}$ s.`, `$T_{60} = 0.161\\times${n(R.V)}/${n(R.A, 4)} = ${s3(T)}$ s です。`], [T > 1.6 ? 'Long enough to blend music, too long for clear speech.' : T < 0.6 ? 'Short: speech is clear, music sounds dry.' : 'In between: fine for speech, a little dry for music.', T > 1.6 ? '音楽を溶け合わせるには十分な長さですが、話し言葉の明瞭さには長すぎます。' : T < 0.6 ? '短いので話し言葉は明瞭ですが、音楽は乾いて聞こえます。' : '中間で、話し言葉にはよく、音楽には少し乾いています。']],
          set,
        };
      }
      if (form === 1) {
        const ab = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]), j = r.int(0, 2), [a, b, h] = ROOMS[j].dims, V = a * b * h, S = 2 * (a * b + b * h + a * h);
        const Ts = 0.1611 * V / (S * ab), Te = 0.1611 * V / (-S * Math.log(1 - ab));
        return {
          q: [`The ${ROOMS[j].n[0]} ($${a} \\times ${b} \\times ${h}$ m) has mean absorption coefficient $\\bar\\alpha = ${ab}$. Find $T_{60}$ by Sabine and by Eyring.`, `${ROOMS[j].n[1]}（$${a} \\times ${b} \\times ${h}$ m）の平均吸音率は $\\bar\\alpha = ${ab}$ です。セイビンとアイリングの式で $T_{60}$ を求めてください。`],
          a: { type: 'tuple', v: [Ts, Te], labels: [['Sabine (s)', 'セイビン（s）'], ['Eyring (s)', 'アイリング（s）']], rel: 0.01 },
          hint: ['Eyring replaces $\\bar\\alpha$ by $-\\ln(1 - \\bar\\alpha)$.', 'アイリングの式は $\\bar\\alpha$ を $-\\ln(1 - \\bar\\alpha)$ に置き換えます。'],
          sol: [[`$V = ${n(V)}\\ \\mathrm{m^3}$, $S = ${n(S)}\\ \\mathrm{m^2}$; Sabine: $0.161\\times${n(V)}/(${n(S)}\\times${ab}) = ${s3(Ts)}$ s.`, `$V = ${n(V)}\\ \\mathrm{m^3}$、$S = ${n(S)}\\ \\mathrm{m^2}$ です。セイビン：$0.161\\times${n(V)}/(${n(S)}\\times${ab}) = ${s3(Ts)}$ s です。`], [`Eyring: $-\\ln(1 - ${ab}) = ${n(-Math.log(1 - ab), 4)}$, so $T_{60} = ${s3(Te)}$ s.`, `アイリング：$-\\ln(1 - ${ab}) = ${n(-Math.log(1 - ab), 4)}$ なので $T_{60} = ${s3(Te)}$ s です。`], [`They differ by ${n((Ts / Te - 1) * 100, 1)} %: Sabine is fine for live rooms and overestimates the decay of absorbent ones.`, `差は ${n((Ts / Te - 1) * 100, 1)} % です。セイビンの式は響く部屋には十分ですが、吸音の多い部屋では減衰時間を大きく見積もります。`]],
        };
      }
      if (form === 2) {
        const rc = Math.sqrt(2 * R.A / (16 * PI));
        return {
          q: [`Take ${txt[0]}. A loudspeaker against a wall radiates into half-space ($Q = 2$). What is the critical distance?`, `${txt[1]}。壁際のスピーカーが半空間に放射します（$Q = 2$）。臨界距離はいくらですか。`],
          a: { type: 'num', v: rc, rel: 0.01, unit: ['m', 'm'] },
          hint: ['At $r_c$ the direct level $Q/(4\\pi r^2)$ equals the reverberant level $4/A$.', '$r_c$ では直接音のレベル $Q/(4\\pi r^2)$ が残響音のレベル $4/A$ に等しくなります。'],
          sol: [[`$A = ${n(R.A, 4)}\\ \\mathrm{m^2}$.`, `$A = ${n(R.A, 4)}\\ \\mathrm{m^2}$ です。`], [`$r_c = \\sqrt{QA/16\\pi} = \\sqrt{2\\times${n(R.A, 4)}/(16\\pi)} = ${s3(rc)}$ m.`, `$r_c = \\sqrt{QA/16\\pi} = \\sqrt{2\\times${n(R.A, 4)}/(16\\pi)} = ${s3(rc)}$ m です。`], ['Most listeners in a domestic room sit beyond it: what they hear is mostly the room.', '家庭の部屋ではほとんどの聴き手がこれより遠くに座ります。聞いているのは主に部屋の音なのです。']],
          set,
        };
      }
      const rr = r.pick([0.5, 1, 1.5, 2, 3, 5, 8, 12]), d = 10 * Math.log10(2 / (4 * PI * rr * rr)) - 10 * Math.log10(4 / R.A);
      return {
        q: [`Take ${txt[0]}. A listener sits $${rr}$ m from a loudspeaker with $Q = 2$. By how many dB does the direct sound exceed the reverberant sound (negative if it is quieter)? Give one decimal.`, `${txt[1]}。聴き手が $Q = 2$ のスピーカーから $${rr}$ m に座ります。直接音は残響音より何 dB 大きいですか（小さければ負）。小数第1位まで答えてください。`],
        a: { type: 'num', v: d, tol: 0.06, unit: ['dB', 'dB'] },
        hint: ['$L_{\\rm dir} - L_{\\rm rev} = 10\\log_{10}\\dfrac{Q/4\\pi r^2}{4/A}$.', '$L_{\\rm dir} - L_{\\rm rev} = 10\\log_{10}\\dfrac{Q/4\\pi r^2}{4/A}$ です。'],
        sol: [[`$A = ${n(R.A, 4)}\\ \\mathrm{m^2}$, so $4/A = ${n(4 / R.A, 4)}$; $Q/4\\pi r^2 = ${n(2 / (4 * PI * rr * rr), 4)}$.`, `$A = ${n(R.A, 4)}\\ \\mathrm{m^2}$ なので $4/A = ${n(4 / R.A, 4)}$、$Q/4\\pi r^2 = ${n(2 / (4 * PI * rr * rr), 4)}$ です。`], [`$10\\log_{10}(${n(2 / (4 * PI * rr * rr), 4)}/${n(4 / R.A, 4)}) = ${n(d, 3)}$ dB. ${d > 0 ? 'The listener is inside the critical distance.' : 'The listener is beyond the critical distance, in the room\'s sound.'}`, `$10\\log_{10}(${n(2 / (4 * PI * rr * rr), 4)}/${n(4 / R.A, 4)}) = ${n(d, 3)}$ dB です。${d > 0 ? '聴き手は臨界距離の内側にいます。' : '聴き手は臨界距離の外、部屋の音の中にいます。'}`]],
        set: { ...set, r: rr },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const V = r.pick([60, 150, 250, 400, 800]), T1 = r.pick([1.2, 1.5, 1.8, 2, 2.5]), T2 = r.pick([0.4, 0.5, 0.6, 0.8].filter((x) => x < T1));
        const dA = 0.1611 * V * (1 / T2 - 1 / T1);
        return {
          q: [`A $${V}\\ \\mathrm{m^3}$ room has $T_{60} = ${T1}$ s. How many square metres of perfect absorption must be added to bring it to $${T2}$ s?`, `$${V}\\ \\mathrm{m^3}$ の部屋の $T_{60}$ は $${T1}$ s です。これを $${T2}$ s にするには、完全な吸音面を何平方メートル加える必要がありますか。`],
          a: { type: 'num', v: dA, rel: 0.01, unit: ['m²', 'm²'] },
          hint: ['Find $A$ before and after from $A = 0.161V/T$; subtract.', '$A = 0.161V/T$ から前後の $A$ を求めて差をとります。'],
          sol: [[`$A_1 = 0.161\\times${V}/${T1} = ${n(0.1611 * V / T1, 4)}\\ \\mathrm{m^2}$, $A_2 = 0.161\\times${V}/${T2} = ${n(0.1611 * V / T2, 4)}\\ \\mathrm{m^2}$.`, `$A_1 = 0.161\\times${V}/${T1} = ${n(0.1611 * V / T1, 4)}\\ \\mathrm{m^2}$、$A_2 = 0.161\\times${V}/${T2} = ${n(0.1611 * V / T2, 4)}\\ \\mathrm{m^2}$ です。`], [`$\\Delta A = ${s3(dA)}\\ \\mathrm{m^2}$; a panel with $\\alpha = 0.8$ would need $${s3(dA / 0.8)}\\ \\mathrm{m^2}$.`, `$\\Delta A = ${s3(dA)}\\ \\mathrm{m^2}$ です。$\\alpha = 0.8$ のパネルなら $${s3(dA / 0.8)}\\ \\mathrm{m^2}$ 必要です。`], ['Halving a long decay costs as much absorption as the room already has: treatment pays off fastest in a bare room.', '長い減衰を半分にするには、部屋がすでにもっているのと同じだけの吸音が要ります。むき出しの部屋ほど対策の効果がすぐ現れます。']],
        };
      }
      if (form === 1) {
        let i, fl, ce, furn, awTrue, R0, T;
        do { i = r.int(0, 1); fl = r.int(0, 1); ce = r.int(0, 1); furn = r.step(0, 100, 10); awTrue = r.step(0.03, 0.55, 0.01); R0 = room(i, fl, ce, awTrue, furn); T = Math.round(sab(R0.V, R0.A) * 100) / 100; } while (T < 0.25);
        const R = room(i, fl, ce, 0, furn), Aneed = 0.1611 * R.V / T, aw = (Aneed - R.A) / R.Sw;
        return {
          q: [`In the ${ROOMS[i].n[0]} ($${ROOMS[i].dims.join(' \\times ')}$ m) with a ${FL[fl][0]} floor, ${CE[ce][0]} ceiling and furnishings adding $${n(ROOMS[i].full * furn / 100)}\\ \\mathrm{m^2}$, what wall absorption coefficient gives $T_{60} = ${n(T)}$ s?`, `${ROOMS[i].n[1]}（$${ROOMS[i].dims.join(' \\times ')}$ m）で床は${FL[fl][1]}、天井は${CE[ce][1]}、家具が $${n(ROOMS[i].full * furn / 100)}\\ \\mathrm{m^2}$ を加えます。$T_{60} = ${n(T)}$ s にする壁の吸音率はいくらですか。`],
          a: { type: 'num', v: aw, tol: 0.005 },
          hint: ['Find the total $A$ the target needs, subtract what the floor, ceiling and contents provide, and divide by the wall area.', '目標に必要な全吸音量 $A$ を求め、床、天井、中身の分を引き、壁の面積で割ります。'],
          sol: [[`Needed: $A = 0.161\\times${n(R.V)}/${n(T)} = ${n(Aneed, 4)}\\ \\mathrm{m^2}$; already present: $${n(R.A, 4)}\\ \\mathrm{m^2}$.`, `必要量は $A = 0.161\\times${n(R.V)}/${n(T)} = ${n(Aneed, 4)}\\ \\mathrm{m^2}$、既存分は $${n(R.A, 4)}\\ \\mathrm{m^2}$ です。`], [`The walls, $${n(R.Sw)}\\ \\mathrm{m^2}$, must supply $${n(Aneed - R.A, 4)}\\ \\mathrm{m^2}$, so $\\alpha_w = ${n(aw, 4)}$.`, `壁（$${n(R.Sw)}\\ \\mathrm{m^2}$）が $${n(Aneed - R.A, 4)}\\ \\mathrm{m^2}$ を受け持つので $\\alpha_w = ${n(aw, 4)}$ です。`], [aw > 0.3 ? 'That is heavy treatment: curtains or panels over much of the wall.' : 'Ordinary painted walls are about 0.02 to 0.05, so this is a modest amount of treatment.', aw > 0.3 ? 'これはかなりの対策で、壁の多くをカーテンやパネルで覆う必要があります。' : '普通の塗装壁は 0.02 から 0.05 程度なので、これは控えめな対策です。']],
          set: { room: i, floor: fl, ceil: ce, furn, aw: snap(aw, 0.01, 0.02, 0.6) },
        };
      }
      if (form === 2) {
        const t = r.pick([-10, 0, 10, 20, 30, 35]), c = 331.3 + 0.606 * t, k = 24 * Math.log(10) / c;
        return {
          q: [`Sabine's constant is $24\\ln 10/c$. What is it at $${t}^\\circ$C, where $c = 331.3 + 0.606\\,t$ m/s? Give four decimals.`, `セイビンの定数は $24\\ln 10/c$ です。$c = 331.3 + 0.606\\,t$ m/s として、$${t}^\\circ$C ではいくらですか。小数第4位まで答えてください。`],
          a: { type: 'num', v: k, tol: 0.00006, unit: ['s/m', 's/m'] },
          hint: ['60 dB is a factor $10^6$ in energy; the energy decays as $e^{-cAt/4V}$.', '60 dB はエネルギーで $10^6$ 倍です。エネルギーは $e^{-cAt/4V}$ で減衰します。'],
          sol: [[`$e^{-cAT/4V} = 10^{-6}$ gives $T = \\dfrac{4\\ln 10^6}{c}\\dfrac VA = \\dfrac{24\\ln 10}{c}\\dfrac VA$.`, `$e^{-cAT/4V} = 10^{-6}$ から $T = \\dfrac{4\\ln 10^6}{c}\\dfrac VA = \\dfrac{24\\ln 10}{c}\\dfrac VA$ です。`], [`$c = ${n(c, 4)}$ m/s, so the constant is $55.262/${n(c, 4)} = ${n(k, 5)}$.`, `$c = ${n(c, 4)}$ m/s なので、定数は $55.262/${n(c, 4)} = ${n(k, 5)}$ です。`], ['Warm air carries sound faster, so it reaches the walls more often and the reverberation is a little shorter.', '暖かい空気では音が速く進むので、壁に当たる回数が増え、残響は少し短くなります。']],
        };
      }
      const opts = [['about 0 dB: the reverberant field is the same everywhere', '約 0 dB：残響音場はどこでも同じだから'], ['about $-6$ dB: the inverse square law', '約 $-6$ dB：逆二乗則による'], ['about $-3$ dB: half the energy', '約 $-3$ dB：エネルギーが半分になる'], ['about $+3$ dB: more reflections reach a distant listener', '約 $+3$ dB：遠い聴き手にはより多くの反射が届く']];
      return {
        q: ['A listener at five times the critical distance moves twice as far away from the loudspeaker. Roughly how does the total level change?', '臨界距離の 5 倍の位置にいる聴き手が、スピーカーから 2 倍の距離まで離れます。全体のレベルはおよそどう変わりますか。'],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Compare the direct and the reverberant contributions there.', 'そこでの直接音と残響音の寄与を比べてください。'],
        sol: [['At $5r_c$ the direct sound is $20\\log_{10}5 = 14$ dB below the reverberant field, and at $10r_c$ it is 20 dB below.', '$5r_c$ では直接音は残響音場より $20\\log_{10}5 = 14$ dB 低く、$10r_c$ では 20 dB 低くなります。'], ['The total is set by the reverberant level $4/A$, which does not depend on distance: the change is under 0.2 dB. Walking away no longer makes it quieter, only less clear.', '全体のレベルは距離によらない残響音のレベル $4/A$ で決まり、変化は 0.2 dB 未満です。離れても静かにはならず、明瞭さが下がるだけです。']],
        set: { r: 20 },
      };
    },
  ];

  /* ---------------- 3. boundary reflection ---------------- */
  const refl = (a, b, d) => { const r1 = Math.hypot(d, b - a), r2 = Math.hypot(d, b + a); return { r1, r2, D: r2 - r1 }; };
  Q['boundary-reflection'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([0.3, 0.5, 0.8, 1, 1.2]), b = r.pick([1, 1.2, 1.5]), d = r.pick([2, 2.5, 3, 4]), R = refl(a, b, d);
        return {
          q: [`A loudspeaker is $${a}$ m above a hard floor, the listener's ears $${b}$ m above it, $${d}$ m away horizontally. How long is the reflected path, via the image source?`, `スピーカーは硬い床から $${a}$ m、聴き手の耳は $${b}$ m の高さにあり、水平に $${d}$ m 離れています。鏡像音源を経由する反射経路の長さはいくらですか。`],
          a: { type: 'num', v: R.r2, unit: ['m', 'm'] },
          hint: ['The image sits $a$ below the floor, so it is $a + b$ below the listener.', '鏡像は床の $a$ 下にあるので、聴き手からは $a + b$ 下にあります。'],
          sol: [[`$r_2 = \\sqrt{d^2 + (a + b)^2} = \\sqrt{${d * d} + ${n((a + b) ** 2, 4)}}$.`, `$r_2 = \\sqrt{d^2 + (a + b)^2} = \\sqrt{${d * d} + ${n((a + b) ** 2, 4)}}$ です。`], [`$r_2 = ${n(R.r2, 4)}$ m, against $r_1 = ${n(R.r1, 4)}$ m for the direct path: the reflection is ${n(R.D * 100, 1)} cm late.`, `$r_2 = ${n(R.r2, 4)}$ m で、直接の経路 $r_1 = ${n(R.r1, 4)}$ m より ${n(R.D * 100, 1)} cm 長くなります。`]],
          set: { surf: 0, a, b, d },
        };
      }
      if (form === 1) {
        const D = r.pick([0.2, 0.343, 0.5, 0.686, 1, 1.5, 2]), t = D / C * 1000;
        return {
          q: [`A reflection travels $${D}$ m further than the direct sound. How many milliseconds later does it arrive?`, `反射音は直接音より $${D}$ m 長く進みます。何ミリ秒遅れて届きますか。`],
          a: { type: 'num', v: t, rel: 0.01, unit: ['ms', 'ms'] },
          hint: ['Divide by the speed of sound, $343$ m/s.', '音速 $343$ m/s で割ります。'],
          sol: [[`$\\tau = ${D}/343 = ${sig(D / C, 3)}$ s $= ${s3(t)}$ ms.`, `$\\tau = ${D}/343 = ${sig(D / C, 3)}$ s $= ${s3(t)}$ ms です。`], ['Far too short to hear as an echo: the ear fuses it with the direct sound and hears it as colouration.', 'エコーとして聞き分けるには短すぎます。耳は直接音と融合させ、音色の変化として聞きます。']],
        };
      }
      const D = r.pick([0.2, 0.25, 0.4, 0.5, 0.7, 1, 1.4, 2]), f = C / (2 * D);
      return {
        q: [`The reflected path is $${D}$ m longer than the direct one. At what frequency is the first notch?`, `反射の経路は直接の経路より $${D}$ m 長くなっています。最初の落ち込みは何 Hz ですか。`],
        a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
        hint: ['The first cancellation is where the extra path is half a wavelength.', '最初の打ち消しは、余分な経路が半波長になるところです。'],
        sol: [[`$\\Delta = \\lambda/2$, so $f_1 = c/(2\\Delta) = 343/(2\\times${D})$.`, `$\\Delta = \\lambda/2$ なので $f_1 = c/(2\\Delta) = 343/(2\\times${D})$ です。`], [`$f_1 = ${s3(f)}$ Hz; the next notches are at $3f_1$, $5f_1$, and so on.`, `$f_1 = ${s3(f)}$ Hz で、次の落ち込みは $3f_1$、$5f_1$ と続きます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const surf = r.int(0, 1), a = r.pick([0.3, 0.5, 0.8, 1, 1.2]), b = r.pick([1, 1.2, 1.5, 2]), d = r.pick([1.5, 2, 2.5, 3, 4]), R = refl(a, b, d), f = C / (2 * R.D);
        return {
          q: [`The speaker is $${a}$ m from the ${surf ? 'wall behind it' : 'floor'}, the listener $${b}$ m from it and $${d}$ m along it. Find the extra path $\\Delta$ and the first notch.`, `スピーカーは${surf ? '後ろの壁' : '床'}から $${a}$ m、聴き手はそこから $${b}$ m で、面に沿って $${d}$ m 離れています。余分な経路 $\\Delta$ と最初の落ち込みを求めてください。`],
          a: { type: 'tuple', v: [R.D, f], labels: ['$\\Delta$ (m)', '$f_1$ (Hz)'], rel: 0.005 },
          hint: ['$r_{1,2} = \\sqrt{d^2 + (b \\mp a)^2}$.', '$r_{1,2} = \\sqrt{d^2 + (b \\mp a)^2}$ です。'],
          sol: [[`$r_1 = \\sqrt{${d * d} + ${n((b - a) ** 2, 4)}} = ${n(R.r1, 4)}$ m, $r_2 = \\sqrt{${d * d} + ${n((b + a) ** 2, 4)}} = ${n(R.r2, 4)}$ m.`, `$r_1 = \\sqrt{${d * d} + ${n((b - a) ** 2, 4)}} = ${n(R.r1, 4)}$ m、$r_2 = \\sqrt{${d * d} + ${n((b + a) ** 2, 4)}} = ${n(R.r2, 4)}$ m です。`], [`$\\Delta = ${n(R.D, 4)}$ m and $f_1 = 343/(2\\times${n(R.D, 4)}) = ${s3(f)}$ Hz.`, `$\\Delta = ${n(R.D, 4)}$ m、$f_1 = 343/(2\\times${n(R.D, 4)}) = ${s3(f)}$ Hz です。`], ['This is the first entry in the readout of notches; the whole comb is fixed by this one length.', 'これは読み取り欄の落ち込みの最初の値です。くし全体がこの一つの長さで決まります。']],
          set: { surf, a, b, d, lf: lfOf(f, 1.5, 3) },
        };
      }
      if (form === 1) {
        const a = r.pick([0.3, 0.5, 0.8, 1]), b = r.pick([1, 1.2, 1.5]), d = r.pick([2, 3, 4]), g = r.pick([0.5, 0.7, 0.9, 1]), R = refl(a, b, d), k = g * R.r1 / R.r2;
        return {
          q: [`Floor reflection with coefficient $g = ${g}$; speaker $${a}$ m up, listener $${b}$ m up, $${d}$ m apart. How deep are the notches and how high the peaks, in dB relative to the direct sound?`, `反射係数 $g = ${g}$ の床の反射です。スピーカーは高さ $${a}$ m、聴き手は $${b}$ m で、$${d}$ m 離れています。直接音に対して、落ち込みの深さと山の高さはそれぞれ何 dB ですか。`],
          a: { type: 'tuple', v: [db(1 - k), db(1 + k)], labels: [['notch (dB)', '落ち込み（dB）'], ['peak (dB)', '山（dB）']], tol: 0.06 },
          hint: ['The reflection arrives with relative amplitude $g\\,r_1/r_2$; it subtracts in the notches and adds in the peaks.', '反射は相対振幅 $g\\,r_1/r_2$ で届き、落ち込みでは引かれ、山では足されます。'],
          sol: [[`$r_1 = ${n(R.r1, 4)}$ m, $r_2 = ${n(R.r2, 4)}$ m, so the reflection's amplitude is $${g}\\times${n(R.r1 / R.r2, 4)} = ${n(k, 4)}$.`, `$r_1 = ${n(R.r1, 4)}$ m、$r_2 = ${n(R.r2, 4)}$ m なので、反射の振幅は $${g}\\times${n(R.r1 / R.r2, 4)} = ${n(k, 4)}$ です。`], [`Notch: $20\\log_{10}(1 - ${n(k, 4)}) = ${n(db(1 - k), 3)}$ dB; peak: $20\\log_{10}(1 + ${n(k, 4)}) = ${n(db(1 + k), 3)}$ dB.`, `落ち込み：$20\\log_{10}(1 - ${n(k, 4)}) = ${n(db(1 - k), 3)}$ dB、山：$20\\log_{10}(1 + ${n(k, 4)}) = ${n(db(1 + k), 3)}$ dB です。`], ['The notches are much deeper than the peaks are high: cancellation is cruel, addition gentle.', '落ち込みは山の高さよりずっと深くなります。打ち消しは厳しく、足し合わせは穏やかです。']],
          set: { surf: 0, a, b, d, g },
        };
      }
      const D = r.pick([0.3, 0.5, 0.7, 1, 1.4]), k = r.int(2, 5), f1 = C / (2 * D), fk = (2 * k - 1) * f1;
      return {
        q: [`With an extra path of $${D}$ m, what is the frequency of notch number ${k}?`, `余分な経路が $${D}$ m のとき、${k} 番目の落ち込みの周波数はいくらですか。`],
        a: { type: 'num', v: fk, unit: ['Hz', 'Hz'] },
        hint: ['Notches sit where $\\Delta$ is an odd number of half-wavelengths: $(2n + 1)c/(2\\Delta)$, counting from $n = 0$.', '落ち込みは $\\Delta$ が半波長の奇数倍のところ、$n = 0$ から数えて $(2n + 1)c/(2\\Delta)$ にあります。'],
        sol: [[`$f_1 = 343/(2\\times${D}) = ${s3(f1)}$ Hz.`, `$f_1 = 343/(2\\times${D}) = ${s3(f1)}$ Hz です。`], [`Notch ${k} is $n = ${k - 1}$: $${2 * k - 1}\\times${s3(f1)} = ${s3(fk)}$ Hz. The notches are $2f_1 = ${s3(2 * f1)}$ Hz apart, evenly spaced on a linear axis.`, `${k} 番目は $n = ${k - 1}$ で、$${2 * k - 1}\\times${s3(f1)} = ${s3(fk)}$ Hz です。落ち込みは $2f_1 = ${s3(2 * f1)}$ Hz ごとに、線形の軸上で等間隔に並びます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const f = r.pick([150, 200, 250, 300, 400, 500]), a = C / (4 * f), b = r.pick([2, 2.5, 3, 3.5]);
        return {
          q: [`A loudspeaker faces straight out from the wall behind it, and the listener sits on its axis ($d = 0$), $${b}$ m from that wall. How close to the wall must the speaker be for the first notch to be at $${f}$ Hz or higher?`, `スピーカーは後ろの壁から真正面を向き、聴き手はその軸上（$d = 0$）、壁から $${b}$ m に座ります。最初の落ち込みを $${f}$ Hz 以上にするには、スピーカーを壁からどれだけ近づける必要がありますか。`],
          a: { type: 'num', v: a, unit: ['m', 'm'] },
          hint: ['With $d = 0$ the paths are $b - a$ and $b + a$, so $\\Delta = 2a$ exactly.', '$d = 0$ では経路は $b - a$ と $b + a$ なので、ちょうど $\\Delta = 2a$ です。'],
          sol: [[`$f_1 = c/(2\\Delta) = c/(4a)$.`, `$f_1 = c/(2\\Delta) = c/(4a)$ です。`], [`$a \\le 343/(4\\times${f}) = ${n(a, 4)}$ m, about ${n(a * 100, 0)} cm.`, `$a \\le 343/(4\\times${f}) = ${n(a, 4)}$ m、約 ${n(a * 100, 0)} cm です。`], ['That is why speakers meant to stand near a wall are designed for it, and why pulling a speaker a metre out puts a notch in the low bass.', '壁際に置く前提のスピーカーがそのように設計され、またスピーカーを壁から 1 m 離すと低音域に落ち込みができるのはこのためです。']],
          set: { surf: 1, a: snap(a, 0.01, 0.05, 2.5), b, d: 0, lf: lfOf(f, 1.5, 3) },
        };
      }
      if (form === 1) {
        return {
          q: ['With the listener on the speaker\'s axis ($d = 0$) and farther from the wall than the speaker, write the first notch frequency $f_1$ as a function of the speaker\'s distance $a$ (m) from the wall.', '聴き手がスピーカーの軸上（$d = 0$）で、スピーカーより壁から遠いとき、最初の落ち込みの周波数 $f_1$ を、スピーカーと壁の距離 $a$（m）の関数として書いてください。'],
          a: { type: 'expr', v: '343/(4*a)', vars: ['a'], dom: { a: [0.05, 2.5] }, lhs: ['$f_1(a) =$', '$f_1(a) =$'] },
          hint: ['Find $\\Delta = r_2 - r_1$ when $d = 0$.', '$d = 0$ のときの $\\Delta = r_2 - r_1$ を求めてください。'],
          sol: [['$r_1 = b - a$, $r_2 = b + a$, so $\\Delta = 2a$, independent of where on the axis the listener sits.', '$r_1 = b - a$、$r_2 = b + a$ なので $\\Delta = 2a$ で、聴き手が軸上のどこにいても変わりません。'], ['$f_1 = 343/(2\\cdot 2a) = 343/(4a)$: the quarter-wavelength rule. Halve the distance and the notch climbs an octave.', '$f_1 = 343/(2\\cdot 2a) = 343/(4a)$ で、四分の一波長の法則です。距離を半分にすると落ち込みは 1 オクターブ上がります。']],
          set: { surf: 1, d: 0, b: 3 },
        };
      }
      if (form === 2) {
        const a = r.pick([0.1, 0.15, 0.2, 0.3, 0.5]), b = r.pick([2, 2.5, 3, 3.5]), g = r.pick([0.8, 0.9, 1]), k = g * (b - a) / (b + a), G = db(1 + k);
        return {
          q: [`A speaker stands $${a}$ m in front of a wall ($g = ${g}$), the listener on its axis $${b}$ m from the wall. Well below the first notch, by how many dB does the wall lift the bass? Give one decimal.`, `スピーカーが壁（$g = ${g}$）の $${a}$ m 前に立ち、聴き手はその軸上で壁から $${b}$ m にいます。最初の落ち込みより十分低い周波数で、壁は低音を何 dB 持ち上げますか。小数第1位まで答えてください。`],
          a: { type: 'num', v: G, tol: 0.06, unit: ['dB', 'dB'] },
          hint: ['Far below the notch the reflection arrives nearly in phase: the level is $1 + g\\,r_1/r_2$.', '落ち込みより十分低いと、反射はほぼ同位相で届きます。レベルは $1 + g\\,r_1/r_2$ です。'],
          sol: [[`$r_1 = ${n(b - a, 3)}$ m, $r_2 = ${n(b + a, 3)}$ m, so $g\\,r_1/r_2 = ${n(k, 4)}$.`, `$r_1 = ${n(b - a, 3)}$ m、$r_2 = ${n(b + a, 3)}$ m なので $g\\,r_1/r_2 = ${n(k, 4)}$ です。`], [`$20\\log_{10}(1 + ${n(k, 4)}) = ${n(G, 3)}$ dB, below the first notch at $${s3(C / (4 * a))}$ Hz.`, `$20\\log_{10}(1 + ${n(k, 4)}) = ${n(G, 3)}$ dB で、これは $${s3(C / (4 * a))}$ Hz の最初の落ち込みより下で成り立ちます。`], ['Nearly 6 dB: the boundary gain a "near wall" setting cuts back with a shelving filter.', 'ほぼ 6 dB です。これが「壁際」設定がシェルビングフィルターで削る境界による増強です。']],
          set: { surf: 1, a, b, d: 0, g, lf: 1.5 },
        };
      }
      const opts = [['no: both copies are boosted equally and still cancel', 'いいえ。二つの複製が同じだけ持ち上げられ、やはり打ち消し合うから'], ['yes, with about 20 dB of boost', 'はい。約 20 dB 持ち上げれば埋まる'], ['yes, if the boost is narrow enough', 'はい。持ち上げる帯域が十分狭ければ埋まる'], ['only if the reflection coefficient is exactly 1', '反射係数がちょうど 1 のときだけ埋まる']];
      return {
        q: ['A listener measures a deep notch from a floor reflection. Can an equaliser in front of the amplifier fill it in?', '聴き手が床の反射による深い落ち込みを測定しました。アンプの前に置いたイコライザーでそれを埋められますか。'],
        a: { type: 'choice', opts, v: 0 },
        hint: ['The notch is a cancellation between two copies of the same signal.', '落ち込みは、同じ信号の二つの複製の打ち消し合いです。'],
        sol: [['An equaliser changes the signal before it splits into the direct and reflected copies, so it scales both by the same factor.', 'イコライザーは信号が直接音と反射音に分かれる前に働くので、両方を同じ倍率で変えます。'], ['$1 + g\\,(r_1/r_2)e^{-j2\\pi f\\Delta/c}$ is unchanged by any gain in front: only moving the speaker, the listener or the surface, or absorbing the reflection, can move or fill the notch.', '$1 + g\\,(r_1/r_2)e^{-j2\\pi f\\Delta/c}$ は前段のどんな利得でも変わりません。落ち込みを動かしたり埋めたりできるのは、スピーカー、聴き手、面を動かすか、反射を吸音することだけです。']],
        set: { surf: 0, g: 0.9 },
      };
    },
  ];
})();
