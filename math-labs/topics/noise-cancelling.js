'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Cancellation: noise 1 plus anti-noise -g e^{-j phi} leaves |1 - g e^{-j phi}| = sqrt(1 + g^2 - 2 g cos phi). A time
   * error tau is a phase error phi = 2 pi f tau, so a fixed delay costs more as frequency rises.
   * Feedback loop: the microphone at the ear drives the speaker through a gain K; the speaker, the air in the canal and the
   * electronics are modelled as a first-order roll-off at F1 and a pure delay tau: L(jw) = K e^{-j w tau} / (1 + j f/F1).
   * Noise at the ear is multiplied by the sensitivity S = 1/(1 + L). The loop is stable while |L| < 1 at the frequency
   * where its phase reaches -180 degrees.
   * Passive isolation of a sealed ear tip, the two active systems and A-weighting are combined in earAttenuation().
   */
  const C0 = 343, F1 = 100;
  const residual = (g, phi) => Math.sqrt(Math.max(0, 1 + g * g - 2 * g * Math.cos(phi)));
  const attDb = (g, phi) => -20 * Math.log10(Math.max(1e-9, residual(g, phi)));
  const fLimit = (tau, A) => Math.asin(Math.min(1, 10 ** (-A / 20) / 2)) / (PI * tau);       // highest f with A dB, gain exact
  const loop = (f, K, tau, f1 = F1) => { const mag = K / Math.hypot(1, f / f1), ph = -Math.atan(f / f1) - TAU * f * tau; return { re: mag * Math.cos(ph), im: mag * Math.sin(ph), mag, ph }; };
  const sens = (f, K, tau, f1 = F1) => { const l = loop(f, K, tau, f1); return 1 / Math.hypot(1 + l.re, l.im); };
  function f180(tau, f1 = F1) { let a = 1, b = 1 / (2 * tau); for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.atan(m / f1) + TAU * m * tau < PI) a = m; else b = m; } return (a + b) / 2; }
  const kMax = (tau, f1 = F1) => Math.hypot(1, f180(tau, f1) / f1);
  const gainMarginDb = (K, tau, f1 = F1) => 20 * Math.log10(kMax(tau, f1) / K);
  function sensPeak(K, tau) { let best = 0, bf = 0; for (let i = 0; i <= 600; i++) { const f = 20 * 1000 ** (i / 600), s = sens(f, K, tau); if (s > best) { best = s; bf = f; } } return { f: bf, db: 20 * Math.log10(best) }; }
  const aWeight = (f) => { const f2 = f * f; return 20 * Math.log10((12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2))) + 2.0; };
  const passiveDb = (f, leak = 0) => Math.min(38, 6 * (1 - leak) + 10 * Math.log10(1 + (f / (600 * (1 + 2 * leak))) ** 2));
  const FB = { K: 8, tau: 60e-6 }, FF = { g: 1.06, tau: 60e-6, cap: 15 };
  function activeDb(f, leak = 0) {
    const fb = -20 * Math.log10(sens(f, FB.K * (1 - 0.85 * leak), FB.tau));
    const gf = (FF.g - 0.6 * leak) / Math.sqrt(1 + (f / 1500) ** 4);                                   // the anti-noise filter is band-limited
    const ff = -20 * Math.log10(residual(gf, TAU * f * FF.tau) + 10 ** (-FF.cap / 20));
    return fb + ff;
  }
  const earAttenuation = (f, leak, anc) => passiveDb(f, leak) + (anc ? activeDb(f, leak) : 0);
  const SOURCES = [
    (f) => 82 - (f > 200 ? 5.5 * Math.log2(f / 200) : 0) - (f < 50 ? 4 * Math.log2(50 / f) : 0),          // aircraft cabin: broadband rumble
    (f) => 76 - 3 * Math.abs(Math.log2(f / 125)) - (f > 2000 ? 4 * Math.log2(f / 2000) : 0),               // train: low and mid
    (f) => 62 - 7 * Math.abs(Math.log2(f / 700)),                                                          // office voices
  ];
  const BANDS = Array.from({ length: 61 }, (_, i) => 20 * 800 ** (i / 60));                                // 20 Hz to 16 kHz
  function levelA(src, leak, anc, worn = true) { let s = 0; for (const f of BANDS) s += 10 ** ((SOURCES[src](f) + aWeight(f) - (worn ? earAttenuation(f, leak, anc) : 0)) / 10); return 10 * Math.log10(s); }
  const M = { C0, F1, residual, attDb, fLimit, loop, sens, f180, kMax, gainMarginDb, sensPeak, aWeight, passiveDb, activeDb, earAttenuation, SOURCES, BANDS, levelA, FB, FF };
  (window.LabModels = window.LabModels || {})['noise-cancelling'] = M;

  const FT = [[Math.log10(20), '20'], [Math.log10(50), '50'], [2, '100'], [Math.log10(200), '200'], [Math.log10(500), '500'], [3, '1k'], [Math.log10(2000), '2k'], [Math.log10(5000), '5k'], [4, '10k']];
  const hz = (f) => (f >= 1000 ? fmt(f / 1000, f >= 10000 ? 1 : 2) + ' kHz' : fmt(f, 0) + ' Hz');

  /* ================= 1. anti-noise: how exact the copy must be ================= */
  D['anti-noise'] = {
    render(ctx, v) {
      const g = 10 ** (v.gdb / 20), tau = v.tau * 1e-6, f = 10 ** v.lf, phi = TAU * f * tau, res = residual(g, phi), att = attDb(g, phi);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Two cycles of a \(${fmt(f, 0)}\) Hz tone at the eardrum: the noise, the anti-noise the earbud plays (the same wave turned upside down, here ${v.gdb === 0 ? 'at exactly the right size' : fmt(Math.abs(v.gdb), 1) + ' dB too ' + (v.gdb > 0 ? 'strong' : 'weak')} and \(${v.tau}\) µs late), and what is left when the two add.`, tx`鼓膜での \(${fmt(f, 0)}\) Hz の音の 2 周期です。騒音、イヤホンが出す逆位相の音（同じ波を上下逆さにしたもので、ここでは大きさが${v.gdb === 0 ? 'ちょうど合っていて' : fmt(Math.abs(v.gdb), 1) + ' dB ' + (v.gdb > 0 ? '強すぎ' : '弱すぎ') + 'て'}、\(${v.tau}\) µs 遅れています）、そして二つを足して残る音です。`));
      const a = L.fig(c1, { x: [0, 2], y: [-1.6, 1.6], aspect: 0.62, maxH: 320, xlabel: T('time (periods)', '時間（周期）'), ylabel: T('sound pressure', '音圧') });
      a.line(L.sample(0, 2, 240, (t) => Math.sin(TAU * t)), { c: 'c2', w: 2.2 });
      a.line(L.sample(0, 2, 240, (t) => -g * Math.sin(TAU * t - phi)), { c: 'c1', w: 2.2 });
      a.area(L.sample(0, 2, 240, (t) => Math.sin(TAU * t) - g * Math.sin(TAU * t - phi)), { c: 'hl', fo: 0.25, base: 0 });
      a.line(L.sample(0, 2, 240, (t) => Math.sin(TAU * t) - g * Math.sin(TAU * t - phi)), { c: 'hl', w: 2.8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Cancellation against frequency for this size and timing error. A delay that is nothing at 100 Hz is a large part of a cycle at 5 kHz, where the anti-noise arrives so late that it adds to the noise instead. Drag the gold point.`, tx`この大きさと時間の誤差での、周波数に対する打ち消しの量です。100 Hz では無視できる遅れも、5 kHz では 1 周期のかなりの部分になり、逆位相の音は遅れすぎて、かえって騒音を強めます。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [1.5, 4], y: [-8, 45], aspect: 0.62, maxH: 320, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('noise removed (dB)', '消えた騒音（dB）'), ticksX: FT.filter((q) => q[0] >= 1.5) });
      b.rect(1.5, -8, 2.5, 8, { c: 'c2', fill: 'c2', fo: 0.1, nostroke: true, layer: 'under' });
      b.text(3.95, -4, T('louder than doing nothing', '何もしないより大きい'), { small: true, anchor: 'end' });
      b.line(L.sample(1.5, 4, 300, (x) => clamp(attDb(1, TAU * 10 ** x * tau), -8, 45)), { c: 'c3', w: 1.6, dash: '5 4' });
      b.line(L.sample(1.5, 4, 300, (x) => clamp(attDb(g, TAU * 10 ** x * tau), -8, 45)), { c: 'c1', w: 2.8 });
      b.handle(v.lf, clamp(att, -8, 45), { c: 'hl', axis: 'x', bounds: [1.5, 4, -8, 45], label: T('frequency', '周波数'), onDrag: (x) => ctx.set('lf', clamp(Math.round(x * 50) / 50, 1.5, 4)) });
      L.legend(ctx.host, [{ c: 'c2', label: T('noise', '騒音') }, { c: 'c1', label: T('anti-noise; cancellation with this error', '逆位相の音、この誤差での打ち消し') }, { c: 'hl', label: T('what is left', '残る音') }, { c: 'c3', dash: true, label: T('timing error alone', '時間の誤差だけの場合') }]);
      ctx.readout([
        { k: T('what is left', '残る音'), v: tx`\(${fmt(res * 100, 1)}\,\%\)`, tone: 'key' },
        { k: T('noise removed', '消えた騒音'), v: tx`\(${fmt(att, 1)}\ \mathrm{dB}\)`, tone: att > 0 ? 'good' : 'warn' },
        { k: T(tx`timing error as phase \(2\pi f\tau\)`, tx`時間の誤差を位相で表すと \(2\pi f\tau\)`), v: tx`\(${fmt((phi * 180) / PI, 1)}^\circ\)` },
        { k: T('20 dB is possible up to (size exact)', '20 dB 消せる上限（大きさが正確なとき）'), v: tau > 0 ? hz(fLimit(tau, 20)) : '∞' },
        { k: T('distance sound travels in that delay', 'その遅れの間に音が進む距離'), v: tx`\(${fmt(C0 * tau * 1000, 1)}\ \mathrm{mm}\)` },
      ], T('Removing 20 dB means matching the noise to within a tenth: about 1 dB in size or 6 degrees in phase. Sound crosses the 10 to 15 mm from an outer microphone to the eardrum side of the speaker in about 40 µs, and that head start is all the time the electronics have.', '20 dB 消すには、騒音と 10 分の 1 以内で一致させる必要があります。大きさで約 1 dB、位相で約 6 度です。音は、外側のマイクからスピーカーの鼓膜側までの 10 から 15 mm を約 40 µs で進みます。この先行分が、電子回路に与えられた時間のすべてです。'));
    },
  };

  /* ================= 2. the feedback loop and its limit ================= */
  D['anc-feedback'] = {
    render(ctx, v) {
      const K = 10 ** (v.kdb / 20), tau = v.tau * 1e-6, fx = f180(tau), gm = gainMarginDb(K, tau), stable = gm > 0, pk = sensPeak(K, tau), lf = Math.log10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A microphone beside the speaker hears what reaches the ear and the amplifier drives the speaker against it. Noise at the ear is divided by \(|1+L|\), where \(L\) is the gain once round the loop. Below the line the loop removes noise; above it, it adds some. Raising the gain deepens the quiet band and raises the hump beside it.`, tx`スピーカーのそばのマイクが耳に届く音を聞き、アンプがそれを打ち消す向きにスピーカーを駆動します。耳での騒音は \(|1+L|\) で割られます。\(L\) はループを一周したときの利得です。線より下ではループが騒音を減らし、上では少し増やします。利得を上げると、静かな帯域は深くなり、その隣のこぶは高くなります。`));
      const a = L.fig(c1, { x: [lf(20), 4.3], y: [-40, 20], aspect: 0.66, maxH: 340, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('noise at the ear (dB)', '耳での騒音（dB）'), ticksX: [...FT, [lf(20000), '20k']] });
      a.rect(lf(20), 0, 4.3 - lf(20), 20, { c: 'c2', fill: 'c2', fo: 0.08, nostroke: true, layer: 'under' });
      a.hline(0, { c: 'ink' });
      const S = L.sample(lf(20), 4.3, 500, (x) => clamp(20 * Math.log10(sens(10 ** x, K, tau)), -40, 20));
      a.area(S.map((q) => [q[0], Math.min(0, q[1])]), { c: 'c1', fo: 0.22, base: 0 }); a.area(S.map((q) => [q[0], Math.max(0, q[1])]), { c: 'c2', fo: 0.3, base: 0 });
      a.line(S, { c: stable ? 'c1' : 'c2', w: 2.8 });
      a.vline(lf(fx), { c: 'c4', dash: '4 3' }); a.text(lf(fx), 17, T('phase −180°', '位相 −180°'), { small: true, anchor: 'end', dx: -5 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The same loop gain drawn as a point moving in the plane as frequency rises from 20 Hz (right) towards 20 kHz (spiralling in). The distance from the point \(-1\) is \(|1+L|\): outside the shaded circle the loop quietens, inside it amplifies, and if the curve passes to the left of \(-1\) the earbud howls.`, tx`同じループ利得を、周波数が 20 Hz（右）から 20 kHz（内側へ巻き込む）へ上がるにつれて平面上を動く点として描いたものです。点 \(-1\) からの距離が \(|1+L|\) です。色を付けた円の外ではループは騒音を減らし、内側では増やします。曲線が \(-1\) の左を通ると、イヤホンは発振して鳴り出します。`));
      const R = Math.max(2.5, Math.min(12, K * 1.08)), b = L.fig(c2, { x: [-R * 0.55, R], y: [-R * 0.9, R * 0.35], equal: true, aspect: 0.66, maxH: 340, xlabel: T('real part of L', 'L の実部'), ylabel: T('imaginary part', '虚部') });
      b.circle(-1, 0, 1, { c: 'c2', fill: 'c2', fo: 0.14, w: 1 });
      b.line(L.sample(lf(20), 4.3, 700, (x) => { const l = loop(10 ** x, K, tau); return [l.re, l.im]; }), { c: stable ? 'c1' : 'c2', w: 2.6 });
      b.dot(-1, 0, { c: 'ink', r: 5 }); b.text(-1, 0, tx`\(-1\)`, { small: true, dy: -10 });
      { const l = loop(fx, K, tau); b.dot(l.re, l.im, { c: 'c4', r: 5 }); }
      L.legend(ctx.host, [{ c: 'c1', label: T('noise at the ear; loop gain', '耳での騒音、ループ利得') }, { c: 'c2', kind: 'fill', label: T('noise made louder', '騒音が大きくなる領域') }, { c: 'c4', kind: 'dot', label: T('where the phase reaches −180°', '位相が −180° になる点') }]);
      ctx.readout([
        { k: T('quiet at low frequency', '低い周波数での静かさ'), v: tx`\(${fmt(20 * Math.log10(1 + K), 1)}\ \mathrm{dB}\)`, tone: 'key' },
        { k: T('cancels up to about', '打ち消しが効く上限のめやす'), v: hz(Math.min(K * F1, fx)) },
        { k: T('worst amplification', '最も増える量'), v: stable ? tx`\(+${fmt(Math.max(0, pk.db), 1)}\ \mathrm{dB}\ \text{at}\ ${fmt(pk.f, 0)}\ \mathrm{Hz}\)` : '—', tone: pk.db > 6 ? 'warn' : undefined },
        { k: T(tx`gain margin at \(${fmt(fx, 0)}\) Hz`, tx`\(${fmt(fx, 0)}\) Hz でのゲイン余裕`), v: tx`\(${fmt(gm, 1)}\ \mathrm{dB}\)`, tone: stable ? (gm > 6 ? 'good' : 'warn') : 'bad' },
        { k: T('state', '状態'), v: stable ? T('stable', '安定') : T('unstable: it howls', '不安定：発振して鳴る'), tone: stable ? 'good' : 'bad' },
      ], T('Delay sets the ceiling. Each extra microsecond brings the −180° point down in frequency, where the loop gain is still large, so the gain must come down with it. This is why the feedback microphone sits within a few millimetres of the speaker, and why feedback cancels the rumble of an engine but not a voice.', '上限を決めるのは遅れです。遅れが 1 マイクロ秒増えるごとに、−180° の点はループ利得がまだ大きい低い周波数へ下がるので、利得も下げなければなりません。フィードバック用のマイクがスピーカーから数ミリメートル以内に置かれるのも、フィードバックがエンジンの低い音は消せても人の声は消せないのも、そのためです。'));
    },
  };

  /* ================= 3. the whole earbud (3D) ================= */
  function buildBud(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.1;                         // 1 unit = 10 mm; +x points into the ear
    const shell = S.mat('#f2f3f5', { rough: 0.22, coat: 1, coatRough: 0.05 }), dark = S.mat('#1d1e21', { rough: 0.5 }), steel = S.mat('#d4d8dd', { metal: 1, rough: 0.22 });
    const sil = S.mat('#e9ecef', { rough: 0.6, coat: 0.1, opacity: 0.62 }), skin = S.mat('#d9a98c', { rough: 0.75, coat: 0.05, opacity: 0.55 }), pcb = S.mat('#1f6a40', { rough: 0.5, coat: 0.6 });
    const gold = S.mat('#c9a13a', { metal: 1, rough: 0.3 }), ti = S.mat('#aeb6c2', { metal: 0.9, rough: 0.3 }), copper = S.mat('#b87333', { metal: 0.9, rough: 0.35 });
    const lathe = (pts, mat, t0 = PI / 2, len = PI * 1.5, parent = g) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[1] * K, q[0] * K)), 64, t0, len).rotateZ(-PI / 2), mat); m.castShadow = mat !== sil && mat !== skin; parent.add(m); return m; };
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w * K, d * K, h * K), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; g.add(m); return m; };
    // housing: a hollow pod 17 mm across, cut open, with the nozzle that carries the ear tip
    lathe([[-9, 0.01], [-8.7, 3], [-7.6, 5.6], [-5, 7.5], [-2, 8.1], [1, 7.5], [3, 5.2], [4, 2.7], [13, 2.4], [13, 1.7], [4.4, 1.9], [3.2, 4.4], [1, 6.7], [-2, 7.3], [-5, 6.7], [-7, 5], [-8, 2.8], [-8.25, 0.01]], shell);
    lathe([[12.6, 0.01], [12.6, 1.7], [12.9, 1.7], [12.9, 0.01]], dark, 0, TAU);                                        // wax guard mesh
    // silicone ear tip: a thin dome folded back over the nozzle
    lathe([[13, 2.45], [12.6, 3.6], [11.2, 4.9], [9.2, 5.7], [7, 6], [5.4, 5.7], [5.4, 5.3], [7, 5.6], [9, 5.3], [10.9, 4.5], [12.1, 3.3], [12.4, 2.45]], sil);
    // dynamic driver: titanium-coated dome and surround, voice coil, magnet and steel cup
    lathe([[2.6, 0.01], [2.45, 1.6], [2.0, 2.4], [1.75, 2.6], [1.95, 3.4], [1.75, 4.3], [1.6, 4.6], [1.5, 4.6], [1.65, 4.3], [1.85, 3.4], [1.65, 2.6], [1.9, 2.4], [2.35, 1.6], [2.5, 0.01]], ti, 0, TAU);
    lathe([[0.2, 2.35], [1.75, 2.35], [1.75, 2.55], [0.2, 2.55]], copper, 0, TAU);
    lathe([[-0.9, 0.01], [-0.9, 2.1], [1.1, 2.1], [1.1, 0.01]], S.mat('#3a3d42', { metal: 0.7, rough: 0.4 }), 0, TAU);
    lathe([[-1.5, 0.01], [-1.5, 4.7], [1.5, 4.7], [1.5, 4.4], [-1.1, 4.4], [-1.1, 2.9], [0.6, 2.9], [0.6, 2.7], [-1.2, 2.7], [-1.2, 0.01]], steel, PI / 2, PI * 1.5);
    // coin cell and the circuit board with its chip
    lathe([[-5.6, 0.01], [-5.6, 5.2], [-2.1, 5.2], [-2.1, 0.01]], steel, 0, TAU);
    lathe([[-6.9, 0.01], [-6.9, 5.6], [-6.4, 5.6], [-6.4, 0.01]], pcb, 0, TAU);
    box(0.5, 3, 3, -7.2, 0.6, -1.2, dark); box(0.4, 1.2, 1.2, -7.15, -2.2, 2.4, dark);
    // microphones: feed-forward under a port in the outer shell, feedback in the nozzle facing the ear
    box(0.8, 1.9, 1.5, -7.4, 0, 3.4, gold); box(0.25, 0.7, 0.7, -8.05, 0, 4.2, dark);
    box(1.6, 1.3, 0.7, 5.6, 0.2, 1.0, gold);
    // stem with the charging contact and a second outward microphone
    const stem = new TH.Mesh(new TH.CapsuleGeometry(2.5 * K, 15 * K, 8, 28).rotateX(PI / 2), shell); stem.position.set(-5.2 * K, 0, -12 * K); stem.castShadow = true; g.add(stem);
    const ring = new TH.Mesh(new TH.CylinderGeometry(2.55 * K, 2.55 * K, 1.2 * K, 28).rotateX(PI / 2), steel); ring.position.set(-5.2 * K, 0, -21.4 * K); g.add(ring);
    // the ear: concha wall and a 26 mm canal ending at the eardrum, cut along the same plane
    lathe([[3.0, 12.2], [4.2, 11.2], [6.0, 8.8], [7.0, 6.9], [9.5, 6.6], [14, 5.2], [22, 4.8], [31, 4.6], [31, 3.8], [22, 4.0], [14, 4.4], [9, 5.9], [6.4, 6.2], [5.4, 8.4], [3.6, 10.6], [2.6, 11.6], [3.0, 12.2]], skin, PI / 2, PI * 1.5);
    const drum = new TH.Mesh(new TH.CircleGeometry(4.3 * K, 40), S.mat('#f1d7c8', { rough: 0.5, opacity: 0.9 })); drum.rotation.y = PI / 2 - 0.5; drum.position.x = 31 * K; g.add(drum);
    g.position.z = 2.75; S.add(g);
    return { g, K };
  }
  const SRC = [['aircraft cabin', '飛行機の客室'], ['train', '電車'], ['office voices', 'オフィスの話し声']];
  D['earbud-attenuation'] = {
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
      const leak = v.leak, anc = v.anc === 1, src = v.src, lf = Math.log10, out = levelA(src, leak, anc, false), tip = levelA(src, leak, false), inn = levelA(src, leak, anc);
      st.amp = { p: 10 ** (-passiveDb(200, leak) / 20), t: 10 ** (-earAttenuation(200, leak, anc) / 20), anc };
      L.setText(st.cap1, T(tx`An earbud in the ear, cut open. Noise (red) reaches the canal weakened by the sealed tip. The outer microphone hears it on the way in and the inner one hears what is left at the ear; the processor drives the speaker with the opposite wave (blue), and the gold wave is what the eardrum receives. The waves are drawn for 200 Hz, not to scale.`, tx`耳に入れたイヤホンの断面です。騒音（赤）は、密閉したイヤーピースで弱められて外耳道に届きます。外側のマイクが入ってくる騒音を聞き、内側のマイクが耳に残った音を聞きます。プロセッサーは逆の波（青）でスピーカーを駆動し、金色の波が鼓膜に届く音です。波は 200 Hz について描いたもので、縮尺は合っていません。`));
      L.setText(st.cap2, T(tx`Noise removed at each frequency: the tip alone, and tip plus electronics. The tip works best on high sounds, the electronics only on low ones, and between them near 1 kHz is the weakest region. A loose fit takes away both.`, tx`各周波数で消える騒音の量です。イヤーピースだけの場合と、イヤーピースに電子回路を加えた場合です。イヤーピースは高い音に最もよく効き、電子回路は低い音にしか効かないので、その間の 1 kHz 付近が最も弱い領域です。装着がゆるいと両方とも失われます。`));
      st.g2.replaceChildren();
      const a = L.fig(st.g2, { x: [lf(20), 4.2], y: [-5, 50], aspect: 0.5, maxH: 250, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('noise removed (dB)', '消えた騒音（dB）'), ticksX: FT });
      const P = L.sample(lf(20), 4.2, 240, (x) => passiveDb(10 ** x, leak)), A = L.sample(lf(20), 4.2, 240, (x) => clamp(earAttenuation(10 ** x, leak, anc), -5, 50));
      a.area(P, { c: 'c3', fo: 0.25, base: 0 }); a.line(P, { c: 'c3', w: 2 });
      if (anc) { a.poly([...A, ...P.slice().reverse()], { c: 'c1', fill: 'c1', fo: 0.2, w: 0.5 }); a.line(A, { c: 'c1', w: 2.8 }); }
      L.setText(st.cap3, T(tx`The ${SRC[src][0]} noise as the ear weighs it (A-weighted), outside and at the eardrum.`, tx`耳の感度で重みを付けた（A 特性）${SRC[src][1]}の騒音です。外と、鼓膜の位置での値です。`));
      st.g3.replaceChildren();
      const b = L.fig(st.g3, { x: [lf(20), 4.2], y: [0, 85], aspect: 0.5, maxH: 250, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('level (dBA)', 'レベル（dBA）'), ticksX: FT });
      const lev = (worn, an) => L.sample(lf(20), 4.2, 240, (x) => { const f = 10 ** x; return clamp(SOURCES[src](f) + aWeight(f) - (worn ? earAttenuation(f, leak, an) : 0), 0, 85); });
      b.area(lev(false), { c: 'c2', fo: 0.14, base: 0 }); b.line(lev(false), { c: 'c2', w: 2.2 }); b.line(lev(true, false), { c: 'c3', w: 2 }); if (anc) b.line(lev(true, true), { c: 'c1', w: 2.8 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('noise outside', '外の騒音') }, { c: 'c3', label: T('ear tip alone', 'イヤーピースだけ') }, { c: 'c1', label: T('with noise cancelling', 'ノイズキャンセリングあり') }]);
      ctx.readout([
        { k: T('level outside', '外でのレベル'), v: tx`\(${fmt(out, 0)}\ \mathrm{dBA}\)` },
        { k: T('at the eardrum', '鼓膜でのレベル'), v: tx`\(${fmt(inn, 0)}\ \mathrm{dBA}\)`, tone: 'key' },
        { k: T('removed: tip, electronics', '消えた量：イヤーピース、電子回路'), v: tx`\(${fmt(out - tip, 1)},\ ${fmt(tip - inn, 1)}\ \mathrm{dB}\)`, tone: 'good' },
        { k: T('removed at 100 Hz, 1 kHz, 5 kHz', '100 Hz、1 kHz、5 kHz で消えた量'), v: tx`\(${fmt(earAttenuation(100, leak, anc), 0)},\ ${fmt(earAttenuation(1000, leak, anc), 0)},\ ${fmt(earAttenuation(5000, leak, anc), 0)}\ \mathrm{dB}\)` },
      ], T('Ten decibels sounds about half as loud. Cancelling helps most where the noise is low and steady, as in an aircraft, and least with voices, whose energy sits where neither the tip nor the electronics is strong.', '10 デシベル下がると、およそ半分の大きさに聞こえます。ノイズキャンセリングが最も役に立つのは、飛行機の中のように騒音が低く一定のときです。話し声にはあまり効きません。声のエネルギーは、イヤーピースも電子回路も強くない帯域にあるからです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.78, maxH: 540, camera: [-1.1, -7.9, 5.3], target: [0.45, 0, 2.3], fov: 30,
        label: T('3D cutaway of an earbud seated in the ear canal. Drag to rotate.', '外耳道に収まったイヤホンの 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.bud = buildBud(S); st.t = 0;
          const z0 = 2.75;
          st.wOut = S.polyline([[0, 0, 0], [0, 0, 0]], { c: 'c2', opacity: 0.95, w: 2.8 }); st.wIn = S.polyline([[0, 0, 0], [0, 0, 0]], { c: 'c2', opacity: 0.9, w: 2.2 });
          st.wAnti = S.polyline([[0, 0, 0], [0, 0, 0]], { c: 'c1', opacity: 0.95, w: 2.2 }); st.wRes = S.polyline([[0, 0, 0], [0, 0, 0]], { c: 'hl', opacity: 1, w: 3.2 });
          S.label(T('outer microphone', '外側のマイク'), [-1.1, 0, z0 + 1.2], { small: true }); S.label(T('battery', '電池'), [-1.35, -0.3, z0 - 0.7], { small: true }); S.label(T('speaker', 'スピーカー'), [0.15, 0, z0 + 1.05], { small: true });
          S.label(T('inner microphone', '内側のマイク'), [1.25, 0, z0 + 0.72], { small: true }); S.label(T('ear tip', 'イヤーピース'), [1.0, -0.3, z0 - 0.95], { small: true }); S.label(T('eardrum', '鼓膜'), [2.5, 0, z0 + 1.0], { small: true }); S.label(T('ear canal', '外耳道'), [2.2, -0.3, z0 - 0.8], { small: true });
          const draw = () => {
            const A = st.amp, k = 3.1, ph = st.t * 5, wave = (x0, x1, amp, sign, dz) => { const p = []; for (let i = 0; i <= 60; i++) { const x = x0 + ((x1 - x0) * i) / 60; p.push([x, -0.02, z0 + dz + sign * amp * 0.34 * Math.sin(k * x - ph)]); } return p; };
            st.wOut.update(wave(-3.6, -1.0, 1, 1, 0)); st.wIn.update(wave(1.35, 3.0, A.p, 1, 0));
            st.wAnti.update(A.anc ? wave(1.35, 3.0, Math.max(0, A.p - A.t), -1, 0) : [[0, 0, -5], [0, 0, -5]]);
            st.wRes.update(wave(1.35, 3.0, A.t, 1, 0));
          };
          st.draw = draw; draw();
          S.animate((dt) => { if (S.reduced()) return false; st.t += Math.min(0.05, dt || 0.016); draw(); return true; });
        },
        update(S) { st.draw(); S.invalidate(); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-28, 34], y: [-26, 20], equal: true, maxH: 360, axes: false, grid: false });
          f2.poly([[-9, 0], [-7.6, 5.6], [-2, 8.1], [3, 5.2], [4, 2.7], [13, 2.4], [13, -2.4], [4, -2.7], [3, -5.2], [-2, -8.1], [-7.6, -5.6]], { c: 'ink', fill: 'grid', fo: 0.5, w: 1.6 });
          f2.rect(-7.7, -23, 5, 18, { c: 'ink', fill: 'grid', fo: 0.5 }); f2.seg([14, 4.4], [31, 3.8], { c: 'c4', w: 2 }); f2.seg([14, -4.4], [31, -3.8], { c: 'c4', w: 2 }); f2.seg([31, 3.8], [31, -3.8], { c: 'c4', w: 3 });
          const A = st.amp; f2.line(L.sample(-26, -10, 80, (x) => 3.4 * Math.sin(x * 0.9)), { c: 'c2', w: 2 }); f2.line(L.sample(14, 30, 80, (x) => 3.4 * A.t * Math.sin(x * 0.9)), { c: 'hl', w: 2.6 });
        },
      });
    },
  };
})();
