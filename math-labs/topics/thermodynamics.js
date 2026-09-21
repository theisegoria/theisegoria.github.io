'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const lock = (ctx) => {
    const st = ctx.state;
    if (st.dragging) return;
    st.dragging = true;
    const end = () => { document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); st.dragging = false; ctx.redraw(); };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  };
  const held = (st, key, fresh) => { if (st.dragging && st[key] !== undefined) return st[key]; st[key] = fresh; return fresh; };
  const niceUp = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m <= 1 ? 1 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10) * p; };
  const GAM = 5 / 3; // monatomic ideal gas

  /* ---------------- 1. PV diagram ---------------- */
  D.pv = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, mode = Math.round(v.process), P1 = v.pressure, V1 = 1, r = v.tc;
      const cyc = mode === 3;
      const V2 = cyc ? Math.max(v.volume, 1.1) : v.volume;
      // each leg: [kind, Va, Vb, P(V)]
      const iso = (c) => (V) => c / V, adi = (c) => (V) => c / Math.pow(V, GAM);
      let legs;
      if (mode === 0) legs = [['isobaric', V1, V2, () => P1]];
      else if (mode === 1) legs = [['isothermal', V1, V2, iso(P1 * V1)]];
      else if (mode === 2) legs = [['adiabatic', V1, V2, adi(P1 * V1 ** GAM)]];
      else {
        const k = Math.pow(r, -1 / (GAM - 1)), V3 = V2 * k, V4 = V1 * k, P2 = P1 * V1 / V2;
        legs = [['isothermal', V1, V2, iso(P1 * V1)], ['adiabatic', V2, V3, adi(P2 * V2 ** GAM)], ['isothermal', V3, V4, iso(r * P1 * V1)], ['adiabatic', V4, V1, adi(P1 * V1 ** GAM)]];
      }
      const Vmax = Math.max(...legs.map((l) => Math.max(l[1], l[2])));
      const XV = held(st, 'XV', cyc ? niceUp(Vmax * 1.08) : 5.5);
      const pmax = Math.max(...legs.map((l) => Math.max(l[3](l[1]), l[3](l[2]))));
      const YP = held(st, 'YP', niceUp(pmax * 1.12));
      const legPts = legs.map(([, a, b, P]) => L.sample(a, b, 120, (V) => P(V)));
      const work = legs.map(([kind, a, b, P]) => kind === 'isobaric' ? P(a) * (b - a) : kind === 'isothermal' ? P(a) * a * Math.log(b / a) : (P(a) * a - P(b) * b) / (GAM - 1));
      const Wtot = work.reduce((s, w) => s + w, 0);
      const row = L.h('div', 'lab-row', ctx.host);
      const cA = L.h('div', 'lab-col', row), cB = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', cA, cyc ? T('Carnot cycle: the enclosed area is the net work per cycle', 'カルノーサイクル：囲まれた面積が1サイクルの正味の仕事です') : T('The shaded area under the path is the work done by the gas', '経路の下の塗った面積が気体のする仕事です'));
      L.h('p', 'lab-cap', cB, T('The gas in its cylinder', 'シリンダー内の気体'));
      const f = L.fig(cA, { x: [0, XV], y: [0, YP], aspect: 0.78, maxH: 380, xlabel: T('volume V (L)', '体積 V (L)'), ylabel: T('pressure P (bar)', '圧力 P (bar)') });
      // reference isotherm and adiabat through state 1
      if (!cyc) {
        f.line(L.sample(0.3, XV, 200, (V) => P1 * V1 / V), { c: 'muted', w: 1, dash: '3 4', op: 0.7 });
        f.line(L.sample(0.3, XV, 200, (V) => P1 * V1 ** GAM / V ** GAM), { c: 'muted', w: 1, dash: '1 3', op: 0.8 });
      }
      if (cyc) f.poly([].concat(...legPts), { c: 'c1', fo: 0.2, w: 0 , layer: 'under' });
      else f.area(legPts[0], { c: Wtot >= 0 ? 'c1' : 'c2', fo: 0.22 });
      const tone = { isobaric: 'c4', isothermal: 'c2', adiabatic: 'c3' };
      legs.forEach((l, i) => {
        const pts = legPts[i];
        f.line(pts, { c: tone[l[0]], w: 2.8 });
        const mid = pts[60], nx = pts[64];
        if (Math.hypot(f.X(nx[0]) - f.X(mid[0]), f.Y(nx[1]) - f.Y(mid[1])) > 1) f.arrow(mid, nx, { c: tone[l[0]], w: 2.8 });
      });
      const states = cyc ? legs.map((l) => [l[1], l[3](l[1])]) : [[V1, P1], [V2, legs[0][3](V2)]];
      states.forEach((p, i) => { f.dot(p[0], p[1], { c: 'ink', r: 4, layer: 'main' }); f.text(p[0], p[1], String(i + 1), { dx: 9, dy: -7, anchor: 'start', small: true, layer: 'main' }); });
      const end = cyc ? states[1] : states[1];
      f.handle(end[0], end[1], { c: 'hl', label: T('Final volume', '終体積'), axis: 'x', bounds: [cyc ? 1.1 : 0.4, 5, 0, YP], onDrag: (x) => { lock(ctx); ctx.set('volume', x); } });
      // cylinder
      const Tof = (V, P) => P * V / (P1 * V1); // temperature relative to state 1
      const cyl = L.fig(cB, { axes: false, x: [0, 10], y: [0, 8.2], equal: true, maxH: 330 });
      const x0 = 0.8, x1 = 9.6, yb = 2.2, yt = 6.2, xOf = (V) => x0 + (x1 - x0 - 0.9) * V / XV;
      cyl.line([[x1, yt], [x0, yt], [x0, yb], [x1, yb]], { c: 'ink', w: 2.4, layer: 'under' });
      cyl.layers.dyn = cyl.group('main');
      const loops = cyc ? legs.length : 1;
      const draw = (s) => { // s in [0, loops]
        cyl.clear('dyn'); f.clear('over');
        const i = Math.min(loops - 1, Math.floor(s)), u = s - i, l = legs[i], Vn = l[1] + (l[2] - l[1]) * u, Pn = l[3](Vn), Tn = Tof(Vn, Pn);
        const xp = xOf(Vn);
        cyl.rect(x0, yb, xp - x0, yt - yb, { c: 'pos', fo: L.clamp(0.12 + 0.2 * Tn, 0.1, 0.8), nostroke: true, layer: 'dyn' });
        cyl.rect(xp, yb + 0.05, 0.35, yt - yb - 0.1, { c: 'ink', fo: 0.75, nostroke: true, layer: 'dyn' });
        cyl.seg([xp + 0.35, (yb + yt) / 2], [x1 + 0.3, (yb + yt) / 2], { c: 'ink', w: 3, layer: 'dyn' });
        cyl.text((x0 + xp) / 2, (yb + yt) / 2, `T/T₁ = ${fmt(Tn, 2)}`, { small: true, dy: 4, layer: 'dyn' });
        const kind = l[0];
        if (kind === 'adiabatic') cyl.text(5, yb - 0.8, T('insulated: Q = 0', '断熱：Q = 0'), { small: true, c: 'c3', layer: 'dyn' });
        else {
          const into = kind === 'isobaric' ? l[2] > l[1] : l[2] > l[1];
          const hx = (x0 + Math.max(xp, x0 + 1.2)) / 2;
          cyl.rect(x0, 0.2, x1 - x0, 0.9, { c: into ? 'pos' : 'neg', fo: 0.35, nostroke: true, layer: 'dyn' });
          cyl.text(5, 0.65, kind === 'isothermal' ? (cyc ? (i === 0 ? T('hot reservoir', '高温熱源') : T('cold reservoir', '低温熱源')) : T('reservoir at T₁', '温度 T₁ の熱源')) : T('heater', 'ヒーター'), { small: true, dy: 4, layer: 'dyn' });
          if (Math.abs(l[2] - l[1]) > 1e-6) cyl.arrow(into ? [hx, 1.15] : [hx, yb - 0.1], into ? [hx, yb - 0.1] : [hx, 1.15], { c: into ? 'c2' : 'c1', w: 3, layer: 'dyn' });
        }
        const dV = l[2] - l[1];
        if (Math.abs(dV) > 1e-6) cyl.arrow([xp + 1.2, yt + 0.7], [xp + 1.2 + Math.sign(dV) * 1.3, yt + 0.7], { c: 'ink', w: 2, layer: 'dyn' });
        cyl.text(xp + 1.2, yt + 0.7, dV > 0 ? T('gas does work', '気体が仕事をする') : dV < 0 ? T('work done on gas', '気体が仕事をされる') : '', { small: true, dy: -10, anchor: 'middle', layer: 'dyn' });
        f.dot(Vn, Pn, { c: 'hl', r: 6.5 });
      };
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        const s = Math.min(loops, t * (cyc ? 0.5 : 0.4));
        draw(s >= loops ? (cyc ? 0.5 : 1) : s);
        return s < loops;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: cyc ? T('Run the cycle', 'サイクルを動かす') : T('Run the process', '過程を動かす') });
      L.legend(ctx.host, (cyc ? [] : [{ c: 'c4', label: T('isobaric, P constant', '定圧（P 一定）') }]).concat([{ c: 'c2', label: T('isothermal, PV constant', '等温（PV 一定）') }, { c: 'c3', label: T('adiabatic, PV^γ constant', '断熱（PV^γ 一定）') }]).concat(cyc ? [] : [{ c: 'muted', dash: true, label: T('isotherm and adiabat through state 1', '状態1を通る等温線と断熱線') }]));
      const J = (x) => `${fmt(100 * x, 1)} J`;
      if (cyc) {
        const Qh = work[0];
        ctx.readout([{ k: T('net work W', '正味の仕事 W'), v: J(Wtot), tone: 'key' }, { k: T('heat in Q_h', '吸収熱 Q_h'), v: J(Qh) }, { k: 'η = W/Q_h', v: fmt(Wtot / Qh, 3), tone: 'good' }, { k: '1 − T_c/T_h', v: fmt(1 - r, 3) }],
          T('The two adiabats cancel in work, so the net work is the hot isotherm minus the cold one. The efficiency depends only on the two temperatures.', '2本の断熱過程の仕事は打ち消し合うので、正味の仕事は高温の等温過程から低温の等温過程を引いたものです。効率は2つの温度だけで決まります。'));
      } else {
        const Pn = legs[0][3](V2), dU = 1.5 * (Pn * V2 - P1 * V1);
        ctx.readout([{ k: T('work by gas W', '気体のする仕事 W'), v: J(Wtot), tone: 'key' }, { k: T('heat in Q = ΔU + W', '吸収熱 Q = ΔU + W'), v: J(dU + Wtot) }, { k: 'ΔU = (3/2)Δ(PV)', v: J(dU) }, { k: 'T₂/T₁', v: fmt(Pn * V2 / (P1 * V1), 3) }],
          T('Drag the gold end point. The same two volumes give different work along different paths, while ΔU depends only on the end states.', '金色の終点をドラッグできます。同じ2つの体積の間でも経路が違えば仕事は違いますが、ΔU は始点と終点だけで決まります。'));
      }
    },
  };

  /* ---------------- 2. Entropy: one jump or many small steps ---------------- */
  D['thermo-entropy'] = {
    render(ctx, v) {
      const C = 1; // heat capacity, kJ/K
      let lo = v.cold, hi = v.hot; const swapped = hi < lo; if (swapped) [lo, hi] = [hi, lo];
      const N = Math.round(v.steps), same = hi - lo < 1e-9;
      const dT = (hi - lo) / N, Tk = L.seq(N, (k) => lo + (k + 1) * dT);
      const Sgen = (n) => { if (same) return 0; const d = (hi - lo) / n; let s = C * Math.log(hi / lo); for (let k = 1; k <= n; k++) s -= C * d / (lo + k * d); return s * 1000; };
      const Sbody = same ? 0 : C * Math.log(hi / lo) * 1000, Sres = Sbody - Sgen(N);
      const Qtot = C * (hi - lo); // kJ
      const row = L.h('div', 'lab-row', ctx.host);
      const cA = L.h('div', 'lab-col', row), cB = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', cA, T('Heating a body from Tc to Th through N reservoirs. Area under 1/T is entropy.', '物体を N 個の熱源で Tc から Th まで加熱します。1/T の下の面積がエントロピーです。'));
      L.h('p', 'lab-cap', cB, T('Entropy generated against the number of reservoirs', '熱源の数に対する生成エントロピー'));
      const ymax = 1000 / lo * 1.08, ymin = 0;
      const f = L.fig(cA, { x: [0, Math.max(Qtot, 1)], y: [ymin, ymax], aspect: 0.75, maxH: 360, xlabel: T('heat added Q (kJ)', '加えた熱 Q (kJ)'), ylabel: T('1/T (10⁻³ K⁻¹)', '1/T (10⁻³ K⁻¹)') });
      if (!same) {
        const body = L.sample(0, Qtot, 240, (q) => 1000 / (lo + q / C));
        const stair = [];
        Tk.forEach((t, k) => { stair.push([k * dT * C, 1000 / t], [(k + 1) * dT * C, 1000 / t]); });
        f.area(stair, { c: 'c4', fo: 0.14 });
        // gap between the body curve and the staircase: entropy generated
        Tk.forEach((t, k) => { const a = k * dT * C, b = (k + 1) * dT * C; f.poly(L.sample(a, b, 30, (q) => 1000 / (lo + q / C)).concat([[b, 1000 / t], [a, 1000 / t]]), { c: 'c2', fo: 0.55, w: 0 }); });
        f.line(stair, { c: 'c4', w: 2.2 });
        f.line(body, { c: 'c1', w: 2.6 });
        if (N <= 6) Tk.forEach((t, k) => f.text((k + 0.5) * dT * C, 1000 / t, `${Math.round(t)} K`, { small: true, dy: 16, c: 'c4' }));
      }
      const g = L.fig(cB, { x: [0, 40], y: [0, Math.max(Sgen(1), 1) * 1.1], aspect: 0.75, maxH: 360, xlabel: T('number of reservoirs N', '熱源の数 N'), ylabel: 'ΔS_univ (J/K)' });
      g.line(L.seq(40, (i) => [i + 1, Sgen(i + 1)]), { c: 'c2', w: 2.2 });
      L.seq(40, (i) => g.dot(i + 1, Sgen(i + 1), { c: 'c2', r: 2.2, layer: 'main' }));
      g.dot(N, Sgen(N), { c: 'hl', r: 6.5 });
      g.text(N, Sgen(N), fmt(Sgen(N), 1), { dx: 10, dy: -8, anchor: 'start', small: true });
      L.legend(ctx.host, [{ c: 'c1', label: T('body: 1/T as it warms', '物体の 1/T（温まりながら）') }, { c: 'c4', label: T('reservoir that supplies each step', '各段階で熱を供給する熱源') }, { kind: 'fill', c: 'c2', label: T('gap = entropy generated', '差 = 生成エントロピー') }]);
      ctx.readout([{ k: 'ΔS_body = C ln(T_h/T_c)', v: `${fmt(Sbody, 1)} J/K` }, { k: 'ΔS_reservoirs', v: `${fmt(-Sres, 1)} J/K` }, { k: 'ΔS_univ', v: `${fmt(Sgen(N), 2)} J/K`, tone: 'key' }],
        (swapped ? T('The two temperatures were swapped so that the body is heated. ', '物体を加熱するように2つの温度を入れ替えました。') : '') + T(`C = 1 kJ/K. The body’s entropy change is fixed by its end states; only the reservoirs’ share depends on the path. With more, closer reservoirs the gap shrinks roughly like 1/N, and the process approaches reversibility.`, `C = 1 kJ/K。物体のエントロピー変化は始めと終わりの状態だけで決まり、経路に依存するのは熱源側だけです。温度の近い熱源を増やすと差はおよそ 1/N で小さくなり、過程は可逆に近づきます。`));
    },
  };

  /* ---------------- 3. Ideal gas law ---------------- */
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
  D['equation-state'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const R = 8.314, n = v.n, Tt = v.temperature, V = v.volume;
      const P = n * R * Tt / V; // kPa, with V in litres
      const row = L.h('div', 'lab-row', ctx.host);
      const cA = L.h('div', 'lab-col', row), cB = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', cA, T('Molecules in a box: count ∝ n, width ∝ V, speed ∝ √T (schematic)', '箱の中の分子：数は n、幅は V、速さは √T に比例（模式図）'));
      L.h('p', 'lab-cap', cB, T('Isotherms P = nRT/V for this n; the rectangle has area PV = nRT', 'この n での等温線 P = nRT/V。長方形の面積は PV = nRT です'));
      const box = L.fig(cA, { axes: false, x: [0, 10], y: [0, 6.4], equal: true, maxH: 330 });
      const Wb = 0.4 + 9.2 * V / 50, H = 5.4, y0 = 0.5, x0 = 0.3;
      box.rect(x0, y0, Wb, H, { c: 'ink', fo: 0.03, w: 2 });
      box.rect(x0 + Wb, y0 - 0.2, 0.18, H + 0.4, { c: 'ink', fo: 0.8, nostroke: true });
      const rand = rng(12345), cnt = Math.round(n * 30), sp = 0.9 * Math.sqrt(Tt / 300);
      const mols = L.seq(90, () => [rand(), rand(), gauss(rand) * sp, gauss(rand) * sp]).slice(0, cnt);
      const fold = (p, L0) => { const m = ((p % (2 * L0)) + 2 * L0) % (2 * L0); return m > L0 ? 2 * L0 - m : m; };
      box.layers.dyn = box.group('main');
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        box.clear('dyn');
        const w = Wb - 0.2, h = H - 0.2;
        mols.forEach(([a, b, vx, vy], i) => { const x = x0 + 0.1 + fold(a * w + vx * t, w), y = y0 + 0.1 + fold(b * h + vy * t, h); box.dot(x, y, { c: i === 0 ? 'hl' : 'c1', r: i === 0 ? 4.5 : 3, layer: 'dyn' }); });
      }, { autoplay: true });
      const Pmax = n * R * 800 / 5, YP = niceUp(n * R * Tt / 5 * 1.05);
      const g = L.fig(cB, { x: [0, 52], y: [0, YP], aspect: 0.75, maxH: 330, xlabel: T('volume V (L)', '体積 V (L)'), ylabel: T('pressure P (kPa)', '圧力 P (kPa)') });
      void Pmax;
      const temps = [200, 400, 600, 800].filter((t) => Math.abs(t - Tt) >= 5).concat([Tt]).sort((p, q) => p - q);
      temps.forEach((t, i) => {
        const cur = Math.abs(t - Tt) < 5;
        if (!cur) g.line(L.sample(2, 52, 200, (x) => n * R * t / x), { c: 'muted', w: 1, op: 0.7 });
        const xl = 8 + 9 * i, yl = n * R * t / xl;
        if (yl < YP * 0.97) g.text(xl, yl, `${t} K`, { small: true, dy: -6, dx: 2, anchor: 'start', c: cur ? 'c1' : 'muted' });
      });
      g.rect(0, 0, V, P, { c: 'hl', fo: 0.14, w: 1, dash: '3 3' });
      g.line(L.sample(2, 52, 240, (x) => n * R * Tt / x), { c: 'c1', w: 2.6 });
      g.dot(V, P, { c: 'hl', r: 6.5 });
      g.handle(V, P, { c: 'hl', label: T('Volume', '体積'), axis: 'x', bounds: [5, 50, 0, YP], onDrag: (x) => ctx.set('volume', x) });
      g.text(V, P, `${fmt(P, 1)} kPa`, { dx: 10, dy: 20, anchor: 'start', small: true });
      L.legend(ctx.host, [{ c: 'c1', label: T(`isotherm T = ${Tt} K`, `等温線 T = ${Tt} K`) }, { c: 'muted', label: T('other temperatures', '他の温度') }, { kind: 'fill', c: 'hl', label: 'PV = nRT' }]);
      ctx.readout([{ k: 'P = nRT/V', v: `${fmt(P, 1)} kPa`, tone: 'key' }, { k: T('in atmospheres', '気圧換算'), v: `${fmt(P / 101.325, 3)} atm` }, { k: 'PV = nRT', v: `${fmt(n * R * Tt, 0)} J` }, { k: T('number density', '数密度'), v: `${fmt(n * 6.022e23 / (V * 1e-3), 3)} m⁻³` }],
        T('Drag the gold point along the isotherm. Doubling T at fixed n and V doubles P; halving V at fixed T also doubles it, because PV stays equal to nRT.', '金色の点を等温線に沿ってドラッグできます。n と V を固定して T を2倍にすると P は2倍になり、T を固定して V を半分にしても PV = nRT が保たれるので P は2倍になります。'));
    },
  };
})();
