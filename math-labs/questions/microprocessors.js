'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const KB = 8.617333262e-5, LN10 = Math.LN10;
  const swing = (Tk, nn) => nn * KB * Tk * LN10 * 1000;
  const SRC = [{ en: 'ArF immersion light (193 nm) through an NA 1.35 lens', ja: 'ArF 液浸光（193 nm）と NA 1.35 のレンズ', l: 193, NA: 1.35 }, { en: 'EUV light (13.5 nm) through an NA 0.33 mirror system', ja: 'EUV 光（13.5 nm）と NA 0.33 のミラー光学系', l: 13.5, NA: 0.33 }, { en: 'EUV light (13.5 nm) through an NA 0.55 mirror system', ja: 'EUV 光（13.5 nm）と NA 0.55 のミラー光学系', l: 13.5, NA: 0.55 }];
  const SIG = [0, 0.5, 0.9];

  /* ---------------- finfet ---------------- */
  Q['finfet'] = [
    (r) => {
      const form = r.int(0, 1), tc = r.step(-40, 125, 5), Tk = tc + 273.15;
      if (form === 0) return {
        q: [`What is the thermal voltage $\\phi_t = k_BT/q$ at $${tc}\\,^{\\circ}\\mathrm{C}$? In mV, one decimal.`, `$${tc}\\,^{\\circ}\\mathrm{C}$ での熱電圧 $\\phi_t = k_BT/q$ はいくらですか。mV で小数第 1 位まで答えてください。`],
        a: { type: 'num', v: KB * Tk * 1000, tol: 0.06, unit: ['mV', 'mV'] },
        hint: ['$k_B/q = 86.17\\,\\mu\\mathrm{V/K}$; use the absolute temperature.', '$k_B/q = 86.17\\,\\mu\\mathrm{V/K}$ です。絶対温度を使います。'],
        sol: [[`$T = ${n(Tk, 2)}$ K.`, `$T = ${n(Tk, 2)}$ K です。`], [`$\\phi_t = 86.17\\,\\mu\\mathrm{V/K} \\times ${n(Tk, 2)}\\,\\mathrm{K} = ${n(KB * Tk * 1000, 2)}$ mV.`, `$\\phi_t = 86.17\\,\\mu\\mathrm{V/K} \\times ${n(Tk, 2)}\\,\\mathrm{K} = ${n(KB * Tk * 1000, 2)}$ mV です。`]],
        set: { temp: tc, vg: 0.2, vd: 0.75 },
      };
      const nn = r.step(1, 1.5, 0.05), S = swing(Tk, nn);
      return {
        q: [`A transistor with slope factor $n = ${n(nn, 2)}$ runs at $${tc}\\,^{\\circ}\\mathrm{C}$. What is its subthreshold swing $S = n\\,\\phi_t \\ln 10$? In mV per decade, one decimal.`, `傾き係数 $n = ${n(nn, 2)}$ のトランジスタが $${tc}\\,^{\\circ}\\mathrm{C}$ で動作しています。サブスレッショルドスイング $S = n\\,\\phi_t \\ln 10$ はいくらですか。mV/桁 で小数第 1 位まで答えてください。`],
        a: { type: 'num', v: S, tol: 0.15, unit: ['mV/dec', 'mV/桁'] },
        hint: ['In weak inversion $I_D \\propto e^{V_G/(n\\phi_t)}$, so one decade takes $n\\phi_t\\ln 10$.', '弱反転では $I_D \\propto e^{V_G/(n\\phi_t)}$ なので、1 桁に $n\\phi_t\\ln 10$ かかります。'],
        sol: [[`$\\phi_t = ${n(KB * Tk * 1000, 3)}$ mV.`, `$\\phi_t = ${n(KB * Tk * 1000, 3)}$ mV です。`], [`$S = ${n(nn, 2)} \\times ${n(KB * Tk * 1000, 3)} \\times 2.3026 = ${n(S, 2)}$ mV/dec. No room-temperature switch can beat about 60 mV/dec.`, `$S = ${n(nn, 2)} \\times ${n(KB * Tk * 1000, 3)} \\times 2.3026 = ${n(S, 2)}$ mV/桁 です。室温のスイッチは約 60 mV/桁 より急にはなりません。`]],
        set: { temp: tc, vg: 0.15, vd: 0.75 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const S = r.step(65, 95, 1), vt = r.step(0.2, 0.45, 0.01), dec = (vt * 1000) / S;
        return {
          q: [`A switch has subthreshold swing $${S}$ mV/dec and threshold $V_T = ${n(vt, 2)}$ V. Lowering the gate from $V_T$ to $0$ cuts the current by how many decades? Two decimals.`, `サブスレッショルドスイング $${S}$ mV/桁、しきい値 $V_T = ${n(vt, 2)}$ V のスイッチがあります。ゲートを $V_T$ から $0$ に下げると、電流は何桁減りますか。小数第 2 位まで答えてください。`],
          a: { type: 'num', v: dec, tol: 0.006, unit: ['decades', '桁'] },
          hint: ['Each $S$ of gate voltage is one decade.', 'ゲート電圧 $S$ ごとに 1 桁です。'],
          sol: [[`$${n(vt * 1000, 0)}\\,\\mathrm{mV} / ${S}\\,\\mathrm{mV} = ${n(dec, 3)}$ decades.`, `$${n(vt * 1000, 0)}\\,\\mathrm{mV} / ${S}\\,\\mathrm{mV} = ${n(dec, 3)}$ 桁です。`], [`So $I_{\\rm off} \\approx I(V_T) \\times 10^{-${n(dec, 2)}}$: a lower threshold buys speed at the price of leakage.`, `したがって $I_{\\rm off} \\approx I(V_T) \\times 10^{-${n(dec, 2)}}$ です。しきい値を下げると速くなる代わりに漏れが増えます。`]],
          set: { vg: vt, vd: 0.75, temp: 27 },
        };
      }
      const eta = r.step(0.03, 0.1, 0.01), vt0 = r.step(0.28, 0.4, 0.01), vd = r.step(0.3, 1, 0.05), vt = vt0 - eta * vd;
      return {
        q: [`With drain-induced barrier lowering, $V_T = V_{T0} - \\eta V_{DS}$. For $V_{T0} = ${n(vt0, 2)}$ V and $\\eta = ${n(eta, 2)}$, what is $V_T$ at $V_{DS} = ${n(vd, 2)}$ V? In V, three decimals.`, `ドレイン誘起障壁低下があると $V_T = V_{T0} - \\eta V_{DS}$ です。$V_{T0} = ${n(vt0, 2)}$ V、$\\eta = ${n(eta, 2)}$ のとき、$V_{DS} = ${n(vd, 2)}$ V での $V_T$ はいくらですか。V で小数第 3 位まで答えてください。`],
        a: { type: 'num', v: vt, tol: 0.0006, unit: ['V', 'V'] },
        hint: ['The drain field pulls the source barrier down.', 'ドレインの電界がソース側の障壁を引き下げます。'],
        sol: [[`$\\eta V_{DS} = ${n(eta * vd, 4)}$ V.`, `$\\eta V_{DS} = ${n(eta * vd, 4)}$ V です。`], [`$V_T = ${n(vt0, 2)} - ${n(eta * vd, 4)} = ${n(vt, 4)}$ V.`, `$V_T = ${n(vt0, 2)} - ${n(eta * vd, 4)} = ${n(vt, 4)}$ V です。`]],
        set: { vd, vg: 0.3, temp: 27 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const t1 = 27, t2 = r.step(60, 125, 5), dvt = (t2 - t1) * 1e-3, S2 = swing(t2 + 273.15, 1.25), S1 = swing(300.15, 1.25);
        const vt = 0.32, dec = (vt * 1000) / S1 - ((vt - dvt) * 1000) / S2;
        return {
          q: [`A chip leaks with $V_T = 0.32$ V and $n = 1.25$ at $27\\,^{\\circ}\\mathrm{C}$. Heated to $${t2}\\,^{\\circ}\\mathrm{C}$, $V_T$ falls by $1$ mV per kelvin and the swing widens with $T$. Estimate the rise in leakage $I(0)$ in decades, using $I(0) \\approx I(V_T)\\,10^{-V_T/S}$. Two decimals.`, `$27\\,^{\\circ}\\mathrm{C}$ で $V_T = 0.32$ V、$n = 1.25$ のチップがあります。$${t2}\\,^{\\circ}\\mathrm{C}$ に加熱すると $V_T$ は 1 K あたり 1 mV 下がり、スイッチングの傾きは $T$ とともに広がります。$I(0) \\approx I(V_T)\\,10^{-V_T/S}$ を使って、漏れ電流 $I(0)$ の増加を桁数で見積もってください。小数第 2 位まで答えてください。`],
          a: { type: 'num', v: dec, tol: 0.01, unit: ['decades', '桁'] },
          hint: ['Compute $V_T/S$ at both temperatures and subtract.', '両方の温度で $V_T/S$ を計算して引きます。'],
          sol: [[`At $27\\,^{\\circ}\\mathrm{C}$: $S = ${n(S1, 2)}$ mV/dec, $V_T/S = ${n((vt * 1000) / S1, 3)}$.`, `$27\\,^{\\circ}\\mathrm{C}$ では $S = ${n(S1, 2)}$ mV/桁、$V_T/S = ${n((vt * 1000) / S1, 3)}$ です。`], [`At $${t2}\\,^{\\circ}\\mathrm{C}$: $V_T = ${n(vt - dvt, 3)}$ V, $S = ${n(S2, 2)}$ mV/dec, $V_T/S = ${n(((vt - dvt) * 1000) / S2, 3)}$. Leakage rises by $${n(dec, 3)}$ decades, a factor of $${n(10 ** dec, 1)}$.`, `$${t2}\\,^{\\circ}\\mathrm{C}$ では $V_T = ${n(vt - dvt, 3)}$ V、$S = ${n(S2, 2)}$ mV/桁、$V_T/S = ${n(((vt - dvt) * 1000) / S2, 3)}$ です。漏れは $${n(dec, 3)}$ 桁、つまり $${n(10 ** dec, 1)}$ 倍に増えます。`]],
          set: { temp: t2, vg: 0, vd: 0.75 },
        };
      }
      const which = r.int(0, 1);
      return {
        q: [which ? 'Why can a FinFET reach a steeper subthreshold swing than a planar transistor of the same length?' : 'Why does a hot chip leak more even with the gate held at $0$ V?', which ? '同じ長さの平面トランジスタより FinFET の方がサブスレッショルドスイングを急にできるのはなぜですか。' : 'ゲートを $0$ V に保っていても、熱いチップの漏れが増えるのはなぜですか。'],
        a: { type: 'choice', v: 0, opts: which ? [['The gate wraps three sides of the fin, so it controls the channel potential better than the drain does ($n$ closer to 1)', 'ゲートがフィンの三面を囲むので、ドレインよりもチャネルの電位をよく制御できる（$n$ が 1 に近い）'], ['The fin is made of a faster semiconductor than silicon', 'フィンがシリコンより速い半導体でできている'], ['The fin runs at a lower temperature', 'フィンの温度が低い']] : [['The threshold drops and the thermal tail of the electron energy distribution gets longer, so more electrons clear the barrier', 'しきい値が下がり、電子のエネルギー分布の熱的な裾が長くなるので、障壁を越える電子が増える'], ['The gate oxide melts', 'ゲート酸化膜が溶ける'], ['The supply voltage rises with temperature', '電源電圧が温度とともに上がる']] },
        hint: [which ? 'Swing is $n\\phi_t\\ln10$; what sets $n$?' : 'Subthreshold current is carriers hopping a barrier of height set by $V_G - V_T$.', which ? 'スイングは $n\\phi_t\\ln10$ です。$n$ を決めるものは何でしょうか。' : 'サブスレッショルド電流は、$V_G - V_T$ で決まる高さの障壁を越えるキャリアです。'],
        sol: [[which ? '$n = 1 + C_{\\rm dep}/C_{\\rm ox}$ measures how much of a gate swing reaches the channel.' : 'The current is $\\propto e^{(V_G - V_T)/(n\\phi_t)}$.', which ? '$n = 1 + C_{\\rm dep}/C_{\\rm ox}$ は、ゲートの振れのうちどれだけがチャネルに届くかを表します。' : '電流は $e^{(V_G - V_T)/(n\\phi_t)}$ に比例します。'], [which ? 'Wrapping the fin raises the gate coupling and shields the drain, so $n$ falls towards 1.' : 'Heat lowers $V_T$ and raises $\\phi_t$; both raise the exponent at $V_G = 0$.', which ? 'フィンを囲むとゲートの結合が強まりドレインを遮るので、$n$ は 1 に近づきます。' : '熱は $V_T$ を下げ $\\phi_t$ を上げます。どちらも $V_G = 0$ での指数を大きくします。']],
        set: { temp: which ? 27 : 100, vg: 0, vd: 0.75 },
      };
    },
  ];

  /* ---------------- cmos-inverter ---------------- */
  Q['cmos-inverter'] = [
    (r) => {
      const a = r.step(0.05, 0.3, 0.05), C = r.step(0.5, 5, 0.5), V = r.step(0.6, 1, 0.05), f = r.step(1, 5, 0.25), Pw = a * C * 1e-9 * V * V * f * 1e9;
      return {
        q: [`A core switches $C = ${n(C, 1)}$ nF of total capacitance with activity factor $\\alpha = ${n(a, 2)}$ at $V_{DD} = ${n(V, 2)}$ V and $f = ${n(f, 2)}$ GHz. What is its dynamic power $\\alpha C V_{DD}^2 f$? In W.`, `あるコアが、全容量 $C = ${n(C, 1)}$ nF を活動率 $\\alpha = ${n(a, 2)}$、$V_{DD} = ${n(V, 2)}$ V、$f = ${n(f, 2)}$ GHz でスイッチしています。動的電力 $\\alpha C V_{DD}^2 f$ はいくらですか。W で答えてください。`],
        a: { type: 'num', v: Pw, rel: 0.003, unit: ['W', 'W'] },
        hint: ['Every charge and discharge of a node dissipates $CV^2$; $\\alpha$ is the fraction switching per cycle.', 'ノードの充電と放電ごとに $CV^2$ が失われます。$\\alpha$ は 1 サイクルあたりスイッチする割合です。'],
        sol: [[`$${n(a, 2)} \\times ${n(C, 1)}\\times10^{-9} \\times ${n(V, 2)}^2 \\times ${n(f, 2)}\\times10^{9}$.`, `$${n(a, 2)} \\times ${n(C, 1)}\\times10^{-9} \\times ${n(V, 2)}^2 \\times ${n(f, 2)}\\times10^{9}$ です。`], [`$P = ${n(Pw, 3)}$ W.`, `$P = ${n(Pw, 3)}$ W です。`]],
        set: { vdd: V, vin: 0.3, beta: 2 },
      };
    },
    (r) => {
      const V1 = r.step(0.8, 1.2, 0.05), V2 = r.step(0.5, 0.75, 0.05), ratio = (V2 / V1) ** 2;
      return {
        q: [`Dropping the supply from $${n(V1, 2)}$ V to $${n(V2, 2)}$ V at the same clock, the dynamic power becomes what fraction of what it was? Three decimals.`, `同じクロックのまま電源を $${n(V1, 2)}$ V から $${n(V2, 2)}$ V に下げると、動的電力は元の何倍になりますか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: ratio, tol: 0.0006 },
        hint: ['$P \\propto V_{DD}^2$.', '$P \\propto V_{DD}^2$ です。'],
        sol: [[`$(${n(V2, 2)}/${n(V1, 2)})^2$.`, `$(${n(V2, 2)}/${n(V1, 2)})^2$ です。`], [`$= ${n(ratio, 4)}$. This square law is why voltage, more than clock, is the lever for power.`, `$= ${n(ratio, 4)}$ です。この二乗則があるので、電力を下げる手段としてはクロックより電圧が効きます。`]],
        set: { vdd: V2, vin: V2 / 2, beta: 2 },
      };
    },
    (r) => {
      const V1 = r.step(0.7, 1, 0.05), V2 = r.step(0.5, 0.65, 0.05), vt = 0.32, a = 1.3, d = (V) => V / (V - vt) ** a, ratio = d(V2) / d(V1);
      return {
        q: [`In the alpha-power law a gate's delay scales as $V_{DD}/(V_{DD} - V_T)^{\\alpha}$. With $V_T = 0.32$ V and $\\alpha = 1.3$, how much slower is a gate at $${n(V2, 2)}$ V than at $${n(V1, 2)}$ V? Three decimals.`, `アルファべき乗則では、ゲートの遅延は $V_{DD}/(V_{DD} - V_T)^{\\alpha}$ に比例します。$V_T = 0.32$ V、$\\alpha = 1.3$ のとき、$${n(V2, 2)}$ V のゲートは $${n(V1, 2)}$ V のときの何倍遅いですか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: ratio, tol: 0.0015 },
        hint: ['Evaluate the expression at both voltages and divide.', '両方の電圧で式を計算して割ります。'],
        sol: [[`At $${n(V1, 2)}$ V: $${n(d(V1), 4)}$; at $${n(V2, 2)}$ V: $${n(d(V2), 4)}$.`, `$${n(V1, 2)}$ V では $${n(d(V1), 4)}$、$${n(V2, 2)}$ V では $${n(d(V2), 4)}$ です。`], [`Ratio $${n(ratio, 4)}$: the gate overdrive $V_{DD} - V_T$ shrinks faster than $V_{DD}$, so near threshold speed collapses.`, `比は $${n(ratio, 4)}$ です。ゲートの駆動 $V_{DD} - V_T$ は $V_{DD}$ より速く縮むので、しきい値近くでは速度が急に落ちます。`]],
        set: { vdd: V2, vin: V2 / 2, beta: 2 },
      };
    },
  ];

  /* ---------------- lithography ---------------- */
  Q['lithography'] = [
    (r) => {
      const si = r.int(0, 2), s = SRC[si], kk = r.step(0.25, 0.6, 0.01), hp = (kk * s.l) / s.NA;
      return {
        q: [`A process prints with ${s.en} at $k_1 = ${n(kk, 2)}$. What half-pitch does the Rayleigh criterion $k_1\\lambda/\\mathrm{NA}$ give? In nm.`, `ある工程が ${s.ja}を使い、$k_1 = ${n(kk, 2)}$ で露光しています。レイリーの基準 $k_1\\lambda/\\mathrm{NA}$ による半ピッチはいくらですか。nm で答えてください。`],
        a: { type: 'num', v: hp, rel: 0.003, unit: ['nm', 'nm'] },
        hint: ['$k_1$ lumps together everything except wavelength and aperture: illumination, mask and resist.', '$k_1$ は波長と開口以外のすべて（照明、マスク、レジスト）をまとめた係数です。'],
        sol: [[`$${n(kk, 2)} \\times ${n(s.l, 1)} / ${n(s.NA, 2)}$.`, `$${n(kk, 2)} \\times ${n(s.l, 1)} / ${n(s.NA, 2)}$ です。`], [`Half-pitch $${n(hp, 2)}$ nm.`, `半ピッチは $${n(hp, 2)}$ nm です。`]],
        set: { src: si, pitch: Math.max(10, Math.min(200, Math.round(2 * hp))), illum: 2 },
      };
    },
    (r) => {
      const si = r.int(0, 2), s = SRC[si], m = r.int(0, 2), pmin = s.l / ((1 + SIG[m]) * s.NA);
      const ill = [['on-axis (coherent) illumination', '軸上（コヒーレント）照明'], ['partially coherent illumination with $\\sigma = 0.5$', '$\\sigma = 0.5$ の部分コヒーレント照明'], ['dipole illumination at $\\sigma = 0.9$', '$\\sigma = 0.9$ の二重極照明']][m];
      return {
        q: [`Using ${s.en} with ${ill[0]}, what is the smallest pitch whose $0$ and $\\pm1$ orders can both enter the lens, $p_{\\min} = \\lambda/((1+\\sigma)\\mathrm{NA})$? In nm.`, `${s.ja}を ${ill[1]}で使うとき、$0$ 次光と $\\pm1$ 次光の両方がレンズに入る最小のピッチ $p_{\\min} = \\lambda/((1+\\sigma)\\mathrm{NA})$ はいくらですか。nm で答えてください。`],
        a: { type: 'num', v: pmin, rel: 0.003, unit: ['nm', 'nm'] },
        hint: ['Order $m$ leaves at $\\sin\\theta = m\\lambda/p + \\sigma\\mathrm{NA}$; tilting the source lets the $-1$ order in from the far side.', '$m$ 次光は $\\sin\\theta = m\\lambda/p + \\sigma\\mathrm{NA}$ の向きに出ます。光源を傾けると、反対側から $-1$ 次光が入れます。'],
        sol: [[`An image needs two orders to interfere. With source tilt $\\sigma\\mathrm{NA}$, orders $0$ and $-1$ fit if $\\lambda/p \\le (1+\\sigma)\\mathrm{NA}$.`, `像を作るには二つの次数が干渉する必要があります。光源の傾き $\\sigma\\mathrm{NA}$ では、$\\lambda/p \\le (1+\\sigma)\\mathrm{NA}$ なら 0 次と $-1$ 次が入ります。`], [`$p_{\\min} = ${n(s.l, 1)}/(${n(1 + SIG[m], 1)} \\times ${n(s.NA, 2)}) = ${n(pmin, 2)}$ nm.`, `$p_{\\min} = ${n(s.l, 1)}/(${n(1 + SIG[m], 1)} \\times ${n(s.NA, 2)}) = ${n(pmin, 2)}$ nm です。`]],
        set: { src: si, pitch: Math.max(10, Math.min(200, Math.ceil(pmin) + 1)), illum: m },
      };
    },
    (r) => {
      const form = r.int(0, 1), si = r.int(0, 2), s = SRC[si];
      if (form === 0) {
        let p, M; do { p = r.step(s.l < 50 ? 15 : 160, s.l < 50 ? 120 : 1000, s.l < 50 ? 1 : 10); M = (p * s.NA) / s.l; } while (Math.abs(M - Math.round(M)) < 0.03);
        const k = 2 * Math.floor(M) + 1;
        return {
          q: [`A grating of pitch $${p}$ nm is lit on axis with ${s.en}. How many diffraction orders (including the zero order) enter the pupil?`, `ピッチ $${p}$ nm の格子を ${s.ja}で軸上から照明します。瞳に入る回折次数は（0 次を含めて）いくつですか。`],
          a: { type: 'int', v: k },
          hint: ['Order $m$ passes when $|m|\\lambda/p \\le \\mathrm{NA}$.', '$|m|\\lambda/p \\le \\mathrm{NA}$ のとき $m$ 次光が通ります。'],
          sol: [[`$p\\,\\mathrm{NA}/\\lambda = ${n(M, 3)}$, so $|m| \\le ${Math.floor(M)}$.`, `$p\\,\\mathrm{NA}/\\lambda = ${n(M, 3)}$ なので $|m| \\le ${Math.floor(M)}$ です。`], [`$2 \\times ${Math.floor(M)} + 1 = ${k}$ orders. (For equal lines and spaces the even orders carry no light, but they still fit.)`, `$2 \\times ${Math.floor(M)} + 1 = ${k}$ 個です。（線と間隔が等しい格子では偶数次の光はゼロですが、瞳には入ります。）`]],
          set: { src: si, pitch: Math.min(200, p), illum: 0 },
        };
      }
      const hp = s.l < 50 ? r.step(8, 20, 1) : r.step(36, 60, 1), kk = (hp * s.NA) / s.l;
      return {
        q: [`What $k_1$ factor does printing a $${hp}$ nm half-pitch with ${s.en} demand? Three decimals.`, `${s.ja}で半ピッチ $${hp}$ nm を露光するには、どれだけの $k_1$ が必要ですか。小数第 3 位まで答えてください。`],
        a: { type: 'num', v: kk, tol: 0.0006 },
        hint: ['$k_1 = \\text{half-pitch}\\times\\mathrm{NA}/\\lambda$; $0.25$ is the hard floor for a single exposure.', '$k_1 = \\text{半ピッチ}\\times\\mathrm{NA}/\\lambda$ です。1 回露光の限界は 0.25 です。'],
        sol: [[`$${hp} \\times ${n(s.NA, 2)} / ${n(s.l, 1)}$.`, `$${hp} \\times ${n(s.NA, 2)} / ${n(s.l, 1)}$ です。`], [`$k_1 = ${n(kk, 4)}$${kk < 0.25 ? ': below 0.25, so one exposure cannot print it and the pattern must be split across several' : ''}.`, `$k_1 = ${n(kk, 4)}$ です${kk < 0.25 ? '。0.25 未満なので 1 回の露光では描けず、パターンを複数回に分ける必要があります' : ''}。`]],
        set: { src: si, pitch: Math.max(10, Math.min(200, 2 * hp)), illum: 2 },
      };
    },
  ];
})();
