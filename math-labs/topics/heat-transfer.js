'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), SIG = 5.670374e-8, K0 = 273.15;

  /* ---------------- models (no DOM) ----------------
   * Conduction through layers in series, per square metre: each layer resists with d / k, each surface film with 1 / h.
   *   q = (T_in - T_out) / R_total, and the temperature falls across each resistance in proportion to it.
   * Lumped cooling: a body of heat capacity C losing h A (T - T_a) follows T = T_a + (T_0 - T_a) exp(-t / tau), tau = C / (h A).
   *   The cup is a cylinder as tall as it is wide, all of its surface losing heat.
   * Radiation: a surface of emissivity e at absolute temperature T in surroundings at T_a loses e sigma A (T^4 - T_a^4);
   *   its spectrum is Planck's, peaking at 2898 / T micrometres.
   */
  const KB = 0.7, KI = 0.035, HI = 8, HO = 25;
  function wall(brickMm, insMm, tin, tout) {
    const parts = [{ name: 'in', R: 1 / HI, d: 0 }, { name: 'ins', R: insMm / 1000 / KI, d: insMm }, { name: 'brick', R: brickMm / 1000 / KB, d: brickMm }, { name: 'out', R: 1 / HO, d: 0 }];
    const R = parts.reduce((s, q) => s + q.R, 0), flux = (tin - tout) / R, temps = [tin]; for (const q of parts) temps.push(temps[temps.length - 1] - flux * q.R);
    return { parts, R, U: 1 / R, flux, temps };
  }
  const cupDiameter = (volMl) => Math.cbrt((4 * volMl * 1e-6) / PI);
  const cupArea = (volMl) => 1.5 * PI * cupDiameter(volMl) ** 2;
  const timeConstant = (volMl, h) => (1000 * 4186 * volMl * 1e-6) / (h * cupArea(volMl));
  const coolTemp = (t, t0, ta, tau) => ta + (t0 - ta) * Math.exp(-t / tau);
  const timeTo = (target, t0, ta, tau) => tau * Math.log((t0 - ta) / (target - ta));
  const radiated = (tC, taC, eps, area) => eps * SIG * area * ((tC + K0) ** 4 - (taC + K0) ** 4);
  const convected = (tC, taC, h, area) => h * area * (tC - taC);
  const wienPeak = (tC) => 2897.77 / (tC + K0);
  const planck = (lamUm, tC) => { const x = 14387.77 / (lamUm * (tC + K0)); return 1 / (lamUm ** 5 * Math.expm1(x)); };
  const radCoeff = (tC, taC, eps) => (tC === taC ? 4 * eps * SIG * (tC + K0) ** 3 : (eps * SIG * ((tC + K0) ** 4 - (taC + K0) ** 4)) / (tC - taC));
  const M = { SIG, KB, KI, HI, HO, wall, cupDiameter, cupArea, timeConstant, coolTemp, timeTo, radiated, convected, wienPeak, planck, radCoeff };
  (window.LabModels = window.LabModels || {})['heat-transfer'] = M;

  /* ================= 1. conduction through a wall ================= */
  D['wall-conduction'] = {
    render(ctx, v) {
      const w = wall(v.brick, v.ins, v.tin, v.tout), bare = wall(v.brick, 0, v.tin, v.tout), tot = v.ins + v.brick, pad = tot * 0.16;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Temperature through a brick wall lined on the inside with mineral wool, from a room at \(${fmt(v.tin, 0)}\) °C to air outside at \(${fmt(v.tout, 0)}\) °C. Heat flows through each layer at the same rate, so the temperature falls steeply where conduction is poor and gently where it is good. The small steps at the two faces are the thin films of still air clinging to them.`, tx`内側にミネラルウールを張ったれんがの壁の中の温度を、\(${fmt(v.tin, 0)}\) °C の部屋から \(${fmt(v.tout, 0)}\) °C の外気まで描いています。熱は、どの層も同じ割合で流れるので、温度は、伝導の悪いところでは急に、良いところでは緩やかに下がります。両面にある小さな段差は、面に付着した、動かない空気の薄い膜によるものです。`));
      const lo = Math.min(v.tout, v.tin) - 3, hi = Math.max(v.tout, v.tin) + 3, a = L.fig(c1, { x: [-pad, tot + pad], y: [lo, hi], aspect: 0.7, maxH: 350, xlabel: T('distance from the inner face (mm)', '内側の面からの距離（mm）'), ylabel: T('temperature (°C)', '温度（°C）') });
      if (v.ins > 0) a.rect(0, lo, v.ins, hi - lo, { c: 'c4', fill: 'c4', opacity: 0.16, w: 0 }); a.rect(v.ins, lo, v.brick, hi - lo, { c: 'c2', fill: 'c2', opacity: 0.16, w: 0 });
      a.line([[-pad, w.temps[0]], [-pad * 0.25, w.temps[0]], [0, w.temps[1]], [v.ins, w.temps[2]], [tot, w.temps[3]], [tot + pad * 0.25, w.temps[4]], [tot + pad, w.temps[4]]], { c: 'c1', w: 2.8 });
      if (v.ins > 0) a.text(v.ins / 2, hi - (hi - lo) * 0.08, T('wool', 'ウール'), { small: true, anchor: 'middle' }); a.text(v.ins + v.brick / 2, hi - (hi - lo) * 0.08, T('brick', 'れんが'), { small: true, anchor: 'middle' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Heat lost through each square metre against the thickness of wool. The first few centimetres do most of the good: resistances in series add, so the loss falls as one over their sum, and each extra layer matters less than the one before. Drag the gold point.`, tx`1 平方メートルあたりの熱の損失を、ウールの厚さに対して描いています。最初の数センチメートルが、効果の大部分を担います。直列の抵抗は足し合わされるので、損失はその和に反比例して下がり、追加した層の効果は、前の層より小さくなります。金色の点をドラッグしてください。`));
      const top = Math.max(10, bare.flux * 1.1), b = L.fig(c2, { x: [0, 200], y: [0, top], aspect: 0.7, maxH: 350, xlabel: T('thickness of mineral wool (mm)', 'ミネラルウールの厚さ（mm）'), ylabel: T('heat lost (W per m²)', '熱の損失（W/m²）') });
      b.line(L.sample(0, 200, 100, (q) => wall(v.brick, q, v.tin, v.tout).flux), { c: 'c2', w: 2.8 });
      b.handle(v.ins, w.flux, { c: 'hl', axis: 'x', bounds: [0, 200, 0, top], label: T('wool', 'ウール'), onDrag: (x) => ctx.set('ins', clamp(Math.round(x / 5) * 5, 0, 200)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('temperature', '温度') }, { c: 'c4', label: T('mineral wool', 'ミネラルウール') }, { c: 'c2', label: T('brick; heat lost', 'れんが、熱の損失') }]);
      ctx.readout([
        { k: T('resistance of wool, brick, air films', 'ウール、れんが、空気の膜の抵抗'), v: tx`\(${fmt(w.parts[1].R, 2)},\ ${fmt(w.parts[2].R, 2)},\ ${fmt(w.parts[0].R + w.parts[3].R, 2)}\ \mathrm{m^2K/W}\)` },
        { k: T('heat lost per square metre', '1 平方メートルあたりの熱の損失'), v: tx`\(${fmt(w.flux, 1)}\ \mathrm{W}\)`, tone: 'key' },
        { k: T('U-value', '熱貫流率'), v: tx`\(${fmt(w.U, 2)}\ \mathrm{W/m^2K}\)` },
        { k: T('inner face of the wall', '壁の内側の面'), v: tx`\(${fmt(w.temps[1], 1)}\ ^\circ\mathrm{C}\)` },
        { k: T('compared with bare brick', 'れんがだけの場合との比'), v: tx`\(${fmt((w.flux / bare.flux) * 100, 0)}\,\%\)` },
      ], T(v.ins === 0 ? 'Bare brick. Its inner face is several degrees colder than the room, which is why an uninsulated wall feels cold to sit beside even when the air is warm.' : 'Most of the temperature drop now happens inside the wool. The brick is nearly as cold as the outdoors and the inner face nearly as warm as the room.', v.ins === 0 ? 'れんがだけの壁です。内側の面は部屋より数度低く、断熱のない壁のそばに座ると、空気が暖かくても寒く感じるのはこのためです。' : '温度の低下の大部分が、ウールの中で起こるようになりました。れんがは外気とほぼ同じくらい冷たく、内側の面は部屋とほぼ同じくらい暖かくなっています。'));
    },
  };

  /* ================= 2. a cooling cup ================= */
  D['newton-cooling'] = {
    render(ctx, v) {
      const tau = timeConstant(v.vol, v.h), ta = 20, drink = 60, tDrink = v.t0 > drink ? timeTo(drink, v.t0, ta, tau) : 0, span = Math.max(30, Math.ceil((3 * tau) / 600) * 10);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A cup holding \(${fmt(v.vol, 0)}\) ml of tea in a room at 20 °C. It loses heat at a rate proportional to how much hotter it is than the room, so it cools fast at first and ever more slowly, never quite arriving. In each stretch of \(${fmt(tau / 60, 0)}\) minutes the excess temperature falls to 37 per cent of what it was. The grey curve is a cup of twice the volume.`, tx`20 °C の部屋にある、\(${fmt(v.vol, 0)}\) ml の紅茶が入ったカップです。カップは、部屋よりどれだけ熱いかに比例する割合で熱を失うので、最初は速く、その後はしだいに遅く冷え、室温に完全には届きません。\(${fmt(tau / 60, 0)}\) 分ごとに、室温との差は、それまでの 37 % に下がります。灰色の曲線は、体積が 2 倍のカップです。`));
      const a = L.fig(c1, { x: [0, span], y: [0, 100], aspect: 0.7, maxH: 350, xlabel: T('time (minutes)', '時間（分）'), ylabel: T('temperature (°C)', '温度（°C）') });
      a.hline(ta, { c: 'muted', dash: '4 3' }); a.hline(drink, { c: 'c3', dash: '2 4' }); a.line(L.sample(0, span, 200, (t) => coolTemp(t * 60, v.t0, ta, timeConstant(2 * v.vol, v.h))), { c: 'muted', w: 1.4 }); a.line(L.sample(0, span, 200, (t) => coolTemp(t * 60, v.t0, ta, tau)), { c: 'c1', w: 2.8 });
      if (tDrink > 0 && tDrink / 60 < span) a.dot(tDrink / 60, drink, { c: 'hl', r: 6 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The time constant against how readily the surface sheds heat. Still air takes about 10 W from each square metre for each degree; a breeze or blowing across the top takes several times that. Size matters too: heat is stored in the volume and lost through the surface, so a body twice as large in every direction takes twice as long. Drag the gold point.`, tx`時定数を、表面からの熱の逃げやすさに対して描いています。静かな空気は、1 平方メートル、1 度あたり約 10 W を奪います。そよ風や、上から吹きかける息は、その数倍を奪います。大きさも関係します。熱は体積に蓄えられ、表面から失われるので、すべての方向に 2 倍大きい物体は、2 倍の時間がかかります。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [5, 100], y: [0, 120], aspect: 0.7, maxH: 350, xlabel: T('heat shed per m² per degree (W)', '1 m²、1 度あたりの放熱（W）'), ylabel: T('time constant (minutes)', '時定数（分）') });
      b.line(L.sample(5, 100, 120, (q) => Math.min(120, timeConstant(v.vol, q) / 60)), { c: 'c2', w: 2.8 });
      b.handle(v.h, Math.min(120, tau / 60), { c: 'hl', axis: 'x', bounds: [5, 100, 0, 120], label: T('heat shed', '放熱'), onDrag: (x) => ctx.set('h', clamp(Math.round(x), 5, 100)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('this cup', 'このカップ') }, { c: 'muted', label: T('twice the volume', '体積が 2 倍') }, { c: 'c3', dash: true, label: T('cool enough to drink', '飲める温度') }, { c: 'c2', label: T('time constant', '時定数') }]);
      ctx.readout([
        { k: T('surface of the cup', 'カップの表面積'), v: tx`\(${fmt(cupArea(v.vol) * 1e4, 0)}\ \mathrm{cm^2}\)` },
        { k: T('losing at the start', '最初の熱の損失'), v: tx`\(${fmt(v.h * cupArea(v.vol) * (v.t0 - ta), 0)}\ \mathrm{W}\)` },
        { k: T('time constant', '時定数'), v: tx`\(${fmt(tau / 60, 1)}\ \mathrm{min}\)`, tone: 'key' },
        { k: T('reaches 60 °C after', '60 °C になるまで'), v: tx`\(${fmt(tDrink / 60, 1)}\ \mathrm{min}\)` },
        { k: T('after 10 minutes', '10 分後'), v: tx`\(${fmt(coolTemp(600, v.t0, ta, tau), 1)}\ ^\circ\mathrm{C}\)` },
      ], T('One number, the time constant, describes the whole curve. The same exponential governs a capacitor discharging through a resistor, and for the same reason: the flow out is proportional to what remains.', '時定数という一つの数が、曲線全体を表します。同じ指数関数が、抵抗を通して放電するコンデンサーも支配します。理由も同じで、流れ出る量が、残っている量に比例するからです。'));
    },
  };

  /* ================= 3. radiation ================= */
  D['thermal-radiation'] = {
    render(ctx, v) {
      const ta = 20, A = 0.1, h = 10, Pr = radiated(v.temp, ta, v.eps, A), Pc = convected(v.temp, ta, h, A), pk = wienPeak(v.temp), lg = Math.log10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Heat leaving a surface of 0.1 m², about the two faces of a brake disc, in a room at 20 °C, against its temperature. Still air carries heat away in proportion to the temperature difference (blue). Radiation grows as the fourth power of absolute temperature (red), so it is the lesser partner near room temperature and takes over completely once things glow. Drag the gold point.`, tx`20 °C の部屋にある、ブレーキディスクの両面ほどの 0.1 m² の面から出ていく熱を、面の温度に対して描いています。静かな空気は、温度差に比例して熱を運び去ります（青）。放射は、絶対温度の 4 乗に比例して大きくなります（赤）。そのため、室温の近くでは小さいほうの相手ですが、ものが光り始めると、完全に主役になります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [20, 1200], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('surface temperature (°C)', '面の温度（°C）'), ylabel: T('heat leaving (W)', '出ていく熱（W）'), ticksY: [[0, '1'], [1, '10'], [2, '100'], [3, '1 k'], [4, '10 k']] });
      a.line(L.sample(22, 1200, 200, (q) => clamp(lg(convected(q, ta, h, A)), 0, 4)), { c: 'c1', w: 2.4 }); a.line(L.sample(22, 1200, 200, (q) => clamp(lg(radiated(q, ta, v.eps, A)), 0, 4)), { c: 'c2', w: 2.8 });
      a.handle(v.temp, clamp(lg(Pr), 0, 4), { c: 'hl', axis: 'x', bounds: [30, 1200, 0, 4], label: T('temperature', '温度'), onDrag: (x) => ctx.set('temp', clamp(Math.round(x / 10) * 10, 30, 1200)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The spectrum of that radiation, scaled to its own peak. The band is the light the eye can see. A warm surface radiates far in the infrared; as it heats, the peak moves toward shorter waves in inverse proportion to absolute temperature, and the tail of the curve creeps into the red end of the visible. That is why hot metal glows first dull red, then orange, then yellow.`, tx`その放射のスペクトルを、それ自身のピークを 1 として描いています。帯は、目に見える光です。温かい面は、遠い赤外線を放射します。熱くなるにつれて、ピークは、絶対温度に反比例して短い波長へ移り、曲線の裾が、可視光の赤い端に入り込みます。熱した金属が、まず暗い赤、次にオレンジ、次に黄色に光るのは、このためです。`));
      const pm = planck(pk, v.temp), b = L.fig(c2, { x: [0, 12], y: [0, 1.08], aspect: 0.7, maxH: 350, xlabel: T('wavelength (micrometres)', '波長（マイクロメートル）'), ylabel: T('brightness (peak = 1)', '明るさ（ピーク = 1）') });
      b.rect(0.38, 0, 0.37, 1.08, { c: 'c4', fill: 'c4', opacity: 0.3, w: 0 }); b.line(L.sample(0.15, 12, 400, (q) => planck(q, v.temp) / pm), { c: 'c2', w: 2.8 }); b.vline(Math.min(12, pk), { c: 'muted', dash: '4 3' });
      const vis = (() => { let s = 0, t = 0; for (let i = 0; i < 4000; i++) { const lam = 0.1 + (i + 0.5) * 0.025, p = planck(lam, v.temp); t += p; if (lam > 0.38 && lam < 0.75) s += p; } return s / t; })();
      L.legend(ctx.host, [{ c: 'c2', label: T('radiation', '放射') }, { c: 'c1', label: T('carried off by still air', '静かな空気が運び去る熱') }, { c: 'c4', label: T('visible light', '可視光') }, { c: 'muted', dash: true, label: T('peak', 'ピーク') }]);
      ctx.readout([
        { k: T('radiated', '放射'), v: tx`\(${fmt(Pr, Pr < 100 ? 1 : 0)}\ \mathrm{W}\)`, tone: 'key' },
        { k: T('carried off by still air', '静かな空気が運び去る熱'), v: tx`\(${fmt(Pc, Pc < 100 ? 1 : 0)}\ \mathrm{W}\)` },
        { k: T('radiation, as a share of both', '両方のうち、放射の割合'), v: tx`\(${fmt((Pr / (Pr + Pc)) * 100, 0)}\,\%\)` },
        { k: T('peak wavelength', 'ピークの波長'), v: tx`\(${fmt(pk, 2)}\ \mathrm{\mu m}\)` },
        { k: T('share that is visible light', '可視光の割合'), v: tx`\(${vis < 1e-4 ? String.raw`<0.01` : fmt(vis * 100, vis < 0.01 ? 2 : 1)}\,\%\)` },
      ], T(v.temp < 500 ? 'Too cool to see. Everything here is infrared, felt on the skin as warmth.' : v.temp < 800 ? 'The far tail of the curve has reached the red: in a dim room this surface shows a dull red glow, although almost none of its radiation is visible.' : 'Bright orange. Radiation now carries off several times what the air does, which is how a brake disc survives a long descent.', v.temp < 500 ? '見えるほど熱くありません。ここにあるのはすべて赤外線で、肌には暖かさとして感じられます。' : v.temp < 800 ? '曲線の裾の先が、赤に届きました。放射のうち目に見えるのはほとんどありませんが、薄暗い部屋では、この面は暗い赤に光って見えます。' : '明るいオレンジ色です。放射は、空気が運び去る熱の数倍を運ぶようになりました。ブレーキディスクが長い下り坂に耐えられるのは、このためです。'));
    },
  };
})();
