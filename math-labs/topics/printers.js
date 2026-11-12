'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Inkjet: a drop of volume V picolitres is a sphere of diameter (6000 V / pi)^(1/3) micrometres; on paper it spreads to
   * beta times that. Dots sit on a square grid of pitch 25400/dpi micrometres; the covered fraction of the page is the
   * area of the union of the discs. A drop fired at speed v from a head moving at speed u across a gap h lands u h / v
   * downstream of where it was fired.
   * Laser: the photoconductor is charged to V0, and light of exposure E discharges it towards a residual Vr:
   * V = Vr + (V0 - Vr) exp(-E/E0). A scanning Gaussian spot of 1/e^2 radius w writes each pixel; toner develops wherever the
   * surface potential is below the developer bias. (Magnitudes of negative voltages are used throughout.)
   * Engine: process speed = pages per minute times (page length + gap); scan lines per second = speed x dpi / 25.4 mm;
   * polygon speed = 60 x lines per second / facets; fuser power = speed x width x paper mass per area x c x temperature rise.
   */
  const dropDiameter = (V) => Math.cbrt((6000 * V) / PI);
  const pitch = (dpi) => 25400 / dpi;
  function coverage(r, p) { if (r <= p / 2) return (PI * r * r) / (p * p); if (r >= p / Math.SQRT2) return 1; return (PI * r * r - 4 * (r * r * Math.acos(p / (2 * r)) - (p / 2) * Math.sqrt(r * r - (p * p) / 4))) / (p * p); }
  const landingOffset = (u, h, v) => (u * h) / v;                      // metres if u, v in m/s and h in metres
  const V0 = 600, VR = 60;
  const discharge = (E) => VR + (V0 - VR) * Math.exp(-E);              // E in units of E0
  const PATTERNS = [[0, 0, 0, 1, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0], [0, 1, 1, 0, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1]];   // on = exposed = printed black
  function exposureAt(x, pat, w, p, E) { let s = 0; for (let i = 0; i < pat.length; i++) if (pat[i]) { const c = (i + 0.5) * p; s += 0.5 * (erf((Math.SQRT2 * (x - c + p / 2)) / w) - erf((Math.SQRT2 * (x - c - p / 2)) / w)); } return E * s; }
  function erf(x) { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); }
  function develop(pat, w, p, E, bias, n = 700) { const W = pat.length * p, xs = [], vs = []; let toner = 0, width = 0, gapMin = Infinity, inLine = false, last = null; for (let i = 0; i <= n; i++) { const x = (W * i) / n, v = discharge(exposureAt(x, pat, w, p, E)); xs.push(x); vs.push(v); const on = v < bias; if (on) { toner += (bias - v) * (W / n); width += W / n; if (!inLine && last !== null) gapMin = Math.min(gapMin, x - last); inLine = true; } else { if (inLine) last = x; inLine = false; } } const lines = pat.filter((q, i) => q && !pat[i - 1]).length; return { xs, vs, toner, width, meanWidth: lines ? width / lines : 0, gapMin, W }; }
  const PAGE = 297, GAP = 40, WIDTH = 210;
  function engine(ppm, dpi, facets) { const v = (ppm * (PAGE + GAP)) / 60, lines = (v / 25.4) * dpi, rpm = (60 * lines) / facets, px = (216 / 25.4) * dpi, clock = (lines * px) / 0.7, fuser = (v / 1000) * (WIDTH / 1000) * 0.08 * 1340 * 160, drumRpm = (v / (PI * 30)) * 60; return { v, lines, rpm, px, clock, fuser, drumRpm, energy: (fuser * 60) / ppm }; }
  const M = { dropDiameter, pitch, coverage, landingOffset, V0, VR, discharge, PATTERNS, exposureAt, erf, develop, engine, PAGE, GAP, WIDTH };
  (window.LabModels = window.LabModels || {})['printers'] = M;

  const DPI = [300, 600, 1200, 2400];

  /* ================= 1. inkjet: drops and dots ================= */
  D['inkjet-dots'] = {
    render(ctx, v) {
      const dpi = DPI[v.dpi], p = pitch(dpi), dd = dropDiameter(v.vol), dot = dd * v.beta, cov = coverage(dot / 2, p), off = landingOffset(v.u, v.h * 1e-3, v.vd) * 1e6, need = Math.SQRT2 * p;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A patch of paper \(${fmt(6 * p, 0)}\) µm across printed solid at \(${dpi}\) dots per inch: one \(${fmt(v.vol, 1)}\) pL drop at every grid point. Rows printed on the head’s return pass are drawn lighter. ${v.al === 1 ? 'The printer is firing each drop early by the distance it drifts in flight, so the two passes line up.' : 'With no correction they land ' + fmt(2 * off, 0) + ' µm from rows printed on the outward pass, because a drop keeps the head’s sideways speed while it crosses the gap.'}`, tx`\(${dpi}\) dpi でベタ塗りした、幅 \(${fmt(6 * p, 0)}\) µm の紙の一部です。格子の各点に \(${fmt(v.vol, 1)}\) pL の液滴を一つずつ打っています。ヘッドが戻るときに印刷した行は薄い色で描いています。${v.al === 1 ? 'プリンターは、飛んでいる間にずれる距離の分だけ早く液滴を打っているので、行きと戻りがそろいます。' : '補正しないと、行きに印刷した行から ' + fmt(2 * off, 0) + ' µm ずれて着弾します。液滴は、すき間を飛ぶ間もヘッドの横向きの速さを保つからです。'}`));
      const f = L.fig(c1, { x: [0, 6 * p], y: [0, 6 * p], equal: true, aspect: 1, maxH: 400, xlabel: T('µm', 'µm'), grid: false });
      for (let i = 0; i <= 6; i++) { f.line([[i * p, 0], [i * p, 6 * p]], { c: 'grid', w: 0.8 }); f.line([[0, i * p], [6 * p, i * p]], { c: 'grid', w: 0.8 }); }
      const sh = v.al === 1 ? 0 : off; for (let j = 0; j < 6; j++) for (let i = -12; i < 18; i++) { const back = j % 2 === 1, x = (i + 0.5) * p + (back ? -sh : sh), y = (j + 0.5) * p; if (x < -dot / 2 || x > 6 * p + dot / 2) continue; f.circle(x, y, dot / 2, { c: back ? 'c1' : 'ink', fill: back ? 'c1' : 'ink', fo: 0.55, w: 0.5 }); }
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Diameter of the dot on paper against the volume of the drop (blue), and the dot needed to leave no white between neighbours at each resolution (dashed). A sphere’s diameter grows only as the cube root of its volume, so halving the dot takes an eighth of the ink. Drag the gold point.`, tx`液滴の体積に対する紙の上のドットの直径（青）と、各解像度で隣どうしの間に白を残さないために必要なドットの大きさ（破線）です。球の直径は体積の立方根でしか大きくならないので、ドットを半分にするにはインクは 8 分の 1 で済みます。金色の点をドラッグしてください。`));
      const lv = Math.log10, g = L.fig(c2, { x: [-0.3, 1.7], y: [0, 130], aspect: 0.72, maxH: 340, xlabel: T('drop volume (pL)', '液滴の体積（pL）'), ylabel: T('dot on paper (µm)', '紙の上のドット（µm）'), ticksX: [[lv(0.5), '0.5'], [0, '1'], [lv(2), '2'], [lv(5), '5'], [1, '10'], [lv(20), '20'], [lv(50), '50']] });
      DPI.forEach((d) => { const y = Math.SQRT2 * pitch(d); if (y < 130) { g.hline(y, { c: d === dpi ? 'c2' : 'muted', dash: '5 4', w: d === dpi ? 1.8 : 1 }); g.text(1.68, y, `${d} dpi`, { small: true, anchor: 'end', dy: -5 }); } });
      g.line(L.sample(-0.3, 1.7, 120, (x) => dropDiameter(10 ** x) * v.beta), { c: 'c1', w: 2.8 });
      g.handle(lv(v.vol), Math.min(130, dot), { c: 'hl', axis: 'x', bounds: [-0.3, 1.7, 0, 130], label: T('drop volume', '液滴の体積'), onDrag: (x) => ctx.set('vol', clamp(Math.round(10 ** x * 2) / 2, 0.5, 50)) });
      L.legend(ctx.host, [{ c: 'ink', kind: 'fill', label: T('outward pass', '行きに印刷') }, { c: 'c1', kind: 'fill', label: T('return pass; dot size', '戻りに印刷、ドットの大きさ') }, { c: 'c2', dash: true, label: T('needed for solid cover', 'ベタ塗りに必要な大きさ') }]);
      ctx.readout([
        { k: T('drop in flight, dot on paper', '飛行中の液滴、紙の上のドット'), v: tx`\(${fmt(dd, 1)},\ ${fmt(dot, 1)}\ \mu\mathrm{m}\)` },
        { k: T('grid spacing, dot needed', '格子の間隔、必要なドット'), v: tx`\(${fmt(p, 1)},\ ${fmt(need, 1)}\ \mu\mathrm{m}\)` },
        { k: T('paper covered', '紙が覆われる割合'), v: tx`\(${fmt(100 * cov, 1)}\,\%\)`, tone: cov >= 0.999 ? 'good' : 'warn' },
        { k: T('time of flight, sideways drift each way', '飛行時間、片道の横ずれ'), v: tx`\(${fmt((v.h / v.vd) * 1000, 0)}\ \mu\mathrm{s},\ ${fmt(off, 0)}\ \mu\mathrm{m}\)`, tone: v.al === 0 && 2 * off > p / 4 ? 'warn' : undefined },
        { k: T('ink for an A4 page at 5 % cover', '5 % の印字率で A4 1 枚に使うインク'), v: tx`\(${fmt((0.05 * 62370 * (dpi / 25.4) ** 2 * v.vol) / 1e9, 3)}\ \mathrm{mL}\)`, tone: 'key' },
      ], T('Printers fire the return-pass drops early by exactly the drift, which is what the alignment page you are asked to print sets. Photo printers use drops of one or two picolitres, too small to see singly, and build tones from how many are placed.', 'プリンターは、戻りの液滴をずれの分だけ早く打ちます。印刷するよう求められる位置合わせ用のページは、この量を決めるためのものです。写真用のプリンターは 1 から 2 ピコリットルの液滴を使います。一つ一つは見えないほど小さく、打つ数で濃淡を作ります。'));
    },
  };

  /* ================= 2. laser: writing with light on a charged drum ================= */
  D['laser-latent-image'] = {
    render(ctx, v) {
      const p = 42.3, pat = PATTERNS[v.pat], d = develop(pat, v.w, p, v.e, v.bias);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Voltage on the drum’s surface across seven pixels at 600 dpi after the laser has passed. The drum starts evenly charged; where the beam was on (marked along the bottom) the light-sensitive layer conducts and the charge leaks away. Toner is attracted wherever the surface has fallen below the developer’s voltage (dashed), shaded here.`, tx`レーザーが通った後の、600 dpi で 7 画素分のドラム表面の電圧です。ドラムは最初、一様に帯電しています。ビームが点灯したところ（下に印を付けた部分）では、感光層が電気を通し、電荷が逃げます。表面の電圧が現像器の電圧（破線）より下がったところにトナーが引き付けられます。その部分に色を付けています。`));
      const a = L.fig(c1, { x: [0, d.W], y: [-60, 660], aspect: 0.66, maxH: 330, xlabel: T('position across the page (µm)', 'ページを横切る位置（µm）'), ylabel: T('surface voltage (V, magnitude)', '表面電圧（V、大きさ）') });
      pat.forEach((q, i) => { if (q) a.rect(i * p, -50, p, 28, { c: 'c2', fill: 'c2', fo: 0.7, w: 0 }); });
      const pts = d.xs.map((x, i) => [x, d.vs[i]]); a.poly([...pts.map((q) => [q[0], Math.min(q[1], v.bias)]), [d.W, v.bias], [0, v.bias]], { c: 'ink', fill: 'ink', fo: 0.3, w: 0 });
      a.hline(v.bias, { c: 'c3', dash: '5 4', w: 1.6 }); a.hline(V0, { c: 'muted', dash: '2 4' }); a.line(pts, { c: 'c1', w: 2.8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Width of the printed line, per line of the pattern, against laser exposure. One pixel is 42 µm. Too little light and thin lines vanish; too much and the edges of the spot, which is wider than a pixel, discharge the neighbours, so lines fatten and the gaps between them close. Drag the gold point.`, tx`レーザーの露光量に対する、パターンの線 1 本あたりの印刷される線の幅です。1 画素は 42 µm です。光が少なすぎると細い線が消えます。多すぎると、画素より広いスポットの縁が隣の画素まで放電させるので、線が太り、線の間のすき間が埋まります。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0, 6], y: [0, 130], aspect: 0.66, maxH: 330, xlabel: T('exposure (units of the layer’s sensitivity)', '露光量（感光層の感度を単位として）'), ylabel: T('line width (µm)', '線の幅（µm）') });
      let run = 0, best = 0; pat.forEach((q) => { run = q ? run + 1 : 0; best = Math.max(best, run); });
      b.hline(best * p, { c: 'muted', dash: '5 4' }); b.text(5.9, best * p, T('intended', '本来の幅'), { small: true, anchor: 'end', dy: -5 });
      b.line(L.sample(0.05, 6, 90, (e) => Math.min(130, develop(pat, v.w, p, e, v.bias, 300).meanWidth)), { c: 'c1', w: 2.8 });
      b.handle(v.e, Math.min(130, d.meanWidth), { c: 'hl', axis: 'x', bounds: [0.1, 6, 0, 130], label: T('exposure', '露光量'), onDrag: (x) => ctx.set('e', clamp(Math.round(x * 10) / 10, 0.1, 6)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('surface voltage; line width', '表面電圧、線の幅') }, { c: 'c3', dash: true, label: T('developer voltage', '現像器の電圧') }, { c: 'ink', kind: 'fill', label: T('toner', 'トナー') }, { c: 'c2', kind: 'fill', label: T('laser on', 'レーザー点灯') }]);
      ctx.readout([
        { k: T('lowest surface voltage', '表面電圧の最小値'), v: tx`\(${fmt(Math.min(...d.vs), 0)}\ \mathrm{V}\)` },
        { k: T('printed line width (intended)', '印刷される線の幅（本来の幅）'), v: tx`\(${fmt(d.meanWidth, 0)}\ \mu\mathrm{m}\ (${fmt(best * p, 0)})\)`, tone: Math.abs(d.meanWidth - best * p) < 8 ? 'good' : 'warn' },
        { k: T('narrowest white gap', '最も狭い白のすき間'), v: d.gapMin === Infinity ? (d.toner > 0 && pat.filter((q, i) => q && !pat[i - 1]).length > 1 ? T('closed up', '埋まった') : '—') : tx`\(${fmt(d.gapMin, 0)}\ \mu\mathrm{m}\)`, tone: d.gapMin < 15 || (d.gapMin === Infinity && d.toner > 0 && pat.filter((q, i) => q && !pat[i - 1]).length > 1) ? 'bad' : undefined },
        { k: T('toner laid down (relative)', 'のったトナーの量（相対値）'), v: tx`\(${fmt(d.toner / 1000, 1)}\)` },
      ], T('The whole process is electrostatic: charge the drum, erase the charge with light, let charged powder find the erased places, pull the powder onto paper with a stronger field, and melt it in. It is the method of the photocopier, with a laser in place of the reflected image.', 'この過程はすべて静電気によるものです。ドラムを帯電させ、光で電荷を消し、帯電した粉に電荷の消えた場所を見つけさせ、より強い電場で粉を紙へ引き寄せ、溶かして定着させます。これは複写機の方法で、反射した像の代わりにレーザーを使っています。'));
    },
  };

  /* ================= 3. the print engine (3D) ================= */
  function buildEngine(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.05, HW = 60;                 // 1 unit = 20 mm; rollers run along y, half-width 60 mm of a 220 mm engine shown
    const roller = (r, x, z, mat, len = 2 * HW) => { const grp = new TH.Group(); const m = new TH.Mesh(new TH.CylinderGeometry(r * K, r * K, len * K, 48), mat); m.castShadow = true; grp.add(m); const shaft = new TH.Mesh(new TH.CylinderGeometry(r * K * 0.28, r * K * 0.28, (len + 14) * K, 16), steel); grp.add(shaft); const mark = new TH.Mesh(new TH.BoxGeometry(r * K * 0.9, 0.012, r * K * 0.22), S.mat('#f2f2f2', { rough: 0.6 })); mark.position.set(r * K * 0.5, -(len / 2) * K - 0.007, 0); grp.add(mark); grp.position.set(x * K, 0, z * K); g.add(grp); return grp; };
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w * K, d * K, h * K), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const steel = S.mat('#cfd3d8', { metal: 1, rough: 0.3 }), opc = S.mat('#2e8f86', { rough: 0.2, coat: 1, coatRough: 0.05 }), rubber = S.mat('#2a2b2f', { rough: 0.85, coat: 0 }), dark = S.mat('#1d1e22', { rough: 0.55 }), shell = S.mat('#d9dbdf', { rough: 0.5, coat: 0.2, opacity: 0.35 });
    const hot = S.mat('#c8502e', { rough: 0.4, coat: 0.4, glow: 0.35, glowColour: '#ff7a3c' }), silicone = S.mat('#8a8f98', { rough: 0.7 }), paperM = S.mat('#fbfaf6', { rough: 0.9, coat: 0 }), tonerM = S.mat('#141416', { rough: 0.95, coat: 0 }), glass = S.mat('#cfe8f5', { glass: true, rough: 0.03, opacity: 0.35 });
    const drum = roller(15, 0, 40, opc), charge = roller(6, -12.5, 57, rubber), dev = roller(9, 24, 40, S.mat('#55585f', { metal: 0.6, rough: 0.5 })), transfer = roller(8, 0, 17, silicone), heat = roller(12, -85, 37, hot), press = roller(11, -85, 14, silicone), pick = roller(8, 95, 17, rubber, 40);
    // toner hopper with its stirring paddle and the blade that meters the layer on the developer roller
    box(52, 2 * HW, 34, 62, 0, 46, shell); box(46, 2 * HW - 6, 14, 62, 0, 37, tonerM); box(1.2, 2 * HW, 12, 28, 0, 54, steel);
    // cleaning blade and waste bin behind the drum
    box(1.2, 2 * HW, 12, -17.5, 0, 46, S.mat('#5c7fb8', { rough: 0.6 })); box(16, 2 * HW, 16, -27, 0, 52, shell);
    // laser scanner: housing, six-sided spinning mirror, lens and folding mirror
    box(90, 96, 3, 30, 0, 82, dark);
    const poly = new TH.Mesh(new TH.CylinderGeometry(11 * K, 11 * K, 3 * K, 6).rotateX(PI / 2), S.mat('#e9edf1', { metal: 1, rough: 0.04 })); poly.position.set(58 * K, 0, 87 * K); poly.castShadow = true; g.add(poly);
    box(6, 6, 6, 58, 44, 87, dark); const laserBody = new TH.Mesh(new TH.CylinderGeometry(2.4 * K, 2.4 * K, 12 * K, 16), S.mat('#b8902e', { metal: 1, rough: 0.3 })); laserBody.position.set(58 * K, 36 * K, 87 * K); g.add(laserBody);
    const lens = box(4, 84, 8, 30, 0, 88, glass); lens.castShadow = false; const fold = box(1, 100, 9, 2, 0, 88, S.mat('#e9edf1', { metal: 1, rough: 0.04 })); fold.rotation.y = -PI / 4;
    // paper path: feed plate, sheet through the transfer nip and the fuser, and the side plate that carries the bearings
    const paper = box(250, 100, 0.5, -20, 0, 25.2, paperM); paper.castShadow = false;
    const stripes = []; for (let k = 0; k < 9; k++) { const m = new TH.Mesh(new TH.BoxGeometry(5 * K, 84 * K, 0.2 * K), tonerM); m.position.z = 25.6 * K; g.add(m); stripes.push(m); }
    box(260, 1.5, 96, -15, HW + 8, 50, S.mat('#3b3e45', { rough: 0.5, opacity: 0.5 }));
    const beam = S.lines([], { c: 'c2', opacity: 0.95, w: 2.2 });
    S.add(g);
    return { g, drum, charge, dev, transfer, heat, press, pick, poly, stripes, beam, K, HW };
  }
  const FAC = [4, 6, 8];
  D['laser-engine'] = {
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
        st.leg = L.h('div', '', st.frame);
      }
      const dpi = DPI[v.dpi], fac = FAC[v.fac], e = engine(v.ppm, dpi, fac); st.e = e;
      L.setText(st.cap1, T(tx`The engine of a laser printer with its covers off, slowed about fifty times. The green drum turns once for every 94 mm of paper. Round it, in order: a roller that charges it, the laser line that writes on it, a roller that brushes toner onto it, and a roller under the paper that pulls the toner off. The paper then passes between a hot roller and a soft one that melt the toner into it.`, tx`カバーを外したレーザープリンターのエンジンで、約 50 分の 1 の速さにしています。緑のドラムは、紙が 94 mm 進むごとに 1 回転します。その周りには順に、ドラムを帯電させるローラー、ドラムに書き込むレーザーの線、ドラムにトナーを付けるローラー、紙の下からトナーを引きはがすローラーがあります。紙はその後、熱いローラーと柔らかいローラーの間を通り、トナーが溶けて紙に定着します。`));
      L.setText(st.cap2, T(tx`What the parts must do to print at a given speed. Every scan line needs one face of the spinning mirror, so the mirror’s speed rises with both paper speed and resolution. Writing two or four lines at once with beams side by side divides it. Drag the gold point.`, tx`ある速さで印刷するために、各部品に求められる性能です。走査線 1 本ごとに回転する鏡の面が一つ必要なので、鏡の回転数は紙の速さと解像度の両方とともに上がります。ビームを並べて 2 本または 4 本の線を同時に書けば、その分だけ回転数を下げられます。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [5, 70], y: [0, 100], aspect: 0.8, maxH: 400, xlabel: T('pages per minute', '毎分の印刷枚数'), ylabel: T('mirror speed (thousand rpm)', '鏡の回転数（千 rpm）') });
      g.rect(5, 50, 65, 50, { c: 'c2', fill: 'c2', fo: 0.08, nostroke: true, layer: 'under' }); g.hline(50, { c: 'c2', dash: '4 4' }); g.text(69, 50, T('about the limit of an air-bearing motor', '空気軸受モーターの限界のめやす'), { small: true, anchor: 'end', dy: -5 });
      [[4, 'c3'], [2, 'c4'], [1, 'c1']].forEach(([nb, c]) => g.line(L.sample(5, 70, 40, (q) => Math.min(100, engine(q, dpi, fac).rpm / nb / 1000)), { c, w: nb === 1 ? 2.8 : 2 }));
      g.handle(v.ppm, Math.min(100, e.rpm / 1000), { c: 'hl', axis: 'x', bounds: [5, 70, 0, 100], label: T('pages per minute', '毎分の印刷枚数'), onDrag: (x) => ctx.set('ppm', clamp(Math.round(x), 5, 70)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('one beam', 'ビーム 1 本') }, { c: 'c4', label: T('two beams', 'ビーム 2 本') }, { c: 'c3', label: T('four beams', 'ビーム 4 本') }]);
      ctx.readout([
        { k: T('paper speed, drum speed', '紙の速さ、ドラムの回転数'), v: tx`\(${fmt(e.v, 0)}\ \mathrm{mm/s},\ ${fmt(e.drumRpm, 0)}\ \mathrm{rpm}\)` },
        { k: T('scan lines per second', '毎秒の走査線の数'), v: tx`\(${fmt(e.lines, 0)}\)` },
        { k: T('mirror speed', '鏡の回転数'), v: tx`\(${fmt(Math.round(e.rpm / 100) * 100, 0)}\ \mathrm{rpm}\)`, tone: e.rpm > 50000 ? 'warn' : 'key' },
        { k: T('laser switched at up to', 'レーザーの切り替えの速さ'), v: tx`\(${fmt(e.clock / 1e6, 0)}\ \mathrm{MHz}\)` },
        { k: T('fuser heat, energy per page', '定着器の熱、1 枚あたりのエネルギー'), v: tx`\(${fmt(e.fuser, 0)}\ \mathrm{W},\ ${fmt(e.energy / 1000, 2)}\ \mathrm{kJ}\)` },
      ], T('Fast printers avoid impossible mirror speeds by writing two or four lines per face with several laser beams side by side. The fuser is why a laser printer dims the lights when it starts: it is a heater of the better part of a kilowatt.', '高速のプリンターは、複数のレーザービームを並べて鏡の 1 面で 2 本から 4 本の線を書くことで、実現できない回転数を避けています。レーザープリンターが動き始めると照明が暗くなるのは、定着器のためです。定着器は 1 キロワット近いヒーターです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.8, maxH: 560, camera: [2.2, -20.5, 10.4], target: [-0.4, 0, 2.2], fov: 30,
        label: T('3D view of a laser printer engine. Drag to rotate.', 'レーザープリンターのエンジンの 3D 図。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.eng = buildEngine(S); st.ph = 0;
          S.label(T('spinning mirror', '回転する鏡'), [2.9, -1.5, 5.3], { small: true }); S.label(T('laser line', 'レーザーの線'), [0.4, -3.1, 3.6], { small: true }); S.label(T('drum', 'ドラム'), [0, -3.1, 1.2], { small: true });
          S.label(T('toner', 'トナー'), [3.2, -3.1, 1.9], { small: true }); S.label(T('transfer roller', '転写ローラー'), [0.2, -3.1, 0.0], { small: true }); S.label(T('fuser', '定着器'), [-4.3, -3.1, 2.7], { small: true }); S.label(T('charge roller', '帯電ローラー'), [-1.4, -3.1, 3.2], { small: true });
          const draw = (dt) => {
            const k = st.eng, e2 = st.e, K = k.K, s = (e2.v / 50) * dt;                       // millimetres of paper travel per frame, slowed
            st.ph += s; const rot = (grp, r, dir) => { grp.rotation.y += (dir * s) / r; };
            rot(k.drum, 15, 1); rot(k.transfer, 8, -1); rot(k.charge, 6, -1); rot(k.dev, 9, -1); rot(k.heat, 12, 1); rot(k.press, 11, -1); rot(k.pick, 8, -1);
            k.poly.rotation.z += dt * 4.5;
            k.stripes.forEach((m, i) => { const x = -((st.ph + i * 14) % 126); m.position.x = x * K; m.visible = x < -2; });
            const a = (k.poly.rotation.z * 6) % TAU, y = (((a / TAU) * 2 - 1) * 42) * K;
            k.beam.update([[[58 * K, 36 * K, 87 * K], [58 * K, 0, 87 * K]], [[58 * K, 0, 87 * K], [2 * K, y, 88 * K]], [[2 * K, y, 88 * K], [1.5 * K, y, 55 * K]]]);
          };
          st.draw = draw; draw(0.016);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0.0001); S.invalidate(); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-120, 120], y: [-10, 110], equal: true, maxH: 340, axes: false, grid: false });
          for (const [x, z, r, c] of [[0, 40, 15, 'c3'], [-12.5, 57, 6, 'ink'], [24, 40, 9, 'ink'], [0, 17, 8, 'ink'], [-85, 37, 12, 'c2'], [-85, 14, 11, 'ink']]) f2.circle(x, z, r, { c, w: 2 });
          f2.line([[-115, 25.2], [105, 25.2]], { c: 'ink', w: 1.4 }); f2.line([[58, 87], [2, 88], [1.5, 55]], { c: 'c2', w: 1.6 });
        },
      });
    },
  };
})();
