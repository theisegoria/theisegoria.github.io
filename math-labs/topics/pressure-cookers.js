'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Water boils when its vapour pressure equals the pressure on it. Vapour pressure from the Antoine equation
   * (mmHg, deg C): log10 p = 8.07131 - 1730.63/(233.426 + T) below 100 C and 8.14019 - 1810.94/(244.485 + T) above.
   * Air pressure with height: p = 101.325 (1 - 2.25577e-5 h)^5.25588 kPa.
   * A weight of mass m on a vent of bore d lifts when gauge pressure x area = m g.
   * Cooking reactions are taken to double in rate for every 10 K (Q10 = 2).
   * Warm-up: all the heat goes into water and pot until the regulated temperature; after that it boils water away
   * at P / h_fg.
   */
  const KPA = 0.1333224;
  const pvap = (Tc) => KPA * 10 ** (Tc < 100 ? 8.07131 - 1730.63 / (233.426 + Tc) : 8.14019 - 1810.94 / (244.485 + Tc));      // kPa
  function tboil(p) { let a = 0, b = 250; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (pvap(m) < p) a = m; else b = m; } return (a + b) / 2; }
  const pAir = (h) => 101.325 * (1 - 2.25577e-5 * h) ** 5.25588;
  const speed = (Tc) => 2 ** ((Tc - 100) / 10);
  const valveP = (grams, boreMm) => ((grams / 1000) * G) / (PI * (boreMm / 2000) ** 2) / 1000;                                   // kPa gauge
  const lidForce = (pg, diaM = 0.22) => pg * 1000 * PI * (diaM / 2) ** 2;                                                         // N
  const HFG = 2.2e6, CW = 4186, CPOT = 900;
  function warmup(kg, watts, pg, hAlt = 0, potKg = 1.5, T0 = 20) { const Treg = tboil(pAir(hAlt) + pg), C = kg * CW + potKg * CPOT, t1 = (C * (Treg - T0)) / watts, t100 = (C * (Math.min(Treg, tboil(pAir(hAlt))) - T0)) / watts; return { Treg, t1, t100, C, steam: watts / HFG, at: (t) => (t < t1 ? T0 + (watts * t) / C : Treg) }; }
  function cooked(kg, watts, pg, tEnd, hAlt = 0) { const w = warmup(kg, watts, pg, hAlt); let s = 0; const n = 600; for (let i = 0; i < n; i++) s += speed(w.at(((i + 0.5) / n) * tEnd)) * (tEnd / n); return s; }      // seconds of boiling-at-100 equivalent
  const M = { pvap, tboil, pAir, speed, valveP, lidForce, warmup, cooked, HFG, CW, G };
  (window.LabModels = window.LabModels || {})['pressure-cookers'] = M;

  /* ================= 1. boiling point against pressure ================= */
  D['boiling-pressure'] = {
    render(ctx, v) {
      const pa = pAir(v.h), pg = v.pg, p = pa + pg, Tb = tboil(p), Topen = tboil(pa);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The pressure at which water and its vapour can exist together at each temperature. Below the curve water boils away; above it steam condenses. An open pot sits at the pressure of the air (dashed, here at \(${fmt(v.h, 0)}\) m), so its water cannot get hotter than where that line meets the curve. A sealed pot moves up the curve. Drag the gold point.`, tx`各温度で、水とその蒸気が共存できる圧力です。曲線より下では水は沸騰して蒸発し、上では蒸気が凝縮します。ふたのない鍋は大気圧（破線、ここでは高度 \(${fmt(v.h, 0)}\) m）にあるので、水の温度は、その線が曲線と交わる点より高くなれません。密閉した鍋は、曲線に沿って上へ移ります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [60, 135], y: [0, 320], aspect: 0.7, maxH: 350, xlabel: T('temperature (°C)', '温度（°C）'), ylabel: T('absolute pressure (kPa)', '絶対圧（kPa）') });
      const cv = L.sample(60, 135, 150, (t) => pvap(t)); a.area(cv, { c: 'c1', fo: 0.1, base: 0 }); a.line(cv, { c: 'c1', w: 2.8 }); a.hline(pa, { c: 'muted', dash: '5 4' });
      a.text(64, 250, T('liquid', '液体'), { small: true, anchor: 'start' }); a.text(128, 40, T('vapour', '蒸気'), { small: true, anchor: 'end' }); a.dot(Topen, pa, { c: 'c2', r: 5 });
      a.handle(Tb, p, { c: 'hl', axis: 'y', bounds: [60, 135, pa, pa + 150], label: T('pressure in the pot', '鍋の中の圧力'), onDrag: (x, y) => ctx.set('pg', clamp(Math.round((y - pa) / 5) * 5, 0, 150)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How much faster food cooks than in water at 100 °C, taking the usual rule that the reactions double in speed for every 10 degrees. The same curve read downwards is why cooking is slow on a mountain: the dots mark an open pot at sea level, at 3000 m and on the summit of Everest.`, tx`100 °C の水の中と比べて、食品がどれだけ速く調理されるかを示します。反応の速さは 10 度ごとに 2 倍になるという一般的な目安を使っています。同じ曲線を下向きに読むと、山の上で調理に時間がかかる理由が分かります。点は、海面、標高 3000 m、エベレストの山頂での、ふたのない鍋を表します。`));
      const b = L.fig(c2, { x: [40, 260], y: [0, 6.5], aspect: 0.7, maxH: 350, xlabel: T('absolute pressure (kPa)', '絶対圧（kPa）'), ylabel: T('cooking speed (1 = at 100 °C)', '調理の速さ（1 = 100 °C）') });
      b.line(L.sample(32, 260, 150, (q) => speed(tboil(q))), { c: 'c2', w: 2.8 }); b.hline(1, { c: 'muted', dash: '4 4' });
      [0, 3000, 8849].forEach((h) => b.dot(pAir(h), speed(tboil(pAir(h))), { c: 'c3', r: 4.5 })); b.dot(p, speed(Tb), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('boiling curve', '沸騰曲線') }, { c: 'muted', dash: true, label: T('air pressure', '大気圧') }, { c: 'c2', label: T('open pot here; cooking speed', 'ここでのふたのない鍋、調理の速さ') }, { c: 'c3', kind: 'dot', label: T('open pots at three heights', '三つの高度でのふたのない鍋') }]);
      ctx.readout([
        { k: T('air pressure, open pot boils at', '大気圧、ふたのない鍋の沸点'), v: tx`\(${fmt(pa, 1)}\ \mathrm{kPa},\ ${fmt(Topen, 1)}\ ^\circ\mathrm{C}\)` },
        { k: T('pressure in the sealed pot', '密閉した鍋の中の圧力'), v: tx`\(${fmt(p, 0)}\ \mathrm{kPa}\ (${fmt(p / 101.325, 2)}\ \mathrm{atm})\)` },
        { k: T('water in it boils at', 'その中の水の沸点'), v: tx`\(${fmt(Tb, 1)}\ ^\circ\mathrm{C}\)`, tone: 'key' },
        { k: T('cooking speed against the open pot here', 'ここでのふたのない鍋と比べた調理の速さ'), v: tx`\(\times${fmt(speed(Tb) / speed(Topen), 1)}\)`, tone: 'good' },
        { k: T('a 60 minute simmer becomes', '60 分の煮込みにかかる時間'), v: tx`\(${fmt((60 * speed(Topen)) / speed(Tb), 0)}\ \mathrm{min}\)` },
      ], T('The extra temperature is the whole point. Boiling water harder in an open pot adds nothing: the surplus heat only makes steam, and the water stays at its boiling point.', '大切なのは、上がった温度だけです。ふたのない鍋で火を強めても、何も変わりません。余分な熱は蒸気を作るだけで、水は沸点にとどまります。'));
    },
  };

  /* ================= 2. the cooker and its weighted valve (3D) ================= */
  function buildCooker(S) {
    const TH = S.THREE, g = new TH.Group(), K = 10, T0 = PI / 2, CUT = PI * 1.5;                 // 1 unit = 100 mm
    const lathe = (pts, mat, t0 = T0, len = CUT, parent = g) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0] * K, q[1] * K)), 72, t0, len).rotateX(PI / 2), mat); m.castShadow = true; parent.add(m); return m; };
    const steel = S.mat('#d3d7dc', { metal: 1, rough: 0.2 }), alu = S.mat('#b9bdc3', { metal: 0.9, rough: 0.42 }), black = S.mat('#1a1b1e', { rough: 0.55 }), rubber = S.mat('#c2552d', { rough: 0.8, coat: 0 }), water = S.mat('#6fb2d9', { rough: 0.1, coat: 1, opacity: 0.5 });
    // body: 22 cm pot with a thick base, rolled rim with locking lugs
    lathe([[0.001, 0], [0.108, 0], [0.112, 0.006], [0.112, 0.128], [0.118, 0.132], [0.118, 0.137], [0.109, 0.137], [0.109, 0.012], [0.105, 0.009], [0.001, 0.009]], steel);
    lathe([[0.001, -0.006], [0.1, -0.006], [0.1, 0], [0.001, 0]], alu, 0, TAU);
    // lid: shallow dome, flange, and the gasket seated under it
    const lid = new TH.Group(); g.add(lid);
    lathe([[0.001, 0.168], [0.03, 0.167], [0.07, 0.16], [0.1, 0.148], [0.121, 0.141], [0.124, 0.134], [0.1215, 0.134], [0.1195, 0.139], [0.099, 0.1455], [0.069, 0.1575], [0.03, 0.1645], [0.001, 0.1655]], steel, T0, CUT, lid);
    lathe([[0.1095, 0.1372], [0.118, 0.1372], [0.118, 0.1415], [0.1095, 0.1415]], rubber, T0, CUT, lid);
    // handles
    for (const [x, len] of [[-0.19, 0.16], [0.145, 0.05]]) for (const z of [0.118, 0.152]) { const m = new TH.Mesh(new TH.BoxGeometry(len * K, 0.34, 0.26), black); m.position.set(x * K, 0, z * K); m.castShadow = true; g.add(m); }
    // vent pipe, the weight that sits on it, and the safety plug
    const pipe = new TH.Mesh(new TH.CylinderGeometry(0.04, 0.04, 0.3, 20).rotateX(PI / 2), steel); pipe.position.z = 0.168 * K + 0.15; g.add(pipe);
    const weight = new TH.Group(); g.add(weight);
    const wm = new TH.Mesh(new TH.LatheGeometry([[0.04, 0], [0.19, 0], [0.19, 0.12], [0.13, 0.3], [0.07, 0.36], [0.03, 0.36]].map((q) => new TH.Vector2(q[0], q[1])), 40, T0, CUT).rotateX(PI / 2), S.mat('#2a2c30', { metal: 0.7, rough: 0.4 })); wm.castShadow = true; wm.scale.setScalar(1.45); weight.add(wm);
    const plug = new TH.Mesh(new TH.CylinderGeometry(0.06, 0.06, 0.07, 20).rotateX(PI / 2), rubber); plug.position.set(-0.55, 0, 0.158 * K + 0.06); g.add(plug);
    // water, and a rack with something to cook
    const wat = lathe([[0.001, 0.0092], [0.1085, 0.0125], [0.1085, 0.055], [0.001, 0.055]], water, T0, CUT); wat.castShadow = false;
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + 0.4, m = new TH.Mesh(new TH.SphereGeometry(0.2, 20, 14), S.mat(['#c9a25b', '#b98a4a', '#d5b06a'][k % 3], { rough: 0.8 })); m.scale.set(1, 0.8, 0.7); m.position.set(0.52 * Math.cos(a), 0.52 * Math.sin(a), 0.5); g.add(m); }
    { const rack = new TH.Mesh(new TH.RingGeometry(0.08, 1.02, 60, 1, T0, CUT), S.mat('#9aa0a8', { metal: 1, rough: 0.35, side: 2 })); rack.position.z = 0.36; g.add(rack); for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 2.2, leg = new TH.Mesh(new TH.CylinderGeometry(0.025, 0.025, 0.27, 10).rotateX(PI / 2), steel); leg.position.set(0.85 * Math.cos(a), 0.85 * Math.sin(a), 0.225); g.add(leg); } }
    const jets = S.lines([], { c: 'muted', opacity: 0.8, w: 1.6 });
    S.add(g);
    return { g, weight, jets, K };
  }
  D['weighted-valve'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const pg = valveP(v.m, v.d), Tb = tboil(101.325 + pg), F = lidForce(pg), steam = v.w / HFG; st.q = { pg, steam };
      L.setText(st.cap1, T(tx`A pressure cooker cut open. The lid locks under lugs on the rim and a rubber ring seals the joint. The only way out for steam is a narrow pipe in the lid, and a \(${v.m}\) g weight sits on top of it. When the steam pushes up on the weight harder than gravity pulls it down, the weight lifts, steam escapes, and the pressure can rise no further.`, tx`圧力鍋の断面です。ふたは縁の突起の下にはまって固定され、ゴムの輪が継ぎ目を密閉します。蒸気の出口は、ふたにある細い管だけで、その上に \(${v.m}\) g のおもりが載っています。蒸気がおもりを押し上げる力が、重力がおもりを引き下げる力を超えると、おもりが浮いて蒸気が逃げ、圧力はそれ以上上がりません。`));
      L.setText(st.cap2, T(tx`The pressure a weight holds against its mass, for four bores of pipe. The force of the steam is pressure times the area of the bore, so a narrow pipe needs only a small weight. Drag the gold point.`, tx`おもりが保つ圧力を、その質量に対して、管の内径四通りについて描いています。蒸気の力は圧力に管の断面積を掛けたものなので、細い管なら小さなおもりで足ります。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [20, 120], y: [0, 200], aspect: 0.8, maxH: 400, xlabel: T('mass of the weight (g)', 'おもりの質量（g）'), ylabel: T('pressure above the air outside (kPa)', '外気より高い圧力（kPa）') });
      g.rect(20, 55, 100, 55, { c: 'c3', fill: 'c3', fo: 0.1, nostroke: true, layer: 'under' }); g.text(118, 106, T('usual range', '普通の範囲'), { small: true, anchor: 'end' });
      [2.5, 3, 3.5, 4].forEach((d) => g.line(L.sample(20, 120, 20, (m) => Math.min(200, valveP(m, d))), { c: Math.abs(d - v.d) < 0.1 ? 'c1' : 'muted', w: Math.abs(d - v.d) < 0.1 ? 2.8 : 1.3 }));
      g.handle(v.m, Math.min(200, pg), { c: 'hl', axis: 'x', bounds: [20, 120, 0, 200], label: T('mass of the weight', 'おもりの質量'), onDrag: (x) => ctx.set('m', clamp(Math.round(x), 20, 120)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('this bore', 'この内径') }, { c: 'muted', label: T('bores from 2.5 to 4 mm', '内径 2.5 から 4 mm') }]);
      ctx.readout([
        { k: T('pressure the weight holds', 'おもりが保つ圧力'), v: tx`\(${fmt(pg, 0)}\ \mathrm{kPa}\ (${fmt(pg / 6.895, 1)}\ \mathrm{psi})\)`, tone: 'key' },
        { k: T('water boils at', '水の沸点'), v: tx`\(${fmt(Tb, 1)}\ ^\circ\mathrm{C}\)` },
        { k: T('force trying to lift the lid', 'ふたを持ち上げようとする力'), v: tx`\(${fmt(F / 1000, 1)}\ \mathrm{kN}\ (${fmt(F / G, 0)}\ \mathrm{kg})\)`, tone: 'warn' },
        { k: T('steam vented once it is up to pressure', '圧力が上がった後に逃げる蒸気'), v: tx`\(${fmt(steam * 60000, 0)}\ \mathrm{g/min}\)` },
        { k: T('half a litre of water lasts', '0.5 リットルの水がもつ時間'), v: tx`\(${fmt(0.5 / steam / 60, 0)}\ \mathrm{min}\)`, tone: 0.5 / steam / 60 < 15 ? 'warn' : undefined },
      ], T('Once the weight is rocking, turning the heat up makes nothing hotter: it only boils the water away faster. The rubber plug beside the vent is a second way out, pushed out if the pipe ever blocks.', 'おもりが揺れ始めたら、火を強めても温度は上がりません。水が速く蒸発するだけです。蒸気口のそばのゴムの栓は第二の出口で、管が詰まったときに押し出されます。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.8, maxH: 540, camera: [4.2, -6.4, 4.6], target: [-0.2, 0, 0.95], fov: 30,
        label: T('3D cutaway of a pressure cooker. Drag to rotate.', '圧力鍋の 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.ck = buildCooker(S); st.t = 0;
          S.label(T('weight', 'おもり'), [0.75, 0, 2.2], { small: true }); S.label(T('gasket', 'パッキン'), [0.2, -1.9, 1.62], { small: true }); S.label(T('safety plug', '安全栓'), [-1.5, 0, 1.95], { small: true }); S.label(T('water', '水'), [1.3, -1.2, 0.3], { small: true });
          const draw = (dt) => { st.t += dt; const lift = 0.05 + 0.025 * Math.sin(st.t * 9); st.ck.weight.position.z = 1.7 + lift; st.ck.weight.rotation.z = 0.5 * Math.sin(st.t * 2.3);
            const seg = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + st.t * 0.6, ph = (st.t * 1.4 + k * 0.37) % 1, r0 = 0.2 + 0.5 * ph; seg.push([[r0 * Math.cos(a), r0 * Math.sin(a), 1.9 + 0.5 * ph], [(r0 + 0.12) * Math.cos(a), (r0 + 0.12) * Math.sin(a), 2.02 + 0.5 * ph]]); } st.ck.jets.update(seg); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-16, 16], y: [-2, 24], equal: true, maxH: 320, axes: false, grid: false }); f2.poly([[-11.2, 0], [11.2, 0], [11.2, 13.7], [-11.2, 13.7]], { c: 'ink', fill: 'grid', fo: 0.4, w: 1.6 }); f2.line(L.sample(-12, 12, 40, (x) => 14 + 2.8 * Math.cos((x / 12) * PI / 2)), { c: 'ink', w: 2 }); f2.rect(-1.9, 18.6, 3.8, 3.4, { c: 'ink', fill: 'ink', fo: 0.6 }); f2.rect(-11, 0.9, 22, 4.6, { c: 'c1', fill: 'c1', fo: 0.3, w: 0 }); },
      });
    },
  };

  /* ================= 3. coming up to pressure ================= */
  D['cooker-warmup'] = {
    render(ctx, v) {
      const kg = v.kg, W = v.w, pg = v.pg, pc = warmup(kg, W, pg), op = warmup(kg, W, 0), need = v.need * 60, tmax = 3600;
      const done = (pgv) => { let a = 0, b = 4 * 3600; if (cooked(kg, W, pgv, b) < need) return Infinity; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (cooked(kg, W, pgv, m) < need) a = m; else b = m; } return (a + b) / 2; };
      const tp = done(pg), to = done(0);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Temperature of the water against time on a \(${fmt(W, 0)}\) W ring, sealed (blue) and open (red). Both climb together; the open pot stops at 100 °C and the sealed one carries on until its valve lifts. The marks show when a dish that needs \(${v.need}\) minutes at a simmer is done in each.`, tx`\(${fmt(W, 0)}\) W のコンロでの水の温度を、密閉した場合（青）とふたのない場合（赤）について、時間に対して描いています。どちらも同じように上がりますが、ふたのない鍋は 100 °C で止まり、密閉した鍋は弁が開くまで上がり続けます。印は、弱火で \(${v.need}\) 分かかる料理が、それぞれいつ仕上がるかを示します。`));
      const a = L.fig(c1, { x: [0, 80], y: [0, 130], aspect: 0.7, maxH: 350, xlabel: T('time on the heat (minutes)', '加熱時間（分）'), ylabel: T('water temperature (°C)', '水の温度（°C）') });
      a.line(L.sample(0, 80, 240, (t) => op.at(t * 60)), { c: 'c2', w: 2.2 }); a.line(L.sample(0, 80, 240, (t) => pc.at(t * 60)), { c: 'c1', w: 2.8 });
      if (to / 60 <= 80) a.vline(to / 60, { c: 'c2', dash: '4 3' }); if (tp / 60 <= 80) a.vline(tp / 60, { c: 'c1', dash: '4 3' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Total time from cold to done against the pressure the valve is set to, for this dish and this much water. The gain is large at first and then flattens: past about 100 kPa most of the time left is spent heating up, which pressure does nothing to shorten. Drag the gold point.`, tx`この料理とこの水の量で、冷たい状態から仕上がるまでの合計時間を、弁の設定圧力に対して描いています。最初は大きく短縮されますが、やがて頭打ちになります。約 100 kPa を超えると、残りの時間の大半は加熱に費やされ、圧力ではそれを短くできません。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0, 150], y: [0, Math.min(180, Math.ceil(to / 600) * 10 + 10)], aspect: 0.7, maxH: 350, xlabel: T('valve pressure above the air outside (kPa)', '外気より高い弁の圧力（kPa）'), ylabel: T('time to done (minutes)', '仕上がるまでの時間（分）') });
      b.line(L.sample(0, 150, 50, (q) => done(q) / 60), { c: 'c1', w: 2.8 }); b.line(L.sample(0, 150, 50, (q) => warmup(kg, W, q).t1 / 60), { c: 'muted', w: 1.6, dash: '5 4' });
      b.handle(pg, tp / 60, { c: 'hl', axis: 'x', bounds: [0, 150, 0, 180], label: T('valve pressure', '弁の圧力'), onDrag: (x) => ctx.set('pg', clamp(Math.round(x / 5) * 5, 0, 150)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('sealed; total time', '密閉、合計時間') }, { c: 'c2', label: T('open pot', 'ふたのない鍋') }, { c: 'muted', dash: true, label: T('time to reach pressure', '圧力に達するまでの時間') }]);
      ctx.readout([
        { k: T('cooking temperature: sealed, open', '調理の温度：密閉、ふたなし'), v: tx`\(${fmt(pc.Treg, 1)},\ ${fmt(op.Treg, 1)}\ ^\circ\mathrm{C}\)` },
        { k: T('time to reach it: sealed, open', 'そこに達する時間：密閉、ふたなし'), v: tx`\(${fmt(pc.t1 / 60, 1)},\ ${fmt(op.t1 / 60, 1)}\ \mathrm{min}\)` },
        { k: T('done after: sealed, open', '仕上がる時間：密閉、ふたなし'), v: tx`\(${fmt(tp / 60, 0)},\ ${fmt(to / 60, 0)}\ \mathrm{min}\)`, tone: 'key' },
        { k: T('energy used: sealed, open', '使うエネルギー：密閉、ふたなし'), v: tx`\(${fmt((W * tp) / 3.6e6, 2)},\ ${fmt((W * to) / 3.6e6, 2)}\ \mathrm{kWh}\)`, tone: 'good' },
      ], T('In practice the heat is turned down once the valve lifts, so the saving in energy is larger than shown: only enough is needed to make up what the pot loses to the room.', '実際には、弁が開いたら火を弱めるので、エネルギーの節約はここに示したより大きくなります。必要なのは、鍋が部屋に逃がす熱を補う分だけです。'));
    },
  };
})();
