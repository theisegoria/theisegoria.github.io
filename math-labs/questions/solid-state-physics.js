'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, TAU = 2 * PI, D = PI / 180;

  /* ---------- 1. tight binding on a dimerised chain ---------- */
  const Ek = (t1, t2, k) => Math.sqrt(Math.max(0, t1 * t1 + t2 * t2 + 2 * t1 * t2 * Math.cos(k)));
  const T5 = (r, lo = 0.2, hi = 2) => Math.round(r.real(lo, hi, 2) * 20) / 20;
  const pair = (r, distinct = true) => { let a, b; do { a = T5(r, 0.3, 2); b = T5(r, 0.2, 2); } while (distinct && Math.abs(a - b) < 0.1); return [a, b]; };
  Q['tight-binding'] = [
    (r) => {
      const form = r.int(0, 2);
      const [t1, t2] = pair(r);
      if (form === 0) {
        const edge = r.chance(0.5);
        return {
          q: [edge ? `For hoppings $t_1 = ${t1}$ and $t_2 = ${t2}$, what is the energy of the upper band at the zone edge, $ka = \\pi$?` : `For hoppings $t_1 = ${t1}$ and $t_2 = ${t2}$, what is the highest energy of the upper band (at $k = 0$)?`, edge ? `飛び移り $t_1 = ${t1}$、$t_2 = ${t2}$ のとき、ゾーン端 $ka = \\pi$ での上のバンドのエネルギーはいくつですか。` : `飛び移り $t_1 = ${t1}$、$t_2 = ${t2}$ のとき、上のバンドの最高エネルギー（$k = 0$）はいくつですか。`],
          a: { type: 'num', v: edge ? Math.abs(t1 - t2) : t1 + t2, tol: 0.001 },
          hint: ['$E_+(k) = |t_1 + t_2e^{ika}|$: the two hoppings add in phase at $k = 0$ and oppose at $ka = \\pi$.', '$E_+(k) = |t_1 + t_2e^{ika}|$ です。二つの飛び移りは $k = 0$ で同位相に足し合わされ、$ka = \\pi$ で打ち消し合います。'],
          sol: [[edge ? `$E_+(\\pi) = |t_1 - t_2| = |${t1} - ${t2}| = ${n(Math.abs(t1 - t2))}$.` : `$E_+(0) = t_1 + t_2 = ${n(t1 + t2)}$.`, edge ? `$E_+(\\pi) = |t_1 - t_2| = |${t1} - ${t2}| = ${n(Math.abs(t1 - t2))}$ です。` : `$E_+(0) = t_1 + t_2 = ${n(t1 + t2)}$ です。`], [edge ? 'This is the bottom of the upper band; the gap is twice it.' : 'The bands are symmetric, so the lower band reaches down to the negative of this.', edge ? 'これは上のバンドの底で、ギャップはその2倍です。' : 'バンドは対称なので、下のバンドはこの値の符号を変えた所まで下がります。']],
          set: { t1, t2, k: edge ? 1 : 0 },
        };
      }
      if (form === 1) {
        return {
          q: [`How wide is the band gap of the chain with $t_1 = ${t1}$, $t_2 = ${t2}$?`, `$t_1 = ${t1}$、$t_2 = ${t2}$ の鎖のバンドギャップの幅はいくつですか。`],
          a: { type: 'num', v: 2 * Math.abs(t1 - t2), tol: 0.001 },
          hint: ['The gap sits at the zone edge, between $\\pm|t_1 - t_2|$.', 'ギャップはゾーン端の $\\pm|t_1 - t_2|$ の間にあります。'],
          sol: [[`Gap $= 2|t_1 - t_2| = 2 \\times ${n(Math.abs(t1 - t2))} = ${n(2 * Math.abs(t1 - t2))}$.`, `ギャップは $2|t_1 - t_2| = 2 \\times ${n(Math.abs(t1 - t2))} = ${n(2 * Math.abs(t1 - t2))}$ です。`], ['Unequal bonds alone open it: make them equal and the gap closes.', '結合が等しくないことだけでギャップが開き、等しくすると閉じます。']],
          set: { t1, t2, k: 1 },
        };
      }
      return {
        q: [`How wide is each band of the chain with $t_1 = ${t1}$, $t_2 = ${t2}$?`, `$t_1 = ${t1}$、$t_2 = ${t2}$ の鎖の各バンドの幅はいくつですか。`],
        a: { type: 'num', v: 2 * Math.min(t1, t2), tol: 0.001 },
        hint: ['The upper band runs from $|t_1 - t_2|$ up to $t_1 + t_2$.', '上のバンドは $|t_1 - t_2|$ から $t_1 + t_2$ までです。'],
        sol: [[`Width $= (t_1 + t_2) - |t_1 - t_2| = ${n(t1 + t2)} - ${n(Math.abs(t1 - t2))} = ${n(2 * Math.min(t1, t2))}$.`, `幅は $(t_1 + t_2) - |t_1 - t_2| = ${n(t1 + t2)} - ${n(Math.abs(t1 - t2))} = ${n(2 * Math.min(t1, t2))}$ です。`], ['It is set by the weaker bond: $2\\min(t_1, t_2)$. An electron can only travel as fast as its slowest link lets it.', '幅は弱いほうの結合で決まり、$2\\min(t_1, t_2)$ です。電子は最も弱い結合が許す速さでしか進めません。']],
        set: { t1, t2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const [t1, t2] = pair(r, false), kk = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]);
      const E = Ek(t1, t2, kk * PI);
      if (form === 0) {
        return {
          q: [`Find the upper-band energy $E_+(k)$ at $ka = ${kk}\\pi$ for $t_1 = ${t1}$, $t_2 = ${t2}$. Give three decimals.`, `$t_1 = ${t1}$、$t_2 = ${t2}$ のとき、$ka = ${kk}\\pi$ における上のバンドのエネルギー $E_+(k)$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: E, tol: 0.0015 },
          hint: ['$E_+ = \\sqrt{t_1^2 + t_2^2 + 2t_1t_2\\cos ka}$.', '$E_+ = \\sqrt{t_1^2 + t_2^2 + 2t_1t_2\\cos ka}$ です。'],
          sol: [[`$t_1^2 + t_2^2 = ${n(t1 * t1 + t2 * t2)}$ and $2t_1t_2\\cos(${kk}\\pi) = ${n(2 * t1 * t2 * Math.cos(kk * PI), 4)}$.`, `$t_1^2 + t_2^2 = ${n(t1 * t1 + t2 * t2)}$、$2t_1t_2\\cos(${kk}\\pi) = ${n(2 * t1 * t2 * Math.cos(kk * PI), 4)}$ です。`], [`$E_+ = \\sqrt{${n(E * E, 4)}} = ${n(E, 4)}$; the lower band has $-${n(E, 4)}$ at the same $k$.`, `$E_+ = \\sqrt{${n(E * E, 4)}} = ${n(E, 4)}$ で、同じ $k$ の下のバンドは $-${n(E, 4)}$ です。`]],
          set: { t1, t2, k: kk },
        };
      }
      if (form === 1) {
        const vg = -t1 * t2 * Math.sin(kk * PI) / E;
        return {
          q: [`What is the group velocity $dE_+/dk$ (in units of $a/\\hbar$) of the upper band at $ka = ${kk}\\pi$, for $t_1 = ${t1}$, $t_2 = ${t2}$? Give three decimals.`, `$t_1 = ${t1}$、$t_2 = ${t2}$ のとき、$ka = ${kk}\\pi$ における上のバンドの群速度 $dE_+/dk$（単位 $a/\\hbar$）はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: vg, tol: 0.0015 },
          hint: ['Differentiate the square root: $\\dfrac{dE}{dk} = \\dfrac{-t_1t_2\\sin ka}{E}$ with $a = 1$.', '平方根を微分します。$a = 1$ として $\\dfrac{dE}{dk} = \\dfrac{-t_1t_2\\sin ka}{E}$ です。'],
          sol: [[`$E_+ = ${n(E, 4)}$ and $t_1t_2\\sin(${kk}\\pi) = ${n(t1 * t2 * Math.sin(kk * PI), 4)}$.`, `$E_+ = ${n(E, 4)}$、$t_1t_2\\sin(${kk}\\pi) = ${n(t1 * t2 * Math.sin(kk * PI), 4)}$ です。`], [`$v_g = -${n(t1 * t2 * Math.sin(kk * PI), 4)}/${n(E, 4)} = ${n(vg, 4)}$.`, `$v_g = -${n(t1 * t2 * Math.sin(kk * PI), 4)}/${n(E, 4)} = ${n(vg, 4)}$ です。`], ['Negative: the upper band falls as $k$ grows, so a wavepacket there moves against its wavevector. The lower band has the opposite sign.', '負なので、上のバンドは $k$ とともに下がり、そこでの波束は波数と逆向きに進みます。下のバンドでは符号が逆です。']],
          set: { t1, t2, k: kk },
        };
      }
      let a, b, E0;
      do { [a, b] = pair(r); E0 = Math.round(r.real(Math.abs(a - b) + 0.05, a + b - 0.05, 2) * 100) / 100; } while (!(E0 > Math.abs(a - b) && E0 < a + b));
      const c = (E0 * E0 - a * a - b * b) / (2 * a * b), kf = Math.acos(c) / PI;
      return {
        q: [`For $t_1 = ${a}$, $t_2 = ${b}$, at which $ka/\\pi$ between 0 and 1 does the upper band have energy $E = ${E0}$?`, `$t_1 = ${a}$、$t_2 = ${b}$ のとき、0 と 1 の間のどの $ka/\\pi$ で上のバンドのエネルギーが $E = ${E0}$ になりますか。`],
        a: { type: 'num', v: kf, tol: 0.002 },
        hint: ['Square the dispersion and solve for $\\cos ka$.', '分散関係を二乗して $\\cos ka$ について解いてください。'],
        sol: [[`$\\cos ka = \\dfrac{E^2 - t_1^2 - t_2^2}{2t_1t_2} = \\dfrac{${n(E0 * E0, 4)} - ${n(a * a + b * b, 4)}}{${n(2 * a * b, 4)}} = ${n(c, 4)}$.`, `$\\cos ka = \\dfrac{E^2 - t_1^2 - t_2^2}{2t_1t_2} = \\dfrac{${n(E0 * E0, 4)} - ${n(a * a + b * b, 4)}}{${n(2 * a * b, 4)}} = ${n(c, 4)}$ です。`], [`$ka = ${n(Math.acos(c), 4)}$, so $ka/\\pi = ${n(kf, 4)}$; by symmetry $-${n(kf, 4)}$ works too.`, `$ka = ${n(Math.acos(c), 4)}$ なので $ka/\\pi = ${n(kf, 4)}$ です。対称性から $-${n(kf, 4)}$ でも同じです。`]],
        set: { t1: a, t2: b, k: Math.round(kf * 100) / 100 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [t1, t2] = pair(r, false);
        return {
          q: [`Write the upper band $E_+(k)$ of the chain with $t_1 = ${t1}$, $t_2 = ${t2}$ as a function of $k$ (take $a = 1$).`, `$t_1 = ${t1}$、$t_2 = ${t2}$ の鎖の上のバンド $E_+(k)$ を $k$ の式で表してください（$a = 1$）。`],
          a: { type: 'expr', v: `sqrt(${n(t1 * t1 + t2 * t2, 6)}+${n(2 * t1 * t2, 6)}*cos(k))`, vars: ['k'], dom: { k: [-3, 3] }, lhs: ['$E_+(k) =$', '$E_+(k) =$'] },
          hint: ['$E_+ = |t_1 + t_2e^{ik}|$; expand the modulus squared.', '$E_+ = |t_1 + t_2e^{ik}|$ の絶対値の二乗を展開してください。'],
          sol: [[`$|t_1 + t_2e^{ik}|^2 = t_1^2 + t_2^2 + 2t_1t_2\\cos k = ${n(t1 * t1 + t2 * t2)} + ${n(2 * t1 * t2)}\\cos k$.`, `$|t_1 + t_2e^{ik}|^2 = t_1^2 + t_2^2 + 2t_1t_2\\cos k = ${n(t1 * t1 + t2 * t2)} + ${n(2 * t1 * t2)}\\cos k$ です。`], [`$E_+(k) = \\sqrt{${n(t1 * t1 + t2 * t2)} + ${n(2 * t1 * t2)}\\cos k}$, running from $${n(Math.abs(t1 - t2))}$ at $k = \\pm\\pi$ to $${n(t1 + t2)}$ at $k = 0$.`, `$E_+(k) = \\sqrt{${n(t1 * t1 + t2 * t2)} + ${n(2 * t1 * t2)}\\cos k}$ で、$k = \\pm\\pi$ の $${n(Math.abs(t1 - t2))}$ から $k = 0$ の $${n(t1 + t2)}$ まで変わります。`]],
          set: { t1, t2 },
        };
      }
      if (form === 1) {
        const [t1, t2] = pair(r);
        const d = Math.abs(t1 - t2), curv = t1 * t2 / d;
        return {
          q: [`Near the zone edge the upper band of the chain ($t_1 = ${t1}$, $t_2 = ${t2}$) is a parabola $E \\approx E_0 + \\tfrac12 E''q^2$ with $q = k - \\pi$. Find the curvature $E''$ ($a = 1$), whose inverse is the effective mass in units of $\\hbar^2$.`, `ゾーン端の近くで鎖（$t_1 = ${t1}$、$t_2 = ${t2}$）の上のバンドは放物線 $E \\approx E_0 + \\tfrac12 E''q^2$（$q = k - \\pi$）になります。曲率 $E''$（$a = 1$）を求めてください。その逆数が $\\hbar^2$ を単位とする有効質量です。`],
          a: { type: 'num', v: curv, rel: 0.003 },
          hint: ['Expand $\\cos(\\pi + q) \\approx -1 + q^2/2$ inside the square root.', '平方根の中で $\\cos(\\pi + q) \\approx -1 + q^2/2$ と展開してください。'],
          sol: [[`$E^2 \\approx (t_1 - t_2)^2 + t_1t_2q^2$, so $E \\approx |t_1 - t_2| + \\dfrac{t_1t_2}{2|t_1 - t_2|}q^2$.`, `$E^2 \\approx (t_1 - t_2)^2 + t_1t_2q^2$ なので $E \\approx |t_1 - t_2| + \\dfrac{t_1t_2}{2|t_1 - t_2|}q^2$ です。`], [`$E'' = t_1t_2/|t_1 - t_2| = ${n(t1 * t2, 4)}/${n(d, 4)} = ${n(curv, 4)}$, so $m^* = ${n(1 / curv, 4)}\\,\\hbar^2/a^2$.`, `$E'' = t_1t_2/|t_1 - t_2| = ${n(t1 * t2, 4)}/${n(d, 4)} = ${n(curv, 4)}$ なので $m^* = ${n(1 / curv, 4)}\\,\\hbar^2/a^2$ です。`], ['A small gap makes a sharply curved band edge and a light carrier: the same trade-off makes narrow-gap semiconductors fast.', 'ギャップが小さいとバンド端は鋭く曲がり、キャリアは軽くなります。狭いギャップの半導体が速いのも同じ理由です。']],
          set: { t1, t2, k: 1 },
        };
      }
      const eq = r.chance(0.4), t = T5(r, 0.4, 1.6);
      let t1 = t, t2 = t;
      if (!eq) [t1, t2] = pair(r);
      return {
        q: [`Each site gives one electron, so at zero temperature the lower band is exactly full. Is the chain with $t_1 = ${t1}$, $t_2 = ${t2}$ a metal or an insulator?`, `各サイトが電子を一つずつ出すので、絶対零度では下のバンドがちょうど満ちます。$t_1 = ${t1}$、$t_2 = ${t2}$ の鎖は金属ですか、絶縁体ですか。`],
        a: { type: 'choice', opts: [['Insulator: a gap $2|t_1 - t_2|$ separates the full band from the empty one.', '絶縁体：満ちたバンドと空のバンドの間にギャップ $2|t_1 - t_2|$ があります。'], ['Metal: the bands touch at the zone edge, so electrons can be excited with arbitrarily little energy.', '金属：バンドがゾーン端で接しているので、いくらでも小さなエネルギーで電子を励起できます。']], v: eq ? 1 : 0, fixed: true },
        hint: ['Compare the top of the lower band with the bottom of the upper one.', '下のバンドの頂上と上のバンドの底を比べてください。'],
        sol: [[`The lower band tops out at $-|t_1 - t_2| = ${n(-Math.abs(t1 - t2))}$, the upper starts at $+${n(Math.abs(t1 - t2))}$.`, `下のバンドの頂上は $-|t_1 - t_2| = ${n(-Math.abs(t1 - t2))}$、上のバンドの底は $+${n(Math.abs(t1 - t2))}$ です。`], [eq ? 'Equal bonds: no gap, a half-filled single band, a metal. Peierls showed such a chain lowers its energy by dimerising, which opens the gap.' : 'A finite gap above a full band: an insulator (a semiconductor if the gap is small).', eq ? '結合が等しいのでギャップはなく、半分満ちた一本のバンドで金属です。パイエルスはこのような鎖が二量化してエネルギーを下げ、ギャップを開くことを示しました。' : '満ちたバンドの上に有限のギャップがあるので絶縁体です（ギャップが小さければ半導体）。']],
        set: { t1, t2, k: 1 },
      };
    },
  ];

  /* ---------- 2. Kronig-Penney (hbar^2/2m = 1, a = 1) ---------- */
  function kpF(E, V0, c) {
    const b = 1 - c; E = Math.max(E, 1e-10);
    const al = Math.sqrt(E);
    if (E < V0 - 1e-10) { const be = Math.sqrt(V0 - E); return Math.cos(al * b) * Math.cosh(be * c) + (be * be - al * al) / (2 * al * be) * Math.sin(al * b) * Math.sinh(be * c); }
    const ga = Math.max(1e-7, Math.sqrt(Math.max(0, E - V0)));
    return Math.cos(al * b) * Math.cos(ga * c) - (al * al + ga * ga) / (2 * al * ga) * Math.sin(al * b) * Math.sin(ga * c);
  }
  // band edges by scanning, refined by bisection on |f| = 1
  function edges(V0, c, Emax) {
    const g = (E) => Math.abs(kpF(E, V0, c)) - 1, out = [];
    let E0 = 0.001, g0 = g(E0);
    for (let E = 0.01; E <= Emax; E += 0.01) {
      const g1 = g(E);
      if (g0 * g1 < 0) { let a = E - 0.01, b = E, ga = g0; for (let k = 0; k < 50; k++) { const m = (a + b) / 2, gm = g(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } } out.push((a + b) / 2); }
      g0 = g1;
    }
    return out;   // alternating: band start, band end, ...
  }
  const kpSet = (V0, c, E) => ({ v0: V0, width: c, ...(E !== undefined && E >= 0.2 && E <= 45 ? { energy: E } : {}) });
  Q['kronig-penney'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.int(1, 2);
        return {
          q: [`With no barriers ($V_0 = 0$, $\\hbar^2/2m = 1$, $a = 1$), the electron is free, $E = k^2$. At what energy does it reach the ${m === 1 ? 'first' : 'second'} zone boundary, $ka = ${m}\\pi$?`, `障壁がなければ（$V_0 = 0$、$\\hbar^2/2m = 1$、$a = 1$）電子は自由で $E = k^2$ です。${m === 1 ? '第一' : '第二'}ゾーンの境界 $ka = ${m}\\pi$ に達するエネルギーはいくつですか。`],
          a: { type: 'num', v: (m * PI) ** 2, show: m === 1 ? '\\pi^2' : '4\\pi^2' },
          sol: [[`$E = (${m === 1 ? '' : m}\\pi)^2 = ${n((m * PI) ** 2, 4)}$.`, `$E = (${m === 1 ? '' : m}\\pi)^2 = ${n((m * PI) ** 2, 4)}$ です。`], ['These are exactly where gaps open once the barriers are switched on: Bragg reflection at the zone edges.', '障壁を入れるとちょうどここにギャップが開きます。ゾーン端でのブラッグ反射です。']],
          set: kpSet(0, 0.2, Math.round((m * PI) ** 2 * 10) / 10),
        };
      }
      if (form === 1) {
        const f = r.pick([-0.9, -0.5, -0.2, 0, 0.3, 0.5, 0.8, 0.95, 1.3, -1.6, 2.4, -1.15]);
        const ok = Math.abs(f) <= 1;
        return {
          q: [`At some energy the right-hand side of the Kronig-Penney equation is $f(E) = ${f}$. Is that energy allowed?`, `あるエネルギーでクローニッヒ・ペニーの式の右辺が $f(E) = ${f}$ になりました。そのエネルギーは許されますか。`],
          a: { type: 'choice', opts: [['Allowed: $\\cos ka = f(E)$ has a real solution $k$.', '許される：$\\cos ka = f(E)$ に実数解 $k$ があります。'], ['Forbidden: $|f| > 1$, so $k$ would have to be complex, a decaying wave.', '禁止：$|f| > 1$ なので $k$ は複素数となり、減衰する波です。']], v: ok ? 0 : 1, fixed: true },
          hint: ['The equation reads $\\cos ka = f(E)$.', '式は $\\cos ka = f(E)$ です。'],
          sol: [[`$|f| = ${Math.abs(f)}$ ${ok ? '$\\le 1$' : '$> 1$'}.`, `$|f| = ${Math.abs(f)}$ ${ok ? '$\\le 1$' : '$> 1$'} です。`], [ok ? `So $ka = \\arccos(${f}) = ${n(Math.acos(f) / PI, 4)}\\pi$: a Bloch wave that travels through the crystal.` : 'No real $\\cos ka$ can equal it: the energy lies in a gap, and no wave can propagate.', ok ? `よって $ka = \\arccos(${f}) = ${n(Math.acos(f) / PI, 4)}\\pi$ で、結晶中を伝わるブロッホ波です。` : 'どの実数の $\\cos ka$ もこの値にはなれません。このエネルギーはギャップ内で、波は伝われません。']],
        };
      }
      const f = r.pick([-0.95, -0.8, -0.5, -0.3, 0, 0.2, 0.5, 0.7, 0.9]);
      return {
        q: [`At energy $E$ the Kronig-Penney right-hand side is $f(E) = ${f}$. Find the Bloch wavevector $ka/\\pi$ between 0 and 1.`, `エネルギー $E$ でクローニッヒ・ペニーの右辺が $f(E) = ${f}$ です。0 と 1 の間のブロッホ波数 $ka/\\pi$ を求めてください。`],
        a: { type: 'num', v: Math.acos(f) / PI, tol: 0.002 },
        sol: [[`$ka = \\arccos(${f}) = ${n(Math.acos(f), 4)}$.`, `$ka = \\arccos(${f}) = ${n(Math.acos(f), 4)}$ です。`], [`$ka/\\pi = ${n(Math.acos(f) / PI, 4)}$. Near $f = \\pm1$ a small change in energy moves $k$ a lot: that is where the bands flatten at the zone centre and edge.`, `$ka/\\pi = ${n(Math.acos(f) / PI, 4)}$ です。$f = \\pm1$ の近くではエネルギーのわずかな変化で $k$ が大きく動きます。そこはバンドがゾーン中心や端で平らになる所です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const V0 = r.pick([5, 10, 15, 20, 25, 30, 40]), c = r.pick([0.1, 0.15, 0.2, 0.25, 0.3]);
      if (form === 0 || form === 1) {
        const E = r.pick([2, 4, 6, 8, 10, 12, 15, 18, 25, 30, 35]), f = kpF(E, V0, c);
        if (form === 0) {
          return {
            q: [`For barriers $V_0 = ${V0}$ of width $c = ${c}$ (well width $b = ${n(1 - c)}$), evaluate $f(E)$ at $E = ${E}$. Give three decimals.`, `高さ $V_0 = ${V0}$、幅 $c = ${c}$ の障壁（井戸の幅 $b = ${n(1 - c)}$）について、$E = ${E}$ での $f(E)$ を求めてください（小数第3位まで）。`],
            a: { type: 'num', v: f, tol: 0.002 },
            hint: [E < V0 ? 'Below the barrier top use $\\alpha = \\sqrt E$ and $\\beta = \\sqrt{V_0 - E}$ in the formula.' : 'Above the barrier $\\beta$ becomes imaginary: $\\cosh \\to \\cos$, $\\sinh \\to \\sin$ with $\\gamma = \\sqrt{E - V_0}$.', E < V0 ? '障壁の頂上より下では、式の $\\alpha = \\sqrt E$、$\\beta = \\sqrt{V_0 - E}$ を使います。' : '障壁より上では $\\beta$ が虚数になり、$\\gamma = \\sqrt{E - V_0}$ として $\\cosh \\to \\cos$、$\\sinh \\to \\sin$ となります。'],
            sol: E < V0 ? [[`$\\alpha = ${n(Math.sqrt(E), 4)}$, $\\beta = ${n(Math.sqrt(V0 - E), 4)}$.`, `$\\alpha = ${n(Math.sqrt(E), 4)}$、$\\beta = ${n(Math.sqrt(V0 - E), 4)}$ です。`], [`$f = \\cos(${n(Math.sqrt(E) * (1 - c), 4)})\\cosh(${n(Math.sqrt(V0 - E) * c, 4)}) + ${n((V0 - 2 * E) / (2 * Math.sqrt(E * (V0 - E))), 4)}\\sin(${n(Math.sqrt(E) * (1 - c), 4)})\\sinh(${n(Math.sqrt(V0 - E) * c, 4)}) = ${n(f, 4)}$.`, `$f = \\cos(${n(Math.sqrt(E) * (1 - c), 4)})\\cosh(${n(Math.sqrt(V0 - E) * c, 4)}) + ${n((V0 - 2 * E) / (2 * Math.sqrt(E * (V0 - E))), 4)}\\sin(${n(Math.sqrt(E) * (1 - c), 4)})\\sinh(${n(Math.sqrt(V0 - E) * c, 4)}) = ${n(f, 4)}$ です。`], [Math.abs(f) <= 1 ? `$|f| \\le 1$: this energy lies in a band.` : `$|f| > 1$: this energy lies in a gap.`, Math.abs(f) <= 1 ? '$|f| \\le 1$ なので、このエネルギーはバンドの中です。' : '$|f| > 1$ なので、このエネルギーはギャップの中です。']]
              : [[`$\\alpha = ${n(Math.sqrt(E), 4)}$, $\\gamma = ${n(Math.sqrt(E - V0), 4)}$.`, `$\\alpha = ${n(Math.sqrt(E), 4)}$、$\\gamma = ${n(Math.sqrt(E - V0), 4)}$ です。`], [`$f = \\cos\\alpha b\\cos\\gamma c - \\dfrac{\\alpha^2 + \\gamma^2}{2\\alpha\\gamma}\\sin\\alpha b\\sin\\gamma c = ${n(f, 4)}$.`, `$f = \\cos\\alpha b\\cos\\gamma c - \\dfrac{\\alpha^2 + \\gamma^2}{2\\alpha\\gamma}\\sin\\alpha b\\sin\\gamma c = ${n(f, 4)}$ です。`], [Math.abs(f) <= 1 ? '$|f| \\le 1$: allowed. Even above the barriers the lattice still reflects, so gaps persist there, only narrower.' : '$|f| > 1$: a gap, even though the electron is above the barriers: reflection off the lattice is a wave effect.', Math.abs(f) <= 1 ? '$|f| \\le 1$ なので許されます。障壁より上でも格子による反射は残るので、ギャップは狭くなりながらも存在します。' : '$|f| > 1$ でギャップです。電子が障壁より上にあっても、格子による反射は波の効果なので起こります。']],
            set: kpSet(V0, c, E),
          };
        }
        const ok = Math.abs(f) <= 1;
        return {
          q: [`Barriers $V_0 = ${V0}$, width $c = ${c}$. Is the energy $E = ${E}$ in a band or in a gap?`, `障壁 $V_0 = ${V0}$、幅 $c = ${c}$ です。エネルギー $E = ${E}$ はバンドの中ですか、ギャップの中ですか。`],
          a: { type: 'choice', opts: [['In a band', 'バンドの中'], ['In a gap', 'ギャップの中']], v: ok ? 0 : 1, fixed: true },
          hint: ['Evaluate $f(E)$ and compare its size with 1.', '$f(E)$ を計算し、その大きさを 1 と比べてください。'],
          sol: [[`$f(${E}) = ${n(f, 4)}$.`, `$f(${E}) = ${n(f, 4)}$ です。`], [ok ? `$|f| \\le 1$, so $ka = ${n(Math.acos(f) / PI, 3)}\\pi$: a band.` : '$|f| > 1$: a gap.', ok ? `$|f| \\le 1$ なので $ka = ${n(Math.acos(f) / PI, 3)}\\pi$ で、バンドの中です。` : '$|f| > 1$ なのでギャップの中です。']],
          set: kpSet(V0, c, E),
        };
      }
      const e = edges(V0, c, 30);
      return {
        q: [`For barriers $V_0 = ${V0}$ of width $c = ${c}$, where does the lowest band begin? Give two decimals.`, `高さ $V_0 = ${V0}$、幅 $c = ${c}$ の障壁で、最も低いバンドはどこから始まりますか（小数第2位まで）。`],
        a: { type: 'num', v: e[0], tol: 0.012 },
        hint: ['The band bottom is where $f(E)$ first comes down through $+1$.', 'バンドの底は $f(E)$ が初めて $+1$ を下に横切る所です。'],
        sol: [[`$f(0^+) > 1$, and solving $f(E) = 1$ numerically gives $E = ${n(e[0], 4)}$.`, `$f(0^+) > 1$ で、$f(E) = 1$ を数値的に解くと $E = ${n(e[0], 4)}$ です。`], [`The band runs up to $E = ${n(e[1], 4)}$, where $f = -1$. A free electron could have any energy from 0; the barriers push the lowest allowed energy up, like a particle in a box.`, `バンドは $f = -1$ となる $E = ${n(e[1], 4)}$ まで続きます。自由電子なら 0 から任意のエネルギーをとれますが、障壁は箱の中の粒子のように最低のエネルギーを押し上げます。`]],
        set: kpSet(V0, c, Math.round(e[0] * 10) / 10),
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V0 = r.pick([10, 15, 20, 30, 40, 50]), c = r.pick([0.1, 0.15, 0.2, 0.3]);
        const e = edges(V0, c, 45);
        const g = e[2] - e[1];
        return {
          q: [`For $V_0 = ${V0}$ and $c = ${c}$, how wide is the first gap, between the first and second bands? Give two decimals.`, `$V_0 = ${V0}$、$c = ${c}$ のとき、第一と第二のバンドの間の最初のギャップの幅はいくつですか（小数第2位まで）。`],
          a: { type: 'num', v: g, tol: 0.015 },
          hint: ['The first band ends where $f = -1$ and the second begins where $f$ comes back up to $-1$.', '第一バンドは $f = -1$ で終わり、第二バンドは $f$ が再び $-1$ に戻る所で始まります。'],
          sol: [[`Solving $f(E) = -1$: the first band ends at $E = ${n(e[1], 4)}$ and the second starts at $E = ${n(e[2], 4)}$.`, `$f(E) = -1$ を解くと、第一バンドは $E = ${n(e[1], 4)}$ で終わり、第二バンドは $E = ${n(e[2], 4)}$ で始まります。`], [`Gap $= ${n(g, 4)}$, around the free-electron zone-edge energy $\\pi^2 \\approx 9.87$.`, `ギャップは $${n(g, 4)}$ で、自由電子のゾーン端エネルギー $\\pi^2 \\approx 9.87$ の付近にあります。`], ['Raise $V_0$ and it widens: stronger scattering mixes the two zone-edge waves more.', '$V_0$ を上げると広がります。散乱が強いほどゾーン端の二つの波がより強く混ざるからです。']],
          set: kpSet(V0, c, Math.round((e[1] + e[2]) * 5) / 10),
        };
      }
      if (form === 1) {
        const V0 = r.pick([1, 2, 3, 4]), c = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]);
        const gNF = 2 * V0 * Math.sin(PI * c) / PI, e = edges(V0, c, 15), gx = e[2] - e[1];
        return {
          q: [`Weak barriers: $V_0 = ${V0}$, width $c = ${c}$. In nearly-free-electron theory the first gap is $2|V_1|$, where $V_1$ is the Fourier component of the potential at $G = 2\\pi$. Estimate the gap.`, `弱い障壁 $V_0 = ${V0}$、幅 $c = ${c}$ です。ほぼ自由な電子の理論では最初のギャップは $2|V_1|$ で、$V_1$ は $G = 2\\pi$ での位置エネルギーのフーリエ成分です。ギャップを見積もってください。`],
          a: { type: 'num', v: gNF, rel: 0.005 },
          hint: ['$V_1 = \\int_0^1 V(x)e^{-2\\pi ix}\\,dx$ over one period; only the barrier contributes.', '$V_1 = \\int_0^1 V(x)e^{-2\\pi ix}\\,dx$ を1周期で積分します。寄与するのは障壁だけです。'],
          sol: [[`A barrier of height $V_0$ and width $c$ gives $|V_1| = V_0\\,\\dfrac{\\sin\\pi c}{\\pi}$.`, `高さ $V_0$、幅 $c$ の障壁では $|V_1| = V_0\\,\\dfrac{\\sin\\pi c}{\\pi}$ です。`], [`Gap $\\approx 2 \\times ${V0} \\times \\sin(${c}\\pi)/\\pi = ${n(gNF, 4)}$.`, `ギャップは $2 \\times ${V0} \\times \\sin(${c}\\pi)/\\pi = ${n(gNF, 4)}$ 程度です。`], [`The exact equation gives $${n(gx, 4)}$: the perturbative estimate is good while $V_0$ is small compared with $\\pi^2$.`, `厳密な式では $${n(gx, 4)}$ で、$V_0$ が $\\pi^2$ に比べて小さい間は摂動による見積もりがよく合います。`]],
          set: kpSet(V0, c, 9.9),
        };
      }
      const Pp = r.pick([2, 3, 4, 5, 6, 8]);
      return {
        q: [`Shrink the barriers to delta functions, $c \\to 0$ with $V_0c = P = ${Pp}$ fixed. Write $f(E)$ as a function of $E$ (with $\\hbar^2/2m = 1$, $a = 1$).`, `障壁をデルタ関数に縮め、$V_0c = P = ${Pp}$ を保ったまま $c \\to 0$ とします。$f(E)$ を $E$ の式で表してください（$\\hbar^2/2m = 1$、$a = 1$）。`],
        a: { type: 'expr', v: `cos(sqrt(E))+${Pp}*sin(sqrt(E))/(2*sqrt(E))`, vars: ['E'], dom: { E: [0.5, 40] }, lhs: ['$f(E) =$', '$f(E) =$'] },
        hint: ['As $c \\to 0$: $\\cosh\\beta c \\to 1$, $\\beta^2\\sinh\\beta c/\\beta \\to V_0c$, and $b \\to 1$.', '$c \\to 0$ で $\\cosh\\beta c \\to 1$、$\\beta^2\\sinh\\beta c/\\beta \\to V_0c$、$b \\to 1$ です。'],
        sol: [['With $\\alpha = \\sqrt E$: $\\dfrac{\\beta^2 - \\alpha^2}{2\\alpha\\beta}\\sinh\\beta c \\to \\dfrac{\\beta^2 c}{2\\alpha} \\to \\dfrac{P}{2\\alpha}$.', '$\\alpha = \\sqrt E$ として $\\dfrac{\\beta^2 - \\alpha^2}{2\\alpha\\beta}\\sinh\\beta c \\to \\dfrac{\\beta^2 c}{2\\alpha} \\to \\dfrac{P}{2\\alpha}$ です。'], [`$f(E) = \\cos\\sqrt E + \\dfrac{${Pp}}{2}\\,\\dfrac{\\sin\\sqrt E}{\\sqrt E}$.`, `$f(E) = \\cos\\sqrt E + \\dfrac{${Pp}}{2}\\,\\dfrac{\\sin\\sqrt E}{\\sqrt E}$ です。`], ['The second term dies away as $E$ grows, so $|f|$ exceeds 1 only in ever narrower windows just above $E = (n\\pi)^2$: high bands are nearly free.', 'エネルギーが大きくなると第2項は小さくなるので、$|f|$ が 1 を超えるのは $E = (n\\pi)^2$ のすぐ上のますます狭い範囲だけです。高いバンドはほぼ自由です。']],
      };
    },
  ];

  /* ---------- 3. reciprocal lattice and Brillouin zones ---------- */
  const recip = (len, ang) => { const a1 = [1, 0], a2 = [len * Math.cos(ang * D), len * Math.sin(ang * D)], det = a1[0] * a2[1] - a1[1] * a2[0]; return { a2, det, b1: [TAU * a2[1] / det, -TAU * a2[0] / det], b2: [-TAU * a1[1] / det, TAU * a1[0] / det] }; };
  const LENS = [0.6, 0.8, 1, 1.2, 1.5], ANGS = [45, 60, 75, 90, 105, 120, 135];
  Q.brillouin = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const len = r.pick(LENS), ang = r.pick(ANGS), A = len * Math.sin(ang * D);
        return {
          q: [`The lattice has $\\mathbf a_1 = (1, 0)$ and $\\mathbf a_2$ of length $${len}$ at $${ang}^\\circ$ to it. What is the area of its first Brillouin zone?`, `格子は $\\mathbf a_1 = (1, 0)$ と、それと $${ang}^\\circ$ をなす長さ $${len}$ の $\\mathbf a_2$ でできています。第一ブリルアンゾーンの面積はいくつですか。`],
          a: { type: 'num', v: TAU * TAU / A, rel: 0.003 },
          hint: ['The zone has the area of a reciprocal unit cell, $(2\\pi)^2/|\\mathbf a_1 \\times \\mathbf a_2|$.', 'ゾーンの面積は逆格子の単位胞の面積 $(2\\pi)^2/|\\mathbf a_1 \\times \\mathbf a_2|$ です。'],
          sol: [[`$|\\mathbf a_1 \\times \\mathbf a_2| = ${len}\\sin ${ang}^\\circ = ${n(A, 4)}$.`, `$|\\mathbf a_1 \\times \\mathbf a_2| = ${len}\\sin ${ang}^\\circ = ${n(A, 4)}$ です。`], [`Area $= 39.478/${n(A, 4)} = ${n(TAU * TAU / A, 4)}$. A smaller real-space cell means a larger zone.`, `面積は $39.478/${n(A, 4)} = ${n(TAU * TAU / A, 4)}$ です。実空間の単位胞が小さいほどゾーンは大きくなります。`]],
          set: { len, ang },
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 0.5, 3, 4]);
        return {
          q: [`A square lattice has spacing $a = ${a}$. How long are its shortest reciprocal lattice vectors?`, `間隔 $a = ${a}$ の正方格子の最も短い逆格子ベクトルの長さはいくつですか。`],
          a: { type: 'num', v: TAU / a, show: a === 1 ? '2\\pi' : a === 2 ? '\\pi' : a === 0.5 ? '4\\pi' : `\\tfrac{2\\pi}{${a}}` },
          hint: ['$\\mathbf a_i\\cdot\\mathbf b_j = 2\\pi\\delta_{ij}$.', '$\\mathbf a_i\\cdot\\mathbf b_j = 2\\pi\\delta_{ij}$ です。'],
          sol: [[`For a square lattice $\\mathbf b_1 = (2\\pi/a)\\hat x$, so $|\\mathbf b_1| = 2\\pi/${a} = ${n(TAU / a, 4)}$.`, `正方格子では $\\mathbf b_1 = (2\\pi/a)\\hat x$ なので $|\\mathbf b_1| = 2\\pi/${a} = ${n(TAU / a, 4)}$ です。`], ['The first zone is a square of side $2\\pi/a$ centred on the origin.', '第一ゾーンは原点を中心とする一辺 $2\\pi/a$ の正方形です。']],
          set: a === 1 ? { len: 1, ang: 90 } : undefined,
        };
      }
      const zn = r.int(2, 8), len = r.pick(LENS), ang = r.pick(ANGS);
      return {
        q: [`For the lattice with $|\\mathbf a_2| = ${len}$ at $${ang}^\\circ$, what is the area of Brillouin zone ${zn} divided by the area of zone 1?`, `$|\\mathbf a_2| = ${len}$、角 $${ang}^\\circ$ の格子で、ブリルアンゾーン ${zn} の面積を第一ゾーンの面積で割るといくつですか。`],
        a: { type: 'num', v: 1 },
        hint: ['Each zone, translated piece by piece by reciprocal lattice vectors, tiles one reciprocal cell exactly.', 'どのゾーンも、逆格子ベクトルで一片ずつ平行移動すると、ちょうど一つの逆格子の単位胞を埋めます。'],
        sol: [['Every zone is a fundamental domain of the reciprocal lattice: its pieces fold back onto zone 1 without gaps or overlaps.', 'どのゾーンも逆格子の基本領域で、その断片は隙間も重なりもなく第一ゾーンに折り返されます。'], ['So the ratio is exactly 1, however fragmented the zone looks: the readout\'s "measured areas" check this.', 'よってゾーンがどれほど細かく割れて見えても比はちょうど 1 です。読み取り欄の「測定面積」がこれを確かめています。']],
        set: { len, ang, zones: zn },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const len = r.pick(LENS), ang = r.pick(ANGS), R = recip(len, ang);
        return {
          q: [`With $\\mathbf a_1 = (1, 0)$ and $\\mathbf a_2 = ${len}(\\cos ${ang}^\\circ, \\sin ${ang}^\\circ)$, find the reciprocal vector $\\mathbf b_1$ (the one with $\\mathbf a_1\\cdot\\mathbf b_1 = 2\\pi$, $\\mathbf a_2\\cdot\\mathbf b_1 = 0$).`, `$\\mathbf a_1 = (1, 0)$、$\\mathbf a_2 = ${len}(\\cos ${ang}^\\circ, \\sin ${ang}^\\circ)$ のとき、逆格子ベクトル $\\mathbf b_1$（$\\mathbf a_1\\cdot\\mathbf b_1 = 2\\pi$、$\\mathbf a_2\\cdot\\mathbf b_1 = 0$ を満たすもの）を求めてください。`],
          a: { type: 'tuple', v: R.b1, labels: ['$b_{1x}$', '$b_{1y}$'], tol: 0.004 },
          hint: ['$\\mathbf b_1$ is perpendicular to $\\mathbf a_2$; fix its length with $\\mathbf a_1\\cdot\\mathbf b_1 = 2\\pi$.', '$\\mathbf b_1$ は $\\mathbf a_2$ に垂直です。長さは $\\mathbf a_1\\cdot\\mathbf b_1 = 2\\pi$ で決めます。'],
          sol: [[`$\\mathbf a_2 = (${n(R.a2[0], 4)}, ${n(R.a2[1], 4)})$; a vector perpendicular to it is $(a_{2y}, -a_{2x})$.`, `$\\mathbf a_2 = (${n(R.a2[0], 4)}, ${n(R.a2[1], 4)})$ で、これに垂直なベクトルは $(a_{2y}, -a_{2x})$ です。`], [`$\\mathbf b_1 = \\dfrac{2\\pi}{a_{2y}}(a_{2y}, -a_{2x}) = (${n(R.b1[0], 4)}, ${n(R.b1[1], 4)})$.`, `$\\mathbf b_1 = \\dfrac{2\\pi}{a_{2y}}(a_{2y}, -a_{2x}) = (${n(R.b1[0], 4)}, ${n(R.b1[1], 4)})$ です。`], [`Its length $2\\pi/\\sin ${ang}^\\circ = ${n(Math.hypot(...R.b1), 4)}$ grows as the lattice is sheared: a squashed cell has a stretched reciprocal.`, `その長さ $2\\pi/\\sin ${ang}^\\circ = ${n(Math.hypot(...R.b1), 4)}$ は格子をずらすほど伸びます。押しつぶされた単位胞の逆格子は引き伸ばされます。`]],
          set: { len, ang },
        };
      }
      if (form === 1) {
        const len = r.pick(LENS), ang = r.pick(ANGS), R = recip(len, ang);
        return {
          q: [`For $\\mathbf a_1 = (1, 0)$, $|\\mathbf a_2| = ${len}$ at $${ang}^\\circ$, how long is $\\mathbf b_2$?`, `$\\mathbf a_1 = (1, 0)$、$|\\mathbf a_2| = ${len}$、角 $${ang}^\\circ$ のとき、$\\mathbf b_2$ の長さはいくつですか。`],
          a: { type: 'num', v: Math.hypot(...R.b2), rel: 0.003 },
          hint: ['$\\mathbf b_2 \\perp \\mathbf a_1$ and $\\mathbf a_2\\cdot\\mathbf b_2 = 2\\pi$.', '$\\mathbf b_2 \\perp \\mathbf a_1$ かつ $\\mathbf a_2\\cdot\\mathbf b_2 = 2\\pi$ です。'],
          sol: [['$\\mathbf b_2$ points along $\\hat y$, so $\\mathbf a_2\\cdot\\mathbf b_2 = |\\mathbf a_2|\\sin\\theta\\,|\\mathbf b_2| = 2\\pi$.', '$\\mathbf b_2$ は $\\hat y$ 方向なので $\\mathbf a_2\\cdot\\mathbf b_2 = |\\mathbf a_2|\\sin\\theta\\,|\\mathbf b_2| = 2\\pi$ です。'], [`$|\\mathbf b_2| = 2\\pi/(${len}\\sin ${ang}^\\circ) = ${n(Math.hypot(...R.b2), 4)}$.`, `$|\\mathbf b_2| = 2\\pi/(${len}\\sin ${ang}^\\circ) = ${n(Math.hypot(...R.b2), 4)}$ です。`], ['Longer $\\mathbf a_2$, shorter $\\mathbf b_2$: reciprocal space inverts real-space lengths.', '$\\mathbf a_2$ が長いほど $\\mathbf b_2$ は短くなります。逆空間は実空間の長さを反転させます。']],
          set: { len, ang },
        };
      }
      const L = r.pick([0.6, 0.75, 0.8, 1.2, 1.25, 1.5, 1.6]);
      const M = PI * Math.sqrt(1 + 1 / (L * L));
      return {
        q: [`A rectangular lattice has $\\mathbf a_1 = (1, 0)$, $\\mathbf a_2 = (0, ${L})$. How far is a corner of the first Brillouin zone from its centre?`, `長方格子 $\\mathbf a_1 = (1, 0)$、$\\mathbf a_2 = (0, ${L})$ の第一ブリルアンゾーンの角は、中心からどれだけ離れていますか。`],
        a: { type: 'num', v: M, rel: 0.003 },
        hint: ['The first zone is a rectangle with half-sides $\\pi/a_1$ and $\\pi/a_2$.', '第一ゾーンは半辺が $\\pi/a_1$ と $\\pi/a_2$ の長方形です。'],
        sol: [[`Corner at $(\\pi, \\pi/${L}) = (${n(PI, 4)}, ${n(PI / L, 4)})$.`, `角は $(\\pi, \\pi/${L}) = (${n(PI, 4)}, ${n(PI / L, 4)})$ にあります。`], [`Distance $\\pi\\sqrt{1 + 1/${n(L * L)}} = ${n(M, 4)}$.`, `距離は $\\pi\\sqrt{1 + 1/${n(L * L)}} = ${n(M, 4)}$ です。`], ['It is the point of the zone farthest from the centre; the nearest face is only $\\pi/' + (L > 1 ? L : 1) + '$ away, which is why a growing Fermi circle meets the faces first.', 'ゾーンの中で中心から最も遠い点です。最も近い面までは $\\pi/' + (L > 1 ? L : 1) + '$ しかないので、大きくなるフェルミ円はまず面に接します。']],
        set: { len: L, ang: 90 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const len = r.pick([1, 1.2, 1.5, 0.8]), X = Math.round(TAU * TAU / len / r.real(0.75, 0.97, 3) * 10) / 10;
        const s = TAU * TAU / (len * X), ang = Math.asin(s) / D;
        return {
          q: [`With $\\mathbf a_1 = (1, 0)$ and $|\\mathbf a_2| = ${len}$, at what angle below $90^\\circ$ between them is the first Brillouin zone's area exactly $${X}$? Give degrees to one decimal.`, `$\\mathbf a_1 = (1, 0)$、$|\\mathbf a_2| = ${len}$ のとき、二つのなす角が $90^\\circ$ より小さいどの角で第一ブリルアンゾーンの面積がちょうど $${X}$ になりますか（度、小数第1位まで）。`],
          a: { type: 'num', v: ang, tol: 0.06, unit: ['°', '°'] },
          hint: ['Invert the area formula for $\\sin\\theta$.', '面積の式を $\\sin\\theta$ について解いてください。'],
          sol: [[`$(2\\pi)^2/(${len}\\sin\\theta) = ${X}$ gives $\\sin\\theta = ${n(s, 4)}$.`, `$(2\\pi)^2/(${len}\\sin\\theta) = ${X}$ より $\\sin\\theta = ${n(s, 4)}$ です。`], [`$\\theta = ${n(ang, 3)}^\\circ$, or its supplement $${n(180 - ang, 3)}^\\circ$, which describes a mirror-image lattice with the same cell area.`, `$\\theta = ${n(ang, 3)}^\\circ$ です。補角の $${n(180 - ang, 3)}^\\circ$ でも、単位胞の面積が同じ鏡像の格子になります。`]],
          set: { len, ang: Math.round(ang) },
        };
      }
      if (form === 1) {
        const ask = r.int(0, 1), a = r.pick([1, 2, 0.5]);
        const v = ask ? 4 * PI / (3 * a) : 2 * PI / (Math.sqrt(3) * a);
        return {
          q: [ask ? `In the hexagonal lattice with spacing $a = ${a}$ (as in graphene), how far is a corner $K$ of the hexagonal first zone from its centre?` : `In the hexagonal lattice with spacing $a = ${a}$, how far is the midpoint $M$ of an edge of the first zone from its centre?`, ask ? `間隔 $a = ${a}$ の六方格子（グラフェンと同じ）で、六角形の第一ゾーンの角 $K$ は中心からどれだけ離れていますか。` : `間隔 $a = ${a}$ の六方格子で、第一ゾーンの辺の中点 $M$ は中心からどれだけ離れていますか。`],
          a: { type: 'num', v, rel: 0.003, show: ask ? (a === 1 ? '\\tfrac{4\\pi}{3}' : undefined) : (a === 1 ? '\\tfrac{2\\pi}{\\sqrt3}' : undefined) },
          hint: ['The shortest reciprocal vectors have length $4\\pi/(\\sqrt3 a)$; zone edges bisect them.', '最も短い逆格子ベクトルの長さは $4\\pi/(\\sqrt3 a)$ で、ゾーンの辺はそれを垂直に二等分します。'],
          sol: [[`$|\\mathbf b| = 2\\pi/(a\\sin 60^\\circ) = 4\\pi/(\\sqrt3\\cdot${a})$, so $|\\Gamma M| = |\\mathbf b|/2 = ${n(2 * PI / (Math.sqrt(3) * a), 4)}$.`, `$|\\mathbf b| = 2\\pi/(a\\sin 60^\\circ) = 4\\pi/(\\sqrt3\\cdot${a})$ なので $|\\Gamma M| = |\\mathbf b|/2 = ${n(2 * PI / (Math.sqrt(3) * a), 4)}$ です。`], ask ? [`The corner of a regular hexagon is $2/\\sqrt3$ times its apothem: $|\\Gamma K| = 4\\pi/(3\\cdot${a}) = ${n(v, 4)}$.`, `正六角形の角までの距離は辺心距離の $2/\\sqrt3$ 倍なので $|\\Gamma K| = 4\\pi/(3\\cdot${a}) = ${n(v, 4)}$ です。`] : ['That is the distance to the middle of each of the six faces.', 'これは六つの辺それぞれの中点までの距離です。'], [ask ? 'In graphene the conduction and valence bands touch exactly at $K$: the Dirac points.' : 'The six faces lie on the perpendicular bisectors of the six shortest reciprocal vectors.', ask ? 'グラフェンでは伝導帯と価電子帯がちょうど $K$ で接します。ディラック点です。' : '六つの辺は、最も短い六つの逆格子ベクトルの垂直二等分線上にあります。']],
          set: a === 1 ? { len: 1, ang: 60, zones: 1 } : undefined,
        };
      }
      // which zone contains k, square lattice a = 1
      const Gs = []; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) if (i || j) Gs.push([TAU * i, TAU * j]);
      let kx, ky;
      do { kx = r.pick([0.3, 0.6, 0.9, 1.1, 1.3, 1.6, 1.9]) * PI; ky = r.pick([0.1, 0.4, 0.7, 0.9, 1.2, 1.5]) * PI; } while (Gs.some(([gx, gy]) => Math.abs(2 * (kx * gx + ky * gy) - gx * gx - gy * gy) < 0.05));
      const crossed = Gs.filter(([gx, gy]) => 2 * (kx * gx + ky * gy) > gx * gx + gy * gy);
      const z = 1 + crossed.length;
      return {
        q: [`In the square lattice with $a = 1$, which Brillouin zone contains $\\mathbf k = (${n(kx / PI)}\\pi, ${n(ky / PI)}\\pi)$?`, `$a = 1$ の正方格子で、$\\mathbf k = (${n(kx / PI)}\\pi, ${n(ky / PI)}\\pi)$ はどのブリルアンゾーンに入りますか。`],
        a: { type: 'int', v: z },
        hint: ['Count the Bragg planes crossed on the way from the origin: those $\\mathbf G$ with $2\\mathbf k\\cdot\\mathbf G > |\\mathbf G|^2$.', '原点からの道で横切るブラッグ面を数えてください。$2\\mathbf k\\cdot\\mathbf G > |\\mathbf G|^2$ となる $\\mathbf G$ です。'],
        sol: [[`$\\mathbf k$ is closer to ${crossed.length} reciprocal lattice point${crossed.length === 1 ? '' : 's'} than to the origin: ${crossed.length ? crossed.map(([gx, gy]) => `(${gx / TAU}, ${gy / TAU})`).join(', ') + ' in units of $2\\pi$' : 'none'}.`, `$\\mathbf k$ は ${crossed.length} 個の逆格子点に原点より近くなっています${crossed.length ? `（$2\\pi$ を単位として ${crossed.map(([gx, gy]) => `(${gx / TAU}, ${gy / TAU})`).join('、')}）` : ''}。`], [`So it lies in zone $1 + ${crossed.length} = ${z}$: the origin is its ${z === 1 ? 'nearest' : `${z}${z % 10 === 2 && z !== 12 ? 'nd' : z % 10 === 3 && z !== 13 ? 'rd' : 'th'} nearest`} lattice point.`, `よって第 $1 + ${crossed.length} = ${z}$ ゾーンにあり、原点は ${z === 1 ? '最も近い' : `${z} 番目に近い`}格子点です。`]],
        set: { len: 1, ang: 90, zones: Math.min(8, Math.max(z, 2)) },
      };
    },
  ];
})();
