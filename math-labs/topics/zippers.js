'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180;

  /* ---------------- models (no DOM) ----------------
   * Path of one chain through the slider: straight below the throat, then turning smoothly through the half-angle
   * psi over an arc length LS, then straight. chainPath gives the sideways offset, the height and the tilt.
   * Wedge: closing two tapes that each resist with a sideways force N through faces at half-angle alpha with
   * friction mu needs a pull F = 2 N tan(alpha + phi), phi = atan(mu). Left alone, the same sideways force drives
   * the slider back with 2 N tan(alpha - phi), which is zero when alpha <= phi.
   * Interlock: teeth of length Lt at pitch P on a tape bent to radius R open at their tips by P Lt / R. A head
   * with a bump of height b can leave or enter only when that reaches b, so R_crit = P Lt / b.
   */
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  function chainPath(u, psi, LS = 1.4) { if (u <= 0) return { x: 0, z: u, a: 0 }; const n = 60, um = Math.min(u, LS); let x = 0, z = 0; for (let i = 0; i < n; i++) { const a = psi * smooth(((i + 0.5) / n) * um / LS); x += Math.sin(a) * (um / n); z += Math.cos(a) * (um / n); } if (u > LS) { x += Math.sin(psi) * (u - LS); z += Math.cos(psi) * (u - LS); } return { x, z, a: psi * smooth(u / LS) }; }
  const phiF = (mu) => Math.atan(mu);
  const pullForce = (N, alphaDeg, mu) => 2 * N * Math.tan(rad(alphaDeg) + phiF(mu));
  const backForce = (N, alphaDeg, mu) => Math.max(0, 2 * N * Math.tan(rad(alphaDeg) - phiF(mu)));
  const sliderLen = (overlap, alphaDeg) => overlap / Math.tan(rad(alphaDeg));
  const tipOpening = (P, Lt, R) => (P * Lt) / R;
  const critRadius = (P, Lt, b) => (P * Lt) / b;
  const teethPer = (P, length) => (2 * length) / P;
  const M = { smooth, chainPath, phiF, pullForce, backForce, sliderLen, tipOpening, critRadius, teethPer };
  (window.LabModels = window.LabModels || {}).zippers = M;

  /* ================= 1. teeth and slider (3D) ================= */
  const PT = 0.8, NT = 13, PSI = rad(27);
  function buildZip(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // 1 unit = 5 mm, chain runs up +z, face toward -y
    const brass = S.mat('#c9a04a', { metal: 1, rough: 0.3 }), steel = S.mat('#c8ccd2', { metal: 1, rough: 0.25 }), ghost = S.mat('#c8ccd2', { metal: 1, rough: 0.25, opacity: 0.28 }), cloth = S.mat('#27385a', { rough: 0.95, coat: 0, side: 2 });
    const teeth = [];
    for (const side of [-1, 1]) for (let i = 0; i < NT; i++) { const t = new TH.Group(); const body = new TH.Mesh(new TH.BoxGeometry(1.0, 0.42, 0.34), brass); body.position.x = -side * 0.18; body.castShadow = true; const head = new TH.Mesh(new TH.SphereGeometry(0.17, 16, 10), brass); head.scale.set(1.25, 0.9, 0.9); head.position.set(-side * 0.5, 0, 0.2); const legs = new TH.Mesh(new TH.BoxGeometry(0.42, 0.5, 0.36), brass); legs.position.x = side * 0.42; t.add(body, head, legs); g.add(t); teeth.push({ t, side, a0: i * PT + (side > 0 ? PT / 2 : 0) }); }
    const tapes = [-1, 1].map((side) => { const n = 48, geo = new TH.BufferGeometry(), pos = new Float32Array((n + 1) * 2 * 3), idx = []; for (let i = 0; i < n; i++) { const a = i * 2; if (side > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } geo.setAttribute('position', new TH.BufferAttribute(pos, 3)); { const nr = new Float32Array((n + 1) * 2 * 3); for (let i = 0; i < (n + 1) * 2; i++) nr[i * 3 + 1] = -1; geo.setAttribute('normal', new TH.BufferAttribute(nr, 3)); } geo.setIndex(idx); const m = new TH.Mesh(geo, cloth); m.receiveShadow = true; g.add(m); return { side, geo, pos, n }; });
    // slider: back plate, see-through front plate, the wedge between the arms, and a pull tab
    const sl = new TH.Group(); g.add(sl);
    const outline = [[-0.85, -1.0], [0.85, -1.0], [0.95, 0], [1.75, 1.45], [0.5, 1.45], [0, 0.8], [-0.5, 1.45], [-1.75, 1.45], [-0.95, 0]];
    const plate = (y, mat) => { const m = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape(outline.map((q) => new TH.Vector2(q[0], q[1]))), { depth: 0.1, bevelEnabled: false }).rotateX(PI / 2), mat); m.position.y = y; m.castShadow = true; sl.add(m); };
    plate(0.42, steel); plate(-0.32, ghost);
    { const w = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape([[0, 0.62], [0.42, 1.45], [-0.42, 1.45]].map((q) => new TH.Vector2(q[0], q[1]))), { depth: 0.64, bevelEnabled: false }).rotateX(PI / 2), steel); w.position.y = 0.32; sl.add(w); }
    for (const s of [-1, 1]) { const f = new TH.Mesh(new TH.BoxGeometry(0.08, 0.84, 1.0), steel); f.position.set(s * 0.9, 0, -0.5); sl.add(f); }
    { const tab = new TH.Mesh(new TH.BoxGeometry(0.55, 0.08, 1.7), steel); tab.position.set(0, -0.52, -0.75); tab.castShadow = true; sl.add(tab); const lug = new TH.Mesh(new TH.BoxGeometry(0.3, 0.2, 0.3), steel); lug.position.set(0, -0.45, 0.1); sl.add(lug); }
    S.add(g);
    return { teeth, tapes, sl };
  }
  D['zipper-teeth'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const zs = 1 + 7.5 * v.pos, closed = Math.floor(zs / (PT / 2)); st.zs = zs;
      L.setText(st.cap1, T(tx`A metal zipper with the front plate of its slider made see-through. Each tooth is clamped to the edge of a cloth tape and carries a bump on its upper face and a matching hollow beneath. Inside the slider the two rows are steered together down a Y-shaped channel: each tooth arrives tilted, drops its head into the gap that has just opened between two teeth of the other row, and is straightened as the channel narrows.`, tx`スライダーの前の板を透明にした、金属のファスナーです。それぞれの務歯（エレメント）は布のテープの縁に固定され、上の面に突起、下の面にそれに合うくぼみがあります。スライダーの中で、二つの列は Y 字形の通路に沿って導かれます。それぞれの務歯は傾いて入り、反対側の列の二つの務歯の間にちょうど開いたすき間に頭を入れ、通路が狭くなるにつれてまっすぐになります。`));
      L.setText(st.cap2, T(tx`The path of the two rows of teeth, seen from the front. Below the slider they share one line; inside it each row curves away, and above it they run straight at \(${fmt((PSI * 180) / PI, 0)}\)° to the closed chain. Drag the gold point to run the slider up and down.`, tx`二つの務歯の列がたどる道を、正面から見た図です。スライダーの下では一本の線を共有し、スライダーの中ではそれぞれの列が曲がって離れ、その上では、閉じた列に対して \(${fmt((PSI * 180) / PI, 0)}\)° でまっすぐ進みます。金色の点をドラッグして、スライダーを上下に動かしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [-30, 30], y: [0, 55], aspect: 1.0, maxH: 420, equal: true, xlabel: T('across the zipper (mm)', 'ファスナーの幅方向（mm）'), ylabel: T('height (mm)', '高さ（mm）') });
      for (const s of [-1, 1]) g.line(L.sample(0, 11, 80, (a) => 0).map((_, i) => { const a = (11 * i) / 79, p = chainPath(a - zs, PSI); return [s * p.x * 5, (zs + p.z) * 5]; }), { c: s < 0 ? 'c1' : 'c2', w: 2.6 });
      g.rect(-9, (zs - 1) * 5, 18, 12.2, { c: 'muted', fill: 'grid', fo: 0.35, w: 1.2 });
      g.handle(0, zs * 5, { c: 'hl', axis: 'y', bounds: [-30, 30, 5, 42.5], label: T('slider', 'スライダー'), onDrag: (x, y) => ctx.set('pos', clamp(Math.round(((y / 5 - 1) / 7.5) * 50) / 50, 0, 1)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('left row', '左の列') }, { c: 'c2', label: T('right row', '右の列') }, { c: 'muted', label: T('slider', 'スライダー') }]);
      ctx.readout([
        { k: T('teeth locked together below the slider', 'スライダーの下でかみ合っている務歯'), v: tx`\(${closed}\)`, tone: 'key' },
        { k: T('pitch along the closed chain', '閉じた列での間隔'), v: tx`\(${fmt((PT / 2) * 5, 1)}\ \mathrm{mm}\)` },
        { k: T('pitch along each tape', 'それぞれのテープ上の間隔'), v: tx`\(${fmt(PT * 5, 1)}\ \mathrm{mm}\)` },
        { k: T('each row is turned through', 'それぞれの列が曲がる角度'), v: tx`\(${fmt((PSI * 180) / PI, 0)}^\circ\)` },
      ], T('Nothing in the slider squeezes the teeth shut. It only brings them to the right place at the right tilt, one after another, and the shape of the teeth does the locking.', 'スライダーは、務歯を締め付けているわけではありません。務歯を一つずつ、正しい位置に正しい傾きで運ぶだけで、かみ合わせは務歯の形が行います。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.15 : 1.05, maxH: 640, camera: [5, -23, 8.5], target: [0, 0, 5.3], fov: 30,
        label: T('3D zipper with a see-through slider. Drag to rotate.', '透明なスライダーの付いたファスナーの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.zp = buildZip(S);
          const draw = () => { const m = st.zp, z0 = st.zs; m.sl.position.z = z0;
            for (const q of m.teeth) { const p = chainPath(q.a0 - z0, PSI); q.t.position.set(q.side * p.x, 0, z0 + p.z); q.t.rotation.y = q.side * p.a; }
            for (const tp of m.tapes) { for (let i = 0; i <= tp.n; i++) { const a = -0.6 + (11.4 * i) / tp.n, p = chainPath(a - z0, PSI), nx = Math.cos(p.a), nz = -Math.sin(p.a), cx = tp.side * p.x, cz = z0 + p.z; for (let k = 0; k < 2; k++) { const off = k ? 3.0 : 0.45, j = (i * 2 + k) * 3; tp.pos[j] = cx + tp.side * nx * off; tp.pos[j + 1] = 0.05; tp.pos[j + 2] = cz + nz * off; } } tp.geo.attributes.position.needsUpdate = true; tp.geo.computeBoundingSphere(); } };
          st.draw = draw; draw();
          st.l1 = S.label(T('slider', 'スライダー'), [4.6, 0, st.zs], { small: true }); S.label(T('tape', 'テープ'), [-4.6, 0, 1.2], { small: true }); S.label(T('teeth', '務歯'), [4.4, 0, 0.4], { small: true });
        },
        update(S) { st.draw(); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); },
      });
    },
  };

  /* ================= 2. the slider is a wedge ================= */
  D['slider-wedge'] = {
    render(ctx, v) {
      const F = pullForce(v.N, v.al, v.mu), B = backForce(v.N, v.al, v.mu), ph = (phiF(v.mu) * 180) / PI, len = sliderLen(3, v.al);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Force on the slider against the half-angle of its Y, with each tape pulling sideways at \(${fmt(v.N, 0)}\) N where the rows meet. Blue is the pull needed to close the zipper. Red is the push the tapes give the slider back down when it is let go: below \(${fmt(ph, 1)}\)°, the angle of friction, there is none and the slider stays where it is left. Drag the gold point.`, tx`スライダーにかかる力を、Y 字の半角に対して描いています。列が出会うところで、それぞれのテープが横に \(${fmt(v.N, 0)}\) N で引いている場合です。青は、ファスナーを閉じるのに必要な引く力です。赤は、スライダーを離したときに、テープがスライダーを押し戻す力です。摩擦角である \(${fmt(ph, 1)}\)° より小さいと、この力はなく、スライダーは離した位置にとどまります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [5, 50], y: [0, 100], aspect: 0.7, maxH: 350, xlabel: T('half-angle of the Y (degrees)', 'Y 字の半角（度）'), ylabel: T('force on the slider (N)', 'スライダーにかかる力（N）') });
      a.vline(ph, { c: 'muted', dash: '5 4' }); a.line(L.sample(5, 50, 90, (q) => Math.min(100, pullForce(v.N, q, v.mu))), { c: 'c1', w: 2.8 }); a.line(L.sample(5, 50, 90, (q) => Math.min(100, backForce(v.N, q, v.mu))), { c: 'c2', w: 2.4 });
      a.handle(v.al, Math.min(100, F), { c: 'hl', axis: 'x', bounds: [5, 50, 0, 100], label: T('half-angle', '半角'), onDrag: (x) => ctx.set('al', clamp(Math.round(x), 5, 50)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Length of slider needed to bring the rows together through 3 mm of overlap. A narrow Y is easy to pull and holds its place, but it has to be long; a wide one is short and stiff and slides open by itself. Real sliders sit near 25 to 30 degrees and add a small catch to stop them creeping.`, tx`3 mm の重なりを通して列を合わせるのに必要な、スライダーの長さです。狭い Y 字は引きやすく、その場にとどまりますが、長くなければなりません。広い Y 字は短くて済みますが、動きが重く、ひとりでに開いてしまいます。実際のスライダーは 25° から 30° の付近にあり、ずり下がりを防ぐ小さな爪が付いています。`));
      const b = L.fig(c2, { x: [5, 50], y: [0, 35], aspect: 0.7, maxH: 350, xlabel: T('half-angle of the Y (degrees)', 'Y 字の半角（度）'), ylabel: T('length of the arms (mm)', '腕の長さ（mm）') });
      b.line(L.sample(5, 50, 90, (q) => Math.min(35, sliderLen(3, q))), { c: 'c3', w: 2.8 }); b.dot(v.al, Math.min(35, len), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('pull to close', '閉じるために引く力') }, { c: 'c2', label: T('push back when released', '離したときに押し戻す力') }, { c: 'muted', dash: true, label: T('angle of friction', '摩擦角') }, { c: 'c3', label: T('length needed', '必要な長さ') }]);
      ctx.readout([
        { k: T('angle of friction', '摩擦角'), v: tx`\(${fmt(ph, 1)}^\circ\)` },
        { k: T('pull needed to close', '閉じるために引く力'), v: tx`\(${fmt(F, 1)}\ \mathrm{N}\)`, tone: 'key' },
        { k: T('closing force gained per newton of pull', '引く力 1 N あたりの閉じる力'), v: tx`\(${fmt((2 * v.N) / F, 2)}\ \mathrm{N}\)` },
        { k: T('push back on a free slider', '離したスライダーを押し戻す力'), v: tx`\(${fmt(B, 1)}\ \mathrm{N}\)`, tone: B > 0 ? 'warn' : 'good' },
        { k: T('arms must be', '必要な腕の長さ'), v: tx`\(${fmt(len, 1)}\ \mathrm{mm}\)` },
      ], T(B > 0 ? 'The Y is wider than the angle of friction, so a sideways pull on the tapes pushes the slider down. Without a catch this zipper works itself open.' : 'The Y is narrower than the angle of friction: however hard the tapes are pulled apart, the slider does not move. The zipper is self-locking.', B > 0 ? 'Y 字が摩擦角より広いので、テープを横に引くとスライダーが押し下げられます。爪がなければ、このファスナーはひとりでに開いていきます。' : 'Y 字が摩擦角より狭いので、テープをどれほど強く引き離しても、スライダーは動きません。このファスナーは自分で止まります。'));
    },
  };

  /* ================= 3. why closed teeth hold ================= */
  D['tooth-interlock'] = {
    render(ctx, v) {
      const open = tipOpening(v.P, v.Lt, v.R), rc = critRadius(v.P, v.Lt, v.b), free = open >= v.b, per = teethPer(v.P, 100);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`One row of teeth on a tape bent to a radius of \(${fmt(v.R, 0)}\) mm, drawn to scale. Bending the tape fans the teeth out, so the gaps between them are wider at the tips than at the tape. A tooth from the other row (red) needs the gap to grow by the height of its bump, \(${fmt(v.b, 2)}\) mm, before its head can pass in or out.`, tx`半径 \(${fmt(v.R, 0)}\) mm に曲げたテープ上の、一列の務歯を縮尺どおりに描いています。テープを曲げると務歯が扇形に広がるので、務歯の間のすき間は、テープ側より先端側で広くなります。反対側の列の務歯（赤）は、すき間が突起の高さ \(${fmt(v.b, 2)}\) mm だけ広がらないと、頭を出し入れできません。`));
      const span = 4 * v.P, a = L.fig(c1, { x: [-span * 0.75, span * 0.75], y: [-2, v.Lt + 6], equal: true, aspect: 0.75, maxH: 360, axes: false, grid: false });
      const w = v.P * 0.42; for (let k = -2; k <= 2; k++) { const th = (k * v.P) / v.R, c = Math.cos(th), s = Math.sin(th), base = [v.R * s, v.R * c - v.R], q = (dx, dy) => [base[0] + dx * c + dy * s, base[1] - dx * s + dy * c]; a.poly([q(-w / 2, 0), q(w / 2, 0), q(w / 2, v.Lt), q(-w / 2, v.Lt)], { c: 'c1', fill: 'c1', fo: 0.35, w: 1.4 }); a.circle(q(0, v.Lt * 0.72)[0], q(0, v.Lt * 0.72)[1] , Math.max(0.15, v.b * 0.6), { c: 'c1', fill: 'c1', fo: 0.8, w: 0 }); }
      a.line(L.sample(-0.9, 0.9, 40, (u) => 0).map((_, i) => { const th = ((-2.6 + (5.2 * i) / 39) * v.P) / v.R; return [v.R * Math.sin(th), v.R * Math.cos(th) - v.R]; }), { c: 'ink', w: 2.4 });
      { const th = (0.5 * v.P) / v.R, c = Math.cos(th), s = Math.sin(th), lift = free ? v.Lt * 0.9 : 0, q = (dx, dy) => [v.R * s + dx * c + dy * s, v.R * c - v.R - dx * s + dy * c]; a.poly([q(-w / 2, v.Lt * 0.3 + lift), q(w / 2, v.Lt * 0.3 + lift), q(w / 2, v.Lt * 1.3 + lift), q(-w / 2, v.Lt * 1.3 + lift)], { c: 'c2', fill: 'c2', fo: free ? 0.2 : 0.45, w: 1.4 }); }
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How much the gap at the tips widens against the radius of the bend. Laid flat, or curved as gently as cloth on a body curves, the teeth stay locked. Only a bend tighter than \(${fmt(rc, 0)}\) mm lets them go, and the one place a zipper is bent that tightly is inside its slider. Drag the gold point.`, tx`先端でのすき間の広がりを、曲げの半径に対して描いています。平らに置いたとき、あるいは体に沿う布のように緩やかに曲がっているとき、務歯はかみ合ったままです。\(${fmt(rc, 0)}\) mm よりきつく曲げたときだけ外れます。ファスナーがそこまできつく曲げられるのは、スライダーの中だけです。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [5, 100], y: [0, 2], aspect: 0.75, maxH: 360, xlabel: T('radius of the bend (mm)', '曲げの半径（mm）'), ylabel: T('gap widens by (mm)', 'すき間の広がり（mm）') });
      b.hline(v.b, { c: 'c2', dash: '5 4' }); b.line(L.sample(5, 100, 120, (q) => Math.min(2, tipOpening(v.P, v.Lt, q))), { c: 'c1', w: 2.8 }); if (rc <= 100 && rc >= 5) b.vline(rc, { c: 'muted', dash: '3 3' });
      b.handle(v.R, Math.min(2, open), { c: 'hl', axis: 'x', bounds: [5, 100, 0, 2], label: T('radius of the bend', '曲げの半径'), onDrag: (x) => ctx.set('R', clamp(Math.round(x), 5, 100)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('teeth on the bent tape; widening', '曲げたテープ上の務歯、広がり') }, { c: 'c2', label: T('tooth of the other row; height of its bump', '反対側の務歯、突起の高さ') }]);
      ctx.readout([
        { k: T('gap at the tips widens by', '先端でのすき間の広がり'), v: tx`\(${fmt(open, 2)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('the other row', '反対側の列'), v: T(free ? 'can pass in and out' : 'is locked in', free ? '出入りできる' : 'かみ合ったまま'), tone: free ? 'warn' : 'good' },
        { k: T('tightest bend that stays locked', 'かみ合いを保てる最もきつい曲げ'), v: tx`\(${fmt(rc, 0)}\ \mathrm{mm}\)` },
        { k: T('teeth in 10 cm of closed zipper', '閉じたファスナー 10 cm の務歯の数'), v: tx`\(${fmt(per, 0)}\)` },
        { k: T('each carries, of 200 N across 10 cm', '10 cm に 200 N かかるときの、1 個あたりの力'), v: tx`\(${fmt(200 / per, 1)}\ \mathrm{N}\)` },
      ], T('Pulling the tapes apart cannot open the gaps, because it does not bend the tape. That is why a closed zipper fails by tearing a tooth off its tape, not by unlocking.', 'テープを引き離しても、テープは曲がらないので、すき間は開きません。閉じたファスナーが、かみ合いが外れるのではなく、務歯がテープからちぎれることで壊れるのはこのためです。'));
    },
  };
})();
