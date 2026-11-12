'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Bowl: water surface of area AB, level h measured from the crest of the trap (the weir). At rest h = 0.
   * The lip of the trap inlet is SEAL below the crest. Water over the crest runs as a weir, Qw = CW h^1.5.
   * Once that flow exceeds QPRIME the pipe runs full and becomes a siphon, Qs = a sqrt(2 g (h + HD) / (1 + K)),
   * until the level falls to the lip and air breaks it.
   * Cistern: area AC, emptied through a valve of area AV by Torricelli's law with coefficient CD.
   * Float valve: closing pressure = n rho g V_sub / a_o with a spherical float.
   */
  const AB = 0.035, SEAL = 0.043, CW = 0.0935, QPRIME = 1.0e-3, ATR = PI * 0.0275 ** 2, HD = 0.25, KL = 3, AC = 0.06, AV = PI * 0.025 ** 2, CD = 0.6, H0 = 0.2, BAND = 0.015;
  const weirQ = (h) => (h > 0 ? CW * h ** 1.5 : 0);
  const siphonV = (h, hd = HD, k = KL) => Math.sqrt((2 * G * Math.max(0, h + hd)) / (1 + k));
  const siphonQ = (h) => ATR * siphonV(h);
  const primeH = () => (QPRIME / CW) ** (2 / 3);
  function bowlStep(s, qin, dt) { let out; if (s.primed) { out = siphonQ(s.h); if (s.h <= -SEAL) { s.primed = false; out = 0; } } else { out = weirQ(s.h); if (out >= QPRIME) s.primed = true; } s.h += ((qin - out) * dt) / AB; if (s.h < -SEAL - 0.002) s.h = -SEAL - 0.002; s.out = out; return out; }
  function pour(litres, secs, tEnd = 40, dt = 0.004) { const s = { h: 0, primed: false, out: 0 }, tr = []; let gone = 0, peak = 0, everPrimed = false, k = 0; for (let t = 0; t <= tEnd + 1e-9; t += dt) { const qin = t < secs ? litres / 1000 / secs : 0, out = bowlStep(s, qin, dt); gone += out * dt; peak = Math.max(peak, out); everPrimed = everPrimed || s.primed; if (k++ % 10 === 0) tr.push({ t, h: s.h, out, qin, primed: s.primed }); } return { tr, gone, peak, primed: everPrimed, hEnd: s.h }; }
  const torricelliQ = (h) => CD * AV * Math.sqrt(2 * G * Math.max(0, h));
  const emptyTime = (h0, h1, area = AC) => (area / (CD * AV)) * Math.sqrt(2 / G) * (Math.sqrt(h0) - Math.sqrt(h1));
  const fillQmax = (bar, dmm = 4) => 0.7 * PI * (dmm / 2000) ** 2 * Math.sqrt((2 * bar * 1e5) / 1000);                       // m^3/s
  function cycle(litres, bar, dt = 0.01) { const drop = litres / 1000 / AC, s = { h: 0, primed: false, out: 0 }, tr = []; let hc = H0, open = true, t = 0, tShut = 0, tBreak = 0, k = 0, was = false; const qf = fillQmax(bar);
    while (t < 400) { const qc = open ? torricelliQ(hc) : 0; if (open && hc <= H0 - drop) { open = false; tShut = t; } const fill = qf * clamp((H0 - hc) / BAND, 0, 1), toBowl = !open ? 0.35 * fill : 0; hc += ((fill - toBowl - qc) * dt) / AC; bowlStep(s, qc + toBowl, dt); if (was && !s.primed) tBreak = t; was = s.primed; if (k++ % 5 === 0) tr.push({ t, hc, h: s.h, primed: s.primed, open, qc, out: s.out }); t += dt; if (!open && hc >= H0 - 0.0008 && !s.primed) break; }
    return { tr, tShut, tBreak, tEnd: t, drop }; }
  const capVol = (R, d) => { d = clamp(d, 0, 2 * R); return (PI * d * d * (3 * R - d)) / 3; };
  const holdBar = (n, Rmm, dmm, omm) => (n * 1000 * G * capVol(Rmm / 1000, dmm / 1000)) / (PI * (omm / 2000) ** 2) / 1e5;
  function restDepth(n, Rmm, omm, bar) { if (holdBar(n, Rmm, 2 * Rmm, omm) < bar) return Infinity; let a = 0, b = 2 * Rmm; for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (holdBar(n, Rmm, m, omm) < bar) a = m; else b = m; } return (a + b) / 2; }
  const M = { AB, SEAL, CW, QPRIME, ATR, HD, KL, AC, AV, CD, H0, weirQ, siphonV, siphonQ, primeH, pour, torricelliQ, emptyTime, fillQmax, cycle, capVol, holdBar, restDepth, G };
  (window.LabModels = window.LabModels || {}).toilets = M;

  /* ================= 1. the bowl is a siphon ================= */
  D['bowl-siphon'] = {
    render(ctx, v) {
      const r = pour(v.vol, v.secs), slow = pour(v.vol, 30), tmax = Math.max(12, v.secs + 6);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Level of the water in the bowl, measured from the crest of the bend behind it, as \(${fmt(v.vol, 1)}\) litres are poured in over \(${fmt(v.secs, 1)}\) s. While the level is only a little above the crest, water trickles over it. If the level gets \(${fmt(primeH() * 100, 1)}\) cm above, the bend runs full, becomes a siphon and drags the bowl down to the lip of the inlet (lower dashed line), where air gets in and stops it.`, tx`便器の水位を、奥の曲がりの頂上を基準にして、\(${fmt(v.vol, 1)}\) リットルを \(${fmt(v.secs, 1)}\) 秒かけて注いだ場合について描いています。水位が頂上を少し超えただけでは、水はちょろちょろと越えるだけです。水位が \(${fmt(primeH() * 100, 1)}\) cm 上に達すると、曲がりが水で満たされてサイフォンになり、便器の水を入口の縁（下の破線）まで引き下げます。そこで空気が入って止まります。`));
      const a = L.fig(c1, { x: [0, tmax], y: [-6, 12], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('level above the crest (cm)', '頂上からの水位（cm）') });
      a.hline(0, { c: 'muted', dash: '5 4' }); a.hline(-SEAL * 100, { c: 'muted', dash: '2 4' }); a.hline(primeH() * 100, { c: 'c3', dash: '5 4' });
      a.line(slow.tr.filter((q) => q.t <= tmax).map((q) => [q.t, q.h * 100]), { c: 'muted', w: 1.4 }); a.line(r.tr.filter((q) => q.t <= tmax).map((q) => [q.t, q.h * 100]), { c: 'c1', w: 2.8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Water arriving (red) and water leaving through the bend (blue). A trickle over the crest can never exceed what is poured in. A siphon can: its flow is set by the height of the fall behind the bowl, not by the supply, so it takes the pour and the contents of the bowl together. Drag the gold point to pour faster or slower.`, tx`入ってくる水（赤）と、曲がりを通って出ていく水（青）です。頂上を越えるだけの流れは、注がれる量を超えられません。サイフォンは超えられます。その流量は、供給ではなく、便器の奥の落差で決まるので、注がれた水と便器の中の水を一緒に運び去ります。金色の点をドラッグして、注ぐ速さを変えてください。`));
      const b = L.fig(c2, { x: [0, tmax], y: [0, 4], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('flow (L/s)', '流量（L/s）') });
      b.line([[0, v.vol / v.secs], [v.secs, v.vol / v.secs], [v.secs, 0], [tmax, 0]].map((q) => [q[0], Math.min(4, q[1])]), { c: 'c2', w: 2 }); b.line(r.tr.filter((q) => q.t <= tmax).map((q) => [q.t, q.out * 1000]), { c: 'c1', w: 2.8 });
      b.handle(v.secs, Math.min(4, v.vol / v.secs), { c: 'hl', axis: 'x', bounds: [1, 12, 0, 4], label: T('time taken to pour', '注ぐのにかける時間'), onDrag: (x) => ctx.set('secs', clamp(Math.round(x * 2) / 2, 1, 30)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('this pour: level, flow out', 'この注ぎ方：水位、出ていく流量') }, { c: 'c2', label: T('flow in', '入ってくる流量') }, { c: 'muted', label: T('same water over 30 s', '同じ水を 30 秒で') }, { c: 'c3', dash: true, label: T('level that starts the siphon', 'サイフォンが始まる水位') }]);
      ctx.readout([
        { k: T('poured in at', '注ぐ流量'), v: tx`\(${fmt(v.vol / v.secs, 2)}\ \mathrm{L/s}\)` },
        { k: T('siphon', 'サイフォン'), v: T(r.primed ? 'starts' : 'never starts', r.primed ? '始まる' : '始まらない'), tone: r.primed ? 'good' : 'warn' },
        { k: T('peak flow out of the bowl', '便器から出る最大流量'), v: tx`\(${fmt(r.peak * 1000, 2)}\ \mathrm{L/s}\)`, tone: 'key' },
        { k: T('speed in the bend at that moment', 'そのときの曲がりの中の速さ'), v: tx`\(${fmt(r.peak / ATR, 2)}\ \mathrm{m/s}\)` },
        { k: T('carried away', '運び去られた水'), v: tx`\(${fmt(r.gone * 1000, 1)}\ \mathrm{L}\)` },
      ], T(r.primed ? 'More water leaves than was poured in: the siphon has taken the contents of the bowl with it. This is why a bucket emptied quickly flushes a toilet with no cistern at all.' : 'The water only spills over the crest as fast as it arrives. The bowl ends as full as it began and nothing in it is carried away.', r.primed ? '注いだ量より多くの水が出ていきます。サイフォンが便器の中身を一緒に運び去ったからです。バケツの水を一気に空ければ、タンクがなくても便器を流せるのはこのためです。' : '水は、入ってくる速さで頂上を越えるだけです。便器の水位は元のままで、中のものは運び去られません。'));
    },
  };

  /* ================= 2. the whole toilet (3D) ================= */
  const PA = [[-3.5, 4.1], [-3.05, 4.1], [-3.0, 3.3], [-2.4, 2.4], [-1.3, 1.7], [-0.3, 1.35], [0.45, 1.4], [1.0, 1.72], [1.45, 2.2], [1.9, 2.475], [2.15, 2.2], [2.15, 0], [-1.6, 0], [-1.7, 0.5], [-2.4, 1.3], [-3.3, 2.5], [-3.62, 3.7]];
  const PB = [[1.0, 4.1], [0.95, 3.5], [0.6, 2.7], [0.3, 2.05], [0.6, 2.0], [1.0, 2.3], [1.42, 2.8], [1.85, 3.03], [2.25, 2.95], [2.62, 2.5], [2.7, 1.5], [2.7, 0], [3.3, 0], [3.3, 4.1]];
  const CAV = [[-3.05, 4.1], [-3.0, 3.3], [-2.4, 2.4], [-1.3, 1.7], [-0.3, 1.35], [0.45, 1.4], [1.0, 1.72], [1.45, 2.2], [1.9, 2.475], [1.85, 3.03], [1.42, 2.8], [1.0, 2.3], [0.6, 2.0], [0.3, 2.05], [0.6, 2.7], [0.95, 3.5], [1.0, 4.1]];
  const LEG = [[1.9, 2.475], [2.15, 2.2], [2.15, -0.5], [2.7, -0.5], [2.7, 1.5], [2.62, 2.5], [2.25, 2.95], [1.85, 3.03]];
  function clipBelow(poly, zmax) { const out = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], pin = p[1] <= zmax, qin = q[1] <= zmax; if (pin) out.push(p); if (pin !== qin) { const u = (zmax - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * u, zmax]); } } return out; }
  function buildToilet(S) {
    const TH = S.THREE, g = new TH.Group(), DEP = 1.8;
    const china = S.mat('#f3f1ec', { rough: 0.22, coat: 1 }), water = S.mat('#5aa7d6', { rough: 0.08, coat: 1, opacity: 0.62 }), black = S.mat('#1c1d20', { rough: 0.6 }), white = S.mat('#e9e9ea', { rough: 0.45 }), red = S.mat('#b8432a', { rough: 0.7 }), steel = S.mat('#cfd3d8', { metal: 1, rough: 0.25 }), floor = S.mat('#9a968c', { rough: 0.9, coat: 0 });
    const ext = (pts, depth, mat, y0 = 0) => { const sh = new TH.Shape(pts.map((q) => new TH.Vector2(q[0], q[1]))); const geo = new TH.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 }).rotateX(PI / 2).translate(0, depth + y0, 0); const m = new TH.Mesh(geo, mat); g.add(m); return m; };
    const box = (x0, x1, y0, y1, z0, z1, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = true; g.add(m); return m; };
    const cyl = (r, z0, z1, x, y, mat, r2) => { const m = new TH.Mesh(new TH.CylinderGeometry(r2 || r, r, z1 - z0, 28).rotateX(PI / 2), mat); m.position.set(x, y, (z0 + z1) / 2); m.castShadow = true; g.add(m); return m; };
    ext(PA, DEP, china).castShadow = true; ext(PB, DEP, china).castShadow = true; for (const pp of [PA, PB]) { const m = new TH.Mesh(new TH.ShapeGeometry(new TH.Shape(pp.map((q) => new TH.Vector2(q[0], q[1])))).rotateX(PI / 2), S.mat('#b9b2a4', { rough: 0.9, coat: 0, side: 2 })); m.position.y = -0.004; g.add(m); } box(-3.6, 3.3, DEP, DEP + 0.12, 0, 4.1, china);
    box(-4.6, 2.15, 0, 3, -0.3, 0, floor); box(2.7, 4.0, 0, 3, -0.3, 0, floor); box(-4.6, 4.0, 0, 3, -0.5, -0.3, floor);
    // cistern: bottom, front, back, far side and half a lid
    box(1.3, 3.3, 0, 2.0, 4.1, 4.22, china); box(1.3, 1.42, 0, 2.0, 4.22, 7.6, china); box(3.18, 3.3, 0, 2.0, 4.22, 7.6, china); box(1.3, 3.3, 1.88, 2.0, 4.22, 7.6, china); box(1.22, 3.38, 0, 2.08, 7.6, 7.76, china);
    // flush valve: seat, overflow tube, flapper on its hinge
    cyl(0.34, 4.22, 4.3, 2.05, 0.75, white); cyl(0.11, 4.22, 6.55, 2.55, 0.75, white);
    const flap = new TH.Group(); flap.position.set(2.42, 0.75, 4.33); g.add(flap); { const d = new TH.Mesh(new TH.CylinderGeometry(0.33, 0.3, 0.1, 28).rotateX(PI / 2), red); d.position.set(-0.37, 0, 0.03); d.castShadow = true; flap.add(d); const arm = new TH.Mesh(new TH.BoxGeometry(0.4, 0.1, 0.05), red); arm.position.set(-0.1, 0, 0.03); flap.add(arm); }
    // handle, lever and chain
    cyl(0.07, 0, 0.3, 0, 0, steel).rotation.y = PI / 2; const hk = g.children[g.children.length - 1]; hk.position.set(1.2, 0.55, 7.1);
    const lever = new TH.Group(); lever.position.set(1.42, 0.55, 7.1); g.add(lever); { const m = new TH.Mesh(new TH.BoxGeometry(0.75, 0.05, 0.05), steel); m.position.x = 0.375; lever.add(m); }
    const knob = new TH.Group(); knob.position.set(1.14, 0.55, 7.1); g.add(knob); { const m = new TH.Mesh(new TH.BoxGeometry(0.08, 0.5, 0.14), steel); m.position.y = -0.2; knob.add(m); }
    const chain = S.lines([], { c: 'ink', opacity: 0.8, w: 1.4 });
    // fill valve: column, cap, float cup; refill tube to the overflow
    cyl(0.09, 4.22, 6.85, 2.9, 1.35, white); cyl(0.2, 6.85, 7.1, 2.9, 1.35, black);
    const flo = cyl(0.27, 0, 0.55, 2.9, 1.35, black);
    { const t = S.tube([[2.9, 1.35, 7.0], [2.8, 1.1, 7.2], [2.6, 0.8, 7.0], [2.55, 0.75, 6.6]], { r: 0.03, add: false, radial: 8, segments: 40 }); t.material = black; g.add(t); }
    const wc = new TH.Mesh(new TH.BoxGeometry(1.76, 1.88, 1), water); g.add(wc);
    let wb = null, wl = null; const setBowl = (z, leg) => { if (wb) { g.remove(wb); wb.geometry.dispose(); } const poly = clipBelow(CAV, z); wb = ext(poly, DEP - 0.01, water, 0.005); if (wl) wl.visible = leg; };
    wl = ext(LEG, DEP - 0.01, water, 0.005); wl.visible = false;
    const sheet = S.lines([], { c: 'c1', opacity: 0.9, w: 2.2 });
    S.add(g);
    return { flap, lever, knob, chain, flo, wc, setBowl, sheet };
  }
  D['toilet-cutaway'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const cy = cycle(v.vol, v.bar); st.cy = cy; st.t = 0;
      L.setText(st.cap1, T(tx`A toilet sawn in half down the middle, running through its cycle. Pressing the handle lifts the red flapper and \(${fmt(v.vol, 1)}\) litres fall from the cistern into the bowl. The bowl rises, the bend behind it fills and siphons the bowl empty, and then the float valve refills the cistern while a side stream tops the bowl back up to the crest. The refill is shown six times faster than life.`, tx`真ん中で二つに切った便器が、一連の動作を繰り返しています。レバーを押すと赤いフラッパーが持ち上がり、\(${fmt(v.vol, 1)}\) リットルの水がタンクから便器に落ちます。便器の水位が上がり、奥の曲がりが満たされて、サイフォンが便器を空にします。その後、フロート弁がタンクに水を入れ直し、分かれた流れが便器の水位を頂上まで戻します。給水は実際の 6 倍の速さで表示しています。`));
      L.setText(st.cap2, T(tx`The first twelve seconds: depth of water in the cistern above its outlet (blue), and level in the bowl above the crest of the bend (red). The cistern empties fastest at the start, when the head of water above the valve is greatest.`, tx`最初の 12 秒間です。タンクの出口から上の水深（青）と、曲がりの頂上を基準にした便器の水位（赤）を描いています。タンクは、弁の上の水深が最も大きい最初に、最も速く空になります。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 12], y: [-6, 22], aspect: 0.8, maxH: 400, xlabel: T('time since the handle was pressed (s)', 'レバーを押してからの時間（秒）'), ylabel: T('water level (cm)', '水位（cm）') });
      g.hline(0, { c: 'muted', dash: '4 4' }); g.line(cy.tr.filter((q) => q.t <= 12).map((q) => [q.t, q.hc * 100]), { c: 'c1', w: 2.8 }); g.line(cy.tr.filter((q) => q.t <= 12).map((q) => [q.t, q.h * 100]), { c: 'c2', w: 2.4 });
      g.vline(cy.tShut, { c: 'c1', dash: '3 3' }); if (cy.tBreak) g.vline(cy.tBreak, { c: 'c2', dash: '3 3' });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('cistern; flapper closes', 'タンク、フラッパーが閉じる') }, { c: 'c2', label: T('bowl; siphon breaks', '便器、サイフォンが切れる') }]);
      ctx.readout([
        { k: T('cistern level falls by', 'タンクの水位が下がる量'), v: tx`\(${fmt(cy.drop * 100, 1)}\ \mathrm{cm}\)` },
        { k: T('flow from the cistern at the start', '最初のタンクからの流量'), v: tx`\(${fmt(torricelliQ(H0) * 1000, 2)}\ \mathrm{L/s}\)`, tone: 'key' },
        { k: T('flapper closes after', 'フラッパーが閉じるまで'), v: tx`\(${fmt(cy.tShut, 1)}\ \mathrm{s}\)` },
        { k: T('siphon breaks after', 'サイフォンが切れるまで'), v: cy.tBreak ? tx`\(${fmt(cy.tBreak, 1)}\ \mathrm{s}\)` : T('never starts', '始まらない'), tone: cy.tBreak ? 'good' : 'warn' },
        { k: T('ready to flush again after', '次に流せるまで'), v: tx`\(${fmt(cy.tEnd, 0)}\ \mathrm{s}\)` },
      ], T('The water left standing in the bowl is the point of the bend: it blocks the pipe against air from the sewer. The flush must end by putting that seal back.', '便器に残る水こそが、曲がりの役目です。下水からの空気に対して、管をふさぎます。洗浄は、この水の封を元に戻して終わらなければなりません。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.1 : 1.0, maxH: 620, camera: [-5.6, -18, 8.6], target: [-0.1, 0.9, 3.7], fov: 30,
        label: T('3D toilet cut in half, running through a flush. Drag to rotate.', '半分に切った便器が洗浄を繰り返す 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.tl = buildToilet(S); st.lastZ = null;
          S.label(T('float valve', 'フロート弁'), [3.6, 1.35, 7.4], { small: true }); S.label(T('flapper', 'フラッパー'), [2.0, 0, 5.0], { small: true }); S.label(T('crest', '頂上'), [1.9, 0, 3.3], { small: true }); S.label(T('water seal', '水の封'), [-1.2, 0, 2.75], { small: true }); S.label(T('to the drain', '排水管へ'), [3.4, 0, 0.6], { small: true });
          const draw = (dt) => { const m = st.tl, cyc = st.cy, tr = cyc.tr, total = 12 + (cyc.tEnd - 12 > 0 ? (cyc.tEnd - 12) / 6 : 0) + 2.5; st.t = (st.t + dt) % total; const sim = st.t < 12 ? st.t : Math.min(cyc.tEnd, 12 + (st.t - 12) * 6);
            const i = clamp(Math.round((sim / cyc.tEnd) * (tr.length - 1)), 0, tr.length - 1), q = sim >= cyc.tEnd ? tr[tr.length - 1] : tr[i];
            const zc = 4.22 + q.hc * 10; m.wc.scale.z = Math.max(0.02, zc - 4.22); m.wc.position.set(2.3, 0.94, (4.22 + zc) / 2); m.flo.position.z = clamp(zc - 0.1, 4.6, 6.2);
            const up = q.open ? 1 : 0; m.flap.rotation.y = -up * 1.1; m.lever.rotation.y = -up * 0.45; m.knob.rotation.x = up * 0.5;
            const tip = [1.42 + 0.75 * Math.cos(up * 0.45), 0.55, 7.1 + 0.75 * Math.sin(up * 0.45)], fl = [2.42 - 0.6 * Math.cos(up * 1.1), 0.75, 4.4 + 0.6 * Math.sin(up * 1.1)]; m.chain.update([[tip, fl]]);
            const zb = Math.round((2.475 + q.h * 10) * 100) / 100; if (zb !== st.lastZ || q.primed !== st.lastP) { m.setBowl(zb, q.primed); st.lastZ = zb; st.lastP = q.primed; }
            const sg = []; if (q.qc > 1e-5) for (let k = 0; k < 7; k++) { const ph = (st.t * 2.2 + k / 7) % 1; sg.push([[-3.02 + 0.3 * ph, -0.01, 3.9 - 1.2 * ph], [-2.95 + 0.3 * ph, -0.01, 3.6 - 1.2 * ph]]); sg.push([[0.97 - 0.3 * ph, -0.01, 3.9 - 1.1 * ph], [0.9 - 0.3 * ph, -0.01, 3.6 - 1.1 * ph]]); } m.sheet.update(sg); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.lastZ = null; st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-5, 5], y: [-1, 8.5], equal: true, maxH: 360, axes: false, grid: false }); f2.poly(PA, { c: 'ink', fill: 'grid', fo: 0.5, w: 1.4 }); f2.poly(PB, { c: 'ink', fill: 'grid', fo: 0.5, w: 1.4 }); f2.poly(clipBelow(CAV, 2.475), { c: 'c1', fill: 'c1', fo: 0.35, w: 0 }); f2.rect(1.3, 4.1, 2, 3.6, { c: 'ink', fill: 'none', w: 1.4 }); f2.rect(1.42, 4.22, 1.76, 2, { c: 'c1', fill: 'c1', fo: 0.3, w: 0 }); },
      });
    },
  };

  /* ================= 3. the float valve ================= */
  D['float-valve'] = {
    render(ctx, v) {
      const R = v.fd / 2, rest = restDepth(v.n, R, v.o, v.bar), force = v.bar * 1e5 * PI * (v.o / 2000) ** 2, need = force / v.n / (1000 * G), qf = fillQmax(v.bar, v.o);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The supply pressure this float can hold shut against how deep it sits in the water. Its buoyancy is multiplied \(${fmt(v.n, 0)}\) times by the lever and concentrated on an opening \(${fmt(v.o, 1)}\) mm across. Where the curve meets the mains pressure (dashed) the valve closes, and the water stops rising. Drag the gold point.`, tx`このフロートが閉じたまま耐えられる給水圧力を、フロートが水に沈む深さに対して描いています。浮力はてこで \(${fmt(v.n, 0)}\) 倍になり、直径 \(${fmt(v.o, 1)}\) mm の開口に集中します。曲線が水道の圧力（破線）と交わるところで弁が閉じ、水位の上昇が止まります。金色の点をドラッグしてください。`));
      const ymax = 12, a = L.fig(c1, { x: [0, v.fd], y: [0, ymax], aspect: 0.7, maxH: 350, xlabel: T('depth of the float under water (mm)', 'フロートが水に沈む深さ（mm）'), ylabel: T('pressure held (bar)', '耐えられる圧力（bar）') });
      a.line(L.sample(0, v.fd, 80, (d) => Math.min(ymax, holdBar(v.n, R, d, v.o))), { c: 'c1', w: 2.8 }); a.hline(v.bar, { c: 'muted', dash: '5 4' });
      if (isFinite(rest)) a.vline(rest, { c: 'c3', dash: '4 3' });
      a.handle(isFinite(rest) ? rest : v.fd, v.bar, { c: 'hl', axis: 'y', bounds: [0, v.fd, 1, 10], label: T('mains pressure', '水道の圧力'), onDrag: (x, y) => ctx.set('bar', clamp(Math.round(y * 2) / 2, 1, 10)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Time to refill a 6 litre flush against mains pressure, for this opening (blue) and for ones 1 mm smaller and larger. The flow through a small hole goes as the square root of the pressure, so doubling the pressure shortens the wait by less than a third.`, tx`6 リットルの洗浄の後、タンクが満たされるまでの時間を、水道の圧力に対して描いています。青はこの開口、灰色は 1 mm 小さい場合と大きい場合です。小さな穴を通る流量は圧力の平方根に比例するので、圧力を 2 倍にしても、待ち時間は 3 分の 1 も短くなりません。`));
      const b = L.fig(c2, { x: [1, 10], y: [0, 200], aspect: 0.7, maxH: 350, xlabel: T('mains pressure (bar)', '水道の圧力（bar）'), ylabel: T('time to refill 6 L (s)', '6 L の給水時間（秒）') });
      [v.o - 1, v.o + 1].filter((o) => o >= 1.5).forEach((o) => b.line(L.sample(1, 10, 60, (p) => Math.min(200, 0.006 / fillQmax(p, o))), { c: 'muted', w: 1.3 }));
      b.line(L.sample(1, 10, 60, (p) => Math.min(200, 0.006 / fillQmax(p, v.o))), { c: 'c1', w: 2.8 }); b.dot(v.bar, Math.min(200, 0.006 / qf), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('this float and opening', 'このフロートと開口') }, { c: 'muted', dash: true, label: T('mains pressure', '水道の圧力') }, { c: 'c3', dash: true, label: T('where the float comes to rest', 'フロートが落ち着く深さ') }]);
      ctx.readout([
        { k: T('force of the mains on the valve', '水道が弁を押す力'), v: tx`\(${fmt(force, 2)}\ \mathrm{N}\)` },
        { k: T('buoyancy needed at the float', 'フロートに必要な浮力'), v: tx`\(${fmt(force / v.n, 2)}\ \mathrm{N}\ (${fmt(need * 1e6, 0)}\ \mathrm{mL}\ \text{${T('under water', '水中')}})\)`, tone: 'key' },
        { k: T('float comes to rest sunk by', 'フロートが沈んで落ち着く深さ'), v: isFinite(rest) ? tx`\(${fmt(rest, 0)}\ \mathrm{mm}\)` : T('it cannot close the valve', '弁を閉じられない'), tone: isFinite(rest) ? 'good' : 'warn' },
        { k: T('most this float could hold', 'このフロートが耐えられる最大圧力'), v: tx`\(${fmt(holdBar(v.n, R, v.fd, v.o), 1)}\ \mathrm{bar}\)` },
        { k: T('flow with the valve wide open', '弁が全開のときの流量'), v: tx`\(${fmt(qf * 60000, 1)}\ \mathrm{L/min}\)` },
      ], T(isFinite(rest) ? 'The float is a pressure regulator with no power supply: it measures the level and shuts off the mains with the weight of the water it displaces.' : 'The float is fully under water and still cannot hold the valve shut. The cistern would fill until it ran down the overflow tube.', isFinite(rest) ? 'フロートは、電源のいらない調節器です。水位を測り、自分が押しのけた水の重さで水道を止めます。' : 'フロートが完全に沈んでも、弁を閉じたままにできません。タンクの水は、オーバーフロー管から流れ落ちるまで増え続けます。'));
    },
  };
})();
