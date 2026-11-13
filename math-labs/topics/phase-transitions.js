'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lg = Math.log10, K0 = 273.15, RG = 8.314462;

  /* ---------------- models (no DOM) ----------------
   * Water. Liquid-vapour line: the Wagner-Pruss saturation equation from the triple point (273.16 K, 611.657 Pa) to the
   *   critical point (647.096 K, 22.064 MPa). Solid-vapour line: Clausius-Clapeyron with a latent heat of sublimation
   *   of 2834 kJ/kg. Solid-liquid line: straight, falling 0.0743 K per MPa.
   * Heating curve of water at one atmosphere: ice 2.09, water 4.186, steam 2.0 kJ/kg K; fusion 334, vaporisation 2257 kJ/kg.
   * Clausius-Clapeyron for a vapour treated as an ideal gas: d ln p / d(1/T) = -L M / R, so two points on the curve give L.
   */
  const TC = 647.096, PC = 22.064e6, TT = 273.16, PT = 611.657, A = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
  const psatK = (Tk) => { const t = 1 - Tk / TC; return PC * Math.exp((TC / Tk) * (A[0] * t + A[1] * t ** 1.5 + A[2] * t ** 3 + A[3] * t ** 3.5 + A[4] * t ** 4 + A[5] * t ** 7.5)); };
  const psat = (tC) => psatK(tC + K0);
  const psub = (tC) => PT * Math.exp(-6140.6 * (1 / (tC + K0) - 1 / TT));
  const tmelt = (p) => TT - K0 - 7.43e-8 * (p - PT);
  function boilingPoint(p) { let lo = 0.01, hi = TC - K0; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (psat(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  function phase(tC, p) { const tk = tC + K0; if (tk >= TC) return p >= PC ? 3 : 2; if (tC < tmelt(p)) return p > psub(Math.min(tC, 0.01)) ? 0 : 2; return p > psat(Math.max(tC, 0.01)) ? 1 : 2; }
  const airPressure = (hM) => 101325 * (1 - 2.25577e-5 * hM) ** 5.25588;
  const CI = 2.09, CW = 4.186, CS = 2.0, LF = 334, LV = 2257;
  function stages(t0) { const out = []; if (t0 < 0) out.push({ k: 'ice', e: CI * -t0 }); out.push({ k: 'melt', e: LF }); out.push({ k: 'water', e: CW * 100 }); out.push({ k: 'boil', e: LV }); out.push({ k: 'steam', e: CS * 50 }); return out; }
  function heatTemp(e, t0) { let t = Math.min(t0, 0); for (const s of stages(t0)) { if (e <= s.e) { if (s.k === 'ice') return t0 + e / CI; if (s.k === 'melt') return 0; if (s.k === 'water') return e / CW; if (s.k === 'boil') return 100; return 100 + e / CS; } e -= s.e; t = 0; } return 150; }
  const totalEnergy = (t0) => stages(t0).reduce((a, s) => a + s.e, 0);
  const FL = [{ en: 'water', ja: '水', M: 18.015, Lbook: 2257, tb: 100, p: psat }, { en: 'ethanol', ja: 'エタノール', M: 46.07, Lbook: 846, tb: 78.37, p: (t) => 133.322 * 10 ** (8.20417 - 1642.89 / (230.3 + t)) }];
  const latentFrom = (t1, t2, pf, Mg) => ((RG * Math.log(pf(t2) / pf(t1))) / (1 / (t1 + K0) - 1 / (t2 + K0)) / Mg);   // kJ/kg, with M in g/mol
  const trouton = (LkJkg, Mg, tbC) => (LkJkg * Mg) / (tbC + K0);                                                    // J/mol K
  const M = { TC, PC, TT, PT, psat, psub, tmelt, boilingPoint, phase, airPressure, stages, heatTemp, totalEnergy, FL, latentFrom, trouton, CI, CW, CS, LF, LV };
  (window.LabModels = window.LabModels || {})['phase-transitions'] = M;
  const PN = [['ice', '氷'], ['liquid water', '液体の水'], ['vapour', '水蒸気'], ['supercritical fluid', '超臨界流体']];
  const pText = (p) => (p < 1000 ? fmt(p, p < 10 ? 2 : 0) + String.raw`\ \mathrm{Pa}` : p < 1e6 ? fmt(p / 1000, p < 1e4 ? 2 : 1) + String.raw`\ \mathrm{kPa}` : fmt(p / 1e6, 2) + String.raw`\ \mathrm{MPa}`);

  /* ================= 1. the phase diagram ================= */
  D['phase-diagram'] = {
    render(ctx, v) {
      const p = 10 ** v.lp, ph = phase(v.t, p), tb = p >= PT && p < PC ? boilingPoint(p) : null;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The phases of water against temperature and pressure, pressure on a logarithmic scale. On each line two phases can exist together. The three lines meet at the triple point, 0.01 °C and 612 Pa, the only condition at which ice, water and vapour all coexist. The line between liquid and vapour simply stops, at the critical point, 374 °C and 22 MPa, beyond which there is no difference between them. Drag the gold point.`, tx`水の相を、温度と圧力に対して描いています。圧力は対数目盛りです。それぞれの線の上では、二つの相が共存できます。3 本の線は、三重点（0.01 °C、612 Pa）で交わります。氷、水、水蒸気がすべて共存する、唯一の条件です。液体と気体の間の線は、臨界点（374 °C、22 MPa）で途切れます。それより先では、両者に違いはありません。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [-60, 420], y: [1, 8.5], aspect: 0.8, maxH: 400, xlabel: T('temperature (°C)', '温度（°C）'), ylabel: T('pressure', '圧力'), ticksY: [[1, '10 Pa'], [2, '100'], [3, '1 kPa'], [4, '10'], [5, '100'], [6, '1 MPa'], [7, '10'], [8, '100']] });
      a.hline(lg(101325), { c: 'muted', dash: '2 4' }); a.line(L.sample(-60, 0.01, 60, (q) => lg(psub(q))), { c: 'c3', w: 2.6 }); a.line(L.sample(0.01, TC - K0, 200, (q) => lg(psat(q))), { c: 'c1', w: 2.8 });
      const ml = []; for (let i = 0; i <= 40; i++) { const lp = lg(PT) + ((8.5 - lg(PT)) * i) / 40; ml.push([tmelt(10 ** lp), lp]); } a.line(ml, { c: 'c2', w: 2.6 });
      a.dot(0.01, lg(PT), { c: 'ink', r: 4 }); a.dot(TC - K0, lg(PC), { c: 'ink', r: 4 }); a.text(-34, 6.6, T('ice', '氷'), { small: true, anchor: 'middle' }); a.text(150, 7.4, T('liquid', '液体'), { small: true, anchor: 'middle' }); a.text(250, 3, T('vapour', '水蒸気'), { small: true, anchor: 'middle' }); a.text(40, lg(PT) - 0.45, T('triple point', '三重点'), { small: true, anchor: 'middle' }); a.text(TC - K0 - 6, lg(PC) + 0.35, T('critical point', '臨界点'), { small: true, anchor: 'middle' });
      a.handle(v.t, v.lp, { c: 'hl', bounds: [-60, 420, 1, 8.5], label: T('state', '状態'), onDrag: (x, y) => { ctx.set('t', clamp(Math.round(x), -60, 420), true); ctx.set('lp', clamp(Math.round(y * 20) / 20, 1, 8.5)); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The temperature at which water boils against height above the sea. Air pressure falls by about 12 per cent for each kilometre climbed, and the boiling point follows it down the liquid-vapour line, about 1 °C for every 300 m. The dot marks the height at which the air has the pressure chosen on the left.`, tx`水が沸騰する温度を、海面からの高さに対して描いています。気圧は、1 km 登るごとに約 12 % 下がり、沸点は、液体と気体の間の線に沿って、300 m ごとに約 1 °C 下がります。点は、空気が、左で選んだ圧力になる高さを示します。`));
      const b = L.fig(c2, { x: [0, 9000], y: [65, 102], aspect: 0.8, maxH: 400, xlabel: T('height above the sea (m)', '海面からの高さ（m）'), ylabel: T('boiling point (°C)', '沸点（°C）') });
      b.line(L.sample(0, 9000, 90, (q) => boilingPoint(airPressure(q))), { c: 'c1', w: 2.8 }); b.vline(8849, { c: 'muted', dash: '4 3' }); b.text(8700, 99, T('Everest', 'エベレスト'), { small: true, anchor: 'end' });
      const hEq = (1 - (p / 101325) ** (1 / 5.25588)) / 2.25577e-5; if (hEq >= 0 && hEq <= 9000 && tb !== null) b.dot(hEq, tb, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('liquid and vapour together', '液体と気体が共存') }, { c: 'c2', label: T('ice and liquid', '氷と液体') }, { c: 'c3', label: T('ice and vapour', '氷と気体') }, { c: 'muted', dash: true, label: T('one atmosphere', '1 気圧') }]);
      ctx.readout([
        { k: T('pressure', '圧力'), v: tx`\(${pText(p)}\)` },
        { k: T('at this temperature and pressure, water is', 'この温度と圧力での水の状態'), v: T(PN[ph][0], PN[ph][1]), tone: 'key' },
        { k: T('boils at this pressure at', 'この圧力での沸点'), v: tb === null ? T(p < PT ? 'no liquid below the triple point' : 'no boiling above the critical point', p < PT ? '三重点より下に液体はない' : '臨界点より上では沸騰しない') : tx`\(${fmt(tb, 1)}\ ^\circ\mathrm{C}\)` },
        { k: T('melts at this pressure at', 'この圧力での融点'), v: p < PT ? T('sublimes instead', '融けずに昇華する') : tx`\(${fmt(tmelt(p), 2)}\ ^\circ\mathrm{C}\)` },
      ], T(p < PT ? 'Below the triple-point pressure liquid water cannot exist. Ice warmed here turns straight to vapour, which is how freeze-drying works and why frost vanishes from a line of washing on a dry winter day.' : ph === 3 ? 'Above both the critical temperature and pressure: a single fluid as dense as a liquid that fills its container like a gas.' : 'Crossing a line costs or releases latent heat at a fixed temperature. Notice that the ice-liquid line leans backward: squeezing ice lowers its melting point, because ice is less dense than water.', p < PT ? '三重点の圧力より下では、液体の水は存在できません。ここで温められた氷は、そのまま水蒸気になります。フリーズドライはこの仕組みを使い、乾いた冬の日に、干した洗濯物から霜が消えるのも、このためです。' : ph === 3 ? '臨界の温度と圧力の両方を超えています。液体のように密度が高く、気体のように容器を満たす、一つの流体です。' : '線を越えるとき、一定の温度で、潜熱を吸収するか放出します。氷と液体の間の線が後ろに傾いていることに注目してください。氷は水より密度が低いので、氷を押すと融点が下がります。'));
    },
  };

  /* ================= 2. the heating curve ================= */
  D['heating-curve'] = {
    render(ctx, v) {
      const tot = totalEnergy(v.t0), E = v.frac * tot, tNow = heatTemp(E, v.t0), st = stages(v.t0), perKg = v.power / v.m;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Temperature of a kilogram of water, starting as ice at \(${fmt(v.t0, 0)}\) °C, against the heat put into it at one atmosphere. On the slopes heat raises the temperature. On the two flat stretches it does not: all of it goes into pulling molecules apart, first out of the crystal and then, at much greater cost, away from one another altogether. Drag the gold point.`, tx`\(${fmt(v.t0, 0)}\) °C の氷から始めた 1 kg の水の温度を、1 気圧で加えた熱に対して描いています。斜面では、熱は温度を上げます。二つの平らな部分では、温度は上がりません。熱はすべて、分子を引き離すのに使われます。まず結晶から、次に、はるかに大きな代償を払って、互いから完全に引き離します。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, tot], y: [Math.min(-45, v.t0 - 5), 160], aspect: 0.7, maxH: 350, xlabel: T('heat added (kJ per kg)', '加えた熱（kJ/kg）'), ylabel: T('temperature (°C)', '温度（°C）') });
      a.hline(0, { c: 'muted', dash: '3 4' }); a.hline(100, { c: 'muted', dash: '3 4' }); const pts = [[0, Math.min(v.t0, 0)]]; let acc = 0; for (const s of st) { acc += s.e; pts.push([acc, heatTemp(acc, v.t0)]); } a.line(pts, { c: 'c2', w: 2.8 });
      a.handle(E, tNow, { c: 'hl', axis: 'x', bounds: [0, tot, -45, 160], label: T('heat added', '加えた熱'), onDrag: (x) => ctx.set('frac', clamp(Math.round((x / tot) * 200) / 200, 0, 1)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Where the heat goes, stage by stage. Boiling the water away takes more than five times the heat needed to bring it from freezing to boiling, and nearly seven times what it took to melt the ice. This is why steam scalds so badly, why sweat cools so well, and why a kettle left on takes so long to boil dry.`, tx`熱がどこへ行くかを、段階ごとに示しています。水を沸騰させて蒸発させるには、凍る温度から沸騰する温度まで上げるのに必要な熱の 5 倍以上、氷を融かすのに必要だった熱の 7 倍近くがかかります。蒸気によるやけどがひどいのも、汗がよく冷やすのも、火にかけたままのやかんが空になるまでに長い時間がかかるのも、このためです。`));
      const names = { ice: T('warm the ice', '氷を温める'), melt: T('melt', '融かす'), water: T('heat the water', '水を温める'), boil: T('boil away', '蒸発させる'), steam: T('heat the steam', '蒸気を温める') }; const short = { ice: T('ice', '氷'), melt: T('melt', '融解'), water: T('water', '水'), boil: T('boil', '沸騰'), steam: T('steam', '蒸気') };
      const b = L.fig(c2, { x: [0.3, st.length + 0.7], y: [0, 2500], aspect: 0.7, maxH: 350, xlabel: T('stage', '段階'), ylabel: T('heat needed (kJ per kg)', '必要な熱（kJ/kg）'), ticksX: st.map((s, i) => [i + 1, short[s.k]]) });
      st.forEach((s, i) => { b.rect(i + 0.65, 0, 0.7, s.e, { c: s.k === 'melt' || s.k === 'boil' ? 'c1' : 'c2', fill: s.k === 'melt' || s.k === 'boil' ? 'c1' : 'c2', opacity: 0.6 }); b.text(i + 1, s.e + 90, fmt(s.e, 0), { small: true, anchor: 'middle' }); });
      L.legend(ctx.host, [{ c: 'c2', label: T('heat that raises the temperature', '温度を上げる熱') }, { c: 'c1', label: T('latent heat: a change of phase', '潜熱：相の変化') }]);
      let e = E, where = ''; for (const s of st) { if (e <= s.e) { where = s.k; break; } e -= s.e; where = s.k; }
      ctx.readout([
        { k: T('heat added so far', 'これまでに加えた熱'), v: tx`\(${fmt(E * v.m, 0)}\ \mathrm{kJ}\)` },
        { k: T('temperature', '温度'), v: tx`\(${fmt(tNow, 1)}\ ^\circ\mathrm{C}\)`, tone: 'key' },
        { k: T('now', '現在の段階'), v: names[where] },
        { k: T('time so far at this power', 'この出力でかかった時間'), v: tx`\(${fmt(E / perKg / 60, 1)}\ \mathrm{min}\)` },
        { k: T('time to melt, to heat, to boil away', '融かす、温める、蒸発させる時間'), v: tx`\(${fmt(LF / perKg / 60, 1)},\ ${fmt((CW * 100) / perKg / 60, 1)},\ ${fmt(LV / perKg / 60, 1)}\ \mathrm{min}\)` },
      ], T('A mixture of two phases is a thermostat: while both are present the temperature cannot move. Ice water holds 0 °C and a boiling pot 100 °C, however fiercely it is heated.', '二つの相が混ざったものは、サーモスタットです。両方がある間、温度は動けません。氷水は 0 °C を、沸騰する鍋は 100 °C を、どれほど強く加熱しても保ちます。'));
    },
  };

  /* ================= 3. Clausius-Clapeyron ================= */
  D['clausius-clapeyron'] = {
    render(ctx, v) {
      const f = FL[v.fluid], t1 = Math.min(v.t1, v.t2 - 5), t2 = v.t2, Lest = latentFrom(t1, t2, f.p, f.M), x = (t) => 1000 / (t + K0), lo = v.fluid ? -20 : 0, hi = v.fluid ? 80 : 200;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Vapour pressure of ${f.en} against temperature. Molecules need energy to escape the liquid, and the share that have enough grows very steeply as the liquid warms, so the pressure of vapour that the liquid can sustain rises roughly exponentially. The liquid boils when that pressure equals the pressure around it (dashed: one atmosphere). Drag the gold points.`, tx`${f.ja}の蒸気圧を、温度に対して描いています。分子が液体から抜け出すには、エネルギーが必要です。十分なエネルギーを持つ分子の割合は、液体が温まるにつれて非常に急に増えるので、液体が保てる蒸気の圧力は、ほぼ指数関数的に上がります。その圧力が周囲の圧力（破線：1 気圧）に等しくなると、液体は沸騰します。金色の点をドラッグしてください。`));
      const pmax = f.p(hi) / 1000, a = L.fig(c1, { x: [lo, hi], y: [0, pmax * 1.05], aspect: 0.7, maxH: 350, xlabel: T('temperature (°C)', '温度（°C）'), ylabel: T('vapour pressure (kPa)', '蒸気圧（kPa）') });
      a.hline(101.325, { c: 'muted', dash: '4 3' }); a.line(L.sample(lo, hi, 200, (q) => f.p(q) / 1000), { c: 'c1', w: 2.8 });
      a.handle(t1, f.p(t1) / 1000, { c: 'hl', axis: 'x', bounds: [lo, hi - 5, 0, pmax], label: T('first point', '1 点目'), onDrag: (q) => ctx.set('t1', clamp(Math.round(q), lo, v.t2 - 5)) }); a.handle(t2, f.p(t2) / 1000, { c: 'hl', axis: 'x', bounds: [lo + 5, hi, 0, pmax], label: T('second point', '2 点目'), onDrag: (q) => ctx.set('t2', clamp(Math.round(q), v.t1 + 5, hi)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The same curve redrawn: the logarithm of the pressure against one over the absolute temperature. It becomes almost a straight line, and its slope is the latent heat of one mole divided by the gas constant. The chord between the two chosen points (red) gives a latent heat of \(${fmt(Lest, 0)}\) kJ/kg, from pressures and temperatures alone.`, tx`同じ曲線を描き直しています。圧力の対数を、絶対温度の逆数に対して描いたものです。曲線はほぼ直線になり、その傾きは、1 モルの潜熱を気体定数で割ったものです。選んだ 2 点を結ぶ弦（赤）から、圧力と温度だけで、潜熱は \(${fmt(Lest, 0)}\) kJ/kg と求まります。`));
      const b = L.fig(c2, { x: [x(hi), x(lo)], y: [Math.log(f.p(lo) / 1000) - 0.2, Math.log(f.p(hi) / 1000) + 0.2], aspect: 0.7, maxH: 350, xlabel: T('1000 over absolute temperature (1/K)', '1000 ÷ 絶対温度（1/K）'), ylabel: T('ln of vapour pressure in kPa', '蒸気圧（kPa）の自然対数') });
      { const pts = []; for (let i = 0; i <= 120; i++) { const q = lo + ((hi - lo) * i) / 120; pts.push([x(q), Math.log(f.p(q) / 1000)]); } b.line(pts, { c: 'c1', w: 2.8 }); }
      b.seg([x(t1), Math.log(f.p(t1) / 1000)], [x(t2), Math.log(f.p(t2) / 1000)], { c: 'c2', w: 2 }); b.dot(x(t1), Math.log(f.p(t1) / 1000), { c: 'hl', r: 6 }); b.dot(x(t2), Math.log(f.p(t2) / 1000), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('vapour pressure', '蒸気圧') }, { c: 'c2', label: T('chord between the points', '2 点を結ぶ弦') }, { c: 'muted', dash: true, label: T('one atmosphere', '1 気圧') }]);
      ctx.readout([
        { k: T('vapour pressure at the two points', '2 点での蒸気圧'), v: tx`\(${fmt(f.p(t1) / 1000, 2)},\ ${fmt(f.p(t2) / 1000, 2)}\ \mathrm{kPa}\)` },
        { k: T('latent heat from the slope', '傾きから求めた潜熱'), v: tx`\(${fmt(Lest, 0)}\ \mathrm{kJ/kg}\)`, tone: 'key' },
        { k: T('measured at the boiling point', '沸点での測定値'), v: tx`\(${fmt(f.Lbook, 0)}\ \mathrm{kJ/kg}\)` },
        { k: T('per mole', '1 モルあたり'), v: tx`\(${fmt((Lest * f.M) / 1000, 1)}\ \mathrm{kJ/mol}\)` },
        { k: T('entropy of boiling, L / T', '沸騰のエントロピー、L / T'), v: tx`\(${fmt(trouton(f.Lbook, f.M, f.tb), 0)}\ \mathrm{J/mol\,K}\)` },
      ], T('The slope is steeper at low temperature: latent heat falls as a liquid warms, and vanishes at the critical point, where liquid and vapour become the same thing.', '傾きは、低い温度のほうが急です。潜熱は、液体が温まるにつれて小さくなり、液体と気体が同じものになる臨界点で、ゼロになります。'));
    },
  };
})();
