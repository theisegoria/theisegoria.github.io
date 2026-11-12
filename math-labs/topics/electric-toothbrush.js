'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Sonic brush: the shaft and head are a torsional oscillator (moment of inertia J on a torsion spring) driven by an
   * alternating electromagnetic torque. Steady-state amplitude
   *   theta0(f) = theta_res (f0^2 / Q0) / sqrt((f0^2 - f^2)^2 + (f f0 / Q)^2),
   * normalised so that the free brush driven at its natural frequency f0 swings theta_res. Pressing the bristles on the
   * teeth adds damping (Q falls) and a little stiffness (f0 rises).
   * Power lost in the oscillator: P = J w0 w^2 theta0^2 / (2 Q).
   * Charging: two coils with coupling k and quality factors Q1, Q2 can pass power with at best
   *   eta = x / (1 + sqrt(1 + x))^2,  x = k^2 Q1 Q2.
   */
  const F0 = 260, Q0 = 12, THRES = (6 * PI) / 180, RT = 0.011, J = 2e-7;         // Hz, -, rad, bristle-tip radius (m), kg m^2
  const qOf = (F) => Q0 / (1 + F / 1.5), f0Of = (F) => F0 * (1 + 0.02 * F);
  const amp = (f, F = 0, drive = 1) => { const f0 = f0Of(F), Q = qOf(F); return (drive * THRES * (F0 * F0 / Q0)) / Math.sqrt((f0 * f0 - f * f) ** 2 + ((f * f0) / Q) ** 2); };
  const phaseLag = (f, F = 0) => { const f0 = f0Of(F), Q = qOf(F); return Math.atan2((f * f0) / Q, f0 * f0 - f * f); };
  const tipAmp = (f, F, drive) => RT * amp(f, F, drive), tipSpeed = (f, F, drive) => TAU * f * tipAmp(f, F, drive);
  const lossPower = (f, F, drive) => { const w = TAU * f, w0 = TAU * f0Of(F), a = amp(f, F, drive); return (J * w0 * w * w * a * a) / (2 * qOf(F)); };
  const peakFreq = (F) => { const f0 = f0Of(F), Q = qOf(F); return f0 * Math.sqrt(Math.max(0, 1 - 1 / (2 * Q * Q))); };
  const coupling = (g) => 0.75 * Math.exp(-g / 5);
  const etaMax = (k, Q1, Q2 = Q1) => { const x = k * k * Q1 * Q2; return x / (1 + Math.sqrt(1 + x)) ** 2; };
  const BATT = 2.6;                                                              // watt-hours: one 700 mAh lithium-ion cell
  // brushing styles for comparison: [strokes per minute, tip travel per stroke in mm]
  const STYLES = [[300, 20], [8800, 2 * 6.5 * ((25 * PI) / 180)], [2 * F0 * 60, 2 * RT * 1000 * THRES]];
  const M = { F0, Q0, THRES, RT, J, qOf, f0Of, amp, phaseLag, tipAmp, tipSpeed, lossPower, peakFreq, coupling, etaMax, BATT, STYLES };
  (window.LabModels = window.LabModels || {})['electric-toothbrush'] = M;

  const deg = (r) => (r * 180) / PI;

  /* ================= 1. resonance: why it hums at one note ================= */
  D['brush-resonance'] = {
    render(ctx, v) {
      const f = v.f, F = v.load, a = amp(f, F), a0 = amp(f, 0), lag = phaseLag(f, F);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How far the brush head swings each way against the frequency of the drive. The head and its shaft hang on a springy bar and have a note of their own, \(${F0}\) Hz; driven at that note, small pushes add up to a swing twelve times larger than the same pushes would give slowly. Pressing on the teeth (blue) damps the swing and moves the peak. Drag the gold point.`, tx`駆動の周波数に対する、ブラシヘッドの片側への振れ幅です。ヘッドとその軸はばね性のある棒に支えられ、固有の音の高さ、\(${F0}\) Hz をもっています。その高さで駆動すると、小さな押しが積み重なって、同じ押しをゆっくり加えたときの 12 倍の振れになります。歯に押し付けると（青）、振れは減衰し、山の位置が動きます。金色の点をドラッグしてください。`));
      const g = L.fig(c1, { x: [120, 420], y: [0, 7], aspect: 0.68, maxH: 350, xlabel: T('drive frequency (Hz)', '駆動周波数（Hz）'), ylabel: T('swing each way (degrees)', '片側の振れ幅（度）') });
      g.line(L.sample(120, 420, 300, (x) => deg(amp(x, 0))), { c: 'muted', w: 1.8, dash: '5 4' }); const cur = L.sample(120, 420, 300, (x) => deg(amp(x, F))); g.area(cur, { c: 'c1', fo: 0.14, base: 0 }); g.line(cur, { c: 'c1', w: 2.8 });
      g.handle(f, deg(a), { c: 'hl', axis: 'x', bounds: [120, 420, 0, 7], label: T('drive frequency', '駆動周波数'), onDrag: (x) => ctx.set('f', clamp(Math.round(x), 120, 420)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Two cycles of the drive (grey) and of the head’s swing (blue), \(${fmt(2000 / f, 1)}\) ms in all. Below its own note the head follows the push; at its note it lags a quarter of a cycle, so the push is always with the motion and all of it goes into making up what friction takes; above, it lags half a cycle and the push fights the motion.`, tx`駆動（灰色）とヘッドの振れ（青）の 2 周期分、合わせて \(${fmt(2000 / f, 1)}\) ms です。固有の高さより低い周波数では、ヘッドは押しに従います。固有の高さでは 4 分の 1 周期遅れるので、押しは常に動きと同じ向きになり、そのすべてが摩擦で失われる分の補充に使われます。それより高い周波数では半周期遅れ、押しは動きに逆らいます。`));
      const h = L.fig(c2, { x: [0, 2], y: [-1.15, 1.15], aspect: 0.68, maxH: 350, xlabel: T('time (cycles of the drive)', '時間（駆動の周期）'), ylabel: T('fraction of the largest value', '最大値に対する割合') });
      h.line(L.sample(0, 2, 200, (t) => Math.sin(TAU * t)), { c: 'muted', w: 1.8 }); h.line(L.sample(0, 2, 200, (t) => (a / THRES) * Math.sin(TAU * t - lag)), { c: 'c1', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('pressed on the teeth', '歯に押し付けたとき') }, { c: 'muted', dash: true, label: T('free in air; drive torque', '空中で自由なとき、駆動のトルク') }]);
      ctx.readout([
        { k: T('swing each way, in air and pressed', '片側の振れ幅：空中、押し付けたとき'), v: tx`\(${fmt(deg(a0), 1)}^\circ,\ ${fmt(deg(a), 1)}^\circ\)`, tone: 'key' },
        { k: T('bristle tip sweep, top speed', '毛先の振れ幅、最大の速さ'), v: tx`\(${fmt(2 * tipAmp(f, F) * 1000, 2)}\ \mathrm{mm},\ ${fmt(tipSpeed(f, F), 2)}\ \mathrm{m/s}\)` },
        { k: T('strokes per minute', '毎分のストローク数'), v: tx`\(${fmt(Math.round((2 * f * 60) / 100) * 100, 0)}\)` },
        { k: T('swing lags the drive by', '振れが駆動から遅れる角度'), v: tx`\(${fmt(deg(lag), 0)}^\circ\)` },
        { k: T('power turned to heat and sound in the head', 'ヘッドで熱と音に変わる電力'), v: tx`\(${fmt(lossPower(f, F) * 1000, 0)}\ \mathrm{mW}\)` },
      ], T('The handle’s electronics watch the swing and can tell how hard you are pressing from how much it has shrunk, which is how a pressure warning works with no separate sensor. The hum you hear is the drive frequency itself.', 'ハンドルの電子回路は振れを監視していて、振れがどれだけ小さくなったかから、押し付ける強さを知ることができます。専用のセンサーなしで押し付けすぎを警告できるのは、この仕組みによります。聞こえるうなり音は、駆動周波数そのものです。'));
    },
  };

  /* ================= 2. charging through a sealed case ================= */
  D['induction-charging'] = {
    render(ctx, v) {
      const g0 = v.gap, Q = v.q, k = coupling(g0), eta = etaMax(k, Q), pb = v.pb, pin = pb / eta;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The best efficiency two coils can reach against the gap between them. The stand’s coil makes an alternating magnetic field; only the part of it that threads the coil in the handle does any work, and that share, the coupling, falls quickly as the coils move apart. Better coils (dashed, three times the quality factor) lose less in their own resistance and tolerate a wider gap. Drag the gold point.`, tx`二つのコイルの間のすき間に対する、到達できる最高の効率です。スタンドのコイルは交流の磁場を作ります。そのうち仕事をするのは、ハンドルの中のコイルを貫く部分だけです。その割合、すなわち結合は、コイルが離れると急に下がります。より良いコイル（破線、品質係数が 3 倍）は、自分の抵抗で失う分が少なく、広いすき間にも耐えます。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 15], y: [0, 1], aspect: 0.68, maxH: 340, xlabel: T('gap between the coils (mm)', 'コイルの間のすき間（mm）'), ylabel: T('best efficiency', '最高の効率') });
      a.line(L.sample(0, 15, 120, (x) => etaMax(coupling(x), 3 * Q)), { c: 'muted', w: 1.8, dash: '5 4' }); a.line(L.sample(0, 15, 120, (x) => coupling(x)), { c: 'c3', w: 1.8 });
      const cur = L.sample(0, 15, 120, (x) => etaMax(coupling(x), Q)); a.area(cur, { c: 'c1', fo: 0.14, base: 0 }); a.line(cur, { c: 'c1', w: 2.8 });
      a.handle(g0, eta, { c: 'hl', axis: 'x', bounds: [1, 15, 0, 1], label: T('gap', 'すき間'), onDrag: (x) => ctx.set('gap', clamp(Math.round(x * 2) / 2, 1, 15)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Where the power from the wall goes while \(${fmt(pb, 1)}\) W reaches the battery: into the battery, and into heat in the two coils. The single number that decides the split is \(k^2Q_1Q_2\), the coupling squared times the two quality factors.`, tx`電池に \(${fmt(pb, 1)}\) W が届いているとき、壁のコンセントからの電力がどこへ行くかを示します。電池に入る分と、二つのコイルで熱になる分です。この配分を決めるただ一つの数が \(k^2Q_1Q_2\)、すなわち結合の 2 乗に二つの品質係数を掛けたものです。`));
      const b = L.fig(c2, { x: [0.5, 3.5], y: [0, Math.max(3, pin * 1.15)], aspect: 0.68, maxH: 340, ylabel: T('watts', 'ワット'), ticksX: [[1, T('from the wall', 'コンセントから')], [2, T('to the battery', '電池へ')], [3, T('heat in the coils', 'コイルの熱')]], grid: true });
      b.rect(0.7, 0, 0.6, pin, { c: 'muted', fill: 'muted', fo: 0.5 }); b.rect(1.7, 0, 0.6, pb, { c: 'c3', fill: 'c3', fo: 0.6 }); b.rect(2.7, 0, 0.6, pin - pb, { c: 'c2', fill: 'c2', fo: 0.6 });
      [[1, pin], [2, pb], [3, pin - pb]].forEach(([x, y]) => b.text(x, y, fmt(y, 2), { small: true, dy: -8 }));
      L.legend(ctx.host, [{ c: 'c1', label: T('best efficiency, these coils', '最高の効率、このコイル') }, { c: 'muted', dash: true, label: T('coils three times better', '3 倍良いコイル') }, { c: 'c3', label: T('coupling; power to the battery', '結合、電池への電力') }, { c: 'c2', kind: 'fill', label: T('heat', '熱') }]);
      ctx.readout([
        { k: T('coupling', '結合'), v: tx`\(k=${fmt(k, 2)}\)` },
        { k: T(tx`figure of merit \(k^2Q_1Q_2\)`, tx`性能指数 \(k^2Q_1Q_2\)`), v: tx`\(${fmt(k * k * Q * Q, 1)}\)` },
        { k: T('best efficiency', '最高の効率'), v: tx`\(${fmt(100 * eta, 0)}\,\%\)`, tone: eta > 0.6 ? 'good' : eta > 0.3 ? 'key' : 'warn' },
        { k: T('drawn from the wall, lost as heat', 'コンセントから引き込む電力、熱として失う電力'), v: tx`\(${fmt(pin, 2)},\ ${fmt(pin - pb, 2)}\ \mathrm{W}\)` },
        { k: T('time to fill a 2.6 Wh cell', '2.6 Wh のセルを満たす時間'), v: tx`\(${fmt(BATT / pb, 1)}\ \mathrm{h}\)` },
      ], T('A toothbrush charges this way because it lets the handle be sealed with no metal contacts to corrode in a wet bathroom. It is the same principle as a phone on a charging pad, where the coils are flat and held a few millimetres apart, and efficiency matters more.', '歯ブラシがこの方法で充電されるのは、ハンドルを密閉でき、湿った洗面所で腐食する金属の接点が要らないからです。充電パッドに置くスマートフォンと同じ原理です。スマートフォンではコイルが平らで、数ミリメートルの間隔に保たれ、効率がより重要になります。'));
    },
  };

  /* ================= 3. inside the handle (3D) ================= */
  function buildBrush(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.1, T0 = PI / 2, CUT = PI * 1.5;         // 1 unit = 10 mm; upright along z
    const lathe = (pts, mat, t0 = T0, len = CUT, parent = g) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0] * K, q[1] * K)), 64, t0, len).rotateX(PI / 2), mat); m.castShadow = true; parent.add(m); return m; };
    const box = (w, d, h, x, y, z, mat, parent = g) => { const m = new TH.Mesh(new TH.BoxGeometry(w * K, d * K, h * K), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; parent.add(m); return m; };
    const white = S.mat('#f3f4f6', { rough: 0.3, coat: 0.9 }), grip = S.mat('#3f7fb5', { rough: 0.6, coat: 0.2 }), steel = S.mat('#d4d8dd', { metal: 1, rough: 0.22 }), copper = S.mat('#b87333', { metal: 0.9, rough: 0.35 }), dark = S.mat('#1d1e21', { rough: 0.55 });
    const pcb = S.mat('#1f6a40', { rough: 0.5, coat: 0.6 }), cell = S.mat('#3e8e5a', { rough: 0.35, coat: 0.7 }), iron = S.mat('#4a4d54', { metal: 0.8, rough: 0.5 });
    const torus = (r, t, z, mat, parent = g) => { const m = new TH.Mesh(new TH.TorusGeometry(r * K, t * K, 12, 40), mat); m.position.z = z * K; m.castShadow = true; parent.add(m); return m; };
    // charging stand: base with its coil round an iron core, and the peg the handle sits on
    lathe([[0.01, 0], [24, 0], [24, 9], [21, 12], [5.2, 12], [5.2, 26], [4.4, 27], [0.01, 27], [0.01, 25.5], [3.6, 25.5], [3.6, 10.5], [20, 10.5], [22.5, 8.4], [22.5, 1.5], [0.01, 1.5]], white);
    lathe([[0.01, 2], [2.6, 2], [2.6, 25], [0.01, 25]], iron, 0, TAU); for (let k = 0; k < 6; k++) torus(4.2 + 0 * k, 0.55, 3.4 + k * 1.15, copper);
    // handle shell: hollow, with a recess underneath for the peg and a rubber grip band
    lathe([[6.4, 14.5], [13.5, 14.5], [14.2, 18], [14.2, 150], [11, 172], [7.5, 180], [3.4, 182], [3.4, 180.5], [6.5, 178.6], [9.6, 171], [12.6, 149.6], [12.6, 30], [6.4, 30], [6.4, 29], [5.8, 28.2], [5.8, 14.5]], white);
    lathe([[14.2, 61], [14.9, 64], [14.9, 112], [14.2, 115], [14.45, 112], [14.45, 64]], grip);
    for (let k = 0; k < 5; k++) torus(7.6, 0.5, 16.5 + k * 1.2, copper);                    // receiving coil round the recess
    // lithium-ion cell, circuit board with controller and button
    const batt = new TH.Mesh(new TH.CylinderGeometry(7 * K, 7 * K, 50 * K, 32).rotateX(PI / 2), cell); batt.position.set(1.5 * K, 0, 58 * K); batt.castShadow = true; g.add(batt);
    const cap1 = new TH.Mesh(new TH.CylinderGeometry(7.05 * K, 7.05 * K, 2 * K, 32).rotateX(PI / 2), steel); cap1.position.set(1.5 * K, 0, 84 * K); g.add(cap1);
    box(1.2, 14, 84, -8.6, 0, 76, pcb); box(1, 5, 5, -9.6, 0, 96, dark); box(1.4, 3, 3, -9.9, 0, 110, S.mat('#e9e9e9', { rough: 0.4 })); box(1, 4, 6, -9.6, -3, 60, dark);
    // drive: laminated iron frame with two coils, and a rotor carrying four magnets on the shaft
    box(18, 3, 30, 1.5, 9.4, 112, iron); box(4, 18, 30, 10.4, 0, 112, iron);
    for (const dy of [-5.2, 5.2]) { const cm = new TH.Mesh(new TH.CylinderGeometry(3.4 * K, 3.4 * K, 22 * K, 24).rotateX(PI / 2), copper); cm.position.set(6.6 * K, dy * K, 112 * K); cm.castShadow = true; g.add(cm); }
    // moving parts: torsion bar, rotor, shaft, neck, head and bristles
    const mov = new TH.Group(); g.add(mov);
    const bar = new TH.Mesh(new TH.CylinderGeometry(0.9 * K, 0.9 * K, 22 * K, 12).rotateX(PI / 2), steel); bar.position.z = 90 * K; g.add(bar);
    box(7, 7, 26, 0, 0, 112, iron, mov); for (const [dx, col] of [[-3.9, '#b0463a'], [3.9, '#3f6fb0']]) for (const dz of [-6.5, 6.5]) box(1, 6, 12, dx, 0, 112 + dz, S.mat(dz * dx > 0 ? col : (col === '#b0463a' ? '#3f6fb0' : '#b0463a'), { rough: 0.5 }), mov);
    const shaft = new TH.Mesh(new TH.CylinderGeometry(1.7 * K, 1.7 * K, 78 * K, 20).rotateX(PI / 2), steel); shaft.position.z = 164 * K; mov.add(shaft);
    lathe([[2.2, 182.5], [5.6, 182.5], [5.2, 190], [3.4, 235], [3.2, 262], [1.8, 266], [0.01, 266.5]], white, 0, TAU, mov);
    box(6.4, 5, 24, 0, -2.2, 251, white, mov);
    const tuft = S.mat('#dfeaf5', { rough: 0.7, coat: 0 }), tuft2 = S.mat('#3f7fb5', { rough: 0.7, coat: 0 });
    for (let r = 0; r < 8; r++) for (let c = -1; c <= 1; c++) { const m = new TH.Mesh(new TH.CylinderGeometry(0.85 * K, 0.95 * K, (r % 3 === 0 ? 10.5 : 9.5) * K, 10), (r + c) % 2 ? tuft : tuft2); m.position.set(c * 2.05 * K, -(4.7 + 4.75) * K, (241.5 + r * 2.7) * K); mov.add(m); }
    S.add(g);
    return { g, mov, bar, K };
  }
  D['toothbrush-cutaway'] = {
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
      const f = v.f, F = v.load, a = amp(f, F), sp = tipSpeed(f, F), sweep = 2 * tipAmp(f, F) * 1000, hard = F > 2.5; st.a = a;
      const mine = [2 * f * 60, sweep], styles = [STYLES[0], STYLES[1], mine], speed = (s) => (s[0] / 60) * s[1] / 1000, names = [T('by hand', '手で磨く'), T('rotating head', '回転式'), T('this brush', 'このブラシ')];
      L.setText(st.cap1, T(tx`A sonic toothbrush on its charging stand, cut open. From the bottom: the stand’s coil and the handle’s coil that picks up its field, the lithium-ion cell, the circuit board, and the drive, where two coils rock a rotor carrying magnets. A thin steel bar below the rotor is the spring, and the shaft above it carries the head. The swing is shown slowed about two hundred times and enlarged four times.`, tx`充電スタンドに立てた音波式歯ブラシの断面です。下から順に、スタンドのコイルとその磁場を受けるハンドルのコイル、リチウムイオンのセル、基板、そして駆動部です。駆動部では、二つのコイルが磁石の付いた回転子を揺らします。回転子の下の細い鋼の棒がばねで、上の軸がヘッドを支えます。振れは約 200 分の 1 の速さにし、4 倍に拡大して示しています。`));
      L.setText(st.cap2, T(tx`Average speed of the bristle tips over the teeth for three ways of brushing: strokes per second times the length of a stroke. A hand makes long slow strokes, a rotating head medium ones, and a sonic brush very short ones very often. Detuning the drive or pressing hard shrinks the stroke of this brush.`, tx`三つの磨き方について、毛先が歯の上を動く平均の速さです。毎秒のストローク数にストロークの長さを掛けたものです。手は長くゆっくりしたストロークを、回転式のヘッドは中くらいのストロークを、音波式のブラシはごく短いストロークを非常に多く行います。駆動の周波数がずれたり強く押し付けたりすると、このブラシのストロークは小さくなります。`));
      st.g2.replaceChildren();
      const top = Math.max(1.6, ...styles.map(speed)) * 1.15, g = L.fig(st.g2, { x: [0.4, 3.6], y: [0, top], aspect: 0.8, maxH: 400, ylabel: T('tip speed (m/s)', '毛先の速さ（m/s）'), ticksX: names.map((nm, i) => [i + 1, nm]) });
      styles.forEach((s, i) => { g.rect(i + 1 - 0.32, 0, 0.64, speed(s), { c: i === 2 ? 'c1' : 'muted', fill: i === 2 ? 'c1' : 'muted', fo: 0.6 }); g.text(i + 1, speed(s), `${fmt(speed(s), 2)} m/s`, { small: true, dy: -24 }); g.text(i + 1, speed(s), `${fmt(Math.round(s[0] / 100) * 100, 0)}/min × ${fmt(s[1], 1)} mm`, { small: true, dy: -9 }); });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', kind: 'fill', label: T('this brush at these settings', 'この設定でのこのブラシ') }, { c: 'muted', kind: 'fill', label: T('for comparison', '比較用') }]);
      ctx.readout([
        { k: T('swing each way, tip sweep', '片側の振れ幅、毛先の振れ幅'), v: tx`\(${fmt(deg(a), 1)}^\circ,\ ${fmt(sweep, 2)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('strokes in a two-minute session', '2 分間のストローク数'), v: tx`\(${fmt(Math.round((4 * f * 60) / 1000) * 1000, 0)}\)` },
        { k: T('fastest the tips move', '毛先の最大の速さ'), v: tx`\(${fmt(sp, 2)}\ \mathrm{m/s}\)` },
        { k: T('pressure', '押し付ける力'), v: hard ? T('too hard: the handle warns', '強すぎ：ハンドルが警告') : T('fine', '適正'), tone: hard ? 'bad' : 'good' },
        { k: T('sessions per charge at 1.5 W', '1.5 W として 1 回の充電で使える回数'), v: tx`\(${fmt(BATT / (1.5 * (2 / 60)), 0)}\)` },
      ], T('What cleans is bristle tips moving across the tooth, whichever way that is achieved. The brush is designed to work with almost no pressure, and pressing harder reduces its motion; a hand, by contrast, tends to scrub harder and wear the gums.', '汚れを落とすのは、どの方法で実現するにせよ、歯の表面を動く毛先です。このブラシは、ほとんど押し付けずに働くように設計されていて、強く押すと動きが小さくなります。これに対して手で磨くと、強くこすりがちで、歯ぐきを傷めることがあります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.35 : 1.15, maxH: 720, camera: [19, -52, 30], target: [0, 0, 13.2], fov: 30,
        label: T('3D cutaway of an electric toothbrush on its charger. Drag to rotate.', '充電器に立てた電動歯ブラシの 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.br = buildBrush(S); st.t = 0;
          S.label(T('bristles', '毛'), [2.6, -1, 25.3], { small: true }); S.label(T('shaft', '軸'), [2.4, -1.5, 19.5], { small: true }); S.label(T('drive coils and magnets', '駆動コイルと磁石'), [4.6, -2, 11.4], { small: true });
          S.label(T('torsion bar', 'ねじりばね'), [-3.6, 0, 9], { small: true }); S.label(T('lithium-ion cell', 'リチウムイオンセル'), [4.4, -2, 5.8], { small: true }); S.label(T('circuit board', '基板'), [-3.6, 0, 6.6], { small: true }); S.label(T('charging coils', '充電コイル'), [4.2, -2, 1.7], { small: true });
          const draw = () => { st.br.mov.rotation.z = 4 * st.a * Math.sin(st.t * 8); };
          st.draw = draw; draw();
          S.animate((dt) => { if (S.reduced()) return false; st.t += Math.min(0.05, dt || 0.016); draw(); return true; });
        },
        update(S) { st.draw(); S.invalidate(); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-60, 60], y: [-5, 275], equal: true, maxH: 460, axes: false, grid: false });
          f2.rect(-24, 0, 48, 12, { c: 'ink', fill: 'grid', fo: 0.5 }); f2.rect(-14.2, 14.5, 28.4, 136, { c: 'ink', fill: 'grid', fo: 0.4, rx: 6 }); f2.rect(-5.5, 30, 14, 52, { c: 'c3', fill: 'c3', fo: 0.5 }); f2.rect(-3.4, 182, 6.8, 84, { c: 'ink', fill: 'grid', fo: 0.4 }); f2.rect(3.4, 240, 10, 24, { c: 'c1', fill: 'c1', fo: 0.5 });
        },
      });
    },
  };
})();
