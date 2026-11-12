'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Lengths in millimetres unless stated. Thin lens: 1/s + 1/v = 1/f. A point at distance d, with the lens focused at s,
   * images as a disc of diameter b = (f^2 / (N (s - f))) |d - s| / d. With an acceptable circle of confusion c the
   * hyperfocal distance is H = f^2/(N c) + f and the limits of sharpness are D_near = s(H - f)/(H + s - 2f),
   * D_far = s(H - f)/(H - s) (infinite once s >= H).
   * Sharpness against aperture: spherical aberration of a best-form single element blurs by about 0.067 f / N^3
   * (third-order result for n = 1.5); diffraction gives an Airy disc of diameter 2.44 lambda N.
   * Phase detection: light from the two halves of the aperture forms two images displaced by delta * 0.424 / N for a
   * sensor delta away from focus (0.424 D is the separation of the centroids of two half discs of diameter D).
   */
  const COC = 0.03;                                                   // full-frame sensor
  const imageDistance = (f, s) => (s * f) / (s - f);
  const blur = (f, N, s, d) => ((f * f) / (N * (s - f))) * (Math.abs(d - s) / d);
  const hyperfocal = (f, N, c = COC) => (f * f) / (N * c) + f;
  function dofLimits(f, N, s, c = COC) { const H = hyperfocal(f, N, c); return { H, near: (s * (H - f)) / (H + s - 2 * f), far: s >= H ? Infinity : (s * (H - f)) / (H - s) }; }
  const extension = (f, s) => (f * f) / (s - f);                    // how far the lens moves out from its infinity position
  const sphericalBlur = (f, N) => (0.067 * f) / N ** 3;              // mm, single best-form element
  const airy = (N, lambda = 550e-6) => 2.44 * lambda * N;            // mm
  const CORRECTION = 1 / 40;                                          // representative gain of a six-element design over one element
  const totalBlur = (f, N, corrected = true) => Math.hypot(sphericalBlur(f, N) * (corrected ? CORRECTION : 1), airy(N));
  function sweetSpot(f, corrected = true) { let best = 1, bv = Infinity; for (let N = 1; N <= 32; N += 0.05) { const b = totalBlur(f, N, corrected); if (b < bv) { bv = b; best = N; } } return { N: best, blur: bv }; }
  const pdShift = (delta, N) => (delta * 0.424) / N;                  // mm on the sensor between the two half-aperture images
  // contrast of a sine pattern of spatial frequency nu (cycles/mm) imaged through a uniform blur disc of diameter b: |2 J1(pi nu b)/(pi nu b)|
  const J1 = (x) => { if (Math.abs(x) < 1e-6) return x / 2; let s = 0; const n = 200; for (let i = 0; i < n; i++) { const t = ((i + 0.5) / n) * PI; s += Math.cos(t - x * Math.sin(t)); } return s / n; };
  const contrast = (nu, b) => { const x = PI * nu * b; return x < 1e-9 ? 1 : Math.abs((2 * J1(x)) / x); };
  // representative six-element double-Gauss layout: [x of front vertex, R1, R2, thickness, semi-diameter], lengths in mm, light travelling towards +x
  const ELEMENTS = [[-22, 34, 95, 5.2, 15], [-15.4, 20, 62, 6.2, 12.6], [-9.2, 62, 12.6, 1.6, 11.6], [5.2, -12.6, -62, 1.6, 11.6], [6.8, -62, -20, 6.2, 12.6], [14.6, 130, -40, 4.8, 14.2]];
  const sag = (R, r) => (R === Infinity ? 0 : Math.sign(R) * (Math.abs(R) - Math.sqrt(Math.max(0, R * R - r * r))));
  const M = { COC, imageDistance, blur, hyperfocal, dofLimits, extension, sphericalBlur, airy, totalBlur, sweetSpot, pdShift, J1, contrast, ELEMENTS, sag, CORRECTION };
  (window.LabModels = window.LabModels || {})['camera-lenses'] = M;

  const FS = [24, 35, 50, 85, 135], NS = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  const dist = (mm) => (mm === Infinity ? '∞' : mm >= 1000 ? fmt(mm / 1000, 2) + ' m' : fmt(mm / 10, 1) + ' cm');

  /* ================= 1. depth of field ================= */
  D['lens-depth-of-field'] = {
    render(ctx, v) {
      const f = FS[v.f], N = NS[v.N], s = 10 ** v.ls * 1000, R = dofLimits(f, N, s), lx = (mm) => Math.log10(mm / 1000);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Size of the blur disc on the sensor for a point at each distance, with a \(${f}\) mm lens at \(f/${N}\) focused on the gold point. Everything whose blur stays under the dashed line, 0.03 mm on a full-frame sensor, looks sharp: that range (shaded) is the depth of field. Drag the gold point to refocus.`, tx`\(${f}\) mm のレンズを \(f/${N}\) にして金色の点にピントを合わせたとき、各距離にある点がセンサー上に作るぼけの円の大きさです。ぼけが破線（フルサイズセンサーで 0.03 mm）より小さいものはすべて鮮明に見えます。その範囲（色を付けた部分）が被写界深度です。金色の点をドラッグしてピントを合わせ直してください。`));
      const lb = (b) => clamp(Math.log10(Math.max(b, 1e-6)), -2.5, 1);
      const g = L.fig(c1, { x: [-0.6, 2], y: [-2.5, 1], aspect: 0.72, maxH: 360, xlabel: T('distance from the lens (m)', 'レンズからの距離（m）'), ylabel: T('blur disc (mm)', 'ぼけの円（mm）'), ticksX: [[-0.52, '0.3'], [0, '1'], [0.477, '3'], [1, '10'], [1.477, '30'], [2, '100']], ticksY: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10']] });
      const x0 = clamp(lx(R.near), -0.6, 2), x1 = R.far === Infinity ? 2 : clamp(lx(R.far), -0.6, 2);
      g.rect(x0, -2.5, x1 - x0, 3.5, { c: 'c3', fill: 'c3', fo: 0.16, nostroke: true, layer: 'under' });
      g.hline(Math.log10(COC), { c: 'ink', dash: '5 4' }); g.text(1.95, Math.log10(COC), T('0.03 mm: looks sharp below this', '0.03 mm：これより下は鮮明'), { small: true, anchor: 'end', dy: -5 });
      g.line(L.sample(-0.6, 2, 400, (x) => lb(blur(f, N, s, 10 ** x * 1000))), { c: 'c1', w: 2.6 });
      g.handle(v.ls, -2.5, { c: 'hl', axis: 'x', bounds: [-0.52, 2, -2.5, 1], label: T('focus distance', 'ピント位置'), onDrag: (x) => ctx.set('ls', clamp(Math.round(x * 50) / 50, -0.52, 2)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Near and far limits of sharpness against the aperture, for this lens and focus distance. Stopping down widens the zone, until the far limit runs off to infinity at the hyperfocal aperture.`, tx`このレンズとピント位置での、絞りに対する鮮明な範囲の近い側と遠い側の限界です。絞るほど範囲は広がり、過焦点となる絞りで遠い側の限界は無限遠に達します。`));
      const l2 = Math.log2, XA = l2(1.4), XB = l2(22), AP = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
      const h = L.fig(c2, { x: [XA, XB], y: [-0.6, 2], aspect: 0.72, maxH: 360, xlabel: T('aperture (f-number)', '絞り（F 値）'), ylabel: T('distance (m)', '距離（m）'), ticksX: AP.map((n) => [l2(n), String(n)]), ticksY: [[-0.52, '0.3'], [0, '1'], [1, '10'], [2, '100']] });
      const lim = L.sample(XA, XB, 80, (x) => x).map(([x]) => { const q = dofLimits(f, 2 ** x, s); return [x, clamp(lx(q.near), -0.6, 2), q.far === Infinity ? 2 : clamp(lx(q.far), -0.6, 2)]; });
      h.poly([...lim.map((q) => [q[0], q[1]]), ...lim.slice().reverse().map((q) => [q[0], q[2]])], { c: 'c3', fill: 'c3', fo: 0.18, w: 0.5 });
      h.line(lim.map((q) => [q[0], q[1]]), { c: 'c1', w: 2.3 }); h.line(lim.map((q) => [q[0], q[2]]), { c: 'c2', w: 2.3 }); h.hline(v.ls, { c: 'hl', dash: '4 3' });
      h.dot(l2(N), clamp(lx(R.near), -0.6, 2), { c: 'c1', r: 5 }); h.dot(l2(N), R.far === Infinity ? 2 : clamp(lx(R.far), -0.6, 2), { c: 'c2', r: 5 });
      L.legend(ctx.host, [{ c: 'c1', label: T('blur disc; near limit', 'ぼけの円、近い側の限界') }, { c: 'c2', label: T('far limit', '遠い側の限界') }, { c: 'c3', kind: 'fill', label: T('acceptably sharp', '鮮明に見える範囲') }, { c: 'hl', dash: true, label: T('focus distance', 'ピント位置') }]);
      ctx.readout([
        { k: T('sharp from, to', '鮮明な範囲'), v: `${dist(R.near)} … ${dist(R.far)}`, tone: 'key' },
        { k: T('depth of field', '被写界深度'), v: R.far === Infinity ? '∞' : dist(R.far - R.near) },
        { k: T(tx`hyperfocal distance \(f^2/(Nc)+f\)`, tx`過焦点距離 \(f^2/(Nc)+f\)`), v: dist(R.H) },
        { k: T('aperture diameter, lens extension for this focus', '絞りの直径、このピント位置でのレンズの繰り出し量'), v: tx`\(${fmt(f / N, 1)}\ \mathrm{mm},\ ${fmt(extension(f, s), 2)}\ \mathrm{mm}\)` },
      ], T('Depth of field is not a property of the lens alone: it depends on how large a blur you agree to call sharp. Focus at the hyperfocal distance and everything from half that distance to the horizon is acceptably sharp, which is how fixed-focus cameras work.', '被写界深度はレンズだけで決まる性質ではありません。どれだけのぼけを鮮明とみなすかによって変わります。過焦点距離にピントを合わせると、その半分の距離から地平線まですべてが鮮明に写ります。固定焦点のカメラはこの仕組みを使っています。'));
    },
  };

  /* ================= 2. inside the lens: glass, iris and the sweet spot (3D) ================= */
  function buildLens(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.05;                       // 1 unit = 20 mm
    const CUT = PI * 1.5, T0 = PI * 0.5;                                   // three quarters of each barrel part, opened towards the camera
    const black = S.mat('#17181b', { rough: 0.5, coat: 0.3 }), satin = S.mat('#25272b', { rough: 0.35, coat: 0.5 }), chrome = S.mat('#d5d8dc', { metal: 1, rough: 0.18 }), rubber = S.mat('#1c1c1e', { rough: 0.9, coat: 0 });
    const glass = S.mat('#dff0ff', { glass: true, thickness: 0.35, ior: 1.62, rough: 0.02, opacity: 0.38 });
    const lathe = (pts, mat, full, parent) => { const geo = new TH.LatheGeometry(pts.map((q) => new TH.Vector2(q[1] * K, q[0] * K)), 72, full ? 0 : T0, full ? TAU : CUT).rotateZ(-PI / 2); const m = new TH.Mesh(geo, mat); m.castShadow = mat !== glass; (parent || g).add(m); return m; };
    // optical group: the six elements, their spacers and the iris move together to focus
    const grp = new TH.Group(); g.add(grp);
    for (const [x, R1, R2, t, sd] of ELEMENTS) {
      const pts = [], n = 22;
      for (let i = 0; i <= n; i++) { const r = (sd * i) / n; pts.push([x + sag(R1, r), r]); }
      const e2 = x + t + sag(R2, sd), e1 = x + sag(R1, sd); if (e2 > e1) pts.push([e2, sd]);
      for (let i = n; i >= 0; i--) { const r = (sd * i) / n; pts.push([x + t + sag(R2, r), r]); }
      lathe(pts, glass, true, grp);
    }
    // inner cell holding the elements (stepped black tube), cut open
    lathe([[-24, 16], [-24, 19.5], [22, 19.5], [22, 15], [19.6, 15], [19.6, 14.4], [14, 14.4], [14, 13], [5, 13], [5, 16.5], [-9, 16.5], [-9, 13], [-15, 13], [-15, 15.4], [-22.5, 15.4], [-22.5, 16], [-24, 16]], black, false, grp);
    // iris: seven curved blades; each is the part of a disc of radius RB that lies inside the cell, pushed out to leave the opening
    const iris = new TH.Group(); grp.add(iris);
    const RB = 15, RC = 16.3, blades = [];
    for (let k = 0; k < 7; k++) { const m = new TH.Mesh(new TH.BufferGeometry(), S.mat('#2b2d31', { metal: 0.6, rough: 0.45, side: TH.DoubleSide })); m.rotation.y = PI / 2; m.rotation.x = 0; iris.add(m); blades.push(m); }
    const setIris = (rAp) => {
      blades.forEach((m, k) => {
        const th = (k / 7) * TAU, d = rAp + RB, cx = d * Math.cos(th), cy = d * Math.sin(th), pts = [];
        for (let i = 0; i <= 60; i++) { const a = th + PI + ((i / 60) - 0.5) * 2.2, x = cx + RB * Math.cos(a), y = cy + RB * Math.sin(a); if (Math.hypot(x, y) <= RC) pts.push([x, y]); }
        const a0 = pts.length ? Math.atan2(pts[pts.length - 1][1], pts[pts.length - 1][0]) : th + 0.6, a1 = pts.length ? Math.atan2(pts[0][1], pts[0][0]) : th - 0.6; let da = a1 - a0; while (da > PI) da -= TAU; while (da < -PI) da += TAU;
        for (let i = 1; i < 16; i++) { const a = a0 + (da * i) / 16; pts.push([RC * Math.cos(a), RC * Math.sin(a)]); }
        const pos = [], zc = -1.6 + k * 0.04; let mx = 0, my = 0; for (const q of pts) { mx += q[0]; my += q[1]; } mx /= pts.length; my /= pts.length;
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; pos.push(zc * K, mx * K, my * K, zc * K, p[0] * K, p[1] * K, zc * K, q[0] * K, q[1] * K); }
        m.rotation.set(0, 0, 0); m.geometry.dispose(); m.geometry = new TH.BufferGeometry(); m.geometry.setAttribute('position', new TH.Float32BufferAttribute(pos, 3)); m.geometry.computeVertexNormals();
      });
      S.invalidate();
    };
    // outer barrel: front ring with filter thread, focus ring (ribbed rubber), aperture scale ring, chrome mount
    lathe([[-27, 19.8], [-27, 26], [-18, 26], [-18, 27.5], [8, 27.5], [8, 26.5], [17, 26.5], [17, 25], [24, 25], [24, 19.8], [-27, 19.8]], satin, false);
    for (let i = 0; i < 15; i++) lathe([[-16.8 + i * 1.6, 27.5], [-16.8 + i * 1.6, 28.05], [-15.8 + i * 1.6, 28.05], [-15.8 + i * 1.6, 27.5]], rubber, false);
    lathe([[24, 15.5], [24, 23], [26.5, 23], [26.5, 21], [28.5, 21], [28.5, 19.5], [26.5, 19.5], [26.5, 15.5], [24, 15.5]], chrome, false);
    // image sensor behind the mount (36 x 24 mm) on its board
    const sensor = new TH.Mesh(new TH.BoxGeometry(0.02, 36 * K, 24 * K), S.mat('#3a4a6b', { metal: 0.4, rough: 0.2, coat: 1 })); sensor.position.x = 47 * K; sensor.castShadow = true; g.add(sensor);
    const board = new TH.Mesh(new TH.BoxGeometry(0.03, 46 * K, 32 * K), S.mat('#1f5e3a', { rough: 0.5, coat: 0.5 })); board.position.x = 47 * K + 0.03; board.castShadow = true; g.add(board);
    g.position.z = 1.45; S.add(g);
    return { g, grp, setIris, K };
  }
  D['lens-cutaway'] = {
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
      const f = 50, N = NS[v.N], s = 10 ** v.ls * 1000, ext = extension(f, s), sp = sweetSpot(f), b1 = totalBlur(f, N, false), b6 = totalBlur(f, N, true);
      L.setText(st.cap1, T(tx`A 50 mm lens of the classic six-element double-Gauss form, cut open: two groups of glass either side of the iris, in a cell that slides forward to focus on nearer things, with the sensor behind. The seven curved blades close the opening from \(f/1.4\) to \(f/22\). Rays (gold) from the subject are sketched converging on the sensor.`, tx`古典的な 6 枚構成のダブルガウス型 50 mm レンズの断面です。絞りの両側にガラスの群が二つあり、それを収めた鏡筒の内筒が近くのものにピントを合わせるために前へ繰り出します。後ろにあるのがセンサーです。7 枚の曲がった羽根が、開口を \(f/1.4\) から \(f/22\) まで絞ります。被写体からの光線（金色）がセンサーに集まる様子を模式的に描いています。`));
      L.setText(st.cap2, T(tx`Smallest spot the lens can form at the centre of the picture against aperture. Wide open, spherical surfaces focus the edge of the lens short of its middle (aberration, falling as \(1/N^3\)); stopped far down, the opening itself spreads the light (diffraction, rising as \(N\)). Six elements push the first limit down forty-fold; nothing moves the second. Drag the gold point.`, tx`画面の中心でレンズが作れる最小の点の大きさを、絞りに対して描いています。開放では、球面がレンズの縁を通る光を中心より手前に集めてしまいます（収差、\(1/N^3\) で減少）。大きく絞ると、開口そのものが光を広げます（回折、\(N\) に比例して増加）。6 枚のレンズは一つ目の限界を 40 分の 1 に下げますが、二つ目は何をしても動きません。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const li = (b) => clamp(Math.log10(b * 1000), 0, 3.2);
      const l2 = Math.log2, XA = l2(1.4), XB = l2(22), near = (x) => { let k = 0; NS.forEach((n, i) => { if (Math.abs(l2(n) - x) < Math.abs(l2(NS[k]) - x)) k = i; }); return k; };
      const g = L.fig(st.g2, { x: [XA, XB], y: [0, 3.2], aspect: 0.95, maxH: 430, xlabel: T('aperture (f-number)', '絞り（F 値）'), ylabel: T('spot diameter (µm)', '点の直径（µm）'), ticksX: [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22].map((n) => [l2(n), String(n)]), ticksY: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
      const xs = (fn) => L.sample(XA, XB, 120, (x) => li(fn(2 ** x)));
      g.hline(Math.log10(4), { c: 'muted', dash: '2 4' }); g.text(XB - 0.05, Math.log10(4), T('one 4 µm pixel', '4 µm の画素 1 個'), { small: true, anchor: 'end', dy: -5 });
      g.line(xs((n) => airy(n)), { c: 'c3', w: 1.8, dash: '5 4' }); g.line(xs((n) => totalBlur(f, n, false)), { c: 'c2', w: 2 }); g.line(xs((n) => totalBlur(f, n, true)), { c: 'c1', w: 2.8 });
      g.handle(l2(N), li(b6), { c: 'hl', axis: 'x', bounds: [XA, XB, 0, 3.2], label: T('aperture', '絞り'), onDrag: (x) => ctx.set('N', near(x)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('six-element lens', '6 枚構成のレンズ') }, { c: 'c2', label: T('one spherical element', '球面レンズ 1 枚') }, { c: 'c3', dash: true, label: T(tx`diffraction limit \(2.44\lambda N\)`, tx`回折限界 \(2.44\lambda N\)`) }]);
      ctx.readout([
        { k: T('aperture diameter', '絞りの直径'), v: tx`\(${fmt(f / N, 1)}\ \mathrm{mm}\)` },
        { k: T('spot: one element, six elements', '点の大きさ：1 枚、6 枚'), v: tx`\(${fmt(b1 * 1000, 1)},\ ${fmt(b6 * 1000, 1)}\ \mu\mathrm{m}\)`, tone: 'key' },
        { k: T('sharpest aperture of the six-element lens', '6 枚構成のレンズが最も鮮明な絞り'), v: tx`\(f/${fmt(sp.N, 1)},\ ${fmt(sp.blur * 1000, 1)}\ \mu\mathrm{m}\)`, tone: 'good' },
        { k: T('lens moved forward to focus', 'ピント合わせの繰り出し量'), v: tx`\(${fmt(ext, 2)}\ \mathrm{mm}\)` },
      ], T('Every lens has a sweet spot a few stops down from wide open, where falling aberration meets rising diffraction. Small sensors with tiny pixels reach the diffraction limit sooner, which is why phone cameras do not stop down at all.', 'どのレンズにも、開放から数段絞ったところに最も鮮明な絞りがあります。減っていく収差と増えていく回折が出会う点です。画素の小さい小型センサーは早く回折限界に達するので、スマートフォンのカメラはまったく絞りません。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.85 : 0.72, maxH: 520, camera: [-1.9, -6.4, 4.5], target: [0.5, 0, 1.3], fov: 30,
        label: T('3D cutaway of a camera lens with iris and sensor. Drag to rotate.', '絞りとセンサーをもつカメラレンズの 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.lens = buildLens(S);
          st.rays = S.lines([], { c: 'hl', opacity: 0.85, w: 1.6 });
          S.label(T('iris', '絞り'), [-0.08, 0, 2.45], { small: true }); S.label(T('focus ring', 'ピントリング'), [-0.3, -1.2, 0.35], { small: true }); S.label(T('sensor', 'センサー'), [2.0, 0, 2.5], { small: true }); S.label(T('mount', 'マウント'), [1.35, -1, 0.5], { small: true });
        },
        update(S) {
          const K = st.lens.K, rAp = Math.min(13, (f / N) / 2 * 0.72);      // the iris sits where the beam is narrower than the entrance pupil
          st.lens.setIris(rAp); st.lens.grp.position.x = -ext * K;
          const seg = [], z0 = 1.45, xs = 47 * K, xl = (-1.6 - ext) * K;
          for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, y = rAp * K * Math.cos(a), z = rAp * K * Math.sin(a), m = 1.35; seg.push([[-3.4, y * m * 1.6, z0 + z * m * 1.6], [(-22 - ext) * K, y * m, z0 + z * m]], [[(-22 - ext) * K, y * m, z0 + z * m], [xl, y, z0 + z]], [[xl, y, z0 + z], [xs, 0, z0]]); }
          st.rays.update(seg); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-34, 52], y: [-30, 30], equal: true, maxH: 360, axes: false, grid: false });
          for (const [x, R1, R2, t, sd] of ELEMENTS) { const a = L.sample(-sd, sd, 30, (r) => [x - ext + sag(R1, Math.abs(r)), r]), b = L.sample(sd, -sd, 30, (r) => [x - ext + t + sag(R2, Math.abs(r)), r]); f2.poly([...a, ...b], { c: 'c1', fill: 'c1', fo: 0.2, w: 1.4 }); }
          const ra = Math.min(13, (f / N) / 2 * 0.72); f2.seg([-1.6 - ext, ra], [-1.6 - ext, 16], { c: 'ink', w: 3 }); f2.seg([-1.6 - ext, -ra], [-1.6 - ext, -16], { c: 'ink', w: 3 }); f2.seg([47, -12], [47, 12], { c: 'c3', w: 4 });
        },
      });
    },
  };

  /* ================= 3. autofocus: phase detection and contrast ================= */
  D['phase-detect-af'] = {
    render(ctx, v) {
      const N = NS[v.N], delta = v.d, shift = pdShift(delta, N), b = Math.abs(delta) / N, nu = 10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Some pixels on the sensor are masked so they see only the left half of the lens, others only the right. Out of focus, the two halves form the same picture displaced sideways, here an edge and a stripe. The displacement gives both how far the lens is from focus and in which direction, from a single exposure. Drag the gold point to move the lens.`, tx`センサーの一部の画素は、レンズの左半分だけ、または右半分だけが見えるように遮光されています。ピントが外れると、二つの半分は同じ像を横にずらして作ります。ここでは縁と縞の像です。このずれから、レンズがピントからどれだけ、どちら向きに外れているかが、一回の露光で分かります。金色の点をドラッグしてレンズを動かしてください。`));
      const prof = (x, sgn) => { const u = x - sgn * shift / 2, w = Math.max(0.004, b / 2), e = (t) => 0.5 * (1 + Math.tanh(t / (w * 0.6))); return 0.15 + 0.5 * e(u + 0.06) - 0.5 * e(u - 0.01) + 0.35 * (e(u - 0.07) - e(u - 0.085)) * (1 / (1 + w * 30)); };
      const f = L.fig(c1, { x: [-0.2, 0.2], y: [0, 0.9], aspect: 0.6, maxH: 300, xlabel: T('position on the sensor (mm)', 'センサー上の位置（mm）'), ylabel: T('signal', '信号') });
      f.line(L.sample(-0.2, 0.2, 300, (x) => prof(x, 1)), { c: 'c1', w: 2.3 }); f.line(L.sample(-0.2, 0.2, 300, (x) => prof(x, -1)), { c: 'c2', w: 2.3 });
      if (Math.abs(shift) > 0.004) f.arrow([-shift / 2 - 0.06, 0.82], [shift / 2 - 0.06, 0.82], { c: 'ink', w: 1.6 });
      f.text(-0.06, 0.82, tx`\(${fmt(shift * 1000, 0)}\ \mu\mathrm{m}\)`, { small: true, dy: -8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Contrast of fine detail (10 line pairs per mm) against the sensor’s distance from true focus. Contrast detection has only this curve: it must step the lens, see whether contrast rose, and step again, passing the peak to be sure of it. Phase detection reads the offset directly and moves there in one go.`, tx`センサーが真のピント位置からずれた距離に対する、細かい模様（1 mm あたり 10 本）のコントラストです。コントラスト検出が使えるのはこの曲線だけです。レンズを少し動かし、コントラストが上がったかどうかを見て、また動かし、頂上を一度通り過ぎて確かめなければなりません。位相差検出はずれを直接読み取り、一回でそこへ動きます。`));
      const g = L.fig(c2, { x: [-1.5, 1.5], y: [0, 1.05], aspect: 0.6, maxH: 300, xlabel: T('sensor distance from focus (mm)', 'ピント位置からのセンサーのずれ（mm）'), ylabel: T('contrast', 'コントラスト') });
      g.line(L.sample(-1.5, 1.5, 300, (x) => contrast(nu, Math.abs(x) / N)), { c: 'c3', w: 2.6 });
      const steps = []; { let x = -1.3, st = 0.2, best = 0, prev = 0; for (let i = 0; i < 24 && Math.abs(st) > 0.02; i++) { const c = contrast(nu, Math.abs(x) / N); steps.push(x); if (c > best) best = c; if (best > 0.3 && c < prev) { st = -st / 2; } prev = c; x += st; } }
      steps.forEach((q, i) => { g.dot(q, contrast(nu, Math.abs(q) / N), { c: 'c4', r: 3.4 }); if (i) g.seg([steps[i - 1], contrast(nu, Math.abs(steps[i - 1]) / N)], [q, contrast(nu, Math.abs(q) / N)], { c: 'c4', w: 1.1, dash: '3 3' }); });
      g.handle(delta, contrast(nu, b), { c: 'hl', axis: 'x', bounds: [-1.5, 1.5, 0, 1.05], label: T('lens position', 'レンズの位置'), onDrag: (xx) => ctx.set('d', clamp(Math.round(xx * 50) / 50, -1.5, 1.5)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('pixels seeing the left half of the lens', 'レンズの左半分を見る画素') }, { c: 'c2', label: T('pixels seeing the right half', '右半分を見る画素') }, { c: 'c3', label: T('contrast of fine detail', '細かい模様のコントラスト') }, { c: 'c4', kind: 'dot', label: T('contrast-detection steps', 'コントラスト検出の探索') }]);
      ctx.readout([
        { k: T('blur disc', 'ぼけの円'), v: tx`\(${fmt(b * 1000, 0)}\ \mu\mathrm{m}\)` },
        { k: T(tx`displacement between the two images \(0.424\,\delta/N\)`, tx`二つの像のずれ \(0.424\,\delta/N\)`), v: tx`\(${fmt(shift * 1000, 1)}\ \mu\mathrm{m}\)`, tone: 'key' },
        { k: T('which way to move', '動かす向き'), v: Math.abs(delta) < 0.01 ? T('in focus', '合焦') : delta > 0 ? T('lens is too far forward: pull back', 'レンズが前に出すぎ：引く') : T('lens is too far back: push out', 'レンズが後ろすぎ：繰り出す') },
        { k: T('contrast detection needed', 'コントラスト検出に必要な回数'), v: T(`${steps.length} measurements`, `${steps.length} 回の測定`) },
      ], T('A wide aperture makes phase detection more sensitive, since the two halves of the lens are further apart, which is why cameras focus with the lens wide open and stop down only for the exposure.', '絞りを開くほど、レンズの二つの半分が離れるので、位相差検出の感度は高くなります。カメラが開放でピントを合わせ、露光のときだけ絞るのはそのためです。'));
    },
  };
})();
