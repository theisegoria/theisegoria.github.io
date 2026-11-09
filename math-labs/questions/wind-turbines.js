'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, RHO = 1.225;
  const cp = (a) => 4 * a * (1 - a) ** 2;
  function glauert(lam) {
    const g = (a) => ((1 - a) * (1 - 4 * a) ** 2) / (1 - 3 * a) - lam * lam;
    let lo = 0.25, hi = 1 / 3 - 1e-12; for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (g(m) < 0) lo = m; else hi = m; }
    const a2 = 0.5 * (lo + hi), s0 = Math.log(4), s2 = -Math.log(1 - 3 * a2), N = 1000, h = (s2 - s0) / N;
    const f = (s) => { const a = (1 - Math.exp(-s)) / 3; return ((((1 - a) * (1 - 2 * a) * (1 - 4 * a)) / (1 - 3 * a)) ** 2 * Math.exp(-s)) / 3; };
    let sum = f(s0) + f(s2); for (let i = 1; i < N; i++) sum += f(s0 + i * h) * (i % 2 ? 4 : 2);
    return (24 / (lam * lam)) * ((sum * h) / 3);
  }

  /* ---------------- betz-streamtube ---------------- */
  Q['betz-streamtube'] = [
    (r) => {
      const form = r.int(0, 2), a = r.step(0.05, 0.45, 0.05);
      if (form === 0) return {
        q: [`What is the power coefficient $C_P = 4a(1-a)^2$ at axial induction $a = ${n(a, 2)}$? Four decimals.`, `軸方向誘導係数 $a = ${n(a, 2)}$ でのパワー係数 $C_P = 4a(1-a)^2$ はいくらですか。小数第 4 位まで答えてください。`],
        a: { type: 'num', v: cp(a), tol: 0.00006 },
        hint: ['Substitute.', '代入します。'],
        sol: [[`$4 \\times ${n(a, 2)} \\times ${n(1 - a, 2)}^2$.`, `$4 \\times ${n(a, 2)} \\times ${n(1 - a, 2)}^2$ です。`], [`$C_P = ${n(cp(a), 4)}$, against the Betz maximum 0.5926.`, `$C_P = ${n(cp(a), 4)}$ で、ベッツの最大値は 0.5926 です。`]],
        set: { a },
      };
      if (form === 1) return {
        q: [`With $a = ${n(a, 2)}$, how fast is the far wake as a fraction of the wind speed?`, `$a = ${n(a, 2)}$ のとき、はるか後ろの後流の速さは風速の何倍ですか。`],
        a: { type: 'num', v: 1 - 2 * a, tol: 0.002 },
        hint: ['$U(1 - 2a)$.', '$U(1 - 2a)$ です。'],
        sol: [['Half the slowing happens before the rotor, half after.', '減速の半分はローターの前で、半分は後ろで起こります。'], [`$1 - 2 \\times ${n(a, 2)} = ${n(1 - 2 * a, 2)}$.`, `$1 - 2 \\times ${n(a, 2)} = ${n(1 - 2 * a, 2)}$ です。`]],
        set: { a },
      };
      return {
        q: ['What fraction of the power in the wind through the rotor area can an ideal turbine extract? Give the exact fraction as a decimal to three places.', '理想的な風車は、ローターの面積を通る風のパワーのどれだけを取り出せますか。正確な分数を小数第 3 位まで答えてください。'],
        a: { type: 'num', v: 16 / 27, tol: 0.0006, show: '\\tfrac{16}{27}' },
        hint: ['Maximize $4a(1-a)^2$.', '$4a(1-a)^2$ を最大にします。'],
        sol: [['$\\frac{d}{da}4a(1-a)^2 = 4(1-a)(1-3a) = 0$ at $a = 1/3$.', '$\\frac{d}{da}4a(1-a)^2 = 4(1-a)(1-3a) = 0$ から $a = 1/3$ です。'], ['$C_P = 4 \\cdot \\tfrac13 \\cdot \\tfrac49 = \\tfrac{16}{27} = 0.593$.', '$C_P = 4 \\cdot \\tfrac13 \\cdot \\tfrac49 = \\tfrac{16}{27} = 0.593$ です。']],
        set: { a: 0.33 },
      };
    },
    (r) => {
      const form = r.int(0, 1), R = r.step(20, 110, 5), U = r.step(5, 15, 0.5);
      if (form === 0) {
        const Pw = 0.5 * RHO * PI * R * R * U ** 3 * (16 / 27);
        return {
          q: [`An ideal turbine of radius $${R}$ m in a $${n(U, 1)}$ m/s wind ($\\rho = 1.225$ kg/m³). What is the Betz-limit power? In MW.`, `半径 $${R}$ m の理想的な風車が $${n(U, 1)}$ m/s の風（$\\rho = 1.225$ kg/m³）を受けています。ベッツの限界のパワーはいくらですか。MW で答えてください。`],
          a: { type: 'num', v: Pw / 1e6, rel: 0.005, unit: ['MW', 'MW'] },
          hint: ['$P = \\tfrac{16}{27}\\cdot\\tfrac12\\rho\\pi R^2U^3$.', '$P = \\tfrac{16}{27}\\cdot\\tfrac12\\rho\\pi R^2U^3$ です。'],
          sol: [[`The wind carries $\\tfrac12\\rho\\pi R^2U^3 = ${n((0.5 * RHO * PI * R * R * U ** 3) / 1e6, 4)}$ MW through the disc.`, `風は円盤を通して $\\tfrac12\\rho\\pi R^2U^3 = ${n((0.5 * RHO * PI * R * R * U ** 3) / 1e6, 4)}$ MW を運びます。`], [`Times $16/27$: $${n(Pw / 1e6, 4)}$ MW.`, `$16/27$ を掛けて $${n(Pw / 1e6, 4)}$ MW です。`]],
          set: { a: 0.33, U, R },
        };
      }
      const a = r.step(0.1, 0.45, 0.05), ratio = (1 - a) / (1 - 2 * a);
      return {
        q: [`By what factor is the wake's cross-section larger than the rotor's at $a = ${n(a, 2)}$?`, `$a = ${n(a, 2)}$ のとき、後流の断面積はローターの何倍ですか。`],
        a: { type: 'num', v: ratio, rel: 0.003 },
        hint: ['Continuity: $A(1-a) = A_w(1-2a)$.', '連続の式：$A(1-a) = A_w(1-2a)$ です。'],
        sol: [['The same mass flow passes the disc and the far wake.', '同じ質量流量が円盤とはるか後ろの後流を通ります。'], [`$A_w/A = ${n(1 - a, 2)}/${n(1 - 2 * a, 2)} = ${n(ratio, 4)}$.`, `$A_w/A = ${n(1 - a, 2)}/${n(1 - 2 * a, 2)} = ${n(ratio, 4)}$ です。`]],
        set: { a },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['Write the power coefficient as a function of the induction factor $a$.', 'パワー係数を誘導係数 $a$ の関数として書いてください。'],
        a: { type: 'expr', v: '4*a*(1-a)^2', vars: ['a'], dom: { a: [0.05, 0.45] }, lhs: ['$C_P(a) =$', '$C_P(a) =$'] },
        hint: ['Thrust $2\\rho AU^2a(1-a)$ times the speed at the disc, over $\\tfrac12\\rho AU^3$.', '推力 $2\\rho AU^2a(1-a)$ に円盤での速さを掛け、$\\tfrac12\\rho AU^3$ で割ります。'],
        sol: [['$P = T\\,U(1-a) = 2\\rho AU^3a(1-a)^2$.', '$P = T\\,U(1-a) = 2\\rho AU^3a(1-a)^2$ です。'], ['Dividing by $\\tfrac12\\rho AU^3$ gives $C_P = 4a(1-a)^2$.', '$\\tfrac12\\rho AU^3$ で割ると $C_P = 4a(1-a)^2$ です。']],
      };
      if (form === 1) {
        const target = r.pick([0.3, 0.4, 0.5, 0.55]);
        let lo = 0, hi = 1 / 3; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (cp(m) < target) lo = m; else hi = m; }
        const a = 0.5 * (lo + hi);
        return {
          q: [`Which induction factor below $1/3$ gives $C_P = ${target}$? Three decimals.`, `$1/3$ より小さい誘導係数で $C_P = ${target}$ となるのはいくらですか。小数第 3 位まで答えてください。`],
          a: { type: 'num', v: a, tol: 0.0015 },
          hint: ['Solve $4a(1-a)^2 = $ target numerically.', '$4a(1-a)^2 = $ 目標値 を数値的に解きます。'],
          sol: [['$C_P(a)$ rises from 0 at $a = 0$ to 0.593 at $a = 1/3$.', '$C_P(a)$ は $a = 0$ の 0 から $a = 1/3$ の 0.593 まで増えます。'], [`$a = ${n(a, 4)}$ gives $C_P = ${n(cp(a), 4)}$.`, `$a = ${n(a, 4)}$ で $C_P = ${n(cp(a), 4)}$ です。`]],
          set: { a: Math.round(a * 100) / 100 },
        };
      }
      const U = r.step(6, 14, 1), U2 = U + r.pick([1, 2, 3]);
      return {
        q: [`The wind rises from $${U}$ to $${U2}$ m/s. By what factor does the available power rise?`, `風速が $${U}$ から $${U2}$ m/s に上がります。利用できるパワーは何倍になりますか。`],
        a: { type: 'num', v: (U2 / U) ** 3, rel: 0.003 },
        hint: ['$P \\propto U^3$.', '$P \\propto U^3$ です。'],
        sol: [[`$(${U2}/${U})^3$.`, `$(${U2}/${U})^3$ です。`], [`$= ${n((U2 / U) ** 3, 4)}$: siting a turbine where the wind is a little stronger pays off steeply.`, `$= ${n((U2 / U) ** 3, 4)}$ です。風が少し強い場所に風車を置くと大きな見返りがあります。`]],
      };
    },
  ];

  /* ---------------- bem-blade ---------------- */
  Q['bem-blade'] = [
    (r) => {
      const form = r.int(0, 1), lam = r.step(4, 10, 0.5), U = r.step(5, 15, 0.5), R = r.step(30, 90, 5);
      if (form === 0) return {
        q: [`A rotor of radius $${R}$ m runs at tip-speed ratio $\\lambda = ${n(lam, 1)}$ in a $${n(U, 1)}$ m/s wind. What is its speed in rpm?`, `半径 $${R}$ m のローターが、風速 $${n(U, 1)}$ m/s で周速比 $\\lambda = ${n(lam, 1)}$ で回っています。回転数は何 rpm ですか。`],
        a: { type: 'num', v: (60 * lam * U) / (2 * PI * R), rel: 0.004, unit: ['rpm', 'rpm'] },
        hint: ['$\\Omega = \\lambda U/R$ in rad/s.', '$\\Omega = \\lambda U/R$（rad/s）です。'],
        sol: [[`$\\Omega = ${n(lam, 1)} \\times ${n(U, 1)}/${R} = ${n((lam * U) / R, 4)}$ rad/s.`, `$\\Omega = ${n(lam, 1)} \\times ${n(U, 1)}/${R} = ${n((lam * U) / R, 4)}$ rad/s です。`], [`$\\times 60/2\\pi = ${n((60 * lam * U) / (2 * PI * R), 3)}$ rpm.`, `$60/2\\pi$ を掛けて $${n((60 * lam * U) / (2 * PI * R), 3)}$ rpm です。`]],
        ...(R === 60 ? { set: { lam: Math.min(13, lam), U } } : {}),
      };
      const rr = r.step(0.2, 1, 0.1);
      return {
        q: [`At $\\lambda = ${n(lam, 1)}$, what is the local speed ratio $\\lambda_r = \\lambda r/R$ of the section at $r/R = ${n(rr, 1)}$?`, `$\\lambda = ${n(lam, 1)}$ のとき、$r/R = ${n(rr, 1)}$ の断面の局所速度比 $\\lambda_r = \\lambda r/R$ はいくらですか。`],
        a: { type: 'num', v: lam * rr, tol: 0.002 },
        hint: ['Multiply.', '掛け算です。'],
        sol: [[`$${n(lam, 1)} \\times ${n(rr, 1)}$.`, `$${n(lam, 1)} \\times ${n(rr, 1)}$ です。`], [`$\\lambda_r = ${n(lam * rr, 2)}$: inner sections move slowly and meet the wind at a steep angle.`, `$\\lambda_r = ${n(lam * rr, 2)}$ です。内側の断面はゆっくり動き、急な角度で風に当たります。`]],
        set: { lam: Math.min(13, lam) },
      };
    },
    (r) => {
      const form = r.int(0, 1), lr = r.step(0.5, 8, 0.5);
      if (form === 0) {
        const phi = (2 / 3) * Math.atan(1 / lr);
        return {
          q: [`For the Betz-optimum rotor, the inflow angle is $\\varphi = \\tfrac23\\arctan(1/\\lambda_r)$. What is it at $\\lambda_r = ${n(lr, 1)}$? In degrees.`, `ベッツ最適のローターでは流入角は $\\varphi = \\tfrac23\\arctan(1/\\lambda_r)$ です。$\\lambda_r = ${n(lr, 1)}$ では何度ですか。`],
          a: { type: 'num', v: (phi * 180) / PI, rel: 0.004, unit: ['°', '°'] },
          hint: ['Compute the arctangent in degrees and take two thirds.', '逆正接を度で計算し、3 分の 2 をとります。'],
          sol: [[`$\\arctan(1/${n(lr, 1)}) = ${n((Math.atan(1 / lr) * 180) / PI, 3)}^\\circ$.`, `$\\arctan(1/${n(lr, 1)}) = ${n((Math.atan(1 / lr) * 180) / PI, 3)}^\\circ$ です。`], [`$\\varphi = ${n((phi * 180) / PI, 3)}^\\circ$; subtracting the design angle of attack gives the twist.`, `$\\varphi = ${n((phi * 180) / PI, 3)}^\\circ$ です。設計迎角を引くとねじりが得られます。`]],
        };
      }
      const a = r.step(0.2, 0.4, 0.05), ap = r.step(0, 0.05, 0.01), phi = Math.atan2(1 - a, lr * (1 + ap));
      return {
        q: [`A section at $\\lambda_r = ${n(lr, 1)}$ with $a = ${n(a, 2)}$ and $a^{\\prime} = ${n(ap, 2)}$. What is the inflow angle $\\varphi$? In degrees.`, `$\\lambda_r = ${n(lr, 1)}$、$a = ${n(a, 2)}$、$a^{\\prime} = ${n(ap, 2)}$ の断面があります。流入角 $\\varphi$ は何度ですか。`],
        a: { type: 'num', v: (phi * 180) / PI, rel: 0.004, unit: ['°', '°'] },
        hint: ['$\\tan\\varphi = (1 - a)/(\\lambda_r(1 + a^{\\prime}))$.', '$\\tan\\varphi = (1 - a)/(\\lambda_r(1 + a^{\\prime}))$ です。'],
        sol: [[`$\\tan\\varphi = ${n(1 - a, 2)}/${n(lr * (1 + ap), 3)} = ${n(Math.tan(phi), 4)}$.`, `$\\tan\\varphi = ${n(1 - a, 2)}/${n(lr * (1 + ap), 3)} = ${n(Math.tan(phi), 4)}$ です。`], [`$\\varphi = ${n((phi * 180) / PI, 3)}^\\circ$.`, `$\\varphi = ${n((phi * 180) / PI, 3)}^\\circ$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['Write the Betz-optimum inflow angle as a function of the local speed ratio $x = \\lambda_r$, in radians.', 'ベッツ最適の流入角を、局所速度比 $x = \\lambda_r$ の関数としてラジアンで書いてください。'],
        a: { type: 'expr', v: '(2/3)*atan(1/x)', vars: ['x'], dom: { x: [0.3, 8] }, lhs: ['$\\varphi(x) =$', '$\\varphi(x) =$'] },
        hint: ['Two thirds of the angle of the undisturbed relative wind.', '乱されない相対風の角度の 3 分の 2 です。'],
        sol: [['Without induction the relative wind arrives at $\\arctan(1/\\lambda_r)$.', '誘導がなければ相対風は $\\arctan(1/\\lambda_r)$ で当たります。'], ['The optimum rotor turns it by a third: $\\varphi = \\tfrac23\\arctan(1/x)$.', '最適なローターはそれを 3 分の 1 曲げます：$\\varphi = \\tfrac23\\arctan(1/x)$ です。']],
      };
      if (form === 1) {
        const U = r.step(10, 25, 1), Ur = r.step(9, 13, 0.5), Prated = 0.5 * RHO * PI * 60 * 60 * Ur ** 3 * 0.45, Cpneed = Prated / (0.5 * RHO * PI * 60 * 60 * U ** 3);
        if (U <= Ur) return { q: ['At which wind speed does the turbine reach rated power if rated power equals $C_P = 0.45$ at 12 m/s?', '定格パワーが 12 m/s での $C_P = 0.45$ に等しいとき、風車は何 m/s で定格パワーに達しますか。'], a: { type: 'num', v: 12, tol: 0.01, unit: ['m/s', 'm/s'] }, hint: ['By definition.', '定義どおりです。'], sol: [['Rated power is reached where $C_P\\tfrac12\\rho AU^3$ first equals the rating.', '定格パワーには、$C_P\\tfrac12\\rho AU^3$ が初めて定格に等しくなる所で達します。'], ['That is 12 m/s here.', 'ここでは 12 m/s です。']] };
        return {
          q: [`Rated power is reached at $${n(Ur, 1)}$ m/s with $C_P = 0.45$. What $C_P$ must the pitch control hold at $${U}$ m/s to stay at rated power?`, `$C_P = 0.45$ で $${n(Ur, 1)}$ m/s のとき定格パワーに達します。$${U}$ m/s で定格パワーを保つには、ピッチ制御は $C_P$ をいくらにしなければなりませんか。`],
          a: { type: 'num', v: Cpneed, rel: 0.004 },
          hint: ['$C_P U^3$ must stay constant.', '$C_PU^3$ を一定に保ちます。'],
          sol: [[`$C_P = 0.45 \\times (${n(Ur, 1)}/${U})^3$.`, `$C_P = 0.45 \\times (${n(Ur, 1)}/${U})^3$ です。`], [`$= ${n(Cpneed, 4)}$: the blades are pitched towards feather to spill the excess.`, `$= ${n(Cpneed, 4)}$ です。ブレードをフェザー側へ回して余分を逃がします。`]],
        };
      }
      const lam = r.step(3, 12, 1), g = glauert(lam);
      return {
        q: [`What is Glauert's ideal maximum power coefficient at $\\lambda = ${lam}$? Three decimals.`, `$\\lambda = ${lam}$ でのグラウアートの理想の最大パワー係数はいくらですか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: g, tol: 0.0015 },
        hint: ['Read it from the curve, or integrate $\\frac{8}{\\lambda^2}\\int a^{\\prime}(1-a)\\lambda_r^3\\,d\\lambda_r$.', '曲線から読むか、$\\frac{8}{\\lambda^2}\\int a^{\\prime}(1-a)\\lambda_r^3\\,d\\lambda_r$ を積分します。'],
        sol: [['Wake rotation costs most at low $\\lambda$.', '後流の回転の損失は $\\lambda$ が低いほど大きくなります。'], [`$C_{P,\\max}(${lam}) = ${n(g, 4)}$, below $16/27 = 0.5926$.`, `$C_{P,\\max}(${lam}) = ${n(g, 4)}$ で、$16/27 = 0.5926$ より小さくなります。`]],
        set: { lam },
      };
    },
  ];

  /* ---------------- tip-vortex-wake ---------------- */
  Q['tip-vortex-wake'] = [
    (r) => {
      const lam = r.step(3, 12, 0.5), U = r.step(5, 14, 0.5);
      return {
        q: [`What is the blade tip speed at $\\lambda = ${n(lam, 1)}$ in a $${n(U, 1)}$ m/s wind? In m/s.`, `風速 $${n(U, 1)}$ m/s、$\\lambda = ${n(lam, 1)}$ でのブレードの翼端の速さは何 m/s ですか。`],
        a: { type: 'num', v: lam * U, tol: 0.05, unit: ['m/s', 'm/s'] },
        hint: ['$\\Omega R = \\lambda U$.', '$\\Omega R = \\lambda U$ です。'],
        sol: [[`$${n(lam, 1)} \\times ${n(U, 1)}$.`, `$${n(lam, 1)} \\times ${n(U, 1)}$ です。`], [`$= ${n(lam * U, 3)}$ m/s.`, `$= ${n(lam * U, 3)}$ m/s です。`]],
        set: { lam: Math.min(12, lam), U },
      };
    },
    (r) => {
      const form = r.int(0, 1), lam = r.step(3, 12, 0.5);
      if (form === 0) {
        const d = (2 * PI * (2 / 3)) / (3 * lam);
        return {
          q: [`Three blades, $a = 1/3$, $\\lambda = ${n(lam, 1)}$. How far apart along the wake are successive tip vortices, in rotor radii?`, `3 枚のブレード、$a = 1/3$、$\\lambda = ${n(lam, 1)}$ のとき、続く翼端渦は後流に沿って回転半径の何倍離れていますか。`],
          a: { type: 'num', v: d, rel: 0.004 },
          hint: ['In one turn the wake moves $2\\pi(1-a)R/\\lambda$; three tips share it.', '1 回転で後流は $2\\pi(1-a)R/\\lambda$ 動き、三つの翼端がそれを分け合います。'],
          sol: [[`One turn takes $2\\pi R/(\\lambda U)$; the wake moves $U(1-a)$ times that $= ${n((2 * PI * (2 / 3)) / lam, 4)}R$.`, `1 回転には $2\\pi R/(\\lambda U)$ かかり、後流はその $U(1-a)$ 倍 $= ${n((2 * PI * (2 / 3)) / lam, 4)}R$ 動きます。`], [`Divided by 3 blades: $${n(d, 4)}R$.`, `3 枚で割って $${n(d, 4)}R$ です。`]],
          set: { lam: Math.min(12, lam) },
        };
      }
      const tip = r.step(70, 90, 5), R = r.step(40, 120, 10), rpm = (60 * tip) / (2 * PI * R);
      return {
        q: [`A rotor of radius $${R}$ m is limited to a tip speed of $${tip}$ m/s. What is its maximum speed in rpm?`, `半径 $${R}$ m のローターの翼端の速さは $${tip}$ m/s に制限されています。最大回転数は何 rpm ですか。`],
        a: { type: 'num', v: rpm, rel: 0.004, unit: ['rpm', 'rpm'] },
        hint: ['$n = 60\\,\\Omega R/(2\\pi R)$.', '$n = 60\\,\\Omega R/(2\\pi R)$ です。'],
        sol: [[`$\\Omega = ${tip}/${R} = ${n(tip / R, 4)}$ rad/s.`, `$\\Omega = ${tip}/${R} = ${n(tip / R, 4)}$ rad/s です。`], [`$${n(rpm, 3)}$ rpm: big rotors turn slowly.`, `$${n(rpm, 3)}$ rpm です。大きなローターはゆっくり回ります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lam = r.step(1, 10, 1), g = glauert(lam);
        return {
          q: [`How much of the Betz limit does Glauert's ideal rotor achieve at $\\lambda = ${lam}$? As a percentage.`, `$\\lambda = ${lam}$ で、グラウアートの理想ローターはベッツの限界の何パーセントに達しますか。`],
          a: { type: 'num', v: (100 * g) / (16 / 27), rel: 0.004, unit: ['%', '%'] },
          hint: ['Divide $C_{P,\\max}(\\lambda)$ by $16/27$.', '$C_{P,\\max}(\\lambda)$ を $16/27$ で割ります。'],
          sol: [[`$C_{P,\\max}(${lam}) = ${n(g, 4)}$.`, `$C_{P,\\max}(${lam}) = ${n(g, 4)}$ です。`], [`$${n(g, 4)}/0.5926 = ${n((100 * g) / (16 / 27), 3)}\\%$.`, `$${n(g, 4)}/0.5926 = ${n((100 * g) / (16 / 27), 3)}\\%$ です。`]],
          set: { lam },
        };
      }
      if (form === 1) return {
        q: ['Write the rotor speed in rpm as a function of radius $R$ (m) for $\\lambda = 7$ and $U = 10$ m/s.', '$\\lambda = 7$、$U = 10$ m/s のとき、回転数（rpm）を半径 $R$（m）の関数として書いてください。'],
        a: { type: 'expr', v: '60*70/(2*pi*R)', vars: ['R'], dom: { R: [10, 120] }, lhs: ['$n(R) =$', '$n(R) =$'] },
        hint: ['$n = 60\\lambda U/(2\\pi R)$.', '$n = 60\\lambda U/(2\\pi R)$ です。'],
        sol: [['$\\Omega = \\lambda U/R = 70/R$ rad/s.', '$\\Omega = \\lambda U/R = 70/R$ rad/s です。'], ['$n = 60 \\times 70/(2\\pi R) = 4200/(2\\pi R)$.', '$n = 60 \\times 70/(2\\pi R) = 4200/(2\\pi R)$ です。']],
        set: { lam: 7, U: 10 },
      };
      return {
        q: ['As $\\lambda \\to \\infty$, what does Glauert\'s ideal power coefficient approach?', '$\\lambda \\to \\infty$ のとき、グラウアートの理想のパワー係数は何に近づきますか。'],
        a: { type: 'num', v: 16 / 27, tol: 0.0006, show: '\\tfrac{16}{27}' },
        hint: ['Wake rotation vanishes for a fast rotor.', '速いローターでは後流の回転が消えます。'],
        sol: [['At high tip-speed ratio the torque, and so the swirl, needed for a given power goes to zero.', '周速比が高いと、一定のパワーに必要なトルク、したがって旋回はゼロに近づきます。'], ['So the Betz limit $16/27$ is recovered.', 'したがってベッツの限界 $16/27$ に戻ります。']],
      };
    },
  ];
})();
