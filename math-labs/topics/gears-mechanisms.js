'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, DEG = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mod = (x, m) => ((x % m) + m) % m;

  /* ---------- model (pure, checked by checks/gears-mechanisms.cjs) ---------- */
  const inv = (a) => Math.tan(a) - a;                       // the involute function
  const involutePoint = (rb, t) => [rb * (Math.cos(t) + t * Math.sin(t)), rb * (Math.sin(t) - t * Math.cos(t))];
  // standard gear of z teeth, module m, pressure angle a0
  function gear(z, m, a0) { const r = m * z / 2, rb = r * Math.cos(a0); return { z, m, a0, r, rb, ra: r + m, rf: r - 1.25 * m }; }
  // half the angular thickness of a tooth at radius R (involute part, R >= rb)
  const halfThick = (G, R) => Math.PI / (2 * G.z) + inv(G.a0) - inv(Math.acos(clamp(G.rb / R, -1, 1)));
  // outline of a gear rotated so tooth k is centred at angle rot + 2 pi k / z; optional radii override (for an internal gear drawn as its spaces)
  function outline(G, rot, cx = 0, cy = 0, o = {}) {
    const ra = o.ra ?? G.ra, rf = o.rf ?? G.rf, pts = [], n = o.n ?? 8;
    const rLow = Math.max(G.rb, rf), P = (R, a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    for (let k = 0; k < G.z; k++) {
      const c = rot + TAU * k / G.z;
      if (rf < G.rb) pts.push(P(rf, c - halfThick(G, G.rb)));
      for (let i = 0; i <= n; i++) { const R = rLow + (ra - rLow) * i / n; pts.push(P(R, c - halfThick(G, R))); }
      const tA = halfThick(G, ra); for (let i = 1; i < 3; i++) pts.push(P(ra, c - tA + 2 * tA * i / 3));
      for (let i = n; i >= 0; i--) { const R = rLow + (ra - rLow) * i / n; pts.push(P(R, c + halfThick(G, R))); }
      if (rf < G.rb) pts.push(P(rf, c + halfThick(G, G.rb)));
      const a1 = c + halfThick(G, G.rb), a2 = c + TAU / G.z - halfThick(G, G.rb);
      for (let i = 1; i < 4; i++) pts.push(P(rf, a1 + (a2 - a1) * i / 4));
    }
    pts.push(pts[0]);
    return pts;
  }
  // a meshing pair: gear 1 at the origin, gear 2 on the +x axis, centres pulled apart by da (in modules)
  function mesh(z1, z2, a0, da = 0, m = 1) {
    const g1 = gear(z1, m, a0), g2 = gear(z2, m, a0), a0d = g1.r + g2.r, a = a0d + da * m;
    const ap = Math.acos(a0d * Math.cos(a0) / a), Lline = a * Math.sin(ap);
    const sMax = Math.sqrt(g1.ra ** 2 - g1.rb ** 2), sMin = Lline - Math.sqrt(g2.ra ** 2 - g2.rb ** 2), pb = Math.PI * m * Math.cos(a0);
    return { g1, g2, a, ap, L: Lline, sMin, sMax, pb, eps: (sMax - sMin) / pb, T1: [g1.rb * Math.cos(ap), g1.rb * Math.sin(ap)], u: [Math.sin(ap), -Math.cos(ap)], backlash: 2 * da * m * Math.tan(ap) };
  }
  // contact state for gear-1 rotation phi (clockwise positive): the distances s along the line of action, and gear 2's rotation
  function contacts(M, phi) {
    const { g1, g2, ap } = M, out = [];
    const b0 = -phi - halfThick(g1, g1.rb);             // base angle of tooth 0's clockwise-side flank
    const s0 = g1.rb * (ap - b0);                        // unwrapped contact distance for tooth 0
    for (let k = -g1.z; k <= g1.z; k++) { const s = s0 - g1.rb * TAU * k / g1.z; if (s >= M.sMin - 1e-9 && s <= M.sMax + 1e-9) out.push(s); }
    const g2base = Math.PI + ap - (M.L - s0) / g2.rb;    // gear 2's matching flank base angle
    const rot2 = g2base + halfThick(g2, g2.rb);
    return { s: out, rot2, point: (s) => [M.T1[0] + s * M.u[0], M.T1[1] + s * M.u[1]] };
  }

  // 2. the going train (ratios as rev/s)
  const THIRD = [75, 10], CENTRE = [80, 10], BARREL = [84, 12];
  function train(f, ze, pe, z4) {
    const esc = f / ze, fourth = esc * pe / z4, third = fourth * THIRD[1] / THIRD[0], centre = third * CENTRE[1] / CENTRE[0], barrel = centre * BARREL[1] / BARREL[0];
    return { esc, fourth, third, centre, barrel, T4: 1 / fourth, Tc: 1 / centre, Tb: 1 / barrel };
  }

  // 3. epicyclic: angular velocities given the fixed member and the input
  function epicyclic(zs, zp, fixed, input = 1) {
    const zr = zs + 2 * zp; let ws, wr, wc;
    if (fixed === 0) { wr = 0; ws = input; wc = ws * zs / (zs + zr); }
    else if (fixed === 1) { wc = 0; ws = input; wr = -ws * zs / zr; }
    else if (fixed === 2) { ws = 0; wr = input; wc = wr * zr / (zs + zr); }
    else { ws = 0; wc = input; wr = wc * (zs + zr) / zr; }
    const wp = wc - (zs / zp) * (ws - wc);
    return { zr, ws, wr, wc, wp };
  }
  const willisResidual = (E, zs) => (E.ws - E.wc) + (E.zr / zs) * (E.wr - E.wc);
  const equalSpacing = (zs, zr, n) => (zs + zr) % n === 0;

  (window.LabModels = window.LabModels || {})['gears-mechanisms'] = { inv, involutePoint, gear, halfThick, outline, mesh, contacts, THIRD, CENTRE, BARREL, train, epicyclic, willisResidual, equalSpacing };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const ALPHAS = [14.5, 20, 25];

  /* ---------- 1. involute gearing ---------- */
  D['involute-gearing'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, a0 = ALPHAS[v.alpha] * DEG, M = mesh(v.z1, v.z2, a0, v.da);
      st.phi ??= 0;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The two gears, the driver on the left turning clockwise. Dashed: pitch circles; dotted: base circles.', '二つの歯車で、左の駆動歯車が時計回りに回ります。破線はピッチ円、点線は基礎円です。'));
      const R2 = M.g2.ra, X0 = -M.g1.ra - 0.5, X1 = M.a + R2 + 0.5, Yh = Math.max(M.g1.ra, R2) + 0.5;
      const f = L.fig(c1, { x: [X0, X1], y: [-Yh, Yh], equal: true, axes: false, maxH: 380 });
      const rp1 = M.g1.rb / Math.cos(M.ap), rp2 = M.g2.rb / Math.cos(M.ap);
      for (const [cx, G, rp] of [[0, M.g1, rp1], [M.a, M.g2, rp2]]) { f.circle(cx, 0, rp, { c: 'muted', w: 1, dash: '5 4', layer: 'under' }); f.circle(cx, 0, G.rb, { c: 'muted', w: 0.8, dash: '1 3', layer: 'under' }); f.dot(cx, 0, { c: 'ink', r: 2.5, layer: 'under' }); }
      L.h('p', 'lab-cap', c2, T('Close-up of the mesh: the line of action (gold between the tip circles) and the points of contact on it.', 'かみ合い部の拡大図です。作用線（歯先円の間は金色）とその上の接触点を示します。'));
      const P = [rp1, 0], zw = 3.2, g = L.fig(c2, { x: [P[0] - zw, P[0] + zw], y: [-zw * 0.8, zw * 0.8], equal: true, axes: false, maxH: 380 });
      const lineEnds = [M.T1, [M.T1[0] + M.L * M.u[0], M.T1[1] + M.L * M.u[1]]], act = [[M.T1[0] + M.sMin * M.u[0], M.T1[1] + M.sMin * M.u[1]], [M.T1[0] + M.sMax * M.u[0], M.T1[1] + M.sMax * M.u[1]]];
      for (const F of [f, g]) { F.seg(lineEnds[0], lineEnds[1], { c: 'muted', w: 1, dash: '4 3', layer: 'under' }); F.seg(act[0], act[1], { c: 'hl', w: 2.4, op: 0.8, layer: 'under' }); F.seg([0, 0], [M.a, 0], { c: 'muted', w: 0.8, layer: 'under' }); }
      g.circle(0, 0, rp1, { c: 'muted', w: 1, dash: '5 4', layer: 'under' }); g.circle(M.a, 0, rp2, { c: 'muted', w: 1, dash: '5 4', layer: 'under' });
      g.dot(P[0], 0, { c: 'ink', r: 3.5, layer: 'over' }); g.text(P[0], 0, 'P', { math: true, c: 'ink', dx: -10, dy: -8, layer: 'over' });
      g.text(act[1][0], act[1][1], T('line of action', '作用線'), { small: true, c: 'hl', dx: 8, dy: 4, anchor: 'start', layer: 'over' });
      const gA = f.group('main'), gB = g.group('main'), gC = g.group('over'), gD = f.group('over');
      const clear = (G) => { while (G.firstChild) G.removeChild(G.firstChild); };
      const frame = (phi) => {
        const C = contacts(M, phi);
        clear(gA); clear(gB); clear(gC); clear(gD);
        const o1 = outline(M.g1, -phi), o2 = outline(M.g2, C.rot2, M.a, 0);
        gA.appendChild(f.poly(o1, { c: 'c1', w: 1.2, fill: 'c1', fo: 0.14, layer: 'main' })); gA.appendChild(f.poly(o2, { c: 'c3', w: 1.2, fill: 'c3', fo: 0.14, layer: 'main' }));
        gB.appendChild(g.poly(o1, { c: 'c1', w: 1.6, fill: 'c1', fo: 0.14, layer: 'main' })); gB.appendChild(g.poly(o2, { c: 'c3', w: 1.6, fill: 'c3', fo: 0.14, layer: 'main' }));
        // a marker spoke on each gear to see the rotation
        gA.appendChild(f.seg([0, 0], [0.8 * M.g1.rf * Math.cos(-phi + Math.PI / M.g1.z), 0.8 * M.g1.rf * Math.sin(-phi + Math.PI / M.g1.z)], { c: 'c1', w: 2.4, layer: 'main' }));
        gA.appendChild(f.seg([M.a, 0], [M.a + 0.8 * M.g2.rf * Math.cos(C.rot2 + Math.PI / M.g2.z), 0.8 * M.g2.rf * Math.sin(C.rot2 + Math.PI / M.g2.z)], { c: 'c3', w: 2.4, layer: 'main' }));
        C.s.forEach((s) => { const q = C.point(s); gC.appendChild(g.dot(q[0], q[1], { c: 'hl', r: 6, layer: 'over' })); gD.appendChild(f.dot(q[0], q[1], { c: 'hl', r: 3.5, layer: 'over' })); });
        return C.s.length;
      };
      const nNow = frame(st.phi);
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T(`driver, z₁ = ${v.z1}`, `駆動歯車、z₁ = ${v.z1}`) }, { c: 'c3', kind: 'fill', label: T(`driven, z₂ = ${v.z2}`, `被動歯車、z₂ = ${v.z2}`) }, { c: 'hl', label: T('line of action and contact points', '作用線と接触点') }]);
      ctx.readout([
        { k: T('ratio ω₁/ω₂', '速度比 ω₁/ω₂'), v: `${v.z2}/${v.z1} = ${fmt(v.z2 / v.z1, 4)}`, tone: 'key' },
        { k: T('centre distance', '中心距離'), v: `${fmt(M.a, 2)} m` },
        { k: T('operating pressure angle α′', '運転圧力角 α′'), v: `${fmt(M.ap / DEG, 2)}°` },
        { k: T('contact ratio ε', 'かみ合い率 ε'), v: fmt(M.eps, 3), tone: M.eps < 1.2 ? 'warn' : 'good' },
        { k: T('pairs in contact now', '現在接している歯の組'), v: String(nNow) },
        { k: T('backlash ≈ 2Δa tan α′', 'バックラッシュ ≈ 2Δa tan α′'), v: `${fmt(M.backlash, 3)} m` },
      ], v.da > 0
        ? T(`The centres are ${fmt(v.da, 2)} modules apart from standard. The line of action has tilted to ${fmt(M.ap / DEG, 1)}° and shortened, so fewer pairs overlap (ε = ${fmt(M.eps, 2)}), and the teeth have play; but the base circles are untouched, so the ratio is still exactly ${v.z2}/${v.z1}.`, `中心は標準より ${fmt(v.da, 2)} モジュール離れています。作用線は ${fmt(M.ap / DEG, 1)}° に傾いて短くなり、重なる組は減り（ε = ${fmt(M.eps, 2)}）、歯には遊びが生じます。しかし基礎円は変わらないので、比はなお正確に ${v.z2}/${v.z1} です。`)
        : T(`At the standard centre distance the pitch circles roll on each other at P. Every contact lies on the gold segment, and a new pair engages before the old one leaves, ${fmt(M.eps, 2)} pairs on average.`, `標準の中心距離ではピッチ円どうしが P で転がり合います。すべての接触は金色の線分上にあり、古い組が離れる前に新しい組がかみ合い始めます。平均 ${fmt(M.eps, 2)} 組です。`));
      st.anim = L.animator(ctx.host, (dt, t, lab) => { st.phi += dt * 0.25; frame(st.phi); lab.textContent = T(`driver turned ${fmt((st.phi / DEG) % 360, 0)}°`, `駆動歯車の回転 ${fmt((st.phi / DEG) % 360, 0)}°`); }, { autoplay: false, initialT: 0, playLabel: T('Turn the gears', '歯車を回す') });
    },
  };

  /* ---------- 2. the going train ---------- */
  const VPH = [18000, 21600, 25200, 28800, 36000], SPEEDS = [1, 60, 3600];
  D['gear-train'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const vph = VPH[v.vph], fq = vph / 7200, R = train(fq, v.ze, v.pe, v.z4), sp = SPEEDS[v.speed];
      const secErr = 86400 * (60 / R.T4 - 1), minErr = 86400 * (3600 / R.Tc - 1), reserve = v.turns * R.Tb / 3600;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The train from barrel to escape wheel, schematic: each wheel drives the small pinion of the next. Wheel sizes are proportional to tooth counts.', '香箱からがんぎ車までの輪列の模式図です。各車は次の車の小さなかなを駆動します。車の大きさは歯数に比例します。'));
      const s = 0.05, arbors = [
        { key: 'barrel', z: 84, p: null, w: R.barrel, name: T('barrel', '香箱'), c: 'c4' },
        { key: 'centre', z: CENTRE[0], p: BARREL[1], w: R.centre, name: T('centre (minutes)', '二番（分）'), c: 'c1' },
        { key: 'third', z: THIRD[0], p: CENTRE[1], w: R.third, name: T('third', '三番'), c: 'c3' },
        { key: 'fourth', z: v.z4, p: THIRD[1], w: R.fourth, name: T('fourth (seconds)', '四番（秒）'), c: 'c1' },
        { key: 'esc', z: v.ze * 1.4, p: v.pe, w: R.esc, name: T('escape', 'がんぎ'), c: 'c2', teeth: v.ze },
      ];
      // lay out along a zigzag: wheel k meshes with pinion k+1 at distance (z_k + p_{k+1}) s
      let x = 0, y = 0; const pos = [];
      let dir = -0.9; arbors.forEach((A, k) => { if (k) { const d = (arbors[k - 1].z + A.p) * s; x += d * Math.cos(dir); y += d * Math.sin(dir); dir += 0.95; } pos.push([x, y]); });
      const xs = pos.map((q, k) => [q[0] - arbors[k].z * s, q[0] + arbors[k].z * s]).flat(), ys = pos.map((q, k) => [q[1] - arbors[k].z * s, q[1] + arbors[k].z * s]).flat();
      const f = L.fig(c1, { x: [Math.min(...xs) - 0.3, Math.max(...xs) + 0.3], y: [Math.min(...ys) - 0.5, Math.max(...ys) + 0.5], equal: true, axes: false, maxH: 400 });
      const G = f.group('main');
      const toothed = (cx, cy, r, n, rot, c, w, op = 1) => { const pts = []; const N = Math.min(n, 120); for (let i = 0; i <= N * 4; i++) { const a = rot + TAU * i / (N * 4), rr = r * (1 + ((i % 4 === 1 || i % 4 === 2) ? 0.035 : -0.035)); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return f.poly(pts, { c, w, fill: c, fo: 0.12 * op, op, layer: 'main' }); };
      const draw = (t) => {
        while (G.firstChild) G.removeChild(G.firstChild);
        arbors.forEach((A, k) => {
          const [cx, cy] = pos[k]; let ang = -TAU * A.w * t;
          if (A.key === 'esc') { const beats = Math.floor(t * 2 * fq); ang = -TAU * (beats / 2) / v.ze; }
          G.appendChild(toothed(cx, cy, A.z * s, A.teeth || A.z, ang, A.c, 1.4, 0.5));
          if (A.p) G.appendChild(toothed(cx, cy, A.p * s, A.p, ang, A.c, 1.6, 2.5));
          for (let j = 0; j < 4; j++) { const a = ang + j * TAU / 4; G.appendChild(f.seg([cx, cy], [cx + 0.8 * A.z * s * Math.cos(a), cy + 0.8 * A.z * s * Math.sin(a)], { c: A.c, w: 1, op: 0.6, layer: 'main' })); }
          if (A.key === 'centre' || A.key === 'fourth') { const a = Math.PI / 2 - TAU * A.w * t; G.appendChild(f.arrow([cx, cy], [cx + 0.95 * A.z * s * Math.cos(a), cy + 0.95 * A.z * s * Math.sin(a)], { c: 'hl', w: 2.6, layer: 'main' })); }
          const lt = f.text(cx, cy - ((A.p || 6) + 2) * s, A.name, { small: true, c: A.c, dy: 12, layer: 'main' }); lt.style.fontWeight = '600'; G.appendChild(lt);
        });
      };
      draw(0);
      // right: rotation periods on a log scale
      L.h('p', 'lab-cap', c2, T('Rotation period of each arbor (log scale). The seconds and minute hands need exactly 60 s and 3600 s.', '各軸の回転周期（対数目盛）です。秒針と分針にはちょうど 60 秒と 3600 秒が必要です。'));
      const rows = [['barrel', R.Tb], ['centre', R.Tc], ['third', R.third ? 1 / R.third : 0], ['fourth', R.T4], ['esc', 1 / R.esc]];
      const g = L.fig(c2, { x: [0, 5.5], y: [0, 5.2], aspect: 0.8, xlabel: T('log₁₀ period (s)', 'log₁₀ 周期（秒）'), axes: true, grid: true, maxH: 400, ticksX: [[0, '1 s'], [1, '10 s'], [2, '100 s'], [3, '1000 s'], [4, '3 h'], [5, '1 d']], ticksY: rows.map((r, i) => [4.6 - i, '']) });
      rows.forEach(([key, P], i) => { const A = arbors.find((q) => q.key === key), y = 4.6 - i; g.rect(0, y - 0.3, Math.log10(P), 0.6, { c: A.c, fill: A.c, fo: 0.35, w: 1, layer: 'main' }); g.text(Math.log10(P), y, `${A.name}: ${P >= 3600 ? fmt(P / 3600, 2) + ' h' : P >= 60 ? fmt(P / 60, 2) + ' min' : fmt(P, 2) + ' s'}`, { small: true, c: 'ink', dx: 6, anchor: 'start', layer: 'over' }); });
      g.vline(Math.log10(60), { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' }); g.vline(Math.log10(3600), { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' });
      L.legend(ctx.host, [{ c: 'hl', label: T('hands, and the 60 s and 3600 s targets', '針と、60 秒と 3600 秒の目標') }, { c: 'c2', kind: 'fill', label: T('escape wheel, stepping half a tooth per beat', 'がんぎ車、一振動の半分ごとに半歯進む') }]);
      const okS = Math.abs(secErr) < 1e-6;
      ctx.readout([
        { k: T('balance', 'てんぷ'), v: `${vph.toLocaleString()} vph, f = ${fmt(fq, 2)} Hz`, tone: 'key' },
        { k: T('escape wheel', 'がんぎ車'), v: `${fmt(60 * R.esc, 2)} rpm` },
        { k: T('fourth wheel period', '四番車の周期'), v: `${fmt(R.T4, 3)} s`, tone: okS ? 'good' : 'warn' },
        { k: T('seconds hand error', '秒針の誤差'), v: okS ? T('none', 'なし') : `${fmt(secErr, 0)} s/day`, tone: okS ? 'good' : 'warn' },
        { k: T('centre wheel period', '二番車の周期'), v: `${fmt(R.Tc / 60, 3)} min`, tone: Math.abs(minErr) < 1e-6 ? 'good' : 'warn' },
        { k: T('power reserve', 'パワーリザーブ'), v: `${fmt(reserve, 1)} h` },
      ], okS
        ? T(`z_esc·z₄/(f·p_esc) = ${v.ze}·${v.z4}/(${fmt(fq, 1)}·${v.pe}) = 60 exactly: the seconds hand turns once a minute, and with the fixed 60 : 1 of the centre and third meshes, the minute hand once an hour.`, `z_esc·z₄/(f·p_esc) = ${v.ze}·${v.z4}/(${fmt(fq, 1)}·${v.pe}) = 60 ちょうどです。秒針は毎分一回転し、二番と三番のかみ合いの固定された 60 : 1 と合わせて、分針は毎時一回転します。`)
        : T(`The fourth wheel takes ${fmt(R.T4, 2)} s per turn, not 60, so the seconds and minute hands are wrong by ${fmt(secErr, 0)} s a day. No regulator adjustment can fix a tooth count: try changing the fourth wheel so that z_esc·z₄ = 60·f·p_esc = ${fmt(60 * fq * v.pe, 0)}.`, `四番車は一回転に 60 秒ではなく ${fmt(R.T4, 2)} 秒かかるので、秒針と分針は一日に ${fmt(secErr, 0)} 秒ずれます。歯数は緩急の調整では直せません。z_esc·z₄ = 60·f·p_esc = ${fmt(60 * fq * v.pe, 0)} となるよう四番車を変えてみてください。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { draw(t * sp); lab.textContent = T(`${fmt(t * sp / 60, 1)} min of watch time`, `時計の時間で ${fmt(t * sp / 60, 1)} 分`); }, { autoplay: false, initialT: 0, playLabel: T('Run the train', '輪列を動かす') });
    },
  };

  /* ---------- 3. epicyclic ---------- */
  const FIX_NAME = [['ring fixed', '内歯車固定'], ['carrier fixed', 'キャリア固定'], ['sun fixed', '太陽固定'], ['tourbillon', 'トゥールビヨン']];
  D['epicyclic'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const zs = v.zs, zp = v.zp, n = v.n, fixed = v.fixed, E = epicyclic(zs, zp, fixed, 1), zr = E.zr, m = 1, a0 = 20 * DEG;
      const S = gear(zs, m, a0), Pg = gear(zp, m, a0), Rg = gear(zr, m, a0), dc = S.r + Pg.r, eq = equalSpacing(zs, zr, n), tour = fixed === 3;
      // initial phases: sun tooth 0 at angle 0; planet j at psi_j; mesh by the pitch-point rule
      const psi = L.seq(n, (j) => TAU * j / n);
      const planet0 = psi.map((ps) => { const ds = mod(ps, TAU / zs); return ps + Math.PI - ds * S.r / Pg.r + Math.PI / zp; });
      const ring0 = (() => { const ps = psi[0], dp = mod(planet0[0] - ps, TAU / zp); return ps + dp * Pg.r / Rg.r; })();
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, tour ? T('Tourbillon: the cage (arm) turns, carrying the escape pinion round the fixed wheel.', 'トゥールビヨン：かご（腕）が回り、がんぎかなを固定車の周りに運びます。') : T('Sun (blue), planets (teal) on the carrier arm (gold), ring (violet). The fixed member is drawn faint.', '太陽（青）、キャリアの腕（金）に載った遊星（ティール）、内歯車（紫）です。固定した部材は薄く描いています。'));
      const Rv = tour ? dc + Pg.ra + 1 : Rg.r + 2.4;
      const f = L.fig(c1, { x: [-Rv, Rv], y: [-Rv, Rv], equal: true, axes: false, maxH: 400 });
      const G = f.group('main'), O = f.group('over');
      const draw = (t) => {
        while (G.firstChild) G.removeChild(G.firstChild); while (O.firstChild) O.removeChild(O.firstChild);
        const th = { s: TAU * E.ws * t, r: TAU * E.wr * t, c: TAU * E.wc * t, p: TAU * E.wp * t };
        if (!tour) {
          // the ring: the annulus between an outer circle and the inner toothed boundary (drawn as the outline of its tooth spaces), filled even-odd
          const inner = outline(Rg, ring0 + th.r, 0, 0, { ra: Rg.r + 1.25 * m, rf: Rg.r - m }), outer = L.seq(121, (i) => [(Rg.r + 2.2) * Math.cos(TAU * i / 120), (Rg.r + 2.2) * Math.sin(TAU * i / 120)]);
          const d = [inner, outer].map((ring) => 'M' + ring.map(([x, y]) => f.X(x).toFixed(1) + ' ' + f.Y(y).toFixed(1)).join('L') + 'Z').join('');
          G.appendChild(L.el('path', { d, 'fill-rule': 'evenodd', style: `fill:var(--lab-c4);fill-opacity:${fixed === 0 ? 0.08 : 0.18};stroke:var(--lab-c4);stroke-width:1.2;opacity:${fixed === 0 ? 0.6 : 1}` }));
        }
        G.appendChild(f.poly(outline(S, th.s), { c: 'c1', w: 1.2, fill: 'c1', fo: fixed === 2 || tour ? 0.05 : 0.16, op: fixed === 2 || tour ? 0.6 : 1, layer: 'main' }));
        psi.forEach((ps, j) => { const a = ps + th.c, cx = dc * Math.cos(a), cy = dc * Math.sin(a); if (!tour || j === 0) { G.appendChild(f.poly(outline(Pg, planet0[j] + th.p, cx, cy), { c: tour ? 'c2' : 'c3', w: 1.2, fill: tour ? 'c2' : 'c3', fo: 0.18, layer: 'main' })); O.appendChild(f.seg([cx, cy], [cx + 0.7 * Pg.rf * Math.cos(planet0[j] + th.p), cy + 0.7 * Pg.rf * Math.sin(planet0[j] + th.p)], { c: tour ? 'c2' : 'c3', w: 2, layer: 'over' })); } });
        // carrier arm(s)
        psi.forEach((ps, j) => { if (tour && j) return; const a = ps + th.c; O.appendChild(f.seg([0, 0], [dc * Math.cos(a), dc * Math.sin(a)], { c: 'hl', w: 4, op: 0.85, layer: 'over' })); O.appendChild(f.dot(dc * Math.cos(a), dc * Math.sin(a), { c: 'hl', r: 4, layer: 'over' })); });
        if (tour) { const a = th.c; O.appendChild(f.circle(0, 0, dc + Pg.ra + 0.3, { c: 'hl', w: 1.2, dash: '5 4', layer: 'over' })); void a; }
        O.appendChild(f.dot(0, 0, { c: 'ink', r: 3, layer: 'over' }));
      };
      draw(0);
      // right: velocity diagram along the radius through planet 0 at t = 0 (tangential speed against radius)
      L.h('p', 'lab-cap', c2, T('Velocity diagram along the radius through one planet: tangential speed against radius. Across the planet the speed is a straight line.', '一つの遊星を通る半径に沿った速度線図です。半径に対する接線方向の速さで、遊星を横切る速さは直線になります。'));
      const vS = E.ws * S.r, vR = E.wr * Rg.r, vC = E.wc * dc, vmax = Math.max(Math.abs(vS), Math.abs(vR), Math.abs(vC), 1e-9) * 1.2;
      const g = L.fig(c2, { x: [0, Rg.r * 1.08], y: [-vmax, vmax], aspect: 0.8, xlabel: T('radius', '半径'), ylabel: T('tangential speed', '接線速度'), maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      g.rect(0, -vmax, S.r, 2 * vmax, { c: 'c1', fill: 'c1', fo: 0.06, nostroke: true, layer: 'under' });
      g.rect(S.r, -vmax, 2 * Pg.r, 2 * vmax, { c: 'c3', fill: 'c3', fo: 0.08, nostroke: true, layer: 'under' });
      g.line([[0, 0], [S.r, vS]], { c: 'c1', w: 2.2, layer: 'main' });
      g.line([[S.r, vS], [S.r + 2 * Pg.r, tour ? vS + 2 * (vC - vS) : vR]], { c: 'c3', w: 2.6, layer: 'main' });
      g.line([[0, 0], [dc, vC]], { c: 'hl', w: 1.4, dash: '5 3', layer: 'main' });
      if (!tour) g.line([[0, 0], [Rg.r, vR]], { c: 'c4', w: 1.4, dash: '2 3', layer: 'main' });
      [[S.r, vS, 'c1', T('sun', '太陽')], [dc, vC, 'hl', T('carrier', 'キャリア')], [Rg.r, tour ? null : vR, 'c4', T('ring', '内歯車')]].forEach(([x, y, c, name]) => { if (y === null) return; g.dot(x, y, { c, r: 5, layer: 'over' }); g.text(x, y, name, { small: true, c, dx: 6, dy: y >= 0 ? -8 : 14, anchor: 'start', layer: 'over' }); });
      L.legend(ctx.host, [{ c: 'c1', label: T('sun', '太陽') }, { c: tour ? 'c2' : 'c3', label: T(tour ? 'escape pinion' : 'planet', tour ? 'がんぎかな' : '遊星') }, { c: 'hl', label: T('carrier arm', 'キャリアの腕') }].concat(tour ? [] : [{ c: 'c4', label: T('ring', '内歯車') }]));
      const ratioTxt = fixed === 0 ? `ω_c/ω_s = ${zs}/${zs + zr} = ${fmt(E.wc, 4)}` : fixed === 1 ? `ω_r/ω_s = −${zs}/${zr} = ${fmt(E.wr, 4)}` : fixed === 2 ? `ω_c/ω_r = ${zr}/${zs + zr} = ${fmt(E.wc / E.wr, 4)}` : `ω_p/ω_c = 1 + ${zs}/${zp} = ${fmt(E.wp / E.wc, 3)}`;
      ctx.readout([
        { k: T('teeth sun, planet, ring', '歯数：太陽、遊星、内歯車'), v: `${zs}, ${zp}, ${zr}`, tone: 'key' },
        { k: T('mode', '構成'), v: T(...FIX_NAME[fixed]) },
        { k: T('ratio', '比'), v: ratioTxt, tone: 'good' },
        { k: T('planet spin ω_p (per input turn)', '遊星の自転 ω_p（入力一回転あたり）'), v: fmt(E.wp, 4) },
        { k: T(`${n} planets equally spaced`, `${n} 個の遊星の等間隔配置`), v: eq ? T(`yes: (${zs}+${zr})/${n} = ${(zs + zr) / n}`, `可能：(${zs}+${zr})/${n} = ${(zs + zr) / n}`) : T(`no: (${zs}+${zr})/${n} is not an integer`, `不可：(${zs}+${zr})/${n} は整数でない`), tone: eq || tour ? 'good' : 'warn' },
      ], tour
        ? T(`Relative to the cage the escape pinion simply rolls round a fixed wheel of ${zs} teeth, turning ${fmt(zs / zp, 2)} times per cage turn; seen from outside it turns once more with the cage, ${fmt(E.wp, 2)} times. With the cage at one turn a minute the whole escapement visits every orientation each minute.`, `かごに対してがんぎかなは歯数 ${zs} の固定車の周りを転がるだけで、かご一回転あたり ${fmt(zs / zp, 2)} 回回ります。外から見るとかごと一緒にもう一回転するので ${fmt(E.wp, 2)} 回です。かごが毎分一回転なら、脱進機全体が毎分すべての向きを巡ります。`)
        : fixed === 0 ? T(`With the ring held, the planets roll on it and the carrier follows at ${fmt(E.wc, 3)} of the sun’s speed: one stage gives a reduction of ${fmt(1 / E.wc, 2)} : 1 with the load shared between ${n} planets.`, `内歯車を固定すると遊星はその上を転がり、キャリアは太陽の速さの ${fmt(E.wc, 3)} でついていきます。一段で ${fmt(1 / E.wc, 2)} : 1 の減速が得られ、荷重は ${n} 個の遊星で分担されます。`)
          : fixed === 1 ? T('With the carrier held, the planets are just idlers on fixed axles: the ring turns the opposite way to the sun, slowed by z_s/z_r.', 'キャリアを固定すると遊星は固定軸上の中間車にすぎず、内歯車は太陽と逆向きに z_s/z_r だけ遅く回ります。')
            : T('With the sun held and the ring driving, the carrier turns the same way as the ring but slower, and each planet rolls round the fixed sun.', '太陽を固定して内歯車で駆動すると、キャリアは内歯車と同じ向きにより遅く回り、各遊星は固定された太陽の周りを転がります。'));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { draw(t * 0.08); lab.textContent = T('input turning', '入力を回転中'); }, { autoplay: false, initialT: 0, playLabel: T('Drive it', '駆動する') });
    },
  };
})();
