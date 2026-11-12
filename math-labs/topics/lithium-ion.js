'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * One 18650 cell with a nickel-manganese-cobalt cathode and a graphite anode: 3.0 Ah, 35 milliohm at 25 C when new.
   * Terminal voltage V = OCV(s) - I R k(s) on discharge, where k rises from 1 as the cell empties, and OCV(s) + I R on
   * charge, with s the state of charge.
   * R follows an Arrhenius law in temperature (activation energy 20 kJ/mol) and grows with age; capacity fades as the
   * square root of the cycle count. Charging is constant current up to the voltage limit, then constant voltage while
   * the current tapers to C/20.
   * The jelly roll is an Archimedean spiral: length = pi (Ro^2 - Ri^2) / pitch, with the pitch the thickness of one
   * anode, one cathode and two separators.
   */
  const Q0 = 3.0, R25 = 0.035, VCUT = 2.8, VMAX = 4.2;
  const ocv = (s) => 3.43 + 0.62 * s - 0.43 * Math.exp(-28 * s) + 0.15 * Math.exp(-9 * (1 - s));
  const rInt = (Tc = 25, n = 0) => R25 * Math.exp((20000 / 8.314) * (1 / (Tc + 273.15) - 1 / 298.15)) * (1 + 0.5 * (n / 800));
  const polar = (s) => 1 + 0.8 * (1 - s) ** 2 + 1.5 * Math.exp(-10 * s);          // resistance and concentration loss grow as the cell empties
  const capAged = (n = 0) => Q0 * (1 - 0.2 * Math.sqrt(n / 800));
  function discharge(I, Tc = 25, n = 0) {
    const Q = capAged(n), R = rInt(Tc, n), v = (q) => { const s = 1 - q / Q; return ocv(s) - I * R * polar(s); };
    if (v(0) < VCUT) return { q: 0, wh: 0, Q, R, v };
    let a = 0, b = Q; if (v(Q) < VCUT) { for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (v(m) >= VCUT) a = m; else b = m; } } else a = Q;
    let wh = 0; const N = 400; for (let i = 0; i < N; i++) wh += v(((i + 0.5) / N) * a) * (a / N);
    return { q: a, wh, Q, R, v };
  }
  function charge(C, vmax = VMAX, Tc = 25, n = 0, s0 = 0) {
    const Q = capAged(n), R = rInt(Tc, n), I0 = C * Q, dt = 1 / (Math.max(C, 0.2) * 4000), pts = []; let s = s0, t = 0, tcc = null, t80 = null, heat = 0, I = I0;
    const sEnd = (() => { let a = 0, b = 1; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (ocv(m) < vmax) a = m; else b = m; } return a; })();
    for (let k = 0; k < 400000; k++) {
      const vcc = ocv(s) + I0 * R; I = vcc <= vmax ? I0 : Math.max(0, (vmax - ocv(s)) / R);
      if (tcc === null && vcc > vmax) tcc = t;
      if (k % 20 === 0) pts.push([t, I, Math.min(vmax, ocv(s) + I * R), s]);
      if (I < 0.05 * Q || s >= 1) break;
      if (t80 === null && s >= 0.8) t80 = t;
      s += (I * dt) / Q; heat += I * I * R * dt; t += dt;
    }
    pts.push([t, I, Math.min(vmax, ocv(s) + I * R), s]);
    return { pts, t, tcc: tcc ?? t, t80, s, sEnd, heat, Q, R };
  }
  // jelly roll geometry; thicknesses in micrometres, lengths in millimetres
  const CELL = { ro: 8.6, ri: 2.0, w: 58, al: 15, cu: 10, sep: 16, volCap: 587, mass0: 16 };   // volCap: mAh per cm^3 of cathode coating
  function roll(tc) {
    const ta = 1.1 * tc, pitch = (2 * tc + CELL.al + 2 * ta + CELL.cu + 2 * CELL.sep) / 1000, len = (PI * (CELL.ro ** 2 - CELL.ri ** 2)) / pitch;
    const area = (2 * len * CELL.w) / 100, areal = (tc * 1e-4) * CELL.volCap, cap = (area * areal) / 1000, R = 0.012 + 0.023 * (tc / 70) * (726 / area);
    const mass = CELL.mass0 + (area / 2) * (2 * tc * 1e-4 * 3.4 + 2 * ta * 1e-4 * 1.6 + CELL.al * 1e-4 * 2.7 + CELL.cu * 1e-4 * 8.96 + 2 * CELL.sep * 1e-4 * 0.95) * 1.12;
    return { ta, pitch, turns: (CELL.ro - CELL.ri) / pitch, len, area, areal, cap, R, mass, wh: cap * 3.65, whkg: (cap * 3.65) / (mass / 1000) };
  }
  const M = { Q0, R25, VCUT, VMAX, ocv, rInt, polar, capAged, discharge, charge, CELL, roll };
  (window.LabModels = window.LabModels || {})['lithium-ion'] = M;

  /* ================= 1. discharge: voltage under load ================= */
  D['liion-discharge'] = {
    render(ctx, v) {
      const Tc = v.T, n = v.n, I = v.cr * capAged(n), d = discharge(I, Tc, n), ref = discharge(0.2 * Q0, 25, 0);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Voltage at the terminals of one 18650 cell as it is drained at \(${fmt(I, 1)}\) A. The dashed curve is the same cell new, warm and drained gently. Load, cold and age all push the curve down by the drop across the cell’s internal resistance, so it reaches the cut-off sooner and charge is left inside.`, tx`18650 セル 1 本を \(${fmt(I, 1)}\) A で放電したときの端子電圧です。破線は、同じセルが新品で、暖かく、ゆっくり放電された場合です。負荷、低温、劣化はどれも、セルの内部抵抗での電圧降下の分だけ曲線を押し下げます。そのため早く終止電圧に達し、電荷が中に残ります。`));
      const a = L.fig(c1, { x: [0, 3.1], y: [2.6, 4.3], aspect: 0.68, maxH: 350, xlabel: T('charge delivered (Ah)', '取り出した電荷（Ah）'), ylabel: T('voltage (V)', '電圧（V）') });
      a.hline(VCUT, { c: 'c2', dash: '5 4' }); a.text(0.05, VCUT, T('cut-off 2.8 V', '終止電圧 2.8 V'), { small: true, anchor: 'start', dy: -5 });
      a.line(L.sample(0, ref.q, 200, (q) => ref.v(q)), { c: 'muted', w: 1.6, dash: '5 4' });
      const cur = L.sample(0, Math.max(d.q, 1e-3), 200, (q) => d.v(q));
      a.area(cur, { c: 'c1', fo: 0.14, base: 2.6 }); a.line(cur, { c: 'c1', w: 2.8 }); a.dot(d.q, d.v(d.q), { c: 'hl', r: 5.5 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Charge the cell delivers before cut-off against the current drawn, at this temperature and age (blue) and for a new cell at 25 °C (dashed). The right-hand scale of the curve is the reason a phone that reads 20 per cent can shut down when it is taken out into the cold.`, tx`この温度と劣化の状態で、終止電圧までにセルが取り出せる電荷を、流す電流に対して描いています（青）。破線は 25 °C の新品のセルです。この曲線の右側の落ち方が、残量 20 % と表示されたスマートフォンが、寒い屋外に出すと電源が切れることのある理由です。`));
      const b = L.fig(c2, { x: [0, 15], y: [0, 3.2], aspect: 0.68, maxH: 350, xlabel: T('current (A)', '電流（A）'), ylabel: T('charge delivered (Ah)', '取り出せる電荷（Ah）') });
      b.line(L.sample(0.1, 15, 120, (i) => discharge(i, 25, 0).q), { c: 'muted', w: 1.6, dash: '5 4' });
      b.line(L.sample(0.1, 15, 120, (i) => discharge(i, Tc, n).q), { c: 'c1', w: 2.8 });
      b.handle(Math.min(15, I), d.q, { c: 'hl', axis: 'x', bounds: [0.3, 15, 0, 3.2], label: T('current', '電流'), onDrag: (x) => ctx.set('cr', clamp(Math.round((x / capAged(n)) * 10) / 10, 0.1, 5)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('this cell, this load', 'このセル、この負荷') }, { c: 'muted', dash: true, label: T('new cell at 25 °C', '25 °C の新品のセル') }, { c: 'c2', dash: true, label: T('cut-off voltage', '終止電圧') }]);
      ctx.readout([
        { k: T('charge and energy delivered', '取り出せた電荷とエネルギー'), v: tx`\(${fmt(d.q, 2)}\ \mathrm{Ah},\ ${fmt(d.wh, 1)}\ \mathrm{Wh}\)`, tone: 'key' },
        { k: T('share of the cell’s present capacity', 'セルの現在の容量に対する割合'), v: tx`\(${fmt((100 * d.q) / d.Q, 0)}\,\%\ \text{of}\ ${fmt(d.Q, 2)}\ \mathrm{Ah}\)` },
        { k: T('internal resistance', '内部抵抗'), v: tx`\(${fmt(d.R * 1000, 0)}\ \mathrm{m\Omega}\)` },
        { k: T(tx`voltage lost and heat made, \(IR\) and \(I^2R\)`, tx`失われる電圧と発熱、\(IR\) と \(I^2R\)`), v: tx`\(${fmt(I * d.R, 2)}\ \mathrm{V},\ ${fmt(I * I * d.R, 1)}\ \mathrm{W}\)`, tone: I * I * d.R > 3 ? 'warn' : undefined },
        { k: T('running time', '持続時間'), v: d.q / I >= 1 ? tx`\(${fmt(d.q / I, 1)}\ \mathrm{h}\)` : tx`\(${fmt((60 * d.q) / I, 0)}\ \mathrm{min}\)` },
      ], T('The charge is not lost, only out of reach: let the cell rest or warm up and the voltage recovers. What is lost for good is the energy turned to heat inside the cell.', '電荷は失われたのではなく、取り出せないだけです。セルを休ませるか温めると、電圧は戻ります。本当に失われるのは、セルの中で熱に変わったエネルギーです。'));
    },
  };

  /* ================= 2. charging: constant current, then constant voltage ================= */
  D['cc-cv-charging'] = {
    render(ctx, v) {
      const C = v.c, vmax = v.vm, Tc = v.T, ch = charge(C, vmax, Tc, 0), tmax = Math.max(0.5, ch.t * 1.04), slow = charge(0.5, VMAX, 25, 0);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A charger first pushes a fixed current (\(${fmt(C * Q0, 1)}\) A here). The terminal voltage is the cell’s own voltage plus the drop across its resistance, so it reaches the limit of \(${fmt(vmax, 2)}\) V before the cell is full. From there the charger holds the voltage and the current dies away as the cell’s own voltage creeps up to meet it.`, tx`充電器はまず一定の電流（ここでは \(${fmt(C * Q0, 1)}\) A）を流します。端子電圧は、セル自身の電圧に内部抵抗での電圧降下を足したものなので、セルが満充電になる前に上限の \(${fmt(vmax, 2)}\) V に達します。そこからは充電器が電圧を一定に保ち、セル自身の電圧がそれに近づくにつれて、電流は減っていきます。`));
      const a = L.fig(c1, { x: [0, tmax], y: [0, 1.16], aspect: 0.68, maxH: 350, xlabel: T('time (hours)', '時間（時間）'), ylabel: T('fraction of full scale', 'フルスケールに対する割合') });
      a.rect(0, 0, ch.tcc, 1.16, { c: 'c3', fill: 'c3', fo: 0.09, nostroke: true, layer: 'under' });
      a.text(ch.tcc * 0.72, 1.09, T('constant current', '定電流'), { small: true }); if (ch.t - ch.tcc > tmax * 0.2) a.text((ch.tcc + ch.t) / 2, 1.09, T('constant voltage', '定電圧'), { small: true });
      a.line(ch.pts.map((p) => [p[0], p[1] / (C * Q0)]), { c: 'c2', w: 2.4 }); a.line(ch.pts.map((p) => [p[0], (p[2] - 2.8) / (4.2 - 2.8)]), { c: 'c1', w: 2.4 }); a.line(ch.pts.map((p) => [p[0], p[3]]), { c: 'c3', w: 2.8 });
      if (ch.t80 !== null) { a.vline(ch.t80, { c: 'hl', dash: '4 3' }); a.text(ch.t80, 0.06, '80 %', { small: true, anchor: 'start', dx: 5 }); }
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Time to reach 80 per cent and time to finish, against the charging current, with the present voltage limit and temperature. Doubling the current nearly halves the first; it does much less for the second, because a bigger current hits the voltage limit earlier and leaves more to the slow taper. Drag the gold point.`, tx`現在の電圧の上限と温度で、80 % に達するまでの時間と、充電が終わるまでの時間を、充電電流に対して描いています。電流を 2 倍にすると前者はほぼ半分になりますが、後者はあまり縮みません。大きな電流ほど早く電圧の上限に達し、遅い電流の減衰に残される分が増えるからです。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0.2, 3], y: [0, 6], aspect: 0.68, maxH: 350, xlabel: T('charging current (multiples of capacity, C)', '充電電流（容量の倍数、C）'), ylabel: T('time (hours)', '時間（時間）') });
      const cs = L.sample(0.2, 3, 40, (x) => x).map((q) => q[0]), runs = cs.map((x) => charge(x, vmax, Tc, 0));
      b.line(cs.map((x, i) => [x, Math.min(6, runs[i].t)]), { c: 'c1', w: 2.6 }); b.line(cs.map((x, i) => [x, runs[i].t80 === null ? NaN : Math.min(6, runs[i].t80)]).filter((q) => !isNaN(q[1])), { c: 'c3', w: 2.6 });
      b.line(cs.map((x) => [x, Math.min(6, 0.8 / x)]), { c: 'muted', w: 1.3, dash: '4 4' });
      b.handle(C, Math.min(6, ch.t), { c: 'hl', axis: 'x', bounds: [0.2, 3, 0, 6], label: T('charging current', '充電電流'), onDrag: (x) => ctx.set('c', clamp(Math.round(x * 20) / 20, 0.2, 3)) });
      L.legend(ctx.host, [{ c: 'c2', label: T('current', '電流') }, { c: 'c1', label: T('terminal voltage (2.8 to 4.2 V); time to finish', '端子電圧（2.8 から 4.2 V）、終了までの時間') }, { c: 'c3', label: T('state of charge; time to 80 %', '充電状態、80 % までの時間') }, { c: 'muted', dash: true, label: T('80 % if current never tapered', '電流が減らない場合の 80 %') }]);
      ctx.readout([
        { k: T('to 80 %, to finish', '80 % まで、終了まで'), v: ch.t80 === null ? tx`\(\text{—},\ ${fmt(ch.t * 60, 0)}\ \mathrm{min}\)` : tx`\(${fmt(ch.t80 * 60, 0)},\ ${fmt(ch.t * 60, 0)}\ \mathrm{min}\)`, tone: 'key' },
        { k: T('charge in at the end of constant current', '定電流の終わりで入った電荷'), v: tx`\(${fmt(100 * (ch.pts.find((p) => p[0] >= ch.tcc) || ch.pts[ch.pts.length - 1])[3], 0)}\,\%\)` },
        { k: T('stored when finished (of 3.0 Ah)', '終了時に蓄えた電荷（3.0 Ah に対して）'), v: tx`\(${fmt(100 * ch.s, 0)}\,\%\)`, tone: vmax < 4.15 ? 'good' : undefined },
        { k: T('heat made in the cell', 'セル内の発熱'), v: tx`\(${fmt(ch.heat, 2)}\ \mathrm{Wh}\)` },
        { k: T('peak heating', '発熱のピーク'), v: tx`\(${fmt((C * Q0) ** 2 * ch.R, 1)}\ \mathrm{W}\)`, tone: (C * Q0) ** 2 * ch.R > 2.5 ? 'warn' : undefined },
      ], T(tx`Stopping at a lower voltage gives up some capacity (4.10 V stores about nine tenths) and in return the cell lasts far more cycles, because the reactions that age it run fastest at high voltage. This is what an “80 per cent limit” setting on a phone or car does.`, tx`低い電圧で止めると容量を少し失います（4.10 V では約 9 割）が、その代わりにセルははるかに多くの回数の充放電に耐えます。セルを劣化させる反応は、高い電圧で最も速く進むからです。スマートフォンや自動車の「80 % 上限」の設定は、これを行っています。`));
    },
  };

  /* ================= 3. inside the cell: the jelly roll (3D) ================= */
  function buildCell(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.1, T0 = PI / 2, CUT = PI * 1.5;       // 1 unit = 10 mm; axis along z
    const steel = S.mat('#cfd3d8', { metal: 1, rough: 0.28 }), sleeve = S.mat('#1f6f78', { rough: 0.45, coat: 0.6 }), gasket = S.mat('#22262b', { rough: 0.7 }), white = S.mat('#eceae4', { rough: 0.8, coat: 0 });
    const alu = S.mat('#c9ccd1', { metal: 0.9, rough: 0.4 }), nickel = S.mat('#b9b6ae', { metal: 1, rough: 0.35 });
    const lathe = (pts, mat, t0 = T0, len = CUT) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0] * K, q[1] * K)), 72, t0, len).rotateX(PI / 2), mat); m.castShadow = true; g.add(m); return m; };
    // steel can (0.25 mm wall, crimped over the cap) inside a printed sleeve; z from 0 (bottom) to 65 mm
    lathe([[0.01, 0], [9.0, 0], [9.0, 59.5], [8.5, 60.2], [9.0, 61], [9.0, 64.2], [7.4, 64.6], [7.4, 64.3], [8.75, 64], [8.75, 61.2], [8.2, 60.2], [8.75, 59.4], [8.75, 0.25], [0.01, 0.25]], steel);
    lathe([[7.2, -0.2], [9.22, -0.2], [9.22, 64.5], [7.6, 64.9], [7.6, 64.78], [9.1, 64.4], [9.1, -0.08], [7.2, -0.08]], sleeve);
    // top cap: positive button with vent holes, burst disc and current-interrupt disc, sealed by a gasket
    lathe([[0.01, 65], [3.4, 65], [3.9, 64.5], [4.6, 63.2], [7.2, 63.2], [7.2, 62.9], [4.4, 62.9], [3.7, 64.2], [3.2, 64.7], [0.01, 64.7]], steel);
    lathe([[0.01, 62.5], [7.3, 62.5], [7.3, 62.7], [0.01, 62.7]], alu); lathe([[0.01, 61.9], [5.0, 61.9], [5.0, 62.1], [0.01, 62.1]], alu);
    lathe([[7.3, 61.3], [8.7, 61.3], [8.7, 63.9], [7.45, 63.9], [7.45, 63.5], [8.3, 63.5], [8.3, 61.7], [7.3, 61.7]], gasket);
    lathe([[2.2, 60.6], [8.1, 60.6], [8.1, 60.9], [2.2, 60.9]], white); lathe([[2.2, 0.5], [8.6, 0.5], [8.6, 0.8], [2.2, 0.8]], white);
    // tabs: aluminium from the cathode up to the cap, nickel from the anode down to the can
    const strip = (pts, mat) => { const m = S.tube(pts.map((p) => [p[0] * K, p[1] * K, p[2] * K]), { r: 0.012, add: false }); m.material = mat; m.scale.set(1, 1, 1); g.add(m); };
    for (const dy of [-1.2, -0.4, 0.4, 1.2]) { strip([[4.2, dy, 59.5], [4.2, dy, 61.2], [2.2, dy, 61.6], [1.2, dy, 61.9]], alu); strip([[7.6, dy, 1.6], [7.6, dy, 0.9], [3, dy, 0.45], [0.6, dy, 0.3]], nickel); }
    // the jelly roll itself is rebuilt whenever the coating thickness changes
    const rollG = new TH.Group(); g.add(rollG);
    const mats = { cath: S.mat('#3a3d44', { rough: 0.75, coat: 0 }), an: S.mat('#26272a', { rough: 0.8, coat: 0 }), sepm: S.mat('#f1efe8', { rough: 0.9, coat: 0 }) };
    const band = (r0, pitch, thick, z0, z1, mat) => {
      const pos = [], idx = [], turns = Math.floor((CELL.ro - thick - r0) / pitch), dth = TAU / 60; let vi = 0;
      for (let k = 0; k < turns; k++) {
        const n = Math.round(CUT / dth), base = vi;
        for (let i = 0; i <= n; i++) { const th = T0 + (i / n) * CUT, r = r0 + pitch * (k + th / TAU), c = Math.cos(th), s = Math.sin(th); for (const [rr, z] of [[r, z0], [r + thick, z0], [r, z1], [r + thick, z1]]) pos.push(rr * s * K, -rr * c * K, z * K); vi += 4; }
        for (let i = 0; i < n; i++) { const a = base + 4 * i, b = a + 4; idx.push(a + 2, a + 3, b + 3, a + 2, b + 3, b + 2, a + 1, b + 1, b + 3, a + 1, b + 3, a + 3, a, a + 2, b + 2, a, b + 2, b); }
        const e0 = base, e1 = base + 4 * n; idx.push(e0, e0 + 1, e0 + 3, e0, e0 + 3, e0 + 2, e1, e1 + 3, e1 + 1, e1, e1 + 2, e1 + 3);
      }
      const geo = new TH.BufferGeometry(); geo.setAttribute('position', new TH.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new TH.Mesh(geo, mat); m.castShadow = true; rollG.add(m); return m;
    };
    const setRoll = (tc) => {
      for (const c of [...rollG.children]) { c.geometry.dispose(); rollG.remove(c); }
      const q = roll(tc), p = q.pitch, tA = (2 * q.ta + CELL.cu) / 1000, tC = (2 * tc + CELL.al) / 1000, tS = CELL.sep / 1000;
      band(CELL.ri, p, tA, 1.4, 59.6, mats.an); band(CELL.ri + tA, p, tS, 1.0, 60.0, mats.sepm); band(CELL.ri + tA + tS, p, tC, 2.0, 59.0, mats.cath); band(CELL.ri + tA + tS + tC, p, tS, 1.0, 60.0, mats.sepm);
      S.invalidate();
    };
    const setSoc = (s) => { mats.an.color.set('#26272a').lerp(new TH.Color('#b88a2a'), s); mats.cath.color.set('#2b2d33').lerp(new TH.Color('#4a4e57'), 1 - s); S.invalidate(); };
    lathe([[1.75, 1.2], [1.95, 1.2], [1.95, 60], [1.75, 60]], steel);                 // centre pin
    S.add(g);
    return { g, setRoll, setSoc, K };
  }
  D['cell-jelly-roll'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const tc = v.tc, q = roll(tc), soc = v.soc / 100;
      L.setText(st.cap1, T(tx`An 18650 cell, 18 mm across and 65 mm tall, cut open. Inside the steel can two coated foils and two plastic separators are wound together about \(${fmt(q.turns, 0)}\) times: a strip \(${fmt(q.len, 0)}\) mm long. The graphite side turns from grey to gold as lithium fills it; the cap carries a vent and a disc that breaks the circuit if pressure builds.`, tx`直径 18 mm、高さ 65 mm の 18650 セルの断面です。鋼の缶の中で、活物質を塗った 2 枚の箔と 2 枚の樹脂のセパレーターが一緒に約 \(${fmt(q.turns, 0)}\) 回巻かれています。長さ \(${fmt(q.len, 0)}\) mm の帯です。黒鉛の側は、リチウムで満たされるにつれて灰色から金色に変わります。蓋には、ガス抜き弁と、内圧が上がると回路を切る板があります。`));
      L.setText(st.cap2, T(tx`One turn of the winding, magnified: copper foil coated with graphite, separator, aluminium foil coated with the metal oxide, separator. On charge, lithium ions leave the oxide, cross the separator through the liquid electrolyte and slot between the graphite layers, while the electrons go round through the charger.`, tx`巻きの 1 周分を拡大した図です。黒鉛を塗った銅箔、セパレーター、金属酸化物を塗ったアルミニウム箔、セパレーターの順です。充電のとき、リチウムイオンは酸化物を出て、電解液を通ってセパレーターを横切り、黒鉛の層の間に入ります。その間、電子は充電器を通って回ります。`));
      st.g2.replaceChildren();
      const W = q.pitch * 1000, a = L.fig(st.g2, { x: [0, W], y: [0, 1], aspect: 0.36, maxH: 190, xlabel: T('thickness through one turn (µm)', '1 周分の厚さ方向（µm）'), grid: false, ticksY: [] });
      let x = 0; const lay = (w, c, fo, name) => { a.rect(x, 0, w, 1, { c, fill: c, fo, w: 0.6 }); if (name && w > W * 0.09) a.text(x + w / 2, 0.9, name, { small: true }); x += w; };
      const xa0 = 0; lay(q.ta, 'ink', 0.5, T('graphite', '黒鉛')); lay(CELL.cu, 'c2', 0.9); lay(q.ta, 'ink', 0.5, T('graphite', '黒鉛')); const xs0 = x; lay(CELL.sep, 'grid', 0.5); const xc0 = x; lay(tc, 'c1', 0.45, T('oxide', '酸化物')); lay(CELL.al, 'muted', 0.9); lay(tc, 'c1', 0.45, T('oxide', '酸化物')); lay(CELL.sep, 'grid', 0.5);
      { const N = 40, nA = Math.round(N * soc); let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < N; i++) { const inA = i < nA, xx = inA ? q.ta + CELL.cu + rnd() * q.ta : xc0 + rnd() * tc; a.dot(xx, 0.08 + rnd() * 0.7, { c: 'hl', r: 3 }); } }
      a.arrow([xc0 + tc * 0.3, 0.5], [xs0 - q.ta * 0.3, 0.5], { c: 'hl', w: 1.8 }); a.text((xs0 + xc0) / 2, 0.5, T('charge', '充電'), { small: true, dy: -10 });
      L.setText(st.cap3, T(tx`Capacity and resistance against the thickness of the coating, for the same can. A thick coating stores more per turn but there are fewer turns, less foil area, and ions have further to go: an energy cell. A thin coating gives up capacity for low resistance: a power-tool cell. Drag the gold point.`, tx`同じ缶で、塗布した層の厚さに対する容量と抵抗です。厚く塗ると 1 周あたりに蓄えられる量は増えますが、巻き数と箔の面積は減り、イオンの移動距離は伸びます。これがエネルギー重視のセルです。薄く塗ると、容量を譲る代わりに抵抗が下がります。これが電動工具用のセルです。金色の点をドラッグしてください。`));
      st.g3.replaceChildren();
      const b = L.fig(st.g3, { x: [30, 120], y: [0, 1.08], aspect: 0.5, maxH: 240, xlabel: T('cathode coating thickness (µm)', '正極の塗布の厚さ（µm）'), ylabel: T('fraction of the largest value', '最大値に対する割合') });
      const capM = roll(120).cap, rM = roll(120).R;
      b.line(L.sample(30, 120, 90, (t) => roll(t).cap / capM), { c: 'c1', w: 2.6 }); b.line(L.sample(30, 120, 90, (t) => roll(t).R / rM), { c: 'c2', w: 2.6 });
      b.handle(tc, q.cap / capM, { c: 'hl', axis: 'x', bounds: [30, 120, 0, 1.08], label: T('coating thickness', '塗布の厚さ'), onDrag: (xx) => ctx.set('tc', clamp(Math.round(xx / 2) * 2, 30, 120)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('capacity', '容量') }, { c: 'c2', label: T('internal resistance', '内部抵抗') }, { c: 'hl', kind: 'dot', label: T('lithium ions', 'リチウムイオン') }]);
      ctx.readout([
        { k: T('turns, strip length, coated area', '巻き数、帯の長さ、塗布面積'), v: tx`\(${fmt(q.turns, 1)},\ ${fmt(q.len, 0)}\ \mathrm{mm},\ ${fmt(q.area, 0)}\ \mathrm{cm^2}\)` },
        { k: T('capacity and energy', '容量とエネルギー'), v: tx`\(${fmt(q.cap, 2)}\ \mathrm{Ah},\ ${fmt(q.wh, 1)}\ \mathrm{Wh}\)`, tone: 'key' },
        { k: T('mass, specific energy', '質量、重量エネルギー密度'), v: tx`\(${fmt(q.mass, 0)}\ \mathrm{g},\ ${fmt(q.whkg, 0)}\ \mathrm{Wh/kg}\)` },
        { k: T('internal resistance, sag at 10 A', '内部抵抗、10 A での電圧降下'), v: tx`\(${fmt(q.R * 1000, 0)}\ \mathrm{m\Omega},\ ${fmt(q.R * 10, 2)}\ \mathrm{V}\)`, tone: q.R * 10 > 0.5 ? 'warn' : 'good' },
      ], T('Cylindrical cells are wound because winding is fast: the strip is coated, dried and rolled at metres per second. The same layers stacked flat make the pouch cell in a phone.', '円筒形のセルが巻いて作られるのは、巻くのが速いからです。帯は毎秒数メートルの速さで塗布、乾燥、巻き取りされます。同じ層を平らに重ねたものが、スマートフォンのパウチ型セルです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.15 : 1.0, maxH: 640, camera: [5.8, -13.6, 7.9], target: [0, 0, 3.3], fov: 30,
        label: T('3D cutaway of a cylindrical lithium-ion cell. Drag to rotate.', '円筒形リチウムイオンセルの 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.cell = buildCell(S); st.tc = null;
          S.label(T('positive cap and vent', '正極の蓋とガス抜き弁'), [1.7, -1.3, 6.55], { small: true }); S.label(T('gasket', 'ガスケット'), [-1.7, 0, 6.2], { small: true }); S.label(T('jelly roll', '巻回体'), [1.6, -1.2, 3.6], { small: true });
          S.label(T('steel can (negative)', '鋼の缶（負極）'), [-1.9, 0, 1.6], { small: true }); S.label(T('centre pin', 'センターピン'), [1.5, -1.2, 5.4], { small: true }); S.label(T('sleeve', '外装フィルム'), [-1.8, 0, 4.2], { small: true });
        },
        update(S) { if (st.tc !== tc) { st.cell.setRoll(tc); st.tc = tc; } st.cell.setSoc(soc); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-10, 10], y: [-10, 10], equal: true, maxH: 360, axes: false, grid: false });
          f2.circle(0, 0, 9, { c: 'ink', w: 2 }); f2.line(L.sample(0, q.turns * TAU, 900, (th) => { const r = CELL.ri + (q.pitch * th) / TAU; return [r * Math.cos(th), r * Math.sin(th)]; }), { c: 'c1', w: 1 });
        },
      });
    },
  };
})();
