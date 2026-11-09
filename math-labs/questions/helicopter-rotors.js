'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, DEG = PI / 180;

  /* ---------------- swashplate ---------------- */
  Q['swashplate'] = [
    (r) => {
      const th0 = r.step(2, 12, 0.5), th1s = r.step(-6, -1, 0.5), side = r.pick([[90, 'advancing', '前進側', 1], [270, 'retreating', '後退側', -1]]);
      const v = th0 + side[3] * th1s;
      return {
        q: [`Collective $\\theta_0 = ${n(th0, 1)}^\\circ$ and cyclic $\\theta_{1s} = ${n(th1s, 1)}^\\circ$, $\\theta_{1c} = 0$. What is the pitch of the ${side[1]} blade at $\\psi = ${side[0]}^\\circ$? In degrees.`, `コレクティブ $\\theta_0 = ${n(th0, 1)}^\\circ$、サイクリック $\\theta_{1s} = ${n(th1s, 1)}^\\circ$、$\\theta_{1c} = 0$ です。$\\psi = ${side[0]}^\\circ$ の${side[2]}ブレードのピッチは何度ですか。`],
        a: { type: 'num', v, tol: 0.05, unit: ['°', '°'] },
        hint: ['$\\theta = \\theta_0 + \\theta_{1s}\\sin\\psi$.', '$\\theta = \\theta_0 + \\theta_{1s}\\sin\\psi$ です。'],
        sol: [[`$\\sin ${side[0]}^\\circ = ${side[3]}$.`, `$\\sin ${side[0]}^\\circ = ${side[3]}$ です。`], [`$\\theta = ${n(th0, 1)} + (${n(th1s, 1)})(${side[3]}) = ${n(v, 1)}^\\circ$.`, `$\\theta = ${n(th0, 1)} + (${n(th1s, 1)})(${side[3]}) = ${n(v, 1)}^\\circ$ です。`]],
        set: { th0, th1s, th1c: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1), th0 = r.step(2, 12, 0.5), c = r.step(-6, 6, 0.5), s = r.step(-6, 6, 0.5), psi = r.pick([0, 30, 45, 60, 120, 150, 210, 300]);
      if (form === 0) {
        const v = th0 + c * Math.cos(psi * DEG) + s * Math.sin(psi * DEG);
        return {
          q: [`$\\theta_0 = ${n(th0, 1)}^\\circ$, $\\theta_{1c} = ${n(c, 1)}^\\circ$, $\\theta_{1s} = ${n(s, 1)}^\\circ$. What is the blade pitch at $\\psi = ${psi}^\\circ$?`, `$\\theta_0 = ${n(th0, 1)}^\\circ$、$\\theta_{1c} = ${n(c, 1)}^\\circ$、$\\theta_{1s} = ${n(s, 1)}^\\circ$ のとき、$\\psi = ${psi}^\\circ$ でのブレードのピッチは何度ですか。`],
          a: { type: 'num', v, tol: 0.02, unit: ['°', '°'] },
          hint: ['Evaluate $\\theta_0 + \\theta_{1c}\\cos\\psi + \\theta_{1s}\\sin\\psi$.', '$\\theta_0 + \\theta_{1c}\\cos\\psi + \\theta_{1s}\\sin\\psi$ を計算します。'],
          sol: [[`$\\cos ${psi}^\\circ = ${n(Math.cos(psi * DEG), 4)}$, $\\sin ${psi}^\\circ = ${n(Math.sin(psi * DEG), 4)}$.`, `$\\cos ${psi}^\\circ = ${n(Math.cos(psi * DEG), 4)}$、$\\sin ${psi}^\\circ = ${n(Math.sin(psi * DEG), 4)}$ です。`], [`$\\theta = ${n(v, 3)}^\\circ$.`, `$\\theta = ${n(v, 3)}^\\circ$ です。`]],
          set: { th0, th1c: c, th1s: s },
        };
      }
      const amp = Math.hypot(c, s);
      return {
        q: [`With $\\theta_{1c} = ${n(c, 1)}^\\circ$ and $\\theta_{1s} = ${n(s, 1)}^\\circ$, how far above $\\theta_0$ does the pitch rise at its maximum?`, `$\\theta_{1c} = ${n(c, 1)}^\\circ$、$\\theta_{1s} = ${n(s, 1)}^\\circ$ のとき、ピッチは最大で $\\theta_0$ より何度上がりますか。`],
        a: { type: 'num', v: amp, tol: 0.02, unit: ['°', '°'] },
        hint: ['$a\\cos\\psi + b\\sin\\psi$ has amplitude $\\sqrt{a^2 + b^2}$.', '$a\\cos\\psi + b\\sin\\psi$ の振幅は $\\sqrt{a^2 + b^2}$ です。'],
        sol: [[`$\\sqrt{${n(c, 1)}^2 + ${n(s, 1)}^2}$.`, `$\\sqrt{${n(c, 1)}^2 + ${n(s, 1)}^2}$ です。`], [`$= ${n(amp, 3)}^\\circ$, reached at $\\psi = ${n(((Math.atan2(s, c) / DEG) + 360) % 360, 1)}^\\circ$.`, `$= ${n(amp, 3)}^\\circ$ で、$\\psi = ${n(((Math.atan2(s, c) / DEG) + 360) % 360, 1)}^\\circ$ で達します。`]],
        set: { th0, th1c: c, th1s: s },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rh = r.pick([0.15, 0.2, 0.25, 0.3]), dth = r.step(1, 8, 0.5), dz = rh * dth * DEG;
        return {
          q: [`A pitch horn of length $r_h = ${rh}$ m. How far must the pitch link move to change the pitch by $${n(dth, 1)}^\\circ$? In mm.`, `長さ $r_h = ${rh}$ m のピッチホーンがあります。ピッチを $${n(dth, 1)}^\\circ$ 変えるには、ピッチリンクを何 mm 動かさなければなりませんか。`],
          a: { type: 'num', v: dz * 1000, rel: 0.01, unit: ['mm', 'mm'] },
          hint: ['Small angles: $\\Delta z \\approx r_h\\,\\Delta\\theta$ in radians.', '小さな角では $\\Delta z \\approx r_h\\,\\Delta\\theta$（ラジアン）です。'],
          sol: [[`$${n(dth, 1)}^\\circ = ${n(dth * DEG, 5)}$ rad.`, `$${n(dth, 1)}^\\circ = ${n(dth * DEG, 5)}$ rad です。`], [`$\\Delta z = ${rh} \\times ${n(dth * DEG, 5)} = ${n(dz * 1000, 3)}$ mm: small motions, large effect.`, `$\\Delta z = ${rh} \\times ${n(dth * DEG, 5)} = ${n(dz * 1000, 3)}$ mm です。小さな動きで大きな効果が得られます。`]],
        };
      }
      if (form === 1) {
        return {
          q: ['Write the blade pitch as a function of azimuth $\\psi$ (write $p$) for $\\theta_0 = 6^\\circ$, $\\theta_{1c} = 0$, $\\theta_{1s} = -4^\\circ$, in degrees.', '$\\theta_0 = 6^\\circ$、$\\theta_{1c} = 0$、$\\theta_{1s} = -4^\\circ$ のときのブレードのピッチ（度）を、方位角 $\\psi$（$p$ と書きます）の関数として書いてください。'],
          a: { type: 'expr', v: '6-4*sin(p)', vars: ['p'], dom: { p: [0, 6.2] }, lhs: ['$\\theta(\\psi) =$', '$\\theta(\\psi) =$'] },
          hint: ['Only the sine term is present.', 'サインの項だけがあります。'],
          sol: [['$\\theta = \\theta_0 + \\theta_{1s}\\sin\\psi$.', '$\\theta = \\theta_0 + \\theta_{1s}\\sin\\psi$ です。'], ['$\\theta(\\psi) = 6 - 4\\sin\\psi$: least on the advancing side, greatest on the retreating side.', '$\\theta(\\psi) = 6 - 4\\sin\\psi$ で、前進側で最小、後退側で最大です。']],
          set: { th0: 6, th1c: 0, th1s: -4 },
        };
      }
      const want = r.pick([[90, 'advancing side (ψ = 90°)', '前進側（ψ = 90°）', -1], [270, 'retreating side (ψ = 270°)', '後退側（ψ = 270°）', 1]]), d = r.step(2, 6, 0.5), th0 = r.step(4, 10, 0.5);
      return {
        q: [`What value of $\\theta_{1s}$ gives $${n(th0 - d, 1)}^\\circ$ on the ${want[1].replace('ψ = ' + want[0] + '°', '$\\psi = ' + want[0] + '^\\circ$')} with $\\theta_0 = ${n(th0, 1)}^\\circ$ and $\\theta_{1c} = 0$?`, `$\\theta_0 = ${n(th0, 1)}^\\circ$、$\\theta_{1c} = 0$ のとき、${want[2].replace('ψ = ' + want[0] + '°', '$\\psi = ' + want[0] + '^\\circ$')}で $${n(th0 - d, 1)}^\\circ$ になる $\\theta_{1s}$ はいくらですか。`],
        a: { type: 'num', v: want[3] * d, tol: 0.02, unit: ['°', '°'] },
        hint: ['Solve $\\theta_0 + \\theta_{1s}\\sin\\psi = $ target.', '$\\theta_0 + \\theta_{1s}\\sin\\psi = $ 目標値 を解きます。'],
        sol: [[`$\\theta_{1s}\\sin${want[0]}^\\circ = ${n(-d, 1)}$.`, `$\\theta_{1s}\\sin${want[0]}^\\circ = ${n(-d, 1)}$ です。`], [`$\\theta_{1s} = ${n(want[3] * d, 1)}^\\circ$.`, `$\\theta_{1s} = ${n(want[3] * d, 1)}^\\circ$ です。`]],
        set: { th0, th1c: 0, th1s: want[3] * d },
      };
    },
  ];

  /* ---------------- blade-flapping ---------------- */
  Q['blade-flapping'] = [
    (r) => {
      const form = r.int(0, 1), mu = r.step(0.1, 0.45, 0.05);
      if (form === 0) {
        const rr = r.step(0.2, 1, 0.1), psi = r.pick([90, 270, 180, 0]), ut = rr + mu * Math.sin(psi * DEG);
        return {
          q: [`At advance ratio $\\mu = ${n(mu, 2)}$, what is the tangential velocity $U_T/\\Omega R = r + \\mu\\sin\\psi$ of the section at $r = ${n(rr, 1)}$, $\\psi = ${psi}^\\circ$?`, `前進比 $\\mu = ${n(mu, 2)}$ のとき、$r = ${n(rr, 1)}$、$\\psi = ${psi}^\\circ$ の断面の接線速度 $U_T/\\Omega R = r + \\mu\\sin\\psi$ はいくらですか。`],
          a: { type: 'num', v: ut, tol: 0.002 },
          hint: ['Substitute.', '代入します。'],
          sol: [[`$\\sin ${psi}^\\circ = ${n(Math.sin(psi * DEG), 0)}$.`, `$\\sin ${psi}^\\circ = ${n(Math.sin(psi * DEG), 0)}$ です。`], [`$U_T = ${n(ut, 3)}$${ut < 0 ? ', negative: this section is in reverse flow' : ''}.`, `$U_T = ${n(ut, 3)}$ です${ut < 0 ? '。負なので、この断面は逆流の中にあります' : ''}。`]],
          set: { mu },
        };
      }
      return {
        q: [`At advance ratio $\\mu = ${n(mu, 2)}$, what fraction of the blade radius on the retreating side ($\\psi = 270^\\circ$) is in reverse flow?`, `前進比 $\\mu = ${n(mu, 2)}$ のとき、後退側（$\\psi = 270^\\circ$）でブレードの半径のどれだけの割合が逆流の中にありますか。`],
        a: { type: 'num', v: mu, tol: 0.002 },
        hint: ['$U_T = r - \\mu < 0$ for $r < \\mu$.', '$r < \\mu$ のとき $U_T = r - \\mu < 0$ です。'],
        sol: [['At $\\psi = 270^\\circ$, $U_T = r - \\mu$.', '$\\psi = 270^\\circ$ では $U_T = r - \\mu$ です。'], [`Reverse flow for $r < ${n(mu, 2)}$: the inner ${n(100 * mu, 0)}% of the blade.`, `$r < ${n(mu, 2)}$ で逆流、すなわちブレードの内側 ${n(100 * mu, 0)}% です。`]],
        set: { mu },
      };
    },
    (r) => {
      const g = r.step(4, 12, 0.5), th = r.step(4, 12, 0.5), lam = r.step(0.02, 0.08, 0.01), b0 = g * (th * DEG / 8 - lam / 6);
      return {
        q: [`In hover, with Lock number $\\gamma = ${n(g, 1)}$, collective $${n(th, 1)}^\\circ$ and inflow $\\lambda = ${n(lam, 2)}$, what is the coning angle $\\beta_0 = \\gamma(\\theta_0/8 - \\lambda/6)$? In degrees.`, `ホバーで、ロック数 $\\gamma = ${n(g, 1)}$、コレクティブ $${n(th, 1)}^\\circ$、流入比 $\\lambda = ${n(lam, 2)}$ のとき、コーニング角 $\\beta_0 = \\gamma(\\theta_0/8 - \\lambda/6)$ は何度ですか。`],
        a: { type: 'num', v: b0 / DEG, rel: 0.006, unit: ['°', '°'] },
        hint: ['Convert $\\theta_0$ to radians first.', 'まず $\\theta_0$ をラジアンに直します。'],
        sol: [[`$\\theta_0 = ${n(th * DEG, 5)}$ rad, so $\\theta_0/8 - \\lambda/6 = ${n(th * DEG / 8 - lam / 6, 5)}$.`, `$\\theta_0 = ${n(th * DEG, 5)}$ rad なので $\\theta_0/8 - \\lambda/6 = ${n(th * DEG / 8 - lam / 6, 5)}$ です。`], [`$\\beta_0 = ${n(b0, 5)}$ rad $= ${n(b0 / DEG, 3)}^\\circ$.`, `$\\beta_0 = ${n(b0, 5)}$ rad $= ${n(b0 / DEG, 3)}^\\circ$ です。`]],
        set: { mu: 0, th0: th, lam, gamma: g },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.step(40, 90, 5), OR = r.step(180, 230, 5), mu = V / OR, M = 340;
        return {
          q: [`A rotor tip speed of $${OR}$ m/s and flight speed $${V}$ m/s. What is the advancing tip Mach number (speed of sound 340 m/s)?`, `翼端速度 $${OR}$ m/s、飛行速度 $${V}$ m/s です。前進側の翼端のマッハ数はいくらですか（音速 340 m/s）。`],
          a: { type: 'num', v: (OR + V) / M, rel: 0.004 },
          hint: ['The advancing tip moves at $\\Omega R + V$.', '前進側の翼端は $\\Omega R + V$ で動きます。'],
          sol: [[`$\\Omega R + V = ${OR + V}$ m/s, and $\\mu = ${n(mu, 3)}$.`, `$\\Omega R + V = ${OR + V}$ m/s、$\\mu = ${n(mu, 3)}$ です。`], [`$M = ${n((OR + V) / M, 3)}$: near or past the drag rise, while the retreating side is short of speed. That squeeze limits helicopter speed.`, `$M = ${n((OR + V) / M, 3)}$ で抗力の急増に近いか越えています。一方、後退側は速さが足りません。この板ばさみがヘリコプターの速度を制限します。`]],
          ...(mu <= 0.45 ? { set: { mu: Math.round(mu * 100) / 100 } } : {}),
        };
      }
      if (form === 1) {
        return {
          q: ['A centrally hinged blade is driven by a once-per-revolution lift. How many degrees of azimuth after the maximum lift does the maximum flap occur?', '中心にヒンジのあるブレードが 1 回転に 1 度の揚力で駆動されます。フラップの最大は揚力の最大から方位角で何度後に起こりますか。'],
          a: { type: 'num', v: 90, tol: 0.5, unit: ['°', '°'] },
          hint: ['Natural frequency equals forcing frequency.', '固有振動数が強制振動数に等しくなっています。'],
          sol: [['Flapping $\\beta^{\\prime\\prime} + \\beta = M$ has natural frequency 1/rev, so the forcing is at resonance.', 'フラッピング $\\beta^{\\prime\\prime} + \\beta = M$ の固有振動数は 1 回転に 1 度なので、強制は共振になります。'], ['A damped oscillator at resonance lags its forcing by $90^\\circ$.', '共振している減衰振動子は外力より $90^\\circ$ 遅れます。']],
        };
      }
      const g = r.step(4, 12, 1), lam = r.step(0.03, 0.08, 0.01);
      return {
        q: [`In hover with $\\gamma = ${g}$ and $\\lambda = ${n(lam, 2)}$, which collective (degrees) gives zero coning?`, `$\\gamma = ${g}$、$\\lambda = ${n(lam, 2)}$ のホバーで、コーニングがゼロになるコレクティブは何度ですか。`],
        a: { type: 'num', v: ((8 * lam) / 6) / DEG, rel: 0.006, unit: ['°', '°'] },
        hint: ['Set $\\theta_0/8 = \\lambda/6$; $\\gamma$ drops out.', '$\\theta_0/8 = \\lambda/6$ とおきます。$\\gamma$ は消えます。'],
        sol: [[`$\\theta_0 = \\frac43\\lambda = ${n((4 / 3) * lam, 5)}$ rad.`, `$\\theta_0 = \\frac43\\lambda = ${n((4 / 3) * lam, 5)}$ rad です。`], [`$= ${n(((8 * lam) / 6) / DEG, 3)}^\\circ$: at that pitch the blade makes no net lift and stays flat.`, `$= ${n(((8 * lam) / 6) / DEG, 3)}^\\circ$ です。このピッチではブレードは正味の揚力を生まず、水平のままです。`]],
      };
    },
  ];

  /* ---------------- rotor-momentum ---------------- */
  const inducedRatio = (x) => (x >= 0 ? -x / 2 + Math.sqrt((x * x) / 4 + 1) : x <= -2 ? -x / 2 - Math.sqrt((x * x) / 4 - 1) : 1 - 1.125 * x - 1.372 * x * x - 1.718 * x ** 3 - 0.655 * x ** 4);
  Q['rotor-momentum'] = [
    (r) => {
      const m = r.step(1000, 8000, 500), R = r.step(3, 9, 0.5), rho = 1.225, Tn = m * 9.81, vh = Math.sqrt(Tn / (2 * rho * PI * R * R));
      return {
        q: [`A ${m} kg helicopter with rotor radius $${n(R, 1)}$ m hovers at sea level ($\\rho = 1.225$ kg/m³). What is the induced velocity $v_h = \\sqrt{T/2\\rho A}$? In m/s.`, `回転半径 $${n(R, 1)}$ m の ${m} kg のヘリコプターが海面高度（$\\rho = 1.225$ kg/m³）でホバーしています。誘導速度 $v_h = \\sqrt{T/2\\rho A}$ はいくらですか。m/s で答えてください。`],
        a: { type: 'num', v: vh, rel: 0.005, unit: ['m/s', 'm/s'] },
        hint: ['$T = mg$, $A = \\pi R^2$.', '$T = mg$、$A = \\pi R^2$ です。'],
        sol: [[`$T = ${n(Tn, 0)}$ N, $A = ${n(PI * R * R, 2)}$ m².`, `$T = ${n(Tn, 0)}$ N、$A = ${n(PI * R * R, 2)}$ m² です。`], [`$v_h = ${n(vh, 3)}$ m/s; the wake far below moves at $2v_h = ${n(2 * vh, 3)}$ m/s.`, `$v_h = ${n(vh, 3)}$ m/s で、下方の後流は $2v_h = ${n(2 * vh, 3)}$ m/s で動きます。`]],
        set: { mass: m, R, alt: 0, vc: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const m = r.step(1000, 6000, 500), R = r.step(4, 8, 0.5), fm = r.step(0.6, 0.8, 0.05), Tn = m * 9.81, vh = Math.sqrt(Tn / (2 * 1.225 * PI * R * R)), P = (Tn * vh) / fm;
        return {
          q: [`Same as before with $m = ${m}$ kg, $R = ${n(R, 1)}$ m and figure of merit ${n(fm, 2)}. What hover power is needed? In kW.`, `$m = ${m}$ kg、$R = ${n(R, 1)}$ m、フィギュア・オブ・メリット ${n(fm, 2)} のとき、ホバーに必要な動力はいくらですか。kW で答えてください。`],
          a: { type: 'num', v: P / 1000, rel: 0.006, unit: ['kW', 'kW'] },
          hint: ['$P = Tv_h/\\mathrm{FM}$.', '$P = Tv_h/\\mathrm{FM}$ です。'],
          sol: [[`$v_h = ${n(vh, 3)}$ m/s and ideal power $Tv_h = ${n((Tn * vh) / 1000, 4)}$ kW.`, `$v_h = ${n(vh, 3)}$ m/s、理想動力 $Tv_h = ${n((Tn * vh) / 1000, 4)}$ kW です。`], [`Dividing by ${n(fm, 2)}: $${n(P / 1000, 4)}$ kW.`, `${n(fm, 2)} で割って $${n(P / 1000, 4)}$ kW です。`]],
          set: { mass: m, R, fm, alt: 0 },
        };
      }
      const x = r.step(0.5, 3, 0.5), vi = inducedRatio(x);
      return {
        q: [`In a climb at $V_c = ${n(x, 1)}\\,v_h$, what is the induced velocity in units of $v_h$?`, `$V_c = ${n(x, 1)}\\,v_h$ で上昇しているとき、誘導速度は $v_h$ を単位としていくらですか。`],
        a: { type: 'num', v: vi, rel: 0.004 },
        hint: ['$v_i/v_h = -x/2 + \\sqrt{x^2/4 + 1}$.', '$v_i/v_h = -x/2 + \\sqrt{x^2/4 + 1}$ です。'],
        sol: [[`$-${n(x / 2, 2)} + \\sqrt{${n((x * x) / 4, 4)} + 1}$.`, `$-${n(x / 2, 2)} + \\sqrt{${n((x * x) / 4, 4)} + 1}$ です。`], [`$= ${n(vi, 4)}$: climbing draws in faster air, so less induced velocity is needed.`, `$= ${n(vi, 4)}$ です。上昇すると速い空気を取り込むので、必要な誘導速度は減ります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 3, 4]);
        return {
          q: [`By what factor does the ideal hover power change if the rotor radius is multiplied by ${k} at the same weight?`, `重さを変えずに回転半径を ${k} 倍にすると、理想のホバー動力は何倍になりますか。`],
          a: { type: 'num', v: 1 / k, rel: 0.003, show: `1/${k}` },
          hint: ['$P \\propto T^{3/2}/\\sqrt A$ and $A \\propto R^2$.', '$P \\propto T^{3/2}/\\sqrt A$、$A \\propto R^2$ です。'],
          sol: [['$P \\propto A^{-1/2} \\propto R^{-1}$.', '$P \\propto A^{-1/2} \\propto R^{-1}$ です。'], [`So the power is multiplied by $1/${k}$.`, `したがって動力は $1/${k}$ 倍になります。`]],
        };
      }
      if (form === 1) {
        const p = 2 / 3, factor = Math.pow(2, 1.5);
        return {
          q: ['If the weight doubles, by what factor does the ideal hover power grow?', '重さが 2 倍になると、理想のホバー動力は何倍になりますか。'],
          a: { type: 'num', v: factor, rel: 0.003, show: '2^{3/2}' },
          hint: ['$P \\propto T^{3/2}$.', '$P \\propto T^{3/2}$ です。'],
          sol: [['$P = T^{3/2}/\\sqrt{2\\rho A}$.', '$P = T^{3/2}/\\sqrt{2\\rho A}$ です。'], [`$2^{3/2} = ${n(factor, 4)}$: carrying weight in hover is disproportionately expensive.`, `$2^{3/2} = ${n(factor, 4)}$ です。ホバーで重さを運ぶのは不釣り合いに高くつきます。`]],
        };
      }
      const vhh = r.step(6, 14, 0.5), xa = -1.7766, d = -xa * vhh;
      return {
        q: [`A rotor with $v_h = ${n(vhh, 1)}$ m/s. Ideal vertical autorotation occurs at $V_c \\approx -1.78\\,v_h$. What is the descent rate? In m/s.`, `$v_h = ${n(vhh, 1)}$ m/s のローターがあります。理想的な垂直オートローテーションは $V_c \\approx -1.78\\,v_h$ で起こります。降下率はいくらですか。m/s で答えてください。`],
        a: { type: 'num', v: d, rel: 0.01, unit: ['m/s', 'm/s'] },
        hint: ['Multiply.', '掛け算です。'],
        sol: [[`$1.78 \\times ${n(vhh, 1)}$.`, `$1.78 \\times ${n(vhh, 1)}$ です。`], [`$\\approx ${n(d, 3)}$ m/s, about $${n(d * 196.85, 0)}$ ft/min; lightly loaded rotors (small $v_h$) come down more gently.`, `約 $${n(d, 3)}$ m/s、およそ $${n(d * 196.85, 0)}$ ft/min です。荷重の軽いローター（$v_h$ が小さい）ほど穏やかに降ります。`]],
      };
    },
  ];
})();
