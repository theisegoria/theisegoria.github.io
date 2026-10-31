'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, DEG = PI / 180;
  // isothermal Schmidt analysis, written out again here (generators do not load the topic module)
  function schmidt(o) {
    const { Vswc, Vswe, Vclc = 0, Vcle = 0, Vk = 0, Vr = 0, Vh = 0, Tk, Th, pmean = 1 } = o, a = o.alpha;
    const Tr = Math.abs(Th - Tk) < 1e-9 ? Tk : (Th - Tk) / Math.log(Th / Tk);
    const s = (Vswc / 2 + Vclc + Vk) / Tk + Vr / Tr + (Vswe / 2 + Vcle + Vh) / Th;
    const cx = Vswc / (2 * Tk) + (Vswe * Math.cos(a)) / (2 * Th), sy = (Vswe * Math.sin(a)) / (2 * Th);
    const b = Math.hypot(cx, sy) / s, beta = Math.atan2(sy, cx), rb = Math.sqrt(1 - b * b), MR = pmean * s * rb;
    const k = (PI * MR * (rb - 1)) / (s * b * rb), Wc = Vswc * k * Math.sin(beta), We = Vswe * k * Math.sin(beta - a);
    return { b, beta, Wc, We, W: Wc + We, pmax: MR / (s * (1 - b)), pmin: MR / (s * (1 + b)) };
  }
  // the lab engine: 60 mm bore, 40 mm stroke, helium at 10 bar mean
  const VSW = (PI * 0.06 * 0.06 * 0.04) / 4, ENG = { Vclc: 0.1 * VSW, Vcle: 0.1 * VSW, Vk: 0.15 * VSW, Vr: 0.3 * VSW, Vh: 0.15 * VSW };
  const engine = (aDeg, Th, Tk) => schmidt({ Vswc: VSW, Vswe: VSW, ...ENG, Tk, Th, alpha: aDeg * DEG, pmean: 1e6 });
  const workMap = (aDeg, kap, X, tau, norm) => { const E = schmidt({ Vswc: kap, Vswe: 1, Vk: X / 4, Vr: X / 2, Vh: X / 4, Tk: 1, Th: 1 / tau, alpha: aDeg * DEG, pmean: 1 }); return E.W / ((norm ? E.pmax : 1) * (1 + kap)); };
  const GAS = [{ R: 2077, g: 5 / 3, en: 'helium', ja: 'ヘリウム' }, { R: 4124, g: 1.405, en: 'hydrogen', ja: '水素' }, { R: 287, g: 1.4, en: 'air', ja: '空気' }];
  const eta = (e, Th, Tc, r, g) => ((Th - Tc) * Math.log(r)) / (Th * Math.log(r) + ((1 - e) * (Th - Tc)) / (g - 1));

  /* ---------------- stirling-alpha-engine ---------------- */
  Q['stirling-alpha-engine'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Th = r.step(500, 1200, 50), Tc = r.step(280, 350, 10), c = 1 - Tc / Th;
        return {
          q: [`A Schmidt engine (isothermal spaces) runs between a heater at $T_h = ${Th}$ K and a cooler at $T_c = ${Tc}$ K. What is its efficiency $W/Q_e$? As a percentage.`, `シュミットのエンジン（各空間が等温）が、加熱器 $T_h = ${Th}$ K と冷却器 $T_c = ${Tc}$ K の間で動いています。効率 $W/Q_e$ はいくらですか。百分率で答えてください。`],
          a: { type: 'num', v: 100 * c, rel: 0.004, unit: ['%', '%'] },
          hint: ['With isothermal spaces and a perfect regenerator the Schmidt engine is a Carnot engine.', '等温の空間と完全な再生器をもつシュミットのエンジンはカルノー機関です。'],
          sol: [[`$W/Q_e = 1 - T_c/T_h = 1 - ${Tc}/${Th}$.`, `$W/Q_e = 1 - T_c/T_h = 1 - ${Tc}/${Th}$ です。`], [`That is $${n(100 * c, 4)}\\%$, the most any engine between these temperatures can do; real Stirling engines reach perhaps half to two thirds of it.`, `$${n(100 * c, 4)}\\%$ で、この温度の間で動くどのエンジンにとっても上限です。実際のスターリングエンジンはその半分から三分の二ほどです。`]],
          set: { Th, Tc },
        };
      }
      if (form === 1) {
        const D = r.pick([40, 50, 60, 70, 80, 100]), S = r.pick([25, 30, 40, 50, 60]), V = (PI * D * D * S) / 4 / 1000;
        return {
          q: [`A cylinder has a bore of $${D}$ mm and a stroke of $${S}$ mm. What volume does its piston sweep? In cm³.`, `内径 $${D}$ mm、行程 $${S}$ mm のシリンダがあります。ピストンの行程容積はいくらですか。cm³ で答えてください。`],
          a: { type: 'num', v: V, rel: 0.004, unit: ['cm³', 'cm³'] },
          hint: ['Area of the bore times the stroke.', '内径の面積に行程を掛けます。'],
          sol: [[`$V_{sw} = \\tfrac{\\pi}{4}D^2 S = \\tfrac{\\pi}{4}(${D})^2(${S}) = ${n(V * 1000, 5)}$ mm³.`, `$V_{sw} = \\tfrac{\\pi}{4}D^2 S = \\tfrac{\\pi}{4}(${D})^2(${S}) = ${n(V * 1000, 5)}$ mm³ です。`], [`That is $${n(V, 4)}$ cm³, the amplitude-to-amplitude change in that space's volume each turn.`, `$${n(V, 4)}$ cm³ で、一回転ごとにその空間の体積が変わる幅です。`]],
        };
      }
      const al = r.step(30, 150, 10), th = r.step(0, 330, 30), Vsw = r.pick([100, 113, 120, 150]), Vcl = r.pick([10, 12, 15]), Ve = Vcl + (Vsw / 2) * (1 + Math.cos((th + al) * DEG));
      return {
        q: [`The expansion space has clearance $V_{cle} = ${Vcl}$ cm³ and swept volume $V_{swe} = ${Vsw}$ cm³, and leads the compression space by $\\alpha = ${al}^\\circ$. What is $V_e$ at crank angle $\\theta = ${th}^\\circ$? In cm³.`, `膨張空間のすきま容積は $V_{cle} = ${Vcl}$ cm³、行程容積は $V_{swe} = ${Vsw}$ cm³ で、圧縮空間より $\\alpha = ${al}^\\circ$ 先行しています。クランク角 $\\theta = ${th}^\\circ$ での $V_e$ はいくらですか。cm³ で答えてください。`],
        a: { type: 'num', v: Ve, tol: 0.06, unit: ['cm³', 'cm³'] },
        hint: ['$V_e = V_{cle} + \\tfrac12 V_{swe}(1 + \\cos(\\theta + \\alpha))$.', '$V_e = V_{cle} + \\tfrac12 V_{swe}(1 + \\cos(\\theta + \\alpha))$ です。'],
        sol: [[`$\\theta + \\alpha = ${th + al}^\\circ$ and $\\cos ${th + al}^\\circ = ${n(Math.cos((th + al) * DEG), 4)}$.`, `$\\theta + \\alpha = ${th + al}^\\circ$ で、$\\cos ${th + al}^\\circ = ${n(Math.cos((th + al) * DEG), 4)}$ です。`], [`$V_e = ${Vcl} + ${Vsw / 2}(1 + ${n(Math.cos((th + al) * DEG), 4)}) = ${n(Ve, 4)}$ cm³; the hot space is ${Ve > Vcl + Vsw / 2 ? 'more' : 'less'} than half open.`, `$V_e = ${Vcl} + ${Vsw / 2}(1 + ${n(Math.cos((th + al) * DEG), 4)}) = ${n(Ve, 4)}$ cm³ です。高温側は半分より${Ve > Vcl + Vsw / 2 ? '大きく' : '小さく'}開いています。`]],
        set: { alpha: al, th },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const b = r.pick([0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6]), pm = r.pick([5, 8, 10, 15, 20]), rb = Math.sqrt(1 - b * b), hi = (pm * rb) / (1 - b), lo = (pm * rb) / (1 + b);
        return {
          q: [`In a Schmidt engine $p = p_{\\mathrm{mean}}\\sqrt{1 - b^2}/(1 + b\\cos(\\theta + \\beta))$. With $b = ${b}$ and $p_{\\mathrm{mean}} = ${pm}$ bar, find the maximum and minimum pressures, in bar.`, `シュミットのエンジンでは $p = p_{\\mathrm{mean}}\\sqrt{1 - b^2}/(1 + b\\cos(\\theta + \\beta))$ です。$b = ${b}$、$p_{\\mathrm{mean}} = ${pm}$ bar のとき、最高圧力と最低圧力を bar で求めてください。`],
          a: { type: 'tuple', v: [hi, lo], labels: ['$p_{\\max}$', '$p_{\\min}$'], tol: 0.01 },
          hint: ['The cosine runs from −1 to 1.', '余弦は −1 から 1 まで動きます。'],
          sol: [[`$\\sqrt{1 - b^2} = ${n(rb, 5)}$.`, `$\\sqrt{1 - b^2} = ${n(rb, 5)}$ です。`], [`$p_{\\max} = ${pm}\\times${n(rb, 5)}/(1 - ${b}) = ${n(hi, 4)}$ bar when the cosine is $-1$, and $p_{\\min} = ${pm}\\times${n(rb, 5)}/(1 + ${b}) = ${n(lo, 4)}$ bar when it is $+1$.`, `余弦が $-1$ のとき $p_{\\max} = ${pm}\\times${n(rb, 5)}/(1 - ${b}) = ${n(hi, 4)}$ bar、$+1$ のとき $p_{\\min} = ${pm}\\times${n(rb, 5)}/(1 + ${b}) = ${n(lo, 4)}$ bar です。`], [`Their ratio $(1 + b)/(1 - b) = ${n(hi / lo, 4)}$ is set by $b$ alone.`, `比 $(1 + b)/(1 - b) = ${n(hi / lo, 4)}$ は $b$ だけで決まります。`]],
        };
      }
      if (form === 1) {
        const W = r.pick([20, 30, 40, 53.7, 60, 80, 120]), rpm = r.step(600, 3000, 300), Pw = (W * rpm) / 60;
        return {
          q: [`An engine does $W = ${W}$ J per cycle and turns at $${rpm}$ rpm, one cycle per revolution. What is its indicated power? In watts.`, `一サイクルに $W = ${W}$ J の仕事をするエンジンが $${rpm}$ rpm で回っています。一回転で一サイクルです。図示出力はいくらですか。W で答えてください。`],
          a: { type: 'num', v: Pw, rel: 0.004, unit: ['W', 'W'] },
          hint: ['Power is work per cycle times cycles per second.', '出力は一サイクルの仕事に毎秒のサイクル数を掛けたものです。'],
          sol: [[`$f = ${rpm}/60 = ${n(rpm / 60, 4)}$ cycles per second.`, `$f = ${rpm}/60 = ${n(rpm / 60, 4)}$ サイクル毎秒です。`], [`$P = Wf = ${W}\\times${n(rpm / 60, 4)} = ${n(Pw, 5)}$ W.`, `$P = Wf = ${W}\\times${n(rpm / 60, 4)} = ${n(Pw, 5)}$ W です。`]],
        };
      }
      const Th = r.step(600, 1200, 100), Tc = r.pick([300, 320, 350]), We = r.step(40, 120, 5), c = 1 - Tc / Th, W = We * c, Wc = W - We;
      return {
        q: [`In a Schmidt engine with $T_h = ${Th}$ K and $T_c = ${Tc}$ K, the expansion space does $W_e = ${We}$ J per cycle. Find the net work $W$ and the compression work $W_c$, in joules.`, `$T_h = ${Th}$ K、$T_c = ${Tc}$ K のシュミットのエンジンで、膨張空間が一サイクルに $W_e = ${We}$ J の仕事をします。正味の仕事 $W$ と圧縮の仕事 $W_c$ を J で求めてください。`],
        a: { type: 'tuple', v: [W, Wc], labels: ['$W$', '$W_c$'], tol: 0.05 },
        hint: ['Isothermal spaces make $Q_e = W_e$, and the engine is a Carnot engine.', '等温の空間では $Q_e = W_e$ で、エンジンはカルノー機関です。'],
        sol: [[`$W/W_e = 1 - T_c/T_h = ${n(c, 5)}$, so $W = ${n(W, 5)}$ J.`, `$W/W_e = 1 - T_c/T_h = ${n(c, 5)}$ なので $W = ${n(W, 5)}$ J です。`], [`$W_c = W - W_e = ${n(Wc, 5)}$ J: the compression space takes back $T_c/T_h$ of the expansion work, rejected as heat at the cooler.`, `$W_c = W - W_e = ${n(Wc, 5)}$ J です。圧縮空間は膨張の仕事の $T_c/T_h$ を取り戻し、それを冷却器で熱として捨てます。`]],
        set: { Th, Tc },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['The Schmidt pressure swings between $p_{\\max}$ and $p_{\\min}$. Write the ratio $p_{\\max}/p_{\\min}$ as a function of $b$.', 'シュミットのエンジンの圧力は $p_{\\max}$ と $p_{\\min}$ の間で振れます。比 $p_{\\max}/p_{\\min}$ を $b$ の関数として書いてください。'],
          a: { type: 'expr', v: '(1+b)/(1-b)', vars: ['b'], dom: { b: [0.05, 0.8] }, lhs: ['$p_{\\max}/p_{\\min} =$', '$p_{\\max}/p_{\\min} =$'] },
          hint: ['$p \\propto 1/(1 + b\\cos(\\theta + \\beta))$; take the cosine at its extremes.', '$p \\propto 1/(1 + b\\cos(\\theta + \\beta))$ です。余弦をその両端にとります。'],
          sol: [['The largest pressure has the cosine at $-1$: $p_{\\max} \\propto 1/(1 - b)$; the smallest has it at $+1$: $p_{\\min} \\propto 1/(1 + b)$.', '最高圧力は余弦が $-1$ のときで $p_{\\max} \\propto 1/(1 - b)$、最低圧力は $+1$ のときで $p_{\\min} \\propto 1/(1 + b)$ です。'], ['The ratio is $(1 + b)/(1 - b)$. Dead volume lowers $b$ and so flattens the pressure swing, which is why it costs work.', '比は $(1 + b)/(1 - b)$ です。死容積は $b$ を下げて圧力の振れを平らにするので、仕事を失います。']],
        };
      }
      if (form === 1) {
        const Tc = r.pick([290, 300, 320, 350]), e = r.pick([0.5, 0.55, 0.6, 0.65, 0.7, 0.75]), Th = Tc / (1 - e);
        return {
          q: [`A Schmidt engine with its cooler at $T_c = ${Tc}$ K must reach an efficiency of $${100 * e}\\%$. What heater temperature $T_h$ does it need? In kelvin.`, `冷却器が $T_c = ${Tc}$ K のシュミットのエンジンで、効率 $${100 * e}\\%$ を達成しなければなりません。必要な加熱器の温度 $T_h$ はいくらですか。K で答えてください。`],
          a: { type: 'num', v: Th, tol: 0.5, unit: ['K', 'K'] },
          hint: ['Invert $\\eta = 1 - T_c/T_h$.', '$\\eta = 1 - T_c/T_h$ を逆に解きます。'],
          sol: [[`$T_h = T_c/(1 - \\eta) = ${Tc}/${n(1 - e, 3)}$.`, `$T_h = T_c/(1 - \\eta) = ${Tc}/${n(1 - e, 3)}$ です。`], [`$T_h = ${n(Th, 5)}$ K. Each extra point of efficiency costs more heater temperature than the last, and heater tube alloys set the real ceiling near 1000 K.`, `$T_h = ${n(Th, 5)}$ K です。効率を一点上げるごとに必要な温度の上げ幅は大きくなり、実際には加熱管の合金の耐熱で 1000 K 付近が上限になります。`]],
        };
      }
      const al = r.pick([0, 180]);
      return {
        q: [`The phase angle is set to $\\alpha = ${al}^\\circ$. What net work does the Schmidt engine do per cycle, and why?`, `位相角を $\\alpha = ${al}^\\circ$ にします。シュミットのエンジンが一サイクルにする正味の仕事はどうなりますか。その理由は何ですか。`],
        a: { type: 'choice', opts: [[al === 0 ? 'Zero: the volumes move together, pressure depends on total volume alone, and the loop has no area' : 'Zero: the volumes move in opposition, pressure depends on total volume alone, and the loop has no area', al === 0 ? 'ゼロです。体積が一緒に動き、圧力は全体積だけで決まり、閉曲線の面積がありません' : 'ゼロです。体積が逆向きに動き、圧力は全体積だけで決まり、閉曲線の面積がありません'], ['Maximum: the pistons push together, so the pressure swing is largest', '最大です。ピストンが一緒に押すので圧力の振れが最大になります'], ['Negative: the engine becomes a heat pump', '負です。エンジンはヒートポンプになります'], ['The same as at 90°, since phase only changes timing', '90° のときと同じです。位相はタイミングを変えるだけだからです']], v: 0 },
        hint: ['Ask whether the share of gas on the hot side differs between expansion and compression at the same total volume.', '全体積が同じとき、膨張中と圧縮中で高温側にあるガスの割合が違うかを考えます。'],
        sol: [[`At $\\alpha = ${al}^\\circ$ the hot share of the gas is the same whenever the total volume is the same, going out and coming back.`, `$\\alpha = ${al}^\\circ$ では、全体積が同じなら行きでも帰りでも高温側のガスの割合は同じです。`], ['So pressure is a single-valued function of volume, the $p$–$V$ curve is traced forwards and backwards along one line, and $\\oint p\\,dV = 0$. Negative work needs the opposite sign of $\\alpha$, not $0$ or $180^\\circ$.', 'したがって圧力は体積の一価関数で、$p$–$V$ 曲線は一本の線を往復するだけなので $\\oint p\\,dV = 0$ です。負の仕事になるのは $\\alpha$ の符号が逆のときで、$0$ や $180^\\circ$ ではありません。']],
        set: { alpha: al },
      };
    },
  ];

  /* ---------------- stirling-schmidt-map ---------------- */
  Q['stirling-schmidt-map'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Th = r.step(450, 1200, 50), tau = 300 / Th;
        return {
          q: [`The cooler is at 300 K and the heater at $T_h = ${Th}$ K. What is the temperature ratio $\\tau = T_k/T_h$? Four decimals.`, `冷却器は 300 K、加熱器は $T_h = ${Th}$ K です。温度比 $\\tau = T_k/T_h$ はいくらですか。小数第四位まで答えてください。`],
          a: { type: 'num', v: tau, tol: 0.00006 },
          hint: ['Cold over hot, both in kelvin.', '低温を高温で割ります。どちらも K です。'],
          sol: [[`$\\tau = 300/${Th} = ${n(tau, 5)}$; the Carnot limit is $1 - \\tau = ${n(1 - tau, 4)}$.`, `$\\tau = 300/${Th} = ${n(tau, 5)}$ で、カルノー効率は $1 - \\tau = ${n(1 - tau, 4)}$ です。`]],
          set: { Th },
        };
      }
      if (form === 1) {
        const Vk = r.pick([10, 15, 20, 30]), Vr = r.pick([20, 30, 40, 60]), Vh = r.pick([10, 15, 20, 30]), Vs = r.pick([80, 100, 113, 120, 150]), X = (Vk + Vr + Vh) / Vs;
        return {
          q: [`A cooler of $${Vk}$ cm³, a regenerator of $${Vr}$ cm³ and a heater of $${Vh}$ cm³ serve an expansion cylinder sweeping $${Vs}$ cm³. What is the dead-volume ratio $X = (V_k + V_r + V_h)/V_{swe}$? Three decimals.`, `冷却器 $${Vk}$ cm³、再生器 $${Vr}$ cm³、加熱器 $${Vh}$ cm³ が、行程容積 $${Vs}$ cm³ の膨張シリンダにつながっています。死容積比 $X = (V_k + V_r + V_h)/V_{swe}$ はいくらですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: X, tol: 0.0006 },
          hint: ['Add the three heat-exchanger volumes first.', 'まず三つの熱交換器の容積を足します。'],
          sol: [[`$V_k + V_r + V_h = ${Vk + Vr + Vh}$ cm³.`, `$V_k + V_r + V_h = ${Vk + Vr + Vh}$ cm³ です。`], [`$X = ${Vk + Vr + Vh}/${Vs} = ${n(X, 4)}$: gas that never changes volume, which damps the pressure swing.`, `$X = ${Vk + Vr + Vh}/${Vs} = ${n(X, 4)}$ です。体積が変わらないガスで、圧力の振れを弱めます。`]],
        };
      }
      const Ve = r.pick([100, 150, 200, 250]), kap = r.pick([0.5, 0.75, 1, 1.25, 1.5, 2]), VT = Ve * (1 + kap);
      return {
        q: [`The expansion cylinder sweeps $${Ve}$ cm³ and the volume ratio is $\\kappa = V_{swc}/V_{swe} = ${kap}$. What is the total swept volume $V_T$? In cm³.`, `膨張シリンダの行程容積は $${Ve}$ cm³、体積比は $\\kappa = V_{swc}/V_{swe} = ${kap}$ です。全行程容積 $V_T$ はいくらですか。cm³ で答えてください。`],
        a: { type: 'num', v: VT, tol: 0.05, unit: ['cm³', 'cm³'] },
        hint: ['$V_{swc} = \\kappa V_{swe}$.', '$V_{swc} = \\kappa V_{swe}$ です。'],
        sol: [[`$V_{swc} = ${kap}\\times${Ve} = ${n(kap * Ve, 4)}$ cm³.`, `$V_{swc} = ${kap}\\times${Ve} = ${n(kap * Ve, 4)}$ cm³ です。`], [`$V_T = V_{swe}(1 + \\kappa) = ${n(VT, 5)}$ cm³, the volume the map divides the work by.`, `$V_T = V_{swe}(1 + \\kappa) = ${n(VT, 5)}$ cm³ で、地図はこの体積で仕事を割っています。`]],
        set: { kap },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const al = r.step(60, 120, 10), kap = r.pick([0.5, 0.75, 1, 1.5, 2]), X = r.pick([0, 0.25, 0.5, 1]), Th = r.pick([600, 900, 1200]), F = workMap(al, kap, X, 300 / Th, 0);
        const pm = r.pick([5, 10, 15, 20]), Ve = r.pick([100, 113, 150]), VT = Ve * (1 + kap) * 1e-6, W = F * pm * 1e5 * VT;
        return {
          q: [`The map gives $W/(p_{\\mathrm{mean}}V_T) = ${n(F, 4)}$ at $\\alpha = ${al}^\\circ$, $\\kappa = ${kap}$, $X = ${X}$, $T_h = ${Th}$ K. With $V_{swe} = ${Ve}$ cm³ and $p_{\\mathrm{mean}} = ${pm}$ bar, how much work does the engine do per cycle? In joules.`, `地図によると、$\\alpha = ${al}^\\circ$、$\\kappa = ${kap}$、$X = ${X}$、$T_h = ${Th}$ K で $W/(p_{\\mathrm{mean}}V_T) = ${n(F, 4)}$ です。$V_{swe} = ${Ve}$ cm³、$p_{\\mathrm{mean}} = ${pm}$ bar のとき、一サイクルの仕事はいくらですか。J で答えてください。`],
          a: { type: 'num', v: W, rel: 0.006, unit: ['J', 'J'] },
          hint: ['Undo the normalisation: multiply by the mean pressure in pascals and $V_T$ in cubic metres.', '正規化を戻します。Pa で表した平均圧力と m³ で表した $V_T$ を掛けます。'],
          sol: [[`$V_T = ${Ve}(1 + ${kap}) = ${n(Ve * (1 + kap), 5)}$ cm³ $= ${n(VT, 4)}$ m³, and $p_{\\mathrm{mean}} = ${pm}\\times10^5$ Pa.`, `$V_T = ${Ve}(1 + ${kap}) = ${n(Ve * (1 + kap), 5)}$ cm³ $= ${n(VT, 4)}$ m³、$p_{\\mathrm{mean}} = ${pm}\\times10^5$ Pa です。`], [`$W = ${n(F, 4)}\\times${pm}\\times10^5\\times${n(VT, 4)} = ${n(W, 4)}$ J per cycle.`, `$W = ${n(F, 4)}\\times${pm}\\times10^5\\times${n(VT, 4)} = ${n(W, 4)}$ J です。`]],
          set: { alpha: al, kap, X, Th, norm: 0 },
        };
      }
      const W = r.pick([30, 50, 80, 100, 150]), rpm = r.step(600, 3000, 150), Pt = r.pick([1, 1.5, 2, 3]), need = (Pt * 1000 * 60) / W;
      return {
        q: [`An engine does $${W}$ J per cycle. At what speed must it turn to deliver $${Pt}$ kW? In rpm.`, `一サイクルに $${W}$ J の仕事をするエンジンがあります。$${Pt}$ kW を出すには何 rpm で回せばよいですか。`],
        a: { type: 'num', v: need, rel: 0.004, unit: ['rpm', 'rpm'] },
        hint: ['$P = Wf$ and $f = N/60$.', '$P = Wf$、$f = N/60$ です。'],
        sol: [[`$f = P/W = ${Pt * 1000}/${W} = ${n((Pt * 1000) / W, 5)}$ cycles per second.`, `$f = P/W = ${Pt * 1000}/${W} = ${n((Pt * 1000) / W, 5)}$ サイクル毎秒です。`], [`$N = 60f = ${n(need, 5)}$ rpm. Faster is not free: flow losses in the heat exchangers grow roughly with the square of speed.`, `$N = 60f = ${n(need, 5)}$ rpm です。速く回すほど熱交換器の流れの損失がおよそ速さの二乗で増えます。`]],
        set: { rpm: Math.min(3000, Math.max(300, Math.round(need / 50) * 50)) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const X = r.pick([0, 0.5, 1, 2]);
        return {
          q: [`With equal cylinders and $\\tau = 1/3$, how does the best phase angle at $X = ${X}$ compare with 90°, and why?`, `シリンダが同じ大きさで $\\tau = 1/3$ のとき、$X = ${X}$ での最良の位相角は 90° と比べてどうですか。理由も答えてください。`],
          a: { type: 'choice', opts: [[X === 0 ? 'Well below 90°: with no dead space the pressure swing is large and the optimum shifts away from quadrature' : 'Just below 90°, and closer to 90° the more dead space there is, because dead volume shrinks b and the small-swing optimum is quadrature', X === 0 ? '90° よりかなり小さいです。死容積がないと圧力の振れが大きく、最適点は直交からずれます' : '90° よりわずかに小さく、死容積が多いほど 90° に近づきます。死容積が b を小さくし、振れが小さいときの最適点は直交だからです'], ['Exactly 90° for every dead volume, because the crank is built that way', '死容積によらずちょうど 90° です。クランクがそう作られているからです'], ['Above 90°, moving towards 180° as dead space grows', '90° より大きく、死容積が増えると 180° に近づきます'], ['It does not depend on dead volume at all', '死容積にはまったく依存しません']], v: 0 },
          hint: ['Dead volume damps the pressure swing; think about the small-$b$ limit.', '死容積は圧力の振れを弱めます。$b$ が小さい極限を考えます。'],
          sol: [[`The optimum for $\\kappa = 1$ sits at about ${X === 0 ? '77.7' : X === 0.5 ? '86.7' : X === 1 ? '88.3' : '89.3'}° here.`, `ここでの $\\kappa = 1$ の最適点はおよそ ${X === 0 ? '77.7' : X === 0.5 ? '86.7' : X === 1 ? '88.3' : '89.3'}° です。`], ['As $b$ shrinks the pressure is nearly $p_{\\mathrm{mean}}(1 - b\\cos(\\theta + \\beta))$, and the work, a product of sines of the phase, peaks when the volume waves are in quadrature.', '$b$ が小さくなると圧力はほぼ $p_{\\mathrm{mean}}(1 - b\\cos(\\theta + \\beta))$ になり、位相の正弦の積である仕事は、体積の波が直交するとき最大になります。']],
          set: { kap: 1, X, Th: 900, norm: 0 },
        };
      }
      if (form === 1) {
        const F = r.pick([0.15, 0.2, 0.25, 0.293, 0.35]), Ve = r.pick([100, 150, 200]), kap = r.pick([1, 1.5, 2]), rpm = r.step(900, 2400, 300), Pt = r.pick([1, 2, 3, 5]);
        const VT = Ve * (1 + kap) * 1e-6, pm = (Pt * 1000 * 60) / (F * VT * rpm) / 1e5;
        return {
          q: [`A design sits at $W/(p_{\\mathrm{mean}}V_T) = ${F}$ with $V_{swe} = ${Ve}$ cm³ and $\\kappa = ${kap}$. What mean pressure is needed for $${Pt}$ kW at $${rpm}$ rpm? In bar.`, `ある設計は $W/(p_{\\mathrm{mean}}V_T) = ${F}$、$V_{swe} = ${Ve}$ cm³、$\\kappa = ${kap}$ です。$${rpm}$ rpm で $${Pt}$ kW を出すのに必要な平均圧力はいくらですか。bar で答えてください。`],
          a: { type: 'num', v: pm, rel: 0.006, unit: ['bar', 'bar'] },
          hint: ['Find the work per cycle first, then undo the normalisation.', 'まず一サイクルの仕事を求め、それから正規化を戻します。'],
          sol: [[`$W = P/f = ${Pt * 1000}/(${rpm}/60) = ${n((Pt * 1000 * 60) / rpm, 5)}$ J, and $V_T = ${n(VT, 4)}$ m³.`, `$W = P/f = ${Pt * 1000}/(${rpm}/60) = ${n((Pt * 1000 * 60) / rpm, 5)}$ J、$V_T = ${n(VT, 4)}$ m³ です。`], [`$p_{\\mathrm{mean}} = W/(${F}\\,V_T) = ${n(pm * 1e5, 4)}$ Pa $= ${n(pm, 4)}$ bar. Power scales with pressure, which is why serious Stirling engines run pressurised helium or hydrogen.`, `$p_{\\mathrm{mean}} = W/(${F}\\,V_T) = ${n(pm * 1e5, 4)}$ Pa $= ${n(pm, 4)}$ bar です。出力は圧力に比例するので、本格的なスターリングエンジンは高圧のヘリウムや水素を使います。`]],
        };
      }
      const W = r.pick([20, 40, 53.7, 75, 100]);
      return {
        q: [`An engine does $${W}$ J per cycle. Write its power $P$ in watts as a function of the speed $N$ in rpm.`, `一サイクルに $${W}$ J の仕事をするエンジンがあります。回転数 $N$（rpm）の関数として出力 $P$（W）を書いてください。`],
        a: { type: 'expr', v: `${W}*N/60`, vars: ['N'], dom: { N: [300, 3000] }, lhs: ['$P(N) =$', '$P(N) =$'] },
        hint: ['One cycle per revolution; $N$ revolutions per minute.', '一回転で一サイクル、毎分 $N$ 回転です。'],
        sol: [[`$f = N/60$ cycles per second.`, `$f = N/60$ サイクル毎秒です。`], [`$P = Wf = ${W}N/60$ W: linear in speed while the Schmidt work per cycle stays fixed, which in a real engine it does not.`, `$P = Wf = ${W}N/60$ W です。一サイクルの仕事が一定なら速さに比例しますが、実際のエンジンでは一定ではありません。`]],
      };
    },
  ];

  /* ---------------- stirling-regenerator ---------------- */
  Q['stirling-regenerator'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const e = r.step(0.5, 0.99, 0.01), Th = r.step(600, 1200, 100), Tc = r.step(280, 350, 10), To = Tc + e * (Th - Tc);
        return {
          q: [`A regenerator with effectiveness $\\varepsilon = ${n(e, 2)}$ works between $T_c = ${Tc}$ K and $T_h = ${Th}$ K. At what temperature does the gas reach the heater? In kelvin.`, `有効度 $\\varepsilon = ${n(e, 2)}$ の再生器が $T_c = ${Tc}$ K と $T_h = ${Th}$ K の間で働いています。ガスは何 K で加熱器に届きますか。`],
          a: { type: 'num', v: To, tol: 0.5, unit: ['K', 'K'] },
          hint: ['$\\varepsilon = (T_{\\mathrm{out}} - T_c)/(T_h - T_c)$.', '$\\varepsilon = (T_{\\mathrm{out}} - T_c)/(T_h - T_c)$ です。'],
          sol: [[`$T_{\\mathrm{out}} = T_c + \\varepsilon(T_h - T_c) = ${Tc} + ${n(e, 2)}\\times${Th - Tc}$.`, `$T_{\\mathrm{out}} = T_c + \\varepsilon(T_h - T_c) = ${Tc} + ${n(e, 2)}\\times${Th - Tc}$ です。`], [`$T_{\\mathrm{out}} = ${n(To, 5)}$ K; the heater must supply the last $${n(Th - To, 4)}$ K at constant volume.`, `$T_{\\mathrm{out}} = ${n(To, 5)}$ K です。残りの $${n(Th - To, 4)}$ K は加熱器が定積で補います。`]],
          set: { eps: Number(n(e, 2)), Th, Tc },
        };
      }
      const N = r.pick([1, 2, 4, 9, 19, 49, 99]), e = N / (1 + N);
      return {
        q: [`A balanced counterflow regenerator has $\\mathrm{NTU} = ${N}$. What is its effectiveness $\\varepsilon = \\mathrm{NTU}/(1 + \\mathrm{NTU})$? Three decimals.`, `釣り合った対向流の再生器の $\\mathrm{NTU} = ${N}$ です。有効度 $\\varepsilon = \\mathrm{NTU}/(1 + \\mathrm{NTU})$ はいくらですか。小数第三位まで答えてください。`],
        a: { type: 'num', v: e, tol: 0.0006 },
        hint: ['Substitute directly.', 'そのまま代入します。'],
        sol: [[`$\\varepsilon = ${N}/${N + 1} = ${n(e, 4)}$. Each further step towards 1 costs ever more transfer units, which is why regenerator matrices are so fine.`, `$\\varepsilon = ${N}/${N + 1} = ${n(e, 4)}$ です。1 に近づくごとに必要な伝熱単位数はどんどん増えるので、再生器のマトリクスはとても細かく作られます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1), gi = r.int(0, 2), G = GAS[gi], Th = r.step(600, 1200, 100), Tc = r.pick([300, 320, 350]), rr = r.pick([1.5, 2, 2.5, 3]);
      if (form === 0) {
        const e = r.pick([0, 0.5, 0.8, 0.9, 0.95, 0.98]), v = eta(e, Th, Tc, rr, G.g);
        return {
          q: [`An ideal Stirling cycle on ${G.en} ($\\gamma = ${n(G.g, 4)}$) runs between $${Tc}$ K and $${Th}$ K with volume ratio $r = ${rr}$ and regenerator effectiveness $\\varepsilon = ${e}$. What is its efficiency? As a percentage.`, `${G.ja}（$\\gamma = ${n(G.g, 4)}$）の理想スターリングサイクルが $${Tc}$ K と $${Th}$ K の間で、体積比 $r = ${rr}$、再生器の有効度 $\\varepsilon = ${e}$ で動きます。効率はいくらですか。百分率で答えてください。`],
          a: { type: 'num', v: 100 * v, rel: 0.004, unit: ['%', '%'] },
          hint: ['Per unit $R$: work $(T_h - T_c)\\ln r$; heat $T_h\\ln r$ plus the unrecovered $(1-\\varepsilon)(T_h - T_c)/(\\gamma - 1)$.', '$R$ あたりで、仕事は $(T_h - T_c)\\ln r$、熱は $T_h\\ln r$ に回収されない $(1-\\varepsilon)(T_h - T_c)/(\\gamma - 1)$ を足したものです。'],
          sol: [[`$\\ln r = ${n(Math.log(rr), 5)}$, so $W/R = ${Th - Tc}\\times${n(Math.log(rr), 5)} = ${n((Th - Tc) * Math.log(rr), 5)}$ K.`, `$\\ln r = ${n(Math.log(rr), 5)}$ なので $W/R = ${Th - Tc}\\times${n(Math.log(rr), 5)} = ${n((Th - Tc) * Math.log(rr), 5)}$ K です。`], [`$Q/R = ${Th}\\times${n(Math.log(rr), 5)} + ${n(1 - e, 3)}\\times${Th - Tc}/${n(G.g - 1, 4)} = ${n(Th * Math.log(rr) + ((1 - e) * (Th - Tc)) / (G.g - 1), 5)}$ K.`, `$Q/R = ${Th}\\times${n(Math.log(rr), 5)} + ${n(1 - e, 3)}\\times${Th - Tc}/${n(G.g - 1, 4)} = ${n(Th * Math.log(rr) + ((1 - e) * (Th - Tc)) / (G.g - 1), 5)}$ K です。`], [`$\\eta = ${n(100 * v, 4)}\\%$, against a Carnot limit of $${n(100 * (1 - Tc / Th), 4)}\\%$.`, `$\\eta = ${n(100 * v, 4)}\\%$ で、カルノー効率 $${n(100 * (1 - Tc / Th), 4)}\\%$ と比べられます。`]],
          set: { eps: e, Th, Tc, r: rr, gas: gi },
        };
      }
      const W = G.R * (Th - Tc) * Math.log(rr) / 1000;
      return {
        q: [`An ideal Stirling cycle on ${G.en} ($R = ${G.R}$ J/kg·K) runs between $${Tc}$ K and $${Th}$ K with volume ratio $r = ${rr}$. How much work does it do per kilogram per cycle? In kJ.`, `${G.ja}（$R = ${G.R}$ J/kg·K）の理想スターリングサイクルが $${Tc}$ K と $${Th}$ K の間で体積比 $r = ${rr}$ で動きます。1 kg あたり一サイクルの仕事はいくらですか。kJ で答えてください。`],
        a: { type: 'num', v: W, rel: 0.004, unit: ['kJ', 'kJ'] },
        hint: ['Only the two isotherms do net work; the isochores do none.', '正味の仕事をするのは二本の等温線だけで、等積線は何もしません。'],
        sol: [[`$W = R(T_h - T_c)\\ln r = ${G.R}\\times${Th - Tc}\\times${n(Math.log(rr), 5)}$ J/kg.`, `$W = R(T_h - T_c)\\ln r = ${G.R}\\times${Th - Tc}\\times${n(Math.log(rr), 5)}$ J/kg です。`], [`$W = ${n(W, 5)}$ kJ/kg, whatever the regenerator does: it changes the heat bought, not the work.`, `$W = ${n(W, 5)}$ kJ/kg です。再生器が何をしても変わりません。再生器が変えるのは買う熱であって仕事ではありません。`]],
        set: { Th, Tc, r: rr, gas: gi },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const G = GAS[0], Th = r.step(700, 1100, 100), Tc = 300, rr = r.pick([2, 2.5, 3]), C = 1 - Tc / Th, target = r.pick([0.6, 0.7, 0.8, 0.9]) * C;
        const L = Math.log(rr), dT = Th - Tc, e = 1 - ((G.g - 1) * ((dT * L) / target - Th * L)) / dT;
        return {
          q: [`A helium Stirling cycle ($\\gamma = 5/3$) runs between 300 K and $${Th}$ K with $r = ${rr}$. What regenerator effectiveness gives an efficiency of $${n(100 * target, 4)}\\%$? Three decimals.`, `ヘリウム（$\\gamma = 5/3$）のスターリングサイクルが 300 K と $${Th}$ K の間で $r = ${rr}$ で動きます。効率 $${n(100 * target, 4)}\\%$ を得る再生器の有効度はいくらですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: e, tol: 0.0015 },
          hint: ['Set $W/Q$ equal to the target and solve for the unrecovered fraction $1 - \\varepsilon$.', '$W/Q$ を目標に等しいとおき、回収されない割合 $1 - \\varepsilon$ について解きます。'],
          sol: [[`$Q/R$ must be $W/(R\\eta) = ${dT}\\times${n(L, 5)}/${n(target, 5)} = ${n((dT * L) / target, 5)}$ K.`, `$Q/R$ は $W/(R\\eta) = ${dT}\\times${n(L, 5)}/${n(target, 5)} = ${n((dT * L) / target, 5)}$ K でなければなりません。`], [`Of that, $T_h\\ln r = ${n(Th * L, 5)}$ K is the isotherm, so $(1 - \\varepsilon)\\,${dT}/(2/3) = ${n((dT * L) / target - Th * L, 5)}$ K.`, `そのうち $T_h\\ln r = ${n(Th * L, 5)}$ K は等温線の分なので、$(1 - \\varepsilon)\\,${dT}/(2/3) = ${n((dT * L) / target - Th * L, 5)}$ K です。`], [`$\\varepsilon = ${n(e, 4)}$: to come within ${n(100 * (1 - target / C), 2)}% of Carnot, the regenerator must return that fraction of the isochoric heat.`, `$\\varepsilon = ${n(e, 4)}$ です。カルノー効率まで ${n(100 * (1 - target / C), 2)}% 以内に近づくには、再生器が等積の熱のこの割合を返さなければなりません。`]],
          set: { eps: Number(e.toFixed(2)), Th, Tc: 300, r: rr, gas: 0 },
        };
      }
      if (form === 1) {
        const Th = r.step(600, 1200, 100), Tc = 300, rr = 2, gi = r.int(0, 2), G = GAS[gi], A = (Th - Tc) * Math.log(rr), B = Th * Math.log(rr), C = (Th - Tc) / (G.g - 1);
        return {
          q: [`For ${G.en} ($\\gamma = ${n(G.g, 4)}$) between 300 K and $${Th}$ K with $r = 2$, write the efficiency $\\eta$ as a function of the regenerator effectiveness $e$.`, `${G.ja}（$\\gamma = ${n(G.g, 4)}$）が 300 K と $${Th}$ K の間で $r = 2$ のとき、効率 $\\eta$ を再生器の有効度 $e$ の関数として書いてください。`],
          a: { type: 'expr', v: `${A}/(${B}+(1-e)*${C})`, vars: ['e'], dom: { e: [0, 1] }, lhs: ['$\\eta(e) =$', '$\\eta(e) =$'] },
          hint: ['$\\eta = (T_h - T_c)\\ln r\\,/\\,[T_h\\ln r + (1 - e)(T_h - T_c)/(\\gamma - 1)]$ with the numbers in.', '$\\eta = (T_h - T_c)\\ln r\\,/\\,[T_h\\ln r + (1 - e)(T_h - T_c)/(\\gamma - 1)]$ に数を入れます。'],
          sol: [[`Numerator $${Th - Tc}\\ln 2$, isotherm heat $${Th}\\ln 2$, isochoric heat $${Th - Tc}/${n(G.g - 1, 4)} = ${n(C, 5)}$.`, `分子は $${Th - Tc}\\ln 2$、等温の熱は $${Th}\\ln 2$、等積の熱は $${Th - Tc}/${n(G.g - 1, 4)} = ${n(C, 5)}$ です。`], [`$\\eta(e) = ${Th - Tc}\\ln 2/(${Th}\\ln 2 + ${n(C, 5)}(1 - e))$, rising from $${n(100 * eta(0, Th, Tc, 2, G.g), 3)}\\%$ at $e = 0$ to Carnot, $${n(100 * (1 - Tc / Th), 3)}\\%$, at $e = 1$.`, `$\\eta(e) = ${Th - Tc}\\ln 2/(${Th}\\ln 2 + ${n(C, 5)}(1 - e))$ で、$e = 0$ の $${n(100 * eta(0, Th, Tc, 2, G.g), 3)}\\%$ から $e = 1$ のカルノー効率 $${n(100 * (1 - Tc / Th), 3)}\\%$ まで上がります。`]],
          set: { Th, Tc: 300, r: 2, gas: gi },
        };
      }
      const e = r.pick([0.9, 0.95, 0.98, 0.99]), N = e / (1 - e);
      return {
        q: [`What number of transfer units does a balanced counterflow regenerator need for $\\varepsilon = ${e}$?`, `釣り合った対向流の再生器で $\\varepsilon = ${e}$ を得るには、伝熱単位数 NTU はいくら必要ですか。`],
        a: { type: 'num', v: N, rel: 0.004 },
        hint: ['Invert $\\varepsilon = \\mathrm{NTU}/(1 + \\mathrm{NTU})$.', '$\\varepsilon = \\mathrm{NTU}/(1 + \\mathrm{NTU})$ を逆に解きます。'],
        sol: [[`$\\mathrm{NTU} = \\varepsilon/(1 - \\varepsilon) = ${e}/${n(1 - e, 3)}$.`, `$\\mathrm{NTU} = \\varepsilon/(1 - \\varepsilon) = ${e}/${n(1 - e, 3)}$ です。`], [`$\\mathrm{NTU} = ${n(N, 4)}$. Halving the leak $1 - \\varepsilon$ doubles the transfer area, and with it the flow loss and the dead volume.`, `$\\mathrm{NTU} = ${n(N, 4)}$ です。漏れ $1 - \\varepsilon$ を半分にするには伝熱面積が二倍必要で、流れの損失と死容積も増えます。`]],
        set: { eps: e },
      };
    },
  ];
})();
