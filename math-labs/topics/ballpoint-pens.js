'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Line: width 0.45 d and film thickness 0.4 um per mm of ball diameter (fits to a medium ballpoint that writes
   * about 2 km on 0.4 g of ink). Rolling without slipping: 1 / (pi d) turns per metre.
   * Feed: ink of viscosity mu in a tube of radius r, column length LC, tilted theta from point-down, with gas
   * pressure dp behind it: Poiseuille flow Q = pi r^4 (rho g cos(theta) + dp / LC) / (8 mu).
   * Rheology: power-law ink, viscosity = K (shear rate)^(n - 1). Shear rate in the gap = speed / gap.
   */
  const RHO = 1050, LC = 0.09;
  const lineWidth = (d) => 0.45 * d;                                                                 // mm
  const film = (d) => 0.4 * d;                                                                       // micrometres
  const inkPerMetre = (d) => lineWidth(d) * 1e-3 * film(d) * 1e-6 * RHO * 1e9;                       // micrograms per metre
  const writeLength = (grams, d) => (grams * 1e-3) / RHO / (lineWidth(d) * 1e-3 * film(d) * 1e-6);    // m
  const turnsPerMetre = (d) => 1000 / (PI * d);
  const ballRpm = (v, d) => v * turnsPerMetre(d) * 60;                                               // v in m/s
  const demand = (v, d) => v * lineWidth(d) * 1e-3 * film(d) * 1e-6 * 1e9;                           // microlitres per second
  const supply = (rmm, mu, tiltDeg = 0, dpBar = 0) => ((PI * (rmm / 1000) ** 4 * (RHO * G * Math.cos((tiltDeg * PI) / 180) + (dpBar * 1e5) / LC)) / (8 * mu)) * 1e9;   // microlitres per second, negative = away from the ball
  const creep = (rmm, mu, tiltDeg = 0, dpBar = 0) => (supply(rmm, mu, tiltDeg, dpBar) * 1e-9) / (PI * (rmm / 1000) ** 2) * 1000;   // mm/s
  const visc = (rate, K, n) => K * Math.max(rate, 1e-9) ** (n - 1);                                   // Pa s
  const stress = (rate, K, n) => K * Math.max(rate, 0) ** n;                                          // Pa
  const drag = (v, gapUm, K, n, d = 1) => stress(v / (gapUm * 1e-6), K, n) * 2 * PI * (d / 2000) ** 2;   // N
  const M = { RHO, LC, lineWidth, film, inkPerMetre, writeLength, turnsPerMetre, ballRpm, demand, supply, creep, visc, stress, drag };
  (window.LabModels = window.LabModels || {})['ballpoint-pens'] = M;

  /* ================= 1. the tip (3D) ================= */
  function buildTip(S) {
    const TH = S.THREE, g = new TH.Group(), pen = new TH.Group(), T0 = PI / 2, CUT = PI * 1.5;       // ball radius = 1 unit
    pen.position.set(0, 0, 1); pen.rotation.y = 0.42; g.add(pen);
    const brass = S.mat('#c9a04a', { metal: 1, rough: 0.3 }), carbide = S.mat('#7d828a', { metal: 1, rough: 0.18 }), ink = S.mat('#1c2f8f', { rough: 0.25, coat: 1 }), inkFilm = S.mat('#2a43c0', { rough: 0.15, coat: 1, opacity: 0.35 }), paper = S.mat('#f4f1e8', { rough: 0.95, coat: 0 }), barrel = S.mat('#dfe6ee', { rough: 0.1, coat: 1, opacity: 0.3 });
    const lathe = (pts, mat, t0 = T0, len = CUT) => { const m = new TH.Mesh(new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[0], q[1])), 64, t0, len).rotateX(PI / 2), mat); m.castShadow = true; pen.add(m); return m; };
    const prof = [[0.93, -0.45], [1.12, -0.4], [1.25, 0], [2.4, 5], [2.4, 9], [1.7, 9], [1.7, 4.2], [0.32, 3.2], [0.32, 0.95]];
    for (let k = 0; k <= 14; k++) { const th = ((46 + (70 * k) / 14) * PI) / 180; prof.push([1.04 * Math.sin(th), 1.04 * Math.cos(th)]); }
    lathe(prof, brass); lathe([[0.001, 1.02], [0.31, 0.97], [0.31, 3.2], [1.68, 4.2], [1.68, 8.4], [0.001, 8.4]], ink).castShadow = false;
    lathe([[1.9, 7], [2.9, 7], [2.9, 12], [2.75, 12], [2.75, 7.15], [1.9, 7.15]], barrel).castShadow = false;
    const ball = new TH.Group(); pen.add(ball);
    { const m = new TH.Mesh(new TH.SphereGeometry(1, 48, 32), carbide); m.castShadow = true; ball.add(m); for (let k = 0; k < 26; k++) { const u = (k * 0.618034) % 1, w = (k + 0.5) / 26, th = Math.acos(1 - 2 * w), ph = TAU * u, d = new TH.Mesh(new TH.SphereGeometry(0.07, 8, 6), S.mat('#30343a', { metal: 0.8, rough: 0.5 })); d.position.set(1.0 * Math.sin(th) * Math.cos(ph), 1.0 * Math.sin(th) * Math.sin(ph), 1.0 * Math.cos(th)); ball.add(d); } }
    { const f = new TH.Mesh(new TH.SphereGeometry(1.025, 40, 28), inkFilm); pen.add(f); }
    const sheet = new TH.Mesh(new TH.BoxGeometry(22, 12, 0.3), paper); sheet.position.set(-3, 0, -0.15); sheet.receiveShadow = true; g.add(sheet);
    const line = new TH.Mesh(new TH.BoxGeometry(12, 0.9, 0.012), ink); line.position.set(-6, 0, 0.008); g.add(line);
    const rules = S.lines([], { c: 'muted', opacity: 0.6, w: 1.2 });
    S.add(g);
    return { ball, pen, line, rules };
  }
  D['pen-tip'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const d = v.d, w = lineWidth(d), len = writeLength(0.4, d); st.v = v;
      L.setText(st.cap1, T(tx`The tip of a ballpoint pen cut open, about fifty times life size. A ball of tungsten carbide \(${fmt(d, 1)}\) mm across sits in a brass socket whose rim is crimped just past its widest point, so it can turn but cannot fall out. Ink fills the tube behind it. As the pen moves the paper turns the ball, the wetted side of the ball rolls round to the outside, and a film of ink is pressed onto the paper.`, tx`ボールペンの先端の断面で、実物の約 50 倍です。直径 \(${fmt(d, 1)}\) mm のタングステンカーバイドのボールが真鍮の受け座に収まり、縁がボールの最も太い部分のすぐ先でかしめられているので、ボールは回れますが、抜け落ちません。その後ろの管には、インクが詰まっています。ペンが動くと、紙がボールを回し、インクでぬれた面が外側に回ってきて、インクの膜が紙に押し付けられます。`));
      L.setText(st.cap2, T(tx`Distance a pen can write on 0.4 g of ink against the diameter of its ball. A bigger ball lays a wider line and a thicker film, so the distance falls with the square of the diameter. Drag the gold point.`, tx`0.4 g のインクで書ける距離を、ボールの直径に対して描いています。ボールが大きいほど線は太く、膜は厚くなるので、距離は直径の 2 乗に反比例して短くなります。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0.3, 1.6], y: [0, 12], aspect: 0.8, maxH: 400, xlabel: T('diameter of the ball (mm)', 'ボールの直径（mm）'), ylabel: T('writing distance (km)', '書ける距離（km）') });
      g.line(L.sample(0.3, 1.6, 100, (q) => Math.min(12, writeLength(0.4, q) / 1000)), { c: 'c1', w: 2.8 });
      g.handle(d, Math.min(12, len / 1000), { c: 'hl', axis: 'x', bounds: [0.3, 1.6, 0, 12], label: T('ball diameter', 'ボールの直径'), onDrag: (x) => ctx.set('d', clamp(Math.round(x * 10) / 10, 0.3, 1.6)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('distance on 0.4 g of ink', '0.4 g のインクで書ける距離') }]);
      ctx.readout([
        { k: T('width of the line', '線の幅'), v: tx`\(${fmt(w, 2)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('thickness of the ink film', 'インクの膜の厚さ'), v: tx`\(${fmt(film(d), 2)}\ \mu\mathrm{m}\)` },
        { k: T('ink used per metre', '1 m あたりのインク'), v: tx`\(${fmt(inkPerMetre(d), 0)}\ \mu\mathrm{g}\)` },
        { k: T('writes, on 0.4 g', '0.4 g で書ける距離'), v: tx`\(${fmt(len / 1000, 1)}\ \mathrm{km}\)`, tone: 'good' },
        { k: T('ball turns, per metre', '1 m あたりのボールの回転'), v: tx`\(${fmt(turnsPerMetre(d), 0)}\)` },
        { k: T('ball speed at ' + fmt(v.v, 0) + ' cm/s', '毎秒 ' + fmt(v.v, 0) + ' cm でのボールの回転数'), v: tx`\(${fmt(ballRpm(v.v / 100, d), 0)}\ \mathrm{rpm}\)` },
      ], T('Over the life of the pen the ball turns hundreds of thousands of times in its socket, sealed and lubricated by nothing but the ink.', 'ペンを使い切るまでに、ボールは受け座の中で数十万回回ります。密封も潤滑も、インクだけで行われます。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.9, maxH: 580, camera: [12, -25, 11], target: [1.6, 0, 4.2], fov: 30,
        label: T('3D cutaway of a ballpoint pen tip writing on paper. Drag to rotate.', '紙に書いているボールペンの先端の 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.tp = buildTip(S); st.t = 0;
          S.label(T('ball', 'ボール'), [1.6, -1.5, 0.6], { small: true }); S.label(T('socket', '受け座'), [3.6, -1.2, 3.2], { small: true }); S.label(T('ink', 'インク'), [7, -1.5, 9.5], { small: true }); S.label(T('paper', '紙'), [-8, -4.5, 0.3], { small: true });
          const draw = (dt) => { const m = st.tp, sp = 0.6 + st.v.v / 12; st.t += dt * sp; m.ball.rotation.y = st.t * 1.0; const sg = []; for (let k = 0; k < 12; k++) { const x = 8 - (((st.t + k * 1.8) % 21.6)); sg.push([[x, -6, 0.006], [x, 6, 0.006]]); } m.rules.update(sg); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-4, 4], y: [-0.5, 9], equal: true, maxH: 340, axes: false, grid: false }); f2.circle(0, 1, 1, { c: 'ink', fill: 'grid', fo: 0.7, w: 1.6 }); f2.poly([[1.1, 0.6], [2.4, 6], [2.4, 9], [1.7, 9], [1.7, 5.2], [0.32, 4.2], [0.32, 2]], { c: 'ink', fill: 'c3', fo: 0.3, w: 1.4 }); f2.poly([[-1.1, 0.6], [-2.4, 6], [-2.4, 9], [-1.7, 9], [-1.7, 5.2], [-0.32, 4.2], [-0.32, 2]], { c: 'ink', fill: 'c3', fo: 0.3, w: 1.4 }); f2.rect(-0.32, 2, 0.64, 2.2, { c: 'c1', fill: 'c1', fo: 0.6, w: 0 }); f2.seg(-4, 0, 4, 0, { c: 'ink', w: 2 }); },
      });
    },
  };

  /* ================= 2. feeding the ball ================= */
  D['ink-feed'] = {
    render(ctx, v) {
      const mu = 10 ** v.lmu, sup = supply(v.r, mu, v.tilt, v.dp), dem = demand(v.v / 100, 1), cr = creep(v.r, mu, v.tilt, v.dp);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How fast the ink column can creep toward the ball (blue) against the thickness of the ink, on logarithmic scales, with the pen tilted \(${fmt(v.tilt, 0)}\)° from point-down. The dashed line is what writing at \(${fmt(v.v, 0)}\) cm/s takes away. Ink as thin as water would pour out; ballpoint paste, ten thousand times thicker, arrives only a little faster than it is used. Drag the gold point.`, tx`インクの柱がボールに向かって進める速さ（青）を、インクの粘度に対して、両対数で描いています。ペンは、先端を真下にした向きから \(${fmt(v.tilt, 0)}\)° 傾いています。破線は、毎秒 \(${fmt(v.v, 0)}\) cm で書くときに使われる量です。水のように薄いインクは流れ出てしまいます。水の 1 万倍濃いボールペンのインクは、使われる量より少し速い程度でしか届きません。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [-3, 2], y: [-4, 5], aspect: 0.7, maxH: 350, xlabel: T('viscosity (Pa s, power of ten)', '粘度（Pa s、10 の何乗か）'), ylabel: T('flow (μL/s, power of ten)', '流量（μL/s、10 の何乗か）') });
      a.hline(Math.log10(dem), { c: 'c2', dash: '5 4' }); const s1 = supply(v.r, 1, v.tilt, v.dp);
      if (s1 > 0) a.line(L.sample(-3, 2, 30, (q) => clamp(Math.log10(supply(v.r, 10 ** q, v.tilt, v.dp)), -4, 5)), { c: 'c1', w: 2.8 });
      a.text(-2.9, -3.5, T('water', '水'), { small: true, anchor: 'start' }); a.text(1, -3.5, T('ballpoint paste', 'ボールペンのインク'), { small: true, anchor: 'middle' });
      a.handle(v.lmu, s1 > 0 ? clamp(Math.log10(sup), -4, 5) : -4, { c: 'hl', axis: 'x', bounds: [-3, 2, -4, 5], label: T('viscosity', '粘度'), onDrag: (x) => ctx.set('lmu', clamp(Math.round(x * 10) / 10, -3, 2)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How fast the ink column moves along the tube against the tilt of the pen. Point-down it is drawn toward the ball. Past horizontal it slides the other way, and after a few seconds the ball runs dry. Gas pressure behind the ink (grey, 2.4 bar) overwhelms gravity, which is how a pen is made to write upside down.`, tx`インクの柱が管に沿って動く速さを、ペンの傾きに対して描いています。先端が下を向いているときは、ボールのほうへ引かれます。水平を超えると逆向きに滑り、数秒でボールが乾きます。インクの後ろに気体の圧力（灰色、2.4 bar）をかけると、重力をはるかに上回ります。逆さまでも書けるペンは、こうして作られます。`));
      const b = L.fig(c2, { x: [0, 180], y: [-0.2, 0.3], aspect: 0.7, maxH: 350, xlabel: T('tilt from point-down (degrees)', '先端を真下にした向きからの傾き（度）'), ylabel: T('ink moves toward the ball (mm/s)', 'インクがボールへ進む速さ（mm/s）') });
      b.hline(0, { c: 'muted', dash: '4 4' }); b.line(L.sample(0, 180, 90, (q) => clamp(creep(v.r, mu, q, 2.4), -0.2, 0.3)), { c: 'muted', w: 1.4 }); b.line(L.sample(0, 180, 90, (q) => clamp(creep(v.r, mu, q, v.dp), -0.2, 0.3)), { c: 'c1', w: 2.8 }); b.dot(v.tilt, clamp(cr, -0.2, 0.3), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('what the tube can deliver', '管が送れる量') }, { c: 'c2', dash: true, label: T('what writing uses', '書くときに使う量') }, { c: 'muted', label: T('with 2.4 bar of gas behind the ink', 'インクの後ろに 2.4 bar の気体がある場合') }]);
      ctx.readout([
        { k: T('viscosity, against water', '粘度、水との比'), v: tx`\(${fmt(mu, mu < 1 ? 3 : 1)}\ \mathrm{Pa\,s},\ \times${fmt(mu / 0.001, 0)}\)` },
        { k: T('the tube can deliver', '管が送れる量'), v: tx`\(${fmt(sup, Math.abs(sup) < 1 ? 3 : 1)}\ \mu\mathrm{L/s}\)`, tone: 'key' },
        { k: T('writing uses', '書くときに使う量'), v: tx`\(${fmt(dem, 3)}\ \mu\mathrm{L/s}\)` },
        { k: T('ratio', '比'), v: tx`\(\times${fmt(sup / dem, 1)}\)`, tone: sup < dem ? 'warn' : sup > 100 * dem ? 'warn' : 'good' },
        { k: T('left alone, the column moves at', '放置したときの柱の速さ'), v: tx`\(${fmt(cr, 3)}\ \mathrm{mm/s}\)` },
      ], T(sup < 0 ? 'The ink is sliding away from the ball. The pen writes for a moment on what is in the socket and then skips.' : sup < dem ? 'The tube cannot keep up, and the line thins and skips.' : sup > 100 * dem ? 'Far more could arrive than is used. Only the close fit of the ball stands between this ink and a blot.' : 'Supply is ahead of demand without being far ahead: the ball meters the ink and the paste does not leak.', sup < 0 ? 'インクは、ボールから離れる向きに滑っています。受け座に残ったインクでしばらく書けますが、その後かすれます。' : sup < dem ? '管の供給が追いつかず、線が細くなり、かすれます。' : sup > 100 * dem ? '使う量よりはるかに多くが届きます。このインクがにじまないのは、ボールがぴったり収まっているからにすぎません。' : '供給は需要を上回りますが、大きくは上回りません。ボールがインクの量を調節し、インクは漏れません。'));
    },
  };

  /* ================= 3. ink that thins when sheared ================= */
  D['ink-rheology'] = {
    render(ctx, v) {
      const rate = v.v / 100 / (v.gap * 1e-6), mu = visc(rate, v.K, v.n), F = drag(v.v / 100, v.gap, v.K, v.n), rest = visc(0.1, v.K, v.n);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Viscosity of the ink against how fast it is being sheared, on logarithmic scales. Ink sitting in the tube is barely sheared at all (left). Ink in the gap of \(${fmt(v.gap, 1)}\) μm between a rolling ball and its socket is sheared a hundred thousand times a second (right). An ink whose long molecules line up with the flow can be stiff in the tube and runny in the gap. Drag the gold point to change how strongly it thins.`, tx`インクの粘度を、ずり速度に対して両対数で描いています。管の中にあるインクは、ほとんどずり変形を受けません（左）。回るボールと受け座の間の \(${fmt(v.gap, 1)}\) μm のすき間にあるインクは、毎秒 10 万回の速さでずり変形を受けます（右）。長い分子が流れに沿って並ぶインクは、管の中では固く、すき間ではさらさらになります。金色の点をドラッグして、薄まり方の強さを変えてください。`));
      const a = L.fig(c1, { x: [-2, 6], y: [-3, 3], aspect: 0.7, maxH: 350, xlabel: T('shear rate (per second, power of ten)', 'ずり速度（毎秒、10 の何乗か）'), ylabel: T('viscosity (Pa s, power of ten)', '粘度（Pa s、10 の何乗か）') });
      a.hline(-3, { c: 'muted', dash: '4 4' }); a.line([[-2, Math.log10(v.K)], [6, Math.log10(v.K)]].map((q) => [q[0], clamp(q[1], -3, 3)]), { c: 'muted', w: 1.3 }); a.line(L.sample(-2, 6, 40, (q) => clamp(Math.log10(visc(10 ** q, v.K, v.n)), -3, 3)), { c: 'c1', w: 2.8 });
      a.vline(Math.log10(rate), { c: 'c2', dash: '4 3' });
      a.handle(Math.log10(rate), clamp(Math.log10(mu), -3, 3), { c: 'hl', axis: 'y', bounds: [-2, 6, -3, 3], label: T('thinning', '薄まり方'), onDrag: (x, y) => ctx.set('n', clamp(Math.round((1 + (y - Math.log10(v.K)) / Math.log10(rate)) * 20) / 20, 0.2, 1)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Drag of the ink on the ball against writing speed, for this ink (blue) and for one of the same resting thickness that does not thin (grey). Without thinning the pen would take more force to push than the hand presses down with. With it, the drag barely changes with speed.`, tx`インクがボールに及ぼす抵抗を、書く速さに対して描いています。青はこのインク、灰色は、静止時の濃さが同じで薄まらないインクです。薄まらなければ、ペンを押し進めるのに、手が押し付ける力より大きな力が必要になります。薄まるインクでは、抵抗は速さによってほとんど変わりません。`));
      const b = L.fig(c2, { x: [0, 30], y: [0, 0.5], aspect: 0.7, maxH: 350, xlabel: T('writing speed (cm/s)', '書く速さ（cm/s）'), ylabel: T('drag on the ball (N)', 'ボールにかかる抵抗（N）') });
      b.line(L.sample(0, 30, 60, (q) => Math.min(0.5, drag(q / 100, v.gap, v.K, 1))), { c: 'muted', w: 1.4 }); b.line(L.sample(0, 30, 60, (q) => Math.min(0.5, drag(q / 100, v.gap, v.K, v.n))), { c: 'c1', w: 2.8 }); b.dot(v.v, Math.min(0.5, F), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('this ink', 'このインク') }, { c: 'muted', label: T('ink that does not thin; water', '薄まらないインク、水') }, { c: 'c2', dash: true, label: T('shear rate in the gap', 'すき間でのずり速度') }]);
      ctx.readout([
        { k: T('shear rate in the gap', 'すき間でのずり速度'), v: tx`\(${fmt(rate / 1000, 0)}\times10^{3}\ \mathrm{s^{-1}}\)` },
        { k: T('viscosity at rest in the tube', '管の中で静止しているときの粘度'), v: tx`\(${fmt(rest, 1)}\ \mathrm{Pa\,s}\)` },
        { k: T('viscosity in the gap', 'すき間での粘度'), v: tx`\(${fmt(mu, 3)}\ \mathrm{Pa\,s}\)`, tone: 'key' },
        { k: T('thinner by', '薄まる倍率'), v: tx`\(\times${fmt(rest / mu, 0)}\)` },
        { k: T('drag on the ball', 'ボールにかかる抵抗'), v: tx`\(${fmt(F * 1000, 0)}\ \mathrm{mN}\)`, tone: F > 0.3 ? 'warn' : 'good' },
      ], T('Gel pens push this further: their ink is nearly solid at rest, so it can be loaded with pigment without settling, and thin as water under the ball.', 'ゲルインクのペンは、これをさらに進めたものです。インクは静止時にはほとんど固体なので、顔料を多く含んでも沈まず、ボールの下では水のように薄くなります。'));
    },
  };
})();
