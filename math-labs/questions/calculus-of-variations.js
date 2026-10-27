'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, dg = (r) => r * 180 / PI, RE = 6371;
  const half = (c) => (c === 1 ? '\\tfrac12' : c === 2 ? '' : `\\tfrac{${c}}{2}`);
  const km = (x) => Math.round(x).toLocaleString('en-US').replace(/,/g, '{,}');

  /* ---------- 1. Euler-Lagrange ---------- */
  // the three variations of the figure, max |eta| = 1, with c2 = (1/2) * integral of eta'^2 and I = integral of eta
  const ETA = [
    { tex: '\\sin\\pi t', en: '$\\eta = \\sin\\pi t$', c2: PI * PI / 4, c2tex: '\\tfrac{\\pi^2}{4}', I: 2 / PI, Itex: '\\tfrac{2}{\\pi}' },
    { tex: '\\sin 2\\pi t', en: '$\\eta = \\sin 2\\pi t$', c2: PI * PI, c2tex: '\\pi^2', I: 0, Itex: '0' },
    { tex: '\\tfrac{27}{4}t^2(1 - t)', en: '$\\eta = \\tfrac{27}{4}t^2(1 - t)$', c2: 3.0375, c2tex: '\\tfrac{243}{80}', I: 0.5625, Itex: '\\tfrac{9}{16}' },
  ];
  const POT = [
    { V: (a) => `${a}q`, Vtex: (a) => `- ${a}q`, dV: (a) => `${a}`, rhs: (a, m) => `-${a}/${m}` },
    { V: (a) => `${a}q^2/2`, Vtex: (a) => `- \\tfrac{${a}}{2}q^2`, dV: (a) => `${a}q`, rhs: (a, m) => `-${a}*q/${m}` },
    { V: (a) => `${a}q^4/4`, Vtex: (a) => `- \\tfrac{${a}}{4}q^4`, dV: (a) => `${a}q^3`, rhs: (a, m) => `-${a}*q^3/${m}` },
    { V: (a) => `-${a}cos q`, Vtex: (a) => `+ ${a}\\cos q`, dV: (a) => `${a}\\sin q`, rhs: (a, m) => `-${a}*sin(q)/${m}` },
  ];
  Q['euler-lagrange'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.int(0, POT.length - 1), a = r.int(1, 6), m = r.pick([1, 2, 3]);
        const mt = m === 1 ? '' : `${m}`;
        return {
          q: [`For $L = ${half(m)}\\dot q^2 ${POT[k].Vtex(a)}$, the Euler–Lagrange equation gives $\\ddot q$ as a function of $q$. Write it.`, `$L = ${half(m)}\\dot q^2 ${POT[k].Vtex(a)}$ のオイラー・ラグランジュ方程式から、$\\ddot q$ を $q$ の関数として表してください。`],
          a: { type: 'expr', v: POT[k].rhs(a, m), vars: ['q'], dom: { q: [-1.5, 1.5] }, lhs: ['$\\ddot q =$', '$\\ddot q =$'] },
          hint: ['Compute $\\partial L/\\partial\\dot q$ and $\\partial L/\\partial q$, then $\\tfrac{d}{dt}\\tfrac{\\partial L}{\\partial\\dot q} = \\tfrac{\\partial L}{\\partial q}$.', '$\\partial L/\\partial\\dot q$ と $\\partial L/\\partial q$ を計算し、$\\tfrac{d}{dt}\\tfrac{\\partial L}{\\partial\\dot q} = \\tfrac{\\partial L}{\\partial q}$ とします。'],
          sol: [[`$\\partial L/\\partial\\dot q = ${mt}\\dot q$ and $\\partial L/\\partial q = -${POT[k].dV(a)}$.`, `$\\partial L/\\partial\\dot q = ${mt}\\dot q$、$\\partial L/\\partial q = -${POT[k].dV(a)}$ です。`], [`So $${mt}\\ddot q = -${POT[k].dV(a)}$: Newton's second law, with the force $-V'(q)$ coming out of the variational principle.`, `よって $${mt}\\ddot q = -${POT[k].dV(a)}$ です。変分原理から、力 $-V'(q)$ をもつニュートンの第2法則が出てきます。`]],
        };
      }
      const g = r.pick([8, 8, 9.8, 4, 10, 6]), t = r.pick([0.1, 0.2, 0.25, 0.3, 0.5, 0.6, 0.75, 0.9]), q = 0.5 * g * t * (1 - t);
      return {
        q: [`With $L = \\tfrac12\\dot q^2 - gq$, $g = ${g}$ and $q(0) = q(1) = 0$, what is the height $q^*(${t})$ on the stationary path?`, `$L = \\tfrac12\\dot q^2 - gq$、$g = ${g}$、$q(0) = q(1) = 0$ のとき、停留経路上の高さ $q^*(${t})$ はいくつですか。`],
        a: { type: 'num', v: q },
        hint: ['The equation is $\\ddot q = -g$; fit a parabola through both ends.', '方程式は $\\ddot q = -g$ です。両端を通る放物線を当てはめます。'],
        sol: [['$\\ddot q = -g$ with $q(0) = q(1) = 0$ gives $q^* = \\tfrac12 g\\,t(1 - t)$.', '$q(0) = q(1) = 0$ のもとで $\\ddot q = -g$ を解くと $q^* = \\tfrac12 g\\,t(1 - t)$ です。'], [`$q^*(${t}) = \\tfrac12\\cdot${g}\\cdot${t}\\cdot${n(1 - t)} = ${n(q, 4)}$.${g === 8 ? ' This is the blue curve in the figure.' : ''}`, `$q^*(${t}) = \\tfrac12\\cdot${g}\\cdot${t}\\cdot${n(1 - t)} = ${n(q, 4)}$ です。${g === 8 ? '図の青い曲線がこれです。' : ''}`]],
        set: g === 8 ? { bend: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const s = r.int(0, 2), e = r.pick([-1, -0.8, -0.6, -0.5, -0.4, -0.3, -0.2, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1]), E = ETA[s];
        return {
          q: [`In the figure ($g = 8$), bend the stationary path by $\\varepsilon\\eta$ with ${E.en} and $\\varepsilon = ${n(e)}$. By how much does the action increase, $\\Delta S = S[q^* + \\varepsilon\\eta] - S[q^*]$?`, `図（$g = 8$）で停留経路を $\\varepsilon\\eta$ だけ曲げます。${E.en}、$\\varepsilon = ${n(e)}$ です。作用の増加 $\\Delta S = S[q^* + \\varepsilon\\eta] - S[q^*]$ はいくつですか。`],
          a: { type: 'num', v: e * e * E.c2 },
          hint: ['Expand the action in $\\varepsilon$. The linear term vanishes on the stationary path; the potential is linear in $q$, so nothing beyond $\\varepsilon^2$ survives.', '作用を $\\varepsilon$ で展開します。停留経路では1次の項が消え、ポテンシャルが $q$ について1次なので $\\varepsilon^2$ より高次の項は残りません。'],
          sol: [['$S[q^* + \\varepsilon\\eta] = S[q^*] + \\varepsilon\\int(\\dot q^*\\dot\\eta - g\\eta)\\,dt + \\tfrac{\\varepsilon^2}{2}\\int\\dot\\eta^2\\,dt$, and the middle integral is $-\\int(\\ddot q^* + g)\\eta\\,dt = 0$.', '$S[q^* + \\varepsilon\\eta] = S[q^*] + \\varepsilon\\int(\\dot q^*\\dot\\eta - g\\eta)\\,dt + \\tfrac{\\varepsilon^2}{2}\\int\\dot\\eta^2\\,dt$ で、中央の積分は $-\\int(\\ddot q^* + g)\\eta\\,dt = 0$ です。'], [`$\\tfrac12\\int_0^1\\dot\\eta^2\\,dt = ${E.c2tex} = ${n(E.c2, 4)}$, so $\\Delta S = ${n(e * e, 4)}\\cdot ${n(E.c2, 4)} = ${n(e * e * E.c2, 4)}$.`, `$\\tfrac12\\int_0^1\\dot\\eta^2\\,dt = ${E.c2tex} = ${n(E.c2, 4)}$ なので $\\Delta S = ${n(e * e, 4)}\\cdot ${n(E.c2, 4)} = ${n(e * e * E.c2, 4)}$ です。`], ['It is positive for every bend: here the stationary path is a true minimum, and wigglier variations cost more.', 'どの曲げ方でも正です。この場合の停留経路は本当の最小で、細かく揺れる変分ほど作用が大きく増えます。']],
          set: { bend: e, shape: s },
        };
      }
      const g = r.pick([2, 4, 6, 8, 10, 12]), S0 = -g * g / 24;
      return {
        q: [`For $L = \\tfrac12\\dot q^2 - gq$ with $g = ${g}$ and $q(0) = q(1) = 0$, compute the action $S[q^*] = \\int_0^1 L\\,dt$ of the stationary path.`, `$L = \\tfrac12\\dot q^2 - gq$、$g = ${g}$、$q(0) = q(1) = 0$ のとき、停留経路の作用 $S[q^*] = \\int_0^1 L\\,dt$ を計算してください。`],
        a: { type: 'num', v: S0, show: frac(-g * g, 24) },
        hint: ['Use $q^* = \\tfrac12 g\\,t(1 - t)$ and $\\dot q^* = \\tfrac12 g(1 - 2t)$.', '$q^* = \\tfrac12 g\\,t(1 - t)$、$\\dot q^* = \\tfrac12 g(1 - 2t)$ を使います。'],
        sol: [[`$\\int_0^1 \\tfrac12\\dot q^{*2}\\,dt = \\tfrac{g^2}{8}\\int_0^1(1 - 2t)^2\\,dt = \\tfrac{g^2}{24}$.`, `$\\int_0^1 \\tfrac12\\dot q^{*2}\\,dt = \\tfrac{g^2}{8}\\int_0^1(1 - 2t)^2\\,dt = \\tfrac{g^2}{24}$ です。`], [`$\\int_0^1 g q^*\\,dt = \\tfrac{g^2}{2}\\int_0^1 t(1 - t)\\,dt = \\tfrac{g^2}{12}$.`, `$\\int_0^1 g q^*\\,dt = \\tfrac{g^2}{2}\\int_0^1 t(1 - t)\\,dt = \\tfrac{g^2}{12}$ です。`], [`$S[q^*] = \\tfrac{g^2}{24} - \\tfrac{g^2}{12} = -\\tfrac{g^2}{24} = ${n(S0, 4)}$.${g === 8 ? ' The readout shows the same value.' : ''} Every other path with these ends has a larger action.`, `$S[q^*] = \\tfrac{g^2}{24} - \\tfrac{g^2}{12} = -\\tfrac{g^2}{24} = ${n(S0, 4)}$ です。${g === 8 ? '読み取り欄にも同じ値が出ます。' : ''}同じ端点をもつ他のどの経路も、作用がこれより大きくなります。`]],
        set: g === 8 ? { bend: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-3, 3), k = r.int(1, 5), m = r.pick([1, 2]);
        const mt = m === 1 ? '' : `${m}`;
        return {
          q: [`Find $\\ddot q$ as a function of $q$ for $L = ${half(m)}\\dot q^2 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}q\\dot q - ${half(k)}q^2$.`, `$L = ${half(m)}\\dot q^2 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}q\\dot q - ${half(k)}q^2$ について、$\\ddot q$ を $q$ の関数として求めてください。`],
          a: { type: 'expr', v: `-${k}*q/${m}`, vars: ['q'], dom: { q: [-1.5, 1.5] }, lhs: ['$\\ddot q =$', '$\\ddot q =$'] },
          hint: ['Do the term in $q\\dot q$ carefully: it contributes to both sides. Is it the derivative of something?', '$q\\dot q$ の項に注意してください。両辺に寄与します。何かの導関数になっていませんか。'],
          sol: [[`$\\partial L/\\partial\\dot q = ${mt}\\dot q ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}q$, whose time derivative is $${mt}\\ddot q ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}\\dot q$; and $\\partial L/\\partial q = ${a}\\dot q - ${k}q$.`, `$\\partial L/\\partial\\dot q = ${mt}\\dot q ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}q$ の時間微分は $${mt}\\ddot q ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}\\dot q$、また $\\partial L/\\partial q = ${a}\\dot q - ${k}q$ です。`], [`The $${a}\\dot q$ terms cancel, leaving $${mt}\\ddot q = -${k}q$, so $\\ddot q = -${frac(k, m)}\\,q$.`, `$${a}\\dot q$ の項が打ち消し合い、$${mt}\\ddot q = -${k}q$、すなわち $\\ddot q = -${frac(k, m)}\\,q$ が残ります。`], [`The reason: $${a}q\\dot q = \\tfrac{d}{dt}\\big(\\tfrac{${a}}{2}q^2\\big)$ is a total derivative, which only adds a constant to $S$ once the ends are fixed. Lagrangians that differ by $\\tfrac{dF}{dt}$ give the same motion.`, `理由：$${a}q\\dot q = \\tfrac{d}{dt}\\big(\\tfrac{${a}}{2}q^2\\big)$ は全微分で、端点を固定すると $S$ に定数を足すだけだからです。$\\tfrac{dF}{dt}$ だけ異なるラグランジアンは同じ運動を与えます。`]],
        };
      }
      if (form === 1) {
        const s = r.int(0, 2), E = ETA[s], g = 8, c = r.pick([2, 3, 5, 6]), slope = (2 * c - g) * E.I;
        return {
          q: [`Start instead from the wrong path $q_0 = ${c}\\,t(1 - t)$ (with $g = 8$) and bend it by $\\varepsilon\\eta$ with ${E.en}. What is $\\tfrac{dS}{d\\varepsilon}$ at $\\varepsilon = 0$?`, `代わりに誤った経路 $q_0 = ${c}\\,t(1 - t)$（$g = 8$）から出発し、${E.en} で $\\varepsilon\\eta$ だけ曲げます。$\\varepsilon = 0$ での $\\tfrac{dS}{d\\varepsilon}$ はいくつですか。`],
          a: { type: 'num', v: slope, tol: 1e-4 + Math.abs(slope) * 0.003 },
          hint: ['$\\tfrac{dS}{d\\varepsilon}\\big|_0 = -\\int_0^1(\\ddot q_0 + g)\\,\\eta\\,dt$ after integrating by parts.', '部分積分すると $\\tfrac{dS}{d\\varepsilon}\\big|_0 = -\\int_0^1(\\ddot q_0 + g)\\,\\eta\\,dt$ です。'],
          sol: [[`$\\ddot q_0 = -${2 * c}$, so the residual is $\\ddot q_0 + g = ${g - 2 * c}$, constant in $t$.`, `$\\ddot q_0 = -${2 * c}$ なので、残差は $\\ddot q_0 + g = ${g - 2 * c}$ で $t$ によりません。`], [`$\\int_0^1\\eta\\,dt = ${E.Itex}$, so $\\tfrac{dS}{d\\varepsilon} = -(${g - 2 * c})\\cdot ${E.Itex} = ${n(slope, 4)}$.`, `$\\int_0^1\\eta\\,dt = ${E.Itex}$ なので $\\tfrac{dS}{d\\varepsilon} = -(${g - 2 * c})\\cdot ${E.Itex} = ${n(slope, 4)}$ です。`], [E.I === 0 ? 'Zero, even though $q_0$ is not stationary: this one variation happens to be orthogonal to the residual. Stationarity needs a zero slope for every $\\eta$, which is why the residual itself must vanish.' : 'Nonzero: the wrong path is not stationary, and the slope is the overlap of the residual with $\\eta$.', E.I === 0 ? '$q_0$ は停留していないのに 0 です。この変分がたまたま残差と直交しているからです。停留にはすべての $\\eta$ で傾きが 0 であることが必要で、だから残差そのものが 0 でなければなりません。' : '0 ではありません。誤った経路は停留しておらず、傾きは残差と $\\eta$ の重なりです。']],
        };
      }
      const s = r.int(0, 2), E = ETA[s], D = r.pick([0.1, 0.25, 0.5, 1, 1.5, 2]), e = Math.sqrt(D / E.c2);
      return {
        q: [`With $g = 8$ and ${E.en}, how large must the bend $\\varepsilon > 0$ be for the action to rise by $\\Delta S = ${D}$?`, `$g = 8$、${E.en} のとき、作用が $\\Delta S = ${D}$ だけ増えるには曲がり $\\varepsilon > 0$ をどれだけにすればよいですか。`],
        a: { type: 'num', v: e, tol: 0.002 },
        hint: ['$\\Delta S = \\varepsilon^2\\cdot\\tfrac12\\int\\dot\\eta^2\\,dt$ exactly here.', 'ここでは $\\Delta S = \\varepsilon^2\\cdot\\tfrac12\\int\\dot\\eta^2\\,dt$ が厳密に成り立ちます。'],
        sol: [[`$\\tfrac12\\int_0^1\\dot\\eta^2\\,dt = ${E.c2tex} = ${n(E.c2, 4)}$.`, `$\\tfrac12\\int_0^1\\dot\\eta^2\\,dt = ${E.c2tex} = ${n(E.c2, 4)}$ です。`], [`$\\varepsilon = \\sqrt{${D}/${n(E.c2, 4)}} = ${n(e, 4)}$.`, `$\\varepsilon = \\sqrt{${D}/${n(E.c2, 4)}} = ${n(e, 4)}$ です。`], ['The action grows only quadratically away from the stationary path, so a small change in $S$ allows a comparatively large bend: that flatness is what stationary means.', '作用は停留経路から2次でしか増えないので、$S$ の小さな変化でも比較的大きな曲げが許されます。この平らさこそが停留の意味です。']],
        set: { bend: Math.round(e * 20) / 20, shape: s },
      };
    },
  ];

  /* ---------- 2. geodesics on a sphere ---------- */
  const LATS = [-70, -60, -50, -40, -30, -20, 20, 30, 35, 40, 45, 50, 55, 60, 70];
  const ARCS = [30, 40, 60, 80, 90, 100, 120, 140, 150, 160];
  const gcLen = (p, l) => 2 * Math.asin(Math.cos(rad(p)) * Math.sin(rad(l) / 2));
  const CITIES = [['Melbourne', 'メルボルン', -37.81, 144.96], ['Tokyo', '東京', 35.68, 139.69], ['London', 'ロンドン', 51.51, -0.13], ['New York', 'ニューヨーク', 40.71, -74.01], ['Cape Town', 'ケープタウン', -33.92, 18.42], ['Singapore', 'シンガポール', 1.35, 103.82], ['Los Angeles', 'ロサンゼルス', 34.05, -118.24], ['Santiago', 'サンティアゴ', -33.45, -70.67]];
  Q.geodesic = [
    (r) => {
      const form = r.int(0, 1), p = r.pick(LATS), l = r.pick(ARCS);
      if (form === 0) {
        const L0 = rad(l) * Math.cos(rad(p));
        return {
          q: [`Two cities lie on latitude $${p}^\\circ$, $${l}^\\circ$ of longitude apart. How long is the route along the parallel, on the unit sphere?`, `2つの都市が緯度 $${p}^\\circ$ にあり、経度が $${l}^\\circ$ 離れています。緯線に沿った経路の長さは、単位球面上でいくつですか。`],
          a: { type: 'num', v: L0, tol: 0.002 },
          hint: ['With $ds^2 = d\\varphi^2 + \\cos^2\\!\\varphi\\,d\\lambda^2$ and $\\varphi$ fixed, $ds = \\cos\\varphi\\,d\\lambda$.', '$ds^2 = d\\varphi^2 + \\cos^2\\!\\varphi\\,d\\lambda^2$ で $\\varphi$ を固定すると $ds = \\cos\\varphi\\,d\\lambda$ です。'],
          sol: [[`The parallel is a circle of radius $\\cos\\varphi = ${n(Math.cos(rad(p)), 4)}$.`, `緯線は半径 $\\cos\\varphi = ${n(Math.cos(rad(p)), 4)}$ の円です。`], [`Its length is $\\Delta\\lambda\\cos\\varphi = ${n(rad(l), 4)}\\cdot ${n(Math.cos(rad(p)), 4)} = ${n(L0, 4)}$, about $${km(L0 * RE)}$ km on Earth.`, `長さは $\\Delta\\lambda\\cos\\varphi = ${n(rad(l), 4)}\\cdot ${n(Math.cos(rad(p)), 4)} = ${n(L0, 4)}$ で、地球上では約 $${km(L0 * RE)}$ km です。`]],
          set: { latitude: p, arc: l, pull: 0 },
        };
      }
      const north = p > 0;
      return {
        q: [`On the longitude–latitude map, two cities at latitude $${p}^\\circ$ are joined by the shortest route on the globe. Which way does that route bend on the map?`, `経度・緯度の地図上で、緯度 $${p}^\\circ$ にある2都市を地球上の最短経路で結びます。その経路は地図上でどちらへ曲がりますか。`],
        a: { type: 'choice', opts: [[`Toward the ${north ? 'North' : 'South'} Pole`, `${north ? '北' : '南'}極の方へ`], [`Toward the ${north ? 'South' : 'North'} Pole, across the equator side`, `${north ? '南' : '北'}極の方へ（赤道側へ）`], ['Not at all: it is the straight parallel', '曲がらない。まっすぐな緯線である']], v: 0 },
        hint: ['East–west distances shrink like $\\cos\\varphi$ toward the poles.', '東西方向の距離は極に近づくにつれて $\\cos\\varphi$ のように縮みます。'],
        sol: [['A degree of longitude is worth $\\cos\\varphi$ of arc, so a path saves length by spending its east–west travel at higher $|\\varphi|$.', '経度1度は弧長 $\\cos\\varphi$ に相当するので、東西の移動を $|\\varphi|$ の大きいところで行うと経路が短くなります。'], [`So the great circle bulges toward the nearer pole, the ${north ? 'North' : 'South'} Pole here, even though it looks longer on the map.`, `よって大円は地図上では長く見えても、近い方の極、ここでは${north ? '北' : '南'}極の方へ膨らみます。`]],
        set: { latitude: p, arc: l, pull: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2), p = r.pick(LATS), l = r.pick(ARCS);
      const Lg = gcLen(p, l), Lp = rad(l) * Math.cos(rad(p));
      if (form === 0) {
        return {
          q: [`Two cities on latitude $${p}^\\circ$ are $${l}^\\circ$ of longitude apart. How long is the great-circle route between them on Earth ($R = 6371$ km)? Answer in km.`, `緯度 $${p}^\\circ$ にある2都市の経度差が $${l}^\\circ$ です。地球（$R = 6371$ km）上の大円経路の長さは何 km ですか。`],
          a: { type: 'num', v: Lg * RE, tol: 6, unit: ['km', 'km'] },
          hint: ['Half the chord between the cities is $\\cos\\varphi\\sin(\\Delta\\lambda/2)$ on the unit sphere.', '単位球面上で、2都市を結ぶ弦の半分は $\\cos\\varphi\\sin(\\Delta\\lambda/2)$ です。'],
          sol: [[`The central angle is $2\\arcsin\\big(\\cos ${p}^\\circ\\sin ${l / 2}^\\circ\\big) = ${n(Lg, 4)}$ rad.`, `中心角は $2\\arcsin\\big(\\cos ${p}^\\circ\\sin ${l / 2}^\\circ\\big) = ${n(Lg, 4)}$ rad です。`], [`Length $= ${n(Lg, 4)}\\cdot 6371 \\approx ${km(Lg * RE)}$ km, against $${km(Lp * RE)}$ km along the parallel.`, `長さは $${n(Lg, 4)}\\cdot 6371 \\approx ${km(Lg * RE)}$ km で、緯線に沿うと $${km(Lp * RE)}$ km です。`]],
          set: { latitude: p, arc: l, pull: 1 },
        };
      }
      if (form === 1) {
        return {
          q: [`Two cities on latitude $${p}^\\circ$, $${l}^\\circ$ of longitude apart. How many km does the great circle save compared with following the parallel ($R = 6371$ km)?`, `緯度 $${p}^\\circ$、経度差 $${l}^\\circ$ の2都市です。緯線に沿う場合と比べて、大円は何 km 短いですか（$R = 6371$ km）。`],
          a: { type: 'num', v: (Lp - Lg) * RE, tol: 6, unit: ['km', 'km'] },
          hint: ['Compute both lengths on the unit sphere first, then scale.', 'まず単位球面上で両方の長さを求めてから拡大します。'],
          sol: [[`Parallel: $\\Delta\\lambda\\cos\\varphi = ${n(Lp, 4)}$. Great circle: $2\\arcsin(\\cos\\varphi\\sin\\tfrac{\\Delta\\lambda}{2}) = ${n(Lg, 4)}$.`, `緯線：$\\Delta\\lambda\\cos\\varphi = ${n(Lp, 4)}$。大円：$2\\arcsin(\\cos\\varphi\\sin\\tfrac{\\Delta\\lambda}{2}) = ${n(Lg, 4)}$ です。`], [`Saving $= (${n(Lp, 4)} - ${n(Lg, 4)})\\cdot 6371 \\approx ${km((Lp - Lg) * RE)}$ km. The saving grows with latitude and with the longitude gap.`, `差は $(${n(Lp, 4)} - ${n(Lg, 4)})\\cdot 6371 \\approx ${km((Lp - Lg) * RE)}$ km です。緯度が高いほど、経度差が大きいほど差は大きくなります。`]],
          set: { latitude: p, arc: l, pull: 1 },
        };
      }
      const pm = dg(Math.atan(Math.tan(rad(p)) / Math.cos(rad(l) / 2)));
      return {
        q: [`Cities on latitude $${p}^\\circ$, $${l}^\\circ$ of longitude apart. What is the most ${p > 0 ? 'northerly' : 'southerly'} latitude the great circle between them reaches, in degrees?`, `緯度 $${p}^\\circ$、経度差 $${l}^\\circ$ の2都市を結ぶ大円は、最も${p > 0 ? '北' : '南'}でどの緯度に達しますか（度）。`],
        a: { type: 'num', v: pm, tol: 0.15, unit: ['°', '°'] },
        hint: ['On the map the great circle is $\\tan\\varphi = A\\cos\\lambda$, with $\\lambda$ measured from the midpoint.', '地図上で大円は $\\tan\\varphi = A\\cos\\lambda$ と表されます（$\\lambda$ は中点から測ります）。'],
        sol: [[`At the cities $\\lambda = \\pm${l / 2}^\\circ$, so $A = \\tan ${p}^\\circ/\\cos ${l / 2}^\\circ = ${n(Math.tan(rad(p)) / Math.cos(rad(l) / 2), 4)}$.`, `都市では $\\lambda = \\pm${l / 2}^\\circ$ なので $A = \\tan ${p}^\\circ/\\cos ${l / 2}^\\circ = ${n(Math.tan(rad(p)) / Math.cos(rad(l) / 2), 4)}$ です。`], [`The extreme is at $\\lambda = 0$: $\\varphi_{\\max} = \\arctan A = ${n(pm, 2)}^\\circ$, the top of the blue curve on the map.`, `極値は $\\lambda = 0$ にあり、$\\varphi_{\\max} = \\arctan A = ${n(pm, 2)}^\\circ$ です。地図上の青い曲線の頂点です。`]],
        set: { latitude: p, arc: l, pull: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [a, b] = r.sample(CITIES, 2), p1 = rad(a[2]), p2 = rad(b[2]), dl = rad(b[3] - a[3]);
        const c = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl), d = Math.acos(c);
        return {
          q: [`${a[0]} is at $(${a[2]}^\\circ, ${a[3]}^\\circ)$ and ${b[0]} at $(${b[2]}^\\circ, ${b[3]}^\\circ)$ (latitude, longitude). How long is the shortest route between them on a sphere of radius $6371$ km?`, `${a[1]}は $(${a[2]}^\\circ, ${a[3]}^\\circ)$、${b[1]}は $(${b[2]}^\\circ, ${b[3]}^\\circ)$ にあります（緯度、経度）。半径 $6371$ km の球面上での最短経路の長さを求めてください。`],
          a: { type: 'num', v: d * RE, tol: 10, unit: ['km', 'km'] },
          hint: ['Take the dot product of the two unit position vectors: $\\cos d = \\sin\\varphi_1\\sin\\varphi_2 + \\cos\\varphi_1\\cos\\varphi_2\\cos\\Delta\\lambda$.', '2つの単位位置ベクトルの内積をとります：$\\cos d = \\sin\\varphi_1\\sin\\varphi_2 + \\cos\\varphi_1\\cos\\varphi_2\\cos\\Delta\\lambda$。'],
          sol: [[`$\\cos d = ${n(Math.sin(p1) * Math.sin(p2), 4)} + ${n(Math.cos(p1) * Math.cos(p2), 4)}\\cdot\\cos(${n(b[3] - a[3], 2)}^\\circ) = ${n(c, 4)}$.`, `$\\cos d = ${n(Math.sin(p1) * Math.sin(p2), 4)} + ${n(Math.cos(p1) * Math.cos(p2), 4)}\\cdot\\cos(${n(b[3] - a[3], 2)}^\\circ) = ${n(c, 4)}$ です。`], [`$d = ${n(d, 4)}$ rad, so the great-circle distance is about $${km(d * RE)}$ km.`, `$d = ${n(d, 4)}$ rad なので、大円距離は約 $${km(d * RE)}$ km です。`], ['The geodesic is the arc of the great circle through both cities and the centre: the plane through the centre is what makes it straight on the sphere.', '測地線は2都市と中心を通る大円の弧です。中心を通る平面であることが、球面上で「まっすぐ」であることを意味します。']],
        };
      }
      if (form === 1) {
        const p = r.pick([20, 30, 40, 45, 50, 60, -30, -40, -50]), l = r.pick([40, 60, 90, 100, 120, 140]);
        const pm = Math.atan(Math.tan(rad(p)) / Math.cos(rad(l) / 2)), a0 = dg(Math.asin(Math.cos(pm) / Math.cos(rad(p))));
        return {
          q: [`A plane flies the great circle east from one city on latitude $${p}^\\circ$ to another $${l}^\\circ$ further east on the same latitude. At departure, what angle does its heading make with due ${p > 0 ? 'north' : 'south'}, in degrees?`, `飛行機が緯度 $${p}^\\circ$ の都市から、同じ緯度で経度が $${l}^\\circ$ 東の都市まで大円に沿って東へ飛びます。出発時の進行方向は真${p > 0 ? '北' : '南'}から何度ですか。`],
          a: { type: 'num', v: a0, tol: 0.2, unit: ['°', '°'] },
          hint: ['Clairaut: along a great circle $\\cos\\varphi\\,\\sin\\alpha$ is constant, where $\\alpha$ is the heading from the meridian. At the highest point the heading is due east.', 'クレローの定理：大円に沿って $\\cos\\varphi\\,\\sin\\alpha$ は一定です（$\\alpha$ は子午線からの方位角）。最も極に近い点では進行方向は真東です。'],
          sol: [[`The extreme latitude satisfies $\\tan\\varphi_{\\max} = \\tan ${p}^\\circ/\\cos ${l / 2}^\\circ$, so $\\varphi_{\\max} = ${n(dg(pm), 3)}^\\circ$.`, `最も極寄りの緯度は $\\tan\\varphi_{\\max} = \\tan ${p}^\\circ/\\cos ${l / 2}^\\circ$ を満たし、$\\varphi_{\\max} = ${n(dg(pm), 3)}^\\circ$ です。`], [`Clairaut gives $\\cos ${p}^\\circ\\sin\\alpha_0 = \\cos\\varphi_{\\max}\\cdot 1$, so $\\sin\\alpha_0 = ${n(Math.cos(pm) / Math.cos(rad(p)), 4)}$.`, `クレローの定理より $\\cos ${p}^\\circ\\sin\\alpha_0 = \\cos\\varphi_{\\max}\\cdot 1$ なので $\\sin\\alpha_0 = ${n(Math.cos(pm) / Math.cos(rad(p)), 4)}$ です。`], [`$\\alpha_0 = ${n(a0, 2)}^\\circ$: the plane sets off $${n(90 - a0, 1)}^\\circ$ ${p > 0 ? 'north' : 'south'} of east, though the destination is due east on the map.`, `$\\alpha_0 = ${n(a0, 2)}^\\circ$ で、目的地は地図上では真東なのに、飛行機は東から $${n(90 - a0, 1)}^\\circ$ ${p > 0 ? '北' : '南'}寄りに出発します。`]],
          set: { latitude: p, arc: l, pull: 1 },
        };
      }
      const p = r.pick([30, 40, 50, 60, -40, -50]), l = r.pick([80, 100, 120, 140]);
      return {
        q: [`In the figure's family, the path with pull $s$ is $\\varphi_s(\\lambda) = \\varphi_0 + s\\,\\big(\\varphi_{\\text{gc}}(\\lambda) - \\varphi_0\\big)$ (latitude $${p}^\\circ$, gap $${l}^\\circ$). At which pull is the length stationary, and what kind of stationary point is it?`, `図の経路の族では、引き寄せ $s$ の経路は $\\varphi_s(\\lambda) = \\varphi_0 + s\\,\\big(\\varphi_{\\text{gc}}(\\lambda) - \\varphi_0\\big)$ です（緯度 $${p}^\\circ$、経度差 $${l}^\\circ$）。長さはどの引き寄せで停留し、それはどんな停留点ですか。`],
        a: { type: 'choice', opts: [['$s = 1$, a minimum', '$s = 1$ で最小'], ['$s = 0$, a minimum', '$s = 0$ で最小'], ['$s = 1$, a maximum', '$s = 1$ で最大'], ['$s = \\tfrac12$, a minimum', '$s = \\tfrac12$ で最小']], v: 0 },
        hint: ['The great circle solves the geodesic equation, so every variation of it has zero first-order effect on length.', '大円は測地線の方程式の解なので、どんな変分も長さに1次の影響を与えません。'],
        sol: [['$s = 1$ is the great circle, a solution of the Euler–Lagrange equation for $\\int ds$; so $\\tfrac{d}{ds}\\text{length} = 0$ there.', '$s = 1$ は大円で、$\\int ds$ のオイラー・ラグランジュ方程式の解です。よってそこで長さの微分は 0 です。'], [`The cities are less than $180^\\circ$ apart along it (central angle $${n(dg(gcLen(p, l)), 1)}^\\circ$), so there is no conjugate point between them and it is a strict minimum: the length curve below the map has its lowest point at $1$.`, `大円に沿った2都市の間隔は $180^\\circ$ 未満（中心角 $${n(dg(gcLen(p, l)), 1)}^\\circ$）なので間に共役点はなく、狭義の最小です。地図の下の長さのグラフは $1$ で最低になります。`]],
        set: { latitude: p, arc: l, pull: 1 },
      };
    },
  ];

  /* ---------- 3. least action ---------- */
  const SPANS = [[PI / 2, '\\tfrac{\\pi}{2}'], [3 * PI / 4, '\\tfrac{3\\pi}{4}'], [5 * PI / 4, '\\tfrac{5\\pi}{4}'], [3 * PI / 2, '\\tfrac{3\\pi}{2}']];
  const coef = (T, k) => (T / 4) * ((k * PI / T) ** 2 - 1);
  Q['least-action'] = [
    (r) => {
      const form = r.int(0, 2), si = r.int(0, 3), [T, Tt] = SPANS[si];
      if (form === 0) {
        return {
          q: [`For $L = \\tfrac12(\\dot q^2 - q^2)$ from $q(0) = 0$ to $q(T) = 1$, the classical path is $q^* = \\sin t/\\sin T$. Its action is $S[q^*] = \\tfrac12\\cot T$. Evaluate it for $T = ${Tt}$.`, `$L = \\tfrac12(\\dot q^2 - q^2)$ で $q(0) = 0$ から $q(T) = 1$ への古典経路は $q^* = \\sin t/\\sin T$、その作用は $S[q^*] = \\tfrac12\\cot T$ です。$T = ${Tt}$ のときの値を求めてください。`],
          a: { type: 'num', v: 0.5 / Math.tan(T), tol: 1e-4 },
          hint: ['Find $\\cot T$ from the unit circle.', '単位円から $\\cot T$ を求めます。'],
          sol: [[`$\\cot ${Tt} = ${n(1 / Math.tan(T), 4)}$.`, `$\\cot ${Tt} = ${n(1 / Math.tan(T), 4)}$ です。`], [`$S[q^*] = ${n(0.5 / Math.tan(T), 4)}$, which the readout shows as $\\tfrac12\\cot T$.`, `$S[q^*] = ${n(0.5 / Math.tan(T), 4)}$ で、読み取り欄の $\\tfrac12\\cot T$ と一致します。`]],
          set: { span: si, amplitude: 0 },
        };
      }
      if (form === 1) {
        const f = r.pick([0.25, 0.5, 0.75]), t = f * T, q = Math.sin(t) / Math.sin(T);
        return {
          q: [`With $T = ${Tt}$, what is the height of the classical path $q^* = \\sin t/\\sin T$ at $t = ${frac(f * 4, 4)}T$?`, `$T = ${Tt}$ のとき、古典経路 $q^* = \\sin t/\\sin T$ の $t = ${frac(f * 4, 4)}T$ での高さはいくつですか。`],
          a: { type: 'num', v: q, tol: 0.002 },
          hint: ['Substitute $t$ and divide by $\\sin T$.', '$t$ を代入して $\\sin T$ で割ります。'],
          sol: [[`$t = ${n(t, 4)}$, $\\sin t = ${n(Math.sin(t), 4)}$ and $\\sin T = ${n(Math.sin(T), 4)}$.`, `$t = ${n(t, 4)}$、$\\sin t = ${n(Math.sin(t), 4)}$、$\\sin T = ${n(Math.sin(T), 4)}$ です。`], [`$q^* = ${n(q, 4)}$.${T > PI ? ' Since $\\sin T < 0$ the path first swings to negative $q$ before arriving at $1$.' : ''}`, `$q^* = ${n(q, 4)}$ です。${T > PI ? '$\\sin T < 0$ なので、経路は $1$ に着く前にいったん負の側へ振れます。' : ''}`]],
          set: { span: si, amplitude: 0 },
        };
      }
      return {
        q: [`For the oscillator with $T = ${Tt}$, is the classical path a minimum of the action or only a saddle?`, `$T = ${Tt}$ の振動子で、古典経路は作用の最小ですか、それとも鞍点にすぎませんか。`],
        a: { type: 'choice', opts: [['A minimum: $T < \\pi$', '最小：$T < \\pi$'], ['A saddle: $T > \\pi$', '鞍点：$T > \\pi$']], v: T > PI ? 1 : 0, fixed: true },
        hint: ['Compare $T$ with the first conjugate time $\\pi$, where the slowest variation stops costing action.', '最も遅い変分が作用を増やさなくなる最初の共役時刻 $\\pi$ と $T$ を比べてください。'],
        sol: [['The $k = 1$ variation changes the action by $\\varepsilon^2\\tfrac T4\\big(\\tfrac{\\pi^2}{T^2} - 1\\big)$, which is negative exactly when $T > \\pi$.', '$k = 1$ の変分による作用の変化は $\\varepsilon^2\\tfrac T4\\big(\\tfrac{\\pi^2}{T^2} - 1\\big)$ で、$T > \\pi$ のときちょうど負になります。'], [T > PI ? `$T = ${Tt} > \\pi$, so a saddle: still stationary, but not least.` : `$T = ${Tt} < \\pi$, so every variation raises the action: a minimum.`, T > PI ? `$T = ${Tt} > \\pi$ なので鞍点です。停留していますが最小ではありません。` : `$T = ${Tt} < \\pi$ なので、どの変分も作用を上げます。最小です。`]],
        set: { span: si, mode: 1, amplitude: 0.5 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const si = r.int(0, 3), [T, Tt] = SPANS[si], k = r.int(1, 3), e = r.pick([-1, -0.75, -0.5, -0.35, 0.25, 0.35, 0.5, 0.75, 1]), c = coef(T, k);
        return {
          q: [`With $T = ${Tt}$, add $\\varepsilon\\sin(${k === 1 ? '' : k}\\pi t/T)$ with $\\varepsilon = ${e}$ to the classical path. What is the change of action $\\Delta S$?`, `$T = ${Tt}$ で、古典経路に $\\varepsilon\\sin(${k === 1 ? '' : k}\\pi t/T)$（$\\varepsilon = ${e}$）を加えます。作用の変化 $\\Delta S$ はいくつですか。`],
          a: { type: 'num', v: e * e * c, tol: 2e-4 + Math.abs(e * e * c) * 0.003 },
          hint: ['The cross term vanishes; $\\Delta S = \\tfrac{\\varepsilon^2}{2}\\int_0^T(\\dot\\eta^2 - \\eta^2)\\,dt$.', '交差項は消え、$\\Delta S = \\tfrac{\\varepsilon^2}{2}\\int_0^T(\\dot\\eta^2 - \\eta^2)\\,dt$ です。'],
          sol: [[`$\\int_0^T\\eta^2\\,dt = \\tfrac T2$ and $\\int_0^T\\dot\\eta^2\\,dt = \\tfrac T2\\big(\\tfrac{${k}\\pi}{T}\\big)^2$, so $\\Delta S = \\varepsilon^2\\tfrac T4\\Big(\\big(\\tfrac{${k}\\pi}{T}\\big)^2 - 1\\Big)$.`, `$\\int_0^T\\eta^2\\,dt = \\tfrac T2$、$\\int_0^T\\dot\\eta^2\\,dt = \\tfrac T2\\big(\\tfrac{${k}\\pi}{T}\\big)^2$ なので $\\Delta S = \\varepsilon^2\\tfrac T4\\Big(\\big(\\tfrac{${k}\\pi}{T}\\big)^2 - 1\\Big)$ です。`], [`The coefficient is $${n(c, 4)}$, so $\\Delta S = ${n(e * e, 4)}\\cdot ${n(c, 4)} = ${n(e * e * c, 4)}$.`, `係数は $${n(c, 4)}$ なので $\\Delta S = ${n(e * e, 4)}\\cdot ${n(c, 4)} = ${n(e * e * c, 4)}$ です。`], [c < 0 ? 'Negative: this variation lowers the action, so the classical path is not a minimum here.' : 'Positive: this variation costs action.', c < 0 ? '負です。この変分は作用を下げるので、ここでは古典経路は最小ではありません。' : '正です。この変分は作用を増やします。']],
          set: { span: si, mode: k, amplitude: e },
        };
      }
      const T = r.pick([[0.8 * PI, '0.8\\pi', 0], [1.5 * PI, '\\tfrac{3\\pi}{2}', 3], [2.5 * PI, '\\tfrac{5\\pi}{2}', -1], [3.2 * PI, '3.2\\pi', -1], [0.5 * PI, '\\tfrac{\\pi}{2}', 0], [1.25 * PI, '\\tfrac{5\\pi}{4}', 2], [4.5 * PI, '\\tfrac{9\\pi}{2}', -1]]);
      const cnt = Math.floor(T[0] / PI - 1e-9);
      return {
        q: [`For the oscillator path over a time span $T = ${T[1]}$, how many of the variations $\\eta_k = \\sin(k\\pi t/T)$, $k = 1, 2, 3, \\dots$, lower the action?`, `時間幅 $T = ${T[1]}$ の振動子の経路で、変分 $\\eta_k = \\sin(k\\pi t/T)$（$k = 1, 2, 3, \\dots$）のうち作用を下げるものはいくつありますか。`],
        a: { type: 'int', v: cnt },
        hint: ['$\\eta_k$ lowers the action exactly when $k\\pi/T < 1$.', '$\\eta_k$ が作用を下げるのは、ちょうど $k\\pi/T < 1$ のときです。'],
        sol: [['$\\Delta S = \\varepsilon^2\\tfrac T4\\big((k\\pi/T)^2 - 1\\big) < 0 \\iff k < T/\\pi$.', '$\\Delta S = \\varepsilon^2\\tfrac T4\\big((k\\pi/T)^2 - 1\\big) < 0 \\iff k < T/\\pi$ です。'], [`$T/\\pi = ${n(T[0] / PI, 3)}$, so $${cnt}$ of them. This count is the Morse index: the number of conjugate points $\\pi, 2\\pi, \\dots$ passed before $T$.`, `$T/\\pi = ${n(T[0] / PI, 3)}$ なので $${cnt}$ 個です。この個数はモース指数、つまり $T$ より前に通過した共役点 $\\pi, 2\\pi, \\dots$ の数です。`]],
        set: T[2] >= 0 ? { span: T[2], mode: 1 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [w, wsh] = r.pick([[0.5, '2\\pi'], [1, '\\pi'], [2, '\\tfrac{\\pi}{2}'], [3, '\\tfrac{\\pi}{3}'], [4, '\\tfrac{\\pi}{4}'], [0.25, '4\\pi'], [1.5, '\\tfrac{2\\pi}{3}']]);
        return {
          q: [`For $L = \\tfrac12(\\dot q^2 - \\omega^2 q^2)$ with $\\omega = ${w}$ and both ends fixed, beyond what time span $T$ does the classical path stop being a minimum?`, `$L = \\tfrac12(\\dot q^2 - \\omega^2 q^2)$、$\\omega = ${w}$ で両端を固定するとき、時間幅 $T$ がいくつを超えると古典経路は最小でなくなりますか。`],
          a: { type: 'num', v: PI / w, show: wsh },
          hint: ['Find when $\\eta = \\sin(\\pi t/T)$ makes $\\int(\\dot\\eta^2 - \\omega^2\\eta^2)\\,dt$ change sign.', '$\\eta = \\sin(\\pi t/T)$ で $\\int(\\dot\\eta^2 - \\omega^2\\eta^2)\\,dt$ の符号が変わるときを求めます。'],
          sol: [['The second variation along $\\eta_1$ is $\\tfrac T4\\big((\\pi/T)^2 - \\omega^2\\big)$, and $\\eta_1$ is the cheapest variation.', '$\\eta_1$ に沿った第2変分は $\\tfrac T4\\big((\\pi/T)^2 - \\omega^2\\big)$ で、$\\eta_1$ は最も作用を増やさない変分です。'], [`It turns negative when $T > \\pi/\\omega = ${n(PI / w, 4)}$: half a period of the oscillator, the first conjugate point, where paths from the start refocus.`, `$T > \\pi/\\omega = ${n(PI / w, 4)}$ で負になります。振動子の半周期、すなわち出発点からの経路が再び集まる最初の共役点です。`]],
          set: w === 1 ? { span: 2, mode: 1 } : undefined,
        };
      }
      if (form === 1) {
        let si, k, c; do { si = r.int(0, 3); k = r.int(1, 3); c = coef(SPANS[si][0], k); } while (Math.abs(c) < 0.15);
        const D = r.pick([0.05, 0.1, 0.2, 0.3].filter((x) => x <= 0.9 * Math.abs(c))) * Math.sign(c), e = Math.sqrt(D / c);
        return {
          q: [`With $T = ${SPANS[si][1]}$ and the variation $\\eta_${k} = \\sin(${k === 1 ? '' : k}\\pi t/T)$, which amplitude $\\varepsilon > 0$ changes the action by $\\Delta S = ${D}$?`, `$T = ${SPANS[si][1]}$、変分 $\\eta_${k} = \\sin(${k === 1 ? '' : k}\\pi t/T)$ のとき、作用を $\\Delta S = ${D}$ だけ変える振幅 $\\varepsilon > 0$ はいくつですか。`],
          a: { type: 'num', v: e, tol: 0.003 },
          hint: ['$\\Delta S$ is exactly quadratic in $\\varepsilon$ for this quadratic Lagrangian.', 'この2次のラグランジアンでは $\\Delta S$ は $\\varepsilon$ についてちょうど2次です。'],
          sol: [[`The coefficient is $\\tfrac T4\\big((${k}\\pi/T)^2 - 1\\big) = ${n(c, 4)}$.`, `係数は $\\tfrac T4\\big((${k}\\pi/T)^2 - 1\\big) = ${n(c, 4)}$ です。`], [`$\\varepsilon = \\sqrt{${D}/(${n(c, 4)})} = ${n(e, 4)}$.`, `$\\varepsilon = \\sqrt{${D}/(${n(c, 4)})} = ${n(e, 4)}$ です。`], [D < 0 ? 'A negative target is reachable only because this variation is a descent direction: the path is a saddle.' : 'A positive target: this variation raises the action.', D < 0 ? '負の目標に届くのは、この変分が作用を下げる方向だからです。経路は鞍点です。' : '正の目標です。この変分は作用を上げます。']],
          set: { span: si, mode: k, amplitude: Math.round(e * 20) / 20 },
        };
      }
      const k = r.int(1, 3);
      return {
        q: [`For the oscillator $L = \\tfrac12(\\dot q^2 - q^2)$ and the variation $\\eta_${k} = \\sin(${k === 1 ? '' : k}\\pi t/T)$, write the coefficient $c(T)$ in $\\Delta S = \\varepsilon^2 c(T)$ as a function of the time span $T$.`, `振動子 $L = \\tfrac12(\\dot q^2 - q^2)$ と変分 $\\eta_${k} = \\sin(${k === 1 ? '' : k}\\pi t/T)$ について、$\\Delta S = \\varepsilon^2 c(T)$ の係数 $c(T)$ を時間幅 $T$ の関数で表してください。`],
        a: { type: 'expr', v: `${k * k}*pi^2/(4*T) - T/4`, vars: ['T'], dom: { T: [0.5, 5] }, lhs: ['$c(T) =$', '$c(T) =$'] },
        hint: ['Over $[0, T]$, $\\sin^2$ and $\\cos^2$ of $k\\pi t/T$ each average to $\\tfrac12$.', '$[0, T]$ 上で $k\\pi t/T$ の $\\sin^2$ と $\\cos^2$ の平均はどちらも $\\tfrac12$ です。'],
        sol: [[`$\\tfrac12\\int_0^T\\dot\\eta^2\\,dt = \\tfrac12\\cdot\\tfrac{${k * k}\\pi^2}{T^2}\\cdot\\tfrac T2 = \\tfrac{${k * k}\\pi^2}{4T}$ and $\\tfrac12\\int_0^T\\eta^2\\,dt = \\tfrac T4$.`, `$\\tfrac12\\int_0^T\\dot\\eta^2\\,dt = \\tfrac12\\cdot\\tfrac{${k * k}\\pi^2}{T^2}\\cdot\\tfrac T2 = \\tfrac{${k * k}\\pi^2}{4T}$、$\\tfrac12\\int_0^T\\eta^2\\,dt = \\tfrac T4$ です。`], [`$c(T) = \\tfrac{${k * k}\\pi^2}{4T} - \\tfrac T4$, which vanishes at $T = ${k === 1 ? '' : k}\\pi$, the ${['first', 'second', 'third'][k - 1]} conjugate point, and is negative beyond it.`, `$c(T) = \\tfrac{${k * k}\\pi^2}{4T} - \\tfrac T4$ で、${['最初', '2番目', '3番目'][k - 1]}の共役点 $T = ${k === 1 ? '' : k}\\pi$ で 0 になり、それを超えると負になります。`]],
      };
    },
  ];
})();
