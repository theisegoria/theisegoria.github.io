'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180, G0 = 9.80665;
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const R = 0.043, Rmm = 43;                                   // crank radius of the figure
  const omega = (rpm) => rpm * TAU / 60;
  const xOf = (th, r, lam) => r * (1 - Math.cos(th)) + (r / lam) * (1 - Math.sqrt(1 - lam * lam * Math.sin(th) ** 2));
  const dx = (th, r, lam) => { const s = Math.sin(th), c = Math.cos(th); return r * s * (1 + lam * c / Math.sqrt(1 - lam * lam * s * s)); };
  function peakAngle(lam) { let best = 0, bv = -1; for (let i = 0; i <= 18000; i++) { const t = i / 18000 * PI, v = dx(t, 1, lam); if (v > bv) { bv = v; best = t; } } return best; }
  const lamPick = (r) => Math.round(r.step(0.2, 0.45, 0.01) * 100) / 100;
  const rpmPick = (r, lo = 1000, hi = 9000) => r.step(lo, hi, 100);
  const GAM = 1.4, CV = 718, RG = 287;

  /* ---------------- 1. crank-slider ---------------- */
  Q['crank-slider'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rpm = rpmPick(r), w = omega(rpm);
        return {
          q: [`An engine turns at ${rpm} rpm. What is the crank’s angular velocity $\\omega$, in rad/s?`, `エンジンが ${rpm} rpm で回っています。クランクの角速度 $\\omega$ は何 rad/s ですか。`],
          a: { type: 'num', v: w, rel: 0.002, unit: ['rad/s', 'rad/s'] },
          hint: ['One revolution is $2\\pi$ radians and a minute is 60 s.', '一回転は $2\\pi$ ラジアン、1 分は 60 秒です。'],
          sol: [[`$\\omega = 2\\pi \\times ${rpm}/60 = ${n(w, 2)}$ rad/s.`, `$\\omega = 2\\pi \\times ${rpm}/60 = ${n(w, 2)}$ rad/s です。`], [`Every inertial force in the engine scales with $\\omega^2 = ${sig(w * w, 3)}\\ \\mathrm{s^{-2}}$, so doubling the speed quadruples the loads.`, `エンジン内の慣性力はすべて $\\omega^2 = ${sig(w * w, 3)}\\ \\mathrm{s^{-2}}$ に比例するので、回転数を二倍にすると荷重は四倍になります。`]],
          set: { rpm },
        };
      }
      if (form === 1) {
        const rpm = rpmPick(r), v = 4 * R * rpm / 60;
        return {
          q: [`The crank radius is 43 mm. At ${rpm} rpm, what is the mean piston speed, in m/s?`, `クランク半径は 43 mm です。${rpm} rpm のとき、平均ピストン速度は何 m/s ですか。`],
          a: { type: 'num', v, rel: 0.003, unit: ['m/s', 'm/s'] },
          hint: ['Per revolution the piston travels the stroke down and back up: twice $2r$.', '一回転でピストンは行程を下って上がるので、$2r$ の二倍を進みます。'],
          sol: [[`Stroke $= 2r = 86$ mm; distance per revolution $= 2 \\times 0.086 = 0.172$ m.`, `行程は $2r = 86$ mm で、一回転あたりの移動距離は $2 \\times 0.086 = 0.172$ m です。`], [`Mean speed $= 0.172 \\times ${rpm}/60 = ${n(v, 2)}$ m/s. ${v > 20 ? 'Above about 20 m/s is racing-engine territory: ring friction and valve gear become the limits.' : 'Road engines rarely exceed about 20 m/s at their red line.'}`, `平均速度 $= 0.172 \\times ${rpm}/60 = ${n(v, 2)}$ m/s です。${v > 20 ? 'およそ 20 m/s を超えるとレース用エンジンの領域で、ピストンリングの摩擦と動弁系が限界になります。' : '市販車のエンジンは、レッドゾーンでもおよそ 20 m/s を超えることはまれです。'}`]],
          set: { rpm },
        };
      }
      const lam = lamPick(r), l = Rmm / lam;
      return {
        q: [`A crank of radius 43 mm has rod ratio $\\lambda = r/l = ${n(lam)}$. How long is the connecting rod, centre to centre, in mm?`, `半径 43 mm のクランクのコンロッド比は $\\lambda = r/l = ${n(lam)}$ です。コンロッドの長さ（中心間）は何 mm ですか。`],
        a: { type: 'num', v: l, tol: 0.05, unit: ['mm', 'mm'] },
        hint: ['Rearrange $\\lambda = r/l$.', '$\\lambda = r/l$ を変形します。'],
        sol: [[`$l = r/\\lambda = 43/${n(lam)} = ${n(l, 2)}$ mm.`, `$l = r/\\lambda = 43/${n(lam)} = ${n(l, 2)}$ mm です。`], ['A shorter rod (larger $\\lambda$) makes a more compact engine but a stronger second harmonic in the piston motion, and more side thrust on the cylinder wall.', 'コンロッドが短い（$\\lambda$ が大きい）とエンジンはコンパクトになりますが、ピストンの運動の二次成分は強くなり、シリンダ壁への横推力も増えます。']],
        set: { lam },
      };
    },
    (r) => {
      const form = r.int(0, 2), lam = lamPick(r);
      if (form === 0) {
        let th; do { th = r.step(10, 350, 5); } while (th === 180);
        const x = xOf(th * DEG, Rmm, lam);
        return {
          q: [`With $r = 43$ mm and $\\lambda = ${n(lam)}$, how far is the piston from top dead centre when the crank is at $\\theta = ${th}^\\circ$, in mm?`, `$r = 43$ mm、$\\lambda = ${n(lam)}$ のとき、クランクが $\\theta = ${th}^\\circ$ にあるとき、ピストンは上死点から何 mm 離れていますか。`],
          a: { type: 'num', v: x, tol: 0.05, unit: ['mm', 'mm'] },
          hint: ['$x = r(1 - \\cos\\theta) + l\\big(1 - \\sqrt{1 - \\lambda^2\\sin^2\\theta}\\big)$: the crank’s drop plus the rod’s tilt.', '$x = r(1 - \\cos\\theta) + l\\big(1 - \\sqrt{1 - \\lambda^2\\sin^2\\theta}\\big)$ で、クランクの下がりとコンロッドの傾きの分です。'],
          sol: [[`Crank part: $43(1 - \\cos ${th}^\\circ) = ${n(Rmm * (1 - Math.cos(th * DEG)), 3)}$ mm.`, `クランクの分は $43(1 - \\cos ${th}^\\circ) = ${n(Rmm * (1 - Math.cos(th * DEG)), 3)}$ mm です。`], [`Rod part, with $l = ${n(Rmm / lam, 2)}$ mm: $l\\big(1 - \\sqrt{1 - ${n(lam)}^2\\sin^2 ${th}^\\circ}\\big) = ${n(x - Rmm * (1 - Math.cos(th * DEG)), 3)}$ mm.`, `コンロッドの分は $l = ${n(Rmm / lam, 2)}$ mm として $l\\big(1 - \\sqrt{1 - ${n(lam)}^2\\sin^2 ${th}^\\circ}\\big) = ${n(x - Rmm * (1 - Math.cos(th * DEG)), 3)}$ mm です。`], [`$x = ${n(x, 2)}$ mm. ${th === 90 || th === 270 ? 'At 90° the piston is already past half the stroke (43 mm) because the rod is tilted.' : 'The rod term is always positive: the tilted rod pulls the piston further down than the crank alone would.'}`, `$x = ${n(x, 2)}$ mm です。${th === 90 || th === 270 ? 'コンロッドが傾いているので、90° でピストンはすでに行程の半分（43 mm）を過ぎています。' : 'コンロッドの項は常に正です。傾いたコンロッドは、クランクだけの場合よりピストンを深く引き下げます。'}`]],
          set: { lam, th },
        };
      }
      const rpm = rpmPick(r, 2000, 9000), w = omega(rpm), aT = R * w * w * (1 + lam) / G0, aB = R * w * w * (1 - lam) / G0;
      if (form === 1) return {
        q: [`At ${rpm} rpm with $r = 43$ mm and $\\lambda = ${n(lam)}$, what are the piston’s accelerations at top and bottom dead centre, in multiples of $g$?`, `${rpm} rpm、$r = 43$ mm、$\\lambda = ${n(lam)}$ のとき、上死点と下死点でのピストンの加速度は $g$ の何倍ですか。`],
        a: { type: 'tuple', v: [aT, aB], labels: [['TDC', '上死点'], ['BDC', '下死点']], tol: Math.max(2, aT * 0.004) },
        hint: ['At the dead centres the exact acceleration is $r\\omega^2(1 \\pm \\lambda)$ in size.', '死点での厳密な加速度の大きさは $r\\omega^2(1 \\pm \\lambda)$ です。'],
        sol: [[`$\\omega = ${n(w, 2)}$ rad/s, $r\\omega^2 = ${n(R * w * w, 0)}\\ \\mathrm{m/s^2} = ${n(R * w * w / G0, 0)}\\,g$.`, `$\\omega = ${n(w, 2)}$ rad/s、$r\\omega^2 = ${n(R * w * w, 0)}\\ \\mathrm{m/s^2} = ${n(R * w * w / G0, 0)}\\,g$ です。`], [`TDC: $\\times(1 + ${n(lam)}) = ${n(aT, 0)}\\,g$; BDC: $\\times(1 - ${n(lam)}) = ${n(aB, 0)}\\,g$.`, `上死点では $\\times(1 + ${n(lam)}) = ${n(aT, 0)}\\,g$、下死点では $\\times(1 - ${n(lam)}) = ${n(aB, 0)}\\,g$ です。`], ['The difference, $2\\lambda r\\omega^2$, is the second harmonic: the piston turns round much harder at the top, where the rod tilt adds to the crank’s motion.', '差の $2\\lambda r\\omega^2$ が二次成分です。コンロッドの傾きがクランクの運動に加わる上側で、ピストンはずっと激しく折り返します。']],
        set: { lam, rpm, th: 0 },
      };
      const m = r.pick([0.3, 0.35, 0.4, 0.45, 0.5, 0.6]), F = m * R * w * w * (1 + lam);
      return {
        q: [`A piston and pin of ${n(m)} kg, $r = 43$ mm, $\\lambda = ${n(lam)}$, ${rpm} rpm. With no gas pressure (the top of the exhaust stroke), what force does the rod have to pull on the piston at top dead centre, in kN?`, `ピストンとピンの質量 ${n(m)} kg、$r = 43$ mm、$\\lambda = ${n(lam)}$、${rpm} rpm です。ガス圧がない（排気行程の上端）とき、上死点でコンロッドがピストンを引く力は何 kN ですか。`],
        a: { type: 'num', v: F / 1000, rel: 0.005, unit: ['kN', 'kN'] },
        hint: ['Newton’s second law with the TDC acceleration $r\\omega^2(1 + \\lambda)$.', '上死点での加速度 $r\\omega^2(1 + \\lambda)$ にニュートンの第二法則を使います。'],
        sol: [[`$a = r\\omega^2(1 + \\lambda) = 0.043 \\times ${n(w, 2)}^2 \\times ${n(1 + lam)} = ${n(R * w * w * (1 + lam), 0)}\\ \\mathrm{m/s^2}$.`, `$a = r\\omega^2(1 + \\lambda) = 0.043 \\times ${n(w, 2)}^2 \\times ${n(1 + lam)} = ${n(R * w * w * (1 + lam), 0)}\\ \\mathrm{m/s^2}$ です。`], [`$F = ma = ${n(m)} \\times ${n(R * w * w * (1 + lam), 0)} = ${n(F / 1000, 2)}$ kN, ${rpm * 1 / 120} times a second at this speed.`, `$F = ma = ${n(m)} \\times ${n(R * w * w * (1 + lam), 0)} = ${n(F / 1000, 2)}$ kN で、この回転数では毎秒 ${rpm / 120} 回かかります。`], ['This load tries to stretch the rod and its bolts; it is why rod bolts are among the most carefully specified parts of a high-revving engine.', 'この荷重はコンロッドとそのボルトを引き伸ばそうとします。高回転エンジンでコンロッドボルトが最も慎重に仕様を決められる部品の一つなのはこのためです。']],
        set: { lam, rpm, th: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2), lam = lamPick(r);
      if (form === 0) {
        const X = r.pick([1200, 1500, 1800, 2000, 2500, 3000]), w = Math.sqrt(X * G0 / (R * (1 + lam))), rpm = w * 60 / TAU;
        const sr = Math.round(rpm / 100) * 100;
        return {
          q: [`The piston’s acceleration at top dead centre must not exceed ${X} g. With $r = 43$ mm and $\\lambda = ${n(lam)}$, what is the highest permissible engine speed, in rpm?`, `上死点でのピストンの加速度は ${X} g を超えてはいけません。$r = 43$ mm、$\\lambda = ${n(lam)}$ のとき、許される最高回転数は何 rpm ですか。`],
          a: { type: 'num', v: rpm, rel: 0.005, unit: ['rpm', 'rpm'] },
          hint: ['Solve $r\\omega^2(1 + \\lambda) = ${X}g$ for $\\omega$, then convert.'.replace('${X}', X), '$r\\omega^2(1 + \\lambda) = ' + X + 'g$ を $\\omega$ について解き、換算します。'],
          sol: [[`$\\omega^2 = \\dfrac{${X} \\times 9.807}{0.043 \\times ${n(1 + lam)}} = ${n(w * w, 0)}$, so $\\omega = ${n(w, 1)}$ rad/s.`, `$\\omega^2 = \\dfrac{${X} \\times 9.807}{0.043 \\times ${n(1 + lam)}} = ${n(w * w, 0)}$ より $\\omega = ${n(w, 1)}$ rad/s です。`], [`$N = 60\\omega/2\\pi = ${n(rpm, 0)}$ rpm. Because the load goes as $N^2$, raising the limit by 20% buys only about 10% more speed.`, `$N = 60\\omega/2\\pi = ${n(rpm, 0)}$ rpm です。荷重は $N^2$ に比例するので、限界を 20% 上げても回転数はおよそ 10% しか上がりません。`]],
          set: sr >= 1000 && sr <= 9000 ? { lam, rpm: sr, th: 0 } : { lam },
        };
      }
      if (form === 1) {
        return {
          q: [`Expand the piston position to first order in $\\lambda$ and differentiate. For $r = 43$ mm and $\\lambda = ${n(lam)}$, write $dx/d\\theta$ in mm per radian as a function of $\\theta$.`, `ピストンの位置を $\\lambda$ の一次まで展開して微分します。$r = 43$ mm、$\\lambda = ${n(lam)}$ のとき、$dx/d\\theta$（mm/rad）を $\\theta$ の関数として書いてください。`],
          a: { type: 'expr', v: `43*(sin(theta)+${lam / 2}*sin(2*theta))`, vars: ['theta'], dom: { theta: [0.2, 3] }, lhs: ['$\\dfrac{dx}{d\\theta} \\approx$', '$\\dfrac{dx}{d\\theta} \\approx$'] },
          hint: ['$\\sqrt{1 - u} \\approx 1 - u/2$ turns the rod term into $\\tfrac12\\lambda r\\sin^2\\theta$.', '$\\sqrt{1 - u} \\approx 1 - u/2$ でコンロッドの項は $\\tfrac12\\lambda r\\sin^2\\theta$ になります。'],
          sol: [['$x \\approx r(1 - \\cos\\theta) + \\tfrac12\\lambda r\\sin^2\\theta$, since $l \\cdot \\tfrac12\\lambda^2\\sin^2\\theta = \\tfrac12\\lambda r\\sin^2\\theta$.', '$l \\cdot \\tfrac12\\lambda^2\\sin^2\\theta = \\tfrac12\\lambda r\\sin^2\\theta$ なので $x \\approx r(1 - \\cos\\theta) + \\tfrac12\\lambda r\\sin^2\\theta$ です。'], [`$dx/d\\theta \\approx r\\big(\\sin\\theta + \\tfrac{\\lambda}{2}\\sin 2\\theta\\big) = 43\\big(\\sin\\theta + ${n(lam / 2)}\\sin 2\\theta\\big)$.`, `$dx/d\\theta \\approx r\\big(\\sin\\theta + \\tfrac{\\lambda}{2}\\sin 2\\theta\\big) = 43\\big(\\sin\\theta + ${n(lam / 2)}\\sin 2\\theta\\big)$ です。`], ['The $\\sin 2\\theta$ term is positive in the first quarter turn, so the piston is fastest before 90°; differentiating once more gives the familiar $r\\omega^2(\\cos\\theta + \\lambda\\cos 2\\theta)$.', '$\\sin 2\\theta$ の項は最初の四分の一回転で正なので、ピストンは 90° より前で最も速くなります。もう一度微分すると、おなじみの $r\\omega^2(\\cos\\theta + \\lambda\\cos 2\\theta)$ が出ます。']],
          set: { lam },
        };
      }
      const pk = peakAngle(lam) / DEG;
      return {
        q: [`For rod ratio $\\lambda = ${n(lam)}$, at what crank angle (between 0° and 180°) is the piston fastest?`, `コンロッド比 $\\lambda = ${n(lam)}$ のとき、ピストンが最も速くなるのはクランク角何度（0° から 180° の間）のときですか。`],
        a: { type: 'num', v: pk, tol: 0.5, unit: ['°', '°'] },
        hint: ['Maximise $\\sin\\theta\\,(1 + \\lambda\\cos\\theta/\\sqrt{1 - \\lambda^2\\sin^2\\theta})$; to first order, solve $\\cos\\theta + \\lambda\\cos 2\\theta = 0$.', '$\\sin\\theta\\,(1 + \\lambda\\cos\\theta/\\sqrt{1 - \\lambda^2\\sin^2\\theta})$ を最大にします。一次の近似では $\\cos\\theta + \\lambda\\cos 2\\theta = 0$ を解きます。'],
        sol: [['The speed peaks where the acceleration vanishes. With the two-harmonic form, $\\cos\\theta + \\lambda(2\\cos^2\\theta - 1) = 0$, a quadratic in $\\cos\\theta$.', '速さは加速度が 0 になるところで最大です。二項の形では $\\cos\\theta + \\lambda(2\\cos^2\\theta - 1) = 0$ で、$\\cos\\theta$ の二次方程式です。'], [`$\\cos\\theta = \\dfrac{-1 + \\sqrt{1 + 8\\lambda^2}}{4\\lambda} = ${n((-1 + Math.sqrt(1 + 8 * lam * lam)) / (4 * lam), 4)}$, $\\theta \\approx ${n(Math.acos((-1 + Math.sqrt(1 + 8 * lam * lam)) / (4 * lam)) / DEG, 1)}^\\circ$; the exact maximum is at $${n(pk, 1)}^\\circ$.`, `$\\cos\\theta = \\dfrac{-1 + \\sqrt{1 + 8\\lambda^2}}{4\\lambda} = ${n((-1 + Math.sqrt(1 + 8 * lam * lam)) / (4 * lam), 4)}$、$\\theta \\approx ${n(Math.acos((-1 + Math.sqrt(1 + 8 * lam * lam)) / (4 * lam)) / DEG, 1)}^\\circ$ で、厳密な最大は $${n(pk, 1)}^\\circ$ です。`], ['Well before 90°: at 90° the crank pin moves along the cylinder, but the rod is still swinging and already slowing the piston.', '90° よりかなり手前です。90° ではクランクピンは気筒に沿って動きますが、コンロッドはまだ振れていて、すでにピストンを減速させています。']],
        set: { lam, th: Math.round(pk) },
      };
    },
  ];

  /* ---------------- 2. Otto and Diesel ---------------- */
  const etaO = (rc) => 1 - rc ** (1 - GAM);
  const etaD = (rc, c) => 1 - rc ** (1 - GAM) * (c ** GAM - 1) / (GAM * (c - 1));
  const rcPick = (r, lo = 6, hi = 20) => Math.round(r.step(lo, hi, 0.5) * 10) / 10;
  Q['otto-cycle'] = [
    (r) => {
      const form = r.int(0, 1), rc = rcPick(r, 6, 14);
      if (form === 0) return {
        q: [`What is the air-standard Otto efficiency at compression ratio $r = ${n(rc)}$, with $\\gamma = 1.4$, in percent?`, `圧縮比 $r = ${n(rc)}$、$\\gamma = 1.4$ のとき、空気標準オットーサイクルの効率は何パーセントですか。`],
        a: { type: 'num', v: 100 * etaO(rc), tol: 0.05, unit: ['%', '%'] },
        hint: ['$\\eta = 1 - r^{1-\\gamma}$.', '$\\eta = 1 - r^{1-\\gamma}$ です。'],
        sol: [[`$r^{-0.4} = ${n(rc)}^{-0.4} = ${n(rc ** -0.4, 4)}$.`, `$r^{-0.4} = ${n(rc)}^{-0.4} = ${n(rc ** -0.4, 4)}$ です。`], [`$\\eta = 1 - ${n(rc ** -0.4, 4)} = ${n(100 * etaO(rc), 1)}\\%$. Only the compression ratio matters: the gas expands by the same ratio it was compressed by, and that sets how much of the heat becomes work.`, `$\\eta = 1 - ${n(rc ** -0.4, 4)} = ${n(100 * etaO(rc), 1)}\\%$ です。効いているのは圧縮比だけです。気体は圧縮されたのと同じ比だけ膨張し、それが熱のどれだけが仕事になるかを決めます。`]],
        set: { rc, cycle: 0 },
      };
      const T1 = r.pick([290, 300, 310, 320, 330]), T2 = T1 * rc ** (GAM - 1);
      return {
        q: [`Air at ${T1} K is compressed adiabatically by a ratio $r = ${n(rc)}$ ($\\gamma = 1.4$). What is its temperature at the end of compression, in K?`, `${T1} K の空気を比 $r = ${n(rc)}$ で断熱圧縮します（$\\gamma = 1.4$）。圧縮の終わりの温度は何 K ですか。`],
        a: { type: 'num', v: T2, rel: 0.003, unit: ['K', 'K'] },
        hint: ['Adiabatic: $TV^{\\gamma - 1}$ is constant.', '断熱変化では $TV^{\\gamma - 1}$ が一定です。'],
        sol: [[`$T_2 = T_1 r^{\\gamma - 1} = ${T1} \\times ${n(rc)}^{0.4}$.`, `$T_2 = T_1 r^{\\gamma - 1} = ${T1} \\times ${n(rc)}^{0.4}$ です。`], [`$T_2 = ${n(T2, 0)}$ K, before any fuel burns. ${T2 > 750 ? 'Hot enough that a petrol mixture would risk igniting on its own: this is the knock limit.' : 'Comfortably below where a petrol mixture would ignite by itself.'}`, `燃料が燃える前に $T_2 = ${n(T2, 0)}$ K です。${T2 > 750 ? 'ガソリンの混合気が勝手に燃えるおそれがある温度で、これがノッキングの限界です。' : 'ガソリンの混合気が勝手に燃える温度よりは十分低い値です。'}`]],
        set: { rc, cycle: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rc = rcPick(r, 6, 22), p2 = rc ** GAM, T2 = 300 * rc ** (GAM - 1);
        return {
          q: [`Starting from 1 bar and 300 K, air is compressed adiabatically by $r = ${n(rc)}$. Find the pressure (bar) and temperature (K) at the end of compression.`, `1 bar、300 K から空気を $r = ${n(rc)}$ で断熱圧縮します。圧縮の終わりの圧力（bar）と温度（K）を求めてください。`],
          a: { type: 'tuple', v: [p2, T2], labels: [['$p_2$ (bar)', '$p_2$（bar）'], ['$T_2$ (K)', '$T_2$（K）']], tol: Math.max(0.1, p2 * 0.003) },
          hint: ['$pV^\\gamma$ and $TV^{\\gamma - 1}$ are constant along an adiabat.', '断熱線に沿って $pV^\\gamma$ と $TV^{\\gamma - 1}$ が一定です。'],
          sol: [[`$p_2 = p_1 r^\\gamma = ${n(rc)}^{1.4} = ${n(p2, 2)}$ bar.`, `$p_2 = p_1 r^\\gamma = ${n(rc)}^{1.4} = ${n(p2, 2)}$ bar です。`], [`$T_2 = 300 \\times ${n(rc)}^{0.4} = ${n(T2, 0)}$ K. The pressure rises faster than the volume falls ($r^{1.4}$ rather than $r$) because the gas also heats up.`, `$T_2 = 300 \\times ${n(rc)}^{0.4} = ${n(T2, 0)}$ K です。気体が熱くもなるので、圧力は体積の減り方（$r$）より速く（$r^{1.4}$ で）上がります。`]],
          set: { rc },
        };
      }
      if (form === 1) {
        const rc = rcPick(r, 14, 22), cut = Math.round(r.step(1.5, 3.5, 0.25) * 100) / 100, e = etaD(rc, cut);
        return {
          q: [`What is the air-standard Diesel efficiency for compression ratio $${n(rc)}$ and cutoff ratio $r_c = ${n(cut)}$ ($\\gamma = 1.4$), in percent?`, `圧縮比 $${n(rc)}$、締切比 $r_c = ${n(cut)}$（$\\gamma = 1.4$）の空気標準ディーゼルサイクルの効率は何パーセントですか。`],
          a: { type: 'num', v: 100 * e, tol: 0.05, unit: ['%', '%'] },
          hint: ['$\\eta = 1 - r^{1-\\gamma}\\,\\dfrac{r_c^\\gamma - 1}{\\gamma(r_c - 1)}$.', '$\\eta = 1 - r^{1-\\gamma}\\,\\dfrac{r_c^\\gamma - 1}{\\gamma(r_c - 1)}$ です。'],
          sol: [[`$r^{-0.4} = ${n(rc ** -0.4, 4)}$ and $\\dfrac{${n(cut)}^{1.4} - 1}{1.4 \\times ${n(cut - 1)}} = ${n((cut ** GAM - 1) / (GAM * (cut - 1)), 4)}$.`, `$r^{-0.4} = ${n(rc ** -0.4, 4)}$、$\\dfrac{${n(cut)}^{1.4} - 1}{1.4 \\times ${n(cut - 1)}} = ${n((cut ** GAM - 1) / (GAM * (cut - 1)), 4)}$ です。`], [`$\\eta = 1 - ${n(rc ** -0.4, 4)} \\times ${n((cut ** GAM - 1) / (GAM * (cut - 1)), 4)} = ${n(100 * e, 1)}\\%$, against $${n(100 * etaO(rc), 1)}\\%$ for an Otto cycle at the same compression: burning while expanding costs efficiency, and a longer cutoff costs more.`, `$\\eta = 1 - ${n(rc ** -0.4, 4)} \\times ${n((cut ** GAM - 1) / (GAM * (cut - 1)), 4)} = ${n(100 * e, 1)}\\%$ で、同じ圧縮比のオットーサイクルの $${n(100 * etaO(rc), 1)}\\%$ より低くなります。膨張しながら燃やすと効率が下がり、締切が長いほど下がります。`]],
          set: { rc, cycle: 1, cut },
        };
      }
      const rc = rcPick(r, 7, 13), v1 = RG * 300 / 1e5, w = 1.8e6 * etaO(rc), mep = w / (v1 * (1 - 1 / rc)) / 1e5;
      return {
        q: [`An air-standard Otto cycle adds 1.8 MJ per kg of air, with intake at 1 bar and 300 K ($R = 287$ J/(kg·K)) and $r = ${n(rc)}$. What is the mean effective pressure, in bar?`, `空気 1 kg あたり 1.8 MJ を加える空気標準オットーサイクルで、吸気は 1 bar、300 K（$R = 287$ J/(kg·K)）、$r = ${n(rc)}$ です。平均有効圧は何 bar ですか。`],
        a: { type: 'num', v: mep, rel: 0.005, unit: ['bar', 'bar'] },
        hint: ['Work per cycle divided by the swept volume: $\\text{mep} = w/(v_1 - v_2)$.', '一サイクルの仕事を行程容積で割ります。$\\text{mep} = w/(v_1 - v_2)$ です。'],
        sol: [[`$w = \\eta q_{\\rm in} = ${n(etaO(rc), 4)} \\times 1.8 = ${n(w / 1e6, 4)}$ MJ/kg.`, `$w = \\eta q_{\\rm in} = ${n(etaO(rc), 4)} \\times 1.8 = ${n(w / 1e6, 4)}$ MJ/kg です。`], [`$v_1 = RT_1/p_1 = ${n(v1, 4)}\\ \\mathrm{m^3/kg}$, $v_1 - v_2 = v_1(1 - 1/${n(rc)}) = ${n(v1 * (1 - 1 / rc), 4)}\\ \\mathrm{m^3/kg}$.`, `$v_1 = RT_1/p_1 = ${n(v1, 4)}\\ \\mathrm{m^3/kg}$、$v_1 - v_2 = v_1(1 - 1/${n(rc)}) = ${n(v1 * (1 - 1 / rc), 4)}\\ \\mathrm{m^3/kg}$ です。`], [`$\\text{mep} = ${n(w / (v1 * (1 - 1 / rc)), 0)}$ Pa $= ${n(mep, 2)}$ bar: the constant pressure that would do the same work over one stroke. Real naturally aspirated petrol engines reach about 10 to 13 bar.`, `$\\text{mep} = ${n(w / (v1 * (1 - 1 / rc)), 0)}$ Pa $= ${n(mep, 2)}$ bar です。一行程で同じ仕事をする一定の圧力にあたります。実際の自然吸気ガソリン機関はおよそ 10〜13 bar に達します。`]],
        set: { rc, cycle: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const eta = r.pick([0.5, 0.55, 0.58, 0.6, 0.62, 0.65, 0.68]), rc = (1 - eta) ** (1 / (1 - GAM));
        const s = Math.round(rc * 10) / 10;
        return {
          q: [`What compression ratio gives an ideal Otto efficiency of ${n(100 * eta)}% ($\\gamma = 1.4$)?`, `理想的なオットーサイクルの効率を ${n(100 * eta)}%（$\\gamma = 1.4$）にする圧縮比はいくつですか。`],
          a: { type: 'num', v: rc, rel: 0.003 },
          hint: ['Solve $1 - r^{-0.4} = \\eta$ for $r$.', '$1 - r^{-0.4} = \\eta$ を $r$ について解きます。'],
          sol: [[`$r^{-0.4} = 1 - ${n(eta)} = ${n(1 - eta)}$, so $r = ${n(1 - eta)}^{-1/0.4} = ${n(1 - eta)}^{-2.5}$.`, `$r^{-0.4} = 1 - ${n(eta)} = ${n(1 - eta)}$ より $r = ${n(1 - eta)}^{-1/0.4} = ${n(1 - eta)}^{-2.5}$ です。`], [`$r = ${n(rc, 2)}$. ${rc > 13 ? 'Beyond what a petrol engine tolerates without knock: this efficiency is diesel territory.' : 'Within reach of a petrol engine; real ones get about half the ideal figure because of heat loss, friction and finite burn time.'}`, `$r = ${n(rc, 2)}$ です。${rc > 13 ? 'ガソリン機関がノッキングなしに耐えられる範囲を超えており、この効率はディーゼルの領域です。' : 'ガソリン機関で届く値です。実際には熱損失、摩擦、有限の燃焼時間のために理想値のおよそ半分になります。'}`]],
          set: s >= 4 && s <= 22 ? { rc: s, cycle: 0 } : undefined,
        };
      }
      if (form === 1) {
        const T1 = r.pick([300, 320, 340]), Tl = r.pick([650, 700, 750, 800]), rc = (Tl / T1) ** (1 / (GAM - 1));
        return {
          q: [`A petrol mixture enters at ${T1} K and would self-ignite above about ${Tl} K. Treating compression as adiabatic with $\\gamma = 1.4$, what is the highest compression ratio before compression alone reaches that temperature?`, `ガソリンの混合気が ${T1} K で入り、約 ${Tl} K を超えると自己着火します。圧縮を $\\gamma = 1.4$ の断熱変化とみなすと、圧縮だけでその温度に達してしまう前の最高の圧縮比はいくつですか。`],
          a: { type: 'num', v: rc, rel: 0.005 },
          hint: ['Set $T_1 r^{0.4} = T_{\\rm limit}$.', '$T_1 r^{0.4} = T_{\\rm limit}$ とおきます。'],
          sol: [[`$r^{0.4} = ${Tl}/${T1} = ${n(Tl / T1, 4)}$.`, `$r^{0.4} = ${Tl}/${T1} = ${n(Tl / T1, 4)}$ です。`], [`$r = ${n(Tl / T1, 4)}^{2.5} = ${n(rc, 2)}$. A hotter intake lowers the limit sharply, which is why turbocharged petrol engines use intercoolers and lower compression ratios.`, `$r = ${n(Tl / T1, 4)}^{2.5} = ${n(rc, 2)}$ です。吸気が熱いと限界は急に下がります。ターボ付きのガソリン機関がインタークーラーと低めの圧縮比を使うのはこのためです。`]],
        };
      }
      if (form === 2) {
        const g = r.pick([1.3, 1.35, 1.4, 1.67]);
        return {
          q: [`Write the ideal Otto efficiency as a function of the compression ratio $r$ for a working gas with $\\gamma = ${n(g)}$.`, `$\\gamma = ${n(g)}$ の作動気体について、理想的なオットーサイクルの効率を圧縮比 $r$ の関数として書いてください。`],
          a: { type: 'expr', v: `1-r^(${n(1 - g, 4)})`, vars: ['r'], dom: { r: [4, 20] }, lhs: ['$\\eta =$', '$\\eta =$'] },
          hint: ['Heat in and out happen at constant volume, so $\\eta = 1 - (T_4 - T_1)/(T_3 - T_2)$, and both adiabats share the ratio $r^{\\gamma - 1}$.', '加熱と放熱はどちらも定積なので $\\eta = 1 - (T_4 - T_1)/(T_3 - T_2)$ で、二本の断熱線はともに比 $r^{\\gamma - 1}$ をもちます。'],
          sol: [['$T_2 = T_1 r^{\\gamma - 1}$ and $T_3 = T_4 r^{\\gamma - 1}$, so $(T_4 - T_1)/(T_3 - T_2) = r^{1 - \\gamma}$.', '$T_2 = T_1 r^{\\gamma - 1}$、$T_3 = T_4 r^{\\gamma - 1}$ なので $(T_4 - T_1)/(T_3 - T_2) = r^{1 - \\gamma}$ です。'], [`$\\eta = 1 - r^{${n(1 - g, 4)}}$. ${g > 1.5 ? 'A monatomic gas would be far more efficient at the same compression; air with its rotating molecules has $\\gamma = 1.4$.' : g < 1.4 ? 'Hot combustion products have a lower $\\gamma$ than cold air, one reason real efficiencies fall below the air-standard figure.' : 'This is the air-standard value used in the figure.'}`, `$\\eta = 1 - r^{${n(1 - g, 4)}}$ です。${g > 1.5 ? '単原子気体なら同じ圧縮比でずっと効率が高くなります。分子が回転する空気は $\\gamma = 1.4$ です。' : g < 1.4 ? '熱い燃焼ガスの $\\gamma$ は冷たい空気より小さく、実際の効率が空気標準の値を下回る理由の一つです。' : 'これは図で使っている空気標準の値です。'}`]],
        };
      }
      const rc = rcPick(r, 14, 22), cut = Math.round(r.step(1.5, 3.5, 0.25) * 100) / 100, rcO = rcPick(r, 8, 12), eD = etaD(rc, cut), eO = etaO(rcO);
      return {
        q: [`Compare a Diesel at $r = ${n(rc)}$ with cutoff ratio ${n(cut)} against a petrol Otto engine limited by knock to $r = ${n(rcO)}$. By how many percentage points is the ideal Diesel more efficient?`, `$r = ${n(rc)}$、締切比 ${n(cut)} のディーゼルと、ノッキングで $r = ${n(rcO)}$ に制限されたガソリンのオットー機関を比べます。理想的なディーゼルは何ポイント効率が高いですか。`],
        a: { type: 'num', v: 100 * (eD - eO), tol: 0.1, unit: ['points', 'ポイント'] },
        hint: ['Compute both efficiencies; each engine runs at the compression it can actually use.', '両方の効率を計算します。それぞれの機関は実際に使える圧縮比で動きます。'],
        sol: [[`Diesel: $1 - ${n(rc)}^{-0.4} \\times \\dfrac{${n(cut)}^{1.4} - 1}{1.4(${n(cut)} - 1)} = ${n(100 * eD, 2)}\\%$.`, `ディーゼル：$1 - ${n(rc)}^{-0.4} \\times \\dfrac{${n(cut)}^{1.4} - 1}{1.4(${n(cut)} - 1)} = ${n(100 * eD, 2)}\\%$ です。`], [`Otto: $1 - ${n(rcO)}^{-0.4} = ${n(100 * eO, 2)}\\%$; the difference is $${n(100 * (eD - eO), 2)}$ points.`, `オットー：$1 - ${n(rcO)}^{-0.4} = ${n(100 * eO, 2)}\\%$ で、差は $${n(100 * (eD - eO), 2)}$ ポイントです。`], [eD > eO ? 'The Diesel cycle is worse at equal compression but wins because it can compress so much more: it compresses air alone, so there is nothing to knock.' : 'Here the long cutoff throws away the Diesel’s advantage: burning fuel late, at large volume, wastes the high compression.', eD > eO ? 'ディーゼルサイクルは同じ圧縮比では劣りますが、ずっと高く圧縮できるので勝ちます。空気だけを圧縮するので、ノッキングするものがないのです。' : 'ここでは長い締切がディーゼルの利点を失わせています。大きな体積で遅く燃やすと高い圧縮が無駄になります。']],
        set: { rc, cycle: 1, cut },
      };
    },
  ];

  /* ---------------- 3. torque, flywheel, balance ---------------- */
  const LAY = [[1, [0]], [2, [0, 180]], [3, [0, 240, 120]], [4, [0, 180, 180, 0]], [6, [0, 240, 120, 120, 240, 0]]];
  const LN = [['single', '単気筒'], ['inline twin (180°)', '直列 2 気筒（180°）'], ['inline three', '直列 3 気筒'], ['inline four', '直列 4 気筒'], ['inline six', '直列 6 気筒']];
  const phasor = (angles, k, wz) => { const N = angles.length; let re = 0, im = 0; angles.forEach((a, i) => { const z = wz ? i - (N - 1) / 2 : 1; re += z * Math.cos(k * a * DEG); im += z * Math.sin(k * a * DEG); }); return Math.hypot(re, im); };
  Q['engine-balance'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const li = r.int(0, 4), N = LAY[li][0];
        return {
          q: N === 1 ? ['A four-stroke single cylinder fires once per cycle. How many degrees of crank rotation pass between firings?', '四行程の単気筒は一サイクルに一回爆発します。爆発の間のクランク回転角は何度ですか。'] : [`A four-stroke engine with ${N} cylinders fires them at even intervals. How many degrees of crank rotation separate successive firings?`, `${N} 気筒の四行程機関が等間隔に爆発するとします。連続する爆発の間のクランク回転角は何度ですか。`],
          a: { type: 'num', v: 720 / N, tol: 0.01, unit: ['°', '°'] },
          hint: ['A four-stroke cycle takes two revolutions, 720°, and every cylinder fires once in it.', '四行程の一サイクルは二回転、720° で、その間に各気筒が一回ずつ爆発します。'],
          sol: [[`$720^\\circ/${N} = ${n(720 / N)}^\\circ$.`, `$720^\\circ/${N} = ${n(720 / N)}^\\circ$ です。`], [N >= 4 ? 'A power stroke lasts about 180°, so with this many cylinders the strokes overlap and the torque never drops far below zero.' : 'Gaps longer than a power stroke (about 180°) have to be bridged by the flywheel.', N >= 4 ? '爆発行程はおよそ 180° 続くので、この気筒数では行程が重なり、トルクが 0 より大きく下がることはありません。' : '爆発行程（約 180°）より長い隙間はフライホイールで埋めなければなりません。'], ...(li === 1 ? [['The 180° inline twin in the figure cannot fire evenly: its cranks force intervals of 180° and 540°.', '図の 180° 直列 2 気筒は等間隔には爆発できません。クランクの配置により間隔は 180° と 540° になります。']] : [])],
          set: { lay: li },
        };
      }
      const kind = r.int(0, 2);
      const opts = [['inline three', '直列 3 気筒'], ['inline four', '直列 4 気筒'], ['inline six', '直列 6 気筒'], ['none of these', 'どれでもない']];
      const v = kind === 0 ? 1 : kind === 1 ? 0 : 2;
      const qq = [['Which of these inline engines leaves an unbalanced secondary shaking force (at twice crank speed)?', '次の直列機関のうち、二次の揺さぶり力（クランクの二倍の速さ）が釣り合わずに残るのはどれですか。'], ['Which of these inline engines has balanced forces but an unbalanced primary rocking couple?', '次の直列機関のうち、力は釣り合うのに一次の揺れの偶力が残るのはどれですか。'], ['Which of these inline engines is free of primary and secondary forces and couples?', '次の直列機関のうち、一次と二次の力と偶力がすべてないのはどれですか。']][kind];
      return {
        q: qq,
        a: { type: 'choice', opts, v, fixed: true },
        hint: ['Draw each cylinder’s phasor at its crank angle $\\varphi$ (primary) and at $2\\varphi$ (secondary); weight by position along the crank for couples.', '各気筒のフェーザをクランク角 $\\varphi$（一次）と $2\\varphi$（二次）に描きます。偶力では軸に沿った位置で重みを付けます。'],
        sol: [['Four (0°, 180°, 180°, 0°): primary phasors cancel, but at $2\\varphi$ all four point the same way, so the secondary force is four times one cylinder’s.', '4 気筒（0°、180°、180°、0°）では一次のフェーザは打ち消し合いますが、$2\\varphi$ では四本とも同じ向きを指すので、二次の力は一気筒の四倍です。'], ['Three (0°, 240°, 120°): both force stars close, but the end cylinders are not mirrored, so a rocking couple remains. Six: two mirror-image threes, so the couples cancel too.', '3 気筒（0°、240°、120°）では力の星形はどちらも閉じますが、端の気筒が鏡像になっていないので揺れの偶力が残ります。6 気筒は鏡像の 3 気筒二つなので、偶力も打ち消し合います。'], [kind === 0 ? 'Answer: the inline four, which is why larger fours carry twin balance shafts.' : kind === 1 ? 'Answer: the inline three, which is why many carry a balance shaft.' : 'Answer: the inline six, long the benchmark for smoothness.', kind === 0 ? '答えは直列 4 気筒で、だから大きめの 4 気筒は二本のバランスシャフトをもちます。' : kind === 1 ? '答えは直列 3 気筒で、だから多くはバランスシャフトをもちます。' : '答えは直列 6 気筒で、長く滑らかさの基準とされてきました。']],
        set: { lay: kind === 0 ? 3 : kind === 1 ? 2 : 4 },
      };
    },
    (r) => {
      const form = r.int(0, 2), rpm = rpmPick(r, 1000, 7000), w = omega(rpm);
      if (form === 0) {
        const m = r.pick([0.35, 0.4, 0.45, 0.5, 0.6]), F = m * R * w * w;
        return {
          q: [`A single cylinder has a reciprocating mass of ${n(m)} kg and crank radius 43 mm. What is the amplitude of its primary shaking force at ${rpm} rpm, in N?`, `単気筒の往復質量は ${n(m)} kg、クランク半径は 43 mm です。${rpm} rpm での一次の揺さぶり力の振幅は何 N ですか。`],
          a: { type: 'num', v: F, rel: 0.004, unit: ['N', 'N'] },
          hint: ['Primary force $= m r\\omega^2\\cos\\theta$; its amplitude is $m r\\omega^2$.', '一次の力は $m r\\omega^2\\cos\\theta$ で、振幅は $m r\\omega^2$ です。'],
          sol: [[`$\\omega = ${n(w, 2)}$ rad/s.`, `$\\omega = ${n(w, 2)}$ rad/s です。`], [`$F_1 = ${n(m)} \\times 0.043 \\times ${n(w, 2)}^2 = ${n(F, 0)}$ N, alternating along the cylinder axis once per turn. A counterweight can turn half of it into a rotating force, but a single can never cancel it completely.`, `$F_1 = ${n(m)} \\times 0.043 \\times ${n(w, 2)}^2 = ${n(F, 0)}$ N で、一回転に一度、気筒の軸に沿って向きを変えます。釣り合いおもりでその半分を回転する力に変えられますが、単気筒では完全には消せません。`]],
          set: { lay: 0, rpm },
        };
      }
      if (form === 1) {
        const m = r.pick([0.35, 0.4, 0.45, 0.5]), lam = r.pick([0.25, 0.28, 0.3, 0.32]), F = 4 * lam * m * R * w * w;
        return {
          q: [`An inline four has reciprocating mass ${n(m)} kg per cylinder, $r = 43$ mm and $\\lambda = ${n(lam)}$. What is the amplitude of its net secondary shaking force at ${rpm} rpm, in N?`, `直列 4 気筒の一気筒あたりの往復質量は ${n(m)} kg、$r = 43$ mm、$\\lambda = ${n(lam)}$ です。${rpm} rpm での正味の二次の揺さぶり力の振幅は何 N ですか。`],
          a: { type: 'num', v: F, rel: 0.004, unit: ['N', 'N'] },
          hint: ['Each cylinder contributes $\\lambda m r\\omega^2\\cos 2(\\theta + \\varphi)$, and in a flat-plane four all four $2\\varphi$ are multiples of 360°.', '各気筒は $\\lambda m r\\omega^2\\cos 2(\\theta + \\varphi)$ を与え、フラットプレーンの 4 気筒では四つの $2\\varphi$ がすべて 360° の倍数です。'],
          sol: [[`One cylinder: $\\lambda m r\\omega^2 = ${n(lam)} \\times ${n(m)} \\times 0.043 \\times ${n(w, 2)}^2 = ${n(F / 4, 0)}$ N.`, `一気筒では $\\lambda m r\\omega^2 = ${n(lam)} \\times ${n(m)} \\times 0.043 \\times ${n(w, 2)}^2 = ${n(F / 4, 0)}$ N です。`], [`The four add in phase: $${n(F, 0)}$ N, shaking the engine up and down twice per revolution, at ${n(rpm / 30, 1)} Hz.`, `四つが同位相で足されて $${n(F, 0)}$ N となり、一回転に二回、${n(rpm / 30, 1)} Hz でエンジンを上下に揺さぶります。`]],
          set: { lay: 3, rpm },
        };
      }
      const dE = r.pick([150, 200, 286, 350, 500, 788]), I = r.pick([0.08, 0.1, 0.12, 0.15, 0.2]), Cs = dE / (I * w * w);
      return {
        q: [`An engine at ${rpm} rpm must absorb and give back $\\Delta E = ${dE}$ J each cycle through a flywheel of $I = ${n(I)}$ kg·m². What is the coefficient of speed fluctuation $C_s = \\Delta E/(I\\omega^2)$, in percent?`, `${rpm} rpm のエンジンが、一サイクルごとに $\\Delta E = ${dE}$ J を $I = ${n(I)}$ kg·m² のフライホイールで吸収して返します。回転変動率 $C_s = \\Delta E/(I\\omega^2)$ は何パーセントですか。`],
        a: { type: 'num', v: 100 * Cs, rel: 0.005, unit: ['%', '%'] },
        hint: ['$\\Delta E = \\tfrac12 I(\\omega_{\\max}^2 - \\omega_{\\min}^2) \\approx I\\omega^2\\,(\\Delta\\omega/\\omega)$.', '$\\Delta E = \\tfrac12 I(\\omega_{\\max}^2 - \\omega_{\\min}^2) \\approx I\\omega^2\\,(\\Delta\\omega/\\omega)$ です。'],
        sol: [[`$I\\omega^2 = ${n(I)} \\times ${n(w, 2)}^2 = ${n(I * w * w, 0)}$ J.`, `$I\\omega^2 = ${n(I)} \\times ${n(w, 2)}^2 = ${n(I * w * w, 0)}$ J です。`], [`$C_s = ${dE}/${n(I * w * w, 0)} = ${n(100 * Cs, 2)}\\%$: the crankshaft speed swings by that fraction within each cycle. ${Cs > 0.05 ? 'At idle this is felt as roughness; a heavier flywheel or more cylinders would cut it.' : 'Small enough to be smooth; at lower speed the same energy swing would matter more, since $C_s \\propto 1/\\omega^2$.'}`, `$C_s = ${dE}/${n(I * w * w, 0)} = ${n(100 * Cs, 2)}\\%$ で、クランク軸の回転は各サイクルの中でこの割合だけ変動します。${Cs > 0.05 ? 'アイドリングでは荒さとして感じられ、より重いフライホイールか気筒の追加で減らせます。' : '滑らかといえる小ささです。$C_s \\propto 1/\\omega^2$ なので、低回転では同じエネルギー変動がより効いてきます。'}`]],
        set: { rpm },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rpm = rpmPick(r, 1000, 7000), w = omega(rpm), m = r.pick([0.35, 0.4, 0.45, 0.5]), b = r.pick([0.08, 0.085, 0.09, 0.095, 0.1]), M = Math.sqrt(3) * b * m * R * w * w;
        return {
          q: [`An inline three (cranks 0°, 240°, 120°) has cylinders ${n(b * 1000)} mm apart, reciprocating mass ${n(m)} kg and $r = 43$ mm. What is the amplitude of its primary rocking couple at ${rpm} rpm, in N·m?`, `直列 3 気筒（クランク 0°、240°、120°）の気筒間隔は ${n(b * 1000)} mm、往復質量は ${n(m)} kg、$r = 43$ mm です。${rpm} rpm での一次の揺れの偶力の振幅は何 N·m ですか。`],
          a: { type: 'num', v: M, rel: 0.005, unit: ['N·m', 'N·m'] },
          hint: ['Sum $z_i\\,e^{i\\varphi_i}$ with positions $z = -b, 0, +b$ measured from the middle cylinder, then multiply by $m r\\omega^2$.', '中央の気筒から測った位置 $z = -b, 0, +b$ で $z_i\\,e^{i\\varphi_i}$ を足し、$m r\\omega^2$ を掛けます。'],
          sol: [['$-b\\,e^{i0} + 0 + b\\,e^{i120^\\circ} = b(-1.5 + 0.866i)$, of length $\\sqrt{3}\\,b$.', '$-b\\,e^{i0} + 0 + b\\,e^{i120^\\circ} = b(-1.5 + 0.866i)$ で、長さは $\\sqrt{3}\\,b$ です。'], [`$M_1 = \\sqrt3 \\times ${n(b)} \\times ${n(m)} \\times 0.043 \\times ${n(omega(rpm), 2)}^2 = ${n(M, 1)}$ N·m.`, `$M_1 = \\sqrt3 \\times ${n(b)} \\times ${n(m)} \\times 0.043 \\times ${n(omega(rpm), 2)}^2 = ${n(M, 1)}$ N·m です。`], ['The forces cancel, so the engine does not bounce, but it nods end to end once a revolution. A balance shaft turning at crank speed with weights offset along it, working with counterweights on the crank, cancels it.', '力は打ち消し合うのでエンジンは上下には跳ねませんが、一回転に一度、前後にうなずくように揺れます。クランクと同じ速さで回り、軸に沿って重りをずらして付けたバランスシャフトが、クランクの釣り合いおもりと協働してこれを消します。']],
          set: { lay: 2, rpm },
        };
      }
      if (form === 1) {
        const rpm = r.pick([700, 800, 900, 1000]), w = omega(rpm), dE = r.pick([286, 400, 500, 788]), Cs = r.pick([0.02, 0.03, 0.04, 0.05]), I = dE / (Cs * w * w);
        return {
          q: [`At idle, ${rpm} rpm, an engine must store and return $\\Delta E = ${dE}$ J per cycle. What flywheel moment of inertia keeps the speed fluctuation down to ${n(100 * Cs)}%, in kg·m²?`, `アイドリングの ${rpm} rpm で、エンジンは一サイクルごとに $\\Delta E = ${dE}$ J を蓄えて返さなければなりません。回転変動を ${n(100 * Cs)}% に抑えるフライホイールの慣性モーメントは何 kg·m² ですか。`],
          a: { type: 'num', v: I, rel: 0.005, unit: ['kg·m²', 'kg·m²'] },
          hint: ['Invert $C_s = \\Delta E/(I\\omega^2)$.', '$C_s = \\Delta E/(I\\omega^2)$ を逆に解きます。'],
          sol: [[`$\\omega = ${n(w, 2)}$ rad/s, $\\omega^2 = ${n(w * w, 0)}$.`, `$\\omega = ${n(w, 2)}$ rad/s、$\\omega^2 = ${n(w * w, 0)}$ です。`], [`$I = \\Delta E/(C_s\\omega^2) = ${dE}/(${n(Cs)} \\times ${n(w * w, 0)}) = ${n(I, 3)}$ kg·m².`, `$I = \\Delta E/(C_s\\omega^2) = ${dE}/(${n(Cs)} \\times ${n(w * w, 0)}) = ${n(I, 3)}$ kg·m² です。`], ['Idle sets the size because $\\omega^2$ is smallest there; at 6000 rpm the same flywheel would hold the speed many times steadier, but it would also make the engine slow to rev.', '$\\omega^2$ が最も小さいアイドリングが大きさを決めます。6000 rpm では同じフライホイールで回転は何倍も安定しますが、エンジンの吹け上がりは鈍くなります。']],
          set: { rpm: Math.max(1000, rpm) },
        };
      }
      const arr = r.pick([[[0, 90, 270, 180], ['a cross-plane four (0°, 90°, 270°, 180°)', 'クロスプレーンの 4 気筒（0°、90°、270°、180°）']], [[0, 180], ['a 180° twin', '180° の 2 気筒']], [[0, 0], ['a 360° twin (both pistons together)', '360° の 2 気筒（二つのピストンが一緒に動く）']], [[0, 90], ['a 90° twin', '90° の 2 気筒']], [[0, 120, 240], ['an inline three', '直列 3 気筒']], [[0, 180, 180, 0], ['a flat-plane four', 'フラットプレーンの 4 気筒']]]);
      const k = r.int(1, 2), F0 = phasor(arr[0], k, false), F = F0 < 1e-9 ? 0 : F0;
      return {
        q: [`Consider ${arr[1][0]}. In units of one cylinder’s ${k === 1 ? 'primary force $m r\\omega^2$' : 'secondary force $\\lambda m r\\omega^2$'}, what is the amplitude of the net ${k === 1 ? 'primary' : 'secondary'} shaking force?`, `${arr[1][1]}を考えます。一気筒の${k === 1 ? '一次の力 $m r\\omega^2$' : '二次の力 $\\lambda m r\\omega^2$'}を単位として、正味の${k === 1 ? '一次' : '二次'}の揺さぶり力の振幅はいくつですか。`],
        a: { type: 'num', v: F, tol: 0.005 },
        hint: [`Add unit phasors at angles ${k === 1 ? '$\\varphi_i$' : '$2\\varphi_i$'}; the length of the sum is the amplitude.`, `角 ${k === 1 ? '$\\varphi_i$' : '$2\\varphi_i$'} の単位フェーザを足します。和の長さが振幅です。`],
        sol: [[`Angles ${k === 1 ? '$\\varphi_i$' : '$2\\varphi_i$'}: $${arr[0].map((a) => ((k * a) % 360) + '^\\circ').join(',\\ ')}$.`, `角 ${k === 1 ? '$\\varphi_i$' : '$2\\varphi_i$'} は $${arr[0].map((a) => ((k * a) % 360) + '^\\circ').join(',\\ ')}$ です。`], [`$\\Big|\\sum e^{i${k === 1 ? '' : '2'}\\varphi_i}\\Big| = ${n(F, 3)}$. ${F < 1e-9 ? 'The phasors close into a loop, so this order is balanced.' : 'The phasors do not close, so this order shakes the engine; ' + (F > 1.999 ? 'here they add as if the pistons moved together.' : 'a balance shaft at ' + (k === 1 ? 'crank' : 'twice crank') + ' speed could cancel it.')}`, `$\\Big|\\sum e^{i${k === 1 ? '' : '2'}\\varphi_i}\\Big| = ${n(F, 3)}$ です。${F < 1e-9 ? 'フェーザは閉じた輪になるので、この次数は釣り合っています。' : 'フェーザは閉じないので、この次数はエンジンを揺さぶります。' + (F > 1.999 ? 'ここではピストンが一緒に動くかのように足し合わされます。' : (k === 1 ? 'クランクと同じ' : 'クランクの二倍の') + '速さのバランスシャフトで打ち消せます。')}`]],
      };
    },
  ];
})();
