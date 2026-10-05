'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/semiconductor-physics.cjs); silicon, energies in eV, densities in cm^-3 ---------- */
  const KB = 8.617333262e-5, Q = 1.602176634e-19, EPS = 11.7 * 8.8541878128e-14; // eV/K, C, F/cm
  const EG0 = 1.17, ALPHA = 4.73e-4, BETA = 636; // Varshni (Thurmond)
  const Eg = (T) => EG0 - (ALPHA * T * T) / (T + BETA);
  const dEgdT = (T) => (-ALPHA * T * (T + 2 * BETA)) / (T + BETA) ** 2;
  const Nc = (T) => 2.86e19 * Math.pow(T / 300, 1.5), Nv = (T) => 3.10e19 * Math.pow(T / 300, 1.5); // Green (1990)
  const ni = (T) => Math.sqrt(Nc(T) * Nv(T)) * Math.exp(-Eg(T) / (2 * KB * T));
  const ED = 0.045, EA = 0.045; // phosphorus below Ec, boron above Ev
  // Boltzmann carrier densities with Ev = 0, Ec = Eg
  const nOf = (EF, T) => Nc(T) * Math.exp((EF - Eg(T)) / (KB * T));
  const pOf = (EF, T) => Nv(T) * Math.exp(-EF / (KB * T));
  const ndPlus = (EF, T, Nd) => Nd / (1 + 2 * Math.exp((EF - (Eg(T) - ED)) / (KB * T)));
  const naMinus = (EF, T, Na) => Na / (1 + 4 * Math.exp((EA - EF) / (KB * T)));
  // charge neutrality p + Nd+ = n + Na-, solved for EF by bisection (the net charge falls monotonically with EF)
  function fermiLevel(T, Nd, Na) { let lo = -0.4, hi = Eg(T) + 0.4; const f = (E) => pOf(E, T) + ndPlus(E, T, Nd) - nOf(E, T) - naMinus(E, T, Na);
    for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  function carriers(T, Nd, Na) { const EF = fermiLevel(T, Nd, Na); return { EF, n: nOf(EF, T), p: pOf(EF, T), ion: Nd ? ndPlus(EF, T, Nd) / Nd : naMinus(EF, T, Na) / Na }; }
  const fermi = (E, EF, T) => 1 / (1 + Math.exp((E - EF) / (KB * T)));

  // abrupt p-n junction (depletion approximation), x in cm, V forward bias
  function junction(Na, Nd, V, T = 300) {
    const Vt = KB * T, Vbi = Vt * Math.log((Na * Nd) / ni(T) ** 2), Vj = Math.max(Vbi - V, 1e-4);
    const W = Math.sqrt(((2 * EPS * Vj) / Q) * (1 / Na + 1 / Nd)), xn = (W * Na) / (Na + Nd), xp = (W * Nd) / (Na + Nd);
    const Emax = (Q * Nd * xn) / EPS; // V/cm
    // electrostatic potential energy of an electron relative to the far n side, in eV
    const U = (x) => (x >= xn ? 0 : x >= 0 ? ((Q * Nd) / (2 * EPS)) * (xn - x) ** 2 : x >= -xp ? Vj - ((Q * Na) / (2 * EPS)) * (x + xp) ** 2 : Vj);
    const field = (x) => (x <= -xp || x >= xn ? 0 : x < 0 ? (Q * Na * (x + xp)) / EPS : (Q * Nd * (xn - x)) / EPS);
    return { Vbi, Vj, W, xn, xp, Emax, U, field, C: EPS / W, EcN: Vt * Math.log(Nc(T) / Nd), EvP: Vt * Math.log(Nv(T) / Na) };
  }

  // diode: I = Is (exp(V / n Vt) - 1) - Iph, with Is proportional to ni^2 ~ T^3 exp(-Eg/kT)
  const IS300 = 1e-12;
  const Is = (T) => IS300 * Math.pow(T / 300, 3) * Math.exp(Eg(300) / (KB * 300) - Eg(T) / (KB * T));
  const diodeI = (V, T, nid, Iph) => Is(T) * Math.expm1(V / (nid * KB * T)) - Iph;
  const vAtCurrent = (I, T, nid) => nid * KB * T * Math.log1p(I / Is(T));
  const voc = (T, nid, Iph) => nid * KB * T * Math.log1p(Iph / Is(T));
  function maxPower(T, nid, Iph) { const Vo = voc(T, nid, Iph); let best = { P: 0, V: 0, I: 0 }; let lo = 0, hi = Vo; for (let k = 0; k < 100; k++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3, Pa = -a * diodeI(a, T, nid, Iph), Pb = -b * diodeI(b, T, nid, Iph); if (Pa < Pb) lo = a; else hi = b; } const Vm = (lo + hi) / 2; best = { V: Vm, I: -diodeI(Vm, T, nid, Iph), P: -Vm * diodeI(Vm, T, nid, Iph) }; return best; }

  (window.LabModels = window.LabModels || {})['semiconductor-physics'] = { KB, Q, EPS, Eg, dEgdT, Nc, Nv, ni, nOf, pOf, ndPlus, naMinus, fermiLevel, carriers, fermi, junction, Is, diodeI, vAtCurrent, voc, maxPower };

  if (!L.fig) return; // model-only load (checks)
  const T_ = L.T, fmt = L.fmt;
  const T = (a, b) => T_(a, b);
  const sci = (x) => { if (!(x > 0)) return '0'; const e = Math.floor(Math.log10(x)), m = x / 10 ** e; const sup = String(e).replace('-', '⁻').split('').map((c) => ('⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] ?? c)).join(''); return `${fmt(m, 3)}×10${sup}`; };
  const supE = (e) => String(e).replace('-', '⁻').split('').map((c) => ('⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] ?? c)).join('');

  /* ---------- 1. carrier statistics ---------- */
  const TS = L.seq(157, (i) => 20 + i * 5);
  D['carrier-statistics'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, ptype = v.type === 1, dop = Math.pow(10, v.ldop), Nd = ptype ? 0 : dop, Na = ptype ? dop : 0, Tsel = v.T;
      const key = `${v.type}|${v.ldop}`;
      if (st.key !== key) { st.curve = TS.map((t) => { const c = carriers(t, Nd, Na); return [t, Math.log10(ptype ? c.p : c.n)]; }); st.key = key; }
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Energy against occupation on a log scale: the Fermi–Dirac function f(E) for electrons and 1 − f for holes. Where each curve meets its band edge it reads off n/N꜀ or p/Nᵥ directly.', '対数目盛の占有率に対するエネルギーです。電子のフェルミ・ディラック関数 f(E) と正孔の 1 − f を示します。各曲線がバンド端と交わる値が、そのまま n/N꜀ または p/Nᵥ を与えます。'));
      const f = L.fig(c1, { x: [-26, 0.8], y: [-0.25, 1.45], aspect: 1.05, xlabel: T('log₁₀ occupation', 'log₁₀ 占有率'), ylabel: T('energy E, eV', 'エネルギー E、eV'), maxH: 440 });
      const bands = f.group('under'), dyn = f.group('main');
      L.h('p', 'lab-cap', c2, T(`${ptype ? 'Holes' : 'Electrons'} against temperature for this doping, with the intrinsic density nᵢ(T). Drag the gold point to change T.`, `このドーピングでの温度に対する${ptype ? '正孔' : '電子'}密度と、真性キャリア密度 nᵢ(T) です。金色の点をドラッグして T を変えてください。`));
      const g = L.fig(c2, { x: [0, 800], y: [6, 20], aspect: 1.05, xlabel: 'T, K', ylabel: T(`log₁₀ ${ptype ? 'p' : 'n'}, cm⁻³`, `log₁₀ ${ptype ? 'p' : 'n'}、cm⁻³`), maxH: 440 });
      g.hline(Math.log10(dop), { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); g.text(30, Math.log10(dop), `${ptype ? 'N_A' : 'N_D'} = ${sci(dop)}`, { small: true, c: 'c4', anchor: 'start', dy: -7 });
      g.line(TS.map((t) => [t, Math.log10(ni(t))]), { c: 'muted', w: 1.6, dash: '5 3' });
      g.text(520, Math.log10(ni(520)), 'nᵢ(T)', { small: true, c: 'muted', anchor: 'start', dx: 8, dy: 12 });
      g.line(st.curve.map(([t, y]) => [t, Math.max(6, y)]), { c: ptype ? 'c2' : 'c1', w: 2.6 });
      const cur = g.group('over');
      g.handle(Tsel, Math.max(6, Math.log10(ptype ? carriers(Tsel, Nd, Na).p : carriers(Tsel, Nd, Na).n)), { c: 'hl', r: 7, axis: 'x', snap: 5, label: T('Temperature', '温度'), bounds: [20, 800, 6, 20], onDrag: (x) => ctx.set('T', Math.round(x / 5) * 5) });
      L.legend(ctx.host, [{ c: 'c1', label: T('f(E), electrons', 'f(E)、電子') }, { c: 'c2', label: T('1 − f(E), holes', '1 − f(E)、正孔') }, { c: 'hl', dash: true, label: T('Fermi level E_F', 'フェルミ準位 E_F') }, { c: 'c4', dash: true, label: T(`${ptype ? 'acceptor' : 'donor'} level and doping`, `${ptype ? 'アクセプタ' : 'ドナー'}準位とドーピング`) }, { c: 'muted', dash: true, label: 'nᵢ(T)' }]);
      const draw = (Tk) => {
        const c = carriers(Tk, Nd, Na), eg = Eg(Tk), EF = c.EF;
        while (bands.firstChild) bands.removeChild(bands.firstChild); while (dyn.firstChild) dyn.removeChild(dyn.firstChild); while (cur.firstChild) cur.removeChild(cur.firstChild);
        bands.appendChild(f.rect(-26, eg, 26.8, 1.45 - eg, { fill: 'c1', fo: 0.1, nostroke: true, layer: 'under' }));
        bands.appendChild(f.rect(-26, -0.25, 26.8, 0.25, { fill: 'c2', fo: 0.1, nostroke: true, layer: 'under' }));
        bands.appendChild(f.hline(eg, { c: 'c1', w: 1.6, dash: false, layer: 'under' })); bands.appendChild(f.hline(0, { c: 'c2', w: 1.6, dash: false, layer: 'under' }));
        bands.appendChild(f.text(-25.5, eg + 0.06, `E꜀`, { small: true, c: 'c1', anchor: 'start', layer: 'under' })); bands.appendChild(f.text(-25.5, -0.1, `Eᵥ`, { small: true, c: 'c2', anchor: 'start', layer: 'under' }));
        const El = ptype ? EA : eg - ED; bands.appendChild(f.seg([-26, El], [0.8, El], { c: 'c4', w: 1.6, dash: '3 3', layer: 'under' })); bands.appendChild(f.text(-25.5, El, T(ptype ? `boron, ${fmt(100 * c.ion, 3)}% ionised` : `phosphorus, ${fmt(100 * c.ion, 3)}% ionised`, ptype ? `ホウ素、${fmt(100 * c.ion, 3)}% イオン化` : `リン、${fmt(100 * c.ion, 3)}% イオン化`), { small: true, c: 'c4', anchor: 'start', dx: 2, dy: ptype ? -6 : 14, layer: 'under' }));
        const lf = (E) => { const z = (E - EF) / (KB * Tk); return -(z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z))) / Math.LN10; };
        const lh = (E) => { const z = (EF - E) / (KB * Tk); return -(z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z))) / Math.LN10; };
        dyn.appendChild(f.line(L.sample(-0.25, 1.45, 500, (E) => [Math.max(-26, lf(E)), E]), { c: 'c1', w: 2.4, layer: 'main' }));
        dyn.appendChild(f.line(L.sample(-0.25, 1.45, 500, (E) => [Math.max(-26, lh(E)), E]), { c: 'c2', w: 2.4, layer: 'main' }));
        dyn.appendChild(f.hline(EF, { c: 'hl', w: 1.8, dash: '6 3', layer: 'main' }));
        dyn.appendChild(f.text(-25.5, EF, `E_F = Eᵥ + ${fmt(EF, 3)} eV`, { small: true, c: 'hl', anchor: 'start', dy: -6, layer: 'main' }));
        if (lf(eg) > -26) dyn.appendChild(f.dot(lf(eg), eg, { c: 'c1', r: 4.5, layer: 'main' }));
        if (lh(0) > -26) dyn.appendChild(f.dot(lh(0), 0, { c: 'c2', r: 4.5, layer: 'main' }));
        cur.appendChild(g.vline(Tk, { c: 'hl', w: 1, dash: '3 3', layer: 'over' }));
        cur.appendChild(g.dot(Tk, Math.max(6, Math.log10(ptype ? c.p : c.n)), { c: 'hl', r: 4, layer: 'over' }));
        const maj = ptype ? c.p : c.n, nii = ni(Tk);
        ctx.readout([
          { k: 'T', v: `${fmt(Tk, 3)} K`, tone: 'key' },
          { k: T('band gap E_g(T)', 'バンドギャップ E_g(T)'), v: `${fmt(eg, 4)} eV` },
          { k: 'nᵢ', v: sci(nii) + ' cm⁻³' },
          { k: 'n, p', v: `${sci(c.n)}, ${sci(c.p)}`, tone: 'good' },
          { k: T('E_F above Eᵥ', 'Eᵥ からの E_F'), v: `${fmt(EF, 4)} eV` },
          { k: T('dopants ionised', 'イオン化したドーパント'), v: `${fmt(100 * c.ion, 3)}%` },
          { k: 'np / nᵢ²', v: fmt((c.n * c.p) / (nii * nii), 4) },
        ], maj < 0.5 * dop
          ? T(`Freeze-out: at ${fmt(Tk, 3)} K there is too little thermal energy to empty the ${ptype ? 'acceptor' : 'donor'} level ${fmt(1000 * ED, 2)} meV from the band, so only ${fmt(100 * c.ion, 3)}% of the dopants are ionised and the Fermi level sits between that level and the band edge.`, `凍結領域です。${fmt(Tk, 3)} K ではバンドから ${fmt(1000 * ED, 2)} meV の${ptype ? 'アクセプタ' : 'ドナー'}準位を空にするだけの熱エネルギーがなく、イオン化したドーパントは ${fmt(100 * c.ion, 3)}% だけで、フェルミ準位はその準位とバンド端の間にあります。`)
          : nii > 0.3 * dop
            ? T(`Intrinsic regime: nᵢ = ${sci(nii)} has caught up with the doping, electrons and holes both come mainly from across the gap, and the Fermi level slides back towards midgap. Silicon devices stop working here.`, `真性領域です。nᵢ = ${sci(nii)} がドーピングに追いつき、電子も正孔も主にギャップを越えて生まれ、フェルミ準位はギャップ中央へ戻っていきます。シリコンのデバイスはここで機能しなくなります。`)
            : T(`Extrinsic plateau: every ${ptype ? 'acceptor' : 'donor'} is ionised, so the ${ptype ? 'hole' : 'electron'} density equals the doping over hundreds of kelvin, while the minority density ${sci(ptype ? c.n : c.p)} follows from np = nᵢ².`, `外因性の平坦部です。すべての${ptype ? 'アクセプタ' : 'ドナー'}がイオン化しているので、${ptype ? '正孔' : '電子'}密度は数百ケルビンにわたってドーピングに等しく、少数キャリア密度 ${sci(ptype ? c.n : c.p)} は np = nᵢ² から決まります。`));
      };
      st.anim = L.animator(ctx.host, (dt, t, lb) => { const Tk = Math.min(Tsel, 20 + 160 * t); draw(Tk); lb.textContent = `T = ${fmt(Tk, 3)} K`; return Tk < Tsel; }, { autoplay: false, initialT: 100, once: true, playLabel: T('Play: warm up from 20 K', '再生：20 K から温める') });
    },
  };

  /* ---------- 2. the p-n junction ---------- */
  D['pn-junction'] = {
    render(ctx, v) {
      const Na = Math.pow(10, v.lna), Nd = Math.pow(10, v.lnd), V = v.V, J = junction(Na, Nd, V), J3 = junction(Na, Nd, -3), eg = Eg(300);
      const um = 1e4, xl = -1.35 * J3.xp * um - 0.05, xr = 1.35 * J3.xn * um + 0.05;
      const Ec = (xc) => J.EcN + J.U(xc / um); // eV, with E_Fn = 0 on the n side
      L.h('p', 'lab-cap', ctx.host, T('Band diagram of an abrupt silicon junction: p side on the left, n side on the right. The quasi-Fermi levels split by qV across the depletion region (shaded). Drag the gold handle on the p-side band edge to bias the junction.', '階段型シリコン接合のバンド図です。左が p 側、右が n 側です。擬フェルミ準位は空乏層（陰影）をまたいで qV だけ分かれます。p 側のバンド端にある金色のハンドルをドラッグして、接合にバイアスをかけてください。'));
      const top = J.EcN + J.Vbi + 3.1, bot = J.EcN - eg - 0.35;
      const f = L.fig(ctx.host, { x: [xl, xr], y: [Math.min(bot, -0.6 - eg), top + 0.15], aspect: 0.48, xlabel: 'x, μm', ylabel: T('electron energy, eV', '電子のエネルギー、eV'), maxH: 420 });
      f.rect(-J.xp * um, -10, J.W * um, 30, { fill: 'hl', fo: 0.08, nostroke: true, layer: 'under' });
      const xs = L.seq(401, (i) => xl + ((xr - xl) * i) / 400);
      f.area(xs.map((x) => [x, Ec(x)]), { base: top + 0.15, c: 'c1', fo: 0.1, w: 0 });
      f.area(xs.map((x) => [x, Ec(x) - eg]), { base: Math.min(bot, -0.6 - eg), c: 'c2', fo: 0.1, w: 0 });
      f.line(xs.map((x) => [x, Ec(x)]), { c: 'c1', w: 2.6 }); f.line(xs.map((x) => [x, Ec(x) - eg]), { c: 'c2', w: 2.6 });
      f.seg([-J.xp * um, 0], [xr, 0], { c: 'c1', w: 1.5, dash: '6 3' }); f.seg([xl, -V], [J.xn * um, -V], { c: 'c2', w: 1.5, dash: '6 3' });
      f.text(xr, 0, 'E_Fn', { small: true, c: 'c1', anchor: 'end', dy: -5 }); f.text(xl, -V, 'E_Fp', { small: true, c: 'c2', anchor: 'start', dy: -5 });
      // carriers: a few electrons in the n-side band, holes in the p-side band
      for (let k = 0; k < 9; k++) { const x = J.xn * um + (k + 0.5) * ((xr - J.xn * um) / 9); f.dot(x, Ec(x) + 0.08 + 0.05 * (k % 3), { c: 'c1', r: 3.4 }); }
      for (let k = 0; k < 7; k++) { const x = xl + (k + 0.5) * ((-J.xp * um - xl) / 7); f.dot(x, Ec(x) - eg - 0.08 - 0.05 * (k % 3), { c: 'c2', r: 3.4, hollow: true }); }
      f.text(xl + 0.02 * (xr - xl), Math.min(bot, -0.6 - eg) + 0.2, T('p side', 'p 側'), { c: 'c2', anchor: 'start' }); f.text(xr - 0.02 * (xr - xl), Math.min(bot, -0.6 - eg) + 0.2, T('n side', 'n 側'), { c: 'c1', anchor: 'end' });
      if (Math.abs(V) > 0.01) { const xm = Math.min(J.xn * um * 0.6, (xr - J.xn * um) * 0.2 + J.xn * um); f.arrow([xm, 0], [xm, -V], { c: 'ink', w: 1.2 }); f.text(xm, -V / 2, `qV = ${fmt(V, 3)} eV`, { small: true, anchor: 'start', dx: 6 }); }
      f.handle(xl + 0.12 * (-J.xp * um - xl) + 0.0001, Ec(xl + 0.1 * (-J.xp * um - xl)), { c: 'hl', r: 8, axis: 'y', label: T('Bias: drag the p side', 'バイアス：p 側をドラッグ'), bounds: [xl, xr, J.EcN + J.Vbi - 0.6, J.EcN + J.Vbi + 3], onDrag: (_, y) => ctx.set('V', Math.round((J.Vbi - (y - J.EcN)) * 100) / 100) });
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Space charge ρ / q: ionised acceptors (−N_A) on the p side, donors (+N_D) on the n side, equal and opposite in total.', '空間電荷 ρ / q です。p 側のイオン化したアクセプタ（−N_A）と n 側のドナー（+N_D）で、総量は等しく逆符号です。'));
      const ek = Math.floor(Math.log10(Math.max(Na, Nd))), sc = Math.pow(10, -ek), rmax = Math.max(Na, Nd) * sc * 1.2;
      const gc = L.fig(c1, { x: [xl, xr], y: [-rmax, rmax], aspect: 0.62, xlabel: 'x, μm', ylabel: `ρ / q, 10${supE(ek)} cm⁻³`, maxH: 260 });
      gc.rect(-J.xp * um, -Na * sc, J.xp * um, Na * sc, { fill: 'c2', fo: 0.5, c: 'c2', w: 1.2 }); gc.rect(0, 0, J.xn * um, Nd * sc, { fill: 'c1', fo: 0.5, c: 'c1', w: 1.2 }); gc.hline(0, { c: 'muted', w: 1, dash: false });
      L.h('p', 'lab-cap', c2, T('Electric field |ℰ(x)|: linear ramps from Gauss’s law, peaking at the metallurgical junction.', '電場 |ℰ(x)| です。ガウスの法則による直線の傾斜で、冶金学的接合で最大になります。'));
      const emax3 = J3.Emax / 1e3;
      const ge = L.fig(c2, { x: [xl, xr], y: [0, emax3 * 1.15], aspect: 0.62, xlabel: 'x, μm', ylabel: 'kV/cm', maxH: 260 });
      ge.area(xs.map((x) => [x, J.field(x / um) / 1e3]), { base: 0, c: 'c3', fo: 0.3, w: 2.2 });
      L.legend(ctx.host, [{ c: 'c1', label: T('conduction band E꜀, electrons, E_Fn', '伝導帯 E꜀、電子、E_Fn') }, { c: 'c2', label: T('valence band Eᵥ, holes, E_Fp', '価電子帯 Eᵥ、正孔、E_Fp') }, { c: 'hl', kind: 'fill', label: T('depletion region', '空乏層') }, { c: 'c3', kind: 'fill', label: T('field', '電場') }]);
      ctx.readout([
        { k: 'N_A, N_D', v: `${sci(Na)}, ${sci(Nd)} cm⁻³`, tone: 'key' },
        { k: T('built-in V_bi', '内蔵電位 V_bi'), v: `${fmt(J.Vbi, 4)} V`, tone: 'good' },
        { k: T('bias V', 'バイアス V'), v: `${fmt(V, 3)} V` },
        { k: 'W = x_p + x_n', v: `${fmt(J.W * um, 3)} μm = ${fmt(J.xp * um, 3)} + ${fmt(J.xn * um, 3)}` },
        { k: 'ℰ_max', v: `${fmt(J.Emax / 1e3, 3)} kV/cm`, tone: J.Emax > 3e5 ? 'warn' : undefined },
        { k: T('capacitance C/A = ε/W', '容量 C/A = ε/W'), v: `${fmt(J.C * 1e9, 3)} nF/cm²` },
      ], V > J.Vbi - 0.15
        ? T('Forward bias close to V_bi: the barrier has nearly gone and the depletion approximation fails, because the injected carriers are no longer negligible inside the junction. A real diode is carrying a large current long before this.', 'V_bi に近い順バイアスです。障壁はほとんど消え、注入されたキャリアが接合の中で無視できなくなるので空乏近似は成り立ちません。実際のダイオードはそのはるか手前で大きな電流を流しています。')
        : J.Emax > 3e5
          ? T(`The peak field ${fmt(J.Emax / 1e3, 3)} kV/cm passes about 300 kV/cm, roughly where silicon junctions of this doping break down by avalanche.`, `ピーク電場 ${fmt(J.Emax / 1e3, 3)} kV/cm は約 300 kV/cm を超えています。この程度のドーピングのシリコン接合が、なだれ降伏を起こすおおよその値です。`)
          : T(`The depletion region reaches ${fmt(J.xn / J.xp, 3)} times further into the ${Nd < Na ? 'lightly doped n' : 'n'} side than into the p side, because equal charges need N_A x_p = N_D x_n. Reverse bias widens it as √(V_bi − V), which is how a varactor tunes its capacitance.`, `空乏層は p 側より ${fmt(J.xn / J.xp, 3)} 倍深く n 側へ広がります。等しい電荷には N_A x_p = N_D x_n が必要だからです。逆バイアスは空乏層を √(V_bi − V) のように広げ、可変容量ダイオードはこれで容量を変えます。`));
    },
  };

  /* ---------- 3. the diode and the solar cell ---------- */
  D['diode-iv'] = {
    render(ctx, v) {
      const Tk = v.T, nid = v.nid, Iph = v.Iph / 1000, V = v.V, logm = v.scale === 1;
      const I = diodeI(V, Tk, nid, Iph), Vo = Iph > 0 ? voc(Tk, nid, Iph) : null, mp = Iph > 0 ? maxPower(Tk, nid, Iph) : null;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(logm ? '|I| against V on a log scale: the forward branch is a straight line of slope q/(n kT) per e-fold. Drag the gold point along the curve.' : 'Current against voltage. With light, the curve drops by the photocurrent into the fourth quadrant, where the diode delivers power (gold rectangle at the maximum). Drag the gold point along the curve.', logm ? '対数目盛の |I| と V です。順方向の枝は傾き q/(n kT)（e 倍あたり）の直線です。金色の点を曲線に沿ってドラッグしてください。' : '電流と電圧です。光を当てると曲線は光電流だけ第四象限へ下がり、そこでダイオードは電力を供給します（最大電力点の金色の長方形）。金色の点を曲線に沿ってドラッグしてください。'));
      const vx = [-0.4, 0.8];
      const f = logm
        ? L.fig(c1, { x: vx, y: [-15, 0.5], aspect: 0.8, xlabel: 'V, volts', ylabel: 'log₁₀ |I / A|', maxH: 420 })
        : L.fig(c1, { x: vx, y: [-60, 60], aspect: 0.8, xlabel: 'V, volts', ylabel: 'I, mA', maxH: 420 });
      const Y = (i) => (logm ? Math.log10(Math.max(Math.abs(i), 1e-15)) : clamp(i * 1000, -80, 80));
      f.hline(logm ? -15 : 0, { c: 'muted', w: 1, dash: false, layer: 'under' }); f.vline(0, { c: 'muted', w: 1, dash: false, layer: 'under' });
      const curve = (T0, col, w) => f.line(L.sample(vx[0], vx[1], 600, (vv) => [vv, Y(diodeI(vv, T0, nid, Iph))]), { c: col, w });
      if (!logm && mp) { f.rect(0, -mp.I * 1000, mp.V, mp.I * 1000, { fill: 'hl', fo: 0.25, c: 'hl', w: 1.2 }); }
      curve(Tk - 50, 'c3', 1.2); curve(Tk + 50, 'c2', 1.2); curve(Tk, 'c1', 2.6);
      if (Vo) f.dot(Vo, logm ? -15 : 0, { c: 'c4', r: 5 });
      f.handle(V, Y(I), { c: 'hl', r: 7, axis: 'x', snap: 0.005, label: T('Voltage', '電圧'), bounds: [vx[0], vx[1], -1e9, 1e9], onDrag: (x) => ctx.set('V', Math.round(x * 200) / 200) });
      L.h('p', 'lab-cap', c2, T('The voltage needed for 1 mA against temperature: about −2 mV per kelvin, which is how a diode becomes a thermometer.', '1 mA を流すのに必要な電圧と温度の関係です。約 −2 mV/K で、これがダイオードを温度計にします。'));
      const g = L.fig(c2, { x: [200, 450], y: [0.3, 0.85], aspect: 0.8, xlabel: 'T, K', ylabel: T('V at 1 mA, volts', '1 mA での V、ボルト'), maxH: 420 });
      g.line(L.sample(200, 450, 200, (t) => [t, vAtCurrent(1e-3, t, nid)]), { c: 'c1', w: 2.4 });
      g.dot(Tk, vAtCurrent(1e-3, Tk, nid), { c: 'hl', r: 6 });
      const slope = (vAtCurrent(1e-3, Tk + 0.5, nid) - vAtCurrent(1e-3, Tk - 0.5, nid)) * 1000;
      L.legend(ctx.host, [{ c: 'c1', label: `T = ${fmt(Tk, 3)} K` }, { c: 'c3', label: `T − 50 K` }, { c: 'c2', label: `T + 50 K` }, ...(Iph > 0 ? [{ c: 'hl', kind: 'fill', label: T('maximum power rectangle', '最大電力の長方形') }, { c: 'c4', kind: 'dot', label: T('open-circuit voltage', '開放電圧') }] : [])]);
      ctx.readout([
        { k: 'V, I', v: `${fmt(V, 3)} V, ${fmt(I * 1000, 4)} mA`, tone: 'key' },
        { k: T('saturation current Iₛ', '飽和電流 Iₛ'), v: `${sci(Is(Tk))} A` },
        { k: T('n kT/q', 'n kT/q'), v: `${fmt(nid * KB * Tk * 1000, 4)} mV` },
        { k: T('dV/dT at 1 mA', '1 mA での dV/dT'), v: `${fmt(slope, 3)} mV/K` },
        ...(Iph > 0 ? [{ k: T('V_oc, I_sc', 'V_oc、I_sc'), v: `${fmt(Vo, 4)} V, ${fmt(Iph * 1000, 3)} mA`, tone: 'good' }, { k: T('P_max, fill factor', 'P_max、曲線因子'), v: `${fmt(mp.P * 1000, 4)} mW, ${fmt(mp.P / (Vo * Iph), 3)}`, tone: 'good' }] : []),
      ], Iph > 0
        ? T(`As a solar cell: short-circuit current ${fmt(Iph * 1000, 3)} mA, open-circuit voltage ${fmt(Vo, 3)} V, and the best load draws ${fmt(mp.I * 1000, 3)} mA at ${fmt(mp.V, 3)} V. The fill factor ${fmt(mp.P / (Vo * Iph), 3)} measures how square the knee is; heat the cell and V_oc falls because Iₛ grows.`, `太陽電池としては、短絡電流 ${fmt(Iph * 1000, 3)} mA、開放電圧 ${fmt(Vo, 3)} V で、最適な負荷は ${fmt(mp.V, 3)} V で ${fmt(mp.I * 1000, 3)} mA を引き出します。曲線因子 ${fmt(mp.P / (Vo * Iph), 3)} は膝の角張り具合を測ります。セルを温めると Iₛ が増えるので V_oc は下がります。`)
        : V < 0
          ? T(`Reverse bias: the current saturates at −Iₛ = −${sci(Is(Tk))} A, the trickle of minority carriers that diffuse to the junction and are swept across. It grows about ${fmt(Is(Tk + 10) / Is(Tk), 3)} times for every 10 K.`, `逆バイアスです。電流は −Iₛ = −${sci(Is(Tk))} A で飽和します。接合まで拡散してきて掃き出される少数キャリアのわずかな流れです。10 K ごとに約 ${fmt(Is(Tk + 10) / Is(Tk), 3)} 倍になります。`)
          : T(`Forward bias: each extra ${fmt(nid * KB * Tk * Math.LN10 * 1000, 3)} mV multiplies the current by ten, because lowering the barrier by qV raises the number of carriers able to cross it by a factor exp(qV/kT).`, `順バイアスです。${fmt(nid * KB * Tk * Math.LN10 * 1000, 3)} mV 増えるごとに電流は十倍になります。障壁を qV 下げると、それを越えられるキャリアの数が exp(qV/kT) 倍になるからです。`));
    },
  };
})();
