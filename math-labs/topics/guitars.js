'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * String: f = (1 / 2L) sqrt(T / mu). Frets in equal temperament: distance from the nut x_n = L (1 - 2^(-n/12)).
   * A string pulled aside at a fraction p of its length and released has harmonics a_n = 2 sin(n pi p) /
   * (n^2 pi^2 p (1 - p)), as fractions of the pull.
   * Neck as a beam: strings of total tension F acting h above its neutral axis bow it forward; a rod under tension
   * P set e below the axis bows it back. Relief at mid-span = (F h - P e) l^2 / (8 E I).
   * Pickup: the coil senses string velocity at its own position, so harmonic n is weighted by n |sin(n pi q)|,
   * q being the pickup's distance from the bridge as a fraction of the sounding length. Electrically the coil
   * (L, R) with the cable capacitance is a resonant low-pass filter.
   */
  const SCALE = 0.648, OPEN = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41], MU = [4.01e-4, 7.08e-4, 1.14e-3, 2.06e-3, 4.05e-3, 6.8e-3], NAMES = ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯'];
  const freq = (Lm, Tn, mu) => Math.sqrt(Tn / mu) / (2 * Lm);
  const tensionFor = (f, mu, Lm = SCALE) => mu * (2 * Lm * f) ** 2;
  const fretPos = (n, Lm = SCALE) => Lm * (1 - 2 ** (-n / 12));
  const fretted = (s, n) => OPEN[s] * 2 ** (n / 12);
  const noteName = (f) => { const k = Math.round(12 * Math.log2(f / 440)); return NAMES[((k % 12) + 12) % 12] + (4 + Math.floor((k + 9) / 12)); };
  const totalTension = (heavy = 1) => OPEN.reduce((s, f, i) => s + tensionFor(f, MU[i] * heavy), 0);
  const harmonic = (n, p) => (2 * Math.sin(n * PI * p)) / (n * n * PI * PI * p * (1 - p));
  const shape = (x, p, N) => { let y = 0; for (let n = 1; n <= N; n++) y += harmonic(n, p) * Math.sin(n * PI * x); return y; };
  const EI = 11e9 * 0.11 * 0.043 * 0.021 ** 3;
  const relief = (F, P, h = 0.012, e = 0.006, l = 0.45) => ((F * h - P * e) * l * l) / (8 * EI);                 // m, positive = bowed forward
  const rodFor = (F, want, h = 0.012, e = 0.006, l = 0.45) => (F * h - (want * 8 * EI) / (l * l)) / e;
  const sensed = (n, p, q) => Math.abs(n * harmonic(n, p) * Math.sin(n * PI * q));
  function coil(f, Ccable, tone = 10, Lh = 2.5, Rdc = 6000, Rload = 200e3) { const w = TAU * f, C = 120e-12 + Ccable, Rt = 250e3 * (tone / 10) ** 2 + 500, Ct = 22e-9;
    const inv = (z) => { const d = z[0] * z[0] + z[1] * z[1]; return [z[0] / d, -z[1] / d]; }, add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const Yp = add(add([1 / Rload, 0], [0, w * C]), inv([Rt, -1 / (w * Ct)])), Zp = inv(Yp), Zs = [Rdc, w * Lh], H = mul(Zp, inv(add(Zs, Zp))); return Math.hypot(H[0], H[1]); }
  const coilPeak = (Ccable, Lh = 2.5) => 1 / (TAU * Math.sqrt(Lh * (120e-12 + Ccable)));
  const M = { SCALE, OPEN, MU, freq, tensionFor, fretPos, fretted, noteName, totalTension, harmonic, shape, EI, relief, rodFor, sensed, coil, coilPeak };
  (window.LabModels = window.LabModels || {}).guitars = M;

  /* ================= 1. one string ================= */
  D['string-harmonics'] = {
    render(ctx, v) {
      const s = v.s, f = fretted(s, v.fret), Lv = SCALE - fretPos(v.fret), Tn = tensionFor(OPEN[s], MU[s]), p = v.p, N = 12;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The sounding length of the string, from the fret on the left to the bridge on the right, at the moment it is released. The finger pulls it into a corner at the gold point. That shape is exactly a sum of smooth standing waves, the harmonics; the first three are drawn in grey and the sum of the first twelve in red. Drag the gold point along the string.`, tx`弦が離される瞬間の、鳴る部分の形です。左がフレット、右がブリッジです。指が、金色の点で弦を角の形に引いています。この形は、滑らかな定常波、つまり倍音の和として、正確に表せます。最初の三つを灰色で、最初の 12 個の和を赤で描いています。金色の点を、弦に沿ってドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 1], y: [-0.4, 1.25], aspect: 0.6, maxH: 320, xlabel: T('along the string (fret to bridge)', '弦に沿った位置（フレットからブリッジまで）'), ylabel: T('pulled aside (1 = at the finger)', '引かれた量（1 = 指の位置）'), ticksX: [[0, T('fret', 'フレット')], [0.5, '½'], [1, T('bridge', 'ブリッジ')]] });
      a.hline(0, { c: 'muted' }); [1, 2, 3].forEach((n) => a.line(L.sample(0, 1, 100, (x) => harmonic(n, 1 - p) * Math.sin(n * PI * x)), { c: 'muted', w: 1.2 })); a.line([[0, 0], [1 - p, 1], [1, 0]], { c: 'ink', w: 1.4, dash: '4 3' }); a.line(L.sample(0, 1, 240, (x) => shape(x, 1 - p, N)), { c: 'c2', w: 2.6 });
      a.handle(1 - p, 1, { c: 'hl', axis: 'x', bounds: [0.5, 0.98, -0.4, 1.25], label: T('where it is plucked', '弾く位置'), onDrag: (x) => ctx.set('p', clamp(Math.round((1 - x) * 50) / 50, 0.02, 0.5)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Strength of each harmonic in that shape. Plucked near the middle, the string is almost all fundamental and sounds round. Plucked \(${fmt(p * 100, 0)}\) per cent of the way from the bridge, the high harmonics are stronger and the tone is brighter. Any harmonic with a still point where the finger is cannot be set going at all.`, tx`その形に含まれる、それぞれの倍音の強さです。中央の近くで弾くと、弦はほとんど基音だけになり、丸い音がします。ブリッジから \(${fmt(p * 100, 0)}\) % の位置で弾くと、高い倍音が強くなり、音は明るくなります。指の位置に節がある倍音は、まったく鳴りません。`));
      const b = L.fig(c2, { x: [0, 13], y: [0, 1.05], aspect: 0.6, maxH: 320, xlabel: T('harmonic', '倍音の番号'), ylabel: T('strength (fundamental = 1)', '強さ（基音 = 1）'), ticksX: [1, 2, 3, 4, 5, 6, 8, 10, 12].map((q) => [q, String(q)]) });
      const a1 = Math.abs(harmonic(1, p)); for (let n = 1; n <= 12; n++) b.rect(n - 0.32, 0, 0.64, Math.abs(harmonic(n, p)) / a1, { c: 'c1', fill: 'c1', fo: 0.55 });
      L.legend(ctx.host, [{ c: 'c2', label: T('sum of twelve harmonics', '12 個の倍音の和') }, { c: 'muted', label: T('first three harmonics', '最初の三つの倍音') }, { c: 'c1', label: T('strength of each', 'それぞれの強さ') }]);
      ctx.readout([
        { k: T('note', '音'), v: tx`\(\text{${noteName(f)}},\ ${fmt(f, 1)}\ \mathrm{Hz}\)`, tone: 'key' },
        { k: T('sounding length', '鳴る部分の長さ'), v: tx`\(${fmt(Lv * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('tension', '張力'), v: tx`\(${fmt(Tn, 1)}\ \mathrm{N}\ (${fmt(Tn / 9.81, 1)}\ \mathrm{kg})\)` },
        { k: T('speed of waves along it', '弦を伝わる波の速さ'), v: tx`\(${fmt(Math.sqrt(Tn / MU[s]), 0)}\ \mathrm{m/s}\)` },
        { k: T('second and third harmonics', '第 2、第 3 倍音'), v: tx`\(${fmt((100 * Math.abs(harmonic(2, p))) / a1, 0)}\ \%,\ ${fmt((100 * Math.abs(harmonic(3, p))) / a1, 0)}\ \%\)` },
      ], T('Pressing a string against a fret does not change its tension or its weight, only its length: each fret shortens it by the same fraction, so each raises the pitch by the same interval.', '弦をフレットに押さえても、張力も重さも変わらず、長さだけが変わります。フレットごとに同じ割合で短くなるので、音の高さは、フレットごとに同じ音程だけ上がります。'));
    },
  };

  /* ================= 2. the neck (3D) ================= */
  function buildGuitar(S) {
    const TH = S.THREE, g = new TH.Group(), K = 10;                                                    // 1 unit = 100 mm; nut at x = 0, bridge at x = 6.48
    const bodyM = S.mat('#27447e', { rough: 0.25, coat: 1 }), maple = S.mat('#d9b87c', { rough: 0.5, coat: 0.6, opacity: 0.45 }), mapleS = S.mat('#d9b87c', { rough: 0.5, coat: 0.6 }), rose = S.mat('#4a3022', { rough: 0.7 }), nickel = S.mat('#d8dce1', { metal: 1, rough: 0.2 }), black = S.mat('#17181a', { rough: 0.5 }), white = S.mat('#efeee8', { rough: 0.4 }), rodM = S.mat('#b8432a', { metal: 0.8, rough: 0.35 });
    const pts = []; for (let i = 0; i < 120; i++) { const th = (i / 120) * TAU, d1 = (th - (PI - 0.72)) / 0.2, d2 = (th - (PI + 0.72)) / 0.2, r = 1.72 - 0.2 * Math.cos(2 * th) + 0.12 * Math.cos(th) - 0.5 * Math.exp(-d1 * d1) - 0.5 * Math.exp(-d2 * d2); pts.push(new TH.Vector2(5.45 + 1.22 * r * Math.cos(th), 0.98 * r * Math.sin(th))); }
    { const m = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape(pts), { depth: 0.4, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }), bodyM); m.position.z = -0.47; m.castShadow = true; g.add(m); }
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    box(4.5, 0.5, 0.2, 2.25, 0, -0.14, maple).castShadow = false; box(4.75, 0.52, 0.05, 2.3, 0, -0.005, rose); box(0.06, 0.46, 0.07, -0.03, 0, 0.02, white);
    { const hs = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape([[-0.05, -0.27], [-0.4, -0.42], [-1.75, -0.36], [-1.95, -0.1], [-1.8, 0.3], [-0.45, 0.42], [-0.05, 0.27]].map((q) => new TH.Vector2(q[0], q[1]))), { depth: 0.14, bevelEnabled: false }), mapleS); hs.position.z = -0.2; hs.castShadow = true; g.add(hs); for (let k = 0; k < 6; k++) { const pg = new TH.Mesh(new TH.CylinderGeometry(0.035, 0.035, 0.22, 10).rotateX(PI / 2), nickel); pg.position.set(-0.4 - 0.25 * k, 0.2 - 0.07 * k + (k > 2 ? 0 : 0), 0.02); g.add(pg); } }
    for (let n = 1; n <= 21; n++) box(0.025, 0.5, 0.025, fretPos(n) * K, 0, 0.03, nickel);
    for (const n of [3, 5, 7, 9, 15, 17]) { const d = new TH.Mesh(new TH.CylinderGeometry(0.035, 0.035, 0.005, 12).rotateX(PI / 2), white); d.position.set(((fretPos(n) + fretPos(n - 1)) / 2) * K, 0, 0.022); g.add(d); }
    { const rod = new TH.Mesh(new TH.CylinderGeometry(0.03, 0.03, 4.3, 12).rotateZ(PI / 2), rodM); rod.position.set(2.15, 0, -0.17); g.add(rod); const nutA = new TH.Mesh(new TH.CylinderGeometry(0.06, 0.06, 0.16, 6).rotateZ(PI / 2), nickel); nutA.position.set(-0.02, 0, -0.17); g.add(nutA); const anc = new TH.Mesh(new TH.CylinderGeometry(0.06, 0.06, 0.1, 10).rotateZ(PI / 2), nickel); anc.position.set(4.3, 0, -0.17); g.add(anc); }
    for (const x of [4.75, 6.05]) { box(0.2, 0.72, 0.1, x, 0, -0.03, white); for (let k = 0; k < 6; k++) { const pp = new TH.Mesh(new TH.CylinderGeometry(0.025, 0.025, 0.03, 10).rotateX(PI / 2), nickel); pp.position.set(x, -0.26 + 0.104 * k + 0, 0.03); g.add(pp); } }
    box(0.22, 0.8, 0.12, 6.52, 0, 0.0, nickel); for (const [x, y] of [[6.5, -0.75], [6.85, -0.5]]) { const kn = new TH.Mesh(new TH.CylinderGeometry(0.11, 0.09, 0.12, 20).rotateX(PI / 2), black); kn.position.set(x, y, 0.0); g.add(kn); }
    const strings = []; for (let k = 0; k < 6; k++) { const y0 = -0.175 + 0.07 * k, y1 = -0.26 + 0.104 * k, len = Math.hypot(6.5, y1 - y0), m = new TH.Mesh(new TH.CylinderGeometry(0.006 + 0.003 * k, 0.006 + 0.003 * k, len, 6).rotateZ(PI / 2), nickel); m.position.set(3.25, (y0 + y1) / 2, 0.075); m.rotation.z = Math.atan2(y1 - y0, 6.5); g.add(m); strings.push({ m, y0, y1 }); }
    const vib = S.lines([], { c: 'hl', opacity: 1, w: 2.6 }), finger = new TH.Mesh(new TH.SphereGeometry(0.07, 14, 10), S.mat('#e2a400', { glow: 0.6, glowColour: '#e2a400' })); g.add(finger);
    S.add(g);
    return { strings, vib, finger, K };
  }
  D['guitar-neck'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const F = totalTension(v.heavy), rl = relief(F, v.rod), want = rodFor(F, 0.00025), s = v.s, f = fretted(s, v.fret); st.p = v;
      L.setText(st.cap1, T(tx`An electric guitar with the wood of its neck made see-through. Six steel strings run from the nut at the head to the bridge on the body, \(648\) mm apart, and together pull with \(${fmt(F, 0)}\) N. They lie above the neck, so they bend it forward like a bow. The red rod inside the neck is a steel bar under tension below the centre line, pulling the other way. The gold string is sounding \(\text{${noteName(f)}}\), stopped at fret \(${v.fret}\); its swing is greatly enlarged.`, tx`ネックの木を透明にした、エレクトリックギターです。6 本の鋼の弦が、ヘッド側のナットからボディのブリッジまで、\(648\) mm の間に張られ、合わせて \(${fmt(F, 0)}\) N で引いています。弦はネックの上側にあるので、ネックを弓のように前へ反らせます。ネックの中の赤い棒は、中心線より下で張力をかけた鋼の棒で、逆向きに引きます。金色の弦は、\(${v.fret}\) フレットを押さえて \(\text{${noteName(f)}}\) を鳴らしています。振れ幅は、大きく拡大してあります。`));
      L.setText(st.cap2, T(tx`How far the middle of the neck bows forward against the tension in the rod. With the rod slack the strings pull the neck \(${fmt(relief(F, 0) * 1000, 2)}\) mm out of straight. Tightening the nut at the end of the rod straightens it, and further tightening bends it backward until the strings rattle on the frets. Players aim for the shaded band, a hair of forward bow. Drag the gold point.`, tx`ネックの中央が前へ反る量を、棒の張力に対して描いています。棒が緩んでいると、弦がネックを \(${fmt(relief(F, 0) * 1000, 2)}\) mm 反らせます。棒の端のナットを締めるとまっすぐになり、さらに締めると逆に反って、弦がフレットに当たってびびります。演奏者は、網かけの範囲、つまりごくわずかな順反りを目指します。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 1500], y: [-0.25, 0.45], aspect: 0.8, maxH: 400, xlabel: T('tension in the truss rod (N)', 'トラスロッドの張力（N）'), ylabel: T('forward bow at mid-neck (mm)', 'ネック中央の順反り（mm）') });
      g.rect(0, 0.15, 1500, 0.2, { c: 'c3', fill: 'c3', fo: 0.14, nostroke: true, layer: 'under' }); g.hline(0, { c: 'muted' }); [0.85, 1.2].filter((h) => Math.abs(h - v.heavy) > 0.01).forEach((h) => g.line([[0, relief(totalTension(h), 0) * 1000], [1500, relief(totalTension(h), 1500) * 1000]], { c: 'muted', w: 1.3 })); g.line([[0, relief(F, 0) * 1000], [1500, relief(F, 1500) * 1000]], { c: 'c1', w: 2.8 });
      g.handle(v.rod, clamp(rl * 1000, -0.25, 0.45), { c: 'hl', axis: 'x', bounds: [0, 1500, -0.25, 0.45], label: T('rod tension', 'ロッドの張力'), onDrag: (x) => ctx.set('rod', clamp(Math.round(x / 10) * 10, 0, 1500)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('these strings', 'この弦') }, { c: 'muted', label: T('lighter and heavier sets', '細い弦と太い弦') }, { c: 'c3', label: T('usual setting', '普通の設定') }]);
      ctx.readout([
        { k: T('pull of all six strings', '6 本の弦の引く力の合計'), v: tx`\(${fmt(F, 0)}\ \mathrm{N}\ (${fmt(F / 9.81, 0)}\ \mathrm{kg})\)` },
        { k: T('bending on the neck: strings, rod', 'ネックの曲げ：弦、ロッド'), v: tx`\(${fmt(F * 0.012, 2)},\ ${fmt(v.rod * 0.006, 2)}\ \mathrm{N\,m}\)` },
        { k: T('bow at mid-neck', 'ネック中央の反り'), v: tx`\(${fmt(Math.abs(rl) * 1000, 2)}\ \mathrm{mm}\ \text{${T(rl >= 0 ? 'forward' : 'backward', rl >= 0 ? '順反り' : '逆反り')}}\)`, tone: rl < 0.1e-3 ? 'warn' : rl > 0.4e-3 ? 'warn' : 'good' },
        { k: T('rod tension for 0.25 mm', '0.25 mm にするロッドの張力'), v: tx`\(${fmt(Math.max(0, want), 0)}\ \mathrm{N}\)`, tone: 'key' },
        { k: T('fret ' + v.fret + ' is from the nut', v.fret + ' フレットのナットからの距離'), v: tx`\(${fmt(fretPos(v.fret) * 1000, 1)}\ \mathrm{mm}\)` },
        { k: T('width of that fret space', 'そのフレット間の幅'), v: v.fret > 0 ? tx`\(${fmt((fretPos(v.fret) - fretPos(v.fret - 1)) * 1000, 1)}\ \mathrm{mm}\)` : T('open string', '開放弦') },
      ], T('The twelfth fret is exactly half-way along the string and each fret space is 5.6 per cent narrower than the one before, which is why the frets crowd together toward the body.', '12 フレットは、弦のちょうど中央にあります。フレットの間隔は、一つ前より 5.6 % ずつ狭くなるので、フレットはボディに向かって密になります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.8 : 0.66, maxH: 460, camera: [0.6, -11.5, 5.6], target: [2.5, 0, -0.1], fov: 30,
        label: T('3D electric guitar with a see-through neck and truss rod. Drag to rotate.', 'ネックを透明にしてトラスロッドが見えるエレクトリックギターの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.gt = buildGuitar(S); st.t = 0;
          S.label(T('truss rod', 'トラスロッド'), [2.0, -0.7, -0.5], { small: true }); S.label(T('nut', 'ナット'), [-0.05, 0.75, 0.25], { small: true }); S.label(T('pickups', 'ピックアップ'), [5.4, 1.35, 0.3], { small: true }); S.label(T('bridge', 'ブリッジ'), [6.9, 1.0, 0.3], { small: true });
          const draw = (dt) => { const m = st.gt, q = st.p; st.t += dt; const sd = m.strings[q.s], x0 = fretPos(q.fret) * 10, x1 = 6.5, yAt = (x) => sd.y0 + ((sd.y1 - sd.y0) * x) / 6.5, sg = [], n = 40, amp = 0.07 * Math.cos(st.t * 9) * Math.exp(-((st.t % 3) / 2.2)); for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, z = (u) => 0.075 + amp * (Math.sin(PI * u) + 0.35 * Math.sin(2 * PI * u) * Math.cos(st.t * 9)); sg.push([[x0 + (x1 - x0) * u0, yAt(x0 + (x1 - x0) * u0), z(u0)], [x0 + (x1 - x0) * u1, yAt(x0 + (x1 - x0) * u1), z(u1)]]); } m.vib.update(sg); m.strings.forEach((s2, i) => { s2.m.visible = i !== q.s || q.fret > 0; }); m.finger.visible = q.fret > 0; m.finger.position.set(x0 - 0.12, yAt(x0), 0.1); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-2.2, 8], y: [-2.2, 2.2], equal: true, maxH: 260, axes: false, grid: false }); f2.rect(0, -0.26, 4.5, 0.52, { c: 'ink', fill: 'grid', fo: 0.5, w: 1.2 }); f2.circle(5.5, 0, 1.9, { c: 'c1', fill: 'c1', fo: 0.3, w: 1.4 }); for (let n = 1; n <= 21; n++) f2.seg([fretPos(n) * 10, -0.26], [fretPos(n) * 10, 0.26], { c: 'ink', w: 1 }); f2.seg([0, 0], [6.5, 0], { c: 'hl', w: 2 }); },
      });
    },
  };

  /* ================= 3. the pickup ================= */
  D['pickup-tone'] = {
    render(ctx, v) {
      const p = 0.18, q = v.q / 100, fp = coilPeak(v.cable * 1e-12), lf = (x) => Math.log10(x), f0 = 110;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`What a pickup hears of each harmonic of a string plucked near the bridge. A pickup is a magnet wrapped in thousands of turns of fine wire; the steel string moving above it disturbs the magnet's field and induces a voltage in the coil. It senses only the part of the string directly above it, so it misses any harmonic that has a still point there. This one is \(${fmt(v.q, 0)}\) per cent of the way from the bridge (blue); the grey bars are a pickup right at the bridge. Drag the gold point.`, tx`ブリッジの近くで弾いた弦の、それぞれの倍音を、ピックアップがどれだけ拾うかを示します。ピックアップは、細い電線を何千回も巻いた磁石です。その上で鋼の弦が動くと、磁石の磁場が乱され、コイルに電圧が生じます。ピックアップは、真上にある弦の部分だけを感じ取るので、そこに節がある倍音は拾えません。このピックアップは、ブリッジから \(${fmt(v.q, 0)}\) % の位置にあります（青）。灰色の棒は、ブリッジのすぐそばにあるピックアップです。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 17], y: [0, 1.2], aspect: 0.7, maxH: 350, xlabel: T('harmonic', '倍音の番号'), ylabel: T('picked up (largest = 1)', '拾う強さ（最大 = 1）'), ticksX: [1, 2, 4, 6, 8, 10, 12, 14, 16].map((k) => [k, String(k)]) });
      const mx = Math.max(...Array.from({ length: 16 }, (_, i) => sensed(i + 1, p, q))), mb = Math.max(...Array.from({ length: 16 }, (_, i) => sensed(i + 1, p, 0.06))); for (let n = 1; n <= 16; n++) { a.rect(n - 0.36, 0, 0.3, sensed(n, p, 0.06) / mb, { c: 'muted', fill: 'muted', fo: 0.5 }); a.rect(n + 0.02, 0, 0.34, sensed(n, p, q) / mx, { c: 'c1', fill: 'c1', fo: 0.6 }); }
      a.handle(1 / q, 1.12, { c: 'hl', axis: 'x', bounds: [2, 16.6, 0, 1.2], label: T('first harmonic the pickup cannot hear', 'ピックアップが拾えない最初の倍音'), onDrag: (x) => ctx.set('q', clamp(Math.round(100 / x), 6, 50)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`What the coil and its cable then do to that signal, against frequency. The coil has a large inductance and the cable a small capacitance, and together they resonate: frequencies near \(${fmt(fp / 1000, 1)}\) kHz are boosted and everything above is cut steeply. A longer cable lowers the peak (grey: 100 pF and 1500 pF). Turning down the tone control (red) connects a capacitor that swallows the peak.`, tx`コイルとケーブルが、その信号に何をするかを、周波数に対して描いています。コイルには大きなインダクタンスがあり、ケーブルには小さな静電容量があり、合わせて共振します。\(${fmt(fp / 1000, 1)}\) kHz 付近の周波数は持ち上げられ、それより上は急に落ちます。ケーブルを長くすると、山は低い周波数へ移ります（灰色：100 pF と 1500 pF）。トーンつまみを絞ると（赤）、コンデンサーがつながり、山がなくなります。`));
      const b = L.fig(c2, { x: [lf(50), lf(20000)], y: [0, 3.2], aspect: 0.7, maxH: 350, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('output ÷ signal in the coil', '出力 ÷ コイルに生じた信号'), ticksX: [100, 1000, 10000].map((k) => [lf(k), String(k)]) });
      b.hline(1, { c: 'muted', dash: '4 4' }); [100, 1500].forEach((cc) => b.line(L.sample(lf(50), lf(20000), 160, (x) => Math.min(3.2, coil(10 ** x, cc * 1e-12, 10))), { c: 'muted', w: 1.3 })); b.line(L.sample(lf(50), lf(20000), 200, (x) => Math.min(3.2, coil(10 ** x, v.cable * 1e-12, 10))), { c: 'c1', w: 2.8 }); b.line(L.sample(lf(50), lf(20000), 200, (x) => Math.min(3.2, coil(10 ** x, v.cable * 1e-12, v.tone))), { c: 'c2', w: 2.2 });
      L.legend(ctx.host, [{ c: 'c1', label: T('this pickup; tone control full up', 'このピックアップ、トーン全開') }, { c: 'muted', label: T('bridge pickup; other cables', 'ブリッジ側のピックアップ、ほかのケーブル') }, { c: 'c2', label: T('tone control as set', 'トーンつまみの設定') }]);
      ctx.readout([
        { k: T('pickup is from the bridge', 'ブリッジからピックアップまで'), v: tx`\(${fmt(q * SCALE * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('harmonics it cannot hear', '拾えない倍音'), v: tx`\(${fmt(1 / q, 1)},\ ${fmt(2 / q, 1)},\ \dots\)`, tone: 'key' },
        { k: T('on the open A string that is', '開放の A 弦でのその周波数'), v: tx`\(${fmt((f0 / q) / 1000, 2)}\ \mathrm{kHz}\)` },
        { k: T('coil and cable resonate at', 'コイルとケーブルの共振周波数'), v: tx`\(${fmt(fp / 1000, 2)}\ \mathrm{kHz}\)` },
        { k: T('boost at the peak: tone up, as set', '山での増幅：トーン全開、設定値'), v: tx`\(\times${fmt(coil(fp, v.cable * 1e-12, 10), 2)},\ \times${fmt(coil(fp, v.cable * 1e-12, v.tone), 2)}\)` },
      ], T('A pickup near the neck sits where the low harmonics swing widely and has its first deaf spot low down, so it sounds full and soft. One by the bridge sees little movement but hears every harmonic, and sounds thin and bright.', 'ネック側のピックアップは、低い倍音が大きく振れる場所にあり、最初に拾えなくなる倍音が低いので、太く柔らかい音がします。ブリッジ側のピックアップは、動きは小さいものの、すべての倍音を拾うので、細く明るい音がします。'));
    },
  };
})();
