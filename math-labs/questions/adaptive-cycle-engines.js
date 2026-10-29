'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const G = 1.4, CP = 1004.5, RG = CP * (G - 1) / G, EX = (G - 1) / G, HPR = 42.8e6, G0 = 9.80665;
  const T11 = 216.65, A11 = Math.sqrt(G * RG * T11);
  const isaT = (z) => (z < 11 ? 288.15 - 6.5 * z : 216.65);
  // ideal multi-stream cycle (the same equations as the experiment, written out again here)
  function cyc(M0, z, T4, pc, streams) {
    const T0 = isaT(z), a0 = Math.sqrt(G * RG * T0), V0 = M0 * a0, tr = 1 + 0.2 * M0 * M0, tl = T4 / T0, tc = pc ** EX;
    let w = tc - 1; for (const s of streams) w += s.a * (s.pf ** EX - 1);
    const tt = 1 - tr / tl * w, V9 = a0 * Math.sqrt(2 / (G - 1) * tl / (tr * tc) * (tr * tc * tt - 1));
    let Fc = V9 - V0; const V = streams.map((s) => { const v = a0 * Math.sqrt(2 / (G - 1) * (tr * s.pf ** EX - 1)); Fc += s.a * (v - V0); return v; });
    const f = CP * T0 * (tl - tr * tc) / HPR;
    return { T0, a0, V0, tr, tl, tc, tt, V9, V, Fc, f, S: f / Fc, mt: 1 + streams.reduce((x, s) => x + s.a, 0) };
  }
  const optPf = (M0, z, T4, pc, a) => { const T0 = isaT(z), tr = 1 + 0.2 * M0 * M0, tl = T4 / T0, tc = pc ** EX; return ((tl - tr * (tc - 1) - tl / (tr * tc) + a * tr + 1) / (tr * (1 + a))) ** (1 / EX); };
  const optA = (M0, z, T4, pc, pf) => { const T0 = isaT(z), tr = 1 + 0.2 * M0 * M0, tl = T4 / T0, tc = pc ** EX, tf = pf ** EX, s = Math.sqrt(tr * tf - 1) + Math.sqrt(tr - 1); return (tl - tr * (tc - 1) - tl / (tr * tc) - s * s / 4) / (tr * (tf - 1)); };

  /* ---------------- bypass-tradeoff ---------------- */
  Q['bypass-tradeoff'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V0 = r.pick([200, 230, 250, 270, 300]), Vj = r.pick([400, 500, 600, 800, 1000, 1200]), e = 2 / (1 + Vj / V0);
        return {
          q: [`A jet leaves at $V_j = ${Vj}$ m/s from an aircraft flying at $V_0 = ${V0}$ m/s. What is the propulsive efficiency $\\eta_P = 2/(1 + V_j/V_0)$? As a percentage.`, `飛行速度 $V_0 = ${V0}$ m/s の機体から噴流が $V_j = ${Vj}$ m/s で出ていきます。推進効率 $\\eta_P = 2/(1 + V_j/V_0)$ はいくらですか。百分率で答えてください。`],
          a: { type: 'num', v: 100 * e, rel: 0.005, unit: ['%', '%'] },
          hint: ['Divide the jet speed by the flight speed first.', 'まず噴流の速さを飛行速度で割ります。'],
          sol: [[`$V_j/V_0 = ${n(Vj / V0, 4)}$.`, `$V_j/V_0 = ${n(Vj / V0, 4)}$ です。`], [`$\\eta_P = 2/${n(1 + Vj / V0, 4)} = ${n(100 * e, 3)}\\%$. The rest of the jet's kinetic energy is left behind in the wake.`, `$\\eta_P = 2/${n(1 + Vj / V0, 4)} = ${n(100 * e, 3)}\\%$ です。噴流の運動エネルギーの残りは後流に置き去りになります。`]],
        };
      }
      if (form === 1) {
        const M0 = r.pick([0.6, 0.8, 0.85, 0.9, 1.2, 1.5, 1.8, 2]), tr = 1 + 0.2 * M0 * M0;
        return {
          q: [`What is the ram temperature ratio $\\tau_r = 1 + \\tfrac{\\gamma - 1}{2}M_0^2$ at Mach $${M0}$, with $\\gamma = 1.4$? Four decimals.`, `$\\gamma = 1.4$ のとき、マッハ $${M0}$ でのラム温度比 $\\tau_r = 1 + \\tfrac{\\gamma - 1}{2}M_0^2$ はいくらですか。小数第四位まで答えてください。`],
          a: { type: 'num', v: tr, tol: 0.00006 },
          hint: ['$(\\gamma - 1)/2 = 0.2$.', '$(\\gamma - 1)/2 = 0.2$ です。'],
          sol: [[`$0.2 \\times ${M0}^2 = ${n(0.2 * M0 * M0, 5)}$.`, `$0.2 \\times ${M0}^2 = ${n(0.2 * M0 * M0, 5)}$ です。`], [`$\\tau_r = ${n(tr, 5)}$: the air arrives that much hotter, in total temperature, before any compressor touches it.`, `$\\tau_r = ${n(tr, 5)}$ です。空気は圧縮機に触れる前から、全温でそれだけ熱くなって到着します。`]],
          set: { M0 },
        };
      }
      const M0 = r.pick([0, 0.5, 0.85, 1.5]), pc = r.pick([10, 15, 20, 25, 30, 40]), tr = 1 + 0.2 * M0 * M0, eta = 1 - 1 / (tr * pc ** EX);
      return {
        q: [`An ideal turbofan with overall pressure ratio $\\pi_c = ${pc}$ flies at Mach $${M0}$. What is its thermal efficiency $\\eta_T = 1 - 1/(\\tau_r\\tau_c)$, with $\\tau_c = \\pi_c^{0.2857}$? As a percentage.`, `全体圧力比 $\\pi_c = ${pc}$ の理想ターボファンがマッハ $${M0}$ で飛んでいます。熱効率 $\\eta_T = 1 - 1/(\\tau_r\\tau_c)$ はいくらですか。$\\tau_c = \\pi_c^{0.2857}$ です。百分率で答えてください。`],
        a: { type: 'num', v: 100 * eta, rel: 0.004, unit: ['%', '%'] },
        hint: ['Only the total pressure ratio of compression matters: ram plus compressor.', '効くのは圧縮全体の全圧比だけです。ラムと圧縮機をあわせたものです。'],
        sol: [[`$\\tau_r = ${n(tr, 4)}$, $\\tau_c = ${pc}^{2/7} = ${n(pc ** EX, 4)}$.`, `$\\tau_r = ${n(tr, 4)}$、$\\tau_c = ${pc}^{2/7} = ${n(pc ** EX, 4)}$ です。`], [`$\\eta_T = 1 - 1/${n(tr * pc ** EX, 4)} = ${n(100 * eta, 3)}\\%$. It does not depend on the bypass ratio or the fan at all.`, `$\\eta_T = 1 - 1/${n(tr * pc ** EX, 4)} = ${n(100 * eta, 3)}\\%$ です。バイパス比にもファンにもまったくよりません。`]],
        set: { M0, pc },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const M0 = r.pick([0.8, 0.85, 0.9]), pc = r.pick([20, 25, 30]), T4 = r.pick([1500, 1600, 1700, 1800]), c = cyc(M0, 11, T4, pc, []);
        return {
          q: [`An ideal turbojet flies at Mach $${M0}$ at 11 km ($T_0 = 216.65$ K, $a_0 = 295.1$ m/s) with $\\pi_c = ${pc}$ and $T_{t4} = ${T4}$ K. Using $(V_9/a_0)^2 = 5\\,[\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c)]$, find its specific thrust $V_9 - V_0$ in N·s/kg.`, `理想ターボジェットが高度 11 km（$T_0 = 216.65$ K、$a_0 = 295.1$ m/s）をマッハ $${M0}$ で飛び、$\\pi_c = ${pc}$、$T_{t4} = ${T4}$ K です。$(V_9/a_0)^2 = 5\\,[\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c)]$ を使って、比推力 $V_9 - V_0$ を N·s/kg で求めてください。`],
          a: { type: 'num', v: c.Fc, rel: 0.006, unit: ['N·s/kg', 'N·s/kg'] },
          hint: ['$\\tau_\\lambda = T_{t4}/T_0$; the bracket is the jet enthalpy left after the turbine has paid for the compressor.', '$\\tau_\\lambda = T_{t4}/T_0$ です。かっこの中は、タービンが圧縮機の分を払ったあとに残る噴流のエンタルピーです。'],
          sol: [[`$\\tau_r = ${n(c.tr, 4)}$, $\\tau_\\lambda = ${n(c.tl, 4)}$, $\\tau_c = ${n(c.tc, 4)}$.`, `$\\tau_r = ${n(c.tr, 4)}$、$\\tau_\\lambda = ${n(c.tl, 4)}$、$\\tau_c = ${n(c.tc, 4)}$ です。`], [`$(V_9/a_0)^2 = ${n((c.V9 / c.a0) ** 2, 4)}$, so $V_9 = ${n(c.V9, 4)}$ m/s, and $V_0 = ${n(c.V0, 4)}$ m/s.`, `$(V_9/a_0)^2 = ${n((c.V9 / c.a0) ** 2, 4)}$ なので $V_9 = ${n(c.V9, 4)}$ m/s、$V_0 = ${n(c.V0, 4)}$ m/s です。`], [`$F/\\dot m_0 = ${n(c.Fc, 4)}$ N·s/kg: high, because all the jet energy goes into one fast jet.`, `$F/\\dot m_0 = ${n(c.Fc, 4)}$ N·s/kg です。噴流のエネルギーがすべて一本の速い噴流に入るので大きくなります。`]],
          set: { M0, alt: 11, pc, T4, a: 0 },
        };
      }
      if (form === 1) {
        const M0 = r.pick([0.8, 0.85, 0.9, 1.2]), pf = r.pick([1.6, 2, 2.5, 3, 3.5, 4]), tr = 1 + 0.2 * M0 * M0, v = A11 * Math.sqrt(5 * (tr * pf ** EX - 1));
        return {
          q: [`At 11 km ($a_0 = 295.1$ m/s) and Mach $${M0}$, how fast does the ideal fan jet leave a fan of pressure ratio $\\pi_f = ${pf}$? $V_{19}/a_0 = \\sqrt{5(\\tau_r\\tau_f - 1)}$. In m/s.`, `高度 11 km（$a_0 = 295.1$ m/s）、マッハ $${M0}$ で、圧力比 $\\pi_f = ${pf}$ のファンから理想的なファン噴流はどれだけの速さで出ますか。$V_{19}/a_0 = \\sqrt{5(\\tau_r\\tau_f - 1)}$ です。m/s で答えてください。`],
          a: { type: 'num', v, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['$\\tau_f = \\pi_f^{2/7}$.', '$\\tau_f = \\pi_f^{2/7}$ です。'],
          sol: [[`$\\tau_r = ${n(tr, 4)}$, $\\tau_f = ${n(pf ** EX, 4)}$, $\\tau_r\\tau_f - 1 = ${n(tr * pf ** EX - 1, 4)}$.`, `$\\tau_r = ${n(tr, 4)}$、$\\tau_f = ${n(pf ** EX, 4)}$、$\\tau_r\\tau_f - 1 = ${n(tr * pf ** EX - 1, 4)}$ です。`], [`$V_{19} = 295.1\\sqrt{5 \\times ${n(tr * pf ** EX - 1, 4)}} = ${n(v, 4)}$ m/s, against a flight speed of $${n(M0 * A11, 4)}$ m/s. It does not depend on the bypass ratio.`, `$V_{19} = 295.1\\sqrt{5 \\times ${n(tr * pf ** EX - 1, 4)}} = ${n(v, 4)}$ m/s で、飛行速度は $${n(M0 * A11, 4)}$ m/s です。バイパス比にはよりません。`]],
          set: { M0, alt: 11, pf },
        };
      }
      const f = r.pick([0.022, 0.024, 0.025, 0.027]), a = r.pick([0.5, 0.8, 1, 2, 5]), Fs = r.pick([300, 450, 600, 750]), S = f / ((1 + a) * Fs) * 1e6;
      return {
        q: [`A turbofan with bypass ratio $${a}$ burns $f = ${f}$ kg of fuel per kg of core air and gives $${Fs}$ N·s/kg of thrust per kg/s of total air. What is its TSFC $S = f/[(1 + \\alpha)F/\\dot m_0]$, in mg/(N·s)?`, `バイパス比 $${a}$ のターボファンが、コア空気 1 kg あたり $f = ${f}$ kg の燃料を燃やし、全空気 1 kg/s あたり $${Fs}$ N·s/kg の推力を出します。TSFC $S = f/[(1 + \\alpha)F/\\dot m_0]$ を mg/(N·s) で求めてください。`],
        a: { type: 'num', v: S, rel: 0.005, unit: ['mg/(N·s)', 'mg/(N·s)'] },
        hint: ['Thrust per kg of core air is $(1 + \\alpha)$ times the thrust per kg of total air.', 'コア空気 1 kg あたりの推力は、全空気 1 kg あたりの推力の $(1 + \\alpha)$ 倍です。'],
        sol: [[`Thrust per unit core flow: $${n(1 + a, 3)} \\times ${Fs} = ${n((1 + a) * Fs, 4)}$ N·s/kg.`, `コア流量あたりの推力は $${n(1 + a, 3)} \\times ${Fs} = ${n((1 + a) * Fs, 4)}$ N·s/kg です。`], [`$S = ${f}/${n((1 + a) * Fs, 4)} = ${sig(S / 1e6, 4)}$ kg/(N·s) $= ${n(S, 4)}$ mg/(N·s).`, `$S = ${f}/${n((1 + a) * Fs, 4)} = ${sig(S / 1e6, 4)}$ kg/(N·s) $= ${n(S, 4)}$ mg/(N·s) です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const T4 = r.pick([1500, 1600, 1700]), a = r.pick([3, 4, 5, 6, 8]), pc = r.pick([25, 30, 35]), pf = optPf(0.85, 11, T4, pc, a), c = cyc(0.85, 11, T4, pc, [{ a, pf }]);
        const set = { M0: 0.85, alt: 11, pc, T4, a }; if (pf >= 1.2 && pf <= 6) set.pf = Math.round(pf * 20) / 20;
        return {
          q: [`For an ideal turbofan at Mach 0.85 and 11 km with $\\pi_c = ${pc}$, $T_{t4} = ${T4}$ K and bypass ratio $\\alpha = ${a}$, which fan pressure ratio gives the least fuel per unit thrust? Use $\\tau_f^* = [\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c) + \\alpha\\tau_r + 1]/[\\tau_r(1 + \\alpha)]$. Three significant figures.`, `マッハ 0.85、高度 11 km で $\\pi_c = ${pc}$、$T_{t4} = ${T4}$ K、バイパス比 $\\alpha = ${a}$ の理想ターボファンでは、どのファン圧力比で推力あたりの燃料が最も少なくなりますか。$\\tau_f^* = [\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c) + \\alpha\\tau_r + 1]/[\\tau_r(1 + \\alpha)]$ を使い、有効数字三桁で答えてください。`],
          a: { type: 'num', v: pf, rel: 0.006 },
          hint: ['At the optimum the fan jet and the core jet leave at the same speed.', '最適では、ファンの噴流とコアの噴流が同じ速さで出ていきます。'],
          sol: [[`$\\tau_r = ${n(c.tr, 4)}$, $\\tau_\\lambda = ${n(c.tl, 4)}$, $\\tau_c = ${n(c.tc, 4)}$, so $\\tau_f^* = ${n(pf ** EX, 5)}$.`, `$\\tau_r = ${n(c.tr, 4)}$、$\\tau_\\lambda = ${n(c.tl, 4)}$、$\\tau_c = ${n(c.tc, 4)}$ なので $\\tau_f^* = ${n(pf ** EX, 5)}$ です。`], [`$\\pi_f^* = (\\tau_f^*)^{3.5} = ${n(pf, 4)}$.`, `$\\pi_f^* = (\\tau_f^*)^{3.5} = ${n(pf, 4)}$ です。`], [`Check: both jets leave at $${n(c.V9, 4)}$ m/s. Sharing the jet energy equally between the two streams wastes the least kinetic energy for the thrust.`, `確かめると、二本の噴流はどちらも $${n(c.V9, 4)}$ m/s で出ます。噴流のエネルギーを二つの流れに等しく分けると、推力に対して捨てる運動エネルギーが最も少なくなります。`]],
          set,
        };
      }
      if (form === 1) {
        const T4 = r.pick([1500, 1600, 1700, 1800]), pf = r.pick([1.6, 1.8, 2, 2.5, 3]), a = optA(0.85, 11, T4, 30, pf), c = cyc(0.85, 11, T4, 30, [{ a, pf }]);
        return {
          q: [`With $\\pi_c = 30$, $T_{t4} = ${T4}$ K, Mach 0.85 at 11 km and a fan of $\\pi_f = ${pf}$, the ideal turbofan's TSFC is least when the core jet has slowed to the average of the fan jet and the flight speed, $V_9 = (V_{19} + V_0)/2$. Which bypass ratio is that? Three significant figures.`, `$\\pi_c = 30$、$T_{t4} = ${T4}$ K、高度 11 km でマッハ 0.85、ファン $\\pi_f = ${pf}$ の理想ターボファンの TSFC は、コアの噴流がファンの噴流と飛行速度の平均 $V_9 = (V_{19} + V_0)/2$ まで遅くなったとき最小になります。それはどのバイパス比ですか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: a, rel: 0.006 },
          hint: ['$(V_9/a_0)^2$ falls linearly with $\\alpha$: by $5\\tau_r(\\tau_f - 1)$ for each unit of bypass ratio.', '$(V_9/a_0)^2$ は $\\alpha$ に対して直線的に下がります。バイパス比 1 あたり $5\\tau_r(\\tau_f - 1)$ ずつです。'],
          sol: [[`$V_{19} = ${n(c.V[0], 4)}$ m/s and $V_0 = ${n(c.V0, 4)}$ m/s, so the target core jet is $${n((c.V[0] + c.V0) / 2, 4)}$ m/s.`, `$V_{19} = ${n(c.V[0], 4)}$ m/s、$V_0 = ${n(c.V0, 4)}$ m/s なので、目標のコア噴流は $${n((c.V[0] + c.V0) / 2, 4)}$ m/s です。`], [`Solving $(V_9/a_0)^2 = 5[\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c) - \\alpha\\tau_r(\\tau_f - 1)]$ for that speed gives $\\alpha^* = ${n(a, 4)}$.`, `その速さについて $(V_9/a_0)^2 = 5[\\tau_\\lambda - \\tau_r(\\tau_c - 1) - \\tau_\\lambda/(\\tau_r\\tau_c) - \\alpha\\tau_r(\\tau_f - 1)]$ を解くと $\\alpha^* = ${n(a, 4)}$ です。`], [`Beyond it, the next unit of bypass air would cost the core jet more thrust than it adds through the fan.`, `それを超えると、バイパス空気を増やした分だけ、ファンで加わる推力よりコアの噴流が失う推力のほうが大きくなります。`]],
          set: a <= 10 ? { M0: 0.85, alt: 11, pc: 30, T4, pf, a: Math.round(a * 20) / 20 } : undefined,
        };
      }
      const k = r.pick([2, 3, 4]);
      return {
        q: [`A single stream leaves at $V_j = r V_0$. Thrust power is $F V_0 = \\dot m(V_j - V_0)V_0$ and the kinetic power added is $\\tfrac12\\dot m(V_j^2 - V_0^2)$. Write the propulsive efficiency as a function of $r$.`, `一つの流れが $V_j = r V_0$ で出ていきます。推力の仕事率は $F V_0 = \\dot m(V_j - V_0)V_0$、加えた運動エネルギーの仕事率は $\\tfrac12\\dot m(V_j^2 - V_0^2)$ です。推進効率を $r$ の関数として書いてください。`],
        a: { type: 'expr', v: '2/(1+r)', vars: ['r'], dom: { r: [1.1, 6] }, lhs: ['$\\eta_P(r) =$', '$\\eta_P(r) =$'] },
        hint: ['Factor $V_j^2 - V_0^2 = (V_j - V_0)(V_j + V_0)$.', '$V_j^2 - V_0^2 = (V_j - V_0)(V_j + V_0)$ と因数分解します。'],
        sol: [[`$\\eta_P = \\dfrac{(V_j - V_0)V_0}{\\tfrac12(V_j - V_0)(V_j + V_0)} = \\dfrac{2V_0}{V_j + V_0}$.`, `$\\eta_P = \\dfrac{(V_j - V_0)V_0}{\\tfrac12(V_j - V_0)(V_j + V_0)} = \\dfrac{2V_0}{V_j + V_0}$ です。`], [`Dividing by $V_0$: $\\eta_P = 2/(1 + r)$. At $r = ${k}$ it is only $${n(200 / (1 + k), 3)}\\%$: the closer the jet is to the flight speed, the less energy is wasted, but the more air is needed for the same thrust.`, `$V_0$ で割ると $\\eta_P = 2/(1 + r)$ です。$r = ${k}$ ではわずか $${n(200 / (1 + k), 3)}\\%$ です。噴流が飛行速度に近いほど捨てるエネルギーは少なくなりますが、同じ推力により多くの空気が要ります。`]],
      };
    },
  ];

  /* ---------------- three-stream-engine ---------------- */
  const A2 = 0.35, PF = 3.8, PF3 = 2.2, M0T = 100;
  const a3m = (m) => 0.1 + 1.1 * m;
  Q['three-stream-engine'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m3 = r.pick([5, 8, 12, 20, 30, 40, 47]), dT = r.pick([10, 20, 25, 30, 40, 60]), Qk = m3 * CP * dT / 1000;
        return {
          q: [`A third stream carries $${m3}$ kg/s of air, which may warm by at most $${dT}$ K. How much heat can it absorb, $Q = \\dot m_3 c_p\\Delta T$ with $c_p = 1004.5$ J/(kg·K)? In kW.`, `第三流路が空気 $${m3}$ kg/s を運び、温度上昇は最大 $${dT}$ K まで許されます。吸収できる熱 $Q = \\dot m_3 c_p\\Delta T$ はいくらですか。$c_p = 1004.5$ J/(kg·K) とし、kW で答えてください。`],
          a: { type: 'num', v: Qk, rel: 0.005, unit: ['kW', 'kW'] },
          hint: ['Multiply, then divide by 1000 for kW.', 'かけ合わせてから、kW にするため 1000 で割ります。'],
          sol: [[`$Q = ${m3} \\times 1004.5 \\times ${dT} = ${n(Qk * 1000, 6)}$ W.`, `$Q = ${m3} \\times 1004.5 \\times ${dT} = ${n(Qk * 1000, 6)}$ W です。`], [`$= ${n(Qk, 4)}$ kW, enough for that much electronics and weapon heat without a separate cooling system.`, `$= ${n(Qk, 4)}$ kW です。別の冷却装置なしに、それだけの電子機器や兵装の熱を捨てられます。`]],
          set: { dT },
        };
      }
      if (form === 1) {
        const m = r.pick([0, 0.25, 0.5, 0.75, 1]), a3 = a3m(m), mc = M0T / (1 + A2 + a3);
        return {
          q: [`The engine swallows $100$ kg/s. The inner bypass ratio is $\\alpha_2 = 0.35$ and the third-stream ratio is $\\alpha_3 = ${n(a3, 3)}$, both relative to the core flow. How much air goes through the core, in kg/s?`, `機関は $100$ kg/s を吸い込みます。内側のバイパス比は $\\alpha_2 = 0.35$、第三流路の比は $\\alpha_3 = ${n(a3, 3)}$ で、どちらもコア流量に対する比です。コアを通る空気は何 kg/s ですか。`],
          a: { type: 'num', v: mc, rel: 0.004, unit: ['kg/s', 'kg/s'] },
          hint: ['$\\dot m_0 = \\dot m_c(1 + \\alpha_2 + \\alpha_3)$.', '$\\dot m_0 = \\dot m_c(1 + \\alpha_2 + \\alpha_3)$ です。'],
          sol: [[`$1 + \\alpha_2 + \\alpha_3 = ${n(1 + A2 + a3, 4)}$.`, `$1 + \\alpha_2 + \\alpha_3 = ${n(1 + A2 + a3, 4)}$ です。`], [`$\\dot m_c = 100/${n(1 + A2 + a3, 4)} = ${n(mc, 4)}$ kg/s. Only this air is burned with fuel; the fuel flow, and the hot jet, scale with it.`, `$\\dot m_c = 100/${n(1 + A2 + a3, 4)} = ${n(mc, 4)}$ kg/s です。燃料と一緒に燃やされるのはこの空気だけで、燃料流量と熱い噴流はこれに比例します。`]],
          set: { mode: m },
        };
      }
      const m3 = r.pick([6.9, 10, 20, 30, 47.1]), Qk = r.pick([100, 200, 300, 400, 600]), dT = Qk * 1000 / (m3 * CP);
      return {
        q: [`An aircraft rejects $${Qk}$ kW of heat into a third stream of $${m3}$ kg/s. By how much does the air warm? $c_p = 1004.5$ J/(kg·K). In K.`, `機体が $${Qk}$ kW の熱を $${m3}$ kg/s の第三流路に捨てます。空気は何 K 温まりますか。$c_p = 1004.5$ J/(kg·K) です。`],
        a: { type: 'num', v: dT, rel: 0.005, unit: ['K', 'K'] },
        hint: ['$\\Delta T = Q/(\\dot m_3 c_p)$; use watts.', '$\\Delta T = Q/(\\dot m_3 c_p)$ です。ワットで計算します。'],
        sol: [[`$\\Delta T = ${Qk * 1000}/(${m3} \\times 1004.5)$.`, `$\\Delta T = ${Qk * 1000}/(${m3} \\times 1004.5)$ です。`], [`$= ${n(dT, 4)}$ K. A small third stream (combat mode) warms far more for the same load.`, `$= ${n(dT, 4)}$ K です。小さな第三流路（戦闘モード）では、同じ負荷でずっと大きく温まります。`]],
        set: { Q: Qk },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mc = r.pick([40, 50, 60, 70]), a2 = 0.35, a3 = r.pick([0.1, 0.5, 0.8, 1.2]), V0 = r.pick([250, 265, 300]), V9 = r.pick([1000, 1150, 1250]), V19 = r.pick([500, 550, 600]), V39 = r.pick([420, 450, 480]);
        const F = mc * ((V9 - V0) + a2 * (V19 - V0) + a3 * (V39 - V0)) / 1000;
        return {
          q: [`A three-stream engine has core flow $${mc}$ kg/s, $\\alpha_2 = ${a2}$, $\\alpha_3 = ${a3}$, flight speed $${V0}$ m/s and jets $V_9 = ${V9}$, $V_{19} = ${V19}$, $V_{39} = ${V39}$ m/s. What is its thrust, in kN?`, `三流路の機関のコア流量は $${mc}$ kg/s、$\\alpha_2 = ${a2}$、$\\alpha_3 = ${a3}$、飛行速度は $${V0}$ m/s、噴流は $V_9 = ${V9}$、$V_{19} = ${V19}$、$V_{39} = ${V39}$ m/s です。推力は何 kN ですか。`],
          a: { type: 'num', v: F, rel: 0.004, unit: ['kN', 'kN'] },
          hint: ['Each stream contributes its mass flow times its speed gain.', '各流路は、その質量流量と速度の増分の積を寄与します。'],
          sol: [[`Per kg of core air: $(${V9} - ${V0}) + ${a2}(${V19} - ${V0}) + ${a3}(${V39} - ${V0}) = ${n(F * 1000 / mc, 5)}$ N·s/kg.`, `コア空気 1 kg あたり $(${V9} - ${V0}) + ${a2}(${V19} - ${V0}) + ${a3}(${V39} - ${V0}) = ${n(F * 1000 / mc, 5)}$ N·s/kg です。`], [`$F = ${mc} \\times ${n(F * 1000 / mc, 5)} = ${n(F, 4)}$ kN.`, `$F = ${mc} \\times ${n(F * 1000 / mc, 5)} = ${n(F, 4)}$ kN です。`]],
        };
      }
      if (form === 1) {
        const V0 = r.pick([250, 265, 300]), V9 = r.pick([1000, 1150, 1250]), V19 = r.pick([500, 550]), V39 = r.pick([420, 450]), a2 = 0.35, a3 = r.pick([0.1, 0.6, 1.2]);
        const F = (V9 - V0) + a2 * (V19 - V0) + a3 * (V39 - V0), KE = (V9 * V9 - V0 * V0) + a2 * (V19 * V19 - V0 * V0) + a3 * (V39 * V39 - V0 * V0), e = 2 * V0 * F / KE;
        return {
          q: [`With $V_0 = ${V0}$ m/s, $\\alpha_2 = ${a2}$, $\\alpha_3 = ${a3}$ and jets $V_9 = ${V9}$, $V_{19} = ${V19}$, $V_{39} = ${V39}$ m/s, find the propulsive efficiency $\\eta_P = 2V_0\\sum\\alpha_i(V_i - V_0)/\\sum\\alpha_i(V_i^2 - V_0^2)$ (core $\\alpha = 1$). As a percentage.`, `$V_0 = ${V0}$ m/s、$\\alpha_2 = ${a2}$、$\\alpha_3 = ${a3}$、噴流 $V_9 = ${V9}$、$V_{19} = ${V19}$、$V_{39} = ${V39}$ m/s のとき、推進効率 $\\eta_P = 2V_0\\sum\\alpha_i(V_i - V_0)/\\sum\\alpha_i(V_i^2 - V_0^2)$（コアは $\\alpha = 1$）を百分率で求めてください。`],
          a: { type: 'num', v: 100 * e, rel: 0.005, unit: ['%', '%'] },
          hint: ['Thrust power over the kinetic power added, both per kg of core air.', 'どちらもコア空気 1 kg あたりで、推力の仕事率を加えた運動エネルギーの仕事率で割ります。'],
          sol: [[`Numerator: $2 \\times ${V0} \\times ${n(F, 5)} = ${n(2 * V0 * F, 6)}$.`, `分子は $2 \\times ${V0} \\times ${n(F, 5)} = ${n(2 * V0 * F, 6)}$ です。`], [`Denominator: $${n(KE, 6)}$ m²/s².`, `分母は $${n(KE, 6)}$ m²/s² です。`], [`$\\eta_P = ${n(100 * e, 3)}\\%$. A bigger, slower third stream raises it.`, `$\\eta_P = ${n(100 * e, 3)}\\%$ です。大きく遅い第三流路はこれを上げます。`]],
        };
      }
      const M0 = r.pick([0.6, 0.8, 0.9, 1.2, 1.5]), tr = 1 + 0.2 * M0 * M0, v = A11 * Math.sqrt(5 * (tr * PF3 ** EX - 1));
      return {
        q: [`With no heat added, how fast does the third stream ($\\pi_{f3} = 2.2$) leave at Mach $${M0}$ and 11 km ($a_0 = 295.1$ m/s)? $V_{39}/a_0 = \\sqrt{5(\\tau_r\\tau_{f3} - 1)}$. In m/s.`, `熱を加えないとき、第三流路（$\\pi_{f3} = 2.2$）は、高度 11 km（$a_0 = 295.1$ m/s）、マッハ $${M0}$ でどれだけの速さで出ますか。$V_{39}/a_0 = \\sqrt{5(\\tau_r\\tau_{f3} - 1)}$ です。m/s で答えてください。`],
        a: { type: 'num', v, rel: 0.005, unit: ['m/s', 'm/s'] },
        hint: ['$\\tau_{f3} = 2.2^{2/7}$.', '$\\tau_{f3} = 2.2^{2/7}$ です。'],
        sol: [[`$\\tau_r = ${n(tr, 4)}$, $\\tau_{f3} = ${n(PF3 ** EX, 4)}$.`, `$\\tau_r = ${n(tr, 4)}$、$\\tau_{f3} = ${n(PF3 ** EX, 4)}$ です。`], [`$V_{39} = 295.1\\sqrt{5 \\times ${n(tr * PF3 ** EX - 1, 4)}} = ${n(v, 4)}$ m/s, only $${n(v / (M0 * A11), 3)}$ times the flight speed: a gentle, efficient jet.`, `$V_{39} = 295.1\\sqrt{5 \\times ${n(tr * PF3 ** EX - 1, 4)}} = ${n(v, 4)}$ m/s で、飛行速度のわずか $${n(v / (M0 * A11), 3)}$ 倍です。おだやかで効率のよい噴流です。`]],
        set: { M0, alt: 11, Q: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Qk = r.pick([200, 300, 400, 600, 800, 1000]), dT = r.pick([20, 25, 30, 40, 50]), m3 = Qk * 1000 / (CP * dT), a3 = (1 + A2) * m3 / (M0T - m3), mode = (a3 - 0.1) / 1.1;
        if (!(mode > 0 && mode <= 1)) {
          return {
            q: [`A heat load of $${Qk}$ kW must warm the third stream by no more than $${dT}$ K. What mass flow must the third stream carry? In kg/s.`, `$${Qk}$ kW の熱負荷で第三流路の温度上昇を $${dT}$ K 以下にしなければなりません。第三流路はどれだけの質量流量を運ぶ必要がありますか。kg/s で答えてください。`],
            a: { type: 'num', v: m3, rel: 0.005, unit: ['kg/s', 'kg/s'] },
            hint: ['Invert $Q = \\dot m_3 c_p\\Delta T$.', '$Q = \\dot m_3 c_p\\Delta T$ を逆に解きます。'],
            sol: [[`$\\dot m_3 = Q/(c_p\\Delta T) = ${Qk * 1000}/(1004.5 \\times ${dT})$.`, `$\\dot m_3 = Q/(c_p\\Delta T) = ${Qk * 1000}/(1004.5 \\times ${dT})$ です。`], [`$= ${n(m3, 4)}$ kg/s${mode <= 0 ? ', which even combat mode supplies' : ', more than this engine can send round the third stream'}.`, `$= ${n(m3, 4)}$ kg/s です。${mode <= 0 ? '戦闘モードでも足ります。' : 'この機関が第三流路に回せる量を超えています。'}`]],
            set: { Q: Qk, dT },
          };
        }
        const mset = Math.min(1, Math.ceil(mode * 100) / 100);
        return {
          q: [`In this engine $\\dot m_0 = 100$ kg/s, $\\alpha_2 = 0.35$ and the mode $m$ sets $\\alpha_3 = 0.1 + 1.1m$. A heat load of $${Qk}$ kW must warm the third stream by no more than $${dT}$ K. What is the lowest mode that allows it? Three decimals.`, `この機関では $\\dot m_0 = 100$ kg/s、$\\alpha_2 = 0.35$ で、モード $m$ が $\\alpha_3 = 0.1 + 1.1m$ を決めます。$${Qk}$ kW の熱負荷で第三流路の温度上昇を $${dT}$ K 以下にしなければなりません。それを許す最も低いモードはいくらですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: mode, tol: 0.0015 },
          hint: ['Find the third-stream flow needed, then the $\\alpha_3$ that gives it from 100 kg/s.', '必要な第三流路の流量を求め、次に 100 kg/s からそれを与える $\\alpha_3$ を求めます。'],
          sol: [[`$\\dot m_3 = ${Qk * 1000}/(1004.5 \\times ${dT}) = ${n(m3, 4)}$ kg/s.`, `$\\dot m_3 = ${Qk * 1000}/(1004.5 \\times ${dT}) = ${n(m3, 4)}$ kg/s です。`], [`$\\dot m_3 = 100\\,\\alpha_3/(1.35 + \\alpha_3)$ gives $\\alpha_3 = 1.35\\,\\dot m_3/(100 - \\dot m_3) = ${n(a3, 4)}$.`, `$\\dot m_3 = 100\\,\\alpha_3/(1.35 + \\alpha_3)$ から $\\alpha_3 = 1.35\\,\\dot m_3/(100 - \\dot m_3) = ${n(a3, 4)}$ です。`], [`$m = (\\alpha_3 - 0.1)/1.1 = ${n(mode, 4)}$. Below it the engine has more thrust but cannot carry this heat away.`, `$m = (\\alpha_3 - 0.1)/1.1 = ${n(mode, 4)}$ です。これより下では推力は大きくなりますが、この熱を運び去れません。`]],
          set: { mode: mset, Q: Qk, dT },
        };
      }
      if (form === 1) {
        const a2 = r.pick([0.3, 0.35, 0.4, 0.5]), m0 = r.pick([80, 100, 120]);
        return {
          q: [`The inlet takes $${m0}$ kg/s and the inner bypass ratio is $${a2}$. Write the third-stream mass flow $\\dot m_3$ as a function of the third-stream ratio $x = \\alpha_3$.`, `インテークは $${m0}$ kg/s を取り入れ、内側のバイパス比は $${a2}$ です。第三流路の質量流量 $\\dot m_3$ を、第三流路の比 $x = \\alpha_3$ の関数として書いてください。`],
          a: { type: 'expr', v: `${m0}*x/(${1 + a2}+x)`, vars: ['x'], dom: { x: [0.05, 2] }, lhs: ['$\\dot m_3(x) =$', '$\\dot m_3(x) =$'] },
          hint: ['The core flow is $\\dot m_0/(1 + \\alpha_2 + \\alpha_3)$; the third stream is $\\alpha_3$ times that.', 'コア流量は $\\dot m_0/(1 + \\alpha_2 + \\alpha_3)$ で、第三流路はその $\\alpha_3$ 倍です。'],
          sol: [[`$\\dot m_c = ${m0}/(${n(1 + a2, 3)} + x)$.`, `$\\dot m_c = ${m0}/(${n(1 + a2, 3)} + x)$ です。`], [`$\\dot m_3 = x\\,\\dot m_c = ${m0}x/(${n(1 + a2, 3)} + x)$. It grows ever more slowly with $x$ and can never exceed $${m0}$ kg/s: opening the third stream takes air from the core.`, `$\\dot m_3 = x\\,\\dot m_c = ${m0}x/(${n(1 + a2, 3)} + x)$ です。$x$ とともにだんだんゆっくり増え、決して $${m0}$ kg/s を超えません。第三流路を開くと、空気はコアから取られます。`]],
        };
      }
      const M0 = r.pick([0.8, 0.9, 1.2]), dT = r.pick([10, 20, 30, 50]), tr = 1 + 0.2 * M0 * M0, tf = PF3 ** EX, Tt = T11 * tr * tf, v0 = Math.sqrt(2 * CP * Tt * (1 - 1 / (tr * tf))), v1 = Math.sqrt(2 * CP * (Tt + dT) * (1 - 1 / (tr * tf)));
      return {
        q: [`At Mach $${M0}$ and 11 km ($T_0 = 216.65$ K) the third stream ($\\pi_{f3} = 2.2$) is heated by $${dT}$ K at constant total pressure before its nozzle. Its jet is $V_{39} = \\sqrt{2c_p T_t(1 - 1/(\\tau_r\\tau_{f3}))}$. By how many m/s does the heat speed the jet up?`, `マッハ $${M0}$、高度 11 km（$T_0 = 216.65$ K）で、第三流路（$\\pi_{f3} = 2.2$）がノズルの前で全圧一定のまま $${dT}$ K 加熱されます。噴流は $V_{39} = \\sqrt{2c_p T_t(1 - 1/(\\tau_r\\tau_{f3}))}$ です。熱によって噴流は何 m/s 速くなりますか。`],
        a: { type: 'num', v: v1 - v0, rel: 0.01, unit: ['m/s', 'm/s'] },
        hint: ['The total temperature before the heat is $T_0\\tau_r\\tau_{f3}$; the pressure ratio, and so the bracket, does not change.', '加熱前の全温は $T_0\\tau_r\\tau_{f3}$ です。圧力比、したがってかっこの中は変わりません。'],
        sol: [[`$T_t = 216.65 \\times ${n(tr, 4)} \\times ${n(tf, 4)} = ${n(Tt, 4)}$ K, so $V_{39} = ${n(v0, 5)}$ m/s unheated.`, `$T_t = 216.65 \\times ${n(tr, 4)} \\times ${n(tf, 4)} = ${n(Tt, 4)}$ K なので、加熱しないと $V_{39} = ${n(v0, 5)}$ m/s です。`], [`Heated to $${n(Tt + dT, 4)}$ K: $V_{39} = ${n(v1, 5)}$ m/s.`, `$${n(Tt + dT, 4)}$ K まで加熱すると $V_{39} = ${n(v1, 5)}$ m/s です。`], [`The gain is $${n(v1 - v0, 3)}$ m/s: rejected heat is not wholly lost, a little of it comes back as thrust.`, `増分は $${n(v1 - v0, 3)}$ m/s です。捨てた熱はすべて失われるわけではなく、少しは推力として戻ってきます。`]],
        set: { M0, alt: 11 },
      };
    },
  ];

  /* ---------------- mission-range ---------------- */
  Q['mission-range'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([20000, 25000, 30000, 35000]), LD = r.pick([7, 8, 9, 10, 12]), nE = r.pick([1, 2]), F = m * G0 / (LD * nE) / 1000;
        return {
          q: [`A $${m / 1000}$-tonne aircraft with $L/D = ${LD}$ cruises on ${nE === 1 ? 'one engine' : 'two engines'}. In steady level flight thrust equals drag $= W/(L/D)$. What thrust must each engine give, in kN? $g = 9.807$ m/s².`, `$${m / 1000}$ トンの機体が $L/D = ${LD}$ で、${nE === 1 ? '単発' : '双発'}で巡航します。定常水平飛行では推力は抗力 $= W/(L/D)$ に等しくなります。各機関は何 kN を出す必要がありますか。$g = 9.807$ m/s² です。`],
          a: { type: 'num', v: F, rel: 0.005, unit: ['kN', 'kN'] },
          hint: ['Weight is $mg$; share the drag between the engines.', '重さは $mg$ です。抗力を機関で分け合います。'],
          sol: [[`$W = ${m} \\times 9.807 = ${n(m * G0 / 1000, 5)}$ kN, so the drag is $${n(m * G0 / LD / 1000, 4)}$ kN.`, `$W = ${m} \\times 9.807 = ${n(m * G0 / 1000, 5)}$ kN なので、抗力は $${n(m * G0 / LD / 1000, 4)}$ kN です。`], [`Each engine: $${n(F, 4)}$ kN, far below the maximum thrust a fighter engine needs for combat.`, `各機関は $${n(F, 4)}$ kN で、戦闘機の機関が戦闘で必要とする最大推力よりずっと小さな値です。`]],
          set: nE === 2 && m === 30000 ? { ld: LD } : undefined,
        };
      }
      if (form === 1) {
        const k = r.pick([0.95, 0.9, 0.85, 0.8, 0.75]);
        return {
          q: [`For the same fuel, Breguet's range is proportional to $1/S$. If an engine's TSFC is multiplied by $${k}$, by what percentage does the range grow?`, `同じ燃料なら、ブレゲーの航続距離は $1/S$ に比例します。機関の TSFC が $${k}$ 倍になると、航続距離は何パーセント延びますか。`],
          a: { type: 'num', v: 100 * (1 / k - 1), rel: 0.005, unit: ['%', '%'] },
          hint: ['The range is multiplied by $1/k$.', '航続距離は $1/k$ 倍になります。'],
          sol: [[`$1/${k} = ${n(1 / k, 5)}$.`, `$1/${k} = ${n(1 / k, 5)}$ です。`], [`The range grows by $${n(100 * (1 / k - 1), 3)}\\%$, a little more than the $${n(100 * (1 - k), 3)}\\%$ cut in TSFC.`, `航続距離は $${n(100 * (1 / k - 1), 3)}\\%$ 延び、TSFC の $${n(100 * (1 - k), 3)}\\%$ の削減より少し大きくなります。`]],
        };
      }
      const F = r.pick([40, 50, 60]), S = r.pick([23, 25, 27]), t = r.pick([2, 3, 4, 5, 6]), mf = 2 * F * 1000 * S * 1e-6 * t * 60;
      return {
        q: [`Two engines each give $${F}$ kN in a dash lasting $${t}$ minutes at a TSFC of $${S}$ mg/(N·s). How much fuel does the dash burn, in kg?`, `二基の機関がそれぞれ $${F}$ kN を出し、TSFC $${S}$ mg/(N·s) で $${t}$ 分間ダッシュします。ダッシュで燃える燃料は何 kg ですか。`],
        a: { type: 'num', v: mf, rel: 0.005, unit: ['kg', 'kg'] },
        hint: ['Fuel flow is thrust times TSFC; 1 mg = $10^{-6}$ kg.', '燃料流量は推力と TSFC の積です。1 mg = $10^{-6}$ kg です。'],
        sol: [[`Fuel flow: $2 \\times ${F * 1000} \\times ${S} \\times 10^{-6} = ${n(mf / (t * 60), 4)}$ kg/s.`, `燃料流量は $2 \\times ${F * 1000} \\times ${S} \\times 10^{-6} = ${n(mf / (t * 60), 4)}$ kg/s です。`], [`Over $${t * 60}$ s: $${n(mf, 4)}$ kg. A dash at full thrust burns fuel several times faster than cruise.`, `$${t * 60}$ 秒で $${n(mf, 4)}$ kg です。全推力のダッシュは、巡航の何倍もの速さで燃料を燃やします。`]],
        set: { Freq: F, tdash: t },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const V = 265.5, S = r.pick([20, 22, 24, 26]) * 1e-6, LD = r.pick([8, 9, 10, 12]);
      if (form === 0) {
        const ratio = r.pick([1.1, 1.2, 1.3, 1.4]), R = V / (G0 * S) * LD * Math.log(ratio) / 1000;
        return {
          q: [`An aircraft cruises at $V = 265.5$ m/s with $L/D = ${LD}$ and TSFC $${n(S * 1e6, 3)}$ mg/(N·s). How far does it fly while its mass falls by a factor $W_0/W_1 = ${ratio}$? In km, $g = 9.807$ m/s².`, `機体が $V = 265.5$ m/s、$L/D = ${LD}$、TSFC $${n(S * 1e6, 3)}$ mg/(N·s) で巡航します。質量が $W_0/W_1 = ${ratio}$ 倍だけ減る間に何 km 飛びますか。$g = 9.807$ m/s² です。`],
          a: { type: 'num', v: R, rel: 0.005, unit: ['km', 'km'] },
          hint: ['$R = \\dfrac{V}{gS}\\dfrac{L}{D}\\ln\\dfrac{W_0}{W_1}$, with $S$ in kg/(N·s).', '$R = \\dfrac{V}{gS}\\dfrac{L}{D}\\ln\\dfrac{W_0}{W_1}$ で、$S$ は kg/(N·s) です。'],
          sol: [[`$V/(gS) = 265.5/(9.807 \\times ${sig(S, 3)}) = ${n(V / (G0 * S) / 1000, 5)}$ km.`, `$V/(gS) = 265.5/(9.807 \\times ${sig(S, 3)}) = ${n(V / (G0 * S) / 1000, 5)}$ km です。`], [`$R = ${n(V / (G0 * S) / 1000, 5)} \\times ${LD} \\times \\ln ${ratio} = ${n(R, 4)}$ km.`, `$R = ${n(V / (G0 * S) / 1000, 5)} \\times ${LD} \\times \\ln ${ratio} = ${n(R, 4)}$ km です。`]],
          set: { ld: LD },
        };
      }
      if (form === 1) {
        const d = r.pick([500, 800, 1000, 1500]), m0 = 30000, m1 = m0 * Math.exp(-d * 1000 * G0 * S / (V * LD));
        return {
          q: [`A $30\\,000$ kg aircraft cruises $${d}$ km at $265.5$ m/s with $L/D = ${LD}$ and TSFC $${n(S * 1e6, 3)}$ mg/(N·s). How much fuel does it burn? In kg.`, `$30\\,000$ kg の機体が $265.5$ m/s、$L/D = ${LD}$、TSFC $${n(S * 1e6, 3)}$ mg/(N·s) で $${d}$ km 巡航します。燃料を何 kg 燃やしますか。`],
          a: { type: 'num', v: m0 - m1, rel: 0.006, unit: ['kg', 'kg'] },
          hint: ['$m = m_0\\,e^{-gSx/(V\\,L/D)}$.', '$m = m_0\\,e^{-gSx/(V\\,L/D)}$ です。'],
          sol: [[`Exponent: $9.807 \\times ${sig(S, 3)} \\times ${d * 1000}/(265.5 \\times ${LD}) = ${n(d * 1000 * G0 * S / (V * LD), 5)}$.`, `指数は $9.807 \\times ${sig(S, 3)} \\times ${d * 1000}/(265.5 \\times ${LD}) = ${n(d * 1000 * G0 * S / (V * LD), 5)}$ です。`], [`$m = 30\\,000\\,e^{-${n(d * 1000 * G0 * S / (V * LD), 5)}} = ${n(m1, 6)}$ kg, so $${n(m0 - m1, 5)}$ kg of fuel is burned.`, `$m = 30\\,000\\,e^{-${n(d * 1000 * G0 * S / (V * LD), 5)}} = ${n(m1, 6)}$ kg なので、燃料は $${n(m0 - m1, 5)}$ kg 燃えます。`]],
          set: { ld: LD },
        };
      }
      const R = r.pick([1500, 2000, 3000, 4000]), ff = 1 - Math.exp(-R * 1000 * G0 * S / (V * LD));
      return {
        q: [`What fraction of its take-off mass must an aircraft burn to cruise $${R}$ km at $265.5$ m/s with $L/D = ${LD}$ and TSFC $${n(S * 1e6, 3)}$ mg/(N·s)? As a percentage.`, `$265.5$ m/s、$L/D = ${LD}$、TSFC $${n(S * 1e6, 3)}$ mg/(N·s) で $${R}$ km 巡航するには、離陸質量の何パーセントを燃やす必要がありますか。`],
        a: { type: 'num', v: 100 * ff, rel: 0.005, unit: ['%', '%'] },
        hint: ['Invert Breguet: $W_1/W_0 = e^{-gSR/(V\\,L/D)}$.', 'ブレゲーの式を逆に解きます：$W_1/W_0 = e^{-gSR/(V\\,L/D)}$ です。'],
        sol: [[`$gSR/(V\\,L/D) = ${n(R * 1000 * G0 * S / (V * LD), 5)}$.`, `$gSR/(V\\,L/D) = ${n(R * 1000 * G0 * S / (V * LD), 5)}$ です。`], [`$1 - e^{-${n(R * 1000 * G0 * S / (V * LD), 5)}} = ${n(100 * ff, 4)}\\%$ of the take-off mass.`, `離陸質量の $1 - e^{-${n(R * 1000 * G0 * S / (V * LD), 5)}} = ${n(100 * ff, 4)}\\%$ です。`]],
        set: { ld: LD },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const S = r.pick([20, 22, 24, 25]), LD = r.pick([8, 9, 10]), c = 265.5 / (G0 * S * 1e-6) * LD / 1000;
        return {
          q: [`At $265.5$ m/s, $L/D = ${LD}$ and TSFC $${S}$ mg/(N·s), write the cruise range in km as a function of the mass ratio $x = W_0/W_1$.`, `$265.5$ m/s、$L/D = ${LD}$、TSFC $${S}$ mg/(N·s) のとき、巡航距離（km）を質量比 $x = W_0/W_1$ の関数として書いてください。`],
          a: { type: 'expr', v: `${c.toFixed(4)}*ln(x)`, vars: ['x'], dom: { x: [1.05, 2] }, lhs: ['$R(x) =$', '$R(x) =$'] },
          hint: ['Collect the constants in front of $\\ln x$.', '$\\ln x$ の前の定数をまとめます。'],
          sol: [[`$\\dfrac{V}{gS}\\dfrac{L}{D} = \\dfrac{265.5 \\times ${LD}}{9.807 \\times ${S} \\times 10^{-6}} = ${n(c, 5)}$ km.`, `$\\dfrac{V}{gS}\\dfrac{L}{D} = \\dfrac{265.5 \\times ${LD}}{9.807 \\times ${S} \\times 10^{-6}} = ${n(c, 5)}$ km です。`], [`$R = ${n(c, 5)}\\ln x$ km. The logarithm is why extra fuel buys less and less range: it must also carry itself.`, `$R = ${n(c, 5)}\\ln x$ km です。対数になるのは、燃料が自分自身も運ばなければならず、追加の燃料で得られる航続距離がだんだん小さくなるからです。`]],
          set: { ld: LD },
        };
      }
      if (form === 1) {
        const g = r.pick([10, 15, 20, 25, 30, 33]), cut = 1 - 1 / (1 + g / 100);
        return {
          q: [`By Breguet, for the same fuel, how much lower must the TSFC be to give $${g}\\%$ more range? As a percentage.`, `ブレゲーの式によると、同じ燃料で航続距離を $${g}\\%$ 延ばすには、TSFC を何パーセント下げる必要がありますか。`],
          a: { type: 'num', v: 100 * cut, rel: 0.005, unit: ['%', '%'] },
          hint: ['Range is proportional to $1/S$, so $S$ must be divided by $1 + g$.', '航続距離は $1/S$ に比例するので、$S$ を $1 + g$ で割る必要があります。'],
          sol: [[`$S_{\\text{new}}/S = 1/${n(1 + g / 100, 3)} = ${n(1 / (1 + g / 100), 5)}$.`, `$S_{\\text{new}}/S = 1/${n(1 + g / 100, 3)} = ${n(1 / (1 + g / 100), 5)}$ です。`], [`A cut of $${n(100 * cut, 3)}\\%$, less than $${g}\\%$: this is how about 25% better fuel efficiency and about 30% more range go together.`, `$${n(100 * cut, 3)}\\%$ の削減で、$${g}\\%$ より小さくなります。燃料効率約 25% 向上と航続距離約 30% 増は、こうして結びつきます。`]],
        };
      }
      const Fs = r.pick([390, 450, 520, 617]), Freq = r.pick([40, 45, 50, 55, 60]), m0 = r.pick([80, 100, 120]), Fa = Fs * m0 / 1000, ok = Fa >= Freq;
      return {
        q: [`At Mach 1.5 an engine cycle gives $${Fs}$ N of thrust per kg/s of air, and the engine swallows $${m0}$ kg/s. The dash needs $${Freq}$ kN per engine. Can it fly the dash?`, `マッハ 1.5 で、ある機関のサイクルは空気 1 kg/s あたり $${Fs}$ N の推力を出し、機関は $${m0}$ kg/s を吸い込みます。ダッシュには 1 基あたり $${Freq}$ kN が必要です。この機関はダッシュを飛べますか。`],
        a: { type: 'choice', fixed: true, opts: [['Yes: the available thrust is at least the requirement', 'はい：出せる推力が要求以上です'], ['No: the specific thrust is too low for this airflow', 'いいえ：この空気流量では比推力が小さすぎます'], ['Only if the TSFC is low enough', 'TSFC が十分に低いときだけです']], v: ok ? 0 : 1 },
        hint: ['Available thrust is airflow times specific thrust; fuel economy does not enter.', '出せる推力は空気流量と比推力の積で、燃費は関係しません。'],
        sol: [[`Available: $${m0} \\times ${Fs} = ${n(Fa, 4)}$ kN against $${Freq}$ kN required.`, `出せる推力は $${m0} \\times ${Fs} = ${n(Fa, 4)}$ kN、要求は $${Freq}$ kN です。`], [ok ? ['It can. Thrust is set by airflow and specific thrust, not by TSFC.', '飛べます。推力を決めるのは空気流量と比推力で、TSFC ではありません。'][0] : `It cannot: it would need $${n(Freq * 1000 / Fs, 4)}$ kg/s, a bigger engine, or a higher specific thrust, which is what low-bypass mode gives.`, ok ? '飛べます。推力を決めるのは空気流量と比推力で、TSFC ではありません。' : `飛べません。$${n(Freq * 1000 / Fs, 4)}$ kg/s、つまりもっと大きな機関か、より大きな比推力が必要で、それを与えるのが低バイパスのモードです。`]],
        set: m0 === 100 ? { Freq } : undefined,
      };
    },
  ];
})();
