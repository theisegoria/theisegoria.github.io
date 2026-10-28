'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, frac } = P.util;
  const PI = Math.PI;

  // constants used by the figures: reduced-mass Rydberg energy, hc, Bohr magneton
  const RY = 13.598434, HC = 1239.841984, MUB = 5.7883818060e-5;
  const LET = 'spdfg';
  const orb = (nn, l) => `${nn}${LET[l]}`;
  const level = (k) => -RY / (k * k);
  const lam = (lo, up) => HC / (RY * (1 / (lo * lo) - 1 / (up * up)));
  const SER = [['Lyman', 'ライマン'], ['Balmer', 'バルマー'], ['Paschen', 'パッシェン'], ['Brackett', 'ブラケット'], ['Pfund', 'プント']];

  // associated Legendre P_l^m(x), m >= 0 (sign irrelevant for nodes)
  function legendreP(l, m, x) {
    let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x));
    for (let i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
    if (l === m) return pmm;
    let pm1 = x * (2 * m + 1) * pmm; if (l === m + 1) return pm1;
    let pl = 0; for (let ll = m + 2; ll <= l; ll++) { pl = ((2 * ll - 1) * x * pm1 - (ll + m - 1) * pmm) / (ll - m); pmm = pm1; pm1 = pl; }
    return pl;
  }
  function roots(fn, lo, hi, N = 4000) {
    const out = []; let x0 = lo, f0 = fn(lo);
    for (let i = 1; i <= N; i++) {
      const x1 = lo + (hi - lo) * i / N, f1 = fn(x1);
      if (f0 * f1 < 0) { let a = x0, b = x1, fa = f0; for (let k = 0; k < 60; k++) { const c = (a + b) / 2, fc = fn(c); if (fa * fc <= 0) b = c; else { a = c; fa = fc; } } out.push((a + b) / 2); }
      x0 = x1; f0 = f1;
    }
    return out;
  }

  /* ---------- 1. orbitals ---------- */
  Q['hydrogen-orbitals'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(1, 5), l = r.int(0, nn - 1);
        return {
          q: [`How many radial nodes (spherical nodal surfaces) does the hydrogen $${orb(nn, l)}$ orbital have?`, `水素の $${orb(nn, l)}$ 軌道には動径方向の節（球面の節）がいくつありますか。`],
          a: { type: 'int', v: nn - l - 1 },
          hint: ['There are $n - 1$ nodes in all, and $l$ of them are angular.', '節は全部で $n - 1$ 個あり、そのうち $l$ 個が角度方向の節です。'],
          sol: [[`For $${orb(nn, l)}$, $n = ${nn}$ and $l = ${l}$.`, `$${orb(nn, l)}$ では $n = ${nn}$、$l = ${l}$ です。`], [`Radial nodes $= n - l - 1 = ${nn} - ${l} - 1 = ${nn - l - 1}$.`, `動径方向の節の数は $n - l - 1 = ${nn} - ${l} - 1 = ${nn - l - 1}$ です。`], [nn - l - 1 === 0 ? 'None: the radial factor never changes sign, so the electron density only fades with distance.' : `Each one is a sphere on which $R_{nl}$ changes sign, so $r^2R^2$ has ${nn - l} separate humps.`, nn - l - 1 === 0 ? '動径因子は符号を変えないので、電子密度は距離とともに薄れるだけです。' : `それぞれが $R_{nl}$ の符号が変わる球面で、$r^2R^2$ には ${nn - l} 個の山があります。`]],
          set: { n: nn, l, m: 0 },
        };
      }
      if (form === 1) {
        const nn = r.int(2, 6), spin = r.chance(0.4);
        return {
          q: [spin ? `Counting both spin states, how many electron states share the hydrogen level $n = ${nn}$?` : `How many distinct orbitals $(l, m)$ share the hydrogen energy level $n = ${nn}$?`, spin ? `スピンの二つの状態も数えると、水素の準位 $n = ${nn}$ には電子の状態がいくつありますか。` : `水素のエネルギー準位 $n = ${nn}$ には異なる軌道 $(l, m)$ がいくつありますか。`],
          a: { type: 'int', v: (spin ? 2 : 1) * nn * nn },
          hint: ['For each $l$ from $0$ to $n - 1$ there are $2l + 1$ values of $m$.', '$l$ は $0$ から $n - 1$ まで、各 $l$ に $m$ が $2l + 1$ 個あります。'],
          sol: [[`$\\sum_{l=0}^{${nn - 1}} (2l + 1) = ${nn}^2 = ${nn * nn}$ orbitals.`, `$\\sum_{l=0}^{${nn - 1}} (2l + 1) = ${nn}^2 = ${nn * nn}$ 個の軌道です。`], spin ? [`Each holds two spin states, so $2n^2 = ${2 * nn * nn}$.`, `それぞれにスピンの状態が二つあるので $2n^2 = ${2 * nn * nn}$ です。`] : ['In hydrogen they all have the same energy, because the energy depends on $n$ alone.', '水素ではエネルギーが $n$ だけで決まるので、これらはすべて同じエネルギーです。']],
          set: nn <= 5 ? { n: nn } : undefined,
        };
      }
      const nn = r.int(2, 5), l = r.int(1, nn - 1), m = r.int(-l, l);
      const ask = r.int(0, 1);
      return {
        q: [ask ? `How many values can the magnetic number $m$ take when $l = ${l}$?` : `How many angular nodes (planes or cones through the nucleus) does an orbital with $n = ${nn}$, $l = ${l}$, $m = ${m}$ have?`, ask ? `$l = ${l}$ のとき、磁気量子数 $m$ はいくつの値をとれますか。` : `$n = ${nn}$、$l = ${l}$、$m = ${m}$ の軌道には角度方向の節（原子核を通る平面や円錐面）がいくつありますか。`],
        a: { type: 'int', v: ask ? 2 * l + 1 : l },
        hint: [ask ? '$m$ runs in integer steps from $-l$ to $+l$.' : 'The angular factor $Y_{lm}$ has exactly $l$ nodal surfaces, whatever $m$ is.', ask ? '$m$ は $-l$ から $+l$ まで整数おきです。' : '角度因子 $Y_{lm}$ は $m$ によらずちょうど $l$ 個の節面を持ちます。'],
        sol: ask ? [[`$m = -${l}, \\dots, ${l}$: that is $2l + 1 = ${2 * l + 1}$ values.`, `$m = -${l}, \\dots, ${l}$ なので $2l + 1 = ${2 * l + 1}$ 個です。`], ['They are the possible components of the angular momentum along $z$, in units of $\\hbar$.', 'これは角運動量の $z$ 成分として可能な値で、単位は $\\hbar$ です。']]
          : [[`The angular nodes number $l = ${l}$.`, `角度方向の節は $l = ${l}$ 個です。`], [`Of these, $|m| = ${Math.abs(m)}$ are planes containing the $z$ axis and $l - |m| = ${l - Math.abs(m)}$ are cones (or the plane $z = 0$) around it.`, `そのうち $|m| = ${Math.abs(m)}$ 個は $z$ 軸を含む平面、$l - |m| = ${l - Math.abs(m)}$ 個は $z$ 軸のまわりの円錐面（または平面 $z = 0$）です。`]],
        set: ask ? undefined : { n: nn, l, m },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(1, 5), l = r.int(0, nn - 1), mr = (3 * nn * nn - l * (l + 1)) / 2;
        return {
          q: [`Find the mean distance $\\langle r\\rangle$ of the electron from the nucleus in the $${orb(nn, l)}$ state, in Bohr radii.`, `$${orb(nn, l)}$ 状態の電子と原子核との平均距離 $\\langle r\\rangle$ をボーア半径の単位で求めてください。`],
          a: { type: 'num', v: mr, unit: ['$a_0$', '$a_0$'] },
          hint: ['$\\langle r\\rangle = \\tfrac12\\left(3n^2 - l(l+1)\\right)a_0$.', '$\\langle r\\rangle = \\tfrac12\\left(3n^2 - l(l+1)\\right)a_0$ です。'],
          sol: [[`$\\langle r\\rangle = \\tfrac12(3\\cdot${nn * nn} - ${l}\\cdot${l + 1}) = \\tfrac12(${3 * nn * nn} - ${l * (l + 1)}) = ${n(mr)}\\,a_0$.`, `$\\langle r\\rangle = \\tfrac12(3\\cdot${nn * nn} - ${l}\\cdot${l + 1}) = \\tfrac12(${3 * nn * nn} - ${l * (l + 1)}) = ${n(mr)}\\,a_0$ です。`], [`The size grows like $n^2$; at fixed $n$, larger $l$ pulls the electron slightly inward${l === 0 ? ', so $s$ states are the most spread out' : ''}.`, `大きさは $n^2$ に比例して増え、$n$ が同じなら $l$ が大きいほどわずかに内側に寄ります${l === 0 ? '。$s$ 状態がいちばん広がっています' : ''}。`]],
          set: { n: nn, l, m: 0 },
        };
      }
      if (form === 1) {
        const nn = r.int(1, 5), ion = r.chance(0.5);
        const E = level(nn);
        return {
          q: [ion ? `How much energy (in eV) does it take to ionise hydrogen from the level $n = ${nn}$?` : `What is the energy $E_n$ of the hydrogen level $n = ${nn}$, in eV?`, ion ? `水素を準位 $n = ${nn}$ から電離するのに必要なエネルギーは何 eV ですか。` : `水素の準位 $n = ${nn}$ のエネルギー $E_n$ は何 eV ですか。`],
          a: { type: 'num', v: ion ? -E : E, unit: ['eV', 'eV'] },
          hint: ['$E_n = -13.598\\ \\text{eV}/n^2$, measured from the free electron at rest.', '$E_n = -13.598\\ \\text{eV}/n^2$ で、静止した自由電子を基準にします。'],
          sol: [[`$E_{${nn}} = -13.598/${nn * nn} = ${n(E, 4)}$ eV.`, `$E_{${nn}} = -13.598/${nn * nn} = ${n(E, 4)}$ eV です。`], ion ? [`Ionising lifts the electron to $E = 0$, so it costs $${n(-E, 4)}$ eV.`, `電離は電子を $E = 0$ まで持ち上げることなので、$${n(-E, 4)}$ eV 必要です。`] : ['It does not depend on $l$ or $m$: every orbital with this $n$ has this energy.', '$l$ や $m$ にはよらず、この $n$ の軌道はすべてこのエネルギーです。']],
          set: { n: nn },
        };
      }
      const nn = r.int(1, 5);
      return {
        q: [`For the nodeless orbital $${orb(nn, nn - 1)}$ ($l = n - 1$), $r^2R^2 \\propto r^{${2 * nn}}e^{-2r/${nn}}$. At what radius (in $a_0$) is the electron most likely to be found?`, `節のない軌道 $${orb(nn, nn - 1)}$（$l = n - 1$）では $r^2R^2 \\propto r^{${2 * nn}}e^{-2r/${nn}}$ です。電子が最も見いだされやすい半径は何 $a_0$ ですか。`],
        a: { type: 'num', v: nn * nn, unit: ['$a_0$', '$a_0$'] },
        hint: ['Set the derivative of the logarithm to zero.', '対数の導関数を 0 とおいてください。'],
        sol: [[`$\\dfrac{d}{dr}\\left(${2 * nn}\\ln r - \\tfrac{2r}{${nn}}\\right) = \\dfrac{${2 * nn}}{r} - \\dfrac{2}{${nn}} = 0$.`, `$\\dfrac{d}{dr}\\left(${2 * nn}\\ln r - \\tfrac{2r}{${nn}}\\right) = \\dfrac{${2 * nn}}{r} - \\dfrac{2}{${nn}} = 0$ です。`], [`So $r = n^2 = ${nn * nn}\\,a_0$: the Bohr orbit radius of level ${nn}.`, `よって $r = n^2 = ${nn * nn}\\,a_0$ で、準位 ${nn} のボーア軌道の半径と一致します。`], [`The mean $\\langle r\\rangle = ${n((3 * nn * nn - nn * (nn - 1)) / 2)}$ is a little larger, because the distribution has a long tail outward.`, `平均 $\\langle r\\rangle = ${n((3 * nn * nn - nn * (nn - 1)) / 2)}$ が少し大きいのは、分布が外側に長い裾を引くからです。`]],
        set: { n: nn, l: nn - 1, m: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.int(2, 5), l = nn - 2, rn = nn * (nn - 1);
        return {
          q: [`The $${orb(nn, l)}$ radial function is $R \\propto \\rho^{${l}}e^{-\\rho/2}L_1^{(${2 * l + 1})}(\\rho)$ with $\\rho = 2r/${nn}$ and $L_1^{(\\alpha)}(\\rho) = 1 + \\alpha - \\rho$. Where (in $a_0$) is its radial node?`, `$${orb(nn, l)}$ の動径関数は $R \\propto \\rho^{${l}}e^{-\\rho/2}L_1^{(${2 * l + 1})}(\\rho)$、$\\rho = 2r/${nn}$、$L_1^{(\\alpha)}(\\rho) = 1 + \\alpha - \\rho$ です。動径方向の節は何 $a_0$ の位置にありますか。`],
          a: { type: 'num', v: rn, unit: ['$a_0$', '$a_0$'] },
          hint: ['Only the Laguerre factor can vanish at $r > 0$.', '$r > 0$ で 0 になれるのはラゲール因子だけです。'],
          sol: [[`$L_1^{(${2 * l + 1})}(\\rho) = ${2 * l + 2} - \\rho = 0$ gives $\\rho = ${2 * l + 2}$.`, `$L_1^{(${2 * l + 1})}(\\rho) = ${2 * l + 2} - \\rho = 0$ より $\\rho = ${2 * l + 2}$ です。`], [`$r = ${nn}\\rho/2 = ${rn}\\,a_0$.`, `$r = ${nn}\\rho/2 = ${rn}\\,a_0$ です。`], [`In general this node sits at $r = n(n - 1)a_0$: a sphere separating an inner lobe from the main outer one, visible as the dashed circle in the slice.`, `一般にこの節は $r = n(n - 1)a_0$ にあり、内側の小さな部分と外側の主要部分を分ける球面です。断面図では点線の円として見えます。`]],
          set: { n: nn, l, m: 0 },
        };
      }
      if (form === 1) {
        const opts = [[2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [4, 2]];
        const [l, m] = r.pick(opts), nn = r.int(l + 1, 5);
        const th = roots((t) => legendreP(l, m, Math.cos(t)), 1e-6, PI / 2 - 1e-4).map((t) => t * 180 / PI);
        const first = th[0];
        const poly = { '2,0': '3\\cos^2\\theta - 1', '3,0': '5\\cos^3\\theta - 3\\cos\\theta', '3,1': '(5\\cos^2\\theta - 1)\\sin\\theta', '4,0': '35\\cos^4\\theta - 30\\cos^2\\theta + 3', '4,1': '(7\\cos^3\\theta - 3\\cos\\theta)\\sin\\theta', '4,2': '(7\\cos^2\\theta - 1)\\sin^2\\theta' }[`${l},${m}`];
        return {
          q: [`The orbital $n = ${nn}$, $l = ${l}$, $m = ${m}$ has polar factor $\\propto ${poly}$. At what angle $\\theta$ from the $+z$ axis is the nodal cone nearest that axis? Give degrees to one decimal.`, `軌道 $n = ${nn}$、$l = ${l}$、$m = ${m}$ の極角因子は $\\propto ${poly}$ です。$+z$ 軸にいちばん近い節の円錐は、軸から何度の角 $\\theta$ にありますか（度、小数第1位まで）。`],
          a: { type: 'num', v: first, tol: 0.06, unit: ['°', '°'] },
          hint: ['Solve for $x = \\cos\\theta$ and take the largest root below 1.', '$x = \\cos\\theta$ について解き、1 より小さい最大の根をとってください。'],
          sol: [[`Zeros away from the axis come from the polynomial in $x = \\cos\\theta$${m ? ' (the $\\sin\\theta$ factor only vanishes on the axis itself)' : ''}.`, `軸以外の零点は $x = \\cos\\theta$ の多項式から生じます${m ? '（$\\sin\\theta$ の因子は軸上でしか 0 になりません）' : ''}。`], [`Its largest root is $x = ${n(Math.cos(first * PI / 180), 4)}$, so $\\theta = \\arccos ${n(Math.cos(first * PI / 180), 4)} = ${n(first, 2)}^\\circ$.`, `最大の根は $x = ${n(Math.cos(first * PI / 180), 4)}$ なので $\\theta = \\arccos ${n(Math.cos(first * PI / 180), 4)} = ${n(first, 2)}^\\circ$ です。`], [`With its mirror cone at $${n(180 - first, 2)}^\\circ$${th.length > 1 || (l - m) % 2 ? ' and the other roots' : ''} these make up the $l - |m| = ${l - m}$ polar nodes; ${m ? `the remaining $${m}$ ${m > 1 ? 'are planes' : 'is a plane'} through the $z$ axis.` : 'with $m = 0$ there are no nodal planes through the axis.'}`, `$${n(180 - first, 2)}^\\circ$ にある鏡像の円錐${th.length > 1 || (l - m) % 2 ? 'や他の根' : ''}とあわせて $l - |m| = ${l - m}$ 個の極角方向の節になります。${m ? `残りの $${m}$ 個は $z$ 軸を含む平面です。` : '$m = 0$ なので軸を含む節面はありません。'}`]],
          set: { n: nn, l, m, phi: 0 },
        };
      }
      const pick = r.pick([[1, 0], [2, 0], [2, 1], [3, 2]]);
      const [nn, l] = pick;
      const spec = {
        '1,0': { R: '2e^{-r}', P: '4*r^2*exp(-2*r)', Pt: '4r^2e^{-2r}' },
        '2,0': { R: '\\tfrac{1}{2\\sqrt2}(2 - r)e^{-r/2}', P: 'r^2*(2-r)^2*exp(-r)/8', Pt: '\\tfrac18 r^2(2 - r)^2e^{-r}' },
        '2,1': { R: '\\tfrac{1}{2\\sqrt6}\\,r\\,e^{-r/2}', P: 'r^4*exp(-r)/24', Pt: '\\tfrac1{24}r^4e^{-r}' },
        '3,2': { R: '\\tfrac{4}{81\\sqrt{30}}\\,r^2e^{-r/3}', P: '16*r^6*exp(-2*r/3)/196830', Pt: '\\tfrac{16}{196830}r^6e^{-2r/3}' },
      }[`${nn},${l}`];
      return {
        q: [`The normalised radial function of $${orb(nn, l)}$ is $R(r) = ${spec.R}$ ($r$ in $a_0$). Write the radial probability density $P(r)$, the probability per unit radius.`, `$${orb(nn, l)}$ の規格化された動径関数は $R(r) = ${spec.R}$ です（$r$ の単位は $a_0$）。単位半径あたりの確率である動径確率密度 $P(r)$ を式で書いてください。`],
        a: { type: 'expr', v: spec.P, vars: ['r'], dom: { r: [0.3, 6] }, lhs: ['$P(r) =$', '$P(r) =$'] },
        hint: ['A shell of radius $r$ and thickness $dr$ has volume $4\\pi r^2\\,dr$, and the angular factor integrates to 1.', '半径 $r$、厚さ $dr$ の殻の体積は $4\\pi r^2\\,dr$ で、角度因子の積分は 1 になります。'],
        sol: [[`The probability of a shell is $|R|^2|Y|^2$ integrated over angles times $r^2\\,dr$; with $\\int|Y|^2\\,d\\Omega = 1$ this is $r^2R^2\\,dr$.`, `殻にいる確率は $|R|^2|Y|^2$ を角度で積分して $r^2\\,dr$ を掛けたもので、$\\int|Y|^2\\,d\\Omega = 1$ より $r^2R^2\\,dr$ です。`], [`$P(r) = r^2R^2 = ${spec.Pt}$.`, `$P(r) = r^2R^2 = ${spec.Pt}$ です。`], [l === 0 && nn === 2 ? 'It vanishes at $r = 2$, the radial node, and has a small inner hump before the main one: exactly the solid curve on the right.' : `It has a single hump, peaking at $r = n^2 = ${nn * nn}$: this is the solid curve plotted on the right.`, l === 0 && nn === 2 ? '$r = 2$ の動径方向の節で 0 になり、主要な山の手前に小さな山があります。右の実線がまさにこれです。' : `山は一つで、$r = n^2 = ${nn * nn}$ で最大になります。右に描いた実線がこれです。`]],
        set: { n: nn, l, m: 0 },
      };
    },
  ];

  /* ---------- 2. spectral series ---------- */
  Q['spectral-lines'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lo = r.int(1, 3), up = r.int(lo + 1, lo + 4), E = level(up) - level(lo);
        return {
          q: [`An electron in hydrogen drops from $n = ${up}$ to $n = ${lo}$. What energy (in eV) does the photon carry?`, `水素の電子が $n = ${up}$ から $n = ${lo}$ に落ちます。放出される光子のエネルギーは何 eV ですか。`],
          a: { type: 'num', v: E, unit: ['eV', 'eV'] },
          hint: ['The photon carries the difference $E_{n_u} - E_{n_\\ell}$ with $E_n = -13.598/n^2$ eV.', '光子は $E_n = -13.598/n^2$ eV の差 $E_{n_u} - E_{n_\\ell}$ を運びます。'],
          sol: [[`$E = 13.598\\left(\\tfrac1{${lo * lo}} - \\tfrac1{${up * up}}\\right) = ${n(E, 4)}$ eV.`, `$E = 13.598\\left(\\tfrac1{${lo * lo}} - \\tfrac1{${up * up}}\\right) = ${n(E, 4)}$ eV です。`], [`This is a line of the ${SER[lo - 1][0]} series, which ends on $n = ${lo}$.`, `これは $n = ${lo}$ で終わる${SER[lo - 1][1]}系列の線です。`]],
          set: { nl: lo, nu: up },
        };
      }
      if (form === 1) {
        const lo = r.int(1, 4);
        return {
          q: [`Lines that end on $n = ${lo}$ form which series of hydrogen?`, `$n = ${lo}$ で終わる線は水素のどの系列をなしますか。`],
          a: { type: 'choice', opts: SER.slice(0, 5).map(([e, j]) => [e, j + '系列']), v: lo - 1, fixed: true },
          hint: ['Lyman ends on the ground state; the series are named in order of the lower level.', 'ライマン系列は基底状態で終わり、系列は下の準位の順に名前がついています。'],
          sol: [[`The lower level $n_\\ell = ${lo}$ names the series: ${SER[lo - 1][0]}.`, `下の準位 $n_\\ell = ${lo}$ が系列を決めます。${SER[lo - 1][1]}系列です。`], [lo === 1 ? 'All of it lies in the ultraviolet, because even the smallest jump to $n = 1$ is $10.2$ eV.' : lo === 2 ? 'Its first lines are visible, which is why it was found first.' : 'It lies in the infrared: the gaps between high levels are small.', lo === 1 ? '$n = 1$ への最小の遷移でも $10.2$ eV あるので、すべて紫外にあります。' : lo === 2 ? '最初のいくつかの線が可視なので、最初に見つかった系列です。' : '高い準位どうしの間隔は小さいので、赤外にあります。']],
          set: { nl: lo, nu: lo + 1 },
        };
      }
      const up = r.int(2, 8);
      const E = -level(up);
      return {
        q: [`An electron sits in the hydrogen level $n = ${up}$. What is the longest wavelength (in nm) a photon can have and still free it?`, `電子が水素の準位 $n = ${up}$ にあります。電子を自由にするために光子が持つべき最も長い波長は何 nm ですか。`],
        a: { type: 'num', v: HC / E, unit: ['nm', 'nm'] },
        hint: ['The photon must supply at least the ionisation energy $13.598/n^2$ eV; $\\lambda = hc/E$ with $hc = 1239.84$ eV nm.', '光子は少なくとも電離エネルギー $13.598/n^2$ eV を与えなければなりません。$\\lambda = hc/E$、$hc = 1239.84$ eV nm です。'],
        sol: [[`Ionisation energy $= 13.598/${up * up} = ${n(E, 4)}$ eV.`, `電離エネルギーは $13.598/${up * up} = ${n(E, 4)}$ eV です。`], [`$\\lambda = 1239.84/${n(E, 4)} = ${n(HC / E, 4)}$ nm. Any longer wavelength carries too little energy.`, `$\\lambda = 1239.84/${n(E, 4)} = ${n(HC / E, 4)}$ nm で、これより長い波長ではエネルギーが足りません。`], [up <= 5 ? `This is the limit of the series ending on $n = ${up}$, the dashed line in the spectrum.` : 'It is also the limit wavelength of the series that ends on this level.', up <= 5 ? `これは $n = ${up}$ で終わる系列の極限で、スペクトル図の点線です。` : 'これはこの準位で終わる系列の極限の波長でもあります。']],
        set: up <= 5 ? { nl: up, nu: 12 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const lo = r.int(1, 4), up = r.int(lo + 1, Math.min(12, lo + 6)), L0 = lam(lo, up);
        return {
          q: [`Find the vacuum wavelength of the hydrogen line $n = ${up} \\to ${lo}$, in nm.`, `水素の線 $n = ${up} \\to ${lo}$ の真空中の波長を nm で求めてください。`],
          a: { type: 'num', v: L0, rel: 0.002, unit: ['nm', 'nm'] },
          hint: ['Find the photon energy, then use $\\lambda = 1239.84\\ \\text{eV nm}/E$.', '光子のエネルギーを求め、$\\lambda = 1239.84\\ \\text{eV nm}/E$ を使ってください。'],
          sol: [[`$E = 13.598\\left(\\tfrac1{${lo * lo}} - \\tfrac1{${up * up}}\\right) = ${n(HC / L0, 4)}$ eV.`, `$E = 13.598\\left(\\tfrac1{${lo * lo}} - \\tfrac1{${up * up}}\\right) = ${n(HC / L0, 4)}$ eV です。`], [`$\\lambda = 1239.84/${n(HC / L0, 4)} = ${n(L0, 4)}$ nm.`, `$\\lambda = 1239.84/${n(HC / L0, 4)} = ${n(L0, 4)}$ nm です。`], [L0 < 380 ? 'That is ultraviolet.' : L0 <= 750 ? 'That is visible light.' : 'That is infrared.', L0 < 380 ? '紫外です。' : L0 <= 750 ? '可視光です。' : '赤外です。']],
          set: { nl: lo, nu: up },
        };
      }
      const lo = r.int(1, 3), up = r.int(lo + 2, lo + 5), up2 = lo + 1;
      const ratio = lam(lo, up2) / lam(lo, up);
      const num = (1 / (lo * lo) - 1 / (up * up)), den = (1 / (lo * lo) - 1 / (up2 * up2));
      return {
        q: [`In the ${SER[lo - 1][0]} series, what is the ratio $\\lambda_{${up2}\\to${lo}}/\\lambda_{${up}\\to${lo}}$ of the first line's wavelength to that of the line from $n = ${up}$?`, `${SER[lo - 1][1]}系列で、最初の線の波長と $n = ${up}$ からの線の波長の比 $\\lambda_{${up2}\\to${lo}}/\\lambda_{${up}\\to${lo}}$ を求めてください。`],
        a: { type: 'num', v: ratio, show: frac(Math.round(num * lo * lo * up * up * up2 * up2), Math.round(den * lo * lo * up * up * up2 * up2)) },
        hint: ['Wavelength is inversely proportional to $1/n_\\ell^2 - 1/n_u^2$, and the Rydberg constant cancels.', '波長は $1/n_\\ell^2 - 1/n_u^2$ に反比例し、リュードベリ定数は打ち消し合います。'],
        sol: [[`$\\dfrac{\\lambda_{${up2}\\to${lo}}}{\\lambda_{${up}\\to${lo}}} = \\dfrac{1/${lo * lo} - 1/${up * up}}{1/${lo * lo} - 1/${up2 * up2}}$.`, `$\\dfrac{\\lambda_{${up2}\\to${lo}}}{\\lambda_{${up}\\to${lo}}} = \\dfrac{1/${lo * lo} - 1/${up * up}}{1/${lo * lo} - 1/${up2 * up2}}$ です。`], [`$= ${n(num, 5)}/${n(den, 5)} = ${n(ratio, 4)}$.`, `$= ${n(num, 5)}/${n(den, 5)} = ${n(ratio, 4)}$ です。`], ['A ratio of measured wavelengths needs no constants at all, which is how Balmer found his formula from four lines.', '測定した波長の比には定数がまったく要りません。バルマーが4本の線から公式を見つけたのはこのためです。']],
        set: { nl: lo, nu: up },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lo = r.int(1, 4), lim = HC * lo * lo / RY;
        return {
          q: [`Write the vacuum wavelength $\\lambda(n)$ (in nm) of the line $n \\to ${lo}$ as a function of the upper level $n$.`, `線 $n \\to ${lo}$ の真空中の波長 $\\lambda(n)$（nm）を上の準位 $n$ の式で表してください。`],
          a: { type: 'expr', v: `${n(lim, 6)}*n^2/(n^2-${lo * lo})`, vars: ['n'], dom: { n: [lo + 1, lo + 12] }, lhs: ['$\\lambda(n) =$', '$\\lambda(n) =$'] },
          hint: ['Put the two fractions over a common denominator; the series limit $hc\\,n_\\ell^2/13.598$ appears as a factor.', '二つの分数を通分すると、系列の極限 $hc\\,n_\\ell^2/13.598$ が因子として現れます。'],
          sol: [[`$\\dfrac{1}{\\lambda} = \\dfrac{13.598}{1239.84}\\cdot\\dfrac{n^2 - ${lo * lo}}{${lo * lo}n^2}$.`, `$\\dfrac{1}{\\lambda} = \\dfrac{13.598}{1239.84}\\cdot\\dfrac{n^2 - ${lo * lo}}{${lo * lo}n^2}$ です。`], [`$\\lambda(n) = ${n(lim, 5)}\\,\\dfrac{n^2}{n^2 - ${lo * lo}}$ nm.`, `$\\lambda(n) = ${n(lim, 5)}\\,\\dfrac{n^2}{n^2 - ${lo * lo}}$ nm です。`], [`As $n \\to \\infty$ the fraction tends to 1, so the lines pile up at the series limit $${n(lim, 5)}$ nm from the long-wavelength side.`, `$n \\to \\infty$ で分数は 1 に近づくので、線は長波長側から系列の極限 $${n(lim, 5)}$ nm に集まります。`]],
          set: { nl: lo, nu: Math.min(12, lo + 6) },
        };
      }
      if (form === 1) {
        const up = r.int(3, 8);
        return {
          q: [`A gas of hydrogen atoms is excited to $n = ${up}$ and left to cascade down by every possible route. How many distinct spectral lines can appear?`, `水素原子の気体を $n = ${up}$ に励起し、あらゆる経路で下の準位に落ちるにまかせます。異なるスペクトル線は何本現れ得ますか。`],
          a: { type: 'int', v: up * (up - 1) / 2 },
          hint: ['Each line is one pair of levels among $1, \\dots, n$.', '線の一本一本は $1, \\dots, n$ の準位の組一つに対応します。'],
          sol: [[`Any pair $n_u > n_\\ell$ from the ${up} levels gives a line, and in hydrogen no two pairs give the same wavelength.`, `${up} 個の準位から $n_u > n_\\ell$ の組を選ぶごとに線が一本でき、水素では異なる組が同じ波長になることはありません。`], [`$\\binom{${up}}{2} = ${up}\\cdot${up - 1}/2 = ${up * (up - 1) / 2}$.`, `$\\binom{${up}}{2} = ${up}\\cdot${up - 1}/2 = ${up * (up - 1) / 2}$ です。`], ['These spread over several series at once: a single excited sample shows Lyman, Balmer and beyond together.', 'これらは複数の系列にまたがります。一つの励起した試料からライマン系列もバルマー系列もそれより先も同時に見えます。']],
        };
      }
      const cand = [[2, 3], [2, 4], [2, 5], [2, 6], [1, 2], [1, 3], [3, 4], [3, 5], [4, 5]];
      const [lo, up] = r.pick(cand), L0 = lam(lo, up);
      return {
        q: [`A hydrogen line is observed at $${n(L0, 5)}$ nm (vacuum). Identify the transition: give the upper and lower levels.`, `水素の線が $${n(L0, 5)}$ nm（真空中）に観測されました。遷移を特定し、上の準位と下の準位を答えてください。`],
        a: { type: 'tuple', v: [up, lo], labels: ['$n_u$', '$n_\\ell$'], tol: 0.01 },
        hint: ['Convert to energy, then compare with $13.598(1/n_\\ell^2 - 1/n_u^2)$; the region narrows the series.', 'エネルギーに直して $13.598(1/n_\\ell^2 - 1/n_u^2)$ と比べてください。波長の領域から系列が絞れます。'],
        sol: [[`$E = 1239.84/${n(L0, 5)} = ${n(HC / L0, 4)}$ eV.`, `$E = 1239.84/${n(L0, 5)} = ${n(HC / L0, 4)}$ eV です。`], [`$13.598(1/${lo * lo} - 1/${up * up}) = ${n(HC / L0, 4)}$ eV matches, and no other pair does.`, `$13.598(1/${lo * lo} - 1/${up * up}) = ${n(HC / L0, 4)}$ eV が一致し、他の組は一致しません。`], [`So the line is $${up} \\to ${lo}$, in the ${SER[lo - 1][0]} series.`, `よってこの線は${SER[lo - 1][1]}系列の $${up} \\to ${lo}$ です。`]],
        set: { nl: lo, nu: up },
      };
    },
  ];
  /* ---------- 3. Zeeman effect ---------- */
  const lande = (L, S, J) => 1 + (J * (J + 1) + S * (S + 1) - L * (L + 1)) / (2 * J * (J + 1));
  const NA = { D1: { lam: 589.7558, gu: 2 / 3, Ju: 0.5 }, D2: { lam: 589.1583, gu: 4 / 3, Ju: 1.5 } };
  const half = (x) => (Number.isInteger(x) ? String(x) : `${x < 0 ? '-' : ''}\\tfrac{${Math.round(Math.abs(x) * 2)}}{2}`);
  const fr3 = (x) => frac(Math.round(x * 3), 3);
  const TERMS = [[0, 0.5, 0.5, '^2S_{1/2}'], [1, 0.5, 0.5, '^2P_{1/2}'], [1, 0.5, 1.5, '^2P_{3/2}'], [2, 0.5, 1.5, '^2D_{3/2}'], [2, 0.5, 2.5, '^2D_{5/2}'], [1, 1, 2, '^3P_2'], [1, 1, 1, '^3P_1'], [2, 1, 3, '^3D_3'], [0, 1, 1, '^3S_1'], [3, 0.5, 3.5, '^2F_{7/2}'], [2, 2, 2, '^5D_2']];
  const gFrac = (L, S, J) => { const num = 2 * J * (J + 1) + J * (J + 1) + S * (S + 1) - L * (L + 1), den = 2 * J * (J + 1); return frac(Math.round(num * 4), Math.round(den * 4)); };

  Q.zeeman = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick(TERMS.slice(0, 3));
        const g = lande(t[0], t[1], t[2]);
        return {
          q: [`What is the Landé factor $g_J$ of the sodium level $${t[0] ? '3p' : '3s'}\\,${t[3]}$? ($g_J = 1 + \\frac{J(J+1) + S(S+1) - L(L+1)}{2J(J+1)}$.)`, `ナトリウムの準位 $${t[0] ? '3p' : '3s'}\\,${t[3]}$ のランデ因子 $g_J$ はいくつですか（$g_J = 1 + \\frac{J(J+1) + S(S+1) - L(L+1)}{2J(J+1)}$）。`],
          a: { type: 'num', v: g, show: gFrac(t[0], t[1], t[2]) },
          hint: ['Read $L$, $S$ and $J$ from the term symbol $^{2S+1}L_J$.', '項の記号 $^{2S+1}L_J$ から $L$、$S$、$J$ を読み取ってください。'],
          sol: [[`$L = ${t[0]}$, $S = ${half(t[1])}$, $J = ${half(t[2])}$.`, `$L = ${t[0]}$、$S = ${half(t[1])}$、$J = ${half(t[2])}$ です。`], [`$g_J = 1 + \\dfrac{${n(t[2] * (t[2] + 1))} + ${n(t[1] * (t[1] + 1))} - ${t[0] * (t[0] + 1)}}{${n(2 * t[2] * (t[2] + 1))}} = ${gFrac(t[0], t[1], t[2])}$.`, `$g_J = 1 + \\dfrac{${n(t[2] * (t[2] + 1))} + ${n(t[1] * (t[1] + 1))} - ${t[0] * (t[0] + 1)}}{${n(2 * t[2] * (t[2] + 1))}} = ${gFrac(t[0], t[1], t[2])}$ です。`], [`Each sublevel moves by $g_J m_J\\mu_B B$, so this level's sublevels are spaced by $${gFrac(t[0], t[1], t[2])}\\,\\mu_B B$.`, `各副準位は $g_J m_J\\mu_B B$ だけずれるので、この準位の副準位の間隔は $${gFrac(t[0], t[1], t[2])}\\,\\mu_B B$ です。`]],
          set: { line: t[2] === 1.5 ? 1 : t[0] === 1 ? 0 : 2 },
        };
      }
      if (form === 1) {
        const B = r.pick([0.25, 0.5, 0.8, 1, 1.2, 1.5, 2]);
        return {
          q: [`What is $\\mu_B B$ for a field of $${n(B)}$ T, in μeV? ($\\mu_B = 5.788 \\times 10^{-5}$ eV/T.)`, `$${n(B)}$ T の磁場で $\\mu_B B$ は何 μeV ですか（$\\mu_B = 5.788 \\times 10^{-5}$ eV/T）。`],
          a: { type: 'num', v: MUB * B * 1e6, unit: ['μeV', 'μeV'] },
          sol: [[`$\\mu_B B = 5.788 \\times 10^{-5} \\times ${n(B)} = ${sig(MUB * B, 4)}$ eV $= ${n(MUB * B * 1e6, 3)}$ μeV.`, `$\\mu_B B = 5.788 \\times 10^{-5} \\times ${n(B)} = ${sig(MUB * B, 4)}$ eV $= ${n(MUB * B * 1e6, 3)}$ μeV です。`], ['Compared with the $2.1$ eV photon of the D lines this is tiny, a few parts in $10^5$: that is why the splitting is measured in picometres.', 'D 線の光子 $2.1$ eV に比べると $10^5$ 分の数程度とごくわずかです。分裂がピコメートル単位になるのはこのためです。']],
          set: { B },
        };
      }
      const t = r.pick(TERMS.slice(0, 5));
      return {
        q: [`Into how many sublevels does a level with $J = ${half(t[2])}$ split in a weak magnetic field?`, `$J = ${half(t[2])}$ の準位は弱い磁場の中でいくつの副準位に分かれますか。`],
        a: { type: 'int', v: Math.round(2 * t[2] + 1) },
        hint: ['$m_J$ runs from $-J$ to $+J$ in steps of 1.', '$m_J$ は $-J$ から $+J$ まで 1 ずつ変わります。'],
        sol: [[`$m_J = -${half(t[2])}, \\dots, +${half(t[2])}$: $2J + 1 = ${Math.round(2 * t[2] + 1)}$ values.`, `$m_J = -${half(t[2])}, \\dots, +${half(t[2])}$ で $2J + 1 = ${Math.round(2 * t[2] + 1)}$ 個です。`], ['Each moves by $g_J m_J\\mu_B B$, so they spread out evenly and symmetrically about the original energy.', 'それぞれが $g_J m_J\\mu_B B$ だけずれるので、もとのエネルギーの上下に等間隔かつ対称に広がります。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const line = r.pick(['D1', 'D2']), d = NA[line];
        const mu = r.pick(line === 'D1' ? [0.5, -0.5] : [1.5, 0.5, -0.5, -1.5]);
        const mls = [0.5, -0.5].filter((ml) => Math.abs(mu - ml) <= 1);
        const ml = r.pick(mls), shift = d.gu * mu - 2 * ml, B = r.pick([0.5, 1, 1.5, 2]);
        const dE = shift * MUB * B * 1e6;
        return {
          q: [`In the ${line} line ($g_u = ${fr3(d.gu)}$, $g_\\ell = 2$), the component $m_u = ${half(mu)} \\to m_\\ell = ${half(ml)}$ at $B = ${n(B)}$ T: by how much (in μeV) is its photon energy shifted?`, `${line} 線（$g_u = ${fr3(d.gu)}$、$g_\\ell = 2$）の成分 $m_u = ${half(mu)} \\to m_\\ell = ${half(ml)}$ について、$B = ${n(B)}$ T での光子のエネルギーのずれは何 μeV ですか。`],
          a: { type: 'num', v: dE, unit: ['μeV', 'μeV'] },
          hint: ['$\\Delta E = (g_u m_u - g_\\ell m_\\ell)\\mu_B B$, keeping signs.', '$\\Delta E = (g_u m_u - g_\\ell m_\\ell)\\mu_B B$ で、符号に注意してください。'],
          sol: [[`$g_u m_u - g_\\ell m_\\ell = ${fr3(d.gu)}\\cdot(${half(mu)}) - 2\\cdot(${half(ml)}) = ${fr3(shift)}$.`, `$g_u m_u - g_\\ell m_\\ell = ${fr3(d.gu)}\\cdot(${half(mu)}) - 2\\cdot(${half(ml)}) = ${fr3(shift)}$ です。`], [`$\\Delta E = ${fr3(shift)} \\times ${n(MUB * B * 1e6, 4)}\\ \\mu\\text{eV} = ${n(dE, 4)}\\ \\mu\\text{eV}$.`, `$\\Delta E = ${fr3(shift)} \\times ${n(MUB * B * 1e6, 4)}\\ \\mu\\text{eV} = ${n(dE, 4)}\\ \\mu\\text{eV}$ です。`], [`$\\Delta m = ${half(mu - ml)}$, so this is a ${mu === ml ? '$\\pi$' : '$\\sigma$'} component; ${dE > 0 ? 'a higher energy means a shorter wavelength.' : 'a lower energy means a longer wavelength.'}`, `$\\Delta m = ${half(mu - ml)}$ なので ${mu === ml ? '$\\pi$' : '$\\sigma$'} 成分です。${dE > 0 ? 'エネルギーが高いほど波長は短くなります。' : 'エネルギーが低いほど波長は長くなります。'}`]],
          set: { B, line: line === 'D1' ? 0 : 1, pol: mu === ml ? 1 : 2 },
        };
      }
      if (form === 1) {
        const line = r.pick(['D1', 'D2']), d = NA[line], B = r.pick([0.4, 0.5, 1, 1.25, 1.5, 2]);
        const smax = line === 'D1' ? 4 / 3 : 5 / 3, spread = 2 * smax * MUB * B * d.lam * d.lam / HC * 1000;
        return {
          q: [`At $B = ${n(B)}$ T, how wide (in pm) is the whole Zeeman pattern of the sodium ${line} line ($\\lambda = ${d.lam}$ nm)? Its outermost components are shifted by $\\pm ${fr3(smax)}\\,\\mu_B B$.`, `$B = ${n(B)}$ T で、ナトリウムの ${line} 線（$\\lambda = ${d.lam}$ nm）のゼーマン分裂全体の幅は何 pm ですか。最も外側の成分のずれは $\\pm ${fr3(smax)}\\,\\mu_B B$ です。`],
          a: { type: 'num', v: spread, rel: 0.01, unit: ['pm', 'pm'] },
          hint: ['A small energy shift becomes $|\\Delta\\lambda| = \\lambda^2|\\Delta E|/hc$.', '小さなエネルギーのずれは $|\\Delta\\lambda| = \\lambda^2|\\Delta E|/hc$ になります。'],
          sol: [[`Total energy spread: $2\\cdot${fr3(smax)}\\cdot\\mu_B B = ${n(2 * smax * MUB * B * 1e6, 4)}$ μeV.`, `エネルギーの広がりは $2\\cdot${fr3(smax)}\\cdot\\mu_B B = ${n(2 * smax * MUB * B * 1e6, 4)}$ μeV です。`], [`$\\Delta\\lambda = \\dfrac{(${d.lam})^2}{1239.84} \\times ${sig(2 * smax * MUB * B, 4)}\\ \\text{nm} = ${n(spread, 3)}$ pm.`, `$\\Delta\\lambda = \\dfrac{(${d.lam})^2}{1239.84} \\times ${sig(2 * smax * MUB * B, 4)}\\ \\text{nm} = ${n(spread, 3)}$ pm です。`], ['That is the "total spread" in the readout: a few hundredths of a nanometre, which needs a high-resolution spectrometer.', '読み取り欄の「全体の広がり」がこれです。100分の数ナノメートルなので、高分解能の分光器が必要です。']],
          set: { B, line: line === 'D1' ? 0 : 1, pol: 0 },
        };
      }
      const line = r.pick(['D1', 'D2']), normal = r.chance(0.5);
      const opts = [['3', '3'], ['4', '4'], ['6', '6'], ['8', '8']];
      if (normal) {
        return {
          q: [`A singlet line ($S = 0$, so $g_J = 1$ in both levels) with $J = 1 \\to J = 0$ is put in a weak field. How many distinct wavelengths appear?`, `一重項の線（$S = 0$ なので両方の準位で $g_J = 1$）$J = 1 \\to J = 0$ を弱い磁場の中に置きます。異なる波長はいくつ現れますか。`],
          a: { type: 'choice', opts, v: 0, fixed: true },
          hint: ['With equal $g$ factors, the shift depends only on $\\Delta m$.', '$g$ 因子が等しいと、ずれは $\\Delta m$ だけで決まります。'],
          sol: [['$\\Delta E = (m_u - m_\\ell)\\mu_B B = \\Delta m\\,\\mu_B B$ with $\\Delta m = 0, \\pm1$.', '$\\Delta E = (m_u - m_\\ell)\\mu_B B = \\Delta m\\,\\mu_B B$ で、$\\Delta m = 0, \\pm1$ です。'], ['Three wavelengths: the normal Zeeman triplet. Sodium differs because its two levels have different $g_J$.', '波長は三つで、正常ゼーマン効果の三重線です。ナトリウムでは二つの準位の $g_J$ が異なるので事情が違います。']],
        };
      }
      return {
        q: [`Into how many components does the sodium ${line} line split in a weak field, counting $\\pi$ and $\\sigma$ together?`, `ナトリウムの ${line} 線は弱い磁場の中で、$\\pi$ と $\\sigma$ をあわせていくつの成分に分かれますか。`],
        a: { type: 'choice', opts, v: line === 'D1' ? 1 : 2, fixed: true },
        hint: ['Count the pairs $(m_u, m_\\ell)$ with $|m_u - m_\\ell| \\le 1$; with unequal $g$ factors each gives its own shift.', '$|m_u - m_\\ell| \\le 1$ を満たす組 $(m_u, m_\\ell)$ を数えてください。$g$ 因子が異なるので組ごとにずれが異なります。'],
        sol: line === 'D1' ? [['Upper $J = \\tfrac12$ has $m_u = \\pm\\tfrac12$, lower has $m_\\ell = \\pm\\tfrac12$: all four pairs obey $|\\Delta m| \\le 1$.', '上の $J = \\tfrac12$ は $m_u = \\pm\\tfrac12$、下は $m_\\ell = \\pm\\tfrac12$ で、四つの組すべてが $|\\Delta m| \\le 1$ を満たします。'], ['Shifts $\\tfrac23 m_u - 2m_\\ell$ are $\\pm\\tfrac23$ ($\\pi$) and $\\pm\\tfrac43$ ($\\sigma$): four distinct lines, not the normal triplet.', 'ずれ $\\tfrac23 m_u - 2m_\\ell$ は $\\pm\\tfrac23$（$\\pi$）と $\\pm\\tfrac43$（$\\sigma$）で、正常な三重線ではなく4本になります。']]
          : [['Upper $J = \\tfrac32$ has four sublevels, lower two; of the 8 pairs, $m_u = \\pm\\tfrac32 \\to m_\\ell = \\mp\\tfrac12$ would need $|\\Delta m| = 2$.', '上の $J = \\tfrac32$ は副準位が4つ、下は2つで、8組のうち $m_u = \\pm\\tfrac32 \\to m_\\ell = \\mp\\tfrac12$ は $|\\Delta m| = 2$ となり禁止されます。'], ['Six remain, with shifts $\\pm\\tfrac13$, $\\pm1$, $\\pm\\tfrac53$ in units of $\\mu_B B$: six distinct lines.', '残る6組のずれは $\\mu_B B$ を単位として $\\pm\\tfrac13$、$\\pm1$、$\\pm\\tfrac53$ で、6本の異なる線になります。']],
        set: { line: line === 'D1' ? 0 : 1, pol: 0, B: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick(TERMS.slice(3));
        const g = lande(t[0], t[1], t[2]);
        return {
          q: [`Compute the Landé factor $g_J$ of a $${t[3]}$ level.`, `$${t[3]}$ 準位のランデ因子 $g_J$ を計算してください。`],
          a: { type: 'num', v: g, show: gFrac(t[0], t[1], t[2]) },
          hint: ['The superscript is $2S + 1$, the letter is $L$ (S, P, D, F = 0, 1, 2, 3), the subscript is $J$.', '左上の数は $2S + 1$、文字は $L$（S, P, D, F = 0, 1, 2, 3）、右下は $J$ です。'],
          sol: [[`$S = ${half(t[1])}$, $L = ${t[0]}$, $J = ${half(t[2])}$: $J(J+1) = ${n(t[2] * (t[2] + 1))}$, $S(S+1) = ${n(t[1] * (t[1] + 1))}$, $L(L+1) = ${t[0] * (t[0] + 1)}$.`, `$S = ${half(t[1])}$、$L = ${t[0]}$、$J = ${half(t[2])}$ で、$J(J+1) = ${n(t[2] * (t[2] + 1))}$、$S(S+1) = ${n(t[1] * (t[1] + 1))}$、$L(L+1) = ${t[0] * (t[0] + 1)}$ です。`], [`$g_J = 1 + \\dfrac{${n(t[2] * (t[2] + 1) + t[1] * (t[1] + 1) - t[0] * (t[0] + 1))}}{${n(2 * t[2] * (t[2] + 1))}} = ${gFrac(t[0], t[1], t[2])} \\approx ${n(g, 4)}$.`, `$g_J = 1 + \\dfrac{${n(t[2] * (t[2] + 1) + t[1] * (t[1] + 1) - t[0] * (t[0] + 1))}}{${n(2 * t[2] * (t[2] + 1))}} = ${gFrac(t[0], t[1], t[2])} \\approx ${n(g, 4)}$ です。`], ['It interpolates between $g = 1$ for pure orbital motion and $g = 2$ for pure spin, weighted by how $\\vec L$ and $\\vec S$ project onto $\\vec J$.', '純粋な軌道運動の $g = 1$ と純粋なスピンの $g = 2$ の間の値で、$\\vec L$ と $\\vec S$ が $\\vec J$ に射影される割合で重みづけされています。']],
        };
      }
      if (form === 1) {
        const line = r.pick(['D1', 'D2']), d = NA[line], target = r.pick([10, 15, 20, 25, 30, 40]);
        const smax = line === 'D1' ? 4 / 3 : 5 / 3;
        const B = target / 1000 / (smax * MUB * d.lam * d.lam / HC);
        const Bs = Math.round(B * 100) / 100;
        return {
          q: [`What field (in T) moves the outermost $\\sigma$ component of the sodium ${line} line ($\\lambda = ${d.lam}$ nm, shift $${fr3(smax)}\\,\\mu_B B$) by $${target}$ pm from its zero-field position?`, `ナトリウムの ${line} 線（$\\lambda = ${d.lam}$ nm、ずれ $${fr3(smax)}\\,\\mu_B B$）の最も外側の $\\sigma$ 成分を、磁場がないときの位置から $${target}$ pm 動かす磁場は何 T ですか。`],
          a: { type: 'num', v: B, rel: 0.01, unit: ['T', 'T'] },
          hint: ['Turn the wavelength shift into an energy, $\\Delta E = hc\\,\\Delta\\lambda/\\lambda^2$, then divide by $' + fr3(smax) + '\\mu_B$.', '波長のずれをエネルギーに直し（$\\Delta E = hc\\,\\Delta\\lambda/\\lambda^2$）、$' + fr3(smax) + '\\mu_B$ で割ってください。'],
          sol: [[`$\\Delta E = 1239.84 \\times ${target} \\times 10^{-3}/${d.lam}^2 = ${sig(HC * target / 1000 / d.lam ** 2, 4)}$ eV.`, `$\\Delta E = 1239.84 \\times ${target} \\times 10^{-3}/${d.lam}^2 = ${sig(HC * target / 1000 / d.lam ** 2, 4)}$ eV です。`], [`$B = \\Delta E/(${fr3(smax)}\\mu_B) = ${n(B, 4)}$ T.`, `$B = \\Delta E/(${fr3(smax)}\\mu_B) = ${n(B, 4)}$ T です。`], [B <= 2 ? 'A laboratory electromagnet reaches this easily; drag the field there and the outer dot sits at that offset.' : 'More than the 2 T the figure shows, but still far inside the weak-field regime, which holds up to tens of tesla.', B <= 2 ? '実験室の電磁石で容易に届く磁場です。磁場をそこまで動かすと、外側の点がそのずれの位置に来ます。' : '図の 2 T を超えますが、数十テスラまで成り立つ弱磁場領域のまだ十分内側です。']],
          set: Bs <= 2 ? { B: Bs, line: line === 'D1' ? 0 : 1, pol: 2 } : undefined,
        };
      }
      const line = r.pick(['D1', 'D2']), d = NA[line];
      const mu = line === 'D1' ? r.pick([0.5, -0.5]) : r.pick([1.5, 0.5, -0.5, -1.5]);
      const ml = r.pick([0.5, -0.5].filter((x) => Math.abs(mu - x) <= 1));
      const shift = d.gu * mu - 2 * ml, k = -d.lam * d.lam / HC * shift * MUB * 1000;
      return {
        q: [`Write the wavelength offset $\\Delta\\lambda(B)$ in pm of the ${line} component $m_u = ${half(mu)} \\to m_\\ell = ${half(ml)}$ as a function of $B$ in tesla ($g_u = ${fr3(d.gu)}$, $g_\\ell = 2$, $\\lambda = ${d.lam}$ nm).`, `${line} 線の成分 $m_u = ${half(mu)} \\to m_\\ell = ${half(ml)}$ の波長のずれ $\\Delta\\lambda(B)$（pm）を、テスラ単位の $B$ の式で表してください（$g_u = ${fr3(d.gu)}$、$g_\\ell = 2$、$\\lambda = ${d.lam}$ nm）。`],
        a: { type: 'expr', v: `${n(k, 6)}*B`, vars: ['B'], dom: { B: [0.1, 2] }, lhs: ['$\\Delta\\lambda(B) =$', '$\\Delta\\lambda(B) =$'] },
        hint: ['A positive energy shift means a negative wavelength shift: $\\Delta\\lambda = -\\lambda^2\\Delta E/hc$.', 'エネルギーが正にずれると波長は負にずれます。$\\Delta\\lambda = -\\lambda^2\\Delta E/hc$ です。'],
        sol: [[`$\\Delta E = (${fr3(d.gu)}\\cdot ${half(mu)} - 2\\cdot ${half(ml)})\\mu_B B = ${fr3(shift)}\\,\\mu_B B$.`, `$\\Delta E = (${fr3(d.gu)}\\cdot ${half(mu)} - 2\\cdot ${half(ml)})\\mu_B B = ${fr3(shift)}\\,\\mu_B B$ です。`], [`$\\Delta\\lambda = -\\dfrac{${d.lam}^2}{1239.84}\\cdot${fr3(shift)}\\cdot 5.788\\times10^{-5}\\,B\\ \\text{nm} = ${n(k, 4)}\\,B$ pm.`, `$\\Delta\\lambda = -\\dfrac{${d.lam}^2}{1239.84}\\cdot${fr3(shift)}\\cdot 5.788\\times10^{-5}\\,B\\ \\text{nm} = ${n(k, 4)}\\,B$ pm です。`], ['Linear in $B$: each component is a straight line through its zero-field wavelength, as in the right-hand plot.', '$B$ に比例するので、右の図のように各成分は磁場ゼロの波長を通る直線になります。']],
        set: { line: line === 'D1' ? 0 : 1, pol: mu === ml ? 1 : 2 },
      };
    },
  ];
})();
