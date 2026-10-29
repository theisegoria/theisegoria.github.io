'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, DEG = PI / 180, RHO = 1.225;
  const clTau = (c) => Math.sqrt(4 * PI * c * (1 + 0.151 * Math.sqrt(c) + 0.139 * c));
  const clAlpha = (c) => 2 * PI * (1 + 0.151 * Math.sqrt(c) + 0.219 * c);
  const flapSlope = (E) => { const th = Math.acos(2 * E - 1); return 2 * ((PI - th) + Math.sin(th)); };
  const dCLjet = (c, tau, al) => tau * DEG * clTau(c) + al * DEG * (clAlpha(c) - 2 * PI);

  /* ---------------- jet-flap-lift ---------------- */
  Q['jet-flap-lift'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.pick([30, 40, 50, 60]), S = r.pick([5, 10, 20]), Vj = r.pick([150, 200, 250, 300]), md = r.pick([0.5, 1, 2, 3, 4]);
        const q = 0.5 * RHO * V * V, cm = md * Vj / (q * S);
        return {
          q: [`A slot blows $${md}$ kg/s of air at $${Vj}$ m/s over a wing of area $${S}$ m² flying at $${V}$ m/s in sea-level air ($\\rho = 1.225$ kg/m³). What is the momentum coefficient $C_\\mu$? Three significant figures.`, `スロットが $${md}$ kg/s の空気を $${Vj}$ m/s で吹き出しています。翼面積は $${S}$ m² で、海面高度の空気（$\\rho = 1.225$ kg/m³）の中を $${V}$ m/s で飛んでいます。運動量係数 $C_\\mu$ を有効数字三桁で求めてください。`],
          a: { type: 'num', v: cm, rel: 0.005 },
          hint: ['$C_\\mu = \\dot mV_j/(q_\\infty S)$ with $q_\\infty = \\tfrac12\\rho V^2$.', '$C_\\mu = \\dot mV_j/(q_\\infty S)$、$q_\\infty = \\tfrac12\\rho V^2$ です。'],
          sol: [[`$q_\\infty = \\tfrac12 \\times 1.225 \\times ${V}^2 = ${n(q, 2)}$ Pa, and the jet's momentum flux is $\\dot mV_j = ${n(md * Vj)}$ N.`, `$q_\\infty = \\tfrac12 \\times 1.225 \\times ${V}^2 = ${n(q, 2)}$ Pa、噴流の運動量流束は $\\dot mV_j = ${n(md * Vj)}$ N です。`], [`$C_\\mu = ${n(md * Vj)}/(${n(q, 2)} \\times ${S}) = ${n(cm, 4)}$: the jet's thrust as a fraction of $q_\\infty S$.`, `$C_\\mu = ${n(md * Vj)}/(${n(q, 2)} \\times ${S}) = ${n(cm, 4)}$ です。噴流の推力を $q_\\infty S$ に対する割合で表したものです。`]],
        };
      }
      if (form === 1) {
        const E = r.pick([0.15, 0.2, 0.25, 0.3, 0.4, 0.5]), th = Math.acos(2 * E - 1), sl = flapSlope(E);
        return {
          q: [`By thin-aerofoil theory a plain flap of chord fraction $E = ${E}$ adds $\\Delta C_L = 2[(\\pi - \\theta_h) + \\sin\\theta_h]\\,\\delta$, with $\\cos\\theta_h = 2E - 1$. What is $\\Delta C_L/\\delta$ per radian? Three decimals.`, `薄翼理論によると、翼弦比 $E = ${E}$ の普通のフラップは $\\Delta C_L = 2[(\\pi - \\theta_h) + \\sin\\theta_h]\\,\\delta$（$\\cos\\theta_h = 2E - 1$）を加えます。$\\Delta C_L/\\delta$（1/rad）を小数第三位まで求めてください。`],
          a: { type: 'num', v: sl, tol: 0.0006 },
          hint: ['The hinge sits at $x/c = 1 - E$, and $x/c = (1 - \\cos\\theta)/2$.', 'ヒンジは $x/c = 1 - E$ にあり、$x/c = (1 - \\cos\\theta)/2$ です。'],
          sol: [[`$\\cos\\theta_h = ${n(2 * E - 1, 3)}$, so $\\theta_h = ${n(th, 5)}$ rad.`, `$\\cos\\theta_h = ${n(2 * E - 1, 3)}$ なので $\\theta_h = ${n(th, 5)}$ rad です。`], [`$\\Delta C_L/\\delta = 2(${n(PI - th, 5)} + ${n(Math.sin(th), 5)}) = ${n(sl, 5)}$, which is ${n(100 * sl / (2 * PI), 3)}% of the $2\\pi$ an all-moving wing would give.`, `$\\Delta C_L/\\delta = 2(${n(PI - th, 5)} + ${n(Math.sin(th), 5)}) = ${n(sl, 5)}$ で、翼全体を動かした場合の $2\\pi$ の ${n(100 * sl / (2 * PI), 3)}% です。`]],
          set: { E },
        };
      }
      const cm = r.pick([0.005, 0.01, 0.015, 0.02]), lead = 2 * Math.sqrt(PI * cm);
      return {
        q: [`At small momentum coefficients Spence's jet-flap theory gives $\\partial C_L/\\partial\\tau \\approx 2\\sqrt{\\pi C_\\mu}$. Evaluate it for $C_\\mu = ${cm}$. Four decimals.`, `運動量係数が小さいとき、スペンスのジェットフラップ理論は $\\partial C_L/\\partial\\tau \\approx 2\\sqrt{\\pi C_\\mu}$ を与えます。$C_\\mu = ${cm}$ のときの値を小数第四位まで求めてください。`],
        a: { type: 'num', v: lead, tol: 0.00006 },
        hint: ['Substitute directly.', 'そのまま代入します。'],
        sol: [[`$\\pi C_\\mu = ${n(PI * cm, 6)}$, whose square root is $${n(Math.sqrt(PI * cm), 6)}$.`, `$\\pi C_\\mu = ${n(PI * cm, 6)}$ で、その平方根は $${n(Math.sqrt(PI * cm), 6)}$ です。`], [`So $\\partial C_L/\\partial\\tau \\approx ${n(lead, 5)}$ per radian; the full interpolation formula gives $${n(clTau(cm), 5)}$, within ${n(100 * (clTau(cm) / lead - 1), 2)}%.`, `したがって $\\partial C_L/\\partial\\tau \\approx ${n(lead, 5)}$（1/rad）です。内挿公式の全体では $${n(clTau(cm), 5)}$ で、差は ${n(100 * (clTau(cm) / lead - 1), 2)}% です。`]],
        set: { cmu: cm },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const cm = r.pick([0.02, 0.05, 0.1, 0.2, 0.3]), tau = r.pick([20, 30, 40, 50]), al = r.pick([0, 2, 4, 6]);
        const Ct = clTau(cm), Ca = clAlpha(cm), CL = tau * DEG * Ct + al * DEG * Ca;
        return {
          q: [`A jet flap blows $C_\\mu = ${cm}$ at $\\tau = ${tau}^\\circ$ on a wing at $\\alpha = ${al}^\\circ$. Using $\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$ and $\\partial C_L/\\partial\\alpha = 2\\pi(1 + 0.151C_\\mu^{1/2} + 0.219C_\\mu)$, find $C_L$. Three significant figures.`, `ジェットフラップが、迎角 $\\alpha = ${al}^\\circ$ の翼で $\\tau = ${tau}^\\circ$、$C_\\mu = ${cm}$ の吹き出しをしています。$\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$ と $\\partial C_L/\\partial\\alpha = 2\\pi(1 + 0.151C_\\mu^{1/2} + 0.219C_\\mu)$ を使って $C_L$ を有効数字三桁で求めてください。`],
          a: { type: 'num', v: CL, rel: 0.004 },
          hint: ['Both angles in radians; $C_L = \\tau\\,\\partial C_L/\\partial\\tau + \\alpha\\,\\partial C_L/\\partial\\alpha$.', '角度はどちらもラジアンで、$C_L = \\tau\\,\\partial C_L/\\partial\\tau + \\alpha\\,\\partial C_L/\\partial\\alpha$ です。'],
          sol: [[`$\\partial C_L/\\partial\\tau = ${n(Ct, 4)}$ and $\\partial C_L/\\partial\\alpha = ${n(Ca, 4)}$ per radian.`, `$\\partial C_L/\\partial\\tau = ${n(Ct, 4)}$、$\\partial C_L/\\partial\\alpha = ${n(Ca, 4)}$（1/rad）です。`], [`$C_L = ${n(tau * DEG, 4)} \\times ${n(Ct, 4)} + ${n(al * DEG, 4)} \\times ${n(Ca, 4)} = ${n(CL, 4)}$, against $${n(2 * PI * al * DEG, 4)}$ without blowing.`, `$C_L = ${n(tau * DEG, 4)} \\times ${n(Ct, 4)} + ${n(al * DEG, 4)} \\times ${n(Ca, 4)} = ${n(CL, 4)}$ で、吹き出しなしでは $${n(2 * PI * al * DEG, 4)}$ です。`]],
          set: { cmu: cm, tau, alpha: al },
        };
      }
      if (form === 1) {
        const cm = r.pick([0.005, 0.01, 0.02, 0.05, 0.1]), tau = r.pick([30, 45, 60]), d = tau * DEG * clTau(cm), aug = d / cm, re = cm * Math.sin(tau * DEG);
        return {
          q: [`At $\\alpha = 0$ a jet flap blows $C_\\mu = ${cm}$ at $\\tau = ${tau}^\\circ$, with $\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$. What is the lift augmentation ratio $\\Delta C_L/C_\\mu$? Three significant figures.`, `$\\alpha = 0$ で、ジェットフラップが $\\tau = ${tau}^\\circ$、$C_\\mu = ${cm}$ の吹き出しをしています。$\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$ として、揚力増強比 $\\Delta C_L/C_\\mu$ を有効数字三桁で求めてください。`],
          a: { type: 'num', v: aug, rel: 0.004 },
          hint: ['At zero incidence all the lift is blowing lift, $\\tau\\,\\partial C_L/\\partial\\tau$.', '迎角ゼロでは揚力はすべて吹き出しによるもので、$\\tau\\,\\partial C_L/\\partial\\tau$ です。'],
          sol: [[`$\\partial C_L/\\partial\\tau = ${n(clTau(cm), 5)}$, so $\\Delta C_L = ${n(tau * DEG, 4)} \\times ${n(clTau(cm), 5)} = ${n(d, 4)}$.`, `$\\partial C_L/\\partial\\tau = ${n(clTau(cm), 5)}$ なので $\\Delta C_L = ${n(tau * DEG, 4)} \\times ${n(clTau(cm), 5)} = ${n(d, 4)}$ です。`], [`$\\Delta C_L/C_\\mu = ${n(aug, 4)}$. The jet's own reaction, $C_\\mu\\sin\\tau = ${n(re, 4)}$, is only ${n(100 * re / d, 3)}% of the lift it buys.`, `$\\Delta C_L/C_\\mu = ${n(aug, 4)}$ です。噴流自身の反力 $C_\\mu\\sin\\tau = ${n(re, 4)}$ は、得られる揚力の ${n(100 * re / d, 3)}% にすぎません。`]],
          set: { cmu: cm, tau, alpha: 0 },
        };
      }
      const cm = r.pick([0.02, 0.05, 0.1, 0.15]), V = r.pick([30, 40, 50, 60, 80]), Vj = r.pick([150, 200, 250, 300]), S = 10;
      const q = 0.5 * RHO * V * V, md = cm * q * S / Vj, Pw = 0.5 * md * Vj * Vj;
      return {
        q: [`A $10$ m² wing at $${V}$ m/s in sea-level air blows $C_\\mu = ${cm}$ with a jet of $${Vj}$ m/s. What blowing power $P = \\tfrac12\\dot mV_j^2$ does that take, in kW? Three significant figures.`, `海面高度の空気の中を $${V}$ m/s で飛ぶ $10$ m² の翼が、$${Vj}$ m/s の噴流で $C_\\mu = ${cm}$ を吹き出しています。必要な吹き出しの動力 $P = \\tfrac12\\dot mV_j^2$ は何 kW ですか。有効数字三桁で答えてください。`],
        a: { type: 'num', v: Pw / 1000, rel: 0.005, unit: ['kW', 'kW'] },
        hint: ['Find $\\dot m$ from $C_\\mu q_\\infty S = \\dot mV_j$ first.', 'まず $C_\\mu q_\\infty S = \\dot mV_j$ から $\\dot m$ を求めます。'],
        sol: [[`$q_\\infty = ${n(q, 2)}$ Pa, so $\\dot m = ${cm} \\times ${n(q, 2)} \\times 10/${Vj} = ${n(md, 4)}$ kg/s.`, `$q_\\infty = ${n(q, 2)}$ Pa なので $\\dot m = ${cm} \\times ${n(q, 2)} \\times 10/${Vj} = ${n(md, 4)}$ kg/s です。`], [`$P = \\tfrac12 \\times ${n(md, 4)} \\times ${Vj}^2 = ${n(Pw / 1000, 4)}$ kW. Equivalently $P = \\tfrac12 C_\\mu q_\\infty SV_j$, so a slower jet with the same $C_\\mu$ costs less.`, `$P = \\tfrac12 \\times ${n(md, 4)} \\times ${Vj}^2 = ${n(Pw / 1000, 4)}$ kW です。$P = \\tfrac12 C_\\mu q_\\infty SV_j$ とも書けるので、同じ $C_\\mu$ なら遅い噴流のほうが安く済みます。`]],
        set: { cmu: cm, V, vj: Vj },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const tau = r.pick([15, 30, 45, 60]), k = 2 * tau * DEG;
        return {
          q: [`At zero incidence and small $C_\\mu$, the jet flap's lift is $C_L \\approx \\tau\\cdot2\\sqrt{\\pi C_\\mu}$. Write $C_L$ as a function of $c = C_\\mu$ for $\\tau = ${tau}^\\circ$.`, `迎角ゼロで $C_\\mu$ が小さいとき、ジェットフラップの揚力は $C_L \\approx \\tau\\cdot2\\sqrt{\\pi C_\\mu}$ です。$\\tau = ${tau}^\\circ$ のとき、$C_L$ を $c = C_\\mu$ の関数として書いてください。`],
          a: { type: 'expr', v: `2*(${tau}*pi/180)*sqrt(pi*c)`, vars: ['c'], dom: { c: [0.001, 0.3] }, lhs: ['$C_L(c) =$', '$C_L(c) =$'] },
          hint: ['Convert $\\tau$ to radians.', '$\\tau$ をラジアンに直します。'],
          sol: [[`$\\tau = ${tau}^\\circ = ${n(tau * DEG, 5)}$ rad.`, `$\\tau = ${tau}^\\circ = ${n(tau * DEG, 5)}$ rad です。`], [`$C_L \\approx ${n(k, 5)}\\sqrt{\\pi c} = ${n(k * Math.sqrt(PI), 5)}\\sqrt c$. Quadrupling the blowing only doubles the lift, so the augmentation $C_L/c$ falls like $1/\\sqrt c$.`, `$C_L \\approx ${n(k, 5)}\\sqrt{\\pi c} = ${n(k * Math.sqrt(PI), 5)}\\sqrt c$ です。吹き出しを四倍にしても揚力は二倍にしかならないので、増強比 $C_L/c$ は $1/\\sqrt c$ のように下がります。`]],
          set: { tau, alpha: 0 },
        };
      }
      if (form === 1) {
        const tau = r.pick([30, 40, 50, 60]), target = r.pick([0.3, 0.5, 0.8, 1.0]);
        let lo = 0, hi = 5; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (dCLjet(m, tau, 0) < target) lo = m; else hi = m; }
        const cm = (lo + hi) / 2, lead = (target / (2 * tau * DEG)) ** 2 / PI;
        return {
          q: [`At $\\alpha = 0$ and $\\tau = ${tau}^\\circ$, what momentum coefficient gives $\\Delta C_L = ${target}$, using $\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$? Three significant figures.`, `$\\alpha = 0$、$\\tau = ${tau}^\\circ$ のとき、$\\Delta C_L = ${target}$ を与える運動量係数はいくらですか。$\\partial C_L/\\partial\\tau = [4\\pi C_\\mu(1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu)]^{1/2}$ を使い、有効数字三桁で答えてください。`],
          a: { type: 'num', v: cm, rel: 0.006 },
          hint: ['Start from the small-$C_\\mu$ estimate $C_\\mu \\approx (\\Delta C_L/2\\tau)^2/\\pi$, then correct it.', '$C_\\mu$ が小さいときの見積もり $C_\\mu \\approx (\\Delta C_L/2\\tau)^2/\\pi$ から始めて補正します。'],
          sol: [[`The leading term alone gives $C_\\mu \\approx (${target}/(2 \\times ${n(tau * DEG, 4)}))^2/\\pi = ${n(lead, 4)}$.`, `主要項だけなら $C_\\mu \\approx (${target}/(2 \\times ${n(tau * DEG, 4)}))^2/\\pi = ${n(lead, 4)}$ です。`], [`The correction factor $1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu$ makes the jet a little more effective, so solving $\\tau\\,\\partial C_L/\\partial\\tau = ${target}$ (by iteration) gives $C_\\mu = ${n(cm, 4)}$.`, `補正因子 $1 + 0.151C_\\mu^{1/2} + 0.139C_\\mu$ で噴流は少し効きやすくなるので、$\\tau\\,\\partial C_L/\\partial\\tau = ${target}$ を（反復で）解くと $C_\\mu = ${n(cm, 4)}$ です。`]],
          ...(cm <= 0.5 ? { set: { tau, alpha: 0, cmu: Math.round(cm / 0.005) * 0.005 } } : {}),
        };
      }
      if (form === 2) {
        const v1 = r.pick([120, 150, 180]), v2 = r.pick([240, 270, 300, 330]);
        return {
          q: [`Two slots deliver the same $C_\\mu$, one with a $${v1}$ m/s jet and one with a $${v2}$ m/s jet. What is the ratio of the blowing power of the fast jet to the slow one?`, `二つのスロットが同じ $C_\\mu$ を出しています。一方は噴流速度 $${v1}$ m/s、もう一方は $${v2}$ m/s です。速い噴流の吹き出しの動力は、遅い噴流の何倍ですか。`],
          a: { type: 'num', v: v2 / v1, rel: 0.003 },
          hint: ['Same $C_\\mu$ means the same $\\dot mV_j$.', '同じ $C_\\mu$ とは、同じ $\\dot mV_j$ のことです。'],
          sol: [[`$P = \\tfrac12\\dot mV_j^2 = \\tfrac12(\\dot mV_j)V_j$, and $\\dot mV_j = C_\\mu q_\\infty S$ is the same for both.`, `$P = \\tfrac12\\dot mV_j^2 = \\tfrac12(\\dot mV_j)V_j$ で、$\\dot mV_j = C_\\mu q_\\infty S$ は両方で同じです。`], [`So $P \\propto V_j$ and the ratio is $${v2}/${v1} = ${n(v2 / v1, 4)}$: the thicker, slower jet makes the same lift for less power, though it needs a larger mass flow.`, `したがって $P \\propto V_j$ で、比は $${v2}/${v1} = ${n(v2 / v1, 4)}$ です。厚く遅い噴流は、質量流量は多く要りますが、少ない動力で同じ揚力を生みます。`]],
        };
      }
      const cm = r.pick([0.02, 0.05, 0.1]), tau = r.pick([20, 30, 40]), al = r.pick([0, 2, 4]), E = r.pick([0.2, 0.25, 0.3]);
      const d = dCLjet(cm, tau, al), deq = d / flapSlope(E) / DEG;
      return {
        q: [`A jet flap at $\\alpha = ${al}^\\circ$ blows $C_\\mu = ${cm}$ at $\\tau = ${tau}^\\circ$. Through what angle would a plain flap of chord fraction $E = ${E}$ have to turn to add the same lift? Use the jet-flap formulas and $\\Delta C_L = 2[(\\pi - \\theta_h) + \\sin\\theta_h]\\delta$ with $\\cos\\theta_h = 2E - 1$. In degrees, three significant figures.`, `迎角 $\\alpha = ${al}^\\circ$ のジェットフラップが、$\\tau = ${tau}^\\circ$、$C_\\mu = ${cm}$ の吹き出しをしています。翼弦比 $E = ${E}$ の普通のフラップが同じだけ揚力を加えるには、何度曲げる必要がありますか。ジェットフラップの公式と、$\\cos\\theta_h = 2E - 1$ とした $\\Delta C_L = 2[(\\pi - \\theta_h) + \\sin\\theta_h]\\delta$ を使い、度で有効数字三桁で答えてください。`],
        a: { type: 'num', v: deq, rel: 0.005, unit: ['°', '°'] },
        hint: ['The blowing increment is $\\tau\\,\\partial C_L/\\partial\\tau + \\alpha(\\partial C_L/\\partial\\alpha - 2\\pi)$.', '吹き出しによる増分は $\\tau\\,\\partial C_L/\\partial\\tau + \\alpha(\\partial C_L/\\partial\\alpha - 2\\pi)$ です。'],
        sol: [[`$\\Delta C_L = ${n(tau * DEG, 4)} \\times ${n(clTau(cm), 4)} + ${n(al * DEG, 4)} \\times (${n(clAlpha(cm), 4)} - 2\\pi) = ${n(d, 4)}$.`, `$\\Delta C_L = ${n(tau * DEG, 4)} \\times ${n(clTau(cm), 4)} + ${n(al * DEG, 4)} \\times (${n(clAlpha(cm), 4)} - 2\\pi) = ${n(d, 4)}$ です。`], [`The flap's slope is $${n(flapSlope(E), 4)}$ per radian, so $\\delta = ${n(d, 4)}/${n(flapSlope(E), 4)} = ${n(deq * DEG, 4)}$ rad $= ${n(deq, 4)}^\\circ$. ${deq < tau ? 'The jet, turned further, does the work of a smaller flap deflection.' : 'Here the jet outperforms a flap turned through the same angle.'}`, `フラップの傾きは $${n(flapSlope(E), 4)}$（1/rad）なので $\\delta = ${n(d, 4)}/${n(flapSlope(E), 4)} = ${n(deq * DEG, 4)}$ rad $= ${n(deq, 4)}^\\circ$ です。${deq < tau ? '噴流はより大きく曲げても、より小さなフラップ角の働きしかしません。' : 'ここでは噴流は、同じ角度だけ曲げたフラップを上回ります。'}`]],
        set: { cmu: cm, tau, alpha: al, E },
      };
    },
  ];

  /* ---------------- coanda-wing ---------------- */
  const A0 = Math.hypot(1, 0.04), TREF = Math.atan2(-0.04, 1);
  Q['coanda-wing'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const U = r.pick([20, 30, 40, 50]), G = r.pick([2, 3, 5, 8, 12]), Lp = RHO * U * G;
        return {
          q: [`Blowing round a rounded trailing edge raises the circulation of a wing section to $${G}$ m²/s in a $${U}$ m/s stream of sea-level air. What lift per metre of span does it make? In N/m.`, `丸い後縁に沿って吹き出すことで、翼断面の循環が、海面高度の空気の $${U}$ m/s の流れの中で $${G}$ m²/s になりました。翼幅 1 メートルあたりの揚力は何 N/m ですか。`],
          a: { type: 'num', v: Lp, rel: 0.004, unit: ['N/m', 'N/m'] },
          hint: ['Kutta–Joukowski: $L^\\prime = \\rho U\\Gamma$, however the circulation was made.', 'クッタ・ジューコフスキー：循環をどう作ったかによらず $L^\\prime = \\rho U\\Gamma$ です。'],
          sol: [[`$L^\\prime = 1.225 \\times ${U} \\times ${G}$.`, `$L^\\prime = 1.225 \\times ${U} \\times ${G}$ です。`], [`$= ${n(Lp, 4)}$ N/m. The theorem does not care whether a sharp edge or a jet fixed $\\Gamma$.`, `$= ${n(Lp, 4)}$ N/m です。この定理は、$\\Gamma$ を決めたのが鋭い縁か噴流かを問いません。`]],
        };
      }
      if (form === 1) {
        const u = r.pick([100, 150, 200, 250]), h = r.pick([0.3, 0.5, 0.8, 1]), R = r.pick([5, 8, 10, 15]), dp = RHO * u * u * (h / 1000) / (R / 1000);
        return {
          q: [`A jet $${h}$ mm thick moving at $${u}$ m/s wraps round a Coanda surface of radius $${R}$ mm. Estimate the pressure drop across it, $\\Delta p \\approx \\rho u_j^2h/R$, with $\\rho = 1.225$ kg/m³. In kPa.`, `厚さ $${h}$ mm、速度 $${u}$ m/s の噴流が、半径 $${R}$ mm のコアンダ面に巻きついています。噴流を横切る圧力差 $\\Delta p \\approx \\rho u_j^2h/R$ を、$\\rho = 1.225$ kg/m³ として見積もってください。kPa で答えてください。`],
          a: { type: 'num', v: dp / 1000, rel: 0.004, unit: ['kPa', 'kPa'] },
          hint: ['The pressure gradient across a curved sheet balances its centripetal acceleration: $\\partial p/\\partial n = \\rho u^2/R$.', '曲がった膜を横切る圧力勾配は、その向心加速度とつり合います：$\\partial p/\\partial n = \\rho u^2/R$ です。'],
          sol: [[`$\\rho u_j^2 = 1.225 \\times ${u}^2 = ${n(RHO * u * u, 5)}$ Pa, and $h/R = ${h}/${R} = ${n(h / R, 4)}$.`, `$\\rho u_j^2 = 1.225 \\times ${u}^2 = ${n(RHO * u * u, 5)}$ Pa、$h/R = ${h}/${R} = ${n(h / R, 4)}$ です。`], [`$\\Delta p \\approx ${n(dp / 1000, 4)}$ kPa: the wall under the jet sits that far below the outside pressure, which is what holds the jet on the curve.`, `$\\Delta p \\approx ${n(dp / 1000, 4)}$ kPa です。噴流の下の壁はそれだけ外より圧力が低く、それが噴流を曲面に保っています。`]],
        };
      }
      const eps = r.pick([0.1, 0.15, 0.2, 0.25, 0.3]), a = A0 + eps;
      return {
        q: [`The lab's circle has centre $\\mu = 0.04i$ and clears $\\zeta = 1$ by $\\varepsilon = ${eps}$, so $a = |1 - \\mu| + \\varepsilon$. What is its radius? Four decimals.`, `この実験の円は中心が $\\mu = 0.04i$ で、$\\zeta = 1$ から $\\varepsilon = ${eps}$ だけ離れて通るので $a = |1 - \\mu| + \\varepsilon$ です。半径を小数第四位まで求めてください。`],
        a: { type: 'num', v: a, tol: 0.00006 },
        hint: ['$|1 - 0.04i| = \\sqrt{1 + 0.04^2}$.', '$|1 - 0.04i| = \\sqrt{1 + 0.04^2}$ です。'],
        sol: [[`$|1 - \\mu| = \\sqrt{1.0016} = ${n(A0, 6)}$.`, `$|1 - \\mu| = \\sqrt{1.0016} = ${n(A0, 6)}$ です。`], [`$a = ${n(A0, 6)} + ${eps} = ${n(a, 5)}$. The circle no longer passes through $\\zeta = 1$, so the map has no sharp edge to make.`, `$a = ${n(A0, 6)} + ${eps} = ${n(a, 5)}$ です。円はもう $\\zeta = 1$ を通らないので、写像が作る鋭い縁はありません。`]],
        set: { eps },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const al = r.pick([0, 2, 4, 6]), eps = r.pick([0.15, 0.2, 0.25]), sep = r.pick([5, 10, 15, 20, 30]);
        const a = A0 + eps, ths = TREF - sep * DEG, G = 4 * PI * a * Math.sin(al * DEG - ths);
        return {
          q: [`In the lab's section ($\\mu = 0.04i$, $\\varepsilon = ${eps}$, $U = 1$) the old sharp-edge direction is $\\theta = ${n(TREF / DEG, 3)}^\\circ$. The jet carries the rear stagnation point $${sep}^\\circ$ further round, to $\\theta_s = ${n(ths / DEG, 3)}^\\circ$. At $\\alpha = ${al}^\\circ$, what is $\\Gamma = 4\\pi Ua\\sin(\\alpha - \\theta_s)$? Three significant figures.`, `この実験の断面（$\\mu = 0.04i$、$\\varepsilon = ${eps}$、$U = 1$）では、もとの鋭い縁の方向は $\\theta = ${n(TREF / DEG, 3)}^\\circ$ です。噴流が後方よどみ点をさらに $${sep}^\\circ$ 回り込ませて $\\theta_s = ${n(ths / DEG, 3)}^\\circ$ にします。$\\alpha = ${al}^\\circ$ のとき、$\\Gamma = 4\\pi Ua\\sin(\\alpha - \\theta_s)$ を有効数字三桁で求めてください。`],
          a: { type: 'num', v: G, rel: 0.004 },
          hint: ['$a = \\sqrt{1.0016} + \\varepsilon$.', '$a = \\sqrt{1.0016} + \\varepsilon$ です。'],
          sol: [[`$a = ${n(a, 5)}$ and $\\alpha - \\theta_s = ${n(al - ths / DEG, 4)}^\\circ$.`, `$a = ${n(a, 5)}$、$\\alpha - \\theta_s = ${n(al - ths / DEG, 4)}^\\circ$ です。`], [`$\\Gamma = 4\\pi \\times ${n(a, 5)} \\times \\sin ${n(al - ths / DEG, 4)}^\\circ = ${n(G, 4)}$. Each degree the jet drags the stagnation point round adds circulation, with nothing moved.`, `$\\Gamma = 4\\pi \\times ${n(a, 5)} \\times \\sin ${n(al - ths / DEG, 4)}^\\circ = ${n(G, 4)}$ です。噴流がよどみ点を 1 度回り込ませるごとに、何も動かさずに循環が増えます。`]],
          set: { alpha: al, eps, sep },
        };
      }
      if (form === 1) {
        const cm = r.pick([0.02, 0.05, 0.1, 0.2]), h = r.pick([0.3, 0.5, 0.8, 1, 1.5]), V = 30, c = 0.5, uj = V * Math.sqrt(cm * c / (2 * h / 1000));
        return {
          q: [`A circulation-control section of chord $0.5$ m at $30$ m/s needs $C_\\mu = ${cm}$. Its jet has the free-stream density, so $C_\\mu = 2hu_j^2/(cU^2)$. How fast must the jet be through a $${h}$ mm slot? In m/s.`, `翼弦 $0.5$ m の循環制御翼が $30$ m/s で $C_\\mu = ${cm}$ を必要としています。噴流の密度は一様流と同じなので $C_\\mu = 2hu_j^2/(cU^2)$ です。$${h}$ mm のスロットでは噴流速度はいくら必要ですか。m/s で答えてください。`],
          a: { type: 'num', v: uj, rel: 0.004, unit: ['m/s', 'm/s'] },
          hint: ['Solve for $u_j$: $u_j = U\\sqrt{C_\\mu c/(2h)}$.', '$u_j$ について解くと $u_j = U\\sqrt{C_\\mu c/(2h)}$ です。'],
          sol: [[`$C_\\mu c/(2h) = ${cm} \\times 0.5/(2 \\times ${n(h / 1000, 4)}) = ${n(cm * c / (2 * h / 1000), 4)}$.`, `$C_\\mu c/(2h) = ${cm} \\times 0.5/(2 \\times ${n(h / 1000, 4)}) = ${n(cm * c / (2 * h / 1000), 4)}$ です。`], [`$u_j = 30\\sqrt{${n(cm * c / (2 * h / 1000), 4)}} = ${n(uj, 4)}$ m/s. ${uj > 250 ? 'That is close enough to sonic speed for compressibility to matter; a wider slot would help.' : 'Halving the slot height would raise it by a factor of $\\sqrt2$.'}`, `$u_j = 30\\sqrt{${n(cm * c / (2 * h / 1000), 4)}} = ${n(uj, 4)}$ m/s です。${uj > 250 ? '圧縮性が効くほど音速に近いので、スロットを広げるとよいでしょう。' : 'スロットの高さを半分にすると $\\sqrt2$ 倍になります。'}`]],
          set: { h },
        };
      }
      const cm = r.pick([0.02, 0.05, 0.1, 0.2]), c = r.pick([0.5, 1, 2]), R = r.pick([0.01, 0.02, 0.03]) * c, ratio = cm * c / R;
      return {
        q: [`Show that for a two-dimensional jet $\\Delta p = \\rho u_j^2h/R$ equals $C_\\mu q_\\infty c/R$ when $C_\\mu = 2hu_j^2/(cU^2)$, and use it: with $C_\\mu = ${cm}$, chord $${c}$ m and edge radius $${n(R * 1000, 3)}$ mm, what is $\\Delta p/q_\\infty$?`, `二次元の噴流で $C_\\mu = 2hu_j^2/(cU^2)$ のとき、$\\Delta p = \\rho u_j^2h/R$ が $C_\\mu q_\\infty c/R$ に等しいことを示し、それを使ってください。$C_\\mu = ${cm}$、翼弦 $${c}$ m、縁の半径 $${n(R * 1000, 3)}$ mm のとき、$\\Delta p/q_\\infty$ はいくらですか。`],
        a: { type: 'num', v: ratio, rel: 0.004 },
        hint: ['Write $\\rho u_j^2h = C_\\mu\\cdot\\tfrac12\\rho U^2c$.', '$\\rho u_j^2h = C_\\mu\\cdot\\tfrac12\\rho U^2c$ と書けます。'],
        sol: [[`From the definition, $\\rho u_j^2h = \\tfrac12\\rho U^2cC_\\mu = C_\\mu q_\\infty c$, so $\\Delta p = C_\\mu q_\\infty c/R$.`, `定義から $\\rho u_j^2h = \\tfrac12\\rho U^2cC_\\mu = C_\\mu q_\\infty c$ なので $\\Delta p = C_\\mu q_\\infty c/R$ です。`], [`$\\Delta p/q_\\infty = ${cm} \\times ${c}/${n(R, 4)} = ${n(ratio, 4)}$: set by $C_\\mu$ and the edge radius alone, whatever the slot height.`, `$\\Delta p/q_\\infty = ${cm} \\times ${c}/${n(R, 4)} = ${n(ratio, 4)}$ です。スロットの高さによらず、$C_\\mu$ と縁の半径だけで決まります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const a = r.pick([1.1, 1.2, 1.25]), c = r.pick([4, 4.1]), al = r.pick([0, 2, 4]), CL = r.pick([1.5, 2, 2.5, 3]);
        const s = CL * c / (8 * PI * a), ths = al - Math.asin(s) / DEG;
        return {
          q: [`A circulation-control section has circle radius $a = ${a}$ and chord $c = ${c}$ (with $U = 1$). At $\\alpha = ${al}^\\circ$, where must the rear stagnation point $\\theta_s$ sit for $C_L = ${CL}$? In degrees, two decimals.`, `循環制御翼の円の半径は $a = ${a}$、翼弦は $c = ${c}$（$U = 1$）です。$\\alpha = ${al}^\\circ$ で $C_L = ${CL}$ にするには、後方よどみ点 $\\theta_s$ をどこに置けばよいですか。度で、小数第二位まで答えてください。`],
          a: { type: 'num', v: ths, tol: 0.006, unit: ['°', '°'] },
          hint: ['$C_L = 2\\Gamma/c = 8\\pi a\\sin(\\alpha - \\theta_s)/c$.', '$C_L = 2\\Gamma/c = 8\\pi a\\sin(\\alpha - \\theta_s)/c$ です。'],
          sol: [[`$\\sin(\\alpha - \\theta_s) = C_Lc/(8\\pi a) = ${n(s, 5)}$, so $\\alpha - \\theta_s = ${n(Math.asin(s) / DEG, 4)}^\\circ$.`, `$\\sin(\\alpha - \\theta_s) = C_Lc/(8\\pi a) = ${n(s, 5)}$ なので $\\alpha - \\theta_s = ${n(Math.asin(s) / DEG, 4)}^\\circ$ です。`], [`$\\theta_s = ${n(ths, 4)}^\\circ$: below the centre, on the underside of the rounded edge, where the jet must hold on to get there.`, `$\\theta_s = ${n(ths, 4)}^\\circ$ です。中心より下、丸い縁の下面側で、噴流はそこまで張りついていなければなりません。`]],
        };
      }
      if (form === 1) {
        const eps = r.pick([0.1, 0.2, 0.3]), a = A0 + eps, c = r.pick([4.0, 4.07, 4.13]), cl = 8 * PI * a / c;
        return {
          q: [`Moving the rear stagnation point further round raises $\\Gamma = 4\\pi Ua\\sin(\\alpha - \\theta_s)$ until the two stagnation points merge at the bottom of the circle. For $a = ${n(a, 4)}$ and chord $c = ${c}$, what is the largest $C_L$ this potential-flow model allows?`, `後方よどみ点をさらに回り込ませると $\\Gamma = 4\\pi Ua\\sin(\\alpha - \\theta_s)$ は増え、やがて二つのよどみ点が円の底で一つになります。$a = ${n(a, 4)}$、翼弦 $c = ${c}$ のとき、このポテンシャル流のモデルで許される最大の $C_L$ はいくらですか。`],
          a: { type: 'num', v: cl, rel: 0.004 },
          hint: ['The sine is at most 1.', 'サインは最大 1 です。'],
          sol: [[`The two stagnation points satisfy $\\sin(\\theta - \\alpha) = -\\Gamma/(4\\pi Ua)$, which has a solution only while $\\Gamma \\le 4\\pi Ua$.`, `二つのよどみ点は $\\sin(\\theta - \\alpha) = -\\Gamma/(4\\pi Ua)$ を満たし、解があるのは $\\Gamma \\le 4\\pi Ua$ の間だけです。`], [`$C_{L,\\max} = 2(4\\pi a)/c = 8\\pi \\times ${n(a, 4)}/${c} = ${n(cl, 4)}$. Beyond it the stagnation point leaves the body; real sections stall well before this.`, `$C_{L,\\max} = 2(4\\pi a)/c = 8\\pi \\times ${n(a, 4)}/${c} = ${n(cl, 4)}$ です。それを超えるとよどみ点は物体から離れます。実際の断面はこれよりずっと手前で失速します。`]],
        };
      }
      if (form === 2) {
        const a = r.pick([1.1, 1.2, 1.3]), al = r.pick([0.05, 0.1]);
        return {
          q: [`With $U = 1$, circle radius $a = ${a}$ and $\\alpha = ${al}$ rad, write the circulation as a function of the stagnation angle $\\theta$ (radians) at which the jet separates.`, `$U = 1$、円の半径 $a = ${a}$、$\\alpha = ${al}$ rad のとき、噴流がはく離するよどみ点の角度 $\\theta$（ラジアン）の関数として循環を書いてください。`],
          a: { type: 'expr', v: `4*pi*${a}*sin(${al}-theta)`, vars: ['theta'], dom: { theta: [-0.9, 0] }, lhs: ['$\\Gamma(\\theta) =$', '$\\Gamma(\\theta) =$'] },
          hint: ['On the circle the surface speed is $-2U\\sin(\\theta - \\alpha) - \\Gamma/(2\\pi a)$; set it to zero at $\\theta$.', '円上の表面速度は $-2U\\sin(\\theta - \\alpha) - \\Gamma/(2\\pi a)$ です。$\\theta$ でこれをゼロにします。'],
          sol: [[`Zero surface speed at $\\theta$ gives $\\Gamma = -4\\pi Ua\\sin(\\theta - \\alpha)$.`, `$\\theta$ で表面速度がゼロなら $\\Gamma = -4\\pi Ua\\sin(\\theta - \\alpha)$ です。`], [`$\\Gamma(\\theta) = ${n(4 * a, 4)}\\pi\\sin(${al} - \\theta)$. With a sharp edge $\\theta$ would be pinned; here the jet chooses it.`, `$\\Gamma(\\theta) = ${n(4 * a, 4)}\\pi\\sin(${al} - \\theta)$ です。鋭い縁なら $\\theta$ は固定されますが、ここでは噴流がそれを選びます。`]],
        };
      }
      const opts = [['Not at all: $\\Delta p = C_\\mu q_\\infty c/R$', 'まったく変わらない：$\\Delta p = C_\\mu q_\\infty c/R$'], ['It doubles, since $\\Delta p \\propto h$', '二倍になる。$\\Delta p \\propto h$ だから'], ['It halves, since the jet is slower', '半分になる。噴流が遅くなるから'], ['It falls by $\\sqrt2$', '$\\sqrt2$ 分の一になる']];
      return {
        q: [`A circulation-control wing keeps the same $C_\\mu$ but its slot height is doubled. How does the pressure drop across the jet, $\\Delta p = \\rho u_j^2h/R$, change?`, `循環制御翼が同じ $C_\\mu$ を保ったまま、スロットの高さを二倍にします。噴流を横切る圧力差 $\\Delta p = \\rho u_j^2h/R$ はどう変わりますか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Fixed $C_\\mu$ fixes $\\rho u_j^2h$.', '$C_\\mu$ が決まれば $\\rho u_j^2h$ が決まります。'],
        sol: [[`$C_\\mu = 2hu_j^2/(cU^2)$ fixes $hu_j^2$: doubling $h$ lowers $u_j$ by $\\sqrt2$ and leaves $\\rho u_j^2h$ unchanged.`, `$C_\\mu = 2hu_j^2/(cU^2)$ は $hu_j^2$ を決めます。$h$ を二倍にすると $u_j$ は $\\sqrt2$ 分の一になり、$\\rho u_j^2h$ は変わりません。`], ['So $\\Delta p = C_\\mu q_\\infty c/R$ is unchanged; what changes is the jet speed, the mass flow and the power.', 'したがって $\\Delta p = C_\\mu q_\\infty c/R$ は変わりません。変わるのは噴流速度、質量流量、動力です。']],
        set: { h: 1 },
      };
    },
  ];

  /* ---------------- effector-allocation ---------------- */
  Q['effector-allocation'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const yaw = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]), Cn = yaw * 0.003, u = Cn / (0.475 * 3);
        return {
          q: [`A tip effector at $y/b = 0.475$ makes drag $\\Delta C_D = 3u$, and the yawing moment is $C_n = (y/b)\\,\\Delta C_D$. How hard must it blow, $u$, for $C_n = ${n(Cn, 4)}$? Give $u$ in units of $10^{-3}$.`, `$y/b = 0.475$ にある翼端の効果器は抗力 $\\Delta C_D = 3u$ を作り、偏揺れモーメントは $C_n = (y/b)\\,\\Delta C_D$ です。$C_n = ${n(Cn, 4)}$ にするには、どれだけ吹けばよいですか。$u$ を $10^{-3}$ 単位で答えてください。`],
          a: { type: 'num', v: u * 1000, rel: 0.004, unit: ['×10⁻³', '×10⁻³'] },
          hint: ['$u = C_n/((y/b)\\times3)$.', '$u = C_n/((y/b)\\times3)$ です。'],
          sol: [[`$(y/b)\\times3 = 1.425$.`, `$(y/b)\\times3 = 1.425$ です。`], [`$u = ${n(Cn, 4)}/1.425 = ${n(u * 1000, 4)}\\times10^{-3}$, from the right tip only for nose right: the left tip would push the other way.`, `$u = ${n(Cn, 4)}/1.425 = ${n(u * 1000, 4)}\\times10^{-3}$ です。機首右向きなら右翼端だけで吹きます。左翼端は逆向きに押します。`]],
          set: { roll: 0, pitch: 0, yaw, umax: 2 },
        };
      }
      if (form === 1) {
        const us = r.pick([1, 2, 3, 5, 8]), S = r.pick([30, 40, 60]), V = r.pick([150, 200, 250]), rho = 0.41, Vj = 300, q = 0.5 * rho * V * V, md = us / 1000 * q * S / Vj;
        return {
          q: [`The effectors blow a total momentum coefficient $\\sum u_i = ${us}\\times10^{-3}$ on a $${S}$ m² wing at $${V}$ m/s where $\\rho = 0.41$ kg/m³, with $300$ m/s jets. How much bleed air does that take, in kg/s?`, `効果器全体で運動量係数の合計 $\\sum u_i = ${us}\\times10^{-3}$ を吹き出しています。翼面積 $${S}$ m²、速度 $${V}$ m/s、$\\rho = 0.41$ kg/m³、噴流速度 $300$ m/s のとき、抽気量は何 kg/s ですか。`],
          a: { type: 'num', v: md, rel: 0.004, unit: ['kg/s', 'kg/s'] },
          hint: ['$\\dot m = \\sum u_i\\,q_\\infty S/V_j$.', '$\\dot m = \\sum u_i\\,q_\\infty S/V_j$ です。'],
          sol: [[`$q_\\infty = \\tfrac12 \\times 0.41 \\times ${V}^2 = ${n(q, 4)}$ Pa.`, `$q_\\infty = \\tfrac12 \\times 0.41 \\times ${V}^2 = ${n(q, 4)}$ Pa です。`], [`$\\dot m = ${n(us / 1000, 4)} \\times ${n(q, 4)} \\times ${S}/300 = ${n(md, 4)}$ kg/s, air taken from the engine that no longer makes thrust.`, `$\\dot m = ${n(us / 1000, 4)} \\times ${n(q, 4)} \\times ${S}/300 = ${n(md, 4)}$ kg/s です。エンジンから取り出した空気で、その分は推力を生みません。`]],
        };
      }
      const opts = [['The upper-surface slots: spoiling lift behind the centre of gravity raises the nose', '上面のスロット：重心より後ろで揚力を減らすと機首が上がる'], ['The lower-surface slots: more lift lifts the nose', '下面のスロット：揚力が増えれば機首が上がる'], ['Upper and lower slots equally', '上面と下面のスロットを同じだけ'], ['The tip drag effectors', '翼端の抗力用の効果器']];
      return {
        q: [`On this tailless aircraft every trailing-edge slot lies behind the centre of gravity. Which effectors should blow for a pure nose-up command?`, `この尾翼なし機では、後縁のスロットはすべて重心より後ろにあります。純粋な機首上げの指令では、どの効果器を吹けばよいですか。`],
        a: { type: 'choice', opts, v: 0 },
        hint: ['Pitching moment is $\\sum(x_i - x_{cg})\\,\\Delta C_{L,i}$ with $x_i - x_{cg} < 0$.', 'ピッチングモーメントは $\\sum(x_i - x_{cg})\\,\\Delta C_{L,i}$ で、$x_i - x_{cg} < 0$ です。'],
        sol: [['Behind the c.g. the lever arm is negative, so a positive (nose-up) moment needs $\\Delta C_L < 0$ there.', '重心より後ろでは腕の長さが負なので、正（機首上げ）のモーメントにはそこで $\\Delta C_L < 0$ が必要です。'], ['Upper-surface blowing spoils lift, so the upper slots blow, symmetrically on both wings so that no roll appears.', '上面の吹き出しは揚力を減らすので、上面のスロットを、ロールが出ないよう左右対称に吹きます。']],
        set: { roll: 0, pitch: 0.6, yaw: 0, umax: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b1 = r.pick([2, 3, 4, 6]), b2 = r.pick([1, 2, 5, 8].filter((x) => x !== b1)), m = r.pick([0.005, 0.01, 0.02]);
        const s = b1 * b1 + b2 * b2, u1 = b1 * m / s, u2 = b2 * m / s;
        return {
          q: [`Two effectors make the same moment with strengths $b = (${b1}, ${b2})$: $b_1u_1 + b_2u_2 = ${m}$. Which $u$ has the least $u_1^2 + u_2^2$? Give $u_1$ and $u_2$ to five decimals.`, `二つの効果器が強さ $b = (${b1}, ${b2})$ で同じモーメントを作ります：$b_1u_1 + b_2u_2 = ${m}$ です。$u_1^2 + u_2^2$ が最小の $u$ はどれですか。$u_1$ と $u_2$ を小数第五位まで答えてください。`],
          a: { type: 'tuple', v: [u1, u2], labels: ['$u_1$', '$u_2$'], tol: 0.000006 },
          hint: ['The minimum-norm solution points along $b$: $u = b\\,m/|b|^2$.', '最小ノルム解は $b$ の向きを向きます：$u = b\\,m/|b|^2$ です。'],
          sol: [[`$|b|^2 = ${b1}^2 + ${b2}^2 = ${s}$, so $u = (${b1}, ${b2}) \\times ${m}/${s}$.`, `$|b|^2 = ${b1}^2 + ${b2}^2 = ${s}$ なので $u = (${b1}, ${b2}) \\times ${m}/${s}$ です。`], [`$u = (${n(u1, 6)}, ${n(u2, 6)})$: the stronger effector does more of the work, in proportion to its strength, not all of it.`, `$u = (${n(u1, 6)}, ${n(u2, 6)})$ です。強い効果器がその強さに比例して多く働きますが、すべてを担うわけではありません。`]],
        };
      }
      if (form === 1) {
        const eta = r.pick([0.2, 0.56, 0.84]), side = r.pick([-1, 1]), surf = r.pick(['upper', 'lower']), k = surf === 'lower' ? 20 : -14, u = r.pick([0.5, 1, 1.5, 2]) / 1000;
        const y = side * eta, Cl = -(y / 2) * k * u;
        const sideW = side > 0 ? ['right', '右'] : ['left', '左'], surfW = surf === 'upper' ? ['upper', '上面'] : ['lower', '下面'];
        return {
          q: [`${surf === 'upper' ? 'An' : 'A'} ${surfW[0]}-surface slot on the ${sideW[0]} wing at $y = ${n(y, 2)}$ (half-span 1, so $b = 2$; $y$ positive to the right) has $\\Delta C_L = ${k}u$ and blows $u = ${n(u * 1000, 2)}\\times10^{-3}$. What rolling moment $C_l = -(y/b)\\,\\Delta C_L$ does it make (right wing down positive)? In units of $10^{-3}$.`, `${sideW[1]}翼の $y = ${n(y, 2)}$（半翼幅 1、したがって $b = 2$、右が正）にある${surfW[1]}スロットは $\\Delta C_L = ${k}u$ で、$u = ${n(u * 1000, 2)}\\times10^{-3}$ を吹いています。作るローリングモーメント $C_l = -(y/b)\\,\\Delta C_L$（右翼下げが正）はいくらですか。$10^{-3}$ 単位で答えてください。`],
          a: { type: 'num', v: Cl * 1000, tol: 0.0006, unit: ['×10⁻³', '×10⁻³'] },
          hint: [`$\\Delta C_L = ${k}\\times${n(u, 4)}$; mind both signs.`, `$\\Delta C_L = ${k}\\times${n(u, 4)}$ です。二つの符号に注意します。`],
          sol: [[`$\\Delta C_L = ${n(k * u, 5)}$ and $y/b = ${n(y / 2, 3)}$.`, `$\\Delta C_L = ${n(k * u, 5)}$、$y/b = ${n(y / 2, 3)}$ です。`], [`$C_l = -(${n(y / 2, 3)})(${n(k * u, 5)}) = ${n(Cl * 1000, 4)}\\times10^{-3}$: ${Cl > 0 ? 'right wing down' : 'left wing down'}.`, `$C_l = -(${n(y / 2, 3)})(${n(k * u, 5)}) = ${n(Cl * 1000, 4)}\\times10^{-3}$ で、${Cl > 0 ? '右翼下げ' : '左翼下げ'}です。`]],
        };
      }
      const yaw = r.pick([0.7, 0.8, 0.9, 1]), umax = r.pick([1, 1.2, 1.5, 1.8]), Cn = yaw * 0.003, need = Cn / 1.425, got = Math.min(need, umax / 1000) * 1.425;
      return {
        q: [`A nose-right command $C_n = ${n(Cn, 4)}$ can only use the right tip effector, which gives $C_n = 1.425u$ and is limited to $u \\le ${umax}\\times10^{-3}$. What yawing moment is delivered? In units of $10^{-3}$.`, `機首右向きの指令 $C_n = ${n(Cn, 4)}$ に使えるのは右翼端の効果器だけで、$C_n = 1.425u$、限界は $u \\le ${umax}\\times10^{-3}$ です。実際に得られる偏揺れモーメントはいくらですか。$10^{-3}$ 単位で答えてください。`],
        a: { type: 'num', v: got * 1000, rel: 0.004, unit: ['×10⁻³', '×10⁻³'] },
        hint: ['Find the $u$ the command needs and compare it with the limit.', '指令に必要な $u$ を求めて限界と比べます。'],
        sol: [[`The command needs $u = ${n(Cn, 4)}/1.425 = ${n(need * 1000, 4)}\\times10^{-3}$.`, `指令には $u = ${n(Cn, 4)}/1.425 = ${n(need * 1000, 4)}\\times10^{-3}$ が必要です。`],
          need > umax / 1000 ? [`That exceeds the limit, so the effector saturates at $${umax}\\times10^{-3}$ and delivers $1.425 \\times ${umax} = ${n(got * 1000, 4)}\\times10^{-3}$, ${n(100 * got / Cn, 3)}% of the command; no other effector makes yaw, so nothing can make up the shortfall.`, `限界を超えるので効果器は $${umax}\\times10^{-3}$ で飽和し、$1.425 \\times ${umax} = ${n(got * 1000, 4)}\\times10^{-3}$、つまり指令の ${n(100 * got / Cn, 3)}% を出します。偏揺れを作る効果器は他にないので、不足は補えません。`]
            : [`That is within the limit, so the full $${n(got * 1000, 4)}\\times10^{-3}$ is delivered by the right tip alone.`, `限界内なので、右翼端だけで $${n(got * 1000, 4)}\\times10^{-3}$ がそのまま得られます。`]],
        set: { roll: 0, pitch: 0, yaw, umax },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([2, 3, 4]), q = r.pick([1, 5, 6].filter((x) => x !== p)), s = p * p + q * q;
        return {
          q: [`Two effectors share one moment equation $${p}u_1 + ${q}u_2 = m$. Ignoring bounds, write the minimum-norm $u_1$ as a function of $m$.`, `二つの効果器が一本のモーメントの式 $${p}u_1 + ${q}u_2 = m$ を分け合います。上下限を無視して、最小ノルムの $u_1$ を $m$ の関数として書いてください。`],
          a: { type: 'expr', v: `${p}*m/${s}`, vars: ['m'], dom: { m: [-1, 1] }, lhs: ['$u_1(m) =$', '$u_1(m) =$'] },
          hint: ['$u^\\ast = B^{\\mathsf T}(BB^{\\mathsf T})^{-1}m$ with $B = (' + p + ',\\ ' + q + ')$.', '$B = (' + p + ',\\ ' + q + ')$ として $u^\\ast = B^{\\mathsf T}(BB^{\\mathsf T})^{-1}m$ です。'],
          sol: [[`$BB^{\\mathsf T} = ${p}^2 + ${q}^2 = ${s}$, so $u^\\ast = (${p}, ${q})\\,m/${s}$.`, `$BB^{\\mathsf T} = ${p}^2 + ${q}^2 = ${s}$ なので $u^\\ast = (${p}, ${q})\\,m/${s}$ です。`], [`$u_1 = ${p}m/${s}$. It is linear in $m$, which is why the unbounded allocator is just a matrix; the bounds are what make it a programme.`, `$u_1 = ${p}m/${s}$ です。$m$ について線形なので、上下限のない割り当て器はただの行列です。計画問題にするのは上下限です。`]],
        };
      }
      if (form === 1) {
        const b1 = r.pick([3, 4, 5]), b2 = -r.pick([1, 2, 3]), m = r.pick([0.006, 0.01, 0.012]);
        const s = b1 * b1 + b2 * b2, f1 = b1 * m / s, f2 = b2 * m / s, u1 = m / b1;
        return {
          q: [`Two jets make one moment, $${b1}u_1 ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}u_2 = ${m}$, and jets can only blow: $u_1, u_2 \\ge 0$. Find the least-norm blowing. Give $u_1$ to five decimals.`, `二つの噴流が一つのモーメント $${b1}u_1 ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}u_2 = ${m}$ を作り、噴流は吹くことしかできないので $u_1, u_2 \\ge 0$ です。ノルムが最小の吹き出しを求め、$u_1$ を小数第五位まで答えてください。`],
          a: { type: 'num', v: u1, tol: 0.000006 },
          hint: ['Try the unbounded solution first and check its signs.', 'まず上下限のない解を求め、符号を確かめます。'],
          sol: [[`Unbounded, $u = (${b1}, ${b2})\\,${m}/${s} = (${n(f1, 6)}, ${n(f2, 6)})$, but $u_2 < 0$ would mean sucking.`, `上下限なしでは $u = (${b1}, ${b2})\\,${m}/${s} = (${n(f1, 6)}, ${n(f2, 6)})$ ですが、$u_2 < 0$ は吸い込みを意味します。`], [`So $u_2 = 0$ is active and $u_1 = ${m}/${b1} = ${n(u1, 6)}$; its multiplier has the right sign because blowing jet 2 would only oppose the moment.`, `したがって $u_2 = 0$ が有効制約になり、$u_1 = ${m}/${b1} = ${n(u1, 6)}$ です。噴流 2 を吹けばモーメントに逆らうだけなので、乗数の符号も正しくなります。`]],
        };
      }
      const nE = r.pick([8, 10, 14, 16, 20]), rows = r.pick([3, 4]);
      return {
        q: [`An aircraft has $${nE}$ effectors and the allocator must meet $${rows}$ independent equations (${rows === 3 ? 'roll, pitch, yaw' : 'roll, pitch, yaw and lift'}), with $B$ of full rank. How many dimensions does the family of exact, unbounded solutions have?`, `機体に $${nE}$ 個の効果器があり、割り当て器は $${rows}$ 本の独立な式（${rows === 3 ? 'ロール、ピッチ、ヨー' : 'ロール、ピッチ、ヨー、揚力'}）を満たさなければなりません。$B$ はフルランクです。上下限なしの厳密解の族は何次元ですか。`],
        a: { type: 'int', v: nE - rows },
        hint: ['Solutions differ by vectors in the null space of $B$.', '解どうしの差は $B$ の零空間のベクトルです。'],
        sol: [[`By rank–nullity, $\\dim\\ker B = ${nE} - ${rows}$.`, `階数・退化次数の定理より $\\dim\\ker B = ${nE} - ${rows}$ です。`], [`So the exact solutions form a ${nE - rows}-dimensional affine family, and the allocator uses that freedom to minimise $\\|u\\|^2$ and keep every jet inside its bounds.`, `したがって厳密解は ${nE - rows} 次元のアフィンな族をなし、割り当て器はその自由度を使って $\\|u\\|^2$ を最小にし、すべての噴流を上下限内に保ちます。`]],
      };
    },
  ];
})();
